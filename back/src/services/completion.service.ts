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
            },
            secondary: input.affordances.secondary
                ? {
                      _id: input.affordances.secondary._id,
                      title: input.affordances.secondary.title,
                      description: input.affordances.secondary.description,
                      affordanceTagGroup: input.affordances.secondary.affordanceTagGroup,
                      designIntent: input.affordances.secondary.designIntent,
                  }
                : null,
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
                role: input.constraintPackage.foundation.role,
            },
            shaping: {
                _id: input.constraintPackage.shaping.constraint._id,
                title: input.constraintPackage.shaping.constraint.title,
                description: input.constraintPackage.shaping.constraint.description,
                role: input.constraintPackage.shaping.role,
            },
            consequence: input.constraintPackage.consequence
                ? {
                      _id: input.constraintPackage.consequence.constraint._id,
                      title: input.constraintPackage.consequence.constraint.title,
                      description: input.constraintPackage.consequence.constraint.description,
                      role: input.constraintPackage.consequence.role,
                  }
                : null,
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

Your job is to assemble three concrete activity options that all use the supplied affordance(s), archetype, and constraint package.

System principles:
- Never prescribe exact player behaviour when the game can present multiple solutions.
- Preserve decision-making.
- Let learning emerge from interaction.
- Constraints include structure and consequence.
- Consequence is part of the constraint package, not a separate logic system.
- Activities should feel like the real game and fit the requested challenge level.

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
- Copy the selected affordance IDs into affordancesUsed. Do not add different affordance IDs.
- Copy the selected constraint IDs into constraintsUsed. Do not add different constraint IDs.
- Use the consequence through the rules / scoring / winning condition when one is supplied.
- If a consequence constraint is supplied, operationalize its actual reward / penalty / restart logic from the selected consequence description instead of falling back to generic scoring language.
- Keep scoring and winning condition subordinate to the selected constraint package.
- Keep activities distinct from any previous activities provided in the payload while preserving the same system spine.`
}

