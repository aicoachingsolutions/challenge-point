/**
 * Derivation engine — the register as data (package §1.2, §2.2 stage 0).
 *
 * The register is versioned data, never code. This module validates it against its own meta-schema
 * (halt H1), indexes it, and builds the `Versions` block (halt H2). It decides nothing about any
 * contract.
 */

import { Versions } from './types'

export interface RegisterRow {
    id: string
    path: string
    kind: 'COLLECTION' | 'FIELD' | 'VIEW'
    ownerRow?: string
    valueType?: string
    selectorAttributes?: string[]
    fillable?: string
    sourceKinds?: string[]
}

export interface ApplicabilityCondition {
    row: string
    sameElement: boolean
    in: string[]
}

export interface RegisterIndex {
    rows: Map<string, RegisterRow>
    /** Position in `register.rows`, the canonical row order (package §8). */
    rowOrdinal: Map<string, number>
    /** Row id → the collection row that owns it; game-level rows are absent. */
    ownerRow: Map<string, string>
    /** Row id → its `fillable` text. Exhaustive: a row absent here has no structurally defined choice space. */
    fillable: Map<string, string>
    /** Row id → the condition under which the row applies at all. */
    applicability: Map<string, ApplicabilityCondition>
    /** Vocabulary name → its closed member list. */
    vocabularies: Map<string, string[]>
    vocabularyVersions: Record<string, string>
    contractEnums: Record<string, string[]>
    citableStandingDecisions: Set<string>
    /** The citable entries themselves, as the register states them. */
    standingDecisions: any[]
    registerVersion: string
}

export class HaltError extends Error {
    constructor(
        public readonly halt: 'H1' | 'H2',
        message: string,
    ) {
        super(message)
    }
}

/** Halt H1 — "the engine cannot name what it is talking about" (package §3.5). */
export function indexRegister(register: any): RegisterIndex {
    if (!register || !Array.isArray(register.rows)) throw new HaltError('H1', 'register has no rows array')

    const rows = new Map<string, RegisterRow>()
    const rowOrdinal = new Map<string, number>()
    const ownerRow = new Map<string, string>()
    const fillable = new Map<string, string>()

    register.rows.forEach((row: RegisterRow, i: number) => {
        if (!row || !row.id || !row.path || !row.kind) throw new HaltError('H1', `row ${i} lacks id, path or kind`)
        if (rows.has(row.id)) throw new HaltError('H1', `duplicate row id ${row.id}`)
        rows.set(row.id, row)
        rowOrdinal.set(row.id, i)
        if (row.ownerRow) ownerRow.set(row.id, row.ownerRow)
        if (row.fillable) {
            if (row.kind === 'VIEW') throw new HaltError('H1', `fillable entry on VIEW row ${row.id}`)
            fillable.set(row.id, row.fillable)
        }
    })

    for (const [rowId, owner] of ownerRow) {
        const target = rows.get(owner)
        if (!target) throw new HaltError('H1', `ownerRow ${owner} of ${rowId} is not a row`)
        if (target.kind !== 'COLLECTION') throw new HaltError('H1', `ownerRow ${owner} of ${rowId} is not a COLLECTION`)
    }

    const applicability = new Map<string, ApplicabilityCondition>()
    const appBlock = register.applicability || {}
    for (const key of Object.keys(appBlock)) {
        const entry = appBlock[key]
        if (!entry || typeof entry !== 'object' || !entry.when) continue // prose notes in the same block
        if (!rows.has(key)) throw new HaltError('H1', `applicability keyed on unknown row ${key}`)
        const when = entry.when
        if (!when.row || !Array.isArray(when.in)) throw new HaltError('H1', `applicability for ${key} has no usable condition`)
        applicability.set(key, { row: when.row, sameElement: !!when.sameElement, in: when.in })
    }

    const vocabularies = new Map<string, string[]>()
    const vocabBlock = register.vocabularies || {}
    for (const key of Object.keys(vocabBlock)) {
        const value = vocabBlock[key]
        if (Array.isArray(value)) vocabularies.set(key, value)
    }
    const contractEnums: Record<string, string[]> = (vocabBlock.contractEnums as any) || {}

    const citable = new Set<string>((register.citableStandingDecisions || []).map((d: any) => d.id).filter(Boolean))

    return {
        rows,
        rowOrdinal,
        ownerRow,
        fillable,
        applicability,
        vocabularies,
        vocabularyVersions: (vocabBlock.versions as any) || {},
        contractEnums,
        citableStandingDecisions: citable,
        standingDecisions: (register.citableStandingDecisions || []).filter((d: any) => d && d.id),
        registerVersion: register.version,
    }
}

/**
 * Halt H2 — under SD-30 an unstamped result asserts nothing, so it is refused rather than emitted.
 * Every vocabulary must carry a version: the data model requires each list versioned separately so a
 * stored result can be known stale when a list's membership changes.
 */
export function buildVersions(
    index: RegisterIndex,
    input: { contracts: { contractId: string; knowledgeVersion?: string }[]; selection: { objectId: string; knowledgeVersion?: string }[]; derivationRules: { version: string } },
    engineVersion: string,
): Versions {
    if (!index.registerVersion) throw new HaltError('H2', 'register carries no version')
    if (!input.derivationRules || !input.derivationRules.version) throw new HaltError('H2', 'no derivation-rules version')
    if (!engineVersion) throw new HaltError('H2', 'no engine version')

    const vocabularies: Record<string, string> = {}
    for (const name of [...index.vocabularies.keys()].sort()) {
        const version = index.vocabularyVersions[name]
        if (!version) throw new HaltError('H2', `vocabulary ${name} carries no version`)
        vocabularies[name] = version
    }

    return {
        register: index.registerVersion,
        vocabularies,
        derivation: input.derivationRules.version,
        engine: engineVersion,
        contracts: input.contracts
            .map(c => ({ id: c.contractId, version: c.knowledgeVersion || '' }))
            .sort((a, b) => a.id.localeCompare(b.id)),
        objects: input.selection
            .map(s => ({ id: s.objectId, version: s.knowledgeVersion || '' }))
            .sort((a, b) => a.id.localeCompare(b.id)),
    }
}
