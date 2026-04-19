import type { IUser } from './user.model'

export interface IPermissions {
    isAdmin: boolean
}

export type AuthToken = {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresAt: number
}

export type Whoami = {
    isLoggedIn: boolean
    user?: IUser
}
