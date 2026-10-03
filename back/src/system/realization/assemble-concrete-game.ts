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

import { ClassifiedLine } from '../derivation/classify'
import { Comparison, comparisonOf } from '../derivation/comparison'
import { DerivedLine, resolvedValue } from '../derivation/derive'
import { GateContext } from '../derivation/gates'
import { splitPath } from '../derivation/resolved-game'
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
 * The roster, derived from the session and the authored knowledge — never chosen, and never assumed.
 *
 * His stated chain of 1 October: *"12 available performers → 0 specialized roles available → 0 neutrals
 * → 2 teams → equal outfield counts → 6 outfield players per team."* Every step comes from a legitimate
 * source, which is the whole condition:
 *
 *   - **the session total** from the envelope (`players`);
 *   - **specialized roles** from the envelope's stated `roles`, as explicit counts. An absent entry means
 *     NOT STATED and derives nothing — which is what stops this treating every available performer as an
 *     outfield player whenever nobody mentioned a specialized role;
 *   - **neutrals** read from the `P5` line (see below);
 *   - **the team count** from the instantiated members of the authored claim;
 *   - **equality** from an authored REQUIRED item, read from the knowledge rather than assumed here.
 *     **Equality is not an engine rule**: this fires only where such an item exists, so a game form
 *     authoring asymmetry never reaches this path.
 *
 * It refuses on anything missing, and a division that does not come out whole derives nothing rather than
 * rounding — a rounded roster is an invented one.
 */
const deriveRoster: EntailmentRule = (ctx, realized, into) => {
    const envelope = ctx.envelope as { players?: unknown; roles?: Record<string, number> } | undefined
    const players = Number(envelope?.players)
    const roles = envelope?.roles
    if (!Number.isFinite(players) || !roles) return

    // The instantiated members of the teams collection, with their addresses in the game.
    const teams = realized.record.instantiations
        .map((instantiation, i) => ({ instantiation, i, claim: ctx.classes.find(c => c.classId === instantiation.classId) }))
        .filter(entry => entry.claim?.row === 'P1' && !!entry.instantiation.handle)
    if (!teams.length) return

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
    if (!equality) return

    // A count must be a whole, non-negative number of people. Without this a stated `-1` *increases* the
    // outfield pool and still divides whole, deriving a larger roster than the session has.
    const statedCounts = Object.values(roles)
    if (!statedCounts.every(count => Number.isInteger(count) && Number(count) >= 0)) return
    const specialized = statedCounts.reduce((sum, count) => sum + Number(count), 0)

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
    if (!neutralLines.length) return
    let neutrals = 0
    for (const line of neutralLines) {
        const value = resolvedValue(ctx.derived.get(line.lineId))?.value
        if (typeof value === 'number' && Number.isFinite(value)) {
            neutrals += value
            continue
        }
        if (value !== undefined) return // a non-numeric neutral count is not something to do arithmetic over
        const entry = ctx.classified.get(line.lineId)
        const absent =
            line.lineState === 'WITHDRAWN' ||
            (entry?.verdict === 'NOT_AUTHORED' && (entry.reason === 'excluded' || entry.reason === 'not constrained'))
        if (!absent) return
    }

    const outfieldTotal = players - specialized * teams.length - neutrals
    if (outfieldTotal < 0 || outfieldTotal % teams.length !== 0) return // does not come out whole; derive nothing
    const perTeam = outfieldTotal / teams.length

    // The specialized-role rows come from the register, which carries the role NAME; this layer knows none
    // of them. A role the session has not stated derives nothing, because absent means NOT STATED.
    const specializedRows: [string, number][] = []
    for (const [rowId, roleName] of ctx.index.specializedRoleRows) {
        if (ctx.index.ownerRow.get(rowId) !== 'P1') continue
        const stated = roles[roleName]
        if (!Number.isFinite(stated)) return
        specializedRows.push([rowId, Number(stated)])
    }

    const chain =
        `${players} session performers` +
        `${specialized ? ` − ${specialized} specialized per team` : ''}` +
        `${neutrals ? ` − ${neutrals} neutral` : ''} over ${teams.length} teams, with equality authored on P2`

    for (const { instantiation } of teams) {
        const collection = collectionPath(instantiation.path)
        for (const [rowId, value] of [['P2', perTeam] as [string, number], ...specializedRows]) {
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
                because:
                    rowId === 'P2'
                        ? `entailed from the session and the authored equality: ${chain}`
                        : `the session states ${leaf} = ${value} for this run, and the register declares ${rowId} a specialized role`,
            })
        }
    }
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
