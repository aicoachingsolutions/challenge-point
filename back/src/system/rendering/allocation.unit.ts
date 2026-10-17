/**
 * Allocation by role, the deferral of the equal-numbers item (C56), and participant reassignment as its own capability —
 * stage K4, 15 October 2026.
 *
 * Christian, reply filed 17 October 2026, D6: *"For the initial 12-player demonstration, I favor six outfield players plus one
 * goalkeeper building out against five pressing players."* *"However, five outfield players plus a goalkeeper against five
 * pressing players is also a legitimate configuration when the roster supports it."* *"If the 6 + GK versus 5 configuration
 * requires a narrow exception to the possession game's equal-outfield-number rule, please document it as a knowledge-authorized
 * realization, preserving equal numbers as an alternative."* Reply filed 18 October 2026, item 1: *"When the teams exchange
 * building and pressing roles, the goalkeeper and one outfield player transfer to the newly designated building team."* and
 * *"role exchange and participant reassignment should remain separate capabilities. Exchanging roles should not inherently
 * require players to change teams. This particular realization uses both mechanisms to preserve its intended numerical
 * relationship."* Item 5: *"Goalkeeper Build-Out with Participant Composition."* Item 7: *"The 11–12-player support and 40 × 30
 * m prototype values are acceptable current testing boundaries, but they should not become permanent architectural
 * limitations."*
 *
 * The mechanism is proved on the possession game with the PRODUCTION provisional realization A01-R1 composed in (no context:
 * the context's build-out episode stops the real A01 at GA-EPISODE-REACHABLE until stage K5). Production A01 is pinned at its
 * record's gaps. TEST-ONLY copies are labelled.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/allocation.unit.ts
 */
import assert from 'node:assert/strict'

import { loadCorpusContracts, loadProvisionalRealizations, loadRegister, provisionalRealizationNamed, readJson, validateProvisionalRealizations } from '../derivation/corpus'
import { itemDeferralRefusal } from '../derivation/corpus-restatement'
import { applyRealizationDeferrals, namesParticularTeams } from '../derivation/realization-deferral'
import { indexRegister } from '../derivation/register'
import { DEFERS_TO_AUTHORIZED_REALIZATION, DEFERS_TO_ESTABLISHING_OBJECT, LoadedContract } from '../derivation/types'
import {
    allocationPrinciple,
    contextManipulationRelationships,
    learningGoalAuthorization,
    learningGoalAuthorizations,
    validateAllocationPrinciple,
    validateContextManipulationRelationships,
} from '../test-library/learning-goal-authorizations'
import record from '../test-library/library/learning-goal-authorizations.json'
import { buildActivity, buildActivityFromKnowledge, RefusedActivity, ServedActivity } from './build-activity'
import { checkFidelity } from './fidelity'
import { renderConcreteGame, ROLE_EXCHANGE } from './render-concrete-game'
import { checkRoleBlocks } from './role-blocks'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('allocation by role, C56 and participant reassignment (stage K4)')

const index = indexRegister(loadRegister())
const roles = index.roleBlocks!.roles
const sessionOf = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { goalkeeper: keepers } })
/** The production realization A01-R1, composed with the possession game (no context), optionally altered on a COPY. */
/**
 * **Re-pointed 15 October 2026 (stage K5): the allocation is proved on A01-R1 WITHOUT its transition items (TEST-ONLY copy).**
 * Stage K5 added the start, after-score, coach-conclusion and out-of-play transitions (rows T1-T7), which realize only with the
 * realization's own choices file and are not said to a coach until stage K7 (their rendering), so a game carrying them stops at
 * 'communication' — pinned in starts-and-restarts.unit.ts. What this file proves is the allocation, the deferral and the
 * reassignment, and none of them reads a transition: every other item of the production realization is composed as it stands.
 *
 * Re-pointed again 15 October 2026 (stage K6): without its spatial items too (the pressure reference, the targets' depths and
 * relations, the starting placements - rows S2, S5, S6, P8-P10b). They re-establish the placements at the build-out episode's
 * beginnings, which only the context types (with the possession game alone GA-EPISODE-REACHABLE withholds on them, measured),
 * and are pinned in target-placement.unit.ts; the allocation reads none of them.
 */
const SPATIAL_ROWS = ['S2', 'S5', 'S6', 'P8', 'P10', 'P10a', 'P10b']
const allocationOnly = (realization: any) => void (realization.items = realization.items.filter((item: any) => !String(item.row).startsWith('T') && !SPATIAL_ROWS.includes(String(item.row))))
const withRealization = (players: number, keepers: number, alter: (realization: any) => void = () => undefined) =>
    buildActivityFromKnowledge(['GF2'], sessionOf(players, keepers), {
        alter: contracts => {
            const realization: any = provisionalRealizationNamed('A01-R1')
            allocationOnly(realization)
            alter(realization)
            contracts.push(realization)
        },
    })
const served = (activity: ServedActivity | RefusedActivity, label: string): ServedActivity => {
    assert.equal(activity.outcome, 'served', `${label}: ${JSON.stringify((activity as RefusedActivity).reasons)}`)
    return activity as ServedActivity
}
const refused = (activity: ServedActivity | RefusedActivity, label: string): RefusedActivity => {
    assert.equal(activity.outcome, 'refused', `${label} must be refused`)
    return activity as RefusedActivity
}
const teamsOf = (fixture: any) => fixture.game.performers.teams.map((t: any) => ({ handle: t.elementId, outfield: t.outfieldCount, keeper: t.goalkeeper }))

const twelve = withRealization(12, 1)
const twelveServed = served(twelve.activity, '12 players, 1 goalkeeper')
const twelveFixture: any = twelve.fixture

test('register version 11: the reassignment rows, read as data, and a malformed block halts H1', () => {
    const register = loadRegister()
    const spec = index.reassignment!
    assert.deepEqual([spec.row, spec.toRoleRow, spec.performerRowRow, spec.countRow, spec.outfieldRow], ['B4', 'B5', 'B6', 'B7', 'P2'])
    assert.deepEqual([spec.toRoleLeaf, spec.performerRowLeaf, spec.countLeaf], ['toRole', 'performerRow', 'count'])
    assert.deepEqual(spec.performerRows, ['P2', ...index.specializedRoleRows.keys()], 'the outfield row and every specialized-role row of the teams row')
    // Re-pointed 15 October 2026 (stage K5): version 12 supersedes 11 and keeps its entry whole.
    assert.ok(String(register.version).includes('Supersedes version 11, which adds participant reassignment') && String(register.version).includes('role exchange and participant reassignment should remain separate capabilities'))
    const halts = (alter: (r: any) => void): string | null => {
        const copy = JSON.parse(JSON.stringify(register))
        alter(copy)
        try {
            indexRegister(copy)
            return null
        } catch (error: any) {
            return error?.halt ?? String(error)
        }
    }
    assert.equal(halts(() => undefined), null)
    assert.equal(halts(r => void (r.reassignment.outfieldRow = 'S3')), 'H1', 'the outfield row must be a field of the teams row')
    assert.equal(halts(r => void (r.reassignment.countRow = 'B3')), 'H1', 'the count must be a field of the reassignment row')
    assert.equal(halts(r => void delete r.roleBlocks), 'H1', 'a reassignment happens at an exchange of roles, so it needs role blocks')
    assert.equal(halts(r => void delete r.reassignment.outfieldNoun.plural), 'H1', 'the DRAFT outfield noun is given whole')
    const without = JSON.parse(JSON.stringify(register))
    delete without.reassignment
    assert.equal(indexRegister(without).reassignment, null, 'a register without the block has no reassignment')
})

test('the record: his allocation principle once, the relationship he confirmed, his two adjustments — each in his words', () => {
    const principle = allocationPrinciple()
    assert.equal(principle.category, 'GENERAL_PRINCIPLE')
    assert.ok(principle.words.includes(principle.principle), 'the rule sentence is one of his recorded sentences')
    assert.equal(principle.principle, 'The important principle is that player allocation should reflect representative numerical relationships, not default to equal outfield numbers regardless of the Learning Goal.')
    assert.ok(validateAllocationPrinciple({ ...principle, principle: 'TEST-ONLY: not his sentence' }).some(e => e.includes('allocation principle')))

    // Key identity: every field of the relationship as authored is what the loader hands out.
    assert.deepEqual(contextManipulationRelationships(), (record as any).contextManipulationRelationships)
    const [relationship] = contextManipulationRelationships()
    assert.equal(relationship.id, 'RPC-001~EM-0006')
    assert.equal(relationship.status, 'CONFIRMED')
    assert.deepEqual(relationship.rows, ['P2'])
    assert.ok(relationship.words.includes('Goalkeeper Build-Out with Participant Composition.'))
    assert.ok(relationship.manipulationStatus.startsWith('RC1 Candidate'), 'EM-0006 is an RC1 Candidate, never called canonical')

    const adjustments = learningGoalAuthorization('A01')!.authorizedAdjustments!
    assert.deepEqual(adjustments, (record as any).authorizations[0].authorizedAdjustments, 'key identity')
    // 2 -> 4 on 15 October 2026 (stage K7): his 18 October item 3 (the pressure reference adjustable in either direction) and his D4
    // (the starting arrangement adjustable) are recorded beside his two numerical adjustments so "Adjusting the activity" can say them,
    // under the Performer Configuration relationship he confirmed (18 October, item 5). His D6 two stay first and unchanged.
    assert.deepEqual(adjustments.entries.map(e => e.words), [
        'Add a pressing player, representing an opponent committing additional numbers forward.',
        "Remove a build-out player, reducing the building team's available support options.",
        'The pressure reference should be adjustable in either direction. Twenty meters is our initial hypothesis, not a canonical distance or a requirement for other field sizes.',
        'The coach should retain the ability to adjust the starting arrangement when the observed pressure is not creating an appropriate challenge.',
    ])
    assert.ok(adjustments.entries.every(e => e.category === 'PROVISIONAL_REALIZATION_CHOICE'))
    assert.deepEqual(adjustments.entries.map(e => e.relationship), [relationship.id, relationship.id, 'RPC-001~EM-0002', 'RPC-001~EM-0002'])
    // Our DRAFT coach wording only where his words are not themselves an action, and never in place of his words.
    assert.deepEqual(adjustments.entries.map(e => e.coachWords ?? null), [null, null, 'move the marked line nearer to either end line', 'change where the teams start when the pressure you see is not creating an appropriate challenge'])
})

test('the record gate refuses an uncited, mis-scoped or unconfirmed relationship and an adjustment naming none', () => {
    const records = learningGoalAuthorizations()
    const realizations = loadProvisionalRealizations()
    assert.deepEqual(validateContextManipulationRelationships(contextManipulationRelationships(), records, realizations), [])
    const cite = (id: string, row = 'P2') => realizations.map(r => ({ ...r, items: [...r.items, { itemId: 'A01-R1-TEST', row, authorizedBy: id } as any] }))
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), records, cite('TEST-ONLY')).some(e => e.includes('does not hold')))
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), records, cite('RPC-001~EM-0006', 'P5')).some(e => e.includes('does not authorize')))
    const elsewhere = contextManipulationRelationships().map(r => ({ ...r, contextId: 'TEST-ONLY' }))
    assert.ok(validateContextManipulationRelationships(elsewhere, records, realizations).some(e => e.includes('a relationship of TEST-ONLY')))
    const unconfirmedWords = contextManipulationRelationships().map(r => ({ ...r, words: [] }))
    assert.ok(validateContextManipulationRelationships(unconfirmedWords, records, realizations).some(e => e.includes('CONFIRMED and does not say')))
    const badAdjustment = records.map(r => (r.authorizedAdjustments ? { ...r, authorizedAdjustments: { ...r.authorizedAdjustments, entries: r.authorizedAdjustments.entries.map(e => ({ ...e, relationship: 'TEST-ONLY' })) } } : r))
    assert.ok(validateContextManipulationRelationships(contextManipulationRelationships(), badAdjustment, realizations).some(e => e.includes('names the relationship TEST-ONLY')))
})

test('the realization: his counts by role, one keeper for the building role, his 1(a) as a reassignment, his testing boundaries as data', () => {
    const realization = provisionalRealizationNamed('A01-R1')!
    const byId = new Map(realization.items.map(item => [item.itemId, item as any]))
    assert.equal(byId.get('A01-R1-P2-1')!.selector, 'team=ROLE_HOLDER_PRESSING')
    assert.equal(byId.get('A01-R1-P2-1')!.value, '5')
    assert.equal(byId.get('A01-R1-P2-2')!.selector, 'team=ROLE_HOLDER_BUILDING')
    assert.deepEqual(byId.get('A01-R1-P2-2')!.typedBound, { min: 5, max: 6 })
    assert.equal(byId.get('A01-R1-P3-1')!.selector, 'team=ROLE_HOLDER_BUILDING')
    for (const id of ['A01-R1-P2-1', 'A01-R1-P2-2']) assert.equal(byId.get(id)!.authorizedBy, 'RPC-001~EM-0006')
    assert.deepEqual(['A01-R1-B4-1', 'A01-R1-B4-2'].map(id => byId.get(id)!.selector), ['toRole=BUILDING AND performerRow=P3', 'toRole=BUILDING AND performerRow=P2'])
    assert.deepEqual(['A01-R1-B7-1', 'A01-R1-B7-2'].map(id => byId.get(id)!.value), [1, 1])
    for (const item of realization.items) {
        assert.equal(item.category, 'PROVISIONAL_REALIZATION_CHOICE')
        assert.equal(item.basis, 'OWNER_RULING')
    }
    // Key identity: the testing boundaries cross the loader whole, and a malformed one refuses the file.
    const raw = readJson('stage-b/provisional-realizations.json')
    assert.deepEqual(realization.testingBoundaries, raw.realizations[0].testingBoundaries)
    const damaged = JSON.parse(JSON.stringify(raw))
    damaged.realizations[0].testingBoundaries.players = ['eleven']
    assert.ok(validateProvisionalRealizations(damaged).some(e => e.includes('testingBoundaries.players')))
})

test('C56: exactly one item carries the new supersession; an item may carry no other; the deferral needs a confirmed citation of its row', () => {
    const corpus = loadCorpusContracts()
    const carrying = corpus.flatMap(c => c.items.filter(i => i.defersTo !== undefined).map(i => `${c.contractId}::${i.itemId}=${String(i.defersTo)}`))
    assert.deepEqual(carrying, [`restated:GF2::GF2-14.b=${DEFERS_TO_AUTHORIZED_REALIZATION}`])
    assert.equal(itemDeferralRefusal('X::Y', { item: 'X::Y', ruling: 'TEST-ONLY', set: { defersTo: DEFERS_TO_AUTHORIZED_REALIZATION }, why: '' }), null)
    assert.ok(itemDeferralRefusal('X::Y', { item: 'X::Y', ruling: 'TEST-ONLY', set: { defersTo: DEFERS_TO_ESTABLISHING_OBJECT }, why: '' })!.includes('not a supersession an item may carry'))
    assert.ok(itemDeferralRefusal('X::Y', { item: 'X::Y', ruling: 'TEST-ONLY', set: { defersTo: 'TEST-ONLY' }, why: '' })!.includes('not a supersession'))

    const gf2 = corpus.filter(c => c.contractId === 'restated:GF2')
    const realization = provisionalRealizationNamed('A01-R1')! as LoadedContract
    const relationships = contextManipulationRelationships()
    // Without a citing contribution nothing moves, object for object.
    const alone = applyRealizationDeferrals(gf2, relationships, index)
    assert.equal(alone.contracts[0], gf2[0])
    assert.deepEqual(alone.deferred, [])
    // With the realization, GF2-14.b moves aside on a copy and is kept as the alternative.
    const both = applyRealizationDeferrals([...gf2, realization], relationships, index)
    assert.notEqual(both.contracts[0], gf2[0])
    assert.ok(gf2[0].items.some(i => i.itemId === 'GF2-14.b'), 'the shared contract is never mutated')
    assert.ok(!both.contracts[0].items.some(i => i.itemId === 'GF2-14.b'))
    assert.deepEqual(both.contracts[0].deferredItems!.map(d => [d.item.itemId, d.defersTo, d.relationship, d.deferredTo.map(r => r.itemId)]), [['GF2-14.b', DEFERS_TO_AUTHORIZED_REALIZATION, 'RPC-001~EM-0006', ['A01-R1-P2-1', 'A01-R1-P2-2']]])
    // Each condition bites on its own (TEST-ONLY copies).
    const none = (contracts: LoadedContract[], rel = relationships) => assert.deepEqual(applyRealizationDeferrals(contracts, rel, index).deferred, [])
    none([...gf2, realization], relationships.map(r => ({ ...r, status: 'IDENTIFIED' as const })))
    none([...gf2, realization], relationships.map(r => ({ ...r, rows: ['P5'] })))
    none([...gf2, { ...realization, realizes: 'TEST-ONLY' } as LoadedContract])
    none([...gf2, { ...realization, items: realization.items.map(i => (i.row === 'P2' ? { ...i, selector: '*' } : i)) }])
    none([...gf2, { ...realization, items: realization.items.map(i => ({ ...i, authorizedBy: undefined })) }])
    assert.equal(namesParticularTeams({ itemId: 'T', row: 'P2', selector: 'team=EACH_TEAM' }, index), false, 'every team is not particular teams')
})

test('12 players, one keeper: 6 + keeper against 5 in both blocks, every cross-block check passing, GF2-14.b listed as the alternative', () => {
    const blocks: any[] = twelveFixture.roleBlocks.blocks
    const [x, y] = blocks.map(b => teamsOf(b.fixture))
    assert.deepEqual(x.map((t: any) => [t.outfield, t.keeper]), [[6, 1], [5, 0]])
    assert.deepEqual(y.map((t: any) => [t.outfield, t.keeper]), [[5, 0], [6, 1]], 'the role passes; the end does not, so the handle bound to it changes counts')
    for (const block of blocks) {
        const total = teamsOf(block.fixture).reduce((n: number, t: any) => n + t.outfield + t.keeper, 0)
        assert.equal(total, 12, 'the roster sums to the session players in every block')
    }
    for (const block of twelveServed.roleBlocks!.blocks) {
        assert.equal(block.integrity.postRealizationValidated, true)
        // GA-ROSTER-SUM per block, as the gate itself says it on each block's concrete game (not inferred from the total).
        assert.deepEqual(block.concreteChecks.filter(c => c.checkId === 'GA-ROSTER-SUM').map(c => c.verdict), ['PASS'], `block ${block.blockId}`)
        assert.ok(!block.concreteChecks.some(c => c.verdict === 'FAIL'), `block ${block.blockId}: ${JSON.stringify(block.concreteChecks)}`)
    }
    assert.deepEqual(twelveServed.roleBlocks!.checks.map(c => [c.checkId, c.verdict]), ['RB-1', 'RB-2', 'RB-3', 'RB-4', 'RB-5', 'RB-6', 'RB-7', 'RB-8', 'RB-M'].map(id => [id, 'PASS']))
    // The deferred item travels into each block's fixture as the alternative, with what it defers to.
    for (const block of blocks) {
        assert.deepEqual(block.fixture.alternatives.map((a: any) => [`${a.contractId}::${a.itemId}`, a.defersTo, a.relationship]), [['restated:GF2::GF2-14.b', DEFERS_TO_AUTHORIZED_REALIZATION, 'RPC-001~EM-0006']])
    }
    // Each entailed count names the items that decided it for that team (structural support, read by RB-4).
    const entailed = blocks[0].fixture.status.entailed
    assert.ok(entailed.filter((e: any) => e.leaf === 'outfieldCount').every((e: any) => e.supportedBy.map((r: any) => r.itemId).sort().join() === 'A01-R1-P2-1,A01-R1-P2-2'))
    assert.ok(entailed.filter((e: any) => e.leaf === 'goalkeeper').every((e: any) => e.supportedBy.map((r: any) => r.itemId).join() === 'A01-R1-P3-1'))
})

test('the coach reads the counts by role, who changes team at the exchange, and no handle', () => {
    const texts = twelveServed.rendered.instructions.map(i => i.text)
    assert.ok(texts.includes('Divide 12 players into 2 teams: the building team has 6 outfield players and 1 goalkeeper; the pressing team has 5 outfield players'))
    const exchange = twelveServed.rendered.instructions.filter(i => i.section === ROLE_EXCHANGE).map(i => i.text)
    assert.ok(exchange.includes('When you call the next block, 1 goalkeeper and 1 outfield player move to the team that becomes the building team'))
    assert.ok(!texts.some(t => t.includes('#') || t.includes('GF2-14.a')), 'no team handle reaches the coach')
    assert.equal(twelveServed.integrity.fidelityViolations, 0)
    for (const block of twelveFixture.roleBlocks.blocks) assert.deepEqual(checkFidelity(block.fixture, renderConcreteGame(block.fixture)).findings.filter(f => f.severity === 'VIOLATION'), [])
})

test('12 players, two keepers: the same allocation, and the other keeper plays outfield (never idled)', () => {
    const two = served(withRealization(12, 2).activity, '12 players, 2 goalkeepers')
    assert.ok(two.rendered.instructions.some(i => i.text === 'Divide 12 players into 2 teams: the building team has 6 outfield players and 1 goalkeeper; the pressing team has 5 outfield players; the other goalkeeper plays as an outfield player'))
})

test('11 players: 5 + keeper against 5 in each block, and refused at the membership check — his 1(a) was not decided for it', () => {
    const eleven = withRealization(11, 1)
    const activity = refused(eleven.activity, '11 players')
    assert.equal(activity.stage, 'validation')
    assert.equal(activity.summary, 'Who changes team when the roles exchange has not been decided for 11 players, so this activity is not being shown.')
    assert.ok(activity.reasons.every(r => r === 'the two role blocks do not agree as the exchange of each other' || r.startsWith('RB-M: ')))
    const blocks: any[] = (eleven.fixture as any).roleBlocks.blocks
    assert.deepEqual(teamsOf(blocks[0].fixture).map((t: any) => [t.outfield, t.keeper]), [[5, 1], [5, 0]])
})

/**
 * The coach is told only that the set-up has not been decided for the count. Corrected 15 October 2026 (stage K4, before
 * landing): the work in progress also told the coach "it has been decided for 11 and 12 players", and 11 is refused at the
 * membership check (above), so the counts the per-team counts fit stay in the technical reasons, beside the note that RB-M
 * is a separate check.
 */
test('any other count is refused as not decided; the counts the per-team counts admit — his testing boundaries — stay technical', () => {
    const boundaries = provisionalRealizationNamed('A01-R1')!.testingBoundaries!.players
    for (const players of [10, 13, 14, 24]) {
        const activity = refused(withRealization(players, 1).activity, `${players} players`)
        assert.equal(activity.stage, 'session')
        assert.equal(activity.summary, `The team set-up for this activity has not been decided for ${players} players.`)
        assert.ok(!activity.summary.includes('11'), 'no count is offered to the coach')
        assert.ok(activity.reasons.some(r => r.includes('(CONFIGURATION_DOES_NOT_FIT)') && r.includes(`the session player counts these per-team counts fit are ${boundaries.join(', ')} (`)), `${players}: ${JSON.stringify(activity.reasons)}`)
    }
})

test('no keeper available: refused for the session; without the citation nothing defers and the asymmetry is refused', () => {
    const none = refused(withRealization(12, 0).activity, 'no goalkeeper')
    assert.equal(none.stage, 'session')
    assert.equal(none.summary, 'This game needs 1 goalkeeper in all and the session has 0.')
    const uncited = refused(withRealization(12, 1, r => r.items.forEach((i: any) => delete i.authorizedBy)).activity, 'TEST-ONLY copy without the citation')
    assert.equal(uncited.stage, 'validation')
    assert.ok(uncited.reasons.some(r => r.includes('(NO_AUTHORIZED_ASYMMETRY)') && r.includes('restated:GF2::GF2-14.b is in force')))
})

test('the role exchange moves no player by itself: without the reassignment the membership check refuses; his 1(c) stays expressible', () => {
    const reassignmentIds = ['A01-R1-B4-1', 'A01-R1-B7-1', 'A01-R1-B4-2', 'A01-R1-B7-2']
    const noReassignment = refused(withRealization(12, 1, r => (r.items = r.items.filter((i: any) => !reassignmentIds.includes(i.itemId)))).activity, 'TEST-ONLY copy without reassignment')
    assert.ok(noReassignment.reasons.some(r => r.includes('no reassignment is recorded: an exchange of roles moves no player by itself')))

    // His Option 1(c) on a TEST-ONLY copy: counts kept by team (each end-assigned team its own), only the keeper reassigned.
    const optionC = withRealization(12, 1, r => {
        r.items = r.items.filter((i: any) => !['A01-R1-B4-2', 'A01-R1-B7-2'].includes(i.itemId))
        for (const item of r.items) {
            if (item.itemId === 'A01-R1-P2-1') Object.assign(item, { selector: 'team=TEAM_AT_AXIS_END', value: '5' })
            if (item.itemId === 'A01-R1-P2-2') Object.assign(item, { selector: 'team=TEAM_AT_AXIS_START', requirement: 'EQUALS', value: '6', typedBound: undefined })
        }
    })
    const c = served(optionC.activity, 'TEST-ONLY Option 1(c)')
    const blocks: any[] = (optionC.fixture as any).roleBlocks.blocks
    // Block X: the start-end team builds with 6 and the keeper; block Y: the keeper alone has moved, so 5 + keeper build against 6.
    assert.deepEqual(blocks.map(b => teamsOf(b.fixture).map((t: any) => [t.outfield, t.keeper])), [
        [[6, 1], [5, 0]],
        [[6, 0], [5, 1]],
    ])
    assert.ok(c.roleBlocks!.checks.every(check => check.verdict === 'PASS'))
})

test('RB-M refuses a change of membership no reassignment states, made on a copy', () => {
    // The contracts the blocks were derived from (captured from the same build, before the deferral sets GF2-14.b aside).
    const contracts = (() => {
        const captured: LoadedContract[][] = []
        buildActivityFromKnowledge(['GF2'], sessionOf(12, 1), { alter: c => void (c.push(provisionalRealizationNamed('A01-R1') as any), captured.push(c)) })
        return captured[0]
    })()
    const built = () => twelveFixture.roleBlocks.blocks.map((b: any) => ({ block: { blockId: b.blockId, holders: { ...b.holders } }, fixture: JSON.parse(JSON.stringify(b.fixture)), contracts: JSON.parse(JSON.stringify(contracts)) }))
    const verdict = (from: any[]) => checkRoleBlocks(from, index, roles).find(c => c.checkId === 'RB-M')!
    assert.equal(verdict(built()).verdict, 'PASS')
    const moved = built()
    moved[1].fixture.game.performers.teams[0].outfieldCount -= 1
    moved[1].fixture.game.performers.teams[1].outfieldCount += 1
    assert.equal(verdict(moved).verdict, 'FAIL', 'two players moved where the reassignment states one')
    const different = built()
    different[1].fixture.game.reassignments[0].count = 2
    assert.ok(verdict(different).problems.some(p => p.includes('different reassignments')))
})

test('a reassignment in a game not played in role blocks is refused, never built as though it were absent', () => {
    const activity = refused(
        buildActivityFromKnowledge(['GF2'], sessionOf(12, 0), {
            alter: contracts => {
                const realization: any = provisionalRealizationNamed('A01-R1')
                realization.items = realization.items.filter((i: any) => i.row === 'B4' || i.row === 'B7')
                contracts.push(realization)
            },
        }).activity,
        'TEST-ONLY reassignment without roles',
    )
    assert.equal(activity.stage, 'structure')
    assert.ok(activity.reasons[0].includes('not played in role blocks'))
})

test('the possession game alone is unchanged: equal numbers in force, nothing defers, no support recorded', () => {
    const plain = buildActivityFromKnowledge(['GF2'], sessionOf(12, 0))
    const one = served(plain.activity, 'GF2 alone')
    assert.deepEqual(teamsOf(plain.fixture).map((t: any) => [t.outfield, t.keeper]), [[6, 0], [6, 0]])
    assert.equal((plain.fixture as any).alternatives, undefined)
    assert.ok((plain.fixture as any).status.entailed.every((e: any) => e.supportedBy === undefined))
    assert.equal(one.account.allocation, undefined)
})

test('the adjustments are said only under "Adjusting the activity", in his words, as the coach\'s choice, with no challenge level', () => {
    const block = JSON.parse(JSON.stringify(twelveFixture.roleBlocks.blocks[0].fixture))
    const entries = learningGoalAuthorization('A01')!.authorizedAdjustments!.entries
    block.adjustments = { status: 'DRAFT', entries: entries.map(e => ({ id: e.id, words: e.words, consequence: e.consequence, citedAs: e.citedAs, ...(e.coachWords ? { coachWords: e.coachWords } : {}) })) }
    const rendered = renderConcreteGame(block)
    const said = rendered.instructions.filter(i => i.from.some(p => p.startsWith('adjustments[')))
    // 2 -> 4 on 15 October 2026 (stage K7): the pressure line either way and the starting arrangement (his item 3 and D4), each in our
    // DRAFT coach words with his words cited beside them (`coachWords`), still the coach's choice and still no challenge level.
    assert.deepEqual(said.map(i => [i.tier, i.status, i.text]), [
        ['adjust', 'COACH_CHOICE', 'You may choose to add a pressing player, representing an opponent committing additional numbers forward: adding a pressing player can increase pressure but may also expose space behind the press'],
        ['adjust', 'COACH_CHOICE', "You may choose to remove a build-out player, reducing the building team's available support options"],
        ['adjust', 'COACH_CHOICE', 'You may choose to move the marked line nearer to either end line'],
        ['adjust', 'COACH_CHOICE', 'You may choose to change where the teams start when the pressure you see is not creating an appropriate challenge'],
    ])
    assert.deepEqual(said[2].from, ['adjustments[A01-ADJ-3].words', 'adjustments[A01-ADJ-3].coachWords'], 'his words are cited beside ours')
    const text = rendered.instructions.map(i => i.text).join(' | ')
    for (const level of ['Comfortable', 'Stretch', 'Demanding']) assert.ok(!text.includes(level))
    assert.deepEqual(checkFidelity(block, rendered).findings.filter(f => f.severity === 'VIOLATION'), [])
})

// What moves these stops: K5 (M3/M4, the build-out start and the coach-judged conclusion, C58) and K6 (the starting
// arrangement and the targets' placement, RD-3). The allocation no longer stands among them (stage K4).
// 15 October 2026 (stage K5): six entries -> three. K5 carried the build-out start, the goalkeeper's part and the episodes and
// restarts (M3, M4, D1, D5); what remains is K6's (D3, D4/M5) and the stale asymmetric-structure entry the K4 review flagged.
// 15 October 2026 (stage K6): three entries -> none. K6 carried the starting arrangement and the targets' placement (his 18 October
// item 3, the Performer Configuration relationship) and moved the stale asymmetric-structure entry; production A01 passes its
// record and stops at validation (pinned in target-placement.unit.ts).
// 15 October 2026 (stage K7): validation -> communication. The context-scoring guard confirms an episode-scoped condition where the
// concrete game begins that episode (context-scoring-guard.ts `episodeConfirmed`), so A01 now stops only on the build-out condition's
// wording, which awaits his approval (pinned in activity-review.unit.ts).
test('production A01: past its record (every entry carried), with the allocation authority and both relationships in the account', () => {
    const activity = refused(buildActivity({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(12, 1) }), 'production A01')
    assert.equal(activity.stage, 'communication')
    assert.ok(!activity.reasons.some(r => r.includes('authorization record')), 'no record entry stops it')
    const allocation = activity.account.allocation!
    assert.equal(allocation.principle.principle, allocationPrinciple().principle)
    // Since stage K6 the Performer Configuration relationship he confirmed is cited too, by the starting placements.
    assert.deepEqual(allocation.relationships.map(r => [r.id, r.status]), [['RPC-001~EM-0006', 'CONFIRMED'], ['RPC-001~EM-0002', 'CONFIRMED']])
    assert.deepEqual(allocation.alternatives.map(a => `${a.contractId}::${a.itemId}`), ['restated:GF2::GF2-14.b'])
    // 2 -> 4 on 15 October 2026 (stage K7): the pressure line either way and the starting arrangement (his item 3 and D4).
    assert.equal(allocation.adjustments.length, 4)
    assert.deepEqual(allocation.testingBoundaries!.players, [11, 12])
    // The area his starting values were given for crosses into the account with the player counts (stage K6).
    assert.deepEqual(allocation.testingBoundaries!.areas, [{ lengthM: 40, widthM: 30 }])
})

console.log(`allocation.unit.ts — ${passed} passed`)
