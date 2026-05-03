import OpenAI from 'openai'
import { IActivity } from 'src/models/activity.model'
import { IAffordance } from 'src/models/affordance.model'
import { IConstraint } from 'src/models/constraint.model'
import { ICategory } from 'src/models/category.model'

import LoggingService, { LoggingOptions } from '../services/logging.service'
import type { Activity } from '../system/activity/activity-schema'
import { validateActivitiesAssemblyPayload } from '../system/activity/validate-activity-structure'
import { inferCategoryIdFromText } from '../system/infer-category'
import { SystemAssemblyInput, SystemPipelineError } from '../system/types'

declare type CompletionMessage = {
    role: 'system' | 'user' | 'assistant'

    content: string
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
 */
export async function assembleActivities(
    input: SystemAssemblyInput
): Promise<{ generatedActivities: IActivity[]; structuredActivities: Activity[] }> {
    try {
        const response = await getCompletion([
            {
                role: 'system',
                content: generateAssemblyPrompt(input),
            },
            {
                role: 'system',
                content: JSON.stringify(buildAssemblyPayload(input)),
            },
        ])
        const parsedResponse = parseCompletionAsJSON<Record<string, unknown>>(response)
        if (!parsedResponse) {
            throw new SystemPipelineError('ai-assembly', 'AI assembly returned invalid JSON.')
        }

        let structuredActivities: Activity[]
        try {
            structuredActivities = validateActivitiesAssemblyPayload(parsedResponse)
        } catch (err) {
            const detail = err instanceof Error ? err.message : String(err)
            throw new Error(`Invalid activity structure from AI: ${detail}`)
        }

        /** Derived-only — mapped after Activity validation; do not use as proof of the Activity JSON contract. */
        const generatedActivities = structuredActivities.map((activity) => mapStructuredActivityToLegacy(activity, input))

        return { generatedActivities, structuredActivities }
    } catch (error) {
        throw error
    }
}

function mapStructuredActivityToLegacy(activity: Activity, input: SystemAssemblyInput): IActivity {
    const primaryId = input.affordances.primary._id
    const supportingIds = input.affordances.supporting.map((a) => a._id).filter(Boolean) as string[]
    const constraintIds = [
        input.constraintPackage.foundation.constraint._id,
        input.constraintPackage.shaping.constraint._id,
        input.constraintPackage.consequence?.constraint._id,
    ].filter(Boolean) as string[]

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

function generateAssemblyPrompt(input: SystemAssemblyInput) {
    return `You assemble football activities from system inputs that have already been selected in code.

Do not choose categories.
Do not choose affordances.
Do not choose archetypes.
Do not choose constraints.
Do not invent a new system structure.

Your job is to assemble three concrete activity options that all use the supplied primary affordance, supporting affordance field, archetype, and constraint package.

System principles:
- Assemble perception-based game environments, not compliance-based drills.
- Every constraint must answer what the game makes players notice, care about, and adapt to.
- Start by shaping the environment through space, time, player numbers, scoring, pressure, and field references.
- Highlight the problem through incentives before adding any temporary behavior limit.
- If a temporary behavior constraint is used at all, keep it brief, subordinate to open play, and never make it the main task.
- Never prescribe exact player behaviour when the game can present multiple solutions.
- Preserve decision-making across who, what, where, when, why, and how whenever possible.
- Let learning emerge from interaction under meaningful consequences.
- Affordances must emerge through active opponent interaction, not isolated compliance.
- One team's opportunity must create risk for the other team.
- Preserve continuous play, directional realism, active opposition, and multiple solutions.
- Activities should feel like the real game and fit the requested challenge level.
- Avoid vague language such as "quality chance", "good decision", or "proper technique". Use observable game events instead.
- Constraints include structure and consequence.
- Consequence is part of the constraint package, not a separate logic system.
- The system provides locked guardrails and required design ingredients. You remain responsible for designing and assembling the activity inside those guardrails.

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
- Every string field must be non-empty. Every array must have at least one non-empty string.
- "rules": include at least one full two-sided exchange rule as rules[0] (opportunity + opponent consequence + live continuation).
- "scoring": start with one sentence that states scoring or live advantage for both teams; you may add further lines after it.
- "setup": space, numbers, zones, equipment, and environment only (no compliance drills).
- "teams": who plays whom (e.g. attackers vs defenders), showing opposition.
- "objective": the game problem players read (not a coach command).
- "constraints": reference the supplied foundation, shaping, and (if present) consequence constraint themes in environment language.
- "coachingFocus": short reminders about what to observe (not prescriptive technique commands).

Decision-making language (mandatory for every one of the 3 activities):
- Each activity MUST include explicit decision-making wording in at least one of: "objective", any string in "rules", or any string in "coachingFocus" (not setup/teams/scoring/constraints alone).
- Use clear, varied phrasing in the spirit of (do not rely only on setup): players choose …; players read …; players react …; based on defender pressure …; based on space …; based on teammate support …
- The game must not force a single action. Prefer multiple live options tied to what they see.
- Good: "Players choose whether to play forward, support, switch, or secure possession based on pressure and space."
- Bad: a design where only one channel is legal or the picture collapses to a single scripted next action with no read of pressure or space.
- Never echo or quote compliance-style negatives from these instructions inside JSON; never use forbidden prescriptive patterns listed under Assembly requirements.

Assembly requirements:
- Echo the selected foundation and shaping constraint titles or themes inside constraints/scoring as appropriate; include consequence language when supplied.
- Treat constraintPackage.assemblyGuardrails as the locked design brief.
- Preserve continuous play, directional realism, active opposition, and multiple solutions.
- Never output: players must pass/shoot/dribble, only use, required sequence, repeat this pattern, perform this technique.
- Keep activities distinct while preserving the same system spine from the payload.`
}

export { testLibraryArchetypeToSystemDefinition } from '../system/activity/resolve-test-library-archetype'

