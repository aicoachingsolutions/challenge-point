/**
 * WHAT DOES PRIMARY SCORING RESOLVE TO, TODAY?
 *
 *   cd back && npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-primary-scoring-coverage.ts
 *
 * Deterministic: no AI, and nothing changes. Two questions, answered exactly:
 *
 *   1. For every compatible context x game form pair in the knowledge, which event each of the three
 *      activity slots scores on, and whether a realization had to supply the object.
 *
 *   2. For every guided Learning Goal sent the way the planning conversation sends it: which game form
 *      the LIVE selector picks today, whether that form is one the routed context declares compatible,
 *      and what primary scoring resolves to — or exactly why it cannot.
 *
 * Question 2 matters because selection is not yet context-gated. A goal can route to a context and
 * still land on a game form the context never declared, and where that leaves no valid event the
 * resolver refuses rather than guessing. This measures how often that happens before deciding what a
 * coach sees when it does.
 */
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from '../system/session-planning/session-planning-model'
import { gateCandidateGameFormsToContext } from '../system/sport-module/context-selection'
import { resolvePrimaryScoringDirectives } from '../system/sport-module/primary-scoring'
import { rpcLibrary } from '../system/sport-module/rpc-library'
import { generateSelection } from '../system/test-library/generateSelection'

function describe(rpcId: string, gameFormId: string): string {
    try {
        return resolvePrimaryScoringDirectives(rpcId, gameFormId)
            .map((d, i) => `slot${i + 1} ${d.eventKey}${d.objectKey ? `/${d.objectKey}` : ''}${d.realizationCoverage ? ` [${d.realizationCoverage}]` : ''}`)
            .join('  |  ')
    } catch (err) {
        return `UNRESOLVED — ${err instanceof Error ? err.message : String(err)}`
    }
}

function main(): void {
    const originalLog = console.log
    const quietly = <T>(fn: () => T): T => {
        console.log = () => undefined
        try {
            return fn()
        } finally {
            console.log = originalLog
        }
    }

    console.log(`RPC library ${rpcLibrary.libraryVersion}, runtime status ${rpcLibrary.runtimeStatus}\n`)
    console.log('1. COMPATIBLE CONTEXT x GAME FORM PAIRS')
    for (const context of rpcLibrary.contexts()) {
        for (const form of rpcLibrary.gameFormsForContext(context.id)) {
            console.log(`  ${context.id} ${context.name.padEnd(22)} ${form.relatedId.padEnd(5)} ${form.strength.padEnd(9)} ${describe(context.id, form.relatedId)}`)
        }
    }

    console.log('\n2. GUIDED LEARNING GOALS THROUGH THE LIVE SELECTOR')
    let compatible = 0
    let resolved = 0
    const goals = sessionPlanningModel.learningGoals()
    for (const goal of goals) {
        const id = String(goal['ID'])
        const name = String(goal['Learning Goal'])
        const selection = quietly(() => generateSelection({ learningGoals: [name], learningGoalId: id }, deriveInputConstraints(name)))
        const rpcId = selection.selectionTrace.planning?.routedRpcId ?? null
        const formId = selection.archetype.game_form_id
        const isCompatible = rpcId ? rpcLibrary.gameFormsForContext(rpcId).some((f) => f.relatedId === formId) : false
        const outcome = rpcId ? describe(rpcId, formId) : 'no routed context'
        if (isCompatible) compatible++
        if (!outcome.startsWith('UNRESOLVED') && rpcId) resolved++
        console.log(`\n  ${id.padEnd(5)} ${name}`)
        console.log(`        -> ${rpcId} ${rpcId ? rpcLibrary.context(rpcId)?.name : ''}; selector picks ${formId} ${selection.archetype.game_form_name} (${isCompatible ? 'compatible' : 'NOT a declared realization'})`)
        console.log(`        ${outcome}`)
    }
    console.log(`\n  ${compatible} of ${goals.length} goals land on a compatible game form; ${resolved} of ${goals.length} resolve primary scoring.`)

    console.log('\n3. THE SAME GOALS WITH GAME FORM SELECTION GATED TO THE ROUTED CONTEXT')
    let gatedResolved = 0
    for (const goal of goals) {
        const id = String(goal['ID'])
        const name = String(goal['Learning Goal'])
        const rpcId = sessionPlanningModel.rpcRouting().find((route) => route.learningGoalId === id)?.rpcId
        if (!rpcId) {
            console.log(`  ${id.padEnd(5)} ${name.padEnd(24)} no routed context`)
            continue
        }
        const hints = gateCandidateGameFormsToContext(deriveInputConstraints(name), rpcId)
        const selection = quietly(() => generateSelection({ learningGoals: [name], learningGoalId: id }, hints))
        const formId = selection.archetype.game_form_id
        const outcome = describe(rpcId, formId)
        if (!outcome.startsWith('UNRESOLVED')) gatedResolved++
        console.log(`  ${id.padEnd(5)} ${name.padEnd(24)} ${rpcId} -> ${formId.padEnd(4)} ${selection.archetype.game_form_name.padEnd(30)} ${outcome}`)
    }
    console.log(`\n  With gating: ${gatedResolved} of ${goals.length} resolve primary scoring.`)
}

main()
