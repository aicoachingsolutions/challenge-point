/**
 * Engine selection metadata — the deterministic engine's OWN layer (Q1 decision).
 *
 * Knowledge Core Package #1's KO schemas capture coaching knowledge but deliberately do not carry the
 * three things the deterministic selector needs to CHOOSE a Knowledge Object for a given coach intent:
 *   1. matching vocabulary — coach-language synonyms/phrases the parser matches input against;
 *   2. structural role     — foundation / shaping / consequence, for balanced package assembly;
 *   3. affordance linkage  — which affordance a regulation targets (lens coupling in scoring).
 *
 * Per Christian's own separation-of-concerns principle, that metadata should NOT be pushed into the
 * Knowledge Objects. Instead the engine owns this layer, keyed by KO id. When a populated KO arrives,
 * it joins to its selection metadata by id: knowledge stays pure; the engine keeps what it needs.
 *
 * This is the target architecture. The live selection path is NOT yet rewired onto it (that migration
 * is gated on Christian's Q1 confirmation + real populated KOs). Today this layer is derived from the
 * existing working objects (see ./project-test-library.ts) to prove the separation with real data.
 */

/** Role a Knowledge Object plays when the engine assembles a balanced package. */
export type StructuralRole = 'foundation' | 'shaping' | 'consequence'

export interface EngineSelectionMetadata {
    /** References the canonical Knowledge Object by its permanent id. */
    koId: string
    /** Coach-language synonyms/phrases the parser matches natural input against. */
    matchingVocabulary: string[]
    /** Balancing role for package assembly. */
    structuralRole: StructuralRole
    /** Affordance this object targets, when applicable (lens-coupling input to scoring). */
    affordanceTarget?: string
}
