/**
 * The live route's checked pathway (the live-app fix, 22 October 2026, design section 4) — exercised as the route exercises it.
 *
 * Christian, reply filed 25 October 2026, item 8: *"The live application's requirement for at least one library constraint remains a pilot
 * blocker and should be corrected systemically, without inserting an unjustified constraint into this activity."*
 *
 * What is pinned, on the production chain unless a block says TEST-ONLY:
 *   - G1: the pathway is read from the selection trace's constraint authority alone, and for the production records it is the checked
 *     pathway exactly for the goals that have an evaluated record;
 *   - the record-backed goal at 12 players with one and two of the specialized role, and at 11 with one, is served by the live pathway
 *     EXACTLY as the review page serves it (deep-equal), with no library constraint, and refused in the review page's own sentence where
 *     the review page refuses (none of the role; the practice situation its realization was not designed for);
 *   - G2, G3, G4 refuse in the checked pathway's own sentences, never a new one;
 *   - G6 (TEST-ONLY copies of the records): another goal given an evaluated, empty record routes to the checked pathway and is refused at its
 *     own stage, with no fallback; a record authorizing one constraint serves only what it authorizes; a record not yet evaluated stays the
 *     knowledge gap the route already answers;
 *   - the unconsumed-inputs sentence (decision 9(b)) is DRAFT and not served;
 *   - H4, disclosure before input (the d26 design's section 5.3, Option A): GET /session-planning's `inputUse` - for the goal built by the
 *     checked pathway, the three inputs it does not read, the situation it does not cover and the DRAFT line in the present tense; on
 *     TEST-ONLY copies (G6) another goal given an evaluated, empty record shows the line, an unevaluated record shows none, a covered
 *     situation's contract withholds it, and a covering alternative removes a situation from those marked;
 *   - L3, the save: the server's own build is kept only where every input digest is the one the coach saw;
 *   - L3 hardening (stage A re-review): an edit writes none of the stored-build fields, by a top-level key, a dotted path or an update
 *     operator, and an unexpected failure of the checked pathway is recorded under its own stage.
 *
 * The bundle the route serves is measured separately (npm run snapshot: every live/<goal> entry).
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { contractCoverage, knowledgeKey } from '../derivation/run-bounded-selection'
import { loadProvisionalRealizations, PROVISIONAL_REALIZATIONS_FILE, provisionalRealizationNamed, readJson } from '../derivation/corpus'
import { guidedGoalText, guidedSelectionHints } from '../sport-module/guided-selection'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { generateSelection, isSelectionKnowledgeGap } from '../test-library/generateSelection'
import { learningGoalSelectionHolds } from '../test-library/learning-design-holds'
import { learningGoalAuthorizations, LearningGoalAuthorization, realizationAlternativesOf } from '../test-library/learning-goal-authorizations'
import { testLibraryRegistry } from '../test-library/library/registry'
import type { TestLibrarySelectionResult } from '../test-library/types'
import { reviewActivity, reviewActivityBuild } from './activity-review'
import { ActivityBuild, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import {
    CHECKED_CHAIN,
    CHECKED_PATHWAY_FAILURE_STAGE,
    checkedSave,
    CheckedSaveRequestError,
    editableUpdateOf,
    INPUT_USE_NOTE,
    liveCheckedActivity,
    livePathwayOf,
    liveSelectionFor,
    NOT_COVERED_WORDS,
    PLANNING_INPUT_FIELD,
    planningInputUse,
    SAVE_NOT_AS_SHOWN,
    selectionDisagreements,
    UNCONSUMED_INPUTS_NOTE,
    unconsumedInputsNote,
} from './live-activity'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
console.log = () => undefined

const [ROLE] = specializedRoleNames()
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
/** A stored session as Mongo holds one. */
/**
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3): a stored session states that it has no goal unless a test states its own. Since
 * K3 the record-backed goal's record tries its goal version first, and a session that has not said what goals it has is asked first (his
 * reply filed 26 October 2026, item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as
 * confirmation that no goal exists."); with none stated it is the zone version, as before. The goal version, with the goal a coach states
 * from the list (the FA 5v5 goal), is served by the live pathway exactly as the review page serves it too (below).
 */
const NO_GOAL = { goal: { count: 0 } }
const FA_GOAL = { goal: { count: 1, type: 'scaled', widthM: 3.6576 } }
const stored = (keepers: number, over: Record<string, unknown> = {}) => ({ playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: keepers }, objects: NO_GOAL, ...over })
const NOT_PASSED = 'The game built for this activity did not pass its own checks, so it is not being shown.'
const RECORD_GOALS = learningGoalAuthorizations().map(record => record.learningGoalId)
assert.equal(RECORD_GOALS.length, 1, 'one goal has an authorization record today; this file is written for that state and must be revisited when another does')
const [GOAL] = RECORD_GOALS
const live = liveSelectionFor(GOAL, 'medium')
const inputs = (over: Partial<{ practiceSituationId: string | null; durationMin: unknown }> = {}) => ({ learningGoalId: GOAL, practiceSituationId: null, durationMin: 20, ...over })
const served = (outcome: ReturnType<typeof liveCheckedActivity>, what: string) => {
    assert.equal(outcome.outcome, 'served', `${what}: ${outcome.outcome === 'refused' ? `${outcome.cause} ${outcome.activity.summary} ${JSON.stringify(outcome.activity.reasons)}` : ''}`)
    return outcome as Extract<typeof outcome, { outcome: 'served' }>
}
const refusedWith = (outcome: ReturnType<typeof liveCheckedActivity>, cause: string, what: string) => {
    assert.equal(outcome.outcome, 'refused', `${what} must be refused`)
    const refusal = outcome as Extract<typeof outcome, { outcome: 'refused' }>
    assert.equal(refusal.cause, cause, `${what}: ${refusal.activity.summary}`)
    return refusal
}

/* ── G1: the pathway, from the constraint authority alone ─────────────────────────────────────────────────────────────────────────── */
{
    const trace = (constraintAuthority?: string) => ({ selectionTrace: { constraintPool: constraintAuthority ? { constraintAuthority } : undefined } }) as unknown as TestLibrarySelectionResult
    assert.equal(livePathwayOf(trace('AUTHORIZATION_RECORD')), CHECKED_CHAIN)
    assert.equal(livePathwayOf(trace('VOCABULARY_POOL')), 'GENERATION')
    assert.equal(livePathwayOf(trace()), 'GENERATION', 'a trace with no pool account is generated, as before')
    // Free text: hints derived from wording carry no authority, so it never reaches the checked pathway.
    assert.equal(livePathwayOf(generateSelection({ learningGoals: ['Keep the ball under pressure and play forward through midfield'] })), 'GENERATION')

    // Every guided goal, as the route selects it: the checked pathway exactly where an evaluated record exists, generation elsewhere.
    for (const goal of sessionPlanningModel.learningGoals() as any[]) {
        const id = String(goal.ID)
        let selection: TestLibrarySelectionResult | null = null
        try {
            selection = liveSelectionFor(id, 'medium')
        } catch (error) {
            assert.ok(isSelectionKnowledgeGap(error), `${id}: selection either selects or is a knowledge gap: ${String(error)}`)
        }
        if (!selection) continue
        const expected = RECORD_GOALS.includes(id) ? CHECKED_CHAIN : 'GENERATION'
        assert.equal(livePathwayOf(selection), expected, id)
        // A selection the generation route builds always carries library constraints, so its foundation requirement never blocks one for lack of one.
        if (expected === 'GENERATION') assert.ok(selection.constraints.length >= 2, `${id}: generation receives a selection with constraints`)
    }
    // The save's selection is the route's: the same text, hints and id give the same selection.
    const text = guidedGoalText(GOAL)
    assert.deepEqual(live, generateSelection({ learningGoals: [text], challengeLevel: 'medium', learningGoalId: GOAL }, guidedSelectionHints(GOAL, text).hints))
}

/* ── The record-backed goal on the live pathway is the review page's activity ────────────────────────────────────────────────────── */
{
    // Re-pointed 24 October 2026 (K3): each role case with no goal (the zone version) and with the FA 5v5 goal (the goal version).
    for (const [players, keepers, objects] of [[12, 1, NO_GOAL], [12, 2, NO_GOAL], [11, 1, NO_GOAL], [12, 1, FA_GOAL], [12, 2, FA_GOAL], [11, 1, FA_GOAL]] as const) {
        const session = stored(keepers, { playerCount: players, objects })
        const outcome = served(liveCheckedActivity(session, inputs(), live), `${GOAL} at ${players}/${keepers} ${JSON.stringify(objects)}`)
        const review = reviewActivity(session, { learningGoalId: GOAL, durationMin: 20 })
        assert.deepEqual(outcome.activity, review, `${GOAL} at ${players}/${keepers}: the live activity is the review page's, whole`)
        assert.deepEqual(outcome.activity.account.constraints, [], 'no library constraint is served')
        assert.equal(outcome.activity.account.constraintSource?.constraintAuthority, 'AUTHORIZATION_RECORD')
        assert.ok(!('evidence' in outcome.activity) && !('overviewDraft' in outcome.activity) && !('diagramDraft' in outcome.activity), "the coach's build: nothing for an administrator")
        assert.ok(outcome.activity.overview && outcome.activity.diagram, 'the Coach Overview and the diagram are served, as on the review page')
        const blocks = outcome.activity.roleBlocks?.blocks.map(block => block.blockId) ?? ['ONE_GAME']
        assert.deepEqual(outcome.inputDigests.map(entry => entry.blockId), blocks, 'one input digest per block, in block order')
        assert.ok(outcome.inputDigests.every(entry => typeof entry.inputDigest === 'string' && /^[0-9a-f]{8}$/.test(entry.inputDigest)))
        // The digests are the ones the build stamped, as the review build returns them.
        assert.deepEqual(outcome.inputDigests, reviewActivityBuild(session, { learningGoalId: GOAL, durationMin: 20 }).inputDigests)
    }
    // A session change the coach cannot see is still a different build: availability moves the digests.
    const one = served(liveCheckedActivity(stored(1), inputs(), live), 'one').inputDigests
    const two = served(liveCheckedActivity(stored(2), inputs(), live), 'two').inputDigests
    assert.notDeepEqual(one.map(entry => entry.inputDigest), two.map(entry => entry.inputDigest))

    // G4: refused where the review page refuses, in its sentence, and nothing else is tried.
    const noneAvailable = refusedWith(liveCheckedActivity(stored(0), inputs(), live), 'CHECKED_REFUSAL', 'none of the role')
    assert.deepEqual(noneAvailable.activity, reviewActivity(stored(0), { learningGoalId: GOAL, durationMin: 20 }))
    assert.equal(noneAvailable.activity.summary, `This game needs 1 ${ROLE} in all and the session has 0.`)
    const notStated = refusedWith(liveCheckedActivity({ playerCount: 12, fieldLength: '40', fieldWidth: '30' }, inputs(), live), 'CHECKED_REFUSAL', 'availability not stated')
    assert.equal(notStated.activity.stage, 'session')
    assert.equal(notStated.activity.summary, `Say whether this session has ${ROLE}s before building an activity.`)

    // Practice situations: the one its realization was not designed for is refused as the checked chain refuses it; the others serve the
    // review page's text (the situation is recorded in the account only, having no contract).
    const record = learningGoalAuthorizations().find(entry => entry.learningGoalId === GOAL)!
    // Re-pointed 26 October 2026 (Stage F): the record names its realizations as an ordered list; the one built is the first that can be tried.
    const notFor = provisionalRealizationNamed(realizationAlternativesOf(record).find(alternative => alternative.selectable)!.realization)!.notWithPracticeSituations.map(situation => situation.id)
    const review = reviewActivity(stored(1), { learningGoalId: GOAL, durationMin: 20 }) as ServedActivity
    for (const situation of sessionPlanningModel.practiceSituationsFor(GOAL) as any[]) {
        const id = String(situation.ID)
        const outcome = liveCheckedActivity(stored(1), inputs({ practiceSituationId: id }), live)
        if (notFor.includes(id)) {
            const refusal = refusedWith(outcome, 'CHECKED_REFUSAL', id)
            assert.equal(refusal.activity.stage, 'knowledge')
            assert.equal(refusal.activity.summary, "This goal's first activity was not designed for the chosen practice situation, so no activity can be built for it.")
            continue
        }
        const activity = served(outcome, id).activity
        assert.deepEqual(activity.rendered, review.rendered, `${id}: the same text`)
        assert.deepEqual([activity.overview, activity.diagram], [review.overview, review.diagram], `${id}: the same overview and diagram`)
        assert.deepEqual(activity.account.selectedWithoutContract, [id], `${id}: recorded in the account, contributing nothing`)
        assert.deepEqual({ ...activity, account: { ...activity.account, selectedWithoutContract: [] } }, { ...review, account: { ...review.account, selectedWithoutContract: [] } })
    }
    assert.ok(notFor.length > 0, 'the realization names a situation it was not designed for')
    // A situation of another goal names nothing that could be built: a malformed request, never a refusal.
    const otherGoal = (sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID)).find(id => id !== GOAL && sessionPlanningModel.practiceSituationsFor(id).length > 0)!
    assert.throws(() => liveCheckedActivity(stored(1), inputs({ practiceSituationId: String((sessionPlanningModel.practiceSituationsFor(otherGoal) as any[])[0].ID) }), live), /is not a practice situation of/)
}

/* ── G3 and G2: a disagreement is refused in the checked pathway's own sentence ─────────────────────────────────────────────────── */
{
    // G3, TEST-ONLY copies of the live selection: another game form, an extra constraint, a different lens.
    const altered = (alter: (copy: any) => void) => {
        const copy = JSON.parse(JSON.stringify(live))
        alter(copy)
        return copy as TestLibrarySelectionResult
    }
    const otherLens = testLibraryRegistry.affordanceLenses().find(lens => !live.affordanceLenses.some(own => own.id === lens.id))!
    const someConstraint = testLibraryRegistry.selectableConstraints()[0]
    for (const [what, copy] of [
        ['game form', altered(c => (c.archetype.game_form_id = 'TEST-ONLY-FORM'))],
        ['constraints', altered(c => c.constraints.push({ id: someConstraint.id }))],
        ['lenses', altered(c => (c.affordanceLenses[0] = { id: otherLens.id }))],
    ] as const) {
        const refusal = refusedWith(liveCheckedActivity(stored(1), inputs(), copy), 'SELECTIONS_DISAGREE', `a disagreement in ${what}`)
        assert.equal(refusal.activity.summary, NOT_PASSED, 'the checked pathway\'s own sentence; no new one')
        assert.equal(refusal.activity.stage, 'validation')
        assert.ok(refusal.activity.reasons.every(reason => reason.startsWith('the live and checked selections disagree: ')))
        assert.ok(refusal.activity.reasons.some(reason => reason.includes(`${what}:`)), JSON.stringify(refusal.activity.reasons))
    }
    // Spellings of one object are one object: ids are compared by knowledge key.
    const respelled = altered(c => (c.archetype.game_form_id = `blind:${c.archetype.game_form_id}`))
    assert.equal(knowledgeKey(respelled.archetype.game_form_id), knowledgeKey(live.archetype.game_form_id))
    const checkedSelection = reviewActivityBuild(stored(1), { learningGoalId: GOAL, durationMin: 20 }).selection!
    assert.deepEqual(selectionDisagreements(respelled, checkedSelection), [])
    assert.deepEqual(selectionDisagreements(live, checkedSelection), [], 'production: the two selections agree')
}

/* ── G6 (TEST-ONLY copies of the records) ─────────────────────────────────────────────────────────────────────────────────────────── */
{
    const testRecord = (goalId: string, authorizedConstraints: string[] | null): LearningGoalAuthorization => ({
        learningGoalId: goalId,
        contextId: 'TEST-ONLY',
        gameProblemId: 'TEST-ONLY',
        ruledOn: 'TEST-ONLY',
        by: 'test',
        ruling: ['TEST-ONLY: never production data'],
        authorizedConstraints,
        authorizedConstraintsFinding: 'TEST-ONLY',
        excluded: [],
        manipulations: [],
    })
    const selectUnder = (goalId: string, records: LearningGoalAuthorization[]) =>
        generateSelection({ learningGoals: [guidedGoalText(goalId)], challengeLevel: 'medium', learningGoalId: goalId }, guidedSelectionHints(goalId, guidedGoalText(goalId), records).hints)
    const buildUnder = (records: LearningGoalAuthorization[], keepers: number, goalId: string) => (body: { practiceSituationId?: unknown }): ActivityBuild =>
        buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId, situationId: (body.practiceSituationId as string) ?? null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } } }, records)

    // (a) Another goal given an evaluated, empty record routes to the checked pathway and is refused at ITS OWN stage, with no fallback:
    // every goal the generation route builds today, one at a time.
    const generated = (sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID)).filter(id => {
        try {
            return livePathwayOf(liveSelectionFor(id, 'medium')) === 'GENERATION'
        } catch {
            return false
        }
    })
    assert.ok(generated.length > 0)
    for (const goalId of generated) {
        const records = [...learningGoalAuthorizations(), testRecord(goalId, [])]
        const selection = selectUnder(goalId, records)
        assert.equal(livePathwayOf(selection), CHECKED_CHAIN, `${goalId} with a TEST-ONLY evaluated, empty record`)
        assert.deepEqual(selection.constraints, [], `${goalId}: no constraint is inserted`)
        const outcome = liveCheckedActivity(stored(1), { learningGoalId: goalId, practiceSituationId: null, durationMin: 20 }, selection, buildUnder(records, 1, goalId))
        const direct = buildUnder(records, 1, goalId)({}).activity
        if (direct.outcome === 'refused') {
            const refusal = refusedWith(outcome, 'CHECKED_REFUSAL', goalId)
            assert.deepEqual(refusal.activity, direct, `${goalId}: the checked pathway's own refusal, unchanged`)
        } else {
            assert.deepEqual(served(outcome, goalId).activity, direct, `${goalId}: served exactly as the checked pathway serves it`)
        }
    }

    // (b) A record authorizing one constraint: today's selection cannot combine one constraint into a game, so it is the knowledge gap the
    // route already answers (never generation, never the checked branch); and a served activity passes G2 only with what its record authorizes.
    const record = learningGoalAuthorizations().find(entry => entry.learningGoalId === GOAL)!
    const holds = new Set(learningGoalSelectionHolds().map(hold => knowledgeKey(hold.knowledgeId)))
    const excluded = new Set(record.excluded.map(entry => knowledgeKey(entry.knowledgeId)))
    const usable = testLibraryRegistry.selectableConstraints().filter(c => !holds.has(knowledgeKey(c.id)) && !excluded.has(knowledgeKey(c.id)))
    const uncontracted = usable.filter(c => contractCoverage([{ id: c.id, role: 'foundation constraint' }]).contracted.length === 0)
    assert.ok(uncontracted.length >= 2, 'two library constraints with no contract to stand in (TEST-ONLY)')
    const [authorized, other] = uncontracted
    const one = learningGoalAuthorizations().map(entry => (entry.learningGoalId === GOAL ? { ...entry, authorizedConstraints: [authorized.id] } : entry))
    assert.throws(() => selectUnder(GOAL, one), (error: unknown) => isSelectionKnowledgeGap(error), 'one authorized constraint cannot be combined today: the gap')
    // G2 on a TEST-ONLY build that carries a constraint (added to a copy of its selection, whose copy of the record authorizes `authorizes`):
    // the authorized one passes, any other is refused. The live selection's copy carries the same constraint, so G3 agrees.
    const carrying = (id: string, authorizes: string[] | null) => (): ActivityBuild =>
        buildActivityUnderAuthorizationRecords(
            // Re-pointed 24 October 2026 (K3): the session states no goal, as stored(1) does (NO_GOAL above).
            { kind: 'learning-goal', goalId: GOAL, situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: 1 }, objects: NO_GOAL } },
            learningGoalAuthorizations(),
            {
                alterSelection: selection => {
                    selection.selected.push({ id, role: 'foundation constraint' })
                    if (authorizes) selection.authorization = { ...selection.authorization!, authorizedConstraints: authorizes }
                },
            },
        )
    const liveCarrying = (id: string) => ({ ...JSON.parse(JSON.stringify(live)), constraints: [{ id }] }) as TestLibrarySelectionResult
    const servedOne = served(liveCheckedActivity(stored(1), inputs(), liveCarrying(authorized.id), carrying(authorized.id, [authorized.id])), 'the authorized constraint')
    assert.deepEqual(servedOne.activity.account.constraints.map(c => c.id), [authorized.id], 'only what the record authorizes is served')
    const unauthorized = refusedWith(liveCheckedActivity(stored(1), inputs(), liveCarrying(other.id), carrying(other.id, [authorized.id])), 'CONSTRAINT_NOT_AUTHORIZED', 'a constraint the record does not authorize')
    assert.equal(unauthorized.activity.summary, NOT_PASSED)
    assert.ok(unauthorized.activity.reasons[0].includes(other.id) && unauthorized.activity.reasons[0].includes('does not authorize it'))
    // Production's record authorizes none, so the same constraint is refused under it.
    refusedWith(liveCheckedActivity(stored(1), inputs(), liveCarrying(authorized.id), carrying(authorized.id, null)), 'CONSTRAINT_NOT_AUTHORIZED', 'any constraint, under the production record')

    // (c) A record not yet evaluated stays the gap the route answers: selection refuses before any pathway is chosen.
    const unevaluated = learningGoalAuthorizations().map(entry => (entry.learningGoalId === GOAL ? { ...entry, authorizedConstraints: null } : entry))
    assert.throws(() => selectUnder(GOAL, unevaluated), (error: unknown) => isSelectionKnowledgeGap(error) && (error as any).reason === 'NO_AUTHORIZED_CONSTRAINTS')
}

/* ── Decision 9(b): the sentence is DRAFT and not served ─────────────────────────────────────────────────────────────────────────── */
{
    assert.equal(UNCONSUMED_INPUTS_NOTE.status, 'DRAFT')
    assert.equal(UNCONSUMED_INPUTS_NOTE.approved, false, 'stays off until he approves decision 9(b)')
    for (const planning of [null, {}, { practiceSituationId: 'any' }, { learningStage: 'building_understanding' }, { practiceSituationId: 'any', learningStage: 'any' }]) {
        assert.equal(unconsumedInputsNote(planning), null, JSON.stringify(planning))
    }
}

/* ── H4: disclosure before input (the d26 design's section 5.3, Option A) ─────────────────────────────────────────────────────── */
{
    const record = learningGoalAuthorizations().find(entry => entry.learningGoalId === GOAL)!
    const offered = (id: string) => (sessionPlanningModel.practiceSituationsFor(id) as any[]).map(situation => String(situation.ID))
    // Production: exactly the goals the live route builds by the checked pathway get an entry - today the one record-backed goal.
    const use = planningInputUse()
    assert.deepEqual(Object.keys(use), RECORD_GOALS, 'an entry exactly for each goal built by the checked pathway')
    const own = use[GOAL]
    const notFor = provisionalRealizationNamed(realizationAlternativesOf(record).find(alternative => alternative.selectable)!.realization)!.notWithPracticeSituations.map(situation => situation.id)
    assert.deepEqual(own, {
        learningGoalId: GOAL,
        pathway: CHECKED_CHAIN,
        unread: ['PRACTICE_SITUATION', 'LEARNING_STAGE', 'NOTE'],
        notCovered: offered(GOAL).filter(id => notFor.includes(id)),
        note: { words: INPUT_USE_NOTE.words, status: 'DRAFT' },
        notCoveredWords: NOT_COVERED_WORDS,
    })
    assert.ok(own.notCovered.length === 1 && offered(GOAL).length > own.notCovered.length, 'one situation is not covered, and the others remain choosable')
    // The words: his accepted sentence in the present tense (DRAFT), and the mark; the sentence he accepted is kept beside it, unserved.
    assert.equal(INPUT_USE_NOTE.words, 'The practice situation you choose, where your players are with this learning, and any note you add do not change this activity yet.')
    assert.equal(INPUT_USE_NOTE.accepted.words, UNCONSUMED_INPUTS_NOTE.words)
    assert.equal(NOT_COVERED_WORDS, 'Not covered by this activity yet.')
    // The situation it does not cover is refused by the live route exactly as the review page refuses it; the others build the same activity.
    const refusedThere = liveCheckedActivity(stored(1), inputs({ practiceSituationId: own.notCovered[0] }), live)
    assert.equal(refusedThere.outcome, 'refused')
    // Computed once per process, and handed out as a copy.
    use[GOAL].unread = []
    assert.deepEqual(planningInputUse()[GOAL].unread, ['PRACTICE_SITUATION', 'LEARNING_STAGE', 'NOTE'])
    // The stage and the note reach no field of the checked inputs; the route's call passes exactly the three fields it reads.
    assert.deepEqual(PLANNING_INPUT_FIELD, { PRACTICE_SITUATION: 'practiceSituationId', LEARNING_STAGE: null, NOTE: null })
    const routes = fs.readFileSync(path.join(__dirname, '../../routes/app.routes.ts'), 'utf8')
    assert.ok(routes.includes('outcome = liveCheckedActivity(stored, { learningGoalId, practiceSituationId: planning?.practiceSituationId ?? null, durationMin: duration }, selection)'))
    assert.ok(fs.readFileSync(path.join(__dirname, 'live-activity.ts'), 'utf8').includes('build({ learningGoalId: inputs.learningGoalId, practiceSituationId: inputs.practiceSituationId, durationMin: inputs.durationMin })'))
    // GET /session-planning surfaces it beside the registry, deciding nothing itself.
    assert.ok(routes.includes('inputUse: planningInputUse(),'))

    // G6, TEST-ONLY copies of the records.
    const testRecord = (goalId: string, authorizedConstraints: string[] | null): LearningGoalAuthorization => ({
        learningGoalId: goalId,
        contextId: 'TEST-ONLY',
        gameProblemId: 'TEST-ONLY',
        ruledOn: 'TEST-ONLY',
        by: 'test',
        ruling: ['TEST-ONLY: never production data'],
        authorizedConstraints,
        authorizedConstraintsFinding: 'TEST-ONLY',
        excluded: [],
        manipulations: [],
    })
    const generated = (sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID)).filter(id => {
        try {
            return livePathwayOf(liveSelectionFor(id, 'medium')) === 'GENERATION'
        } catch {
            return false
        }
    })
    // (a) Another goal given an evaluated, empty record: built by the checked pathway, so it shows the line where it offers situations and
    // none has a contract, and withholds it where it offers none (the line names the situation; it is never composed from fragments).
    const withSituations = generated.find(id => offered(id).length > 0)!
    const evaluated = planningInputUse({ records: [...learningGoalAuthorizations(), testRecord(withSituations, [])] })
    assert.deepEqual(Object.keys(evaluated).sort(), [GOAL, withSituations].sort())
    assert.deepEqual([evaluated[withSituations].unread, evaluated[withSituations].note, evaluated[withSituations].notCovered], [['PRACTICE_SITUATION', 'LEARNING_STAGE', 'NOTE'], { words: INPUT_USE_NOTE.words, status: 'DRAFT' }, []])
    const withoutSituations = generated.find(id => offered(id).length === 0)
    if (withoutSituations) {
        const bare = planningInputUse({ records: [...learningGoalAuthorizations(), testRecord(withoutSituations, [])] })[withoutSituations]
        assert.deepEqual([bare.unread, bare.note], [['LEARNING_STAGE', 'NOTE'], null], `${withoutSituations}: no situation, so the line is withheld`)
    }
    // (b) A record not yet evaluated: selection refuses it, so no line is shown for it.
    const unevaluated = learningGoalAuthorizations().map(entry => (entry.learningGoalId === GOAL ? { ...entry, authorizedConstraints: null } : entry))
    assert.deepEqual(Object.keys(planningInputUse({ records: unevaluated })), [], 'refused at selection: no disclosure')
    // (c) A covered situation with a contract the derivation loads makes the situation read, so the line is withheld (the rest still
    // reported). A situation NOT covered never reaches derivation, so its contract does not: in production the one not covered has one.
    const firstCovered = offered(GOAL).find(id => !own.notCovered.includes(id))!
    const contracted = planningInputUse({ contracted: id => id === firstCovered })[GOAL]
    assert.deepEqual([contracted.unread, contracted.note], [['LEARNING_STAGE', 'NOTE'], null])
    assert.deepEqual(contractCoverage([{ id: own.notCovered[0], role: 'practice situation' }]).contracted, [own.notCovered[0]], 'measured: the situation not covered has a contract')
    assert.ok(offered(GOAL).filter(id => !own.notCovered.includes(id)).every(id => contractCoverage([{ id, role: 'practice situation' }]).contracted.length === 0), 'and no covered one does')
    const onlyUncovered = planningInputUse({ contracted: id => own.notCovered.includes(id) })[GOAL]
    assert.deepEqual(onlyUncovered.note, own.note, 'a contract on a situation not covered leaves the line as it is')
    // (d) A later alternative that covers a situation keeps it available: TEST-ONLY, the goal version made selectable and covering it.
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const variant = file.realizations.find((entry: any) => entry.id === record.realizations![0].realization)
    variant.notWithPracticeSituations = []
    const realizations = loadProvisionalRealizations(file)
    const selectable = learningGoalAuthorizations().map(entry =>
        entry.learningGoalId === GOAL ? { ...entry, realizations: entry.realizations!.map(alternative => ({ realization: alternative.realization, words: alternative.words, citedAs: alternative.citedAs })) } : entry,
    )
    const covered = planningInputUse({ records: selectable, realizations })[GOAL]
    assert.deepEqual(covered.notCovered, [], 'every alternative must exclude a situation for it to be marked')
    assert.equal(covered.notCoveredWords, null)
    // And with both alternatives excluding it, it is marked again.
    assert.deepEqual(planningInputUse({ records: selectable, realizations: loadProvisionalRealizations(readJson(PROVISIONAL_REALIZATIONS_FILE)) })[GOAL].notCovered, own.notCovered)
    // The front shows the line before the answers, marks a situation not covered, lets the stage be skipped and drops the false helper.
    const front = fs.readFileSync(path.join(__dirname, '../../../../front/src/app/SessionPlanningConversation.tsx'), 'utf8')
    for (const shown of ['{inputUse?.note && <InputUseNote words={inputUse.note.words} />}', 'disabled={notCovered}', 'Continue without choosing', "{!noteUnread && <p className='mt-2 text-sm text-gray-500'>Optional — this adds detail to the activity.</p>}"]) {
        assert.ok(front.includes(shown), shown)
    }
    assert.ok(front.indexOf('{inputUse?.note && <InputUseNote') < front.indexOf('{situations.map((situation) => {'), 'the line comes before the situations')
}

/* ── L3: the save keeps the server's own build only where it is the one the coach saw ───────────────────────────────────────────── */
{
    const shown = served(liveCheckedActivity(stored(1), inputs(), live), 'shown')
    const body = (over: Record<string, unknown> = {}) => ({
        pathway: CHECKED_CHAIN,
        checkedInputs: { learningGoalId: GOAL, practiceSituationId: null, durationMin: 20 },
        inputDigests: shown.inputDigests,
        challengeLevel: 'medium',
        // The client's copy is never read: a tampered one is ignored.
        checkedActivity: { title: 'TEST-ONLY tampered copy' },
        ...over,
    })
    const saved = checkedSave(stored(1), body())
    assert.equal(saved.outcome, 'saved', JSON.stringify(saved))
    if (saved.outcome === 'saved') {
        assert.deepEqual(saved.activity, shown.activity, "the server's own build is stored, whole")
        assert.deepEqual(saved.inputs, { learningGoalId: GOAL, practiceSituationId: null, durationMin: 20 })
        assert.deepEqual(saved.inputDigests, shown.inputDigests)
        // What is stored goes into a document as it is: no key Mongo would refuse or rewrite.
        const badKeys: string[] = []
        const walk = (value: unknown, at: string) => {
            if (Array.isArray(value)) return value.forEach((entry, i) => walk(entry, `${at}[${i}]`))
            if (value && typeof value === 'object') for (const [key, entry] of Object.entries(value)) {
                if (key.includes('.') || key.startsWith('$')) badKeys.push(`${at}.${key}`)
                walk(entry, `${at}.${key}`)
            }
        }
        walk(saved.activity, 'checkedActivity')
        assert.deepEqual(badKeys, [], 'no key with a dot or a leading dollar')
    }
    // A digest that differs (the session changed in between, here its availability), the rebuild refusing, the pathway gone: refused.
    const tampered = checkedSave(stored(1), body({ inputDigests: shown.inputDigests.map((entry, i) => (i === 0 ? { ...entry, inputDigest: '00000000' } : entry)) }))
    assert.deepEqual([tampered.outcome, tampered.outcome === 'refused' && tampered.summary], ['refused', SAVE_NOT_AS_SHOWN])
    const changed = checkedSave(stored(2), body())
    assert.equal(changed.outcome, 'refused', 'availability changed after the coach was shown the activity')
    assert.ok(changed.outcome === 'refused' && changed.reasons[0].startsWith('the input digests differ'))
    const nowRefused = checkedSave(stored(0), body())
    assert.ok(nowRefused.outcome === 'refused' && nowRefused.summary === SAVE_NOT_AS_SHOWN && nowRefused.reasons[0].includes('building it again now refuses'))
    const fewer = checkedSave(stored(1), body({ inputDigests: shown.inputDigests.slice(0, 1) }))
    assert.equal(fewer.outcome, 'refused', 'a block missing is a different activity')
    const vocabulary = checkedSave(stored(1), body(), () => ({ ...JSON.parse(JSON.stringify(live)), selectionTrace: { ...live.selectionTrace, constraintPool: { ...live.selectionTrace.constraintPool!, constraintAuthority: 'VOCABULARY_POOL' } } }))
    assert.ok(vocabulary.outcome === 'refused' && vocabulary.reasons[0].includes('no longer built by the checked pathway'))
    const gap = checkedSave(stored(1), body(), () => {
        throw new Error('TEST-ONLY selection refusal')
    })
    assert.ok(gap.outcome === 'refused' && gap.reasons[0].includes('the selection now refuses'))
    // A request that names nothing is malformed, never a refusal of an activity.
    assert.throws(() => checkedSave(stored(1), body({ inputDigests: [] })), CheckedSaveRequestError)
    assert.throws(() => checkedSave(stored(1), body({ inputDigests: [{ blockId: 'x' }] })), CheckedSaveRequestError)
    assert.throws(() => checkedSave(stored(1), body({ checkedInputs: { practiceSituationId: null } })), CheckedSaveRequestError)
    // The sentence is one plain sentence with no identifier in it (DRAFT).
    assert.equal(SAVE_NOT_AS_SHOWN.split(/[.!?](\s|$)/).filter(part => part && part.trim()).length, 2, 'two short sentences')

    // The K3 review's should-fix (24 October 2026): the goal version, served where the session states the FA 5v5 goal, saves as shown, and
    // a save after the session changed - its goal statement now none, or its availability - is refused, never stored.
    const goalShown = served(liveCheckedActivity(stored(1, { objects: FA_GOAL }), inputs(), live), 'the goal version shown')
    assert.notDeepEqual(goalShown.inputDigests, shown.inputDigests, 'a different activity from the zone version')
    const goalBody = body({ inputDigests: goalShown.inputDigests })
    const goalSaved = checkedSave(stored(1, { objects: FA_GOAL }), goalBody)
    assert.equal(goalSaved.outcome, 'saved', JSON.stringify(goalSaved))
    if (goalSaved.outcome === 'saved') assert.deepEqual([goalSaved.activity, goalSaved.inputDigests], [goalShown.activity, goalShown.inputDigests], "the goal version's own build is stored, whole")
    for (const [session, what] of [[stored(1), 'the goal statement changed to none'], [stored(2, { objects: FA_GOAL }), 'availability changed']] as const) {
        const refused = checkedSave(session, goalBody)
        assert.ok(refused.outcome === 'refused' && refused.summary === SAVE_NOT_AS_SHOWN, `${what}: ${JSON.stringify(refused)}`)
    }
}

/* ── L3 hardening (stage A re-review, 23 October 2026): no edit replaces the stored build, under any spelling Mongo applies ─────────── */
{
    const body = {
        _id: 'TEST-ONLY-ID',
        title: 'TEST-ONLY edited title',
        coachComments: 'TEST-ONLY',
        'session.note': 'TEST-ONLY',
        checkedActivityNote: 'TEST-ONLY another field',
        // The four fields, at the top level (removed before this fix too) ...
        checkedActivity: { title: 'TEST-ONLY' },
        checkedInputs: { learningGoalId: 'TEST-ONLY' },
        inputDigests: [],
        pathway: 'GENERATION',
        // ... by a dotted path and by an update operator (each reached Mongo before this fix).
        'checkedActivity.rendered': 'TEST-ONLY',
        'inputDigests.0': 'TEST-ONLY',
        'pathway.x': 'TEST-ONLY',
        $set: { checkedActivity: { title: 'TEST-ONLY' } },
        $unset: { pathway: 1 },
        $rename: { title: 'pathway' },
    }
    assert.deepEqual(editableUpdateOf(body), {
        _id: 'TEST-ONLY-ID',
        title: 'TEST-ONLY edited title',
        coachComments: 'TEST-ONLY',
        'session.note': 'TEST-ONLY',
        checkedActivityNote: 'TEST-ONLY another field',
    })
    const plainEdit = { _id: 'TEST-ONLY-ID', title: 'TEST-ONLY', rules: ['TEST-ONLY'], scoringSystem: 'TEST-ONLY' }
    assert.deepEqual(editableUpdateOf(plainEdit), plainEdit, 'an edit naming none of them passes exactly as before')
    // The edit route updates a stored activity through it, and nowhere else; an unexpected failure of the checked pathway has its own stage.
    const routes = fs.readFileSync(path.join(__dirname, '../../routes/app.routes.ts'), 'utf8')
    assert.ok(routes.includes('await Activity.findByIdAndUpdate(body._id, editableUpdateOf(body))'))
    assert.equal(routes.split('Activity.findByIdAndUpdate(').length - 1, 1, 'the one update of a stored activity')
    assert.ok(routes.includes("const failureStage = error instanceof SystemPipelineError ? error.stage : checkedBuild ? CHECKED_PATHWAY_FAILURE_STAGE : 'ai-assembly'"))
    assert.equal(routes.split('checkedBuild = true').length - 1, 1, 'set only where the checked pathway is entered')
    assert.equal(CHECKED_PATHWAY_FAILURE_STAGE, 'checked-pathway')
}

/* ── No goal, form, context, role or sport noun in the live pathway's code ───────────────────────────────────────────────────────── */
{
    const source = fs.readFileSync(path.join(__dirname, 'live-activity.ts'), 'utf8')
    const code = source
        .split('/*')
        .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2)))
        .join(' ')
        .split('\n')
        .map(line => (line.trimStart().startsWith('//') ? '' : line.split(' // ')[0]))
        .join('\n')
    const goalIds = new Set((sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID)))
    assert.deepEqual((code.match(/[A-Za-z0-9-]+/g) ?? []).filter(word => goalIds.has(word) || /^(GF\d+|RPC-\d+|GP-\d+)$/.test(word)), [], 'no goal, form, context or Game Problem id in code')
    for (const word of specializedRoleNames()) assert.ok(!source.toLowerCase().includes(word.toLowerCase()), `no specialized role named (${word})`)
}

console.log = quiet
console.log('live-activity unit tests: all cases passed.')
