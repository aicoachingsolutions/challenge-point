/**
 * What the production build bundles, read from esbuild's own metafile (fix F of the A02 package, after verifications V1 and V2, 12 November 2026).
 *
 * Christian, received 11 November 2026, second reply: "What automated safeguard could have detected this problem before it affected another
 * activity?" Stage W6 classified the package's identifiers with a scratch scan that walked relative import specifiers only, so a module reached
 * through a baseUrl specifier ('src/...') was skipped without being counted (verification V2, 7a), and the scan was not a registered test. This
 * test asks the bundler itself: back/src/index.ts bundled with build.js's own options (entry, bundle, platform, target, external = the
 * package's dependencies, tsconfig), nothing written, and the bundle's inputs read from esbuild's metafile, the production graph as built.
 *
 * Held: the package's TEST-ONLY modules are not bundled inputs (the TEST-ONLY draft store, the review pathway's handoff and its report, the
 * safeguards, the action-word classes and the CANDIDATE coach-rule overlay), and no bundled input is a unit file, a file under docs/audits/drafts,
 * a *.review.json file, or a file whose name says CANDIDATE or ILLUSTRATIVE. Positive control: the entry and the bundled modules the package
 * changed are inputs, so an empty or broken graph cannot pass.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('production bundle inputs, from esbuild\'s metafile (fix F)')

const BACK = path.resolve(__dirname, '..', '..', '..')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require(path.join(BACK, 'node_modules', 'esbuild'))
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { dependencies } = require(path.join(BACK, 'package.json'))

/** build.js's esbuild options, with nothing written and the metafile asked for. */
function productionInputs(): string[] {
    const result = esbuild.buildSync({
        entryPoints: ['src/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'es2020',
        outfile: 'dist/index.js',
        external: Object.keys(dependencies),
        tsconfig: 'tsconfig.json',
        absWorkingDir: BACK,
        write: false,
        metafile: true,
        logLevel: 'silent',
    })
    return Object.keys(result.metafile.inputs).map((input) => input.split(path.sep).join('/'))
}

/** The modules of the package that are TEST-ONLY by construction (stage W6's classification, verified by V1 against the same metafile). */
export const TEST_ONLY_MODULES = [
    'src/system/derivation/draft-store.ts',
    'src/system/design-reasoning/handoff.ts',
    'src/system/design-reasoning/handoff-report.ts',
    'src/system/design-reasoning/safeguards.ts',
    'src/system/sport-module/action-words.ts',
    'src/system/sport-module/candidate-coach-rules.ts',
    // Stage B2 of the A02 complete-activity package (12 November 2026): the reader and gate of our CANDIDATE coach wording.
    'src/system/rendering/candidate-coach-wording.ts',
]

/** Why an input may not be in the production graph, or null where it may. */
export function forbiddenInput(input: string): string | null {
    const name = input.split('/').pop() ?? input
    if (TEST_ONLY_MODULES.includes(input)) return 'a TEST-ONLY module of the package'
    if (name.endsWith('.unit.ts')) return 'a unit file'
    if (input.includes('docs/audits/drafts/')) return 'a file of the draft stores (docs/audits/drafts)'
    if (name.endsWith('.review.json')) return 'a review data file (*.review.json)'
    if (name.toUpperCase().includes('CANDIDATE')) return 'a file whose name says CANDIDATE'
    if (name.toUpperCase().includes('ILLUSTRATIVE')) return 'a file whose name says ILLUSTRATIVE'
    // Stage B2: our PROPOSED configuration files are named so (docs/audits/drafts/a02-proposed/hpe1.PROPOSED.json).
    if (name.includes('.PROPOSED.')) return 'a file whose name says PROPOSED'
    return null
}

/**
 * Stage B2: the knowledge files build.js copies into the bundle's knowledge folder, read from build.js's own list (its `knowledgeFiles` literal,
 * each quoted file name), so a CANDIDATE, PROPOSED or draft-store file named there is caught as a bundled input would be.
 */
export function copiedKnowledgeFiles(buildJs: string): string[] {
    const start = buildJs.indexOf('const knowledgeFiles = [')
    const end = buildJs.indexOf(']', buildJs.indexOf('provisionalFile,', start))
    if (start < 0 || end < 0) throw new Error('build.js holds no knowledgeFiles list')
    return [...buildJs.slice(start, end).matchAll(/'([^']+\.json)'/g)].map((m) => m[1])
}

const INPUTS = productionInputs()

test('positive control: the graph holds the entry and the bundled modules the package changed', () => {
    const changedBundled = [
        'src/index.ts',
        'src/system/build-constraint-package.ts',
        'src/system/validate-constraint-package.ts',
        'src/system/derivation/emit.ts',
        'src/system/derivation/engine.ts',
        'src/system/derivation/gates.ts',
        'src/system/derivation/run-bounded-selection.ts',
        'src/system/derivation/types.ts',
        'src/system/rendering/build-activity.ts',
        'src/system/rendering/context-scoring-guard.ts',
        // Stage B2: the renderer (the worded-only rows read for the CANDIDATE gate) and the approved table the build reads beside our wording.
        'src/system/rendering/render-concrete-game.ts',
        'src/system/rendering/approved-wording.ts',
        'src/system/rendering/requirement-account.ts',
        'src/system/rendering/review-draft.ts',
        'src/system/rendering/review-evidence.ts',
        'src/system/sport-module/guided-selection.ts',
        'src/system/test-library/generateSelection.ts',
        'src/system/test-library/selection-compatibility.ts',
    ]
    assert.deepEqual(changedBundled.filter((file) => !INPUTS.includes(file)), [], 'each is a bundled input')
    assert.ok(INPUTS.filter((input) => input.endsWith('.ts')).length > 100, `${INPUTS.length} inputs`)
})

test('no TEST-ONLY module, unit file, draft-store file, review data, CANDIDATE or ILLUSTRATIVE file is a bundled input', () => {
    const found = INPUTS.map((input) => [input, forbiddenInput(input)] as const).filter(([, why]) => why !== null).map(([input, why]) => `${input}: ${why}`)
    assert.deepEqual(found, [], `bundled inputs that must not be:\n${found.join('\n')}`)
    // Each TEST-ONLY module exists, so its absence from the graph is a finding and not a misspelt path.
    for (const file of TEST_ONLY_MODULES) assert.ok(fs.existsSync(path.join(BACK, file)), file)
})

test('negative controls: the classifier names each kind of forbidden input, and passes a production module', () => {
    assert.equal(forbiddenInput('src/system/derivation/draft-store.ts'), 'a TEST-ONLY module of the package')
    assert.equal(forbiddenInput('src/system/design-reasoning/a02.unit.ts'), 'a unit file')
    assert.equal(forbiddenInput('../docs/audits/drafts/a02-composition/a02-authorization.DRAFT.json'), 'a file of the draft stores (docs/audits/drafts)')
    assert.equal(forbiddenInput('src/system/design-reasoning/a02-inputs.review.json'), 'a review data file (*.review.json)')
    assert.equal(forbiddenInput('src/system/sport-module/rpc-002-coach-rules.CANDIDATE.json'), 'a file whose name says CANDIDATE')
    assert.equal(forbiddenInput('../docs/audits/a02-illustrative.json'), 'a file whose name says ILLUSTRATIVE')
    assert.equal(forbiddenInput('src/system/derivation/gates.ts'), null)
    // Stage B2: our CANDIDATE coach wording's reader and file, and our PROPOSED configuration, each named.
    assert.equal(forbiddenInput('src/system/rendering/candidate-coach-wording.ts'), 'a TEST-ONLY module of the package')
    assert.equal(forbiddenInput('../docs/audits/drafts/a02-composition/a02-coach-wording.CANDIDATE.json'), 'a file of the draft stores (docs/audits/drafts)')
    assert.equal(forbiddenInput('knowledge/a02-coach-wording.CANDIDATE.json'), 'a file whose name says CANDIDATE')
    assert.equal(forbiddenInput('knowledge/hpe1.PROPOSED.json'), 'a file whose name says PROPOSED')
})

test("build.js copies no CANDIDATE, PROPOSED, ILLUSTRATIVE or draft-store file into the bundle's knowledge (stage B2), with its bite", () => {
    const buildJs = fs.readFileSync(path.join(BACK, 'build.js'), 'utf8')
    const copied = copiedKnowledgeFiles(buildJs)
    assert.ok(copied.includes('approved-coach-wording.json') && copied.includes('draft-coach-wording.json'), 'positive control: the list is read')
    assert.deepEqual(copied.filter((file) => forbiddenInput(file) !== null), [])
    // Bite: our CANDIDATE wording named in a copy of build.js's list is caught.
    const doctored = buildJs.replace("'approved-coach-wording.json',", "'approved-coach-wording.json',\n            'drafts/a02-composition/a02-coach-wording.CANDIDATE.json',")
    assert.deepEqual(copiedKnowledgeFiles(doctored).filter((file) => forbiddenInput(file) !== null), ['drafts/a02-composition/a02-coach-wording.CANDIDATE.json'])
})

test('registered', () => {
    const registry = JSON.parse(fs.readFileSync(path.join(BACK, 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/derivation/production-bundle-inputs.unit.ts'))
})

console.log(`production bundle inputs (fix F): ${passed} passed; ${INPUTS.length} inputs, ${INPUTS.filter((input) => input.endsWith('.ts')).length} .ts`)
