import { Request, Response, Router } from 'express'
import { Types } from 'mongoose'
import Affordance from 'src/models/affordance.model'
import Constraint from 'src/models/constraint.model'
import Session, { SessionEmphasis, SessionStatus } from 'src/models/session.model'
import { ActivityAssemblyValidationError, assembleActivities } from 'src/services/completion.service'

import Activity, { ActivityStatus } from '../models/activity.model'
import { compressActivitiesForCoach } from '../system/activity/compress-activity-output'
import { getSlotMechanicalVariations } from '../system/activity/slot-mechanics-variations'
import User from '../models/user.model'
import Logger from '../logger'
import LoggingService from '../services/logging.service'
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { generateSelection, getTestLibraryV0LoadDebug, systemAssemblyInputFromTestLibrarySelection } from '../system/test-library'
import { ENDPOINTS } from './_endpoints'
import BaseRoutes from './helper'
import { ActivityAssemblyRequest, SystemAssemblyInput, SystemPipelineError } from '../system/types'
import { validateConstraintPackage } from '../system/validate-constraint-package'
import { validateGeneratedActivities } from '../system/validate-generated-activity'

const router = Router()
const ROUTES = ENDPOINTS.app
const ACTIVITY_ASSEMBLY_TIMEOUT_MS = Number.parseInt(process.env.ACTIVITY_ASSEMBLY_TIMEOUT_MS ?? '', 10) || 90000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
        promise
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timeout))
    })
}

const REQUIRED_ACTIVITY_CREATE_FIELDS = ['session', 'title', 'constraint', 'intent'] as const

function missingActivityCreateFields(body: Record<string, unknown>): string[] {
    return REQUIRED_ACTIVITY_CREATE_FIELDS.filter((field) => {
        const value = body[field]
        return typeof value !== 'string' || value.trim().length === 0
    })
}

function validObjectIdRefs(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is string => typeof entry === 'string' && Types.ObjectId.isValid(entry))
}

function arrayOfStrings(value: unknown): string[] {
    if (!Array.isArray(value)) return []
    return value.map((entry) => String(entry ?? '').trim()).filter(Boolean)
}

function isSessionEmphasis(value: unknown): value is SessionEmphasis {
    return typeof value === 'string' && Object.values(SessionEmphasis).includes(value as SessionEmphasis)
}

router.post(ROUTES.testSelection, async (req: Request, res: Response) => {
    try {
        const { learningGoals, sport, sessionDescription, challengeLevel } = req.body as Record<string, unknown>
        Logger.info(
            `[Test Library Selection] coach input (original): ${JSON.stringify({
                learningGoals,
                sport,
                sessionDescription,
                challengeLevel,
            })}`
        )
        const goalsList = learningGoals as string[]
        const inputConstraints = deriveInputConstraints(goalsList.join(' '))
        const result = generateSelection(
            {
                learningGoals: goalsList,
                sport: typeof sport === 'string' ? sport : undefined,
                sessionDescription: typeof sessionDescription === 'string' ? sessionDescription : undefined,
                challengeLevel: typeof challengeLevel === 'string' ? challengeLevel : undefined,
            },
            inputConstraints
        )

        Logger.info(
            `[Test Library Selection] selected archetype: ${result.archetype.game_form_name} (${result.archetype.id})`
        )
        Logger.info(
            `[Test Library Selection] selected lenses: ${result.affordanceLenses.map((l) => l.title).join(' | ')}`
        )
        Logger.info(
            `[Test Library Selection] selected constraints: ${result.constraints.map((c) => c.title).join(' | ')}`
        )

        const libraryLoad = getTestLibraryV0LoadDebug()
        Logger.info(
            `[Test Library V0] total archetypes loaded: ${libraryLoad.counts.totalArchetypesLoaded} ` +
                `(runtime arrays: ${libraryLoad.runtimeArrayLengths.archetypes})`
        )
        Logger.info(
            `[Test Library V0] total affordance lenses loaded: ${libraryLoad.counts.totalAffordanceLensesLoaded} ` +
                `(runtime arrays: ${libraryLoad.runtimeArrayLengths.affordanceLenses})`
        )
        Logger.info(
            `[Test Library V0] total constraints loaded: ${libraryLoad.counts.totalConstraintsLoaded} ` +
                `(runtime arrays: ${libraryLoad.runtimeArrayLengths.constraints})`
        )
        if (libraryLoad.skippedRows.length > 0) {
            Logger.warn(`[Test Library V0] CSV conversion skipped rows: ${JSON.stringify(libraryLoad.skippedRows)}`)
        }
        if (libraryLoad.validationErrors.length > 0) {
            Logger.warn(`[Test Library V0] CSV conversion validation errors: ${JSON.stringify(libraryLoad.validationErrors)}`)
        }
        if (libraryLoad.runtimeCountsMismatch) {
            Logger.warn(
                `[Test Library V0] counts in libraryConversionReport.ts do not match runtime array lengths (regenerate CSV output).`
            )
        }

        return res.status(200).json({
            selection: {
                archetype: result.archetype,
                affordanceLenses: result.affordanceLenses,
                constraints: result.constraints,
            },
            selectionTrace: result.selectionTrace,
            libraryLoad,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        Logger.warn(`[Test Library Selection] POST /test-selection failed: ${message}`)
        return res.status(400).json({ error: message })
    }
})

router.post(`${ROUTES.generateActivities}/:id`, async (req: Request, res: Response) => {
    try {
        const { challengeLevel, duration, learningGoals } = req.body as ActivityAssemblyRequest

        if (!challengeLevel || !duration) {
            return res.status(400).json({ error: 'Challenge level and duration are required' })
        }

        if (!Array.isArray(learningGoals) || learningGoals.length === 0) {
            return res.status(400).json({ error: 'At least one learning goal is required' })
        }

        const session = await Session.findById(req.params.id)
        if (!session) {
            return res.status(404).json({ error: 'Session not found' })
        }

        const previousActivities = await Activity.find({ session: req.params.id })

        const inputConstraints = deriveInputConstraints(learningGoals.join(' '))
        if (inputConstraints.matchedSignals.length === 0) {
            return res.status(400).json({
                error:
                    'I need a soccer training goal to build an activity. Try something like: create better shots, keep possession, break lines, defend in transition, or improve first touch.',
                stage: 'input-selection',
                details: ['No supported soccer training signals were found in the learning goals.'],
            })
        }

        let selection
        try {
            Logger.info(`[Activity Generation] coach learning goals (original): ${JSON.stringify(learningGoals)}`)
            selection = generateSelection(
                {
                    learningGoals,
                    challengeLevel,
                },
                inputConstraints
            )
        } catch (selErr) {
            const message = selErr instanceof Error ? selErr.message : String(selErr)
            Logger.warn(`[Activity Generation] Test Library selection failed: ${message}`)
            return res.status(400).json({ error: message })
        }

        const assemblyInput: SystemAssemblyInput = systemAssemblyInputFromTestLibrarySelection({
            selection,
            session,
            previousActivities,
            coachInput: {
                challengeLevel,
                duration,
                learningGoals,
            },
        })

        validateConstraintPackage(assemblyInput.affordances, assemblyInput.archetype, assemblyInput.constraintPackage)

        const assembledActivities = await withTimeout(
            assembleActivities(assemblyInput),
            ACTIVITY_ASSEMBLY_TIMEOUT_MS,
            'Activity generation timed out. Please try again with a more specific soccer training goal.'
        )
        let validatedActivities

        try {
            validatedActivities = validateGeneratedActivities(assembledActivities, assemblyInput)
        } catch (error) {
            if (error instanceof SystemPipelineError && error.stage === 'output-validation') {
                await LoggingService.log(
                    {
                        level: 'warn',
                        service: 'Activity Generation',
                        message: 'Generated activities failed output validation.',
                        data: {
                            sessionId: req.params.id,
                            coachInput: assemblyInput.coachInput,
                            archetype: {
                                id: assemblyInput.archetype.id,
                                name: assemblyInput.archetype.name,
                                consequenceCues: assemblyInput.archetype.consequenceCues,
                            },
                            archetypeSelection: {
                                selectionKey: assemblyInput.archetypeSelection.selectionKey,
                                selectedReason: assemblyInput.archetypeSelection.selectedReason,
                                candidates: assemblyInput.archetypeSelection.candidates.map((candidate) => ({
                                    id: candidate.archetype.id,
                                    name: candidate.archetype.name,
                                    score: candidate.score,
                                    band: candidate.band,
                                    reasons: candidate.reasons,
                                })),
                            },
                            selectedConstraints: {
                                foundation: {
                                    id: assemblyInput.constraintPackage.foundation.constraint._id,
                                    title: assemblyInput.constraintPackage.foundation.constraint.title,
                                },
                                shaping: {
                                    id: assemblyInput.constraintPackage.shaping.constraint._id,
                                    title: assemblyInput.constraintPackage.shaping.constraint.title,
                                },
                                consequence: assemblyInput.constraintPackage.consequence
                                    ? {
                                          id: assemblyInput.constraintPackage.consequence.constraint._id,
                                          title: assemblyInput.constraintPackage.consequence.constraint.title,
                                          description: assemblyInput.constraintPackage.consequence.constraint.description,
                                          designIntent: assemblyInput.constraintPackage.consequence.constraint.designIntent,
                                          notes: assemblyInput.constraintPackage.consequence.constraint.notes,
                                          suggestedConstraintPrompt:
                                              assemblyInput.constraintPackage.consequence.constraint.suggestedConstraintPrompt,
                                          gameTemplateAnchor: assemblyInput.constraintPackage.consequence.constraint.gameTemplateAnchor,
                                      }
                                    : null,
                            },
                            assemblyGuardrails: assemblyInput.constraintPackage.assemblyGuardrails,
                            assembledActivities,
                            error: {
                                stage: error.stage,
                                message: error.message,
                                details: error.details,
                            },
                        },
                    },
                    {
                        writeLogFile: true,
                    }
                )
            }

            throw error
        }

        if (
            assembledActivities?.generatedActivities &&
            Array.isArray(assembledActivities.generatedActivities) &&
            validatedActivities.length < assembledActivities.generatedActivities.length
        ) {
            await LoggingService.log(
                {
                    level: 'warn',
                    service: 'Activity Generation',
                    message: 'Filtered invalid generated activities after output validation.',
                    data: {
                        sessionId: req.params.id,
                        totalGeneratedActivities: assembledActivities.generatedActivities.length,
                        returnedActivities: validatedActivities.length,
                        droppedActivities: assembledActivities.generatedActivities.length - validatedActivities.length,
                        coachInput: assemblyInput.coachInput,
                        archetype: {
                            id: assemblyInput.archetype.id,
                            name: assemblyInput.archetype.name,
                        },
                        archetypeSelection: {
                            selectionKey: assemblyInput.archetypeSelection.selectionKey,
                            selectedReason: assemblyInput.archetypeSelection.selectedReason,
                            candidates: assemblyInput.archetypeSelection.candidates.map((candidate) => ({
                                id: candidate.archetype.id,
                                name: candidate.archetype.name,
                                score: candidate.score,
                                band: candidate.band,
                            })),
                        },
                        selectedConstraints: {
                            foundation: {
                                id: assemblyInput.constraintPackage.foundation.constraint._id,
                                title: assemblyInput.constraintPackage.foundation.constraint.title,
                            },
                            shaping: {
                                id: assemblyInput.constraintPackage.shaping.constraint._id,
                                title: assemblyInput.constraintPackage.shaping.constraint.title,
                            },
                            consequence: assemblyInput.constraintPackage.consequence
                                ? {
                                      id: assemblyInput.constraintPackage.consequence.constraint._id,
                                      title: assemblyInput.constraintPackage.consequence.constraint.title,
                                      description: assemblyInput.constraintPackage.consequence.constraint.description,
                                      designIntent: assemblyInput.constraintPackage.consequence.constraint.designIntent,
                                      notes: assemblyInput.constraintPackage.consequence.constraint.notes,
                                      suggestedConstraintPrompt:
                                          assemblyInput.constraintPackage.consequence.constraint.suggestedConstraintPrompt,
                                      gameTemplateAnchor: assemblyInput.constraintPackage.consequence.constraint.gameTemplateAnchor,
                                  }
                                : null,
                        },
                        assemblyGuardrails: assemblyInput.constraintPackage.assemblyGuardrails,
                        assembledActivities,
                    },
                },
                {
                    writeLogFile: true,
                }
            )
        }

        // Phase 4A: compress coach-facing output. The skeleton mechanics have already been
        // validated; this pass deduplicates across fields, strips Players-read narration
        // from scoring and rules (kept implicit there, surfaced once in coachingFocus),
        // removes the guardrail closing line where it would otherwise echo winCondition,
        // and caps section lengths. Phase 3.5 slot-modifier text is must-keep through the
        // cap so the per-slot environmental differentiation survives compression.
        const perSlotModifierLines = ([1, 2, 3] as const).map((idx) =>
            getSlotMechanicalVariations(assemblyInput.session.sessionEmphasis, idx).map((m) => m.mechanicLine)
        )
        const compressedActivities = compressActivitiesForCoach(validatedActivities, perSlotModifierLines)

        return res.status(200).json(compressedActivities)
    } catch (error) {
        console.error('=== CREATE ACTIVITY ERROR ===')
        console.error(error)

        if (error instanceof Error) {
            console.error('MESSAGE:', error.message)
            console.error('STACK:', error.stack)
        }

        if (error instanceof ActivityAssemblyValidationError) {
            return res.status(422).json({
                success: false,
                error: 'Activity could not be generated cleanly. Please try again.',
                details: error.validationFailureReasons ?? [error.message],
                assemblyAttempts: error.assemblyAttempts,
                retriedAfterValidationFailure: error.retriedAfterValidationFailure,
            })
        }

        if (error instanceof SystemPipelineError) {
            return res.status(422).json({
                error: `${error.stage}: ${error.message}`,
                stage: error.stage,
                details: error.details,
            })
        }

        if (error instanceof Error && error.message.includes('timed out')) {
            return res.status(504).json({
                error: error.message,
                stage: 'ai-assembly',
                details: ['The activity generation request took too long to complete.'],
            })
        }

        return res.status(500).json({
            error: 'Activity generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        })
    }
})
router.get(`${ROUTES.activity}/my-activities`, async (req: Request, res: Response) => {
    try {
        const userSessions = await Session.find({ createdBy: res.locals.sessionUser })

        const activities = await Activity.find({
            session: { $in: userSessions.map((session) => session._id) },
        }).populate('session')

        return res.status(200).send(activities)
    } catch (error) {
        return res.status(500).send({ error })
    }
})

router.get(`${ROUTES.activity}/session/:id`, async (req: Request, res: Response) => {
    try {
        const activities = await Activity.find({ session: req.params.id })

        return res.status(200).send(activities)
    } catch (error) {
        return res.status(500).send({ error })
    }
})

// User routes
BaseRoutes(router, {
    model: User,
    route: ROUTES.user,
    excludedRoutes: ['delete'],
    userSpecific: true,
    ownerField: '_id',
})

router.get(`${ROUTES.session}/my-sessions`, async (req: Request, res: Response) => {
    try {
        const sessions = await Session.find({ createdBy: res.locals.sessionUser })
        return res.status(200).send(sessions)
    } catch (error) {
        return res.status(500).send({ error })
    }
})
// Session routes
router.get(`${ROUTES.session}/:id/duplicate`, async (req: Request, res: Response) => {
    try {
        const session = await Session.findById(req.params.id).lean();
        
        if (!session) {
            return res.status(404).send({ error: "Session not found" });
        }
        
        const sessionData = { ...session };
        delete sessionData._id;        
        delete sessionData.createdAt;  
        delete sessionData.updatedAt;
        
        // Create new session with current timestamps
        const newSession = await new Session({
            ...sessionData, 
            sessionStatus: SessionStatus['In Progress']
        }).save();
        
        // Find all activities for the original session
        const activities = await Activity.find({ session: req.params.id }).lean();
        
        // Create new activities with current timestamps
        await Promise.all(
            activities.map(activity => {
                const activityData = { ...activity };
                delete activityData._id;
                delete activityData.createdAt;
                delete activityData.updatedAt;
                
                return new Activity({
                    ...activityData, 
                    session: newSession._id, 
                    activityStatus: ActivityStatus['Ready to Start']
                }).save();
            })
        );

        return res.status(200).send(newSession);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

router.post(ROUTES.session, (req: Request, res: Response, next) => {
    const sessionEmphasis = req.body?.sessionEmphasis
    if (sessionEmphasis !== undefined && !isSessionEmphasis(sessionEmphasis)) {
        return res.status(400).json({
            error: 'Invalid sessionEmphasis',
            validValues: Object.values(SessionEmphasis),
        })
    }

    return next()
})

BaseRoutes(router, {
    model: Session,
    route: ROUTES.session,
    excludedRoutes: ['delete'],
})

// Activity routes
router.post(ROUTES.activity, async (req: Request, res: Response) => {
    try {
        const body = req.body as Record<string, unknown>

        if (!body._id || body._id === 'new') {
            const missing = missingActivityCreateFields(body)
            if (missing.length > 0) {
                return res.status(400).json({
                    error: 'Missing required activity fields',
                    missing,
                })
            }

            if (!Types.ObjectId.isValid(String(body.session))) {
                return res.status(400).json({
                    error: 'Missing required activity fields',
                    missing: ['session'],
                })
            }

            const created = await new Activity({
                activityStatus: body.activityStatus,
                session: body.session,
                title: body.title,
                constraint: body.constraint,
                intent: body.intent,
                setup: typeof body.setup === 'string' ? body.setup : undefined,
                extensions: arrayOfStrings(body.extensions),
                scaffolding: arrayOfStrings(body.scaffolding),
                playerGroupSizes: Number(body.playerGroupSizes) || undefined,
                equipmentNeeded: arrayOfStrings(body.equipmentNeeded),
                affordancesUsed: validObjectIdRefs(body.affordancesUsed),
                constraintsUsed: validObjectIdRefs(body.constraintsUsed),
                challengeLevel: body.challengeLevel,
                duration: Number(body.duration) || undefined,
                learningPriorities: Array.isArray(body.learningPriorities) ? body.learningPriorities : [],
                difficultyLevel: body.difficultyLevel,
                engagementLevel: body.engagementLevel,
                breakthroughMoments: body.breakthroughMoments,
                coachComments: body.coachComments,
                rules: arrayOfStrings(body.rules),
                scoringSystem: body.scoringSystem,
                winCondition: body.winCondition,
                pointsTracking: Array.isArray(body.pointsTracking) ? body.pointsTracking : [],
                systemTrace: body.systemTrace,
            }).save()

            return res.status(201).json({ message: 'successfully created', data: created })
        }

        await Activity.findByIdAndUpdate(body._id, body)
        return res.status(200).json({ message: 'successfully updated' })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return res.status(500).json({ error: message })
    }
})

BaseRoutes(router, {
    model: Activity,
    route: ROUTES.activity,
    excludedRoutes: ['delete', 'post'],
    populate: ['session'],
})

// AffordanceConstraint routes
BaseRoutes(router, {
    model: Affordance,
    route: ROUTES.affordance,
    excludedRoutes: ['get-one'],
})

BaseRoutes(router, {
    model: Constraint,
    route: ROUTES.constraint,
    excludedRoutes: ['get-one'],
})

export default router
