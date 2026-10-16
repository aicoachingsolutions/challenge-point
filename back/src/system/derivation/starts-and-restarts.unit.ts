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
    assert.ok(String(register.version).startsWith('12, adds starts and restarts built from knowledge and the coach-judged episode conclusion'))
    assert.ok(String(register.version).includes('Supersedes version 11'), 'the version history is kept')
    assert.ok(index.vocabularies.get('trigger')!.includes(TOKEN))
    assert.ok(index.vocabularyVersions.trigger.startsWith('4 (2026-10-15, register version 12'))
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
        realization.items = realization.items.filter(i => i.itemId !== 'A01-R1-T4-1') // TEST-ONLY: the coach's location withdrawn
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
        assert.deepEqual(reach.clauses.map((c: any) => c.verdict), ['PASS', 'PASS'])
        assert.equal(reach.clauses[1].instances, 3, 'three transitions begin the build-out episode')
        for (const id of ['A01-R1-T1-1: START', 'A01-R1-T1-2: SCORE', `A01-R1-T1-3: ${TOKEN}`]) assert.ok(reach.why.includes(`c:provisional:A01-R1:${id}`), id)
        assert.ok(reach.why.includes('awarded to ROLE_HOLDER_BUILDING'), 'only the building team initiates new build-out episodes (his D7)')
        // Ordinary restarts never begin one; the change of possession never does.
        for (const ruled of ['A01-R1-T1-4 (begins no episode)', 'A01-R1-T1-6 (begins no episode)', 'GF2-07.a (a possession change begins an attacking episode, never a build-out one)'])
            assert.ok(reach.why.includes(ruled), ruled)
        for (const id of ['A01-R1-T1-5', 'A01-R1-T1-7']) assert.ok(reach.why.includes(`${id} (taken by "a player of the team in this element's T2": it meets no arm of the begin condition)`), `${id}: the pressing team's ordinary restart is not a build-out start`)
        assert.equal(check(staged, 'GA-REFERENCE-INTEGRITY').clauses[0].verdict, 'PASS')
    }
})

test('the two clauses bite: a second awardee fails, no starter fails, and without C58 the check withholds as before', () => {
    // TEST-ONLY: the after-score restart awarded to the pressing role — two awardees.
    const [split] = a01Blocks(contracts => {
        const realization = contracts.find(c => c.contractId === 'provisional:A01-R1')!
        realizationItem(contracts, 'A01-R1-T2-1').selector = 'trigger ∈ {START, COACH_JUDGED_EPISODE_CONCLUSION}'
        realization.items.push({ ...realizationItem(contracts, 'A01-R1-T2-1'), itemId: 'A01-R1-TEST-ONLY', selector: 'trigger=SCORE', value: 'ROLE_HOLDER_PRESSING' })
    })
    assert.deepEqual(check(split.staged, 'GA-EPISODE-REACHABLE').clauses.map((c: any) => c.verdict), ['PASS', 'FAIL'])
    // TEST-ONLY: no restart taken by an arm's taker — nothing begins the episode.
    const [none] = a01Blocks(contracts => void (realizationItem(contracts, 'A01-R1-T3-1').value = 'TEST-ONLY taker'))
    assert.deepEqual(check(none.staged, 'GA-EPISODE-REACHABLE').clauses.map((c: any) => c.verdict), ['FAIL', 'PASS'])
    // TEST-ONLY: the origin's original placement texts back — the check withholds (SD-63), exactly as before C58.
    const original = JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, 'stage-b', 'contracts.json'), 'utf8'))
    const [untyped] = a01Blocks(contracts => {
        const item = contracts.find(c => c.contractId === 'restated:RPC-001')!.items.find(i => i.itemId === 'RPC-001-18.b')!
        item.value = ["the goalkeeper's START/restart placement", 'a controlled defensive restart placement']
    })
    assert.ok(JSON.stringify(original).length > 0)
    assert.equal(check(untyped.staged, 'GA-EPISODE-REACHABLE').verdict, 'NOT_EVALUABLE')
})

// ── 8. A01-R1's transitions, and what must not appear ──────────────────────────────────────────────────
test("A01-R1's transitions as his decisions establish them, and no timer, window, pass count, conceding award or stopped turnover", () => {
    const [x] = a01Blocks()
    const transitions = x.staged.classes.filter((c: any) => c.row === 'T1')
    assert.deepEqual(
        transitions.map((c: any) => c.constraints.terms.map((t: any) => `${t.attribute}=${t.value}`).join(' & ')).sort(),
        [
            `trigger=${TOKEN}`,
            'trigger=OUT_END_LINE & qualifier.lastTouch=ROLE_HOLDER_BUILDING',
            'trigger=OUT_END_LINE & qualifier.lastTouch=ROLE_HOLDER_PRESSING',
            'trigger=OUT_TOUCHLINE & qualifier.lastTouch=ROLE_HOLDER_BUILDING',
            'trigger=OUT_TOUCHLINE & qualifier.lastTouch=ROLE_HOLDER_PRESSING',
            'trigger=POSSESSION_CHANGE',
            'trigger=SCORE',
            'trigger=START',
        ],
    )
    const value = (lineId: string) => x.staged.derived.lines.get(lineId)?.entailing?.[0]?.value
    assert.equal(value(`${classIdOf(x.staged, 'POSSESSION_CHANGE')}::T6`), 'CONTINUE', 'a regain does not stop play (his D1)')
    for (const trigger of ['START', 'SCORE', TOKEN]) {
        const id = classIdOf(x.staged, trigger)
        assert.equal(value(`${id}::T6`), 'STOP_RESUME', trigger)
        assert.equal(value(`${id}::T2`), 'ROLE_HOLDER_BUILDING', trigger)
        assert.equal(value(`${id}::T3`), KEEPER, trigger)
        assert.equal(value(`${id}::T5`), 'FROM_THE_FEET', trigger)
        assert.equal(verdictOf(x.staged, `${id}::T4`), 'FREE(a)', `${trigger}: the coach chooses where (COACH_DECIDES), never a fixed location`)
        assert.deepEqual(x.staged.derived.lines.get(`${id}::T4`).bounding.map((b: any) => b.bound.kind), ['QUALITATIVE'])
    }
    assert.ok(!x.staged.triggers.some((t: string) => t.startsWith('TIME_EXPIRY')), 'no timer')
    assert.ok(!x.staged.classes.some((c: any) => c.row === 'V23'), 'no time window')
    const pressing = 'qualifier.lastTouch=ROLE_HOLDER_PRESSING'
    for (const c of transitions.filter((t: any) => t.constraints.terms.some((term: any) => `${term.attribute}=${term.value}` === pressing))) assert.equal(String(value(`${c.classId}::T7`)), 'false', 'off the pressing team: the episode continues')
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
    const built = buildActivityFromKnowledge(['GF2'], sessionOf(12, 1), {
        alter: contracts => void contracts.push(provisionalRealizationNamed('A01-R1')!),
        alterSupplied: supplied => assert.deepEqual(withProvisionalRealizationChoices(supplied, 'A01-R1'), []),
    })
    const activity = built.activity as RefusedActivity
    // Realized, validated and rendered; the restarts are not said yet (their rendering is stage K7), so fidelity refuses it.
    assert.equal(activity.stage, 'communication', JSON.stringify(activity.reasons.slice(0, 3)))
    assert.ok(activity.reasons.every(reason => reason.includes('fidelity Q3') && (reason.includes('transitions[') || reason.includes('possession.team'))), 'only the uncarried restarts and the opening holder')
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
