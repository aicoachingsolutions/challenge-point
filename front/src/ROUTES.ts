const endpoints = {
    app: {
        coachMetrics: '/coach-metrics',
        affordance: '/affordance',
        constraint: '/constraint',
        activity: '/activity',
        session: '/session',
        generateActivities: '/generate-activities',
        user: '/user',
    },
    admin: {
        coachMetrics: '/coach-metrics',
        activity: '/activity',
        session: '/session',
        affordance: '/affordance',
        constraint: '/constraint',
        user: '/user',
        category: '/category',
        activityGenerationPrompt: '/activity-generation-prompt',
    },
    public: {},
    auth: {
        register: '/register',
        login: '/login',
        logout: '/logout',
        whoami: '/whoami',
        refresh: '/refresh',
        forgotPassword: '/request-token',
        resetPassword: '/reset-password',
    },
}

export const ENDPOINTS = JSON.parse(JSON.stringify(endpoints)) as typeof endpoints

for (const [router, routes] of Object.entries(endpoints)) {
    for (const [name, endpoint] of Object.entries(routes)) {
        endpoints[router as keyof typeof endpoints][name as keyof (typeof endpoints)[keyof typeof endpoints]] =
            `${router}${endpoint}` as never
    }
}

const ROUTES = Object.assign({}, endpoints) as typeof endpoints
export default ROUTES
