/**
 * **The requirement account of Play Out from the Back, read where the build hands it back** — 29 October 2026 (the specification's 5.2 T1-T5,
 * T8-T10, T13, T14, and the R-engine review's M3 pure-function cases).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Each generated activity should be evaluated against the applicable, approved
 * context requirements, accounting for each component of a scoring condition rather than simply confirming that the condition exists."*
 * *"Please confirm that Play Out from the Back remains unchanged in its coach-facing activity and continues to pass the appropriate checks."*
 * A projection is only proved by a consumer, so every account below is read from the review route's own function (`reviewActivity`, a
 * stored session as Mongo holds one), for both realizations (the zone version, A01-R1; the goal version, A01-R2) and both role blocks.
 *
 * Pinned:
 *   - T1/T2: the whole part table, in both versions and both blocks: 8 / 3 / 9 / 3 parts in accounts 1 / 2 / 3 / 4, and no component of
 *     the approved scoring condition in account 4; the values the finished game holds (the R-rulings review's M1); control and exclusion on
 *     the progression outcome's referent; the episode ending on a turnover (M2); the origin's no-further-value declaration (S2);
 *   - T3: the other session sizes the goal version is built for (12/2, 11/1), both versions;
 *   - T4: the traps, visible as considered and never counted;
 *   - T5: his words verbatim; coach observation not counted as satisfied in this account (our DRAFT rule, kept apart from his words); every
 *     classification DRAFT;
 *   - T8/T9: absent from every coach's, live, saved and pilot answer, and wherever nothing is realized or there is no context;
 *   - T10: the coach-facing activity unchanged, the administrator's keys the coach's plus exactly the four administrator keys, the input
 *     digests unmoved;
 *   - T13: neither new module reaches selection or coach text;
 *   - T14 and M3: the activity-level account's states, including those no real build reaches today.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/requirement-account.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadSportBoundRegions } from '../derivation/corpus'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { reviewActivity } from './activity-review'
import { buildActivity, buildActivityForReview, buildActivityWithSelection, RefusedActivity, ServedActivity } from './build-activity'
import { buildPilotActivity } from './build-pilot-activity'
import { checkedSave, liveCheckedActivity, liveSelectionFor } from './live-activity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { BlockRequirementAccount, COACH_OBSERVATION_RULE, HIS_ACCOUNTS, HIS_STANDARDS, RequirementAccount, requirementAccountOf } from './requirement-account'
import { loadRequirementBindings } from './requirement-bindings'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
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
quiet('the requirement account of Play Out from the Back (report only)')

const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const FA = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === 'FA-MINI-SOCCER-5V5-2026')!
const FA_GOAL = { goal: { count: 1, type: FA.object.type!, widthM: FA.object.widthM } }
const NO_GOAL = { goal: { count: 0 } }
const stored = (players: number, keepers: number, objects?: Record<string, unknown>) =>
    ({ playerCount: players, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) }) as any
const BODY = { learningGoalId: 'A01', durationMin: 20 }
const admin = (session: any) => silently(() => reviewActivity(session, BODY, { includeDrafts: true }))
const coach = (session: any) => silently(() => reviewActivity(session, BODY))
const selectionOf = (activity: ServedActivity | RefusedActivity) => (activity.account.realizationSelection ?? []).map(entry => [entry.realization, entry.outcome])
const accountOf = (activity: ServedActivity | RefusedActivity): RequirementAccount => {
    assert.ok(activity.requirementAccount, `${activity.title}: the administrator's build carries the account`)
    return activity.requirementAccount!
}

/** The whole table, as built (rowId, partId, account, standard): ours, DRAFT, for his review. */
const TABLE: [string, string, number, string][] = [
    ['RPC-ID-001', 'start-awarded', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-ID-001', 'start-controlled-in-play', 3, 'FIELD_EFFECTIVENESS'],
    ['RPC-ID-001', 'start-stable-in-play', 3, 'FIELD_EFFECTIVENESS'],
    ['RPC-ID-002', 'purpose', 4, 'LEARNING_DESIGN_RELEVANCE'],
    ['RPC-ID-003', 'progression-options', 3, 'FIELD_EFFECTIVENESS'],
    ['RPC-ID-005', 'no-dominant-high-press', 3, 'FIELD_EFFECTIVENESS'],
    ['RPC-PROP-132', 'origin', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-PROP-132', 'episode-ends-on-loss', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-PROP-132', 'progression', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-PROP-132', 'control', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-PROP-132', 'exclusion', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-PROP-132', 'progression-in-play', 3, 'FIELD_EFFECTIVENESS'],
    ['RPC-PROP-132', 'control-in-play', 3, 'FIELD_EFFECTIVENESS'],
    ['RPC-PROP-132', 'exclusion-in-play', 3, 'FIELD_EFFECTIVENESS'],
    ['RPC-VAL-001', 'recognizable', 3, 'LEARNING_DESIGN_RELEVANCE'],
    ['RPC-VAL-002', 'approved-event', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-VAL-002', 'no-unrelated-affordance', 4, 'LEARNING_DESIGN_RELEVANCE'],
    ['RPC-VAL-003', 'no-better-neighbour', 4, 'LEARNING_DESIGN_RELEVANCE'],
    ['RPC-VAL-004', 'opposition', 2, 'STRUCTURAL_VALIDITY'],
    ['RPC-VAL-004', 'direction', 2, 'STRUCTURAL_VALIDITY'],
    ['RPC-VAL-004', 'consequence', 2, 'STRUCTURAL_VALIDITY'],
    ['RPC-VAL-004', 'information', 1, 'STRUCTURAL_VALIDITY'],
    ['RPC-VAL-004', 'opposition-in-play', 3, 'FIELD_EFFECTIVENESS'],
]
const COUNTS = { '1': 8, '2': 3, '3': 9, '4': 3 }
const COMPONENTS = ['origin', 'progression', 'control', 'exclusion']
const part = (account: RequirementAccount, rowId: string, partId: string) => account.parts.find(entry => entry.rowId === rowId && entry.partId === partId)!
const facet = (account: RequirementAccount, rowId: string, partId: string, facetId: string) => part(account, rowId, partId).facets.find(entry => entry.facetId === facetId)!
const REFERENT = (asAuthored: string) => ({ objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored })

function pinTable(label: string, account: RequirementAccount, realization: string): void {
    assert.equal(account.status, 'REPORT_ONLY', label)
    assert.equal(account.contract, 'PRODUCTION', label)
    assert.equal(account.refusal, 'NONE_REPORT_ONLY', label)
    assert.deepEqual(account.bindings, { file: 'docs/audits/requirement-bindings.json', version: loadRequirementBindings().version, mode: 'PRODUCTION', standing: 'DRAFT' }, label)
    assert.deepEqual(account.parts.map(entry => [entry.rowId, entry.partId, entry.account, entry.standard]), TABLE, label)
    assert.equal(account.blocks.length, 2, `${label}: both role blocks are accounted`)
    // Round 2, R3 S1: each block's account is in `perBlock`; its parts are carried only where they differ from the merged ones (none here).
    for (const entry of account.parts) assert.deepEqual(entry.perBlock.map(block => [block.blockId, block.account]), account.blocks.map(block => [block.blockId, entry.account]), `${label}: ${entry.partId} per block`)
    for (const block of account.blocks) assert.deepEqual([block.status, block.parts.length, block.partsIdenticalToMerged], ['ACCOUNTED', 0, TABLE.length], `${label}: block ${block.blockId}`)
    assert.deepEqual(account.summary.counts, COUNTS, label)
    assert.deepEqual(account.summary.representedHow, { byAbsence: 1, byConstruction: 1 }, `${label}: of the 8 in account 1, information holds by absence and progression by construction (R2 S7)`)
    assert.deepEqual(account.reasons, [], label)
    assert.deepEqual(account.blocksWithoutAccount, [], label)
    assert.deepEqual(account.summary.blocksDisagree, [], label)
    // The approved scoring condition: every component carried, in every block; none in account 4.
    const scoring = account.summary.scoringCondition!
    assert.equal(scoring.state, 'ACCOUNTED', label)
    assert.equal(scoring.rowId, 'RPC-PROP-132', label)
    assert.deepEqual(scoring.missing, [], label)
    assert.deepEqual(scoring.components.map(entry => [entry.component, entry.account, entry.perBlock.map(block => block.account)]), COMPONENTS.map(component => [component, 1, [1, 1]]), label)
    assert.deepEqual(scoring.components.map(entry => entry.inPlay), [null, 3, 3, 3], `${label}: the in-play half beside each component, not counted as satisfied here (N4)`)
    assert.equal(scoring.uncoveredWords, null, `${label}: every word of his row is a component's`)
    assert.equal(account.summary.scoringConditionCarried, true, label)
    assert.equal(
        account.summary.headline,
        'Every component of the approved scoring condition is carried by the activity as built. Progressing beyond the initial pressure or progression line holds by construction: its referent is the target the scoring event reaches, so it rests on where that target is placed. 9 requirement parts depend on coach observation and 3 are unsupported or missing; this account refuses nothing.',
        label,
    )
    assert.deepEqual(account.summary.unsupported.map(entry => [entry.rowId, entry.partId, entry.cause.kind]), [
        ['RPC-ID-002', 'purpose', 'MISSING_KNOWLEDGE'],
        ['RPC-VAL-002', 'no-unrelated-affordance', 'MISSING_KNOWLEDGE'],
        ['RPC-VAL-003', 'no-better-neighbour', 'MISSING_KNOWLEDGE'],
    ], label)
    // M1: the values the finished game holds, each the one authored.
    const values = (rowId: string, partId: string, facetId: string) => facet(account, rowId, partId, facetId).carriers.map(carrier => carrier.value)
    assert.deepEqual(values('RPC-PROP-132', 'origin', 'referents'), [{ authored: { beginsEpisodeOf: 'BUILD_OUT_EPISODE', arms: [{ takenBy: KEEPER }, { restartKind: 'CONTROLLED_DEFENSIVE_RESTART' }], asAuthored: 'A restart, taken by the goalkeeper or as a controlled defensive restart, that begins a build-out episode.' }, realized: [{ beginsEpisodeOf: 'BUILD_OUT_EPISODE', arms: [{ takenBy: KEEPER }, { restartKind: 'CONTROLLED_DEFENSIVE_RESTART' }], asAuthored: 'A restart, taken by the goalkeeper or as a controlled defensive restart, that begins a build-out episode.' }] }], label)
    assert.deepEqual(values('RPC-PROP-132', 'progression', 'value'), [{ authored: 'beyond', realized: ['beyond'] }], label)
    assert.deepEqual(values('RPC-PROP-132', 'control', 'value'), [{ authored: 'controlled on arrival', realized: ['controlled on arrival'] }], label)
    assert.deepEqual(values('RPC-PROP-132', 'exclusion', 'value'), [{ authored: 'a long clearance that happens to reach the target', realized: ['a long clearance that happens to reach the target'] }], label)
    const progressionReferent = REFERENT('the progression reference: where build-out success is measured - the target the scoring team attacks')
    assert.deepEqual(values('RPC-PROP-132', 'progression', 'referents'), [{ authored: progressionReferent, realized: [progressionReferent] }], label)
    for (const component of ['control', 'exclusion']) {
        const own = part(account, 'RPC-PROP-132', component).sameReferent!
        assert.deepEqual([own.evaluated, own.holds], [true, true], `${label}: ${component} is evaluated against the progression outcome`)
        assert.equal(own.detail, 'the same referent as the progression component: the PRIMARY_SCORING objective reference of SCORING_TEAM', label)
    }
    assert.equal(part(account, 'RPC-PROP-132', 'progression').byConstruction, true, `${label}: progression holds by construction, flagged (S3)`)
    assert.equal(scoring.components.find(entry => entry.component === 'progression')!.byConstruction, true, label)
    // M2: the episode ends on a turnover, so a regain cannot restore build-out scoring; carried by the context, read at its value.
    const loss = facet(account, 'RPC-PROP-132', 'episode-ends-on-loss', 'possession-change-begins-episode').carriers
    assert.deepEqual(loss.map(carrier => [carrier.contractId, carrier.itemId, carrier.contractKind, carrier.value]), [['restated:RPC-001', 'RPC-001-17.a', 'CONTEXT', { authored: 'true', realized: ['true'] }]], label)
    // S2: the origin's no-further-value is his declaration, told apart from a missing value.
    assert.deepEqual(facet(account, 'RPC-PROP-132', 'origin', 'no-further-value').declarations.map(entry => [entry.contractId, entry.row, entry.declaration, entry.qualifier]), [['restated:RPC-001', 'V6', 'NON_CLAIMED', 'NO_FURTHER_VALUE']], label)
    // A component's condition: the guard's own reading governs, on the item's own element, the episode confirmed.
    for (const [component, itemId] of [['origin', 'RPC-001-18.a'], ['progression', 'RPC-001-18.c'], ['control', 'RPC-001-18.f'], ['exclusion', 'RPC-001-19.a']]) {
        const [carrier] = facet(account, 'RPC-PROP-132', component, 'condition').carriers
        assert.deepEqual([carrier.itemId, carrier.contractKind, carrier.condition!.governs, carrier.condition!.elementFound, carrier.condition!.carriedScope, carrier.condition!.episodeConfirmed], [itemId, 'CONTEXT', true, true, 'BUILD_OUT_EPISODE', true], `${label}: ${component}`)
    }
    // The start is the realization's, his provisional choice, in either version.
    for (const facetId of ['start', 'awarded']) assert.deepEqual(facet(account, 'RPC-ID-001', 'start-awarded', facetId).carriers.map(carrier => [carrier.contractId, carrier.contractKind, carrier.basis]), [[`provisional:${realization}`, 'REALIZATION', 'OWNER_RULING']], `${label}: ${facetId}`)
    assert.deepEqual(facet(account, 'RPC-ID-001', 'start-awarded', 'awarded').carriers[0].value, { authored: 'ROLE_HOLDER_BUILDING', realized: ['ROLE_HOLDER_BUILDING'] }, label)
    // His observables, in his words, for the start (the R-rulings review's M4) and the dominant identity (S10).
    assert.deepEqual(part(account, 'RPC-ID-001', 'start-controlled-in-play').observable!.citedAs, { file: 'back/src/system/sport-module/rpc-library.rc1.json', table: 'properties', rowId: 'RPC-PROP-001', field: 'property_text' }, label)
    assert.deepEqual(part(account, 'RPC-ID-001', 'start-stable-in-play').observable!.citedAs!.rowId, 'RPC-PROP-002', label)
    assert.deepEqual([part(account, 'RPC-ID-005', 'no-dominant-high-press').observable!.citedAs!.rowId, part(account, 'RPC-ID-005', 'no-dominant-high-press').observable!.expect], ['RPC-PROP-004', 'ABSENT'], label)
    // Not accounted, every other row, with where each is cited or accounted; DIVERSITY does not apply to one activity (S8).
    const listed = Object.fromEntries(account.notAccounted.map(entry => [entry.rowId, entry]))
    assert.equal(account.notAccounted.length, 19, label)
    assert.deepEqual([listed['RPC-VAL-005'].standing, listed['RPC-PROP-005'].accountedInside, listed['RPC-PROP-001'].citedAsObservableBy], ['NOT_APPLICABLE', 'RPC-PROP-132 episode-ends-on-loss', ['RPC-ID-001 start-controlled-in-play']], label)
    // R2 N1: a row accounted inside another part says so, never "not accounted".
    assert.deepEqual([listed['RPC-PROP-005'].standing, listed['RPC-PROP-005'].why], ['ACCOUNTED_INSIDE', 'accounted inside RPC-PROP-132 episode-ends-on-loss (ours, DRAFT)'], label)
    // R2 N12: his transitions sheet is listed, not dropped.
    assert.ok(account.alsoNotAccounted[0].startsWith("His workbook's transitions from this context (RPC-TR-001 to RPC-002, CONDITIONAL; RPC-TR-002 to RPC-003, TYPICAL; RPC-TR-003 to RPC-007, CONDITIONAL)"), account.alsoNotAccounted[0])
    // R1 S2: the pinned values and scopes, read as his approved knowledge carries them.
    for (const component of COMPONENTS) assert.deepEqual(facet(account, 'RPC-PROP-132', component, 'condition').carriers.map(carrier => carrier.scope), ['BUILD_OUT_EPISODE'], `${label}: ${component}`)
}

const zone = admin(stored(12, 1, NO_GOAL))
const goal = admin(stored(12, 1, FA_GOAL))

// ── T1 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T1: the zone version (A01-R1), 12 players and 1 goalkeeper: served, every part as pinned in both blocks, no scoring component in account 4', () => {
    assert.equal(zone.outcome, 'served')
    assert.deepEqual(selectionOf(zone), [['A01-R2', 'NOT_APPLICABLE'], ['A01-R1', 'SELECTED']])
    const account = accountOf(zone)
    pinTable('zone', account, 'A01-R1')
    assert.equal(account.outcome, 'served')
    assert.equal(account.contextId, 'RPC-001')
})

// ── T2 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T2: the goal version (A01-R2), the FA goal: served, the same table; the end team\'s target carried by the realization, direction still 2', () => {
    assert.equal(goal.outcome, 'served')
    assert.deepEqual(selectionOf(goal), [['A01-R2', 'SELECTED'], ['A01-R1', 'NOT_TRIED']])
    const account = accountOf(goal)
    pinTable('goal', account, 'A01-R2')
    const end = facet(account, 'RPC-VAL-004', 'direction', 'target-end-team')
    assert.deepEqual([end.account, end.carriers.map(carrier => [carrier.contractId, carrier.contractKind])], [1, [['provisional:A01-R2', 'REALIZATION']]])
    assert.equal(part(account, 'RPC-VAL-004', 'direction').account, 2, 'the other three facets rest on the game form')
    // In the goal version a role scores by an event of its own, and in the zone version a regain also counts: that scoring is the realization's,
    // not accounted here, and said so (N7), beside the transitions sheet (R2 N12).
    for (const built of [account, accountOf(zone)]) {
        assert.equal(built.alsoNotAccounted.length, 2)
        assert.ok(built.alsoNotAccounted[1].startsWith("A role's own way to score, or another occurrence counted as a score"), built.alsoNotAccounted[1])
    }
})

// ── T3 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T3: both versions at 12/2 and 11/1: every component carried, none missing', () => {
    for (const [players, keepers] of [[12, 2], [11, 1]] as const) {
        for (const [label, objects] of [['zone', NO_GOAL], ['goal', FA_GOAL]] as const) {
            const activity = admin(stored(players, keepers, objects))
            assert.equal(activity.outcome, 'served', `${label} ${players}/${keepers}`)
            const scoring = accountOf(activity).summary.scoringCondition!
            assert.deepEqual(scoring.missing, [], `${label} ${players}/${keepers}`)
            assert.deepEqual(scoring.components.map(entry => [entry.component, entry.account]), COMPONENTS.map(component => [component, 1]), `${label} ${players}/${keepers}`)
        }
    }
})

// ── T4 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T4: the traps, visible: what cites a row but does not carry it is considered, never counted', () => {
    for (const account of [accountOf(zone), accountOf(goal)]) {
        const considered = (rowId: string, partId: string, facetId: string) => facet(account, rowId, partId, facetId).considered.map(entry => [`${entry.contractId}::${entry.itemId}`, entry.forward])
        assert.deepEqual(considered('RPC-ID-001', 'start-awarded', 'awarded'), [['restated:RPC-001::RPC-001-15.a', 'INERT']])
        assert.deepEqual(considered('RPC-VAL-004', 'opposition', 'teams'), [['restated:RPC-001::RPC-001-01.a', 'UNMET']])
        assert.ok(facet(account, 'RPC-VAL-004', 'opposition', 'teams').considered[0].why.some(why => why.startsWith('its basis is ASSUMED')))
        assert.deepEqual(considered('RPC-VAL-004', 'consequence', 'play-continues'), [['restated:RPC-001::RPC-001-17.b', 'INERT']])
        assert.ok(part(account, 'RPC-VAL-004', 'direction').facets.every(entry => entry.carriers.every(carrier => carrier.row !== 'DV1')), 'no computed-view item carries direction')
        const information = part(account, 'RPC-VAL-004', 'information')
        assert.deepEqual([information.vacuous, information.facets[0].carriers[0].survives], [true, { how: 'EXCLUSION_HOLDS', elementIds: [], vacuous: true, rereadInGame: false }], 'holds by absence, flagged, and said to hold per derivation (R1 NIT 3)')
        assert.deepEqual(facet(account, 'RPC-VAL-004', 'consequence', 'play-continues').carriers.map(carrier => [carrier.contractId, carrier.contractKind, carrier.relationship, carrier.value]), [['restated:GF2', 'GAME_FORM', 'RPC-REL-013', { authored: 'CONTINUE', realized: ['CONTINUE'] }]])
    }
})

// ── T5 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T5: his words verbatim; coach observation not counted as satisfied in this account (our DRAFT rule, apart from his words); every classification DRAFT and ours', () => {
    assert.deepEqual(HIS_ACCOUNTS, {
        1: 'Explicitly represented in the finished activity.',
        2: 'Supported through an authorized Game Form or other knowledge relationship.',
        3: 'Dependent on coach observation or judgment, with the relevant observable conditions identified.',
        4: 'Unsupported or missing.',
    })
    assert.deepEqual(HIS_STANDARDS, {
        STRUCTURAL_VALIDITY: 'Structural validity: The required elements, conditions, and consequences are present.',
        LEARNING_DESIGN_RELEVANCE: 'Learning-design relevance: The environment has a grounded relationship to the intended Game Problem and affordances.',
        FIELD_EFFECTIVENESS: 'Field effectiveness: The activity actually provides the intended opportunities during play, requiring coach observation.',
    })
    // Round 2, R2 M1: our rule for coach observation is ours, apart from his words, and quotes his hedge exactly.
    assert.deepEqual(COACH_OBSERVATION_RULE, {
        rule: 'Not counted as satisfied in this account.',
        standing: 'DRAFT',
        by: 'OURS',
        his: { words: 'A requirement should not automatically count as satisfied merely because the coach could theoretically judge it.', citedAs: 'his reply filed 3 November 2026, section 2' },
    })
    for (const account of [accountOf(zone), accountOf(goal)]) {
        assert.deepEqual(account.coachObservationRule, COACH_OBSERVATION_RULE)
        assert.ok(!account.about.includes('approved') || account.about.includes('approved rows'), 'his categories are "supported", not "approved" (R2 N4)')
        assert.equal(account.citedAs, 'his reply filed 3 November 2026, section 2')
        for (const entry of account.parts) {
            assert.deepEqual([entry.classification.standing, entry.classification.by], ['DRAFT', 'OURS'], entry.partId)
            assert.equal(entry.accountWords, HIS_ACCOUNTS[entry.account], entry.partId)
            assert.equal(entry.standardWords, HIS_STANDARDS[entry.standard as keyof typeof HIS_STANDARDS], entry.partId)
            assert.equal(entry.countsAsSatisfied, entry.account === 1 || entry.account === 2, entry.partId)
            if (entry.kind === 'COACH_OBSERVED') assert.equal(entry.countsAsSatisfied, false, `${entry.partId}: not counted as satisfied in this account (our DRAFT rule)`)
            if (entry.kind === 'COACH_OBSERVED') assert.notEqual(entry.standard, 'STRUCTURAL_VALIDITY', entry.partId)
        }
    }
})

// ── T8 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T8: absent from every coach\'s, live, saved and pilot answer', () => {
    for (const [label, objects] of [['zone', NO_GOAL], ['goal', FA_GOAL]] as const) {
        const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: 1 }, objects }
        const request = { kind: 'learning-goal' as const, goalId: 'A01', session }
        const answers: [string, object][] = [
            ['buildActivity', silently(() => buildActivity(request))],
            ['buildActivityWithSelection', silently(() => buildActivityWithSelection(request).activity)],
            ['reviewActivity without options', coach(stored(12, 1, objects))],
            ['buildActivityForReview without drafts', silently(() => buildActivityForReview(request, { includeDrafts: false }))],
        ]
        const live = silently(() => liveCheckedActivity(stored(12, 1, objects), { learningGoalId: 'A01', practiceSituationId: null, durationMin: 20 }, silently(() => liveSelectionFor('A01', 'medium'))))
        assert.equal(live.outcome, 'served', label)
        answers.push(['the live route', live.activity])
        const digests = live.outcome === 'served' ? live.inputDigests : []
        const saved = silently(() => checkedSave(stored(12, 1, objects), { checkedInputs: { learningGoalId: 'A01', durationMin: 20 }, inputDigests: digests, challengeLevel: 'medium' }))
        assert.equal(saved.outcome, 'saved', label)
        if (saved.outcome === 'saved') answers.push(['the save', saved.activity])
        for (const [where, answer] of answers) assert.ok(!('requirementAccount' in answer), `${label}: ${where} carries no requirement account`)
    }
    // The pilot builds through `buildActivityWithSelection` (its goal is refused at knowledge today, so this is pinned as vacuous, not as proof).
    const pilot: any = silently(() => buildPilotActivity())
    assert.ok(!JSON.stringify(pilot).includes('"requirementAccount"'), 'the pilot carries none')
})

// ── T9 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T9: absent from administrator builds where nothing is realized or there is no context: every demonstration, every goal stopped before realization', () => {
    const BEFORE = ['session', 'selection', 'knowledge', 'structure', 'realization']
    let stoppedEarly = 0
    for (const session of [stored(12, 1), stored(12, 0)]) {
        for (const goalEntry of sessionPlanningModel.learningGoals() as any[]) {
            const activity = silently(() => reviewActivity(session, { learningGoalId: String(goalEntry.ID), durationMin: 20 }, { includeDrafts: true }))
            if (activity.outcome === 'refused' && BEFORE.includes(activity.stage)) {
                stoppedEarly++
                assert.ok(!('requirementAccount' in activity), `${goalEntry.ID} refused at ${activity.stage}: no account`)
            }
        }
        for (const demonstration of MECHANISM_DEMONSTRATIONS) {
            const activity = silently(() => reviewActivity(session, { demonstrationId: demonstration.id, durationMin: 20 }, { includeDrafts: true }))
            assert.ok(!('requirementAccount' in activity), `${demonstration.id}: a demonstration has no context, so no account`)
        }
    }
    assert.ok(stoppedEarly > 10, `the goals stopped before realization were checked (${stoppedEarly})`)
})

// ── T10 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T10: Play Out from the Back unchanged for the coach: the coach-facing keys deep-equal, the administrator\'s keys the coach\'s plus four, the digests unmoved', () => {
    const DIGESTS: Record<string, string[]> = { zone: ['e8161c9a', '27a09f6e'], goal: ['f35f753e', '3ee67e96'] }
    for (const [label, objects, built] of [['zone', NO_GOAL, zone], ['goal', FA_GOAL, goal]] as const) {
        const theirs = coach(stored(12, 1, objects)) as ServedActivity
        const ours = built as ServedActivity
        assert.equal(theirs.outcome, 'served', label)
        for (const key of ['rendered', 'overview', 'diagram', 'integrity', 'roleBlocks', 'account', 'title', 'subtitle', 'session'] as const) assert.deepEqual(ours[key], theirs[key], `${label}: ${key}`)
        assert.deepEqual(Object.keys(ours).sort(), [...Object.keys(theirs), 'evidence', 'overviewDraft', 'diagramDraft', 'requirementAccount'].sort(), label)
        const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: 1 }, objects }
        const digests = silently(() => buildActivityWithSelection({ kind: 'learning-goal', goalId: 'A01', session }).inputDigests)
        assert.deepEqual(digests.map(entry => entry.inputDigest), DIGESTS[label], `${label}: the bindings are outside every derivation input`)
    }
})

// ── T13 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
test('T13: neither new module is in the import closure of selection or of coach text; only the build (and the TEST-ONLY draft store) imports them', () => {
    const SRC = path.resolve(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(SRC)
    const SPECIFIER = /(?:from|require\s*\(|import\s*\()\s*['"](\.[^'"]*)['"]/g
    const resolve = (from: string, specifier: string): string | null => {
        const base = path.resolve(path.dirname(from), specifier)
        return [`${base}.ts`, path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate)) ?? null
    }
    const closure = (starts: string[]): Set<string> => {
        const seen = new Set(starts)
        const queue = [...starts]
        while (queue.length) {
            const file = queue.shift()!
            for (const match of fs.readFileSync(file, 'utf8').matchAll(SPECIFIER)) {
                const next = resolve(file, match[1])
                if (next && !seen.has(next)) {
                    seen.add(next)
                    queue.push(next)
                }
            }
        }
        return seen
    }
    const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
    const selection = files.filter(file => /select/i.test(path.basename(file)))
    assert.ok(selection.map(relative).includes('system/derivation/run-bounded-selection.ts'))
    const coachText = ['render-concrete-game', 'coach-overview', 'coach-diagram', 'overview-fidelity', 'derived-wording', 'sections', 'fidelity', 'field-diagram'].map(name => path.join(__dirname, `${name}.ts`))
    for (const [label, starts] of [['selection', selection], ['coach text', coachText]] as const) {
        const reached = [...closure(starts)].map(relative)
        assert.ok(reached.length > starts.length, `${label}: the closure reads imports`)
        for (const module of ['system/rendering/requirement-account.ts', 'system/rendering/requirement-bindings.ts']) assert.ok(!reached.includes(module), `${label} reaches ${module}`)
    }
    const importers = (name: string) => files.filter(file => new RegExp(`(from|require\\s*\\(|import\\s*\\()\\s*['"][^'"]*${name}['"]`).test(fs.readFileSync(file, 'utf8'))).map(relative).sort()
    assert.deepEqual(importers('requirement-account'), ['system/rendering/build-activity.ts'])
    assert.deepEqual(importers('requirement-bindings'), ['system/derivation/draft-store.ts', 'system/rendering/build-activity.ts', 'system/rendering/requirement-account.ts'])
})

// ── T14 and M3: the activity-level account's states, on the pure function ───────────────────────────────────────────────────────────────
test('T14/M3: refused bindings, an unclassified scoring condition, no structural component, a block not accounted, and a component served missing: never "every component carried"', () => {
    const bindings = loadRequirementBindings()
    // Each block's full account, rebuilt from the merged parts and its own account in `perBlock` (its differing parts are carried apart: none here).
    const account = accountOf(zone)
    const [first, second]: BlockRequirementAccount[] = account.blocks.map(({ partsIdenticalToMerged: _same, ...entry }) => ({
        ...entry,
        parts: account.parts.map(({ perBlock, ...merged }) => ({ ...merged, account: perBlock.find(block => block.blockId === entry.blockId)!.account })),
    }))
    const block = (base: BlockRequirementAccount, change: (parts: BlockRequirementAccount['parts']) => BlockRequirementAccount['parts']): BlockRequirementAccount => ({ ...JSON.parse(JSON.stringify(base)), parts: change(JSON.parse(JSON.stringify(base.parts))) })
    const of = (blocks: { blockId: string; account: BlockRequirementAccount | null }[], outcome = 'served', refused: string[] | null = null) => requirementAccountOf({ contextId: 'RPC-001', outcome, bindings, refused, blocks, draftContract: false })
    // The rebuilt blocks give back the account as served.
    assert.deepEqual(of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: second }]), account)
    // T14: the bindings file refused, its reason said once (R3 S4).
    const refused = of(
        [
            { blockId: first.blockId, account: { ...first, status: 'BINDINGS_REFUSED', reasons: ['TEST-ONLY'], parts: [] } },
            { blockId: second.blockId, account: { ...second, status: 'BINDINGS_REFUSED', reasons: ['TEST-ONLY'], parts: [] } },
        ],
        'served',
        ['TEST-ONLY'],
    )
    assert.deepEqual([refused.status, refused.parts.length, refused.summary.scoringConditionCarried, refused.reasons], ['BINDINGS_REFUSED', 0, false, ['TEST-ONLY']])
    assert.equal(refused.summary.headline, 'The requirement account could not be computed: the bindings file was refused. The activity is unchanged.')
    // M3: a scoring row with no binding (as a TEST-ONLY draft build over the production file shows it).
    const unbound = (parts: BlockRequirementAccount['parts']) => [
        ...parts.filter(entry => entry.rowId !== 'RPC-PROP-132'),
        { ...parts.find(entry => entry.rowId === 'RPC-PROP-132')!, partId: 'not-classified', kind: 'NO_BINDING' as const, component: null, rowSpan: null, account: 4 as const, facets: [], cause: { kind: 'NO_BINDING' as const, detail: 'TEST-ONLY' } },
    ]
    const notClassified = of([{ blockId: first.blockId, account: block(first, unbound) }])
    assert.deepEqual([notClassified.summary.scoringCondition!.state, notClassified.summary.scoringConditionCarried], ['NOT_CLASSIFIED', false])
    assert.equal(notClassified.summary.headline, 'The approved scoring condition has not been classified into components for this context, so whether its components are carried is not accounted. This account refuses nothing.')
    // M3: no structural component at all (only coach-observed parts on the scoring row).
    const observedOnly = of([{ blockId: first.blockId, account: block(first, parts => parts.filter(entry => entry.rowId !== 'RPC-PROP-132' || entry.kind === 'COACH_OBSERVED')) }])
    assert.deepEqual([observedOnly.summary.scoringCondition!.state, observedOnly.summary.scoringConditionCarried], ['NO_STRUCTURAL_COMPONENT', false])
    assert.equal(observedOnly.summary.headline, 'No component of the approved scoring condition is structurally represented. This account refuses nothing.')
    assert.deepEqual(observedOnly.summary.scoringCondition!.notStructurallyRepresented.map(entry => entry.component), ['progression', 'control', 'exclusion'])
    // M3: one block stopped before the guard.
    const halfway = of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: null }], 'validation')
    assert.deepEqual([halfway.summary.scoringCondition!.unaccountedBlocks, halfway.summary.scoringConditionCarried, halfway.blocksWithoutAccount], [[second.blockId], false, [{ blockId: second.blockId, why: 'it stopped before the context scoring guard' }]])
    assert.equal(halfway.summary.headline, 'Block 2 of 2 was not accounted: it stopped before the context scoring guard. This account refuses nothing.', 'counted, never named by its role holders (R3 NIT 10)')
    // The components read 4 in no block they were not accounted in, and the unaccounted block is not counted favourable (R1 NIT 1).
    assert.ok(halfway.summary.scoringCondition!.components.every(entry => entry.perBlock.length === 1 && entry.perBlock[0].blockId === first.blockId))
    // M3: served with a component missing in one block (no real build reaches this today): named first, block by block.
    const servedMissing = of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: block(second, parts => parts.map(entry => (entry.partId === 'control' ? { ...entry, account: 4, cause: { kind: 'NOT_CARRIED', detail: 'TEST-ONLY' } } : entry))) }])
    assert.deepEqual(servedMissing.summary.scoringCondition!.missing.map(entry => [entry.component, entry.blocks, entry.cause.kind]), [['control', [second.blockId], 'NOT_CARRIED']])
    assert.deepEqual(servedMissing.summary.blocksDisagree.map(entry => entry.partId), ['control'])
    assert.equal(servedMissing.summary.headline, 'Missing from the approved scoring condition: With possession controlled on arrival. The activity was served without it. This account refuses nothing.')
    assert.equal(servedMissing.summary.scoringConditionCarried, false)
    // A block's ERROR: the account says the reader failed, and carries no parts.
    const errored = of([{ blockId: first.blockId, account: { ...first, status: 'ERROR', reasons: ['TEST-ONLY'], parts: [] } }])
    assert.deepEqual([errored.status, errored.parts.length, errored.summary.headline], ['ERROR', 0, 'The requirement account could not be computed: the reader failed. The activity is unchanged.'])
    // Round 2, R3 S2: a block that lacks a part another block has reads 4 for it, never the favourable value; the component is named missing.
    const lacking = of([{ blockId: first.blockId, account: block(first, parts => parts.filter(entry => entry.partId !== 'control')) }, { blockId: second.blockId, account: second }])
    const control = lacking.parts.find(entry => entry.partId === 'control')!
    assert.deepEqual([control.account, control.perBlock.map(entry => [entry.blockId, entry.account]), control.cause!.kind], [4, [[first.blockId, 4], [second.blockId, 1]], 'NO_BINDING'])
    assert.equal(control.cause!.detail, 'block 1 of 2 holds no such part, so it is not accounted there')
    assert.deepEqual([lacking.summary.scoringCondition!.missing.map(entry => [entry.component, entry.blocks]), lacking.summary.scoringConditionCarried], [[['control', [first.blockId]]], false])
    // Round 2, R1 S1: a component dropped from every block (and so from the bindings) leaves his words uncovered: never "every component carried".
    const dropped = of([first, second].map(entry => ({ blockId: entry.blockId, account: block(entry, parts => parts.filter(part => part.component !== 'control')) })))
    assert.deepEqual([dropped.summary.scoringCondition!.missing, dropped.summary.scoringCondition!.uncoveredWords, dropped.summary.scoringConditionCarried], [[], 'with possession controlled on arrival', false])
    assert.equal(dropped.summary.headline, 'Words of the approved scoring condition no component accounts for: "with possession controlled on arrival". Whether they are carried by the activity as built is not accounted. This account refuses nothing.')
    // Round 2, R1 NIT 2: a refused activity's carried headline says it was refused.
    const refusedLater = of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: second }], 'communication')
    assert.ok(refusedLater.summary.headline.startsWith('Every component of the approved scoring condition is carried by the activity as built (refused at the communication stage).'), refusedLater.summary.headline)
})

console.log = quiet
console.log(`requirement-account unit tests: ${passed} passed.`)
