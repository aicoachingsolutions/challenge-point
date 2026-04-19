import { model, Schema } from 'mongoose'
import { ICategory } from './category.model'


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

const affordanceSchema = new Schema<IAffordance>({
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
    category: {type: Schema.Types.ObjectId, ref: 'Category' }

}, {
    timestamps: true
})

const Affordance = model<IAffordance>('Affordance', affordanceSchema)
export default Affordance