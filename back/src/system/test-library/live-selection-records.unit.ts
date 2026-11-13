/**
 * **The live selection records what is applied** — Christian's item 4, received 12 November 2026: "Yes, please prepare a correction to the
 * live constraint-selection discrepancy, but keep it separate from release until I review the proposed change." The system must distinguish
 * "Constraints considered or eligible." "Constraints actually selected for application." "Constraints validated." "Constraints included in
 * the final activity." And: "A jointly required, authorized set should not be silently reduced. However, a pool of eligible alternatives
 * should not automatically become a requirement to use all of them." "The correction should preserve that distinction and avoid introducing
 * a new arbitrary selection rule."
 *
 * Until this correction the selector's committed combination (2 to 4 constraints) was what every record called selected, while the
 * activity was built from the package `buildConstraintPackage` makes of it (one member per role, a consequence kept only above 12): measured
 * on main 9919ea3, ten goals each recorded at least one constraint as selected that was never validated and never applied, eleven in all.
 * Now `selection.constraints` is the package's members (selected = validated = included), the combination stays on the trace
 * (`committedConstraints`) and each member not applied is recorded with the existing rule that left it out and the member kept
 * (`constraintsNotApplied`).
 *
 * Our mapping, CANDIDATE for Christian to confirm: an authorization record's set is Christian's "jointly required, authorized set" (taken
 * whole or refused); a vocabulary pool and free text are Christian's "pool of eligible alternatives" (fewer may be applied, each member not
 * applied recorded).
 *
 *   T1  selected = validated = included, for every goal and the free-text fixtures, read from the package the live builder builds.
 *   T2  nothing disappears: committed = applied + not applied, disjoint, each with its rule and kept member, pinned per goal.
 *   T3  live output identical: the package built from the applied set equals the package built from the combination (the snapshot check
 *       beside it is run outside the suite, against main's snapshot).
 *   T4  an eligible pool is never a must-use-all: no vocabulary selection is refused for applying fewer than it committed.
 *   T5  a jointly required set is refused, never reduced: over TEST-ONLY copies of A01's record (never production data).
 *
 * Every fixture below was MEASURED (12 November 2026, branch claude/live-selection-records from origin/main 9919ea3). Each check was bitten:
 * the deliberate break, the run that failed, the break undone (the report of this package lists them).
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import type { ISession } from '../../models/session.model'
import { GoalSelectionGap, selectFor } from '../derivation/run-bounded-selection'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { reviewActivity } from '../rendering/activity-review'
import { liveSelectionFor } from '../rendering/live-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { guidedGoalText, guidedSelectionHints } from '../sport-module/guided-selection'
import { authorizedIdsNotInPool, constraintBalanceBucket, constraintPoolFor, generateSelection, isSelectionKnowledgeGap, SelectionKnowledgeGap } from './generateSelection'
import { LearningGoalAuthorization, learningGoalAuthorizations, validateLearningGoalAuthorizations } from './learning-goal-authorizations'
import { testLibraryRegistry } from './library/registry'
import { ABSENT_MEMBER_WORDS } from './selection-compatibility'
import { systemAssemblyInputFromTestLibrarySelection } from './systemAssemblyInputFromSelection'
import type { ConstraintNotApplied, TestLibrarySelectionResult, TestLibraryV0Constraint } from './types'

const c = (name: string) => `tl-v0-constraint-${name}`
const short = (id: string) => id.replace('tl-v0-constraint-', '')

const quietly = <T>(run: () => T): T => {
    const log = console.log
    console.log = () => {}
    try {
        return run()
    } finally {
        console.log = log
    }
}

const LIBRARY = new Map(testLibraryRegistry.selectableConstraints().map(constraint => [constraint.id, constraint] as const))
const constraintOf = (id: string): TestLibraryV0Constraint => {
    const found = LIBRARY.get(id)
    assert.ok(found, `${id} is not a selectable library constraint`)
    return found!
}

/** The package the live route builds (`systemAssemblyInputFromTestLibrarySelection`, the generation route's own builder) from these constraints. */
const packageOf = (selection: TestLibrarySelectionResult, constraints: TestLibraryV0Constraint[]) =>
    systemAssemblyInputFromTestLibrarySelection({
        selection: { ...selection, constraints },
        session: {} as ISession,
        previousActivities: [],
        coachInput: { challengeLevel: 'medium', duration: 20, learningGoals: ['T'] },
    }).constraintPackage
const membersOf = (pkg: ReturnType<typeof packageOf>): string[] =>
    [pkg.foundation, pkg.shaping, pkg.consequence].filter(member => member !== undefined).map(member => String(member!.constraint._id))
/** JSON with the projection's timestamps removed: the only fields two builds of one package can differ by. */
const comparable = (value: unknown) => JSON.stringify(value, (name, entry) => (name === 'createdAt' || name === 'updatedAt' ? undefined : entry))

/* ── The selections: every guided goal as the live route makes it, and the free-text fixtures ───────────────────────────────────────── */

const GOALS = (sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID))
assert.equal(GOALS.length, 13)
const live = new Map<string, TestLibrarySelectionResult | SelectionKnowledgeGap>()
for (const id of GOALS) {
    try {
        live.set(id, quietly(() => liveSelectionFor(id, 'medium')))
    } catch (error) {
        assert.ok(isSelectionKnowledgeGap(error), `${id}: selection either selects or is a knowledge gap: ${String(error)}`)
        live.set(id, error)
    }
}
const selected = (id: string): TestLibrarySelectionResult => {
    const outcome = live.get(id)!
    assert.ok(!isSelectionKnowledgeGap(outcome), `${id} must select: ${String(outcome)}`)
    return outcome as TestLibrarySelectionResult
}
// A02 and D03 are knowledge gaps on main (their candidates cannot be combined); A01 is the record-backed goal, committing no constraint.
const GAPS = ['A02', 'D03']
const VOCABULARY_GOALS = ['A03', 'A04', 'A05', 'A06', 'D01', 'D02', 'TA01', 'TA02', 'TD01', 'TD02']

/** The free-text inputs the existing tests use, and the thirteen goal names and name-plus-definitions typed as free text (measured: all 29 select). */
const FREE_TEXT: string[] = ['reorganize', 'Win the ball back quickly after losing it', 'Keep the ball under pressure and play forward through midfield']
for (const goal of sessionPlanningModel.learningGoals() as any[]) FREE_TEXT.push(String(goal['Learning Goal']), `${goal['Learning Goal']}. ${goal['Coach Definition']}`)
const freeText = new Map(FREE_TEXT.map(text => [text, quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium' }, deriveInputConstraints(text)))] as const))

// Every selection made (a goal refused is checked in T4, never silently skipped: T4 requires exactly A02 and D03 refused).
const everySelection: [string, TestLibrarySelectionResult][] = [
    ...GOALS.filter(id => !isSelectionKnowledgeGap(live.get(id))).map(id => [id, selected(id)] as [string, TestLibrarySelectionResult]),
    ...[...freeText].map(([text, selection]) => [`free text ${JSON.stringify(text.slice(0, 40))}`, selection] as [string, TestLibrarySelectionResult]),
]

/**
 * Each of T1-T5 runs whatever the others found, and the file fails at the end naming every one that failed: so a deliberate break shows
 * exactly which of them it bites.
 */
const failures: string[] = []
const check = (name: string, run: () => void): void => {
    try {
        run()
        console.log(`  ${name}: ok`)
    } catch (error) {
        failures.push(name)
        console.log(`  ${name}: FAILED\n${String(error instanceof Error ? error.message : error)
            .split('\n')
            .slice(0, 40)
            .map(line => `    ${line}`)
            .join('\n')}`)
    }
}

/* ── T1: selected = validated = included ─────────────────────────────────────────────────────────────────────────────────────────────── */
check('T1 selected = validated = included', () => {
    // Read from `buildConstraintPackage`'s return through the live builder, never from the selector's check: every constraint the selection
    // calls selected is a member of the package the activity is built from, and the package holds nothing else.
    const violations: string[] = []
    for (const [what, selection] of everySelection) {
        const applied = selection.constraints.map(constraint => constraint.id)
        if (!applied.length) continue
        const members = membersOf(packageOf(selection, selection.constraints))
        const notInPackage = applied.filter(id => !members.includes(id))
        const notSelected = members.filter(id => !applied.includes(id))
        if (notInPackage.length || notSelected.length) violations.push(`${what}: selected and not in the package [${notInPackage.map(short).join(', ')}], in the package and not selected [${notSelected.map(short).join(', ')}]`)
    }
    assert.deepEqual(violations, [], `selected = validated = included:\n${violations.join('\n')}`)

    // The review route's selection (derivation's input, the account) is the same applied set, and so is what the live route's G3 compares.
    for (const id of VOCABULARY_GOALS) {
        const review = selectFor(id)
        const reviewIds = review.selected.filter(entry => entry.role.includes('constraint')).map(entry => entry.id)
        assert.deepEqual(reviewIds, selected(id).constraints.map(constraint => constraint.id), `${id}: the review selection is the applied set`)
    }
})

/* ── T2: nothing disappears ─────────────────────────────────────────────────────────────────────────────────────────────────────────── */
check('T2 nothing disappears', () => {
    /**
     * Pinned to the measurement (UL section 5, measured on main 9919ea3 before this correction, and again after it): per goal, each committed
     * constraint not applied, its role, the rule that left it out and the member kept. Every one of the eleven is left out by one member per
     * role; the free-text fixture below is the one measured case of the consequence threshold.
     */
    const NOT_APPLIED: Record<string, [string, string, string, string | null][]> = {
        A03: [['central-density-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'small-area-condition']],
        A04: [['zone-structure-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'small-area-condition']],
        A05: [['turnover-reward', 'consequence', 'ONE_MEMBER_PER_ROLE', 'progression-bonus']],
        A06: [['goalkeeper-included-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'small-area-condition']],
        D01: [['central-density-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'small-area-condition']],
        D02: [['interception-reward', 'consequence', 'ONE_MEMBER_PER_ROLE', 'turnover-reward']],
        TA01: [['interception-reward', 'consequence', 'ONE_MEMBER_PER_ROLE', 'transition-bonus']],
        TA02: [['turnover-reward', 'consequence', 'ONE_MEMBER_PER_ROLE', 'switch-of-play-bonus']],
        TD01: [['transition-trigger', 'foundation', 'ONE_MEMBER_PER_ROLE', 'zone-structure-condition']],
        TD02: [
            ['central-density-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'zone-structure-condition'],
            ['delay-reward', 'consequence', 'ONE_MEMBER_PER_ROLE', 'recovery-window'],
        ],
    }
    const pinned = (entries: ConstraintNotApplied[]) => entries.map(entry => [short(entry.id), entry.role, entry.rule, entry.kept ? short(entry.kept.id) : null])
    for (const id of GOALS.filter(goal => !GAPS.includes(goal))) {
        assert.deepEqual(pinned(selected(id).selectionTrace.constraintsNotApplied), NOT_APPLIED[id] ?? [], `${id}: each committed constraint not applied, with its rule and the member kept`)
    }
    assert.equal(Object.values(NOT_APPLIED).flat().length, 11, 'the eleven members of the measurement')
    // The consequence threshold, measured on free text: A01's name and definition typed as free text (no Learning Goal, no record).
    const a01: any = sessionPlanningModel.learningGoal('A01')
    const threshold = freeText.get(`${a01['Learning Goal']}. ${a01['Coach Definition']}`)!
    assert.deepEqual(
        pinned(threshold.selectionTrace.constraintsNotApplied),
        [
            ['wide-zone-advantage', 'shaping', 'ONE_MEMBER_PER_ROLE', 'pass-combination-gate'],
            ['interception-reward', 'consequence', 'CONSEQUENCE_SCORE_AT_OR_BELOW_12', null],
        ],
        'a consequence left out by the threshold keeps no member of its role',
    )

    // For every selection: the combination is exactly the applied members plus those not applied, disjoint, each entry's role its own and its
    // kept member applied and of its role; and each title is the library's.
    for (const [what, selection] of everySelection) {
        const committed = selection.selectionTrace.committedConstraints
        const applied = selection.constraints.map(constraint => constraint.id)
        const notApplied = selection.selectionTrace.constraintsNotApplied
        assert.deepEqual([...applied, ...notApplied.map(entry => entry.id)].sort(), [...committed].sort(), `${what}: committed = applied + not applied`)
        assert.ok(!notApplied.some(entry => applied.includes(entry.id)), `${what}: applied and not applied are disjoint`)
        assert.deepEqual(applied, committed.filter(id => applied.includes(id)), `${what}: applied in the combination's order`)
        // The size rule still applies to the combination (A01's zero-constraint commitment, under the general principle, excepted as before).
        if (what !== 'A01') assert.ok(committed.length >= 2 && committed.length <= 4, `${what}: the size rule still applies to the combination`)
        for (const entry of notApplied) {
            const library = constraintOf(entry.id)
            assert.equal(entry.title, library.title, `${what}: ${entry.id} titled as the library titles it`)
            assert.equal(entry.role, constraintBalanceBucket(library), `${what}: ${entry.id} its own role`)
            if (entry.rule === 'ONE_MEMBER_PER_ROLE') {
                assert.ok(entry.kept && applied.includes(entry.kept.id), `${what}: ${entry.id}: the member kept is applied`)
                assert.equal(constraintBalanceBucket(constraintOf(entry.kept!.id)), entry.role, `${what}: ${entry.id}: the member kept is of its role`)
                assert.equal(entry.kept!.title, constraintOf(entry.kept!.id).title)
            } else {
                assert.equal(entry.kept, null, `${what}: ${entry.id}: no member of its role is kept`)
                assert.ok(!applied.some(id => constraintBalanceBucket(constraintOf(id)) === entry.role), `${what}: ${entry.id}: and none of its role is applied`)
            }
        }
    }
    // The ranking marks as selected exactly the constraints applied (its documented meaning: 'chosen for the final activity').
    for (const [what, selection] of everySelection) {
        const marked = selection.selectionTrace.ranking.constraints.filter(entry => entry.selected).map(entry => entry.id).sort()
        assert.deepEqual(marked, selection.constraints.map(constraint => constraint.id).sort(), `${what}: the ranking's selected marks`)
    }

    // The record travels: the review account lists the applied constraints and, beside them, each not applied, as the trace has it.
    const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
    for (const id of VOCABULARY_GOALS) {
        const activity = reviewActivity({ playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none } } as any, { learningGoalId: id, durationMin: 20 })
        const account = activity.account
        assert.deepEqual((account.constraints ?? []).map(entry => entry.id), selected(id).constraints.map(constraint => constraint.id), `${id}: the account lists the applied constraints`)
        assert.deepEqual(account.constraintsNotApplied, selected(id).selectionTrace.constraintsNotApplied, `${id}: and those not applied`)
        for (const entry of account.constraintsNotApplied ?? []) assert.ok(!(account.selectedWithoutContract ?? []).includes(entry.id), `${id}: ${entry.id} is not listed as selected without a contract`)
    }
})

/* ── T3: the live output is identical ───────────────────────────────────────────────────────────────────────────────────────────────── */
check('T3 live output identical', () => {
    // The package built from the applied set is the package built from the committed combination: the same members, the same guardrails, the
    // same everything the prompt and the coach text are made from. Each role holds one member, and a member's role score does not depend on
    // the others, so the builder applied to its own picks returns them.
    for (const [what, selection] of everySelection) {
        if (!selection.selectionTrace.committedConstraints.length) continue
        const combination = selection.selectionTrace.committedConstraints.map(constraintOf)
        assert.equal(comparable(packageOf(selection, selection.constraints)), comparable(packageOf(selection, combination)), `${what}: the package from the applied set is the package from the combination`)
    }
    // A01, the record-backed goal, commits no constraint, so nothing about it moves.
    const a01 = selected('A01')
    assert.deepEqual([a01.constraints, a01.selectionTrace.committedConstraints, a01.selectionTrace.constraintsNotApplied], [[], [], []], 'A01: no constraint committed, applied or not applied')
})

/* ── T4: an eligible pool is never a must-use-all ───────────────────────────────────────────────────────────────────────────────────── */
check('T4 an eligible pool is never a must-use-all', () => {
    // Exactly A02 and D03 are refused (knowledge gaps on main, before and after this correction); every other goal selects.
    for (const id of GOALS) assert.equal(isSelectionKnowledgeGap(live.get(id)), GAPS.includes(id), `${id}: selects, or is one of the two gaps: ${String(live.get(id)).slice(0, 300)}`)
    // Every vocabulary goal selects (none is refused for applying fewer than it committed), and every one of them applies fewer: its pool is
    // eligible alternatives, of which the package uses one per role. A04 applies one constraint (its pool holds only foundation members, so its
    // package holds one). The authority is the vocabulary pool's, never presented as a record's.
    for (const id of VOCABULARY_GOALS) {
        const selection = selected(id)
        assert.equal(selection.selectionTrace.constraintPool?.constraintAuthority, 'VOCABULARY_POOL', id)
        assert.ok(selection.constraints.length < selection.selectionTrace.committedConstraints.length, `${id}: applies fewer than it committed, and is not refused for it`)
    }
    assert.deepEqual(selected('A04').constraints.map(constraint => constraint.id), [c('small-area-condition')], 'A04 applies one')
    for (const [text, selection] of freeText) assert.equal(selection.selectionTrace.constraintPool?.constraintAuthority, 'VOCABULARY_POOL', `free text ${text}: never presented as authorized`)
})

/* ── T5: a jointly required, authorized set is refused, never reduced ───────────────────────────────────────────────────────────────── */
check('T5 a jointly required set is refused, never reduced', () => {
    /**
     * Over TEST-ONLY copies of A01's record (`selectFor`'s `records` parameter, and the same hints for the live selector), each authorizing a
     * measured set of library constraints that is neither excluded by the record nor held. Unreachable in production: the one record (A01)
     * authorizes none. A copy of A01's record is used because it must still pass the package checks on A01's game form (GF2).
     */
    const GOAL = 'A01'
    const text = guidedGoalText(GOAL)
    const recordsWith = (ids: string[]): LearningGoalAuthorization[] =>
        learningGoalAuthorizations().map(record => (record.learningGoalId === GOAL ? { ...record, authorizedConstraints: [...ids] } : record))
    const liveWith = (ids: string[]): TestLibrarySelectionResult | SelectionKnowledgeGap => {
        try {
            return quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, guidedSelectionHints(GOAL, text, recordsWith(ids)).hints))
        } catch (error) {
            if (isSelectionKnowledgeGap(error)) return error
            throw error
        }
    }
    /** The same pool read as eligible alternatives (no record authority): what the record route enumerated before this correction. */
    const asEligible = (ids: string[]): TestLibrarySelectionResult => {
        const hints = { ...guidedSelectionHints(GOAL, text, recordsWith(ids)).hints, constraintAuthority: undefined }
        return quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, hints))
    }
    const reviewWith = (ids: string[]) => {
        try {
            return quietly(() => selectFor(GOAL, null, recordsWith(ids)))
        } catch (error) {
            if (error instanceof GoalSelectionGap) return error
            throw error
        }
    }
    const sorted = (ids: string[]) => [...ids].sort()

    // (a) One per role, admitted whole: committed whole, applied whole, nothing not applied, on both routes.
    const WHOLE = [c('central-density-condition'), c('counter-press-window'), c('progression-bonus')]
    const whole = liveWith(WHOLE)
    assert.ok(!isSelectionKnowledgeGap(whole), `the set of one per role is committed: ${String(whole)}`)
    const wholeSelection = whole as TestLibrarySelectionResult
    assert.equal(wholeSelection.selectionTrace.constraintPool?.constraintAuthority, 'AUTHORIZATION_RECORD')
    assert.deepEqual(sorted(wholeSelection.selectionTrace.committedConstraints), sorted(WHOLE), 'committed whole')
    assert.deepEqual(sorted(wholeSelection.constraints.map(constraint => constraint.id)), sorted(WHOLE), 'applied whole')
    assert.deepEqual(wholeSelection.selectionTrace.constraintsNotApplied, [])
    const wholeReview = reviewWith(WHOLE)
    assert.ok(!(wholeReview instanceof GoalSelectionGap), `the review route commits it too: ${String(wholeReview)}`)
    assert.deepEqual(sorted((wholeReview as Exclude<typeof wholeReview, GoalSelectionGap>).selected.filter(entry => entry.role.includes('constraint')).map(entry => entry.id)), sorted(WHOLE))

    // (b) Two of one role: the package holds one, so the set is refused naming the member it cannot hold (never committed with it not applied).
    // As an eligible pool the same pair commits, with Zone Structure Condition recorded as not applied (T4's case).
    const PAIR = [c('small-area-condition'), c('zone-structure-condition')]
    const pair = liveWith(PAIR)
    assert.ok(isSelectionKnowledgeGap(pair), `the pair is refused whole: ${JSON.stringify(isSelectionKnowledgeGap(pair) ? null : (pair as TestLibrarySelectionResult).selectionTrace.committedConstraints)}`)
    assert.equal((pair as SelectionKnowledgeGap).reason, 'NO_COMPATIBLE_COMBINATION')
    assert.ok((pair as SelectionKnowledgeGap).message.includes(`"Zone Structure Condition" is ${ABSENT_MEMBER_WORDS}`), (pair as SelectionKnowledgeGap).message)
    assert.ok((pair as SelectionKnowledgeGap).message.includes('taken whole or refused, never reduced'), (pair as SelectionKnowledgeGap).message)
    const pairReview = reviewWith(PAIR)
    assert.ok(pairReview instanceof GoalSelectionGap && pairReview.gap.message === (pair as SelectionKnowledgeGap).message, 'the review route refuses it with the same gap')
    assert.deepEqual(asEligible(PAIR).selectionTrace.constraintsNotApplied.map(entry => entry.id), [c('zone-structure-condition')], 'as eligible alternatives the pair commits, Zone Structure Condition not applied')

    // (c) Five: the size rule refuses the set as it stands; it is never cut to four. As an eligible pool a subset is committed.
    const FIVE = [c('central-density-condition'), c('counter-press-window'), c('progression-bonus'), c('small-area-condition'), c('interception-reward')]
    const five = liveWith(FIVE)
    assert.ok(isSelectionKnowledgeGap(five), `five are refused, not cut: ${JSON.stringify(isSelectionKnowledgeGap(five) ? null : (five as TestLibrarySelectionResult).selectionTrace.committedConstraints)}`)
    assert.ok((five as SelectionKnowledgeGap).message.includes('the set holds 5 constraints and the size rule admits 2 to 4, so it is refused as it stands, not cut to fit'), (five as SelectionKnowledgeGap).message)
    assert.ok(asEligible(FIVE).selectionTrace.committedConstraints.length < FIVE.length, 'as eligible alternatives a subset is committed')

    // (d) A set whose strict subset the old enumeration would have committed: refused whole, never reduced to that subset. Measured: Turnover
    // Reward fails a package check on GF2 on every lens combination, and the pool read as eligible alternatives commits Central Density
    // Condition with Counter-Press Window (a choice no record made).
    const REDUCIBLE = [c('central-density-condition'), c('counter-press-window'), c('turnover-reward')]
    const reducible = liveWith(REDUCIBLE)
    assert.ok(isSelectionKnowledgeGap(reducible), `refused whole, not reduced: ${JSON.stringify(isSelectionKnowledgeGap(reducible) ? null : (reducible as TestLibrarySelectionResult).selectionTrace.committedConstraints)}`)
    assert.ok((reducible as SelectionKnowledgeGap).message.includes('"Turnover Reward"'), (reducible as SelectionKnowledgeGap).message)
    assert.deepEqual(sorted(asEligible(REDUCIBLE).selectionTrace.committedConstraints), sorted([c('central-density-condition'), c('counter-press-window')]), 'as eligible alternatives the strict subset is committed')
    /*
     * (e) 'Where one exists, a set whose strict subset would win the commit is committed whole': measured over every set of one per role and
     * every pair of foundation with shaping or consequence on this copy (345 sets, 149 of them admitted whole), none exists: wherever the
     * whole set is admitted, the eligible reading commits the whole set too. Reported, not pinned (a 345-set loop is too slow for the suite).
     */

    // (f) One authorized member spelled another way than the library spells it (13 November 2026, from the VL verification, check 4). The record
    // validator matches by knowledge key and admits the copy; the pool matches exact ids, so before this check the member fell out and the two
    // left were committed as the whole set on both routes, with nothing recorded as not applied. Now the set is refused naming the member,
    // with the same gap on the review route; the library spelling of the same three is committed whole, as in (a).
    // Each spelling is checked on its own and every failure is collected before the assertion, so a break shows each spelling that is no
    // longer refused, not only the first (13 November 2026, from the VL2 verification, note N4).
    const aliasFailures: string[] = []
    for (const alias of ['blind:PROGRESSION-BONUS', 'PROGRESSION-BONUS']) {
        try {
            const ALIASED = [c('central-density-condition'), c('counter-press-window'), alias]
            const errors = validateLearningGoalAuthorizations(recordsWith(ALIASED)).filter(error => error.startsWith(`${GOAL}:`))
            assert.deepEqual(errors, [], `${alias}: the record validator admits the copy (it matches by knowledge key), so only selection can refuse it`)
            const aliased = liveWith(ALIASED)
            assert.ok(isSelectionKnowledgeGap(aliased), `${alias}: refused whole, not reduced: ${JSON.stringify(isSelectionKnowledgeGap(aliased) ? null : (aliased as TestLibrarySelectionResult).selectionTrace.committedConstraints)}`)
            const gap = aliased as SelectionKnowledgeGap
            assert.equal(gap.reason, 'NO_COMPATIBLE_COMBINATION', `${alias}: the reason`)
            assert.ok(gap.message.includes(`"${alias}" is authorized by the record and not in the selectable library under that spelling`), gap.message)
            assert.ok(gap.message.includes('taken whole or refused, never reduced'), gap.message)
            const aliasedReview = reviewWith(ALIASED)
            assert.ok(aliasedReview instanceof GoalSelectionGap && aliasedReview.gap.message === gap.message, `${alias}: the review route refuses it with the same gap`)
        } catch (error) {
            aliasFailures.push(`${alias}: ${(error as Error).message}`)
        }
    }
    assert.deepEqual(aliasFailures, [], `(f) ${aliasFailures.length} of 2 alias spellings not refused`)

    // (g) The held exemption (13 November 2026, from the VL2 verification, note N5). An id a ruling holds is in the pool's candidates and not
    // in its constraints, and must not be listed as authorized and not in the pool: the hold already reports it. Through the record route the
    // records' integrity gate refuses a record authorizing a held constraint first, so the exemption is pinned here on the pool itself.
    const HELD = c('pass-combination-gate')
    const heldHints = { candidateArchetypeIds: [], candidateAffordanceLensIds: [], matchedSignals: [], candidateConstraintIds: [c('central-density-condition'), c('counter-press-window'), HELD, 'blind:PROGRESSION-BONUS'] }
    const heldPool = constraintPoolFor(heldHints, GOAL)
    assert.deepEqual(heldPool.heldByRuling.map(hold => hold.id), [HELD], '(g) the copy holds the Pass Combination Gate by ruling')
    assert.deepEqual(authorizedIdsNotInPool(heldPool), ['blind:PROGRESSION-BONUS'], '(g) the held id is not listed; the alias is')

    // The production record is untouched by every copy above.
    assert.deepEqual(learningGoalAuthorizations().find(record => record.learningGoalId === GOAL)!.authorizedConstraints, [])
})

assert.deepEqual(failures, [], `live-selection-records.unit.ts: ${failures.length} of 5 failed: ${failures.join('; ')}`)
console.log('live-selection-records.unit.ts — ok')
