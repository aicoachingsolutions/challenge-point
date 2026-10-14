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
 *   - `DEFAULT` — no supporting item is required, and the strongest is a `PREFERRED_DEFAULT`. His sentence
 *     above, on the value-status axis — the axis SD-90 already reads for "required" (`derive.ts`,
 *     applyDisplacement);
 *   - `ADVISORY` — the strongest support is an item the rule could stand without (strictness `SUPPORTING`)
 *     with a required or N/A value status. **This mapping awaits his ruling (OD2)**; since 14 October 2026 it
 *     is rendered (status ADVISORY, hedged), so he can see every sentence it affects.
 *
 * Each item is read on its own and the value takes the strongest reading (`readingOf`) — the mixed case was
 * settled that way on 14 October 2026.
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

/**
 * **One item's own reading** — and a value takes the STRONGEST of its items' readings. Settled 14 October 2026
 * (stage S-C1, from the S-B review): a value supported by a REQUIRED-strictness PREFERRED_DEFAULT item and a
 * SUPPORTING REQUIRED_RANGE item read ADVISORY, because the two rules above were asked in an order rather than of
 * each item — the advisory item outranked the item the rule requires. The stronger requirement wins: the required
 * item makes the value where the activity starts (DEFAULT), never merely advice. The order is REQUIRED, DEFAULT,
 * ADVISORY. No value on today's corpus has mixed support (measured over every composition in the S-B review), so
 * nothing served moves; `strength.unit.ts` pins the case.
 */
function readingOf(item: any): Strength | null {
    const strictness = String(item.strictness)
    if (strictness === 'REQUIRED' && binding(item.valueStatus)) return 'REQUIRED'
    if (String(item.valueStatus) === 'PREFERRED_DEFAULT') return 'DEFAULT'
    if (strictness === 'SUPPORTING' && binding(item.valueStatus)) return 'ADVISORY'
    // A marking outside the three readings (none on today's corpus): rendered as before, never softened.
    return null
}

const ORDER: Strength[] = ['REQUIRED', 'DEFAULT', 'ADVISORY']

export function strengthOf(support: SupportRef[] | undefined, items: Map<string, any>): Strength {
    const refs = support ?? []
    if (!refs.length) return 'REQUIRED'
    if (refs.some(ref => ref.kind === 'STANDING_DECISION' || ref.kind === 'SESSION')) return 'REQUIRED'
    const supporting = refs.map(ref => (ref.kind === 'CONTRACT_ITEM' ? items.get(`${ref.contractId}:${ref.itemId}`) : undefined))
    if (supporting.some(item => !item)) return 'REQUIRED'
    const readings = supporting.map(readingOf)
    if (readings.some(reading => reading === null)) return 'REQUIRED'
    return readings.reduce<Strength>((strongest, reading) => (ORDER.indexOf(reading!) < ORDER.indexOf(strongest) ? reading! : strongest), 'ADVISORY')
}
