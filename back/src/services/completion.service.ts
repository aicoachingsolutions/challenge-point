import OpenAI from 'openai'
import { IActivity } from 'src/models/activity.model'
import { IAffordance } from 'src/models/affordance.model'
import { IConstraint } from 'src/models/constraint.model'
import { ICategory } from 'src/models/category.model'

import LoggingService, { LoggingOptions } from '../services/logging.service'
import type { Activity } from '../system/activity/activity-schema'
import {
    getAssemblySelectedAffordanceIds,
    getAssemblySelectedConstraintIds,
    registryIdString,
} from '../system/activity/assembly-package-ids'
import { buildActivityMechanicsFromSkeleton, type ActivityMechanicsBundle } from '../system/activity/build-activity-mechanics'
import { validateActivityMechanics } from '../system/activity/validate-activity-mechanics'
import {
    buildActivitySkeleton,
    formatActivitySkeletonForPrompt,
    type ActivitySkeletonBundle,
} from '../system/activity/build-activity-skeleton'
import { type ActivityPolish, validateActivityPolishPayload } from '../system/activity/validate-activity-polish'
import { validateActivitiesAgainstSkeleton } from '../system/activity/validate-activity-skeleton'
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

/**
 * OpenAI client configured for predictable production behavior.
 * - timeout: 45s caps a single API call so a hung upstream does not hold the request handler
 *   indefinitely. Stacks on top of assembleActivities' 2-attempt retry → worst-case AI time
 *   per request is bounded at ~90s.
 * - maxRetries: 1 caps the SDK's internal retry behavior. Default is 2, which combined with
 *   our own retry in assembleActivities could trigger up to 6 actual API calls per user request
 *   on a misbehaving upstream. Limit to 1 SDK retry — assembleActivities provides the second
 *   logical retry where it's needed (validation failure), not on every transient blip.
 */
const openai = new OpenAI({
    timeout: 45_000,
    maxRetries: 1,
})

/**
 * Circuit breaker for OpenAI calls. After CIRCUIT_FAILURE_THRESHOLD consecutive failures the
 * circuit opens and getCompletion fails fast for CIRCUIT_COOLDOWN_MS before allowing one trial
 * call (half-open). Prevents cascading retries from a stuck or rate-limited upstream from
 * saturating server resources — exactly the failure mode observed during the stress test where
 * repeated failing requests held the event loop and degraded auth.
 */
const CIRCUIT_FAILURE_THRESHOLD = 5
const CIRCUIT_COOLDOWN_MS = 30_000

let circuitConsecutiveFailures = 0
let circuitOpenedAt = 0

function circuitBreakerCheck(): void {
    if (circuitConsecutiveFailures < CIRCUIT_FAILURE_THRESHOLD) return
    const elapsed = Date.now() - circuitOpenedAt
    if (elapsed < CIRCUIT_COOLDOWN_MS) {
        const remaining = Math.ceil((CIRCUIT_COOLDOWN_MS - elapsed) / 1000)
        throw new Error(`OpenAI circuit breaker open — cooling down for ${remaining}s`)
    }
    // Cooldown elapsed: half-open. Allow this call as the trial; success resets, failure re-opens.
    circuitConsecutiveFailures = CIRCUIT_FAILURE_THRESHOLD - 1
}

function circuitBreakerRecordSuccess(): void {
    if (circuitConsecutiveFailures > 0) {
        circuitConsecutiveFailures = 0
    }
}

function circuitBreakerRecordFailure(): void {
    circuitConsecutiveFailures++
    if (circuitConsecutiveFailures === CIRCUIT_FAILURE_THRESHOLD) {
        circuitOpenedAt = Date.now()
        console.warn(
            `[circuit-breaker] OpenAI circuit OPENED after ${CIRCUIT_FAILURE_THRESHOLD} consecutive failures; cooling down ${CIRCUIT_COOLDOWN_MS}ms`
        )
    }
}

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
    circuitBreakerCheck()

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
        circuitBreakerRecordFailure()
        logger('Completion Error', 'error', completionError)

        if (completionError instanceof Error && /connection error/i.test(completionError.message)) {
            throw new Error('OpenAI connection error')
        }

        throw new Error('Completion Error')
    }

    circuitBreakerRecordSuccess()
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
 * Proof contract: AI conforms iff its polish payload parses, the system merges that wording with deterministic
 * mechanics built from the selected package, and the merged `structuredActivities` pass both
 * `validateActivitiesAssemblyPayload` and `validateActivitiesAgainstSkeleton` for the same `buildActivitySkeleton(input)` bundle.
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

function uniqueNonEmpty(lines: string[]): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const line of lines.map((x) => x.trim()).filter(Boolean)) {
        const key = line.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(line)
    }
    return out
}

function mergeObjective(objective: string, decisionCues: string[]): string {
    return uniqueNonEmpty([objective, decisionCues[0] ?? '']).join(' ')
}

function nonEmptyOrDefault(value: string, fallback: string): string {
    const next = value.trim()
    return next.length > 0 ? next : fallback
}

function defaultTitle(index: number): string {
    return `Activity ${index + 1}`
}

function defaultSetup(): string {
    return 'Use the listed teams, rules, scoring, and constraints for this activity.'
}

function defaultObjective(): string {
    return 'Complete the activity objective while following the listed rules and constraints.'
}

/**
 * Generic coach-facing observation cue appended to coachingFocus when the AI polish step
 * doesn't produce enough content of its own.
 *
 * Previously this function (a) joined the requiredDecisionLanguage validation tokens into a
 * single nonsense sentence ("Coach the players to choose, read, react, based on, decision,
 * adapt, option in response to the game picture.") and (b) dumped slot.requiredAffordanceMechanics[0]
 * (a verbose AI-instruction line like 'Affordance lens "X": Rules and scoring must require...')
 * directly into coachingFocus. Both produced scaffolding leakage in the coach-facing output.
 *
 * Now returns a single coach-readable observation cue. Slot parameter retained for signature
 * compatibility and possible future per-archetype defaults but is otherwise unused.
 */
function defaultCoachingFocus(_slot?: ActivitySkeletonBundle['activities'][number]): string[] {
    return [
        'Coach observation: focus on the live decisions — how players read pressure, space, and support, and how they adapt when the picture changes.',
    ]
}

function mergePolishedActivitiesWithMechanics(
    polishActivities: ActivityPolish[],
    mechanicsBundle: ActivityMechanicsBundle,
    skeletonBundle: ActivitySkeletonBundle
): Array<Omit<Activity, 'validation'>> {
    return polishActivities.map((polish, index) => {
        const mechanics = mechanicsBundle.activities[index]
        const slot = skeletonBundle.activities[index]
        // coachingFocus is coach observation cues. opponent-consequence content is intentionally
        // NOT spread here — it's already folded into scoring via buildScoringLines() and duplicating
        // it in coachingFocus produced "Opponent consequence:" / "Interaction exchange — outcomes:"
        // scaffolding lines visible to coaches.
        const coachingFocus = uniqueNonEmpty([
            ...polish.coachingFocus,
            ...defaultCoachingFocus(slot),
            ...mechanics.decisionCues,
        ])
        // mechanics.constraints is the coach-facing constraint list from buildConstraintLines()
        // (clean title + intent per selected constraint). It must match exactly when validated
        // against mechanics.constraints. Opponent-consequence content is already present in
        // coachingFocus (below) and in scoring (via buildScoringLines) — do not also append it
        // here or validateActivityMechanics will fail with constraints_mismatch.
        const constraints = uniqueNonEmpty(mechanics.constraints)
        const scoring = uniqueNonEmpty(mechanics.scoring).join('\n')

        return {
            title: nonEmptyOrDefault(polish.title, defaultTitle(index)),
            setup: nonEmptyOrDefault(polish.setup, defaultSetup()),
            teams: mechanics.teams,
            objective: mergeObjective(nonEmptyOrDefault(polish.objective, defaultObjective()), mechanics.decisionCues),
            rules: uniqueNonEmpty(mechanics.rules),
            scoring,
            constraints,
            coachingFocus,
        }
    })
}

function validateMergedActivitiesFromPolish(
    parsed: unknown,
    mechanicsBundle: ActivityMechanicsBundle,
    skeletonBundle: ActivitySkeletonBundle
): Activity[] {
    const polishActivities = validateActivityPolishPayload(parsed)
    const mergedActivities = mergePolishedActivitiesWithMechanics(polishActivities, mechanicsBundle, skeletonBundle)

    mergedActivities.forEach((activity, index) => {
        const mechanicsValidation = validateActivityMechanics({
            activity,
            mechanics: mechanicsBundle.activities[index],
        })
        if (!mechanicsValidation.valid) {
            throw new Error(
                `Activity ${index + 1} failed deterministic mechanics validation: ${mechanicsValidation.errors.join(', ')}`
            )
        }
    })

    return validateActivitiesAssemblyPayload({ activities: mergedActivities })
}

export async function assembleActivities(input: SystemAssemblyInput): Promise<AssembleActivitiesResult> {
    const assemblyDesignLock = snapshotAssemblyDesign(input)
    const activitySkeleton = buildActivitySkeleton(input)
    const activityMechanics = buildActivityMechanicsFromSkeleton(activitySkeleton)
    const polishPrompt = generateAssemblyPolishPrompt(input)
    const polishPayload = JSON.stringify(buildAssemblyPayload(input, activitySkeleton, activityMechanics))

    console.log(
        `[assembly-polish-size] promptChars=${polishPrompt.length} payloadChars=${polishPayload.length} totalChars=${polishPrompt.length + polishPayload.length}`
    )

    const initialMessages: CompletionMessage[] = [
        {
            role: 'system',
            content: polishPrompt,
        },
        {
            role: 'system',
            content: polishPayload,
        },
    ]

    const response1 = await getCompletion(initialMessages)
    const parsed1 = parseCompletionAsJSON<Record<string, unknown>>(response1)
    if (!parsed1) {
        throw new SystemPipelineError('ai-assembly', 'AI assembly returned invalid JSON.')
    }

    try {
        const structuredActivities = validateMergedActivitiesFromPolish(parsed1, activityMechanics, activitySkeleton)
        validateActivitiesAgainstSkeleton(structuredActivities, activitySkeleton)
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
            const structuredActivities = validateMergedActivitiesFromPolish(parsed2, activityMechanics, activitySkeleton)
            validateActivitiesAgainstSkeleton(structuredActivities, activitySkeleton)
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

function buildSkeletonRetryAddendum(validatorReasons: string[]): string {
    const joined = validatorReasons.join('\n')
    if (!joined.includes('missing skeleton mechanic')) {
        return ''
    }
    return '\n\nSkeleton compliance: Fix each listed Activity without changing archetype, affordance IDs, or constraint IDs. Satisfy every skeleton mechanic from payload activitySkeleton in objective, rules, scoring, constraints, and coachingFocus — not setup alone. Do not invent a different skeleton.'
}

function buildAssemblyRetryUserMessage(validatorReasons: string[]): string {
    const bullets = validatorReasons.map((r) => `- ${r}`).join('\n')
    const decisionAddendum = buildDecisionLanguageRetryAddendum(validatorReasons)
    const skeletonAddendum = buildSkeletonRetryAddendum(validatorReasons)
    return `The previous output failed validation for:
${bullets}

Regenerate the JSON polish payload.
Do not explain.
Return valid JSON only.
Preserve the selected archetype, affordance lenses, and constraints.
Do not change the system-owned rules, scoring, or constraints.

Avoid player-directed imperative obligation language.
Each activity needs explicit decision language such as choose, read, react, based on, decision, adapt, or option.

Do not echo exact prohibited phrases if avoidable.${decisionAddendum}${skeletonAddendum}`
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

function shortLine(value: string | undefined, max = 140): string | null {
    const next = String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim()
    if (!next) return null
    return next.length > max ? `${next.slice(0, max - 1).trimEnd()}…` : next
}

function takeShortLines(lines: string[], maxCount: number, maxLen = 140): string[] {
    const out: string[] = []
    const seen = new Set<string>()
    for (const line of lines) {
        const next = shortLine(line, maxLen)
        if (!next) continue
        const key = next.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(next)
        if (out.length >= maxCount) break
    }
    return out
}

function buildAssemblyPayload(
    input: SystemAssemblyInput,
    activitySkeleton: ActivitySkeletonBundle,
    activityMechanics: ActivityMechanicsBundle
) {
    const constraintTitles = [
        input.constraintPackage.foundation.constraint.title,
        input.constraintPackage.shaping.constraint.title,
        input.constraintPackage.consequence?.constraint.title,
    ]
        .filter(Boolean)
        .map((title) => String(title))

    const coachingEmphasis = shortLine(
        input.archetype.description ||
            input.constraintPackage.assemblyGuardrails.decisionProblem.summary ||
            input.constraintPackage.assemblyGuardrails.visibleCue.summary,
        180
    )

    return {
        archetypeName: input.archetype.name,
        activityBriefs: activitySkeleton.activities.map((slot, index) => {
            const mechanics = activityMechanics.activities[index]
            const objectiveHint =
                shortLine(
                    [
                        slot.requiredArchetypeMechanics[0],
                        slot.requiredAffordanceMechanics[0],
                        slot.requiredConstraintMechanics[0],
                    ]
                        .filter(Boolean)
                        .join(' '),
                    180
                ) ?? `Activity ${index + 1} should reflect ${input.archetype.name}.`

            return {
                activityIndex: slot.activityIndex,
                archetypeName: input.archetype.name,
                slotProgressionEmphasis: slot.slotProgressionEmphasis,
                objectiveHint,
                ruleSummaries: takeShortLines(mechanics.rules, 4, 120),
                constraintTitles: constraintTitles.slice(0, 2),
                decisionCues: takeShortLines(mechanics.decisionCues, 2, 120),
                coachingEmphasis: coachingEmphasis ? [coachingEmphasis] : [],
            }
        }),
    }
}

const POSSESSION_STABILITY_LENS_TITLE = 'Possession Stability Opportunity'
const SPACE_EXPLOITATION_LENS_TITLE = 'Space Exploitation Opportunity'
const SPACE_CREATION_LENS_TITLE = 'Space Creation Opportunity'
const LINE_BREAKING_LENS_TITLE = 'Line-Breaking Opportunity'

function titleForAssemblyAffordanceId(input: SystemAssemblyInput, id: string): string {
    const primaryId = registryIdString(
        (input.affordances.primary as { _id?: unknown; id?: unknown })._id ??
            (input.affordances.primary as { id?: unknown }).id
    )
    if (primaryId === id) {
        return input.affordances.primary.title
    }
    const supporting = input.affordances.supporting.find((a) =>
        registryIdString((a as { _id?: unknown; id?: unknown })._id ?? (a as { id?: unknown }).id) === id
    )
    return supporting?.title ?? id
}

function selectedAffordanceCoveragePromptSection(input: SystemAssemblyInput): string {
    const ids = getAssemblySelectedAffordanceIds(input)
    const lines: string[] = [
        'Selected affordance lens coverage (mandatory — activities 1, 2, and 3):',
        'The activity must reflect every selected affordance lens, not only the primary or most obvious one.',
        '',
        'For each selected affordance lens below, every generated activity must clearly express that affordance in at least one of: objective, rules, constraints, or coachingFocus.',
        '',
        'Selected affordances (titles in selectedAffordanceIds order):',
    ]

    let includesPossessionStability = false
    let includesSpaceExploitation = false
    let includesSpaceCreation = false
    let includesLineBreaking = false
    for (const id of ids) {
        const title = titleForAssemblyAffordanceId(input, id)
        lines.push(`- "${title}" (${id})`)
        if (title === POSSESSION_STABILITY_LENS_TITLE) includesPossessionStability = true
        if (title === SPACE_EXPLOITATION_LENS_TITLE) includesSpaceExploitation = true
        if (title === SPACE_CREATION_LENS_TITLE) includesSpaceCreation = true
        if (title === LINE_BREAKING_LENS_TITLE) includesLineBreaking = true
    }

    lines.push('')
    lines.push(
        'Each lens must read as part of the game story in those fields (not only implied by setup or teams, and not only by echoing affordancesUsed IDs).'
    )

    if (includesPossessionStability) {
        lines.push(
            '',
            `When "${POSSESSION_STABILITY_LENS_TITLE}" is selected, include unmistakable possession-stability language in objective, rules, constraints, and/or coachingFocus — for example ideas in the spirit of: secure possession, keep the ball under pressure, maintain possession, support the ball-carrier, retain possession, keep the next action live (phrase as live game problems; avoid empty labels).`
        )
    }

    if (includesSpaceExploitation) {
        lines.push(
            '',
            `When "${SPACE_EXPLOITATION_LENS_TITLE}" is selected, include unmistakable space-exploitation language in objective, rules, constraints, and/or coachingFocus — ideas in the spirit of: exploit open space, attack available space, recognize space behind or between defenders, use space before pressure recovers, take advantage of opened space (phrase as live reads and consequences; avoid empty labels).`
        )
    }

    if (includesSpaceCreation) {
        lines.push(
            '',
            `When "${SPACE_CREATION_LENS_TITLE}" is selected, include unmistakable space-creation language in objective, rules, constraints, and/or coachingFocus — ideas in the spirit of: create space, move to open passing lanes, stretch or separate defenders, open space for teammates, change the defensive picture (phrase as how the game invites displacement; avoid empty labels).`
        )
    }

    if (includesLineBreaking) {
        lines.push(
            '',
            `When "${LINE_BREAKING_LENS_TITLE}" is selected, include unmistakable line-breaking language in objective, rules, constraints, and/or coachingFocus — ideas in the spirit of: break a defensive line, play through or around pressure, penetrate into space beyond defenders, recognize when a line can be broken (phrase as penetration reads; avoid empty labels).`
        )
    }

    return lines.join('\n')
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
    const skeletonBlock = formatActivitySkeletonForPrompt(buildActivitySkeleton(input))
    const selectedAffordanceTitles = selectedAffordanceIds.map((id) => titleForAssemblyAffordanceId(input, id))
    const archetypeIdentityLock =
        input.archetype.name === 'Directional Possession Games'
            ? [
                  'Directional Possession Games:',
                  '- ball must move toward a target or direction',
                  '- players must decide to secure, progress, or switch',
              ].join('\n')
            : input.archetype.name === 'Overload Games'
              ? [
                    'Overload Games:',
                    '- teams must use numerical advantage',
                    '- decision: use overload or reset',
                ].join('\n')
              : input.archetype.name === 'Pressing & Regain Games'
                ? [
                      'Pressing & Regain Games:',
                      '- pressure + regain + immediate transition must exist',
                  ].join('\n')
                : input.archetype.name === 'End Zone Games'
                  ? [
                        'End Zone Games:',
                        '- scoring tied to reaching a zone',
                    ].join('\n')
                  : `Selected archetype "${input.archetype.name}" must stay visible in rules or scoring.`
    const affordanceRuleLockLines = [
        'For each affordance:',
        '- It must affect rules or scoring, not just coachingFocus.',
    ]
    if (selectedAffordanceTitles.includes(SPACE_EXPLOITATION_LENS_TITLE)) {
        affordanceRuleLockLines.push('- If Space Exploitation: scoring or rules must reward using open space')
    }
    if (selectedAffordanceTitles.includes(POSSESSION_STABILITY_LENS_TITLE)) {
        affordanceRuleLockLines.push(
            '- If Possession Stability: scoring or rules must require maintaining possession under pressure'
        )
    }
    const affordanceRuleLock = affordanceRuleLockLines.join('\n')

    return `You are filling a system-owned skeleton. Do not invent a different activity structure. Do not omit required mechanics. Return valid JSON only.

You assemble football activities from system inputs that have already been selected in code.

HARD COMPLETION RULES
Every activity must include:
- at least one explicit decision phrase: choose, read, react, decide, based on
- at least one scoring rule that reflects the game purpose
- rules that force player behavior, not optional actions

STRUCTURE LOCK
You are filling a system-owned structure.

Do NOT:
- invent a new game
- omit required mechanics
- replace rules with coaching suggestions

All mechanics must appear in:
objective, rules, scoring, or constraints

${skeletonBlock}

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

Your job is to write coach-facing language for three activities that implement the system-owned skeleton and payload; you do not design a new game format.

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

${selectedAffordanceCoveragePromptSection(input)}
${archetypeIdentityPromptSection(input.archetype)}
ARCHETYPE IDENTITY ENFORCEMENT
${archetypeIdentityLock}

DECISION LANGUAGE REQUIREMENT (stronger)
For each activity:
Include a clear decision moment such as:
- players must choose when to...
- players read pressure and decide whether to...
- based on defender position, players react by...

AFFORDANCE / RULE LINK
${affordanceRuleLock}

CONSTRAINT VISIBILITY
Each selected constraint must be visible in the rules or scoring.

Do not hide constraints in description text only.

FAILURE WARNING
If any selected affordance or archetype is not clearly expressed in rules or scoring, the activity will be rejected.

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

Affordance expression in structure (required for every selected affordance lens):
- Each selected affordance lens must be expressed in the GAME STRUCTURE, not only in coachingFocus.
- For each selected affordance, make it show up in at least one structural location: rules, scoring, constraints, or task conditions described in setup/objective.
- Do not rely on coachingFocus alone to carry an affordance. coachingFocus may reinforce the affordance, but it cannot be the only place it appears.
- If an affordance appears only in coachingFocus but not in rules, scoring, constraints, or task conditions, the activity will be rejected.
- Affordances must shape the environment players interact with, not just the coach language around it.

Specific affordance requirement: Space Exploitation Opportunity
- For Space Exploitation Opportunity, the rules or scoring must create situations where players must recognize and use open space to gain advantage.
- Valid structural expressions include scoring rewards for using open space, rules that create space to attack, or constraints that open or close space dynamically.
- Do not leave Space Exploitation Opportunity as a coaching reminder only; it must change the live game structure.

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

function generateAssemblyPolishPrompt(input: SystemAssemblyInput) {
    return `You are polishing a system-owned activity structure. Return valid JSON only.

The system has already selected the archetype, affordances, constraints, skeleton, and mechanics in code before AI runs.
You are NOT designing a new game.
You are polishing wording for three already-defined activities using a compact activity brief.

HARD COMPLETION RULES
- Every activity needs at least one explicit decision phrase in objective or coachingFocus: choose, read, react, decide, based on, adapt, option.
- Keep the game purpose visible in title, setup, objective, or coachingFocus.
- Use live, coach-facing language that stays aligned with the supplied system mechanics.

STRUCTURE LOCK
You are filling a system-owned structure.

Do NOT:
- invent a new game
- omit required mechanics
- change rules, scoring, constraints, teams, decision cues, or opponent consequences
- replace mechanics with coaching suggestions

The server owns the mechanics.
Your job is wording only.

Use only these payload sections as locked inputs:
- archetypeName
- activityBriefs[].activityIndex
- activityBriefs[].slotProgressionEmphasis
- activityBriefs[].objectiveHint
- activityBriefs[].ruleSummaries
- activityBriefs[].constraintTitles
- activityBriefs[].decisionCues
- activityBriefs[].coachingEmphasis

PER-SLOT SESSION PROGRESSION
- Each brief has a slotProgressionEmphasis describing this activity's role in the 3-activity session arc.
- Activity 1 must read as the establishing / entry-level version of the session goal — clearest, least loaded picture.
- Activity 2 must read as the dialed-up pressure version — same archetype, sharper shaping demand, more intense decision picture.
- Activity 3 must read as the full contested challenge — all selected affordance lenses visibly active, full constraint package at strength.
- Use slotProgressionEmphasis to differentiate the title, setup, objective, and coachingFocus across the three activities. They should read as a progression — not three near-identical activities with different titles.

SYSTEM-OWNED MECHANICS
- Treat each activity brief as a compressed description of fixed system-owned mechanics.
- Do not invent extra mechanics beyond what the brief supports.
- Do not turn the activity into a different game from the brief.

AFFORDANCE / RULE LINK
- Keep the selected affordances visible by writing objective and coachingFocus that clearly align with the fixed brief.
- If an affordance is Space Exploitation Opportunity, the wording should make clear that advantage comes from recognizing and using open space created by the fixed rules or scoring.
- If an affordance is Possession Stability Opportunity, the wording should make clear that success depends on securing or maintaining possession under pressure in the fixed rules or scoring.

ARCHETYPE IDENTITY ENFORCEMENT
- Directional Possession Games: wording should make clear the ball progresses toward a target or direction and players decide whether to secure, progress, or switch.
- Overload Games: wording should make clear the game uses numerical or positional overloads and players decide whether to use the overload or reset.
- Pressing & Regain Games: wording should make clear pressure, regain, and immediate transition are central.
- End Zone Games: wording should make clear scoring is tied to reaching or using a target zone.

CONSTRAINT VISIBILITY
- The selected constraints are already fixed in the system-owned mechanics.
- Your wording must keep those constraints legible in objective and coachingFocus.
- Do not hide the game problem in vague description text.

FAILURE WARNING
- If your wording contradicts the selected archetype, affordances, constraints, skeleton, or mechanics, the activity will be rejected.
- If decision language is missing from objective or coachingFocus, the activity will be rejected.

Output requirements:
- Return valid JSON only.
- Top-level shape exactly:
{
  "activities": [
    {
      "title": string,
      "setup": string,
      "objective": string,
      "coachingFocus": string[]
    }
  ]
}
- Produce exactly 3 activities.
- Do not add teams, rules, scoring, constraints, affordancesUsed, constraintsUsed, validation, or any other keys.
- Keep every string non-empty.
- Keep coachingFocus as an array of non-empty coach-facing observation cues.
- setup should describe space, numbers, zones, equipment, and restarts in a way that matches the fixed mechanics.
- objective should describe the decision problem players read, not a drill command.
- coachingFocus should describe what to observe, what players read, and how the fixed mechanics create trade-offs.

Avoid prohibited drill language and avoid the phrase "players must".`
}

export { testLibraryArchetypeToSystemDefinition } from '../system/activity/resolve-test-library-archetype'

