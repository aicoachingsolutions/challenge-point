/**
 * **One restart for every dead ball** — R1, 24 October 2026 (the d27 design's stage R1, its sections 2.3, 2.5, 2.9 and 2.10).
 *
 * Christian, reply filed 27 October 2026, item 4: *"I want the same restart principle for both the physical-goal and target-zone versions."*
 * *"Whenever the ball becomes dead, play resets to a new goalkeeper-initiated build-out."* *"There should be no separate corners, goal kicks,
 * throw-ins, free kicks, or penalty kicks for this activity."* *"Ball remains live: play continues, including after possession changes."*
 * *"Please ensure this is represented through a general, knowledge-authorized restart mechanism rather than activity-specific code."*
 *
 * What is pinned here:
 *   1. register version 23: row RP1, its closed list and version, the deadBallRestart block naming register rows and values only, every
 *      member of the trigger vocabulary classed exactly once, the two new triggers with their structural prerequisite and the residual's
 *      exclusions; and a damaged copy halts H1 (a trigger left unclassified or classed twice - so a trigger added later cannot slip past the
 *      policy - an unknown class, a row of the wrong kind, a play state off the list, no words of his, a bad exclusion or prerequisite);
 *   2. production A01-R1 (the zone version) in both blocks: before realization COVERED over the six reachable triggers that make the ball dead,
 *      STOPS over their six transitions, ONE_RESTART deferred to the coach's location, LIVE over the one change of possession; after
 *      realization at 12/1, 12/2 and 11/1, served, every clause passes and the owed clause passes on the concrete game;
 *   3. TEST-ONLY refusals, each on one clause: a dead-ball element removed (COVERED, naming it); a touchline or a score continuing play
 *      (STOPS); the old throw-in re-added (ONE_RESTART, naming the awardee, taker and method); a goal-kick restart (ONE_RESTART: the From Goal
 *      Kicks situation's restart, built from its typed parts, since its own items key no registered selector); one realized location different
 *      (deferred before realization, refused after); a change of possession stopping play (LIVE) - and every clause vacuous with no policy;
 *   4. the episode boundary compared after normalization: a score's boolean (SD-14) and an item's "true" are one value;
 *   5. generality: a possession-game TEST copy declaring the common restart passes with no activity code path;
 *   6. the SD-90 displacements the widened restart items make on the out-of-play lines, pinned so a change to displacement cannot silently
 *      restore the throw-in's award;
 *   7. the knowledge: A01-R1-RP1-1 in his words with its departures, the items withdrawn from the activity named in its note, the re-cited
 *      qualifiers, and A01-R2 keeping RP1-1 and every dead-ball item by composition, with the stand-ins of both choice files.
 *
 * TEST-ONLY copies and items are labelled and held in memory; production files are never written.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/dead-ball-restart.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { contextManipulationRelationships, LearningGoalAuthorization, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { loadProvisionalRealizations, loadRegister, PROVISIONAL_REALIZATIONS_FILE, readJson } from './corpus'
import { resolvedValue } from './derive'
import { runStages0to10, runStages0to5 } from './engine'
import { DEAD_BALL_CHECK, DEAD_BALL_COVERED_CLAUSE, DEAD_BALL_LIVE_CLAUSE, DEAD_BALL_ONE_RESTART_CLAUSE, DEAD_BALL_STOPS_CLAUSE } from './gates'
import { AUDITS_DIR } from './knowledge-root'
import { applyRealizationDeferrals } from './realization-deferral'
import { DEAD_BALL_CLASSES, HaltError, indexRegister } from './register'
import { roleBlocksOf } from './role-blocks'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput, LoadedContract, RoleBlock } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('one restart for every dead ball (R1)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const register = loadRegister()
const index = indexRegister(register)
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers } })
const R1 = 'A01-R1'
const R2 = 'A01-R2'
const CLAUSES = [DEAD_BALL_COVERED_CLAUSE, DEAD_BALL_STOPS_CLAUSE, DEAD_BALL_ONE_RESTART_CLAUSE, DEAD_BALL_LIVE_CLAUSE]
const STOPPING = ['SCORE', 'OUT_END_LINE', 'OUT_TOUCHLINE', 'COACH_JUDGED_EPISODE_CONCLUSION', 'INFRINGEMENT_STOPPAGE', 'COACH_DIRECTED_STOPPAGE']
const SEVEN = 'trigger ∈ {START, SCORE, COACH_JUDGED_EPISODE_CONCLUSION, OUT_TOUCHLINE, OUT_END_LINE, INFRINGEMENT_STOPPAGE, COACH_DIRECTED_STOPPAGE}'
const W_DEAD = 'Whenever the ball becomes dead, play resets to a new goalkeeper-initiated build-out.'
const W_NO_SEP = 'There should be no separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this activity.'

// ── Harness: A01 behind its record, per block, before realization (as starts-and-restarts.unit.ts reads it) ────────────────────────
const withoutGapEntries = (): LearningGoalAuthorization[] =>
    learningGoalAuthorizations().map(record => ({
        ...record,
        manipulations: record.manipulations.map(m => (m.status === 'MISSING_KNOWLEDGE' || m.status === 'MISSING_CAPABILITY' ? { ...m, category: 'EXISTING_KNOWLEDGE_TO_VERIFY' as const, status: 'NOT_SELECTED_FOR_FIRST_DEMO' as const, gaps: [], note: 'TEST-ONLY' } : m)),
        provisionalChoices: (record.provisionalChoices ?? []).map(c => (c.status === 'MISSING_KNOWLEDGE' || c.status === 'MISSING_CAPABILITY' ? { ...c, status: 'AUTHORIZED_BY_RULING' as const, gaps: [], note: 'TEST-ONLY' } : c)),
    }))
const a01Input = (alter: (contracts: LoadedContract[]) => void = () => undefined): DerivationInput => {
    const input: any = { ...derivationInputFor(selectFor('A01', null, withoutGapEntries())), envelope: sessionOf(12, 1) }
    input.contracts = copy(input.contracts)
    alter(input.contracts)
    input.contracts = applyRealizationDeferrals(input.contracts, contextManipulationRelationships(), index).contracts
    return input
}
const a01Blocks = (alter?: (contracts: LoadedContract[]) => void) => {
    const input = a01Input(alter)
    const base: any = runStages0to5(input)
    const found: any = roleBlocksOf(base.classes, base.derived.lines, index)
    assert.equal(found?.kind, 'BLOCKS')
    return (found.blocks as RoleBlock[]).map(block => ({ block, staged: runStages0to10({ ...input, roleBlock: block }) as any }))
}
const realization = (contracts: LoadedContract[]) => contracts.find(c => c.contractId === `provisional:${R1}`)!
const itemOf = (contracts: LoadedContract[], id: string) => realization(contracts).items.find(item => item.itemId === id)!
const removeItem = (contracts: LoadedContract[], id: string) => {
    const owner = realization(contracts)
    assert.ok(owner.items.some(item => item.itemId === id), `${id} is held`)
    owner.items = owner.items.filter(item => item.itemId !== id)
}
/** A TEST-ONLY item added to A01-R1's contract, with the shape the loader gives its own. */
const addItem = (contracts: LoadedContract[], item: Record<string, unknown>) =>
    realization(contracts).items.push({ valueStatus: 'REQUIRED_RANGE', strictness: 'REQUIRED', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', checkability: 'STRUCTURAL', structuralClause: 'whole item', category: 'PROVISIONAL_REALIZATION_CHOICE', words: 'TEST-ONLY', citedAs: 'TEST-ONLY', basisEvidence: 'TEST-ONLY', ...item } as any)
/** A selector of the seven restart triggers without one. */
const without = (trigger: string) => SEVEN.replace(`${trigger}, `, '').replace(`, ${trigger}}`, '}')
const deadBall = (staged: any) => staged.gates.gateA.checks.find((check: any) => check.checkId === DEAD_BALL_CHECK)
const verdicts = (check: any) => check.clauses.map((clause: any) => [clause.verdict, clause.instances ?? null])

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('register version 23: row RP1 and its list, the block classing every trigger once, the two triggers and their semantics', () => {
    assert.ok(String(register.version).startsWith('23, adds one restart for every dead ball, for his reply filed 27 October 2026, item 4'))
    assert.ok(String(register.version).includes('Supersedes version 22, which adds the type a session states for its objects of a kind'))
    assert.ok(!String(register.version).includes('Supersedes version 23'), 'version 23 is the current entry')
    const row = index.rows.get('RP1')!
    assert.deepEqual([row.path, row.kind, row.ownerRow ?? null], ['restartPolicy.deadBall', 'FIELD', null])
    assert.deepEqual(index.vocabularies.get('RP1.deadBall'), ['PER_TRIGGER', 'COMMON'])
    assert.ok(index.vocabularyVersions['RP1.deadBall'].startsWith('1 (2026-10-24, register version 23'))
    assert.ok(index.vocabularyVersions.trigger.startsWith('5 (2026-10-24, register version 23'))
    assert.ok(index.vocabularyVersions.trigger.includes('Version 4, 2026-10-15'), 'the earlier versions kept')
    const spec = index.deadBallRestart!
    assert.deepEqual([spec.row, spec.path, spec.perTrigger, spec.common, spec.transitionRow, spec.triggerAttribute], ['RP1', 'restartPolicy.deadBall', 'PER_TRIGGER', 'COMMON', 'T1', 'trigger'])
    assert.deepEqual([spec.playStateRow, spec.awardeeRow, spec.takerRow, spec.locationRow, spec.methodRow, spec.startsEpisodeRow, spec.stops, spec.continues], ['T6', 'T2', 'T3', 'T4', 'T5', 'T7', 'STOP_RESUME', 'CONTINUE'])
    assert.deepEqual(spec.commonMeans, { words: [W_DEAD, W_NO_SEP], citedAs: 'his reply filed 27 October 2026, item 4' })
    // Every member of the trigger vocabulary classed exactly once, into the closed list of classes.
    const triggers = index.vocabularies.get('trigger')!
    assert.deepEqual([...spec.classOf.keys()].sort(), [...triggers].sort())
    assert.ok([...spec.classOf.values()].every(cls => (DEAD_BALL_CLASSES as readonly string[]).includes(cls)))
    assert.deepEqual(triggers.filter(t => spec.classOf.get(t) === 'STOPS_PLAY').sort(), [...STOPPING].sort())
    assert.deepEqual(triggers.filter(t => spec.classOf.get(t) === 'IN_PLAY').sort(), ['COMPLETED_PASS', 'FIRST_FORWARD_PASS', 'POSSESSION_CHANGE', 'REGION_ENTRY'])
    assert.deepEqual(triggers.filter(t => spec.classOf.get(t) === 'BY_TRANSITION'), ['TIME_EXPIRY'])
    assert.deepEqual(triggers.filter(t => spec.classOf.get(t) === 'NOT_A_STOPPAGE').sort(), ['STANDING', 'START'])
    // The two new triggers: each with the prerequisite COACH_JUDGED_EPISODE_CONCLUSION has, his words, and the residual's exclusions.
    assert.deepEqual(triggers.slice(-2), ['INFRINGEMENT_STOPPAGE', 'COACH_DIRECTED_STOPPAGE'])
    for (const name of ['INFRINGEMENT_STOPPAGE', 'COACH_DIRECTED_STOPPAGE']) {
        const semantics: any = index.triggerSemantics[name]
        assert.deepEqual(semantics.structuralPrerequisite, { collectionRow: 'T1', selectorAttribute: 'trigger', value: 'START' })
        assert.ok(semantics.structuralPrerequisiteNote.startsWith('OUR operational proposal'))
        assert.equal(semantics.evaluabilityDependsOn, null)
        assert.ok(semantics.basisEvidence.includes(`"${W_DEAD}"`))
        assert.ok(semantics.note.includes('the wording of this note is ours'))
    }
    assert.ok((index.triggerSemantics.INFRINGEMENT_STOPPAGE as any).basisEvidence.includes('"A foul or infringement requiring play to stop."'))
    assert.ok((index.triggerSemantics.COACH_DIRECTED_STOPPAGE as any).basisEvidence.includes('"A coach-directed stoppage."'))
    assert.deepEqual((index.triggerSemantics.COACH_DIRECTED_STOPPAGE as any).excludes, ['COACH_JUDGED_EPISODE_CONCLUSION', 'INFRINGEMENT_STOPPAGE'])
    // The approved trigger's meaning is not restated.
    assert.ok(!(index.triggerSemantics.COACH_JUDGED_EPISODE_CONCLUSION as any).note.includes('INFRINGEMENT_STOPPAGE'))
})

test('a damaged register halts H1: a trigger unclassified or classed twice, an unknown class, a wrong row, a play state off the list, no words', () => {
    const halts = (alter: (copy: any) => void, pattern: RegExp, what: string) => {
        const damaged = copy(register)
        alter(damaged)
        assert.throws(() => indexRegister(damaged), (error: unknown) => error instanceof HaltError && error.halt === 'H1' && pattern.test(error.message), what)
    }
    const stops = (r: any) => r.deadBallRestart.classes.STOPS_PLAY.triggers
    halts(r => stops(r).splice(stops(r).indexOf('INFRINGEMENT_STOPPAGE'), 1), /leaves INFRINGEMENT_STOPPAGE unclassified/, 'a trigger left out')
    halts(r => r.vocabularies.trigger.push('TEST_ONLY_TRIGGER'), /leaves TEST_ONLY_TRIGGER unclassified/, 'a trigger added to the vocabulary and not classed: it cannot slip past the policy')
    halts(r => r.deadBallRestart.classes.IN_PLAY.triggers.push('SCORE'), /classes SCORE twice/, 'a trigger classed twice')
    halts(r => (r.deadBallRestart.classes.TEST_ONLY = { triggers: [], basis: 'TEST-ONLY' }), /names TEST_ONLY, which is none of STOPS_PLAY/, 'an unknown class')
    halts(r => stops(r).push('TEST_ONLY_TRIGGER'), /classes TEST_ONLY_TRIGGER, which is no member/, 'a class naming no trigger of the vocabulary')
    halts(r => delete r.deadBallRestart.classes.NOT_A_STOPPAGE.basis, /does not say on what basis/, 'a class with no basis')
    halts(r => (r.deadBallRestart.row = 'T1'), /is not a game-level FIELD row/, 'the policy on a collection')
    halts(r => (r.deadBallRestart.row = 'T6'), /is not a game-level FIELD row/, 'the policy on a field of the transitions')
    halts(r => (r.deadBallRestart.transitions.playState = 'B10'), /playState B10 is not a FIELD row owned by T1/, 'a transition row that is not one')
    halts(r => (r.deadBallRestart.transitions.stops = 'TEST_ONLY'), /stops \(TEST_ONLY\) and continues/, 'a play state off the list')
    halts(r => (r.deadBallRestart.transitions.attribute = 'qualifier.region'), /no vocabulary to classify/, 'a selector attribute with no vocabulary')
    halts(r => (r.deadBallRestart.common = 'PER_TRIGGER'), /must be the two different members/, 'one value for both')
    halts(r => (r.deadBallRestart.commonMeans.words = []), /must quote his words/, 'no words of his')
    halts(r => (r.vocabularies.triggerSemantics.COACH_DIRECTED_STOPPAGE.excludes = ['COACH_DIRECTED_STOPPAGE']), /excludes must name other members/, 'a residual excluding itself')
    halts(r => (r.vocabularies.triggerSemantics.COACH_DIRECTED_STOPPAGE.excludes = ['TEST_ONLY']), /excludes must name other members/, 'a residual excluding no trigger')
    halts(r => (r.vocabularies.triggerSemantics.INFRINGEMENT_STOPPAGE.structuralPrerequisite.value = 'TEST_ONLY'), /structuralPrerequisite must name/, 'a prerequisite on no trigger')
    halts(r => (r.vocabularies.triggerSemantics.COACH_JUDGED_EPISODE_CONCLUSION.structuralPrerequisite.collectionRow = 'T6'), /structuralPrerequisite must name/, 'a prerequisite on no collection')
    // A register without the block (one written before version 23) has no common restart.
    const older = copy(register)
    delete older.deadBallRestart
    assert.equal(indexRegister(older).deadBallRestart, null)
})

// ── 2. Production A01-R1 ─────────────────────────────────────────────────────────────────────────────────
test('production A01-R1 before realization, both blocks: COVERED 6, STOPS 6, ONE_RESTART deferred to the coach, LIVE 1', () => {
    const blocks = a01Blocks()
    assert.equal(blocks.length, 2)
    for (const { block, staged } of blocks) {
        const check = deadBall(staged)
        assert.deepEqual(check.clauses.map((clause: any) => clause.clause), CLAUSES, block.blockId)
        assert.deepEqual(verdicts(check), [['PASS', 6], ['PASS', 6], ['DEFERRED_TO_REALIZATION', null], ['PASS', 1]], block.blockId)
        assert.ok(check.why.startsWith('game::RP1 is COMMON: 6 reachable trigger(s) make the ball dead (COACH_DIRECTED_STOPPAGE, COACH_JUDGED_EPISODE_CONCLUSION, INFRINGEMENT_STOPPAGE, OUT_END_LINE, OUT_TOUCHLINE, SCORE)'), check.why)
        assert.ok(check.why.includes('6 transition(s) restart play after the ball is dead'), check.why)
        // Owed to realization, so asked again of the concrete game.
        assert.ok(staged.gates.gateA.deferred.some((entry: any) => entry.checkId === DEAD_BALL_CHECK && entry.clause === DEAD_BALL_ONE_RESTART_CLAUSE))
        assert.equal(staged.gates.gateA.knowledgeVerdict, 'PASS', `${block.blockId}: knowledge settles everything else`)
        // The policy line is the item's.
        assert.equal(staged.classified.get('game::RP1').verdict, 'RESOLVED:ENTAILED')
    }
})

const admin = (players: number, keepers: number) => buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers) } as any, { includeDrafts: true })
const restartChecksOf = (served: ServedActivity) => served.evidence!.structure.blocks.map(block => ({ row: block.sections.restarts.checks.find(row => row.checkId === DEAD_BALL_CHECK)!, owed: block.owed.filter(entry => entry.checkId === DEAD_BALL_CHECK), facts: block.sections.restarts.facts }))

test('production A01-R1 after realization at 12/1, 12/2 and 11/1: served, every clause passes in both blocks, the owed clause passes', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const served = admin(players, keepers) as ServedActivity
        assert.equal(served.outcome, 'served', label)
        const blocks = restartChecksOf(served)
        assert.equal(blocks.length, 2, label)
        for (const { row, owed, facts } of blocks) {
            assert.deepEqual([row.verdict, row.clauseCount, row.vacuousClauses, row.clausesNotPassing], ['PASS', 4, [], []], label)
            assert.deepEqual(owed, [{ checkId: DEAD_BALL_CHECK, clause: DEAD_BALL_ONE_RESTART_CLAUSE, verdict: 'PASS' }], label)
            // Every dead ball restarts the one way: the building team's goalkeeper, a new episode; play continues at a change of possession.
            const restarts = facts.filter(fact => (fact.value as any).playState === 'STOP_RESUME')
            assert.deepEqual(restarts.map(fact => fact.what.split(' on ')[1].split(' ')[0]).sort(), ['START', ...STOPPING].sort(), label)
            assert.ok(restarts.every(fact => JSON.stringify(fact.value) === JSON.stringify({ playState: 'STOP_RESUME', awardedTo: 'ROLE_HOLDER_BUILDING', actor: KEEPER, startsEpisode: true, beginsConditionedEpisode: true })), label)
            const live = facts.filter(fact => (fact.value as any).playState === 'CONTINUE')
            assert.deepEqual(live.map(fact => fact.what.split(' on ')[1]), ['POSSESSION_CHANGE'], label)
        }
        assert.equal(served.evidence!.structure.summary.everyCheckPasses, true, label)
    }
})

// ── 3. TEST-ONLY refusals, one clause each ───────────────────────────────────────────────────────────────
test('COVERED: a dead-ball element removed fails, naming the trigger left with no restart', () => {
    for (const [id, trigger] of [['A01-R1-T1-10', 'INFRINGEMENT_STOPPAGE'], ['A01-R1-T1-11', 'COACH_DIRECTED_STOPPAGE'], ['A01-R1-T1-9', 'OUT_END_LINE'], ['A01-R1-T1-2', 'SCORE']]) {
        for (const { block, staged } of a01Blocks(contracts => removeItem(contracts, id))) {
            const check = deadBall(staged)
            assert.equal(check.clauses[0].verdict, 'FAIL', `${id} ${block.blockId}`)
            assert.ok(check.why.includes(`no transition element for ${trigger}`), check.why)
        }
    }
})

test('STOPS: a touchline or a score that lets play continue fails', () => {
    for (const trigger of ['OUT_TOUCHLINE', 'SCORE']) {
        const blocks = a01Blocks(contracts => {
            itemOf(contracts, 'A01-R1-T6-1').selector = without(trigger)
            addItem(contracts, { itemId: 'A01-R1-TEST-ONLY-T6', row: 'T6', selector: `trigger=${trigger}`, requirement: 'EQUALS', value: 'CONTINUE' })
        })
        for (const { block, staged } of blocks) {
            const check = deadBall(staged)
            assert.equal(check.clauses[1].verdict, 'FAIL', `${trigger} ${block.blockId}`)
            assert.ok(check.why.includes(`(${trigger}: CONTINUE)`), check.why)
        }
    }
})

test('ONE_RESTART: the old throw-in re-added fails, naming the awardee, the taker and the method that differ', () => {
    const blocks = a01Blocks(contracts => {
        for (const id of ['A01-R1-T2-1', 'A01-R1-T3-1', 'A01-R1-T5-1']) itemOf(contracts, id).selector = without('OUT_TOUCHLINE')
        addItem(contracts, { itemId: 'A01-R1-TEST-ONLY-T3', row: 'T3', selector: 'trigger=OUT_TOUCHLINE', requirement: 'EQUALS', value: "a player of the team in this element's T2" })
        addItem(contracts, { itemId: 'A01-R1-TEST-ONLY-T5', row: 'T5', selector: 'trigger=OUT_TOUCHLINE', requirement: 'EQUALS', value: 'IN_HAND' })
    })
    for (const { block, staged } of blocks) {
        const check = deadBall(staged)
        assert.deepEqual(check.clauses.map((clause: any) => clause.verdict), ['PASS', 'PASS', 'FAIL', 'PASS'], block.blockId)
        for (const property of ['awardee', 'taker', 'method']) assert.ok(check.why.includes(`differ in`) && check.why.includes(`${property} (`), `${property}: ${check.why}`)
        assert.ok(!check.why.includes('location ('), 'the location is the coach\'s in both, still open')
        // The possession game's preferred default came back for the touchline's award once nothing required one (GF2-16.a).
        assert.ok(check.why.includes('NOT_LAST_TOUCH'), check.why)
    }
})

test("ONE_RESTART: a goal-kick restart (the From Goal Kicks situation's, by its typed parts) differs from the one restart and fails", () => {
    // A01-02's own items key no registered selector (restart=GOAL_KICK, its ledger L1), so its restart is built here from the parts it types:
    // over the end line, taken by a player of the team awarded it, from a stationary ball (A01-02-04.b, A01-02-11.a). TEST-ONLY.
    const blocks = a01Blocks(contracts => {
        for (const id of ['A01-R1-T3-1', 'A01-R1-T5-1']) itemOf(contracts, id).selector = without('OUT_END_LINE')
        addItem(contracts, { itemId: 'A01-R1-TEST-ONLY-T3', row: 'T3', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: "a player of the team in this element's T2" })
        addItem(contracts, { itemId: 'A01-R1-TEST-ONLY-T5', row: 'T5', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'STATIONARY_BALL' })
    })
    for (const { block, staged } of blocks) {
        const check = deadBall(staged)
        assert.equal(check.clauses[2].verdict, 'FAIL', block.blockId)
        assert.ok(check.why.includes('taker (') && check.why.includes('method (') && check.why.includes('STATIONARY_BALL'), check.why)
    }
})

test('ONE_RESTART: one realized location different is deferred before realization and refused on the concrete game', () => {
    // Before realization every location is the coach's, open, so nothing differs yet (production, above, defers). After: TEST-ONLY.
    const request = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(12, 1) } as any
    const refused = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), {
        review: { includeDrafts: true },
        alterSupplied: (supplied: any, provisional) => {
            if (provisional?.provisionalId !== R1) return
            const choice = supplied.choices.find((entry: any) => entry.lineId === `c:provisional:${R1}:A01-R1-T1-8::T4`)
            assert.ok(choice, 'the touchline restart has a stand-in')
            choice.value = { coachDecides: 'TEST-ONLY: where the ball went out' }
        },
    }).activity as RefusedActivity
    assert.deepEqual([refused.outcome, refused.stage], ['refused', 'validation'])
    assert.ok(refused.reasons.some(reason => reason.includes(DEAD_BALL_CHECK) && reason.includes(DEAD_BALL_ONE_RESTART_CLAUSE)), refused.reasons.join(' | '))
})

test('LIVE: a change of possession that stops play fails; with no policy every clause is vacuous', () => {
    const stopping = (contracts: LoadedContract[]) => addItem(contracts, { itemId: 'A01-R1-TEST-ONLY-T6', row: 'T6', selector: 'trigger=POSSESSION_CHANGE', requirement: 'EQUALS', value: 'STOP_RESUME' })
    for (const { block, staged } of a01Blocks(stopping)) {
        const check = deadBall(staged)
        assert.equal(check.clauses[3].verdict, 'FAIL', block.blockId)
        assert.ok(check.why.includes('play stops at') && check.why.includes('(POSSESSION_CHANGE: STOP_RESUME)'), check.why)
    }
    // The same game with no policy: every trigger keeps its own restart and the check has nothing to hold (SD-54, four vacuous passes).
    for (const { block, staged } of a01Blocks(contracts => {
        stopping(contracts)
        removeItem(contracts, 'A01-R1-RP1-1')
    })) {
        const check = deadBall(staged)
        assert.deepEqual(verdicts(check), [['PASS', 0], ['PASS', 0], ['PASS', 0], ['PASS', 0]], block.blockId)
        assert.ok(check.why.includes('addressed by no contribution'), check.why)
    }
    // A policy of PER_TRIGGER keeps a restart per trigger too; one off the list fails every clause.
    for (const [value, expected] of [['PER_TRIGGER', 'PASS'], ['TEST_ONLY', 'FAIL']] as const) {
        for (const { staged } of a01Blocks(contracts => (itemOf(contracts, 'A01-R1-RP1-1').value = value))) {
            assert.deepEqual(deadBall(staged).clauses.map((clause: any) => clause.verdict), [expected, expected, expected, expected], value)
        }
    }
})

// ── 4. Normalization ────────────────────────────────────────────────────────────────────────────────────
test("the episode boundary is compared after normalization: a score's boolean (SD-14) and an item's \"true\" are one value", () => {
    const [{ staged }] = a01Blocks()
    const lineOf = (trigger: string) => {
        const cls = staged.classes.find((c: any) => c.row === 'T1' && c.constraints.terms.some((t: any) => t.attribute === 'trigger' && t.value === trigger))
        return staged.derived.lines.get(`${cls.classId}::T7`)
    }
    // Read by the one resolver every gate uses (`resolvedValue`), so this is the value the check compares.
    assert.equal(resolvedValue(lineOf('SCORE'))?.value, true, "a score's boundary is SD-14's boolean")
    assert.equal(resolvedValue(lineOf('OUT_TOUCHLINE'))?.value, 'true', "the touchline's is A01-R1-T7-1's string")
    // And the concrete game passes (above): compared raw, the two would differ.
    assert.notEqual(JSON.stringify(true), JSON.stringify('true'))
})

// ── 5. Generality ───────────────────────────────────────────────────────────────────────────────────────
test('a possession-game TEST copy declaring the common restart passes, with no activity code path; a missing element fails it', () => {
    const testContract = (items: any[]): LoadedContract => ({
        contractId: 'TEST-ONLY:dead-ball',
        objectId: 'TEST-ONLY:dead-ball',
        knowledgeVersion: 'stage-b',
        items: items.map((item, i) => ({ itemId: `T-${i + 1}`, valueStatus: 'REQUIRED_RANGE', strictness: 'REQUIRED', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', checkability: 'STRUCTURAL', structuralClause: 'whole item', basisEvidence: 'TEST-ONLY', ...item })),
        declarations: [],
        relationshipRules: [],
    })
    const triggers = (list: string[]) => `trigger ∈ {${list.join(', ')}}`
    const game = (elements: string[]) => {
        const input = derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }] })
        const restarts = triggers(['START', ...elements])
        const items = [
            ...['START', ...elements].map(trigger => ({ row: 'T1', selector: `trigger=${trigger}`, requirement: 'EXISTS', value: 'N/A', valueStatus: 'N/A' })),
            { row: 'RP1', selector: '*', requirement: 'EQUALS', value: 'COMMON' },
            { row: 'T6', selector: restarts, requirement: 'EQUALS', value: 'STOP_RESUME' },
            { row: 'T2', selector: restarts, requirement: 'EQUALS', value: 'TEAM_AT_AXIS_START' },
            { row: 'T3', selector: restarts, requirement: 'EQUALS', value: 'COACH' },
            { row: 'T4', selector: restarts, requirement: 'EQUALS', value: { dynamic: 'TEST-ONLY: the centre of the area' } },
            { row: 'T5', selector: restarts, requirement: 'EQUALS', value: 'SERVED' },
            { row: 'T7', selector: triggers(elements.filter(t => t !== 'SCORE')), requirement: 'EQUALS', value: 'true' },
            { row: 'T1a', selector: triggers(['OUT_TOUCHLINE', 'OUT_END_LINE']), requirement: 'EQUALS', value: 'EACH_TEAM' },
            { row: 'T1b', selector: 'trigger=OUT_END_LINE', requirement: 'EQUALS', value: 'EACH_TEAM' },
            { row: 'T1c', selector: 'trigger=OUT_TOUCHLINE', requirement: 'EQUALS', value: { dynamic: 'TEST-ONLY: where the ball went out' } },
        ]
        return runStages0to10({ ...input, envelope: sessionOf(12, 0), contracts: [...copy(input.contracts), testContract(items)] }) as any
    }
    const whole = deadBall(game(STOPPING))
    assert.deepEqual(verdicts(whole), [['PASS', 6], ['PASS', 6], ['PASS', 6], ['PASS', 1]], whole.why)
    const missing = deadBall(game(STOPPING.filter(t => t !== 'COACH_DIRECTED_STOPPAGE')))
    assert.equal(missing.clauses[0].verdict, 'FAIL')
    assert.ok(missing.why.includes('no transition element for COACH_DIRECTED_STOPPAGE'), missing.why)
})

// ── 6. The SD-90 displacements on the out-of-play lines ──────────────────────────────────────────────────
test("the widened restart items displace the possession game's out-of-play defaults (SD-90): GF2-16.a disagreeing, GF2-16.b agreeing", () => {
    for (const { block, staged } of a01Blocks()) {
        for (const trigger of ['OUT_TOUCHLINE', 'OUT_END_LINE']) {
            const cls = staged.classes.find((c: any) => c.row === 'T1' && c.constraints.terms.some((t: any) => t.attribute === 'trigger' && t.value === trigger))
            const displaced = (row: string) => staged.derived.lines.get(`${cls.classId}::${row}`).displaced.map((entry: any) => [entry.item.itemId, entry.preferred, entry.displacedBy.map((ref: any) => ref.itemId), entry.agreed])
            assert.deepEqual(displaced('T2'), [['GF2-16.a', 'NOT_LAST_TOUCH', ['A01-R1-T2-1'], false]], `${block.blockId} ${trigger}: the award the possession game prefers is displaced`)
            assert.deepEqual(displaced('T6'), [['GF2-16.b', 'STOP_RESUME', ['A01-R1-T6-1'], true]], `${block.blockId} ${trigger}`)
        }
    }
})

// ── 7. The knowledge ─────────────────────────────────────────────────────────────────────────────────────
test('A01-R1-RP1-1 in his words, departing from the six restarts it replaces; the withdrawn items named; the qualifiers re-cited', () => {
    const raw = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const r1 = raw.realizations.find((r: any) => r.id === R1)
    const item = (id: string) => r1.items.find((entry: any) => entry.id === id)
    const rp1 = item('A01-R1-RP1-1')
    assert.deepEqual([rp1.row, rp1.selector, rp1.requirement, rp1.value, rp1.basis, rp1.citedAs], ['RP1', '*', 'EQUALS', 'COMMON', 'OWNER_RULING', 'his reply filed 27 October 2026, item 4'])
    assert.equal(rp1.words, `${W_DEAD} … ${W_NO_SEP}`)
    assert.deepEqual(rp1.departsFrom.map((d: any) => [d.law, d.extent, d.whilePreconditionAbsent ?? null]), ['LAW-8-DB', 'LAW-13', 'LAW-14', 'LAW-15', 'LAW-16', 'LAW-17'].map(law => [law, 'WHOLE', null]))
    assert.ok(rp1.departsFrom.every((d: any) => d.basis.citedAs.startsWith('his reply filed 27 October 2026, item')))
    // The dead-ball elements, the last-touch qualifier, the widened restart items.
    assert.deepEqual(['A01-R1-T1-8', 'A01-R1-T1-9', 'A01-R1-T1-10', 'A01-R1-T1-11'].map(id => item(id).selector), ['trigger=OUT_TOUCHLINE', 'trigger=OUT_END_LINE', 'trigger=INFRINGEMENT_STOPPAGE', 'trigger=COACH_DIRECTED_STOPPAGE'])
    assert.deepEqual([item('A01-R1-T1a-1').selector, item('A01-R1-T1a-1').value], ['trigger ∈ {OUT_TOUCHLINE, OUT_END_LINE}', 'EACH_TEAM'])
    for (const id of ['A01-R1-T6-1', 'A01-R1-T2-1', 'A01-R1-T3-1', 'A01-R1-T4-1', 'A01-R1-T5-1', 'A01-R1-T4-4']) {
        assert.equal(item(id).selector, SEVEN, id)
        assert.ok(item(id).words.endsWith(W_DEAD) && item(id).citedAs.endsWith('his reply filed 27 October 2026, item 4') && item(id).fitNote.includes('WIDENED 24 October 2026 (R1)'), id)
    }
    assert.equal(item('A01-R1-T7-1').selector, 'trigger ∈ {COACH_JUDGED_EPISODE_CONCLUSION, OUT_TOUCHLINE, OUT_END_LINE, INFRINGEMENT_STOPPAGE, COACH_DIRECTED_STOPPAGE}', 'a score keeps SD-14')
    assert.equal(item('A01-R1-T1-3').departsFrom, undefined, 'its part departure is replaced by the whole one')
    // Removed from the activity (a realization that is no variant cannot withdraw), each named in the note with its authority.
    const removed = ['A01-R1-T1-4', 'A01-R1-T1-5', 'A01-R1-T1-6', 'A01-R1-T1-7', 'A01-R1-T6-2', 'A01-R1-T7-2', 'A01-R1-T7-3', 'A01-R1-T3-2', 'A01-R1-T4-2', 'A01-R1-T5-2', 'A01-R1-T3-3', 'A01-R1-T4-3', 'A01-R1-T5-3']
    for (const id of removed) {
        assert.equal(item(id), undefined, `${id} removed`)
        const short = id.replace('A01-R1-', '')
        assert.ok(r1.note.includes(id) || r1.note.includes(` ${short}`), `${id} named in the note`)
    }
    assert.ok(r1.note.includes('ONE COMMON RESTART, 24 October 2026 (R1') && r1.note.includes('Goalkeeper handling in this zone version (his item 5) stays open'))
    // Re-cited, values unchanged.
    assert.deepEqual([item('A01-R1-T1b-1').value, item('A01-R1-T1b-1').words, item('A01-R1-T1b-1').citedAs], ['EACH_TEAM', W_DEAD, 'his reply filed 27 October 2026, item 4'])
    assert.ok(item('A01-R1-T1b-1').basisEvidence.includes('RE-CITED 24 October 2026 (R1), the value unchanged: until then this item cited his reply filed 18 October 2026, item 2'))
    assert.deepEqual([item('A01-R1-T1c-1').value, item('A01-R1-T1c-1').words], [{ dynamic: 'where the ball went out' }, 'The ball going out of bounds.'])
    // No handling statement or restriction is added to the zone version (his item 5, open).
    assert.ok(!r1.items.some((entry: any) => /hand/i.test(String(entry.choice)) && entry.row !== 'T5'))
})

test("A01-R2 keeps RP1-1 and every dead-ball item by composition; its own restart bound widened; both choice files' stand-ins agree", () => {
    const loaded = loadProvisionalRealizations()
    const of = (id: string) => loaded.find(r => r.provisionalId === id)!
    const ids = (id: string) => of(id).items.map(item => item.itemId)
    const dead = ['A01-R1-RP1-1', 'A01-R1-T1-2', 'A01-R1-T1-3', 'A01-R1-T1-8', 'A01-R1-T1-9', 'A01-R1-T1-10', 'A01-R1-T1-11', 'A01-R1-T1a-1', 'A01-R1-T1b-1', 'A01-R1-T1c-1', 'A01-R1-T6-1', 'A01-R1-T7-1', 'A01-R1-T2-1', 'A01-R1-T3-1', 'A01-R1-T4-1', 'A01-R1-T5-1']
    for (const id of dead) assert.ok(ids(R2).includes(id), `A01-R2 keeps ${id}`)
    assert.ok(!(of(R2).withdrawn ?? []).some(entry => dead.includes(entry.itemId)), 'A01-R2 withdraws none of them')
    const t45 = of(R2).items.find(item => item.itemId === 'A01-R2-T4-5')!
    assert.equal(t45.selector, SEVEN)
    assert.ok(String((t45 as any).fitNote).includes('THE BINDING, RULED') && String((t45 as any).basisEvidence).includes('"The building team’s side of the marked progression line is an acceptable initial restart region."'))
    // The stand-ins: one value per realization for every restart's location, no end-line stand-in left.
    const choices = (file: string) => JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, file), 'utf8')).choices as { lineId: string; value: unknown }[]
    for (const [file, contract, words] of [
        ['realization-choices-a01-r1.json', R1, "consistent with the intended build-out situation, in front of the pressing team's target zone"],
        ['realization-choices-a01-r2.json', R2, "consistent with the intended build-out situation, on the building team's side of the marked line"],
    ] as const) {
        const restartLines = ['T1-1', 'T1-2', 'T1-3', 'T1-8', 'T1-9', 'T1-10', 'T1-11'].map(id => `c:provisional:${contract}:A01-R1-${id}::T4`)
        const entries = choices(file).filter(entry => entry.lineId.endsWith('::T4') || entry.lineId.endsWith('::T5'))
        assert.deepEqual(entries.map(entry => entry.lineId).sort(), [...restartLines].sort(), file)
        assert.ok(entries.every(entry => JSON.stringify(entry.value) === JSON.stringify({ coachDecides: words })), file)
    }
})

test('every other goal and demonstration keeps a restart per trigger: the check is vacuous where no item writes the policy', () => {
    for (const goalId of ['A04', 'D02']) {
        const input = derivationInputFor(selectFor(goalId, null))
        const staged: any = runStages0to10({ ...input, envelope: sessionOf(12, 0) })
        if (!staged.gates) continue
        assert.deepEqual(verdicts(deadBall(staged)), [['PASS', 0], ['PASS', 0], ['PASS', 0], ['PASS', 0]], goalId)
    }
})

console.log(`${passed} passed`)
