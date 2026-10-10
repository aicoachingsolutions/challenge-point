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

import { RegisterIndex } from '../derivation/register'

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
    /** Where an authored extent was available, the bound it came from. */
    extentBound?: { min?: number | null; max?: number | null; preferred?: boolean; fractionOfAxis?: boolean; term?: string }
    /** True where the position is fixed and the extent is not. */
    extentUnresolved: boolean
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
 * meaning, the other axis: *end-near* "touches the 0 end line and does not contain the midpoint",
 * *end-far* "touches the L end line and does not contain the midpoint". `end` is either, so it names
 * no end and places nothing.
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
}

export function realizeSpatialRelation(value: unknown, index: RegisterIndex, ctx: SpatialContext): RealizedGeometry | null {
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
        const scale = extentBound.fractionOfAxis ? extent : 1
        const outward = anchor === 0 ? 1 : -1
        const far = anchor + outward * (extentBound.max as number) * scale
        return {
            ...base,
            interval: { from: Math.min(anchor, far), to: Math.max(anchor, far) },
            anchor,
            extentBound,
            extentUnresolved: false,
            why: `${definition.why ?? ''}${lateralWhy} Extent composed from the authored required bound ${JSON.stringify(extentBound)}; containment is checked at the widest permitted extent.`,
        }
    }

    return { ...base, anchor, extentBound, extentUnresolved: true, why: definition.why ?? '' }
}
