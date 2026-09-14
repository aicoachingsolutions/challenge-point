/**
 * Unit tests — Representative Performance Context Library RC1.1 loading.
 *
 * Two halves, and the second matters as much as the first. The integrity gate must PASS against the
 * real workbook — and it must demonstrably FAIL on a mutated copy for each check it claims to make. A
 * gate that has never been seen to fail is indistinguishable from one that cannot, which is the exact
 * failure mode of the four vacuous tests found in August.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'

import { sessionPlanningModel } from '../session-planning/session-planning-model'
import rpcWorkbook from './rpc-library.rc1.json'
import { rpcLibrary, validateRpcLibraryIntegrity, type PlanningRoute, type RpcWorkbook } from './rpc-library'

const REAL = rpcWorkbook as unknown as RpcWorkbook

/** Deep copy so a mutation in one test cannot leak into the next. */
const copy = (): RpcWorkbook => JSON.parse(JSON.stringify(REAL)) as RpcWorkbook

function testIntegrityGatePasses(): void {
    const result = validateRpcLibraryIntegrity()
    assert.ok(result.valid, `RPC library failed integrity: ${result.errors.slice(0, 6).join(' | ')}`)
}

function testLibraryVersionIsRc11OnTheFrozenSchema(): void {
    assert.equal(rpcLibrary.libraryVersion, 'RC1.1')
    assert.equal(rpcLibrary.schemaVersion, 'RC1', 'RC1.1 is a knowledge release; the schema stays frozen at RC1.')
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

/**
 * RC1.1 ROUTING — the gap the implementation audit found. Five Guided Learning Goals reached no
 * context, and Attack Development and Finishing were reachable from none. Christian's routing
 * decisions close both: every guided goal reaches exactly the context the Session Planning Model
 * names, and every context is reachable from some goal.
 */
function testEveryGuidedGoalReachesTheContextPlanningNames(): void {
    const goals = sessionPlanningModel.learningGoals().map((g) => String(g['ID']))
    assert.equal(goals.length, 13, 'RC1.1 declares 13 Guided Learning Goals.')

    for (const goal of goals) {
        const links = rpcLibrary.contextsForLearningGoal(goal)
        const route = sessionPlanningModel.rpcRouting().find((r) => r.learningGoalId === goal)
        assert.equal(links.length, 1, `${goal} reaches ${links.length} contexts: ${JSON.stringify(links)}`)
        assert.equal(links[0]!.rpcId, route?.rpcId, `${goal}: the workbook and Session Planning disagree`)
    }

    const reached = new Set(goals.flatMap((g) => rpcLibrary.contextsForLearningGoal(g).map((l) => l.rpcId)))
    for (const c of rpcLibrary.contexts()) assert.ok(reached.has(c.id), `${c.id} ${c.name} is reachable from no guided goal`)

    // The two goals RC1.1 added exist for the two contexts nothing reached.
    assert.deepEqual(rpcLibrary.contextsForLearningGoal('A05').map((l) => [l.rpcId, l.strength]), [['RPC-003', 'PRIMARY']])
    assert.deepEqual(rpcLibrary.contextsForLearningGoal('A06').map((l) => [l.rpcId, l.strength]), [['RPC-005', 'PRIMARY']])
}

/** "One Primary Game Form per RPC is sufficient" — so none may have zero. */
function testEveryContextHasAPrimaryGameFormInStrengthOrder(): void {
    const order = ['REQUIRED', 'PRIMARY', 'SECONDARY', 'SUPPORTING']
    for (const c of rpcLibrary.contexts()) {
        const forms = rpcLibrary.gameFormsForContext(c.id)
        assert.ok(forms.some((f) => f.strength === 'PRIMARY'), `${c.id} ${c.name} has no PRIMARY game form`)
        const ranks = forms.map((f) => order.indexOf(f.strength))
        assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `${c.id} game forms out of order`)
    }
    assert.deepEqual(
        rpcLibrary.gameFormsForContext('RPC-005').map((f) => [f.relatedId, f.strength]),
        [['GF9', 'PRIMARY'], ['GF4', 'SECONDARY'], ['GF3', 'SECONDARY']],
        'Finishing: Finishing Games primary; Transition and Positional Play secondary.'
    )
}

/**
 * Staging is never runtime knowledge. At RC1.1 every reference is either resolved or deliberately
 * DEFERRED (Christian, 13 Sep: the 43 Affordance Targets, "I do not want canonical IDs inferred simply
 * to get the RPC Library into runtime"). The resolver must have kept Christian's own notes, and agreed
 * with the Learning Goal id each of them states.
 */
function testStagingIsResolvedOrDeferredAndAuthoredNotesSurvive(): void {
    assert.deepEqual(rpcLibrary.unresolvedStaging(), [], 'RC1.1 leaves nothing awaiting a canonical id.')

    const deferred = rpcLibrary.deferredStaging()
    assert.equal(deferred.length, 43, 'The decision covers the 43 Affordance Target references.')
    assert.deepEqual([...new Set(deferred.map((r) => String(r['target_library'])))], ['AFFORDANCE'])
    for (const row of deferred) {
        assert.ok(String(row['notes'] ?? '').startsWith('Deferred by Christian'), `${String(row['mapping_id'])} is deferred without his reason`)
    }
    assert.ok(!REAL.relationships.some((r) => r['related_library'] === 'AFFORDANCE'), 'A deferred mapping must never become a relationship.')

    // Deferring removed the Standard's block on ACTIVE; it did not switch runtime on. Christian tied
    // ACTIVE to his primary scoring approval: "Once those changes are reflected and the validation
    // passes, I'm comfortable with RPC RC1.1 moving from PROPOSED to ACTIVE." Both held on 13 Sep
    // (docs/HANDOFF.md), so the workbook now says ACTIVE, and guided goals route through it. Changing
    // this back is a deliberate edit that should make this assertion fail.
    assert.equal(rpcLibrary.runtimeStatus, 'ACTIVE')
    assert.ok(REAL.registry.every((r) => r['runtime_status'] === 'ACTIVE'), 'every context carries the library status')

    const learningGoalRows = REAL.implementation_staging.filter((r) => r['target_library'] === 'LEARNING_GOAL')
    assert.equal(learningGoalRows.length, 13)
    for (const row of learningGoalRows) {
        const note = String(row['notes'] ?? '')
        assert.ok(note.startsWith('Canonical SPM ID:'), `${String(row['mapping_id'])} lost its authored note: "${note}"`)
        const statedId = note.split('Canonical SPM ID:')[1]!.split('|')[0]!.trim()
        const resolved = rpcLibrary.relationships(String(row['rpc_id']), 'LEARNING_GOAL').map((r) => r.relatedId)
        assert.ok(resolved.includes(statedId), `${String(row['mapping_id'])} states ${statedId}; resolution produced ${resolved}`)
    }
}

/** Christian's Primary Scoring Event approval, 13 Sep: seven events, eight rows, a condition each. */
function testPrimaryScoringMatchesTheApproval(): void {
    assert.deepEqual(
        rpcLibrary.scoringEvents().map((e) => e.key),
        ['goal', 'target_player', 'line_crossed', 'target_zone_entered', 'gate', 'regain', 'denial'],
        'Denial, not Held; no shot on target.'
    )
    assert.deepEqual(rpcLibrary.scoringEventsForContext('RPC-001'), ['line_crossed', 'target_zone_entered', 'gate', 'target_player'])
    assert.deepEqual(rpcLibrary.scoringEventsForContext('RPC-004'), ['target_zone_entered', 'gate', 'target_player'])
    assert.deepEqual(rpcLibrary.scoringEventsForContext('RPC-005'), ['goal'])
    assert.deepEqual(rpcLibrary.scoringEventsForContext('RPC-006'), ['goal', 'line_crossed', 'target_zone_entered', 'target_player'])
    assert.deepEqual(rpcLibrary.scoringEventsForContext('RPC-007'), ['regain', 'denial'])
    assert.deepEqual(rpcLibrary.scoringEventsForContext('RPC-008'), ['regain', 'denial'])
    for (const context of rpcLibrary.contexts()) {
        assert.ok(rpcLibrary.primaryScoringCondition(context.id).length > 0, `${context.id} has no qualifying condition`)
    }
    assert.ok(rpcLibrary.primaryScoringCondition('RPC-007').includes('5-second'), 'Counter-Press keeps the existing 5-second window.')
    assert.ok(!/\d+\s*(?:-|to)\s*\d+\s*second/i.test(rpcLibrary.primaryScoringCondition('RPC-008')), 'Attack Prevention has no fixed window.')

    // "a controlled scoring-event vocabulary used by the Invasion archetype, without yet making a broader
    // architectural ownership claim." Recorded in the workbook's Metadata, not only in a script comment.
    const scope = String(REAL.metadata['scoring_event_vocabulary_scope'] ?? '')
    assert.ok(scope.includes('GA-001') && /no broader ownership claim/i.test(scope), `vocabulary scope: "${scope}"`)
}

// ---- the gate must be able to fail ---------------------------------------------------------------

function assertFailsWith(mutate: (d: RpcWorkbook) => void, fragment: string, label: string, routes?: PlanningRoute[]): void {
    const data = copy()
    mutate(data)
    const result = validateRpcLibraryIntegrity(data, routes)
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

    assertFailsWith(
        (d) => {
            d.implementation_staging.find((r) => r['mapping_status'] === 'DEFERRED')!['notes'] = null
        },
        'no note recording why',
        'deferred without a reason'
    )

    // Primary scoring (RC1.1): events stay inside the vocabulary, and every context keeps one of each.
    assertFailsWith(
        (d) => {
            d.relationships.find((r) => r['related_library'] === 'SCORING_EVENT')!['related_id'] = 'shot_on_target'
        },
        'does not exist',
        'scoring event outside the controlled vocabulary'
    )
    assertFailsWith(
        (d) => {
            d.relationships = d.relationships.filter((r) => !(r['rpc_id'] === 'RPC-005' && r['related_library'] === 'SCORING_EVENT'))
        },
        'no SCORING_EVENT relationship',
        'context with no scoring event'
    )
    assertFailsWith(
        (d) => {
            d.properties = d.properties.filter((p) => !(p['rpc_id'] === 'RPC-006' && p['property_category'] === 'PRIMARY_SCORING_CONDITION'))
        },
        '0 PRIMARY_SCORING_CONDITION',
        'context with no qualifying condition'
    )

    // Routing agreement, both directions.
    assertFailsWith(
        (d) => {
            const link = d.relationships.find((r) => r['related_library'] === 'LEARNING_GOAL' && r['related_id'] === 'A06')!
            link['rpc_id'] = 'RPC-004'
        },
        'Session Planning routes',
        'workbook routes a goal somewhere Session Planning does not'
    )
    assertFailsWith(
        () => undefined,
        'no ACTIVE LEARNING_GOAL relationship',
        'Session Planning states a route the workbook lacks',
        [...sessionPlanningModel.rpcRouting().filter((r) => r.learningGoalId !== 'A01'), { learningGoalId: 'A01', rpcId: 'RPC-002' }]
    )
    assertFailsWith(() => undefined, 'which is not a context', 'route to a context that does not exist', [
        { learningGoalId: 'A01', rpcId: 'RPC-999' },
    ])
}

testIntegrityGatePasses()
testLibraryVersionIsRc11OnTheFrozenSchema()
testEveryContextCarriesItsIdentity()
testFinishingContextOwnsAScoringIdentityAboutGoals()
testEveryGuidedGoalReachesTheContextPlanningNames()
testEveryContextHasAPrimaryGameFormInStrengthOrder()
testStagingIsResolvedOrDeferredAndAuthoredNotesSurvive()
testPrimaryScoringMatchesTheApproval()
testGateFailsOnEachDefect()

console.log('rpc-library unit tests: all cases passed.')
