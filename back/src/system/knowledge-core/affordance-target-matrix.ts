/**
 * Canonical Affordance Requirements (CAR) Matrix — RC1.2 (2026-07-17; Canonical Register Alignment).
 *
 * A GOVERNED REASONING RESOURCE consumed by Reasoning Engine Stage 3 (Affordance Target Profile
 * Resolution). RC1.2 reconciles the legacy ATM to the finalized Game Problem Canonical Register:
 * keyed by permanent GP-ID (GP-001..GP-017), 68 cells, with evidence/confidence/provenance per row.
 * Christian's key implementation note: the CAR Matrix is a COMPATIBILITY resource, NOT a selector —
 * it describes foundational affordance requirements per canonical Game Problem but does not
 * distinguish Game Problems on its own. Semantic routing + canonical GP identity + the Composite
 * Runtime remain the primary reasoning drivers.
 *
 * Canonical ingestion source: the workbook committed verbatim at
 * back/data/knowledge-core/Affordance_Target_Matrix_RC1_2_Canonical.xlsx, projected completely into
 * atm-workbook.rc1.2.json (generated — never hand-edit). Ratings express representative NECESSITY
 * (E Essential / S Supportive / NR Not Required; Contextual retired, unused). Runtime (§10): preserve
 * every Essential; include Supportive when compatible; record matrix version + profile in the trace.
 * Shadow mode: profiles resolve for inspection and do NOT influence selection.
 */
import atmWorkbook from './atm-workbook.rc1.2.json'

/** Semantic importance of one Canonical Affordance Representation to one Game Problem. */
export type AffordanceTargetRating = 'Essential' | 'Supportive' | 'Contextual' | 'Not Required'

/** The four RC1 Canonical Affordance Representations. Codes compact; full names authoritative. */
export const CANONICAL_AFFORDANCES = [
    'Functional Object Interaction', // FOI
    'Open Pathway', // OP
    'Support Availability', // SA
    'Competitive Interaction Opportunity', // CIO — representative competitive opposition (RC1.2 scope clarified)
] as const
export type CanonicalAffordance = (typeof CANONICAL_AFFORDANCES)[number]

export type AffordanceTargetRow = Record<CanonicalAffordance, AffordanceTargetRating>

interface AtmRatingRow {
    game_problem_id: string
    canonical_name: string
    FOI: string
    OP: string
    SA: string
    CIO: string
    row_status?: string
    evidence_type?: string
    evidence_source?: string
    confidence?: string
}
interface AtmRegistryRow {
    game_problem_id: string
    canonical_name: string
    canonical_definition?: string
    relationship_domain?: string
}
interface AtmWorkbook {
    metadata: Record<string, string | number | boolean>
    gameProblemRegistry: AtmRegistryRow[]
    ratings: AtmRatingRow[]
}

const WB = atmWorkbook as unknown as AtmWorkbook
const ATM_METADATA = WB.metadata

const RATING_CODE: Record<string, AffordanceTargetRating> = {
    E: 'Essential',
    S: 'Supportive',
    C: 'Contextual',
    NR: 'Not Required',
}

export const AFFORDANCE_TARGET_MATRIX_VERSION = {
    resourceId: String(ATM_METADATA['resource_id'] ?? 'ATM-RR-RC1'),
    matrixVersion: `${String(ATM_METADATA['matrix_semantic_version'] ?? 'RC1.2')} (workbook ${String(ATM_METADATA['workbook_release_version'] ?? 'RC1.2')})`,
    resourceStatus: String(ATM_METADATA['resource_status'] ?? ''),
    compatibleGameProblemRegister: String(ATM_METADATA['compatible_game_problem_register'] ?? ''),
    supersedes: 'RC1.1 (legacy 11-name registry)',
} as const

/** Canonical Game Problem name → opportunity-commitment profile, loaded/validated from the workbook. */
export const AFFORDANCE_TARGET_MATRIX: Record<string, AffordanceTargetRow> = buildMatrixFromWorkbook()
/** GP-ID → profile (the canonical key; names are the human-readable secondary index). */
export const AFFORDANCE_TARGET_MATRIX_BY_ID: Record<string, AffordanceTargetRow> = buildMatrixById()

function buildMatrixFromWorkbook(): Record<string, AffordanceTargetRow> {
    const expectedRows = Number(ATM_METADATA['expected_matrix_rows'] ?? 17)
    if (WB.ratings.length !== expectedRows) {
        throw new Error(`CAR matrix: expected ${expectedRows} rating rows, loaded ${WB.ratings.length}.`)
    }
    const matrix: Record<string, AffordanceTargetRow> = {}
    let contextual = 0
    for (const r of WB.ratings) {
        for (const c of [r.FOI, r.OP, r.SA, r.CIO]) {
            if (!RATING_CODE[c]) throw new Error(`CAR matrix: unknown rating code "${c}" on ${r.game_problem_id}.`)
            if (c === 'C') contextual++
        }
        matrix[r.canonical_name] = toRow(r)
    }
    const expectedContextual = Number(ATM_METADATA['contextual_cells_used'] ?? 0)
    if (contextual !== expectedContextual) {
        throw new Error(`CAR matrix: contextual_cells_used must be ${expectedContextual}, found ${contextual}.`)
    }
    return matrix
}

function buildMatrixById(): Record<string, AffordanceTargetRow> {
    const byId: Record<string, AffordanceTargetRow> = {}
    for (const r of WB.ratings) byId[r.game_problem_id] = toRow(r)
    return byId
}

function toRow(r: AtmRatingRow): AffordanceTargetRow {
    return {
        'Functional Object Interaction': RATING_CODE[r.FOI],
        'Open Pathway': RATING_CODE[r.OP],
        'Support Availability': RATING_CODE[r.SA],
        'Competitive Interaction Opportunity': RATING_CODE[r.CIO],
    }
}

/**
 * Engine-side mapping from the parser's resolved signal groups to CANONICAL Game Problem IDs
 * (GP-001..GP-017, matching the register the CAR matrix is now keyed to). PROVISIONAL and
 * engine-owned; unmapped groups are surfaced in the profile, never guessed. Parser lists the most
 * category-specific signal first, so the FIRST mapped GP is the Composite Runtime's Primary; a
 * co-firing group may supply a Secondary (RC1: Primary + zero-or-one Secondary).
 */
export const SIGNAL_GROUP_TO_GAME_PROBLEM: Record<string, string[]> = {
    'signalGroup:F_possession_passing': ['GP-015'], // Maintain Possession
    'signalGroup:A_touch_receiving': ['GP-015'],
    'signalGroup:B_pressure': ['GP-015'],
    'signalGroup:C_spacing_support': ['GP-001'], // Create Space
    'signalGroup:D_break_lines': ['GP-002'], // Exploit Space (progress through/between lines)
    'signalGroup:F_finishing': ['GP-006'], // Establish Functional Object Control (finish)
    'signalGroup:G_overload': ['GP-005'], // Gain Access (numerical access at point of interaction)
    'signalGroup:H_transition': ['GP-002'], // Exploit Space (transition attack)
    'signalGroup:E_regain_pressing': ['GP-016'], // Regain Possession
    'signalGroup:I_defensive_press': ['GP-017'], // Force Turnover
    'signalGroup:I_defensive_protect': ['GP-012'], // Protect Space
    'signalGroup:I_defensive_recover': ['GP-004'], // Recover Position
    'signalGroup:I_defensive_delay': ['GP-013'], // Deny Space (delay/slow progression)
    // K_information shapes the perceptual landscape of whatever problem co-fires; no GP of its own.
    // Z_soccer_general is the approved fallback; deliberately unmapped (profile reports it).
}

const RATING_STRENGTH: Record<AffordanceTargetRating, number> = {
    Essential: 3,
    Supportive: 2,
    Contextual: 1,
    'Not Required': 0,
}

export interface ResolvedAffordanceTargetProfile {
    matrixVersion: string
    /** Primary Game Problem GP-ID (Composite Runtime: exactly one), or null when unresolved. */
    primaryGameProblemId: string | null
    primaryGameProblem: string | null
    /** Secondary GP-ID if a second signal group co-fired (RC1: zero or one). */
    secondaryGameProblemId: string | null
    secondaryGameProblem: string | null
    /** All canonical GP-IDs the goal resolved to (before Primary/Secondary truncation). */
    gameProblemIds: string[]
    /** Resolved signal groups with no canonical GP mapping (reported, never guessed). */
    unmappedSignalGroups: string[]
    /** Merged opportunity commitments (Primary + Secondary): strongest necessity wins. */
    targets: Partial<Record<CanonicalAffordance, AffordanceTargetRating>>
    /** Per-GP provenance so the merge is inspectable. */
    perGameProblem: Record<string, AffordanceTargetRow>
    mode: 'shadow'
}

const ID_TO_NAME: Record<string, string> = Object.fromEntries(WB.ratings.map((r) => [r.game_problem_id, r.canonical_name]))

/**
 * Resolve an Affordance Target Profile from the parser's matched signals (RAS Stage 3, shadow mode).
 * Composite Runtime model: Primary = first mapped GP, Secondary = second (RC1 caps at one); merge
 * their CAR rows by strongest necessity, retaining provenance. Deterministic, side-effect-free.
 */
export function resolveAffordanceTargetProfile(matchedSignals: string[]): ResolvedAffordanceTargetProfile {
    const signalGroups = matchedSignals.filter((s) => s.startsWith('signalGroup:'))
    const gameProblemIds: string[] = []
    const unmappedSignalGroups: string[] = []
    for (const sg of signalGroups) {
        const gps = SIGNAL_GROUP_TO_GAME_PROBLEM[sg]
        if (gps) {
            for (const gp of gps) if (!gameProblemIds.includes(gp)) gameProblemIds.push(gp)
        } else {
            unmappedSignalGroups.push(sg)
        }
    }

    // Composite Runtime RC1: one Primary + zero-or-one Secondary.
    const primaryId = gameProblemIds[0] ?? null
    const secondaryId = gameProblemIds[1] ?? null

    const targets: Partial<Record<CanonicalAffordance, AffordanceTargetRating>> = {}
    const perGameProblem: Record<string, AffordanceTargetRow> = {}
    for (const gpId of [primaryId, secondaryId]) {
        if (!gpId) continue
        const matrixRow = AFFORDANCE_TARGET_MATRIX_BY_ID[gpId]
        if (!matrixRow) continue
        perGameProblem[gpId] = matrixRow
        for (const aff of CANONICAL_AFFORDANCES) {
            const current = targets[aff]
            if (!current || RATING_STRENGTH[matrixRow[aff]] > RATING_STRENGTH[current]) {
                targets[aff] = matrixRow[aff]
            }
        }
    }

    return {
        matrixVersion: AFFORDANCE_TARGET_MATRIX_VERSION.matrixVersion,
        primaryGameProblemId: primaryId,
        primaryGameProblem: primaryId ? (ID_TO_NAME[primaryId] ?? null) : null,
        secondaryGameProblemId: secondaryId,
        secondaryGameProblem: secondaryId ? (ID_TO_NAME[secondaryId] ?? null) : null,
        gameProblemIds,
        unmappedSignalGroups,
        targets,
        perGameProblem,
        mode: 'shadow',
    }
}
