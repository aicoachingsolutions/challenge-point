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
import { Comparison, comparisonOf } from '../derivation/comparison'
import { DerivedLine, resolvedValue } from '../derivation/derive'
import { GateContext } from '../derivation/gates'
import { splitPath } from '../derivation/resolved-game'
import { resolveScopes } from '../derivation/scope'
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

/** What the roster rule derived: a size for every instantiated team, and each team's specialized-role involvement. */
interface Roster {
    teams: Realized['record']['instantiations']
    perTeam: number
    /** One entry per specialized-role row, `perTeam[i]` belonging to `teams[i]`. */
    involvement: { rowId: string; role: string; available: number; perTeam: { value: number; basis: string }[] }[]
    chain: string
}

const isRosterRefusal = (outcome: Roster | RosterRefusal): outcome is RosterRefusal => 'cause' in outcome

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
 */
function rosterFor(ctx: GateContext, realized: Realized): Roster | RosterRefusal {
    const envelope = ctx.envelope as { players?: unknown; roles?: Record<string, number> } | undefined
    const players = Number(envelope?.players)
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
    const equality = ctx.contracts.some(contract =>
        (contract.items ?? []).some(item => {
            if (String(item.row) !== 'P2') return false
            if (String((item as { valueStatus?: unknown }).valueStatus) !== 'REQUIRED_RANGE') return false
            const comparison = comparisonOf(String(contract.contractId), item as unknown as Record<string, unknown>)
            // An assumed comparison bounds and never entails (SD-27 / §3), so it may not license a division.
            return !!comparison && comparison.authoritative && comparison.operator === '=' && sameRow(comparison, 'P2')
        }),
    )
    if (!equality) {
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
     */
    const neutralLines = ctx.lines.filter(line => String(line.row) === 'P5')
    if (!neutralLines.length) return { cause: 'NEUTRALS_NOT_SETTLED', why: 'no P5 line exists, so the neutral count cannot be read' }
    let neutrals = 0
    for (const line of neutralLines) {
        const value = resolvedValue(ctx.derived.get(line.lineId))?.value
        if (typeof value === 'number' && Number.isFinite(value)) {
            neutrals += value
            continue
        }
        // A non-numeric neutral count is not something to do arithmetic over.
        if (value !== undefined) return { cause: 'NEUTRALS_NOT_SETTLED', why: `${line.lineId} holds ${JSON.stringify(value)}, which is not a number` }
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
     * none does, because SD-97 enumerates no line for a class nothing individuates — the question is put to
     * the row instead: what do the selected objects DECLARE about it? That is the same reading a line on
     * the row would have carried (`reasonFor`), so an object that declares it does not constrain the role is
     * an established absence, and a row nobody looked at is not. One guard is added on top, because that
     * precedence lets a NON_CLAIMED from one object outrank a CLAIMED from another: if any selected object
     * carries an ITEM on the row, the knowledge speaks about the count and nothing delivered it to this
     * team, so this refuses rather than reading the silence as none.
     */
    let declarations: ReturnType<typeof resolveScopes>['declarations'] | null = null
    const involvementOf = (instantiation: Roster['teams'][number], rowId: string, leaf: string): { value: number; basis: string } | { unsettled: string } => {
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
            if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return { value, basis: `${line.lineId} establishes ${leaf} = ${value}` }
            if (value !== undefined) return { unsettled: `${line.lineId} holds ${JSON.stringify(value)}, which is not a whole, non-negative count` }
            return establishedAbsence(line, ctx.classified.get(line.lineId))
                ? { value: 0, basis: `${line.lineId} is an established absence` }
                : { unsettled: `${line.lineId} is required and unestablished` }
        }

        const authored = ctx.contracts.filter(contract => (contract.items ?? []).some(item => String(item.row) === rowId)).map(contract => String(contract.contractId))
        if (authored.length) {
            return { unsettled: `${authored.join(', ')} author${authored.length === 1 ? 's' : ''} ${rowId} and no line carries it to this team` }
        }
        declarations = declarations ?? resolveScopes(ctx.contracts, ctx.classes).declarations
        const reason = reasonFor(rowId, declarations)
        return reason === 'excluded' || reason === 'not constrained'
            ? { value: 0, basis: `no selected knowledge establishes ${leaf} in this game (${rowId} is ${reason})` }
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

        const perTeam: { value: number; basis: string }[] = []
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
    if (outfieldTotal < 0 || outfieldTotal % teams.length !== 0) {
        // Does not come out whole; derive nothing.
        return {
            cause: 'DOES_NOT_DIVIDE',
            players,
            teams: teams.length,
            involved,
            neutrals,
            why: `${players} session performers − ${involved} in specialized roles − ${neutrals} neutral leaves ${outfieldTotal}, which does not split into ${teams.length} whole equal teams`,
        }
    }

    return {
        teams,
        perTeam: outfieldTotal / teams.length,
        involvement,
        chain:
            `${players} session performers` +
            `${involved ? ` − ${involved} in specialized roles` : ''}` +
            `${neutrals ? ` − ${neutrals} neutral` : ''} over ${teams.length} teams, with equality authored on P2`,
    }
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
 * The roster as an entailment rule: each team's size, and its count for every specialized role, written to
 * the member that holds it. A refused roster writes nothing at all — never a size without the role counts
 * the roster gate sums it with — and `rosterRefusal` says why.
 */
const deriveRoster: EntailmentRule = (ctx, realized, into) => {
    const roster = rosterFor(ctx, realized)
    if (isRosterRefusal(roster)) return

    roster.teams.forEach((instantiation, teamIndex) => {
        const collection = collectionPath(instantiation.path)
        const owed: { rowId: string; value: number; because: string }[] = [
            { rowId: 'P2', value: roster.perTeam, because: `entailed from the session and the authored equality: ${roster.chain}` },
            ...roster.involvement.map(entry => ({
                rowId: entry.rowId,
                value: entry.perTeam[teamIndex].value,
                // **The value written is the INVOLVEMENT.** It was the session's stated count, which is how
                // an available performer became a member of a team in a game that involves none.
                because:
                    `${entry.perTeam[teamIndex].basis}; the session has ${entry.available} available, which covers it and is not itself ` +
                    `instantiated into the game; the register declares ${entry.rowId} a specialized role`,
            })),
        ]
        for (const { rowId, value, because } of owed) {
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
