/**
 * Unit tests — Affordance Target Matrix + shadow-mode Resolved Affordance Target Profiles (RAS RC1
 * Stage 3, Milestones 1–2). Pins: matrix content matches Christian's RC1 table verbatim; profile
 * resolution maps signal groups to canonical Game Problems; multi-problem merge keeps the strongest
 * rating; unmapped groups are reported, never guessed; resolution is deterministic; and the profile
 * rides the selection trace WITHOUT changing selection (shadow equivalence is separately guarded by
 * the pipeline-score check).
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

function testMatrixMatchesRc1Table(): void {
    assert.equal(Object.keys(AFFORDANCE_TARGET_MATRIX).length, 7, 'RC1 matrix defines exactly 7 Game Problems.')
    for (const [gp, row] of Object.entries(AFFORDANCE_TARGET_MATRIX)) {
        for (const aff of CANONICAL_AFFORDANCES) {
            assert.ok(row[aff], `${gp} must rate ${aff}.`)
        }
    }
    // Spot-pins straight from Christian's table.
    assert.equal(AFFORDANCE_TARGET_MATRIX['Progress the Object']['Interception Opportunity'], 'Opposition Essential')
    assert.equal(AFFORDANCE_TARGET_MATRIX['Protect Space']['Interception Opportunity'], 'Essential')
    assert.equal(AFFORDANCE_TARGET_MATRIX['Prevent Progress']['Support Availability'], 'Contextual')
    assert.equal(AFFORDANCE_TARGET_MATRIX['Maintain Possession']['Open Pathway'], 'Essential')
}

function testProfileResolutionAndMerge(): void {
    // Possession goal → Maintain Possession row verbatim.
    const possession = resolveAffordanceTargetProfile(['signalGroup:F_possession_passing'])
    assert.deepEqual(possession.gameProblems, ['Maintain Possession'])
    assert.equal(possession.targets['Interception Opportunity'], 'Opposition Essential')
    assert.equal(possession.mode, 'shadow')

    // Possession + pressing co-fire → merge keeps the STRONGEST rating per affordance:
    // Interception Opportunity is Opposition Essential (poss.) vs Essential (regain) → Essential wins.
    const merged = resolveAffordanceTargetProfile(['signalGroup:F_possession_passing', 'signalGroup:E_regain_pressing'])
    assert.ok(merged.gameProblems.includes('Regain Possession'))
    assert.equal(merged.targets['Interception Opportunity'], 'Essential', 'Strongest rating must win the merge.')
    assert.equal(merged.targets['Open Pathway'], 'Essential')

    // Unmapped groups are reported, not guessed.
    const fallback = resolveAffordanceTargetProfile(['signalGroup:Z_soccer_general'])
    assert.deepEqual(fallback.gameProblems, [])
    assert.deepEqual(fallback.unmappedSignalGroups, ['signalGroup:Z_soccer_general'])

    // Determinism.
    assert.deepEqual(
        resolveAffordanceTargetProfile(['signalGroup:G_overload']),
        resolveAffordanceTargetProfile(['signalGroup:G_overload'])
    )
}

function testProfileRidesSelectionTraceInShadow(): void {
    const goal = 'keep possession in tight spaces under pressure'
    const hints = deriveInputConstraints(goal)
    const selection = generateSelection({ learningGoals: [goal], challengeLevel: 'medium' }, hints)
    const profile = selection.selectionTrace.affordanceTargetProfile as { mode?: string; gameProblems?: string[] }
    assert.ok(profile, 'Selection trace must carry the resolved Affordance Target Profile.')
    assert.equal(profile.mode, 'shadow')
    assert.ok((profile.gameProblems ?? []).length > 0, 'Possession goal should resolve canonical Game Problems.')
    assert.ok(selection.selectionTrace.versions?.knowledgeCore, 'Trace must stamp the Knowledge Core version.')
    assert.ok(selection.selectionTrace.versions?.reasoningEngine, 'Trace must stamp the engine version.')
}

function runAll(): void {
    testMatrixMatchesRc1Table()
    testProfileResolutionAndMerge()
    testProfileRidesSelectionTraceInShadow()
    console.log('affordance-target-matrix unit tests: all cases passed.')
}

runAll()
