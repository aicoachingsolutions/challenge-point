/**
 * Positions stated relative to another element or to a team, the separation of opposed targets, and start placements
 * re-established when an episode begins — stage K6, 15 October 2026 (his M7 and M5, and his starting values).
 *
 * Christian, reply filed 17 October 2026, M7: *"M7 — Target relative to pressure reference: Approved if required. The progression
 * target should be permitted at or before halfway when justified by the learning problem. Do not introduce a universal halfway
 * restriction."* D3: *"Please verify that the two targets can coexist without overlapping or contradictory scoring conditions."*
 * M5: *"Support a relationship-based starting arrangement that can be stated clearly to the coach and re-established at build-out
 * restarts. No universal starting distance or formation."* Reply filed 18 October 2026, item 3: *"Pressure reference: 20 m from the
 * building team's end line."* *"Building team's progression target: begins at the pressure reference."* *"Pressing team's
 * post-regain target area: 5 m deep at the building team's end."* *"Starting placement: building-team outfield players begin short
 * of the pressure/progression line."* *"Please retain the separation between the pressure reference and the progression target in
 * the knowledge representation, even when they occupy the same location in this realization."* *"The building team's initial
 * positioning requirement should not prevent players from advancing into useful positions as play develops."* Item 7: *"The
 * 11–12-player support and 40 × 30 m prototype values are acceptable current testing boundaries, but they should not become
 * permanent architectural limitations."*
 *
 * What is pinned here:
 *   1. register version 13 carries the capabilities as data (the narrowed longitudinal tests, RC-21's beyond made
 *      machine-readable, S5/P10 value forms, rows P10a/P10b with their applicability, the EM-0002 binding) and a damaged copy halts;
 *   2. A01 in BOTH role blocks, on production data: the pressure reference, the two targets and the two starting regions realize
 *      as his values say, mirrored between the blocks; every spatial gate passes; the pressure reference and the progression
 *      target are two elements with their own ids although they meet on one line;
 *   3. the starting placements are re-established at the transitions that begin a build-out episode and at no other;
 *   4. overlapping targets now FAIL (they passed every gate before), and a post-regain area deepened into the pressing team's start
 *      FAILS the relation that keeps it short of the pressure reference;
 *   5. nothing restricts where a group goes once play runs (the check bites on copies);
 *   6. the 40 x 30 m testing boundary lives in data: another area is refused with the not-decided sentence, a copy whose data
 *      lists another area admits it, and the universal code names no metre value;
 *   7. the composition rules of RC-21's beyond (anchor short of the referent, an unresolved team) refuse rather than default;
 *   8. the carried fields reach the concrete game and the rendering fixture (key identity).
 *
 * TEST-ONLY copies and items are labelled; production files are never written.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/realization/target-placement.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivity, buildActivityFromKnowledge, buildActivityOverAlteredKnowledge, buildActivityUnderAuthorizationRecords, RefusedActivity, testingAreaRefusal } from '../rendering/build-activity'
import { assembleRenderingFixture } from '../rendering/rendering-fixture'
import { checkRoleBlocks } from '../rendering/role-blocks'
import { specializedRoleNames } from '../rendering/session-envelope'
import { learningGoalAuthorizations, contextManipulationRelationships, validateContextManipulationRelationships } from '../test-library/learning-goal-authorizations'
import { loadProvisionalRealizations, loadRegister, provisionalRealizationNamed } from '../derivation/corpus'
import { runDerivation, runStages0to10, runStages0to5 } from '../derivation/engine'
import { applyRealizationDeferrals } from '../derivation/realization-deferral'
import { HaltError, indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { roleBlocksOf } from '../derivation/role-blocks'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { LoadedContract, RoleBlock } from '../derivation/types'
import { completeConcreteGame } from './assemble-concrete-game'
import { runPostRealizationGates } from './post-realization-gate'
import { checkRealization } from './realize'
import { realizeWithJustifiedDefaults } from './justified-defaults'
import { realizeSpatialRelation } from './spatial'
import { placementRestrictions } from './start-placement-freedom'
import { suppliedRealizationFor, SuppliedRealization } from './supplied-realization'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('positions relative to another element or a team, separated targets, re-established placements (stage K6)')

const register = loadRegister()
const index = indexRegister(register)
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (lengthM = 40, widthM = 30, players = 12, keepers = 1) => ({ players, lengthM, widthM, durationMin: 20, roles: { ...none, [KEEPER]: keepers } })
const R = 'provisional:A01-R1'
const item = (contracts: LoadedContract[], id: string) => contracts.find(c => c.contractId === R)!.items.find(i => i.itemId === id)! as any

/** A01's real selection, built through the same steps as the checked pathway, one complete game per role block. */
function a01Blocks(alter: (contracts: LoadedContract[]) => void = () => undefined, alterSupplied: (supplied: SuppliedRealization) => void = () => undefined) {
    const selection = selectFor('A01', null)
    const input: any = { ...derivationInputFor(selection), envelope: sessionOf() }
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    alter(input.contracts)
    input.contracts = applyRealizationDeferrals(input.contracts, contextManipulationRelationships(), index).contracts
    const base: any = runStages0to5(input)
    const found: any = roleBlocksOf(base.classes, base.derived.lines, index)
    assert.equal(found?.kind, 'BLOCKS')
    return (found.blocks as RoleBlock[]).map(block => {
        const blockInput = { ...input, roleBlock: block }
        const derived: any = runDerivation(blockInput)
        const staged: any = runStages0to10(blockInput)
        const resolved: any = assembleResolvedGame(derived, staged.classes, index, blockInput.contracts)
        const supplied: any = JSON.parse(JSON.stringify(suppliedRealizationFor(selection)))
        alterSupplied(supplied)
        const ctx = { ...staged.gateContext, contracts: blockInput.contracts }
        const { realization } = realizeWithJustifiedDefaults(resolved, supplied, index, blockInput.envelope, ctx)
        const realized: any = realization
        const entailed = realized.outcome === 'REALIZED' ? completeConcreteGame(ctx, realized) : []
        const acceptance = realized.outcome === 'REALIZED' ? checkRealization(resolved, realized) : null
        const post = realized.outcome === 'REALIZED' ? runPostRealizationGates(ctx, resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause })), realized) : null
        return { block, staged, resolved, realized, entailed, acceptance, post }
    })
}
const geometryOf = (realized: any, lineId: string) => realized.record.geometry.find((g: any) => g.lineId === lineId)?.geometry
const interval = (realized: any, lineId: string) => geometryOf(realized, lineId)?.interval
const preCheck = (staged: any, id: string) => staged.gates.gateA.checks.find((c: any) => c.checkId === id)
const postCheck = (post: any, id: string) => post.gateA.checks.find((c: any) => c.checkId === id)
const clause = (check: any, text: string) => check.clauses.find((c: any) => c.clause === text)
const PR_LINE = `c:${R}:A01-R1-S2-1::S5`
const NEAR = 'c:restated:GF2:GF2-03.e::S5'
const FAR = 'c:restated:GF2:GF2-03.f::S5'
const SEPARATED = "the opposed objectives' targets do not overlap along the axis"
const HOLDS = 'every relative position holds of the realized geometry'
const RESETS = 'every start placement re-established when an episode begins names an episode a transition begins'
const OWN_TARGET = 'no start placement lies inside the target its own group attacks'

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('register version 13 carries the capabilities as data, quoting him, and a damaged copy halts H1', () => {
    // Re-pointed 17 October 2026 (stage M1): version 14 (his reply filed 19 October 2026) supersedes 13 and keeps its entry whole.
    assert.ok(String(register.version).includes('Supersedes version 13, which adds positions stated relative to another element or to a team'))
    assert.ok(String(register.version).includes('Supersedes version 12'), 'the version history is kept')
    const s2 = register.rows.find((r: any) => r.id === 'S2')
    assert.ok(!s2.longitudinalValues.includes('end-near: touches the 0 end line and does not contain the midpoint'), 'the halfway wording is narrowed')
    assert.ok(s2.longitudinalValues.includes('end-near: touches the 0 end line and does not touch the L end line. end-far: touches the L end line and does not touch the 0 end line.'))
    assert.ok(s2.longitudinalValues.includes('Do not introduce a universal halfway restriction.'), 'his M7 words are quoted beside the change')
    for (const name of ['S2.longitudinalValues', 'S5.valueType', 'P10.valueType', 'P10a.timing']) assert.ok(String(index.vocabularyVersions[name] ?? '').includes('register version 13'), `${name} has a versions entry`)
    const beyond = (register.relativeTerms.machineReadable.terms as any)['beyond X (for team T)']
    assert.deepEqual([beyond.kind, beyond.relation], ['relative', 'beyond'])
    assert.ok(beyond.why.includes("the element's near edge is at or past X's far edge, in T's attacking direction"), 'the canonical RC-21 test, unchanged')
    assert.equal(register.relativeTerms['beyond X (for team T)'], "the element's near edge is at or past X's far edge, in T's attacking direction", 'the prose test is untouched')
    assert.deepEqual(index.vocabularies.get('P10a.timing'), ['INITIAL', 'CONDITIONAL_RESET'])
    assert.deepEqual(['P10a', 'P10b'].map(id => index.ownerRow.get(id)), ['P8', 'P8'])
    assert.deepEqual(index.applicability.get('P10b'), { row: 'P10a', sameElement: true, in: ['CONDITIONAL_RESET'] } as any)
    // The EM-0002 binding names objects the knowledge core holds.
    const em = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'knowledge-core', 'em-schema.v2.0-rc1.json'), 'utf8'))
    const bound = register.boundVocabularies.P8
    assert.ok(bound.owner.startsWith('knowledge core EM-0002 Performer Configuration'))
    assert.ok(em.engineeringDimensions.some((d: any) => d.DIM_ID === bound.dimension && d.KO_ID === 'EM-0002'))
    for (const parameter of bound.parameters) assert.ok(em.parameters.some((p: any) => p.PARAM_ID === parameter.split(' ')[0] && p.DIM_ID === bound.dimension), parameter)
    assert.equal(register.boundVocabularies['P10a.timing'].parameter, 'EMP-0013')
    // A damaged copy: the applicability names a row that does not exist.
    const damaged = JSON.parse(JSON.stringify(register))
    damaged.applicability.P10b.when.row = 'TEST-ONLY-NO-ROW'
    assert.throws(() => indexRegister(damaged), (e: unknown) => e instanceof HaltError && String((e as Error).message).includes('P10b'))
})

// ── 2. A01, both blocks, production data ────────────────────────────────────────────────────────────────
const blocks = a01Blocks()
test('A01 realizes in both role blocks: his values, mirrored, every spatial gate passing', () => {
    assert.equal(blocks.length, 2)
    const [x, y] = blocks
    assert.equal(x.block.blockId, 'BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END')
    for (const { realized, acceptance, post, block } of blocks) {
        assert.equal(realized.outcome, 'REALIZED', `${block.blockId}: ${JSON.stringify(realized.because)}`)
        assert.deepEqual(acceptance, { nothingClosedWithoutAuthority: [], nothingLost: [], nothingInvented: [] }, block.blockId)
        assert.equal(post.validated, true, `${block.blockId}: ${JSON.stringify(post.outstanding)}`)
        for (const id of ['GA-ENVELOPE-FIT', 'GA-LAYOUT-FEASIBLE', 'GA-DIRECTION', 'GA-RELATIVE-PLACEMENT', 'GA-REGION-FUNCTION', 'GA-REFERENCE-INTEGRITY', 'GA-EPISODE-REACHABLE']) {
            assert.equal(postCheck(post, id).verdict, 'PASS', `${block.blockId}: ${id} ${postCheck(post, id).why}`)
        }
        assert.equal(clause(postCheck(post, 'GA-DIRECTION'), SEPARATED).verdict, 'PASS')
        assert.equal(clause(postCheck(post, 'GA-RELATIVE-PLACEMENT'), HOLDS).instances, 4, 'the target, the post-regain relation and the two starting regions')
        // The pressure reference: 20 m from the building team's end line, in both blocks (40 m long, so the same line).
        assert.deepEqual(interval(realized, PR_LINE), { from: 20, to: 20 })
    }
    // Block X: the building team defends the 0 end. Its target begins at the pressure reference; the post-regain area is 5 m deep
    // at its end; it starts short of the line, the pressing team beyond it.
    assert.deepEqual(interval(x.realized, FAR), { from: 20, to: 40 })
    assert.deepEqual(interval(x.realized, NEAR), { from: 0, to: 5 })
    assert.deepEqual(interval(x.realized, `c:${R}:A01-R1-P8-1::P10`), { from: 0, to: 20 })
    assert.deepEqual(interval(x.realized, `c:${R}:A01-R1-P8-2::P10`), { from: 20, to: 40 })
    // Block Y: the roles exchanged, the ends fixed (his D2) - every role-keyed position is the mirror.
    assert.deepEqual(interval(y.realized, NEAR), { from: 0, to: 20 })
    assert.deepEqual(interval(y.realized, FAR), { from: 35, to: 40 })
    assert.deepEqual(interval(y.realized, `c:${R}:A01-R1-P8-1::P10`), { from: 20, to: 40 })
    assert.deepEqual(interval(y.realized, `c:${R}:A01-R1-P8-2::P10`), { from: 0, to: 20 })
    // Before realization nothing spatial is passed unexamined: the relation is owed, and names what it is relative to.
    // Third clause added 16 October 2026 (K6 review): no start placement lies inside the target its own group attacks - owed too.
    const pre = preCheck(x.staged, 'GA-RELATIVE-PLACEMENT')
    assert.deepEqual(pre.clauses.map((c: any) => c.verdict), ['PASS', 'DEFERRED_TO_REALIZATION', 'DEFERRED_TO_REALIZATION'])
    for (const { post, block } of blocks) assert.deepEqual(clause(postCheck(post, 'GA-RELATIVE-PLACEMENT'), OWN_TARGET), { clause: OWN_TARGET, verdict: 'PASS', basis: 'EVALUATED', instances: 2 }, block.blockId)
    assert.ok(x.resolved.coherence.postRealizationRequired.some((o: any) => o.checkId === 'GA-RELATIVE-PLACEMENT' && o.clause === HOLDS), 'owed to the post-realization gate')
})

test('the pressure reference and the progression target are two elements with their own ids, meeting on one line', () => {
    for (const { realized, block } of blocks) {
        const target = block.holders.BUILDING === 'TEAM_AT_AXIS_START' ? FAR : NEAR
        const composed = geometryOf(realized, target)
        assert.notEqual(PR_LINE.split('::')[0], target.split('::')[0], 'different element ids')
        assert.deepEqual(composed.relation.of, { contractId: R, itemId: 'A01-R1-S2-1' }, 'the target is placed relative to the reference, by reference')
        const edge = composed.relation.direction > 0 ? composed.interval.from : composed.interval.to
        assert.equal(edge, 20, `${block.blockId}: the target begins at the pressure reference`)
        const regions = realized.game.space.regions.map((r: any) => r.elementId)
        assert.ok(regions.includes(`c:${R}:A01-R1-S2-1`) && regions.includes(target.split('::')[0]))
        assert.equal(realized.game.space.regions.find((r: any) => r.elementId === `c:${R}:A01-R1-S2-1`).noun, 'line')
    }
})

// ── 3. Re-established at build-out beginnings only ─────────────────────────────────────────────────────
test('the starting placements are re-established at the start, after a score and at the coach-judged conclusion, and nowhere else', () => {
    for (const { staged, post, block } of blocks) {
        for (const check of [preCheck(staged, 'GA-EPISODE-REACHABLE'), postCheck(post, 'GA-EPISODE-REACHABLE')]) {
            assert.deepEqual(clause(check, RESETS), { clause: RESETS, verdict: 'PASS', basis: 'EVALUATED', instances: 2 }, block.blockId)
            const starters = ['A01-R1-T1-1', 'A01-R1-T1-2', 'A01-R1-T1-3'].map(id => `c:${R}:${id}`).join(', ')
            assert.ok(check.why.includes(`c:${R}:A01-R1-P8-1 at ${starters}`) && check.why.includes(`c:${R}:A01-R1-P8-2 at ${starters}`), check.why)
            // Re-pointed 17 October 2026 (stage M1): the reason now continues with the credit clauses (GA-EPISODE-REACHABLE clauses 4
            // and 5), which name every transition that ends or keeps the building role's credit; the placements' part is read up to them.
            const resets = check.why.split('re-established when an episode begins')[1].split('; credit confined to an episode')[0]
            assert.ok(check.why.includes('; credit confined to an episode'), 'the credit clauses say their part after it')
            for (const never of ['A01-R1-T1-4', 'A01-R1-T1-5', 'A01-R1-T1-6', 'A01-R1-T1-7', 'GF2-07.a']) assert.ok(!resets.includes(never), `${never} re-establishes nothing`)
        }
    }
    // The clause bites: a copy whose placements name an episode no transition begins is refused at structure.
    const [orphan] = a01Blocks(contracts => void (item(contracts, 'A01-R1-P10b-1').value = 'PER_TEAM'))
    assert.equal(clause(preCheck(orphan.staged, 'GA-EPISODE-REACHABLE'), RESETS).verdict, 'NOT_EVALUABLE', 'TEST-ONLY: an episode with no typed begin condition')
})

// ── 4. Overlap now fails ────────────────────────────────────────────────────────────────────────────────
test('overlapping targets FAIL (they passed every gate until this clause), and a post-regain area deepened past the reference fails its relation', () => {
    // The possession game alone, both targets zones with TEST-ONLY depths that overlap: [0,24] and [16,40], the design
    // verification's measured case.
    const depth = (itemId: string, end: string) => ({ itemId, row: 'S5', selector: `functions CONTAINS objective-area & longitudinal=${end}`, requirement: 'RANGE', value: 'TEST-ONLY depth', typedBound: { min: 24, max: 24 }, strictness: 'REQUIRED', valueStatus: 'REQUIRED_RANGE', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', basisEvidence: 'TEST-ONLY', checkability: 'STRUCTURAL', structuralClause: 'whole item' })
    const asZones = (supplied: SuppliedRealization) => {
        for (const choice of supplied.choices as any[]) {
            if (String(choice.lineId).endsWith('::S3')) choice.value = 'zone'
            if (choice.lineId === 'game::V1') choice.value = 'target_zone_entered'
        }
    }
    const overlapping = buildActivityFromKnowledge(['GF2'], sessionOf(40, 30, 12, 0), { alter: contracts => void (contracts.find(c => c.contractId === 'restated:GF2') as any).items.push(depth('TEST-ONLY-NEAR', 'end-near'), depth('TEST-ONLY-FAR', 'end-far')), alterSupplied: asZones }).activity as RefusedActivity
    assert.equal(overlapping.outcome, 'refused')
    assert.equal(overlapping.stage, 'validation')
    assert.ok(overlapping.reasons.some(r => r.startsWith(`GA-DIRECTION — "${SEPARATED}": FAIL`)), JSON.stringify(overlapping.reasons))
    // The production possession game (two lines at the two end lines) is separated, and served as before.
    assert.equal(buildActivityFromKnowledge(['GF2'], sessionOf(40, 30, 12, 0)).activity.outcome, 'served')

    // A01 with the post-regain area deepened to 25 m (TEST-ONLY): it now overlaps the building team's target and the pressing
    // team's start - both the separation clause and the relation that keeps the area short of the pressure reference fail.
    for (const { post, block } of a01Blocks(contracts => void (item(contracts, 'A01-R1-S5-3').typedBound = { min: 25, max: 25 }))) {
        assert.equal(post.validated, false, block.blockId)
        assert.equal(clause(postCheck(post, 'GA-DIRECTION'), SEPARATED).verdict, 'FAIL')
        assert.equal(clause(postCheck(post, 'GA-RELATIVE-PLACEMENT'), HOLDS).verdict, 'FAIL')
        assert.ok(postCheck(post, 'GA-RELATIVE-PLACEMENT').why.includes('in the attacking direction of ROLE_HOLDER_PRESSING'), postCheck(post, 'GA-RELATIVE-PLACEMENT').why)
    }
    /**
     * **A group that begins inside the target it attacks FAILS** — K6 review, 16 October 2026. The design asked for it ("a pressing
     * start overlapping its own target fails GA-RELATIVE-PLACEMENT") and K6 did not build it: measured at 723eee2, both TEST-ONLY
     * copies below passed every gate in both blocks (his D3, "The target should be positioned so that regaining possession does
     * not automatically constitute successful progression."; his 18 October item 3, "Starting placement: building-team outfield
     * players begin short of the pressure/progression line."). The production layout touches only on the line (asserted PASS above).
     */
    for (const [label, id, forTeam, group] of [
        ['the pressing team starts on the building side of the line, around the post-regain area it attacks', 'A01-R1-P10-2', 'ROLE_HOLDER_PRESSING', 'A01-R1-P8-2'],
        ['the building team starts beyond the line, inside its own target', 'A01-R1-P10-1', 'ROLE_HOLDER_BUILDING', 'A01-R1-P8-1'],
    ]) {
        for (const { post, block } of a01Blocks(contracts => void (item(contracts, id).value.forTeam = forTeam))) {
            assert.equal(post.validated, false, `TEST-ONLY ${label}: ${block.blockId}`)
            assert.equal(clause(postCheck(post, 'GA-RELATIVE-PLACEMENT'), OWN_TARGET).verdict, 'FAIL', label)
            assert.ok(postCheck(post, 'GA-RELATIVE-PLACEMENT').why.includes(`c:${R}:${group} (`), postCheck(post, 'GA-RELATIVE-PLACEMENT').why)
            assert.equal(clause(postCheck(post, 'GA-RELATIVE-PLACEMENT'), HOLDS).verdict, 'PASS', 'the relations themselves still hold: only the new clause catches it')
            assert.equal(clause(postCheck(post, 'GA-DIRECTION'), SEPARATED).verdict, 'PASS', 'and the targets are still apart')
        }
    }
    // A relation naming an element the game does not hold is a FAIL at structure, never a deferral.
    const [dangling] = a01Blocks(contracts => void (item(contracts, 'A01-R1-S5-2').value.of.structuralRef.itemId = 'TEST-ONLY-NO-SUCH-ITEM'))
    assert.equal(clause(preCheck(dangling.staged, 'GA-RELATIVE-PLACEMENT'), 'every relative position names a held element and a registered team designation').verdict, 'FAIL')
    // And a team that holds no end (a possession-relative designation) cannot carry a relation.
    const [moving] = a01Blocks(contracts => void (item(contracts, 'A01-R1-S5-2').value.forTeam = 'ATTACKING_TEAM'))
    assert.equal(preCheck(moving.staged, 'GA-RELATIVE-PLACEMENT').verdict, 'FAIL')
})

// ── 5. Nothing restricts a group once play runs ─────────────────────────────────────────────────────────
test('no access region, access consequence, action restriction or condition on the reference restricts a group after the start', () => {
    for (const { realized, block } of blocks) {
        assert.deepEqual(placementRestrictions(realized.game, index), [], block.blockId)
        assert.deepEqual(realized.game.performers.startPlacement.map((p: any) => p.timing), ['CONDITIONAL_RESET', 'CONDITIONAL_RESET'], 'both timed: a start, re-established, never standing')
    }
    // The check bites on copies of the realized game (TEST-ONLY mutations, one per kind).
    const copy = () => JSON.parse(JSON.stringify(blocks[0].realized.game))
    const untimed = copy()
    delete untimed.performers.startPlacement[0].timing
    assert.deepEqual(placementRestrictions(untimed, index).map(r => r.kind), ['UNTIMED_PLACEMENT'])
    const walled = copy()
    walled.space.regions[0].functions = ['access']
    assert.deepEqual(placementRestrictions(walled, index).map(r => r.kind), ['ACCESS_REGION'])
    const consequence = copy()
    consequence.value.consequences = [{ elementId: 'TEST-ONLY', effect: 'ACCESS' }]
    assert.deepEqual(placementRestrictions(consequence, index).map(r => r.kind), ['ACCESS_CONSEQUENCE'])
    const eligibility = copy()
    eligibility.rules = { actionRestrictions: [{ elementId: 'TEST-ONLY', kind: 'receiver_eligibility' }] }
    assert.deepEqual(placementRestrictions(eligibility, index).map(r => r.kind), ['ACTION_RESTRICTION'])
    const judged = copy()
    judged.value.primaryEvent.conditions[0].referents = [{ structuralRef: { contractId: R, itemId: 'A01-R1-S2-1' } }]
    assert.deepEqual(placementRestrictions(judged, index).map(r => r.kind), ['REFERENCE_IN_A_CONDITION'])
})

// ── 6. The testing boundary is data ─────────────────────────────────────────────────────────────────────
test('the 40 x 30 m testing boundary lives in data: another area is told the starting positions are not decided for it', () => {
    const realization = provisionalRealizationNamed('A01-R1')!
    assert.deepEqual(realization.testingBoundaries?.areas, [{ lengthM: 40, widthM: 30 }])
    for (const [lengthM, widthM] of [[50, 35], [30, 40], [40, 25]]) {
        const refused = buildActivity({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(lengthM, widthM) }) as RefusedActivity
        assert.equal(refused.stage, 'session', `${lengthM} x ${widthM}`)
        assert.equal(refused.summary, `The starting positions for this activity have not been decided for a ${lengthM} x ${widthM} m area.`)
        assert.deepEqual(refused.reasons, [`the provisional realization A01-R1 gives its starting values for 40 x 30 m only (its testing boundaries, his reply filed 18 October 2026, item 7): ${lengthM} x ${widthM} m is not one of them`])
    }
    assert.equal(testingAreaRefusal(realization, sessionOf(40, 30)), null)
    assert.notEqual((buildActivity({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }) as RefusedActivity).stage, 'session', 'the recorded area is not refused by it')
    // A TEST-ONLY copy whose data lists another area admits that area: the limit is the data's, not the code's.
    const elsewhere = buildActivityOverAlteredKnowledge({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(50, 35) }, contracts => void ((contracts.find(c => c.contractId === R) as any).testingBoundaries.areas = [{ lengthM: 50, widthM: 35 }])) as RefusedActivity
    assert.notEqual(elsewhere.stage, 'session', JSON.stringify(elsewhere.reasons))
    // The universal code names no metre value of his: the four numbers live in the realization's items and boundary.
    for (const file of ['spatial.ts', 'team-ends.ts', 'start-placement-freedom.ts', 'realize.ts', '../derivation/gates.ts']) {
        const code = fs.readFileSync(path.join(__dirname, file), 'utf8')
        for (const metres of ['20 m', '5 m', '40 x 30', '40 × 30']) assert.ok(!code.split('\n').filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('//')).some(line => line.includes(metres)), `${file} writes ${metres} in code`)
    }
    const metric = loadProvisionalRealizations().flatMap(r => r.items.filter((i: any) => i.typedBound && String(i.row).startsWith('S') || (i as any).value?.offsetM).map(i => [r.provisionalId, i.itemId, !!r.testingBoundaries?.areas]))
    assert.deepEqual(metric, [['A01-R1', 'A01-R1-S5-1', true], ['A01-R1', 'A01-R1-S5-3', true]], 'every metric starting value sits in a realization whose testing boundaries name its area')
})

// ── 7. RC-21's beyond refuses rather than defaults ──────────────────────────────────────────────────────
test('a relative position composes only where its referent and its team are established, and only from the far side', () => {
    const ctx = (attacks: 0 | 1 | null, referent: { from: number; to: number } | null) => ({
        envelope: { lengthM: 40, widthM: 30 },
        axis: 'along' as const,
        teamAttackingEnd: () => attacks,
        referentInterval: () => referent,
    })
    const value = { term: 'beyond X (for team T)', of: { structuralRef: { contractId: 'TEST-ONLY', itemId: 'X' } }, forTeam: 'ROLE_HOLDER_BUILDING' }
    assert.deepEqual(realizeSpatialRelation(value, index, ctx(1, { from: 13, to: 13 }))?.interval, { from: 13, to: 40 }, 'TEST-ONLY 13 m: a target that begins before halfway realizes (his M7)')
    assert.deepEqual(realizeSpatialRelation(value, index, ctx(0, { from: 13, to: 13 }))?.interval, { from: 0, to: 13 })
    assert.equal(realizeSpatialRelation(value, index, ctx(null, { from: 13, to: 13 }))?.extentUnresolved, true, 'no team end: not placed')
    assert.equal(realizeSpatialRelation(value, index, ctx(1, null))?.extentUnresolved, true, 'no referent: not placed')
    // An anchored element on the near side of its referent cannot reach beyond it: unresolved, never flipped.
    const anchored = realizeSpatialRelation('attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior', index, {
        ...ctx(1, { from: 30, to: 30 }),
        longitudinal: 'end-near',
        relativeBound: { term: 'beyond X (for team T)', relation: 'beyond', of: { contractId: 'TEST-ONLY', itemId: 'X' }, forTeam: 'ROLE_HOLDER_BUILDING' },
    })
    assert.equal(anchored?.extentUnresolved, true, JSON.stringify(anchored))
    // A distance from a team's end line is measured from the end that team defends.
    const fromEnd = { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 13, to: 13 } }
    assert.deepEqual(realizeSpatialRelation(fromEnd, index, ctx(1, null))?.interval, { from: 13, to: 13 })
    assert.deepEqual(realizeSpatialRelation(fromEnd, index, ctx(0, null))?.interval, { from: 27, to: 27 })
})

// ── 8. Key identity ─────────────────────────────────────────────────────────────────────────────────────
test('the placements, their timing and their composed geometry reach the concrete game and the rendering fixture', () => {
    for (const { resolved, realized, entailed, acceptance, post, block } of blocks) {
        const fixture: any = assembleRenderingFixture({ resolved, realized, entailed, envelope: sessionOf(), accepted: Object.values(acceptance!).every((e: any) => !e.length), postRealizationValidated: post!.validated })
        const placements = fixture.game.performers.startPlacement
        assert.deepEqual(placements.map((p: any) => [p.elementId, p.group, p.timing, p.resetsAt, p.region.of.structuralRef.itemId, p.region.forTeam]), [
            [`c:${R}:A01-R1-P8-1`, 'ROLE_HOLDER_BUILDING', 'CONDITIONAL_RESET', 'BUILD_OUT_EPISODE', 'A01-R1-S2-1', 'ROLE_HOLDER_PRESSING'],
            [`c:${R}:A01-R1-P8-2`, 'ROLE_HOLDER_PRESSING', 'CONDITIONAL_RESET', 'BUILD_OUT_EPISODE', 'A01-R1-S2-1', 'ROLE_HOLDER_BUILDING'],
        ], block.blockId)
        for (const placement of placements) assert.deepEqual(placement.realizedGeometry.region.interval, interval(realized, `${placement.elementId}::P10`))
        const target = fixture.game.space.regions.find((r: any) => r.realizedGeometry?.position?.along?.relation)
        assert.ok(target, 'the composed target carries its relation into the fixture')
        assert.deepEqual(target.realizedGeometry.position.along.relation.of, { contractId: R, itemId: 'A01-R1-S2-1' })
        // Every A01-R1 spatial item is his provisional choice on its support entry.
        assert.ok(placements.every((p: any) => p.elementId.startsWith(`c:${R}:`)))
    }
    // The two blocks against each other (RB-1..RB-8, RB-M), on the fixtures each block assembles: the ends identical, the roles
    // exchanged, every role-keyed position - the pressure reference, both targets, both starting regions - the mirror (RB-8).
    const built = blocks.map(({ block, resolved, realized, entailed, acceptance, post, staged }) => ({
        block,
        contracts: staged.gateContext.contracts,
        fixture: assembleRenderingFixture({ resolved, realized, entailed, envelope: sessionOf(), accepted: Object.values(acceptance!).every((e: any) => !e.length), postRealizationValidated: post!.validated }),
    }))
    const checks = checkRoleBlocks(built, index, ['BUILDING', 'PRESSING'])
    assert.deepEqual(checks.filter(c => c.verdict !== 'PASS').map(c => [c.checkId, c.problems]), [], 'every cross-block check passes')
    assert.ok(checks.some(c => c.checkId === 'RB-8'))
    // RB-8 bites (TEST-ONLY copies at 13 m, so the line is not the axis's own mirror): measured from the building team's end the
    // whole layout mirrors; measured from one FIXED end, the role-keyed targets placed beyond it do not.
    const rbOn = (alter: (contracts: LoadedContract[]) => void) => {
        const copies = a01Blocks(alter)
        return checkRoleBlocks(
            copies.map(({ block, resolved, realized, entailed, acceptance, post, staged }) => ({ block, contracts: staged.gateContext.contracts, fixture: assembleRenderingFixture({ resolved, realized, entailed, envelope: sessionOf(), accepted: Object.values(acceptance!).every((e: any) => !e.length), postRealizationValidated: post!.validated }) })),
            index,
            ['BUILDING', 'PRESSING'],
        )
    }
    const byRole = rbOn(contracts => void (item(contracts, 'A01-R1-S5-1').value.offsetM = { from: 13, to: 13 }))
    assert.deepEqual(byRole.filter(c => c.verdict !== 'PASS').map(c => c.checkId), [], 'TEST-ONLY 13 m from the building team\'s end: mirrored')
    const fixedEnd = rbOn(contracts => void (item(contracts, 'A01-R1-S5-1').value = { term: 'own end (of team T)', forTeam: 'TEAM_AT_AXIS_START', offsetM: { from: 13, to: 13 } }))
    const rb8 = fixedEnd.find(c => c.checkId === 'RB-8')!
    assert.equal(rb8.verdict, 'FAIL', 'TEST-ONLY 13 m from a fixed end: the targets placed beyond it are not each other\'s mirror')
    assert.ok(rb8.problems.some(p => p.includes('which is not its mirror')), JSON.stringify(rb8.problems))
    // The relationship he confirmed is cited by every placement item and validated by the record's loader.
    const cited = loadProvisionalRealizations()[0].items.filter((i: any) => i.authorizedBy === 'RPC-001~EM-0002').map(i => i.itemId)
    assert.deepEqual(cited, ['A01-R1-P8-1', 'A01-R1-P10-1', 'A01-R1-P8-2', 'A01-R1-P10-2', 'A01-R1-P10a-1', 'A01-R1-P10b-1'])
    const relationships = contextManipulationRelationships()
    const copy = JSON.parse(JSON.stringify(relationships)).filter((r: any) => r.id !== 'RPC-001~EM-0002')
    assert.ok(validateContextManipulationRelationships(copy, learningGoalAuthorizations()).some(e => e.includes('RPC-001~EM-0002')), 'TEST-ONLY: without the relationship the citations fail to load')
    assert.equal(relationships.find(r => r.id === 'RPC-001~EM-0002')?.status, 'CONFIRMED')
})

// ── 9. Production A01 passes the record and the spatial stages; what stops it now ──────────────────────
test('production A01 passes validation in both blocks (stage K7); what stops it is the build-out condition awaiting approved wording', () => {
    /**
     * What moves this stop (named in the K6 review, 16 October 2026; the pin said only what stops it). The guard
     * (context-scoring-guard.ts) confirms a context condition by its presence in the realized game, so a condition authored for
     * the build-out episode only (SD-36; his 16 October 9.3, "Build-out condition applies only to build-out episodes: Approved.";
     * ruling C52) is refused as unconfirmable rather than passed on every score. The scope is approved and the episode's
     * beginnings are now typed and reached (C58, GA-EPISODE-REACHABLE PASS in both blocks), so no decision of his stands behind
     * it: it moves when the guard can confirm an episode-scoped condition against the episode the game carries - an engineering
     * capability no stage has been assigned yet, for the lead to place (K7 carries the communication half of scoped conditions).
     *
     * **Moved 15 October 2026 (stage K7), the work succeeding: validation -> communication.** K7 built that capability, because
     * without it the communication it was given could not be measured on production at all: the guard confirms an episode-scoped
     * condition carried with its authored scope where the Gate A check deciding that episode passes as rerun on the concrete game
     * (context-scoring-guard.ts `episodeConfirmed`; pinned there in condition-scope.unit.ts, including what never confirms). Both
     * blocks now pass validation and the cross-block checks, and stop at communication on the four build-out conditions alone,
     * which wait on his approved wording: each field withheld (type, referents, value where held, scope) and fidelity's Q3 note of
     * each as uncarried. Every other part of the activity is said (DRAFT).
     */
    const refused = buildActivity({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }) as RefusedActivity
    assert.equal(refused.stage, 'communication', JSON.stringify(refused.reasons))
    const blocksNamed = ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START']
    const fields: [string, string[]][] = [['18.a', ['type', 'referents', 'scope']], ['18.c', ['type', 'referents', 'value', 'scope']], ['18.f', ['type', 'referents', 'value', 'scope']], ['19.a', ['type', 'referents', 'value', 'scope']]]
    const ROW: Record<string, string> = { type: 'V4', referents: 'V5', value: 'V6', scope: 'V3' }
    // Moved 17 October 2026 (stage M1): the roles' credit bounds join the same stop (row B8, his reply filed 19 October 2026, item 1
    // and item 3 C) - the building role's withheld until approved words say it, both noted by fidelity as uncarried (the pressing
    // role's WHOLE_GAME is cited by no sentence until design step L9). Nothing spatial moves.
    const bound = (element: string) => `activityRoles[c:provisional:A01-R1:A01-R1-${element}].creditedWithin`
    assert.deepEqual(
        refused.reasons,
        blocksNamed.flatMap(block => [
            `block ${block}: awaiting approved wording: ${bound('B1-1')} (B8)`,
            ...fields.flatMap(([id, held]) => held.map(field => `block ${block}: awaiting approved wording: value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-${id}].${field} (${ROW[field]})`)),
            ...['B1-1', 'B1-2'].map(element => `block ${block}: fidelity Q3: ${bound(element)} is established by the game and no instruction carries it`),
            ...fields.flatMap(([id, held]) => held.filter(field => field !== 'scope').map(field => `block ${block}: fidelity Q3: value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-${id}].${field} is established by the game and no instruction carries it`)),
        ]),
    )
    assert.equal(refused.summary, 'Part of this activity is still waiting for approved coach wording, so it is not being shown.')
    // Nothing spatial, no record gap, no post-realization gate and no context-scoring finding is among the reasons.
    assert.ok(!refused.reasons.some(r => r.includes('post-realization') || r.includes('authorization record') || r.includes('cannot be confirmed to govern')))
    // Behind the record nothing changes: the record has no gap left.
    const behind = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf() }, learningGoalAuthorizations()).activity as RefusedActivity
    assert.deepEqual(behind.reasons, refused.reasons)
})

console.log(`target placement: ${passed} passed`)
