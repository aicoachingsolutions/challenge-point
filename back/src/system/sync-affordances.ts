import { Types } from 'mongoose'

import Logger from '../logger'
import Affordance from '../models/affordance.model'
import Category from '../models/category.model'
import { AFFORDANCE_REGISTRY, AffordanceRegistryEntry } from './affordances'

type SyncResult = {
    created: number
    updated: number
}

function validateRegistry(entries: AffordanceRegistryEntry[]) {
    const ids = new Set<string>()
    const titles = new Set<string>()

    for (const entry of entries) {
        if (!Types.ObjectId.isValid(entry.id)) {
            throw new Error(`Affordance registry entry "${entry.title}" has an invalid Mongo ObjectId "${entry.id}".`)
        }

        if (ids.has(entry.id)) {
            throw new Error(`Affordance registry contains a duplicate id: ${entry.id}`)
        }
        ids.add(entry.id)

        const normalizedTitle = entry.title.trim().toLowerCase()
        if (titles.has(normalizedTitle)) {
            throw new Error(`Affordance registry contains a duplicate title: ${entry.title}`)
        }
        titles.add(normalizedTitle)
    }
}

export async function syncAffordanceRegistryToMongo(): Promise<SyncResult> {
    validateRegistry(AFFORDANCE_REGISTRY)

    const canonicalObjectIds = AFFORDANCE_REGISTRY.map((entry) => new Types.ObjectId(entry.id))
    const categoryNames = [...new Set(AFFORDANCE_REGISTRY.map((entry) => entry.categoryName).filter(Boolean) as string[])]
    const categoriesByName = new Map<string, string>()

    if (categoryNames.length > 0) {
        const categories = await Category.find({ name: { $in: categoryNames } })
        for (const category of categories) {
            categoriesByName.set(category.name, String(category._id))
        }

        const missingCategories = categoryNames.filter((name) => !categoriesByName.has(name))
        if (missingCategories.length > 0) {
            throw new Error(
                `Affordance registry category links could not be resolved: ${missingCategories.join(', ')}. ` +
                    'Create those categories first or remove the categoryName linkage from the registry entry.'
            )
        }
    }

    let created = 0
    let updated = 0

    for (const entry of AFFORDANCE_REGISTRY) {
        const existing = await Affordance.findById(entry.id).lean()
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
            },
        }

        if (categoryId) {
            update.$set.category = new Types.ObjectId(categoryId)
        } else {
            update.$unset = { category: 1 }
        }

        await Affordance.updateOne(
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
        `[affordance-sync] synced ${AFFORDANCE_REGISTRY.length} canonical affordances (${created} created, ${updated} updated).`
    )

    const nonCanonicalCount = await Affordance.countDocuments({
        _id: { $nin: canonicalObjectIds },
    })
    if (nonCanonicalCount > 0) {
        Logger.warn(
            `[affordance-sync] ${nonCanonicalCount} non-canonical affordance records remain in Mongo. ` +
                'The generator now ignores them because the checked-in registry is the source of truth.'
        )
    }

    return { created, updated }
}
