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
 *
 * **A paired item** (stage B, 23 October 2026, the design's K2): an item carrying `defersWith`, naming an item of its own
 * contract that carries the deferral, moves out with that item wherever it defers, and never on its own (below).
 */
import { designationKey, isDesignationAttribute, resolutionOf } from './designation'
import { RegisterIndex } from './register'
import { parseSelector } from './selector'
import { ContractItem, DEFERS_TO_AUTHORIZED_REALIZATION, DeferredItem, LoadedContract, ROLE_YIELD_KEY, ROLE_YIELD_MARKERS, RoleYield } from './types'

/**
 * What the deferral reads of a context relationship (the authorization records hold the whole entry). Since stage A (22 October 2026)
 * the relationships of EVERY kind the records hold are passed (`contextRelationships`), since what is read here is kind-neutral.
 */
export interface AuthorizingRelationship {
    id: string
    contextId: string
    /** The register rows the relationship authorizes a realization to author. */
    rows: string[]
    status: string
    /**
     * The items (`contractId::itemId`) a CONFIRMED relationship names as those it supersedes, for one role (stage A; read only by
     * `applyRoleYields`). Absent on every relationship recorded on 22 October 2026; since Stage F (26 October 2026) the one context
     * scoring relationship recorded names four.
     */
    supersedes?: string[]
    /**
     * **The one scoring event a context SCORING relationship authorizes** (stage A review fix, 22 October 2026; a member of the register's
     * scoring-event vocabulary, checked where the records load). Read by `applyRoleYields`: an item writing a role's own event counts as
     * citing the relationship only where the event it writes IS this one, and a relationship naming none authorizes no role yield at all.
     * Christian, reply filed 25 October 2026, item 2: *"preserving structural validation and knowledge authorization."*
     */
    scoringEvent?: string
    /**
     * **The one role a context SCORING relationship is confirmed for** (stage A review fix; the design's K3: *"authorizing rows B9 and J2
     * for the pressing role only"*; a member of the register's role vocabulary, checked where the records load). Carried onto each citation
     * and compared, per role, by GA-ROLE-EVENTS clause 6; a relationship naming none authorizes no role yield.
     */
    role?: string
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

/**
 * **The teams a selector names, as designation keys** (stage A, 22 October 2026) — every value of a designation-valued term, sorted, or
 * null where it names no particular team (`namesParticularTeams` false). Two selectors name the same teams where their keys are equal.
 */
export function particularTeamsOf(item: ContractItem, index: RegisterIndex): string[] | null {
    if (!namesParticularTeams(item, index)) return null
    const row = String(item.row)
    const parsed = parseSelector(item.selector, row, index)
    if (!parsed.predicate || parsed.predicate.any) return null
    const keys = parsed.predicate.terms
        .filter(term => isDesignationAttribute(index, row, term.attribute))
        .flatMap(term => (term.op === 'IN' ? term.values : [term.value]))
        .map(value => designationKey(index, value))
    return [...new Set(keys)].sort()
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
            /**
             * **A deferring item that names particular teams defers only to an item naming the same teams** — stage A, 22 October 2026
             * (design section 3, "Deferral tightening"). Until this only the row was compared, so an item written for one end's team would
             * have deferred to a realization item written for the OTHER end's team (measured in the stage A unit test on a TEST-ONLY copy:
             * a reference keyed to the other end moved it out). An item naming every team (C56's equal-numbers item) is unchanged: any
             * citing item naming particular teams still says something it cannot.
             */
            const ownTeams = particularTeamsOf(item, index)
            const citing: { contractId: string; itemId: string; relationship: string }[] = []
            for (const other of contracts) {
                if (other.contractId === contract.contractId) continue
                for (const candidate of other.items ?? []) {
                    if (String(candidate.row) !== row || !namesParticularTeams(candidate, index)) continue
                    if (ownTeams && JSON.stringify(particularTeamsOf(candidate, index)) !== JSON.stringify(ownTeams)) continue
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
        /**
         * **A paired item yields with the item it names** — 23 October 2026 (stage B, the design's K2). An item carrying `defersWith` (written
         * only by a ruled restatement, which admits it only where it names an item of the same contract carrying `defersTo`) is moved out
         * together with that item wherever that item defers here, whole, listing the item it is paired with and what that item defers to; it
         * never defers on its own, and where its partner stays, it stays. Only one level: the partner must defer in its own right (the
         * loader refuses a pairing naming an item without `defersTo`, so a chain cannot be written). For K2: the region the deferring objective
         * reference points to yields with that reference, so two targets remain, not three; the original stays visible in `deferredItems`.
         */
        for (const item of contract.items ?? []) {
            const partner = typeof item.defersWith === 'string' ? item.defersWith : null
            if (!partner || item.defersTo !== undefined) continue
            const deferring = moving.find(entry => entry.item.itemId === partner && entry.defersWith === undefined)
            if (!deferring) continue
            moving.push({ item: JSON.parse(JSON.stringify(item)) as ContractItem, defersTo: DEFERS_TO_AUTHORIZED_REALIZATION, deferredTo: deferring.deferredTo.map(ref => ({ ...ref })), relationship: deferring.relationship, defersWith: partner })
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

/**
 * **Where a marked item may be departed from for one role, in this composition** — stage A, 22 October 2026 (register version 16,
 * `roleScoring.roleYield`). Christian, reply filed 25 October 2026, item 2: *"Please implement this as a general role-specific scoring
 * capability, preserving structural validation and knowledge authorization."* His 15 October answer 9 is the rule, as for C56: *"General
 * requirements remain applicable unless the specific knowledge explicitly supersedes them through an authorized relationship."*
 *
 * An item carrying the role-yield marker (`ROLE_YIELD_KEY`, written only by a ruled restatement) is cited, in a composition, by every item
 * of ANOTHER selected contribution that:
 *
 *   - writes a role's own scoring event (the register's `roleScoring.eventRow`) or an objective's reference (`targetOf.referenceRow`);
 *   - cites, in `authorizedBy`, a relationship whose status is CONFIRMED, which authorizes that row, whose context is the one the
 *     contribution realizes, and which names the marked item (`contractId::itemId`) among those it supersedes;
 *   - **and that relationship names the one scoring event and the one role it authorizes** (stage A review fix, 22 October 2026), and, on
 *     the event row, the item writes exactly that event (an EQUALS of that one value). Until this fix a relationship confirming one event
 *     let a role depart to ANY event: the event it authorizes was validated as present and read by nothing (measured in the review, a
 *     relationship confirming one event cited by an item writing another stood). A citation failing this is recorded under `refused`,
 *     with why, so clause 6 can name it; it is never counted.
 *
 * Each cited marked item is recorded, with its citing items (and what each relationship authorizes), in `roleYields` on a COPY of its
 * contract. NOTHING IS MOVED: the item stays in `items` and keeps governing every line it governs; what it permits for a role's event or
 * target is decided by GA-ROLE-EVENTS clause 6, which reads this record (and compares the role and the event per team). Anywhere nothing is
 * cited (every composition on 22 October 2026) the input is returned unchanged, object for object. Names no row, kind, role or item: the
 * rows come from the register, the items and relationships from the data.
 */
export function applyRoleYields(contracts: LoadedContract[], relationships: AuthorizingRelationship[], index: RegisterIndex): LoadedContract[] {
    const scoring = index.roleScoring
    const target = index.targetOf
    if (!scoring || !target) return contracts
    const citingRows = [scoring.eventRow, target.referenceRow]
    return contracts.map(contract => {
        const yields: RoleYield[] = []
        for (const item of contract.items ?? []) {
            const marker = (item as unknown as Record<string, unknown>)[ROLE_YIELD_KEY]
            if (!(ROLE_YIELD_MARKERS as readonly unknown[]).includes(marker)) continue
            const key = `${contract.contractId}::${item.itemId}`
            const citedBy: RoleYield['citedBy'] = []
            const refused: NonNullable<RoleYield['refused']> = []
            for (const other of contracts) {
                if (other.contractId === contract.contractId) continue
                const realizes = (other as { realizes?: unknown }).realizes
                for (const candidate of other.items ?? []) {
                    const row = String(candidate.row)
                    if (!citingRows.includes(row) || typeof candidate.authorizedBy !== 'string') continue
                    const relationship = relationships.find(entry => entry.id === candidate.authorizedBy)
                    if (!relationship || relationship.status !== RELATIONSHIP_CONFIRMED || !relationship.rows.includes(row)) continue
                    if (typeof realizes !== 'string' || realizes !== relationship.contextId) continue
                    if (!Array.isArray(relationship.supersedes) || !relationship.supersedes.includes(key)) continue
                    const citation = { contractId: other.contractId, itemId: candidate.itemId, row, relationship: relationship.id }
                    const named = (value: unknown): string | null => (typeof value === 'string' && value.trim().length > 0 ? value : null)
                    const event = named(relationship.scoringEvent)
                    const role = named(relationship.role)
                    if (!event || !role) {
                        refused.push({ ...citation, why: `${relationship.id} names no ${!event ? 'scoring event' : 'role'} it authorizes, so it authorizes no role yield` })
                        continue
                    }
                    if (row === scoring.eventRow) {
                        const writes = String(candidate.requirement) === 'EQUALS' && typeof candidate.value === 'string' ? candidate.value : null
                        if (writes !== event) {
                            refused.push({ ...citation, why: `it writes the event ${JSON.stringify(candidate.value)}, and ${relationship.id} confirms only ${JSON.stringify(event)}` })
                            continue
                        }
                    }
                    citedBy.push({ ...citation, scoringEvent: event, role })
                }
            }
            if (citedBy.length || refused.length) yields.push({ itemId: item.itemId, marker: String(marker), citedBy, ...(refused.length ? { refused } : {}) })
        }
        if (!yields.length) return contract
        const copy: LoadedContract = JSON.parse(JSON.stringify(contract))
        copy.roleYields = [...(copy.roleYields ?? []), ...yields]
        return copy
    })
}
