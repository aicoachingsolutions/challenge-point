// The regression snapshot's probe: every Learning Goal and demonstration through the review endpoint, as the session's coach and as an administrator, for each
// specialized-role case, and every guided goal through the live route (since 22 October 2026 for each role case and practice situation, and
// with the save of any activity the live route built through the checked pathway), all through the REAL router. Bundled and run by
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
import { sessionResourceKinds, specializedRoleNames } from '../system/rendering/session-envelope'
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
// Starting a checked activity (the live-app fix, 22 October 2026) creates one: the write is captured instead, and answered with the document
// as Mongo would be handed it (`toObject`, so the schema's own handling of what is stored applies) without its generated id, which would
// make two runs differ.
;(Activity as any).prototype.save = async function (this: any) {
    const { _id, ...stored } = this.toObject()
    return stored
}
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

// The signed-in user is the session's own coach, except during the administrator pass below. Since stage K7 an
// administrator's review also carries `draft` (the rendering made before a refusal at communication) and since K8
// `evidence`; a coach's carries neither, so a snapshot taken only as the coach could not see a draft sentence change
// at all (18 October 2026: the first post-K wording fix moved only draft sentences and a coach-only snapshot said
// "0 differences" for it).
let asAdmin = false
const app = express()
app.use(express.json())
app.use((_req, res, next) => {
    res.locals.sessionUser = { _id: USER_ID, permissions: { isAdmin: asAdmin } }
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
        // H4 (23 October 2026): what the planning conversation is offered, whole - since H4 with `inputUse`, the disclosure each goal's
        // checked pathway makes before the coach answers (the d26 design's section 5.3). A new key: every earlier one compares as it was.
        snapshot['planning/registry'] = await capture(port, 'GET', '/api/app/session-planning')
        // Stage I (24 October 2026): the choices the session form states a session's equipment by (GET /session/object-choices, the d27
        // design's stage I(a)), whole. A new key: every earlier one compares as it was.
        snapshot['session/object-choices'] = await capture(port, 'GET', '/api/app/session/object-choices')
        /**
         * K3 (24 October 2026, the d27 design's stage K3): one object of each choice the session form offers from an authorized pairing (a
         * choice whose `from` names one), stated exactly as the form states it - one, with the choice's own statement (its type and width) -
         * read from the choices route captured above, so nothing here names a kind, a pairing or a width. Since K3 one of them is the goal a
         * goal version is built for. Read once here (the K3 review's should-fix, 24 October 2026) because three blocks below state them: the
         * object cases, the practice situations a live build asked an object for, and the saves of the live builds that state one.
         */
        const pairingCases = ((snapshot['session/object-choices']?.body?.kinds ?? []) as any[]).flatMap(entry =>
            ((entry.choices ?? []) as any[]).filter(choice => Array.isArray(choice.from) && choice.from.length).map(choice => ({ id: `objects-${choice.id}`, kind: String(entry.kind), objects: { [entry.kind]: { count: 1, ...choice.states } } })),
        )
        const noneOfEach = Object.fromEntries(sessionResourceKinds().map(kind => [kind, { count: 0 }]))
        for (const matrixCase of matrix()) {
            stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: matrixCase.roles }
            for (const goal of goals) {
                const id = String(goal.ID)
                snapshot[`review/${id}/${matrixCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { learningGoalId: id, durationMin: 20 })
            }
            for (const demonstration of MECHANISM_DEMONSTRATIONS) {
                snapshot[`review/${demonstration.id}/${matrixCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { demonstrationId: demonstration.id, durationMin: 20 })
            }
            // The same requests as an administrator, recorded whole beside the coach's (drafts and evidence included).
            asAdmin = true
            try {
                for (const goal of goals) {
                    const id = String(goal.ID)
                    snapshot[`review-admin/${id}/${matrixCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { learningGoalId: id, durationMin: 20 })
                }
                for (const demonstration of MECHANISM_DEMONSTRATIONS) {
                    snapshot[`review-admin/${demonstration.id}/${matrixCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { demonstrationId: demonstration.id, durationMin: 20 })
                }
            } finally {
                asAdmin = false
            }
        }
        /**
         * Stage E (23 October 2026, register version 19): sessions that STATE their objects - none of each kind the register lists, and one,
         * 5 m wide - for every goal and demonstration through the review (as the coach and as an administrator) and every guided goal through
         * the live route, at the matrix's second case. Every key above and below stays a session that states no object, so each compares to
         * what it was; these show what a statement changes (the session it echoes, and the digests that hash it) and that a game holding no
         * such object is built exactly as without one. The kinds come from the register, so nothing here names one.
         */
        {
            const [, withRoles] = matrix()
            const kinds = sessionResourceKinds()
            const objectCases = [
                { id: 'objects-none', objects: noneOfEach },
                { id: 'objects-one', objects: Object.fromEntries(kinds.map(kind => [kind, { count: 1, widthM: 5 }])) },
                /**
                 * K3 (24 October 2026, the d27 design's stage K3): one object of each choice from an authorized pairing (`pairingCases`, read
                 * from the choices route above). Since K3 one of them is the goal a goal version is built for, so these keys show it served
                 * through the review route and the live route; the others show what a statement that suits nothing changes. New keys: every
                 * earlier one compares as it was.
                 */
                ...pairingCases.map(({ id, objects }) => ({ id, objects })),
            ]
            for (const objectCase of objectCases) {
                stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: withRoles.roles, objects: objectCase.objects }
                for (const admin of [false, true]) {
                    asAdmin = admin
                    try {
                        for (const goal of goals) {
                            const id = String(goal.ID)
                            snapshot[`${admin ? 'review-admin' : 'review'}/${id}/${withRoles.id}/${objectCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { learningGoalId: id, durationMin: 20 })
                        }
                        for (const demonstration of MECHANISM_DEMONSTRATIONS) {
                            snapshot[`${admin ? 'review-admin' : 'review'}/${demonstration.id}/${withRoles.id}/${objectCase.id}`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { demonstrationId: demonstration.id, durationMin: 20 })
                        }
                    } finally {
                        asAdmin = false
                    }
                }
                for (const goal of guided) {
                    const id = String(goal.ID)
                    snapshot[`live/${id}/${withRoles.id}/${objectCase.id}`] = await capture(port, 'POST', `/api/app/generate-activities/${SESSION_ID}`, { challengeLevel: 'medium', duration: 20, learningGoals: [String(goal['Learning Goal'])], planning: { learningGoalId: id } })
                }
            }
            /**
             * The stage E fix (23 October 2026): the review page's ANSWER to a build's question, sent in the review body over a session that
             * stores no object - none of each kind, for every goal and demonstration as the coach and as an administrator, each to compare
             * with its `objects-none` twin above (the answer is read exactly as a stored statement); and a kind the register does not list,
             * as the coach, refused at session (the answer is validated as a stored statement is).
             */
            stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: withRoles.roles }
            const [none] = objectCases
            for (const admin of [false, true]) {
                asAdmin = admin
                try {
                    for (const goal of goals) {
                        const id = String(goal.ID)
                        snapshot[`${admin ? 'review-admin' : 'review'}/${id}/${withRoles.id}/answered-none`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { learningGoalId: id, durationMin: 20, objects: none.objects })
                    }
                    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
                        snapshot[`${admin ? 'review-admin' : 'review'}/${demonstration.id}/${withRoles.id}/answered-none`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { demonstrationId: demonstration.id, durationMin: 20, objects: none.objects })
                    }
                } finally {
                    asAdmin = false
                }
            }
            for (const goal of goals) {
                const id = String(goal.ID)
                snapshot[`review/${id}/${withRoles.id}/answered-unknown`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { learningGoalId: id, durationMin: 20, objects: { 'TEST-ONLY-KIND': { count: 1 } } })
            }
            for (const demonstration of MECHANISM_DEMONSTRATIONS) {
                snapshot[`review/${demonstration.id}/${withRoles.id}/answered-unknown`] = await capture(port, 'POST', `/api/app/checked-activity/${SESSION_ID}`, { demonstrationId: demonstration.id, durationMin: 20, objects: { 'TEST-ONLY-KIND': { count: 1 } } })
            }
        }
        stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: Object.fromEntries(roles.map(role => [role, 0])) }
        for (const goal of guided) {
            const id = String(goal.ID)
            snapshot[`live/${id}`] = await capture(port, 'POST', `/api/app/generate-activities/${SESSION_ID}`, { challengeLevel: 'medium', duration: 20, learningGoals: [String(goal['Learning Goal'])], planning: { learningGoalId: id } })
        }
        /**
         * The live route over the rest of the specialized-role matrix, each practice situation, and two sessions that leave something
         * unstated (the live-app fix, design section 4.4, 22 October 2026). `live/<goal>` above stays the no-roles case under its old key,
         * so every earlier snapshot still compares to it. Each practice situation is asked as the planning conversation asks it: the
         * goal's name, the situation's name and a note as the goal text, with a learning stage, at the matrix's second case (the first
         * role available once). Nothing here names a goal, a situation or a role: all three come from the registries.
         */
        const live = (id: string, goalText: string, planning: Record<string, unknown>) =>
            capture(port, 'POST', `/api/app/generate-activities/${SESSION_ID}`, { challengeLevel: 'medium', duration: 20, learningGoals: [goalText], planning: { learningGoalId: id, ...planning } })
        const [, firstAvailable] = matrix()
        for (const matrixCase of matrix().slice(1)) {
            stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: matrixCase.roles }
            for (const goal of guided) {
                const id = String(goal.ID)
                snapshot[`live/${id}/${matrixCase.id}`] = await live(id, String(goal['Learning Goal']), {})
            }
        }
        stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: firstAvailable.roles }
        for (const goal of guided) {
            const id = String(goal.ID)
            for (const situation of sessionPlanningModel.practiceSituationsFor(id) as any[]) {
                const goalText = [String(goal['Learning Goal']), String(situation['Practice Situation']), 'Our players rush the first pass.'].join('. ')
                snapshot[`live/${id}/${firstAvailable.id}/${String(situation.ID)}`] = await live(id, goalText, { practiceSituationId: String(situation.ID), learningStage: 'building_understanding' })
            }
        }
        /**
         * The K3 review's should-fix (24 October 2026): a practice situation the live route ASKED a session's object for (since K3 a session
         * that has not said what goals it has is asked, his reply filed 26 October 2026, item 11) is asked again at the same case with each
         * choice from an authorized pairing of the kind it asked (`pairingCases`), as the coach answers the form - so the activity served for
         * each practice situation with an object stated is captured, as it was before K3 with none stated. Read from the answers and the
         * choices route, so nothing here names a goal, a situation, a kind, a pairing or a width. New keys: every earlier one compares as it was.
         */
        for (const goal of guided) {
            const id = String(goal.ID)
            for (const situation of sessionPlanningModel.practiceSituationsFor(id) as any[]) {
                const key = `live/${id}/${firstAvailable.id}/${String(situation.ID)}`
                const asked = snapshot[key]?.body?.question?.objectKind
                if (typeof asked !== 'string') continue
                const goalText = [String(goal['Learning Goal']), String(situation['Practice Situation']), 'Our players rush the first pass.'].join('. ')
                for (const objectCase of pairingCases.filter(entry => entry.kind === asked)) {
                    stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: firstAvailable.roles, objects: objectCase.objects }
                    snapshot[`${key}/${objectCase.id}`] = await live(id, goalText, { practiceSituationId: String(situation.ID), learningStage: 'building_understanding' })
                }
            }
        }
        /**
         * Starting a checked activity (the live-app fix, L3): for every guided goal the live route served through the checked pathway at the
         * matrix's second case, the save as the live app sends it (what it was built from and the input digests it was shown), the same
         * save with one digest changed, and the same save after the session's availability changed to the matrix's third case. Only a goal
         * whose live answer carried input digests is asked, so nothing here names one.
         */
        const [, , otherAvailable] = matrix()
        for (const goal of guided) {
            const id = String(goal.ID)
            const shown = snapshot[`live/${id}/${firstAvailable.id}`]
            if (!(shown?.status === 200 && Array.isArray(shown.body?.inputDigests))) continue
            const save = (inputDigests: unknown) =>
                capture(port, 'POST', '/api/app/activity', { _id: 'new', activityStatus: 'inProgress', session: SESSION_ID, pathway: shown.body.pathway, checkedInputs: { learningGoalId: id, practiceSituationId: null, durationMin: 20 }, inputDigests, challengeLevel: 'medium', learningPriorities: [{ description: String(goal['Learning Goal']), achieved: false }] })
            stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: firstAvailable.roles }
            snapshot[`save/${id}/${firstAvailable.id}`] = await save(shown.body.inputDigests)
            snapshot[`save/${id}/${firstAvailable.id}/digest-changed`] = await save(shown.body.inputDigests.map((entry: any, i: number) => (i === 0 ? { ...entry, inputDigest: '00000000' } : entry)))
            stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: otherAvailable.roles }
            snapshot[`save/${id}/${firstAvailable.id}/session-changed`] = await save(shown.body.inputDigests)
        }
        /**
         * The K3 review's should-fix (24 October 2026): the same saves for every live build served with one choice from an authorized pairing
         * stated (the `objects-<choice>` keys above, at the matrix's second case). Since K3 a session that does not say what goals it has is
         * asked, and the sessions the loop above saves from say nothing of them, so it finds no live build to save; these keep the save
         * measured through the real router - the goal version where the choice is the
         * goal it is built for, the zone version where it suits nothing. Each: the save as the live app sends it, one digest changed, the
         * availability changed (as above), and the statement changed to none of each kind (`objects-changed`). Only a build whose live answer
         * carried input digests is saved, so nothing here names a goal, a kind or a choice. New keys: every earlier one compares as it was.
         */
        for (const goal of guided) {
            const id = String(goal.ID)
            for (const objectCase of pairingCases) {
                const shown = snapshot[`live/${id}/${firstAvailable.id}/${objectCase.id}`]
                if (!(shown?.status === 200 && Array.isArray(shown.body?.inputDigests))) continue
                const save = (inputDigests: unknown) =>
                    capture(port, 'POST', '/api/app/activity', { _id: 'new', activityStatus: 'inProgress', session: SESSION_ID, pathway: shown.body.pathway, checkedInputs: { learningGoalId: id, practiceSituationId: null, durationMin: 20 }, inputDigests, challengeLevel: 'medium', learningPriorities: [{ description: String(goal['Learning Goal']), achieved: false }] })
                const session = (specializedRoles: unknown, objects: unknown) => ({ _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles, objects })
                const at = `save/${id}/${firstAvailable.id}/${objectCase.id}`
                stored = session(firstAvailable.roles, objectCase.objects)
                snapshot[at] = await save(shown.body.inputDigests)
                snapshot[`${at}/digest-changed`] = await save(shown.body.inputDigests.map((entry: any, i: number) => (i === 0 ? { ...entry, inputDigest: '00000000' } : entry)))
                stored = session(otherAvailable.roles, objectCase.objects)
                snapshot[`${at}/session-changed`] = await save(shown.body.inputDigests)
                stored = session(firstAvailable.roles, noneOfEach)
                snapshot[`${at}/objects-changed`] = await save(shown.body.inputDigests)
            }
        }
        // A session that states no specialized-role availability, and one with no playing area (its roles stated).
        stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30' }
        for (const goal of guided) snapshot[`live/${String(goal.ID)}/roles-not-stated`] = await live(String(goal.ID), String(goal['Learning Goal']), {})
        stored = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, specializedRoles: firstAvailable.roles }
        for (const goal of guided) snapshot[`live/${String(goal.ID)}/no-area`] = await live(String(goal.ID), String(goal['Learning Goal']), {})
    } catch (error) {
        snapshot.error = error instanceof Error ? error.stack : String(error)
    }
    snapshot.refusedConnections = refusedConnections
    server.close()
    // Exit explicitly once the line is flushed: an open handle (a timer, a client) must not hold the run until the
    // wrapper's timeout. A run that errored or tried the network exits 1.
    process.stdout.write('PROBE-JSON' + JSON.stringify(snapshot) + '\n', () => process.exit(snapshot.error || refusedConnections.length ? 1 : 0))
})
