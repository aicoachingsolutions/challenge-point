/**
 * Unit tests — canonical Affordance Target Matrix (ATM package 2026-07-15) + shadow-mode Resolved
 * ATPs (RAS Stage 3). Pins: matrix content matches the package's §8/§9 verbatim (11 Game Problems ×
 * 4 Canonical Affordance Representations); profile resolution maps signal groups to canonical Game
 * Problems with a primary; multi-problem merge keeps the strongest necessity; unmapped groups are
 * reported, never guessed; resolution is deterministic; the profile rides the selection trace in
 * shadow with version stamps.
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import {
    AFFORDANCE_TARGET_MATRIX,
    CANONICAL_AFFORDANCES,
    resolveAffordanceTargetProfile,
} from './affordance-target-matrix'
import { generateSelection } from '../test-library/generateSelection'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'

function testMatrixMatchesCanonicalPackage(): void {
    assert.equal(Object.keys(AFFORDANCE_TARGET_MATRIX).length, 11, 'Canonical registry defines exactly 11 Game Problems.')
    assert.equal(CANONICAL_AFFORDANCES.length, 4)
    for (const [gp, row] of Object.entries(AFFORDANCE_TARGET_MATRIX)) {
        for (const aff of CANONICAL_AFFORDANCES) assert.ok(row[aff], `${gp} must rate ${aff}.`)
    }
    // §9 spot-pins.
    assert.equal(AFFORDANCE_TARGET_MATRIX['Maintain Possession']['Support Availability'], 'Essential')
    assert.equal(AFFORDANCE_TARGET_MATRIX['Protect Space']['Functional Object Interaction'], 'Not Required')
    assert.equal(AFFORDANCE_TARGET_MATRIX['Recover Organization']['Competitive Interaction Opportunity'], 'Supportive')
    assert.equal(AFFORDANCE_TARGET_MATRIX['Transition Defense']['Support Availability'], 'Essential')
    assert.equal(AFFORDANCE_TARGET_MATRIX['Delay Progression']['Functional Object Interaction'], 'Supportive')
    // Every Game Problem requires an Open Pathway in RC1.
    for (const [gp, row] of Object.entries(AFFORDANCE_TARGET_MATRIX)) {
        assert.equal(row['Open Pathway'], 'Essential', `${gp}: Open Pathway is Essential across the RC1 registry.`)
    }
}

function testProfileResolutionAndMerge(): void {
    const possession = resolveAffordanceTargetProfile(['signalGroup:F_possession_passing'])
    assert.equal(possession.primaryGameProblem, 'Maintain Possession')
    assert.equal(possession.targets['Competitive Interaction Opportunity'], 'Essential')
    assert.equal(possession.mode, 'shadow')

    // Recover-shape goals → Recover Organization row (FOI Not Required must survive as-is).
    const recover = resolveAffordanceTargetProfile(['signalGroup:I_defensive_recover'])
    assert.equal(recover.primaryGameProblem, 'Recover Organization')
    assert.equal(recover.targets['Functional Object Interaction'], 'Not Required')

    // Merge: Protect Space (FOI Not Required) + possession (FOI Essential) → strongest necessity wins.
    const merged = resolveAffordanceTargetProfile(['signalGroup:I_defensive_protect', 'signalGroup:F_possession_passing'])
    assert.equal(merged.primaryGameProblem, 'Protect Space', 'First mapped Game Problem is primary.')
    assert.equal(merged.targets['Functional Object Interaction'], 'Essential', 'Strongest necessity must win the merge.')

    // Unmapped groups are reported, not guessed.
    const fallback = resolveAffordanceTargetProfile(['signalGroup:Z_soccer_general'])
    assert.equal(fallback.primaryGameProblem, null)
    assert.deepEqual(fallback.unmappedSignalGroups, ['signalGroup:Z_soccer_general'])

    // Determinism.
    assert.deepEqual(
        resolveAffordanceTargetProfile(['signalGroup:G_overload']),
        resolveAffordanceTargetProfile(['signalGroup:G_overload'])
    )
    // Overload now maps to its own canonical Game Problem.
    assert.equal(resolveAffordanceTargetProfile(['signalGroup:G_overload']).primaryGameProblem, 'Create Numerical Advantage')
}

function testProfileRidesSelectionTraceInShadow(): void {
    const goal = 'keep possession in tight spaces under pressure'
    const hints = deriveInputConstraints(goal)
    const selection = generateSelection({ learningGoals: [goal], challengeLevel: 'medium' }, hints)
    const profile = selection.selectionTrace.affordanceTargetProfile as { mode?: string; primaryGameProblem?: string | null }
    assert.ok(profile, 'Selection trace must carry the resolved Affordance Target Profile.')
    assert.equal(profile.mode, 'shadow')
    assert.ok(profile.primaryGameProblem, 'Possession goal should resolve a primary canonical Game Problem.')
    assert.ok(selection.selectionTrace.versions?.knowledgeCore, 'Trace must stamp the Knowledge Core version.')
    assert.ok(selection.selectionTrace.versions?.reasoningEngine, 'Trace must stamp the engine version.')
}

function runAll(): void {
    testMatrixMatchesCanonicalPackage()
    testProfileResolutionAndMerge()
    testProfileRidesSelectionTraceInShadow()
    console.log('affordance-target-matrix unit tests: all cases passed.')
}

runAll()
