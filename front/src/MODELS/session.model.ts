import type { IUser } from './user.model'

export enum AgeGroups {
    'Under 6' = 'u6',
    'Under 8' = 'u8',
    'Under 10' = 'u10',
    'Under 12' = 'u12',
    'Under 14' = 'u14',
    'Under 16' = 'u16',
    'Under 18' = 'u18',
    Adult = 'adult',
}

export enum SkillLevels {
    "Reactive Learners (don't read cues well)" = 'beginner',
    'Developing Awareness (pick up on key cues but still reliant mostly on athleticism for solutions)' = 'intermediate',
    'Exploratory Decision-Makers (active searchers that adapt to each moment)' = 'advanced',
}

export enum SessionStatus {
    Draft = 'draft',
    InProgress = 'inProgress',
    Completed = 'completed',
}

/**
 * Session Emphasis — environmental intention for the session (Christian's MVP2 framework).
 *
 * NOT a skill level or difficulty setting. A beginner group may use 'applying'; an elite
 * group may use 'discovering'. The system should never imply beginner → advanced progression
 * from this field.
 *
 * Phase 2: field is collected, stored, and threaded. Activity generation does not yet vary
 * based on emphasis. Phase 3 wires emphasis-aware environmental variation.
 */
export enum SessionEmphasis {
    'Discovering Solutions' = 'discovering',
    'Applying Solutions Under Pressure' = 'applying',
}

/**
 * Coach-facing descriptions for each emphasis option (Christian's verbatim wording from MVP2
 * Session Emphasis & Environmental Intention Framework). Use these in any UI surface that
 * presents the emphasis choice to coaches.
 */
export const SESSION_EMPHASIS_LABELS: Record<SessionEmphasis, { label: string; description: string }> = {
    // Coach-facing descriptions (Christian's approved MVP2 wording). Per his label/description
    // guardrail: the label stays simple and familiar; the description carries the educational
    // load. NOTE: deliberately divergent from the backend SESSION_EMPHASIS_LABELS — the backend
    // copy feeds the AI assembly prompt and keeps the more precise ecological phrasing, which is
    // system-facing, not coach-facing.
    [SessionEmphasis['Discovering Solutions']]: {
        label: 'Discovering solutions',
        description:
            'Players explore lots of different situations and figure out their own solutions. Best when you want variety and problem-solving.',
    },
    [SessionEmphasis['Applying Solutions Under Pressure']]: {
        label: 'Applying solutions under pressure',
        description:
            'Players repeatedly work through similar game challenges under pressure. Best when you want focus and consistency.',
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
     * Environmental intention for the session. Defaults to 'applying' for existing sessions
     * without the field. Changing emphasis on an existing session should trigger full activity
     * regeneration per Christian's MVP2 decision.
     */
    sessionEmphasis?: SessionEmphasis
    fieldLength?: string
    fieldWidth?: string
    fieldType?: string
    coachComments?: string
    createdAt: Date
    updatedAt: Date
}
