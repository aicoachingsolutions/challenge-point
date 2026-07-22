/**
 * Unit tests — CAR Matrix RC1.2 (canonical register alignment) + shadow-mode Resolved ATPs.
 * Pins: workbook loads keyed to the 17 canonical GP-IDs (68 cells, codes E/S/NR, no Contextual);
 * §9 spot values incl. the RC1.2 audit change (Recover Position SA E→S); Composite Runtime
 * resolution (Primary + zero-or-one Secondary, merge by strongest necessity, unmapped reported);
 * determinism; the profile rides the selection trace in shadow with version stamps.
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import {
    AFFORDANCE_TARGET_MATRIX,
    AFFORDANCE_TARGET_MATRIX_BY_ID,
    AFFORDANCE_TARGET_MATRIX_VERSION,
    CANONICAL_AFFORDANCES,
    resolveAffordanceTargetProfile,
} from './affordance-target-matrix'
import { generateSelection } from '../test-library/generateSelection'
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'

function testMatrixMatchesCanonicalRegister(): void {
    assert.equal(Object.keys(AFFORDANCE_TARGET_MATRIX_BY_ID).length, 17, 'RC1.2 = 17 canonical Game Problems.')
    assert.equal(CANONICAL_AFFORDANCES.length, 4)
    assert.ok(AFFORDANCE_TARGET_MATRIX_VERSION.compatibleGameProblemRegister.includes('Game Problem Canonical Register'))
    for (const [id, row] of Object.entries(AFFORDANCE_TARGET_MATRIX_BY_ID)) {
        assert.ok(/^GP-\d{3}$/.test(id), `Keyed by canonical GP-ID: ${id}`)
        for (const aff of CANONICAL_AFFORDANCES) assert.ok(row[aff], `${id} must rate ${aff}.`)
    }
    // §ratings spot-pins (by GP-ID).
    assert.equal(AFFORDANCE_TARGET_MATRIX_BY_ID['GP-015']['Support Availability'], 'Essential') // Maintain Possession
    assert.equal(AFFORDANCE_TARGET_MATRIX_BY_ID['GP-012']['Functional Object Interaction'], 'Not Required') // Protect Space
    // RC1.2 horizontal-audit change: Recover Position SA revised Essential -> Supportive.
    assert.equal(AFFORDANCE_TARGET_MATRIX_BY_ID['GP-004']['Support Availability'], 'Supportive')
    // CIO is Essential for every canonical Game Problem (representative competitive opposition).
    for (const [id, row] of Object.entries(AFFORDANCE_TARGET_MATRIX_BY_ID)) {
        assert.equal(row['Competitive Interaction Opportunity'], 'Essential', `${id}: CIO Essential across the register.`)
    }
    // Object-control problems rate Open Pathway Supportive (not Essential) — an RC1.2 distinction.
    assert.equal(AFFORDANCE_TARGET_MATRIX_BY_ID['GP-006']['Open Pathway'], 'Supportive')
    // Name index resolves to the same ratings as the GP-ID index.
    assert.deepEqual(AFFORDANCE_TARGET_MATRIX['Maintain Possession'], AFFORDANCE_TARGET_MATRIX_BY_ID['GP-015'])
}

function testCompositeRuntimeResolution(): void {
    // Possession goal → Primary GP-015, no secondary.
    const poss = resolveAffordanceTargetProfile(['signalGroup:F_possession_passing'])
    assert.equal(poss.primaryGameProblemId, 'GP-015')
    assert.equal(poss.primaryGameProblem, 'Maintain Possession')
    assert.equal(poss.secondaryGameProblemId, null)
    assert.equal(poss.mode, 'shadow')

    // Two co-firing groups → Primary + Secondary (RC1 caps at one secondary); merge strongest.
    const merged = resolveAffordanceTargetProfile(['signalGroup:I_defensive_protect', 'signalGroup:F_possession_passing'])
    assert.equal(merged.primaryGameProblemId, 'GP-012') // Protect Space (first = most specific)
    assert.equal(merged.secondaryGameProblemId, 'GP-015') // Maintain Possession
    // Protect Space FOI=NR, Maintain Possession FOI=E → strongest necessity wins.
    assert.equal(merged.targets['Functional Object Interaction'], 'Essential')

    // A third co-firing group is dropped (RC1: zero-or-one secondary), but all ids are recorded.
    const triple = resolveAffordanceTargetProfile([
        'signalGroup:I_defensive_protect',
        'signalGroup:F_possession_passing',
        'signalGroup:E_regain_pressing',
    ])
    assert.equal(triple.secondaryGameProblemId, 'GP-015')
    assert.ok(triple.gameProblemIds.includes('GP-016'), 'All resolved GP ids retained even beyond the RC1 cap.')

    // Unmapped groups reported, not guessed.
    const fb = resolveAffordanceTargetProfile(['signalGroup:Z_soccer_general'])
    assert.equal(fb.primaryGameProblemId, null)
    assert.deepEqual(fb.unmappedSignalGroups, ['signalGroup:Z_soccer_general'])

    // Determinism.
    assert.deepEqual(
        resolveAffordanceTargetProfile(['signalGroup:G_overload']),
        resolveAffordanceTargetProfile(['signalGroup:G_overload'])
    )
    assert.equal(resolveAffordanceTargetProfile(['signalGroup:G_overload']).primaryGameProblemId, 'GP-005') // Gain Access
}

function testProfileRidesSelectionTraceInShadow(): void {
    const goal = 'keep possession in tight spaces under pressure'
    const selection = generateSelection({ learningGoals: [goal], challengeLevel: 'medium' }, deriveInputConstraints(goal))
    const profile = selection.selectionTrace.affordanceTargetProfile as { mode?: string; primaryGameProblemId?: string | null }
    assert.ok(profile, 'Selection trace must carry the resolved Affordance Target Profile.')
    assert.equal(profile.mode, 'shadow')
    assert.ok(profile.primaryGameProblemId, 'Possession goal should resolve a primary canonical Game Problem.')
    assert.ok(selection.selectionTrace.versions?.knowledgeCore, 'Trace must stamp the Knowledge Core version.')
}

function runAll(): void {
    testMatrixMatchesCanonicalRegister()
    testCompositeRuntimeResolution()
    testProfileRidesSelectionTraceInShadow()
    console.log('affordance-target-matrix unit tests: all cases passed.')
}

runAll()
