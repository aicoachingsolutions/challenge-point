/**
 * Derivation engine — stage 0, Load (package §2.2).
 *
 * Validates each contract against the register AS DATA. A contract that fails is rejected WHOLE, with
 * the reason named, and **the run continues with the rest**: a refusal is per contract, never a halt,
 * or one mistyped value would annihilate the report.
 *
 * No allowlist projection: every field is kept. This project's costliest recurring failure is an
 * allowlist quietly dropping authored fields.
 */

import { RegisterIndex } from './register'
import { ContractItem, LoadedContract, SpecClause } from './types'

export interface LoadRefusal {
    contractId: string
    reason: string
    offendingInput: string
    itemId?: string
}

export interface LoadOutcome {
    admitted: LoadedContract[]
    refusals: LoadRefusal[]
}

export const STAGE_0_CLAUSE: SpecClause = { document: 'derivation-engine-design-package', section: '§2.2 stage 0' }

/**
 * The one registered spelling of "not applicable" is JSON `null`. Any other spelling is refused in any
 * field the engine consults — including the mojibake the contract corpus carries in 144 places, which
 * an engine cannot read as absence: it reads a value that is not a row id, not a scope and not a clause.
 */
const MOJIBAKE = 'â€”'

function isPlaceholder(value: unknown): boolean {
    return typeof value === 'string' && value.includes(MOJIBAKE)
}

/** The registered contract-level sentinel for "this contribution claims no Game Representation property". */
export const NO_ROW = 'NO_ROW'

/** The registered contract-level sentinel for "the schema itself entails this requirement". */
export const BY_CONSTRUCTION = 'BY_CONSTRUCTION'

/**
 * Run a registered invariant's mechanical test against the register. Returns null when it holds, or the
 * reason it does not. Only the test forms the register actually uses are executed; an invariant carrying
 * a form this does not know is reported as untestable rather than assumed true — an invariant that
 * cannot be tested is exactly what "mechanically testable" excludes.
 */
function invariantFails(invariant: any, index: RegisterIndex): string | null {
    const test = invariant && invariant.test
    if (!test || typeof test !== 'object') return 'it carries no mechanical test'

    const known = ['fieldRowsPresent', 'noCollectionRowWithPathPrefix']
    const unknown = Object.keys(test).filter(key => !known.includes(key))
    if (unknown.length) return `it carries a test form this engine cannot execute: ${unknown.join(', ')}`

    for (const rowId of test.fieldRowsPresent || []) {
        const row = index.rows.get(String(rowId))
        if (!row) return `row ${rowId} is not in the register`
        if (row.kind !== 'FIELD') return `row ${rowId} is ${row.kind}, not FIELD`
    }

    const prefix = test.noCollectionRowWithPathPrefix
    if (prefix) {
        const offending = [...index.rows.values()].find(row => row.kind === 'COLLECTION' && row.path.startsWith(String(prefix)))
        if (offending) return `${offending.id} enumerates ${String(prefix)}, so the schema does not entail exactly one`
    }

    return null
}

/**
 * The second NO_ROW condition, as data rather than prose. An item states no structural requirement when
 * its `structuralClause` is absent, null, or one of the registered spellings of "none". Anything else —
 * including a sentence describing what the item would require — states one, and disqualifies it.
 */
function namesNoStructuralRequirement(clause: unknown): boolean {
    if (clause === null || clause === undefined) return true
    return /^(none|n\/a)$/i.test(String(clause).trim())
}

function enumOk(index: RegisterIndex, enumName: string, value: unknown): boolean {
    const list = index.contractEnums[enumName]
    if (!Array.isArray(list)) return false
    return typeof value === 'string' && list.includes(value)
}

function checkItem(item: ContractItem, index: RegisterIndex, contract: LoadedContract): LoadRefusal | null {
    const at = (reason: string, offending: unknown): LoadRefusal => ({
        contractId: contract.contractId,
        itemId: item.itemId,
        reason,
        offendingInput: typeof offending === 'string' ? offending : JSON.stringify(offending),
    })

    for (const [field, value] of Object.entries(item)) {
        if (isPlaceholder(value)) return at(`field ${field} carries the placeholder glyph; the only registered spelling of "not applicable" is null`, value)
    }

    // The `NO_ROW` contract-level sentinel (register `contractSentinels`, his ruling of 24 September).
    // It is not a Game Representation row: it creates no property, line, class or element. It is valid
    // only under the three stated conditions, and the conditions are enforced here rather than trusted,
    // because the one thing it must never become is a way to "suppress, bypass or reclassify a
    // structural claim merely because no suitable row exists".
    if (item.row === NO_ROW) {
        if (!index.contractSentinels[NO_ROW]) return at('NO_ROW is not a registered contract sentinel in this register version', item.row)
        if (item.checkability !== 'OUTSIDE_BOUNDARY') {
            return at(`NO_ROW requires the contribution to be classified outside the representation; this item is ${String(item.checkability)}`, item.checkability)
        }
        if (!namesNoStructuralRequirement(item.structuralClause)) {
            return at('NO_ROW requires the contribution to carry no structural requirement; this item states one', item.structuralClause)
        }
        return null
    }

    // `BY_CONSTRUCTION` — his ruling of 24 September. "A structural requirement that is necessarily true
    // by the authoritative representation schema may be satisfied by construction, provided the exact
    // schema invariant that entails it is named and mechanically testable."
    //
    // It is neither NO_ROW nor silence: the contract still makes a structural claim, and the schema
    // supplies its entailment. So the named invariant must exist **and hold**, tested here against the
    // register itself — otherwise this becomes a way to excuse a requirement the schema does not entail.
    if (item.row === BY_CONSTRUCTION) {
        const sentinel = index.contractSentinels[BY_CONSTRUCTION]
        if (!sentinel) return at('BY_CONSTRUCTION is not a registered contract sentinel in this register version', item.row)
        const named = String((item as any).satisfiedBy ?? '')
        const invariant = (sentinel.invariants || {})[named]
        if (!invariant) return at('BY_CONSTRUCTION requires `satisfiedBy` to name a registered schema invariant', named || '(absent)')
        const failure = invariantFails(invariant, index)
        if (failure) return at(`the named invariant ${named} does not hold: ${failure}`, named)
        return null
    }

    if (typeof item.row !== 'string' || !index.rows.has(item.row)) {
        return at('row is not a register row id', item.row)
    }
    if (!enumOk(index, 'requirement', item.requirement)) return at('requirement is not a registered kind', item.requirement)
    if (!enumOk(index, 'strictness', item.strictness)) return at('strictness is not registered', item.strictness)
    if (!enumOk(index, 'valueStatus', item.valueStatus)) return at('valueStatus is not registered', item.valueStatus)
    if (!enumOk(index, 'scope', item.scope)) return at('scope is not registered', item.scope)
    if (!enumOk(index, 'basis', item.basis)) return at('basis is not registered', item.basis)
    if (!enumOk(index, 'checkability', item.checkability)) return at('checkability is not registered', item.checkability)

    const evidence: any = item.basisEvidence
    const quote = typeof evidence === 'string' ? evidence : evidence && evidence.quote
    if (!quote || !String(quote).trim()) return at('item carries no basis evidence', item.basisEvidence)

    if (item.requirement === 'COMPARES') {
        if (item.strictness === 'EXCLUSION') return at('a comparative may not carry EXCLUSION strictness', item.strictness)
    }

    return null
}

/**
 * SD-30: "An authored modifier magnitude without an authored operation is incomplete and effective
 * value is not computable." The operation is row `V9a`; a magnitude item with no operation item beside
 * it in the same contract, on the same selector, refuses its contract at load.
 */
function checkModifierOperations(contract: LoadedContract): LoadRefusal | null {
    const magnitudes = contract.items.filter(i => i.row === 'V9')
    if (!magnitudes.length) return null
    const operations = contract.items.filter(i => i.row === 'V9a')
    for (const magnitude of magnitudes) {
        const paired = operations.some(op => String(op.selector ?? '') === String(magnitude.selector ?? ''))
        if (!paired) {
            return {
                contractId: contract.contractId,
                itemId: magnitude.itemId,
                reason: 'a value modifier magnitude with no declared operation (SD-30): effective value would not be computable',
                offendingInput: JSON.stringify({ row: magnitude.row, selector: magnitude.selector }),
            }
        }
    }
    return null
}

export function loadContracts(contracts: LoadedContract[], index: RegisterIndex): LoadOutcome {
    const admitted: LoadedContract[] = []
    const refusals: LoadRefusal[] = []

    for (const contract of [...contracts].sort((a, b) => a.contractId.localeCompare(b.contractId))) {
        let refusal: LoadRefusal | null = null

        for (const item of contract.items || []) {
            refusal = checkItem(item, index, contract)
            if (refusal) break
        }

        if (!refusal) {
            for (const declaration of contract.declarations || []) {
                for (const [field, value] of Object.entries(declaration)) {
                    if (isPlaceholder(value)) {
                        refusal = {
                            contractId: contract.contractId,
                            reason: `declaration field ${field} carries the placeholder glyph; the only registered spelling of "not applicable" is null`,
                            offendingInput: String(value),
                        }
                        break
                    }
                }
                if (refusal) break
                if (!enumOk(index, 'declaration', declaration.declaration)) {
                    refusal = {
                        contractId: contract.contractId,
                        reason: 'declaration kind is not registered',
                        offendingInput: JSON.stringify(declaration.declaration),
                    }
                    break
                }
                if (declaration.scope !== undefined && declaration.scope !== null && !enumOk(index, 'scope', declaration.scope)) {
                    refusal = {
                        contractId: contract.contractId,
                        reason: 'declaration scope is not registered',
                        offendingInput: JSON.stringify(declaration.scope),
                    }
                    break
                }
            }
        }

        if (!refusal) refusal = checkModifierOperations(contract)

        if (refusal) refusals.push(refusal)
        else admitted.push(contract)
    }

    return { admitted, refusals }
}
