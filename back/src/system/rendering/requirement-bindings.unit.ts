/**
 * **The requirement bindings and their gate** — 29 October 2026 (the requirement account, report only; the specification's 5.1 B1-B5, with the
 * reviews' B6-B9).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Each generated activity should be evaluated against the applicable, approved
 * context requirements, accounting for each component of a scoring condition rather than simply confirming that the condition exists."* The
 * file holding our DRAFT classification of each requirement is held to a gate, so it can never name an item, a contract, a realization or a
 * Learning Goal, never omit a component the context's contract constitutes, never quote his words inexactly, never put coach observation
 * under structural validity, and never drop a row of his workbook silently. Each check is shown refusing a TEST-ONLY copy here.
 *
 * Pinned: the real file passes (B1); each check refuses (B2); a malformed file throws, and so does a TEST-ONLY build handed one (B3); the
 * bundle carries the file (B4); the TEST-ONLY draft bindings pass in DRAFT mode only, and merge with the production file only in MERGED mode
 * (B5-B8, the R-engine review's M1); every workbook the gate reads is a bundled module, and only the bindings are read from disk (B9, M2).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/requirement-bindings.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadDraftRequirementBindings, loadDraftStore, mergeRequirementBindings } from '../derivation/draft-store'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityUnderAuthorizationRecords } from './build-activity'
import { specializedRoleNames } from './session-envelope'
import {
    applicableRows,
    loadRequirementBindings,
    productionContractedContexts,
    REQUIREMENT_BINDINGS_FILE,
    RequirementBindings,
    requirementBindingsLoad,
    requirementBindingsRefusals,
    RequirementBindingsRefused,
} from './requirement-bindings'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    quiet(`  ok  ${name}`)
}
quiet('the requirement bindings and their gate')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const production = loadRequirementBindings()
const { file: _file, mode: _mode, ...raw } = production
const store = loadDraftStore('ta02-composition')
const draft = loadDraftRequirementBindings(store)
const { file: _draftFile, mode: _draftMode, ...draftRaw } = draft
const context = () => raw.contexts[0]
const rowOf = (bindings: any, rowId: string) => bindings.contexts[0].rows.find((row: any) => row.rowId === rowId)
const partOf = (bindings: any, rowId: string, partId: string) => rowOf(bindings, rowId).parts.find((part: any) => part.id === partId)
/** A TEST-ONLY copy altered, then its refusals in PRODUCTION mode. */
const refusalsOf = (alter: (bindings: any) => void, mode: 'PRODUCTION' | 'DRAFT' | 'MERGED' = 'PRODUCTION') => {
    const altered: any = copy(raw)
    alter(altered)
    return requirementBindingsRefusals(altered, { mode })
}
const refuses = (label: string, alter: (bindings: any) => void, expected: string) => {
    const reasons = refusalsOf(alter)
    assert.ok(reasons.some(reason => reason.includes(expected)), `${label}: expected a reason naming "${expected}", got ${JSON.stringify(reasons)}`)
}

// ── B1 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('B1: the real file passes its gate, stamped PRODUCTION, binding every applicable row of the one production-contracted context', () => {
    assert.deepEqual(requirementBindingsRefusals(raw, { mode: 'PRODUCTION' }), [])
    assert.equal(production.mode, 'PRODUCTION')
    assert.equal(production.file, 'docs/audits/requirement-bindings.json')
    assert.ok(production.standing.startsWith('DRAFT - OUR CLASSIFICATION, NOT HIS'))
    assert.deepEqual(productionContractedContexts(), ['RPC-001'])
    assert.deepEqual(production.contexts.map(entry => entry.contextId), ['RPC-001'])
    // Three REQUIRED identity rows, one EXCLUSION, the scoring condition, five validation rows.
    assert.deepEqual(context().rows.map(row => row.rowId), ['RPC-ID-001', 'RPC-ID-002', 'RPC-ID-003', 'RPC-ID-005', 'RPC-PROP-132', 'RPC-VAL-001', 'RPC-VAL-002', 'RPC-VAL-003', 'RPC-VAL-004', 'RPC-VAL-005'])
    const rows = applicableRows('RPC-001', production.applicability)
    assert.deepEqual(rows.accounted.map(row => row.rowId), context().rows.map(row => row.rowId))
    // Every other ACTIVE row of his workbook is listed with why, never dropped (the R-engine review's S6): 1 supporting identity row and 17 properties.
    assert.equal(rows.notAccounted.length, 18)
    assert.ok(rows.notAccounted.every(row => row.why === production.applicability.listedNotAccounted.why), JSON.stringify(rows.notAccounted.map(row => row.why)))
})

// ── B2: each check refuses, naming the defect ───────────────────────────────────────────────────────────────────────────────────────────
test('B2: every check of the gate refuses a TEST-ONLY copy, naming the defect', () => {
    refuses('unknown key', bindings => (bindings.extra = 1), 'unknown key "extra"')
    refuses('standing', bindings => (bindings.standing = 'APPROVED'), 'standing does not start DRAFT')
    refuses('schema', bindings => (bindings.schemaVersion = 2), 'schemaVersion')
    refuses('bases', bindings => bindings.carriers.eligibleBases.push('ASSUMED'), 'looser than the reader')
    refuses('forward', bindings => bindings.carriers.eligibleForward.push('INERT'), 'eligibleForward')
    refuses('applicability vocabulary', bindings => bindings.applicability.accounted.propertyCategories.push('NO_SUCH_CATEGORY'), 'which his workbook does not hold')
    refuses('a category neither accounted nor listed (S6)', bindings => (bindings.applicability.listedNotAccounted.propertyCategories = bindings.applicability.listedNotAccounted.propertyCategories.filter((entry: string) => entry !== 'DEGENERATE_SOLUTION')), 'neither accounted nor listed')
    refuses('alternatives over a domain not accounted', bindings => bindings.applicability.overReturnedAlternatives.validationDomains.push('NO_SUCH'), 'NO_SUCH')
    refuses('unknown part kind', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').kind = 'GUESS'), 'unknown kind "GUESS"')
    refuses('unknown standard', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').standard = 'VIBES'), 'unknown standard "VIBES"')
    refuses('coach observation as structural', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').standard = 'STRUCTURAL_VALIDITY'), 'coach observation never takes STRUCTURAL_VALIDITY')
    refuses('coach observation as relevance on our words (S5)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').standard = 'LEARNING_DESIGN_RELEVANCE'), "expected evidence naming a coach's judgment")
    refuses('a pattern as field effectiveness', bindings => (partOf(bindings, 'RPC-VAL-004', 'opposition').standard = 'FIELD_EFFECTIVENESS'), 'takes STRUCTURAL_VALIDITY only')
    refuses('facet row not in the register', bindings => (partOf(bindings, 'RPC-VAL-004', 'opposition').facets[0].row = 'ZZ9'), 'is not in the register')
    refuses('term attribute not offered', bindings => (partOf(bindings, 'RPC-VAL-004', 'consequence').facets[0].terms[0].attribute = 'colour'), 'is not a selector attribute of T1')
    refuses('requirement outside the vocabulary', bindings => (partOf(bindings, 'RPC-VAL-004', 'opposition').facets[0].requirement = ['SOMETIMES']), 'is outside')
    refuses('empty from', bindings => (partOf(bindings, 'RPC-VAL-004', 'opposition').facets[0].from = []), 'is not a non-empty list')
    refuses('an item id in a label', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').label = 'carried by RPC-001-18.a'), 'names the item RPC-001-18.a')
    refuses('an element handle', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').label = 'c:restated:GF2:GF2-07.a'), 'names a contract (restated:)')
    refuses('a Learning Goal id', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').cause.detail = 'as A01 shows'), 'names the Learning Goal A01')
    refuses('a demonstration id', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').cause.detail = 'unlike neutral-players'), 'names the mechanism demonstration neutral-players')
    refuses('a provisional realization id', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').cause.detail = 'see A01-R1'), 'names the provisional realization A01-R1')
    refuses('TEST-ONLY words in production knowledge', bindings => (partOf(bindings, 'RPC-ID-002', 'purpose').cause.detail = 'a TEST-ONLY stand-in'), 'a production string says TEST-ONLY')
    refuses('a missing applicable row', bindings => (bindings.contexts[0].rows = bindings.contexts[0].rows.filter((row: any) => row.rowId !== 'RPC-VAL-003')), 'the applicable row RPC-VAL-003')
    refuses('a row of another context', bindings => (rowOf(bindings, 'RPC-VAL-003').rowId = 'RPC-VAL-013'), 'is not an ACTIVE row of RPC-001')
    refuses('a row outside the applicable set', bindings => bindings.contexts[0].rows.push({ rowId: 'RPC-ID-004', parts: [copy(partOf(raw, 'RPC-ID-002', 'purpose'))] }), 'outside the applicable set')
    refuses('a component on an identity row', bindings => rowOf(bindings, 'RPC-ID-002').parts.push({ ...copy(partOf(raw, 'RPC-PROP-132', 'control')), id: 'stray' }), 'sits only on a PRIMARY_SCORING_CONDITION row')
    refuses('the control component removed', bindings => (rowOf(bindings, 'RPC-PROP-132').parts = rowOf(bindings, 'RPC-PROP-132').parts.filter((part: any) => part.id !== 'control')), 'constitutes the control condition')
    refuses('a component with no words of his', bindings => delete partOf(bindings, 'RPC-PROP-132', 'origin').rowSpan, 'quotes the words of his row')
    refuses('words of his not verbatim (S1)', bindings => (partOf(bindings, 'RPC-PROP-132', 'origin').rowSpan = 'Initiated from the keeper'), 'is not verbatim, whole')
    refuses('a component condition off the conditions row', bindings => (partOf(bindings, 'RPC-PROP-132', 'origin').facets[0].requirement = ['COUNT']), "a component's first facet is its condition on V3")
    refuses('expected evidence altered by a word', bindings => (partOf(bindings, 'RPC-VAL-001', 'recognizable').observable.text = partOf(raw, 'RPC-VAL-001', 'recognizable').observable.text.replace('experienced', 'expert')), "his row's expected evidence exactly")
    refuses('a knowledge row not verbatim', bindings => (partOf(bindings, 'RPC-PROP-132', 'control-in-play').observable.text = 'with the ball controlled on arrival'), 'is not verbatim in RPC-PROP-132 property_text')
    refuses('an ellipsis (N2)', bindings => (partOf(bindings, 'RPC-PROP-132', 'progression-in-play').observable.text = 'progressing beyond ... line'), 'with an ellipsis')
    refuses('a knowledge row of another context', bindings => (partOf(bindings, 'RPC-ID-001', 'start-stable-in-play').observable.citedAs.rowId = 'RPC-PROP-034'), 'is a row of RPC-003, not of RPC-001')
    refuses('a workbook read by path', bindings => (partOf(bindings, 'RPC-VAL-004', 'opposition-in-play').observable.citedAs.file = 'back/data/some.json'), 'is not a workbook the gate reads')
    refuses('sameReferentAs naming no component', bindings => (partOf(bindings, 'RPC-PROP-132', 'control').sameReferentAs.component = 'nothing'), 'which is no other component of the row')
    refuses('accountsFor naming an accounted row', bindings => (partOf(bindings, 'RPC-PROP-132', 'episode-ends-on-loss').accountsFor = ['RPC-ID-002']), 'accounted in its own right')
    refuses('a declaration of an unknown kind', bindings => (partOf(bindings, 'RPC-PROP-132', 'origin').facets[2].declaration.kind = 'MAYBE'), 'names a declaration kind')
    refuses('byConstructionWhen unknown', bindings => (partOf(bindings, 'RPC-PROP-132', 'progression').facets[1].byConstructionWhen = 'ALWAYS'), 'byConstructionWhen "ALWAYS"')
    refuses('a cause on a pattern', bindings => (partOf(bindings, 'RPC-VAL-004', 'opposition').cause = { kind: 'MISSING_KNOWLEDGE', detail: 'x' }), 'only an UNSUPPORTED part carries a cause')
    refuses('an unsupported part without a cause', bindings => delete partOf(bindings, 'RPC-ID-002', 'purpose').cause, 'names its cause')
    refuses('a context with no production contract, in PRODUCTION mode', bindings => (bindings.contexts = [...bindings.contexts, ...copy(draftRaw.contexts)]), 'RPC-003 has no production contract')
    // Round 2, R1 S2: a component pins what his approved knowledge carries, and a pin can only restate it.
    refuses('a scope outside the vocabulary', bindings => (partOf(bindings, 'RPC-PROP-132', 'control').facets[0].scope = ['SOMETIMES']), 'is outside WHOLE_GAME')
    refuses('a component condition with no scope pinned', bindings => delete partOf(bindings, 'RPC-PROP-132', 'origin').facets[0].scope, 'pins the scope its knowledge carries')
    refuses('a component value facet with no value pinned', bindings => delete partOf(bindings, 'RPC-PROP-132', 'control').facets[1].value, 'pins the value its knowledge carries')
    refuses('a pinned value his knowledge does not hold', bindings => (partOf(bindings, 'RPC-PROP-132', 'progression').facets[2].value = 'before'), 'its pinned value is held by no item')
    refuses('a pinned scope his knowledge does not hold', bindings => (partOf(bindings, 'RPC-PROP-132', 'exclusion').facets[0].scope = ['WHOLE_GAME']), 'its pinned scope is held by no item')
    refuses('a scope on a declaration facet', bindings => (partOf(bindings, 'RPC-PROP-132', 'origin').facets[2].scope = ['WHOLE_GAME']), 'a declaration facet carries no requirement, strictness, value or scope')
    // The pins are the values his approved knowledge carries, exactly (read from the file: the gate held each to the contract above).
    const pinned = (partId: string, facetId: string) => partOf(raw, 'RPC-PROP-132', partId).facets.find((facet: any) => facet.id === facetId)
    assert.deepEqual([pinned('progression', 'value').value, pinned('control', 'value').value, pinned('exclusion', 'value').value], ['beyond', 'controlled on arrival', 'a long clearance that happens to reach the target'])
    assert.deepEqual(['origin', 'progression', 'control', 'exclusion'].map(partId => pinned(partId, 'condition').scope), [['BUILD_OUT_EPISODE'], ['BUILD_OUT_EPISODE'], ['BUILD_OUT_EPISODE'], ['BUILD_OUT_EPISODE']])
})

// ── B3 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('B3: a malformed file throws RequirementBindingsRefused, and a TEST-ONLY build handed malformed bindings throws', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'requirement-bindings-'))
    try {
        const malformed: any = copy(raw)
        partOf(malformed, 'RPC-ID-003', 'progression-options').standard = 'STRUCTURAL_VALIDITY'
        const file = path.join(dir, 'malformed.json')
        fs.writeFileSync(file, JSON.stringify(malformed))
        assert.throws(() => loadRequirementBindings(file), (error: unknown) => error instanceof RequirementBindingsRefused && error.reasons.some(reason => reason.includes('coach observation never takes STRUCTURAL_VALIDITY')))
        const unparsable = path.join(dir, 'unparsable.json')
        fs.writeFileSync(unparsable, '{ not json')
        assert.throws(() => loadRequirementBindings(unparsable), (error: unknown) => error instanceof RequirementBindingsRefused && error.reasons[0].startsWith('the file does not parse') && !error.unreadable)
        // Round 2, R1 NIT 7: a file that cannot be read is refused as unreadable (never memoized), and the server's path never reaches the reason.
        const missing = path.join(dir, 'missing.json')
        assert.throws(
            () => loadRequirementBindings(missing),
            (error: unknown) => error instanceof RequirementBindingsRefused && error.unreadable && error.reasons[0].startsWith('the file cannot be read') && !error.message.includes(dir) && error.message.includes('missing.json'),
        )
        // The production file reads, and is remembered.
        assert.equal(requirementBindingsLoad().why, null)
        assert.equal(requirementBindingsLoad(), requirementBindingsLoad())
        const roles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
        const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...roles, [specializedRoleNames()[0]]: 1 }, objects: { goal: { count: 0 } } }
        assert.throws(
            () => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { review: { includeDrafts: true }, requirementBindings: { ...malformed, file: 'TEST-ONLY', mode: 'PRODUCTION' } as RequirementBindings }),
            /TEST-ONLY requirement bindings are refused by the gate the file is held to/,
        )
        // Round 2, R3 NIT 12: the TEST-ONLY options a coach's build would ignore throw; an unknown mode throws.
        assert.throws(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { requirementBindings: production }), /read only by an administrator's review build/)
        assert.throws(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { observeRequirementInputs: () => undefined }), /read only by an administrator's review build/)
        assert.throws(
            () => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { review: { includeDrafts: true }, requirementBindings: { ...production, mode: 'SOMETHING' as any } }),
            /stamped with no known mode/,
        )
    } finally {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

// ── B4 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('B4: the bundle carries the file (build.js lists it), found through AUDITS_DIR', () => {
    const build = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'build.js'), 'utf8')
    assert.ok(build.includes("'requirement-bindings.json'"), 'build.js copies the bindings into dist/knowledge')
    assert.equal(path.basename(REQUIREMENT_BINDINGS_FILE), 'requirement-bindings.json')
})

// ── B5-B8: the three modes (the R-engine review's M1) ───────────────────────────────────────────────────────────────────────────────────
test('B5-B8: the draft bindings pass in DRAFT mode only; the production file in PRODUCTION and MERGED; the two merge only in MERGED mode', () => {
    // B5/B7: the draft-only file.
    assert.equal(draft.mode, 'DRAFT')
    assert.equal(draft.file, 'docs/audits/drafts/requirement-bindings-rpc-003.DRAFT.json')
    assert.deepEqual(requirementBindingsRefusals(draftRaw, { mode: 'DRAFT', draftContracts: store.contracts }), [])
    assert.ok(requirementBindingsRefusals(draftRaw, { mode: 'PRODUCTION' }).includes('RPC-003 has no production contract: its bindings belong in the TEST-ONLY draft bindings'))
    assert.ok(requirementBindingsRefusals(draftRaw, { mode: 'MERGED', draftContracts: store.contracts }).includes('RPC-001 has a production contract and no bindings'))
    // In DRAFT mode the standing says TEST-ONLY.
    assert.ok(requirementBindingsRefusals({ ...copy(draftRaw), standing: 'DRAFT - ours' }, { mode: 'DRAFT', draftContracts: store.contracts }).some(reason => reason.includes('must start "DRAFT - TEST-ONLY"')))
    // B8: the production-only file.
    assert.deepEqual(requirementBindingsRefusals({ ...copy(raw), standing: 'DRAFT - TEST-ONLY. a copy' }, { mode: 'MERGED', draftContracts: store.contracts }), [])
    // B6: merged, stamped and gated in MERGED mode; a TEST-ONLY build accepts it (the requirement account's own test builds with it).
    const merged = mergeRequirementBindings(production, draft, store.contracts)
    assert.equal(merged.mode, 'MERGED')
    assert.equal(merged.version, `${production.version}+${draft.version}`)
    assert.ok(merged.standing.startsWith('DRAFT - TEST-ONLY. Merged from'))
    assert.deepEqual(merged.contexts.map(entry => entry.contextId), ['RPC-001', 'RPC-003'])
    const { file: _m, mode: _mm, ...mergedRaw } = merged
    assert.deepEqual(requirementBindingsRefusals(mergedRaw, { mode: 'MERGED', draftContracts: store.contracts }), [])
    // Refused: a context in both; a different applicability; a draft that is not one.
    assert.throws(() => mergeRequirementBindings(production, { ...draft, contexts: [...draft.contexts, ...copy(production.contexts)] }, store.contracts), /RPC-001 is bound in both/)
    assert.throws(() => mergeRequirementBindings(production, { ...draft, applicability: { ...copy(draft.applicability), standing: 'DRAFT', accounted: { ...copy(draft.applicability.accounted), validationDomains: ['IDENTITY'] } } }, store.contracts), /differ in applicability/)
    assert.throws(() => mergeRequirementBindings(production, production, store.contracts), /not DRAFT/)
})

// ── B9: read through bundled modules only (the R-engine review's M2) ────────────────────────────────────────────────────────────────────
test('B9: requirement-bindings.ts reads only the bindings from disk; every workbook it reads is a bundled JSON module; neither new file imports the draft store', () => {
    // The code alone: comments quote him and explain the bundle, so they are stripped (as activity-review.unit.ts strips build-activity.ts).
    const code = (file: string) =>
        fs
            .readFileSync(path.join(__dirname, file), 'utf8')
            .split('/*')
            .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2)))
            .join(' ')
            .split('\n')
            .map(line => (line.trimStart().startsWith('//') ? '' : line.split(' // ')[0]))
            .join('\n')
    const source = code('requirement-bindings.ts')
    const reader = code('requirement-account.ts')
    assert.equal((source.match(/readFileSync\(/g) ?? []).length, 1, 'one read from disk')
    assert.ok(/export function loadRequirementBindings\(file: string = REQUIREMENT_BINDINGS_FILE\)/.test(source), 'and it is the bindings file')
    assert.ok(!reader.includes('readFileSync'), 'the reader reads no file')
    for (const text of [source, reader]) {
        assert.ok(!/__dirname/.test(text), 'no path resolved from the module (in the bundle it is dist)')
        assert.ok(!/['"][^'"]*draft-store['"]/.test(text), 'the TEST-ONLY draft store is never imported')
    }
    // Each workbook the KNOWLEDGE_ROW map names is imported as a module under the same file name.
    const mapped = [...source.matchAll(/'back\/src\/system\/([^']+\.json)': \{ json: (\w+)/g)].map(match => ({ file: path.basename(match[1]), binding: match[2] }))
    assert.equal(mapped.length, 2)
    for (const { file, binding } of mapped) assert.ok(new RegExp(`import ${binding} from '[^']*${file.replace(/\./g, '\\.')}'`).test(source), `${file} is an imported module (${binding})`)
})

console.log = quiet
console.log(`requirement-bindings unit tests: ${passed} passed.`)
