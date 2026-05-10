/**
 * Local production-flow create-activity runner.
 *
 * Mirrors the `/api/app/generate-activities/:id` backend path without Express:
 * Input Constraint Layer -> Compatibility-Aware Selection -> Package Validation ->
 * AI Assembly -> Output Validation
 *
 * Set-Location c:\challenge-point\back
 * npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-local-create-activity-test.ts
 */
import 'dotenv/config'
import '../loadEnv'

import fs from 'fs'
import { Types } from 'mongoose'
import type { IActivity } from '../models/activity.model'
import type { ISession } from '../models/session.model'
import { SessionStatus } from '../models/session.model'
import { ActivityAssemblyValidationError, assembleActivities } from '../services/completion.service'
import type { Activity } from '../system/activity/activity-schema'
import { getAssemblySelectedAffordanceIds, getAssemblySelectedConstraintIds } from '../system/activity/assembly-package-ids'
import { buildActivityMechanicsFromSkeleton } from '../system/activity/build-activity-mechanics'
import { buildActivitySkeleton, type ActivitySkeletonBundle } from '../system/activity/build-activity-skeleton'
import { mapActivityToCoachView, type CoachActivityView } from '../system/activity/map-activity-to-coach-view'
import { validateActivityMechanics } from '../system/activity/validate-activity-mechanics'
import { validateActivitiesAgainstSkeleton } from '../system/activity/validate-activity-skeleton'
import { validateActivitiesAssemblyPayload } from '../system/activity/validate-activity-structure'
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { generateSelection, systemAssemblyInputFromTestLibrarySelection } from '../system/test-library'
import { validateConstraintPackage } from '../system/validate-constraint-package'
import { validateGeneratedActivities } from '../system/validate-generated-activity'
import { SystemAssemblyInput, SystemPipelineError } from '../system/types'

const LOCAL_CREATE_ACTIVITY_INPUTS = [
    'work on touches with pressure and spacing',
    'improve first touch under pressure',
    'help players keep possession under pressure',
    'help players create better support angles',
    'help players break defensive lines',
] as const

function resolvedTestInputs(): readonly string[] {
    const total = LOCAL_CREATE_ACTIVITY_INPUTS.length
    const raw = String(process.env.TEST_LIMIT ?? '').trim()
    const parsed = Number.parseInt(raw, 10)

    if (!raw || !Number.isFinite(parsed) || parsed < 1) {
        console.log(`Running ${total} of ${total} local create-activity test cases`)
        return LOCAL_CREATE_ACTIVITY_INPUTS
    }

    const count = Math.min(parsed, total)
    console.log(`Running ${count} of ${total} local create-activity test cases`)
    return LOCAL_CREATE_ACTIVITY_INPUTS.slice(0, count)
}

type LocalCreateActivityRow = {
    input: string
    inputConstraints: ReturnType<typeof deriveInputConstraints>
    selectedArchetype: string
    selectedAffordanceLenses: string[]
    selectedConstraints: string[]
    packageValidationStatus: 'PASS' | 'FAIL' | 'NOT_RUN'
    aiCalled: boolean
    assemblyAttempts: number
    retriedAfterValidationFailure: boolean
    outputValidationStatus: 'PASS' | 'FAIL' | 'NOT_RUN'
    generatedActivitiesCount: number
    error: string | null
    reviewGeneratedActivities?: Array<{
        title: string
        constraint: string
        intent: string
        rules: string[]
        scoringSystem: string
        winCondition: string
        scaffolding: string[]
        extensions: string[]
        equipmentNeeded: string[]
        systemTrace?: unknown
    }>
    coachViewActivities?: CoachActivityView[]
}

type EmptyPolishActivity = {
    title: string
    setup: string
    objective: string
    coachingFocus: string | string[]
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

function defaultCoachingFocus(slot?: ActivitySkeletonBundle['activities'][number]): string[] {
    const fromSkeleton = uniqueNonEmpty([
        slot?.requiredDecisionLanguage?.length
            ? `Coach the players to ${slot.requiredDecisionLanguage.join(', ')} in response to the game picture.`
            : '',
        slot?.requiredAffordanceMechanics?.[0] ?? '',
    ])
    if (fromSkeleton.length > 0) {
        return fromSkeleton
    }
    return ['Coach the players to read the situation, make decisions, and adapt to the constraints.']
}

function normalizeCoachingFocus(value: string | string[]): string[] {
    if (Array.isArray(value)) {
        return value.map((entry) => String(entry).trim()).filter(Boolean)
    }
    const next = String(value ?? '').trim()
    return next ? [next] : []
}

function buildEmptyPolishPayload(): EmptyPolishActivity[] {
    return [1, 2, 3].map(() => ({
        title: '',
        setup: '',
        objective: '',
        coachingFocus: '',
    }))
}

function mergeEmptyPolishWithMechanics(
    polishActivities: EmptyPolishActivity[],
    mechanicsBundle: ReturnType<typeof buildActivityMechanicsFromSkeleton>,
    skeletonBundle: ActivitySkeletonBundle
): Array<Omit<Activity, 'validation'>> {
    return polishActivities.map((polish, index) => {
        const mechanics = mechanicsBundle.activities[index]
        const slot = skeletonBundle.activities[index]
        const coachingFocus = uniqueNonEmpty([
            ...normalizeCoachingFocus(polish.coachingFocus),
            ...defaultCoachingFocus(slot),
            ...mechanics.decisionCues,
            ...mechanics.opponentConsequences,
        ])
        const constraints = uniqueNonEmpty([...mechanics.constraints, ...mechanics.opponentConsequences])
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

function mapStructuredActivityToLegacyLocal(activity: Activity, input: SystemAssemblyInput): IActivity {
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

    return {
        _id: new Types.ObjectId().toString(),
        session: new Types.ObjectId() as unknown as ISession,
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
    } as unknown as IActivity
}

function buildLocalSession(): ISession {
    const d = new Date()
    return {
        _id: 'local-create-activity-test-session',
        createdBy: 'local-create-activity-test-user' as unknown as ISession['createdBy'],
        name: 'Local Create Activity Test Session',
        sessionStatus: SessionStatus['In Progress'],
        playerCount: 12,
        fieldLength: '40',
        fieldWidth: '30',
        fieldType: 'grass',
        createdAt: d,
        updatedAt: d,
    }
}

function shouldSaveFullOutput(): boolean {
    return String(process.env.SAVE_FULL_OUTPUT ?? '').toLowerCase() === 'true'
}

function reviewActivitiesForOutput(activities: IActivity[]) {
    return activities.map((activity) => ({
        title: activity.title,
        constraint: activity.constraint,
        intent: activity.intent,
        rules: activity.rules,
        scoringSystem: activity.scoringSystem,
        winCondition: activity.winCondition,
        scaffolding: activity.scaffolding,
        extensions: activity.extensions,
        equipmentNeeded: activity.equipmentNeeded,
        systemTrace: (activity as IActivity & { systemTrace?: unknown }).systemTrace,
    }))
}

function writeFullReviewOutput(results: LocalCreateActivityRow[]): void {
    if (!shouldSaveFullOutput()) {
        return
    }

    const lines: string[] = []
    lines.push('Local Create Activity Full Review')
    lines.push('')

    for (const [index, row] of results.entries()) {
        lines.push(`Case ${index + 1}`)
        lines.push(`Input: ${row.input}`)
        lines.push(`packageValidationStatus: ${row.packageValidationStatus}`)
        lines.push(`aiCalled: ${row.aiCalled}`)
        lines.push(`outputValidationStatus: ${row.outputValidationStatus}`)
        lines.push(`generatedActivitiesCount: ${row.generatedActivitiesCount}`)
        if (row.error) {
            lines.push(`error: ${row.error}`)
        }
        lines.push('')

        if (row.reviewGeneratedActivities?.length) {
            row.reviewGeneratedActivities.forEach((activity, activityIndex) => {
                lines.push(`Activity ${activityIndex + 1}`)
                lines.push(`title: ${activity.title}`)
                lines.push(`constraint: ${activity.constraint}`)
                lines.push(`intent: ${activity.intent}`)
                lines.push('rules:')
                for (const rule of activity.rules) lines.push(`- ${rule}`)
                lines.push(`scoringSystem: ${activity.scoringSystem}`)
                lines.push(`winCondition: ${activity.winCondition}`)
                lines.push('scaffolding:')
                for (const item of activity.scaffolding) lines.push(`- ${item}`)
                lines.push('extensions:')
                for (const item of activity.extensions) lines.push(`- ${item}`)
                lines.push('equipmentNeeded:')
                for (const item of activity.equipmentNeeded) lines.push(`- ${item}`)
                if (activity.systemTrace) {
                    lines.push('systemTrace:')
                    lines.push(JSON.stringify(activity.systemTrace, null, 2))
                }
                lines.push('')
            })
        } else {
            lines.push('No generated activities saved for review.')
            lines.push('')
        }

        lines.push('---')
        lines.push('')
    }

    fs.writeFileSync('./_activity-quality-review-full.txt', lines.join('\n'), 'utf8')
}

function writeCoachViewOutput(results: LocalCreateActivityRow[]): void {
    const lines: string[] = []
    lines.push('Local Create Activity Coach View')
    lines.push('')

    for (const [index, row] of results.entries()) {
        lines.push(`Case ${index + 1}`)
        lines.push(`Input: ${row.input}`)
        lines.push(`packageValidationStatus: ${row.packageValidationStatus}`)
        lines.push(`aiCalled: ${row.aiCalled}`)
        lines.push(`outputValidationStatus: ${row.outputValidationStatus}`)
        lines.push(`generatedActivitiesCount: ${row.generatedActivitiesCount}`)
        if (row.error) {
            lines.push(`error: ${row.error}`)
        }
        lines.push('')

        if (row.coachViewActivities?.length) {
            row.coachViewActivities.forEach((activity, activityIndex) => {
                lines.push(`Activity ${activityIndex + 1}`)
                lines.push('--------------------------------')
                lines.push('Title:')
                lines.push(activity.title)
                lines.push('')
                lines.push('Setup:')
                for (const item of activity.setup) lines.push(`- ${item}`)
                lines.push('')
                lines.push('Objective:')
                lines.push(activity.objective)
                lines.push('')
                lines.push('Rules:')
                activity.rules.forEach((rule, ruleIndex) => lines.push(`${ruleIndex + 1}. ${rule}`))
                lines.push('')
                lines.push('Scoring:')
                for (const item of activity.scoring) lines.push(`- ${item}`)
                lines.push('')
                lines.push('Constraints:')
                lines.push(`- ${activity.constraints}`)
                lines.push('')
                lines.push('Coaching Points:')
                for (const point of activity.coachingPoints) lines.push(`- ${point}`)
                lines.push('')
                lines.push('Teams:')
                lines.push(activity.teams)
                lines.push('')
            })
        } else {
            lines.push('No coach-facing activities available.')
            lines.push('')
        }

        lines.push('---')
        lines.push('')
    }

    fs.writeFileSync('./_activity-coach-view.txt', lines.join('\n'), 'utf8')
}

function toErrorMessage(err: unknown): string {
    if (err instanceof ActivityAssemblyValidationError) {
        return err.validationFailureReasons?.join(' | ') || err.message
    }
    if (err instanceof SystemPipelineError) {
        return `${err.stage}: ${err.message}`
    }
    if (err instanceof Error) {
        return err.message
    }
    return String(err)
}

async function runCase(input: string): Promise<LocalCreateActivityRow> {
    const inputConstraints = deriveInputConstraints(input)
    const skipAi = String(process.env.SKIP_AI ?? '').toLowerCase() === 'true'

    let selectedArchetype = ''
    let selectedAffordanceLenses: string[] = []
    let selectedConstraints: string[] = []
    let packageValidationStatus: LocalCreateActivityRow['packageValidationStatus'] = 'NOT_RUN'
    let aiCalled = false
    let assemblyAttempts = 0
    let retriedAfterValidationFailure = false
    let outputValidationStatus: LocalCreateActivityRow['outputValidationStatus'] = 'NOT_RUN'
    let generatedActivitiesCount = 0

    try {
        const selection = generateSelection({ learningGoals: [input], challengeLevel: 'intermediate' }, inputConstraints)
        selectedArchetype = selection.archetype.game_form_name
        selectedAffordanceLenses = selection.affordanceLenses.map((lens) => lens.title)
        selectedConstraints = selection.constraints.map((constraint) => constraint.title)

        const assemblyInput = systemAssemblyInputFromTestLibrarySelection({
            selection,
            session: buildLocalSession(),
            previousActivities: [] as IActivity[],
            coachInput: {
                challengeLevel: 'intermediate',
                duration: 20,
                learningGoals: [input],
            },
        })

        validateConstraintPackage(assemblyInput.affordances, assemblyInput.archetype, assemblyInput.constraintPackage)
        packageValidationStatus = 'PASS'

        if (skipAi) {
            const activitySkeleton = buildActivitySkeleton(assemblyInput)
            const activityMechanics = buildActivityMechanicsFromSkeleton(activitySkeleton)
            const mergedActivities = mergeEmptyPolishWithMechanics(
                buildEmptyPolishPayload(),
                activityMechanics,
                activitySkeleton
            )

            mergedActivities.forEach((activity, index) => {
                const mechanicsValidation = validateActivityMechanics({
                    activity,
                    mechanics: activityMechanics.activities[index],
                })
                if (!mechanicsValidation.valid) {
                    throw new Error(
                        `Activity ${index + 1} failed deterministic mechanics validation: ${mechanicsValidation.errors.join(', ')}`
                    )
                }
            })

            const structuredActivities = validateActivitiesAssemblyPayload({ activities: mergedActivities })
            validateActivitiesAgainstSkeleton(structuredActivities, activitySkeleton)
            const generatedActivities = structuredActivities.map((activity) =>
                mapStructuredActivityToLegacyLocal(activity, assemblyInput)
            )
            const validatedActivities = validateGeneratedActivities({ generatedActivities }, assemblyInput)

            outputValidationStatus = 'PASS'
            generatedActivitiesCount = validatedActivities.length

            return {
                input,
                inputConstraints,
                selectedArchetype,
                selectedAffordanceLenses,
                selectedConstraints,
                packageValidationStatus,
                aiCalled: false,
                assemblyAttempts: 0,
                retriedAfterValidationFailure: false,
                outputValidationStatus,
                generatedActivitiesCount,
                error: null,
                reviewGeneratedActivities: reviewActivitiesForOutput(validatedActivities),
                coachViewActivities: structuredActivities.map(mapActivityToCoachView),
            }
        }

        if (!process.env.OPENAI_API_KEY?.trim()) {
            return {
                input,
                inputConstraints,
                selectedArchetype,
                selectedAffordanceLenses,
                selectedConstraints,
                packageValidationStatus,
                aiCalled: false,
                assemblyAttempts,
                retriedAfterValidationFailure,
                outputValidationStatus,
                generatedActivitiesCount,
                error: 'OPENAI_API_KEY is not set; cannot invoke assembleActivities locally.',
            }
        }

        aiCalled = true
        const assembled = await assembleActivities(assemblyInput)
        assemblyAttempts = assembled.assemblyAttempts
        retriedAfterValidationFailure = assembled.retriedAfterValidationFailure

        const validatedActivities = validateGeneratedActivities(assembled, assemblyInput)
        outputValidationStatus = 'PASS'
        generatedActivitiesCount = validatedActivities.length

        return {
            input,
            inputConstraints,
            selectedArchetype,
            selectedAffordanceLenses,
            selectedConstraints,
            packageValidationStatus,
            aiCalled,
            assemblyAttempts,
            retriedAfterValidationFailure,
            outputValidationStatus,
            generatedActivitiesCount,
            error: null,
            reviewGeneratedActivities: reviewActivitiesForOutput(validatedActivities),
            coachViewActivities: assembled.structuredActivities.map(mapActivityToCoachView),
        }
    } catch (err) {
        const message = toErrorMessage(err)

        if (packageValidationStatus === 'NOT_RUN') {
            packageValidationStatus = 'FAIL'
        } else if (aiCalled) {
            outputValidationStatus = 'FAIL'
        }

        if (err instanceof ActivityAssemblyValidationError) {
            aiCalled = true
            assemblyAttempts = err.assemblyAttempts
            retriedAfterValidationFailure = err.retriedAfterValidationFailure
        }

        if (err instanceof SystemPipelineError && err.stage === 'output-validation') {
            outputValidationStatus = 'FAIL'
        }

        return {
            input,
            inputConstraints,
            selectedArchetype,
            selectedAffordanceLenses,
            selectedConstraints,
            packageValidationStatus,
            aiCalled,
            assemblyAttempts,
            retriedAfterValidationFailure,
            outputValidationStatus,
            generatedActivitiesCount,
            error: message,
        }
    }
}

async function main() {
    const inputs = resolvedTestInputs()
    const results: LocalCreateActivityRow[] = []
    for (const input of inputs) {
        results.push(await runCase(input))
    }

    writeFullReviewOutput(results)
    writeCoachViewOutput(results)
    console.log(JSON.stringify({ results }, null, 2))
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
