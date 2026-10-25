/**
 * **His reply filed 28 October 2026, items 2 and 8: the marked line stays outside the penalty area, and the 9 m depth is provisional** — P2,
 * 25 October 2026.
 *
 * Item 2: *"The marked progression line should remain outside the penalty area."* *"The coach should retain flexibility to adjust it within a
 * valid range, but the engine should prevent incompatible geometry through general validation rather than activity-specific restrictions."*
 *   - knowledge: A01-R2-S5-2, a bound beside the line's value (RC-21's "beyond X (for team T)", the referent the penalty area, the team the
 *     building role's holder), his words;
 *   - validation: GA-RELATIVE-PLACEMENT, unchanged and general, holds the bound on the realized geometry in every block - a TEST-ONLY realization
 *     placing the line inside the area is refused at validation, never served, never falling back;
 *   - the coach's range: `adjustment-range.ts` reads the same bound for the adjustment that moves the line (A01-ADJ-3), and the renderer says it
 *     in DRAFT words (`adjustmentLimits`); fidelity refuses a limit not said, a limit said that the bounds do not give, and a bound it cannot read;
 *   - the zone version, whose line carries no bound, is said exactly as before; the mechanism follows the knowledge, not A01 (a synthetic
 *     fixture with other ids, ends, directions and numbers; a TEST-ONLY profile whose depth is another figure).
 * Item 8: *"Please preserve source traceability and treat the 9 m dimension as provisional until we can verify the authoritative specification."*
 * *"I don't want an uncertain interpretation silently becoming canonical knowledge."* *"However, I wouldn't postpone an initial field test solely
 * while awaiting clarification from The FA, provided the provisional dimensions are identified and consistently applied."*
 *   - the FA pairing's depth carries PROVISIONAL with three sources and his words, validated by the loader; the realization item restating it
 *     says so, held to one value and one status; the administrator's review evidence shows the status wherever the figure is cited (the Set up
 *     sentence and the line's range among them) and the bound-region account carries it; no coach text says it (the decision recorded on the
 *     pairing's note).
 *
 * Nothing here changes a production file: every TEST-ONLY change is a copy in memory.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/geometry-compatibility.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { boundRegionsRefusals, SportBoundRegions } from '../derivation/bound-regions'
import { loadProvisionalRealizations, loadRegister, loadSportBoundRegions, PROVISIONAL_REALIZATIONS_FILE, readJson, validateProvisionalRealizations } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { adjustmentRangesOf } from './adjustment-range'
import { buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { DRAFT_COACH_WORDING_FILE, draftCoachWordingUnusableBecause } from './draft-coach-wording'
import { checkFidelity, FidelityFinding } from './fidelity'
import { Instruction, renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('his reply filed 28 October 2026, items 2 and 8 (P2)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const CASES = [[12, 1], [12, 2], [11, 1]] as const
const R1 = 'A01-R1'
const R2 = 'A01-R2'
const PAIRING = 'FA-MINI-SOCCER-5V5-2026'
const LINE = `c:provisional:${R2}:${R1}-S2-1`
const LINE_PATH = `space.regions[${LINE}].position.along`
const AREA = `c:provisional:${R2}:${R2}-S2-1`
const AREA_PATH = `space.regions[${AREA}].position.along`
const DEPTH_PATH = `boundRegions.regions[${AREA}].pairing.region.depthM`
const ZONE_LINE = `c:provisional:${R1}:${R1}-S2-1`

// His words, filed 28 October 2026 (byte-checked against the reply file when recorded).
const I2_HEAD = '2. Moving the marked line'
const I2_A = 'The marked progression line should remain outside the penalty area.'
const I2_B = 'The coach should retain flexibility to adjust it within a valid range, but the engine should prevent incompatible geometry through general validation rather than activity-specific restrictions.'
const I8_HEAD = '8. Penalty-area depth'
const I8_A = 'Please preserve source traceability and treat the 9 m dimension as provisional until we can verify the authoritative specification.'
const I8_B = "I don't want an uncertain interpretation silently becoming canonical knowledge."
const I8_C = "However, I wouldn't postpone an initial field test solely while awaiting clarification from The FA, provided the provisional dimensions are identified and consistently applied."

const MOVE_GOAL = "You may choose to move the marked line nearer to either end line, but no nearer than 9 m to the building team's end line, so that it stays outside the penalty area"
const MOVE_ZONE = "You may choose to move the marked line nearer to either end line; it is measured from the building team's end line, so when the roles exchange, set it out again at the same distance from the new building team's end line"
const BOX = "Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"

const FA = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === PAIRING)!
const GOAL = { goal: { count: 1, widthM: FA.object.widthM, type: FA.object.type! } }
const NO_GOAL = { goal: { count: 0 } }
const requestOf = (players: number, keepers: number, objects: Record<string, unknown>) =>
    ({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects } }) as any
const productionFile = () => readJson(PROVISIONAL_REALIZATIONS_FILE)
const realizationOf = (file: any, id: string) => file.realizations.find((r: any) => r.id === id)
const itemOf = (file: any, realization: string, id: string) => realizationOf(file, realization).items.find((i: any) => i.id === id)
const build = (objects: Record<string, unknown>, players = 12, keepers = 1, file?: any, boundRegions?: SportBoundRegions) =>
    buildActivityUnderAuthorizationRecords(requestOf(players, keepers, objects), learningGoalAuthorizations(), {
        ...(file ? { realizations: loadProvisionalRealizations(file, boundRegions) } : {}),
        ...(boundRegions ? { boundRegions } : {}),
        review: { includeDrafts: true },
    })
const served = (result: { activity: unknown }, what: string) => {
    assert.equal((result.activity as any).outcome, 'served', `${what}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
    return result.activity as ServedActivity
}
const blocksOf = (fixture: any): any[] => fixture.roleBlocks.blocks.map((block: any) => block.fixture)
const texts = (activity: ServedActivity) => activity.rendered.instructions.map(instruction => instruction.text)
const moveSentence = (activity: ServedActivity) => activity.rendered.instructions.filter(instruction => instruction.from.some(p => p.startsWith('adjustments[A01-ADJ-3]')))
const violations = (findings: FidelityFinding[]) => findings.filter(finding => finding.severity === 'VIOLATION')

// ── Item 2: the knowledge ──────────────────────────────────────────────────────────────────────────────────
test('item 2, knowledge: A01-R2-S5-2 bounds the marked line beyond the penalty area for the building team, his words; it places nothing', () => {
    const file = productionFile()
    const item = itemOf(file, R2, `${R2}-S5-2`)
    assert.deepEqual(
        [item.row, item.selector, item.requirement, item.valueStatus, item.strictness, item.scope, item.basis, item.category, item.checkability],
        ['S5', itemOf(file, R1, `${R1}-S5-1`).selector, 'RANGE', 'REQUIRED_RANGE', 'REQUIRED', 'WHOLE_GAME', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE', 'STRUCTURAL'],
    )
    assert.deepEqual(item.value, { term: 'beyond X (for team T)', of: { structuralRef: { contractId: `provisional:${R2}`, itemId: `${R2}-S2-1` }, asAuthored: 'the penalty area' }, forTeam: 'ROLE_HOLDER_BUILDING', asAuthored: 'outside the penalty area' })
    assert.equal(index.relativeTerms && (index.relativeTerms as any).machineReadable.terms[item.value.term].relation, 'beyond', "RC-21's canonical relation, no new term")
    assert.deepEqual([item.words, item.citedAs], [`${I2_A} ${I2_B}`, 'his reply filed 28 October 2026, item 2'])
    assert.equal(item.basisEvidence, `Christian, reply filed 28 October 2026, item 2 ("${I2_HEAD}"): "${I2_A}" "${I2_B}"`)
    for (const said of ['GA-RELATIVE-PLACEMENT', 'no code names a line, a goal or a penalty area', 'OUR READING', '"at or past"', 'IFAB Law 1', 'PROVISIONAL', 'A01-ADJ-3']) assert.ok(item.fitNote.includes(said), said)
    // The line's own value is unchanged: 20 m from the building team's end line.
    assert.deepEqual(itemOf(file, R1, `${R1}-S5-1`).value.offsetM, { from: 20, to: 20 })
    // Dated amendments, the old words kept: the realization's note and the adjustment's record.
    const note: string = realizationOf(file, R2).note
    assert.ok(note.indexOf('AMENDED 25 October 2026 (P2)') > note.indexOf('AMENDED 24 October 2026 (K3'), 'after the K3 line')
    assert.ok(note.includes(`"${I2_A}" "${I2_B}"`) && note.includes(`"${I8_A}" "${I8_B}"`))
    const adjustment = learningGoalAuthorizations().find(r => r.learningGoalId === 'A01')!.authorizedAdjustments!.entries.find(e => e.id === 'A01-ADJ-3')!
    assert.ok(adjustment.note!.startsWith('Recorded 15 October 2026 (stage K7)') && adjustment.note!.includes(`AMENDED 25 October 2026 (P2), for his reply filed 28 October 2026, item 2: "${I2_A}" "${I2_B}"`))
    assert.equal(adjustment.coachWords, 'move the marked line nearer to either end line', 'our DRAFT action words are unchanged')
    // The zone version holds no such bound: no item of A01-R1 bounds its line.
    assert.ok(!realizationOf(file, R1).items.some((i: any) => i.row === 'S5' && i.selector === item.selector && i.requirement === 'RANGE'))
})

test('item 2, DRAFT words: adjustmentLimits in the DRAFT data, his words as basis, refused by the loader when damaged; nothing approved', () => {
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    assert.equal(file.status, 'DRAFT')
    assert.deepEqual(file.adjustmentLimits, {
        nearest: ", but no nearer than {nearest} to the {team}'s end line",
        farthest: ", but no farther than {farthest} from the {team}'s end line",
        both: ", but between {nearest} and {farthest} from the {team}'s end line",
        outside: ', so that it stays outside the {referent}',
        basis: { words: [I2_A, I2_B], citedAs: 'his reply filed 28 October 2026, item 2' },
    })
    assert.ok(file.about.includes('AMENDED 25 October 2026 (P2)') && typeof file.entryShape.adjustmentLimits === 'string')
    assert.equal(draftCoachWordingUnusableBecause(file, index), null)
    for (const [label, damage, pattern] of [
        ['a stray slot', (f: any) => (f.adjustmentLimits.nearest = ', but no nearer than {nearest} to the {side} end line'), /nearest clause must hold exactly the slots/],
        ['a missing slot', (f: any) => (f.adjustmentLimits.both = ', but up to {farthest} from the {team} end line'), /both clause must hold exactly/],
        ['no basis', (f: any) => delete f.adjustmentLimits.basis, /adjustmentLimits entry: its basis is not an object/],
        ['an approval', (f: any) => (f.adjustmentLimits.approvedBy = { who: 'TEST-ONLY' }), /adjustmentLimits entry carries "approvedBy"/],
    ] as [string, (f: any) => void, RegExp][]) {
        const damaged = copy(file)
        damage(damaged)
        assert.match(String(draftCoachWordingUnusableBecause(damaged, index)), pattern, label)
    }
    const approved = fs.readFileSync(path.join(path.dirname(DRAFT_COACH_WORDING_FILE), 'approved-coach-wording.json'), 'utf8')
    assert.ok(!approved.includes('no nearer than') && !approved.includes('stays outside the'), 'no approved sentence says the range: it is ours, DRAFT')
})

// ── Item 2: the goal version as served ─────────────────────────────────────────────────────────────────────
test('item 2, served: the goal version states the range from the bound (no nearer than 9 m, outside the penalty area) at 12/1, 12/2 and 11/1; fidelity 0', () => {
    for (const [players, keepers] of CASES) {
        const what = `goal ${players}/${keepers}`
        const result = build(GOAL, players, keepers)
        const activity = served(result, what)
        assert.deepEqual(activity.account.realizationSelection!.map(r => [r.realization, r.outcome]), [[R2, 'SELECTED'], [R1, 'NOT_TRIED']], what)
        const [move, ...more] = moveSentence(activity)
        assert.deepEqual([move.text, move.section, more.length], [MOVE_GOAL, 'Adjusting the activity', 0], what)
        assert.equal(texts(activity).filter(text => text.includes('no nearer than')).length, 1, `${what}: said once`)
        const [choice, limit] = move.parts
        assert.deepEqual([choice.text, choice.status], ['You may choose to move the marked line nearer to either end line', 'COACH_CHOICE'], what)
        assert.deepEqual(limit.bindings, [{ quantity: 9, path: LINE_PATH, as: 'ADJUSTMENT_LIMIT' }], what)
        for (const cited of [LINE_PATH, 'adjustments[A01-ADJ-3].moves', AREA_PATH, `space.regions[${AREA}].noun`, DEPTH_PATH]) assert.ok(limit.from.includes(cited), `${what}: cites ${cited}`)
        assert.equal(activity.integrity.fidelityViolations, 0, what)
        assert.ok(activity.rendered.instructions.length <= 28, `${what}: no new sentence (the range is a clause of the adjustment's)`)
        // The range on every block's realized geometry: the line at 20 m from the building team's end line, no nearer than the area's far edge.
        for (const fixture of blocksOf(result.fixture)) {
            const reading = adjustmentRangesOf(fixture, index)
            assert.deepEqual(reading.unreadable, [], what)
            assert.deepEqual(
                reading.ranges.map(r => [r.adjustmentId, r.elementId, r.forTeam, r.at, r.nearest && [r.nearest.metres, r.nearest.reachable, r.nearest.referent, r.nearest.bound.forTeam], r.farthest]),
                [['A01-ADJ-3', LINE, 'ROLE_HOLDER_BUILDING', 20, [9, true, AREA, 'ROLE_HOLDER_BUILDING'], null]],
                what,
            )
        }
        // GA-RELATIVE-PLACEMENT passes in both blocks, now with the bound among its relations.
        assert.deepEqual(activity.roleBlocks!.blocks.map(block => block.concreteChecks.find(check => check.checkId === 'GA-RELATIVE-PLACEMENT')!.verdict), ['PASS', 'PASS'], what)
        // The evidence: the sentence's sources name the bound item and the depth's PROVISIONAL status; its wording is DRAFT.
        const evidence = activity.evidence!.sections.instructions.find(entry => entry.text === MOVE_GOAL)!
        assert.equal(evidence.wording, 'DRAFT', what)
        assert.ok(evidence.sources.some(source => source.ref === `provisional:${R2}::${R2}-S5-2` && source.standing === 'PROVISIONAL'), `${what}: the bound item is a source`)
        assert.ok(evidence.sources.some(source => source.standing === 'PROVISIONAL' && source.ref === `pairing ${PAIRING} region.depthM: PROVISIONAL (his reply filed 28 October 2026, item 8)`), `${what}: the depth's status`)
    }
})

test('item 2, the zone version: its line carries no bound, so its sentence and its range are exactly as before', () => {
    for (const [players, keepers] of CASES) {
        const what = `zone ${players}/${keepers}`
        const result = build(NO_GOAL, players, keepers)
        const activity = served(result, what)
        assert.deepEqual(moveSentence(activity).map(instruction => instruction.text), [MOVE_ZONE], what)
        assert.ok(!texts(activity).some(text => text.includes('no nearer than')), what)
        for (const fixture of blocksOf(result.fixture)) assert.deepEqual(adjustmentRangesOf(fixture, index), { ranges: [], unreadable: [] }, what)
        assert.equal(activity.integrity.fidelityViolations, 0, what)
        assert.ok(!activity.rendered.instructions.some(instruction => instruction.from.includes(`space.regions[${ZONE_LINE}].position.along`) && instruction.parts.some(part => part.bindings.some(binding => binding.as === 'ADJUSTMENT_LIMIT'))), what)
    }
})

// ── Item 2: validation ─────────────────────────────────────────────────────────────────────────────────────
test('item 2, validation: a TEST-ONLY realization placing the line inside the penalty area is refused at validation in both blocks, never falling back', () => {
    const original = productionFile()
    for (const at of [5, 8.5]) {
        const file = copy(original)
        itemOf(file, R1, `${R1}-S5-1`).value.offsetM = { from: at, to: at }
        const activity = build(GOAL, 12, 1, file).activity as RefusedActivity
        assert.deepEqual([activity.outcome, activity.stage], ['refused', 'validation'], `line at ${at} m: ${JSON.stringify(activity.reasons ?? null)}`)
        const broken = activity.reasons.filter(reason => reason.includes('GA-RELATIVE-PLACEMENT') && reason.includes(`${LINE}::S5: its near edge is not at or past the far edge of ${R2}-S2-1 in the attacking direction of ROLE_HOLDER_BUILDING`))
        assert.equal(broken.length, 2, `line at ${at} m, in both blocks: ${activity.reasons.join(' | ')}`)
        assert.deepEqual(activity.account.realizationSelection!.map(r => [r.realization, r.outcome]), [[R2, 'REFUSED'], [R1, 'NOT_TRIED']], `line at ${at} m: no fall back`)
    }
    // At or past the area's far edge, it holds (OUR READING of RC-21's "at or past", flagged to him): at 9 m and at 12 m the goal version is
    // served, and its range is the same.
    for (const at of [9, 12]) {
        const file = copy(original)
        itemOf(file, R1, `${R1}-S5-1`).value.offsetM = { from: at, to: at }
        const activity = served(build(GOAL, 12, 1, file), `line at ${at} m`)
        assert.deepEqual(moveSentence(activity).map(instruction => instruction.text), [MOVE_GOAL], `line at ${at} m`)
    }
    // The same TEST-ONLY line in the zone version, which holds no area and no bound, is not refused for it: nothing in code names the area.
    {
        const file = copy(original)
        itemOf(file, R1, `${R1}-S5-1`).value.offsetM = { from: 8.5, to: 8.5 }
        const activity = build(NO_GOAL, 12, 1, file).activity as any
        assert.ok(!(activity.reasons ?? []).some((reason: string) => reason.includes(`${R2}-S2-1`)), JSON.stringify(activity.reasons ?? null))
    }
    // Without the bound (TEST-ONLY), the line inside the area is no longer refused for it: the refusal is the knowledge's.
    {
        const file = copy(original)
        itemOf(file, R1, `${R1}-S5-1`).value.offsetM = { from: 5, to: 5 }
        realizationOf(file, R2).items = realizationOf(file, R2).items.filter((i: any) => i.id !== `${R2}-S5-2`)
        const activity = build(GOAL, 12, 1, file).activity as any
        assert.ok(!(activity.reasons ?? []).some((reason: string) => reason.includes(`far edge of ${R2}-S2-1`)), JSON.stringify(activity.reasons ?? null))
    }
    assert.deepEqual(productionFile(), original, 'every mutation was made on a copy')
})

// ── Item 2: fidelity ───────────────────────────────────────────────────────────────────────────────────────
test('item 2, fidelity (TEST-ONLY mutations of one block render): the range dropped, a wrong limit, a limit invented, and an unreadable bound are refused', () => {
    const fixture = blocksOf(build(GOAL).fixture)[0]
    const rendered = renderConcreteGame(fixture)
    assert.deepEqual(violations(checkFidelity(fixture, rendered).findings), [])
    const at = rendered.instructions.findIndex(instruction => instruction.text === MOVE_GOAL)
    const withInstruction = (replacement: Instruction) => ({ ...rendered, instructions: rendered.instructions.map((instruction, n) => (n === at ? replacement : instruction)) })
    const original = rendered.instructions[at]
    // The range dropped: the choice said alone.
    const dropped = withInstruction({ ...original, text: original.parts[0].text, parts: [original.parts[0]], from: original.parts[0].from, quantities: [] })
    assert.ok(violations(checkFidelity(fixture, dropped).findings).some(f => f.question === 3 && f.what.includes('sets the nearest it may be set from the end line it is measured from at 9 m, which no sentence offering the adjustment says')), 'dropped')
    // A wrong limit: 8 bound as the limit.
    const limit = original.parts[1]
    const wrongPart = { ...limit, text: limit.text.replace('9 m', '8 m'), quantities: [8], bindings: [{ quantity: 8, path: LINE_PATH, as: 'ADJUSTMENT_LIMIT' as const }] }
    const wrong = withInstruction({ ...original, text: original.parts[0].text + wrongPart.text, parts: [original.parts[0], wrongPart], quantities: [8] })
    const wrongFindings = violations(checkFidelity(fixture, wrong).findings)
    assert.ok(wrongFindings.some(f => f.question === 2 && f.what.includes(`binds 8 to ${LINE_PATH}`)), 'a wrong limit')
    assert.ok(wrongFindings.some(f => f.question === 3), 'and the true limit lost')
    // A limit claimed without the adjustment's `moves` cited is not admitted.
    const unclaimedPart = { ...limit, from: limit.from.filter(p => p !== 'adjustments[A01-ADJ-3].moves') }
    const unclaimed = withInstruction({ ...original, parts: [original.parts[0], unclaimedPart], from: [...original.parts[0].from, ...unclaimedPart.from] })
    assert.ok(violations(checkFidelity(fixture, unclaimed).findings).some(f => f.question === 2 && f.what.includes(`binds 9 to ${LINE_PATH}`)), 'the adjustment not cited')
    // A bound of another relation on the moved line (TEST-ONLY): it cannot be told, so the activity is refused.
    const odd = copy(fixture)
    odd.status.bounds.find((entry: any) => entry.path === LINE_PATH).bounds.push({ kind: 'RELATIVE', relation: 'within', term: 'TEST-ONLY', of: { contractId: `provisional:${R2}`, itemId: `${R2}-S2-1` }, forTeam: 'ROLE_HOLDER_BUILDING', preferred: false })
    assert.ok(violations(checkFidelity(odd, renderConcreteGame(odd)).findings).some(f => f.question === 3 && f.what.includes('carries a bound of the relation "within" that no range is read for')), 'unreadable')
})

// ── Item 2: general, not A01 ───────────────────────────────────────────────────────────────────────────────
test('item 2, general: a synthetic fixture (other ids, the far end, both directions, other numbers) gives the range its bounds give', () => {
    const spec = index.targetOf!
    const region = (id: string, longitudinal: string | null) => ({ elementId: `c:TEST:${id}`, noun: 'zone', ...(longitudinal ? { selector: [{ attribute: 'longitudinal', op: '=', value: longitudinal }] } : {}) })
    const objective = (team: string, target: string) => ({ elementId: `c:TEST:OBJ-${team}`, [spec.roleLeaf]: spec.role, [spec.teamLeaf]: team, [spec.referenceLeaf]: { structuralRef: { contractId: 'TEST', itemId: target } } })
    const geometry = (id: string, from: number, to: number, anchor: number | null = null) => ({ path: `space.regions[c:TEST:${id}].position.along`, geometry: { interval: { from, to }, ...(anchor === null ? {} : { anchor }) } })
    const beyond = (of: string, forTeam: string) => ({ kind: 'RELATIVE', relation: 'beyond', term: 'beyond X (for team T)', of: { contractId: 'TEST', itemId: of }, forTeam, preferred: false })
    const fixture = (bounds: any[], geometries = [geometry('LINE', 35, 35, 50), geometry('ZONE-A', 42, 50), geometry('ZONE-B', 0, 10)]) => ({
        envelope: { lengthM: 50, widthM: 30 },
        roleNouns: { holders: { TEAM_AT_AXIS_END: 'ROLE-T' } },
        record: { roleBlock: null },
        adjustments: { entries: [{ id: 'ADJ-1', moves: { role: 'ROLE-T' } }, { id: 'ADJ-2' }] },
        game: {
            space: {
                regions: [
                    { elementId: 'c:TEST:LINE', noun: 'line', position: { along: { term: 'own end (of team T)', forTeam: 'TEAM_AT_AXIS_END', offsetM: { from: 15, to: 15 } } } },
                    region('ZONE-A', null),
                    region('ZONE-B', null),
                    region('TARGET-NEAR', 'end-near'),
                    region('TARGET-FAR', 'end-far'),
                ],
            },
            objectives: [objective('TEAM_AT_AXIS_END', 'TARGET-NEAR'), objective('TEAM_AT_AXIS_START', 'TARGET-FAR')],
        },
        status: { geometry: geometries, bounds: [{ lineId: 'c:TEST:LINE::S5', path: 'space.regions[c:TEST:LINE].position.along', bounds }] },
    })
    // The line is 15 m from the far end line (at 35 m), measured from the end its team defends. Beyond ZONE-A (42-50, at that end) for its own
    // team, which attacks the 0 end: no nearer than 8 m to its end line. Beyond ZONE-B (0-10) for the other team, which attacks the far end:
    // no farther than 40 m from it.
    const reading = adjustmentRangesOf(fixture([beyond('ZONE-A', 'TEAM_AT_AXIS_END'), beyond('ZONE-B', 'TEAM_AT_AXIS_START')]), index)
    assert.deepEqual(reading.unreadable, [])
    assert.deepEqual(reading.ranges.map(r => [r.adjustmentId, r.elementId, r.forTeam, r.at, r.nearest!.metres, r.nearest!.referent, r.farthest!.metres, r.farthest!.referent]), [['ADJ-1', 'c:TEST:LINE', 'TEAM_AT_AXIS_END', 15, 8, 'c:TEST:ZONE-A', 40, 'c:TEST:ZONE-B']])
    // No bound: no range (the area alone bounds a line, and no coach is told it).
    assert.deepEqual(adjustmentRangesOf(fixture([]), index), { ranges: [], unreadable: [] })
    // A referent with no realized position, a team whose end the game does not establish, a relation no range is read for: each unreadable.
    assert.match(adjustmentRangesOf(fixture([beyond('ZONE-A', 'TEAM_AT_AXIS_END')], [geometry('LINE', 35, 35, 50)]), index).unreadable.join(), /that element has no realized position along the area/)
    assert.match(adjustmentRangesOf(fixture([beyond('ZONE-A', 'TEST-ONLY-NOBODY')]), index).unreadable.join(), /the end that team attacks is not established in this game/)
    assert.match(adjustmentRangesOf(fixture([{ ...beyond('ZONE-A', 'TEAM_AT_AXIS_END'), relation: 'within' }]), index).unreadable.join(), /a bound of the relation "within"/)
    // A line its own bounds put out of range is no range to offer (validation refuses that game).
    assert.match(adjustmentRangesOf(fixture([beyond('ZONE-A', 'TEAM_AT_AXIS_END')], [geometry('LINE', 45, 45, 50), geometry('ZONE-A', 42, 50)]), index).unreadable.join(), /outside the range its own bounds give/)
    // The module names no activity, role, element or sport: every word it reads is data.
    const source = fs.readFileSync(path.join(__dirname, 'adjustment-range.ts'), 'utf8')
    for (const word of ['A01', 'BUILDING', 'PRESSING', 'penalty', 'goal', 'pressure reference', 'perceptual-reference', 'ROLE_HOLDER']) assert.ok(!source.includes(word), `adjustment-range.ts names ${word}`)
})

test('item 2, general: with a TEST-ONLY profile whose penalty-area depth is another figure (12 m), the range and the box follow it', () => {
    const block = copy(loadSportBoundRegions()!)
    const pairing = block.pairings.find(p => p.id === PAIRING)!
    pairing.region.depthM = 12
    pairing.provisional![0].value = 12
    Object.assign(pairing.provisional![0].sources[0], { states: '12 m (TEST-ONLY)', metres: 12 })
    const file = productionFile()
    itemOf(file, R2, `${R2}-S5-1`).value.offsetM = { from: 0, to: 12 }
    const activity = served(build(GOAL, 12, 1, file, block), 'depth 12 m')
    assert.deepEqual(moveSentence(activity).map(instruction => instruction.text), [MOVE_GOAL.replace('9 m', '12 m')])
    assert.ok(texts(activity).includes(BOX.replace('9 m deep', '12 m deep')))
    assert.equal(activity.integrity.fidelityViolations, 0)
})

// ── Item 8: the provisional depth ──────────────────────────────────────────────────────────────────────────
test('item 8, knowledge: the FA pairing marks its 9 m depth PROVISIONAL, with three sources and his words; the note amended; the loader validates it', () => {
    const raw = readJson('stage-b/sport-profile-soccer.json').boundRegions.pairings.find((p: any) => p.id === PAIRING)
    assert.deepEqual(raw.provisional, [
        {
            leaf: 'region.depthM',
            status: 'PROVISIONAL',
            value: 9,
            sources: [
                {
                    document: 'The Mini-Soccer and Youth Futsal Handbook (England Football / The FA)',
                    edition: 'Version updated August 2026 (2026/2027 season)',
                    citedAs: 'Mini-Soccer Law 1, Playing Area: the 5v5 area as labelled on the Law 1 diagram; https://cdn.englandfootball.com/-/media/EnglandFootball/Files/play-and-participate/youth-football/Mini-Soccer-Handbook-2026-27.pdf',
                    states: '9 m',
                    metres: 9,
                },
                { document: 'The Mini-Soccer Handbook (The FA)', edition: '2025 edition', citedAs: 'the 5v5 box as 16 x 9 yd; https://www.thefa.com/-/media/cfa/westridingfa/files/clubs/mini-soccer-handbook-2025.ashx', states: '9 yd', metres: 8.2296 },
                { document: "The FA's metric pitch size guide", edition: '2012', citedAs: 'the 5v5 box as 15 x 8 m; https://www.thefa.com/-/media/cfa/cheshirefa/files/facilities/pitch-size-metric.ashx', states: '8 m', metres: 8 },
            ],
            applied: "The current handbook's printed figure, 9 m, as the one value every use reads (his same-source rule, his reply filed 27 October 2026, item 1), until the authoritative specification is verified. 9 yd is the exact conversion at 0.9144 m per yard (ours).",
            authority: { words: [I8_A, I8_B, I8_C], citedAs: 'his reply filed 28 October 2026, item 8' },
        },
    ])
    assert.ok(Math.abs(9 * 0.9144 - raw.provisional[0].sources[1].metres) < 1e-12, 'the yard conversion, exact at 0.9144 m per yard')
    assert.deepEqual(FA.provisional, raw.provisional, 'the loader carries it whole')
    assert.equal(FA.region.depthM, raw.provisional[0].value, 'one value')
    // The note: what it said kept ("we use 9 m as printed"), a dated line after it with his words and the coach-facing decision.
    assert.ok(raw.note.includes('we use 9 m as printed.') && raw.note.indexOf('AMENDED 25 October 2026 (P2)') > raw.note.indexOf('we use 9 m as printed.'))
    for (const said of [`"${I8_HEAD}" "${I8_A}" "${I8_B}" "${I8_C}"`, 'Coaches are not told it is provisional', 'Whether pilot coaches should also be told is his to decide']) assert.ok(raw.note.includes(said), said)
    // The loader refuses a damaged entry, each named.
    const profile = readJson('stage-b/sport-profile-soccer.json')
    assert.deepEqual(boundRegionsRefusals(profile.boundRegions, index), [])
    for (const [label, damage, pattern] of [
        ['another value', (p: any) => (p.provisional[0].value = 8), /states 8 for region\.depthM, and the pairing records 9: one figure has one value/],
        ['another status', (p: any) => (p.provisional[0].status = 'VERIFIED'), /carries the status "VERIFIED", which is none of PROVISIONAL/],
        ['one source', (p: any) => (p.provisional[0].sources = p.provisional[0].sources.slice(0, 1)), /fewer than two sources/],
        ['no source states the value', (p: any) => (p.provisional[0].sources = p.provisional[0].sources.slice(1)), /applies 9, which none of its sources states/],
        ['an unknown figure', (p: any) => (p.provisional[0].leaf = 'region.areaM'), /names "region\.areaM", which is no figure of a pairing/],
        ['the figure twice', (p: any) => p.provisional.push(copy(p.provisional[0])), /names region\.depthM a second time/],
        ['no words of his', (p: any) => (p.provisional[0].authority = { words: [], citedAs: 'x' }), /its authority quotes none of his words/],
        ['no reason it is applied', (p: any) => delete p.provisional[0].applied, /does not say why its value is the one applied/],
        ['an empty list', (p: any) => (p.provisional = []), /lists its provisional figures as something other than a non-empty list/],
        ['a source without metres', (p: any) => delete p.provisional[0].sources[1].metres, /source 2 does not give what it states in metres/],
    ] as [string, (p: any) => void, RegExp][]) {
        const damaged = copy(profile)
        damage(damaged.boundRegions.pairings.find((p: any) => p.id === PAIRING))
        assert.match(boundRegionsRefusals(damaged.boundRegions, index).join(' | '), pattern, label)
    }
})

test('item 8, one value and one status: A01-R2-S5-1 says it restates the provisional depth; the realization loader refuses a silent or second value', () => {
    const file = productionFile()
    const item = itemOf(file, R2, `${R2}-S5-1`)
    assert.deepEqual([item.provisionalFigure, item.value.offsetM], [{ pairing: PAIRING, leaf: 'region.depthM' }, { from: 0, to: FA.region.depthM }])
    assert.ok(item.fitNote.includes('AMENDED 25 October 2026 (P2)') && item.fitNote.includes(`"${I8_A}" "${I8_B}" "${I8_C}"`))
    assert.deepEqual(validateProvisionalRealizations(file), [])
    const refusedFor = (label: string, damage: (f: any) => void, pattern: RegExp) => {
        const damaged = copy(file)
        damage(damaged)
        assert.match(validateProvisionalRealizations(damaged).join(' | '), pattern, label)
    }
    refusedFor('the marker dropped', f => delete itemOf(f, R2, `${R2}-S5-1`).provisionalFigure, /A01-R2-S5-1 restates region\.depthM of the pairing FA-MINI-SOCCER-5V5-2026 \(9\), which the pairing marks PROVISIONAL, and does not say so/)
    refusedFor('a non-provisional figure named', f => (itemOf(f, R2, `${R2}-S5-1`).provisionalFigure = { pairing: PAIRING, leaf: 'region.widthM' }), /records that figure as it is \(15\), not provisional/)
    refusedFor('a pairing the profile does not hold', f => (itemOf(f, R2, `${R2}-S5-1`).provisionalFigure = { pairing: 'TEST-ONLY', leaf: 'region.depthM' }), /the pairing TEST-ONLY, which the Sport Profile does not hold/)
    refusedFor('another form', f => (itemOf(f, R2, `${R2}-S5-1`).provisionalFigure = 'FA'), /in some other form than \{ pairing, leaf \}/)
    refusedFor('on an item restating no figure', f => (itemOf(f, R2, `${R2}-S2-1`).provisionalFigure = { pairing: PAIRING, leaf: 'region.depthM' }), /A01-R2-S2-1 says it states region\.depthM of FA-MINI-SOCCER-5V5-2026, and its row and value restate no figure of a bound region/)
    // The zone version restates nothing of a pairing, so it declares nothing.
    assert.ok(!realizationOf(file, R1).items.some((i: any) => 'provisionalFigure' in i))
})

test('item 8, identified: the review evidence shows the depth PROVISIONAL wherever it is cited, the account carries it; no coach text says it', () => {
    for (const [players, keepers] of CASES) {
        const what = `goal ${players}/${keepers}`
        const activity = served(build(GOAL, players, keepers), what)
        // The bound-region account carries the pairing's provisional figure, as the review page shows it.
        for (const block of activity.evidence!.boundRegions!.blocks) assert.deepEqual(block.bindings.map(binding => binding.pairing!.provisional), [FA.provisional], what)
        // The Set up sentence's figure: the pairing source says the depth is provisional, and the depth has a PROVISIONAL source of its own.
        const box = activity.evidence!.sections.instructions.find(entry => entry.text === BOX)!
        assert.ok(box.sources.some(source => source.standing === 'APPROVED' && source.ref.startsWith(`pairing ${PAIRING} (`) && source.detail!.includes('15 m wide by 9 m deep (provisional)')), what)
        const status = box.sources.filter(source => source.standing === 'PROVISIONAL' && source.ref === `pairing ${PAIRING} region.depthM: PROVISIONAL (his reply filed 28 October 2026, item 8)`)
        assert.equal(status.length, 2, `${what}: one per block`)
        for (const said of ['9 m applied', '2025 edition', '9 yd (8.2296 m)', '(2012)', '8 m']) assert.ok(status[0].detail!.includes(said), `${what}: ${said}`)
        const element = activity.evidence!.provenance.elements.find(entry => entry.path === DEPTH_PATH)!
        assert.ok(element.standings.includes('PROVISIONAL'), `${what}: the figure's provenance`)
        // Coach-facing text never says it (the decision on the pairing's note); the figure is said as one value.
        const coachText = JSON.stringify([activity.rendered.instructions.map(instruction => instruction.text), activity.overview, activity.diagram])
        assert.ok(!/provisional/i.test(coachText), `${what}: no coach text says provisional`)
        assert.ok(texts(activity).includes(BOX) && texts(activity).includes(MOVE_GOAL), `${what}: 9 m in the box and in the range, one value`)
    }
    // A pairing marking nothing provisional (the regulation entry) is said exactly as before in the evidence.
    const ifab = loadSportBoundRegions()!.pairings.find(p => p.id === 'IFAB-LAW-1')!
    assert.equal(ifab.provisional, undefined)
})

console.log(`geometry-compatibility.unit.ts — ${passed} passed`)
