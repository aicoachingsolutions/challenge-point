/**
 * Parser coverage tests for deriveInputConstraints.
 *
 * Field-test readiness (Christian's report): natural coaching language must not be
 * hard-rejected with "No supported soccer training signals". These cases lock in the
 * Overload (Group G), Transition (Group H), and general soccer fallback (Group Z)
 * coverage, and confirm genuinely off-topic input still rejects.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import { deriveInputConstraints } from './deriveInputConstraints'

function accepts(input: string): boolean {
    const r = deriveInputConstraints(input)
    return r.matchedSignals.length > 0 && r.candidateArchetypeIds.length > 0
}

// Natural coaching language that previously hard-rejected — must now ACCEPT.
const MUST_ACCEPT = [
    'Creating attacking numerical advantage off transition from defense to offense',
    'Creating overloads on attack',
    'Creating attacking advantage off transition',
    'counter attack quickly',
    '3v2 in the final third',
    'help players defend better',
    'create an overload',
    'transition to offense',
    'play out of the back',
    'keep possession',
]

// Off-topic input with no soccer vocabulary — must still REJECT (the fallback must not
// be so broad it accepts anything).
const MUST_REJECT = ['make a sandwich', 'paint the fence', '']

function testMustAccept(): void {
    for (const input of MUST_ACCEPT) {
        assert.ok(accepts(input), `Expected ACCEPT (natural coaching language): ${JSON.stringify(input)}`)
    }
}

function testMustReject(): void {
    for (const input of MUST_REJECT) {
        assert.ok(!accepts(input), `Expected REJECT (off-topic): ${JSON.stringify(input)}`)
    }
}

// Workstream 1 — defensive goals must fire the defensive group and route to defensive lenses,
// NOT be reinterpreted as attacking.
const DEFENSIVE_GOALS = [
    'Protecting central space in front of goal',
    'Maintaining defensive compactness near goal',
    'Helping defenders recover shape after being stretched',
    'Preventing opponents from counterattacking after losing possession',
    'Stopping attacks before they reach dangerous areas',
    'Delaying opponent counterattacks after losing possession',
    'Recovering defensive organization when outnumbered',
]
const DEFENSIVE_LENSES = new Set([
    'Space Protection Opportunity',
    'Recovery Opportunity',
    'Delay or Deny Opportunity',
    'Regain Opportunity',
])
// Attacking goals must NOT trip the defensive group (no polarity misfire the other way).
const ATTACKING_GOALS = [
    'create attacking overloads',
    'break defensive lines',
    'create better shots near goal',
    'keep possession under pressure',
    'create space for attackers',
]

function testDefensiveGoalsFireDefensiveGroupAndLenses(): void {
    // Local import avoids a top-level dependency cycle concern; generateSelection is heavy.
    const { generateSelection } = require('./../test-library') as typeof import('../test-library')
    for (const g of DEFENSIVE_GOALS) {
        const ic = deriveInputConstraints(g)
        assert.ok(
            ic.matchedSignals.some((s) => s.startsWith('signalGroup:I_defensive')),
            `Defensive goal should fire I_defensive: ${JSON.stringify(g)}`
        )
        const sel = generateSelection({ learningGoals: [g], challengeLevel: 'medium' }, ic)
        const defLensCount = sel.affordanceLenses.filter((l) => DEFENSIVE_LENSES.has(l.title)).length
        assert.ok(
            defLensCount > 0,
            `Defensive goal must select at least one defensive lens; got [${sel.affordanceLenses
                .map((l) => l.title)
                .join(', ')}] for ${JSON.stringify(g)}`
        )
    }
}

function testAttackingGoalsDoNotFireDefensiveGroup(): void {
    for (const g of ATTACKING_GOALS) {
        const ic = deriveInputConstraints(g)
        assert.ok(
            !ic.matchedSignals.some((s) => s.startsWith('signalGroup:I_defensive')),
            `Attacking goal must NOT fire I_defensive: ${JSON.stringify(g)}`
        )
    }
}

// Defensive sub-specificity: protect/compact problems must reorganize as STRUCTURE
// (Positional Play), not collapse into ball-winning (Pressing & Regain). Locks Christian's
// Round-1 follow-up complaint.
function testProtectSubtypeRoutesToStructureNotPressing(): void {
    const { generateSelection } = require('./../test-library') as typeof import('../test-library')
    for (const g of ['Protecting central space in front of goal', 'Maintaining defensive compactness near goal']) {
        const ic = deriveInputConstraints(g)
        assert.ok(
            ic.matchedSignals.includes('signalGroup:I_defensive_protect'),
            `Should classify as protect subtype: ${JSON.stringify(g)}`
        )
        const sel = generateSelection({ learningGoals: [g], challengeLevel: 'medium' }, ic)
        assert.notEqual(
            sel.archetype.game_form_name,
            'Pressing & Regain Games',
            `Protect-space goal must NOT route to Pressing & Regain; got ${sel.archetype.game_form_name} for ${JSON.stringify(g)}`
        )
    }
}

function testOverloadAndTransitionSignalsFire(): void {
    assert.ok(
        deriveInputConstraints('create an overload').matchedSignals.includes('signalGroup:G_overload'),
        'overload input should fire G_overload'
    )
    assert.ok(
        deriveInputConstraints('counter attack').matchedSignals.includes('signalGroup:H_transition'),
        'counter-attack input should fire H_transition'
    )
}

function runAll(): void {
    testMustAccept()
    testMustReject()
    testOverloadAndTransitionSignalsFire()
    testDefensiveGoalsFireDefensiveGroupAndLenses()
    testAttackingGoalsDoNotFireDefensiveGroup()
    testProtectSubtypeRoutesToStructureNotPressing()
    console.log('deriveInputConstraints unit tests: all cases passed.')
}

runAll()
