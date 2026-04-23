import { IActivity } from '../models/activity.model'
import { SystemAssemblyInput, SystemPipelineError } from './types'
import { countPatternHits, includesNormalizedPhrase, normalizeText, overlapScore, scoreKeywordMatches, uniqueTokens } from './text'

const REQUIRED_STRING_FIELDS = ['title', 'constraint', 'intent', 'scoringSystem', 'winCondition'] as const
const REQUIRED_ARRAY_FIELDS = ['rules', 'scaffolding', 'extensions', 'equipmentNeeded'] as const
const PRESCRIPTIVE_PATTERNS = ['every player must', 'only way', 'exactly', 'must always', 'required to', 'must pass', 'must dribble', 'must shoot']
const OPEN_DECISION_PATTERNS = ['choose', 'option', 'space', 'support', 'timing', 'when to', 'whether', 'find', 'adapt', 'route']
const CONSEQUENCE_PATTERNS = ['score', 'point', 'reward', 'penalty', 'bonus', 'restart', 'win', 'lose', 'double']
const ACTIVE_OPPOSITION_PATTERNS = [
    'opponent',
    'opponents',
    'pressure',
    'defend',
    'defenders',
    'recover',
    'regain',
    'turnover',
    'press',
    'protect',
    'contest',
    'block',
    'counter',
]
const CONTINUOUS_PLAY_PATTERNS = [
    'live',
    'continuous',
    'play continues',
    'on turnover',
    'after a turnover',
    'immediately',
    'next action',
    'transition',
    'restart',
    'recovery',
    'turnover',
    'restart for the opponent',
    'restart with the opponent',
    'counter',
]
const STOP_START_PATTERNS = [
    'line up',
    'back in line',
    'take turns',
    'one at a time',
    'rotate after each',
    'reset after every rep',
    'coach serves',
    'coach starts',
    'on the coach call',
    'unopposed',
    'without defenders',
]
const DIRECTIONAL_PATTERNS = [
    'directional',
    'goal',
    'goals',
    'target',
    'target space',
    'end zone',
    'forward',
    'progress',
    'attack',
    'defend',
    'behind',
    'beyond',
    'lane',
    'channel',
    'far side',
    'central',
]
const OBSERVABLE_OUTCOME_PATTERNS = [
    'goal',
    'goals',
    'score',
    'point',
    'bonus',
    'restart',
    'turnover',
    'regain',
    'break line',
    'enter',
    'exit',
    'switch',
    'delay',
    'recover',
    'escape',
    'shot',
    'rebound',
    'cut-back',
]
const ENVIRONMENT_PATTERNS = [
    'space',
    'zone',
    'lane',
    'channel',
    'area',
    'field',
    'pitch',
    'target',
    'goal',
    'width',
    'depth',
    'numbers',
    'overload',
    'underload',
    'window',
    'pressure',
]
const INSTRUCTIONAL_PATTERNS = [
    'coach tells',
    'coach instructs',
    'players work on',
    'focus on technique',
    'rehearse',
    'practice the pattern',
    'demonstrate',
    'complete the drill',
]
const VAGUE_LANGUAGE_PATTERNS = ['quality chance', 'good decision', 'proper technique', 'correct technique']
const TEAM_SIDE_PATTERNS = ['team', 'teams', 'opponent', 'opponents', 'attackers', 'defenders', 'attacking', 'defending', 'other team']
const OPPORTUNITY_PATTERNS = ['score', 'scores', 'point', 'points', 'bonus', 'goal', 'goals', 'win', 'wins', 'break line', 'enter', 'escape']
const RISK_PATTERNS = [
    'penalty',
    'restart',
    'turnover',
    'lose possession',
    'loss of possession',
    'transfer possession',
    'possession transfers',
    'regain',
    'counter',
    'recovery',
    'opponent possession',
    'for the opponent',
    'with the opponent',
    'against them',
]
const EXCHANGE_PATTERNS = ['if', 'when', 'after', 'on turnover', 'after a turnover', 'fails', 'failed', 'failure', 'while']
const CONTESTED_WIN_PATTERNS = ['first team to', 'team with most', 'more points than', 'before the opponent', 'than the opponent', 'wins']
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

type DecisionFreedomDimension = 'who' | 'what' | 'where' | 'when' | 'why' | 'how'

const DECISION_RESTRICTION_PATTERNS: Record<DecisionFreedomDimension, { phrases: string[]; regexes: RegExp[] }> = {
    who: {
        phrases: ['every player must', 'same player', 'designated player', 'only defenders', 'only attackers'],
        regexes: [],
    },
    what: {
        phrases: ['must pass', 'must dribble', 'must shoot', 'only pass', 'only dribble', 'only shoot', 'always pass', 'always dribble'],
        regexes: [],
    },
    where: {
        phrases: ['must stay in', 'only in the', 'only from the', 'must enter the', 'only use the'],
        regexes: [],
    },
    when: {
        phrases: ['after every', 'before scoring', 'within', 'only after', 'immediately after every'],
        regexes: [/\bwithin \d+ (second|seconds|pass|passes|touch|touches)\b/, /\bafter \d+ (pass|passes|touch|touches)\b/],
    },
    why: {
        phrases: ['to practice', 'to rehearse', 'for technique', 'because the coach'],
        regexes: [],
    },
    how: {
        phrases: ['exactly', 'pattern', 'sequence', 'one-touch only', 'two-touch only', 'three-touch only'],
        regexes: [/\b(one|two|three)[ -]?touch only\b/, /\bexactly \d+ (pass|passes|touch|touches)\b/],
    },
}

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

function countRegexHits(haystack: string, patterns: RegExp[]): number {
    const normalized = normalizeText(haystack)
    return patterns.reduce((count, pattern) => count + (pattern.test(normalized) ? 1 : 0), 0)
}

function getRestrictedDecisionDimensions(haystack: string): DecisionFreedomDimension[] {
    return (Object.entries(DECISION_RESTRICTION_PATTERNS) as Array<[DecisionFreedomDimension, { phrases: string[]; regexes: RegExp[] }]>)
        .filter(([, patternGroup]) => countPatternHits(haystack, patternGroup.phrases) + countRegexHits(haystack, patternGroup.regexes) > 0)
        .map(([dimension]) => dimension)
}

function hasActiveOpposition(haystack: string): boolean {
    return countPatternHits(haystack, ACTIVE_OPPOSITION_PATTERNS) > 0
}

function hasContinuousPlay(haystack: string): boolean {
    return countPatternHits(haystack, CONTINUOUS_PLAY_PATTERNS) > 0
}

function hasExplicitOpponentImpact(haystack: string): boolean {
    return countPatternHits(haystack, ['opponent', 'opponents', 'other team', 'defenders', 'attackers', 'for the opponent', 'with the opponent']) > 0
}

function hasOpportunityRiskExchange(haystack: string): boolean {
    return (
        countPatternHits(haystack, OPPORTUNITY_PATTERNS) > 0 &&
        countPatternHits(haystack, RISK_PATTERNS) > 0 &&
        hasExplicitOpponentImpact(haystack)
    )
}

function hasRuleInteractionExchange(rules: string[]): boolean {
    const rulesNarrative = rules.join(' ')
    return (
        countPatternHits(rulesNarrative, EXCHANGE_PATTERNS) > 0 &&
        countPatternHits(rulesNarrative, TEAM_SIDE_PATTERNS) > 1 &&
        hasOpportunityRiskExchange(rulesNarrative)
    )
}

function hasTwoSidedScoringConsequences(scoringSystem: string, winCondition: string): boolean {
    const scoringNarrative = [scoringSystem, winCondition].join(' ')
    return hasOpportunityRiskExchange(scoringNarrative)
}

function hasContestedWinCondition(winCondition: string): boolean {
    return countPatternHits(winCondition, CONTESTED_WIN_PATTERNS) > 0 && countPatternHits(winCondition, TEAM_SIDE_PATTERNS) > 0
}

function hasInteractionLoop(rules: string[], scoringSystem: string, winCondition: string): boolean {
    const narrative = [rules.join(' '), scoringSystem, winCondition].join(' ')
    return (
        countPatternHits(narrative, CONTINUOUS_PLAY_PATTERNS) > 0 &&
        countPatternHits(narrative, ACTIVE_OPPOSITION_PATTERNS) > 0 &&
        countPatternHits(narrative, RISK_PATTERNS) > 0
    )
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
        const environmentNarrative = [constraint, rules.join(' '), scoringSystem, winCondition].join(' ')
        const outcomeNarrative = [scoringSystem, winCondition, rules.join(' ')].join(' ')
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
        const restrictedDecisionDimensions = getRestrictedDecisionDimensions(narrative)
        const stopStartHits = countPatternHits(narrative, STOP_START_PATTERNS)
        const instructionalHits = countPatternHits(narrative, INSTRUCTIONAL_PATTERNS)
        const activeOppositionHits = countPatternHits(environmentNarrative, ACTIVE_OPPOSITION_PATTERNS)
        const continuousPlayHits = countPatternHits(environmentNarrative, CONTINUOUS_PLAY_PATTERNS)
        const directionalHits = countPatternHits(environmentNarrative, DIRECTIONAL_PATTERNS)
        const observableOutcomeHits = countPatternHits(outcomeNarrative, OBSERVABLE_OUTCOME_PATTERNS)
        const environmentHits = countPatternHits(environmentNarrative, ENVIRONMENT_PATTERNS)
        const vagueLanguageHits = countPatternHits(narrative, VAGUE_LANGUAGE_PATTERNS)

        if (vagueLanguageHits > 0) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} uses vague language instead of observable game events.`
            )
        }

        if (instructionalHits > 0) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} reads like coach instructions or a drill instead of a game environment.`
            )
        }

        if (stopStartHits > 0) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} breaks continuous play with stop-start drill mechanics.`
            )
        }

        if (activeOppositionHits === 0 || !hasActiveOpposition(environmentNarrative)) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not preserve active opposition.`
            )
        }

        if (continuousPlayHits === 0 || !hasContinuousPlay(environmentNarrative)) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not make continuous play and live transitions clear enough.`
            )
        }

        if (directionalHits < 2) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not preserve directional realism.`
            )
        }

        if (environmentHits < 2) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not describe the environment strongly enough through space, pressure, numbers, or targets.`
            )
        }

        if (observableOutcomeHits < 2) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not define observable outcomes clearly enough.`
            )
        }

        if (restrictedDecisionDimensions.length >= 2 && openDecisionHits < 2) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} removes too many player decisions: ${restrictedDecisionDimensions.join(', ')}.`
            )
        }

        if (!hasRuleInteractionExchange(rules)) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not create an explicit two-sided risk/opportunity exchange in the rules.`
            )
        }

        if (!hasTwoSidedScoringConsequences(scoringSystem, winCondition)) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not define scoring consequences for both teams.`
            )
        }

        if (!hasContestedWinCondition(winCondition)) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not frame the win condition as a live contest between teams.`
            )
        }

        if (!hasInteractionLoop(rules, scoringSystem, winCondition)) {
            throw new SystemPipelineError(
                'output-validation',
                `Generated activity ${index + 1} does not sustain a continuous interaction loop between teams.`
            )
        }

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
