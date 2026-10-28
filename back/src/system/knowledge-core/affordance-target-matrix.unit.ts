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
    ATM_METADATA_ROWS,
    AtmMetadataRow,
    CANONICAL_AFFORDANCE_DEFINITIONS,
    CANONICAL_AFFORDANCES,
    affordanceDefinitionsFrom,
    gameProblemKeyedMetadataRows,
    gameProblemKeyedMetadataRowsFrom,
    metadataRowsAgreeingWith,
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

/**
 * The workbook's notes, read through the loader (item B1): the four affordance definitions
 * verbatim from Version Metadata D29-D32, and the per-Game-Problem notes D38 (GP-004) and D39 (GP-015). Until B1
 * the projection dropped them; atm-workbook-projection.unit.ts proves they are carried, this proves they are READ.
 */
function testWorkbookNotesAreReadThroughTheLoader(): void {
    assert.equal(CANONICAL_AFFORDANCE_DEFINITIONS['Support Availability'], 'Is coordinated interaction with another performer available?')
    assert.equal(CANONICAL_AFFORDANCE_DEFINITIONS['Functional Object Interaction'], 'Can meaningful interaction with the task object be established?')
    assert.equal(CANONICAL_AFFORDANCE_DEFINITIONS['Open Pathway'], 'Is a functional route available for performer or object interaction?')
    assert.equal(
        CANONICAL_AFFORDANCE_DEFINITIONS['Competitive Interaction Opportunity'],
        'Is an opportunity available for direct or indirect adaptive competitor influence that can alter, constrain, contest, or disrupt developing interaction?'
    )
    assert.deepEqual(Object.keys(CANONICAL_AFFORDANCE_DEFINITIONS).sort(), [...CANONICAL_AFFORDANCES].sort())
    assert.ok(Object.isFrozen(CANONICAL_AFFORDANCE_DEFINITIONS), 'the definitions are read-only')

    assert.deepEqual(gameProblemKeyedMetadataRows('GP-015'), [
        { key: 'gp015_validation_flag', value: 'SA=E retained', notes: 'Direct legacy migration retained; field validation recommended.' },
    ])
    assert.deepEqual(gameProblemKeyedMetadataRows('GP-004'), [
        { key: 'gp004_audit_decision', value: 'SA=S', notes: 'Recover Position is performer-level; collective support is supportive rather than identity-defining.' },
    ])
    // Empty means only that no Version Metadata KEY names GP-001: the workbook still speaks of it elsewhere (B1 review).
    assert.deepEqual(gameProblemKeyedMetadataRows('GP-001'), [], 'no Version Metadata key names GP-001')
    assert.match(String(ATM_METADATA_ROWS.find((row) => row.metadata_key === 'legacy_direct_transfers')?.notes), /GP-001/, 'D41 names GP-001 in a note')
    assert.ok(Object.isFrozen(gameProblemKeyedMetadataRows('GP-015')) && Object.isFrozen(gameProblemKeyedMetadataRows('GP-015')[0]))

    assert.equal(ATM_METADATA_ROWS.length, 41, 'Version Metadata rows 4-44')
    assert.equal(ATM_METADATA_ROWS.find((row) => row.metadata_key === 'gp015_validation_flag')?.required, false)
    assert.ok(Object.isFrozen(ATM_METADATA_ROWS) && ATM_METADATA_ROWS.every((row) => Object.isFrozen(row)))

    // The load-time gates refuse damaged rows rather than return a partial set.
    const rows = ATM_METADATA_ROWS.map((row) => ({ ...row })) as AtmMetadataRow[]
    const without = (key: string) => rows.filter((row) => row.metadata_key !== key)
    assert.throws(() => affordanceDefinitionsFrom(without('car_sa_definition')), /no definition of Support Availability/)
    const noNote = rows.map((row) => (row.metadata_key === 'car_sa_definition' ? { ...row, notes: undefined } : row))
    assert.throws(() => affordanceDefinitionsFrom(noNote), /car_sa_definition carries no definition/)
    assert.throws(() => affordanceDefinitionsFrom([...rows, { metadata_key: 'car_xx_definition', metadata_value: 'Something Else', notes: 'x' }]), /not a canonical affordance/)
    assert.throws(() => affordanceDefinitionsFrom([...rows, { metadata_key: 'car_sx_definition', metadata_value: 'Support Availability', notes: 'x' }]), /Support Availability is defined twice/)
    assert.throws(() => gameProblemKeyedMetadataRowsFrom([...rows, { metadata_key: 'gp099_flag', metadata_value: 'x' }], ['GP-004', 'GP-015']), /GP-099, which the Game Problem register lacks/)

    // The rows and the long-standing metadata map must name the same keys, each once, with the same values (B1 review:
    // a copy of resource_name in place of status_codes used to pass, because only the lengths and lookups were compared).
    const map = Object.fromEntries(rows.map((row) => [row.metadata_key, row.metadata_value]))
    assert.equal(metadataRowsAgreeingWith(rows, map).length, 41, 'the committed rows and map agree')
    const resourceName = rows.find((row) => row.metadata_key === 'resource_name')!
    const swapped = rows.map((row) => (row.metadata_key === 'status_codes' ? { ...resourceName } : row))
    assert.throws(() => metadataRowsAgreeingWith(swapped, map), /metadataRows names "resource_name" twice/)
    assert.throws(() => metadataRowsAgreeingWith([...rows, { ...resourceName }], map), /metadataRows names "resource_name" twice/)
    assert.throws(() => metadataRowsAgreeingWith(without('status_codes'), map), /metadata names "status_codes", which metadataRows lacks/)
    assert.throws(() => metadataRowsAgreeingWith([...rows, { metadata_key: 'extra_key', metadata_value: 'x' }], map), /metadataRows names "extra_key", which metadata lacks/)
    assert.throws(() => metadataRowsAgreeingWith(rows, { ...map, resource_status: 'Candidate' }), /metadata "resource_status" differs between metadataRows and metadata/)
    assert.throws(() => metadataRowsAgreeingWith(undefined, map), /carries no metadataRows/)
}

function runAll(): void {
    testMatrixMatchesCanonicalRegister()
    testCompositeRuntimeResolution()
    testProfileRidesSelectionTraceInShadow()
    testWorkbookNotesAreReadThroughTheLoader()
    console.log('affordance-target-matrix unit tests: all cases passed.')
}

runAll()
