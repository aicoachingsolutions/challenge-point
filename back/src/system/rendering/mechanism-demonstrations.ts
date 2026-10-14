/**
 * Mechanism demonstrations — engineering demonstrations of one mechanism each, and NOT Learning Goal
 * activities.
 *
 * Christian, 13 October 2026: *"Intermediate mechanism demonstrations are useful, but they should remain
 * clearly identified as such."* And of the two below: *"I'm comfortable with the Wide Zone and Neutral
 * Player examples being used as intermediate engineering demonstrations, but not with changing
 * learning-design knowledge merely to make those demonstrations pass."*
 *
 * **So a demonstration names its own knowledge and involves no goal and no candidate pool.** That is the
 * whole design, and it is what keeps his second sentence true by construction rather than by care. The way
 * to show a mechanism working used to be to get a Learning Goal to select it — which means bending the
 * goal's candidate pool until it did, and then describing the result as that goal's activity. A
 * demonstration instead lists the knowledge objects it is made of, runs the identical pathway from
 * derivation onward, and is labelled as what it is all the way to the page. No goal is claimed to be served
 * by it, so `account.gameProblem` is null: there is no Learning Goal for a Game Problem to belong to.
 *
 * Whether a demonstration is SERVED is decided by the same checks as everything else. One that does not
 * pass is refused, in the same words, and that is the honest state of the mechanism it demonstrates.
 */

export interface MechanismDemonstration {
    id: string
    name: string
    /** Shown beside the name wherever the demonstration appears, so it cannot be read as a goal's activity. */
    statement: string
    /** The knowledge objects it is made of: a game form and the object carrying the mechanism. */
    selected: string[]
}

export const MECHANISM_DEMONSTRATIONS: MechanismDemonstration[] = [
    {
        id: 'scoring-modifier',
        name: 'Scoring modifier',
        statement: 'A mechanism demonstration: the possession game with Wide Zone Advantage. Not a Learning Goal activity.',
        selected: ['GF2', 'tl-v0-constraint-wide-zone-advantage'],
    },
    {
        id: 'neutral-players',
        name: 'Neutral players',
        statement: 'A mechanism demonstration: the possession game with the Neutral Player Condition. Not a Learning Goal activity.',
        selected: ['GF2', 'tl-v0-constraint-neutral-player-condition'],
    },
    /**
     * Christian, 14 October 2026: *"Please keep the current Pass Combination Gate as a mechanism demonstration
     * only. I do not want it reintroduced into learning-design examples until we've reviewed its ecological
     * suitability."* This is where it stays usable as engineering (the holds file names it), and it is the only
     * place: every Learning Goal is refused the gate, at selection and again in the builder.
     */
    {
        id: 'pass-combination-gate',
        name: 'Pass Combination Gate',
        statement:
            'A mechanism demonstration: the possession game with the Pass Combination Gate as revised on 14 October. Not a Learning Goal activity, and not approved for learning-design use.',
        selected: ['GF2', 'tl-v0-constraint-pass-combination-gate'],
    },
]

export const mechanismDemonstration = (id: string): MechanismDemonstration | undefined => MECHANISM_DEMONSTRATIONS.find(d => d.id === id)
