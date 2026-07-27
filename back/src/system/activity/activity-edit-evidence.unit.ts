/**
 * Unit tests — coach edit evidence.
 *
 * The behaviours that matter: a partial update must not read absent fields as deletions (the update
 * route accepts partial bodies, so a careless diff would report every unsent field as changed); a
 * no-op save must produce no evidence (otherwise the evidence stream fills with noise and stops
 * being useful); and the presentation / revalidation-trigger split must hold, because that flag is
 * the calibration data for Representative Validation.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { FIELD_CLASSIFICATION, diffActivityEdit } from './activity-edit-evidence'

const BEFORE = {
    title: 'Wide Zone Game',
    setup: 'Two teams in a 40x30 area with wide channels.',
    intent: 'Progress through wide areas under pressure.',
    constraint: 'Wide Zone Advantage; Central Density',
    rules: ['Restart quickly after a turnover.', 'Both teams attack the far line.'],
    scoringSystem: 'One point for reaching the far zone in control.',
    winCondition: 'Most points in twelve minutes.',
    scaffolding: ['Watch whether players find the wide lane.'],
    extensions: ['Add a third target.'],
}

/** A save that changes nothing must record nothing. */
function testNoOpProducesNoEvidence(): void {
    const ev = diffActivityEdit(BEFORE, { ...BEFORE })
    assert.deepEqual(ev.changedFields, [])
    assert.equal(ev.touchesRepresentativeStructure, false)
}

/** Whitespace-only differences are not edits. */
function testWhitespaceIsNotAnEdit(): void {
    const ev = diffActivityEdit(BEFORE, {
        title: '  Wide Zone Game  ',
        rules: ['Restart quickly after a turnover. ', ' Both teams attack the far line.'],
    })
    assert.deepEqual(ev.changedFields, [], 'Trimming differences must not count as edits.')
}

/**
 * A partial body must only report the fields it actually carries. The update route accepts partial
 * updates, so treating absent fields as cleared would mark almost every save as structural.
 */
function testPartialUpdateOnlyConsidersPresentFields(): void {
    const ev = diffActivityEdit(BEFORE, { title: 'Renamed Game' })
    assert.deepEqual(ev.changedFields, ['title'])
    assert.equal(ev.touchesRepresentativeStructure, false, 'A title change is presentation only.')
}

function testPresentationEditsAreNotStructural(): void {
    const ev = diffActivityEdit(BEFORE, {
        title: 'New Name',
        scaffolding: ['Notice how quickly the shape recovers.'],
    })
    assert.deepEqual(ev.changedFields.sort(), ['scaffolding', 'title'])
    assert.deepEqual(ev.revalidationTriggerFields, [])
    assert.equal(ev.touchesRepresentativeStructure, false)
}

/** Scoring is the canonical structural edit — RV's Coach Communication Contract names it directly. */
function testScoringEditIsStructural(): void {
    const ev = diffActivityEdit(BEFORE, { scoringSystem: 'Three points for any goal, no zone required.' })
    assert.deepEqual(ev.changedFields, ['scoringSystem'])
    assert.deepEqual(ev.revalidationTriggerFields, ['scoringSystem'])
    assert.ok(ev.touchesRepresentativeStructure)
}

function testMixedEditReportsBothButFlagsStructural(): void {
    const ev = diffActivityEdit(BEFORE, {
        title: 'Renamed',
        rules: ['Restart quickly after a turnover.', 'Attackers must complete three passes first.'],
    })
    assert.deepEqual(ev.changedFields.sort(), ['rules', 'title'])
    assert.deepEqual(ev.revalidationTriggerFields, ['rules'])
    assert.ok(ev.touchesRepresentativeStructure, 'A structural edit alongside a cosmetic one still flags.')
}

/** Extensions are progressions — RVD-06H treats progression drift as identity-changing, not cosmetic. */
function testExtensionsCountAsStructural(): void {
    const ev = diffActivityEdit(BEFORE, { extensions: ['Remove the target and play to a line.'] })
    assert.deepEqual(ev.revalidationTriggerFields, ['extensions'])
}

/** Every editable field must carry a classification — an unclassified field would silently pass. */
function testEveryFieldIsClassified(): void {
    for (const [field, classification] of Object.entries(FIELD_CLASSIFICATION)) {
        assert.ok(
            classification === 'presentation' || classification === 'revalidation-trigger',
            `Field ${field} has no valid classification.`
        )
    }
    // Guard against a field being added to the activity without a classification decision.
    assert.equal(Object.keys(FIELD_CLASSIFICATION).length, 9, 'Field count changed — classify the new field.')
}

/** Missing/blank prior values must not crash, and must count as a change when filled in. */
function testToleratesMissingPriorValues(): void {
    const ev = diffActivityEdit({}, { scoringSystem: 'One point per goal.' })
    assert.deepEqual(ev.changedFields, ['scoringSystem'])
    assert.ok(ev.touchesRepresentativeStructure)
}

function runAll(): void {
    testNoOpProducesNoEvidence()
    testWhitespaceIsNotAnEdit()
    testPartialUpdateOnlyConsidersPresentFields()
    testPresentationEditsAreNotStructural()
    testScoringEditIsStructural()
    testMixedEditReportsBothButFlagsStructural()
    testExtensionsCountAsStructural()
    testEveryFieldIsClassified()
    testToleratesMissingPriorValues()
    console.log('activity-edit-evidence unit tests: all cases passed.')
}

runAll()
