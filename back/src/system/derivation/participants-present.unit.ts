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
 *      are not established; the neutral demonstration's participation group is checked on its count and passes;
 *   7. P1b (22 October 2026, after the P1 review), on TEST-ONLY copies: a participant the configuration is already known to lack before
 *      realization (a counted group at 0, as a start placement's group, as a taker, or as the neutral demonstration's group) is refused at
 *      STRUCTURE with its own sentence from the typed records read from the staged context, the reasons naming the element — it was the
 *      generic structure sentence; and a restart whose award is decided at the trigger, taken by a role only one of the teams it can be
 *      awarded to holds, FAILS (it was NOT_EVALUABLE) and is refused at validation naming the role, whether the clause was owed or not,
 *      while an award that genuinely cannot be resolved still withholds — including one on a restart carrying a term that names, or may
 *      name, a team the register does not relate the award to (P1b review: silence is not independence, so no FAIL and no team named).
 *
 * TEST-ONLY copies are labelled; production files are never written.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/participants-present.unit.ts
 */
import assert from 'node:assert/strict'

import { buildActivityForReview, buildActivityOverAlteredKnowledge, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
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
import { decidedAtTransition } from './designation'
import { MissingParticipant, missingParticipantsIn, PARTICIPANT_CLAUSES, PARTICIPANTS_CHECK } from './gates'
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
    /** `notOwed` (P1b): also gate the concrete game as though no clause of the check were owed — a clause that passed before realization. */
    options: { alter?: (contracts: LoadedContract[]) => void; register?: any; notOwed?: boolean } = {},
): {
    block: RoleBlock | null
    pre: any
    /** The typed records read from the staged context before realization (P1b), as build-activity reads them for a structure refusal. */
    preMissing: MissingParticipant[]
    post: ReturnType<typeof runPostRealizationGates> | null
    notOwed: ReturnType<typeof runPostRealizationGates> | null
    stoppedAt: string | null
}[] {
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
        if (isStampedHalt(result)) return { block, pre: null, preMissing: [], post: null, notOwed: null, stoppedAt: 'halt' }
        const staged: any = runStages0to10(blockInput)
        const pre = staged.gates.gateA.checks.find((c: any) => c.checkId === PARTICIPANTS_CHECK)
        const preMissing = missingParticipantsIn({ ...staged.gateContext, contracts: blockInput.contracts })
        const resolved: any = assembleResolvedGame(result, staged.classes, regIndex, blockInput.contracts)
        if (!resolved.coherence.realizationAuthorized) return { block, pre, preMissing, post: null, notOwed: null, stoppedAt: `structure: ${resolved.coherence.notAuthorizedBecause.join('; ')}` }
        const supplied = suppliedRealizationFor(selection)
        assert.ok(!isNoSuppliedRealization(supplied), 'the realization input is there')
        const ctx = { ...staged.gateContext, contracts: blockInput.contracts }
        const { realization } = realizeWithJustifiedDefaults(resolved, supplied as any, regIndex, blockInput.envelope, ctx)
        if (isRefused(realization)) return { block, pre, preMissing, post: null, notOwed: null, stoppedAt: `realization: ${(realization as any).because.join('; ')}` }
        completeConcreteGame(ctx, realization as Realized)
        const owed: { checkId: string; clause: string }[] = resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause }))
        const post = runPostRealizationGates(ctx, owed, realization as Realized)
        const notOwed = options.notOwed ? runPostRealizationGates(ctx, owed.filter(o => o.checkId !== PARTICIPANTS_CHECK), realization as Realized) : null
        return { block, pre, preMissing, post, notOwed, stoppedAt: null }
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
    // Re-pointed 22 October 2026 (stage A): version 16 (one primary scoring event per role) supersedes 15, so version 15's entry is read
    // where it now stands, after "Supersedes version 15, which ", once.
    const full = String(register.version)
    // Re-pointed 23 October 2026 (stage B): version 17 (object targets and the geometry a goal needs) supersedes 16, which supersedes 15.
    // Re-pointed 23 October 2026 (stage D): version 18 (the coach-controlled end exchange) supersedes 17, which supersedes 16.
    // Re-pointed 23 October 2026 (stage E): version 19 (an object's availability as a session resource) supersedes 18.
    // Re-pointed 26 October 2026 (Stage F): version 20 (his rulings filed 26 October 2026 for the goal version) supersedes 19.
    assert.ok(full.startsWith('20, records his rulings filed 26 October 2026 for the goal version of the build-out activity'))
    assert.ok(full.includes("Supersedes version 19, which adds an object's availability as a session resource"))
    assert.ok(full.includes('Supersedes version 18, which adds the coach-controlled end exchange'))
    assert.ok(full.includes('Supersedes version 17, which adds object targets and the geometry a goal needs'))
    assert.ok(full.includes('Supersedes version 16, which adds one primary scoring event per role'))
    assert.equal(full.split('Supersedes version 15, which ').length - 1, 1, 'version 15 superseded once')
    const version = `15, ${full.split('Supersedes version 15, which ')[1]}`
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

// ── 7. P1b: a participant known missing before realization, and an award decided at the trigger ─────────────
const GROUP_FORM = index.participants!.forms.find(form => form.kind === 'COUNTED_GROUP')!
const GROUP_NOUN = GROUP_FORM.coachNoun!
const GROUP_ROW = GROUP_FORM.countRow!
const demoSelection = (id: string) => {
    const entries = mechanismDemonstration(id)!.selected.map((entry, i) => ({ id: entry, role: i === 0 ? 'game form' : 'constraint' }))
    return { selected: entries, ...contractCoverage(entries) }
}
const recordsOf = (missing: MissingParticipant[]) => missing.map(entry => [entry.requirement, entry.element.split(' ')[0], entry.missing.kind, entry.missing.name, entry.teams.map(team => [team.designations, team.holds])])
const addCopyOf = (contracts: LoadedContract[], fromId: string, patch: Record<string, unknown>) => {
    realizationOf(contracts).items.push({ ...copy(itemOf(contracts, fromId)), ...patch } as any)
}

test('P1b TEST-ONLY: a start placement for a counted group the game holds none of is refused at STRUCTURE naming the group (was the generic structure sentence)', () => {
    const alter = (contracts: LoadedContract[]) => {
        addCopyOf(contracts, 'A01-R1-P8-1', { itemId: 'TEST-ONLY-P8-N', selector: `group=${GROUP_FORM.value}` })
        addCopyOf(contracts, 'A01-R1-P10-1', { itemId: 'TEST-ONLY-P10-N', selector: `group=${GROUP_FORM.value}` })
    }
    for (const { block, pre, preMissing, stoppedAt } of chain(a01(), sessionOf(12, 1), { alter })) {
        assert.equal(clauseOf(pre, 'GROUP').verdict, 'FAIL', `${block?.blockId}: the count is known before realization`)
        assert.ok(String(stoppedAt).includes(`a pre-realization Gate A invariant fails: ${PARTICIPANTS_CHECK}`), String(stoppedAt))
        assert.deepEqual(recordsOf(preMissing), [['GROUP', 'c:provisional:A01-R1:TEST-ONLY-P8-N', 'COUNTED_GROUP', GROUP_NOUN, []]], 'typed, from the staged context')
    }
    const activity = builtWith(sessionOf(12, 1), alter) as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'structure')
    assert.equal(activity.summary, `This game needs a ${GROUP_NOUN}, and the team set-up has none.`)
    assert.ok(!/GA-|c:|P5|P8/.test(activity.summary), 'no check, element or row in the coach sentence')
    const named = activity.reasons.filter(reason => reason.includes(`a participant the game requires is missing (${PARTICIPANTS_CHECK}, GROUP): c:provisional:A01-R1:TEST-ONLY-P8-N (P8) requires 1 ${GROUP_NOUN} counted by ${GROUP_ROW}; game::${GROUP_ROW} holds 0`))
    assert.equal(named.length, 2, 'the element named in each block\'s reasons')
    assert.equal(activity.reasons.filter(reason => reason.includes(`a pre-realization Gate A invariant fails: ${PARTICIPANTS_CHECK}`)).length, 2, 'the failing check is still named')
})

test('P1b TEST-ONLY: a restart taken by a counted group the game holds none of is refused at STRUCTURE naming the group, for no particular team', () => {
    const alter = (contracts: LoadedContract[]) => {
        itemOf(contracts, 'A01-R1-T3-2').value = GROUP_FORM.value
    }
    for (const { pre, preMissing } of chain(a01(), sessionOf(12, 1), { alter })) {
        assert.equal(clauseOf(pre, 'TAKER').verdict, 'FAIL')
        assert.deepEqual(recordsOf(preMissing), [R('T1-4'), R('T1-5')].map(id => ['TAKER', id, 'COUNTED_GROUP', GROUP_NOUN, []]), 'the two touchline restarts')
    }
    const activity = builtWith(sessionOf(12, 1), alter) as RefusedActivity
    assert.equal(activity.stage, 'structure')
    assert.equal(activity.summary, `This game needs a ${GROUP_NOUN} to restart play, and the team set-up has none.`)
    for (const id of ['T1-4', 'T1-5']) {
        assert.equal(activity.reasons.filter(reason => reason.includes(`(${PARTICIPANTS_CHECK}, TAKER): ${R(id)} [OUT_TOUCHLINE] (T3) requires 1 ${GROUP_NOUN} counted by ${GROUP_ROW}; game::${GROUP_ROW} holds 0`)).length, 2, id)
    }
})

test('P1b TEST-ONLY: the neutral demonstration with its neutral count forced to 0 is refused at STRUCTURE naming the group', () => {
    const alter = (contracts: LoadedContract[]) => {
        for (const contract of contracts) for (const item of contract.items) if (item.row === GROUP_ROW) Object.assign(item, { value: '0', requirement: 'EQUALS' })
    }
    const [game] = chain(demoSelection('neutral-players'), sessionOf(12, 0), { alter })
    assert.equal(clauseOf(game.pre, 'GROUP').verdict, 'FAIL')
    assert.deepEqual(recordsOf(game.preMissing), [['GROUP', 'c:restated:NEUTRAL-PLAYER-CONDITION:NEUTRAL-01.b', 'COUNTED_GROUP', GROUP_NOUN, []]])
    const activity = buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: sessionOf(12, 0) }, alter) as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'structure')
    assert.equal(activity.summary, `This game needs a ${GROUP_NOUN}, and the team set-up has none.`)
    assert.ok(activity.reasons.includes(`a participant the game requires is missing (${PARTICIPANTS_CHECK}, GROUP): c:restated:NEUTRAL-PLAYER-CONDITION:NEUTRAL-01.b (P11) requires 1 ${GROUP_NOUN} counted by ${GROUP_ROW}; game::${GROUP_ROW} holds 0`), activity.reasons.join(' | '))
    // The production demonstration, untouched, is still served.
    assert.equal(buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: sessionOf(12, 0) }, { includeDrafts: false }).outcome, 'served')
})

test('P1b: which awards are decided at the trigger, read from the register\'s resolutions (scope, basis, relation)', () => {
    const lastTouch = { 'qualifier.lastTouch': 'ROLE_HOLDER_PRESSING' }
    const startTouched = { 'qualifier.lastTouch': 'TEAM_AT_AXIS_START' }
    const table: [unknown, Record<string, unknown>, boolean, string][] = [
        // P1b review: a term naming a team the register does not relate the award to may fix the team — unresolved, never decided at the trigger.
        ['LAST_TOUCH', startTouched, false, 'the transition carries a qualifier naming a team: the register\'s silence on the relation is not independence'],
        ['WON_BALL', startTouched, false, 'the same for any award the register relates to no qualifier'],
        ['ATTACKING_TEAM', { 'qualifier.endLine': 'ROLE_HOLDER_BUILDING' }, false, 'any team-naming qualifier, not only the last touch'],
        ['LAST_TOUCH', { 'qualifier.lastTouch': 'EACH_TEAM' }, true, 'a qualifier naming every team fixes no team'],
        ['LAST_TOUCH', { trigger: 'OUT_TOUCHLINE' }, true, 'a term naming no team leaves it decided at the trigger'],
        ['NOT_LAST_TOUCH', {}, true, 'his words relate it to a last-touch qualifier the transition does not carry: decided by who touches it last'],
        ['NOT_LAST_TOUCH', lastTouch, false, 'the transition carries the qualifier: awardeeRelation answers, never this'],
        ['WON_BALL', {}, true, 'TRIGGER, on the entry\'s gloss'],
        ['LAST_TOUCH', {}, true, 'TRIGGER, on the entry\'s gloss; the register relates it to no qualifier'],
        ['ATTACKING_TEAM', {}, true, 'DYNAMIC, on the entry\'s gloss'],
        ['LOST_BALL', {}, false, 'our reading only'],
        ['SCORING_TEAM', {}, false, 'our reading only'],
        ['DEFENDING_TEAM', {}, false, 'our reading only'],
        ['BUILD_OUT_TEAM', {}, false, 'EPISODE: fixed when the episode began, at another transition\'s award'],
        ['STARTING_TEAM', {}, false, 'standing: one team, which a binding names'],
        ['TEAM_AT_AXIS_START', {}, false, 'standing'],
        ['ROLE_HOLDER_BUILDING', {}, false, 'standing'],
        ['EACH_TEAM', {}, false, 'standing'],
        ['the team that did not touch it last', {}, false, 'open text names no designation'],
        [undefined, {}, false, 'no award'],
    ]
    for (const [award, qualifiers, expected, why] of table) assert.equal(decidedAtTransition(index, award, qualifiers), expected, `${String(award)}: ${why}`)
    // With the transition's whole selector: a term of any operator, and an attribute the register declares designation-valued on the
    // transition's row whatever words it holds, may name a team. The row and attribute are read from the register, never written in code.
    const row = 'T1'
    const designationValued = index.designations.attributes.filter(entry => entry.row === row).map(entry => entry.attribute)
    assert.ok(designationValued.includes('qualifier.lastTouch'), 'the register declares the last-touch qualifier designation-valued on T1')
    const carried: [unknown, any[], boolean, string, string?][] = [
        ['NOT_LAST_TOUCH', [{ attribute: 'qualifier.lastTouch', op: 'IN', values: ['words no designation names'] }], false, 'his related qualifier carried by another operator, on a TEST-ONLY row declaring nothing designation-valued: still unresolved', 'TEST-ONLY-ROW'],
        ['LAST_TOUCH', [{ attribute: 'qualifier.lastTouch', op: 'IN', values: ['words no designation names'] }], true, 'the same term on that row, for an award related to no qualifier: nothing in it names a team the register can read', 'TEST-ONLY-ROW'],
        ['LAST_TOUCH', [{ attribute: 'trigger', op: '=', value: 'OUT_TOUCHLINE' }], true, 'the trigger alone names no team'],
        ['LAST_TOUCH', [{ attribute: 'qualifier.lastTouch', op: 'IN', values: ['TEAM_AT_AXIS_START'] }], false, 'an IN term naming a team'],
        ['LAST_TOUCH', [{ attribute: 'qualifier.lastTouch', op: '=', value: 'the side that kicked it' }], false, 'a designation-valued attribute in words the resolver cannot read may still name a team'],
        ['LAST_TOUCH', [{ attribute: 'qualifier.lastTouch', op: '=', value: 'EACH_TEAM' }], true, 'every team fixes no team'],
        ['NOT_LAST_TOUCH', [{ attribute: 'trigger', op: '=', value: 'OUT_TOUCHLINE' }], true, 'his relation to a qualifier the transition does not carry: decided by who touches it last'],
        ['NOT_LAST_TOUCH', [{ attribute: 'qualifier.lastTouch', op: 'IN', values: ['TEAM_AT_AXIS_START', 'TEAM_AT_AXIS_END'] }], false, 'the related qualifier carried as a set: awardeeRelation cannot answer, and the team is unresolved'],
    ]
    for (const [award, terms, expected, why, onRow] of carried) {
        const qualifiers = Object.fromEntries(terms.filter(term => term.op === '=').map(term => [term.attribute, term.value]))
        assert.equal(decidedAtTransition(index, award, qualifiers, { row: onRow ?? row, terms }), expected, `${String(award)} carrying ${JSON.stringify(terms)} on ${onRow ?? row}: ${why}`)
    }
})

/**
 * A TEST-ONLY touchline restart on a copy of the possession game form: no last-touch qualifier, so the form's own item awards it to the
 * team that did not touch it last (GF2-16.a, his words relate that to a qualifier this transition does not carry) and stops play
 * (GF2-16.b); taken by the register's specialized role, which only the named setup assignments hold. `award` replaces GF2-16.a's value on
 * the copy; `lastTouch` (P1b review) selects the restart for a last-touch qualifier naming that team instead.
 */
const touchlineRestart = (holders: string[], award?: string, lastTouch?: string) => (contracts: LoadedContract[]) => {
    const form = contracts.find(contract => contract.contractId === 'restated:GF2')!
    const base = form.items.find(item => item.itemId === 'GF2-16.a')!
    const item = (itemId: string, row: string, selector: string, requirement: string, value: unknown) =>
        form.items.push({ ...copy(base), itemId, ...('id' in base ? { id: itemId } : {}), row, selector, requirement, value, strictness: 'REQUIRED', valueStatus: requirement === 'EXISTS' ? 'N/A' : 'REQUIRED_RANGE', basis: 'OWNER_RULING' } as any)
    const selector = lastTouch ? `trigger=OUT_TOUCHLINE AND qualifier.lastTouch=${lastTouch}` : 'trigger=OUT_TOUCHLINE'
    item('TEST-ONLY-T1', 'T1', selector, 'EXISTS', 'N/A')
    item('TEST-ONLY-T3', 'T3', selector, 'EQUALS', KEEPER)
    item('TEST-ONLY-T4', 'T4', selector, 'EQUALS', { dynamic: 'where the ball went out' })
    item('TEST-ONLY-T5', 'T5', selector, 'EQUALS', 'IN_HAND')
    for (const team of holders) item(`TEST-ONLY-${KEEPER_ROW}-${team}`, KEEPER_ROW, `team=${team}`, 'EQUALS', '1')
    if (award) (base as any).value = award
}
const RESTART = 'c:restated:GF2:TEST-ONLY-T1'

test('P1b TEST-ONLY: a restart awarded at the trigger FAILS where a team it can be awarded to lacks its taker, refused at validation naming the role, owed or not (was NOT_EVALUABLE)', () => {
    for (const players of [13, 11]) {
        const alter = touchlineRestart(['TEAM_AT_AXIS_START'])
        const [game] = chain(demoSelection('scoring-modifier'), sessionOf(players, 1), { alter, notOwed: true })
        assert.equal(game.stoppedAt, null, String(game.stoppedAt))
        assert.equal(clauseOf(game.pre, 'TAKER').verdict, 'DEFERRED_TO_REALIZATION', 'the teams are instantiated by realization')
        const check = postCheck(game.post)
        assert.equal(clauseOf(check, 'TAKER').verdict, 'FAIL', check.why)
        assert.ok(
            String(check.why).includes(`${RESTART} [OUT_TOUCHLINE] (T3) requires 1 ${KEEPER} (${KEEPER_ROW}) of NOT_LAST_TOUCH, which is decided at the trigger, and a team it can be awarded to holds fewer: realized:c:restated:GF2:GF2-14.a#2 (TEAM_AT_AXIS_END) holds 0`),
            check.why,
        )
        assert.deepEqual(recordsOf(game.post!.missingParticipants), [['TAKER', RESTART, 'SPECIALIZED_ROLE', KEEPER, [[['TEAM_AT_AXIS_END'], 0]]]], 'the team lacking it, typed')
        assert.ok(game.post!.owed.some(o => o.checkId === PARTICIPANTS_CHECK && o.verdict === 'FAIL'), 'owed, and not paid')
        assert.equal(game.post!.validated, false)
        // A clause that was not owed (it passed before realization) is still refused: the gate blocks every FAIL on the concrete game.
        assert.equal(game.notOwed!.validated, false, `${players}/1 not owed`)
        assert.ok(game.notOwed!.outstanding.some(o => o.startsWith(`${PARTICIPANTS_CHECK} FAILS on the concrete game though it did not on the resolved game: TAKER: ${RESTART}`)))
        const activity = buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: sessionOf(players, 1) }, alter) as RefusedActivity
        assert.equal(activity.outcome, 'refused', `${players}/1`)
        assert.equal(activity.stage, 'validation')
        assert.equal(activity.summary, `This game needs a ${KEEPER} to restart play for one of the teams, and the team set-up gives that team none.`)
    }
    // Control: the role on both teams. The clause is evaluated and passes, and the game is served.
    const both = touchlineRestart(['TEAM_AT_AXIS_START', 'TEAM_AT_AXIS_END'])
    const [held] = chain(demoSelection('scoring-modifier'), sessionOf(12, 2), { alter: both })
    const taker = clauseOf(postCheck(held.post), 'TAKER')
    assert.deepEqual([taker.verdict, taker.basis, taker.instances], ['PASS', 'EVALUATED', 1], postCheck(held.post).why)
    assert.equal(buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: sessionOf(12, 2) }, both).outcome, 'served')
})

test('P1b TEST-ONLY: decided at the trigger on the entry\'s gloss FAILS; an award that cannot be resolved still withholds, and is still refused', () => {
    for (const award of ['WON_BALL', 'LAST_TOUCH', 'ATTACKING_TEAM']) {
        const [game] = chain(demoSelection('scoring-modifier'), sessionOf(13, 1), { alter: touchlineRestart(['TEAM_AT_AXIS_START'], award) })
        assert.equal(clauseOf(postCheck(game.post), 'TAKER').verdict, 'FAIL', award)
        assert.deepEqual(recordsOf(game.post!.missingParticipants), [['TAKER', RESTART, 'SPECIALIZED_ROLE', KEEPER, [[['TEAM_AT_AXIS_END'], 0]]]], award)
    }
    for (const award of ['LOST_BALL', 'BUILD_OUT_TEAM', 'STARTING_TEAM']) {
        const [game] = chain(demoSelection('scoring-modifier'), sessionOf(13, 1), { alter: touchlineRestart(['TEAM_AT_AXIS_START'], award) })
        const check = postCheck(game.post)
        assert.equal(clauseOf(check, 'TAKER').verdict, 'NOT_EVALUABLE', award)
        assert.ok(String(check.why).includes(`of ${award}: which team it falls on cannot be resolved, and only some of the teams it may fall on hold it`), check.why)
        assert.deepEqual(game.post!.missingParticipants, [], `${award}: nothing is called missing that cannot be placed on a team`)
        assert.equal(game.post!.validated, false, `${award}: owed, so still refused`)
    }
})

test('P1b review TEST-ONLY: an award the register relates to no qualifier, on a restart selected for a last touch naming a team, is unresolved — it withholds and is still refused, never a FAIL naming the other team', () => {
    // X4: awarded to the team that touched it last, selected for the start-end team touching it last; only that team holds the taker. In
    // plain meaning the restart goes to the start-end team, which holds it — the register's silence on the relation establishes no violation.
    const x4 = touchlineRestart(['TEAM_AT_AXIS_START'], 'LAST_TOUCH', 'TEAM_AT_AXIS_START')
    const [game] = chain(demoSelection('scoring-modifier'), sessionOf(13, 1), { alter: x4 })
    assert.equal(game.stoppedAt, null, String(game.stoppedAt))
    const check = postCheck(game.post)
    assert.equal(clauseOf(check, 'TAKER').verdict, 'NOT_EVALUABLE', `was FAIL after 157ceda: ${check.why}`)
    assert.ok(String(check.why).includes(`${RESTART} [OUT_TOUCHLINE] (T3) requires 1 ${KEEPER} (${KEEPER_ROW}) of LAST_TOUCH: which team it falls on cannot be resolved, and only some of the teams it may fall on hold it`), check.why)
    assert.ok(!String(check.why).includes('decided at the trigger'), check.why)
    assert.deepEqual(game.post!.missingParticipants, [], 'no team is called lacking on information that does not establish it')
    assert.ok(game.post!.owed.some(o => o.checkId === PARTICIPANTS_CHECK && o.verdict === 'NOT_EVALUABLE'), 'owed, and not paid')
    assert.equal(game.post!.validated, false, 'owed, so still refused')
    const activity = buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: sessionOf(13, 1) }, x4) as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'validation')
    assert.ok(!activity.summary.includes(KEEPER), `no participant named as missing: ${activity.summary}`)
    // Beside it, unchanged: the same qualifier with his related award is answered by the resolver — the restart goes to the end team,
    // which certainly lacks the taker (a FAIL on a team it falls on, not one decided at the trigger); and LAST_TOUCH with no qualifier
    // still FAILs as decided at the trigger (the previous test).
    const [related] = chain(demoSelection('scoring-modifier'), sessionOf(13, 1), { alter: touchlineRestart(['TEAM_AT_AXIS_START'], undefined, 'TEAM_AT_AXIS_START') })
    const relatedCheck = postCheck(related.post)
    assert.equal(clauseOf(relatedCheck, 'TAKER').verdict, 'FAIL', relatedCheck.why)
    assert.ok(String(relatedCheck.why).includes(`of NOT_LAST_TOUCH, and a team it falls on holds fewer: realized:c:restated:GF2:GF2-14.a#2 (TEAM_AT_AXIS_END) holds 0`), relatedCheck.why)
    assert.deepEqual(recordsOf(related.post!.missingParticipants), [['TAKER', RESTART, 'SPECIALIZED_ROLE', KEEPER, [[['TEAM_AT_AXIS_END'], 0]]]])
})

console.log(`participants-present.unit.ts — ${passed} passed`)
