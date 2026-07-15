/**
 * Affordance Target Matrix — RC1 Working Standard (RAS RC1 package, "Affordance Target Matrix" doc).
 *
 * A VERSIONED REASONING RESOURCE owned by the Reasoning Engine (it is neither an Affordance Library
 * nor a Game Problem Library object): for each canonical Game Problem it records the expected role of
 * each canonical Affordance in a representative learning environment. Content transcribed verbatim
 * from Christian's RC1 matrix — per its governance rules it evolves only through his canonical
 * process (never tuned here because an activity "looks right"), and it is data, not logic.
 *
 * The matrix guides construction of Resolved Affordance Target Profiles (reasoning PRODUCTS, not
 * canonical Knowledge Objects). RC1 status: SHADOW MODE — profiles are resolved and exposed in the
 * reasoning trace for inspection, and do NOT influence selection until equivalence is verified and
 * Christian populates the fuller matrix/Affordance Library (bridge to engine lenses deferred, per
 * his 2026-07-14 direction).
 */

/** Expected role of an affordance for a Game Problem (RC1 rating scale). */
export type AffordanceTargetRating =
    | 'Essential' // Required for representative solution of the Game Problem.
    | 'Supportive' // Frequently contributes but is not always required.
    | 'Contextual' // Importance depends on role, situation, or task constraints.
    | 'Opposition Essential' // Must remain available to the OPPONENT to preserve representative interaction.
    | 'Not Required' // Not expected to play a meaningful role.

/** The four canonical Affordances stabilized so far (Affordance Library, active population). */
export const CANONICAL_AFFORDANCES = [
    'Open Pathway',
    'Support Availability',
    'Interception Opportunity',
    'Functional Object Interaction',
] as const
export type CanonicalAffordance = (typeof CANONICAL_AFFORDANCES)[number]

export type AffordanceTargetRow = Record<CanonicalAffordance, AffordanceTargetRating>

export const AFFORDANCE_TARGET_MATRIX_VERSION = {
    matrixVersion: 'RC1-initial',
    supportedGameProblemVersion: 'RC1',
    supportedAffordanceLibraryVersion: 'RC1 (4 canonical affordances)',
} as const

/** The RC1 matrix, verbatim: canonical Game Problem → expected affordance roles. */
export const AFFORDANCE_TARGET_MATRIX: Record<string, AffordanceTargetRow> = {
    'Progress the Object': {
        'Open Pathway': 'Essential',
        'Support Availability': 'Essential',
        'Interception Opportunity': 'Opposition Essential',
        'Functional Object Interaction': 'Essential',
    },
    'Create Space': {
        'Open Pathway': 'Essential',
        'Support Availability': 'Supportive',
        'Interception Opportunity': 'Contextual',
        'Functional Object Interaction': 'Essential',
    },
    'Exploit Space': {
        'Open Pathway': 'Essential',
        'Support Availability': 'Supportive',
        'Interception Opportunity': 'Contextual',
        'Functional Object Interaction': 'Essential',
    },
    'Protect Space': {
        'Open Pathway': 'Contextual',
        'Support Availability': 'Supportive',
        'Interception Opportunity': 'Essential',
        'Functional Object Interaction': 'Contextual',
    },
    'Regain Possession': {
        'Open Pathway': 'Contextual',
        'Support Availability': 'Supportive',
        'Interception Opportunity': 'Essential',
        'Functional Object Interaction': 'Contextual',
    },
    'Prevent Progress': {
        'Open Pathway': 'Contextual',
        'Support Availability': 'Contextual',
        'Interception Opportunity': 'Essential',
        'Functional Object Interaction': 'Contextual',
    },
    'Maintain Possession': {
        'Open Pathway': 'Essential',
        'Support Availability': 'Essential',
        'Interception Opportunity': 'Opposition Essential',
        'Functional Object Interaction': 'Essential',
    },
}

/**
 * Engine-side mapping from the parser's resolved signal groups to canonical Game Problems.
 * PROVISIONAL and engine-owned (like all selection metadata): only signal groups with a clear
 * canonical home are mapped; unmapped groups are surfaced in the profile's trace rather than
 * guessed. Superseded when Christian's Game Problem Library package lands.
 */
export const SIGNAL_GROUP_TO_GAME_PROBLEM: Record<string, string[]> = {
    'signalGroup:F_possession_passing': ['Maintain Possession'],
    'signalGroup:A_touch_receiving': ['Maintain Possession'],
    'signalGroup:B_pressure': ['Maintain Possession'],
    'signalGroup:C_spacing_support': ['Create Space'],
    'signalGroup:D_break_lines': ['Progress the Object'],
    'signalGroup:F_finishing': ['Progress the Object'],
    'signalGroup:G_overload': ['Create Space', 'Exploit Space'],
    'signalGroup:H_transition': ['Exploit Space'],
    'signalGroup:E_regain_pressing': ['Regain Possession'],
    'signalGroup:I_defensive_press': ['Regain Possession'],
    'signalGroup:I_defensive_protect': ['Protect Space'],
    'signalGroup:I_defensive_recover': ['Protect Space'],
    'signalGroup:I_defensive_delay': ['Prevent Progress'],
    // K_information shapes the perceptual landscape of whatever problem co-fires; no GP of its own.
    // Z_soccer_general is the approved fallback; deliberately unmapped (profile reports it).
}

/** Rating strength for merging multi-Game-Problem profiles (strongest requirement wins). */
const RATING_STRENGTH: Record<AffordanceTargetRating, number> = {
    Essential: 4,
    'Opposition Essential': 3,
    Supportive: 2,
    Contextual: 1,
    'Not Required': 0,
}

export interface ResolvedAffordanceTargetProfile {
    /** Matrix + supported-version stamps (deterministic reasoning requires version pinning). */
    matrixVersion: string
    /** Canonical Game Problems the goal resolved to (via the provisional signal-group mapping). */
    gameProblems: string[]
    /** Resolved signal groups that had no canonical Game Problem mapping (traceability, not guessed). */
    unmappedSignalGroups: string[]
    /** Merged affordance targets: strongest rating across all resolved Game Problems. */
    targets: Partial<Record<CanonicalAffordance, AffordanceTargetRating>>
    /** Per-Game-Problem provenance so the merge is inspectable. */
    perGameProblem: Record<string, AffordanceTargetRow>
    /** RC1: profiles are shadow-mode reasoning products; they do not influence selection. */
    mode: 'shadow'
}

/**
 * Resolve an Affordance Target Profile from the parser's matched signals (RAS Stage 3, shadow mode).
 * Deterministic and side-effect-free: map signal groups → canonical Game Problems, look up matrix
 * rows, merge by strongest rating. Unmapped groups are reported, never guessed (Rule: preserve
 * architecture when uncertain).
 */
export function resolveAffordanceTargetProfile(matchedSignals: string[]): ResolvedAffordanceTargetProfile {
    const signalGroups = matchedSignals.filter((s) => s.startsWith('signalGroup:'))
    const gameProblems: string[] = []
    const unmappedSignalGroups: string[] = []
    for (const sg of signalGroups) {
        const gps = SIGNAL_GROUP_TO_GAME_PROBLEM[sg]
        if (gps) {
            for (const gp of gps) if (!gameProblems.includes(gp)) gameProblems.push(gp)
        } else {
            unmappedSignalGroups.push(sg)
        }
    }

    const targets: Partial<Record<CanonicalAffordance, AffordanceTargetRating>> = {}
    const perGameProblem: Record<string, AffordanceTargetRow> = {}
    for (const gp of gameProblems) {
        const row = AFFORDANCE_TARGET_MATRIX[gp]
        if (!row) continue
        perGameProblem[gp] = row
        for (const aff of CANONICAL_AFFORDANCES) {
            const current = targets[aff]
            if (!current || RATING_STRENGTH[row[aff]] > RATING_STRENGTH[current]) {
                targets[aff] = row[aff]
            }
        }
    }

    return {
        matrixVersion: AFFORDANCE_TARGET_MATRIX_VERSION.matrixVersion,
        gameProblems,
        unmappedSignalGroups,
        targets,
        perGameProblem,
        mode: 'shadow',
    }
}
