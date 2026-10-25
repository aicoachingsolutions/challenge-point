/**
 * **The zone version's goalkeeper handling area** — Z, 25 October 2026, for his reply filed 28 October 2026, item 7 ("7. Goalkeeper handling
 * in the target-zone version"): *"I favor retaining a defined goalkeeper handling area in the target-zone version."* *"The absence of a
 * physical goal shouldn't automatically eliminate the goalkeeper's handling privileges or fundamentally alter the player's functional role
 * during the build-out."* *"My preference is to use the same authorized small-sided penalty-area geometry where appropriate, even when the
 * physical goal is replaced by a target zone."* *"Please verify that this doesn't conflict with the existing scoring and eligibility
 * relationships before modifying the validated zone realization."* *"This shouldn't delay testing the goal-based version."*
 *
 * The area is bound to the goalkeeper's own end, never to the pressing team's target (register row S7's second, closed form, register
 * version 25): a zone of the function penalty-area, from the building team's end line 9 m into the area (the FA 5v5 entry's depth,
 * PROVISIONAL), centred, 15 m wide, borrowing the entry's region alone. The Sport Profile PERMITS it (BOUND-REGION-PERFORMER-END) where no goal
 * stands at that end; LAW-12-GK requires REGION_OF_PERFORMER, which it satisfies. Every new token and sentence is ours and DRAFT.
 *
 * What is pinned here:
 *   1. the Sport Profile: the requirement whole, his words; LAW-12-GK's new predicate with its dated AMENDED line; LAW-14 unchanged; the
 *      loader refusing the form's defects; the register's S7 form, its versions entry and version 25; the predicate in the closed vocabulary;
 *   2. A01-R1's six items and his words; the area's figures equal to the goal version's own area (his "the same"); ENFORCE with its AMENDED
 *      line; A01-R2 withdrawing the six on his 1b words, its own area kept;
 *   3. served at 12/1, 12/2 and 11/1 (KEPT ends, the area alternating with the goalkeeper): the Set up sentence, the normal-rules clause, the
 *      folded adjustment, all DRAFT, coach and administrator alike, live equal to review; the area realized from each block's building end;
 *      GA-BOUND-REGION's evidence; the account owing nothing (LAW-12-GK applies through REGION_OF_PERFORMER); the diagram (two grey areas, one
 *      label, the same in both blocks, never a target);
 *   4. scoring and eligibility unchanged: each block's game, the area set aside, is the zone version's game before Z (a TEST-ONLY copy without
 *      the six items, REPORT), its eligibility, regain and restart checks passing as before, his W2 and W3 said as approved;
 *   5. the goal version (EXCHANGED) at 12/1, 12/2 and 11/1: the six withdrawn, its own area at its goal, said as before, its account
 *      applying LAW-12-GK through the goal its goalkeeper's team defends;
 *   6. TEST-ONLY mutations, each refused: off-centre, an 8 m depth, the area at the end of a team with no goalkeeper, two areas for one
 *      goalkeeper team, an end binding where a goal stands, a missing borrows or pairing, the area removed (LAW-12-GK owed, under ENFORCE);
 *   7. the projections proved by their consumers: the fixture's carried region (no object figure may be said for it), the review evidence.
 *
 * Nothing here changes a production file: every TEST-ONLY change is a copy in memory.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/zone-penalty-area.unit.ts
 */
import assert from 'node:assert/strict'

import { boundRegionsRefusals, endRequirementsOf } from '../derivation/bound-regions'
import { loadProvisionalRealizations, loadRegister, loadSportBoundRegions, loadSportDefaultLaws, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { LAW_PREDICATES, lawPredicateRefusal } from '../derivation/default-laws'
import { indexRegister } from '../derivation/register'
import { boundRegionRefusalAfter, boundRegionRefusalBefore } from '../realization/bound-region-check'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import authorizationRecord from '../test-library/library/learning-goal-authorizations.json'
import { reviewActivity } from './activity-review'
import { buildActivity, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { checkFidelity } from './fidelity'
import { liveCheckedActivity, liveSelectionFor } from './live-activity'
import { renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log("the zone version's goalkeeper handling area (Z)")

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const quiet = console.log
const register = loadRegister()
const index = indexRegister(register)
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const R1 = 'A01-R1'
const R2 = 'A01-R2'
const PAIRING = 'FA-MINI-SOCCER-5V5-2026'
const AREA_ITEMS = ['S2-2', 'S5-5', 'S6-2', 'S6-3', 'S7-1', 'S5-6'].map(id => `${R1}-${id}`)
const AREA = `c:provisional:${R1}:${R1}-S2-2`
const LINE = `c:provisional:${R1}:${R1}-S2-1`
const SELECTOR = 'noun=zone & functions ∋ penalty-area'
const CASES = [[12, 1], [12, 2], [11, 1]] as const

// His words (byte-checked against the reply files when recorded).
const I7_HEAD = '7. Goalkeeper handling in the target-zone version'
const I7_A = 'I favor retaining a defined goalkeeper handling area in the target-zone version.'
const I7_B = "The absence of a physical goal shouldn't automatically eliminate the goalkeeper's handling privileges or fundamentally alter the player's functional role during the build-out."
const I7_C = 'My preference is to use the same authorized small-sided penalty-area geometry where appropriate, even when the physical goal is replaced by a target zone.'
const I7_D = "Please verify that this doesn't conflict with the existing scoring and eligibility relationships before modifying the validated zone realization."
const I7_E = "This shouldn't delay testing the goal-based version."
const I2_A = 'The marked progression line should remain outside the penalty area.'
const I2_B = 'The coach should retain flexibility to adjust it within a valid range, but the engine should prevent incompatible geometry through general validation rather than activity-specific restrictions.'
const I8_A = 'Please preserve source traceability and treat the 9 m dimension as provisional until we can verify the authoritative specification.'
const W26 = 'We should avoid inventing a new handling region when an established one can serve the activity.'
const W23 = 'The distinction between physical markings and role-specific scoring relationships must remain intact in the underlying knowledge.'
const I1B = 'a goal’s penalty-area geometry should ordinarily come from the same authorized format. Any exception should be explicit and supported by the intended learning design.'
const HIS_W2 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession; a contested touch, deflection or loose ball does not count.'
const HIS_W3 = 'If the building team loses possession, it cannot score again until the next goalkeeper restart.'

// What a coach is told (DRAFT).
const AREA_SENTENCE = "Mark a penalty area at each end: 15 m wide, centred on the end line, and 9 m deep into the area; inside the one at the building team's end, the goalkeeper can handle the ball as in a normal game"
const OFFSIDE_AND_NORMAL = 'There is no offside; otherwise, normal soccer rules apply during play'
const MOVE_LINE = "You may choose to move the marked line nearer to either end line, but no nearer than 9 m to the building team's end line, so that it stays outside the penalty area; when the roles exchange, set it out again at the same distance from the new building team's end line"
const GOAL_BOX = "Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"

const NO_GOAL = { goal: { count: 0 } }
const FA = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === PAIRING)!
const FA_GOAL = { goal: { count: 1, widthM: FA.object.widthM, type: FA.object.type! } }
const requestOf = (players: number, keepers: number, objects: Record<string, unknown>) =>
    ({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects } }) as any
const productionFile = () => readJson(PROVISIONAL_REALIZATIONS_FILE)
const realizationOf = (file: any, id: string) => file.realizations.find((r: any) => r.id === id)
const itemOf = (file: any, realization: string, id: string) => realizationOf(file, realization).items.find((i: any) => i.id === id)
const build = (objects: Record<string, unknown>, players = 12, keepers = 1, file?: any, drafts = true) =>
    buildActivityUnderAuthorizationRecords(requestOf(players, keepers, objects), learningGoalAuthorizations(), { ...(file ? { realizations: loadProvisionalRealizations(file) } : {}), review: { includeDrafts: drafts } })
const served = (result: { activity: unknown }, what: string) => {
    assert.equal((result.activity as any).outcome, 'served', `${what}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
    return result.activity as ServedActivity
}
const refusedOf = (result: { activity: unknown }) => result.activity as RefusedActivity
const blocksOf = (fixture: any): { blockId: string; fixture: any }[] => fixture.roleBlocks.blocks.map((block: any) => ({ blockId: block.blockId, fixture: block.fixture }))
const texts = (activity: ServedActivity) => activity.rendered.instructions.map(instruction => instruction.text)
const intervalOf = (fixture: any, path: string) => (fixture.status.geometry as any[]).find(g => g.path === path)?.geometry?.interval ?? null
/** TEST-ONLY: the zone version as it was before Z - its six items out (with the goal version's withdrawals of them) and REPORT. */
const beforeZ = () => {
    const file = productionFile()
    const zone = realizationOf(file, R1)
    zone.items = zone.items.filter((i: any) => !AREA_ITEMS.includes(i.id))
    const goal = realizationOf(file, R2)
    goal.withdraws = goal.withdraws.filter((w: any) => !AREA_ITEMS.includes(w.item))
    zone.defaultLawsCheck = { ...zone.defaultLawsCheck, mode: 'REPORT' }
    return file
}
const stored = (players: number, keepers: number, objects: Record<string, unknown>) =>
    ({ playerCount: players, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [KEEPER]: keepers }, objects }) as any
console.log = () => undefined
const live = liveSelectionFor('A01', 'medium')
console.log = quiet
const viaLive = (session: any) => {
    console.log = () => undefined
    try {
        return liveCheckedActivity(session, { learningGoalId: 'A01', practiceSituationId: null, durationMin: 20 }, live)
    } finally {
        console.log = quiet
    }
}

// ── 1. The Sport Profile and the register ──────────────────────────────────────────────────────────────────
test('the Sport Profile: BOUND-REGION-PERFORMER-END whole, permitted where no goal stands, his item 7 words; LAW-12-GK reads REGION_OF_PERFORMER, LAW-14 is unchanged; the loader refuses the form\'s defects', () => {
    const block = loadSportBoundRegions()!
    assert.deepEqual(endRequirementsOf(block), [
        {
            id: 'BOUND-REGION-PERFORMER-END',
            performerEnd: { row: 'P3', whereNoObjectOfKind: 'goal' },
            permitted: true,
            region: { noun: 'zone', function: 'penalty-area' },
            cites: "IFAB Laws of the Game, Law 12 (Fouls and Misconduct: the goalkeeper's handling within its own penalty area) and Law 1.6 (The Penalty Area)",
            because: endRequirementsOf(block)[0].because,
            basis: { words: [I7_A, I7_B, I7_C, W26], citedAs: 'his reply filed 28 October 2026, item 7; his reply filed 26 October 2026, item 7' },
        },
    ])
    const because = endRequirementsOf(block)[0].because
    assert.ok(because.startsWith('OUR READING (ours, DRAFT) of his reply filed 28 October 2026, item 7') && because.includes(`"${W23}"`) && because.includes('Permitted, never required'), because)
    const raw = readJson('stage-b/sport-profile-soccer.json')
    assert.ok(raw.boundRegions.note.includes('AMENDED 25 October 2026 (Z, register version 25)'))
    // LAW-12-GK: one closed predicate in place of REGION_BOUND_TO_OBJECT, the replaced one recorded in a dated line; LAW-14 keeps its own.
    const laws = loadSportDefaultLaws()!
    const handling = laws.laws.find(law => law.id === 'LAW-12-GK')!
    assert.deepEqual(handling.requires, [{ predicate: 'REGION_OF_PERFORMER', function: 'penalty-area', row: 'P3' }])
    const amended = handling.note!.indexOf('AMENDED 25 October 2026 (Z, register version 25)')
    assert.ok(amended > 0 && handling.note!.slice(amended).includes('REGION_BOUND_TO_OBJECT {function: penalty-area, kind: goal}') && handling.note!.slice(amended).includes("'so the zone version still owes this law' is no longer true"))
    assert.ok(handling.note!.slice(0, amended).includes('so the zone version still owes this law'), 'the old words kept')
    assert.deepEqual(laws.laws.find(law => law.id === 'LAW-14')!.requires.map(p => p.predicate), ['REGION_BOUND_TO_OBJECT', 'BOUND_REGION_MARK'])
    // The loader refuses the form's defects, each named (the block whole, never in part).
    const refused = (damage: (requirement: any) => void, pattern: RegExp, what: string) => {
        const profile = copy(raw)
        damage(profile.boundRegions.requirements.find((r: any) => r.id === 'BOUND-REGION-PERFORMER-END'))
        assert.match(boundRegionsRefusals(profile.boundRegions, index).join(' | '), pattern, what)
    }
    assert.deepEqual(boundRegionsRefusals(raw.boundRegions, index), [])
    refused(r => (r.permitted = false), /must say its region is permitted \(permitted true\)/, 'not permitted')
    refused(r => (r.performerEnd.row = 'P2'), /names the row "P2", which is no specialized performer row of the register/, 'no performer row')
    refused(r => (r.performerEnd.whereNoObjectOfKind = 'ball'), /must name exactly the one kind an object requirement binds that function to/, 'a kind nothing binds the function to')
    refused(r => (r.object = { kind: 'goal', whenDefended: true }), /names both an object and a performer's end/, 'both forms')
    refused(r => (r.region.function = 'TEST-ONLY'), /no member of S4's vocabulary/, 'a function off the list')
    refused(r => (r.basis = { words: [], citedAs: 'TEST-ONLY' }), /quotes none of his words/, 'no words of his')
    refused(r => (r.extra = 'TEST-ONLY'), /carries "extra"/, 'an unknown key')
})

test('the register: S7 gains its second, closed form (valueType, note, versions entry 2) in version 25, superseding 24; REGION_OF_PERFORMER is in the closed vocabulary with exactly its arguments', () => {
    const s7 = (register.rows as any[]).find(row => row.id === 'S7')
    assert.ok(s7.valueType.includes('AMENDED 25 October 2026 (register version 25, Z)') && s7.valueType.includes('{performerEnd: <a specialized performer row of the teams>, pairing: <the id of the Sport Profile\'s authorized pairing entry>, borrows: ["region"]}'))
    assert.ok(s7.note.includes(`"${I7_A}"`))
    assert.ok(String(index.vocabularyVersions['S7.valueType']).startsWith('2 (2026-10-25, register version 25, draft)'))
    assert.ok(String(register.version).startsWith('25, adds a second, closed form to the bound-object row, for his reply filed 28 October 2026, item 7'))
    assert.equal(String(register.version).split('Supersedes version 24, which adds one member to the restart-method list').length - 1, 1)
    assert.ok(register.boundRegions.note.includes('AMENDED 25 October 2026 (register version 25, Z)'))
    assert.ok((LAW_PREDICATES as readonly string[]).includes('REGION_OF_PERFORMER'))
    assert.equal(lawPredicateRefusal({ predicate: 'REGION_OF_PERFORMER', function: 'penalty-area', row: 'P3' }, index), null)
    assert.match(String(lawPredicateRefusal({ predicate: 'REGION_OF_PERFORMER', function: 'penalty-area', kind: 'goal' }, index)), /does not take/)
    assert.match(String(lawPredicateRefusal({ predicate: 'REGION_OF_PERFORMER', function: 'penalty-area', row: 'P2' }, index)), /no specialized performer row/)
})

// ── 2. The knowledge ───────────────────────────────────────────────────────────────────────────────────────
test("A01-R1's six items, his words; the area's figures are the goal version's own (his \"the same\"); ENFORCE with a dated line; A01-R2 withdraws the six", () => {
    const file = productionFile()
    const items = AREA_ITEMS.map(id => itemOf(file, R1, id))
    assert.deepEqual(items.map(i => [i.id, i.row, i.selector, i.requirement, i.basis, i.category]), [
        [`${R1}-S2-2`, 'S2', SELECTOR, 'EXISTS', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [`${R1}-S5-5`, 'S5', SELECTOR, 'POSITIONED', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [`${R1}-S6-2`, 'S6', SELECTOR, 'POSITIONED', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [`${R1}-S6-3`, 'S6', SELECTOR, 'RANGE', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [`${R1}-S7-1`, 'S7', SELECTOR, 'EQUALS', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
        [`${R1}-S5-6`, 'S5', 'noun=line & functions ∋ perceptual-reference', 'RANGE', 'OWNER_RULING', 'PROVISIONAL_REALIZATION_CHOICE'],
    ])
    assert.deepEqual(items[4].value, { performerEnd: 'P3', pairing: PAIRING, borrows: ['region'], asAuthored: "the goalkeeper's own penalty area, the FA 5v5 entry's area alone" })
    assert.deepEqual(items[5].value, { term: 'beyond X (for team T)', of: { structuralRef: { contractId: `provisional:${R1}`, itemId: `${R1}-S2-2` }, asAuthored: 'the penalty area' }, forTeam: 'ROLE_HOLDER_BUILDING', asAuthored: 'outside the penalty area' })
    // Every item cites his item 7 (the line's bound his item 2 too, the depth his item 8 too), in his words, with the whole item as evidence.
    for (const item of items) {
        assert.ok(item.citedAs.startsWith('his reply filed 28 October 2026, item') && item.citedAs.includes('7'), item.id)
        assert.ok(item.basisEvidence.includes(`"${I7_A}"`) && item.basisEvidence.includes(`("${I7_HEAD}")`), item.id)
        assert.ok(item.fitNote.startsWith('Added 25 October 2026 (Z).') && item.fitNote.includes(`"${W23}"`), item.id)
    }
    assert.equal(items[0].words, `${I7_A} ${I7_B} ${I7_C}`)
    assert.equal(items[1].words, `${I7_C} … ${I8_A}`)
    assert.equal(items[5].words, `${I2_A} ${I2_B}`)
    assert.ok(items[0].basisEvidence.endsWith(`"${I7_A}" "${I7_B}" "${I7_C}" "${I7_D}" "${I7_E}"`))
    // His "the same": the zone version's area is the goal version's own - depth, width, pairing and provisional status, item for item.
    const goal = (id: string) => itemOf(file, R2, `${R2}-${id}`)
    assert.deepEqual([items[1].value.term, items[1].value.forTeam, items[1].value.offsetM, items[1].provisionalFigure], [goal('S5-1').value.term, goal('S5-1').value.forTeam, goal('S5-1').value.offsetM, goal('S5-1').provisionalFigure])
    assert.equal(items[2].value.term, goal('S6-1').value.term)
    assert.deepEqual([items[3].value, items[3].typedBound], [goal('S6-2').value, goal('S6-2').typedBound])
    assert.equal(items[4].value.pairing, goal('S7-1').value.pairing)
    assert.deepEqual([items[1].value.offsetM.to, items[3].typedBound.max], [FA.region.depthM, FA.region.widthM])
    assert.equal(FA.provisional![0].status, 'PROVISIONAL')
    // ENFORCE, the move said in a dated line, REPORT's words kept; the realization's note gains a dated section.
    const zone = realizationOf(file, R1)
    assert.equal(zone.defaultLawsCheck.mode, 'ENFORCE')
    assert.ok(zone.defaultLawsCheck.because.includes('AMENDED 25 October 2026 (Z)') && zone.defaultLawsCheck.because.includes('Was: REPORT.'))
    assert.ok(zone.note.includes("THE GOALKEEPER'S PENALTY AREA, 25 October 2026 (Z)") && zone.note.includes(`"${I7_E}"`))
    // The goal version withdraws the six, on his 1b words and his item 7, keeping its own area; its check is its own, unchanged.
    const goalVersion = realizationOf(file, R2)
    const withdrawn = goalVersion.withdraws.filter((w: any) => AREA_ITEMS.includes(w.item))
    assert.deepEqual(withdrawn.map((w: any) => w.item), AREA_ITEMS)
    assert.ok(withdrawn.every((w: any) => w.because.includes(`"${I1B}"`) && w.because.includes('his reply filed 28 October 2026, item 7')))
    assert.equal(goalVersion.defaultLawsCheck.mode, 'ENFORCE')
    const loaded = loadProvisionalRealizations().find(r => r.provisionalId === R2)!
    assert.ok(!loaded.items.some(item => AREA_ITEMS.includes(item.itemId)), 'the goal version holds none of the six')
    // The A01 record's strings Z made stale carry dated lines, their old words kept.
    const record = (authorizationRecord as any).authorizations.find((a: any) => a.learningGoalId === 'A01')
    const adjustment = findById(record, 'A01-ADJ-3')
    const laws = record.gaps.find((gap: any) => gap.id === 'D-DEFAULT-LAWS')
    for (const [text, old] of [
        [adjustment.note, 'the zone version, whose line carries no such bound, says exactly what it said.'],
        [laws.description, 'The zone version has no penalty area and is no part of this decision.'],
        [laws.note, 'The zone version is no part of this decision: it still owes the goalkeeper'],
    ] as [string, string][]) {
        const at = text.indexOf('AMENDED 25 October 2026 (Z)')
        assert.ok(at > 0 && text.slice(0, at).includes(old) && text.slice(at).includes(`"${I7_A}"`), old)
    }
})

function findById(node: any, id: string): any {
    if (Array.isArray(node)) {
        for (const entry of node) {
            const found = findById(entry, id)
            if (found) return found
        }
    } else if (node && typeof node === 'object') {
        if (node.id === id) return node
        for (const value of Object.values(node)) {
            const found = findById(value, id)
            if (found) return found
        }
    }
    return null
}

// ── 3. Served ──────────────────────────────────────────────────────────────────────────────────────────────
test('served at 12/1, 12/2 and 11/1: the area said once in Set up, the normal rules close How it works, the adjustment folded; DRAFT; coach and administrator alike; live equals review', () => {
    for (const [players, keepers] of CASES) {
        const what = `zone ${players}/${keepers}`
        const admin = served(build(NO_GOAL, players, keepers), what)
        assert.deepEqual((admin.account.realizationSelection ?? []).map(entry => [entry.realization, entry.outcome]), [[R2, 'NOT_APPLICABLE'], [R1, 'SELECTED']], what)
        const area = admin.rendered.instructions.filter(i => i.text === AREA_SENTENCE)
        assert.deepEqual(area.map(i => [i.section, i.status]), [['Set up', 'DERIVED']], what)
        assert.deepEqual(texts(admin).filter(text => text === OFFSIDE_AND_NORMAL), [OFFSIDE_AND_NORMAL], what)
        assert.deepEqual(texts(admin).filter(text => text.startsWith('You may choose to move the marked line')), [MOVE_LINE], what)
        // The area's sentence sits with the markings: after the end zones, before the targets.
        const setUp = admin.rendered.instructions.filter(i => i.section === 'Set up').map(i => i.text)
        assert.ok(setUp.indexOf(AREA_SENTENCE) === setUp.indexOf('Mark a 5 m end zone across the full width at each end') + 1, what)
        for (const sentence of [AREA_SENTENCE, OFFSIDE_AND_NORMAL, MOVE_LINE]) {
            assert.deepEqual(admin.evidence!.sections.instructions.filter(i => i.text === sentence).map(i => i.wording), ['DRAFT'], `${what}: ${sentence}`)
        }
        assert.equal(admin.integrity.fidelityViolations, 0, what)
        assert.equal(admin.rendered.instructions.length, 29, what)
        assert.equal(new Set(texts(admin)).size, texts(admin).length, `${what}: nothing said twice`)
        const coach = served(build(NO_GOAL, players, keepers, undefined, false), what)
        assert.deepEqual(coach.rendered, admin.rendered, `${what}: the coach reads the same`)
        const review = reviewActivity(stored(players, keepers, NO_GOAL), { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
        assert.deepEqual((viaLive(stored(players, keepers, NO_GOAL)) as { activity: ServedActivity }).activity, review, `${what}: live equals review`)
        // The area's sentence cites the region's binding and the pairing's figures, and both rectangles the layout sets out; the clause the law.
        assert.ok(['space.regions[' + AREA + '].ofObject', `boundRegions.regions[${AREA}].pairing.region.widthM`, `boundRegions.regions[${AREA}].pairing.region.depthM`, 'layout.rectangles[rectangle-1]', 'layout.rectangles[rectangle-2]'].every(path => area[0].parts![0].from.includes(path)), what)
        assert.ok(area[0].parts![1].from.includes('defaultLaws.applied[LAW-12-GK]') && area[0].parts![1].from.includes(`space.regions[${AREA}].position.along`), what)
        assert.deepEqual(area[0].parts![0].bindings.map(binding => [binding.quantity, binding.path]), [[15, `boundRegions.regions[${AREA}].pairing.region.widthM`], [9, `boundRegions.regions[${AREA}].pairing.region.depthM`]], what)
    }
})

test('the area at the building team\'s end in each block (0-9 m, then 31-40 m; 7.5-22.5 m across); GA-BOUND-REGION passes; the account applies LAW-12-GK through REGION_OF_PERFORMER and owes nothing (ENFORCE)', () => {
    for (const [players, keepers] of CASES) {
        const what = `zone ${players}/${keepers}`
        const result = build(NO_GOAL, players, keepers)
        const activity = served(result, what)
        const blocks = blocksOf(result.fixture)
        assert.deepEqual(blocks.map(block => [block.fixture.record.roleBlock.holders.BUILDING, intervalOf(block.fixture, `space.regions[${AREA}].position.along`), intervalOf(block.fixture, `space.regions[${AREA}].position.across`)]), [
            ['TEAM_AT_AXIS_START', { from: 0, to: 9 }, { from: 7.5, to: 22.5 }],
            ['TEAM_AT_AXIS_END', { from: 31, to: 40 }, { from: 7.5, to: 22.5 }],
        ], what)
        // The line held outside the area (its bound, held on the realized geometry), at 20 m in both blocks.
        for (const block of blocks) assert.deepEqual(intervalOf(block.fixture, `space.regions[${LINE}].position.along`), { from: 20, to: 20 }, what)
        // GA-BOUND-REGION, before and after realization, on each block's own game and context.
        for (const block of blocks) {
            const context = { roleBlock: block.fixture.record.roleBlock, designationBindings: block.fixture.record.designationBindings }
            assert.equal(boundRegionRefusalBefore(index, block.fixture.game, block.fixture.envelope, loadSportBoundRegions(), context), null, `${what} ${block.blockId}`)
            assert.equal(boundRegionRefusalAfter(index, block.fixture.game, block.fixture.envelope, loadSportBoundRegions(), context), null, `${what} ${block.blockId}`)
        }
        // The account: ENFORCE, LAW-12-GK applying in both blocks through its new predicate, nothing owed, the normal-rules clause said.
        const account = activity.evidence!.defaultLaws!
        assert.deepEqual([account.mode, account.owed, account.heldSentence!.status], ['ENFORCE', [], 'DRAFT_SAID_NOTHING_OWED'], what)
        for (const block of account.blocks) {
            const handling = block.laws.find(entry => entry.law === 'LAW-12-GK')!
            assert.deepEqual([handling.status, handling.preconditions.map(p => [p.predicate.predicate, p.reading])], ['APPLIES', [['SPECIALIZED_PERFORMER_PRESENT', 'PRESENT'], ['REGION_OF_PERFORMER', 'PRESENT']]], `${what} ${block.blockId}`)
            assert.equal(block.laws.find(entry => entry.law === 'LAW-14' && entry.end === 0)!.status, 'NOT_APPLICABLE', 'no goal: no penalty kick')
        }
        // The review evidence: the region bound to the goalkeeper's end, the pairing whole, borrowing the region alone, in each block.
        assert.deepEqual(activity.evidence!.boundRegions!.blocks.map(block => block.bindings.map(binding => [binding.region, binding.object, binding.performerEnd, binding.borrows, binding.pairing!.id, binding.along])), [
            [[AREA, null, 'P3', ['region'], PAIRING, { from: 0, to: 9 }]],
            [[AREA, null, 'P3', ['region'], PAIRING, { from: 31, to: 40 }]],
        ], what)
    }
})

test('the diagram: both areas grey (no target), one "penalty area" label, the same in both blocks; the description says it is marked at each end line; nothing about another block', () => {
    const activity = served(build(NO_GOAL), 'zone 12/1')
    const diagram = activity.diagram!
    for (const block of diagram.blocks as any[]) {
        assert.deepEqual(block.areas, [
            { along: { from: 0, to: 9 }, across: { from: 7.5, to: 22.5 }, label: 'penalty area' },
            { along: { from: 31, to: 40 }, across: { from: 7.5, to: 22.5 }, label: null },
        ])
        assert.ok(!(block.targets as any[]).some(target => target.across.from === 7.5), 'never a target')
        assert.ok(block.desc.includes('A penalty area 15 m wide and 9 m deep is marked at each end line.'), block.desc)
        assert.ok(!/When you (call|return to) this block/.test(block.desc))
    }
    assert.deepEqual(diagram.legend.filter(entry => entry.kind === 'MARKED_AREA'), [{ kind: 'MARKED_AREA', text: 'penalty area' }])
    assert.equal(activity.diagramDraft!.verdict, 'DRAWN')
})

// ── 4. Scoring and eligibility unchanged ───────────────────────────────────────────────────────────────────
test('scoring and eligibility unchanged: each block\'s game, the area set aside, is the zone version\'s game before Z; the eligibility, regain and restart checks pass as before; W2 and W3 said as approved', () => {
    const aside = (game: any) => {
        const g = copy(game)
        g.space.regions = (g.space.regions as any[]).filter(region => region.elementId !== AREA)
        return g
    }
    for (const [players, keepers] of CASES) {
        const what = `zone ${players}/${keepers}`
        const now = build(NO_GOAL, players, keepers)
        const before = build(NO_GOAL, players, keepers, beforeZ())
        const nowActivity = served(now, what)
        const beforeActivity = served(before, `${what} before Z`)
        blocksOf(now.fixture).forEach((block, n) => assert.deepEqual(aside(block.fixture.game), blocksOf(before.fixture)[n].fixture.game, `${what} block ${n + 1}`))
        // The scoring, eligibility and restart sentences: his approved W2 and W3, and every How to score and Restarts sentence, as before Z.
        for (const section of ['How to score', 'Restarts and ball out', 'Role exchange', 'Players', 'When it ends']) {
            assert.deepEqual(nowActivity.rendered.instructions.filter(i => i.section === section).map(i => i.text), beforeActivity.rendered.instructions.filter(i => i.section === section).map(i => i.text), `${what}: ${section}`)
        }
        assert.ok(texts(nowActivity).includes(HIS_W2) && texts(nowActivity).includes(HIS_W3), what)
        assert.deepEqual(nowActivity.evidence!.sections.instructions.filter(i => i.text === HIS_W2 || i.text === HIS_W3).map(i => i.wording), ['APPROVED', 'APPROVED'], what)
        // Every structural check of both blocks passes, as before Z (the eligibility, the regain, the common restart among them).
        assert.deepEqual(nowActivity.evidence!.structure.summary, beforeActivity.evidence!.structure.summary, what)
        assert.deepEqual(Object.keys(nowActivity.evidence!.structure.summary.gateChecks), ['PASS'], what)
    }
})

// ── 5. The goal version ───────────────────────────────────────────────────────────────────────────────────
test('the goal version (EXCHANGED) at 12/1, 12/2 and 11/1: none of the six, its own area at its goal said as before, LAW-12-GK applying through the goal its goalkeeper\'s team defends', () => {
    for (const [players, keepers] of CASES) {
        const what = `goal ${players}/${keepers}`
        const result = build(FA_GOAL, players, keepers)
        const activity = served(result, what)
        assert.deepEqual((activity.account.realizationSelection ?? []).map(entry => [entry.realization, entry.outcome]), [[R2, 'SELECTED'], [R1, 'NOT_TRIED']], what)
        assert.ok(!JSON.stringify(result.fixture).includes(`${R1}-S2-2`), `${what}: none of the six reach the goal version's games`)
        assert.deepEqual(texts(activity).filter(text => text.includes('penalty area')), [GOAL_BOX, "You may choose to move the marked line nearer to either end line, but no nearer than 9 m to the building team's end line, so that it stays outside the penalty area"], what)
        assert.ok(!texts(activity).some(text => text.includes('at each end')), what)
        for (const block of activity.evidence!.defaultLaws!.blocks) {
            const handling = block.laws.find(entry => entry.law === 'LAW-12-GK')!
            assert.deepEqual([handling.status, handling.preconditions.map(p => [p.predicate.predicate, p.reading])], ['APPLIES', [['SPECIALIZED_PERFORMER_PRESENT', 'PRESENT'], ['REGION_OF_PERFORMER', 'PRESENT']]], what)
            assert.ok(handling.preconditions[1].why.includes(`c:provisional:${R2}:${R2}-S2-1 is bound to c:provisional:${R2}:${R2}-O1-1, defended by the team holding P3`), handling.preconditions[1].why)
        }
        assert.deepEqual(activity.evidence!.boundRegions!.requirements.map(requirement => requirement.id), ['BOUND-REGION-GOAL'], `${what}: the requirement its binding answers to`)
    }
})

// ── 6. Mutations ──────────────────────────────────────────────────────────────────────────────────────────
test('TEST-ONLY mutations, each refused: off-centre, an 8 m depth, the end of a team with no goalkeeper, two areas, an end binding where a goal stands, no borrows or pairing, the area removed', () => {
    const mutated = (damage: (file: any) => void) => {
        const file = productionFile()
        damage(file)
        return file
    }
    const boundReasons = (activity: RefusedActivity) => activity.reasons.filter(reason => reason.includes('GA-BOUND-REGION'))
    // Off-centre, after realization: the realized area moved 1 m across, read by the check on each block's own game.
    const blocks = blocksOf(build(NO_GOAL).fixture)
    for (const block of blocks) {
        const game = copy(block.fixture.game)
        const region = (game.space.regions as any[]).find(r => r.elementId === AREA)
        region.realizedGeometry.position.across.interval = { from: 8.5, to: 23.5 }
        const refusal = boundRegionRefusalAfter(index, game, block.fixture.envelope, loadSportBoundRegions(), { roleBlock: block.fixture.record.roleBlock, designationBindings: block.fixture.record.designationBindings })
        assert.ok(refusal && refusal.cause === 'BOUND_REGION_INVALID' && refusal.why.includes('is centred at 16 m across the area, and a region at a performer\'s end is centred across it (15 m)'), JSON.stringify(refusal))
    }
    // Off-centre as authored (at a touchline): refused at validation in both blocks, never served, never falling back.
    const touchline = refusedOf(build(NO_GOAL, 12, 1, mutated(f => (itemOf(f, R1, `${R1}-S6-2`).value = { term: 'touchline-adjacent', asAuthored: 'TEST-ONLY at a touchline' }))))
    assert.deepEqual([touchline.outcome, touchline.stage, boundReasons(touchline).length], ['refused', 'validation', 2])
    // An 8 m depth: refused at load (one value, one status, P2's loader).
    assert.throws(() => loadProvisionalRealizations(mutated(f => (itemOf(f, R1, `${R1}-S5-5`).value.offsetM = { from: 0, to: 8 }))), /A01-R1-S5-5 states 8 for region\.depthM of FA-MINI-SOCCER-5V5-2026, whose PROVISIONAL value is 9/)
    // The end of the team with no goalkeeper: refused at validation, in both blocks, naming the team that holds one.
    const pressing = refusedOf(build(NO_GOAL, 12, 1, mutated(f => (itemOf(f, R1, `${R1}-S5-5`).value.forTeam = 'ROLE_HOLDER_PRESSING'))))
    assert.deepEqual([pressing.outcome, pressing.stage], ['refused', 'validation'])
    assert.ok(boundReasons(pressing).length === 2 && boundReasons(pressing).every(reason => reason.includes('holds no performer on P3 in this block')), JSON.stringify(boundReasons(pressing)))
    // Two areas for one goalkeeper team (a TEST-ONLY twin of the five area items, told apart by its selector): refused at structure.
    const twins = refusedOf(
        build(NO_GOAL, 12, 1, mutated(f => {
            for (const id of AREA_ITEMS.slice(0, 5)) realizationOf(f, R1).items.push({ ...copy(itemOf(f, R1, id)), id: `${id}-TWIN`, selector: `${SELECTOR} & lateral = wide-left` })
            realizationOf(f, R2).withdraws.push(...AREA_ITEMS.slice(0, 5).map(id => ({ item: `${id}-TWIN`, because: 'TEST-ONLY' })))
        })),
    )
    assert.deepEqual([twins.outcome, twins.stage], ['refused', 'structure'])
    assert.ok(boundReasons(twins).every(reason => reason.includes('are both regions of the function penalty-area bound to the end of') && reason.includes('one is permitted')) && boundReasons(twins).length === 2)
    // An end binding where a goal stands: the check itself, on each block's game with a TEST-ONLY goal on the building team's end line.
    for (const block of blocks) {
        const game = copy(block.fixture.game)
        game.objects.push({ elementId: 'c:TEST-ONLY:GOAL', kind: 'goal', position: { along: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 0 } } } })
        const refusal = boundRegionRefusalBefore(index, game, block.fixture.envelope, loadSportBoundRegions(), { roleBlock: block.fixture.record.roleBlock })
        assert.ok(refusal && refusal.cause === 'BOUND_REGION_INVALID' && refusal.why.includes('c:TEST-ONLY:GOAL, a goal, stands at that end line: where a goal stands, its own requirement governs'), JSON.stringify(refusal))
    }
    // And the goal version with its withdrawal of the six forgotten: refused at structure, never served (measured: the two areas' items collide
    // in derivation, Gate A failing, before GA-BOUND-REGION is reached).
    const forgotten = refusedOf(build(FA_GOAL, 12, 1, mutated(f => (realizationOf(f, R2).withdraws = realizationOf(f, R2).withdraws.filter((w: any) => !AREA_ITEMS.includes(w.item))))))
    assert.deepEqual([forgotten.outcome, forgotten.stage], ['refused', 'structure'])
    assert.ok(forgotten.reasons.some(reason => reason.includes('collision')), JSON.stringify(forgotten.reasons.slice(0, 4)))
    // A missing borrows or pairing: refused at load, and by the check itself on a game carrying such a binding.
    assert.throws(() => loadProvisionalRealizations(mutated(f => delete itemOf(f, R1, `${R1}-S7-1`).value.borrows)), /A01-R1-S7-1 borrows undefined, and a region at a performer's end borrows exactly its pairing's region/)
    assert.throws(() => loadProvisionalRealizations(mutated(f => delete itemOf(f, R1, `${R1}-S7-1`).value.pairing)), /A01-R1-S7-1 cites the pairing undefined, which the Sport Profile does not hold/)
    assert.throws(() => loadProvisionalRealizations(mutated(f => (itemOf(f, R1, `${R1}-S7-1`).value.borrows = ['region', 'object']))), /borrows exactly its pairing's region/)
    for (const [label, damage, expected] of [
        ['no borrows', (binding: any) => delete binding.borrows, 'borrows [] of its pairing'],
        ['no pairing', (binding: any) => delete binding.pairing, 'cites the pairing null'],
        ['both forms', (binding: any) => (binding.structuralRef = { contractId: 'TEST-ONLY', itemId: 'TEST-ONLY' }), 'serves penalty-area, which the Sport Profile binds to an object of the kind goal (or permits at the end of the team holding P3), and is bound to none'],
    ] as [string, (binding: any) => void, string][]) {
        const game = copy(blocks[0].fixture.game)
        damage((game.space.regions as any[]).find(r => r.elementId === AREA).ofObject)
        const refusal = boundRegionRefusalBefore(index, game, blocks[0].fixture.envelope, loadSportBoundRegions(), { roleBlock: blocks[0].fixture.record.roleBlock })
        assert.ok(refusal && refusal.cause === 'BOUND_REGION_INVALID' && refusal.why.includes(expected), `${label}: ${JSON.stringify(refusal)}`)
    }
    // The area removed (its six items out, ENFORCE kept): LAW-12-GK owed in both blocks, refused at validation, naming it.
    const removed = refusedOf(build(NO_GOAL, 12, 1, mutated(f => {
        realizationOf(f, R1).items = realizationOf(f, R1).items.filter((i: any) => !AREA_ITEMS.includes(i.id))
        realizationOf(f, R2).withdraws = realizationOf(f, R2).withdraws.filter((w: any) => !AREA_ITEMS.includes(w.item))
    })))
    assert.deepEqual([removed.outcome, removed.stage, removed.reasons[0]], ['refused', 'validation', `the provisional realization ${R1} holds its activity to the normal laws (ENFORCE), and 2 adaptations are owed`])
    assert.equal(removed.reasons.filter(reason => reason.includes(': LAW-12-GK (') && reason.includes('no region with the function penalty-area belongs to the team holding P3')).length, 2)
})

// ── 7. The projections, proved by their consumers ─────────────────────────────────────────────────────────
test('the projections proved by their consumers: the fixture carries the region with its row and what it borrows (no object figure may be said for it); the review evidence says the region alone', () => {
    const result = build(NO_GOAL)
    const activity = served(result, 'zone 12/1')
    for (const block of blocksOf(result.fixture)) {
        assert.deepEqual(block.fixture.boundRegions.regions.map((entry: any) => [entry.elementId, entry.objectId, entry.performerEnd, entry.borrows, entry.pairing.id]), [[AREA, null, 'P3', ['region'], PAIRING]])
        // Fidelity reads `borrows`: a TEST-ONLY sentence saying the pairing's goal width in feet for this region is refused (the object is never
        // borrowed), where for the goal version's area it is admitted (P1).
        const rendered = renderConcreteGame(block.fixture)
        const at = `boundRegions.regions[${AREA}].pairing.object.widthM`
        const sentence = { section: 'Set up', text: 'A 12 ft goal', status: 'DERIVED', from: [at], quantities: [12], parts: [{ text: 'A 12 ft goal', status: 'DERIVED', from: [at], quantities: [12], bindings: [{ quantity: 12, path: at, as: 'WHOLE_FEET' }] }] } as any
        const findings = checkFidelity(block.fixture, { ...rendered, instructions: [...rendered.instructions, sentence] }).findings
        assert.ok(findings.some(finding => finding.severity === 'VIOLATION' && finding.question === 2 && finding.what.includes('"A 12 ft goal"')), JSON.stringify(findings.filter(f => f.severity === 'VIOLATION')))
    }
    // The review evidence names the pairing and says its region alone is borrowed, at the goalkeeper's end, with the depth PROVISIONAL.
    const evidence = activity.evidence!.sections.instructions.find(entry => entry.text === AREA_SENTENCE)!
    assert.ok(evidence.sources.some(source => source.ref.startsWith(`pairing ${PAIRING}`) && source.detail.includes('its region alone (borrowed at the end of the team holding P3)') && source.detail.includes('9 m deep (provisional)')), JSON.stringify(evidence.sources))
    assert.ok(evidence.sources.some(source => source.standing === 'PROVISIONAL' && source.ref === `pairing ${PAIRING} region.depthM: PROVISIONAL (his reply filed 28 October 2026, item 8)`))
    // The coach is not told the figure is provisional.
    assert.ok(!JSON.stringify([activity.rendered.instructions.map(i => i.text), activity.overview, activity.diagram]).toLowerCase().includes('provisional'))
    assert.equal(buildActivity(requestOf(12, 1, NO_GOAL)).outcome, 'served')
})

console.log(`zone-penalty-area.unit.ts — ${passed} passed`)
