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
import { gameProblemInferredFromWording, governByApprovedGameProblem, guidedSelectionHints } from './guided-selection'
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
 * intentional gap (A01, A04) or as still to be decided (A05, A06).
 */
const APPROVED: Record<string, string | null> = {
    A01: null,
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

/** The three goals whose wording implies a different Game Problem from the one he approved. */
const GOVERNED = ['D02', 'D03', 'TA01']

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
    const inferredBefore: Record<string, string> = { D02: 'GP-015', D03: 'GP-012', TA01: 'GP-015' }
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

    const application = read('../../routes/app.routes.ts')
    assert.match(application, /governByApprovedGameProblem\(/, 'the application applies the approved Game Problem')
    assert.match(application, /gateCandidateGameFormsToContext\(/, 'and the context rule')
}

function runAll(): void {
    testEveryGoalReportsTheApprovedGameProblemOrNone()
    testAgreementAndAbsenceChangeNothing()
    testADisagreementIsGovernedByTheApprovedGameProblem()
    testAnApprovedGameProblemWithNoKnowledgeBorrowsNothing()
    testTheContextStillLimitsTheGameForms()
    testBothPathwaysGoThroughThisModule()
    console.log('guided-selection unit tests: all cases passed.')
}

runAll()
