/**
 * The final concrete-game assembly boundary — where a value that becomes derivable only once the game
 * exists is written INTO the game.
 *
 * His ruling of 1 October, and the reason this module exists rather than living inside the gate:
 *
 *   > *If a value is deterministically derived and used by an invariant to certify the concrete game, and
 *   > that value is operationally necessary for a coach to run the game, it must survive into the concrete
 *   > game. … Please put that write-back at the realization/final concrete-game assembly boundary rather
 *   > than in rendering. More generally, I want to avoid values existing only transiently inside
 *   > validation when downstream consumers legitimately need them.*
 *
 * The defect that produced the ruling: `GA-ROSTER-SUM` derived six outfield players a side, passed on that
 * figure, and the figure existed only in the gate's own evaluation context. A04 was certified
 * render-eligible with teams that had no size.
 *
 * Two consequences of putting it here, both deliberate:
 *
 *   - **the gate goes back to being read-only.** It had become a writer against its own documented
 *     contract. Assembly writes; validation reads.
 *   - **the invariant now reads the persisted game.** `concreteContext` reads each instantiated member's
 *     properties out of `realized.game`, not out of the realization record, so there is no longer a
 *     representation in which a check can be satisfied by a value the artifact lacks. The class of defect
 *     is removed rather than guarded against.
 *
 * **These are not realization choices.** Nothing is selected and nothing is bounded. Each value is
 * entailed, and each entry carries the chain that entails it, so `nothingInvented` can account for it by
 * name rather than by the blanket permission that membership of an instantiation used to confer.
 */

import { ClassifiedLine, reasonFor } from '../derivation/classify'
import type { ObjectSuitability } from '../derivation/corpus'
import { Comparison, comparisonOf } from '../derivation/comparison'
import { countBounds, DerivedLine, entails, resolvedValue } from '../derivation/derive'
import { namesParticularTeams } from '../derivation/realization-deferral'
import { GateContext } from '../derivation/gates'
import { toRational } from '../derivation/rational'
import { memberDesignations, whyNotReached } from '../derivation/designation'
import { reaches } from '../derivation/reach'
import { splitPath } from '../derivation/resolved-game'
import { resolveScopes } from '../derivation/scope'
import { parseSelector } from '../derivation/selector'
import { LoadedContract } from '../derivation/types'
import { collectionPath, place, readAt, RealizationRecord, Realized } from './realize'

/** Both sides of the comparison name the given row — i.e. it is a statement about that property. */
const sameRow = (comparison: Comparison, row: string): boolean =>
    'row' in comparison.left && 'row' in comparison.right && comparison.left.row === row && comparison.right.row === row

/** A value entailed once the concrete game exists, with the member address it belongs at. */
export type Entailment = RealizationRecord['entailed'][number]

/**
 * The member as it sits in the concrete game — the thing a consumer will actually read.
 *
 * **Addressed by its opaque handle, not by its position.** It used to index the array, which was the only
 * way to tell two members of one claim apart before handles existed and which meant every per-member
 * address in this module depended on the order realization happened to place them in.
 */
export function memberInGame(realized: Realized, collection: string, handle: string): Record<string, unknown> | null {
    const bucket = readAt(realized.game, collection)
    if (!Array.isArray(bucket)) return null
    const member = (bucket as unknown[]).find(entry => entry && typeof entry === 'object' && (entry as Record<string, unknown>).elementId === handle)
    return member && typeof member === 'object' ? (member as Record<string, unknown>) : null
}

/**
 * **Complete the concrete game.** Called once, between realization and anything that reads the game.
 *
 * It asks the general question — which properties of an instantiated member are derivable now that the
 * member exists, and absent from the game? — so a property that becomes derivable later rides the same
 * route rather than each one having to remember to persist itself. The roster is the first such rule and
 * currently the only one; adding another means adding to `RULES`.
 */
export function completeConcreteGame(ctx: GateContext, realized: Realized): Entailment[] {
    const entailments: Entailment[] = []
    for (const rule of RULES) rule(ctx, realized, entailments)

    for (const entailment of entailments) {
        const member = memberInGame(realized, entailment.collection, entailment.handle)
        if (!member) continue
        place(member, entailment.leaf, entailment.value)
    }
    realized.record.entailed = entailments
    return entailments
}

/** A rule that may supply values for properties of instantiated members. */
type EntailmentRule = (ctx: GateContext, realized: Realized, into: Entailment[]) => void

/**
 * **Why the roster rule derived nothing — one named cause each.**
 *
 * The rule used to `return` from five different places, and every one of them reached a caller as the same
 * sentence: the roster gate reporting that its subject lines had failed. Measured on 13 October before this
 * existed — nine players, one player, seven and a half players, availability absent, availability `{}`, and
 * more specialized performers than players all produced the identical `GA-ROSTER-SUM … NOT_EVALUABLE`. A
 * coach with nine players and a coach who was never asked about a specialized role were told the same thing,
 * and neither could act on it.
 *
 * The cause is a closed code and the facts travel beside it, so a caller builds its own sentence from the
 * numbers and never has to read `why`. `why` is this layer's account, for the technical record.
 */
export type RosterRefusal =
    /** The envelope carries no session player count. */
    | { cause: 'PLAYERS_NOT_STATED'; why: string }
    /** Availability of a specialized role is not stated — `role` is null where none is stated at all. */
    | { cause: 'AVAILABILITY_NOT_STATED'; role: string | null; why: string }
    /** A stated availability is not a whole, non-negative number of people. */
    | { cause: 'AVAILABILITY_NOT_A_COUNT'; role: string; stated: unknown; why: string }
    /** Realization instantiated no team, so there is no member to give a size to. */
    | { cause: 'NO_INSTANTIATED_TEAMS'; why: string }
    /** No authoritative REQUIRED equality on the outfield count: nothing licenses dividing the players evenly. */
    | { cause: 'EQUALITY_NOT_AUTHORED'; why: string }
    /** The neutral count is required and unestablished, or is not a number. */
    | { cause: 'NEUTRALS_NOT_SETTLED'; why: string }
    /** How many of a specialized role a team has in THIS game is required and unestablished. */
    | { cause: 'INVOLVEMENT_NOT_SETTLED'; role: string; why: string }
    /** The game involves more of a specialized role than the session has. `perTeam` is null where teams differ. */
    | { cause: 'AVAILABILITY_SHORT'; role: string; perTeam: number | null; teams: number; needed: number; available: number; why: string }
    /** What is left for the outfield does not split into whole equal teams. */
    | { cause: 'DOES_NOT_DIVIDE'; players: number; teams: number; involved: number; neutrals: number; why: string }
    /** Nobody is left for the outfield: every team would have fewer than one outfield player. */
    | { cause: 'NO_OUTFIELD_PLAYERS'; players: number; teams: number; involved: number; neutrals: number; why: string }
    /**
     * The outfield count is authored per team, and no allocation the authored counts admit fits this session (15 October
     * 2026, stage K4). `fits` are the session player counts that would fit, as the rule itself answers them — null where the
     * authored counts set no upper limit to search to.
     */
    | { cause: 'CONFIGURATION_DOES_NOT_FIT'; players: number; involved: number; neutrals: number; fits: number[] | null; why: string }
    /**
     * The outfield count is authored per team and only an unequal allocation fits, while an equal-numbers requirement is in
     * force — no knowledge-authorized realization lets it defer (ruling C56) — so nothing licenses the asymmetry (stage K4).
     */
    | { cause: 'NO_AUTHORIZED_ASYMMETRY'; why: string }
    /**
     * The outfield count is authored per team and what it says of a team is undetermined, a team has no authored count, or
     * more than one allocation fits and nothing authored decides between them (stage K4). Never chosen.
     */
    | { cause: 'ALLOCATION_NOT_SETTLED'; why: string }

/** The items that decide one member's value, where an item speaks of particular teams (stage K4; see `Entailment`). */
type Supported = { supportedBy?: { contractId: string; itemId: string }[] }

/** What the roster rule derived: a size for every instantiated team, and each team's specialized-role involvement. */
interface Roster {
    teams: Realized['record']['instantiations']
    /**
     * Each team's outfield count, `outfield[i]` belonging to `teams[i]`, with why. One number for every team where equality
     * is authored; the counts authored per team, closed from the session total, where a realization authors them (stage K4,
     * which replaced the single `perTeam`).
     */
    outfield: ({ value: number; because: string } & Supported)[]
    /** One entry per specialized-role row, `perTeam[i]` belonging to `teams[i]`. */
    involvement: { rowId: string; role: string; available: number; perTeam: ({ value: number; basis: string } & Supported)[] }[]
    /** The recorded realization choices the neutral count was read from — empty where derivation settled it. */
    neutralChoices: Realized['record']['choices']
    players: number
    chain: string
}

/**
 * "Suppose this line held this count", or "suppose the session had this many players": the roster rule's own answer for a
 * count other than the one in the game. The player count joined on 15 October 2026 (stage K4), so the counts a per-team
 * allocation admits are the rule's answer too, never a second statement of its arithmetic.
 */
interface Supposing {
    lineId?: string
    value?: number
    players?: number
}

const isRosterRefusal = (outcome: Roster | RosterRefusal): outcome is RosterRefusal => 'cause' in outcome

/** A whole, non-negative count, read the way the roster gate reads its terms (§1.9) — so `"1"` is 1. */
const wholeCount = (value: unknown): number | null => {
    const exact = toRational(value)
    return exact && exact.d === 1n && exact.n >= 0n ? Number(exact.n) : null
}

/** His distinction of 29 September, in one place for both reads: withdrawn, excluded and not-constrained are answers. */
const establishedAbsence = (line: { lineState: string }, entry: ClassifiedLine | undefined): boolean =>
    line.lineState === 'WITHDRAWN' || (entry?.verdict === 'NOT_AUTHORED' && (entry.reason === 'excluded' || entry.reason === 'not constrained'))

/**
 * The roster, derived from the session and the authored knowledge — never chosen, and never assumed.
 *
 * His stated chain of 1 October: *"12 available performers → 0 specialized roles available → 0 neutrals
 * → 2 teams → equal outfield counts → 6 outfield players per team."* Every step comes from a legitimate
 * source, which is the whole condition:
 *
 *   - **the session total** from the envelope (`players`);
 *   - **specialized-role AVAILABILITY** from the envelope's stated `roles`, as explicit counts of people. An
 *     absent entry means NOT STATED and derives nothing — which is what stops this treating every available
 *     performer as an outfield player whenever nobody mentioned a specialized role;
 *   - **specialized-role INVOLVEMENT** read from the game (see `involvementOf` below), never from the session;
 *   - **neutrals** read from the `P5` line (see below);
 *   - **the team count** from the instantiated members of the authored claim;
 *   - **equality** from an authored REQUIRED item, read from the knowledge rather than assumed here.
 *     **Equality is not an engine rule**: this fires only where such an item exists, so a game form
 *     authoring asymmetry never reaches this path.
 *
 * **Availability is not involvement — repaired 13 October.** His rule of 30 September, recorded on
 * `Envelope.roles`: *"Stating availability is not stating involvement: a role available in the session is
 * instantiated into a particular game only where the selected knowledge establishes it."* This rule did not
 * implement it. It took every stated count off EVERY team's outfield and wrote the stated count onto each
 * team, so a session with one such performer available turned a game that involves none into two teams of
 * five from twelve players — two people gone from the activity, a specialized role the knowledge never
 * established written into both teams, and every check green, because the sum the roster gate verifies was
 * built from the same wrong terms. What a team holds for a specialized-role row is now what the GAME
 * involves; the session's count only has to cover it.
 *
 * It refuses on anything missing, and a division that does not come out whole derives nothing rather than
 * rounding — a rounded roster is an invented one. Each refusal names its cause.
 *
 * `supposing` asks the same rule about a count the game does not hold — *would the roster come out whole
 * with three neutrals?* — so the valid alternatives are the rule's own answer and never a second statement
 * of its arithmetic (`countsTheRosterAdmits`).
 */
function rosterFor(ctx: GateContext, realized: Realized, supposing?: Supposing): Roster | RosterRefusal {
    const envelope = ctx.envelope as { players?: unknown; roles?: Record<string, number> } | undefined
    const players = supposing?.players ?? Number(envelope?.players)
    const roles = envelope?.roles
    if (!Number.isFinite(players)) return { cause: 'PLAYERS_NOT_STATED', why: 'the envelope carries no session player count' }
    if (!roles) {
        return {
            cause: 'AVAILABILITY_NOT_STATED',
            role: null,
            why: 'the session states no specialized-role availability at all, and an absent statement is NOT STATED rather than none available',
        }
    }

    // The instantiated members of the teams collection, with their addresses in the game.
    const teams = realized.record.instantiations.filter(
        instantiation => ctx.classes.find(c => c.classId === instantiation.classId)?.row === 'P1' && !!instantiation.handle,
    )
    if (!teams.length) return { cause: 'NO_INSTANTIATED_TEAMS', why: 'realization instantiated no member of the teams collection' }

    /**
     * **Equality must be DECLARED, authoritative, and REQUIRED.**
     *
     * His instruction of 3 October: *"please don't introduce another mechanism or continue relying on prose
     * matching for `"equal"`"*. So the equality is now read from a typed `COMPARES` relationship on the item —
     * the kind AM-16 registered on 20 September and that nothing had used — rather than by matching the word
     * in the item's prose.
     *
     * That retires the sharper of two defects this derivation has already had:
     *   - `/equal/i` **matched its own negation.** An AUTHORED P2 item reads *"unequal between the teams, e.g.
     *     4 and 6 (4v6)"*, so an item stating asymmetry licensed an equal division. `\bequal` patched the
     *     symptom; reading a declared relation removes the class — prose is no longer consulted at all.
     *   - **An example is not a requirement.** That item is a `TYPICAL_EXAMPLE`; neither it nor a
     *     `PREFERRED_DEFAULT` may license a universal division. `GF2-14.b`, the item he promoted for this
     *     purpose, is `REQUIRED_RANGE`.
     *
     * **Reading that equality is asserted is not the same as evaluating the comparison.** Per `relation:
     * NARROWS`, a comparison *"never entails a value"*, so it does not produce the roster: it narrows the
     * space to equal counts, and the session total then fixes the number. Evaluating the comparison against
     * the finished game is a separate obligation, and `comparison.stillOpen` currently refuses it — see
     * `comparison.ts`.
     */
    const equalityItems = ctx.contracts.flatMap(contract =>
        (contract.items ?? [])
            .filter(item => {
                if (String(item.row) !== 'P2') return false
                if (String((item as { valueStatus?: unknown }).valueStatus) !== 'REQUIRED_RANGE') return false
                const comparison = comparisonOf(String(contract.contractId), item as unknown as Record<string, unknown>)
                // An assumed comparison bounds and never entails (SD-27 / §3), so it may not license a division.
                return !!comparison && comparison.authoritative && comparison.operator === '=' && sameRow(comparison, 'P2')
            })
            .map(item => `${contract.contractId}::${item.itemId}`),
    )
    const equality = equalityItems.length > 0

    let scopes: ReturnType<typeof resolveScopes> | null = null
    const scoped = () => (scopes = scopes ?? resolveScopes(ctx.contracts, ctx.classes, ctx.index))

    /** The member as the engine asks about it: its claim's class, carrying what the designation resolver says it meets. */
    const memberOf = (instantiation: Roster['teams'][number]) => {
        const claim = ctx.classes.find(candidate => candidate.classId === instantiation.classId)
        if (!claim) return null
        const designations = ctx.index.designations.teamsRow === claim.row ? memberDesignations(ctx.index, claim.row, instantiation.handle, realized.record.designationBindings ?? [], realized.record.roleBlock ?? null) : undefined
        return { claim, designations, member: { ...claim, constraints: { any: false, terms: [] }, ...(designations ? { designations } : {}) } }
    }

    /**
     * **The outfield count a realization authors for THIS team** — 15 October 2026 (stage K4), for his two starting
     * configurations of 17 October 2026 (D6, quoted on the items that carry them in provisional-realizations.json) and the
     * principle beside them: *"player allocation should reflect representative numerical relationships, not default to equal
     * outfield numbers regardless of the Learning Goal."*
     *
     * Only items that speak of PARTICULAR teams are read here (`namesParticularTeams`: a designation that is not every team),
     * so a selector of `*` — the equality above, an example, a typical split — is never mistaken for one team's count, and
     * a game with no such item takes the equal path exactly as before. Each item is put the questions `authoredFor` puts
     * (scope, reach, requirement): an item that speaks of another team is passed over (and kept, because it is why this team
     * has its count); undetermined reach, an assumed or preferred item, or a count in words leaves the count unsettled. What
     * is read is the authored SET of counts — one number from an entailing item, a typed or numeric range otherwise — and
     * two items intersect. Null where no team-naming item exists on the row at all.
     */
    const outfieldAuthoredFor = (instantiation: Roster['teams'][number]): ({ min: number | null; max: number | null; from: string[] } & Supported) | { unsettled: string } | null => {
        const speaking = ctx.contracts.flatMap(contract =>
            (contract.items ?? []).filter(item => String(item.row) === 'P2' && namesParticularTeams(item, ctx.index)).map(item => ({ contractId: String(contract.contractId), item })),
        )
        if (!speaking.length) return null
        const asked = memberOf(instantiation)
        if (!asked) return { unsettled: `the class ${instantiation.classId} this team satisfies is not in the run` }
        let min: number | null = null
        let max: number | null = null
        const from: string[] = []
        const supportedBy: { contractId: string; itemId: string }[] = []
        for (const { contractId, item } of speaking) {
            const name = `${contractId}::${item.itemId}`
            const parsed = parseSelector(item.selector, 'P2', ctx.index)
            if (!parsed.predicate) return { unsettled: `${name} is authored on P2 with a selector that cannot be read (${parsed.defect})` }
            const reach = reaches(parsed.predicate, asked.member)
            supportedBy.push({ contractId, itemId: item.itemId })
            if (reach === 'FALSE') continue
            const application = scoped().applicationSets.find(set => set.item.contractId === contractId && set.item.itemId === item.itemId)
            if (!application?.classIds.includes(instantiation.classId)) return { unsettled: `${name} is authored on P2 and its scope does not take in this team's class, so what it says of this team is not established` }
            if (reach !== 'TRUE') {
                const named = parsed.predicate.terms.flatMap(term => (term.op === 'IN' ? term.values : term.op === '=' ? [term.value] : []))
                const why = whyNotReached(asked.designations, named)
                return { unsettled: `${name} speaks of particular teams (${JSON.stringify(item.selector)}), and whether it reaches this team is undetermined${why ? ` (${why})` : ''}` }
            }
            if (String((item as { valueStatus?: unknown }).valueStatus) !== 'REQUIRED_RANGE' || item.basis === 'ASSUMED' || item.strictness === 'EXCLUSION') {
                return { unsettled: `${name} speaks about P2 without fixing it as a requirement, and a count nobody fixed is not one to choose here` }
            }
            const exact = entails(item) ? wholeCount(item.value) : null
            const bounds = exact !== null ? { min: exact, max: exact } : countBounds(item)
            if (!bounds || (bounds.min !== null && !Number.isInteger(bounds.min)) || (bounds.max !== null && !Number.isInteger(bounds.max))) {
                return { unsettled: `${name} holds ${JSON.stringify(item.value)}, which states no whole count of players` }
            }
            min = bounds.min === null ? min : Math.max(min ?? bounds.min, bounds.min)
            max = bounds.max === null ? max : Math.min(max ?? bounds.max, bounds.max)
            from.push(`${name} (${String(item.selector)}: ${String(item.value)})`)
        }
        if (!from.length) return { unsettled: `the outfield count is authored for particular teams (${speaking.map(s => `${s.contractId}::${s.item.itemId}`).join(', ')}), and none of it reaches this team` }
        return { min, max, from, supportedBy }
    }
    const allocation = teams.map(outfieldAuthoredFor)
    const perTeamAuthored = allocation.some(entry => entry !== null)

    if (!equality && !perTeamAuthored) {
        return { cause: 'EQUALITY_NOT_AUTHORED', why: 'no authoritative REQUIRED equality is authored on P2, so nothing licenses dividing the players evenly' }
    }

    // A count must be a whole, non-negative number of people. Without this a stated `-1` passes every
    // comparison below as "covered", and a fractional person is not something a session can have.
    for (const [role, stated] of Object.entries(roles)) {
        if (!Number.isInteger(stated) || Number(stated) < 0) {
            return { cause: 'AVAILABILITY_NOT_A_COUNT', role, stated, why: `the session states ${JSON.stringify(stated)} for ${role}, which is not a whole, non-negative number of people` }
        }
    }

    /**
     * **Neutrals, read from the P5 line.**
     *
     * This was `classes.filter(c => c.row === 'P5' && c.classId.startsWith('realized:')).length`, which is
     * **structurally always zero**: `P5` is `performers.neutrals.count`, a FIELD, and a `realized:` class
     * exists only for an existential claim on a COLLECTION row. The subtrahend was not read from the game
     * at all — it was a filter that could not match, right for A04 by accident. A game that *did* establish
     * neutrals would have had them ignored and its outfield pool overstated.
     *
     * The three cases follow his governing distinction of 29 September — *"an established absence is an
     * answer, not an obstruction"*: a resolved value is used; an established absence contributes nothing;
     * required-but-unestablished **refuses**, because nothing may be assumed about a count the knowledge
     * has not settled.
     *
     * **A count realization CLOSED is a resolved value too — completed 13 October.** The knowledge may
     * leave the count open inside an authored range (*"one or more"*), and realization then closes it. This
     * read looked only in the derived context, where such a line is still open, so it called the count
     * unsettled and returned: measured on the possession game with a neutral condition, realization recorded
     * two neutrals, no team got a size, and the roster gate could not be evaluated — no neutral
     * configuration could validate, whatever else was built. The recorded choice has already passed the
     * authored bound, so it is read here where derivation holds no value, and the chain says that is where
     * the number came from.
     *
     * **And it is read as a whole count**, the way the specialized-role read below reads one. This wanted
     * a JavaScript number where the roster gate accepts `"1"`, and took 1.5 as a count of people.
     */
    const neutralLines = ctx.lines.filter(line => String(line.row) === 'P5')
    if (!neutralLines.length) return { cause: 'NEUTRALS_NOT_SETTLED', why: 'no P5 line exists, so the neutral count cannot be read' }
    let neutrals = 0
    const neutralChoices: Roster['neutralChoices'] = []
    for (const line of neutralLines) {
        const derivedValue = resolvedValue(ctx.derived.get(line.lineId))?.value
        const chosen = derivedValue === undefined ? realized.record.choices.find(choice => choice.lineId === line.lineId) : undefined
        const value = supposing?.lineId !== undefined && supposing.lineId === line.lineId ? supposing.value : (derivedValue ?? chosen?.value)
        if (value !== undefined) {
            const count = wholeCount(value)
            // A neutral count that is not a whole number of people is not something to do arithmetic over.
            if (count === null) return { cause: 'NEUTRALS_NOT_SETTLED', why: `${line.lineId} holds ${JSON.stringify(value)}, which is not a whole, non-negative count` }
            neutrals += count
            if (chosen) neutralChoices.push(chosen)
            continue
        }
        if (!establishedAbsence(line, ctx.classified.get(line.lineId))) {
            return { cause: 'NEUTRALS_NOT_SETTLED', why: `${line.lineId} is required and unestablished, and nothing may be assumed about a count the knowledge has not settled` }
        }
    }

    /**
     * **Involvement, per team and per specialized-role row, read from the game.** The rows come from the
     * register, which carries the role NAME; this layer knows none of them.
     *
     * The same three cases as the neutral read above, for the same reason — *"an established absence is an
     * answer, not an obstruction"*: a resolved count is used; an established absence is ZERO involvement,
     * however many the session has available; required-but-unestablished refuses.
     *
     * **Where the count is looked for, in order.** (1) On the member itself, where realization supplied it.
     * (2) On the team's own line for the row. (3) Where no such line exists — and for an instantiated team
     * none does, because SD-97 enumerates no line for a class nothing individuates — in what the selected
     * objects AUTHOR on the row (see `authoredFor`). (4) Where they author nothing on it, the question is
     * put to the row instead: what do they DECLARE about it? That is the same reading a line on the row
     * would have carried (`reasonFor`), so an object that declares it does not constrain the role is an
     * established absence, and a row nobody looked at is not.
     *
     * (3) comes before (4) because that precedence lets a NON_CLAIMED from one object outrank a CLAIMED
     * from another: where any selected object carries an ITEM on the row, the knowledge speaks about the
     * count, and a declaration elsewhere may not read its silence as none.
     */

    /**
     * **What the knowledge AUTHORS about this team's count — added in review, 13 October.**
     *
     * The repair first refused whenever any selected object carried an item on the row, reasoning that no
     * line delivers it to an instantiated team. That kept an authored count from being read as none, and it
     * also meant NO game could ever involve a specialized role: an authored *"one per team"* refused with
     * two available exactly as it did with none, so the only involvement this rule could produce was zero.
     * Measured on a copy of the possession game form given such an item — both sessions refused, for a
     * reason about a missing line.
     *
     * The line is missing for a reason that is not the knowledge's: SD-97 enumerates none for a class
     * nothing individuates. His ruling of 30 September then gives each instantiated member *"the applicable
     * property schema"* while supplying no value — *"Creating a property location is not authoring its
     * value."* So the location exists once the team does, and the value has to come from what is authored.
     * It is read here exactly as the equality on the outfield count is read a few lines above: from the
     * item, because no line exists to carry it.
     *
     * **Each item is put the engine's own questions and nothing is decided here.** Its application set
     * (stage 3) must take in the team's class. Its selector must REACH the member (stage 4), where the
     * member is the class `post-realization-gate` forms for it — one with no attributes fixed, since
     * nothing tells one instantiated team from another. So a selector that names no particular team
     * reaches, and one that names a team is UNDETERMINED, which the engine *"records and derives nothing
     * from"*. And it must ENTAIL (§3), as a requirement: an assumed item bounds and never entails, and
     * neither an example nor a preferred default may put a performer into every team — the same bar the
     * equality is held to.
     *
     * Anything on the row that does not clear all of that leaves the count unsettled, and so do two items
     * that fix different counts. Nothing is chosen between them and nothing is read as none.
     *
     * **Which team a team-naming selector reaches is the designation resolver's answer** — 15 October 2026 (stage K2), his
     * M2: *"Please implement the previously adopted September 20 designation rule"*. The member is asked as a class carrying
     * what `designation.ts` resolved for its handle from the bindings realization recorded: a setup assignment
     * (TEAM_AT_AXIS_*) reaches exactly the team bound to it and is FALSE for the other — an item that speaks of another team
     * says nothing about this one, so it is passed over rather than read as unsettled; a possession-relative, episode or
     * trigger designation still never reaches a standing count, and the refusal now says why. No item on today's corpus
     * names a team on a performer row, so no roster moves. Returns null where no item speaks about this team at all.
     */
    const authoredFor = (
        instantiation: Roster['teams'][number],
        rowId: string,
        leaf: string,
        speaking: { contractId: string; item: LoadedContract['items'][number] }[],
    ): ({ value: number; basis: string } & Supported) | { unsettled: string } | { passedOver: { contractId: string; itemId: string }[] } => {
        const asked = memberOf(instantiation)
        if (!asked) return { unsettled: `the class ${instantiation.classId} this team satisfies is not in the run` }
        const { member, designations } = asked
        const counts = new Set<number>()
        const from: string[] = []
        // The items that speak of particular teams and so decide this one's count (stage K4): reaching it, or passed over
        // because they speak of another team. Kept for the record, so a reader asks the items rather than the sentence.
        const supportedBy: { contractId: string; itemId: string }[] = []
        for (const { contractId, item } of speaking) {
            const name = `${contractId}::${item.itemId}`
            const parsed = parseSelector(item.selector, rowId, ctx.index)
            if (!parsed.predicate) return { unsettled: `${name} is authored on ${rowId} with a selector that cannot be read (${parsed.defect})` }
            const reach = reaches(parsed.predicate, member)
            if (namesParticularTeams(item, ctx.index)) supportedBy.push({ contractId, itemId: item.itemId })
            if (reach === 'FALSE') continue
            const application = scoped().applicationSets.find(set => set.item.contractId === contractId && set.item.itemId === item.itemId)
            if (!application?.classIds.includes(instantiation.classId)) {
                return { unsettled: `${name} is authored on ${rowId} and its scope does not take in this team's class, so what it says of this team is not established` }
            }
            if (reach !== 'TRUE') {
                const named = parsed.predicate.terms.flatMap(term => (term.op === 'IN' ? term.values : term.op === '=' ? [term.value] : []))
                const why = whyNotReached(designations, named)
                return {
                    unsettled:
                        `${name} speaks of particular teams (${JSON.stringify(item.selector)}), and nothing tells one instantiated team from ` +
                        `another, so whether it reaches this one is undetermined${why ? ` (${why})` : ''}`,
                }
            }
            if (!entails(item) || String((item as { valueStatus?: unknown }).valueStatus) !== 'REQUIRED_RANGE') {
                return { unsettled: `${name} speaks about ${rowId} without fixing it as a requirement, and a count nobody fixed is not one to choose here` }
            }
            const count = wholeCount(item.value)
            if (count === null) return { unsettled: `${name} holds ${JSON.stringify(item.value)}, which is not a whole, non-negative count` }
            counts.add(count)
            from.push(name)
        }
        if (!from.length) return { passedOver: supportedBy }
        if (counts.size !== 1) return { unsettled: `${from.join(' and ')} fix different counts on ${rowId}, and no single value satisfies both` }
        const [value] = [...counts]
        // "of this team" where an item that reached speaks of particular teams (stage K4): it did not say it of every team.
        return { value, basis: `${from.join(' and ')} require${from.length === 1 ? 's' : ''} ${leaf} = ${value} of ${supportedBy.length ? 'this team' : 'every team'}`, ...(supportedBy.length ? { supportedBy } : {}) }
    }

    const involvementOf = (instantiation: Roster['teams'][number], rowId: string, leaf: string): ({ value: number; basis: string } & Supported) | { unsettled: string } => {
        const inGame = memberInGame(realized, collectionPath(instantiation.path), instantiation.handle)
        const own = readAt(instantiation.member as Record<string, unknown>, leaf) ?? (inGame ? readAt(inGame, leaf) : undefined)
        if (own !== undefined) {
            return Number.isInteger(own) && Number(own) >= 0
                ? { value: Number(own), basis: `the member carries ${leaf} = ${Number(own)}` }
                : { unsettled: `the member carries ${leaf} = ${JSON.stringify(own)}, which is not a whole, non-negative count` }
        }

        const line = ctx.lines.find(candidate => candidate.lineId === `${instantiation.classId}::${rowId}`)
        if (line) {
            const value = resolvedValue(ctx.derived.get(line.lineId))?.value
            if (value !== undefined) {
                // Read as the roster gate reads it: the corpus authors such a count as `"1"`, and a reader
                // that wanted a JavaScript number would call an authored one unsettled.
                const count = wholeCount(value)
                return count === null
                    ? { unsettled: `${line.lineId} holds ${JSON.stringify(value)}, which is not a whole, non-negative count` }
                    : { value: count, basis: `${line.lineId} establishes ${leaf} = ${count}` }
            }
            return establishedAbsence(line, ctx.classified.get(line.lineId))
                ? { value: 0, basis: `${line.lineId} is an established absence` }
                : { unsettled: `${line.lineId} is required and unestablished` }
        }

        const speaking = ctx.contracts.flatMap(contract =>
            (contract.items ?? []).filter(item => String(item.row) === rowId).map(item => ({ contractId: String(contract.contractId), item })),
        )
        let passedOver: { contractId: string; itemId: string }[] = []
        if (speaking.length) {
            const read = authoredFor(instantiation, rowId, leaf, speaking)
            // Passed over: every item on the row speaks of another team (a setup assignment bound elsewhere, or a role this
            // team does not hold in the block), so this team's count is read exactly as it is where nothing is authored at
            // all — from the declarations, below — and those items are kept as what left it that count (stage K4).
            if (!('passedOver' in read)) return read
            passedOver = read.passedOver
        }

        // The team's own class goes with the question since 15 October 2026, so this read and a line's reason are
        // decided by the same `governingDeclarations` (his answer 9) — one precedence, not two copies of it.
        const declarations = scoped().declarations
        const reason = reasonFor(rowId, declarations, ctx.classes.find(candidate => candidate.classId === instantiation.classId))
        return reason === 'excluded' || reason === 'not constrained'
            ? {
                  value: 0,
                  basis: passedOver.length
                      ? `no selected knowledge establishes ${leaf} for this team (${rowId} is ${reason}; ${passedOver.map(ref => `${ref.contractId}::${ref.itemId}`).join(' and ')} speak${passedOver.length === 1 ? 's' : ''} of another team)`
                      : `no selected knowledge establishes ${leaf} in this game (${rowId} is ${reason})`,
                  ...(passedOver.length ? { supportedBy: passedOver } : {}),
              }
            : { unsettled: `nothing selected settles ${rowId} for this team (${reason})` }
    }

    const involvement: Roster['involvement'] = []
    for (const [rowId, role] of ctx.index.specializedRoleRows) {
        if (ctx.index.ownerRow.get(rowId) !== 'P1') continue
        const row = ctx.index.rows.get(rowId)
        const leaf = row ? splitPath(String(row.path)).leaf : null
        if (!leaf) continue

        // A role the session has not stated derives nothing, because absent means NOT STATED.
        const available = roles[role]
        if (!Number.isFinite(available)) {
            return { cause: 'AVAILABILITY_NOT_STATED', role, why: `the session states no availability for the specialized role ${role}, and absent means NOT STATED` }
        }

        const perTeam: ({ value: number; basis: string } & Supported)[] = []
        for (const team of teams) {
            const read = involvementOf(team, rowId, leaf)
            if ('unsettled' in read) return { cause: 'INVOLVEMENT_NOT_SETTLED', role, why: read.unsettled }
            perTeam.push(read)
        }

        // Availability has to COVER involvement, and that is the only thing it does.
        const needed = perTeam.reduce((sum, entry) => sum + entry.value, 0)
        if (needed > Number(available)) {
            const uniform = perTeam.every(entry => entry.value === perTeam[0].value)
            return {
                cause: 'AVAILABILITY_SHORT',
                role,
                perTeam: uniform ? perTeam[0].value : null,
                teams: teams.length,
                needed,
                available: Number(available),
                why: `the game involves ${needed} ${role} across ${teams.length} teams and the session has ${Number(available)}`,
            }
        }
        involvement.push({ rowId, role, available: Number(available), perTeam })
    }

    const involved = involvement.reduce((sum, entry) => sum + entry.perTeam.reduce((inner, team) => inner + team.value, 0), 0)
    const outfieldTotal = players - involved - neutrals
    const left = `${players} session performers − ${involved} in specialized roles − ${neutrals} neutral leaves ${outfieldTotal}`

    /**
     * **A team with fewer than one outfield player is not a team — closed 13 October, for every game.**
     *
     * Zero divides evenly by anything, so a roster of nobody passed: measured with this guard taken out,
     * twelve neutrals of twelve players derived *"2 teams of 0"*, the roster gate added it up and agreed,
     * and the activity was served (the authored bound on the count is *"one or more"* with no maximum, so
     * realization has no ground to refuse it). By the same arithmetic so does a game whose specialized roles
     * take the whole session, and a session of no players. The sum is right and there is no game.
     * It is closed here, at the rule, rather than for neutrals alone: whatever used the players up, a team
     * nobody plays in derives nothing. Its own cause, so a coach is told there are too few players and not
     * that the players do not divide.
     */
    if (outfieldTotal <= 0) {
        return {
            cause: 'NO_OUTFIELD_PLAYERS',
            players,
            teams: teams.length,
            involved,
            neutrals,
            why: `${left}, so each of the ${teams.length} teams would have fewer than one outfield player`,
        }
    }
    const neutralsSaid = `${neutrals ? ` − ${neutrals} neutral${neutralChoices.length ? ' (the count realization closed, inside its authored range)' : ''}` : ''}`

    /**
     * **The outfield count authored per team, closed from the session total — never chosen** (15 October 2026, stage K4).
     * Christian, reply filed 17 October 2026, D6: *"The important principle is that player allocation should reflect
     * representative numerical relationships, not default to equal outfield numbers regardless of the Learning Goal."* His 16
     * October item 7, still in force: *"Please preserve the coach's player count and available-space inputs, and report any
     * configuration that cannot be constructed validly."*
     *
     * Every allocation the authored counts admit is tried against what is left for the outfield; exactly one must fit. None
     * fitting is the session's (CONFIGURATION_DOES_NOT_FIT, with the player counts that would fit, asked of this rule itself);
     * more than one fitting is refused rather than chosen between (ALLOCATION_NOT_SETTLED); and where an equal-numbers
     * requirement is still in force — nothing let it defer (ruling C56) — only an equal allocation may fit, so an unequal one
     * is refused as unauthorized (NO_AUTHORIZED_ASYMMETRY). The coach's count is never changed and no number is written here:
     * at 12 players the first such realization's five pressing and five-or-six building players fit only as six and five, at
     * 11 only as five and five, and at any other count not at all — his testing boundaries (18 October, item 7), held as data.
     */
    if (perTeamAuthored) {
        const unsettled = allocation.find((entry): entry is { unsettled: string } => !!entry && 'unsettled' in entry)
        if (unsettled) return { cause: 'ALLOCATION_NOT_SETTLED', why: unsettled.unsettled }
        const missing = allocation.findIndex(entry => entry === null)
        if (missing >= 0) {
            return { cause: 'ALLOCATION_NOT_SETTLED', why: `the outfield count is authored for particular teams, and nothing authored speaks of the team ${teams[missing].handle}` }
        }
        const ranges = allocation as ({ min: number | null; max: number | null; from: string[] } & Supported)[]
        const options = ranges.map(range => {
            const low = Math.max(1, range.min ?? 1)
            const high = Math.min(range.max ?? outfieldTotal, outfieldTotal)
            return Array.from({ length: Math.max(0, high - low + 1) }, (_, i) => low + i)
        })
        let combinations: number[][] = [[]]
        for (const values of options) combinations = combinations.flatMap(combination => values.map(value => [...combination, value]))
        const fitting = combinations.filter(combination => combination.reduce((sum, n) => sum + n, 0) === outfieldTotal)
        const admitted = equality ? fitting.filter(combination => combination.every(n => n === combination[0])) : fitting
        const authored = ranges.map(range => range.from.join(' and ')).join('; ')
        if (!fitting.length) {
            /**
             * The player counts that WOULD fit, asked of this rule with each count supposed — only where every authored count
             * has an upper limit, so the search is finite, and never from a supposition (which would ask forever).
             */
            const ceiling = ranges.every(range => range.max !== null) ? ranges.reduce((sum, range) => sum + (range.max ?? 0), 0) + involved + neutrals : null
            const fits = ceiling !== null && supposing?.players === undefined ? Array.from({ length: ceiling }, (_, i) => i + 1).filter(n => !isRosterRefusal(rosterFor(ctx, realized, { players: n }))) : null
            return {
                cause: 'CONFIGURATION_DOES_NOT_FIT',
                players,
                involved,
                neutrals,
                fits,
                why: `${left}, and no allocation the counts authored per team admit (${authored}) adds up to it${fits ? `; the session player counts these per-team counts fit are ${fits.join(', ') || 'none'} (whether who changes team at an exchange holds at those counts is a separate check, RB-M)` : ''}`,
            }
        }
        if (!admitted.length) {
            return {
                cause: 'NO_AUTHORIZED_ASYMMETRY',
                why: `${left}, which the counts authored per team (${authored}) allocate only unequally (${fitting.map(c => c.join(' and ')).join('; ')}), while the equal-numbers requirement ${equalityItems.join(' and ')} is in force: no knowledge-authorized realization lets it defer (ruling C56)`,
            }
        }
        if (admitted.length > 1) {
            return { cause: 'ALLOCATION_NOT_SETTLED', why: `${left}, and the counts authored per team (${authored}) admit ${admitted.length} allocations (${admitted.map(c => c.join(' and ')).join('; ')}); nothing authored decides between them, and none is chosen here` }
        }
        const [values] = admitted
        const deferring = ctx.contracts.flatMap(contract => (contract.deferredItems ?? []).filter(entry => String(entry.item.row) === 'P2').map(entry => `${contract.contractId}::${entry.item.itemId} defers to ${entry.relationship}`))
        const chain =
            `${players} session performers` +
            `${involved ? ` − ${involved} in specialized roles` : ''}` +
            neutralsSaid +
            ` over ${teams.length} teams, with the outfield count authored per team${deferring.length ? ` (${deferring.join('; ')}, ruling C56)` : ''}`
        return {
            teams,
            outfield: values.map((value, i) => ({
                value,
                because: `entailed from the session and the count authored for this team: ${ranges[i].from.join(' and ')}; ${chain}; the only allocation that fits is ${values.join(' and ')}`,
                ...(ranges[i].supportedBy?.length ? { supportedBy: ranges[i].supportedBy } : {}),
            })),
            involvement,
            neutralChoices,
            players,
            chain,
        }
    }

    if (outfieldTotal % teams.length !== 0) {
        // Does not come out whole; derive nothing.
        return {
            cause: 'DOES_NOT_DIVIDE',
            players,
            teams: teams.length,
            involved,
            neutrals,
            why: `${left}, which does not split into ${teams.length} whole equal teams`,
        }
    }

    const chain = `${players} session performers` + `${involved ? ` − ${involved} in specialized roles` : ''}` + neutralsSaid + ` over ${teams.length} teams, with equality authored on P2`
    return {
        teams,
        outfield: teams.map(() => ({ value: outfieldTotal / teams.length, because: `entailed from the session and the authored equality: ${chain}` })),
        involvement,
        neutralChoices,
        players,
        chain,
    }
}

/**
 * **Which other counts would this session's roster admit?** — the valid alternatives to a count realization
 * closed, asked of the roster rule itself.
 *
 * Christian, 13 October 2026: *"I also want neutral-player numbers and participation conditions to remain
 * adjustable during a session, within valid configurations. The coach may need to add or remove a neutral
 * player to maintain an appropriate challenge."* A valid configuration is one the roster still comes out
 * whole for, and that depends on the session: with equal teams required, twelve players admit 2, 4, 6 …
 * neutrals and thirteen admit 1, 3, 5 …, so the next valid count is two away and never one. Nothing kept
 * that with the choice, so nothing downstream could know which counts were open to a coach.
 *
 * Every whole number from `from` to `to` is put to `rosterFor` with the count supposed, so the answer is the
 * rule's and cannot drift from it. No adjustment is made or proposed here.
 */
export function countsTheRosterAdmits(ctx: GateContext, realized: Realized, lineId: string, from: number, to: number): number[] {
    const admitted: number[] = []
    for (let value = Math.max(0, Math.ceil(from)); value <= to; value++) {
        if (!isRosterRefusal(rosterFor(ctx, realized, { lineId, value }))) admitted.push(value)
    }
    return admitted
}

/**
 * **Why there is no roster, for a caller that has to tell a coach.** Null where the roster derives.
 *
 * It asks the rule again rather than reading something the rule left behind, so the realization record keeps
 * its shape and a refusal is never a stored artifact that could outlive the session that caused it. The two
 * answers cannot disagree: a refused rule wrote nothing, so the second reading sees exactly what the first did.
 */
export function rosterRefusal(ctx: GateContext, realized: Realized): RosterRefusal | null {
    const outcome = rosterFor(ctx, realized)
    return isRosterRefusal(outcome) ? outcome : null
}

/**
 * **Why the session's objects do not cover the game's — one named cause each** (stage E, 23 October 2026, register version 19). Christian,
 * reply filed 25 October 2026, item 4: *"Please add the general ability to represent goal availability as a session resource and use
 * authorized knowledge relationships when determining which scoring configuration can be selected."* *"A [specialized performer] being
 * available must not automatically force a [specialized performer] or [object] into an activity that does not require one."* *"Likewise,
 * the system should not assume a physical [object] exists simply because a [specialized performer] was selected."* (His nouns bracketed:
 * the coupling ratchet keeps a sport's nouns out of this layer.)
 *
 * Beside the roster's AVAILABILITY_NOT_STATED and AVAILABILITY_SHORT, and read the same way: availability has to COVER involvement, and that
 * is the only thing it does. The cause is a closed code and the facts travel beside it, so the builder makes its own sentence from them and
 * never reads `why`.
 *
 *   - OBJECT_AVAILABILITY_NOT_STATED: the game holds an object of a kind the session has not stated (`asks: AVAILABILITY`), or the session
 *     states enough of them and not how wide they are (`asks: WIDTH`). Absent means NOT STATED, never none, so it is asked, never assumed.
 *   - OBJECT_AVAILABILITY_SHORT: the game holds more objects of the kind than the session states it has.
 *   - OBJECT_NOT_SUITABLE: the session has enough of them and they are not ones the realization's authorized knowledge says suit it
 *     (`decided: true`), or nothing authorized says which suit it (`decided: false`). Which objects suit an activity is decision 4 of the note
 *     sent to him; until a realization carries his words for it, no object of the kind counts as suitable, so none is treated as
 *     interchangeable (his item 3: *"rather than inventing dimensions or treating every [object] as interchangeable"*).
 *   - OBJECT_INVOLVEMENT_NOT_SETTLED: the game holds an object of the kind whose count is not a whole number, so how many it needs is unknown.
 */
export type ObjectAvailabilityRefusal =
    | { cause: 'OBJECT_AVAILABILITY_NOT_STATED'; kind: string; asks: 'AVAILABILITY' | 'WIDTH'; needed: number; why: string }
    | { cause: 'OBJECT_AVAILABILITY_SHORT'; kind: string; needed: number; available: number; why: string }
    /**
     * `rules` (stage I, 24 October 2026): the suitability the realization's authorized knowledge states for the kind, as read (empty where
     * nothing is decided), so the builder can say which objects it is built for (the d27 design's stage I(b)) without reading `why`.
     */
    | { cause: 'OBJECT_NOT_SUITABLE'; kind: string; needed: number; available: number; widthM: number; decided: boolean; rules: { min: number | null; max: number | null }[]; why: string }
    | { cause: 'OBJECT_INVOLVEMENT_NOT_SETTLED'; kind: string; why: string }

/** What authorized knowledge says suits a realization's objects of one kind (`ProvisionalRealization.objectSuitability`), as the rule reads it. */
interface SuitabilityRead {
    from: string
    min: number | null
    max: number | null
}

/**
 * **How many objects of each listed kind the game holds** (stage E): each element of the register's objects collection whose kind the
 * register's `sessionResources` lists counts as many objects as its count field says, one where the field holds nothing (an element
 * established by the knowledge is one object unless its count says otherwise; OUR READING, reported). Read from the game, never from the
 * session, so a game holding none of a kind needs none of it whatever the session has. Null for a register without the block.
 */
export function objectInvolvementOf(game: unknown, index: GateContext['index']): { kind: string; needed: number; elements: string[]; unsettled: string | null }[] | null {
    const spec = index.sessionResources
    if (!spec) return null
    const bucket = readAt(game as Record<string, unknown>, collectionPath(spec.path))
    const elements = Array.isArray(bucket) ? (bucket as unknown[]).filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object') : []
    return spec.kinds.map(kind => {
        const ofKind = elements.filter(element => readAt(element, spec.kindLeaf) === kind)
        let needed = 0
        let unsettled: string | null = null
        for (const element of ofKind) {
            const count = readAt(element, spec.countLeaf)
            if (count === undefined || count === null) needed += 1
            else if (Number.isInteger(count) && Number(count) >= 0) needed += Number(count)
            else unsettled = unsettled ?? `${String(element.elementId)} holds ${JSON.stringify(count)} on ${spec.countRow}, which is not a whole number of objects`
        }
        return { kind, needed, elements: ofKind.map(element => String(element.elementId)), unsettled }
    })
}

/**
 * **Does the session's statement of its objects cover the objects the game holds?** Null where it does, or where the game holds no object of
 * a kind the register lists (then the statement is never read: a session that states nothing is asked nothing). The rule never adds an
 * object, a performer or a value: it reads the game, the envelope and the knowledge, and writes nothing (asserted in its unit test).
 *
 * `contracts` are the game's: the suitability a realization's authorized knowledge states for a kind is read from the provisional
 * realization the game was derived with (`objectSuitability`, his words required by its loader). None is recorded on 23 October 2026, so on
 * production data every stated object of a listed kind is OBJECT_NOT_SUITABLE with `decided: false`; no served game holds one.
 */
export function objectAvailabilityRefusal(index: GateContext['index'], game: unknown, envelope: unknown, contracts: LoadedContract[]): ObjectAvailabilityRefusal | null {
    const involvement = objectInvolvementOf(game, index)
    if (!involvement) return null
    const stated = (envelope as { objects?: Record<string, { count?: unknown; widthM?: unknown }> } | undefined)?.objects
    for (const { kind, needed, elements, unsettled } of involvement) {
        if (unsettled) return { cause: 'OBJECT_INVOLVEMENT_NOT_SETTLED', kind, why: unsettled }
        if (needed === 0) continue
        const held = `the game holds ${needed} object${needed === 1 ? '' : 's'} of the kind ${kind} (${elements.join(', ')})`
        const statement = stated && Object.prototype.hasOwnProperty.call(stated, kind) ? stated[kind] : undefined
        const count = statement?.count
        if (!statement || typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
            return { cause: 'OBJECT_AVAILABILITY_NOT_STATED', kind, asks: 'AVAILABILITY', needed, why: `${held}, and the session states no availability of ${kind}: absent means NOT STATED, never none` }
        }
        if (count < needed) return { cause: 'OBJECT_AVAILABILITY_SHORT', kind, needed, available: count, why: `${held}, and the session states ${count}` }
        const width = statement.widthM
        if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) {
            return { cause: 'OBJECT_AVAILABILITY_NOT_STATED', kind, asks: 'WIDTH', needed, why: `${held}, and the session states ${count} without saying how wide they are` }
        }
        const rules: SuitabilityRead[] = contracts.flatMap(contract =>
            ((contract as { objectSuitability?: ObjectSuitability[] }).objectSuitability ?? [])
                .filter(rule => rule.kind === kind)
                .map(rule => ({ from: `${contract.contractId} (${rule.citedAs})`, min: rule.widthM.min, max: rule.widthM.max })),
        )
        if (!rules.length) {
            return {
                cause: 'OBJECT_NOT_SUITABLE',
                kind,
                needed,
                available: count,
                widthM: width,
                decided: false,
                rules: [],
                why: `${held}; the session states ${count}, ${width} m wide, and no authorized knowledge of this realization says which objects of the kind suit it (decision 4 of the note sent to him), so none is counted as suitable`,
            }
        }
        const failing = rules.filter(rule => (rule.min !== null && width < rule.min) || (rule.max !== null && width > rule.max))
        if (failing.length) {
            return {
                cause: 'OBJECT_NOT_SUITABLE',
                kind,
                needed,
                available: count,
                widthM: width,
                decided: true,
                rules: rules.map(rule => ({ min: rule.min, max: rule.max })),
                why: `${held}; the session states ${count}, ${width} m wide, outside what ${failing.map(rule => `${rule.from} admits (${rule.min ?? 'no minimum'} to ${rule.max ?? 'no maximum'} m)`).join(' and ')}`,
            }
        }
    }
    return null
}

/**
 * The roster as an entailment rule: each team's size, and its count for every specialized role, written to
 * the member that holds it. A refused roster writes nothing at all — never a size without the role counts
 * the roster gate sums it with — and `rosterRefusal` says why.
 */
const deriveRoster: EntailmentRule = (ctx, realized, into) => {
    const roster = rosterFor(ctx, realized)
    if (isRosterRefusal(roster)) return

    /**
     * **The configurations are kept WITH the choice the roster read** — `within.configurations`, three sets and
     * a verdict nobody has given. Replaced `within.rosterAdmits` on 14 October 2026.
     *
     * Christian that day: *"Regarding valid configurations, I want us to distinguish three things: Structural
     * validity: player numbers and team relationships are internally consistent. Knowledge authorization: the
     * configuration falls within the manipulation's permitted parameters. Ecological appropriateness: the
     * configuration preserves the intended learning problem, meaningful opposition, and relevant affordances. A
     * configuration with ten neutral players and two teams of one may satisfy roster arithmetic, but that does
     * not make it an appropriate alternative to a 5v5+2 activity."*
     *
     * `rosterAdmits` was the first two run together: every count inside the REQUIRED bounds the roster came out
     * whole for. That is what made ten neutrals and two teams of one read as a valid alternative. Now:
     *
     *   - `structural` — the roster arithmetic alone, searched from 0 to the session's players: whole equal teams,
     *     at least one outfield player each. 12 players → 0, 2, 4, 6, 8, 10;
     *   - `authorized` — the structural counts inside the REQUIRED count bounds, the manipulation's permitted
     *     parameters. 12 → 2, 4, 6, 8, 10 (the old `rosterAdmits`, same values);
     *   - `offered` — the authorized counts inside the authored PREFERRED range. 12 → 2; 13 → 1. His words: *"For
     *     now, please use the authored preferred range of one to two neutrals for the demonstration's normal
     *     starting configurations. Counts outside that range should not automatically be treated as suitable
     *     merely because the arithmetic works."* With no preferred range authored nothing is offered, for the
     *     same reason;
     *   - `ecological: 'NOT_ASSESSED'` — no learning-design knowledge establishes ecological appropriateness. The
     *     preferred range stands in for normal starting configurations by his ruling and is NOT an ecological
     *     verdict, so it is not labelled one.
     *
     * Every set is asked of the roster rule itself (`countsTheRosterAdmits`), so it cannot drift from it. It is a
     * record written at the boundary where the roster is known: nothing reads it to change the game, and no
     * adjustment mechanism is built. Justified-default rule 2 is unchanged; where `offered` has one member it is
     * exactly the count that rule closes (asserted in `post-realization.unit.ts`).
     */
    for (const choice of roster.neutralChoices) {
        const counts = choice.within.bounds.filter(bound => bound && bound.kind === 'COUNT' && !bound.forbidden && !bound.fractionOfAxis)
        const limits = (bounds: typeof counts, which: 'min' | 'max') => bounds.map(bound => bound[which]).filter((limit): limit is number => typeof limit === 'number' && Number.isFinite(limit))
        const inside = (bounds: typeof counts) => (n: number) => limits(bounds, 'min').every(min => n >= min) && limits(bounds, 'max').every(max => n <= max)
        const required = counts.filter(bound => !bound.preferred)
        const preferred = counts.filter(bound => bound.preferred)
        const structural = countsTheRosterAdmits(ctx, realized, choice.lineId, 0, roster.players)
        const authorized = structural.filter(inside(required))
        choice.within.configurations = {
            structural,
            authorized,
            offered: preferred.length ? authorized.filter(inside(preferred)) : [],
            offeredBasis: preferred.length ? 'PREFERRED_RANGE_FOR_NORMAL_STARTING_CONFIGURATIONS' : 'NO_PREFERRED_RANGE_AUTHORED',
            ecological: 'NOT_ASSESSED',
        }
    }

    roster.teams.forEach((instantiation, teamIndex) => {
        const collection = collectionPath(instantiation.path)
        const owed: ({ rowId: string; value: number; because: string } & Supported)[] = [
            { rowId: 'P2', ...roster.outfield[teamIndex] },
            ...roster.involvement.map(entry => ({
                rowId: entry.rowId,
                value: entry.perTeam[teamIndex].value,
                // **The value written is the INVOLVEMENT.** It was the session's stated count, which is how
                // an available performer became a member of a team in a game that involves none.
                because:
                    `${entry.perTeam[teamIndex].basis}; the session has ${entry.available} available, which covers it and is not itself ` +
                    `instantiated into the game; the register declares ${entry.rowId} a specialized role`,
                ...(entry.perTeam[teamIndex].supportedBy ? { supportedBy: entry.perTeam[teamIndex].supportedBy } : {}),
            })),
        ]
        for (const { rowId, value, because, supportedBy } of owed) {
            const row = ctx.index.rows.get(rowId)
            if (!row) continue
            const leaf = splitPath(String(row.path)).leaf
            if (!leaf) continue
            // Already carried by the member realization supplied — nothing owed, and nothing to write.
            if (readAt(instantiation.member as Record<string, unknown>, leaf) !== undefined) continue
            const existing = memberInGame(realized, collection, instantiation.handle)
            if (existing && readAt(existing, leaf) !== undefined) continue
            into.push({
                lineId: `assembly:${collection}[${instantiation.handle}]::${rowId}`,
                collection,
                handle: instantiation.handle,
                leaf,
                path: `${collection}[${instantiation.handle}].${leaf}`,
                value,
                because,
                ...(supportedBy?.length ? { supportedBy: supportedBy.map(ref => ({ ...ref })) } : {}),
            })
        }
    })
}

const RULES: EntailmentRule[] = [deriveRoster]

/**
 * **Did the artifact keep what assembly entailed?** The guard that a write actually landed.
 *
 * It is narrower than the guard it replaces, and deliberately so. The broad version asked whether any value
 * the gate derived was missing from the game; that question no longer arises, because the gate now derives
 * no member value of its own — it reads them from the game. What remains possible is a write that silently
 * did not land: a member address that does not resolve, which is exactly what the leaf-addressing defect
 * produced. Each failure blocks render-eligibility.
 */
export function entailmentsLanded(realized: Realized): string[] {
    const problems: string[] = []
    for (const entailment of realized.record.entailed) {
        const member = memberInGame(realized, entailment.collection, entailment.handle)
        const inGame = member ? readAt(member, entailment.leaf) : undefined
        if (inGame === undefined) {
            problems.push(
                `${entailment.path} was entailed as ${JSON.stringify(entailment.value)} and is absent from the concrete game — ` +
                    `the write did not land, so any check satisfied by it would be reading a value nothing else can`,
            )
        } else if (JSON.stringify(inGame) !== JSON.stringify(entailment.value)) {
            problems.push(`${entailment.path} was entailed as ${JSON.stringify(entailment.value)} but the concrete game holds ${JSON.stringify(inGame)}`)
        }
    }
    return problems
}

/** Unused re-exports kept out deliberately: nothing here needs `ClassifiedLine` or `DerivedLine` yet. */
export type { ClassifiedLine, DerivedLine }
