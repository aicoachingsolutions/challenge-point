import { Request, Response, Router } from 'express'
import ActivityGenerationPrompt from 'src/models/activityGenerationPrompt'
import Affordance from 'src/models/affordance.model'
import Category from 'src/models/category.model'
import Constraint from 'src/models/constraint.model'
import { generateAffordanceCategory, generateConstraintCategory } from 'src/services/completion.service'

import Activity from '../models/activity.model'
import User from '../models/user.model'
import { ENDPOINTS } from './_endpoints'
import BaseRoutes from './helper'

const router = Router()
const ROUTES = ENDPOINTS.admin

// User Routes
BaseRoutes(router, {
    model: User,
    route: ROUTES.user,
})

// Activity Routes
BaseRoutes(router, {
    model: Activity,
    route: ROUTES.activity,
    populate: [{ path: 'session', populate: 'createdBy' }, 'affordancesUsed', 'constraintsUsed'],
})

// AffordanceConstraint Routes
BaseRoutes(router, {
    model: Affordance,
    route: ROUTES.affordance,
    populate: ['category'],
})

BaseRoutes(router, {
    model: Constraint,
    route: ROUTES.constraint,
    populate: ['category'],
})

BaseRoutes(router, {
    model: Category,
    route: ROUTES.category,
})

router.get(`${ROUTES.affordance}/:id/generate-category`, async (req: Request, res: Response) => {
    const affordance = await Affordance.findById(req.params.id)
    const categories = await Category.find()

    try {
        const aiRecommendedCategory = await generateAffordanceCategory(affordance, categories)
        //@ts-ignore just a reference
        affordance.category = aiRecommendedCategory.categoryId
        await affordance.save()
        return res.status(200).send()
    } catch (error) {
        return res.status(422).send({ error: error instanceof Error ? error.message : 'Failed to infer category' })
    }
})

router.get(`${ROUTES.constraint}/:id/generate-category`, async (req: Request, res: Response) => {
    const constraint = await Constraint.findById(req.params.id)
    const categories = await Category.find()

    try {
        const aiRecommendedCategory = await generateConstraintCategory(constraint, categories)
        //@ts-ignore just a reference
        constraint.category = aiRecommendedCategory.categoryId
        await constraint.save()
        return res.status(200).send()
    } catch (error) {
        return res.status(422).send({ error: error instanceof Error ? error.message : 'Failed to infer category' })
    }
})

router.get(`${ROUTES.activityGenerationPrompt}/:id`, async (req: Request, res: Response) => {
    const activityGenerationPrompt = await ActivityGenerationPrompt.findOne()
    return res.status(200).send(activityGenerationPrompt)
})

router.post(ROUTES.activityGenerationPrompt, async (req: Request, res: Response) => {
    const existingPrompt = await ActivityGenerationPrompt.findOneAndUpdate({ ...req.body })
    if (existingPrompt) return res.status(200).send('updated')
    else await new ActivityGenerationPrompt({ ...req.body }).save()
    return res.status(201).send('Created')
})

export default router
