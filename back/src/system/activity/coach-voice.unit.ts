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
import {
    COACH_RULE_VOICE_ENTRIES,
    COACH_SCORING_VOICE_ENTRIES,
    toCoachRuleVoice,
    toCoachScoringSentence,
} from './coach-voice'
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

/** Every scoring-placement slot modifier must have a translation too. */
function testEveryScoringModifierIsTranslated(): void {
    const untranslated = VALUE_LANDSCAPE_LIBRARY.filter(
        (m) => m.placement === 'scoring' && toCoachScoringSentence(m.mechanicLine) === m.mechanicLine
    ).map((m) => m.label)

    assert.deepEqual(untranslated, [], `scoring modifiers with no coach voice: ${untranslated.join(', ')}`)
}

/**
 * The engine's scoring templates, from build-activity-skeleton's affordance families. Pinned as
 * literals because that function picks one by matching the affordance's own text, so there is no
 * table to walk — if one is reworded upstream, this test is what notices.
 */
function testAffordanceScoringTemplatesAreTranslated(): void {
    const templates = [
        'Score awarded only when possession is maintained or secured under live opponent pressure; losing the ball once the space closes hands the connected advantage to the opponent.',
        'Score awarded for plays that visibly create or open space for a teammate — stretching, unbalancing, or pulling defenders out of position so a teammate has a free option.',
        'Score awarded for attacks that use available space to gain advantage — players must progress into the open space before defensive pressure recovers, or the chance is lost.',
        'Score awarded for passes or runs that break or bypass a defensive line; line-breaking attempts that are read and intercepted hand the advantage to the opponent on the regain.',
        'Score awarded for winning the ball back or forcing a turnover; the regain moment immediately switches roles between attackers and defenders, and the new attackers play live.',
        'Score awarded for quick attacking action immediately after winning possession; the transition window stays live only until the defensive shape recovers, after which the advantage dissipates.',
        'Score awarded when players visibly engage with the "Support Angles" problem in live play — not when they recite or label the affordance.',
    ]

    for (const template of templates) {
        assert.notEqual(toCoachScoringSentence(template), template, `no coach voice for: "${template.slice(0, 60)}…"`)
    }
}

/**
 * REGRESSION — the shape that actually arrives. By the time scoring reaches this pass,
 * `toCoachScoringVoice` has already rewritten "Score awarded for…" to "Earn a point for…", so
 * fragments anchored on the engine's opening matched nothing: the primary condition reached a coach
 * untranslated while the slot incentive next to it was in coach voice. Both forms must translate.
 */
function testTranslatesTheRewrittenPrefixToo(): void {
    const asItArrives =
        'Earn a point for passes or runs that break or bypass a defensive line; line-breaking attempts that are read and intercepted hand the advantage to the opponent on the regain.'
    const asAuthored =
        'Score awarded for passes or runs that break or bypass a defensive line; line-breaking attempts that are read and intercepted hand the advantage to the opponent on the regain.'

    assert.equal(toCoachScoringSentence(asItArrives), toCoachScoringSentence(asAuthored))
    assert.notEqual(toCoachScoringSentence(asItArrives), asItArrives, 'the arriving form was not translated')
    assert.equal(
        toCoachScoringSentence(asItArrives),
        'Earn a point for a pass or run that beats a defensive line. Get it intercepted and the other team has the advantage.'
    )
}

/**
 * One engine template runs to two sentences, and Scoring is split into sentences before this pass.
 * Its second half must not survive alone beside the coach line that already replaced it.
 */
function testTheTailOfATranslatedTemplateIsDropped(): void {
    assert.equal(toCoachScoringSentence('The zone weighting stays the same in every live contest.'), '')
    assert.equal(
        toCoachScoringSentence('The field is treated as three value zones: points earned in the central zone count higher.'),
        'Points are worth most through the middle, then wide, then deep.'
    )
}

/** A scoring line that already reads as coach language is left alone. */
function testCoachScoringLinesAreUntouched(): void {
    const line = 'Earn a point for reaching the end zone with the ball.'
    assert.equal(toCoachScoringSentence(line), line)
}

/** Scoring translations answer Scoring's question and carry no engine vocabulary. */
function testScoringTranslationsStayInVoice(): void {
    for (const { engine, coach } of COACH_SCORING_VOICE_ENTRIES) {
        assert.ok(coach.trim().length > 0, `empty translation for "${engine}"`)
        assert.ok(!/players must/i.test(coach), `forbidden phrasing: "${coach}"`)
        assert.ok(
            !/\b(?:representative|affordance|value structure|live contest|dissipates)\b/i.test(coach),
            `engine vocabulary survived: "${coach}"`
        )
    }
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
testEveryScoringModifierIsTranslated()
testAffordanceScoringTemplatesAreTranslated()
testTranslatesTheRewrittenPrefixToo()
testTheTailOfATranslatedTemplateIsDropped()
testCoachScoringLinesAreUntouched()
testScoringTranslationsStayInVoice()
testChristiansRegainExample()
testBothOutcomesSurviveTranslation()
testUnknownLinesAreUntouched()
testIdempotent()

console.log('coach-voice unit tests: all cases passed.')
