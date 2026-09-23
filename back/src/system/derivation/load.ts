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
