/**
 * **Stage 2A, 21 October 2026 — one section and when-needed assigner (no wording change).**
 *
 * Christian, reply filed 22 October 2026, item 2: *"Information should be classified according to when the coach needs it, not simply
 * whether it constitutes a rule."*; item 8: *"Correct section assignment, repetition, and information classification in the checked
 * pathway."*; acceptance: *"The same communication mechanisms can support other Learning Goals without activity-specific implementation
 * exceptions."*
 *
 * What is pinned here, on the real chain (TEST-ONLY lines are labelled):
 *
 *   1. the table is total: every register row has a kind, the table names no row the register lacks, and a cited path on an unmapped
 *      row, on no row, on a transition the game does not hold, or a sentence citing only nouns, is refused loudly;
 *   2. a cited path is read as its row, every `[...]` as `[]`, a bare collection as its collection, a field the register does not spell
 *      as its nearest row;
 *   3. a transition is placed by what it holds: an opener of play or of the episode a role's credit is confined to, any other
 *      stop-and-restart, or a transition that keeps play going; a TEST-ONLY game whose credit is unbounded opens only at START;
 *   4. the classifier gives each approved entry its own validated `section` (W1, W2, W3) and his possession template How it works;
 *   5. against every producer's proposal, on A01 at three sessions, both demonstrations and the frozen A04 game, the ONLY moves are the
 *      duration to When it ends and the stop-and-restarts that open nothing to Restarts and ball out, and both moves happen in A01;
 *   6. `when` is the section's reading and `tier` is `when`'s; the served activity reads in section order, and nothing is added,
 *      dropped or reworded by placement;
 *   7. a required limit of a line the activity only starts at is adjusted within; the same limit of a line it fixes stays with it;
 *   8. the table and the assigner name no goal, activity or sport.
 *
 * Added in the review of stage 2A:
 *
 *   9. every section label's status is data (all DRAFT), every rendering's sections have one, and an unknown section is refused;
 *  10. a role element and its role (rows B1, B2) place only a sentence citing nothing else, in Role exchange, and outrank nothing;
 *  11. a cited transition whose play state cannot be read is refused rather than placed with how play runs;
 *  12. fidelity Q4 refuses an approved sentence placed outside the section his entry names, and the build refuses it at communication.
 *
 * Added in stage 2B (21 October 2026, his item 2: "the basic goalkeeper restart condition is essential because it determines when the
 * building team can score again. The complete procedural details of every restart should remain accessible but do not all need to appear
 * in the overview."):
 *
 *  13. an opener is read per field (when it happens / who takes it / how it is taken), every transition row has a field, and the taker
 *      never outranks a procedure, a fact of play or picking sides, while an opener's WHEN outranks its procedure;
 *  14. the opening restart is said as WHEN (How it works, directly before the start placement) and HOW and WHERE (Restarts and ball out,
 *      before the ball-out restarts) at every session: the one sentence's words cut at the colon, every path it cited cited again, the
 *      taker by both halves and every other path by exactly one, the same nouns and counts at 12 players with 1 or 2 goalkeepers and at 11;
 *  15. the first read carries every path read for understanding and beginning (fidelity Q3) on every production game; a TEST-ONLY move
 *      of the WHEN into Restarts and ball out is refused by fidelity, and on the built chain at communication.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import * as wordingModule from './approved-wording'
import { ApprovedWording, approvedTemplateSentences, approvedWording } from './approved-wording'
import { buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { checkFidelity } from './fidelity'
import { OUT as A04_FIXTURE } from './freeze-a04-fixture'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { Instruction, producersProposals, renderConcreteGame, sectionFactsOf } from './render-concrete-game'
import * as sectionsModule from './sections'
import {
    assignSection,
    firstReadUncarried,
    inSectionOrder,
    KIND_OF_OPENER_FIELD,
    KIND_OF_ROW,
    kindOfPath,
    LABEL_STATUS,
    Placement,
    PLAY_STATE_UNREADABLE,
    PRECEDENCE,
    RESTARTS,
    ROLE_EXCHANGE,
    rowIndexOf,
    rowOfPath,
    registerRowIndex,
    SECTION_ORDER,
    SectionFacts,
    sectionLabelsOf,
    TRANSITION_FIELD_OF_ROW,
    WHEN_IT_ENDS,
    WHEN_OF_SECTION,
} from './sections'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('one section and when-needed assigner (stages 2A and 2B)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionOf = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } })
const a01 = (players: number, keepers: number) => buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers) })
const a01Sessions: [number, number][] = [
    [12, 1],
    [12, 2],
    [11, 1],
]
const a01Built = a01Sessions.map(([players, keepers]) => ({ players, keepers, ...a01(players, keepers) }))
const blocksOf = (fixture: any): any[] => ((fixture?.roleBlocks?.blocks ?? []) as any[]).map(block => block.fixture)
const a01Blocks = a01Built.flatMap(({ players, keepers, fixture }) => blocksOf(fixture).map((block, i) => ({ what: `A01 ${players} players, ${keepers} ${ROLE}(s), block ${i + 1}`, fixture: block })))
const demos = MECHANISM_DEMONSTRATIONS.map(demonstration => ({ what: demonstration.id, ...buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: sessionOf(12, 0) }) }))
const servedDemos = demos.filter(demo => demo.activity.outcome === 'served' && demo.fixture).map(demo => ({ what: demo.what, fixture: demo.fixture as any }))
const a04 = { what: 'A04 (frozen)', fixture: JSON.parse(fs.readFileSync(A04_FIXTURE, 'utf8')) }
const games = [...a01Blocks, ...servedDemos, a04]

test('1a. the table is total over the register: every row has a kind, and no kind names a row the register lacks', () => {
    const ids: string[] = ((loadRegister().rows ?? []) as any[]).map(row => String(row.id))
    assert.ok(ids.length > 100, `the register is read (${ids.length} rows)`)
    assert.deepEqual(ids.filter(id => !(id in KIND_OF_ROW)), [], 'every register row has a kind')
    assert.deepEqual(Object.keys(KIND_OF_ROW).filter(id => !ids.includes(id)), [], 'no kind names a row the register lacks')
})

test('1b. refused loudly: an unmapped row (TEST-ONLY register), a path on no row, a transition the game does not hold, a sentence citing only nouns', () => {
    const facts: SectionFacts = { transitionKind: () => null, startingLines: new Set() }
    const testOnlyRows = rowIndexOf([...((loadRegister().rows ?? []) as any[]).map(row => ({ id: String(row.id), path: String(row.path) })), { id: 'TEST-ONLY-ROW', path: 'testOnly.items[]' }])
    assert.throws(() => assignSection({ status: 'DERIVED', from: ['testOnly.items[x].leaf'] }, facts, testOnlyRows), /register row TEST-ONLY-ROW .* has no kind/)
    assert.throws(() => assignSection({ status: 'DERIVED', from: ['nothing.anyone.authored'] }, facts), /is on no register row and no known prefix/)
    assert.throws(() => assignSection({ status: 'DERIVED', from: ['transitions[TEST-ONLY].playState'] }, facts), /cites transition TEST-ONLY, which the game does not hold/)
    assert.throws(() => assignSection({ status: 'DERIVED', from: ['space.regions[x].noun', 'objects[y].kind', 'transitions'] }, facts), /nothing the sentence cites decides a section/)
})

test('2. a cited path is read as its register row', () => {
    const rows = registerRowIndex()
    const cases: [string, string][] = [
        ['envelope.duration_min', 'E4'],
        ['space.regions[c:x:y:z.1].position.along', 'S5'],
        ['space.regions[c:x:y:z.1].functions[some-function]', 'S4'],
        ['space.regions[c:x:y:z.1].selector', 'S2'],
        ['performers.teams', 'P1'],
        [`performers.teams[].${ROLE}`, String(((loadRegister().rows ?? []) as any[]).find(row => String(row.path) === `performers.teams[].${ROLE}`)?.id)],
        ['transitions', 'T1'],
        ['transitions[c:x:y:z.1].selector', 'T1'],
        ['transitions[c:x:y:z.1].qualifiers.endLine', 'T1b'],
        ['value.primaryEvent.conditions[c:x:y:z.1].scope', 'V3'],
        ['value.valueModifiers[c:x:y:z.1].condition.referents[x:y::z.1]', 'V8b'],
        ['value.primaryEvent.alsoCounts[c:x:y:z.1].control', 'V30'],
        ['activityRoles[c:x:y:z.1].creditedWithin', 'B8'],
        ['reassignments[c:x:y:z.1].count', 'B7'],
    ]
    for (const [path_, row] of cases) assert.equal(rowOfPath(path_, rows), row, path_)
    assert.equal(rowOfPath('adjustments[X].words', rows), null, 'an adjustment is no register row; it is placed by its root')
})

test('3. a transition is placed by what it holds; a TEST-ONLY game whose every credit is unbounded opens only at START', () => {
    const [block] = a01Blocks.map(b => b.fixture)
    const transitions: any[] = block.game.transitions
    const trigger = (t: any) => (t.selector ?? []).find((s: any) => s.attribute === 'trigger' && s.op === '=')?.value
    const facts = sectionFactsOf(block)
    const byKind = (kind: string) => transitions.filter(t => facts.transitionKind(String(t.elementId)) === kind).map(t => String(trigger(t)))
    assert.deepEqual(byKind('EPISODE_OPENER').sort(), ['COACH_JUDGED_EPISODE_CONCLUSION', 'SCORE', 'START'], 'the start, and the restarts that begin the bounded episode, open it')
    assert.deepEqual([...new Set(byKind('RESTART'))].sort(), ['OUT_END_LINE', 'OUT_TOUCHLINE'], 'the ball going out opens nothing')
    assert.deepEqual(byKind('IN_PLAY'), ['POSSESSION_CHANGE'], 'a turnover keeps play going')
    // TEST-ONLY: no role's credit is bounded, so no begin condition is read; only the start opens play.
    const unbounded = JSON.parse(JSON.stringify(block))
    for (const element of unbounded.game.activityRoles) element.creditedWithin = 'WHOLE_GAME'
    const plain = sectionFactsOf(unbounded)
    assert.deepEqual(transitions.filter(t => plain.transitionKind(String(t.elementId)) === 'EPISODE_OPENER').map(t => String(trigger(t))), ['START'])
    assert.equal(plain.transitionKind('TEST-ONLY'), null)
})

test('4. the classifier gives each approved entry its own validated section (W1, W2, W3), and his possession template How it works', () => {
    const entries = approvedWording()
    assert.deepEqual(entries.map(e => e.id), ['A01-W1', 'A01-W2', 'A01-W3'])
    const [template] = approvedTemplateSentences()
    for (const { what, fixture } of a01Blocks) {
        const rendered = renderConcreteGame(fixture).instructions
        for (const entry of entries) {
            const said = rendered.filter(i => i.text === entry.sentence)
            assert.equal(said.length, 1, `${what}: ${entry.id} is said once`)
            assert.equal(said[0].section, entry.section, `${what}: ${entry.id} is placed where its validated section says`)
        }
        assert.deepEqual(rendered.filter(i => i.text === template.sentence.replace(/\.$/, '')).map(i => i.section), ['How it works'], `${what}: the possession template`)
    }
})

/** Each produced sentence beside where it is placed, with the kind that placed it. */
const placements = (fixture: any): { proposed: Instruction; placed: Placement }[] => {
    const facts = sectionFactsOf(fixture)
    return producersProposals(fixture).map(proposed => ({ proposed, placed: assignSection(proposed, facts) }))
}

test('5. against every producer proposal, the ONLY moves are the duration to When it ends and the restarts that open nothing to Restarts and ball out', () => {
    const moved = new Map<string, Set<string>>()
    for (const { what, fixture } of games) {
        for (const { proposed, placed } of placements(fixture)) {
            if (placed.section === proposed.section) continue
            const expected = (placed.kind === 'DURATION' && placed.section === WHEN_IT_ENDS) || (placed.kind === 'RESTART' && placed.section === RESTARTS)
            assert.ok(expected, `${what}: "${proposed.text}" moved from ${proposed.section} to ${placed.section} (decided by ${placed.by}), which stage 2A does not move`)
            assert.equal(proposed.section, 'How it works', `${what}: "${proposed.text}" was proposed in How it works`)
            moved.set(placed.section, new Set([...(moved.get(placed.section) ?? []), proposed.text]))
        }
    }
    // The moves happen, so the comparison bites: in A01, the duration, and both ball-out restarts.
    assert.deepEqual([...(moved.get(WHEN_IT_ENDS) ?? [])], ['Play for 20 minutes'])
    const restarts = [...(moved.get(RESTARTS) ?? [])]
    assert.equal(restarts.length, 2, JSON.stringify(restarts))
    assert.ok(restarts.every(text => text.startsWith('If the ball goes out over ')), JSON.stringify(restarts))
})

test('6a. when is the section\'s reading, tier is when\'s, and every rendering reads in section order with nothing added, dropped or reworded', () => {
    const rank = (section: string) => (SECTION_ORDER as readonly string[]).indexOf(section)
    for (const { what, fixture } of games) {
        const produced = producersProposals(fixture)
        const rendered = renderConcreteGame(fixture).instructions
        for (const i of rendered) {
            assert.ok(rank(i.section) >= 0, `${what}: "${i.text}" is in a section an activity has (${i.section})`)
            assert.equal(i.when, WHEN_OF_SECTION[i.section], `${what}: "${i.text}"`)
            assert.equal(i.tier, i.when === 'ADJUST' ? 'adjust' : 'setup', `${what}: "${i.text}"`)
        }
        assert.ok(rendered.every((i, n) => n === 0 || rank(rendered[n - 1].section) <= rank(i.section)), `${what}: in section order`)
        const id = (i: Instruction) => JSON.stringify([i.text, i.status, [...i.from].sort(), i.quantities])
        assert.deepEqual(rendered.map(id).sort(), produced.map(id).sort(), `${what}: the same sentences, citations and numbers`)
    }
})

test('6b. the served A01 activity reads in section order, at every session, with When it ends and Restarts and ball out where the plan puts them', () => {
    const rank = (section: string) => (SECTION_ORDER as readonly string[]).indexOf(section)
    for (const { players, keepers, activity } of a01Built) {
        assert.equal(activity.outcome, 'served', `${players} players, ${keepers}`)
        const instructions = (activity as ServedActivity).rendered.instructions
        assert.ok(instructions.every((i, n) => n === 0 || rank(instructions[n - 1].section) <= rank(i.section)), `${players} players: in section order`)
        assert.deepEqual([...new Set(instructions.map(i => i.section))], ['Set up', 'Players', 'How it works', 'How to score', WHEN_IT_ENDS, 'Role exchange', RESTARTS, 'Adjusting the activity'])
        assert.deepEqual(instructions.filter(i => i.section === WHEN_IT_ENDS).map(i => i.text), ['Play for 20 minutes'])
        // Moved 21 October 2026 (stage 2B), 2 -> 4: the opening restart's HOW and where it is taken, before the two ball-out restarts.
        assert.equal(instructions.filter(i => i.section === RESTARTS).length, 4)
        assert.ok(instructions.filter(i => i.section === RESTARTS).every(i => i.when === 'ADMINISTER' && i.block === undefined))
    }
})

test('7. a required limit of a line the activity only starts at is adjusted within; the same limit of a line it fixes stays in Players (TEST-ONLY closure)', () => {
    const neutrals = servedDemos.find(demo => demo.what === 'neutral-players')!.fixture
    const COUNT = 'performers.neutrals.count'
    const floor = (fixture: any) => renderConcreteGame(fixture).instructions.filter(i => i.text.startsWith('Keep ') && i.from.includes(COUNT))
    assert.deepEqual(floor(neutrals).map(i => [i.section, i.when]), [['Adjusting the activity', 'ADJUST']])
    // TEST-ONLY: the count closed as the only value its bound admits, so the activity does not merely start at it.
    const fixed = JSON.parse(JSON.stringify(neutrals))
    for (const choice of fixed.status.choices) if (choice.path === COUNT) choice.closure = 'ONLY_VALUE'
    assert.deepEqual(floor(fixed).map(i => [i.section, i.when]), [['Players', 'UNDERSTAND_AND_BEGIN']])
    for (const { proposed, placed } of placements(fixed)) if (proposed.from.includes(COUNT)) assert.equal(placed.section, proposed.section, `"${proposed.text}": the producer and the assigner agree`)
})

test('8. the table and the assigner name no goal, activity or sport', () => {
    const source = fs.readFileSync(path.join(__dirname, 'sections.ts'), 'utf8')
    for (const goal of ['A01', 'A02', 'A04', 'D01', 'D02', 'TA01', 'TD01']) assert.ok(!source.includes(goal), `no goal id (${goal})`)
    assert.ok(!source.toLowerCase().includes(String(ROLE).toLowerCase()), 'no specialized role')
    for (const demonstration of MECHANISM_DEMONSTRATIONS) assert.ok(!source.includes(demonstration.id), `no demonstration id (${demonstration.id})`)
})

/* The review of stage 2A, 21 October 2026. */

test('9. every section label is recorded as data, all DRAFT; every rendering\'s sections have a recorded label; an unknown section is refused (TEST-ONLY)', () => {
    assert.deepEqual(Object.keys(LABEL_STATUS), [...SECTION_ORDER], 'one status per section, in reading order')
    assert.deepEqual(SECTION_ORDER.filter(section => LABEL_STATUS[section] !== 'DRAFT'), [], 'no section label is approved')
    for (const { what, fixture } of games) {
        const rendered = renderConcreteGame(fixture).instructions
        const labels = sectionLabelsOf(rendered)
        assert.deepEqual(
            labels.map(l => l.section),
            SECTION_ORDER.filter(section => rendered.some(i => i.section === section)),
            `${what}: a label for every section used, in reading order`,
        )
        for (const label of labels) {
            assert.deepEqual([label.when, label.status], [WHEN_OF_SECTION[label.section], 'DRAFT'], `${what}: ${label.section}`)
            assert.ok(label.sentences.every(n => rendered[n].section === label.section), `${what}: ${label.section}`)
        }
        assert.deepEqual(labels.flatMap(l => l.sentences).sort((a, b) => a - b), rendered.map((_, n) => n), `${what}: every sentence under exactly one label`)
    }
    // TEST-ONLY sections: a name the approved-wording loader admits and no activity has, and a made-up one.
    assert.throws(() => sectionLabelsOf([{ section: 'What to watch', text: 'TEST-ONLY' }]), /"What to watch", which is not one an activity has/)
    assert.throws(() => inSectionOrder([{ section: 'Set up', text: 'TEST-ONLY a' }, { section: 'TEST-ONLY', text: 'TEST-ONLY b' }]), /"TEST-ONLY", which is not one an activity has/)
})

test('10. a role element and its role place only a sentence that cites nothing else, in Role exchange; they never outrank scoring, play or picking sides', () => {
    const facts: SectionFacts = { transitionKind: () => null, startingLines: new Set() }
    const at = (from: string[]) => assignSection({ status: 'DERIVED', from }, facts)
    const role = 'activityRoles[c:x:y:z.1].activityRole'
    assert.deepEqual([at([role]).section, at([role]).kind], [ROLE_EXCHANGE, 'ROLES'])
    assert.equal(at(['activityRoles[c:x:y:z.1]']).section, ROLE_EXCHANGE)
    assert.equal(at([role, 'value.primaryEvent.value']).section, 'How to score', 'a scoring sentence naming a role stays in How to score')
    assert.equal(at([role, 'possession.team']).section, 'How it works', 'a how-play-works sentence naming a role stays in How it works')
    assert.equal(at([role, 'performers.teams']).section, 'Players', 'picking sides naming a role stays in Players')
    assert.equal(at([role, 'activityRoles[c:x:y:z.1].exchange']).section, ROLE_EXCHANGE, 'the exchange itself is still Role exchange')
    // The served roles statement, which cites only the roles, is still in Role exchange (fidelity Q6 unchanged).
    for (const { players, keepers, activity } of a01Built) {
        const roles = (activity as ServedActivity).rendered.instructions.filter(i => i.from.length > 0 && i.from.every(p => p.startsWith('activityRoles[') && p.endsWith('.activityRole')))
        assert.deepEqual(roles.map(i => i.section), [ROLE_EXCHANGE], `${players} players, ${keepers}`)
    }
})

test('11. a cited transition whose play state is missing or neither STOP_RESUME nor CONTINUE is refused, not placed with how play runs (TEST-ONLY game)', () => {
    for (const { what, fixture } of games) {
        const facts = sectionFactsOf(fixture)
        assert.ok(((fixture.game?.transitions ?? []) as any[]).every(t => facts.transitionKind(String(t.elementId)) !== PLAY_STATE_UNREADABLE), `${what}: every production transition is read`)
    }
    const [block] = a01Blocks.map(b => b.fixture)
    const trigger = (t: any) => (t.selector ?? []).find((s: any) => s.attribute === 'trigger' && s.op === '=')?.value
    for (const alter of [(t: any) => delete t.playState, (t: any) => (t.playState = 'TEST-ONLY')]) {
        const broken = JSON.parse(JSON.stringify(block))
        const out = broken.game.transitions.find((t: any) => trigger(t) === 'OUT_TOUCHLINE')
        alter(out)
        const facts = sectionFactsOf(broken)
        assert.equal(facts.transitionKind(String(out.elementId)), PLAY_STATE_UNREADABLE)
        assert.throws(() => assignSection({ status: 'DERIVED', from: [`transitions[${out.elementId}].awardedTo`] }, facts), /whose play state is neither STOP_RESUME nor CONTINUE/)
    }
})

test('12. fidelity Q4 refuses an approved sentence placed outside the section his entry names (TEST-ONLY entry section), and the build refuses it at communication', () => {
    const [block] = a01Blocks.map(b => b.fixture)
    const production = approvedWording()
    const misplaced = (wording: ApprovedWording[]) =>
        checkFidelity(block, renderConcreteGame(block, wording), wording).findings.filter(f => f.question === 4 && f.what.includes('is approved wording for'))
    assert.deepEqual(misplaced(production), [], 'production: every approved sentence is where his entry says')
    // TEST-ONLY: W3's own section changed; placement (from what it cites) still puts it in How to score.
    const w3 = production.find(entry => entry.id === 'A01-W3')!
    const moved = production.map(entry => (entry.id === w3.id ? { ...JSON.parse(JSON.stringify(entry)), section: 'Set up' } : entry)) as ApprovedWording[]
    const found = misplaced(moved)
    assert.equal(found.length, 1, JSON.stringify(found))
    assert.equal(found[0].severity, 'VIOLATION')
    assert.equal(found[0].what, `"${w3.sentence}" is approved wording for "Set up" and is placed in "How to score"`)
    // On the built chain: the activity is refused at communication rather than served with the sentence where his entry does not put it.
    const read = wordingModule.approvedWording
    try {
        ;(wordingModule as any).approvedWording = () => JSON.parse(JSON.stringify(moved))
        const refused = a01(12, 1).activity
        assert.equal(refused.outcome, 'refused')
        assert.equal((refused as RefusedActivity).stage, 'communication')
    } finally {
        ;(wordingModule as any).approvedWording = read
    }
    assert.equal(a01(12, 1).activity.outcome, 'served', 'production restored')
})

/* Stage 2B, 21 October 2026: the opening restart's WHEN said apart from its HOW. */

test('13. an opener is read per field (when / who / how); every transition row has a field; the taker never outranks, and an opener\'s WHEN outranks its procedure', () => {
    const transitionRows = Object.entries(KIND_OF_ROW)
        .filter(([, kind]) => kind === 'TRANSITION')
        .map(([id]) => id)
        .sort()
    assert.deepEqual(Object.keys(TRANSITION_FIELD_OF_ROW).sort(), transitionRows, 'every transition row has a field, and the field table names no other row')
    assert.deepEqual(KIND_OF_OPENER_FIELD, { WHEN: 'EPISODE_OPENER', WHO: 'OPENER_TAKER', HOW: 'RESTART' })
    const rank = (kind: string) => PRECEDENCE.indexOf(kind as any)
    assert.ok(rank('EPISODE_OPENER') < rank('RESTART') && rank('RESTART') < rank('OPENER_TAKER'), 'when it happens, then how, then who')
    assert.deepEqual(PRECEDENCE.slice(-2), ['OPENER_TAKER', 'ROLES'], 'the taker outranks only the roles')
    // TEST-ONLY facts: o opens play or a bounded episode, r is any other stop-and-restart, c keeps play going.
    const readings: Record<string, any> = { o: 'EPISODE_OPENER', r: 'RESTART', c: 'IN_PLAY' }
    const facts: SectionFacts = { transitionKind: id => readings[id] ?? null, startingLines: new Set() }
    const at = (from: string[]) => {
        const placed = assignSection({ status: 'DERIVED', from }, facts)
        return [placed.section, placed.kind]
    }
    const o = 'transitions[o]'
    for (const field of ['selector', 'qualifiers.lastTouch', 'qualifiers.endLine', 'qualifiers.region', 'playState', 'startsEpisode']) assert.deepEqual(at([`${o}.${field}`]), ['How it works', 'EPISODE_OPENER'], field)
    assert.deepEqual(at([o]), ['How it works', 'EPISODE_OPENER'], 'the element itself')
    for (const field of ['awardedTo', 'placement.actor']) assert.deepEqual(at([`${o}.${field}`]), ['How it works', 'OPENER_TAKER'], field)
    for (const field of ['placement.method', 'placement.region']) assert.deepEqual(at([`${o}.${field}`]), [RESTARTS, 'RESTART'], field)
    // Every field of any other transition is read whole, by its element, as in stage 2A.
    for (const field of ['selector', 'awardedTo', 'placement.actor', 'placement.method', 'placement.region', 'playState']) {
        assert.deepEqual(at([`transitions[r].${field}`]), [RESTARTS, 'RESTART'], field)
        assert.deepEqual(at([`transitions[c].${field}`]), ['How it works', 'IN_PLAY'], field)
    }
    // The three sentences the renderer says of an opening restart, and the one sentence it said before stage 2B.
    const who = [`${o}.awardedTo`, `${o}.placement.actor`]
    assert.deepEqual(at([...who, `${o}.playState`, `${o}.selector`]), ['How it works', 'EPISODE_OPENER'], 'WHEN')
    assert.deepEqual(at([...who, `${o}.placement.method`, 'objects[b].kind']), [RESTARTS, 'RESTART'], 'HOW')
    assert.deepEqual(at([`${o}.placement.region`, ...who]), [RESTARTS, 'RESTART'], 'WHERE')
    assert.deepEqual(at([...who, `${o}.placement.method`, `${o}.playState`, 'objects[b].kind', `${o}.selector`]), ['How it works', 'EPISODE_OPENER'], 'a sentence saying both stays in the first read')
    // The taker never pulls a sentence out of its section: beside picking sides or a fact of play it is theirs; it outranks only a role.
    assert.equal(at([`${o}.placement.actor`, 'performers.teams'])[0], 'Players')
    assert.equal(at([`${o}.placement.actor`, 'possession.team'])[1], 'IN_PLAY')
    assert.deepEqual(at([`${o}.placement.actor`, 'activityRoles[x].activityRole']), ['How it works', 'OPENER_TAKER'])
    // On A01: the start and the two restarts that begin the bounded episode are read per field; the ball going out is read whole.
    const [block] = a01Blocks.map(b => b.fixture)
    const real = sectionFactsOf(block)
    const readAs = new Map<string, number>()
    for (const t of block.game.transitions as any[]) {
        const id = `transitions[${t.elementId}]`
        const reading = String(real.transitionKind(String(t.elementId)))
        readAs.set(reading, (readAs.get(reading) ?? 0) + 1)
        const kinds = ['selector', 'playState', 'awardedTo', 'placement.actor', 'placement.method', 'placement.region'].map(field => kindOfPath(`${id}.${field}`, real))
        if (reading === 'EPISODE_OPENER') assert.deepEqual(kinds, ['EPISODE_OPENER', 'EPISODE_OPENER', 'OPENER_TAKER', 'OPENER_TAKER', 'RESTART', 'RESTART'], id)
        else assert.deepEqual(kinds, Array(6).fill(reading), id)
    }
    assert.deepEqual(Object.fromEntries(readAs), { EPISODE_OPENER: 3, RESTART: 4, IN_PLAY: 1 }, 'the opening restarts, the ball going out, the turnover')
    // A transition row the field table does not read is refused loudly where an opener cites it (TEST-ONLY row); any other reads whole.
    const testOnlyRows = rowIndexOf([...((loadRegister().rows ?? []) as any[]).map(row => ({ id: String(row.id), path: String(row.path) })), { id: 'TEST-ONLY-T', path: 'transitions[].testOnly' }])
    try {
        ;(KIND_OF_ROW as any)['TEST-ONLY-T'] = 'TRANSITION'
        assert.throws(() => kindOfPath('transitions[o].testOnly', facts, testOnlyRows), /register row TEST-ONLY-T .* is a transition row with no field reading/)
        assert.equal(kindOfPath('transitions[r].testOnly', facts, testOnlyRows), 'RESTART')
    } finally {
        delete (KIND_OF_ROW as any)['TEST-ONLY-T']
    }
})

/** His role's noun is the session's (data), read as every test here reads it. */
const TAKER = `The building team's ${ROLE} restarts play`
/** The one sentence said until stage 2B (served at every session, snapshot of stage 2A). */
const ONE_SENTENCE = `${TAKER} from the feet, with the ball still or moving: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)`

test('14. the opening restart is said as WHEN (How it works, before the start placement) and HOW and WHERE (Restarts and ball out), at every session, from the one sentence\'s words and citations', () => {
    const counts = new Set<number>()
    for (const { players, keepers, activity, fixture } of a01Built) {
        const what = `${players} players, ${keepers} ${ROLE}(s)`
        const instructions = (activity as ServedActivity).rendered.instructions
        counts.add(instructions.length)
        const one = (start: string) => {
            const found = instructions.filter(i => i.text.startsWith(start))
            assert.equal(found.length, 1, `${what}: one sentence starting "${start}"`)
            return found[0]
        }
        const when = one(`${TAKER}:`)
        const how = one(`${TAKER} `)
        const where = one(`You choose where the building team's ${ROLE} restarts play`)
        // The words: the one sentence cut at the colon, its taker said again at the start of HOW; WHERE names its own restart.
        assert.equal(`${how.text}${when.text.slice(TAKER.length)}`, ONE_SENTENCE, what)
        assert.equal(when.text, `${TAKER}: at the start, after either team scores and whenever you decide that an attack has run its course (at a stoppage or while play is on)`, what)
        assert.equal(how.text, `${TAKER} from the feet, with the ball still or moving`, what)
        assert.equal(where.text, `You choose where the building team's ${ROLE} restarts play, consistent with the intended build-out situation, in front of the pressing team's target zone`, what)
        assert.ok(!instructions.some(i => i.text.includes('each of these restarts is taken')), `${what}: no dangling "these restarts" in Restarts and ball out`)
        assert.deepEqual([when, how, where].map(i => i.quantities), [[], [], []], `${what}: no number in any half`)
        assert.deepEqual([when, how, where].map(i => i.block), [undefined, undefined, undefined], `${what}: said once, for both blocks`)
        // Where each is read: WHEN in the first read, directly before the start placement (his D4); HOW and WHERE consulted when needed,
        // before the ball-out restarts.
        assert.deepEqual([when.section, when.when], ['How it works', 'UNDERSTAND_AND_BEGIN'], what)
        assert.ok(instructions[instructions.indexOf(when) + 1].text.startsWith('Before each of these restarts'), `${what}: the start placement follows the WHEN directly`)
        const restarts = instructions.filter(i => i.section === RESTARTS)
        assert.deepEqual(restarts.slice(0, 2), [how, where], what)
        assert.ok(restarts.slice(2).every(i => i.text.startsWith('If the ball goes out over ')), what)
        assert.deepEqual([how.when, where.when], ['ADMINISTER', 'ADMINISTER'], what)
        assert.equal(where.status, 'COACH_CHOICE', `${what}: where it is taken is the coach's`)
        // The citations, in both blocks: every path the one sentence cited is cited again; the taker (awardee and taker), named by both
        // halves, by both; every other path by exactly one. WHERE cites each location and the taker it names.
        for (const block of blocksOf(fixture)) {
            const facts = sectionFactsOf(block)
            const openers = (block.game.transitions as any[]).filter(t => facts.transitionKind(String(t.elementId)) === 'EPISODE_OPENER')
            assert.equal(openers.length, 3, what)
            const at = (t: any, field: string) => `transitions[${t.elementId}].${field}`
            const object = `objects[${(block.game.objects as any[]).find(o => typeof o?.kind === 'string').elementId}].kind`
            const cited = [...openers.flatMap(t => ['awardedTo', 'placement.actor', 'placement.method', 'playState', 'selector'].map(field => at(t, field))), object]
            assert.deepEqual([...new Set([...when.from, ...how.from])].sort(), [...cited].sort(), `${what}: the one sentence's paths and nothing else`)
            for (const path_ of cited) {
                const taker = path_.endsWith('.awardedTo') || path_.endsWith('.placement.actor')
                assert.equal([when, how].filter(i => i.from.includes(path_)).length, taker ? 2 : 1, `${what}: ${path_}`)
            }
            assert.deepEqual([...where.from].sort(), openers.flatMap(t => ['placement.region', 'awardedTo', 'placement.actor'].map(field => at(t, field))).sort(), what)
        }
    }
    assert.equal(counts.size, 1, `the same number of sentences at every session (${[...counts]})`)
})

test('15. the first read carries every path read for understanding and beginning (fidelity Q3); a TEST-ONLY move of the WHEN into Restarts and ball out is refused', () => {
    for (const { what, fixture } of games) {
        const rendered = renderConcreteGame(fixture)
        assert.deepEqual(firstReadUncarried(rendered.instructions, sectionFactsOf(fixture)), [], what)
        assert.deepEqual(checkFidelity(fixture, rendered).findings.filter(f => f.what.includes('is needed to understand and begin')), [], what)
    }
    const [block] = a01Blocks.map(b => b.fixture)
    const facts = sectionFactsOf(block)
    const rendered = renderConcreteGame(block)
    const when = rendered.instructions.find(i => i.text.startsWith(`${TAKER}:`))!
    const openers = (block.game.transitions as any[]).filter(t => facts.transitionKind(String(t.elementId)) === 'EPISODE_OPENER')
    // The taker and the play state of each opening restart are cited in the first read only by the WHEN. (Its triggers' selectors are
    // also cited by the start placement, its antecedent, so they stay carried: the check reads citations, not words.)
    const expected = openers.flatMap(t => ['awardedTo', 'placement.actor', 'playState'].map(field => `transitions[${t.elementId}].${field}`)).sort()
    const toRestarts = (i: Instruction): Instruction => ({ ...i, section: RESTARTS, when: 'ADMINISTER' })
    const moved = { ...rendered, instructions: rendered.instructions.map(i => (i === when ? toRestarts(i) : i)) }
    assert.deepEqual([...firstReadUncarried(moved.instructions, facts)].sort(), expected)
    const q3 = checkFidelity(block, moved).findings.filter(f => f.what.includes('is needed to understand and begin'))
    assert.deepEqual(q3.map(f => [f.question, f.severity]), expected.map(() => [3, 'VIOLATION']))
    assert.deepEqual(q3.map(f => f.what.split(' ')[0]).sort(), expected)
    // The start placement moved with it: the selectors are uncarried too.
    const both = { ...moved, instructions: moved.instructions.map(i => (i.text.startsWith('Before each of these restarts') ? toRestarts(i) : i)) }
    const selectors = openers.map(t => `transitions[${t.elementId}].selector`)
    assert.ok(selectors.every(path_ => firstReadUncarried(both.instructions, facts).includes(path_)))
    // On the built chain: TEST-ONLY placement sends the WHEN (an opener's sentence naming its taker) into Restarts and ball out; the activity
    // is refused at communication, naming each path.
    const original = sectionsModule.assignSection
    try {
        ;(sectionsModule as any).assignSection = (instruction: any, f: SectionFacts, rows?: Map<string, string>) => {
            const placed = original(instruction, f, rows)
            return placed.kind === 'EPISODE_OPENER' && instruction.from.some((p: string) => p.endsWith('.placement.actor')) ? { ...placed, section: RESTARTS, when: 'ADMINISTER' } : placed
        }
        const refused = a01(12, 1).activity as RefusedActivity
        assert.equal(refused.outcome, 'refused')
        assert.equal(refused.stage, 'communication')
        for (const path_ of expected) assert.ok(refused.reasons.some(reason => reason.includes(`fidelity Q3: ${path_} is needed to understand and begin`)), path_)
    } finally {
        ;(sectionsModule as any).assignSection = original
    }
    assert.equal(a01(12, 1).activity.outcome, 'served', 'production restored')
})

console.log(`\n${passed} passed`)
