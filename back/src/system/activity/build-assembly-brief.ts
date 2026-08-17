import { registryIdString } from './assembly-package-ids'
import type { SystemAssemblyInput } from '../types'

export type AssemblyBrief = {
    archetypeRequirements: string[]
    affordanceRequirements: Record<string, string[]>
    constraintRequirements: string[]
    decisionLanguageRequirements: string[]
    forbiddenPatterns: string[]
}

const POSSESSION_STABILITY_OPPORTUNITY = 'Possession Stability Opportunity'
const SPACE_CREATION_OPPORTUNITY = 'Space Creation Opportunity'
const SPACE_EXPLOITATION_OPPORTUNITY = 'Space Exploitation Opportunity'
const LINE_BREAKING_OPPORTUNITY = 'Line-Breaking Opportunity'

function selectedAffordanceTitles(input: SystemAssemblyInput): string[] {
    return [input.affordances.primary, ...input.affordances.supporting]
        .map((affordance) => ({
            id: registryIdString((affordance as { _id?: unknown; id?: unknown })._id ?? (affordance as { id?: unknown }).id),
            title: affordance.title,
        }))
        .filter((row, index, all) => row.id.length > 0 && all.findIndex((x) => x.id === row.id) === index)
        .map((row) => row.title)
}

function affordanceRequirementsForTitle(title: string): string[] {
    switch (title) {
        case POSSESSION_STABILITY_OPPORTUNITY:
            return [
                'Rules or scoring must require securing or maintaining possession under pressure.',
                'Possession stability cannot appear only in coachingFocus.',
            ]
        case SPACE_CREATION_OPPORTUNITY:
            return [
                'Rules, scoring, constraints, or task conditions must require creating or opening space for teammates.',
                'Players need choices based on defender positioning.',
                'Space creation cannot appear only in coachingFocus.',
            ]
        case SPACE_EXPLOITATION_OPPORTUNITY:
            return [
                'Rules or scoring must require using open space to gain advantage.',
                'Success cannot happen without exploiting available space.',
                'Space exploitation cannot appear only in coachingFocus.',
            ]
        case LINE_BREAKING_OPPORTUNITY:
            return [
                'Rules or scoring must require breaking or bypassing a defensive line to gain advantage.',
                'Line breaking cannot appear only in coachingFocus.',
            ]
        default:
            return [
                'This affordance must appear in game structure, not only in coachingFocus.',
                'Express it through rules, scoring, constraints, or task conditions so players must act on it to succeed.',
            ]
    }
}

function archetypeRequirements(input: SystemAssemblyInput): string[] {
    switch (input.archetype.name) {
        case 'Overload Games':
            return [
                'The activity must clearly create numerical or positional overloads.',
                'Success must depend on using the overload to gain advantage.',
            ]
        case 'Pressing & Regain Games':
            return [
                'The activity must include pressure, regain moments, and immediate transition or counter opportunity.',
                'Opponents must create real pressure and regain risk, not passive spacing only.',
            ]
        case 'End Zone Games':
            return [
                'The activity must include target or end-zone progression as a core scoring condition.',
                'Success must depend on progressing into or through the target zone.',
            ]
        default:
            return [
                `Every activity must clearly reflect the selected archetype "${input.archetype.name}".`,
                ...input.archetype.assemblyCues.map((cue) => `Archetype cue: ${cue}`),
            ]
    }
}

export function buildAssemblyBrief(input: SystemAssemblyInput): AssemblyBrief {
    const affordanceRequirements: Record<string, string[]> = {}
    for (const title of selectedAffordanceTitles(input)) {
        affordanceRequirements[title] = affordanceRequirementsForTitle(title)
    }

    const constraintRequirements = [
        `Use the selected foundation constraint "${input.constraintPackage.foundation.constraint.title}" as live environment structure, not commentary only.`,
        `Use the selected shaping constraint "${input.constraintPackage.shaping.constraint.title}" to guide what the game highlights through rules, scoring, or space.`,
        ...(input.constraintPackage.consequence
            ? [
                  `Use the selected consequence constraint "${input.constraintPackage.consequence.constraint.title}" as a live reward, penalty, restart, or opponent advantage condition.`,
              ]
            : []),
        `Visible cue to preserve: ${input.constraintPackage.assemblyGuardrails.visibleCue.summary}`,
        `Decision problem to preserve: ${input.constraintPackage.assemblyGuardrails.decisionProblem.summary}`,
        `Opponent consequence to preserve: ${input.constraintPackage.assemblyGuardrails.opponentConsequence.summary}`,
        `Interaction exchange to preserve: ${input.constraintPackage.assemblyGuardrails.interactionExchange.canonicalRule}`,
    ]

    return {
        archetypeRequirements: archetypeRequirements(input),
        affordanceRequirements,
        constraintRequirements,
        decisionLanguageRequirements: [
            'Every generated activity must include explicit decision language in objective, rules, or coachingFocus.',
            'Use concrete decision words such as choose, read, react, based on, decision, adapt, or option.',
            'Decision language must describe what players notice and how that changes their next action.',
        ],
        forbiddenPatterns: [
            ...input.constraintPackage.assemblyGuardrails.nonNegotiableAvoids,
            ...input.constraintPackage.assemblyGuardrails.avoidSignals,
            'Do not leave selected affordances only in coachingFocus.',
        ],
    }
}
