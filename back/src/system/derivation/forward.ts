/**
 * Derivation engine — stage 8, Forward results (package §1.8, §2.2; SD-46).
 *
 * One result per admitted item, from the closed vocabulary, first that applies. Forward results are a
 * separate list: they are never a property's verdict.
 *
 * SD-46: "A supporting contribution whose realization conditions are not satisfied is NOT REALIZED."
 * It is an item outcome, not a property status; it creates no gap, because the contribution is
 * supporting rather than required, and no invented verdict.
 */

import { ClassifiedLine } from './classify'
import { DerivedLine } from './derive'
import { ApplicationSet } from './scope'
import { ForwardResult, ItemRef, LoadedContract, ResolutionLine } from './types'
import { RegisterIndex } from './register'

export interface ItemOutcome {
    item: ItemRef
    result: ForwardResult
    /** The lines this item was judged against. */
    reach: string[]
    why: string
}

const EXISTENCE_REQUIREMENTS = new Set(['EXISTS', 'COUNT', 'RANGE'])

export function forwardResults(
    contracts: LoadedContract[],
    lines: ResolutionLine[],
    derived: Map<string, DerivedLine>,
    classified: Map<string, ClassifiedLine>,
    applicationSets: ApplicationSet[],
    index: RegisterIndex,
): ItemOutcome[] {
    const outcomes: ItemOutcome[] = []
    const applicationByItem = new Map(applicationSets.map(a => [`${a.item.contractId}:${a.item.itemId}`, a]))

    for (const contract of contracts) {
        for (const item of contract.items || []) {
            const ref: ItemRef = { contractId: contract.contractId, itemId: item.itemId }
            const key = `${ref.contractId}:${ref.itemId}`
            const supporting = item.strictness === 'SUPPORTING'

            // Outside the representation by his own boundary — counted, never dropped, never checked.
            if (item.checkability === 'OUTSIDE_BOUNDARY') {
                outcomes.push({ item: ref, result: 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION', reach: [], why: 'recorded outside the representation boundary' })
                continue
            }
            if (item.valueStatus === 'TYPICAL_EXAMPLE' || item.basis === 'ENGINE_ONLY') {
                outcomes.push({ item: ref, result: 'INERT', reach: [], why: item.basis === 'ENGINE_ONLY' ? 'engine wording supports nothing (SD-21)' : 'a typical example is informative only' })
                continue
            }

            // Existence is a claim on a COLLECTION row. The same requirement kinds on a field row are
            // ordinary value requirements — a count field is not an existence claim.
            const isExistence = EXISTENCE_REQUIREMENTS.has(String(item.requirement)) && index.rows.get(String(item.row))?.kind === 'COLLECTION'

            // An existence item establishes its own class in derivation mode: nothing contradicts it,
            // and its cardinality is checked against candidate elements only in checking mode.
            if (isExistence) {
                const application = applicationByItem.get(key)
                const formedClass = application && application.classIds.some(id => id.endsWith(`:${item.itemId}`))
                outcomes.push({
                    item: ref,
                    result: formedClass ? 'SATISFIED' : supporting ? 'NOT_REALIZED' : 'UNMET',
                    reach: [],
                    why: formedClass ? 'the existence requirement established its class' : 'no class was formed from this requirement',
                })
                continue
            }

            const reached = lines.filter(line => {
                if (line.row !== String(item.row)) return false
                const record = derived.get(line.lineId)
                if (!record) return false
                return (
                    record.entailing.some(e => e.item.itemId === ref.itemId && e.item.contractId === ref.contractId) ||
                    record.bounding.some(b => b.item.itemId === ref.itemId && b.item.contractId === ref.contractId) ||
                    record.undetermined.some(u => u.itemId === ref.itemId && u.contractId === ref.contractId)
                )
            })

            if (!reached.length) {
                outcomes.push({
                    item: ref,
                    result: supporting ? 'NOT_REALIZED' : 'UNMET',
                    reach: [],
                    why: 'the item reached no line: its realization conditions are not satisfied (SD-46)',
                })
                continue
            }

            const verdicts = reached.map(l => classified.get(l.lineId)?.verdict)
            const reachIds = reached.map(l => l.lineId)

            if (verdicts.some(v => v === 'RESOLVED:ENTAILED')) {
                outcomes.push({ item: ref, result: 'SATISFIED', reach: reachIds, why: 'the line it reaches is entailed' })
                continue
            }
            if (verdicts.some(v => v && v.startsWith('FREE'))) {
                // Derivation mode: the item's only unmet dependency is a line the downstream choice
                // process will fill. That is pending, not broken.
                outcomes.push({ item: ref, result: 'PENDING_CHOICE', reach: reachIds, why: 'the line it reaches is an authorized freedom, not yet chosen' })
                continue
            }
            if (verdicts.some(v => v === 'UNRESOLVED')) {
                outcomes.push({ item: ref, result: supporting ? 'NOT_REALIZED' : 'UNMET', reach: reachIds, why: 'the line it reaches is unresolved' })
                continue
            }

            outcomes.push({
                item: ref,
                result: supporting ? 'NOT_REALIZED' : 'UNMET',
                reach: reachIds,
                why: 'the line it reaches has no authored value',
            })
        }
    }

    return outcomes.sort((a, b) => `${a.item.contractId}:${a.item.itemId}`.localeCompare(`${b.item.contractId}:${b.item.itemId}`))
}
