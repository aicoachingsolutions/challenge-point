import { IActivity } from '../models/activity.model'
import { SystemAssemblyInput, SystemPipelineError } from './types'
import { countPatternHits, includesNormalizedPhrase, overlapScore, scoreKeywordMatches, uniqueTokens } from './text'

const REQUIRED_STRING_FIELDS = ['title', 'constraint', 'intent', 'scoringSystem', 'winCondition'] as const
const REQUIRED_ARRAY_FIELDS = ['rules', 'scaffolding', 'extensions', 'equipmentNeeded'] as const
const PRESCRIPTIVE_PATTERNS = ['every player must', 'only way', 'exactly', 'must always', 'required to']
const OPEN_DECISION_PATTERNS = ['choose', 'option', 'space', 'support', 'timing', 'when to', 'whether', 'find']
const CONSEQUENCE_PATTERNS = ['score', 'point', 'reward', 'penalty', 'bonus', 'restart', 'win', 'lose', 'double']
const GENERIC_CONSEQUENCE_TOKENS = new Set([
    'team',
    'teams',
    'player',
    'players',
    'game',
    'games',
    'activity',
    'activities',
    'ball',
    'live',
    'action',
    'actions',
    'score',
    'scored',
    'scoring',
    'point',
    'points',
    'reward',
    'penalty',
    'penalties',
    'bonus',
    'restart',
    'win',
    'wins',
    'lose',
    'loss',
])

function ensureStringField(candidate: Record<string, any>, field: (typeof REQUIRED_STRING_FIELDS)[number], index: number): string {
    if (typeof candidate[field] !== 'string' || candidate[field].trim().length === 0) {
        throw new SystemPipelineError('output-validation', `Generated activity ${index + 1} is missing required field "${field}".`)
    }

    return candidate[field].trim()
}

function ensureArrayField(candidate: Record<string, any>, field: (typeof REQUIRED_ARRAY_FIELDS)[number], index: number): string[] {
    if (!Array.isArray(candidate[field])) {
        throw new SystemPipelineError('output-validation', `Generated activity ${index + 1} is missing array field "${field}".`)
    }

    return candidate[field].map((entry: unknown) => String(entry).trim()).filter(Boolean)
}

function buildConstraintSummary(input: SystemAssemblyInput): string {
    const segments = [
        `Foundation: ${input.constraintPackage.foundation.constraint.title}`,
        `Shaping: ${input.constraintPackage.shaping.constraint.title}`,
    ]

    if (input.constraintPackage.consequence) {
        segments.push(`Consequence: ${input.constraintPackage.consequence.constraint.title}`)
    }

    return segments.join(' | ')
}

function buildSelectedConsequenceTokens(input: SystemAssemblyInput): string[] {
    const selectedConsequence = input.constraintPackage.consequence?.constraint
    if (!selectedConsequence) {
        return []
    }

    return uniqueTokens([
        selectedConsequence.title,
        selectedConsequence.description,
        selectedConsequence.designIntent,
        selectedConsequence.notes,
        selectedConsequence.suggestedConstraintPrompt,
        selectedConsequence.gameTemplateAnchor,
    ]).filter((token) => !GENERIC_CONSEQUENCE_TOKENS.has(token))
}

function consequenceIsEmbedded(consequenceNarrative: string, input: SystemAssemblyInput): boolean {
    const selectedConsequence = input.constraintPackage.consequence?.constraint
    if (!selectedConsequence) {
        return true
    }

    const explicitCueMatch = scoreKeywordMatches(consequenceNarrative, input.archetype.consequenceCues, 1) > 0
    if (explicitCueMatch) {
        return true
    }

    const narrativeHasConsequenceMechanic = countPatternHits(consequenceNarrative, CONSEQUENCE_PATTERNS) > 0
    if (!narrativeHasConsequenceMechanic) {
        return false
    }

    const selectedConsequenceTokens = buildSelectedConsequenceTokens(input)
    const narrativeTokens = uniqueTokens([consequenceNarrative])
    const sharedConsequenceTokens = overlapScore(selectedConsequenceTokens, narrativeTokens, 1)

    return sharedConsequenceTokens >= 3
}

export function validateGeneratedActivities(rawResponse: unknown, input: SystemAssemblyInput): IActivity[] {
    const payload = rawResponse as { generatedActivities?: Array<Record<string, any>> }
    if (!payload?.generatedActivities || !Array.isArray(payload.generatedActivities) || payload.generatedActivities.length === 0) {
        throw new SystemPipelineError('output-validation', 'The AI assembly response did not include a generatedActivities array.')
    }

    const affordanceIds = Array.from(
        new Set([input.affordances.primary._id, ...input.affordances.supporting.map((affordance) => affordance._id)].filter(Boolean))
    ) as string[]
    const constraintIds = [
        input.constraintPackage.foundation.constraint._id,
        input.constraintPackage.shaping.constraint._id,
        input.constraintPackage.consequence?.constraint._id,
    ].filter(Boolean) as string[]
    const packageSummary = buildConstraintSummary(input)
    const validActivities: IActivity[] = []
    const validationErrors: SystemPipelineError[] = []

    for (const [index, candidate] of payload.generatedActivities.entries()) {
        try {
        const title = ensureStringField(candidate, 'title', index)
        const constraint = ensureStringField(candidate, 'constraint', index)
        const intent = ensureStringField(candidate, 'intent', index)
        const scoringSystem = ensureStringField(candidate, 'scoringSystem', index)
        const winCondition = ensureStringField(candidate, 'winCondition', index)
        const rules = ensureArrayField(candidate, 'rules', index)
        const scaffolding = ensureArrayField(candidate, 'scaffolding', index)
        const extensions = ensureArrayField(candidate, 'extensions', index)
        const equipmentNeeded = ensureArrayField(candidate, 'equipmentNeeded', index)
        const playerGroupSizes = Number(candidate.playerGroupSizes)

        if (!Number.isFinite(playerGroupSizes) || playerGroupSizes <= 0) {
            throw new SystemPipelineError('output-validation', `Generated activity ${index + 1} has an invalid playerGroupSizes value.`)
        }

        const narrative = [constraint, intent, rules.join(' '), scoringSystem, winCondition].join(' ')
        const affordanceReflected =
            scoreKeywordMatches(narrative, [input.affordances.primary.title ?? '', input.affordances.primary.affordanceTagGroup ?? ''], 3) > 0
        if (!affordanceReflected) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not clearly reflect the selected affordance "${input.affordances.primary.title}".`
            )
        }

        const archetypeReflected =
            scoreKeywordMatches(narrative, [input.archetype.name, ...input.archetype.assemblyCues, ...input.archetype.aliases], 1) > 0
        if (!archetypeReflected) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not clearly represent the selected archetype "${input.archetype.name}".`
            )
        }

        if (!includesNormalizedPhrase(constraint, input.constraintPackage.foundation.constraint.title ?? '')) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not include the selected foundation constraint in its constraint summary.`
            )
        }

        if (!includesNormalizedPhrase(constraint, input.constraintPackage.shaping.constraint.title ?? '')) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not include the selected shaping constraint in its constraint summary.`
            )
        }

        if (
            input.constraintPackage.consequence &&
            !includesNormalizedPhrase(constraint, input.constraintPackage.consequence.constraint.title ?? '')
        ) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not include the selected consequence constraint in its constraint summary.`
            )
        }

        const prescriptiveHits = countPatternHits(narrative, PRESCRIPTIVE_PATTERNS)
        const openDecisionHits = countPatternHits(narrative, OPEN_DECISION_PATTERNS)
        if (prescriptiveHits > 3 && openDecisionHits === 0) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} is too prescriptive and does not leave room for multiple solutions.`
            )
        }

        if (input.constraintPackage.consequence) {
            const consequenceNarrative = [scoringSystem, winCondition, rules.join(' ')].join(' ')
            if (!consequenceIsEmbedded(consequenceNarrative, input)) {
                throw new SystemPipelineError(
                    'output-validation',
                    `Generated activity ${index + 1} does not embed the selected consequence in the live game consequences.`
                )
            }
        }

            validActivities.push({
            title,
            constraint: `${packageSummary}. ${constraint}`,
            intent,
            playerGroupSizes,
            scaffolding,
            extensions,
            equipmentNeeded,
            affordancesUsed: affordanceIds as any,
            constraintsUsed: constraintIds as any,
            rules,
            scoringSystem,
            winCondition,
            systemTrace: {
                primaryAffordanceId: input.affordances.primary._id,
                supportingAffordanceIds: input.affordances.supporting.map((affordance) => affordance._id),
                archetypeId: input.archetype.id,
                archetypeName: input.archetype.name,
                foundationConstraintId: input.constraintPackage.foundation.constraint._id,
                shapingConstraintId: input.constraintPackage.shaping.constraint._id,
                consequenceConstraintId: input.constraintPackage.consequence?.constraint._id,
            },
            } as IActivity)
        } catch (error) {
            if (error instanceof SystemPipelineError) {
                validationErrors.push(error)
                continue
            }

            throw error
        }
    }

    if (validActivities.length === 0) {
        throw validationErrors[0] ?? new SystemPipelineError('output-validation', 'No generated activities passed validation.')
    }

    return validActivities
}
