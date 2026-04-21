import { IAffordance } from '../models/affordance.model'
import { ARCHETYPES, resolveArchetypeByHint } from './archetypes'
import { AffordanceField, ArchetypeDefinition, ArchetypeSelection, ArchetypeSelectionBand, SystemPipelineError } from './types'
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

function stableHash(value: string): number {
    let hash = 0

    for (const character of value) {
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0
    }

    return hash
}

function resolveTopBandFloor(topScore: number): number {
    return Math.max(topScore - 4, Math.ceil(topScore * 0.8))
}

function resolveCandidateBand(score: number, topBandFloor: number): ArchetypeSelectionBand {
    return score >= topBandFloor ? 'top' : 'candidate'
}

export function selectArchetype(affordances: AffordanceField, selectionKey: string): ArchetypeSelection {
    const primaryHint = resolveArchetypeByHint(affordances.primary.constraintArchetype)
    const primaryText = affordanceCorpus(affordances.primary)
    const supportingText = affordances.supporting.map((affordance) => affordanceCorpus(affordance)).join(' ')
    const viableText = affordances.viableCandidates.map((affordance) => affordanceCorpus(affordance)).join(' ')
    const primaryTokens = uniqueTokens([primaryText])
    const supportingTokens = uniqueTokens(affordances.supporting.map((affordance) => affordanceCorpus(affordance)))
    const viableTokens = uniqueTokens(affordances.viableCandidates.map((affordance) => affordanceCorpus(affordance)))

    const ranked = ARCHETYPES.map((archetype) => {
        const reasons: string[] = []
        let score = 0

        if (primaryHint?.id === archetype.id) {
            score += 12
            reasons.push('Primary affordance carries an explicit archetype hint')
        }

        const exactNameScore = scoreKeywordMatches(primaryText, [archetype.id, archetype.name, ...archetype.aliases], 8)
        if (exactNameScore > 0) {
            score += exactNameScore
            reasons.push('Primary affordance language aligns directly with the archetype')
        }

        const primaryKeywordScore =
            scoreKeywordMatches(primaryText, archetype.supportedPrimaryAffordanceKeywords, 6) +
            overlapScore(primaryTokens, archetype.supportedPrimaryAffordanceKeywords.flatMap((value) => tokenize(value)), 3)
        if (primaryKeywordScore > 0) {
            score += primaryKeywordScore
            reasons.push('Primary affordance supports this interaction environment')
        }

        const supportingKeywordScore =
            scoreKeywordMatches(supportingText, archetype.supportedSecondaryAffordanceKeywords ?? [], 4) +
            overlapScore(supportingTokens, (archetype.supportedSecondaryAffordanceKeywords ?? []).flatMap((value) => tokenize(value)), 2)
        if (supportingKeywordScore > 0) {
            score += supportingKeywordScore
            reasons.push('Supporting affordances reinforce the archetype')
        }

        const viableKeywordScore =
            scoreKeywordMatches(viableText, [...archetype.supportedPrimaryAffordanceKeywords, ...(archetype.supportedSecondaryAffordanceKeywords ?? [])], 2) +
            overlapScore(
                viableTokens,
                [...archetype.supportedPrimaryAffordanceKeywords, ...(archetype.supportedSecondaryAffordanceKeywords ?? [])].flatMap((value) =>
                    tokenize(value)
                ),
                1
            )
        if (viableKeywordScore > 0) {
            score += viableKeywordScore
            reasons.push('Adjacent affordances still fit the archetype band')
        }

        return {
            archetype,
            score,
            reasons,
        }
    })
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score || left.archetype.name.localeCompare(right.archetype.name))

    if (!ranked[0]) {
        throw new SystemPipelineError(
            'archetype-selection',
            `No archetype could be selected for affordance "${affordances.primary.title ?? affordances.primary._id}".`,
            ['Populate affordance archetype hints or align affordance tags with the archetype registry.']
        )
    }

    const topBandFloor = resolveTopBandFloor(ranked[0].score)
    const candidateSet = ranked.slice(0, 5).map((entry) => ({
        ...entry,
        band: resolveCandidateBand(entry.score, topBandFloor),
    }))
    const topBand = candidateSet.filter((entry) => entry.band === 'top').slice(0, 3)
    const selectedIndex = topBand.length <= 1 ? 0 : stableHash(selectionKey) % topBand.length
    const selected = topBand[selectedIndex]?.archetype ?? candidateSet[0].archetype

    return {
        selected,
        candidates: candidateSet,
        selectionKey,
        selectedReason:
            topBand.length <= 1
                ? 'Only one archetype cleared the top validity band.'
                : `Selected from ${topBand.length} top-band archetypes using the stable selection key.`,
    }
}
