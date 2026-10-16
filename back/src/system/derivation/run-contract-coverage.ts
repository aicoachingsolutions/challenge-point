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
import { GoalSelectionGap, selectFor } from './run-bounded-selection'
import type { BoundedSelection } from './run-bounded-selection'

const key = (id: string) =>
    String(id)
        .replace(/^(restated|blind):/, '')
        .replace(/^tl-v0-constraint-/, '')
        .toUpperCase()

/** The five goals of the attacking family the bounded pilot was scoped around. */
const BOUNDED = ['A01', 'A04', 'A05', 'TA01', 'TA02']

const contracted = new Set(loadCorpusContracts().map(c => key(c.contractId)))
const learningGoals: any[] = sessionPlanningModel.learningGoals() as any[]
const guided: any[] = learningGoals.filter(g => sessionPlanningModel.practiceSituationsFor(String(g.ID)).length > 0)
export const guidedGoalIds = guided.map(g => String(g.ID))
export const goalsWithoutPracticeSituationIds = learningGoals.filter(g => !guidedGoalIds.includes(String(g.ID))).map(g => String(g.ID))

export interface Need {
    goalId: string
    goalName: string
    /** Knowledge the live selection commits to, without the coach's situation. */
    selection: string[]
    /** Every Practice Situation the goal offers — each one a choice a coach can actually make. */
    situations: string[]
    /** A selection refusal is evidence, not missing contract work. */
    gap?: { reason: string; detail: string }
}

export type CoverageSelector = (goalId: string, situationId: string | null) => BoundedSelection

export function needsFor(goalId: string, selector: CoverageSelector = selectFor): Need {
    try {
        const selection = selector(goalId, null)
        return {
            goalId,
            goalName: selection.goalName,
            selection: selection.selected.filter(s => !s.role.startsWith('affordance lens')).map(s => s.id),
            situations: selection.practiceSituations.map(p => String(p.id)),
        }
    } catch (error) {
        // WHY: an authorized refusal belongs in this diagnostic, while a defect must still stop it.
        if (!(error instanceof GoalSelectionGap)) throw error
        return {
            goalId,
            goalName: error.goalName,
            selection: [],
            situations: [],
            gap: { reason: error.gap.reason, detail: error.gap.message },
        }
    }
}

export interface CoverageReportData {
    needs: Need[]
    selectionObjects: Set<string>
    situationObjects: Set<string>
    all: Set<string>
    missing: string[]
    missingSituations: string[]
    gaps: Need[]
}

export function buildReportData(goalIds: string[], selector: CoverageSelector = selectFor): CoverageReportData {
    const needs = goalIds.map(goalId => needsFor(goalId, selector))
    const selectionObjects = new Set(needs.flatMap(n => n.selection))
    const situationObjects = new Set(needs.flatMap(n => n.situations))
    const all = new Set([...selectionObjects, ...situationObjects])
    const missing = [...all].filter(id => !contracted.has(key(id))).sort()
    const missingSituations = [...situationObjects].filter(id => !contracted.has(key(id))).sort()

    return {
        needs,
        selectionObjects,
        situationObjects,
        all,
        missing,
        missingSituations,
        gaps: needs.filter(n => n.gap),
    }
}

export type TitleDetail = (data: CoverageReportData) => string

/** The guided title counts rows and refusals separately, so a refused goal is not read as a row. */
export const selectedAndRefused: TitleDetail = data => `${data.needs.length - data.gaps.length} selected, ${data.gaps.length} refused`

export interface GoalBlock {
    title: string
    goalIds: string[]
    titleDetail?: TitleDetail
}

/** The goal blocks, in print order; the last one holds every goal the guided filter leaves out. */
export const GOAL_BLOCKS: GoalBlock[] = [
    { title: 'BOUNDED ATTACKING FAMILY', goalIds: BOUNDED },
    { title: 'ALL GUIDED GOALS', goalIds: guidedGoalIds, titleDetail: selectedAndRefused },
    { title: 'GOALS WITHOUT PRACTICE SITUATIONS', goalIds: goalsWithoutPracticeSituationIds },
]

export function reportLines(block: GoalBlock, selector: CoverageSelector = selectFor): string[] {
    const { title, goalIds, titleDetail } = block
    const data = buildReportData(goalIds, selector)
    const { needs, selectionObjects, situationObjects, all, missing, missingSituations, gaps } = data
    const detail = titleDetail ? `; ${titleDetail(data)}` : ''
    const lines: string[] = []

    lines.push(`\n${title}  (${goalIds.length} goal${goalIds.length === 1 ? '' : 's'}${detail})`)
    lines.push('-'.repeat(78))
    for (const n of needs) {
        if (n.gap) continue
        const have = n.selection.filter(s => contracted.has(key(s))).length
        const sitHave = n.situations.filter(s => contracted.has(key(s))).length
        lines.push(`  ${n.goalId.padEnd(6)} selection ${have}/${n.selection.length}   situations ${sitHave}/${n.situations.length}   ${n.goalName}`)
    }
    lines.push(`  distinct objects the selections commit to      ${selectionObjects.size}`)
    lines.push(`  distinct Practice Situations a coach may pick  ${situationObjects.size}  (of which ${situationObjects.size - missingSituations.length} contracted)`)
    lines.push(`  TOTAL distinct objects                         ${all.size}`)
    lines.push(`  ALREADY CONTRACTED                             ${all.size - missing.length}`)
    lines.push(`  STILL TO AUTHOR                                ${missing.length}`)
    lines.push(`     ${missing.join(', ') || 'none'}`)
    if (gaps.length) {
        lines.push('  REFUSED AT SELECTION')
        for (const n of gaps) lines.push(`     ${n.goalId}  ${n.goalName}  ${n.gap!.reason}`)
    }
    return lines
}

if (require.main === module) {
    console.log('CONTRACT COVERAGE — what a coach choice needs before it can reach derivation')
    console.log('='.repeat(78))
    console.log(`contracts that exist today: ${[...contracted].sort().join(', ')}`)

    for (const block of GOAL_BLOCKS) console.log(reportLines(block).join('\n'))

    // The figure that makes the Practice Situation cost visible on its own.
    const withoutSituations = new Set(BOUNDED.map(goalId => needsFor(goalId)).flatMap(n => n.selection))
    const withSituations = new Set(BOUNDED.map(goalId => needsFor(goalId)).flatMap(n => [...n.selection, ...n.situations]))
    console.log('\nWHAT THE PRACTICE SITUATION BRIDGE ADDED')
    console.log('-'.repeat(78))
    console.log(`  bounded family, ignoring the coach's situation choice   ${[...withoutSituations].filter(i => !contracted.has(key(i))).length} to author`)
    console.log(`  bounded family, with every situation a coach may pick   ${[...withSituations].filter(i => !contracted.has(key(i))).length} to author`)
    console.log('  The difference is the cost of the coach being able to make a choice the system can see.')
}
