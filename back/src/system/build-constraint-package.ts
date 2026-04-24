import { IConstraint, ConstraintRoles } from '../models/constraint.model'
import {
    ActivityAssemblyGuardrails,
    AffordanceField,
    ArchetypeDefinition,
    ConstraintRole,
    ConstraintSelectionCandidate,
    DecisionFreedomDimension,
    InteractionExchange,
    SelectedConstraintPackage,
    SystemPipelineError,
} from './types'
import { resolveArchetypeByHint } from './archetypes'
import { overlapScore, scoreKeywordMatches, uniqueTokens, includesNormalizedPhrase } from './text'

const ROLE_KEYWORDS: Record<ConstraintRole, string[]> = {
    foundation: ['field', 'space', 'zone', 'area', 'direction', 'numbers', 'teams', 'target', 'format', 'layout'],
    shaping: ['limit', 'condition', 'trigger', 'touch', 'restriction', 'bonus zone', 'gates', 'must', 'if', 'when'],
    consequence: ['point', 'score', 'reward', 'penalty', 'bonus', 'win', 'lose', 'restart', 'double'],
}

type InteractionExchangeDraft = {
    visibleOpportunityCue: string
    decisionProblem: string
    rewardAdvantage: string
    misreadOrForceRisk: string
    opponentAdvantage: string
    liveContinuation: string
    validationSignals: InteractionExchange['validationSignals']
}

type GuardrailDraft = {
    visibleCue: string
    visibleCueSignals: string[]
    decisionProblem: string
    decisionProblemSignals: string[]
    preservedDecisions: DecisionFreedomDimension[]
    interactionExchange: InteractionExchangeDraft
    opponentConsequence: string
    opponentConsequenceSignals: string[]
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

function createInteractionExchange(
    draft: InteractionExchangeDraft,
    sourceRole: ConstraintRole | 'package',
    sourceConstraintId?: string
): InteractionExchange {
    return {
        sourceRole,
        sourceConstraintId,
        ...draft,
        canonicalRule: `If ${draft.visibleOpportunityCue}, then ${draft.rewardAdvantage}; but if ${draft.misreadOrForceRisk}, then ${draft.opponentAdvantage}, and ${draft.liveContinuation}.`,
    }
}

function createAssemblyGuardrails(
    draft: GuardrailDraft,
    sourceRole: ConstraintRole | 'package',
    sourceConstraintId?: string
): ActivityAssemblyGuardrails {
    return {
        visibleCue: {
            summary: draft.visibleCue,
            signals: draft.visibleCueSignals,
        },
        decisionProblem: {
            summary: draft.decisionProblem,
            signals: draft.decisionProblemSignals,
            preservedDecisions: draft.preservedDecisions,
        },
        interactionExchange: createInteractionExchange(draft.interactionExchange, sourceRole, sourceConstraintId),
        opponentConsequence: {
            summary: draft.opponentConsequence,
            signals: draft.opponentConsequenceSignals,
        },
        nonNegotiableAvoids: [
            'No players must instructions',
            'No one-sided reward without opponent consequence',
            'No exact pass, touch, or sequence compliance rule',
            'No stop-start drill reset that breaks live play',
            'No vague outcomes such as quality chance, good decision, or proper technique',
        ],
        avoidSignals: [
            'every player must',
            'must pass',
            'must shoot',
            'must dribble',
            'one-touch only',
            'two-touch only',
            'exactly',
            'line up',
            'back in line',
            'quality chance',
            'good decision',
            'proper technique',
        ],
    }
}

function buildPackageInteractionExchange(
    affordances: AffordanceField,
    archetype: ArchetypeDefinition,
    foundation: ConstraintSelectionCandidate,
    shaping: ConstraintSelectionCandidate,
    consequence?: ConstraintSelectionCandidate
): ActivityAssemblyGuardrails {
    const sourceRole: ConstraintRole | 'package' = consequence ? 'consequence' : 'package'
    const sourceConstraintId = consequence?.constraint._id
    const affordanceTag = consequence?.constraint.affordanceTagGroup ?? shaping.constraint.affordanceTagGroup ?? affordances.primary.affordanceTagGroup

    if (affordanceTag === 'progress') {
        return createAssemblyGuardrails(
            {
                visibleCue: 'The cue is a line or target lane opening with support connected behind the ball.',
                visibleCueSignals: ['line open', 'target lane', 'break a line', 'support connected'],
                decisionProblem: 'Players must decide whether the opening is real enough to break through now or whether pressure and cover make another route more valuable.',
                decisionProblemSignals: ['whether to break through', 'another route', 'pressure and cover', 'support connected'],
                preservedDecisions: ['what', 'where', 'when', 'why', 'how'],
                interactionExchange: {
                    visibleOpportunityCue: 'a team sees a line open or a target lane appear with support connected behind the ball',
                    decisionProblem: 'whether to break the line now or solve the pressure another way',
                    rewardAdvantage: 'they break through, keep the next action live, and can earn a bonus point',
                    misreadOrForceRisk: 'they force the entry into pressure or lose the ball on the breakthrough action',
                    opponentAdvantage: 'the opponent gains possession and attacks immediately from the regain or restart',
                    liveContinuation: 'play continues live through the turnover or opponent restart',
                    validationSignals: {
                        cue: ['line open', 'target lane', 'break a line', 'support connected'],
                        reward: ['bonus point', 'break through', 'next action live'],
                        risk: ['force the entry', 'pressure', 'lose the ball', 'turnover'],
                        opponent: ['opponent gains possession', 'opponent attacks immediately', 'restart for the opponent', 'regain'],
                        continuation: ['play continues live', 'turnover', 'restart', 'immediately'],
                    },
                },
                opponentConsequence: 'If the breakthrough is forced or lost, the opponent immediately inherits the next live attacking moment.',
                opponentConsequenceSignals: ['opponent gains possession', 'attacks immediately', 'restart for the opponent', 'regain'],
            },
            sourceRole,
            sourceConstraintId
        )
    }

    if (affordanceTag === 'space') {
        return createAssemblyGuardrails(
            {
                visibleCue: 'The cue is a free side or open lane appearing when the field stretches or an overload releases.',
                visibleCueSignals: ['free side', 'open lane', 'space opens', 'overload release', 'switch'],
                decisionProblem: 'Players must decide whether the free space is still worth attacking now, where to release into it, and whether pressure has already closed it.',
                decisionProblemSignals: ['free space', 'worth attacking now', 'where to release', 'pressure has closed it'],
                preservedDecisions: ['what', 'where', 'when', 'why', 'how'],
                interactionExchange: {
                    visibleOpportunityCue: 'a team sees the free side or open lane after the field stretches or an overload releases',
                    decisionProblem: 'whether the free space is still open enough to exploit or whether pressure has already closed it',
                    rewardAdvantage: 'they enter the free space under control, keep the attack live, and can earn a bonus point',
                    misreadOrForceRisk: 'they drive into crowded pressure or force the entry after the space has closed',
                    opponentAdvantage: 'the opponent takes the restart or regain and attacks into the exposed side',
                    liveContinuation: 'the game stays live from the turnover, regain, or opponent restart',
                    validationSignals: {
                        cue: ['free side', 'open lane', 'space opens', 'overload release', 'switch'],
                        reward: ['enter the free space', 'bonus point', 'keep the attack live'],
                        risk: ['crowded pressure', 'force the entry', 'space has closed', 'turnover'],
                        opponent: ['opponent takes the restart', 'opponent regain', 'opponent attacks', 'exposed side'],
                        continuation: ['stays live', 'turnover', 'regain', 'restart'],
                    },
                },
                opponentConsequence: 'If the space is forced after it closes, the opponent gains the next live attack into the side that was exposed by the attempt.',
                opponentConsequenceSignals: ['opponent takes the restart', 'opponent regain', 'opponent attacks', 'exposed side'],
            },
            sourceRole,
            sourceConstraintId
        )
    }

    if (affordanceTag === 'finish') {
        return createAssemblyGuardrails(
            {
                visibleCue: 'The cue is a prepared finishing picture with support, rebound access, cut-back access, or pressure moved away from goal.',
                visibleCueSignals: ['prepared finish', 'rebound', 'cut-back', 'support', 'pressure moved'],
                decisionProblem: 'Players must decide whether the finish is prepared enough to attack now or whether another touch, support action, or angle creates a better picture.',
                decisionProblemSignals: ['finish is prepared', 'attack now', 'another touch', 'better picture'],
                preservedDecisions: ['what', 'where', 'when', 'why', 'how'],
                interactionExchange: {
                    visibleOpportunityCue: 'a team creates a prepared finishing picture with support, a rebound, a cut-back, or pressure moved away from goal',
                    decisionProblem: 'whether the finish is prepared enough to attack now or should be improved first',
                    rewardAdvantage: 'they finish into a live goal chance and can earn a goal plus a bonus point for the prepared finish',
                    misreadOrForceRisk: 'they rush the shot into pressure or lose the ball before the finish is prepared',
                    opponentAdvantage: 'the opponent gains possession and can break out or counter from the rushed finish',
                    liveContinuation: 'play continues live through the rebound, save, turnover, or counter',
                    validationSignals: {
                        cue: ['prepared finish', 'rebound', 'cut-back', 'support', 'pressure moved'],
                        reward: ['goal', 'bonus point', 'live goal chance'],
                        risk: ['rush the shot', 'into pressure', 'lose the ball', 'turnover'],
                        opponent: ['opponent gains possession', 'counter', 'break out', 'save'],
                        continuation: ['play continues live', 'rebound', 'turnover', 'counter'],
                    },
                },
                opponentConsequence: 'If the finish is rushed, the opponent gets the next live escape or counter instead of the attacker owning the moment.',
                opponentConsequenceSignals: ['opponent gains possession', 'counter', 'break out', 'save'],
            },
            sourceRole,
            sourceConstraintId
        )
    }

    if (affordanceTag === 'transition') {
        return createAssemblyGuardrails(
            {
                visibleCue: 'The cue is the live transition picture before the opponent recovers behind the ball.',
                visibleCueSignals: ['regain', 'before recovery', 'behind the ball', 'transition window'],
                decisionProblem: 'Players must decide whether the transition window is still live enough to attack fast or whether recovery pressure means they should secure first.',
                decisionProblemSignals: ['attack fast', 'secure first', 'window is still live', 'recovery pressure'],
                preservedDecisions: ['what', 'when', 'why', 'how'],
                interactionExchange: {
                    visibleOpportunityCue: 'a team regains before the opponent recovers behind the ball and the transition window is still open',
                    decisionProblem: 'whether the transition window still supports fast attack or whether recovered pressure changes the choice',
                    rewardAdvantage: 'they attack the live space, keep the next action alive, and can earn a bonus point before pressure recovers',
                    misreadOrForceRisk: 'they force the first action into recovered pressure or lose the ball while the window is gone',
                    opponentAdvantage: 'the opponent attacks immediately from the turnover spot while the first team is still disorganized',
                    liveContinuation: 'play continues live through the turnover or immediate restart',
                    validationSignals: {
                        cue: ['regain', 'before recovery', 'behind the ball', 'transition window'],
                        reward: ['bonus point', 'next action alive', 'attack the live space', 'before pressure recovers'],
                        risk: ['recovered pressure', 'force the first action', 'lose the ball', 'window is gone'],
                        opponent: ['opponent attacks immediately', 'turnover spot', 'disorganized', 'counter'],
                        continuation: ['play continues live', 'immediate restart', 'turnover', 'next action'],
                    },
                },
                opponentConsequence: 'If the regain is misread or forced after recovery, the opponent inherits the next live attacking advantage immediately.',
                opponentConsequenceSignals: ['opponent attacks immediately', 'turnover spot', 'disorganized', 'counter'],
            },
            sourceRole,
            sourceConstraintId
        )
    }

    if (affordanceTag === 'retain') {
        return createAssemblyGuardrails(
            {
                visibleCue: 'The cue is a connected support picture and an exit lane appearing under pressure.',
                visibleCueSignals: ['support picture', 'exit lane', 'under pressure', 'escape'],
                decisionProblem: 'Players must decide whether the exit is secure enough to use now or whether the pressure picture requires one more support action or recycle.',
                decisionProblemSignals: ['exit is secure', 'use now', 'pressure picture', 'recycle'],
                preservedDecisions: ['what', 'where', 'when', 'why', 'how'],
                interactionExchange: {
                    visibleOpportunityCue: 'a team secures a connected support picture and sees an exit lane appear under pressure',
                    decisionProblem: 'whether the exit lane is secure enough to use now or whether the pressure picture demands another solution',
                    rewardAdvantage: 'they escape pressure cleanly, progress into space, and can earn a bonus point while keeping the attack live',
                    misreadOrForceRisk: 'they panic, clear aimlessly, or force the first outlet into pressure',
                    opponentAdvantage: 'the opponent keeps pressure on the ball or attacks immediately from the turnover',
                    liveContinuation: 'the game continues live through the turnover or under-pressure restart',
                    validationSignals: {
                        cue: ['support picture', 'exit lane', 'under pressure', 'escape'],
                        reward: ['escape pressure cleanly', 'bonus point', 'progress into space', 'attack live'],
                        risk: ['panic', 'clear aimlessly', 'force the first outlet', 'turnover'],
                        opponent: ['opponent keeps pressure', 'opponent attacks immediately', 'turnover'],
                        continuation: ['game continues live', 'under-pressure restart', 'turnover', 'immediately'],
                    },
                },
                opponentConsequence: 'If the exit is forced, the opponent keeps the pressure picture or gains the next live attack from the turnover.',
                opponentConsequenceSignals: ['opponent keeps pressure', 'opponent attacks immediately', 'turnover'],
            },
            sourceRole,
            sourceConstraintId
        )
    }

    if (affordanceTag === 'protect') {
        return createAssemblyGuardrails(
            {
                visibleCue: 'The cue is the central route being threatened before cover arrives or the regain window opens.',
                visibleCueSignals: ['delay the attack', 'protect the central lane', 'cover arrives', 'regain window'],
                decisionProblem: 'Players must decide how long to delay, where to protect, and when the regain window is real enough to step in without opening the direct route.',
                decisionProblemSignals: ['how long to delay', 'where to protect', 'when the regain window is real', 'direct route'],
                preservedDecisions: ['what', 'where', 'when', 'why', 'how'],
                interactionExchange: {
                    visibleOpportunityCue: 'a team delays the attack, protects the central lane, and sees the regain window open as cover arrives',
                    decisionProblem: 'whether the regain window is real enough to attack or whether the team still needs to delay and protect',
                    rewardAdvantage: 'they regain together, break out live, and can earn a bonus point for the protective recovery',
                    misreadOrForceRisk: 'they fail to protect the central route or allow a direct central concession before the regain',
                    opponentAdvantage: 'the opponent attacks through the central space or receives the penalty restart with a direct threat',
                    liveContinuation: 'play continues live from the concession, regain, or restart',
                    validationSignals: {
                        cue: ['delay the attack', 'protect the central lane', 'cover arrives', 'regain window'],
                        reward: ['regain together', 'break out live', 'bonus point', 'protective recovery'],
                        risk: ['fail to protect', 'central concession', 'before the regain', 'direct route'],
                        opponent: ['opponent attacks through the central space', 'penalty restart', 'direct threat'],
                        continuation: ['play continues live', 'concession', 'regain', 'restart'],
                    },
                },
                opponentConsequence: 'If protection breaks down, the opponent owns the direct attacking consequence immediately.',
                opponentConsequenceSignals: ['opponent attacks through the central space', 'penalty restart', 'direct threat'],
            },
            sourceRole,
            sourceConstraintId
        )
    }

    return createAssemblyGuardrails(
        {
            visibleCue: `The cue is the live opportunity created by ${shaping.constraint.title ?? archetype.name} inside ${foundation.constraint.title ?? 'the environment'}.`,
            visibleCueSignals: ['live opportunity', 'under pressure', 'picture opens'],
            decisionProblem: 'Players must decide whether the opportunity is genuinely on, what route to use, and why forcing it would hand the advantage away.',
            decisionProblemSignals: ['whether the opportunity is on', 'what route to use', 'forcing it', 'hand the advantage away'],
            preservedDecisions: ['what', 'where', 'when', 'why', 'how'],
            interactionExchange: {
                visibleOpportunityCue: `a team recognizes the live opportunity created by ${shaping.constraint.title ?? archetype.name}`,
                decisionProblem: 'whether the opportunity is on or whether pressure makes another choice better',
                rewardAdvantage: 'they exploit it under pressure, keep the next action live, and gain the selected advantage',
                misreadOrForceRisk: 'they force the action into pressure or lose the ball while the picture is closed',
                opponentAdvantage: 'the opponent gains the connected restart, regain, or counter-attacking advantage',
                liveContinuation: `play continues live inside the ${foundation.constraint.title ?? 'selected game environment'}`,
                validationSignals: {
                    cue: ['live opportunity', 'under pressure', 'picture opens'],
                    reward: ['keep the next action live', 'selected advantage', 'reward'],
                    risk: ['force the action', 'lose the ball', 'pressure'],
                    opponent: ['opponent gains', 'restart', 'regain', 'counter'],
                    continuation: ['play continues live', 'restart', 'turnover', 'immediately'],
                },
            },
            opponentConsequence: 'If the live opportunity is forced after it closes, the opponent inherits the connected advantage immediately.',
            opponentConsequenceSignals: ['opponent gains', 'restart', 'regain', 'counter'],
        },
        sourceRole,
        sourceConstraintId
    )
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
    const selectedConsequence = consequence && consequence.score > 12 ? consequence : undefined
    const assemblyGuardrails = buildPackageInteractionExchange(
        affordances,
        archetype,
        foundation,
        shaping,
        selectedConsequence
    )

    return {
        foundation,
        shaping,
        consequence: selectedConsequence,
        assemblyGuardrails,
    }
}
