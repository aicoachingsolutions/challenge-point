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
            assert.deepEqual(
                { ...account.consumed, form: account.consumed.form.formId },
                { formCandidatesScored: ['GF2'], formCandidatesFrom: 'SELECTION_TRACE_RANKING', form: 'GF2', constraintAuthority: 'AUTHORIZATION_RECORD', constraintCandidateIds: [], quotaBypass },
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
        { formCandidatesScored: ['GF2'], formCandidatesFrom: 'CANDIDATES_HANDED_TO_SELECTOR', form: 'GF2', constraintAuthority: 'AUTHORIZATION_RECORD', constraintCandidateIds: [NEUTRAL_PLAYER], quotaBypass: false },
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

    const NAMES = new Set(['upstream', 'consumedGameProblem', 'consumed', 'quotaBypass', 'quotaBypassOwnSize', 'UpstreamDecisions'])
    const POSITION: Record<string, number> = { selectFor: 6, generateSelection: 3, build: 18 }
    const named = new Map<string, Map<string, number>>()
    const namedLines = new Map<string, Map<number, string>>()
    const calls: string[] = []
    const references: string[] = []
    const callersOfTheEntry: string[] = []
    // Forms the name-based checks above cannot follow: an import or export that renames selectFor or generateSelection
    // or names the TEST-ONLY entry, a call through element access with a string key naming one of the three, and any reference to the entry
    // outside its declaration. None may appear outside build-activity.ts and run-bounded-selection.ts.
    const WATCHED = new Set(['selectFor', 'generateSelection', 'buildActivityUnderAuthorizationRecords'])
    const ENTRY = 'buildActivityUnderAuthorizationRecords'
    const evasions: string[] = []
    const scan = (name: string, text: string) => {
        const source = ts.createSourceFile(name, text, ts.ScriptTarget.ES2020, true)
        const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line
        const lines = text.split('\n')
        const visit = (node: ts.Node) => {
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
                const counted = callName === 'selectFor' || callName === 'generateSelection' || (callName === 'build' && bare && name === 'system/rendering/build-activity.ts')
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
            if (ts.isCallExpression(node) && ts.isElementAccessExpression(node.expression) && ts.isStringLiteralLike(node.expression.argumentExpression) && WATCHED.has(node.expression.argumentExpression.text))
                evasions.push(`${name} element-access call of ${node.expression.argumentExpression.text}`)
            if (ts.isIdentifier(node) && node.text === ENTRY && !(ts.isFunctionDeclaration(node.parent) && node.parent.name === node) && !ts.isImportSpecifier(node.parent) && !ts.isExportSpecifier(node.parent))
                evasions.push(`${name} reference to the entry`)
            ts.forEachChild(node, visit)
        }
        visit(source)
    }
    // The scan sees a positional pass, a spread and a pass by reference, which name no option.
    scan('probe.ts', `selectFor('A02', null, r, undefined, undefined, u)\ngenerateSelection(i, h, true)\nselectFor(...args)\nconst s = selectFor\nconst x = upstream`)
    assert.deepEqual(calls.splice(0), ['probe.ts selectFor 6', 'probe.ts generateSelection 3', 'probe.ts selectFor spread'])
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
        ].join('\n'),
    )
    assert.deepEqual(evasions.splice(0), [
        'probe2.ts specifier renaming generateSelection as pick',
        'probe2.ts specifier renaming selectFor as choose',
        'probe2.ts specifier naming the entry',
        'probe2.ts element-access call of selectFor',
        'probe2.ts reference to the entry',
    ])
    assert.deepEqual([calls.splice(0), references.splice(0)], [[], []], 'the name-based checks do not see those forms (which is why these exist)')
    named.clear()
    namedLines.clear()

    for (const file of files) scan(relative(file), fs.readFileSync(file, 'utf8'))
    // 7e. None of those forms outside the two files that thread the option (the entry's declaration is in build-activity.ts).
    assert.deepEqual(evasions.filter((e) => !e.startsWith('system/rendering/build-activity.ts ') && !e.startsWith('system/derivation/run-bounded-selection.ts ')), [])

    // 7a. The only calls with an argument in the new position: the threading itself, one per file.
    assert.deepEqual(calls.sort(), ['system/derivation/run-bounded-selection.ts generateSelection 3', 'system/rendering/build-activity.ts build 18', 'system/rendering/build-activity.ts selectFor 6'])
    // 7b. selectFor is passed by reference only as a coverage selector's default, whose type takes two parameters.
    assert.deepEqual(
        [...new Set(references.map(reference => reference.split(' :: ')[0]))],
        ['system/derivation/run-contract-coverage.ts selectFor'],
    )
    assert.match(fs.readFileSync(path.join(SRC, 'system', 'derivation', 'run-contract-coverage.ts'), 'utf8'), /export type CoverageSelector = \(goalId: string, situationId: string \| null\) => BoundedSelection/)
    // 7c. No non-unit module calls the TEST-ONLY entry.
    assert.deepEqual(callersOfTheEntry, [])
    // 7d. Only the three bundled files name the option's identifiers; the selector names only its boolean.
    assert.deepEqual([...named.keys()].sort(), ['system/derivation/run-bounded-selection.ts', 'system/rendering/build-activity.ts', 'system/test-library/generateSelection.ts'])
    // Counted per file (measured 10 November 2026, B1), so a new reference anywhere is a visible change; the selector names none but its boolean.
    const countsOf = (file: string) => Object.fromEntries([...(named.get(file) ?? new Map<string, number>()).entries()].sort((a, b) => a[0].localeCompare(b[0])))
    assert.deepEqual(countsOf('system/test-library/generateSelection.ts'), { quotaBypass: 3, quotaBypassOwnSize: 10 })
    assert.deepEqual(countsOf('system/rendering/build-activity.ts'), { consumed: 7, consumedGameProblem: 7, upstream: 6, UpstreamDecisions: 4 })
    assert.deepEqual(countsOf('system/derivation/run-bounded-selection.ts'), { consumed: 7, consumedGameProblem: 10, quotaBypass: 7, upstream: 23, UpstreamDecisions: 4 })
    const linesOf = (file: string) => [...(namedLines.get(file) ?? new Map<number, string>()).entries()].sort((a, b) => a[0] - b[0]).map(entry => entry[1])
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
    // The selector's lines: the size rule's own-size bound, the parameter, the guard, the sizes, and the size rule's call.
    assert.deepEqual(linesOf('system/test-library/generateSelection.ts'), [
        'quotaBypassOwnSize: number | null = null',
        'if (quotaBypassOwnSize !== null) {',
        'if (nc < 1 || nc > quotaBypassOwnSize) throw new Error(`Test Library selection contract violated: under the TEST-ONLY quota bypass expected 1–${quotaBypassOwnSize} constraints, got ${nc}.`)',
        'quotaBypass = false',
        'if (quotaBypass && !(recordBacked && constraintPool.constraintPrinciple !== null)) {',
        'const quotaBypassOwnSize = quotaBypass ? constraintPool.candidateIds.length : null',
        'const constraintSizes = quotaBypassOwnSize !== null && quotaBypassOwnSize >= 1 && ![2, 3, 4].includes(quotaBypassOwnSize) ? [quotaBypassOwnSize, 2, 3, 4] : [2, 3, 4]',
        'assertSelectionContract(bestLensCombo, bestConCombo, zeroConstraintCommitment, quotaBypassOwnSize)',
    ])

    // Registered.
    const registry = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/rendering/upstream-consumption.unit.ts'))
})

console.log = quiet
quiet(`upstream-consumption: ${passed} passed`)
if (process.exitCode) quiet('upstream-consumption: FAILURES ABOVE')
