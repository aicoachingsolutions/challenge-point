/**
 * Every participant an activity requires is present in its configuration — GA-PARTICIPANTS-PRESENT and the register's participant
 * forms (register version 15), 22 October 2026.
 *
 * Christian, reply filed 25 October 2026, item 6: *"You identified a case in which the engine could name a goalkeeper as the restart
 * taker without independently verifying that a goalkeeper was present."* *"Please correct that as a general structural validation
 * requirement."* *"Any participant or role required by an activity must actually be present in the authorized configuration."*
 * *"This safeguard should not depend on particular wording or on the current realization's existing goalkeeper-count restriction."*
 * *"The same principle should apply to other required participants or specialized roles."*
 *
 * What is pinned here:
 *   1. register version 15 holds the participant forms as data, quoting him, and a damaged copy halts H1;
 *   2. a value names a participant only through the register: a specialized role by its row (no role word is written here: the name is
 *      read from the register, as the session reads it), a form by its whole value, and open text names nobody, so two identical open
 *      texts are not one participant (SD-63) — the begin condition's taker match and the renderer read it the same way;
 *   3. production Play Out from the Back (12 players with 1 and 2 goalkeepers, 11 with 1): pre-realization the check defers to the
 *      instantiated teams, and over each block's concrete game every clause passes on applicable instances;
 *   4. on TEST-ONLY copies, through the whole pathway: without the one-goalkeeper choice (11 players, none in goal; and with one available
 *      that the copy never involves) the activity is REFUSED at validation with one coach sentence naming the role, and the reasons name
 *      the elements; without the count but with the reassignment kept, the moved goalkeeper is named too; a taker reworded so the
 *      register types nobody ("the" before the role's name) and the controlled-restart wording are refused at structure;
 *   5. on a TEST-ONLY register copy with a second specialized role, a taker naming THAT role with none present FAILS over the concrete
 *      game, and passes where every team holds one — the check reads the vocabulary, never one role;
 *   6. production 12 players with no goalkeeper is still refused by the roster's sentence, the new check saying truthfully that the counts
 *      are not established; the neutral demonstration's participation group is checked on its count and passes.
 *
 * TEST-ONLY copies are labelled; production files are never written.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/participants-present.unit.ts
 */
import assert from 'node:assert/strict'

import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { mechanismDemonstration } from '../rendering/mechanism-demonstrations'
import { specializedRoleNames } from '../rendering/session-envelope'
import { completeConcreteGame } from '../realization/assemble-concrete-game'
import { realizeWithJustifiedDefaults } from '../realization/justified-defaults'
import { runPostRealizationGates } from '../realization/post-realization-gate'
import { isRefused, Realized } from '../realization/realize'
import { isNoSuppliedRealization, suppliedRealizationFor } from '../realization/supplied-realization'
import { contextManipulationRelationships, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { loadRegister } from './corpus'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10, runStages0to5 } from './engine'
import { PARTICIPANT_CLAUSES, PARTICIPANTS_CHECK } from './gates'
import { participantOf, sameParticipant } from './participants'
import { applyRealizationDeferrals } from './realization-deferral'
import { HaltError, indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { roleBlocksOf } from './role-blocks'
import { contractCoverage, derivationInputFor, selectFor } from './run-bounded-selection'
import { LoadedContract, RoleBlock } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('every participant an activity requires is present (GA-PARTICIPANTS-PRESENT, register version 15)')

const register = loadRegister()
const index = indexRegister(register)
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
/** The register's own name for its specialized role — read, never written here. */
const KEEPER = specializedRoleNames()[0]
const KEEPER_ROW = [...index.specializedRoleRows].find(([, name]) => name === KEEPER)![0]
const PLAYER_FORM = index.participants!.forms.find(form => form.kind === 'PERFORMER_OF_AWARDED_TEAM')!.value
const R = (id: string) => `c:provisional:A01-R1:A01-R1-${id}`
const sessionOf = (players: number, keepers: number, extra: Record<string, number> = {}) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { [KEEPER]: keepers, ...extra } })
const realizationOf = (contracts: LoadedContract[]) => contracts.find(c => c.contractId === 'provisional:A01-R1')!
const itemOf = (contracts: LoadedContract[], itemId: string) => realizationOf(contracts).items.find(i => i.itemId === itemId)!
const dropItems = (...ids: string[]) => (contracts: LoadedContract[]) => {
    const realization = realizationOf(contracts)
    const before = realization.items.length
    realization.items = realization.items.filter(i => !ids.includes(i.itemId))
    assert.equal(before - realization.items.length, ids.length, `TEST-ONLY copy: ${ids.join(', ')} removed`)
}
const CHECK_CLAUSES = Object.values(PARTICIPANT_CLAUSES)

/**
 * The chain one block is built by (the steps `buildOneGame` takes up to and including the post-realization gates), over a TEST-ONLY
 * copy where asked — including a copy of the REGISTER, which no whole-pathway entry accepts. Returns, per block, the pre-realization
 * check and the post-realization result.
 */
function chain(
    selection: any,
    session: any,
    options: { alter?: (contracts: LoadedContract[]) => void; register?: any } = {},
): { block: RoleBlock | null; pre: any; post: ReturnType<typeof runPostRealizationGates> | null; stoppedAt: string | null }[] {
    const input: any = { ...derivationInputFor(selection), envelope: copy(session) }
    if (options.register) input.register = options.register
    input.contracts = copy(input.contracts)
    options.alter?.(input.contracts)
    const regIndex = indexRegister(input.register)
    input.contracts = applyRealizationDeferrals(input.contracts, contextManipulationRelationships(), regIndex).contracts
    const base: any = runStages0to5(input)
    const found: any = base.run.halted || !base.derived ? null : roleBlocksOf(base.classes, base.derived.lines, regIndex)
    const blocks: (RoleBlock | null)[] = found?.kind === 'BLOCKS' ? found.blocks : [null]
    return blocks.map(block => {
        const blockInput = block ? { ...input, roleBlock: block } : input
        const result: any = runDerivation(blockInput)
        if (isStampedHalt(result)) return { block, pre: null, post: null, stoppedAt: 'halt' }
        const staged: any = runStages0to10(blockInput)
        const pre = staged.gates.gateA.checks.find((c: any) => c.checkId === PARTICIPANTS_CHECK)
        const resolved: any = assembleResolvedGame(result, staged.classes, regIndex, blockInput.contracts)
        if (!resolved.coherence.realizationAuthorized) return { block, pre, post: null, stoppedAt: `structure: ${resolved.coherence.notAuthorizedBecause.join('; ')}` }
        const supplied = suppliedRealizationFor(selection)
        assert.ok(!isNoSuppliedRealization(supplied), 'the realization input is there')
        const ctx = { ...staged.gateContext, contracts: blockInput.contracts }
        const { realization } = realizeWithJustifiedDefaults(resolved, supplied as any, regIndex, blockInput.envelope, ctx)
        if (isRefused(realization)) return { block, pre, post: null, stoppedAt: `realization: ${(realization as any).because.join('; ')}` }
        completeConcreteGame(ctx, realization as Realized)
        const post = runPostRealizationGates(ctx, resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause })), realization as Realized)
        return { block, pre, post, stoppedAt: null }
    })
}
const a01 = () => selectFor('A01', null)
const postCheck = (post: any) => post.gateA.checks.find((c: any) => c.checkId === PARTICIPANTS_CHECK)
const clauseOf = (check: any, requirement: keyof typeof PARTICIPANT_CLAUSES) => check.clauses.find((c: any) => c.clause === PARTICIPANT_CLAUSES[requirement])
/** The whole pathway as an administrator's review asks it, over a TEST-ONLY copy of the contracts. */
const builtWith = (session: any, alter: (contracts: LoadedContract[]) => void) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session }, learningGoalAuthorizations(), { alter, review: { includeDrafts: true } }).activity

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('register version 15 types the participant forms as data, in one versions entry quoting him', () => {
    const version = String(register.version)
    assert.ok(version.startsWith('15, adds which participant a value names, for his reply filed 25 October 2026, item 6'))
    for (const quote of [
        'Any participant or role required by an activity must actually be present in the authorized configuration.',
        "This safeguard should not depend on particular wording or on the current realization's existing goalkeeper-count restriction.",
        'The same principle should apply to other required participants or specialized roles.',
    ]) {
        assert.ok(version.includes(`"${quote}"`), quote)
        assert.ok(String(register.participants.note).includes(`"${quote}"`), `the block's note quotes it too: ${quote}`)
    }
    assert.equal(version.split('Supersedes version 14, which adds ').length - 1, 1, 'version 14 kept in the history, once')
    assert.deepEqual(
        index.participants!.forms.map(form => [form.kind, form.countRow]),
        [['NOT_A_PERFORMER', null], ['PERFORMER_OF_AWARDED_TEAM', null], ['COUNTED_GROUP', 'P5']],
        'three forms, each a value the knowledge already writes',
    )
    // Each form types a value the knowledge writes, whole: the taker of A01-R1's ordinary restarts and the neutral participation group.
    const contracts = derivationInputFor(a01()).contracts as LoadedContract[]
    assert.equal(itemOf(contracts, 'A01-R1-T3-2').value, PLAYER_FORM)
    assert.ok(index.participants!.forms.every(form => form.coachNoun === null || register.participants.note.includes('coachNoun is DRAFT')), 'coach nouns are DRAFT')
})

test('a damaged copy halts H1: an unimplemented kind, a repeated value, a role name or designation as a form, a count row that is not game-level', () => {
    const damaged = (mutate: (forms: any[]) => void): string => {
        const broken = copy(register)
        mutate(broken.participants.forms)
        try {
            indexRegister(broken)
            return 'admitted'
        } catch (error) {
            assert.ok(error instanceof HaltError && error.halt === 'H1', String(error))
            return (error as Error).message
        }
    }
    assert.match(damaged(forms => (forms[0].kind = 'ANYONE')), /does not implement/)
    assert.match(damaged(forms => forms.push(copy(forms[1]))), /listed twice/)
    assert.match(damaged(forms => (forms[0].value = KEEPER)), /name of a specialized role/)
    assert.match(damaged(forms => (forms[0].value = 'ATTACKING_TEAM')), /registered team designation/)
    assert.match(damaged(forms => (forms[2].countRow = 'P2')), /not a game-level FIELD row/)
    assert.match(damaged(forms => (forms[1].countRow = 'P5')), /only a COUNTED_GROUP has/)
    assert.match(damaged(forms => (forms[1].value = ` ${forms[1].value}`)), /surrounding spaces/)
    const without = copy(register)
    delete without.participants
    assert.equal(indexRegister(without).participants, null, 'a register before version 15 types no form')
})

// ── 2. Reading a participant ────────────────────────────────────────────────────────────────────────────
test('a value names a participant only through the register; open text names nobody, even when two texts are identical', () => {
    assert.deepEqual(participantOf(index, KEEPER), { kind: 'SPECIALIZED_ROLE', row: KEEPER_ROW, name: KEEPER, value: KEEPER })
    assert.equal(participantOf(index, PLAYER_FORM)?.kind, 'PERFORMER_OF_AWARDED_TEAM')
    assert.equal(participantOf(index, 'COACH')?.kind, 'NOT_A_PERFORMER')
    for (const variant of [`the ${KEEPER}`, KEEPER.toUpperCase(), `${KEEPER} `, 'a player of the awarded team', '']) assert.equal(participantOf(index, variant), null, JSON.stringify(variant))
    assert.equal(sameParticipant(index, KEEPER, KEEPER), true)
    assert.equal(sameParticipant(index, KEEPER, PLAYER_FORM), false)
    assert.equal(sameParticipant(index, `the ${KEEPER}`, `the ${KEEPER}`), false, 'two identical open texts identify nobody (SD-63)')
    assert.equal(participantOf(index, 1), null)
})

// ── 3. Production Play Out from the Back ────────────────────────────────────────────────────────────────
test('production A01: deferred to the instantiated teams before realization, and every clause passes on applicable instances over each block', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const blocks = chain(a01(), sessionOf(players, keepers))
        assert.equal(blocks.length, 2, 'two role blocks')
        for (const { block, pre, post, stoppedAt } of blocks) {
            const label = `${players}/${keepers} ${block?.blockId}`
            assert.equal(stoppedAt, null, `${label}: ${stoppedAt}`)
            assert.equal(pre.verdict, 'DEFERRED_TO_REALIZATION', `${label}: the teams are asserted, none instantiated before realization`)
            const check = postCheck(post)
            assert.equal(check.verdict, 'PASS', `${label}: ${check.why}`)
            assert.deepEqual(check.clauses.map((c: any) => c.clause), CHECK_CLAUSES, `${label}: five clauses, in order`)
            for (const requirement of ['TAKER', 'BEGIN_ARM', 'GROUP', 'ROLE', 'MOVED'] as const) {
                assert.equal(clauseOf(check, requirement).basis, 'EVALUATED', `${label}: ${requirement} ranged over applicable instances`)
            }
            assert.equal(clauseOf(check, 'TAKER').instances, 7, `${label}: seven restarts carry a taker`)
            assert.equal(clauseOf(check, 'BEGIN_ARM').instances, 3, `${label}: three restarts meet the begin condition's taker`)
            assert.deepEqual(post!.missingParticipants, [], label)
            assert.ok(post!.owed.some(o => o.checkId === PARTICIPANTS_CHECK && o.verdict === 'PASS'), `${label}: owed and paid`)
        }
    }
})

test('production A01 is served at 12/1, 12/2 and 11/1 with the check passing in both blocks', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const served = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(players, keepers) }, { includeDrafts: false }) as ServedActivity
        assert.equal(served.outcome, 'served', `${players}/${keepers}`)
        for (const block of served.roleBlocks!.blocks) assert.ok(block.concreteChecks.some(c => c.checkId === PARTICIPANTS_CHECK && c.verdict === 'PASS'), `${players}/${keepers} ${block.blockId}`)
    }
})

// ── 4. TEST-ONLY copies through the whole pathway ───────────────────────────────────────────────────────
const NAMED = `This game needs a ${KEEPER} to restart play for the building team, and the team set-up gives the building team none.`

test('TEST-ONLY: without the one-goalkeeper choice, 11 players and none in goal — REFUSED at validation, naming the missing role', () => {
    const activity = builtWith(sessionOf(11, 0), dropItems('A01-R1-P3-1', 'A01-R1-B4-1', 'A01-R1-B7-1')) as RefusedActivity
    assert.equal(activity.outcome, 'refused', 'was SERVED before 22 October 2026, saying the building team\'s goalkeeper restarts play')
    assert.equal(activity.stage, 'validation')
    assert.equal(activity.summary, NAMED, 'one coach sentence, the role by the register\'s name')
    assert.ok(!/GA-|c:|P3|T3/.test(activity.summary), 'no check, element or row in the coach sentence')
    const failing = activity.reasons.filter(reason => reason.includes(`${PARTICIPANTS_CHECK} — "${PARTICIPANT_CLAUSES.TAKER}": FAIL`))
    assert.equal(failing.length, 2, 'the taker clause fails in each block')
    for (const reason of failing) {
        for (const id of ['T1-1', 'T1-2', 'T1-3']) assert.ok(reason.includes(`${R(id)} [`), `the reason names ${id}`)
        assert.ok(reason.includes(`1 ${KEEPER} (${KEEPER_ROW}) of ROLE_HOLDER_BUILDING, and a team it falls on holds fewer`), reason.slice(0, 400))
        assert.match(reason, /realized:\S+ \(TEAM_AT_AXIS_(START|END), ROLE_HOLDER_BUILDING\) holds 0/)
    }
    assert.equal(activity.reasons.filter(reason => reason.includes(`"${PARTICIPANT_CLAUSES.BEGIN_ARM}": FAIL`)).length, 2, 'and the begin condition\'s taker, in each block')
    assert.ok(activity.reasons.some(reason => reason.includes('c:restated:RPC-001:RPC-001-18.a [begins BUILD_OUT_EPISODE]')), 'the condition is named')
    assert.ok(!activity.reasons.some(reason => reason.startsWith('roster') || reason.includes(': roster (')), 'the roster derived: this is not the session\'s to cure')
})

test('TEST-ONLY: the same copy with a goalkeeper available but never involved is refused the same way (not the session count, the configuration)', () => {
    const activity = builtWith(sessionOf(11, 1), dropItems('A01-R1-P3-1', 'A01-R1-B4-1', 'A01-R1-B7-1')) as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'validation')
    assert.equal(activity.summary, NAMED)
})

test('TEST-ONLY: without the count but with the reassignment kept, the goalkeeper the exchange would move is named too', () => {
    const activity = builtWith(sessionOf(11, 0), dropItems('A01-R1-P3-1')) as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.summary, NAMED, 'the taker is said first')
    const moved = activity.reasons.filter(reason => reason.includes(`"${PARTICIPANT_CLAUSES.MOVED}": FAIL`))
    assert.equal(moved.length, 2, 'the moved clause fails in each block')
    for (const reason of moved) assert.ok(reason.includes(`${R('B4-1')} (B4) requires 1 ${KEEPER} (${KEEPER_ROW}) of ROLE_HOLDER_BUILDING, and a team it falls on holds fewer`), reason.slice(0, 300))
})

test('TEST-ONLY: a taker reworded so the register types nobody is withheld before realization, whatever the wording', () => {
    for (const wording of [`the ${KEEPER}`, 'a player of STARTING_TEAM taking a controlled defensive restart']) {
        const activity = builtWith(sessionOf(12, 1), contracts => {
            itemOf(contracts, 'A01-R1-T3-2').value = wording
        }) as RefusedActivity
        assert.equal(activity.outcome, 'refused', wording)
        assert.equal(activity.stage, 'structure', `${wording}: ${activity.summary}`)
        assert.ok(activity.reasons.some(reason => reason.includes(`cannot be evaluated, so it is not satisfied: ${PARTICIPANTS_CHECK}`)), `${wording}: ${activity.reasons.join(' | ').slice(0, 500)}`)
    }
    // The investigation's controlled-restart probe (T43): that wording on the goalkeeper's own restarts, no goalkeeper anywhere. Refused
    // at structure on the failing episode check (a FAIL is what the refusal names first); the new check withholds beside it.
    const t43 = (contracts: LoadedContract[]) => {
        dropItems('A01-R1-P3-1', 'A01-R1-B4-1', 'A01-R1-B7-1')(contracts)
        itemOf(contracts, 'A01-R1-T3-1').value = 'a player of STARTING_TEAM taking a controlled defensive restart'
    }
    const probe = builtWith(sessionOf(11, 0), t43) as RefusedActivity
    assert.equal(probe.stage, 'structure')
    assert.ok(probe.reasons.some(reason => reason.includes('GA-EPISODE-REACHABLE')), 'the episode still cannot begin')
    for (const { pre } of chain(a01(), sessionOf(11, 0), { alter: t43 })) {
        assert.equal(clauseOf(pre, 'TAKER').verdict, 'NOT_EVALUABLE', 'its taker names nobody the register types')
        assert.match(pre.why, /names "a player of STARTING_TEAM taking a controlled defensive restart", which is no participant the register types/)
    }
})

test('the begin condition is met by the same participant, not the same text: a reworded start taker begins no build-out episode', () => {
    const blocks = chain(a01(), sessionOf(12, 1), {
        alter: contracts => {
            itemOf(contracts, 'A01-R1-T3-1').value = `the ${KEEPER}`
        },
    })
    for (const { pre, stoppedAt } of blocks) {
        assert.equal(pre.verdict, 'NOT_EVALUABLE', 'the reworded taker is withheld')
        assert.match(String(stoppedAt), /GA-EPISODE-REACHABLE/, 'and meets no arm of the begin condition')
    }
})

// ── 5. Another specialized role, on a TEST-ONLY register copy ─────────────────────────────────────────────
test('TEST-ONLY register copy: a taker naming a second specialized role FAILS with none present and PASSES where every team holds one', () => {
    const OTHER = 'testOnlyRole'
    const registerCopy = copy(register)
    registerCopy.rows.push({ id: 'P3T', path: `performers.teams[].${OTHER}`, ownerRow: 'P1', kind: 'FIELD', valueType: 'integer', sourceKinds: ['SELECTION'], specializedRole: true, specializedRoleNote: 'TEST-ONLY' })
    const copyIndex = indexRegister(registerCopy)
    assert.equal(participantOf(copyIndex, OTHER)?.kind, 'SPECIALIZED_ROLE', 'the copy types the second role by its row')
    assert.equal(participantOf(index, OTHER), null, 'production types nobody by that name')
    // Every team holds `count` of the second role (an item copied from the realization's own count item); the touchline restarts name it.
    const withRole = (count: string) => (contracts: LoadedContract[]) => {
        const realization = realizationOf(contracts)
        realization.items.push({ ...copy(itemOf(contracts, 'A01-R1-P3-1')), itemId: 'TEST-ONLY-P3T', row: 'P3T', selector: '*', value: count })
        itemOf(contracts, 'A01-R1-T3-2').value = OTHER
    }
    const none = chain(a01(), sessionOf(12, 1, { [OTHER]: 0 }), { register: registerCopy, alter: withRole('0') })
    for (const { block, post, stoppedAt } of none) {
        assert.equal(stoppedAt, null, `${block?.blockId}: ${stoppedAt}`)
        const taker = clauseOf(postCheck(post), 'TAKER')
        assert.equal(taker.verdict, 'FAIL', block?.blockId)
        const missing = post!.missingParticipants.filter(entry => entry.requirement === 'TAKER')
        assert.deepEqual([...new Set(missing.map(entry => entry.element.split(' ')[0]))].sort(), [R('T1-4'), R('T1-5')], 'the two touchline restarts')
        assert.ok(missing.every(entry => entry.missing.kind === 'SPECIALIZED_ROLE' && entry.missing.row === 'P3T' && entry.missing.name === OTHER && entry.teams.length === 1 && entry.teams[0].holds === 0))
        assert.ok(!post!.missingParticipants.some(entry => entry.missing.name === KEEPER), 'the goalkeeper restarts still hold')
    }
    // 13 players: one goalkeeper and one of the second role per team leave ten outfield players, which the per-team counts admit.
    const every = chain(a01(), sessionOf(13, 1, { [OTHER]: 2 }), { register: registerCopy, alter: withRole('1') })
    for (const { block, post, stoppedAt } of every) {
        assert.equal(stoppedAt, null, `${block?.blockId}: ${stoppedAt}`)
        assert.equal(postCheck(post).verdict, 'PASS', `${block?.blockId}: ${postCheck(post).why}`)
    }
})

// ── 6. The sessions and the demonstrations that were already refused or served ───────────────────────────
test('production 12 players with no goalkeeper: still the roster\'s sentence; the new check says the counts are not established', () => {
    const activity = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(12, 0) }, { includeDrafts: true }) as RefusedActivity
    assert.equal(activity.stage, 'session')
    assert.equal(activity.summary, `This game needs 1 ${KEEPER} in all and the session has 0.`)
    assert.ok(activity.reasons.some(reason => reason.includes(`${PARTICIPANTS_CHECK} — "${PARTICIPANT_CLAUSES.TAKER}": NOT_EVALUABLE`) && reason.includes("a team's count is not established")))
    assert.ok(activity.reasons.some(reason => reason.includes('roster (AVAILABILITY_SHORT)')), 'the roster refusal is still the cause, and said')
    assert.ok(!activity.reasons.some(reason => reason.includes(`${PARTICIPANTS_CHECK}`) && reason.includes(': FAIL')), 'nothing is called missing that was never counted')
})

test('the neutral demonstration: its participation group is checked on its count and passes; the scoring demonstration requires nobody', () => {
    const selectionOf = (id: string) => {
        const entries = mechanismDemonstration(id)!.selected.map((entry, i) => ({ id: entry, role: i === 0 ? 'game form' : 'constraint' }))
        return { selected: entries, ...contractCoverage(entries) }
    }
    const [neutral] = chain(selectionOf('neutral-players'), sessionOf(12, 0))
    assert.equal(neutral.stoppedAt, null, String(neutral.stoppedAt))
    assert.equal(clauseOf(neutral.pre, 'GROUP').verdict, 'DEFERRED_TO_REALIZATION', 'the neutral count is open before realization')
    const group = clauseOf(postCheck(neutral.post), 'GROUP')
    assert.deepEqual([group.verdict, group.basis, group.instances], ['PASS', 'EVALUATED', 1], postCheck(neutral.post).why)
    assert.match(postCheck(neutral.post).why, /NEUTRAL-01\.b \(P11\): at least 1 counted by P5/)
    const [scoring] = chain(selectionOf('scoring-modifier'), sessionOf(12, 0))
    assert.equal(scoring.stoppedAt, null)
    assert.ok(postCheck(scoring.post).clauses.every((c: any) => c.verdict === 'PASS' && c.basis === 'NO_APPLICABLE_INSTANCES'), 'vacuous: no element requires a participant')
    for (const id of ['neutral-players', 'scoring-modifier']) {
        const served = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: id, session: sessionOf(12, 0) }, { includeDrafts: false })
        assert.equal(served.outcome, 'served', id)
    }
})

console.log(`participants-present.unit.ts — ${passed} passed`)
