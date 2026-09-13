/**
 * Context-gated game form selection for guided planning — RC1.1.
 *
 * Christian, 2026-09-12: Representative Performance Contexts enter selection BEFORE the ATP, as a
 * selector dimension. 2026-09-13: "Validation should fail rather than infer if the selected
 * realization cannot produce a valid event for the active Context."
 *
 * WHY IT IS NEEDED BEFORE ACTIVE. Measured with run-primary-scoring-coverage.ts: through the live
 * selector only 9 of 13 guided goals landed on a game form their routed context declares. Create
 * Scoring Chances landed on Finishing Games, where Chance Creation has no valid scoring event at all,
 * so primary scoring could only refuse. The selector was choosing a realization without knowing the
 * context the coach's goal routes to.
 *
 * THE NARROWEST FORM OF THE APPROVED DIMENSION. When a guided goal routes to a context, the game form
 * candidate pool is limited to that context's declared realizations, and nothing else changes: the
 * same scoring chooses among them, and lenses and constraints are selected exactly as before.
 * Free-text goals are untouched, because a context is never inferred from wording.
 *
 * It goes through the existing candidate-pool hint rather than inside generateSelection, so the
 * sport-neutral selector never imports the sport layer. Order feeds the selector's tie-break: the
 * parser's own candidates that the context declares keep their order, then the context's remaining
 * realizations, strongest relationship first.
 */
import type { InputConstraintHints } from '../input-constraints/deriveInputConstraints'
import { rpcLibrary } from './rpc-library'

export function gateCandidateGameFormsToContext(hints: InputConstraintHints, rpcId: string): InputConstraintHints {
    const declared = rpcLibrary.gameFormsForContext(rpcId).map((form) => form.relatedId)
    if (declared.length === 0) {
        throw new Error(`Context "${rpcId}" declares no game forms, so selection cannot be gated to it.`)
    }
    const parserOrder = (hints.candidateArchetypeIds ?? []).filter((id) => declared.includes(id))
    return {
        ...hints,
        candidateArchetypeIds: [...parserOrder, ...declared.filter((id) => !parserOrder.includes(id))],
    }
}
