/**
 * Canonical Knowledge Object types — Knowledge Core Package #1 (RC1).
 *
 * These transcribe Christian's authoritative KO schemas verbatim in structure:
 *   - Environmental Manipulation KO Schema v1.1  (package doc 6)
 *   - Interaction Regulation KO Schema RC1       (package doc 7)
 *
 * They are the canonical KNOWLEDGE contract: what a manipulation / regulation *is*, independent of
 * sport, activity, coach wording, and software. They intentionally do NOT carry engine-selection
 * metadata (matching vocabulary, structural role, affordance linkage) — that is the deterministic
 * engine's concern and lives in the separately-owned layer (see ./selection-metadata.ts). This is the
 * Q1 separation: the Knowledge Core stays clean of implementation; the engine references KOs by id.
 *
 * Populated instances arrive via Christian's Family Population Worksheets (EM) and Constraint Library
 * population (Interaction Regulations); these types are the shape that population validates against.
 */

/* ----------------------------- Environmental Manipulation ----------------------------- */

/** The six RC1 Environmental Manipulation families (mutually exclusive; compose per activity). */
export const ENVIRONMENTAL_MANIPULATION_FAMILIES = [
    'Playing Area Geometry',
    'Spatial Organization',
    'Performer Availability',
    'Objective Structure',
    'Environmental Objects',
    'Playing Surface',
] as const
export type EnvironmentalManipulationFamily = (typeof ENVIRONMENTAL_MANIPULATION_FAMILIES)[number]

/** Confidence in the knowledge, per the schema's Evidence Status field. */
export type EvidenceStatus = 'Established' | 'Supported' | 'Emerging' | 'Experimental'

/** Lifecycle of a Knowledge Object. */
export type KnowledgeObjectStatus = 'Draft' | 'Stable' | 'Retired'

/** Environmental Manipulation KO (schema v1.1). Common relationships are inherited from the Family. */
export interface EnvironmentalManipulationKnowledgeObject {
    /** Permanent, unique, never-reused identifier. */
    id: string
    name: string
    family: EnvironmentalManipulationFamily
    /** The Engineering Dimension this object manipulates. */
    dimension: string
    definition: string
    /** The environmental property changed. */
    directlyManipulates: string
    designIntent: string
    /** Unique tendencies of this manipulation. */
    typicalOpportunityLandscapeEffects?: string
    tradeoffs?: string
    /** Only unique/important relationships; everything common is inherited from the Family. */
    relationships?: string
    evidenceStatus: EvidenceStatus
    implementationNotes?: string
    status: KnowledgeObjectStatus
}

/* ------------------------------- Interaction Regulation ------------------------------- */

/** How the regulation changes interaction availability (RC1 values; descriptive, may evolve). */
export type AvailabilityChange =
    | 'Restricted'
    | 'Conditional'
    | 'Required'
    | 'Limited'
    | 'Delayed'
    | 'Temporarily Available'
    | 'Temporarily Unavailable'

/** Sources of conditionality determining when an interaction is available (RC1 examples). */
export const CONDITION_SOURCES = [
    'Actor',
    'Role',
    'Team',
    'Player State',
    'Location',
    'Zone',
    'Time',
    'Count',
    'Previous Interaction',
    'Possession State',
    'Game State',
    'Score State',
    'Opponent Action',
    'Opponent Position',
    'Object State',
    'Information State',
    'Resource State',
    'Environmental State',
] as const
export type ConditionSource = (typeof CONDITION_SOURCES)[number]

/** Interaction Regulation KO (Constraint Library, schema RC1). A reusable, parameterizable intervention. */
export interface InteractionRegulationKnowledgeObject {
    /** Permanent, unique, never-reused identifier (e.g. "CR-001"). */
    id: string
    name: string
    /** The intervention itself, not the learning outcome. */
    purpose: string
    /** The performer–environment interaction whose availability changes (e.g. Passing, Scoring). */
    regulatedInteraction: string
    availabilityChange: AvailabilityChange
    /** Information that determines when the interaction becomes available/unavailable. */
    conditionSources: ConditionSource[]
    /** Variables typically required to instantiate the regulation (implementation-neutral). */
    commonParameters: string[]
    /** Illustrative coach-facing realizations (do not define the regulation). */
    exampleRealizations: string[]
    /** Why this belongs in the Constraint Library / distinctions from neighboring libraries. */
    ownershipNotes?: string
    ecologicalNotes?: string
    validatorConsiderations?: string
    populationNotes?: string
    status?: KnowledgeObjectStatus
}
