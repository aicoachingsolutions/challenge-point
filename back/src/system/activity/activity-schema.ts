/**
 * System-owned activity shape for AI assembly output.
 * AI may phrase content; it may not omit fields or alter this structure.
 */

export interface ActivityValidationBlock {
    hasOpposition: boolean
    hasDecisionMaking: boolean
    hasConsequence: boolean
    avoidsPrescriptiveActions: boolean
}

export interface Activity {
    title: string
    setup: string
    teams: string
    objective: string
    rules: string[]
    scoring: string
    constraints: string[]
    coachingFocus: string[]
    validation: ActivityValidationBlock
}
