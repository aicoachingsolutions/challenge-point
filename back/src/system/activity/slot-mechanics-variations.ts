import { SessionEmphasis } from '../../models/session.model'

/**
 * Phase 3.5 — Slot Mechanics Variations (value-landscape modifiers).
 *
 * The variation library that turns Christian's directive into per-slot mechanics
 * differentiation: shared interaction philosophy, differentiated environmental value
 * landscapes.
 *
 * What a modifier IS:
 * - A single rule or scoring line appended to one slot's mechanics that re-weights
 *   value within the shared constraint package.
 * - Archetype-agnostic in vocabulary — references universal concepts (pressure, regain,
 *   zone, decision, transition, possession) so it composes with any game form.
 * - SIDEWAYS, not vertical — no modifier reads as "harder", "easier", "more advanced",
 *   "intensified", or any comparative-to-other-slots language. The library invariant is:
 *   any pair of slot modifiers under the same emphasis must read as two different value
 *   structures, not two rungs of one ladder.
 *
 * What a modifier IS NOT:
 * - A replacement for the shared mechanics. The constraint package, archetype mechanics,
 *   affordance lenses, and decision-language stems remain slot-invariant. Modifiers only
 *   re-weight value WITHIN that shared structure.
 * - A new game. Modifiers cannot remove opposition, remove decisions, narrow viable
 *   solutions, or break representativeness.
 * - A wording variant. Modifiers are mechanics. The validator requires the modifier text
 *   be present in the relevant slot's rules or scoring; the AI may paraphrase but cannot
 *   replace with cosmetic restatement.
 *
 * Bandwidth distinction:
 * - WIDE modifiers (used under 'discovering') are MEANINGFUL re-weightings — multiple
 *   value layers, complex incentive structures. Three wide modifiers across three slots
 *   produce three observably different value landscapes.
 * - NARROW modifiers (used under 'applying') are MODEST re-weightings — single-parameter
 *   shifts from the baseline. They produce repeated exposure to the same problem with
 *   intentional small variation.
 *
 * No-progression invariant: see ./slot-mechanics-variations.unit.ts for the test that
 * fails build if any modifier line contains comparative-to-other-slots language.
 */

import type { EnvironmentalAxis } from './emphasis-variation-profile'

export type ValueLandscapeBandwidth = 'wide' | 'narrow'

export interface ValueLandscapeModifier {
    /** Which environmental axis this modifier re-weights value along. */
    axis: EnvironmentalAxis | 'scoring-incentives' | 'pressure-rewards' | 'regain-conditions'
    /** Whether this is a discovering-strength (wide) or applying-strength (narrow) modifier. */
    bandwidth: ValueLandscapeBandwidth
    /** Where this line gets appended on the slot's mechanics. */
    placement: 'rule' | 'scoring'
    /** Coach-readable label for the polish prompt's per-slot block. */
    label: string
    /** The literal mechanic text appended to this slot's required rules or scoring. */
    mechanicLine: string
}

/**
 * The variation library. Organized by axis (mirrors Christian's Phase 3.5 directive list):
 * scoring incentives / transition consequences / pressure rewards / regain conditions /
 * overload incentives / spatial value structures / timing incentives.
 *
 * Each axis carries both a wide modifier (for discovering) and a narrow modifier (for
 * applying). Phase 3.5 first cut uses one modifier per (axis, bandwidth) pair to keep
 * variation deterministic; a future phase can expand the bank and seed-select among them.
 */

const SCORING_INCENTIVES_WIDE: ValueLandscapeModifier = {
    axis: 'scoring',
    bandwidth: 'wide',
    placement: 'scoring',
    label: 'wide scoring-incentive value structure',
    mechanicLine:
        'Score is weighted by where possession changes hands — regains in a forward zone count higher than regains in a defensive zone, and the value structure stays the same in every contest within this activity.',
}

const SCORING_INCENTIVES_NARROW: ValueLandscapeModifier = {
    axis: 'scoring',
    bandwidth: 'narrow',
    placement: 'scoring',
    label: 'narrow scoring-incentive shift',
    mechanicLine:
        'Score completes when a regain is followed by one connected forward action under opposition — same scoring shape as the other activities in this session, with the completion bar set at one connected action.',
}

const TRANSITION_CONSEQUENCES_WIDE: ValueLandscapeModifier = {
    axis: 'transition',
    bandwidth: 'wide',
    placement: 'rule',
    label: 'wide transition-consequence rule',
    mechanicLine:
        'On possession change, both teams stay live in the same space with no reset — defenders re-press immediately from wherever they were standing when the ball changed hands, and the live picture continues until the next decision resolves.',
}

const TRANSITION_CONSEQUENCES_NARROW: ValueLandscapeModifier = {
    axis: 'transition',
    bandwidth: 'narrow',
    placement: 'rule',
    label: 'narrow transition-consequence shift',
    mechanicLine:
        'Transition stays live until the defensive shape recovers, then play resets to the shared restart point — same shape as the other activities in this session, anchored to the same restart logic.',
}

const PRESSURE_REWARDS_WIDE: ValueLandscapeModifier = {
    axis: 'scoring',
    bandwidth: 'wide',
    placement: 'scoring',
    label: 'wide pressure-reward structure',
    mechanicLine:
        'Sustained team pressure that forces the opposing team to play backward earns the same value as a turnover — opponents driven backward counts as a defensive success even without winning the ball, and pressure that closes a passing lane the attackers were reading counts as a defensive read.',
}

const PRESSURE_REWARDS_NARROW: ValueLandscapeModifier = {
    axis: 'scoring',
    bandwidth: 'narrow',
    placement: 'scoring',
    label: 'narrow pressure-reward shift',
    mechanicLine:
        'Pressure that forces a possession change earns the regain value for this activity — pressure short of a possession change is observed by the coach but not scored.',
}

const REGAIN_CONDITIONS_WIDE: ValueLandscapeModifier = {
    axis: 'transition',
    bandwidth: 'wide',
    placement: 'rule',
    label: 'wide regain-condition value structure',
    mechanicLine:
        'A regain completes only when followed by a connected forward action under opposition within the live transition window — possession won and immediately surrendered does not complete the regain, and the live advantage shifts back to the team that recovered the ball.',
}

const REGAIN_CONDITIONS_NARROW: ValueLandscapeModifier = {
    axis: 'transition',
    bandwidth: 'narrow',
    placement: 'rule',
    label: 'narrow regain-condition shift',
    mechanicLine:
        'A regain completes on possession change with an immediate live restart from the regain point — same regain shape as the other activities in this session, anchored to the same live-restart logic.',
}

const OVERLOAD_INCENTIVES_WIDE: ValueLandscapeModifier = {
    axis: 'overload',
    bandwidth: 'wide',
    placement: 'scoring',
    label: 'wide overload-incentive value structure',
    mechanicLine:
        'When a numerical advantage is held in the zone where pressure is applied, regains in that zone carry higher value — the scoring weight scales with the overload that produced the regain, and balanced-number regains keep the base value.',
}

const OVERLOAD_INCENTIVES_NARROW: ValueLandscapeModifier = {
    axis: 'overload',
    bandwidth: 'narrow',
    placement: 'scoring',
    label: 'narrow overload-incentive shift',
    mechanicLine:
        'Numerical relationship across the field stays balanced for this activity — regain values are uniform across zones and the decision problem is the same as the other activities in this session.',
}

const SPATIAL_VALUE_STRUCTURES_WIDE: ValueLandscapeModifier = {
    axis: 'spatial',
    bandwidth: 'wide',
    placement: 'scoring',
    label: 'wide spatial-value structure',
    mechanicLine:
        'The field is treated as three value zones — regains in the central zone carry one value weight, regains in the wide zones carry a different value weight, and regains in the deep zone carry a third value weight, with the structure staying the same in every contest within this activity.',
}

const SPATIAL_VALUE_STRUCTURES_NARROW: ValueLandscapeModifier = {
    axis: 'spatial',
    bandwidth: 'narrow',
    placement: 'scoring',
    label: 'narrow spatial-value shift',
    mechanicLine:
        'Working area shifts in shape for this activity — same zone count and same value structure as the other activities in this session, set into a slightly different working footprint.',
}

const TIMING_INCENTIVES_WIDE: ValueLandscapeModifier = {
    axis: 'timing',
    bandwidth: 'wide',
    placement: 'rule',
    label: 'wide timing-incentive value structure',
    mechanicLine:
        'Pressure must convert to a regain within a short opportunity window — if the window closes without a regain, the value resets and the opposing team gains the live advantage from the same point on the field.',
}

const TIMING_INCENTIVES_NARROW: ValueLandscapeModifier = {
    axis: 'timing',
    bandwidth: 'narrow',
    placement: 'rule',
    label: 'narrow timing-incentive shift',
    mechanicLine:
        'The decision window after a possession change stays open for the duration of one live action sequence — same window shape as the other activities in this session, anchored to the same trigger.',
}

/**
 * The flat library, exported for tests / introspection / Christian's review.
 */
export const VALUE_LANDSCAPE_LIBRARY: ValueLandscapeModifier[] = [
    SCORING_INCENTIVES_WIDE,
    SCORING_INCENTIVES_NARROW,
    TRANSITION_CONSEQUENCES_WIDE,
    TRANSITION_CONSEQUENCES_NARROW,
    PRESSURE_REWARDS_WIDE,
    PRESSURE_REWARDS_NARROW,
    REGAIN_CONDITIONS_WIDE,
    REGAIN_CONDITIONS_NARROW,
    OVERLOAD_INCENTIVES_WIDE,
    OVERLOAD_INCENTIVES_NARROW,
    SPATIAL_VALUE_STRUCTURES_WIDE,
    SPATIAL_VALUE_STRUCTURES_NARROW,
    TIMING_INCENTIVES_WIDE,
    TIMING_INCENTIVES_NARROW,
]

/**
 * Phase 3.5 first-cut selection: deterministic per (emphasis, slotIdx).
 *
 *   discovering / slot 1 → spatial-value WIDE          (foreground spatial)
 *   discovering / slot 2 → transition-consequence WIDE (foreground transition)
 *   discovering / slot 3 → overload-incentive WIDE
 *                          + scoring-incentive WIDE    (foreground overload + scoring)
 *
 *   applying / slot 1    → no modifier — slot 1 is the shared baseline
 *   applying / slot 2    → spatial-value NARROW        (one small spatial twist)
 *   applying / slot 3    → timing-incentive NARROW     (one small timing twist)
 *
 * This mapping mirrors the variation profile (see emphasis-variation-profile.ts) so the
 * foreground axes a slot directive declares and the value-landscape modifier the slot
 * actually carries always agree.
 */
export function getSlotMechanicalVariations(
    emphasis: SessionEmphasis | undefined | null,
    index: 1 | 2 | 3
): ValueLandscapeModifier[] {
    const resolved = emphasis ?? SessionEmphasis['Applying Solutions Under Pressure']

    if (resolved === SessionEmphasis['Discovering Solutions']) {
        switch (index) {
            case 1:
                return [SPATIAL_VALUE_STRUCTURES_WIDE]
            case 2:
                return [TRANSITION_CONSEQUENCES_WIDE]
            case 3:
                return [OVERLOAD_INCENTIVES_WIDE, SCORING_INCENTIVES_WIDE]
        }
    }

    // applying
    switch (index) {
        case 1:
            return []
        case 2:
            return [SPATIAL_VALUE_STRUCTURES_NARROW]
        case 3:
            return [TIMING_INCENTIVES_NARROW]
    }
}
