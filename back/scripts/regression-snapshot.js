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

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
const option = name => {
    const index = process.argv.indexOf(name)
    return index < 0 ? null : process.argv[index + 1]
}

async function main() {
    const out = option('--out')
    if (!out) throw new Error('--out <file> is required')
    const build = spawnSync(process.execPath, ['build.js'], { cwd: BACK, encoding: 'utf8' })
    if (build.status !== 0) throw new Error(build.stderr || build.stdout)
    await fse.emptyDir(OUT)
    await fse.copy(path.join(BACK, 'dist/knowledge'), path.join(OUT, 'knowledge'))
    await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'node', target: 'es2020', outfile: path.join(OUT, 'index.js'), external: Object.keys(dependencies), tsconfig: path.join(BACK, 'tsconfig.json'), absWorkingDir: BACK, logLevel: 'error' })
    const run = spawnSync(process.execPath, [path.join(OUT, 'index.js')], { cwd: OUT, encoding: 'utf8', timeout: 240000, env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'placeholder-not-a-key', ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'placeholder-not-a-key' } })
    const line = (run.stdout || '').split(/\r?\n/).find(value => value.startsWith('PROBE-JSON'))
    if (!line) throw new Error(run.stderr || run.stdout || 'probe did not print PROBE-JSON')
    fs.writeFileSync(path.resolve(BACK, out), `${JSON.stringify(canonical(JSON.parse(line.slice('PROBE-JSON'.length))), null, 2)}\n`)
    await fse.remove(OUT)
}

main().catch(error => {
    console.error(error instanceof Error ? error.stack : error)
    process.exit(1)
})
