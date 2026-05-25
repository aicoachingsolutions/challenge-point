/**
 * Unit tests for the Phase 3.5 slot-mechanics-variations library.
 *
 * The no-progression invariant: per Christian's Phase 3.5 directive, modifiers must be
 * SIDEWAYS differentiation, not vertical. Any modifier whose mechanic text reads as
 * comparative-to-other-slots (harder / easier / introductory / final / intensified /
 * etc.) would re-introduce the hidden hierarchy this framework is built to remove.
 *
 * Also enforces the vocabulary guardrail: the internal profile vocabulary ('baseline',
 * 'twist', 'variation') must NOT appear inside the modifier text that ends up in the
 * coach-facing rules / scoring lines.
 *
 * Run: npm run test:variations
 */
import assert from 'node:assert/strict'

import { SessionEmphasis } from '../../models/session.model'
import { slotProgressionEmphasisFor } from './build-activity-skeleton'
import { getEmphasisVariationProfile } from './emphasis-variation-profile'
import {
    getSlotMechanicalVariations,
    VALUE_LANDSCAPE_LIBRARY,
    ValueLandscapeModifier,
} from './slot-mechanics-variations'

/**
 * Comparative-to-other-slots tokens. Any of these appearing inside a modifier's
 * mechanicLine implies progression / hierarchy and fails the no-progression invariant.
 */
const PROGRESSION_TOKENS: RegExp[] = [
    /\bharder\b/i,
    /\beasier\b/i,
    /\bintensified\b/i,
    /\bintroductory\b/i,
    /\bintermediate\b/i,
    /\badvanced\b/i,
    /\bstarter\b/i,
    /\bfinal\b/i,
    /\bmost demanding\b/i,
    /\bleast demanding\b/i,
    /\bbuild (up |toward |to )\b/i,
    /\bnext (step|stage|rung)\b/i,
    /\bprogression\b/i,
    /\bramp\b/i,
    /\bramped\b/i,
    /\btighter than\b/i,
    /\blooser than\b/i,
    /\bmore demanding than\b/i,
    /\bless demanding than\b/i,
    /\bmore difficult than\b/i,
    /\bless difficult than\b/i,
]

/**
 * Vocabulary-leak tokens. Christian's directive: 'baseline', 'twist', 'variation' must
 * remain internal profile terminology only and must not appear in coach-facing text.
 * Modifier mechanicLines feed directly into the activity's rules / scoring fields, which
 * ARE coach-facing.
 */
const LEAKED_VOCAB_TOKENS: RegExp[] = [/\bbaseline\b/i, /\btwist\b/i, /\bvariation\b/i, /\bvariations\b/i]

function assertModifierCleanForCoachFacing(m: ValueLandscapeModifier): void {
    for (const re of PROGRESSION_TOKENS) {
        assert.ok(
            !re.test(m.mechanicLine),
            `Modifier "${m.label}" mechanicLine contains progression token ${re}: "${m.mechanicLine}"`
        )
    }
    for (const re of LEAKED_VOCAB_TOKENS) {
        assert.ok(
            !re.test(m.mechanicLine),
            `Modifier "${m.label}" mechanicLine contains coach-facing leaked-vocab token ${re}: "${m.mechanicLine}"`
        )
    }
}

function testLibraryHasNoProgressionLanguage(): void {
    for (const m of VALUE_LANDSCAPE_LIBRARY) {
        assertModifierCleanForCoachFacing(m)
    }
}

function testEverySlotUnderEveryEmphasisIsCovered(): void {
    const cases: Array<{ emphasis: SessionEmphasis | undefined; idx: 1 | 2 | 3 }> = [
        { emphasis: SessionEmphasis['Discovering Solutions'], idx: 1 },
        { emphasis: SessionEmphasis['Discovering Solutions'], idx: 2 },
        { emphasis: SessionEmphasis['Discovering Solutions'], idx: 3 },
        { emphasis: SessionEmphasis['Applying Solutions Under Pressure'], idx: 1 },
        { emphasis: SessionEmphasis['Applying Solutions Under Pressure'], idx: 2 },
        { emphasis: SessionEmphasis['Applying Solutions Under Pressure'], idx: 3 },
        { emphasis: undefined, idx: 1 }, // undefined defaults to applying
    ]
    for (const { emphasis, idx } of cases) {
        const mods = getSlotMechanicalVariations(emphasis, idx)
        assert.ok(Array.isArray(mods), `Slot (${emphasis ?? 'undefined'}, ${idx}) should return an array.`)
        for (const m of mods) {
            assertModifierCleanForCoachFacing(m)
        }
    }
}

function testApplyingSlotOneIsBaselineWithNoModifier(): void {
    const mods = getSlotMechanicalVariations(SessionEmphasis['Applying Solutions Under Pressure'], 1)
    assert.equal(
        mods.length,
        0,
        `Applying slot 1 must be the shared baseline with no modifiers (got ${mods.length}). This preserves the "all slots share the baseline" property of the applying profile.`
    )
}

function testDiscoveringAllSlotsHaveAtLeastOneWideModifier(): void {
    for (const idx of [1, 2, 3] as const) {
        const mods = getSlotMechanicalVariations(SessionEmphasis['Discovering Solutions'], idx)
        assert.ok(
            mods.length >= 1,
            `Discovering slot ${idx} must have at least one wide modifier (got ${mods.length}).`
        )
        for (const m of mods) {
            assert.equal(
                m.bandwidth,
                'wide',
                `Discovering slot ${idx} modifiers must all be wide bandwidth (got "${m.bandwidth}" on "${m.label}").`
            )
        }
    }
}

function testApplyingNonBaselineSlotsCarryNarrowModifierOnly(): void {
    for (const idx of [2, 3] as const) {
        const mods = getSlotMechanicalVariations(SessionEmphasis['Applying Solutions Under Pressure'], idx)
        assert.ok(
            mods.length >= 1,
            `Applying slot ${idx} must carry at least one narrow modifier (got ${mods.length}).`
        )
        for (const m of mods) {
            assert.equal(
                m.bandwidth,
                'narrow',
                `Applying slot ${idx} modifiers must all be narrow bandwidth (got "${m.bandwidth}" on "${m.label}").`
            )
        }
    }
}

function testEveryModifierHasPlacement(): void {
    for (const m of VALUE_LANDSCAPE_LIBRARY) {
        assert.ok(
            m.placement === 'rule' || m.placement === 'scoring',
            `Modifier "${m.label}" must declare placement as 'rule' or 'scoring' (got "${m.placement}").`
        )
        assert.ok(m.mechanicLine.length > 40, `Modifier "${m.label}" mechanicLine is suspiciously short.`)
        assert.ok(m.label.length > 0, 'Every modifier must have a non-empty label.')
    }
}

/**
 * Phase 4A regression test: every string the AI sees in its prompt brief must be free of
 * the leaked-vocab tokens (baseline / twist / variation). If any of these words appear in
 * slot labels, slot directives, the bandwidth summary, or the bandwidth rule, the AI is
 * likely to echo them back into a coach-facing title — which then triggers the polish
 * validator and aborts the whole assembly request. This test catches that class of leak
 * at build time so users don't hit the "Activity 1: title contains internal profile
 * terminology" failure mode in production.
 */
/**
 * Composed-string leak scan: slotProgressionEmphasisFor concatenates the profile's slot
 * directive with helper text ("Activity X of 3 — alternative realization Y...", "Hold
 * these axes stable across the three activities..."). The composition itself can introduce
 * leaked vocab even when the underlying profile is clean. This test exercises the actual
 * function the AI's brief is built from.
 */
function testSlotDirectiveCompositionHasNoLeakedVocab(): void {
    const cases: Array<{ emphasis: SessionEmphasis; idx: 1 | 2 | 3 }> = [
        { emphasis: SessionEmphasis['Discovering Solutions'], idx: 1 },
        { emphasis: SessionEmphasis['Discovering Solutions'], idx: 2 },
        { emphasis: SessionEmphasis['Discovering Solutions'], idx: 3 },
        { emphasis: SessionEmphasis['Applying Solutions Under Pressure'], idx: 1 },
        { emphasis: SessionEmphasis['Applying Solutions Under Pressure'], idx: 2 },
        { emphasis: SessionEmphasis['Applying Solutions Under Pressure'], idx: 3 },
    ]
    for (const { emphasis, idx } of cases) {
        const composed = slotProgressionEmphasisFor(idx, emphasis)
        for (const re of LEAKED_VOCAB_TOKENS) {
            assert.ok(
                !re.test(composed),
                `slotProgressionEmphasisFor(${idx}, "${emphasis}") composition contains leaked-vocab token ${re}: "${composed}"`
            )
        }
    }
}

function testEmphasisProfileAiFacingContentHasNoLeakedVocab(): void {
    const emphases = [
        SessionEmphasis['Discovering Solutions'],
        SessionEmphasis['Applying Solutions Under Pressure'],
    ]
    for (const e of emphases) {
        const profile = getEmphasisVariationProfile(e)
        // Profile-level AI-facing strings
        for (const re of LEAKED_VOCAB_TOKENS) {
            assert.ok(
                !re.test(profile.bandwidthSummary),
                `Emphasis "${e}" bandwidthSummary contains leaked-vocab token ${re}: "${profile.bandwidthSummary}"`
            )
            assert.ok(
                !re.test(profile.bandwidthRule),
                `Emphasis "${e}" bandwidthRule contains leaked-vocab token ${re}: "${profile.bandwidthRule}"`
            )
        }
        // Per-slot AI-facing strings: label (surfaced as `(${m.label})` in polish prompt)
        // and directive (surfaced verbatim as the slot's environmentalConfiguration line).
        for (const slot of profile.slots) {
            for (const re of LEAKED_VOCAB_TOKENS) {
                assert.ok(
                    !re.test(slot.label),
                    `Emphasis "${e}" slot label "${slot.label}" contains leaked-vocab token ${re}.`
                )
                assert.ok(
                    !re.test(slot.directive),
                    `Emphasis "${e}" slot "${slot.label}" directive contains leaked-vocab token ${re}: "${slot.directive}"`
                )
            }
        }
    }
}

function runAll(): void {
    testLibraryHasNoProgressionLanguage()
    testEverySlotUnderEveryEmphasisIsCovered()
    testApplyingSlotOneIsBaselineWithNoModifier()
    testDiscoveringAllSlotsHaveAtLeastOneWideModifier()
    testApplyingNonBaselineSlotsCarryNarrowModifierOnly()
    testEveryModifierHasPlacement()
    testEmphasisProfileAiFacingContentHasNoLeakedVocab()
    testSlotDirectiveCompositionHasNoLeakedVocab()
    console.log('slot-mechanics-variations unit tests: all cases passed.')
}

runAll()
