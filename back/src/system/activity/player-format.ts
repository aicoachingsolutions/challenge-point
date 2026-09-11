/**
 * The playing format is OURS to decide, not the model's.
 *
 * A coach entered 12 players and was told to play "7v7 with a neutral player in each wide channel" —
 * sixteen. They cannot run that activity, and nothing downstream noticed, because the stored group
 * size stayed correct at 12 and only the setup prose disagreed.
 *
 * Four prompt revisions failed to fix it, each in an instructive way:
 *   1. Stating the count as a parameter ("12 players total")     -> 7v7 + 2 neutrals = 16
 *   2. Listing valid formats                                     -> 7v6 = 13 (game form wanted an
 *      overload, so it ADDED a player instead of moving one)
 *   3. Forbidding wrong formats emphatically                     -> no format stated at all
 *      ("each team has equal numbers"), which is not wrong but is useless to someone setting up
 *   4. Naming the exact format to use                            -> 7v7, neutrals reintroduced
 *
 * The common factor: we kept asking a language model to hold an arithmetic invariant across a long
 * prompt containing other instructions that want neutrals and overloads. Squad size is a fact and
 * the overload requirement is a property of the selected game form, so the format is derivable —
 * there was never anything to negotiate. Deterministic Before Generative, applied to the one field
 * where being wrong makes the activity unrunnable.
 *
 * So the model writes the prose and this module corrects the numbers afterwards. Everything here is
 * pure and unit-tested; no AI is needed to know whether it works.
 */

/** The format an activity should use, given the squad and the selected game form. */
export interface PlayerFormat {
    perSide: [number, number]
    neutrals: number
    /** Coach-facing rendering, e.g. "6v6" or "5v5 plus 1 neutral player". */
    label: string
}

export function choosePlayerFormat(total: number, archetypeName: string): PlayerFormat {
    const wantsOverload = /overload/i.test(archetypeName)

    const make = (a: number, b: number, neutrals: number): PlayerFormat => ({
        perSide: [a, b],
        neutrals,
        label: neutrals > 0 ? `${a}v${b} plus ${neutrals} neutral player${neutrals === 1 ? '' : 's'}` : `${a}v${b}`,
    })

    // An overload is a MOVED player, never an added one: sides stay summing to the squad.
    if (wantsOverload) {
        const larger = Math.floor(total / 2) + 1
        const smaller = total - larger
        if (smaller >= 2) return make(larger, smaller, 0)
    }
    if (total % 2 === 0) return make(total / 2, total / 2, 0)
    const perSide = (total - 1) / 2
    if (perSide >= 2) return make(perSide, perSide, 1)
    return make(Math.ceil(total / 2), Math.floor(total / 2), 0)
}

const FORMAT_PATTERN = /(\d+)\s*(?:v|vs\.?|versus)\s*(\d+)/i
/**
 * Extra players get added under many names, so matching only the word "neutral" is not enough — a
 * real generation slipped "6v6 with one additional player in each wide zone" (fourteen) past a
 * neutral-only pattern. The trailing group is captured because "in each wide zone" doubles the
 * count, which is the difference between thirteen players and fourteen.
 *
 * THE NOUN FORM COUNTS TOO. The pattern required "neutral player(s)", so "Play 6v6 with two
 * neutrals" — real output, 2026-09-08, for a 12-player squad — parsed as twelve and was waved
 * through as correct. Fourteen players, for a coach who has twelve: the same defect Christian
 * reported first, back through a gap in the vocabulary rather than a gap in the logic.
 */
const NEUTRAL_PATTERN =
    /\b(?:with|plus|and|has|have|gets?)\s+(a|an|one|two|three|four|\d+)\s+(?:(?:neutral|extra|additional|floating|target|free)\s+players?|neutrals|floaters)\b([^.;]*)/i

/**
 * "One team has an extra player in their attacking end zone." Real output, 2026-09-10, beside "Play
 * 6v6" for a 12-player squad — thirteen. When the extra player is the VERB of the sentence, cutting
 * the clause leaves "One team." behind, so the whole sentence goes instead.
 */
const HAS_EXTRA_PLAYER_SENTENCE =
    /[^.!?]*\b(?:has|have|gets?)\s+(?:a|an|one|two|three|\d+)\s+(?:neutral|extra|additional|floating|free)\s+players?\b[^.!?]*[.!?]?/gi

/** A playing area written as a pair: "40x30", "40 by 30". */
const AREA_PAIR = /\d+\s*(?:x|×|by)\s*\d+/i

/**
 * "…, with the team of 7 defending" — a team size stated in words beside the scoreline.
 *
 * Real output, 2026-09-10, 12-player squad: "Play 6v6, with the team of 7 defending." Two formats in
 * one sentence, and the count still summed to twelve, so nothing flagged it. The scoreline is the
 * format this module decided; a team size that matches neither side of it is the model half-writing
 * an overload the format does not have, and it comes out.
 */
const TEAM_OF_N = /,?\s*with\s+the\s+team\s+of\s+(\d+|four|five|six|seven|eight|nine|ten)\s+(?:players\s+)?(?:defending|attacking|in\s+possession)\b/i

function removeContradictoryTeamSize(text: string, sides: readonly number[]): string {
    const match = TEAM_OF_N.exec(text)
    if (!match) return text
    return sides.includes(toCount(match[1]!)) ? text : text.replace(TEAM_OF_N, '')
}

/**
 * Neutrals the text mentions but never counts: "Play 6v6. Neutrals start in the wide channels."
 *
 * Six plus six is the whole squad, so there is nobody left to be a neutral — these sentences
 * describe players the coach does not have. A trailing "…, with neutrals positioned in the wide
 * channels" comes off its own sentence first, so "Players start in their respective halves"
 * survives; only sentences whose subject IS the neutrals go whole.
 *
 * Only called once the stated format already spends the whole squad. A counted clause ("5v5 with two
 * neutrals") is real structure and is never touched.
 */
function removeUncountedNeutrals(text: string): string {
    if (NEUTRAL_PATTERN.test(text) || !/\bneutrals?\b/i.test(text)) return text

    const withoutClauses = text.replace(/,?\s*(?:with|and|while)\s+(?:the\s+|two\s+|a\s+)?neutrals?\b[^.;]*/gi, '')
    return withoutClauses
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !/\bneutrals?\b/i.test(sentence))
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,;])/g, '$1')
        .trim()
}

const WORD_NUMBERS: Record<string, number> = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
}

/**
 * A squad stated per team rather than as a scoreline: "Two teams of 5 players each."
 *
 * Real generation, 2026-09-08, for a 12-player squad. The NvN pattern found nothing, so the text
 * counted as "no format stated" and a correct format was APPENDED — leaving the coach reading "Two
 * teams of 5 players each. … Teams play 6v6." in one paragraph. That is worse than either number on
 * its own: a wrong number is something a coach can see and overrule, but a paragraph that states two
 * different squads gives them no way to tell which one the activity was actually built around.
 *
 * Grouped so the rewrite can replace the count while leaving the coach's own sentence shape intact.
 *
 * "players" is optional. Real output, 2026-09-10: "Play with two teams of 6 in a 40 x 30 m area."
 * Requiring the word made the count invisible, the text read as stating no format, and a second one
 * was appended — "…two teams of 6 … Teams play 7v5." The same contradiction this pattern was written
 * to prevent, let back in by one missing word.
 */
const PER_TEAM_PATTERN =
    /\b((?:two|2)\s+)?(teams?\s+of\s+)(\d+|one|two|three|four|five|six|seven|eight|nine|ten)(\s+players?)?(\s+each)?/i

function toCount(raw: string): number {
    return WORD_NUMBERS[raw.toLowerCase()] ?? (Number(raw) || 0)
}

/** How many players the text actually asks for, or null when no format is stated. */
export function parseStatedPlayerTotal(text: string): number | null {
    const format = FORMAT_PATTERN.exec(text)
    const perTeam = PER_TEAM_PATTERN.exec(text)

    let total: number
    if (format) {
        total = Number(format[1]) + Number(format[2])
    } else if (perTeam) {
        const each = toCount(perTeam[3]!)
        if (each <= 0) return null
        total = each * 2
    } else {
        return null
    }

    const neutral = NEUTRAL_PATTERN.exec(text)
    if (neutral) {
        const raw = neutral[1].toLowerCase()
        const per = WORD_NUMBERS[raw] ?? (Number(raw) || 0)
        // "one extra player in each wide zone" is two players, not one.
        const multiplier = /\beach\b/i.test(neutral[2] ?? '') ? 2 : 1
        total += per * multiplier
    }
    return total
}

export interface ReconcileResult {
    text: string
    /** True when the text asked for a squad the coach does not have. Recorded as evidence either way. */
    corrected: boolean
    statedTotal: number | null
    expectedTotal: number
}

/**
 * Rewrite the stated format so it matches the squad the coach actually entered.
 *
 * Conservative on purpose: it only touches the format numbers and an explicit neutral-player clause,
 * both of which are highly regular. Any prose it cannot parse is left exactly as written and simply
 * reported — a mangled sentence would be a worse outcome than a wrong number, because the coach can
 * at least see and correct a wrong number.
 */
export function reconcilePlayerFormat(text: string, total: number, archetypeName: string): ReconcileResult {
    // An overload can come from the CONSTRAINT PACKAGE rather than the game form, in which case the
    // setup says "implement a numerical overload for the attacking team" while the archetype name
    // says nothing about one. Deciding the format from the archetype alone then produced an activity
    // that asked for an overload and specified even sides in the same paragraph.
    const overloadIntent = /\boverload|numerical advantage|extra attacker\b/i.test(text) ? 'Overload' : ''
    const expected = choosePlayerFormat(total, `${archetypeName} ${overloadIntent}`)
    const statedTotal = parseStatedPlayerTotal(text)

    if (!text) return { text, corrected: false, statedTotal, expectedTotal: total }

    // NO FORMAT STATED AT ALL — "Teams play with equal numbers." Not wrong, but a coach standing on
    // a field cannot act on it, and it appeared as soon as the prompt discouraged wrong formats
    // firmly enough. Every route through this function now ends with a concrete, correct format:
    // stated and right is left alone, stated and wrong is corrected, absent is supplied.
    if (statedTotal === null) {
        return {
            text: `${text.replace(/\s+$/, '')} Teams play ${expected.label}.`,
            corrected: true,
            statedTotal,
            expectedTotal: total,
        }
    }

    if (statedTotal === total) {
        // The count is right, but uncounted neutrals elsewhere in the text would make it wrong again
        // in the coach's head the moment they read "Neutrals start in the wide channels" — and so
        // would a team size that matches neither side of the stated format.
        const withoutNeutrals = removeUncountedNeutrals(text)
        const stated = FORMAT_PATTERN.exec(withoutNeutrals)
        const sides = stated ? [Number(stated[1]), Number(stated[2])] : expected.perSide
        const cleaned = removeContradictoryTeamSize(withoutNeutrals, sides)
        return { text: cleaned, corrected: cleaned !== text, statedTotal, expectedTotal: total }
    }

    let next = text.replace(FORMAT_PATTERN, `${expected.perSide[0]}v${expected.perSide[1]}`)

    // No scoreline to correct, but a per-team count that disagrees with the squad. Rewrite the count
    // in place rather than appending a second format beside it.
    //
    // Uneven sides switch to a scoreline instead of a per-team count, because a per-team count
    // cannot express them: "teams of 7 and 5 players each" reads as four teams. The scoreline is
    // also the form parseStatedPlayerTotal already reads, which matters — output this function
    // cannot parse back would look like "no format stated" to the next pass, and get a second
    // format appended to it. That is exactly the contradiction this branch exists to prevent.
    if (!FORMAT_PATTERN.test(text)) {
        const [larger, smaller] = expected.perSide
        next = next.replace(PER_TEAM_PATTERN, (_m, two = '', teamsOf = '', _n = '', players = '', each = '') =>
            larger === smaller
                ? `${two}${teamsOf}${larger}${players}${each}`
                : `${two || 'Two '}teams playing ${larger}v${smaller}`
        )
    }

    if (expected.neutrals === 0) {
        // Our format has no neutrals, so a leftover "with a neutral player in the corridor" clause
        // would put the count wrong again by exactly the number it names.
        //
        // The clause's trailing phrase normally says where the neutrals stand, and goes with them.
        // But in "with two neutrals in a 40x30 yard area" it is the PLAYING AREA, and removing it
        // would take the dimensions out of the setup along with the phantom players.
        next = next.replace(HAS_EXTRA_PLAYER_SENTENCE, ' ')
        next = next.replace(NEUTRAL_PATTERN, (_clause, _count, trailing = '') => (AREA_PAIR.test(trailing) ? trailing : ''))
        next = removeUncountedNeutrals(next).replace(/\s{2,}/g, ' ').replace(/\s+([.,;])/g, '$1')
    }

    return { text: next.trim(), corrected: true, statedTotal, expectedTotal: total }
}
