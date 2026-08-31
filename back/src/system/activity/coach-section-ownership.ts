/**
 * SECTION OWNERSHIP — one idea, one section, in the coach's language.
 *
 * Christian's 17 Aug review, reading generated activities as a coach rather than as the architect:
 * "I frequently understand the learning intention, but I still don't consistently understand the
 * game." The remaining problem is not vocabulary — that is largely fixed — it is that three
 * different kinds of statement are still stacked inside Rules:
 *
 *   1. what players DO            <- belongs in Rules
 *   2. how points are EARNED      <- belongs in Scoring, and is already there
 *   3. what the coach should WATCH / why the activity was designed this way
 *
 * His test for (1) is the one used here, because it is the only one a machine can apply without
 * understanding the sport: **could a coach read this sentence aloud to their players before the
 * activity starts?** "Support options and spacing must shape available passes and outlets" fails it.
 * "Play continues immediately after every possession change" passes.
 *
 * WHY THIS IS A PRESENTATION FILTER AND NOT AN EDIT TO THE KNOWLEDGE. Every line dropped here is
 * still required, still generated, and still validated upstream — the skeleton validator checks the
 * model expressed these mechanics, and this runs afterwards on the coach-facing copy only. So no
 * rule about what an activity must CONTAIN changes, and there is no new way for a generation to be
 * rejected. That distinction is why this can ship the day before a pilot: it is exactly the
 * "Communication Contributions" layer of Christian's own Knowledge Presentation Standard — same
 * knowledge, audience-aware presentation.
 */

/** Statements about how points are earned. Scoring already says these; Rules repeating them is noise. */
export function isScoringStatement(line: string): boolean {
    return /\b(score[sd]?\s+awarded|scoring is tied|a point (or live advantage )?counts?|points? (are|is) (awarded|earned)|carr(y|ies) higher value|counts? higher)\b/i.test(
        line
    )
}

/**
 * Design rationale and coaching principles — true, useful, and not a rule.
 *
 * "must shape", "is the core game event", "defines the contest" describe WHY the activity works.
 * A coach cannot read them to players, and reading them here costs the attention we need for the
 * sentences that do tell them what to do.
 */
export function isDesignRationale(line: string): boolean {
    return (
        /\b(must shape|shapes when and how|is the core game event|defines the contest|decides the contest|as a live game condition|is the live read|structure how both teams|the conditions below|open decision-making)\b/i.test(
            line
        ) ||
        // Internal framing that survived translation. Christian flagged this label a year ago and it
        // is still arriving in coach-facing rules.
        /^two-sided contest\b/i.test(line.trim())
    )
}

/**
 * Statements that describe the ordinary run of the sport, which every coach already knows.
 *
 * Christian's examples, verbatim: "teams attack in a direction", "possession changes create
 * transitions", "the opponent attacks after winning the ball". These do not need saying unless they
 * differ from a normal game — and stating them implies the coach might have expected otherwise,
 * which quietly undermines the instructions that DO matter.
 *
 * ARCHITECTURAL NOTE worth passing on: WHICH statements are obvious is sport knowledge, so this
 * phrase list properly belongs in the sport module rather than here. It sits in the universal layer
 * only because the module has no presentation section yet. The predicate itself — "drop what the
 * sport already guarantees" — is universal and stays.
 *
 * Note the first pattern catches a sentence I wrote on 16 Aug while rewriting design specs into
 * rules: "Teams attack toward a defined goal or end, so every progression has a direction." It was
 * grammatical, coach-voiced, and still said nothing.
 */
export function isImpliedSportKnowledge(line: string): boolean {
    return /\b(so every progression has a direction|teams attack toward a defined goal|live opposition contests every attempt|opponents? actively contests?|the immediate action after possession changes|transition moment is the game|both teams play a live, two-sided game|attack and defend as they would in a normal game)\b/i.test(
        line
    )
}

export interface RuleRouting {
    /** What players do — the only thing that stays in Rules. */
    rules: string[]
    /** Removed because Scoring already owns them. */
    movedToScoring: string[]
    /**
     * Rationale and coaching principles. NOT deleted — moved to Coaching Focus, which is the section
     * that owns "what should I watch for". Deleting them emptied Rules to a single line on two of
     * three activities, which is a worse read than the over-full version: the coach went from too
     * much of the wrong thing to too little of anything.
     */
    movedToCoachingFocus: string[]
    /** Dropped outright: statements the sport already guarantees, which carry nothing. */
    removed: string[]
}

/**
 * Keep only the sentences a coach could read aloud to players.
 *
 * The first rule is always kept regardless: it carries the two-sided exchange the whole activity is
 * built around, and an activity that loses it stops describing a contest.
 */
export function routeRulesForCoach(rules: string[], protectedLines: string[] = []): RuleRouting {
    const out: RuleRouting = { rules: [], movedToScoring: [], movedToCoachingFocus: [], removed: [] }

    rules.forEach((line, index) => {
        const isProtected = index === 0 || protectedLines.some((p) => p && line.includes(p))
        if (isProtected) {
            out.rules.push(line)
            return
        }
        if (isScoringStatement(line)) {
            out.movedToScoring.push(line)
            return
        }
        // Order matters: something that is BOTH obvious and rationale is simply dropped, because
        // relocating a sentence that says nothing just moves the noise to a different section.
        if (isImpliedSportKnowledge(line)) {
            out.removed.push(line)
            return
        }
        if (isDesignRationale(line)) {
            out.movedToCoachingFocus.push(line)
            return
        }
        out.rules.push(line)
    })

    return out
}

/**
 * "How do teams score?" must be answerable from the first sentence.
 *
 * Christian: "If I have to reread the Scoring section to determine how points are earned, it
 * probably isn't clear enough." Scoring accumulates qualifying clauses and zone weightings; the
 * plainest statement is not reliably first. This promotes the most direct scoring sentence to the
 * front without discarding the detail after it.
 */
/**
 * Scoring says how points are earned. Nothing else belongs there.
 *
 * Christian, 24 Aug, still finding engine voice in the scoring section and asking the only question
 * that matters — "what exactly am I rewarding?" — of lines like:
 *
 *   "Space usage, spacing, or lane access must shape the next action."
 *   "Scoring and advantage must be tied to genuine channel exploitation."
 *
 * Both are true, neither answers the question, and both were sitting above the sentence that does.
 * A design constraint on how the activity was built is not a way to earn a point, so it leaves the
 * section — the same rule already applied to Rules, applied one section across.
 */
export function isNotAWayToEarnPoints(sentence: string): boolean {
    if (/\b(must shape|must be tied to|shall be|is the live read|structure how both teams)\b/i.test(sentence)) {
        return true
    }

    // SETUP DESCRIPTION INSIDE SCORING. Christian, 28 Aug: "The working area is set into a slightly
    // different footprint…" — and he is right that this is ownership rather than wording, since it
    // describes the environment rather than how teams succeed.
    //
    // Matched on layout VERBS, not on mentioning space: "the field is treated as three value zones,
    // regains in the central zone count higher" is a weighting and must survive.
    return /\b(working area|footprint|is set into|is laid out|is set up|area is divided|pitch is divided)\b/i.test(
        sentence
    )
}

/**
 * "Score awarded for X" is how a specification says it; "Earn a point for X" is how a coach does.
 *
 * The information was already right in these lines — the grammar just addressed the system rather
 * than the person holding the whistle. Rewriting the opening is the whole change; the condition
 * after it is authored knowledge and is left exactly alone.
 */
export function toCoachScoringVoice(sentence: string): string {
    return sentence
        .replace(/^Score awarded only when\b/i, 'Earn a point only when')
        .replace(/^Score awarded for\b/i, 'Earn a point for')
        .replace(/^Score is weighted by\b/i, 'Points are weighted by')
        .replace(/^Scoring is tied to\b/i, 'Earn a point for')
        .replace(/^Defenders score when\b/i, 'The defending team earns a point when')
        .replace(/^A point or live advantage counts only when\b/i, 'Earn a point only when')
        .replace(/^A point or live advantage counts when\b/i, 'Earn a point when')
}

/**
 * ONE PRIMARY SUCCESS CONDITION. Optional secondary only when it strengthens the problem.
 *
 * Christian, 26 Aug, after ~60 generated activities: the remaining scoring problem is not wording,
 * it is OWNERSHIP. The section aggregates every eligible incentive from every knowledge layer —
 * one per selected affordance lens, plus the game form's own, plus the constraint's, plus this
 * slot's variation — so a coach reads four or five reward statements and cannot tell which one
 * actually defines success:
 *
 *   reach the target area · create a genuine scoring chance · create space for a teammate ·
 *   use available space · switch play
 *
 * Individually representative, collectively competing. His two consequences are worth keeping in
 * mind because they are different problems: too many simultaneous success criteria to explain, and
 * several of them SUBJECTIVE — "create space", "gain advantage", "a genuine chance" are excellent
 * coaching observations and poor scoring criteria, because two coaches will score the same action
 * differently.
 *
 * There is also a representative argument, which is his: a checklist of point opportunities invites
 * players to optimise for the checklist. The game should invite multiple solutions and reward the
 * one consequence that shapes behaviour.
 *
 * Nothing is deleted. What leaves Scoring goes to Coaching Focus, where "watch for players creating
 * space" is exactly the right kind of statement.
 */
export interface ScoringOwnership {
    /** The single condition that defines success. */
    primary: string
    /** At most one, and only this slot's own variation — see below. */
    secondary: string | null
    /** Still true, still useful, no longer a way to score. */
    movedToCoachingFocus: string[]
}

/** Words that make a condition a judgement call rather than an observation. */
function subjectivityPenalty(sentence: string): number {
    const markers = /\b(genuine|genuinely|visibly|clear|meaningful|quality|effective|appropriate|good|advantage)\b/gi
    return (sentence.match(markers) ?? []).length
}

/** Concrete, countable events two coaches would score the same way. */
function objectivityScore(sentence: string): number {
    const markers =
        /\b(enters?|entering|reach(?:es|ing)?|into the|target zone|end zone|zone|line|wins? the ball|turnover|regain|completes?|possession changes)\b/gi
    return (sentence.match(markers) ?? []).length
}

export function selectPrimarySuccessCondition(
    sentences: string[],
    /**
     * Recognises this slot's value modifier. A PREDICATE rather than a list of strings because the
     * model paraphrases modifier text, and matching by exact substring silently failed to find it —
     * which dropped the one sentence that differentiates this activity from its siblings. The caller
     * passes the same token-containment check the rest of compression uses.
     */
    isSlotModifier: (sentence: string) => boolean = () => false,
    /**
     * Recognises a sentence produced from an AUTHORED incentive mechanism, i.e. the consequence the
     * selected constraint package carries for this coaching problem. Injected rather than imported
     * so this module stays free of incentive-expression details.
     */
    isAuthoredIncentive: (sentence: string) => boolean = () => false
): ScoringOwnership | null {
    const usable = sentences.filter((s) => s.trim().length > 0)
    if (usable.length === 0) return null

    /**
     * THE SECOND SLOT BELONGS TO THE CONSEQUENCE THAT INVITES THE COACHING INTENTION.
     *
     * Christian, 28 Aug, after the first version of this function: the activities became clear but
     * "no longer feel intentionally shaped around the coaching problem" — a transition-attacking
     * game scored end-zone entry, with nothing encouraging players to exploit the brief moment a
     * defence is disorganised. *"We've corrected too far in the opposite direction."*
     *
     * He is right, and the fix is not to add incentives back. The consequence he wants ALREADY
     * EXISTS and we were throwing it away: the selected constraint package for that goal carries an
     * authored time-window reward — "quick attacking actions after regain, but only inside a short
     * window". That is goal-specific BY CONSTRUCTION, because selection chose that package for this
     * coaching problem; the archetype's own condition is generic to the game form. We were letting
     * the generic one win because it read as more objective.
     *
     * So the ranking is: an AUTHORED INCENTIVE outranks this slot's value modifier for the second
     * position. The modifier differentiates the three activities from each other; the authored
     * incentive is what makes all three about the coach's actual problem. When the goal is served,
     * variety is the lesser claim.
     *
     * His framing is the one to hold on to: the engine's job is to generate CONSEQUENCES, not
     * scoring systems. Sometimes that consequence is a point; sometimes a short window. The
     * consequence should make the desired affordance more inviting without making the behaviour
     * mandatory — so it goes SECOND, after the plain way to score, and never replaces it.
     */
    const authoredConsequence = usable.find(isAuthoredIncentive) ?? null
    const secondary = authoredConsequence ?? usable.find(isSlotModifier) ?? null

    const candidates = usable.filter((s) => s !== secondary)
    if (candidates.length === 0) {
        return { primary: secondary as string, secondary: null, movedToCoachingFocus: [] }
    }

    /**
     * A WEIGHTING IS NOT A SUCCESS CONDITION. "Points are weighted by where possession changes
     * hands" presupposes a way to score without ever stating one, and a first pass promoted exactly
     * that to primary on one activity — objective, concrete, and leaving the coach unable to say
     * what earns a point at all. Weightings are detail ABOUT scoring; they qualify as primary only
     * when nothing states how a point is earned.
     */
    const statesHowAPointIsEarned = (s: string) => /\b(earn (?:a|an extra) point|earns a point|a point counts|counts? when)\b/i.test(s)
    const isWeighting = (s: string) => /\b(weighted|weighting|carry higher value|counts? higher|worth double|scales? with)\b/i.test(s)

    const rank = (s: string): number =>
        (statesHowAPointIsEarned(s) ? 8 : 0) -
        (isWeighting(s) ? 6 : 0) +
        objectivityScore(s) * 2 -
        subjectivityPenalty(s) * 3 -
        Math.floor(s.length / 160)

    const primary = candidates.reduce((best, s) => (rank(s) > rank(best) ? s : best), candidates[0])

    return {
        primary,
        secondary,
        movedToCoachingFocus: candidates.filter((s) => s !== primary),
    }
}

/**
 * A reward statement re-voiced as something to watch for, since it is no longer a way to score.
 * "Earn a point for X" as a coaching cue would just be the same competing criterion in a new place.
 */
export function toObservationVoice(sentence: string): string {
    const observation = sentence
        .replace(/^Earn an extra point for\s+/i, 'Watch for ')
        .replace(/^Earn a point only when\s+/i, 'Watch whether ')
        .replace(/^Earn a point for\s+/i, 'Watch for ')
        .replace(/^Score awarded for\s+/i, 'Watch for ')
        .replace(/^Score awarded only when\s+/i, 'Watch whether ')
        .replace(/^The defending team earns a point for\s+/i, 'Watch the defending team for ')
    return observation === sentence ? sentence : observation.charAt(0).toUpperCase() + observation.slice(1)
}

export function leadWithClearestScoringSentence(sentences: string[]): string[] {
    if (sentences.length < 2) return sentences

    const directness = (s: string): number => {
        let score = 0
        // A sentence naming the unit and the action a coach can see.
        if (/\b(1 point|one point|a point|teams? (earn|score))\b/i.test(s)) score += 3
        if (/\bwhen\b/i.test(s)) score += 1
        // Conditions and weightings are detail, not the headline.
        if (/\b(weight|higher value|counts? higher|zone weighting|scales? with)\b/i.test(s)) score -= 2
        if (/\bonly when\b/i.test(s)) score -= 1
        score -= Math.floor(s.length / 120)
        return score
    }

    const best = sentences.reduce((bestIndex, s, i) => (directness(s) > directness(sentences[bestIndex]) ? i : bestIndex), 0)
    if (best === 0) return sentences
    return [sentences[best], ...sentences.filter((_, i) => i !== best)]
}
