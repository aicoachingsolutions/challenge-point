/**
 * Team identity, roles and the reassignment in the field diagram — stage C2 (`field-diagram.ts` D10, `coach-diagram.ts` D9, the page's
 * FieldDiagram.tsx).
 *
 * His reply filed 24 October 2026, item 4: *"For colors, I would generally prefer stable team identities, with building and pressing roles
 * identified separately. If Team A is blue in Block 1, it should ordinarily remain blue in Block 2, even though its responsibilities
 * change. However, the current activity also reassigns a goalkeeper and one outfield player between teams, so please check how best to
 * represent that clearly. My priority is that a coach can distinguish team identity, assigned role, and attacking direction without
 * confusion. The green target-zone convention is working well."*
 *
 * Pinned here, on the real chain:
 *
 *   1. A01 at 12/1, 12/2 and 11/1: each team's look is its place among the realized teams and stays with it in both blocks while its role
 *      changes; its DRAFT label ("Team A", "Team B", in the realized team order) is the model's, its noun its role in the block; each team
 *      keeps its end and its attacking direction; each block says what moves at the exchange into it, the performers in the served Role
 *      exchange sentence's words, to the team that holds the building role in that block from the one holding it in the other, and both
 *      blocks' counts change exactly so; the description carries the same; the legend says what a colour, the role badge and an arrow are;
 *   2. the look follows the realized team whichever block is shown first (TEST-ONLY copy, blocks reversed);
 *   3. the demonstrations under the same rules: unlabelled teams, no exchange, looks by place, the legend unchanged; the withheld one
 *      still withheld;
 *   4. D10 refuses each mutation of the model (TEST-ONLY): a team's realized team or place, a label wrong, dropped or added where teams are
 *      not labelled, an exchange dropped, reversed, recounted, reworded, renamed or added to a game not played in blocks, counts that do not
 *      change as stated, the legend's words; and a required relationship that cannot be read (no served Role exchange sentence) withholds
 *      the diagram, never the activity;
 *   5. D9 refuses each mutation of the coach's diagram (TEST-ONLY): a label, a look set by role, an exchange sentence reversed, dropped or
 *      naming another block, a legend word given another kind;
 *   6. nothing activity-specific or worded is typed in the page's FieldDiagram.tsx, and no team name in coach-diagram.ts.
 *
 * AMENDED 25 October 2026 (P1; his reply filed 28 October 2026, item 11: "I'd prefer the selected block's diagram to focus on the immediate
 * configuration, with the role-exchange procedures explained once in Coach Details."): no block of the coach's diagram says what moves at the
 * exchange into it any more, beside the drawing or in its description (items 1, 2, 3 and 5 pin that now); the model still holds each block's
 * exchange, which D10 holds to the reassignments and both blocks' counts (item 4, unchanged), and the served Role exchange sentence says it once.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { buildActivity, buildActivityForReview, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { checkCoachDiagram, CoachDiagram, coachDiagramOf, diagramForServing } from './coach-diagram'
import { checkFieldDiagram, DIAGRAM_WORDS, DiagramFinding, DiagramInput, FieldDiagram, fieldDiagramDraftOf } from './field-diagram'
import { renderConcreteGame } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('team identity, roles and the reassignment in the field diagram (stage C2)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionAt = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } })
// Re-pointed 24 October 2026 (K3, the d27 design's stage K3): A01's session states that it has no goal, so the zone version (A01-R1) is built
// exactly as before. Since K3 A01's record tries the goal version first, and a session that has not said what goals it has is asked first
// (his reply filed 26 October 2026, item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as
// confirmation that no goal exists."). The demonstrations keep the session as it was.
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { ...sessionAt(players, keepers), objects: { goal: { count: 0 } } } })
const demo = (id: string, keepers = 1) => ({ kind: 'mechanism-demonstration' as const, demonstrationId: id, session: sessionAt(12, keepers) })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const index = indexRegister(loadRegister())
const copyInput = (input: DiagramInput): DiagramInput => ({ ...copy({ ...input, index: null }), index: input.index })

/** The diagram's input exactly as the build hands it (as field-diagram.unit.ts reads it). */
function inputOf(request: any): { input: DiagramInput; activity: ServedActivity; fixture: any } {
    const activity = buildActivityForReview(request, { includeDrafts: true }) as ServedActivity
    assert.equal(activity.outcome, 'served', JSON.stringify((activity as unknown as RefusedActivity).reasons))
    const fixture: any = buildActivityWithFixture(request).fixture
    const blocks: any[] = fixture.roleBlocks ? fixture.roleBlocks.blocks : [{ blockId: 'ONE_GAME', fixture }]
    const games = blocks.map(block => ({ blockId: block.blockId, holders: { ...(block.fixture.record?.roleBlock?.holders ?? {}) }, fixture: block.fixture, rendered: renderConcreteGame(block.fixture).instructions }))
    const roleBlocks = activity.roleBlocks ? activity.roleBlocks.blocks.map(block => ({ blockId: block.blockId, holders: { ...block.holders } })) : null
    return { input: { session: activity.session, games, served: activity.rendered.instructions, roleBlocks, index }, activity, fixture }
}
const refused = (findings: DiagramFinding[], rule: string, includes: string, what: string) =>
    assert.ok(findings.some(finding => finding.rule === rule && finding.what.includes(includes)), `${what}: expected ${rule} "${includes}", got ${JSON.stringify(findings, null, 1)}`)

const PROD = inputOf(a01At(12, 1))
const PROD_OUTCOME = diagramForServing(PROD.input, { title: PROD.activity.title })
const PROD_COACH = PROD_OUTCOME.diagram!
const PROD_MODEL = PROD_OUTCOME.draft.diagram!

test('1. A01 at 12/1, 12/2 and 11/1: one look and label per realized team in both blocks, its role apart, and what moves at each exchange', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const { input, activity, fixture } = inputOf(a01At(players, keepers))
        const coach = buildActivity(a01At(players, keepers)) as ServedActivity
        const diagram = coach.diagram!
        assert.ok(diagram, `${what}: served`)
        const model = activity.diagramDraft!.diagram!
        assert.deepEqual(checkFieldDiagram(model, input), [])
        assert.deepEqual(diagram, coachDiagramOf(model, { title: activity.title }))
        // The realized teams, read here from the games, not from the model: their elements and order.
        const realized = (block: number): string[] => fixture.roleBlocks.blocks[block].fixture.game.performers.teams.map((team: any) => String(team.elementId))
        assert.deepEqual(realized(0), realized(1), `${what}: the same realized teams, in the same order, in both blocks`)
        const holderOf = (block: number, role: string): string => {
            const designation = fixture.roleBlocks.blocks[block].fixture.record.roleBlock.holders[role]
            return fixture.roleBlocks.blocks[block].fixture.record.designationBindings.find((binding: any) => binding.designation === designation).handle
        }
        const lookOf = new Map<string, number>()
        diagram.blocks.forEach((block, i) => {
            const modelBlock = model.blocks[i]
            assert.equal(block.teams.length, 2)
            block.teams.forEach((team, n) => {
                const handle = modelBlock.teams[n].handle
                const place = realized(i).indexOf(handle)
                // The look is the realized team's place, kept across the blocks; the label is "Team" and that place's letter (DRAFT).
                assert.equal(team.identity, place, `${what} block ${i + 1}: the look is the team's place among the realized teams`)
                if (lookOf.has(handle)) assert.equal(team.identity, lookOf.get(handle), `${what}: ${handle} keeps its look in every block`)
                lookOf.set(handle, team.identity)
                assert.equal(team.label, `Team ${'AB'[place]}`)
                assert.deepEqual(modelBlock.teams[n].label, { text: team.label, status: 'DRAFT', carriedBy: null }, `${what}: the label is a DRAFT word, carried by no sentence`)
                // The noun is the role the team holds in this block, as the game binds it.
                const role = handle === holderOf(i, 'BUILDING') ? 'BUILDING' : 'PRESSING'
                assert.equal(team.noun, role === 'BUILDING' ? 'building team' : 'pressing team')
            })
            // Team A starts at the end along 0 and attacks the other end in both blocks: the teams exchange roles, not ends.
            const teamA = block.teams.find(team => team.label === 'Team A')!
            const teamB = block.teams.find(team => team.label === 'Team B')!
            assert.equal(teamA.start!.along.from, 0)
            assert.deepEqual(teamA.attacks, [40])
            assert.equal(teamB.start!.along.to, 40)
            assert.deepEqual(teamB.attacks, [0])
            assert.notEqual(teamA.identity, teamB.identity)
        })
        // Each team's role changes between the blocks; its look and label do not.
        for (const label of ['Team A', 'Team B']) {
            const views = diagram.blocks.map(block => block.teams.find(team => team.label === label)!)
            assert.notEqual(views[0].noun, views[1].noun, `${what}: ${label}'s role changes`)
            assert.equal(views[0].identity, views[1].identity, `${what}: ${label}'s look does not`)
        }

        // What moves at the exchange into each block, pinned independently of the composition: the performers as the served Role exchange
        // sentence says them, to the team holding the building role in this block, from the team holding it in the other block.
        const exchangeSentence = coach.rendered.instructions.find(instruction => instruction.section === 'Role exchange' && instruction.text.startsWith('When you call the next block, '))!
        assert.ok(exchangeSentence, `${what}: the served Role exchange sentence`)
        const lead = 'When you call the next block, '
        const verbAt = exchangeSentence.text.search(/ moves? to the team that becomes the building team$/)
        assert.ok(verbAt > 0, exchangeSentence.text)
        const moving = exchangeSentence.text.slice(lead.length, verbAt)
        const verb = exchangeSentence.text.slice(verbAt + 1).split(' ')[0]
        diagram.blocks.forEach((block, i) => {
            const labelOf = (handle: string) => block.teams[model.blocks[i].teams.findIndex(team => team.handle === handle)].label
            const to = labelOf(holderOf(i, 'BUILDING'))
            const from = labelOf(holderOf(1 - i, 'BUILDING'))
            // Re-pointed 25 October 2026 (P1; his reply filed 28 October 2026, item 11: "I'd prefer the selected block's diagram to focus on the
            // immediate configuration, with the role-exchange procedures explained once in Coach Details."): no block says what moves at the
            // exchange into it, beside the drawing or in its description; the served Role exchange sentence (read above) says it once, and the
            // model still holds the exchange (D10 below). Was: "When you return to this block, ..." (block 1) and "When you call this block,
            // ..." (block 2), "<performers> move from <label> to <label>, which becomes the building team.", also closing the description.
            assert.ok(!('exchange' in block), `${what} block ${i + 1}: no exchange sentence`)
            assert.ok(!/When you (call|return to) this block/.test(block.desc) && !block.desc.includes(`${moving} ${verb} from ${from} to ${to}`), `${what} block ${i + 1}: ${block.desc}`)
            assert.notEqual(to, from)
            // Both blocks' counts change exactly as it says: the team that becomes the building team gains, the other loses.
            const countsOf = (blockIndex: number, handle: string) => fixture.roleBlocks.blocks[blockIndex].fixture.game.performers.teams.find((team: any) => String(team.elementId) === handle)
            const gaining = holderOf(i, 'BUILDING')
            const losing = holderOf(1 - i, 'BUILDING')
            const outfield = countsOf(i, gaining).outfieldCount - countsOf(1 - i, gaining).outfieldCount
            const keepersMoved = countsOf(i, gaining).goalkeeper - countsOf(1 - i, gaining).goalkeeper
            assert.equal(moving, [keepersMoved ? `${keepersMoved} goalkeeper` : null, outfield ? `${outfield} outfield player` : null].filter(Boolean).join(' and '), `${what}: the counts change as the sentence says`)
            assert.equal(countsOf(i, losing).outfieldCount - countsOf(1 - i, losing).outfieldCount + outfield, 0)
            assert.equal(countsOf(i, losing).goalkeeper - countsOf(1 - i, losing).goalkeeper + keepersMoved, 0)
            // Each team's sentence of the description: its label, its role, its counts.
            for (const team of block.teams) assert.ok(block.desc.includes(`${team.label}, the ${team.noun}: ${team.counts.join(' and ')};`), `${what} block ${i + 1}: ${block.desc}`)
        })
        if (players === 11) assert.equal(moving, '1 goalkeeper', `${what}: only the goalkeeper moves (his reply filed 19 October 2026, item 3 F)`)
        // The model's exchanges cite the reassignments and bind each count, carried by that served sentence.
        for (const block of model.blocks) {
            assert.equal(block.exchanges.length, 1)
            const [exchange] = block.exchanges
            assert.equal(exchange.moving.carriedBy!.text, exchangeSentence.text)
            assert.equal(exchange.noun.carriedBy!.text, exchangeSentence.text)
            assert.deepEqual(exchange.bindings.map(binding => binding.path).sort(), exchangeSentence.parts!.flatMap(part => part.bindings.map(binding => binding.path)).sort())
        }
        // The legend: what a team's colour, the role badge and an arrow are, once each (DRAFT), and green target zones as before.
        // Re-pointed 25 October 2026 (Z): and the marked area, the zone version's penalty area (his reply filed 28 October 2026, item 7).
        assert.deepEqual(diagram.legend.map(entry => entry.kind), ['MARKED_LINE', 'TARGET_ZONE', 'STARTING_AREA', 'TEAM_COLOUR', 'ROLE', 'ATTACK', 'MARKED_AREA'])
        assert.deepEqual(
            model.legend.filter(word => word.status === 'DRAFT').map(word => word.text),
            [DIAGRAM_WORDS.draft.startingArea, DIAGRAM_WORDS.draft.teamColour, DIAGRAM_WORDS.draft.role, DIAGRAM_WORDS.draft.attack, 'penalty area'],
        )
        // The targets are unchanged by C2: one look, labelled by the attacking team's role.
        assert.ok(diagram.blocks.every(block => block.targets.every(target => /^(building|pressing) team's target zone$/.test(target.label!))))
    }
})

test('2. the look follows the realized team whichever block is shown first (TEST-ONLY copy, blocks reversed)', () => {
    const reversed = copyInput(PROD.input)
    reversed.games.reverse()
    reversed.roleBlocks!.reverse()
    const draft = fieldDiagramDraftOf(reversed)
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings, null, 1))
    const coach = coachDiagramOf(draft.diagram!, { title: PROD.activity.title })
    assert.deepEqual(checkCoachDiagram(coach, draft.diagram!, reversed, { title: PROD.activity.title }), [])
    const lookOf = (diagram: CoachDiagram, block: number, label: string) => diagram.blocks[block].teams.find(team => team.label === label)!
    for (const label of ['Team A', 'Team B']) {
        // The block shown first is now the other one: the same team has the same look and label, the role it holds there, and the sentence
        // for the exchange into that block.
        assert.equal(lookOf(coach, 0, label).identity, lookOf(PROD_COACH, 1, label).identity)
        assert.equal(lookOf(coach, 0, label).noun, lookOf(PROD_COACH, 1, label).noun)
        assert.deepEqual(lookOf(coach, 0, label).start, lookOf(PROD_COACH, 1, label).start)
    }
    // Re-pointed 25 October 2026 (P1; his reply filed 28 October 2026, item 11): no block says what moves, whichever is shown first. Was: what
    // moves followed the block, and the lead its place ("When you return to this block" for the block shown first).
    assert.ok(coach.blocks.every(block => !('exchange' in block)))
    // The model still holds what moves into each block, following the block (D10 holds it to the reassignments).
    assert.deepEqual(draft.diagram!.blocks.map(block => block.exchanges.map(exchange => exchange.moving.text)), [PROD_MODEL.blocks[1].exchanges.map(exchange => exchange.moving.text), PROD_MODEL.blocks[0].exchanges.map(exchange => exchange.moving.text)])
})

test('3. the demonstrations under the same rules: unlabelled teams, no exchange, looks by place; the withheld one still withheld', () => {
    for (const keepers of [0, 1, 2]) {
        const neutral = inputOf(demo('neutral-players', keepers))
        const diagram = neutral.activity.diagram!
        const model = neutral.activity.diagramDraft!.diagram!
        assert.deepEqual(checkFieldDiagram(model, neutral.input), [])
        assert.deepEqual(diagram.blocks[0].teams.map(team => [team.identity, team.label, team.noun]), [[0, null, null], [1, null, null]])
        assert.deepEqual(model.blocks[0].teams.map(team => team.position), [0, 1])
        // Re-pointed 25 October 2026 (P1): no block of any diagram carries an exchange sentence now (his reply filed 28 October 2026, item 11).
        assert.ok(!('exchange' in diagram.blocks[0]))
        assert.deepEqual(model.blocks[0].exchanges, [])
        assert.deepEqual(diagram.legend, [{ kind: 'TARGET_LINE', text: 'target line' }], 'one block, unnamed teams: no team words in the legend')
        assert.equal(diagram.blocks[0].desc, '40 m by 30 m area. Each team attacks the line at the other team\'s end. 2 teams of 5 and 2 neutral players.')
        const modifier = buildActivityForReview(demo('scoring-modifier', keepers), { includeDrafts: true }) as ServedActivity
        assert.equal(modifier.diagramDraft!.verdict, 'WITHHELD')
        assert.ok(!('diagram' in modifier))
    }
})

test('4. D10 refuses each mutation of the model; a relationship that cannot be read withholds the diagram, never the activity (TEST-ONLY)', () => {
    assert.deepEqual(checkFieldDiagram(PROD_MODEL, PROD.input), [])
    const mutate = (change: (model: FieldDiagram) => void, input: DiagramInput = PROD.input, base: FieldDiagram = PROD_MODEL): DiagramFinding[] => {
        const model = copy(base)
        change(model)
        return checkFieldDiagram(model, input)
    }
    // A team's realized team or place.
    refused(
        mutate(m => {
            const [first, second] = m.blocks[0].teams
            ;[first.handle, second.handle] = [second.handle, first.handle]
        }),
        'D10',
        'which this block\'s game does not hold there',
        'realized teams swapped',
    )
    refused(mutate(m => (m.blocks[1].teams[0].position = 0)), 'D10', 'which this block\'s game does not hold there', 'place changed')
    refused(
        mutate(m => {
            m.blocks[1].teams[0].position = 0
            m.blocks[1].teams[1].position = 1
            m.blocks[1].teams[0].handle = m.blocks[0].teams[0].handle
            m.blocks[1].teams[1].handle = m.blocks[0].teams[1].handle
        }),
        'D10',
        'which this block\'s game does not hold there',
        'teams drawn by role, as before C2',
    )
    // Labels.
    refused(mutate(m => (m.blocks[0].teams[0].label = { text: 'Team C', status: 'DRAFT', carriedBy: null })), 'D6', '"Team C" is no DRAFT diagram word in its place (expected "Team A")', 'label wrong')
    refused(mutate(m => (m.blocks[1].teams[1].label = null)), 'D10', 'has no label where the teams are labelled', 'label dropped')
    // Exchanges.
    refused(mutate(m => (m.blocks[1].exchanges = [])), 'D10', 'the exchanges drawn (none) are not the reassignments this block\'s game records (BUILDING)', 'exchange dropped')
    refused(
        mutate(m => {
            const exchange = m.blocks[1].exchanges[0]
            ;[exchange.to, exchange.from] = [exchange.from, exchange.to]
        }),
        'D10',
        'are drawn moving from',
        'exchange reversed',
    )
    refused(mutate(m => (m.blocks[0].exchanges[0].bindings[0].quantity = 2)), 'D10', 'and the game records', 'exchange recounted')
    refused(mutate(m => (m.blocks[0].exchanges[0].total = 3)), 'D10', '(3 together)', 'exchange total')
    refused(mutate(m => (m.blocks[0].exchanges[0].moving.text = '2 goalkeepers')), 'D6', '"2 goalkeepers" is not carried by a served sentence', 'exchange reworded')
    refused(mutate(m => (m.blocks[0].exchanges[0].noun.text = 'pressing team')), 'D10', 'which is not that role\'s noun', 'exchange renamed')
    refused(mutate(m => ((m.blocks[0].exchanges[0] as any).path = [{ along: 0, across: 0 }])), 'D8', 'holds path', 'a movement path')
    // Counts that do not change as stated: the second block's building team given one goalkeeper fewer (TEST-ONLY copy of the game).
    const recounted = copyInput(PROD.input)
    const holder = recounted.games[1].fixture.record.designationBindings.find((binding: any) => binding.designation === recounted.games[1].holders.BUILDING).handle
    recounted.games[1].fixture.game.performers.teams.find((team: any) => team.elementId === holder).goalkeeper = 0
    refused(mutate(() => undefined, recounted), 'D10', 'a change the exchanges drawn state as 1', 'counts unchanged')
    // The legend's three words, dropped.
    refused(mutate(m => (m.legend = m.legend.filter(word => word.text !== DIAGRAM_WORDS.draft.role))), 'D10', 'the legend does not say "role in this block"', 'legend word dropped')
    // A game not played in blocks: no label, no exchange, no team legend words.
    const neutral = inputOf(demo('neutral-players'))
    const neutralModel = neutral.activity.diagramDraft!.diagram!
    refused(mutate(m => (m.blocks[0].teams[0].label = { text: 'Team A', status: 'DRAFT', carriedBy: null }), neutral.input, neutralModel), 'D10', 'is labelled "Team A" where the teams are not labelled', 'label added')
    refused(mutate(m => (m.blocks[0].exchanges = copy(PROD_MODEL.blocks[0].exchanges)), neutral.input, neutralModel), 'D10', 'the exchanges drawn (BUILDING) are not the reassignments this block\'s game records (none)', 'exchange added')
    refused(mutate(m => m.legend.push({ text: DIAGRAM_WORDS.draft.teamColour, status: 'DRAFT', carriedBy: null }), neutral.input, neutralModel), 'D10', 'the legend says "team colour, kept in every block" where the teams are not labelled', 'legend word added')
    // The unchanged model passes.
    assert.deepEqual(mutate(() => undefined), [])

    // No served Role exchange sentence: what moves cannot be said, so the diagram is withheld (D0) and nothing is invented; the activity is
    // untouched (the served sentences are the input's, unchanged here but for the copy).
    const unsaid = copyInput(PROD.input)
    unsaid.served = unsaid.served.filter(instruction => instruction.section !== 'Role exchange' || !instruction.text.startsWith('When you call the next block'))
    const draft = fieldDiagramDraftOf(unsaid)
    assert.equal(draft.verdict, 'WITHHELD')
    assert.equal(draft.diagram, null)
    refused(draft.findings, 'D0', 'no served Role exchange sentence says the reassignments to the BUILDING role', 'unsaid reassignment')
    assert.equal(diagramForServing(unsaid, { title: PROD.activity.title }).diagram, null)
})

test('5. D9 refuses each mutation of the coach\'s diagram (TEST-ONLY)', () => {
    const context = { title: PROD.activity.title }
    const mutate = (change: (diagram: CoachDiagram) => void): DiagramFinding[] => {
        const diagram = copy(PROD_COACH)
        change(diagram)
        return checkCoachDiagram(diagram, PROD_MODEL, PROD.input, context)
    }
    const d9 = (findings: DiagramFinding[], includes: string, what: string) => refused(findings, 'D9', includes, what)
    assert.deepEqual(mutate(() => undefined), [])
    d9(mutate(d => (d.blocks[0].teams[1].label = 'Team C')), 'team\'s words are not the model\'s', 'label changed')
    d9(mutate(d => (d.blocks[1].teams[0].label = null)), 'team\'s words are not the model\'s', 'label dropped')
    // The looks set by role (the building team's look in both blocks), as before C2.
    d9(
        mutate(d => {
            d.blocks[1].teams[0].identity = 0
            d.blocks[1].teams[1].identity = 1
        }),
        'its place among the realized teams is 1',
        'look by role',
    )
    // Re-pointed 25 October 2026 (P1; his reply filed 28 October 2026, item 11): the coach's diagram carries no exchange sentence, so one added
    // back is refused by the key check (D9), as any key the diagram does not carry is. Were: the exchange sentences of the other block, dropped,
    // reworded, or naming another block, each refused against the model's.
    d9(mutate(d => ((d.blocks[1] as any).exchange = ['When you call this block, 1 goalkeeper and 1 outfield player move from Team A to Team B, which becomes the building team.'])), 'block 2 holds exchange, which the coach\'s diagram does not carry', 'an exchange sentence added back')
    d9(mutate(d => (d.blocks[1].desc = `${d.blocks[1].desc} Then Block 1.`)), 'names another block', 'other block named')
    d9(mutate(d => (d.legend.find(entry => entry.kind === 'ROLE')!.kind = 'TEAM_COLOUR')), 'the legend gives "role in this block" to TEAM_COLOUR', 'legend kind')
    d9(mutate(d => ((d.blocks[0].teams[0] as any).handle = 'c:restated:GF2:GF2-14.a#1')), 'holds handle', 'a data key served')
})

test('6. nothing activity-specific or worded is typed in the page\'s FieldDiagram.tsx, and no team name in coach-diagram.ts', () => {
    const uncommented = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const page = uncommented(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'front', 'src', 'app', 'FieldDiagram.tsx'), 'utf8'))
    for (const literal of ['Team', 'team colour', 'role in this block', 'attacking direction', 'When you call', 'goalkeeper', 'outfield', 'building', 'pressing']) assert.ok(!page.includes(literal), `FieldDiagram.tsx types "${literal}"`)
    const server = uncommented(fs.readFileSync(path.join(__dirname, 'coach-diagram.ts'), 'utf8'))
    for (const literal of ['Team A', 'Team B', 'goalkeeper', 'outfield', 'TEAM_AT_AXIS', 'GF2-14']) assert.ok(!server.includes(literal), `coach-diagram.ts: ${literal}`)
    const model = uncommented(fs.readFileSync(path.join(__dirname, 'field-diagram.ts'), 'utf8'))
    for (const literal of ['Team A', 'Team B', 'goalkeeper', 'outfield', 'TEAM_AT_AXIS', 'GF2-14', 'BUILDING']) assert.ok(!model.includes(literal), `field-diagram.ts: ${literal}`)
})

console.log(`diagram-team-identity.unit.ts — ${passed} passed`)
