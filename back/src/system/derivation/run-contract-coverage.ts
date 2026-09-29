/**
 * What has to be contracted before a coach's choice can reach derivation.
 *
 * The number moved when the Practice Situation bridge was built, and it moved for a reason worth
 * stating plainly: **a Practice Situation is a coach choice that changes the game.** Choosing
 * *From Goal Kicks* puts a restart, its awarded team and its play state into the representation. So
 * long as it reached generation only as a sentence in a prompt, the deterministic system could not
 * see it, and the game it produced had no goal kick in it. Now that it resolves to a canonical
 * identity, it is a selected knowledge object like any other — and it needs a contract like any
 * other.
 *
 * That is the whole of the recalculation. Nothing here chooses a pilot scope: it counts what each
 * scope would cost, including the situations, and says which objects are missing.
 *
 * Run: npm run corpus:coverage
 */
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { loadCorpusContracts } from './corpus'
import { selectFor } from './run-bounded-selection'

const key = (id: string) =>
    String(id)
        .replace(/^(restated|blind):/, '')
        .replace(/^tl-v0-constraint-/, '')
        .toUpperCase()

/** The five goals of the attacking family the bounded pilot was scoped around. */
const BOUNDED = ['A01', 'A04', 'A05', 'TA01', 'TA02']

const contracted = new Set(loadCorpusContracts().map(c => key(c.contractId)))
const guided: any[] = (sessionPlanningModel.learningGoals() as any[]).filter(g => sessionPlanningModel.practiceSituationsFor(String(g.ID)).length > 0)

interface Need {
    goalId: string
    goalName: string
    /** Knowledge the live selection commits to, without the coach's situation. */
    selection: string[]
    /** Every Practice Situation the goal offers — each one a choice a coach can actually make. */
    situations: string[]
}

function needsFor(goalId: string): Need {
    const selection = selectFor(goalId, null)
    return {
        goalId,
        goalName: selection.goalName,
        selection: selection.selected.filter(s => !s.role.startsWith('affordance lens')).map(s => s.id),
        situations: selection.practiceSituations.map(p => String(p.id)),
    }
}

function report(title: string, goalIds: string[]): void {
    const needs = goalIds.map(needsFor)
    const selectionObjects = new Set(needs.flatMap(n => n.selection))
    const situationObjects = new Set(needs.flatMap(n => n.situations))
    const all = new Set([...selectionObjects, ...situationObjects])
    const missing = [...all].filter(id => !contracted.has(key(id))).sort()
    const missingSituations = [...situationObjects].filter(id => !contracted.has(key(id))).sort()

    console.log(`\n${title}  (${goalIds.length} goal${goalIds.length === 1 ? '' : 's'})`)
    console.log('-'.repeat(78))
    for (const n of needs) {
        const have = n.selection.filter(s => contracted.has(key(s))).length
        const sitHave = n.situations.filter(s => contracted.has(key(s))).length
        console.log(`  ${n.goalId.padEnd(6)} selection ${have}/${n.selection.length}   situations ${sitHave}/${n.situations.length}   ${n.goalName}`)
    }
    console.log(`  distinct objects the selections commit to      ${selectionObjects.size}`)
    console.log(`  distinct Practice Situations a coach may pick  ${situationObjects.size}  (of which ${situationObjects.size - missingSituations.length} contracted)`)
    console.log(`  TOTAL distinct objects                         ${all.size}`)
    console.log(`  ALREADY CONTRACTED                             ${all.size - missing.length}`)
    console.log(`  STILL TO AUTHOR                                ${missing.length}`)
    console.log(`     ${missing.join(', ') || 'none'}`)
}

console.log('CONTRACT COVERAGE — what a coach choice needs before it can reach derivation')
console.log('='.repeat(78))
console.log(`contracts that exist today: ${[...contracted].sort().join(', ')}`)

report('BOUNDED ATTACKING FAMILY', BOUNDED)
report('ALL GUIDED GOALS', guided.map(g => String(g.ID)))

// The figure that makes the Practice Situation cost visible on its own.
const withoutSituations = new Set(BOUNDED.map(needsFor).flatMap(n => n.selection))
const withSituations = new Set(BOUNDED.map(needsFor).flatMap(n => [...n.selection, ...n.situations]))
console.log('\nWHAT THE PRACTICE SITUATION BRIDGE ADDED')
console.log('-'.repeat(78))
console.log(`  bounded family, ignoring the coach's situation choice   ${[...withoutSituations].filter(i => !contracted.has(key(i))).length} to author`)
console.log(`  bounded family, with every situation a coach may pick   ${[...withSituations].filter(i => !contracted.has(key(i))).length} to author`)
console.log('  The difference is the cost of the coach being able to make a choice the system can see.')
