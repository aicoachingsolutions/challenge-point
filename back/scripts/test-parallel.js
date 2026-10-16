const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')

// npm test (parallel), npm run test:serial (one file at a time), npm run test:parallel (alias of npm test).
// The ORDERED list of back-end unit files is back/scripts/unit-tests.json: a new .unit.ts file is registered THERE,
// not in package.json. Until 18 October 2026 the list was the package.json "test" script itself, one &&-chain of
// ts-node commands; at 9470 characters it was over cmd.exe's 8191-character command-line limit, so `npm test` on
// Windows failed in a second ("The command line is too long.") before running anything (broken since 14 October).
const BACK = path.resolve(__dirname, '..')
const UNIT_TESTS = path.join(__dirname, 'unit-tests.json')

// Filled only by files whose results differ between serial and parallel evidence runs.
const ISOLATE = []

function parseArgs(args) {
    const options = {
        jobs: Math.max(1, os.cpus().length - 2),
        out: null,
        timeoutMs: 600000,
    }

    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        if (arg === '--serial') {
            options.jobs = 1
        } else if (arg === '--jobs' || arg === '--timeout' || arg === '--out') {
            const value = args[++i]
            if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value`)
            if (arg === '--out') {
                options.out = value
            } else {
                const number = Number(value)
                if (!Number.isFinite(number) || number <= 0 || !Number.isInteger(number)) throw new Error(`${arg} must be a positive integer`)
                if (arg === '--jobs') options.jobs = number
                if (arg === '--timeout') options.timeoutMs = number * 1000
            }
        } else {
            throw new Error(`unknown option: ${arg}`)
        }
    }

    return options
}

function testFiles() {
    let files
    try {
        files = JSON.parse(fs.readFileSync(UNIT_TESTS, 'utf8'))
    } catch (error) {
        throw new Error(`cannot read ${path.relative(BACK, UNIT_TESTS)}: ${error.message}`)
    }
    if (!Array.isArray(files) || !files.length) throw new Error(`${path.relative(BACK, UNIT_TESTS)} must be a non-empty array of unit file paths`)

    // Every file runs through the one command commandFor builds, so an entry can only name a file: a ./src/ path to an
    // existing .unit.ts, no flags, no spaces, listed once. Anything else is refused rather than run differently or skipped.
    const seen = new Set()
    return files.map(file => {
        if (typeof file !== 'string' || !/^\.\/src\/\S+\.unit\.ts$/.test(file)) throw new Error(`not a ./src/... .unit.ts path: ${JSON.stringify(file)}`)
        if (seen.has(file)) throw new Error(`listed twice: ${file}`)
        seen.add(file)
        if (!fs.statSync(path.resolve(BACK, file), { throwIfNoEntry: false })?.isFile()) throw new Error(`listed test file does not exist: ${file}`)
        return file
    })
}

function commandFor(file) {
    return {
        command: process.execPath,
        args: [path.join(BACK, 'node_modules', 'ts-node', 'dist', 'bin.js'), '--files', '-r', 'tsconfig-paths/register', file],
    }
}

function killTree(pid) {
    if (!pid) return
    if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    }
}

function runFile(file, timeoutMs) {
    return new Promise(resolve => {
        const started = Date.now()
        const { command, args } = commandFor(file)
        const child = spawn(command, args, { cwd: BACK, shell: false, windowsHide: true })
        let stdout = ''
        let stderr = ''
        let timedOut = false
        let spawnError = null
        let settled = false
        const finish = code => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            resolve({
                file,
                code,
                elapsedMs: Date.now() - started,
                stdout,
                stderr,
                timedOut,
                spawnError,
            })
        }
        const timer = setTimeout(() => {
            timedOut = true
            killTree(child.pid)
            child.kill()
        }, timeoutMs)

        child.stdout.setEncoding('utf8')
        child.stderr.setEncoding('utf8')
        child.stdout.on('data', chunk => {
            stdout += chunk
        })
        child.stderr.on('data', chunk => {
            stderr += chunk
        })
        child.on('error', error => {
            spawnError = error
            finish(null)
        })
        child.on('close', finish)
    })
}

async function runPool(files, jobs, timeoutMs) {
    const results = []
    let next = 0
    const worker = async () => {
        while (next < files.length) {
            const file = files[next++]
            results.push(await runFile(file, timeoutMs))
        }
    }
    await Promise.all(Array.from({ length: Math.min(jobs, files.length) }, worker))
    return results
}

function lastLines(result) {
    const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n')
    return output ? output.split(/\r?\n/).slice(-80) : []
}

function resultLine(result) {
    const verdict = result.code === 0 && !result.timedOut && !result.spawnError ? 'PASS' : 'FAIL'
    return `${verdict} ${(result.elapsedMs / 1000).toFixed(1)}s ${result.file}`
}

async function main() {
    const options = parseArgs(process.argv.slice(2))
    const files = testFiles()
    const isolated = new Set(ISOLATE.map(entry => entry.file))
    const parallel = files.filter(file => !isolated.has(file))
    const results = [
        ...(await runPool(parallel, options.jobs, options.timeoutMs)),
        ...(await runPool(ISOLATE.map(entry => entry.file), 1, options.timeoutMs)),
    ]
    const byFile = new Map(results.map(result => [result.file, result]))
    const ordered = files.map(file => byFile.get(file))
    const failed = ordered.filter(result => result.code !== 0 || result.timedOut || result.spawnError)
    const report = []

    for (const result of ordered) report.push(resultLine(result))
    for (const result of failed) {
        report.push(`\nFAILURE OUTPUT ${result.file}`)
        if (result.timedOut) report.push(`timeout after ${(options.timeoutMs / 1000).toFixed(0)}s`)
        if (result.spawnError) report.push(`spawn error: ${result.spawnError.message}`)
        report.push(...lastLines(result))
    }
    if (ISOLATE.length) {
        report.push('\nISOLATE')
        for (const entry of ISOLATE) report.push(`${entry.file}  ${entry.why}`)
    }
    report.push(`FILES ${files.length}  FAILED ${failed.length}`)

    const text = `${report.join('\n')}\n`
    process.stdout.write(text)
    if (options.out) fs.writeFileSync(path.resolve(options.out), text)
    if (failed.length) process.exitCode = 1
}

main().catch(error => {
    console.error(error.message)
    process.exitCode = 2
})
