/**
 * Unit tests — the selection hints for a guided Learning Goal.
 *
 * Two things are pinned here, and they are different kinds of thing.
 *
 * THE RULE. Christian, 13 October: the approved Game Problem translation governs wherever it disagrees with
 * what a goal's wording implies; where no translation is approved the Game Problem is an unresolved
 * learning-design decision and nothing is substituted for it. The thirteen goals are asserted by name,
 * because each row is his decision and a change to any of them should be noticed rather than absorbed.
 *
 * THE SINGLE SOURCE. The context rule he approved in September was applied by the application and left out
 * by the integrity-checked pathway for a month, because each composed its own hints. The last test reads
 * both call sites and fails if either stops going through this module. A structural test is the only kind
 * that could have caught that: both pathways were individually correct by their own tests throughout.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { SIGNAL_GROUP_TO_GAME_PROBLEM } from '../knowledge-core/affordance-target-matrix'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { learningGoalAuthorization, learningGoalAuthorizations, libraryConstraintPrinciple } from '../test-library/learning-goal-authorizations'
import { gameProblemInferredFromWording, governByApprovedGameProblem, guidedGoalText, guidedSelectionHints, hintsUnderAuthorization } from './guided-selection'
import { rpcLibrary } from './rpc-library'
import { soccerModule } from './soccer-module'

const goalText = (id: string): string => {
    const goal = sessionPlanningModel.learningGoal(id)!
    return `${goal['Learning Goal']}. ${goal['Coach Definition']}`
}
const list = (value: unknown): string[] =>
    String(value ?? '')
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)

/**
 * His translation, goal by goal. `null` is not a placeholder for a value to be filled in by inference: it is
 * the state "no Game Problem is approved for this goal", which the Session Planning Model records as an
 * intentional gap (A04) or as still to be decided (A05, A06).
 *
 * **A01 is GP-005 since 15 October 2026** — Christian: "I approve Gain Access as the primary Game Problem for Play
 * Out from the Back". Its wording implies GP-015, so it joins the governed goals for its Game Problem, lenses and
 * game forms; its CONSTRAINTS come from its authorization record instead (tested below), because the same item says
 * approving Gain Access "does not automatically authorize the candidate constraints currently derived from
 * vocabulary coverage".
 */
const APPROVED: Record<string, string | null> = {
    A01: 'GP-005',
    A02: 'GP-015',
    A03: 'GP-006',
    A04: null,
    A05: null,
    A06: null,
    D01: 'GP-012',
    D02: 'GP-016',
    D03: 'GP-016',
    TA01: 'GP-002',
    TA02: 'GP-015',
    TD01: 'GP-004',
    TD02: 'GP-013',
}

/** The goals whose wording implies a different Game Problem from the one he approved. Four since 15 October (A01). */
const GOVERNED = ['A01', 'D02', 'D03', 'TA01']

function testEveryGoalReportsTheApprovedGameProblemOrNone(): void {
    const ids = sessionPlanningModel.learningGoals().map((goal) => String(goal['ID']))
    assert.deepEqual([...ids].sort(), Object.keys(APPROVED).sort(), 'the table above must name every Learning Goal')

    for (const id of ids) {
        const { gameProblem } = guidedSelectionHints(id, goalText(id))
        const approved = APPROVED[id]
        if (approved === null) {
            assert.equal(gameProblem.status, 'UNRESOLVED', `${id} has no approved translation`)
            assert.equal(gameProblem.gameProblemId, null, `${id}: an inferred Game Problem must never stand in for an unapproved one`)
            assert.equal(gameProblem.governed, false)
        } else {
            assert.equal(gameProblem.status, 'APPROVED', `${id}`)
            assert.equal(gameProblem.gameProblemId, approved, `${id}: the approved translation is the Game Problem`)
            assert.equal(gameProblem.governed, GOVERNED.includes(id), `${id}: governed only where the wording disagreed`)
        }
    }
}

/** Where nothing disagrees — or nothing is approved — the wording's hints pass through untouched. */
function testAgreementAndAbsenceChangeNothing(): void {
    for (const id of Object.keys(APPROVED).filter((goal) => !GOVERNED.includes(goal))) {
        const wording = deriveInputConstraints(goalText(id))
        const { hints } = governByApprovedGameProblem(id, wording)
        assert.equal(hints, wording, `${id}: the very same hints, not a copy that could drift`)
    }
}

/**
 * The three disagreements. Each used to be selected for the Game Problem its wording implied — two of them
 * as possession goals because their definitions contain the word — and is now selected from the candidate
 * knowledge the sport module records for the Game Problem he approved.
 */
function testADisagreementIsGovernedByTheApprovedGameProblem(): void {
    // A01 since 15 October 2026. This is the Game Problem governance alone; `guidedSelectionHints` then replaces A01's
    // constraints with its authorization record's (see testARecordReplacesBothVocabularySources).
    const inferredBefore: Record<string, string> = { A01: 'GP-015', D02: 'GP-015', D03: 'GP-012', TA01: 'GP-015' }
    for (const id of GOVERNED) {
        const wording = deriveInputConstraints(goalText(id))
        assert.equal(gameProblemInferredFromWording(wording), inferredBefore[id], `${id}: what the wording alone implies`)

        const { hints, gameProblem } = governByApprovedGameProblem(id, wording)
        const approved = APPROVED[id]!
        assert.equal(gameProblem.inferredFromWording, inferredBefore[id], `${id}: the disagreement stays on the record`)

        const coverage = soccerModule.coverageForGameProblem(approved)!
        assert.deepEqual(hints.candidateAffordanceLensIds, list(coverage['lens_ids']), `${id}: lenses are the approved Game Problem's`)
        assert.deepEqual(hints.candidateConstraintIds, list(coverage['supported_realization_group_ids']), `${id}: constraints likewise`)
        assert.deepEqual(hints.candidateArchetypeIds, list(coverage['supported_game_form_ids']), `${id}: and game forms, before the context limits them`)

        // No signal group that belongs to a different Game Problem survives, so nothing downstream — the
        // resolution status, the affordance profile — can read the old inference back out of the hints.
        for (const signal of hints.matchedSignals) {
            const mapped = SIGNAL_GROUP_TO_GAME_PROBLEM[signal]
            if (mapped) assert.equal(mapped[0], approved, `${id}: ${signal} belongs to another Game Problem`)
        }
        assert.ok(hints.matchedSignals.length > 0, `${id}: the goal still resolves, on its own Game Problem's signal groups`)
        assert.equal(gameProblemInferredFromWording(hints), approved, `${id}: read back from the governed hints, the Game Problem is the approved one`)
    }
}

/**
 * The forced negative. An approved Game Problem the sport module holds no supported knowledge for must leave
 * the goal with NO candidates, so selection reports it unresolved. Keeping the wording's pool here would be
 * exactly the substitution the rule forbids, and nothing in the current registry exercises the branch.
 */
function testAnApprovedGameProblemWithNoKnowledgeBorrowsNothing(): void {
    const wording = deriveInputConstraints(goalText('D02'))
    assert.ok(wording.candidateConstraintIds.length > 0, 'the wording produces a pool, so there is something to wrongly keep')

    for (const gameProblemId of ['GP-999', unsupportedGameProblem()]) {
        const { hints, gameProblem } = governByApprovedGameProblem('D02', wording, gameProblemId)
        assert.equal(gameProblem.governed, true)
        assert.deepEqual(hints.candidateConstraintIds, [], `${gameProblemId}: no borrowed constraints`)
        assert.deepEqual(hints.candidateAffordanceLensIds, [], `${gameProblemId}: no borrowed lenses`)
        assert.deepEqual(hints.candidateArchetypeIds, [], `${gameProblemId}: no borrowed game forms`)
        assert.deepEqual(hints.matchedSignals, [], `${gameProblemId}: and no signal group, so the selection cannot report itself matched`)
    }
}

function unsupportedGameProblem(): string {
    const row = soccerModule.coverage().find((entry) => String(entry['coverage_status'] ?? '') !== 'SUPPORTED')
    assert.ok(row, 'the Coverage sheet records at least one Game Problem it cannot serve')
    return String(row!['game_problem_id'])
}

/** The context rule rides on top: every goal's game forms are ones its routed context declares. */
function testTheContextStillLimitsTheGameForms(): void {
    for (const id of Object.keys(APPROVED)) {
        const { hints, contextId } = guidedSelectionHints(id, goalText(id))
        assert.ok(contextId, `${id} routes to a context`)
        const declared = rpcLibrary.gameFormsForContext(contextId!).map((form) => form.relatedId)
        for (const form of hints.candidateArchetypeIds) {
            assert.ok(declared.includes(form), `${id}: ${form} is not a game form ${contextId} declares`)
        }
    }
}

/**
 * Both pathways must ask this module. Reading the source is crude and deliberate: the defect it guards was a
 * caller composing the rule by hand and leaving half of it out, which no behavioural test of either caller
 * could see, because each was consistent with itself.
 */
function testBothPathwaysGoThroughThisModule(): void {
    const read = (relative: string) => fs.readFileSync(path.resolve(__dirname, relative), 'utf8')
    const checkedPathway = read('../derivation/run-bounded-selection.ts')
    assert.match(checkedPathway, /guidedSelectionHints\(/, 'the checked pathway takes its hints from here')
    assert.doesNotMatch(checkedPathway, /deriveInputConstraints\(/, 'and does not compose its own from the wording')

    /**
     * Re-pointed 14 October 2026 (stage S-C2): the application asked this module's two halves separately
     * (`governByApprovedGameProblem`, then `gateCandidateGameFormsToContext`) over the coach's composed text. It now
     * asks `guidedSelectionHints` — the same call the checked pathway makes — over the same canonical text
     * (`guidedGoalText`), his 13 October "same rules" ruling applied to the text as well as the rule. The context gate
     * stays in the route for free text's routed case only.
     */
    const application = read('../../routes/app.routes.ts')
    assert.match(application, /guidedSelectionHints\(guidedGoalId, guidedGoalText\(guidedGoalId\)\)/, 'the application asks this module, over the canonical goal text')
    assert.match(checkedPathway, /guidedGoalText\(goalId\)/, 'and the checked pathway selects from the same text')
    assert.doesNotMatch(application, /governByApprovedGameProblem\(/, 'and composes no half of the rule by hand')
    // Review of S-C2 (14 October 2026): the HINTS were pinned and the TEXT selection scores lenses and constraints
    // against was not — the route could go back to scoring the coach's composition and every assertion above would
    // stay green. The canonical text is what selection is given for a guided goal; free text keeps the coach's words.
    assert.match(application, /const selectionText = guidedGoalId \? guidedGoalText\(guidedGoalId\) : goalText/, 'the selection text is the canonical goal text for a guided goal')
    assert.match(application, /learningGoals: guidedGoalId \? \[selectionText\] : learningGoals,/, 'and that is the text generateSelection scores')
    assert.match(application, /isKnownUnsupportedGoal\(selectionText\)/, 'and the known-gap check reads the same text')
}

/**
 * **One goal text for both pathways — behaviourally.** For every guided goal, the hints the application route asks
 * for are the hints `selectFor` asks for, because both ask `guidedSelectionHints` over `guidedGoalText`. Measured
 * before stage S-C2: the route's text was the coach's composition (goal, situation, note), and A02's candidate game
 * forms differed with it.
 */
function testOneGoalTextForBothPathways(): void {
    for (const id of Object.keys(APPROVED)) {
        const text = guidedGoalText(id)
        assert.equal(text, goalText(id), `${id}: the canonical text is the goal's name and Coach Definition`)
        assert.deepEqual(guidedSelectionHints(id, text).hints, guidedSelectionHints(id, goalText(id)).hints, id)
    }
}

/**
 * **A goal with an authorization record takes its constraints from the record, and from nothing else** — 15 October
 * 2026. Christian, item 1: *"approving Gain Access does not automatically authorize the candidate constraints
 * currently derived from vocabulary coverage."* Measured before the record existed: recording GP-005 alone moved A01
 * from the wording pool onto the Coverage row CV-005 — Central Density, Wide Zone Advantage, Progression Bonus,
 * Switch of Play Bonus — Wide Zone being what his item 7 excludes. So:
 *   - (G1.5) A01's candidate constraints are IDENTICAL with no approved Game Problem and with GP-005: the Game
 *     Problem row alone cannot move a recorded goal's selection;
 *   - they are the record's (none), never CV-005's members, never the wording pool's;
 *   - the hints say whose authority they carry; the lenses and game forms are left as governance and the context
 *     gate made them;
 *   - D02, D03 and TA01 are untouched: no record, so still the vocabulary pool (his principle may reach them — that
 *     is put to him as decision D6, not applied here).
 */
function testARecordReplacesBothVocabularySources(): void {
    const wording = deriveInputConstraints(goalText('A01'))
    const record = learningGoalAuthorization('A01')!
    const unapproved = hintsUnderAuthorization(governByApprovedGameProblem('A01', wording, null).hints, record)
    const approved = hintsUnderAuthorization(governByApprovedGameProblem('A01', wording, 'GP-005').hints, record)
    assert.deepEqual(unapproved.candidateConstraintIds, approved.candidateConstraintIds, 'the Game Problem row alone cannot move A01\'s constraints')

    const { hints, gameProblem, authorization } = guidedSelectionHints('A01', goalText('A01'))
    assert.deepEqual(hints.candidateConstraintIds, record.authorizedConstraints, 'the record\'s constraints, and only those')
    assert.deepEqual(hints.candidateConstraintIds, [], 'none is authorized yet')
    const cv005 = list(soccerModule.coverageForGameProblem('GP-005')!['supported_realization_group_ids'])
    assert.deepEqual(cv005.map(id => id.replace('tl-v0-constraint-', '')).sort(), ['central-density-condition', 'progression-bonus', 'switch-of-play-bonus', 'wide-zone-advantage'], 'what CV-005 would have handed A01')
    assert.ok(!hints.candidateConstraintIds.some(id => cv005.includes(id)), 'no member of CV-005')
    assert.ok(!hints.candidateConstraintIds.some(id => wording.candidateConstraintIds.includes(id)), 'no member of the wording pool')
    // `zeroConstraintRuling: null` -> `constraintPrinciple` on 15 October 2026: the record has evaluated its set, so it
    // is read under his general principle (16 October reply, item 1) — the one recorded principle, read from the file.
    const principle = libraryConstraintPrinciple()
    assert.deepEqual(hints.constraintAuthority, {
        authority: 'AUTHORIZATION_RECORD',
        learningGoalId: 'A01',
        constraintPrinciple: { ruledOn: principle.ruledOn, by: principle.by, principle: principle.principle },
    })
    // Not yet evaluated (null), or no principle recorded: no principle on the hints, so the empty set stays a gap.
    assert.equal(hintsUnderAuthorization(governByApprovedGameProblem('A01', wording).hints, { ...record, authorizedConstraints: null }).constraintAuthority!.constraintPrinciple, null)
    assert.equal(hintsUnderAuthorization(governByApprovedGameProblem('A01', wording).hints, record, null).constraintAuthority!.constraintPrinciple, null)
    assert.deepEqual(authorization, record, 'the record selection used travels with the hints')
    assert.equal(gameProblem.gameProblemId, 'GP-005', 'the Game Problem authority is untouched by the record')
    // Lenses and game forms are what governance and the context gate made them, exactly.
    const governed = governByApprovedGameProblem('A01', wording).hints
    assert.deepEqual(hints.candidateAffordanceLensIds, governed.candidateAffordanceLensIds, 'lenses unchanged')
    assert.deepEqual(hints.matchedSignals, governed.matchedSignals, 'signals unchanged')

    for (const id of ['D02', 'D03', 'TA01']) {
        const other = guidedSelectionHints(id, goalText(id))
        assert.equal(other.hints.constraintAuthority, undefined, `${id}: no record, so the vocabulary pool`)
        assert.equal(other.authorization, null, id)
        assert.deepEqual(other.hints.candidateConstraintIds, list(soccerModule.coverageForGameProblem(APPROVED[id]!)!['supported_realization_group_ids']), `${id}: its Coverage row, unchanged`)
    }

    // The record is the parameter's: a test copy that authorizes a library constraint is read the same way, and the
    // shared record is not touched.
    const copy = learningGoalAuthorizations()
    copy[0].authorizedConstraints = ['tl-v0-constraint-small-area-condition']
    assert.deepEqual(guidedSelectionHints('A01', goalText('A01'), copy).hints.candidateConstraintIds, ['tl-v0-constraint-small-area-condition'])
    assert.deepEqual(learningGoalAuthorization('A01')!.authorizedConstraints, [], 'the production record is unchanged')
}

function runAll(): void {
    testARecordReplacesBothVocabularySources()
    testEveryGoalReportsTheApprovedGameProblemOrNone()
    testAgreementAndAbsenceChangeNothing()
    testADisagreementIsGovernedByTheApprovedGameProblem()
    testAnApprovedGameProblemWithNoKnowledgeBorrowsNothing()
    testTheContextStillLimitsTheGameForms()
    testBothPathwaysGoThroughThisModule()
    testOneGoalTextForBothPathways()
    console.log('guided-selection unit tests: all cases passed.')
}

runAll()
