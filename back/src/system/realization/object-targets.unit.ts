/**
 * Object targets and goal geometry — stage B, 23 October 2026 (register version 17: row O6 `objects[].facing`, RC-21's `central` made
 * machine-readable, the `objectGeometry` block; team-ends reading an object target; T15; the zero-depth goal; the session-stated width; the
 * `defersWith` pairing; the provisional loader's placeholder refusal; the diagram's D7 with an object target).
 *
 * Christian, reply filed 25 October 2026, item 3: *"I approve a goalkeeper-protected physical goal as an authorized alternative to the
 * pressing team's 5 m target zone within the Goalkeeper Build-Out context."* *"The goal should be positioned at the building team's end."*
 * *"Goal dimensions and suitability should be determined through approved soccer knowledge and available equipment. Please identify any
 * missing knowledge decisions needed here rather than inventing dimensions or treating every goal as interchangeable."* Item 2: *"Please
 * implement this as a general role-specific scoring capability, preserving structural validation and knowledge authorization."*
 *
 * What is pinned here:
 *   1. the register holds the rows as data, in one versions entry quoting him, and a damaged copy halts H1;
 *   2. team-ends reads an object target's end from its typed along position, with one level of recursion, and a cycle refuses;
 *   3. T15: an end-line anchor naming a team in prose, on an element whose own selector fixes no end, is refused, never a fixed anchor;
 *   4. `central` composes from a required extent or the width the session states, and refuses without one (no placeholder);
 *   5. THE END-KEYED GOAL VERSION (TEST-ONLY): block 1 passes every structural, realization and post-realization check and stops only at
 *      communication (fidelity Q3); the goal version under KEPT is refused (block 2); no width is a refusal; the zero-depth goal stands only
 *      with the register's extent row; GA-DIRECTION reads the object target; the facing row reaches the game;
 *   6. the `defersWith` pairing in the deferral and in the restatement loader;
 *   7. the provisional loader refuses a placeholder extent, a supersession and a pairing;
 *   8. the diagram reads an object target typed (D7), and production's targets are unchanged.
 *
 * Every goal value here (the width, the pose, the end key, the markers, the relationship) is TEST-ONLY and in-memory: no production file is
 * written, nothing here is served, and nothing is knowledge for the goal version (his decisions D1-D5 of the note sent to him).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/realization/object-targets.unit.ts
 */
import assert from 'node:assert/strict'

import * as corpus from '../derivation/corpus'
import { loadRegister, PROVISIONAL_REALIZATIONS_FILE, readJson, restatementTally, validateProvisionalRealizations } from '../derivation/corpus'
import { applyNoRowRestatement, ItemRestatement, pairingRefusal, RestatementTally } from '../derivation/corpus-restatement'
import { runStages0to5 } from '../derivation/engine'
import { applyRealizationDeferrals, AuthorizingRelationship } from '../derivation/realization-deferral'
import { HaltError, indexRegister } from '../derivation/register'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { ContractItem, DEFERS_TO_AUTHORIZED_REALIZATION, LoadedContract, RoleBlock } from '../derivation/types'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { checkFieldDiagram, DiagramInput, fieldDiagramDraftOf } from '../rendering/field-diagram'
import { objectivesOf } from '../rendering/game-reading'
import { renderConcreteGame } from '../rendering/render-concrete-game'
import { specializedRoleNames } from '../rendering/session-envelope'
import * as authorizationRecords from '../test-library/learning-goal-authorizations'
import { contextRelationships, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { realizeSpatialRelation } from './spatial'
import { attackingEndIn, attackingEndOf } from './team-ends'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('object targets and goal geometry (stage B, register version 17)')

const register = loadRegister()
const index = indexRegister(register)
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const KEEPER = specializedRoleNames()[0]
const sessionOf = (extra: Record<string, unknown> = {}) => ({ players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...Object.fromEntries(specializedRoleNames().map(r => [r, 0])), [KEEPER]: 1 }, ...extra })
const BLOCK_1 = 'BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END'
const BLOCK_2 = 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START'
const ROLE_BLOCK_1: RoleBlock = { blockId: BLOCK_1, holders: { BUILDING: 'TEAM_AT_AXIS_START', PRESSING: 'TEAM_AT_AXIS_END' } }
const ROLE_BLOCK_2: RoleBlock = { blockId: BLOCK_2, holders: { BUILDING: 'TEAM_AT_AXIS_END', PRESSING: 'TEAM_AT_AXIS_START' } }
const HIS_ITEM_3 = [
    "I approve a goalkeeper-protected physical goal as an authorized alternative to the pressing team's 5 m target zone within the Goalkeeper Build-Out context.",
    "The goal should be positioned at the building team's end.",
    'Goal dimensions and suitability should be determined through approved soccer knowledge and available equipment. Please identify any missing knowledge decisions needed here rather than inventing dimensions or treating every goal as interchangeable.',
]
const halts = (damage: (r: any) => void, message: RegExp, label: string) => {
    const damaged = copy(register)
    damage(damaged)
    assert.throws(() => indexRegister(damaged), (error: unknown) => error instanceof HaltError && message.test(String((error as Error).message)), label)
}

// ── 1. The register ─────────────────────────────────────────────────────────────────────────────────────
test('register version 17 holds the rows as data, in one versions entry quoting him', () => {
    const full = String(register.version)
    assert.ok(full.startsWith('17, adds object targets and the geometry a goal needs, for his reply filed 25 October 2026, item 3'))
    for (const quote of HIS_ITEM_3) assert.ok(full.split('Supersedes version 16, ')[0].includes(`"${quote}"`), quote)
    assert.equal(full.split('Supersedes version 16, which adds one primary scoring event per role').length - 1, 1, 'version 16 superseded once')
    assert.ok(!full.includes('Supersedes version 17'), 'version 17 is the current entry')
    const o6 = index.rows.get('O6')!
    assert.deepEqual([o6.path, o6.ownerRow, o6.kind], ['objects[].facing', 'O1', 'FIELD'])
    assert.deepEqual(index.vocabularies.get('O6.facing'), ['INTO_THE_AREA'])
    assert.ok(String(index.vocabularyVersions['O6.facing']).startsWith('1 (2026-10-23, register version 17, draft)'))
    assert.deepEqual(index.applicability.get('O6'), { selectorAttribute: 'kind', sameElement: true, notIn: ['ball'] }, 'withdrawn for a ball, as O4 and O5')
    const bound = register.boundVocabularies['O6.facing']
    assert.deepEqual(bound.parameters, ['EMP-0029 Facing Reference', 'EMP-0031 Facing Reference'])
    assert.ok(bound.dimensions[0].startsWith('EMD-0007 Orientation') && bound.dimensions[1].startsWith('EMD-0009 Orientation'))
    assert.ok(bound.values.INTO_THE_AREA.startsWith('Facing Reference = Playing direction'))
    const geometry = index.objectGeometry!
    assert.deepEqual([geometry.row, geometry.kindRow, geometry.alongRow, geometry.acrossRow, geometry.kindLeaf, geometry.alongLeaf], ['O1', 'O2', 'O4', 'O5', 'kind', 'position.along'])
    assert.equal(register.objectGeometry.facingRow, 'O6', 'the facing row is named (validated at load, read by nothing until its wording exists)')
    assert.deepEqual([...geometry.extentDimensions], [['goal', 1]])
    assert.equal(register.objectGeometry.extentDimensions.basis, 'OUR_INTERPRETATION', 'the map is our reading, labelled so')
    const central = register.relativeTerms.machineReadable.terms.central
    assert.deepEqual([central.kind, central.axis, central.at, central.extentFrom], ['centred', 'across', 0.5, ['REQUIRED_EXTENT', 'SESSION_STATED_WIDTH']])
    assert.equal(register.relativeTerms.central, 'contains the axis midline across the width, and touches neither touchline', 'the prose test is unchanged')
    assert.equal(register.relativeTerms.phraseIndex.map.central, undefined, 'no phrase is mapped to it: only a typed value names it')
})

test('a damaged copy halts H1: the object rows, the dimensions map, the centred term', () => {
    halts(r => (r.objectGeometry.row = 'S2'), /objectGeometry\.kindRow O2 is not a FIELD row owned by S2/, 'another collection')
    halts(r => (r.objectGeometry.acrossRow = 'O4'), /objectGeometry\.acrossRow O4 does not sit at a leaf ending "\.across"/, 'the along row as the across row')
    halts(r => (r.objectGeometry.facingRow = 'J2'), /objectGeometry\.facingRow J2 is not a FIELD row owned by O1/, 'a facing row of another collection')
    halts(r => (r.objectGeometry.extentDimensions.kinds = { 'TEST-ONLY': 1 }), /TEST-ONLY is not a member of the O2 vocabulary/, 'a kind outside the vocabulary')
    halts(r => (r.objectGeometry.extentDimensions.kinds = { goal: 3 }), /gives extent in 3 dimensions/, 'three dimensions')
    halts(r => (r.objectGeometry.extentDimensions.basis = 'AUTHORED'), /must say it is OUR_INTERPRETATION/, 'not labelled ours')
    halts(r => (r.relativeTerms.machineReadable.terms.central.extentFrom = ['TEST-ONLY']), /says where its extent comes from/, 'an unknown extent source')
    halts(r => (r.relativeTerms.machineReadable.terms.central.at = 0.4), /at the midline of its axis/, 'off the midline')
    const without = copy(register)
    delete without.objectGeometry
    assert.equal(indexRegister(without).objectGeometry, null, 'a register written before version 17 has none')
})

// ── 2. team-ends: an object target ──────────────────────────────────────────────────────────────────────
/** A TEST-ONLY concrete game: the team at the axis start attacks a region at the far end, the team at the axis end attacks an object. */
const endsGame = (goalAlong: unknown, extra: { objects?: any[]; objectives?: any[] } = {}) => ({
    objectives: [
        { elementId: 'TEST-J-START', role: 'PRIMARY_SCORING', team: 'TEAM_AT_AXIS_START', reference: { structuralRef: { contractId: 'TEST-ONLY', itemId: 'FAR' } } },
        { elementId: 'TEST-J-END', role: 'PRIMARY_SCORING', team: 'TEAM_AT_AXIS_END', reference: { structuralRef: { contractId: 'TEST-ONLY', itemId: 'GOAL' } } },
        ...(extra.objectives ?? []),
    ],
    space: { regions: [{ elementId: 'c:TEST-ONLY:FAR', selector: [{ attribute: 'longitudinal', op: '=', value: 'end-far' }] }] },
    objects: [{ elementId: 'c:TEST-ONLY:GOAL', kind: 'goal', position: { along: goalAlong } }, ...(extra.objects ?? [])],
})
const ownEndOf = (team: string) => ({ term: 'own end (of team T)', forTeam: team, offsetM: { from: 0, to: 0 }, asAuthored: 'TEST-ONLY' })

test("team-ends: an object target's end is read from its typed position, with one level of recursion; a cycle refuses", () => {
    // Block 1: the goal stands at the building team's own end, so the pressing team (the team at the axis end) attacks the 0 end line.
    const game = endsGame(ownEndOf('ROLE_HOLDER_BUILDING'))
    assert.equal(attackingEndIn(game, index, ROLE_BLOCK_1, 'ROLE_HOLDER_BUILDING'), 1, 'the region answers as it always did')
    assert.equal(attackingEndIn(game, index, ROLE_BLOCK_1, 'ROLE_HOLDER_PRESSING'), 0)
    assert.equal(attackingEndIn(game, index, ROLE_BLOCK_1, 'TEAM_AT_AXIS_END'), 0)
    assert.match(attackingEndOf(game, index, ROLE_BLOCK_1, 'ROLE_HOLDER_PRESSING').why, /attacks the object c:TEST-ONLY:GOAL, at the end line ROLE_HOLDER_BUILDING defends/)
    // At the end line the building team ATTACKS instead: the same end as the building team's own target.
    assert.equal(attackingEndIn(endsGame({ ...ownEndOf('ROLE_HOLDER_BUILDING'), term: 'attacking end (of team T)' }), index, ROLE_BLOCK_1, 'ROLE_HOLDER_PRESSING'), 1)
    // Block 2 under fixed ends: the team at the axis end now holds the building role, and its target is the goal placed by ITS OWN end - a
    // cycle, so no end is answered (and the goal is never placed by it).
    const cycle = attackingEndOf(game, index, ROLE_BLOCK_2, 'ROLE_HOLDER_BUILDING')
    assert.equal(cycle.end, null)
    assert.match(cycle.why, /a cycle, so no end is answered/)
    assert.equal(attackingEndIn(game, index, ROLE_BLOCK_2, 'ROLE_HOLDER_PRESSING'), 1, 'the other team still answers from its region')
    // A second level is not followed: the team the object's position names attacks an object positioned by a team itself.
    const twoObjects = {
        ...endsGame(ownEndOf('TEAM_AT_AXIS_START')),
        objectives: [
            { elementId: 'TEST-J-START', role: 'PRIMARY_SCORING', team: 'TEAM_AT_AXIS_START', reference: { structuralRef: { contractId: 'TEST-ONLY', itemId: 'OTHER' } } },
            { elementId: 'TEST-J-END', role: 'PRIMARY_SCORING', team: 'TEAM_AT_AXIS_END', reference: { structuralRef: { contractId: 'TEST-ONLY', itemId: 'GOAL' } } },
        ],
    }
    twoObjects.objects.push({ elementId: 'c:TEST-ONLY:OTHER', kind: 'goal', position: { along: ownEndOf('TEAM_AT_AXIS_END') } })
    const second = attackingEndOf(twoObjects, index, ROLE_BLOCK_1, 'TEAM_AT_AXIS_END')
    assert.equal(second.end, null)
    assert.match(second.why, /second level of objects positioned by a team; only one is followed/)
    // A phrase, or a position measured from nothing, names no end: nothing is answered (never a fixed anchor).
    for (const along of ['attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior', { from: 0, to: 1 }, undefined]) {
        const answer = attackingEndOf(endsGame(along), index, ROLE_BLOCK_1, 'ROLE_HOLDER_PRESSING')
        assert.equal(answer.end, null, JSON.stringify(along))
        assert.match(answer.why, /whose along position is not stated from a team's end line, so it fixes no end/)
    }
    // A register without the object rows reads no object target.
    const without = copy(register)
    delete without.objectGeometry
    assert.equal(attackingEndIn(game, indexRegister(without), ROLE_BLOCK_1, 'ROLE_HOLDER_PRESSING'), null)
})

test('team-ends on production A01: every block and role answers exactly from its region, as before', () => {
    const built = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf() } as any)
    assert.equal(built.activity.outcome, 'served')
    const blocks: any[] = (built.fixture as any).roleBlocks.blocks
    const answers = blocks.map(block => [block.blockId, ...['ROLE_HOLDER_BUILDING', 'ROLE_HOLDER_PRESSING'].map(d => attackingEndIn(block.fixture.game, index, block.block ?? block.fixture.record.roleBlock, d))])
    assert.deepEqual(answers, [
        [BLOCK_1, 1, 0],
        [BLOCK_2, 0, 1],
    ])
    // The one reader of an objective's target says which kind it is: every production target is a region.
    for (const block of blocks) {
        const game = { blockId: block.blockId, holders: block.fixture.record.roleBlock.holders, fixture: block.fixture }
        assert.deepEqual(objectivesOf(game as any, index).map(o => [o.target?.kind, o.target?.id === o.regionId, o.region?.elementId === o.target?.id]), [['region', true, true], ['region', true, true]])
    }
})

// ── 3. T15 and 4. central ───────────────────────────────────────────────────────────────────────────────
const AREA = { lengthM: 40, widthM: 30 }
const PHRASE = 'attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior'

test('T15: an end-line anchor naming a team in prose is placed only where the element itself fixes the end; otherwise it refuses', () => {
    const refused = realizeSpatialRelation(PHRASE, index, { envelope: AREA, axis: 'along' })!
    assert.ok(refused.refusal && /names in prose only, and the element's own selector fixes no end, so no end is assumed/.test(refused.refusal), JSON.stringify(refused))
    assert.equal(refused.interval, undefined)
    assert.equal(refused.anchor, undefined, 'no fixed anchor: until stage B this was the far end line whatever team it named')
    const near = realizeSpatialRelation(PHRASE, index, { envelope: AREA, axis: 'along', longitudinal: 'end-near' })!
    assert.deepEqual([near.anchor, near.refusal], [0, undefined], "the element's own authored selector fixes the end, as before (his 9 October ruling)")
    assert.equal(realizeSpatialRelation(PHRASE, index, { envelope: AREA, axis: 'along', longitudinal: 'end-far' })!.anchor, 40)
    // An anchor that names no team is untouched (a touchline-adjacent region with no side keeps its term's own anchor).
    assert.equal(realizeSpatialRelation('touchline-adjacent', index, { envelope: AREA, axis: 'across' })!.refusal, undefined)
})

test("central: centred on the midline from the session's stated width or a required extent; refused without one, never a placeholder", () => {
    const central = (ctx: Record<string, unknown> = {}) => realizeSpatialRelation({ term: 'central', asAuthored: 'TEST-ONLY' }, index, { envelope: AREA, axis: 'across', ...ctx })!
    assert.deepEqual(central({ statedExtentM: 5 }).interval, { from: 12.5, to: 17.5 })
    assert.deepEqual(central({ statedExtentM: 7.32 }).interval, { from: 11.34, to: 18.66 }, 'exact, not a float product')
    const none = central()
    assert.equal(none.interval, undefined)
    assert.match(none.refusal ?? '', /"central" needs the element's extent across the axis, and neither a required extent nor a width the session states is given for it/)
    assert.match(central({ statedExtentM: 30 }).refusal ?? '', /reaches both touchlines/)
    assert.ok(central({ statedExtentM: 0 }).refusal, 'a zero width is no width')
    // A REQUIRED extent (the register's bounded minority, a fraction of the axis): the widest it admits; a stated width must lie inside it.
    const required = { min: 0.15, max: 0.25, preferred: false, fractionOfAxis: true }
    assert.deepEqual(central({ extentBound: required }).interval, { from: 11.25, to: 18.75 })
    assert.deepEqual(central({ extentBound: required, statedExtentM: 6 }).interval, { from: 12, to: 18 })
    assert.match(central({ extentBound: required, statedExtentM: 10 }).refusal ?? '', /lies outside the required extent \(4\.5-7\.5 m\)/)
    // A PREFERRED extent never closes it.
    assert.ok(central({ extentBound: { ...required, preferred: true } }).refusal)
    // A register without the term does not recognise it: nothing is placed, and nothing is guessed.
    const without = copy(register)
    delete without.relativeTerms.machineReadable.terms.central
    assert.equal(realizeSpatialRelation({ term: 'central', asAuthored: 'TEST-ONLY' }, indexRegister(without), { envelope: AREA, axis: 'across', statedExtentM: 5 }), null)
})

// ── 5. The end-keyed goal version (TEST-ONLY) ───────────────────────────────────────────────────────────
const P = 'provisional:A01-R1'
const GF2 = 'restated:GF2'
const RPC = 'restated:RPC-001'
const SUPERSEDED = [`${GF2}::GF2-19`, `${GF2}::GF2-03.b`, `${GF2}::GF2-06.a`, `${RPC}::RPC-001-08.a`]
/** The design's F2 withdrawals from A01-R1 (S5-3, S5-4, V27-1, V29-1, V30-1, V31-1, T4-4), TEST-ONLY here. */
const WITHDRAW = ['A01-R1-S5-3', 'A01-R1-S5-4', 'A01-R1-V27-1', 'A01-R1-V29-1', 'A01-R1-V30-1', 'A01-R1-V31-1', 'A01-R1-T4-4']
const TEST_RELATIONSHIP = {
    id: 'TEST-ONLY-SCORING',
    category: 'CONTEXT_SCORING_RELATIONSHIP',
    contextId: 'RPC-001',
    contextName: 'TEST-ONLY',
    scoringEvent: 'goal',
    role: 'PRESSING',
    rows: ['B9', 'J2'],
    supersedes: SUPERSEDED,
    via: ['TEST-ONLY'],
    identified: 'TEST-ONLY',
    status: 'CONFIRMED',
    confirmedOn: 'TEST-ONLY',
    confirmedBy: 'TEST-ONLY',
    citedAs: 'TEST-ONLY',
    words: ['TEST-ONLY'],
    note: null,
}
/** TEST-ONLY items, never production data. */
const testItem = (itemId: string, row: string, selector: string, requirement: string, value: unknown, extra: Record<string, unknown> = {}): ContractItem =>
    ({
        itemId,
        row,
        selector,
        requirement,
        value,
        valueStatus: requirement === 'EXISTS' ? 'N/A' : 'REQUIRED_RANGE',
        strictness: 'REQUIRED',
        scope: 'WHOLE_GAME',
        basis: 'OWNER_RULING',
        checkability: 'STRUCTURAL',
        structuralClause: 'whole item',
        category: 'PROVISIONAL_REALIZATION_CHOICE',
        choice: 'TEST-ONLY',
        words: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        basisEvidence: 'TEST-ONLY',
        fitNote: 'TEST-ONLY',
        ...extra,
    }) as unknown as ContractItem
interface GoalOptions {
    /** The width the session states for a goal (TEST-ONLY), or none. */
    width?: number | null
    /** Widths the session states for other kinds (TEST-ONLY). */
    widths?: Record<string, number>
    /** The goal's along position (TEST-ONLY): on the building team's end line by default. */
    along?: unknown
    /** GF2-03.e paired with GF2-08.f (the design's K2); false leaves it standing. */
    pair?: boolean
    /** Extra TEST-ONLY items for the realization. */
    extra?: ContractItem[]
}
/**
 * The goal version as the design's F2 describes it, built whole on TEST-ONLY copies: GF2-08.f deferring to an authorized realization and
 * GF2-03.e paired with it; the four items the pressing role departs from marked; A01-R1's zone-only items withdrawn; a goal standing on the
 * building team's end line, centred, as wide as the session states; the pressing objective's reference keyed by the end designation (the
 * design's Stage B J2) and the pressing role scoring by a goal, both citing one TEST-ONLY confirmed scoring relationship. Fixed ends (KEPT):
 * the end exchange is stage D's.
 */
const goalBuild = (options: GoalOptions = {}): RefusedActivity => {
    const read = authorizationRecords.contextRelationships
    ;(authorizationRecords as any).contextRelationships = () => [...read(), copy(TEST_RELATIONSHIP)]
    try {
        const width = options.width === undefined ? 5 : options.width
        const widths = { ...(width === null ? {} : { goal: width }), ...(options.widths ?? {}) }
        return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: sessionOf(Object.keys(widths).length ? { statedObjectWidthsM: widths } : {}) } as any, learningGoalAuthorizations(), {
            alter: contracts => {
                const contract = (id: string) => contracts.find(c => c.contractId === id)!
                const item = (key: string) => contract(key.split('::')[0]).items.find(i => i.itemId === key.split('::')[1])! as any
                item(`${GF2}::GF2-08.f`).defersTo = DEFERS_TO_AUTHORIZED_REALIZATION
                if (options.pair !== false) item(`${GF2}::GF2-03.e`).defersWith = 'GF2-08.f'
                for (const key of SUPERSEDED) item(key).yieldsForRole = 'AUTHORIZED_ROLE_SCORING'
                const p = contract(P)
                p.items = p.items.filter(i => !WITHDRAW.includes(i.itemId))
                p.items.push(
                    testItem('TEST-GOAL', 'O1', 'kind=goal', 'EXISTS', 'N/A'),
                    testItem('TEST-GOAL-ALONG', 'O4', 'kind=goal', 'POSITIONED', options.along ?? { ...ownEndOf('ROLE_HOLDER_BUILDING'), asAuthored: 'TEST-ONLY on the building team end line' }),
                    testItem('TEST-GOAL-ACROSS', 'O5', 'kind=goal', 'POSITIONED', { term: 'central', asAuthored: 'TEST-ONLY centred' }),
                    testItem('TEST-J2-END', 'J2', 'role=PRIMARY_SCORING & team=TEAM_AT_AXIS_END', 'EQUALS', { structuralRef: { contractId: P, itemId: 'TEST-GOAL' }, asAuthored: 'TEST-ONLY the goal' }, { authorizedBy: TEST_RELATIONSHIP.id }),
                    testItem('TEST-B9-PRESSING', 'B9', 'activityRole=PRESSING', 'EQUALS', 'goal', { authorizedBy: TEST_RELATIONSHIP.id }),
                    ...(options.extra ?? []),
                )
            },
            // The realization choice for the region that yields with the pressing objective goes with it (the design's F2).
            alterSupplied: supplied => {
                supplied.choices = supplied.choices.filter(choice => !choice.lineId.includes('GF2-03.e'))
            },
            review: { includeDrafts: true },
        }).activity as RefusedActivity
    } finally {
        ;(authorizationRecords as any).contextRelationships = read
    }
}
const reasonsOf = (activity: RefusedActivity, blockId: string) => activity.reasons.filter(reason => reason.startsWith(`block ${blockId}: `)).map(reason => reason.slice(`block ${blockId}: `.length))
const GOAL = `objects[c:${P}:TEST-GOAL]`

test('THE END-KEYED GOAL VERSION (TEST-ONLY): block 1 passes every check before, at and after realization and stops only at communication (fidelity Q3)', () => {
    const activity = goalBuild()
    assert.equal(activity.outcome, 'refused')
    const block1 = reasonsOf(activity, BLOCK_1)
    assert.ok(block1.length > 0)
    // Every reason block 1 gives is the communication stage's: the goal and the pressing role's goal have no approved wording yet (Stage G).
    for (const reason of block1) assert.ok(/^fidelity Q3: |^awaiting approved wording: /.test(reason), reason)
    for (const path of [`${GOAL}.position.along`, `${GOAL}.position.across`]) assert.ok(block1.includes(`fidelity Q3: ${path} is established by the game and no instruction carries it`), path)
    assert.ok(block1.includes('awaiting approved wording: activityRoles[c:provisional:A01-R1:A01-R1-B1-2].scoresBy (B9)'))
    assert.ok(!block1.some(reason => /GA-|realization refused|Gate A/.test(reason)), 'no gate, realization or post-realization refusal in block 1')
    // The consumer of team-ends' object reading in the realizer: a TEST-ONLY object measured from the PRESSING team's own end line is placed
    // only because the pressing team's end is read from the goal it attacks (none of A01-R1's remaining items is stated for that team's end).
    // Placed, it is established and unsaid (fidelity Q3), never unplaced; with the object reading taken out it was left unplaced and refused
    // after realization (mutation-checked 23 October 2026).
    const GATE = `objects[c:${P}:TEST-MARKER]`
    const marked = reasonsOf(
        goalBuild({
            widths: { gate: 2 },
            extra: [
                testItem('TEST-MARKER', 'O1', 'kind=gate', 'EXISTS', 'N/A'),
                testItem('TEST-MARKER-ALONG', 'O4', 'kind=gate', 'POSITIONED', { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_PRESSING', offsetM: { from: 3, to: 4 }, asAuthored: 'TEST-ONLY 3-4 m from the pressing team end line' }),
                testItem('TEST-MARKER-ACROSS', 'O5', 'kind=gate', 'POSITIONED', { term: 'central', asAuthored: 'TEST-ONLY centred' }),
            ],
        }),
        BLOCK_1,
    )
    for (const reason of marked) assert.ok(/^fidelity Q3: |^awaiting approved wording: /.test(reason), reason)
    assert.ok(marked.includes(`fidelity Q3: ${GATE}.position.along is established by the game and no instruction carries it`), marked.join(' | '))
})

test('the goal version under KEPT is refused: in block 2 the pressing role holds a region with a goal event, and the goal could not be placed', () => {
    const activity = goalBuild()
    assert.equal(activity.outcome, 'refused')
    const block2 = reasonsOf(activity, BLOCK_2)
    // Measured 23 October 2026: block 2 is refused BEFORE realization, by GA-ROLE-EVENTS (stage A's clause 4, the design's K4 C4: "under KEPT,
    // block 2's pressing role would hold a region target with a goal event and be refused"). The design's d25 probe, run before stage A,
    // measured GA-DIRECTION STILL_NOT_EVALUABLE after realization; clause 4 now refuses first. Nothing is relaxed to reach the later gate.
    assert.deepEqual(block2, ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-ROLE-EVENTS'], block2.join(' | '))
    // And were it realized, nothing would place the goal: in block 2 the team holding the building role is the team the goal's position is
    // stated by AND the team attacking it (the end key), a cycle team-ends refuses, so GA-DIRECTION's opposite-ends clause could only stay
    // unevaluable - the d25 measurement. The end exchange (stage D) is what keeps the pressing role at the end the key names.
    const keptBlock2 = attackingEndOf(endsGame(ownEndOf('ROLE_HOLDER_BUILDING')), index, ROLE_BLOCK_2, 'ROLE_HOLDER_BUILDING')
    assert.deepEqual([keptBlock2.end, /a cycle/.test(keptBlock2.why)], [null, true])
    // Block 1 of the same build is untouched by block 2's refusal: it reaches communication (above).
    assert.ok(reasonsOf(activity, BLOCK_1).every(reason => /^fidelity Q3: |^awaiting approved wording: /.test(reason)))
})

test('no width is a refusal: the goal is centred only on a width the session states', () => {
    const activity = goalBuild({ width: null })
    const block1 = reasonsOf(activity, BLOCK_1)
    assert.deepEqual(block1, [
        'realization refused',
        `c:${P}:TEST-GOAL::O5: "central" needs the element's extent across the axis, and neither a required extent nor a width the session states is given for it`,
    ])
    // A width reaching both touchlines is refused too, never clipped.
    assert.ok(reasonsOf(goalBuild({ width: 30 }), BLOCK_1).some(reason => reason.includes('reaches both touchlines')))
})

test('the zero-depth goal stands only with the register extent row (objectGeometry.extentDimensions goal 1)', () => {
    const load = corpus.loadRegister
    try {
        ;(corpus as any).loadRegister = () => {
            const damaged = load()
            damaged.objectGeometry.extentDimensions.kinds = {}
            return damaged
        }
        // Block 1 is now refused after realization (the activity's stage is block 2's, structure): the goal on the line is an empty object.
        const block1 = reasonsOf(goalBuild(), BLOCK_1)
        assert.ok(block1.includes('a post-realization gate did not validate'), block1.join(' | '))
        assert.ok(block1.some(reason => reason.startsWith('GA-ENVELOPE-FIT — "every region and object is non-empty": FAIL')), block1.join(' | '))
    } finally {
        ;(corpus as any).loadRegister = load
    }
    assert.equal(corpus.loadRegister, load, 'restored')
    assert.ok(reasonsOf(goalBuild(), BLOCK_1).every(reason => !reason.includes('GA-ENVELOPE-FIT')), 'with the row, the goal on the line is no empty object')
})

test('T15 on the full build, GA-DIRECTION reading the object target, and the facing row reaching the game (TEST-ONLY)', () => {
    // A goal placed by a phrase naming a team in prose: realization refuses it (measured before stage B: placed at the far end line in both blocks).
    const phrase = reasonsOf(goalBuild({ along: PHRASE }), BLOCK_1)
    assert.ok(phrase.includes('realization refused') && phrase.some(reason => reason.startsWith(`c:${P}:TEST-GOAL::O4: "${PHRASE}" places the element at an end line of a team the phrase names in prose only`)), phrase.join(' | '))
    // The goal at the end line the building team ATTACKS: the pressing team then attacks the same end as the building team's target, and
    // GA-DIRECTION refuses it after realization (two targets at one end, overlapping) - it reads the object target as it reads a region.
    const sameEnd = reasonsOf(goalBuild({ along: { ...ownEndOf('ROLE_HOLDER_BUILDING'), term: 'attacking end (of team T)' } }), BLOCK_1)
    assert.ok(sameEnd.some(reason => reason.startsWith(`GA-DIRECTION — "the two teams' objectives lie at opposite ends of the axis": FAIL`)), sameEnd.join(' | '))
    assert.ok(sameEnd.some(reason => reason.startsWith(`GA-DIRECTION — "the opposed objectives' targets do not overlap along the axis": FAIL`)), sameEnd.join(' | '))
    // The facing row (O6) reaches the game: a TEST-ONLY facing on the goal is held by its object and is refused as unsaid (Stage G's wording).
    const facing = reasonsOf(goalBuild({ extra: [testItem('TEST-GOAL-FACING', 'O6', 'kind=goal', 'EQUALS', 'INTO_THE_AREA')] }), BLOCK_1)
    assert.ok(facing.includes(`fidelity Q3: ${GOAL}.facing is established by the game and no instruction carries it`), facing.join(' | '))
    // And on a ball it is withdrawn, never a gap: production A01's played object holds an O6 line only as WITHDRAWN.
    const base: any = runStages0to5(derivationInputFor(selectFor('A01', null)) as any)
    const o6 = (base.lines as any[]).filter(line => line.row === 'O6')
    assert.ok(o6.length > 0 && o6.every(line => line.lineState === 'WITHDRAWN'), JSON.stringify(o6))
})

// ── 6. The pairing ──────────────────────────────────────────────────────────────────────────────────────
test('defersWith: the region yields with the objective reference it is paired with, and only with it', () => {
    const relationship: AuthorizingRelationship = { id: 'TEST-ONLY-REL-J2', contextId: 'RPC-001', rows: ['J2'], status: 'CONFIRMED' }
    const deferWith = (team: string, pair: boolean, partnerDefers = true) => {
        const contracts = copy(derivationInputFor(selectFor('A01', null)).contracts as LoadedContract[])
        const gf2 = contracts.find(c => c.contractId === GF2)!
        if (partnerDefers) (gf2.items.find(i => i.itemId === 'GF2-08.f') as any).defersTo = DEFERS_TO_AUTHORIZED_REALIZATION
        if (pair) (gf2.items.find(i => i.itemId === 'GF2-03.e') as any).defersWith = 'GF2-08.f'
        contracts.find(c => c.contractId === P)!.items.push(testItem('TEST-J2', 'J2', `role=PRIMARY_SCORING & team=${team}`, 'EQUALS', { structuralRef: { contractId: P, itemId: 'TEST-GOAL' } }, { authorizedBy: relationship.id }))
        return applyRealizationDeferrals(contracts, [...contextRelationships(), relationship], index)
    }
    const paired = deferWith('TEAM_AT_AXIS_END', true)
    assert.deepEqual(paired.deferred.map(entry => `${entry.contractId}::${entry.item.itemId}`).sort(), [`${GF2}::GF2-03.e`, `${GF2}::GF2-08.f`, `${GF2}::GF2-14.b`].sort())
    const region = paired.deferred.find(entry => entry.item.itemId === 'GF2-03.e')!
    const reference = paired.deferred.find(entry => entry.item.itemId === 'GF2-08.f')!
    assert.deepEqual([region.defersWith, region.deferredTo, region.relationship], ['GF2-08.f', reference.deferredTo, reference.relationship])
    assert.equal(reference.defersWith, undefined, 'the reference defers in its own right')
    const gf2 = paired.contracts.find(c => c.contractId === GF2)!
    assert.ok(!gf2.items.some(i => i.itemId === 'GF2-03.e' || i.itemId === 'GF2-08.f'), 'neither is evaluated')
    assert.ok(['GF2-03.e', 'GF2-08.f'].every(id => gf2.deferredItems!.some(entry => entry.item.itemId === id)), 'both stay visible as the alternative')
    // Keyed to the other end, the reference does not defer, so the region it is paired with stays too: two targets, never three, never one.
    assert.deepEqual(deferWith('TEAM_AT_AXIS_START', true).deferred.map(entry => entry.item.itemId), ['GF2-14.b'])
    // Without the pairing, the region stays while its reference yields (the d25 probe: it is then open and refused at realization).
    assert.deepEqual(deferWith('TEAM_AT_AXIS_END', false).deferred.map(entry => entry.item.itemId).sort(), ['GF2-08.f', 'GF2-14.b'])
    // A pairing whose partner carries no deferral yields with nothing.
    assert.deepEqual(deferWith('TEAM_AT_AXIS_END', true, false).deferred.map(entry => entry.item.itemId), ['GF2-14.b'])
    // Production: nothing carries a pairing, and C56 alone defers.
    assert.deepEqual(applyRealizationDeferrals(copy(derivationInputFor(selectFor('A01', null)).contracts as LoadedContract[]), contextRelationships(), index).deferred.map(e => e.item.itemId), ['GF2-14.b'])
})

test('the restatement loader writes a pairing only beside the deferral it names, in the same contract', () => {
    const contract = (extra: Partial<Record<'a' | 'b', Record<string, unknown>>> = {}): LoadedContract[] => [
        {
            contractId: 'restated:TEST-ONLY',
            objectId: 'TEST-ONLY',
            items: [
                { itemId: 'T-A', row: 'J2', selector: 'team=TEAM_AT_AXIS_END', requirement: 'EQUALS', value: 'TEST-ONLY', strictness: 'REQUIRED', ...(extra.a ?? {}) },
                { itemId: 'T-B', row: 'S3', selector: '*', requirement: 'EQUALS', value: 'zone', strictness: 'REQUIRED', ...(extra.b ?? {}) },
            ] as any,
            declarations: [],
        },
        { contractId: 'restated:TEST-OTHER', objectId: 'TEST-OTHER', items: [{ itemId: 'T-C', row: 'J2', selector: '*', requirement: 'EQUALS', value: 'TEST-ONLY', strictness: 'REQUIRED', defersTo: DEFERS_TO_AUTHORIZED_REALIZATION }] as any, declarations: [] },
    ]
    const ruling = (item: string, set: Record<string, unknown>): ItemRestatement => ({ item: `restated:TEST-ONLY::${item}`, ruling: `TEST-ONLY ${item}`, set, why: 'TEST-ONLY' })
    const apply = (rulings: ItemRestatement[], contracts = contract(), added: any[] = []) => {
        const tally: RestatementTally = { applied: 0, withheld: [], itemsRestated: 0, itemsRemoved: 0, itemsAdded: 0, declarationScopes: 0, declarationsRestated: 0, declarationsAdded: 0, declarationsAddedOnDeclaredRows: 0, notFound: [] }
        const result = applyNoRowRestatement(contracts, tally, rulings, added)
        // The ledger's own rulings name contracts these copies do not hold, and are tallied as not found; only these copies' entries are read.
        return { items: result[0].items as any[], tally: { ...tally, notFound: tally.notFound.filter(entry => entry.startsWith('restated:TEST-ONLY::')) } }
    }
    // A deferral and a pairing ruled together: both written.
    const both = apply([ruling('T-A', { defersTo: DEFERS_TO_AUTHORIZED_REALIZATION }), ruling('T-B', { defersWith: 'T-A' })])
    assert.deepEqual([both.items[0].defersTo, both.items[1].defersWith, both.tally.notFound, both.tally.itemsRestated], [DEFERS_TO_AUTHORIZED_REALIZATION, 'T-A', [], 2])
    // A pairing naming an item with no deferral: the ruling is refused whole (its other fields do not land), named.
    const lone = apply([ruling('T-B', { defersWith: 'T-A', fitNote: 'TEST-ONLY note' })])
    assert.deepEqual([lone.items[1].defersWith, lone.items[1].fitNote, lone.tally.itemsRestated], [undefined, undefined, 0])
    assert.match(lone.tally.notFound[0], /restated:TEST-ONLY::T-B: defersWith names T-A, which carries no AUTHORIZED_REALIZATION deferral \(TEST-ONLY T-B\), so the ruling is not applied/)
    // Naming an item of another contract, or none: refused.
    assert.match(apply([ruling('T-B', { defersWith: 'T-C' })]).tally.notFound[0], /names T-C, which is no other item of its own contract/)
    assert.match(apply([ruling('T-B', { defersWith: ['T-A'] })]).tally.notFound[0], /names no item/)
    // An item deferring in its own right pairs with nothing.
    assert.match(apply([ruling('T-A', { defersTo: DEFERS_TO_AUTHORIZED_REALIZATION, defersWith: 'T-B' })]).tally.notFound[0], /it defers in its own right \(defersTo\), so it pairs with no other item/)
    // An authored pairing that does not stand is named and not honoured; the item keeps everything else it says.
    const authored = apply([], contract({ b: { defersWith: 'T-A' } }))
    assert.deepEqual([authored.items[1].defersWith, authored.items[1].value], [undefined, 'zone'])
    assert.match(authored.tally.notFound[0], /\(as authored\), so the pairing is not honoured/)
    // An added item whose pairing does not stand is not added.
    const added = apply([], contract(), [{ contractId: 'restated:TEST-ONLY', after: 'T-B', ruling: 'TEST-ONLY add', item: { itemId: 'T-D', row: 'S3', selector: '*', requirement: 'EQUALS', value: 'zone', defersWith: 'T-A' }, why: 'TEST-ONLY' }])
    assert.deepEqual([added.items.map(i => i.itemId), added.tally.itemsAdded], [['T-A', 'T-B'], 0])
    assert.match(added.tally.notFound[0], /T-D: defersWith names T-A, which carries no AUTHORIZED_REALIZATION deferral, so the item is not added/)
    assert.equal(pairingRefusal('x', { itemId: 'x', defersWith: 'y' } as any, [{ itemId: 'y', defersTo: DEFERS_TO_AUTHORIZED_REALIZATION } as any]), null)
    // Production: no ruling writes a pairing, and none is refused.
    assert.ok(!restatementTally.notFound.some(entry => entry.includes('defersWith') || entry.includes('pairing')), restatementTally.notFound.join(' | '))
})

// ── 7. The provisional loader ───────────────────────────────────────────────────────────────────────────
test('the provisional loader refuses a placeholder extent for an object, a supersession and a pairing; production loads unchanged', () => {
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    assert.deepEqual(validateProvisionalRealizations(file), [], 'production')
    const withItem = (item: Record<string, unknown>) => {
        const damaged = copy(file)
        const model = damaged.realizations[0].items.find((i: any) => i.id === 'A01-R1-B8-2')
        damaged.realizations[0].items.push({ ...copy(model), id: 'A01-R1-TEST-ONLY', ...item })
        return validateProvisionalRealizations(damaged).filter(error => error.includes('A01-R1-TEST-ONLY'))
    }
    assert.match(withItem({ row: 'O5', selector: 'kind=goal', value: { from: 12.5, to: 17.5 } })[0] ?? '', /writes an object's extent on O5 in metres \(\{"from":12\.5,"to":17\.5\}\) with no stated source/)
    assert.match(withItem({ row: 'O5', selector: 'kind=goal', value: 5 })[0] ?? '', /writes an object's extent on O5 in metres/)
    assert.match(withItem({ row: 'O4', selector: 'kind=goal', value: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 1 } } })[0] ?? '', /gives an object on O4 a depth of 1 m from a team's end line with no stated source/)
    assert.deepEqual(withItem({ row: 'O4', selector: 'kind=goal', value: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 0 } } }), [], 'a position on the line is no extent')
    assert.deepEqual(withItem({ row: 'O5', selector: 'kind=goal', value: { term: 'central', asAuthored: 'TEST-ONLY' } }), [], "the session's width is a stated source")
    assert.deepEqual(withItem({ row: 'S5', selector: 'noun=line', value: { from: 0, to: 1 } }), [], 'a region is not an object')
    for (const key of ['defersTo', 'defersWith']) assert.match(withItem({ [key]: 'TEST-ONLY' })[0] ?? '', /carries a supersession or a pairing \(defersTo, defersWith\), which only a ruled restatement writes/, key)
})

// ── 8. The diagram: D7 with an object target ────────────────────────────────────────────────────────────
test('D7 with an object target: the arrow toward the end the object touches, read typed; moved, it is refused (TEST-ONLY)', () => {
    const request = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: sessionOf() }
    const activity = buildActivityForReview(request as any, { includeDrafts: true }) as ServedActivity
    const fixture: any = buildActivityWithFixture(request as any).fixture
    const games = (fixture.roleBlocks.blocks as any[]).map(block => ({ blockId: block.blockId, holders: { ...block.fixture.record.roleBlock.holders }, fixture: block.fixture, rendered: renderConcreteGame(block.fixture).instructions }))
    const input: DiagramInput = { session: activity.session, games, served: activity.rendered.instructions, roleBlocks: activity.roleBlocks!.blocks.map(b => ({ blockId: b.blockId, holders: { ...b.holders } })), index }
    // Each block's pressing objective re-pointed at a TEST-ONLY goal standing, with no depth, on the end line its zone touched.
    const withGoal = (atOppositeEnd: boolean): DiagramInput => {
        const altered: DiagramInput = { ...copy({ ...input, index: null }), index }
        for (const game of altered.games) {
            const pressing = objectivesOf(game as any, index).find(o => o.role === 'PRESSING')!
            const zone = game.fixture.status.geometry.find((g: any) => g.path === `space.regions[${pressing.regionId}].position.along`).geometry.interval
            const touched = zone.from === 0 ? 0 : 40
            const end = atOppositeEnd ? 40 - touched : touched
            const id = `c:TEST-ONLY:GOAL-${game.blockId}`
            game.fixture.game.objects.push({ elementId: id, kind: 'goal', position: { along: 'TEST-ONLY', across: 'TEST-ONLY' } })
            game.fixture.status.geometry.push({ path: `objects[${id}].position.along`, geometry: { axis: 'along', interval: { from: end, to: end } } })
            game.fixture.status.geometry.push({ path: `objects[${id}].position.across`, geometry: { axis: 'across', interval: { from: 12.5, to: 17.5 } } })
            game.fixture.game.objectives.find((o: any) => o.elementId === pressing.elementId).reference.structuralRef = { contractId: 'TEST-ONLY', itemId: `GOAL-${game.blockId}` }
            const sentence = { section: 'Set up' as const, text: 'Place a TEST-ONLY goal on the end line', status: 'DERIVED' as const, from: [`objects[${id}].kind`, `objects[${id}].position.along`, `objects[${id}].position.across`], quantities: [] }
            game.rendered.push(sentence)
            altered.served.push(sentence)
        }
        return altered
    }
    const goal = withGoal(false)
    for (const game of goal.games) assert.equal(objectivesOf(game as any, index).find(o => o.role === 'PRESSING')!.target!.kind, 'object', 'the one reader says it is an object')
    const draft = fieldDiagramDraftOf(goal)
    assert.equal(draft.verdict, 'DRAWN', JSON.stringify(draft.findings, null, 1))
    const production = fieldDiagramDraftOf(input).diagram!
    for (const [n, block] of draft.diagram!.blocks.entries()) {
        const target = block.targets.find(t => t.region.startsWith('c:TEST-ONLY:GOAL-'))!
        // An object target is no marked line and carries no zone word, even with no depth: what it is, its object says (Stage G's words).
        assert.deepEqual([target.line, target.label, target.markedZone, target.along.from === target.along.to], [false, null, null, true])
        assert.deepEqual(block.teams.map(team => team.attacks.map(a => a.end)), production.blocks[n].teams.map(team => team.attacks.map(a => a.end)), 'the same attacking ends')
    }
    assert.ok(!draft.findings.some(f => f.rule === 'D7'))
    // The check reads the object again from the game: the goal moved to the other end line, the drawn arrow no longer points to it.
    const findings = checkFieldDiagram(draft.diagram!, withGoal(true))
    assert.ok(findings.some(f => f.rule === 'D7' && /arrow points to the end at \d+ m, and its target touches the end at \d+ m/.test(f.what)), JSON.stringify(findings, null, 1))
})

console.log(`object-targets.unit.ts — ${passed} passed`)
