/**
 * Unit tests — the fixed-response test of the AI-written pathway, offline (Christian's reply of 3 November 2026, item 11: *"I approve the
 * proposed offline fixed-response test of the existing AI-written pathway. Please use a recorded, valid model response, with no real AI
 * calls and no production changes, to establish what the post-model merge actually returns to the coach."*).
 *
 * The audit's probe (like the regression snapshot) answered every model call with an empty answer, so the pipeline always refused and no
 * one had seen what the server serves after a VALID answer. Here the real router runs with the same stand-ins as
 * `src/scripts/regression-snapshot.entry.ts` (the session read, the signed-in user, usage and log writes, every outbound connection refused)
 * and the generation client answers with a fixed, schema-valid answer stored in `fixtures/fixed-polish-response.json`. No model is called;
 * no production file is changed.
 *
 * What is measured, for Progress the Attack and Secure Possession at the session the audit used (12 players, 40 x 30 m, 20 minutes, the
 * FA 5v5 goal), and pinned so a change to the merge is seen:
 *   - one model call, no retry: the fixed answer passes every check the pipeline applies;
 *   - which parts of each served activity are the model's text and which the server's (teams, rules, scoring, constraints);
 *   - whether the session's players, area and duration, and the goal, reach what the coach is served;
 *   - with the `contradicting` answer (its setups state 8 players, 20 x 15 m, 10 minutes): whether the server catches it or serves it.
 * `FIXED_RESPONSE_OUT=<file>` also writes everything measured, for the report.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'

import fixture from './fixtures/fixed-polish-response.json'

// The router builds its generation client at module load, and that constructor wants a key to be PRESENT. The client is stubbed before
// any route runs, so a placeholder is given and never sent anywhere (as the regression snapshot does).
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'placeholder-not-a-key'
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'placeholder-not-a-key'

const quiet = console.log
console.log = () => undefined

const refusedConnections: string[] = []
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1'])
const connect = net.Socket.prototype.connect
;(net.Socket.prototype as any).connect = function (this: net.Socket, ...args: any[]) {
    const first = Array.isArray(args[0]) ? args[0][0] : args[0]
    const options = first && typeof first === 'object' ? first : { port: first, host: typeof args[1] === 'string' ? args[1] : undefined }
    if (options.path === undefined && options.host !== undefined && !LOOPBACK.has(String(options.host))) {
        refusedConnections.push(`${options.host}:${options.port}`)
        process.nextTick(() => this.destroy(new Error(`fixed-response test: outbound connection refused (${options.host}:${options.port})`)))
        return this
    }
    return (connect as any).apply(this, args)
}

/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express')
const OpenAI = require('openai').default ?? require('openai')
const Session = require('../../models/session.model').default
const Activity = require('../../models/activity.model').default
const UsageEvent = require('../../models/usage-event.model').default
const LoggingService = require('../../services/logging.service').default
const appRouter = require('../../routes/app.routes').default
const { sessionPlanningModel } = require('../session-planning/session-planning-model')
/* eslint-enable @typescript-eslint/no-var-requires */

const SESSION_ID = '64b7f0c2a1b2c3d4e5f60718'
const USER_ID = '64b7f0c2a1b2c3d4e5f60719'
const FA_GOAL = { goal: { count: 1, type: 'scaled', widthM: 3.6576 } }
const SESSION = { _id: SESSION_ID, createdBy: USER_ID, playerCount: 12, fieldLength: '40', fieldWidth: '30', objects: FA_GOAL }
const DURATION = 20

let answer: unknown = fixture.faithful
const modelCalls: any[] = []
;(Session as any).findById = () => {
    const doc = { ...SESSION, toObject: () => ({ ...SESSION }) }
    const query: any = Promise.resolve(doc)
    query.lean = async () => ({ ...SESSION })
    return query
}
;(Activity as any).find = async () => []
;(Activity as any).prototype.save = async function (this: any) {
    const { _id, ...rest } = this.toObject()
    return rest
}
;(UsageEvent as any).create = async (event: any) => event
;(LoggingService as any).log = async () => undefined
;(OpenAI as any).Chat.Completions.prototype.create = async function (args: any) {
    modelCalls.push(JSON.parse(JSON.stringify(args)))
    return { choices: [{ message: { content: JSON.stringify(answer) } }], usage: {} }
}

function post(port: number, route: string, body: unknown): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body)
        const request = http.request(
            { host: '127.0.0.1', port, method: 'POST', path: route, headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } },
            (response) => {
                let text = ''
                response.setEncoding('utf8')
                response.on('data', (chunk) => (text += chunk))
                response.on('end', () => resolve({ status: response.statusCode ?? 0, body: JSON.parse(text || 'null') }))
            }
        )
        request.on('error', reject)
        request.write(data)
        request.end()
    })
}

const goalName = (id: string) => String(sessionPlanningModel.learningGoal(id)?.['Learning Goal'] ?? id)

/** The coach's request from the guided conversation, as the audit's probe sent it, without the debug trace. */
const request = (id: string) => ({ challengeLevel: 'medium', duration: DURATION, learningGoals: [goalName(id)], planning: { learningGoalId: id } })

interface Measured {
    goal: string
    answer: 'faithful' | 'contradicting'
    status: number
    modelCalls: number
    body: any
}

async function measure(port: number, goal: string, which: 'faithful' | 'contradicting'): Promise<Measured> {
    answer = (fixture as any)[which]
    modelCalls.length = 0
    const response = await post(port, `/api/app/generate-activities/${SESSION_ID}`, request(goal))
    return { goal, answer: which, status: response.status, modelCalls: modelCalls.length, body: response.body }
}

async function main(): Promise<void> {
    const app = express()
    app.use(express.json())
    app.use((_req: any, res: any, next: any) => {
        res.locals.sessionUser = { _id: USER_ID, permissions: { isAdmin: false } }
        next()
    })
    app.use('/api/app', appRouter)
    const server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    const port = (server.address() as any).port
    const results: Measured[] = []
    try {
        for (const goal of ['A05', 'TA02']) for (const which of ['faithful', 'contradicting'] as const) results.push(await measure(port, goal, which))
    } finally {
        server.close()
    }
    if (process.env.FIXED_RESPONSE_OUT) fs.writeFileSync(path.resolve(process.env.FIXED_RESPONSE_OUT), `${JSON.stringify(results, null, 2)}\n`)
    console.log = quiet
    assert.deepEqual(refusedConnections, [], 'nothing left the machine')
    check(results)
    console.log('fixed-response pathway: all checks passed')
}

const run = (results: Measured[], goal: string, which: 'faithful' | 'contradicting') => results.find((r) => r.goal === goal && r.answer === which) as Measured
const coachFacing = (activity: any) => Object.fromEntries(Object.entries(activity).filter(([key]) => key !== 'systemTrace'))

/**
 * What the coach is served after a valid answer. MEASURED on the current code and pinned: an assertion marked "served as measured" records
 * behaviour, not approval. A change to the merge that fixes it should change that assertion, deliberately.
 */
function check(results: Measured[]): void {
    for (const r of results) {
        assert.equal(r.status, 200, `${r.goal} ${r.answer}: ${JSON.stringify(r.body).slice(0, 300)}`)
        assert.equal(r.modelCalls, 1, `${r.goal} ${r.answer}: the fixed answer passes every check on the first call, so there is no retry`)
        assert.equal(r.body.activities.length, 3)
        assert.equal(r.body.pathwayNotice?.label, 'Not checked', 'the AI-written activity carries the DRAFT "Not checked" notice')
    }

    for (const goal of ['A05', 'TA02']) {
        const faithful = run(results, goal, 'faithful').body.activities
        const contradicting = run(results, goal, 'contradicting').body.activities
        faithful.forEach((activity: any, i: number) => {
            const model = fixture.faithful.activities[i]
            // The model's own fields: title served as written.
            assert.equal(activity.title, model.title, `${goal} ${i + 1}: title is the model's`)
            // The server's fields: the same whatever the model wrote.
            for (const field of ['scoringSystem', 'winCondition', 'constraint', 'constraintsUsed', 'playerGroupSizes', 'extensions', 'equipmentNeeded']) {
                assert.deepEqual(contradicting[i][field], activity[field], `${goal} ${i + 1}: ${field} is the server's`)
            }
            assert.equal(activity.systemTrace.primaryScoring.contextId, 'RPC-003', `${goal}: scored on the routed context's event`)
            assert.ok(activity.scoringSystem.startsWith(activity.systemTrace.primaryScoring.scoringRule), `${goal} ${i + 1}: scoring is the context's rule`)
            // The session's players and area reach Setup, added by the server.
            assert.match(activity.setup, /Teams play 6v6\./, `${goal} ${i + 1}: players`)
            assert.match(activity.setup, /Play in a 40 x 30 m \(44 x 33 yd\) area\./, `${goal} ${i + 1}: area`)
            assert.equal(activity.playerGroupSizes, 12)
            // The session's duration (20 minutes) is in no coach-facing field.
            assert.ok(!/\b20\s*(min|minutes)\b/i.test(JSON.stringify(coachFacing(activity))), `${goal} ${i + 1}: duration`)
            // The model's how-to-play lines are served FIRST under Rules (mergeHowToPlayIntoRules), and How to Play is empty.
            assert.deepEqual(activity.howToPlay, [])
            assert.deepEqual(activity.rules.slice(0, 2), model.howToPlay, `${goal} ${i + 1}: how-to-play lines served as rules`)
        })
        // Served as measured: the model's objective is kept only where it names no unscored object; otherwise the goal's name replaces it.
        assert.equal(faithful[0].intent, fixture.faithful.activities[0].objective)
        assert.equal(faithful[1].intent, goal === 'A05' ? 'Progress the Attack.' : 'Secure possession.')
        assert.equal(faithful[2].intent, goal === 'A05' ? 'Progress the Attack.' : 'Secure possession.')
        // Served as measured: unscored objects are taken out of the model's setup sentence, and a purpose word with them.
        assert.ok(faithful[0].setup.startsWith('Two teams play in the marked area. Each team attacks the end the coach points. '), faithful[0].setup)
        assert.ok(faithful[1].setup.startsWith('Two teams play in the marked area on each side. '), faithful[1].setup)

        // The contradicting answer: the area is corrected to the session's; the player count and the duration are served as the model wrote them.
        contradicting.forEach((activity: any, i: number) => {
            assert.ok(!/20 by 15/.test(activity.setup), `${goal} ${i + 1}: the model's area is replaced`)
            assert.match(activity.setup, /40 x 30 m/)
            assert.match(activity.setup, /^Eight players play four against four in a 40 x 30 m \(44 x 33 yd\) area for 10 minutes/, `${goal} ${i + 1}: served as measured`)
            assert.match(activity.setup, /Teams play 6v6\./, `${goal} ${i + 1}: beside the server's own player line`)
        })
    }

    // The two goals' served activities differ only in the third library constraint and the objective that fell back to the goal's name.
    const a05 = run(results, 'A05', 'faithful').body.activities.map(coachFacing)
    const ta02 = run(results, 'TA02', 'faithful').body.activities.map(coachFacing)
    const differing = new Set<string>()
    a05.forEach((activity: any, i: number) => Object.keys(activity).forEach((key) => JSON.stringify(activity[key]) !== JSON.stringify(ta02[i][key]) && differing.add(key)))
    assert.deepEqual([...differing].sort(), ['constraint', 'constraintsUsed', 'intent'])
    for (const r of results) assert.ok(r.body.activities.every((a: any) => a.systemTrace.archetypeId === 'GF2'), `${r.goal}: the word-matched selection gives the same Game Form`)
}

main().catch((error) => {
    console.log = quiet
    console.error(error)
    process.exit(1)
})
