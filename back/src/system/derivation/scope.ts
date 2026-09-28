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

import { ElementClass, ItemRef, LoadedContract, NamedDiagnostic } from './types'

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
    /** SD-93 — conditions that must not be reported only as unrelated gaps downstream. */
    diagnostics: NamedDiagnostic[]
}

/**
 * Restricted computation 1 (SD-42): "may establish prerequisites for full derivation, but may not
 * create additional authority or broaden the set of potentially entailed elements."
 *
 * **SD-93, his ruling of 27 September, amending AM-13.** AM-13 read own involvement as "the elements
 * entailed by the contract's **other-scoped** items", and barred an existence item from using
 * own-involvement scope at all. Its reason was a circularity: own involvement depended on entailment,
 * which is stage 5, while scope is stage 3.
 *
 * **SD-47 dissolved that reason.** Elements are classes formed at stage 2 from authoritative
 * selectors, before scope is resolved, so selecting among a contract's own classes reads data that
 * already exists. His revised rule:
 *
 *   "Own involvement comprises the authoritative element classes established by that knowledge
 *    object, including classes established by its own-involvement existence contributions.
 *    Own-involvement scope may select among already-established classes but may never itself
 *    establish authority, identity, or unsupported structure."
 *
 * The restriction that matters is kept and is structural rather than a rule to remember: this
 * function only ever **selects** from `classes`, which stage 2 established. It creates no class, no
 * identity and no authority, whatever the scope of the item that formed one.
 */
function fixOwnInvolvement(contract: LoadedContract, classes: ElementClass[]): string[] {
    return classes
        .filter(c => c.fromItem.contractId === contract.contractId)
        .map(c => c.classId)
        .sort()
}

export function resolveScopes(contracts: LoadedContract[], classes: ElementClass[]): ScopeOutcome {
    const applicationSets: ApplicationSet[] = []
    const declarations: DeclarationReach[] = []
    const ownInvolvement = new Map<string, string[]>()
    const divergence: { contractId: string; why: string }[] = []
    const diagnostics: NamedDiagnostic[] = []

    for (const contract of contracts) {
        const own = fixOwnInvolvement(contract, classes)
        ownInvolvement.set(contract.contractId, own)

        // SD-93 — "If own-involvement contributions exist but no authoritative class can populate
        // that scope, emit a named diagnostic rather than allowing the resulting fields to appear
        // simply as unrelated knowledge gaps."
        const waiting = (contract.items || []).filter(i => String(i.scope) === 'OWN_INVOLVEMENT')
        if (waiting.length && !own.length) {
            diagnostics.push({
                code: 'OWN_INVOLVEMENT_UNPOPULATED',
                where: contract.contractId,
                detail:
                    `${waiting.length} contribution(s) are scoped to this object's own involvement and it establishes no element class, ` +
                    `so none of them reaches a line: ${waiting.map(i => i.itemId).sort().join(', ')}. ` +
                    'The knowledge is present and well-formed; the rows it addresses will otherwise read as unauthored.',
            })
        }

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
        diagnostics: diagnostics.sort((a, b) => `${a.code}:${a.where}`.localeCompare(`${b.code}:${b.where}`)),
    }
}
