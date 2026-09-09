/**
 * COACH COMMUNICATION STANDARD (RC2) — enforcement.
 *
 * Christian's standard, 2026-09-08, written after weeks of reading generated activities as a coach.
 * The instruction was to treat communication the way we treated the architecture: establish a
 * standard, then apply it consistently, rather than fixing wording case by case.
 *
 * The principles this file enforces, in his words:
 *
 *   Principle 2 — COMMUNICATE HOW TO PLAY. Describe the game, not the learning process. Do not
 *                 explain decisions, perceptions, representative intentions or tactical reasoning;
 *                 those should emerge from the activity.
 *   Principle 4 — SHOW THE ENVIRONMENT. Describe the environment, not player cognition.
 *                 "Play begins with a restart from the end line", never "Players decide when to
 *                 secure possession". (His example named a sport-specific role; this file is in the
 *                 universal layer, so the example is restated neutrally. The unit test keeps his
 *                 wording verbatim, because the standard has to work on real sport-specific text.)
 *   The Sentence Test — every sentence must help the coach RUN the activity, or be removed.
 *   The Coach Translation Test — if a coach must mentally translate a sentence into an action,
 *                 rewrite it.
 *
 * His explicit AVOID list is the spine of this module: "Players decide…", "Teams aim to…",
 * "Session focus…", "Immediate attacking advantage…", "Players recognize…", "Players choose…".
 *
 * WHY THIS IS A SEPARATE PASS FROM translateCoachLanguage. That function is a vocabulary dictionary —
 * it swaps one term for another. This is a GRAMMAR pass: it removes whole clauses that describe
 * cognition rather than the environment. Keeping them apart means the vocabulary can change without
 * touching the standard, which is the same separation Christian asked for between knowledge and
 * expression.
 *
 * Every transformation here is REMOVAL or REPHRASING of engine-authored framing. Nothing invents
 * coaching content, and nothing touches the authored knowledge underneath.
 */

/**
 * Clauses describing what players think, decide, or perceive.
 *
 * Removed wholesale rather than reworded: there is no coach-facing rewrite of "players recognize
 * when the picture changes" that helps someone organise a session, and Principle 2 says the
 * behaviour should emerge from the environment rather than be narrated at the coach.
 *
 * Two details are load-bearing, both learned from reading real generated output rather than from
 * reasoning about the pattern:
 *
 *   The optional leading determiner, and the adjectives after it. Authored text says "the team
 *   losing the ball decides…" and "the free player decides when to enter the lane…". Without
 *   consuming the determiner, the strip left an orphan article and a coach was shown "…on every
 *   possession change; the the." Consuming the determiner but not the adjective moved the defect
 *   rather than fixing it: "the free the ball carrier adapts timing of the forward pass."
 *
 *   The {0,3} gap between subject and verb. Christian's AVOID list is written as "Teams decide…",
 *   but generation writes it as "the team gaining the ball decides…". Requiring the verb adjacent
 *   to the subject matched the list and missed the output.
 */
const PLAYER_COGNITION_CLAUSE =
    /(?:\b(?:the|a|an)\s+(?:[a-z]+\s+){0,2}?)?\b(?:players?|teams?)(?:\s+[A-Za-z0-9]+){0,3}?\s+(?:decides?|chooses?|recognizes?|recognises?|reads?|perceives?|must decide|face a decision)\b[^.;]*[.;]?/gi

/**
 * Cognition framing wrapped AROUND a real objective, which must be unwrapped rather than deleted.
 *
 * Real generation, 2026-09-08, produced this Objective:
 *
 *   "Players decide to decide how to maintain possession while progressing through the central
 *    corridor, using line-breaking passes to reach the end zone."
 *
 * Deleting the sentence as cognition emptied the Objective section completely — but everything after
 * "how to" is exactly the objective a coach needs, and it is the only place the activity states it.
 * Removing authored content because it arrived wearing a forbidden frame is the same silent loss the
 * standard exists to prevent, just committed by the cleanup instead of the generator.
 *
 * "How to X" unwraps to "X" because X is a thing to do. "When to X" does NOT: Christian's own
 * Appendix B deletes "Decide when to switch play or maintain possession based on time and space"
 * outright, because a moment-of-choice description is not an instruction a coach can act on. So the
 * two are treated differently, and the general clause removal below handles the "when" case.
 *
 * Anchored at the start of a sentence only — mid-sentence, the frame is a subordinate clause and
 * unwrapping it would splice two independent thoughts together.
 */
const COGNITION_FRAME_UNWRAP: ReadonlyArray<readonly [RegExp, string]> = [
    [/^\s*(?:the\s+)?players?\s+(?:decide\s+to\s+decide|decides?|must\s+decide|chooses?)\s+how\s+to\s+/i, ''],
    [/^\s*(?:the\s+)?teams?\s+(?:decide\s+to\s+decide|decides?|must\s+decide|chooses?)\s+how\s+to\s+/i, ''],
]

/**
 * A bare imperative telling the coach to narrate a decision: "Decide when to switch play based on
 * channel availability." Same content as "Players decide when to…" with the subject dropped, so the
 * subject-anchored pattern missed it; seen in a real howToPlay bullet.
 */
const BARE_DECISION_IMPERATIVE = /^\s*(?:decide|choose|recognize|recognise|read)\s+(?:when|whether|where)\s+to\b/i

/**
 * Sentences that explain WHY the design works rather than HOW to play.
 *
 * Principle 2 is explicit: do not explain decisions, perceptions, representative intentions or
 * tactical reasoning — those should emerge from the activity. The Sentence Test decides the rest: if
 * removing a sentence does not reduce a coach's ability to organise or run the activity, remove it.
 *
 * This is authored design intent reaching a coach-facing field verbatim. Measured on 2026-09-08, one
 * activity's whole Constraint section read:
 *
 *   "Several live targets create a perception problem: the attack reads which target is least
 *    protected now and the defense reorganizes to cover, so advantage comes from recognizing the
 *    open option, not from a rehearsed route. Support lane requirement creates a visible spatial
 *    game problem; …"
 *
 * Seventy words, none of which tell a coach anything to do. The same section in another activity read
 * "Central pressure. Use wide areas." — three words a coach can act on, which is the section's job.
 * (The real example named a pitch region; this file is in the universal layer, so it is trimmed. The
 * unit test keeps the full wording.)
 *
 * MATCHED ON DESIGN VOCABULARY, NOT ON LENGTH OR ABSTRACTION. "Creates a perception problem" and
 * "is the resource" are how the Knowledge Core describes a manipulation to itself. A sentence that
 * is merely long, or that describes a game condition ("a live counter-press window creates a
 * contested advantage on every possession change"), is left alone: it may still be doing work for
 * the coach, and over-removal here empties sections rather than clarifying them.
 */
const DESIGN_RATIONALE_SENTENCE: ReadonlyArray<RegExp> = [
    // "…create a perception problem", "…creates a visible spatial game problem".
    /\bcreates?\s+(?:a|an)\s+[\w\s-]{0,40}?(?:problem|resource)\b/i,
    // "Information out of a defender's view is the resource".
    /\bis\s+the\s+resource\b/i,
    // "…so advantage comes from recognizing the open option".
    /\badvantage\s+comes\s+from\b/i,
]

/** Framing that announces the activity's purpose instead of describing the game. */
const PURPOSE_FRAMING: ReadonlyArray<readonly [RegExp, string]> = [
    // "Session focus: Move ball into a target zone." — an engine label on a coach-facing field.
    [/\s*Session focus:\s*[^.]*\.?/gi, ''],
    // "Teams aim to progress the ball into the end zone" -> "Progress the ball into the end zone".
    [/\bTeams?\s+aim\s+to\s+/gi, ''],
    [/\bThe\s+(?:goal|objective)\s+of\s+this\s+activity\s+is\s+to\s+/gi, ''],
    // Internal value language that reads as jargon on a field.
    [/\s*\b(?:the\s+)?immediate attacking advantage\b/gi, ' the advantage'],
]

/**
 * Connectives that can be left stranded at the end of a sentence once the clause they introduced is
 * gone.
 *
 * This list exists because of a real coach-facing defect. The authored blind-side manipulation reads
 * "…advantage created from the blind side counts more, so players perceive defender orientation and
 * exploit unseen space". Removing the cognition clause left the coach reading "…counts more, so." —
 * authored knowledge truncated mid-thought by the pass that was supposed to clarify it.
 */
const DANGLING_CONNECTIVE = /[\s,;:—–-]*\b(?:so|and|but|or|because|since|while|as|then|which|that|with|to)\b[\s,;:—–-]*$/i

/** Split on sentence boundaries, keeping terminal punctuation with its sentence. */
function splitIntoSentences(value: string): string[] {
    return value.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
}

/**
 * Apply the standard to one coach-facing sentence-bearing field.
 *
 * Order matters: purpose framing is stripped first so that a sentence which is ONLY purpose framing
 * disappears entirely, rather than leaving a fragment for the cognition pass to trip over.
 *
 * Cognition removal then runs PER SENTENCE, not across the field. That is the difference between
 * repairing a seam and hiding one: a clause removed from the middle of a sentence leaves a wound in
 * that sentence specifically, and the repair has to be judged against what remains of it. A
 * field-wide tidy only ever sees the last sentence's tail, which is how "…counts more, so." reached
 * a coach.
 */
export function applyCoachCommunicationStandard(value: string): string {
    if (!value) return value

    let next = value
    for (const [pattern, replacement] of PURPOSE_FRAMING) next = next.replace(pattern, replacement)

    const kept: string[] = []
    for (const sentence of splitIntoSentences(next)) {
        // A sentence that is nothing but "decide when to …" carries no environment to preserve.
        if (BARE_DECISION_IMPERATIVE.test(sentence)) continue

        // Design rationale fails the Sentence Test outright: there is nothing in it for a coach to
        // act on, so there is nothing to unwrap or repair.
        if (DESIGN_RATIONALE_SENTENCE.some((pattern) => pattern.test(sentence))) continue

        // Unwrap before removing: a real objective inside a cognition frame must survive the frame.
        let working = sentence
        for (const [pattern, replacement] of COGNITION_FRAME_UNWRAP) working = working.replace(pattern, replacement)

        const stripped = tidy(working.replace(PLAYER_COGNITION_CLAUSE, ' '))
        // A sentence reduced to a stub is dropped rather than shown. Two words is the threshold at
        // which a remainder stops being a sentence a coach can act on ("Restart wide." survives;
        // "Counts more." does not carry the environment it was describing).
        if (stripped && countWords(stripped) >= 2) kept.push(stripped)
    }

    return kept.join(' ')
}

/**
 * Apply the standard to a section that MUST NOT end up empty.
 *
 * Objective, Setup, Rules, Scoring and Win Condition each answer one of the coach questions in
 * Christian's table. A blank Objective does not merely lose information — it removes the answer to
 * "what are we improving?" from an activity that is otherwise complete, and the coach has no way to
 * tell whether the section is empty because nothing was generated or because something was removed.
 *
 * Measured on 2026-09-08, this Objective emptied completely:
 *
 *   "Players decide to decide when to maintain possession and when to exploit line-breaking
 *    opportunities to progress toward the end zone. Session focus: Maintain possession with forward
 *    intent."
 *
 * Both sentences are forbidden framing, so the strict pass correctly removed both. But the objective
 * a coach needs is inside the first one, and Christian's own Appendix B rewrite of this shape keeps
 * the objective and drops the frame. So when the strict pass empties a required section, fall back
 * to unwrapping rather than deleting: the frame still comes off, but what it was wrapped around
 * survives.
 *
 * Sections NOT in that table — Constraint most of all — keep the strict pass. If everything in them
 * is design rationale then they genuinely have nothing to say, and an empty section is the honest
 * result rather than a salvaged sentence nobody needed.
 */
export function applyStandardToRequiredSection(value: string): string {
    const strict = applyCoachCommunicationStandard(value)
    if (strict || !value) return strict

    let next = value
    for (const [pattern, replacement] of PURPOSE_FRAMING) next = next.replace(pattern, replacement)

    const kept: string[] = []
    for (const sentence of splitIntoSentences(next)) {
        let working = sentence
        for (const [pattern, replacement] of COGNITION_FRAME_UNWRAP) working = working.replace(pattern, replacement)
        // "…decide WHEN to X" unwraps the same way here. The strict pass drops it, following
        // Christian's Appendix B; as a last resort before an empty section, the content wins.
        working = working.replace(LAST_RESORT_FRAME, '')
        // The unwrap leaves the second half of "when to X and when to Y" stranded mid-sentence.
        working = working.replace(/\s+and\s+when\s+to\s+/gi, ' and ')

        const cleaned = tidy(working)
        if (cleaned && countWords(cleaned) >= 2) kept.push(cleaned)
    }

    return kept.join(' ')
}

/** The "when/whether to" frame, unwrapped only to keep a required section from emptying. */
const LAST_RESORT_FRAME =
    /^\s*(?:the\s+)?(?:players?|teams?)\s+(?:decide\s+to\s+decide|decides?|must\s+decide|chooses?)\s+(?:when|whether|where)\s+to\s+/i

function countWords(value: string): number {
    return value.replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

/**
 * Repair the seams left by removing a clause from the middle of a sentence.
 *
 * Learned the expensive way: a previous strip left "…to gain advantage —" dangling at the end of a
 * line, and a coach was shown a sentence that stopped mid-thought. Removal is only half the job.
 */
function tidy(value: string): string {
    let next = value
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,;:])/g, '$1')
        .replace(/([.;])\s*\1+/g, '$1')
        .replace(/^[\s,;:—–-]+/, '')
        .replace(/[\s,;:—–-]+$/, '')
        .trim()

    // Strip terminal punctuation before testing for a stranded connective, then keep stripping:
    // removing "that" can expose "so" behind it.
    next = next.replace(/[.!?]+$/, '')
    let previous = ''
    while (next !== previous) {
        previous = next
        next = next.replace(DANGLING_CONNECTIVE, '').replace(/[\s,;:—–-]+$/, '')
    }

    next = next.trim()
    if (next && !/[.!?]$/.test(next)) next = `${next}.`

    // Restore sentence case. Stripping a leading frame demotes the next word: "Teams aim to progress
    // through the central corridor" became the bullet "progress through the central corridor" in
    // real output. The module comment above already promised "Progress the ball…"; nothing was
    // actually doing it.
    if (/^[a-z]/.test(next)) next = next[0]!.toUpperCase() + next.slice(1)

    // A field reduced to punctuation by the strip is empty, not a sentence.
    return /[a-z0-9]/i.test(next) ? next : ''
}

/**
 * Does this text still violate the standard? Used by the audit so violations become evidence rather
 * than silent passes — the same treatment coach-language leaks already get.
 */
export function findCommunicationStandardViolations(text: string): string[] {
    const violations: string[] = []
    if (!text) return violations

    if (/\bSession focus:/i.test(text)) violations.push('Session focus:')
    if (/\bTeams?\s+aim\s+to\b/i.test(text)) violations.push('Teams aim to')
    if (/\bimmediate attacking advantage\b/i.test(text)) violations.push('immediate attacking advantage')

    const cognition = text.match(/\b(players?|teams?)\s+(decide|choose|recognize|recognise|perceive)\w*\b/gi)
    for (const hit of cognition ?? []) violations.push(hit.toLowerCase())

    return [...new Set(violations)]
}
