import { countPatternHits, includesNormalizedPhrase, normalizeText } from './text'
import { ActivityAssemblyGuardrails, AffordanceField, ArchetypeDefinition, InteractionExchange, SelectedConstraintPackage, SystemPipelineError } from './types'
import { resolveArchetypeByHint } from './archetypes'

const PRESCRIPTIVE_PATTERNS = [
    'every player must',
    'must always',
    'only way',
    'exactly',
    'required to',
    'always pass',
    'always dribble',
]

const OPEN_DECISION_PATTERNS = ['choose', 'option', 'space', 'support', 'timing', 'when to', 'whether', 'find', 'adapt', 'route']
const CONSEQUENCE_PATTERNS = ['score', 'point', 'reward', 'penalty', 'bonus', 'restart', 'win', 'lose', 'turnover', 'possession']
const PERCEPTION_PATTERNS = [
    'notice',
    'recognize',
    'read',
    'see',
    'identify',
    'space',
    'pressure',
    'lane',
    'line',
    'window',
    'support',
    'cover',
    'free area',
    'target',
]
const ADAPTATION_PATTERNS = [
    'adapt',
    'decide',
    'choose',
    'react',
    'exploit',
    'protect',
    'recover',
    'support',
    'delay',
    'progress',
    'switch',
    'escape',
    'secure',
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
    'time',
    'window',
    'directional',
    'direction',
    'score',
    'point',
    'bonus',
    'penalty',
    'restart',
    'pressure',
]
const INCENTIVE_PATTERNS = [
    'reward',
    'bonus',
    'point',
    'score',
    'penalty',
    'restart',
    'turnover',
    'possession',
    'counts only',
    'can score only',
    'unlock',
    'win',
]
const OPPOSITION_PATTERNS = [
    'opponent',
    'opponents',
    'pressure',
    'defend',
    'defenders',
    'recover',
    'regain',
    'turnover',
    'protect',
    'press',
    'counter',
    'against',
]
const COMPLIANCE_PATTERNS = [
    'pattern',
    'repetition',
    'repeat',
    'unopposed',
    'without defenders',
    'no defender',
    'technique',
    'technical',
    'line up',
    'back in line',
]
const VAGUE_LANGUAGE_PATTERNS = ['quality chance', 'good decision', 'proper technique', 'correct technique']
const OPPORTUNITY_PATTERNS = ['score', 'bonus', 'reward', 'progress', 'break', 'finish', 'exploit', 'escape', 'switch']
const RISK_PATTERNS = ['penalty', 'restart', 'turnover', 'opponent', 'regain', 'pressure', 'concession', 'lose possession']
const CONTINUATION_PATTERNS = ['live', 'continues', 'restart', 'immediately', 'next action', 'turnover', 'counter']

type ConstraintNarrativeSource = {
    constraint: {
        title?: string
        description?: string
        type?: string
        designIntent?: string
        notes?: string
        contextualAudit?: string
        suggestedConstraintPrompt?: string
        gameTemplateAnchor?: string
    }
    role?: string
}

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

function constraintNarrative(packageMember?: ConstraintNarrativeSource): string {
    if (!packageMember) {
        return ''
    }

    return [
        packageMember.constraint.title,
        packageMember.constraint.description,
        packageMember.constraint.type,
        packageMember.constraint.designIntent,
        packageMember.constraint.notes,
        packageMember.constraint.contextualAudit,
        packageMember.constraint.suggestedConstraintPrompt,
        packageMember.constraint.gameTemplateAnchor,
    ]
        .filter(Boolean)
        .join(' ')
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

function countPackageHits(haystack: string, patterns: string[]): number {
    return countPatternHits(haystack, patterns)
}

function hasOppositionCoupling(haystack: string): boolean {
    return (
        countPackageHits(haystack, OPPOSITION_PATTERNS) > 0 &&
        countPackageHits(haystack, OPPORTUNITY_PATTERNS) > 0 &&
        countPackageHits(haystack, RISK_PATTERNS) > 0
    )
}

function interactionExchangeNarrative(exchange: InteractionExchange): string {
    return [
        exchange.visibleOpportunityCue,
        exchange.decisionProblem,
        exchange.rewardAdvantage,
        exchange.misreadOrForceRisk,
        exchange.opponentAdvantage,
        exchange.liveContinuation,
        exchange.canonicalRule,
    ].join(' ')
}

function hasCompleteInteractionExchange(exchange?: InteractionExchange | null): exchange is InteractionExchange {
    if (!exchange) {
        return false
    }

    return [
        exchange.visibleOpportunityCue,
        exchange.decisionProblem,
        exchange.rewardAdvantage,
        exchange.misreadOrForceRisk,
        exchange.opponentAdvantage,
        exchange.liveContinuation,
        exchange.canonicalRule,
    ].every((segment) => typeof segment === 'string' && segment.trim().length > 0)
}

function hasExchangeValidationSignals(exchange: InteractionExchange): boolean {
    return Object.values(exchange.validationSignals).every((signals) => Array.isArray(signals) && signals.length > 0)
}

function guardrailNarrative(guardrails: ActivityAssemblyGuardrails): string {
    return [
        guardrails.visibleCue.summary,
        guardrails.decisionProblem.summary,
        guardrails.opponentConsequence.summary,
        guardrails.interactionExchange.canonicalRule,
        ...guardrails.nonNegotiableAvoids,
    ].join(' ')
}

function hasCompleteGuardrails(guardrails?: ActivityAssemblyGuardrails | null): guardrails is ActivityAssemblyGuardrails {
    if (!guardrails) {
        return false
    }

    return (
        guardrails.visibleCue.summary.trim().length > 0 &&
        guardrails.visibleCue.signals.length > 0 &&
        guardrails.decisionProblem.summary.trim().length > 0 &&
        guardrails.decisionProblem.signals.length > 0 &&
        guardrails.decisionProblem.preservedDecisions.length > 0 &&
        guardrails.opponentConsequence.summary.trim().length > 0 &&
        guardrails.opponentConsequence.signals.length > 0 &&
        guardrails.nonNegotiableAvoids.length > 0 &&
        guardrails.avoidSignals.length > 0 &&
        hasCompleteInteractionExchange(guardrails.interactionExchange)
    )
}

export function validateConstraintPackage(
    affordances: AffordanceField,
    archetype: ArchetypeDefinition,
    constraintPackage: SelectedConstraintPackage
) {
    if (!affordances.primary) {
        throw new SystemPipelineError('constraint-package-validation', 'A primary affordance is required before validation.')
    }

    if (!archetype) {
        throw new SystemPipelineError('constraint-package-validation', 'An archetype is required before validation.')
    }

    if (!constraintPackage.foundation || !constraintPackage.shaping) {
        throw new SystemPipelineError('constraint-package-validation', 'A valid package requires both a foundation and shaping constraint.')
    }

    if (!hasCompleteGuardrails(constraintPackage.assemblyGuardrails)) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The selected constraint package is missing complete structured assembly guardrails.'
        )
    }

    if (!hasExchangeValidationSignals(constraintPackage.assemblyGuardrails.interactionExchange)) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The selected constraint package does not provide validation signals for the system-built interaction exchange.'
        )
    }

    const supportingTagGroups = affordances.supporting.map((affordance) => affordance.affordanceTagGroup).filter(Boolean)
    const selectedMembers = [constraintPackage.foundation, constraintPackage.shaping, constraintPackage.consequence].filter(Boolean)
    const validationWarnings = new Set<string>()

    for (const member of selectedMembers) {
        if (member!.score <= 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" is not compatible with the selected system inputs.`
            )
        }

        if (
            member!.constraint.affordanceTagGroup &&
            affordances.primary.affordanceTagGroup &&
            member!.constraint.affordanceTagGroup !== affordances.primary.affordanceTagGroup &&
            !supportingTagGroups.includes(member!.constraint.affordanceTagGroup)
        ) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" does not support the selected affordance tag group.`
            )
        }

        const hintedArchetype = resolveArchetypeByHint(member!.constraint.constraintArchetype)
        if (hintedArchetype && hintedArchetype.id !== archetype.id) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" conflicts with the selected archetype "${archetype.name}".`
            )
        }

        const narrative = constraintNarrative(member as ConstraintNarrativeSource)
        const perceptionHits = countPackageHits(narrative, PERCEPTION_PATTERNS)
        const adaptationHits = countPackageHits(narrative, ADAPTATION_PATTERNS)
        const environmentHits = countPackageHits(narrative, ENVIRONMENT_PATTERNS)
        const incentiveHits = countPackageHits(narrative, INCENTIVE_PATTERNS)
        const oppositionHits = countPackageHits(narrative, OPPOSITION_PATTERNS)
        const complianceHits = countPackageHits(narrative, [...PRESCRIPTIVE_PATTERNS, ...COMPLIANCE_PATTERNS])
        const openDecisionHits = countPackageHits(narrative, OPEN_DECISION_PATTERNS)
        const vagueLanguageHits = countPackageHits(narrative, VAGUE_LANGUAGE_PATTERNS)
        const restrictedDecisionDimensions = getRestrictedDecisionDimensions(narrative)

        if (vagueLanguageHits > 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" uses vague language instead of observable game cues.`,
                ['Replace phrases like "quality chance" or "good decision" with visible game events or pressure pictures.']
            )
        }

        if (perceptionHits === 0 || adaptationHits === 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" does not clearly state what players should notice and adapt to.`,
                ['Each constraint must create a visible game problem, not just an instruction to comply with.']
            )
        }

        if (member!.role === 'foundation' && environmentHits < 2) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Foundation constraint "${member!.constraint.title ?? member!.constraint._id}" does not shape the environment strongly enough.`,
                ['Start with space, time, player numbers, scoring, or pressure before adding behavior rules.']
            )
        }

        if (member!.role === 'shaping' && incentiveHits === 0 && openDecisionHits === 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Shaping constraint "${member!.constraint.title ?? member!.constraint._id}" does not highlight the problem through incentives or preserved player choices.`,
                ['Prefer rewards, unlocks, and live consequences over forced action sequences.']
            )
        }

        if (member!.role === 'consequence' && incentiveHits === 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Consequence constraint "${member!.constraint.title ?? member!.constraint._id}" does not express a meaningful incentive.`,
                ['A consequence must change what teams care about through scoring, restart, turnover, or penalty logic.']
            )
        }

        if (member!.role === 'consequence' && !hasOppositionCoupling(narrative)) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Consequence constraint "${member!.constraint.title ?? member!.constraint._id}" does not connect one team's opportunity to risk for the other team.`,
                ['The reward or penalty needs to act on both teams, not only the attacking side.']
            )
        }

        if (restrictedDecisionDimensions.length >= 2 && openDecisionHits < 2) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" removes too many player decisions.`,
                [`Restricted decisions: ${restrictedDecisionDimensions.join(', ')}.`]
            )
        }

        if (complianceHits > 1 && incentiveHits === 0 && openDecisionHits === 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" is compliance-heavy and does not preserve open play.`,
                ['Brief behavior limits are only acceptable when they reopen into live, adaptive play.']
            )
        }

        if (complianceHits > 0 || restrictedDecisionDimensions.length === 1) {
            validationWarnings.add(
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" carries behavior-control signals. Resolve them through environment and incentive design.`
            )
        }

        if (oppositionHits === 0) {
            validationWarnings.add(
                `Constraint "${member!.constraint.title ?? member!.constraint._id}" has weak opposition language. Preserve pressure, recovery, and opponent consequence in assembly.`
            )
        }
    }

    const packageNarrative = selectedMembers.map((member) => constraintNarrative(member)).join(' ')
    const exchangeNarrative = interactionExchangeNarrative(constraintPackage.assemblyGuardrails.interactionExchange)
    const guardrailsNarrative = guardrailNarrative(constraintPackage.assemblyGuardrails)
    const prescriptiveHits = countPatternHits(packageNarrative, PRESCRIPTIVE_PATTERNS)
    const openDecisionHits = countPatternHits(packageNarrative, OPEN_DECISION_PATTERNS)
    const incentiveHits = countPackageHits(packageNarrative, INCENTIVE_PATTERNS)
    const oppositionHits = countPackageHits(packageNarrative, OPPOSITION_PATTERNS)
    const vagueLanguageHits = countPackageHits(packageNarrative, VAGUE_LANGUAGE_PATTERNS)

    if (prescriptiveHits > 2 && openDecisionHits === 0) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The selected constraint package over-prescribes behavior and does not preserve enough player decision-making.'
        )
    }

    if (
        !includesNormalizedPhrase(packageNarrative, affordances.primary.title ?? '') &&
        !includesNormalizedPhrase(packageNarrative, affordances.primary.affordanceTagGroup ?? '') &&
        openDecisionHits === 0
    ) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The selected package does not show a clear relationship to the selected affordance or open problem space.'
        )
    }

    if (vagueLanguageHits > 0) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The selected package includes vague language instead of observable game events.'
        )
    }

    if (oppositionHits === 0) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The selected package reads as one-sided and does not depend enough on opponent interaction.'
        )
    }

    if (!hasOppositionCoupling(packageNarrative) && incentiveHits > 0) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            "The selected package does not connect one team's opportunity to risk for the other team."
        )
    }

    if (constraintPackage.consequence) {
        const consequenceNarrative = constraintNarrative(constraintPackage.consequence as ConstraintNarrativeSource)
        if (countPatternHits(consequenceNarrative, CONSEQUENCE_PATTERNS) === 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Consequence constraint "${constraintPackage.consequence.constraint.title ?? constraintPackage.consequence.constraint._id}" does not express a meaningful consequence.`
            )
        }
    }

    if (
        countPackageHits(exchangeNarrative, PERCEPTION_PATTERNS) === 0 ||
        countPackageHits(exchangeNarrative, INCENTIVE_PATTERNS) === 0 ||
        countPackageHits(exchangeNarrative, RISK_PATTERNS) === 0 ||
        countPackageHits(exchangeNarrative, OPPOSITION_PATTERNS) === 0 ||
        countPackageHits(exchangeNarrative, CONTINUATION_PATTERNS) === 0
    ) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The system-built interaction exchange does not fully describe the visible cue, consequence, opponent response, and live continuation.'
        )
    }

    if (!hasOppositionCoupling(exchangeNarrative)) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            "The system-built interaction exchange does not connect one team's opportunity to risk for the other team."
        )
    }

    if (
        countPackageHits(guardrailsNarrative, PERCEPTION_PATTERNS) === 0 ||
        countPackageHits(guardrailsNarrative, OPPOSITION_PATTERNS) === 0 ||
        countPackageHits(guardrailsNarrative, CONTINUATION_PATTERNS) === 0
    ) {
        throw new SystemPipelineError(
            'constraint-package-validation',
            'The structured assembly guardrails do not fully express the visible cue, decision problem, opponent consequence, and live continuation.'
        )
    }

    constraintPackage.validationWarnings = Array.from(validationWarnings)
}
