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
 *   - `declarations` — declarations whose KIND a ruling changes (added 14 October 2026, ruling C45). A
 *     declaration that CLAIMS a row on the strength of items a ruling removed would go on asserting what nobody
 *     now authors, so the ruling that removes the items restates the claim beside them. Applied per contract and
 *     row, only from the kind named, counted on their own, and never silent when the declaration is not found.
 *   - `declarationsAdded` — declarations a ruling ADDS to a contract (added 14 October 2026, ruling C48). A register
 *     row added after a contract was written is a row that contract could not have declared, so every game that
 *     selects it reads the row as "no coverage" — nobody looked — even where the contract plainly did look at the
 *     performers the row belongs to. The addition is applied only to a contract that exists and does not already
 *     declare the row, so it can extend what a contract says and can never overwrite or contradict it; counted on
 *     its own, and never silent when it cannot be applied. ONE exception since 15 October 2026 (stage K1, his 17
 *     October M6): an addition that opts in with `onDeclaredRow: "PROVEN_DISJOINT"` may join a row the contract
 *     already declares, only when it provably cannot contradict what is there (`provenDisjointRefusal`).
 */

import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from './knowledge-root'

import { provablyDisjoint } from './reach'
import { parsePredicate } from './selector'
import { ContractItem, DEFERS_TO_AUTHORIZED_REALIZATION, DEFERS_TO_ESTABLISHING_OBJECT, LoadedContract, ROLE_YIELD_KEY, ROLE_YIELD_MARKERS } from './types'

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
    /**
     * **His words, and where he said them** (stage A, 22 October 2026): what makes a ruling an OWNER ruling for the one key that
     * requires it, the role-yield marker (`itemRestatementRefusal`). Read nowhere else.
     */
    words?: string
    citedAs?: string
}

/**
 * **The fields an item restatement may write** — stage A, 22 October 2026, for the design's rule on the restatement loader (*"refuse any
 * other new key. A test proves an unknown key is refused, not applied."*). Every key a ruled restatement writes today, read from the
 * data on that day, plus the role-yield marker (`ROLE_YIELD_KEY`). A key outside this list would be written onto an item and read by
 * nothing — or read by something that never learned what it means — so the ruling carrying it is refused and named, never applied.
 */
export const ITEM_RESTATEMENT_KEYS: readonly string[] = [
    'row',
    'satisfiedBy',
    'structuralClause',
    'checkability',
    'value',
    'selector',
    'offListMembers',
    'asAuthored',
    'authoredOrder',
    'forbiddenCardinality',
    'goalKickTriggerSource',
    'basis',
    'basisEvidence',
    'restartOwnershipSource',
    'fitNote',
    'gloss',
    'relational',
    'distinctOn',
    'typedBound',
    'comparison',
    'requirement',
    'strictness',
    'scope',
    'valueStatus',
    'forbiddenValues',
    'defersTo',
    'defersToNote',
    ROLE_YIELD_KEY,
]

/**
 * **An item restatement writes only keys the engine knows, and the role-yield marker only as ruled** — stage A, 22 October 2026
 * (register version 16, `roleScoring.roleYield`). Christian, reply filed 25 October 2026, item 2: *"Please implement this as a general
 * role-specific scoring capability, preserving structural validation and knowledge authorization."* Null where the ruling may be
 * applied; otherwise why not, and the ruling is refused whole and named (as `itemDeferralRefusal` refuses an unknown supersession):
 *
 *   - a key outside `ITEM_RESTATEMENT_KEYS`;
 *   - the marker (`ROLE_YIELD_KEY`) with a value outside `ROLE_YIELD_MARKERS`;
 *   - the marker on a ruling that does not quote his words and say where (`words`, `citedAs`): a marker that lets an item yield may
 *     not rest on a reading of ours, as a relation that decides a gate clause may not (the `relativeTo` precedent, register.ts).
 */
export function itemRestatementRefusal(key: string, ruling: ItemRestatement): string | null {
    const set = ruling.set ?? {}
    const unknown = Object.keys(set).filter(field => !ITEM_RESTATEMENT_KEYS.includes(field))
    if (unknown.length) return `${key} (${ruling.ruling}): ${unknown.map(field => JSON.stringify(field)).join(', ')} ${unknown.length === 1 ? 'is not a field' : 'are not fields'} an item restatement may write, so the ruling is not applied`
    if (!(ROLE_YIELD_KEY in set)) return null
    const marker = set[ROLE_YIELD_KEY]
    if (!(ROLE_YIELD_MARKERS as readonly unknown[]).includes(marker)) return `${key} (${ruling.ruling}): ${JSON.stringify(marker)} is not a role-yield marker (only ${ROLE_YIELD_MARKERS.join(', ')}), so the ruling is not applied`
    const quoted = (value: unknown) => typeof value === 'string' && value.trim().length > 0
    if (!quoted(ruling.words) || !quoted(ruling.citedAs)) return `${key} (${ruling.ruling}): the role-yield marker is written only on an owner ruling that quotes his words and says where (words, citedAs), so the ruling is not applied`
    return null
}

/**
 * SD-86 — the typed form of an exclusion's own authored cardinality bound.
 *
 * His constraint is that the restatement *"may move an explicitly authored numerical/cardinality bound
 * from the existing prose into the typed field"*, and may not infer a bound, derive it from SD-06
 * instead of the item's own content, broaden what the exclusion means, or establish anything new.
 *
 * So **the relation is carried across as authored, not converted**. `"more than 1"` becomes `> 1`, not
 * `>= 2`; `"2 or more"` becomes `>= 2`, not `> 1`. For an integer cardinality those denote the same set,
 * but writing either as the other would be rewriting the author's comparison rather than typing it. The
 * prose `value` is left exactly as it stands, so the source remains visible beside its typed form.
 */
export interface ForbiddenCardinality {
    operator: '>' | '>=' | '<' | '<=' | '=' | '!='
    value: number
}

/** A declaration whose kind a ruling changes: on one contract and row, from exactly the kind named. */
export interface DeclarationRestatement {
    contractId: string
    row: string
    from: string
    to: string
    /**
     * **A ruled supersession** (15 October 2026, his answer 9): the declaration DEFERS to the object establishing
     * an element wherever that object speaks explicitly — *"General requirements remain applicable unless the
     * specific knowledge explicitly supersedes them through an authorized relationship."* The only value is
     * `DEFERS_TO_ESTABLISHING_OBJECT` (types.ts, honoured in classify.ts); a deferral that keeps its kind names the same kind in `from`
     * and `to`. No entry in the data carries one: whether any statement is such a relationship is his decision.
     */
    defersTo?: string
    ruling: string
    why: string
}

/**
 * One declaration restatement applied to one declaration — the kind, and the supersession where a ruling names
 * one. Returns the reason it cannot be applied instead, so the caller reports it rather than guessing.
 */
export function restateDeclaration(declaration: Record<string, unknown>, restatement: DeclarationRestatement): Record<string, unknown> | { refused: string } {
    // Stage A (22 October 2026): the role-yield marker is an item's, written by an item restatement only; on a declaration it is refused and named.
    if (ROLE_YIELD_KEY in (restatement as unknown as Record<string, unknown>)) {
        return { refused: `${restatement.contractId} declaration on ${restatement.row} (${restatement.ruling}): the role-yield marker is written on an item only, never on a declaration` }
    }
    if (restatement.defersTo !== undefined && restatement.defersTo !== DEFERS_TO_ESTABLISHING_OBJECT) {
        return { refused: `${restatement.contractId} declaration on ${restatement.row} (${restatement.ruling}): ${JSON.stringify(restatement.defersTo)} is not a supersession the engine knows` }
    }
    return {
        ...declaration,
        declaration: restatement.to,
        ...(restatement.defersTo === undefined ? {} : { defersTo: restatement.defersTo }),
    }
}

/**
 * **An item restatement may write a supersession only as ruled** — 15 October 2026 (stage K4, ruling C56). Christian, reply
 * filed 17 October 2026, D6: *"If the 6 + GK versus 5 configuration requires a narrow exception to the possession game's
 * equal-outfield-number rule, please document it as a knowledge-authorized realization, preserving equal numbers as an
 * alternative."* The supersession vocabulary gains one value for items, `DEFERS_TO_AUTHORIZED_REALIZATION`; the
 * declarations' value is not an item's, and an unknown value is not a supersession the engine knows. Either is refused and
 * named (null where the ruling may be applied), exactly as a declaration's is in `restateDeclaration`.
 */
export function itemDeferralRefusal(key: string, ruling: ItemRestatement): string | null {
    if (!ruling.set || !('defersTo' in ruling.set)) return null
    const value = ruling.set.defersTo
    if (value === DEFERS_TO_AUTHORIZED_REALIZATION) return null
    return `${key} (${ruling.ruling}): ${JSON.stringify(value)} is not a supersession an item may carry (only ${DEFERS_TO_AUTHORIZED_REALIZATION}), so the ruling is not applied`
}

/**
 * A declaration a ruling adds: to one contract, on a row that contract does not yet declare. The declaration is
 * written out whole in the data, kind and note included, so what the contract now says is readable beside the
 * ruling rather than computed from another declaration at load.
 */
export interface DeclarationAddition {
    contractId: string
    declaration: { row: string; declaration: string; selector: string; scope: string; note: string; qualifier?: string; defersTo?: string }
    /**
     * **The one way an addition may join a row its contract already declares** (15 October 2026, stage K1). Absent —
     * C48's rule — an already-declared row refuses the addition. `PROVEN_DISJOINT` opts this addition into M6's
     * exception, and is honoured only when the proof in `provenDisjointRefusal` holds.
     */
    onDeclaredRow?: 'PROVEN_DISJOINT'
    ruling: string
    why: string
}

/**
 * **His M6 exception, and the proof it rests on** (15 October 2026, stage K1). His 17 October words: *"I approve the
 * narrow authority exception where the added statement provably cannot contradict existing knowledge."* Until then a
 * ruling could add a declaration only to a row its contract had not declared (C48), so no ruling could record that a
 * context's own condition detail needs no further value — his 9.9 (16 October) for the build-out origin.
 *
 * An addition on an already-declared row is admitted only when ALL of these hold; otherwise nothing is added and the
 * reason is named (never silent):
 *
 *   1. it is a NON_CLAIMED qualified with a registered state — a statement of what the field needs, not a requirement
 *      that could compete with one, and never a legacy non-claim (which cannot be told from "unrestricted");
 *   2. it carries no deferral (a deferral is a supersession, and only a declaration restatement writes one);
 *   3. it is PROVABLY DISJOINT (reach.ts `provablyDisjoint`: FALSE both ways; `*`, CONTAINS and undetermined never
 *      prove) from:
 *        - every declaration its own contract already has on the row, whatever the kind;
 *        - every CLAIMED declaration ANY contract has on the row — measured in the K1 design's verification: under
 *          AM-23 a non-claim outranks a claim in one governing set, so a contract-local proof admitted a statement
 *          that HID another contract's requirement on a test copy;
 *        - every item on the row, in any contract, that authors a value the field must take: an authored value is
 *          exactly what "needs no further value" would contradict.
 *      An item of EXCLUSION strictness is not in that last list, and that is a reading recorded here rather than a
 *      relaxation: it authors a value the field must NOT take, which "No further value is required" does not
 *      contradict, and it keeps governing the line on its own (its contract's EXCLUDED outranks 'not constrained'
 *      under AM-23 — measured: in the full corpus the origin line reads 'excluded' through the Neutral Player
 *      Condition's own exclusion). Other contracts' EXCLUDED and NOT_AUTHORED declarations need no proof for the
 *      same reason: they outrank 'not constrained' already, and the one NOT_AUTHORED that steps aside (C50) does so
 *      on his ruling, not on this one.
 *
 * The selectors are compared by their syntax (selector.ts `parsePredicate`); an unparseable one is refused, never
 * passed. The proof runs over every contract the corpus file holds, which is wider than any one composition and so
 * can only refuse more. The Sport Profile is not in that file: it declares no condition row (O1, O3-O5, PS1).
 *
 * **The same proof for a QUALIFIED addition on a row its contract has not declared** (K1 review, 15 October 2026).
 * C48's path admits an addition to an undeclared row unproved, on the ground that it cannot contradict what its own
 * contract says — true, but it can still sit above another contract's claim (AM-23) and, qualified, set a ruled
 * deferral aside: exactly what his M6 safeguard is about. So a qualified addition is admitted on either path only
 * when this proof holds (`onDeclaredRow` false: its own contract has nothing on the row, so the other two lists
 * decide). An unqualified C48 addition is unchanged. No addition in the knowledge takes this path today.
 */
export function provenDisjointRefusal(addition: DeclarationAddition, contracts: LoadedContract[], onDeclaredRow = true): string | null {
    const label = `${addition.contractId} ${onDeclaredRow ? 'declared' : 'undeclared'} row ${addition.declaration.row} (${addition.ruling})`
    const row = String(addition.declaration.row)
    if (addition.declaration.declaration !== 'NON_CLAIMED' || addition.declaration.qualifier === undefined) {
        return onDeclaredRow
            ? `${label}: only a non-claim qualified with a registered state may join a row the contract already declares, so nothing is added`
            : `${label}: a declaration qualifier says which state a non-claim is, so a qualified ${addition.declaration.declaration} is not added`
    }
    if (addition.declaration.defersTo !== undefined) return `${label}: an added declaration may not carry a deferral, so nothing is added`
    const added = parsePredicate(addition.declaration.selector)
    if (!added.predicate) return `${label}: its own selector cannot be read (${added.defect}), so disjointness cannot be proved and nothing is added`

    const against: { what: string; selector: unknown }[] = []
    for (const contract of contracts) {
        for (const declaration of (contract.declarations || []) as any[]) {
            if (String(declaration.row) !== row) continue
            if (contract.contractId === addition.contractId || declaration.declaration === 'CLAIMED') {
                against.push({ what: `${contract.contractId === addition.contractId ? 'its' : `${contract.contractId}'s`} ${declaration.declaration} ${declaration.selector}`, selector: declaration.selector })
            }
        }
        for (const item of contract.items || []) {
            if (String(item.row) !== row || item.strictness === 'EXCLUSION') continue
            against.push({ what: `item ${contract.contractId}::${item.itemId} ${String(item.selector ?? '*')}`, selector: item.selector })
        }
    }
    for (const other of against) {
        const parsed = parsePredicate(other.selector)
        if (!parsed.predicate) return `${label}: ${other.what} cannot be read (${parsed.defect}), so disjointness cannot be proved and nothing is added`
        if (!provablyDisjoint(added.predicate, parsed.predicate)) return `${label}: the added declaration is not proven disjoint from ${other.what}, so nothing is added`
    }
    return null
}

interface RestatementData {
    noRow: string[]
    items: ItemRestatement[]
    added: { contractId: string; after: string; ruling: string; item: Record<string, unknown>; why: string }[]
    declarationScope: { contractId: string; ruling: string; onlyDeclaration: string; from: string; to: string; why: string }
    declarations?: DeclarationRestatement[]
    declarationsAdded?: DeclarationAddition[]
}

const DATA: RestatementData = JSON.parse(
    fs.readFileSync(path.join(AUDITS_DIR, 'conformance/stage-b/corpus-restatements.json'), 'utf8').replace(/^﻿/, ''),
)

export const NO_ROW_RESTATEMENTS: ReadonlySet<string> = new Set(DATA.noRow)
export const ITEM_RESTATEMENTS: ItemRestatement[] = DATA.items
export const ADDED_ITEMS = DATA.added
export const DECLARATION_SCOPE_RESTATEMENT = DATA.declarationScope
export const DECLARATION_RESTATEMENTS: DeclarationRestatement[] = DATA.declarations ?? []
export const DECLARATION_ADDITIONS: DeclarationAddition[] = DATA.declarationsAdded ?? []

export interface RestatementTally {
    /** Items rewritten to the NO_ROW sentinel. */
    applied: number
    /** Items on the NO_ROW list that failed a condition and were therefore left alone. */
    withheld: { item: string; why: string }[]
    itemsRestated: number
    itemsRemoved: number
    itemsAdded: number
    declarationScopes: number
    /** Declarations whose kind a ruling changed — tallied apart from scopes, which is a different change. */
    declarationsRestated: number
    /** Declarations a ruling added — tallied apart again, because adding what a contract says is not changing it. */
    declarationsAdded: number
    /**
     * Declarations a ruling added to a row the contract ALREADY declared, under his M6 exception (`PROVEN_DISJOINT`,
     * 15 October 2026, stage K1) — counted apart from C48's additions, which fill a row nobody had declared, so neither
     * count can hide the other.
     */
    declarationsAddedOnDeclaredRows: number
    /**
     * Anything named in a ruling that could not be found — never silent. An added declaration whose row the
     * contract already declares is recorded here too: the place it was to fill is not there, and adding it anyway
     * would put a second account of the row beside the authored one — unless the ruling opts into M6's exception and
     * the proof holds; a failed proof is recorded here with its reason.
     */
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

/**
 * Apply every ruled restatement to a loaded corpus, on a copy. Nothing else is touched. `rulings` is the ledger's item restatements;
 * a test may hand a COPY with a TEST-ONLY ruling added (stage A, 22 October 2026), to prove a refused ruling is not applied.
 */
export function applyNoRowRestatement(contracts: LoadedContract[], tally: RestatementTally, rulings: ItemRestatement[] = ITEM_RESTATEMENTS): LoadedContract[] {
    tally.applied = 0
    tally.withheld = []
    tally.itemsRestated = 0
    tally.itemsRemoved = 0
    tally.itemsAdded = 0
    tally.declarationScopes = 0
    tally.declarationsRestated = 0
    tally.declarationsAdded = 0
    tally.declarationsAddedOnDeclaredRows = 0
    tally.notFound = []
    // M6 additions — and any qualified addition (K1 review) — wait until every contract is restated, because their proof
    // reads OTHER contracts' declarations and items as the rulings leave them (`provenDisjointRefusal`).
    const proved: { addition: DeclarationAddition; onDeclaredRow: boolean }[] = []

    // An item can carry more than one ruling — A01-02-05.a carries SD-87's selector and SD-88's
    // authored ownership — so they are collected per item and applied in the order listed. Keying one
    // ruling per item would have let the later entry silently replace the earlier one, which is this
    // project's costliest recurring failure in a new place.
    const byKey = new Map<string, ItemRestatement[]>()
    for (const restatement of rulings) {
        byKey.set(restatement.item, [...(byKey.get(restatement.item) || []), restatement])
    }
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

            const rulings = byKey.get(key)
            if (!rulings || !rulings.length) return [item]
            seen.add(key)

            if (rulings.some(r => r.remove)) {
                tally.itemsRemoved++
                return []
            }

            let restated: any = { ...item }
            for (const ruling of rulings) {
                // An item's supersession is a ruled one and has one value (15 October 2026, stage K4, C56); any other is
                // refused and named, never applied — the declaration's rule (`restateDeclaration`), for an item.
                // Stage A (22 October 2026): only keys the engine knows, and the role-yield marker only as ruled (`itemRestatementRefusal`).
                const refusal = itemRestatementRefusal(key, ruling) ?? itemDeferralRefusal(key, ruling)
                if (refusal) {
                    tally.notFound.push(refusal)
                    continue
                }
                tally.itemsRestated++
                restated = { ...restated, ...(ruling.set || {}) }
                for (const [field, value] of Object.entries(ruling.set || {})) if (value === undefined) delete restated[field]
            }
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

        // Declarations whose kind a ruling changes — after the scope restatement, so neither counts the other.
        for (const restatement of DECLARATION_RESTATEMENTS) {
            if (restatement.contractId !== contract.contractId) continue
            const at = declarations.findIndex((declaration: any) => String(declaration.row) === restatement.row && declaration.declaration === restatement.from)
            if (at === -1) {
                tally.notFound.push(`${restatement.contractId} declaration ${restatement.from} on ${restatement.row} (${restatement.ruling})`)
                continue
            }
            const restated = restateDeclaration(declarations[at] as any, restatement)
            if ('refused' in restated) {
                tally.notFound.push(String(restated.refused))
                continue
            }
            declarations = declarations.map((declaration: any, i: number) => (i === at ? restated : declaration)) as typeof declarations
            tally.declarationsRestated++
        }

        // Declarations a ruling adds — last, so no scope or kind restatement can reach one, and so the
        // already-declared check reads the contract's declarations as every earlier ruling left them.
        for (const addition of DECLARATION_ADDITIONS) {
            if (addition.contractId !== contract.contractId) continue
            const row = String(addition.declaration.row)
            const existing = declarations.filter((declaration: any) => String(declaration.row) === row)
            if (existing.length && addition.onDeclaredRow === 'PROVEN_DISJOINT') {
                proved.push({ addition, onDeclaredRow: true })
                continue
            }
            // A qualified statement on an undeclared row waits for the same proof (K1 review; `provenDisjointRefusal`).
            if (!existing.length && addition.declaration.qualifier !== undefined) {
                proved.push({ addition, onDeclaredRow: false })
                continue
            }
            if (existing.length) {
                const kinds = existing.map((declaration: any) => String(declaration.declaration)).join(', ')
                tally.notFound.push(`${addition.contractId} undeclared row ${row} (${addition.ruling}): it already declares ${kinds}, so nothing is added`)
                continue
            }
            declarations = [...declarations, { ...addition.declaration }]
            tally.declarationsAdded++
        }

        return { ...contract, items, declarations }
    })
    // His M6 exception, applied last and one addition at a time, so each proof reads every earlier one as admitted. A
    // qualified addition on an undeclared row is proved the same way and still counted with C48's additions.
    for (const { addition, onDeclaredRow } of proved) {
        const refusal = provenDisjointRefusal(addition, result, onDeclaredRow)
        if (refusal) {
            tally.notFound.push(refusal)
            continue
        }
        const at = result.findIndex(contract => contract.contractId === addition.contractId)
        result[at] = { ...result[at], declarations: [...(result[at].declarations || []), { ...addition.declaration }] }
        if (onDeclaredRow) tally.declarationsAddedOnDeclaredRows++
        else tally.declarationsAdded++
    }
    for (const restatement of DECLARATION_RESTATEMENTS) {
        if (!result.some(contract => contract.contractId === restatement.contractId)) tally.notFound.push(`${restatement.contractId} (declaration restatement ${restatement.ruling})`)
    }
    for (const addition of DECLARATION_ADDITIONS) {
        if (!result.some(contract => contract.contractId === addition.contractId)) tally.notFound.push(`${addition.contractId} (declaration addition ${addition.ruling})`)
    }

    for (const key of [...NO_ROW_RESTATEMENTS, ...byKey.keys()]) if (!seen.has(key)) tally.notFound.push(key)
    return result
}
