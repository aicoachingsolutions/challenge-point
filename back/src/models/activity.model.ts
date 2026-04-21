import { model, Schema } from 'mongoose'

import { IAffordance } from './affordance.model'
import { IConstraint } from './constraint.model'
import { ISession } from './session.model'
import { IUser } from './user.model'
import { ICategory } from './category.model'

export enum EngagementLevels {
    'Low' = 'low',
    'Medium' = 'medium',
    'High' = 'high',
}

export enum DifficultyLevels {
    'Low' = 'low',
    'Medium' = 'medium',
    'High' = 'high',
}

export enum ChallengeLevels {
    'Low-Pressure Learning' = 'low',
    'Growth Zone' = 'medium',
    'High Pressure Challenge' = 'high',
}

export enum ActivityStatus {
    'Ready to Start' = 'readyToStart',
    'In Progress' = 'inProgress',
    'Review' = 'review',
    'Completed' = 'completed',
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
    supportingAffordanceIds?: string[]
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

const activitySchema = new Schema<IActivity>(
    {
        activityStatus: { type: String },
        session: { type: Schema.Types.ObjectId, required: true, ref: 'Session' },
        title: { type: String },
        constraint: {type: String},
        intent: {type: String},
        extensions: [{type: String}],
         scaffolding: [{type: String}],
        playerGroupSizes: { type: Number },
        equipmentNeeded: [{ type: String }],
        affordancesUsed: [{ type: Schema.Types.ObjectId, ref: 'Affordance' }],
        constraintsUsed: [{ type: Schema.Types.ObjectId, ref: 'Constraint' }],
        challengeLevel: { type: String },
        duration: { type: Number },
        learningPriorities: { type: [Object] },
        difficultyLevel: { type: String },
        engagementLevel: { type: String },
        breakthroughMoments: { type: Number },
        coachComments: { type: String },
        rules: {type: [String]},
        scoringSystem: {type: String},
        winCondition: {type: String},
        pointsTracking: {type: [Object]},
        systemTrace: {type: Object}
    },
    {
        timestamps: true,
    }
)

const Activity = model<IActivity>('Activity', activitySchema)
export default Activity
