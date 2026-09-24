/**
 * Corpus repair — **restatement** (his ruling of 24 September, repair phase A).
 *
 * Restatement makes existing authored meaning machine-expressible. It changes no meaning, so it is
 * separate from encoding repair (`corpus-repair.ts`) and counted separately, and it is applied only
 * where he has ruled.
 *
 * **The one restatement ruled so far.** Twenty items record a contribution that intentionally claims no
 * Game Representation property, spelled `NONE` or as an em dash — neither registered. He added the
 * contract-level sentinel `NO_ROW` for exactly this, valid only where:
 *
 *   - the contribution is explicitly classified outside the representation;
 *   - it contains no structural requirement that must be held by the Game Representation;
 *   - its existing treatment is the established outside-representation treatment.
 *
 * And: *"NO_ROW must never be usable to suppress, bypass or reclassify a structural claim merely because
 * no suitable row exists."*
 *
 * So the restatement is **belt and braces**: the twenty items are named explicitly, so the change is
 * auditable rather than inferred by a rule that might drift — and every one is still checked against the
 * conditions before it is applied. An item on the list that does not satisfy them is **not** restated,
 * and is reported. The five structural-in-kind items are deliberately absent from the list; they are
 * evidence for his individual review, not restatement material.
 */

import { ContractItem, LoadedContract } from './types'

/** The spellings the corpus used for "no row holds this", neither of them registered. */
const UNREGISTERED_SPELLINGS = ['NONE', '—']

/**
 * The twenty items he ruled may be restated, named one by one. Each is `contractId :: itemId`.
 * Adding to this list is a restatement decision and is his, not a maintenance task.
 */
export const NO_ROW_RESTATEMENTS: ReadonlySet<string> = new Set([
    'restated:GF2::GF2-13',
    'restated:GF2::GF2-18',
    'restated:GF2::GF2-21',
    'restated:GF2::GF2-23',
    'restated:NEUTRAL-PLAYER-CONDITION::NEUTRAL-07.a',
    'restated:NEUTRAL-PLAYER-CONDITION::NEUTRAL-12.b',
    'restated:NEUTRAL-PLAYER-CONDITION::NEUTRAL-16.b',
    'blind:PASS-COMBINATION-GATE::PCG-14',
    'blind:PASS-COMBINATION-GATE::PCG-15',
    'blind:PASS-COMBINATION-GATE::PCG-16',
    'blind:PASS-COMBINATION-GATE::PCG-17',
    'blind:PASS-COMBINATION-GATE::PCG-18',
    'blind:PASS-COMBINATION-GATE::PCG-19',
    'blind:GF4::OB1',
    'blind:GF4::OB2',
    'blind:GF4::OB3',
    'blind:GF4::OB4',
    'blind:GF4::OB5',
    'blind:GF4::OB6',
    'blind:GF4::OB7',
])

export interface RestatementTally {
    /** Items rewritten to the sentinel. */
    applied: number
    /** Items on the list that failed a condition and were therefore left alone. */
    withheld: { item: string; why: string }[]
}

function statesNoStructuralRequirement(clause: unknown): boolean {
    if (clause === null || clause === undefined) return true
    return /^(none|n\/a)$/i.test(String(clause).trim())
}

/** The three conditions, checked per item. Returns null when the item qualifies. */
function disqualifies(item: ContractItem): string | null {
    if (!UNREGISTERED_SPELLINGS.includes(String(item.row))) return `row is ${JSON.stringify(item.row)}, not an unregistered no-row spelling`
    if (item.checkability !== 'OUTSIDE_BOUNDARY') return `checkability is ${String(item.checkability)}, not OUTSIDE_BOUNDARY`
    if (!statesNoStructuralRequirement(item.structuralClause)) return `it states a structural requirement: ${JSON.stringify(item.structuralClause)}`
    return null
}

/** Apply the ruled restatement to a loaded corpus, on a copy. Nothing else is touched. */
export function applyNoRowRestatement(contracts: LoadedContract[], tally: RestatementTally): LoadedContract[] {
    tally.applied = 0
    tally.withheld = []

    return contracts.map(contract => ({
        ...contract,
        items: (contract.items || []).map(item => {
            const key = `${contract.contractId}::${item.itemId}`
            if (!NO_ROW_RESTATEMENTS.has(key)) return item

            const reason = disqualifies(item)
            if (reason) {
                // Named on the list but failing a condition: left exactly as authored, and reported.
                tally.withheld.push({ item: key, why: reason })
                return item
            }

            tally.applied++
            return { ...item, row: 'NO_ROW' }
        }),
    }))
}
