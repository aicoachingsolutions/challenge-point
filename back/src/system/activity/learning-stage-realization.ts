/**
 * Learning Stage realization — implements IC-001.
 *
 * WHAT THE CONTRACT REQUIRES, and why this file is shaped the way it is:
 *
 *   Learning Stage MUST influence HOW the representative learning experience is realized.
 *   Learning Stage MUST NOT influence WHAT players are learning.
 *
 * That distinction is the whole design. Selection — Learning Goal, Practice Situation, lenses,
 * archetype, constraint package — has already happened by the time this runs, and nothing here can
 * reach back into it. So IC-001's Invariants 1 and 2 ("changing Learning Stage MUST NOT change the
 * selected Learning Goal / Practice Situation") hold BY CONSTRUCTION rather than by care: this layer
 * only contributes realization directives to the assembly brief. It is placed here, after selection,
 * precisely so the invariant cannot be broken by a later edit.
 *
 * INVARIANT 4 IS THE ONE THAT NEEDED WORK. "Changing Learning Stage MUST produce a recognizably
 * different learning experience." Before this, Learning Stage was collected and discarded — a
 * question that changed nothing, which broke both this invariant and Christian's own Principle 3.
 * The directives below are deliberately DIFFERENT IN KIND rather than in degree: exploring makes
 * opportunities visible and repeatable, building adds pressure and removes scaffolding, refining
 * introduces authentic consequence and uncertainty. Three intensities of the same sentence would
 * satisfy the letter of the contract and fail its intent.
 *
 * THE WORDING IS TAKEN FROM THE CONTRACT, NOT PARAPHRASED. IC-001 §5 lists what the runtime MUST
 * prioritize at each stage. Those lists are reproduced closely on purpose: they are the specification
 * of observable behaviour, and rewording them in our own voice would quietly let our interpretation
 * drift from his over time.
 *
 * NOT CHALLENGE. Challenge (Comfortable/Stretch/Demanding) already calibrates environmental demand.
 * Learning Stage describes where players ARE with the learning, which is a different question — a
 * coach can legitimately want a demanding session for players exploring something for the first
 * time. So the two are kept independent, and the contract requires Challenge to be preserved
 * unchanged when Learning Stage varies.
 */

export const LEARNING_STAGES = ['first_time_exploring', 'building_understanding', 'reinforcing_refining'] as const

export type LearningStage = (typeof LEARNING_STAGES)[number]

export function isLearningStage(value: unknown): value is LearningStage {
    return typeof value === 'string' && (LEARNING_STAGES as readonly string[]).includes(value)
}

interface StageRealization {
    /** Coach-facing label, matching the Session Creation conversation. */
    label: string
    /** What the runtime MUST prioritize — IC-001 §5 "Expected Runtime Behavior". */
    prioritize: string[]
}

const REALIZATION: Record<LearningStage, StageRealization> = {
    first_time_exploring: {
        label: 'First Time Exploring',
        prioritize: [
            'Make the useful opportunities easy to SEE — the affordance should be obvious in the environment, not hidden.',
            'Keep interacting constraints simple: one clear demand at a time rather than several competing ones.',
            'Allow successful representative repetitions — players should get the problem often enough to explore it.',
            'Leave room for experimentation; several different solutions should work.',
            'Favour recognition opportunities over execution pressure.',
        ],
    },
    building_understanding: {
        label: 'Building Understanding',
        prioritize: [
            'Increase representative pressure so recognition has to happen under realistic time and space.',
            'Enrich the information available — more to read, and less of it pre-announced.',
            'Reduce scaffolding: remove helpers that were making the opportunity obvious.',
            'Repeat the perception-action coupling so reading and acting stay joined.',
            'Require adaptive responses rather than a rehearsed one.',
        ],
    },
    reinforcing_refining: {
        label: 'Reinforcing & Refining',
        prioritize: [
            'Maximise representative fidelity — the activity should feel like the game it prepares for.',
            'Attach authentic competitive consequences to success and failure.',
            'Introduce representative variability so no two repetitions present the same picture.',
            'Preserve genuine uncertainty; the right answer should not be knowable in advance.',
            'Use adaptive opponents who adjust to what the attacking team is doing.',
        ],
    },
}

export function learningStageLabel(stage: LearningStage): string {
    return REALIZATION[stage].label
}

/**
 * The realization directive for the assembly brief.
 *
 * Returns `[]` for an absent stage rather than a default. A missing Learning Stage means the coach
 * came through the free-text form, which does not ask for one — inventing "Building Understanding"
 * there would silently attribute a planning decision the coach never made, and IC-001 §4 says the
 * experience PROVIDES the stage rather than the runtime assuming it.
 */
export function learningStageDirective(stage: unknown): string[] {
    if (!isLearningStage(stage)) return []
    const realization = REALIZATION[stage]

    return [
        `LEARNING STAGE — ${realization.label.toUpperCase()} (shapes HOW this is realized, never WHAT is being learned)`,
        'The learning goal, the game situation and the constraint package are already decided and must not change.',
        'Realize them for players at this stage by prioritizing:',
        ...realization.prioritize.map((line) => `  - ${line}`),
        // Without this the model can read "simplified constraints" as licence to strip the problem
        // out of the activity, which would breach Invariant 5 (representative information MUST remain
        // representative at every stage) and produce a drill rather than a game.
        'Do NOT make the activity less representative to achieve this — an easier picture is still a real game picture.',
    ]
}
