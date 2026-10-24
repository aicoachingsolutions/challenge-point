/**
 * The field diagram as a model, and its agreement check — stage 5A, 22 October 2026 (`field-diagram.ts`, `game-reading.ts`).
 *
 * His reply filed 22 October 2026, item 7: *"I appreciate that the prototype draws from stored activity data and refuses to invent missing
 * positions or geometry."* and *"Please ensure the diagram reflects whichever block is being viewed without introducing contradictions."*
 * His reply filed 23 October 2026, item 5 (goals drawn only where the activity holds them; one look for every target zone, team identity
 * apart; each block's active objectives emphasized while the markings stay; missing information withholds only a required relationship;
 * nothing the activity does not authorize).
 *
 * Pinned here, on the real chain:
 *
 *   1. A01 at 12/1, 12/2 and 11/1: the administrator's answer carries the diagram DRAWN and not served, read from each block's game: the
 *      markings set out once and the same in both blocks, each block's active targets (one kind, `attackedBy` naming the team), every
 *      marked zone's state in the block (the far zone INSIDE the building team's target, never only "marked"), the teams in role order
 *      with their counts as the Players sentence says them ("other players" at 2 of the role), their starting areas and attacking ends,
 *      and the dimensions the sentences state; the activity is served with its 28 sentences;
 *   2. only an administrator's review answer carries it; a refused activity has none;
 *   3. the demonstrations: one game drawn with its end lines as the targets and the counts said together; the one whose channels Set up
 *      states as limits is withheld, the activity served unchanged; the refused one has none;
 *   4. missing or inconsistent required data withholds the diagram (TEST-ONLY): a missing value, a target off the end lines, the marked
 *      line off its stated distance, an area that is not the session's, a starting area that cannot be read, a team designation no team
 *      holds, two starting areas for one team; and a start placement for a group that is not a team (a specialized role with no region or
 *      an unrealized one, an individual with a realized region, neutral players) is a note only, the model unchanged (his reply filed 23
 *      October 2026, item 5);
 *   5. every rule of the check refuses its mutation of the model (TEST-ONLY), D1 to D8 (a team's starting area dropped or misattributed
 *      among them), and the production model passes;
 *   6. on the real chain a failure withholds the diagram only: the activity is served exactly as the coach's (TEST-ONLY patch, restored);
 *   7. physical objects: drawn only where the game positions them and a served sentence says them; one positioned without a realized
 *      place, or a target object with no place, withholds; one with no position is a note; an objective scoring at a realized object Set
 *      up says is drawn as a target read from the object's place (moved, refused; unsaid or unrealized, withheld) (TEST-ONLY);
 *   8. markings presented block by block (TEST-ONLY 15 m line): each block's own markings, the line where its block puts it, no "halfway";
 *   9. the readers are one: the evidence's transitions are `transitionsOf`'s, and review-evidence.ts no longer defines them;
 *  10. nothing activity-specific is written in the two modules.
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
import { diagramForServing } from './coach-diagram'
import * as fieldDiagramModule from './field-diagram'
import { checkFieldDiagram, DIAGRAM_WORDS, DiagramFinding, DiagramInput, FieldDiagram, fieldDiagramDraftOf } from './field-diagram'
import { transitionsOf } from './game-reading'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { renderConcreteGame, teamCountPhrases } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the field diagram: model and agreement check (stage 5A)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionAt = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } })
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: sessionAt(players, keepers) })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const index = indexRegister(loadRegister())
/** A TEST-ONLY copy of a diagram input: everything copied but the register index (its maps do not survive JSON), which is shared. */
const copyInput = (input: DiagramInput): DiagramInput => ({ ...copy({ ...input, index: null }), index: input.index })
const LINE = 'c:provisional:A01-R1:A01-R1-S2-1'
const NEAR = 'c:restated:GF2:GF2-03.e'
const FAR = 'c:restated:GF2:GF2-03.f'

/** The diagram's input exactly as the build hands it: each block's game and own Details, the served Details, the served role-block account. */
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
const rules = (findings: DiagramFinding[]) => [...new Set(findings.map(finding => finding.rule))].sort()
const refusedBy = (findings: DiagramFinding[], rule: string, includes: string, what: string) =>
    assert.ok(findings.some(finding => finding.rule === rule && finding.what.includes(includes)), `${what}: expected ${rule} "${includes}", got ${JSON.stringify(findings, null, 1)}`)

const PROD = inputOf(a01At(12, 1))
const PROD_DRAFT = fieldDiagramDraftOf(PROD.input)
const PROD_MODEL = PROD_DRAFT.diagram!

test('1. A01 at 12/1, 12/2 and 11/1: drawn from each block\'s game, set out once, each block\'s targets and zone states, teams in role order', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const { input, activity } = inputOf(a01At(players, keepers))
        // Re-pointed 24 October 2026 (R1): 28 -> 26, the throw-in and end-line sentences withdrawn (his reply filed 27 October 2026, item 4).
        // Re-pointed 24 October 2026 (R2): 26 -> 27, the sentence naming the restarts the activity does not use (dead-ball-wording.unit.ts).
        assert.equal(activity.rendered.instructions.length, 27, `${what}: the activity is served with its 27 sentences`)
        const draft = activity.diagramDraft!
        assert.ok(draft, `${what}: the administrator's answer carries the diagram`)
        // Re-pointed 22 October 2026 (stage 5B): the build's draft is the served one (`diagramForServing`), the model exactly these games'.
        assert.deepEqual(draft, diagramForServing(input, { title: activity.title }).draft, `${what}: the build hands the diagram exactly these games`)
        assert.deepEqual({ ...draft, served: false }, fieldDiagramDraftOf(input), `${what}: the model is fieldDiagramDraftOf's`)
        assert.equal(draft.served, true, `${what}: since stage 5B every viewer is served the diagram`)
        assert.equal(draft.verdict, 'DRAWN', `${what}: ${JSON.stringify(draft.findings, null, 1)}`)
        assert.deepEqual(draft.findings, [])
        const model = draft.diagram!
        assert.deepEqual([model.area.lengthM, model.area.widthM], [40, 30])
        assert.equal(model.markingsSetOutOnce, true)
        assert.equal(model.blocks.length, 2)
        // The markings: the physical layout, the same in both blocks (his reply filed 23 October 2026, item 2), and nothing else.
        const layout = input.games[0].fixture.layout
        for (const block of model.blocks) {
            assert.deepEqual(block.markings, model.blocks[0].markings, `${what}: the markings are the same in every block`)
            assert.deepEqual(block.markings.lines.map(line => line.along.from), layout.marks.map((mark: any) => mark.at))
            assert.deepEqual(block.markings.zones.map(zone => [zone.along.from, zone.along.to]), layout.zones.map((zone: any) => [zone.from, zone.to]))
            assert.deepEqual(block.markings.lines.filter(line => line.markedLine).map(line => [line.along.from, line.label!.text, line.label!.status]), [[20, 'marked line', 'HIS_TERM']])
            assert.ok(block.markings.lines.filter(line => !line.markedLine).every(line => line.label === null))
        }
        // Each block's targets, read again from its own game: one kind of thing, whichever team attacks it.
        model.blocks.forEach((block, i) => {
            const game = input.games[i]
            assert.equal(block.label!.text, `Block ${i + 1}`)
            assert.deepEqual(block.holders, activity.roleBlocks!.blocks[i].holders)
            assert.deepEqual(block.teams.map(team => team.role), Object.keys(activity.roleBlocks!.blocks[i].holders), `${what}: teams in the block's role order`)
            for (const target of block.targets) {
                const along = game.fixture.status.geometry.find((g: any) => g.path === `space.regions[${target.region}].position.along`).geometry.interval
                assert.deepEqual(target.along, along)
                assert.equal(target.label!.text, DIAGRAM_WORDS.his.targetZone)
                assert.deepEqual(Object.keys(target).sort(), ['across', 'along', 'attackedBy', 'cites', 'label', 'line', 'markedZone', 'objective', 'region'])
            }
            const building = block.teams.find(team => team.role === 'BUILDING')!
            const pressing = block.teams.find(team => team.role === 'PRESSING')!
            const buildingTarget = block.targets.find(target => target.attackedBy === 'BUILDING')!
            const pressingTarget = block.targets.find(target => target.attackedBy === 'PRESSING')!
            // The building team's target begins at the marked line; the pressing team's is the end zone at the building team's end.
            assert.equal(i === 0 ? buildingTarget.along.from : buildingTarget.along.to, 20)
            assert.equal(pressingTarget.markedZone, i === 0 ? 'zone-1' : 'zone-2')
            assert.equal(buildingTarget.markedZone, null)
            // Every marked zone says what it is here: the other end zone lies INSIDE the building team's target, never "only marked".
            assert.deepEqual(block.markedZones, [
                { zone: 'zone-1', state: i === 0 ? 'TARGET' : 'INSIDE_TARGET', of: i === 0 ? 'PRESSING' : 'BUILDING' },
                { zone: 'zone-2', state: i === 0 ? 'INSIDE_TARGET' : 'TARGET', of: i === 0 ? 'BUILDING' : 'PRESSING' },
            ])
            // Teams: nouns carried by the Players sentence, counts as it says them, starting areas as realized, opposite ends attacked.
            const counts = teamCountPhrases(game.fixture)
            for (const team of [building, pressing]) {
                assert.equal(team.noun!.text, `${team.role === 'BUILDING' ? 'building' : 'pressing'} team`)
                assert.equal(team.noun!.carriedBy!.section, 'Players')
                const phrase = counts.teams.find(entry => entry.role === team.role)!
                assert.deepEqual(team.counts.map(count => count.word.text), phrase.segments.map(segment => segment.text))
                assert.ok(team.counts.every(count => count.word.carriedBy!.section === 'Players'))
                const placement = game.fixture.game.performers.startPlacement.find((p: any) => p.group === `ROLE_HOLDER_${team.role}`)
                assert.deepEqual(team.start!.along, placement.realizedGeometry.region.interval)
                assert.deepEqual(team.start!.across, { from: 0, to: 30 })
            }
            assert.equal(building.attacks[0].end, i === 0 ? 40 : 0)
            assert.equal(pressing.attacks[0].end, i === 0 ? 0 : 40)
            if (keepers === 2) {
                assert.deepEqual(building.counts.map(count => count.word.text), ['1 goalkeeper', '6 other players'], `${what}: the roster's own words`)
                assert.deepEqual(pressing.counts.map(count => count.word.text), ['5 other players'])
            }
            // The dimensions the sentences state: the area, both end zones, and the marked line from the building team's end line.
            assert.deepEqual(
                block.dimensions.map(d => [d.kind, d.from, d.to, d.label.text]),
                [
                    ['AREA_LENGTH', 0, 40, '40 m'],
                    ['AREA_WIDTH', 0, 30, '30 m'],
                    ['ZONE_DEPTH', 0, 5, '5 m'],
                    ['ZONE_DEPTH', 35, 40, '5 m'],
                    ['LINE_OFFSET', i === 0 ? 0 : 20, i === 0 ? 20 : 40, '20 m'],
                ],
            )
            // No word names another block; every word is his term or DRAFT.
            const words = JSON.stringify(block)
            assert.ok(!words.includes(`Block ${2 - i}`), `${what} block ${i + 1}: no other block named`)
        })
        assert.deepEqual(model.counts, [], `${what}: the teams are told apart, so no count is said for every team together`)
        // Re-pointed (stage C2, his reply filed 24 October 2026, item 4): the teams are labelled, so the legend also says what a team colour,
        // the role badge and an arrow are (DRAFT). Was: the first three only. The rest of C2 is pinned in diagram-team-identity.unit.ts.
        assert.deepEqual(model.legend.map(word => [word.text, word.status]), [
            ['marked line', 'HIS_TERM'],
            ['target zone', 'HIS_TERM'],
            ['starting area', 'DRAFT'],
            ['team colour, kept in every block', 'DRAFT'],
            ['role in this block', 'DRAFT'],
            ['attacking direction', 'DRAFT'],
        ])
        assert.ok(draft.notes.some(note => note.startsWith('not drawn: where play restarts')), JSON.stringify(draft.notes))
        assert.ok(draft.notes.some(note => note.startsWith('not drawn: the authorized adjustments')), JSON.stringify(draft.notes))
    }
})

// Since stage 5B every viewer's answer also carries the diagram a coach reads (`diagram`, coach-diagram.unit.ts); the model, its
// findings and notes (`diagramDraft`) stay the administrator's, as pinned here.
test('2. only an administrator\'s review answer carries the diagram draft; a refused activity has none', () => {
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const admin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.ok(!('diagramDraft' in coach) && !!admin.diagramDraft)
    assert.ok(!JSON.stringify(coach).includes('diagramDraft'))
    assert.ok(!('diagramDraft' in buildActivity(a01At(12, 1))))
    assert.ok(!('diagramDraft' in buildActivityForReview(a01At(12, 1), { includeDrafts: false })))
    for (const demonstration of MECHANISM_DEMONSTRATIONS) assert.ok(!('diagramDraft' in buildActivity({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: sessionAt(12, 1) })), demonstration.id)
    for (const answer of [buildActivityForReview(a01At(12, 0), { includeDrafts: true }), buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: 'pass-combination-gate', session: sessionAt(12, 1) }, { includeDrafts: true })]) {
        assert.equal(answer.outcome, 'refused')
        assert.ok(!('diagramDraft' in answer))
    }
    assert.deepEqual(admin.rendered, coach.rendered)
})

test('3. the demonstrations: end lines as the targets and the counts together; channels Set up states as limits withhold the diagram only', () => {
    for (const keepers of [0, 1, 2]) {
        const neutral = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: sessionAt(12, keepers) }, { includeDrafts: true }) as ServedActivity
        const draft = neutral.diagramDraft!
        assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings))
        const model = draft.diagram!
        assert.equal(model.markingsSetOutOnce, false)
        const [block] = model.blocks
        assert.equal(block.label, null, 'a game not played in blocks names no block')
        assert.deepEqual(block.markings.lines.map(line => line.along), [{ from: 0, to: 0 }, { from: 40, to: 40 }])
        // Re-pointed 22 October 2026 (polish pass P7): each end line a team scores at is named by its own noun, read from the game, after the
        // DRAFT word "target", and the legend carries those words once. Was: no label, no legend word.
        const fixture: any = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: sessionAt(12, keepers) }).fixture
        const nouns = block.targets.map(target => fixture.game.space.regions.find((region: any) => String(region.elementId) === target.region)?.noun ?? null)
        assert.deepEqual(nouns, ['line', 'line'], 'the game calls each end line a line')
        assert.ok(block.targets.every(target => target.line && target.label?.text === 'target line' && target.label.status === 'DRAFT' && target.label.carriedBy === null))
        assert.deepEqual(model.legend.map(word => [word.text, word.status]), [['target line', 'DRAFT']])
        assert.deepEqual(block.teams.map(team => team.attacks.map(attack => attack.end)).sort(), [[0], [40]])
        assert.ok(block.teams.every(team => team.noun === null && team.start === null && team.counts.length === 0))
        assert.deepEqual(model.counts.map(count => count.word.text), ['2 teams of 5', '2 neutral players'])
        assert.ok(draft.notes.some(note => note.includes('no starting area is authorized')))
        assert.ok(draft.notes.some(note => note.includes('neutral players')))
        const modifier = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: sessionAt(12, keepers) }, { includeDrafts: true }) as ServedActivity
        assert.equal(modifier.outcome, 'served')
        assert.equal(modifier.diagramDraft!.verdict, 'WITHHELD')
        assert.equal(modifier.diagramDraft!.diagram, null)
        refusedBy(modifier.diagramDraft!.findings, 'D0', 'states its extent as limits the coach chooses within', 'channels')
        const plain = buildActivity({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: sessionAt(12, keepers) }) as ServedActivity
        assert.deepEqual(modifier.rendered, plain.rendered, 'the activity is served exactly as without the diagram')
    }
})

test('4. missing or inconsistent required data withholds the diagram, never invents (TEST-ONLY copies)', () => {
    const geometryOf = (input: DiagramInput, block: number, at: string) => input.games[block].fixture.status.geometry.find((g: any) => g.path === at)
    // A missing value: a target's realized width.
    const missing = copyInput(PROD.input)
    missing.games[0].fixture.status.geometry = missing.games[0].fixture.status.geometry.filter((g: any) => g.path !== `space.regions[${NEAR}].position.across`)
    let draft = fieldDiagramDraftOf(missing)
    assert.equal(draft.verdict, 'WITHHELD')
    assert.equal(draft.diagram, null)
    refusedBy(draft.findings, 'D0', 'holds no realized position along and across the area', 'missing')
    // A target off the end lines: no attacking direction is drawn by guess.
    const offEnd = copyInput(PROD.input)
    geometryOf(offEnd, 0, `space.regions[${NEAR}].position.along`).geometry.interval = { from: 1, to: 5 }
    draft = fieldDiagramDraftOf(offEnd)
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', 'does not touch exactly one end line', 'off the end')
    // The marked line where the game does not say it is.
    const moved = copyInput(PROD.input)
    geometryOf(moved, 1, `space.regions[${LINE}].position.along`).geometry.interval = { from: 22, to: 22 }
    draft = fieldDiagramDraftOf(moved)
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', 'not 20 m from the BUILDING team\'s end line', 'wrong offset')
    // An area that is not the session's.
    const area = copyInput(PROD.input)
    area.session = { ...area.session, lengthM: 50 }
    draft = fieldDiagramDraftOf(area)
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D1', 'the session\'s is 50 m by 30 m', 'envelope')
    // A starting area that cannot be read.
    const start = copyInput(PROD.input)
    start.games[0].fixture.status.geometry = start.games[0].fixture.status.geometry.filter((g: any) => !String(g.path).startsWith('performers.startPlacement['))
    draft = fieldDiagramDraftOf(start)
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', 'starting area', 'start')
    // His reply filed 23 October 2026, item 5: "An unspecified goalkeeper starting point, for example, should not prevent the system from
    // drawing an otherwise valid field with authorized team starting areas." A start placement for a group that is not a team (register
    // P9, "team designation or role") is a note, never a refusal, specified or not; both team starting areas stay drawn.
    const withPlacement = (input: DiagramInput, placement: (game: DiagramInput['games'][number]) => any): DiagramInput => {
        const changed = copyInput(input)
        for (const game of changed.games) {
            game.fixture.game.performers.startPlacement = [...(game.fixture.game.performers.startPlacement ?? []), placement(game)]
        }
        return changed
    }
    const NOWHERE = { contractId: 'TEST-ONLY', itemId: 'NOWHERE' }
    const NEAR_REF = { contractId: 'restated:GF2', itemId: 'GF2-03.e' }
    const nonTeam: [string, (game: DiagramInput['games'][number]) => any][] = [
        [`${ROLE}, no region`, () => ({ elementId: 'c:TEST-ONLY:ROLE-START', group: ROLE, timing: 'INITIAL' })],
        [`${ROLE}, a region the game does not realize`, () => ({ elementId: 'c:TEST-ONLY:ROLE-START', group: ROLE, region: { structuralRef: NOWHERE }, timing: 'INITIAL' })],
        ['an individual, a realized region', () => ({ elementId: 'c:TEST-ONLY:ROLE-START', group: 'target player', region: { structuralRef: NEAR_REF }, timing: 'INITIAL' })],
    ]
    for (const [what, placement] of nonTeam) {
        draft = fieldDiagramDraftOf(withPlacement(PROD.input, placement))
        assert.equal(draft.verdict, 'DRAWN', `${what}: ${JSON.stringify(draft.findings, null, 1)}`)
        assert.deepEqual(draft.findings, [])
        for (const block of draft.diagram!.blocks) {
            assert.ok(draft.notes.some(note => note.startsWith(`block ${block.blockId}: not drawn: where `) && note.includes('(c:TEST-ONLY:ROLE-START); only team starting areas are drawn')), `${what}: ${JSON.stringify(draft.notes)}`)
            const prod = PROD_MODEL.blocks.find(entry => entry.blockId === block.blockId)!
            assert.deepEqual(block.teams.map(team => team.start), prod.teams.map(team => team.start), `${what}: both team starting areas stay drawn`)
            assert.ok(block.teams.every(team => team.start !== null))
        }
        assert.deepEqual({ ...draft, notes: [] }, { ...PROD_DRAFT, notes: [] }, `${what}: the model is the production model`)
        assert.ok(!JSON.stringify(draft.diagram).includes('ROLE-START'), `${what}: nothing of the placement is drawn`)
    }
    // A team's starting area still withholds wherever it cannot be drawn faithfully: a team designation no team of the block holds (one
    // the register resolves against the possession relation, read from the register), and a second starting area for one team.
    const unbound = [...index.designations.resolutions.entries()].find(([, resolution]) => resolution.kind === 'POSSESSION_RELATION')![0]
    draft = fieldDiagramDraftOf(withPlacement(PROD.input, () => ({ elementId: 'c:TEST-ONLY:TEAM-START', group: unbound, region: { structuralRef: NEAR_REF }, timing: 'INITIAL' })))
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', `is for ${unbound}, a team designation no team of this block holds`, 'unbound team designation')
    draft = fieldDiagramDraftOf(withPlacement(PROD.input, game => ({ ...copy(game.fixture.game.performers.startPlacement[0]), elementId: 'c:TEST-ONLY:SECOND-START' })))
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', 'team has more than one starting area', 'two starting areas')
    // Neutral players with a realized starting region (neutral-players): a note, the diagram drawn as without it.
    const neutral = inputOf({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: sessionAt(12, 1) })
    const neutralDraft = fieldDiagramDraftOf(neutral.input)
    assert.equal(neutralDraft.verdict, 'DRAWN')
    draft = fieldDiagramDraftOf(withPlacement(neutral.input, game => ({ elementId: 'c:TEST-ONLY:N-START', group: 'NEUTRALS', region: { structuralRef: copy(game.fixture.game.objectives[0].reference.structuralRef) }, timing: 'INITIAL' })))
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings, null, 1))
    assert.ok(draft.notes.includes('block ONE_GAME: not drawn: where NEUTRALS starts (c:TEST-ONLY:N-START); only team starting areas are drawn'), JSON.stringify(draft.notes))
    assert.deepEqual(draft.diagram, neutralDraft.diagram, 'neutral players: the model is unchanged')
})

test('5. each rule of the check refuses its mutation of the model, and the production model passes (TEST-ONLY)', () => {
    assert.deepEqual(checkFieldDiagram(PROD_MODEL, PROD.input), [])
    const mutate = (change: (model: FieldDiagram) => void): DiagramFinding[] => {
        const model = copy(PROD_MODEL)
        change(model)
        return checkFieldDiagram(model, PROD.input)
    }
    // D1: the area.
    refusedBy(mutate(m => (m.area.widthM = 31)), 'D1', 'the area drawn', 'area')
    // D2: a line no Set up sentence marks; a starting area moved; a target moved.
    refusedBy(mutate(m => m.blocks[0].markings.lines.push({ ...m.blocks[0].markings.lines[0], elementId: 'mark-9' })), 'D2', 'mark-9 is drawn and no Set up sentence marks it', 'extra line')
    refusedBy(mutate(m => (m.blocks[0].teams[0].start!.along = { from: 0, to: 15 })), 'D2', 'starting area is not drawn where', 'start moved')
    refusedBy(mutate(m => (m.blocks[1].targets[0].along = { from: 30, to: 40 })), 'D2', 'is not drawn where this block\'s game puts it', 'target moved')
    // D2: a team's authorized starting area left out, or drawn as another placement's (read again from the game's placements).
    refusedBy(mutate(m => (m.blocks[0].teams[0].start = null)), 'D2', 'the game authorizes for ROLE_HOLDER_BUILDING is not drawn as the BUILDING team\'s', 'start dropped')
    refusedBy(mutate(m => (m.blocks[1].teams[1].start!.placement = 'c:TEST-ONLY:OTHER')), 'D2', 'is not drawn as the PRESSING team\'s', 'start misattributed')
    // D3: a marking Set up marks left out; a zone state that hides a zone inside an active target.
    refusedBy(mutate(m => m.blocks[0].markings.zones.pop()), 'D3', 'Set up marks zone-2 and it is not drawn', 'zone dropped')
    refusedBy(mutate(m => (m.blocks[0].markedZones[1].state = 'MARKED')), 'D3', 'zone-2 is drawn as MARKED and is INSIDE_TARGET', 'zone state')
    // D4: a dimension the game does not hold; a count the game does not hold.
    refusedBy(mutate(m => (m.blocks[0].dimensions[4].quantity = 25)), 'D4', 'where the game holds 20', 'offset')
    refusedBy(
        mutate(m => (m.blocks[0].teams[0].counts[0].bindings[0].quantity = 7)),
        'D4',
        'which the game does not hold',
        'count',
    )
    // D5: the roles swapped.
    refusedBy(mutate(m => (m.blocks[0].holders = { ...m.blocks[1].holders })), 'D5', 'not the ones the served role-block account holds', 'holders')
    // D6: a data key as a word; a word naming another block; a noun no served sentence carries; his term misused.
    refusedBy(mutate(m => (m.blocks[0].targets[0].label = { text: 'BUILDING', status: 'DRAFT', carriedBy: null })), 'D6', 'is a data key or value', 'data key')
    refusedBy(mutate(m => (m.blocks[0].targets[1].label = { text: 'target zone in Block 2', status: 'DRAFT', carriedBy: null })), 'D6', 'names another block', 'other block')
    refusedBy(mutate(m => (m.blocks[0].teams[0].noun = { text: 'building team', status: 'DRAFT', carriedBy: null })), 'D6', 'no DRAFT diagram word in its place', 'uncarried noun')
    refusedBy(mutate(m => (m.blocks[0].teams[0].counts[0].word.carriedBy = { section: 'Players', text: 'TEST-ONLY' })), 'D6', 'is not carried by a served sentence', 'carrier')
    refusedBy(mutate(m => (m.blocks[0].markings.lines[1].label = { text: 'halfway line', status: 'HIS_TERM', carriedBy: null })), 'D6', 'is marked as his term and is not one', 'his term')
    // D7: an arrow reversed (in the second block the building team attacks the end at 0 m).
    assert.equal(PROD_MODEL.blocks[1].teams[0].attacks[0].end, 0)
    refusedBy(mutate(m => (m.blocks[1].teams[0].attacks[0].end = 40)), 'D7', 'arrow points to the end at 40 m', 'arrow')
    // D8: a player position, a formation, a movement path: none is a thing the diagram draws.
    refusedBy(mutate(m => ((m.blocks[0].teams[0] as any).positions = [{ along: 3, across: 15 }])), 'D8', 'holds positions', 'positions')
    refusedBy(mutate(m => ((m.blocks[0] as any).passingLines = [])), 'D8', 'holds passingLines', 'passing lines')
    // The unchanged model passes every rule.
    assert.deepEqual(rules(mutate(() => undefined)), [])
    // D6 (polish pass P7): a target line's words are its own noun read from the game after the DRAFT word "target": another noun, his
    // zone term on a line, or a legend word no target line has, is refused; the demonstration's model passes.
    const neutral = inputOf({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: sessionAt(12, 1) })
    const neutralModel = fieldDiagramDraftOf(neutral.input).diagram!
    assert.deepEqual(checkFieldDiagram(neutralModel, neutral.input), [])
    const mutateNeutral = (change: (model: FieldDiagram) => void): DiagramFinding[] => {
        const model = copy(neutralModel)
        change(model)
        return checkFieldDiagram(model, neutral.input)
    }
    refusedBy(mutateNeutral(m => (m.blocks[0].targets[0].label = { text: 'target goal', status: 'DRAFT', carriedBy: null })), 'D6', '"target goal" is no DRAFT diagram word in its place (expected "target line")', 'another noun')
    refusedBy(mutateNeutral(m => (m.blocks[0].targets[0].label = { text: 'target zone', status: 'HIS_TERM', carriedBy: null })), 'D6', 'is named with his term "target zone", which names a zone', 'his zone term on a line')
    refusedBy(mutateNeutral(m => (m.legend = [{ text: 'scoring line', status: 'DRAFT', carriedBy: null }])), 'D6', '"scoring line" is no DRAFT diagram word in its place', 'a legend word no target line has')
})

test('6. on the real chain a diagram failure withholds the diagram only: the activity is the coach\'s (TEST-ONLY patch, restored)', () => {
    const module = fieldDiagramModule as { fieldDiagramDraftOf: typeof fieldDiagramDraftOf }
    const original = module.fieldDiagramDraftOf
    const coach = buildActivity(a01At(12, 1)) as ServedActivity
    try {
        module.fieldDiagramDraftOf = (input: DiagramInput) => {
            const changed = copyInput(input)
            changed.games[0].fixture.status.geometry = changed.games[0].fixture.status.geometry.filter((g: any) => g.path !== `space.regions[${FAR}].position.across`)
            return original(changed)
        }
        const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
        assert.equal(admin.outcome, 'served')
        // Re-pointed 24 October 2026 (R1): 28 -> 26, the throw-in and end-line sentences withdrawn (his reply filed 27 October 2026, item 4).
        // Re-pointed 24 October 2026 (R2): 26 -> 27, the sentence naming the restarts the activity does not use (dead-ball-wording.unit.ts).
        assert.equal(admin.rendered.instructions.length, 27)
        assert.deepEqual(admin.rendered, coach.rendered)
        assert.deepEqual(admin.overview, coach.overview)
        assert.equal(admin.diagramDraft!.verdict, 'WITHHELD')
        assert.equal(admin.diagramDraft!.served, false)
        assert.ok(!('diagram' in admin), 'stage 5B: a withheld diagram is served to no one')
        refusedBy(admin.diagramDraft!.findings, 'D0', FAR, 'chain')
        module.fieldDiagramDraftOf = () => {
            throw new Error('TEST-ONLY failure')
        }
        const thrown = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
        assert.equal(thrown.outcome, 'served')
        assert.deepEqual(thrown.rendered, coach.rendered)
        assert.deepEqual(thrown.diagramDraft, { served: false, verdict: 'WITHHELD', diagram: null, findings: [{ rule: 'D0', blockId: null, what: 'the diagram could not be computed: TEST-ONLY failure' }], notes: [] })
        assert.ok(!('diagram' in thrown))
    } finally {
        module.fieldDiagramDraftOf = original
    }
    assert.deepEqual((buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity).diagramDraft, { ...PROD_DRAFT, served: true })
})

test('7. physical objects: drawn only where the game positions them and a sentence says them; never placed by guess (TEST-ONLY)', () => {
    const withObject = (positioned: boolean, realized: boolean, said: boolean, target: boolean): DiagramInput => {
        const input = copyInput(PROD.input)
        for (const game of input.games) {
            const id = 'c:TEST-ONLY:OBJECT-1'
            game.fixture.game.objects.push({ elementId: id, kind: 'TEST-ONLY object', ...(positioned ? { position: { along: 'TEST-ONLY', across: 'TEST-ONLY' } } : {}) })
            if (realized) {
                game.fixture.status.geometry.push({ path: `objects[${id}].position.along`, geometry: { axis: 'along', interval: { from: 39, to: 40 } } })
                game.fixture.status.geometry.push({ path: `objects[${id}].position.across`, geometry: { axis: 'across', interval: { from: 13, to: 17 } } })
            }
            if (target) game.fixture.game.objectives[0].reference.structuralRef = { contractId: 'TEST-ONLY', itemId: 'OBJECT-1' }
            if (said) {
                const sentence = { section: 'Set up' as const, text: 'Place a TEST-ONLY object at the end line', status: 'DERIVED' as const, from: [`objects[${id}].kind`, `objects[${id}].position.along`], quantities: [] }
                game.rendered.push(sentence)
                if (game === input.games[0]) input.served.push(sentence)
            }
        }
        return input
    }
    // Positioned, realized and said: drawn at its place and size, with the noun the sentence carries.
    let draft = fieldDiagramDraftOf(withObject(true, true, true, false))
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings))
    assert.deepEqual(draft.diagram!.blocks[0].objects.map(o => [o.along, o.across, o.label!.text]), [[{ from: 39, to: 40 }, { from: 13, to: 17 }, 'TEST-ONLY object']])
    // Positioned and realized but said by no sentence: withheld (the two levels would disagree).
    draft = fieldDiagramDraftOf(withObject(true, true, false, false))
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D2', 'the object c:TEST-ONLY:OBJECT-1 is drawn and no served sentence says it', 'unsaid object')
    // Positioned with no realized place: never placed by guess.
    draft = fieldDiagramDraftOf(withObject(true, false, true, false))
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', 'positioned by the game and holds no realized position', 'unplaced object')
    // A target object with no place: withheld.
    draft = fieldDiagramDraftOf(withObject(false, false, false, true))
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', 'is a target and holds no realized position', 'target object')
    // An object with no position that nothing targets: a note only (the production game's own object is one).
    draft = fieldDiagramDraftOf(withObject(false, false, false, false))
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings))
    assert.ok(draft.notes.some(note => note.includes('c:TEST-ONLY:OBJECT-1 (TEST-ONLY object)')), JSON.stringify(draft.notes))
    assert.ok(PROD_DRAFT.notes.some(note => note.startsWith('not drawn: ') && note.includes('which the game holds with no position in the area')))

    // An objective that scores at a physical object (his reply filed 23 October 2026, item 5: "When physical goals are part of an activity,
    // they should appear in the diagram."): neutral-players' objectives pointed at TEST-ONLY objects realized on the end line each one's
    // target touched, read exactly as a region target is: its place, the end it touches, the object drawn with the noun Set up carries.
    const neutral = inputOf({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: sessionAt(12, 1) })
    const objectTargets = (realized: boolean, said: boolean): DiagramInput => {
        const input = copyInput(neutral.input)
        for (const game of input.games) {
            game.fixture.game.objectives.forEach((objective: any, n: number) => {
                const id = `c:TEST-ONLY:OBJECT-T${n + 1}`
                const region = `c:${objective.reference.structuralRef.contractId}:${objective.reference.structuralRef.itemId}`
                const along = game.fixture.status.geometry.find((g: any) => g.path === `space.regions[${region}].position.along`).geometry.interval
                game.fixture.game.objects.push({ elementId: id, kind: 'TEST-ONLY object', position: { along: 'TEST-ONLY', across: 'TEST-ONLY' } })
                if (realized) {
                    game.fixture.status.geometry.push({ path: `objects[${id}].position.along`, geometry: { axis: 'along', interval: { ...along } } })
                    game.fixture.status.geometry.push({ path: `objects[${id}].position.across`, geometry: { axis: 'across', interval: { from: 13, to: 17 } } })
                }
                objective.reference.structuralRef = { contractId: 'TEST-ONLY', itemId: `OBJECT-T${n + 1}` }
                if (said) {
                    const sentence = { section: 'Set up' as const, text: `Place a TEST-ONLY object on end line ${n + 1}`, status: 'DERIVED' as const, from: [`objects[${id}].kind`, `objects[${id}].position.along`, `objects[${id}].position.across`], quantities: [] }
                    game.rendered.push(sentence)
                    input.served.push(sentence)
                }
            })
        }
        return input
    }
    const plain = fieldDiagramDraftOf(neutral.input).diagram!.blocks[0]
    draft = fieldDiagramDraftOf(objectTargets(true, true))
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings, null, 1))
    const block = draft.diagram!.blocks[0]
    // Re-pointed 23 October 2026 (stage B): an object target is no marked line even where it has no depth (it stood on the end line here, so
    // it was reported `line: true`); what it is, its object says, and its label stays null (an object target's words are Stage G's).
    assert.deepEqual(
        block.targets.map(target => [target.region, target.along, target.across, target.line, target.label]),
        plain.targets.map((target, n) => [`c:TEST-ONLY:OBJECT-T${n + 1}`, target.along, { from: 13, to: 17 }, false, null]),
        'each target is its object, at its realized place',
    )
    assert.ok(block.targets.every(target => target.cites.includes(`objects[${target.region}].position.along`)))
    assert.deepEqual(block.teams.map(team => team.attacks.map(attack => attack.end)), plain.teams.map(team => team.attacks.map(attack => attack.end)), 'the same attacking ends')
    assert.deepEqual(block.objects.map(o => [o.elementId, o.label!.text, o.label!.carriedBy!.section]), [['c:TEST-ONLY:OBJECT-T1', 'TEST-ONLY object', 'Set up'], ['c:TEST-ONLY:OBJECT-T2', 'TEST-ONLY object', 'Set up']])
    assert.deepEqual(block.markings, plain.markings, 'the markings Set up says to mark are still drawn')
    // The check reads an object target again: moved, it is refused.
    const moved = copy(draft.diagram!)
    moved.blocks[0].targets[0].across = { from: 0, to: 30 }
    refusedBy(checkFieldDiagram(moved, objectTargets(true, true)), 'D2', 'c:TEST-ONLY:OBJECT-T1 is not drawn where this block\'s game puts it', 'object target moved')
    // Realized but said by no sentence: withheld (the object and the target alike).
    draft = fieldDiagramDraftOf(objectTargets(true, false))
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D2', 'the target c:TEST-ONLY:OBJECT-T1 is drawn and no Set up sentence marks it', 'unsaid object target')
    // Not realized: never placed by guess.
    draft = fieldDiagramDraftOf(objectTargets(false, true))
    assert.equal(draft.verdict, 'WITHHELD')
    refusedBy(draft.findings, 'D0', 'the target c:TEST-ONLY:OBJECT-T1 of the objective', 'unrealized object target')
})

test('8. markings presented block by block (TEST-ONLY 15 m line): each block\'s own, the line where its block puts it, no "halfway"', () => {
    const offsetFifteen = (contracts: LoadedContract[]) => {
        const item: any = contracts.find(contract => contract.contractId === 'provisional:A01-R1')!.items.find(entry => entry.itemId === 'A01-R1-S5-1')
        item.value = { ...item.value, offsetM: { from: 15, to: 15 }, asAuthored: "TEST-ONLY 15 m from the building team's end line" }
    }
    const { input, activity } = inputOf(a01At(12, 1), offsetFifteen)
    const draft = activity.diagramDraft!
    assert.deepEqual(draft, { ...fieldDiagramDraftOf(input), served: true })
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings, null, 1))
    const model = draft.diagram!
    assert.equal(model.markingsSetOutOnce, false)
    assert.deepEqual(model.blocks.map(block => block.markings.lines.map(line => [line.along.from, line.markedLine])), [[[15, true]], [[25, true]]])
    for (const block of model.blocks) {
        assert.ok(block.markedZones.every(state => state.state === 'TARGET'), 'each marked zone is a target of its block')
        const offset = block.dimensions.find(d => d.kind === 'LINE_OFFSET')!
        assert.equal(offset.quantity, 15)
        assert.ok(!JSON.stringify(block).includes('halfway'))
    }
})

test('9. the readers are one: the evidence\'s restarts are transitionsOf\'s, and review-evidence.ts defines none of them', () => {
    const admin = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const rows = PROD.input.games.flatMap(game => transitionsOf(game, index))
    assert.deepEqual(admin.evidence!.sections.restarts, rows)
    const source = fs.readFileSync(path.join(__dirname, 'review-evidence.ts'), 'utf8')
    for (const reader of ['segmentsOf', 'readPath', 'membersAt', 'along', 'teamsOf', 'objectivesOf', 'holderOf', 'supportOf', 'termsOf', 'creditOf', 'transitionsOf', 'restrictionsOf']) {
        assert.ok(!source.includes(`function ${reader}(`) && !source.includes(`const ${reader} = `), `${reader} is defined in review-evidence.ts`)
    }
})

test('10. nothing activity-specific is written in the two modules', () => {
    for (const file of ['field-diagram.ts', 'game-reading.ts']) {
        const source = fs.readFileSync(path.join(__dirname, file), 'utf8')
        for (const literal of ['A01', 'RPC-0', 'GF2', 'EM-0', 'BUILDING', 'PRESSING', 'A01-R1', 'halfway', 'TEAM_AT_AXIS']) assert.ok(!source.includes(literal), `${file}: ${literal}`)
        const code = source
            .split('\n')
            .filter(line => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
            .join('\n')
        for (const value of ['5', '20', '30', '40', '12']) assert.ok(!new RegExp(`(^|[^\\w.])${value}([^\\w.]|$)`).test(code), `${file}: the number ${value} is typed in the code`)
    }
})

console.log(`field-diagram.unit.ts — ${passed} passed`)
