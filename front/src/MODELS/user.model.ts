import type { IPermissions } from './types'

export enum EcologicalCoachingExperienceLevels {
    Beginner = 'beginner',
    Intermediate = 'intermediate',
    Advanced = 'advanced',
}

export interface IUser {
    _id: string
    firstName: string
    lastName: string
    email: string
    passwordHash: string
    profileImage?: string
    ecologicalCoachingExperienceLevel?: EcologicalCoachingExperienceLevels
    permissions: IPermissions
    lastLoginAt: Date
    createdAt: Date
    updatedAt: Date
}
