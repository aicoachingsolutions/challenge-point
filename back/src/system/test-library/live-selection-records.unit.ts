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
 * Our mapping until 13 November 2026, CANDIDATE for Christian to confirm: an authorization record's set is Christian's "jointly required,
 * authorized set" (taken whole or refused); a vocabulary pool and free text are Christian's "pool of eligible alternatives" (fewer may be
 * applied, each member not applied recorded). Christian, received 13 November 2026, heading 8: "Please preserve the source authority behind
 * those distinctions rather than assuming every authorization record necessarily represents the same kind of set." So since that day a
 * record whose set names a constraint DECLARES its kind with the source's words (`authorizedSetKind`): JOINTLY_REQUIRED (whole or refused,
 * as before) or ELIGIBLE_ALTERNATIVES (read as an eligible pool is, over the set alone); one that declares none is refused at load, as a
 * knowledge gap for Christian, and no kind is assumed. An empty set needs none; A01's, the one production record, is empty and unchanged.
 *
 *   T1  selected = validated = included, for every goal and the free-text fixtures, read from the package the live builder builds.
 *   T2  nothing disappears: committed = applied + not applied, disjoint, each with its rule and kept member, pinned per goal.
 *   T3  live output identical: the package built from the applied set equals the package built from the combination (the snapshot check
 *       beside it is run outside the suite, against main's snapshot).
 *   T4  an eligible pool is never a must-use-all: no vocabulary selection is refused for applying fewer than it committed.
 *   T5  a set declared JOINTLY_REQUIRED is refused, never reduced: over TEST-ONLY copies of A01's record (never production data).
 *   T6  a set that names a constraint declares its kind with the source's words, or the record is refused at load (13 November 2026).
 *   T7  a set declared ELIGIBLE_ALTERNATIVES: fewer may be applied, nothing outside it ever is, and every member not applied is recorded
 *       with the existing rule or step that left it out (13 November 2026), on both routes and in the account.
 *
 * Every fixture below was MEASURED (12 November 2026, branch claude/live-selection-records from origin/main 9919ea3). Each check was bitten:
 * the deliberate break, the run that failed, the break undone (the report of this package lists them).
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import type { ISession } from '../../models/session.model'
import type { BoundedSelection } from '../derivation/run-bounded-selection'
import { GoalSelectionGap, selectFor } from '../derivation/run-bounded-selection'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { reviewActivity } from '../rendering/activity-review'
import { buildActivityUnderAuthorizationRecords } from '../rendering/build-activity'
import { liveSelectionFor } from '../rendering/live-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { guidedGoalText, guidedSelectionHints, hintsUnderAuthorization } from '../sport-module/guided-selection'
import { authorizedIdsNotInPool, constraintBalanceBucket, constraintPoolFor, generateSelection, isSelectionKnowledgeGap, SelectionKnowledgeGap } from './generateSelection'
import { LearningGoalAuthorization, learningGoalAuthorizations, validateLearningGoalAuthorizations } from './learning-goal-authorizations'
import { testLibraryRegistry } from './library/registry'
import { ABSENT_MEMBER_WORDS } from './selection-compatibility'
import { systemAssemblyInputFromTestLibrarySelection } from './systemAssemblyInputFromSelection'
import type { AuthorizedMemberNotCommitted, AuthorizedSetKind, AuthorizedSetKindDeclaration, ConstraintNotApplied, TestLibrarySelectionResult, TestLibraryV0Constraint } from './types'

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

/* ── TEST-ONLY copies of A01's record, for T5 to T7 ─────────────────────────────────────────────────────────────────────────────────── */
/**
 * Over TEST-ONLY copies of A01's record (`selectFor`'s `records` parameter, and the same hints for the live selector), each authorizing a
 * measured set of library constraints that is neither excluded by the record nor held. Unreachable in production: the one record (A01)
 * authorizes none. A copy of A01's record is used because it must still pass the package checks on A01's game form (GF2).
 *
 * Since 13 November 2026 a copy that names a constraint declares its kind of set, or the records' gate refuses it. The declarations here are
 * TEST-ONLY: their words are no source's, and say so.
 */
const GOAL = 'A01'
const text = guidedGoalText(GOAL)
const declaredAs = (kind: AuthorizedSetKind): AuthorizedSetKindDeclaration => ({ kind, words: `TEST-ONLY: no source; a copy of A01's record read as ${kind}`, citedAs: 'TEST-ONLY' })
const JOINTLY = declaredAs('JOINTLY_REQUIRED')
const ELIGIBLE = declaredAs('ELIGIBLE_ALTERNATIVES')
/** Passed for `kind` where the copy carries no `authorizedSetKind` field at all (any other value, null included, is put in the field). */
const NO_KIND = Symbol('no authorizedSetKind field')
/** A01's record with its set replaced (`null`: not yet evaluated) and declared `kind` (JOINTLY_REQUIRED unless given). */
const recordsWith = (ids: string[] | null, kind: unknown = JOINTLY): LearningGoalAuthorization[] =>
    learningGoalAuthorizations().map(record =>
        record.learningGoalId === GOAL ? ({ ...record, authorizedConstraints: ids === null ? null : [...ids], ...(kind === NO_KIND ? {} : { authorizedSetKind: kind }) } as LearningGoalAuthorization) : record,
    )
const liveWith = (ids: string[], kind: unknown = JOINTLY): TestLibrarySelectionResult | SelectionKnowledgeGap => {
    try {
        return quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, guidedSelectionHints(GOAL, text, recordsWith(ids, kind)).hints))
    } catch (error) {
        if (isSelectionKnowledgeGap(error)) return error
        throw error
    }
}
/** The same pool read as eligible alternatives (no record authority): what the record route enumerated before 12 November 2026. */
const asEligible = (ids: string[]): TestLibrarySelectionResult => {
    const hints = { ...guidedSelectionHints(GOAL, text, recordsWith(ids)).hints, constraintAuthority: undefined }
    return quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, hints))
}
const reviewWith = (ids: string[], kind: unknown = JOINTLY): BoundedSelection | GoalSelectionGap => {
    try {
        return quietly(() => selectFor(GOAL, null, recordsWith(ids, kind)))
    } catch (error) {
        if (error instanceof GoalSelectionGap) return error
        throw error
    }
}
const sorted = (ids: string[]) => [...ids].sort()
const WHOLE = [c('central-density-condition'), c('counter-press-window'), c('progression-bonus')]
const PAIR = [c('small-area-condition'), c('zone-structure-condition')]
const FIVE = [c('central-density-condition'), c('counter-press-window'), c('progression-bonus'), c('small-area-condition'), c('interception-reward')]
const REDUCIBLE = [c('central-density-condition'), c('counter-press-window'), c('turnover-reward')]

/* ── T5: a jointly required, authorized set is refused, never reduced ───────────────────────────────────────────────────────────────── */
check('T5 a jointly required set is refused, never reduced', () => {
    // The copies below declare their sets JOINTLY_REQUIRED (`recordsWith`'s default), the reading every record's set had until 13 November 2026.

    // (a) One per role, admitted whole: committed whole, applied whole, nothing not applied, on both routes.
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
    const pair = liveWith(PAIR)
    assert.ok(isSelectionKnowledgeGap(pair), `the pair is refused whole: ${JSON.stringify(isSelectionKnowledgeGap(pair) ? null : (pair as TestLibrarySelectionResult).selectionTrace.committedConstraints)}`)
    assert.equal((pair as SelectionKnowledgeGap).reason, 'NO_COMPATIBLE_COMBINATION')
    assert.ok((pair as SelectionKnowledgeGap).message.includes(`"Zone Structure Condition" is ${ABSENT_MEMBER_WORDS}`), (pair as SelectionKnowledgeGap).message)
    assert.ok((pair as SelectionKnowledgeGap).message.includes('taken whole or refused, never reduced'), (pair as SelectionKnowledgeGap).message)
    const pairReview = reviewWith(PAIR)
    assert.ok(pairReview instanceof GoalSelectionGap && pairReview.gap.message === (pair as SelectionKnowledgeGap).message, 'the review route refuses it with the same gap')
    assert.deepEqual(asEligible(PAIR).selectionTrace.constraintsNotApplied.map(entry => entry.id), [c('zone-structure-condition')], 'as eligible alternatives the pair commits, Zone Structure Condition not applied')

    // (c) Five: the size rule refuses the set as it stands; it is never cut to four. As an eligible pool a subset is committed.
    const five = liveWith(FIVE)
    assert.ok(isSelectionKnowledgeGap(five), `five are refused, not cut: ${JSON.stringify(isSelectionKnowledgeGap(five) ? null : (five as TestLibrarySelectionResult).selectionTrace.committedConstraints)}`)
    assert.ok((five as SelectionKnowledgeGap).message.includes('the set holds 5 constraints and the size rule admits 2 to 4, so it is refused as it stands, not cut to fit'), (five as SelectionKnowledgeGap).message)
    assert.ok(asEligible(FIVE).selectionTrace.committedConstraints.length < FIVE.length, 'as eligible alternatives a subset is committed')

    // (d) A set whose strict subset the old enumeration would have committed: refused whole, never reduced to that subset. Measured: Turnover
    // Reward fails a package check on GF2 on every lens combination, and the pool read as eligible alternatives commits Central Density
    // Condition with Counter-Press Window (a choice no record made).
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

/* ── T6: a set that names a constraint declares its kind, with the source's words, or is refused at load ────────────────────────────── */
check("T6 a set's kind is declared with the source's words, or the record is refused at load", () => {
    /**
     * Christian, received 13 November 2026, heading 8: "Please preserve the source authority behind those distinctions rather than assuming
     * every authorization record necessarily represents the same kind of set." The loader runs `validateLearningGoalAuthorizations` on the
     * file at module load and throws on any sentence; every pathway's hints run it again on the records they are given
     * (`guidedSelectionHints`), so a sentence here is a refusal at load on both routes.
     */
    // (a) Production: A01's record names no constraint and declares no kind (an empty set needs none), and the records load. Nothing about
    // any production selection carries a kind or a not-committed list: the pool account, the trace and A01's hints are as they were.
    const production = learningGoalAuthorizations().find(record => record.learningGoalId === GOAL)!
    assert.deepEqual(production.authorizedConstraints, [], 'A01 names no constraint')
    assert.ok(!('authorizedSetKind' in production), 'A01 declares no kind')
    assert.deepEqual(validateLearningGoalAuthorizations(learningGoalAuthorizations()), [], 'the production records load')
    assert.ok(!('setKind' in guidedSelectionHints(GOAL, text).hints.constraintAuthority!), "A01's hints carry no kind")
    for (const [what, selection] of everySelection) {
        assert.ok(!('constraintSetKind' in (selection.selectionTrace.constraintPool ?? {})), `${what}: no kind on the pool account`)
        assert.ok(!('authorizedSetNotCommitted' in selection.selectionTrace), `${what}: no not-committed list on the trace`)
    }

    // (b) A set that names a constraint with no declaration, or a declaration that is not one: refused at load with ONE sentence naming the
    // knowledge gap, and no kind is assumed; neither route selects anything. Each case is checked on its own, every failure collected.
    const ONE = [c('small-area-condition')]
    const UNDECLARED = 'a knowledge gap for Christian (SET_KIND_UNDECLARED)'
    const UNSOURCED = 'a knowledge gap for Christian (SET_KIND_UNSOURCED)'
    const cases: [string, string[], unknown, string][] = [
        ['no field', WHOLE, NO_KIND, `A01: names 3 authorized constraints and declares no kind of set: ${UNDECLARED}`],
        ['null', ONE, null, `A01: names 1 authorized constraint and declares no kind of set: ${UNDECLARED}`],
        ['a bare word', WHOLE, 'JOINTLY_REQUIRED', `A01: names 3 authorized constraints and gives its kind of set as "JOINTLY_REQUIRED", not as a declaration (kind, words and citedAs): ${UNDECLARED}`],
        ['an unknown kind', WHOLE, { ...JOINTLY, kind: 'ALL_OF' }, `A01: names 3 authorized constraints and declares its kind of set as "ALL_OF", which is neither JOINTLY_REQUIRED nor ELIGIBLE_ALTERNATIVES: ${UNDECLARED}`],
        ['a kind spelled another way', PAIR, { ...ELIGIBLE, kind: 'eligible_alternatives' }, `A01: names 2 authorized constraints and declares its kind of set as "eligible_alternatives", which is neither JOINTLY_REQUIRED nor ELIGIBLE_ALTERNATIVES: ${UNDECLARED}`],
        ['words and no kind', PAIR, { words: ELIGIBLE.words, citedAs: ELIGIBLE.citedAs }, `A01: names 2 authorized constraints and declares its kind of set as null, which is neither JOINTLY_REQUIRED nor ELIGIBLE_ALTERNATIVES: ${UNDECLARED}`],
        ['no words', WHOLE, { ...JOINTLY, words: '' }, `A01: declares its set JOINTLY_REQUIRED without the source words that establish it (authorizedSetKind words and citedAs are both required): ${UNSOURCED}`],
        ['blank words', PAIR, { ...ELIGIBLE, words: '   ' }, `A01: declares its set ELIGIBLE_ALTERNATIVES without the source words that establish it (authorizedSetKind words and citedAs are both required): ${UNSOURCED}`],
        ['no citation', PAIR, { kind: 'ELIGIBLE_ALTERNATIVES', words: ELIGIBLE.words }, `A01: declares its set ELIGIBLE_ALTERNATIVES without the source words that establish it (authorizedSetKind words and citedAs are both required): ${UNSOURCED}`],
    ]
    const caseFailures: string[] = []
    for (const [name, ids, kind, expected] of cases) {
        try {
            const errors = validateLearningGoalAuthorizations(recordsWith(ids, kind))
            assert.equal(errors.length, 1, `${name}: one sentence: ${errors.join(' | ')}`)
            assert.ok(errors[0].startsWith(expected) && errors[0].endsWith('; no kind is assumed'), `${name}: the named gap, no kind assumed: ${errors[0]}`)
            const refusedAtLoad = (error: unknown) => !isSelectionKnowledgeGap(error) && !(error instanceof GoalSelectionGap) && String((error as Error).message).includes(`integrity gate: ${expected}`)
            assert.throws(() => liveWith(ids, kind), refusedAtLoad, `${name}: the live route refuses at the gate, nothing selected`)
            assert.throws(() => reviewWith(ids, kind), refusedAtLoad, `${name}: the review route refuses at the gate, nothing selected`)
        } catch (error) {
            caseFailures.push(`${name}: ${(error as Error).message.slice(0, 300)}`)
        }
    }
    assert.deepEqual(caseFailures, [], `(b) ${caseFailures.length} of ${cases.length} undeclared or unsourced kinds not refused`)

    // (c) A kind declared for a set that names no constraint is refused (no reader acts on it); without one, the empty and the unevaluated set
    // load as before.
    for (const ids of [[], null] as (string[] | null)[]) {
        for (const kind of [JOINTLY, ELIGIBLE]) {
            assert.deepEqual(
                validateLearningGoalAuthorizations(recordsWith(ids, kind)),
                ['A01: declares a kind of set (authorizedSetKind) for a set that names no constraint; an empty or unevaluated set needs no kind, and no reader acts on one'],
                `${JSON.stringify(ids)} ${kind.kind}`,
            )
        }
        assert.deepEqual(validateLearningGoalAuthorizations(recordsWith(ids, NO_KIND)), [], `${JSON.stringify(ids)} with no kind loads`)
        assert.deepEqual(validateLearningGoalAuthorizations(recordsWith(ids, null)), [], `${JSON.stringify(ids)} with a null kind loads`)
    }

    // (d) Hints made by hand from a record that names a constraint and declares no kind (the gate bypassed): the selector refuses them, and no
    // kind is assumed; the same for hints whose declaration lost its words, and for hints whose kind is neither of the two (13 November 2026,
    // from the VSK verification, F2: the gate has its own kind check, so only this case shows the selector's pool asks the kind too).
    for (const ids of [WHOLE, PAIR]) {
        const undeclared = recordsWith(ids, NO_KIND).find(record => record.learningGoalId === GOAL)!
        const hints = hintsUnderAuthorization(guidedSelectionHints(GOAL, text).hints, undeclared)
        assert.ok(!('setKind' in hints.constraintAuthority!), 'the hints carry no kind')
        const refused = (error: unknown) => !isSelectionKnowledgeGap(error) && String((error as Error).message).includes('SET_KIND_UNDECLARED') && String((error as Error).message).includes('no kind is assumed')
        assert.throws(() => quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, hints)), refused, `${ids.length}: undeclared hints`)
        const unsourced = { ...hints, constraintAuthority: { ...hints.constraintAuthority!, setKind: { ...JOINTLY, words: '' } } }
        assert.throws(() => quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, unsourced)), refused, `${ids.length}: unsourced hints`)
        const unknownKind = { ...hints, constraintAuthority: { ...hints.constraintAuthority!, setKind: { ...JOINTLY, kind: 'ALL_OF' } as unknown as AuthorizedSetKindDeclaration } }
        assert.throws(() => quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, unknownKind)), refused, `${ids.length}: hints with an unknown kind`)
    }

    // (e) The declaration travels with the set as the record declares it: on the pool account of both routes, and in the record the account
    // carries.
    const whole = liveWith(WHOLE, JOINTLY) as TestLibrarySelectionResult
    assert.deepEqual(whole.selectionTrace.constraintPool?.constraintSetKind, JOINTLY)
    assert.deepEqual((liveWith(PAIR, ELIGIBLE) as TestLibrarySelectionResult).selectionTrace.constraintPool?.constraintSetKind, ELIGIBLE)
    const wholeReview = reviewWith(WHOLE, JOINTLY) as BoundedSelection
    assert.deepEqual(wholeReview.constraintPool.constraintSetKind, JOINTLY)
    assert.deepEqual(wholeReview.authorization?.authorizedSetKind, JOINTLY)
    assert.ok(!('authorizedSetNotCommitted' in whole.selectionTrace) && !('authorizedSetNotCommitted' in wholeReview), 'a jointly required set has no not-committed list')
})

/* ── T7: a set declared ELIGIBLE_ALTERNATIVES ───────────────────────────────────────────────────────────────────────────────────────── */
check('T7 an eligible set: fewer may apply, nothing outside it, every member not applied recorded', () => {
    /**
     * Christian, received 13 November 2026, heading 8: "eligibility among several alternatives does not require all of them to be applied."
     * Each set below is read as ELIGIBLE_ALTERNATIVES on a TEST-ONLY copy of A01's record, and pinned to the measurement (13 November 2026):
     * the combination committed, the constraints applied, each committed and not applied with the package rule and the member kept, and each
     * member not committed with the selector's step that left it out. Together the three cover the three steps a member can be left out by.
     */
    const short3 = (entry: AuthorizedMemberNotCommitted) => [short(entry.id), entry.role, entry.rule]
    const short4 = (entry: ConstraintNotApplied) => [short(entry.id), entry.role, entry.rule, entry.kept ? short(entry.kept.id) : null]
    const CUT = [c('central-density-condition'), c('transition-trigger'), c('zone-structure-condition'), c('counter-press-window')]
    const MEASURED: Record<string, [string[], { committed: string[]; applied: string[]; notApplied: unknown[]; notCommitted: unknown[] }]> = {
        WHOLE: [WHOLE, { committed: ['central-density-condition', 'counter-press-window', 'progression-bonus'], applied: ['central-density-condition', 'counter-press-window', 'progression-bonus'], notApplied: [], notCommitted: [] }],
        PAIR: [PAIR, { committed: ['small-area-condition', 'zone-structure-condition'], applied: ['small-area-condition'], notApplied: [['zone-structure-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'small-area-condition']], notCommitted: [] }],
        FIVE: [
            FIVE,
            {
                committed: ['central-density-condition', 'small-area-condition', 'counter-press-window', 'progression-bonus'],
                applied: ['small-area-condition', 'counter-press-window', 'progression-bonus'],
                notApplied: [['central-density-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'small-area-condition']],
                notCommitted: [['interception-reward', 'consequence', 'ANOTHER_COMBINATION_COMMITTED']],
            },
        ],
        REDUCIBLE: [REDUCIBLE, { committed: ['central-density-condition', 'counter-press-window'], applied: ['central-density-condition', 'counter-press-window'], notApplied: [], notCommitted: [['turnover-reward', 'consequence', 'IN_NO_ADMITTED_COMBINATION']] }],
        CUT: [
            CUT,
            {
                committed: ['central-density-condition', 'zone-structure-condition', 'counter-press-window'],
                applied: ['zone-structure-condition', 'counter-press-window'],
                notApplied: [['central-density-condition', 'foundation', 'ONE_MEMBER_PER_ROLE', 'zone-structure-condition']],
                notCommitted: [['transition-trigger', 'foundation', 'NOT_AMONG_TWO_PER_ROLE']],
            },
        ],
    }
    const caseFailures: string[] = []
    for (const [name, [ids, pinned]] of Object.entries(MEASURED)) {
        try {
            const outcome = liveWith(ids, ELIGIBLE)
            assert.ok(!isSelectionKnowledgeGap(outcome), `${name}: an eligible set is not refused for applying fewer: ${String(outcome)}`)
            const selection = outcome as TestLibrarySelectionResult
            const trace = selection.selectionTrace
            assert.equal(trace.constraintPool?.constraintAuthority, 'AUTHORIZATION_RECORD', `${name}: the record's authority`)
            const applied = selection.constraints.map(constraint => constraint.id)
            const notCommitted = trace.authorizedSetNotCommitted
            assert.ok(Array.isArray(notCommitted), `${name}: the not-committed list is recorded for an eligible set, empty included`)
            assert.deepEqual(
                { committed: trace.committedConstraints.map(short), applied: applied.map(short), notApplied: trace.constraintsNotApplied.map(short4), notCommitted: notCommitted!.map(short3) },
                pinned,
                `${name}: as measured`,
            )
            // Nothing outside the set, and every member accounted for exactly once: applied, committed and not applied, or not committed.
            assert.ok(trace.committedConstraints.every(id => ids.includes(id)), `${name}: nothing outside the set is committed`)
            assert.deepEqual(sorted([...applied, ...trace.constraintsNotApplied.map(entry => entry.id), ...notCommitted!.map(entry => entry.id)]), sorted(ids), `${name}: every member once`)
            for (const entry of notCommitted!) {
                assert.equal(entry.title, constraintOf(entry.id).title, `${name}: ${entry.id} titled as the library titles it`)
                assert.equal(entry.role, constraintBalanceBucket(constraintOf(entry.id)), `${name}: ${entry.id} its own role`)
            }
            assert.deepEqual(sorted(trace.ranking.constraints.filter(entry => entry.selected).map(entry => entry.id)), sorted(applied), `${name}: the ranking marks the applied`)
            // The ordinary enumeration exactly: the same set read as an eligible pool without the record's authority commits and applies the same.
            const vocabulary = asEligible(ids)
            assert.deepEqual(
                [vocabulary.selectionTrace.committedConstraints, vocabulary.constraints.map(constraint => constraint.id), vocabulary.selectionTrace.constraintsNotApplied],
                [trace.committedConstraints, applied, trace.constraintsNotApplied],
                `${name}: no new selection rule`,
            )
            // The review route records the same.
            const review = reviewWith(ids, ELIGIBLE)
            assert.ok(!(review instanceof GoalSelectionGap), `${name}: the review route selects: ${String(review)}`)
            const bounded = review as BoundedSelection
            assert.deepEqual(bounded.selected.filter(entry => entry.role.includes('constraint')).map(entry => entry.id), applied, `${name}: review applied`)
            assert.deepEqual(bounded.constraintsNotApplied, trace.constraintsNotApplied, `${name}: review not applied`)
            assert.deepEqual(bounded.authorizedSetNotCommitted, notCommitted, `${name}: review not committed`)
            // Read as JOINTLY_REQUIRED, every set but the one-per-role WHOLE is refused (T5): the declared kind, not the set, decides.
            assert.equal(isSelectionKnowledgeGap(liveWith(ids, JOINTLY)), name !== 'WHOLE', `${name}: as JOINTLY_REQUIRED`)
        } catch (error) {
            caseFailures.push(`${name}: ${(error as Error).message.slice(0, 400)}`)
        }
    }
    assert.deepEqual(caseFailures, [], `${caseFailures.length} of ${Object.keys(MEASURED).length} eligible sets not as measured`)

    // Never a constraint outside the set: one member cannot be combined (the size rule admits 2 to 4), so the set is the knowledge gap, and
    // nothing is drawn from the library to make up the combination.
    const one = liveWith([c('small-area-condition')], ELIGIBLE)
    assert.ok(isSelectionKnowledgeGap(one) && one.reason === 'NO_COMPATIBLE_COMBINATION', `one member is the gap, nothing borrowed: ${String(one).slice(0, 300)}`)
    assert.deepEqual((one as SelectionKnowledgeGap).pool.candidateIds, [c('small-area-condition')])

    // The alias-spelling refusal stays for an eligible set: the member would otherwise be lost with no rule that left it out.
    const ALIASED = [c('central-density-condition'), c('counter-press-window'), 'blind:PROGRESSION-BONUS']
    const aliased = liveWith(ALIASED, ELIGIBLE)
    assert.ok(isSelectionKnowledgeGap(aliased), `the alias refuses the eligible set: ${JSON.stringify(isSelectionKnowledgeGap(aliased) ? null : (aliased as TestLibrarySelectionResult).selectionTrace.committedConstraints)}`)
    const aliasGap = aliased as SelectionKnowledgeGap
    assert.ok(aliasGap.message.includes(`The authorization record's set of eligible alternatives is refused as it stands: "blind:PROGRESSION-BONUS" is authorized by the record and not in the selectable library under that spelling`), aliasGap.message)
    assert.ok(!aliasGap.message.includes('taken whole or refused'), 'an eligible set is not called jointly required')
    const aliasedReview = reviewWith(ALIASED, ELIGIBLE)
    assert.ok(aliasedReview instanceof GoalSelectionGap && aliasedReview.gap.message === aliasGap.message, 'the review route refuses it with the same gap')

    // The not-committed step is read on the committed lenses only (13 November 2026, from the VSK verification, F1; the set found by the
    // FIX-SK search over every set of two to four usable constraints, pinned to the measurement). On the committed lens triple Final Third
    // Value is in no admitted combination; with the hints' lenses restricted to the pair possession-stability and space-creation (the
    // enumeration on that pair alone), the whole set is committed. Read on every lens combination, the step would say another combination
    // was committed instead.
    const lens = (name: string) => `tl-v0-lens-${name}`
    const LENS_READ = [c('central-density-condition'), c('final-third-value'), c('transition-bonus')]
    const lensRead = liveWith(LENS_READ, ELIGIBLE) as TestLibrarySelectionResult
    assert.deepEqual(sorted(lensRead.affordanceLenses.map(entry => entry.id)), sorted([lens('possession-stability-opportunity'), lens('line-breaking-opportunity'), lens('space-creation-opportunity')]), 'the lens reading: the committed lens triple')
    assert.deepEqual(lensRead.selectionTrace.committedConstraints.map(short), ['central-density-condition', 'transition-bonus'], 'the lens reading: committed on the triple')
    assert.deepEqual(lensRead.selectionTrace.authorizedSetNotCommitted?.map(short3), [['final-third-value', 'consequence', 'IN_NO_ADMITTED_COMBINATION']], 'the lens reading: the step on the committed lenses')
    const onPair = { ...guidedSelectionHints(GOAL, text, recordsWith(LENS_READ, ELIGIBLE)).hints, candidateAffordanceLensIds: [lens('possession-stability-opportunity'), lens('space-creation-opportunity')] }
    const pairRead = quietly(() => generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, onPair))
    assert.deepEqual(sorted(pairRead.selectionTrace.committedConstraints), sorted(LENS_READ), 'the lens reading: on the pair alone the whole set is committed')

    // The account carries the record (technical evidence, never coach-facing): A01 built under the FIVE copy. Measured: the build refuses at
    // `knowledge`, because the members applied have no contribution contract (an existing refusal, unchanged); the account still says what
    // was applied, what was committed and not applied, what was not committed, and the kind the record declared.
    const ROLES = specializedRoleNames()
    const roles = { ...Object.fromEntries(ROLES.map(role => [role, 0])), [ROLES[0]]: 1 }
    const built: any = quietly(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: GOAL, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles, objects: { goal: { count: 0 } } } } as any, recordsWith(FIVE, ELIGIBLE)).activity)
    const fiveTrace = (liveWith(FIVE, ELIGIBLE) as TestLibrarySelectionResult).selectionTrace
    assert.equal(built.stage, 'knowledge', 'measured: refused at knowledge (no contribution contract)')
    assert.deepEqual(built.account.constraintsNotApplied, fiveTrace.constraintsNotApplied, 'the account: committed and not applied')
    assert.deepEqual(built.account.authorizedSetNotCommitted, fiveTrace.authorizedSetNotCommitted, 'the account: not committed')
    assert.deepEqual(built.account.authorization.authorizedSetKind, ELIGIBLE, 'the account: the kind the record declared')

    // The production record is untouched by every copy above.
    assert.ok(!('authorizedSetKind' in learningGoalAuthorizations().find(record => record.learningGoalId === GOAL)!))
})

assert.deepEqual(failures, [], `live-selection-records.unit.ts: ${failures.length} of 7 failed: ${failures.join('; ')}`)
console.log('live-selection-records.unit.ts — ok')
