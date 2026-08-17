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
 */
const NEUTRAL_PATTERN =
    /\b(?:with|plus|and)\s+(a|an|one|two|three|\d+)\s+(?:neutral|extra|additional|floating|target|free)\s+players?\b([^.;]*)/i

const WORD_NUMBERS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3 }

/** How many players the text actually asks for, or null when no format is stated. */
export function parseStatedPlayerTotal(text: string): number | null {
    const format = FORMAT_PATTERN.exec(text)
    if (!format) return null
    let total = Number(format[1]) + Number(format[2])

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
        return { text, corrected: false, statedTotal, expectedTotal: total }
    }

    let next = text.replace(FORMAT_PATTERN, `${expected.perSide[0]}v${expected.perSide[1]}`)
    if (expected.neutrals === 0) {
        // Our format has no neutrals, so a leftover "with a neutral player in the corridor" clause
        // would put the count wrong again by exactly the number it names.
        next = next.replace(NEUTRAL_PATTERN, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,;])/g, '$1')
    }

    return { text: next.trim(), corrected: true, statedTotal, expectedTotal: total }
}
