/**
 * **The CI gate: no production-contracted context's build may reach the context-scoring guard with a component of its approved scoring
 * condition missing** — 29 October 2026 (the R-rulings review's M3).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Missing components of approved scoring conditions should not silently pass."* And
 * *"let's verify the classifications before enabling refusals broadly"*. So nothing is refused at runtime: in this increment a missing
 * component is shown to an administrator (the requirement account) and fails CI here, and the coach's build is neither refused nor
 * annotated until he has verified the classifications. Refusing a checked build missing a component of its approved scoring condition is
 * the first candidate for enforcement after his verification.
 *
 * General: no context, goal or session is named. For every context with a production contract, every guided Learning Goal his workbook
 * routes to it is built through the review route's own administrator build (`reviewActivity` with drafts) over the regression snapshot's
 * session matrix — the roles matrix with no objects stated; the second roles case with none of each object kind, one 5 m object of each
 * kind, and one object of each choice an authorized pairing offers (at 12 and 11 players); and none of each kind stated in the review's
 * answer. Every build that reaches the guard (carries the account) must account its approved scoring condition as classified, with no
 * component missing, every word of his row some component's, and every block accounted; a build without the account must have stopped
 * before realization (round 2, R1 S1 and S3). And at least one build of each such context must reach the guard, so the gate is never
 * vacuous.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/requirement-scoring-gate.unit.ts
 */
import assert from 'node:assert/strict'

import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { rpcLibrary } from '../sport-module/rpc-library'
import { reviewActivity } from './activity-review'
import { productionContractedContexts } from './requirement-bindings'
import { sessionResourceKinds, specializedRoleNames } from './session-envelope'
import { sessionObjectChoices } from './session-object-choices'

const quiet = console.log
console.log = () => undefined
quiet('the CI gate on missing scoring-condition components (report only at runtime)')

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
for (const context of contexts) {
    const goals = rpcLibrary.relationships(context, 'LEARNING_GOAL').map(relationship => relationship.relatedId).filter(id => guided.has(id))
    assert.ok(goals.length >= 1, `${context}: his workbook routes at least one guided goal to it`)
    let reached = 0
    for (const goalId of goals) {
        for (const entry of sessions) {
            const activity = reviewActivity(entry.stored, { learningGoalId: goalId, durationMin: 20, ...(entry.objects ? { objects: entry.objects } : {}) } as any, { includeDrafts: true })
            const account = activity.requirementAccount
            const where = `${context} ${goalId} ${entry.id} (${activity.outcome === 'served' ? 'served' : activity.stage})`
            if (!account) {
                // Round 2, R1 S3: an account is absent only where the build stopped before realization, never on a served build.
                assert.equal(activity.outcome, 'refused', `${where}: a served build reached the guard, so it carries the account`)
                assert.ok(BEFORE_REALIZATION.includes((activity as any).stage), `${where}: no account, though the build went past realization`)
                continue
            }
            reached++
            checked++
            const scoring = account.summary.scoringCondition
            assert.equal(account.status, 'REPORT_ONLY', `${where}: ${account.summary.headline}`)
            assert.equal(scoring?.state, 'ACCOUNTED', `${where}: the approved scoring condition is classified (${account.summary.headline})`)
            assert.deepEqual(scoring!.missing, [], `${where}: ${account.summary.headline}`)
            assert.deepEqual(scoring!.unaccountedBlocks, [], `${where}: every block reached the guard`)
            // Round 2, R1 S1: every word of his approved scoring condition is some component's.
            assert.equal(scoring!.uncoveredWords, null, `${where}: ${account.summary.headline}`)
            assert.equal(account.summary.scoringConditionCarried, true, `${where}: ${account.summary.headline}`)
        }
    }
    assert.ok(reached >= 1, `${context}: at least one build reaches the guard, so the gate is not vacuous`)
}

console.log = quiet
console.log(`requirement-scoring-gate unit tests: ${checked} builds reaching the guard checked, every component of the approved scoring condition carried.`)
