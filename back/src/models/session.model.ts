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

/**
 * Coach-facing label + description for each emphasis option (Christian's verbatim wording from
 * MVP2 Session Emphasis & Environmental Intention Framework). Kept in parity with the frontend
 * model so prompt-threading and UI surfaces draw from a single source of intent.
 */
export const SESSION_EMPHASIS_LABELS: Record<SessionEmphasis, { label: string; description: string }> = {
    [SessionEmphasis['Discovering Solutions']]: {
        label: 'Discovering solutions',
        description:
            'Players experience broader interaction possibilities, adaptive decisions, and changing game situations.',
    },
    [SessionEmphasis['Applying Solutions Under Pressure']]: {
        label: 'Applying solutions under pressure',
        description:
            'Players repeatedly apply solutions within more stable but still game-like pressure conditions.',
    },
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
     * Absent unless explicitly chosen; an absent emphasis runs the differentiated Discovering
     * profile. Always read it through resolveSessionEmphasis (emphasis-variation-profile.ts).
     */
    sessionEmphasis?: SessionEmphasis
    fieldLength?: string
    fieldWidth?: string
    fieldType?: string
    /**
     * Specialized-role AVAILABILITY in this session: role name -> how many people. The role names are the
     * register's (its `specializedRole` rows), so this model names none.
     *
     * Christian, 13 October 2026: availability *"should come from the Team Profile or session
     * configuration, with the coach able to confirm or adjust it. The system should not silently assume
     * that no[ne] are available."* So an absent entry means NOT STATED — never none — and the activity
     * review asks rather than proceeding. It is availability, not involvement: a role available here is
     * put into a particular game only where that game's knowledge establishes it.
     */
    specializedRoles?: Record<string, number>
    /**
     * The session's OBJECTS, by kind: kind -> how many it has and how wide they are, in metres (`{ count, widthM }`). The kinds are the
     * register's (its `sessionResources` block), so this model names none. Added 23 October 2026 (stage E).
     *
     * Christian, reply filed 25 October 2026, item 4: *"Please add the general ability to represent goal availability as a session resource
     * and use authorized knowledge relationships when determining which scoring configuration can be selected."* *"Likewise, the system
     * should not assume a physical goal exists simply because a goalkeeper was selected."* So it is its own field, never inferred from
     * `specializedRoles`, and an absent kind means NOT STATED — never none. It is availability, not involvement: an activity is asked to be
     * covered by it only where its game holds an object of the kind, and a build asks for it only then.
     */
    objects?: Record<string, { count: number; widthM?: number }>
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
            // NO DEFAULT, deliberately. A schema default here filled 'applying' on every new session
            // and on every stored session read without the field, so the engine's own default for an
            // unchosen emphasis (the differentiated profile) never ran for a coach. The schema must not
            // choose for the coach; resolveSessionEmphasis decides what an absent value means.
            // Pinned by session-emphasis.unit.ts.
        },
        fieldLength: { type: String },
        fieldWidth: { type: String },
        fieldType: { type: String },
        specializedRoles: {
            type: Schema.Types.Mixed,
            // NO DEFAULT, for the same reason `sessionEmphasis` above has none. A default here — `{}`, or
            // a zero for each role — would be the schema stating on every session that the coach has no
            // specialized players, which is exactly the silent assumption the field exists to remove. An
            // untouched session stores nothing, and the review reads nothing as "not stated".
        },
        objects: {
            type: Schema.Types.Mixed,
            // NO DEFAULT (stage E, 23 October 2026), for the reason `specializedRoles` above has none: a default — `{}`, or a count of 0
            // for a kind — would be the schema stating on every session that the coach has none of that equipment. An untouched session
            // stores nothing, and a build that needs the statement asks for it. Pinned by session-resources.unit.ts.
        },
        coachComments: { type: String },
    },
    {
        timestamps: true,
    }
)

const Session = model<ISession>('Session', sessionSchema)
export default Session

