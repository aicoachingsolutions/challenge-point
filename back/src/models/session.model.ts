import { model, Schema } from 'mongoose'

import { IAffordance } from './affordance.model'
import { IConstraint } from './constraint.model'
import { IUser } from './user.model'

export enum AgeGroups {
    'Under 6' = 'u6',
    'Under 8' = 'u8',
    'Under 10' = 'u10',
    'Under 12' = 'u12',
    'Under 14' = 'u14',
    'Under 16' = 'u16',
    'Under 18' = 'u18',
    'Adult' = 'adult',
}

export enum SkillLevels {
    "Reactive Learners (don't read cues well)"  = 'beginner',
    "Developing Awareness (pick up on key cues but still reliant mostly on athleticism for solutions)" = 'intermediate',
    "Exploratory Decision-Makers (active searchers that adapt to each moment)"= 'advanced',
}

export enum SessionStatus {
    'Draft' = 'draft',
    'In Progress' = 'inProgress',
    'Completed' = 'completed',
}

/**
 * Session Emphasis — environmental intention for the session (Christian's MVP2 framework).
 *
 * This is an ENVIRONMENTAL INTENTION, not a skill level or difficulty setting. A beginner group
 * may use 'applying'; an elite group may use 'discovering'. The system MUST NOT imply
 * beginner → advanced progression from this field.
 *
 * Phase 2: field is collected, stored, and threaded through. Activity generation does not yet
 * vary based on emphasis. Phase 3 wires the emphasis-aware environmental variation logic.
 *
 * - 'discovering' — Discovering Solutions: broader interaction variability, changing
 *   informational conditions, wider solution diversity. Three activities vary widely across
 *   spatial / transition / overload / scoring axes.
 * - 'applying' — Applying Solutions Under Pressure: stabilized informational themes, recurring
 *   interaction invitations, narrower variability bandwidth. Three activities feel like
 *   repeated exposure to the same problem with intentional small variation.
 */
export enum SessionEmphasis {
    'Discovering Solutions' = 'discovering',
    'Applying Solutions Under Pressure' = 'applying',
}


export interface ISession {
    _id: string
    createdBy: IUser
    name: string
    sessionStatus: SessionStatus
    playerCount?: number
    ageGroup?: AgeGroups
    skillLevel?: SkillLevels
    /**
     * Environmental intention for the session — not a skill level or difficulty setting.
     * Defaults to 'applying' for existing sessions without the field (per Christian's MVP2
     * decision: closest to pre-emphasis output structure, minimizes migration inconsistency).
     */
    sessionEmphasis?: SessionEmphasis
    fieldLength?: string
    fieldWidth?: string
    fieldType?: string
    coachComments?: string
    createdAt: Date
    updatedAt: Date
}

const sessionSchema = new Schema<ISession>(
    {
        name: {type: String},
        createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
        sessionStatus: {type: String},
        playerCount: { type: Number },
        ageGroup: { type: String },
        skillLevel: { type: String },
        sessionEmphasis: {
            type: String,
            enum: Object.values(SessionEmphasis),
            // Default for new sessions if the client does not supply a value. Existing saved
            // sessions without the field will also read as 'applying' via the default below
            // when surfaced through ISession.
            default: SessionEmphasis['Applying Solutions Under Pressure'],
        },
        fieldLength: { type: String },
        fieldWidth: { type: String },
        fieldType: { type: String },
        coachComments: { type: String },
    },
    {
        timestamps: true,
    }
)

const Session = model<ISession>('Session', sessionSchema)
export default Session

