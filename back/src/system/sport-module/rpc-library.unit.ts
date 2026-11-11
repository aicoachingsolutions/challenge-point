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
import fs from 'node:fs'
import path from 'node:path'

import { exampleClauses } from '../derivation/example-clauses'
import { AUDITS_DIR } from '../derivation/knowledge-root'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { CellValue, openWorkbook, projectSheet } from '../session-planning/workbook-projection'
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

/**
 * **The reconciliation record cites only rows that exist** (stage H3, 15 October 2026). His 16 October reply, item 1,
 * asked for *"a focused reconciliation of the missing items"* with the workbook as the executable authority; the record
 * (`docs/audits/rpc-001-document-workbook-reconciliation-2026-10-16.md`) points at workbook rows to say where each
 * document item is or is not carried. A pointer to a row that is not in the workbook would be a reconciliation by
 * assertion, so every RPC row id it cites (ranges by their two ends) is checked against the loaded workbook.
 */
function testReconciliationRecordCitesOnlyRowsThatExist(): void {
    // Read with its line breaks folded to spaces, so a quotation wrapped across lines reads as he wrote it.
    const record = fs.readFileSync(path.join(AUDITS_DIR, 'rpc-001-document-workbook-reconciliation-2026-10-16.md'), 'utf8').split(/\s+/).join(' ')
    const cited = new Set(record.match(/RPC-(PROP|ID|REL|VAL|TR|STMT|MAP)-\d+/g) ?? [])
    const library = JSON.stringify(REAL)
    assert.ok(cited.size >= 30, `the record cites its rows (${cited.size})`)
    for (const id of cited) assert.ok(library.includes(`"${id}"`), `${id} is cited by the reconciliation record and is not in the workbook`)
    // The omission he asked to be recorded is recorded, with his words.
    assert.ok(record.includes('The third build-out origin described in RC1.1 can remain outside the first implementation, as you recommend, while its workbook omission is recorded for reconciliation.'))
    assert.ok(record.includes('**521 cells, 0 differences**'))
}

// ---- the canonical correction of 11 November 2026 -------------------------------------------------------------
//
// Christian's reply received 11 November 2026, item 1: "I approve the canonical workbook correction." (received 11 November
// 2026). Item 3 asks for targeted checks; these four answer two of them: "The workbook now matches the verified September 13
// source." and "The corrected clause remains illustrative rather than mandatory." (received 11 November 2026). The workbook
// is canonical and the library its projection, so each is proved where a consumer reads it: the workbook cell itself, the
// library the engine imports, the generator that would write the cell again, and Christian's own words of 13 September.

const RPC_WORKBOOK = path.resolve(__dirname, '../../../data/sport-modules/soccer/rpc-workbook.rc1.1.xlsm')
const SCORING_GENERATOR = path.resolve(__dirname, '../../../data/sport-modules/soccer/apply-rpc-scoring-events.py')

/** RPC-PROP-134, Attack Development's PRIMARY_SCORING_CONDITION, as corrected on 11 November 2026 (Properties!D135). */
const ATTACK_DEVELOPMENT_CONDITION =
    "Purposeful advancement from the attack's starting condition rather than possession alone—for example, reaching a more advanced representative area while maintaining attacking possession."

/**
 * The words that govern each PRIMARY_SCORING_CONDITION row: Christian's email of 13 September 2026 (received 13 September 2026),
 * verbatim as filed in the sources repository (sources/2026-09-13-scoring-approval/originals/christian-scoring-approval-email.txt),
 * each with its line there. Which sentences govern which row is our mapping, for review. Line 42 gives its first sentence only:
 * its "such as:" opens Chance Creation's list of events, which the relationship rows carry, not RPC-PROP-135.
 */
const SEPTEMBER_13_GOVERNING_WORDS: Record<string, { line: number; words: string }[]> = {
    'RPC-PROP-132': [
        {
            line: 19,
            words: 'The qualifying condition should preserve the build-out identity: initiated from the goalkeeper or controlled defensive restart, progressing beyond the initial pressure/progression line, with possession controlled on arrival. A long clearance that happens to reach the target should not satisfy the event.',
        },
    ],
    'RPC-PROP-133': [
        {
            line: 28,
            words: 'The condition distinguishes the Context: the sequence begins under established coordinated pressure, the event occurs beyond the pressing line, and the attacking team retains possession through the next action.',
        },
    ],
    'RPC-PROP-134': [
        {
            line: 38,
            words: 'The qualifying condition should require purposeful advancement from the attack’s starting condition rather than possession alone—for example, reaching a more advanced representative area while maintaining attacking possession.',
        },
    ],
    'RPC-PROP-135': [
        { line: 39, words: 'Chance Creation — keep the proposed finishing-zone/controlled-arrival approach rather than adding shot on target.' },
        { line: 42, words: 'Chance Creation should end when the meaningful scoring opportunity has been created.' },
        { line: 48, words: 'with live defensive opposition as part of the qualifying condition.' },
    ],
    'RPC-PROP-136': [{ line: 55, words: 'Where the realization includes a goalkeeper, the goalkeeper should remain active as part of the representative condition.' }],
    'RPC-PROP-137': [{ line: 65, words: 'These count only within the representative transition window following the regain.' }],
    'RPC-PROP-138': [
        { line: 71, words: 'Denial = a specified opponent progression event does not occur before the stated defensive condition is satisfied.' },
        {
            line: 73,
            words: 'The opponent does not cross the specified progression line or enter the specified progression zone within the Counter-Press window following possession loss.',
        },
        {
            line: 74,
            words: 'I’m comfortable using the existing 5-second Counter-Press Window here since that timing already exists in the knowledge rather than being invented for this scoring layer.',
        },
    ],
    'RPC-PROP-139': [
        {
            line: 85,
            words: 'The opponent is prevented from crossing the specified progression line, entering the protected zone, or reaching the realized attacking objective during the attacking sequence.',
        },
        { line: 86, words: 'A particular realization can still use time where appropriate, but I would not make time intrinsic to the Attack Prevention Context.' },
    ],
}

/** The sheets project-rpc-workbook.py projects, with their keys in the library; Metadata, the tenth, is read below. */
const PROJECTED_TABLES: [string, string][] = [
    ['Registry', 'registry'],
    ['Statements', 'statements'],
    ['Relationships', 'relationships'],
    ['Properties', 'properties'],
    ['Identity Rules', 'identity_rules'],
    ['Context Transitions', 'transitions'],
    ['Validation Rules', 'validation_rules'],
    ['Controlled Vocabulary', 'controlled_vocabulary'],
    ['Implementation Staging', 'implementation_staging'],
]

/**
 * **C0. The committed library is the committed workbook's projection.** `project-rpc-workbook.py` writes the library from the
 * workbook ("Never hand-edit the JSON — regenerate it."), and until 11 November 2026 nothing compared the two: an edit to either
 * alone passed every check. Read by `workbook-projection.ts`'s reader under project-rpc-workbook.py's rules (header row 1, all-blank
 * rows skipped, every headed column kept, strings stripped and blank ones null), each of the nine sheets equals the library's table.
 * Metadata holds boolean cells, which that reader refuses rather than guesses; it is pinned as refused, so a reader that learns
 * booleans brings it in.
 */
function testCommittedLibraryIsTheWorkbookProjection(): void {
    const workbook = openWorkbook(fs.readFileSync(RPC_WORKBOOK))
    const clean = (value: CellValue): CellValue => (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value)
    for (const [sheet, key] of PROJECTED_TABLES) {
        const projected = projectSheet(workbook.cells(sheet)).map((row) => Object.fromEntries(Object.entries(row).map(([column, value]) => [column, clean(value)])))
        assert.deepEqual(projected, (REAL as unknown as Record<string, unknown>)[key], `the library's ${key} must be exactly the workbook's ${sheet} sheet projected`)
    }
    assert.throws(() => workbook.cells('Metadata'), /has cell type "b"/, 'Metadata: its boolean cells are refused by the reader, so it is not compared here')
}

/**
 * **C1a. The workbook now holds the 13 September wording, and so does the library.** Properties!D135 (RPC-PROP-134) reads the
 * corrected text, its provenance (G135) is unchanged, the library's getter returns it, and from "rather than" on it is Christian's
 * 13 September sentence exactly, em dash and "for example," included.
 */
function testAttackDevelopmentConditionIsTheSeptember13Wording(): void {
    const properties = openWorkbook(fs.readFileSync(RPC_WORKBOOK)).cells('Properties')
    const rows = [...properties.entries()].filter(([, cells]) => cells.get(1) === 'RPC-PROP-134')
    assert.deepEqual(rows.map(([row]) => row), [135], 'RPC-PROP-134 is row 135 of Properties, once')
    const [[, cells]] = rows
    assert.equal(cells.get(4), ATTACK_DEVELOPMENT_CONDITION, 'Properties!D135 holds the corrected wording')
    assert.equal(cells.get(7), 'Christian, 2026-09-13: Primary Scoring Event approval (RC1.1)', 'Properties!G135, the provenance, is unchanged')
    assert.equal(rpcLibrary.primaryScoringCondition('RPC-003'), ATTACK_DEVELOPMENT_CONDITION, 'the library the engine imports carries it')
    const tail = (text: string): string => text.slice(text.indexOf('rather than possession alone'))
    assert.equal(tail(ATTACK_DEVELOPMENT_CONDITION), tail(SEPTEMBER_13_GOVERNING_WORDS['RPC-PROP-134'][0].words), 'from "rather than" on, the row is the 13 September sentence exactly')
}

/** Each example a text gives, as its marker and the first four words it introduces; curly apostrophes and quotation marks made straight. */
function examplesGiven(text: string): string[] {
    const straight = text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    return exampleClauses(straight)
        .map(({ marker, clause }) => `${marker} | ${(clause.toLowerCase().match(/[a-z][a-z'-]*/g) ?? []).slice(0, 4).join(' ')}`)
        .sort()
}

/**
 * **C1b. An example Christian gave stays an example in the row, and the row gives none Christian did not.** The colon of
 * 13 September turned "—for example, reaching …" into a definition; this compares, for each of the eight condition rows, the
 * examples its governing words give (marker and the words it introduces) with the examples the row gives, both ways. The colon
 * is never read as a marker: Christian's line 19 uses one to introduce required conditions.
 */
function testExamplesSurviveTranscription(): void {
    const rows = REAL.properties.filter((row) => row['property_category'] === 'PRIMARY_SCORING_CONDITION')
    assert.deepEqual(rows.map((row) => String(row['property_id'])).sort(), Object.keys(SEPTEMBER_13_GOVERNING_WORDS).sort(), 'the eight condition rows, each with its governing words')
    const failures: string[] = []
    for (const row of rows) {
        const id = String(row['property_id'])
        const governing = SEPTEMBER_13_GOVERNING_WORDS[id]
        const given = examplesGiven(governing.map((entry) => entry.words).join(' '))
        const transcribed = examplesGiven(String(row['property_text']))
        if (JSON.stringify(given) !== JSON.stringify(transcribed)) {
            failures.push(`${id}: the 13 September email (line ${governing.map((entry) => entry.line).join(', ')}) gives ${JSON.stringify(given)} as examples; the row gives ${JSON.stringify(transcribed)}`)
        }
    }
    assert.deepEqual(failures, [], 'every example of the 13 September email survives in its row, and no row adds one')
}

/** **C1c. The generator would write the corrected wording again**, so a rerun cannot bring the colon back (and does not stop on the corrected cell). */
function testGeneratorCarriesTheCorrectedCondition(): void {
    const generator = fs.readFileSync(SCORING_GENERATOR, 'utf8')
    assert.ok(generator.includes('possession alone—for example, reaching '), 'apply-rpc-scoring-events.py writes "—for example,"')
    assert.ok(!generator.includes('possession alone: reaching'), 'apply-rpc-scoring-events.py no longer writes the colon')
    const literal = generator.match(/"RPC-003": "([^"]*)"\s*\r?\n\s*"([^"]*)"/)
    assert.ok(literal, 'the RPC-003 condition is two string literals in apply-rpc-scoring-events.py')
    assert.equal(literal[1] + literal[2], ATTACK_DEVELOPMENT_CONDITION, 'its two literals join to the corrected row exactly')
}

testIntegrityGatePasses()
testReconciliationRecordCitesOnlyRowsThatExist()
testLibraryVersionIsRc11OnTheFrozenSchema()
testEveryContextCarriesItsIdentity()
testFinishingContextOwnsAScoringIdentityAboutGoals()
testEveryGuidedGoalReachesTheContextPlanningNames()
testEveryContextHasAPrimaryGameFormInStrengthOrder()
testStagingIsResolvedOrDeferredAndAuthoredNotesSurvive()
testPrimaryScoringMatchesTheApproval()
testCommittedLibraryIsTheWorkbookProjection()
testAttackDevelopmentConditionIsTheSeptember13Wording()
testExamplesSurviveTranscription()
testGeneratorCarriesTheCorrectedCondition()
testGateFailsOnEachDefect()

console.log('rpc-library unit tests: all cases passed.')
