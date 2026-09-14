/**
 * Unit tests — no guided goal depends on the model's wording to pass its constraint requirements.
 *
 * Real generation on 13 Sep, all 13 guided goals x 3 slots, four runs: Win the Ball Back and Defend
 * 1v1 retried in every one, always on the same requirement, and Win the Ball Back failed outright in
 * one. A coach picking that goal got an error instead of three activities.
 *
 * The cause was measurable without the model. The output validator checks each selected constraint's
 * requirement against the activity text, and most of that text is written by the system (scoring,
 * rules, constraint lines, decision cues). For Interception Reward, what the system wrote met the
 * requirement in 0 of 6 slots, so passing rested on the model choosing the right words. So this test
 * asserts the property that failure broke: for every guided goal, through the same context-gated
 * selection the live route uses, SYSTEM-WRITTEN text alone satisfies every constraint requirement.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import type { IAffordance } from '../../models/affordance.model'
import { ConstraintRoles, type IConstraint } from '../../models/constraint.model'
import { SessionStatus, type ISession } from '../../models/session.model'
import { buildConstraintPackage } from '../build-constraint-package'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { gateCandidateGameFormsToContext } from '../sport-module/context-selection'
import { resolvePrimaryScoringDirectives } from '../sport-module/primary-scoring'
import { generateSelection } from '../test-library/generateSelection'
import type { TestLibrarySelectionResult } from '../test-library/types'
import type { AffordanceField, SystemAssemblyInput } from '../types'
import { buildActivityMechanicsFromSkeleton } from './build-activity-mechanics'
import { buildActivitySkeleton } from './build-activity-skeleton'
import { testLibraryArchetypeToSystemDefinition } from './resolve-test-library-archetype'
import { matchesMechanicRequirement } from './validate-activity-skeleton'

type Selection = TestLibrarySelectionResult

function toConstraint(c: Selection['constraints'][number]): IConstraint {
    const d = new Date()
    const role = String(c.constraintRole).toLowerCase()
    return {
        _id: c.id,
        title: c.title,
        description: c.description,
        type: c.type,
        affordanceTagGroup: c.affordanceTagGroup,
        notes: c.notes,
        contextualAudit: c.contextualAudit,
        suggestedConstraintPrompt: c.suggestedConstraintPrompt,
        gameTemplateAnchor: c.gameTemplateAnchor.join('|'),
        designIntent: c.designIntent,
        constraintArchetype: c.constraintArchetype,
        constraintRole: role === 'structure' ? ConstraintRoles.Foundation : role === 'hybrid' ? ConstraintRoles.Shaping : ConstraintRoles.Consequence,
        createdAt: d,
        updatedAt: d,
    }
}

function toAffordance(lens: Selection['affordanceLenses'][number]): IAffordance {
    const d = new Date()
    return {
        _id: lens.id,
        title: lens.title,
        description: lens.description,
        type: lens.type,
        affordanceTagGroup: lens.affordanceTagGroup,
        notes: lens.notes,
        contextualAudit: lens.contextualAudit,
        suggestedConstraintPrompt: lens.suggestedConstraintPrompt,
        gameTemplateAnchor: lens.gameTemplateAnchor.join('|'),
        designIntent: lens.designIntent,
        createdAt: d,
        updatedAt: d,
    }
}

function assemblyInput(selection: Selection, learningGoalId: string, learningGoal: string, rpcId: string): SystemAssemblyInput {
    const archetype = testLibraryArchetypeToSystemDefinition(selection.archetype)
    const lenses = selection.affordanceLenses.map(toAffordance)
    const affordances: AffordanceField = {
        primary: lenses[0]!,
        supporting: lenses.slice(1),
        viableCandidates: lenses,
        ranked: lenses.map((affordance, i) => ({ affordance, score: 100 - i, band: i === 0 ? 'primary' : 'supporting' })),
    }
    const d = new Date()
    const session = {
        _id: 'constraint-coverage',
        createdBy: 'constraint-coverage',
        name: 'constraint coverage',
        sessionStatus: SessionStatus['In Progress'],
        playerCount: 12,
        fieldLength: '40',
        fieldWidth: '30',
        fieldType: 'grass',
        createdAt: d,
        updatedAt: d,
    } as unknown as ISession
    return {
        session,
        previousActivities: [],
        coachInput: {
            challengeLevel: 'intermediate',
            duration: 20,
            learningGoals: [learningGoal],
            learningGoalId,
            primaryScoring: resolvePrimaryScoringDirectives(rpcId, selection.archetype.game_form_id),
        },
        affordances,
        archetype,
        archetypeSelection: { selected: archetype, candidates: [], selectionKey: 'test-library-v0', selectedReason: 'constraint coverage' },
        constraintPackage: buildConstraintPackage(selection.constraints.map(toConstraint), affordances, archetype),
    } as SystemAssemblyInput
}

function testSystemTextAloneMeetsEveryConstraintRequirement(): void {
    const unmet: string[] = []
    let checked = 0
    const originalLog = console.log
    console.log = () => undefined
    try {
        for (const goal of sessionPlanningModel.learningGoals()) {
            const id = String(goal['ID'])
            const name = String(goal['Learning Goal'])
            const rpcId = sessionPlanningModel.rpcRouting().find((route) => route.learningGoalId === id)!.rpcId
            const selection = generateSelection(
                { learningGoals: [name], learningGoalId: id },
                gateCandidateGameFormsToContext(deriveInputConstraints(name), rpcId)
            )
            const skeleton = buildActivitySkeleton(assemblyInput(selection, id, name, rpcId))
            const mechanics = buildActivityMechanicsFromSkeleton(skeleton)
            skeleton.activities.forEach((slot, index) => {
                const written = mechanics.activities[index]!
                const systemText = [...written.scoring, ...written.rules, ...written.constraints, ...written.decisionCues].join('\n')
                for (const requirement of slot.requiredConstraintMechanics) {
                    checked++
                    if (!matchesMechanicRequirement(systemText, requirement)) {
                        unmet.push(`${id} ${name}, slot ${index + 1}: ${requirement.slice(0, 140)}`)
                    }
                }
            })
        }
    } finally {
        console.log = originalLog
    }
    assert.ok(checked > 300, `expected every slot's constraint requirements to be checked, got ${checked}`)
    assert.deepEqual(unmet, [], `Constraint requirements that only the model's wording could meet:\n${unmet.join('\n')}`)
}

testSystemTextAloneMeetsEveryConstraintRequirement()

console.log('guided-goal-constraint-coverage unit tests: all cases passed.')
