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
import fs from 'node:fs'
import path from 'node:path'

import type { ISession } from '../../models/session.model'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { mechanismDemonstration } from '../rendering/mechanism-demonstrations'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { guidedSelectionHints, hintsUnderAuthorization } from '../sport-module/guided-selection'
import { validateConstraintPackage } from '../validate-constraint-package'
import { constraintPoolFor, generateSelection, isSelectionKnowledgeGap, SelectionKnowledgeGap } from './generateSelection'
import { learningGoalSelectionHolds } from './learning-design-holds'
import { LearningGoalAuthorization, learningGoalAuthorizations, libraryConstraintPrinciple } from './learning-goal-authorizations'
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
    // A01 since 15 October 2026: its candidates are its authorization record's (his item 1 of that day), labelled so;
    // every other goal's are still its vocabulary-derived pool, labelled so.
    for (const [id, outcome] of outcomes) {
        const recorded = id === 'A01'
        assert.equal(outcome.pool.source, recorded ? 'AUTHORIZATION_RECORD' : 'GOAL_CANDIDATES', `${id}: a Learning Goal draws from its own candidates, always`)
        assert.equal(outcome.pool.constraintAuthority, recorded ? 'AUTHORIZATION_RECORD' : 'VOCABULARY_POOL', `${id}: whose authority they carry`)
        // `zeroConstraintRuling: null` for every goal until 15 October 2026; since his general principle of that day
        // (16 October reply, item 1) a record-governed goal whose set is evaluated carries the principle instead.
        assert.equal(outcome.pool.constraintPrinciple !== null, recorded, `${id}: read under the general principle exactly where a record evaluated its set`)
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
// fill all three roles. A01 since 15 October 2026: its record authorizes no constraint, so no role is filled.
// Still reported for A01 after his general principle of the same day (16 October reply, item 1): the account says
// which roles no candidate fills, as a fact; that a role is unfilled is no longer a gap where no constraint is
// justified, and A01 now selects (vi).
{
    const UNFILLED: Record<string, string[]> = {
        A01: ['foundation', 'shaping', 'consequence'],
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
//
// **Two since 15 October 2026.** A01's candidates are its authorization record's, which names nothing — so the gate
// is not among them to be held (the record EXCLUDES it, cross-referencing this hold: "The Pass Combination Gate
// remains excluded under our previous decision."). The wording pool that listed it is unchanged; A01 no longer
// selects from it.
{
    const HELD = ['A05', 'TA02']
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
    // the application depends on the text the coach's goal arrives as. Pinned so it is not rediscovered. (A01 lists
    // nothing at all since 15 October, whatever its text: its candidates are its record's.)
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
    /**
     * **A01 left this table on 15 October 2026.** It selected GF2 with Central Density, Wide Zone Advantage and
     * Interception Reward from its wording pool. Christian that day: approving Gain Access "does not automatically
     * authorize the candidate constraints currently derived from vocabulary coverage", and "Please leave Wide Zone
     * Advantage out of this initial Play Out from the Back demonstration." Its record authorizes no constraint and he
     * has not ruled that it may select none (decision D1), so it is a knowledge gap of its own kind,
     * NO_AUTHORIZED_CONSTRAINTS, found on GF2 — asserted in the gap list below.
     *
     * **A01 came back the same day, with NO constraint.** His reply received 15 October 2026 (16 October, item 1)
     * answered D1 with a general principle — "A library constraint is not mandatory unless its inclusion is justified
     * by the approved knowledge and intended learning environment" — and "Please proceed with Option A for Play Out
     * from the Back." Its record's evaluated set is empty, so it selects GF2 (the context gate, as before) and nothing
     * else. Measured on the same text the gap was found with.
     */
    const SELECTS: Record<string, [string, string[]]> = {
        A01: ['GF2', []],
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
    // A02 and D03 stay NO_COMPATIBLE_COMBINATION — never zero: neither has a record, and the principle reaches a goal
    // only through one (a measured floor of 0 would have turned exactly these two gaps into empty selections).
    const GAPS: Record<string, string> = { A02: 'GF3', D03: 'GF2' }
    const REASON: Record<string, string> = { A02: 'NO_COMPATIBLE_COMBINATION', D03: 'NO_COMPATIBLE_COMBINATION' }
    for (const [id, outcome] of outcomes) {
        if (GAPS[id]) {
            assert.ok('gap' in outcome, `${id} must be a knowledge gap`)
            const { gap } = outcome as { gap: SelectionKnowledgeGap }
            assert.equal(gap.reason, REASON[id], id)
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
    assert.equal(selection.selectionTrace.constraintPool?.constraintAuthority, 'VOCABULARY_POOL', 'free text is never presented as authorized')
}

// ── (ix) His general principle: an EVALUATED, EMPTY authorized set commits no library constraint — for any goal ──
//
// **Re-pointed 15 October 2026.** Until his reply of that day this section proved a zero-constraint commitment switched
// on per goal, by a TEST-ONLY `zeroConstraintRuling` on a copy of A01's record, with production A01 refused
// (NO_AUTHORIZED_CONSTRAINTS, decision D1). He answered D1 with a general principle (his 16 October reply, item 1):
// *"A library constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended
// learning environment."* — *"We can implement the correction incrementally, but please don't establish Play Out from
// the Back as a permanent special-case exception. The engine should continue enforcing structural validity and any
// genuinely required conditions."* — and *"Please proceed with Option A for Play Out from the Back."* So this section
// now proves: production A01 commits zero; ANY goal handed an evaluated, empty record behaves exactly as A01 does (all
// thirteen); no goal id is written in the selection and validation code; a record not yet evaluated, or a missing
// principle, is still the gap; an accidentally empty pool and a hold-emptied record are not the principle; and a goal
// without a record keeps its vocabulary pool and the 2–4 rule.
{
    const textOf = (id: string) => {
        const goal: any = sessionPlanningModel.learningGoal(id)
        return `${goal['Learning Goal']}. ${goal['Coach Definition']}`
    }
    const text = textOf('A01')
    const principle = libraryConstraintPrinciple()
    const onTrace = { ruledOn: principle.ruledOn, by: principle.by }
    const attempt = (run: () => TestLibrarySelectionResult): TestLibrarySelectionResult | SelectionKnowledgeGap => {
        try {
            return quietly(run)
        } catch (error) {
            if (isSelectionKnowledgeGap(error)) return error
            throw error
        }
    }

    // Production A01: GF2 and its lenses, NO library constraint, labelled with the authority it committed under.
    const a01 = outcomes.get('A01')!
    assert.ok('selection' in a01, `A01 selects since 15 October 2026: ${'gap' in a01 ? a01.gap.message : ''}`)
    const { selection } = a01 as { selection: TestLibrarySelectionResult }
    assert.equal(selection.archetype.id, 'GF2', 'the game form is chosen as always (the context gate)')
    assert.deepEqual(selection.constraints, [], 'and NO library constraint is committed')
    assert.ok(selection.affordanceLenses.length >= 2 && selection.affordanceLenses.length <= 3, 'lenses keep their 2–3 rule (his item 1 speaks of library constraints)')
    assert.equal(selection.selectionTrace.lensAuthority, 'ENGINE_LENS', "labelled as the engine's lenses, not authorized affordance targets")
    assert.deepEqual(selection.selectionTrace.constraintPool?.constraintPrinciple, onTrace, 'the principle it committed under is on the trace')
    assert.equal(selection.selectionTrace.constraintPool?.source, 'AUTHORIZATION_RECORD')

    /**
     * **Symmetry: no goal is special.** For EACH of the thirteen goals, a TEST-ONLY record evaluated as empty (no
     * ruling, context or Game Problem of his — every such field says TEST-ONLY) is added to a copy of the records, and
     * the goal is selected through the real hints and the real selector. Each behaves exactly as A01 does: zero
     * constraints, the record's authority, the principle on the trace, two or three lenses, and the SAME game form the
     * goal's own selection was made on — a record changes the constraints and nothing else.
     */
    const evaluatedEmpty = (id: string): LearningGoalAuthorization => ({
        learningGoalId: id,
        contextId: 'TEST-ONLY',
        gameProblemId: 'TEST-ONLY',
        ruledOn: 'TEST-ONLY',
        by: 'test',
        ruling: ['TEST-ONLY: never production data'],
        authorizedConstraints: [],
        authorizedConstraintsFinding: 'TEST-ONLY: evaluated, none justified',
        excluded: [],
        manipulations: [],
    })
    for (const id of GOALS) {
        const records = id === 'A01' ? learningGoalAuthorizations() : [...learningGoalAuthorizations(), evaluatedEmpty(id)]
        const outcome = attempt(() => generateSelection({ learningGoals: [textOf(id)], learningGoalId: id }, guidedSelectionHints(id, textOf(id), records).hints))
        assert.ok(!isSelectionKnowledgeGap(outcome), `${id}: an evaluated, empty record selects, as A01 does: ${(outcome as Error).message}`)
        const chosen = outcome as TestLibrarySelectionResult
        assert.deepEqual(chosen.constraints, [], `${id}: no library constraint`)
        assert.equal(chosen.selectionTrace.constraintPool?.source, 'AUTHORIZATION_RECORD', id)
        assert.equal(chosen.selectionTrace.constraintPool?.constraintAuthority, 'AUTHORIZATION_RECORD', id)
        assert.deepEqual(chosen.selectionTrace.constraintPool?.constraintPrinciple, onTrace, id)
        assert.ok(chosen.affordanceLenses.length >= 2 && chosen.affordanceLenses.length <= 3, `${id}: lenses keep their rule`)
        const production = outcomes.get(id)!
        const form = 'selection' in production ? production.selection.archetype.id : production.gap.archetypeId
        assert.equal(chosen.archetype.id, form, `${id}: the game form is the one its own selection was made on`)
    }

    /**
     * **No Learning Goal id is written in the code that selects or validates** — the "permanent special-case exception"
     * he refused would have to be one. Comments are stripped (they quote him and name goals by design); every remaining
     * word is checked against the planning model's thirteen ids.
     */
    const goalIds = new Set(GOALS)
    const goalLiterals = (source: string): string[] => {
        const code = source
            .split('/*')
            .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2)))
            .join(' ')
            .split('\n')
            .map(line => (line.trimStart().startsWith('//') ? '' : line.split(' // ')[0]))
            .join('\n')
        return (code.match(/[A-Za-z0-9]+/g) ?? []).filter(word => goalIds.has(word))
    }
    assert.deepEqual(goalLiterals("/* A02 */ if (goal === 'A01') pick() // D03\n// TA01\nconst x = 1"), ['A01'], 'the check bites: a literal in code is found, comments are not')
    for (const file of ['generateSelection.ts', 'selection-compatibility.ts', 'learning-goal-authorizations.ts', '../sport-module/guided-selection.ts', '../validate-constraint-package.ts']) {
        assert.deepEqual(goalLiterals(fs.readFileSync(path.join(__dirname, file), 'utf8')), [], `${file}: no Learning Goal id outside comments`)
    }

    // Not yet evaluated: the record's authorized set null — the gap, on the game form it was found on.
    const unevaluated = learningGoalAuthorizations()
    unevaluated[0].authorizedConstraints = null
    const notYet = attempt(() => generateSelection({ learningGoals: [text], learningGoalId: 'A01' }, guidedSelectionHints('A01', text, unevaluated).hints))
    assert.ok(isSelectionKnowledgeGap(notYet) && notYet.reason === 'NO_AUTHORIZED_CONSTRAINTS', `a record not yet evaluated is the gap: ${String(notYet)}`)
    assert.equal((notYet as SelectionKnowledgeGap).archetypeId, 'GF2')
    assert.ok((notYet as SelectionKnowledgeGap).message.includes('has not yet evaluated which library constraints the approved knowledge justifies'))
    // No principle: the same evaluated, empty set is the gap again, never a licence.
    const unprincipled = hintsUnderAuthorization(guidedSelectionHints('A01', text).hints, learningGoalAuthorizations()[0], null)
    const noPrinciple = attempt(() => generateSelection({ learningGoals: [text], learningGoalId: 'A01' }, unprincipled))
    assert.ok(isSelectionKnowledgeGap(noPrinciple) && noPrinciple.reason === 'NO_AUTHORIZED_CONSTRAINTS', `no principle, no zero commitment: ${String(noPrinciple)}`)

    // Without its record A01 is a vocabulary goal again: the pool, the authority label and the 2–4 rule as before.
    const vocabulary = attempt(() => generateSelection({ learningGoals: [text], learningGoalId: 'A01' }, guidedSelectionHints('A01', text, []).hints))
    const vocabularyPool = isSelectionKnowledgeGap(vocabulary) ? vocabulary.pool : vocabulary.selectionTrace.constraintPool!
    assert.equal(vocabularyPool.constraintAuthority, 'VOCABULARY_POOL')
    assert.equal(vocabularyPool.constraintPrinciple, null)
    if (!isSelectionKnowledgeGap(vocabulary)) assert.ok(vocabulary.constraints.length >= 2 && vocabulary.constraints.length <= 4, 'the 2–4 rule')

    // An ACCIDENTALLY empty pool — the vocabulary pool emptied, no record — still gaps as before, and does not commit zero.
    const emptied = { ...guidedSelectionHints('A05', text).hints, candidateConstraintIds: [] }
    assert.equal(emptied.constraintAuthority, undefined)
    const accidental = attempt(() => generateSelection({ learningGoals: ['Progress the Attack'], learningGoalId: 'A05' }, emptied))
    assert.ok(isSelectionKnowledgeGap(accidental) && accidental.reason === 'NO_SELECTABLE_CANDIDATES', `an empty vocabulary pool is the old gap: ${String(accidental)}`)

    // Hints carrying A01's record cannot select another goal.
    const recorded = guidedSelectionHints('A01', text).hints
    assert.throws(() => constraintPoolFor(recorded, 'A05'), /carry the authorization record of A01 and were used to select A05/)
    assert.throws(() => constraintPoolFor(recorded, null), /were used to select free text/)

    /**
     * **"No constraint" means the record found none justified — not that a hold emptied what it authorized** (G1
     * review, 15 October 2026; re-pointed the same day from the retired ruling to the principle). A copy authorizing
     * only the held Pass Combination Gate is refused at the hints by the integrity gate, and the selector, handed such
     * hints directly, takes the ordinary path and its old gap. A copy carrying the retired per-goal flag is refused too.
     */
    const heldOnly = learningGoalAuthorizations()
    heldOnly[0].authorizedConstraints = [PCG]
    heldOnly[0].excluded = heldOnly[0].excluded.filter(exclusion => exclusion.knowledgeId !== PCG)
    assert.throws(() => guidedSelectionHints('A01', text, heldOnly), /integrity gate: A01: authorizes tl-v0-constraint-pass-combination-gate, which a ruling holds/)
    const flagged = learningGoalAuthorizations()
    ;(flagged[0] as any).zeroConstraintRuling = { ruledOn: 'TEST-ONLY', by: 'test', ruling: 'TEST-ONLY: never production data' }
    assert.throws(() => guidedSelectionHints('A01', text, flagged), /a per-goal zero-constraint ruling is not read/)
    const direct = hintsUnderAuthorization(guidedSelectionHints('A01', text).hints, heldOnly[0])
    const filtered = attempt(() => generateSelection({ learningGoals: [text], learningGoalId: 'A01' }, direct))
    assert.ok(isSelectionKnowledgeGap(filtered) && filtered.reason === 'NO_SELECTABLE_CANDIDATES', `an authorized set a hold empties is not a zero-constraint commitment: ${String(filtered)}`)
    assert.deepEqual(learningGoalAuthorizations()[0].authorizedConstraints, [], 'the production record is untouched')
}

console.log('selection-pool.unit.ts — ok')
