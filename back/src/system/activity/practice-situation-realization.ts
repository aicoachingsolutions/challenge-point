/**
 * Practice Situation realization — implements IC-002.
 *
 * WHAT THE CONTRACT REQUIRES:
 *
 *   The runtime MUST treat the selected Practice Situation as the CONTEXTUAL FRAME within which
 *   representative learning occurs. A Practice Situation MUST NOT be interpreted as a direct synonym
 *   for a single Game Problem — within one situation, several Game Problems may emerge.
 *
 * WHY THIS EXISTS AT ALL. Practice Situation previously reached the engine only by being appended to
 * the coach's goal text and routed by the parser. That is the one-to-one collapse IC-002 forbids,
 * and it failed the contract measurably: across "Play Through Pressure", four situations produced
 * only TWO distinct activities, so two of the coach's four choices changed nothing they could see.
 * It also misrouted — "From Goal Kicks" fired the finishing matcher on the word "goal" and produced
 * a shooting activity under a build-from-the-back goal.
 *
 * So the situation is handled the same way Learning Stage is: as a REALIZATION directive contributed
 * after selection. That is what makes Invariants 2 and 3 (changing the situation must not change the
 * Learning Goal or Learning Stage) true by construction rather than by care.
 *
 * THE KNOWLEDGE IS CHRISTIAN'S, SO THE CONTENT COMES FROM THE WORKBOOK. The directive carries the
 * situation's authored name and definition verbatim and instructs the runtime to initialize the
 * environment consistently with them. It contains NO per-situation sport specifics — the worked
 * examples in IC-002 §8 name particular roles and opposition behaviours, and those are exactly the
 * coaching knowledge his Governance Standard puts on his side of the line. Writing them here would
 * recreate sport knowledge in application code, which is the failure the whole workbook exercise
 * exists to prevent. (The sport-coupling guard caught an earlier draft of this very comment naming
 * them, which is a fair illustration of how easily it happens.) When the Practice Situation Registry
 * carries richer authored detail, this directive gets richer for free with no code change.
 *
 * INVARIANT 1 HOLDS BY CONSTRUCTION AS A RESULT. Every Practice Situation has a distinct authored
 * name and definition, so every situation produces a distinct directive — the contract's "recognizably
 * different representative context" cannot silently collapse the way parser routing did.
 */

export interface PracticeSituationContext {
    id: string
    name: string
    definition: string
}

/**
 * The realization directive for the assembly brief.
 *
 * Returns `[]` when no situation was selected. That is a real and frequent state — several Learning
 * Goals have no Practice Situations at all, and the conversation skips the step entirely — so an
 * absent situation must produce no framing rather than an invented one.
 */
export function practiceSituationDirective(situation: PracticeSituationContext | null | undefined): string[] {
    if (!situation || !situation.name.trim()) return []

    const lines = [
        `PRACTICE SITUATION — ${situation.name.toUpperCase()} (the competitive context, not the learning objective)`,
    ]

    if (situation.definition.trim()) {
        lines.push(`Context as authored: ${situation.definition.trim()}`)
    }

    lines.push(
        'Set the activity INSIDE this situation: the starting conditions, where players begin, how the',
        'opposition is organized, and what information is available should all be recognizable as this',
        'moment of the game rather than a generic version of it.',
        // IC-002 §5 is explicit that a situation is not a synonym for one Game Problem. Without this
        // the model narrows the activity to whatever single problem the name most suggests, which
        // throws away the other representative problems the context should naturally present.
        'Several different problems may arise within this context — do not narrow the activity to only',
        'one of them, and do not rename or replace the learning goal to fit the situation.',
        // Invariant 4: changing Practice Situation must not reduce representative fidelity.
        'Framing the activity this way must not make it less representative or more prescriptive.'
    )

    return lines
}
