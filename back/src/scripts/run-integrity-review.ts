import '../loadEnv'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import mongoose from 'mongoose'

import Activity, { type IActivity } from '../models/activity.model'
import Session from '../models/session.model'
import { reviewActivity, type ReviewContext, type ReviewableActivity } from '../system/ecological-integrity-review'
import { renderReportAsMarkdown } from '../system/ecological-integrity-review/render-markdown'

interface CliOptions {
    activityId?: string
    activityFile?: string
    outputDir: string
    noFiles: boolean
}

interface ActivityFilePayload {
    activity?: ReviewableActivity
    context?: ReviewContext
}

type LegacyActivity = Partial<IActivity> & {
    constraints?: string[]
}

function parseArgs(argv: string[]): CliOptions {
    const options: CliOptions = {
        outputDir: './reports',
        noFiles: false,
    }

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i]

        if (arg === '--activity-id') {
            options.activityId = readOptionValue(argv, i, arg)
            i += 1
        } else if (arg === '--activity-file') {
            options.activityFile = readOptionValue(argv, i, arg)
            i += 1
        } else if (arg === '--output-dir') {
            options.outputDir = readOptionValue(argv, i, arg)
            i += 1
        } else if (arg === '--no-files') {
            options.noFiles = true
        } else {
            throw new Error(`Unknown option: ${arg}`)
        }
    }

    if (Boolean(options.activityId) === Boolean(options.activityFile)) {
        throw new Error('Provide exactly one of --activity-id or --activity-file.')
    }

    return options
}

function readOptionValue(argv: string[], index: number, optionName: string): string {
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${optionName}.`)
    }
    return value
}

function slugify(value: string): string {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    return slug || 'activity'
}

function filenamePart(value: string | undefined): string {
    return slugify(value ?? 'none')
}

function parseDimension(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

function mapLegacyActivity(activity: LegacyActivity): ReviewableActivity {
    const constraints = Array.isArray(activity.constraints)
        ? activity.constraints
        : activity.constraint
          ? [activity.constraint]
          : undefined

    return {
        title: activity.title ?? 'Untitled activity',
        setup: activity.setup,
        teams: activity.extensions?.[0],
        objective: activity.intent ?? '',
        rules: activity.rules ?? [],
        scoring: activity.scoringSystem ?? '',
        constraints,
        coachingFocus: activity.scaffolding,
        winCondition: activity.winCondition,
    }
}

function contextFromMongoActivity(activity: LegacyActivity, session: unknown): ReviewContext {
    const sessionRecord = session as {
        fieldLength?: unknown
        fieldWidth?: unknown
        fieldType?: string
        playerCount?: unknown
    } | null

    const length = parseDimension(sessionRecord?.fieldLength)
    const width = parseDimension(sessionRecord?.fieldWidth)
    const type = sessionRecord?.fieldType
    const fieldDimensions =
        length !== undefined || width !== undefined || type !== undefined
            ? {
                  length,
                  width,
                  type,
              }
            : undefined

    return {
        archetypeName: activity.systemTrace?.archetypeName,
        fieldDimensions,
        playerCount: typeof sessionRecord?.playerCount === 'number' ? sessionRecord.playerCount : undefined,
    }
}

async function loadFromMongo(activityId: string): Promise<{ activity: ReviewableActivity; context: ReviewContext }> {
    const uri = process.env.DB_CONNECTION_STRING?.trim()
    if (!uri) {
        throw new Error('DB_CONNECTION_STRING is missing.')
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
    })

    try {
        const legacyActivity = await Activity.findById(activityId).lean()
        if (!legacyActivity) {
            throw new Error(`Activity not found: ${activityId}`)
        }

        const sessionId = legacyActivity.session ? String(legacyActivity.session) : undefined
        const session = sessionId ? await Session.findById(sessionId).lean() : null

        return {
            activity: mapLegacyActivity(legacyActivity),
            context: contextFromMongoActivity(legacyActivity, session),
        }
    } finally {
        await mongoose.disconnect()
    }
}

async function loadFromFile(activityFile: string): Promise<{ activity: ReviewableActivity; context?: ReviewContext }> {
    const filePath = path.resolve(activityFile)
    const payload = JSON.parse(await readFile(filePath, 'utf8')) as ActivityFilePayload

    if (!payload.activity) {
        throw new Error(`Activity file must contain an "activity" object: ${filePath}`)
    }

    return {
        activity: payload.activity,
        context: payload.context,
    }
}

async function writeReportFiles(
    outputDir: string,
    activity: ReviewableActivity,
    archetypeName: string | undefined,
    markdown: string,
    reportJson: string
): Promise<{ markdownPath: string; jsonPath: string }> {
    const resolvedOutputDir = path.resolve(outputDir)
    await mkdir(resolvedOutputDir, { recursive: true })

    const isoDate = new Date().toISOString().replace(/[:.]/g, '-')
    const baseName = `${slugify(activity.title)}-${isoDate}-${filenamePart(archetypeName)}`
    const markdownPath = path.join(resolvedOutputDir, `${baseName}.md`)
    const jsonPath = path.join(resolvedOutputDir, `${baseName}.json`)

    await writeFile(markdownPath, markdown, 'utf8')
    await writeFile(jsonPath, reportJson, 'utf8')

    return { markdownPath, jsonPath }
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2))
    const loaded = options.activityId ? await loadFromMongo(options.activityId) : await loadFromFile(options.activityFile!)
    const report = reviewActivity(loaded.activity, loaded.context)
    const markdown = renderReportAsMarkdown(report)

    if (options.noFiles) {
        process.stdout.write(`${markdown}\n`)
        return
    }

    const reportJson = JSON.stringify(report, null, 2)
    const paths = await writeReportFiles(
        options.outputDir,
        loaded.activity,
        report.activityRef.archetypeName,
        markdown,
        reportJson
    )

    process.stdout.write(`${paths.markdownPath}\n${paths.jsonPath}\n`)
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exit(1)
})
