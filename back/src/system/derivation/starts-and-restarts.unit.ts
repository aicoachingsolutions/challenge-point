/**
 * Starts and restarts built from knowledge, the coach-judged episode conclusion, and the typed build-out begin condition —
 * stage K5, 15 October 2026.
 *
 * Christian, reply filed 17 October 2026, M3: *"Support goalkeeper or controlled defensive starts, coach-selected restart
 * locations, and activity-specific restart methods. These choices must remain distinguishable from universal requirements."*
 * M4: *"Support one explicit coach-judged event representing the conclusion of a meaningful episode. Do not substitute a timer,
 * possession change, or arbitrary pass count."* D5: *"An episode concludes when either team scores or when the coach judges that
 * the meaningful attacking opportunity has ended. The coach may make that judgment at a stoppage or during play."* Reply filed 18
 * October 2026, item 2: *"Touchline: conventional throw-in where the ball crossed the line, taken by the team that did not touch
 * it last."* *"End line: coach-selected restart method, using the approved M3 capability."* *"I agree that these ordinary
 * restarts are distinct from deliberately initiating a new build-out episode."* Item 4: *"I acknowledge and approve your proposed
 * wording: "A restart, taken by the goalkeeper or as a controlled defensive restart, that begins a build-out episode."*
 *
 * What is pinned here:
 *   1. register version 12 carries the capabilities as data (the trigger and its semantics, FROM_THE_FEET, T4/T5
 *      `fillableRequires`, T2 `fillableWhen`, PS1 `entailedBy`) and a damaged copy halts H1;
 *   2. the trigger is reachable only where a start element is, read from the semantics entry with no trigger named in code;
 *   3. T4 and T5 open only on OWNER_RULING/AUTHORED ranges in words — silence, assumed, positioned or preferred bounds never;
 *      the From Goal Kicks goal-kick location stays a declared gap (the hazard the design verification measured);
 *   4. T2 opens for START only: an after-score awardee no longer opens over NOT_AUTHORED declarations;
 *   5. the opening holder of possession is entailed by the start's awardee where one is entailed, and nowhere else;
 *   6. GA-TRANSITION-COHERENCE defers an open restart location and still blocks on a missing one;
 *   7. C58 and GA-EPISODE-REACHABLE: the begin condition typed in his words; in each block of A01 the start, the after-score
 *      restart and the coach's conclusion begin the build-out episode, ordinary restarts and the change of possession never,
 *      one awardee; and the clauses bite on copies;
 *   8. A01-R1's transitions, and what must not appear (no timer, window, pass count, conceding-team award, stopped turnover);
 *   9. realization: the COACH_DECIDES stand-ins, the possession game's initial-holder choice withdrawn and carried.
 *
 * TEST-ONLY copies and items are labelled; production files are never written.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/starts-and-restarts.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords, RefusedActivity } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { suppliedRealizationFor, withProvisionalRealizationChoices } from '../realization/supplied-realization'
import { learningGoalAuthorizations, LearningGoalAuthorization, contextManipulationRelationships } from '../test-library/learning-goal-authorizations'
import { AUDITS_DIR } from './knowledge-root'
import { CONFORMANCE_DIR, loadCorpusContracts, loadRegister, provisionalRealizationNamed } from './corpus'
import { runStages0to10, runStages0to2, runStages0to5 } from './engine'
import { applyRealizationDeferrals } from './realization-deferral'
import { HaltError, indexRegister } from './register'
import { roleBlocksOf } from './role-blocks'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput, LoadedContract, RoleBlock, beginConditionReferentOf } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('starts and restarts, the coach-judged conclusion and the typed begin condition (stage K5)')

const register = loadRegister()
const index = indexRegister(register)
const TOKEN = 'COACH_JUDGED_EPISODE_CONCLUSION'
const KEEPER = specializedRoleNames()[0]
const sessionOf = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...Object.fromEntries(specializedRoleNames().map(r => [r, 0])), [KEEPER]: keepers } })

/** A TEST-ONLY contribution: never production data. */
const testContract = (items: any[]): LoadedContract => ({
    contractId: 'TEST-ONLY:restarts',
    objectId: 'TEST-ONLY:restarts',
    knowledgeVersion: 'stage-b',
    items: items.map((item, i) => ({ itemId: `T-${i + 1}`, valueStatus: 'REQUIRED_RANGE', strictness: 'REQUIRED', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', checkability: 'STRUCTURAL', structuralClause: 'whole item', basisEvidence: 'TEST-ONLY', ...item })),
    declarations: [],
    relationshipRules: [],
})
const exists = (selector: string) => ({ row: 'T1', selector, requirement: 'EXISTS', value: 'N/A', valueStatus: 'N/A' })
const gf2 = (extra: any[] = []): DerivationInput => {
    const input = derivationInputFor({ selected: [{ id: 'GF2', role: 'game form' }] })
    return { ...input, envelope: sessionOf(12, 1), contracts: [...JSON.parse(JSON.stringify(input.contracts)), ...(extra.length ? [testContract(extra)] : [])] }
}
const classifiedOf = (staged: any, lineId: string) => staged.classified.get(lineId)
const verdictOf = (staged: any, lineId: string): string | null => classifiedOf(staged, lineId)?.verdict ?? null
const classIdOf = (staged: any, trigger: string): string => {
    const found = staged.classes.filter((c: any) => c.row === 'T1' && c.constraints.terms.some((t: any) => t.attribute === 'trigger' && t.value === trigger))
    assert.equal(found.length, 1, `one ${trigger} class`)
    return found[0].classId
}
const check = (staged: any, id: string) => staged.gates.gateA.checks.find((c: any) => c.checkId === id)

/** A01 behind its record (TEST-ONLY: the record's gap entries set aside, nothing else), as derivation receives it, per block. */
const withoutGapEntries = (): LearningGoalAuthorization[] =>
    learningGoalAuthorizations().map(record => ({
        ...record,
        manipulations: record.manipulations.map(m => (m.status === 'MISSING_KNOWLEDGE' || m.status === 'MISSING_CAPABILITY' ? { ...m, category: 'EXISTING_KNOWLEDGE_TO_VERIFY' as const, status: 'NOT_SELECTED_FOR_FIRST_DEMO' as const, gaps: [], note: 'TEST-ONLY' } : m)),
        provisionalChoices: (record.provisionalChoices ?? []).map(c => (c.status === 'MISSING_KNOWLEDGE' || c.status === 'MISSING_CAPABILITY' ? { ...c, status: 'AUTHORIZED_BY_RULING' as const, gaps: [], note: 'TEST-ONLY' } : c)),
    }))
const a01Input = (alter: (contracts: LoadedContract[]) => void = () => undefined): DerivationInput => {
    const selection = selectFor('A01', null, withoutGapEntries())
    const input: any = { ...derivationInputFor(selection), envelope: sessionOf(12, 1) }
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    alter(input.contracts)
    input.contracts = applyRealizationDeferrals(input.contracts, contextManipulationRelationships(), index).contracts
    return input
}
const blocksOf = (input: DerivationInput): RoleBlock[] => {
    const base: any = runStages0to5(input)
    const found: any = roleBlocksOf(base.classes, base.derived.lines, index)
    assert.equal(found?.kind, 'BLOCKS')
    return found.blocks
}
const a01Blocks = (alter?: (contracts: LoadedContract[]) => void) => {
    const input = a01Input(alter)
    return blocksOf(input).map(block => ({ block, staged: runStages0to10({ ...input, roleBlock: block }) as any }))
}
const realizationItem = (contracts: LoadedContract[], id: string) => contracts.find(c => c.contractId === 'provisional:A01-R1')!.items.find(i => i.itemId === id)!

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('register version 12 carries the capabilities as data, each in his words or labelled ours, and a damaged copy halts H1', () => {
    // Re-pointed 15 October 2026 (stage K6): version 13 (relative positions and start placements) supersedes 12 and keeps its entry.
    assert.ok(String(register.version).includes('Supersedes version 12, which adds starts and restarts built from knowledge and the coach-judged episode conclusion'))
    assert.ok(String(register.version).includes('Supersedes version 11'), 'the version history is kept')
    assert.ok(index.vocabularies.get('trigger')!.includes(TOKEN))
    // Re-pointed 24 October 2026 (R1): trigger version 5 (two coach stoppages, his reply filed 27 October 2026, item 4) supersedes 4 and keeps
    // its entry.
    assert.ok(index.vocabularyVersions.trigger.startsWith('5 (2026-10-24, register version 23'))
    assert.ok(index.vocabularyVersions.trigger.includes('Version 4, 2026-10-15, register version 12 - adds COACH_JUDGED_EPISODE_CONCLUSION'))
    const semantics: any = index.triggerSemantics[TOKEN]
    for (const words of [
        'M4 — Coach-judged episode conclusion: Approved.',
        'Support one explicit coach-judged event representing the conclusion of a meaningful episode.',
        'Do not substitute a timer, possession change, or arbitrary pass count.',
        'An episode concludes when either team scores or when the coach judges that the meaningful attacking opportunity has ended.',
        'The coach may make that judgment at a stoppage or during play.',
        'At any stoppage, the coach may instead conclude the current episode and initiate another build-out.',
    ]) {
        assert.ok(semantics.basisEvidence.includes(`"${words}"`), `his words, verbatim: ${words}`)
    }
    for (const substitute of ['TIME_EXPIRY', 'POSSESSION_CHANGE', 'COMPLETED_PASS']) assert.ok(semantics.independentOf.includes(substitute), `independent of ${substitute}: his M4 forbids it as a substitute`)
    assert.equal(semantics.evaluabilityDependsOn, null, 'an in-play judgement consults no row')
    assert.deepEqual(semantics.structuralPrerequisite, { collectionRow: 'T1', selectorAttribute: 'trigger', value: 'START' })
    assert.ok(semantics.structuralPrerequisiteNote.startsWith('OUR operational proposal'), 'the prerequisite is labelled ours, never his')
    assert.ok(semantics.note.includes('the wording of this note is ours'))

    assert.ok(index.vocabularies.get('T5.method')!.includes('FROM_THE_FEET'))
    assert.ok(index.vocabularyVersions['T5.method'].startsWith('2 (2026-10-15'))
    const feet = register.vocabularies['T5.methodSemantics'].FROM_THE_FEET
    assert.ok(feet.note.startsWith('OUR operational gloss'))
    assert.ok(feet.basisEvidence.includes('"The goalkeeper may receive and play from the feet; a stationary-ball restart should not be universally required."'))

    for (const row of ['T4', 'T5']) assert.deepEqual(index.fillableRequires.get(row), { requirement: ['RANGE'], basis: ['OWNER_RULING', 'AUTHORED'], bound: 'QUALITATIVE' }, row)
    assert.deepEqual(index.fillableWhen.get('T2'), { selectorAttribute: 'trigger', in: ['START'] })
    assert.deepEqual(index.entailedBy.get('PS1'), { collectionRow: 'T1', selectorAttribute: 'trigger', value: 'START', row: 'T2' })
    assert.equal(index.fillableRequires.size, 2, 'no other row carries one')
    assert.equal(index.entailedBy.size, 1, 'no other row carries one')

    const halts = (alter: (r: any) => void): string | null => {
        const copy = JSON.parse(JSON.stringify(register))
        alter(copy)
        try {
            indexRegister(copy)
            return null
        } catch (error) {
            return error instanceof HaltError ? error.halt : String(error)
        }
    }
    const row = (r: any, id: string) => r.rows.find((x: any) => x.id === id)
    assert.equal(halts(() => undefined), null)
    assert.equal(halts(r => void (row(r, 'T3').fillableRequires = row(r, 'T4').fillableRequires)), 'H1', 'a requirement on a row with no choice space')
    assert.equal(halts(r => void (row(r, 'T4').fillableRequires.basis = ['TEST-ONLY'])), 'H1', 'a basis outside the closed list')
    assert.equal(halts(r => void (row(r, 'T4').fillableRequires.bound = 'SET')), 'H1', 'only a bound in words opens a coach choice')
    assert.equal(halts(r => void (row(r, 'T2').fillableWhen.selectorAttribute = 'type')), 'H1', 'an attribute the owning collection does not carry')
    assert.equal(halts(r => void (row(r, 'T2').fillableWhen.in = ['TEST-ONLY'])), 'H1', 'a value outside the trigger vocabulary')
    assert.equal(halts(r => void (row(r, 'PS1').entailedBy.row = 'P2')), 'H1', 'the source must be a field of the named collection')
})

// ── 2. Reachability ─────────────────────────────────────────────────────────────────────────────────────
test('the coach-judged conclusion is reachable only where a start element is — read from the semantics entry, no trigger named in code', () => {
    assert.ok(!runStages0to2(gf2()).triggers.includes(TOKEN), 'GF2 alone: no start element, so no conclusion to judge')
    const withStart = runStages0to10(gf2([exists('trigger=START'), exists(`trigger=${TOKEN}`)])) as any
    assert.ok(withStart.triggers.includes(TOKEN))
    assert.equal(check(withStart, 'GA-TRIGGER-REACHABLE').clauses[0].verdict, 'PASS')
    const without = runStages0to10(gf2([exists(`trigger=${TOKEN}`)])) as any
    assert.ok(!without.triggers.includes(TOKEN))
    assert.equal(check(without, 'GA-TRIGGER-REACHABLE').verdict, 'FAIL', 'a conclusion with no start to conclude is refused (SD-44)')
    const code = fs.readFileSync(path.join(__dirname, 'engine.ts'), 'utf8')
    assert.ok(!code.includes('COACH_JUDGED') && !code.includes("'FROM_THE_FEET'"), 'engine.ts names no trigger or method token')
    // No other goal and no demonstration holds a start element, so none reaches the trigger (measured 15 October 2026).
    for (const goalId of ['A04', 'D03', 'TA02']) {
        let input: DerivationInput
        try {
            input = derivationInputFor(selectFor(goalId))
        } catch {
            continue
        }
        assert.ok(!runStages0to2(input).triggers.includes(TOKEN), goalId)
    }
})

// ── 3. T4/T5 open only on his or authored ranges in words ──────────────────────────────────────────────
test('T4 and T5 open only where every bound is an OWNER_RULING or AUTHORED range in words; silence, assumed and positioned bounds never', () => {
    const start = [exists('trigger=START'), { row: 'T6', selector: 'trigger=START', requirement: 'EQUALS', value: 'STOP_RESUME' }]
    const words = { requirement: 'RANGE', value: 'TEST-ONLY: where the coach chooses' }
    const run = (extra: any[]) => {
        const staged: any = runStages0to10(gf2([...start, ...extra]))
        return verdictOf(staged, `${classIdOf(staged, 'START')}::T4`)
    }
    assert.equal(run([{ row: 'T4', selector: 'trigger=START', ...words }]), 'FREE(a)', 'his range in words opens it (COACH_DECIDES at realization)')
    assert.equal(run([{ row: 'T4', selector: 'trigger=START', ...words, basis: 'AUTHORED' }]), 'FREE(a)', 'an authored range in words too')
    assert.notEqual(run([]), 'FREE(a)', 'silence never opens it')
    assert.notEqual(run([{ row: 'T4', selector: 'trigger=START', ...words, basis: 'ASSUMED' }]), 'FREE(a)', 'an assumed bound never opens it')
    assert.notEqual(run([{ row: 'T4', selector: 'trigger=START', requirement: 'POSITIONED', value: 'TEST-ONLY own end' }]), 'FREE(a)', 'a positioned bound is not a coach choice')
    assert.notEqual(run([{ row: 'T4', selector: 'trigger=START', ...words, valueStatus: 'PREFERRED_DEFAULT', strictness: 'SUPPORTING' }]), 'FREE(a)', 'a preferred default is not a coach choice')
    assert.notEqual(
        run([{ row: 'T4', selector: 'trigger=START', ...words }, { row: 'T4', selector: 'trigger=START', ...words, basis: 'ASSUMED' }]),
        'FREE(a)',
        'every bound must qualify: one assumed bound beside his keeps it closed',
    )

    // The hazard the design verification measured: with the From Goal Kicks situation, the goal-kick element's location was
    // opened to its ASSUMED "own end" by the bare word "authored". It stays a declared gap — with A01-R1 or without it.
    const kick = selectFor('A01', 'A01-02', withoutGapEntries())
    for (const withRealization of [false, true]) {
        const input: any = { ...derivationInputFor(kick), envelope: sessionOf(12, 1) }
        if (!withRealization) input.contracts = input.contracts.filter((c: LoadedContract) => !c.contractId.startsWith('provisional:'))
        const staged: any = runStages0to10(input)
        const line = classifiedOf(staged, 'c:restated:A01-02:A01-02-01.a::T4')
        assert.equal(line?.verdict, 'NOT_AUTHORED', `${withRealization ? 'with' : 'without'} A01-R1: ${JSON.stringify(line)}`)
        assert.equal(line?.reason, 'declared gap')
    }
})

// ── 4. T2 for START only ─────────────────────────────────────────────────────────────────────────────────
test('T2 opens for START only: an after-score awardee no longer opens as a free choice over NOT_AUTHORED declarations', () => {
    const staged: any = runStages0to10(
        gf2([exists('trigger=START'), exists('trigger=SCORE'), { row: 'T6', selector: 'trigger ∈ {START, SCORE}', requirement: 'EQUALS', value: 'STOP_RESUME' }]),
    )
    assert.equal(verdictOf(staged, `${classIdOf(staged, 'START')}::T2`), 'FREE(choice)', 'which team starts stays the governed choice (SD-39)')
    const score = classifiedOf(staged, `${classIdOf(staged, 'SCORE')}::T2`)
    assert.equal(score.verdict, 'NOT_AUTHORED', 'the after-score awardee is the gap the possession game declares, never a free choice')
    assert.equal(score.reason, 'declared gap')
    // The restriction is what closes it: on a register copy without `fillableWhen` (TEST-ONLY) the awardee opens again, as
    // the design verification measured before register version 12.
    const loose = JSON.parse(JSON.stringify(register))
    delete loose.rows.find((r: any) => r.id === 'T2').fillableWhen
    const input = gf2([exists('trigger=START'), exists('trigger=SCORE'), { row: 'T6', selector: 'trigger ∈ {START, SCORE}', requirement: 'EQUALS', value: 'STOP_RESUME' }])
    const before: any = runStages0to10({ ...input, register: loose })
    assert.equal(verdictOf(before, `${classIdOf(before, 'SCORE')}::T2`), 'FREE(choice)')
})

// ── 5. The opening holder of possession ─────────────────────────────────────────────────────────────────
test('the opening holder of possession is entailed by the start awardee where one is entailed, and nowhere else', () => {
    const [x] = a01Blocks()
    const ps1 = x.staged.derived.lines.get('game::PS1')
    assert.equal(verdictOf(x.staged, 'game::PS1'), 'RESOLVED:ENTAILED')
    assert.deepEqual(ps1.entailing.map((e: any) => [e.item.contractId, e.item.itemId, e.value]), [['provisional:A01-R1', 'A01-R1-T2-1', 'ROLE_HOLDER_BUILDING']])
    assert.ok(String(verdictOf(runStages0to10(gf2()) as any, 'game::PS1')).startsWith('FREE'), 'no start element: the governed choice, as before')
    const startOnly = [exists('trigger=START'), { row: 'T6', selector: 'trigger=START', requirement: 'EQUALS', value: 'STOP_RESUME' }]
    assert.ok(String(verdictOf(runStages0to10(gf2(startOnly)) as any, 'game::PS1')).startsWith('FREE'), 'an open awardee entails nothing')
    const awarded = { row: 'T2', selector: 'trigger=START', requirement: 'EQUALS', value: 'TEAM_AT_AXIS_START' }
    assert.equal(verdictOf(runStages0to10(gf2([...startOnly, awarded])) as any, 'game::PS1'), 'RESOLVED:ENTAILED')
    const continuing = [exists('trigger=START'), { row: 'T6', selector: 'trigger=START', requirement: 'EQUALS', value: 'CONTINUE' }, awarded]
    assert.ok(String(verdictOf(runStages0to10(gf2(continuing)) as any, 'game::PS1')).startsWith('FREE'), 'an awardee that does not apply (play continues) entails nothing')
})

// ── 6. GA-TRANSITION-COHERENCE ──────────────────────────────────────────────────────────────────────────
test('GA-TRANSITION-COHERENCE defers an open restart location to realization, and still blocks where one is missing', () => {
    for (const { block, staged } of a01Blocks()) {
        const coherence = check(staged, 'GA-TRANSITION-COHERENCE')
        assert.deepEqual(coherence.clauses.map((c: any) => c.verdict), ['PASS', 'DEFERRED_TO_REALIZATION'], block.blockId)
        assert.ok(coherence.why.includes('owed to realization'))
    }
    const [missing] = a01Blocks(contracts => {
        const realization = contracts.find(c => c.contractId === 'provisional:A01-R1')!
        // TEST-ONLY: the coach's location withdrawn - both its bounds since stage K6 (15 October 2026), when his D3 agreement on the
        // goalkeeper's start became a second range in words on the same line (A01-R1-T4-4).
        realization.items = realization.items.filter(i => i.itemId !== 'A01-R1-T4-1' && i.itemId !== 'A01-R1-T4-4')
    })
    assert.equal(check(missing.staged, 'GA-TRANSITION-COHERENCE').clauses[1].verdict, 'NOT_EVALUABLE', 'a location nobody authored blocks; it is never deferred')
})

// ── 7. C58 and GA-EPISODE-REACHABLE ─────────────────────────────────────────────────────────────────────
const HIS_WORDING = 'A restart, taken by the goalkeeper or as a controlled defensive restart, that begins a build-out episode.'
test('C58: the build-out origin typed as the restarts that begin a build-out episode, in his acknowledged wording; no proposals file', () => {
    const restatements = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b', 'corpus-restatements.json'), 'utf8'))
    const ruling = restatements.items.filter((entry: any) => entry.ruling === 'C58')
    assert.equal(ruling.length, 1)
    assert.equal(ruling[0].item, 'restated:RPC-001::RPC-001-18.b')
    assert.ok(ruling[0].set.basisEvidence.includes(`"I acknowledge and approve your proposed wording: "${HIS_WORDING}""`))
    const restated = loadCorpusContracts().find(c => c.contractId === 'restated:RPC-001')!.items.find(i => i.itemId === 'RPC-001-18.b')!
    const typed = beginConditionReferentOf(restated.value)
    assert.ok(typed, 'a begin-condition referent')
    assert.equal(typed!.asAuthored, HIS_WORDING)
    assert.equal(typed!.beginsEpisodeOf, 'BUILD_OUT_EPISODE')
    assert.deepEqual(typed!.arms, [{ takenBy: 'goalkeeper' }, { restartKind: 'CONTROLLED_DEFENSIVE_RESTART' }], 'both arms kept: one condition, two ways to meet it')
    assert.equal(restated.scope, 'BUILD_OUT_EPISODE', 'scope unchanged (C52)')
    assert.ok(!fs.existsSync(path.join(CONFORMANCE_DIR, 'stage-b', 'proposed-restatements-2026-10-17.json')), 'acknowledged, so ACTIVE: no proposals file')
    const original = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b', 'contracts.json'), 'utf8'))
    assert.ok(JSON.stringify(original).includes("the goalkeeper's START/restart placement"), 'the original stays in contracts.json')
})

test('GA-EPISODE-REACHABLE passes in each block of A01: the start, the after-score restart and the coach conclusion begin it, one awardee', () => {
    for (const { block, staged } of a01Blocks()) {
        const reach = check(staged, 'GA-EPISODE-REACHABLE')
        assert.equal(reach.verdict, 'PASS', `${block.blockId}: ${reach.why}`)
        // A third clause since stage K6 (15 October 2026): the starting placements are re-established at the same three
        // transitions (target-placement.unit.ts). A fourth and fifth since 17 October 2026 (stage M1, his reply filed 19 October 2026,
        // item 1 and item 3 C): the building role's credit is begun only by those three, each awarded to it, and ended by every
        // transition that can take possession from it (credit-episode.unit.ts).
        assert.deepEqual(reach.clauses.map((c: any) => c.verdict), ['PASS', 'PASS', 'PASS', 'PASS', 'PASS'])
        /**
         * Re-pointed 24 October 2026 (R1): his reply filed 27 October 2026, item 4 ("Whenever the ball becomes dead, play resets to a new
         * goalkeeper-initiated build-out."). Every dead ball now begins the build-out episode with the building team's goalkeeper - the ball
         * going out over a touchline or an end line and the coach's stoppages for an infringement or any other reason, beside the start, a
         * score and the coach's conclusion - so seven transitions begin it, all awarded to the building role; there is no ordinary restart
         * any more, and the change of possession still never begins one.
         */
        assert.equal(reach.clauses[1].instances, 7, 'seven transitions begin the build-out episode')
        for (const id of ['A01-R1-T1-1: START', 'A01-R1-T1-2: SCORE', `A01-R1-T1-3: ${TOKEN}`, 'A01-R1-T1-8: OUT_TOUCHLINE', 'A01-R1-T1-9: OUT_END_LINE', 'A01-R1-T1-10: INFRINGEMENT_STOPPAGE', 'A01-R1-T1-11: COACH_DIRECTED_STOPPAGE'])
            assert.ok(reach.why.includes(`c:provisional:A01-R1:${id}`), id)
        assert.ok(reach.why.includes('awarded to ROLE_HOLDER_BUILDING'), 'only the building team initiates new build-out episodes (his D7)')
        assert.ok(reach.why.includes('ruled out: c:restated:GF2:GF2-07.a (a possession change begins an attacking episode, never a build-out one)'), reach.why)
        assert.equal(check(staged, 'GA-REFERENCE-INTEGRITY').clauses[0].verdict, 'PASS')
    }
})

test('the two clauses bite: a second awardee fails, no starter fails, and without C58 the check withholds as before', () => {
    // TEST-ONLY: the after-score restart awarded to the pressing role — two awardees.
    const [split] = a01Blocks(contracts => {
        const realization = contracts.find(c => c.contractId === 'provisional:A01-R1')!
        // Re-pointed 24 October 2026 (R1): the widened award keeps every other restart; only the score's is taken out.
        realizationItem(contracts, 'A01-R1-T2-1').selector = 'trigger ∈ {START, COACH_JUDGED_EPISODE_CONCLUSION, OUT_TOUCHLINE, OUT_END_LINE, INFRINGEMENT_STOPPAGE, COACH_DIRECTED_STOPPAGE}'
        realization.items.push({ ...realizationItem(contracts, 'A01-R1-T2-1'), itemId: 'A01-R1-TEST-ONLY', selector: 'trigger=SCORE', value: 'ROLE_HOLDER_PRESSING' })
    })
    // The third clause (stage K6): the placements are still re-established at the three starters. The fourth (stage M1, 17 October
    // 2026) fails with the second: a beginning of the building role's credited episode awarded to the pressing role.
    assert.deepEqual(check(split.staged, 'GA-EPISODE-REACHABLE').clauses.map((c: any) => c.verdict), ['PASS', 'FAIL', 'PASS', 'FAIL', 'PASS'])
    // TEST-ONLY: no restart taken by an arm's taker — nothing begins the episode.
    const [none] = a01Blocks(contracts => void (realizationItem(contracts, 'A01-R1-T3-1').value = 'TEST-ONLY taker'))
    // The third clause (stage K6) fails with it: a placement re-established when no transition begins its episode never would be.
    // So does the fourth (stage M1, 17 October 2026): a credit confined to an episode nothing begins could never be earned.
    assert.deepEqual(check(none.staged, 'GA-EPISODE-REACHABLE').clauses.map((c: any) => c.verdict), ['FAIL', 'PASS', 'FAIL', 'FAIL', 'PASS'])
    // TEST-ONLY: the origin's original placement texts back — the check withholds (SD-63), exactly as before C58.
    const original = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b', 'contracts.json'), 'utf8'))
    const [untyped] = a01Blocks(contracts => {
        const item = contracts.find(c => c.contractId === 'restated:RPC-001')!.items.find(i => i.itemId === 'RPC-001-18.b')!
        item.value = ["the goalkeeper's START/restart placement", 'a controlled defensive restart placement']
    })
    assert.ok(JSON.stringify(original).length > 0)
    assert.equal(check(untyped.staged, 'GA-EPISODE-REACHABLE').verdict, 'NOT_EVALUABLE')
})

/**
 * **K5 review, 15 October 2026: the exemptions stage K5 added are only as wide as the register says.** Each case below was
 * measured on the K5 commit (8f389fa) passing where, before K5, it was refused or withheld:
 *   - a begin condition naming ANOTHER episode typed the build-out condition (GA-EPISODE-REACHABLE PASS): the referent's own
 *     `beginsEpisodeOf` was never read;
 *   - a coach's-decision stand-in written as a condition referent (V5) was skipped by GA-REFERENCE-INTEGRITY on every
 *     reference row, so the origin line no longer blocked the clause; the register opens a coach's choice on T4/T5 only;
 *   - a begin-condition referent was skipped on every reference row, though only V5's valueType carries the form.
 */
test('the begin condition counts only for its own episode, and the two referent exemptions only on the rows the register names', () => {
    const origin = (contracts: LoadedContract[]) => contracts.find(c => c.contractId === 'restated:RPC-001')!.items.find(i => i.itemId === 'RPC-001-18.b')!
    // TEST-ONLY: the begin condition re-aimed at another episode — it types nothing here, so the check withholds as before C58.
    const [elsewhere] = a01Blocks(contracts => void (origin(contracts).value = { ...(origin(contracts).value as any), beginsEpisodeOf: 'TEST-ONLY_OTHER_EPISODE' }))
    const reach = check(elsewhere.staged, 'GA-EPISODE-REACHABLE')
    assert.equal(reach.verdict, 'NOT_EVALUABLE', reach.why)
    assert.ok(!reach.why.includes('the begin condition is typed'))

    // TEST-ONLY: a coach's-decision stand-in as the origin's referent — a condition referent, not a coach-chosen place.
    const [stand] = a01Blocks(contracts => void (origin(contracts).value = { coachDecides: 'TEST-ONLY: wherever the coach likes' }))
    const integrity = check(stand.staged, 'GA-REFERENCE-INTEGRITY')
    assert.equal(integrity.clauses[1].verdict, 'NOT_EVALUABLE')
    assert.ok(integrity.blockedBy.includes('c:restated:RPC-001:RPC-001-18.a::V5'), `the stand-in is read, not skipped: ${JSON.stringify(integrity.blockedBy)}`)
    // ... while on T4, where the register opens the coach's choice, it is exempt: the realized game passes the post-realization
    // gate with the stand-ins in place (the 'communication' stop pinned in the realization test below).

    // TEST-ONLY: a begin-condition referent written as a restart location (T4) — read as text there, never skipped. Re-pointed 24 October
    // 2026 (R1): the touchline's own location item (A01-R1-T4-2) is withdrawn, so the touchline's restart location is taken out of the
    // coach's two ranges and a TEST-ONLY item writes the referent there instead.
    const [placed] = a01Blocks(contracts => {
        const all = 'trigger ∈ {START, SCORE, COACH_JUDGED_EPISODE_CONCLUSION, OUT_END_LINE, INFRINGEMENT_STOPPAGE, COACH_DIRECTED_STOPPAGE}'
        for (const id of ['A01-R1-T4-1', 'A01-R1-T4-4']) realizationItem(contracts, id).selector = all
        const realization = contracts.find(c => c.contractId === 'provisional:A01-R1')!
        realization.items.push({ ...realizationItem(contracts, 'A01-R1-T2-1'), itemId: 'A01-R1-TEST-ONLY', row: 'T4', selector: 'trigger=OUT_TOUCHLINE', value: origin(contracts).value, departsFrom: undefined } as any)
    })
    const located = check(placed.staged, 'GA-REFERENCE-INTEGRITY')
    assert.notEqual(located.clauses[1].verdict, 'PASS', located.why)
    assert.ok(JSON.stringify(located.blockedBy).includes('A01-R1-T1-8::T4') || located.clauses[1].verdict === 'FAIL', located.why)
    // The production begin condition is unaffected: it types the build-out condition and the clause is not blocked by it.
    const [x] = a01Blocks()
    assert.equal(check(x.staged, 'GA-EPISODE-REACHABLE').verdict, 'PASS')
    assert.ok(!check(x.staged, 'GA-REFERENCE-INTEGRITY').blockedBy.includes('c:restated:RPC-001:RPC-001-18.a::V5'))
})

// ── 8. A01-R1's transitions, and what must not appear ──────────────────────────────────────────────────
test("A01-R1's transitions as his decisions establish them, and no timer, window, pass count, conceding award or stopped turnover", () => {
    const [x] = a01Blocks()
    const transitions = x.staged.classes.filter((c: any) => c.row === 'T1')
    // Re-pointed 24 October 2026 (R1): his reply filed 27 October 2026, item 4 - the ball going out is one element per line, no longer
    // partitioned by who touched it last, and the coach's stoppages for an infringement or any other reason are elements of their own.
    assert.deepEqual(
        transitions.map((c: any) => c.constraints.terms.map((t: any) => `${t.attribute}=${t.value}`).join(' & ')).sort(),
        [
            'trigger=COACH_DIRECTED_STOPPAGE',
            `trigger=${TOKEN}`,
            'trigger=INFRINGEMENT_STOPPAGE',
            'trigger=OUT_END_LINE',
            'trigger=OUT_TOUCHLINE',
            'trigger=POSSESSION_CHANGE',
            'trigger=SCORE',
            'trigger=START',
        ],
    )
    const value = (lineId: string) => x.staged.derived.lines.get(lineId)?.entailing?.[0]?.value
    assert.equal(value(`${classIdOf(x.staged, 'POSSESSION_CHANGE')}::T6`), 'CONTINUE', 'a regain does not stop play (his D1)')
    for (const trigger of ['START', 'SCORE', TOKEN, 'OUT_TOUCHLINE', 'OUT_END_LINE', 'INFRINGEMENT_STOPPAGE', 'COACH_DIRECTED_STOPPAGE']) {
        const id = classIdOf(x.staged, trigger)
        assert.equal(value(`${id}::T6`), 'STOP_RESUME', trigger)
        assert.equal(value(`${id}::T2`), 'ROLE_HOLDER_BUILDING', trigger)
        assert.equal(value(`${id}::T3`), KEEPER, trigger)
        assert.equal(value(`${id}::T5`), 'FROM_THE_FEET', trigger)
        assert.equal(verdictOf(x.staged, `${id}::T4`), 'FREE(a)', `${trigger}: the coach chooses where (COACH_DECIDES), never a fixed location`)
        // Two ranges in words since stage K6 (15 October 2026): his D5 location and his D3 agreement that the goalkeeper begins in
        // front of the post-regain area (A01-R1-T4-4). Still the coach's: no region, no distance.
        assert.deepEqual(x.staged.derived.lines.get(`${id}::T4`).bounding.map((b: any) => [b.bound.kind, b.bound.term]), [
            ['QUALITATIVE', 'a location the coach chooses, consistent with the intended build-out situation'],
            ['QUALITATIVE', "in front of the pressing team's post-regain area"],
        ])
    }
    assert.ok(!x.staged.triggers.some((t: string) => t.startsWith('TIME_EXPIRY')), 'no timer')
    assert.ok(!x.staged.classes.some((c: any) => c.row === 'V23'), 'no time window')
    // Re-pointed 24 October 2026 (R1): no restart continues an episode any more - every dead ball begins a new one (A01-R1-T7-1; SD-14 for
    // the start and a score), and the out-of-play elements carry who touched the ball last as each team (A01-R1-T1a-1).
    for (const trigger of ['OUT_TOUCHLINE', 'OUT_END_LINE', 'INFRINGEMENT_STOPPAGE', 'COACH_DIRECTED_STOPPAGE', TOKEN]) assert.equal(String(value(`${classIdOf(x.staged, trigger)}::T7`)), 'true', `${trigger}: a new build-out episode begins`)
    for (const trigger of ['OUT_TOUCHLINE', 'OUT_END_LINE']) assert.equal(value(`${classIdOf(x.staged, trigger)}::T1a`), 'EACH_TEAM', trigger)
    const realization = provisionalRealizationNamed('A01-R1')!
    const named = JSON.stringify(realization.items.map(i => [i.selector, i.value]))
    for (const forbidden of ['CONCEDING_TEAM', 'TIME_EXPIRY', 'COMPLETED_PASS', 'FIRST_FORWARD_PASS', 'V23', 'V24', 'V25', 'V26']) assert.ok(!named.includes(forbidden), forbidden)
    assert.ok(!realization.items.some(i => i.row === 'V3' || i.row === 'V4'), 'no condition, so no pass count')
    for (const item of realization.items.filter(i => /^T/.test(String(i.row)))) {
        assert.equal(item.basis, 'OWNER_RULING', item.itemId)
        assert.equal((item as any).category, 'PROVISIONAL_REALIZATION_CHOICE', item.itemId)
        assert.ok(String((item as any).words).length > 0 && String(item.basisEvidence).startsWith('Christian, reply filed'), item.itemId)
    }
})

// ── 9. Realization ─────────────────────────────────────────────────────────────────────────────────────
test('realization: the COACH_DECIDES stand-ins, the possession game initial-holder choice withdrawn and carried into the fixture', () => {
    /**
     * Re-pointed 15 October 2026 (stage K6): A01-R1 now also carries his starting values and placements, which reach realization
     * only where the build-out begin condition is typed (the context, RPC-001: the placements are re-established at the
     * beginnings it types, and with no context GA-EPISODE-REACHABLE withholds on them - measured). This test is about the
     * transitions' stand-ins and the withdrawal, so the composition takes A01-R1 without its spatial items, and the targets'
     * noun and scoring kind its file replaces are put back as the possession game's (TEST-ONLY, on copies). The spatial items
     * are pinned in target-placement.unit.ts, on A01's own selection.
     */
    const SPATIAL = ['S2', 'S5', 'S6', 'P8', 'P10', 'P10a', 'P10b']
    // Re-pointed 17 October 2026 (stage M1): without the roles' credit bounds too (row B8, his reply filed 19 October 2026, item 1 and
    // item 3 C). The building role's bound is the build-out episode, whose beginnings only the context types, so with the possession
    // game alone GA-EPISODE-REACHABLE's fourth clause withholds on it (measured: refused at structure) - pinned in credit-episode.unit.ts.
    // Re-pointed 17 October 2026 (stage M2): without the pressing role's regain score too (rows V27-V31, his reply filed 19 October
    // 2026, item 2). It is said only in approved words, so with it this TEST-ONLY composition stops at communication on its four
    // fields (measured) - which is right, and pinned in also-counts.unit.ts; the transitions' stand-ins read none of it.
    const CREDIT = ['B8', 'V27', 'V28', 'V29', 'V30', 'V31']
    const built = buildActivityFromKnowledge(['GF2'], sessionOf(12, 1), {
        alter: contracts => {
            const realization: any = JSON.parse(JSON.stringify(provisionalRealizationNamed('A01-R1')!))
            realization.items = realization.items.filter((i: any) => !SPATIAL.includes(String(i.row)) && !CREDIT.includes(String(i.row)) && i.itemId !== 'A01-R1-T4-4')
            contracts.push(realization)
        },
        alterSupplied: supplied => {
            assert.deepEqual(withProvisionalRealizationChoices(supplied, 'A01-R1'), [])
            for (const replaced of (supplied as any).replaced) (supplied.choices.find((c: any) => c.lineId === replaced.lineId) as any).value = replaced.replacedValue
        },
    })
    /**
     * Realized, validated and rendered. **Moved 15 October 2026 (stage K7): served.** Until K7 the restarts and the opening holder had
     * no sentence, so fidelity refused this composition at communication on exactly those (the assertion this replaces: every reason
     * a fidelity Q3 loss of a `transitions[` field or `possession.team`). K7 says each from the values the game holds (DRAFT), so with
     * no context — no scoped condition to withhold — the TEST-ONLY composition is served, and what moved is exactly those sentences.
     */
    assert.equal((built.activity as any).outcome, 'served', JSON.stringify((built.activity as RefusedActivity).reasons?.slice(0, 3)))
    const said = (built.activity as any).rendered.instructions as { text: string; from: string[] }[]
    for (const transition of (built.fixture as any).game.transitions.filter((t: any) => t.playState === 'STOP_RESUME')) {
        assert.ok(said.some(i => i.from.includes(`transitions[${transition.elementId}].awardedTo`) && i.from.includes(`transitions[${transition.elementId}].playState`)), `${transition.elementId}: its restart is said with its awardee and play state`)
    }
    assert.ok(said.some(i => i.from.includes('possession.team') && i.text === 'The building team starts with the ball'), 'the opening holder, by its role')
    const fixture: any = built.fixture
    const coach = fixture.status.choices.filter((c: any) => String(c.lineId).startsWith('c:provisional:A01-R1:'))
    assert.equal(coach.length, 7)
    assert.ok(coach.every((c: any) => c.closure === 'COACH_DECIDES' && typeof c.value.coachDecides === 'string'))
    assert.ok(!fixture.status.choices.some((c: any) => c.lineId === 'game::PS1'), 'the opening holder is entailed, not chosen')
    assert.equal(fixture.game.possession.team, 'ROLE_HOLDER_BUILDING')
    // Key identity: the withdrawal crosses into the fixture whole.
    const supplied: any = suppliedRealizationFor({ selected: [{ id: 'GF2', role: 'game form' }], contracted: ['GF2'] } as any)
    withProvisionalRealizationChoices(supplied, 'A01-R1')
    assert.deepEqual(fixture.withdrawnChoices, supplied.withdrawn)
    assert.deepEqual(Object.keys(fixture.withdrawnChoices[0]).sort(), ['because', 'by', 'lineId', 'withdrawnFrom', 'withdrawnValue'])
    assert.equal(fixture.withdrawnChoices[0].withdrawnValue, 'c:restated:GF2:GF2-14.a#1')

    // A withdrawal is only ever of another file's entry, carries no value, and is never settled by order (TEST-ONLY files).
    const read = (alter: (contents: any) => void) => (name: string) => {
        const contents = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, name), 'utf8'))
        if (name === 'realization-choices-a01-r1.json') alter(contents)
        return contents
    }
    const conflictsOf = (alter: (contents: any) => void) => {
        const base: any = suppliedRealizationFor({ selected: [{ id: 'GF2', role: 'game form' }], contracted: ['GF2'] } as any)
        return withProvisionalRealizationChoices(base, 'A01-R1', read(alter))
    }
    assert.deepEqual(conflictsOf(() => undefined), [])
    assert.ok(conflictsOf(c => void (c.choices.find((x: any) => x.withdraws).withdraws = 'TEST-ONLY.json'))[0].includes('withdraws TEST-ONLY.json'))
    assert.ok(conflictsOf(c => void (c.choices.find((x: any) => x.withdraws).value = 'TEST-ONLY'))[0].includes('also gives a value'))
    assert.ok(conflictsOf(c => void (c.choices.find((x: any) => x.withdraws).lineId = 'game::TEST-ONLY'))[0].includes('has no entry for that line'))
})

console.log(`\n${passed} passed`)
