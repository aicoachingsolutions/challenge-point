/**
 * Canonical Environmental Manipulation Library — Knowledge Core Package 1.1 (Schema v2.0 RC1).
 *
 * Loads Christian's normalized Knowledge Schema. Per the package's AI Implementation Rules:
 *  - The workbook is the canonical source (committed verbatim at
 *    back/data/knowledge-core/Environmental_Manipulation_Knowledge_Schema_v2.0_RC1_Candidate.xlsx).
 *    em-schema.v2.0-rc1.json is a faithful, complete, generated projection of it (all sheets, all
 *    columns) so the engine has no runtime xlsx dependency. Regenerate the JSON from the workbook
 *    if a new schema release lands — never hand-edit it.
 *  - IDs are the only cross-references (Rule 9); identifiers are permanent and semantics-free (Rule 8).
 *  - No inferred Families/KOs (Rules 2–3); Deferred Research stays out (Rule 11).
 *  - Selection intelligence (vocabulary, weights, routing) stays OUTSIDE this module (Rule 17) —
 *    it lives in the engine's selection-metadata layer referencing these canonical IDs.
 */
import rawSchema from './em-schema.v2.0-rc1.json'

export interface EmFamily {
    Family_ID: string
    Family_Name: string
    Sort_Order: number
    Ownership_Definition: string
    Status: string
}
export interface EmKnowledgeObject {
    KO_ID: string
    Family_ID: string
    EVD_ID: string
    KO_Name: string
    Primitive: boolean | string
    Definition: string
    Sort_Order: number
    Status: string
    Version: number | string
}
export interface EmVariableDomain {
    EVD_ID: string
    Domain_Name: string
    Definition: string
    Status: string
}
export interface EmEngineeringDimension {
    DIM_ID: string
    KO_ID: string
    Dimension_Name: string
    Definition: string
    Applicability: string
    Sort_Order: number
    Status: string
    Version: number | string
}
export interface EmParameter {
    PARAM_ID: string
    DIM_ID: string
    Category: string
    Value_Type: string
    Definition: string
    Sort_Order: number
    Status: string
}
export interface EmRelationship {
    REL_ID: string
    Source_ID: string
    Relationship_Type: string
    Target_ID: string
    Definition: string
    Status: string
}
export interface EmExample {
    EX_ID: string
    KO_ID: string
    Example: string
    Context: string
    Illustrates: string
}

export interface EmCanonicalSchema {
    metadata: Record<string, string | number>
    families: EmFamily[]
    knowledgeObjects: EmKnowledgeObject[]
    variableDomains: EmVariableDomain[]
    engineeringDimensions: EmEngineeringDimension[]
    parameters: EmParameter[]
    relationships: EmRelationship[]
    examples: EmExample[]
    ecologicalGuidance: Array<Record<string, string>>
    deferredResearch: Array<Record<string, string>>
    changeLog: Array<Record<string, string>>
}

export const EM_CANONICAL_SCHEMA = rawSchema as unknown as EmCanonicalSchema

export interface EmSchemaIntegrityResult {
    valid: boolean
    errors: string[]
}

/**
 * Referential-integrity validation of the canonical schema (load-time gate): every cross-sheet
 * reference resolves to a real canonical ID, IDs are unique, and entity counts match the workbook's
 * own Version Metadata. Composition-check analogue of the package's normalized relational model.
 */
export function validateEmSchemaIntegrity(s: EmCanonicalSchema = EM_CANONICAL_SCHEMA): EmSchemaIntegrityResult {
    const errors: string[] = []
    const ids = (rows: Array<Record<string, unknown>>, key: string): Set<string> => {
        const set = new Set<string>()
        for (const r of rows) {
            const id = String(r[key] ?? '')
            if (!id) errors.push(`Missing ${key} on a row.`)
            else if (set.has(id)) errors.push(`Duplicate ${key}: ${id}`)
            else set.add(id)
        }
        return set
    }
    const famIds = ids(s.families as never, 'Family_ID')
    const koIds = ids(s.knowledgeObjects as never, 'KO_ID')
    const evdIds = ids(s.variableDomains as never, 'EVD_ID')
    const dimIds = ids(s.engineeringDimensions as never, 'DIM_ID')
    ids(s.parameters as never, 'PARAM_ID')
    ids(s.relationships as never, 'REL_ID')

    for (const ko of s.knowledgeObjects) {
        if (!famIds.has(ko.Family_ID)) errors.push(`${ko.KO_ID} references missing Family ${ko.Family_ID}`)
        if (!evdIds.has(ko.EVD_ID)) errors.push(`${ko.KO_ID} references missing EVD ${ko.EVD_ID}`)
    }
    for (const d of s.engineeringDimensions) {
        if (!koIds.has(d.KO_ID)) errors.push(`${d.DIM_ID} references missing KO ${d.KO_ID}`)
    }
    for (const p of s.parameters) {
        if (!dimIds.has(p.DIM_ID)) errors.push(`${p.PARAM_ID} references missing Dimension ${p.DIM_ID}`)
    }
    const allIds = new Set([...famIds, ...koIds, ...evdIds, ...dimIds])
    for (const r of s.relationships) {
        if (!allIds.has(r.Source_ID)) errors.push(`${r.REL_ID} source not canonical: ${r.Source_ID}`)
        if (!allIds.has(r.Target_ID)) errors.push(`${r.REL_ID} target not canonical: ${r.Target_ID}`)
    }
    for (const ex of s.examples) {
        if (!koIds.has(ex.KO_ID)) errors.push(`${ex.EX_ID} references missing KO ${ex.KO_ID}`)
    }
    const meta = s.metadata
    const metaChecks: Array<[string, number]> = [
        ['Family_Count', s.families.length],
        ['Knowledge_Object_Count', s.knowledgeObjects.length],
        ['Engineering_Variable_Domain_Count', s.variableDomains.length],
        ['Engineering_Dimension_Count', s.engineeringDimensions.length],
    ]
    for (const [key, actual] of metaChecks) {
        const declared = Number(meta[key])
        if (Number.isFinite(declared) && declared !== actual) {
            errors.push(`Version Metadata ${key}=${declared} but loaded ${actual}.`)
        }
    }
    return { valid: errors.length === 0, errors }
}

/** Convenience lookups (IDs only, per Rule 9). */
export const emCanonical = {
    schema: EM_CANONICAL_SCHEMA,
    version: String(EM_CANONICAL_SCHEMA.metadata['Schema_Version'] ?? 'unknown'),
    family: (id: string) => EM_CANONICAL_SCHEMA.families.find((f) => f.Family_ID === id),
    knowledgeObject: (id: string) => EM_CANONICAL_SCHEMA.knowledgeObjects.find((k) => k.KO_ID === id),
    dimensionsForKo: (koId: string) => EM_CANONICAL_SCHEMA.engineeringDimensions.filter((d) => d.KO_ID === koId),
    parametersForDimension: (dimId: string) => EM_CANONICAL_SCHEMA.parameters.filter((p) => p.DIM_ID === dimId),
    relationshipsFor: (id: string) =>
        EM_CANONICAL_SCHEMA.relationships.filter((r) => r.Source_ID === id || r.Target_ID === id),
}
