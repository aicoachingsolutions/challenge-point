/**
 * **His reply filed 28 October 2026, Part 1, in both versions of Play Out from the Back** — P1, 25 October 2026. Christian, items 1, 3, 4, 5,
 * 6, 9 and 11 (item 10 needs nothing: no offside is already said once in both versions):
 *
 *   1. *"The goalkeeper should be able to restart by passing, rolling, throwing, or dribbling the ball into play."* *"I don't want to prescribe a
 *      particular distribution method when the environment can preserve multiple solutions."* - knowledge: A01-R1-T5-1 holds TAKER_CHOOSES
 *      (register version 24, T5.method version 3); words: DRAFT data (`methods`), never an engine file;
 *   3. *"Yes, please include a concise equipment list."*, his goal-version sentence verbatim (approved, EQUIPMENT) and *"The target-zone version
 *      should have its own corresponding requirements."* (DRAFT, `equipment`), first in Set up, the goal's size from the cited pairing in whole
 *      feet (a binding fidelity admits as exactly that conversion), the goalkeeper's colour said there once and no longer by the roster (RC3 3.4);
 *   4. *"Decide which team builds first."* (approved, FIRST_BLOCK_CHOICE) in place of "Decide which team starts at which end";
 *   5. *"Each team keeps attacking the same target."* (POSSESSION_CONTINUES, his replacement of a clause, the 19 October sentence superseded);
 *   6. *"The goalkeeper starting play already establishes that the building team begins in possession."* and the starting positions vs the
 *      restart location said once: two general rendering rules, every authored line still cited (fidelity Q3 and the first-read test);
 *   9. *"If the building team loses possession, it cannot score again until the next goalkeeper restart."* (A01-W3, the 20 October sentence
 *      superseded) - *"This is a communication simplification, not a change in scoring eligibility."*: the game's eligibility is unchanged;
 *  11. *"I'd prefer the selected block's diagram to focus on the immediate configuration, with the role-exchange procedures explained once in
 *      Coach Details."* - no exchange sentence in the diagram; the Role exchange section keeps the procedure.
 *
 * Everything is measured on the real chain (the review route's builder) at 12/1, 12/2 and 11/1, the goal version with the FA 5v5 goal the
 * session form offers and the zone version with no goal; TEST-ONLY copies are labelled and held in memory. Nothing here changes a production file.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/oct28-refinements.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { loadRegister, loadSportBoundRegions, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { approvedTemplateSentences, approvedWording, FIRST_BLOCK_CHOICE } from './approved-wording'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { detailsWordingOf } from './derived-wording'
import { DRAFT_COACH_WORDING_FILE, draftCoachWordingUnusableBecause } from './draft-coach-wording'
import { checkFidelity, FidelityFinding } from './fidelity'
import { Instruction, renderConcreteGame } from './render-concrete-game'
import { appliedLawPath, boundRegionPath } from './rendering-fixture'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('his reply filed 28 October 2026, Part 1, in both versions (P1)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const CASES = [[12, 1], [12, 2], [11, 1]] as const
const FA = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === 'FA-MINI-SOCCER-5V5-2026')!
const GOAL = { goal: { count: 1, widthM: FA.object.widthM, type: FA.object.type! } }
const NO_GOAL = { goal: { count: 0 } }
const requestOf = (players: number, keepers: number, objects: Record<string, unknown>) =>
    ({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects } }) as any
const builds = new Map<string, { activity: ServedActivity; fixture: any }>()
const build = (version: 'goal' | 'zone', players: number, keepers: number) => {
    const key = `${version}/${players}/${keepers}`
    if (!builds.has(key)) {
        const result = buildActivityUnderAuthorizationRecords(requestOf(players, keepers, version === 'goal' ? GOAL : NO_GOAL), learningGoalAuthorizations(), { review: { includeDrafts: true } })
        assert.equal(result.activity.outcome, 'served', `${key}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
        builds.set(key, { activity: result.activity as ServedActivity, fixture: result.fixture })
    }
    return builds.get(key)!
}
const VERSIONS = ['goal', 'zone'] as const
const each = (body: (version: 'goal' | 'zone', players: number, keepers: number, activity: ServedActivity, fixture: any, what: string) => void) => {
    for (const version of VERSIONS) for (const [players, keepers] of CASES) {
        const { activity, fixture } = build(version, players, keepers)
        body(version, players, keepers, activity, fixture, `${version} ${players}/${keepers}`)
    }
}
const blocksOf = (fixture: any): any[] => fixture.roleBlocks.blocks.map((block: any) => block.fixture)
const texts = (activity: ServedActivity) => activity.rendered.instructions.map(instruction => instruction.text)
const wordingOf = (activity: ServedActivity, text: string) => activity.evidence!.sections.instructions.filter(instruction => instruction.text === text).map(instruction => [instruction.wording, instruction.wordingSource])
const violations = (findings: FidelityFinding[]) => findings.filter(finding => finding.severity === 'VIOLATION')
const refused = (findings: FidelityFinding[], question: number, includes: string, what: string) =>
    assert.ok(violations(findings).some(finding => finding.question === question && finding.what.includes(includes)), `${what}: expected Q${question} "${includes}", got ${JSON.stringify(violations(findings).map(f => `Q${f.question} ${f.what}`), null, 1)}`)
const demo = (id: string) => buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: id, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: none } } as any, { includeDrafts: true }) as ServedActivity

const HOW = `The building team's ${KEEPER} restarts play by passing, rolling, throwing or dribbling the ball into play`
const HIS_EQUIPMENT = 'One 12 × 6 ft goalkeeper-defended goal, balls, cones or field markers, and two team colors plus a distinct goalkeeper color'
const ZONE_EQUIPMENT = 'Balls, cones or field markers, and two team colours plus a distinct goalkeeper colour'
const FIRST_BLOCK = 'Decide which team builds first'
const POSSESSION = 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same target'
const W3 = 'If the building team loses possession, it cannot score again until the next goalkeeper restart.'
const W3_20_OCT = 'If the building team loses possession or plays the ball out, it cannot score again until the next goalkeeper restart.'
const COLOUR_CLAUSE = '; give the goalkeeper a colour neither team wears'
const COLOUR_LAW = 'LAW-4-GK'

// ── Item 1 ─────────────────────────────────────────────────────────────────────────────────────────────────
test('item 1: TAKER_CHOOSES registered (version 3, his words), A01-R1-T5-1 holds it with what it replaced kept; every opener realized so; the HOW in DRAFT data words', () => {
    assert.ok(index.vocabularies.get('T5.method')!.includes('TAKER_CHOOSES'))
    assert.ok(index.vocabularyVersions['T5.method'].startsWith('3 (2026-10-25, register version 24'))
    const item = readJson(PROVISIONAL_REALIZATIONS_FILE).realizations.find((r: any) => r.id === 'A01-R1').items.find((i: any) => i.id === 'A01-R1-T5-1')
    assert.equal(item.value, 'TAKER_CHOOSES')
    assert.ok(item.citedAs.startsWith('his reply filed 28 October 2026, item 1'))
    assert.ok(item.fitNote.includes('AMENDED 25 October 2026 (P1') && item.fitNote.includes('value "FROM_THE_FEET"'), 'what it replaced is kept, verbatim')
    each((version, players, keepers, activity, fixture, what) => {
        for (const block of blocksOf(fixture)) {
            const openers = (block.game.transitions as any[]).filter(t => t.playState === 'STOP_RESUME')
            assert.ok(openers.length === 7 && openers.every(t => t.placement.method === 'TAKER_CHOOSES'), what)
        }
        const how = activity.rendered.instructions.filter(instruction => instruction.text === HOW)
        assert.equal(how.length, 1, what)
        assert.equal(how[0].section, 'Restarts and ball out', what)
        assert.deepEqual(wordingOf(activity, HOW), [['DRAFT', null]], what)
        assert.ok(!texts(activity).some(text => text.includes('from the feet')), what)
    })
    // The DRAFT data's refusals: a method off the register's list, a slot other than {carrier}, a method twice, no words of his.
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    assert.equal(draftCoachWordingUnusableBecause(file, index), null)
    const damaged = (alter: (f: any) => void) => {
        const f = copy(file)
        alter(f)
        return draftCoachWordingUnusableBecause(f, index)
    }
    assert.match(damaged(f => (f.methods[0].method = 'TEST-ONLY')) ?? '', /no member of the register's T5.method vocabulary/)
    assert.match(damaged(f => (f.methods[0].phrase = 'by {taker}')) ?? '', /holds a slot other than \{carrier\}/)
    assert.match(damaged(f => f.methods.push(copy(f.methods[0]))) ?? '', /lists TAKER_CHOOSES again/)
    assert.match(damaged(f => (f.methods[0].basis.words = [])) ?? '', /quotes none of his words/)
})

// ── Item 3 ─────────────────────────────────────────────────────────────────────────────────────────────────
test('item 3: the equipment first in Set up - his sentence in the goal version (approved), the DRAFT one in the zone version - the colour told there once, the roster without it', () => {
    each((version, players, keepers, activity, fixture, what) => {
        const [first] = activity.rendered.instructions
        assert.equal(first.section, 'Set up', what)
        assert.equal(first.text, version === 'goal' ? HIS_EQUIPMENT : ZONE_EQUIPMENT, what)
        assert.deepEqual(wordingOf(activity, first.text), [version === 'goal' ? ['APPROVED', { kind: 'APPROVED_TEMPLATE', id: 'EQUIPMENT' }] : ['DRAFT', null]], what)
        const roster = activity.rendered.instructions.find(instruction => instruction.section === 'Players')!
        assert.ok(!roster.text.endsWith(COLOUR_CLAUSE) && !roster.from.includes(appliedLawPath(COLOUR_LAW)), what)
        const telling = activity.rendered.instructions.flatMap(instruction => instruction.parts ?? []).filter(part => part.from.includes(appliedLawPath(COLOUR_LAW)))
        assert.equal(telling.length, 1, `${what}: the colour, told once`)
        assert.deepEqual(telling[0].bindings, [{ quantity: 2, path: 'performers.teams' }], `${what}: "two team colo(u)rs", bound to the teams`)
        if (version === 'goal') {
            // His figures, from the pairing the goal's penalty area cites, each bound to its metres AS WHOLE_FEET.
            const region = (blocksOf(fixture)[0].boundRegions.regions as any[])[0].elementId
            const at = `${boundRegionPath(region)}.pairing.object`
            assert.deepEqual(first.parts![0].bindings, [
                { quantity: 12, path: `${at}.widthM`, as: 'WHOLE_FEET' },
                { quantity: 6, path: `${at}.heightM`, as: 'WHOLE_FEET' },
            ], what)
            assert.deepEqual([FA.object.widthM, FA.object.heightM], [3.6576, 1.8288])
        }
        assert.equal(activity.integrity.fidelityViolations, 0, what)
    })
    // The demonstrations hold no goalkeeper and no object a team scores at: no data entry matches, so nothing is said.
    for (const id of ['scoring-modifier', 'neutral-players']) assert.ok(!texts(demo(id)).some(text => /cones or field markers/.test(text)), id)
})

test('item 3: the equipment is matched from data, never from an activity - a TEST-ONLY template naming another defender is not said, and the roster tells the colour again', () => {
    const { fixture } = build('goal', 12, 1)
    const block = copy(blocksOf(fixture)[0])
    const templates = approvedTemplateSentences().map(template => (template.id === 'EQUIPMENT' ? { ...template, when: { ...template.when!, targetObject: { kind: 'goal', defendedBy: 'TEST-ONLY-PERFORMER' } } } : template))
    const rendered = renderConcreteGame(block, approvedWording(), templates)
    assert.ok(!rendered.instructions.some(instruction => /cones or field markers/.test(instruction.text)), 'no equipment sentence')
    assert.ok(rendered.instructions.some(instruction => instruction.section === 'Players' && instruction.text.endsWith(COLOUR_CLAUSE)), 'the roster says the colour, as before P1')
    assert.deepEqual(violations(checkFidelity(block, rendered).findings), [], 'and fidelity finds nothing')
})

test('item 3: fidelity refuses (TEST-ONLY mutations) a feet figure that is not the pairing\'s, one bound to another leaf, the colour said twice, and the colour lost', () => {
    const { fixture } = build('goal', 12, 1)
    const block = copy(blocksOf(fixture)[0])
    const rendered = renderConcreteGame(block)
    assert.deepEqual(violations(checkFidelity(block, rendered).findings), [], 'the block as served')
    const equipmentAt = rendered.instructions.findIndex(instruction => instruction.text === HIS_EQUIPMENT)
    const mutated = (alter: (equipment: Instruction, all: Instruction[]) => void) => {
        const r = copy(rendered)
        alter(r.instructions[equipmentAt], r.instructions)
        return checkFidelity(block, r).findings
    }
    // 13 ft wide: the text and the binding agree, and 13 is not the pairing's width in feet.
    refused(mutated(e => {
        e.parts![0].text = e.parts![0].text.replace('12', '13')
        e.parts![0].bindings[0].quantity = 13
        e.text = e.parts!.map(part => part.text).join('')
    }), 2, 'binds 13 to', 'thirteen feet')
    // 12 bound AS WHOLE_FEET to the penalty area's width (a pairing leaf that is no object figure).
    const regionLeaf = rendered.instructions.find(instruction => instruction.text.startsWith("Mark the goal's penalty area"))!.parts![0].bindings[0].path
    refused(mutated(e => {
        e.parts![0].bindings[0].path = regionLeaf
        e.parts![0].from.push(regionLeaf)
        e.from.push(regionLeaf)
    }), 2, `binds 12 to ${regionLeaf}`, 'another leaf')
    // The roster's clause said again beside his sentence: two statements tell the goalkeeper apart.
    refused(mutated((_e, all) => {
        const roster = all.find(instruction => instruction.section === 'Players')!
        roster.parts!.push({ ...copy(roster.parts![0]), text: COLOUR_CLAUSE, from: [appliedLawPath(COLOUR_LAW), `performers.teams[].${KEEPER}`], quantities: [], bindings: [] })
        roster.text = roster.parts!.map(part => part.text).join('')
        roster.from = [...new Set(roster.parts!.flatMap(part => part.from))]
    }), 2, '2 statements tell the coach "give the goalkeeper a colour neither team wears"', 'said twice')
    // His sentence's colour part taken out: nothing tells the goalkeeper apart (Q3).
    refused(mutated(e => {
        e.parts = e.parts!.slice(0, -1)
        e.text = e.parts.map(part => part.text).join('')
        e.from = [...new Set(e.parts.flatMap(part => part.from))]
    }), 3, `records ${COLOUR_LAW} as applying, and neither the roster sentence nor an equipment sentence tells the coach`, 'colour lost')
    // The DRAFT data's refusals: an object played with off the register's list, a performer the register does not name, words not in the part.
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    const damaged = (alter: (f: any) => void) => {
        const f = copy(file)
        alter(f)
        return draftCoachWordingUnusableBecause(f, index) ?? ''
    }
    assert.match(damaged(f => (f.equipment[0].when.carrier = 'TEST-ONLY')), /no object kind of the register's vocabulary/)
    assert.match(damaged(f => (f.equipment[0].when.distinguishes.performer = 'TEST-ONLY')), /no specialized role the register names/)
    assert.match(damaged(f => (f.equipment[0].when.distinguishes.words = 'a TEST-ONLY colour')), /distinguishing words are not in the part/)
    assert.match(damaged(f => (f.equipment[0].parts[0] = 'Balls {size}')), /a slot other than \{size\}, or \{size\} outside the part stating the target object/)
})

// ── Items 4 and 5 ──────────────────────────────────────────────────────────────────────────────────────────
test('items 4 and 5: his first-block and possession sentences in both versions, approved; the demonstrations keep their DRAFT words', () => {
    each((version, players, keepers, activity, fixture, what) => {
        const first = activity.rendered.instructions.filter(instruction => instruction.text === FIRST_BLOCK)
        assert.deepEqual(first.map(instruction => instruction.section), ['Set up'], what)
        assert.deepEqual(wordingOf(activity, FIRST_BLOCK), [['APPROVED', { kind: 'APPROVED_TEMPLATE', id: FIRST_BLOCK_CHOICE }]], what)
        const building = (blocksOf(fixture)[0].game.activityRoles as any[]).find(element => element.activityRole === 'BUILDING')
        assert.ok(first[0].from.includes('envelope.area.length_m') && first[0].from.includes(`activityRoles[${building.elementId}].activityRole`), what)
        assert.ok(!texts(activity).some(text => text.includes('starts at which end')), what)
        assert.deepEqual(wordingOf(activity, POSSESSION), [['APPROVED', { kind: 'APPROVED_TEMPLATE', id: 'POSSESSION_CONTINUES' }]], what)
        assert.ok(!texts(activity).some(text => text.includes('attacking the same zone')), what)
    })
    const modifier = demo('scoring-modifier')
    assert.ok(texts(modifier).includes('Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game'))
    // A demonstration carries no review evidence (no record asks for one), so its status is read by the rule itself (derived-wording.ts).
    const line = 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same line'
    assert.ok(texts(modifier).includes(line))
    assert.deepEqual(detailsWordingOf(line, []), { wording: 'DRAFT', source: null })
    // TEST-ONLY: the record's role decides; a role the game does not hold falls back to the DRAFT sentence.
    const block = copy(blocksOf(build('zone', 12, 1).fixture)[0])
    const elsewhere = approvedTemplateSentences().map(template => (template.id === FIRST_BLOCK_CHOICE ? { ...template, role: 'TEST-ONLY-ROLE' } : template))
    assert.ok(renderConcreteGame(block, approvedWording(), elsewhere).instructions.some(instruction => instruction.text === 'Decide which team starts at which end'))
})

// ── Item 6 ─────────────────────────────────────────────────────────────────────────────────────────────────
test('item 6, first pair: who starts in possession is said by the start, citing possession.team; take that citation away and fidelity refuses', () => {
    each((version, players, keepers, activity, fixture, what) => {
        assert.ok(!texts(activity).some(text => text.endsWith('starts with the ball')), what)
        const citing = activity.rendered.instructions.flatMap(instruction => (instruction.parts ?? []).filter(part => part.from.includes('possession.team')).map(part => [instruction.section, part.text]))
        assert.deepEqual(citing, [['How it works', `The building team's ${KEEPER} starts play`]], what)
    })
    const block = copy(blocksOf(build('goal', 12, 1).fixture)[0])
    const rendered = renderConcreteGame(block)
    const uncited = copy(rendered)
    for (const instruction of uncited.instructions) {
        for (const part of instruction.parts ?? []) part.from = part.from.filter(path => path !== 'possession.team')
        instruction.from = instruction.from.filter(path => path !== 'possession.team')
    }
    refused(checkFidelity(block, uncited).findings, 3, 'possession.team is established by the game and no instruction carries it', 'possession uncarried')
})

test('item 6, second pair: where the goalkeeper restarts no longer repeats the side the start placement gives the building team; the bound is kept whole in the game; any other bound is said whole', () => {
    each((version, players, keepers, activity, fixture, what) => {
        const where = activity.rendered.instructions.find(instruction => instruction.text.startsWith(`You choose where the building team's ${KEEPER} restarts play`))!
        const placement = activity.rendered.instructions.find(instruction => instruction.text.startsWith('Before each of these restarts'))!
        assert.ok(placement.text.includes('each set up on their own side of the marked line'), what)
        if (version === 'goal') {
            assert.equal(where.text, `You choose where the building team's ${KEEPER} restarts play, consistent with the intended build-out situation`, what)
            for (const block of blocksOf(fixture)) {
                const bounds = new Set((block.game.transitions as any[]).filter(t => t.playState === 'STOP_RESUME').map(t => t.placement.region.coachDecides))
                assert.deepEqual([...bounds], ["consistent with the intended build-out situation, on the building team's side of the marked line"], `${what}: the bound kept whole in the game`)
            }
        } else assert.equal(where.text, `You choose where the building team's ${KEEPER} restarts play, consistent with the intended build-out situation, in front of the pressing team's target zone`, what)
    })
    // TEST-ONLY: a bound ending on a side that is not the one the taker's team sets up on is said whole.
    const block = copy(blocksOf(build('goal', 12, 1).fixture)[0])
    for (const transition of block.game.transitions as any[]) if (transition.placement?.region?.coachDecides) transition.placement.region.coachDecides = "consistent with the intended build-out situation, on the pressing team's side of the marked line"
    assert.ok(renderConcreteGame(block).instructions.some(instruction => instruction.text === `You choose where the building team's ${KEEPER} restarts play, consistent with the intended build-out situation, on the pressing team's side of the marked line`))
})

// ── Item 9 ─────────────────────────────────────────────────────────────────────────────────────────────────
test('item 9: his simplified eligibility sentence, approved, once; the 20 October one never; the game\'s eligibility unchanged', () => {
    const w3 = approvedWording().find(entry => entry.id === 'A01-W3')!
    assert.equal(w3.sentence, W3)
    assert.equal(w3.superseded![0].sentence, W3_20_OCT)
    each((version, players, keepers, activity, fixture, what) => {
        assert.deepEqual(activity.rendered.instructions.filter(instruction => instruction.text === W3).map(instruction => instruction.section), ['How to score'], what)
        assert.deepEqual(wordingOf(activity, W3), [['APPROVED', { kind: 'APPROVED_ENTRY', id: 'A01-W3' }]], what)
        assert.ok(!texts(activity).includes(W3_20_OCT), what)
        // The scoring eligibility itself: the building role's credit is confined to the build-out episode in both blocks, exactly as the
        // entry's covers (unchanged) say, and its origin condition is the goalkeeper's restart.
        for (const block of blocksOf(fixture)) {
            const building = (block.game.activityRoles as any[]).find(element => element.activityRole === 'BUILDING')
            assert.equal(building.creditedWithin, 'BUILD_OUT_EPISODE', what)
            const origin = (block.game.value.primaryEvent.conditions as any[]).find(condition => condition.type === 'origin')
            assert.deepEqual(origin.referents.arms, [{ takenBy: KEEPER }, { restartKind: 'CONTROLLED_DEFENSIVE_RESTART' }], what)
        }
    })
})

// ── Items 10 and 11 ────────────────────────────────────────────────────────────────────────────────────────
test('items 10 and 11: no offside, once, in both versions; the diagram says no exchange, the Role exchange section keeps the procedure; 28 Details, nothing said twice', () => {
    each((version, players, keepers, activity, fixture, what) => {
        assert.equal(texts(activity).filter(text => text.startsWith('There is no offside')).length, 1, what)
        for (const block of activity.diagram!.blocks) {
            assert.ok(!('exchange' in block), what)
            assert.ok(!/When you (call|return to) this block/.test(block.desc), what)
        }
        const exchange = activity.rendered.instructions.filter(instruction => instruction.section === 'Role exchange').map(instruction => instruction.text)
        assert.equal(exchange.length, 3, what)
        assert.ok(exchange.some(text => text.startsWith(`When you call the next block, 1 ${KEEPER}`)), `${what}: who moves`)
        assert.ok(exchange.some(text => text.includes('When you call the next block the teams')), `${what}: what changes`)
        // Re-pointed 25 October 2026 (Z): the zone version says one sentence more, its goalkeeper's penalty area (his reply filed 28 October 2026,
        // item 7; zone-penalty-area.unit.ts). Was 28 in both versions.
        assert.equal(activity.rendered.instructions.length, version === 'zone' ? 29 : 28, what)
        assert.equal(new Set(texts(activity)).size, texts(activity).length, `${what}: nothing said twice`)
    })
})

console.log(`oct28-refinements.unit.ts — ${passed} passed`)
