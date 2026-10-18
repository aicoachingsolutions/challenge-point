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
import { resolveRelativeCounts } from '../derivation/reassignment'
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
/**
 * Re-pointed again 17 October 2026 (stage M1): without the roles' credit bounds too (row B8, his reply filed 19 October 2026, item 1
 * and item 3 C). The building role's bound is the build-out episode, whose beginnings only the context types, so with the possession
 * game alone GA-EPISODE-REACHABLE's fourth clause withholds on it (measured: NOT_EVALUABLE, refused at structure) - which is right,
 * and pinned in credit-episode.unit.ts; the allocation reads none of it.
 */
/**
 * Re-pointed again 17 October 2026 (stage M2): without the pressing role's regain score too (rows V27-V31, his reply filed 19 October
 * 2026, item 2). Its trigger is followed by a score, and the score transition is among the transitions taken out above, so with the
 * possession game alone GA-ONE-PRIMARY-EVENT's trigger clause fails on it (measured: refused at structure) - which is right, and
 * pinned in also-counts.unit.ts; the allocation reads none of it.
 */
const CREDIT_ROWS = ['B8', 'V27', 'V28', 'V29', 'V30', 'V31']
const allocationOnly = (realization: any) => void (realization.items = realization.items.filter((item: any) => !String(item.row).startsWith('T') && !SPATIAL_ROWS.includes(String(item.row)) && !CREDIT_ROWS.includes(String(item.row))))
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
    // Re-pointed 17 October 2026 (stage M4): his D6 two gain our DRAFT coachWords too, for his reply filed 19 October 2026, item 4 -
    // "The coach-facing suggestions should not imply those changes can occur without accounting for every player." His words stay
    // whole beside them (above). Adding a player uses his "reallocating someone or introducing an additional player"; removing one picks
    // no option he did not choose (his words for it were only "a practical adjustment to the roster").
    assert.deepEqual(adjustments.entries.map(e => e.coachWords ?? null), [
        'add a pressing player, representing an opponent committing additional numbers forward; with every player already in a team, reallocate someone or introduce an additional player',
        "remove a build-out player, deciding where that player goes so every player is still accounted for, reducing the building team's available support options",
        'move the marked line nearer to either end line',
        'change where the teams start when the pressure you see is not creating an appropriate challenge',
    ])
    // Neither picks a way of removing the player for him: no sitting out, no moving across.
    for (const word of ['rest', 'sit', 'across', 'bench']) assert.ok(!adjustments.entries[1].coachWords!.split(/\W+/).includes(word), word)
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
    // Re-pointed 17 October 2026 (stage M4): the outfield count is relative (register B7 version 2), his reply filed 19 October 2026,
    // item 3 F, beside his 18 October item 1 - quoted on the item.
    assert.deepEqual(['A01-R1-B7-1', 'A01-R1-B7-2'].map(id => byId.get(id)!.value), [1, { keepsCountOf: 'BUILDING' }])
    assert.equal(byId.get('A01-R1-B7-2')!.citedAs, 'his reply filed 18 October 2026, item 1; his reply filed 19 October 2026, item 3 F')
    assert.ok(String(byId.get('A01-R1-B7-2')!.basisEvidence).includes('only the goalkeeper changes teams at a role exchange. No additional outfield player transfer is required.'))
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

/**
 * Re-pointed 17 October 2026 (stage M4, design step L11). His reply filed 19 October 2026, item 5: "The second-goalkeeper case and
 * optional rotation can remain visible as limitations for now. I don't want to prescribe an outfield role for a goalkeeper
 * universally." The sentence counts and names no part for the second keeper (DRAFT); was "...; the other goalkeeper plays as an
 * outfield player". The allocation itself is unchanged (still never idled: counted among the other players).
 */
test('12 players, two keepers: the same allocation, the second keeper counted among the other players, no outfield role named', () => {
    const two = served(withRealization(12, 2).activity, '12 players, 2 goalkeepers')
    const players = two.rendered.instructions.filter(i => i.section === 'Players').map(i => i.text)
    assert.deepEqual(players, ['Divide 12 players into 2 teams: the building team has 1 goalkeeper and 6 other players; the pressing team has 5 other players'])
    assert.ok(!two.rendered.instructions.some(i => i.text.includes('plays as an outfield player') || i.text.includes('play as outfield players')))
    assert.equal(two.integrity.fidelityViolations, 0)
    // One keeper is said exactly as before.
    assert.ok(twelveServed.rendered.instructions.some(i => i.text === 'Divide 12 players into 2 teams: the building team has 6 outfield players and 1 goalkeeper; the pressing team has 5 outfield players'))
})

/**
 * Re-pointed 17 October 2026 (stage M4, design step L12). His reply filed 19 October 2026, item 3 F: "Yes. With 5 outfield players
 * plus a goalkeeper against 5 outfield players, only the goalkeeper changes teams at a role exchange. No additional outfield player
 * transfer is required." A01-R1-B7-2's count is relative (register B7 version 2, {keepsCountOf: BUILDING}), resolved at assembly from
 * each block's own teams: 6 - 5 = 1 at 12 players, 5 - 5 = 0 at 11, where no outfield reassignment is established. Was: refused at
 * the membership check, "Who changes team when the roles exchange has not been decided for 11 players".
 */
test('11 players: 5 + keeper against 5 in each block, only the keeper moves, every cross-block check passing', () => {
    const eleven = withRealization(11, 1)
    const activity = served(eleven.activity, '11 players')
    const blocks: any[] = (eleven.fixture as any).roleBlocks.blocks
    assert.deepEqual(blocks.map(b => teamsOf(b.fixture).map((t: any) => [t.outfield, t.keeper])), [
        [[5, 1], [5, 0]],
        [[5, 0], [5, 1]],
    ])
    for (const block of blocks) {
        assert.deepEqual(block.fixture.game.reassignments.map((r: any) => [r.elementId, r.performerRow, r.count]), [['c:provisional:A01-R1:A01-R1-B4-1', 'P3', 1]], 'no outfield reassignment is established')
        assert.deepEqual(block.fixture.record.relativeCounts, { resolved: [], removed: ['c:provisional:A01-R1:A01-R1-B4-2'], problems: [] })
        assert.ok(!block.fixture.status.derived.some((d: any) => String(d.path).includes('A01-R1-B4-2')), 'nothing owes the coach a sentence about it')
    }
    assert.deepEqual(activity.roleBlocks!.checks.map(c => [c.checkId, c.verdict]), ['RB-1', 'RB-2', 'RB-3', 'RB-4', 'RB-5', 'RB-6', 'RB-7', 'RB-8', 'RB-M'].map(id => [id, 'PASS']))
    const exchange = activity.rendered.instructions.filter(i => i.section === ROLE_EXCHANGE).map(i => i.text)
    assert.ok(exchange.includes('When you call the next block, 1 goalkeeper moves to the team that becomes the building team'), JSON.stringify(exchange))
    assert.ok(activity.rendered.instructions.some(i => i.text === 'Divide 11 players into 2 teams: the building team has 5 outfield players and 1 goalkeeper; the pressing team has 5 outfield players'))
    assert.equal(activity.integrity.fidelityViolations, 0)
    // 12 players is unchanged: the relative count resolves to his one outfield player.
    for (const block of twelveFixture.roleBlocks.blocks) {
        assert.deepEqual(block.fixture.game.reassignments.map((r: any) => [r.performerRow, r.count]), [['P3', 1], ['P2', 1]])
        assert.deepEqual(block.fixture.record.relativeCounts, { resolved: [{ elementId: 'c:provisional:A01-R1:A01-R1-B4-2', count: 1 }], removed: [], problems: [] })
    }
})

test('the relative count is read from one block and the membership check still compares the other (TEST-ONLY copies)', () => {
    // A second block whose composition was built differently still fails RB-M: the count states 0 at 11 players, and a copy of the
    // second block that moves an outfield player across is a change no reassignment states. RB-M is not relaxed.
    const eleven: any = withRealization(11, 1).fixture
    const contracts = (() => {
        const captured: LoadedContract[][] = []
        buildActivityFromKnowledge(['GF2'], sessionOf(11, 1), { alter: c => void (c.push(provisionalRealizationNamed('A01-R1') as any), captured.push(c)) })
        return captured[0]
    })()
    const built = () => eleven.roleBlocks.blocks.map((b: any) => ({ block: { blockId: b.blockId, holders: { ...b.holders } }, fixture: JSON.parse(JSON.stringify(b.fixture)), contracts: JSON.parse(JSON.stringify(contracts)) }))
    const verdict = (from: any[]) => checkRoleBlocks(from, index, roles).find(c => c.checkId === 'RB-M')!
    assert.equal(verdict(built()).verdict, 'PASS')
    const moved = built()
    moved[1].fixture.game.performers.teams[0].outfieldCount -= 1
    moved[1].fixture.game.performers.teams[1].outfieldCount += 1
    assert.equal(verdict(moved).verdict, 'FAIL', 'an outfield player moved where the relative count states none')
    // A count that cannot resolve is named and refuses the game: a role outside the vocabulary.
    const unknown = refused(withRealization(12, 1, r => r.items.forEach((i: any) => i.itemId === 'A01-R1-B7-2' && (i.value = { keepsCountOf: 'TEST-ONLY' }))).activity, 'TEST-ONLY unknown role')
    assert.equal(unknown.stage, 'validation')
    assert.ok(unknown.reasons.some(r => r.includes('cannot be resolved in this block') && r.includes('is not a role of the role vocabulary')), JSON.stringify(unknown.reasons))
    // The resolver itself, on copies of one block's game: read from that block alone; a negative difference is refused (never moved the
    // other way); at 0 the element goes; a game with no relative count is untouched.
    const block = twelveFixture.roleBlocks.blocks[0]
    const roleBlock = { blockId: block.blockId, holders: { ...block.holders } }
    const bindings = block.fixture.record.designationBindings
    const relativeCopy = (alter: (game: any) => void = () => undefined) => {
        const game = JSON.parse(JSON.stringify(block.fixture.game))
        game.reassignments.find((r: any) => r.performerRow === 'P2').count = { keepsCountOf: 'BUILDING' }
        alter(game)
        return game
    }
    const building = (game: any) => game.performers.teams.find((t: any) => t.goalkeeper === 1)
    const pressing = (game: any) => game.performers.teams.find((t: any) => t.goalkeeper === 0)
    const one = relativeCopy()
    assert.deepEqual(resolveRelativeCounts(one, index, roleBlock, bindings), { resolved: [{ elementId: 'c:provisional:A01-R1:A01-R1-B4-2', count: 1 }], removed: [], problems: [] })
    const even = relativeCopy(game => (building(game).outfieldCount = 5))
    assert.deepEqual(resolveRelativeCounts(even, index, roleBlock, bindings).removed, ['c:provisional:A01-R1:A01-R1-B4-2'])
    assert.deepEqual(even.reassignments.map((r: any) => r.performerRow), ['P3'])
    const negative = relativeCopy(game => (pressing(game).outfieldCount = 7))
    const refusedCount = resolveRelativeCounts(negative, index, roleBlock, bindings)
    assert.ok(refusedCount.problems.some(p => p.includes('would move performers away from the BUILDING role')), JSON.stringify(refusedCount))
    assert.deepEqual(negative.reassignments.find((r: any) => r.performerRow === 'P2').count, { keepsCountOf: 'BUILDING' }, 'left as it was, so RB-M refuses it too')
    assert.ok(resolveRelativeCounts(relativeCopy(), index, null, bindings).problems.some(p => p.includes('not one block of a role exchange')))
    const plain = JSON.parse(JSON.stringify(block.fixture.game))
    assert.deepEqual(resolveRelativeCounts(plain, index, roleBlock, bindings), { resolved: [], removed: [], problems: [] })
    assert.deepEqual(plain, block.fixture.game, 'a game with no relative count is untouched')
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
    // Re-pointed 17 October 2026 (stage M4): his D6 two say our DRAFT coachWords, accounting for every player (his reply filed 19 October
    // 2026, item 4), with his words cited beside them; his consequence's first sentence still follows the first.
    assert.deepEqual(said.map(i => [i.tier, i.status, i.text]), [
        ['adjust', 'COACH_CHOICE', 'You may choose to add a pressing player, representing an opponent committing additional numbers forward; with every player already in a team, reallocate someone or introduce an additional player: adding a pressing player can increase pressure but may also expose space behind the press'],
        ['adjust', 'COACH_CHOICE', "You may choose to remove a build-out player, deciding where that player goes so every player is still accounted for, reducing the building team's available support options"],
        ['adjust', 'COACH_CHOICE', 'You may choose to move the marked line nearer to either end line'],
        ['adjust', 'COACH_CHOICE', 'You may choose to change where the teams start when the pressure you see is not creating an appropriate challenge'],
    ])
    assert.deepEqual(said[0].from, ['adjustments[A01-ADJ-1].words', 'adjustments[A01-ADJ-1].coachWords', 'adjustments[A01-ADJ-1].consequence'], 'his words are cited beside ours')
    assert.deepEqual(said[1].from, ['adjustments[A01-ADJ-2].words', 'adjustments[A01-ADJ-2].coachWords'])
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
// 18 October 2026 (design step L14): communication -> SERVED. His reply filed 20 October 2026 approved the regain sentence (item 1,
// entry A01-W2) and gave his own eligibility sentence (item 2, entry A01-W3), so nothing stops it; the account below is the served one.
test('production A01: past its record (every entry carried) and served, with the allocation authority and both relationships in the account', () => {
    const activity = served(buildActivity({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(12, 1) }), 'production A01')
    assert.deepEqual(activity.rendered.withheld, [], 'no record entry, and nothing else, stops it')
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
