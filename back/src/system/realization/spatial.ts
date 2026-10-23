/**
 * Instantiating an authored relational spatial bound against the concrete session envelope.
 *
 * **This reads the canonical mechanism, not a second one.** `relativeTerms` (RC-21) already owned these
 * relative spatial predicates in prose — *"attacking end (of team T): touches the end line T attacks"*,
 * *"touchline-adjacent: touches a touchline"*. An earlier version of this file carried its own
 * `spatialRelations` block keyed on whole authored phrases, which was a parallel representation of
 * something that already existed one block away in the same file. Folded on his ruling of 1 October,
 * with the lesson kept:
 *
 *   > **A new representational mechanism must not be introduced where an existing canonical mechanism
 *   > already owns the same semantic concept.**
 *
 * Three things come out of the register and none out of this file: the prose test, its machine-readable
 * form, and the phrase-to-term index. A phrase the index does not name is simply not recognised.
 *
 * Two kinds of term, and the distinction is where the honesty is:
 *
 *   **interval** — the test fixes both ends. *"full extent (of an axis)"* is the whole axis, so on a
 *   40 m axis it is `[0, 40]`. That is what the predicate means, not a number chosen for it.
 *
 *   **anchor** — the test fixes one edge and states no extent. *"touches a touchline"* fixes the outer
 *   edge; how wide the element is, the predicate does not say.
 *
 * An anchor becomes an interval in exactly two ways, both entailed rather than assumed: a **required**
 * extent authored elsewhere, or a **one-dimensional noun**, where the element has extent on the other
 * axis and therefore none on this one. A *preferred* extent never closes it — that would turn a
 * preference into a requirement.
 */

import { practicalRequirement } from '../derivation/practical'
import { centredExactly, scaleExactly } from '../derivation/rational'
import { RegisterIndex } from '../derivation/register'
import { relativePositionOf, teamEndPositionOf } from '../derivation/types'

export interface RealizedGeometry {
    /** The authored phrase, unchanged — the authority for everything else here. */
    asAuthored: string
    /** The canonical term the phrase instantiates, so the provenance names the register and not prose. */
    term: string
    axis: 'along' | 'across'
    /** Both ends, in metres, where the predicate entails them. */
    interval?: { from: number; to: number }
    /** One coordinate, in metres, where the predicate entails only that. */
    anchor?: number
    /**
     * Where an authored extent was available, the bound it came from. `requiredWithin` is that requirement
     * in metres on this envelope, both ends; `preferenceWithin` is a preferred extent expressed inside it.
     */
    extentBound?: {
        min?: number | null
        max?: number | null
        preferred?: boolean
        fractionOfAxis?: boolean
        term?: string
        requiredWithin?: { min: number | null; max: number | null }
        preferenceWithin?: unknown
    }
    /** True where the position is fixed and the extent is not. */
    extentUnresolved: boolean
    /**
     * Where the interval was composed from RC-21's "beyond X (for team T)" (stage K6): the relation, the element it is relative to,
     * the team, the direction (+1 toward the far end line) and X's far edge in metres — so the composition is traceable and
     * GA-RELATIVE-PLACEMENT has what it re-checks.
     */
    relation?: { term: string; of: { contractId: string; itemId: string }; forTeam: string; direction: 1 | -1; referentFarEdge: number }
    /**
     * **Why realization must refuse this placement**, where the term itself cannot be placed without inventing something — 23 October 2026
     * (stage B, register version 17): RC-21's `central` with no extent stated for the element (the width the session states, or a REQUIRED
     * extent), or an extent that reaches a touchline; and an end-line anchor naming a team whose end nothing fixes for the element (T15).
     * The realizer refuses the game naming it (realize.ts), so no default is placed and nothing is left for a later gate to discover.
     */
    refusal?: string
    why: string
}

/**
 * **AM-17's `lateral` values, as fractions of the across axis.** Read from the register's own interval
 * tests, which are authored: *wide-left* "touches the 0 touchline and does not contain the midline",
 * *wide-right* "touches the W touchline and does not contain the midline". `wide` is either, so it names
 * no side and places nothing; `central` and `full-width` are not anchors and are left to their own terms.
 *
 * The numbers here are 0 and 1 — the two edges of the axis — not a width or a proportion. No extent is
 * implied by a side.
 */
const LATERAL_ANCHORS: Record<string, number | undefined> = {
    'wide-left': 0,
    'wide-right': 1,
}

/**
 * **The along-axis mirror of `LATERAL_ANCHORS`**, on his ruling of 9 October. Same shape, same
 * meaning, the other axis: *end-near* "touches the 0 end line and does not touch the L end line",
 * *end-far* "touches the L end line and does not touch the 0 end line". `end` is either, so it names
 * no end and places nothing. (Narrowed 15 October 2026, register version 13, for his M7: *"Do not introduce a
 * universal halfway restriction."* Each test read "and does not contain the midpoint" until then, which no code
 * enforced; that opposed targets do not overlap is GA-DIRECTION's separation clause.)
 *
 * It exists because two opposing target regions could not be told apart. Two region items carrying
 * the same selector collapse into one class, and the regions collection registered no attribute for
 * the along axis — so a game could have two channels on opposite touchlines and could not have two
 * targets at opposite ends. The numbers are the two edges of the axis, not a length or a proportion.
 */
const LONGITUDINAL_ANCHORS: Record<string, number | undefined> = {
    'end-near': 0,
    'end-far': 1,
}

/** The end line (0 or 1) a `longitudinal` value's interval test fixes, or undefined (`end` names no end). Read by team-ends.ts. */
export const longitudinalAnchorOf = (value: string): number | undefined => LONGITUDINAL_ANCHORS[value]

interface TermDefinition {
    kind: 'interval' | 'anchor'
    axis?: 'along' | 'across'
    from?: number
    to?: number
    at?: number
    why?: string
}

/** The axis lengths a session envelope supplies. `along` is the longer dimension (S1). */
function axisLengths(envelope: { lengthM?: number; widthM?: number }): { along: number; across: number } | null {
    const length = Number(envelope.lengthM)
    const width = Number(envelope.widthM)
    if (!Number.isFinite(length) || !Number.isFinite(width)) return null
    return { along: Math.max(length, width), across: Math.min(length, width) }
}

export interface SpatialContext {
    /**
     * **The `lateral` value the element's own authored selector carries**, where it has one.
     *
     * `touchline-adjacent`'s prose test is *"touches a touchline"* — indefinite about which. Its canonical
     * anchor is one touchline, so two regions both carrying the term resolve to the same strip. AM-17's
     * `lateral` values are what make it definite: *wide-left* "touches the 0 touchline", *wide-right*
     * "touches the W touchline". Those tests are authored in the register, so reading them is propagation.
     *
     * **It is consumed only from an authored selector, never inferred.** A count of two channels does not
     * make one of them wide-right; only an item saying so does.
     */
    lateral?: string
    /** The `longitudinal` value the element own authored selector carries, where it has one. */
    longitudinal?: string

    envelope: { lengthM?: number; widthM?: number }
    /** The row this value sits on, so an axis-free term knows which axis it is being read for. */
    axis: 'along' | 'across'
    /** A REQUIRED extent authored elsewhere on the line, where one exists. */
    extentBound?: { min?: number | null; max?: number | null; preferred?: boolean; fractionOfAxis?: boolean; term?: string }
    /**
     * How many dimensions the element's noun gives it extent in. **1 means a line**: it has extent on
     * one axis and none on the other, so an anchor on the axis that is *not* carrying its extent closes
     * to zero. Which axis that is comes from the geometry, never from the noun — so this works the same
     * for a line across the playing area and one along it.
     */
    nounExtentDimensions?: number
    /** True where the element's OTHER axis already carries an interval, i.e. that axis is its length. */
    otherAxisHasExtent?: boolean
    /**
     * **Which end line a team attacks, as a fraction of the along axis (0 or 1)** — 15 October 2026 (stage K6, register version
     * 13). RC-21 states "own end (of team T)" and "attacking end (of team T)" and "beyond X (for team T)" by a team; in a game
     * played in role blocks which end a role holder attacks is decided by the block, so the realizer answers it from the game's
     * own objectives (team-ends.ts) and this file only reads the answer. Null where it is not established: nothing is placed.
     */
    teamAttackingEnd?: (designation: string) => 0 | 1 | null
    /** The realized along interval of an element a relative position names, or null while it has none. */
    referentInterval?: (ref: { contractId: string; itemId: string }) => { from: number; to: number } | null
    /** A RELATIVE bound authored on this line ("beyond X (for team T)"), composed only where no metric extent is required. */
    relativeBound?: { term?: string; relation?: string; of?: { contractId: string; itemId: string }; forTeam?: string }
    /**
     * **The width the session states for objects of this element's kind, in metres** — 23 October 2026 (stage B, register version 17), a
     * realization input (the session field is stage E's). Read only by a term whose extent the session may state (RC-21's `central`,
     * `extentFrom` SESSION_STATED_WIDTH); never a default, and absent means not stated.
     */
    statedExtentM?: number
}

/**
 * **RC-21's "beyond X (for team T)", composed against realized geometry** — 15 October 2026 (stage K6), his M7 (reply filed 17
 * October 2026): *"M7 — Target relative to pressure reference: Approved if required."* The register's test is *"the element's
 * near edge is at or past X's far edge, in T's attacking direction"*. An element anchored at `anchor` reaches back to X's far edge
 * (the widest extent the test admits, the existing widest-extent convention): `[far, anchor]` or `[anchor, far]`. Where the anchor
 * is not on the far side of X, or X or T's direction is not established, nothing is composed and the reason is returned.
 */
function composeBeyond(
    anchor: number,
    referent: { from: number; to: number } | null,
    attacks: 0 | 1 | null,
): { interval: { from: number; to: number }; direction: 1 | -1; far: number } | { unresolved: string } {
    if (attacks === null) return { unresolved: 'the team whose direction the relation reads attacks no end this game establishes' }
    if (!referent) return { unresolved: 'the element the relation is relative to has no realized position' }
    const direction: 1 | -1 = attacks === 1 ? 1 : -1
    const far = direction > 0 ? referent.to : referent.from
    if (direction * (anchor - far) < 0) return { unresolved: `the element's anchor (${anchor} m) lies short of the referent's far edge (${far} m) in that direction, so it cannot reach beyond it` }
    return { interval: { from: Math.min(anchor, far), to: Math.max(anchor, far) }, direction, far }
}

/**
 * **A typed position: a relative position, a distance from a team's end line, or a canonical term named by its term** — 15
 * October 2026 (stage K6, register version 13). Authored values were phrases until now, recognised through the phrase index; the
 * values his reply filed 18 October 2026 (item 3) asks for are stated by a team and a referent, which a phrase cannot carry, so
 * they are typed (types.ts `relativePositionOf`, `teamEndPositionOf`) and name the register's term by its canonical name.
 * Nothing here is new knowledge: the terms and their tests are the register's.
 */
function realizeTypedPosition(value: Record<string, unknown>, index: RegisterIndex, ctx: SpatialContext, axes: { along: number; across: number }): RealizedGeometry | null {
    const terms = ((index.relativeTerms ?? {}) as any).machineReadable?.terms ?? {}
    const asAuthored = typeof value.asAuthored === 'string' ? value.asAuthored : JSON.stringify(value)
    const relative = relativePositionOf(value)
    if (relative) {
        const definition = terms[relative.term]
        if (!definition || definition.kind !== 'relative') return null
        // As a region of its own (a start placement's region, P10 version 2): anchored at the end the team attacks, reaching back
        // to the referent's far edge — "the part of the area beyond X in T's attacking direction".
        const attacks = ctx.teamAttackingEnd ? ctx.teamAttackingEnd(relative.forTeam) : null
        const anchor = attacks === null ? NaN : attacks * axes.along
        const composed = composeBeyond(anchor, ctx.referentInterval ? ctx.referentInterval(relative.of.structuralRef) : null, attacks)
        const base = { asAuthored, term: relative.term, axis: 'along' as const }
        if ('unresolved' in composed) return { ...base, extentUnresolved: true, why: `${definition.why ?? ''} Not composed: ${composed.unresolved}.` }
        return {
            ...base,
            interval: composed.interval,
            anchor,
            relation: { term: relative.term, of: { ...relative.of.structuralRef }, forTeam: relative.forTeam, direction: composed.direction, referentFarEdge: composed.far },
            extentUnresolved: false,
            why: `${definition.why ?? ''} The part of the area beyond the referent (far edge ${composed.far} m) in the attacking direction of ${relative.forTeam}, which attacks the ${attacks === 1 ? 'far' : '0'} end line.`,
        }
    }
    const fromEnd = teamEndPositionOf(value)
    if (fromEnd) {
        const definition = terms[fromEnd.term]
        if (!definition || definition.kind !== 'anchor' || definition.axis !== 'along' || (definition.at !== 0 && definition.at !== 1)) return null
        const attacks = ctx.teamAttackingEnd ? ctx.teamAttackingEnd(fromEnd.forTeam) : null
        const base = { asAuthored, term: fromEnd.term, axis: 'along' as const }
        if (attacks === null) return { ...base, extentUnresolved: true, why: `${definition.why ?? ''} Not placed: ${fromEnd.forTeam} attacks no end this game establishes.` }
        // "own end" (at 0) is the end the team does NOT attack; "attacking end" (at 1) the one it does.
        const end: 0 | 1 = definition.at === 1 ? attacks : attacks === 1 ? 0 : 1
        const L = axes.along
        const interval = end === 0 ? { from: fromEnd.offsetM.from, to: fromEnd.offsetM.to } : { from: L - fromEnd.offsetM.to, to: L - fromEnd.offsetM.from }
        return {
            ...base,
            interval,
            anchor: end * L,
            extentUnresolved: false,
            why: `${definition.why ?? ''} Measured ${fromEnd.offsetM.from === fromEnd.offsetM.to ? `${fromEnd.offsetM.from} m` : `${fromEnd.offsetM.from}-${fromEnd.offsetM.to} m`} into the area from the end line ${fromEnd.forTeam} ${definition.at === 1 ? 'attacks' : 'defends'} (the ${end === 0 ? '0' : 'far'} end line in this game).`,
        }
    }
    if (typeof value.term === 'string') {
        const definition = terms[value.term]
        if (definition && definition.kind === 'interval' && typeof definition.from === 'number' && typeof definition.to === 'number') {
            const axis = definition.axis ?? ctx.axis
            return { asAuthored, term: value.term, axis, interval: { from: definition.from * axes[axis as 'along' | 'across'], to: definition.to * axes[axis as 'along' | 'across'] }, extentUnresolved: false, why: definition.why ?? '' }
        }
        if (definition && definition.kind === 'centred') return realizeCentred(value.term, asAuthored, definition, ctx, axes)
    }
    return null
}

/**
 * **RC-21's `central`, composed against the envelope** — 23 October 2026 (stage B, register version 17). The prose test is *"contains the
 * axis midline across the width, and touches neither touchline"*: the term fixes the element's centre and states no width, so the interval
 * needs the element's extent on the term's axis, from a source its definition lists (`extentFrom`, validated at load):
 *
 *   - REQUIRED_EXTENT — a REQUIRED extent authored on the line (a preferred one never closes it, as everywhere else); where the session
 *     also states a width, that width must lie inside the requirement or the term refuses;
 *   - SESSION_STATED_WIDTH — the width the session states for objects of the element's kind (`statedExtentM`), used as stated.
 *
 * Where neither is stated, or the extent reaches a touchline, the term REFUSES (`refusal`): nothing is placed, and no width is assumed.
 * Christian, reply filed 25 October 2026, item 3: *"Please identify any missing knowledge decisions needed here rather than inventing
 * dimensions or treating every goal as interchangeable."*
 */
function realizeCentred(term: string, asAuthored: string, definition: any, ctx: SpatialContext, axes: { along: number; across: number }): RealizedGeometry {
    const axis: 'along' | 'across' = definition.axis === 'along' ? 'along' : 'across'
    const length = axes[axis]
    const base = { asAuthored, term, axis }
    const sources: string[] = Array.isArray(definition.extentFrom) ? definition.extentFrom : []
    const bound = ctx.extentBound && !ctx.extentBound.preferred && Number.isFinite(ctx.extentBound.max) ? ctx.extentBound : undefined
    const metres = (raw: unknown): number | null => (typeof raw === 'number' && Number.isFinite(raw) ? (bound?.fractionOfAxis ? scaleExactly(raw, length) : raw) : null)
    const required = sources.includes('REQUIRED_EXTENT') && bound ? { min: metres(bound.min), max: metres(bound.max) as number } : null
    const stated = sources.includes('SESSION_STATED_WIDTH') && typeof ctx.statedExtentM === 'number' && Number.isFinite(ctx.statedExtentM) && ctx.statedExtentM > 0 ? ctx.statedExtentM : null
    const refuse = (why: string): RealizedGeometry => ({ ...base, extentUnresolved: true, refusal: why, why: `${definition.why ?? ''} Not placed: ${why}.` })
    if (stated !== null && required && ((required.min !== null && stated < required.min) || stated > required.max)) {
        return refuse(`the width the session states (${stated} m) lies outside the required extent (${required.min ?? 0}-${required.max} m)`)
    }
    const extent = stated ?? required?.max ?? null
    if (extent === null) return refuse(`"${term}" needs the element's extent ${axis === 'across' ? 'across' : 'along'} the axis, and neither a required extent nor a width the session states is given for it`)
    const interval = centredExactly(length, extent)
    if (!interval) return refuse(`an extent of ${extent} m centred on a ${length} m axis ${extent >= length ? 'reaches both touchlines' : 'cannot be stated exactly'}, which "${term}" does not admit`)
    return {
        ...base,
        interval,
        extentUnresolved: false,
        why: `${definition.why ?? ''} Centred on the midline of the ${length} m axis, ${extent} m ${stated !== null ? 'wide as the session states it' : 'wide, the widest the required extent admits'}.`,
    }
}

/**
 * **An end-line anchor that names a team (RC-21's "own end (of team T)" or "attacking end (of team T)")** — the same reading the typed
 * position makes (an along anchor at an end line, 0 or 1).
 */
const namesTeamEnd = (definition: TermDefinition): boolean => definition.kind === 'anchor' && definition.axis === 'along' && (definition.at === 0 || definition.at === 1)

export function realizeSpatialRelation(value: unknown, index: RegisterIndex, ctx: SpatialContext): RealizedGeometry | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const axesNow = axisLengths(ctx.envelope)
        return axesNow ? realizeTypedPosition(value as Record<string, unknown>, index, ctx, axesNow) : null
    }
    if (typeof value !== 'string') return null
    const relative = (index.relativeTerms ?? {}) as any
    const term = relative.phraseIndex?.map?.[value]
    if (!term) return null
    const definition = relative.machineReadable?.terms?.[term] as TermDefinition | undefined
    if (!definition) return null

    const axes = axisLengths(ctx.envelope)
    if (!axes) return null
    // A term may name its own axis; an axis-free one (like full extent) takes the row's.
    const axis = definition.axis ?? ctx.axis
    const extent = axes[axis]
    const base = { asAuthored: value, term, axis }

    if (definition.kind === 'interval' && definition.from !== undefined && definition.to !== undefined) {
        return { ...base, interval: { from: definition.from * extent, to: definition.to * extent }, extentUnresolved: false, why: definition.why ?? '' }
    }
    if (definition.kind !== 'anchor' || definition.at === undefined) return null

    const { extentBound, nounExtentDimensions, otherAxisHasExtent } = ctx

    /**
     * **An authored `lateral` value fixes WHICH edge an across anchor sits on.**
     *
     * Without it both channels anchored at the same touchline, because the term fixes *an* edge and names
     * no side. `wide-left` keeps the 0 edge; `wide-right` takes the far edge, and the interval then grows
     * inward from it — machinery that already existed for a non-zero anchor. Nothing is inferred: with no
     * authored lateral value the term's own anchor stands exactly as before.
     */
    const lateralAt = axis === 'across' && ctx.lateral ? LATERAL_ANCHORS[ctx.lateral] : undefined
    const longitudinalAt = axis === 'along' && ctx.longitudinal ? LONGITUDINAL_ANCHORS[ctx.longitudinal] : undefined
    /**
     * **T15 — an end-line anchor naming a team is placed at that team's end, or not at all** (23 October 2026, stage B). The term's `at` is
     * the end line T defends (0) or attacks (1) for SOME team T, not a fixed end of the axis; until this an element whose own authored
     * selector fixed no end took `at` as it stood, whatever team the phrase named (measured: a goal placed by "attacking end" sat at the far
     * end line in both blocks, and no gate refused it). A phrase names its team only in prose, which is not read (SD-32), so where the
     * element's own authored `longitudinal` value (his 9 October ruling) does not fix the end, nothing is placed and realization refuses: a
     * position stated for a team the game resolves is written typed ({term, forTeam, offsetM}) and placed above, from that team's end.
     */
    if (axis === 'along' && longitudinalAt === undefined && namesTeamEnd(definition)) {
        const why = `"${value}" places the element at an end line of a team the phrase names in prose only, and the element's own selector fixes no end, so no end is assumed`
        return { ...base, extentUnresolved: true, refusal: why, why: `${definition.why ?? ''} Not placed: ${why}.` }
    }
    const at = lateralAt ?? longitudinalAt ?? definition.at
    const anchor = at * extent
    const lateralWhy =
        lateralAt !== undefined
            ? ` The authored selector states ${ctx.lateral}, which AM-17 tests as touching the ${lateralAt === 0 ? '0' : 'far'} touchline, so the anchor is that edge rather than the other.`
            : longitudinalAt !== undefined
              ? ` The authored selector states ${ctx.longitudinal}, which is tested as touching the ${longitudinalAt === 0 ? '0' : 'far'} end line, so the anchor is that end rather than the other.`
              : ''

    // **A one-dimensional noun closes the anchor to zero on its thickness axis.** This is entailment,
    // not assumption: a line has extent on one axis, so on the other it has none. Orientation is read
    // from where the extent actually is, so nothing here encodes "line = end line".
    if (nounExtentDimensions === 1 && otherAxisHasExtent) {
        return {
            ...base,
            interval: { from: anchor, to: anchor },
            anchor,
            extentUnresolved: false,
            why: `${definition.why ?? ''}${lateralWhy} The element's noun gives it extent in one dimension and its other axis carries that extent, so its extent on this axis is zero.`,
        }
    }

    // **A PREFERRED extent may not become a required interval.** Carrying it as though established would
    // turn a preference into a requirement, which is the conversion forbidden on the neutral count.
    if (extentBound?.preferred) {
        return {
            ...base,
            anchor,
            extentBound,
            extentUnresolved: true,
            why: `${definition.why ?? ''} An extent IS authored (${JSON.stringify({ min: extentBound.min, max: extentBound.max })}) but as a PREFERRED_DEFAULT, so it is offered and not composed: the required extent remains unauthored.`,
        }
    }

    if (extentBound && Number.isFinite(extentBound.max)) {
        // A FRACTIONAL extent is resolved against this axis of the envelope, which is the whole point of
        // authoring the relationship rather than a metre value: the same knowledge gives 7.5 m on a 30 m
        // width and 10 m on a 40 m one. Containment is still checked at the widest permitted extent.
        // Multiplied exactly: the float product of 0.15 and 23 is not 3.45, and the interval is what a coach is given.
        const metres = (raw: unknown): number | null =>
            typeof raw === 'number' && Number.isFinite(raw) ? (extentBound.fractionOfAxis ? scaleExactly(raw, extent) : raw) : null
        const exact = metres(extentBound.max) as number
        /**
         * **Composed at the widest PRACTICAL extent — 14 October 2026, his §7:** *"Where practical rounding is
         * appropriate, apply it when the configuration is established so the actual game and its instructions
         * remain consistent."* The widest permitted extent is rounded INWARD to the practical grain (data,
         * `practical-rounding.json`; a proposal awaiting his confirmation), so on a 25 m width a channel is 6 m,
         * not 6.25 m, and the text states what the game holds. Inward means it can never leave the requirement;
         * where the required range holds no practical value the exact widest extent stands, as it always did.
         */
        const reach = practicalRequirement({ min: metres(extentBound.min), max: exact }, 'EXTENT_METRES').max ?? exact
        const outward = anchor === 0 ? 1 : -1
        const far = anchor + outward * reach
        return {
            ...base,
            interval: { from: Math.min(anchor, far), to: Math.max(anchor, far) },
            anchor,
            extentBound,
            extentUnresolved: false,
            why:
                `${definition.why ?? ''}${lateralWhy} Extent composed from the authored required bound ${JSON.stringify(extentBound)}; containment is checked at the widest permitted extent` +
                (reach !== exact ? `, rounded inward from ${exact} m to the practical ${reach} m.` : '.'),
        }
    }

    /**
     * **No metric extent is required, and RC-21's "beyond X (for team T)" is** (15 October 2026, stage K6): the element reaches
     * from its anchor back to X's far edge in T's attacking direction. Only along the axis, where the relation is stated. A metric
     * extent, where one is required, composes instead (above) and the relation is then checked, never composed over it.
     */
    if (ctx.relativeBound?.of && ctx.relativeBound.forTeam && axis === 'along') {
        const attacks = ctx.teamAttackingEnd ? ctx.teamAttackingEnd(ctx.relativeBound.forTeam) : null
        const composed = composeBeyond(anchor, ctx.referentInterval ? ctx.referentInterval(ctx.relativeBound.of) : null, attacks)
        if ('unresolved' in composed) return { ...base, anchor, extentUnresolved: true, why: `${definition.why ?? ''}${lateralWhy} The extent is authored relative to another element and is not composed: ${composed.unresolved}.` }
        return {
            ...base,
            interval: composed.interval,
            anchor,
            relation: { term: ctx.relativeBound.term ?? '', of: { ...ctx.relativeBound.of }, forTeam: ctx.relativeBound.forTeam, direction: composed.direction, referentFarEdge: composed.far },
            extentUnresolved: false,
            why: `${definition.why ?? ''}${lateralWhy} Extent composed from the authored relation "${ctx.relativeBound.term}" for ${ctx.relativeBound.forTeam}: from the anchor back to the referent's far edge (${composed.far} m), the widest extent the relation admits.`,
        }
    }

    return { ...base, anchor, extentBound, extentUnresolved: true, why: definition.why ?? '' }
}
