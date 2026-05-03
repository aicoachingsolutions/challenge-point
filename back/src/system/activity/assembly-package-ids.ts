import type { SystemAssemblyInput } from '../types'

/** Normalizes registry / Mongo ids to plain strings (must match across prompt, payload, mapper, and output validation). */
export function registryIdString(value: unknown): string {
    if (value == null) {
        return ''
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
        return String(value).trim()
    }
    if (typeof value === 'object') {
        const o = value as { _id?: unknown; id?: unknown }
        return String(o._id ?? o.id ?? '').trim()
    }
    return String(value).trim()
}

/** Canonical affordance id list for assembly prompt, AI payload `selectedAffordanceIds`, legacy projection, and validation (primary first, then supporting). */
export function getAssemblySelectedAffordanceIds(input: SystemAssemblyInput): string[] {
    const primary = registryIdString(
        (input.affordances.primary as { _id?: unknown; id?: unknown })._id ??
            (input.affordances.primary as { id?: unknown }).id
    )
    const supporting = input.affordances.supporting.map((a) =>
        registryIdString((a as { _id?: unknown; id?: unknown })._id ?? (a as { id?: unknown }).id)
    )
    return [primary, ...supporting].filter((s) => s.length > 0)
}

/** Canonical constraint id list for assembly prompt, AI payload `selectedConstraintIds`, legacy projection, and validation. */
export function getAssemblySelectedConstraintIds(input: SystemAssemblyInput): string[] {
    return [
        input.constraintPackage.foundation.constraint._id,
        input.constraintPackage.shaping.constraint._id,
        input.constraintPackage.consequence?.constraint._id,
    ]
        .map((id) => registryIdString(id))
        .filter((s) => s.length > 0)
}
