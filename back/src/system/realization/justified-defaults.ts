/**
 * Justified defaults — the two cases, and only the two, in which an open line nobody chose a value for is
 * closed anyway.
 *
 * Christian, 13 October 2026, approving them with their limit in the same sentence: defaults are welcome
 * *"provided they don't silently override important learning-design choices."* And of what a first activity
 * is for: *"The initial activity should establish a purposeful starting environment, not prescribe an ideal
 * configuration for the entire session."*
 *
 * **Why they exist.** Every game realized so far was closed from a hand-written file of choices, and most of
 * what those files held was not a choice. Measured on the three games that realize: the target's width and
 * each channel's length are lines whose authored bound has ONE member, so any other value is refused — the
 * files' own reasons said so (*"the single member of the authored bound … the only value inside the bound"*).
 * Writing that value out by hand for every game is a decision nobody is making, and it meant a game with no
 * file could not be set out at all.
 *
 * **The two rules. Each yields a value only where the knowledge and the session admit exactly one.**
 *
 *   1. `ONLY_MEMBER_OF_AUTHORED_BOUND` — the line carries no set of alternatives, and the members common to
 *      every set it is bounded by come to exactly one. That member.
 *   2. `ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS` — the line is bounded by whole-number counts and one of them
 *      is an authored PREFERRED range. Of the whole numbers inside that range and inside what is required,
 *      the one for which the roster comes out whole — when exactly one does. It is a STARTING value: the
 *      range stays beside it in the record (`within`), which is what a later adjustment needs.
 *
 * **Nothing else is defaulted, and that is the point of writing the rules down rather than a table of
 * values.** A set of alternatives is a design decision (a line or a zone; which event scores): it needs an
 * entry. A line bounded only by a term in words is the coach's: it needs an entry. A range with no authored
 * preference, a preference the session admits two values of, a preference it admits none of: no default,
 * and realization refuses the line as open and unchosen, exactly as it always has. No arbitrary value is
 * ever produced — not a midpoint, not a minimum, not the first that fits.
 *
 * **A default never overrides a choice.** `realize` consults one only for a line that is open and that
 * nobody chose a value for, and it passes every check a choice passes. It is recorded as a choice, marked
 * with the rule (`defaultedBy`), so no default can later read as a decision somebody made.
 *
 * An exclusion's bound says what a line may NOT be and is never a source for either rule (`Bounds.forbidden`).
 */
import { GateContext } from '../derivation/gates'
import { RegisterIndex } from '../derivation/register'
import { OpenChoice, ResolvedGame } from '../derivation/resolved-game'
import { Bounds } from '../derivation/types'
import { rosterRefusal } from './assemble-concrete-game'
import { Choice, Instantiation, isRefused, JustifiedDefault, RealizationResult, realize } from './realize'

/** The bounds that say what a line may be. */
const permitting = (open: OpenChoice): Bounds[] => (open.bounds as Bounds[]).filter(bound => bound && !bound.forbidden)

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/** Rule 1's subject: the one value the line's sets permit, or nothing. */
function onlyMember(open: OpenChoice): { value: unknown } | null {
    // A set of alternatives is somebody's decision however small. A permitted set of one is not open at all.
    if (open.permitted) return null
    const sets = permitting(open).filter(bound => bound.kind === 'SET' && Array.isArray(bound.members))
    if (!sets.length) return null
    const common = sets[0].members!.filter(member => sets.every(set => set.members!.some(other => same(other, member))))
    return common.length === 1 ? { value: common[0] } : null
}

const whole = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)

/**
 * Rule 2's candidates: the whole numbers inside the authored preferred range and inside every requirement,
 * with the two ranges they were read from. Null where the line is not such a count.
 *
 * It is deliberately hard to qualify. Every numeric bound must be a whole-number count in its own units —
 * a fraction of an axis is an extent, not a count; there must be an authored preference, or there is nothing
 * to prefer; and the preference must close the range at both ends, or there is no finite set to look in.
 */
export function preferredCounts(open: OpenChoice): { candidates: number[]; preferred: { min: number; max: number }; required: { min: number | null; max: number | null } } | null {
    if (open.permitted) return null
    const bounds = permitting(open)
    if (bounds.some(bound => bound.kind !== 'COUNT')) return null
    if (bounds.some(bound => bound.fractionOfAxis)) return null
    const limits = (wanted: Bounds[], which: 'min' | 'max'): number[] | null => {
        const stated = wanted.map(bound => bound[which]).filter(limit => limit !== null && limit !== undefined)
        return stated.every(whole) ? (stated as number[]) : null
    }
    const preferredBounds = bounds.filter(bound => bound.preferred)
    const requiredBounds = bounds.filter(bound => !bound.preferred)
    if (!preferredBounds.length) return null
    const [preferredMins, preferredMaxes, requiredMins, requiredMaxes] = [limits(preferredBounds, 'min'), limits(preferredBounds, 'max'), limits(requiredBounds, 'min'), limits(requiredBounds, 'max')]
    if (!preferredMins || !preferredMaxes || !requiredMins || !requiredMaxes) return null
    if (!preferredMins.length || !preferredMaxes.length) return null
    const preferred = { min: Math.max(...preferredMins), max: Math.min(...preferredMaxes) }
    const required = { min: requiredMins.length ? Math.max(...requiredMins) : null, max: requiredMaxes.length ? Math.min(...requiredMaxes) : null }
    const from = Math.max(preferred.min, required.min ?? preferred.min)
    const to = Math.min(preferred.max, required.max ?? preferred.max)
    const candidates: number[] = []
    for (let n = from; n <= to; n++) candidates.push(n)
    return { candidates, preferred, required }
}

/**
 * Does the roster come out whole with this value in the game? Asked of rule 2's candidates one at a time,
 * with rule 1's defaults already in place beside it.
 */
export type RosterAdmits = (candidate: JustifiedDefault, alongside: JustifiedDefault[]) => boolean

/**
 * The defaults for a resolved game, given the choices somebody did make.
 *
 * Without `rosterAdmits` only rule 1 can apply: rule 2 is a statement about the session, and a caller that
 * cannot say whether the roster comes out whole is given no count on trust.
 */
export function justifiedDefaults(resolved: ResolvedGame, choices: Choice[], rosterAdmits?: RosterAdmits): JustifiedDefault[] {
    const chosen = new Set(choices.map(choice => choice.lineId))
    const unchosen = resolved.open.filter(open => !chosen.has(open.lineId))

    const only: JustifiedDefault[] = []
    for (const open of unchosen) {
        const member = onlyMember(open)
        if (!member) continue
        only.push({
            lineId: open.lineId,
            value: member.value,
            because:
                `Closed by rule, not chosen: the authored bound on this line has exactly one member, ${JSON.stringify(member.value)}, ` +
                `so it is the only value the knowledge permits here and any other would be refused.`,
            rule: 'ONLY_MEMBER_OF_AUTHORED_BOUND',
        })
    }
    if (!rosterAdmits) return only

    const counted: JustifiedDefault[] = []
    for (const open of unchosen) {
        if (only.some(entry => entry.lineId === open.lineId)) continue
        const counts = preferredCounts(open)
        if (!counts) continue
        const offer = (value: number): JustifiedDefault => ({ lineId: open.lineId, value, because: '', rule: 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS' })
        const admitted = counts.candidates.filter(value => rosterAdmits(offer(value), only))
        // Two that fit is a decision; none that fit is a session the preference does not reach. Neither is defaulted.
        if (admitted.length !== 1) continue
        const [value] = admitted
        const others = counts.candidates.filter(candidate => candidate !== value)
        counted.push({
            ...offer(value),
            because:
                `Closed by rule, as a STARTING value: of the whole numbers inside the authored preferred range ${counts.preferred.min} to ${counts.preferred.max}` +
                `${counts.required.min !== null || counts.required.max !== null ? ` and inside what is required (${counts.required.min ?? 'no minimum'} to ${counts.required.max ?? 'no maximum'})` : ''}, ` +
                `${value} is the only one for which this session's roster comes out whole` +
                `${others.length ? ` (${others.join(', ')} ${others.length === 1 ? 'does' : 'do'} not)` : ''}. ` +
                `The range stays beside it; this is where the activity starts, not where it must stay.`,
        })
    }
    return [...only, ...counted]
}

/** What somebody supplied for a game: the choices and the members to instantiate. */
export interface Supplied {
    choices: Choice[]
    instantiations: Instantiation[]
}

/**
 * The defaults for a game on the pathway, where the roster rule can be asked.
 *
 * **Rule 2 asks the roster rule itself**, by realizing the game with the candidate in it and reading what
 * the rule then says — the same rule, over the same kind of game, that assembly will apply to the result.
 * A second statement of "the players divide evenly" written here would be free to disagree with it, and the
 * two disagreeing is a default the roster then refuses.
 */
export function justifiedDefaultsOnPathway(
    resolved: ResolvedGame,
    supplied: Supplied,
    index: RegisterIndex | undefined,
    envelope: { lengthM?: number; widthM?: number } | undefined,
    ctx: GateContext,
): JustifiedDefault[] {
    return justifiedDefaults(resolved, supplied.choices, (candidate, alongside) => {
        const trial = realize(resolved, supplied.choices, supplied.instantiations, index, envelope, [...alongside, candidate])
        return !isRefused(trial) && rosterRefusal(ctx, trial) === null
    })
}

/** Realize a game from what was supplied plus the justified defaults — the one call every pathway caller makes. */
export function realizeWithJustifiedDefaults(
    resolved: ResolvedGame,
    supplied: Supplied,
    index: RegisterIndex | undefined,
    envelope: { lengthM?: number; widthM?: number } | undefined,
    ctx: GateContext,
): { realization: RealizationResult; defaults: JustifiedDefault[] } {
    const defaults = justifiedDefaultsOnPathway(resolved, supplied, index, envelope, ctx)
    return { realization: realize(resolved, supplied.choices, supplied.instantiations, index, envelope, defaults), defaults }
}
