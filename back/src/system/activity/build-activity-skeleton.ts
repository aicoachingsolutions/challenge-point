import type { IAffordance } from '../../models/affordance.model'
import type { ConstraintSelectionCandidate, SystemAssemblyInput } from '../types'
import { registryIdString } from './assembly-package-ids'

/** One of three system-owned activity slots; AI fills wording but must not remove these mechanics. */
export type ActivitySkeletonSlot = {
    /** 1-based activity index */
    activityIndex: 1 | 2 | 3
    /** Archetype name for soft-matching when long archetype bullet text is paraphrased. */
    archetypeName: string
    titleFrame: string
    setupFrame: string
    requiredRuleMechanics: string[]
    requiredScoringMechanics: string[]
    /** Per selected affordance lens — structural obligations (titles + lens copy from package) */
    requiredAffordanceMechanics: string[]
    /** Selected foundation/shaping/consequence + assemblyGuardrails obligations */
    requiredConstraintMechanics: string[]
    /** From selected archetype game form */
    requiredArchetypeMechanics: string[]
    /** Decision stems that must appear somewhere in the activity text bundle */
    requiredDecisionLanguage: string[]
}

export type ActivitySkeletonBundle = {
    activities: ActivitySkeletonSlot[]
}

const DECISION_STEMS = ['choose', 'read', 'react', 'based on', 'decision', 'adapt', 'option'] as const

/** Wording for prompts/validation that must not nudge the model toward prohibited "players must" phrasing. */
function coachSafeGuardrailText(s: string): string {
    return s
        .replace(/\bplayers must decide\b/gi, 'players decide')
        .replace(/\bmust decide whether\b/gi, 'decide whether')
        .replace(/\bmust decide\b/gi, 'decide')
}

function affordanceMechanics(title: string): string[] {
    switch (title) {
        case 'Possession Stability Opportunity':
            return [
                'Rules and scoring must require maintaining or securing possession under pressure; success cannot ignore retention under opponent pressure.',
            ]
        case 'Space Creation Opportunity':
            return [
                'Rules and scoring must require creating or opening space for a teammate; the game must reward or hinge on stretching or unbalancing defenders.',
            ]
        case 'Space Exploitation Opportunity':
            return [
                'Rules and scoring must require using open space to gain advantage; success must connect to attacking or progressing into available space before pressure recovers.',
            ]
        case 'Line-Breaking Opportunity':
            return [
                'Rules and scoring must require breaking or bypassing a defensive line; the game must reward or punish outcomes tied to line-breaking attempts.',
            ]
        case 'Regain Opportunity':
            return [
                'Rules and scoring must reward winning the ball back or forcing a turnover; regain moments must change who attacks and who defends.',
            ]
        default:
            return [
                `Rules and scoring must structurally require players to engage with "${title}" — not as a coaching label only.`,
            ]
    }
}

function archetypeMechanics(archetypeName: string): string[] {
    switch (archetypeName) {
        case 'Directional Possession Games':
            return [
                'Directional target or progression (attack toward a defined goal or end).',
                'Maintain possession under pressure as a live game condition.',
                'Support options and spacing must shape available passes and outlets.',
                'Players must face a decision to secure possession, progress forward, or switch play.',
            ]
        case 'Overload Games':
            return [
                'Numerical or positional overload must be built into the game structure.',
                'Opponent pressure must remain live — not passive shadow defence.',
                'Players must decide whether to use the overload, reset circulation, or switch the attack.',
                'Success must depend on actually exploiting the overload to gain advantage.',
            ]
        case 'Pressing & Regain Games':
            return [
                'Live pressure on the ball or passing lanes.',
                'Clear regain opportunity — winning possession or forcing a turnover.',
                'Immediate transition after regain (attack or defend the counter).',
                'Opponent consequence on turnover — the other side gains a live advantage or restart.',
            ]
        case 'End Zone Games':
            return [
                'Target or end-zone progression as core structure.',
                'Active opposition contesting progression.',
                'Decision to penetrate, support behind the ball, or recycle when the lane is closed.',
                'Scoring tied to reaching or using the end zone / target area.',
            ]
        default:
            return [
                `Game structure must clearly embody "${archetypeName}" — field relations, opposition, and incentives match this game form.`,
            ]
    }
}

/** Split archetype bullets into rule-leaning vs scoring-leaning heuristically for the skeleton arrays. */
function ruleAndScoringFromArchetype(archetypeName: string): { rules: string[]; scoring: string[] } {
    const core = archetypeMechanics(archetypeName)
    switch (archetypeName) {
        case 'Directional Possession Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    core[2],
                    'Two-sided exchange rule must describe opportunity, opponent response, and live continuation.',
                ],
                scoring: [
                    'Scoring or live advantage must reward progression toward the directional target.',
                    'Scoring must reflect maintaining possession under pressure when that is the contest.',
                    core[3],
                ],
            }
        case 'Overload Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    core[2],
                    'Two-sided exchange rule must describe overload opportunity and opponent counter-threat.',
                ],
                scoring: [core[3], 'Points or advantages tied to successful overload entry or exploitation.'],
            }
        case 'Pressing & Regain Games':
            return {
                rules: [core[0], core[1], core[2], 'Rules must chain regain to immediate next-phase play.'],
                scoring: [core[3], 'Scoring or advantage shifts on turnover or regain.'],
            }
        case 'End Zone Games':
            return {
                rules: [core[0], core[1], core[2], 'Rules define how teams contest entry into the target zone.'],
                scoring: [core[3], 'Goals or bonuses tied to end-zone entry or use.'],
            }
        default:
            return {
                rules: ['Rules encode opposition, environment, and live continuation.', core[0]],
                scoring: ['Scoring states advantage for both teams and ties to the archetype contest.'],
            }
    }
}

function uniqueSelectedAffordances(input: SystemAssemblyInput): IAffordance[] {
    const list = [input.affordances.primary, ...input.affordances.supporting]
    const seen = new Set<string>()
    const out: IAffordance[] = []
    for (const affordance of list) {
        const id = registryIdString((affordance as { _id?: unknown; id?: unknown })._id ?? (affordance as { id?: unknown }).id)
        if (!id || seen.has(id)) continue
        seen.add(id)
        out.push(affordance)
    }
    return out
}

function affordanceMechanicsForLens(aff: IAffordance): string[] {
    const title = aff.title ?? ''
    const titleMechanics = affordanceMechanics(title)
    const lines: string[] = []
    for (const line of titleMechanics) {
        lines.push(`Affordance lens "${title}": ${line}`)
    }
    const extras = [aff.designIntent, aff.description, aff.notes, aff.suggestedConstraintPrompt, aff.gameTemplateAnchor]
        .filter(Boolean)
        .join(' ')
        .trim()
    if (extras.length > 0) {
        const snippet = extras.length > 320 ? `${extras.slice(0, 317)}…` : extras
        lines.push(
            `Affordance lens "${title}" — reflect lens behaviors in objective, rules, scoring, constraints, or coachingFocus: ${snippet}`
        )
    }
    return lines
}

function pushConstraintCandidate(lines: string[], role: string, candidate: ConstraintSelectionCandidate): void {
    const c = candidate.constraint
    const title = c.title ?? 'constraint'
    const body = [c.designIntent, c.description, c.notes, c.suggestedConstraintPrompt, c.gameTemplateAnchor].filter(Boolean).join(' ')
    if (body.trim()) {
        lines.push(`Selected ${role} constraint "${title}" — required behaviors: ${body.trim()}`)
    } else {
        lines.push(
            `Selected ${role} constraint "${title}" — title and role must anchor objective, rules, scoring, constraints, or coachingFocus.`
        )
    }
}

function constraintAndGuardrailMechanics(input: SystemAssemblyInput): string[] {
    const pkg = input.constraintPackage
    const lines: string[] = []
    pushConstraintCandidate(lines, 'foundation', pkg.foundation)
    pushConstraintCandidate(lines, 'shaping', pkg.shaping)
    if (pkg.consequence) {
        pushConstraintCandidate(lines, 'consequence', pkg.consequence)
    }

    const g = pkg.assemblyGuardrails
    const visibleSignals = g.visibleCue.signals?.length ? ` Signals: ${g.visibleCue.signals.join('; ')}` : ''
    lines.push(
        `Assembly guardrail — visible cue: ${coachSafeGuardrailText(g.visibleCue.summary)}${visibleSignals ? coachSafeGuardrailText(visibleSignals) : ''}`
    )
    const dims = g.decisionProblem.preservedDecisions.join(', ')
    lines.push(
        `Assembly guardrail — decision problem: ${coachSafeGuardrailText(g.decisionProblem.summary)} Player decision freedom stays live on: ${dims}.`
    )
    lines.push(
        `Interaction exchange — live rule and cues: ${coachSafeGuardrailText(g.interactionExchange.canonicalRule)} Visible opportunity cue: ${coachSafeGuardrailText(g.interactionExchange.visibleOpportunityCue)}. In-play decision: ${coachSafeGuardrailText(g.interactionExchange.decisionProblem)}.`
    )
    lines.push(
        `Interaction exchange — outcomes: reward or advantage when ${coachSafeGuardrailText(g.interactionExchange.rewardAdvantage)}; risk when ${coachSafeGuardrailText(g.interactionExchange.misreadOrForceRisk)}; opponent ${coachSafeGuardrailText(g.interactionExchange.opponentAdvantage)}; continuation ${coachSafeGuardrailText(g.interactionExchange.liveContinuation)}.`
    )
    lines.push(`Opponent consequence: ${coachSafeGuardrailText(g.opponentConsequence.summary)}`)
    if (g.opponentConsequence.signals?.length) {
        lines.push(`Opponent consequence emphasis (reflect in scoring or rules): ${g.opponentConsequence.signals.join('; ')}`)
    }
    return lines
}

function titleFrameForSlot(archetypeName: string, index: 1 | 2 | 3): string {
    const themes = [
        `Environmental emphasis — establish the core ${archetypeName} game picture with clear zones and roles.`,
        `Channel / variation emphasis — same constraint package, different spatial or incentive emphasis.`,
        `Consequence-led emphasis — scoring trade-offs and opponent advantage surface strongly in the challenge.`,
    ]
    return `${themes[index - 1]} Title must stay distinct from the other two activities.`
}

function setupFrameForSlot(input: SystemAssemblyInput, index: 1 | 2 | 3): string {
    const base = `Setup (${index}/3): describe space, numbers, zones, equipment using session field (${input.session.fieldLength ?? '?'}x${input.session.fieldWidth ?? '?'} ${input.session.fieldType ?? 'surface'}). Include opposed teams and restart logic consistent with the skeleton.`
    return base
}

/**
 * Deterministic activity skeleton: three slots with shared mechanics; AI only supplies readable wording.
 */
export function buildActivitySkeleton(input: SystemAssemblyInput): ActivitySkeletonBundle {
    const archetypeName = input.archetype.name
    const affordances = uniqueSelectedAffordances(input)

    const flatAffMechanics = affordances.flatMap((a) => affordanceMechanicsForLens(a))
    const constraintMechanics = constraintAndGuardrailMechanics(input)

    const archRulesScoring = ruleAndScoringFromArchetype(archetypeName)

    const combinedRules: string[] = [
        ...archRulesScoring.rules,
        ...flatAffMechanics.map((m) => `[Affordance] ${m}`),
        ...constraintMechanics.map((m) => `[Constraint] ${m}`),
    ]
    const combinedScoring: string[] = [
        ...archRulesScoring.scoring,
        ...flatAffMechanics.map((m) => `[Affordance] ${m}`),
        ...constraintMechanics.map((m) => `[Constraint] ${m}`),
    ]

    const requiredArchetypeMechanics = archetypeMechanics(archetypeName)

    const slots: ActivitySkeletonSlot[] = ([1, 2, 3] as const).map((idx) => ({
        activityIndex: idx,
        archetypeName,
        titleFrame: titleFrameForSlot(archetypeName, idx),
        setupFrame: setupFrameForSlot(input, idx),
        requiredRuleMechanics: [...combinedRules],
        requiredScoringMechanics: [...combinedScoring],
        requiredAffordanceMechanics: [...flatAffMechanics],
        requiredConstraintMechanics: [...constraintMechanics],
        requiredArchetypeMechanics,
        requiredDecisionLanguage: [...DECISION_STEMS],
    }))

    return { activities: slots }
}

export function formatActivitySkeletonForPrompt(bundle: ActivitySkeletonBundle): string {
    const lines: string[] = [
        'SYSTEM-OWNED ACTIVITY SKELETON (mandatory — do not invent a different structure):',
        'You are filling coach-facing wording for this skeleton only.',
        'Do not omit any required mechanics listed below.',
        'Every required mechanic must be satisfied inside objective, rules, scoring, constraints, and/or coachingFocus with clear natural language.',
        'Do not remove meaning; paraphrase is allowed.',
        '',
    ]

    const ref = bundle.activities[0]
    if (ref) {
        lines.push('Shared mechanics (apply to activities 1, 2, and 3 — each activity must satisfy all of these):')
        lines.push('requiredArchetypeMechanics:')
        for (const r of ref.requiredArchetypeMechanics) lines.push(`  - ${r}`)
        lines.push('requiredAffordanceMechanics:')
        for (const r of ref.requiredAffordanceMechanics) lines.push(`  - ${r}`)
        lines.push('requiredConstraintMechanics (foundation, shaping, consequence, assembly guardrails):')
        for (const r of ref.requiredConstraintMechanics) lines.push(`  - ${r}`)
        lines.push('requiredRuleMechanics:')
        for (const r of ref.requiredRuleMechanics) lines.push(`  - ${r}`)
        lines.push('requiredScoringMechanics:')
        for (const r of ref.requiredScoringMechanics) lines.push(`  - ${r}`)
        lines.push('requiredDecisionLanguage (use whole-word stems somewhere in each activity bundle):')
        lines.push(`  - ${ref.requiredDecisionLanguage.join(', ')}`)
        lines.push('')
    }

    for (const slot of bundle.activities) {
        lines.push(`--- Activity ${slot.activityIndex} (per-slot framing only) ---`)
        lines.push(`titleFrame: ${slot.titleFrame}`)
        lines.push(`setupFrame: ${slot.setupFrame}`)
        lines.push('')
    }

    return lines.join('\n')
}
