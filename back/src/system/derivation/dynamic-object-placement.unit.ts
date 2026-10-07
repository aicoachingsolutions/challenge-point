/**
 * **A dynamic object exists without a static layout position — and a CONDITIONAL line can no longer vanish.**
 * His two rulings of 5 October, in the order he sequenced them.
 *
 *   > *A dynamic game object may exist without a fixed layout position when its location is state-dependent. A
 *   > fixed layout position is required only when authoritative knowledge establishes one as part of the game
 *   > setup. Placement associated with a restart or transition belongs to the existing transition-placement
 *   > mechanism rather than the object's static layout position.*
 *
 *   > *Before applying it, close the hazard you identified: a CONDITIONAL line must not disappear silently from
 *   > DERIVED / OPEN / NOT_ESTABLISHED reporting ... so CONDITIONAL remains visible and cannot silently satisfy
 *   > closure.*
 *
 * **The hazard was real and the register had already promised it would not happen.** `selectorGrammar` says:
 * *"Where the selector does not fix the attribute the condition is UNDECIDABLE and the line is KEPT, so an
 * applicability rule can never hide a real gap."* The line was kept — and then `resolved-game.ts` dropped every
 * CONDITIONAL entry from all three lists, so it was kept and invisible. That is the seventh construct found this
 * week that is registered and not enforced, and the first where the register itself stated the guarantee.
 *
 * The visibility fix is tested here against a FORCED conditional, not against the corpus, because the corpus
 * produces none — a fix whose only evidence is "nothing changed" is not evidence.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { corpusInput, loadCorpusContracts, loadRegister } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { derivationInputFor, selectFor } from './run-bounded-selection'

let passed = 0
const test = (name: string, fn: () => void) => {
    try {
        fn()
        passed++
        console.log(`  ok  ${name}`)
    } catch (error) {
        console.log(`  FAIL ${name}: ${(error as Error).message}`)
        process.exitCode = 1
    }
}

const resolve = (input: any) => {
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    return { result, staged, game: assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts) as any }
}
const lineState = (result: any, suffix: string) =>
    (result.resolution ?? []).filter((e: any) => e.lineId.endsWith(suffix)).map((e: any) => ({ lineId: e.lineId, lineState: e.lineState }))

const item = (o: any) => ({
    itemId: 'I', row: 'O1', selector: 'kind=gate', requirement: 'EXISTS', value: 'v', strictness: 'REQUIRED',
    valueStatus: 'N/A', scope: 'WHOLE_GAME', basis: 'AUTHORED', basisEvidence: { quote: 'q', sourceId: 'S' },
    checkability: 'STRUCTURAL', ...o,
})
const contract = (items: any[]) => ({ contractId: 'C-1', objectId: 'O-1', knowledgeVersion: '1', items, declarations: [] })
const input = (contracts: any[]) => ({
    selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: '1' })),
    contracts,
    envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
    register: loadRegister(),
    derivationRules: { version: 'rev-5' },
})

// ── THE REGISTER ENTRY SAYS WHAT HE RULED ──────────────────────────────────────────────────────────
test('the applicability entry names the DYNAMIC kind, not the static ones', () => {
    const register: any = loadRegister()
    for (const row of ['O4', 'O5']) {
        const entry = register.applicability[row]
        assert.ok(entry, `${row} must carry an applicability entry`)
        assert.equal(entry.when.selectorAttribute, 'kind', 'conditioned on the element’s own kind')
        assert.deepEqual(entry.when.notIn, ['ball'], `${row} must disqualify exactly the ball`)
        assert.equal(entry.when.in, undefined, 'and must not use a positive list — see the polarity test below')
    }
})

/**
 * **The polarity matters more than the list, and a positive list got it backwards.**
 *
 * This mechanism's own rule, stated in `selector.ts` and again in `derive.ts`, is that an applicability condition
 * "may only ever *remove* a line it can positively disqualify". A positive list over `kind` cannot obey that,
 * because `kind` is open-ended: anything unenumerated is positively disqualified and silently loses its layout
 * position. That is not hypothetical — the first version of this entry enumerated the static kinds, and an object
 * selected `kind=goalA` in an existing test lost its authored position, which is how it was caught.
 */
test('an UNENUMERATED kind keeps its layout position — static is the default, dynamic is the exception', () => {
    const mk = (kind: string) => [
        item({ itemId: 'O-1', row: 'O1', selector: `kind=${kind}` }),
        item({ itemId: 'O-2', row: 'O4', selector: `kind=${kind}`, requirement: 'EQUALS', value: { axis: 'along', lo: 0, hi: 5 }, valueStatus: 'REQUIRED_RANGE' }),
    ]
    const stateOf = (kind: string) => {
        const { result } = resolve(input([contract(mk(kind))]))
        return lineState(result, '::O4')[0]?.lineState
    }
    assert.equal(stateOf('goalA'), 'ENUMERATED', 'a kind nobody enumerated is static by default, and keeps its position')
    assert.equal(stateOf('gate'), 'ENUMERATED', 'as does a registered static kind')
    assert.equal(stateOf('ball'), 'WITHDRAWN', 'and only the kind the rule names is withdrawn')
})

test('the negative form is validated: in and notIn are alternatives, and notIn needs a selector attribute', () => {
    const base: any = loadRegister()
    const withEntry = (when: any) => {
        const r = JSON.parse(JSON.stringify(base))
        r.applicability.O4 = { when, text: 'test only' }
        return () => indexRegister(r)
    }
    assert.throws(withEntry({ selectorAttribute: 'kind', sameElement: true, in: ['goal'], notIn: ['ball'] }), /both in and notIn/)
    assert.throws(withEntry({ row: 'O2', sameElement: true, notIn: ['ball'] }), /notIn on a governing row/)
    assert.throws(withEntry({ selectorAttribute: 'kind', sameElement: true }), /no usable condition/)
})

// ── HIS COUNTERFACTUAL, on real authored knowledge ─────────────────────────────────────────────────
test('an AUTHORED ball exists, carries no static position, and opens no realization freedom', () => {
    const { result, game } = resolve(derivationInputFor(selectFor('A01', 'A01-02')))
    const ball = (game.game.objects ?? []).find((o: any) => o.kind === 'ball')
    assert.ok(ball, 'the ball his knowledge authors must be in the game')
    assert.equal(ball.position, undefined, 'and must carry no static layout position')

    for (const { lineId, lineState: ls } of [...lineState(result, '::O4'), ...lineState(result, '::O5')]) {
        assert.equal(ls, 'WITHDRAWN', `${lineId} must be withdrawn, not a gap and not a choice`)
    }
    assert.deepEqual(
        game.open.filter((o: any) => /objects/.test(o.path)).map((o: any) => o.lineId),
        [],
        'no false realization freedom: nothing may demand a position nobody authored',
    )
})

test('and the trigger that needs the ball becomes reachable because the ball exists', () => {
    const { staged } = resolve(derivationInputFor(selectFor('A01', 'A01-02')))
    assert.ok(staged.triggers.includes('POSSESSION_CHANGE'), 'possession needs a ball, and this game has one')
})

test('a STATIC object keeps its layout position — the rule is about state-dependence, not about objects', () => {
    const { result, game } = resolve(corpusInput())
    const target = lineState(result, '::O4').find(l => /GF4:I02/.test(l.lineId))
    assert.ok(target, 'GF4 authors a goal/target object')
    assert.equal(target!.lineState, 'ENUMERATED', 'a static target still has a layout position to settle')
    assert.ok(
        game.open.some((o: any) => /GF4:I02::O4/.test(o.lineId)),
        'and it is still offered as a choice, so the rule has not disabled placement generally',
    )
})

/**
 * **A04 is now the rule's best subject rather than a bystander.**
 *
 * This asserted that A04 had no object at all, which was true while nothing established a ball for it and which
 * made it evidence of nothing. The Sport Profile of 6 October gives it one, so the ruling can be checked where
 * it matters most: on the goal that actually reaches realization. A ball exists, both of its layout-position
 * rows are WITHDRAWN by the applicability entry, and no realization freedom is offered for them — so the
 * position question is not deferred or defaulted, it is absent, which is what "its location is state-dependent"
 * has to mean in the artifact.
 */
test('A04 establishes a ball, and the ball raises no position question at all', () => {
    const { result, game } = resolve(derivationInputFor(selectFor('A04', null)))
    const objects = game.game.objects ?? []
    assert.equal(objects.length, 1, 'exactly the ball the Sport Profile establishes')
    assert.equal(objects[0].kind, 'ball')
    assert.ok(!('position' in objects[0]), 'and it holds no position')

    const positionLines = [...lineState(result, '::O4'), ...lineState(result, '::O5')]
    assert.ok(positionLines.length > 0, 'the rows are reached — an absent line would prove nothing about withdrawal')
    assert.deepEqual(
        positionLines.filter(l => l.lineState !== 'WITHDRAWN'),
        [],
        'every ball position line is WITHDRAWN, not open and not failed',
    )
    assert.deepEqual(
        game.open.filter((o: any) => /objects/.test(o.path)).map((o: any) => o.lineId),
        [],
        'and nothing is offered as a choice, so no position can be invented to close the game',
    )
})

// ── THE HAZARD, FORCED — because the corpus produces no conditional line to observe ────────────────
/**
 * `selectorApplies` returns `null` when a selector STRADDLES the applicability list — some of its values inside
 * and some outside — because identity does not decide it. That is the only route to a surviving CONDITIONAL
 * line, and the corpus has none now that `target` is in the list. Forcing one is the only way to prove the
 * visibility fix does anything at all.
 */
function forcedConditional() {
    const register: any = JSON.parse(JSON.stringify(loadRegister()))
    // Narrow the list so GF4's `kind ∈ {goal, target}` straddles it: `goal` inside, `target` outside.
    register.applicability.O4 = { when: { selectorAttribute: 'kind', sameElement: true, in: ['goal'] }, text: 'forced straddle (test only)' }
    register.applicability.O5 = { when: { selectorAttribute: 'kind', sameElement: true, in: ['goal'] }, text: 'forced straddle (test only)' }
    return { selection: [], contracts: loadCorpusContracts(), envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 }, register, derivationRules: { version: 'rev-5' } }
}

test('a straddling selector really does produce a CONDITIONAL line — the fix has a subject', () => {
    const { result } = resolve(forcedConditional())
    const conditional = (result.resolution ?? []).filter((e: any) => e.lineState === 'CONDITIONAL')
    assert.ok(conditional.length >= 2, `the straddle must leave the line conditional; got ${conditional.length}`)
    assert.ok(conditional.every((e: any) => /::O[45]$/.test(e.lineId)), 'and it is the position rows')
})

test('a CONDITIONAL line is REPORTED as not established, not dropped from all three lists', () => {
    const { result, game } = resolve(forcedConditional())
    const conditional = (result.resolution ?? []).filter((e: any) => e.lineState === 'CONDITIONAL')
    for (const entry of conditional) {
        const reported = game.notEstablished.find((n: any) => n.lineId === entry.lineId)
        assert.ok(reported, `${entry.lineId} vanished: it is in neither derived, open, nor notEstablished`)
        assert.match(String(reported.reason), /applicability unresolved/, 'and it says WHY it is unresolved')
    }
})

test('and it is not offered as a choice either, so nothing can close it by accident', () => {
    const { result, game } = resolve(forcedConditional())
    const conditional = (result.resolution ?? []).filter((e: any) => e.lineState === 'CONDITIONAL').map((e: any) => e.lineId)
    for (const lineId of conditional) {
        assert.ok(!game.open.some((o: any) => o.lineId === lineId), `${lineId} must not be an authorized choice while its applicability is undecided`)
    }
})

/** WITHDRAWN is the opposite case and must stay silent: its condition is FALSE, so nothing is owed. */
test('WITHDRAWN stays silent — the fix distinguishes the two states rather than reporting both', () => {
    const { result, game } = resolve(corpusInput())
    const withdrawn = (result.resolution ?? []).filter((e: any) => e.lineState === 'WITHDRAWN')
    assert.ok(withdrawn.length > 0, 'the corpus relies on withdrawal; without it this proves nothing')
    for (const entry of withdrawn) {
        assert.ok(!game.notEstablished.some((n: any) => n.lineId === entry.lineId), `${entry.lineId} is withdrawn, so it owes nothing and must not be reported as a gap`)
        assert.ok(!game.open.some((o: any) => o.lineId === entry.lineId), 'nor offered as a choice')
    }
})

// ── OPPOSING TEAMS, not "at least one team" ────────────────────────────────────────────────────────
/**
 * His ruling: align the possession-change prerequisite with opposing teams. The test that matters is that
 * counting team CLASSES was wrong — A04 has ONE class establishing two teams, and A01 with its situation has
 * TWO classes claiming the same two teams. So the question is asked of the established cardinality.
 */
test('a team class establishing only ONE team does not make a possession change reachable', () => {
    const register = loadRegister()
    const mk = (o: any) => ({
        itemId: 'I', row: 'T1', selector: 'trigger=START', requirement: 'EXISTS', value: 'v', strictness: 'REQUIRED',
        valueStatus: 'N/A', scope: 'WHOLE_GAME', basis: 'AUTHORED', basisEvidence: { quote: 'q', sourceId: 'S' }, checkability: 'STRUCTURAL', ...o,
    })
    const build = (teamValue: string) => ({
        selection: [{ objectId: 'O-1', knowledgeVersion: '1' }],
        contracts: [
            {
                contractId: 'C-1', objectId: 'O-1', knowledgeVersion: '1', declarations: [],
                items: [
                    mk({ itemId: 'T-A', selector: 'trigger=POSSESSION_CHANGE' }),
                    mk({ itemId: 'P-1', row: 'P1', selector: 'team=ATTACKING_TEAM', requirement: 'COUNT', value: teamValue, valueStatus: 'REQUIRED_RANGE' }),
                    mk({ itemId: 'O-B', row: 'O1', selector: 'kind=ball', requirement: 'COUNT', value: '1', valueStatus: 'REQUIRED_RANGE' }),
                ],
            },
        ],
        envelope: { players: 12, lengthM: 40, widthM: 30, durationMin: 20 },
        register,
        derivationRules: { version: 'rev-5' },
    })
    const one: any = runStages0to10(build('1') as any)
    const two: any = runStages0to10(build('2') as any)
    assert.ok(!one.triggers.includes('POSSESSION_CHANGE'), 'one team and a ball is not a possession change')
    assert.ok(two.triggers.includes('POSSESSION_CHANGE'), 'two teams and a ball is')
})

test('and the real cases still work: one class establishing two teams is enough', () => {
    const { staged } = resolve(derivationInputFor(selectFor('A01', 'A01-02')))
    const p1 = staged.classes.filter((c: any) => c.row === 'P1')
    assert.ok(
        p1.some((c: any) => (c.cardinality?.min ?? 0) >= 2),
        'the prerequisite is read off the established cardinality, not off how many contracts mention teams',
    )
    assert.ok(staged.triggers.includes('POSSESSION_CHANGE'))
})

console.log(`dynamic-object-placement: ${passed} passed`)
