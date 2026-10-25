/**
 * **A region bound to an object, and the specialized performer, said to a coach and drawn** — stage L, 24 October 2026 (the d27 design's
 * stage L, its sections 2.8 and 4.3; every word below is DRAFT, and nothing is served for real: the goal version waits on K1 to K3).
 *
 * Christian, reply filed 26 October 2026, item 7: "Use an existing regulation penalty area when the activity dimensions and setup permit
 * it." "The goalkeeper's handling permissions and restrictions should follow the normal Laws of the Game within that area unless an
 * authorized activity rule explicitly changes them." His reply filed 27 October 2026, item 6: "The goalkeeper should be visually
 * distinguishable from the outfield players." "Stable team identities and clear role labels remain important in the diagram." "Where normal
 * soccer rules remain relevant during live play, they should continue to apply unless explicitly modified." Item 5: "For now, preserve the
 * validated target-zone version without silently adding new handling restrictions." Item 9: "Our objective remains a sophisticated learning
 * environment that is simple for a coach to organize, explain, and administer."
 *
 * What is pinned here (TEST-ONLY copies are labelled and held in memory; no pairing below is knowledge):
 *   1. the DRAFT wording data: the bound region's Set up sentence, the applied law's two clauses and the normal-rules words, each keyed by
 *      register or Sport Profile values with his words, and the loader refusing what it must;
 *   2. physical-layout.ts (TEST-ONLY copies): a region not across the full width is set out once where it stays put (the goal version's
 *      area under the end exchange), once at each end, mirrored, where it alternates with the teams keeping their ends (KEPT), and stops the
 *      layout anywhere else; a line short of a touchline still stops it; production's layout holds no rectangle;
 *   3. the goal version with a TEST-ONLY FA 5v5 pairing (a 12 x 6 ft goal, 3.6576 m; a 15 x 9 m area; the d27 design's section 1.6) at 40 x
 *      30 m under the end exchange: served at 12/1, 12/2 and 11/1, every Details sentence pinned and no more of them than the zone version
 *      has (the design's 4.3); the area's sentence with the pairing's figures, its citations and its section; the goalkeeper's colour in the
 *      Players sentence; the normal rules closing How it works; the account owing nothing (the held sentence said), served under ENFORCE too;
 *   4. the IFAB entry on a TEST-ONLY 45 x 42 m area: the regulation figures said from the pairing (40.32 m, where the realized width is
 *      41.16 - 0.84 in floating point);
 *   5. fidelity's new clauses on TEST-ONLY mutations: the area's sentence dropped, its figures not the pairing's or the pairing not the
 *      region's, a marking without the pairing; the handling clause where the law does not apply, the colour clause lost, an applied law
 *      cited with no words for it; the normal rules lost, said where owed, uncited, twice; a rectangle off its region; Q5's default-law
 *      relationship only where the law applies;
 *   6. the diagram: the area a grey marked area labelled by the Set up sentence's noun (never a target), the goalkeeper's marker with the
 *      goal in both blocks while the team colours change ends, the legend; and the checks refusing a marker without the colour clause, a
 *      mislabelled marker, an unlabelled or undrawn area, and a coach's diagram altered (D9);
 *   7. the review evidence tracing every new sentence, nothing untraced;
 *   8. the goal version under KEPT is refused at structure before any layout (GA-ROLE-EVENTS), never mis-said;
 *   9. production unchanged: A01's zone version says no area, no colour and no normal rules (his item 5), its layout holds no rectangle, and
 *      its account holds the sentence.
 *
 * Re-pointed 24 October 2026 (the completeness audit of the field-test build, item 1; his reply filed 27 October 2026, item 6: "Goalkeeper
 * identification: The goalkeeper should be visually distinguishable from the outfield players. Stable team identities and clear role labels
 * remain important in the diagram."): the colour clause is written for LAW-4-GK (IFAB Law 4.3, the goalkeeper's colours), not for the
 * handling law, so items 1, 3, 5 and 7 read it there, and item 9 changes: the zone version now says the colour (once, citing LAW-4-GK as
 * applied) and still no area, no handling and no normal rules; the handling law owed no longer takes the colour with it, a colour law owed
 * does, and the colour said twice is refused (Q2). The zone version's diagram still holds no goalkeeper marker: a marker is placed with the
 * goal its performer defends, and the zone version has none.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/bound-region-communication.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { SportBoundRegions } from '../derivation/bound-regions'
import { loadProvisionalRealizations, loadRegister, loadSportBoundRegions, loadSportDefaultLaws, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { checkCoachDiagram, coachDiagramOf } from './coach-diagram'
import { appliedLawWordings, boundRegionWording, DRAFT_COACH_WORDING_FILE, draftCoachWordingUnusableBecause, normalLawsWording } from './draft-coach-wording'
import { checkFidelity, FidelityFinding } from './fidelity'
import { checkFieldDiagram, DiagramInput, fieldDiagramDraftOf, keeperLegendText } from './field-diagram'
import { layoutOf } from './physical-layout'
import { Instruction, renderConcreteGame } from './render-concrete-game'
import { appliedLawPath, boundRegionPath, DEFAULT_LAWS_OWED, defaultLawPath } from './rendering-fixture'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('a region bound to an object, and the specialized performer, said and drawn (stage L, DRAFT)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const R2 = 'A01-R2'
const REGION = `c:provisional:${R2}:${R2}-TEST-S2`
const GOAL = `c:provisional:${R2}:${R2}-O1-1`
const LAW = 'LAW-12-GK'
/** The completeness audit, item 1: the law the colour clause is written for (IFAB Law 4.3), since that audit. */
const COLOUR_LAW = 'LAW-4-GK'

/** A TEST-ONLY pairing and the area it sets out: the d27 design's FA 5v5 entry (1.6), and the IFAB entry the profile holds. */
interface Spec {
    id: string
    area: [number, number]
    goal: number
    type: string
    width: number
    depth: number
}
const FA: Spec = { id: 'TEST-ONLY-FA-5V5', area: [40, 30], goal: 3.6576, type: 'scaled', width: 15, depth: 9 }
const IFAB: Spec = { id: 'IFAB-LAW-1', area: [45, 42], goal: 7.32, type: 'full-size', width: 40.32, depth: 16.5 }

/** TEST-ONLY: the profile's bound-region block with the FA 5v5 entry beside the IFAB one (a stand-in for K1, never knowledge). */
const blockWithFa = (): SportBoundRegions => {
    const block = copy(loadSportBoundRegions()!)
    // K1: replace the production FA entry with this test's deliberately labelled copy.
    block.pairings = block.pairings.filter(entry => entry.id !== "FA-MINI-SOCCER-5V5-2026")
    block.pairings.push({
        id: FA.id,
        document: 'TEST-ONLY: The Mini-Soccer and Youth Futsal Handbook (England Football / The FA), the d27 design section 1.6',
        edition: null,
        citedAs: 'TEST-ONLY',
        formatConditions: { players: null, ageBand: null, pitch: null },
        object: { kind: 'goal', type: FA.type, widthM: FA.goal, heightM: 1.8288 },
        region: { function: 'penalty-area', widthM: FA.width, depthM: FA.depth },
        markM: 6,
        borrows: ['object', 'region', 'mark'],
        authority: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' },
        note: 'TEST-ONLY',
    })
    return block
}

/** TEST-ONLY: the record lists the goal version as one that can be tried (its open decisions completed in memory, nothing else). */
const recordsOf = () => {
    const records = learningGoalAuthorizations()
    const record = records.find(r => r.learningGoalId === 'A01') as any
    record.realizations = record.realizations.map((entry: any) => (entry.realization === R2 ? { realization: entry.realization, words: entry.words, citedAs: entry.citedAs } : entry))
    return records
}

/**
 * TEST-ONLY realizations file: A01-R2 with a suitability admitting goals 1-10 m wide and the default-laws check in the mode asked (both
 * stand-ins for his decisions), its testing area moved where asked (as bound-regions.unit.ts moves it), its ends as asked, and the area's
 * items (the region, its two positions, its required width and its binding to the goal, citing the pairing).
 */
const fileFor = (spec: Spec, options: { mode?: 'REPORT' | 'ENFORCE'; ends?: string } = {}) => {
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const variant = file.realizations.find((r: any) => r.id === R2)
    // Re-pointed 24 October 2026 (K2): A01-R2 now records its goal's penalty area (A01-R2-S2-1 to S7-1, the production FA 5v5 pairing,
    // pinned in goal-version-penalty-area.unit.ts). This copy sets out its own TEST-ONLY area items below (each spec's pairing and size), and
    // a defended goal holds exactly one penalty-area zone (BOUND-REGION-GOAL), so the production five are left out of the copy, in memory;
    // everything else is as before.
    // Re-pointed 25 October 2026 (P2): and the item bounding the marked line relative to the penalty area (A01-R2-S5-2, his reply filed 28 October 2026, item 2), which names it.
    variant.items = variant.items.filter((i: any) => i.selector !== 'noun=zone & functions ∋ penalty-area' && i.value?.of?.structuralRef?.itemId !== 'A01-R2-S2-1')
    variant.objectSuitability = [{ kind: 'goal', widthM: { min: 1, max: 10 }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    variant.defaultLawsCheck = { mode: options.mode ?? 'REPORT', because: 'TEST-ONLY: D-DEFAULT-LAWS completed in memory', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }
    if (options.ends) variant.items.find((i: any) => i.id === `${R2}-B10-1`).value = options.ends
    if (spec.area[0] !== 40 || spec.area[1] !== 30) {
        variant.testingBoundaries = { ...variant.testingBoundaries, areas: [{ lengthM: spec.area[0], widthM: spec.area[1] }] }
        const line = file.realizations.find((r: any) => r.id === 'A01-R1').items.find((i: any) => i.id === 'A01-R1-S5-1')
        variant.withdraws.push({ item: line.id, because: 'TEST-ONLY' })
        variant.items.push({ ...line, id: `${R2}-TEST-S5-LINE`, value: { ...line.value, offsetM: { from: spec.area[0] / 2, to: spec.area[0] / 2 } } })
    }
    const template = variant.items.find((i: any) => i.id === `${R2}-O5-1`)
    const item = (suffix: string, row: string, requirement: string, value: unknown, extra: Record<string, unknown> = {}) => ({
        ...template,
        id: `${R2}-TEST-${suffix}`,
        row,
        selector: 'noun=zone & functions ∋ penalty-area',
        requirement,
        value,
        valueStatus: requirement === 'EXISTS' ? 'N/A' : 'REQUIRED_RANGE',
        choice: 'TEST-ONLY',
        words: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        basisEvidence: 'TEST-ONLY',
        fitNote: 'TEST-ONLY',
        ...extra,
    })
    variant.items.push(
        item('S2', 'S2', 'EXISTS', 'N/A'),
        item('S5', 'S5', 'POSITIONED', { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: spec.depth }, asAuthored: 'TEST-ONLY' }),
        item('S6', 'S6', 'POSITIONED', { term: 'central', asAuthored: 'TEST-ONLY' }),
        item('S6-W', 'S6', 'RANGE', `${spec.width} m wide (TEST-ONLY)`, { typedBound: { min: spec.width, max: spec.width } }),
        item('S7', 'S7', 'EQUALS', { structuralRef: { contractId: `provisional:${R2}`, itemId: `${R2}-O1-1` }, pairing: spec.id, asAuthored: 'TEST-ONLY' }),
    )
    return file
}
const sessionOf = (spec: Spec, players: number, keepers: number) => ({ players, lengthM: spec.area[0], widthM: spec.area[1], durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects: { goal: { count: 1, widthM: spec.goal, type: spec.type } } })
const builds = new Map<string, { activity: ServedActivity | RefusedActivity; fixture: any }>()
const goalBuild = (spec: Spec, players: number, keepers: number, options: { mode?: 'REPORT' | 'ENFORCE'; ends?: string; includeDrafts?: boolean } = {}) => {
    const key = JSON.stringify([spec.id, players, keepers, options])
    if (!builds.has(key)) {
        const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(spec, players, keepers) } as any, recordsOf(), {
            realizations: loadProvisionalRealizations(fileFor(spec, options)),
            review: { includeDrafts: options.includeDrafts !== false },
            boundRegions: blockWithFa(),
        })
        builds.set(key, { activity: built.activity, fixture: built.fixture })
    }
    return builds.get(key)!
}
const served = (spec: Spec, players: number, keepers: number, options: { mode?: 'REPORT' | 'ENFORCE'; includeDrafts?: boolean } = {}) => {
    const built = goalBuild(spec, players, keepers, options)
    assert.equal(built.activity.outcome, 'served', `${spec.id} ${players}/${keepers}: ${JSON.stringify((built.activity as RefusedActivity).reasons?.slice(0, 4) ?? null)}`)
    return { activity: built.activity as ServedActivity, fixture: built.fixture }
}
/**
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3): the zone version is built for a session that states it has no goal. Since K3
 * A01's record tries the goal version (A01-R2) first, and a session that has not said what goals it has is asked first (his reply filed 26
 * October 2026, item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as confirmation that no
 * goal exists."); with none stated the zone version is served exactly as before.
 */
const NO_GOAL = { goal: { count: 0 } }
const zoneVersion = (players: number, keepers: number) => {
    const activity = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects: NO_GOAL } } as any, { includeDrafts: true })
    assert.equal(activity.outcome, 'served', `the zone version ${players}/${keepers}: ${JSON.stringify((activity as RefusedActivity).reasons?.slice(0, 4) ?? null)}`)
    return activity as ServedActivity
}
const textsOf = (activity: ServedActivity) => activity.rendered.instructions.map(instruction => `[${instruction.section}] ${instruction.text}`)
const blocksOf = (fixture: any): { blockId: string; fixture: any }[] => (fixture.roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
const bare = (entry: { blockId: string; fixture: any }) => ({ blockId: entry.blockId, fixture: { ...entry.fixture, layout: undefined, remarking: undefined } })
/** Z (25 October 2026): the zone version's own penalty area at the goalkeeper's end, his reply filed 28 October 2026, item 7. */
const ZONE_AREA = 'c:provisional:A01-R1:A01-R1-S2-2'
/** TEST-ONLY (Z): a zone-version block without its own area, for the area cases written before it, which add a TEST-ONLY one. */
const withoutZoneArea = (entry: { blockId: string; fixture: any }) => {
    const fixture = JSON.parse(JSON.stringify(entry.fixture))
    fixture.game.space.regions = fixture.game.space.regions.filter((region: any) => region.elementId !== ZONE_AREA)
    fixture.status.geometry = fixture.status.geometry.filter((g: any) => !g.path.startsWith(`space.regions[${ZONE_AREA}]`))
    return { blockId: entry.blockId, fixture }
}
const violations = (findings: FidelityFinding[]) => findings.filter(finding => finding.severity === 'VIOLATION')
const refused = (findings: FidelityFinding[], question: number, includes: string, what: string) =>
    assert.ok(violations(findings).some(finding => finding.question === question && finding.what.includes(includes)), `${what}: expected Q${question} "${includes}", got ${JSON.stringify(violations(findings).map(f => `Q${f.question} ${f.what}`), null, 1)}`)

const BOX_FA = "Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"
const BOX_IFAB = "Mark the goal's penalty area: 40.32 m wide, centred on the goal, and 16.5 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"
const COLOUR = '; give the goalkeeper a colour neither team wears'
const OFFSIDE_AND_NORMAL = 'There is no offside; otherwise, normal soccer rules apply during play'
/**
 * Added 25 October 2026 (P1): his equipment sentence (his reply filed 28 October 2026, item 3; approved wording, the EQUIPMENT template), said
 * first in Set up where the game's one target object is a goalkeeper-defended goal whose pairing gives its size in whole feet (the TEST-ONLY FA
 * entry's 3.6576 x 1.8288 m: 12 x 6 ft). Its last part tells the goalkeeper apart, citing LAW-4-GK, so the roster no longer does (RC3 3.4).
 */
const HIS_EQUIPMENT = 'One 12 × 6 ft goalkeeper-defended goal, balls, cones or field markers, and two team colors plus a distinct goalkeeper color'
const HIS_EQUIPMENT_COLOUR = ', and two team colors plus a distinct goalkeeper color'
/** The zone version's own equipment (DRAFT, his item 3: "The target-zone version should have its own corresponding requirements."). */
const ZONE_EQUIPMENT_COLOUR = ', and two team colours plus a distinct goalkeeper colour'

// ── 1. The DRAFT wording data ────────────────────────────────────────────────────────────────────────────
test('the DRAFT wording data: the area\'s sentence, the applied law\'s two clauses and the normal-rules words, keyed by register and profile values, each with his words; the loader refuses what it must', () => {
    const area = boundRegionWording('penalty-area', 'goal')!
    assert.deepEqual([area.noun, area.sentence, area.basis.citedAs], ['penalty area', "Mark the {object}'s {region}: {width} wide, centred on the {object}, and {depth} deep into the area", 'his reply filed 26 October 2026, items 7 and 12'])
    assert.ok(area.basis.words.includes('Use an existing regulation penalty area when the activity dimensions and setup permit it.'))
    assert.equal(boundRegionWording('penalty-area', 'ball'), null, 'a kind with no entry has no sentence')
    // Re-pointed 24 October 2026 (the completeness audit, item 1): the handling law holds its clause in a region alone; the colour clause,
    // unchanged (its words, his words and its also), is written for LAW-4-GK. Was: one entry, LAW-12-GK, holding both.
    const [applied, colours] = appliedLawWordings()
    assert.deepEqual([applied.law, applied.inRegion!.words, applied.distinguished], [LAW, 'inside it the {performer} can handle the {carrier} as in a normal game', undefined])
    assert.ok(applied.inRegion!.basis.words.includes("The goalkeeper's handling permissions and restrictions should follow the normal Laws of the Game within that area unless an authorized activity rule explicitly changes them."))
    assert.deepEqual([colours.law, colours.inRegion, colours.distinguished!.words], [COLOUR_LAW, undefined, 'give the {performer} a colour neither team wears'])
    assert.deepEqual(colours.distinguished!.basis, { words: ['The goalkeeper should be visually distinguishable from the outfield players.'], citedAs: 'his reply filed 27 October 2026, item 6' })
    assert.ok(colours.distinguished!.also!.startsWith('IFAB Laws of the Game, Law 4.3'))
    assert.equal(appliedLawWordings().length, 2)
    assert.equal(normalLawsWording()!.words, 'Otherwise, normal soccer rules apply during play')
    assert.ok(normalLawsWording()!.basis.words.includes('Where normal soccer rules remain relevant during live play, they should continue to apply unless explicitly modified.'))
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    assert.equal(draftCoachWordingUnusableBecause(file, index), null)
    const refuses = (alter: (f: any) => void, pattern: RegExp, what: string) => {
        const damaged = copy(file)
        alter(damaged)
        const why = draftCoachWordingUnusableBecause(damaged, index, loadSportDefaultLaws())
        assert.ok(why && pattern.test(why), `${what}: ${why}`)
    }
    refuses(f => (f.boundRegions[0].function = 'TEST-ONLY'), /no member of the register's region-function vocabulary/, 'a function off the vocabulary')
    refuses(f => (f.boundRegions[0].objectKind = 'TEST-ONLY'), /no object kind of the register's vocabulary/, 'a kind off the vocabulary')
    refuses(f => f.boundRegions.push(copy(f.boundRegions[0])), /lists penalty-area bound to goal again/, 'a pair twice')
    refuses(f => (f.boundRegions[0].noun = 'the {region}'), /its noun is missing or holds a slot/, 'a noun with a slot')
    refuses(f => (f.boundRegions[0].sentence = "Mark the {object}'s {region}: {width} wide"), /exactly the slots \{object\}, \{region\}, \{width\} and \{depth\}/, 'a sentence without its depth')
    refuses(f => (f.boundRegions[0].sentence = `${f.boundRegions[0].sentence}.`), /its sentence ends with a full stop/, 'a final full stop')
    refuses(f => (f.boundRegions[0].basis = { words: [], citedAs: 'his reply filed 26 October 2026, item 7' }), /quotes none of his words/, 'no words of his')
    refuses(f => (f.boundRegions[0].approved = true), /carries "approved"/, 'a claim of approval')
    refuses(f => (f.appliedLaws[0].law = 'LAW-99'), /no law the Sport Profile's defaultLaws block names/, 'a law off the profile')
    refuses(f => (f.appliedLaws[0].law = 'LAW-13'), /marks as a restart law/, 'a restart law')
    refuses(f => f.appliedLaws.push(copy(f.appliedLaws[0])), /lists LAW-12-GK again/, 'a law twice')
    refuses(f => (f.appliedLaws[0] = { law: LAW }), /holds no clause/, 'no clause')
    refuses(f => (f.appliedLaws[0].inRegion.words = 'inside it the {object} counts'), /a slot other than \{performer\} and \{carrier\}/, 'a clause with another slot')
    // Re-pointed 24 October 2026 (the completeness audit, item 1): the colour clause is the second entry's (LAW-4-GK). Was appliedLaws[0].
    refuses(f => (f.appliedLaws[1].distinguished.words = 'give everyone a colour'), /a slot other than \{performer\}, each once at least/, 'the colour clause without its performer')
    refuses(f => (f.appliedLaws[0].law = 'LAW-11'), /no precondition of LAW-11 (names a specialized performer|is a region bound to an object)/, 'a clause a law\'s preconditions do not support')
    refuses(f => (f.appliedLaws[1].distinguished.basis = { words: [], citedAs: 'his reply filed 27 October 2026, item 6' }), /quotes none of his words/, 'a clause with no words of his')
    // The completeness audit, item 1: the colours law binds no region, so a clause inside a region is refused for it; and it is listed once.
    refuses(f => (f.appliedLaws[1].inRegion = copy(f.appliedLaws[0].inRegion)), /is said inside a region, and no precondition of LAW-4-GK is a region bound to an object/, 'a region clause for the colours law')
    refuses(f => f.appliedLaws.push(copy(f.appliedLaws[1])), /lists LAW-4-GK again/, 'the colours law twice')
    refuses(f => (f.normalLaws.words = 'Otherwise, normal soccer rules apply during play.'), /normalLaws words end with a full stop/, 'the normal rules with a final full stop')
})

// ── 2. The layout ────────────────────────────────────────────────────────────────────────────────────────
/** TEST-ONLY: a region added to a block's game, realized where asked (a stand-in for a region alternating between the ends under KEPT). */
const withRegion = (entry: { blockId: string; fixture: any }, id: string, along: { from: number; to: number }, across: { from: number; to: number }) => {
    const fixture = copy(entry.fixture)
    fixture.game.space.regions.push({ elementId: id, noun: 'zone' })
    fixture.status.geometry.push({ path: `space.regions[${id}].position.along`, geometry: { axis: 'along', interval: along } }, { path: `space.regions[${id}].position.across`, geometry: { axis: 'across', interval: across } })
    return { blockId: entry.blockId, fixture }
}

test('layoutOf: a region not across the full width is set out once where it stays put, once at each end mirrored where it alternates (KEPT), and stops the layout anywhere else', () => {
    // The goal version under the end exchange: the area stays at the goal, so it is one rectangle, from both blocks, beside the halfway mark.
    const { fixture } = served(FA, 12, 1)
    const goalBlocks = blocksOf(fixture)
    const decision = layoutOf(goalBlocks.map(bare))
    assert.equal(decision.applies, true, decision.why.join(' | '))
    assert.deepEqual(decision.layout!.rectangles, [
        { elementId: 'rectangle-1', along: { from: 0, to: 9 }, across: { from: 7.5, to: 22.5 }, depthM: 9, widthM: 15, end: 0, sources: goalBlocks.map(block => ({ blockId: block.blockId, regionId: REGION, path: `space.regions[${REGION}].position.along` })) },
    ])
    assert.deepEqual(decision.layout!.marks.map(mark => mark.at), [20], "the area's inner edge is its own outline, never a mark across the area")
    assert.deepEqual(decision.layout!.zones, [])
    assert.ok(goalBlocks.every(block => decision.layout!.regions.some(region => region.blockId === block.blockId && region.path === `space.regions[${REGION}].position.along`)), 'each block records its area')
    assert.deepEqual(goalBlocks.map(block => block.fixture.layout), [decision.layout, decision.layout], 'both blocks carry it (RB-L holds them to it)')

    // TEST-ONLY under KEPT: production A01's blocks (the teams keep their ends), with a 9 m by 15 m area at the building team's end in each
    // block - at 0-9 m in block 1 and 31-40 m in block 2: one at each end, of one size, mirrored.
    // Re-pointed 24 October 2026 (K3): the session states no goal (see zoneVersion).
    const zone = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: 1 }, objects: NO_GOAL } } as any)
    // Re-pointed 25 October 2026 (Z): without the zone version's own area (`withoutZoneArea`), which is exactly this TEST-ONLY one since his
    // reply filed 28 October 2026, item 7 (pinned below), so the cases read only the TEST-ONLY box.
    const kept = blocksOf(zone.fixture).map(bare).map(withoutZoneArea)
    const BOX = 'c:TEST-ONLY:BOX'
    const alternating = [withRegion(kept[0], BOX, { from: 0, to: 9 }, { from: 7.5, to: 22.5 }), withRegion(kept[1], BOX, { from: 31, to: 40 }, { from: 7.5, to: 22.5 })]
    const both = layoutOf(alternating)
    assert.equal(both.applies, true, both.why.join(' | '))
    assert.deepEqual(both.layout!.rectangles!.map(r => [r.along, r.across, r.end, r.sources.map(s => s.blockId)]), [
        [{ from: 0, to: 9 }, { from: 7.5, to: 22.5 }, 0, [kept[0].blockId]],
        [{ from: 31, to: 40 }, { from: 7.5, to: 22.5 }, 40, [kept[1].blockId]],
    ])
    assert.deepEqual(both.layout!.marks.map(mark => mark.at), [5, 20, 35], "the zone version's marks are unchanged beside them")
    // Not of one size (8 m in block 2), not touching an end line, or in one block only: it would be re-marked, so the layout stops, saying why.
    const stops = (blocks: { blockId: string; fixture: any }[], what: string) => {
        const found = layoutOf(blocks)
        assert.equal(found.applies, false, what)
        assert.ok(found.why.some(why => why.startsWith(`the region ${BOX}, which does not run across the full width, is not at one place in every block, nor one of one size at each end, mirrored`)), `${what}: ${found.why.join(' | ')}`)
        assert.ok(found.remarking, `${what}: what moves is read`)
    }
    stops([withRegion(kept[0], BOX, { from: 0, to: 9 }, { from: 7.5, to: 22.5 }), withRegion(kept[1], BOX, { from: 32, to: 40 }, { from: 7.5, to: 22.5 })], 'of two sizes')
    stops([withRegion(kept[0], BOX, { from: 10, to: 19 }, { from: 7.5, to: 22.5 }), withRegion(kept[1], BOX, { from: 21, to: 30 }, { from: 7.5, to: 22.5 })], 'touching no end line')
    stops([withRegion(kept[0], BOX, { from: 0, to: 9 }, { from: 7.5, to: 22.5 }), withRegion(kept[1], BOX, { from: 31, to: 40 }, { from: 6, to: 21 })], 'at another place across')
    stops([withRegion(kept[0], BOX, { from: 0, to: 9 }, { from: 7.5, to: 22.5 }), kept[1]], 'in one block only')
    // At one place in every block under KEPT (a TEST-ONLY area at 0-9 m in both): one rectangle, from both blocks.
    const still = layoutOf([withRegion(kept[0], BOX, { from: 0, to: 9 }, { from: 7.5, to: 22.5 }), withRegion(kept[1], BOX, { from: 0, to: 9 }, { from: 7.5, to: 22.5 })])
    assert.deepEqual(still.layout!.rectangles!.map(r => r.sources.length), [2])
    // Re-pointed 25 October 2026 (Z): production now holds this very case - the zone version's own penalty area at the goalkeeper's end (his
    // reply filed 28 October 2026, item 7), at 0-9 m in block 1 and 31-40 m in block 2, set out once at each end. Was: no rectangle.
    const productionLayout = blocksOf(zone.fixture)[0].fixture.layout
    assert.deepEqual(productionLayout.rectangles.map((r: any) => [r.along, r.across, r.end, r.sources.map((source: any) => [source.blockId, source.regionId])]), [
        [{ from: 0, to: 9 }, { from: 7.5, to: 22.5 }, 0, [[kept[0].blockId, ZONE_AREA]]],
        [{ from: 31, to: 40 }, { from: 7.5, to: 22.5 }, 40, [[kept[1].blockId, ZONE_AREA]]],
    ])
})

// ── 3. The goal version said ─────────────────────────────────────────────────────────────────────────────
test('TEST-ONLY FA 5v5 pairing at 40 x 30 m under the end exchange: served at 12/1, every sentence in reading order, no more Details sentences than the zone version', () => {
    const { activity } = served(FA, 12, 1)
    // Re-pointed 25 October 2026 (P1), his reply filed 28 October 2026: his equipment sentence first (item 3); his "Decide which team builds
    // first." (item 4); the roster without the colour clause, which the equipment sentence says (item 3, RC3 3.4); no "The building team
    // starts with the ball" (item 6); his simplified eligibility sentence (item 9); the restart method of item 1 (DRAFT words); and the restart
    // location without the side of the marked line, which the start placement already says (item 6).
    assert.deepEqual(textsOf(activity), [
        `[Set up] ${HIS_EQUIPMENT}`,
        '[Set up] Mark out an area 40 m long by 30 m wide',
        '[Set up] Mark a line across the area at halfway, 20 m from each end line',
        "[Set up] Place a goal centred on the building team's end line, facing into the area, with its frame outside the area; the team with the active goalkeeper defends it",
        `[Set up] ${BOX_FA}`,
        "[Set up] The building team's target zone is everything beyond the marked line, up to the pressing team's end line",
        "[Set up] The pressing team's target is the goal",
        '[Set up] Decide which team builds first',
        '[Players] Divide 12 players into 2 teams: the building team has 6 outfield players and 1 goalkeeper; the pressing team has 5 outfield players',
        '[How it works] When possession changes, play carries on without a stoppage, and each team keeps attacking the same target',
        "[How it works] The building team's goalkeeper starts play, and restarts it whenever the ball is dead: after either team scores, whenever the ball goes out of play, whenever you stop play for a foul, when you judge that an attack has run its course, and whenever you stop play for any other reason",
        '[How it works] Before each of these restarts, the building team and the pressing team each set up on their own side of the marked line; once play restarts, every player is free to move anywhere',
        `[How it works] ${OFFSIDE_AND_NORMAL}`,
        "[How to score] Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score.",
        '[How to score] If the building team loses possession, it cannot score again until the next goalkeeper restart.',
        '[How to score] Pressing team: Score by getting the ball into the goal; an own goal also counts, but winning the ball back does not earn a point on its own',
        '[How to score] Each score is worth 1 point',
        '[When it ends] Play for 20 minutes',
        '[Role exchange] Play in blocks: in each block one team is the building team and the other is the pressing team',
        '[Role exchange] When you call the next block the teams change ends and exchange roles: each role is played from the same end in every block, so each team now attacks the target of its new role, the goal stays where it is, and nothing is re-marked; there is no set block length',
        '[Role exchange] When you call the next block, 1 goalkeeper and 1 outfield player move to the team that becomes the building team, the goalkeeper staying with the goal',
        "[Restarts and ball out] The building team's goalkeeper restarts play by passing, rolling, throwing or dribbling the ball into play",
        "[Restarts and ball out] You choose where the building team's goalkeeper restarts play, consistent with the intended build-out situation",
        '[Restarts and ball out] There are no throw-ins, corners, goal kicks, free kicks or penalties in this activity; fouls still matter, so deal with them appropriately',
        '[Adjusting the activity] You may choose to add a pressing player; with every player already in a team, reallocate someone or introduce an additional player: adding a pressing player can increase pressure but may also expose space behind the press',
        "[Adjusting the activity] You may choose to remove a build-out player, deciding where that player goes so every player is still accounted for, reducing the building team's available support options",
        // P2 (25 October 2026): unchanged here. This TEST-ONLY copy sets out its own area and leaves out the production bound on the line
        // (A01-R2-S5-2, which names the production area), so no bound limits the line: the range comes from knowledge, never from an area's
        // presence (the production sentence is pinned in goal-version-communication.unit.ts and geometry-compatibility.unit.ts).
        '[Adjusting the activity] You may choose to move the marked line nearer to either end line',
        '[Adjusting the activity] You may choose to change where the teams start when the pressure you see is not creating an appropriate challenge',
    ])
    assert.deepEqual(activity.rendered.withheld, [])
    assert.ok(activity.rendered.instructions.every(instruction => instruction.block === undefined), 'the blocks say the same words')
    // The design's 4.3: the goal version's count is no higher than the zone version's (the normal rules are folded into the offside sentence).
    assert.equal(activity.rendered.instructions.length, 28)
    assert.ok(activity.rendered.instructions.length <= zoneVersion(12, 1).rendered.instructions.length)
    assert.equal(activity.integrity.fidelityViolations, 0)
    assert.ok(activity.overview && activity.diagram, 'the overview and the diagram are served')
})

test('at 12/2 and 11/1 the same area, colour and normal rules; the counts as the roster has them', () => {
    for (const [players, keepers] of [[12, 2], [11, 1]]) {
        const { activity } = served(FA, players, keepers)
        const texts = activity.rendered.instructions.map(instruction => instruction.text)
        for (const text of [BOX_FA, OFFSIDE_AND_NORMAL]) assert.ok(texts.includes(text), `${players}/${keepers}: ${text}`)
        // Re-pointed 25 October 2026 (P1): the colour is said by his equipment sentence, first in Set up, and not by the roster (RC3 3.4).
        const roster = activity.rendered.instructions.find(instruction => instruction.section === 'Players')!
        assert.ok(!roster.text.endsWith(COLOUR), `${players}/${keepers}: ${roster.text}`)
        assert.equal(activity.rendered.instructions[0].text, HIS_EQUIPMENT, `${players}/${keepers}`)
        assert.ok(activity.rendered.instructions.length <= zoneVersion(players, keepers).rendered.instructions.length, `${players}/${keepers}`)
    }
})

test("the area's sentence: the pairing's figures bound to its leaves, the region, binding, object and rectangle cited; the clause cites the law as applied; placed in Set up", () => {
    const { activity, fixture } = served(FA, 12, 1)
    const box = activity.rendered.instructions.find(instruction => instruction.text === BOX_FA)!
    const widthAt = `${boundRegionPath(REGION)}.pairing.region.widthM`
    const depthAt = `${boundRegionPath(REGION)}.pairing.region.depthM`
    assert.deepEqual(box.parts!.map(part => [part.text, part.status, part.bindings]), [
        ["Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area", 'DERIVED', [{ quantity: 15, path: widthAt }, { quantity: 9, path: depthAt }]],
        ['; inside it the goalkeeper can handle the ball as in a normal game', 'DERIVED', []],
    ])
    const base = `space.regions[${REGION}]`
    assert.deepEqual(box.parts![0].from, [`${base}.noun`, `${base}.functions`, `${base}.functions[penalty-area]`, `${base}.position.along`, `${base}.position.across`, `${base}.ofObject`, `objects[${GOAL}].kind`, widthAt, depthAt, 'layout.rectangles[rectangle-1]'])
    const ball = (fixture.roleBlocks.blocks[0].fixture.game.objects as any[]).find(object => object.kind === 'ball')
    assert.deepEqual(box.parts![1].from, [appliedLawPath(LAW), `objects[${ball.elementId}].kind`])
    assert.equal(box.section, 'Set up')
    // The carried pairing is the TEST-ONLY entry, whole.
    assert.deepEqual(fixture.roleBlocks.blocks[0].fixture.boundRegions.regions.map((entry: any) => [entry.elementId, entry.objectId, entry.pairing.id, entry.pairing.region]), [[REGION, GOAL, FA.id, { function: 'penalty-area', widthM: 15, depthM: 9 }]])
})

// Re-pointed 24 October 2026 (the completeness audit, item 1): the colour clause closes the roster where the colours law applies (wherever a
// goalkeeper plays), citing LAW-4-GK; the zone version says it too, once, and none of the others. Was: where the handling law applies, and
// the zone version said none of them.
// Re-pointed 25 October 2026 (P1; his reply filed 28 October 2026, item 3, with RC3 3.4): the colour is said by the equipment sentence's last
// part (his words in the goal version, our DRAFT mirror in the zone version), citing LAW-4-GK as the roster clause did; the roster says it no more.
test('the colour is told once, by the equipment sentence, where the colours law applies; the normal rules close How it works where nothing is owed; each cites the account, and the zone version says the colour once (since Z, with its own area\'s handling clause and the normal rules)', () => {
    const { activity } = served(FA, 12, 1)
    const roster = activity.rendered.instructions.find(instruction => instruction.section === 'Players')!
    assert.ok(!roster.parts!.some(part => part.from.includes(appliedLawPath(COLOUR_LAW))), 'the roster cites no colours law')
    const equipment = activity.rendered.instructions[0]
    const colour = equipment.parts![equipment.parts!.length - 1]
    assert.deepEqual([equipment.section, colour.text, colour.from], ['Set up', HIS_EQUIPMENT_COLOUR, ['performers.teams', appliedLawPath(COLOUR_LAW), `performers.teams[].${KEEPER}`]])
    const how = activity.rendered.instructions.find(instruction => instruction.text === OFFSIDE_AND_NORMAL)!
    assert.deepEqual(how.parts!.map(part => [part.text, part.from]), [
        ['There is no offside', [defaultLawPath('LAW-11')]],
        ['; otherwise, normal soccer rules apply during play', [DEFAULT_LAWS_OWED]],
    ])
    assert.equal(how.section, 'How it works')
    // The zone version owes the handling law (his item 5 keeps it open): no area, no handling words, no normal rules. Re-pointed 24 October
    // 2026 (the completeness audit, item 1): and the colour, once, closing its roster, citing LAW-4-GK as applied (a goalkeeper plays in it,
    // and changes team at every exchange). Was: no colour either.
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const zone = zoneVersion(players, keepers)
        // Re-pointed 25 October 2026 (P1): every sentence but the equipment sentence (which says the colour, citing the law) says none of these.
        const others = zone.rendered.instructions.filter(instruction => !instruction.from.includes(appliedLawPath(COLOUR_LAW)))
        assert.equal(others.length, zone.rendered.instructions.length - 1, `${players}/${keepers}: one sentence cites the colours law`)
        /**
         * Re-pointed 25 October 2026 (Z): since his reply filed 28 October 2026, item 7 the zone version holds the goalkeeper's own penalty
         * area and owes nothing: its area's sentence closes with the handling clause (its own words for an area marked at each end, citing the
         * handling law as applied), and How it works closes with the normal-rules clause, as the goal version's does. Was: no area, no handling
         * words, no normal rules, its offside sentence alone.
         */
        const said = JSON.stringify(others.map(instruction => [instruction.text, instruction.from]))
        assert.ok(!said.includes('colour'), `${players}/${keepers}: "colour"`)
        const area = others.find(instruction => instruction.text.startsWith('Mark a penalty area at each end'))!
        assert.deepEqual(area.parts!.map(part => part.text), ['Mark a penalty area at each end: 15 m wide, centred on the end line, and 9 m deep into the area', "; inside the one at the building team's end, the goalkeeper can handle the ball as in a normal game"], `${players}/${keepers}`)
        assert.ok(area.parts![1].from.includes(appliedLawPath(LAW)), `${players}/${keepers}: the clause cites the handling law as applied`)
        assert.equal(others.filter(instruction => instruction.from.some(path => path.startsWith('defaultLaws.applied'))).length, 1, `${players}/${keepers}: only the area's sentence cites a law as applied, beside the equipment's colour`)
        const colours = zone.rendered.instructions.flatMap(instruction => (instruction.parts ?? []).filter(part => part.text.includes('colour')).map(part => [instruction.section, part.text, part.from]))
        assert.deepEqual(colours, [['Set up', ZONE_EQUIPMENT_COLOUR, ['performers.teams', appliedLawPath(COLOUR_LAW), `performers.teams[].${KEEPER}`]]], `${players}/${keepers}: the colour, once`)
        assert.equal(zone.integrity.fidelityViolations, 0, `${players}/${keepers}`)
        const zoneHow = zone.rendered.instructions.find(instruction => instruction.text === OFFSIDE_AND_NORMAL)!
        assert.deepEqual(zoneHow.parts!.map(part => [part.text, part.from]), [['There is no offside', [defaultLawPath('LAW-11')]], ['; otherwise, normal soccer rules apply during play', [DEFAULT_LAWS_OWED]]], `${players}/${keepers}: the normal rules close How it works`)
    }
})

test('the IFAB entry on a TEST-ONLY 45 x 42 m area: the regulation figures said from the pairing, though the realized width differs in the last bit', () => {
    const { activity, fixture } = served(IFAB, 12, 1)
    assert.ok(activity.rendered.instructions.some(instruction => instruction.text === BOX_IFAB), activity.rendered.instructions.map(i => i.text).join(' | '))
    const across = (fixture.roleBlocks.blocks[0].fixture.status.geometry as any[]).find(g => g.path === `space.regions[${REGION}].position.across`).geometry.interval
    assert.notEqual(across.to - across.from, 40.32, 'the realized width is 41.16 - 0.84 in floating point')
    assert.ok(Math.abs(across.to - across.from - 40.32) < 1e-9)
    assert.equal(activity.integrity.fidelityViolations, 0)
})

test('the account owes nothing, so the held sentence is said (DRAFT_SAID_NOTHING_OWED); under ENFORCE the goal version is served as under REPORT', () => {
    const { activity } = served(FA, 12, 1)
    const account = activity.evidence!.defaultLaws!
    assert.deepEqual(account.owed, [])
    assert.deepEqual(account.blocks.map(block => block.laws.filter(entry => entry.law === LAW).map(entry => entry.status)), [['APPLIES'], ['APPLIES']])
    // The completeness audit, item 1: and the goalkeeper's colours, in both blocks.
    assert.deepEqual(account.blocks.map(block => block.laws.filter(entry => entry.law === COLOUR_LAW).map(entry => entry.status)), [['APPLIES'], ['APPLIES']])
    assert.equal(account.heldSentence!.status, 'DRAFT_SAID_NOTHING_OWED')
    // Re-pointed 25 October 2026 (Z): the zone version owes nothing too since his reply filed 28 October 2026, item 7, so it says it. Was held.
    assert.equal(zoneVersion(12, 1).evidence!.defaultLaws!.heldSentence!.status, 'DRAFT_SAID_NOTHING_OWED', 'the zone version says it too')
    const enforced = served(FA, 12, 1, { mode: 'ENFORCE' }).activity
    assert.deepEqual(enforced.rendered.instructions.map(i => i.text), activity.rendered.instructions.map(i => i.text))
})

// ── 5. Fidelity ──────────────────────────────────────────────────────────────────────────────────────────
test("fidelity refuses (TEST-ONLY mutations): the area's sentence dropped, its figures not the pairing's, the pairing not the region's, a marking without the pairing, a rectangle off its region", () => {
    const { fixture } = served(FA, 12, 1)
    const block = copy(fixture.roleBlocks.blocks[0].fixture)
    const rendered = renderConcreteGame(block)
    assert.deepEqual(violations(checkFidelity(block, rendered).findings), [], 'the block as served')
    const isBox = (instruction: Instruction) => instruction.text === BOX_FA
    // Dropped: Q5 (no marking instruction), Q3 (its binding uncarried) and Q5-L (the rectangle and the region's position said by nothing).
    const dropped = checkFidelity(block, { ...rendered, instructions: rendered.instructions.filter(i => !isBox(i)) }).findings
    refused(dropped, 5, `region ${REGION} exists in the game and has no marking instruction`, 'dropped')
    refused(dropped, 3, `space.regions[${REGION}].ofObject is established by the game and no instruction carries it`, 'dropped')
    refused(dropped, 5, '(layout.rectangles[rectangle-1]) is set out once and no Set up sentence tells the coach to mark it', 'dropped')
    refused(dropped, 3, `the game's default-laws account records ${LAW} as applying, and no sentence marking ${REGION} tells the coach`, 'dropped')
    // The carried pairing's figures altered (TEST-ONLY): not the region's realized size, and the renderer says nothing of it.
    const wider = copy(block)
    wider.boundRegions.regions[0].pairing.region.widthM = 16
    refused(checkFidelity(wider, rendered).findings, 2, `${FA.id} gives 16 m by 9 m, and the region is realized 15 m wide and 9 m deep`, 'figures off the region')
    assert.ok(!renderConcreteGame(wider).instructions.some(instruction => instruction.from.includes(`space.regions[${REGION}].noun`)), 'the renderer does not say a pairing that is not the region\'s size, in any words')
    // The carried pairing is another entry than the one the region cites.
    const other = copy(block)
    other.boundRegions.regions[0].pairing.id = 'TEST-ONLY-OTHER'
    refused(checkFidelity(other, rendered).findings, 2, `the carried pairing is TEST-ONLY-OTHER and the region cites ${FA.id}`, 'another pairing')
    // A marking that does not take its figures from the pairing (its leaves uncited).
    const uncited = copy(rendered)
    const box = uncited.instructions.find(isBox)!
    box.parts![0].from = box.parts![0].from.filter(path => !path.startsWith('boundRegions'))
    box.parts![0].bindings = []
    box.parts![0].quantities = []
    box.from = [...new Set(box.parts!.flatMap(part => part.from))]
    box.quantities = []
    refused(checkFidelity(block, uncited).findings, 2, `marks ${REGION}, which is bound to ${GOAL}, and does not take its width and depth from the pairing it cites`, 'uncited')
    // A rectangle off its region (TEST-ONLY layout).
    const shifted = copy(block)
    shifted.layout.rectangles[0].across = { from: 7, to: 22 }
    refused(checkFidelity(shifted, rendered).findings, 5, `and the region set out once as layout.rectangles[rectangle-1] is 0-9 m along and 7-22 m across`, 'rectangle off its region')
})

test('fidelity refuses: the handling clause where the law does not apply, the colour clause lost, an applied law cited with no words; Q5 reads the default law only where it applies', () => {
    const { fixture } = served(FA, 12, 1)
    const block = copy(fixture.roleBlocks.blocks[0].fixture)
    const rendered = renderConcreteGame(block)
    // TEST-ONLY: the account owes the handling law. The rendering as served is refused (the clause, the normal rules), the renderer then
    // says neither, and the area has no relationship left (Q5). Re-pointed 24 October 2026 (the completeness audit, item 1): the colour rests
    // on LAW-4-GK, which still applies, so it is neither refused nor dropped (as in the zone version, which owes the handling law). Was: the
    // colour refused and dropped with the handling.
    const owing = copy(block)
    owing.defaultLaws.laws = owing.defaultLaws.laws.map((entry: any) => (entry.law === LAW ? { ...entry, status: 'ADAPTATION_OWED' } : entry))
    const asServed = checkFidelity(owing, rendered).findings
    refused(asServed, 2, `says what ${LAW} gives the coach, and the game's default-laws account does not record ${LAW} as applying at every place`, 'owed')
    refused(asServed, 2, `says the normal rules apply, and the game's default-laws account owes an adaptation of ${LAW}`, 'owed')
    refused(asServed, 5, `a coach is instructed to mark ${REGION}, and nothing in the concrete game establishes what changes`, 'owed: no relationship')
    assert.ok(!violations(asServed).some(finding => finding.what.includes(COLOUR_LAW) || finding.what.includes('colour')), JSON.stringify(violations(asServed).map(f => f.what)))
    const reRendered = renderConcreteGame(owing).instructions.map(i => i.text)
    assert.ok(reRendered.includes("Mark the goal's penalty area: 15 m wide, centred on the goal, and 9 m deep into the area") && !reRendered.some(text => text.includes('handle') || text.includes('normal soccer rules')), reRendered.join(' | '))
    // Re-pointed 25 October 2026 (P1): the colour is still said, by his equipment sentence (the roster no longer closes with it).
    assert.equal(reRendered.filter(text => text.endsWith(HIS_EQUIPMENT_COLOUR)).length, 1, 'the colour is still told, by the equipment sentence')
    assert.equal(reRendered.filter(text => text.endsWith(COLOUR)).length, 0, 'and not by the roster')
    // The completeness audit, item 1 (TEST-ONLY): the account records the colours law as not applying (a stand-in for a game holding no
    // goalkeeper). The colour as served is refused (Q2), and the renderer says no colour.
    const uncoloured = copy(block)
    uncoloured.defaultLaws.laws = uncoloured.defaultLaws.laws.map((entry: any) => (entry.law === COLOUR_LAW ? { ...entry, status: 'NOT_APPLICABLE' } : entry))
    refused(checkFidelity(uncoloured, rendered).findings, 2, `says what ${COLOUR_LAW} gives the coach, and the game's default-laws account does not record ${COLOUR_LAW} as applying at every place`, 'colours law not applying')
    assert.ok(!renderConcreteGame(uncoloured).instructions.some(i => i.text.includes('colour')), 'no colour said where the colours law does not apply')
    assert.deepEqual(violations(checkFidelity(uncoloured, renderConcreteGame(uncoloured)).findings).filter(f => f.what.includes('colour')), [], 'and none required')
    // As served, the area's relationship is the law (a NOTE naming it).
    assert.ok(checkFidelity(block, rendered).findings.some(f => f.question === 5 && f.severity === 'NOTE' && f.what === `${REGION} participates operationally via ${appliedLawPath(LAW)} (${LAW} applies inside it, as the game's default-laws account records)`))
    // The colour lost where the law applies (Q3). Re-pointed 25 October 2026 (P1): the colour is the equipment sentence's last part, so the
    // mutation takes the equipment sentence out; neither the roster nor an equipment sentence then tells the coach.
    const noColour = copy(rendered)
    noColour.instructions = noColour.instructions.filter(i => !i.text.endsWith(HIS_EQUIPMENT_COLOUR))
    // Re-pointed 24 October 2026 (the completeness audit, item 1): the law named is the colours law. Was LAW-12-GK.
    refused(checkFidelity(block, noColour).findings, 3, `records ${COLOUR_LAW} as applying, and neither the roster sentence nor an equipment sentence tells the coach "give the goalkeeper a colour neither team wears"`, 'colour lost')
    // The completeness audit, item 1, a new clause (a tightening): the colour said twice is refused (Q2). Re-pointed 25 October 2026 (P1): here
    // the roster's clause said again beside the equipment sentence's words (both are counted: they tell the same performer apart).
    const twice = copy(rendered)
    const doubled = twice.instructions.find(i => i.section === 'Players')!
    doubled.parts = [...doubled.parts!, { ...copy(doubled.parts![0]), text: COLOUR, from: [appliedLawPath(COLOUR_LAW), `performers.teams[].${KEEPER}`], quantities: [], bindings: [] }]
    doubled.text = doubled.parts.map(part => part.text).join('')
    doubled.from = [...new Set(doubled.parts.flatMap(part => part.from))]
    refused(checkFidelity(block, twice).findings, 2, `2 statements tell the coach "give the goalkeeper a colour neither team wears"`, 'colour said twice')
    assert.deepEqual(violations(checkFidelity(block, rendered).findings), [], 'the block as served')
    // A part citing the law as applied that says none of its clauses. Re-pointed 25 October 2026 (P1): the equipment sentence's colour part.
    const wrongWords = copy(rendered)
    const said = wrongWords.instructions.find(i => i.text.endsWith(HIS_EQUIPMENT_COLOUR))!
    said.parts![said.parts!.length - 1].text = ', and give everyone bibs'
    said.text = said.parts!.map(part => part.text).join('')
    // Re-pointed 24 October 2026 (the completeness audit, item 1): the part altered is the colour clause's, which cites LAW-4-GK. Was LAW-12-GK.
    refused(checkFidelity(block, wrongWords).findings, 2, `cites ${appliedLawPath(COLOUR_LAW)} and says none of the words written for ${COLOUR_LAW}`, 'wrong words')
    // A law cited as applied that the data writes nothing for (LAW-8, TEST-ONLY): nothing else may cite the account.
    const stray = copy(rendered)
    stray.instructions.find(i => i.section === 'Players')!.parts![0].from.push(appliedLawPath('LAW-8'))
    stray.instructions.find(i => i.section === 'Players')!.from.push(appliedLawPath('LAW-8'))
    refused(checkFidelity(block, stray).findings, 2, `cites ${appliedLawPath('LAW-8')}, a part of the game's default-laws account for which no sentence is written`, 'stray')
})

test('fidelity refuses the normal rules lost where nothing is owed, uncited, said twice, or cited without its words', () => {
    const { fixture } = served(FA, 12, 1)
    const block = copy(fixture.roleBlocks.blocks[0].fixture)
    const rendered = renderConcreteGame(block)
    const isHow = (instruction: Instruction) => instruction.text === OFFSIDE_AND_NORMAL
    const offsideOnly = copy(rendered)
    const how = offsideOnly.instructions.find(isHow)!
    how.parts = how.parts!.slice(0, 1)
    how.text = how.parts[0].text
    how.from = [...how.parts[0].from]
    refused(checkFidelity(block, offsideOnly).findings, 3, 'owes nothing, and no sentence tells the coach "Otherwise, normal soccer rules apply during play"', 'lost')
    const uncited = copy(rendered)
    const normal = uncited.instructions.find(isHow)!
    normal.parts![1].from = [defaultLawPath('LAW-11')]
    normal.from = [defaultLawPath('LAW-11')]
    refused(checkFidelity(block, uncited).findings, 2, `says the normal rules apply and does not cite ${DEFAULT_LAWS_OWED}`, 'uncited')
    const twice = copy(rendered)
    twice.instructions.push({ section: 'How it works', text: 'Otherwise, normal soccer rules apply during play', status: 'DERIVED', from: [DEFAULT_LAWS_OWED], quantities: [], parts: [{ text: 'Otherwise, normal soccer rules apply during play', status: 'DERIVED', from: [DEFAULT_LAWS_OWED], quantities: [], bindings: [] }] } as Instruction)
    refused(checkFidelity(block, twice).findings, 2, '2 sentences say the normal rules apply', 'twice')
    const without = copy(rendered)
    without.instructions.find(i => i.section === 'Players')!.from.push(DEFAULT_LAWS_OWED)
    without.instructions.find(i => i.section === 'Players')!.parts![0].from.push(DEFAULT_LAWS_OWED)
    refused(checkFidelity(block, without).findings, 2, `cites ${DEFAULT_LAWS_OWED} and does not say "Otherwise, normal soccer rules apply during play"`, 'cited without its words')
})

// ── 6. The diagram ───────────────────────────────────────────────────────────────────────────────────────
const diagramInputOf = (activity: ServedActivity, fixture: any): DiagramInput => {
    const games = blocksOf(fixture).map(block => ({ blockId: block.blockId, holders: { ...(block.fixture.record?.roleBlock?.holders ?? {}) }, fixture: block.fixture, rendered: renderConcreteGame(block.fixture).instructions }))
    return { session: activity.session, games, served: activity.rendered.instructions, roleBlocks: activity.roleBlocks!.blocks.map(block => ({ blockId: block.blockId, holders: { ...block.holders } })), index }
}

test('the diagram: the area grey and labelled by the Set up sentence\'s noun, never a target; the goalkeeper\'s marker with the goal in both blocks while the team colours change ends; the legend', () => {
    const { activity } = served(FA, 12, 1)
    const diagram = activity.diagram!
    for (const block of diagram.blocks) {
        assert.deepEqual(block.areas, [{ along: { from: 0, to: 9 }, across: { from: 7.5, to: 22.5 }, label: 'penalty area' }])
        assert.deepEqual(block.keepers, [{ along: { from: 0, to: 0 }, across: { from: 13.1712, to: 16.8288 }, label: KEEPER }])
        assert.deepEqual(block.zones, [], 'no marked zone: the area is no zone and never a target')
        assert.ok(!block.targets.some(target => target.along.from === 0 && target.along.to === 9), 'the area is no target')
        assert.ok(block.desc.includes('A penalty area 15 m wide and 9 m deep is marked at the building team\'s end line.') && block.desc.includes(`The ${KEEPER} wears a colour of its own and defends the goal.`), block.desc)
    }
    // The team colours follow the realized teams across the end exchange; the marker stays at the goal.
    const teamA = (block: any) => block.teams.find((team: any) => team.label === 'Team A')
    assert.deepEqual([teamA(diagram.blocks[0]).attacks, teamA(diagram.blocks[1]).attacks], [[40], [0]])
    assert.deepEqual(diagram.blocks[0].keepers, diagram.blocks[1].keepers)
    assert.deepEqual(diagram.legend.slice(-2), [{ kind: 'MARKED_AREA', text: 'penalty area' }, { kind: 'KEEPER', text: keeperLegendText(KEEPER) }])
})

test('the diagram\'s checks refuse a marker with no colour clause, a mislabelled marker, an unlabelled or undrawn area, and a coach\'s diagram altered (D9)', () => {
    const { activity, fixture } = served(FA, 12, 1)
    const input = diagramInputOf(activity, fixture)
    const draft = fieldDiagramDraftOf(input)
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings))
    const model = draft.diagram!
    const findingsOf = (alter: (m: any) => void, inputOf: DiagramInput = input) => {
        const altered = copy(model)
        alter(altered)
        return checkFieldDiagram(altered, inputOf)
    }
    const expect = (findings: { rule: string; what: string }[], rule: string, includes: string, what: string) => assert.ok(findings.some(f => f.rule === rule && f.what.includes(includes)), `${what}: ${JSON.stringify(findings)}`)
    expect(findingsOf(m => (m.blocks[0].keepers[0].label.text = 'TEST-ONLY')), 'D2', 'is labelled "TEST-ONLY", and the object is defended by the', 'mislabelled marker')
    expect(findingsOf(m => (m.blocks[0].markings.areas[0].label = null)), 'D6', 'the marked area rectangle-1 is labelled by nothing', 'unlabelled area')
    expect(findingsOf(m => (m.blocks[0].markings.areas = [])), 'D3', 'Set up marks rectangle-1 and it is not drawn', 'undrawn area')
    expect(findingsOf(m => delete m.blocks[0].keepers), 'D2', 'gives the goalkeeper defending', 'marker dropped')
    // TEST-ONLY: the served sentences without the one telling the goalkeeper apart: the marker is refused, and the model built from it draws
    // none. Re-pointed 25 October 2026 (P1): that sentence is the equipment sentence (his reply filed 28 October 2026, item 3), whose colour
    // part the diagram reads now (`colourClauseIn`), so its colour part is taken out. Was: the roster's colour clause.
    const noColour = copy(input)
    noColour.index = index
    const withoutColour = (instructions: Instruction[]) =>
        instructions.map(i => (i.text.endsWith(HIS_EQUIPMENT_COLOUR) ? { ...i, parts: i.parts!.slice(0, -1), text: i.text.slice(0, -HIS_EQUIPMENT_COLOUR.length), from: [...new Set(i.parts!.slice(0, -1).flatMap(part => part.from))] } : i))
    for (const game of noColour.games) game.rendered = withoutColour(game.rendered)
    noColour.served = withoutColour(noColour.served)
    expect(checkFieldDiagram(model, noColour), 'D2', 'is drawn in a colour of its own, and no served sentence tells the coach to give the', 'no colour clause')
    assert.equal(fieldDiagramDraftOf(noColour).diagram?.blocks.some(block => (block.keepers ?? []).length) ?? false, false, 'no marker drawn without the clause')
    // D9: the coach's diagram with its marker or area altered.
    const coach = coachDiagramOf(model, { title: 'TEST-ONLY' })
    assert.deepEqual(checkCoachDiagram(coach, model, input, { title: 'TEST-ONLY' }), [])
    const altered = copy(coach)
    altered.blocks[0].keepers![0].label = 'TEST-ONLY'
    assert.ok(checkCoachDiagram(altered, model, input, { title: 'TEST-ONLY' }).some(f => f.what === 'the markers shown are not the model\'s'))
    const moved = copy(coach)
    moved.blocks[1].areas![0].along = { from: 31, to: 40 }
    assert.ok(checkCoachDiagram(moved, model, input, { title: 'TEST-ONLY' }).some(f => f.what === 'the marked areas shown are not the model\'s'))
})

// ── 7. The review evidence ───────────────────────────────────────────────────────────────────────────────
test('the review evidence traces each new sentence: the pairing, the law as applied with its DRAFT clauses, the account owing nothing; nothing untraced', () => {
    const { activity } = served(FA, 12, 1)
    const evidence = activity.evidence!
    assert.deepEqual(evidence.provenance.untraced, [])
    const sourcesOf = (text: string) => evidence.sections.instructions.find(instruction => instruction.text === text)!.sources.map(source => source.ref)
    const box = sourcesOf(BOX_FA)
    assert.ok(box.some(ref => ref.startsWith(`pairing ${FA.id} (`)), JSON.stringify(box))
    assert.ok(box.includes(`DRAFT clause for ${LAW}`) && box.some(ref => ref.startsWith("the sport's normal laws as the default")), JSON.stringify(box))
    const how = evidence.sections.instructions.find(instruction => instruction.text === OFFSIDE_AND_NORMAL)!.sources
    assert.ok(how.some(source => source.ref === 'DRAFT normal-rules sentence' && source.detail === 'his reply filed 26 October 2026, item 10; his reply filed 27 October 2026, item 6'), JSON.stringify(how))
    assert.ok(how.some(source => source.ref.startsWith("the sport's normal laws as the default") && String(source.detail).includes('owes nothing')), JSON.stringify(how))
    // Re-pointed 24 October 2026 (the completeness audit, item 1): the colour clause is LAW-4-GK's. Was LAW-12-GK's.
    // Re-pointed 25 October 2026 (P1): the colour is told by the equipment sentence (his reply filed 28 October 2026, item 3), whose colour part
    // cites LAW-4-GK as the roster clause did, so it is traced to that law and its clause; the equipment sentence is his approved wording.
    const equipment = evidence.sections.instructions.find(instruction => instruction.text === HIS_EQUIPMENT)!
    assert.ok(equipment.sources.some(source => source.ref === `DRAFT clause for ${COLOUR_LAW}` && String(source.detail).includes('his reply filed 27 October 2026, item 6')), JSON.stringify(equipment.sources))
    assert.deepEqual([equipment.wording, equipment.wordingSource], ['APPROVED', { kind: 'APPROVED_TEMPLATE', id: 'EQUIPMENT' }])
    const roster = evidence.sections.instructions.find(instruction => instruction.section === 'Players')!.sources
    assert.ok(!roster.some(source => source.ref === `DRAFT clause for ${COLOUR_LAW}`), 'the roster no longer rests on it')
})

// ── 8. KEPT, end to end ──────────────────────────────────────────────────────────────────────────────────
test('the goal version under KEPT (TEST-ONLY) is refused at structure before any layout (GA-ROLE-EVENTS), never mis-said', () => {
    const kept = goalBuild(FA, 12, 1, { ends: 'KEPT' }).activity as RefusedActivity
    assert.deepEqual([kept.outcome, kept.stage], ['refused', 'structure'])
    assert.ok(kept.reasons.some(reason => reason.includes('a pre-realization Gate A invariant fails: GA-ROLE-EVENTS')), kept.reasons.slice(0, 6).join(' | '))
})

// ── 9. Production ────────────────────────────────────────────────────────────────────────────────────────
// Re-pointed 24 October 2026 (K3): the zone version, built for a session stating no goal (see zoneVersion); the real goal version, served
// since K3 with the FA 5v5 goal, binds its penalty area (goal-version-switch.unit.ts, goal-version-communication.unit.ts).
/**
 * Re-pointed 25 October 2026 (Z): since his reply filed 28 October 2026, item 7 the zone version binds its own penalty area to the goalkeeper's
 * end: its layout holds two rectangles, its fixtures carry the pairing (borrowing only the region), its diagram draws both areas with one label,
 * still no goalkeeper marker. Was: no region bound, no rectangle, no pairing, no area drawn.
 */
test('production since Z: A01 at 12/1, 12/2 and 11/1 binds its own area to the goalkeeper\'s end, set out at each end, its pairing carried, both areas drawn with one label', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const zone = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects: NO_GOAL } } as any)
        assert.equal(zone.activity.outcome, 'served')
        for (const block of blocksOf(zone.fixture)) {
            assert.deepEqual(block.fixture.layout.rectangles.map((r: any) => [r.along.from, r.along.to]), [[0, 9], [31, 40]])
            assert.deepEqual(block.fixture.boundRegions.regions.map((entry: any) => [entry.elementId, entry.objectId, entry.performerEnd, entry.borrows, entry.pairing.id]), [[ZONE_AREA, null, 'P3', ['region'], 'FA-MINI-SOCCER-5V5-2026']])
        }
        // The completeness audit, item 1: the zone version now says the colour, and its diagram still draws no goalkeeper marker - a marker is
        // placed with the goal its performer defends (O7), and the zone version has none; no other placement is invented (a limitation).
        // Z: both areas drawn grey, one label, in every block alike; still no goalkeeper marker (the zone version has no goal for it).
        for (const block of (zone.activity as ServedActivity).diagram!.blocks) {
            assert.deepEqual((block as any).areas, [{ along: { from: 0, to: 9 }, across: { from: 7.5, to: 22.5 }, label: 'penalty area' }, { along: { from: 31, to: 40 }, across: { from: 7.5, to: 22.5 }, label: null }])
            assert.ok(!('keepers' in block))
        }
        // Re-pointed 25 October 2026 (P1): the zone version's own equipment sentence (DRAFT) tells the goalkeeper apart, and its roster does not.
        assert.ok((zone.activity as ServedActivity).rendered.instructions.some(i => i.section === 'Set up' && i.text.endsWith(ZONE_EQUIPMENT_COLOUR)))
        assert.ok(!(zone.activity as ServedActivity).rendered.instructions.some(i => i.section === 'Players' && i.text.endsWith(COLOUR)))
    }
})

console.log(`bound-region-communication.unit.ts — ${passed} passed`)
