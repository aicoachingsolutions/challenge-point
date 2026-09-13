/**
 * Unit tests — Representative Performance Context Library RC1 loading.
 *
 * Two halves, and the second matters as much as the first. The integrity gate must PASS against the
 * real workbook — and it must demonstrably FAIL on a mutated copy for each check it claims to make. A
 * gate that has never been seen to fail is indistinguishable from one that cannot, which is the exact
 * failure mode of the four vacuous tests found in August.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import rpcWorkbook from './rpc-library.rc1.json'
import { rpcLibrary, validateRpcLibraryIntegrity, type RpcWorkbook } from './rpc-library'

const REAL = rpcWorkbook as unknown as RpcWorkbook

/** Deep copy so a mutation in one test cannot leak into the next. */
const copy = (): RpcWorkbook => JSON.parse(JSON.stringify(REAL)) as RpcWorkbook

function testIntegrityGatePasses(): void {
    const result = validateRpcLibraryIntegrity()
    assert.ok(result.valid, `RPC library failed integrity: ${result.errors.slice(0, 6).join(' | ')}`)
}

/** Every context carries its identity — the whole reason this layer exists. */
function testEveryContextCarriesItsIdentity(): void {
    const contexts = rpcLibrary.contexts()
    assert.equal(contexts.length, 8)
    for (const c of contexts) {
        for (const field of [
            'representativeQuestion',
            'representativePurpose',
            'primarySuccessIdentity',
            'primaryScoringIdentity',
            'coachTranslation',
        ] as const) {
            assert.ok(c[field].length > 0, `${c.id} (${c.name}) has no ${field}`)
        }
    }
}

/**
 * The motivating case. A finishing activity rewarded space exploitation because nothing owned
 * "what success represents". The Finishing context must now carry a scoring identity about goals.
 */
function testFinishingContextOwnsAScoringIdentityAboutGoals(): void {
    const finishing = rpcLibrary.contexts().find((c) => c.name === 'Finishing')
    assert.ok(finishing, 'no Finishing context')
    assert.ok(/\bgoals?\b/i.test(finishing.primaryScoringIdentity), `scoring identity: "${finishing.primaryScoringIdentity}"`)
}

/** Guided Learning Goals reach their contexts through verified relationships, strongest first. */
function testLearningGoalReachesItsContext(): void {
    const forPlayOut = rpcLibrary.contextsForLearningGoal('A01')
    assert.ok(forPlayOut.some((r) => r.rpcId === 'RPC-001' && r.strength === 'PRIMARY'), JSON.stringify(forPlayOut))
}

/** A context's compatible game forms exist and are ordered by strength. */
function testContextGameFormsAreRealAndOrdered(): void {
    const order = ['REQUIRED', 'PRIMARY', 'SECONDARY', 'SUPPORTING']
    for (const c of rpcLibrary.contexts()) {
        const forms = rpcLibrary.gameFormsForContext(c.id)
        const ranks = forms.map((f) => order.indexOf(f.strength))
        assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `${c.id} game forms out of order`)
    }
}

/** Staging is never runtime knowledge, and the library is honest that it is not ACTIVE yet. */
function testUnresolvedStagingKeepsTheLibraryProposed(): void {
    const unresolved = rpcLibrary.unresolvedStaging()
    if (unresolved.length > 0) assert.notEqual(rpcLibrary.runtimeStatus, 'ACTIVE')
    for (const row of unresolved) {
        assert.ok(
            String(row['notes'] ?? '').startsWith('Mechanical resolution:'),
            `${String(row['mapping_id'])} is unresolved without a recorded reason`
        )
    }
}

// ---- the gate must be able to fail ---------------------------------------------------------------

function assertFailsWith(mutate: (d: RpcWorkbook) => void, fragment: string, label: string): void {
    const data = copy()
    mutate(data)
    const result = validateRpcLibraryIntegrity(data)
    assert.equal(result.valid, false, `${label}: the gate did not fail`)
    assert.ok(
        result.errors.some((e) => e.includes(fragment)),
        `${label}: expected an error containing "${fragment}", got ${JSON.stringify(result.errors.slice(0, 3))}`
    )
}

function testGateFailsOnEachDefect(): void {
    assertFailsWith((d) => (d.relationships[0]!['related_id'] = 'GA-999'), 'does not exist', 'dangling relationship')
    assertFailsWith((d) => (d.relationships[0]!['related_library'] = 'NOWHERE'), 'cannot verify', 'unknown library')
    assertFailsWith((d) => (d.relationships[0]!['provenance'] = null), 'no provenance', 'missing provenance')
    assertFailsWith((d) => (d.statements[0]!['statement_type'] = 'INVENTED_TYPE'), 'outside controlled vocabulary', 'bad vocabulary')
    assertFailsWith(
        (d) => (d.statements = d.statements.filter((s) => !(s['rpc_id'] === 'RPC-005' && s['statement_type'] === 'PRIMARY_SCORING_IDENTITY'))),
        'PRIMARY_SCORING_IDENTITY',
        'missing identity statement'
    )
    assertFailsWith((d) => (d.transitions[0]!['to_rpc'] = 'RPC-999'), 'is not a context', 'dangling transition')
    assertFailsWith((d) => (d.metadata['canonical_rpc_count'] = 9), 'Metadata declares 9', 'declared count')
    assertFailsWith((d) => (d.metadata['workbook_schema_version'] = 'RC2'), 'supports "RC1"', 'schema version')
    assertFailsWith((d) => (d.registry[1]!['rpc_id'] = d.registry[0]!['rpc_id']), 'repeats identifier', 'duplicate id')
    assertFailsWith(
        (d) => {
            d.metadata['runtime_status'] = 'ACTIVE'
            d.implementation_staging[0]!['mapping_status'] = 'NEEDS_CANONICAL_ID'
        },
        'claims ACTIVE',
        'active with unresolved staging'
    )
}

testIntegrityGatePasses()
testEveryContextCarriesItsIdentity()
testFinishingContextOwnsAScoringIdentityAboutGoals()
testLearningGoalReachesItsContext()
testContextGameFormsAreRealAndOrdered()
testUnresolvedStagingKeepsTheLibraryProposed()
testGateFailsOnEachDefect()

console.log('rpc-library unit tests: all cases passed.')
