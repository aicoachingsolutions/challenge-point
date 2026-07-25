/**
 * Unit tests — Coach Language layer (Coach Vocabulary & Translation Dictionary RC1).
 *
 * Pins the parts of the dictionary that are mechanically checkable:
 *   - §9 Never Display list is detected wholesale, and detection is whole-word (no false
 *     positives on ordinary coaching prose);
 *   - §6 library names never survive translation;
 *   - §7 prompt vocabulary — avoided openers become preferred observation openers;
 *   - the Round-9 decision-stutter category rule still holds;
 *   - translation is idempotent, because compressActivityForCoach's idempotency invariant
 *     depends on it.
 *
 * The last one matters most: if translation is not idempotent, re-rendering an activity quietly
 * changes what the coach sees.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import {
    NEVER_DISPLAY_TERMS,
    collapseDecisionStutter,
    findNeverDisplayViolations,
    translateCoachLanguage,
} from './coach-language'

/** Every never-display term must actually be detected when it appears in a sentence. */
function testEveryNeverDisplayTermIsDetected(): void {
    for (const term of NEVER_DISPLAY_TERMS) {
        const sentence = `Coaches should watch the ${term} during play.`
        const found = findNeverDisplayViolations(sentence)
        assert.ok(found.includes(term), `"${term}" must be detected in coach-facing text.`)
    }
}

/**
 * Whole-word matching. "Affordance" is banned; ordinary coaching words that merely contain a
 * banned term as a substring are not. Without this, the guardrail would fire constantly and get
 * switched off — which is how guardrails die.
 */
function testNeverDisplayDoesNotFalsePositive(): void {
    const clean = [
        'Players keep the ball under pressure and attack the space.',
        'Watch whether the defenders stay compact as the ball travels.',
        'Reorganize the back line after the turnover.', // contains "organi" but not self-organization
        'Give players another cue about where the space opens.',
    ]
    for (const line of clean) {
        assert.deepEqual(findNeverDisplayViolations(line), [], `False positive on: ${line}`)
    }
}

function testEmptyInputIsSafe(): void {
    assert.deepEqual(findNeverDisplayViolations(''), [])
    assert.deepEqual(findNeverDisplayViolations(undefined as unknown as string), [])
    assert.equal(translateCoachLanguage(undefined as unknown as string), '')
}

/** §6 — internal library names must never survive into coach-facing text. */
function testLibraryNamesTranslated(): void {
    const cases: Array<[string, string]> = [
        ['Apply the Environmental Manipulation before the second round.', 'change to the setup'],
        ['This Interaction Regulation shapes the contest.', 'condition'],
        ['Information Design drives the reveal.', 'what players need to notice'],
    ]
    for (const [input, expectedFragment] of cases) {
        const out = translateCoachLanguage(input)
        assert.ok(out.includes(expectedFragment), `"${input}" → expected to contain "${expectedFragment}", got "${out}"`)
        assert.deepEqual(
            findNeverDisplayViolations(out),
            [],
            `Translation of "${input}" still leaks a never-display term: "${out}"`
        )
    }
}

/** §9 ontology terms that have a safe coach equivalent get replaced, not merely flagged. */
function testOntologyTermsTranslated(): void {
    assert.ok(translateCoachLanguage('Secure the functional object.').includes('ball'))
    assert.ok(translateCoachLanguage('Create a competitive interaction opportunity.').includes('contest'))
    assert.ok(translateCoachLanguage('Use representative information to decide.').includes('game information'))
}

/** §7 — avoided openers become preferred observation openers, keeping the prompt's content. */
function testPromptOpenersRewritten(): void {
    const cases: Array<[string, string]> = [
        ['Evaluate whether players find the wide channel.', 'Watch whether'],
        ['Assess how players respond to pressure.', 'Notice how'],
        ['Ensure that players keep the ball moving.', 'Watch whether'],
        ['Ensure players keep the ball moving.', 'Watch whether'],
        ['Optimize the spacing between units.', 'Notice'],
    ]
    for (const [input, expectedOpener] of cases) {
        const out = translateCoachLanguage(input)
        assert.ok(out.startsWith(expectedOpener), `"${input}" → expected to start with "${expectedOpener}", got "${out}"`)
    }
}

/**
 * The rewritten prompt must remain grammatical, not merely start with an approved word. An earlier
 * cut produced "Look for players keep the ball moving" — approved opener, broken English. Coaches
 * read these on a sideline; a mangled sentence is worse than the jargon it replaced.
 */
function testRewrittenPromptsAreGrammatical(): void {
    const cases: Array<[string, string]> = [
        ['Ensure that players keep the ball moving.', 'Watch whether players keep the ball moving.'],
        ['Ensure players keep the ball moving.', 'Watch whether players keep the ball moving.'],
        ['Assess how players respond to pressure.', 'Notice how players respond to pressure.'],
        ['Evaluate whether players find the wide channel.', 'Watch whether players find the wide channel.'],
        ['Optimize the spacing between units.', 'Notice the spacing between units.'],
    ]
    for (const [input, expected] of cases) {
        assert.equal(translateCoachLanguage(input), expected, `Rewrite of "${input}" reads badly.`)
    }
}

/** Ordinary prompts that already use preferred openers must pass through untouched. */
function testPreferredOpenersUntouched(): void {
    const good = [
        'Watch whether players recognize the open lane.',
        'Notice how quickly the shape recovers.',
        'Look for players attacking the space early.',
        'Pay attention to the first touch under pressure.',
    ]
    for (const line of good) {
        assert.equal(translateCoachLanguage(line), line, `Preferred opener was altered: ${line}`)
    }
}

/** Round-9 category rule: chained decision verbs collapse to the second, more specific verb. */
function testDecisionStutterCollapse(): void {
    assert.equal(collapseDecisionStutter('players decide to decide when to go'), 'players decide when to go')
    assert.equal(collapseDecisionStutter('players decide to choose a route'), 'players choose a route')
    assert.equal(collapseDecisionStutter('players deciding to select the pass'), 'players select the pass')
    // A single decision verb is not a stutter and must survive.
    assert.equal(collapseDecisionStutter('players decide when to travel'), 'players decide when to travel')
}

/** Engine framing removed by §5/§6 rules must not leave doubled spaces or orphaned punctuation. */
function testNoWhitespaceOrPunctuationArtifacts(): void {
    const out = translateCoachLanguage('Maintain possession under pressure as a live game condition.')
    assert.ok(!/\s{2,}/.test(out), `Doubled whitespace left behind: "${out}"`)
    assert.ok(!/\s[.,;]/.test(out), `Orphaned punctuation left behind: "${out}"`)
    assert.ok(!/([.,;])\1/.test(out), `Doubled punctuation left behind: "${out}"`)
}

/**
 * Idempotency. compressActivityForCoach guarantees compress(compress(x)) === compress(x), and it
 * calls this on every coach-facing field — so a non-idempotent rule here would silently break that
 * invariant and make repeated renders disagree.
 */
function testIdempotent(): void {
    const samples = [
        'Apply the Environmental Manipulation and watch the contest.',
        'Evaluate whether players decide to choose the wide option.',
        'Secure the functional object under pressure as a live game condition.',
        'Award bonus points when players use the listed constraints successfully.',
        'Watch whether players attack the space.',
    ]
    for (const s of samples) {
        const once = translateCoachLanguage(s)
        const twice = translateCoachLanguage(once)
        assert.equal(twice, once, `Not idempotent for: "${s}"\n  once:  "${once}"\n  twice: "${twice}"`)
    }
}

function runAll(): void {
    testEveryNeverDisplayTermIsDetected()
    testNeverDisplayDoesNotFalsePositive()
    testEmptyInputIsSafe()
    testLibraryNamesTranslated()
    testOntologyTermsTranslated()
    testPromptOpenersRewritten()
    testPreferredOpenersUntouched()
    testDecisionStutterCollapse()
    testNoWhitespaceOrPunctuationArtifacts()
    testIdempotent()
    console.log('coach-language unit tests: all cases passed.')
}

runAll()
