// npm run snapshot -- --out <file>
// Builds the deployment bundle's knowledge (node build.js), bundles src/scripts/regression-snapshot.entry.ts with
// build.js's own esbuild options beside that knowledge, runs it, and writes its snapshot canonically (keys sorted
// recursively, arrays in their own order). A run that errors, times out or tries the network writes nothing.
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const esbuild = require('esbuild')
const fse = require('fs-extra')
const { dependencies } = require('../package.json')

const BACK = path.resolve(__dirname, '..')
const OUT = path.join(BACK, '.regression-snapshot')
const ENTRY = path.join(BACK, 'src/scripts/regression-snapshot.entry.ts')
const VOLATILE = [] // No fields are normalized: two probe runs must be byte-for-byte equivalent after canonical ordering.
// The probe prints the whole snapshot as one line; spawnSync's default 1 MB buffer would cut it off as goals grow.
const MAX_BUFFER = 1024 * 1024 * 1024

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
const option = name => {
    const index = process.argv.indexOf(name)
    return index < 0 ? null : process.argv[index + 1]
}

async function main() {
    const out = option('--out')
    if (!out) throw new Error('--out <file> is required')
    // Resolved against the directory the command runs in (npm run sets it to back/), as any CLI path is.
    const target = path.resolve(process.cwd(), out)
    const build = spawnSync(process.execPath, ['build.js'], { cwd: BACK, encoding: 'utf8', maxBuffer: MAX_BUFFER })
    if (build.status !== 0) throw new Error(build.stderr || build.stdout || String(build.error))
    try {
        await fse.emptyDir(OUT)
        await fse.copy(path.join(BACK, 'dist/knowledge'), path.join(OUT, 'knowledge'))
        await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'node', target: 'es2020', outfile: path.join(OUT, 'index.js'), external: Object.keys(dependencies), tsconfig: path.join(BACK, 'tsconfig.json'), absWorkingDir: BACK, logLevel: 'error' })
        // The router constructs its generation client at module load and that constructor wants a key to be PRESENT.
        // The client is stubbed before any route runs, so a placeholder is given and never sent anywhere.
        const env = { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'placeholder-not-a-key', ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'placeholder-not-a-key' }
        const run = spawnSync(process.execPath, [path.join(OUT, 'index.js')], { cwd: OUT, encoding: 'utf8', timeout: 240000, maxBuffer: MAX_BUFFER, env })
        const line = (run.stdout || '').split(/\r?\n/).find(value => value.startsWith('PROBE-JSON'))
        if (!line) throw new Error(`probe did not print PROBE-JSON (status ${run.status}, ${run.error || 'no spawn error'})\n${run.stderr || run.stdout}`)
        const snapshot = JSON.parse(line.slice('PROBE-JSON'.length))
        if (snapshot.error) throw new Error(`probe failed part-way; nothing written\n${snapshot.error}`)
        if (snapshot.refusedConnections.length) throw new Error(`probe tried the network; nothing written: ${snapshot.refusedConnections.join(', ')}`)
        if (run.status !== 0) throw new Error(`probe exited ${run.status} (${run.error || run.signal}); nothing written\n${run.stderr}`)
        fs.writeFileSync(target, `${JSON.stringify(canonical(snapshot), null, 2)}\n`)
        console.log(`snapshot: ${Object.keys(snapshot).length} top-level keys written to ${target}`)
    } finally {
        // Removed whatever happened, so a failed run leaves no stale bundle behind.
        await fse.remove(OUT)
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.stack : error)
    process.exit(1)
})
