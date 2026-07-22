/**
 * Game Archetype Library — RC1.1 Knowledge & Implementation Release (2026-07-21).
 *
 * Canonical ingestion source: the workbook committed verbatim at
 * back/data/knowledge-core/Game_Archetype_Workbook_RC1.1.xlsx, projected completely into
 * game-archetype-workbook.rc1.1.json (generated — never hand-edit).
 *
 * Game Archetypes are recurring ECOLOGICAL ORGANIZATIONS stable across sports, player numbers, and
 * engineering decisions — sports INSTANTIATE archetypes; archetypes do not classify sports. RC1.1:
 * 6 canonical archetypes (Invasion, Net/Wall, Striking/Fielding, Pursuit–Evasion, State Construction,
 * Retention) and a 216-row Knowledge sheet relating each archetype to canonical Game Problems
 * (GP-IDs) by role (CONSTITUTIVE / CHARACTERISTIC / COMPATIBLE / CONTRADICTORY), plus organizational-
 * integrity CONDITIONs and EM/IR family relationships. IDs-only cross-references; the workbook is the
 * authoritative runtime source, the supporting docs explain/govern it.
 *
 * No engine coupling yet — canonical ingestion + integrity only, per the release's own governance
 * (changes flow through the Discovery Register + Admission Review, not ad-hoc patching).
 */
import gaWorkbook from './game-archetype-workbook.rc1.1.json'

export interface GameArchetype {
    Archetype_ID: string // GA-001..GA-006 (permanent)
    Canonical_Name: string
    Objective_Organization?: string
    Interaction_Organization?: string
    State_Consequence_Organization?: string
    Canonical_Status?: string
    Confidence?: string
    MVP_Runtime_Status?: string
    Scope?: string
    Version?: string
}

export type ArchetypeKnowledgeType =
    | 'GAME_PROBLEM_RELATIONSHIP'
    | 'ORGANIZATIONAL_INTEGRITY_CONDITION'
    | 'EM_FAMILY_RELATIONSHIP'
    | 'IR_FAMILY_RELATIONSHIP'

export type ArchetypeKnowledgeRole =
    | 'CONSTITUTIVE'
    | 'CHARACTERISTIC'
    | 'COMPATIBLE'
    | 'CONTRADICTORY'
    | 'CONDITION'
    | 'RELEVANT'

export interface ArchetypeKnowledgeRow {
    Record_ID: string // GAK-####
    Archetype_ID: string
    Knowledge_Type: ArchetypeKnowledgeType
    Target_Domain?: string
    Target_ID?: string // e.g. a GP-ID for GAME_PROBLEM_RELATIONSHIP rows
    Target_Name?: string
    Knowledge_Role: ArchetypeKnowledgeRole
    Knowledge_Statement?: string
    Rationale?: string
    Provenance?: string
    Version?: string
}

interface GaWorkbook {
    metadata: Record<string, string | number>
    archetypes: GameArchetype[]
    knowledge: ArchetypeKnowledgeRow[]
}

const WB = gaWorkbook as unknown as GaWorkbook

export interface GameArchetypeIntegrityResult {
    valid: boolean
    errors: string[]
}

/** Load-time integrity gate against the workbook's own expected counts (defined failure, never silent). */
export function validateGameArchetypeIntegrity(data: GaWorkbook = WB): GameArchetypeIntegrityResult {
    const errors: string[] = []
    const m = data.metadata
    const expect = (key: string, actual: number) => {
        const declared = Number(m[key])
        if (Number.isFinite(declared) && declared !== actual) errors.push(`${key}=${declared} but loaded ${actual}.`)
    }
    expect('Archetype_Count', data.archetypes.length)
    expect('Expected_Total_Knowledge_Rows', data.knowledge.length)

    const byType = (t: string) => data.knowledge.filter((k) => k.Knowledge_Type === t).length
    expect('Expected_Game_Problem_Relationship_Rows', byType('GAME_PROBLEM_RELATIONSHIP'))
    expect('Expected_Organizational_Integrity_Condition_Rows', byType('ORGANIZATIONAL_INTEGRITY_CONDITION'))
    expect('Expected_EM_Family_Relationship_Rows', byType('EM_FAMILY_RELATIONSHIP'))
    expect('Expected_IR_Family_Relationship_Rows', byType('IR_FAMILY_RELATIONSHIP'))

    const archIds = new Set<string>()
    for (const a of data.archetypes) {
        if (archIds.has(a.Archetype_ID)) errors.push(`Duplicate Archetype_ID ${a.Archetype_ID}.`)
        archIds.add(a.Archetype_ID)
    }
    const recIds = new Set<string>()
    for (const k of data.knowledge) {
        if (recIds.has(k.Record_ID)) errors.push(`Duplicate Record_ID ${k.Record_ID}.`)
        recIds.add(k.Record_ID)
        if (!archIds.has(k.Archetype_ID)) errors.push(`${k.Record_ID} references unknown Archetype ${k.Archetype_ID}.`)
    }
    return { valid: errors.length === 0, errors }
}

/** IDs-only accessors. */
export const gameArchetypeLibrary = {
    metadata: WB.metadata,
    version: String(WB.metadata['Workbook_Version'] ?? 'RC1.1'),
    archetypes: () => WB.archetypes,
    archetype: (id: string) => WB.archetypes.find((a) => a.Archetype_ID === id),
    knowledge: () => WB.knowledge,
    /** Knowledge rows for one archetype, optionally filtered by type. */
    knowledgeFor: (archetypeId: string, type?: ArchetypeKnowledgeType) =>
        WB.knowledge.filter((k) => k.Archetype_ID === archetypeId && (!type || k.Knowledge_Type === type)),
    /** GP-IDs an archetype relates to at a given role (e.g. CONSTITUTIVE Game Problems). */
    gameProblemsAtRole: (archetypeId: string, role: ArchetypeKnowledgeRole) =>
        WB.knowledge
            .filter(
                (k) =>
                    k.Archetype_ID === archetypeId &&
                    k.Knowledge_Type === 'GAME_PROBLEM_RELATIONSHIP' &&
                    k.Knowledge_Role === role
            )
            .map((k) => k.Target_ID ?? ''),
}
