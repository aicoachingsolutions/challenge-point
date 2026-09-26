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
import { ElementClass, ForwardResult, ItemRef, LoadedContract, ResolutionLine } from './types'
import { RegisterIndex } from './register'
import { parseSelector } from './selector'
import { reaches } from './reach'
import { ForbiddenCardinality } from './corpus-restatement'

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
    classes: ElementClass[] = [],
): ItemOutcome[] {
    const outcomes: ItemOutcome[] = []
    const applicationByItem = new Map(applicationSets.map(a => [`${a.item.contractId}:${a.item.itemId}`, a]))

    for (const contract of contracts) {
        for (const item of contract.items || []) {
            const ref: ItemRef = { contractId: contract.contractId, itemId: item.itemId }
            const key = `${ref.contractId}:${ref.itemId}`
            const supporting = item.strictness === 'SUPPORTING'

            // Satisfied by construction: the schema invariant the item names entails its requirement,
            // and the loader has already checked that the invariant holds. The claim is met — so this is
            // SATISFIED, not inert and not outside the representation.
            if (String(item.row) === 'BY_CONSTRUCTION') {
                outcomes.push({
                    item: ref,
                    result: 'SATISFIED',
                    reach: [],
                    why: `entailed by the schema invariant ${String((item as any).satisfiedBy)}`,
                })
                continue
            }

            // Outside the representation by his own boundary — counted, never dropped, never checked.
            if (item.checkability === 'OUTSIDE_BOUNDARY') {
                outcomes.push({ item: ref, result: 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION', reach: [], why: 'recorded outside the representation boundary' })
                continue
            }
            if (item.valueStatus === 'TYPICAL_EXAMPLE' || item.basis === 'ENGINE_ONLY') {
                outcomes.push({ item: ref, result: 'INERT', reach: [], why: item.basis === 'ENGINE_ONLY' ? 'engine wording supports nothing (SD-21)' : 'a typical example is informative only' })
                continue
            }

            const row = index.rows.get(String(item.row))

            // SD-75 — negative existence, a general treatment for collections and not specific to any
            // one row. In his words: satisfied when no represented element within the item's
            // authoritative scope matches its selector; unmet when one or more matching elements exist;
            // not evaluable when the relevant collection or selector cannot itself be structurally
            // established.
            //
            // This completes the semantics of an existing requirement kind. It sits **after** the
            // outside-the-representation guard above, so an item his boundary places outside is never
            // pulled inside by it.
            // SD-85 — an exclusion carrying an existence or count requirement is a negative existence
            // claim, so it is evaluated through SD-75's treatment against the structure support-capable
            // contributions established. No separate exclusion mechanism is created: §3 says an
            // exclusion is "checked only as an exclusion", and this is that check.
            const isExclusionOfExistence =
                item.strictness === 'EXCLUSION' && EXISTENCE_REQUIREMENTS.has(String(item.requirement)) && row?.kind === 'COLLECTION'

            if (String(item.requirement) === 'NOT_EXISTS' || isExclusionOfExistence) {
                if (!row || row.kind !== 'COLLECTION') {
                    outcomes.push({
                        item: ref,
                        result: 'NOT_EVALUABLE',
                        reach: [],
                        why: `negative existence needs a structurally established collection; ${String(item.row)} is ${row ? row.kind : 'not a register row'}`,
                    })
                    continue
                }
                const parsed = parseSelector(item.selector, String(item.row), index)
                if (!parsed.predicate) {
                    outcomes.push({ item: ref, result: 'NOT_EVALUABLE', reach: [], why: 'the selector does not normalise, so what it excludes cannot be established' })
                    continue
                }

                // The authoritative scope: the classes this item applies to, or every class of the row
                // where scope resolution named none.
                const application = applicationByItem.get(key)
                const inScope = classes.filter(c => c.row === String(item.row) && (!application || !application.classIds.length || application.classIds.includes(c.classId)))
                const reach = inScope.map(c => ({ classId: c.classId, verdict: reaches(parsed.predicate!, c) }))
                const matching = reach.filter(r => r.verdict === 'TRUE')
                const undetermined = reach.filter(r => r.verdict === 'UNDETERMINED')

                // The bound beyond which existence is forbidden. A plain negative existence forbids any
                // match; a count-bearing exclusion forbids only a cardinality at or above its threshold.
                // Where that threshold is stated in prose it is **not** read out of the text — SD-32
                // forbids that, and guessing it here would decide the item's meaning.
                // SD-86 — an exclusion's own authored bound, in typed form. Its comparison is applied as
                // the author wrote it; nothing is read out of the prose value, which stays beside it as
                // the source. Where no typed bound exists the item is not evaluable, and stays so: a
                // bound is never inferred, and never borrowed from the schema invariant.
                let forbidden: ForbiddenCardinality = { operator: '>=', value: 1 }
                if (isExclusionOfExistence && String(item.requirement) === 'COUNT') {
                    const typed = (item as any).forbiddenCardinality as ForbiddenCardinality | undefined
                    const stated = typed ?? (typeof item.value === 'number' ? ({ operator: '>=', value: item.value } as ForbiddenCardinality) : null)
                    if (!stated) {
                        outcomes.push({
                            item: ref,
                            result: 'NOT_EVALUABLE',
                            reach: inScope.map(c => c.classId),
                            why: `the cardinality this item forbids is stated in prose (${JSON.stringify(String(item.value))}), so the bound cannot be read without interpreting it`,
                        })
                        continue
                    }
                    forbidden = stated
                }

                const breaches = (count: number) => {
                    switch (forbidden.operator) {
                        case '>':
                            return count > forbidden.value
                        case '>=':
                            return count >= forbidden.value
                        case '<':
                            return count < forbidden.value
                        case '<=':
                            return count <= forbidden.value
                        case '=':
                            return count === forbidden.value
                        case '!=':
                            return count !== forbidden.value
                    }
                }

                if (breaches(matching.length)) {
                    outcomes.push({
                        item: ref,
                        result: 'UNMET',
                        reach: matching.map(m => m.classId),
                        why:
                            isExclusionOfExistence && String(item.requirement) === 'COUNT'
                                ? `${matching.length} represented element(s) breach the forbidden cardinality ${forbidden.operator} ${forbidden.value}`
                                : `${matching.length} represented element(s) match a selector this item excludes`,
                    })
                } else if (undetermined.length) {
                    outcomes.push({
                        item: ref,
                        result: 'NOT_EVALUABLE',
                        reach: undetermined.map(u => u.classId),
                        why: `${undetermined.length} element class(es) neither match nor contradict the excluded selector, so absence cannot be established (SD-49)`,
                    })
                } else {
                    outcomes.push({
                        item: ref,
                        result: 'SATISFIED',
                        reach: matching.map(m => m.classId),
                        why:
                            isExclusionOfExistence && String(item.requirement) === 'COUNT'
                                ? `${matching.length} represented element(s), within the authored bound (forbidden ${forbidden.operator} ${forbidden.value})`
                                : inScope.length
                                  ? `no element of ${String(item.row)} in scope matches the excluded selector`
                                  : `no element of ${String(item.row)} is represented at all, so none matches`,
                    })
                }
                continue
            }

            // Existence is a claim on a COLLECTION row. The same requirement kinds on a field row are
            // ordinary value requirements — a count field is not an existence claim.
            const isExistence = EXISTENCE_REQUIREMENTS.has(String(item.requirement)) && row?.kind === 'COLLECTION'

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
