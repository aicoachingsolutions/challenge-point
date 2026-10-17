/**
 * **A general requirement that defers to a knowledge-authorized realization — ruling C56.** Added 15 October 2026 (stage K4).
 *
 * Christian, reply filed 17 October 2026, D6: *"If the 6 + GK versus 5 configuration requires a narrow exception to the
 * possession game's equal-outfield-number rule, please document it as a knowledge-authorized realization, preserving equal
 * numbers as an alternative."* And *"Please authorize this initial numerical asymmetry through the appropriate existing
 * knowledge relationship, rather than hardcoding it to Play Out from the Back."* His 15 October answer 9 is the rule this
 * applies: *"General requirements remain applicable unless the specific knowledge explicitly supersedes them through an
 * authorized relationship."* He confirmed the relationship in his reply filed 18 October 2026, item 5: *"Both should be
 * represented as knowledge-authorized relationships rather than hardcoded behavior for this Learning Goal."*
 *
 * **What defers, and when.** An item carrying `defersTo: AUTHORIZED_REALIZATION` (written only by a ruled restatement;
 * C56 puts it on the possession game's equal-numbers item and on nothing else) defers in a composition where some OTHER
 * selected contribution:
 *
 *   - authors the same row PER TEAM — its selector names a team through a designation-valued attribute, by a designation
 *     that picks out particular teams (never every team), so the realization says something a single equal count cannot;
 *   - cites, in `authorizedBy`, a context-manipulation relationship whose status is CONFIRMED, which authorizes that row,
 *     and whose context is the one the contribution realizes.
 *
 * Then the item is moved out of its contract's `items` into `deferredItems`, whole and with what it defers to, on a COPY of
 * that contract: no check in the composition evaluates it (the roster's equality, the post-realization comparisons), and
 * the alternative stays visible to every reader of the input. Anywhere else nothing changes, and the input is returned
 * unchanged object for object. Nothing here names a row, a goal, a designation or a manipulation: the rows come from the
 * deferring item, the designations from the register, the relationships from the records.
 */
import { isDesignationAttribute, resolutionOf } from './designation'
import { RegisterIndex } from './register'
import { parseSelector } from './selector'
import { ContractItem, DEFERS_TO_AUTHORIZED_REALIZATION, DeferredItem, LoadedContract } from './types'

/** What the deferral reads of a context-manipulation relationship (the authorization records hold the whole entry). */
export interface AuthorizingRelationship {
    id: string
    contextId: string
    /** The register rows the relationship authorizes a realization to author. */
    rows: string[]
    status: string
}

/** The one status under which a relationship authorizes anything: he has confirmed it. */
export const RELATIONSHIP_CONFIRMED = 'CONFIRMED'

/** Does this selector name particular teams — a designation-valued attribute, a designation that is not every team? */
export function namesParticularTeams(item: ContractItem, index: RegisterIndex): boolean {
    const row = String(item.row)
    const parsed = parseSelector(item.selector, row, index)
    if (!parsed.predicate || parsed.predicate.any) return false
    return parsed.predicate.terms.some(term => {
        if (!isDesignationAttribute(index, row, term.attribute)) return false
        const values = term.op === 'IN' ? term.values : [term.value]
        return values.length > 0 && values.every(value => {
            const resolved = resolutionOf(index, value)
            return !!resolved && resolved.kind !== 'ALL'
        })
    })
}

/** The relationship an item cites, where it cites one that authorizes its row for the context its contract realizes. */
function authorizingRelationship(contract: LoadedContract, item: ContractItem, relationships: AuthorizingRelationship[]): AuthorizingRelationship | null {
    if (typeof item.authorizedBy !== 'string') return null
    const relationship = relationships.find(entry => entry.id === item.authorizedBy)
    if (!relationship || relationship.status !== RELATIONSHIP_CONFIRMED) return null
    if (!relationship.rows.includes(String(item.row))) return null
    const realizes = (contract as { realizes?: unknown }).realizes
    return typeof realizes === 'string' && realizes === relationship.contextId ? relationship : null
}

/**
 * The composition with every item that defers moved aside, and the deferrals. The input is never mutated: a contract that
 * has something deferring is copied, every other contract is returned as the same object.
 */
export function applyRealizationDeferrals(
    contracts: LoadedContract[],
    relationships: AuthorizingRelationship[],
    index: RegisterIndex,
): { contracts: LoadedContract[]; deferred: (DeferredItem & { contractId: string })[] } {
    const deferred: (DeferredItem & { contractId: string })[] = []
    const result = contracts.map(contract => {
        const moving: DeferredItem[] = []
        for (const item of contract.items ?? []) {
            if (item.defersTo !== DEFERS_TO_AUTHORIZED_REALIZATION) continue
            const row = String(item.row)
            const citing: { contractId: string; itemId: string; relationship: string }[] = []
            for (const other of contracts) {
                if (other.contractId === contract.contractId) continue
                for (const candidate of other.items ?? []) {
                    if (String(candidate.row) !== row || !namesParticularTeams(candidate, index)) continue
                    const relationship = authorizingRelationship(other, candidate, relationships)
                    if (relationship) citing.push({ contractId: other.contractId, itemId: candidate.itemId, relationship: relationship.id })
                }
            }
            if (!citing.length) continue
            const named = [...new Set(citing.map(entry => entry.relationship))]
            moving.push({
                item: JSON.parse(JSON.stringify(item)) as ContractItem,
                defersTo: DEFERS_TO_AUTHORIZED_REALIZATION,
                deferredTo: citing.map(({ contractId, itemId }) => ({ contractId, itemId })),
                relationship: named.join(', '),
            })
        }
        if (!moving.length) return contract
        const ids = new Set(moving.map(entry => entry.item.itemId))
        const copy: LoadedContract = JSON.parse(JSON.stringify(contract))
        copy.items = copy.items.filter(item => !ids.has(item.itemId))
        copy.deferredItems = [...(copy.deferredItems ?? []), ...moving]
        for (const entry of moving) deferred.push({ contractId: contract.contractId, ...entry })
        return copy
    })
    return { contracts: result, deferred }
}
