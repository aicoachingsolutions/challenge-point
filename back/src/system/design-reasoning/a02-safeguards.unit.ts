/**
 * **The isolated A02 foundational test, slices S3, S4 and S6: the reasoning-disconnection safeguards, the quota runs and the earliest
 * consequential blocker** (stage 9; DESIGN-9 sections 3, 4 and 6; Christian's authorization, the reply about A02 pasted 10 November 2026, sections 3, 5 and 9).
 * TEST-ONLY review evidence: nothing here is served, written to production knowledge, or an authorization.
 *
 * Every run goes through the handoff (`runHandoff`) and the real chain wiring (`handoff-chain.unit.ts`); the safeguard check is the pure
 * stage file `safeguards.ts`, fed by `safeguardRunOf` with what the test states (the authorized set and kind of the record, the clauses of
 * the cited approved row, an engine rule's attribution). Every value pinned here was measured first (the slice's notes give the measurement).
 *
 * The runs:
 *   - the experiment path (the request consumes Steps 1 and 2): the five A02 cases; the quota runs (S4: the DRAFT record's authorized set
 *     holds one or two TEST-ONLY stand-in manipulations, the record route with the TEST-ONLY size-rule bypass, on A02-0 and on A02-D); the
 *     dependency arms (Step 1's primary swapped to GP-002 in a TEST copy of the design knowledge; GF2's GP-015 cell moved to GF7 there; RPC-002's
 *     restatement mutated through a TEST-ONLY copy of its draft-store folder); the run consumed without the restatement; the same runs under
 *     reworded goal wording (test 5);
 *   - the controls: the lone manipulation without the bypass (the size rule refuses it), a set of two without the bypass (inside 2 to 4, so
 *     the switch changes nothing for it: measured, R4-02), the CAR converse of test 6, and a TEST-ONLY selectFor wrapper that drops the
 *     upstream decisions (test 2);
 *   - the legacy route (nothing consumed), reported only: A02 with the production records (the known failure), A02 on the chain's own route
 *     with the TEST-ONLY empty record, A02 placed, the dependency arms' legacy bites, and the census of the 13 goals through the handoff's own
 *     cases and its C4 variant.
 *
 * Tests: 1-7 of DESIGN-9 section 3 (each with its bite), the quota runs and their triples (section 4), the disposition table, the blocker
 * sequence (section 6), the report, registration. Under A02_SAFEGUARDS_OUT=<file> the report is also written there (for reading only); under
 * A02_SAFEGUARDS_MEASURE=<file> every finding of every run is written there (the measurement the pins were taken from).
 *
 * Imported by a02-evidence.unit.ts (slice B4: the evidence folder and the A02/TA02 comparison), which reads the runs built here and the report's
 * lines; imported, the runs are built and none of the tests below runs (they run only when this file itself is run).
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-safeguards.unit.ts
 */
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadDraftStore } from '../derivation/draft-store'
import * as boundedSelection from '../derivation/run-bounded-selection'
import { buildActivity } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { guidedGoalText, guidedSelectionHints } from '../sport-module/guided-selection'
import { generateSelection } from '../test-library/generateSelection'
import { testLibraryRegistry } from '../test-library/library/registry'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { isSelectionPackageCompatible } from '../test-library/selection-compatibility'
import { CaseInput, ChainAnswer, ChainRequest, HandoffChain, HandoffInputs, HandoffResult, runHandoff, validateHandoffInputs } from './handoff'
import { chainWith, holdsGenderedPronoun, realChain } from './handoff-chain.unit'
import { cell, committedKnowledge, DesignKnowledge } from './knowledge'
import { runStage1 } from './stage1'
import {
    blockerSequence,
    classOf,
    countsByGroup,
    DECISION_ROWS,
    detectedByVerdict,
    DISPOSITION,
    dispositionOf,
    EngineRuleAttribution,
    Finding,
    OpenDisconnection,
    ownershipMessage,
    ownershipOf,
    OWNERSHIP_TABLE,
    ruleOfReasons,
    SafeguardFacts,
    SafeguardRun,
    safeguardRunOf,
    safeguardsText,
    stale,
    Stop,
    unlisted,
} from './safeguards'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
/** Run itself (npm test runs it so), the tests run; imported (by a02-evidence.unit.ts, for the runs), none does (B4). */
const MAIN = require.main === module
function test(name: string, run: () => void): void {
    if (!MAIN) return
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
if (MAIN) quiet(`the isolated A02 foundational test, slices S3, S4 and S6 (Christian's authorization: the reply about A02, pasted 10 November 2026)`)

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const DRAFTS = path.join(WT, 'docs', 'audits', 'drafts')
const STORE = 'a02-composition'
const CONTRACT = 'restated:RPC-002'
const ROW = 'RPC-PROP-133'
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))
const json = (v: unknown) => JSON.stringify(v)
const C = (s: string) => `tl-v0-constraint-${s}`

// ---------------------------------------------------------------------------------------------------------------------------------------
// The inputs: the A02 review data (as a02.unit.ts composes it) and the handoff's own data (for the legacy census)
// ---------------------------------------------------------------------------------------------------------------------------------------

const handoffData = readJson(path.join(HERE, 'handoff-inputs.review.json'))
const raw = readJson(path.join(HERE, 'a02-inputs.review.json'))
const composed = (cases: unknown[] = raw.cases) => ({
    standing: raw.standing,
    rulings: [...raw.borrowed.rulings.map((id: string) => handoffData.rulings.find((r: { id: string }) => r.id === id)), ...raw.rulings],
    cases,
    grading: handoffData.grading,
})
const inputs: HandoffInputs = validateHandoffInputs(composed())
const handoffInputs: HandoffInputs = validateHandoffInputs(handoffData)
const k = committedKnowledge()
const caseOf = (id: string, from: HandoffInputs = inputs): CaseInput => copy(from.cases.find((c) => c.id === id)!)
const words = (id: string): string[] => inputs.rulings.find((r) => r.id === id)!.words
/** Christian's failure-source categories (Christian's words, in Christian's order); index 0 is the sentence that introduces them. */
export const CATEGORIES = words('A02-10NOV-FAILURE-SOURCES')

/** The clauses of the cited approved row and the items of our restatement that constitute each (read from the store: selector type=<clause>). */
const store = loadDraftStore(STORE)
const contract = store.contracts.find((c) => c.contractId === CONTRACT)!
const clausesOf = (): Array<{ clause: string; items: string[] }> => {
    const out: Array<{ clause: string; items: string[] }> = []
    for (const item of contract.items as any[]) {
        const selector = String(item.selector)
        if (selector.indexOf('type=') !== 0) continue
        const clause = selector.slice('type='.length)
        const at = out.find((x) => x.clause === clause)
        if (at) at.items.push(String(item.itemId))
        else out.push({ clause, items: [String(item.itemId)] })
    }
    return out
}
const CLAUSES = clausesOf()
export const SCORING = { contractId: CONTRACT, rowId: ROW, clauses: CLAUSES }

// ---------------------------------------------------------------------------------------------------------------------------------------
// TEST-ONLY copies of the draft-store folder (each held to the store's own gate)
// ---------------------------------------------------------------------------------------------------------------------------------------

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-safeguards-'))
let storeCount = 0
const admitted: string[] = []
function storeCopy(change: (contractFile: any, recordFile: any) => void, withContract = true): string {
    const dir = path.join(TMP, `store-${++storeCount}`)
    fs.mkdirSync(dir)
    const c = readJson(path.join(DRAFTS, STORE, 'rpc-002-contract.DRAFT.json'))
    const r = readJson(path.join(DRAFTS, STORE, 'a02-authorization.DRAFT.json'))
    change(c, r)
    if (withContract) fs.writeFileSync(path.join(dir, 'rpc-002-contract.DRAFT.json'), JSON.stringify(c, null, 2))
    fs.writeFileSync(path.join(dir, 'a02-authorization.DRAFT.json'), JSON.stringify(r, null, 2))
    // The gate holds the copy (D2-15): a copy the store refuses throws here.
    const s = loadDraftStore(dir)
    admitted.push(`${path.basename(dir)}: ${s.files.join(', ')}`)
    return dir
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The quota runs' cases (S4): the manipulation(s) only in the DRAFT record's authorized set (the record route), never placed
// ---------------------------------------------------------------------------------------------------------------------------------------

export const QUOTA_SETS: Array<[string, string[]]> = [
    ['NP', [C('neutral-player-condition')]],
    ['WZA', [C('wide-zone-advantage')]],
    ['TR', [C('turnover-reward')]],
    ['CDC', [C('central-density-condition')]],
    ['NP+WZA', [C('neutral-player-condition'), C('wide-zone-advantage')]],
    ['NP+TR', [C('neutral-player-condition'), C('turnover-reward')]],
    ['CDC+IR', [C('central-density-condition'), C('interception-reward')]],
]
const setOf = (name: string): string[] => QUOTA_SETS.find((x) => x[0] === name)![1]
const STAND_IN_FINDING = (set: string[]) =>
    `TEST-ONLY relationship stand-in (TEST ASSUMPTION), not knowledge: ${set.join(', ')} authorized here only to exercise the numerical size rule and the kept checks; no manipulation has an authorized relationship to RPC-002 and GP-015 in held knowledge`
const quotaStores = new Map<string, string>()
const quotaStoreOf = (name: string): string => {
    if (!quotaStores.has(name))
        quotaStores.set(
            name,
            storeCopy((_, r) => {
                r.record.authorizedConstraints = [...setOf(name)]
                r.record.authorizedConstraintsFinding = STAND_IN_FINDING(setOf(name))
            }),
        )
    return quotaStores.get(name)!
}
const RELATIONSHIP = { ref: 'TEST-ONLY-RELATIONSHIP-S4', label: 'TEST ASSUMPTION' as const, why: 'a stand-in for an authorized relationship of the manipulation to RPC-002 and GP-015, which no held knowledge provides; never knowledge' }
function quotaCase(name: string, bypass: boolean, baseId = 'A02-0'): CaseInput {
    const c = caseOf(baseId)
    c.id = `S4-${name}${bypass ? '' : '/no-bypass'}${baseId === 'A02-0' ? '' : `@${baseId}`}`
    c.label = `TEST-ONLY quota run: ${setOf(name).join(', ')} in the DRAFT record's authorized set (a stand-in, never knowledge)${bypass ? ', the size rule bypassed' : ''}; base ${baseId}`
    c.resultStanding = 'TEST_ONLY_TREATMENT_NEVER_THE_A02_CONFIGURATION'
    c.chain.draftStore = quotaStoreOf(name)
    c.testOnlyTreatments = c.testOnlyTreatments.map((t) =>
        t.kind === 'DRAFT_STORE'
            ? { ...t, id: 'TT-DRAFT-STORE-SET', what: `a TEST-ONLY copy of the draft store ${STORE} whose DRAFT record authorizes ${setOf(name).join(', ')} (no ruling field filled; its finding names a TEST-ONLY relationship stand-in)`, effect: 'the record route governs the constraints with that set', why: 'to test one and two manipulations without the numerical quota; the set is a stand-in, never knowledge', rulingRefs: ['A02-10NOV-QUOTA'] }
            : t,
    )
    if (bypass)
        c.testOnlyTreatments.push({ id: 'TT-SIZE-RULE-BYPASS', kind: 'SIZE_RULE_BYPASS', what: 'the numerical size rule (2 to 4 constraints) bypassed for the record route\'s authorized set, and nothing else', effect: 'the selector also tries the set\'s own size, and its contract admits 1 to that size; every other check runs and enforces', why: 'the authorization\'s section 5', label: 'TEST-ONLY', rulingRefs: ['A02-10NOV-QUOTA'] })
    c.rulings = [...c.rulings, { ref: 'A02-10NOV-QUOTA', entersAs: 'REPORT_ONLY', how: 'the numerical size rule bypassed for the TEST-ONLY set only; every other check kept and enforced; the role mix and the foundation clause reported with source and authority' }]
    c.proposedManipulations = setOf(name).map((m, n) => ({ id: `PM-S4-${n + 1}`, purpose: 'TEST-ONLY: a manipulation in the record\'s authorized set, to exercise the size rule and the kept checks', manipulation: m, relationship: { ...RELATIONSHIP }, entersBy: 'RECORD' as const }))
    return c
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The runs
// ---------------------------------------------------------------------------------------------------------------------------------------

export type Kind = 'EXPERIMENT' | 'CONTROL' | 'LEGACY'
export interface Run {
    id: string
    kind: Kind
    label: string
    result: HandoffResult
    request: ChainRequest | null
    answer: ChainAnswer | null
    run: SafeguardRun
    findings: Finding[]
}
export const runs = new Map<string, Run>()
const productionRecord = (goal: string) => learningGoalAuthorizations().find((r) => r.learningGoalId === goal) ?? null

/** One case through the handoff and the real chain; the chain's answer captured; the safeguard run assembled from the test's facts. */
function runCase(c: CaseInput, kind: Kind, label: string, facts: Partial<SafeguardFacts> & { attribute?: (r: HandoffResult, a: ChainAnswer | null) => EngineRuleAttribution | null } = {}, chain: HandoffChain = realChain, kk: DesignKnowledge = k, from: HandoffInputs = inputs): Run {
    let answer: ChainAnswer | null = null
    let request: ChainRequest | null = null
    let consumed = false
    const capture: HandoffChain = {
        build: (r) => {
            consumed = r.consume !== undefined
            request = copy(r)
            answer = chain.build(r)
            return answer
        },
    }
    const result = runHandoff(c, from, capture, kk)
    const full: SafeguardFacts = {
        authorizedSet: facts.authorizedSet === undefined ? [] : facts.authorizedSet,
        recordKind: facts.recordKind ?? 'TEST_ONLY_RECORD',
        standIns: facts.standIns ?? [],
        scoring: facts.scoring === undefined ? (kind === 'LEGACY' ? null : SCORING) : facts.scoring,
        engineRule: facts.attribute ? facts.attribute(result, answer) : null,
    }
    const run = safeguardRunOf(result, answer, consumed, full)
    const entry: Run = { id: c.id, kind, label, result, request, answer, run, findings: ownershipOf(run) }
    runs.set(c.id, entry)
    return entry
}
export const at = (id: string): Run => {
    const r = runs.get(id)
    assert.ok(r, `no run ${id}`)
    return r
}
export const verdictOf = (id: string, row: string, clause: string | null = null): string => at(id).findings.find((f) => f.row === row && f.clause === clause)?.verdict ?? 'ABSENT'

// The rewordings (test 5): the goal's descriptive wording rewritten in the knowledge copy Steps 1 and 2 read AND in the planning-model row
// the chain reads (in memory; restored in finally; the restore asserted).
const FIELDS = ['Learning Goal', 'Coach Definition']
const row: any = sessionPlanningModel.learningGoal('A02')
const SAVED: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f, String(row[f])]))
const WORDINGS: Record<string, () => Record<string, string>> = {
    reversed: () => Object.fromEntries(FIELDS.map((f) => [f, `Reworded ${SAVED[f].split('').reverse().join('')}`])),
    neutral: () => ({ 'Learning Goal': 'Xq', 'Coach Definition': 'Zz yy.' }),
    pressure: () => ({ 'Learning Goal': 'Play Through Pressure', 'Coach Definition': 'Continue progressing in immediate pressure.' }),
}
const restores: string[] = []
function reworded<T>(name: string, f: (kk: DesignKnowledge) => T): T {
    const replacement = WORDINGS[name]()
    const kk = committedKnowledge()
    Object.assign(kk.planning.learning_goals.find((g) => cell(g, 'ID') === 'A02') as Record<string, unknown>, replacement)
    const before = guidedGoalText('A02')
    try {
        Object.assign(row, replacement)
        assert.equal(guidedGoalText('A02'), `${replacement['Learning Goal']}. ${replacement['Coach Definition']}`, 'the rewrite reached the text the chain reads')
        return f(kk)
    } finally {
        Object.assign(row, SAVED)
        assert.equal(guidedGoalText('A02'), before, `the wording ${name} is restored`)
        restores.push(name)
    }
}

// Attribution (S4 triple ii): the exported package check re-run on the run's form, each lens combination of the run's lens pool and the set.
const archetypeOf = (formId: string) => testLibraryRegistry.archetypes().find((a: any) => a.game_form_id === formId) as any
const lensOf = (id: string) => testLibraryRegistry.affordanceLenses().find((l: any) => l.id === id) as any
const constraintOf = (id: string) => testLibraryRegistry.selectableConstraints().find((x: any) => x.id === id) as any
/** k-subsets in index order, as the selector enumerates them (generateSelection.ts `combinations`). */
function subsets<T>(items: T[], size: number): T[][] {
    const out: T[][] = []
    const walk = (start: number, acc: T[]) => {
        if (acc.length === size) return void out.push([...acc])
        for (let i = start; i < items.length; i++) walk(i + 1, [...acc, items[i]])
    }
    walk(0, [])
    return out
}
export const attributions = new Map<string, { pool: string[]; perCombo: string[] }>()
/**
 * The role mix on these runs, read from the code (R3-09): a set of 1 or 2 is enumerated only whole (generateSelection.ts:835-836 skips every
 * size larger than the pool), its role needs are read over the pool (:827), and the whole pool holds every role it needs (:590-612).
 */
const ROLE_MIX_PASSES = 'the role mix refuses no set run here: a set of 1 or 2 is enumerated only whole, and its role needs are read over the pool (generateSelection.ts:827, :835-836, :590-612)'
function attributeWith(pool: () => string[], set: string[], bypass: boolean) {
    return (r: HandoffResult): EngineRuleAttribution | null => {
        if (!r.chain || r.chain.stage !== 'selection') return null
        if (!bypass && set.length < 2) return { rule: 'SIZE_RULE', how: `no combination was enumerated: the set holds ${set.length} and, without the bypass, the sizes enumerated are 2 to 4 (generateSelection.ts:835-836)` }
        const lenses = pool()
        const combos = [...subsets(lenses, 2), ...subsets(lenses, 3)]
        const results = combos.map((lc) => isSelectionPackageCompatible({ archetype: archetypeOf(String(r.form.formId)), affordanceLenses: lc.map(lensOf), constraints: set.map(constraintOf), requireShaping: false }))
        attributions.set(r.caseId, { pool: lenses, perCombo: results.map((x, n) => `${combos[n].map((l) => l.replace('tl-v0-lens-', '')).join('+')}: ${x.compatible ? 'compatible' : x.reasons.join(' | ')}`) })
        if (results.some((x) => x.compatible)) return { rule: null, how: `the package check admits ${results.filter((x) => x.compatible).length} of ${combos.length} lens combinations, so it is not what refused (${ROLE_MIX_PASSES})` }
        const rule = ruleOfReasons(results.flatMap((x) => x.reasons))
        return { rule: rule ? rule.id : null, how: `the exported package check re-run on ${r.form.formId} and each of the ${combos.length} lens combinations of the run's lens pool with the set: every one first refused with ${rule ? `the ${rule.id} reason` : 'reasons no single check owns'} (the check returns the first reason it meets, selection-compatibility.ts:89-106; ${ROLE_MIX_PASSES}; the gap's unfilled roles are the pool's, never the cause)` }
    }
}
const lensPoolOf = (id: string) => () => {
    const a = at(id).answer
    assert.ok(a && a.observed && a.observed.lensIds.length === 3, `${id}: its committed lens pool (3 lenses) is read`)
    return [...a.observed.lensIds]
}

const T0 = Date.now()
const LEGACY_FACTS_NONE = { authorizedSet: null, recordKind: 'NONE' as const }
const withoutConsumption = (c: CaseInput, id: string, keepStore = true): CaseInput => {
    c.id = id
    c.resultStanding = 'LEGACY_ROUTE_REPORTED_ONLY'
    c.testOnlyTreatments = c.testOnlyTreatments.filter((t) => t.kind !== 'CONSUMED_STEPS' && (keepStore || t.kind !== 'DRAFT_STORE'))
    if (!keepStore) c.chain.draftStore = null
    return c
}
const observing = chainWith({ observeOnly: true })
/** Test 6's converse: a TEST copy of the design knowledge with GP-015's CAR Essential ratings changed from E to S (consulted in Step 1 only). */
const CAR_KNOWLEDGE: DesignKnowledge = (() => {
    const kk = committedKnowledge()
    const car = kk.car.ratings.find((x) => cell(x, 'game_problem_id') === 'GP-015') as Record<string, unknown>
    for (const requirement of ['FOI', 'OP', 'SA', 'CIO']) car[requirement] = 'S'
    return kk
})()

function buildAll(): void {
    // The experiment path: the five cases.
    for (const id of ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D']) runCase(caseOf(id), 'EXPERIMENT', inputs.cases.find((c) => c.id === id)!.label)
    // The quota runs (S4), on A02-0 and on A02-D; the lone manipulation also without the bypass (a control).
    for (const [name, set] of QUOTA_SETS) runCase(quotaCase(name, true), 'EXPERIMENT', `quota run ${name}`, { authorizedSet: set, attribute: attributeWith(lensPoolOf('A02-0'), set, true) })
    runCase(quotaCase('NP', false), 'CONTROL', 'quota control: the lone manipulation without the bypass', { authorizedSet: setOf('NP'), attribute: attributeWith(lensPoolOf('A02-0'), setOf('NP'), false) })
    // R4-02 (review, batch A2): a set of two lies inside the 2-to-4 quota, so the switch should change nothing for it; measured, not assumed.
    runCase(quotaCase('NP+WZA', false), 'CONTROL', 'quota control: two manipulations without the bypass (a set inside 2 to 4)', { authorizedSet: setOf('NP+WZA'), attribute: attributeWith(lensPoolOf('A02-0'), setOf('NP+WZA'), false) })
    for (const name of ['NP', 'NP+WZA']) runCase(quotaCase(name, true, 'A02-D'), 'EXPERIMENT', `quota run ${name} on A02-D`, { authorizedSet: setOf(name) })
    // Dependency arms (tests 3 and 4) and the stop sequence's middle path (S6).
    const swapped = (gp: string): DesignKnowledge => {
        const kk = committedKnowledge()
        ;(kk.planning.engine_translation.find((x) => cell(x, 'Learning Goal ID') === 'A02') as Record<string, unknown>)['Primary GP IDs'] = gp
        return kk
    }
    for (const gp of ['GP-002', 'GP-001']) {
        const c = caseOf('A02-0')
        c.id = gp
        c.label = `A02-0 with Step 1's primary swapped to ${gp} in a TEST copy of the design knowledge (TEST ASSUMPTION)`
        runCase(c, 'EXPERIMENT', c.label, {}, realChain, swapped(gp))
        runCase(withoutConsumption(caseOf('A02-0'), `${gp}/legacy`), 'LEGACY', `the chain's own route on the same swapped knowledge`, {}, observing, swapped(gp))
    }
    const moved = (): DesignKnowledge => {
        const kk = committedKnowledge()
        ;(kk.sportModule.game_forms.find((x) => cell(x, 'game_form_id') === 'GF2') as Record<string, unknown>)['primary_game_problem_ids'] = 'GP-001'
        const gf7 = kk.sportModule.game_forms.find((x) => cell(x, 'game_form_id') === 'GF7') as Record<string, unknown>
        gf7['primary_game_problem_ids'] = `${String(gf7['primary_game_problem_ids'])}; GP-015`
        return kk
    }
    {
        const c = caseOf('A02-0')
        c.id = 'GF7-CELL'
        c.label = 'A02-0 with GF2\'s GP-015 cell moved to GF7 in a TEST copy of the design knowledge (TEST ASSUMPTION)'
        runCase(c, 'EXPERIMENT', c.label, {}, realChain, moved())
        runCase(withoutConsumption(caseOf('A02-0'), 'GF7-CELL/legacy'), 'LEGACY', `the chain's own route on the same moved cell`, {}, observing, moved())
    }
    const narrowed = storeCopy((c) => {
        c.contractEntry.result.items.find((i: any) => i.id === 'RPC-002-01.a').value = ['line_crossed']
    })
    const removed = storeCopy((c) => {
        const item = c.contractEntry.result.items.find((i: any) => i.id === 'RPC-002-01.a')
        item.value = item.value.filter((v: string) => v !== 'line_crossed')
    })
    for (const [id, dir, label] of [
        ['A02-2/narrowed', narrowed, 'A02-2 with our restated events narrowed to line_crossed, through a TEST-ONLY copy of the store folder'],
        ['A02-2/no-line-crossed', removed, 'A02-2 with line_crossed removed from our restated events (a cited relationship removed), through a TEST-ONLY copy of the store folder'],
    ]) {
        const c = caseOf('A02-2')
        c.id = id
        c.chain.draftStore = dir
        runCase(c, 'EXPERIMENT', label)
    }
    {
        const c = caseOf('A02-0')
        c.id = 'NO-RESTATEMENT'
        c.chain.draftStore = storeCopy(() => undefined, false)
        runCase(c, 'EXPERIMENT', 'A02-0 consumed with the DRAFT record only: no restatement of RPC-002 in the store')
    }
    // Test 6's converse: GP-015's CAR Essential ratings changed in a TEST copy of the design knowledge (consulted in Step 1 only).
    {
        const c = caseOf('A02-2')
        c.id = 'A02-2/CAR'
        runCase(c, 'CONTROL', 'A02-2 with GP-015\'s CAR ratings changed from E to S in a TEST copy (the converse of test 6)', {}, realChain, CAR_KNOWLEDGE)
    }
    // The legacy route (nothing consumed).
    runCase(withoutConsumption(caseOf('A02-0'), 'L1', false), 'LEGACY', 'A02 on the production records, no draft store, nothing consumed (the route the handoff\'s C4 runs)', LEGACY_FACTS_NONE)
    runCase(withoutConsumption(caseOf('A02-0'), 'L2'), 'LEGACY', 'A02 on the chain\'s own route with the TEST-ONLY empty record: nothing consumed, nothing placed', {}, observing)
    runCase(withoutConsumption(caseOf('A02-0'), 'L3'), 'LEGACY', 'A02 with the handoff placing Step 2\'s form over the chain\'s own pick (the handoff\'s earlier route)')
    // The census, through the handoff's own cases and its C4 variant (production records).
    for (const id of ['A01', 'TA01', 'A05-0']) {
        const c = caseOf(id, handoffInputs)
        const facts: Partial<SafeguardFacts> =
            id === 'A01'
                ? { authorizedSet: [...(productionRecord('A01')?.authorizedConstraints ?? [])], recordKind: 'CHRISTIANS_RECORD' }
                : c.record
                  ? { authorizedSet: [...c.record.authorizedConstraints], recordKind: 'TEST_ONLY_RECORD' }
                  : LEGACY_FACTS_NONE
        runCase(c, 'LEGACY', `the handoff's case ${id}`, facts, realChain, k, handoffInputs)
    }
    for (const goal of ['D02', 'TA02', 'A03', 'A04', 'A06', 'D01', 'D03', 'TD01', 'TD02']) {
        const c = caseOf('TA01', handoffInputs)
        c.id = goal
        c.goalId = goal
        runCase(c, 'LEGACY', `${goal} as the handoff's C4 runs it (its form from Step 2, production records)`, LEGACY_FACTS_NONE, realChain, k, handoffInputs)
    }
    // Test 5: the same runs under two rewordings, with the legacy route's own form as the positive control.
    for (const name of ['reversed', 'neutral'])
        reworded(name, (kk) => {
            for (const id of ['A02-0', 'A02-1', 'A02-2']) {
                const c = caseOf(id)
                c.id = `${id}~${name}`
                runCase(c, 'EXPERIMENT', `${id} under the ${name} wording`, {}, realChain, kk)
            }
            for (const [setName, set] of QUOTA_SETS) {
                const c = quotaCase(setName, true)
                c.id = `${c.id}~${name}`
                runCase(c, 'EXPERIMENT', `quota run ${setName} under the ${name} wording`, { authorizedSet: set, attribute: attributeWith(lensPoolOf(`A02-0~${name}`), set, true) }, realChain, kk)
            }
            runCase(withoutConsumption(caseOf('A02-0'), `L2~${name}`), 'LEGACY', `the chain's own route under the ${name} wording (the positive control)`, {}, observing, kk)
        })
    // Test 2: a TEST-ONLY selectFor wrapper that drops the upstream decisions, on a wording where the chain's own pick equals Step 2's form.
    reworded('pressure', (kk) => {
        const c = caseOf('A02-0')
        c.id = 'A02-0~pressure'
        runCase(c, 'EXPERIMENT', 'A02-0 under the wording in immediate pressure (the control of the wrapper)', {}, realChain, kk)
        runCase(withoutConsumption(caseOf('A02-0'), 'L2~pressure'), 'LEGACY', 'the chain\'s own route under the wording in immediate pressure', {}, observing, kk)
        const original = boundedSelection.selectFor
        const wrapper = (...args: Parameters<typeof original>) => original(args[0], args[1], args[2], args[3], args[4])
        ;(boundedSelection as any).selectFor = wrapper
        try {
            const w = caseOf('A02-0')
            w.id = 'W-DROPS-UPSTREAM'
            runCase(w, 'CONTROL', 'A02-0 under the same wording with a TEST-ONLY selectFor wrapper that drops the upstream decisions', {}, realChain, kk)
        } finally {
            ;(boundedSelection as any).selectFor = original
        }
        assert.equal(boundedSelection.selectFor, original, 'the wrapper is removed')
    })
}

// A01, built by the production entry before and after every run of this file (S4: A01 unchanged in every case).
const none = Object.fromEntries(specializedRoleNames().map((role) => [role, 0]))
const A01_REQUEST: any = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [specializedRoleNames()[0]]: 1 }, objects: { goal: { count: 0 } } } }
const a01Build = () => buildActivity(A01_REQUEST)
export const a01Hash = () => crypto.createHash('sha256').update(json(a01Build())).digest('hex')
/**
 * A01's build as main builds it, measured at 0b60f26, the commit this branch starts from (main 9919ea3 merged into the isolated handoff branch,
 * whose own regression found its behaviour equal to main's; its behaviour snapshot is this branch's baseline): that commit's back/ and docs/
 * trees extracted by git archive into scratch, the worktree's node_modules linked in, and the same request (A01_REQUEST) built by the
 * production entry and hashed the same way (batch A2 of the review, 10 November 2026). The build of this tree must equal it (S4).
 */
export const A01_MAIN_SHA256 = 'e526ec8000a968e5d17302c7a15096cec66746ef6ea339a9cfda3f923ecd8a97'
export const A01_BEFORE = a01Hash()
buildAll()
export const A01_AFTER = a01Hash()
const BUILD_MS = Date.now() - T0
quiet(`  (${runs.size} runs built in ${BUILD_MS} ms)`)

/** Under A02_SAFEGUARDS_MEASURE=<file>: every finding of every run, written there (called at the end of the file). */
function writeMeasurement(file: string): void {
    const lines: string[] = []
    for (const r of runs.values()) {
        lines.push(`== ${r.id} [${r.kind}] stop ${r.result.chain ? `${r.result.chain.outcome} ${r.result.chain.stage}` : `handoff: ${r.result.form.stop}`}; reasons ${json(r.result.chain?.reasons ?? [])}`)
        lines.push(`   account form ${r.run.chain?.form} own ${json(r.run.chain?.ownPick)} gp ${r.run.chain?.gameProblemStatus} ${r.run.chain?.gameProblemId} ctx ${r.run.chain?.contextId} lenses ${json(r.run.chain?.lenses)} constraints ${json(r.run.chain?.constraints)} authority ${r.run.chain?.constraintAuthority} display ${r.run.chain?.contextInThisActivity} state ${json(r.run.chain?.scoringCondition)}`)
        if (r.run.engineRule) lines.push(`   engine rule ${json(r.run.engineRule)}`)
        if (attributions.has(r.id)) lines.push(`   attribution ${json(attributions.get(r.id))}`)
        for (const f of r.findings) lines.push(`   ${f.row}${f.clause ? `(${f.clause})` : ''} ${f.verdict} [${classOf(f)}] ${f.why}${f.keptRule ? ` kept ${json(f.keptRule)}` : ''}`)
        lines.push(`   checks ${dispositionOf(r.run).map((d) => `${d.id}=${d.ran}`).join('; ')}`)
        if (r.result.lines.length) lines.push(`   choice lines ${json(r.result.lines.filter((l) => l.kind === 'CHOICE').map((l) => l.lineId))}`)
        if (r.answer?.refusalDetail) lines.push(`   open lines (refusal detail) ${json(r.answer.refusalDetail.openLines.map((o) => o.lineId))}`)
        const standIn = r.result.lines.filter((l) => l.premises.some((p) => p.kind === 'STAND_IN'))
        if (standIn.length) lines.push(`   stand-in lines ${json(standIn.map((l) => [l.lineId, l.sixClass, l.label]))}`)
    }
    lines.push(`== reach (experiment runs, not NOT_REACHED, per row): ${json(reachCounts())}`)
    lines.push(`== A01 ${A01_BEFORE} ${A01_AFTER}; restores ${json(restores)}; stores ${json(admitted)}`)
    fs.writeFileSync(file, lines.join('\n'))
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The open disconnections (DESIGN-9 section 3): every one detected below, with its measured evidence; printed as open, never as a pass
// ---------------------------------------------------------------------------------------------------------------------------------------

const WORDED = (ids: string[]) => ['reversed', 'neutral'].flatMap((w) => ids.map((id) => `${id}~${w}`))
export const QUOTA_REFUSED = ['S4-WZA', 'S4-TR', 'S4-CDC', 'S4-CDC+IR']
/** Every experiment run that reached the chain (measured: every one but GP-001, which stops at the handoff). */
const REACHED_CHAIN = [
    'A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D',
    ...QUOTA_SETS.map(([name]) => `S4-${name}`), 'S4-NP@A02-D', 'S4-NP+WZA@A02-D',
    'GP-002', 'GF7-CELL', 'A02-2/narrowed', 'A02-2/no-line-crossed', 'NO-RESTATEMENT',
    ...WORDED(['A02-0', 'A02-1', 'A02-2', ...QUOTA_SETS.map(([name]) => `S4-${name}`)]), 'A02-0~pressure',
]
/** The experiment runs whose account displays the approved condition as in this activity (measured: every run past selection with RPC-002's restatement). */
const DISPLAYED = [
    'A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D', 'S4-NP', 'S4-NP+WZA', 'S4-NP+TR', 'S4-NP@A02-D', 'S4-NP+WZA@A02-D',
    'GP-002', 'GF7-CELL', 'A02-2/narrowed', 'A02-2/no-line-crossed',
    ...WORDED(['A02-0', 'A02-1', 'A02-2', 'S4-NP', 'S4-NP+WZA']), 'A02-0~pressure',
]
const LEGACY_REACHED = ['GP-002/legacy', 'GF7-CELL/legacy', 'L1', 'L2', 'L3', 'A01', 'TA01', 'A05-0', 'D02', 'TA02', 'L2~reversed', 'L2~neutral', 'L2~pressure']
const LENSES_BEFORE = 'Possession Stability Opportunity, Space Creation Opportunity, Regain Opportunity'
const LENSES_AFTER = 'Line-Breaking Opportunity, Possession Stability Opportunity, Space Creation Opportunity'

/** The rule each refused quota run was attributed to (measured: the exported package check re-run on the run's own lens pool; S4 pins it). */
const QUOTA_RULES: Record<string, string> = { 'S4-WZA': 'FOUNDATION_CLAUSE', 'S4-TR': 'FOUNDATION_CLAUSE', 'S4-CDC': 'PACKAGE_ROW_O', 'S4-CDC+IR': 'PACKAGE_ROW_O' }
const baseOf = (id: string) => id.split('~')[0]

export const OPEN_DISCONNECTIONS: OpenDisconnection[] = [
    {
        id: 'OD-HINT-GAME-PROBLEM',
        what: 'the Game Problem reading that governs the engine lens hints and matched signals is still the planning model\'s (guided-selection.ts:228), not Step 1\'s: equal by agreement on the A02 runs, different where Step 1 differs; the Step 1 value the chain carries is read by no decision of the chain (the Game Problem row reads CARRIED_NOT_READ)',
        scope: 'EXPERIMENT',
        rows: ['GAME_PROBLEM_HINTS'],
        verdicts: ['AGREES_INDEPENDENTLY', 'CONTRADICTED'],
        runs: REACHED_CHAIN,
        // Measured: CONTRADICTED only where Step 1 was swapped (GP-002); equal by agreement on every other run that reached the chain.
        pairs: REACHED_CHAIN.map((run) => ({ run, verdict: run === 'GP-002' ? ('CONTRADICTED' as const) : ('AGREES_INDEPENDENTLY' as const) })),
        evidence: 'every A02 run: the account reads APPROVED GP-015 from the planning model beside the carried Step 1 value; GP-002 (Step 1 swapped in a TEST copy): the planning model still reads GP-015 (CONTRADICTED) while the account carries GP-002. guided-selection.ts is not touched (DESIGN-9 section 0)',
    },
    {
        id: 'OD-CONTEXT',
        what: 'the context is read by the chain from the planning routing itself; no record of consuming Step 1\'s context exists (equal by agreement: both read the same routing row)',
        scope: 'EXPERIMENT',
        rows: ['CONTEXT'],
        verdicts: ['AGREES_INDEPENDENTLY'],
        runs: REACHED_CHAIN,
        evidence: 'every A02 run: the account names RPC-002, Step 1 resolves RPC-002; the upstream option carries no context (DESIGN-9 section 1 consumes the Game Problem and the form only)',
    },
    {
        id: 'OD-DISPLAY',
        what: 'the account displays the approved scoring condition as in this activity (inThisActivity true) whenever the context\'s contract is among those the build reads, whether or not any clause is carried',
        scope: 'EXPERIMENT',
        rows: ['SCORING_DISPLAY'],
        verdicts: ['CITED_NOT_CARRIED'],
        runs: DISPLAYED,
        evidence: 'build-activity.ts:641 reads only whether the context\'s contract is selected; on these runs no clause is carried, or only the control clause under a declared treatment; the requirement account reads NOT_CLASSIFIED (no requirement bindings for RPC-PROP-133), never a pass',
    },
    {
        id: 'OD-PACKAGE-LENSES',
        what: 'after the form is consumed, a kept package check that reads the wording-derived lenses decides the selection (the foundation clause\'s keyword threshold on the primary lens; row o)',
        scope: 'EXPERIMENT',
        rows: ['SELECTION_OUTCOME'],
        verdicts: ['ENGINE_RULE_DECIDED'],
        runs: [...QUOTA_REFUSED, ...WORDED(QUOTA_REFUSED)],
        pairs: [...QUOTA_REFUSED, ...WORDED(QUOTA_REFUSED)].map((run) => ({ run, verdict: 'ENGINE_RULE_DECIDED' as const, rule: QUOTA_RULES[baseOf(run)] })),
        evidence: `attributed by re-running the exported isSelectionPackageCompatible on GF2 and each of the 4 lens combinations: a lone Wide Zone Advantage or Turnover Reward is first refused by the foundation clause on every combination, Central Density Condition alone and with Interception Reward first by row o (the check returns the first reason it meets; the foundation clause runs before every package row); ${ROLE_MIX_PASSES}`,
    },
    {
        id: 'OD-WORDING-FLIP',
        what: 'wording alone decides the selection of a non-empty authorized set on the consumed form: Neutral Player with Turnover Reward is selected under the goal\'s wording and refused under a reworded one',
        scope: 'EXPERIMENT',
        rows: ['SELECTION_OUTCOME'],
        verdicts: ['ENGINE_RULE_DECIDED'],
        runs: WORDED(['S4-NP+TR']),
        pairs: WORDED(['S4-NP+TR']).map((run) => ({ run, verdict: 'ENGINE_RULE_DECIDED' as const, rule: 'PACKAGE_ROW_K' })),
        evidence: 'the reworded lenses are Line-Breaking, Possession Stability and Space Creation; row k (Turnover Reward does not support the selected affordance tag group) refuses all 4 lens combinations there, 1 of 4 on the goal\'s own lenses',
        measured: {
            before: 'the goal\'s wording: selected on GF2 with Neutral Player and Turnover Reward, then refused at knowledge (the authorized constraint Turnover Reward has no contribution contract)',
            after: 'the reversed and the neutral wording: refused at selection, NO_COMPATIBLE_COMBINATION on GF2 (row k on every lens combination); lenses none; a lone Neutral Player, which the package check admits on every lens combination of the reworded pool and which commits as S4-NP~reversed and S4-NP~neutral, is never tried: under the bypass the sizes enumerated for a set of 2 are 2 to 4, so the refusal rests on row k together with that floor for subsets',
        },
    },
    {
        id: 'OD-WORDING-LENSES',
        what: 'the engine lenses (ENGINE_LENS) follow the goal\'s wording on the consumed path; no owned decision moved with them on these runs',
        scope: 'EXPERIMENT',
        rows: [],
        verdicts: [],
        runs: WORDED(['A02-0', 'A02-1', 'A02-2', 'S4-NP', 'S4-NP+WZA']),
        evidence: 'the lens list is compared in test 5; the owned decisions, the outcome, the stage and the reasons are unchanged on these runs',
        measured: { before: LENSES_BEFORE, after: LENSES_AFTER },
    },
    {
        id: 'OD-LEGACY-AGREEMENT',
        what: 'the legacy route consumes no upstream decision: wherever its own Game Problem, context, form or constraints equal the upstream ones, they agree independently',
        scope: 'LEGACY',
        rows: ['GAME_PROBLEM', 'CONTEXT', 'GAME_FORM', 'CONSTRAINTS'],
        verdicts: ['AGREES_INDEPENDENTLY'],
        runs: LEGACY_REACHED,
        evidence: 'the production route and the handoff\'s earlier route (no upstream option): no consumption record exists on any of these runs',
    },
    {
        id: 'OD-LEGACY-VOCABULARY',
        what: 'constraints built from the goal\'s own candidate constraints, which no record authorizes (the engine labels their authority VOCABULARY_POOL; nothing is drawn from outside the goal\'s candidates)',
        scope: 'LEGACY',
        rows: ['CONSTRAINTS'],
        verdicts: ['UNAUTHORIZED_SOURCE'],
        runs: ['TA01', 'D02', 'TA02'],
        evidence: 'TA01 builds 4, D02 3 and TA02 4 constraints, each goal from its own candidate constraints, labelled VOCABULARY_POOL (types.ts:136-140: derived from wording or from a Coverage row; generateSelection.ts:155-176: a goal\'s pool is its own candidate ids, minus holds)',
    },
    {
        id: 'OD-LEGACY-GAME-PROBLEM',
        what: 'the legacy route reads its own Game Problem, which differs from Step 1\'s',
        scope: 'LEGACY',
        rows: ['GAME_PROBLEM'],
        verdicts: ['CONTRADICTED'],
        runs: ['A05-0', 'GP-002/legacy'],
        evidence: 'A05-0: the planning model reads UNRESOLVED where Step 1 resolves GP-001 by the scoped translation (reported, never switched); GP-002/legacy: the swap in the TEST copy reaches Step 1, never the chain',
    },
    {
        id: 'OD-A02-LEGACY-FORM',
        what: 'the known A02 failure: the chain selects its own GF3 from the wording against Step 2\'s SELECTED form; closed on the experiment path by the consumption, open on the production route (unchanged)',
        scope: 'LEGACY',
        rows: ['GAME_FORM'],
        verdicts: ['REFUSED_ON_OWN_CHOICE', 'CONTRADICTED'],
        runs: ['L1', 'L2', 'L3', 'GP-002/legacy', 'GF7-CELL/legacy'],
        evidence: 'L1 (production records): refused at selection on GF3; L2 (the chain\'s own route, TEST-ONLY empty record): built on GF3 and refused at knowledge; L3: the handoff placed GF2 after the selection ran on GF3; the dependency arms\' legacy bites: GF3 where Step 2 selects GF7',
    },
]

// ---------------------------------------------------------------------------------------------------------------------------------------
// Values measured first, then pinned (the slice's notes give the measurement)
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * Per decision row, the experiment runs that reach it (of 41; GP-001 stops at the handoff; a scoring clause is reached where a game is
 * built, a treatment withholds it, or the run's refusal cites its own line; the realizer's own refusal reaches realization).
 */
const REACH: Record<string, number> = {
    GAME_PROBLEM: 40,
    GAME_PROBLEM_HINTS: 40,
    CONTEXT: 40,
    GAME_FORM: 40,
    CONSTRAINTS: 40,
    SELECTION_OUTCOME: 40,
    'SCORING(origin)': 22,
    'SCORING(progression)': 12,
    'SCORING(control)': 20,
    SCORING_DISPLAY: 25,
    REALIZATION: 9,
}
/** Test 1's assertion on the legacy route with the production records (measured): it fails, naming the form first among the owned decisions. */
const L1_FAILURE = [
    `ownership: L1: the Game Problem owned by Step 1: AGREES_INDEPENDENTLY: the chain's own reading (APPROVED GP-015, the planning model, which also governs the hints) equals Step 1's, and nothing records Step 1's value as consumed`,
    `ownership: L1: Game Form eligibility and choice owned by Step 2, under D3 over CANDIDATE cells: REFUSED_ON_OWN_CHOICE: the chain refused at selection on its own choice GF3 before consuming Step 2's GF2`,
    `ownership: L1: the Representative Performance Context owned by Step 1: AGREES_INDEPENDENTLY: the chain reads the routing itself (RPC-002); it equals Step 1's, and no record of consumption exists for the context`,
].join(' | ')
/** Test 5: each reworded run with what changed against the goal's own wording (measured). */
const WORDING_CHANGES: string[] = [
    'A02-0~reversed: lenses',
    'A02-1~reversed: lenses',
    'A02-2~reversed: lenses',
    'S4-NP~reversed: lenses',
    'S4-NP+WZA~reversed: lenses',
    'S4-NP+TR~reversed: owned, stage, reasons, lenses',
    'A02-0~neutral: lenses',
    'A02-1~neutral: lenses',
    'A02-2~neutral: lenses',
    'S4-NP~neutral: lenses',
    'S4-NP+WZA~neutral: lenses',
    'S4-NP+TR~neutral: owned, stage, reasons, lenses',
]
/** S4: the lines that carry the relationship stand-in on the A02-D base (measured). */
const STAND_IN_COUNTS: Array<[string, number]> = [
    ['S4-NP@A02-D', 7],
    ['S4-NP+WZA@A02-D', 25],
]
/** The report's counts over all runs: violation verdicts and detected disconnections (measured), and the detected ones by verdict. */
const REPORT_COUNTS: number[] = [171, 118]
const DETECTED_BY_VERDICT = 'CARRIED_NOT_READ 43, ENGINE_RULE_DECIDED 14, CARRIED_UNDER_TREATMENT 5, WITHHELD_BY_TREATMENT 29, REFUSED_ON_CLAUSE_LINE 27'
/** The same counts per group, in the order the runs are built: the experiment path, the controls, the legacy route (runs, violations, detected). */
const COUNTS_BY_GROUP: number[][] = [
    [41, 105, 108],
    [4, 15, 10],
    [21, 51, 0],
]
const Q = String.fromCharCode(34)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The assertions the tests share
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * The verdicts test 1 accepts for each owned decision: the Game Form and the constraints CONSUMED; the Game Problem CARRIED_NOT_READ (the
 * chain carries Step 1's value and no decision of it reads it: a detected disconnection, never CONSUMED); each NOT_REACHED where not reached.
 */
const OWNED: Record<string, string[]> = { GAME_PROBLEM: ['CARRIED_NOT_READ', 'NOT_REACHED'], GAME_FORM: ['CONSUMED', 'NOT_REACHED'], CONSTRAINTS: ['CONSUMED', 'NOT_REACHED'] }
export const EXPERIMENT_RUNS = [...runs.values()].filter((r) => r.kind === 'EXPERIMENT').map((r) => r.id)
/** Test 1's assertion for one experiment run: each owned decision with an accepted verdict; every finding that must be listed is listed. Throws, naming each. */
export function assertExperimentRun(findings: Finding[], entries: OpenDisconnection[] = OPEN_DISCONNECTIONS): void {
    const bad = [...findings.filter((f) => OWNED[f.row] !== undefined && OWNED[f.row].indexOf(f.verdict) < 0), ...unlisted(findings, entries, ['EXPERIMENT'])]
    const messages = [...new Set(bad.map(ownershipMessage))]
    if (messages.length) throw new Error(messages.join(' | '))
}
function reachCounts(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const id of EXPERIMENT_RUNS)
        for (const f of at(id).findings) {
            const key = f.clause ? `${f.row}(${f.clause})` : f.row
            out[key] = (out[key] ?? 0) + (f.verdict === 'NOT_REACHED' ? 0 : 1)
        }
    return out
}
export const withheldOf = (id: string) => at(id).findings.filter((f) => f.verdict === 'WITHHELD_BY_TREATMENT').map((f) => String(f.clause))

// ---------------------------------------------------------------------------------------------------------------------------------------
// Test 1
// ---------------------------------------------------------------------------------------------------------------------------------------

test('1. every experiment run: the Game Form and the constraints CONSUMED, the Game Problem CARRIED_NOT_READ (each NOT_REACHED where not reached); every violation and every lens-reading engine refusal listed as an open disconnection by its measured pair, and no entry stale; the legacy entries held the same way (reported only); every WITHHELD_BY_TREATMENT pinned per run; each decision reached by at least one run', () => {
    assert.equal(EXPERIMENT_RUNS.length, 41, 'the experiment runs (measured)')
    for (const id of EXPERIMENT_RUNS) assertExperimentRun(at(id).findings)
    const experimentFindings = EXPERIMENT_RUNS.flatMap((id) => at(id).findings)
    assert.deepEqual(stale(experimentFindings, OPEN_DISCONNECTIONS.filter((e) => e.scope === 'EXPERIMENT' && e.verdicts.length)), [], 'no experiment entry names a run where it is no longer detected')
    // An entry's measured pairs name each of its runs exactly once.
    for (const e of OPEN_DISCONNECTIONS.filter((x) => x.pairs)) assert.deepEqual(e.pairs!.map((p) => p.run), e.runs, `${e.id}: one pair per run`)
    // The legacy entries (reported only) are held the same way: every legacy violation listed, and no legacy entry stale.
    const legacyFindings = [...runs.values()].filter((r) => r.kind === 'LEGACY').flatMap((r) => r.findings)
    const legacyEntries = OPEN_DISCONNECTIONS.filter((e) => e.scope === 'LEGACY')
    assert.deepEqual(unlisted(legacyFindings, legacyEntries, ['LEGACY']).map(ownershipMessage), [], 'every legacy violation listed (reported only)')
    assert.deepEqual(stale(legacyFindings, legacyEntries), [], 'no legacy entry stale')
    // Bites, each on an in-memory doctored copy of a run's own facts: a legacy finding removed makes its entry stale; a contradiction of the
    // hint-governing Game Problem on a run where none was measured fails; an engine refusal unattributed, or attributed to another rule, fails.
    assert.deepEqual(stale(legacyFindings.filter((f) => !(f.runId === 'TA01' && f.row === 'CONSTRAINTS')), legacyEntries), [{ entry: 'OD-LEGACY-VOCABULARY', run: 'TA01' }])
    const doctor = (id: string, change: (x: SafeguardRun) => void): Finding[] => {
        const x = copy(at(id).run)
        change(x)
        return ownershipOf(x)
    }
    const hintContradicted = doctor('A02-0', (x) => (x.chain!.gameProblemId = 'GP-099'))
    assert.equal(hintContradicted.find((f) => f.row === 'GAME_PROBLEM_HINTS')?.verdict, 'CONTRADICTED')
    assert.throws(() => assertExperimentRun(hintContradicted), (e: Error) => e.message.includes('ownership: A02-0: the Game Problem reading that governs the engine lens hints and matched signals'))
    assert.throws(() => assertExperimentRun(doctor('S4-WZA~reversed', (x) => (x.engineRule = null))), /ENGINE_RULE_DECIDED: refused at selection after consuming the form, by a rule not attributed to a kept check/)
    assert.throws(() => assertExperimentRun(doctor('S4-WZA~reversed', (x) => (x.engineRule = { rule: 'PACKAGE_ROW_K', how: 'doctored' }))), /ownership: S4-WZA~reversed: whether the selection commits/)
    // Every WITHHELD_BY_TREATMENT, pinned per run (a detected disconnection, never a pass).
    assert.deepEqual(
        EXPERIMENT_RUNS.filter((id) => withheldOf(id).length).map((id) => [id, withheldOf(id).join('+')]),
        [
            ['A02-1', 'origin+progression'],
            ['A02-1b', 'origin+progression'],
            ['A02-2', 'origin+progression'],
            ['A02-D', 'origin+progression+control'],
            ['S4-NP@A02-D', 'origin+progression+control'],
            ['S4-NP+WZA@A02-D', 'origin+progression+control'],
            ['A02-2/narrowed', 'origin+progression'],
            ['A02-2/no-line-crossed', 'origin+progression'],
            ['A02-1~reversed', 'origin+progression'],
            ['A02-2~reversed', 'origin+progression'],
            ['A02-1~neutral', 'origin+progression'],
            ['A02-2~neutral', 'origin+progression'],
        ],
    )
    // Every clause the run's refusal cites by its own line (REFUSED_ON_CLAUSE_LINE), and every clause carried only under a replaced declaration
    // (CARRIED_UNDER_TREATMENT), pinned per run (detected disconnections, never passes).
    const clausesWith = (id: string, verdict: string) => at(id).findings.filter((f) => f.row === 'SCORING' && f.verdict === verdict).map((f) => String(f.clause))
    const OC = 'origin+control'
    assert.deepEqual(
        EXPERIMENT_RUNS.filter((id) => clausesWith(id, 'REFUSED_ON_CLAUSE_LINE').length).map((id) => [id, clausesWith(id, 'REFUSED_ON_CLAUSE_LINE').join('+')]),
        [
            ['A02-0', OC], ['A02-1', 'control'], ['S4-NP', OC], ['S4-NP+WZA', OC],
            ['A02-0~reversed', OC], ['A02-1~reversed', 'control'], ['S4-NP~reversed', OC], ['S4-NP+WZA~reversed', OC],
            ['A02-0~neutral', OC], ['A02-1~neutral', 'control'], ['S4-NP~neutral', OC], ['S4-NP+WZA~neutral', OC],
            ['A02-0~pressure', OC],
        ],
    )
    assert.deepEqual(EXPERIMENT_RUNS.filter((id) => clausesWith(id, 'CARRIED_UNDER_TREATMENT').length).map((id) => [id, clausesWith(id, 'CARRIED_UNDER_TREATMENT').join('+')]), [['A02-1b', 'control'], ['A02-2', 'control'], ['A02-2~reversed', 'control'], ['A02-2~neutral', 'control']])
    assert.equal(experimentFindings.filter((f) => f.row === 'SCORING' && f.verdict === 'CARRIED').length, 0, 'no clause is carried without a treatment on the experiment path')
    // What it rests on (A02-2, measured): the control referent's line holds no value, so RPC-002-04.a is not resolved although a line rests on it.
    assert.deepEqual(
        [at('A02-2').run.scoring?.resting, at('A02-2').run.scoring?.resolved, at('A02-2').run.scoring?.unestablished],
        [['RPC-002-04.a', 'RPC-002-04.b'], ['RPC-002-04.b'], [{ itemId: 'RPC-002-04.a', lineId: 'c:restated:RPC-002:RPC-002-04.a::V5' }]],
    )
    // No clause is CITED_NOT_CARRIED on the experiment path (only the display is, listed above).
    assert.equal(experimentFindings.filter((f) => f.row === 'SCORING' && f.verdict === 'CITED_NOT_CARRIED').length, 0)
    // Per decision, how many experiment runs reach it (NOT_REACHED where the run stopped before the decision and its refusal cites none of the
    // clause's own lines, the realizer's own refusal reaching realization; a reached stage without its field is MISSING).
    assert.deepEqual(reachCounts(), REACH)
    for (const [row, n] of Object.entries(REACH)) assert.ok(n >= 1, `${row} is reached by at least one run`)
    assert.equal(experimentFindings.filter((f) => f.verdict === 'MISSING').length, 0)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Test 2: the known A02 failure, and a selectFor wrapper that drops the upstream decisions
// ---------------------------------------------------------------------------------------------------------------------------------------

const failureOf = (id: string): string => {
    try {
        assertExperimentRun(at(id).findings)
    } catch (error) {
        return (error as Error).message
    }
    return 'PASSED'
}
const FORM_OWNER = `Game Form eligibility and choice owned by Step 2, under D3 over CANDIDATE cells`

test(`2. the known A02 failure is detected and rejected (the authorization, section 3: the checked pathway's independent GF3 selection when Step 2 has supplied a different authorized eligibility result); a TEST-ONLY selectFor wrapper that drops the upstream decisions turns an equal-valued run's form into AGREES_INDEPENDENTLY and fails test 1`, () => {
    // The legacy route with the production records (the route the handoff's C4 runs): refused at selection on the chain's own GF3.
    assert.deepEqual([at('L1').run.chain?.form, at('L1').run.chain?.stage, verdictOf('L1', 'GAME_FORM'), verdictOf('L1', 'GAME_PROBLEM')], ['GF3', 'selection', 'REFUSED_ON_OWN_CHOICE', 'AGREES_INDEPENDENTLY'])
    assert.ok(failureOf('L1').includes(`ownership: L1: ${FORM_OWNER}: REFUSED_ON_OWN_CHOICE: the chain refused at selection on its own choice GF3 before consuming Step 2's GF2`), failureOf('L1'))
    assert.equal(failureOf('L1'), L1_FAILURE)
    // The chain's own route with the TEST-ONLY empty record (D3-12): built past selection on its own GF3, refused at knowledge.
    assert.deepEqual([at('L2').run.chain?.form, at('L2').result.chain?.reasons, verdictOf('L2', 'GAME_FORM')], ['GF3', ['the game form GF3 has no contribution contract'], 'CONTRADICTED'])
    assert.ok(failureOf('L2').includes(`ownership: L2: ${FORM_OWNER}: CONTRADICTED: the chain's own selection chose GF3 where Step 2's form is GF2`), failureOf('L2'))
    // The handoff's earlier route: GF2 placed after the selection ran on GF3.
    assert.ok(failureOf('L3').includes(`CONTRADICTED: the chain's own selection chose GF3 where Step 2's form is GF2; the handoff then placed GF2 over it, after the selection had run on GF3`), failureOf('L3'))
    // The wrapper: under the wording in immediate pressure the chain's own pick is GF2 (equal to Step 2's); consumed, the run is CONSUMED and
    // passes test 1; with the wrapper dropping upstream, the same run carries no consumption record, reads AGREES_INDEPENDENTLY and fails.
    assert.deepEqual([at('L2~pressure').run.chain?.ownPick, at('A02-0~pressure').run.chain?.form, at('W-DROPS-UPSTREAM').run.chain?.form, at('W-DROPS-UPSTREAM').run.chain?.ownPick], [['GF2'], 'GF2', 'GF2', ['GF2']])
    assert.deepEqual([verdictOf('A02-0~pressure', 'GAME_FORM'), verdictOf('W-DROPS-UPSTREAM', 'GAME_FORM'), verdictOf('W-DROPS-UPSTREAM', 'GAME_PROBLEM')], ['CONSUMED', 'AGREES_INDEPENDENTLY', 'AGREES_INDEPENDENTLY'])
    assert.equal(at('W-DROPS-UPSTREAM').result.consumption, null, 'the chain recorded no consumption')
    assert.ok(at('W-DROPS-UPSTREAM').request?.consume, 'the request still asked for consumption')
    assert.equal(failureOf('A02-0~pressure'), 'PASSED')
    assert.ok(failureOf('W-DROPS-UPSTREAM').includes(`ownership: W-DROPS-UPSTREAM: ${FORM_OWNER}: AGREES_INDEPENDENTLY: the chain's own pick GF2 equals Step 2's, and nothing records it as consumed`), failureOf('W-DROPS-UPSTREAM'))
    // The legacy Game Problem row reads AGREES_INDEPENDENTLY, never CONSUMED (D3-06).
    for (const id of ['L1', 'L2', 'L3']) assert.equal(verdictOf(id, 'GAME_PROBLEM'), 'AGREES_INDEPENDENTLY', id)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Tests 3 and 4: dependency verification
// ---------------------------------------------------------------------------------------------------------------------------------------

test('3. dependency, Game Problem: GP-002 swapped into Step 1 (TEST ASSUMPTION) is reconsidered by Step 2 (SELECTED GF7), whose form the chain consumes (GF7), while the chain carries GP-002 from Step 1 as a record no decision reads (CARRIED_NOT_READ) and the planning model\'s reading GP-015 is CONTRADICTED (an open dependency); the legacy route on the same input stays on GF3; GP-001 is reconsidered and stops before the chain', () => {
    const r = at('GP-002')
    assert.deepEqual([r.result.receive.step1?.primary, r.result.receive.step2?.status, r.result.receive.step2?.selected, r.result.receive.step2?.compatible], [['GP-002'], 'SELECTED', 'GF7', ['GF7']])
    // Reconsideration, read from Step 2's result and the account (never from a difference in outcome): Step 2's statement changed with it.
    assert.notEqual(r.result.form.premise?.note, at('A02-0').result.form.premise?.note)
    assert.deepEqual([r.result.consumption?.gameProblem?.gameProblemId, r.result.consumption?.gameProblem?.source, r.result.consumption?.form?.formId, r.result.consumption?.formCandidatesScored], ['GP-002', 'Step 1 (review pathway)', 'GF7', ['GF7']])
    assert.deepEqual([r.answer?.account?.gameProblem?.status, r.answer?.account?.gameProblem?.gameProblemId], ['APPROVED', 'GP-015'], 'the planning model\'s reading, beside the carried value')
    assert.deepEqual([verdictOf('GP-002', 'GAME_PROBLEM'), verdictOf('GP-002', 'GAME_PROBLEM_HINTS'), verdictOf('GP-002', 'GAME_FORM'), verdictOf('GP-002', 'CONSTRAINTS')], ['CARRIED_NOT_READ', 'CONTRADICTED', 'CONSUMED', 'CONSUMED'])
    assert.deepEqual([r.result.chain?.stage, r.result.chain?.reasons], ['knowledge', ['the game form GF7 has no contribution contract']])
    // The bite: the chain's own route on the same swapped knowledge selects GF3.
    const legacy = at('GP-002/legacy')
    assert.deepEqual([legacy.run.chain?.ownPick, legacy.result.chain?.reasons, verdictOf('GP-002/legacy', 'GAME_FORM')], [['GF3'], ['the game form GF3 has no contribution contract'], 'CONTRADICTED'])
    // GP-001: reconsidered (Step 2 retains three alternatives) and stopped before the chain.
    const g1 = at('GP-001')
    assert.deepEqual([g1.result.receive.step2?.status, g1.result.receive.step2?.compatible, g1.result.form.stop, g1.answer], ['COMPATIBLE_ALTERNATIVES', ['GF2', 'GF3', 'GF7'], 'alternatives retained; no basis to select', null])
    assert.ok(g1.findings.every((f) => f.verdict === 'NOT_REACHED'), 'every row NOT_REACHED')
})

test('4. dependency, relationships: GF2\'s GP-015 cell moved to GF7 (TEST copy) makes Step 2 select GF7, which the chain consumes (the legacy route stays on GF3); RPC-002\'s restated events narrowed to line_crossed (a TEST-ONLY copy of the store folder, held to its gate) change exactly the line that item shaped', () => {
    const r = at('GF7-CELL')
    assert.deepEqual([r.result.receive.step2?.status, r.result.receive.step2?.selected, r.result.consumption?.form?.formId, verdictOf('GF7-CELL', 'GAME_FORM'), r.result.chain?.reasons], ['SELECTED', 'GF7', 'GF7', 'CONSUMED', ['the game form GF7 has no contribution contract']])
    assert.deepEqual([at('GF7-CELL/legacy').run.chain?.ownPick, verdictOf('GF7-CELL/legacy', 'GAME_FORM')], [['GF3'], 'CONTRADICTED'])
    // The restatement copy passed the store's gate (each copy is loaded through loadDraftStore before use).
    assert.ok(admitted.length >= 3, 'the copies were admitted by the gate')
    // Base A02-2: game::V1 is chosen among the pair our restated events narrow the form's own to (the chain records the item NARROWS it).
    const base = at('A02-2')
    const v1 = base.answer?.lines.find((l) => l.lineId === 'game::V1')
    assert.deepEqual([v1?.kind, v1?.value, v1?.permitted, v1?.draftShapedBy], ['CHOICE', 'line_crossed', ['line_crossed', 'target_zone_entered'], [{ contractId: CONTRACT, itemId: 'RPC-002-01.a', relation: 'NARROWS' }]])
    // Narrowed: measured, the two arms do NOT stop at the same stage (DESIGN-9 expected the same stage): with one event left the derivation
    // closes game::V1 itself, and the realizer then refuses the realization-choices file's value for a line no longer open. The difference is
    // exactly that line: the open lines the chain names are the base's chosen lines without game::V1.
    const n = at('A02-2/narrowed')
    assert.deepEqual([n.result.chain?.stage, n.result.chain?.reasons], ['realization', ['realization refused', 'game::V1: the resolved game does not list this line as open, so nothing authorizes a value for it']])
    const baseChosen = base.result.lines.filter((l) => l.kind === 'CHOICE').map((l) => l.lineId)
    assert.deepEqual((n.answer?.refusalDetail?.openLines ?? []).map((o) => o.lineId).sort(), baseChosen.filter((id) => id !== 'game::V1').sort())
    assert.ok(baseChosen.indexOf('game::V1') >= 0)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Test 5: wording only
// ---------------------------------------------------------------------------------------------------------------------------------------

const ASPECTS = ['owned', 'outcome', 'stage', 'reasons', 'lenses'] as const
const aspectsOf = (r: Run): Record<(typeof ASPECTS)[number], string> => ({
    owned: json(r.findings.map((f) => `${f.row}${f.clause ? `(${f.clause})` : ''}=${f.verdict}`)),
    outcome: String(r.result.chain?.outcome),
    stage: String(r.result.chain?.stage),
    reasons: json(r.result.chain?.reasons ?? []),
    lenses: (r.run.chain?.lenses ?? []).join(', '),
})

test('5. wording only: the goal\'s wording rewritten (reversed, neutral) in the knowledge copy and in the row the chain reads, the rewrite proved to reach the chain (its own route moves from GF3 to GF2); over A02-0, A02-1, A02-2 and every quota set, every change of an owned decision, the outcome, the stage, the reasons or the lens list is entered exactly once as an open disconnection with its measured before and after (safeguard B fails on the flip)', () => {
    assert.deepEqual(restores, ['reversed', 'neutral', 'pressure'], 'each rewording restored, the restore asserted')
    assert.equal(guidedGoalText('A02'), `${SAVED['Learning Goal']}. ${SAVED['Coach Definition']}`)
    // The positive control: the chain's own route moves with the wording (the rewrite reached the chain).
    assert.deepEqual(['L2', 'L2~reversed', 'L2~neutral', 'L2~pressure'].map((id) => at(id).run.chain?.ownPick?.join(',')), ['GF3', 'GF2', 'GF2', 'GF2'])
    // Steps 1 and 2 do not move (they read no wording).
    for (const w of ['reversed', 'neutral']) assert.deepEqual(at(`A02-0~${w}`).result.receive, at('A02-0').result.receive, w)
    const changes: Array<{ run: string; aspect: string; before: string; after: string }> = []
    for (const w of ['reversed', 'neutral'])
        for (const id of ['A02-0', 'A02-1', 'A02-2', ...QUOTA_SETS.map(([name]) => `S4-${name}`)]) {
            const before = aspectsOf(at(id))
            const after = aspectsOf(at(`${id}~${w}`))
            for (const aspect of ASPECTS) if (before[aspect] !== after[aspect]) changes.push({ run: `${id}~${w}`, aspect, before: before[aspect], after: after[aspect] })
        }
    // Each change is entered exactly once: the lens list in OD-WORDING-LENSES (with its measured lists), everything else in OD-WORDING-FLIP.
    const lensesEntry = OPEN_DISCONNECTIONS.find((e) => e.id === 'OD-WORDING-LENSES')!
    const flipEntry = OPEN_DISCONNECTIONS.find((e) => e.id === 'OD-WORDING-FLIP')!
    for (const ch of changes) {
        const entries = [lensesEntry, flipEntry].filter((e) => e.runs.indexOf(ch.run) >= 0)
        assert.equal(entries.length, 1, `${ch.run} ${ch.aspect} is entered exactly once`)
        if (entries[0] === lensesEntry) assert.deepEqual([ch.aspect, ch.before, ch.after], ['lenses', lensesEntry.measured!.before, lensesEntry.measured!.after], ch.run)
    }
    for (const e of [lensesEntry, flipEntry]) for (const run of e.runs) assert.ok(changes.some((ch) => ch.run === run), `${e.id}: ${run} still changes (no stale entry)`)
    assert.deepEqual(
        [...new Set(changes.map((ch) => `${ch.run}: ${changes.filter((x) => x.run === ch.run).map((x) => x.aspect).join(', ')}`))],
        WORDING_CHANGES,
    )
    // The flip, measured: selected and refused at knowledge under the goal's wording; refused at selection by row k on every lens combination.
    assert.deepEqual([at('S4-NP+TR').result.chain?.stage, at('S4-NP+TR').run.chain?.constraints], ['knowledge', [C('neutral-player-condition'), C('turnover-reward')]])
    for (const w of ['reversed', 'neutral']) {
        const f = at(`S4-NP+TR~${w}`)
        assert.deepEqual([f.result.chain?.stage, verdictOf(`S4-NP+TR~${w}`, 'SELECTION_OUTCOME'), f.run.engineRule?.rule], ['selection', 'ENGINE_RULE_DECIDED', 'PACKAGE_ROW_K'])
    }
    // R1-05 (review, batch A2): the after arm rests on row k together with the floor of 2 for subsets. Under the bypass the sizes enumerated for
    // a set of 2 are 2 to 4 (the set's own size is added only outside 2 to 4), so a lone Neutral Player is never tried there, although the
    // package check admits it on every lens combination of the reworded pool and the lone run commits.
    const sizesLine = fs.readFileSync(path.resolve(HERE, '..', 'test-library', 'generateSelection.ts'), 'utf8').split('\n')[1037 - 1]
    assert.ok(sizesLine.includes('![2, 3, 4].includes(quotaBypassOwnSize) ? [quotaBypassOwnSize, 2, 3, 4] : [2, 3, 4]'), 'generateSelection.ts:1037: the sizes enumerated')
    for (const w of ['reversed', 'neutral']) {
        const pool = lensPoolOf(`A02-0~${w}`)()
        const lone = [...subsets(pool, 2), ...subsets(pool, 3)].map((lc) => isSelectionPackageCompatible({ archetype: archetypeOf('GF2'), affordanceLenses: lc.map(lensOf), constraints: setOf('NP').map(constraintOf), requireShaping: false }).compatible)
        assert.deepEqual(lone, [true, true, true, true], `${w}: the package check admits a lone Neutral Player on every lens combination`)
        assert.deepEqual([at(`S4-NP~${w}`).result.chain?.stage, at(`S4-NP~${w}`).run.chain?.constraints], ['structure', setOf('NP')], `${w}: the lone run commits`)
        assert.deepEqual(at(`S4-NP+TR~${w}`).run.chain?.constraints, [], `${w}: the pair commits nothing`)
    }
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Test 6: consumption tracing
// ---------------------------------------------------------------------------------------------------------------------------------------

test('6. consumption tracing: a cited relationship removed (line_crossed dropped from our restated events, through a store copy) changes the decision that rests on it; on A02-D, removing the treatment declaration turns WITHHELD_BY_TREATMENT into CITED_NOT_CARRIED and test 1 fails; the converse: GP-015\'s CAR ratings changed reach Step 1 (its effective profile moves, Step 2 does not) and leave the chain\'s result identical (consulted in Step 1, not determining)', () => {
    const removed = at('A02-2/no-line-crossed')
    assert.deepEqual([at('A02-2').result.chain?.stage, removed.result.chain?.stage, removed.result.chain?.reasons], ['communication', 'realization', ['realization refused', 'game::V1: the resolved game does not list this line as open, so nothing authorizes a value for it']])
    // A02-D with its treatment declaration removed (a doctored copy of the run's own result; the items stay absent).
    const d = at('A02-D')
    assert.deepEqual(withheldOf('A02-D'), ['origin', 'progression', 'control'])
    assert.doesNotThrow(() => assertExperimentRun(d.findings))
    const doctored = copy(d.result)
    doctored.testOnlyTreatments = doctored.testOnlyTreatments.filter((t) => t.id !== 'TT-WITHHOLD-CONDITION')
    const without = ownershipOf(safeguardRunOf(doctored, d.answer, true, { authorizedSet: [], recordKind: 'TEST_ONLY_RECORD', scoring: SCORING }))
    assert.deepEqual(without.filter((f) => f.row === 'SCORING').map((f) => [f.clause, f.verdict]), [['origin', 'CITED_NOT_CARRIED'], ['progression', 'CITED_NOT_CARRIED'], ['control', 'CITED_NOT_CARRIED']])
    assert.throws(() => assertExperimentRun(without), (e: Error) => e.message.includes('ownership: A02-D: the context\'s approved identity and scoring, clause by clause (origin) owned by the context\'s approved rows, through our CANDIDATE restatement: CITED_NOT_CARRIED'))
    // The converse: CAR consulted in Step 1 only; nothing of the chain's result moves. Its positive control first: the changed ratings reach
    // Step 1 (its effective profile moves) and do not move Step 2, so the sameness below is not a change that reached nothing.
    const profileOf = (kk: DesignKnowledge) => json(runStage1('A02', kk).resolution.profile?.effectiveProfile)
    assert.notEqual(profileOf(CAR_KNOWLEDGE), profileOf(k), 'the CAR change reached Step 1')
    assert.equal(json(runStage1('A02', CAR_KNOWLEDGE).gameForm), json(runStage1('A02', k).gameForm), 'Step 2 is not moved by it')
    const car = at('A02-2/CAR')
    for (const key of ['lines', 'sentences', 'refusal', 'requirementAccount', 'consumption'] as const) assert.equal(json(car.result[key]), json(at('A02-2').result[key]), key)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Test 7: a doctored result per verdict
// ---------------------------------------------------------------------------------------------------------------------------------------

const fixture = (): SafeguardRun => ({
    runId: 'FIXTURE',
    experiment: true,
    given: { gameProblemId: 'G1', contextId: 'X1', formId: 'F1', authorizedSet: ['m1'], recordKind: 'TEST_ONLY_RECORD', standIns: [] },
    handoffStop: null,
    chain: {
        outcome: 'served',
        stage: null,
        reasons: [],
        refusalVerdict: null,
        ownPick: ['F1'],
        form: 'F1',
        gameProblemId: 'G1',
        gameProblemStatus: 'APPROVED',
        contextId: 'X1',
        constraints: ['m1'],
        constraintAuthority: 'AUTHORIZATION_RECORD',
        lenses: ['L1', 'L2'],
        consumption: { gameProblemId: 'G1', gameProblemSource: 'Step 1 (review pathway)', formCandidatesScored: ['F1'], formCandidatesFrom: 'SELECTION_TRACE_RANKING', constraintAuthority: 'AUTHORIZATION_RECORD', constraintCandidateIds: ['m1'], sizeRuleBypassed: true },
        contextInThisActivity: true,
        scoringCondition: { state: 'NOT_CLASSIFIED', rowId: 'R1', carried: false },
    },
    scoring: { rowId: 'R1', clauses: [{ clause: 'origin', items: ['i1'] }], derived: ['i1'], resting: ['i1'], unestablished: [], resolved: ['i1'], withheld: [], declarationTreatments: [], refusedOn: [] },
    engineRule: null,
})
const verdictIn = (run: SafeguardRun, row: string) => ownershipOf(run).find((f) => f.row === row)!

test('7. the pure check returns each verdict on a minimal doctored fixture', () => {
    const base = fixture()
    assert.deepEqual(['GAME_PROBLEM', 'GAME_FORM', 'CONSTRAINTS', 'SELECTION_OUTCOME', 'SCORING', 'SCORING_DISPLAY', 'REALIZATION'].map((row) => verdictIn(base, row).verdict), ['CARRIED_NOT_READ', 'CONSUMED', 'CONSUMED', 'LEGITIMATE_CHAIN_DECISION', 'CARRIED', 'CARRIED', 'LEGITIMATE_CHAIN_DECISION'])
    assert.equal(classOf(verdictIn(base, 'GAME_PROBLEM')), 'DETECTED', 'the carried Game Problem no decision reads is never a pass')
    const v = (change: (x: SafeguardRun) => void, row: string): Finding => {
        const x = fixture()
        change(x)
        return verdictIn(x, row)
    }
    assert.equal(v((x) => (x.chain!.consumption!.formCandidatesScored = ['F1', 'F2']), 'GAME_FORM').verdict, 'AGREES_INDEPENDENTLY')
    assert.equal(v((x) => (x.chain!.form = 'F2'), 'GAME_FORM').verdict, 'CONTRADICTED')
    assert.equal(v((x) => Object.assign(x.chain!, { consumption: null, outcome: 'refused', stage: 'selection', form: 'F2', ownPick: null }), 'GAME_FORM').verdict, 'REFUSED_ON_OWN_CHOICE')
    assert.equal(v((x) => (x.chain!.constraints = ['m9']), 'CONSTRAINTS').verdict, 'UNAUTHORIZED_SOURCE')
    assert.equal(v((x) => Object.assign(x.chain!, { constraints: ['m1'], constraintAuthority: 'VOCABULARY_POOL' }), 'CONSTRAINTS').verdict, 'UNAUTHORIZED_SOURCE')
    const kept = v((x) => Object.assign(x, { engineRule: { rule: 'FOUNDATION_CLAUSE', how: 'h' }, chain: { ...x.chain!, outcome: 'refused', stage: 'selection', refusalVerdict: 'NOT KNOWLEDGE', constraints: [] } }), 'SELECTION_OUTCOME')
    assert.deepEqual([kept.verdict, classOf(kept), kept.keptRule?.readsLenses], ['ENGINE_RULE_DECIDED', 'DETECTED', true])
    const unattributed = v((x) => Object.assign(x, { chain: { ...x.chain!, outcome: 'refused', stage: 'selection', refusalVerdict: 'NOT KNOWLEDGE', constraints: [] } }), 'SELECTION_OUTCOME')
    assert.deepEqual([unattributed.verdict, classOf(unattributed)], ['ENGINE_RULE_DECIDED', 'VIOLATION'])
    // A selection refusal after consumption whose basis is not NOT KNOWLEDGE is attributed to no engine rule: it fails closed.
    const knowledgeRefusal = v((x) => Object.assign(x, { engineRule: { rule: 'FOUNDATION_CLAUSE', how: 'h' }, chain: { ...x.chain!, outcome: 'refused', stage: 'selection', refusalVerdict: 'KNOWLEDGE', constraints: [] } }), 'SELECTION_OUTCOME')
    assert.deepEqual([knowledgeRefusal.verdict, classOf(knowledgeRefusal)], ['MISSING', 'VIOLATION'])
    assert.equal(v((x) => (x.scoring!.withheld = [{ itemId: 'i1', treatmentId: 'TT-X' }]), 'SCORING').verdict, 'MISSING', 'withheld, yet in derivation: the treatment was not applied')
    assert.equal(v((x) => Object.assign(x.scoring!, { withheld: [{ itemId: 'i1', treatmentId: 'TT-X' }], derived: [] }), 'SCORING').verdict, 'WITHHELD_BY_TREATMENT')
    assert.equal(v((x) => (x.scoring!.resolved = []), 'SCORING').verdict, 'CITED_NOT_CARRIED')
    assert.equal(v((x) => (x.scoring!.resolved = []), 'SCORING_DISPLAY').verdict, 'CITED_NOT_CARRIED')
    assert.equal(v((x) => Object.assign(x, { chain: null, handoffStop: 'no form' }), 'GAME_FORM').verdict, 'NOT_REACHED')
    assert.equal(v((x) => Object.assign(x.chain!, { outcome: 'refused', stage: 'structure' }), 'SCORING').verdict, 'NOT_REACHED')
    // The run's refusal cites the clause's own line: the clause was decided, explicitly unresolved (detected, never a pass).
    const onLine = v((x) => {
        Object.assign(x.chain!, { outcome: 'refused', stage: 'structure' })
        x.scoring!.refusedOn = [{ itemId: 'i1', ref: 'c:K:i1::V6' }]
    }, 'SCORING')
    assert.deepEqual([onLine.verdict, classOf(onLine), onLine.why], ['REFUSED_ON_CLAUSE_LINE', 'DETECTED', 'the chain refused at structure on this clause\'s line(s) c:K:i1::V6: explicitly unresolved, never a pass'])
    // CARRIED needs every open item derived and resolved: a clause of two items with one resolved is partly carried, CITED_NOT_CARRIED.
    const partly = v((x) => (x.scoring!.clauses = [{ clause: 'origin', items: ['i1', 'i2'] }]), 'SCORING')
    assert.deepEqual([partly.verdict, partly.why], ['CITED_NOT_CARRIED', 'partly carried: i1; not carried: i2 (not derived), with no declared treatment'])
    // A line of the item that establishes nothing leaves it unresolved; under the clause's replaced declaration of that row, the clause is
    // carried only under the treatment (detected); a declaration replaced on a fully carried clause reads the same; the display says not carried.
    const unestablished = (x: SafeguardRun) => Object.assign(x.scoring!, { resolved: [], unestablished: [{ itemId: 'i1', lineId: 'c:K:i1::V5' }] })
    assert.equal(v(unestablished, 'SCORING').verdict, 'CITED_NOT_CARRIED')
    const treated = (x: SafeguardRun) => {
        unestablished(x)
        x.scoring!.declarationTreatments = [{ selectorClause: 'origin', treatmentId: 'TT-D', row: 'V5' }]
    }
    const underTreatment = v(treated, 'SCORING')
    assert.deepEqual([underTreatment.verdict, classOf(underTreatment)], ['CARRIED_UNDER_TREATMENT', 'DETECTED'])
    assert.equal(v((x) => (x.scoring!.declarationTreatments = [{ selectorClause: 'origin', treatmentId: 'TT-D', row: 'V5' }]), 'SCORING').verdict, 'CARRIED_UNDER_TREATMENT')
    assert.equal(v(treated, 'SCORING_DISPLAY').verdict, 'CITED_NOT_CARRIED')
    assert.equal(v((x) => (treated(x), (x.scoring!.declarationTreatments[0].row = 'V4')), 'SCORING').verdict, 'CITED_NOT_CARRIED', 'a declaration of another row does not cover the line')
    // The realizer's own refusal is the chain's decision; a stop before realization is not reached.
    assert.equal(v((x) => Object.assign(x.chain!, { outcome: 'refused', stage: 'realization', reasons: ['realization refused'] }), 'REALIZATION').verdict, 'LEGITIMATE_CHAIN_DECISION')
    assert.equal(v((x) => Object.assign(x.chain!, { outcome: 'refused', stage: 'structure' }), 'REALIZATION').verdict, 'NOT_REACHED')
    assert.equal(v((x) => (x.chain!.form = null), 'GAME_FORM').verdict, 'MISSING')
    assert.equal(v((x) => (x.chain!.consumption!.gameProblemId = 'G2'), 'GAME_PROBLEM').verdict, 'CONTRADICTED')
    assert.equal(v((x) => (x.chain!.gameProblemId = 'G2'), 'GAME_PROBLEM_HINTS').verdict, 'CONTRADICTED')
    assert.equal(v((x) => (x.chain!.contextId = 'X2'), 'CONTEXT').verdict, 'CONTRADICTED')
    // Every verdict of the list is produced by some fixture above or the base (and a stage outside the order is refused, never guessed).
    assert.throws(() => ownershipOf({ ...fixture(), chain: { ...fixture().chain!, outcome: 'refused', stage: 'nowhere' } }), /the stage nowhere is not in the stage order/)
    // The listing helpers: an unlisted violation is found; an entry naming a run it no longer detects is stale.
    const finding = v((x) => (x.chain!.form = 'F2'), 'GAME_FORM')
    const entry: OpenDisconnection = { id: 'E', what: 'w', scope: 'EXPERIMENT', rows: ['GAME_FORM'], verdicts: ['CONTRADICTED'], runs: ['FIXTURE'], evidence: 'e' }
    assert.deepEqual([unlisted([finding], [], ['EXPERIMENT']).length, unlisted([finding], [entry], ['EXPERIMENT']).length, unlisted([finding], [entry], ['LEGACY']).length], [1, 0, 1])
    assert.deepEqual(stale([verdictIn(base, 'GAME_FORM')], [entry]), [{ entry: 'E', run: 'FIXTURE' }])
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// S4: the quota runs
// ---------------------------------------------------------------------------------------------------------------------------------------

const QUOTA_RUNS = [...QUOTA_SETS.map(([name]) => `S4-${name}`), 'S4-NP/no-bypass', 'S4-NP+WZA/no-bypass', 'S4-NP@A02-D', 'S4-NP+WZA@A02-D']
const setOfRun = (id: string): string[] => setOf(id.slice(3).split('/')[0].split('@')[0].split('~')[0])

test('S4. one and two manipulations only through the DRAFT record\'s authorized set (the record route, never placed), with the TEST-ONLY size-rule bypass: the pool is the authorized set; the triples (a lone Neutral Player selected with the bypass and refused without it; each refusal attributed by re-running the exported package check; the run\'s own refusal); the lines a manipulation brings rest on its stand-in (class 4 at best); A01 unchanged', () => {
    // The quota cases are held to the handoff's own validator.
    const quotaCases = [...QUOTA_SETS.map(([name]) => quotaCase(name, true)), quotaCase('NP', false), quotaCase('NP+WZA', false), quotaCase('NP', true, 'A02-D'), quotaCase('NP+WZA', true, 'A02-D')]
    assert.deepEqual(quotaCases.map((c) => c.id), QUOTA_RUNS)
    assert.doesNotThrow(() => validateHandoffInputs(composed([...raw.cases, ...quotaCases])))
    for (const id of QUOTA_RUNS) {
        const r = at(id)
        const set = setOfRun(id)
        assert.deepEqual(r.request?.place, [], `${id}: nothing is placed`)
        assert.deepEqual([r.request?.recordRoute, r.request?.consume?.sizeRuleBypass ?? false], [set, id.indexOf('/no-bypass') < 0], id)
        assert.deepEqual([r.result.consumption?.constraintAuthority, r.result.consumption?.constraintCandidateIds, r.result.consumption?.sizeRuleBypassed], ['AUTHORIZATION_RECORD', set, id.indexOf('/no-bypass') < 0], `${id}: the selection's pool is the authorized set`)
        assert.equal(verdictOf(id, 'CONSTRAINTS'), 'CONSUMED', id)
    }
    // (i) the positive control: size 1 was tried only with the bypass.
    assert.deepEqual([at('S4-NP').result.chain?.stage, at('S4-NP').run.chain?.form, at('S4-NP').run.chain?.constraints, at('S4-NP').result.chain?.reasons], ['structure', 'GF2', setOf('NP'), at('A02-0').result.chain?.reasons])
    assert.deepEqual([at('S4-NP/no-bypass').result.chain?.stage, at('S4-NP/no-bypass').answer?.observed?.constraintGap, at('S4-NP/no-bypass').run.engineRule?.rule, classOf(at('S4-NP/no-bypass').findings.find((f) => f.row === 'SELECTION_OUTCOME')!)], ['selection', 'NO_COMPATIBLE_COMBINATION', 'SIZE_RULE', 'VIOLATION'])
    // (ii) attribution: the run's lens pool is the zero-set run's committed lenses (lens scoring does not read the set: the selected Neutral
    // Player run commits the same three), and the exported package check refuses every lens combination with one check's own reason.
    assert.deepEqual(at('S4-NP').answer?.observed?.lensIds, at('A02-0').answer?.observed?.lensIds)
    assert.deepEqual(QUOTA_REFUSED.map((id) => [id, at(id).run.engineRule?.rule]), [['S4-WZA', 'FOUNDATION_CLAUSE'], ['S4-TR', 'FOUNDATION_CLAUSE'], ['S4-CDC', 'PACKAGE_ROW_O'], ['S4-CDC+IR', 'PACKAGE_ROW_O']])
    // The reworded refused runs, attributed the same way (measured), as OD-PACKAGE-LENSES pairs them.
    assert.deepEqual(WORDED(QUOTA_REFUSED).map((id) => [id, at(id).run.engineRule?.rule]), WORDED(QUOTA_REFUSED).map((id) => [id, QUOTA_RULES[baseOf(id)]]))
    assert.deepEqual(WORDED(QUOTA_REFUSED).map((id) => at(id).run.engineRule?.rule), ['FOUNDATION_CLAUSE', 'FOUNDATION_CLAUSE', 'PACKAGE_ROW_O', 'PACKAGE_ROW_O', 'FOUNDATION_CLAUSE', 'FOUNDATION_CLAUSE', 'PACKAGE_ROW_O', 'PACKAGE_ROW_O'])
    const FOUNDATION = `No compatible foundation constraint was found for archetype ${Q}Directional Possession Games${Q}.`
    const ROW_O = 'The selected package does not show a clear relationship to the selected affordance or open problem space.'
    const combos = ['possession-stability-opportunity+space-creation-opportunity', 'possession-stability-opportunity+regain-opportunity', 'space-creation-opportunity+regain-opportunity', 'possession-stability-opportunity+space-creation-opportunity+regain-opportunity']
    assert.deepEqual(attributions.get('S4-WZA')?.perCombo, combos.map((c) => `${c}: ${FOUNDATION}`))
    assert.deepEqual(attributions.get('S4-TR')?.perCombo, combos.map((c) => `${c}: ${FOUNDATION}`))
    assert.deepEqual(attributions.get('S4-CDC')?.perCombo, combos.map((c) => `${c}: ${ROW_O}`))
    assert.deepEqual(attributions.get('S4-CDC+IR')?.perCombo, combos.map((c) => `${c}: ${ROW_O}`))
    // On the goal's own lenses the package check admits Neutral Player with Turnover Reward on 3 of the 4 combinations (row k refuses one).
    const pool = at('A02-0').answer!.observed!.lensIds
    const npTr = [...subsets(pool, 2), ...subsets(pool, 3)].map((lc) => isSelectionPackageCompatible({ archetype: archetypeOf('GF2'), affordanceLenses: lc.map(lensOf), constraints: setOf('NP+TR').map(constraintOf), requireShaping: false }))
    assert.deepEqual(npTr.map((x) => (x.compatible ? 'compatible' : x.reasons.join(' | '))), [`Constraint ${Q}Turnover Reward${Q} does not support the selected affordance tag group.`, 'compatible', 'compatible', 'compatible'])
    // (iii) the run's own refusal: the gap names the pool's unfilled roles; the verdict names the attributed rule, never the unfilled roles.
    for (const id of QUOTA_REFUSED) {
        const outcome = at(id).findings.find((f) => f.row === 'SELECTION_OUTCOME')!
        assert.ok(at(id).result.chain?.reasons[0].includes('NO_COMPATIBLE_COMBINATION') && at(id).result.chain?.reasons[0].includes('unfilled roles'), id)
        assert.ok(outcome.why.indexOf('unfilled roles:') < 0 && outcome.keptRule && outcome.keptRule.readsLenses, id)
    }
    // Two: the whole authorized set is committed where selection passes.
    assert.deepEqual([at('S4-NP+WZA').result.chain?.stage, at('S4-NP+WZA').run.chain?.constraints], ['structure', setOf('NP+WZA')])
    // R4-02 (review, batch A2): a set of two lies inside 2 to 4, so the switch changes nothing for it: without the bypass the same set selects
    // the same form, lenses and constraints and stops at the same stage, for the same reasons; only the lone set depends on the switch.
    const same = (id: string) => json([at(id).result.chain?.outcome, at(id).result.chain?.stage, at(id).result.chain?.reasons, at(id).run.chain?.form, at(id).run.chain?.lenses, at(id).run.chain?.constraints])
    assert.equal(same('S4-NP+WZA/no-bypass'), same('S4-NP+WZA'), 'two manipulations select the same with or without the switch')
    assert.deepEqual([at('S4-NP+WZA/no-bypass').result.consumption?.sizeRuleBypassed, dispositionOf(at('S4-NP+WZA/no-bypass').run).find((d) => d.id === 'SIZE_RULE')?.ran], [false, 'ran'])
    assert.notEqual(same('S4-NP/no-bypass'), same('S4-NP'), 'bite: the lone manipulation does not select the same without the switch')
    assert.deepEqual([at('S4-NP+TR').result.chain?.stage, at('S4-NP+TR').result.chain?.reasons], ['knowledge', ['the authorized constraint tl-v0-constraint-turnover-reward has no contribution contract, so it cannot shape the game, and it is not dropped silently']])
    // The lines a manipulation brings rest on its relationship stand-in: TEST ASSUMPTION, class 4, the line's ceiling (on the A02-D base, served).
    for (const id of ['S4-NP@A02-D', 'S4-NP+WZA@A02-D']) {
        const r = at(id)
        assert.equal(r.result.chain?.outcome, 'served', id)
        // A line nothing establishes holds no value, so no premise is added to it (the handoff's own rule); every other line it brings is.
        const brought = r.result.lines.filter((l) => l.kind !== 'NOT_ESTABLISHED' && (r.answer?.recordSet ?? []).some((b) => l.premises.some((p) => b.contractIds.some((cid) => p.ref.indexOf(`${cid} `) === 0)) || l.lineId.indexOf(`c:${b.contractIds[0]}:`) === 0))
        assert.ok(brought.length > 0, `${id}: lines the manipulation brings`)
        for (const l of brought) {
            const stand = l.premises.find((p) => p.kind === 'STAND_IN' && p.ref.indexOf(RELATIONSHIP.ref) === 0)
            assert.ok(stand && stand.label === 'TEST ASSUMPTION' && stand.sixClass === 4 && (l.sixClass ?? 0) >= 4, `${id} ${l.lineId}`)
        }
        assert.deepEqual(r.result.lines.filter((l) => l.premises.some((p) => p.kind === 'STAND_IN')).length, brought.length, `${id}: only those lines carry the stand-in`)
    }
    assert.deepEqual(STAND_IN_COUNTS, ['S4-NP@A02-D', 'S4-NP+WZA@A02-D'].map((id) => [id, at(id).result.lines.filter((l) => l.premises.some((p) => p.kind === 'STAND_IN')).length]))
    assert.ok(at('S4-NP').result.manipulations[0].outcome.endsWith('the chain built it from restated:NEUTRAL-PLAYER-CONDITION'))
    assert.ok(at('S4-WZA').result.manipulations[0].outcome.endsWith('the chain did not build it'))
    // A01 unchanged by every run of this file (the production entry, before and after), and equal to main's build measured at 0b60f26.
    assert.equal(A01_BEFORE, A01_AFTER)
    assert.equal(A01_BEFORE, A01_MAIN_SHA256, 'A01 is built as main builds it (measured at 0b60f26)')
    assert.equal(a01Build().outcome, 'served')
    // Zero: the base cases commit the empty authorized set through the zero branch: representable, not shown to be justified.
    for (const id of ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D']) assert.deepEqual([verdictOf(id, 'CONSTRAINTS'), at(id).run.chain?.constraints], ['CONSUMED', []], id)
    // The handoff and the wiring refuse the routes this slice does not use.
    const bad = (alter: (c: any) => void, pattern: RegExp) => {
        const c: any = quotaCase('NP', true)
        alter(c)
        assert.throws(() => validateHandoffInputs(composed([...raw.cases, c])), pattern)
    }
    bad((c) => (c.testOnlyTreatments = c.testOnlyTreatments.filter((t: any) => t.kind !== 'CONSUMED_STEPS')), /SIZE_RULE_BYPASS is declared at most once, and only beside CONSUMED_STEPS/)
    bad((c) => (c.proposedManipulations[0].entersBy = 'PLACE'), /enters by the record route \(entersBy RECORD\) only on a run that consumes Steps 1 and 2/)
    bad((c) => delete c.proposedManipulations[0].entersBy, /a case that consumes Steps 1 and 2 places no manipulation/)
    bad((c) => c.testOnlyTreatments.push({ ...c.testOnlyTreatments.find((t: any) => t.kind === 'SIZE_RULE_BYPASS'), id: 'TT-TWICE' }), /SIZE_RULE_BYPASS is declared at most once/)
    // A consuming run may not alter the selection, so a vehicle's removeContext could not be applied: the handoff refuses the pair.
    bad((c) => (c.chain.vehicle = { goalId: 'A02', removeContext: true, lawsStandIn: null, treatmentRef: 'TT-DRAFT-STORE-SET' }), /CONSUMED_STEPS is not declared beside a TEST-ONLY vehicle/)
    const request = copy(at('S4-NP').request!)
    assert.throws(() => realChain.build({ ...request, recordRoute: [C('wide-zone-advantage')] }), /the record the chain consulted authorizes tl-v0-constraint-neutral-player-condition, and the case's record-route manipulations are tl-v0-constraint-wide-zone-advantage/)
    assert.throws(() => realChain.build({ ...request, vehicle: { goalId: 'A02', removeContext: true, lawsStandIn: null, treatmentRef: 'TT-DRAFT-STORE-SET' } }), /a request that consumes Steps 1 and 2 carries no TEST-ONLY vehicle/)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// The disposition table
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the disposition table: every selection check kept and enforced except the numerical size rule (bypassed, TEST-ONLY); each with its source (held to the source text), origin and authority; per run, ran or not run on this path: the empty-set runs print not run for the role mix, the package checks and the size rule', () => {
    assert.deepEqual(DISPOSITION.filter((d) => d.disposition !== 'KEPT_ENFORCED').map((d) => d.id), ['SIZE_RULE'])
    for (const d of DISPOSITION) assert.ok(d.control.length > 0 && d.origin.length > 0 && d.authority.length > 0, d.id)
    for (const id of ['ROLE_MIX', 'FOUNDATION_CLAUSE']) assert.ok(String(DISPOSITION.find((d) => d.id === id)?.reported).includes('reported with its source and authority'), id)
    // Each source line holds what the row says it holds (read, not run).
    const SYS = path.resolve(HERE, '..')
    const holds = (file: string, line: number, fragment: string) => assert.ok(fs.readFileSync(path.join(SYS, file), 'utf8').split('\n')[line - 1].includes(fragment), `${file}:${line} holds ${fragment}`)
    holds('test-library/generateSelection.ts', 719, 'if (nc < 2 || nc > 4)')
    holds('test-library/generateSelection.ts', 835, 'for (const conSize of constraintSizes)')
    holds('test-library/generateSelection.ts', 590, 'function constraintComboPassesRoleMix')
    holds('test-library/generateSelection.ts', 839, 'constraintComboPassesRoleMix(conCombo, roleNeeds)')
    holds('test-library/generateSelection.ts', 705, 'if (nl < 2 || nl > 3)')
    holds('test-library/generateSelection.ts', 811, 'if (zeroConstraintCommitment)')
    holds('test-library/generateSelection.ts', 1030, 'const zeroConstraintCommitment = ')
    holds('test-library/generateSelection.ts', 933, 'if (tokens.length === 0)')
    holds('test-library/generateSelection.ts', 636, 'BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET = 2')
    holds('test-library/generateSelection.ts', 868, 'export function commitDesignChoice')
    holds('build-constraint-package.ts', 614, 'const foundation = pickBestConstraint')
    holds('build-constraint-package.ts', 148, 'score <= 10 &&')
    holds('validate-constraint-package.ts', 326, 'A valid package requires a foundation constraint.')
    holds('validate-constraint-package.ts', 491, 'does not show a clear relationship to the selected affordance or open problem space')
    holds('validate-constraint-package.ts', 365, 'does not support the selected affordance tag group')
    holds('derivation/run-bounded-selection.ts', 384, `if (resolutionStatus !== 'matched')`)
    holds('sport-module/guided-selection.ts', 212, 'export function guidedSelectionHints')
    holds('sport-module/guided-selection.ts', 228, 'governByApprovedGameProblem(learningGoalId')
    // Per run.
    const ran = (id: string) => Object.fromEntries(dispositionOf(at(id).run).map((d) => [d.id, d.ran]))
    const zero = 'not run on this path (zero branch, generateSelection.ts:811-815)'
    for (const id of ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D']) {
        const r = ran(id)
        for (const check of ['ROLE_MIX', 'FOUNDATION_CLAUSE', 'PACKAGE_ROW_O', 'PACKAGE_ROW_K', 'PACKAGE_OTHER', 'SIZE_RULE', 'BOUNDED_SEARCH']) assert.equal(r[check], zero, `${id} ${check}`)
        assert.deepEqual([r.ZERO_BRANCH, r.LENS_RULE, r.TOKEN_CHECK], ['ran', 'ran', 'ran'], id)
    }
    for (const id of ['S4-NP', 'S4-WZA', 'S4-NP+WZA']) assert.deepEqual([ran(id).SIZE_RULE, ran(id).ROLE_MIX, ran(id).FOUNDATION_CLAUSE], ['bypassed (TEST-ONLY): the set\'s own size tried, and the contract admits 1 to its size (a one-manipulation subset of a set of 2 to 4 is not tried)', 'ran', 'ran'], id)
    assert.deepEqual([ran('S4-NP/no-bypass').SIZE_RULE, ran('S4-WZA').LENS_RULE], ['ran', 'not reached (no selection was committed)'])
    // The lone manipulation without the bypass: no combination is enumerated, so the role mix and the package checks never run.
    const noBypass = ran('S4-NP/no-bypass')
    const unenumerated = 'not run on this path (no combination enumerated: the set holds 1; without the bypass the sizes enumerated are 2 to 4, generateSelection.ts:835-836)'
    assert.deepEqual(['ROLE_MIX', 'FOUNDATION_CLAUSE', 'PACKAGE_ROW_O', 'PACKAGE_ROW_K', 'PACKAGE_OTHER', 'SIZE_RULE', 'BOUNDED_SEARCH'].map((check) => noBypass[check]), [unenumerated, unenumerated, unenumerated, unenumerated, unenumerated, 'ran', 'ran'])
    holds('test-library/generateSelection.ts', 836, 'if (constraintCandidatePool.length < conSize) continue')
    assert.equal(ran('GP-001').ROLE_MIX, 'not reached (the chain was not run)')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// S6: the earliest consequential blocker
// ---------------------------------------------------------------------------------------------------------------------------------------

const firstNext = (raw.experiment.questions as Array<{ order: number; question: string; next: boolean }>).find((q) => q.next)!
export function stopsOf(): Stop[] {
    // A reason that already begins with its stage's name is printed without it (the renderers print the stage before the reason: R4-10).
    const reason = (id: string, n = 0) => {
        const text = String(at(id).result.chain?.reasons[n] ?? at(id).result.form.stop)
        const stage = `${String(at(id).result.chain?.stage)}: `
        return text.indexOf(stage) === 0 ? text.slice(stage.length) : text
    }
    // Each path's text names what it holds; a later path passes an earlier stop by what it adds (L1 to L2 our TEST-ONLY draft
    // store; L2 to NO-RESTATEMENT the consumption, NO-RESTATEMENT setting our restatement aside so its own stop shows what the restatement
    // closes; NO-RESTATEMENT to A02-0 the restatement). L2 and NO-RESTATEMENT stop in one stage, at two checks held to the source in S6.
    return [
        {
            id: 'L1',
            path: 'the legacy route (nothing consumed, the production records: no A02 authorization record)',
            stage: String(at('L1').result.chain?.stage),
            reason: reason('L1'),
            kind: 'PATH',
            // Batch A4 (the lead's decision, from the delivery review): read as decision authority [4], no longer Missing knowledge [1].
            categories: [4],
            why: 'the checked pathway accepts manipulations only on a per-goal authorization record\'s authority (the live route hands it only a record-backed selection, live-activity.ts:55-56; with upstream decisions it refuses without one, run-bounded-selection.ts:329-330), and A02 has none; called on the production records, its candidates are A02\'s own candidate constraints, which no record authorizes (the engine labels their authority VOCABULARY_POOL; nothing is drawn from outside the goal\'s candidates), and they cannot be combined on any of RPC-002\'s declared forms (GF2, GF3, GF7 each refused NO_COMPATIBLE_COMBINATION, unfilled roles: shaping); the review pathway proposes no manipulation for A02 under K2 (approved for review-only use), and the checked pathway does not take that result; passed only by our TEST-ONLY DRAFT record standing in for that result (an empty set; on item 4\'s runs a TEST-ONLY copy of it holds the stand-in manipulations instead; the finding OURS, no ruling), never by the consumption; the category is OURS (an assumption)',
        },
        {
            id: 'L2',
            path: 'the chain\'s own route with our TEST-ONLY draft store (our DRAFT record and our CANDIDATE restatement), nothing consumed',
            stage: String(at('L2').result.chain?.stage),
            reason: reason('L2'),
            kind: 'PATH',
            within: 1617,
            categories: [4],
            why: 'the chain selects its own GF3 from the wording against Step 2\'s SELECTED form (GAME_FORM CONTRADICTED); the consumption (S1) closes it',
        },
        { id: 'NO-RESTATEMENT', path: 'consumed, with our DRAFT record and without the restatement', stage: String(at('NO-RESTATEMENT').result.chain?.stage), reason: reason('NO-RESTATEMENT'), kind: 'PATH', within: 1684, categories: [3, 5], why: 'the context\'s approved rows have no executable form in the engine: no contribution contract joins them to the configuration' },
        { id: 'A02-0', path: 'consumed, with our CANDIDATE restatement (the knowledge as it stands)', stage: String(at('A02-0').result.chain?.stage), reason: reason('A02-0', 2), kind: 'PATH', categories: [1, 5], why: `of the two lines this stop cites together, the origin clause, placed first by us (OURS: the condition is what distinguishes High Press Escape from the contexts sharing its events): no operational interpretation of the clause is held (question ${firstNext.order} of the smallest source material, the next consequential gap), and no carrier exists for it (the only typed begin condition is a restart, the only episode scope the build-out one)` },
        { id: 'A02-1', path: 'A02-1 (origin and progression withheld, TEST-ONLY)', stage: String(at('A02-1').result.chain?.stage), reason: reason('A02-1', 2), kind: 'DOWNSTREAM', categories: [1], why: 'the control referent is not stated' },
        { id: 'A02-1b', path: 'A02-1b (+ the control referent declared NO_FURTHER_VALUE, TEST-ONLY)', stage: String(at('A02-1b').result.chain?.stage), reason: reason('A02-1b', 1), kind: 'DOWNSTREAM', categories: [2, 1], why: 'the refusal rests on our DRAFT classification of the laws; no ruling settles the Laws for A02' },
        { id: 'A02-2', path: 'A02-2 (+ the LAW-11 stand-in, TEST-ONLY)', stage: String(at('A02-2').result.chain?.stage), reason: reason('A02-2'), kind: 'DOWNSTREAM', categories: [1, 5], why: 'no approved coach wording for the condition, and the checked renderer has no sentence for it' },
    ]
}

test('S6. the earliest consequential blocker, computed from the runs: the stops in chain order, which ones a later path passes, and the earliest that remains, named in Christian\'s failure-source categories (both where two apply); the downstream stops recorded, not investigated', () => {
    assert.deepEqual(CATEGORIES.slice(1), ['Missing knowledge.', 'An unapproved or inaccurate interpretation.', 'A broken relationship between existing knowledge components.', 'Incorrect reasoning chronology or decision authority.', 'A configuration or rendering implementation limitation.'])
    const seq = blockerSequence(stopsOf())
    assert.deepEqual(seq.sequence.map((s) => [s.id, s.stage, s.passed, s.passedBy]), [
        ['L1', 'selection', true, 'L2'],
        ['L2', 'knowledge', true, 'NO-RESTATEMENT'],
        ['NO-RESTATEMENT', 'knowledge', true, 'A02-0'],
        ['A02-0', 'structure', false, null],
    ])
    assert.equal(seq.earliest.id, 'A02-0')
    assert.deepEqual(seq.earliest.categories.map((i) => CATEGORIES[i]), ['Missing knowledge.', 'A configuration or rendering implementation limitation.'])
    assert.ok(seq.earliest.reason.includes('c:restated:RPC-002:RPC-002-02.a::V6'), 'the origin clause\'s line is among the lines it stops on')
    assert.deepEqual(seq.downstream.map((s) => [s.id, s.stage]), [['A02-1', 'structure'], ['A02-1b', 'validation'], ['A02-2', 'communication']])
    // Batch A4, re-pinned openly (was [1] Missing knowledge): L1 is read as decision authority, our assignment: the checked pathway takes its
    // manipulations only from a per-goal authorization record and does not take the review pathway's proposal of no manipulation under K2.
    assert.deepEqual(seq.sequence[0].categories.map((i) => CATEGORIES[i]), ['Incorrect reasoning chronology or decision authority.'])
    // L1's stop is the missing record, not the form: on the production records A02's selection is refused the same way on each of RPC-002's
    // declared forms (A02's own candidate constraints, which no record authorizes, cannot be combined), so consuming Step 2's form does not
    // pass it; our TEST-ONLY DRAFT record does (L2).
    const text = guidedGoalText('A02')
    const guided = guidedSelectionHints('A02', text)
    assert.deepEqual([guided.authorization ?? null, guided.hints.candidateArchetypeIds], [null, ['GF2', 'GF3', 'GF7']])
    for (const form of ['GF2', 'GF3', 'GF7'])
        assert.throws(
            () => generateSelection({ learningGoals: [text], learningGoalId: 'A02' } as any, { ...guided.hints, candidateArchetypeIds: [form] }, false),
            (e: Error) => e.message.includes(`(NO_COMPATIBLE_COMBINATION) - the goal's designated knowledge cannot be combined into a selection on ${form}; unfilled roles: shaping`),
            form,
        )
    assert.equal(at('L1').result.chain?.reasons[0].includes('NO_COMPATIBLE_COMBINATION'), true)
    // What the L1 why says of the candidates, measured: the engine labels their authority VOCABULARY_POOL, and its refusal says nothing was
    // drawn from outside the goal's own candidates (generateSelection.ts:155-176: a goal's pool is its own candidate ids, minus holds).
    assert.deepEqual([at('L1').run.chain?.constraintAuthority, at('L1').result.chain?.reasons[0].includes('Nothing was drawn from outside the goal\'s candidates.')], ['VOCABULARY_POOL', true])
    const poolLine = fs.readFileSync(path.resolve(HERE, '..', 'test-library', 'generateSelection.ts'), 'utf8').split('\n')[164 - 1]
    assert.ok(poolLine.includes('const constraints = full.filter((c) => ids.includes(c.id) && !heldKeys.has(knowledgeKey(c.id)))'), 'generateSelection.ts:164 holds the goal pool filter')
    // L2's stop is the chain's own form (test 2); NO-RESTATEMENT, consumed, passes it: the knowledge stage checks the form's contract before
    // the context's (each within line held to the source), and NO-RESTATEMENT stops at the context's.
    assert.deepEqual([verdictOf('L1', 'GAME_FORM'), verdictOf('L2', 'GAME_FORM'), at('L2').result.chain?.reasons], ['REFUSED_ON_OWN_CHOICE', 'CONTRADICTED', ['the game form GF3 has no contribution contract']])
    const buildSource = fs.readFileSync(path.resolve(HERE, '..', 'rendering', 'build-activity.ts'), 'utf8').split('\n')
    const within = (id: string) => stopsOf().find((s) => s.id === id)!.within!
    assert.ok(buildSource[within('L2') - 1].includes('if (!account.gameForm.contracted)') && buildSource[within('L2') + 1].includes('has no contribution contract'), 'L2: the form\'s contract check')
    assert.ok(buildSource[within('NO-RESTATEMENT') - 1].includes('if (context && !selection.contracted.includes(context.id))'), 'NO-RESTATEMENT: the context\'s contract check')
    assert.ok(at('NO-RESTATEMENT').result.chain?.reasons[0].startsWith('the Representative Performance Context RPC-002 has no contribution contract'))
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------------------------------------------------------------------

export function reportLines(): string[] {
    const notes = [
        'QUOTA (S4): zero is the base cases (the empty set, through the zero branch): representable, not shown to be justified (generateSelection.ts:1018-1021 names this goal among the knowledge gaps a floor of 0 would turn into empty selections).',
        'QUOTA (S4): one and two manipulations entered only through the DRAFT record\'s authorized set, with the TEST-ONLY size-rule bypass; a lone Neutral Player is selected with the bypass and refused without it; a lone Wide Zone Advantage or Turnover Reward is refused by the foundation clause, Central Density Condition (alone and with Interception Reward) by row o, each attributed by re-running the exported package check; Neutral Player with Wide Zone Advantage or with Turnover Reward is selected whole.',
        'QUOTA (S4): no manipulation is justified for A02 in anything we hold; every manipulation here rests on a TEST-ONLY relationship stand-in (TEST ASSUMPTION), never knowledge, and every line it brings is graded class 4 at best.',
        `WORDING (test 5): the lens list moves from ${LENSES_BEFORE} to ${LENSES_AFTER} under both rewordings; the owned decisions do not move; the selection of Neutral Player with Turnover Reward flips (OD-WORDING-FLIP).`,
    ]
    return safeguardsText({ runs: groupedRuns(), entries: OPEN_DISCONNECTIONS, categories: CATEGORIES, stops: stopsOf(), notes })
}
/** The groups the report counts apart (R3-06, R4-09): the experiment path, the controls, the legacy route. */
export const GROUP_OF: Record<Kind, string> = {
    EXPERIMENT: 'the experiment path (each run held to the assertion every experiment run must pass, test 1)',
    CONTROL: 'the controls (runs built beside the experiment to show whether a check bites; not held to that assertion)',
    LEGACY: 'the legacy route (reported only)',
}
/** The tag each run's line prints for its group (NF-03): a control is tagged a control, never the experiment path it is not held to. */
export const TAG_OF: Record<Kind, string> = {
    EXPERIMENT: 'experiment path',
    CONTROL: 'control, not held to the assertion',
    LEGACY: 'legacy route',
}
export const groupedRuns = () => [...runs.values()].map((r) => ({ run: r.run, findings: r.findings, label: `${r.kind}: ${r.label}`, group: GROUP_OF[r.kind], tag: TAG_OF[r.kind] }))

test('the report: the ownership table, every run decision by decision with its checks, the disposition table, the open disconnections (counted, never a pass), safeguard B\'s failures, the blocker sequence; no double quotation mark, no gendered pronoun; the check is deterministic over a second build of the five cases', () => {
    const lines = reportLines()
    const text = lines.join('\n')
    const has = (line: string) => assert.ok(lines.includes(line), `the report holds: ${line}`)
    const all = [...runs.values()].flatMap((r) => r.findings)
    const violations = all.filter((f) => classOf(f) === 'VIOLATION').length
    const detected = all.filter((f) => classOf(f) === 'DETECTED').length
    has(`open disconnections detected: ${violations} violation verdicts and ${detected} detected disconnections over ${runs.size} runs (none of them a pass; the detected, by verdict: ${detectedByVerdict(all)})`)
    assert.deepEqual([violations, detected], REPORT_COUNTS)
    assert.equal(detectedByVerdict(all), DETECTED_BY_VERDICT)
    // The total is never read alone (R3-06, R4-09): per group, the runs, the violation verdicts and the detected disconnections (measured).
    const byGroup = countsByGroup(groupedRuns())
    assert.deepEqual(byGroup.map((g) => [g.runs, g.violations, g.detected]), COUNTS_BY_GROUP)
    assert.deepEqual([byGroup.reduce((n, g) => n + g.violations, 0), byGroup.reduce((n, g) => n + g.detected, 0)], REPORT_COUNTS, 'the groups add up to the total')
    has(`by group (a total never read alone): ${byGroup.map((g) => `${g.group}: ${g.violations} violation verdicts and ${g.detected} detected disconnections over ${g.runs} runs`).join('; ')}`)
    // Each run's line is tagged with its own group (NF-03): the tags count as the groups do, so no control reads as the experiment path.
    const tagged = (tag: string) => lines.filter((l) => l.startsWith('- ') && / \[[^\]]+\] (EXPERIMENT|CONTROL|LEGACY): /.test(l) && l.indexOf(` [${tag}] `) > 0).length
    assert.deepEqual((['EXPERIMENT', 'CONTROL', 'LEGACY'] as Kind[]).map((kind) => tagged(TAG_OF[kind])), COUNTS_BY_GROUP.map((g) => g[0]), 'the run lines tagged by group')
    for (const r of runs.values()) has(`- ${r.id} [${TAG_OF[r.kind]}] ${`${r.kind}: ${r.label}`.split(Q).join(String.fromCharCode(39))}`)
    has('safeguard B fails on: OD-WORDING-FLIP, OD-WORDING-LENSES')
    has(`OPEN DISCONNECTIONS (${OPEN_DISCONNECTIONS.length}; printed as open disconnections, never as safeguards passing)`)
    assert.equal(lines.filter((l) => l.startsWith('- ') && OWNERSHIP_TABLE.some((o) => l.startsWith(`- ${o.decision}: owner `))).length, OWNERSHIP_TABLE.length)
    has(`earliest remaining: consumed, with our CANDIDATE restatement (the knowledge as it stands): structure; Missing knowledge; and A configuration or rendering implementation limitation: ${stopsOf().find((s) => s.id === 'A02-0')!.why}`)
    assert.ok(!/pass(es|ed)? (all|every)|all safeguards pass/i.test(text), 'no passing summary')
    assert.equal(text.indexOf(String.fromCharCode(34)), -1, 'no double quotation mark')
    const hit = lines.findIndex((l) => holdsGenderedPronoun(l))
    assert.equal(hit, -1, `a gendered pronoun at line ${hit + 1}: ${lines[hit]}`)
    assert.equal(reportLines().join('\n'), text, 'generated twice, identical')
    // A second build of the five cases through the chain gives the same findings.
    for (const id of ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D']) {
        let answer: ChainAnswer | null = null
        const result = runHandoff(caseOf(id), inputs, { build: (r) => (answer = realChain.build(r)) }, k)
        const again = ownershipOf(safeguardRunOf(result, answer, true, { authorizedSet: [], recordKind: 'TEST_ONLY_RECORD', scoring: SCORING }))
        assert.equal(json(again), json(at(id).findings), id)
    }
    if (process.env.A02_SAFEGUARDS_OUT) fs.writeFileSync(process.env.A02_SAFEGUARDS_OUT, text)
})

test('registered; the stage file joins no chain import, and the wiring is a unit file', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-safeguards.unit.ts'))
    const source = fs.readFileSync(path.join(HERE, 'safeguards.ts'), 'utf8')
    const imports = source.split('\n').filter((l) => l.startsWith('import '))
    assert.deepEqual(imports, [`import { ChainAnswer, HandoffResult } from './handoff'`])
    assert.deepEqual([...DECISION_ROWS], OWNERSHIP_TABLE.map((o) => o.row))
})

if (process.env.A02_SAFEGUARDS_MEASURE) writeMeasurement(process.env.A02_SAFEGUARDS_MEASURE)
fs.rmSync(TMP, { recursive: true, force: true })
if (MAIN) quiet(`a02 safeguards (S3, S4, S6): ${passed} passed`)

