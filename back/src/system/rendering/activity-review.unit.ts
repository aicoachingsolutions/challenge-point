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
 * evidence. None of the thirteen goals can be built today (14 October) and each must say so, at the stage where it
 * stops, in a sentence with no identifier in it. A session that states too little must be asked for what is
 * missing rather than given a number.
 *
 * The specialized role is read from the register throughout, so this file names none either.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadCorpusContracts, loadRegister, readJson } from '../derivation/corpus'
import { repairCorpusEncoding } from '../derivation/corpus-repair'
import { CONTEXT_ROLE } from '../derivation/run-bounded-selection'
import { indexRegister } from '../derivation/register'
import { ActivityReviewRequestError, activityReviewOptions, reviewActivity } from './activity-review'
import { buildActivity, buildActivityFromKnowledge, buildActivityOverAlteredKnowledge, buildActivityOverAlteredSelection, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity, UnknownActivityRequest } from './build-activity'
import { constitutedConditionTypes, contextScoringFindings } from './context-scoring-guard'
import { buildPilotActivity, isPilotRefused, PILOT_SESSION } from './build-pilot-activity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { sessionEnvelopeFrom, specializedRoleNames } from './session-envelope'
import { rpcLibrary } from '../sport-module/rpc-library'
import { learningGoalSelectionHolds } from '../test-library/learning-design-holds'
import { authorizationLists, learningGoalAuthorization, learningGoalAuthorizations, LearningGoalAuthorization, libraryConstraintPrinciple } from '../test-library/learning-goal-authorizations'

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

/**
 * **TEST-ONLY: the real authorization records with every entry that is not in place set aside** (stage H3, 15 October
 * 2026). Since that stage the production build of A01 stops before derivation on its record's gaps, so the tests below
 * that were about what lies BEHIND that — the structural stops, the context-scoring guard, the roster — build over this
 * copy, which changes nothing but those entries' status (and is never production data), so derivation runs on exactly
 * the selection the real build makes.
 */
const withoutGapEntries = (): LearningGoalAuthorization[] =>
    learningGoalAuthorizations().map(record => ({
        ...record,
        manipulations: record.manipulations.map(m => (m.status === 'MISSING_KNOWLEDGE' || m.status === 'MISSING_CAPABILITY' ? { ...m, category: 'EXISTING_KNOWLEDGE_TO_VERIFY' as const, status: 'NOT_SELECTED_FOR_FIRST_DEMO' as const, gaps: [], note: 'TEST-ONLY' } : m)),
        provisionalChoices: (record.provisionalChoices ?? []).map(c => (c.status === 'MISSING_KNOWLEDGE' || c.status === 'MISSING_CAPABILITY' ? { ...c, status: 'AUTHORIZED_BY_RULING' as const, gaps: [], note: 'TEST-ONLY' } : c)),
    }))

// ── The pilot is REFUSED now, and the review refuses it identically ───────────────────────────────
//
// His instruction for the pilot route was that it *"serve the same validated, rendered activity without
// introducing unverified transformations"*. The pilot is a thin caller of the general builder, and this was
// the assertion that the two serve the same A04 activity to the letter.
//
// **Re-pointed 14 October 2026: the pilot route now REFUSES A04, and that is the honest state.** Christian,
// that day: *"the Primary Scoring Event and qualifying condition approved for each Representative Performance
// Context should govern the generated activity."* A04 was served scored on a line being crossed, which its
// context (RPC-004) does not approve, and RPC-004 has no contribution contract, so its approved scoring cannot
// reach the game. Nothing is served in its place. What still has to hold is that the pilot and the review
// agree — now on the refusal, reason for reason — and the served half of this assertion moved to the bare
// possession game below, built through the same chain.
{
    const pilot = buildPilotActivity()
    assert.ok(isPilotRefused(pilot), 'the pilot is refused: its goal\'s context has no contract, so its approved scoring cannot govern the game')
    const review = refused(
        reviewActivity(
            { playerCount: PILOT_SESSION.players, fieldLength: String(PILOT_SESSION.lengthM), fieldWidth: String(PILOT_SESSION.widthM), specializedRoles: { ...none } },
            { learningGoalId: 'A04', durationMin: PILOT_SESSION.durationMin },
        ),
        'A04 at the pilot session',
    )
    assert.deepEqual(pilot.because, review.reasons, 'the pilot refuses for exactly the reasons the review does')
    assert.equal(review.stage, 'knowledge')
    assert.ok(review.reasons.some(reason => reason.includes('RPC-004') && reason.includes('no contribution contract')), JSON.stringify(review.reasons))
    assert.equal(review.kind, 'learning-goal')
    assert.equal(review.title, 'Beat Defenders 1v1')

    /**
     * **An UNRESOLVED Game Problem is never filled in — and the output is PROVISIONAL.** No translation is
     * approved for this goal, so the account says so; nothing is substituted, and what the wording implies is
     * not offered as the answer in its place. His ruling of 14 October adds the label.
     */
    const account = review.account
    assert.deepEqual(account.gameProblem, { status: 'UNRESOLVED', gameProblemId: null, name: null, inferredFromWording: null, governed: false })
    assert.equal(account.provisional, true)
    assert.ok(account.provisionalReason && account.provisionalReason.includes('no Game Problem is approved'), String(account.provisionalReason))
    assert.equal(account.gameForm!.contracted, true)
    // Two designated constraints, both its own, neither contracted — and the context is NOT listed among what
    // has no contract: it has its own entry in the account.
    assert.deepEqual(account.constraints!.map(c => c.title), ['Small Area Condition', 'Zone Structure Condition'])
    assert.ok(account.constraints!.every(c => !c.contracted && c.fromGoalCandidates === true))
    assert.deepEqual(account.selectedWithoutContract, account.constraints!.map(c => c.id))
    assert.equal(account.context!.id, 'RPC-004')
    assert.equal(account.context!.inThisActivity, false)
}

/**
 * ── No goal is served whose context has no contract — and the identical-game finding, kept ────────
 *
 * **Re-pointed 14 October 2026.** A04, D01 and D03 were served here, as one identical game. All three were
 * scored on a line being crossed, which none of their contexts approves; D01 and D03 are defending goals, and
 * his ruling names exactly that case: *"an activity intended to develop defensive organization should not rely
 * exclusively on the attacking team's progression as its measure of success when the approved context
 * specifies a defensive outcome."* So they are refused (the table below), and what this block was really about
 * — that a game form with no contracted constraint beside it comes out the same game whatever is selected
 * beside it — is kept on the knowledge itself, through the same chain: the bare possession game, and the same
 * game form with A04's and D01's own (uncontracted) constraints, are one game.
 */
{
    const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
    const bare = served(buildActivityFromKnowledge(['GF2'], session).activity, 'the bare possession game')
    // 12 → 8 on 14 October 2026 (stage S-C2, his §7 consolidated language): the end lines in one sentence, the roster
    // in one, the possession-change sentences in one. Nothing said was lost (0 violations, every property cited).
    assert.equal(bare.rendered.instructions.length, 8)
    assert.equal(bare.integrity.fidelityViolations, 0)
    for (const [label, selected] of [
        ['A04\'s game form and constraints', ['GF2', 'tl-v0-constraint-small-area-condition', 'tl-v0-constraint-zone-structure-condition']],
        ['D01\'s game form and constraints', ['GF2', 'tl-v0-constraint-central-density-condition', 'tl-v0-constraint-small-area-condition', 'tl-v0-constraint-delay-reward']],
    ] as const) {
        const activity = served(buildActivityFromKnowledge([...selected], session).activity, label)
        assert.deepEqual(
            activity.rendered.instructions.map(i => i.text),
            bare.rendered.instructions.map(i => i.text),
            `${label}: nothing beside the game form is contracted, so it is the identical game — a finding about the knowledge, not a defect here`,
        )
    }
    // D01 and D03 keep their approved Game Problems in the account of the refusal.
    for (const goalId of ['D01', 'D03']) {
        const activity = refused(reviewActivity(stored(), { learningGoalId: goalId, durationMin: 20 }), goalId)
        assert.equal(activity.account.gameProblem?.status, 'APPROVED', `${goalId} has an approved Game Problem`)
        assert.ok(activity.account.gameProblem?.gameProblemId && activity.account.gameProblem.name, 'and the account names it')
        assert.equal(activity.account.provisional, false, `${goalId}: an approved Game Problem is not provisional`)
    }
    // Where the approved translation and the wording disagree, the approved one is the goal's Game Problem.
    const d03 = refused(reviewActivity(stored(), { learningGoalId: 'D03', durationMin: 20 }), 'D03').account.gameProblem!
    assert.equal(d03.governed, true)
    assert.notEqual(d03.gameProblemId, d03.inferredFromWording, 'the inference is carried beside it and is not it')
}

/**
 * ── All thirteen goals are refused, each at the stage where it stops ──────────────────────────────
 *
 * **Baseline of 14 October 2026, measured.** No Learning Goal is served today, and that is his two rulings of
 * that day applied, not a regression: selection draws only from a goal's designated constraints, and a goal's
 * context must have its approved scoring in the game. Why each stops:
 *
 *   - `selection`, knowledge gap — the goal's own candidates cannot be combined on the game form chosen for it
 *     (A02, D03). Found by the existing package checks, not by any shaping requirement;
 *   - `knowledge`, game form not built — the goal's game form has no contribution contract (A03, A06);
 *   - `knowledge`, context not built — the game form is built, and the goal's context has no contract, so its
 *     approved scoring cannot govern the game (eight goals). Before 14 October three of these were SERVED,
 *     scored on an event their context does not approve, and the other five stopped later;
 *   - `structure`, not described completely — A01, the one goal whose context IS contracted: with RPC-001 in
 *     the game, Gate A fails on three lines the context leaves unestablished (his knowledge decisions K1-K3).
 *     It stopped at the Pass Combination Gate before; the gate is now held out of its selection by his ruling.
 *
 * A goal moving OUT of this table is the work succeeding, and the entry should then be removed with the
 * reason. A goal moving between rows, or a new one arriving, is a change in the knowledge to be explained.
 *
 * **15 October 2026 — A01 moves from `structure` to `selection`, and that is the honest state.** Christian that day
 * (item 1): *"approving Gain Access does not automatically authorize the candidate constraints currently derived from
 * vocabulary coverage. I would prefer that the activity's constraints be selected based on their documented
 * relationship to the approved context, Game Problem, and target affordances."* A01's authorization record
 * authorizes no library constraint (none has such a relationship), and whether it may be built with none is his
 * decision D1, so it is refused at selection as NO_AUTHORIZED_CONSTRAINTS, its game form (GF2) named. It used to
 * reach `structure` only by selecting vocabulary-derived constraints — Wide Zone Advantage among them, which his
 * item 7 excludes. Under a test-only zero-constraint ruling it reaches `structure` again, on the same three
 * context lines (pinned below). It is no longer provisional: Gain Access is recorded.
 *
 * **15 October 2026, later — A01 moves back from `selection` to `structure`, with NO library constraint.** His reply
 * of that day (16 October, item 1) answered the 15 October email's zero-constraint question (that email's D1 — not
 * the capability synthesis's D1 named below) with a general principle — *"A library constraint is not mandatory
 * unless its inclusion is justified by the approved knowledge and intended learning environment"* — and *"Please
 * proceed with Option A for Play Out from the Back."* Its record's evaluated set is empty, so it selects GF2, its
 * lenses and the context, and derivation refuses it at Gate A on FOUR context lines (measured, both with two
 * goalkeepers available and none): RPC-001-11.a::J2 (the build-out team's objective claims a target nothing resolves —
 * moves with his 9.5 cleanup, C51), 18.f::V5 and 19.a::V5 (the control and long-clearance referents — capability M8,
 * after the capability synthesis's decisions D1, whether play stops at the progression target, and D3, where the two
 * targets sit), and 18.a::V6 (the origin's "no further value", his 9.9 — capability M6, ruling C55). Selection
 * is no longer where this goal stops; its context's knowledge is. (Three lines since C51 the same day: 11.a::J2
 * cleared with the retired objective.)
 *
 * **15 October 2026, stage H3 — A01 moves from `structure` to `knowledge`: its authorization record names what the
 * activity still lacks.** His 16 October reply, item 10: *"if the existing game form cannot represent the intended
 * learning environment, I would rather see a clear refusal and a narrowly described gap than an activity that is
 * technically valid but solves a different problem."* The record now carries his 16 October choices and the
 * statuses they leave (the asymmetric structure, the defenders' starting arrangement, where the targets sit, the
 * allocation, the goalkeepers, the start and the restarts), and the build refuses on every entry that is not in place,
 * before derivation, naming each with the decisions (D1-D7) and capabilities (M1-M5) that would supply it. Nothing
 * is hidden: the structural stops (GA-EPISODE-REACHABLE and the three context lines) are pinned below on a COPY of
 * the record whose gap entries are set aside, and they are exactly what they were. No other goal moves: none other
 * has a record.
 */
{
    const RECORD = "This goal's activity depends on set-up decisions and engine capabilities that are not in place yet, so no activity can be built for it."
    const GAP = "This goal's designated constraints cannot yet be combined into a game, so no activity can be built for it."
    const NOT_DESCRIBED = 'The game this goal selects is not yet described completely enough to be set up.'
    const NOT_BUILT = 'This goal uses a game form that has not been built into the activity engine yet.'
    const CONTEXT = "The scoring this goal's context calls for has not been built into the activity engine yet, so no activity can be built for it."
    // [stage, summary, the game form is contracted, the reason names]
    const expected: Record<string, [RefusedActivity['stage'], string, boolean, string]> = {
        A01: ['knowledge', RECORD, true, 'parts of the activity the authorization record of A01 asks for are not in place yet'],
        A02: ['selection', GAP, false, 'NO_COMPATIBLE_COMBINATION'],
        A03: ['knowledge', NOT_BUILT, false, 'the game form GF3 has no contribution contract'],
        A04: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-004 has no contribution contract'],
        A05: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-003 has no contribution contract'],
        A06: ['knowledge', NOT_BUILT, false, 'the game form GF9 has no contribution contract'],
        D01: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-008 has no contribution contract'],
        D02: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-007 has no contribution contract'],
        D03: ['selection', GAP, true, 'NO_COMPATIBLE_COMBINATION'],
        TA01: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-006 has no contribution contract'],
        TA02: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-003 has no contribution contract'],
        TD01: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-007 has no contribution contract'],
        TD02: ['knowledge', CONTEXT, true, 'the Representative Performance Context RPC-007 has no contribution contract'],
    }
    const options = activityReviewOptions()
    assert.deepEqual(options.goals.map(g => g.id).sort(), Object.keys(expected).sort(), 'every goal the page offers is accounted for here')
    for (const [goalId, [stage, summary, formBuilt, because]] of Object.entries(expected)) {
        const activity = refused(reviewActivity(stored(), { learningGoalId: goalId, durationMin: 20 }), goalId)
        assert.equal(activity.stage, stage, `${goalId} must stop at ${stage}; it stopped at ${activity.stage}: ${JSON.stringify(activity.reasons)}`)
        assert.equal(activity.summary, summary, goalId)
        plain(activity, goalId)
        // Told apart by the refusal's REASON, not its stage alone: two different causes now share `knowledge`.
        assert.ok(activity.reasons.some(reason => reason.includes(because)), `${goalId}: ${JSON.stringify(activity.reasons)}`)
        assert.equal(activity.title, options.goals.find(g => g.id === goalId)!.name, 'a refusal is still titled by the goal the coach chose')
        // What selection established before the refusal is kept, so the account can show how far it got —
        // a knowledge gap included: the game form it was found on is named.
        assert.ok(activity.account.gameForm?.id, `${goalId}: the selected game form survives into the refusal's account`)
        assert.equal(activity.account.gameForm!.contracted, formBuilt, `${goalId}: and says whether it is built`)
        // The goals with an unresolved Game Problem are provisional, in every outcome (his ruling, section 5). Three
        // since 15 October 2026: A01's Game Problem is recorded (Gain Access).
        assert.equal(activity.account.provisional, ['A04', 'A05', 'A06'].includes(goalId), `${goalId}: provisional`)
    }

    // A knowledge gap's account is filled from the gap itself: the game form, the Game Problem, the context,
    // the roles no candidate fills — and no constraints, because none was selected.
    for (const [goalId, form] of [['A02', 'GF3'], ['D03', 'GF2']] as const) {
        const gap = refused(reviewActivity(stored(), { learningGoalId: goalId, durationMin: 20 }), goalId)
        assert.equal(gap.account.gameForm!.id, form)
        // `constraintAuthority`, `zeroConstraintRuling` and `lensAuthority` since 15 October 2026: vocabulary-derived
        // candidates are labelled as such, never as authorized. `zeroConstraintRuling` -> `constraintPrinciple` later that
        // day: a vocabulary pool is never read under his general principle (only an evaluated record is).
        assert.deepEqual(gap.account.constraintSource, {
            source: 'GOAL_CANDIDATES',
            constraintAuthority: 'VOCABULARY_POOL',
            constraintPrinciple: null,
            lensAuthority: 'ENGINE_LENS',
            unfilledRoles: ['shaping'],
            heldByRuling: [],
            gap: 'NO_COMPATIBLE_COMBINATION',
        })
        assert.equal(gap.account.authorization, null, `${goalId}: no authorization record`)
        assert.deepEqual(gap.account.constraints, [])
        assert.ok(gap.account.gameProblem, `${goalId}: the Game Problem authority is in the account`)
        assert.ok(gap.account.context?.id, `${goalId}: and so is the context`)
    }

    /**
     * **A01's account carries its authorization record — whole, as selection used it** (15 October 2026, the TECHNICAL
     * account only). Key identity: every field of the record is on the account, and nothing is restated in code; the
     * exclusions gain only their library titles. A projection is proved by a consumer — the review page's technical
     * panel reads exactly these fields.
     */
    {
        const a01 = refused(reviewActivity(stored(), { learningGoalId: 'A01', durationMin: 20 }), 'A01')
        const record = learningGoalAuthorization('A01')!
        // Re-pointed later on 15 October 2026: `zeroConstraintRuling: null` and `gap: NO_AUTHORIZED_CONSTRAINTS` became
        // the general principle the evaluated set was read under (16 October reply, item 1) and no gap — A01 now
        // selects. The principle's sentence is the file's, read through the loader, never restated in code. The
        // unfilled roles stay as a fact about the record; under the principle they are not gaps.
        const principle = libraryConstraintPrinciple()
        assert.deepEqual(a01.account.constraintSource, {
            source: 'AUTHORIZATION_RECORD',
            constraintAuthority: 'AUTHORIZATION_RECORD',
            constraintPrinciple: { ruledOn: principle.ruledOn, by: principle.by, principle: principle.principle },
            lensAuthority: 'ENGINE_LENS',
            unfilledRoles: ['foundation', 'shaping', 'consequence'],
            heldByRuling: [],
            gap: null,
        })
        const authorization = a01.account.authorization!
        assert.deepEqual(Object.keys(authorization).sort(), Object.keys(record).sort(), 'every field of the record reaches the account')
        const { excluded, ...rest } = authorization
        const { excluded: recordExcluded, ...recordRest } = record
        assert.deepEqual(rest, recordRest, 'carried verbatim')
        assert.deepEqual(excluded.map(({ title, ...exclusion }) => exclusion), recordExcluded, 'exclusions carried verbatim')
        assert.deepEqual(excluded.map(e => e.title), ['Wide Zone Advantage', 'Pass Combination Gate'], 'each named by its library title')
        assert.deepEqual(authorization.manipulations.map(m => [m.phrase, m.tier, m.status]), record.manipulations.map(m => [m.phrase, m.tier, m.status]))
        assert.deepEqual(authorization.authorizedConstraints, [], 'evaluated: none justified for this goal')
        assert.deepEqual(authorization.provisionalChoices, record.provisionalChoices, 'his provisional choices reach the technical account')
        // Stage H3, 15 October 2026: the new record fields reach the account whole (key identity above covers the
        // keys; these are the values), and the three lists are the record's own projection, read by the page.
        assert.deepEqual(authorization.existingKnowledge, record.existingKnowledge)
        assert.deepEqual(authorization.gaps, record.gaps)
        assert.deepEqual(authorization.manipulations.map(m => [m.category, m.gaps]), record.manipulations.map(m => [m.category, m.gaps]))
        assert.deepEqual(a01.account.authorizationLists, authorizationLists(record), 'the three lists, exactly as the record gives them')
        assert.equal(a01.account.authorizationLists!.gaps.length, 15)
        assert.equal(a01.account.gameProblem?.gameProblemId, 'GP-005')
        assert.equal(a01.account.gameProblem?.status, 'APPROVED')
        assert.equal(a01.account.provisional, false)
        assert.deepEqual(a01.account.constraints, [], 'no constraint is listed as selected')
    }

    /**
     * **What the zero-constraint commitment reaches — in PRODUCTION since 15 October 2026.** Until his reply of that day
     * (16 October, item 1) this was measured on a COPY of the record with a TEST-ONLY ruling (G1.3, three lines pinned
     * by inclusion). Under his general principle it is the real build: selection commits GF2, its lenses and NO library
     * constraint; the context is carried; derivation stops at `structure` on exactly FOUR RPC-001 lines, with two
     * goalkeepers available or none (measured). Each names what would move it (the capability synthesis of 15 October,
     * whose D/M ids these are — its D1 is not the 15 October email's D1): 11.a::J2 — his 9.5 cleanup (C51); 18.f::V5 and
     * 19.a::V5 — capability M8 after decisions D1/D3; 18.a::V6 — capability M6 and
     * ruling C55 (his 9.9). The remaining work for this goal is its context's knowledge, not a constraint.
     *
     * **4 -> 3 lines on 15 October 2026 (C51), measured.** 11.a::J2 cleared as predicted: his 9.5 retired the
     * context's separate scoring objective — *"Approved, provided the live attacking objective remains represented"* —
     * and each team keeps its own live objective (the proviso is pinned in derivation-stage11.unit.ts).
     *
     * **And a second failing check the same day, as expected (C52), measured.** His 9.3 — *"Build-out condition applies
     * only to build-out episodes: Approved."* — scopes the four build-out conditions to the build-out episode, and the
     * engine now carries that scope. The game holds no transition that can begin a build-out episode (its only
     * transition is a possession change), so GA-EPISODE-REACHABLE fails, naming the scope. What would move it is
     * capability M3 — START and SCORE transition elements from knowledge — which goes to him first.
     */
    /**
     * **Re-pointed 15 October 2026 (stage H3) onto a COPY of the record with its gap entries set aside**, because the
     * production build now stops earlier, on the record's own gaps (pinned first, below). The copy changes nothing but
     * those entries' status (TEST-ONLY, never production data), so derivation runs on exactly the selection the real
     * build makes, and the structural stops are measured to be exactly what they were: nothing behind the record's
     * refusal is hidden. What moves each stop: GA-EPISODE-REACHABLE, capability M3; 18.f::V5 and 19.a::V5, capability
     * M8 after decisions D1 and D3; 18.a::V6, capability M6 (ruling C55, his 9.9).
     */
    {
        const RECORD_REASONS = [
            '8 parts of the activity the authorization record of A01 asks for are not in place yet',
            'manipulation "starting positions — where the team building out starts" is MISSING_CAPABILITY (PROVISIONAL_REALIZATION_CHOICE), waiting on M3',
            'manipulation "starting positions — the defending team\'s starting relationship" is MISSING_KNOWLEDGE (GENUINE_GAP), waiting on D4, M5',
            'manipulation "progression references — where each target sits: the build-out progression target and the post-regain area" is MISSING_KNOWLEDGE (GENUINE_GAP), waiting on D3',
            'manipulation "defensive numbers" is MISSING_KNOWLEDGE (GENUINE_GAP), waiting on D6',
            'manipulation "goalkeeper positioning" is MISSING_CAPABILITY (PROVISIONAL_REALIZATION_CHOICE), waiting on D6, M2, M3',
            'manipulation "overloads" is MISSING_KNOWLEDGE (GENUINE_GAP), waiting on D6',
            'provisional choice "An asymmetrical build-out-versus-press structure: one team builds out, the other presses to prevent progression, regain possession and exploit the regain, and the teams exchange roles over successive episodes or blocks." is MISSING_CAPABILITY (PROVISIONAL_REALIZATION_CHOICE), waiting on D2, D7, M1, M2',
            'provisional choice "A new build-out episode begins with a goalkeeper or controlled defensive restart once the previous episode has meaningfully concluded, without interrupting a promising attack; after a score play stops and restarts, at a location the coach selects." is MISSING_CAPABILITY (PROVISIONAL_REALIZATION_CHOICE), waiting on D1, D5, M3, M4',
        ]
        for (const keepers of [2, 0]) {
            // Production: refused on the record's gaps, before derivation — the same with two goalkeepers or none.
            const production = refused(reviewActivity(stored({ specializedRoles: { ...none, [ROLE]: keepers } }), { learningGoalId: 'A01', durationMin: 20 }), `A01, ${keepers} of ${ROLE}`)
            assert.equal(production.stage, 'knowledge', JSON.stringify(production.reasons))
            assert.deepEqual(production.reasons, RECORD_REASONS)
            assert.deepEqual(production.account.constraints, [], 'no library constraint was selected')
            assert.equal(production.account.context?.inThisActivity, true, 'the context is in the game')

            // Behind it, on the copy: the structural stops, exactly as before stage H3.
            const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } }
            const reached = refused(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, withoutGapEntries()).activity, `A01 (record gaps set aside), ${keepers} of ${ROLE}`)
            assert.equal(reached.stage, 'structure', JSON.stringify(reached.reasons))
            assert.deepEqual(reached.reasons, [
                'Gate A is FAIL',
                'a pre-realization Gate A invariant fails: GA-EPISODE-REACHABLE, GA-NO-FAILED-LINE',
                '3 unresolved properties are neither an authorized choice nor an authorized claim: c:restated:RPC-001:RPC-001-18.f::V5, c:restated:RPC-001:RPC-001-19.a::V5, c:restated:RPC-001:RPC-001-18.a::V6',
            ])
            assert.deepEqual(reached.account.constraints, [], 'no library constraint was selected')
            assert.equal(reached.account.constraintSource?.constraintPrinciple?.ruledOn, '2026-10-15', 'committed under his general principle')
            assert.equal(reached.account.context?.inThisActivity, true, 'the context is in the game')
        }
        // The same record not yet evaluated is refused at selection, as A01 was until the principle: the gap is kept.
        const records = learningGoalAuthorizations()
        records[0].authorizedConstraints = null
        const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
        const notYet = refused(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, records).activity, 'A01 with its set not yet evaluated')
        assert.equal(notYet.stage, 'selection')
        assert.equal(notYet.account.constraintSource?.gap, 'NO_AUTHORIZED_CONSTRAINTS')
        assert.equal(notYet.account.constraintSource?.constraintPrinciple, null)
    }
}

/**
 * ── The record-gap refusal is GENERIC: no goal is special (stage H3, 15 October 2026) ─────────────────
 *
 * His 16 October reply, item 1: *"please don't establish Play Out from the Back as a permanent special-case
 * exception"*; item 10: *"I want to avoid turning this first activity into a special-case collection of hardcoded
 * rules."* So the refusal is proved for every goal, not for A01. Each of the thirteen is built under a COPY of the
 * records holding a TEST-ONLY record for it (nothing of his in it: every field says TEST-ONLY) with one entry not in
 * place, and with its context left out of a copy of its selection so that the uncontracted contexts of twelve goals do
 * not stop it first. Every goal whose game form is built is then refused at `knowledge` naming that entry and its
 * test gap; the same record with the entry in place is NOT refused there; and a goal whose game form is not built
 * still says that first (an earlier refusal wins). The builder names no goal in its code (checked below).
 */
{
    const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
    const testRecord = (goalId: string, status: 'MISSING_KNOWLEDGE' | 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION'): LearningGoalAuthorization => ({
        learningGoalId: goalId,
        contextId: 'TEST-ONLY',
        gameProblemId: 'TEST-ONLY',
        ruledOn: 'TEST-ONLY',
        by: 'test',
        ruling: ['TEST-ONLY: never production data'],
        authorizedConstraints: [],
        authorizedConstraintsFinding: 'TEST-ONLY: evaluated, none justified',
        gaps: [{ id: 'T1', kind: 'DECISION', description: 'TEST-ONLY decision', note: null }],
        excluded: [],
        manipulations: [
            {
                phrase: 'TEST-ONLY phrase',
                phraseFrom: 'TEST-ONLY',
                aspect: null,
                tier: null,
                source: 'TEST-ONLY',
                registerRows: [],
                category: status === 'MISSING_KNOWLEDGE' ? 'GENUINE_GAP' : 'EXISTING_KNOWLEDGE_TO_VERIFY',
                status,
                gaps: status === 'MISSING_KNOWLEDGE' ? ['T1'] : [],
                statusBasis: 'TEST-ONLY',
                note: null,
            },
        ],
    })
    const recordsWith = (goalId: string, status: Parameters<typeof testRecord>[1]) => [...learningGoalAuthorizations().filter(r => r.learningGoalId !== goalId), testRecord(goalId, status)]
    const withoutContext = { alterSelection: (selection: { selected: { role: string }[] }) => void (selection.selected = selection.selected.filter(entry => entry.role !== CONTEXT_ROLE)) }
    const FORM_NOT_BUILT = ['A02', 'A03', 'A06']
    for (const goalId of activityReviewOptions().goals.map(goal => goal.id)) {
        const gapped = refused(buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId, session }, recordsWith(goalId, 'MISSING_KNOWLEDGE'), withoutContext).activity, `${goalId} with a test record gap`)
        if (FORM_NOT_BUILT.includes(goalId)) {
            assert.equal(gapped.stage, 'knowledge', goalId)
            assert.ok(gapped.reasons.some(reason => reason.includes('has no contribution contract')), `${goalId}: the unbuilt game form still says so first: ${JSON.stringify(gapped.reasons)}`)
            continue
        }
        assert.equal(gapped.stage, 'knowledge', `${goalId}: ${JSON.stringify(gapped.reasons)}`)
        assert.equal(gapped.summary, "This goal's activity depends on set-up decisions and engine capabilities that are not in place yet, so no activity can be built for it.")
        plain(gapped, `${goalId} record gap`)
        assert.deepEqual(gapped.reasons, [
            `1 part of the activity the authorization record of ${goalId} asks for is not in place yet`,
            'manipulation "TEST-ONLY phrase" is MISSING_KNOWLEDGE (GENUINE_GAP), waiting on T1',
        ])
        assert.deepEqual(gapped.account.authorizationLists?.gaps, [{ id: 'T1', kind: 'DECISION', description: 'TEST-ONLY decision', note: null, neededBy: ['TEST-ONLY phrase'] }])
        // The same record with the entry in place: the record gate lets it through to whatever the knowledge says next.
        const inPlace = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId, session }, recordsWith(goalId, 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION'), withoutContext).activity
        assert.ok(inPlace.outcome === 'served' || !(inPlace as RefusedActivity).reasons.some(reason => reason.includes('authorization record')), `${goalId}: no record gap, no record refusal`)
    }

    // No Learning Goal id in the builder's code (comments quote him and name goals by design, so they are stripped).
    const goalIds = new Set(activityReviewOptions().goals.map(goal => goal.id))
    const code = fs
        .readFileSync(path.join(__dirname, 'build-activity.ts'), 'utf8')
        .split('/*')
        .map((part, i) => (i === 0 ? part : part.slice(part.indexOf('*/') + 2)))
        .join(' ')
        .split('\n')
        .map(line => (line.trimStart().startsWith('//') ? '' : line.split(' // ')[0]))
        .join('\n')
    assert.deepEqual((code.match(/[A-Za-z0-9]+/g) ?? []).filter(word => goalIds.has(word)), [], 'build-activity.ts: no Learning Goal id outside comments')
}

/**
 * ── A session that does not fit the game is refused in the coach's terms ──────────────────────────
 *
 * Re-pointed 14 October 2026 from A04 to the scoring-modifier demonstration, through the same route: A04 is now
 * refused before its session reaches the roster (its context has no contract), so it can no longer carry a
 * roster test. The demonstration is the same possession game, and the sentences do not name a goal.
 */
const VEHICLE = { demonstrationId: 'scoring-modifier' }
{
    // An odd count does not split into the equal teams the game form requires. The roster rule names the
    // cause and the numbers; the sentence is built from those and not from the gate's own report.
    const nine = refused(reviewActivity(stored({ playerCount: 9 }), { ...VEHICLE, durationMin: 20 }), '9 players')
    assert.equal(nine.stage, 'session')
    assert.equal(nine.summary, '9 players cannot be split into the equal teams this game needs.')
    assert.ok(nine.reasons.some(reason => reason.includes('DOES_NOT_DIVIDE')), 'the cause travels in the reasons')
    assert.ok(nine.reasons.some(reason => reason.includes('GA-ROSTER-SUM')), `and so does what the gate itself reported: ${JSON.stringify(nine.reasons)}`)

    // The count is the coach's own number, so the sentence has to agree with it. Found in review: one
    // player was told "1 players cannot be split".
    const one = refused(reviewActivity(stored({ playerCount: 1 }), { ...VEHICLE, durationMin: 20 }), '1 player')
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
    // Served through the demonstration since 14 October: A04 no longer reaches a served activity (see above).
    served(reviewActivity(stored(), { ...VEHICLE, durationMin: 20, roles: { [ROLE]: 12 } }), 'every player in the role is still a session that adds up')

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
    served(reviewActivity(saved, { ...VEHICLE, durationMin: 20, roles: { [ROLE]: 0 } }), 'a role stated only in the review')
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
    // Through the demonstration since 14 October (A04 is refused before its roster; see above).
    const activity = served(reviewActivity(stored(), { ...VEHICLE, durationMin: 20, roles: { [ROLE]: 2 } }), 'two available')
    // The roster is one sentence since stage S-C2 (14 October 2026, his §7 consolidated language, DRAFT); the three
    // involvement cases are kept as its last part.
    assert.deepEqual(text(activity, 'Players').slice(0, 1), [`Divide 12 players into 2 teams of 6; ${ROLE}s play as outfield players in this activity`])
    assert.equal(activity.integrity.fidelityViolations, 0)
    assert.equal(activity.session.roles[ROLE], 2, 'the session reported back is the one the coach stated')

    const zero = served(reviewActivity(stored(), { ...VEHICLE, durationMin: 20 }), 'none available')
    assert.deepEqual(text(zero, 'Players').slice(0, 1), [`Divide 12 players into 2 teams of 6, with no ${ROLE}s`])
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
    // Over the scoring-modifier demonstration since 14 October: A04 is refused before derivation now, so an
    // alteration of its knowledge never reaches the roster. The demonstration is the same game form.
    const at = (available: number, knowledge = requiresOne()) =>
        buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { [ROLE]: available } } }, knowledge)

    // Two available for a game that involves one per team: derived, RENDERED, and nothing lost or invented.
    const staffed = served(at(2), 'one per team required, two available')
    assert.deepEqual(text(staffed, 'Players').slice(0, 1), [`Divide 12 players into 2 teams of 5, plus 1 ${ROLE} each`])
    assert.equal(staffed.integrity.fidelityViolations, 0)
    assert.equal(staffed.integrity.postRealizationValidated, true)
    assert.deepEqual(staffed.integrity.acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
    // The role's count is a part of the roster sentence (stage S-C2), with its own status and its number bound to its property.
    const said = (staffed.rendered.instructions.find(i => i.text.startsWith('Divide'))!.parts ?? []).find(p => p.text === `, plus 1 ${ROLE} each`)!
    assert.deepEqual([said.status, said.quantities, said.bindings.map(b => b.path)], ['DERIVED', [1], [`performers.teams[].${ROLE}`]], 'a count the knowledge requires is stated as derived, with its number declared and bound')

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
    assert.deepEqual(text(served(reviewActivity(stored(), { ...VEHICLE, durationMin: 20, roles: { [ROLE]: 2 } }), 'the demonstration itself, afterwards'), 'Players').slice(0, 1), [`Divide 12 players into 2 teams of 6; ${ROLE}s play as outfield players in this activity`])
}

// ── The coach's own session shapes the activity ───────────────────────────────────────────────────
{
    // Through the demonstration since 14 October (A04 is refused before its session shapes anything).
    const activity = served(reviewActivity(stored({ playerCount: 16, fieldLength: '50', fieldWidth: '35' }), { ...VEHICLE, durationMin: 15 }), '16 players, 50 x 35')
    assert.ok(text(activity, 'Set up').includes('Mark out an area 50 m long by 35 m wide'))
    assert.ok(text(activity, 'Players').includes('Divide 16 players into 2 teams of 8, with no ' + ROLE + 's'), JSON.stringify(text(activity, 'Players')))
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
    // Baseline of 13 October, measured at this session: 22 instructions and 0 violations. 22 → 11 on 14 October 2026
    // (stage S-C2, his §7 consolidated language): end lines, channels, roster, possession change, the modifier and the
    // channel preference each said once; the two perceptual-reference sentences excluded on his ruling of that day.
    assert.equal(modifier.rendered.instructions.length, 11)
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
     * **Nothing is withheld from it, and a criterion with no wording REFUSES it — 14 October 2026** (Step 4,
     * component 3). The demonstration holds no primary-event condition and no information rule (Wide Zone's
     * information rule is assumed and never enters the game), so its served text is unchanged. Over a copy whose
     * criterion is any other value, the fixed criterion sentence is no longer said for it: the field is withheld
     * and the activity refused in the coach's terms, naming the path in the technical account.
     */
    assert.deepEqual(modifier.rendered.withheld, [])
    {
        const differentCriterion = (contracts: any[]) => {
            const item = contracts.flatMap(c => c.items ?? []).find((i: any) => i.itemId === 'WIDEZONE-18.d')
            assert.ok(item, 'the Wide Zone criterion is in the selected contracts')
            item.value = 'a criterion nobody has worded (a test device)'
        }
        const waiting = refused(
            buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none } }, differentCriterion),
            'the scoring-modifier demonstration with an unworded criterion',
        )
        assert.equal(waiting.stage, 'communication', JSON.stringify(waiting.reasons))
        assert.equal(waiting.summary, 'Part of this activity is still waiting for approved coach wording, so it is not being shown.')
        plain(waiting, 'awaiting wording')
        assert.ok(waiting.reasons.some(reason => reason.startsWith('awaiting approved wording: value.valueModifiers[') && reason.endsWith('.condition.value (V8c)')), JSON.stringify(waiting.reasons))
    }

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
    /**
     * **Moved 14 October 2026, each for a ruling of that day, and measured.** The lines lost "For this activity,"
     * (his §7) and are STARTING; each preference moved to "Adjusting the activity" (§7, "Alternative ranges,
     * adjustments … can be presented separately"); and the numbers are established at the practical grain, inward
     * (§7, rounding at establishment; the grain is data and a proposal awaiting his confirmation): at 30 × 25 the
     * channel is 4 to 6 m, not 3.75 to 6.25 m, and the 25 cm sliver of preference is offered as the one practical
     * value, *"Around 6 m"*; at 20 × 15 it is 2.5 to 3.5 m. 40 × 30 is already on the grain and its numbers do not move.
     *
     * **Consolidated the same day (stage S-C2, his §7 language ruling; every sentence a DRAFT):** the two end lines
     * are one sentence, the two channels one ("along each touchline"), the preference one ("for each channel"); and
     * *"It helps if this channel is established as a perceptual reference"* is no longer said — his words: *"please
     * remove internal engine terminology such as 'perceptual reference' from coach-facing instructions unless it
     * conveys an actual action the coach needs to take"* (excluded through `coach-facing-exclusions.ts`, its one
     * consequence — the channel is marked — verified cited). 22 → 11 instructions at 40 × 30 and 30 × 25, 20 → 10 at
     * 20 × 15, 0 violations at each.
     */
    const expected: [number, number, number, string[], string[]][] = [
        [
            40,
            30,
            11,
            ['Mark out an area 40 m long by 30 m wide', 'Mark both end lines: they are the scoring lines', 'Mark a channel along each touchline, 40 m long and between 4.5 m and 7.5 m wide'],
            ['Around 6 m to 7.5 m wide works well for each channel'],
        ],
        [
            30,
            25,
            11,
            ['Mark out an area 30 m long by 25 m wide', 'Mark both end lines: they are the scoring lines', 'Mark a channel along each touchline, 30 m long and between 4 m and 6 m wide'],
            ['Around 6 m wide works well for each channel'],
        ],
        [20, 15, 10, ['Mark out an area 20 m long by 15 m wide', 'Mark both end lines: they are the scoring lines', 'Mark a channel along each touchline, 20 m long and between 2.5 m and 3.5 m wide'], []],
    ]
    for (const [length, width, instructions, setUp, adjusting] of expected) {
        const activity = at(length, width)
        assert.equal(activity.integrity.fidelityViolations, 0, `${length} x ${width}`)
        assert.equal(activity.integrity.postRealizationValidated, true)
        assert.deepEqual(activity.integrity.acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
        assert.equal(activity.rendered.instructions.length, instructions, `${length} x ${width}`)
        assert.deepEqual(text(activity, 'Set up'), setUp, `${length} x ${width}`)
        assert.deepEqual(text(activity, 'Adjusting the activity'), adjusting, `${length} x ${width}`)
        assert.ok(!activity.rendered.instructions.some(i => /perceptual reference/i.test(i.text)), 'no engine terminology reaches a coach')
        // Nothing but the area differs between them: the game is the same game on a different pitch.
        for (const section of ['Players', 'How it works', 'How to score']) assert.deepEqual(text(activity, section), text(modifier, section), `${length} x ${width}: ${section}`)
        // Every number said is declared, so every number said was checked — and none is a rounding.
        for (const said of activity.rendered.instructions) {
            assert.deepEqual([...said.text.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0])).filter(n => !said.quantities.includes(n)), [], said.text)
        }
    }
    // A width whose fraction has no exact binary form: 0.15 × 23 is exactly 3.45 (the float product is
    // 3.4499999999999997), and since 14 October 2026 that exact number is what is rounded inward to the
    // practical grain — 3.5 m, with 5.75 m becoming 5.5 m. The game holds 5.5 and the text says it.
    const awkward = at(35, 23)
    assert.equal(awkward.integrity.fidelityViolations, 0)
    assert.ok(text(awkward, 'Set up').includes('Mark a channel along each touchline, 35 m long and between 3.5 m and 5.5 m wide'), JSON.stringify(text(awkward, 'Set up')))

    /**
     * **More sizes, read sentence by sentence in the review of 13 October 2026 and pinned as read.** Each is
     * here for a reason of its own: 33 × 21 is a width whose minimum (3.15) the float product misses and
     * whose preference lies outside the requirement; 45 × 35 is one where the preferred floor sits INSIDE the
     * requirement (5.25 to 8.75, preferred from 6); 100 × 64 is one where the requirement's floor (9.6) is
     * ABOVE the preferred floor, so the preference offered is 9.6 to 10 and never 6; 30.5 × 22.2 is an area a
     * coach typed with decimals; and 40 × 24 is the one width where the preference meets the requirement at
     * a single point, so it is offered as one number — a sentence shape no other size produces. Every number
     * is one the game holds, with no digit added or dropped.
     *
     * **Re-read 14 October 2026 after rounding at establishment** (his §7; grain as data, a proposal awaiting his
     * confirmation: 0.5 m below 10 m, 1 m from 10 m, always inward). Every required range moved inward onto the
     * grain except 40 × 24's maximum (6 m, already on it): 3.6-6 → 4-6, 3.15-5.25 → 3.5-5, 5.25-8.75 → 5.5-8.5,
     * 9.6-16 → 10-16 (the floor crosses into the 1 m grain), 3.33-5.55 → 3.5-5.5. The preferences follow: 45 × 35
     * offers 6 to 8.5 m, and 100 × 64's 9.6-10 m sliver becomes the one practical value 10 m — a "single point"
     * is no longer the shape of one size only. No size offers a preference outside its own requirement. Both
     * channels in one sentence, and one preference for each, since stage S-C2 (same day).
     */
    const read: [number, number, string, string | null][] = [
        [40, 24, 'between 4 m and 6 m wide', 'Around 6 m wide works well'],
        [33, 21, 'between 3.5 m and 5 m wide', null],
        [45, 35, 'between 5.5 m and 8.5 m wide', 'Around 6 m to 8.5 m wide works well'],
        [100, 64, 'between 10 m and 16 m wide', 'Around 10 m wide works well'],
        [30.5, 22.2, 'between 3.5 m and 5.5 m wide', null],
    ]
    for (const [length, width, required, preference] of read) {
        const activity = at(length, width)
        assert.equal(activity.integrity.fidelityViolations, 0, `${length} x ${width}`)
        const setUp = text(activity, 'Set up')
        assert.deepEqual(setUp.filter(sentence => sentence.startsWith('Mark a channel')), [`Mark a channel along each touchline, ${length} m long and ${required}`], `${length} x ${width}`)
        const offered = activity.rendered.instructions.filter(i => i.status === 'PREFERENCE').map(i => i.text)
        assert.deepEqual(offered, preference ? [`${preference} for each channel`] : [], `${length} x ${width}: the preference is offered only inside the requirement, and as a PREFERENCE`)
        // No number a coach reads is a float artefact: each prints as the short decimal it is.
        for (const said of activity.rendered.instructions) {
            for (const [number] of said.text.matchAll(/\d+(?:\.\d+)?/g)) assert.ok(number.length <= 6, `"${number}" in "${said.text}"`)
        }
    }

    /**
     * **THE NEUTRAL-PLAYERS DEMONSTRATION IS SERVED — re-pointed 13 October 2026 (Stage B3).**
     *
     * The count is closed by the rule his 13 October instruction approved for a count with an authored preferred
     * range — the one member of *"one or two"* that leaves two whole equal teams in THIS session — and recorded as
     * where the activity starts, with its range beside it; the roster rule reads that count; the renderer says who
     * the neutral players are. Christian, 13 October: *"It is entirely appropriate to demonstrate the mechanism
     * independently in the meantime"* — and of the condition and any Learning Goal, *"I am not yet approving"* it.
     * So this remains a mechanism demonstration, labelled as one, and is associated with no goal and in no pool.
     *
     * Twelve players and thirteen, because they are the two cases: an even squad starts with two neutrals and
     * an odd one with one. Every sentence is a DRAFT for his wording review.
     *
     * **Consolidated 14 October 2026 (stage S-C2), on his §7 and his own example** — *"Divide 12 players into two
     * teams of five, with two neutral players. The neutrals support whichever team has possession and switch
     * immediately when possession changes."* — eight Players sentences became three, who starts with the ball moved
     * to "How it works", and the preferred count is offered within what the session can field (his §6: *"communicate
     * the valid option rather than presenting an impossible alternative"*): 2 at twelve players, 1 at thirteen.
     * 17 → 12 instructions at both sizes, 0 violations.
     */
    const NEUTRAL_ACTIVITY: [number, string[], string[]][] = [
        [
            12,
            [
                `Divide 12 players into 2 teams of 5, with 2 neutral players and no ${ROLE}s`,
                'The neutrals support whichever team has possession and switch immediately when possession changes. They take a full part in play — not waiting, resting or watching',
                'Make the neutrals easy to tell apart from both teams — for example, contrasting bibs',
            ],
            ['Keep at least 1 neutral player', '2 neutral players work well for a group this size'],
        ],
        [
            13,
            [
                `Divide 13 players into 2 teams of 6, with 1 neutral player and no ${ROLE}s`,
                'The neutral player supports whichever team has possession and switches immediately when possession changes. They take a full part in play — not waiting, resting or watching',
                'Make the neutral player easy to tell apart from both teams — for example, contrasting bibs',
            ],
            ['Keep at least 1 neutral player', '1 neutral player works well for a group this size'],
        ],
    ]
    // The bare possession game, built directly since 14 October: it was A04's activity, which is now refused
    // (its context has no contract). The comparison is with the game form alone, which is what A04 was.
    const a04 = served(buildActivityFromKnowledge(['GF2'], { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }).activity, 'the bare possession game')
    for (const [players, expectedPlayers, expectedAdjusting] of NEUTRAL_ACTIVITY) {
        const neutrals = served(reviewActivity(stored({ playerCount: players }), { demonstrationId: 'neutral-players', durationMin: 20 }), `the neutral-players demonstration with ${players} players`)
        assert.equal(neutrals.kind, 'mechanism-demonstration')
        assert.equal(neutrals.account.gameProblem, null, 'no Learning Goal, so no Game Problem')
        assert.equal(neutrals.account.contextId, null)
        assert.equal(neutrals.title, 'Neutral players')
        assert.ok(String(neutrals.subtitle).includes('Not a Learning Goal activity'))
        assert.deepEqual(neutrals.account.constraints.map(c => [c.title, c.contracted]), [['Neutral Player Condition', true]])
        // Baseline of 13 October, measured: 18 instructions and 0 violations, at both sizes. 17 since the review of
        // S-C1 (the unfieldable preferred range no longer offered); 12 since stage S-C2 (consolidated, 14 October 2026)
        // — the bare possession game's 8, plus three Players sentences and two adjusting lines less its roster sentence.
        assert.equal(neutrals.rendered.instructions.length, 12, `${players} players`)
        assert.equal(a04.rendered.instructions.length, 8)
        assert.equal(neutrals.integrity.fidelityViolations, 0)
        assert.deepEqual(neutrals.rendered.withheld, [], 'no condition or information rule in it, so nothing awaits wording (14 October)')
        assert.equal(neutrals.integrity.postRealizationValidated, true)
        assert.deepEqual(neutrals.integrity.acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] })
        assert.deepEqual(text(neutrals, 'Players'), expectedPlayers, `${players} players`)
        assert.deepEqual(text(neutrals, 'Adjusting the activity'), expectedAdjusting, `${players} players`)
        // The neutral condition changes who plays and nothing about the pitch or the scoring: every other
        // section is the bare possession game's, sentence for sentence. And what continues at a change of
        // possession is said ONCE, though two contracts assert that transition here.
        for (const section of ['Set up', 'How to score']) assert.deepEqual(text(neutrals, section), text(a04, section), `${players} players: ${section}`)
        assert.deepEqual(text(neutrals, 'How it works'), [
            'Play for 20 minutes',
            'Pick which team starts with the ball and tell both teams before you start',
            'When possession changes, play carries on with no stoppage, and the team that wins possession attacks the same line it was already attacking',
        ])
        assert.deepEqual(text(neutrals, 'How it works'), text(a04, 'How it works'))
        for (const said of neutrals.rendered.instructions) {
            assert.deepEqual([...said.text.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0])).filter(n => !said.quantities.includes(n)), [], said.text)
        }
    }

    // The session shapes it, as it shapes any activity: the squad decides the starting count and the sizes.
    for (const [players, count, size] of [[8, 2, 3], [15, 1, 7], [16, 2, 7], [3, 1, 1]] as const) {
        const activity = served(reviewActivity(stored({ playerCount: players }), { demonstrationId: 'neutral-players', durationMin: 20 }), `${players} players`)
        // One roster sentence since stage S-C2 (14 October 2026).
        assert.equal(text(activity, 'Players')[0], `Divide ${players} players into 2 teams of ${size}, with ${count} neutral player${count === 1 ? '' : 's'} and no ${ROLE}s`, `${players} players`)
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
        // A part of the roster sentence since stage S-C2 (14 October 2026), with the status of the property it says.
        const count = fits.rendered.instructions.flatMap(i => i.parts ?? []).find(p => p.from.includes('performers.neutrals.count') && p.text.includes('neutral player'))!
        assert.deepEqual([count.text, count.status], [', with 1 neutral player', 'DERIVED'])
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
        // 27 since the review of S-C1 (14 October 2026): the neutral count's unfieldable preferred range is no longer
        // offered (his §6), one sentence fewer at both sizes; the channel preferences are still offered. 15 since stage
        // S-C2 (same day, consolidated): the scoring modifier's 11, plus the allegiance, the bibs and the two adjusting lines.
        assert.equal(composed.rendered.instructions.length, 15, `${players} players`)
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

    /**
     * **THE PASS COMBINATION GATE, as a mechanism demonstration only — added 14 October 2026 (Step 4, S4b).**
     *
     * Christian that day: *"Please keep the current Pass Combination Gate as a mechanism demonstration only. I do
     * not want it reintroduced into learning-design examples until we've reviewed its ecological suitability."*
     * With his three answers in its knowledge (C44-C46), it is REFUSED at `structure`, and that is the measured,
     * honest state: removing "in their half" leaves the condition naming no place, and that line is a declared gap.
     * Until 15 October 2026 the gap came from the possession game's general "the qualifying condition must come from
     * elsewhere"; since his reply of that day it comes from the gate itself — its place is "not yet authored" (C49;
     * 16 October, item 8: "The gate remains excluded from this activity and should continue to be treated only as a
     * mechanism demonstration until its knowledge is resolved") — and the possession game's gap defers to it (C50).
     * What moves it is his authoring the gate's place, and then approved wording for the condition and the counting
     * rule — not anything this test or the engine supplies.
     */
    {
        const gate = refused(reviewActivity(stored(), { demonstrationId: 'pass-combination-gate', durationMin: 20 }), 'the pass-combination-gate demonstration')
        assert.equal(gate.kind, 'mechanism-demonstration')
        assert.equal(gate.title, 'Pass Combination Gate')
        assert.equal(gate.stage, 'structure', JSON.stringify(gate.reasons))
        assert.equal(gate.summary, 'The game this demonstration selects is not yet described completely enough to be set up.')
        plain(gate, 'the gate demonstration')
        assert.deepEqual(gate.reasons, [
            'Gate A is FAIL',
            'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE',
            '1 unresolved property is neither an authorized choice nor an authorized claim: c:blind:PASS-COMBINATION-GATE:PCG-02::V5',
        ])
        assert.equal(gate.account.gameProblem, null, 'no Learning Goal, so no Game Problem')
        assert.deepEqual(gate.account.constraints!.map(c => [c.title, c.contracted]), [['Pass Combination Gate', true]])
        const offered = activityReviewOptions().demonstrations.find(d => d.id === 'pass-combination-gate')!
        assert.ok(offered.statement.includes('Not a Learning Goal activity, and not approved for learning-design use'), 'and it says so wherever it is shown')

        // The hold names the demonstration that keeps the gate usable, and that demonstration exists.
        for (const hold of learningGoalSelectionHolds()) assert.ok(MECHANISM_DEMONSTRATIONS.some(d => d.id === hold.mechanismDemonstration), hold.mechanismDemonstration)

        /**
         * **Past the place, the chain runs to the end — over a TEST-ONLY copy.** With the condition's line an
         * established absence (nothing authored changes), Gate A defers, the game realizes, and post-realization
         * VALIDATES — which it could not before component 1: an established absence blocked the position clause. It
         * stops at communication on exactly the nine fields that await approved wording: the condition's type and
         * value, and the counting rule's subject, trigger and five dimensions.
         *
         * **Re-pointed 15 October 2026 (C49, C50), and now also the reason the two rulings landed together.** Until
         * then the copy dropped the possession game's general V5 gap. Since his reply of that day the gate's own
         * place is NOT_AUTHORED (16 October, item 8: "removing 'in their half' should not automatically be
         * interpreted as authorizing pass counting anywhere"), and the possession game's gap defers to the gate
         * (Option A, same item). So the copy puts the gate's statement back to the NON_CLAIMED C45 wrote — the
         * "explicitly unrestricted" reading he rejected — and that alone carries the demonstration from structure to
         * communication: Option A without C49 would have done exactly this to the real knowledge. With the deferral
         * stripped as well, it stays at structure.
         */
        const gateV5AsBeforeC49 = (contracts: any[]) => {
            const v5 = contracts.find(c => c.contractId === 'blind:PASS-COMBINATION-GATE').declarations.find((d: any) => d.row === 'V5')
            assert.equal(v5.declaration, 'NOT_AUTHORED', 'the copy starts from C49')
            v5.declaration = 'NON_CLAIMED'
        }
        const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
        const pastThePlace = refused(
            buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'pass-combination-gate', session }, gateV5AsBeforeC49),
            'the gate demonstration with its condition naming no place',
        )
        const withoutOptionA = refused(
            buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'pass-combination-gate', session }, contracts => {
                gateV5AsBeforeC49(contracts)
                for (const contract of contracts) for (const d of (contract.declarations ?? []) as any[]) delete d.defersTo
            }),
            'the gate demonstration without C49 and without Option A',
        )
        assert.equal(withoutOptionA.stage, 'structure', 'without the deferral the possession game\'s gap still governs')
        assert.ok(withoutOptionA.reasons.some(reason => reason.endsWith('c:blind:PASS-COMBINATION-GATE:PCG-02::V5')))
        assert.equal(pastThePlace.stage, 'communication', JSON.stringify(pastThePlace.reasons))
        assert.equal(pastThePlace.summary, 'Part of this activity is still waiting for approved coach wording, so it is not being shown.')
        const condition = 'value.primaryEvent.conditions[c:blind:PASS-COMBINATION-GATE:PCG-02]'
        const rule = 'value.informationRules[c:blind:PASS-COMBINATION-GATE:PCG-10]'
        assert.deepEqual(
            pastThePlace.reasons.filter(reason => reason.startsWith('awaiting approved wording: ')),
            [
                `${condition}.type (V4)`,
                `${condition}.value (V6)`,
                // Added 15 October 2026: the gate's condition is authored PER_TEAM, which it now carries (only a whole-game
                // condition carries no scope), and no approved sentence can say a scope, so the scope is withheld beside
                // its fields. Nothing else moves: the demonstration still stops here, at communication.
                `${condition}.scope (V3)`,
                `${rule}.subject (V16)`,
                `${rule}.trigger (V17)`,
                `${rule}.dimensions.D006_triggerType (V18)`,
                `${rule}.dimensions.D007_revealTiming (V19)`,
                `${rule}.dimensions.D008_revealProgression (V20)`,
                `${rule}.dimensions.D011_stateDependency (V21)`,
                `${rule}.dimensions.D013_accessHolder (V22)`,
            ].map(path => `awaiting approved wording: ${path}`),
        )
        assert.ok(!pastThePlace.reasons.some(reason => reason.includes('post-realization')), 'post-realization validated')
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
 * ── What the account says about where the constraints came from, and about the context ────────────
 *
 * **Re-pointed 14 October 2026, by his two rulings of that day.** This pinned two states that were put to him:
 * seven goals BORROWED constraints from the whole library, and no goal carried its context. He ruled on both:
 *
 * 1. *"Selection should only use constraints authorized for the Learning Goal … If no appropriate shaping
 *    constraint is available, please report that as a knowledge gap … Please keep those gaps visible."* So
 *    every goal draws from its own candidates, every constraint in an account is one of them, and the roles no
 *    candidate fills are listed as gaps. The borrowing table emptied, as this block said it would, and became
 *    the table of gaps. The Pass Combination Gate is shown as held for the three goals whose candidates name it.
 * 2. *"the Primary Scoring Event and qualifying condition approved for each Representative Performance Context
 *    should govern the generated activity."* So selection carries the context, and `inThisActivity` — read
 *    from the selection, as it always was — turned true by itself for the one goal whose context has a
 *    contract (A01). The other twelve stay false because their contexts have none, and they are refused.
 */
{
    /**
     * **15 October 2026: A01 draws from its authorization record**, which authorizes nothing (his item 1 of that day),
     * so every role is unfilled, nothing is held (the gate is not among its candidates — the record excludes it), and
     * it is a gap of its own kind. Every other goal's candidates are labelled VOCABULARY_POOL. Later that day, under his
     * general principle (16 October reply, item 1), A01 is no longer a gap: the unfilled roles stay reported as a fact.
     */
    const UNFILLED: Record<string, string[]> = {
        A01: ['foundation', 'shaping', 'consequence'],
        A02: ['shaping'],
        A04: ['shaping', 'consequence'],
        D01: ['shaping'],
        D02: ['shaping'],
        D03: ['shaping'],
        TD01: ['shaping'],
        TD02: ['shaping'],
    }
    const HELD = ['A05', 'TA02']
    // A01 left the gaps later on 15 October 2026: under his general principle (16 October reply, item 1) its
    // evaluated, empty set selects no constraint — no gap, and no constraint to list.
    const GAPS: Record<string, string> = { A02: 'NO_COMPATIBLE_COMBINATION', D03: 'NO_COMPATIBLE_COMBINATION' }
    const NONE_JUSTIFIED = ['A01']
    for (const goal of activityReviewOptions().goals) {
        const activity = reviewActivity(stored(), { learningGoalId: goal.id, durationMin: 20 })
        const account = activity.account
        const source = account.constraintSource!
        assert.ok(source, `${goal.id}: a goal's account says where its constraints came from`)
        assert.equal(source.source, goal.id === 'A01' ? 'AUTHORIZATION_RECORD' : 'GOAL_CANDIDATES', `${goal.id} draws from its own candidates, always`)
        assert.equal(source.constraintAuthority, goal.id === 'A01' ? 'AUTHORIZATION_RECORD' : 'VOCABULARY_POOL', `${goal.id}: whose authority its candidates carry`)
        assert.equal(account.authorization === null, goal.id !== 'A01', `${goal.id}: only A01 has an authorization record`)
        assert.deepEqual(source.unfilledRoles, UNFILLED[goal.id] ?? [], `${goal.id}: the roles no designated candidate fills`)
        assert.deepEqual(
            source.heldByRuling.map(hold => [hold.title, hold.ruledOn]),
            HELD.includes(goal.id) ? [['Pass Combination Gate', '2026-10-14']] : [],
            `${goal.id}: held by ruling`,
        )
        const constraints = account.constraints ?? []
        if (GAPS[goal.id]) {
            assert.equal(source.gap, GAPS[goal.id], goal.id)
            assert.deepEqual(constraints, [], `${goal.id}: a knowledge gap selects no constraint`)
        } else if (NONE_JUSTIFIED.includes(goal.id)) {
            assert.equal(source.gap, null, goal.id)
            assert.deepEqual(constraints, [], `${goal.id}: none is justified, so none is selected`)
            assert.ok(source.constraintPrinciple, `${goal.id}: and the account says under which principle`)
        } else {
            assert.equal(source.gap, null, goal.id)
            assert.ok(constraints.length, `${goal.id}: selection's constraints survive into the account, served or refused`)
            // The invariant his ruling makes, checked rather than assumed.
            assert.ok(constraints.every(c => c.fromGoalCandidates === true), `${goal.id}: every constraint is one of its candidates`)
            assert.ok(!constraints.some(c => c.title === 'Pass Combination Gate'), `${goal.id}: no goal selects the held gate`)
        }
        const context = account.context!
        assert.ok(context?.id && context.name, `${goal.id}: the account names its context`)
        assert.ok(context.approvedScoringCondition, `${goal.id}: and carries the approved scoring condition as authored`)
        // No goal's context was in an activity from 15 October 2026, when A01 — the one whose context has a contract —
        // stopped at selection. Later that day his general principle let A01 select again (no constraint), so its
        // context is carried once more; the other twelve have no contract.
        assert.equal(context.inThisActivity, goal.id === 'A01', `${goal.id}: only A01's context is in its activity`)
        // The context is never listed again as a raw id among what has no contract.
        assert.ok(!(account.selectedWithoutContract ?? []).includes(context.id), `${goal.id}: the context has its own entry`)
    }
    // Beat Defenders 1v1, which used to be given four constraints none of them its own: now its two candidates.
    const a04 = refused(reviewActivity(stored(), { learningGoalId: 'A04', durationMin: 20 }), 'A04').account
    assert.equal(a04.constraints!.length, 2)
    assert.ok(a04.constraints!.every(c => c.fromGoalCandidates === true), 'both of A04\'s constraints are among its candidates')
    // A demonstration involves no goal, so it has no candidates, no context, and is never provisional.
    const demonstration = served(reviewActivity(stored(), { demonstrationId: 'scoring-modifier', durationMin: 20 }), 'scoring-modifier').account
    assert.equal(demonstration.constraintSource, null)
    assert.equal(demonstration.context, null)
    assert.equal(demonstration.provisional, false)
    assert.ok(demonstration.constraints.every(c => c.fromGoalCandidates === null))
}

/**
 * ── A PROVISIONAL activity is served with the label — over an altered selection ───────────────────
 *
 * Christian, 14 October 2026, of the goals with unresolved Game Problems: *"they should not be presented as
 * completed learning-design examples … If a provisional output is useful for internal review, please label it
 * explicitly as provisional."* No goal is served today, so the label could be seen only on a refusal. Here a
 * goal's real selection is taken and its context left out ON A COPY — the tests-only entry, which nothing a coach is
 * served passes through — so the rest of it builds: the possession game with Wide Zone Advantage, the only one
 * of its constraints with a contract. That activity is served, and it says it is provisional; an approved goal
 * altered the same way (TA02) is served and does not.
 *
 * **Re-pointed 15 October 2026 from A01 to A05 (Progress the Attack).** A01 is no longer provisional (Gain Access is
 * recorded) and no longer selects at all (its authorization record authorizes no constraint), so it cannot carry the
 * label. A05 is still UNRESOLVED and selects the same contracted objects (GF2 and Wide Zone Advantage), measured
 * served and provisional with its context left out — the same game, so the comparison below is unchanged.
 */
{
    const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
    const withoutContext = (selection: any) => {
        selection.selected = selection.selected.filter((entry: { role: string }) => entry.role !== 'representative performance context')
    }
    const a05 = served(buildActivityOverAlteredSelection({ kind: 'learning-goal', goalId: 'A05', session }, withoutContext), 'A05 with its context left out')
    assert.equal(a05.account.provisional, true, 'an UNRESOLVED Game Problem is provisional, served or not')
    assert.equal(a05.account.gameProblem?.status, 'UNRESOLVED')
    assert.equal(a05.account.context!.inThisActivity, false, 'and the account says the context is not in it')
    const modifier = served(reviewActivity(stored(), { demonstrationId: 'scoring-modifier', durationMin: 20 }), 'scoring-modifier')
    assert.deepEqual(a05.rendered.instructions.map(i => i.text), modifier.rendered.instructions.map(i => i.text), 'it is the Wide Zone demonstration\'s game: nothing else it selects has a contract')

    const ta02 = served(buildActivityOverAlteredSelection({ kind: 'learning-goal', goalId: 'TA02', session }, withoutContext), 'TA02 with its context left out')
    assert.equal(ta02.account.gameProblem?.status, 'APPROVED')
    assert.equal(ta02.account.provisional, false, 'an approved Game Problem is not provisional')
    assert.equal(ta02.account.provisionalReason, null)
}

/**
 * ── A HELD object never reaches a Learning Goal's activity — the guard, over an altered selection ──
 *
 * Christian, 14 October 2026: *"Please keep the current Pass Combination Gate as a mechanism demonstration only"*,
 * and of his answers about its knowledge, *"This does not approve the gate for use with any Learning Goal."*
 * Selection already holds the gate out of every goal's pool, so no goal reaches the builder's guard today. Here
 * each of the three goals whose candidates name it has its real selection taken and the gate put back ON A COPY
 * (the tests-only entry) — the state a later selection change could produce. The builder refuses each at
 * `knowledge`, before derivation, whether or not the gate's own knowledge would pass its gates: the guard reads
 * the holds file, not a gate verdict, and lands before his answers change the gate's knowledge (Step 4, S0).
 */
{
    const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
    const GATE_ID = 'tl-v0-constraint-pass-combination-gate'
    const withTheGate = (selection: any) => {
        selection.selected = [...selection.selected, { id: GATE_ID, role: 'constraint' }]
    }
    /**
     * **A01 re-pointed 15 October 2026** to the same alteration made under a COPY of its authorization record with a
     * test-only zero-constraint ruling (`buildActivityUnderAuthorizationRecords`): A01's real selection now stops at
     * selection, before the guard, so the guard is exercised on the selection it would make if he answered D1 yes.
     *
     * **And back, later the same day:** he answered D1 with his general principle (16 October reply, item 1), so A01's
     * REAL selection reaches the guard again (GF2, no constraint) and the test-only copy is no longer needed: A01 is
     * altered exactly as the other goals are.
     */
    const altered = (goalId: string, alterSelection: (selection: any) => void) => buildActivityOverAlteredSelection({ kind: 'learning-goal', goalId, session }, alterSelection)
    for (const goalId of ['A01', 'A05', 'TA02']) {
        const held = refused(altered(goalId, withTheGate), `${goalId} with the held gate put back`)
        assert.equal(held.stage, 'knowledge', `${goalId}: ${JSON.stringify(held.reasons)}`)
        assert.equal(held.summary, 'This goal selects a rule that has not been approved for learning-design activities yet.')
        plain(held, `${goalId} held`)
        assert.deepEqual(held.reasons, [`${GATE_ID} is held out of Learning Goal activities by ruling of 2026-10-14: a mechanism demonstration only (pass-combination-gate)`])
        assert.equal(held.account.gameForm!.contracted, true, 'a hold refusal is at knowledge with the game form built — not the game-form refusal')
    }

    /**
     * **The guard reads the hold by KNOWLEDGE KEY — the key derivation loads a contract by** (S-B review,
     * 14 October 2026). `derivationInputFor` loads the gate's contract for any spelling `knowledgeKey` folds to
     * `PASS-COMBINATION-GATE` — the library id, the contract id, the bare key — and the guard compared the
     * library id as text, so the same object under another spelling reached derivation unguarded (measured:
     * A05 then fell through to the context refusal and A01 to structure, neither saying the gate is held). The
     * design named that exact risk ("an id spelling mismatch silently admits the gate"). Each spelling is now
     * refused by the hold, and the reason names the id as selected.
     */
    for (const alias of ['blind:PASS-COMBINATION-GATE', 'PASS-COMBINATION-GATE', 'pass-combination-gate']) {
        for (const goalId of ['A01', 'A05']) {
            const held = refused(
                altered(goalId, selection => {
                    selection.selected = [...selection.selected, { id: alias, role: 'constraint' }]
                }),
                `${goalId} with the held gate spelled ${alias}`,
            )
            assert.equal(held.stage, 'knowledge', `${goalId} ${alias}: ${JSON.stringify(held.reasons)}`)
            assert.equal(held.summary, 'This goal selects a rule that has not been approved for learning-design activities yet.', `${goalId} ${alias}`)
            assert.deepEqual(held.reasons, [`${alias} is held out of Learning Goal activities by ruling of 2026-10-14: a mechanism demonstration only (pass-combination-gate)`])
        }
    }

    /**
     * **What A01's record excludes never reaches A01's activity — 15 October 2026.** Christian, item 7: *"Please leave
     * Wide Zone Advantage out of this initial Play Out from the Back demonstration."* Selection cannot pick it (the
     * record authorizes nothing it excludes), so the guard is exercised by putting it back on a copy of the
     * selection, under the test-only ruling, in each spelling derivation would load: refused at `knowledge`, before
     * derivation, naming the record. The same object in another goal's selection is untouched (TA02 selects Wide Zone
     * from its own candidates and is refused later, at its context — the exclusion is A01's alone).
     */
    for (const spelling of ['tl-v0-constraint-wide-zone-advantage', 'WIDE-ZONE-ADVANTAGE', 'blind:WIDE-ZONE-ADVANTAGE']) {
        const excluded = refused(
            altered('A01', selection => {
                selection.selected = [...selection.selected, { id: spelling, role: 'constraint' }]
            }),
            `A01 with Wide Zone Advantage spelled ${spelling}`,
        )
        assert.equal(excluded.stage, 'knowledge', `${spelling}: ${JSON.stringify(excluded.reasons)}`)
        assert.equal(excluded.summary, "This goal selects a rule that has been excluded from this goal's activities.")
        plain(excluded, `A01 excluded ${spelling}`)
        assert.deepEqual(excluded.reasons, [`${spelling} is excluded from A01's activities by ruling of 2026-10-15 (its authorization record)`])
    }
    const ta02 = refused(reviewActivity(stored(), { learningGoalId: 'TA02', durationMin: 20 }), 'TA02')
    assert.ok(ta02.account.constraints!.some(c => c.title === 'Wide Zone Advantage'), 'TA02 still selects Wide Zone from its own candidates')
    assert.notEqual(ta02.summary, "This goal selects a rule that has been excluded from this goal's activities.")
}

/**
 * ── The realized game must carry the context's approved scoring — the post-realization guard ──────
 *
 * Christian, 14 October 2026: the approved scoring *"should govern the generated activity."* The builder reads
 * the concrete game after realization and refuses where its primary event is not one the context approves, or
 * a condition the context's contract constitutes is missing. No goal reaches it today — A01, the one goal whose
 * context has a contract, stops before it (on its record's gaps since 15 October 2026, and at Gate A behind them) — so it is exercised on constructed games against RPC-001's real
 * contract (a copy), at the paths the register gives and the served fixture shows (`value.primaryEvent`).
 */
{
    const rpc = JSON.parse(JSON.stringify(loadCorpusContracts().find(contract => contract.objectId === 'RPC-001')))
    const approved = rpcLibrary.scoringEventsForContext('RPC-001')
    assert.deepEqual(constitutedConditionTypes(rpc).map(c => c.type), ['origin', 'progression', 'control', 'exclusion'], 'what RPC-001 constitutes on the conditions row')
    const all = constitutedConditionTypes(rpc).map(c => ({ type: c.type }))
    const game = (kind: string | undefined, conditions: { type: string }[] = all) => ({ value: { primaryEvent: { value: 1, kind, conditions } } })

    assert.deepEqual(contextScoringFindings('RPC-001', rpc, game('line_crossed'), approved), [], 'an approved event with every condition passes')
    const wrongEvent = contextScoringFindings('RPC-001', rpc, game('regain'), approved)
    assert.equal(wrongEvent.length, 1)
    assert.ok(wrongEvent[0].includes('"regain"') && wrongEvent[0].includes('does not approve'), wrongEvent[0])
    const noControl = contextScoringFindings('RPC-001', rpc, game('line_crossed', all.filter(c => c.type !== 'control')), approved)
    assert.deepEqual(noControl, ['the control condition RPC-001 constitutes (RPC-001-18.f) is not in the realized game\'s primary event'])
    // The served possession game today: an event, and no conditions at all — every one is named.
    assert.equal(contextScoringFindings('RPC-001', rpc, { value: { primaryEvent: { value: 1, kind: 'line_crossed' } } }, approved).length, 4)
    assert.equal(contextScoringFindings('RPC-001', rpc, {}, approved).length, 5, 'no primary event at all: the event and every condition')
    // A condition the contract does not constitute is not required.
    rpc.items = rpc.items.filter((item: any) => item.itemId !== 'RPC-001-18.f')
    assert.deepEqual(contextScoringFindings('RPC-001', rpc, game('line_crossed', all.filter(c => c.type !== 'control')), approved), [])
    assert.equal(contextScoringFindings('RPC-001', undefined, game('line_crossed'), approved).length, 1, 'a contract that did not reach the build is itself a finding')
}

/**
 * ── The guard is WIRED: through the real builder, over an altered copy of A01's knowledge ─────────
 *
 * Added in review, 14 October 2026. The block above proves the guard's function on constructed games; it did
 * not prove that `build()` calls it on the realized game, and no goal reaches that point today. So A01 is built
 * through the one chain with RPC-001's items that stop it at Gate A taken out ON A COPY (the conditions, the
 * build-out team's objective and team counts — each one of his pending knowledge decisions K1-K4, not a
 * proposal for them). It then realizes with its context carried, its primary event on a line being crossed, and
 * no condition constituted: the guard passes it, and it stops later, at communication. With the context's
 * approved events read WITHOUT that event (the library read is stood in for this one build), the identical
 * build is refused at validation and the reason names the event. A missing condition cannot be driven through
 * the builder today — every constituted condition stops Gate A first (the referent faults Step 4 component 1
 * corrects) — so that half stays proven on constructed games above.
 */
{
    const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none }
    const PENDING = ['18.a', '18.b', '18.c', '18.d', '18.e', '18.f', '18.g', '19.a', '19.b', '11.a', '11.b', '08.c', '13', '14.a', '02', '03'].map(id => `RPC-001-${id}`)
    const trimmed = (contracts: any[]) => {
        const rpc = contracts.find(contract => contract.objectId === 'RPC-001')
        assert.ok(rpc, 'A01 carries its context\'s contract into derivation')
        rpc.items = rpc.items.filter((item: any) => !PENDING.includes(item.itemId))
    }
    /**
     * **Re-pointed 15 October 2026** from `buildActivityOverAlteredKnowledge` to the same alteration under a COPY of
     * A01's authorization record with a test-only zero-constraint ruling: A01's real selection now stops at selection
     * (its record authorizes nothing yet, his item 1 of that day), so the guard is reached through the selection he
     * would get if he answered D1 yes — GF2 and RPC-001, no library constraint. Measured: it still reaches
     * `communication` with the guard passed, and `validation` with the event withheld.
     *
     * **Re-pointed back later the same day:** under his general principle (16 October reply, item 1) A01's real
     * selection is that selection — GF2 and RPC-001, no library constraint — so the alteration runs over the
     * production records again, through `buildActivityOverAlteredKnowledge`, with no test-only copy of the record.
     *
     * **Re-pointed 15 October 2026 (stage H3)** to the same alteration over the records with their gap entries set
     * aside (`withoutGapEntries`, TEST-ONLY): the production record now refuses A01 before derivation on its gaps, and
     * this block is about the guard behind it. Measured: the outcomes below are unchanged.
     */
    const a01 = { kind: 'learning-goal' as const, goalId: 'A01', session }
    const underTestRuling = (alter: (contracts: any[]) => void) => buildActivityUnderAuthorizationRecords(a01, withoutGapEntries(), { alter }).activity
    /**
     * **Re-pointed 15 October 2026 (his 9.8): refused at `communication` -> SERVED, over this TEST-ONLY copy, measured.**
     * What stopped it at communication was TWO balls — the context's own (RPC-001-10.a) beside the Sport Profile's —
     * one of which no instruction said (fidelity Q3). His reply of that day, *"One ball shared between context and game:
     * Approved."*, is recorded as a realization identification (`realization-choices-rpc-001.json`) and the game now
     * holds one. So the guard passes and nothing later stops it: on a copy whose build-out condition, goalkeeper and
     * direction items are taken out, the game served is the bare symmetric possession game with the context's scoring
     * event — exactly the "technically valid but solves a different problem" activity his 16 October item 10 asks the
     * engine to refuse. Production knowledge refuses it, at Gate A; the copy is for the guard only.
     */
    const passed = underTestRuling(trimmed)
    assert.equal(passed.outcome, 'served', `the guard passes a realized game scored on an approved event: ${JSON.stringify((passed as RefusedActivity).reasons)}`)
    assert.equal(((passed as ServedActivity).rendered.instructions.filter(i => /\bball\b/.test(i.text)).length > 0), true, 'the ball is still said')

    const read = rpcLibrary.scoringEventsForContext
    try {
        ;(rpcLibrary as any).scoringEventsForContext = (id: string) => read(id).filter(kind => kind !== 'line_crossed')
        const guarded = refused(underTestRuling(trimmed), 'A01 over the trimmed copy, its event not approved')
        assert.equal(guarded.stage, 'validation', JSON.stringify(guarded.reasons))
        assert.ok(
            guarded.reasons.some(reason => reason.includes('"line_crossed"') && reason.includes('RPC-001 does not approve')),
            `the reason names the realized event and the context: ${JSON.stringify(guarded.reasons)}`,
        )
        plain(guarded, 'the guard refusal')
    } finally {
        ;(rpcLibrary as any).scoringEventsForContext = read
    }
    assert.deepEqual(rpcLibrary.scoringEventsForContext('RPC-001'), read('RPC-001'), 'the library read is restored')
}

/**
 * ── C53, 15 October 2026: the goalkeeper requirement is no longer universal — and the roster today, pinned ─────
 *
 * His 9.4: *"Goalkeeper-or-controlled-restart alternative: Approved."* — our change 4, *"Your 'Goalkeeper
 * availability' is read as applying where the activity includes a goalkeeper, not as a requirement on every team."*
 * RPC-001-02 and RPC-001-03 (one goalkeeper on every build-out team, on every attacking team) are retired, originals
 * kept. Measured through the real chain over a TEST-ONLY copy with only the build-out condition items taken out (so
 * the build passes Gate A and reaches the roster): before C53 the roster could not be settled — the two items speak
 * of particular teams and nothing tells one instantiated team from another — with two goalkeepers available or
 * none; after it, two goalkeepers available give 6 + 0 against 6 + 0 and the goalkeepers go unused.
 *
 * **A KNOWN STOP, named for what would move it:** his decision D6 (allocation and goalkeepers — equal numbers with
 * the asymmetry carried by roles, or not; and what a team's goalkeeper does while it presses) and capability M2 (each
 * team's goalkeeper supplied from the chosen restart arm, or AM-01 designation reach). The goalkeeper-or-controlled-
 * restart alternative itself (RPC-001-15.b, T3 at START) waits on capability M3. Nothing here calls two goalkeepers
 * "supported".
 */
{
    const CONDITIONS = ['18.a', '18.b', '18.c', '18.d', '18.e', '18.f', '18.g', '19.a', '19.b'].map(id => `RPC-001-${id}`)
    const withoutConditions = (contracts: any[]) => {
        const rpc = contracts.find(contract => contract.contractId === 'restated:RPC-001')
        rpc.items = rpc.items.filter((item: any) => !CONDITIONS.includes(item.itemId))
    }
    const raw: any[] = repairCorpusEncoding(readJson('stage-b/contracts.json'), { strings: 0, charactersRecovered: 0 })
    const authoredRpc = raw.find(entry => String(entry.name).startsWith('RPC-001')).result
    const asBeforeC53 = (contracts: any[]) => {
        withoutConditions(contracts)
        const rpc = contracts.find(contract => contract.contractId === 'restated:RPC-001')
        for (const id of ['RPC-001-02', 'RPC-001-03']) {
            const { id: itemId, ...rest } = authoredRpc.items.find((item: any) => item.id === id)
            rpc.items.push({ itemId, ...rest })
        }
    }
    const loaded = loadCorpusContracts().find(contract => contract.contractId === 'restated:RPC-001')!
    assert.ok(!loaded.items.some(item => ['RPC-001-02', 'RPC-001-03'].includes(item.itemId)), 'retired from the active knowledge')
    assert.ok(authoredRpc.items.some((item: any) => item.id === 'RPC-001-02') && authoredRpc.items.some((item: any) => item.id === 'RPC-001-03'), 'and kept in contracts.json')
    assert.deepEqual(loaded.declarations.filter((d: any) => d.row === 'P3').map((d: any) => d.declaration), ['NON_CLAIMED'], 'its P3 claim restated beside them')

    // Re-pointed 15 October 2026 (stage H3) over the records with their gap entries set aside (TEST-ONLY): production A01
    // now stops before derivation on its record's gaps, goalkeeper positioning among them (D6, M2, M3). Measured unchanged.
    const overCopy = (session: any, alter: (contracts: any[]) => void) => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, withoutGapEntries(), { alter }).activity
    for (const keepers of [2, 0]) {
        const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } }
        const before = refused(overCopy(session, asBeforeC53), `A01 before C53, ${keepers} of ${ROLE}`)
        assert.ok(before.reasons.some(reason => reason.startsWith('roster (INVOLVEMENT_NOT_SETTLED): restated:RPC-001::RPC-001-02 speaks of particular teams')), JSON.stringify(before.reasons))
        const now = served(overCopy(session, withoutConditions), `A01 after C53, ${keepers} of ${ROLE}`)
        const roster = now.rendered.instructions.find(instruction => instruction.text.startsWith('Divide 12 players into 2 teams of 6'))
        assert.ok(roster, JSON.stringify(now.rendered.instructions.map(i => i.text)))
        // 6 + 0 against 6 + 0: with two available the goalkeepers play outfield (unused as goalkeepers) — D6 / M2.
        assert.equal(roster!.text, keepers ? `Divide 12 players into 2 teams of 6; ${ROLE}s play as outfield players in this activity` : `Divide 12 players into 2 teams of 6, with no ${ROLE}s`)
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
