/**
 * Unit tests — rules in coach voice.
 *
 * The coverage tests are the point. Christian's rule text problem was never one bad sentence; it was
 * that engine wording reaches a coach by default, and every new game form or slot modifier is
 * another chance for it to. These walk the engine's own tables, so an untranslated rule fails the
 * build instead of reaching a coach.
 */
import assert from 'node:assert/strict'

import { DEFAULT_EXCHANGE_RULE, EXCHANGE_RULE_BY_ARCHETYPE } from './build-activity-mechanics'
import { COACH_RULE_VOICE_ENTRIES, toCoachRuleVoice } from './coach-rule-voice'
import { VALUE_LANDSCAPE_LIBRARY } from './slot-mechanics-variations'

/** Every game form's exchange rule — the first rule a coach reads — must have a translation. */
function testEveryExchangeRuleIsTranslated(): void {
    const untranslated: string[] = []
    for (const [archetype, rule] of Object.entries(EXCHANGE_RULE_BY_ARCHETYPE)) {
        if (toCoachRuleVoice(rule) === rule) untranslated.push(archetype)
    }
    assert.deepEqual(untranslated, [], `game forms whose exchange rule reaches a coach in engine voice: ${untranslated.join(', ')}`)
    assert.notEqual(toCoachRuleVoice(DEFAULT_EXCHANGE_RULE), DEFAULT_EXCHANGE_RULE, 'the fallback exchange rule has no translation')
}

/** Every rule-placement slot modifier must have one too. */
function testEveryRuleModifierIsTranslated(): void {
    const untranslated = VALUE_LANDSCAPE_LIBRARY.filter(
        (m) => m.placement === 'rule' && toCoachRuleVoice(m.mechanicLine) === m.mechanicLine
    ).map((m) => m.label)

    assert.deepEqual(untranslated, [], `slot modifiers with no coach voice: ${untranslated.join(', ')}`)
}

/** Christian's own example, verbatim on both sides. */
function testChristiansRegainExample(): void {
    const engine =
        'A regain completes only when followed by a connected forward action under opposition within the live transition window: possession won and immediately surrendered does not complete the regain, and the live advantage shifts back to the team that recovered the ball.'

    assert.equal(
        toCoachRuleVoice(engine),
        'A regain only counts if your team plays forward with the next action. Win it and give it straight back and it does not count.'
    )
}

/**
 * A translation must state the same mechanic, not a friendlier version of it. Where the engine names
 * a second outcome — what happens when the team fails the condition — the coach line names it too.
 */
function testBothOutcomesSurviveTranslation(): void {
    for (const { engine, coach } of COACH_RULE_VOICE_ENTRIES) {
        assert.ok(coach.trim().length > 0, `empty translation for "${engine}"`)
        // Nothing a coach cannot act on, and nothing the prescriptive check forbids.
        assert.ok(!/players must/i.test(coach), `translation uses forbidden phrasing: "${coach}"`)
        assert.ok(!/\b(?:representative|affordance|constraint landscape|value landscape)\b/i.test(coach), `engine vocabulary survived: "${coach}"`)
    }
}

/** A line that is already coach-facing passes straight through. */
function testUnknownLinesAreUntouched(): void {
    const line = 'Restart from the end line after a score.'
    assert.equal(toCoachRuleVoice(line), line)
}

/** Idempotent: translating a translation must not translate again. */
function testIdempotent(): void {
    for (const { engine } of COACH_RULE_VOICE_ENTRIES) {
        const once = toCoachRuleVoice(engine)
        assert.equal(toCoachRuleVoice(once), once, `translation of a translation changed: "${once}"`)
    }
}

testEveryExchangeRuleIsTranslated()
testEveryRuleModifierIsTranslated()
testChristiansRegainExample()
testBothOutcomesSurviveTranslation()
testUnknownLinesAreUntouched()
testIdempotent()

console.log('coach-rule-voice unit tests: all cases passed.')
