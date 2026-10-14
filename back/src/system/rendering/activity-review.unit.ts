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

import { loadCorpusContracts, loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { ActivityReviewRequestError, activityReviewOptions, reviewActivity } from './activity-review'
import { buildActivity, buildActivityFromKnowledge, buildActivityOverAlteredKnowledge, RefusedActivity, ServedActivity, UnknownActivityRequest } from './build-activity'
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

    // The count is the coach's own number, so the sentence has to agree with it. Found in review: one
    // player was told "1 players cannot be split".
    const one = refused(reviewActivity(stored({ playerCount: 1 }), { learningGoalId: 'A04', durationMin: 20 }), '1 player')
    assert.equal(one.summary, '1 player cannot be split into the equal teams this game needs.')
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
    /**
     * **A name is refused because it was NAMED — whatever its count, and whatever it is spelled like.**
     * Both found in review, 13 October. A name with no count beside it was dropped before the name was
     * looked at, so the same unknown kind of player was refused with a number and served without one. And
     * the statements were merged into a plain object keyed by text from the request, so a role called
     * `__proto__` was assigned to that object's prototype, vanished, and was served.
     */
    session(at(stored(), { roles: { 'no-such-role': null } }), 'This session names a kind of player the activity engine does not know: no-such-role.')
    session(at(stored(), { roles: JSON.parse('{"__proto__": 1}') }), 'This session names a kind of player the activity engine does not know: __proto__.')
    session(at(stored({ specializedRoles: JSON.parse('{"__proto__": 0}') })), 'This session names a kind of player the activity engine does not know: __proto__.')
    // ...and a role is asked about even where its name is one every object answers to. The register names
    // no such role; the boundary must not depend on that.
    for (const inherited of ['constructor', 'toString', 'hasOwnProperty']) {
        const asked = sessionEnvelopeFrom(stored({ specializedRoles: undefined }), { durationMin: 20 }, [inherited])
        assert.deepEqual(asked, { outcome: 'not-stated', summary: `Say whether this session has ${inherited}s before building an activity.`, reasons: [`Say whether this session has ${inherited}s before building an activity.`] })
    }
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

/**
 * ── INVOLVEMENT, end to end — on knowledge the corpus does not hold yet ───────────────────────────
 *
 * Added in review, 13 October. Everything above shows the half of the rule the corpus can reach: a game
 * that involves none. No selected game form involves a specialized role today, so the other half — a team
 * that HOLDS one, a session that cannot staff it, and the sentence a coach gets for each — was pinned only
 * by writing a count straight onto a realized team. It passed while an AUTHORED count could not reach a
 * team at all: given a game form requiring one per team, two available was refused exactly as none was.
 *
 * So the real pathway is run here over a copy of this goal's game form with one item added — one of the
 * role per team, required. Nothing about the corpus is changed, and the last assertion proves it.
 */
{
    const [rowId] = [...indexRegister(loadRegister()).specializedRoleRows].find(([, role]) => role === ROLE)!
    const requiresOne = (over: Record<string, unknown> = {}) => (contracts: any[]) => {
        const form = contracts.find(c => (c.items ?? []).some((i: any) => String(i.row) === 'P1'))
        form.items.push({
            itemId: 'REVIEW-ROLE-ITEM',
            origId: 'REVIEW-ROLE-ITEM',
            row: rowId,
            selector: '*',
            requirement: 'EQUALS',
            value: '1',
            strictness: 'REQUIRED',
            valueStatus: 'REQUIRED_RANGE',
            scope: 'PER_TEAM',
            basis: 'AUTHORED',
            basisEvidence: 'a test fixture, not authored knowledge',
            checkability: 'STRUCTURAL',
            structuralClause: 'whole item',
            ...over,
        })
        form.declarations = (form.declarations ?? []).map((d: any) => (String(d.row) === rowId ? { ...d, declaration: 'CLAIMED', scope: 'PER_TEAM' } : d))
    }
    const at = (available: number, knowledge = requiresOne()) =>
        buildActivityOverAlteredKnowledge({ kind: 'learning-goal', goalId: 'A04', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { [ROLE]: available } } }, knowledge)

    // Two available for a game that involves one per team: derived, RENDERED, and nothing lost or invented.
    const staffed = served(at(2), 'one per team required, two available')
    assert.deepEqual(text(staffed, 'Players').slice(0, 3), ['12 players in total', '2 teams of 5', `Each team also has 1 ${ROLE}`])
    assert.equal(staffed.integrity.fidelityViolations, 0)
    assert.equal(staffed.integrity.postRealizationValidated, true)
    assert.deepEqual(staffed.integrity.acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
    const said = staffed.rendered.instructions.find(i => i.text === `Each team also has 1 ${ROLE}`)!
    assert.deepEqual([said.status, said.quantities], ['DERIVED', [1]], 'a count the knowledge requires is stated as derived, with its number declared')

    // More available than the game involves changes nothing a coach is told to set up.
    assert.deepEqual(text(served(at(5), 'five available'), 'Players'), text(staffed, 'Players'))

    // None, or one, for a game that needs two in all: refused in the coach's terms, with the numbers.
    for (const available of [0, 1]) {
        const short = refused(at(available), `one per team required, ${available} available`)
        assert.equal(short.stage, 'session', 'the coach can cure it, so it is the session that is refused')
        assert.equal(short.summary, `This game needs 1 ${ROLE} per team and the session has ${available}.`)
        plain(short, `${available} available`)
        assert.ok(short.reasons.some(reason => reason.includes('AVAILABILITY_SHORT')), JSON.stringify(short.reasons))
    }

    // Knowledge that speaks about the count without settling it for these teams is NOT the session's to
    // cure, so the coach is not told to change their numbers: the game is reported as failing its checks.
    const unsettled = refused(at(4, requiresOne({ selector: 'team=ATTACKING_TEAM' })), 'a count authored for one named team')
    assert.equal(unsettled.stage, 'validation')
    assert.equal(unsettled.summary, 'The game built for this activity did not pass its own checks, so it is not being shown.')
    plain(unsettled, 'unsettled involvement')
    assert.ok(unsettled.reasons.some(reason => reason.includes('INVOLVEMENT_NOT_SETTLED')), JSON.stringify(unsettled.reasons))

    // The loader's contracts are shared by every caller in the process. None of the above may have reached them.
    assert.ok(!JSON.stringify(loadCorpusContracts()).includes('REVIEW-ROLE-ITEM'), 'the alteration was made to a copy and to nothing else')
    assert.deepEqual(text(served(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20, roles: { [ROLE]: 2 } }), 'the goal itself, afterwards'), 'Players').slice(1, 3), [
        '2 teams of 6',
        `This activity does not use ${ROLE}s — everyone plays as an outfield player`,
    ])
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
    // Found in review: the account named it by its library id, because a name was looked up in one of the
    // library's two lists and this constraint is held in the other — as is at least one constraint of every
    // one of the thirteen goals. A title is a name, never an id, so every request is checked.
    assert.deepEqual(modifier.account.constraints.map(c => c.title), ['Wide Zone Advantage'])
    for (const request of [...activityReviewOptions().goals.map(g => ({ learningGoalId: g.id })), ...MECHANISM_DEMONSTRATIONS.map(d => ({ demonstrationId: d.id }))]) {
        const account = reviewActivity(stored(), { ...request, durationMin: 20 }).account
        for (const constraint of account.constraints ?? []) assert.notEqual(constraint.title, constraint.id, `${JSON.stringify(request)}: ${constraint.id} has no name in the account`)
    }
    assert.ok(text(modifier, 'How to score').some(t => /worth 2 instead of 1/.test(t)), 'and the mechanism it demonstrates is in the activity')

    /**
     * **SERVED AT EVERY SIZE, with the whole authored range said — pinned 13 October 2026.**
     *
     * Before this it was served at 40 × 30 and REFUSED at 30 × 25 and at 20 × 15, at the communication
     * stage, for nothing but its own arithmetic: a channel's width is a fraction of the area's width, and
     * lengths were printed rounded to one decimal place. A 25 m width gives a maximum of 6.25 m; the
     * activity said *"6.3 m"*; the fidelity check found 6.3 nowhere in the game and correctly refused it.
     * Lengths are now printed as the number the game holds.
     *
     * The same change made the sentence complete. It said *"up to 7.5 m wide"* and never the minimum beside
     * it — his ruling of 1 October gives a channel *"a minimum of 0.15 and a maximum of 0.25 of the available
     * across dimension"* — and the check now refuses a requirement stated by half.
     *
     * Three sizes because they are three different cases, not one case three times: at 40 × 30 the preferred
     * 6 to 10 m overlaps the requirement from 6 m up; at 30 × 25 only a 25 cm sliver of it does; at 20 × 15
     * none of it does, so nothing is offered and the requirement stands alone. That last one is his rule that
     * a preference *"must never override or widen the requirement"*, seen from the coach's side.
     */
    const at = (length: number, width: number) =>
        served(
            reviewActivity(stored({ fieldLength: String(length), fieldWidth: String(width) }), { demonstrationId: 'scoring-modifier', durationMin: 20 }),
            `the scoring-modifier demonstration at ${length} x ${width}`,
        )
    const expected: [number, number, number, string[]][] = [
        [
            40,
            30,
            22,
            [
                'Mark out an area 40 m long by 30 m wide',
                'For this activity, mark a line across one end of the area, 30 m long, on the end line itself',
                'For this activity, mark a line across the other end of the area, 30 m long, on the end line itself',
                'Mark a channel along one touchline, 40 m long and between 4.5 m and 7.5 m wide',
                'This channel is established as a perceptual reference',
                'Around 6 m to 7.5 m wide works well, if it suits your group',
                'Mark a channel along the opposite touchline, 40 m long and between 4.5 m and 7.5 m wide',
                'This channel is established as a perceptual reference',
                'Around 6 m to 7.5 m wide works well, if it suits your group',
            ],
        ],
        [
            30,
            25,
            22,
            [
                'Mark out an area 30 m long by 25 m wide',
                'For this activity, mark a line across one end of the area, 25 m long, on the end line itself',
                'For this activity, mark a line across the other end of the area, 25 m long, on the end line itself',
                'Mark a channel along one touchline, 30 m long and between 3.75 m and 6.25 m wide',
                'This channel is established as a perceptual reference',
                'Around 6 m to 6.25 m wide works well, if it suits your group',
                'Mark a channel along the opposite touchline, 30 m long and between 3.75 m and 6.25 m wide',
                'This channel is established as a perceptual reference',
                'Around 6 m to 6.25 m wide works well, if it suits your group',
            ],
        ],
        [
            20,
            15,
            20,
            [
                'Mark out an area 20 m long by 15 m wide',
                'For this activity, mark a line across one end of the area, 15 m long, on the end line itself',
                'For this activity, mark a line across the other end of the area, 15 m long, on the end line itself',
                'Mark a channel along one touchline, 20 m long and between 2.25 m and 3.75 m wide',
                'This channel is established as a perceptual reference',
                'Mark a channel along the opposite touchline, 20 m long and between 2.25 m and 3.75 m wide',
                'This channel is established as a perceptual reference',
            ],
        ],
    ]
    for (const [length, width, instructions, setUp] of expected) {
        const activity = at(length, width)
        assert.equal(activity.integrity.fidelityViolations, 0, `${length} x ${width}`)
        assert.equal(activity.integrity.postRealizationValidated, true)
        assert.deepEqual(activity.integrity.acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
        assert.equal(activity.rendered.instructions.length, instructions, `${length} x ${width}`)
        assert.deepEqual(text(activity, 'Set up'), setUp, `${length} x ${width}`)
        // Nothing but the area differs between them: the game is the same game on a different pitch.
        for (const section of ['Players', 'How it works', 'How to score']) assert.deepEqual(text(activity, section), text(modifier, section), `${length} x ${width}: ${section}`)
        // Every number said is declared, so every number said was checked — and none is a rounding.
        for (const said of activity.rendered.instructions) {
            assert.deepEqual([...said.text.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0])).filter(n => !said.quantities.includes(n)), [], said.text)
        }
    }
    // A width whose fraction has no exact binary form is still printed as the decimal it is: 0.15 × 23 is
    // 3.45, and the float product is 3.4499999999999997.
    const awkward = at(35, 23)
    assert.equal(awkward.integrity.fidelityViolations, 0)
    assert.ok(text(awkward, 'Set up').includes('Mark a channel along one touchline, 35 m long and between 3.45 m and 5.75 m wide'), JSON.stringify(text(awkward, 'Set up')))

    /**
     * **More sizes, read sentence by sentence in the review of 13 October 2026 and pinned as read.** Each is
     * here for a reason of its own: 33 × 21 is a width whose minimum (3.15) the float product misses and
     * whose preference lies outside the requirement; 45 × 35 is one where the preferred floor sits INSIDE the
     * requirement (5.25 to 8.75, preferred from 6); 100 × 64 is one where the requirement's floor (9.6) is
     * ABOVE the preferred floor, so the preference offered is 9.6 to 10 and never 6; 30.5 × 22.2 is an area a
     * coach typed with decimals; and 40 × 24 is the one width where the preference meets the requirement at
     * a single point, so it is offered as one number — a sentence shape no other size produces. Every number
     * is one the game holds, with no digit added or dropped.
     */
    const read: [number, number, string, string | null][] = [
        [40, 24, 'between 3.6 m and 6 m wide', 'Around 6 m wide works well, if it suits your group'],
        [33, 21, 'between 3.15 m and 5.25 m wide', null],
        [45, 35, 'between 5.25 m and 8.75 m wide', 'Around 6 m to 8.75 m wide works well, if it suits your group'],
        [100, 64, 'between 9.6 m and 16 m wide', 'Around 9.6 m to 10 m wide works well, if it suits your group'],
        [30.5, 22.2, 'between 3.33 m and 5.55 m wide', null],
    ]
    for (const [length, width, required, preference] of read) {
        const activity = at(length, width)
        assert.equal(activity.integrity.fidelityViolations, 0, `${length} x ${width}`)
        const setUp = text(activity, 'Set up')
        assert.deepEqual(
            setUp.filter(sentence => sentence.startsWith('Mark a channel')),
            [`Mark a channel along one touchline, ${length} m long and ${required}`, `Mark a channel along the opposite touchline, ${length} m long and ${required}`],
            `${length} x ${width}`,
        )
        const offered = activity.rendered.instructions.filter(i => i.status === 'PREFERENCE').map(i => i.text)
        assert.deepEqual(offered, preference ? [preference, preference] : [], `${length} x ${width}: the preference is offered only inside the requirement, and as a PREFERENCE`)
        // No number a coach reads is a float artefact: each prints as the short decimal it is.
        for (const said of activity.rendered.instructions) {
            for (const [number] of said.text.matchAll(/\d+(?:\.\d+)?/g)) assert.ok(number.length <= 6, `"${number}" in "${said.text}"`)
        }
    }

    /**
     * **THE NEUTRAL-PLAYERS DEMONSTRATION IS SERVED — re-pointed 13 October 2026 (Stage B3).**
     *
     * Until then this block asserted that it was REFUSED at `realization` with *"A set-up decision for this
     * game has not been made yet."*, and said that was the honest state of the mechanism: its contract leaves
     * the neutral count open and nothing chose one. Three things were missing and each is now in place, none
     * of them a change to learning-design knowledge:
     *
     *   - the count is closed by the rule his 13 October instruction approved for a count with an authored
     *     preferred range — the one member of *"one or two"* that leaves two whole equal teams in THIS
     *     session — and is recorded as where the activity starts, with its range beside it;
     *   - the roster rule reads a count realization closed, so the teams get a size and the roster gate can
     *     be evaluated (it could not, for any neutral configuration);
     *   - the renderer says who the neutral players are — it said nothing about them at all.
     *
     * Christian, 13 October: *"It is entirely appropriate to demonstrate the mechanism independently in the
     * meantime"* — and of the condition and any Learning Goal, *"I am not yet approving"* it. So this remains
     * a mechanism demonstration, labelled as one, and is associated with no goal and in no candidate pool.
     *
     * Twelve players and thirteen, because they are the two cases: an even squad starts with two neutrals and
     * an odd one with one. Every sentence is a DRAFT for his wording review.
     */
    const NEUTRAL_ACTIVITY: [number, string[]][] = [
        [
            12,
            [
                '12 players in total',
                '2 teams of 5',
                `No ${ROLE}s — everyone is an outfield player`,
                'For this activity, 2 of the 12 players are neutral players, so the team with the ball has 2 more players than the team without it',
                'The game needs at least 1 neutral player',
                'Around 1 to 2 neutral players works well, if it suits your group',
                'The neutral players always play with whichever team has the ball, and change sides when possession changes',
                'Make the neutral players easy to tell apart from both teams — contrasting bibs',
                'The neutral players are active in the game — not waiting, resting or watching',
                'For this activity, one team starts with the ball — the game does not fix which, so pick one and tell both teams before you start',
            ],
        ],
        [
            13,
            [
                '13 players in total',
                '2 teams of 6',
                `No ${ROLE}s — everyone is an outfield player`,
                'For this activity, 1 of the 13 players is a neutral player, so the team with the ball has 1 more player than the team without it',
                'The game needs at least 1 neutral player',
                'Around 1 to 2 neutral players works well, if it suits your group',
                'The neutral player always plays with whichever team has the ball, and changes sides when possession changes',
                'Make the neutral player easy to tell apart from both teams — contrasting bibs',
                'The neutral player is active in the game — not waiting, resting or watching',
                'For this activity, one team starts with the ball — the game does not fix which, so pick one and tell both teams before you start',
            ],
        ],
    ]
    const a04 = served(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20 }), 'A04')
    for (const [players, expectedPlayers] of NEUTRAL_ACTIVITY) {
        const neutrals = served(reviewActivity(stored({ playerCount: players }), { demonstrationId: 'neutral-players', durationMin: 20 }), `the neutral-players demonstration with ${players} players`)
        assert.equal(neutrals.kind, 'mechanism-demonstration')
        assert.equal(neutrals.account.gameProblem, null, 'no Learning Goal, so no Game Problem')
        assert.equal(neutrals.account.contextId, null)
        assert.equal(neutrals.title, 'Neutral players')
        assert.ok(String(neutrals.subtitle).includes('Not a Learning Goal activity'))
        assert.deepEqual(neutrals.account.constraints.map(c => [c.title, c.contracted]), [['Neutral Player Condition', true]])
        // Baseline of 13 October, measured: 18 instructions and 0 violations, at both sizes — the bare
        // possession game's 12, plus the six sentences about the neutral players.
        assert.equal(neutrals.rendered.instructions.length, 18, `${players} players`)
        assert.equal(a04.rendered.instructions.length, 12)
        assert.equal(neutrals.integrity.fidelityViolations, 0)
        assert.equal(neutrals.integrity.postRealizationValidated, true)
        assert.deepEqual(neutrals.integrity.acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
        assert.deepEqual(text(neutrals, 'Players'), expectedPlayers, `${players} players`)
        // The neutral condition changes who plays and nothing about the pitch or the scoring: every other
        // section is the bare possession game's, sentence for sentence. And what continues at a change of
        // possession is said ONCE, though two contracts assert that transition here.
        for (const section of ['Set up', 'How to score']) assert.deepEqual(text(neutrals, section), text(a04, section), `${players} players: ${section}`)
        assert.deepEqual(text(neutrals, 'How it works'), ['Play for 20 minutes', 'Play continues when possession changes — there is no stoppage'])
        assert.deepEqual(text(neutrals, 'How it works'), text(a04, 'How it works'))
        for (const said of neutrals.rendered.instructions) {
            assert.deepEqual([...said.text.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0])).filter(n => !said.quantities.includes(n)), [], said.text)
        }
    }

    // The session shapes it, as it shapes any activity: the squad decides the starting count and the sizes.
    for (const [players, count, size] of [[8, 2, 3], [15, 1, 7], [16, 2, 7], [3, 1, 1]] as const) {
        const activity = served(reviewActivity(stored({ playerCount: players }), { demonstrationId: 'neutral-players', durationMin: 20 }), `${players} players`)
        assert.equal(text(activity, 'Players')[1], `2 teams of ${size}`, `${players} players`)
        assert.ok(text(activity, 'Players')[3].startsWith(`For this activity, ${count} of the ${players} players ${count === 1 ? 'is a neutral player' : 'are neutral players'}`), text(activity, 'Players')[3])
        assert.equal(activity.integrity.fidelityViolations, 0)
    }

    /**
     * **A session too small for any preferred count is the SESSION's refusal.** With two players, one neutral
     * leaves one for two teams and two leave nobody, so no count is closed and the line is still open. That
     * used to reach a coach as *"A set-up decision for this game has not been made yet"* — true of the line,
     * and not something they can act on. It is their numbers, so it says so.
     */
    for (const [players, summary] of [
        [2, '2 players cannot be split into equal teams with 1 or 2 neutral players.'],
        [1, '1 player cannot be split into equal teams with 1 or 2 neutral players.'],
    ] as const) {
        const small = refused(reviewActivity(stored({ playerCount: players }), { demonstrationId: 'neutral-players', durationMin: 20 }), `${players} players`)
        assert.equal(small.stage, 'session', small.summary)
        assert.equal(small.summary, summary)
        plain(small, `${players} players`)
        assert.ok(small.reasons.some(reason => reason.includes('game::P5 is open and was not chosen')), 'the engine\'s own reason travels beside it')
        assert.ok(small.reasons.some(reason => reason.includes('DOES_NOT_DIVIDE') || reason.includes('NO_OUTFIELD_PLAYERS')), JSON.stringify(small.reasons))
    }

    /**
     * **A count the KNOWLEDGE fixes, in a session that cannot field it** — on knowledge the corpus does not
     * hold, through the tests-only entry, and never served. The neutral condition as authored leaves the
     * count open, so the roster rule's own refusal sentences for a neutral game cannot be reached on the
     * corpus: the rule that closes the count only ever offers one the roster admits. Given an item that
     * FIXES the count, the session either fits it or is told, in its own numbers, why not.
     */
    {
        const fixes = (value: number) => (contracts: any[]) => {
            const condition = contracts.find(c => (c.items ?? []).some((i: any) => String(i.row) === 'P5'))
            condition.items.push({
                itemId: 'REVIEW-NEUTRAL-COUNT',
                origId: 'REVIEW-NEUTRAL-COUNT',
                row: 'P5',
                selector: '*',
                requirement: 'EQUALS',
                value,
                strictness: 'REQUIRED',
                valueStatus: 'REQUIRED_RANGE',
                scope: 'WHOLE_GAME',
                basis: 'AUTHORED',
                basisEvidence: 'a test fixture, not authored knowledge',
                checkability: 'STRUCTURAL',
                structuralClause: 'whole item',
            })
        }
        const at = (players: number, value: number) =>
            buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: none } }, fixes(value))

        const odd = refused(at(12, 1), 'one neutral fixed, twelve players')
        assert.equal(odd.stage, 'session')
        assert.equal(odd.summary, '12 players with 1 neutral player cannot be split into the equal teams this game needs.')
        plain(odd, 'one neutral, twelve players')
        assert.ok(odd.reasons.some(reason => reason.includes('DOES_NOT_DIVIDE')))

        // Twelve neutrals of twelve players was SERVED as "2 teams of 0" before the roster rule refused a team
        // with nobody in it (measured 13 October with that guard taken out).
        const all = refused(at(12, 12), 'twelve neutrals fixed, twelve players')
        assert.equal(all.stage, 'session')
        assert.equal(all.summary, '12 players are not enough for this game — every team needs at least one outfield player.')
        plain(all, 'twelve neutrals, twelve players')
        assert.ok(all.reasons.some(reason => reason.includes('NO_OUTFIELD_PLAYERS')))

        // A count the knowledge fixes is a requirement of the game, so it is not said as a choice about this activity.
        const fits = served(at(13, 1), 'one neutral fixed, thirteen players')
        const count = fits.rendered.instructions.find(i => i.from.includes('performers.neutrals.count') && i.text.includes('of the 13 players'))!
        assert.deepEqual([count.text, count.status], ['1 of the 13 players is a neutral player, so the team with the ball has 1 more player than the team without it', 'DERIVED'])
        assert.equal(fits.integrity.fidelityViolations, 0)

        /**
         * **A count authored as the STRING "2" — measured in the B3 review, 13 October, and pinned.** The
         * roster rule reads it as two people, the way the roster gate reads its terms, so the teams come out
         * at five. The renderer states only a number it holds as a number, so it withholds the count and the
         * check refuses the activity as uncarried. Refused, never served with a guessed or rounded team: the
         * honest outcome, and an inconsistency between the two readers left for the lead (the corpus authors
         * every count as a number).
         */
        const quoted = refused(at(12, '2' as unknown as number), 'a neutral count authored as the string "2"')
        assert.equal(quoted.stage, 'communication')
        assert.ok(quoted.reasons.some(reason => reason.includes('performers.neutrals.count is established by the game and no instruction carries it')), JSON.stringify(quoted.reasons))

        assert.ok(!JSON.stringify(loadCorpusContracts()).includes('REVIEW-NEUTRAL-COUNT'), 'the alteration was made to a copy and to nothing else')
    }

    /**
     * **THE MECHANISM COMPOSES — with the scoring modifier, by direct construction.** A mechanism that works
     * only beside the bare game form is not yet reusable. The two are composed here by naming the three
     * knowledge objects, through the one pathway; it is not a third demonstration and no page offers it.
     * Baseline of 13 October, measured: 28 instructions and 0 violations at both squad sizes — the scoring
     * modifier's 22, plus the six sentences about the neutral players, with the possession-change sentence
     * still said once.
     */
    for (const [players, expectedPlayers] of NEUTRAL_ACTIVITY) {
        const { activity } = buildActivityFromKnowledge(['GF2', 'tl-v0-constraint-wide-zone-advantage', 'tl-v0-constraint-neutral-player-condition'], { players, lengthM: 40, widthM: 30, durationMin: 20, roles: none })
        const composed = served(activity, `the neutral condition composed with the scoring modifier, ${players} players`)
        assert.equal(composed.kind, 'mechanism-demonstration', 'a composition is a mechanism demonstration too, and says so')
        assert.equal(composed.account.gameProblem, null)
        assert.deepEqual(composed.account.constraints.map(c => [c.title, c.contracted]), [['Wide Zone Advantage', true], ['Neutral Player Condition', true]])
        assert.equal(composed.rendered.instructions.length, 28, `${players} players`)
        assert.equal(composed.integrity.fidelityViolations, 0)
        assert.equal(composed.integrity.postRealizationValidated, true)
        assert.deepEqual(composed.integrity.acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
        // Each mechanism says exactly what it says alone, and neither disturbs the other.
        assert.deepEqual(text(composed, 'Players'), expectedPlayers, `${players} players`)
        for (const section of ['Set up', 'How it works', 'How to score']) assert.deepEqual(text(composed, section), text(modifier, section), `${players} players: ${section}`)
    }

    /**
     * **HIS ALLEGIANCE RULING IS NOT IN THE KNOWLEDGE, AND THIS IS THE MEASUREMENT THAT STOPPED IT — pinned
     * 13 October 2026, so it is not rediscovered and so the day it can be held this block is the one to move.**
     *
     * Christian, 13 October: *"my preference is that the neutral supports whichever team currently has
     * possession and changes allegiance immediately when possession changes. That should be explicit in the
     * activity rather than left ambiguous."*
     *
     * The ruling was to be authored as one item on the row that holds *"the trigger on which a neutral's
     * affiliation is decided"*, with the value `POSSESSION_CHANGE`, required. That row holds ONE trigger, and
     * the condition already authors it twice as `STANDING` — the standing rule that the neutral is always with
     * the team in possession, START included, which is why a possession-change value was considered and
     * rejected when the contract was written. So the item, exactly as specified and added to a COPY, collides
     * with the authored value: Gate A fails and the game loses its authorization. Nothing was added to the
     * corpus, no check was weakened to admit it, and the register was not edited.
     *
     * What the activity can still say truly it says — *always* with the team that has the ball, changing sides
     * *when possession changes* — because the standing rule entails both. What it cannot say is *immediately*:
     * nothing in the game holds when a change takes effect. That needs somewhere to live (a row of its own for
     * when a re-affiliation takes effect, or a row that may hold more than one trigger) and is his to rule.
     */
    {
        const asSpecified = (contracts: any[]) => {
            const condition = contracts.find(c => (c.items ?? []).some((i: any) => String(i.row) === 'P6a'))
            const held = condition.items.filter((i: any) => String(i.row) === 'P6a')
            assert.deepEqual(held.map((i: any) => [i.value, i.strictness, i.basis]), [['STANDING', 'REQUIRED', 'AUTHORED'], ['STANDING', 'REQUIRED', 'AUTHORED']], 'what the condition authors on the row today')
            condition.items.splice(condition.items.indexOf(held[held.length - 1]) + 1, 0, {
                itemId: 'REVIEW-ALLEGIANCE-RULING',
                origId: 'REVIEW-ALLEGIANCE-RULING',
                row: 'P6a',
                selector: '*',
                requirement: 'EQUALS',
                value: 'POSSESSION_CHANGE',
                strictness: 'REQUIRED',
                valueStatus: 'REQUIRED_RANGE',
                scope: 'WHOLE_GAME',
                basis: 'OWNER_RULING',
                basisEvidence: 'the item as specified for his ruling of 13 October, on a copy, for this measurement only',
                checkability: 'STRUCTURAL',
                structuralClause: 'whole item',
            })
        }
        const collided = refused(
            buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none } }, asSpecified),
            'the neutral-players demonstration with the allegiance ruling added as specified',
        )
        assert.equal(collided.stage, 'structure', JSON.stringify(collided.reasons))
        assert.equal(collided.summary, 'The game this demonstration selects is not yet described completely enough to be set up.')
        assert.ok(collided.reasons.includes('Gate A is FAIL'), JSON.stringify(collided.reasons))
        assert.ok(collided.reasons.includes('1 collision(s) remain'), JSON.stringify(collided.reasons))
        assert.ok(collided.reasons.some(reason => reason.includes('game::P6a')), 'and the line it collides on is the affiliation trigger')
        // The corpus is as it was: two authored items on the row, both the standing rule, and no third.
        const onRow = loadCorpusContracts().flatMap(contract => contract.items ?? []).filter(item => String(item.row) === 'P6a')
        assert.deepEqual(onRow.map(item => item.value), ['STANDING', 'STANDING'])
    }

    // A demonstration is never described to a coach as a goal — in a refusal any more than in a title.
    const none9 = refused(reviewActivity(stored({ playerCount: 9 }), { demonstrationId: 'scoring-modifier', durationMin: 20 }), 'the demonstration with 9 players')
    assert.equal(none9.summary, '9 players cannot be split into the equal teams this game needs.')
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const outcome = reviewActivity(stored(), { demonstrationId: demonstration.id, durationMin: 20 })
        if (outcome.outcome === 'refused') assert.doesNotMatch(outcome.summary, /\bgoal\b/i, `${demonstration.id}: "${outcome.summary}"`)
    }
}

/**
 * ── What the account says that selection did not take from the goal ───────────────────────────────
 *
 * **Baseline of 14 October 2026, pinning two states put to him for a ruling — not states he chose.**
 *
 * 1. **Borrowed constraints.** Where a goal's candidates cannot fill the role mix, selection draws from the
 *    whole library (`constraintPoolFor`). Seven goals, every one because its candidates hold no shaping
 *    constraint. The account must say so per constraint, because a constraint never designated for a goal
 *    cannot be claimed relevant to its affordances. If he rules that selection stops borrowing, this table
 *    empties and the entries go with the reason.
 * 2. **The context's approved scoring event is not in the activity.** Every goal names its context and his
 *    approved qualifying condition, and none carries it: selection hands derivation a game form and
 *    constraints, never the context. `inThisActivity` is read from the selection, so the first selection that
 *    carries a context turns its entry true and this assertion moves with it.
 */
{
    const BORROWING: Record<string, string[]> = {
        A02: ['shaping'],
        A04: ['shaping'],
        D01: ['shaping'],
        D02: ['shaping'],
        D03: ['shaping'],
        TD01: ['shaping'],
        TD02: ['shaping'],
    }
    for (const goal of activityReviewOptions().goals) {
        const activity = reviewActivity(stored(), { learningGoalId: goal.id, durationMin: 20 })
        const account = activity.account
        const source = account.constraintSource!
        assert.ok(source, `${goal.id}: a goal's account says where its constraints came from`)
        const constraints = account.constraints ?? []
        assert.ok(constraints.length, `${goal.id}: selection's constraints survive into the account, served or refused`)
        if (BORROWING[goal.id]) {
            assert.equal(source.source, 'WHOLE_LIBRARY', goal.id)
            assert.equal(source.setAsideBecause, 'NO_FOUNDATION_AND_SHAPING', goal.id)
            assert.deepEqual(source.missingRoles, BORROWING[goal.id], goal.id)
            assert.ok(constraints.some(c => c.fromGoalCandidates === false), `${goal.id}: at least one constraint is marked as borrowed`)
        } else {
            assert.equal(source.source, 'GOAL_CANDIDATES', `${goal.id} draws from its own candidates`)
            assert.ok(constraints.every(c => c.fromGoalCandidates === true), `${goal.id}: every constraint is one of its candidates`)
        }
        const context = account.context!
        assert.ok(context?.id && context.name, `${goal.id}: the account names its context`)
        assert.ok(context.approvedScoringCondition, `${goal.id}: and carries the approved scoring condition as authored`)
        assert.equal(context.inThisActivity, false, `${goal.id}: no selection carries its context today`)
    }
    // Beat Defenders 1v1 is the sharpest case: two candidates, four constraints, none of them a candidate.
    const a04 = served(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20 }), 'A04').account
    assert.equal(a04.constraints.length, 4)
    assert.ok(a04.constraints.every(c => c.fromGoalCandidates === false), 'none of A04\'s constraints is among its candidates')
    // A demonstration involves no goal, so it has no candidates to have borrowed from and no context.
    const demonstration = served(reviewActivity(stored(), { demonstrationId: 'scoring-modifier', durationMin: 20 }), 'scoring-modifier').account
    assert.equal(demonstration.constraintSource, null)
    assert.equal(demonstration.context, null)
    assert.ok(demonstration.constraints.every(c => c.fromGoalCandidates === null))
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
