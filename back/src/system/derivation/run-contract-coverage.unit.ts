import assert from 'node:assert/strict'

import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { SelectionKnowledgeGap } from '../test-library/generateSelection'
import { buildReportData, GOAL_BLOCKS, needsFor, reportLines } from './run-contract-coverage'
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

// The goal sets are computed here from the Session Planning Model, not read back from the module's own filter.
const allGoalIds = (sessionPlanningModel.learningGoals() as any[]).map(g => String(g.ID))
const goalsWithSituations = allGoalIds.filter(id => sessionPlanningModel.practiceSituationsFor(id).length > 0)
const goalsWithoutSituations = allGoalIds.filter(id => !goalsWithSituations.includes(id))

const blockTitled = (title: string) => GOAL_BLOCKS.find(block => block.title === title)!
const rowGoalIds = (lines: string[]) => lines.filter(line => line.includes('   situations ')).map(line => line.trim().split(' ')[0])
const refusedLines = (lines: string[]) => {
    const at = lines.indexOf('  REFUSED AT SELECTION')
    return at < 0 ? [] : lines.slice(at + 1)
}

function refusing(refusedGoalId: string, error: GoalSelectionGap) {
    return (goalId: string) => {
        if (goalId === refusedGoalId) throw error
        return { ...normalSelection(), goalId, goalName: `${goalId} normal goal` }
    }
}

// WHY: every Learning Goal the guided filter leaves out is printed, as a row or as a refusal with its typed reason.
function testGoalsWithoutPracticeSituationsBlock(): void {
    assert.deepEqual(goalsWithoutSituations, ['D03', 'A04', 'A05', 'A06'])
    const block = blockTitled('GOALS WITHOUT PRACTICE SITUATIONS')
    assert.deepEqual(block.goalIds, goalsWithoutSituations)

    const error = selectionGap('D03')
    const lines = reportLines(block, refusing('D03', error))

    assert.equal(lines[0], '\nGOALS WITHOUT PRACTICE SITUATIONS  (4 goals)')
    assert.deepEqual(rowGoalIds(lines), ['A04', 'A05', 'A06'])
    assert.deepEqual(refusedLines(lines), [`     D03  ${error.goalName}  ${error.gap.reason}`])
}

// WHY: "9 goals" counted a refused goal as if it had a row; the title now says how many of each.
function testGuidedTitleCountsRowsAndRefusals(): void {
    const block = blockTitled('ALL GUIDED GOALS')
    assert.deepEqual(block.goalIds, goalsWithSituations)

    const refusedGoalId = goalsWithSituations[0]
    const lines = reportLines(block, refusing(refusedGoalId, selectionGap(refusedGoalId)))
    const n = goalsWithSituations.length

    assert.equal(lines[0], `\nALL GUIDED GOALS  (${n} goals; ${n - 1} selected, 1 refused)`)
    assert.equal(rowGoalIds(lines).length, n - 1)
    assert.equal(refusedLines(lines).length, 1)
}

testNormalSelectionKeepsItsNeed()
testSelectionGapIsReported()
testUnrelatedErrorIsNotSwallowed()
testSelectionGapLeavesOtherCountsUnchanged()
testGoalsWithoutPracticeSituationsBlock()
testGuidedTitleCountsRowsAndRefusals()

console.log('run-contract-coverage unit tests passed')
