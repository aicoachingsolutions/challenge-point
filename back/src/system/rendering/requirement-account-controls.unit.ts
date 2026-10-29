/**
 * **The requirement account's controls: what it shows when a component, a value or a referent is missing** — 29 October 2026 (the
 * specification's T6, T7 and T12 with the reviews' corrections: the R-engine review's S1, S2, S3 and S7; the R-rulings review's M1 and M2).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Missing components of approved scoring conditions should not silently pass."* and
 * *"accounting for each component of a scoring condition rather than simply confirming that the condition exists"*. Every control below is a
 * TEST-ONLY change — to a copy of the contracts, matched by register row and selector and never by id, or to a copy of the finished game the
 * account read — and none is knowledge:
 *   - S3: each condition the production context constitutes, removed in turn, in both versions: either the build stops before realization
 *     (no account, the stage pinned) or the account names exactly that component missing; none is ever served with it missing and unnamed;
 *     and, report only, the administrator's build stops where the coach's does, with the same summary and reasons (T12);
 *   - M1: a value blanked in the finished game, and a referent that is not the progression outcome's, each make their component 4;
 *   - M2: a turnover that no longer begins a new episode makes the episode-ends-on-loss part 4 (read on the finished game; the same change
 *     made in the knowledge stops the build at structure);
 *   - S2: the start's element removed leaves the start unrepresented, whatever else its item reaches;
 *   - S1: an exclusion over a row the game populates is not vacuous;
 *   - S7: an item in a constraint's contract is considered, named so, never counted;
 *   - T7: the TEST-ONLY RPC-003 draft, merged with the production bindings, the origin withheld: origin missing, the rest on DRAFT knowledge.
 *
 * The guard's assertions in S3 are a CHARACTERIZATION of today's gap (the guard does not catch a removed component; the build stops only at
 * communication, for want of approved wording): they are to be inverted if he enables refusal on a missing component.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/requirement-account-controls.unit.ts
 */
import assert from 'node:assert/strict'

import { loadSportBoundRegions } from '../derivation/corpus'
import { LawsMateriality } from '../derivation/default-laws'
import { loadDraftRequirementBindings, loadDraftStore, loadLawsMateriality, mergeRequirementBindings } from '../derivation/draft-store'
import { knowledgeKey } from '../derivation/knowledge-key'
import { CONDITION_ROW } from '../derivation/resolved-game'
import { DRAFT_KNOWLEDGE, LoadedContract } from '../derivation/types'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { CONDITION_TYPE_PREFIX, constitutedConditionTypes } from './context-scoring-guard'
import { blockRequirementAccountOf, BlockRequirementInputs, requirementAccountOf } from './requirement-account'
import { loadRequirementBindings, productionContextContract, productionContractedContexts, RequirementBindings } from './requirement-bindings'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    quiet(`  ok  ${name}`)
}
const silently = <T>(run: () => T): T => {
    const before = console.log
    console.log = () => undefined
    try {
        return run()
    } finally {
        console.log = before
    }
}
quiet("the requirement account's controls (report only)")

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const FA = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === 'FA-MINI-SOCCER-5V5-2026')!
const VERSIONS = [
    ['zone', { goal: { count: 0 } }],
    ['goal', { goal: { count: 1, type: FA.object.type!, widthM: FA.object.widthM } }],
] as const
const session = (objects: unknown) => ({ players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: 1 }, objects: copy(objects) as any })
const records = learningGoalAuthorizations()
const [CONTEXT] = productionContractedContexts()
const BEFORE_REALIZATION = ['session', 'selection', 'knowledge', 'structure', 'realization']
const bindings = loadRequirementBindings()

// ── S3 and T12: each constituted condition removed, in both versions ────────────────────────────────────────────────────────────────────
test('S3/T12: each condition the context constitutes, removed (by row and selector): stopped before realization with no account, or named missing; never served unnamed; report only', () => {
    const types = constitutedConditionTypes(productionContextContract(CONTEXT)!).map(entry => entry.type)
    assert.ok(types.length >= 1, 'the production context constitutes conditions')
    const outcomes: string[] = []
    for (const type of types) {
        // Every item of the context's contract on the conditions row and its two fields with this type's selector: matched by row and selector only.
        const fields = [CONDITION_ROW, 'V5', 'V6']
        const remove = (contracts: LoadedContract[]) => {
            for (const contract of contracts) if (knowledgeKey(contract.contractId) === knowledgeKey(CONTEXT)) contract.items = contract.items.filter(item => !(fields.includes(String(item.row)) && String(item.selector ?? '') === `${CONDITION_TYPE_PREFIX}${type}`))
        }
        for (const [label, objects] of VERSIONS) {
            const request = { kind: 'learning-goal' as const, goalId: 'A01', session: session(objects) }
            const asAdministrator = silently(() => buildActivityUnderAuthorizationRecords(request, records, { alter: remove, review: { includeDrafts: true } }).activity)
            const asCoach = silently(() => buildActivityUnderAuthorizationRecords(request, records, { alter: remove }).activity)
            const where = `${type} removed, ${label}`
            // T12: report only. The administrator's build stops where the coach's does, saying the same.
            assert.equal(asAdministrator.outcome, asCoach.outcome, where)
            if (asAdministrator.outcome === 'refused') {
                const coachRefusal = asCoach as RefusedActivity
                assert.deepEqual([asAdministrator.stage, asAdministrator.summary, asAdministrator.reasons], [coachRefusal.stage, coachRefusal.summary, coachRefusal.reasons], `${where}: the account refuses nothing`)
            }
            assert.ok(!('requirementAccount' in asCoach), `${where}: the coach's build carries none`)
            const account = asAdministrator.requirementAccount
            if (!account) {
                assert.equal(asAdministrator.outcome, 'refused', `${where}: no account only where the build stopped before realization`)
                assert.ok(BEFORE_REALIZATION.includes((asAdministrator as RefusedActivity).stage), `${where}: ${(asAdministrator as RefusedActivity).stage}`)
                outcomes.push(`${type}/${label}: ${(asAdministrator as RefusedActivity).stage}, no account`)
                continue
            }
            const scoring = account.summary.scoringCondition!
            assert.deepEqual(scoring.missing.map(entry => [entry.component, entry.cause.kind]), [[type, 'NOT_CARRIED']], `${where}: exactly that component is named missing`)
            for (const other of scoring.components.filter(entry => entry.component !== type)) assert.notEqual(other.account, 4, `${where}: ${other.component} still carried`)
            assert.equal(account.summary.scoringConditionCarried, false, where)
            assert.ok(account.summary.headline.startsWith('Missing from the approved scoring condition: '), account.summary.headline)
            // CHARACTERIZATION of today's gap, to be inverted if he enables this refusal: the guard names nothing, and the build stops later.
            const refusal = asAdministrator as RefusedActivity
            assert.equal(asAdministrator.outcome, 'refused', `${where}: not served (today, for want of approved wording)`)
            assert.notEqual(refusal.stage, 'validation', `${where}: the guard did not catch it`)
            assert.ok(!refusal.reasons.some(reason => reason.includes(`${type} condition`)), `${where}: no reason names the ${type} condition`)
            outcomes.push(`${type}/${label}: ${refusal.stage}, ${type} missing`)
        }
    }
    // The measured outcomes, pinned: the origin's removal stops the build at structure; each other component's reaches communication, named.
    assert.deepEqual(outcomes, [
        'origin/zone: structure, no account',
        'origin/goal: structure, no account',
        'progression/zone: communication, progression missing',
        'progression/goal: communication, progression missing',
        'control/zone: communication, control missing',
        'control/goal: communication, control missing',
        'exclusion/zone: communication, exclusion missing',
        'exclusion/goal: communication, exclusion missing',
    ])
})

// ── The inputs the account read, for the controls on the finished game ──────────────────────────────────────────────────────────────────
const observed: BlockRequirementInputs[] = []
const zone = silently(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: session(VERSIONS[0][1]) }, records, { review: { includeDrafts: true }, observeRequirementInputs: inputs => observed.push(inputs) }).activity) as ServedActivity
const conditionsOf = (game: any): any[] => game.value.primaryEvent.conditions
const triggerOf = (transition: any) => (transition.selector ?? []).find((term: any) => term.attribute === 'trigger')?.value
/** The account of the first block, read again over a TEST-ONLY copy of its finished game (and, where given, of its contracts and bindings). */
const reread = (change: (game: any, contracts: LoadedContract[]) => void, given: RequirementBindings = bindings, extra: Partial<BlockRequirementInputs> = {}) => {
    const inputs = observed[0]
    const game = copy(inputs.game)
    const contracts = copy(inputs.contracts)
    change(game, contracts)
    return blockRequirementAccountOf({ ...inputs, game, contracts, bindings: given, ...extra })
}
const partIn = (account: ReturnType<typeof reread>, partId: string) => account.parts.find(entry => entry.partId === partId)!

test('the observed inputs are exactly what the build accounted: re-read unchanged, the same block account', () => {
    assert.equal(zone.outcome, 'served')
    assert.equal(observed.length, 2, 'one per role block')
    // Each block re-read gives the merged parts with that block's account; the served account carries no block part apart (none differs).
    const account = zone.requirementAccount!
    for (const [at, inputs] of observed.entries()) {
        const again = blockRequirementAccountOf(inputs)
        assert.deepEqual(again.parts, account.parts.map(({ perBlock, ...merged }) => ({ ...merged, account: perBlock.find(entry => entry.blockId === again.blockId)!.account })))
        assert.deepEqual([account.blocks[at].blockId, account.blocks[at].parts, account.blocks[at].partsIdenticalToMerged], [again.blockId, [], again.parts.length])
    }
})

// ── M1 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('M1: a value blanked in the finished game makes its component 4; presence of the element is not enough', () => {
    const account = reread(game => {
        delete conditionsOf(game).find(condition => condition.type === 'control').value
    })
    const control = partIn(account, 'control')
    assert.equal(control.account, 4)
    const value = control.facets.find(entry => entry.facetId === 'value')!
    assert.deepEqual([value.account, value.carriers.length], [4, 0])
    assert.ok(value.considered[0].why.includes('authored "controlled on arrival"; the finished game holds nothing'), JSON.stringify(value.considered))
    assert.equal(partIn(account, 'progression').account, 1, 'the others are untouched')
    const activity = requirementAccountOf({ contextId: CONTEXT, outcome: 'served', bindings, refused: null, blocks: [{ blockId: account.blockId, account }], draftContract: false })
    assert.deepEqual(activity.summary.scoringCondition!.missing.map(entry => entry.component), ['control'])
})

test('M1: a referent that is not the progression outcome\'s makes the exclusion 4 — by its pin (R1 S2), and, with the pin set aside, by NOT_THE_SAME_REFERENT with his words why', () => {
    const elsewhere = { objectiveReferenceOf: 'SCORING_TEAM', role: 'SECONDARY_SCORING', asAuthored: 'TEST-ONLY: not the progression outcome' }
    const change = (game: any, contracts: LoadedContract[]) => {
        conditionsOf(game).find(condition => condition.type === 'exclusion').referents = copy(elsewhere)
        for (const contract of contracts) for (const item of contract.items) if (String(item.row) === 'V5' && item.selector === `${CONDITION_TYPE_PREFIX}exclusion`) item.value = copy(elsewhere)
    }
    // The production bindings pin the referent his knowledge carries: the changed one is not counted.
    const pinned = partIn(reread(change), 'exclusion')
    assert.deepEqual([pinned.account, pinned.cause!.kind, pinned.sameReferent!.evaluated], [4, 'NOT_CARRIED', false])
    assert.ok(pinned.facets.find(entry => entry.facetId === 'referents')!.considered[0].why.some(why => why.startsWith('its value is {"objectiveReferenceOf":"SCORING_TEAM","role":"SECONDARY_SCORING"')), JSON.stringify(pinned.facets))
    // A TEST-ONLY copy of the bindings without that pin: the referent is then compared with the progression outcome's.
    const unpinned: RequirementBindings = copy(bindings)
    delete unpinned.contexts[0].rows.find(row => row.rowId === 'RPC-PROP-132')!.parts.find(entry => entry.id === 'exclusion')!.facets!.find(entry => entry.id === 'referents')!.value
    const account = reread(change, unpinned)
    const exclusion = partIn(account, 'exclusion')
    assert.deepEqual([exclusion.account, exclusion.cause!.kind, exclusion.sameReferent!.holds], [4, 'NOT_THE_SAME_REFERENT', false])
    assert.ok(exclusion.cause!.detail.includes('is not the referent of the progression component'), exclusion.cause!.detail)
    assert.ok(exclusion.cause!.detail.includes('His reply filed 16 October 2026, item 9, point 2'), exclusion.cause!.detail)
    assert.equal(partIn(account, 'control').account, 1, 'control stays on the progression outcome')
})

test('R1 S2: a component value or scope changed in the knowledge and the finished game alike reads 4: the pins hold his approved knowledge', () => {
    // The control value changed in the contract and the finished game together.
    const value = reread((game, contracts) => {
        conditionsOf(game).find(condition => condition.type === 'control').value = 'TEST-ONLY anything'
        for (const contract of contracts) for (const item of contract.items) if (String(item.row) === 'V6' && item.selector === `${CONDITION_TYPE_PREFIX}control`) item.value = 'TEST-ONLY anything'
    })
    assert.equal(partIn(value, 'control').account, 4)
    assert.ok(partIn(value, 'control').facets[1].considered[0].why.includes('its value is "TEST-ONLY anything"; this facet asks "controlled on arrival"'), JSON.stringify(partIn(value, 'control').facets[1]))
    // Progression "beyond" made "before".
    const before = reread((game, contracts) => {
        conditionsOf(game).find(condition => condition.type === 'progression').value = 'before'
        for (const contract of contracts) for (const item of contract.items) if (String(item.row) === 'V6' && item.selector === `${CONDITION_TYPE_PREFIX}progression`) item.value = 'before'
    })
    assert.equal(partIn(before, 'progression').account, 4)
    // The origin condition's scope widened to the whole game, against his "Build-out condition applies only to build-out episodes: Approved."
    const scope = reread((game, contracts) => {
        conditionsOf(game).find(condition => condition.type === 'origin').scope = 'WHOLE_GAME'
        for (const contract of contracts) for (const item of contract.items) if (['V3', 'V5'].includes(String(item.row)) && item.selector === `${CONDITION_TYPE_PREFIX}origin`) item.scope = 'WHOLE_GAME'
    })
    assert.equal(partIn(scope, 'origin').account, 4)
    assert.ok(partIn(scope, 'origin').facets[0].considered[0].why.includes('its scope is WHOLE_GAME; this facet asks BUILD_OUT_EPISODE'), JSON.stringify(partIn(scope, 'origin').facets[0]))
    // The round-2 recheck's N1 (29 October 2026): the control value widened into a list that still holds the approved member, in the contract
    // and the finished game alike, is a different value; a pin is compared exactly (`samePinnedValue`), never by membership.
    const widened = reread((game, contracts) => {
        const condition = conditionsOf(game).find(entry => entry.type === 'control')
        condition.value = [condition.value, 'TEST-ONLY anything']
        for (const contract of contracts) for (const item of contract.items) if (String(item.row) === 'V6' && item.selector === `${CONDITION_TYPE_PREFIX}control`) item.value = [item.value, 'TEST-ONLY anything']
    })
    assert.equal(partIn(widened, 'control').account, 4)
    for (const account of [value, before, scope, widened]) {
        const activity = requirementAccountOf({ contextId: CONTEXT, outcome: 'served', bindings, refused: null, blocks: [{ blockId: account.blockId, account }], draftContract: false })
        assert.equal(activity.summary.scoringConditionCarried, false)
    }
})

// ── M2 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('M2: a turnover that no longer begins a new episode makes episode-ends-on-loss 4, so the origin is named missing; the same change in the knowledge stops the build at structure', () => {
    const account = reread(game => {
        for (const transition of game.transitions) if (triggerOf(transition) === 'POSSESSION_CHANGE') transition.startsEpisode = 'false'
    })
    const loss = partIn(account, 'episode-ends-on-loss')
    assert.equal(loss.account, 4)
    assert.ok(loss.facets[0].considered.some(entry => entry.why.includes('authored "true"; the finished game holds "false"')), JSON.stringify(loss.facets[0].considered))
    assert.equal(partIn(account, 'origin').account, 1, 'the origin condition itself is still carried')
    const activity = requirementAccountOf({ contextId: CONTEXT, outcome: 'served', bindings, refused: null, blocks: [{ blockId: account.blockId, account }], draftContract: false })
    assert.deepEqual(activity.summary.scoringCondition!.missing.map(entry => entry.component), ['origin'], 'the episode ending on loss is the origin component\'s')
    // R2 S2: his origin words are not said to be missing alone: the part that failed, ours, is named beside them.
    const label = 'Initiated from the goalkeeper or a controlled defensive restart: A turnover ends the build-out episode, so a regain does not restore build-out scoring (ours, DRAFT)'
    assert.equal(activity.summary.scoringCondition!.missing[0].label, label)
    assert.equal(activity.summary.headline, `Missing from the approved scoring condition: ${label}. The activity was served without it. This account refuses nothing.`)
    // In the knowledge: the context's own item set to false (a TEST-ONLY copy, by row and selector) stops the build before realization.
    for (const [label, objects] of VERSIONS) {
        const altered = silently(() =>
            buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: session(objects) }, records, {
                review: { includeDrafts: true },
                alter: contracts => {
                    for (const contract of contracts) if (knowledgeKey(contract.contractId) === knowledgeKey(CONTEXT)) for (const item of contract.items) if (String(item.row) === 'T7' && item.selector === 'trigger=POSSESSION_CHANGE') item.value = 'false'
                },
            }).activity,
        ) as RefusedActivity
        assert.deepEqual([altered.outcome, altered.stage, 'requirementAccount' in altered], ['refused', 'structure', false], label)
    }
})

// ── S2 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('S2: the start transition removed from the finished game: the start is unrepresented, though its awarding item reaches six other transitions', () => {
    const account = reread(game => {
        game.transitions = game.transitions.filter((transition: any) => triggerOf(transition) !== 'START')
    })
    const start = partIn(account, 'start-awarded')
    assert.deepEqual(start.facets.map(entry => [entry.facetId, entry.account]), [['start', 4], ['awarded', 4]])
    assert.ok(start.facets[1].considered.some(entry => entry.why.includes("no line it reaches is entailed, on an element of the realized game holding the pattern's terms")), JSON.stringify(start.facets[1].considered))
})

// ── S1 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('S1: an exclusion over a row the finished game populates holds and is not vacuous; over an empty row it is flagged vacuous', () => {
    const testOnly: RequirementBindings = copy(bindings)
    const information = testOnly.contexts[0].rows.find(row => row.rowId === 'RPC-VAL-004')!.parts.find(entry => entry.id === 'information')!
    information.facets![0].row = 'J1'
    const inputs = observed[0]
    const context = inputs.contracts.find(contract => knowledgeKey(contract.contractId) === knowledgeKey(CONTEXT))!
    const account = reread(
        (_game, contracts) => {
            contracts.find(contract => contract.contractId === context.contractId)!.items.push({ itemId: 'TEST-ONLY-EXCLUSION', row: 'J1', selector: '*', requirement: 'EXISTS', strictness: 'EXCLUSION', basis: 'AUTHORED' })
        },
        testOnly,
        { forward: [...inputs.forward, { item: { contractId: context.contractId, itemId: 'TEST-ONLY-EXCLUSION' }, result: 'SATISFIED', reach: [], why: 'TEST-ONLY' }] },
    )
    const [carrier] = partIn(account, 'information').facets[0].carriers
    assert.deepEqual([carrier.itemId, carrier.survives], ['TEST-ONLY-EXCLUSION', { how: 'EXCLUSION_HOLDS', elementIds: [], vacuous: false, rereadInGame: false }])
    assert.equal(partIn(account, 'information').vacuous, false)
    assert.equal(partIn(blockRequirementAccountOf(inputs), 'information').vacuous, true, 'the real one: nothing on its row is in the game')
})

// ── S7 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('S7: an item matched in a constraint\'s contract is considered, named as a constraint\'s, never counted', () => {
    const inputs = observed[0]
    const gameForm = inputs.gameFormId!
    const account = reread(() => undefined, bindings, { gameFormId: null, selected: inputs.selected.map(entry => (entry.id === gameForm ? { id: entry.id, role: 'constraint' } : entry)) })
    const teams = partIn(account, 'opposition').facets[0]
    assert.equal(teams.account, 4)
    assert.ok(teams.considered.some(entry => entry.contractKind === null && entry.why.includes('its contract is a constraint, not a carrier kind in this increment (DRAFT)')), JSON.stringify(teams.considered))
})

// ── T7: the TEST-ONLY RPC-003 draft ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('T7: the RPC-003 draft, merged bindings, origin withheld: origin missing, progression and control on DRAFT knowledge; as drafted, no account; over the production file alone, not classified', () => {
    const store = loadDraftStore('ta02-composition')
    const merged = mergeRequirementBindings(bindings, loadDraftRequirementBindings(store), store.contracts)
    const roles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
    const draftSession = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles }
    /* TEST-ONLY stand-ins for his proposed rulings, exactly as draft-composition.unit.ts applies them: NOT his. */
    const rpc003 = (contracts: any[]) => contracts.find(contract => contract.contractId === 'restated:RPC-003')
    const PR1 = (contracts: any[]) => {
        rpc003(contracts).items.find((item: any) => item.itemId === 'RPC-003-11.b').value = { objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored: 'TEST-ONLY PR-1: not his ruling' }
    }
    const PR2 = (contracts: any[]) => {
        rpc003(contracts).items.push({
            itemId: 'RPC-003-12.c', origId: 'RPC-003-12', row: 'V5', selector: 'type=control', requirement: 'EQUALS',
            value: { objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored: 'TEST-ONLY PR-2: not his ruling' },
            strictness: 'REQUIRED', valueStatus: 'REQUIRED_RANGE', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', basisEvidence: 'TEST-ONLY PR-2: not his ruling',
            checkability: 'PARTLY_STRUCTURAL', structuralClause: 'TEST-ONLY', fitNote: 'TEST-ONLY PR-2', category: DRAFT_KNOWLEDGE,
        })
    }
    const withoutOrigin = (contracts: any[]) => {
        rpc003(contracts).items = rpc003(contracts).items.filter((item: any) => !['RPC-003-10.a', 'RPC-003-10.b'].includes(item.itemId))
    }
    const U2 = (contracts: any[]) => [PR1, PR2, withoutOrigin].forEach(step => step(contracts))
    const ours = loadLawsMateriality()
    const LAW_11_PROCEDURAL: LawsMateriality = {
        ...ours,
        file: 'TEST-ONLY',
        standing: 'DRAFT - TEST-ONLY stand-in, LAW-11 PROCEDURAL: neither our reading nor his',
        classifications: ours.classifications.map(entry => (entry.law === 'LAW-11' ? { ...entry, materiality: 'PROCEDURAL' as const, ourReading: 'TEST-ONLY stand-in.' } : entry)),
    }
    const build = (options: Record<string, unknown>) => silently(() => buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'TA02', session: draftSession }, records, { drafts: store, review: { includeDrafts: true }, ...options }).activity) as RefusedActivity
    const withdrawn = build({ alter: U2, lawsMateriality: LAW_11_PROCEDURAL, requirementBindings: merged })
    assert.deepEqual([withdrawn.outcome, withdrawn.stage], ['refused', 'communication'])
    const account = withdrawn.requirementAccount!
    assert.deepEqual([account.status, account.contract, account.bindings.mode], ['REPORT_ONLY', 'DRAFT', 'MERGED'])
    const scoring = account.summary.scoringCondition!
    assert.deepEqual(scoring.missing.map(entry => [entry.component, entry.cause.kind]), [['origin', 'NOT_CARRIED']])
    assert.deepEqual(scoring.components.map(entry => [entry.component, entry.account]), [['origin', 4], ['progression', 1], ['control', 1], ['not-possession-alone', 1]])
    assert.equal(scoring.uncoveredWords, 'Purposeful advancement', 'the words of his row no component stands for (S1)')
    const partOf = (partId: string) => account.parts.find(entry => entry.rowId === 'RPC-PROP-134' && entry.partId === partId)!
    assert.deepEqual([partOf('progression').restsOnDraftKnowledge, partOf('control').restsOnDraftKnowledge], [true, true])
    // S3: the progression referent under the TEST-ONLY PR-1 holds by construction, flagged, and its stand-in text is shown.
    assert.equal(partOf('progression').byConstruction, true)
    const referents = partOf('progression').facets.find(entry => entry.facetId === 'referents')!.carriers[0].value!
    assert.deepEqual(referents.realized, [{ objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored: 'TEST-ONLY PR-1: not his ruling' }])
    // S4/S7: coach observation with no observable is 4, never 3.
    const organized = account.parts.find(entry => entry.rowId === 'RPC-ID-011')!
    assert.deepEqual([organized.kind, organized.account, organized.cause!.kind, organized.countsAsSatisfied], ['COACH_OBSERVED', 4, 'OBSERVABLE_NOT_IDENTIFIED', false])
    assert.ok(account.summary.headline.startsWith('Missing from the approved scoring condition: From the attack\'s starting condition. The activity was refused at the communication stage without it.'), account.summary.headline)
    // As drafted (no stand-ins): refused at structure, nothing realized, so no account.
    const drafted = build({ requirementBindings: merged })
    assert.deepEqual([drafted.stage, 'requirementAccount' in drafted], ['structure', false])
    // Over the production file alone (as every existing draft build is made): every row unclassified, the scoring condition NOT_CLASSIFIED, never "carried" (M3).
    const unbound = build({ alter: U2, lawsMateriality: LAW_11_PROCEDURAL }).requirementAccount!
    assert.deepEqual([unbound.summary.scoringCondition!.state, unbound.summary.scoringConditionCarried, unbound.bindings.mode], ['NOT_CLASSIFIED', false, 'PRODUCTION'])
    assert.ok(unbound.parts.every(entry => entry.kind === 'NO_BINDING' && entry.account === 4))
})

console.log = quiet
console.log(`requirement-account controls unit tests: ${passed} passed.`)
