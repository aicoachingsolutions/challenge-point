/**
 * Affordance Target Matrix — Canonical RC1 (ATM package, 2026-07-15; supersedes the provisional
 * "RC1-initial" transcription from the RAS package).
 *
 * A GOVERNED REASONING RESOURCE consumed by Reasoning Engine Stage 3 (Affordance Target Profile
 * Resolution), approved for SHADOW-MODE implementation. Content transcribed verbatim from the
 * package's Game Problem Registry (§8) + Relationship Rationale (§9): 11 canonical Game Problems ×
 * 4 Canonical Affordance Representations. Ratings express REPRESENTATIVE NECESSITY (not weights,
 * probabilities, or priorities). "Opposition Essential" no longer exists — competitive opposition is
 * itself an affordance (CIO). Contextual is reserved for future runtime support and unused in RC1.
 *
 * Runtime interpretation (§10): preserve every Essential; include Supportive when compatible;
 * Contextual inactive; Not Required non-mandatory; record matrix version + profile in the trace.
 * Governance: the matrix evolves only through Christian's canonical process — never edited here.
 */

/** Semantic importance of one Canonical Affordance Representation to one Game Problem (§5). */
export type AffordanceTargetRating = 'Essential' | 'Supportive' | 'Contextual' | 'Not Required'

/** The four RC1 Canonical Affordance Representations (§4). Codes are compact identifiers; full names authoritative. */
export const CANONICAL_AFFORDANCES = [
    'Functional Object Interaction', // FOI — can meaningful interaction with the task object be established?
    'Open Pathway', // OP — is a functional route available for performer or object interaction?
    'Support Availability', // SA — is coordinated interaction with another performer available?
    'Competitive Interaction Opportunity', // CIO — cooperative-oppositional/competitive contexts
] as const
export type CanonicalAffordance = (typeof CANONICAL_AFFORDANCES)[number]

export type AffordanceTargetRow = Record<CanonicalAffordance, AffordanceTargetRating>

/**
 * Canonical ingestion source (workbook release RC1.1): the machine-readable workbook committed
 * verbatim at back/data/knowledge-core/Affordance_Target_Matrix_RC1_1_Machine_Readable.xlsx,
 * projected completely into atm-workbook.rc1.1.json (generated — never hand-edit). Semantic matrix
 * version remains RC1; the workbook replaces prose-derived transcription for all future updates.
 */
import atmWorkbook from './atm-workbook.rc1.1.json'

interface AtmRatingRow {
    game_problem_id: string
    canonical_name: string
    FOI: string
    OP: string
    SA: string
    CIO: string
    row_status: string
    matrix_version: string
}

const ATM_METADATA = (atmWorkbook as { metadata: Record<string, string | number | boolean> }).metadata
const ATM_RATINGS = (atmWorkbook as { ratings: AtmRatingRow[] }).ratings

const RATING_CODE: Record<string, AffordanceTargetRating> = {
    E: 'Essential',
    S: 'Supportive',
    C: 'Contextual',
    NR: 'Not Required',
}

export const AFFORDANCE_TARGET_MATRIX_VERSION = {
    resourceId: String(ATM_METADATA['resource_id'] ?? 'ATM-RR-RC1'),
    matrixVersion: `${String(ATM_METADATA['matrix_semantic_version'] ?? 'RC1')} (workbook ${String(ATM_METADATA['workbook_release_version'] ?? 'RC1.1')})`,
    resourceStatus: String(ATM_METADATA['resource_status'] ?? ''),
    supersedes: 'RC1-initial (RAS package illustration); prose-derived RC1-canonical transcription',
} as const

function buildMatrixFromWorkbook(): Record<string, AffordanceTargetRow> {
    // Load-time integrity gate against the workbook's OWN declared expectations (defined failure,
    // never silent): row/cell counts, allowed codes, and the RC1 contextual_cells_used=0 invariant.
    const expectedRows = Number(ATM_METADATA['expected_matrix_rows'] ?? 11)
    if (ATM_RATINGS.length !== expectedRows) {
        throw new Error(`ATM workbook: expected ${expectedRows} rating rows, loaded ${ATM_RATINGS.length}.`)
    }
    const matrix: Record<string, AffordanceTargetRow> = {}
    let contextualCells = 0
    for (const r of ATM_RATINGS) {
        const codes = [r.FOI, r.OP, r.SA, r.CIO]
        for (const c of codes) {
            if (!RATING_CODE[c]) throw new Error(`ATM workbook: unknown rating code "${c}" on ${r.game_problem_id}.`)
            if (c === 'C') contextualCells++
        }
        matrix[r.canonical_name] = {
            'Functional Object Interaction': RATING_CODE[r.FOI],
            'Open Pathway': RATING_CODE[r.OP],
            'Support Availability': RATING_CODE[r.SA],
            'Competitive Interaction Opportunity': RATING_CODE[r.CIO],
        }
    }
    const expectedContextual = Number(ATM_METADATA['contextual_cells_used'] ?? 0)
    if (contextualCells !== expectedContextual) {
        throw new Error(`ATM workbook: contextual_cells_used must be ${expectedContextual}, found ${contextualCells}.`)
    }
    return matrix
}

/** Canonical Game Problem → opportunity-commitment profile, loaded from the RC1.1 workbook. */
export const AFFORDANCE_TARGET_MATRIX: Record<string, AffordanceTargetRow> = buildMatrixFromWorkbook()

/**
 * Engine-side mapping from the parser's resolved signal groups to canonical Game Problems.
 * PROVISIONAL and engine-owned; unmapped groups are surfaced in the profile, never guessed.
 * Parser lists the most category-specific signal first, so the FIRST mapped Game Problem serves as
 * the primary (§10 expects one canonical Game Problem per decision; the merged view is kept for
 * multi-signal goals with full provenance — flagged to Christian as a coupling question).
 */
export const SIGNAL_GROUP_TO_GAME_PROBLEM: Record<string, string[]> = {
    'signalGroup:F_possession_passing': ['Maintain Possession'],
    'signalGroup:A_touch_receiving': ['Maintain Possession'],
    'signalGroup:B_pressure': ['Maintain Possession'],
    'signalGroup:C_spacing_support': ['Create Space'],
    'signalGroup:D_break_lines': ['Progress the Object'],
    'signalGroup:F_finishing': ['Finish Attack'],
    'signalGroup:G_overload': ['Create Numerical Advantage'],
    'signalGroup:H_transition': ['Transition Attack'],
    'signalGroup:E_regain_pressing': ['Regain Possession'],
    'signalGroup:I_defensive_press': ['Regain Possession'],
    'signalGroup:I_defensive_protect': ['Protect Space'],
    'signalGroup:I_defensive_recover': ['Recover Organization'],
    'signalGroup:I_defensive_delay': ['Delay Progression'],
    // K_information shapes the perceptual landscape of whatever problem co-fires; no GP of its own.
    // Z_soccer_general is the approved fallback; deliberately unmapped (profile reports it).
}

/** Rating strength for merging multi-Game-Problem profiles (strongest necessity wins). */
const RATING_STRENGTH: Record<AffordanceTargetRating, number> = {
    Essential: 3,
    Supportive: 2,
    Contextual: 1,
    'Not Required': 0,
}

export interface ResolvedAffordanceTargetProfile {
    matrixVersion: string
    /** First mapped Game Problem (parser order = most specific first) per §10's one-problem model. */
    primaryGameProblem: string | null
    /** All canonical Game Problems the goal resolved to (multi-signal goals). */
    gameProblems: string[]
    /** Resolved signal groups with no canonical Game Problem mapping (reported, never guessed). */
    unmappedSignalGroups: string[]
    /** Merged opportunity commitments: strongest necessity across resolved Game Problems. */
    targets: Partial<Record<CanonicalAffordance, AffordanceTargetRating>>
    /** Per-Game-Problem provenance so the merge is inspectable. */
    perGameProblem: Record<string, AffordanceTargetRow>
    /** RC1: shadow-mode reasoning product; does not influence selection. */
    mode: 'shadow'
}

/**
 * Resolve an Affordance Target Profile from the parser's matched signals (RAS Stage 3, shadow mode).
 * Deterministic and side-effect-free.
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
        const matrixRow = AFFORDANCE_TARGET_MATRIX[gp]
        if (!matrixRow) continue
        perGameProblem[gp] = matrixRow
        for (const aff of CANONICAL_AFFORDANCES) {
            const current = targets[aff]
            if (!current || RATING_STRENGTH[matrixRow[aff]] > RATING_STRENGTH[current]) {
                targets[aff] = matrixRow[aff]
            }
        }
    }

    return {
        matrixVersion: AFFORDANCE_TARGET_MATRIX_VERSION.matrixVersion,
        primaryGameProblem: gameProblems[0] ?? null,
        gameProblems,
        unmappedSignalGroups,
        targets,
        perGameProblem,
        mode: 'shadow',
    }
}
