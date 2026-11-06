/**
 * **The influence trace and the standing of each conclusion** — Stage 2, review pathway only (Christian's reply to the Stage 2 decision
 * package, received 4 November 2026, D6: *"A rationale must record the knowledge that actually influenced a decision."*; and the
 * authorization: *"Please distinguish what the engine can establish through approved knowledge from what it can demonstrate only through
 * test-only hypotheses."*).
 *
 * Every decision of the stage carries an `InfluenceTrace`, written by the function that makes the decision, from the rows it read:
 *   - `influencedBy`: the rows, rulings, entries or test assumptions whose values decided the outcome, or the rule that gave it (changing
 *     one, within valid test inputs, in a test copy moves the outcome or that rule; a unit test pins this for the gate inputs);
 *   - `consulted`: read and shown, not decisive (for example compatibility information);
 *   - `citedOnly`: reference knowledge shown for context, which decides nothing (for example a document held outside the application).
 * Each item carries its standing (APPROVED, RULING, CANDIDATE, REFERENCE ONLY, OURS, TEST ASSUMPTION, TEST INPUT).
 *
 * Every conclusion carries `establishedBy`. The report groups conclusions by `establishedBy` and by the WEAKEST standing among the items
 * that decided them, so approved knowledge is never shown beside a ruling of his, candidate data, an inference of ours or a test input:
 * a conclusion is grouped as established through approved knowledge only where it is established by approved knowledge and every item
 * that decided it is APPROVED. Nothing here is served, coach text or an authorization.
 */
import { Cite, Standing } from './knowledge'

export type EstablishedBy = 'APPROVED KNOWLEDGE' | 'RULING' | 'LOGICAL INFERENCE' | 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS' | 'INSUFFICIENT EVIDENCE'

export interface TraceItem {
    /** What was read: a row, a ruling, an entry, a test assumption. */
    ref: string
    standing: Standing
    /** What it contributed, in a few words. */
    role: string
    cite?: Cite
}

export interface InfluenceTrace {
    influencedBy: TraceItem[]
    consulted: TraceItem[]
    citedOnly: TraceItem[]
}

export interface Conclusion {
    id: string
    step: string
    statement: string
    establishedBy: EstablishedBy
    /** True where the conclusion rests on a test input, a test assumption or a precondition D6 allows only in isolated tests. */
    testOnly: boolean
    trace: InfluenceTrace
}

/**
 * Standings from strongest to weakest, as the report ranks what decided a conclusion. REFERENCE ONLY never decides anything. The assembly
 * experiment's two standings (ILLUSTRATIVE, UNRESOLVED) are appended after TEST INPUT, so every earlier standing keeps its rank and Stage 2's
 * output is unchanged. His six classes are not this order: they live with the assembly experiment, which ranks them in his own order.
 */
export const STANDING_ORDER = ['APPROVED', 'RULING', 'PROVISIONAL', 'CANDIDATE', 'OURS', 'REFERENCE ONLY', 'TEST ASSUMPTION', 'TEST INPUT', 'ILLUSTRATIVE', 'UNRESOLVED'] as const

/** Compile-time exhaustiveness: a standing missing from the order is a type error here, never a silent rank. */
type UnrankedStanding = Exclude<Standing, (typeof STANDING_ORDER)[number]>
const EVERY_STANDING_RANKED: [UnrankedStanding] extends [never] ? true : never = true

/** Each standing's rank (0 strongest), built from the order; an exhaustive record over the type. */
export const STANDING_RANK: Record<Standing, number> = EVERY_STANDING_RANKED && (Object.fromEntries(STANDING_ORDER.map((s, i) => [s, i])) as Record<Standing, number>)

/** A standing's rank; a value outside the type (a typo read from a data file) throws rather than ranking as strongest or weakest. */
export function standingRank(standing: string): number {
    const rank = (STANDING_RANK as Record<string, number>)[standing]
    if (typeof rank !== 'number') throw new Error(`unknown standing "${standing}"`)
    return rank
}

/** The weakest standing among the items that decided a conclusion; null when nothing is recorded as deciding it. */
export function weakestStanding(t: InfluenceTrace): Standing | null {
    let weakest: Standing | null = null
    for (const i of t.influencedBy) {
        const rank = standingRank(i.standing)
        if (weakest === null || rank > standingRank(weakest)) weakest = i.standing
    }
    return weakest
}

/** The groups the report keeps apart, as his authorization asks, in the order the report prints them. */
export const CONCLUSION_GROUPS = [
    'ESTABLISHED THROUGH APPROVED KNOWLEDGE',
    'ESTABLISHED BY HIS RULINGS',
    'RESTS ON CANDIDATE DATA',
    'RESTS ON OUR INFERENCE (NO TEST INPUT)',
    'STRUCTURAL FINDINGS ON TEST INPUTS',
    'DEMONSTRATED ONLY UNDER TEST-ONLY HYPOTHESES',
    'INSUFFICIENT EVIDENCE',
] as const
export type ConclusionGroup = (typeof CONCLUSION_GROUPS)[number]

/** What each group holds, printed under its heading. */
export const CONCLUSION_GROUP_NOTES: Record<ConclusionGroup, string> = {
    'ESTABLISHED THROUGH APPROVED KNOWLEDGE': 'Established by approved knowledge, and every row that decided it is APPROVED.',
    'ESTABLISHED BY HIS RULINGS': 'Decided by a ruling of his, with approved knowledge; no candidate data, no entry or identification of ours, no test input. Each ruling keeps its own scope; D1 is approved for the isolated review pathway only, not as a canonical amendment.',
    'RESTS ON CANDIDATE DATA': 'Among what decided it is CANDIDATE data: the sport module\'s Game Form declarations (module DRAFT), read under his D3 as compatibility information. Not approved knowledge.',
    'RESTS ON OUR INFERENCE (NO TEST INPUT)': 'A logical inference of ours, or a conclusion that rests on an entry, identification or mapping of ours (OURS), with no test input. Not approved knowledge, and not his ruling.',
    'STRUCTURAL FINDINGS ON TEST INPUTS': 'Structural findings that read a test input (team sizes, areas): not hypotheses, and not evidence of ecological relevance.',
    'DEMONSTRATED ONLY UNDER TEST-ONLY HYPOTHESES': 'Results of the paired width comparison under test assumptions: not empirically established, not eligible for production.',
    'INSUFFICIENT EVIDENCE': 'Where a condition cannot be evaluated, or nothing approved decides.',
}

/**
 * The group a Stage 2 conclusion is printed under. Fail closed for the assembly experiment's standings: an ILLUSTRATIVE or UNRESOLVED item
 * anywhere among what decided a conclusion throws (Stage 2 never meets one; the assembly prints his six classes instead), and the last group
 * is reached only by a positive match on RULING or APPROVED, never by falling through.
 */
export function conclusionGroup(c: Conclusion): ConclusionGroup {
    for (const i of c.trace.influencedBy) {
        if (i.standing === 'ILLUSTRATIVE' || i.standing === 'UNRESOLVED') throw new Error(`conclusion "${c.id}" rests on a ${i.standing} item (${i.ref}); the Stage 2 groups do not hold it`)
    }
    if (c.establishedBy === 'INSUFFICIENT EVIDENCE') return 'INSUFFICIENT EVIDENCE'
    if (c.establishedBy === 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS') return 'DEMONSTRATED ONLY UNDER TEST-ONLY HYPOTHESES'
    const weakest = weakestStanding(c.trace)
    if (c.testOnly || weakest === 'TEST ASSUMPTION' || weakest === 'TEST INPUT') return 'STRUCTURAL FINDINGS ON TEST INPUTS'
    if (weakest === null || weakest === 'OURS' || weakest === 'REFERENCE ONLY' || c.establishedBy === 'LOGICAL INFERENCE') return 'RESTS ON OUR INFERENCE (NO TEST INPUT)'
    if (weakest === 'CANDIDATE' || weakest === 'PROVISIONAL') return 'RESTS ON CANDIDATE DATA'
    if (c.establishedBy === 'APPROVED KNOWLEDGE' && weakest === 'APPROVED') return 'ESTABLISHED THROUGH APPROVED KNOWLEDGE'
    if (weakest === 'RULING' || weakest === 'APPROVED') return 'ESTABLISHED BY HIS RULINGS'
    throw new Error(`conclusion "${c.id}": no group holds its weakest decisive standing ${weakest}`)
}

export const emptyTrace = (): InfluenceTrace => ({ influencedBy: [], consulted: [], citedOnly: [] })

export const item = (ref: string, standing: Standing, role: string, cite?: Cite): TraceItem => (cite ? { ref, standing, role, cite } : { ref, standing, role })

/** Items with the same ref and role listed once, in the order first seen. */
export function uniqueItems(items: TraceItem[]): TraceItem[] {
    const seen = new Set<string>()
    return items.filter((i) => {
        const key = JSON.stringify([i.ref, i.role])
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/** A role code as a word in a sentence (no case-folding of text anywhere in the stage: the static test bans it). */
export const roleWord = (role: string): string => (role === 'PRIMARY' ? 'primary' : role === 'SECONDARY' ? 'secondary' : role)

/** A citation as one readable reference: the file's base name, the table and the row. */
export const citeRef = (c: Cite): string => `${c.file.split('/').pop()} ${c.table} ${c.row}`
