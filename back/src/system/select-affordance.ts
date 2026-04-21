import { IAffordance } from '../models/affordance.model'
import { ISession } from '../models/session.model'
import { AffordanceField, AffordanceFieldBand, SystemPipelineError } from './types'
import { overlapScore, scoreKeywordMatches, tokenize, uniqueTokens } from './text'

const LEARNING_GOAL_SIGNALS = [
    { signal: 'progress', keywords: ['progress', 'penetrate', 'break line', 'play forward', 'advance', 'behind'] },
    { signal: 'space', keywords: ['space', 'width', 'depth', 'stretch', 'support', 'overload', 'switch'] },
    { signal: 'finish', keywords: ['finish', 'score', 'shot', 'shoot', 'chance', 'goal', 'final third'] },
    { signal: 'retain', keywords: ['retain', 'keep', 'possession', 'secure', 'recycle', 'control'] },
    { signal: 'transition', keywords: ['transition', 'counter', 'turnover', 'regain', 'recover', 'press'] },
    { signal: 'protect', keywords: ['protect', 'defend', 'delay', 'cover', 'compact', 'block'] },
]

function affordanceText(affordance: IAffordance): string {
    const categoryText =
        typeof affordance.category === 'object' && affordance.category
            ? `${affordance.category.name ?? ''} ${affordance.category.description ?? ''}`
            : ''

    return [
        affordance.title,
        affordance.description,
        affordance.type,
        affordance.affordanceTagGroup,
        affordance.notes,
        affordance.contextualAudit,
        affordance.suggestedConstraintPrompt,
        affordance.gameTemplateAnchor,
        affordance.designIntent,
        affordance.constraintArchetype,
        categoryText,
    ]
        .filter(Boolean)
        .join(' ')
}

export function selectAffordances(
    learningGoals: string[],
    session: ISession,
    affordances: IAffordance[]
): AffordanceField {
    if (!affordances.length) {
        throw new SystemPipelineError('affordance-selection', 'No affordances are available in the library.')
    }

    const learningGoalText = `${learningGoals.join(' ')} ${session.skillLevel ?? ''} ${session.fieldType ?? ''}`
    const learningGoalTokens = tokenize(learningGoalText)
    const matchedSignals = LEARNING_GOAL_SIGNALS.flatMap((entry) =>
        entry.keywords.some((keyword) => learningGoalText.toLowerCase().includes(keyword)) ? [entry.signal, ...entry.keywords] : []
    )

    const ranked = affordances
        .map((affordance) => {
            const searchText = affordanceText(affordance)
            const affordanceTokens = uniqueTokens([searchText])
            const exactSignalScore = scoreKeywordMatches(searchText, matchedSignals, 10)
            const learningGoalScore = overlapScore(learningGoalTokens, affordanceTokens, 3)
            const titleScore = scoreKeywordMatches(
                searchText,
                learningGoals.flatMap((goal) => goal.split(',').map((part) => part.trim())),
                2
            )

            return {
                affordance,
                score: exactSignalScore + learningGoalScore + titleScore,
            }
        })
        .sort(
            (left, right) =>
                right.score - left.score ||
                String(left.affordance.title ?? left.affordance._id).localeCompare(String(right.affordance.title ?? right.affordance._id))
        )

    if (!ranked[0] || ranked[0].score <= 0) {
        throw new SystemPipelineError(
            'affordance-selection',
            'Could not map the submitted learning goals to an affordance using the current affordance library metadata.',
            ['Add stronger affordance tags, descriptions, or category descriptions for the targeted learning goals.']
        )
    }

    const primary = ranked[0].affordance
    const primaryScore = ranked[0].score
    const supportingFloor = Math.max(4, primaryScore - 5)
    const viableFloor = Math.max(2, primaryScore - 10)

    const viableEntries = ranked
        .filter((entry) => entry.affordance._id !== primary._id && entry.score >= viableFloor)
        .slice(0, 4)

    const supporting = viableEntries
        .filter((entry) => entry.score >= supportingFloor && entry.affordance.affordanceTagGroup !== primary.affordanceTagGroup)
        .slice(0, 2)
        .map((entry) => entry.affordance)

    const supportingIds = new Set(supporting.map((affordance) => affordance._id))
    const fieldEntries = [ranked[0], ...viableEntries]
    const bandedRankings = fieldEntries.map((entry) => ({
        affordance: entry.affordance,
        score: entry.score,
        band: resolveAffordanceBand(entry.affordance, primary._id, supportingIds),
    }))

    return {
        primary,
        supporting,
        viableCandidates: viableEntries.map((entry) => entry.affordance),
        ranked: bandedRankings,
    }
}

function resolveAffordanceBand(
    affordance: IAffordance,
    primaryId: string,
    supportingIds: Set<string>
): AffordanceFieldBand {
    if (affordance._id === primaryId) {
        return 'primary'
    }

    if (supportingIds.has(affordance._id)) {
        return 'supporting'
    }

    return 'viable'
}
