/**
 * Unit tests — the coach's variant settings reach the prompt the model actually receives.
 *
 * Found 14 Sep by capturing the live prompt, not by reading the code that builds it. The Learning
 * Stage directive (IC-001, 9 Aug) was built into the activity skeleton and unit-tested, and formatted
 * by formatActivitySkeletonForPrompt. That formatter's only caller is generateAssemblyPrompt, which the
 * live path stopped calling on 7 May. Every coach's stage was recorded and never sent. The session
 * emphasis had its own defect: every session ran the narrow profile (see session-emphasis.unit.ts).
 *
 * So this test runs the real assembleActivities with the OpenAI call intercepted, and asserts on the
 * exact messages sent. It covers only the two variant settings Christian asked to be corrected
 * before the audit. What else the live prompt does or does not carry is audit evidence, not asserted.
 *
 * Run: part of `npm test`. No network: the intercepted call returns non-JSON and assembly stops.
 */
import assert from 'node:assert/strict'

import Session, { SessionEmphasis, SessionStatus } from '../../models/session.model'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { gateCandidateGameFormsToContext } from '../sport-module/context-selection'
import { resolvePrimaryScoringDirectives } from '../sport-module/primary-scoring'
import { generateSelection } from '../test-library/generateSelection'
import { systemAssemblyInputFromTestLibrarySelection } from '../test-library/systemAssemblyInputFromSelection'

// completion.service builds its OpenAI client when it loads, so the key must exist before it is required.
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-unit-test-no-network'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OpenAI = require('openai').default
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { assembleActivities } = require('../../services/completion.service') as typeof import('../../services/completion.service')

const GOAL = 'Play Out from the Back'

/** The exact text of every message the live assembly sends, for one planning choice. */
async function livePrompt(options: { stage?: string; emphasis?: SessionEmphasis }): Promise<string> {
    const captured: string[] = []
    const proto = OpenAI.Chat.Completions.prototype
    const original = proto.create
    const log = console.log
    proto.create = async function (body: { messages: Array<{ content: unknown }> }) {
        captured.push(body.messages.map((m) => String(m.content)).join('\n'))
        return { choices: [{ message: { content: 'not json: prompt captured, model not called' } }], usage: {} }
    }
    console.log = () => undefined
    try {
        const selection = generateSelection(
            { learningGoals: [GOAL], learningGoalId: 'A01' },
            gateCandidateGameFormsToContext(deriveInputConstraints(GOAL), 'RPC-001')
        )
        const session = new Session({
            name: 'live prompt test',
            sessionStatus: SessionStatus['In Progress'],
            playerCount: 12,
            fieldLength: '40',
            fieldWidth: '30',
            ...(options.emphasis ? { sessionEmphasis: options.emphasis } : {}),
        })
        const input = systemAssemblyInputFromTestLibrarySelection({
            selection,
            session: session as never,
            previousActivities: [],
            coachInput: {
                challengeLevel: 'medium',
                duration: 20,
                learningGoals: [GOAL],
                learningGoalId: 'A01',
                learningStage: options.stage,
                primaryScoring: resolvePrimaryScoringDirectives('RPC-001', selection.archetype.game_form_id),
            },
        })
        await assembleActivities(input).catch(() => undefined)
    } finally {
        proto.create = original
        console.log = log
    }
    assert.equal(captured.length, 1, 'one model call per assembly')
    return captured[0]!
}

async function testTheLearningStageReachesTheModel(): Promise<void> {
    const building = await livePrompt({ stage: 'building_understanding' })
    assert.match(building, /LEARNING STAGE — BUILDING UNDERSTANDING/)
    assert.match(building, /Increase representative pressure so recognition has to happen under realistic time and space\./)

    const exploring = await livePrompt({ stage: 'first_time_exploring' })
    assert.match(exploring, /LEARNING STAGE — FIRST TIME EXPLORING/)
    assert.doesNotMatch(exploring, /BUILDING UNDERSTANDING/, 'a different stage sends a different directive')

    // The free-text form asks no stage, and none may be invented.
    assert.doesNotMatch(await livePrompt({}), /LEARNING STAGE/)
}

async function testTheSessionEmphasisReachesTheModelAsResolved(): Promise<void> {
    assert.match(await livePrompt({}), /Session emphasis: Discovering solutions\./, 'an unchosen emphasis is the differentiated profile')
    assert.match(
        await livePrompt({ emphasis: SessionEmphasis['Applying Solutions Under Pressure'] }),
        /Session emphasis: Applying solutions under pressure\./,
        'a chosen emphasis is honoured'
    )
}

async function main(): Promise<void> {
    await testTheLearningStageReachesTheModel()
    await testTheSessionEmphasisReachesTheModelAsResolved()
    console.log('live-assembly-prompt unit tests: all cases passed.')
    process.exit(0)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
