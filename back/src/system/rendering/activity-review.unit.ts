/**
 * The activity review, exercised exactly as the route exercises it — and for whether it can REFUSE.
 *
 * Christian, 13 October 2026: *"The review page should accept any of the thirteen Learning Goals and use the
 * coach's actual session context. … The system should not silently assume that no goalkeepers are
 * available. Where an activity cannot be generated, I'd prefer a brief, understandable explanation rather
 * than a generic failure."*
 *
 * `reviewActivity` is everything the POST route decides; the handler around it only finds the session and
 * checks whose it is. So this file is the route's test without a server or a database, and what it calls is
 * what the route calls.
 *
 * Most of it is negative, for the reason the rendering tests are: a builder that only ever serves is not
 * evidence. Ten of the thirteen goals cannot be built today and each must say so, at the stage where it
 * stops, in a sentence with no identifier in it. A session that states too little must be asked for what is
 * missing rather than given a number.
 *
 * The specialized role is read from the register throughout, so this file names none either.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { ActivityReviewRequestError, activityReviewOptions, reviewActivity } from './activity-review'
import { buildActivity, RefusedActivity, ServedActivity, UnknownActivityRequest } from './build-activity'
import { buildPilotActivity, isPilotRefused, PILOT_SESSION } from './build-pilot-activity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { sessionEnvelopeFrom, specializedRoleNames } from './session-envelope'

const ROLES = specializedRoleNames()
assert.ok(ROLES.length > 0, 'the register must name a specialized role, or the availability question has no subject')
const [ROLE] = ROLES
const none = Object.fromEntries(ROLES.map(role => [role, 0]))

/** A stored session as Mongo holds one: the count a number, the area two bare numeric strings in metres. */
const stored = (over: Record<string, unknown> = {}) => ({ playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none }, ...over })

const served = (activity: ServedActivity | RefusedActivity, what: string): ServedActivity => {
    assert.equal(activity.outcome, 'served', `${what} must be served; refused at ${(activity as RefusedActivity).stage}: ${JSON.stringify((activity as RefusedActivity).reasons)}`)
    return activity as ServedActivity
}
const refused = (activity: ServedActivity | RefusedActivity, what: string): RefusedActivity => {
    assert.equal(activity.outcome, 'refused', `${what} must be refused`)
    return activity as RefusedActivity
}

/**
 * **A summary is for a coach, so nothing in it may be an identifier.** Checked by shape rather than by a list
 * of known ids, so an id nobody has thought of yet is caught too: a library or contract prefix, a check id, a
 * line id's `::`, a game-form, goal, context or Game Problem code.
 */
const IDENTIFIERS = [/\bGA-[A-Z]/, /\bGF\d/, /\bGP-\d/, /\bRPC-\d/, /\b(A|D|TA|TD)\d\d\b/, /tl-v0/, /::/, /\b(restated|blind):/, /\bc:[a-z]/, /NOT_EVALUABLE|DEFERRED|\bFAIL\b/, /[a-z]\.[a-z]+\[/]
const plain = (activity: RefusedActivity, what: string) => {
    assert.ok(activity.summary.trim().length > 0, `${what}: a refusal must say something`)
    for (const pattern of IDENTIFIERS) assert.doesNotMatch(activity.summary, pattern, `${what}: the summary must contain no id or check name — "${activity.summary}"`)
    assert.equal(activity.summary.split(/[.!?](\s|$)/).filter(part => part && part.trim()).length, 1, `${what}: the summary is ONE sentence — "${activity.summary}"`)
    assert.ok(activity.reasons.length > 0, `${what}: the engine's own reasons must travel for the technical account`)
}
const text = (activity: ServedActivity, section: string) => activity.rendered.instructions.filter(i => i.section === section).map(i => i.text)

// ── A04 through the review is the pilot's activity, to the letter ─────────────────────────────────
//
// His instruction for the pilot route was that it *"serve the same validated, rendered activity without
// introducing unverified transformations"*. The pilot is now a thin caller of the general builder, so this
// is the assertion that the generalisation moved nothing: the same goal at the same session gives the same
// rendered activity — every instruction, status, citation and observation, not only the words.
{
    const pilot = buildPilotActivity()
    assert.ok(!isPilotRefused(pilot), `the pilot must still be served: ${JSON.stringify((pilot as any).because)}`)
    const review = served(
        reviewActivity(
            { playerCount: PILOT_SESSION.players, fieldLength: String(PILOT_SESSION.lengthM), fieldWidth: String(PILOT_SESSION.widthM), specializedRoles: { ...none } },
            { learningGoalId: 'A04', durationMin: PILOT_SESSION.durationMin },
        ),
        'A04 at the pilot session',
    )
    assert.deepEqual(review.rendered, (pilot as any).rendered, 'the review must serve exactly what the pilot serves')
    assert.deepEqual(review.integrity, (pilot as any).integrity)
    assert.equal(review.integrity.fidelityViolations, 0)
    assert.equal(review.kind, 'learning-goal')
    assert.equal(review.title, 'Beat Defenders 1v1')
    assert.equal(review.subtitle, 'Eliminate individual defenders.')

    // The pilot's own account is read from the run now, and still reads what it always did.
    assert.equal((pilot as any).provenance.signalGroup, 'J_attacking_duel', 'the signal group comes from the selection, not from a literal')
    assert.equal((pilot as any).provenance.gameForm, review.account.gameForm.id)

    /**
     * **An UNRESOLVED Game Problem is built and is never filled in.** No translation is approved for this
     * goal, so the account says so; nothing is substituted, and what the wording implies is not offered as
     * the answer in its place.
     */
    assert.deepEqual(review.account.gameProblem, { status: 'UNRESOLVED', gameProblemId: null, name: null, inferredFromWording: null, governed: false })
    assert.equal(review.account.gameForm.contracted, true)
    assert.ok(review.account.constraints.length > 0 && review.account.constraints.every(c => !c.contracted), 'this goal selects constraints and none of them shapes the game yet')
    assert.deepEqual(review.account.selectedWithoutContract, review.account.constraints.map(c => c.id))
}

// ── The two goals that select the same game form are served, from the same realization choices ────
//
// They were refused before the choices were looked up by game form: the file was named for A04 and read
// because the goal was A04, though every line it closes is the game form's.
{
    const a04 = served(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20 }), 'A04')
    for (const goalId of ['D01', 'D03']) {
        const activity = served(reviewActivity(stored(), { learningGoalId: goalId, durationMin: 20 }), goalId)
        assert.equal(activity.integrity.fidelityViolations, 0)
        assert.deepEqual(
            activity.rendered.instructions.map(i => i.text),
            a04.rendered.instructions.map(i => i.text),
            `${goalId} selects the same game form and nothing else contracted, so today it is the identical game — which is a finding about the knowledge, not a defect here`,
        )
        assert.equal(activity.account.gameProblem?.status, 'APPROVED', `${goalId} has an approved Game Problem`)
        assert.ok(activity.account.gameProblem?.gameProblemId && activity.account.gameProblem.name, 'and the account names it')
    }
    // Where the approved translation and the wording disagree, the approved one is the goal's Game Problem.
    const d03 = served(reviewActivity(stored(), { learningGoalId: 'D03', durationMin: 20 }), 'D03').account.gameProblem!
    assert.equal(d03.governed, true)
    assert.notEqual(d03.gameProblemId, d03.inferredFromWording, 'the inference is carried beside it and is not it')
}

/**
 * ── The other ten goals are refused, each at the stage where it stops ─────────────────────────────
 *
 * **Baseline of 13 October 2026.** These are the goals the pathway cannot build today, and why:
 *
 *   - `knowledge` — the goal's game form has no contribution contract, so there is no game to derive;
 *   - `structure`, incomplete rule — the goal selects the Pass Combination Gate, whose references Gate A
 *     cannot yet evaluate. Out of scope for this stage and left refused deliberately;
 *   - `structure`, not described completely — the goal's game form is contracted and fails Gate A.
 *
 * A goal moving OUT of this table is the work succeeding, and the entry should then be removed with the
 * reason. A goal moving between rows, or a new one arriving, is a change in the knowledge to be explained.
 */
{
    const INCOMPLETE = 'This goal selects a rule whose description is still incomplete, so the activity cannot be checked yet.'
    const NOT_DESCRIBED = 'The game this goal selects is not yet described completely enough to be set up.'
    const NOT_BUILT = 'This goal uses a game form that has not been built into the activity engine yet.'
    const expected: Record<string, [RefusedActivity['stage'], string]> = {
        A01: ['structure', INCOMPLETE],
        A02: ['knowledge', NOT_BUILT],
        A03: ['knowledge', NOT_BUILT],
        A05: ['structure', INCOMPLETE],
        A06: ['knowledge', NOT_BUILT],
        D02: ['structure', NOT_DESCRIBED],
        TA01: ['structure', NOT_DESCRIBED],
        TA02: ['structure', INCOMPLETE],
        TD01: ['structure', NOT_DESCRIBED],
        TD02: ['structure', NOT_DESCRIBED],
    }
    const options = activityReviewOptions()
    assert.deepEqual(
        options.goals.map(g => g.id).filter(id => !['A04', 'D01', 'D03'].includes(id)).sort(),
        Object.keys(expected).sort(),
        'every goal the page offers is either served above or accounted for here',
    )
    for (const [goalId, [stage, summary]] of Object.entries(expected)) {
        const activity = refused(reviewActivity(stored(), { learningGoalId: goalId, durationMin: 20 }), goalId)
        assert.equal(activity.stage, stage, `${goalId} must stop at ${stage}; it stopped at ${activity.stage}: ${JSON.stringify(activity.reasons)}`)
        assert.equal(activity.summary, summary, goalId)
        plain(activity, goalId)
        assert.equal(activity.title, options.goals.find(g => g.id === goalId)!.name, 'a refusal is still titled by the goal the coach chose')
        // What selection established before the refusal is kept, so the account can show how far it got.
        assert.ok(activity.account.gameForm?.id, `${goalId}: the selected game form survives into the refusal's account`)
        assert.equal(activity.account.gameForm!.contracted, stage !== 'knowledge', `${goalId}: and says whether it is built`)
    }
}

// ── A session that does not fit the game is refused in the coach's terms ──────────────────────────
{
    // An odd count does not split into the equal teams the game form requires. The roster rule names the
    // cause and the numbers; the sentence is built from those and not from the gate's own report.
    const nine = refused(reviewActivity(stored({ playerCount: 9 }), { learningGoalId: 'A04', durationMin: 20 }), '9 players')
    assert.equal(nine.stage, 'session')
    assert.equal(nine.summary, '9 players cannot be split into the equal teams this game needs.')
    assert.ok(nine.reasons.some(reason => reason.includes('DOES_NOT_DIVIDE')), 'the cause travels in the reasons')
    assert.ok(nine.reasons.some(reason => reason.includes('GA-ROSTER-SUM')), `and so does what the gate itself reported: ${JSON.stringify(nine.reasons)}`)
}

/**
 * ── THE SESSION BOUNDARY DEFAULTS NOTHING ─────────────────────────────────────────────────────────
 *
 * Each of these was measured before the boundary existed. With no area the pathway threw. With no
 * statement about specialized roles it either refused opaquely or — through the pilot's inherited envelope —
 * proceeded on a zero nobody had stated. Zero players was SERVED as "2 teams of 0".
 */
{
    const at = (session: Record<string, unknown>, body: Record<string, unknown> = {}) =>
        refused(reviewActivity(session, { learningGoalId: 'A04', durationMin: 20, ...body }), JSON.stringify([session, body]))
    const session = (activity: RefusedActivity, summary: string) => {
        assert.equal(activity.stage, 'session', activity.summary)
        assert.equal(activity.summary, summary)
        plain(activity, summary)
    }

    session(at(stored({ fieldLength: undefined, fieldWidth: undefined })), 'This session has no playing area yet — add its length and width.')
    session(at(stored({ fieldWidth: '' })), 'The playing area needs both a length and a width, in metres and more than zero.')
    session(at(stored({ playerCount: undefined })), 'This session has no player count yet — add the number of players.')
    for (const players of [0, -4, 7.5, '12']) session(at(stored({ playerCount: players })), 'The number of players in this session must be a whole number, 1 or more.')
    session(at(stored(), { durationMin: undefined }), 'Say how long this activity should run, in minutes.')
    session(at(stored(), { durationMin: 0 }), 'The length of the activity must be a number of minutes, more than zero.')

    // **Not stated is not none.** The question is asked by the role's name, which is the register's.
    const QUESTION = `Say whether this session has ${ROLE}s before building an activity.`
    session(at(stored({ specializedRoles: undefined })), QUESTION)
    session(at(stored({ specializedRoles: {} })), QUESTION)
    session(at(stored({ specializedRoles: { [ROLE]: null } })), QUESTION)
    session(at(stored({ specializedRoles: { [ROLE]: -1 } })), `The number of ${ROLE}s must be a whole number, 0 or more.`)
    session(at(stored(), { roles: { 'no-such-role': 1 } }), 'This session names a kind of player the activity engine does not know: no-such-role.')
    // Availability is people IN the session. A game that involves none never compares the two, so this is
    // the only place an impossible count can be caught.
    session(at(stored(), { roles: { [ROLE]: 13 } }), `This session lists more ${ROLE}s than it has players.`)
    served(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20, roles: { [ROLE]: 12 } }), 'every player in the role is still a session that adds up')

    // A width longer than the length is SAID, not swapped: swapping would build a different pitch silently.
    const wide = at(stored({ fieldLength: '25', fieldWidth: '30' }))
    assert.equal(wide.stage, 'session')
    assert.equal(wide.summary, "This session's playing area is entered as 25 m long by 30 m wide — the length needs to be the longer side.")

    // Everything missing is listed, and the summary is the first of it.
    const bare = at({})
    assert.equal(bare.summary, bare.reasons[0])
    assert.equal(bare.reasons.length, 3, `players, area and availability are each asked for: ${JSON.stringify(bare.reasons)}`)

    // The review's statement CONFIRMS OR ADJUSTS the stored one — for this review, and without touching it.
    const saved = stored({ specializedRoles: undefined })
    const frozen = JSON.stringify(saved)
    served(reviewActivity(saved, { learningGoalId: 'A04', durationMin: 20, roles: { [ROLE]: 0 } }), 'a role stated only in the review')
    assert.equal(JSON.stringify(saved), frozen, 'the stored session is read and never written')
    assert.deepEqual(
        (sessionEnvelopeFrom(stored({ specializedRoles: { [ROLE]: 1 } }), { durationMin: 20, roles: { [ROLE]: 3 } }) as any).session.roles,
        { [ROLE]: 3 },
        'the review overrides the stored value',
    )
    assert.deepEqual(
        (sessionEnvelopeFrom(stored({ specializedRoles: { [ROLE]: -1 } }), { durationMin: 20, roles: { [ROLE]: 2 } }) as any).session?.roles,
        { [ROLE]: 2 },
        'and a usable statement is not refused on account of the stored one it replaces',
    )
    // The coach's own numbers reach the activity as numbers — the area is stored as strings.
    assert.deepEqual((sessionEnvelopeFrom(stored(), { durationMin: 25 }) as any).session, { players: 12, lengthM: 40, widthM: 30, durationMin: 25, roles: none })
}

/**
 * ── AVAILABILITY IS NOT INVOLVEMENT, end to end ───────────────────────────────────────────────────
 *
 * The defect this closes, measured 13 October: with one specialized performer available per team this game
 * was served as "12 players in total / 2 teams of 5" with no word about the other two and 0 violations.
 * The game's knowledge involves none, so everyone plays and the activity says so.
 */
{
    const activity = served(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20, roles: { [ROLE]: 2 } }), 'two available')
    assert.deepEqual(text(activity, 'Players').slice(0, 3), ['12 players in total', '2 teams of 6', `This activity does not use ${ROLE}s — everyone plays as an outfield player`])
    assert.equal(activity.integrity.fidelityViolations, 0)
    assert.equal(activity.session.roles[ROLE], 2, 'the session reported back is the one the coach stated')

    const zero = served(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20 }), 'none available')
    assert.deepEqual(text(zero, 'Players').slice(0, 3), ['12 players in total', '2 teams of 6', `No ${ROLE}s — everyone is an outfield player`])
    // Nothing else about the activity depends on how many were available.
    assert.deepEqual(text(activity, 'Set up'), text(zero, 'Set up'))
    assert.deepEqual(text(activity, 'How to score'), text(zero, 'How to score'))
}

// ── The coach's own session shapes the activity ───────────────────────────────────────────────────
{
    const activity = served(reviewActivity(stored({ playerCount: 16, fieldLength: '50', fieldWidth: '35' }), { learningGoalId: 'A04', durationMin: 15 }), '16 players, 50 x 35')
    assert.ok(text(activity, 'Set up').includes('Mark out an area 50 m long by 35 m wide'))
    assert.ok(text(activity, 'Players').includes('2 teams of 8'))
    assert.ok(text(activity, 'How it works').includes('Play for 15 minutes'))
    assert.deepEqual(activity.session, { players: 16, lengthM: 50, widthM: 35, durationMin: 15, roles: none })
}

/**
 * ── MECHANISM DEMONSTRATIONS — engineering demonstrations, not Learning Goal activities ───────────
 *
 * His words: *"Intermediate mechanism demonstrations are useful, but they should remain clearly identified
 * as such"*, and not *"changing learning-design knowledge merely to make those demonstrations pass."* So a
 * demonstration names its own knowledge, claims no goal, and is held to every check a goal's activity is.
 */
{
    const modifier = served(reviewActivity(stored(), { demonstrationId: 'scoring-modifier', durationMin: 20 }), 'the scoring-modifier demonstration at 40 x 30')
    assert.equal(modifier.kind, 'mechanism-demonstration', 'what it is travels to the output')
    assert.equal(modifier.account.gameProblem, null, 'no Learning Goal, so no Game Problem to belong to one')
    assert.equal(modifier.account.contextId, null)
    assert.equal(modifier.title, 'Scoring modifier')
    assert.ok(String(modifier.subtitle).includes('Not a Learning Goal activity'), 'and it says so wherever it is shown')
    // Baseline of 13 October, measured at this session: 22 instructions and 0 violations.
    assert.equal(modifier.rendered.instructions.length, 22)
    assert.equal(modifier.integrity.fidelityViolations, 0)
    assert.deepEqual(modifier.account.constraints.map(c => c.contracted), [true], 'its one constraint is contracted, so it actually shapes the game')
    assert.ok(text(modifier, 'How to score').some(t => /worth 2 instead of 1/.test(t)), 'and the mechanism it demonstrates is in the activity')

    /**
     * **The neutral-player demonstration is REFUSED today, and that is the honest state of the mechanism.**
     * Its contract leaves the neutral count open and nothing has chosen one, so there is no single game to
     * show. Completing it is Stage B3; until then this must refuse rather than be made to pass. When B3
     * lands this block is the one to change, to a served assertion.
     */
    const neutrals = refused(reviewActivity(stored(), { demonstrationId: 'neutral-players', durationMin: 20 }), 'the neutral-players demonstration')
    assert.equal(neutrals.kind, 'mechanism-demonstration')
    assert.equal(neutrals.stage, 'realization')
    assert.equal(neutrals.summary, 'A set-up decision for this game has not been made yet.')
    plain(neutrals, 'neutral-players')

    // A demonstration is never described to a coach as a goal — in a refusal any more than in a title.
    const none9 = refused(reviewActivity(stored({ playerCount: 9 }), { demonstrationId: 'scoring-modifier', durationMin: 20 }), 'the demonstration with 9 players')
    assert.equal(none9.summary, '9 players cannot be split into the equal teams this game needs.')
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const outcome = reviewActivity(stored(), { demonstrationId: demonstration.id, durationMin: 20 })
        if (outcome.outcome === 'refused') assert.doesNotMatch(outcome.summary, /\bgoal\b/i, `${demonstration.id}: "${outcome.summary}"`)
    }
}

// ── A request that names nothing is REJECTED, not refused ─────────────────────────────────────────
//
// A refusal explains why an activity cannot be given. There is no activity an unknown id could have been,
// so there is nothing to explain and the route answers these as bad requests.
{
    assert.throws(() => reviewActivity(stored(), { learningGoalId: 'Z99', durationMin: 20 }), UnknownActivityRequest)
    assert.throws(() => reviewActivity(stored(), { demonstrationId: 'no-such-demonstration', durationMin: 20 }), UnknownActivityRequest)
    assert.throws(() => reviewActivity(stored(), { durationMin: 20 }), ActivityReviewRequestError, 'neither a goal nor a demonstration')
    assert.throws(() => reviewActivity(stored(), { learningGoalId: 'A04', demonstrationId: 'scoring-modifier', durationMin: 20 }), ActivityReviewRequestError, 'both')
    assert.throws(() => reviewActivity(stored(), null as any), ActivityReviewRequestError)
    // An unknown goal is rejected BEFORE the session is read, so it is never reported as the session's fault.
    assert.throws(() => reviewActivity({}, { learningGoalId: 'Z99' }), UnknownActivityRequest)
    assert.throws(
        () => buildActivity({ kind: 'learning-goal', goalId: 'A04', situationId: 'A01-02', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none } }),
        UnknownActivityRequest,
        'a practice situation that is not this goal\'s is an unknown request too',
    )
}

// ── What the page is offered ──────────────────────────────────────────────────────────────────────
{
    const options = activityReviewOptions()
    assert.equal(options.goals.length, 13, 'the thirteen Learning Goals')
    assert.equal(new Set(options.goals.map(g => g.id)).size, 13)
    for (const goal of options.goals) assert.ok(goal.id && goal.name && goal.definition && goal.phase, JSON.stringify(goal))
    // Phase by phase, in the planning model's own order: a phase is never interleaved with another.
    const phases = options.goals.map(g => g.phase)
    assert.deepEqual(phases.filter((phase, i) => phase !== phases[i - 1]), [...new Set(phases)], 'goals arrive grouped by phase')
    assert.deepEqual(options.demonstrations, MECHANISM_DEMONSTRATIONS.map(({ id, name, statement }) => ({ id, name, statement })))
    assert.ok(!options.goals.some(g => options.demonstrations.some(d => d.id === g.id || d.name === g.name)), 'a demonstration is never offered as a goal')
    assert.deepEqual(options.specializedRoles, ROLES, 'the roles to ask about are the register\'s')
}

console.log('activity-review.unit.ts — ok')
