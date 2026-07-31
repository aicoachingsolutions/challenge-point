/**
 * Runtime Interface Specification RC1.2 — shared runtime enumerations, as code.
 *
 * This module is the implementation of the platform's constitutional runtime contract, NOT a
 * knowledge library. It deliberately lives outside `knowledge-core/` (which holds Christian's
 * canonical *knowledge* workbooks) because the Runtime Interface Specification governs something
 * different: what may cross a subsystem boundary, in what form.
 *
 * TWO RULES FROM THE SPEC THAT SHAPE THIS FILE:
 *
 *   §50 Semantic Stability — "Stored enumeration values must retain stable meaning. Display labels
 *   may change through Coach Communication Standards, but stored values and contract semantics may
 *   not drift silently." So every entry here is a pair: an immutable `code` that goes in the
 *   database forever, and a `label` that the coach sees and which we may freely reword.
 *
 *   §52 Failure Behavior — an invalid runtime object must be rejected with the failed field named,
 *   never coerced. Hence `parseObservationCode` / `parseSessionStage` return null rather than
 *   guessing, and the route turns that into a 400 naming the field.
 *
 * SCOPE: Pilot 1 (§42 Post-Use Observation Flow) — the coach records observations *after* using an
 * activity. No live recommendation, no Experience Intelligence invocation, no Observation Bundle.
 * Those are Pilot 2 (§55) and are deliberately not built here.
 */

/**
 * §6 — every exchanged runtime object carries the interface version it was created under, so a
 * stored event stays interpretable after the contract moves on.
 */
export const RUNTIME_INTERFACE_VERSION = 'RC1.2'

/** §12 Observation Codes. Eight experiential, plus one representative. */
export const OBSERVATION_CODES = [
    'CHALLENGE_TOO_LOW',
    'CHALLENGE_TOO_HIGH',
    'PLAYERS_WAITING',
    'PARTICIPATION_DECLINING',
    'PLAYERS_CONFUSED',
    'ACTIVITY_PREDICTABLE',
    'VARIED_SOLUTIONS_EMERGING',
    'ONE_TEAM_DOMINATING',
    'INTENDED_PROBLEM_NOT_EMERGING',
] as const

export type ObservationCode = (typeof OBSERVATION_CODES)[number]

/**
 * Coach-facing wording. These are LABELS, not values — §50 lets us reword them freely as the Coach
 * Communication Standard evolves, and stored codes are unaffected.
 *
 * Phrasing follows the Coach Vocabulary & Translation Dictionary: plain, non-judgemental, and about
 * what the coach *saw* rather than what it means. An observation is evidence, not an interpretation
 * (Runtime Interface §5), so none of these should read as a diagnosis.
 */
export const OBSERVATION_LABELS: Readonly<Record<ObservationCode, string>> = {
    CHALLENGE_TOO_LOW: 'Too easy for them',
    CHALLENGE_TOO_HIGH: 'Too hard for them',
    PLAYERS_WAITING: 'Players standing around',
    PARTICIPATION_DECLINING: 'They dropped off as it went on',
    PLAYERS_CONFUSED: 'They were unsure what to do',
    ACTIVITY_PREDICTABLE: 'It got predictable',
    VARIED_SOLUTIONS_EMERGING: 'They found different ways to solve it',
    ONE_TEAM_DOMINATING: 'One team ran away with it',
    INTENDED_PROBLEM_NOT_EMERGING: "The problem I picked it for didn't really come up",
}

/**
 * §12 groups the codes for presentation. `VARIED_SOLUTIONS_EMERGING` is the only positive signal and
 * `INTENDED_PROBLEM_NOT_EMERGING` is the only representative one — both are worth separating so a
 * coach does not read the list as "pick what went wrong".
 */
export const OBSERVATION_GROUPS: ReadonlyArray<{ heading: string; codes: readonly ObservationCode[] }> = [
    { heading: 'Challenge', codes: ['CHALLENGE_TOO_LOW', 'CHALLENGE_TOO_HIGH'] },
    { heading: 'Involvement', codes: ['PLAYERS_WAITING', 'PARTICIPATION_DECLINING', 'ONE_TEAM_DOMINATING'] },
    { heading: 'How it played', codes: ['PLAYERS_CONFUSED', 'ACTIVITY_PREDICTABLE', 'VARIED_SOLUTIONS_EMERGING'] },
    { heading: 'The learning problem', codes: ['INTENDED_PROBLEM_NOT_EMERGING'] },
]

/** §13 Session Stage Values. */
export const SESSION_STAGES = ['JUST_STARTED', 'SETTLING_IN', 'ESTABLISHED'] as const
export type SessionStage = (typeof SESSION_STAGES)[number]

export const SESSION_STAGE_LABELS: Readonly<Record<SessionStage, string>> = {
    JUST_STARTED: 'Just started',
    SETTLING_IN: 'Settling in',
    ESTABLISHED: 'Well into it',
}

/**
 * §25 `captureMethod`. The spec describes this as "post-use, live control, or other approved method"
 * without publishing a canonical set — one of the four Pilot 1 value gaps flagged to Christian.
 * PROVISIONAL: Pilot 1 only ever produces POST_USE, so we store exactly that and will adopt the
 * canonical set when published rather than inventing more values now.
 */
export const CAPTURE_METHODS = ['POST_USE'] as const
export type CaptureMethod = (typeof CAPTURE_METHODS)[number]

const OBSERVATION_CODE_SET: ReadonlySet<string> = new Set(OBSERVATION_CODES)
const SESSION_STAGE_SET: ReadonlySet<string> = new Set(SESSION_STAGES)

/**
 * Parse an incoming observation code. Returns null for anything not canonical — §52 forbids
 * coercing domain meaning, and §12 forbids local synonyms becoming stored values, so an unknown
 * string is a contract failure rather than something to normalize.
 */
export function parseObservationCode(value: unknown): ObservationCode | null {
    return typeof value === 'string' && OBSERVATION_CODE_SET.has(value) ? (value as ObservationCode) : null
}

export function parseSessionStage(value: unknown): SessionStage | null {
    return typeof value === 'string' && SESSION_STAGE_SET.has(value) ? (value as SessionStage) : null
}

/** Coach-facing note length. §25 calls it a "bounded" free-text note; this is that bound. */
export const COACH_NOTE_MAX_LENGTH = 2000
