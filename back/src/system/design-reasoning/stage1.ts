/**
 * **Stage 1 of the design-reasoning stage: one function for every guided goal** — review pathway only.
 *
 * `runStage1` is the whole of Stage 1 for one Learning Goal id: Step 1 (`resolveDesignContext`) and then Step 2 (`selectGameForm`). Every
 * goal goes through the same two calls with the same knowledge value; nothing branches on which goal it is. `runStage1ForEveryGoal` runs
 * every goal in the registry, in id order, which is how the demonstration shows the process reaching goals it was not developed on.
 *
 * Steps 3-5 (configuration, tradeoffs, validation) are held pending his review and are not here.
 *
 * Nothing on the live route or the checked pathway imports this folder (a static test pins it). Its output is review evidence: never
 * served, never coach text, and a SELECTED form is a Game Form compatible with approved relationships, not an authorized design.
 */
import { cell, committedKnowledge, DesignKnowledge } from './knowledge'
import { selectGameForm, GameFormSelection } from './forms'
import { resolveDesignContext, DesignResolution } from './resolve'

export interface Stage1Result {
    stage: 'DESIGN_REASONING_STAGE_1'
    standing: string
    learningGoalId: string
    resolution: DesignResolution
    gameForm: GameFormSelection
}

export const STAGE1_STANDING =
    'Review evidence only. Not served, not coach text, not an authorization. A SELECTED Game Form is the one form approved relationships leave undominated; it is not an authorized design. Passing the stage\'s tests is engineering evidence, not evidence of representative learning quality in the field.'

export function runStage1(learningGoalId: string, knowledge: DesignKnowledge = committedKnowledge()): Stage1Result {
    const resolution = resolveDesignContext(knowledge, learningGoalId)
    return { stage: 'DESIGN_REASONING_STAGE_1', standing: STAGE1_STANDING, learningGoalId, resolution, gameForm: selectGameForm(knowledge, resolution) }
}

/** Every goal in the registry, by id. */
export function runStage1ForEveryGoal(knowledge: DesignKnowledge = committedKnowledge()): Stage1Result[] {
    const ids = knowledge.planning.learning_goals.map((g) => cell(g, 'ID')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    return ids.map((id) => runStage1(id, knowledge))
}
