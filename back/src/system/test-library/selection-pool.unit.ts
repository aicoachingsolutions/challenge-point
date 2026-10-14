/**
 * The constraint pool of a Learning Goal: its own candidates, minus what his rulings hold — and a gap where
 * they cannot be combined, never a borrowing.
 *
 * Christian, 14 October 2026: *"Selection should only use constraints authorized for the Learning Goal,
 * rather than silently drawing from the broader library when a suitable candidate is missing. If no
 * appropriate shaping constraint is available, please report that as a knowledge gap. One distinction: I
 * don't want us to assume that every activity necessarily requires an additional shaping constraint. … The
 * absence of designated shaping constraints for all five Defending and Transition-to-Defend goals is a
 * knowledge-coverage issue we'll need to address deliberately. Please keep those gaps visible rather than
 * compensating through fallback selection."* And of the Pass Combination Gate: *"Please keep the current Pass
 * Combination Gate as a mechanism demonstration only. I do not want it reintroduced into learning-design
 * examples until we've reviewed its ecological suitability."*
 *
 * Every figure below was MEASURED on 14 October with the hints the checked pathway gives selection (goal name
 * plus Coach Definition, through `guidedSelectionHints`), and the name-only hints the older tests use where
 * they differ. A goal moving in a table is a change in the knowledge or the rule, and is explained where it
 * moves.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import type { ISession } from '../../models/session.model'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { mechanismDemonstration } from '../rendering/mechanism-demonstrations'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { guidedSelectionHints } from '../sport-module/guided-selection'
import { validateConstraintPackage } from '../validate-constraint-package'
import { constraintPoolFor, generateSelection, isSelectionKnowledgeGap, SelectionKnowledgeGap } from './generateSelection'
import { learningGoalSelectionHolds } from './learning-design-holds'
import { testLibraryRegistry } from './library/registry'
import { systemAssemblyInputFromTestLibrarySelection } from './systemAssemblyInputFromSelection'
import type { ConstraintPoolAccount, TestLibrarySelectionResult } from './types'

const PCG = 'tl-v0-constraint-pass-combination-gate'
const c = (name: string) => `tl-v0-constraint-${name}`

const quietly = <T>(run: () => T): T => {
    const log = console.log
    console.log = () => {}
    try {
        return run()
    } finally {
        console.log = log
    }
}

type Outcome = { selection: TestLibrarySelectionResult; pool: ConstraintPoolAccount } | { gap: SelectionKnowledgeGap; pool: ConstraintPoolAccount }

/** Select a goal exactly as the checked pathway does: name plus Coach Definition, through the guided hints. */
function select(goalId: string, text?: string): Outcome {
    const goal: any = sessionPlanningModel.learningGoal(goalId)
    const said = text ?? `${goal['Learning Goal']}. ${goal['Coach Definition']}`
    const guided = guidedSelectionHints(goalId, said)
    try {
        const selection = quietly(() => generateSelection({ learningGoals: [said], learningGoalId: goalId }, guided.hints))
        return { selection, pool: selection.selectionTrace.constraintPool! }
    } catch (error) {
        if (isSelectionKnowledgeGap(error)) return { gap: error, pool: error.pool }
        throw error
    }
}

const GOALS = (sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID))
assert.equal(GOALS.length, 13)
const outcomes = new Map(GOALS.map(id => [id, select(id)] as const))

// ── (i) A Learning Goal's pool is its own candidates, and only those ───────────────────────────────
{
    for (const [id, outcome] of outcomes) {
        assert.equal(outcome.pool.source, 'GOAL_CANDIDATES', `${id}: a Learning Goal draws from its own candidates, always`)
        assert.equal(outcome.pool.setAsideBecause, null, `${id}: nothing is set aside for the library`)
        assert.deepEqual(outcome.pool.missingRoles, [], `${id}: missingRoles is a free-text account`)
        if ('selection' in outcome) {
            for (const constraint of outcome.selection.constraints) {
                assert.ok(outcome.pool.candidateIds.includes(constraint.id), `${id}: ${constraint.id} is not among the goal's candidates`)
            }
        }
    }
}

// ── (ii) The roles no designated candidate fills — the knowledge gaps, reported and never filled ────
//
// The five Defending and Transition-to-Defend goals he named, plus Play Through Pressure (A02) and Beat
// Defenders 1v1 (A04), which has no designated consequence constraint either. Every other goal's candidates
// fill all three roles.
{
    const UNFILLED: Record<string, string[]> = {
        A02: ['shaping'],
        A04: ['shaping', 'consequence'],
        D01: ['shaping'],
        D02: ['shaping'],
        D03: ['shaping'],
        TD01: ['shaping'],
        TD02: ['shaping'],
    }
    for (const [id, outcome] of outcomes) assert.deepEqual(outcome.pool.unfilledRoles, UNFILLED[id] ?? [], id)
}

// ── (iii) His hold: the gate is held for exactly the goals whose candidates name it ─────────────────
//
// With name plus definition text, three goals list the gate among their candidates. It STAYS listed (the pool
// is his knowledge and is not edited) and is reported as held, with his words.
{
    const HELD = ['A01', 'A05', 'TA02']
    for (const [id, outcome] of outcomes) {
        if (HELD.includes(id)) {
            assert.ok(outcome.pool.candidateIds.includes(PCG), `${id}: the held gate is still listed among the candidates`)
            assert.deepEqual(outcome.pool.heldByRuling.map(hold => hold.id), [PCG], id)
            assert.equal(outcome.pool.heldByRuling[0].ruledOn, '2026-10-14')
            assert.ok(outcome.pool.heldByRuling[0].ruling.startsWith('Please keep the current Pass Combination Gate as a mechanism demonstration only.'), 'his words, verbatim')
        } else {
            assert.ok(!outcome.pool.candidateIds.includes(PCG), `${id}: not a candidate, so nothing to hold`)
            assert.deepEqual(outcome.pool.heldByRuling, [], id)
        }
        // NO Learning Goal selection contains a held id.
        if ('selection' in outcome) assert.ok(!outcome.selection.constraints.some(constraint => constraint.id === PCG), `${id} selected a held constraint`)
    }
    // With the name alone A01 and A05 do not list the gate and TA02 does — so which goals the hold touches in
    // the application depends on the text the coach's goal arrives as. Pinned so it is not rediscovered.
    for (const [id, listed] of [['A01', false], ['A05', false], ['TA02', true]] as const) {
        const goal: any = sessionPlanningModel.learningGoal(id)
        const nameOnly = select(id, String(goal['Learning Goal']))
        assert.equal(nameOnly.pool.candidateIds.includes(PCG), listed, `${id}, name only`)
        assert.equal(nameOnly.pool.heldByRuling.length, listed ? 1 : 0, `${id}, name only`)
    }
}

// ── (iv) Every hold names a library object and the demonstration that keeps it usable ─────────────
{
    const holds = learningGoalSelectionHolds()
    assert.deepEqual(holds.map(hold => hold.knowledgeId), [PCG], 'the one hold his 14 October ruling made')
    for (const hold of holds) {
        assert.ok(testLibraryRegistry.selectableConstraints().some(constraint => constraint.id === hold.knowledgeId), `${hold.knowledgeId} is not in the library`)
        assert.equal(hold.by, 'Christian')
        assert.equal(hold.mechanismDemonstration, 'pass-combination-gate')
        /**
         * **Flipped 14 October 2026 (stage S-B), as this pin said it would be.** Stage S-A named the demonstration
         * before it existed; S-B added it ("Pass Combination Gate" as revised on 14 October), so the hold now
         * points at something a coach can open — refused at structure, honestly, until his OD1 decision.
         */
        assert.ok(mechanismDemonstration(hold.mechanismDemonstration), 'the hold names a demonstration that exists')
        assert.deepEqual(mechanismDemonstration(hold.mechanismDemonstration)!.selected, ['GF2', hold.knowledgeId], 'and that demonstration is made of the held object')
    }
    // The hold is a copy: no caller edits the ruling in place.
    learningGoalSelectionHolds()[0].ruling = 'edited'
    assert.notEqual(learningGoalSelectionHolds()[0].ruling, 'edited')
}

// ── (iv-b) A hold is matched by KNOWLEDGE KEY, the builder's rule — 14 October 2026, from the S-B review ────────
//
// Selection matched the hold as text while the builder's guard matched by `knowledgeKey`, so a hold spelled the way
// a contract spells the object held nothing here. Each spelling below names the same object; each must hold the
// library's gate, and the account reports it as designated and held.
{
    const [hold] = learningGoalSelectionHolds()
    const hints = { candidateConstraintIds: testLibraryRegistry.selectableConstraints().map(constraint => constraint.id) } as any
    for (const spelling of [PCG, 'blind:PASS-COMBINATION-GATE', 'PASS-COMBINATION-GATE', 'pass-combination-gate']) {
        const pool = constraintPoolFor(hints, 'A01', [{ ...hold, knowledgeId: spelling }])
        assert.ok(!pool.constraints.some(constraint => constraint.id === PCG), `a hold spelled ${spelling} must hold the gate`)
        assert.deepEqual(pool.heldByRuling.map(held => held.id), [spelling], spelling)
        assert.ok(pool.candidateIds.includes(PCG), 'the gate stays listed among the candidates: the pool is not edited')
    }
    // And a hold on something else holds nothing of the gate.
    const other = constraintPoolFor(hints, 'A01', [{ ...hold, knowledgeId: 'tl-v0-constraint-no-such-object' }])
    assert.ok(other.constraints.some(constraint => constraint.id === PCG))
}

// ── (v) Free text is out of scope and keeps its fallback — pinned as the state awaiting his ruling ──
//
// Free text has no Learning Goal, and its candidates come from wording. Whether it too should stop borrowing
// is his decision (owner decision 4 of 14 October); until then this is the state, measured.
{
    const pool = constraintPoolFor(deriveInputConstraints('Win the ball back quickly after losing it'))
    assert.equal(pool.source, 'WHOLE_LIBRARY')
    assert.equal(pool.setAsideBecause, 'NO_FOUNDATION_AND_SHAPING')
    assert.deepEqual(pool.missingRoles, ['shaping'])
    assert.deepEqual([pool.heldByRuling, pool.unfilledRoles], [[], []], 'holds and gaps are Learning Goal accounts')
    assert.equal(pool.constraints.length, testLibraryRegistry.selectableConstraints().length)
}

// ── (vi) What each goal selects from its own candidates, and the two that cannot be combined ────────
//
// The five goals whose candidates hold no shaping constraint now select from their own candidates without
// one. A02 and D03 cannot be combined on the game form selection chose for them; that is found by the
// existing package checks (affordance-group and wording heuristics), NOT by any shaping requirement, so it is
// reported as a knowledge gap and never read as a learning-design verdict.
{
    const SELECTS: Record<string, [string, string[]]> = {
        A01: ['GF2', [c('central-density-condition'), c('wide-zone-advantage'), c('interception-reward')]],
        A03: ['GF3', [c('central-density-condition'), c('small-area-condition'), c('wide-zone-advantage'), c('progression-bonus')]],
        A04: ['GF2', [c('small-area-condition'), c('zone-structure-condition')]],
        A05: ['GF2', [c('central-density-condition'), c('wide-zone-advantage'), c('progression-bonus'), c('turnover-reward')]],
        A06: ['GF9', [c('goalkeeper-included-condition'), c('small-area-condition'), c('wide-zone-advantage'), c('progression-bonus')]],
        D01: ['GF2', [c('central-density-condition'), c('small-area-condition'), c('delay-reward')]],
        D02: ['GF4', [c('transition-trigger'), c('interception-reward'), c('turnover-reward')]],
        TA01: ['GF4', [c('transition-trigger'), c('wide-zone-advantage'), c('transition-bonus'), c('interception-reward')]],
        TA02: ['GF2', [c('central-density-condition'), c('wide-zone-advantage'), c('turnover-reward'), c('switch-of-play-bonus')]],
        TD01: ['GF4', [c('transition-trigger'), c('zone-structure-condition'), c('recovery-window')]],
        TD02: ['GF4', [c('zone-structure-condition'), c('central-density-condition'), c('delay-reward'), c('recovery-window')]],
    }
    const GAPS: Record<string, string> = { A02: 'GF3', D03: 'GF2' }
    for (const [id, outcome] of outcomes) {
        if (GAPS[id]) {
            assert.ok('gap' in outcome, `${id} must be a knowledge gap`)
            const { gap } = outcome as { gap: SelectionKnowledgeGap }
            assert.equal(gap.reason, 'NO_COMPATIBLE_COMBINATION', id)
            assert.equal(gap.archetypeId, GAPS[id], `${id}: the gap names the game form it was found on`)
            assert.equal(gap.learningGoalId, id)
            assert.ok(gap instanceof Error && gap.name === 'SelectionKnowledgeGap')
            continue
        }
        assert.ok('selection' in outcome, `${id} must select: ${'gap' in outcome ? outcome.gap.message : ''}`)
        const { selection } = outcome as { selection: TestLibrarySelectionResult }
        assert.deepEqual([selection.archetype.id, selection.constraints.map(constraint => constraint.id)], SELECTS[id], id)
    }
}

// ── (vii) A package without a shaping constraint is valid; without a foundation it is not ──────────
//
// His ruling removes exactly one clause. Built from a real selection (D01: a foundation and a consequence, no
// shaping candidate), the package passes every other check; with its foundation taken away it still fails.
{
    const { selection } = outcomes.get('D01') as { selection: TestLibrarySelectionResult }
    const input = systemAssemblyInputFromTestLibrarySelection({
        selection,
        session: {} as ISession,
        previousActivities: [],
        coachInput: { challengeLevel: 'medium', duration: 20, learningGoals: ['D01'] },
    })
    const pkg = input.constraintPackage
    assert.equal(pkg.shaping, undefined, 'no shaping constraint is designated for this goal, and none is borrowed')
    assert.equal(pkg.foundation.constraint._id, c('small-area-condition'))
    assert.equal(pkg.consequence?.constraint._id, c('delay-reward'))
    validateConstraintPackage(input.affordances, input.archetype, pkg)
    assert.throws(
        () => validateConstraintPackage(input.affordances, input.archetype, { ...pkg, foundation: undefined as any }),
        /requires a foundation constraint/,
        'the foundation stays required: that was not ruled',
    )
}

// ── (viii) Free text keeps its selection exactly — the shaping slot is optional for Learning Goals only ──
//
// Found in review, 14 October 2026: making the package's shaping slot optional (his ruling, for Learning Goals)
// also let free-text selection accept combinations it used to reject, and free text moved. "reorganize" (a
// deriveInputConstraints test input) had selected Counter-Press Window at bb65cbb and selected Small Area
// Condition instead, its package then holding no shaping constraint. The review compared 80 free-text inputs
// (the selection, pipeline, diversity, archetype-distribution and input-constraint test inputs, the thirteen
// goal names and definitions typed as free text) between bb65cbb and the fix: identical, 80 of 80. This pins
// the one that moved, and the rule that keeps it: free text still requires the shaping member.
{
    const goal = 'reorganize'
    const selection = quietly(() => generateSelection({ learningGoals: [goal], challengeLevel: 'intermediate' } as any, deriveInputConstraints(goal)))
    assert.deepEqual(
        [selection.archetype.id, selection.constraints.map(constraint => constraint.id)],
        ['GF11', [c('central-density-condition'), c('counter-press-window'), c('delay-reward'), c('recovery-window')]],
        'free text selects what it selected before 14 October',
    )
    const input = systemAssemblyInputFromTestLibrarySelection({ selection, session: {} as ISession, previousActivities: [], coachInput: { challengeLevel: 'medium', duration: 20, learningGoals: [goal] } })
    assert.ok(input.constraintPackage.shaping, 'and a free-text package still holds a shaping constraint')
    assert.equal(selection.selectionTrace.constraintPool?.source, 'WHOLE_LIBRARY')
}

console.log('selection-pool.unit.ts — ok')
