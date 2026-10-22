/**
 * The Coach Overview's learning purpose, game sentence and basic parameters — stage 3A, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 1: *"Coach Overview — The immediate understanding of the activity: learning purpose,
 * one-sentence game description, basic parameters, essential scoring objectives, and a simple diagram."* and *"Both levels must derive
 * from the same authorized activity representation, with no contradictions or invented instructions."* Item 3: *"My preference is to use
 * the Learning Goal's coach-facing definition as the primary source."* and *"The system should not independently invent a learning
 * purpose."*
 *
 * Pinned here, on the real chain:
 *
 *   1. the shared count builder (`teamCountPhrases`) is the Players sentence's own: its parts are the sentence's parts, and each team's
 *      counts are that team's (team-indexed);
 *   2. the purpose is the Learning Goal's "Coach Definition", byte for byte against the planning model's JSON, cited; a demonstration has
 *      none;
 *   3. a goal with no definition shows no purpose and an administrator's gap, and is served exactly as before;
 *   4. the game sentence for A01 at 12 players with 1 and 2 of the specialized role and at 11, the same in both blocks, every path it cites
 *      and every number it binds being the Details sentences' own in that block;
 *   5. the game sentence for both served demonstrations at every role case; the refused one has none;
 *   6. a marked line moved off half the length never reads "halfway" (TEST-ONLY 15 m offset), and the derived term cites both values;
 *   7. the parameters, digits only, bound as Details binds them;
 *   8. a target no rule covers withholds the game sentence, never the activity;
 *   9. role blocks whose teams the counts do not tell apart say the teams together, then each role's target (TEST-ONLY);
 *  10. only an administrator's review answer carries the overview; no goal id, value or knowledge id is written in the module.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { LoadedContract } from '../derivation/types'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { reviewActivity } from './activity-review'
import { buildActivity, buildActivityForReview, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { CoachOverviewDraft, gameSentenceOf, parametersOf, PURPOSE_SOURCE, purposeOf } from './coach-overview'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { Instruction, renderConcreteGame, teamCountPhrases } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the Coach Overview: purpose, game sentence and parameters (stage 3A)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const sessionAt = (players: number, keepers: number) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } })
const a01At = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: sessionAt(players, keepers) })
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const blocksOf = (fixture: any): { blockId: string; fixture: any }[] => ((fixture?.roleBlocks?.blocks ?? []) as any[]).map(block => ({ blockId: block.blockId, fixture: block.fixture }))
const playersOf = (rendered: { instructions: Instruction[] }) => rendered.instructions.find(i => i.section === 'Players' && i.from.includes('envelope.players'))!
const adminDraft = (request: any): CoachOverviewDraft => {
    const activity = buildActivityForReview(request, { includeDrafts: true }) as ServedActivity
    assert.equal(activity.outcome, 'served', JSON.stringify((activity as unknown as RefusedActivity).reasons))
    assert.ok(activity.overviewDraft, 'an administrator\'s review of a served activity carries the overview draft')
    return activity.overviewDraft!
}

/** The planning model's JSON, read from disk: the purpose is compared byte for byte against the file, not against the loader. */
const PLANNING = JSON.parse(fs.readFileSync(path.join(__dirname, '../session-planning/session-planning-model.rc1.json'), 'utf8'))

/** The A01 game sentence the BUILD PLAN's EXPECTED PRESENTATION gives as overview sentence 2 (DRAFT), at 12 players and 1 of the role. */
const A01_GAME_12_1 =
    "The building team (6 outfield players and 1 goalkeeper) attacks the target zone beyond the marked line at halfway; the pressing team (5 outfield players) attacks the 5 m target zone at the building team's end."
const A01_GAME_12_2 =
    "The building team (1 goalkeeper and 6 other players) attacks the target zone beyond the marked line at halfway; the pressing team (5 other players) attacks the 5 m target zone at the building team's end."
const A01_GAME_11_1 =
    "The building team (5 outfield players and 1 goalkeeper) attacks the target zone beyond the marked line at halfway; the pressing team (5 outfield players) attacks the 5 m target zone at the building team's end."

test('1. the shared count builder IS the Players sentence\'s: its parts are the sentence\'s parts, and each team\'s counts are that team\'s', () => {
    const cases: [string, any][] = [
        ...([[12, 1], [12, 2], [11, 1]] as const).flatMap(([players, keepers]) => blocksOf(buildActivityWithFixture(a01At(players, keepers)).fixture).map(block => [`A01 ${players}/${keepers} ${block.blockId}`, block.fixture] as [string, any])),
        ...MECHANISM_DEMONSTRATIONS.flatMap(demonstration =>
            [0, 1, 2].map(keepers => [`${demonstration.id} 12/${keepers}`, buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: sessionAt(12, keepers) }).fixture] as [string, any]),
        ).filter(([, fixture]) => fixture && fixture.game),
    ]
    assert.ok(cases.length >= 6 + 3, `${cases.length} games`)
    let byRoleSeen = 0
    for (const [what, fixture] of cases) {
        const counts = teamCountPhrases(fixture)
        const players = playersOf(renderConcreteGame(fixture))
        assert.ok(players, `${what}: a Players sentence`)
        // The teams, then each team's segments, are consecutive parts of the Players sentence, each with the builder's words, status,
        // citations and bindings (only the sentence's own joining words differ: " into ", ": the {noun} has ", "; the {noun} has ").
        const at = players.parts!.findIndex(p => p.text.endsWith(counts.teamsCount!.text) && p.from.join() === counts.teamsCount!.from.join())
        assert.ok(at >= 0, `${what}: the teams part`)
        assert.deepEqual(players.parts![at].bindings, counts.teamsCount!.bindings, what)
        const following = players.parts!.slice(at + 1)
        const segments = counts.teams.flatMap(team => team.segments)
        segments.forEach((segment, n) => {
            assert.ok(following[n].text.endsWith(segment.text), `${what}: "${following[n].text}" ends with "${segment.text}"`)
            assert.deepEqual([following[n].status, following[n].from, following[n].bindings], [segment.status, segment.from, segment.bindings], what)
        })
        if (counts.neutrals) assert.ok(players.parts!.some(p => p.text === `, with ${counts.neutrals!.text}` && p.from.join() === counts.neutrals!.from.join()), `${what}: the neutral count`)
        // Team-indexed: each phrase's numbers are the indexed team's own counts, and it names the role that team holds.
        const teams: any[] = fixture.game.performers.teams
        for (const phrase of counts.teams) {
            for (const segment of phrase.segments) for (const binding of segment.bindings) {
                const property = binding.path.slice('performers.teams[].'.length)
                assert.equal(teams[phrase.team][property], binding.quantity, `${what}: team ${phrase.team} holds ${binding.quantity} at ${property}`)
            }
            const designation = fixture.record.roleBlock.holders[phrase.role]
            assert.ok(fixture.record.designationBindings.some((b: any) => b.designation === designation && b.handle === teams[phrase.team].elementId), `${what}: team ${phrase.team} holds ${phrase.role}`)
            byRoleSeen++
        }
    }
    assert.ok(byRoleSeen >= 12, 'every A01 block is said by role')
})

test('2. the purpose is the Learning Goal\'s Coach Definition byte for byte, cited to the planning model; a demonstration has none', () => {
    assert.equal(PLANNING.learning_goals.length, sessionPlanningModel.learningGoals().length)
    for (const row of PLANNING.learning_goals) {
        const { purpose, gap } = purposeOf(String(row.ID))
        assert.equal(gap, null, row.ID)
        assert.equal(purpose!.text, row[PURPOSE_SOURCE.column], `${row.ID}: byte for byte`)
        assert.equal(Buffer.compare(Buffer.from(purpose!.text), Buffer.from(row['Coach Definition'])), 0, row.ID)
        assert.deepEqual(purpose!.source, { kind: 'KNOWLEDGE', file: 'back/src/system/session-planning/session-planning-model.rc1.json', table: 'learning_goals', column: 'Coach Definition', id: String(row.ID) })
        assert.equal(purpose!.wording, 'APPROVED')
    }
    // The cited file and table are where the text is.
    assert.ok(fs.existsSync(path.resolve(__dirname, '../../../..', PURPOSE_SOURCE.file)))
    // On the served activity, as an administrator reads it.
    const draft = adminDraft(a01At(12, 1))
    assert.equal(draft.purpose!.text, "Build possession from deep while progressing beyond the opponent's first line of pressure.")
    assert.equal(draft.purpose!.text, PLANNING.learning_goals.find((row: any) => row.ID === 'A01')['Coach Definition'])
    assert.deepEqual(draft.gaps, [])
    // A demonstration claims no goal: no purpose, and no gap for it.
    assert.deepEqual(purposeOf(null), { purpose: null, gap: null })
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const asked = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: sessionAt(12, 0) }, { includeDrafts: true })
        if (asked.outcome !== 'served') continue
        assert.equal((asked as ServedActivity).overviewDraft!.purpose, null, demonstration.id)
        assert.ok(!(asked as ServedActivity).overviewDraft!.gaps.some(gap => gap.part === 'purpose'), demonstration.id)
    }
})

test('3. a goal with no Coach Definition: no purpose, a gap for an administrator, and the activity served exactly as before (TEST-ONLY)', () => {
    // At the function: an empty or missing definition is a gap, never composed.
    for (const value of ['', '   ', undefined, null, 7]) {
        const { purpose, gap } = purposeOf('A01', () => ({ ID: 'A01', 'Coach Definition': value as any }))
        assert.equal(purpose, null)
        assert.equal(gap!.part, 'purpose')
        assert.ok(gap!.what.includes('none is composed'), gap!.what)
    }
    assert.equal(purposeOf('A01', () => undefined).purpose, null)
    // On the chain: the loaded planning row's definition emptied in memory (TEST-ONLY), restored whatever happens.
    const production = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    const row: any = sessionPlanningModel.learningGoal('A01')
    const kept = row['Coach Definition']
    let emptied: ServedActivity
    try {
        row['Coach Definition'] = ''
        emptied = buildActivityForReview(a01At(12, 1), { includeDrafts: true }) as ServedActivity
    } finally {
        row['Coach Definition'] = kept
    }
    assert.equal(sessionPlanningModel.learningGoal('A01')!['Coach Definition'], kept, 'restored')
    assert.equal(emptied.outcome, 'served', 'the activity is served without a purpose')
    assert.deepEqual(emptied.rendered, production.rendered, 'what a coach is served does not change')
    assert.equal(emptied.overviewDraft!.purpose, null)
    assert.deepEqual(emptied.overviewDraft!.gaps.map(gap => gap.part), ['purpose'])
    assert.deepEqual(emptied.overviewDraft!.blocks, production.overviewDraft!.blocks, 'the game and parameters are still computed')
})

test('4. the A01 game sentence: the expected words at 12/1, 12/2 and 11/1, the same in both blocks, citing and binding only what Details does', () => {
    for (const [players, keepers, expected] of [[12, 1, A01_GAME_12_1], [12, 2, A01_GAME_12_2], [11, 1, A01_GAME_11_1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const draft = adminDraft(a01At(players, keepers))
        assert.equal(draft.blocks.length, 2, what)
        assert.deepEqual(draft.blocks.map(block => block.game?.text), [expected, expected], what)
        assert.equal(draft.sameTextInEveryBlock, true, what)
        assert.deepEqual(draft.gaps, [], what)
        // Each block's sentence cites its own block's targets: the building target differs by block, the words do not.
        const buildingTargets = draft.blocks.map(block => block.game!.parts.find(p => p.text.includes('beyond the marked line'))!.from.find(p => p.endsWith('.noun') && !p.includes('A01-R1-S2'))!)
        assert.notEqual(buildingTargets[0], buildingTargets[1], `${what}: each block cites its own target`)
        // Against that block's own Details render: every path the game and parameters cite is cited there, every number bound as there.
        const built = buildActivityWithFixture(a01At(players, keepers))
        for (const { blockId, fixture } of blocksOf(built.fixture)) {
            const block = draft.blocks.find(entry => entry.blockId === blockId)!
            const details = renderConcreteGame(fixture)
            const cited = new Set(details.instructions.flatMap(i => i.from))
            const bound = new Set(details.instructions.flatMap(i => (i.parts ?? []).flatMap(p => p.bindings)).map(b => `${b.path}=${b.quantity}`))
            for (const sentence of [block.game!, block.parameters!]) {
                for (const p of sentence.from) assert.ok(cited.has(p), `${what} ${blockId}: ${p} is cited by a Details sentence`)
                for (const b of sentence.parts.flatMap(p => p.bindings)) assert.ok(bound.has(`${b.path}=${b.quantity}`), `${what} ${blockId}: ${b.quantity} at ${b.path} is bound so in Details`)
                assert.deepEqual(sentence.quantities, sentence.parts.flatMap(p => p.bindings.map(b => b.quantity)), what)
                assert.equal(sentence.wording, 'DRAFT', what)
            }
        }
    }
})

test('5. the demonstrations\' game sentence at every role case; a refused demonstration has no overview', () => {
    const expected: Record<string, string> = {
        'scoring-modifier': "2 teams of 6: each team attacks the line at the other team's end.",
        'neutral-players': "2 teams of 5, with 2 neutral players who support whichever team has possession: each team attacks the line at the other team's end.",
    }
    let refused = 0
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        for (const keepers of [0, 1, 2]) {
            const asked = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: sessionAt(12, keepers) }, { includeDrafts: true })
            if (asked.outcome === 'refused') {
                refused++
                assert.ok(!('overviewDraft' in asked), `${demonstration.id}: a refused activity has no overview`)
                continue
            }
            const draft = (asked as ServedActivity).overviewDraft!
            assert.deepEqual(draft.blocks.map(block => block.blockId), ['ONE_GAME'])
            assert.equal(draft.blocks[0].game!.text, expected[demonstration.id], `${demonstration.id} 12/${keepers}`)
            assert.equal(draft.blocks[0].parameters!.text, '40 x 30 m, 12 players, 20 minutes')
            assert.deepEqual(draft.gaps, [])
        }
    }
    assert.equal(refused, 3, 'the gate demonstration is refused at every role case today')
    // A refused goal has none either.
    assert.ok(!('overviewDraft' in buildActivityForReview(a01At(12, 0), { includeDrafts: true })))
})

test('6. a marked line off half the length never reads "halfway" (TEST-ONLY 15 m offset); at half the length the term cites both values', () => {
    const offsetFifteen = (contracts: LoadedContract[]) => {
        const item: any = contracts.find(contract => contract.contractId === 'provisional:A01-R1')!.items.find(entry => entry.itemId === 'A01-R1-S5-1')
        item.value = { ...item.value, offsetM: { from: 15, to: 15 }, asAuthored: 'TEST-ONLY 15 m from the building team\'s end line' }
    }
    const moved = buildActivityUnderAuthorizationRecords(a01At(12, 1), learningGoalAuthorizations(), { alter: offsetFifteen, review: { includeDrafts: true } }).activity as ServedActivity
    assert.equal(moved.outcome, 'served')
    for (const block of moved.overviewDraft!.blocks) {
        assert.ok(!block.game!.text.includes('halfway'), block.game!.text)
        assert.equal(block.game!.text, "The building team (6 outfield players and 1 goalkeeper) attacks the target zone beyond the marked line; the pressing team (5 outfield players) attacks the 5 m target zone at the building team's end.")
        assert.deepEqual(block.game!.derivedTerms, [])
        assert.ok(!block.game!.from.includes('envelope.area.length_m'))
    }
    // Production: the term is said with the rule and both values, each cited.
    for (const block of adminDraft(a01At(12, 1)).blocks) {
        assert.deepEqual(block.game!.derivedTerms.map(term => [term.term, term.values]), [['halfway', [{ quantity: 20, path: 'space.regions[c:provisional:A01-R1:A01-R1-S2-1].position.along' }, { quantity: 40, path: 'envelope.area.length_m' }]]])
        for (const value of block.game!.derivedTerms[0].values) assert.ok(block.game!.from.includes(value.path), value.path)
    }
    // At the function, on a copy of a block: the line held as a range, or the area longer, never reads "halfway".
    const [first] = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    // A line held as a range is no marked line at one place: the building team's target has no words, so the sentence is withheld.
    const ranged = copy(first.fixture)
    ranged.game.space.regions.find((r: any) => r.elementId === 'c:provisional:A01-R1:A01-R1-S2-1').position.along.offsetM = { from: 15, to: 25 }
    assert.equal(gameSentenceOf(ranged).sentence, null)
    // The same line in a longer area (TEST-ONLY: the length, and the building team's target realized to the new end line): said, without
    // "halfway", since twice 20 m is not 50 m.
    const longer = copy(first.fixture)
    longer.game.envelope.area.length_m = 50
    longer.status.geometry.find((g: any) => g.path === 'space.regions[c:restated:GF2:GF2-03.f].position.along').geometry.interval = { from: 20, to: 50 }
    const said = gameSentenceOf(longer).sentence!
    assert.equal(said.text, "The building team (6 outfield players and 1 goalkeeper) attacks the target zone beyond the marked line; the pressing team (5 outfield players) attacks the 5 m target zone at the building team's end.")
    assert.deepEqual(said.derivedTerms, [])
})

test('7. the parameters: digits, each bound to the path the Details sentence binds it to', () => {
    const draft = adminDraft(a01At(12, 1))
    for (const block of draft.blocks) {
        const parameters = block.parameters!
        assert.equal(parameters.text, '40 x 30 m, 12 players, 20 minutes')
        assert.deepEqual(parameters.parts.flatMap(p => p.bindings), [
            { quantity: 40, path: 'envelope.area.length_m' },
            { quantity: 30, path: 'envelope.area.width_m' },
            { quantity: 12, path: 'envelope.players' },
            { quantity: 20, path: 'envelope.duration_min' },
        ])
    }
    // No overview sentence spells a number out: fidelity reads no "one", so a count is always a digit.
    const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty', 'thirty', 'forty']
    const texts = [...draft.blocks.flatMap(block => [block.game!.text, block.parameters!.text]), ...['scoring-modifier', 'neutral-players'].flatMap(id => adminDraft({ kind: 'mechanism-demonstration', demonstrationId: id, session: sessionAt(12, 1) }).blocks.map(block => block.game!.text))]
    for (const text of texts) for (const word of text.toLowerCase().split(/[^a-z]+/)) assert.ok(!WORDS.includes(word), `${word} in "${text}"`)
    // A game holding no envelope says no parameters, and says why.
    const [first] = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    const bare = copy(first.fixture)
    bare.game.envelope = {}
    assert.deepEqual(parametersOf(bare), { sentence: null, gap: 'the game holds no area, player count or duration' })
})

test('8. a target no rule covers withholds the game sentence with a gap, never the activity or the parameters', () => {
    const [first] = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    const unworded = copy(first.fixture)
    // TEST-ONLY: the pressing target's required depth taken off, so it is neither an end zone of that depth nor beyond the marked line.
    const pressing = unworded.status.geometry.find((g: any) => g.path === 'space.regions[c:restated:GF2:GF2-03.e].position.along')
    delete pressing.geometry.extentBound
    const { sentence, gap } = gameSentenceOf(unworded)
    assert.equal(sentence, null)
    assert.ok(gap!.startsWith("no wording here says where the pressing team's target lies"), gap!)
    assert.equal(parametersOf(unworded).sentence!.text, '40 x 30 m, 12 players, 20 minutes')
})

test('9. role blocks whose teams the counts do not tell apart: the teams said together, then each role\'s target (TEST-ONLY copy)', () => {
    // No game reaches this today; the template must still hold for it. Both teams 6 outfield players and none of the role, the session
    // holding none: the shared builder says "2 teams of 6" (EQUAL), and the game sentence names each role by its noun with no counts.
    const [first] = blocksOf(buildActivityWithFixture(a01At(12, 1)).fixture)
    const equal = copy(first.fixture)
    for (const team of equal.game.performers.teams) {
        team.outfieldCount = 6
        team[ROLE] = 0
    }
    equal.envelope.roles = { ...none }
    const counts = teamCountPhrases(equal)
    assert.equal(counts.mode, 'EQUAL')
    assert.deepEqual(counts.teams, [])
    const { sentence, gap } = gameSentenceOf(equal)
    assert.equal(gap, null)
    assert.equal(sentence!.text, "2 teams of 6: the building team attacks the target zone beyond the marked line at halfway; the pressing team attacks the 5 m target zone at the building team's end.")
    assert.deepEqual(sentence!.parts[0].bindings, counts.teamsCount!.bindings)
    // Teams the builder cannot count at all: no game sentence, and why.
    const empty = copy(first.fixture)
    empty.game.performers.teams = []
    assert.deepEqual(gameSentenceOf(empty), { sentence: null, gap: 'the game holds no teams to count' })
})

test('10. only an administrator\'s review answer carries the overview DRAFT; nothing activity-specific is written in the module', () => {
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    const coach = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }) as ServedActivity
    const admin = reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity
    assert.ok(!('overviewDraft' in coach) && !!admin.overviewDraft)
    assert.ok(!('overviewDraft' in buildActivity(a01At(12, 1))))
    assert.ok(!('overviewDraft' in buildActivityForReview(a01At(12, 1), { includeDrafts: false })))
    for (const demonstration of MECHANISM_DEMONSTRATIONS) assert.ok(!('overviewDraft' in buildActivity({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: sessionAt(12, 1) })), demonstration.id)
    // Stage 3D: the overview is served (to both) once its agreement check passes; the draft, with the check, stays the administrator's.
    assert.equal(admin.overviewDraft!.served, true)
    assert.ok(!!coach.overview && JSON.stringify(coach.overview) === JSON.stringify(admin.overview))
    assert.equal(coach.overview!.purpose, admin.overviewDraft!.purpose!.text)
    assert.equal(coach.overview!.game, admin.overviewDraft!.blocks[0].game!.text)
    assert.equal(coach.overview!.parameters, admin.overviewDraft!.blocks[0].parameters!.text)
    // No goal id, knowledge id, role code or typed value of the first activity in the module's code.
    const source = fs.readFileSync(path.join(__dirname, 'coach-overview.ts'), 'utf8')
    for (const row of PLANNING.learning_goals) assert.ok(!new RegExp(`\\b${row.ID}\\b`).test(source), row.ID)
    for (const literal of ['RPC-0', 'GF2', 'EM-0', 'BUILDING', 'PRESSING', 'A01-R1']) assert.ok(!source.includes(literal), literal)
    const code = source
        .split('\n')
        .filter(line => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
        .join('\n')
    for (const value of ['5', '20', '30', '40', '12']) assert.ok(!new RegExp(`(^|[^\\w.])${value}([^\\w.]|$)`).test(code), `the number ${value} is typed in the code`)
})

console.log(`coach-overview.unit.ts — ${passed} passed`)
