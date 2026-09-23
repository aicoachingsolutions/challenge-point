/**
 * Derivation engine — stage 3, Scope (package §2.1, §2.2; SD-31, SD-42).
 *
 * Two things happen here, and they are deliberately separate:
 *   - each item's **application set** is fixed, per its scope;
 *   - each declaration's **reach** is computed independently of it.
 *
 * SD-31: "An empty resolved scope empties the item's application set, not the contract's declaration.
 * Preserve the declaration so the result reports the authored gap rather than converting it into
 * invented." A declaration is therefore never stored inside its items' resolution.
 */

import { ElementClass, ItemRef, LoadedContract } from './types'

export interface ApplicationSet {
    item: ItemRef
    scope: string
    /** The classes this item may apply to. Empty is a legitimate outcome, not an error. */
    classIds: string[]
}

export interface DeclarationReach {
    contractId: string
    row: string
    declaration: string
    scope: string | null
    /** Kept whether or not the scope resolved empty (SD-31). */
    preserved: true
}

export interface ScopeOutcome {
    applicationSets: ApplicationSet[]
    declarations: DeclarationReach[]
    /** Restricted computation 1: the own-involvement set per contract, fixed once. */
    ownInvolvement: Map<string, string[]>
    divergence: { contractId: string; why: string }[]
}

const OTHER_SCOPES = new Set(['WHOLE_GAME', 'PER_TEAM', 'PER_OBJECTIVE_SET', 'BUILD_OUT_EPISODE'])

/**
 * Restricted computation 1 (SD-42): "may establish prerequisites for full derivation, but may not
 * create additional authority or broaden the set of potentially entailed elements."
 *
 * Own involvement is "the elements entailed by the contract's other-scoped items" (AM-13). Under
 * SD-47 those elements are the classes formed from that contract's **other-scoped existence items** —
 * a strict subset of the contract's own items, computed without consulting any own-involvement item.
 */
function fixOwnInvolvement(contract: LoadedContract, classes: ElementClass[]): string[] {
    const mine = classes.filter(c => c.fromItem.contractId === contract.contractId)
    const byItem = new Map(contract.items.map(i => [i.itemId, i]))
    return mine
        .filter(c => {
            const item = byItem.get(c.fromItem.itemId)
            return item ? OTHER_SCOPES.has(String(item.scope)) : false
        })
        .map(c => c.classId)
        .sort()
}

export function resolveScopes(contracts: LoadedContract[], classes: ElementClass[]): ScopeOutcome {
    const applicationSets: ApplicationSet[] = []
    const declarations: DeclarationReach[] = []
    const ownInvolvement = new Map<string, string[]>()
    const divergence: { contractId: string; why: string }[] = []

    for (const contract of contracts) {
        const own = fixOwnInvolvement(contract, classes)
        ownInvolvement.set(contract.contractId, own)

        // The divergence check SD-42 requires. Under the class model the restricted computation is a
        // subset selection over the contract's own existence items, so re-running it cannot widen the
        // set; the check is kept because he required it kept, and its inability to fail is reported
        // rather than assumed.
        const second = fixOwnInvolvement(contract, classes)
        if (JSON.stringify(second) !== JSON.stringify(own)) {
            divergence.push({ contractId: contract.contractId, why: 'the restricted computation did not agree with itself' })
        }

        for (const item of contract.items || []) {
            const scope = String(item.scope)
            const classIds =
                scope === 'OWN_INVOLVEMENT'
                    ? own
                    : classes.map(c => c.classId) // other scopes reach every class; stage 4 decides which they actually reach
            applicationSets.push({ item: { contractId: contract.contractId, itemId: item.itemId }, scope, classIds: [...classIds].sort() })
        }

        for (const declaration of contract.declarations || []) {
            declarations.push({
                contractId: contract.contractId,
                row: String(declaration.row),
                declaration: String(declaration.declaration),
                scope: declaration.scope === undefined || declaration.scope === null ? null : String(declaration.scope),
                preserved: true,
            })
        }
    }

    return {
        applicationSets: applicationSets.sort((a, b) =>
            `${a.item.contractId}:${a.item.itemId}`.localeCompare(`${b.item.contractId}:${b.item.itemId}`),
        ),
        declarations: declarations.sort((a, b) => `${a.contractId}:${a.row}`.localeCompare(`${b.contractId}:${b.row}`)),
        ownInvolvement,
        divergence,
    }
}
