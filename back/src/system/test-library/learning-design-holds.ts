/**
 * Knowledge objects held out of Learning Goal selection by an owner ruling — read from data, ids only.
 *
 * Christian, 14 October 2026: *"Please keep the current Pass Combination Gate as a mechanism demonstration
 * only. I do not want it reintroduced into learning-design examples until we've reviewed its ecological
 * suitability."*
 *
 * **Why a hold and not a pool edit.** His rule of 13 October is that candidate pools are learning-design
 * knowledge and are never changed to make something generate — or, here, to make something stop. So the
 * object stays where he put it, listed among a goal's candidates, and selection consults this ruling before
 * it scores anything. The account can then say the truth: designated for the goal, held by his ruling.
 *
 * The file is JSON beside the library so the ruling is data and the selector that reads it names nothing:
 * every entry is an id, a date and his sentence verbatim. One source for both pathways (his 13 October
 * ruling: *"the checked pathway and application follow the same authoritative knowledge and selection
 * rules"*) — the application route and the checked pathway both select through `constraintPoolFor`.
 */
import registry from './library/learning-design-holds.json'

export interface LearningDesignHold {
    knowledgeId: string
    scope: 'LEARNING_GOAL_SELECTION'
    ruledOn: string
    by: string
    /** His words, verbatim. */
    ruling: string
    /** The mechanism demonstration that keeps the held object usable as engineering. */
    mechanismDemonstration: string
}

const HOLDS: LearningDesignHold[] = (registry.holds as LearningDesignHold[]).map((hold) => ({ ...hold }))

/** Every hold on Learning Goal selection, as copies, so no caller can edit the ruling in place. */
export function learningGoalSelectionHolds(): LearningDesignHold[] {
    return HOLDS.filter((hold) => hold.scope === 'LEARNING_GOAL_SELECTION').map((hold) => ({ ...hold }))
}
