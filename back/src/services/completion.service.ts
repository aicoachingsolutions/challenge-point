import OpenAI from 'openai'
import { IActivity } from 'src/models/activity.model'
import { IAffordance } from 'src/models/affordance.model'
import { ICategory } from 'src/models/category.model'
import { IConstraint } from 'src/models/constraint.model'

import LoggingService, { LoggingOptions } from '../services/logging.service'
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

export async function assembleActivities(input: SystemAssemblyInput): Promise<{ generatedActivities: IActivity[] }> {
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
        const parsedResponse = parseCompletionAsJSON<{ generatedActivities: IActivity[] }>(response)
        if (!parsedResponse) {
            throw new SystemPipelineError('ai-assembly', 'AI assembly returned invalid JSON.')
        }

        return parsedResponse
    } catch (error) {
        throw error
    }
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

Output requirements:
- Return valid JSON only.
- Use this shape:
{
  "generatedActivities": [
    {
      "title": string,
      "constraint": string,
      "intent": string,
      "playerGroupSizes": number,
      "scaffolding": string[],
      "extensions": string[],
      "equipmentNeeded": string[],
      "affordancesUsed": string[],
      "constraintsUsed": string[],
      "rules": string[],
      "scoringSystem": string,
      "winCondition": string
    }
  ]
}

Assembly requirements:
- Produce exactly 3 activities.
- The "constraint" field must explicitly include the selected foundation constraint title and shaping constraint title.
- If a consequence constraint is supplied, the "constraint" field must explicitly include that title as well.
- Copy the primary affordance ID and any supporting affordance IDs into affordancesUsed. Do not add viable candidate IDs unless they also appear in the supporting affordance field.
- Copy the selected constraint IDs into constraintsUsed. Do not add different constraint IDs.
- Keep the primary affordance central. Supporting affordances may appear as adjacent behaviors, but do not replace the selected primary affordance.
- Use the consequence through the rules / scoring / winning condition when one is supplied.
- Treat the consequence payload as the canonical brief for live game consequences. Use its title, description, design intent, notes, suggested constraint prompt, and game template anchor when present.
- If a consequence constraint is supplied, operationalize its actual reward / penalty / restart logic from the selected consequence description instead of falling back to generic scoring language.
- If the consequence metadata implies both a reward and a penalty, restart, turnover, or loss-of-possession mechanic, make both sides concrete in the rules / scoring / winning condition.
- Use the foundation and shaping metadata to define the environment first, then the incentive emphasis.
- Write the "constraint" field as an environment summary, not as a checklist of instructions.
- Write "intent" as the game problem being exposed to players, not as a coach command.
- Keep rules short and game-like. Describe live conditions, restarts, scoring consequences, and opponent responses instead of technical instructions.
- Make the activity fail if one team is removed; the design must depend on live opposition.
- Make continuous play explicit through turnovers, restarts, recovery, or immediate next actions.
- Make directional realism explicit through goals, target spaces, progression routes, or defended exits.
- Ensure players can solve the problem in multiple ways. Do not collapse the activity into one pattern, one route, or one action.
- Use observable outcomes in scoring and win conditions: goals, entries, exits, regains, delays, recoveries, switches, or other visible game events.
- Resolve any validation warnings in the payload by shifting from behavior control to environment and incentive design.
- Keep scoring and winning condition subordinate to the selected constraint package.
- Keep activities distinct from any previous activities provided in the payload while preserving the same system spine.`
}

