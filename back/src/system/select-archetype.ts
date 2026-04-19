import { IAffordance } from '../models/affordance.model'
import { ARCHETYPES, resolveArchetypeByHint } from './archetypes'
import { SystemPipelineError, SelectedAffordances, ArchetypeDefinition } from './types'
import { overlapScore, scoreKeywordMatches, tokenize, uniqueTokens } from './text'

function affordanceCorpus(affordance?: IAffordance): string {
    if (!affordance) {
        return ''
    }

    return [
        affordance.title,
        affordance.description,
        affordance.type,
        affordance.affordanceTagGroup,
        affordance.designIntent,
        affordance.constraintArchetype,
        typeof affordance.category === 'object' ? affordance.category?.name : '',
    ]
        .filter(Boolean)
        .join(' ')
}

export function selectArchetype(affordances: SelectedAffordances): ArchetypeDefinition {
    const primaryHint = resolveArchetypeByHint(affordances.primary.constraintArchetype)
    if (primaryHint) {
        return primaryHint
    }

    const primaryText = affordanceCorpus(affordances.primary)
    const secondaryText = affordanceCorpus(affordances.secondary)
    const primaryTokens = uniqueTokens([primaryText])
    const secondaryTokens = uniqueTokens([secondaryText])

    const ranked = ARCHETYPES.map((archetype) => {
        const exactHintScore = scoreKeywordMatches(primaryText, [archetype.id, archetype.name, ...archetype.aliases], 10)
        const primaryKeywordScore =
            scoreKeywordMatches(primaryText, archetype.supportedPrimaryAffordanceKeywords, 8) +
            overlapScore(primaryTokens, archetype.supportedPrimaryAffordanceKeywords.flatMap((value) => tokenize(value)), 3)
        const secondaryKeywordScore =
            scoreKeywordMatches(secondaryText, archetype.supportedSecondaryAffordanceKeywords ?? [], 5) +
            overlapScore(secondaryTokens, (archetype.supportedSecondaryAffordanceKeywords ?? []).flatMap((value) => tokenize(value)), 2)

        return {
            archetype,
            score: exactHintScore + primaryKeywordScore + secondaryKeywordScore,
        }
    }).sort((left, right) => right.score - left.score || left.archetype.name.localeCompare(right.archetype.name))

    if (!ranked[0] || ranked[0].score <= 0) {
        throw new SystemPipelineError(
            'archetype-selection',
            `No archetype could be selected for affordance "${affordances.primary.title ?? affordances.primary._id}".`,
            ['Populate affordance archetype hints or align affordance tags with the archetype registry.']
        )
    }

    return ranked[0].archetype
}
