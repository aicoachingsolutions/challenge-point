/**
 * Unit tests — what emphasis a session actually runs, from the stored model to the prompt.
 *
 * Found 14 Sep, when Christian asked why two of three generated activities were near-identical. Each
 * layer's default was tested in isolation and each looked right, while the chain was wrong:
 * - the session schema filled 'applying' on every new session and on every stored session read
 *   without the field;
 * - the assembly prompt fell back to 'applying' on its own;
 * - only the slot directives and modifiers fell back to the differentiated 'discovering'.
 * So every live session ran the narrow profile the 14 Aug decision had taken away from unchosen
 * sessions. These tests start from the REAL model, the way a coach's session reaches the engine.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import Session, { SessionEmphasis } from '../../models/session.model'
import {
    getEmphasisVariationProfile,
    getSlotVariationSpec,
    resolveSessionEmphasis,
    sessionEmphasisPromptBlock,
} from './emphasis-variation-profile'
import { getSlotMechanicalVariations } from './slot-mechanics-variations'

const DISCOVERING = SessionEmphasis['Discovering Solutions']
const APPLYING = SessionEmphasis['Applying Solutions Under Pressure']

/** Every consumer of the emphasis, for one session value. */
function whatTheEngineRuns(emphasis: SessionEmphasis | undefined) {
    return {
        resolved: resolveSessionEmphasis(emphasis),
        profile: getEmphasisVariationProfile(emphasis).emphasis,
        slotDirectives: ([1, 2, 3] as const).map((i) => getSlotVariationSpec(emphasis, i).label),
        slotModifiers: ([1, 2, 3] as const).map((i) => getSlotMechanicalVariations(emphasis, i).map((m) => m.label)),
        prompt: sessionEmphasisPromptBlock(emphasis),
    }
}

function testASessionNobodyChoseForRunsTheDifferentiatedProfile(): void {
    const created = new Session({ name: 'created without an emphasis' })
    assert.equal(created.sessionEmphasis, undefined, 'the schema must not choose an emphasis for the coach')

    const stored = Session.hydrate({ _id: '64b000000000000000000002', name: 'stored before emphasis existed' })
    assert.equal(stored.sessionEmphasis, undefined, 'reading a stored session must not invent one either')

    const expected = whatTheEngineRuns(DISCOVERING)
    for (const session of [created, stored]) {
        const actual = whatTheEngineRuns(session.sessionEmphasis)
        assert.equal(actual.resolved, DISCOVERING)
        assert.equal(actual.profile, DISCOVERING)
        assert.deepEqual(actual.slotDirectives, expected.slotDirectives)
        assert.deepEqual(actual.slotModifiers, expected.slotModifiers)
        assert.equal(actual.prompt, expected.prompt, 'the prompt frame must agree with the slot directives')
    }
    assert.match(expected.prompt, /Session emphasis: Discovering solutions\./)
    assert.doesNotMatch(expected.prompt, /Coach selected/, 'nobody selected it')
}

function testAnExplicitChoiceIsHonouredEverywhere(): void {
    const chosen = new Session({ name: 'coach chose applying', sessionEmphasis: APPLYING })
    assert.equal(chosen.sessionEmphasis, APPLYING)
    const actual = whatTheEngineRuns(chosen.sessionEmphasis)
    const expected = whatTheEngineRuns(APPLYING)
    assert.equal(actual.resolved, APPLYING)
    assert.equal(actual.profile, APPLYING)
    assert.deepEqual(actual.slotDirectives, expected.slotDirectives)
    assert.match(actual.prompt, /Session emphasis: Applying solutions under pressure\./)
    // And the two profiles genuinely differ, or this test could pass on a single shared answer.
    assert.notDeepEqual(expected.slotDirectives, whatTheEngineRuns(DISCOVERING).slotDirectives)
}

function testAnUnrecognisedValueNeverNarrowsSilently(): void {
    for (const junk of ['', 'APPLYING', 'narrow', null, 42]) {
        assert.equal(resolveSessionEmphasis(junk), DISCOVERING, `"${String(junk)}" must not select a profile`)
    }
}

testASessionNobodyChoseForRunsTheDifferentiatedProfile()
testAnExplicitChoiceIsHonouredEverywhere()
testAnUnrecognisedValueNeverNarrowsSilently()

console.log('session-emphasis unit tests: all cases passed.')
