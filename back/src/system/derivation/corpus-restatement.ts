/**
 * Corpus repair — **restatement** (his repair phase A, and the Phase B cluster-1 correction).
 *
 * Restatement makes existing authored meaning machine-expressible. It changes no meaning, so it is
 * separate from encoding repair (`corpus-repair.ts`), counted separately, and applied only where he has
 * ruled.
 *
 * **The ruled restatements live in data**, at `stage-b/corpus-restatements.json`. Only the mechanism and
 * the conditions live here. That split is deliberate for two reasons: the authored member text is
 * knowledge and the derivation engine is sport-neutral, so sport-specific wording must not appear in
 * engine source; and a ledger of what was restated is more reviewable as data than as code.
 *
 * What the data holds:
 *   - `noRow` — the twenty items he ruled may take the `NO_ROW` sentinel. Named one by one so the change
 *     is auditable rather than inferred by a rule that might drift, **and** re-checked against the three
 *     conditions below before each is applied. One that fails a condition is left alone and reported.
 *   - `items` — per-item restatements, each naming its ruling.
 *   - `added` — items a ruling adds, each carrying its own source and entailment.
 *   - `declarationScope` — the declaration-scope restatement.
 */

import fs from 'node:fs'
import path from 'node:path'

import { ContractItem, LoadedContract } from './types'

/** The spellings the corpus used for "no row holds this", neither of them registered. */
const UNREGISTERED_SPELLINGS = ['NONE', '—']

export interface ItemRestatement {
    /** `contractId::itemId`. */
    item: string
    ruling: string
    /** Fields to overwrite. */
    set?: Record<string, unknown>
    /** Remove the item from its contract entirely (its source is preserved on the task register). */
    remove?: true
    why: string
}

interface RestatementData {
    noRow: string[]
    items: ItemRestatement[]
    added: { contractId: string; after: string; ruling: string; item: Record<string, unknown>; why: string }[]
    declarationScope: { contractId: string; ruling: string; onlyDeclaration: string; from: string; to: string; why: string }
}

const DATA: RestatementData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/conformance/stage-b/corpus-restatements.json'), 'utf8').replace(/^﻿/, ''),
)

export const NO_ROW_RESTATEMENTS: ReadonlySet<string> = new Set(DATA.noRow)
export const ITEM_RESTATEMENTS: ItemRestatement[] = DATA.items
export const ADDED_ITEMS = DATA.added
export const DECLARATION_SCOPE_RESTATEMENT = DATA.declarationScope

export interface RestatementTally {
    /** Items rewritten to the NO_ROW sentinel. */
    applied: number
    /** Items on the NO_ROW list that failed a condition and were therefore left alone. */
    withheld: { item: string; why: string }[]
    itemsRestated: number
    itemsRemoved: number
    itemsAdded: number
    declarationScopes: number
    /** Anything named in a ruling that could not be found — never silent. */
    notFound: string[]
}

function statesNoStructuralRequirement(clause: unknown): boolean {
    if (clause === null || clause === undefined) return true
    return /^(none|n\/a)$/i.test(String(clause).trim())
}

/** The three NO_ROW conditions, checked per item. Returns null when the item qualifies. */
function disqualifies(item: ContractItem): string | null {
    if (!UNREGISTERED_SPELLINGS.includes(String(item.row))) return `row is ${JSON.stringify(item.row)}, not an unregistered no-row spelling`
    if (item.checkability !== 'OUTSIDE_BOUNDARY') return `checkability is ${String(item.checkability)}, not OUTSIDE_BOUNDARY`
    if (!statesNoStructuralRequirement(item.structuralClause)) return `it states a structural requirement: ${JSON.stringify(item.structuralClause)}`
    return null
}

/** Apply every ruled restatement to a loaded corpus, on a copy. Nothing else is touched. */
export function applyNoRowRestatement(contracts: LoadedContract[], tally: RestatementTally): LoadedContract[] {
    tally.applied = 0
    tally.withheld = []
    tally.itemsRestated = 0
    tally.itemsRemoved = 0
    tally.itemsAdded = 0
    tally.declarationScopes = 0
    tally.notFound = []

    const byKey = new Map(ITEM_RESTATEMENTS.map(r => [r.item, r]))
    const seen = new Set<string>()

    const result = contracts.map(contract => {
        let items = (contract.items || []).flatMap(item => {
            const key = `${contract.contractId}::${item.itemId}`

            if (NO_ROW_RESTATEMENTS.has(key)) {
                seen.add(key)
                const reason = disqualifies(item)
                if (reason) {
                    tally.withheld.push({ item: key, why: reason })
                    return [item]
                }
                tally.applied++
                return [{ ...item, row: 'NO_ROW' }]
            }

            const ruling = byKey.get(key)
            if (!ruling) return [item]
            seen.add(key)

            if (ruling.remove) {
                tally.itemsRemoved++
                return []
            }

            tally.itemsRestated++
            const restated: any = { ...item, ...(ruling.set || {}) }
            for (const [field, value] of Object.entries(ruling.set || {})) if (value === undefined) delete restated[field]
            return [restated as ContractItem]
        })

        // Items a ruling adds, placed beside the item they belong to so order stays meaningful.
        for (const addition of ADDED_ITEMS) {
            if (addition.contractId !== contract.contractId) continue
            const at = items.findIndex(i => i.itemId === addition.after)
            if (at === -1) {
                tally.notFound.push(`${addition.contractId}::${addition.after} (anchor for ${addition.item.itemId})`)
                continue
            }
            items = [...items.slice(0, at + 1), addition.item as unknown as ContractItem, ...items.slice(at + 1)]
            tally.itemsAdded++
        }

        // The declaration-scope restatement, applied only to the declaration kind he named.
        let declarations = contract.declarations || []
        if (contract.contractId === DECLARATION_SCOPE_RESTATEMENT.contractId) {
            declarations = declarations.map((declaration: any) => {
                if (declaration.declaration !== DECLARATION_SCOPE_RESTATEMENT.onlyDeclaration) return declaration
                if (String(declaration.scope) !== DECLARATION_SCOPE_RESTATEMENT.from) return declaration
                tally.declarationScopes++
                return { ...declaration, scope: DECLARATION_SCOPE_RESTATEMENT.to }
            })
        }

        return { ...contract, items, declarations }
    })

    for (const key of [...NO_ROW_RESTATEMENTS, ...byKey.keys()]) if (!seen.has(key)) tally.notFound.push(key)
    return result
}
