import type { ICategory } from './category.model'

export interface IAffordance {
    _id: string
    title?: string
    description?: string
    type?: string
    affordanceTagGroup?: string
    notes?: string
    contextualAudit?: string
    suggestedConstraintPrompt?: string
    category?: ICategory
    gameTemplateAnchor?: string
    designIntent?: string
    constraintArchetype?: string
    createdAt: Date
    updatedAt: Date
}
