import { Types } from 'mongoose'

import Logger from '../logger'
import Category from '../models/category.model'
import Constraint from '../models/constraint.model'
import { CONSTRAINT_REGISTRY, ConstraintRegistryEntry } from './constraints'

type SyncResult = {
    created: number
    updated: number
}

function validateRegistry(entries: ConstraintRegistryEntry[]) {
    const ids = new Set<string>()
    const titles = new Set<string>()

    for (const entry of entries) {
        if (!Types.ObjectId.isValid(entry.id)) {
            throw new Error(`Constraint registry entry "${entry.title}" has an invalid Mongo ObjectId "${entry.id}".`)
        }

        if (ids.has(entry.id)) {
            throw new Error(`Constraint registry contains a duplicate id: ${entry.id}`)
        }
        ids.add(entry.id)

        const normalizedTitle = entry.title.trim().toLowerCase()
        if (titles.has(normalizedTitle)) {
            throw new Error(`Constraint registry contains a duplicate title: ${entry.title}`)
        }
        titles.add(normalizedTitle)
    }
}

export async function syncConstraintRegistryToMongo(): Promise<SyncResult> {
    validateRegistry(CONSTRAINT_REGISTRY)

    const canonicalObjectIds = CONSTRAINT_REGISTRY.map((entry) => new Types.ObjectId(entry.id))
    const categoryNames = [...new Set(CONSTRAINT_REGISTRY.map((entry) => entry.categoryName).filter(Boolean) as string[])]
    const categoriesByName = new Map<string, string>()

    if (categoryNames.length > 0) {
        const categories = await Category.find({ name: { $in: categoryNames } })
        for (const category of categories) {
            categoriesByName.set(category.name, String(category._id))
        }

        const missingCategories = categoryNames.filter((name) => !categoriesByName.has(name))
        if (missingCategories.length > 0) {
            throw new Error(
                `Constraint registry category links could not be resolved: ${missingCategories.join(', ')}. ` +
                    'Create those categories first or remove the categoryName linkage from the registry entry.'
            )
        }
    }

    let created = 0
    let updated = 0

    for (const entry of CONSTRAINT_REGISTRY) {
        const existing = await Constraint.findById(entry.id).lean()
        const categoryId = entry.categoryName ? categoriesByName.get(entry.categoryName) : undefined
        const update: Record<string, any> = {
            $set: {
                title: entry.title,
                description: entry.description,
                type: entry.type,
                affordanceTagGroup: entry.affordanceTagGroup,
                notes: entry.notes,
                contextualAudit: entry.contextualAudit,
                suggestedConstraintPrompt: entry.suggestedConstraintPrompt,
                gameTemplateAnchor: entry.gameTemplateAnchor,
                designIntent: entry.designIntent,
                constraintArchetype: entry.constraintArchetype,
                constraintRole: entry.constraintRole,
            },
        }

        if (categoryId) {
            update.$set.category = new Types.ObjectId(categoryId)
        } else {
            update.$unset = { category: 1 }
        }

        await Constraint.updateOne(
            { _id: new Types.ObjectId(entry.id) },
            update,
            { upsert: true }
        )

        if (existing) {
            updated += 1
        } else {
            created += 1
        }
    }

    Logger.info(
        `[constraint-sync] synced ${CONSTRAINT_REGISTRY.length} canonical constraints (${created} created, ${updated} updated).`
    )

    const nonCanonicalCount = await Constraint.countDocuments({
        _id: { $nin: canonicalObjectIds },
    })
    if (nonCanonicalCount > 0) {
        Logger.warn(
            `[constraint-sync] ${nonCanonicalCount} non-canonical constraint records remain in Mongo. ` +
                'The generator now ignores them because the checked-in registry is the source of truth.'
        )
    }

    return { created, updated }
}

