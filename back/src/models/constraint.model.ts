import { model, Schema } from 'mongoose'
import { ICategory } from './category.model'


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

const constraintSchema = new Schema<IConstraint>({
    title: {type: String},
    description: {type: String},
    type: {type: String},
    affordanceTagGroup: {type: String},
    notes: {type: String},
    contextualAudit: {type: String},
    suggestedConstraintPrompt: {type: String},
    gameTemplateAnchor: {type: String},
    designIntent: {type: String},
    constraintArchetype: {type: String},
    constraintRole: {type: String},
    category: {type: Schema.Types.ObjectId, ref: 'Category' }

}, {
    timestamps: true
})

const Constraint = model<IConstraint>('Constraint', constraintSchema)
export default Constraint
