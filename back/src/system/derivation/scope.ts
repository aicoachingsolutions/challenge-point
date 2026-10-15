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

import { RegisterIndex } from './register'
import { ParseResult, parseSelector } from './selector'
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
    /**
     * **The selector, as authored, and what it parses to — carried since 15 October 2026 (stage G2).**
     *
     * Until then this record was built field by field and the selector was not one of the fields, so every
     * declaration on a row reached every line on that row, from every contract, whatever it said it was about.
     * (Measured: a declaration selected on one condition type reached a condition of another type.)
     * That is the allowlist pattern behind this project's costliest losses, and his 15 October answer
     * 9 makes the selector load-bearing — *"Specific knowledge governs where it explicitly defines or specializes
     * a condition"* is a question about WHICH condition a declaration addresses.
     *
     * `parsed` is the selector read against the declaration's own row by the one parser, or the defect it
     * found. Reading it is `governingDeclarations`'s business (classify.ts); this stage only carries it.
     */
    selector: unknown
    parsed: ParseResult
    /** The authored note, carried whole: the reason a declaration was written travels with it. */
    note: unknown
    /**
     * A ruled supersession: this general declaration defers to the object establishing an element wherever that
     * object speaks explicitly (`DEFERS_TO_ESTABLISHING_OBJECT`, types.ts; honoured in classify.ts). Set only by a restatement ruling
     * and set by none on 15 October 2026; absent means no such relationship.
     */
    defersTo?: unknown
    /**
     * Which of his three states a non-claim is (`NO_FURTHER_VALUE`; types.ts). Carried 15 October 2026 (stage K1) the
     * way `defersTo` is — present only where the declaration carries one — and read by `governingDeclarations`
     * (classify.ts), which lets a qualified non-claim set a ruled deferral aside where a legacy one cannot.
     */
    qualifier?: unknown
}

/**
 * **Fields of an authored declaration that `DeclarationReach` deliberately does not carry, each with its
 * reason.** Empty, and meant to stay short: the key-identity test in derivation-stage68.unit.ts fails for any
 * authored field that is neither carried nor named here, so a field added to the knowledge later cannot be
 * dropped at this boundary without someone writing down why (15 October 2026).
 */
export const DECLARATION_FIELDS_NOT_CARRIED: Readonly<Record<string, string>> = {}

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

export function resolveScopes(contracts: LoadedContract[], classes: ElementClass[], index: RegisterIndex): ScopeOutcome {
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

        /**
         * Only OWN_INVOLVEMENT narrows which CLASSES an item may reach; every other scope reaches every class and
         * stage 4 decides which it actually reaches. **That is not the whole of what a scope says** — recorded 15
         * October 2026, because this line was the silent half of a loss. BUILD_OUT_EPISODE (SD-36) narrows WHEN a
         * condition governs, not which element it is: it is not a class restriction, and treating it as one here
         * would drop the condition's element altogether. It is carried instead onto the condition element itself
         * (`assembleResolvedGame`), where every downstream reader must honour it or report that it cannot
         * (`conditionScopeNotEvaluable`), and Gate A asks whether the episode can begin (`GA-EPISODE-REACHABLE`).
         * Before that, nothing past this line ever read it, so the scope was in force nowhere.
         */
        for (const item of contract.items || []) {
            const scope = String(item.scope)
            const classIds =
                scope === 'OWN_INVOLVEMENT'
                    ? own
                    : classes.map(c => c.classId) // other scopes reach every class; stage 4 decides which they actually reach
            applicationSets.push({ item: { contractId: contract.contractId, itemId: item.itemId }, scope, classIds: [...classIds].sort() })
        }

        for (const declaration of contract.declarations || []) {
            const row = String(declaration.row)
            declarations.push({
                contractId: contract.contractId,
                row,
                declaration: String(declaration.declaration),
                scope: declaration.scope === undefined || declaration.scope === null ? null : String(declaration.scope),
                preserved: true,
                selector: declaration.selector,
                parsed: parseSelector(declaration.selector, row, index),
                note: declaration.note,
                ...(declaration.defersTo === undefined ? {} : { defersTo: declaration.defersTo }),
                ...(declaration.qualifier === undefined ? {} : { qualifier: declaration.qualifier }),
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
