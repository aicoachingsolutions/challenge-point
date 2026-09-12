/**
 * ENGINE SENTENCES IN COACH VOICE — Rules, and now Scoring.
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
 * COVERAGE IS PINNED BY TEST. coach-voice.unit.ts walks EXCHANGE_RULE_BY_ARCHETYPE and every
 * rule-placement AND scoring-placement modifier in VALUE_LANDSCAPE_LIBRARY, and fails if any of them
 * has no translation — so a new game form or a new modifier cannot quietly reach a coach in engine
 * voice.
 *
 * SCORING WAS ADDED 2026-09-11, at Christian's request, once Rules were plain enough that Scoring
 * became the longest engine-voice text a coach read. Same rule as everywhere else: the translation
 * states the same condition, including the second outcome where the engine names one. Scoring's one
 * question is "how do teams score?" — so these say what earns a point and what it is worth, and
 * nothing else.
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

/**
 * Scoring sentences. Same job, one section over.
 *
 * The engine's scoring text is written as a value structure — "Score is weighted by where it is
 * earned: points earned in a forward zone count higher than points earned in a defensive zone, and
 * the same weighting applies in every live contest." Accurate, and not something a coach says. The
 * coach version answers Scoring's one question and stops.
 *
 * Fragments start AFTER the opening verb phrase. `toCoachScoringVoice` in coach-section-ownership
 * has already rewritten "Score awarded for…" to "Earn a point for…" by the time these run, so
 * fragments anchored on the engine's opening matched nothing — the primary condition reached a coach
 * untranslated while the slot incentive beside it was in coach voice. Found by reading output, not
 * by the coverage test, which walks the engine's own strings and so never sees the rewritten prefix.
 *
 * Fragments avoid sport-specific nouns on purpose: this file is in the universal layer and the
 * coupling guard scans it, so the finishing entry is matched on its opening clause rather than on
 * the part naming a position.
 */
const COACH_SCORING_VOICE: readonly CoachRule[] = [
    // ---- Affordance-family scoring lines (build-activity-skeleton.ts) ----------------------
    {
        engine: 'possession is maintained or secured under live opponent pressure',
        coach: 'Earn a point for keeping the ball under pressure. Lose it and the other team has the advantage.',
    },
    {
        engine: 'plays that visibly create or open space for a teammate',
        coach: 'Earn a point for opening space for a team-mate — pulling a defender out so someone else is free.',
    },
    {
        engine: 'attacks that use available space to gain advantage',
        coach: 'Earn a point for attacking the open space before the defence recovers. Too slow and the chance is gone.',
    },
    {
        engine: 'passes or runs that break or bypass a defensive line',
        coach: 'Earn a point for a pass or run that beats a defensive line. Get it intercepted and the other team has the advantage.',
    },
    {
        engine: 'winning the ball back or forcing a turnover',
        coach: 'Earn a point for winning the ball back. Whoever wins it attacks straight away and the other team defends.',
    },
    {
        engine: 'quick attacking action immediately after winning possession',
        coach: 'Earn a point for attacking straight after winning the ball. Once the defence is set, the chance has gone.',
    },
    {
        engine: 'genuine chances created and converted under live defensive contest',
        coach: 'Earn a point for a real chance created and finished against live defending. Efforts that were never on do not count.',
    },
    {
        // Templated on the affordance title, which is an internal name — so the coach line drops it.
        engine: 'players visibly engage with the',
        coach: 'Earn a point when players actually solve the problem in the game, not when they talk about it.',
    },

    // ---- Scoring-placement slot modifiers (slot-mechanics-variations.ts) -------------------
    {
        engine: 'weighted by where it is earned',
        coach: 'Points are worth more the further forward you earn them.',
    },
    {
        engine: 'completes when the scoring action is followed by one connected forward action',
        coach: 'A point only counts once you follow it with a forward action. Until then, keep playing.',
    },
    {
        engine: 'Sustained team pressure that forces the opposing team to play backward earns the same value as a turnover',
        coach: 'Forcing the other team backwards scores the same as winning the ball. Closing the pass they were looking for counts too.',
    },
    {
        engine: 'Pressure that forces a possession change scores at full value',
        coach: 'Pressure only scores when it wins the ball back.',
    },
    {
        engine: 'When a numerical advantage is held in the zone where pressure is applied',
        coach: 'Points are worth more when you score them where you have the extra numbers.',
    },
    {
        engine: 'Numerical relationship across the field stays balanced',
        coach: 'Every point is worth the same, wherever you score it.',
    },
    {
        engine: 'The field is treated as three value zones',
        coach: 'Points are worth most through the middle, then wide, then deep.',
    },
    {
        engine: 'The working area is set into a slightly different footprint',
        coach: 'Same zones and the same point values — only the shape of the area is different.',
    },
]

/**
 * Second sentences of scoring templates whose first sentence is translated above.
 *
 * Scoring is split into sentences before translation, so a two-sentence template matches on its
 * first half and would leave its second half behind in engine voice, sitting after the coach line
 * that already replaced it. These are dropped rather than translated: the coach version above says
 * what they said.
 */
const SCORING_TAILS_TO_DROP: readonly string[] = ['The zone weighting stays the same in every live contest']

function normalise(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function translate(entries: readonly CoachRule[], line: string): string {
    const text = normalise(line)
    for (const { engine, coach } of entries) {
        if (text.includes(normalise(engine))) return coach
    }
    return line
}

/**
 * The coach's version of an engine rule, or the line unchanged when it is already coach-facing.
 *
 * Matched by normalised substring rather than by regex: the fragments are long and distinctive, and
 * plain `includes` cannot be tripped by an escape that did not survive being typed.
 */
export function toCoachRuleVoice(line: string): string {
    return translate(COACH_RULE_VOICE, line)
}

/**
 * The coach's version of an engine SCORING sentence.
 *
 * Applied per sentence rather than per field: a Scoring section is a primary condition plus at most
 * one slot incentive, and each half has its own engine template.
 */
export function toCoachScoringSentence(line: string): string {
    const text = normalise(line)
    if (SCORING_TAILS_TO_DROP.some((tail) => text.includes(normalise(tail)))) return ''
    return translate(COACH_SCORING_VOICE, line)
}

/** Exposed for the coverage tests. */
export const COACH_RULE_VOICE_ENTRIES = COACH_RULE_VOICE
export const COACH_SCORING_VOICE_ENTRIES = COACH_SCORING_VOICE
