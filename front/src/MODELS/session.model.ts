import type { IUser } from './user.model'

export enum AgeGroups {
    'Under 6' = 'u6',
    'Under 8' = 'u8',
    'Under 10' = 'u10',
    'Under 12' = 'u12',
    'Under 14' = 'u14',
    'Under 16' = 'u16',
    'Under 18' = 'u18',
    Adult = 'adult',
}

export enum SkillLevels {
    "Reactive Learners (don't read cues well)" = 'beginner',
    'Developing Awareness (pick up on key cues but still reliant mostly on athleticism for solutions)' = 'intermediate',
    'Exploratory Decision-Makers (active searchers that adapt to each moment)' = 'advanced',
}

export enum SessionStatus {
    Draft = 'draft',
    InProgress = 'inProgress',
    Completed = 'completed',
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
