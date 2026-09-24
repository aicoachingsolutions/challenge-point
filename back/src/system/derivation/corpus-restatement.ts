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

/**
 * The per-item restatements he ruled on 24 September, each naming its ruling. Every one corrects a
 * contract that said more, or less, than its own source supports. None invents knowledge.
 */
export interface ItemRestatement {
    /** `contractId::itemId`. */
    item: string
    ruling: string
    /** Fields to overwrite. A field set to `undefined` is removed. */
    set?: Record<string, unknown>
    /** Remove the item from its contract entirely (its source is preserved on the task register). */
    remove?: true
    why: string
}

export const ITEM_RESTATEMENTS: ItemRestatement[] = [
    {
        item: 'restated:GF2::GF2-01',
        ruling: 'SD-67',
        set: { row: 'BY_CONSTRUCTION', satisfiedBy: 'SINGLE_RECTANGULAR_PLAYING_AREA', structuralClause: 'satisfied by the named schema invariant' },
        why: 'the schema represents the area as two scalar dimensions and enumerates no areas, so exactly one rectangular area holds by construction',
    },
    {
        item: 'restated:GF2::GF2-02',
        ruling: 'SD-68',
        set: {
            row: 'NO_ROW',
            checkability: 'OUTSIDE_BOUNDARY',
            structuralClause: 'none',
            value: 'participants share an adaptive opportunity space',
        },
        why:
            'restated back to what its source supports. The stronger no-team-partition clause was one interpretation of ' +
            '"Participants share an adaptive opportunity space", not something the source entails; it is recorded as unsupported contract interpretation (task register C9)',
    },
    {
        item: 'restated:GF2::GF2-15',
        ruling: 'SD-69',
        set: { row: 'NO_ROW', checkability: 'OUTSIDE_BOUNDARY', structuralClause: 'none' },
        why:
            'its typing as a structural Game Representation claim is retired. It is ASSUMED and mixes structure with play; ' +
            'it is preserved as a diagnostic/boundary condition outside structural entailment (task register C10)',
    },
    {
        item: 'restated:GF2::GF2-22',
        ruling: 'SD-70',
        set: { row: 'R1', selector: '*', checkability: 'STRUCTURAL', structuralClause: 'whole item' },
        why: 'the Rules area now holds action restriction, so the exclusion is representable: no action restriction exists in this game',
    },
    {
        item: 'restated:NEUTRAL-PLAYER-CONDITION::NEUTRAL-05.a',
        ruling: 'SD-71',
        set: { row: 'P12', selector: 'group=neutral', value: 'ACTIVE', structuralClause: 'whole item' },
        why: 'Performer Participation State now holds the realized value; the concept stays owned by knowledge core EM-0007',
    },
    {
        item: 'restated:WIDE-ZONE-ADVANTAGE::WIDEZONE-13.a',
        ruling: 'SD-72',
        remove: true,
        why:
            'removed as a structural modifier claim: the source offers alternative realization examples — bonus point, free restart or scoring multiplier — ' +
            'without selecting one or authoring its parameters. The source is preserved as typical realization alternatives outside structural derivation (task register C11)',
    },
    {
        item: 'restated:WIDE-ZONE-ADVANTAGE::WIDEZONE-13.b',
        ruling: 'SD-72',
        remove: true,
        why: 'the same source sentence read a second way; removed for the same reason, and the source is preserved unchanged',
    },
    {
        item: 'blind:GF4::I14',
        ruling: 'SD-73',
        set: { value: 2 },
        why: '"double" entails both the operation and the magnitude, so the magnitude is recorded as 2. Its TYPICAL_EXAMPLE status is unchanged: encoding what the example says does not make it authoritative',
    },
]

/** Ruling SD-73 also supplies the operation the source entails, as a new item beside the magnitude. */
export const ADDED_ITEMS: { contractId: string; after: string; ruling: string; item: Record<string, unknown>; why: string }[] = [
    {
        contractId: 'blind:GF4',
        after: 'I14',
        ruling: 'SD-73',
        item: {
            itemId: 'I14.op',
            row: 'V9a',
            selector: 'condition.type=event',
            requirement: 'EQUALS',
            value: 'multiply',
            strictness: 'SUPPORTING',
            valueStatus: 'TYPICAL_EXAMPLE',
            scope: 'WHOLE_GAME',
            basis: 'AUTHORED',
            basisEvidence: '"double points for quick goal" (game_forms[GF4].example_incentive_patterns) — "double" entails multiply',
            checkability: 'STRUCTURAL',
            structuralClause: 'whole item',
            fitNote: 'Recovered from the source per SD-73. TYPICAL_EXAMPLE, so inert: the recovered operation does not promote the item into derivation.',
        },
        why: 'the operation is recoverable from "double"; recording it keeps the magnitude computable without making the example authoritative',
    },
]

/** SD-74 — the sixty-four NON_CLAIMED declarations whose scope is an em dash. */
export const DECLARATION_SCOPE_RESTATEMENT = {
    contractId: 'blind:PASS-COMBINATION-GATE',
    ruling: 'SD-74',
    onlyDeclaration: 'NON_CLAIMED',
    from: '—',
    to: 'WHOLE_GAME',
    why:
        'this contract makes no claim on the row anywhere in the game. The rest of the corpus consistently scopes ' +
        'NON_CLAIMED declarations, and `null` is deliberately not introduced as a second treatment',
}

export interface RestatementTally {
    /** Items rewritten to the NO_ROW sentinel. */
    applied: number
    /** Items on the NO_ROW list that failed a condition and were therefore left alone. */
    withheld: { item: string; why: string }[]
    /** Per-item restatements applied, by ruling. */
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

/** The three conditions, checked per item. Returns null when the item qualifies. */
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

            // The twenty NO_ROW restatements, each re-checked against its three conditions.
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
