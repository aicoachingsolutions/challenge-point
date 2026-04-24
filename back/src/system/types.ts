import { IActivity } from '../models/activity.model'
import { IAffordance } from '../models/affordance.model'
import { IConstraint } from '../models/constraint.model'
import { ISession } from '../models/session.model'

export type ConstraintRole = 'foundation' | 'shaping' | 'consequence'
export type DecisionFreedomDimension = 'who' | 'what' | 'where' | 'when' | 'why' | 'how'

export type ActivityAssemblyRequest = {
    challengeLevel: string
    duration: number
    learningGoals: string[]
}

export type ArchetypeDefinition = {
    id: string
    name: string
    description: string
    aliases: string[]
    supportedPrimaryAffordanceKeywords: string[]
    supportedSecondaryAffordanceKeywords?: string[]
    assemblyCues: string[]
    consequenceCues: string[]
}

export type AffordanceFieldBand = 'primary' | 'supporting' | 'viable'

export type AffordanceFieldCandidate = {
    affordance: IAffordance
    score: number
    band: AffordanceFieldBand
}

export type AffordanceField = {
    primary: IAffordance
    supporting: IAffordance[]
    viableCandidates: IAffordance[]
    ranked: AffordanceFieldCandidate[]
}

export type ArchetypeSelectionBand = 'top' | 'candidate'

export type ArchetypeSelectionCandidate = {
    archetype: ArchetypeDefinition
    score: number
    reasons: string[]
    band: ArchetypeSelectionBand
}

export type ArchetypeSelection = {
    selected: ArchetypeDefinition
    candidates: ArchetypeSelectionCandidate[]
    selectionKey: string
    selectedReason: string
}

export type ConstraintSelectionCandidate = {
    constraint: IConstraint
    role: ConstraintRole
    score: number
    reasons: string[]
}

export type InteractionExchangeValidationSignals = {
    cue: string[]
    reward: string[]
    risk: string[]
    opponent: string[]
    continuation: string[]
}

export type InteractionExchange = {
    sourceRole: ConstraintRole | 'package'
    sourceConstraintId?: string
    visibleOpportunityCue: string
    decisionProblem: string
    rewardAdvantage: string
    misreadOrForceRisk: string
    opponentAdvantage: string
    liveContinuation: string
    canonicalRule: string
    validationSignals: InteractionExchangeValidationSignals
}

export type AssemblyGuardrail = {
    summary: string
    signals: string[]
}

export type DecisionProblemGuardrail = AssemblyGuardrail & {
    preservedDecisions: DecisionFreedomDimension[]
}

export type ActivityAssemblyGuardrails = {
    visibleCue: AssemblyGuardrail
    decisionProblem: DecisionProblemGuardrail
    interactionExchange: InteractionExchange
    opponentConsequence: AssemblyGuardrail
    nonNegotiableAvoids: string[]
    avoidSignals: string[]
}

export type SelectedConstraintPackage = {
    foundation: ConstraintSelectionCandidate
    shaping: ConstraintSelectionCandidate
    consequence?: ConstraintSelectionCandidate
    assemblyGuardrails: ActivityAssemblyGuardrails
    validationWarnings?: string[]
}

export type SystemAssemblyInput = {
    session: ISession
    previousActivities: IActivity[]
    coachInput: ActivityAssemblyRequest
    affordances: AffordanceField
    archetype: ArchetypeDefinition
    archetypeSelection: ArchetypeSelection
    constraintPackage: SelectedConstraintPackage
}

export class SystemPipelineError extends Error {
    stage: string
    details?: string[]

    constructor(stage: string, message: string, details?: string[]) {
        super(message)
        this.name = 'SystemPipelineError'
        this.stage = stage
        this.details = details
    }
}
