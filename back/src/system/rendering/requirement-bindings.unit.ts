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
 * (B5-B8, the R-engine review's M1); every workbook the gate reads is a bundled module, and only the bindings are read from disk (B9, M2);
 * no REQUIRED restatement rests only on an example (B13, 11 November 2026; both TEST-ONLY draft stores since A02 package W5), and what rests
 * only on one is kept as one (B13b, S2); no restatement names an action word its cited rows lack (B13c, A02 package W3).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/requirement-bindings.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadDraftRequirementBindings, loadDraftStore, mergeRequirementBindings } from '../derivation/draft-store'
import { spanIsExample } from '../derivation/example-clauses'
import { actionClassesIn, namesGenericAction } from '../sport-module/action-words'
import rpcWorkbook from '../sport-module/rpc-library.rc1.json'
import { learningGoalAuthorizations, observationCriteriaApprovals, quotesOfHisReplies, validateObservationCriteriaApprovals } from '../test-library/learning-goal-authorizations'
import { buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { constitutedConditionTypes } from './context-scoring-guard'
import { SCORING_REASON_HEAD } from './requirement-account'
import { specializedRoleNames } from './session-envelope'
import {
    applicableRows,
    enforcementBindingsFor,
    loadRequirementBindings,
    locatedBindingsRefusals,
    productionContractedContexts,
    readRequirementBindings,
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
/** A build with the selection's progress lines hushed (round 3b). */
const silentlyBuild = (run: () => ServedActivity | RefusedActivity): ServedActivity | RefusedActivity => {
    const before = console.log
    console.log = () => undefined
    try {
        return run()
    } finally {
        console.log = before
    }
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const production = loadRequirementBindings()
const { file: _file, mode: _mode, ...raw } = production
const store = loadDraftStore('ta02-composition')
// A02 package W5 (12 November 2026): read here so B13 reads it as well as B13c (moved up from B13c, unchanged).
const a02Store = loadDraftStore('a02-composition')
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
    // Round 3b (R1 S1): moved here from the runtime gate — every production-contracted context has bindings in the production file (CI).
    for (const contextId of productionContractedContexts()) assert.ok(production.contexts.some(entry => entry.contextId === contextId), `${contextId} has a production contract and no bindings`)
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
    refuses('coach observation as relevance on anything but his expected evidence (S5)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').standard = 'LEARNING_DESIGN_RELEVANCE'), "expected evidence naming a coach's judgment")
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
    // Round 3: his words from a reply, approved by him as an observation criterion (his reply filed 4 November 2026, item 6), held verbatim.
    refuses('a reply observable not verbatim (round 3)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').observable.text = 'Success should permit several functional solutions.'), 'is not verbatim in the words of his replies the authorization records quote')
    refuses('a reply observable citing no reply (round 3)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').observable.citedAs = null), 'a HIS_REPLY observable cites {reply, approvedBy}')
    refuses('a reply observable whose approval names no reply (round 3)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').observable.citedAs.approvedBy = 'agreed in conversation'), 'citedAs.approvedBy names his reply')
    // Round 3b (the round-3 reviews' R2 S4 and R3 S1): the reply cited and the approval claimed are checked, not only the words.
    refuses('an approval he did not give (round 3b, R2 S4 a)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').observable.citedAs.approvedBy = 'his reply filed 1 January 2026, item 99'), 'is not an approval of his the authorization records hold')
    refuses('his words credited to another reply (round 3b, R2 S4 b, R3 S1)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').observable.citedAs.reply = 'his reply filed 19 October 2026, item 1'), 'the authorization records credit these words to')
    refuses(
        'other words of his claimed approved under item 6 (round 3b, R2 S4 c)',
        bindings => {
            const part = partOf(bindings, 'RPC-ID-005', 'no-dominant-high-press')
            part.observable = { text: 'The intended outcome is controlled progression beyond meaningful defensive pressure, establishing the opportunity to continue an organized attack.', source: 'HIS_REPLY', citedAs: { reply: 'his reply filed 16 October 2026, item 4', approvedBy: 'his reply filed 4 November 2026, item 6' }, expect: 'ABSENT' }
        },
        'is not an approval of his the authorization records hold',
    )
    // Round 3b (R3 N6): an observable of ours still cites nothing (the file now holds none, so the branch is exercised here).
    refuses('an observable of ours that cites something (round 3b, R3 N6)', bindings => (partOf(bindings, 'RPC-ID-003', 'progression-options').observable.source = 'OURS'), 'an observable of ours cites nothing')
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
        // Round 2, R3 NIT 12: the TEST-ONLY options a coach's build would ignore throw; an unknown mode throws. Round 3: a coach's build of a
        // production-contracted context reads the bindings for the enforced components, so TEST-ONLY bindings are read there (and held to the
        // same gate, so a malformed copy still throws); the observer is still only an administrator's, and bindings given and read as refused
        // together throw.
        const coachGiven = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { requirementBindings: production }).activity
        assert.deepEqual([coachGiven.outcome, 'requirementAccount' in coachGiven], ['served', false])
        assert.throws(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { requirementBindings: { ...malformed, file: 'TEST-ONLY', mode: 'PRODUCTION' } as RequirementBindings }), /TEST-ONLY requirement bindings are refused by the gate the file is held to/)
        assert.throws(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { observeRequirementInputs: () => undefined }), /called only by an administrator's review build/)
        assert.throws(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { requirementBindings: production, requirementBindingsRefused: ['TEST-ONLY'] }), /either given or read as refused, not both/)
        assert.throws(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { requirementBindingsRefused: [] }), /name at least one reason/)
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
    // Round 3b (the round-3 review's R1 S1): "every production-contracted context has bindings" is held here, in CI, not by the runtime gate,
    // which would refuse the whole file — and every bound context's activity with it — for one context's missing entry.
    assert.ok(!requirementBindingsRefusals(draftRaw, { mode: 'MERGED', draftContracts: store.contracts }).some(reason => reason.includes('has a production contract and no bindings')), 'no longer a gate reason')
    assert.ok(!draft.contexts.some(entry => productionContractedContexts().includes(entry.contextId)), 'the draft alone binds no production-contracted context')
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

// ── B10 and B11 (round 3b) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('B10 (round 3b, R1 S1): each gate reason is located, and only a reason reaching what the enforcement reads refuses a build; elsewhere, the account alone is refused', () => {
    const recognizableAltered = (bindings: any) => (partOf(bindings, 'RPC-VAL-001', 'recognizable').observable.text = partOf(raw, 'RPC-VAL-001', 'recognizable').observable.text.replace('experienced', 'expert'))
    const controlSpanBroken = (bindings: any) => (partOf(bindings, 'RPC-PROP-132', 'control').rowSpan = 'with the ball controlled on arrival')
    const carriersLoose = (bindings: any) => (bindings.carriers.standing = 'APPROVED')
    const altered = (alter: (bindings: any) => void) => {
        const bindings: any = copy(raw)
        alter(bindings)
        return bindings
    }
    // Function level: where each reason was found, and the gate's reasons exactly, in its order.
    assert.deepEqual(locatedBindingsRefusals(altered(recognizableAltered), { mode: 'PRODUCTION' }).map(entry => entry.at), [{ contextId: 'RPC-001', rowId: 'RPC-VAL-001' }])
    const reachingRow = locatedBindingsRefusals(altered(controlSpanBroken), { mode: 'PRODUCTION' })
    assert.ok(reachingRow.length > 0 && reachingRow.every(entry => entry.at.contextId === 'RPC-001' && entry.at.rowId === 'RPC-PROP-132'), JSON.stringify(reachingRow))
    assert.ok(locatedBindingsRefusals(altered(carriersLoose), { mode: 'PRODUCTION' }).some(entry => entry.at.contextId === null))
    for (const alter of [recognizableAltered, controlSpanBroken, carriersLoose]) assert.deepEqual(locatedBindingsRefusals(altered(alter), { mode: 'PRODUCTION' }).map(entry => entry.reason), requirementBindingsRefusals(altered(alter), { mode: 'PRODUCTION' }))
    // End to end, through TEST-ONLY copies written to a scratch folder and read the production loader's way.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'requirement-bindings-3b-'))
    try {
        const write = (name: string, alter: (bindings: any) => void) => {
            const file = path.join(dir, name)
            fs.writeFileSync(file, JSON.stringify(altered(alter)))
            return file
        }
        const roles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
        const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...roles, [specializedRoleNames()[0]]: 1 }, objects: { goal: { count: 0 } } }
        const build = (file: string, administrator: boolean) =>
            silentlyBuild(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { requirementBindingsFile: file, ...(administrator ? { review: { includeDrafts: true } } : {}) }).activity)
        // A defect in a coach-observed part the enforcement never reads: the account is refused, for the administrator; no build is refused.
        const elsewhere = write('elsewhere.json', recognizableAltered)
        const read = readRequirementBindings(elsewhere)
        assert.deepEqual([read.bindings, read.asRead !== null, enforcementBindingsFor(read, 'RPC-001').refused], [null, true, null])
        const coachServed = build(elsewhere, false)
        const administratorServed = build(elsewhere, true)
        assert.deepEqual([coachServed.outcome, administratorServed.outcome], ['served', 'served'])
        const account = administratorServed.requirementAccount!
        assert.deepEqual([account.status, account.enforcement.applied, account.enforcement.findings, account.enforcement.failures], ['BINDINGS_REFUSED', true, [], []])
        assert.ok(account.summary.headline.includes('No reason of the gate reaches what the enforcement reads'), account.summary.headline)
        assert.ok(!JSON.stringify(account).includes(dir), 'no absolute path')
        // A defect in the approved scoring condition's row: refused, fail-closed, on the coach's build too; the file named as read, no path.
        const reaching = write('reaching.json', controlSpanBroken)
        const coachRefused = build(reaching, false) as RefusedActivity
        assert.deepEqual([coachRefused.outcome, coachRefused.stage, coachRefused.reasons.length], ['refused', 'validation', 2])
        assert.ok(coachRefused.reasons.every(reason => reason.includes('reaching.json failed its integrity gate where the approved scoring condition of RPC-001 is read')), JSON.stringify(coachRefused.reasons))
        // Round 4 (his reply filed 5 November 2026, item 1): the classification cannot be read, so a verification failure, named so.
        assert.ok(coachRefused.reasons.every(reason => reason.includes(SCORING_REASON_HEAD.VERIFICATION_FAILURE)), JSON.stringify(coachRefused.reasons))
        assert.ok(!coachRefused.reasons.join(' ').includes(dir), 'no absolute path')
        // A defect at the file's top level: refused. The fix round (the R1 review's S4): a verification failure too, named so in every reason.
        const topRefused = build(write('top.json', carriersLoose), false) as RefusedActivity
        assert.equal(topRefused.stage, 'validation')
        assert.ok(topRefused.reasons.length > 0 && topRefused.reasons.every(reason => reason.includes(SCORING_REASON_HEAD.VERIFICATION_FAILURE)), JSON.stringify(topRefused.reasons))
    } finally {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

test('B11 (round 3b, R3 N5): TEST-ONLY bindings given to a coach\'s build are read there: a copy leaving words of his row unclassified refuses what the production file serves', () => {
    const roles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
    const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...roles, [specializedRoleNames()[0]]: 1 }, objects: { goal: { count: 0 } } }
    // The control component's words cut to "with possession controlled", and its coach-observed part given no observable: "on arrival" is classified
    // by no part. The copy passes the gate (the span is verbatim; a part may lack an observable), so only the enforcement reading it tells.
    const unclassified: any = copy(production)
    partOf(unclassified, 'RPC-PROP-132', 'control').rowSpan = 'with possession controlled'
    partOf(unclassified, 'RPC-PROP-132', 'control-in-play').observable = null
    const build = (requirementBindings?: RequirementBindings) => silentlyBuild(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), requirementBindings ? { requirementBindings } : {}).activity)
    assert.equal(build().outcome, 'served')
    assert.equal(build(production).outcome, 'served')
    // Round 3c (the recheck's S-A): the span cut alone, the in-play observable intact: "on arrival" is classified by the coach-observed part, so
    // the coach's build is served — read in no order, never a false "no part classifies".
    const cutOnly: any = copy(production)
    partOf(cutOnly, 'RPC-PROP-132', 'control').rowSpan = 'with possession controlled'
    assert.equal(build(cutOnly).outcome, 'served')
    const refused = build(unclassified) as RefusedActivity
    assert.deepEqual([refused.outcome, refused.stage], ['refused', 'validation'])
    assert.equal(refused.reasons.filter(reason => reason.endsWith(`cannot be verified, so the activity is not served (fail-closed): words of RPC-PROP-132 that no part classifies: "on arrival"`)).length, 2, JSON.stringify(refused.reasons))
    // Round 4: words no part classifies — a verification failure, named so at the reason's head.
    assert.equal(refused.reasons.filter(reason => reason.includes(`${SCORING_REASON_HEAD.VERIFICATION_FAILURE}the components of RPC-001's approved scoring condition cannot be verified`)).length, 2, JSON.stringify(refused.reasons))
})

test('B12 (round 3c, S-D): his approvals of observation criteria are data in the authorization records, held to their gate there, and no engine code holds them', () => {
    const approvals = observationCriteriaApprovals()
    assert.deepEqual(approvals.map(entry => [entry.id, entry.citedAs, entry.approves.filedAs]), [['OBSERVATION-CRITERION-1', 'his reply filed 4 November 2026, item 6', 'his reply filed 16 October 2026, item 4']])
    assert.deepEqual(validateObservationCriteriaApprovals(approvals, quotesOfHisReplies()), [])
    // The records' own gate refuses an approval of words they do not quote under the citation it gives, and one that cites no reply as filed.
    const wrongCitation = copy(approvals)
    wrongCitation[0].approves.citedAs = 'his reply filed 19 October 2026, item 1'
    assert.ok(validateObservationCriteriaApprovals(wrongCitation, quotesOfHisReplies()).some(reason => reason.includes('these records hold no quote of')))
    const notFiled = copy(approvals)
    notFiled[0].citedAs = 'in conversation'
    assert.ok(validateObservationCriteriaApprovals(notFiled, quotesOfHisReplies()).some(reason => reason.includes('cite the reply as filed')))
    // No approval, quote or citation form of his is held in the engine module any more.
    const code = fs.readFileSync(path.join(__dirname, 'requirement-bindings.ts'), 'utf8')
    for (const words of [approvals[0].words, approvals[0].approves.words, approvals[0].approves.citedAs]) assert.ok(!code.includes(words), `requirement-bindings.ts holds ${JSON.stringify(words)}`)
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

// ── B13: an example never carries a requirement (11 November 2026) ─────────────────────────────────────────────────────────────────
/**
 * Christian's reply received 11 November 2026, item 3, asks for a check that "The executable interpretation does not recreate a
 * possession-retention requirement from that example." and item 4 names the class: "A restatement should not acquire stronger
 * authority or impose stricter requirements than its governing source supports." (received 11 November 2026). Our restatements of
 * the workbook's condition rows are the requirement bindings (the production file, RPC-001, and the TEST-ONLY RPC-003 draft) and
 * the TEST-ONLY draft contract items (RPC-003's; since A02 package W5, 12 November 2026, RPC-002's as well). Not read here: A01's production contract items (docs/audits/conformance/stage-b/contracts.json,
 * RPC-001-07, 10.a, 10.b, 18.a-18.g, 19.a and 19.b, as corpus-restatements.json restates them). They also restate RPC-PROP-132 but
 * carry no structured source. A marker added to RPC-PROP-132 is caught by C1b (rpc-library.unit.ts). None of the restatements read
 * here may be REQUIRED on words its row gives only as an example (example-clauses.ts):
 *   - a binding part that is REQUIRED (a scoring-condition component is, by construction) must not quote, as its rowSpan, words its
 *     row gives as an example;
 *   - a REQUIRED item, whatever its valueStatus, must have a quotation of its basisEvidence outside an example of the rows its sources
 *     cite, and its value must not be words those rows give as an example. Until S2 (11 November 2026) a TYPICAL_EXAMPLE item was not
 *     read, as inert; it is inert in derivation (derive.ts isSupportCapable, forward.ts), but the context-scoring guard constitutes a
 *     scoring condition from a REQUIRED item on V3 whatever its valueStatus (context-scoring-guard.ts constitutedConditionTypes), so an
 *     example marked TYPICAL_EXAMPLE and left REQUIRED would still be required, and this check did not read it (draft-store.unit.ts
 *     measures such an item counting as a constituting item).
 * Measured 11 November 2026: a rowSpan or quotation that starts at or before a marker and runs into its example (one beginning
 * 'for example, reaching') is not read as resting only on the example and passes, even if only the marker lies outside it.
 * A source citing a row of the RPC library's properties is read against the whole row, so a shortened quotation cannot hide its
 * marker. What rests only on words the corrected Attack Development row gives as an example would be pinned below by name, with the
 * independent basis that lets it stand; anything else found, or a pinned entry no longer found, fails until the list is brought up to
 * date. RPC-003-04.b (REQUIRED, OUTSIDE_BOUNDARY, inert) passes: its 'at loss of possession' rests on RPC-PROP-037, though its 'at the
 * scoring event' rests on the clause the corrected row gives as an example. It is recorded here, not pinned.
 *
 * The list is empty since S2. Christian's reply received 11 November 2026, the second that day, item 3: "Neither "maintaining attacking
 * possession" nor "reaching a more advanced representative area" should become a mandatory scoring requirement solely because those
 * phrases appeared within an illustrative example." "Please make the narrow source-fidelity correction wherever the illustrative example
 * is the sole authority for a mandatory requirement." (received 11 November 2026, second reply). Its eight entries had no independent
 * basis: RPC-003-02, 11.a, 11.b, 11.c, 12.a and 12.b are TYPICAL_EXAMPLE and SUPPORTING (B13b holds them so), and the DRAFT bindings'
 * progression and control parts are no longer bound (kept whole in the draft contract's corrections, withdrawnBindingParts).
 */
const RESTATED_FROM_AN_EXAMPLE: Record<string, string> = {}
/** The items S2 re-classified: each rests only on the corrected row's example, and is kept, with its provenance, as an example. */
const KEPT_AS_AN_EXAMPLE =
    "Christian's item 3 (received 11 November 2026, second reply): no independent basis; strictness SUPPORTING, valueStatus TYPICAL_EXAMPLE, sources kept"
const RESTS_ONLY_ON_AN_EXAMPLE: Record<string, string> = {
    'RPC-003-02': KEPT_AS_AN_EXAMPLE,
    'RPC-003-11.a': KEPT_AS_AN_EXAMPLE,
    'RPC-003-11.b': KEPT_AS_AN_EXAMPLE,
    'RPC-003-11.c': KEPT_AS_AN_EXAMPLE,
    'RPC-003-12.a': KEPT_AS_AN_EXAMPLE,
    'RPC-003-12.b': KEPT_AS_AN_EXAMPLE,
}
const LIBRARY_FILE = 'back/src/system/sport-module/rpc-library.rc1.json'
const properties = (rpcWorkbook as unknown as { properties: Record<string, unknown>[] }).properties
const rowText = (rowId: string): string | undefined => properties.find(row => row['property_id'] === rowId)?.['property_text'] as string | undefined
const quotations = (text: string): string[] => [...text.matchAll(/"([^"]+)"|“([^”]+)”/g)].map(match => match[1] ?? match[2])
/**
 * Whether a draft item rests only on words the rows it cites give as an example: every quotation of its basisEvidence, read in every cited
 * row that holds it, is an example, or its value is words those rows give as an example. A source citing a row of the RPC library's
 * properties is read against the whole row.
 */
/**
 * The texts of the rows a draft item cites: a row of the RPC library's properties read whole, any other source by the words it quotes. A02
 * package W5 (12 November 2026): the library row is read through `readRow` (the library itself unless a test hands a TEST-ONLY copy of a row).
 */
const citedRowTexts = (item: any, readRow: (rowId: string) => string | undefined = rowText): string[] =>
    (item.source ?? []).map((source: any) =>
        source.file === LIBRARY_FILE && source.table === 'properties' ? readRow(String(source.rowId).trim().split(/\s+/)[0]) ?? String(source.text) : String(source.text),
    )
const restsOnlyOnAnExample = (item: any, readRow: (rowId: string) => string | undefined = rowText): boolean => {
    const texts: string[] = citedRowTexts(item, readRow)
    // Each quotation of its evidence, read in every cited row that holds it: true where every such reading is an example.
    const readings = quotations(String(item.basisEvidence ?? ''))
        .map(quotation => texts.map(text => spanIsExample(text, quotation)).filter(reading => reading !== null))
        .filter(reading => reading.length > 0)
    const evidenceIsAnExample = readings.length > 0 && readings.every(reading => reading.every(Boolean))
    const valueIsAnExample = typeof item.value === 'string' && item.value !== 'N/A' && texts.some(text => spanIsExample(text, item.value) === true)
    return evidenceIsAnExample || valueIsAnExample
}
test('B13 (11 November 2026): no REQUIRED restatement rests only on words its row gives as an example, outside the pinned list (empty since S2); none in the production bindings (RPC-001); since A02 package W5, both TEST-ONLY draft stores (the RPC-002 restatement too, none found; its bite: a marker inserted in a copy of RPC-PROP-133 is caught at 04.b)', () => {
    const found: string[] = []
    assert.equal(spanIsExample(rowText('RPC-PROP-134') ?? '', 'while maintaining attacking possession'), true, 'the reading still sees the example of the corrected row')

    let partsRead = 0
    for (const bindings of [production, draft]) {
        for (const entry of bindings.contexts) {
            for (const row of entry.rows) {
                for (const part of row.parts as any[]) {
                    if (!part.rowSpan) continue
                    partsRead++
                    const text = rowText(row.rowId)
                    assert.ok(text, `${row.rowId}: a part quotes it, and the library holds no property row of that id`)
                    const required = part.kind === 'SCORING_CONDITION_COMPONENT' || (part.facets ?? []).some((facet: any) => (facet.strictness ?? []).includes('REQUIRED'))
                    if (required && spanIsExample(text, part.rowSpan)) found.push(`${bindings.mode} bindings ${entry.contextId} ${row.rowId} ${part.id}`)
                }
            }
        }
    }

    // A02 package W5 (12 November 2026): both TEST-ONLY draft stores, the RPC-002 restatement's (a02-composition) as well as RPC-003's.
    let itemsRead = 0
    let rpc002Read = 0
    for (const contracts of [store.contracts, a02Store.contracts]) {
        for (const contract of contracts) {
            for (const item of contract.items as any[]) {
                if (item.strictness !== 'REQUIRED') continue
                itemsRead++
                if (contract.contractId === 'restated:RPC-002') rpc002Read++
                if (restsOnlyOnAnExample(item)) found.push(String(item.itemId))
            }
        }
    }

    // 6 since S2: the production file's 4 (RPC-001) and the draft's origin and not-possession-alone.
    assert.ok(partsRead >= 6 && itemsRead > 0, `the check read what it holds to account (${partsRead} parts quoting a row, ${itemsRead} REQUIRED items)`)
    // W5, measured: every item of the RPC-002 restatement is REQUIRED (10), and none rests on an example (RPC-PROP-133 holds no marker).
    assert.equal(rpc002Read, 10, 'B13 read the RPC-002 restatement\'s REQUIRED items')
    assert.deepEqual(found.filter(entry => entry.startsWith('PRODUCTION')), [], 'no production binding part (RPC-001, A01) rests on an example')
    assert.deepEqual(found.sort(), Object.keys(RESTATED_FROM_AN_EXAMPLE).sort(), 'what rests only on the corrected row\'s example is exactly the pinned list')

    // W5, the bite: a TEST-ONLY copy of RPC-PROP-133's text with a marker inserted before its third clause (never written) is caught at
    // RPC-002-04.b, the control value, and at 04.a, whose evidence quotes that clause; every other RPC-002 item still passes.
    const third = 'the attacking team retains possession through the next action'
    const row133 = rowText('RPC-PROP-133') ?? ''
    assert.ok(row133.includes(`, and ${third}.`), 'RPC-PROP-133 still ends on its third clause')
    const withMarker = (rowId: string) => (rowId === 'RPC-PROP-133' ? row133.replace(`, and ${third}`, `, and for example, ${third}`) : rowText(rowId))
    const caught = (a02Store.contracts[0]!.items as any[]).filter(item => item.strictness === 'REQUIRED' && restsOnlyOnAnExample(item, withMarker)).map(item => String(item.itemId))
    assert.deepEqual(caught, ['RPC-002-04.a', 'RPC-002-04.b'], 'bite: a marker inserted in a copy of RPC-PROP-133 is caught at 04.b (and 04.a)')
})

/**
 * B13b (S2, 11 November 2026): an item that rests only on an example is kept as an example, and requires nothing. What could have let an
 * illustrative example act as a requirement again, before it reached another activity: an item re-classified by its valueStatus alone (the
 * context-scoring guard reads strictness, never valueStatus), one made REQUIRED again, one deleted with its provenance, a new item resting
 * on the example, or a DRAFT binding part bound to the example again. Each fails here or in B13. Pinned: exactly the six S2 re-classified,
 * each strictness SUPPORTING and valueStatus TYPICAL_EXAMPLE, still citing RPC-PROP-134 (its provenance, which the draft store holds
 * verbatim), constituting no scoring condition; and the DRAFT bindings bind as a scoring-condition component exactly what the draft
 * contract constitutes, the origin.
 */
test('B13b (S2, 11 November 2026): what rests only on an example is exactly the six items kept as examples, SUPPORTING and TYPICAL_EXAMPLE, constituting no condition', () => {
    const examples: string[] = []
    for (const contract of store.contracts) {
        const constituted = new Set(constitutedConditionTypes(contract).map(entry => entry.itemId))
        assert.ok(constituted.size > 0, `${contract.contractId}: the draft still constitutes a scoring condition (the origin)`)
        for (const item of contract.items as any[]) {
            if (!restsOnlyOnAnExample(item)) continue
            examples.push(String(item.itemId))
            assert.deepEqual([item.strictness, item.valueStatus], ['SUPPORTING', 'TYPICAL_EXAMPLE'], `${item.itemId}: kept as an example, never required`)
            assert.ok(!constituted.has(String(item.itemId)), `${item.itemId}: constitutes no scoring condition`)
            assert.ok((item.source ?? []).some((source: any) => String(source.rowId).startsWith('RPC-PROP-134')), `${item.itemId}: its provenance, the corrected row, is kept`)
            assert.ok(String(item.fitNote).startsWith('ILLUSTRATIVE since 11 November 2026'), `${item.itemId}: its fitNote says why`)
        }
    }
    assert.deepEqual(examples.sort(), Object.keys(RESTS_ONLY_ON_AN_EXAMPLE).sort(), 'what rests only on an example is exactly the six kept as examples')
    // The DRAFT bindings bind no component for them: every SCORING_CONDITION_COMPONENT of the draft is constituted by the draft contract.
    const components = draft.contexts.flatMap(entry => entry.rows.flatMap(row => (row.parts as any[]).filter(part => part.kind === 'SCORING_CONDITION_COMPONENT').map(part => String(part.component))))
    const constitutedTypes = store.contracts.flatMap(contract => constitutedConditionTypes(contract).map(entry => entry.type))
    assert.deepEqual(components, ['origin'])
    assert.deepEqual(constitutedTypes, ['origin'])
})

// ── B13c: a restatement's action word keeps its class (A02 package, stage W3, 11 November 2026) ─────────────────────────────────────
/**
 * The restatement sibling of primary-scoring.unit.ts's Test 2c. High Press Escape's coach rules said 'with the next pass' where the approved
 * row says "the attacking team retains possession through the next action." (RPC-PROP-133, approved 13 September 2026); Christian: "That
 * appears to introduce an unsupported restriction on the players' possible solutions." and "What automated safeguard could have detected
 * this problem before it affected another activity?" (received 11 November 2026, second reply). A restatement can narrow an action the same
 * way. So no item of either TEST-ONLY draft store (a02-composition, the RPC-002 restatement; ta02-composition, the RPC-003 one) may name, in
 * its value or a quotation of its basisEvidence, a specific action (action-words.ts: pass, dribble, shot, kick, cross, clearance, header,
 * carry) that no row it cites names in the same class; a generic 'action' grounds none. Its cited rows are read as B13 reads them (a row of
 * the RPC library's properties whole). Measured 11 November 2026: no item names a specific action, so the pinned list is empty; A02's
 * RPC-002-04.b ('retains possession through the next action') is read and passes, and a TEST-ONLY copy of it reading 'through the next
 * pass' fails. Not read here, as in B13: A01's production contract items, which carry no structured source. Its limit is the reader's: it
 * sees words, not meaning.
 */
const ACTION_WORDS_BEYOND_THEIR_ROWS: Record<string, string> = {}
/** The specific action classes an item's value or quoted evidence names that no row it cites names. */
const actionClassesBeyondCitedRows = (item: any): string[] => {
    const values: string[] = Array.isArray(item.value) ? item.value.map(String) : typeof item.value === 'string' ? [item.value] : []
    const named = actionClassesIn([...values, ...quotations(String(item.basisEvidence ?? ''))].join(' | '))
    const cited = actionClassesIn(citedRowTexts(item).join(' | '))
    return named.filter(actionClass => !cited.includes(actionClass))
}
test("B13c (A02 package W3, 11 November 2026): no restatement's value or quoted evidence names an action word its cited rows lack (both TEST-ONLY draft stores); A02's 04.b passes, its 'through the next pass' copy fails", () => {
    const found: string[] = []
    let itemsRead = 0
    for (const contracts of [a02Store.contracts, store.contracts]) {
        for (const contract of contracts) {
            for (const item of contract.items as any[]) {
                itemsRead++
                const beyond = actionClassesBeyondCitedRows(item)
                if (beyond.length) found.push(`${item.itemId} ${beyond.join(',')}`)
            }
        }
    }
    assert.ok(itemsRead >= 20 && a02Store.contracts.length === 1, `the check read both stores (${itemsRead} items)`)
    assert.deepEqual(found.sort(), Object.keys(ACTION_WORDS_BEYOND_THEIR_ROWS).sort(), 'the items naming an action word their cited rows lack are exactly the pinned list (empty)')

    // A02's control value is read, names only the generic 'action', and passes.
    const control = (a02Store.contracts[0]!.items as any[]).find(item => item.itemId === 'RPC-002-04.b')
    assert.equal(control?.value, 'retains possession through the next action')
    assert.deepEqual([actionClassesIn(control.value), namesGenericAction(control.value), actionClassesBeyondCitedRows(control)], [[], true, []])
    // Negative controls (TEST-ONLY copies, never written): its value, or its quoted evidence, reading 'through the next pass' fails; so does a dribble.
    const doctored = (alter: (item: any) => void) => {
        const item = copy(control)
        alter(item)
        return actionClassesBeyondCitedRows(item)
    }
    assert.deepEqual(doctored(item => (item.value = 'retains possession through the next pass')), ['pass'], "a copy reading 'through the next pass' fails")
    assert.deepEqual(doctored(item => (item.basisEvidence = '"retains possession through the next pass" (RPC-PROP-133)')), ['pass'], 'its quoted evidence is read too')
    assert.deepEqual(doctored(item => (item.value = 'retains possession through the next dribble')), ['dribble'])
    // A word the cited rows do name in its class passes: the gate event's own row names passing.
    assert.deepEqual(doctored(item => ((item.value = 'passes through the gate'), (item.source = [{ file: 'x', table: 'controlled_vocabulary', text: 'The ball is passed or dribbled through a pair of cones or poles.' }]))), [])
})

console.log = quiet
console.log(`requirement-bindings unit tests: ${passed} passed.`)
