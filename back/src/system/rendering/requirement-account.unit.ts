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
 *   - Round 3 (his reply filed 4 November 2026): in T1/T2, every part's satisfied standing beside where its authority originates (item 2),
 *     both flags in his distinction (item 3), the RPC-ID-003 observable in his approved words (item 6), the four enforced components and
 *     the enforcement found nothing (item 7); in T14, what the build refuses on in each state, fail-closed where nothing can be verified.
 *   - Round 4 (his reply filed 5 November 2026, item 1: *"I approve retaining the safeguard that refuses a checked activity when an essential
 *     scoring-condition component cannot be verified."*): the safeguard said as approved, his words and his two classes verbatim (T5); in
 *     T14, every state's findings in their class, counted; and (T15) a component the report found missing but whose failing part is not
 *     enforced is never passed over in a refusal's headline, whatever class refused it (the design review's M3). The fix round: the headline's
 *     "Missing or altered" names only what a missing-or-altered finding names, and a component missing through a part that is not enforced is
 *     named apart, decided part by part (the R2 review's S2, the R1 review's S1); T14 covers the event-kind and missing-evidence branches.
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
import {
    BlockRequirementAccount,
    COACH_OBSERVATION_RULE,
    HIS_ACCOUNTS,
    HIS_STANDARDS,
    RequirementAccount,
    requirementAccountOf,
    SATISFIED_BY_ABSENCE_WORDS,
    SCORING_ENFORCEMENT,
    SCORING_REASON_HEAD,
    ScoringEnforcementReading,
} from './requirement-account'
import { KnowledgeRowCitation, loadRequirementBindings, RequirementBindings } from './requirement-bindings'
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
quiet("the requirement account of Play Out from the Back (round 3: the approved scoring condition's components enforced)")

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
/** Round 4: a refusal where a component cannot be verified is the safeguard he approved, and the headline says so (one literal per file: the R3 review's S-5). */
const APPROVED = '(a verification failure: the safeguard he approved, his reply filed 5 November 2026, item 1)'
const BOTH = `The activity was refused at the validation stage on both: a missing or altered component of an approved scoring condition is enforced, and a component that cannot be verified is refused too ${APPROVED}.`
const MISSING_SENTENCE = 'The activity was refused at the validation stage: a missing or altered component of an approved scoring condition is enforced.'
const VERIFICATION_SENTENCE = `The activity was refused at the validation stage: a component that cannot be verified is refused too ${APPROVED}.`

function pinTable(label: string, account: RequirementAccount, realization: string): void {
    // Round 3b (the coordinator's item 5): a report, of which the approved scoring condition's components were enforced on this build.
    assert.equal(account.status, 'REPORT_AND_ENFORCEMENT', label)
    assert.equal(account.contract, 'PRODUCTION', label)
    // Round 3, his item 7: the approved scoring condition's components are enforced on this build, and nothing was found.
    assert.deepEqual([account.enforcement.scope, account.enforcement.applied, account.enforcement.findings, account.enforcement.coachObservedOnly, account.enforcement.standing, account.enforcement.his.citedAs], ['SCORING_CONDITION_COMPONENTS', true, [], [], 'DRAFT', 'his reply filed 4 November 2026, item 7'], label)
    // Round 4 (his reply filed 5 November 2026, item 1): nothing found, so nothing in either class.
    assert.deepEqual([account.enforcement.failures, account.enforcement.counts], [[], { MISSING_OR_ALTERED: 0, VERIFICATION_FAILURE: 0 }], label)
    // Round 3b (R2 S5, the coordinator's item 4) stated the fail-closed refusals as ours; round 4 states them as the safeguard he approved,
    // his words beside them, and which cause is which class as ours.
    assert.ok(account.enforcement.what.includes('the safeguard he approved (his reply filed 5 November 2026, item 1)'), account.enforcement.what)
    assert.ok(!account.enforcement.what.includes('for his decision') && !account.enforcement.what.includes('ours beyond his item 7'), account.enforcement.what)
    assert.ok(account.enforcement.what.includes('(our DRAFT reading of which causes these are: '), 'the list of causes is ours, never his enumeration (the design review\'s S5)')
    assert.deepEqual(account.enforcement.safeguard, SCORING_ENFORCEMENT.safeguard, label)
    assert.deepEqual(account.enforcement.classes.map(entry => [entry.id, entry.label, entry.citedAs]), [['MISSING_OR_ALTERED', 'Missing or altered requirement', 'his reply filed 5 November 2026, item 1'], ['VERIFICATION_FAILURE', 'Verification failure', 'his reply filed 5 November 2026, item 1']], label)
    assert.deepEqual([account.enforcement.classRule.standing, account.enforcement.classRule.by], ['DRAFT', 'OURS'], label)
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
        "Every component of the approved scoring condition is carried by the activity as built. Progressing beyond the initial pressure or progression line holds by construction: reaching the target does not by itself establish meaningful progression, and the target's placement and its relationship to the intended Game Problem are still to be verified (ours, DRAFT). 9 requirement parts depend on coach observation and 3 are unsupported or missing. Only the components quoting his words are enforced, and nothing else refuses.",
        label,
    )
    // Round 3, his reply filed 4 November 2026, item 2: satisfied, and where its authority originates, on every part, apart from his categories.
    assert.deepEqual(
        account.parts.map(entry => [entry.partId, entry.satisfied, entry.authority.from]),
        TABLE.map(([, partId, kind]) => {
            const from: Record<string, string[]> = {
                'start-awarded': ['PROVISIONAL_REALIZATION'],
                opposition: ['GAME_FORM_KNOWLEDGE'],
                direction: realization === 'A01-R2' ? ['GAME_FORM_KNOWLEDGE', 'PROVISIONAL_REALIZATION'] : ['GAME_FORM_KNOWLEDGE'],
                consequence: ['GAME_FORM_KNOWLEDGE'],
            }
            return [partId, kind === 3 ? 'NOT_COUNTED' : kind === 4 ? 'NO' : 'YES', kind === 3 || kind === 4 ? [] : (from[partId] ?? ['CONTEXT_KNOWLEDGE'])]
        }),
        `${label}: satisfied beside authority`,
    )
    assert.equal(part(account, 'RPC-VAL-004', 'opposition').authority.words, "the Game Form's knowledge (GF2, through the context's relationship RPC-REL-013)", label)
    assert.equal(part(account, 'RPC-ID-001', 'start-awarded').authority.words, `this activity's provisional realization, his provisional choice (provisional:${realization})`, label)
    assert.equal(part(account, 'RPC-VAL-002', 'approved-event').authority.words, "the context's knowledge: the scoring events it approves (RPC-REL-072)", label)
    // Round 3, item 3: both flags kept, our sentence beside his words, cited.
    assert.deepEqual(account.parts.filter(entry => entry.flag).map(entry => [entry.partId, entry.flag!.kind, entry.flag!.his.citedAs]), [
        ['progression', 'BY_CONSTRUCTION', 'his reply filed 4 November 2026, item 3, on progression'],
        ['information', 'BY_ABSENCE', 'his reply filed 4 November 2026, item 3, on representative information'],
    ], label)
    // Round 3b (R2 S3): the by-absence part's words never contradict its flag, and the flag names the register row it reads.
    assert.equal(part(account, 'RPC-VAL-004', 'information').satisfiedWords, SATISFIED_BY_ABSENCE_WORDS, label)
    assert.ok(part(account, 'RPC-VAL-004', 'information').flag!.ours.startsWith('Satisfied only by the absence of any restriction: no rule on its register row (V15) is in the finished game.'), label)
    assert.equal(part(account, 'RPC-ID-003', 'progression-options').authority.words, "No feature of the activity carries it: the coach judges it in play (its observable's source is below).", label)
    assert.deepEqual(part(account, 'RPC-PROP-132', 'progression').flag!.his.words, ['Reaching a target should not automatically establish meaningful progression merely because the target is present.', "The target's placement and relationship to the intended Game Problem matter."], label)
    assert.deepEqual(part(account, 'RPC-VAL-004', 'information').flag!.his.words, ['However, this conclusion should be supported by a check of the applicable rules and restrictions, rather than simply an assumption that nothing is hidden.'], label)
    // Round 3, item 7: the four components quoting his words are enforced; nothing else is, the episode ending on a turnover included.
    assert.deepEqual(account.parts.filter(entry => entry.enforced).map(entry => entry.partId), COMPONENTS, label)
    // Round 3, item 6: the RPC-ID-003 observable is his 16 October words, approved by him as an observation criterion.
    assert.deepEqual(part(account, 'RPC-ID-003', 'progression-options').observable, {
        text: 'Success should permit multiple functional solutions, including carrying the ball, passing through or around pressure, and using a more direct option when appropriate.',
        source: 'HIS_REPLY',
        citedAs: { reply: 'his reply filed 16 October 2026, item 4', approvedBy: 'his reply filed 4 November 2026, item 6' },
        expect: 'PRESENT',
        standing: 'DRAFT',
    }, label)
    assert.ok(part(account, 'RPC-ID-003', 'progression-options').classification.note!.includes('"These should remain possible solutions, not required behaviors."'), label)
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
    assert.deepEqual((part(account, 'RPC-ID-001', 'start-stable-in-play').observable!.citedAs as KnowledgeRowCitation).rowId, 'RPC-PROP-002', label)
    assert.deepEqual([(part(account, 'RPC-ID-005', 'no-dominant-high-press').observable!.citedAs as KnowledgeRowCitation).rowId, part(account, 'RPC-ID-005', 'no-dominant-high-press').observable!.expect], ['RPC-PROP-004', 'ABSENT'], label)
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
    // Round 4: the safeguard he approved and his two classes, his words pinned as literals (the design review's S3: his November replies are
    // not filed in the repository, so no test reads them from a file).
    assert.deepEqual(SCORING_ENFORCEMENT.safeguard, {
        words: [
            'I approve retaining the safeguard that refuses a checked activity when an essential scoring-condition component cannot be verified.',
            'Both should prevent an activity from being served as checked, but the diagnostic report should clearly distinguish them.',
            'This should remain narrowly scoped to approved scoring-condition components for now.',
        ],
        citedAs: 'his reply filed 5 November 2026, item 1',
    })
    assert.deepEqual(SCORING_ENFORCEMENT.classes, [
        { id: 'MISSING_OR_ALTERED', label: 'Missing or altered requirement', words: 'The finished activity demonstrably fails to preserve an approved condition.', citedAs: 'his reply filed 5 November 2026, item 1' },
        {
            id: 'VERIFICATION_FAILURE',
            label: 'Verification failure',
            words: 'The system cannot establish whether the condition is satisfied because its classification, supporting evidence, or check is missing or malfunctioning.',
            citedAs: 'his reply filed 5 November 2026, item 1',
        },
    ])
    // Which cause is which class is ours, never in his voice; the item-7 block is kept as it was.
    assert.deepEqual([SCORING_ENFORCEMENT.classRule.standing, SCORING_ENFORCEMENT.classRule.by, SCORING_ENFORCEMENT.his.citedAs], ['DRAFT', 'OURS', 'his reply filed 4 November 2026, item 7'])
    assert.deepEqual(SCORING_REASON_HEAD, { MISSING_OR_ALTERED: 'CS-SCORING-COMPONENTS (missing or altered requirement): ', VERIFICATION_FAILURE: 'CS-SCORING-COMPONENTS (verification failure): ' })
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
        // Round 4: nor the enforcement's classes, nor the safeguard's words, anywhere in a coach's answer.
        for (const [where, answer] of answers) assert.ok(!JSON.stringify(answer).includes('failureClass') && !JSON.stringify(answer).includes('his reply filed 5 November 2026'), `${label}: ${where} carries no class of the enforcement`)
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
    type Blocks = { blockId: string; account: BlockRequirementAccount | null; enforcement?: ScoringEnforcementReading }[]
    const ofWith = (given: RequirementBindings, blocks: Blocks, outcome = 'served', refused: string[] | null = null, draftContract = false) => requirementAccountOf({ contextId: 'RPC-001', outcome, bindings: given, refused, blocks, draftContract })
    const of = (blocks: Blocks, outcome = 'served', refused: string[] | null = null) => ofWith(bindings, blocks, outcome, refused)
    // Round 3b: TEST-ONLY copies of the bindings with parts of the scoring row, or the row itself, taken out. The pure reader reads what it is given.
    const bindingsWithout = (partIds: string[]): RequirementBindings => {
        const copy: RequirementBindings = JSON.parse(JSON.stringify(bindings))
        const row = copy.contexts[0].rows.find(entry => entry.rowId === 'RPC-PROP-132')!
        row.parts = row.parts.filter(entry => !partIds.includes(entry.id))
        return copy
    }
    const withoutScoringRow = (): RequirementBindings => {
        const copy: RequirementBindings = JSON.parse(JSON.stringify(bindings))
        copy.contexts[0].rows = copy.contexts[0].rows.filter(entry => entry.rowId !== 'RPC-PROP-132')
        return copy
    }
    const partsWithout = (partIds: string[]) => (parts: BlockRequirementAccount['parts']) => parts.filter(entry => !(entry.rowId === 'RPC-PROP-132' && partIds.includes(entry.partId)))
    const failClosed = (why: string) => `${SCORING_REASON_HEAD.VERIFICATION_FAILURE}the components of RPC-001's approved scoring condition cannot be verified, so the activity is not served (fail-closed): ${why}`
    // Round 4 (his reply filed 5 November 2026, item 1): a refusal where nothing can be verified is the safeguard he approved, said so (APPROVED).
    const REFUSED_FAIL_CLOSED = ` Its components cannot be verified, so the activity was refused at the validation stage ${APPROVED}.`
    const NOTHING_ELSE = 'Only the components quoting his words are enforced, and nothing else refuses.'
    /** Round 4: each finding's class and source, in the order of the findings, one per finding, and the counts summing to them. */
    const classesOf = (built: RequirementAccount) => {
        assert.deepEqual(built.enforcement.failures.map(failure => failure.reason), built.enforcement.findings, 'one failure per finding, in their order')
        assert.equal(built.enforcement.counts.MISSING_OR_ALTERED + built.enforcement.counts.VERIFICATION_FAILURE, built.enforcement.findings.length)
        return built.enforcement.failures.map(failure => [failure.failureClass, failure.source])
    }
    const NOTHING_FOUND: ScoringEnforcementReading = { findings: [], failures: [], coachObservedOnly: [] }
    // The rebuilt blocks give back the account as served.
    assert.deepEqual(of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: second }]), account)
    // T14: the bindings file refused where the enforcement reads it, its reason said once (R3 S4); the build refused, fail-closed, and says so.
    const refusedBlocks = (enforcement?: Blocks[number]['enforcement']): Blocks => [
        { blockId: first.blockId, account: { ...first, status: 'BINDINGS_REFUSED', reasons: ['TEST-ONLY'], parts: [] }, ...(enforcement ? { enforcement } : {}) },
        { blockId: second.blockId, account: { ...second, status: 'BINDINGS_REFUSED', reasons: ['TEST-ONLY'], parts: [] }, ...(enforcement ? { enforcement } : {}) },
    ]
    const refused = of(refusedBlocks(), 'validation', ['TEST-ONLY'])
    assert.deepEqual([refused.status, refused.parts.length, refused.summary.scoringConditionCarried, refused.reasons], ['BINDINGS_REFUSED', 0, false, ['TEST-ONLY']])
    assert.equal(refused.summary.headline, `The requirement account could not be computed: the bindings file was refused. The components of the approved scoring condition cannot be verified where the enforcement reads them, so the activity was refused at the validation stage ${APPROVED}.`)
    assert.deepEqual(refused.enforcement.findings, [failClosed('the requirement bindings were refused: TEST-ONLY')])
    assert.deepEqual([classesOf(refused), refused.enforcement.failures[0].blocks, refused.enforcement.counts], [[['VERIFICATION_FAILURE', 'BINDINGS_REFUSED']], [first.blockId, second.blockId], { MISSING_OR_ALTERED: 0, VERIFICATION_FAILURE: 1 }])
    // Round 3b (R1 S1): refused for the report, but no reason reaches what the enforcement reads — the build's own reading, handed in, found nothing.
    const refusedElsewhere = of(refusedBlocks(NOTHING_FOUND), 'served', ['TEST-ONLY'])
    assert.deepEqual([refusedElsewhere.status, refusedElsewhere.enforcement.findings, classesOf(refusedElsewhere)], ['BINDINGS_REFUSED', [], []])
    assert.equal(refusedElsewhere.summary.headline, "The requirement account could not be computed: the bindings file was refused. No reason of the gate reaches what the enforcement reads, so the approved scoring condition's components were enforced from the file as read, and nothing was refused.")
    // M3: a scoring row the bindings do not classify (as a TEST-ONLY draft build over the production file shows it): refused, fail-closed (R3 S2).
    const unbound = (parts: BlockRequirementAccount['parts']) => [
        ...parts.filter(entry => entry.rowId !== 'RPC-PROP-132'),
        { ...parts.find(entry => entry.rowId === 'RPC-PROP-132')!, partId: 'not-classified', kind: 'NO_BINDING' as const, component: null, rowSpan: null, account: 4 as const, facets: [], cause: { kind: 'NO_BINDING' as const, detail: 'TEST-ONLY' } },
    ]
    const notClassified = ofWith(withoutScoringRow(), [{ blockId: first.blockId, account: block(first, unbound) }], 'validation')
    assert.deepEqual([notClassified.summary.scoringCondition!.state, notClassified.summary.scoringConditionCarried], ['NOT_CLASSIFIED', false])
    assert.equal(notClassified.summary.headline, `The approved scoring condition has not been classified into components for this context, so whether its components are carried is not accounted.${REFUSED_FAIL_CLOSED}`)
    assert.deepEqual(notClassified.enforcement.findings, [failClosed('RPC-PROP-132 is not classified into components in docs/audits/requirement-bindings.json')])
    assert.deepEqual(classesOf(notClassified), [['VERIFICATION_FAILURE', 'NOT_CLASSIFIED']])
    // M3, re-pointed in round 3b (the round-3 review's R2 M1): only coach-observed parts on the scoring row. The three components they classify are
    // reported, never refused; only the origin's words, which no part classifies, refuse — fail-closed.
    const structuralParts = ['origin', 'episode-ends-on-loss', 'progression', 'control', 'exclusion']
    const observedOnly = ofWith(bindingsWithout(structuralParts), [{ blockId: first.blockId, account: block(first, partsWithout(structuralParts)) }], 'validation')
    assert.deepEqual([observedOnly.summary.scoringCondition!.state, observedOnly.summary.scoringConditionCarried], ['NO_STRUCTURAL_COMPONENT', false])
    assert.equal(observedOnly.summary.headline, `No component of the approved scoring condition is structurally represented.${REFUSED_FAIL_CLOSED}`)
    assert.deepEqual(observedOnly.enforcement.findings, [failClosed('words of RPC-PROP-132 that no part classifies: "Initiated from the goalkeeper or a controlled defensive restart"')])
    assert.deepEqual(classesOf(observedOnly), [['VERIFICATION_FAILURE', 'UNCLASSIFIED_WORDS']])
    assert.deepEqual(observedOnly.enforcement.coachObservedOnly.map(entry => entry.component), ['progression', 'control', 'exclusion'])
    assert.deepEqual(observedOnly.summary.scoringCondition!.notStructurallyRepresented.map(entry => entry.component), ['progression', 'control', 'exclusion'])
    // Round 3b (R2 M1), the control component classified only for coach observation: reported and flagged as judged in play, never refused.
    const coachOnly = ofWith(bindingsWithout(['control']), [first, second].map(entry => ({ blockId: entry.blockId, account: block(entry, partsWithout(['control'])) })))
    assert.deepEqual([coachOnly.enforcement.findings, coachOnly.enforcement.coachObservedOnly], [[], [{ rowId: 'RPC-PROP-132', component: 'control', partId: 'control-in-play', words: 'with possession controlled on arrival' }]])
    assert.deepEqual([classesOf(coachOnly), coachOnly.enforcement.counts], [[], { MISSING_OR_ALTERED: 0, VERIFICATION_FAILURE: 0 }])
    assert.deepEqual([coachOnly.summary.scoringCondition!.uncoveredWords, coachOnly.summary.scoringConditionCarried, coachOnly.summary.scoringCondition!.notStructurallyRepresented.map(entry => entry.component)], ['with possession controlled on arrival', false, ['control']])
    assert.equal(coachOnly.summary.headline, `Words of the approved scoring condition classified for coach observation only: "with possession controlled on arrival". They are judged in play, reported and not enforced (his item 7). ${NOTHING_ELSE}`)
    // Round 3c (the recheck's S-A): coverage is read in no order. Control's span cut to "with possession controlled", its in-play observable intact:
    // "on arrival" is classified by the coach-observed part — reported word by word, never refused, and no false "no part classifies".
    const cutBindings: RequirementBindings = JSON.parse(JSON.stringify(bindings))
    cutBindings.contexts[0].rows.find(entry => entry.rowId === 'RPC-PROP-132')!.parts.find(entry => entry.id === 'control')!.rowSpan = 'with possession controlled'
    const cutParts = (parts: BlockRequirementAccount['parts']) => parts.map(entry => (entry.rowId === 'RPC-PROP-132' && entry.partId === 'control' ? { ...entry, rowSpan: 'with possession controlled' } : entry))
    const cut = ofWith(cutBindings, [first, second].map(entry => ({ blockId: entry.blockId, account: block(entry, cutParts) })), 'served')
    assert.deepEqual([cut.enforcement.findings, cut.enforcement.coachObservedOnly], [[], [{ rowId: 'RPC-PROP-132', component: 'control', partId: 'control-in-play', words: 'on arrival' }]])
    assert.ok(!cut.summary.headline.includes('no part classifies') && !cut.enforcement.findings.some(finding => finding.includes('no part classifies')), 'no false reason')
    assert.deepEqual([cut.summary.scoringCondition!.uncoveredWords, cut.summary.scoringConditionCarried], ['on arrival', false])
    assert.equal(cut.summary.headline, `Words of the approved scoring condition classified for coach observation only: "on arrival". They are judged in play, reported and not enforced (his item 7). ${NOTHING_ELSE}`)
    // M3: one block stopped before the guard.
    const halfway = of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: null }], 'validation')
    assert.deepEqual([halfway.summary.scoringCondition!.unaccountedBlocks, halfway.summary.scoringConditionCarried, halfway.blocksWithoutAccount], [[second.blockId], false, [{ blockId: second.blockId, why: 'it stopped before the context scoring guard' }]])
    assert.equal(halfway.summary.headline, `Block 2 of 2 was not accounted: it stopped before the context scoring guard. ${NOTHING_ELSE}`, 'counted, never named by its role holders (R3 NIT 10)')
    // The components read 4 in no block they were not accounted in, and the unaccounted block is not counted favourable (R1 NIT 1).
    assert.ok(halfway.summary.scoringCondition!.components.every(entry => entry.perBlock.length === 1 && entry.perBlock[0].blockId === first.blockId))
    // M3: a component missing in one block: named first, block by block; what the build refused on is that very block's; the headline says it refused.
    const missingInOne = of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: block(second, parts => parts.map(entry => (entry.partId === 'control' ? { ...entry, account: 4, countsAsSatisfied: false, cause: { kind: 'NOT_CARRIED', detail: 'TEST-ONLY' } } : entry))) }], 'validation')
    assert.deepEqual(missingInOne.summary.scoringCondition!.missing.map(entry => [entry.component, entry.blocks, entry.cause.kind]), [['control', [second.blockId], 'NOT_CARRIED']])
    assert.deepEqual(missingInOne.summary.blocksDisagree.map(entry => entry.partId), ['control'])
    assert.equal(missingInOne.summary.scoringConditionCarried, false)
    assert.deepEqual(missingInOne.enforcement.findings, [`${SCORING_REASON_HEAD.MISSING_OR_ALTERED}the control component of RPC-001's approved scoring condition (RPC-PROP-132), "with possession controlled on arrival", is missing from the activity as built: TEST-ONLY`])
    assert.equal(missingInOne.summary.headline, 'Missing or altered in the approved scoring condition: With possession controlled on arrival. The activity was refused at the validation stage: a missing or altered component of an approved scoring condition is enforced.')
    // Round 4: a stand-in part read 4 with no failing facet recorded follows its cause — missing or altered (the design review's S1), from block 2 only.
    assert.deepEqual([classesOf(missingInOne), missingInOne.enforcement.failures[0].blocks, missingInOne.enforcement.failures[0].cause], [[['MISSING_OR_ALTERED', 'COMPONENT']], [second.blockId], 'NOT_CARRIED'])
    // Round 3b: a component the bindings bind but a block's account does not hold is not accounted there, and refuses. Round 4: unverified.
    const unread = of([{ blockId: first.blockId, account: block(first, partsWithout(['control'])) }], 'validation')
    assert.deepEqual(unread.enforcement.findings, [`${SCORING_REASON_HEAD.VERIFICATION_FAILURE}the control component of RPC-001's approved scoring condition (RPC-PROP-132), "with possession controlled on arrival", is not accounted in this block: the control part is bound but was not read in this block`])
    assert.deepEqual(classesOf(unread), [['VERIFICATION_FAILURE', 'PART_NOT_READ']])
    // Round 4: a part read as not carried with no cause recorded is not established either (unreachable on a real build).
    const causeless = of([{ blockId: first.blockId, account: block(first, parts => parts.map(entry => (entry.partId === 'control' ? { ...entry, account: 4, cause: null } : entry))) }], 'validation')
    assert.deepEqual(causeless.enforcement.findings, [`${SCORING_REASON_HEAD.VERIFICATION_FAILURE}the control component of RPC-001's approved scoring condition (RPC-PROP-132), "with possession controlled on arrival", cannot be verified (it was read as not carried with no cause recorded): not carried`])
    assert.deepEqual(classesOf(causeless), [['VERIFICATION_FAILURE', 'READ_WITHOUT_CAUSE']])
    // The fix round (the R3 review's S-3; stand-ins for branches no production build reaches): an event-kind part read 4 is missing or altered
    // where the guard read an event the context does not approve, and a verification failure where it reports findings this enforcement does
    // not type; a part whose cause says its classification or evidence is missing is a verification failure.
    const kindStandIn = (approved: boolean) => (parts: BlockRequirementAccount['parts']) =>
        parts.map(entry =>
            entry.partId === 'control'
                ? { ...entry, kind: 'GUARD_EVENT_KIND' as const, account: 4 as const, countsAsSatisfied: false, facets: [], guard: { kind: 'TEST-ONLY', approvedEvents: [], approved, roleEvents: [], alsoCounts: [], findings: approved ? ['TEST-ONLY'] : [], relationshipIds: [] }, cause: { kind: 'NOT_CARRIED' as const, detail: 'TEST-ONLY' } }
                : entry,
        )
    const unapprovedKind = of([{ blockId: first.blockId, account: block(first, kindStandIn(false)) }], 'validation')
    assert.deepEqual([classesOf(unapprovedKind), unapprovedKind.enforcement.failures[0].because], [[['MISSING_OR_ALTERED', 'COMPONENT']], 'Read on the realized scoring event: it is not one the context approves (ours, DRAFT).'])
    const untypedKind = of([{ blockId: first.blockId, account: block(first, kindStandIn(true)) }], 'validation')
    assert.deepEqual(classesOf(untypedKind), [['VERIFICATION_FAILURE', 'COMPONENT']])
    assert.ok(untypedKind.enforcement.findings[0].includes("cannot be verified (the guard's reading reports findings this enforcement does not type)"), untypedKind.enforcement.findings[0])
    const knowledgeMissing = of([{ blockId: first.blockId, account: block(first, parts => parts.map(entry => (entry.partId === 'control' ? { ...entry, account: 4, countsAsSatisfied: false, cause: { kind: 'MISSING_KNOWLEDGE', detail: 'TEST-ONLY' } } : entry))) }], 'validation')
    assert.deepEqual([classesOf(knowledgeMissing), knowledgeMissing.enforcement.failures[0].cause], [[['VERIFICATION_FAILURE', 'COMPONENT']], 'MISSING_KNOWLEDGE'])
    assert.ok(knowledgeMissing.enforcement.findings[0].includes('cannot be verified (its cause, MISSING_KNOWLEDGE, says its classification or evidence is missing)'), knowledgeMissing.enforcement.findings[0])
    // A TEST-ONLY draft contract is reported only: nothing is enforced, whatever is missing, and the account says it is a report only.
    const draft = ofWith(bindings, [{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: block(second, parts => parts.map(entry => (entry.partId === 'control' ? { ...entry, account: 4, countsAsSatisfied: false, cause: { kind: 'NOT_CARRIED', detail: 'TEST-ONLY' } } : entry))) }], 'communication', null, true)
    assert.deepEqual([draft.status, draft.enforcement.applied, draft.enforcement.findings, draft.enforcement.failures, draft.enforcement.counts], ['REPORT_ONLY', false, [], [], { MISSING_OR_ALTERED: 0, VERIFICATION_FAILURE: 0 }])
    assert.equal(draft.summary.headline, 'Missing from the approved scoring condition: With possession controlled on arrival. The activity was refused at the communication stage without it. This account refuses nothing.')
    // A block's ERROR: the account says the reader failed, carries no parts, and (with no reading of the build's own) the build refused, fail-closed.
    const erroredBlock = { blockId: first.blockId, account: { ...first, status: 'ERROR' as const, reasons: ['TEST-ONLY'], parts: [] } }
    const errored = of([erroredBlock], 'validation')
    assert.deepEqual([errored.status, errored.parts.length, errored.summary.headline], ['ERROR', 0, `The requirement account could not be computed: the reader failed. Whether the components were carried could not be fully read, so the activity was refused at the validation stage ${APPROVED}.`])
    assert.deepEqual(classesOf(errored), [['VERIFICATION_FAILURE', 'READER_FAILED']])
    // Round 3b (R1 S2): the full reading failed, but the build read the components on their own and they were carried: nothing refused.
    const erroredReadAlone = of([{ ...erroredBlock, enforcement: NOTHING_FOUND }])
    assert.deepEqual([erroredReadAlone.status, erroredReadAlone.enforcement.findings, erroredReadAlone.summary.headline], ['ERROR', [], "The requirement account could not be computed: the reader failed. The approved scoring condition's components were read on their own and were carried, so nothing was refused."])
    // Round 4 (the design review's S4): a reading handed in in an older shape, without classes, is read defensively — an UNTYPED verification
    // failure, never a throw into the account's own ERROR.
    const untyped = of([{ ...erroredBlock, enforcement: { findings: ['TEST-ONLY: a finding without a class'], coachObservedOnly: [] } as unknown as ScoringEnforcementReading }], 'validation')
    assert.deepEqual([untyped.status, classesOf(untyped), untyped.enforcement.failures[0].blocks], ['ERROR', [['VERIFICATION_FAILURE', 'UNTYPED']], [first.blockId]])
    // Round 2, R3 S2: a block that lacks a part another block has reads 4 for it, never the favourable value; the component is named missing.
    const lacking = of([{ blockId: first.blockId, account: block(first, parts => parts.filter(entry => entry.partId !== 'control')) }, { blockId: second.blockId, account: second }])
    const control = lacking.parts.find(entry => entry.partId === 'control')!
    assert.deepEqual([control.account, control.satisfied, control.perBlock.map(entry => [entry.blockId, entry.account]), control.cause!.kind], [4, 'NO', [[first.blockId, 4], [second.blockId, 1]], 'NO_BINDING'])
    assert.equal(control.cause!.detail, 'block 1 of 2 holds no such part, so it is not accounted there')
    assert.deepEqual([lacking.summary.scoringCondition!.missing.map(entry => [entry.component, entry.blocks]), lacking.summary.scoringConditionCarried], [[['control', [first.blockId]]], false])
    // Round 4: block 1 holds no control part, so the enforcement could not check it there — not verifiable, never "missing or altered".
    assert.deepEqual(classesOf(lacking), [['VERIFICATION_FAILURE', 'PART_NOT_READ']])
    const controlLabel = lacking.summary.scoringCondition!.missing[0].label
    assert.equal(lacking.summary.headline, `Not verifiable in the approved scoring condition: ${controlLabel}. ${VERIFICATION_SENTENCE}`)
    // Round 2, R1 S1, re-pointed in round 3b: a component dropped from the bindings and every block, its coach-observed part with it, leaves words
    // that no part classifies: never "every component carried", and the build refuses, fail-closed.
    const droppedParts = ['control', 'control-in-play']
    const droppedBlocks = (outcome: string, draftContract = false) => ofWith(bindingsWithout(droppedParts), [first, second].map(entry => ({ blockId: entry.blockId, account: block(entry, partsWithout(droppedParts)) })), outcome, null, draftContract)
    const dropped = droppedBlocks('validation')
    assert.deepEqual([dropped.summary.scoringCondition!.missing, dropped.summary.scoringCondition!.uncoveredWords, dropped.summary.scoringConditionCarried], [[], 'with possession controlled on arrival', false])
    assert.deepEqual(dropped.enforcement.findings, [failClosed('words of RPC-PROP-132 that no part classifies: "with possession controlled on arrival"')])
    assert.deepEqual(classesOf(dropped), [['VERIFICATION_FAILURE', 'UNCLASSIFIED_WORDS']])
    assert.equal(dropped.summary.headline, `Words of the approved scoring condition no component accounts for: "with possession controlled on arrival". Words no part classifies cannot be verified, so the activity was refused at the validation stage ${APPROVED}.`)
    assert.equal(droppedBlocks('served', true).summary.headline, 'Words of the approved scoring condition no component accounts for: "with possession controlled on arrival". Whether they are carried by the activity as built is not accounted. This account refuses nothing.')
    // Round 2, R1 NIT 2: a refused activity's carried headline says it was refused.
    const refusedLater = of([{ blockId: first.blockId, account: first }, { blockId: second.blockId, account: second }], 'communication')
    assert.ok(refusedLater.summary.headline.startsWith('Every component of the approved scoring condition is carried by the activity as built (refused at the communication stage).'), refusedLater.summary.headline)
})

// ── T15: the headline in his two classes never passes over a component the report found missing (round 4; the design review's M3) ─────────
test('T15 (round 4, the fix round): a component missing through a part that is not enforced is named in every refusal headline as reported and not enforced — beside a missing or altered one, beside a verification failure, and beside a verification failure of its own enforced part; both classes said where both occur', () => {
    const bindings = loadRequirementBindings()
    const account = accountOf(zone)
    const [first, second]: BlockRequirementAccount[] = account.blocks.map(({ partsIdenticalToMerged: _same, ...entry }) => ({
        ...entry,
        parts: account.parts.map(({ perBlock, ...merged }) => ({ ...merged, account: perBlock.find(block => block.blockId === entry.blockId)!.account })),
    }))
    type Parts = BlockRequirementAccount['parts']
    const block = (base: BlockRequirementAccount, ...changes: ((parts: Parts) => Parts)[]): BlockRequirementAccount => ({ ...JSON.parse(JSON.stringify(base)), parts: changes.reduce((parts, change) => change(parts), JSON.parse(JSON.stringify(base.parts)) as Parts) })
    const of = (blocks: BlockRequirementAccount[]) => requirementAccountOf({ contextId: 'RPC-001', outcome: 'validation', bindings, refused: null, blocks: blocks.map(entry => ({ blockId: entry.blockId, account: entry })), draftContract: false })
    // TEST-ONLY stand-ins on the pure function. The episode ending on a turnover read 4 (as the M2 control reads it on the finished game): a
    // part of the origin component, reported and never enforced.
    const lossMissing = (parts: Parts): Parts => parts.map(entry => (entry.partId === 'episode-ends-on-loss' ? { ...entry, account: 4, countsAsSatisfied: false, cause: { kind: 'NOT_CARRIED', detail: 'TEST-ONLY: the turnover begins no new episode' } } : entry))
    // An enforced component shown missing: no failing facet recorded, so it follows its cause.
    const shownMissing = (partId: string) => (parts: Parts): Parts => parts.map(entry => (entry.partId === partId ? { ...entry, account: 4, countsAsSatisfied: false, cause: { kind: 'NOT_CARRIED', detail: 'TEST-ONLY' } } : entry))
    // An enforced component whose only failing facet could not be established (its engine check absent).
    const notEstablished = (partId: string) => (parts: Parts): Parts =>
        parts.map(entry =>
            entry.partId === partId
                ? { ...entry, account: 4, countsAsSatisfied: false, cause: { kind: 'NOT_CARRIED', detail: 'TEST-ONLY' }, facets: entry.facets.map((facet, at) => (at === entry.facets.length - 1 ? { ...facet, account: 4 as const, carriers: [], cause: 'NOT_CARRIED' as const, unverified: ["TEST-ONLY: the engine's check is absent"] } : facet)) }
                : entry,
        )
    const labels = (built: RequirementAccount) => Object.fromEntries(built.summary.scoringCondition!.components.map(entry => [entry.component, entry.label]))
    const REPORTED = 'Missing from the approved scoring condition, reported and not enforced: '

    // Reported only: served, the origin named missing, nothing refused (as the M2 control pins it).
    const reported = of([block(first, lossMissing), second])
    assert.deepEqual([reported.enforcement.findings, reported.summary.scoringCondition!.missing.map(entry => entry.component)], [[], ['origin']])

    // Beside a missing or altered component: the fix round (the R2 review's S2) — "Missing or altered" names only what a missing-or-altered finding
    // names, so it agrees with the counts; the origin, missing through a part that is not enforced, is named apart as reported and not enforced.
    const withShown = of([block(first, lossMissing, shownMissing('control')), second])
    const shownLabels = labels(withShown)
    assert.deepEqual([withShown.enforcement.failures.map(failure => [failure.failureClass, failure.component]), withShown.enforcement.counts], [[['MISSING_OR_ALTERED', 'control']], { MISSING_OR_ALTERED: 1, VERIFICATION_FAILURE: 0 }])
    assert.equal(withShown.summary.headline, `Missing or altered in the approved scoring condition: ${shownLabels.control}. ${REPORTED}${shownLabels.origin}. ${MISSING_SENTENCE}`)
    assert.ok(shownLabels.origin.endsWith('(ours, DRAFT)'), 'the origin is named by the part that failed, ours, beside his words (R2 S2)')

    // Beside a verification failure only: the unverified component said so, and the origin named as reported and not enforced — never dropped.
    const withUnverified = of([block(first, lossMissing, notEstablished('control')), second])
    const unverifiedLabels = labels(withUnverified)
    assert.deepEqual(withUnverified.enforcement.failures.map(failure => [failure.failureClass, failure.source, failure.component]), [['VERIFICATION_FAILURE', 'COMPONENT', 'control']])
    assert.ok(withUnverified.enforcement.findings[0].startsWith(`${SCORING_REASON_HEAD.VERIFICATION_FAILURE}the control component of RPC-001's approved scoring condition (RPC-PROP-132), "with possession controlled on arrival", cannot be verified (`), withUnverified.enforcement.findings[0])
    assert.ok(withUnverified.enforcement.findings[0].includes("TEST-ONLY: the engine's check is absent"), withUnverified.enforcement.findings[0])
    assert.equal(withUnverified.summary.headline, `Not verifiable in the approved scoring condition: ${unverifiedLabels.control}. ${REPORTED}${unverifiedLabels.origin}. ${VERIFICATION_SENTENCE}`)

    // Both classes, and the reported origin: each named in its place, the sentence saying both refuse; one component under each class, as counted.
    const both = of([block(first, lossMissing, shownMissing('control'), notEstablished('progression')), second])
    const bothLabels = labels(both)
    assert.deepEqual(both.enforcement.failures.map(failure => [failure.failureClass, failure.component]), [['VERIFICATION_FAILURE', 'progression'], ['MISSING_OR_ALTERED', 'control']])
    assert.deepEqual(both.enforcement.counts, { MISSING_OR_ALTERED: 1, VERIFICATION_FAILURE: 1 })
    assert.equal(both.summary.headline, `Missing or altered in the approved scoring condition: ${bothLabels.control}. Not verifiable: ${bothLabels.progression}. ${REPORTED}${bothLabels.origin}. ${BOTH}`)

    // The fix round (the R1 review's S1), decided part by part: the origin's enforced part could not be established AND its reported part (the
    // episode ending on a turnover) is shown missing. The origin is said not verifiable, and its reported, demonstrable miss is named too, by
    // that part — never dropped because its component also has a verification failure.
    const mixed = of([block(first, lossMissing, notEstablished('origin')), second])
    assert.deepEqual(mixed.summary.scoringCondition!.missing.map(entry => entry.component), ['origin'])
    assert.deepEqual(mixed.enforcement.failures.map(failure => [failure.failureClass, failure.source, failure.component]), [['VERIFICATION_FAILURE', 'COMPONENT', 'origin']])
    const originPart = mixed.parts.find(entry => entry.partId === 'origin')!
    const lossPart = mixed.parts.find(entry => entry.partId === 'episode-ends-on-loss')!
    assert.equal(
        mixed.summary.headline,
        `Not verifiable in the approved scoring condition: ${labels(mixed).origin}. ${REPORTED}${originPart.partLabel}: ${lossPart.partLabel} (ours, DRAFT). ${VERIFICATION_SENTENCE}`,
    )
})

console.log = quiet
console.log(`requirement-account unit tests: ${passed} passed.`)
