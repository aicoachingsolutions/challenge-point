/**
 * Phase 4A unit tests — compressActivityForCoach must not silently break the things
 * Christian's directive said to preserve:
 *
 *   - rules[0] (the explicit exchange rule) survives in position 0
 *   - any slot-modifier text survives the cap
 *   - guardrail closing line and "Players read/decide/choose" narration get stripped
 *     from scoring and rules
 *   - the function is idempotent
 *   - caps are respected (rules <= 5, scoring sentences <= 4, coachingFocus <= 3)
 *
 * If any of these fail, Phase 4A has regressed and we ship a coach-facing output that
 * either still leaks scaffolding (bad UX) or has compressed away mechanics that should
 * have survived (bad ecology).
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import type { IActivity } from '../../models/activity.model'
import { compressActivityForCoach, splitSentences } from './compress-activity-output'

function baseActivity(overrides: Partial<IActivity> = {}): IActivity {
    const defaults: IActivity = {
        _id: 't',
        session: undefined as any,
        title: 'Test',
        constraint: 'package summary',
        intent: 'objective text',
        setup: 'field setup',
        extensions: ['teams'],
        scaffolding: [],
        playerGroupSizes: 10,
        equipmentNeeded: ['cones'],
        rules: [],
        scoringSystem: '',
        winCondition: '',
        createdAt: new Date(),
        updatedAt: new Date(),
    }
    return { ...defaults, ...overrides }
}

const EXCHANGE_RULE =
    'Wide and central channels remain active throughout play and may be used to progress forward. A channel entry keeps play live, and a forced entry or turnover opens the opposite channel for the opponent with no reset.'

function testRulesCapAt5(): void {
    const rules = [
        EXCHANGE_RULE,
        'Directional target or progression toward a defined goal.',
        'Maintain possession under pressure as a live game condition.',
        'Support options and spacing shape available passes.',
        'Two-sided contest: when possession progresses, play continues live.',
        'Score awarded for passes that break a defensive line.',
        'Attackers use available space before pressure recovers.',
        'Score awarded for line-breaking attempts that read defensive shape.',
        'A point counts only when possession is maintained under pressure.',
        'Possession kept under pressure is scored when retention is the contest.',
    ]
    const activity = baseActivity({ rules })
    const out = compressActivityForCoach(activity, [])
    assert.ok(
        (out.rules ?? []).length <= 5,
        `Expected rules.length <= 5; got ${(out.rules ?? []).length}: ${JSON.stringify(out.rules)}`
    )
}

function testScoringCapAt4Sentences(): void {
    const sentences = [
        'A point counts only when possession is maintained under pressure.',
        'Possession kept under live pressure is scored when retention is the contest.',
        'Score awarded for passes that break a defensive line.',
        'Players choose whether to attack through, around, or away from pressure.',
        'Score awarded for attacks that use open space.',
        'A bonus counts when the team progresses possession toward the target.',
        'Score awarded only when possession is maintained under live opposition.',
        'Defenders score when they slow forward options.',
        'Defenders use shielding to shape attacker responses.',
        'If the live opportunity is forced after it closes, the opponent inherits the connected advantage immediately.',
    ]
    const activity = baseActivity({ scoringSystem: sentences.join(' ') })
    const out = compressActivityForCoach(activity, [])
    const outSentences = splitSentences(out.scoringSystem ?? '')
    assert.ok(
        outSentences.length <= 4,
        `Expected scoring sentence count <= 4; got ${outSentences.length}: ${JSON.stringify(outSentences)}`
    )
}

function testCoachingFocusCapAt3(): void {
    const scaffolding = [
        'Watch for spacing relationships.',
        'Read pressure timing.',
        'Look for connected forward actions.',
        'Notice transition recovery.',
        'Observe support distance.',
        'Observe how decisions chain.',
    ]
    const activity = baseActivity({ scaffolding })
    const out = compressActivityForCoach(activity, [])
    assert.ok(
        (out.scaffolding ?? []).length <= 3,
        `Expected scaffolding.length <= 3; got ${(out.scaffolding ?? []).length}`
    )
}

function testSlotModifierPreserved(): void {
    const modifierLine =
        'Score is weighted by where possession changes hands: regains in a forward zone count higher than regains in a defensive zone, and the same weighting applies in every live contest.'
    const sentences = [
        'A point counts only when possession is maintained under pressure.',
        'Possession kept under live pressure is scored when retention is the contest.',
        'Score awarded for passes that break a defensive line.',
        'Attackers use open space before pressure recovers.',
        'A bonus counts when the team progresses possession toward the target.',
        'Score awarded for line-breaking attempts under opposition.',
        'Defenders score when they slow forward options.',
        modifierLine,
    ]
    const activity = baseActivity({ scoringSystem: sentences.join(' ') })
    const out = compressActivityForCoach(activity, [modifierLine])
    const outScoring = out.scoringSystem ?? ''
    // Token-overlap check — modifier text may be paraphrased upstream but must still
    // share most distinctive tokens. Here we just verify the literal sentence survived.
    assert.ok(
        outScoring.includes('weighted by where possession changes hands') ||
            outScoring.includes('regains in a forward zone count higher'),
        `Modifier text did not survive the cap. Got: ${outScoring}`
    )
}

function testExchangeRuleSurvivesAsRule0(): void {
    const rules = [
        EXCHANGE_RULE,
        'Directional target or progression toward a defined goal.',
        'Maintain possession under pressure as a live game condition.',
        'Support options and spacing shape available passes.',
        'Two-sided contest: when possession progresses, play continues live.',
        'Score awarded for passes that break a defensive line.',
        'Attackers use available space before pressure recovers.',
        'A point counts only when possession is maintained.',
    ]
    const activity = baseActivity({ rules })
    const out = compressActivityForCoach(activity, [])
    assert.ok(
        (out.rules ?? [])[0]?.startsWith('Wide and central channels remain active throughout play'),
        `Exchange rule must remain in rules[0] after compression; got: ${out.rules?.[0]}`
    )
}

function testCrossSectionEnvironmentalDedup(): void {
    const repeatedRule =
        'Wide channels remain active and may be used to progress into the target zone after every possession change.'
    const repeatedScoring =
        'Wide channels remain active and may be used to progress into the target zone after every possession change.'
    const modifierLine =
        'Score is weighted by where possession changes hands: regains in a forward zone count higher than regains in a defensive zone, and the same weighting applies in every live contest.'
    const activity = baseActivity({
        rules: [EXCHANGE_RULE, repeatedRule, modifierLine],
        scoringSystem: [
            'A point counts only when possession is maintained under pressure.',
            repeatedScoring,
            modifierLine,
        ].join(' '),
        winCondition:
            'Wide channels remain active and may be used to progress into the target zone after every possession change. Team with most points wins.',
    })
    const out = compressActivityForCoach(activity, [modifierLine])
    assert.ok(
        !(out.rules ?? []).includes(repeatedRule),
        `Repeated environmental rule should defer to winCondition; got: ${JSON.stringify(out.rules)}`
    )
    assert.ok(
        !(out.scoringSystem ?? '').includes(repeatedScoring),
        `Repeated environmental scoring should defer to winCondition/rules; got: ${out.scoringSystem}`
    )
    assert.ok((out.rules ?? []).includes(modifierLine), 'Modifier rule must survive cross-section dedup')
    assert.ok((out.scoringSystem ?? '').includes('weighted by where possession changes hands'), 'Modifier scoring must survive cross-section dedup')
}

function testGuardrailClosingLineStrippedFromScoring(): void {
    const sentences = [
        'A point counts only when possession is maintained under pressure.',
        'Score awarded for passes that break a defensive line.',
        'If the live opportunity is forced after it closes, the opponent inherits the connected advantage immediately.',
    ]
    const activity = baseActivity({
        scoringSystem: sentences.join(' '),
        winCondition:
            'Teams compete live under two-sided opposition. A point counts when possession is maintained. The opponent inherits the connected advantage on every misread or forced action under pressure.',
    })
    const out = compressActivityForCoach(activity, [])
    assert.ok(
        !(out.scoringSystem ?? '').includes('If the live opportunity is forced after it closes'),
        `Guardrail closing line must be stripped from scoring; got: ${out.scoringSystem}`
    )
}

function testPlayerReadNarrationStripped(): void {
    const sentences = [
        'A point counts only when possession is maintained under pressure.',
        'Players read spacing, width, and depth before choosing the next action.',
        'Players decide whether to secure possession or progress forward.',
        'Players choose whether to attack through, around, or away from pressure.',
        'Score awarded for passes that break a defensive line.',
    ]
    const rules = [
        EXCHANGE_RULE,
        'Maintain possession under pressure.',
        'Players read pressure cues before committing to forward actions.',
        'Players decide whether to advance or hold based on the live picture.',
    ]
    const activity = baseActivity({ scoringSystem: sentences.join(' '), rules })
    const out = compressActivityForCoach(activity, [])
    const scoringOut = out.scoringSystem ?? ''
    const rulesOutText = (out.rules ?? []).join(' ')
    assert.ok(!/\bPlayers read\b/i.test(scoringOut), `"Players read" must be stripped from scoring; got: ${scoringOut}`)
    assert.ok(!/\bPlayers decide\b/i.test(scoringOut), `"Players decide" must be stripped from scoring; got: ${scoringOut}`)
    assert.ok(!/\bPlayers choose\b/i.test(scoringOut), `"Players choose" must be stripped from scoring; got: ${scoringOut}`)
    assert.ok(!/\bPlayers read\b/i.test(rulesOutText), `"Players read" must be stripped from rules; got: ${rulesOutText}`)
    assert.ok(!/\bPlayers decide\b/i.test(rulesOutText), `"Players decide" must be stripped from rules; got: ${rulesOutText}`)
}

function testEmDashRecoveryAfterStrip(): void {
    // Simulate the production case: two scoring clauses originally separated by a
    // "Players decide" sentence which gets stripped, leaving a dangling em-dash.
    const sentences = [
        'A point counts only when the team progresses into the target zone.',
        'Score awarded for attacks that use available space to gain advantage — Players decide to progress into the open space before defensive pressure recovers, or the chance is lost. Score awarded for passes or runs that break or bypass a defensive line.',
    ]
    const activity = baseActivity({ scoringSystem: sentences.join(' ') })
    const out = compressActivityForCoach(activity, [])
    const scoringOut = out.scoringSystem ?? ''
    assert.ok(
        !/ — Score awarded/i.test(scoringOut),
        `Em-dash followed by "Score awarded" should have been promoted to a sentence break; got: ${scoringOut}`
    )
}

function testDecisionStutterCollapsed(): void {
    // Round 9 (Christian): "Players decide to decide..." / "Players decide to choose..." artifacts —
    // upstream must-decide rewrites composing with AI phrasing. Category rule: chained decision verbs
    // collapse to the second, more specific verb.
    const activity = baseActivity({
        setup: 'Attackers decide to choose the moment to release the ball into the wide zone.',
        rules: [EXCHANGE_RULE, 'On the regain, the winning team decides to decide when to break forward.'],
        scoringSystem:
            'A goal counts double when the scorer chooses to select the far post option under live pressure.',
    })
    const out = compressActivityForCoach(activity, [])
    const all = [out.setup ?? '', (out.rules ?? []).join(' '), out.scoringSystem ?? ''].join(' ')
    assert.ok(!/decide[s]?\s+to\s+decide/i.test(all), `"decide to decide" must collapse; got: ${all}`)
    assert.ok(!/decide[s]?\s+to\s+choose/i.test(all), `"decide to choose" must collapse; got: ${all}`)
    assert.ok(!/choose[s]?\s+to\s+select/i.test(all), `"chooses to select" must collapse; got: ${all}`)
}

function testStutterCollapsedInIntentConstraintExtensions(): void {
    // Round-9 verification: the stutter survived in fields the spread passed through untranslated.
    const activity = baseActivity({
        intent: 'Players decide to decide when to release the ball forward.',
        constraint: 'Attackers deciding to choose the wide option keep the advantage.',
        extensions: ['Progress only after players decide to select the open gate.'],
    })
    const out = compressActivityForCoach(activity, [])
    const all = [out.intent ?? '', out.constraint ?? '', (out.extensions ?? []).join(' ')].join(' ')
    assert.ok(!/decid(?:e|es|ing)\s+to\s+(?:decide|choose|select)/i.test(all), `stutter must collapse in intent/constraint/extensions; got: ${all}`)
}

function testIdempotent(): void {
    const activity = baseActivity({
        rules: [
            EXCHANGE_RULE,
            'Directional target or progression toward a defined goal.',
            'Maintain possession under pressure as a live game condition.',
            'Support options and spacing shape available passes.',
            'Two-sided contest: when possession progresses, play continues live.',
            'Score awarded for passes that break a defensive line.',
            'A point counts only when possession is maintained.',
        ],
        scoringSystem:
            'A point counts only when possession is maintained under pressure. Players read spacing before choosing the next action. Score awarded for passes that break a defensive line. If the live opportunity is forced after it closes, the opponent inherits the connected advantage immediately.',
        scaffolding: ['Watch for spacing.', 'Read pressure timing.', 'Look for forward actions.', 'Notice recovery.'],
        winCondition:
            'Teams compete live under two-sided opposition. A point counts when possession is maintained. The opponent inherits the connected advantage on every misread or forced action under pressure.',
    })
    const once = compressActivityForCoach(activity, [])
    const twice = compressActivityForCoach(once, [])
    assert.deepEqual(twice.rules, once.rules, 'rules should be idempotent under compression')
    assert.equal(twice.scoringSystem, once.scoringSystem, 'scoringSystem should be idempotent under compression')
    assert.deepEqual(twice.scaffolding, once.scaffolding, 'scaffolding should be idempotent under compression')
    assert.equal(twice.winCondition, once.winCondition, 'winCondition should be idempotent under compression')
}

function runAll(): void {
    testRulesCapAt5()
    testScoringCapAt4Sentences()
    testCoachingFocusCapAt3()
    testSlotModifierPreserved()
    testExchangeRuleSurvivesAsRule0()
    testCrossSectionEnvironmentalDedup()
    testGuardrailClosingLineStrippedFromScoring()
    testPlayerReadNarrationStripped()
    testEmDashRecoveryAfterStrip()
    testDecisionStutterCollapsed()
    testStutterCollapsedInIntentConstraintExtensions()
    testIdempotent()
    console.log('compress-activity-output unit tests: all cases passed.')
}

runAll()
