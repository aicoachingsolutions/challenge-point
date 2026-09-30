/**
 * Instantiating an authored relational spatial bound against the concrete session envelope.
 *
 * His ruling of 30 September, and the constraint that shapes all of it:
 *
 *   > *I do not want ecological/spatial relationships such as attacking end, touchline-adjacent, full
 *   > axis extent, across the direction of progression replaced in the knowledge layer by arbitrary
 *   > metre values merely to make validation executable. Instead … the minimum general mechanism by
 *   > which realization can instantiate an authored relational spatial bound against the concrete
 *   > session envelope.*
 *
 * So the authored phrase is never replaced. It stays as the value, as the authority and as the
 * provenance; what this adds beside it is what the phrase **entails** about a 40 × 30 envelope. Two
 * kinds, and the distinction is the honest part:
 *
 *   **interval** — the phrase states both ends. *"end line to end line"* is the whole axis. Reading
 *   that as `[0, 40]` on a 40 m axis is not a choice; it is what the words mean.
 *
 *   **anchor** — the phrase states one coordinate and says nothing about extent. *"touchline-adjacent"*
 *   fixes an edge on the touchline; how wide the channel is, Wide Zone explicitly does not author
 *   (*"no scaling rule for width"*). So it yields an anchor and the extent stays **unresolved**.
 *
 * **Nothing here invents a distance.** Where the phrase is silent, the result is silent, and a check
 * reading it gets an honest "one coordinate known, extent unauthored" rather than a fabricated number.
 * The terms live in the register as data, so the engine stays sport-neutral and no phrase is compiled in.
 */

import { RegisterIndex } from '../derivation/register'

export interface RealizedGeometry {
    /** The authored phrase, unchanged — the authority for everything else here. */
    asAuthored: string
    axis: 'along' | 'across'
    /** Both ends, in metres, where the phrase entails them. */
    interval?: { from: number; to: number }
    /** One coordinate, in metres, where the phrase entails only that. */
    anchor?: number
    /** True where the phrase fixes a position but not an extent. */
    extentUnresolved: boolean
    /** Why this and nothing more — the register's own reason, carried so the limit is visible. */
    why: string
}

interface TermDefinition {
    kind: 'interval' | 'anchor'
    axis: 'along' | 'across'
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

/**
 * What an authored spatial phrase entails about this envelope, or `null` where the register knows no
 * such term — in which case the value stays exactly the prose it was, and nothing pretends otherwise.
 */
export function realizeSpatialRelation(
    value: unknown,
    envelope: { lengthM?: number; widthM?: number },
    index: RegisterIndex,
): RealizedGeometry | null {
    if (typeof value !== 'string') return null
    const terms = (index.spatialRelations ?? {}) as Record<string, TermDefinition>
    const definition = terms[value]
    if (!definition) return null

    const axes = axisLengths(envelope)
    if (!axes) return null
    const extent = axes[definition.axis]

    if (definition.kind === 'interval' && definition.from !== undefined && definition.to !== undefined) {
        return {
            asAuthored: value,
            axis: definition.axis,
            interval: { from: definition.from * extent, to: definition.to * extent },
            extentUnresolved: false,
            why: definition.why ?? '',
        }
    }
    if (definition.kind === 'anchor' && definition.at !== undefined) {
        return {
            asAuthored: value,
            axis: definition.axis,
            anchor: definition.at * extent,
            extentUnresolved: true,
            why: definition.why ?? '',
        }
    }
    return null
}
