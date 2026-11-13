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

import * as packageBuilder from '../build-constraint-package'
import { loadDraftStore } from '../derivation/draft-store'
import * as boundedSelection from '../derivation/run-bounded-selection'
import { SIGNAL_GROUP_TO_GAME_PROBLEM } from '../knowledge-core/affordance-target-matrix'
import { buildActivity } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { guidedGoalText, guidedSelectionHints } from '../sport-module/guided-selection'
import { soccerModule } from '../sport-module/soccer-module'
import { constraintBalanceBucket, constraintComboPassesRoleMix, generateSelection } from '../test-library/generateSelection'
import { testLibraryRegistry } from '../test-library/library/registry'
import { CONSTRAINT_AUTHORITIES } from '../test-library/types'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import * as compatibility from '../test-library/selection-compatibility'
import { isSelectionPackageCompatible } from '../test-library/selection-compatibility'
import { CaseInput, ChainAnswer, ChainRequest, HandoffChain, HandoffInputs, HandoffResult, runHandoff, validateHandoffInputs } from './handoff'
import { chainWith, holdsGenderedPronoun, realChain } from './handoff-chain.unit'
import { handoffReportText } from './handoff-report'
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
    rulesOfCombinations,
    SafeguardFacts,
    SafeguardRun,
    safeguardRunOf,
    safeguardsText,
    stale,
    Stop,
    unlisted,
    VERDICTS,
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
const L = (s: string) => `tl-v0-lens-${s}`

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
/**
 * Stage W2 (11 November 2026): the sets U3's runs table adds, on A02-0 under the goal's wording: two members of one role (NP+CDC), two with no
 * foundation member (WZA+TR), three of the three roles (NP+WZA+TR), and the triple chosen by measurement for E1's negative control (NP+WZA+CDC:
 * its whole fails a kept check on every lens combination while its pair NP+WZA passes on every one).
 */
export const W2_SETS: Array<[string, string[]]> = [
    ['NP+CDC', [C('neutral-player-condition'), C('central-density-condition')]],
    ['WZA+TR', [C('wide-zone-advantage'), C('turnover-reward')]],
    ['NP+WZA+TR', [C('neutral-player-condition'), C('wide-zone-advantage'), C('turnover-reward')]],
    ['NP+WZA+CDC', [C('neutral-player-condition'), C('wide-zone-advantage'), C('central-density-condition')]],
]
/** Stage W2: the reversal arm of E3 (foundation presence kept: the treatment not declared), for the sets with no foundation member (controls). */
export const FOUNDATION_KEPT_SETS = ['WZA', 'TR', 'WZA+TR']
export const FOUNDATION_KEPT = '/foundation-kept'
const setOf = (name: string): string[] => [...QUOTA_SETS, ...W2_SETS].find((x) => x[0] === name)![1]
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
/** Stage W1 (b): the rulings that enter only with K2's result (its words and E5), dropped with its treatment. */
const K2_RULINGS = ['HO-07NOV-K2', 'A02-03NOV-DESIGN-AUTHORIZATION']
const K2_TREATMENT = 'TT-K2-RETAIN-FORM'
/** Stage W1 (b): a base case without K2's result (its treatment and the rulings entering with it): the record route, as before the stage. */
export function withoutK2(c: CaseInput): CaseInput {
    c.testOnlyTreatments = c.testOnlyTreatments.filter((t) => t.kind !== 'K2_RETAIN_FORM')
    c.rulings = c.rulings.filter((r) => K2_RULINGS.indexOf(r.ref) < 0)
    return c
}
const takesK2 = (c: CaseInput) => c.testOnlyTreatments.some((t) => t.kind === 'K2_RETAIN_FORM')
/** Stage W1 (c1): the declared TEST-ONLY treatment that takes the lens candidates and signal groups from Step 1's Coverage row in both branches. */
export const GPCL = '+GPCL'
// Exported in stage W5 (12 November 2026): the TA02 run of the reuse comparison declares the same treatment (a02-evidence.unit.ts).
export const COVERAGE_LENSES = {
    id: 'TT-GP-COVERAGE-LENSES',
    kind: 'GP_COVERAGE_LENSES' as const,
    what: 'the chain\'s lens candidates and matched signal groups taken from Step 1\'s Game Problem Coverage row in both branches (where Step 1 and the wording agree too); the forms and the constraints untouched',
    effect: 'the engine lenses\' candidate pool and signal groups no longer follow the wording on this path; the ranking of the lenses by wording tokens, the top-3 cap and every kept check are unchanged',
    why: 'stage W1 (c1): the wording-invariance measurement; never the isolated path\'s default, because which lenses the kept checks read is Christian\'s (Q-a2)',
    label: 'TEST-ONLY',
    rulingRefs: ['A02-10NOV-AUTHORIZATION'],
}
function coverageLensesCase(wording = ''): CaseInput {
    const c = caseOf('A02-0')
    c.id = `A02-0${GPCL}${wording ? `~${wording}` : ''}`
    c.label = `A02-0 with the TEST-ONLY treatment GP_COVERAGE_LENSES (the lens candidates and signal groups from Step 1's Coverage row)${wording ? ` under the ${wording} wording` : ''}`
    c.resultStanding = 'TEST_ONLY_TREATMENT_NEVER_THE_A02_CONFIGURATION'
    c.testOnlyTreatments.push(copy(COVERAGE_LENSES))
    return c
}
/** Stage W2 (E3): the declared TEST-ONLY treatment that bypasses foundation presence, on every quota run under the switch but the reversal arm. */
const FOUNDATION_PRESENCE = {
    id: 'TT-FOUNDATION-PRESENCE-BYPASS',
    kind: 'FOUNDATION_PRESENCE_BYPASS' as const,
    what: 'the package check need find no foundation (structure-role) member: our classification of foundation presence as a quota (stage W2)',
    effect: 'a set with no structure member reaches the kept package checks; every member present is still checked, and under the switch every selected member must be in the checked package (a structure member under its keyword threshold is refused there)',
    why: 'no authority was found for requiring a foundation member in every non-empty set; the treatment lets Christian reverse our classification by its removal (the reversal arm, the controls /foundation-kept, is kept beside it)',
    label: 'TEST-ONLY',
    rulingRefs: ['A02-10NOV-QUOTA'],
}
function quotaCase(name: string, bypass: boolean, baseId = 'A02-0', foundation: 'BYPASSED' | 'KEPT' = 'BYPASSED'): CaseInput {
    const c = withoutK2(caseOf(baseId))
    c.id = `S4-${name}${bypass ? '' : '/no-bypass'}${bypass && foundation === 'KEPT' ? FOUNDATION_KEPT : ''}${baseId === 'A02-0' ? '' : `@${baseId}`}`
    c.label = `TEST-ONLY quota run: ${setOf(name).join(', ')} in the DRAFT record's authorized set (a stand-in, never knowledge)${bypass ? `, the size rule bypassed${foundation === 'BYPASSED' ? ', foundation presence not required' : ', foundation presence kept (the reversal arm)'}` : ''}; base ${baseId}`
    c.resultStanding = 'TEST_ONLY_TREATMENT_NEVER_THE_A02_CONFIGURATION'
    c.chain.draftStore = quotaStoreOf(name)
    c.testOnlyTreatments = c.testOnlyTreatments.map((t) =>
        t.kind === 'DRAFT_STORE'
            ? { ...t, id: 'TT-DRAFT-STORE-SET', what: `a TEST-ONLY copy of the draft store ${STORE} whose DRAFT record authorizes ${setOf(name).join(', ')} (no ruling field filled; its finding names a TEST-ONLY relationship stand-in)`, effect: 'the record route governs the constraints with that set', why: 'to test one and two manipulations without the numerical quota; the set is a stand-in, never knowledge', rulingRefs: ['A02-10NOV-QUOTA'] }
            : t,
    )
    // Stage W2, re-pinned openly (the switch's description): was 'the numerical size rule (2 to 4 constraints) bypassed for the record route's
    // authorized set, and nothing else' / 'the selector also tries the set's own size, and its contract admits 1 to that size; every other check
    // runs and enforces'.
    if (bypass)
        c.testOnlyTreatments.push({ id: 'TT-SIZE-RULE-BYPASS', kind: 'SIZE_RULE_BYPASS', what: 'the switch: the numerical size rule (2 to 4 constraints) and its floor of 2 for subsets bypassed for the record route\'s authorized set, and the bounded search\'s cap of 2 per role not applied to it (stage W2)', effect: 'the selector tries the set whole, its own size only, and its contract admits exactly that size; every selected member must be in the checked package (stage W2, a tightening); every other check runs and enforces', why: 'the authorization\'s section 5', label: 'TEST-ONLY', rulingRefs: ['A02-10NOV-QUOTA'] })
    if (bypass && foundation === 'BYPASSED') c.testOnlyTreatments.push(copy(FOUNDATION_PRESENCE))
    // Stage W2, re-pinned openly: was 'the numerical size rule bypassed for the TEST-ONLY set only; every other check kept and enforced; the role
    // mix and the foundation clause reported with source and authority'.
    c.rulings = [...c.rulings, { ref: 'A02-10NOV-QUOTA', entersAs: 'REPORT_ONLY', how: 'under the switch the numerical size rule with its floor and the bounded pool bypassed for the TEST-ONLY set only, the set taken whole and every selected member validated; foundation presence bypassed only under its declared treatment; every other check kept and enforced; the role mix and the foundation clause reported with source and authority' }]
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
    // Stage W1 (b): a case that takes K2's result has no record governing it (the store's DRAFT record set aside): no authorized set, no record.
    const full: SafeguardFacts = {
        authorizedSet: facts.authorizedSet === undefined ? (takesK2(c) ? null : []) : facts.authorizedSet,
        recordKind: facts.recordKind ?? (takesK2(c) ? 'NONE' : 'TEST_ONLY_RECORD'),
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
export function reworded<T>(name: string, f: (kk: DesignKnowledge) => T): T {
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
// Stage W2, re-pinned openly: was 'the role mix refuses no set run here: a set of 1 or 2 is enumerated only whole, and its role needs are read
// over the pool (generateSelection.ts:827, :835-836, :590-612)'; under the switch every set is now enumerated only whole (E1).
const ROLE_MIX_PASSES = 'the role mix refuses no set run here: under the switch a set is enumerated only whole (stage W2), and its role needs are read over the pool, which is the set (generateSelection.ts:832, :840-841, :591-613; the inertness test pins it)'
/**
 * The package check's options as the selector passes them on the run: under the switch every selected member validated (E4), and under the
 * treatment foundation presence not required (E3); nothing without the switch (stage W2).
 */
const optionsOf = (bypass: boolean, foundationBypassed: boolean) => (bypass ? { everyMemberValidated: true as const, ...(foundationBypassed ? { foundationPresenceBypass: true as const } : {}) } : {})
function attributeWith(pool: () => string[], set: string[], bypass: boolean, foundationBypassed = bypass) {
    return (r: HandoffResult): EngineRuleAttribution | null => {
        if (!r.chain || r.chain.stage !== 'selection') return null
        if (!bypass && set.length < 2) return { rule: 'SIZE_RULE', how: `no combination was enumerated: the set holds ${set.length} and, without the bypass, the sizes enumerated are 2 to 4 (generateSelection.ts:840-841)` }
        const lenses = pool()
        const combos = [...subsets(lenses, 2), ...subsets(lenses, 3)]
        const results = combos.map((lc) => isSelectionPackageCompatible({ archetype: archetypeOf(String(r.form.formId)), affordanceLenses: lc.map(lensOf), constraints: set.map(constraintOf), requireShaping: false, ...optionsOf(bypass, foundationBypassed) }))
        attributions.set(r.caseId, { pool: lenses, perCombo: results.map((x, n) => `${combos[n].map((l) => l.replace('tl-v0-lens-', '')).join('+')}: ${x.compatible ? 'compatible' : x.reasons.join(' | ')}`) })
        if (results.some((x) => x.compatible)) return { rule: null, how: `the package check admits ${results.filter((x) => x.compatible).length} of ${combos.length} lens combinations, so it is not what refused (${ROLE_MIX_PASSES})` }
        // Stage W2: one check for every combination, or (rules) each combination's own check where they differ.
        const ids = rulesOfCombinations(results.map((x) => x.reasons))
        const options = bypass ? `, with the selector's options on this run (every selected member validated${foundationBypassed ? '; foundation presence not required' : ''})` : ''
        const how = `the exported package check re-run on ${r.form.formId} and each of the ${combos.length} lens combinations of the run's lens pool with the set${options}: every one first refused with ${ids === null ? 'reasons no single check owns' : ids.length === 1 ? `the ${ids[0]} reason` : `the reason of one of ${ids.join(', ')} (${results.map((x, n) => `${combos[n].map((l) => l.replace('tl-v0-lens-', '')).join('+')} ${ruleOfReasons(x.reasons)?.id}`).join('; ')})`} (the check returns the first reason it meets, selection-compatibility.ts:105-135; ${ROLE_MIX_PASSES}; the gap's unfilled roles are the pool's, never the cause)`
        return ids && ids.length > 1 ? { rule: null, rules: ids, how } : { rule: ids ? ids[0] : null, how }
    }
}
const lensPoolOf = (id: string) => () => {
    const a = at(id).answer
    assert.ok(a && a.observed && a.observed.lensIds.length === 3, `${id}: its committed lens pool (3 lenses) is read`)
    return [...a.observed.lensIds]
}

const T0 = Date.now()
const LEGACY_FACTS_NONE = { authorizedSet: null, recordKind: 'NONE' as const }
export const BASE_IDS = ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D']
/** Stage W1 (b): the facts of a run that takes K2's result: no record governs, so no authorized set. */
export const K2_FACTS = { authorizedSet: null, recordKind: 'NONE' as const }
export const DRAFT_ARM = '/draft-record'
const withoutConsumption = (c: CaseInput, id: string, keepStore = true): CaseInput => {
    withoutK2(c)
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
    // Stage W1 (b): the DRAFT-record arm, kept beside K2's result as a comparison (so Christian can reverse our reading of E5 and K2): the same
    // five cases with our TEST-ONLY DRAFT record standing in for K2's result, as before the stage. Controls: not held to test 1 (they read
    // K2_NOT_TAKEN, by design).
    for (const id of BASE_IDS) {
        const c = withoutK2(caseOf(id))
        c.id = `${id}${DRAFT_ARM}`
        c.label = `${id} on the DRAFT-record arm (comparison): our TEST-ONLY DRAFT A02 record (an empty set, the finding ours) stands in for the review pathway's K2 result, as before stage W1 (b)`
        runCase(c, 'CONTROL', c.label)
    }
    // The quota runs (S4), on A02-0 and on A02-D; the lone manipulation also without the bypass (a control).
    for (const [name, set] of QUOTA_SETS) runCase(quotaCase(name, true), 'EXPERIMENT', `quota run ${name} (TEST ASSUMPTION)`, { authorizedSet: set, attribute: attributeWith(lensPoolOf('A02-0'), set, true) })
    runCase(quotaCase('NP', false), 'CONTROL', 'quota control: the lone manipulation without the bypass (TEST ASSUMPTION)', { authorizedSet: setOf('NP'), attribute: attributeWith(lensPoolOf('A02-0'), setOf('NP'), false) })
    // R4-02 (review, batch A2): a set of two lies inside the 2-to-4 quota, so the switch should change nothing for it; measured, not assumed.
    runCase(quotaCase('NP+WZA', false), 'CONTROL', 'quota control: two manipulations without the bypass (a set inside 2 to 4) (TEST ASSUMPTION)', { authorizedSet: setOf('NP+WZA'), attribute: attributeWith(lensPoolOf('A02-0'), setOf('NP+WZA'), false) })
    for (const name of ['NP', 'NP+WZA']) runCase(quotaCase(name, true, 'A02-D'), 'EXPERIMENT', `quota run ${name} on A02-D (TEST ASSUMPTION)`, { authorizedSet: setOf(name) })
    // Stage W2 (11 November 2026): U3's runs table (two and three manipulations; the triple of E1's negative control), under the switch and the
    // treatment; and E3's reversal arm (foundation presence kept), controls, for the sets with no foundation member.
    for (const [name, set] of W2_SETS) runCase(quotaCase(name, true), 'EXPERIMENT', `quota run ${name} (TEST ASSUMPTION)`, { authorizedSet: set, attribute: attributeWith(lensPoolOf('A02-0'), set, true) })
    for (const name of FOUNDATION_KEPT_SETS) runCase(quotaCase(name, true, 'A02-0', 'KEPT'), 'CONTROL', `quota control: ${name} under the switch with foundation presence kept (the reversal arm of FOUNDATION_PRESENCE_BYPASS) (TEST ASSUMPTION)`, { authorizedSet: setOf(name), attribute: attributeWith(lensPoolOf('A02-0'), setOf(name), true, false) })
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
        runCase(c, 'EXPERIMENT', 'A02-0 consumed on the review pathway\'s K2 result without the restatement: the store copy holds only our DRAFT record, set aside under TT-K2-RETAIN-FORM')
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
    // Stage W1 (c1): the Game Problem Coverage-row arm under the goal's own wording (the reworded ones are built with test 5's runs).
    {
        const cl = coverageLensesCase()
        runCase(cl, 'EXPERIMENT', cl.label)
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
                runCase(c, 'EXPERIMENT', `quota run ${setName} under the ${name} wording (TEST ASSUMPTION)`, { authorizedSet: set, attribute: attributeWith(lensPoolOf(`A02-0~${name}`), set, true) }, realChain, kk)
            }
            runCase(withoutConsumption(caseOf('A02-0'), `L2~${name}`), 'LEGACY', `the chain's own route under the ${name} wording (the positive control)`, {}, observing, kk)
            // Stage W1 (c1): the Game Problem Coverage-row arm under the same wording.
            const cl = coverageLensesCase(name)
            runCase(cl, 'EXPERIMENT', cl.label, {}, realChain, kk)
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
            // Stage W1 (b): on the DRAFT-record arm, because dropping the upstream decisions drops K2's result with them (the record then
            // stands in, as on L2, so the chain's own route proceeds to its own pick).
            const w = withoutK2(caseOf('A02-0'))
            w.id = 'W-DROPS-UPSTREAM'
            runCase(w, 'CONTROL', 'A02-0 on the DRAFT-record arm under the same wording with a TEST-ONLY selectFor wrapper that drops the upstream decisions', {}, realChain, kk)
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
/** Stage W2: the runs of W2_SETS refused at selection (measured: two members of one role, refused by MEMBER_PRESENCE on every lens combination). */
export const W2_REFUSED = ['S4-NP+CDC', 'S4-NP+WZA+CDC']
/** Stage W1 (c1): the Coverage-row arm of A02-0 under the goal's wording and the two rewordings. */
export const GPCL_RUNS = ['', '~reversed', '~neutral'].map((w) => `A02-0${GPCL}${w}`)
/** Every experiment run that reached the chain (measured: every one but GP-001, which stops at the handoff). */
const REACHED_CHAIN = [
    'A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D',
    ...QUOTA_SETS.map(([name]) => `S4-${name}`), 'S4-NP@A02-D', 'S4-NP+WZA@A02-D',
    // Stage W2: the runs of W2_SETS.
    ...W2_SETS.map(([name]) => `S4-${name}`),
    'GP-002', 'GF7-CELL', 'A02-2/narrowed', 'A02-2/no-line-crossed', 'NO-RESTATEMENT',
    ...WORDED(['A02-0', 'A02-1', 'A02-2', ...QUOTA_SETS.map(([name]) => `S4-${name}`)]), 'A02-0~pressure',
    // Stage W1 (c1): the Game Problem Coverage-row arm under the three wordings.
    ...GPCL_RUNS,
]
/** The experiment runs whose account displays the approved condition as in this activity (measured: every run past selection with RPC-002's restatement). */
const DISPLAYED = [
    'A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D', 'S4-NP', 'S4-NP+WZA', 'S4-NP+TR', 'S4-NP@A02-D', 'S4-NP+WZA@A02-D',
    // Stage W2: the two runs of W2_SETS selected (then refused at knowledge).
    'S4-WZA+TR', 'S4-NP+WZA+TR',
    'GP-002', 'GF7-CELL', 'A02-2/narrowed', 'A02-2/no-line-crossed',
    ...WORDED(['A02-0', 'A02-1', 'A02-2', 'S4-NP', 'S4-NP+WZA']), 'A02-0~pressure',
    ...GPCL_RUNS,
]
const LEGACY_REACHED = ['GP-002/legacy', 'GF7-CELL/legacy', 'L1', 'L2', 'L3', 'A01', 'TA01', 'A05-0', 'D02', 'TA02', 'L2~reversed', 'L2~neutral', 'L2~pressure']
const LENSES_BEFORE = 'Possession Stability Opportunity, Space Creation Opportunity, Regain Opportunity'
const LENSES_AFTER = 'Line-Breaking Opportunity, Possession Stability Opportunity, Space Creation Opportunity'

/**
 * The rule each refused quota run was attributed to (measured: the exported package check re-run on the run's own lens pool with the selector's
 * options on the run; S4 pins it). Re-pinned openly in stage W2 (11 November 2026), keyed by run (the reworded Turnover Reward differs): was
 * { 'S4-WZA': 'FOUNDATION_CLAUSE', 'S4-TR': 'FOUNDATION_CLAUSE', 'S4-CDC': 'PACKAGE_ROW_O', 'S4-CDC+IR': 'PACKAGE_ROW_O' } for the four sets
 * and their rewordings. Why: under FOUNDATION_PRESENCE_BYPASS a lone member with no foundation reaches the kept checks: a lone Wide Zone
 * Advantage is one-sided (PACKAGE_OTHER) on every lens combination; a lone Turnover Reward fails row k on one of the goal's lens combinations
 * and row o on the other three (TR_PER_COMBO), and row k on every reworded one; Central Density Condition, alone and with Interception Reward,
 * row o as before. The runs of W2_SETS refused at selection: MEMBER_PRESENCE.
 */
const QUOTA_RULES: Record<string, string> = {
    'S4-WZA': 'PACKAGE_OTHER',
    'S4-TR': 'PACKAGE_ROW_K+PACKAGE_ROW_O',
    'S4-CDC': 'PACKAGE_ROW_O',
    'S4-CDC+IR': 'PACKAGE_ROW_O',
    'S4-NP+CDC': 'MEMBER_PRESENCE',
    'S4-NP+WZA+CDC': 'MEMBER_PRESENCE',
    ...Object.fromEntries(WORDED(['S4-WZA']).map((id) => [id, 'PACKAGE_OTHER'])),
    ...Object.fromEntries(WORDED(['S4-TR']).map((id) => [id, 'PACKAGE_ROW_K'])),
    ...Object.fromEntries(WORDED(['S4-CDC', 'S4-CDC+IR']).map((id) => [id, 'PACKAGE_ROW_O'])),
}
/** Stage W2: the refused quota runs held to OD-PACKAGE-LENSES, in the order its pairs list them. */
const PACKAGE_LENS_RUNS = [...QUOTA_REFUSED, ...W2_REFUSED, ...WORDED(QUOTA_REFUSED)]
/** Stage W2 (measured): the check that first refused a lone Turnover Reward on each of the goal's lens combinations, in the selector's order (k: row k; o: row o). */
const TR_PER_COMBO = ['k', 'o', 'o', 'o']
const baseOf = (id: string) => id.split('~')[0]

/*
 * OD-HINT-GAME-PROBLEM was closed in stage W1 (a), 11 November 2026: Step 1's Game Problem now governs the lens hints and matched signals on the
 * experiment path (guided-selection.ts `step1GameProblemId`), and the chain records which Game Problem did; every experiment run that reaches the
 * chain reads GAME_PROBLEM_HINTS CONSUMED (test 1), so the entry would be stale (it listed AGREES_INDEPENDENTLY on 39 runs, CONTRADICTED on GP-002).
 */
export const OPEN_DISCONNECTIONS: OpenDisconnection[] = [
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
        // Stage B1, re-pinned openly: build-activity.ts:641 -> :671 (the same literal, moved by the review-level account's hunks above it).
        // Stage B2, re-pinned openly: :671 -> :684 (the same literal, moved by our CANDIDATE wording's import and account type above it).
        evidence: 'build-activity.ts:684 reads only whether the context\'s contract is selected; on these runs no clause is carried, or only the control clause (its referent NO_FURTHER_VALUE in our CANDIDATE restatement since stage B1, under a declared treatment before); the requirement account reads NOT_CLASSIFIED (no requirement bindings for RPC-PROP-133), never a pass',
    },
    {
        id: 'OD-PACKAGE-LENSES',
        // Stage W2, re-pinned openly: the what was '... (the foundation clause's keyword threshold on the primary lens; row o)'; the runs gain
        // W2_REFUSED; each pair's rule as QUOTA_RULES says why. The foundation clause no longer refuses on this path (FOUNDATION_PRESENCE_BYPASS).
        what: 'after the form is consumed, a kept package check that reads the wording-derived lenses decides the selection (row o, row k and the other package checks on the members present, and every selected member validated)',
        scope: 'EXPERIMENT',
        rows: ['SELECTION_OUTCOME'],
        verdicts: ['ENGINE_RULE_DECIDED'],
        runs: PACKAGE_LENS_RUNS,
        pairs: PACKAGE_LENS_RUNS.map((run) => ({ run, verdict: 'ENGINE_RULE_DECIDED' as const, rule: QUOTA_RULES[run] })),
        evidence: `attributed by re-running the exported isSelectionPackageCompatible on GF2 and each of the 4 lens combinations, with the selector's options on the run (under the switch every selected member validated; foundation presence not required under FOUNDATION_PRESENCE_BYPASS): a lone Wide Zone Advantage is first refused as one-sided (the other package checks) on every combination; a lone Turnover Reward by row k on one of the goal's combinations and row o on the other three (row k on every reworded one); Central Density Condition alone and with Interception Reward first by row o; Neutral Player with Central Density Condition, and with Wide Zone Advantage too, by MEMBER_PRESENCE, Central Density Condition absent from the checked package (the check returns the first reason it meets; the members present are checked before every member's presence); ${ROLE_MIX_PASSES}`,
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
        // Stage W2, re-pinned openly: the after was '... is never tried: under the bypass the sizes enumerated for a set of 2 are 2 to 4, so the
        // refusal rests on row k together with that floor for subsets'; under the switch the set is now taken whole (E1), so it rests on row k.
        measured: {
            before: 'the goal\'s wording: selected on GF2 with Neutral Player and Turnover Reward, then refused at knowledge (the authorized constraint Turnover Reward has no contribution contract)',
            after: 'the reversed and the neutral wording: refused at selection, NO_COMPATIBLE_COMBINATION on GF2 (row k on every lens combination); lenses none; under the switch the authorized set is taken whole (stage W2), so the refusal rests on row k alone: a lone Neutral Player, which the package check admits on every lens combination of the reworded pool and which commits as S4-NP~reversed and S4-NP~neutral, is a different authorized set, never a subset the selector may choose',
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
 * Per decision row, the experiment runs that reach it (of 44; GP-001 stops at the handoff; a scoring clause is reached where a game is
 * built, a treatment withholds it, or the run's refusal cites its own line; the realizer's own refusal reaches realization). Re-pinned in
 * stage W1 (c1): of 41 -> of 44, each row reached by the three Coverage-row runs (refused at structure on the origin and control lines, as
 * A02-0) gains 3; progression and realization unchanged. Re-pinned in stage W2: of 44 -> of 48, each decision row gains the 4 runs of
 * W2_SETS (all reach the chain), SCORING_DISPLAY gains the 2 of them selected (WZA+TR, NP+WZA+TR, refused at knowledge, whose account
 * displays the condition); no clause row moves (none of the 4 is refused on a clause's line or builds a game). Re-pinned openly in stage B1
 * (12 November 2026): origin 25 -> 12 and control 23 -> 10 (the 13 runs refused at structure as A02-0 now stop on the pressing line's open
 * text, citing none of the origin's or the control's lines, so neither clause is reached: A02-0, S4-NP, S4-NP+WZA, the 3 Coverage-row runs,
 * the 6 rewordings of the first three, A02-0~pressure); REALIZATION 9 -> 12 (A02-1 and its 2 rewordings now pass structure: the control
 * referent NO_FURTHER_VALUE in our CANDIDATE restatement). Measured, not chosen.
 */
const REACH: Record<string, number> = {
    GAME_PROBLEM: 47,
    GAME_PROBLEM_HINTS: 47,
    CONTEXT: 47,
    GAME_FORM: 47,
    CONSTRAINTS: 47,
    SELECTION_OUTCOME: 47,
    'SCORING(origin)': 12,
    'SCORING(progression)': 12,
    'SCORING(control)': 10,
    SCORING_DISPLAY: 30,
    REALIZATION: 12,
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
/**
 * The report's counts over all runs: violation verdicts and detected disconnections (measured), and the detected ones by verdict. Re-pinned
 * openly in stage W1 (a): [171, 118] -> [128, 75]; CARRIED_NOT_READ 43 -> none (the Game Problem rows of the 40 experiment runs reaching the
 * chain and the 3 consuming controls now read CONSUMED); the violations fall by the 43 hints rows those runs read AGREES_INDEPENDENTLY (39 + 3)
 * or CONTRADICTED (GP-002) before. Re-pinned openly in stage W1 (b): [128, 75] -> [138, 94], all of it the five DRAFT-record controls (the
 * comparison arm, as the base runs were before the stage): 10 violation verdicts (CONTEXT and SCORING_DISPLAY, two each) and 19 detected
 * (K2_NOT_TAKEN 5, WITHHELD_BY_TREATMENT 9, REFUSED_ON_CLAUSE_LINE 3, CARRIED_UNDER_TREATMENT 2); the experiment path is unchanged. Re-pinned
 * openly in stage W1 (c1): [138, 94] -> [144, 100], all of it the three Coverage-row runs (as A02-0: CONTEXT and SCORING_DISPLAY two
 * violation verdicts each; REFUSED_ON_CLAUSE_LINE on origin and control, two detected each). Re-pinned openly in stage W2: [144, 100] ->
 * [156, 102]: the four runs of W2_SETS bring 6 violation verdicts (CONTEXT on each, SCORING_DISPLAY on the two selected, WZA+TR and NP+WZA+TR)
 * and 2 detected (ENGINE_RULE_DECIDED 14 -> 16: NP+CDC and NP+WZA+CDC, refused by MEMBER_PRESENCE); the three reversal-arm controls bring 6
 * violation verdicts (CONTEXT, and SELECTION_OUTCOME: the foundation clause, a bypassed rule, deciding). Every other run's counts unchanged
 * (S4-WZA, S4-TR and their rewordings stay one detected ENGINE_RULE_DECIDED each, now attributed to kept checks).
 */
/*
 * Re-pinned openly in stage B1 (12 November 2026): [156, 102] -> [156, 59]; the violation verdicts unchanged in every group; the detected fall
 * by 43: REFUSED_ON_CLAUSE_LINE 36 -> none (the 16 runs refused on the origin's and the control's lines, as A02-0, now stop at structure on the
 * pressing line's open text, citing no line: each clause reads NOT_REACHED; the 4 runs refused on the control's line, as A02-1, now build and
 * read the control CARRIED), CARRIED_UNDER_TREATMENT 7 -> none (TT-CONTROL-NO-FURTHER-VALUE retired: our CANDIDATE restatement of Christian's
 * rulings received 12 November 2026 declares the control referent NO_FURTHER_VALUE, so the 7 runs read the control CARRIED without a treatment).
 * SCORING_DISPLAY stays a violation on each (origin and progression are not carried). Measured, not chosen.
 */
const REPORT_COUNTS: number[] = [156, 59]
const DETECTED_BY_VERDICT = 'ENGINE_RULE_DECIDED 16, WITHHELD_BY_TREATMENT 38, K2_NOT_TAKEN 5'
/**
 * The same counts per group, in the order the runs are built: the experiment path, the controls, the legacy route (runs, violations, detected).
 * Re-pinned in stage W1 (a): experiment [41, 105, 108] -> [41, 65, 68]; controls [4, 15, 10] -> [4, 12, 7]; legacy unchanged. Stage W1 (b):
 * controls [4, 12, 7] -> [9, 22, 26] (the five DRAFT-record controls); the experiment path and the legacy route unchanged. Stage W1 (c1):
 * experiment [41, 65, 68] -> [44, 71, 74] (the three Coverage-row runs). Stage W2: experiment [44, 71, 74] -> [48, 77, 76] (the four runs of
 * W2_SETS); controls [9, 22, 26] -> [12, 28, 26] (the three reversal-arm controls); the legacy route unchanged. Stage B1 (REPORT_COUNTS
 * above): experiment [48, 77, 76] -> [48, 77, 43]; controls [12, 28, 26] -> [12, 28, 16]; the legacy route unchanged.
 */
const COUNTS_BY_GROUP: number[][] = [
    [48, 77, 43],
    [12, 28, 16],
    [21, 51, 0],
]
const Q = String.fromCharCode(34)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The assertions the tests share
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * The verdicts test 1 accepts for each owned decision: the Game Form and the constraints CONSUMED; since stage W1 (a), 11 November 2026, the Game
 * Problem and the Game Problem that governs the hints CONSUMED (re-pinned openly: the Game Problem was CARRIED_NOT_READ, a detected
 * disconnection, while no decision of the chain read Step 1's value; the hints row was not held here and read AGREES_INDEPENDENTLY or
 * CONTRADICTED, listed as OD-HINT-GAME-PROBLEM); each NOT_REACHED where not reached.
 */
const OWNED: Record<string, string[]> = { GAME_PROBLEM: ['CONSUMED', 'NOT_REACHED'], GAME_PROBLEM_HINTS: ['CONSUMED', 'NOT_REACHED'], GAME_FORM: ['CONSUMED', 'NOT_REACHED'], CONSTRAINTS: ['CONSUMED', 'NOT_REACHED'] }
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

test('1. every experiment run: the Game Form, the constraints, the Game Problem and the Game Problem that governs the hints CONSUMED (each NOT_REACHED where not reached); every violation and every lens-reading engine refusal listed as an open disconnection by its measured pair, and no entry stale; the legacy entries held the same way (reported only); every WITHHELD_BY_TREATMENT pinned per run; each decision reached by at least one run', () => {
    // Re-pinned in stage W1 (c1): 41 -> 44 (the three Coverage-row runs of GP_COVERAGE_LENSES). Stage W2: 44 -> 48 (the four runs of W2_SETS).
    assert.equal(EXPERIMENT_RUNS.length, 48, 'the experiment runs (measured)')
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
    // hint-governing Game Problem fails; a run whose chain records no Game Problem governing its hints (the stage W1 (a) record absent) fails on
    // both Game Problem rows; an engine refusal unattributed, or attributed to another rule, fails.
    assert.deepEqual(stale(legacyFindings.filter((f) => !(f.runId === 'TA01' && f.row === 'CONSTRAINTS')), legacyEntries), [{ entry: 'OD-LEGACY-VOCABULARY', run: 'TA01' }])
    const doctor = (id: string, change: (x: SafeguardRun) => void): Finding[] => {
        const x = copy(at(id).run)
        change(x)
        return ownershipOf(x)
    }
    const hintContradicted = doctor('A02-0', (x) => (x.chain!.consumption!.hintsGameProblemId = 'GP-099'))
    assert.equal(hintContradicted.find((f) => f.row === 'GAME_PROBLEM_HINTS')?.verdict, 'CONTRADICTED')
    assert.throws(() => assertExperimentRun(hintContradicted), (e: Error) => e.message.includes('ownership: A02-0: the Game Problem reading that governs the engine lens hints and matched signals'))
    const notRecorded = doctor('A02-0', (x) => (x.chain!.consumption!.hintsGameProblemId = null))
    assert.deepEqual(['GAME_PROBLEM', 'GAME_PROBLEM_HINTS'].map((row) => notRecorded.find((f) => f.row === row)?.verdict), ['CARRIED_NOT_READ', 'AGREES_INDEPENDENTLY'])
    assert.throws(() => assertExperimentRun(notRecorded), (e: Error) => e.message.includes('ownership: A02-0: the Game Problem owned by Step 1: CARRIED_NOT_READ'))
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
    // RE-PINNED OPENLY (stage B1, 12 November 2026). BEFORE: 16 experiment runs REFUSED_ON_CLAUSE_LINE (origin+control on A02-0 and its kin,
    // control on A02-1 and its rewordings), 4 CARRIED_UNDER_TREATMENT (the control, under TT-CONTROL-NO-FURTHER-VALUE), none CARRIED. AFTER: none
    // refused on a clause's line (A02-0 and its kin stop on the pressing line's open text, citing no line; A02-1 builds); none carried under a
    // treatment (the treatment retired); the control CARRIED on 7 experiment runs. WHY: our CANDIDATE restatement of Christian's rulings received
    // 12 November 2026 declares that the origin and the control name no place (NO_FURTHER_VALUE) and carries the origin on V6.
    assert.deepEqual(EXPERIMENT_RUNS.filter((id) => clausesWith(id, 'REFUSED_ON_CLAUSE_LINE').length), [])
    assert.deepEqual(EXPERIMENT_RUNS.filter((id) => clausesWith(id, 'CARRIED_UNDER_TREATMENT').length), [])
    assert.deepEqual(
        EXPERIMENT_RUNS.filter((id) => clausesWith(id, 'CARRIED').length).map((id) => [id, clausesWith(id, 'CARRIED').join('+')]),
        [['A02-1', 'control'], ['A02-1b', 'control'], ['A02-2', 'control'], ['A02-1~reversed', 'control'], ['A02-2~reversed', 'control'], ['A02-1~neutral', 'control'], ['A02-2~neutral', 'control']],
        'the control clause carried on our CANDIDATE restatement, without a treatment',
    )
    // What it rests on (A02-2, measured): the control referent's line holds no value, and our CANDIDATE restatement declares it needs none
    // (NO_FURTHER_VALUE, an established absence), so RPC-002-04.a is resolved; the line is kept in its own list, never dropped. Re-pinned openly
    // in stage B1 (resolved was ['RPC-002-04.b'] and the line was unestablished).
    assert.deepEqual(
        [at('A02-2').run.scoring?.resting, at('A02-2').run.scoring?.resolved, at('A02-2').run.scoring?.unestablished, at('A02-2').run.scoring?.noFurther],
        [['RPC-002-04.a', 'RPC-002-04.b'], ['RPC-002-04.a', 'RPC-002-04.b'], [], [{ itemId: 'RPC-002-04.a', lineId: 'c:restated:RPC-002:RPC-002-04.a::V5' }]],
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

/** The candidate knowledge the sport module's Coverage row records for a Game Problem: its lens ids, and the signal groups mapping first to it. */
const coverageOf = (gp: string) => {
    const row = soccerModule.coverageForGameProblem(gp) as Record<string, unknown>
    return {
        coverageId: String(row['coverage_id']),
        lenses: String(row['lens_ids']).split(';').map((s) => s.trim()).filter(Boolean),
        groups: Object.entries(SIGNAL_GROUP_TO_GAME_PROBLEM).filter(([, gps]) => gps[0] === gp).map(([group]) => group),
    }
}
const signalGroupsOf = (signals: string[] | undefined) => (signals ?? []).filter((s) => s.indexOf('signalGroup:') === 0)

test('3. dependency, Game Problem, the divergent arm (stage W1 (a)): GP-002 swapped into Step 1 (TEST ASSUMPTION) is reconsidered by Step 2 (SELECTED GF7), whose form the chain consumes (GF7), and governs the chain\'s lens hints and matched signals (the lens candidates are its Coverage row\'s seven, the matched signal groups the groups mapping first to GP-002), while the planning model\'s reading GP-015 stays in the account, APPROVED, beside it; the legacy route on the same input stays on GF3; GP-001 is reconsidered and stops before the chain', () => {
    const r = at('GP-002')
    assert.deepEqual([r.result.receive.step1?.primary, r.result.receive.step2?.status, r.result.receive.step2?.selected, r.result.receive.step2?.compatible], [['GP-002'], 'SELECTED', 'GF7', ['GF7']])
    // Reconsideration, read from Step 2's result and the account (never from a difference in outcome): Step 2's statement changed with it.
    assert.notEqual(r.result.form.premise?.note, at('A02-0').result.form.premise?.note)
    assert.deepEqual([r.result.consumption?.gameProblem?.gameProblemId, r.result.consumption?.gameProblem?.source, r.result.consumption?.form?.formId, r.result.consumption?.formCandidatesScored], ['GP-002', 'Step 1 (review pathway)', 'GF7', ['GF7']])
    assert.deepEqual([r.answer?.account?.gameProblem?.status, r.answer?.account?.gameProblem?.gameProblemId], ['APPROVED', 'GP-015'], 'the planning model\'s reading, beside Step 1\'s, never replaced by it (a TEST ASSUMPTION is never printed APPROVED)')
    // The divergent arm: the hints follow Step 1's GP-002 (its Coverage row CV-002), not the planning model's GP-015 nor the wording.
    const cv002 = coverageOf('GP-002')
    assert.equal(cv002.coverageId, 'CV-002')
    assert.equal(cv002.lenses.length, 7)
    assert.deepEqual([r.result.consumption?.hintsGameProblemId, r.result.consumption?.hintsGoverned, r.result.consumption?.lensCandidateIds, signalGroupsOf(r.result.consumption?.hintsSignals)], ['GP-002', true, cv002.lenses, cv002.groups])
    // The wording's own pool (A02-0, where Step 1 and the wording agree on GP-015) is the pressure group's three, which the arm no longer reads.
    const own = at('A02-0').result.consumption
    assert.deepEqual([own?.hintsGameProblemId, own?.hintsGoverned, own?.lensCandidateIds, signalGroupsOf(own?.hintsSignals)], ['GP-015', false, [L('possession-stability-opportunity'), L('regain-opportunity'), L('space-creation-opportunity')], ['signalGroup:B_pressure']])
    assert.notDeepEqual(r.result.consumption?.lensCandidateIds, own?.lensCandidateIds)
    // The engine lenses the arm committed are drawn from CV-002's pool (measured: Line-Breaking, Finishing, Possession Stability).
    assert.deepEqual(r.answer?.observed?.lensIds, [L('line-breaking-opportunity'), L('finishing-opportunity'), L('possession-stability-opportunity')])
    assert.ok(r.answer!.observed!.lensIds.every((id) => cv002.lenses.indexOf(id) >= 0))
    assert.deepEqual([verdictOf('GP-002', 'GAME_PROBLEM'), verdictOf('GP-002', 'GAME_PROBLEM_HINTS'), verdictOf('GP-002', 'GAME_FORM'), verdictOf('GP-002', 'CONSTRAINTS')], ['CONSUMED', 'CONSUMED', 'CONSUMED', 'CONSUMED'])
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
    // Stage W1 (a): under both rewordings the Game Problem that governs the hints stays Step 1's GP-015, and the consumed Game Problem, the
    // planning model's reading, the form, the context and the constraint candidates and authority do not move; the lens pool does move (the
    // wording's own three where Step 1 and the wording agree; CV-015's five where the rewording infers no Game Problem): OD-WORDING-LENSES.
    const cv015 = coverageOf('GP-015')
    for (const w of ['reversed', 'neutral'])
        for (const id of ['A02-0', 'A02-1', 'A02-2']) {
            const held = (r: Run) => json([r.result.consumption?.hintsGameProblemId, r.result.consumption?.gameProblem, r.answer?.account?.gameProblem?.status, r.answer?.account?.gameProblem?.gameProblemId, r.run.chain?.form, r.run.chain?.contextId, r.result.consumption?.constraintAuthority, r.result.consumption?.constraintCandidateIds])
            assert.equal(held(at(`${id}~${w}`)), held(at(id)), `${id}~${w}: the owned inputs do not move`)
            assert.equal(at(`${id}~${w}`).result.consumption?.hintsGameProblemId, 'GP-015')
            assert.deepEqual([at(id).result.consumption?.lensCandidateIds.length, at(`${id}~${w}`).result.consumption?.lensCandidateIds], [3, cv015.lenses], `${id}~${w}: the lens pool moves with the wording`)
        }
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
    // R1-05 (review, batch A2), re-pinned openly in stage W2 (11 November 2026): the after arm rested on row k together with the floor of 2 for
    // subsets (generateSelection.ts:1037 held '![2, 3, 4].includes(quotaBypassOwnSize) ? [quotaBypassOwnSize, 2, 3, 4] : [2, 3, 4]'). Under
    // the switch the only size tried is now the set's own (E1, :1047), so the set is taken whole and the refusal rests on row k alone; a lone
    // Neutral Player, which the package check admits on every lens combination of the reworded pool and whose own run commits, is another set.
    const sizesLine = fs.readFileSync(path.resolve(HERE, '..', 'test-library', 'generateSelection.ts'), 'utf8').split(/\r?\n/)[1047 - 1]
    assert.ok(sizesLine.includes('const constraintSizes = quotaBypassOwnSize !== null && quotaBypassOwnSize >= 1 ? [quotaBypassOwnSize] : [2, 3, 4]'), 'generateSelection.ts:1047: the sizes enumerated')
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
    const without = ownershipOf(safeguardRunOf(doctored, d.answer, true, { ...K2_FACTS, scoring: SCORING }))
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
    given: { gameProblemId: 'G1', contextId: 'X1', formId: 'F1', authorizedSet: ['m1'], recordKind: 'TEST_ONLY_RECORD', standIns: [], proposed: ['m1'] },
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
        consumption: { gameProblemId: 'G1', gameProblemSource: 'Step 1 (review pathway)', formCandidatesScored: ['F1'], formCandidatesFrom: 'SELECTION_TRACE_RANKING', constraintAuthority: 'AUTHORIZATION_RECORD', constraintCandidateIds: ['m1'], sizeRuleBypassed: true, hintsGameProblemId: 'G1', lensCandidateIds: ['L1', 'L2'], hintsSignals: ['S1'], k2: null },
        contextInThisActivity: true,
        scoringCondition: { state: 'NOT_CLASSIFIED', rowId: 'R1', carried: false },
    },
    scoring: { rowId: 'R1', clauses: [{ clause: 'origin', items: ['i1'] }], derived: ['i1'], resting: ['i1'], unestablished: [], resolved: ['i1'], withheld: [], declarationTreatments: [], refusedOn: [] },
    engineRule: null,
})
const verdictIn = (run: SafeguardRun, row: string) => ownershipOf(run).find((f) => f.row === row)!

test('7. the pure check returns each verdict on a minimal doctored fixture', () => {
    const base = fixture()
    // Re-pinned openly in stage W1 (a): the base fixture's chain records Step 1's G1 as governing its hints, so the Game Problem reads CONSUMED
    // (was CARRIED_NOT_READ, when no such record existed); without the record it still reads CARRIED_NOT_READ (below).
    assert.deepEqual(['GAME_PROBLEM', 'GAME_PROBLEM_HINTS', 'GAME_FORM', 'CONSTRAINTS', 'SELECTION_OUTCOME', 'SCORING', 'SCORING_DISPLAY', 'REALIZATION'].map((row) => verdictIn(base, row).verdict), ['CONSUMED', 'CONSUMED', 'CONSUMED', 'CONSUMED', 'LEGITIMATE_CHAIN_DECISION', 'CARRIED', 'CARRIED', 'LEGITIMATE_CHAIN_DECISION'])
    const v = (change: (x: SafeguardRun) => void, row: string): Finding => {
        const x = fixture()
        change(x)
        return verdictIn(x, row)
    }
    const carried = v((x) => (x.chain!.consumption!.hintsGameProblemId = null), 'GAME_PROBLEM')
    assert.deepEqual([carried.verdict, classOf(carried)], ['CARRIED_NOT_READ', 'DETECTED'], 'the carried Game Problem no decision reads is never a pass')
    assert.equal(v((x) => (x.chain!.consumption!.gameProblemSource = 'elsewhere'), 'GAME_PROBLEM_HINTS').verdict, 'AGREES_INDEPENDENTLY', 'equal hints with no Step 1 source are never consumption')
    assert.equal(v((x) => (x.chain!.consumption!.formCandidatesScored = ['F1', 'F2']), 'GAME_FORM').verdict, 'AGREES_INDEPENDENTLY')
    assert.equal(v((x) => (x.chain!.form = 'F2'), 'GAME_FORM').verdict, 'CONTRADICTED')
    assert.equal(v((x) => Object.assign(x.chain!, { consumption: null, outcome: 'refused', stage: 'selection', form: 'F2', ownPick: null }), 'GAME_FORM').verdict, 'REFUSED_ON_OWN_CHOICE')
    assert.equal(v((x) => (x.chain!.constraints = ['m9']), 'CONSTRAINTS').verdict, 'UNAUTHORIZED_SOURCE')
    assert.equal(v((x) => Object.assign(x.chain!, { constraints: ['m1'], constraintAuthority: 'VOCABULARY_POOL' }), 'CONSTRAINTS').verdict, 'UNAUTHORIZED_SOURCE')
    // Re-pinned openly in stage W2: the kept rule of this fixture was FOUNDATION_CLAUSE, which is now bypassed under its treatment and so never a
    // kept check (it reads VIOLATION below); row o stands in for a kept check.
    const refusedBy = (engineRule: EngineRuleAttribution) => v((x) => Object.assign(x, { engineRule, chain: { ...x.chain!, outcome: 'refused', stage: 'selection', refusalVerdict: 'NOT KNOWLEDGE', constraints: [] } }), 'SELECTION_OUTCOME')
    const kept = refusedBy({ rule: 'PACKAGE_ROW_O', how: 'h' })
    assert.deepEqual([kept.verdict, classOf(kept), kept.keptRule?.readsLenses], ['ENGINE_RULE_DECIDED', 'DETECTED', true])
    // Stage W2: a rule bypassed under the switch or a treatment deciding is never a kept check; the tightening is one; several kept checks, one
    // per lens combination, are one kept refusal (named together); several with a bypassed one among them are not.
    assert.deepEqual([refusedBy({ rule: 'FOUNDATION_CLAUSE', how: 'h' }), refusedBy({ rule: 'BOUNDED_SEARCH', how: 'h' })].map((f) => [f.verdict, classOf(f), f.keptRule]), [['ENGINE_RULE_DECIDED', 'VIOLATION', null], ['ENGINE_RULE_DECIDED', 'VIOLATION', null]])
    const member = refusedBy({ rule: 'MEMBER_PRESENCE', how: 'h' })
    assert.deepEqual([classOf(member), member.keptRule?.id], ['DETECTED', 'MEMBER_PRESENCE'])
    const several = refusedBy({ rule: null, rules: ['PACKAGE_ROW_K', 'PACKAGE_ROW_O'], how: 'h' })
    assert.deepEqual([classOf(several), several.keptRule?.id, several.why.startsWith('refused by engine rules kept under the authorization\'s section 5, each lens combination by one of them: PACKAGE_ROW_K (')], ['DETECTED', 'PACKAGE_ROW_K+PACKAGE_ROW_O', true])
    assert.equal(classOf(refusedBy({ rule: null, rules: ['PACKAGE_ROW_O', 'SIZE_RULE'], how: 'h' })), 'VIOLATION')
    // The rows of a refusal over lens combinations: one for all; each combination's own; none where one combination has no row.
    const ROW_K_WORDS = 'Constraint X does not support the selected affordance tag group.'
    const ROW_O_WORDS = 'The selected package does not show a clear relationship to the selected affordance or open problem space.'
    assert.deepEqual([rulesOfCombinations([[ROW_O_WORDS], [ROW_O_WORDS]]), rulesOfCombinations([[ROW_O_WORDS], [ROW_K_WORDS]]), rulesOfCombinations([[ROW_O_WORDS], ['an unknown reason']]), rulesOfCombinations([])], [['PACKAGE_ROW_O'], ['PACKAGE_ROW_K', 'PACKAGE_ROW_O'], null, null])
    // Stage W2: a built strict subset of the record's set is never consumption (UNAUTHORIZED_SOURCE): which members to commit was the commit
    // rule's, not the record's; the same set refused at selection (nothing built) is not; the whole set built is consumed.
    const subsetOf = (stage: string | null, built: string[]) => v((x) => {
        x.given.authorizedSet = ['m1', 'm2']
        x.chain!.consumption!.constraintCandidateIds = ['m1', 'm2']
        Object.assign(x.chain!, { constraints: built, ...(stage ? { outcome: 'refused', stage } : {}) })
    }, 'CONSTRAINTS')
    const strict = subsetOf(null, ['m1'])
    assert.deepEqual([strict.verdict, strict.why.includes('a strict subset of the authorized set') && strict.why.includes('Q-a1')], ['UNAUTHORIZED_SOURCE', true])
    assert.deepEqual([subsetOf('selection', []).verdict, subsetOf(null, ['m1', 'm2']).verdict], ['CONSUMED', 'CONSUMED'])
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
    assert.equal(v((x) => (x.chain!.consumption!.hintsGameProblemId = 'G2'), 'GAME_PROBLEM_HINTS').verdict, 'CONTRADICTED')
    assert.equal(v((x) => Object.assign(x.chain!, { gameProblemId: 'G2', consumption: { ...x.chain!.consumption!, hintsGameProblemId: null } }), 'GAME_PROBLEM_HINTS').verdict, 'CONTRADICTED', 'without the record, the planning model\'s reading against Step 1\'s')
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

// Stage W2: the runs of W2_SETS and the reversal arm join the quota runs (re-pinned openly: was the first four groups only).
const QUOTA_RUNS = [...QUOTA_SETS.map(([name]) => `S4-${name}`), 'S4-NP/no-bypass', 'S4-NP+WZA/no-bypass', 'S4-NP@A02-D', 'S4-NP+WZA@A02-D', ...W2_SETS.map(([name]) => `S4-${name}`), ...FOUNDATION_KEPT_SETS.map((name) => `S4-${name}${FOUNDATION_KEPT}`)]
const setOfRun = (id: string): string[] => setOf(id.slice(3).split('/')[0].split('@')[0].split('~')[0])
/** Stage W2: the rule a refused run was attributed to, or its rules joined (one per lens combination, where they differ). */
const ruleOfRun = (id: string): string | null => {
    const e = at(id).run.engineRule
    return e ? (e.rules && e.rules.length ? e.rules.join('+') : e.rule) : null
}

test('S4. zero, one, two and three manipulations only through the DRAFT record\'s authorized set (the record route, never placed), with the TEST-ONLY switch (since stage W2 the set taken whole, every selected member validated) and FOUNDATION_PRESENCE_BYPASS: the pool is the authorized set; the triples (a lone Neutral Player selected with the switch and refused without it; each refusal attributed by re-running the exported package check with the run\'s options; the run\'s own refusal); the lines a manipulation brings rest on its stand-in (class 4 at best); A01 unchanged', () => {
    // The quota cases are held to the handoff's own validator.
    const quotaCases = [...QUOTA_SETS.map(([name]) => quotaCase(name, true)), quotaCase('NP', false), quotaCase('NP+WZA', false), quotaCase('NP', true, 'A02-D'), quotaCase('NP+WZA', true, 'A02-D'), ...W2_SETS.map(([name]) => quotaCase(name, true)), ...FOUNDATION_KEPT_SETS.map((name) => quotaCase(name, true, 'A02-0', 'KEPT'))]
    assert.deepEqual(quotaCases.map((c) => c.id), QUOTA_RUNS)
    assert.doesNotThrow(() => validateHandoffInputs(composed([...raw.cases, ...quotaCases])))
    for (const id of QUOTA_RUNS) {
        const r = at(id)
        const set = setOfRun(id)
        const switched = id.indexOf('/no-bypass') < 0
        const foundationBypassed = switched && id.indexOf(FOUNDATION_KEPT) < 0
        assert.deepEqual(r.request?.place, [], `${id}: nothing is placed`)
        assert.deepEqual([r.request?.recordRoute, r.request?.consume?.sizeRuleBypass ?? false, r.request?.consume?.foundationPresenceBypass ?? false], [set, switched, foundationBypassed], id)
        assert.deepEqual([r.result.consumption?.constraintAuthority, r.result.consumption?.constraintCandidateIds, r.result.consumption?.sizeRuleBypassed, r.result.consumption?.foundationPresenceBypassed ?? false], ['AUTHORIZATION_RECORD', set, switched, foundationBypassed], `${id}: the selection's pool is the authorized set`)
        assert.equal(verdictOf(id, 'CONSTRAINTS'), 'CONSUMED', id)
    }
    // (i) the positive control: size 1 was tried only with the bypass.
    assert.deepEqual([at('S4-NP').result.chain?.stage, at('S4-NP').run.chain?.form, at('S4-NP').run.chain?.constraints, at('S4-NP').result.chain?.reasons], ['structure', 'GF2', setOf('NP'), at('A02-0').result.chain?.reasons])
    assert.deepEqual([at('S4-NP/no-bypass').result.chain?.stage, at('S4-NP/no-bypass').answer?.observed?.constraintGap, at('S4-NP/no-bypass').run.engineRule?.rule, classOf(at('S4-NP/no-bypass').findings.find((f) => f.row === 'SELECTION_OUTCOME')!)], ['selection', 'NO_COMPATIBLE_COMBINATION', 'SIZE_RULE', 'VIOLATION'])
    // (ii) attribution: the run's lens pool is the zero-set run's committed lenses (lens scoring does not read the set: the selected Neutral
    // Player run commits the same three), and the exported package check refuses every lens combination with one check's own reason.
    assert.deepEqual(at('S4-NP').answer?.observed?.lensIds, at('A02-0').answer?.observed?.lensIds)
    // Re-pinned openly in stage W2 (QUOTA_RULES says before and why): Wide Zone Advantage and Turnover Reward alone were refused by the
    // foundation clause; under FOUNDATION_PRESENCE_BYPASS they reach the kept checks.
    assert.deepEqual(QUOTA_REFUSED.map((id) => [id, ruleOfRun(id)]), [['S4-WZA', 'PACKAGE_OTHER'], ['S4-TR', 'PACKAGE_ROW_K+PACKAGE_ROW_O'], ['S4-CDC', 'PACKAGE_ROW_O'], ['S4-CDC+IR', 'PACKAGE_ROW_O']])
    // The reworded refused runs, attributed the same way (measured), as OD-PACKAGE-LENSES pairs them.
    assert.deepEqual(WORDED(QUOTA_REFUSED).map((id) => [id, ruleOfRun(id)]), WORDED(QUOTA_REFUSED).map((id) => [id, QUOTA_RULES[id]]))
    assert.deepEqual(WORDED(QUOTA_REFUSED).map((id) => ruleOfRun(id)), ['PACKAGE_OTHER', 'PACKAGE_ROW_K', 'PACKAGE_ROW_O', 'PACKAGE_ROW_O', 'PACKAGE_OTHER', 'PACKAGE_ROW_K', 'PACKAGE_ROW_O', 'PACKAGE_ROW_O'])
    const FOUNDATION = `No compatible foundation constraint was found for archetype ${Q}Directional Possession Games${Q}.`
    const ROW_O = 'The selected package does not show a clear relationship to the selected affordance or open problem space.'
    const ROW_K_TR = `Constraint ${Q}Turnover Reward${Q} does not support the selected affordance tag group.`
    const ONE_SIDED = 'The selected package reads as one-sided and does not depend enough on opponent interaction.'
    const combos = ['possession-stability-opportunity+space-creation-opportunity', 'possession-stability-opportunity+regain-opportunity', 'space-creation-opportunity+regain-opportunity', 'possession-stability-opportunity+space-creation-opportunity+regain-opportunity']
    assert.deepEqual(attributions.get('S4-WZA')?.perCombo, combos.map((c) => `${c}: ${ONE_SIDED}`))
    assert.deepEqual(attributions.get('S4-TR')?.perCombo, TR_PER_COMBO.map((reason, n) => `${combos[n]}: ${reason === 'k' ? ROW_K_TR : ROW_O}`))
    assert.deepEqual(attributions.get('S4-CDC')?.perCombo, combos.map((c) => `${c}: ${ROW_O}`))
    assert.deepEqual(attributions.get('S4-CDC+IR')?.perCombo, combos.map((c) => `${c}: ${ROW_O}`))
    // Stage W2, E3's negative control: the reversal arm (foundation presence kept) is refused by the foundation clause on every lens
    // combination, as the 10 November attribution read; a bypassed rule deciding is never a kept check (VIOLATION, controls only).
    for (const name of FOUNDATION_KEPT_SETS) {
        const id = `S4-${name}${FOUNDATION_KEPT}`
        assert.deepEqual([at(id).result.chain?.stage, ruleOfRun(id), attributions.get(id)?.perCombo, classOf(at(id).findings.find((f) => f.row === 'SELECTION_OUTCOME')!)], ['selection', 'FOUNDATION_CLAUSE', combos.map((c) => `${c}: ${FOUNDATION}`), 'VIOLATION'], id)
        assert.throws(() => assertExperimentRun(at(id).findings), /whether the selection commits .*ENGINE_RULE_DECIDED: refused at selection after consuming the form, by a rule not attributed to a kept check/, id)
    }
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
// Stage W2 (11 November 2026): quotas versus justified validation (U3 (a)): E1 the set whole, E2 the pool whole, E3 FOUNDATION_PRESENCE_BYPASS,
// E4 every selected member validated; the role mix inert. Christian: "A library constraint is not mandatory unless its inclusion is justified
// by the approved knowledge and intended learning environment." and "The engine should continue enforcing structural validity and any genuinely
// required conditions." (received 15 October 2026); "Removing unsupported constraint quotas from isolated testing while retaining justified
// validation." (received 11 November 2026, second reply).
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * The base runs as the committed evidence held them when stage W2 began (8d5a3f3): sha-256 of each run's handoff result and of its findings
 * (compact JSON of a02-results.json's a02Cases and safeguardRuns entries). Row 0 of U3's runs table: the empty set, untouched by the stage.
 *
 * RE-PINNED OPENLY (stage B1 of the A02 complete-activity package, 12 November 2026). BEFORE: the five hashes at 8d5a3f3 (A02-0 ff86c208.../
 * b0151c96..., A02-1 25d70953.../023a3bcd..., A02-1b 3f55ca0d.../91faebdf..., A02-2 e375900d.../ad1ab834..., A02-D 82c19b23.../bc230e66...).
 * AFTER: re-measured at B1 (scratchpad pkg3/B1/safeguard-measure.txt). WHY: stage B1 restates RPC-002 on Christian's rulings received 12 November
 * 2026 (the origin's words on V6, the origin and the continuation NO_FURTHER_VALUE), so A02-0, A02-1, A02-1b and A02-2 change by design (A02-0 now
 * stops at structure on the pressing line's open text, A02-1 at validation); A02-D's findings are unchanged. The claim this pin holds is
 * unchanged: the quota stage (W2) touches no base run; the base runs now are B1's.
 */
const BASE_AT_8D5A3F3: Record<string, [string, string]> = {
    'A02-0': ['cf0ee7dadcc3a4baf23d9a489a612d01e8b9eac0fe9d92d9ea42987f002dde36', '1f7fbd1057884f9ca701069a793dad2faa6e3f24e13b3ead6e3e557312d0b535'],
    'A02-1': ['9a0839e81e4b46fa8662885fe33235bb6b5b4186746b23109aa2e952ccc3b477', '8c7164d8cb7b6e60d4e943dbb5dcc1aa6019263013935e563a7d553219f7874a'],
    'A02-1b': ['92a3b8342fa8096312e4eadc3ba24343fa368057dea654a6cc6e85bf2e7f0940', '139bd70d9b6fa0d7f32d598e6b9ebcb27b1193a5a031cef4a5188e5e68bd0346'],
    'A02-2': ['f12be29aaa1b67da7eb8205fc7e5d26b2f87a927a82ce4658cd170b29d0a5482', '0f282c0409980f19d42e82c806c80c55b4899c385bb752fe8f3b6fc0b0222bba'],
    'A02-D': ['49236ec9f719e3bf56b91017522e8399b1758613cedff79da5334c7394466d8d', 'bc230e663b31ceea22c7aedf40100c71137dc5126ab936ea30c709a0a6a1d5d9'],
}
const sha = (v: unknown) => crypto.createHash('sha256').update(json(v)).digest('hex')
/**
 * U3's runs table, measured (stage W2): each run with how many manipulations, where it stopped, and the named check that refused it at
 * selection, or 'selected' (the whole set committed; a later stop is the chain's own, read beside it). Never SIZE_RULE, foundation presence,
 * ROLE_MIX or BOUNDED_SEARCH.
 */
export const W2_RUNS_TABLE: Array<[string, number, string, string]> = [
    ['A02-0', 0, 'structure', 'selected (the empty set, the zero branch)'],
    // Re-pinned openly (stage B1): A02-1 'structure' -> 'validation' (its control line is no longer owed: our CANDIDATE restatement).
    ['A02-1', 0, 'validation', 'selected (the empty set, the zero branch)'],
    ['A02-1b', 0, 'validation', 'selected (the empty set, the zero branch)'],
    ['A02-2', 0, 'communication', 'selected (the empty set, the zero branch)'],
    ['A02-D', 0, 'served', 'selected (the empty set, the zero branch)'],
    ['S4-NP', 1, 'structure', 'selected'],
    ['S4-WZA', 1, 'selection', 'PACKAGE_OTHER'],
    ['S4-TR', 1, 'selection', 'PACKAGE_ROW_K+PACKAGE_ROW_O'],
    ['S4-CDC', 1, 'selection', 'PACKAGE_ROW_O'],
    ['S4-NP+WZA', 2, 'structure', 'selected'],
    ['S4-NP+TR', 2, 'knowledge', 'selected'],
    ['S4-NP+TR~reversed', 2, 'selection', 'PACKAGE_ROW_K'],
    ['S4-NP+CDC', 2, 'selection', 'MEMBER_PRESENCE'],
    ['S4-WZA+TR', 2, 'knowledge', 'selected'],
    ['S4-NP+WZA+TR', 3, 'knowledge', 'selected'],
    ['S4-NP+WZA+CDC', 3, 'selection', 'MEMBER_PRESENCE'],
]
/** The checks a run may never be refused by on the experiment path (the quotas, and the role mix and the bounded search). */
const NEVER_BY = ['SIZE_RULE', 'FOUNDATION_CLAUSE', 'ROLE_MIX', 'BOUNDED_SEARCH']
/**
 * E4's invariant (the safeguard that would have caught the hole): a committed selection's every constraint is a member of the package the
 * selector's own check builds on its committed lenses (in their committed order: the first is the primary lens) and form. It reads the package
 * the builder returned (a probe on the builder, removed after), never the check's own refusal, so it holds even where the tightening itself is
 * broken. Returns the members absent, by id.
 */
export function absentFromPackage(formId: string, lensIds: string[], constraintIds: string[]): string[] {
    if (!constraintIds.length) return []
    let built: { foundation?: { constraint: { _id: unknown } }; shaping?: { constraint: { _id: unknown } }; consequence?: { constraint: { _id: unknown } } } | null = null
    const original = packageBuilder.buildConstraintPackage
    ;(packageBuilder as any).buildConstraintPackage = (...args: unknown[]) => (built = (original as any)(...args))
    try {
        isSelectionPackageCompatible({ archetype: archetypeOf(formId), affordanceLenses: lensIds.map(lensOf), constraints: constraintIds.map(constraintOf), requireShaping: false, everyMemberValidated: true, foundationPresenceBypass: true })
    } finally {
        ;(packageBuilder as any).buildConstraintPackage = original
    }
    assert.equal(packageBuilder.buildConstraintPackage, original, 'the probe on the builder is removed')
    if (!built) return ['(no package was built)']
    const b = built as NonNullable<typeof built>
    const present = [b.foundation, b.shaping, b.consequence].filter((m) => m !== undefined).map((m) => String(m!.constraint._id))
    return constraintIds.filter((id) => present.indexOf(id) < 0)
}
/**
 * The production route's selections, measured (stage W2), reported only, never changed: each Learning Goal's committed selection (production
 * hints, two arguments) with the constraints absent from the package the production check built on its committed lenses (E4's invariant).
 */
export const PRODUCTION_ABSENT: Array<[string, string]> = [
    ['A03', 'central-density-condition'],
    ['A04', 'zone-structure-condition'],
    ['A05', 'turnover-reward'],
    ['A06', 'goalkeeper-included-condition'],
    ['D01', 'central-density-condition'],
    ['D02', 'interception-reward'],
    ['TA01', 'interception-reward'],
    ['TA02', 'turnover-reward'],
    ['TD01', 'transition-trigger'],
    ['TD02', 'central-density-condition, delay-reward'],
]
/** The runs of this file that committed constraints (the experiment path and the controls; measured, stage W2), each held to E4's invariant. */
const COMMITTED_RUNS: string[] = [
    'S4-NP', 'S4-NP+WZA', 'S4-NP+TR', 'S4-NP+WZA/no-bypass', 'S4-NP@A02-D', 'S4-NP+WZA@A02-D', 'S4-WZA+TR', 'S4-NP+WZA+TR',
    'S4-NP~reversed', 'S4-NP+WZA~reversed', 'S4-NP~neutral', 'S4-NP+WZA~neutral',
]
const PRODUCTION_GOALS = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'D01', 'D02', 'D03', 'TA01', 'TA02', 'TD01', 'TD02']
/** The production route's committed selections, read as production calls the selector (the goal's text and guided hints, two arguments). */
function productionSelections(): Array<{ goal: string; formId: string; lensIds: string[]; constraintIds: string[] } | { goal: string; refused: string }> {
    return PRODUCTION_GOALS.map((goal) => {
        const text = guidedGoalText(goal)
        try {
            const r = generateSelection({ learningGoals: [text], learningGoalId: goal } as any, guidedSelectionHints(goal, text, learningGoalAuthorizations()).hints)
            return { goal, formId: r.archetype.game_form_id, lensIds: r.affordanceLenses.map((l: any) => l.id), constraintIds: r.constraints.map((c: any) => c.id) }
        } catch (error) {
            return { goal, refused: String((error as Error).message).split(' - ')[0] }
        }
    })
}

test('W2. quotas versus justified validation (U3 (a)): the runs table, each run selected whole or refused by a named kept check, never by the size rule, foundation presence, the role mix or the bounded search; E1 the set whole (a strict subset reads UNAUTHORIZED_SOURCE); E2 the pool whole (probe: the whole set reaches the package check); E3 FOUNDATION_PRESENCE_BYPASS (declared, refused off the switch; its reversal arm the controls); E4 every selected member validated (its invariant over every committed run, the production hole measured and reported only); the role mix inert; the base runs byte-identical to the evidence', () => {
    // Row 0: the base runs are the committed evidence's, byte for byte (result and findings).
    for (const id of BASE_IDS) assert.deepEqual([sha(at(id).result), sha(at(id).findings)], BASE_AT_8D5A3F3[id], `${id}: byte-identical to the base runs as stage B1 left them (8d5a3f3's before B1; see the re-pin above)`)
    // The table: each run's size, stop and the check that refused it (or selected, the whole set committed).
    const measured = W2_RUNS_TABLE.map(([id]) => {
        const r = at(id)
        const stop = r.result.chain?.outcome === 'served' ? 'served' : String(r.result.chain?.stage)
        const zero = (r.run.chain?.consumption?.constraintCandidateIds ?? []).length === 0
        const by = r.result.chain?.stage === 'selection' ? String(ruleOfRun(id)) : zero ? 'selected (the empty set, the zero branch)' : 'selected'
        return [id, (r.run.chain?.consumption?.constraintCandidateIds ?? []).length, stop, by] as [string, number, string, string]
    })
    assert.deepEqual(measured, W2_RUNS_TABLE)
    // Every switched quota run of the experiment path: selected whole, or refused at selection by kept checks only (each named; held to test 1).
    const switched = EXPERIMENT_RUNS.filter((id) => at(id).result.consumption?.sizeRuleBypassed === true)
    assert.equal(switched.length, 27, 'the switched experiment runs (measured: the 7 sets, their 14 rewordings, 2 on A02-D, the 4 of W2_SETS)')
    for (const id of switched) {
        const r = at(id)
        if (r.result.chain?.stage === 'selection') {
            const rules = String(ruleOfRun(id)).split('+')
            assert.ok(rules.every((rule) => NEVER_BY.indexOf(rule) < 0 && DISPOSITION.some((d) => d.id === rule && (d.disposition === 'KEPT_ENFORCED' || d.disposition === 'TIGHTENING_UNDER_SWITCH'))), `${id}: refused by ${rules.join(', ')}`)
            assert.equal(classOf(r.findings.find((f) => f.row === 'SELECTION_OUTCOME')!), 'DETECTED', id)
        } else assert.deepEqual(r.run.chain?.constraints, setOfRun(id), `${id}: the whole set committed`)
    }
    // E1, the set whole: under the switch the only size tried is the set's own (generateSelection.ts:1047), and the contract admits exactly it.
    const source = fs.readFileSync(path.resolve(HERE, '..', 'test-library', 'generateSelection.ts'), 'utf8').split(/\r?\n/)
    assert.ok(source[1047 - 1].includes('? [quotaBypassOwnSize] : [2, 3, 4]') && source[719 - 1].includes('if (nc !== quotaBypassOwnSize)'), 'the set whole, at the size rule\'s two places')
    // E1's triple, chosen by measurement: the whole fails a kept check (MEMBER_PRESENCE) on every lens combination, while its pair Neutral Player
    // with Wide Zone Advantage passes on every one; so the legacy sizes would commit the pair, and E1 refuses the set whole.
    const lensPool = at('A02-0').answer!.observed!.lensIds
    const combosOf = (set: string[], options: object) => [...subsets(lensPool, 2), ...subsets(lensPool, 3)].map((lc) => isSelectionPackageCompatible({ archetype: archetypeOf('GF2'), affordanceLenses: lc.map(lensOf), constraints: set.map(constraintOf), requireShaping: false, ...options }).compatible)
    const SWITCH = { everyMemberValidated: true, foundationPresenceBypass: true }
    assert.deepEqual([combosOf(setOf('NP+WZA+CDC'), SWITCH), combosOf(setOf('NP+WZA'), SWITCH)], [[false, false, false, false], [true, true, true, true]])
    assert.deepEqual([at('S4-NP+WZA+CDC').result.chain?.stage, at('S4-NP+WZA+CDC').run.chain?.constraints], ['selection', []])
    // Its safeguard, a doctored copy of the run: the pair built (as the legacy sizes commit it) reads UNAUTHORIZED_SOURCE and fails test 1.
    const pairBuilt = copy(at('S4-NP+WZA+CDC').run)
    Object.assign(pairBuilt.chain!, { outcome: 'refused', stage: 'structure', constraints: setOf('NP+WZA') })
    const pairVerdict = ownershipOf(pairBuilt).find((f) => f.row === 'CONSTRAINTS')!
    assert.deepEqual([pairVerdict.verdict, pairVerdict.why.indexOf('not built: tl-v0-constraint-central-density-condition') > 0], ['UNAUTHORIZED_SOURCE', true])
    assert.throws(() => assertExperimentRun(ownershipOf(pairBuilt)), /owned by the upstream result the chain takes, one of: .*: UNAUTHORIZED_SOURCE: built tl-v0-constraint-neutral-player-condition, tl-v0-constraint-wide-zone-advantage, a strict subset/)
    // E2, the pool whole, observed by a probe on the package check: three members of one role in a TEST-ONLY record-backed pool, directly. Under
    // the switch the whole set reaches the check on every lens combination (and is refused there by MEMBER_PRESENCE); without it, the cap of 2
    // per role drops one first, so the whole set never reaches the check (the in-test negative control).
    const text = guidedGoalText('A02')
    const three = [C('neutral-player-condition'), C('central-density-condition'), C('zone-structure-condition')]
    const recordHints = { ...guidedSelectionHints('A02', text).hints, candidateArchetypeIds: ['GF2'], candidateConstraintIds: three, constraintAuthority: { authority: 'AUTHORIZATION_RECORD' as const, learningGoalId: 'A02', constraintPrinciple: { ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', principle: 'TEST-ONLY fixture: a record-backed pool of three structure members, never knowledge' } } }
    const probe = (quotaBypass: boolean) => {
        const seen: string[] = []
        const original = compatibility.isSelectionPackageCompatible
        ;(compatibility as any).isSelectionPackageCompatible = (input: any) => {
            const r = original(input)
            seen.push(`${input.constraints.length}: ${r.compatible ? 'compatible' : r.reasons.join(' | ').indexOf(compatibility.ABSENT_MEMBER_WORDS) >= 0 ? 'MEMBER_PRESENCE' : 'other'}`)
            return r
        }
        let reason = ''
        try {
            generateSelection({ learningGoals: [text], learningGoalId: 'A02' } as any, recordHints, quotaBypass, quotaBypass)
        } catch (error) {
            reason = String((error as any).reason ?? (error as Error).message)
        } finally {
            ;(compatibility as any).isSelectionPackageCompatible = original
        }
        assert.equal(compatibility.isSelectionPackageCompatible, original, 'the probe is removed')
        return { seen, reason }
    }
    const whole = probe(true)
    assert.deepEqual([whole.seen.filter((s) => s.indexOf('3: ') === 0), whole.reason], [['3: MEMBER_PRESENCE', '3: MEMBER_PRESENCE', '3: MEMBER_PRESENCE', '3: MEMBER_PRESENCE'], 'NO_COMPATIBLE_COMBINATION'])
    const capped = probe(false)
    assert.deepEqual(capped.seen.filter((s) => s.indexOf('3: ') === 0), [], 'without the switch the cap drops a member before the check: the whole set never reaches it')
    // E3, declared and reversible: refused off the switch at every layer (the handoff's validator, the selection's shape check, the selector, the
    // package check without E4); its reversal arm is held in S4.
    const declared: any = quotaCase('NP', true)
    declared.testOnlyTreatments = declared.testOnlyTreatments.filter((t: any) => t.kind !== 'SIZE_RULE_BYPASS')
    assert.throws(() => validateHandoffInputs(composed([...raw.cases, declared])), /FOUNDATION_PRESENCE_BYPASS is declared at most once, and only beside SIZE_RULE_BYPASS/)
    const twice: any = quotaCase('NP', true)
    twice.testOnlyTreatments.push({ ...FOUNDATION_PRESENCE, id: 'TT-FOUNDATION-PRESENCE-BYPASS-AGAIN' })
    assert.throws(() => validateHandoffInputs(composed([...raw.cases, twice])), /FOUNDATION_PRESENCE_BYPASS is declared at most once/)
    const consume = at('S4-NP').request!.consume!
    const upstream = { gameProblem: { gameProblemId: consume.gameProblem.gameProblemId, step1Basis: consume.gameProblem.basis as 'APPROVED_TRANSLATION', label: consume.gameProblem.label }, gameForm: copy(consume.gameForm), foundationPresenceBypass: true }
    assert.throws(() => boundedSelection.selectFor('A02', null, learningGoalAuthorizations(), undefined, undefined, upstream), /they lack foundationPresenceBypass as a boolean, true only beside quotaBypass/)
    assert.throws(() => generateSelection({ learningGoals: [text], learningGoalId: 'A02' } as any, recordHints, false, true), /FOUNDATION_PRESENCE_BYPASS is honoured only under the quota bypass/)
    assert.throws(() => isSelectionPackageCompatible({ archetype: archetypeOf('GF2'), affordanceLenses: lensPool.slice(0, 2).map(lensOf), constraints: setOf('WZA').map(constraintOf), foundationPresenceBypass: true }), /applied only with every selected member validated/)
    // E4, every selected member validated: two members of one role are refused by it; the direct fixture: the production check admits Neutral
    // Player with Central Density Condition on every lens combination while Central Density Condition is absent from its package (the hole).
    assert.deepEqual([ruleOfRun('S4-NP+CDC'), combosOf(setOf('NP+CDC'), {}), combosOf(setOf('NP+CDC'), { everyMemberValidated: true })], ['MEMBER_PRESENCE', [true, true, true, true], [false, false, false, false]])
    assert.deepEqual(absentFromPackage('GF2', lensPool, setOf('NP+CDC')), [C('central-density-condition')], 'the invariant names the member the production check never validated')
    // The role mix, inert under the switch: every singleton, pair and triple of the library passes whole, its needs read over itself (each
    // member counted compatible, the strictest needs); bite: with the library-wide needs a pair is refused.
    const library = testLibraryRegistry.selectableConstraints()
    const rowsOf = (cs: any[]) => cs.map((c) => ({ c, score: 1, reasons: [] as string[], bucket: constraintBalanceBucket(c) }))
    const wholeSets = [...subsets(library, 1), ...subsets(library, 2), ...subsets(library, 3)]
    assert.equal(library.length, 23)
    assert.deepEqual([wholeSets.length, wholeSets.filter((set) => !constraintComboPassesRoleMix(set, rowsOf(set))).length], [23 + 253 + 1771, 0])
    const libraryWide = rowsOf(library)
    assert.ok(subsets(library, 2).some((pair) => !constraintComboPassesRoleMix(pair, libraryWide)), 'bite: with the library-wide needs a pair is refused')
    assert.ok(DISPOSITION.find((d) => d.id === 'ROLE_MIX')?.disposition === 'KEPT_ENFORCED', 'the role mix is unchanged and kept')
})

test('W2, every selected member validated, its invariant (the safeguard that would have caught the hole): on every run that committed constraints, of the experiment path and the controls, every committed constraint is a member of the package the builder built on the committed lenses (read from the builder, not from the check\'s own refusal); the same invariant over the production route\'s selections, measured and reported only (production unchanged)', () => {
    const committedRuns = [...runs.values()].filter((r) => r.kind !== 'LEGACY' && (r.run.chain?.constraints ?? []).length > 0 && r.result.chain?.stage !== 'selection')
    const unvalidated = committedRuns.map((r) => [r.id, absentFromPackage(String(r.run.chain?.form), r.answer!.observed!.lensIds, r.run.chain!.constraints)] as [string, string[]]).filter((x) => x[1].length > 0)
    assert.deepEqual(unvalidated, [], 'every committed constraint validated (each run with the members absent from its checked package)')
    assert.deepEqual(committedRuns.map((r) => r.id), COMMITTED_RUNS, 'the runs that committed constraints (measured)')
    // The production route's selections: the hole by construction, measured, reported only (production unchanged).
    const production = productionSelections()
    const absent = production.filter((p): p is { goal: string; formId: string; lensIds: string[]; constraintIds: string[] } => 'constraintIds' in p).map((p) => [p.goal, absentFromPackage(p.formId, p.lensIds, p.constraintIds).map((id) => id.replace('tl-v0-constraint-', '')).join(', ')] as [string, string]).filter((p) => p[1].length > 0)
    assert.deepEqual(absent, PRODUCTION_ABSENT, 'the production route commits these constraints without ever validating them (reported, not changed)')
    assert.deepEqual(production.filter((p) => 'refused' in p).map((p) => p.goal), ['A02', 'D03'])
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Stage W1 (b): the review pathway's K2 result consumed in place of a per-goal authorization record
// ---------------------------------------------------------------------------------------------------------------------------------------

/** K2's rule and its limit, verbatim (Christian, received 7 November 2026, first reply); held equal to the ruling the data holds. */
const K2_RULE = 'A compatible Game Form may be retained without additional manipulation when no such manipulation has an authorized basis.'
const K2_LIMIT = 'Retaining a Game Form does not establish that it is optimal or sufficient for the Learning Goal.'
/** What a run shares with its DRAFT-record twin once the authority label, K2's basis, the treatment and the rulings entering with it are set aside. */
const sansK2 = (r: HandoffResult) => {
    const x: any = copy(r)
    for (const key of ['caseId', 'label', 'testOnlyTreatments', 'rulings']) delete x[key]
    if (x.consumption) {
        delete x.consumption.constraintAuthority
        delete x.consumption.reviewManipulations
    }
    return json(x)
}
/** The upstream results the chain can take that the constraints row of the ownership table does not name (the safeguard of stage W1 (b)). */
export const unnamedUpstreamResults = (authorities: readonly string[], row = OWNERSHIP_TABLE.find((o) => o.row === 'CONSTRAINTS')!): string[] =>
    authorities.filter((a) => a !== 'VOCABULARY_POOL' && `${row.owner} ${row.input}`.indexOf(a) < 0)

test('K2 (stage W1 (b)): the five base runs stand on the review pathway\'s K2 result with no record of ours (the empty set, authority REVIEW_PATHWAY_K2, never AUTHORIZATION_RECORD), K2\'s rule and limit carried into the account and the report, GF2\'s GP-015 cell still CANDIDATE; each equals its DRAFT-record twin but for the authority label and the basis, and the twin reads K2_NOT_TAKEN; K2 is refused with a non-empty set, beside a record, with the quota bypass, and without it the chain stops as before; the ownership row names every upstream result the chain can take', () => {
    assert.deepEqual([words('HO-07NOV-K2')[1], words('HO-07NOV-K2')[2]], [K2_RULE, K2_LIMIT], 'the data holds K2 verbatim')
    const cited = 'HO-07NOV-K2, received 7 November 2026, first reply'
    for (const id of BASE_IDS) {
        const r = at(id)
        const twin = at(`${id}${DRAFT_ARM}`)
        assert.deepEqual([r.request?.records, r.request?.consume?.k2?.set, r.request?.consume?.sizeRuleBypass ?? false, r.request?.recordRoute ?? null], ['PRODUCTION', [], false, null], `${id}: K2's empty set, no record, no bypass`)
        assert.deepEqual([r.result.consumption?.constraintAuthority, r.result.consumption?.constraintCandidateIds, r.answer?.observed?.constraintAuthority, r.run.chain?.constraints], ['REVIEW_PATHWAY_K2', [], 'REVIEW_PATHWAY_K2', []], `${id}: the authority REVIEW_PATHWAY_K2, never relabelled`)
        // The limit travels with the result into the account (read back from the build's account by the wiring), and GF2's cell keeps its grade.
        assert.deepEqual(r.result.consumption?.reviewManipulations, { basis: 'K2_REVIEW_ONLY', set: [], rule: K2_RULE, limit: K2_LIMIT, cited }, id)
        assert.equal(r.result.consumption?.form?.cells.find((c) => c.cell.endsWith('game_forms GF2'))?.grade, 'CANDIDATE', `${id}: GF2's GP-015 cell stays CANDIDATE`)
        // The twin: our DRAFT record with its empty set, as before the stage.
        assert.deepEqual([twin.result.consumption?.constraintAuthority, twin.result.consumption?.constraintCandidateIds, twin.result.consumption?.reviewManipulations], ['AUTHORIZATION_RECORD', [], null], `${id}: the twin stands on the record`)
        // Outcome, stage, reasons, lines, sentences, refusal basis: identical; only the authority label and the basis differ.
        assert.deepEqual([r.result.chain?.outcome, r.result.chain?.stage, r.result.chain?.reasons], [twin.result.chain?.outcome, twin.result.chain?.stage, twin.result.chain?.reasons], id)
        assert.equal(sansK2(r.result), sansK2(twin.result), `${id}: equal to its DRAFT-record twin but for the authority label and K2's basis`)
        assert.deepEqual([verdictOf(id, 'CONSTRAINTS'), verdictOf(`${id}${DRAFT_ARM}`, 'CONSTRAINTS')], ['CONSUMED', 'K2_NOT_TAKEN'], id)
        const notTaken = at(`${id}${DRAFT_ARM}`).findings.find((f) => f.row === 'CONSTRAINTS')!
        assert.equal(classOf(notTaken), 'DETECTED', 'K2_NOT_TAKEN is a detected disconnection, never a pass')
        assert.throws(() => assertExperimentRun(at(`${id}${DRAFT_ARM}`).findings), /owned by the upstream result the chain takes, one of: .*: K2_NOT_TAKEN/, `${id}: the twin would fail test 1`)
    }
    // The report carries K2's rule and limit, each quoted with its date (the handoff's report of the A02 runs).
    const report = handoffReportText([at('A02-0').result], inputs, [])
    assert.ok(report.includes(`K2's limit, carried with the result: ${Q}${K2_LIMIT}${Q} (${cited})`), 'the report quotes the limit')
    assert.ok(report.includes(`${Q}${K2_RULE}${Q} (${cited})`), 'the report quotes the rule')
    // The draft store under K2: the DRAFT A02 record held to the gate, then set aside and listed as not read.
    const asideStore = loadDraftStore(STORE, { recordsSetAsideBy: K2_TREATMENT })
    assert.deepEqual([asideStore.records.length, asideStore.files], [0, ['rpc-002-contract.DRAFT.json']])
    assert.ok(asideStore.notRead.some((n) => n.file === 'a02-authorization.DRAFT.json' && n.why.includes(K2_TREATMENT)), 'the record is listed as not read, with the treatment')
    assert.equal(loadDraftStore(STORE).records.length, 1, 'read without the treatment, the store still holds the record (the DRAFT-record arm)')

    // The selection's own refusals (selectFor under upstream, the chain's entry): a non-empty set, beside a record, with the quota bypass.
    const consume = at('A02-0').request!.consume!
    const upstreamWith = (extra: Partial<boundedSelection.UpstreamDecisions>): boundedSelection.UpstreamDecisions => ({
        gameProblem: { gameProblemId: consume.gameProblem.gameProblemId, step1Basis: consume.gameProblem.basis as 'APPROVED_TRANSLATION', label: consume.gameProblem.label },
        gameForm: copy(consume.gameForm),
        reviewManipulations: { basis: 'K2_REVIEW_ONLY', set: [], rule: K2_RULE, limit: K2_LIMIT, cited },
        ...extra,
    })
    const production = learningGoalAuthorizations()
    const withRecord = [...production, ...loadDraftStore(STORE).records]
    const contracts = { contracts: asideStore.contracts, draftsAdmitted: true as const }
    const k2Selection = boundedSelection.selectFor('A02', null, production, undefined, contracts, upstreamWith({}))
    assert.deepEqual([k2Selection.constraintAuthority, k2Selection.constraintPool.source, k2Selection.constraintPool.candidateIds, k2Selection.authorization, k2Selection.consumed?.reviewManipulations?.limit], ['REVIEW_PATHWAY_K2', 'REVIEW_PATHWAY_K2', [], null, K2_LIMIT])
    assert.ok(k2Selection.constraintPool.constraintPrinciple !== null, 'read under the one recorded principle, so the zero branch commits the form alone')
    assert.throws(() => boundedSelection.selectFor('A02', null, production, undefined, contracts, upstreamWith({ reviewManipulations: { basis: 'K2_REVIEW_ONLY', set: [C('neutral-player-condition')], rule: K2_RULE, limit: K2_LIMIT, cited } })), /the review pathway's K2 result is consumed only as the empty set/)
    assert.throws(() => boundedSelection.selectFor('A02', null, withRecord, undefined, contracts, upstreamWith({})), /consumed only in place of a per-goal authorization record, and a record governs this goal \(A02, a DRAFT record\)/)
    assert.throws(() => boundedSelection.selectFor('A02', null, production, undefined, contracts, upstreamWith({ quotaBypass: true })), /quota bypass is honoured only for an authorization record's evaluated set, never beside the review pathway's K2 result/)
    assert.throws(() => boundedSelection.selectFor('A02', null, production, undefined, contracts, upstreamWith({ reviewManipulations: { basis: 'K2_REVIEW_ONLY', set: [], rule: K2_RULE, limit: ' ', cited } })), /K2 result with its basis \(K2_REVIEW_ONLY\), its set, its rule, its limit and their citation/)
    // Without K2 (and no record), the chain stops where it stopped before the stage.
    const { reviewManipulations: _k2, ...plain } = upstreamWith({})
    assert.throws(() => boundedSelection.selectFor('A02', null, production, undefined, contracts, plain), /no record governs this goal, so its pool would be vocabulary-derived/)
    // The selector's own guard: a K2 pool with a candidate throws, so K2 can never authorize a manipulation even if handed one directly.
    const text = guidedGoalText('A02')
    const k2Hints = { ...guidedSelectionHints('A02', text).hints, candidateArchetypeIds: ['GF2'], candidateConstraintIds: [C('neutral-player-condition')], constraintAuthority: { authority: 'REVIEW_PATHWAY_K2' as const, learningGoalId: 'A02', constraintPrinciple: { ruledOn: 'x', by: 'x', principle: 'x' } } }
    assert.throws(() => generateSelection({ learningGoals: [text], learningGoalId: 'A02' } as any, k2Hints, false), /K2 yields no manipulation, so its set is the empty set only/)
    assert.throws(() => generateSelection({ learningGoals: [text], learningGoalId: 'A02' } as any, { ...k2Hints, candidateConstraintIds: [] }, true), /TEST-ONLY quota bypass requested for a selection whose constraints are not an evaluated authorization record \(REVIEW_PATHWAY_K2\)/)
    // The handoff's validator and the wiring refuse the pairings.
    const refuses = (alter: (c: any) => void, pattern: RegExp) => {
        const c: any = caseOf('A02-0')
        alter(c)
        assert.throws(() => validateHandoffInputs(composed([...raw.cases.filter((x: any) => x.id !== 'A02-0'), c])), pattern)
    }
    refuses((c) => c.testOnlyTreatments.push({ id: 'TT-SIZE', kind: 'SIZE_RULE_BYPASS', what: 'w', effect: 'e', why: 'y', label: 'TEST-ONLY' }), /K2_RETAIN_FORM is never declared beside SIZE_RULE_BYPASS/)
    refuses((c) => (c.proposedManipulations = [{ id: 'PM-X', purpose: 'p', manipulation: C('neutral-player-condition'), relationship: { ...RELATIONSHIP }, entersBy: 'RECORD' }]), /K2_RETAIN_FORM is handed only where no proposed manipulation has a relationship/)
    refuses((c) => (c.testOnlyTreatments = c.testOnlyTreatments.filter((t: any) => t.kind !== 'CONSUMED_STEPS')), /K2_RETAIN_FORM is declared at most once, and only beside CONSUMED_STEPS/)
    refuses((c) => (c.testOnlyTreatments.find((t: any) => t.kind === 'K2_RETAIN_FORM').k2.limit = 99), /K2's rule and limit belong only to K2_RETAIN_FORM/)
    refuses((c) => (c.testOnlyTreatments.find((t: any) => t.kind === 'DRAFT_STORE').k2 = { rulingRef: 'HO-07NOV-K2', rule: 1, limit: 2 }), /K2's rule and limit belong only to K2_RETAIN_FORM/)
    const k2Request = copy(at('A02-0').request!)
    assert.throws(() => realChain.build({ ...k2Request, recordRoute: [C('neutral-player-condition')] }), /K2's result is handed in place of a per-goal authorization record, and this request also carries record-route manipulations/)

    // The safeguards on doctored copies of a K2 run: a built constraint under K2 is UNAUTHORIZED_SOURCE; K2 beside a record, or with a
    // manipulation proposed, CONTRADICTED; K2's limit not carried, MISSING.
    const doctor = (change: (x: SafeguardRun) => void): string => {
        const x = copy(at('A02-0').run)
        change(x)
        return ownershipOf(x).find((f) => f.row === 'CONSTRAINTS')!.verdict
    }
    assert.deepEqual(
        [
            doctor((x) => (x.chain!.constraints = [C('neutral-player-condition')])),
            doctor((x) => (x.given.recordKind = 'TEST_ONLY_RECORD')),
            doctor((x) => (x.given.proposed = [C('neutral-player-condition')])),
            doctor((x) => (x.chain!.consumption!.k2 = null)),
            doctor((x) => (x.chain!.consumption!.k2!.limit = '')),
        ],
        ['UNAUTHORIZED_SOURCE', 'CONTRADICTED', 'CONTRADICTED', 'MISSING', 'MISSING'],
    )
    // The ownership row names every upstream result the chain can take (every authority but the vocabulary pool), and the verdict for K2 not
    // taken; bite: an upstream result added to the list without a row naming it is caught.
    assert.deepEqual(unnamedUpstreamResults(CONSTRAINT_AUTHORITIES), [])
    assert.deepEqual(unnamedUpstreamResults([...CONSTRAINT_AUTHORITIES, 'A_NEW_UPSTREAM_RESULT']), ['A_NEW_UPSTREAM_RESULT'])
    const row = OWNERSHIP_TABLE.find((o) => o.row === 'CONSTRAINTS')!
    assert.ok(row.input.includes('K2_NOT_TAKEN') && (VERDICTS as readonly string[]).includes('K2_NOT_TAKEN'))
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// Stage W1 (c1): the Game Problem Coverage-row lenses, a declared TEST-ONLY treatment beside the consumption (both arms measured, Q-a2)
// ---------------------------------------------------------------------------------------------------------------------------------------

const WORDING_SUFFIXES: Array<[string, string]> = [
    ['the goal\'s wording', ''],
    ['reversed', '~reversed'],
    ['neutral', '~neutral'],
]
const shortLens = (id: string) => id.split('tl-v0-lens-').join('').split('-opportunity').join('')
/**
 * The two arms measured (for Christian's Q-a2, how the kept checks read lenses): per wording, each arm's lens candidate pool, its signal
 * groups, the lenses it committed (in order: the first is the primary lens the foundation threshold and row o read) and its stop; and per
 * S4 set, how many lens combinations the exported package check admits on each arm's committed lenses (2- and 3-combinations, as the
 * selector enumerates them) and on every combination of the Coverage row's lenses (the reading a permissive or a strict rule would test).
 */
export function c1Table(): { rows: string[]; packageRows: string[] } {
    const rows: string[] = []
    for (const [name, suffix] of WORDING_SUFFIXES)
        for (const [arm, id] of [
            ['wording arm (default)', `A02-0${suffix}`],
            ['Coverage-row arm (GP_COVERAGE_LENSES)', `A02-0${GPCL}${suffix}`],
        ]) {
            const r = at(id)
            const x = r.result.consumption
            rows.push(`${name} | ${arm} | ${id} | pool ${x?.lensCandidateIds.length}: ${(x?.lensCandidateIds ?? []).map(shortLens).join(', ')} | signal groups ${signalGroupsOf(x?.hintsSignals).join(', ')} | committed ${(r.answer?.observed?.lensIds ?? []).map(shortLens).join(', ')} | stop ${r.result.chain?.outcome} at ${r.result.chain?.stage}`)
        }
    const combos = (lenses: string[]) => [...subsets(lenses, 2), ...subsets(lenses, 3)]
    const admits = (lenses: string[], set: string[]) => combos(lenses).filter((lc) => isSelectionPackageCompatible({ archetype: archetypeOf('GF2'), affordanceLenses: lc.map(lensOf), constraints: set.map(constraintOf), requireShaping: false }).compatible).length
    const committed = (id: string) => [...(at(id).answer?.observed?.lensIds ?? [])]
    const cv015 = coverageOf('GP-015').lenses
    const packageRows = QUOTA_SETS.map(
        ([name, set]) =>
            `${name}: wording arm, goal's wording ${admits(committed('A02-0'), set)}/${combos(committed('A02-0')).length}; wording arm, reworded ${admits(committed('A02-0~reversed'), set)}/${combos(committed('A02-0~reversed')).length}; Coverage-row arm, goal's wording ${admits(committed(`A02-0${GPCL}`), set)}/${combos(committed(`A02-0${GPCL}`)).length}; Coverage-row arm, reworded ${admits(committed(`A02-0${GPCL}~reversed`), set)}/${combos(committed(`A02-0${GPCL}~reversed`)).length}; every combination of CV-015's ${cv015.length} lenses ${admits(cv015, set)}/${combos(cv015).length}`,
    )
    return { rows, packageRows }
}
/** The table, measured, then pinned (stage W1 (c1)). */
const C1_ROWS: string[] = [
    `the goal's wording | wording arm (default) | A02-0 | pool 3: possession-stability, regain, space-creation | signal groups signalGroup:B_pressure | committed possession-stability, space-creation, regain | stop refused at structure`,
    `the goal's wording | Coverage-row arm (GP_COVERAGE_LENSES) | A02-0+GPCL | pool 5: possession-stability, space-creation, space-exploitation, line-breaking, regain | signal groups signalGroup:F_possession_passing, signalGroup:A_touch_receiving, signalGroup:B_pressure | committed possession-stability, line-breaking, space-creation | stop refused at structure`,
    'reversed | wording arm (default) | A02-0~reversed | pool 5: possession-stability, space-creation, space-exploitation, line-breaking, regain | signal groups signalGroup:F_possession_passing, signalGroup:A_touch_receiving, signalGroup:B_pressure | committed line-breaking, possession-stability, space-creation | stop refused at structure',
    'reversed | Coverage-row arm (GP_COVERAGE_LENSES) | A02-0+GPCL~reversed | pool 5: possession-stability, space-creation, space-exploitation, line-breaking, regain | signal groups signalGroup:F_possession_passing, signalGroup:A_touch_receiving, signalGroup:B_pressure | committed line-breaking, possession-stability, space-creation | stop refused at structure',
    'neutral | wording arm (default) | A02-0~neutral | pool 5: possession-stability, space-creation, space-exploitation, line-breaking, regain | signal groups signalGroup:F_possession_passing, signalGroup:A_touch_receiving, signalGroup:B_pressure | committed line-breaking, possession-stability, space-creation | stop refused at structure',
    'neutral | Coverage-row arm (GP_COVERAGE_LENSES) | A02-0+GPCL~neutral | pool 5: possession-stability, space-creation, space-exploitation, line-breaking, regain | signal groups signalGroup:F_possession_passing, signalGroup:A_touch_receiving, signalGroup:B_pressure | committed line-breaking, possession-stability, space-creation | stop refused at structure',
]
const C1_PACKAGE_ROWS: string[] = [
    "NP: wording arm, goal's wording 4/4; wording arm, reworded 4/4; Coverage-row arm, goal's wording 4/4; Coverage-row arm, reworded 4/4; every combination of CV-015's 5 lenses 20/20",
    "WZA: wording arm, goal's wording 0/4; wording arm, reworded 0/4; Coverage-row arm, goal's wording 0/4; Coverage-row arm, reworded 0/4; every combination of CV-015's 5 lenses 0/20",
    "TR: wording arm, goal's wording 0/4; wording arm, reworded 0/4; Coverage-row arm, goal's wording 0/4; Coverage-row arm, reworded 0/4; every combination of CV-015's 5 lenses 0/20",
    "CDC: wording arm, goal's wording 0/4; wording arm, reworded 0/4; Coverage-row arm, goal's wording 0/4; Coverage-row arm, reworded 0/4; every combination of CV-015's 5 lenses 0/20",
    "NP+WZA: wording arm, goal's wording 4/4; wording arm, reworded 4/4; Coverage-row arm, goal's wording 4/4; Coverage-row arm, reworded 4/4; every combination of CV-015's 5 lenses 20/20",
    "NP+TR: wording arm, goal's wording 3/4; wording arm, reworded 0/4; Coverage-row arm, goal's wording 0/4; Coverage-row arm, reworded 0/4; every combination of CV-015's 5 lenses 10/20",
    "CDC+IR: wording arm, goal's wording 0/4; wording arm, reworded 0/4; Coverage-row arm, goal's wording 0/4; Coverage-row arm, reworded 0/4; every combination of CV-015's 5 lenses 0/20",
]

test('W1 (c1): under the declared TEST-ONLY treatment GP_COVERAGE_LENSES the lens candidates and signal groups are Step 1\'s Coverage row\'s (CV-015) for the goal\'s wording and both rewordings, so they no longer follow the wording; without it they do (the negative control); it is not the default; both arms measured and the table pinned (the choice between them is Christian\'s, Q-a2)', () => {
    const cv015 = coverageOf('GP-015')
    assert.equal(cv015.coverageId, 'CV-015')
    for (const id of GPCL_RUNS) {
        const x = at(id).result.consumption
        assert.ok(at(id).request?.consume?.coverageLenses === true, `${id}: the request carries the treatment`)
        assert.deepEqual([x?.hintsLensesFrom, x?.hintsGameProblemId, x?.lensCandidateIds, signalGroupsOf(x?.hintsSignals)], ['STEP1_COVERAGE_ROW', 'GP-015', cv015.lenses, cv015.groups], id)
        // The owned decisions and the stop are those of A02-0: the treatment moves the lenses only.
        assert.deepEqual([at(id).result.chain?.outcome, at(id).result.chain?.stage, at(id).result.chain?.reasons, at(id).run.chain?.form, at(id).result.consumption?.constraintAuthority], [at('A02-0').result.chain?.outcome, at('A02-0').result.chain?.stage, at('A02-0').result.chain?.reasons, 'GF2', 'REVIEW_PATHWAY_K2'], id)
    }
    // Wording-invariant under the treatment: one pool and one set of signal groups for all three wordings.
    assert.equal(new Set(GPCL_RUNS.map((id) => json([at(id).result.consumption?.lensCandidateIds, signalGroupsOf(at(id).result.consumption?.hintsSignals)]))).size, 1)
    // The negative control: without the treatment the pool follows the wording (the wording's own three where Step 1 and the wording agree,
    // CV-015's five under a rewording that infers no Game Problem).
    const pools = WORDING_SUFFIXES.map(([, suffix]) => json(at(`A02-0${suffix}`).result.consumption?.lensCandidateIds))
    assert.equal(new Set(pools).size, 2, 'without the treatment the lens pool moves with the wording')
    // Not the default: every other consuming run reads the governed hints.
    for (const id of EXPERIMENT_RUNS.filter((x) => GPCL_RUNS.indexOf(x) < 0 && at(x).result.consumption)) assert.equal(at(id).result.consumption?.hintsLensesFrom, 'GOVERNED_HINTS', id)
    // The validator refuses the treatment outside a consuming run, and twice.
    const c: any = coverageLensesCase()
    c.testOnlyTreatments = c.testOnlyTreatments.filter((t: any) => t.kind !== 'CONSUMED_STEPS' && t.kind !== 'K2_RETAIN_FORM')
    assert.throws(() => validateHandoffInputs(composed([...raw.cases, c])), /GP_COVERAGE_LENSES is declared at most once, and only beside CONSUMED_STEPS/)
    const twice: any = coverageLensesCase()
    twice.testOnlyTreatments.push({ ...COVERAGE_LENSES, id: 'TT-GP-COVERAGE-LENSES-AGAIN' })
    assert.throws(() => validateHandoffInputs(composed([...raw.cases, twice])), /GP_COVERAGE_LENSES is declared at most once/)
    // The table (measured, then pinned).
    const table = c1Table()
    assert.deepEqual(table.rows, C1_ROWS)
    assert.deepEqual(table.packageRows, C1_PACKAGE_ROWS)
    if (process.env.A02_W1_C1_TABLE) fs.writeFileSync(process.env.A02_W1_C1_TABLE, [...table.rows, '', ...table.packageRows].join('\n'))
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// The disposition table
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the disposition table: every selection check kept and enforced except, under the TEST-ONLY switch, the size rule with its floor and the bounded search over constraints (bypassed) and every selected member validated (a tightening), and foundation presence (bypassed only under FOUNDATION_PRESENCE_BYPASS); each with its source (held to the source text), origin and authority; per run, ran, bypassed or not run on this path: the empty-set runs print not run for the role mix, the package checks, the size rule, the bounded search and the tightening', () => {
    // Re-pinned openly in stage W2 (11 November 2026): was ['SIZE_RULE'] (BYPASSED_SIZE_RULE_ONLY); see the rows for why each moved.
    assert.deepEqual(DISPOSITION.filter((d) => d.disposition !== 'KEPT_ENFORCED').map((d) => [d.id, d.disposition]), [
        ['SIZE_RULE', 'BYPASSED_UNDER_SWITCH'],
        ['FOUNDATION_CLAUSE', 'BYPASSED_UNDER_TREATMENT'],
        ['MEMBER_PRESENCE', 'TIGHTENING_UNDER_SWITCH'],
        ['BOUNDED_SEARCH', 'BYPASSED_UNDER_SWITCH'],
    ])
    for (const d of DISPOSITION) assert.ok(d.control.length > 0 && d.origin.length > 0 && d.authority.length > 0, d.id)
    for (const id of ['ROLE_MIX', 'FOUNDATION_CLAUSE']) assert.ok(String(DISPOSITION.find((d) => d.id === id)?.reported).includes('reported with its source and authority'), id)
    // Each row's marks are its own: no reason is recognized by two rows.
    for (const d of DISPOSITION) for (const m of d.marks) assert.deepEqual(DISPOSITION.filter((e) => e.marks.some((x) => x.indexOf(m) >= 0 || m.indexOf(x) >= 0)).map((e) => e.id), [d.id], m)
    // Each source line holds what the row says it holds (read, not run). Re-pinned openly in stage W2 (each line moved by the hunks of the
    // stage above it, none changed but where named): generateSelection.ts 719 -> 722, 835 -> 840, 590 -> 591, 839 -> 844, 705 -> 708,
    // 811 -> 816, 1030 -> 1040, 933 -> 943, 636 -> 637, 868 -> 875, 1029 -> 1039, 836 -> 841; build-constraint-package.ts 614 -> 634;
    // validate-constraint-package.ts 326 -> 334, 491 -> 499, 365 -> 373; run-bounded-selection.ts 459 -> 472, 391 -> 402.
    const SYS = path.resolve(HERE, '..')
    const holds = (file: string, line: number, fragment: string) => assert.ok(fs.readFileSync(path.join(SYS, file), 'utf8').split(/\r?\n/)[line - 1].includes(fragment), `${file}:${line} holds ${fragment}`)
    holds('test-library/generateSelection.ts', 722, 'if (nc < 2 || nc > 4)')
    holds('test-library/generateSelection.ts', 719, 'if (nc !== quotaBypassOwnSize)')
    holds('test-library/generateSelection.ts', 840, 'for (const conSize of constraintSizes)')
    holds('test-library/generateSelection.ts', 1047, '? [quotaBypassOwnSize] : [2, 3, 4]')
    holds('test-library/generateSelection.ts', 591, 'function constraintComboPassesRoleMix')
    holds('test-library/generateSelection.ts', 844, 'constraintComboPassesRoleMix(conCombo, roleNeeds)')
    holds('test-library/generateSelection.ts', 832, 'const roleNeeds = roleNeedsFromPool ? conScored.filter((row) => poolIds.has(row.c.id)) : conScored')
    holds('test-library/generateSelection.ts', 708, 'if (nl < 2 || nl > 3)')
    holds('test-library/generateSelection.ts', 816, 'if (zeroConstraintCommitment)')
    holds('test-library/generateSelection.ts', 1040, 'const zeroConstraintCommitment = ')
    holds('test-library/generateSelection.ts', 943, 'if (tokens.length === 0)')
    holds('test-library/generateSelection.ts', 636, 'BOUNDED_SEARCH_TOP_LENSES = 3')
    holds('test-library/generateSelection.ts', 637, 'BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET = 2')
    holds('test-library/generateSelection.ts', 685, 'wholePool ? byBucket[bucket] : byBucket[bucket].slice(0, BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET)')
    holds('test-library/generateSelection.ts', 853, '...switchChecks.packageCheck,')
    holds('test-library/generateSelection.ts', 1227, 'type SwitchChecks = ')
    holds('test-library/generateSelection.ts', 1055, 'const lensCandidatePool = boundedLensCandidates(lensScored, allLenses)')
    holds('test-library/generateSelection.ts', 875, 'export function commitDesignChoice')
    holds('build-constraint-package.ts', 634, 'const foundation = pickBestConstraint')
    holds('build-constraint-package.ts', 635, 'if (!foundation && testOnly?.foundationPresenceBypass !== true) {')
    holds('build-constraint-package.ts', 148, 'score <= 10 &&')
    holds('build-constraint-package.ts', 657, 'const selectedConsequence = consequence && consequence.score > 12 ? consequence : undefined')
    holds('validate-constraint-package.ts', 334, 'A valid package requires a foundation constraint.')
    holds('validate-constraint-package.ts', 499, 'does not show a clear relationship to the selected affordance or open problem space')
    holds('validate-constraint-package.ts', 373, 'does not support the selected affordance tag group')
    holds('test-library/selection-compatibility.ts', 121, 'refuseAbsentMembers(input.constraints, [pkg.foundation, pkg.shaping, pkg.consequence])')
    holds('test-library/selection-compatibility.ts', 128, 'if (input.everyMemberValidated) refuseAbsentMembers(')
    holds('test-library/selection-compatibility.ts', 141, 'function refuseAbsentMembers(')
    // Re-pinned openly in stage W1 (a) (lines moved by the TEST-ONLY hunks added above them): 384 -> 398, 212 -> 218, 228 -> 238; and the
    // TEST-ONLY call with Step 1's Game Problem, 246. Stage W1 (b): 398 -> 452 (K2's hunks above it); K2's authority written at 386 only, and
    // the selector's zero branch admitting K2's empty set at 1029. Stage W1 (c1): 452 -> 459 and 386 -> 391 (the treatment's field above).
    // Stage W2: 459 -> 472, 391 -> 402, 1029 -> 1039 (the stage's hunks above them). Stage B1 of the A02 complete-activity package, re-pinned
    // openly: 472 -> 517, 402 -> 447 (the PROPOSED configuration's type, refusal and threading added above them; the lines themselves unchanged).
    holds('derivation/run-bounded-selection.ts', 517, `if (resolutionStatus !== 'matched')`)
    holds('derivation/run-bounded-selection.ts', 447, `constraintAuthority: { authority: 'REVIEW_PATHWAY_K2', learningGoalId: goalId`)
    holds('test-library/generateSelection.ts', 1039, 'const authorizesNone = (recordBacked || reviewPathwayK2EmptySet(constraintPool)) && constraintPool.candidateIds.length === 0')
    holds('sport-module/guided-selection.ts', 218, 'export function guidedSelectionHints')
    holds('sport-module/guided-selection.ts', 238, 'governByApprovedGameProblem(learningGoalId')
    holds('sport-module/guided-selection.ts', 246, 'governByApprovedGameProblem(learningGoalId, deriveInputConstraints(goalText), options.step1GameProblemId)')
    holds('sport-module/guided-selection.ts', 131, 'export function governByApprovedGameProblem(')
    // Per run.
    const ran = (id: string) => Object.fromEntries(dispositionOf(at(id).run).map((d) => [d.id, d.ran]))
    const zero = 'not run on this path (zero branch, generateSelection.ts:816-820)'
    for (const id of ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D']) {
        const r = ran(id)
        for (const check of ['ROLE_MIX', 'FOUNDATION_CLAUSE', 'MEMBER_PRESENCE', 'PACKAGE_ROW_O', 'PACKAGE_ROW_K', 'PACKAGE_OTHER', 'SIZE_RULE', 'BOUNDED_SEARCH']) assert.equal(r[check], zero, `${id} ${check}`)
        assert.deepEqual([r.ZERO_BRANCH, r.LENS_RULE, r.TOKEN_CHECK, r.LENS_SEARCH], ['ran', 'ran', 'ran', 'ran'], id)
    }
    // Re-pinned openly in stage W2: the switched runs' SIZE_RULE text was 'bypassed (TEST-ONLY): the set's own size tried, and the contract
    // admits 1 to its size (a one-manipulation subset of a set of 2 to 4 is not tried)', their FOUNDATION_CLAUSE 'ran'; the bounded search and
    // the tightening are new rows (E2, E4), foundation presence bypassed under its treatment (E3).
    const SWITCHED_SIZE = 'bypassed (TEST-ONLY, the switch): the set\'s own size only, the set taken whole, and the contract admits exactly that size (stage W2)'
    const SWITCHED_POOL = 'not applied (TEST-ONLY, the switch): the record\'s pool searched whole (stage W2)'
    const NO_PRESENCE = 'bypassed (TEST-ONLY, the treatment FOUNDATION_PRESENCE_BYPASS): presence not required; a structure member present is still checked, and one under its threshold is refused by MEMBER_PRESENCE (stage W2)'
    for (const id of ['S4-NP', 'S4-WZA', 'S4-NP+WZA', 'S4-NP+CDC']) assert.deepEqual([ran(id).SIZE_RULE, ran(id).BOUNDED_SEARCH, ran(id).ROLE_MIX, ran(id).FOUNDATION_CLAUSE, ran(id).MEMBER_PRESENCE], [SWITCHED_SIZE, SWITCHED_POOL, 'ran', NO_PRESENCE, 'ran'], id)
    // The reversal arm: under the switch, foundation presence runs.
    assert.deepEqual([ran(`S4-WZA${FOUNDATION_KEPT}`).FOUNDATION_CLAUSE, ran(`S4-WZA${FOUNDATION_KEPT}`).SIZE_RULE, ran(`S4-WZA${FOUNDATION_KEPT}`).MEMBER_PRESENCE], ['ran', SWITCHED_SIZE, 'ran'])
    assert.deepEqual([ran('S4-NP/no-bypass').SIZE_RULE, ran('S4-WZA').LENS_RULE], ['ran', 'not reached (no selection was committed)'])
    // The lone manipulation without the bypass: no combination is enumerated, so the role mix and the package checks never run; the tightening
    // is not on that path (the switch is off).
    const noBypass = ran('S4-NP/no-bypass')
    const unenumerated = 'not run on this path (no combination enumerated: the set holds 1; without the bypass the sizes enumerated are 2 to 4, generateSelection.ts:840-841)'
    assert.deepEqual(['ROLE_MIX', 'FOUNDATION_CLAUSE', 'PACKAGE_ROW_O', 'PACKAGE_ROW_K', 'PACKAGE_OTHER', 'SIZE_RULE', 'BOUNDED_SEARCH', 'MEMBER_PRESENCE'].map((check) => noBypass[check]), [unenumerated, unenumerated, unenumerated, unenumerated, unenumerated, 'ran', 'ran', 'not on this path (the switch is off)'])
    assert.deepEqual([ran('S4-NP+WZA/no-bypass').MEMBER_PRESENCE, ran('S4-NP+WZA/no-bypass').BOUNDED_SEARCH, ran('S4-NP+WZA/no-bypass').FOUNDATION_CLAUSE], ['not on this path (the switch is off)', 'ran', 'ran'])
    holds('test-library/generateSelection.ts', 841, 'if (constraintCandidatePool.length < conSize) continue')
    assert.equal(ran('GP-001').ROLE_MIX, 'not reached (the chain was not run)')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// S6: the earliest consequential blocker
// ---------------------------------------------------------------------------------------------------------------------------------------

// Stage B1, re-pinned openly: A02-0's stop names the question on the pressing line, found by its text (was the question marked next, the
// origin clause's, which our CANDIDATE restatement of Christian's ruling received 12 November 2026, item 1, now carries; the questions' order is
// left as it stood for stage B3).
const pressingLineQuestion = (raw.experiment.questions as Array<{ order: number; question: string; next: boolean }>).find((q) => q.question.includes('pressing line'))!
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
            why: 'the production route accepts manipulations only on a per-goal authorization record\'s authority (the live route hands it only a record-backed selection, live-activity.ts:55-56), and A02 has none; called on the production records, its candidates are A02\'s own candidate constraints, which no record authorizes (the engine labels their authority VOCABULARY_POOL; nothing is drawn from outside the goal\'s candidates), and they cannot be combined on any of RPC-002\'s declared forms (GF2, GF3, GF7 each refused NO_COMPATIBLE_COMBINATION, unfilled roles: shaping); the production route is unchanged. On the isolated pathway, since stage W1 (b), the chain takes the review pathway\'s K2 result in place of a per-goal record (no manipulation proposed for A02; K2 approved for review-only use; our reading of E5, reversible: the DRAFT-record arm is kept as comparison and reads K2_NOT_TAKEN), and without K2 or a record it still refuses (run-bounded-selection.ts:436-437); L2 passes this stop on our TEST-ONLY DRAFT record (nothing consumed), NO-RESTATEMENT and A02-0 on K2\'s result with no record of ours; the category is OURS (an assumption)',
        },
        {
            id: 'L2',
            path: 'the chain\'s own route with our TEST-ONLY draft store (our DRAFT record and our CANDIDATE restatement), nothing consumed',
            stage: String(at('L2').result.chain?.stage),
            reason: reason('L2'),
            kind: 'PATH',
            // Stage B1, re-pinned openly: 1617 -> 1671, 1684 -> 1738 (the same checks, moved by the review-level account's hunks above them).
            // Stage B2, re-pinned openly: 1671 -> 1710, 1738 -> 1777 (the same checks, moved by our CANDIDATE wording's option, type and account lines).
            within: 1710,
            categories: [4],
            why: 'the chain selects its own GF3 from the wording against Step 2\'s SELECTED form (GAME_FORM CONTRADICTED); the consumption (S1) closes it',
        },
        { id: 'NO-RESTATEMENT', path: 'consumed, on the review pathway\'s K2 result (no record of ours) and without the restatement', stage: String(at('NO-RESTATEMENT').result.chain?.stage), reason: reason('NO-RESTATEMENT'), kind: 'PATH', within: 1777, categories: [3, 5], why: 'the context\'s approved rows have no executable form in the engine: no contribution contract joins them to the configuration' },
        { id: 'A02-0', path: 'consumed, on the review pathway\'s K2 result, with our CANDIDATE restatement (the knowledge as it stands)', stage: String(at('A02-0').result.chain?.stage), reason: reason('A02-0', 1), kind: 'PATH', categories: [1, 5], why: `the progression clause's referent, the pressing line (RPC-002-03.b, open text, the one open text left): Gate A cannot evaluate it, and the refusal cites no item (an engine check); nothing in knowledge places the line (question ${pressingLineQuestion.order} of the smallest source material), and no register row carries it; the origin clause, which this stop cited before stage B1, is carried by our CANDIDATE restatement of Christian's rulings received 12 November 2026 (on V6, judged in play at the sequence's start; the origin and the control name no place); since stage B1 the PROPOSED configuration A02-HPE1 (TEST-ONLY, never knowledge) realizes the line as an escape line, and with it the run passes structure, realization and validation and stops at communication` },
        { id: 'A02-1', path: 'A02-1 (origin and progression withheld, TEST-ONLY)', stage: String(at('A02-1').result.chain?.stage), reason: reason('A02-1', 2), kind: 'DOWNSTREAM', categories: [1], why: 'no classification of the Laws for A02 is held, so LAW-8 and LAW-11 count as material (fail safe); stage B1, re-pinned openly (was at structure: the control referent is not stated; our CANDIDATE restatement now declares that it names no place)' },
        { id: 'A02-1b', path: 'A02-1b (+ the Laws held to our DRAFT classification, TEST-ONLY)', stage: String(at('A02-1b').result.chain?.stage), reason: reason('A02-1b', 1), kind: 'DOWNSTREAM', categories: [2, 1], why: 'the refusal rests on our DRAFT classification of the laws; no ruling settles the Laws for A02' },
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
    // Stage B1, re-pinned openly. BEFORE: the earliest stop's reason named the origin clause's line (c:restated:RPC-002:RPC-002-02.a::V6, with the
    // control referent's). AFTER: Gate A NOT_EVALUABLE on the pressing line's open text, citing no line or item. WHY: our CANDIDATE restatement of
    // Christian's rulings received 12 November 2026 carries the origin on V6 and declares that the origin and the control name no place.
    assert.equal(seq.earliest.reason, 'a pre-realization Gate A invariant cannot be evaluated, so it is not satisfied: GA-ONE-PRIMARY-EVENT, GA-REFERENCE-INTEGRITY')
    assert.ok(!seq.earliest.reason.includes('RPC-002-02.a') && pressingLineQuestion.question.includes('pressing line'), 'the origin clause is no longer among what it stops on')
    assert.deepEqual([at('A02-0').result.refusalBasis?.verdict, at('A02-0').result.refusalBasis?.cited], ['NOT KNOWLEDGE', []])
    // Stage B1, re-pinned openly: A02-1 'structure' -> 'validation' (the control referent NO_FURTHER_VALUE in our CANDIDATE restatement).
    assert.deepEqual(seq.downstream.map((s) => [s.id, s.stage]), [['A02-1', 'validation'], ['A02-1b', 'validation'], ['A02-2', 'communication']])
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
        // Stage W2, re-pinned openly: the second note read 'one and two manipulations ... with the TEST-ONLY size-rule bypass; ... a lone Wide Zone
        // Advantage or Turnover Reward is refused by the foundation clause, ...'; the third and fourth are new (the runs table, Q-a1).
        'QUOTA (S4): zero is the base cases (the empty set, through the zero branch): representable, not shown to be justified (generateSelection.ts:1028-1031 names this goal among the knowledge gaps a floor of 0 would turn into empty selections).',
        `QUOTA (S4, stage W2): one, two and three manipulations entered only through the DRAFT record's authorized set, under the TEST-ONLY switch (the set taken whole, its own size only; the bounded search's cap not applied to it; every selected member validated) and the declared TEST-ONLY treatment FOUNDATION_PRESENCE_BYPASS (our classification of foundation presence as a quota, reversible by its removal); a lone Neutral Player is selected with the switch and refused without it; a lone Wide Zone Advantage is refused as one-sided (the other package checks), a lone Turnover Reward by row k and row o, Central Density Condition (alone and with Interception Reward) by row o, Neutral Player with Central Density Condition (and with Wide Zone Advantage too) by MEMBER_PRESENCE, each attributed by re-running the exported package check with the run's options; Neutral Player with Wide Zone Advantage, with Turnover Reward, Wide Zone Advantage with Turnover Reward, and the three of them are selected whole.`,
        `QUOTA RUNS TABLE (stage W2; run, manipulations, stop, what decided at selection): ${W2_RUNS_TABLE.map(([id, n, stop, by]) => `${id}, ${n}, ${stop}, ${by}`).join('; ')}. Never the size rule, foundation presence, the role mix or the bounded search; on the reversal arm (foundation presence kept: ${FOUNDATION_KEPT_SETS.map((name) => `S4-${name}${FOUNDATION_KEPT}`).join(', ')}, controls) the foundation clause refuses each on every lens combination, a quota deciding (a violation verdict, controls only).`,
        `QUOTA, EVERY MEMBER VALIDATED, ON THE PRODUCTION ROUTE (reported only, not changed): the production package check holds one member per role and drops a consequence scoring 12 or less, so a selection of four, or of two members of one role, commits a member it never validated; measured on the production route's own selections: ${PRODUCTION_ABSENT.map(([goal, absent]) => `${goal} (${absent})`).join('; ')}.`,
        'QUOTA (S4): no manipulation is justified for A02 in anything we hold; every manipulation here rests on a TEST-ONLY relationship stand-in (TEST ASSUMPTION), never knowledge, and every line it brings is graded class 4 at best. Whether a record may ever be a menu to choose among, and on what learning-design basis, is Christian\'s question Q-a1; until it is answered the set is taken whole, and a strict subset built reads UNAUTHORIZED_SOURCE.',
        `WORDING (test 5): the lens list moves from ${LENSES_BEFORE} to ${LENSES_AFTER} under both rewordings; the owned decisions do not move; the selection of Neutral Player with Turnover Reward flips (OD-WORDING-FLIP).`,
        // Stage W1 (c1): the two arms measured, for Christian's Q-a2 (which lenses the kept checks read); the ranking changes are not made.
        'LENS ARMS (stage W1 (c1), the TEST-ONLY treatment GP_COVERAGE_LENSES beside the consumption, never its default): A02-0 under the goal\'s wording and the two rewordings, the wording arm (the default) against the Coverage-row arm (the lens candidates and signal groups of Step 1\'s Coverage row, CV-015, in both branches); per row: wording, arm, run, the lens candidate pool, the signal groups, the lenses committed (the first is the primary lens the foundation threshold and row o read), the stop:',
        ...c1Table().rows.map((row) => `   ${row}`),
        'LENS ARMS, per S4 set: the lens combinations the exported package check admits on each arm\'s committed lenses, and on every combination of CV-015\'s lenses (what a permissive or a strict reading of the Game Problem\'s lenses would test):',
        ...c1Table().packageRows.map((row) => `   ${row}`),
        'LENS ARMS, read: under the treatment the candidate pool and the signal groups are the same for every wording, and the committed lenses are the same three; their order still follows the wording (the ranking by wording tokens and the top-3 cap, not changed here), so the primary lens the kept checks read still moves with it. Which lenses the kept checks should read (the wording\'s top three, any combination of the Game Problem\'s, or every combination) is Christian\'s question Q-a2, open since 10 November 2026; the arms are measured for it and neither is adopted as the default.',
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
    has(`earliest remaining: consumed, on the review pathway's K2 result, with our CANDIDATE restatement (the knowledge as it stands): structure; Missing knowledge; and A configuration or rendering implementation limitation: ${stopsOf().find((s) => s.id === 'A02-0')!.why}`)
    assert.ok(!/pass(es|ed)? (all|every)|all safeguards pass/i.test(text), 'no passing summary')
    assert.equal(text.indexOf(String.fromCharCode(34)), -1, 'no double quotation mark')
    const hit = lines.findIndex((l) => holdsGenderedPronoun(l))
    assert.equal(hit, -1, `a gendered pronoun at line ${hit + 1}: ${lines[hit]}`)
    assert.equal(reportLines().join('\n'), text, 'generated twice, identical')
    // A second build of the five cases through the chain gives the same findings.
    for (const id of ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D']) {
        let answer: ChainAnswer | null = null
        const result = runHandoff(caseOf(id), inputs, { build: (r) => (answer = realChain.build(r)) }, k)
        const again = ownershipOf(safeguardRunOf(result, answer, true, { ...K2_FACTS, scoring: SCORING }))
        assert.equal(json(again), json(at(id).findings), id)
    }
    if (process.env.A02_SAFEGUARDS_OUT) fs.writeFileSync(process.env.A02_SAFEGUARDS_OUT, text)
})

test('registered; the stage file joins no chain import, and the wiring is a unit file', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-safeguards.unit.ts'))
    const source = fs.readFileSync(path.join(HERE, 'safeguards.ts'), 'utf8')
    // Lines split on either line end (stage W0, 11 November 2026): a checkout under core.autocrlf=true writes this file with CRLF, and a split
    // on '\n' alone left a carriage return on the import line, so the check failed on the line end, not on an import.
    const imports = source.split(/\r?\n/).filter((l) => l.startsWith('import '))
    assert.deepEqual(imports, [`import { ChainAnswer, HandoffResult } from './handoff'`])
    assert.deepEqual([...DECISION_ROWS], OWNERSHIP_TABLE.map((o) => o.row))
})

if (process.env.A02_SAFEGUARDS_MEASURE) writeMeasurement(process.env.A02_SAFEGUARDS_MEASURE)
fs.rmSync(TMP, { recursive: true, force: true })
if (MAIN) quiet(`a02 safeguards (S3, S4, S6): ${passed} passed`)

