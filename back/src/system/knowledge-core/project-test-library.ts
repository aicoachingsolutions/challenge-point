/**
 * Bridge/demonstration for the Q1 two-layer separation.
 *
 * Projects the current working objects (TestLibraryV0 shape, which conflates knowledge + engine
 * metadata) into the engine's separately-owned selection-metadata layer. This proves the separation
 * with real data and, critically, surfaces exactly which of today's fields are ENGINE concerns
 * (matching vocabulary, structural role, affordance target) versus coaching KNOWLEDGE that belongs in
 * Christian's KO schemas. When populated KOs arrive, they join to this metadata by id.
 *
 * Behavior-preserving: this derives a parallel view; it does not mutate the working objects or the
 * live selection path.
 */
import { constraintBalanceBucket } from '../test-library/generateSelection'
import { testLibraryRegistry } from '../test-library/library/registry'
import type { TestLibraryV0Constraint } from '../test-library/types'
import type { EngineSelectionMetadata } from './selection-metadata'

/** Extract the engine-owned selection metadata from one working object. */
export function projectSelectionMetadata(c: TestLibraryV0Constraint): EngineSelectionMetadata {
    const affordanceTarget = (c.targetAffordancePrimary || '').trim()
    return {
        koId: c.id,
        matchingVocabulary: [...(c.coachVocabulary ?? [])],
        structuralRole: constraintBalanceBucket(c),
        ...(affordanceTarget ? { affordanceTarget } : {}),
    }
}

/**
 * The engine selection-metadata layer derived from the current library (all Constraint + Environmental
 * Manipulation working objects), keyed by KO id. This is the shape the live selector will eventually
 * read from instead of the object fields directly.
 */
export function buildSelectionMetadataLayer(): Map<string, EngineSelectionMetadata> {
    const layer = new Map<string, EngineSelectionMetadata>()
    for (const c of testLibraryRegistry.selectableConstraints()) {
        layer.set(c.id, projectSelectionMetadata(c))
    }
    return layer
}
