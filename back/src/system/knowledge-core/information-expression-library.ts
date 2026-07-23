/**
 * Information Expression Library — RC1.1 (2026-07-23).
 *
 * Canonical ingestion source: the workbook committed verbatim at
 * back/data/knowledge-core/Information_Expression_Library_RC1.1.xlsx, projected completely into
 * information-expression.rc1.1.json (generated — never hand-edit).
 *
 * ARCHITECTURAL REDUCTION: named informational situations (Late Reveal, Opponent-Created Deception,
 * Distributed Team Knowledge…) failed hostile testing as canonical objects and are NOT Registry
 * entries. They survive only as NONCANONICAL_PRESET composite configurations assembled from
 * dimensions + values. Canonical ontology = 4 Families → 4 Engineering Domains → 26 Dimensions →
 * 139 Allowed Values, with 26 Integrity Conditions.
 *
 * Families: Informational Availability / Revelation / Distribution / Reliability.
 * Runtime status is SHADOW_REFERENCE — loaded and inspectable, not coupled to production selection.
 *
 * NOTE: this supersedes the engine's earlier ad-hoc information mechanics (the four
 * `primaryConstraintType: 'information'` constraints with environmentalRealizations that drive the
 * live informationExpressionDirective). Those remain the working bridge; mapping them onto these
 * canonical dimensions is future semantic work, deliberately not done here.
 */
import ieWorkbook from './information-expression.rc1.1.json'

export type IeResourceType = 'FAMILY' | 'ENGINEERING_DOMAIN'

export interface IeRegistryEntry {
    resource_id: string // IE-F0n (family) | IED-00n (engineering domain)
    resource_type: IeResourceType
    canonical_name: string
    canonical_definition?: string
    parent_id?: string
    family_id?: string
    canonical_status?: string
    runtime_status?: string
    primary_ecological_question?: string
    version?: string
}

export type IeRecordType =
    | 'RELATIONSHIP' // DOMAIN_OF_FAMILY
    | 'DIMENSION_DEFINITION' // a canonical engineering dimension
    | 'INTEGRITY_CONDITION' // representative constraint that must hold
    | 'ALLOWED_VALUE' // permitted value for a dimension
    | 'NONCANONICAL_PRESET' // named composite configuration (NOT canonical)
    | 'DEFERRED_RELATIONSHIP_DOMAIN' // intentionally deferred (Discovery Register)

export interface IeKnowledgeRow {
    knowledge_id: string // IEK-####
    subject_id: string
    record_type: IeRecordType
    predicate_code?: string
    object_id?: string
    value_code?: string
    value_text?: string
    sequence?: number
    canonical_status?: string
    version?: string
}

interface IeWorkbook {
    metadata: Record<string, string | number>
    registry: IeRegistryEntry[]
    knowledge: IeKnowledgeRow[]
}

const WB = ieWorkbook as unknown as IeWorkbook

export interface IeIntegrityResult {
    valid: boolean
    errors: string[]
}

/** Load-time integrity gate against the workbook's own declared expectations. */
export function validateInformationExpressionIntegrity(data: IeWorkbook = WB): IeIntegrityResult {
    const errors: string[] = []
    const m = data.metadata
    const expect = (key: string, actual: number) => {
        const declared = Number(m[key])
        if (Number.isFinite(declared) && declared !== actual) errors.push(`${key}=${declared} but loaded ${actual}.`)
    }
    const byType = (t: IeRecordType) => data.knowledge.filter((k) => k.record_type === t).length

    expect('expected_registry_count', data.registry.length)
    expect('expected_family_count', data.registry.filter((r) => r.resource_type === 'FAMILY').length)
    expect('expected_engineering_domain_count', data.registry.filter((r) => r.resource_type === 'ENGINEERING_DOMAIN').length)
    expect('expected_knowledge_count', data.knowledge.length)
    expect('expected_dimension_count', byType('DIMENSION_DEFINITION'))
    expect('expected_allowed_value_count', byType('ALLOWED_VALUE'))
    expect('expected_integrity_condition_count', byType('INTEGRITY_CONDITION'))
    expect('expected_domain_membership_count', byType('RELATIONSHIP'))
    expect('expected_noncanonical_preset_count', byType('NONCANONICAL_PRESET'))
    expect('expected_deferred_domain_count', byType('DEFERRED_RELATIONSHIP_DOMAIN'))

    // Canonical-pattern-layer invariant: named patterns must NOT be Registry objects.
    if (String(m['canonical_pattern_layer'] ?? '').toUpperCase() !== 'NONE') {
        errors.push('canonical_pattern_layer must be NONE — named patterns are not canonical Registry objects.')
    }

    const regIds = new Set(data.registry.map((r) => r.resource_id))
    for (const r of data.registry) {
        if (r.resource_type === 'ENGINEERING_DOMAIN' && r.parent_id && !regIds.has(r.parent_id)) {
            errors.push(`${r.resource_id} references unknown parent family ${r.parent_id}.`)
        }
    }
    const kIds = new Set<string>()
    for (const k of data.knowledge) {
        if (kIds.has(k.knowledge_id)) errors.push(`Duplicate knowledge_id ${k.knowledge_id}.`)
        kIds.add(k.knowledge_id)
        if (k.record_type === 'RELATIONSHIP' && k.object_id && !regIds.has(k.object_id)) {
            errors.push(`${k.knowledge_id} references unknown family ${k.object_id}.`)
        }
    }
    return { valid: errors.length === 0, errors }
}

/** IDs-only accessors. */
export const informationExpressionLibrary = {
    metadata: WB.metadata,
    version: String(WB.metadata['workbook_version'] ?? 'RC1.1'),
    families: () => WB.registry.filter((r) => r.resource_type === 'FAMILY'),
    engineeringDomains: () => WB.registry.filter((r) => r.resource_type === 'ENGINEERING_DOMAIN'),
    entry: (id: string) => WB.registry.find((r) => r.resource_id === id),
    knowledge: () => WB.knowledge,
    /** Canonical engineering dimensions (optionally for one engineering domain). */
    dimensions: (domainId?: string) =>
        WB.knowledge.filter((k) => k.record_type === 'DIMENSION_DEFINITION' && (!domainId || k.object_id === domainId)),
    /** Allowed values for one dimension (subject_id = the dimension id, e.g. IE-D001). */
    allowedValues: (dimensionId: string) =>
        WB.knowledge.filter((k) => k.record_type === 'ALLOWED_VALUE' && k.subject_id === dimensionId),
    /** Representative integrity conditions attached to a dimension. */
    integrityConditions: (dimensionId?: string) =>
        WB.knowledge.filter((k) => k.record_type === 'INTEGRITY_CONDITION' && (!dimensionId || k.subject_id === dimensionId)),
    /** Named composite configurations — explicitly NON-canonical, human-readable only. */
    noncanonicalPresets: () => WB.knowledge.filter((k) => k.record_type === 'NONCANONICAL_PRESET'),
}
