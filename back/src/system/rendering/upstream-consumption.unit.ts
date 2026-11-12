/**
 * **The TEST-ONLY `upstream` option: consumption of Step 1's Game Problem and Step 2's Game Form by the checked pathway** — the isolated A02
 * experiment, slice S1. Christian's A02 authorization, pasted 10 November 2026:
 *   "The downstream pathway should consume Step 1's resolved Game Problem and Step 2's Game Form evaluation rather than independently selecting them from Learning Goal wording."
 *   "This authorization is for the isolated development pathway. It does not authorize production changes or broader Stage 2 implementation."
 *
 * The option lives in three bundled files, each hunk TEST-ONLY: `buildActivityUnderAuthorizationRecords` (`upstream`, threaded to `build`
 * and from there to `selectFor`; an `alterSelection` given with it may only observe), `selectFor` (the context-gated forms filtered to Step
 * 2's form, the constraints from the record route only, `consumedGameProblem` and `consumed` on the selection and on its gap) and
 * `generateSelection` (the boolean `quotaBypass` at the two places of the size rule, honoured only for an evaluated, record-backed set).
 * Since stage W2 of the A02 package (11 November 2026) the switch also takes the set whole, uncapped, with every selected member validated, and
 * the treatment FOUNDATION_PRESENCE_BYPASS reaches the package check, the package builder and its validator (three more bundled files, each
 * named in test 7d with its counted identifiers; only the package check passes the builder and validator their fourth argument, 7a).
 *
 * What is pinned, every build through the real chain:
 *   1. option absent: every Learning Goal builds exactly as the production entry builds it, and no selection, gap or account carries a
 *      TEST-ONLY field (the slice's before and after were also measured identical for all thirteen goals: B1 notes);
 *   2. A01 byte-identical with the option, with and without the quota bypass, at three sessions, once the two TEST-ONLY account fields are
 *      set aside (Step 2 named no form for A01: GF2 is named here only to show the option leaves A01 unchanged, never as a preference);
 *   3. consumption on A02, over a TEST-ONLY DRAFT record of this file with an empty set: the form is Step 2's, read from the selection
 *      trace's ranking; Step 1's Game Problem is carried beside the planning model's reading and never in its place; the legacy route over
 *      the same record is the chain's own GF3 (the bite); a swapped Game Problem keeps the case's own label;
 *   4. an `alterSelection` given with the option may only observe;
 *   5. fail closed: a form the routed context does not declare is refused in its own words, before the selector runs (the bite: Step 2's
 *      own form is not); no record (a vocabulary pool) and a malformed upstream are refused;
 *   6. the quota bypass: honoured only for an evaluated, record-backed set and thrown otherwise; at its two places a lone record-authorized
 *      manipulation is enumerated and admitted, and refused without it (a mechanism test of the size rule only: the manipulation is a
 *      TEST-ONLY fixture with no relationship to A02, and the attribution triples are a later slice's);
 *   7. statically: production cannot reach the option (identifiers, positional arguments, references, callers, imports).
 *
 * Nothing here is an A02 configuration, an authorization or a finding about A02: the records are TEST-ONLY fixtures written to a temporary
 * folder and loaded through the draft store's own gate.
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/rendering/upstream-consumption.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'

import { DraftStoreContents, GoalSelectionGap, selectFor, UpstreamDecisions } from '../derivation/run-bounded-selection'
import { loadDraftStore } from '../derivation/draft-store'
import { runStage1 } from '../design-reasoning/stage1'
import { guidedGoalText, guidedSelectionHints } from '../sport-module/guided-selection'
import { generateSelection } from '../test-library'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivity, buildActivityUnderAuthorizationRecords, RefusedActivity } from './build-activity'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
let searches = 0
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) {
        searches++
        return
    }
    quiet(...args)
}
let passed = 0
function test(name: string, run: () => void): void {
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
quiet('the TEST-ONLY upstream option: consumption of Step 1 and Step 2 (A02 experiment, S1)')

const json = (value: unknown) => JSON.stringify(value)
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const records = learningGoalAuthorizations()
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const KEEPER = specializedRoleNames()[0]
const GOALS = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'D01', 'D02', 'D03', 'TA01', 'TA02', 'TD01', 'TD02']
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 18, roles: { ...none } }
const a02 = { kind: 'learning-goal' as const, goalId: 'A02', session }
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects: { goal: { count: 0 } } } })
const NEUTRAL_PLAYER = 'tl-v0-constraint-neutral-player-condition'
const RPC_002_NOT_CONTRACTED = 'the Representative Performance Context RPC-002 has no contribution contract, so its approved primary scoring event and qualifying condition cannot govern the game'
const TEST_ONLY_FIELDS = ['consumedGameProblem', 'consumed']
/**
 * Stage W1 (a), 11 November 2026: what the consumption record says of the hints (measured): the Game Problem that governed them (Step 1's),
 * whether its Coverage row replaced the wording's candidates, and the lens candidates and matched signals the selector was handed.
 */
const A01_HINTS = {
    hintsGameProblemId: 'GP-005',
    hintsGoverned: true,
    lensCandidateIds: ['tl-v0-lens-space-exploitation-opportunity', 'tl-v0-lens-space-creation-opportunity', 'tl-v0-lens-line-breaking-opportunity', 'tl-v0-lens-possession-stability-opportunity'],
    hintsSignals: ['signalGroup:G_overload', 'unresolvedLensTitle:Support Angle Opportunity', 'unresolvedConstraintTitle:Pressure Condition'],
    reviewManipulations: null,
    hintsLensesFrom: 'GOVERNED_HINTS',
}
/** Test 7d, measured (stage W1 (a)): the option's identifiers named per file, and the guided selection hints' lines that name them. */
// Stage W1 (b), re-pinned openly: was { ..., quotaBypass: 7, upstream: 25, ... } (stage W1 (a)); K2's field, type and refusal function join it.
// Stage W1 (c1), re-pinned openly: upstream 30 -> 34; coverageLenses 6 and hintsLensesFrom 2 join it (the treatment GP_COVERAGE_LENSES).
// Stage W2, re-pinned openly: upstream 34 -> 40, quotaBypass 10 -> 11; foundationPresenceBypass 8 joins it (the treatment FOUNDATION_PRESENCE_BYPASS:
// its field, its shape check beside the switch, its record and its hand-on to the selector).
const RUN_BOUNDED_SELECTION_NAMES: Record<string, number> = { consumed: 7, consumedGameProblem: 10, coverageLenses: 6, foundationPresenceBypass: 8, hintsGameProblem: 3, hintsGameProblemId: 2, hintsGoverned: 2, hintsLensesFrom: 2, hintsSignals: 2, lensCandidateIds: 2, quotaBypass: 11, reviewManipulationRefusals: 2, reviewManipulations: 7, ReviewManipulations: 5, step1GameProblemId: 1, upstream: 40, UpstreamDecisions: 4 }
// Stage W1 (c1), re-pinned openly: was { hintsGameProblem: 2, step1GameProblemId: 3 }; the treatment's option and helper join it.
const GUIDED_SELECTION_NAMES: Record<string, number> = { coverageLenses: 2, coverageRowLenses: 2, hintsGameProblem: 2, step1GameProblemId: 4 }
/**
 * Test 7, measured (stage W1 (b)): every string literal REVIEW_PATHWAY_K2 in a non-test source file, and the one place it is written. Stage W2,
 * re-pinned openly (the same literals, moved by the stage's hunks above them): run-bounded-selection.ts:391 -> :402, safeguards.ts:459 -> :471
 * and :698 -> :748, generateSelection.ts:1194 -> :1206. Stage W4 (11 November 2026), re-pinned openly the same way: safeguards.ts:471 -> :476
 * and :748 -> :759 (the same two literals, moved by the CARRIED_UNDER_ILLUSTRATION hunks above them).
 */
const K2_WRITTEN: string[] = ['system/derivation/run-bounded-selection.ts:402 WRITTEN in selectFor under upstream']
const K2_LITERALS: string[] = [
    'system/derivation/run-bounded-selection.ts:402 WRITTEN in selectFor under upstream',
    'system/design-reasoning/safeguards.ts:476 READ',
    'system/design-reasoning/safeguards.ts:759 READ',
    'system/rendering/build-activity.ts:171 TYPE',
    'system/test-library/generateSelection.ts:1206 READ',
    'system/test-library/types.ts:134 TYPE',
    'system/test-library/types.ts:170 TYPE',
    'system/test-library/types.ts:179 TYPE',
]
/** Test 7d, measured (stage W2, 11 November 2026): the stage's identifiers in the package check, the package builder and its validator. */
const SELECTION_COMPATIBILITY_NAMES: Record<string, number> = { ABSENT_MEMBER_WORDS: 2, everyMemberValidated: 3, foundationPresenceBypass: 5, refuseAbsentMembers: 3 }
const BUILD_PACKAGE_NAMES: Record<string, number> = { FoundationOptionalPackage: 3, FoundationPresenceBypass: 3, foundationPresenceBypass: 2 }
const VALIDATE_PACKAGE_NAMES: Record<string, number> = { FoundationOptionalPackage: 3, FoundationPresenceBypass: 3, foundationPresenceBypass: 1 }
const GUIDED_SELECTION_LINES: string[] = [
    'hintsGameProblem?: GameProblemAuthority',
    // Stage W1 (c1): the option gains the treatment's flag; the Coverage-row lenses and their helper.
    'options: { draftsAdmitted?: boolean; step1GameProblemId?: string; coverageLenses?: boolean } = {},',
    'const step1 = options.step1GameProblemId === undefined ? null : governByApprovedGameProblem(learningGoalId, deriveInputConstraints(goalText), options.step1GameProblemId)',
    'const lensed = step1 && options.coverageLenses ? { ...hintsFrom.hints, ...coverageRowLenses(options.step1GameProblemId as string, goalText) } : hintsFrom.hints',
    '...(step1 ? { hintsGameProblem: step1.gameProblem } : {}),',
    "function coverageRowLenses(gameProblemId: string, goalText: string): Pick<InputConstraintHints, 'candidateAffordanceLensIds' | 'matchedSignals'> {",
]
const A02_HINTS = {
    hintsGameProblemId: 'GP-015',
    hintsGoverned: false,
    lensCandidateIds: ['tl-v0-lens-possession-stability-opportunity', 'tl-v0-lens-regain-opportunity', 'tl-v0-lens-space-creation-opportunity'],
    hintsSignals: ['signalGroup:B_pressure', 'unresolvedLensTitle:Support Angle Opportunity', 'unresolvedConstraintTitle:Pressure Condition'],
    reviewManipulations: null,
    hintsLensesFrom: 'GOVERNED_HINTS',
}

/** A TEST-ONLY DRAFT A02 record in a temporary folder, loaded through the draft store's gate: no ruling field (the gate requires that of a record we drafted). */
function storeWith(authorizedConstraints: string[] | null): DraftStoreContents {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 's1-upstream-'))
    const record = {
        learningGoalId: 'A02',
        contextId: 'RPC-002',
        gameProblemId: 'GP-015',
        ruledOn: '',
        by: '',
        ruling: [],
        authorizedConstraints,
        authorizedConstraintsFinding:
            'TEST-ONLY fixture of upstream-consumption.unit.ts (OURS): not a finding about A02, not an authorization of any set and not evidence that GF2 alone is sufficient; it exists only to exercise the record route under the upstream option',
        excluded: [],
        manipulations: [],
    }
    fs.writeFileSync(path.join(dir, 'a02-test-only.DRAFT.json'), JSON.stringify({ standing: 'DRAFT - TEST-ONLY fixture of upstream-consumption.unit.ts, never knowledge', record }, null, 2) + '\n')
    return loadDraftStore(dir)
}
const emptyStore = storeWith([])
const loneStore = storeWith([NEUTRAL_PLAYER])
const notEvaluatedStore = storeWith(null)

/** Step 1 and Step 2 as the review pathway resolves them, made into the option's plain data. */
const step = runStage1('A02')
const cellsOf = (result: ReturnType<typeof runStage1>) => result.gameForm.trace.influencedBy.map((entry: any) => ({ cell: String(entry.ref ?? entry.id ?? entry.what), grade: String(entry.standing) }))
const upstreamOf = (formId: string, extra: Partial<UpstreamDecisions> = {}): UpstreamDecisions => ({
    gameProblem: { gameProblemId: step.resolution.gameProblems.primary[0], step1Basis: step.resolution.gameProblems.basis as 'APPROVED_TRANSLATION', label: 'as resolved by Step 1 (review pathway)' },
    gameForm: { formId, standing: step.gameForm.statement, cells: cellsOf(step) },
    ...extra,
})
const a01Step = runStage1('A01')
const a01Upstream = (quotaBypass: boolean): UpstreamDecisions => ({
    gameProblem: { gameProblemId: a01Step.resolution.gameProblems.primary[0], step1Basis: a01Step.resolution.gameProblems.basis as 'APPROVED_TRANSLATION', label: 'as resolved by Step 1 (review pathway)' },
    gameForm: { formId: 'GF2', standing: `TEST-ONLY: Step 2 named no form (${a01Step.gameForm.statement}); GF2 is named only to show the option leaves A01 unchanged, never as a preference`, cells: cellsOf(a01Step) },
    quotaBypass,
})
type Options = NonNullable<Parameters<typeof buildActivityUnderAuthorizationRecords>[2]>
const a02Build = (drafts: DraftStoreContents | null, options: Options = {}) =>
    buildActivityUnderAuthorizationRecords(a02, records, { review: { includeDrafts: true }, ...(drafts ? { drafts } : {}), ...options })
const withoutTestOnlyFields = (activity: unknown) => {
    const stripped: any = copy(activity)
    for (const field of TEST_ONLY_FIELDS) delete stripped.account?.[field]
    return stripped
}

/* ── 1. Option absent ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
test('option absent: every goal builds exactly as the production entry, and no selection, gap or account carries a TEST-ONLY field', () => {
    for (const goalId of GOALS) {
        const request = { kind: 'learning-goal' as const, goalId, session }
        const production = buildActivity(request)
        const under = buildActivityUnderAuthorizationRecords(request, records, {})
        assert.equal(json(under.activity), json(production), `${goalId}: the build with no option is the production entry's`)
        for (const field of TEST_ONLY_FIELDS) {
            assert.ok(!(field in (production.account ?? {})), `${goalId}: the production account has no ${field}`)
            if (under.selection) assert.ok(!(field in under.selection), `${goalId}: the selection has no ${field}`)
        }
        let viaDefault: unknown = null
        let viaUndefined: unknown = null
        try {
            viaDefault = selectFor(goalId)
        } catch (error) {
            viaDefault = { threw: (error as Error).message, keys: Object.keys(error as object) }
        }
        try {
            viaUndefined = selectFor(goalId, null, records, undefined, undefined, undefined)
        } catch (error) {
            viaUndefined = { threw: (error as Error).message, keys: Object.keys(error as object) }
        }
        assert.equal(json(viaUndefined), json(viaDefault), `${goalId}: selectFor with the parameter undefined is selectFor`)
    }
    // A production gap carries exactly what it carried before the option existed.
    let gap: unknown = null
    try {
        selectFor('A02')
    } catch (error) {
        gap = error
    }
    assert.ok(gap instanceof GoalSelectionGap)
    assert.deepEqual(Object.keys(gap as object), ['gap', 'goalName', 'gameProblem', 'contextId', 'authorization', 'name'])
    // Passing `upstream: undefined` is passing nothing.
    assert.equal(json(buildActivityUnderAuthorizationRecords(a02, records, { upstream: undefined }).activity), json(buildActivity(a02)))
})

/* ── 2. A01 byte-identical ────────────────────────────────────────────────────────────────────────────────────────────────────── */
test('A01: byte-identical with the option, with and without the quota bypass, at three sessions, the two TEST-ONLY account fields set aside', () => {
    assert.equal(a01Step.gameForm.status, 'COMPATIBLE_ALTERNATIVES', 'Step 2 names no form for A01 (measured)')
    assert.ok(a01Step.gameForm.compatible.includes('GF2'))
    for (const [players, keepers] of [
        [12, 1],
        [12, 2],
        [11, 1],
    ]) {
        const production = buildActivity(a01At(players, keepers))
        assert.equal(production.outcome, 'served', `A01 ${players}/${keepers} is served`)
        for (const quotaBypass of [false, true]) {
            const built = buildActivityUnderAuthorizationRecords(a01At(players, keepers), records, { upstream: a01Upstream(quotaBypass) })
            assert.equal(json(withoutTestOnlyFields(built.activity)), json(production), `A01 ${players}/${keepers}, quotaBypass ${quotaBypass}: identical`)
            const account: any = built.activity.account
            assert.deepEqual(account.consumedGameProblem, { gameProblemId: 'GP-005', step1Basis: 'APPROVED_TRANSLATION', label: 'as resolved by Step 1 (review pathway)', source: 'Step 1 (review pathway)' })
            // Stage W1 (a), re-pinned openly (the record gained four fields): Step 1's GP-005 governed the hints, as the planning model's
            // GP-005 does on the production route (governed there too), so the selection is unchanged.
            assert.deepEqual(
                { ...account.consumed, form: account.consumed.form.formId },
                { formCandidatesScored: ['GF2'], formCandidatesFrom: 'SELECTION_TRACE_RANKING', form: 'GF2', constraintAuthority: 'AUTHORIZATION_RECORD', constraintCandidateIds: [], quotaBypass, ...A01_HINTS },
            )
        }
    }
    const selected: any = selectFor('A01', null, records, undefined, undefined, a01Upstream(true))
    for (const field of TEST_ONLY_FIELDS) delete selected[field]
    assert.equal(json(selected), json(selectFor('A01')), `A01's selection, the two TEST-ONLY fields set aside, is the production selection`)
})

/* ── 3. Consumption on A02 ────────────────────────────────────────────────────────────────────────────────────────────────────── */
test(`consumption on A02 (TEST-ONLY empty DRAFT record): Step 2's form, read from the selection trace; Step 1's Game Problem beside the chain's own reading; the legacy route is the chain's own GF3`, () => {
    assert.equal(step.gameForm.status, 'SELECTED')
    assert.equal(step.gameForm.selected, 'GF2')
    const legacy = a02Build(emptyStore).activity as RefusedActivity
    assert.equal(legacy.outcome, 'refused')
    assert.equal(legacy.stage, 'knowledge')
    assert.deepEqual(legacy.reasons, ['the game form GF3 has no contribution contract'])
    assert.equal(legacy.account.gameForm?.id, 'GF3', `the legacy route's form is the chain's own keyword-scorer pick`)
    for (const field of TEST_ONLY_FIELDS) assert.ok(!(field in legacy.account))

    const upstream = upstreamOf('GF2')
    const before = searches
    const consumed = a02Build(emptyStore, { upstream })
    assert.equal(searches - before, 1, 'the selector ran once')
    const activity = consumed.activity as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'knowledge')
    assert.deepEqual(activity.reasons, [RPC_002_NOT_CONTRACTED])
    assert.deepEqual(activity.account.gameForm, { id: 'GF2', name: 'Directional Possession Games', contracted: true })
    assert.deepEqual(activity.account.consumed, {
        formCandidatesScored: ['GF2'],
        formCandidatesFrom: 'SELECTION_TRACE_RANKING',
        form: upstream.gameForm,
        constraintAuthority: 'AUTHORIZATION_RECORD',
        constraintCandidateIds: [],
        quotaBypass: false,
        ...A02_HINTS,
    })
    // The cell GF2's selection rests on keeps its grade: CANDIDATE, never upgraded.
    assert.deepEqual(
        activity.account.consumed!.form.cells.filter(c => c.cell.endsWith('game_forms GF2')),
        [{ cell: 'soccer-module.rc1-v3.json game_forms GF2', grade: 'CANDIDATE' }],
    )
    assert.deepEqual(activity.account.consumedGameProblem, { gameProblemId: 'GP-015', step1Basis: 'APPROVED_TRANSLATION', label: 'as resolved by Step 1 (review pathway)', source: 'Step 1 (review pathway)' })
    // The chain's own reading is the planning model's, unchanged, and decides the provisional label as before.
    assert.deepEqual(activity.account.gameProblem, legacy.account.gameProblem)
    assert.equal(activity.account.provisional, legacy.account.provisional)
    // The selection the build returns carries the same records.
    assert.deepEqual(consumed.selection?.consumed, activity.account.consumed)

    // A swapped Game Problem keeps the case's own label; the account's reading is never written from it.
    const swapped = a02Build(emptyStore, { upstream: { ...upstream, gameProblem: { gameProblemId: 'GP-003', step1Basis: 'APPROVED_TRANSLATION', label: 'TEST ASSUMPTION (a swap)' } } }).activity
    assert.equal(swapped.account.consumedGameProblem?.gameProblemId, 'GP-003')
    assert.equal(swapped.account.consumedGameProblem?.label, 'TEST ASSUMPTION (a swap)')
    assert.deepEqual(swapped.account.gameProblem, legacy.account.gameProblem, 'gameProblem stays the planning model reading')
})

/* ── 4. alterSelection with upstream ──────────────────────────────────────────────────────────────────────────────────────────── */
test('an alterSelection given with the option may only observe: one that observes leaves the build identical, one that changes the selection throws', () => {
    const upstream = upstreamOf('GF2')
    let seen: any = null
    const observed = a02Build(emptyStore, { upstream, alterSelection: selection => (seen = copy(selection)) })
    assert.equal(json(observed.activity), json(a02Build(emptyStore, { upstream }).activity))
    assert.deepEqual(
        seen.selected.filter((entry: { role: string }) => entry.role === 'game form'),
        [{ id: 'GF2', role: 'game form' }],
    )
    assert.throws(
        () => a02Build(emptyStore, { upstream, alterSelection: selection => void selection.selected.push({ id: NEUTRAL_PLAYER, role: 'constraint' }) }),
        /a TEST-ONLY alterSelection changed a selection that consumed upstream decisions: with upstream it may only observe/,
    )
    // Without the option the same alteration is what it always was (no throw).
    assert.doesNotThrow(() => a02Build(emptyStore, { alterSelection: selection => void selection.selected.push({ id: NEUTRAL_PLAYER, role: 'constraint' }) }))
})

/* ── 5. Fail closed ───────────────────────────────────────────────────────────────────────────────────────────────────────────── */
test(`fail closed: a form the routed context does not declare is refused in its own words before the selector runs (Step 2's own form is not); no record and a malformed upstream are refused`, () => {
    const refusalOf = (drafts: DraftStoreContents | null, upstream: UpstreamDecisions) => {
        const before = searches
        const activity = a02Build(drafts, { upstream }).activity as RefusedActivity
        return { outcome: activity.outcome, stage: activity.stage, reasons: activity.reasons, selectorRuns: searches - before, consumed: 'consumed' in (activity.account ?? {}) }
    }
    assert.deepEqual(refusalOf(emptyStore, upstreamOf('GF1')), {
        outcome: 'refused',
        stage: 'selection',
        reasons: [`selection: A02: Step 2's form GF1 is not among the routed context's declared forms GF2, GF3, GF7`],
        selectorRuns: 0,
        consumed: false,
    })
    // The bite: Step 2's own form, on the same record, passes the check and reaches the selector.
    const own = refusalOf(emptyStore, upstreamOf('GF2'))
    assert.equal(own.selectorRuns, 1)
    assert.notEqual(own.stage, 'selection')
    // No record: the pool would be vocabulary-derived.
    assert.deepEqual(refusalOf(null, upstreamOf('GF2')).reasons, [
        `selection: A02: with upstream decisions the constraints come only from the goal's authorization record (the record route), and no record governs this goal, so its pool would be vocabulary-derived`,
    ])
    // Malformed: each lack named, nothing read partly.
    assert.deepEqual(refusalOf(emptyStore, { ...upstreamOf('GF2'), gameForm: { formId: 'GF2', standing: 'x', cells: [] } }).reasons, [
        'selection: A02: the TEST-ONLY upstream decisions are refused, they lack the grade of every cell the form rests on',
    ])
    assert.deepEqual(refusalOf(emptyStore, { ...upstreamOf('GF2'), gameProblem: { gameProblemId: 'GP-015', step1Basis: 'APPROVED' as any, label: 'x' } }).reasons, [
        `selection: A02: the TEST-ONLY upstream decisions are refused, they lack Step 1's basis (APPROVED_TRANSLATION or SCOPED_RULING)`,
    ])
})

/* ── 6. The quota bypass ──────────────────────────────────────────────────────────────────────────────────────────────────────── */
test('the quota bypass: honoured only for an evaluated, record-backed set, thrown otherwise; at its two places a lone record-authorized manipulation is enumerated and admitted', () => {
    const direct = (goalId: string | null, given = records, draftsAdmitted = false) => {
        const text = goalId ? guidedGoalText(goalId) : 'keep the ball under pressure and play forward'
        const hints = goalId ? guidedSelectionHints(goalId, text, given, undefined, draftsAdmitted ? { draftsAdmitted: true } : {}).hints : null
        return generateSelection((goalId ? { learningGoals: [text], learningGoalId: goalId } : { learningGoals: [text] }) as any, hints, true)
    }
    const guard = (source: string) => (error: unknown) =>
        error instanceof Error && error.message === `TEST-ONLY quota bypass requested for a selection whose constraints are not an evaluated authorization record (${source}): it is honoured only there`
    assert.throws(() => direct('A05'), guard('GOAL_CANDIDATES'), 'a vocabulary pool')
    assert.throws(() => direct(null), guard('WHOLE_LIBRARY'), 'free text')
    assert.throws(() => direct('A02', [...records, ...notEvaluatedStore.records], true), guard('AUTHORIZATION_RECORD'), 'a record not yet evaluated')
    // An evaluated empty set takes the zero branch first: the bypass has nothing to do (A01's selection unchanged).
    const zero = direct('A01')
    assert.deepEqual([zero.archetype.game_form_id, zero.constraints.length], ['GF2', 0])
    const noBypass = generateSelection({ learningGoals: [guidedGoalText('A01')], learningGoalId: 'A01' } as any, guidedSelectionHints('A01', guidedGoalText('A01'), records).hints)
    assert.equal(json(zero), json(noBypass))
    // Without the option, a record not yet evaluated stays the NO_AUTHORIZED_CONSTRAINTS gap.
    const notEvaluated = a02Build(notEvaluatedStore, { upstream: upstreamOf('GF2') }).activity as RefusedActivity
    assert.equal(notEvaluated.account.constraintSource?.gap, 'NO_AUTHORIZED_CONSTRAINTS')

    // A lone record-authorized manipulation: refused without the bypass (no size-1 combination is tried), admitted with it at both places.
    const without = a02Build(loneStore, { upstream: upstreamOf('GF2') }).activity as RefusedActivity
    assert.equal(without.stage, 'selection')
    assert.match(without.reasons[0], /^selection: A02: a knowledge gap \(NO_COMPATIBLE_COMBINATION\) - the goal's designated knowledge cannot be combined into a selection on GF2;/)
    assert.deepEqual(
        { ...without.account.consumed!, form: without.account.consumed!.form.formId },
        { formCandidatesScored: ['GF2'], formCandidatesFrom: 'CANDIDATES_HANDED_TO_SELECTOR', form: 'GF2', constraintAuthority: 'AUTHORIZATION_RECORD', constraintCandidateIds: [NEUTRAL_PLAYER], quotaBypass: false, ...A02_HINTS },
    )
    assert.equal(without.account.consumedGameProblem?.gameProblemId, 'GP-015', 'the gap path carries the consumed Game Problem too')
    const bypassed = a02Build(loneStore, { upstream: upstreamOf('GF2', { quotaBypass: true }) }).activity as RefusedActivity
    assert.equal(bypassed.stage, 'knowledge', 'past selection: the size rule admitted 1 at both of its places')
    assert.deepEqual(bypassed.reasons, [RPC_002_NOT_CONTRACTED])
    assert.deepEqual(
        bypassed.account.constraints.map(constraint => constraint.id),
        [NEUTRAL_PLAYER],
    )
    assert.equal(bypassed.account.gameForm?.id, 'GF2')
    assert.equal(bypassed.account.consumed?.quotaBypass, true)
    assert.equal(bypassed.account.consumed?.formCandidatesFrom, 'SELECTION_TRACE_RANKING')
})

/* ── 7. Static: production cannot reach the option ────────────────────────────────────────────────────────────────────────────── */
test('statically: production cannot reach the option (identifiers, positional arguments, references, callers, imports)', () => {
    const SRC = path.resolve(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.unit.ts') && !entry.name.endsWith('.d.ts')) files.push(full)
        }
    }
    walk(SRC)
    assert.ok(files.length > 200, 'the scan reads the source tree')
    const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
    const REVIEW_PATHWAY = 'system/design-reasoning/'

    // The review pathway's modules are imported by no non-unit module outside it, so none of what they name can reach a route.
    const IMPORTS_REVIEW = /(from|require\s*\(|import\s*\()\s*['"][^'"]*design-reasoning\//
    assert.ok([`from '../design-reasoning/stage1'`, `require('../design-reasoning/handoff')`, `import ( '../design-reasoning/forms' )`].every(text => IMPORTS_REVIEW.test(text)), 'the scan sees each import form')
    assert.deepEqual(files.filter(file => !relative(file).startsWith(REVIEW_PATHWAY) && IMPORTS_REVIEW.test(fs.readFileSync(file, 'utf8'))).map(relative), [])

    // Stage W1 (a), 11 November 2026: the identifiers of Step 1's Game Problem governing the hints join the scan (the option field, the hints'
    // authority and the consumption record's four fields).
    // Stage W1 (b): the review pathway's K2 result handed in place of a record (the field, its type and its refusal function).
    // Stage W2 (11 November 2026): the switch's checks and the treatment FOUNDATION_PRESENCE_BYPASS (the selector's, the package check's, the
    // package builder's and validator's TEST-ONLY parameters, fields and helpers, and the review pathway's record of the treatment).
    const NAMES = new Set(['upstream', 'consumedGameProblem', 'consumed', 'quotaBypass', 'quotaBypassOwnSize', 'UpstreamDecisions', 'step1GameProblemId', 'hintsGameProblem', 'hintsGameProblemId', 'hintsGoverned', 'lensCandidateIds', 'hintsSignals', 'reviewManipulations', 'ReviewManipulations', 'reviewManipulationRefusals', 'reviewPathwayK2EmptySet', 'coverageLenses', 'coverageRowLenses', 'hintsLensesFrom', 'foundationPresenceBypass', 'foundationPresenceBypassed', 'FoundationPresenceBypass', 'FoundationOptionalPackage', 'switchChecks', 'SwitchChecks', 'switchChecksFor', 'wholePool', 'everyMemberValidated', 'refuseAbsentMembers', 'ABSENT_MEMBER_WORDS'])
    // Stage W2: a fourth argument to the package builder or validator is the treatment's (only the package check may pass it).
    const POSITION: Record<string, number> = { selectFor: 6, generateSelection: 3, build: 18, buildConstraintPackage: 4, validateConstraintPackage: 4 }
    const named = new Map<string, Map<string, number>>()
    const namedLines = new Map<string, Map<number, string>>()
    const linesOfNamed = (file: string) => [...(namedLines.get(file) ?? new Map<number, string>()).entries()].sort((a, b) => a[0] - b[0]).map(entry => entry[1])
    const calls: string[] = []
    const references: string[] = []
    const callersOfTheEntry: string[] = []
    // Forms the name-based checks above cannot follow: an import or export that renames selectFor or generateSelection
    // or names the TEST-ONLY entry, an element access with a string key naming one of the three (called, or read and called later), a
    // destructuring or object property keyed by such a string, and any reference to the entry outside its declaration. None may appear outside
    // build-activity.ts and run-bounded-selection.ts.
    const WATCHED = new Set(['selectFor', 'generateSelection', 'buildActivityUnderAuthorizationRecords'])
    const ENTRY = 'buildActivityUnderAuthorizationRecords'
    const evasions: string[] = []
    /**
     * Stage W1 (b): every string literal 'REVIEW_PATHWAY_K2' (the authority of the review pathway's K2 result), with how it is used: WRITTEN (a
     * property's value), READ (compared), TYPE (a literal type or the authority list), and for a written one whether it lies inside selectFor's
     * `if (upstream)` branch. The authority may be written only there.
     */
    const k2Literals: string[] = []
    const scan = (name: string, text: string) => {
        const source = ts.createSourceFile(name, text, ts.ScriptTarget.ES2020, true)
        const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line
        const lines = text.split(/\r?\n/)
        const visit = (node: ts.Node) => {
            if (ts.isStringLiteralLike(node) && node.text === 'REVIEW_PATHWAY_K2') {
                const parent = node.parent
                const use = ts.isPropertyAssignment(parent) && parent.initializer === node ? 'WRITTEN' : ts.isBinaryExpression(parent) ? 'READ' : ts.isLiteralTypeNode(parent) || ts.isArrayLiteralExpression(parent) ? 'TYPE' : 'OTHER'
                let inUpstreamBranch = false
                let inSelectFor = false
                for (let at: ts.Node | undefined = parent; at; at = at.parent) {
                    if (ts.isIfStatement(at) && at.expression.getText(source) === 'upstream') inUpstreamBranch = true
                    if (ts.isFunctionDeclaration(at) && at.name?.text === 'selectFor') inSelectFor = true
                }
                k2Literals.push(`${name}:${lineOf(node) + 1} ${use}${use === 'WRITTEN' ? (inSelectFor && inUpstreamBranch ? ' in selectFor under upstream' : ' ELSEWHERE') : ''}`)
            }
            if (ts.isIdentifier(node) && NAMES.has(node.text)) {
                const counts = named.get(name) ?? new Map<string, number>()
                counts.set(node.text, (counts.get(node.text) ?? 0) + 1)
                named.set(name, counts)
                const byLine = namedLines.get(name) ?? new Map<number, string>()
                byLine.set(lineOf(node), lines[lineOf(node)].trim())
                namedLines.set(name, byLine)
            }
            if (ts.isCallExpression(node)) {
                const callee = node.expression
                const callName = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : null
                const bare = ts.isIdentifier(callee)
                if (callName === 'buildActivityUnderAuthorizationRecords') callersOfTheEntry.push(`${name}:${lineOf(node) + 1}`)
                // `build` is not exported: only a bare call in build-activity.ts is it (`.build(` elsewhere is another object's method).
                const counted = callName === 'selectFor' || callName === 'generateSelection' || callName === 'buildConstraintPackage' || callName === 'validateConstraintPackage' || (callName === 'build' && bare && name === 'system/rendering/build-activity.ts')
                if (callName && counted) {
                    const spread = node.arguments.some(argument => ts.isSpreadElement(argument))
                    if (spread || node.arguments.length >= POSITION[callName]) calls.push(`${name} ${callName} ${spread ? 'spread' : node.arguments.length}`)
                }
            }
            if (ts.isIdentifier(node) && (node.text === 'selectFor' || node.text === 'generateSelection')) {
                const parent = node.parent
                const callee = ts.isCallExpression(parent) && parent.expression === node
                const method = ts.isPropertyAccessExpression(parent) && parent.name === node && ts.isCallExpression(parent.parent) && parent.parent.expression === parent
                const declaration = ts.isFunctionDeclaration(parent) && parent.name === node
                const specifier = ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)
                const typeQuery = ts.isTypeQueryNode(parent)
                if (!callee && !method && !declaration && !specifier && !typeQuery) references.push(`${name} ${node.text} :: ${lines[lineOf(node)].trim()}`)
            }
            if (ts.isImportSpecifier(node) || ts.isExportSpecifier(node)) {
                const imported = node.propertyName ? node.propertyName.text : node.name.text
                if (imported === ENTRY || node.name.text === ENTRY) evasions.push(`${name} specifier naming the entry`)
                else if (node.propertyName && WATCHED.has(imported) && node.name.text !== imported) evasions.push(`${name} specifier renaming ${imported} as ${node.name.text}`)
            }
            // Any element access with a string key naming one of the three, called or read and called later (RC3-N5).
            if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression) && WATCHED.has(node.argumentExpression.text)) {
                const called = ts.isCallExpression(node.parent) && node.parent.expression === node
                evasions.push(`${name} element-access ${called ? 'call' : 'read'} of ${node.argumentExpression.text}`)
            }
            // A destructuring or an object property keyed by a string (or a computed string) naming one of the three (RC3-N5).
            if (ts.isBindingElement(node) || ts.isPropertyAssignment(node)) {
                const key = ts.isBindingElement(node) ? node.propertyName : node.name
                const keyText = key && ts.isStringLiteralLike(key) ? key.text : key && ts.isComputedPropertyName(key) && ts.isStringLiteralLike(key.expression) ? key.expression.text : null
                if (keyText !== null && WATCHED.has(keyText)) evasions.push(`${name} string-keyed ${ts.isBindingElement(node) ? 'binding' : 'property'} of ${keyText}`)
            }
            if (ts.isIdentifier(node) && node.text === ENTRY && !(ts.isFunctionDeclaration(node.parent) && node.parent.name === node) && !ts.isImportSpecifier(node.parent) && !ts.isExportSpecifier(node.parent))
                evasions.push(`${name} reference to the entry`)
            ts.forEachChild(node, visit)
        }
        visit(source)
    }
    // The scan sees a positional pass, a spread and a pass by reference, which name no option.
    scan('probe.ts', `selectFor('A02', null, r, undefined, undefined, u)\ngenerateSelection(i, h, true)\nselectFor(...args)\nconst s = selectFor\nconst x = upstream\nbuildConstraintPackage(c, a, t, o)\nvalidateConstraintPackage(a, t, p, o)\nbuildConstraintPackage(c, a, t)`)
    assert.deepEqual(calls.splice(0), ['probe.ts selectFor 6', 'probe.ts generateSelection 3', 'probe.ts selectFor spread', 'probe.ts buildConstraintPackage 4', 'probe.ts validateConstraintPackage 4'])
    assert.deepEqual(references.splice(0), ['probe.ts selectFor :: const s = selectFor'])
    // ... and each form the name-based checks cannot follow.
    scan(
        'probe2.ts',
        [
            `import { generateSelection as pick } from '../test-library/generateSelection'`,
            `export { selectFor as choose } from '../derivation/run-bounded-selection'`,
            `import { ${ENTRY} } from '../rendering/build-activity'`,
            `rbs['selectFor'](a, b, c, d, e, f)`,
            `const run = ${ENTRY}`,
            `const later = ba['${ENTRY}']`,
            `later(r, o)`,
            `const { '${ENTRY}': taken } = ba`,
            `const { ['selectFor']: chosen } = rbs`,
            `const table = { 'generateSelection': g }`,
        ].join('\n'),
    )
    assert.deepEqual(evasions.splice(0), [
        'probe2.ts specifier renaming generateSelection as pick',
        'probe2.ts specifier renaming selectFor as choose',
        'probe2.ts specifier naming the entry',
        'probe2.ts element-access call of selectFor',
        'probe2.ts reference to the entry',
        `probe2.ts element-access read of ${ENTRY}`,
        `probe2.ts string-keyed binding of ${ENTRY}`,
        'probe2.ts string-keyed binding of selectFor',
        'probe2.ts string-keyed property of generateSelection',
    ])
    assert.deepEqual([calls.splice(0), references.splice(0)], [[], []], 'the name-based checks do not see those forms (which is why these exist)')
    // Stage W1 (b): the literal scan sees a write inside selectFor's upstream branch, a write elsewhere, and a read.
    scan('probe3.ts', [`function selectFor() { if (upstream) { hints = { authority: 'REVIEW_PATHWAY_K2' } } }`, `const elsewhere = { authority: 'REVIEW_PATHWAY_K2' }`, `if (pool.source === 'REVIEW_PATHWAY_K2') {}`].join('\n'))
    assert.deepEqual(k2Literals.splice(0), ['probe3.ts:1 WRITTEN in selectFor under upstream', 'probe3.ts:2 WRITTEN ELSEWHERE', 'probe3.ts:3 READ'])
    named.clear()
    namedLines.clear()

    for (const file of files) scan(relative(file), fs.readFileSync(file, 'utf8'))
    // 7e. None of those forms outside the two files that thread the option (the entry's declaration is in build-activity.ts).
    assert.deepEqual(evasions.filter((e) => !e.startsWith('system/rendering/build-activity.ts ') && !e.startsWith('system/derivation/run-bounded-selection.ts ')), [])

    // 7a. The only calls with an argument in the new position: the threading itself, one per file. Stage W2, re-pinned openly: selectFor hands
    // the selector a fourth argument (was 'generateSelection 3'), the treatment FOUNDATION_PRESENCE_BYPASS; and only the package check passes
    // the package builder and validator theirs, under that treatment.
    assert.deepEqual(calls.sort(), [
        'system/derivation/run-bounded-selection.ts generateSelection 4',
        'system/rendering/build-activity.ts build 18',
        'system/rendering/build-activity.ts selectFor 6',
        'system/test-library/selection-compatibility.ts buildConstraintPackage 4',
        'system/test-library/selection-compatibility.ts validateConstraintPackage 4',
    ])
    // 7b. selectFor is passed by reference only as a coverage selector's default, whose type takes two parameters.
    assert.deepEqual(
        [...new Set(references.map(reference => reference.split(' :: ')[0]))],
        ['system/derivation/run-contract-coverage.ts selectFor'],
    )
    assert.match(fs.readFileSync(path.join(SRC, 'system', 'derivation', 'run-contract-coverage.ts'), 'utf8'), /export type CoverageSelector = \(goalId: string, situationId: string \| null\) => BoundedSelection/)
    // 7c. No non-unit module calls the TEST-ONLY entry.
    assert.deepEqual(callersOfTheEntry, [])
    // 7d. Outside the review pathway (whose modules no production module imports, above), only the bundled files name the option's identifiers;
    // the selector names only its boolean. Stage W1 (a), 11 November 2026, re-pinned openly: the guided selection hints joins them (the
    // TEST-ONLY `step1GameProblemId` option and the `hintsGameProblem` it returns), and the review pathway's handoff, report and safeguards
    // read the consumption record's new fields (they were not named before because the scan's names did not include those fields).
    // Stage W2, re-pinned openly: the package builder, its validator and the package check join them (their TEST-ONLY parameters and helpers).
    assert.deepEqual([...named.keys()].filter((file) => !file.startsWith(REVIEW_PATHWAY)).sort(), ['system/build-constraint-package.ts', 'system/derivation/run-bounded-selection.ts', 'system/rendering/build-activity.ts', 'system/sport-module/guided-selection.ts', 'system/test-library/generateSelection.ts', 'system/test-library/selection-compatibility.ts', 'system/validate-constraint-package.ts'])
    assert.deepEqual([...named.keys()].filter((file) => file.startsWith(REVIEW_PATHWAY)).sort(), ['system/design-reasoning/handoff-report.ts', 'system/design-reasoning/handoff.ts', 'system/design-reasoning/safeguards.ts'])
    // Counted per file (measured 10 November 2026, B1), so a new reference anywhere is a visible change; the selector names none but its boolean.
    const countsOf = (file: string) => Object.fromEntries([...(named.get(file) ?? new Map<string, number>()).entries()].sort((a, b) => a[0].localeCompare(b[0])))
    // Stage W1 (b), re-pinned openly: the selector also names its K2 guard (its call at :1029 and its declaration); was { quotaBypass: 3, quotaBypassOwnSize: 10 }.
    // Stage W2, re-pinned openly: was { quotaBypass: 3, quotaBypassOwnSize: 10, reviewPathwayK2EmptySet: 2 }; the switch's checks join it
    // (SwitchChecks, switchChecks, switchChecksFor, wholePool, everyMemberValidated, and the treatment's foundationPresenceBypass); quotaBypass
    // 3 -> 7 (handed to switchChecksFor and read there), quotaBypassOwnSize 10 -> 9 (the sizes line: the set's own size only).
    assert.deepEqual(countsOf('system/test-library/generateSelection.ts'), { SwitchChecks: 3, everyMemberValidated: 2, foundationPresenceBypass: 7, quotaBypass: 7, quotaBypassOwnSize: 9, reviewPathwayK2EmptySet: 2, switchChecks: 6, switchChecksFor: 2, wholePool: 6 })
    // Stage W2: the package check, the package builder and its validator name only the treatment's and the tightening's identifiers.
    assert.deepEqual(countsOf('system/test-library/selection-compatibility.ts'), SELECTION_COMPATIBILITY_NAMES)
    assert.deepEqual(countsOf('system/build-constraint-package.ts'), BUILD_PACKAGE_NAMES)
    assert.deepEqual(countsOf('system/validate-constraint-package.ts'), VALIDATE_PACKAGE_NAMES)
    // Stage W1 (b): the authority REVIEW_PATHWAY_K2 is written only in selectFor's upstream branch; elsewhere it is only read or typed.
    assert.deepEqual(k2Literals.filter((entry) => entry.indexOf(' WRITTEN') >= 0), K2_WRITTEN)
    assert.deepEqual(k2Literals, K2_LITERALS)
    assert.deepEqual(countsOf('system/rendering/build-activity.ts'), { consumed: 7, consumedGameProblem: 7, upstream: 6, UpstreamDecisions: 4 })
    // Stage W1 (a), re-pinned openly: run-bounded-selection.ts was { consumed: 7, consumedGameProblem: 10, quotaBypass: 7, upstream: 23, UpstreamDecisions: 4 }.
    assert.deepEqual(countsOf('system/derivation/run-bounded-selection.ts'), RUN_BOUNDED_SELECTION_NAMES)
    assert.deepEqual(countsOf('system/sport-module/guided-selection.ts'), GUIDED_SELECTION_NAMES)
    // The guided selection's lines: the returned authority's declaration, the option, its read, and the return.
    assert.deepEqual(linesOfNamed('system/sport-module/guided-selection.ts'), GUIDED_SELECTION_LINES)
    const linesOf = linesOfNamed
    // The build's lines: the type import, the two optional account fields and their copies, and the option's declaration, threading and guard.
    assert.deepEqual(linesOf('system/rendering/build-activity.ts'), [
        `import type { ConsumedGameProblem, ConsumedRecord, UpstreamDecisions } from '../derivation/run-bounded-selection'`,
        'consumedGameProblem?: ConsumedGameProblem',
        'consumed?: ConsumedRecord',
        '...(goal?.consumedGameProblem ? { consumedGameProblem: JSON.parse(JSON.stringify(goal.consumedGameProblem)) as ConsumedGameProblem } : {}),',
        '...(goal?.consumed ? { consumed: JSON.parse(JSON.stringify(goal.consumed)) as ConsumedRecord } : {}),',
        '...(gap.consumedGameProblem ? { consumedGameProblem: JSON.parse(JSON.stringify(gap.consumedGameProblem)) as ConsumedGameProblem } : {}),',
        '...(gap.consumed ? { consumed: JSON.parse(JSON.stringify(gap.consumed)) as ConsumedRecord } : {}),',
        'upstream?: UpstreamDecisions',
        'options.upstream ? (JSON.parse(JSON.stringify(options.upstream)) as UpstreamDecisions) : null,',
        'upstream: UpstreamDecisions | null = null,',
        'upstream ?? undefined,',
        'const observedOnly = upstream ? JSON.stringify(goalSelection) : null',
    ])
    // The selector's lines: the size rule's own-size bound, the parameter, the guard, the sizes, and the size rule's call. Stage W2, re-pinned
    // openly: the own-size bound admits exactly the set's size (was 'if (nc < 1 || nc > quotaBypassOwnSize) ... expected 1–n'); the sizes are
    // the set's own only (was '... && ![2, 3, 4].includes(quotaBypassOwnSize) ? [quotaBypassOwnSize, 2, 3, 4] : [2, 3, 4]'); the parameter line
    // gains a comma ('quotaBypass = false,'); and the switch's checks join (the pool's cap, the enumeration's field and its two reads, the
    // package check's options, the treatment's parameter, SwitchChecks and switchChecksFor).
    assert.deepEqual(linesOf('system/test-library/generateSelection.ts'), [
        'wholePool = false',
        'for (const r of wholePool ? byBucket[bucket] : byBucket[bucket].slice(0, BOUNDED_SEARCH_TOP_CONSTRAINTS_PER_BUCKET)) {',
        'quotaBypassOwnSize: number | null = null',
        'if (quotaBypassOwnSize !== null) {',
        'if (nc !== quotaBypassOwnSize) throw new Error(`Test Library selection contract violated: under the TEST-ONLY quota bypass the authorized set is committed whole, ${quotaBypassOwnSize} constraints, got ${nc}.`)',
        'switchChecks: SwitchChecks',
        'const { tokens, archetype, archeAffordances, informationIntent, lensCandidatePool, lensScoreById, allConstraints, roleNeedsFromPool, zeroConstraintCommitment, constraintSizes, switchChecks } = ctx',
        'const constraintCandidatePool = boundedConstraintCandidates(conScored, allConstraints, switchChecks.wholePool)',
        '...switchChecks.packageCheck,',
        'quotaBypass = false,',
        'foundationPresenceBypass = false',
        // Stage W1 (b): the zero branch admits K2's empty set (and the guard below throws on a K2 pool with any candidate).
        'const authorizesNone = (recordBacked || reviewPathwayK2EmptySet(constraintPool)) && constraintPool.candidateIds.length === 0',
        'if (quotaBypass && !(recordBacked && constraintPool.constraintPrinciple !== null)) {',
        'const quotaBypassOwnSize = quotaBypass ? constraintPool.candidateIds.length : null',
        'const constraintSizes = quotaBypassOwnSize !== null && quotaBypassOwnSize >= 1 ? [quotaBypassOwnSize] : [2, 3, 4]',
        'const switchChecks = switchChecksFor(quotaBypass, foundationPresenceBypass)',
        'switchChecks,',
        'assertSelectionContract(bestLensCombo, bestConCombo, zeroConstraintCommitment, quotaBypassOwnSize)',
        'function reviewPathwayK2EmptySet(pool: ConstraintPoolAccount): boolean {',
        'type SwitchChecks = { wholePool: boolean; packageCheck: { everyMemberValidated?: true; foundationPresenceBypass?: true } }',
        'function switchChecksFor(quotaBypass: boolean, foundationPresenceBypass: boolean): SwitchChecks {',
        "if (foundationPresenceBypass && !quotaBypass) throw new Error('TEST-ONLY: FOUNDATION_PRESENCE_BYPASS is honoured only under the quota bypass (the switch), with every selected member validated')",
        'if (!quotaBypass) return { wholePool: false, packageCheck: {} }',
        'return { wholePool: true, packageCheck: { everyMemberValidated: true, ...(foundationPresenceBypass ? { foundationPresenceBypass: true as const } : {}) } }',
    ])

    // Registered.
    const registry = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/rendering/upstream-consumption.unit.ts'))
})

console.log = quiet
quiet(`upstream-consumption: ${passed} passed`)
if (process.exitCode) quiet('upstream-consumption: FAILURES ABOVE')
