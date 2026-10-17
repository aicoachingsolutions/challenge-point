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
 *   1. `ONLY_MEMBER_OF_AUTHORED_BOUND` — the line carries no set of alternatives and no required numeric
 *      range, and the members common to every set it is bounded by come to exactly one. That member. It may
 *      be the one value the knowledge REQUIRES or the one it authors as a PREFERRED default; both are the
 *      only value authored for the line, and the reason recorded with the default says which it was.
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
 * **And `realize` does not take one on trust.** A default is refused there unless the line is one its rule
 * closes and the value is the one the rule yields, so nothing handed in under a rule's name — from here or
 * from anywhere else — can close a set of alternatives or a coach's row.
 *
 * An exclusion's bound says what a line may NOT be and is never a source for either rule (`Bounds.forbidden`).
 */
import { DesignationBinding } from '../derivation/designation'
import { GateContext } from '../derivation/gates'
import { RegisterIndex } from '../derivation/register'
import { ResolvedGame } from '../derivation/resolved-game'
import { rosterRefusal, RosterRefusal } from './assemble-concrete-game'
import { Choice, Instantiation, isRefused, JustifiedDefault, onlyPermittedMember, preferredCounts, RealizationResult, realize, SatisfiedByEstablished } from './realize'

/**
 * What each rule is ABOUT — which line is its subject and which value it yields — is stated once, in
 * `realize.ts`, beside the bound check it has to agree with (`onlyPermittedMember`, `preferredCounts`). It
 * is read from there by this module, which produces a default, and by `realize`, which refuses one that is
 * not what its rule yields. Two statements of a rule are two rules the first time one is edited.
 */
export { preferredCounts } from './realize'

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
    return decide(resolved, choices, rosterAdmits).defaults
}

/**
 * A count rule 2 looked at and did NOT close: the candidates it had, and which of them the roster admitted.
 *
 * Two admitted is a decision and stays one. NONE admitted is a different thing and was indistinguishable
 * from it: the session cannot field any count the knowledge prefers, which is the coach's numbers to change
 * and not a set-up decision anybody failed to make. Kept so a caller can tell the two apart from structure.
 */
export interface UndefaultedCount {
    lineId: string
    path: string
    candidates: number[]
    admitted: number[]
}

function decide(resolved: ResolvedGame, choices: Choice[], rosterAdmits?: RosterAdmits): { defaults: JustifiedDefault[]; undefaulted: UndefaultedCount[] } {
    const undefaulted: UndefaultedCount[] = []
    const chosen = new Set(choices.map(choice => choice.lineId))
    const unchosen = resolved.open.filter(open => !chosen.has(open.lineId))

    const only: JustifiedDefault[] = []
    for (const open of unchosen) {
        const member = onlyPermittedMember(open)
        if (!member) continue
        only.push({
            lineId: open.lineId,
            value: member.value,
            /**
             * **The reason says which kind of single member it is.** It said of every one that it is *"the
             * only value the knowledge permits here"*. Measured in the review of 13 October: all four lines
             * this rule closes in the corpus carry their one member from a PREFERRED default, and what the
             * knowledge prefers is not all that it permits. Such a default is still justified — it is the
             * value the knowledge itself gives to start from, and the only one authored — but the record of
             * it may not turn the preference into a requirement, which is the status change his fidelity
             * questions exist to catch.
             */
            because: member.preferred
                ? `Closed by rule, not chosen: exactly one value is authored for this line, ${JSON.stringify(member.value)}, and it is authored as a ` +
                  `PREFERRED default — the value the knowledge gives to start from, not a requirement. No other value is authored for the line, ` +
                  `and realization holds a value to the authored set, so no other is accepted today.`
                : `Closed by rule, not chosen: the authored bound on this line has exactly one member, ${JSON.stringify(member.value)}, ` +
                  `so it is the only value the knowledge permits here and any other would be refused.`,
            rule: 'ONLY_MEMBER_OF_AUTHORED_BOUND',
        })
    }
    if (!rosterAdmits) return { defaults: only, undefaulted }

    const counted: JustifiedDefault[] = []
    for (const open of unchosen) {
        if (only.some(entry => entry.lineId === open.lineId)) continue
        const counts = preferredCounts(open)
        if (!counts) continue
        const offer = (value: number): JustifiedDefault => ({ lineId: open.lineId, value, because: '', rule: 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS' })
        const admitted = counts.candidates.filter(value => rosterAdmits(offer(value), only))
        // Two that fit is a decision; none that fit is a session the preference does not reach. Neither is defaulted.
        if (admitted.length !== 1) {
            undefaulted.push({ lineId: open.lineId, path: open.path, candidates: counts.candidates, admitted })
            continue
        }
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
    return { defaults: [...only, ...counted], undefaulted }
}

/** What somebody supplied for a game: the choices and the members to instantiate. */
export interface Supplied {
    choices: Choice[]
    instantiations: Instantiation[]
    /** Recorded identifications of one established element with another (realize.ts, `SatisfiedByEstablished`). */
    satisfiedByEstablished?: SatisfiedByEstablished[]
    /** Which instantiated team holds each setup assignment (realize.ts, `DesignationBinding`; his M2, 15 October 2026). */
    designationBindings?: DesignationBinding[]
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
    return onPathway(resolved, supplied, index, envelope, ctx).defaults
}

/**
 * A count that has an authored preferred range, NONE of whose members this session's roster admits — with
 * the roster rule's own cause for each candidate, in candidate order.
 *
 * Added 13 October with the neutral count, which is the first line rule 2 closes on the pathway. With two
 * players, neither one neutral nor two leaves two equal teams, so the rule closes nothing, the line stays
 * open, and the game is refused as *"open and was not chosen"* — true of the line, and to a coach a
 * statement that somebody had a decision to make, when what is wrong is the number of players they entered.
 * The causes are kept so the caller can say that instead, from the roster rule's typed facts.
 * `refusals` is empty where a trial did not get as far as the roster, and then nothing is concluded from it.
 */
export interface StrandedCount extends UndefaultedCount {
    refusals: RosterRefusal[]
}

function onPathway(
    resolved: ResolvedGame,
    supplied: Supplied,
    index: RegisterIndex | undefined,
    envelope: { lengthM?: number; widthM?: number } | undefined,
    ctx: GateContext,
): { defaults: JustifiedDefault[]; stranded: StrandedCount[] } {
    const trial = (candidate: JustifiedDefault, alongside: JustifiedDefault[]) =>
        realize(resolved, supplied.choices, supplied.instantiations, index, envelope, [...alongside, candidate], supplied.satisfiedByEstablished ?? [], supplied.designationBindings ?? [], ctx.roleBlock ?? null)
    const { defaults, undefaulted } = decide(resolved, supplied.choices, (candidate, alongside) => {
        const realized = trial(candidate, alongside)
        return !isRefused(realized) && rosterRefusal(ctx, realized) === null
    })
    const only = defaults.filter(entry => entry.rule === 'ONLY_MEMBER_OF_AUTHORED_BOUND')
    const stranded = undefaulted
        .filter(count => !count.admitted.length)
        .map(count => ({
            ...count,
            refusals: count.candidates.flatMap(value => {
                const realized = trial({ lineId: count.lineId, value, because: '', rule: 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS' }, only)
                const refusal = isRefused(realized) ? null : rosterRefusal(ctx, realized)
                return refusal ? [refusal] : []
            }),
        }))
    return { defaults, stranded }
}

/** Realize a game from what was supplied plus the justified defaults — the one call every pathway caller makes. */
export function realizeWithJustifiedDefaults(
    resolved: ResolvedGame,
    supplied: Supplied,
    index: RegisterIndex | undefined,
    envelope: { lengthM?: number; widthM?: number } | undefined,
    ctx: GateContext,
): { realization: RealizationResult; defaults: JustifiedDefault[]; stranded: StrandedCount[] } {
    const { defaults, stranded } = onPathway(resolved, supplied, index, envelope, ctx)
    return { realization: realize(resolved, supplied.choices, supplied.instantiations, index, envelope, defaults, supplied.satisfiedByEstablished ?? [], supplied.designationBindings ?? [], ctx.roleBlock ?? null), defaults, stranded }
}
