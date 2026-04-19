import { IUser } from './user.model'

export type AuthToken = {
    accessToken: string
    refreshToken: string
    tokenType: string
    expiresAt: number // milliseconds timestamp
}

export type Whoami = {
    isLoggedIn: boolean
    user?: IUser
}
