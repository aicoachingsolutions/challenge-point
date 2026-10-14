/**
 * How binding a derived value is — computed once, from the items that support it, and carried.
 *
 * Christian, 14 October 2026, approving Step 4's second component: *"Preserve whether each condition is
 * required, preferred, advisory, or left to the coach, all the way through rendering and validation."* And of
 * defaults: *"A default should not automatically become a requirement simply because it is the only authored
 * value. The engine should preserve that distinction."*
 *
 * **Why it is needed.** A derived entry's support names the items behind it — `contractId`, `itemId`,
 * relation — and nothing about how strongly each one binds. The strength lived on the item and stopped there,
 * so every derived value reached the renderer looking like a requirement: the possession game's
 * *"play continues when possession changes"* is authored once, as a preferred default the rule could stand
 * without, and was stated to a coach as a fact of the game.
 *
 * Three answers, read off the items' own markings and nothing else:
 *
 *   - `REQUIRED` — some supporting item is required (strictness `REQUIRED`) with a required or N/A value
 *     status, or the value comes from a standing decision or the session;
 *   - `DEFAULT` — every supporting item is a `PREFERRED_DEFAULT`. His sentence above, on the value-status
 *     axis — the axis SD-90 already reads for "required" (`derive.ts`, applyDisplacement);
 *   - `ADVISORY` — the strongest support is an item the rule could stand without (strictness `SUPPORTING`)
 *     with a required or N/A value status. **This mapping awaits his ruling (OD2)**; it is computed and
 *     carried so the decision costs nothing to apply, and nothing renders it yet.
 *
 * An item the contracts do not hold — or a value with no support at all — reads `REQUIRED`, which is exactly
 * how every value rendered before this existed: nothing is softened on a guess.
 *
 * Sport-neutral: it reads markings, never values.
 */
import { LoadedContract, SupportRef } from './types'

export type Strength = 'REQUIRED' | 'DEFAULT' | 'ADVISORY'

/** Every item of the selected contracts, keyed `contractId:itemId` — the key `applyDisplacement` uses. */
export function itemsByRef(contracts: LoadedContract[]): Map<string, any> {
    const items = new Map<string, any>()
    for (const contract of contracts) for (const item of contract.items ?? []) items.set(`${contract.contractId}:${item.itemId}`, item)
    return items
}

const binding = (status: unknown) => status === 'REQUIRED_RANGE' || status === 'N/A'

export function strengthOf(support: SupportRef[] | undefined, items: Map<string, any>): Strength {
    const refs = support ?? []
    if (!refs.length) return 'REQUIRED'
    if (refs.some(ref => ref.kind === 'STANDING_DECISION' || ref.kind === 'SESSION')) return 'REQUIRED'
    const supporting = refs.map(ref => (ref.kind === 'CONTRACT_ITEM' ? items.get(`${ref.contractId}:${ref.itemId}`) : undefined))
    if (supporting.some(item => !item)) return 'REQUIRED'
    if (supporting.some(item => String(item.strictness) === 'REQUIRED' && binding(item.valueStatus))) return 'REQUIRED'
    if (supporting.every(item => String(item.valueStatus) === 'PREFERRED_DEFAULT')) return 'DEFAULT'
    if (supporting.some(item => String(item.strictness) === 'SUPPORTING' && binding(item.valueStatus))) return 'ADVISORY'
    // A marking outside the three readings (none on today's corpus): rendered as before, never softened.
    return 'REQUIRED'
}
