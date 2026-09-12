/**
 * WHICH GAME FORMS DO REAL COACHING INTENTIONS ACTUALLY REACH?
 *
 *   cd back && npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-archetype-distribution.ts
 *
 * Christian, 2026-09-12: "I continue to generate activities where the overwhelming majority are
 * directional progression games with end zones or end-zone-like objectives. I still have yet to
 * naturally generate activities that genuinely feel like other representative structures — for
 * example, activities where finishing on full goals becomes the obvious representative solution."
 *
 * That is a claim about SELECTION, which is deterministic and needs no AI: `deriveInputConstraints`
 * then `generateSelection`. So it can be answered exactly, over as many coaching intentions as we
 * like, in seconds — rather than inferred from the handful of activities anyone has patience to
 * generate by hand.
 *
 * The intentions below are written the way a coach would say them, and deliberately span the range
 * his diagnostics did not: finishing, pressing, defending deep, switching play, counter-attacking,
 * playing out, 1v1, crossing, and possession. They are inputs for measurement, not a test fixture —
 * no assertion depends on them, so they can be edited freely as his vocabulary work continues.
 *
 * Reports three things: what each intention selects, the distribution across game forms, and — the
 * one that matters for his question — which game forms in the library nothing reaches at all.
 */
import 'dotenv/config'
import '../loadEnv'

import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { generateSelection } from '../system/test-library/generateSelection'
import { testLibraryRegistry } from '../system/test-library/library/registry'

const COACHING_INTENTIONS: readonly string[] = [
    // Building out / playing forward
    'Build out from the back under pressure.',
    'Play out from the back against a high press.',
    'Help players break defensive lines.',
    'Create and use space to play forward.',
    'Progress the ball through midfield under pressure.',
    // Finishing
    'Create scoring chances before the defense reorganizes.',
    'Finish more of the chances we create.',
    'Get more shots on goal from crosses.',
    'Attack the space behind the last defender and finish.',
    'Score more goals from central areas.',
    // Pressing and defending
    'Press higher after losing the ball.',
    'Win the ball back within five seconds of losing it.',
    'Defend deeper and stay compact.',
    'Stop conceding on the counter-attack.',
    'Defend one against one without diving in.',
    // Transition
    'Counter-attack quickly after winning the ball.',
    'Players keep winning the ball but turning away from field vision.',
    'React faster when we lose the ball.',
    // Width, switching, wide play
    'Switch play to the far side more often.',
    'Use the width of the pitch when we attack.',
    'Beat defenders one against one in wide areas.',
    'Get crosses in from wide areas.',
    // Possession and support
    'Keep the ball better under pressure.',
    'Create better support angles under pressure.',
    'Help players recognize space behind the defense.',
    'Stop losing the ball in our own half.',
]

function main(): void {
    const chosen = new Map<string, string[]>()

    console.log('INTENTION -> GAME FORM\n')
    for (const intention of COACHING_INTENTIONS) {
        let archetype: string
        try {
            archetype = generateSelection({ learningGoals: [intention] }, deriveInputConstraints(intention)).archetype
                .game_form_name
        } catch (error) {
            archetype = `(selection failed: ${error instanceof Error ? error.message : String(error)})`
        }
        console.log(`  ${archetype.padEnd(34)}  ${intention}`)
        chosen.set(archetype, [...(chosen.get(archetype) ?? []), intention])
    }

    const total = COACHING_INTENTIONS.length
    console.log(`\nDISTRIBUTION over ${total} coaching intentions\n`)
    for (const [archetype, intentions] of [...chosen.entries()].sort((a, b) => b[1].length - a[1].length)) {
        const share = Math.round((intentions.length / total) * 100)
        console.log(`  ${String(intentions.length).padStart(3)}  ${String(share).padStart(3)}%  ${archetype}`)
    }

    // The point of the exercise. A game form the library defines but no coaching intention reaches is
    // richness the architecture has and the coach never sees.
    const available = testLibraryRegistry.archetypes().map((row) => row.game_form_name)
    const unreached = available.filter((name) => !chosen.has(name))
    console.log(`\nGAME FORMS NEVER SELECTED: ${unreached.length} of ${available.length}`)
    for (const name of unreached) console.log(`  - ${name}`)
}

main()
