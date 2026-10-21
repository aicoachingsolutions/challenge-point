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
import {
    assignSection,
    inSectionOrder,
    KIND_OF_ROW,
    LABEL_STATUS,
    Placement,
    PLAY_STATE_UNREADABLE,
    RESTARTS,
    ROLE_EXCHANGE,
    rowIndexOf,
    rowOfPath,
    registerRowIndex,
    SECTION_ORDER,
    SectionFacts,
    sectionLabelsOf,
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
console.log('one section and when-needed assigner (stage 2A)')

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
        assert.equal(instructions.filter(i => i.section === RESTARTS).length, 2)
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

console.log(`\n${passed} passed`)
