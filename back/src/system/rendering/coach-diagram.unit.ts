/**
 * The field diagram every viewer is served, and D9 — stage 5B, 22 October 2026 (`coach-diagram.ts`, served by `build-activity.ts`).
 *
 * His reply filed 23 October 2026, item 5: one recognizable look for every target zone, team identity apart; the physical markings kept,
 * each block's active objectives emphasized, no other block named; goals only where the activity holds them; nothing the activity does not
 * authorize. Item 7: no activity-specific communication exception.
 *
 * Pinned here, on the real chain:
 *
 *   1. A01 at 12/1, 12/2 and 11/1: the coach's answer carries the diagram, the same as the administrator's, whose draft says it is served;
 *      every element is the checked model's, in order; each target labelled "<team noun>'s target zone" (words Set up says); each team's
 *      look kept across the blocks; the counts as the Players sentence says them; the description composed from the model; no data key,
 *      id or path anywhere in it; no other block named;
 *   2. the demonstrations and refusals: the end lines as line targets with no label and the counts said together; the diagram the server
 *      withholds is served to no one while the activity and its overview are; a refused activity has none;
 *   3. D9 refuses each mutation of the coach's diagram (TEST-ONLY): a data key, an id, a path character or another block's name in a word;
 *      an element dropped, moved or restated; a team's look swapped between blocks; an extra key; and the production diagram passes;
 *   4. a D9 failure withholds the diagram only, on the real chain (TEST-ONLY patch, restored): the activity and its overview are the coach's;
 *   5. markings presented block by block (TEST-ONLY 15 m line): the description gives each block's own distance, never "halfway";
 *   6. an object a team scores at is shown once, as the object, marked as a target (TEST-ONLY objects);
 *   7. nothing activity-specific is written in coach-diagram.ts or in the page's FieldDiagram.tsx.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { LoadedContract } from '../derivation/types'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { reviewActivity } from './activity-review'
import { buildActivity, buildActivityForReview, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import * as coachDiagramModule from './coach-diagram'
import { checkCoachDiagram, CoachDiagram, coachDiagramOf, diagramForServing } from './coach-diagram'
import { DiagramFinding, DiagramInput, fieldDiagramDraftOf } from './field-diagram'
import { transitionsOf } from './game-reading'
import { renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the field diagram a coach is served, and D9 (stage 5B)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionAt = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } })
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: sessionAt(players, keepers) })
const demo = (id: string, keepers = 1) => ({ kind: 'mechanism-demonstration' as const, demonstrationId: id, session: sessionAt(12, keepers) })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const index = indexRegister(loadRegister())
const copyInput = (input: DiagramInput): DiagramInput => ({ ...copy({ ...input, index: null }), index: input.index })

/** The diagram's input exactly as the build hands it (as field-diagram.unit.ts reads it). */
function inputOf(request: any, alter?: (contracts: LoadedContract[]) => void): { input: DiagramInput; activity: ServedActivity } {
    const built = alter
        ? buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { alter, review: { includeDrafts: true } })
        : { activity: buildActivityForReview(request, { includeDrafts: true }), fixture: buildActivityWithFixture(request).fixture }
    const activity = built.activity as ServedActivity
    assert.equal(activity.outcome, 'served', JSON.stringify((activity as unknown as RefusedActivity).reasons))
    const fixture: any = built.fixture
    const blocks: any[] = fixture.roleBlocks ? fixture.roleBlocks.blocks : [{ blockId: 'ONE_GAME', fixture }]
    const games = blocks.map(block => ({ blockId: block.blockId, holders: { ...(block.fixture.record?.roleBlock?.holders ?? {}) }, fixture: block.fixture, rendered: renderConcreteGame(block.fixture).instructions }))
    const roleBlocks = activity.roleBlocks ? activity.roleBlocks.blocks.map(block => ({ blockId: block.blockId, holders: { ...block.holders } })) : null
    return { input: { session: activity.session, games, served: activity.rendered.instructions, roleBlocks, index }, activity }
}
const refusedBy = (findings: DiagramFinding[], includes: string, what: string) =>
    assert.ok(findings.some(finding => finding.rule === 'D9' && finding.what.includes(includes)), `${what}: expected D9 "${includes}", got ${JSON.stringify(findings, null, 1)}`)
/** Every data key, id and path fragment the games hold, as a test reads them: none may appear anywhere in what a coach is served. */
function dataIn(input: DiagramInput): string[] {
    const found = new Set<string>(['ROLE_HOLDER', 'space.regions', 'layout.', 'objectives[', 'performers.', 'c:provisional', 'c:restated'])
    for (const game of input.games) {
        found.add(game.blockId)
        for (const [role, holder] of Object.entries(game.holders)) found.add(role).add(holder)
        for (const element of [...(game.fixture.game.space?.regions ?? []), ...(game.fixture.game.objectives ?? []), ...(game.fixture.game.performers?.startPlacement ?? [])]) found.add(String(element.elementId))
    }
    return [...found]
}

const PROD = inputOf(a01At(12, 1))
const PROD_OUTCOME = diagramForServing(PROD.input, { title: PROD.activity.title })
const PROD_COACH = PROD_OUTCOME.diagram!
const PROD_MODEL = PROD_OUTCOME.draft.diagram!

test('1. A01 at 12/1, 12/2 and 11/1: every viewer is served the checked model in coach words, block by block, with nothing of the data', () => {
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const viaRoute = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    assert.deepEqual(viaRoute.diagram, PROD_COACH, 'the coach\'s review answer carries it')
    assert.ok(!('diagramDraft' in viaRoute), 'and no model, findings or notes')
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const { input, activity } = inputOf(a01At(players, keepers))
        const coach = buildActivity(a01At(players, keepers)) as ServedActivity
        const diagram = coach.diagram!
        assert.ok(diagram, `${what}: the coach's answer carries the diagram`)
        assert.deepEqual(activity.diagram, diagram, `${what}: the administrator is served the same diagram`)
        assert.equal(activity.diagramDraft!.served, true)
        assert.equal(activity.diagramDraft!.verdict, 'DRAWN')
        const model = activity.diagramDraft!.diagram!
        assert.deepEqual(diagram, coachDiagramOf(model, { title: activity.title }), `${what}: composed from the administrator's checked model`)
        assert.deepEqual(checkCoachDiagram(diagram, model, input, { title: activity.title }), [])
        assert.deepEqual(diagram.area, { lengthM: 40, widthM: 30 })
        assert.deepEqual(diagram.legend, [
            { kind: 'MARKED_LINE', text: 'marked line' },
            { kind: 'TARGET_ZONE', text: 'target zone' },
            { kind: 'STARTING_AREA', text: 'starting area' },
        ])
        assert.equal(diagram.blocks.length, 2)
        const setUp = coach.rendered.instructions.filter(instruction => instruction.section === 'Set up').map(instruction => instruction.text.toLowerCase())
        const looks = new Map<string, number>()
        diagram.blocks.forEach((block, i) => {
            const at = model.blocks[i]
            assert.equal(block.label, `Block ${i + 1}`)
            assert.equal(block.title, `${activity.title}: Block ${i + 1}`)
            // The markings: the same in both blocks (set out once), the marked line labelled with his term.
            assert.deepEqual(block.lines, diagram.blocks[0].lines)
            assert.deepEqual(block.lines.map(line => [line.along.from, line.markedLine, line.label]), [[5, false, null], [20, true, 'marked line'], [35, false, null]])
            // What each marked zone is in this block: the active pressing target, or inside the building team's target; never a label.
            assert.deepEqual(block.zones.map(zone => zone.state), i === 0 ? ['TARGET', 'INSIDE_TARGET'] : ['INSIDE_TARGET', 'TARGET'])
            assert.ok(block.zones.every(zone => !('label' in zone)))
            // The active targets: one look, each labelled in words Set up says.
            assert.deepEqual(block.targets.map(target => [target.along, target.label]), at.targets.map(target => [target.along, `${target.attackedBy === 'BUILDING' ? 'building' : 'pressing'} team's target zone`]))
            for (const target of block.targets) assert.ok(setUp.some(text => text.includes(target.label!)), `${what}: "${target.label}" is said by Set up`)
            // Teams: their nouns, counts as the Players sentence says them, starting areas and attacking ends; one look each, kept.
            for (const team of block.teams) {
                const role = team.noun === 'building team' ? 'BUILDING' : 'PRESSING'
                const modelTeam = at.teams.find(entry => entry.role === role)!
                assert.deepEqual(team.counts, modelTeam.counts.map(count => count.word.text))
                assert.deepEqual(team.start, { along: modelTeam.start!.along, across: modelTeam.start!.across })
                assert.deepEqual(team.attacks, modelTeam.attacks.map(attack => attack.end))
                if (looks.has(role)) assert.equal(team.identity, looks.get(role), `${what}: ${role} keeps its look`)
                looks.set(role, team.identity)
            }
            if (keepers === 2) assert.deepEqual(block.teams.map(team => team.counts), [['1 goalkeeper', '6 other players'], ['5 other players']], `${what}: the roster's own words`)
            // The description: the area, the marked line's distance from its end line, each zone and what it is, each team.
            for (const part of ['40 m by 30 m area.', 'A marked line across the area, 20 m from the building team\'s end line.', 'the pressing team\'s target zone', 'inside the building team\'s target zone', 'The building team\'s target zone is the 20 m at the pressing team\'s end.', 'starting area from its end line to the marked line']) {
                assert.ok(block.desc.includes(part), `${what} block ${i + 1}: the description says "${part}": ${block.desc}`)
            }
            for (const team of block.teams) assert.ok(team.counts.every(count => block.desc.includes(count)))
            assert.ok(!JSON.stringify(block).includes(`Block ${2 - i}`), `${what} block ${i + 1}: no other block is named`)
        })
        assert.deepEqual([...looks.values()].sort(), [0, 1], `${what}: two looks, one per team`)
        const served = JSON.stringify(diagram)
        for (const data of dataIn(input)) assert.ok(!served.includes(data), `${what}: "${data}" is in what a coach is served`)
        assert.ok(!served.includes('halfway'), 'the diagram writes no derived term the model does not carry')
    }
})

test('2. demonstrations and refusals: line targets and counts together; a withheld diagram is served to no one; a refusal has none', () => {
    for (const keepers of [0, 1, 2]) {
        const neutral = buildActivity(demo('neutral-players', keepers)) as ServedActivity
        const admin = buildActivityForReview(demo('neutral-players', keepers), { includeDrafts: true }) as ServedActivity
        const diagram = neutral.diagram!
        assert.deepEqual(admin.diagram, diagram)
        assert.equal(diagram.blocks.length, 1)
        const [block] = diagram.blocks
        assert.equal(block.label, null)
        assert.equal(block.title, neutral.title)
        assert.deepEqual(block.targets.map(target => [target.along, target.line, target.label]), [[{ from: 40, to: 40 }, true, null], [{ from: 0, to: 0 }, true, null]])
        assert.deepEqual(block.teams.map(team => [team.identity, team.noun, team.start, team.attacks]), [[0, null, null, [40]], [1, null, null, [0]]])
        assert.deepEqual(diagram.counts, ['2 teams of 5', '2 neutral players'])
        assert.deepEqual(diagram.legend, [])
        assert.equal(block.desc, '40 m by 30 m area. Each team attacks the line at the other team\'s end. 2 teams of 5 and 2 neutral players.')
        // The demonstration whose channels Set up states as limits: withheld for everyone, the activity and its overview served unchanged.
        const coachModifier = buildActivity(demo('scoring-modifier', keepers)) as ServedActivity
        const adminModifier = buildActivityForReview(demo('scoring-modifier', keepers), { includeDrafts: true }) as ServedActivity
        assert.ok(!('diagram' in coachModifier) && !('diagram' in adminModifier))
        assert.equal(adminModifier.diagramDraft!.served, false)
        assert.equal(adminModifier.diagramDraft!.verdict, 'WITHHELD')
        assert.deepEqual(adminModifier.rendered, coachModifier.rendered)
        assert.ok(coachModifier.overview, 'its overview is still served')
        assert.deepEqual(adminModifier.overview, coachModifier.overview)
    }
    for (const answer of [buildActivity(a01At(12, 0)), buildActivityForReview(a01At(12, 0), { includeDrafts: true }), buildActivity(demo('pass-combination-gate'))]) {
        assert.equal(answer.outcome, 'refused')
        assert.ok(!('diagram' in answer) && !('diagramDraft' in answer))
    }
})

test('3. D9 refuses each mutation of the coach\'s diagram, and the production diagram passes (TEST-ONLY)', () => {
    const context = { title: PROD.activity.title }
    assert.deepEqual(checkCoachDiagram(PROD_COACH, PROD_MODEL, PROD.input, context), [])
    const mutate = (change: (diagram: CoachDiagram) => void): DiagramFinding[] => {
        const diagram = copy(PROD_COACH)
        change(diagram)
        return checkCoachDiagram(diagram, PROD_MODEL, PROD.input, context)
    }
    // Words: a data key, an id, a path character, another block's name; a value an actor holds, as a whole word.
    refusedBy(mutate(d => (d.blocks[0].targets[0].label = 'BUILDING team\'s target zone')), 'holds the data key BUILDING', 'data key')
    refusedBy(mutate(d => (d.blocks[0].desc = `${d.blocks[0].desc} See c:restated:GF2:GF2-03.e.`)), 'holds the id c:restated:GF2:GF2-03.e', 'id')
    refusedBy(mutate(d => (d.blocks[1].teams[0].noun = 'team[0]')), 'which no coach word holds', 'path character')
    refusedBy(mutate(d => (d.blocks[0].title = `${d.blocks[0].title} (then Block 2)`)), 'names another block', 'other block in the title')
    refusedBy(mutate(d => (d.blocks[1].desc = `${d.blocks[1].desc} Unlike Block 1.`)), 'names another block', 'other block in the description')
    const actor = PROD.input.games.flatMap(game => transitionsOf(game, index)).map(row => row.actor as unknown).find((value): value is string => typeof value === 'string' && /^[a-z]+$/.test(value))
    assert.ok(actor, 'the production game has a restart actor written as one plain word')
    refusedBy(mutate(d => (d.blocks[0].lines[1].label = actor!)), 'is a data key or value', 'an actor value as a word')
    // Elements: dropped, moved, restated; a zone's state; a team's look swapped in the second block; a count; a dimension; extra keys.
    refusedBy(mutate(d => d.blocks[0].targets.pop()), 'not the model\'s active targets', 'target dropped')
    refusedBy(mutate(d => (d.blocks[1].targets[0].along = { from: 30, to: 40 })), 'not the model\'s active targets', 'target moved')
    refusedBy(mutate(d => (d.blocks[0].targets[1].label = 'target zone')), 'not the model\'s active targets', 'label restated')
    refusedBy(mutate(d => (d.blocks[0].zones[1].state = 'MARKED')), 'each as it is in this block', 'zone state')
    refusedBy(mutate(d => (d.blocks[0].lines[1].along = { from: 22, to: 22 })), 'not the model\'s markings', 'line moved')
    refusedBy(
        mutate(d => {
            d.blocks[1].teams[0].identity = 1
            d.blocks[1].teams[1].identity = 0
        }),
        'does not keep one look of its own',
        'looks swapped',
    )
    refusedBy(mutate(d => (d.blocks[0].teams[0].counts = ['7 outfield players', '1 goalkeeper'])), 'team\'s words are not the model\'s', 'count')
    refusedBy(mutate(d => (d.blocks[0].teams[1].start = null)), 'starting area is not the model\'s', 'start dropped')
    refusedBy(mutate(d => (d.blocks[1].teams[0].attacks = [40])), 'attacking direction is not the model\'s', 'arrow')
    refusedBy(mutate(d => (d.blocks[0].dimensions[4].label = '25 m')), 'dimensions shown are not the model\'s', 'dimension')
    refusedBy(mutate(d => ((d.blocks[0].teams[0] as any).positions = [{ along: 3, across: 15 }])), 'holds positions', 'positions')
    refusedBy(mutate(d => ((d.blocks[0] as any).passingLines = [])), 'holds passingLines', 'passing lines')
    refusedBy(mutate(d => ((d as any).cites = ['envelope.area.length_m'])), 'holds cites', 'citations')
    refusedBy(mutate(d => d.blocks.pop()), '1 blocks are shown and the model has 2', 'block dropped')
    refusedBy(mutate(d => (d.legend[1].kind = 'MARKED_LINE')), 'the legend gives "target zone" to MARKED_LINE', 'legend')
    // The unchanged diagram passes.
    assert.deepEqual(mutate(() => undefined), [])
})

test('4. a D9 failure withholds the diagram only: the activity and its overview are the coach\'s (TEST-ONLY patch, restored)', () => {
    // Directly: a composition that leaks a key, or throws, is refused and nothing is served.
    const leaking = diagramForServing(PROD.input, { title: PROD.activity.title }, { project: (model, context) => ({ ...coachDiagramOf(model, context), counts: ['PRESSING'] }) })
    assert.equal(leaking.diagram, null)
    assert.equal(leaking.draft.served, false)
    assert.equal(leaking.draft.verdict, 'WITHHELD')
    refusedBy(leaking.draft.findings, 'the counts said together are not the model\'s', 'leaking counts')
    assert.deepEqual(leaking.draft.diagram, PROD_MODEL, 'the administrator still sees the model')
    const throwing = diagramForServing(PROD.input, { title: PROD.activity.title }, {
        project: () => {
            throw new Error('TEST-ONLY failure')
        },
    })
    assert.equal(throwing.diagram, null)
    refusedBy(throwing.draft.findings, 'could not be composed: TEST-ONLY failure', 'throwing')
    // On the real chain.
    const module = coachDiagramModule as { diagramForServing: typeof diagramForServing }
    const original = module.diagramForServing
    const coach = buildActivity(a01At(12, 1)) as ServedActivity
    try {
        module.diagramForServing = (input, context) => original(input, context, { project: (model, ctx) => ({ ...coachDiagramOf(model, ctx), legend: [] }) })
        for (const answer of [buildActivity(a01At(12, 1)) as ServedActivity, buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity]) {
            assert.equal(answer.outcome, 'served')
            assert.equal(answer.rendered.instructions.length, 28)
            assert.deepEqual(answer.rendered, coach.rendered)
            assert.deepEqual(answer.overview, coach.overview)
            assert.ok(!('diagram' in answer))
        }
        const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
        refusedBy(admin.diagramDraft!.findings, 'the legend is not the model\'s', 'chain')
        module.diagramForServing = () => {
            throw new Error('TEST-ONLY failure')
        }
        const thrown = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
        assert.equal(thrown.outcome, 'served')
        assert.deepEqual(thrown.rendered, coach.rendered)
        assert.ok(!('diagram' in thrown))
        assert.equal(thrown.diagramDraft!.verdict, 'WITHHELD')
    } finally {
        module.diagramForServing = original
    }
    assert.deepEqual((buildActivity(a01At(12, 1)) as ServedActivity).diagram, PROD_COACH)
})

test('5. markings presented block by block (TEST-ONLY 15 m line): each block\'s own distance in the description, never "halfway"', () => {
    const offsetFifteen = (contracts: LoadedContract[]) => {
        const item: any = contracts.find(contract => contract.contractId === 'provisional:A01-R1')!.items.find(entry => entry.itemId === 'A01-R1-S5-1')
        item.value = { ...item.value, offsetM: { from: 15, to: 15 }, asAuthored: "TEST-ONLY 15 m from the building team's end line" }
    }
    const { activity } = inputOf(a01At(12, 1), offsetFifteen)
    const diagram = activity.diagram!
    assert.ok(diagram, JSON.stringify(activity.diagramDraft!.findings))
    assert.deepEqual(diagram.blocks.map(block => block.lines.map(line => [line.along.from, line.markedLine])), [[[15, true]], [[25, true]]])
    for (const block of diagram.blocks) {
        assert.ok(block.desc.includes('A marked line across the area, 15 m from the building team\'s end line.'), block.desc)
        assert.ok(!block.desc.includes('halfway'))
    }
})

test('6. an object a team scores at is shown once, as the object, marked as a target (TEST-ONLY objects)', () => {
    const neutral = inputOf(demo('neutral-players'))
    const input = copyInput(neutral.input)
    for (const game of input.games) {
        game.fixture.game.objectives.forEach((objective: any, n: number) => {
            const id = `c:TEST-ONLY:OBJECT-T${n + 1}`
            const region = `c:${objective.reference.structuralRef.contractId}:${objective.reference.structuralRef.itemId}`
            const along = game.fixture.status.geometry.find((g: any) => g.path === `space.regions[${region}].position.along`).geometry.interval
            game.fixture.game.objects.push({ elementId: id, kind: 'TEST-ONLY object', position: { along: 'TEST-ONLY', across: 'TEST-ONLY' } })
            game.fixture.status.geometry.push({ path: `objects[${id}].position.along`, geometry: { axis: 'along', interval: { ...along } } })
            game.fixture.status.geometry.push({ path: `objects[${id}].position.across`, geometry: { axis: 'across', interval: { from: 13, to: 17 } } })
            objective.reference.structuralRef = { contractId: 'TEST-ONLY', itemId: `OBJECT-T${n + 1}` }
            const sentence = { section: 'Set up' as const, text: `Place a TEST-ONLY object on end line ${n + 1}`, status: 'DERIVED' as const, from: [`objects[${id}].kind`, `objects[${id}].position.along`, `objects[${id}].position.across`], quantities: [] }
            game.rendered.push(sentence)
            input.served.push(sentence)
        })
    }
    assert.equal(fieldDiagramDraftOf(input).verdict, 'DRAWN')
    const outcome = diagramForServing(input, { title: neutral.activity.title })
    assert.ok(outcome.diagram, JSON.stringify(outcome.draft.findings, null, 1))
    const [block] = outcome.diagram!.blocks
    assert.deepEqual(block.targets, [], 'an object target is not repeated among the targets')
    assert.deepEqual(block.objects.map(object => [object.along, object.across, object.label, object.target]), [
        [{ from: 40, to: 40 }, { from: 13, to: 17 }, 'TEST-ONLY object', true],
        [{ from: 0, to: 0 }, { from: 13, to: 17 }, 'TEST-ONLY object', true],
    ])
    assert.ok(block.desc.includes('TEST-ONLY object is placed on one end line'), block.desc)
    assert.ok(!JSON.stringify(outcome.diagram).includes('OBJECT-T'), 'no object id is served')
})

test('7. nothing activity-specific is written in coach-diagram.ts or in the page\'s FieldDiagram.tsx', () => {
    const uncommented = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const server = uncommented(fs.readFileSync(path.join(__dirname, 'coach-diagram.ts'), 'utf8'))
    for (const literal of ['A01', 'RPC-0', 'GF2', 'BUILDING', 'PRESSING', 'TEAM_AT_AXIS', 'halfway', 'building team', 'pressing team']) assert.ok(!server.includes(literal), `coach-diagram.ts: ${literal}`)
    for (const value of ['5', '20', '30', '40', '12']) assert.ok(!new RegExp(`(^|[^\\w.])${value}([^\\w.]|$)`).test(server), `coach-diagram.ts: the number ${value} is typed in the code`)
    const page = uncommented(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'front', 'src', 'app', 'FieldDiagram.tsx'), 'utf8'))
    for (const literal of ['A01', 'BUILDING', 'PRESSING', 'halfway', 'building', 'pressing', 'marked line', 'target zone', 'starting area', 'Block ', ' m\'', '"m"']) assert.ok(!page.includes(literal), `FieldDiagram.tsx types "${literal}"`)
})

console.log(`coach-diagram.unit.ts — ${passed} passed`)
