/**
 * Engine selection metadata for the 11 canonical Environmental Manipulation Knowledge Objects —
 * the first real population of the Q1 engine-owned layer, and the experiment Christian endorsed:
 * does canonical reachability + Ecological Guidance + a lightweight preference layer produce
 * sensible selections?
 *
 * Per AI Implementation Rule 17 this lives OUTSIDE the Knowledge Core: coach-language vocabulary and
 * affordance affinities are implementation intelligence referencing canonical IDs only. Nothing here
 * redefines a Knowledge Object; deleting this file loses zero coaching knowledge.
 *
 * Three-layer suitability (agreed with Christian):
 *   1. Reachability — which canonical KOs can influence what the goal implicates (vocab match here,
 *      then canonical graph traversal via emCanonical for dimensions/parameters/guidance).
 *   2. Contextual fit — Ecological Guidance rows attached to each reached KO (validator input).
 *   3. Relative preference — small, inspectable affinity weights (evidence-revisable, like
 *      selection-weights.ts). Deterministic ordering; ties break on canonical KO id.
 */
import { emCanonical } from './em-canonical'

/** Affordance slugs used by the live engine (lens categories) + 'perception' (info constraints). */
export type AffordanceSlug =
    | 'maintain_possession'
    | 'create_space'
    | 'break_lines'
    | 'attack_quickly'
    | 'regain_possession'
    | 'finish'
    | 'delay_or_deny'
    | 'protect_space'
    | 'recover_shape'
    | 'perception'

export interface EmKoSelectionMetadata {
    /** Canonical Knowledge Object id (EM-0001..EM-0011). Reference only — never redefines the KO. */
    koId: string
    /** Coach-language phrases/synonyms the parser matches natural input against. */
    matchingVocabulary: string[]
    /** Affordances this manipulation commonly serves, with a small relative preference weight. */
    affordanceAffinities: Partial<Record<AffordanceSlug, number>>
}

export const EM_SELECTION_METADATA: EmKoSelectionMetadata[] = [
    {
        koId: 'EM-0001', // Playing Area Configuration (Length / Width / Shape)
        matchingVocabulary: [
            'field size', 'pitch size', 'small area', 'tight space', 'tight spaces', 'small-sided',
            'narrow field', 'narrow pitch', 'wide field', 'bigger area', 'smaller area', 'grid',
            'playing area', 'shorten the field', 'stretch the field', 'long narrow', 'compact area',
        ],
        affordanceAffinities: { maintain_possession: 3, create_space: 2, protect_space: 1, break_lines: 1 },
    },
    {
        koId: 'EM-0002', // Performer Configuration (Position / Orientation of performers)
        matchingVocabulary: [
            'starting positions', 'start deeper', 'start higher', 'start wider', 'body shape',
            'side-on', 'facing forward', 'back to goal', 'compact start', 'spread out start',
            'defenders start', 'recovery position',
        ],
        affordanceAffinities: { recover_shape: 3, protect_space: 2, perception: 1, attack_quickly: 1 },
    },
    {
        koId: 'EM-0003', // Objective Configuration (Position / Orientation of objectives)
        matchingVocabulary: [
            'goal placement', 'wide goals', 'central goal', 'target position', 'angled target',
            'goals on the sides', 'move the goals', 'end line targets', 'counter goals',
        ],
        affordanceAffinities: { create_space: 2, break_lines: 2, finish: 2, perception: 1 },
    },
    {
        koId: 'EM-0004', // Environmental Object Configuration (Position / Orientation of objects)
        matchingVocabulary: [
            'cone placement', 'gates', 'gate position', 'mannequins', 'rebound board',
            'poles', 'place cones', 'passing gates',
        ],
        affordanceAffinities: { break_lines: 2, create_space: 1 },
    },
    {
        koId: 'EM-0005', // Surface Properties (Friction / Compliance / Energy Return)
        matchingVocabulary: ['surface', 'turf', 'grass', 'slick surface', 'wet surface', 'soft ground', 'indoor court'],
        affordanceAffinities: { maintain_possession: 1 },
    },
    {
        koId: 'EM-0006', // Participant Composition (Quantity per group)
        matchingVocabulary: [
            'overload', 'underload', 'numbers up', 'numbers down', 'extra player', 'extra attacker',
            'extra defender', 'neutral player', 'neutrals', '4v4', '5v4', '3v2', 'even numbers',
            'numerical advantage', 'outnumbered',
        ],
        affordanceAffinities: { create_space: 3, maintain_possession: 2, attack_quickly: 1, regain_possession: 1 },
    },
    {
        koId: 'EM-0007', // Participant State (Participation status)
        matchingVocabulary: [
            'inactive player', 'waiting player', 'rotate in', 'rotate players', 'recovery run before joining',
            'join late', 'frozen defender', 'passive defender',
        ],
        affordanceAffinities: { attack_quickly: 2, recover_shape: 2 },
    },
    {
        koId: 'EM-0008', // Environmental Object Properties (Size/Shape/Mass/Mobility/Openness/…)
        matchingVocabulary: [
            'heavier ball', 'smaller ball', 'bigger ball', 'foam barriers', 'open gate',
            'solid target', 'object size', 'futsal ball',
        ],
        affordanceAffinities: { maintain_possession: 1, finish: 1 },
    },
    {
        koId: 'EM-0009', // Objective Composition (Quantity of objectives)
        matchingVocabulary: [
            'multiple goals', 'two goals', 'three goals', 'multiple targets', 'extra target',
            'more goals', 'several targets', 'many gates to score',
        ],
        affordanceAffinities: { perception: 3, create_space: 1, finish: 1 },
    },
    {
        koId: 'EM-0010', // Objective State (Activation)
        matchingVocabulary: [
            'active goal', 'live goal', 'live target', 'goal opens', 'goal closes', 'switching targets',
            'which goal is open', 'target switches', 'changing target',
        ],
        affordanceAffinities: { perception: 3, attack_quickly: 1 },
    },
    {
        koId: 'EM-0011', // Environmental Object Composition (Quantity of objects)
        matchingVocabulary: ['number of cones', 'more gates', 'fewer gates', 'add cones', 'extra gates'],
        affordanceAffinities: { break_lines: 1 },
    },
]

export interface EmReachabilityCandidate {
    koId: string
    koName: string
    familyName: string
    /** Vocabulary phrases from the goal that reached this KO (traceability). */
    matchedTerms: string[]
    /** Affinity bonus applied for the goal's target affordances (traceability). */
    affinityHits: Array<{ affordance: string; weight: number }>
    score: number
    /** Canonical design levers for this KO (Engineering Dimensions, IDs + names). */
    dimensions: Array<{ dimId: string; name: string }>
    /** Ecological Guidance rows for contextual-fit assessment (layer 2). */
    guidance: string[]
}

/**
 * Layer 1+3 prototype: reach canonical EM KOs from a coach goal (vocabulary match), apply the
 * lightweight affordance-affinity preference, and return deterministic, traceable candidates with
 * their canonical dimensions and guidance attached. Pure function; no randomness; ties break on koId.
 */
export function reasonEnvironmentalManipulations(
    goalText: string,
    targetAffordances: AffordanceSlug[] = []
): EmReachabilityCandidate[] {
    const text = ` ${goalText.toLowerCase().replace(/\s+/g, ' ').trim()} `
    const out: EmReachabilityCandidate[] = []
    for (const meta of EM_SELECTION_METADATA) {
        const matchedTerms = meta.matchingVocabulary.filter((v) => text.includes(v.toLowerCase()))
        const affinityHits = targetAffordances
            .filter((a) => (meta.affordanceAffinities[a] ?? 0) > 0)
            .map((a) => ({ affordance: a, weight: meta.affordanceAffinities[a]! }))
        const score = matchedTerms.length * 4 + affinityHits.reduce((s, h) => s + h.weight, 0)
        if (score <= 0) continue
        const ko = emCanonical.knowledgeObject(meta.koId)
        if (!ko) continue
        const family = emCanonical.family(ko.Family_ID)
        out.push({
            koId: meta.koId,
            koName: ko.KO_Name,
            familyName: family?.Family_Name ?? ko.Family_ID,
            matchedTerms,
            affinityHits,
            score,
            dimensions: emCanonical.dimensionsForKo(meta.koId).map((d) => ({ dimId: d.DIM_ID, name: d.Dimension_Name })),
            guidance: emCanonical.schema.ecologicalGuidance
                .filter((g) => String(g['KO_ID'] ?? '') === meta.koId)
                .map((g) => String(g['Guidance'] ?? '')),
        })
    }
    return out.sort((a, b) => b.score - a.score || a.koId.localeCompare(b.koId))
}
