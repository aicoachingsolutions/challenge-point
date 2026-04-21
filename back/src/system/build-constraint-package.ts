import { IConstraint, ConstraintRoles } from '../models/constraint.model'
import { AffordanceField, ArchetypeDefinition, ConstraintRole, ConstraintSelectionCandidate, SelectedConstraintPackage, SystemPipelineError } from './types'
import { resolveArchetypeByHint } from './archetypes'
import { overlapScore, scoreKeywordMatches, tokenize, uniqueTokens, includesNormalizedPhrase } from './text'

const ROLE_KEYWORDS: Record<ConstraintRole, string[]> = {
    foundation: ['field', 'space', 'zone', 'area', 'direction', 'numbers', 'teams', 'target', 'format', 'layout'],
    shaping: ['limit', 'condition', 'trigger', 'touch', 'restriction', 'bonus zone', 'gates', 'must', 'if', 'when'],
    consequence: ['point', 'score', 'reward', 'penalty', 'bonus', 'win', 'lose', 'restart', 'double'],
}

function constraintText(constraint: IConstraint): string {
    const categoryText =
        typeof constraint.category === 'object' && constraint.category
            ? `${constraint.category.name ?? ''} ${constraint.category.description ?? ''}`
            : ''

    return [
        constraint.title,
        constraint.description,
        constraint.type,
        constraint.affordanceTagGroup,
        constraint.notes,
        constraint.contextualAudit,
        constraint.suggestedConstraintPrompt,
        constraint.gameTemplateAnchor,
        constraint.designIntent,
        constraint.constraintArchetype,
        categoryText,
    ]
        .filter(Boolean)
        .join(' ')
}

export function inferConstraintRole(constraint: IConstraint): ConstraintRole | null {
    if (constraint.constraintRole && Object.values(ConstraintRoles).includes(constraint.constraintRole)) {
        return constraint.constraintRole
    }

    const searchText = constraintText(constraint)
    const roleScores = (Object.keys(ROLE_KEYWORDS) as ConstraintRole[]).map((role) => ({
        role,
        score: scoreKeywordMatches(searchText, ROLE_KEYWORDS[role], 3),
    }))

    roleScores.sort((left, right) => right.score - left.score)
    return roleScores[0].score > 0 ? roleScores[0].role : null
}

function scoreConstraintForRole(
    constraint: IConstraint,
    role: ConstraintRole,
    affordances: AffordanceField,
    archetype: ArchetypeDefinition
): ConstraintSelectionCandidate | null {
    const inferredRole = inferConstraintRole(constraint)
    if (inferredRole !== role) {
        return null
    }

    const reasons: string[] = [`Matched ${role} role`]
    const searchText = constraintText(constraint)
    const constraintTokens = uniqueTokens([searchText])
    const affordanceTokens = uniqueTokens([
        affordances.primary.title,
        affordances.primary.description,
        affordances.primary.affordanceTagGroup,
        affordances.primary.designIntent,
        ...affordances.supporting.flatMap((affordance) => [
            affordance.title,
            affordance.description,
            affordance.affordanceTagGroup,
            affordance.designIntent,
        ]),
    ])
    const archetypeTokens = uniqueTokens([archetype.name, ...archetype.aliases, ...archetype.assemblyCues])

    let score = 10
    const supportingTagGroups = affordances.supporting.map((affordance) => affordance.affordanceTagGroup).filter(Boolean)

    if (constraint.affordanceTagGroup && affordances.primary.affordanceTagGroup && constraint.affordanceTagGroup === affordances.primary.affordanceTagGroup) {
        score += 10
        reasons.push('Shared affordance tag group with primary affordance')
    } else if (constraint.affordanceTagGroup && supportingTagGroups.includes(constraint.affordanceTagGroup)) {
        score += 6
        reasons.push('Shared affordance tag group with a supporting affordance')
    }

    score += overlapScore(constraintTokens, affordanceTokens, 2)
    score += overlapScore(constraintTokens, archetypeTokens, 2)

    const exactArchetype = resolveArchetypeByHint(constraint.constraintArchetype)
    if (exactArchetype?.id === archetype.id) {
        score += 12
        reasons.push('Explicit archetype compatibility')
    } else if (constraint.constraintArchetype && exactArchetype && exactArchetype.id !== archetype.id) {
        score -= 8
    }

    if (role === 'consequence') {
        const consequenceScore = scoreKeywordMatches(searchText, archetype.consequenceCues, 3)
        score += consequenceScore
        if (consequenceScore > 0) {
            reasons.push('Contains meaningful consequence language')
        }
    }

    if (
        score <= 10 &&
        !includesNormalizedPhrase(searchText, affordances.primary.title ?? '') &&
        !includesNormalizedPhrase(searchText, archetype.name)
    ) {
        return null
    }

    return {
        constraint,
        role,
        score,
        reasons,
    }
}

function pickBestConstraint(
    constraints: IConstraint[],
    role: ConstraintRole,
    affordances: AffordanceField,
    archetype: ArchetypeDefinition,
    excludeIds: string[] = []
): ConstraintSelectionCandidate | undefined {
    return constraints
        .filter((constraint) => !excludeIds.includes(constraint._id))
        .map((constraint) => scoreConstraintForRole(constraint, role, affordances, archetype))
        .filter(Boolean)
        .sort(
            (left, right) =>
                right!.score - left!.score ||
                String(left!.constraint.title ?? left!.constraint._id).localeCompare(String(right!.constraint.title ?? right!.constraint._id))
        )[0]
}

export function buildConstraintPackage(
    constraints: IConstraint[],
    affordances: AffordanceField,
    archetype: ArchetypeDefinition
): SelectedConstraintPackage {
    if (!constraints.length) {
        throw new SystemPipelineError('constraint-selection', 'No constraints are available in the library.')
    }

    const foundation = pickBestConstraint(constraints, 'foundation', affordances, archetype)
    if (!foundation) {
        throw new SystemPipelineError(
            'constraint-selection',
            `No compatible foundation constraint was found for archetype "${archetype.name}".`,
            ['Populate at least one foundation constraint aligned to the selected affordance and archetype.']
        )
    }

    const shaping = pickBestConstraint(constraints, 'shaping', affordances, archetype, [foundation.constraint._id])
    if (!shaping) {
        throw new SystemPipelineError(
            'constraint-selection',
            `No compatible shaping constraint was found for archetype "${archetype.name}".`,
            ['Populate at least one shaping constraint aligned to the selected affordance and archetype.']
        )
    }

    const consequence = pickBestConstraint(constraints, 'consequence', affordances, archetype, [
        foundation.constraint._id,
        shaping.constraint._id,
    ])

    return {
        foundation,
        shaping,
        consequence: consequence && consequence.score > 12 ? consequence : undefined,
    }
}
