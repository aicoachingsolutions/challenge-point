import { model, Schema } from 'mongoose'
import { IPermissions } from '../services/authentication.service'

export enum EcologicalCoachingExperienceLevels {
    "Beginner" = 'beginner',
    "Intermediate" = 'intermediate',
    "Advanced" = 'advanced'
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

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    profileImage: {type: String},
    ecologicalCoachingExperienceLevel: { type: String },
    permissions: { type: Object, required: true, default: { isAdmin: false } },
    lastLoginAt: {type: Date}
}, {
    timestamps: true
})

const User = model<IUser>('User', userSchema)

userSchema.set('toObject', {
    transform(_, object) {
        // will not include password if this model is cast to an object (for example when being passed through a response body)
        delete object.password
        return object
    },
})

export default User