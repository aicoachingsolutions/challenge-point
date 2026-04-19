import { countPatternHits, includesNormalizedPhrase } from './text'
import { SelectedAffordances, SelectedConstraintPackage, ArchetypeDefinition, SystemPipelineError } from './types'
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

const OPEN_DECISION_PATTERNS = ['choose', 'option', 'space', 'support', 'timing', 'when to', 'whether', 'find']
const CONSEQUENCE_PATTERNS = ['score', 'point', 'reward', 'penalty', 'bonus', 'restart', 'win', 'lose']

function constraintNarrative(packageMember?: { constraint: { title?: string; description?: string; designIntent?: string; notes?: string } }): string {
    if (!packageMember) {
        return ''
    }

    return [packageMember.constraint.title, packageMember.constraint.description, packageMember.constraint.designIntent, packageMember.constraint.notes]
        .filter(Boolean)
        .join(' ')
}

export function validateConstraintPackage(
    affordances: SelectedAffordances,
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

    const selectedMembers = [constraintPackage.foundation, constraintPackage.shaping, constraintPackage.consequence].filter(Boolean)

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
            member!.constraint.affordanceTagGroup !== affordances.secondary?.affordanceTagGroup
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
    }

    const packageNarrative = selectedMembers.map((member) => constraintNarrative(member)).join(' ')
    const prescriptiveHits = countPatternHits(packageNarrative, PRESCRIPTIVE_PATTERNS)
    const openDecisionHits = countPatternHits(packageNarrative, OPEN_DECISION_PATTERNS)

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

    if (constraintPackage.consequence) {
        const consequenceNarrative = constraintNarrative(constraintPackage.consequence)
        if (countPatternHits(consequenceNarrative, CONSEQUENCE_PATTERNS) === 0) {
            throw new SystemPipelineError(
                'constraint-package-validation',
                `Consequence constraint "${constraintPackage.consequence.constraint.title ?? constraintPackage.consequence.constraint._id}" does not express a meaningful consequence.`
            )
        }
    }
}
