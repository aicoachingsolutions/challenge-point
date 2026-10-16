// The regression snapshot's probe: every Learning Goal and demonstration through the review endpoint, for each
// specialized-role case, and every guided goal through the live route, all through the REAL router. Bundled and run by
// scripts/regression-snapshot.js, which reads the one line this prints after PROBE-JSON.
// Stood in: the session read (Mongo), the signed-in user, the usage and log writes (captured) and the generation client
// (captured, then answered empty - nothing generates). Every response is recorded WHOLE: status, the full body (or the
// raw text when it is not JSON), and the usage events and model requests captured while it ran. Nothing is picked out.
import express from 'express'
import http from 'node:http'
import net from 'node:net'
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
const refusedConnections: string[] = []
let stored: any

// No network, enforced rather than assumed: Node ignores HTTPS_PROXY, so a dead proxy proves nothing. Every socket
// goes through net.Socket.prototype.connect (http, https, tls and fetch alike), so anything leaving loopback is
// refused here and recorded, and the snapshot script then fails. Our own calls to the in-process server stay local.
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1'])
const connect = net.Socket.prototype.connect
;(net.Socket.prototype as any).connect = function (this: net.Socket, ...args: any[]) {
    const first = Array.isArray(args[0]) ? args[0][0] : args[0]
    const options = first && typeof first === 'object' ? first : { port: first, host: typeof args[1] === 'string' ? args[1] : undefined }
    if (options.path === undefined && options.host !== undefined && !LOOPBACK.has(String(options.host))) {
        refusedConnections.push(`${options.host}:${options.port}`)
        process.nextTick(() => this.destroy(new Error(`regression snapshot: outbound connection refused (${options.host}:${options.port})`)))
        return this
    }
    return (connect as any).apply(this, args)
}

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
    // An empty, well-formed answer: the call "succeeds" (so the circuit breaker never opens and every goal reaches its
    // prompt) and the pipeline then refuses it deterministically. Nothing is generated.
    return { choices: [{ message: { content: '{"generatedActivities":[]}' } }], usage: {} }
}

const call = (port: number, method: string, route: string, body?: unknown) => new Promise<{ status: number; body?: any; text?: string }>((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined
    const request = http.request({ host: '127.0.0.1', port, method, path: route, headers: { 'content-type': 'application/json', ...(data ? { 'content-length': Buffer.byteLength(data) } : {}) } }, response => {
        let text = ''
        response.setEncoding('utf8')
        response.on('data', chunk => (text += chunk))
        response.on('end', () => {
            const status = response.statusCode ?? 0
            // A body that is not JSON (an HTML error page) is kept as its raw text, so one odd response neither stops
            // the run nor disappears from the snapshot.
            try {
                resolve({ status, body: JSON.parse(text || 'null') })
            } catch {
                resolve({ status, text })
            }
        })
    })
    request.on('error', reject)
    if (data) request.write(data)
    request.end()
})

// Usage writes are detached (fire-and-forget), so each request's captures are cleared before it and read a moment
// after it, as the reference probe does: an event is filed under the request that caused it.
const capture = async (port: number, method: string, route: string, body?: unknown) => {
    usage.length = 0
    prompts.length = 0
    const response = await call(port, method, route, body)
    await new Promise(resolve => setTimeout(resolve, 20))
    return { ...response, usage: [...usage], prompts: [...prompts] }
}

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

const server = app.listen(0, '127.0.0.1', async () => {
    const port = (server.address() as any).port
    const goals: any[] = sessionPlanningModel.learningGoals() as any[]
    const guided = goals.filter(goal => sessionPlanningModel.practiceSituationsFor(String(goal.ID)).length > 0)
    const snapshot: any = {}
    try {
        // What the review page is offered: the goals, demonstrations and roles the route itself lists.
        snapshot['review/options'] = await capture(port, 'GET', '/api/app/checked-activity')
        for (const matrixCase of matrix()) {
            stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: matrixCase.roles }
            for (const goal of goals) {
                const id = String(goal.ID)
                snapshot[`review/${id}/${matrixCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { learningGoalId: id, durationMin: 20 })
            }
            for (const demonstration of MECHANISM_DEMONSTRATIONS) {
                snapshot[`review/${demonstration.id}/${matrixCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { demonstrationId: demonstration.id, durationMin: 20 })
            }
        }
        stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: Object.fromEntries(roles.map(role => [role, 0])) }
        for (const goal of guided) {
            const id = String(goal.ID)
            snapshot[`live/${id}`] = await capture(port, 'POST', `/api/app/generate-activities/${SESSION_ID}`, { challengeLevel: 'medium', duration: 20, learningGoals: [String(goal['Learning Goal'])], planning: { learningGoalId: id } })
        }
    } catch (error) {
        snapshot.error = error instanceof Error ? error.stack : String(error)
    }
    snapshot.refusedConnections = refusedConnections
    server.close()
    // Exit explicitly once the line is flushed: an open handle (a timer, a client) must not hold the run until the
    // wrapper's timeout. A run that errored or tried the network exits 1.
    process.stdout.write('PROBE-JSON' + JSON.stringify(snapshot) + '\n', () => process.exit(snapshot.error || refusedConnections.length ? 1 : 0))
})
