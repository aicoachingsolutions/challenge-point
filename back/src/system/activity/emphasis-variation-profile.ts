import { SessionEmphasis } from '../../models/session.model'

/**
 * Environmental Variation Profile (Phase 3 of the Session Emphasis & Environmental
 * Intention Framework).
 *
 * Phase 1 stripped the "establish → pressure → full contest" progression model.
 * Phase 2 collected the emphasis on the session and threaded it through types.
 * Phase 3 (this module) defines the per-emphasis bandwidth and per-slot variation
 * directives that turn one chosen emphasis into three meaningfully differentiated
 * parallel realizations — without re-introducing hidden hierarchy or progression.
 *
 * Vocabulary:
 *
 *   discovering — Discovering Solutions. Wide variability bandwidth. The three
 *   activities foreground DIFFERENT primary environmental axes (spatial / transition /
 *   overload + scoring). A coach reading them should perceive three genuinely different
 *   environments that all share the same session identity.
 *
 *   applying — Applying Solutions Under Pressure. Narrow variability bandwidth. The
 *   three activities share their core environmental configuration and vary modestly
 *   along one micro-parameter per slot (working area size / timing window / scoring
 *   threshold). A coach reading them should perceive three repeated exposures to the
 *   same problem with intentional small variation.
 *
 * In both cases the activities are PARALLEL realizations, not stages. No slot is the
 * "easier", "introductory", or "final" version. Every slot operates at the full
 * affordance lens density (no progressive subset).
 */

export type EnvironmentalAxis = 'spatial' | 'transition' | 'overload' | 'scoring' | 'timing'

export interface SlotVariationSpec {
    /**
     * The axis (or axes) this slot foregrounds. For 'discovering' this is the primary
     * axis along which this slot differs from its siblings. For 'applying' this is the
     * one micro-parameter that varies modestly while all other axes are held stable.
     */
    foregroundAxes: EnvironmentalAxis[]
    /**
     * Axes that should be held stable across the three slots. Used to make explicit what
     * remains shared so the AI doesn't accidentally vary everything (in 'applying') or
     * accidentally hold everything constant (in 'discovering').
     */
    holdAxes: EnvironmentalAxis[]
    /**
     * Coach-facing directive embedded in slotProgressionEmphasis (and surfaced into the
     * setupFrame guidance). Describes the specific environmental configuration role this
     * slot plays under the given emphasis.
     */
    directive: string
    /**
     * Short label for prompt readability and trace logging (e.g. "spatial-foregrounded").
     */
    label: string
}

export interface EmphasisVariationProfile {
    emphasis: SessionEmphasis
    /** One-line summary of the bandwidth this emphasis prescribes, used in the polish prompt. */
    bandwidthSummary: string
    /**
     * Bandwidth-shaping rule used in the polish prompt. Describes HOW MUCH the three
     * activities should differ across environmental axes under this emphasis.
     */
    bandwidthRule: string
    /** Per-slot variation spec (3 entries). */
    slots: [SlotVariationSpec, SlotVariationSpec, SlotVariationSpec]
}

const DISCOVERING_PROFILE: EmphasisVariationProfile = {
    emphasis: SessionEmphasis['Discovering Solutions'],
    bandwidthSummary:
        'Wide variability bandwidth — three activities foreground different primary environmental axes while preserving the session emphasis identity.',
    bandwidthRule:
        'The three activities should vary MEANINGFULLY across environmental axes. Each activity foregrounds a different primary axis (spatial organization in one, transition condition in another, overload + scoring nuance in the third). Differentiation should be observable to a coach reading the three setups side by side — the activities should feel like three distinct environments expressing the same emphasis, not three near-identical descriptions.',
    slots: [
        {
            label: 'spatial-foregrounded',
            foregroundAxes: ['spatial'],
            holdAxes: ['transition'],
            directive:
                'Foreground SPATIAL ORGANIZATION as the primary differentiator for this realization. Choose a distinctive spatial configuration (zone count, zone shape, channels, asymmetric thirds, central corridor, wide channels) and let the setup paragraph make that spatial signature visible. Restart and transition logic should remain consistent with the archetype — variation lives in the space, not in the restart rules. Do NOT frame this as the "starter", "introductory", or "simpler" version; it is one of three parallel designs.',
        },
        {
            label: 'transition-foregrounded',
            foregroundAxes: ['transition'],
            holdAxes: ['spatial'],
            directive:
                'Foreground TRANSITION CONDITION as the primary differentiator for this realization. Choose a distinctive transition / restart / continuation logic (live restarts, frozen restarts, possession-flip trigger, timed reset, ball-out-of-play handling) and let the setup paragraph make that transition signature visible. Spatial organization should be broadly compatible with the other activities — variation lives in the transition logic, not in the zones. Do NOT frame this as a "build-up" or "intermediate" version; it is one of three parallel designs.',
        },
        {
            label: 'overload-and-scoring-foregrounded',
            foregroundAxes: ['overload', 'scoring'],
            holdAxes: [],
            directive:
                'Foreground OVERLOAD RELATIONSHIP and SCORING NUANCE together as the primary differentiator for this realization. Choose a distinctive numerical relationship (numerical overload, positional overload, role asymmetry) and a distinctive scoring nuance (weighted scoring, multi-condition score, time-bonus scoring, target-zone bonus). Let the setup paragraph make both signatures visible. Do NOT frame this as the "hardest", "final", or "full-contest" version; it is one of three parallel designs.',
        },
    ],
}

const APPLYING_PROFILE: EmphasisVariationProfile = {
    emphasis: SessionEmphasis['Applying Solutions Under Pressure'],
    bandwidthSummary:
        'Narrow variability bandwidth — three activities share core environmental configuration and vary modestly along one micro-parameter per slot.',
    bandwidthRule:
        'The three activities should share their CORE environmental configuration (same archetypal zone structure, same restart logic, same numerical relationship) and vary MODESTLY along one micro-parameter per activity (working area size, timing window, scoring threshold). Differentiation should feel like repeated exposure to the same problem with intentional small variation — NOT three different environments and NOT a difficulty ramp. A coach reading the three setups side by side should perceive the same problem revisited with a small environmental twist each time.',
    slots: [
        {
            label: 'baseline-configuration',
            foregroundAxes: [],
            holdAxes: ['spatial', 'transition', 'overload', 'scoring'],
            directive:
                'Hold the core environmental configuration (spatial structure, transition logic, overload relationship, scoring system) at the archetype baseline for this realization. This activity establishes the shared problem the other two will revisit. Do NOT frame this as the "starter", "easiest", or "introductory" version — it is one of three repeated exposures to the same problem, not the entry rung of a ladder. Setup wording should clearly state the configuration that the other two will share.',
        },
        {
            label: 'micro-vary-working-area',
            foregroundAxes: ['spatial'],
            holdAxes: ['transition', 'overload', 'scoring'],
            directive:
                'Hold transition logic, overload relationship, and scoring system identical to the other two activities. Vary MODESTLY along one spatial micro-parameter — e.g. a slightly different working area size, a slightly compressed central channel, or a slightly shifted zone boundary. The activity should feel like the same problem revisited with a small spatial twist, NOT a different environment. Do NOT frame this as "dialled-up pressure" or "intermediate"; it is one of three repeated exposures.',
        },
        {
            label: 'micro-vary-timing-or-scoring',
            foregroundAxes: ['timing', 'scoring'],
            holdAxes: ['spatial', 'transition', 'overload'],
            directive:
                'Hold spatial organization, transition logic, and overload relationship identical to the other two activities. Vary MODESTLY along one timing or scoring micro-parameter — e.g. a slightly tighter time window, a slightly raised scoring threshold, or a small bonus condition. The activity should feel like the same problem revisited with a small temporal or scoring twist, NOT a different environment. Do NOT frame this as the "hardest", "final", or "full-contest" version; it is one of three repeated exposures.',
        },
    ],
}

const PROFILES: Record<SessionEmphasis, EmphasisVariationProfile> = {
    [SessionEmphasis['Discovering Solutions']]: DISCOVERING_PROFILE,
    [SessionEmphasis['Applying Solutions Under Pressure']]: APPLYING_PROFILE,
}

/**
 * Returns the variation profile for the given session emphasis. Sessions without a stored
 * emphasis default to 'applying' (Christian's MVP2 decision: closest to pre-emphasis output
 * structure, minimizes migration inconsistency for existing sessions).
 */
export function getEmphasisVariationProfile(emphasis: SessionEmphasis | undefined | null): EmphasisVariationProfile {
    const resolved = emphasis ?? SessionEmphasis['Applying Solutions Under Pressure']
    return PROFILES[resolved] ?? APPLYING_PROFILE
}

/**
 * Returns the per-slot variation spec for the given session emphasis and 1-based slot index.
 * Defaults to 'applying' when emphasis is undefined.
 */
export function getSlotVariationSpec(
    emphasis: SessionEmphasis | undefined | null,
    index: 1 | 2 | 3
): SlotVariationSpec {
    return getEmphasisVariationProfile(emphasis).slots[index - 1]
}
