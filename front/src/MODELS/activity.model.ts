import type { IAffordance } from './affordance.model'
import type { ICategory } from './category.model'
import type { IConstraint } from './constraint.model'
import type { ISession } from './session.model'

export enum EngagementLevels {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
}

export enum DifficultyLevels {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
}

export enum ChallengeLevels {
    'Low-Pressure Learning' = 'low',
    'Growth Zone' = 'medium',
    'High Pressure Challenge' = 'high',
}

export enum ActivityStatus {
    'Ready to Start' = 'readyToStart',
    'In Progress' = 'inProgress',
    Review = 'review',
    Completed = 'completed',
}

export interface ILearningPriority {
    description: string
    achieved: boolean
}

export interface IPointsScored {
    teamName: string
    points: number
}

export interface ISystemTrace {
    primaryAffordanceId: string
    secondaryAffordanceId?: string
    archetypeId: string
    archetypeName: string
    foundationConstraintId: string
    shapingConstraintId: string
    consequenceConstraintId?: string
}

export interface IActivity {
    _id: string
    activityStatus?: ActivityStatus
    session: ISession
    title: string
    constraint: string
    intent: string
    extensions: string[]
    scaffolding: string[]
    playerGroupSizes: number
    equipmentNeeded: string[]
    affordancesUsed?: IAffordance[]
    constraintsUsed?: IConstraint[]
    challengeLevel?: ChallengeLevels
    duration?: number
    learningPriorities?: ILearningPriority[]
    difficultyLevel?: DifficultyLevels
    engagementLevel?: EngagementLevels
    breakthroughMoments?: number
    coachComments?: string
    rules?: string[]
    scoringSystem?: string
    winCondition?: string
    pointsTracking?: IPointsScored[]
    systemTrace?: ISystemTrace
    createdAt: Date
    updatedAt: Date
}
