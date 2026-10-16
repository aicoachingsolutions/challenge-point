import assert from 'node:assert/strict'

import { SelectionKnowledgeGap } from '../test-library/generateSelection'
import { buildReportData, goalsWithoutPracticeSituationIds, guidedGoalIds, needsFor } from './run-contract-coverage'
import { GoalSelectionGap } from './run-bounded-selection'
import type { BoundedSelection } from './run-bounded-selection'

function normalSelection(): BoundedSelection {
    return {
        goalId: 'X01',
        goalName: 'A normal goal',
        selected: [
            { id: 'GF1', role: 'game form' },
            { id: 'LENS-1', role: 'affordance lens (not contracted knowledge)' },
            { id: 'C1', role: 'foundation constraint' },
        ],
        practiceSituations: [{ id: 'X01-1', name: 'A situation' }],
    } as BoundedSelection
}

function selectionGap(goalId: string = 'X02'): GoalSelectionGap {
    const gap = new SelectionKnowledgeGap(goalId, 'GF1', 'NO_AUTHORIZED_CONSTRAINTS', {
        candidateConstraintIds: [],
        authorizedConstraintIds: [],
        heldByRuling: [],
        unfilledRoles: ['foundation'],
    } as any)
    return new GoalSelectionGap(gap, `${goalId} refused goal`, null as any, null)
}

function testNormalSelectionKeepsItsNeed(): void {
    assert.deepEqual(needsFor('X01', () => normalSelection()), {
        goalId: 'X01',
        goalName: 'A normal goal',
        selection: ['GF1', 'C1'],
        situations: ['X01-1'],
    })
}

function testSelectionGapIsReported(): void {
    const error = selectionGap()
    const need = needsFor('X02', () => {
        throw error
    })

    assert.deepEqual(need.gap, { reason: error.gap.reason, detail: error.gap.message })
    assert.equal(need.goalName, error.goalName)
    assert.deepEqual(need.selection, [])
    assert.deepEqual(need.situations, [])
}

function testUnrelatedErrorIsNotSwallowed(): void {
    assert.throws(
        () => needsFor('X03', () => {
            throw new Error('selection defect')
        }),
        /selection defect/,
    )
}

// WHY: a refused goal must leave every count for the other goals exactly as it would be without it.
function testSelectionGapLeavesOtherCountsUnchanged(): void {
    const error = selectionGap()
    const selector = (goalId: string) => {
        if (goalId === 'X02') throw error
        return normalSelection()
    }
    const withGap = buildReportData(['X01', 'X02'], selector)
    const withoutGap = buildReportData(['X01'], selector)

    assert.deepEqual([...withGap.selectionObjects], [...withoutGap.selectionObjects])
    assert.deepEqual([...withGap.situationObjects], [...withoutGap.situationObjects])
    assert.deepEqual([...withGap.all], [...withoutGap.all])
    assert.deepEqual(withGap.missing, withoutGap.missing)
    assert.deepEqual(withGap.missingSituations, withoutGap.missingSituations)
    assert.deepEqual(withGap.gaps.map(n => n.goalId), ['X02'])
    assert.deepEqual(withoutGap.gaps, [])
}

function testGoalsWithoutPracticeSituationsAreCovered(): void {
    assert.deepEqual(goalsWithoutPracticeSituationIds, ['D03', 'A04', 'A05', 'A06'])
    assert.deepEqual(goalsWithoutPracticeSituationIds, [...new Set([...goalsWithoutPracticeSituationIds].filter(id => !guidedGoalIds.includes(id)))])

    const error = selectionGap('D03')
    const data = buildReportData(goalsWithoutPracticeSituationIds, goalId => {
        if (goalId === 'D03') throw error
        return { ...normalSelection(), goalId, goalName: `${goalId} normal goal` }
    })

    assert.deepEqual(data.needs.map(need => need.goalId), goalsWithoutPracticeSituationIds)
    assert.deepEqual(data.gaps.map(need => [need.goalId, need.gap!.reason]), [['D03', error.gap.reason]])
}

testNormalSelectionKeepsItsNeed()
testSelectionGapIsReported()
testUnrelatedErrorIsNotSwallowed()
testSelectionGapLeavesOtherCountsUnchanged()
testGoalsWithoutPracticeSituationsAreCovered()

console.log('run-contract-coverage unit tests passed')
