import express from 'express'
import http from 'node:http'
import OpenAI from 'openai'
import Session from '../models/session.model'
import Activity from '../models/activity.model'
import UsageEvent from '../models/usage-event.model'
import LoggingService from '../services/logging.service'
import appRouter from '../routes/app.routes'
import { specializedRoleNames } from '../system/rendering/session-envelope'
import { MECHANISM_DEMONSTRATIONS } from '../system/rendering/mechanism-demonstrations'
import { sessionPlanningModel } from '../system/session-planning/session-planning-model'

const SESSION_ID = '64b7f0c2a1b2c3d4e5f60718'
const USER_ID = '64b7f0c2a1b2c3d4e5f60719'
const roles = specializedRoleNames()
const usage: any[] = []
const prompts: any[] = []
let stored: any

;(Session as any).findById = () => {
    const doc = { ...stored, toObject: () => ({ ...stored }) }
    const query: any = Promise.resolve(doc)
    query.lean = async () => ({ ...stored })
    return query
}
;(Activity as any).find = async () => []
;(UsageEvent as any).create = async (event: any) => {
    usage.push(JSON.parse(JSON.stringify(event)))
    return event
}
;(LoggingService as any).log = async () => undefined
;(OpenAI as any).Chat.Completions.prototype.create = async function (args: any) {
    prompts.push(JSON.parse(JSON.stringify(args)))
    return { choices: [{ message: { content: '{"generatedActivities":[]}' } }], usage: {} }
}

const call = (port: number, method: string, route: string, body?: unknown) => new Promise<{ status: number; body: any }>((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined
    const request = http.request({ port, method, path: route, headers: { 'content-type': 'application/json', ...(data ? { 'content-length': Buffer.byteLength(data) } : {}) } }, response => {
        let text = ''
        response.on('data', chunk => (text += chunk))
        response.on('end', () => resolve({ status: response.statusCode ?? 0, body: JSON.parse(text || 'null') }))
    })
    request.on('error', reject)
    if (data) request.write(data)
    request.end()
})

const matrix = () => [
    { id: 'roles-none', roles: Object.fromEntries(roles.map(role => [role, 0])) },
    ...roles.flatMap(role => [1, 2].map(availability => ({ id: `${role}-${availability}`, roles: Object.fromEntries(roles.map(name => [name, name === role ? availability : 0])) }))),
]

const app = express()
app.use(express.json())
app.use((_req, res, next) => {
    res.locals.sessionUser = { _id: USER_ID, permissions: { isAdmin: false } }
    next()
})
app.use('/api/app', appRouter)

const server = app.listen(0, async () => {
    const port = (server.address() as any).port
    const goals: any[] = sessionPlanningModel.learningGoals() as any[]
    const guided = goals.filter(goal => sessionPlanningModel.practiceSituationsFor(String(goal.ID)).length > 0)
    const snapshot: any = {}
    try {
        for (const matrixCase of matrix()) {
            stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: matrixCase.roles }
            for (const goal of goals) {
                const id = String(goal.ID)
                const result = await call(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { learningGoalId: id, durationMin: 20 })
                snapshot[`review/${id}/${matrixCase.id}`] = result
            }
            for (const demonstration of MECHANISM_DEMONSTRATIONS) {
                const result = await call(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { demonstrationId: demonstration.id, durationMin: 20 })
                snapshot[`review/${demonstration.id}/${matrixCase.id}`] = result
            }
        }
        stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: Object.fromEntries(roles.map(role => [role, 0])) }
        for (const goal of guided) {
            usage.length = 0
            prompts.length = 0
            const id = String(goal.ID)
            const result = await call(port, 'POST', `/api/app/generate-activities/${SESSION_ID}`, { challengeLevel: 'medium', duration: 20, learningGoals: [String(goal['Learning Goal'])], planning: { learningGoalId: id } })
            snapshot[`live/${id}`] = { ...result, usage: [...usage], prompts: [...prompts] }
        }
    } catch (error) {
        snapshot.error = error instanceof Error ? error.stack : String(error)
    } finally {
        console.log('PROBE-JSON' + JSON.stringify(snapshot))
        server.close()
    }
})
