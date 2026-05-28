/**
 * Phase 4B operational translation tests.
 * Run: npm test
 */
import assert from 'node:assert/strict'

import type { ActivitySkeletonSlot } from './build-activity-skeleton'
import {
    ARCHETYPE_DECISION_CUE_PAIRS,
    archetypeDecisionCues,
    buildActivityMechanicsFromSkeleton,
    buildExplicitExchangeRule,
} from './build-activity-mechanics'

const BANNED_OPERATIONAL_LEAKS = [
    /\bplayers? (read|decide|recognize|react)\b/i,
    /\bif a team recognizes\b/i,
    /\brecognizes? the live opportunity\b/i,
    // The phrase "the live opportunity created by <Constraint>" is the internal-logic
    // framing Christian flagged. Removing only the verb "recognizes" left this phrase
    // behind in an earlier pass; catch the whole phrase.
    /\bthe live opportunity created by\b/i,
    // Internal constraint-condition names leak as "... inside the Goalkeeper Included
    // Condition." A coach-facing rule must not name an internal constraint condition.
    /\binside the [a-z ]{1,40} condition\b/i,
    // Double-verb grammar artifact from the old reassembly ("gives the opponent gains").
    /\bgives the opponent gains\b/i,
]

function assertOperational(label: string, text: string): void {
    for (const pattern of BANNED_OPERATIONAL_LEAKS) {
        assert.ok(!pattern.test(text), `${label} contains internal logic wording ${pattern}: ${text}`)
    }
}

function slotFor(archetypeName: string, requiredConstraintMechanics: string[] = []): ActivitySkeletonSlot {
    return {
        activityIndex: 1,
        archetypeName,
        titleFrame: 'Unit test title.',
        setupFrame: 'Unit test setup.',
        slotProgressionEmphasis: 'Unit test emphasis.',
        requiredArchetypeMechanics: [],
        requiredAffordanceMechanics: [],
        requiredConstraintMechanics,
        coachFacingConstraints: [],
        requiredRuleMechanics: [],
        requiredScoringMechanics: [],
        requiredDecisionLanguage: [],
        slotMechanicalVariations: [],
    }
}

for (const archetypeName of Object.keys(ARCHETYPE_DECISION_CUE_PAIRS)) {
    assertOperational(`${archetypeName} exchange rule`, buildExplicitExchangeRule(slotFor(archetypeName)))
    for (const [idx, cue] of archetypeDecisionCues(archetypeName).entries()) {
        assertOperational(`${archetypeName} decision cue ${idx + 1}`, cue)
    }
}

assertOperational('fallback exchange rule', buildExplicitExchangeRule(slotFor('Unknown Game Form')))
for (const [idx, cue] of archetypeDecisionCues('Unknown Game Form').entries()) {
    assertOperational(`fallback decision cue ${idx + 1}`, cue)
}

const liveRuleSlot = slotFor('Directional Possession Games', [
    'Interaction exchange — live rule and cues: If a team recognizes the live opportunity created by Wide Zone Advantage, then they exploit it under pressure, keep the next action live, and gain the selected advantage; but if they force the action into pressure or lose the ball while the picture is closed, then the opponent gains the connected restart, regain, or counter-attacking advantage, and play continues live inside the Goalkeeper Included Condition. Visible opportunity cue: wide channel opens.',
])
assertOperational('environmentalized live exchange rule', buildExplicitExchangeRule(liveRuleSlot))

const mechanics = buildActivityMechanicsFromSkeleton({ activities: [liveRuleSlot], sessionEmphasis: undefined })
assert.equal(
    mechanics.activities[0]!.rules[0],
    buildExplicitExchangeRule(liveRuleSlot),
    'rules[0] must stay in sync with the explicit exchange rule'
)
assertOperational('mechanics rules[0]', mechanics.activities[0]!.rules[0]!)

console.log('operational-translation unit tests: all cases passed.')
