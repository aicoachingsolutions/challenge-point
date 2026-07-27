/**
 * Unit tests — coach guidance for unresolved / broadly-resolved goals.
 *
 * The important test here is `testEveryExampleGoalActuallyResolves`. We suggest concrete goals to
 * a coach whose input we just rejected; if any suggestion no longer parses, that coach types it,
 * gets rejected a second time, and stops trusting the tool. Pinning the copy against the real
 * parser means a future vocabulary change breaks the build instead.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { findNeverDisplayViolations } from './coach-language'
import { EXAMPLE_GOALS, buildResolutionNotice, buildUnsupportedGoalGuidance } from './coach-guidance'

/**
 * Every suggested goal must resolve to at least one signal group, and NOT merely to the
 * general-soccer fallback — a suggestion that only lands on Z_soccer_general would send the coach
 * straight back to the broad-reading notice we are trying to help them escape.
 */
function testEveryExampleGoalActuallyResolves(): void {
    for (const goal of EXAMPLE_GOALS) {
        const derived = deriveInputConstraints(goal)
        assert.ok(
            derived.matchedSignals.length > 0,
            `Suggested goal "${goal}" no longer resolves — a coach following this advice would be rejected twice.`
        )
        const specific = derived.matchedSignals.filter((s) => s !== 'Z_soccer_general')
        assert.ok(
            specific.length > 0,
            `Suggested goal "${goal}" only matched the general-soccer fallback; it must resolve specifically.`
        )
    }
}

/** Guidance is coach-facing text, so the never-display contract applies to it too. */
function testGuidanceUsesNoInternalVocabulary(): void {
    const texts = [
        buildUnsupportedGoalGuidance().message,
        ...buildUnsupportedGoalGuidance().suggestions,
        buildResolutionNotice('fallback')?.message ?? '',
        buildResolutionNotice('unresolved')?.message ?? '',
    ]
    for (const text of texts) {
        assert.deepEqual(findNeverDisplayViolations(text), [], `Coach guidance leaks internal vocabulary: "${text}"`)
    }
}

/** Quiet Assistance: a confident match must produce no notice at all. */
function testMatchedProducesNoNotice(): void {
    assert.equal(buildResolutionNotice('matched'), null, 'A confident match must stay silent.')
}

function testNonMatchedProducesNotice(): void {
    for (const status of ['fallback', 'unresolved'] as const) {
        const notice = buildResolutionNotice(status)
        assert.ok(notice, `${status} must produce a notice.`)
        assert.ok(notice.message.length > 0)
        assert.ok(notice.suggestions.length > 0, 'A notice without a next step is just an apology.')
    }
}

/**
 * The unsupported-goal message must not read as correction. We check the two concrete ways that
 * happens: telling the coach what they did wrong, and echoing their rejected words back at them.
 */
function testUnsupportedMessageDoesNotBlameTheCoach(): void {
    const { message, suggestions } = buildUnsupportedGoalGuidance()
    const blaming = /\byou (?:did|must|need to|should|failed)\b|\binvalid\b|\bunsupported\b|\berror\b|\bnot allowed\b/i
    assert.ok(!blaming.test(message), `Unsupported-goal message reads as blame: "${message}"`)
    assert.ok(suggestions.length > 0, 'A rejection without concrete alternatives is a dead end.')
}

function runAll(): void {
    testEveryExampleGoalActuallyResolves()
    testGuidanceUsesNoInternalVocabulary()
    testMatchedProducesNoNotice()
    testNonMatchedProducesNotice()
    testUnsupportedMessageDoesNotBlameTheCoach()
    console.log('coach-guidance unit tests: all cases passed.')
}

runAll()
