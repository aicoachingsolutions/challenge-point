import type { ICategory } from './category.model'

export enum ConstraintRoles {
    Foundation = 'foundation',
    Shaping = 'shaping',
    Consequence = 'consequence',
}

export interface IConstraint {
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
    constraintRole?: ConstraintRoles
    createdAt: Date
    updatedAt: Date
}
