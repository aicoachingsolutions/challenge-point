/**
 * Unit tests — guided clarification for broad coach terms.
 *
 * The property that matters most here is NEGATIVE: this module must not become a second home for
 * planning knowledge. Its directions are derived from the registry, so the tests check that the
 * derivation actually tracks the workbook rather than pinning a hand-written list — a test that
 * asserted "defending offers D01, D02, D03" would pass just as happily if someone hardcoded it.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { CLARIFYING_QUESTION, allClarifications, clarificationFor } from './guided-clarification'
import { sessionPlanningModel } from './session-planning-model'

/** The two terms Christian routed here explicitly at the Cycle 8 close-out. */
function testDeferredJudgmentTermsAreHandled(): void {
    for (const term of ['defend', 'defending']) {
        const clarification = clarificationFor(term)
        assert.ok(clarification, `"${term}" must produce a clarification — it is why this module exists.`)
        assert.equal(clarification.question, CLARIFYING_QUESTION)
        assert.ok(clarification.directions.length > 1, `"${term}" must offer a choice, not a single answer.`)
    }

    // And they must NOT have been quietly filed into a Learning Goal instead.
    for (const term of ['defend', 'defending']) {
        assert.equal(
            sessionPlanningModel.learningGoalIdForPhrase(term),
            null,
            `"${term}" must remain unassigned in Entry Language — Cycle 8 left it deliberately ambiguous.`
        )
    }
}

/**
 * THE ANTI-HARDCODING CHECK. Every direction must be a real Learning Goal from the registry, matched
 * by id. If someone replaced the derivation with a literal list, an id would eventually drift from
 * the workbook and this would catch it.
 */
function testDirectionsAreRealRegistryEntries(): void {
    const validIds = new Set(sessionPlanningModel.learningGoals().map((goal) => String(goal['ID'])))

    for (const clarification of allClarifications()) {
        assert.ok(clarification.directions.length > 0, `${clarification.term} has no directions but was returned.`)

        for (const direction of clarification.directions) {
            assert.ok(
                validIds.has(direction.learningGoalId),
                `${clarification.term} offers "${direction.learningGoalId}", which is not in the registry.`
            )

            // Name and phase must match the workbook, not a copy that can drift out of step.
            const goal = sessionPlanningModel.learningGoal(direction.learningGoalId)
            assert.equal(direction.learningGoal, String(goal?.['Learning Goal'] ?? ''))
            assert.equal(direction.phase, String(goal?.['Phase'] ?? ''))

            // The example, when present, must be one of that goal's own situations.
            if (direction.example) {
                const situations = sessionPlanningModel
                    .practiceSituationsFor(direction.learningGoalId)
                    .map((s) => String(s['Practice Situation'] ?? ''))
                assert.ok(
                    situations.includes(direction.example),
                    `${direction.learningGoalId} example "${direction.example}" is not one of its situations.`
                )
            }
        }
    }
}

/** A phase-naming term must offer the whole phase, not whichever goal happens to mention the word. */
function testPhaseTermsOfferTheWholePhase(): void {
    const clarification = clarificationFor('defending')
    assert.ok(clarification)

    const defendingGoals = sessionPlanningModel
        .learningGoalsForPhase('Defending')
        .map((goal) => String(goal['ID']))
        .sort()

    assert.deepEqual(
        clarification.directions.map((d) => d.learningGoalId).sort(),
        defendingGoals,
        '"defending" names a phase, so it must offer every goal in that phase — otherwise two of them ' +
            'become invisible to a coach who started with that word.'
    )
}

/** Only broad terms clarify. A specific term must go straight through to selection. */
function testSpecificTermsDoNotClarify(): void {
    for (const term of ['win the ball back', 'create chances', 'counterattack', '', '   ', 'nonsense']) {
        assert.equal(clarificationFor(term), null, `"${term}" must not trigger clarification.`)
    }
    // Case and padding must not decide whether a coach gets help.
    assert.ok(clarificationFor('  Defending  '), 'Lookup must tolerate case and spacing.')
}

/**
 * NO SPORT VOCABULARY IN CODE. Breadth is measured, not declared, so every clarification offered
 * must have been discovered from the workbook rather than written here.
 *
 * This is the property the sport-coupling guard was defending when it rejected the first version of
 * this module: a hardcoded list of technique words is sport knowledge, and a different sport would
 * need a different list. Asserting every offered term appears in the registry's own language is how
 * that stays true as the module changes.
 */
function testEveryClarifiedTermComesFromTheWorkbook(): void {
    const workbookWords = new Set<string>()
    for (const goal of sessionPlanningModel.learningGoals()) {
        for (const source of [goal['Phase'], goal['Learning Goal']]) {
            for (const word of String(source ?? '').toLowerCase().split(/\W+/)) workbookWords.add(word)
        }
    }
    for (const entry of sessionPlanningModel.entryLanguage()) {
        for (const word of String(entry['Coach Phrase'] ?? '').toLowerCase().split(/\W+/)) workbookWords.add(word)
    }

    const clarifications = allClarifications()
    assert.ok(clarifications.length > 0, 'No clarifications derived at all — the derivation is broken.')

    for (const clarification of clarifications) {
        assert.ok(
            workbookWords.has(clarification.term),
            `"${clarification.term}" is offered as a broad term but appears nowhere in the workbook's own ` +
                `language. Sport vocabulary must not be authored in code.`
        )
        assert.ok(
            clarification.directions.length >= 2,
            `"${clarification.term}" was clarified but offers fewer than two directions — a question with ` +
                `one answer wastes the coach's time.`
        )
    }
}

function runAll(): void {
    testDeferredJudgmentTermsAreHandled()
    testDirectionsAreRealRegistryEntries()
    testPhaseTermsOfferTheWholePhase()
    testSpecificTermsDoNotClarify()
    testEveryClarifiedTermComesFromTheWorkbook()
    console.log('guided-clarification unit tests: all cases passed.')
}

runAll()
