/**
 * Derivation engine — increment 1: stages 0 (load), 1 (normalise) and 2 (index).
 *
 * A pure function over loaded data: no I/O, no clock, no randomness, no ambient state.
 *
 * SD-48, the implementation rule: "If a stage reaches semantics not explicitly established by the
 * specification, stop that path and report it. Do not complete the behavior from developer judgment."
 * Every such stop is recorded in `run` output as `stopped[]` and reported, never resolved here.
 */

import { HaltError, indexRegister, buildVersions, RegisterIndex } from './register'
import { loadContracts } from './load'
import { parseSelector, predicateKey } from './selector'
import {
    ContractItem,
    DerivationInput,
    ElementClass,
    FailureRecord,
    ItemRef,
    LoadedContract,
    PartialResult,
    RefusalRecord,
    ResolutionLine,
    SpecClause,
} from './types'

export const ENGINE_VERSION = '0.1.0-increment-1'

const CLAUSE = (section: string): SpecClause => ({ document: 'derivation-engine-design-package', section })

/** Content-derived ids: an unrelated record must never renumber the rest (package §3.1). */
function recordId(kind: string, locus: string, ordinal: number): string {
    return `${kind}#${locus}#${ordinal}`
}

function digest(value: unknown): string {
    const text = JSON.stringify(value)
    let h1 = 0x811c9dc5
    for (let i = 0; i < text.length; i++) {
        h1 ^= text.charCodeAt(i)
        h1 = Math.imul(h1, 0x01000193) >>> 0
    }
    return h1.toString(16).padStart(8, '0')
}

const EXISTENCE_REQUIREMENTS = new Set(['EXISTS', 'COUNT', 'RANGE'])

function cardinalityOf(item: ContractItem): { min: number | null; max: number | null } {
    if (item.requirement === 'EXISTS') return { min: 1, max: null }
    const value = item.value
    if (typeof value === 'number') return { min: value, max: item.requirement === 'COUNT' ? value : null }
    const text = String(value ?? '')
    const min = text.match(/min(?:imum)?\s*:?\s*(\d+)/i) || text.match(/^(\d+)/)
    const max = text.match(/max(?:imum)?\s*:?\s*(\d+)/i)
    return {
        min: min ? Number(min[1]) : null,
        max: max ? Number(max[1]) : null,
    }
}

/**
 * Stage 2 — element classes (package §2.3, SD-47).
 * "Existence requirements establish supported classes defined by authoritative selectors. Derivation
 * does not manufacture individual identity or equivalence between classes."
 */
function formClasses(contracts: LoadedContract[], index: RegisterIndex): ElementClass[] {
    const classes: ElementClass[] = []

    for (const contract of contracts) {
        for (const item of contract.items || []) {
            const row = index.rows.get(String(item.row))
            if (!row || row.kind !== 'COLLECTION') continue
            if (!EXISTENCE_REQUIREMENTS.has(String(item.requirement))) continue

            const parsed = parseSelector(item.selector, String(item.row), index)
            // A selector that will not normalise was already recorded once, at stage 1. One defect,
            // one id: an item that cannot be normalised simply forms no class.
            if (!parsed.predicate) continue

            classes.push({
                classId: `c:${contract.contractId}:${item.itemId}`,
                row: String(item.row),
                fromItem: { contractId: contract.contractId, itemId: item.itemId },
                constraints: parsed.predicate,
                cardinality: cardinalityOf(item),
            })
        }
    }

    return classes.sort((a, b) => a.classId.localeCompare(b.classId))
}

/** Stage 1 — normalise every structural reference, in selectors and in values (SD-32). */
function normaliseSelectors(contracts: LoadedContract[], index: RegisterIndex, defects: FailureRecord[]): void {
    let ordinal = 0
    for (const contract of contracts) {
        for (const item of contract.items || []) {
            const rowId = String(item.row)
            if (!index.rows.has(rowId)) continue
            const parsed = parseSelector(item.selector, rowId, index)
            if (parsed.predicate) continue
            defects.push({
                failureId: recordId('REFERENCE_DEFECT', `${contract.contractId}:${item.itemId}`, ordinal++),
                kind: 'REFERENCE_DEFECT',
                stage: 1,
                locus: { contractId: contract.contractId, itemRef: { contractId: contract.contractId, itemId: item.itemId } },
                implicated: { contractIds: [contract.contractId], objectIds: [contract.objectId] },
                clause: CLAUSE('§2.2 stage 1'),
                offendingInput: String(item.selector ?? ''),
                detailRef: parsed.defect,
            })
        }
    }
}

/**
 * Stage 2 — structurally reachable triggers (SD-44). Only the prerequisites that are existence-level
 * facts are decided here; structural accessibility for REGION_ENTRY is a stage-6 withdrawal and is not
 * part of increment 1.
 */
function constructTriggers(classes: ElementClass[], index: RegisterIndex, envelope: DerivationInput['envelope']): string[] {
    const triggers: string[] = ['START', 'STANDING']
    if (index.citableStandingDecisions.has('SD-06')) triggers.push('SCORE')
    if (envelope && envelope.lengthM && envelope.widthM) triggers.push('OUT_END_LINE', 'OUT_TOUCHLINE')

    const teamClasses = classes.filter(c => c.row === 'P1')
    const ballClasses = classes.filter(c => c.row === 'O1' && c.constraints.terms.some(t => t.op === '=' && t.value === 'ball'))
    if (teamClasses.length >= 1 && ballClasses.length >= 1) triggers.push('POSSESSION_CHANGE')

    for (const region of classes.filter(c => c.row === 'S2')) triggers.push(`REGION_ENTRY{${region.classId}}`)
    for (const window of classes.filter(c => c.row === 'V23')) triggers.push(`TIME_EXPIRY{${window.classId}}`)

    return triggers.sort()
}

/** Stage 2 — the line inventory: one line per (class, row), and one per game-level row. */
function enumerateLines(classes: ElementClass[], index: RegisterIndex, stopped: PartialResult['stopped']): ResolutionLine[] {
    const lines: ResolutionLine[] = []

    for (const row of index.rows.values()) {
        if (row.kind === 'VIEW') continue // a view gets no line
        if (row.kind === 'COLLECTION') continue // existence is the class's cardinality, not a line of its own
        if (index.ownerRow.has(row.id)) continue // handled per class below
        lines.push({ lineId: `game::${row.id}`, elementId: null, row: row.id, member: null, lineState: 'ENUMERATED' })
    }

    for (const cls of classes) {
        for (const row of index.rows.values()) {
            if (row.kind !== 'FIELD') continue
            if (index.ownerRow.get(row.id) !== cls.row) continue

            const condition = index.applicability.get(row.id)
            const line: ResolutionLine = {
                lineId: `${cls.classId}::${row.id}`,
                elementId: cls.classId,
                row: row.id,
                member: null,
                lineState: condition ? 'CONDITIONAL' : 'ENUMERATED',
            }
            if (condition) line.conditionalOn = `${cls.classId}::${condition.row}`
            lines.push(line)

            if (/one property per (member|referent)/i.test(row.valueType || '')) {
                stopped.push({
                    where: `stage 2, row ${row.id}`,
                    why:
                        'the package enumerates "one line per member for set-valued rows", but the member set is not known until values are derived at stage 5. ' +
                        'Increment 1 enumerates the row once with member null and does not expand it. The expansion point needs stating in the package.',
                })
            }
        }
    }

    return lines.sort((a, b) => {
        const rowDelta = (index.rowOrdinal.get(a.row) ?? 0) - (index.rowOrdinal.get(b.row) ?? 0)
        if (rowDelta !== 0) return rowDelta
        const elementDelta = String(a.elementId).localeCompare(String(b.elementId))
        if (elementDelta !== 0) return elementDelta
        return String(a.member).localeCompare(String(b.member))
    })
}

function haltResult(halt: 'H1' | 'H2', message: string, input: DerivationInput): PartialResult {
    return {
        versions: null,
        classes: [],
        lines: [],
        triggers: [],
        failures: [],
        refusals: [
            {
                refusalId: recordId('INPUT_DEFECT', halt, 0),
                kind: 'INPUT_DEFECT',
                cause: `${halt}: ${message}`,
                stage: 0,
                clause: CLAUSE('§3.5'),
                openQuestion: null,
                affects: { lineIds: [], itemRefs: [], contractIds: (input.contracts || []).map(c => c.contractId).sort() },
            },
        ],
        run: {
            mode: input.candidate ? 'CHECKING' : 'DERIVATION',
            halted: true,
            divergent: false,
            inputDigest: digest(input),
            counts: {},
        },
        stopped: [],
    }
}

/** Stages 0–2. A result is always returned; a failure to stamp returns a stamped halt, never nothing. */
export function runStages0to2(input: DerivationInput): PartialResult {
    let index: RegisterIndex
    try {
        index = indexRegister(input.register)
    } catch (error) {
        if (error instanceof HaltError) return haltResult(error.halt, error.message, input)
        throw error
    }

    let versions
    try {
        versions = buildVersions(index, { contracts: input.contracts || [], selection: input.selection || [], derivationRules: input.derivationRules }, ENGINE_VERSION)
    } catch (error) {
        if (error instanceof HaltError) return haltResult(error.halt, error.message, input)
        throw error
    }

    const failures: FailureRecord[] = []
    const refusals: RefusalRecord[] = []
    const stopped: PartialResult['stopped'] = []

    // Stage 0 — load, per contract, the run continuing.
    const loaded = loadContracts(input.contracts || [], index)
    loaded.refusals.forEach((refusal, i) => {
        const itemRef: ItemRef[] = refusal.itemId ? [{ contractId: refusal.contractId, itemId: refusal.itemId }] : []
        failures.push({
            failureId: recordId('LOAD_REFUSAL', refusal.contractId, i),
            kind: 'LOAD_REFUSAL',
            stage: 0,
            locus: { contractId: refusal.contractId, itemRef: itemRef[0] },
            implicated: { contractIds: [refusal.contractId], objectIds: [] },
            clause: CLAUSE('§2.2 stage 0'),
            offendingInput: refusal.offendingInput,
            detailRef: refusal.reason,
        })
    })

    // A selected object with no admitted contract is a run-level refusal, not a halt.
    const admittedObjects = new Set(loaded.admitted.map(c => c.objectId))
    for (const entry of input.selection || []) {
        if (admittedObjects.has(entry.objectId)) continue
        refusals.push({
            refusalId: recordId('SELECTION_CONTRACT_MISMATCH', entry.objectId, 0),
            kind: 'SELECTION_CONTRACT_MISMATCH',
            cause: `selected object ${entry.objectId} has no admitted contract`,
            stage: 0,
            clause: CLAUSE('§2.2 stage 0'),
            openQuestion: null,
            affects: { lineIds: [], itemRefs: [], contractIds: [] },
        })
    }

    // Stage 1 — normalise.
    normaliseSelectors(loaded.admitted, index, failures)

    // Stage 2 — classes, triggers, lines.
    const classes = formClasses(loaded.admitted, index)
    const triggers = constructTriggers(classes, index, input.envelope)
    const lines = enumerateLines(classes, index, stopped)

    // One entry per distinct stop, not one per occurrence.
    const distinctStops = [...new Map(stopped.map(s => [`${s.where}|${s.why}`, s])).values()].sort((a, b) => a.where.localeCompare(b.where))

    return {
        versions,
        classes,
        lines,
        triggers,
        failures: failures.sort((a, b) => a.failureId.localeCompare(b.failureId)),
        refusals: refusals.sort((a, b) => a.refusalId.localeCompare(b.refusalId)),
        run: {
            mode: input.candidate ? 'CHECKING' : 'DERIVATION',
            halted: false,
            divergent: false,
            inputDigest: digest(input),
            counts: {
                contractsAdmitted: loaded.admitted.length,
                contractsRefused: loaded.refusals.length,
                classes: classes.length,
                lines: lines.length,
                triggers: triggers.length,
                failures: failures.length,
                refusals: refusals.length,
            },
        },
        stopped: distinctStops,
    }
}

export { predicateKey }
