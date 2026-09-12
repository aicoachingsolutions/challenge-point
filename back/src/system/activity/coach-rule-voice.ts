/**
 * RULES IN COACH VOICE.
 *
 * Christian, 2026-09-11, on the engine's rule text: "Could I imagine saying this while setting up
 * cones before practice? If not, it probably shouldn't appear in the activity." His example:
 *
 *   engine: "A regain completes only when followed by a connected forward action under opposition
 *            within the live transition window: possession won and immediately surrendered does not
 *            complete the regain, and the live advantage shifts back to the team that recovered the
 *            ball."
 *   coach:  "A regain only counts if your team plays forward with the next action."
 *
 * And the principle behind it, in his words: "The engine can reason in sophisticated language. The
 * coach should never have to."
 *
 * WHY THIS IS A TRANSLATION AND NOT A REWRITE AT SOURCE. The engine's wording is load-bearing for
 * validation, not merely verbose. `hasExplicitTwoSidedExchangeRule` and
 * `rulesPreserveInteractionExchange` check the exchange rule against the constraint package's
 * guardrails, and the validator requires it VERBATIM in rules[0]. Rewriting those sentences upstream
 * is the shape of the 2026-08-16 outage. So the engine keeps its sentence, the validator keeps its
 * check, and this pass — which runs in compress, after validation — decides what the coach reads.
 *
 * Every translation states the same mechanic. None of them adds coaching content, softens a rule, or
 * drops a condition; where the engine names two outcomes, so does the coach line.
 *
 * COVERAGE IS PINNED BY TEST. coach-rule-voice.unit.ts walks EXCHANGE_RULE_BY_ARCHETYPE and every
 * rule-placement modifier in VALUE_LANDSCAPE_LIBRARY and fails if any of them has no translation, so
 * a new game form or a new modifier cannot quietly reach a coach in engine voice.
 */

interface CoachRule {
    /** A distinctive fragment of the engine sentence. Matched on normalised text, not by regex. */
    readonly engine: string
    /** What a coach would say while putting the cones out. */
    readonly coach: string
}

const COACH_RULE_VOICE: readonly CoachRule[] = [
    // ---- Exchange rules, one per game form (build-activity-mechanics.ts) --------------------
    {
        engine: 'The press and regain window stays live for both teams',
        coach: 'Win the ball back and attack straight away. Lose it and the other team does the same to you. Play does not stop.',
    },
    {
        engine: 'The overload remains active during live play',
        coach: 'The extra numbers stay on all the way through. Use them to pull the defence out of shape. Lose the ball and the other team attacks the space you left.',
    },
    {
        engine: 'The target zone remains active for both teams throughout play',
        coach: 'Both teams can attack their end zone at any time. Get in under pressure and keep playing. Lose the ball and the other team goes the other way straight away.',
    },
    {
        engine: 'Positional advantages remain live while the defensive structure is stretched',
        coach: 'Play through the gap while it is open. Force it into a covered area and the other team attacks the space you left. Play does not stop.',
    },
    {
        engine: 'Play continues immediately after every possession change with no reset',
        coach: 'Whoever wins the ball attacks immediately. If the attack stalls or the ball is lost, the other team does the same. Play does not stop.',
    },
    {
        engine: 'The target remains an active forward connection for both teams',
        coach: 'Find the target player whenever you can. Hit them and keep playing forward. Miss or lose it and the other team attacks straight away.',
    },
    {
        engine: 'Wide and central channels remain active throughout play',
        coach: 'Use any channel to get forward. Get in and keep playing. Force it or lose it and the other team gets the opposite channel. Play does not stop.',
    },
    {
        engine: 'Finishing chances remain live under defensive pressure',
        coach: 'Play every chance out — rebounds and clearances stay live. Lose it and the other team counters straight away.',
    },
    {
        engine: 'The selected constraint problem remains active for both teams during live play',
        coach: 'The condition applies to both teams all the way through. Meet it and the advantage is yours. Miss it or lose the ball and it swings to the other team.',
    },
    {
        engine: 'Play stays live as possession is secured and progressed toward the target under pressure',
        coach: 'Keep the ball and work it forward under pressure. Force it or lose it and the other team attacks straight away. Play does not stop.',
    },

    // ---- Rule-placement slot modifiers (slot-mechanics-variations.ts) -----------------------
    {
        engine: 'On possession change, both teams stay live in the same space with no reset',
        coach: 'When the ball changes hands, play carries on from wherever everyone is. Whoever lost it presses straight away.',
    },
    {
        engine: 'Transition stays live until the defensive shape recovers',
        coach: 'Keep playing until the defending team is set again. Once they are, restart and go again.',
    },
    {
        // Christian's own rewrite of this one, with the second outcome kept.
        engine: 'A regain completes only when followed by a connected forward action under opposition',
        coach: 'A regain only counts if your team plays forward with the next action. Win it and give it straight back and it does not count.',
    },
    {
        engine: 'A regain completes on possession change with an immediate live restart from the regain point',
        coach: 'A regain counts as soon as your team wins the ball. Play on from where you won it.',
    },
    {
        engine: 'Pressure converts to a regain within a short opportunity window',
        coach: 'Win the ball back quickly after losing it. If you do not, the other team plays on from there.',
    },
    {
        engine: 'The decision window after a possession change stays open for the duration of one live action sequence',
        coach: 'After the ball changes hands, the next action decides it. Once that action is over, play on as normal.',
    },

    // ---- Affordance-family lines that reach Rules (build-activity-skeleton.ts) --------------
    // The other four in that set are "Players read…" cognition, which the Communication Standard
    // removes before this pass; only these two are rules.
    {
        engine: 'The next action plays immediately after the ball changes hands, while the shape is still unsettled',
        coach: 'When the ball changes hands, the next action goes straight away. No reset, no stoppage.',
    },
    {
        engine: 'Defenders use shielding, protection of space, or defensive body position',
        coach: 'Defenders can shield the ball, block the space, or use their body to push attackers where they want them.',
    },
]

function normalise(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * The coach's version of an engine rule, or the line unchanged when it is already coach-facing.
 *
 * Matched by normalised substring rather than by regex: the fragments are long and distinctive, and
 * plain `includes` cannot be tripped by an escape that did not survive being typed.
 */
export function toCoachRuleVoice(line: string): string {
    const text = normalise(line)
    for (const { engine, coach } of COACH_RULE_VOICE) {
        if (text.includes(normalise(engine))) return coach
    }
    return line
}

/** Exposed for the coverage test. */
export const COACH_RULE_VOICE_ENTRIES = COACH_RULE_VOICE
