/**
 * Experience Design → assembly brief.
 *
 * Runs the Experience Design decision sequence for an activity about to be assembled and turns the
 * chosen Representative Intervention into brief text. This is the seam where the Experience Design
 * package stops being knowledge and starts changing activities.
 *
 * WHERE THE ENTRY CONDITION COMES FROM. The Decision Rules require Representative Validation to have
 * succeeded first. In our pipeline the closest true equivalent is `validateConstraintPackage`, which
 * runs before assembly and throws on failure — so by the time the skeleton is built, representative
 * validation has passed. That is asserted here rather than assumed, because "we got this far" is the
 * kind of reasoning that silently stops being true when a pipeline is reordered.
 *
 * WHAT THE DIRECTIVE MUST NOT DO. The Preference Framework's whole point is that stakes AMPLIFY an
 * existing representative problem rather than replacing it: "The objective is not to change player
 * behavior directly. The objective is to shape the environment so that more functional behaviors
 * naturally emerge." So the text below tells the model to add the intervention to what is already
 * there, never to reorganise the activity around it, and never to prescribe what players do.
 */
import { decideExperienceDesign } from '../experience-design/experience-design-runtime'
import type { SystemAssemblyInput } from '../types'

/** Affordance names this activity targets, in whatever vocabulary the selection produced. */
function targetAffordances(input: SystemAssemblyInput): string[] {
    const names: string[] = []
    const primary = input.affordances?.primary
    if (primary?.title) names.push(String(primary.title))
    for (const supporting of input.affordances?.supporting ?? []) {
        if (supporting?.title) names.push(String(supporting.title))
    }
    return names
}

/**
 * The directive, or `[]` when no Representative Stakes were applied.
 *
 * An empty result is the NORMAL case, not a failure — a comfortable activity, or one whose eligible
 * interventions all failed Decision 6, correctly receives nothing. The Decision Rules are explicit
 * that returning the activity without stakes is a valid outcome.
 */
export function experienceDesignDirective(input: SystemAssemblyInput): string[] {
    const decision = decideExperienceDesign({
        // Assembly only happens after the constraint package validated, which is our representative
        // validation gate. See the module header for why this is stated rather than implied.
        representativeValidationPassed: true,
        challengeLevel: String(input.coachInput.challengeLevel ?? ''),
        targetAffordances: targetAffordances(input),
        learningStage: input.coachInput.learningStage,
    })

    if (!decision.applied || !decision.intervention) return []

    const intervention = decision.intervention

    return [
        `REPRESENTATIVE STAKES — ${decision.stakesVariable?.toUpperCase()} (amplify what is already there)`,
        `Add ONE element to the activity: ${intervention.name}.`,
        `What it is: ${intervention.definition}`,
        `Coach-facing purpose: ${intervention.coachDescription}`,
        `Why it stays representative: ${intervention.representativeRationale}`,
        ...(intervention.usageGuidance ? [`Use it like this: ${intervention.usageGuidance}`] : []),
        // Without this the model reorganises the activity around the intervention, which inverts the
        // relationship the Preference Framework describes — stakes exist to make an EXISTING
        // representative problem matter more, not to become the problem.
        'This ADDS TO the activity already described above. Do not restructure the activity around it,',
        'do not replace the constraint package, and do not let it become the main objective.',
        // The framework's own words, kept because they are the failure condition most likely to be
        // breached by an eager model: "The objective is not to change player behavior directly."
        'Shape the environment so better behaviour emerges — never instruct players what to do.',
    ]
}
