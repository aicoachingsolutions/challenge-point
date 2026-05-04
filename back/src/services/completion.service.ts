import OpenAI from 'openai'
import { IActivity } from 'src/models/activity.model'
import { IAffordance } from 'src/models/affordance.model'
import { IConstraint } from 'src/models/constraint.model'
import { ICategory } from 'src/models/category.model'

import LoggingService, { LoggingOptions } from '../services/logging.service'
import type { Activity } from '../system/activity/activity-schema'
import { getAssemblySelectedAffordanceIds, getAssemblySelectedConstraintIds } from '../system/activity/assembly-package-ids'
import { validateActivitiesAssemblyPayload } from '../system/activity/validate-activity-structure'
import { inferCategoryIdFromText } from '../system/infer-category'
import { ArchetypeDefinition, SystemAssemblyInput, SystemPipelineError } from '../system/types'

declare type CompletionMessage = {
    role: 'system' | 'user' | 'assistant'

    content: string
}

/** Thrown when strict Activity validation fails on both initial assembly and the single retry. */
export class ActivityAssemblyValidationError extends Error {
    override readonly name = 'ActivityAssemblyValidationError'

    readonly assemblyAttempts: number

    readonly retriedAfterValidationFailure: boolean

    readonly validationFailureReasons: string[]

    constructor(params: { message: string; assemblyAttempts: number; validationFailureReasons: string[] }) {
        super(params.message)
        this.assemblyAttempts = params.assemblyAttempts
        this.retriedAfterValidationFailure = params.assemblyAttempts > 1
        this.validationFailureReasons = params.validationFailureReasons
    }
}

export type AssembleActivitiesResult = {
    generatedActivities: IActivity[]

    structuredActivities: Activity[]

    assemblyAttempts: number

    retriedAfterValidationFailure: boolean

    /** Reasons from the first attempt when a retry was triggered after strict Activity validation failed. */
    validationFailureReasons?: string[]
}

declare type CompletionResponseFormat =
    | { type: 'text' }
    | { type: 'json_object' }
    

declare type CompletionOptions = {
    model?: string

    temperature?: number

    response_format?: CompletionResponseFormat

    max_tokens?: number
}

const openai = new OpenAI()

const DEFAULT_MODEL = 'gpt-4o'

const DEFAULT_TEMPERATURE = 1.0

const DEFAULT_COMPLETION_OPTIONS: CompletionOptions = {
    model: DEFAULT_MODEL,

    temperature: 0.4,

    response_format: { type: 'json_object' },

    max_tokens: 4096, // max is 4096 for gpt-4o
}

const CompletionService = {
    // service functions

    getCompletion,

    // utils

    logger,

    // defaults

    DEFAULT_MODEL,

    DEFAULT_TEMPERATURE,

    DEFAULT_COMPLETION_OPTIONS,
}

export default CompletionService

/* SERVICE FUNCTIONS */

async function getCompletion(messages: CompletionMessage[], options: Partial<CompletionOptions> = {}): Promise<string> {
    const mergedOptions: CompletionOptions | undefined = {
        ...DEFAULT_COMPLETION_OPTIONS,

        ...options,
    }

    let response: string | null = null

    logger('Requesting Completion...')

    try {
        const completion = await openai.chat.completions.create({
            model: mergedOptions.model,

            stream: false,

            n: 1,

            messages: messages,

            temperature: mergedOptions.temperature,

            response_format: mergedOptions.response_format,

            max_tokens: mergedOptions.max_tokens,
        })

        logger({ usage: completion.usage })

        response = completion.choices[0].message.content

        if (!response) {
            throw new Error('No message response')
        }
    } catch (completionError) {
        logger('Completion Error', 'error', completionError)

        throw new Error('Completion Error')
    }

    logger('Received Completion')

    return response
}

function parseCompletionAsJSON<T>(messageContent: string, reviver?: (key: string, value: any) => any): T | null {
    let parsed: T | null = null

    logger('Attempting to parse...')

    try {
        parsed = JSON.parse(messageContent, reviver)
    } catch (parsingError) {
        logger('Parsing Error', 'error', parsingError, { messageContent })

        return null
    }

    logger('Parsed')

    return parsed
}

/* UTILS */

function logger(message: any, level?: 'log' | 'warn' | 'error', error?: any, data?: any) {
    const logOptions: LoggingOptions = {
        writeLogFile: true,
    }

    if (error) {
        LoggingService.log(
            {
                level: level ?? 'error',

                service: 'Completion Service',

                message: String(message),

                error: error,

                data: data,
            },

            logOptions
        )
    } else {
        if (level && level !== 'log') {
            LoggingService.log(
                {
                    level: level,

                    service: 'Completion Service',

                    message: String(message),

                    data: data,
                },

                logOptions
            )
        }
    }
}

export async function generateAffordanceCategory(affordance: IAffordance, categories: ICategory[]) {
    const sourceText = [
        affordance.title,
        affordance.description,
        affordance.type,
        affordance.affordanceTagGroup,
        affordance.notes,
        affordance.designIntent,
    ]
        .filter(Boolean)
        .join(' ')

    return {
        categoryId: inferCategoryIdFromText(sourceText, categories),
    }
}

export async function generateConstraintCategory(constraint: IConstraint, categories: ICategory[]) {
    const sourceText = [
        constraint.title,
        constraint.description,
        constraint.type,
        constraint.affordanceTagGroup,
        constraint.notes,
        constraint.designIntent,
        constraint.constraintArchetype,
        constraint.constraintRole,
    ]
        .filter(Boolean)
        .join(' ')

    return {
        categoryId: inferCategoryIdFromText(sourceText, categories),
    }
}

/**
 * Real AI assembly entrypoint used by the app route after in-code selection.
 * Call only after `SystemAssemblyInput` is fully built (selection complete).
 *
 * Proof contract: AI conforms iff `structuredActivities` parses and passes `validateActivitiesAssemblyPayload`.
 * `generatedActivities` is a derived legacy projection for downstream compatibility — not evidence of schema conformance.
 *
 * On strict Activity validation failure after valid JSON, performs exactly one retry with validator-derived reasons
 * in the user message. Invalid JSON does not trigger a validation retry.
 */
function snapshotAssemblyDesign(input: SystemAssemblyInput): {
    archetypeId: string
    affordanceKey: string
    constraintKey: string
} {
    return {
        archetypeId: input.archetype.id,
        affordanceKey: getAssemblySelectedAffordanceIds(input).join(','),
        constraintKey: getAssemblySelectedConstraintIds(input).join(','),
    }
}

function assertAssemblyDesignUnchanged(
    lock: ReturnType<typeof snapshotAssemblyDesign>,
    input: SystemAssemblyInput
): void {
    const next = snapshotAssemblyDesign(input)
    if (
        next.archetypeId !== lock.archetypeId ||
        next.affordanceKey !== lock.affordanceKey ||
        next.constraintKey !== lock.constraintKey
    ) {
        throw new SystemPipelineError(
            'ai-assembly',
            'Assembly invariant violated: archetype, affordance IDs, or constraint IDs changed during assembly or retry.'
        )
    }
}

export async function assembleActivities(input: SystemAssemblyInput): Promise<AssembleActivitiesResult> {
    const assemblyDesignLock = snapshotAssemblyDesign(input)

    const initialMessages: CompletionMessage[] = [
        {
            role: 'system',
            content: generateAssemblyPrompt(input),
        },
        {
            role: 'system',
            content: JSON.stringify(buildAssemblyPayload(input)),
        },
    ]

    const response1 = await getCompletion(initialMessages)
    const parsed1 = parseCompletionAsJSON<Record<string, unknown>>(response1)
    if (!parsed1) {
        throw new SystemPipelineError('ai-assembly', 'AI assembly returned invalid JSON.')
    }

    try {
        const structuredActivities = validateActivitiesAssemblyPayload(parsed1)
        const generatedActivities = structuredActivities.map((activity) => mapStructuredActivityToLegacy(activity, input))
        assertAssemblyDesignUnchanged(assemblyDesignLock, input)
        return {
            generatedActivities,
            structuredActivities,
            assemblyAttempts: 1,
            retriedAfterValidationFailure: false,
        }
    } catch (firstErr) {
        const firstReason = firstErr instanceof Error ? firstErr.message : String(firstErr)

        const retryMessages: CompletionMessage[] = [
            ...initialMessages,
            { role: 'assistant', content: response1 },
            { role: 'user', content: buildAssemblyRetryUserMessage([firstReason]) },
        ]

        const response2 = await getCompletion(retryMessages)
        const parsed2 = parseCompletionAsJSON<Record<string, unknown>>(response2)
        if (!parsed2) {
            throw new ActivityAssemblyValidationError({
                message: `Invalid activity structure from AI after retry: first failure ${firstReason}; retry response was not valid JSON.`,
                assemblyAttempts: 2,
                validationFailureReasons: [firstReason, 'Retry response was not valid JSON.'],
            })
        }

        try {
            const structuredActivities = validateActivitiesAssemblyPayload(parsed2)
            const generatedActivities = structuredActivities.map((activity) => mapStructuredActivityToLegacy(activity, input))
            assertAssemblyDesignUnchanged(assemblyDesignLock, input)
            return {
                generatedActivities,
                structuredActivities,
                assemblyAttempts: 2,
                retriedAfterValidationFailure: true,
                validationFailureReasons: [firstReason],
            }
        } catch (secondErr) {
            const secondReason = secondErr instanceof Error ? secondErr.message : String(secondErr)
            throw new ActivityAssemblyValidationError({
                message: `Invalid activity structure from AI after retry. First: ${firstReason}. Second: ${secondReason}`,
                assemblyAttempts: 2,
                validationFailureReasons: [firstReason, secondReason],
            })
        }
    }
}

function buildDecisionLanguageRetryAddendum(validatorReasons: string[]): string {
    const joined = validatorReasons.join('\n')
    if (!joined.includes('No clear decision-making language')) {
        return ''
    }

    const activityNums: number[] = []
    for (const r of validatorReasons) {
        if (!r.includes('No clear decision-making language')) continue
        const m = r.match(/Activity\s+(\d+)\s*:/i)
        if (m) {
            const n = Number.parseInt(m[1], 10)
            if (Number.isFinite(n) && n >= 1) activityNums.push(n)
        }
    }
    const unique = [...new Set(activityNums)].sort((a, b) => a - b)

    const lines: string[] = ['\n\nDecision-making language (required fix):']
    if (unique.length === 0) {
        lines.push(
            'The failed activity must include clear decision-making language in objective, rules, or coachingFocus using at least one of: choose, read, react, based on, decision, adapt, option.'
        )
    } else {
        for (const n of unique) {
            lines.push(
                `For Activity ${n}, include clear decision-making language in objective, rules, or coachingFocus using at least one of: choose, read, react, based on, decision, adapt, option.`
            )
        }
        if (unique.includes(3)) {
            lines.push('Activity 3 must include explicit decision language.')
        }
    }

    return lines.join('\n')
}

function buildAssemblyRetryUserMessage(validatorReasons: string[]): string {
    const bullets = validatorReasons.map((r) => `- ${r}`).join('\n')
    const decisionAddendum = buildDecisionLanguageRetryAddendum(validatorReasons)
    return `The previous output failed validation for:
${bullets}

Regenerate the full JSON payload.
Do not explain.
Return valid JSON only.
Preserve the selected archetype, affordance lenses, and constraints.
Do not add new affordances or constraints.

Avoid player-directed imperative obligation language.
Each activity needs explicit decision language such as choose, read, react, based on, decision, adapt, or option.

Do not echo exact prohibited phrases if avoidable.${decisionAddendum}`
}

function mapStructuredActivityToLegacy(activity: Activity, input: SystemAssemblyInput): IActivity {
    const selectedAffordanceIds = getAssemblySelectedAffordanceIds(input)
    const primaryId = selectedAffordanceIds[0] ?? ''
    const supportingIds = selectedAffordanceIds.slice(1)
    const constraintIds = getAssemblySelectedConstraintIds(input)

    const twoSidedExchangeRule = activity.rules[0]
    const rules = [...activity.rules]
    const scoringTrim = activity.scoring.trim()
    const firstScoringLine = scoringTrim.split(/\n/, 1)[0] || scoringTrim
    const twoSidedScoringConsequence = firstScoringLine
    const scoringSystem = scoringTrim.startsWith(twoSidedScoringConsequence) ? scoringTrim : `${twoSidedScoringConsequence} ${scoringTrim}`

    const guard = input.constraintPackage.assemblyGuardrails
    const constraintSummary = [
        input.constraintPackage.foundation.constraint.title,
        input.constraintPackage.shaping.constraint.title,
        input.constraintPackage.consequence?.constraint.title,
        guard.visibleCue.summary,
        activity.setup,
        activity.constraints.join(' '),
    ]
        .filter(Boolean)
        .join(' ')

    const winCondition = `Teams compete live; ${activity.scoring} Opponent gains advantage immediately on turnovers or forced misreads against pressure.`

    const now = new Date()
    const playerGroupSizes =
        input.session.playerCount && Number(input.session.playerCount) > 0 ? Number(input.session.playerCount) : 8

    const legacy = {
        title: activity.title,
        constraint: constraintSummary,
        intent: activity.objective,
        twoSidedExchangeRule,
        twoSidedScoringConsequence,
        playerGroupSizes,
        scaffolding: activity.coachingFocus,
        extensions: [activity.teams],
        equipmentNeeded: ['Marking cones or discs if needed for zones described in setup.'],
        rules,
        scoringSystem,
        winCondition,
        affordancesUsed: [primaryId, ...supportingIds] as any,
        constraintsUsed: constraintIds as any,
        systemTrace: {
            primaryAffordanceId: primaryId,
            supportingAffordanceIds: supportingIds,
            archetypeId: input.archetype.id,
            archetypeName: input.archetype.name,
            foundationConstraintId: input.constraintPackage.foundation.constraint._id,
            shapingConstraintId: input.constraintPackage.shaping.constraint._id,
            consequenceConstraintId: input.constraintPackage.consequence?.constraint._id,
        },
        createdAt: now,
        updatedAt: now,
    } as IActivity & { twoSidedExchangeRule: string; twoSidedScoringConsequence: string }

    return legacy as IActivity
}

function buildAssemblyPayload(input: SystemAssemblyInput) {
    const selectedAffordanceIds = getAssemblySelectedAffordanceIds(input)
    const selectedConstraintIds = getAssemblySelectedConstraintIds(input)

    return {
        session: {
            playerCount: input.session.playerCount,
            ageGroup: input.session.ageGroup,
            skillLevel: input.session.skillLevel,
            fieldLength: input.session.fieldLength,
            fieldWidth: input.session.fieldWidth,
            fieldType: input.session.fieldType,
        },
        coachInput: input.coachInput,
        selectedAffordanceIds,
        selectedConstraintIds,
        selectedAffordances: {
            primary: {
                _id: input.affordances.primary._id,
                title: input.affordances.primary.title,
                description: input.affordances.primary.description,
                affordanceTagGroup: input.affordances.primary.affordanceTagGroup,
                designIntent: input.affordances.primary.designIntent,
                notes: input.affordances.primary.notes,
                suggestedConstraintPrompt: input.affordances.primary.suggestedConstraintPrompt,
                gameTemplateAnchor: input.affordances.primary.gameTemplateAnchor,
            },
            supporting: input.affordances.supporting.map((affordance) => ({
                _id: affordance._id,
                title: affordance.title,
                description: affordance.description,
                affordanceTagGroup: affordance.affordanceTagGroup,
                designIntent: affordance.designIntent,
                notes: affordance.notes,
                suggestedConstraintPrompt: affordance.suggestedConstraintPrompt,
                gameTemplateAnchor: affordance.gameTemplateAnchor,
            })),
            viableCandidates: input.affordances.viableCandidates.map((affordance) => ({
                _id: affordance._id,
                title: affordance.title,
                affordanceTagGroup: affordance.affordanceTagGroup,
            })),
        },
        archetype: {
            id: input.archetype.id,
            name: input.archetype.name,
            description: input.archetype.description,
            assemblyCues: input.archetype.assemblyCues,
            consequenceCues: input.archetype.consequenceCues,
        },
        constraintPackage: {
            foundation: {
                _id: input.constraintPackage.foundation.constraint._id,
                title: input.constraintPackage.foundation.constraint.title,
                description: input.constraintPackage.foundation.constraint.description,
                type: input.constraintPackage.foundation.constraint.type,
                designIntent: input.constraintPackage.foundation.constraint.designIntent,
                notes: input.constraintPackage.foundation.constraint.notes,
                suggestedConstraintPrompt: input.constraintPackage.foundation.constraint.suggestedConstraintPrompt,
                gameTemplateAnchor: input.constraintPackage.foundation.constraint.gameTemplateAnchor,
                role: input.constraintPackage.foundation.role,
            },
            shaping: {
                _id: input.constraintPackage.shaping.constraint._id,
                title: input.constraintPackage.shaping.constraint.title,
                description: input.constraintPackage.shaping.constraint.description,
                type: input.constraintPackage.shaping.constraint.type,
                designIntent: input.constraintPackage.shaping.constraint.designIntent,
                notes: input.constraintPackage.shaping.constraint.notes,
                suggestedConstraintPrompt: input.constraintPackage.shaping.constraint.suggestedConstraintPrompt,
                gameTemplateAnchor: input.constraintPackage.shaping.constraint.gameTemplateAnchor,
                role: input.constraintPackage.shaping.role,
            },
            consequence: input.constraintPackage.consequence
                ? {
                      _id: input.constraintPackage.consequence.constraint._id,
                      title: input.constraintPackage.consequence.constraint.title,
                      description: input.constraintPackage.consequence.constraint.description,
                      designIntent: input.constraintPackage.consequence.constraint.designIntent,
                      notes: input.constraintPackage.consequence.constraint.notes,
                      suggestedConstraintPrompt: input.constraintPackage.consequence.constraint.suggestedConstraintPrompt,
                      gameTemplateAnchor: input.constraintPackage.consequence.constraint.gameTemplateAnchor,
                      role: input.constraintPackage.consequence.role,
                  }
                : null,
            assemblyGuardrails: input.constraintPackage.assemblyGuardrails,
            validationWarnings: input.constraintPackage.validationWarnings ?? [],
        },
        previousActivities: input.previousActivities.map((activity) => ({
            title: activity.title,
            constraint: activity.constraint,
            intent: activity.intent,
        })),
    }
}

function archetypeIdentityPromptSection(archetype: ArchetypeDefinition): string {
    const lines: string[] = [
        'Archetype identity (mandatory — applies to every one of the three activities):',
        'The generated activity MUST clearly reflect the selected archetype.',
        'If the activity does not clearly reflect the archetype identity, it will be rejected.',
        '',
        `Selected archetype: "${archetype.name}".`,
        '',
    ]

    if (archetype.name === 'Pressing & Regain Games') {
        lines.push(
            'For Pressing & Regain Games:',
            '- The primary game condition must involve regaining possession under pressure.',
            '- The activity must create immediate transition moments after regain.',
            '- Opponents must create pressure and regain opportunities.',
            '- The game should not resemble positional possession or width-only play.',
            '',
            'Do NOT default to generic wide play, spacing, or overload patterns unless they are directly tied to regain and transition moments.',
            ''
        )
    } else if (archetype.assemblyCues.length > 0) {
        lines.push('Ground the dominant game story in cues aligned with this archetype:')
        for (const cue of archetype.assemblyCues) {
            lines.push(`- ${cue}`)
        }
        lines.push('')
    }

    return lines.join('\n')
}

function generateAssemblyPrompt(input: SystemAssemblyInput) {
    const selectedAffordanceIds = getAssemblySelectedAffordanceIds(input)
    const selectedAffordanceLines = selectedAffordanceIds.map((id) => `- ${id}`).join('\n')

    const selectedConstraintIds = getAssemblySelectedConstraintIds(input)
    const selectedConstraintLines = selectedConstraintIds.map((id) => `- ${id}`).join('\n')

    return `You assemble football activities from system inputs that have already been selected in code.

Use "selectedAffordanceIds" from the payload as the source of truth for affordance IDs.
Do not derive "affordancesUsed" from "primary" versus "supporting" labels.
You MUST return affordancesUsed as an array containing ALL of the following IDs exactly as provided.

SelectedAffordances (REQUIRED):
${selectedAffordanceLines}

Your affordancesUsed array must contain EXACTLY these IDs from "selectedAffordanceIds".
Do not omit any.
Do not add any.
Do not change order.
Do not infer or rename.

If your affordancesUsed array does not exactly match this list, your response will be rejected.

Use "selectedConstraintIds" from the payload as the source of truth for constraint IDs.
You MUST return constraintsUsed as an array containing ALL of the following IDs exactly as provided.

SelectedConstraints (REQUIRED):
${selectedConstraintLines}

constraintsUsed must EXACTLY match the "selectedConstraintIds" list.
Your constraintsUsed array must contain EXACTLY these IDs.
Do not omit any.
Do not add any.
Do not change order.
Do not infer or rename.

If your constraintsUsed array does not exactly match this list, your response will be rejected.

Do not choose categories.
Do not choose affordances.
Do not choose archetypes.
Do not choose constraints.
Do not invent a new system structure.

Your job is to assemble three concrete activity options that all use the supplied selected affordance set, archetype, and constraint package.

System principles:
- Assemble perception-based game environments, not compliance-based drills.
- Every constraint needs to answer what the game makes players notice, care about, and adapt to.
- Start by shaping the environment through space, time, player numbers, scoring, pressure, and field references.
- Highlight the problem through incentives before adding any temporary behavior limit.
- If a temporary behavior constraint is used at all, keep it brief, subordinate to open play, and never make it the main task.
- Never prescribe exact player behaviour when the game can present multiple solutions.
- Preserve decision-making across who, what, where, when, why, and how whenever possible.
- Let learning emerge from interaction under meaningful consequences.
- Affordances need to emerge through active opponent interaction, not isolated compliance.
- One team's opportunity needs to create risk for the other team.
- Preserve continuous play, directional realism, active opposition, and multiple solutions.
- Activities should feel like the real game and fit the requested challenge level.
- Avoid vague language such as "quality chance", "good decision", or "proper technique". Use observable game events instead.
- Constraints include structure and consequence.
- Consequence is part of the constraint package, not a separate logic system.
- The system provides locked guardrails and required design ingredients. You remain responsible for designing and assembling the activity inside those guardrails.

${archetypeIdentityPromptSection(input.archetype)}
Output requirements (system-owned schema — do not add, remove, or rename keys):
- Return valid JSON only.
- Top-level shape exactly:
{
  "activities": [
    {
      "title": string,
      "setup": string,
      "teams": string,
      "objective": string,
      "rules": string[],
      "scoring": string,
      "constraints": string[],
      "coachingFocus": string[]
    }
  ]
}
- Do NOT include a "validation" field; the server computes it.
- Produce exactly 3 objects inside "activities".
- Ensure every string field is non-empty. Ensure every array has at least one non-empty string.
- "rules": include at least one full two-sided exchange rule as rules[0] (opportunity + opponent consequence + live continuation).
- "scoring": start with one sentence that states scoring or live advantage for both teams; you may add further lines after it.
- "setup": space, numbers, zones, equipment, and environment only (no compliance drills).
- "teams": who plays whom (e.g. attackers vs defenders), showing opposition.
- "objective": the game problem players read (not a coach command).
- "constraints": reference the supplied foundation, shaping, and (if present) consequence constraint themes in environment language.
- "coachingFocus": short reminders about what to observe (not prescriptive technique commands).

Decision-making language (required for every one of the 3 activities):
- The automated check joins setup, teams, objective, scoring, rules, constraints, and coachingFocus and requires open-decision vocabulary somewhere in that bundle. Reliable stems include whole-word use of: choose, read, react, adapt, option (singular phrasing such as "an option" passes; plural-only wording can miss), based on, if … then …, decision (including decision-making), when … decide ….
- Activity 3 (consequence-led) still needs that vocabulary: lead with scoring and trade-offs, and weave at least one cue into objective, rules[0], or coachingFocus so the block never reads as points-only boilerplate.
- Prefer objective, rules, and coachingFocus for those cues when possible; setup may include them only while staying spatial and environmental (not drill orders).
- Preserve multiple live options tied to what players see; avoid collapsing the picture to one scripted channel.
- Good pattern: choosing whether to play forward, support, switch, or secure possession based on pressure and space.
- Bad pattern: a design where only one channel is legal or the picture collapses to a single scripted next action with no read of pressure or space.
- Never echo compliance-style negatives from these instructions inside JSON; avoid prescriptive command patterns the server rejects (see Assembly requirements).

Assembly requirements:
- Echo the selected foundation and shaping constraint titles or themes inside constraints/scoring as appropriate; include consequence language when supplied.
- Treat constraintPackage.assemblyGuardrails as the locked design brief.
- Preserve continuous play, directional realism, active opposition, and multiple solutions.
- Avoid prescriptive command chains the server rejects: ordered skill drills, "only use" locks, fixed repetition scripts, technique scripts — phrase as environment, trade-offs, and incentives instead.
- Obligation-to-action lines directed at whoever has the ball (compulsion wording plus a named technical move) are substring-rejected; write invitations, live risks, reads, and consequences instead of drill orders.
- Keep activities distinct while preserving the same system spine from the payload.

Diversity across the three activities (required):
- Unique titles: ensure each of the three activities has a clearly different title; do not reuse the same title string twice. Avoid stock duplicate names such as two slots both using the same wide-zone exploitation template unless the selected constraint package and affordances overwhelmingly center on that single framing (prefer distinct titles even then).
- Vary constraint expression: the same selected constraints apply to all three activities, but express each constraint package through different environment mechanics and wording across activities 1–3. Re-theme the same supplied constraints without adding or renaming constraints — e.g. Interception Reward may read as bonus for clean regain, immediate counter window after a turnover, or possession switch with a score multiplier — while still clearly mapping to that constraint. Do not invent new constraint types or IDs.
- Wide-zone balance: when Wide Zone Advantage (or similar wide-area shaping) is in the package, include it, but do not let wide channels be the only story. Blend width with other selected themes and affordances: line-breaking, support angles, transition attack, regain, space behind, possession stability, finishing — as relevant to the supplied primary/supporting affordances and constraint titles.
- Preserve all hard rules above: opposition, open-decision vocabulary in the activity text bundle, consequence/scoring, no prescriptive phrases, only selected constraints and guardrails — diversity shall not replace any of these.
- Do not use imperative drill phrasing that the server rejects; describe environment and choices, not ordered techniques.`
}

export { testLibraryArchetypeToSystemDefinition } from '../system/activity/resolve-test-library-archetype'

