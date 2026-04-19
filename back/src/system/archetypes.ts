import { ArchetypeDefinition } from './types'
import { includesNormalizedPhrase } from './text'

export const ARCHETYPES: ArchetypeDefinition[] = [
    {
        id: 'progression-breakthrough',
        name: 'Progression Breakthrough',
        description: 'Directional games that reward line-breaking and forward progression without prescribing one route.',
        aliases: ['progression', 'breakthrough', 'penetrate', 'line break', 'forward'],
        supportedPrimaryAffordanceKeywords: ['penetrate', 'progress', 'forward', 'break line', 'advance'],
        supportedSecondaryAffordanceKeywords: ['support', 'create space', 'finish', 'arrive'],
        assemblyCues: ['forward options', 'line-breaking moments', 'support timing', 'space behind'],
        consequenceCues: ['reward forward entry', 'restart from regain', 'bonus for breaking a line'],
    },
    {
        id: 'space-creation',
        name: 'Space Creation',
        description: 'Games that stretch and reorganize the field so players must discover multiple ways to make space.',
        aliases: ['space creation', 'create space', 'stretch', 'overload', 'switch'],
        supportedPrimaryAffordanceKeywords: ['space', 'width', 'depth', 'support', 'overload', 'switch'],
        supportedSecondaryAffordanceKeywords: ['retain', 'progress', 'penetrate'],
        assemblyCues: ['width and depth', 'overload release', 'switching options', 'timing of support'],
        consequenceCues: ['reward exploitation of free space', 'bonus for switching into open areas'],
    },
    {
        id: 'finishing-pressure',
        name: 'Finishing Pressure',
        description: 'Activities that preserve choice in the final action while making end-product consequences matter.',
        aliases: ['finishing', 'finish', 'score', 'chance creation', 'final third'],
        supportedPrimaryAffordanceKeywords: ['finish', 'score', 'chance', 'goal', 'final third'],
        supportedSecondaryAffordanceKeywords: ['penetrate', 'create space', 'arrive'],
        assemblyCues: ['different finishing routes', 'pressure on final action', 'timing of runs', 'second actions'],
        consequenceCues: ['reward efficient finishing', 'punish rushed final action', 'bonus for quality chances'],
    },
    {
        id: 'transition-chaos',
        name: 'Transition Chaos',
        description: 'Activities built around unstable moments where choices after regain or loss determine the outcome.',
        aliases: ['transition', 'counter', 'counterpress', 'regain', 'turnover', 'press'],
        supportedPrimaryAffordanceKeywords: ['transition', 'regain', 'counter', 'press', 'recover'],
        supportedSecondaryAffordanceKeywords: ['penetrate', 'protect', 'retain'],
        assemblyCues: ['regain moments', 'immediate options', 'unstable numbers', 'fast consequence'],
        consequenceCues: ['reward immediate exploitation', 'penalize slow reactions', 'restart on turnover'],
    },
    {
        id: 'protect-build',
        name: 'Protect and Build',
        description: 'Activities that preserve choice while asking players to secure the ball and build out under pressure.',
        aliases: ['protect', 'retain', 'build out', 'escape pressure', 'secure'],
        supportedPrimaryAffordanceKeywords: ['retain', 'protect', 'build', 'secure', 'escape'],
        supportedSecondaryAffordanceKeywords: ['support', 'space', 'switch'],
        assemblyCues: ['escape routes', 'support angles', 'secure then progress', 'pressure management'],
        consequenceCues: ['reward clean exit', 'penalize forced turnover', 'restart under pressure'],
    },
]

export function resolveArchetypeByHint(value?: string | null): ArchetypeDefinition | undefined {
    if (!value) {
        return undefined
    }

    return ARCHETYPES.find((archetype) => {
        return archetype.id === value || archetype.name === value || archetype.aliases.some((alias) => includesNormalizedPhrase(value, alias))
    })
}
