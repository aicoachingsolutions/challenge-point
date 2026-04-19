import { model, Schema } from 'mongoose'

export interface IActivityGenerationPrompt {
    _id: string
    overview: string
    affordancesConstraints: string
    title: string
    constraint: string
    intent: string
    extensions: string
    scaffolding: string
    playerGroupSizes: string
    equipmentNeeded: string
    rules: string
    scoringSystem: string
    winCondition: string
    finalGuidelines: string
    createdAt: Date
    updatedAt: Date
}

const activityGenerationPromptSchema = new Schema<IActivityGenerationPrompt>(
    {
        overview: { type: String },
        affordancesConstraints: { type: String },
        title: { type: String },
        constraint: { type: String },
        intent: {type: String},
        extensions: { type: String },
        scaffolding: { type: String },
        playerGroupSizes: { type: String },
        equipmentNeeded: { type: String },
        rules: { type: String },
        scoringSystem: { type: String },
        winCondition: { type: String },
        finalGuidelines: { type: String },
    },
    {
        timestamps: true,
    }
)

const ActivityGenerationPrompt = model<IActivityGenerationPrompt>(
    'ActivityGenerationPrompt',
    activityGenerationPromptSchema
)
export default ActivityGenerationPrompt
