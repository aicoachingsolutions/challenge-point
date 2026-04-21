import ROUTES from '@/ROUTES'

import { AuthToken } from '@/MODELS/types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type ApiResponse<DataType> = {
    status?: number
    message?: string
    data?: DataType
    error?: string
    stage?: string
    details?: string[]
}

/* Middleware
 */
export async function wrappedFetch(
    input: RequestInfo | URL,
    init?: RequestInit | undefined,
    numRetries?: number
): Promise<Response> {
    const response = await fetch(input, init)

    if (response.ok === false) {
        // Not Authorized
        if (response.status === 401) {
            localStorage.removeItem('token')
            window.location.replace('/login')
        }

        if (response.status === 403) {
            window.location.assign('/forbidden')
        }

        // Should Refresh - whoami or router middleware will send these redirect responses to attempt a refresh
        if (response.status === 302) {
            const body = await response
                .json()
                .then((body) => body)
                .catch(() => null)

            if (!body) {
                return response
            }

            if (body.shouldRefresh) {
                if (numRetries && numRetries >= 2) {
                    throw {
                        status: 401,
                        error: 'Maximum retries exceeded',
                    }
                }

                const refreshBody = await fetch(`${API_BASE_URL}/${ROUTES.auth.refresh}`, {
                    ...init,
                    method: 'GET',
                    body: undefined,
                })
                    .then(async (res) => {
                        return await res
                            .json()
                            .then((_body) => _body)
                            .catch(() => null)
                    })
                    .catch(() => {
                        // request itself has failed
                        throw {
                            status: 401,
                            error: 'Failed to refresh',
                        }
                    })

                if (!refreshBody || refreshBody.error) {
                    throw {
                        status: 401,
                        error: 'Failed to refresh',
                        ...refreshBody,
                    }
                }

                localStorage.setItem('token', JSON.stringify(refreshBody))

                return await wrappedFetch(
                    input,
                    {
                        ...init,
                        headers: {
                            ...(init?.headers ?? {}),
                            Authorization: `Bearer ${refreshBody.accessToken}`,
                            'X-Refresh-Token': refreshBody.refreshToken,
                        },
                    },
                    (numRetries ?? 0) + 1
                )
            }

            // other redirects - add if needed
        }

        // All other errors
        const errorBody = await response.json().catch(() => null)

        throw {
            status: response.status,
            error: errorBody?.error ?? response.statusText,
            message: errorBody?.message,
            stage: errorBody?.stage,
            details: Array.isArray(errorBody?.details) ? errorBody.details : undefined,
        }
    }

    // OK responses
    return response
}

/* Util
 */
export function getTokens(): AuthToken {
    const stored = localStorage.getItem('token')
    if (!stored) {
        // No tokens
        window.location.replace('/login')
        throw { status: 401, error: 'Missing tokens' }
    }
    const parsed: AuthToken = JSON.parse(stored)
    if (!parsed.accessToken) {
        throw { status: 401, error: 'Missing access token' }
    }
    if (!parsed.refreshToken) {
        throw { status: 401, error: 'Missing refresh token' }
    }
    return parsed
}

/* Request Functions
 */

export async function api<ResponseBodyType>(
    endpoint: string,
    body?: any,
    logging?: boolean
): Promise<ApiResponse<ResponseBodyType | null>> {
    const token: AuthToken = getTokens()
    const method = body ? 'POST' : 'GET'
    const requestBody = body ? JSON.stringify(body) : null
    return await wrappedFetch(`${API_BASE_URL}/${endpoint}`, {
        method: method,
        headers: {
            Authorization: `${token.tokenType} ${token.accessToken}`,
            'X-Refresh-Token': token.refreshToken,
            'Content-Type': 'application/json',
        },
        body: requestBody,
    })
        .then(async (response: Response) => {
            let body = undefined

            try {
                body = await response.json()
            } catch {}

            return {
                status: response.status,
                message: response.statusText,
                data: body,
            }
        })
        .catch((errorResponse: ApiResponse<null>) => {
            // response is formed by the middleware
            if (errorResponse?.status === 401) {
                // has attempted and failed to refresh
                localStorage.removeItem('token')
                window.location.replace('/login')
            }
            return {
                data: null,
                ...errorResponse,
            }
        })
}

export async function api_no_auth<ResponseBodyType>(
    endpoint: string,
    body?: any,
    logging?: boolean
): Promise<ApiResponse<ResponseBodyType | null>> {
    const method = body ? 'POST' : 'GET'
    const requestBody = body ? JSON.stringify(body) : null

    return await wrappedFetch(`${API_BASE_URL}/${endpoint}`, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: requestBody,
    })
        .then(async (response: Response) => {
            let body = undefined

            try {
                body = await response.json()
            } catch {}

            return {
                status: response.status,
                message: response.statusText,
                data: body,
            }
        })
        .catch((errorResponse: ApiResponse<null>) => {
            // response is formed by the middleware
            return {
                data: null,
                ...errorResponse,
            }
        })
}

export async function api_delete(endpoint: string, logging?: boolean): Promise<ApiResponse<null>> {
    const token: AuthToken = getTokens()

    return await wrappedFetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'DELETE',
        headers: {
            Authorization: `${token.tokenType} ${token.accessToken}`,
            'X-Refresh-Token': token.refreshToken,
            'Content-Type': 'application/json',
        },
    })
        .then(async (response: Response) => {
            return {
                status: response.status,
                message: response.statusText,
            }
        })
        .catch((errorResponse: ApiResponse<null>) => {
            // response is formed by the middleware
            if (errorResponse?.status === 401) {
                // has attempted and failed to refresh
                localStorage.removeItem('token')
                window.location.replace('/login')
            }
            return {
                data: null,
                ...errorResponse,
            }
        })
}
