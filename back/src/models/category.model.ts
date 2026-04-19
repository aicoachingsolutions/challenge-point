import { model, Schema } from 'mongoose'


export interface ICategory {
    _id: string
    name: string
    description: string
    createdAt: Date
    updatedAt: Date
}

const categorySchema = new Schema<ICategory>({
    name: { type: String, required: true },
   description: {type: String},
    
}, {
    timestamps: true
})

const Category = model<ICategory>('Category', categorySchema)
export default Category