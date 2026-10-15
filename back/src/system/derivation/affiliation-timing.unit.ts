/**
 * When a neutral player's change of side takes effect — register row P6c, his ruling C43, and the Gate A check
 * that reads them (`GA-AFFILIATION`). Added 14 October 2026.
 *
 * Christian that day: *"Please add the explicit property governing when a neutral player changes allegiance,
 * using immediate switching upon possession change as the approved behavior for the current mechanism."* And
 * on 13 October: *"the neutral supports whichever team currently has possession and changes allegiance
 * immediately when possession changes. That should be explicit in the activity rather than left ambiguous."*
 *
 * The row could not be P6a: that row holds one trigger and already holds the authored STANDING, so a second
 * value collided (Gate A FAIL, measured 13 October). So the timing is its own row, and what is asserted here is
 * that the row is registered as a closed, versioned vocabulary; that his ruling is the one item that fills it;
 * that Gate A holds the value to the vocabulary and to a reachable change of possession; that a held change
 * (AT_NEXT_RESTART) cannot authorize; and that the activity says "immediately" only where the game holds it.
 *
 * Most of it is negative, because the measured fault was that an unregistered timing passed every gate.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { loadCorpusContracts, loadRegister } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { derivationInputFor } from './run-bounded-selection'
import { LoadedContract } from './types'
import { buildActivityFromKnowledge, buildActivityOverAlteredKnowledge, buildActivityWithFixture, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('affiliation timing — register row P6c, ruling C43, GA-AFFILIATION')

const NEUTRAL = 'restated:NEUTRAL-PLAYER-CONDITION'
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = (players = 12) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: none })

/** The neutral demonstration's derivation input, with its contracts COPIED so an alteration touches nothing shared. */
const neutralInput = (alter?: (contracts: LoadedContract[]) => void) => {
    const input = derivationInputFor({ selected: [{ id: 'GF2' }, { id: 'tl-v0-constraint-neutral-player-condition' }] } as any)
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    input.selection = JSON.parse(JSON.stringify(input.selection))
    if (alter) alter(input.contracts)
    return input
}
const item = (contracts: LoadedContract[], itemId: string): any => contracts.find(c => c.contractId === NEUTRAL)!.items.find((i: any) => i.itemId === itemId)
const affiliation = (result: any) => result.gates.gateA.checks.find((c: any) => c.checkId === 'GA-AFFILIATION')
const clauses = (result: any) => Object.fromEntries(affiliation(result).clauses.map((c: any) => [c.clause, c.verdict]))
const MEMBER = 'every neutral affiliation timing is a registered member'
const IMMEDIATE = 'an immediate change of side follows a reachable change of possession'
const RESTART = 'a change of side held until the next restart names a registered restart'

test('the register holds P6c as a closed, versioned vocabulary, and not as a trigger', () => {
    const register = loadRegister()
    const row = register.rows.find((r: any) => r.id === 'P6c')
    assert.deepEqual([row.path, row.kind, row.sourceKinds], ['performers.neutrals.affiliation.takesEffect', 'FIELD', ['SELECTION']], 'no REALIZATION source: realization can never choose it')
    assert.deepEqual(register.vocabularies['P6c.takesEffect'], ['IMMEDIATE', 'AT_NEXT_RESTART'])
    assert.ok(!register.vocabularies.triggerRows.includes('P6c'), 'a timing, not a trigger')
    // Re-pointed 15 October 2026 (stage K1): register version 8 (his M6 qualifier vocabulary and M8 relational
    // referent) supersedes 7, and its sentence still names version 7 as the one that added P6c.
    // Re-pointed again 15 October 2026 (stage K2): version 9 (the typed team designations, his M2) supersedes 8, and the
    // sentence keeps the whole chain, so it still names version 7 as the one that added P6c.
    assert.match(String(register.version), /^9, adds .*Supersedes version 8, .*Supersedes version 7, which added P6c/)
    // The H2 guard, measured: a vocabulary with no version halts every derivation. Every array carries one.
    const index = indexRegister(register)
    for (const name of index.vocabularies.keys()) assert.ok(index.vocabularyVersions[name], `${name} carries a version`)
    // P6a keeps its one trigger: the two authored STANDING items are untouched.
    for (const id of ['NEUTRAL-03.b', 'NEUTRAL-14.a']) assert.equal(item(loadCorpusContracts(), id).value, 'STANDING', id)
})

test('his ruling is ONE item, on P6c, quoting him — C43', () => {
    const c43 = item(loadCorpusContracts(), 'NEUTRAL-14.c')
    assert.deepEqual([c43.row, c43.requirement, c43.value, c43.strictness, c43.valueStatus, c43.basis], ['P6c', 'EQUALS', 'IMMEDIATE', 'REQUIRED', 'REQUIRED_RANGE', 'OWNER_RULING'])
    assert.ok(c43.basisEvidence.includes('using immediate switching upon possession change as the approved behavior for the current mechanism'))
    assert.equal(loadCorpusContracts().flatMap(c => c.items ?? []).filter((i: any) => i.row === 'P6c').length, 1, 'nothing else authors the timing')
})

test('the neutral demonstration: three clauses, each PASS or vacuous, and the timing reaches the game', () => {
    const result: any = runStages0to10(neutralInput())
    assert.deepEqual(clauses(result), { [MEMBER]: 'PASS', [IMMEDIATE]: 'PASS', [RESTART]: 'PASS' })
    assert.equal(affiliation(result).verdict, 'PASS')
    assert.deepEqual(affiliation(result).subjects, ['game::P6c', 'game::P6a', 'game::P6b', 'game::PS1'], 'every line the clauses read is a recorded subject')
    const { activity, fixture } = buildActivityFromKnowledge(['GF2', 'tl-v0-constraint-neutral-player-condition'], session())
    assert.equal(activity.outcome, 'served')
    assert.equal((fixture as any).game.performers.neutrals.affiliation.takesEffect, 'IMMEDIATE')
})

test('an unregistered timing FAILS — it passed every gate before this check (measured)', () => {
    const result: any = runStages0to10(neutralInput(contracts => (item(contracts, 'NEUTRAL-14.c').value = 'SOMETIME')))
    assert.equal(clauses(result)[MEMBER], 'FAIL')
    assert.equal(result.gates.gateA.verdict, 'FAIL')
    const refused = buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: session() }, contracts => (item(contracts, 'NEUTRAL-14.c').value = 'SOMETIME'))
    assert.deepEqual([refused.outcome, (refused as RefusedActivity).stage], ['refused', 'structure'])
})

test('a change held until the next restart cannot authorize: the register names no class of restarts', () => {
    const result: any = runStages0to10(neutralInput(contracts => (item(contracts, 'NEUTRAL-14.c').value = 'AT_NEXT_RESTART')))
    assert.deepEqual(clauses(result), { [MEMBER]: 'PASS', [IMMEDIATE]: 'PASS', [RESTART]: 'NOT_EVALUABLE' })
    assert.ok(result.refusals.some((r: any) => r.refusalId.includes('GA-AFFILIATION') && r.kind === 'CHECK_NOT_EXECUTABLE'), 'with a refusal record naming why')
    const refused = buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: session() }, contracts => (item(contracts, 'NEUTRAL-14.c').value = 'AT_NEXT_RESTART'))
    assert.deepEqual([refused.outcome, (refused as RefusedActivity).stage], ['refused', 'structure'], 'never realized')
})

test('an immediate switch needs a side the register defines by the possession relation', () => {
    // A registered designation that the register does not define by the relation: not decided here.
    const fixed: any = runStages0to10(
        neutralInput(contracts => {
            for (const id of ['NEUTRAL-03.a', 'NEUTRAL-14.b']) {
                const i = item(contracts, id)
                if (i && i.row === 'P6b') i.value = 'TEAM_AT_AXIS_START'
            }
            // The two exclusions on P6b would otherwise speak to the altered value; they are not what is tested.
            contracts.find(c => c.contractId === NEUTRAL)!.items = contracts.find(c => c.contractId === NEUTRAL)!.items.filter((i: any) => !(i.row === 'P6b' && i.strictness === 'EXCLUSION'))
        }),
    )
    assert.equal(clauses(fixed)[IMMEDIATE], 'NOT_EVALUABLE', 'TEAM_AT_AXIS_START is registered and not defined by the possession relation: not decided here')
    // A designation the register does not list at all: an established answer, and a failure.
    const unlisted: any = runStages0to10(
        neutralInput(contracts => {
            for (const id of ['NEUTRAL-03.a', 'NEUTRAL-14.b']) {
                const i = item(contracts, id)
                if (i && i.row === 'P6b') i.value = 'NO_SUCH_TEAM'
            }
            contracts.find(c => c.contractId === NEUTRAL)!.items = contracts.find(c => c.contractId === NEUTRAL)!.items.filter((i: any) => !(i.row === 'P6b' && i.strictness === 'EXCLUSION'))
        }),
    )
    assert.equal(clauses(unlisted)[IMMEDIATE], 'FAIL')
    // K2 review, 15 October 2026: a value the designation resolver can MAP to an entry is not thereby a list entry. Before
    // stage K2 a team named by its own id, a glossed spelling the list does not hold and prose ending "(= ENTRY)" all
    // FAILED here as unlisted; at K2 the first two became NOT_EVALUABLE and the third (pointing at the possession entry)
    // could PASS, with no ruling for either. The side is a list entry, by its name or its whole text, or it is unlisted.
    for (const side of ['TEAM_RED', 'TEAM_AT_AXIS_START (a gloss the list does not hold)', 'the holders (= ATTACKING_TEAM)']) {
        const mapped: any = runStages0to10(
            neutralInput(contracts => {
                for (const id of ['NEUTRAL-03.a', 'NEUTRAL-14.b']) {
                    const i = item(contracts, id)
                    if (i && i.row === 'P6b') i.value = side
                }
                contracts.find(c => c.contractId === NEUTRAL)!.items = contracts.find(c => c.contractId === NEUTRAL)!.items.filter((i: any) => !(i.row === 'P6b' && i.strictness === 'EXCLUSION'))
            }),
        )
        assert.equal(clauses(mapped)[IMMEDIATE], 'FAIL', `${side}: TEST-ONLY`)
    }
})

test('a game with no neutrals records no blocker and no subject', () => {
    const result: any = runStages0to10(derivationInputFor({ selected: [{ id: 'GF2' }] } as any))
    assert.deepEqual(clauses(result), { [MEMBER]: 'PASS', [IMMEDIATE]: 'PASS', [RESTART]: 'PASS' })
    assert.ok(affiliation(result).clauses.every((c: any) => c.basis === 'NO_APPLICABLE_INSTANCES'), 'vacuous, and saying so (SD-54)')
    assert.deepEqual([affiliation(result).subjects, affiliation(result).blockedBy], [[], []])
    assert.equal(buildActivityFromKnowledge(['GF2'], session()).activity.outcome, 'served')
})

/**
 * C48, 14 October 2026. The row was added after every contract was written, so a game without neutrals read P6c as
 * "no coverage" — nobody looked — although the possession game form declares every other neutral property
 * NON_CLAIMED ("performers outside the two teams are neither authored nor forbidden"). The same declaration is now
 * extended to P6c by restatement, and the line says what the knowledge said: not constrained. It is still a failed
 * line and still blocks nothing; what changed is only that it no longer misstates that nobody looked.
 */
test('C48: a game without neutrals says the timing is not constrained, not that nobody looked', () => {
    const result: any = runDerivation(derivationInputFor({ selected: [{ id: 'GF2' }] } as any))
    const p6c = (result.resolution ?? []).filter((e: any) => e.lineId === 'game::P6c')
    assert.equal(p6c.length, 1, 'one game-level timing line')
    assert.deepEqual([p6c[0].state, p6c[0].reason], ['failed', 'not constrained'], 'GF2’s P6c declaration reaches it (C48); it was "no coverage" before')
    assert.ok(!(result.resolution ?? []).some((e: any) => e.lineId === 'game::P6c' && e.reason === 'no coverage'), 'no "no coverage" line on P6c')

    // The same through the pathway that serves an activity: the technical account's unestablished entry carries
    // the declaration that reached it, not an empty list.
    const { activity, fixture } = buildActivityFromKnowledge(['GF2'], session())
    assert.equal(activity.outcome, 'served')
    const entry = (fixture as any).status.notEstablished.find((e: any) => e.lineId === 'game::P6c')
    assert.deepEqual([entry.reason, entry.declared], ['not constrained', ['NON_CLAIMED']])

    // The neutral-players demonstration is untouched: its contracts author P6c (C43) and GF2’s NON_CLAIMED sits
    // beside that item exactly as its P6a declaration sits beside NEUTRAL-03.b — the line is entailed, not declared.
    const demonstration = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: session() })
    assert.equal(demonstration.activity.outcome, 'served')
    assert.equal((demonstration.fixture as any).game.performers.neutrals.affiliation.takesEffect, 'IMMEDIATE')
    assert.ok(!(demonstration.fixture as any).status.notEstablished.some((e: any) => e.lineId === 'game::P6c'), 'the timing is established there')
})

test('"switch immediately" is said where the game holds IMMEDIATE, and nowhere else', () => {
    for (const players of [12, 13]) {
        const served = buildActivityFromKnowledge(['GF2', 'tl-v0-constraint-neutral-player-condition'], session(players)).activity as ServedActivity
        const sentence = served.rendered.instructions.find(i => i.from.includes('performers.neutrals.affiliation.takesEffect'))
        assert.ok(sentence && /\bswitch(es)? immediately when possession changes\b/.test(sentence.text), `${players} players: ${sentence?.text}`)
        assert.equal(served.rendered.instructions.filter(i => /immediately/.test(i.text)).length, 1, 'said once')
    }
    // Without the ruling in the knowledge the game holds no timing: the word is not said, and that is reported.
    const without = buildActivityOverAlteredKnowledge({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: session() }, contracts => {
        const neutral = contracts.find(c => c.contractId === NEUTRAL)!
        neutral.items = neutral.items.filter((i: any) => i.itemId !== 'NEUTRAL-14.c')
    }) as ServedActivity
    assert.equal(without.outcome, 'served')
    assert.ok(!without.rendered.instructions.some(i => /immediately/.test(i.text)))
    assert.ok(without.rendered.coachingObservations.some(o => o.includes('It does not say the change is IMMEDIATE')))
})

console.log(`affiliation-timing.unit.ts — ${passed} passed`)
