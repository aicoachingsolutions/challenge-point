/**
 * Game Problem Library — RC1 Knowledge & Implementation Release v1.0 (2026-07-17).
 *
 * Canonical ingestion source: the machine-readable workbook committed verbatim at
 * back/data/knowledge-core/Game_Problem_Library_RC1_Workbook_v1.0.xlsx, projected completely into
 * gp-library.rc1.json (generated — never hand-edit). The ontology: 6 canonical performer–environment
 * Relationship Domains, 17 canonical Game Problems (Domain × Operation), and an IDs-only
 * relationship register. Complex coaching intentions are represented by the COMPOSITE RUNTIME
 * (one Primary + zero-or-one Secondary Game Problem; Primary wins conflicts; merged ATP retains
 * provenance) — never by ontology expansion. Expansion is evidence-driven only.
 *
 * NOTE (flagged to Christian): the Affordance Target Matrix RC1.1 is keyed to an earlier 11-name
 * Game Problem registry; only 5 names overlap this canonical register. Until the ATM is re-keyed
 * (his canonical work), the ATM shadow path continues on its own registry and this library stands
 * alongside it in the registry/trace.
 */
import gpWorkbook from './gp-library.rc1.json'

export interface GpRelationshipDomain {
    Type: 'RelationshipDomain'
    ID: string // RD-001..RD-006
    Name: string
    Status: string
}

export interface GpGameProblem {
    Type: 'GameProblem'
    ID: string // GP-001..GP-017 (permanent)
    Name: string
    'Relationship Domain': string
    Operation: string
    Status: string
}

export interface GpRelationship {
    Source_ID: string
    Relationship: string // same_domain | inverse_of | paired_with
    Target_ID: string
    Notes?: string
}

interface GpWorkbookShape {
    metadata: Record<string, string | number>
    relationshipDomains: GpRelationshipDomain[]
    gameProblems: GpGameProblem[]
    relationships: GpRelationship[]
}

const RAW = gpWorkbook as unknown as GpWorkbookShape

export interface GpLibraryIntegrityResult {
    valid: boolean
    errors: string[]
}

/** Load-time integrity gate against the workbook's own metadata (defined failure, never silent). */
export function validateGpLibraryIntegrity(data: GpWorkbookShape = RAW): GpLibraryIntegrityResult {
    const errors: string[] = []
    const expectedDomains = Number(data.metadata['Relationship Domains'] ?? 6)
    const expectedGps = Number(data.metadata['Canonical Game Problems'] ?? 17)
    if (data.relationshipDomains.length !== expectedDomains) {
        errors.push(`Expected ${expectedDomains} Relationship Domains, loaded ${data.relationshipDomains.length}.`)
    }
    if (data.gameProblems.length !== expectedGps) {
        errors.push(`Expected ${expectedGps} Game Problems, loaded ${data.gameProblems.length}.`)
    }
    const domainNames = new Set(data.relationshipDomains.map((d) => d.Name))
    const gpIds = new Set<string>()
    for (const gp of data.gameProblems) {
        if (gpIds.has(gp.ID)) errors.push(`Duplicate Game Problem ID ${gp.ID}.`)
        gpIds.add(gp.ID)
        if (!domainNames.has(gp['Relationship Domain'])) {
            errors.push(`${gp.ID} references unknown Relationship Domain "${gp['Relationship Domain']}".`)
        }
    }
    for (const rel of data.relationships) {
        if (!gpIds.has(rel.Source_ID)) errors.push(`Relationship source not canonical: ${rel.Source_ID}.`)
        if (!gpIds.has(rel.Target_ID)) errors.push(`Relationship target not canonical: ${rel.Target_ID}.`)
    }
    return { valid: errors.length === 0, errors }
}

/** IDs-only accessors for the canonical register. */
export const gpLibrary = {
    metadata: RAW.metadata,
    version: `${String(RAW.metadata['Release'] ?? 'RC1')} / workbook ${String(RAW.metadata['Workbook Version'] ?? '1.0')}`,
    relationshipDomains: () => RAW.relationshipDomains,
    gameProblems: () => RAW.gameProblems,
    relationships: () => RAW.relationships,
    gameProblem: (id: string) => RAW.gameProblems.find((g) => g.ID === id),
    gameProblemByName: (name: string) => RAW.gameProblems.find((g) => g.Name === name),
    relationshipsFor: (id: string) => RAW.relationships.filter((r) => r.Source_ID === id || r.Target_ID === id),
}
