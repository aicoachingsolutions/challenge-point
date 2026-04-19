import { model, Schema } from 'mongoose'

import { IAffordance } from './affordance.model'
import { IConstraint } from './constraint.model'
import { IUser } from './user.model'

export enum AgeGroups {
    'Under 6' = 'u6',
    'Under 8' = 'u8',
    'Under 10' = 'u10',
    'Under 12' = 'u12',
    'Under 14' = 'u14',
    'Under 16' = 'u16',
    'Under 18' = 'u18',
    'Adult' = 'adult',
}

export enum SkillLevels {
    "Reactive Learners (don't read cues well)"  = 'beginner',
    "Developing Awareness (pick up on key cues but still reliant mostly on athleticism for solutions)" = 'intermediate',
    "Exploratory Decision-Makers (active searchers that adapt to each moment)"= 'advanced',
}

export enum SessionStatus {
    'Draft' = 'draft',
    'In Progress' = 'inProgress',
    'Completed' = 'completed',
}




export interface ISession {
    _id: string
    createdBy: IUser
    name: string
    sessionStatus: SessionStatus
    playerCount?: number
    ageGroup?: AgeGroups
    skillLevel?: SkillLevels
    fieldLength?: string
    fieldWidth?: string
    fieldType?: string
    coachComments?: string
    createdAt: Date
    updatedAt: Date
}

const sessionSchema = new Schema<ISession>(
    {
        name: {type: String},
        createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
        sessionStatus: {type: String},
        playerCount: { type: Number },
        ageGroup: { type: String },
        skillLevel: { type: String },
        fieldLength: { type: String },
        fieldWidth: { type: String },
        fieldType: { type: String },
        coachComments: { type: String },
    },
    {
        timestamps: true,
    }
)

const Session = model<ISession>('Session', sessionSchema)
export default Session

