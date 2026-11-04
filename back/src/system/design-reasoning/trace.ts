/**
 * **The influence trace and the standing of each conclusion** — Stage 2, review pathway only (Christian's reply to the Stage 2 decision
 * package, received 4 November 2026, D6: *"A rationale must record the knowledge that actually influenced a decision."*; and the
 * authorization: *"Please distinguish what the engine can establish through approved knowledge from what it can demonstrate only through
 * test-only hypotheses."*).
 *
 * Every decision of the stage carries an `InfluenceTrace`, written by the function that makes the decision, from the rows it read:
 *   - `influencedBy`: the rows, rulings or test assumptions whose values decided the outcome (changing one in a test copy moves it);
 *   - `consulted`: read and shown, not decisive (for example compatibility information);
 *   - `citedOnly`: reference knowledge shown for context, which decides nothing (for example a document held outside the application).
 * Each item carries its standing (APPROVED, RULING, CANDIDATE, REFERENCE ONLY, OURS, TEST ASSUMPTION, TEST INPUT).
 *
 * Every conclusion carries `establishedBy`, so the report can separate what approved knowledge establishes from what only a test-only
 * hypothesis shows, and from where the evidence is insufficient. Nothing here is served, coach text or an authorization.
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

/** The three groups the report keeps apart, as his authorization asks. */
export type ConclusionGroup = 'ESTABLISHED THROUGH APPROVED KNOWLEDGE' | 'DEMONSTRATED ONLY UNDER TEST-ONLY HYPOTHESES' | 'INSUFFICIENT EVIDENCE'

export function conclusionGroup(c: Conclusion): ConclusionGroup {
    if (c.establishedBy === 'INSUFFICIENT EVIDENCE') return 'INSUFFICIENT EVIDENCE'
    if (c.testOnly || c.establishedBy === 'TEST-ONLY HYPOTHESIS UNDER TEST ASSUMPTIONS') return 'DEMONSTRATED ONLY UNDER TEST-ONLY HYPOTHESES'
    return 'ESTABLISHED THROUGH APPROVED KNOWLEDGE'
}

export const emptyTrace = (): InfluenceTrace => ({ influencedBy: [], consulted: [], citedOnly: [] })

export const item = (ref: string, standing: Standing, role: string, cite?: Cite): TraceItem => (cite ? { ref, standing, role, cite } : { ref, standing, role })

/** A role code as a word in a sentence (no case-folding of text anywhere in the stage: the static test bans it). */
export const roleWord = (role: string): string => (role === 'PRIMARY' ? 'primary' : role === 'SECONDARY' ? 'secondary' : role)

/** A citation as one readable reference: the file's base name, the table and the row. */
export const citeRef = (c: Cite): string => `${c.file.split('/').pop()} ${c.table} ${c.row}`
