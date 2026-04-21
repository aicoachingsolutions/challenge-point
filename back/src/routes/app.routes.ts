import { Request, Response, Router } from 'express'
import Affordance from 'src/models/affordance.model'
import Constraint from 'src/models/constraint.model'
import Session, { SessionStatus } from 'src/models/session.model'
import { assembleActivities } from 'src/services/completion.service'

import Activity, { ActivityStatus } from '../models/activity.model'
import User from '../models/user.model'
import LoggingService from '../services/logging.service'
import { ENDPOINTS } from './_endpoints'
import BaseRoutes from './helper'
import { buildConstraintPackage } from '../system/build-constraint-package'
import { getAffordanceRegistryObjectIds } from '../system/affordances'
import { getConstraintRegistryObjectIds } from '../system/constraints'
import { selectAffordances } from '../system/select-affordance'
import { selectArchetype } from '../system/select-archetype'
import { ActivityAssemblyRequest, SystemPipelineError } from '../system/types'
import { validateConstraintPackage } from '../system/validate-constraint-package'
import { validateGeneratedActivities } from '../system/validate-generated-activity'

const router = Router()
const ROUTES = ENDPOINTS.app

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

        const affordances = await Affordance.find({ _id: { $in: getAffordanceRegistryObjectIds() } }).populate('category')
        const constraints = await Constraint.find({ _id: { $in: getConstraintRegistryObjectIds() } }).populate('category')
        const previousActivities = await Activity.find({ session: req.params.id })

        const selectedAffordances = selectAffordances(learningGoals, session, affordances)
        const selectedArchetype = selectArchetype(selectedAffordances)
        const constraintPackage = buildConstraintPackage(constraints, selectedAffordances, selectedArchetype)
        validateConstraintPackage(selectedAffordances, selectedArchetype, constraintPackage)

        const assemblyInput = {
            session,
            previousActivities,
            coachInput: {
                challengeLevel,
                duration,
                learningGoals,
            },
            affordances: selectedAffordances,
            archetype: selectedArchetype,
            constraintPackage,
        }

        const assembledActivities = await assembleActivities(assemblyInput)
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

        return res.status(200).json(validatedActivities)
    } catch (error) {
        if (error instanceof SystemPipelineError) {
            return res.status(422).json({
                error: `${error.stage}: ${error.message}`,
                stage: error.stage,
                details: error.details,
            })
        }

        return res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : (error as Error).message,
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


BaseRoutes(router, {
    model: Session,
    route: ROUTES.session,
    excludedRoutes: ['delete'],
})

// Activity routes
BaseRoutes(router, {
    model: Activity,
    route: ROUTES.activity,
    excludedRoutes: ['delete'],
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
