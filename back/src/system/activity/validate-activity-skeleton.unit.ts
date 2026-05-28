/**
 * Unit tests for validateActivityAgainstSkeleton (no OpenAI, no network).
 * Run: npm test
 */
import assert from 'node:assert/strict'

import type { Activity } from './activity-schema'
import type { ActivitySkeletonSlot } from './build-activity-skeleton'
import { validateActivityAgainstSkeleton } from './validate-activity-skeleton'

/** Marker token — must appear in mechanic bundle for the selected constraint line to match; proves constraint requirement is enforced. */
const CONSTRAINT_MARKER = 'QUARK_CONSTRAINT_MARKER_ZETA'

const validationOk = {
    hasOpposition: true,
    hasDecisionMaking: true,
    hasConsequence: true,
    avoidsPrescriptiveActions: true,
}

/**
 * Fixed skeleton slot: End Zone + Space Exploitation + one foundation constraint (with marker).
 */
function testSkeletonSlot(): ActivitySkeletonSlot {
    return {
        activityIndex: 1,
        archetypeName: 'End Zone Games',
        titleFrame: 'Environmental emphasis for unit test.',
        setupFrame: 'Setup frame for unit test.',
        slotProgressionEmphasis: 'Activity 1 of 3 — establish (unit test fixture).',
        requiredArchetypeMechanics: [
            'Target or end-zone progression as core structure.',
            'Active opposition contesting progression.',
        ],
        requiredAffordanceMechanics: [
            'Affordance lens "Space Exploitation Opportunity": Rules and scoring need to require using open space to gain advantage before pressure recovers.',
            'Affordance lens "Space Exploitation Opportunity" — reflect lens behaviors in objective, rules, scoring, constraints, or coachingFocus: stretch defenders and use width when central density packs tight.',
        ],
        requiredConstraintMechanics: [
            `Selected foundation constraint "Wide Zone Channel" — required behaviors: ${CONSTRAINT_MARKER} attack the wide channels when the defense stays narrow; reward width that fixes defenders.`,
        ],
        coachFacingConstraints: [
            `Wide Zone Channel: ${CONSTRAINT_MARKER} attack the wide channels when the defense stays narrow; reward width that fixes defenders.`,
        ],
        requiredRuleMechanics: [
            'Rules encode opposition and end-zone contest.',
            '[Affordance] Affordance lens "Space Exploitation Opportunity": open space before pressure recovers.',
            `[Constraint] ${CONSTRAINT_MARKER} channel width when narrow.`,
        ],
        requiredScoringMechanics: [
            'Scoring tied to reaching or using the end zone / target area.',
            '[Affordance] Affordance lens "Space Exploitation Opportunity": points when exploiting open space under pressure.',
            `[Constraint] ${CONSTRAINT_MARKER} wide channel bonus when defense is narrow.`,
        ],
        requiredDecisionLanguage: ['choose', 'read', 'react', 'decision', 'adapt', 'option'],
        slotMechanicalVariations: [],
    }
}

function passActivity(): Activity {
    return {
        title: 'End zone channel game',
        setup: 'Field with two end zones; teams opposed.',
        teams: '4v4 plus goalkeepers.',
        objective:
            'Attack toward the end zone target with opposed teams; choose when to drive the channel read the narrow defense and seek progression under live opposition.',
        rules: [
            'Two-sided exchange: if possession enters the wide channel before pressure recovers, the next action stays live; defenders contest end-zone entry.',
            'Reward stretching defenders with width when central density packs tight; attack wide channels when the defense stays narrow.',
            'Using open space to gain advantage before pressure recovers is required for the restart advantage.',
        ],
        scoring:
            'Points for reaching the end zone target area; bonus scoring when exploiting open space under pressure before pressure recovers; wide channel bonus when defense is narrow.',
        constraints: [
            `${CONSTRAINT_MARKER}: Wide Zone Channel — reward width that fixes defenders and attack channels when narrow.`,
        ],
        coachingFocus: [
            'Decision: adapt the route based on whether the opportunity is on in the half-space.',
        ],
        validation: validationOk,
    }
}

assert.deepEqual(validateActivityAgainstSkeleton(passActivity(), testSkeletonSlot(), 1), [], 'case 1 PASS')

/**
 * Case 2 (FAIL — mechanics absent from non-setup bundle): joinSkeletonMechanicBundle excludes setup.
 * Affordance vocabulary is only in setup here; objective/rules/scoring/constraints/coachingFocus omit it.
 * Note: affordance text placed only in coachingFocus would still sit inside the bundle — use setup-only to prove exclusion without changing the validator.
 */
const affordanceOnlyInSetup: Activity = {
    ...passActivity(),
    setup:
        'Exploit open space before pressure recovers; stretch defenders; attack wide channels when defense stays narrow; end zone target scoring; central density packs tight.',
    objective: 'Teams compete with structure and opposed teams.',
    rules: ['Teams keep possession in the middle third.', 'Restart on stoppages.'],
    scoring: 'First team to five completions wins a round.',
    constraints: ['Keep three players in the middle zone.'],
    coachingFocus: ['Stay connected as a group.'],
}
const case2 = validateActivityAgainstSkeleton(affordanceOnlyInSetup, testSkeletonSlot(), 1)
assert.ok(case2.length > 0, 'case 2 should fail')
assert.ok(
    case2.some((r) => r.includes('Space Exploitation') || r.includes('Affordance')),
    'case 2 should cite affordance failure'
)

const noDecisionLanguage: Activity = {
    ...passActivity(),
    objective:
        'Teams attack toward the end zone target with opposed teams and live contest toward the target area.',
    rules: [
        'Two-sided exchange with defenders contesting end-zone entry.',
        'Reward stretching with width when central density packs tight; use space before pressure recovers.',
        'Using space to gain advantage before pressure recovers is required for the restart advantage.',
    ],
    scoring:
        'Points for reaching the end zone target area; bonus scoring for using space under pressure before pressure recovers; wide channel bonus when defense is narrow.',
    coachingFocus: ['Stay compact without the ball.'],
}
const case3 = validateActivityAgainstSkeleton(noDecisionLanguage, testSkeletonSlot(), 1)
assert.ok(case3.some((r) => r.includes('decision language')), 'case 3 should fail decision language')

const environmentalDecisionLanguage: Activity = {
    ...passActivity(),
    objective:
        'Teams attack toward the end zone target with opposed teams and live contest toward the target area.',
    rules: [
        'Wide channels remain active and may be used to progress into the target zone; play continues live after every turnover with no reset.',
        'Reward stretching defenders with width when central density packs tight; open space before pressure recovers stays connected to the restart advantage.',
        'Using the wide channel to gain advantage before pressure recovers is required for the restart advantage.',
    ],
    coachingFocus: ['Support, width, and target-zone entries stay available while pressure shifts.'],
}
assert.deepEqual(
    validateActivityAgainstSkeleton(environmentalDecisionLanguage, testSkeletonSlot(), 1),
    [],
    'case 3b environmental option language should pass decision validation'
)

const missingConstraint: Activity = {
    ...passActivity(),
    objective: 'Attack toward the end zone target with opposed teams; play forward under live opposition and seek progression.',
    rules: [
        'Two-sided exchange: defenders contest end-zone entry and progression stays live.',
        'Exploit open space before pressure recovers with stretching defenders when central density packs tight.',
        'Using open space to gain advantage before pressure recovers is required for the restart advantage.',
    ],
    scoring:
        'Points for reaching the end zone target area; bonus scoring when exploiting open space under pressure before pressure recovers.',
    constraints: ['Keep three seconds maximum on the ball — no zone markers here.'],
}
const case4 = validateActivityAgainstSkeleton(missingConstraint, testSkeletonSlot(), 1)
assert.ok(case4.some((r) => r.includes(CONSTRAINT_MARKER) || r.includes('Wide Zone Channel')), 'case 4 should fail constraint')

/** Consequence words present but scoring/rules (and rest of bundle) do not reflect skeleton scoring lines. */
const genericScoringOnly: Activity = {
    ...passActivity(),
    objective: 'Teams compete in a structured practice environment with opposed teams.',
    scoring: 'Teams earn points for fair play and effort.',
    rules: ['Teams alternate attacks each minute.', 'Coach blows to reset.'],
    constraints: ['Play safely and respect opponents.'],
    coachingFocus: ['Communicate with teammates.'],
}
const case5 = validateActivityAgainstSkeleton(genericScoringOnly, testSkeletonSlot(), 1)
assert.ok(
    case5.some((r) => r.includes('skeleton obligations') || r.includes('scoring/rules must reflect')),
    'case 5 should fail skeleton scoring tie'
)

console.log('validate-activity-skeleton unit tests: all cases passed.')
