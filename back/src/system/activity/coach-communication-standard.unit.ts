/**
 * The Coach Communication Standard, tested against CHRISTIAN'S OWN before/after examples.
 *
 * Appendix B of the standard gives four side-by-side pairs. He included them so the standard would
 * be "concrete rather than subjective" — which makes them the right fixtures: the test measures his
 * examples rather than my reading of his principles.
 *
 * Note what is NOT asserted. His "improved" versions are rewrites a person would make, and several
 * add information the engine does not have (metric dimensions, "+ GKs", "a central channel"). This
 * pass is deterministic text transformation, so it is judged on the part it owns: removing what the
 * standard forbids, without mangling what remains.
 */
import assert from 'node:assert/strict'

import { applyCoachCommunicationStandard, findCommunicationStandardViolations } from './coach-communication-standard'

/** Appendix B, Example 1 — Objective. */
function testSessionFocusAndCognitionLeaveTheObjective(): void {
    const current =
        'Secure possession and progress within the time constraint. Decide when to switch play or maintain possession based on time and space. Session focus: Maintain possession with forward intent.'
    const out = applyCoachCommunicationStandard(current)

    assert.ok(!/Session focus/i.test(out), `"Session focus:" survived: "${out}"`)
    assert.ok(out.includes('Secure possession and progress within the time constraint'), `lost the coaching intention: "${out}"`)
    assert.equal(findCommunicationStandardViolations(out).length, 0, `still violates the standard: "${out}"`)
}

/** Appendix B, Example 2 — Setup. "Teams aim to…" is purpose framing inside a setup description. */
function testPurposeFramingLeavesTheSetup(): void {
    const current =
        'Play 9v9 in a 40x30 yard area with two 20-yard end zones. Teams aim to maintain possession and progress towards the opposing end zone within a set time limit. Start with a kickoff from the center.'
    const out = applyCoachCommunicationStandard(current)

    assert.ok(!/Teams aim to/i.test(out), `"Teams aim to" survived: "${out}"`)
    // The environment must survive intact — it is the part a coach acts on.
    assert.ok(out.includes('Play 9v9 in a 40x30 yard area'), `lost the field organisation: "${out}"`)
    assert.ok(out.includes('Start with a kickoff from the center'), `lost the restart: "${out}"`)
}

/** Principle 4 — show the environment, not player cognition. His exact contrast. */
function testEnvironmentSurvivesAndCognitionDoesNot(): void {
    const out = applyCoachCommunicationStandard(
        'Play begins with the goalkeeper. Players decide when to secure possession.'
    )
    assert.ok(out.includes('Play begins with the goalkeeper'), `lost the environment: "${out}"`)
    assert.ok(!/Players decide/i.test(out), `player cognition survived: "${out}"`)
}

/** Removal is only half the job — the seam has to read as a sentence afterwards. */
function testRemovalLeavesCleanSentences(): void {
    const cases = [
        'Attack the end zone. Players choose when to travel forward. Restart from the goalkeeper.',
        'Teams aim to progress the ball. Play continues after every turnover.',
        'Players recognize the moment the picture changes.',
    ]
    for (const input of cases) {
        const out = applyCoachCommunicationStandard(input)
        assert.ok(!/\s[,;:]/.test(out), `orphaned punctuation: "${out}"`)
        assert.ok(!/[,;:—–-]$/.test(out), `line ends mid-thought: "${out}"`)
        if (out) assert.ok(/[.!?]$/.test(out), `no terminal punctuation: "${out}"`)
    }
}

/** A field that was ONLY forbidden framing becomes empty rather than a stub of punctuation. */
function testFieldOfPureFramingBecomesEmpty(): void {
    assert.equal(applyCoachCommunicationStandard('Session focus: Move ball into a target zone.'), '')
}

/** Idempotent: applying the standard twice must equal applying it once. */
function testIdempotent(): void {
    const input =
        'Teams aim to progress into the end zone. Players decide when to switch play. Restart with a goal kick. Session focus: Move ball into a target zone.'
    const once = applyCoachCommunicationStandard(input)
    assert.equal(applyCoachCommunicationStandard(once), once, 'second pass changed the text')
}

/**
 * REGRESSION — real generation, 2026-09-08. The blind-side manipulation's authored text reached a
 * coach as "…advantage created from the blind side counts more, so." The clause strip had cut the
 * sentence in half and left the conjunction standing. Authored knowledge truncated mid-thought by
 * the pass meant to clarify it is the worst possible failure for this module, so it is pinned here
 * with the exact authored string.
 */
function testStrippingNeverLeavesADanglingConjunction(): void {
    const authored =
        "Information out of a defender's view is the resource: advantage created from the blind side counts more, so players perceive defender orientation and exploit unseen space — many movements satisfy it."
    const out = applyCoachCommunicationStandard(authored)

    assert.ok(!/\bso\.?$/i.test(out), `sentence still ends on a conjunction: "${out}"`)
    assert.ok(out.includes('counts more'), `lost the authored consequence: "${out}"`)
    assert.ok(!/perceive/i.test(out), `cognition survived: "${out}"`)
    assert.ok(/[.!?]$/.test(out), `no terminal punctuation: "${out}"`)
}

/**
 * REGRESSION — real generation, 2026-09-08. "the team losing the ball decides whether to commit to
 * the press" is Christian's "Teams decide…" with a modifier wedged between subject and verb. The
 * first pattern required them adjacent, so this shipped.
 */
function testCognitionIsCaughtThroughAnInterveningModifier(): void {
    const out = applyCoachCommunicationStandard(
        'Live counter-press window creates a contested advantage on every possession change; the team losing the ball decides whether to commit to the press or recover shape; the team gaining the ball decides whether to exploit the disorganized pressure.'
    )
    assert.ok(!/decides/i.test(out), `modifier-separated cognition survived: "${out}"`)
    assert.ok(out.includes('Live counter-press window'), `lost the environment: "${out}"`)
}

/** The environment must survive when cognition is only PART of the sentence. */
function testPartialSentenceKeepsTheEnvironmentHalf(): void {
    const out = applyCoachCommunicationStandard('Play restarts from the end line and players decide when to travel.')
    assert.ok(out.includes('Play restarts from the end line'), `lost the environment: "${out}"`)
    assert.ok(!/\band\.?$/i.test(out), `left a dangling "and": "${out}"`)
}

/**
 * REGRESSION — real generation, 2026-09-08. Removing "the team losing the ball decides…" without
 * consuming the article left a Constraint section reading "…on every possession change; the the."
 */
function testStripDoesNotOrphanAnArticle(): void {
    const out = applyCoachCommunicationStandard(
        'Live counter-press window creates a contested advantage on every possession change; the team losing the ball decides whether to commit to the press or recover shape; the team gaining the ball decides whether to exploit the disorganized pressure or recirculate safely. Slow attacking progression.'
    )
    assert.ok(!/\bthe the\b/i.test(out), `orphaned article: "${out}"`)
    assert.ok(!/;\s*[.;]/.test(out), `orphaned semicolon: "${out}"`)
    assert.ok(out.includes('Live counter-press window'), `lost the environment: "${out}"`)
    assert.ok(out.includes('Slow attacking progression'), `lost a following sentence: "${out}"`)
}

/**
 * REGRESSION — real generation, 2026-09-08. Stripping the leading frame demoted the next word, and
 * a howToPlay bullet shipped as "progress through the central corridor to score in the small goals."
 */
function testSentenceCaseSurvivesFrameRemoval(): void {
    const out = applyCoachCommunicationStandard('Teams aim to progress through the central corridor to score.')
    assert.ok(/^[A-Z]/.test(out), `sentence starts lowercase: "${out}"`)
    assert.ok(out.startsWith('Progress through the central corridor'), `unexpected rewrite: "${out}"`)
}

/**
 * REGRESSION — real generation, 2026-09-08. Pinned to the authored support-lane design intent
 * verbatim (test-library/constraints.ts). Consuming the determiner but not the adjective before the
 * subject produced "the free the ball carrier adapts timing of the forward pass."
 */
function testStripHandlesAnAdjectiveBeforeTheSubject(): void {
    const authored =
        'Support lane requirement creates a visible spatial game problem; the free player decides when to enter the lane based on defensive coverage; the ball carrier adapts timing of the forward pass based on lane occupation and pressure.'
    const out = applyCoachCommunicationStandard(authored)

    assert.ok(!/the free the/i.test(out), `orphaned determiner and adjective: "${out}"`)
    assert.ok(!/decides/i.test(out), `cognition survived: "${out}"`)
    assert.ok(out.includes('the ball carrier adapts timing'), `lost the following clause: "${out}"`)
}

/**
 * REGRESSION — real generation, 2026-09-08. This Objective emptied the whole section, because the
 * only statement of the objective arrived wrapped in "Players decide to decide how to…". The frame
 * has to come off without taking the objective with it.
 */
function testObjectiveSurvivesItsCognitionFrame(): void {
    const out = applyCoachCommunicationStandard(
        'Players decide to decide how to maintain possession while progressing through the central corridor, using line-breaking passes to reach the end zone. Session focus: Maintain possession with forward intent.'
    )

    assert.ok(out.length > 0, 'the objective section was emptied')
    assert.ok(!/decide/i.test(out), `cognition frame survived: "${out}"`)
    assert.ok(!/Session focus/i.test(out), `"Session focus:" survived: "${out}"`)
    assert.ok(
        out.startsWith('Maintain possession while progressing through the central corridor'),
        `lost or mangled the objective: "${out}"`
    )
    assert.ok(out.includes('line-breaking passes to reach the end zone'), `lost the second half: "${out}"`)
}

/** "When to X" is a moment-of-choice, not an objective — Christian deletes it in Appendix B. */
function testBareDecisionImperativeIsDropped(): void {
    const out = applyCoachCommunicationStandard(
        'Use wide channels to advance the ball. Decide when to switch play based on channel availability.'
    )
    assert.ok(!/Decide when/i.test(out), `bare decision imperative survived: "${out}"`)
    assert.ok(out.includes('Use wide channels to advance the ball'), `lost the instruction: "${out}"`)
}

function testViolationsAreReportedForEvidence(): void {
    const found = findCommunicationStandardViolations(
        'Session focus: X. Teams aim to score. Players decide when. The opponent inherits the immediate attacking advantage.'
    )
    for (const expected of ['Session focus:', 'Teams aim to', 'immediate attacking advantage']) {
        assert.ok(found.includes(expected), `did not report "${expected}": ${JSON.stringify(found)}`)
    }
    assert.equal(findCommunicationStandardViolations('Play starts with the goalkeeper.').length, 0)
}

testSessionFocusAndCognitionLeaveTheObjective()
testPurposeFramingLeavesTheSetup()
testEnvironmentSurvivesAndCognitionDoesNot()
testRemovalLeavesCleanSentences()
testFieldOfPureFramingBecomesEmpty()
testIdempotent()
testStrippingNeverLeavesADanglingConjunction()
testCognitionIsCaughtThroughAnInterveningModifier()
testPartialSentenceKeepsTheEnvironmentHalf()
testStripDoesNotOrphanAnArticle()
testSentenceCaseSurvivesFrameRemoval()
testStripHandlesAnAdjectiveBeforeTheSubject()
testObjectiveSurvivesItsCognitionFrame()
testBareDecisionImperativeIsDropped()
testViolationsAreReportedForEvidence()

console.log('coach-communication-standard unit tests: all cases passed.')
