/**
 * Unit tests — Session Planning Model RC1 loading.
 *
 * Pins the things that would break the coach conversation WITHOUT erroring, which is the whole
 * failure class this loader exists to catch: an orphaned Practice Situation silently disappears, a
 * phrase pointing at a deleted goal routes nowhere, and a goal with no Engine Translation row is a
 * dead end the coach only discovers after answering every question.
 *
 * Also pins the RC1 shape itself — 11 goals, 20 situations, 4 phases — so that when Christian
 * revises the workbook the change is deliberate and visible in a diff rather than absorbed silently.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import {
    gameProblemsForLearningGoal,
    sessionPlanningModel,
    translationStatus,
    validateSessionPlanningModel,
} from './session-planning-model'

function testIntegrityGate(): void {
    const result = validateSessionPlanningModel()
    assert.ok(result.valid, `Session Planning Model failed integrity: ${result.errors.slice(0, 6).join(' | ')}`)
}

/** The RC1 shape. A change here should be a deliberate workbook revision, not a surprise. */
function testRc1Shape(): void {
    assert.equal(sessionPlanningModel.learningGoals().length, 11, 'RC1 declares 11 Learning Goals.')
    assert.deepEqual(
        sessionPlanningModel.phases(),
        ['Attacking', 'Defending', 'Transition to Attack', 'Transition to Defend'],
        'RC1 declares four phases, in authoring order.'
    )
    // RC1.1 (Cycle 8): 12 original + 57 merged from the verified runtime extraction, including the
    // judgment phrases resolved by Christian's D02/D03 coaching-intent distinction.
    assert.equal(sessionPlanningModel.entryLanguage().length, 69, 'RC1.1 declares 69 entry phrases.')
    assert.equal(sessionPlanningModel.governanceRules().length, 6, 'RC1 declares 6 governance rules.')
}

/** Display order is a coaching decision, so it must survive loading rather than falling to file order. */
function testDisplayOrderPreserved(): void {
    for (const phase of sessionPlanningModel.phases()) {
        const goals = sessionPlanningModel.learningGoalsForPhase(phase)
        const orders = goals.map((g) => Number(g['Display Order']))
        assert.deepEqual(
            orders,
            [...orders].sort((a, b) => a - b),
            `${phase} Learning Goals are not in display order.`
        )
    }

    // Spot-pin the first attacking goal — the first thing a coach sees.
    const attacking = sessionPlanningModel.learningGoalsForPhase('Attacking')
    assert.equal(attacking[0]['Learning Goal'], 'Play Out from the Back')
}

/**
 * The conditional step. A goal with situations must offer them in order; a goal without must return
 * an empty list so the application can continue automatically, per Implementation Guide Rule 3.
 */
function testPracticeSituationsResolve(): void {
    const withSituations = sessionPlanningModel.practiceSituationsFor('A01')
    assert.equal(withSituations.length, 4, 'A01 declares four Practice Situations.')
    assert.equal(withSituations[0]['Practice Situation'], 'Against High Pressure')

    // Every situation must belong to a goal that exists — proven for all, not just a sample.
    let total = 0
    for (const goal of sessionPlanningModel.learningGoals()) {
        total += sessionPlanningModel.practiceSituationsFor(String(goal['ID'])).length
    }
    assert.equal(total, 20, 'Every Practice Situation must be reachable from its parent Learning Goal.')

    assert.deepEqual(sessionPlanningModel.practiceSituationsFor('NOPE'), [], 'An unknown goal yields no situations.')
}

/**
 * ENGINE TRANSLATION — approved and applied at RC1.1 (Cycle 8 §4).
 *
 * This test previously asserted zero populated rows, deliberately, so that populating the bridge
 * would force a conscious update rather than appearing silently. It fired exactly as intended when
 * the Cycle 8 decisions landed, and is now updated to the approved state.
 *
 * Nine of eleven are mapped. A01 and A04 remain EMPTY by explicit decision (Cycle 8 §5: "No
 * placeholder mappings should be introduced") — they are runtime realization opportunities rather
 * than knowledge deficiencies, so an empty cell here is the correct recorded answer, not an omission.
 */
function testEngineTranslationMatchesApprovedRc11(): void {
    const status = translationStatus()
    assert.equal(status.total, 11, 'Every Learning Goal must have an Engine Translation row.')
    assert.equal(status.populated, 9, 'Cycle 8 approved nine mappings.')
    assert.deepEqual(
        status.unpopulated.sort(),
        ['A01', 'A04'],
        'A01 and A04 are the intentional runtime gaps. Any other unmapped goal is a regression.'
    )

    // Spot-pin two approved mappings so a silent change to the canonical workbook is caught.
    assert.deepEqual(gameProblemsForLearningGoal('A02')?.primary, ['GP-015'])
    assert.deepEqual(gameProblemsForLearningGoal('D02')?.primary, ['GP-016'])

    // `null` rather than an empty array for a gap: "no mapping" and "no game problems apply" are
    // opposite meanings, and the Implementation Guide requires failing loudly over defaulting.
    assert.equal(gameProblemsForLearningGoal('A01'), null, 'An intentional gap must report null, not empty.')
    assert.equal(gameProblemsForLearningGoal('NOPE'), null, 'An unknown Learning Goal must report null.')

    // Cycle 8 §4 defers secondary Game Problems to a future version, so none should be recorded.
    for (const goal of sessionPlanningModel.learningGoals()) {
        const mapping = gameProblemsForLearningGoal(String(goal['ID']))
        assert.deepEqual(mapping?.secondary ?? [], [], `${String(goal['ID'])} records a secondary GP; RC1.1 approves primary only.`)
    }
}

/** Entry language is a navigation hint. It must resolve, and it must not invent goals. */
function testEntryLanguageResolves(): void {
    assert.equal(sessionPlanningModel.learningGoalIdForPhrase('build from the back'), 'A01')
    assert.equal(sessionPlanningModel.learningGoalIdForPhrase('  Win The Ball Back  '), 'D02', 'Lookup is forgiving of case and spacing.')
    assert.equal(sessionPlanningModel.learningGoalIdForPhrase('nonsense phrase'), null)
}

/** Negative cases — proving the gate bites, not merely that it passes on a healthy workbook. */
function testGateCatchesBrokenReferences(): void {
    const healthy = {
        source_workbook: 'test',
        header_row: 1,
        learning_goals: [{ ID: 'A01', Phase: 'Attacking', 'Display Order': 1, 'Learning Goal': 'Goal', 'Coach Definition': 'Def' }],
        practice_situations: [{ ID: 'A01-01', 'Parent ID': 'A01', 'Display Order': 1, 'Practice Situation': 'Sit' }],
        entry_language: [{ 'Coach Phrase': 'phrase', 'Learning Goal ID': 'A01' }],
        engine_translation: [{ 'Learning Goal ID': 'A01', 'Primary GP IDs': 'TBD' }],
        governance: [{ Rule: 'Coach language first.' }],
    }
    const damaged = (mutate: (d: typeof healthy) => void) => {
        const copy = JSON.parse(JSON.stringify(healthy)) as typeof healthy
        mutate(copy)
        return validateSessionPlanningModel(copy as never).errors
    }

    assert.deepEqual(validateSessionPlanningModel(healthy as never).errors, [], 'A healthy workbook must produce no errors.')

    assert.ok(
        damaged((d) => {
            d.practice_situations[0]['Parent ID'] = 'GONE'
        }).some((e) => e.includes('disappears')),
        'An orphaned Practice Situation must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.entry_language[0]['Learning Goal ID'] = 'GONE'
        }).some((e) => e.includes('does not exist')),
        'A phrase pointing at a missing goal must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.engine_translation = []
        }).some((e) => e.includes('reach nothing')),
        'A goal with no Engine Translation row must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.learning_goals.push({ ...d.learning_goals[0] })
        }).some((e) => e.includes('Duplicate Learning Goal')),
        'A duplicate goal ID must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.learning_goals[0]['Coach Definition'] = ''
        }).some((e) => e.includes('Coach Definition')),
        'A goal with no coach-facing definition must be caught.'
    )
}

function runAll(): void {
    testIntegrityGate()
    testRc1Shape()
    testDisplayOrderPreserved()
    testPracticeSituationsResolve()
    testEngineTranslationMatchesApprovedRc11()
    testEntryLanguageResolves()
    testGateCatchesBrokenReferences()
    console.log('session-planning-model unit tests: all cases passed.')
}

runAll()
