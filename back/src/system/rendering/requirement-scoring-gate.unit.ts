/**
 * **The CI gate: no production-contracted context's build may reach the context-scoring guard with a component of its approved scoring
 * condition missing** — 29 October 2026 (the R-rulings review's M3); round 3, 29 October 2026 (his reply filed 4 November 2026).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Missing components of approved scoring conditions should not silently pass."*
 * Round 3, his reply filed 4 November 2026, item 7: *"I approve beginning narrowly with missing or altered components of approved scoring
 * conditions, where those components are clearly defined, structurally necessary, and mechanically verifiable."* *"Please confirm that the
 * relevant tests pass before enabling these refusals in the checked pathway."* So the build now refuses at runtime, and this gate holds the
 * real corpus to it from the other side: no build of the session matrix is refused by that enforcement (the approved activities carry every
 * component), the administrator's account says the enforcement was applied and found nothing, and the coach's build of every session ends
 * where the administrator's does, never refused on a component (*"please verify that this change does not alter the approved Play Out from
 * the Back activity."*).
 *
 * General: no context, goal or session is named. For every context with a production contract, every guided Learning Goal his workbook
 * routes to it is built through the review route's own administrator build (`reviewActivity` with drafts) over the regression snapshot's
 * session matrix — the roles matrix with no objects stated; the second roles case with none of each object kind, one 5 m object of each
 * kind, and one object of each choice an authorized pairing offers (at 12 and 11 players); and none of each kind stated in the review's
 * answer. Every build that reaches the guard (carries the account) must account its approved scoring condition as classified, with no
 * component missing, every word of his row some component's or one a coach-observed part alone classifies (reported, never failed: round 3c,
 * the rule the runtime keeps), and every block accounted; a build without the account must have stopped
 * before realization (round 2, R1 S1 and S3). And at least one build of each such context must reach the guard, so the gate is never
 * vacuous. Round 4 (his reply filed 5 November 2026, item 1): the enforcement's findings now carry his two classes, and the gate fails on a
 * finding of either, exactly as it failed before.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/requirement-scoring-gate.unit.ts
 */
import assert from 'node:assert/strict'

import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { rpcLibrary } from '../sport-module/rpc-library'
import { reviewActivity } from './activity-review'
import { BlockRequirementAccount, RequirementAccount, requirementAccountOf, SCORING_COMPONENTS_CHECK } from './requirement-account'
import { loadRequirementBindings, productionContractedContexts, RequirementBindings } from './requirement-bindings'
import { sessionResourceKinds, specializedRoleNames } from './session-envelope'
import { sessionObjectChoices } from './session-object-choices'

const quiet = console.log
console.log = () => undefined
quiet('the CI gate on missing scoring-condition components (enforced at runtime since round 3)')

const roles = specializedRoleNames()
const matrix = [{ id: 'roles-none', roles: Object.fromEntries(roles.map(role => [role, 0])) }, ...roles.flatMap(role => [1, 2].map(availability => ({ id: `${role}-${availability}`, roles: Object.fromEntries(roles.map(name => [name, name === role ? availability : 0])) })))]
const [, withRoles] = matrix
const kinds = sessionResourceKinds()
const noneOfEach = Object.fromEntries(kinds.map(kind => [kind, { count: 0 }]))
const pairingCases = sessionObjectChoices().kinds.flatMap(entry => entry.choices.filter(choice => Array.isArray((choice as any).from) && (choice as any).from.length).map(choice => ({ id: `objects-${choice.id}`, objects: { [entry.kind]: { count: 1, ...(choice as any).states } } })))
const sessions: { id: string; stored: any; objects?: Record<string, unknown> }[] = [
    ...matrix.map(entry => ({ id: entry.id, stored: { playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: entry.roles } })),
    ...[{ id: 'objects-none', objects: noneOfEach }, { id: 'objects-one', objects: Object.fromEntries(kinds.map(kind => [kind, { count: 1, widthM: 5 }])) }, ...pairingCases].flatMap(entry =>
        [12, 11].map(players => ({ id: `${withRoles.id}/${players}/${entry.id}`, stored: { playerCount: players, fieldLength: '40', fieldWidth: '30', specializedRoles: withRoles.roles, objects: entry.objects } })),
    ),
    { id: `${withRoles.id}/answered-none`, stored: { playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: withRoles.roles }, objects: noneOfEach },
]

const BEFORE_REALIZATION = ['session', 'selection', 'knowledge', 'structure', 'realization']
const contexts = productionContractedContexts()
assert.ok(contexts.length >= 1, 'at least one context has a production contract')
const guided = new Set((sessionPlanningModel.learningGoals() as any[]).map(goal => String(goal.ID)).filter(id => sessionPlanningModel.practiceSituationsFor(id).length > 0))
let checked = 0
let servedCoach = 0
const reportedCoachOnly: string[] = []
let firstAccount: { account: RequirementAccount; contextId: string } | null = null

/** What the gate holds every account that reached the guard to. */
function holdToGate(account: RequirementAccount, where: string): void {
    const scoring = account.summary.scoringCondition
    // Round 3b: a report, of which the approved scoring condition's components were enforced on this build.
    assert.equal(account.status, 'REPORT_AND_ENFORCEMENT', `${where}: ${account.summary.headline}`)
    assert.equal(scoring?.state, 'ACCOUNTED', `${where}: the approved scoring condition is classified (${account.summary.headline})`)
    assert.deepEqual(scoring!.missing, [], `${where}: ${account.summary.headline}`)
    assert.deepEqual(scoring!.unaccountedBlocks, [], `${where}: every block reached the guard`)
    // Round 3: the enforcement was applied to this build, and found nothing — no enforced component missing or altered, and no word of his
    // row that no part classifies (both are its findings).
    assert.deepEqual([account.enforcement.applied, account.enforcement.findings], [true, []], `${where}: ${account.enforcement.findings.join(' | ')}`)
    // Round 4 (his reply filed 5 November 2026, item 1): so nothing in either of his two classes — a finding of any class fails the gate.
    assert.deepEqual([account.enforcement.failures, account.enforcement.counts], [[], { MISSING_OR_ALTERED: 0, VERIFICATION_FAILURE: 0 }], where)
    /**
     * Round 2, R1 S1, held since round 3c to the rule the runtime keeps (the recheck's S-B; his reply filed 4 November 2026, item 7: "I would
     * not yet extend refusal to every unsupported purpose statement, inferred affordance relationship, or coach-observed condition."): every
     * word of his approved scoring condition is a structural component's, or one a coach-observed part alone classifies — reported, never
     * refused. The gate fails on any other uncovered word, and the condition reads carried exactly where no word is left to coach observation.
     */
    const coachOnlyWords = new Set(account.enforcement.coachObservedOnly.flatMap(entry => entry.words.split(' ')))
    const uncovered = scoring!.uncoveredWords === null ? [] : scoring!.uncoveredWords.split(' ')
    assert.ok(uncovered.every(word => coachOnlyWords.has(word)), `${where}: uncovered "${scoring!.uncoveredWords}", coach-observed only ${JSON.stringify(account.enforcement.coachObservedOnly)}`)
    assert.equal(account.summary.scoringConditionCarried, uncovered.length === 0, `${where}: ${account.summary.headline}`)
}
for (const context of contexts) {
    const goals = rpcLibrary.relationships(context, 'LEARNING_GOAL').map(relationship => relationship.relatedId).filter(id => guided.has(id))
    assert.ok(goals.length >= 1, `${context}: his workbook routes at least one guided goal to it`)
    let reached = 0
    const servedBefore = servedCoach
    for (const goalId of goals) {
        for (const entry of sessions) {
            const body = { learningGoalId: goalId, durationMin: 20, ...(entry.objects ? { objects: entry.objects } : {}) } as any
            const activity = reviewActivity(entry.stored, body, { includeDrafts: true })
            const account = activity.requirementAccount
            const where = `${context} ${goalId} ${entry.id} (${activity.outcome === 'served' ? 'served' : activity.stage})`
            // Round 3: the coach's build of the same session ends where the administrator's does, and neither is refused on a component.
            const coach = reviewActivity(entry.stored, body)
            assert.deepEqual([coach.outcome, coach.outcome === 'refused' ? coach.stage : null], [activity.outcome, activity.outcome === 'refused' ? activity.stage : null], `${where}: the coach's build ends where the administrator's does`)
            for (const built of [activity, coach]) assert.ok(built.outcome === 'served' || !built.reasons.some(reason => reason.includes(SCORING_COMPONENTS_CHECK)), `${where}: refused on a component: ${built.outcome === 'refused' ? built.reasons.join(' | ') : ''}`)
            if (coach.outcome === 'served') servedCoach++
            if (!account) {
                // Round 2, R1 S3: an account is absent only where the build stopped before realization, never on a served build.
                assert.equal(activity.outcome, 'refused', `${where}: a served build reached the guard, so it carries the account`)
                assert.ok(BEFORE_REALIZATION.includes((activity as any).stage), `${where}: no account, though the build went past realization`)
                continue
            }
            reached++
            checked++
            holdToGate(account, where)
            if (account.enforcement.coachObservedOnly.length) reportedCoachOnly.push(`${where}: ${account.enforcement.coachObservedOnly.map(entry => `${entry.component} "${entry.words}"`).join('; ')}`)
            if (!firstAccount) firstAccount = { account, contextId: context }
        }
    }
    assert.ok(reached >= 1, `${context}: at least one build reaches the guard, so the gate is not vacuous`)
    // Round 3b (the round-3 review's R1 NIT 4): and at least one coach's build is served, so "served alike" is not vacuous either. Round 3c
    // (the recheck's NIT a): counted for this context alone.
    assert.ok(servedCoach - servedBefore >= 1, `${context}: at least one coach's build is served`)
}

/**
 * Round 3c (the recheck's S-B): the gate's own rule, shown on TEST-ONLY accounts the pure reader makes from a real one. A component classified
 * only for coach observation is reported and passes; the same component gone with its coach-observed part leaves words no part classifies,
 * and fails; so does an enforced component missing.
 */
{
    assert.ok(firstAccount, 'an account reached the guard')
    const { account, contextId } = firstAccount!
    const bindings = loadRequirementBindings()
    const scoringRowId = account.summary.scoringCondition!.rowId!
    const blocks: BlockRequirementAccount[] = account.blocks.map(({ partsIdenticalToMerged: _same, ...entry }) => ({ ...entry, parts: account.parts.map(({ perBlock, ...merged }) => ({ ...merged, account: perBlock.find(block => block.blockId === entry.blockId)!.account })) }))
    const enforcedPart = account.parts.find(part => part.enforced && part.rowId === scoringRowId && account.parts.some(other => other.kind === 'COACH_OBSERVED' && other.component === part.component))!
    const observedPart = account.parts.find(part => part.kind === 'COACH_OBSERVED' && part.component === enforcedPart.component)!
    const without = (partIds: string[], outcome: string) => {
        const given: RequirementBindings = JSON.parse(JSON.stringify(bindings))
        const row = given.contexts.find(entry => entry.contextId === contextId)!.rows.find(entry => entry.rowId === scoringRowId)!
        row.parts = row.parts.filter(entry => !partIds.includes(entry.id))
        const theseBlocks = blocks.map(block => ({ blockId: block.blockId, account: { ...block, parts: block.parts.filter(part => !(part.rowId === scoringRowId && partIds.includes(part.partId))) } }))
        return requirementAccountOf({ contextId, outcome, bindings: given, refused: null, blocks: theseBlocks, draftContract: false })
    }
    const coachOnly = without([enforcedPart.partId], 'served')
    holdToGate(coachOnly, 'TEST-ONLY: a component for coach observation only')
    assert.deepEqual(coachOnly.enforcement.coachObservedOnly.map(entry => [entry.component, entry.partId]), [[enforcedPart.component, observedPart.partId]], 'reported, not refused')
    const unclassified = without([enforcedPart.partId, observedPart.partId], 'validation')
    assert.throws(() => holdToGate(unclassified, 'TEST-ONLY: words no part classifies'), assert.AssertionError)
    const missing = requirementAccountOf({ contextId, outcome: 'validation', bindings, refused: null, blocks: blocks.map(block => ({ blockId: block.blockId, account: { ...block, parts: block.parts.map(part => (part.partId === enforcedPart.partId ? { ...part, account: 4 as const, cause: { kind: 'NOT_CARRIED' as const, detail: 'TEST-ONLY' } } : part)) } })), draftContract: false })
    assert.throws(() => holdToGate(missing, 'TEST-ONLY: an enforced component missing'), assert.AssertionError)
    // Round 4: the gate fails on both of his classes, as it failed on both before — a component shown missing, and words no part classifies.
    assert.deepEqual(missing.enforcement.failures.map(failure => [failure.failureClass, failure.source]), [['MISSING_OR_ALTERED', 'COMPONENT']])
    assert.deepEqual(unclassified.enforcement.failures.map(failure => [failure.failureClass, failure.source]), [['VERIFICATION_FAILURE', 'UNCLASSIFIED_WORDS']])
}

console.log = quiet
// Round 3c (S-B): components classified only for coach observation are reported here, never failed (none today).
for (const line of reportedCoachOnly) console.log(`  reported, not refused: ${line}`)
console.log(
    `requirement-scoring-gate unit tests: ${checked} builds reaching the guard checked, every enforced component carried and the enforcement finding nothing (${reportedCoachOnly.length} with a component for coach observation only); ${servedCoach} coach builds served alike, none refused on a component.`,
)
