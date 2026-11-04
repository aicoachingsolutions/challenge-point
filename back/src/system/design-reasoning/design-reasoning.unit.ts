/**
 * Unit tests — design-reasoning Stage 1 (Steps 1 and 2), review pathway only.
 *
 * The acceptance checks of the development proposal (section D) that Steps 1 and 2 can answer, as Christian approved them in his reply of
 * 3 November 2026 (item 10: *"I support your ten proposed acceptance checks, including the wording-invariance and knowledge-mutation
 * tests."*), plus his added test on a goal the stage was not developed on:
 *   - check 1: each resolution cites the approved translation (or his scoped ruling) and the routing; no keyword inference;
 *   - check 2: (a) the stage imports no keyword parser or token scorer and reads no narrative column; (b) every decision is identical when
 *     every goal's wording, and every note, is rewritten in a test copy, and when two goals' wordings are swapped;
 *   - check 6: no goal id appears in the stage's code; every goal goes through one function;
 *   - check 7: where the knowledge cannot separate compatible forms, INSUFFICIENT_EVIDENCE names them and the missing basis;
 *   - check 8: one CAR rating, one context strength, one form declaration and one ruling, each changed in a test copy, move exactly the
 *     decisions that depend on that row;
 *   - check 10: two runs are byte-identical, and no listing order decides anything;
 *   - his added test: a goal not used in development, plus every goal in the registry, through the same function.
 * The readers are also required to agree with the existing loaders on the committed knowledge, so the stage reads the same knowledge the
 * rest of the engine does. Check 9 (A01 untouched) is the regression snapshot, run outside this file.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
    AFFORDANCE_TARGET_MATRIX_BY_ID,
    resolveAffordanceTargetProfile,
} from '../knowledge-core/affordance-target-matrix'
import { gameArchetypeLibrary } from '../knowledge-core/game-archetype-library'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { gameFormGameProblemMapping, rpcLibrary } from '../sport-module/rpc-library'
import {
    activeContextRelationships,
    archetypeGameProblemRole,
    carRow,
    cell,
    committedKnowledge,
    DesignKnowledge,
    gameFormDeclaration,
    routedContext,
} from './knowledge'
import { runStage1, runStage1ForEveryGoal, Stage1Result } from './stage1'

const HERE = __dirname
const SRC = path.resolve(HERE, '..', '..')
/** The stage itself. The demo runner prints display names for a reader and is checked separately. */
const STAGE_FILES = ['knowledge.ts', 'resolve.ts', 'forms.ts', 'stage1.ts'].map((f) => path.join(HERE, f))
const RUNNER = path.join(HERE, 'run-stage1-demo.ts')

const json = (value: unknown) => JSON.stringify(value)
const byGoal = (results: Stage1Result[]) => Object.fromEntries(results.map((r) => [r.learningGoalId, r]))
const goalIds = (k: DesignKnowledge) => k.planning.learning_goals.map((g) => cell(g, 'ID'))

/** Every leaf of a JSON value, by path. */
function leaves(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
    if (value !== null && typeof value === 'object') {
        const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value as Record<string, unknown>)
        if (!entries.length) out[prefix] = Array.isArray(value) ? '[]' : '{}'
        for (const [key, v] of entries) leaves(v, prefix ? `${prefix}.${key}` : key, out)
    } else {
        out[prefix] = JSON.stringify(value)
    }
    return out
}

/** The goals whose Stage 1 output differs between two runs, and the changed leaf paths. */
function changes(before: Stage1Result[], after: Stage1Result[]): { goals: string[]; paths: string[] } {
    const a = leaves(byGoal(before))
    const b = leaves(byGoal(after))
    const paths = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => a[p] !== b[p]).sort()
    return { goals: [...new Set(paths.map((p) => p.split('.')[0]))].sort(), paths }
}

const relationshipRow = (k: DesignKnowledge, id: string) => k.contexts.relationships.find((r) => cell(r, 'relationship_id') === id) as Record<string, unknown>
const formRow = (k: DesignKnowledge, id: string) => k.sportModule.game_forms.find((r) => cell(r, 'game_form_id') === id) as Record<string, unknown>

// -------------------------------------------------------------------------------------------------------------------------------------
// The readers read what the existing loaders read
// -------------------------------------------------------------------------------------------------------------------------------------

function testReadersAgreeWithTheExistingLoaders(): void {
    const k = committedKnowledge()
    const name: Record<string, string> = { E: 'Essential', S: 'Supportive', NR: 'Not Required', C: 'Contextual' }
    for (const [gpId, row] of Object.entries(AFFORDANCE_TARGET_MATRIX_BY_ID)) {
        const mine = carRow(k, gpId)
        assert.ok(mine, gpId)
        assert.deepEqual(
            [name[mine.ratings.FOI], name[mine.ratings.OP], name[mine.ratings.SA], name[mine.ratings.CIO]],
            [row['Functional Object Interaction'], row['Open Pathway'], row['Support Availability'], row['Competitive Interaction Opportunity']],
            `CAR row ${gpId}`
        )
    }
    for (const context of rpcLibrary.contexts()) {
        for (const library of ['GAME_FORM', 'GAME_PROBLEM', 'LEARNING_GOAL', 'GAME_ARCHETYPE']) {
            const mine = activeContextRelationships(k, context.id, library).map((r) => `${r.relationshipId} ${r.relatedId} ${r.type} ${r.strength}`).sort()
            const theirs = rpcLibrary.relationships(context.id, library).map((r) => `${r.relationshipId} ${r.relatedId} ${r.type} ${r.strength}`).sort()
            assert.deepEqual(mine, theirs, `${context.id} ${library}`)
        }
    }
    for (const form of k.sportModule.game_forms) {
        const id = cell(form, 'game_form_id')
        const mine = gameFormDeclaration(k, id)
        const theirs = gameFormGameProblemMapping(id)
        assert.ok(mine && theirs, id)
        assert.deepEqual([mine.archetypeId, mine.primaryGameProblemIds, mine.secondaryGameProblemIds], [theirs.archetypeId, theirs.primary, theirs.secondary], id)
        for (const gp of k.gameProblems.gameProblems) {
            const gpId = cell(gp, 'ID')
            const theirRow = gameArchetypeLibrary.knowledgeFor(mine.archetypeId, 'GAME_PROBLEM_RELATIONSHIP').find((r) => r.Target_ID === gpId)
            assert.equal(archetypeGameProblemRole(k, mine.archetypeId, gpId)?.role ?? null, theirRow?.Knowledge_Role ?? null, `${mine.archetypeId} ${gpId}`)
        }
    }
    for (const route of sessionPlanningModel.rpcRouting()) {
        assert.equal(routedContext(k, route.learningGoalId)?.rpcId, route.rpcId, route.learningGoalId)
    }
}

/** The merge is the existing Composite Runtime's: for the same primary and secondary it gives the same merged profile. */
function testMergeEqualsTheExistingCompositeRuntime(): void {
    const name: Record<string, string> = { E: 'Essential', S: 'Supportive', NR: 'Not Required' }
    // Any composite the CAR register can form: each Game Problem the keyword map reaches, paired with each other one.
    const reachable = ['signalGroup:F_possession_passing', 'signalGroup:C_spacing_support', 'signalGroup:D_break_lines', 'signalGroup:F_finishing', 'signalGroup:G_overload', 'signalGroup:E_regain_pressing', 'signalGroup:I_defensive_press', 'signalGroup:I_defensive_protect', 'signalGroup:I_defensive_recover', 'signalGroup:I_defensive_delay']
    for (const first of reachable) {
        for (const second of reachable) {
            const existing = resolveAffordanceTargetProfile([first, second])
            if (!existing.secondaryGameProblemId) continue
            const copy = committedKnowledge()
            const goal = 'A05'
            copy.rulings.scopedTranslations = [{ ...copy.rulings.scopedTranslations[0], learningGoalId: goal, primaryGameProblemIds: [existing.primaryGameProblemId as string], secondaryGameProblemIds: [existing.secondaryGameProblemId] }]
            const mine = runStage1(goal, copy).resolution.profile
            assert.ok(mine, `${first} + ${second}`)
            assert.deepEqual(
                [name[mine.merged.ratings.FOI], name[mine.merged.ratings.OP], name[mine.merged.ratings.SA], name[mine.merged.ratings.CIO]],
                [existing.targets['Functional Object Interaction'], existing.targets['Open Pathway'], existing.targets['Support Availability'], existing.targets['Competitive Interaction Opportunity']],
                `${existing.primaryGameProblemId} + ${existing.secondaryGameProblemId}`
            )
        }
    }
}

// -------------------------------------------------------------------------------------------------------------------------------------
// The two development goals (the demonstration's items 1-4) and check 1
// -------------------------------------------------------------------------------------------------------------------------------------

function testProgressTheAttackResolvesFromHisScopedRuling(): void {
    const r = runStage1('A05')
    const g = r.resolution
    assert.equal(g.status, 'RESOLVED')
    assert.equal(g.gameProblems.basis, 'SCOPED_RULING', 'the Engine Translation row is unpopulated, so his E1 ruling supplies the Game Problems')
    assert.deepEqual([g.gameProblems.primary, g.gameProblems.secondary], [['GP-001'], ['GP-002']])
    assert.deepEqual(g.gameProblems.cites.map((c) => c.row), ['RUL-E1-A05', 'A05'])
    assert.equal(g.gameProblems.scope, 'STAGE1_DEVELOPMENT_DEMONSTRATION')
    assert.equal(g.context?.rpcId, 'RPC-003')
    assert.equal(g.context?.goalRelationship?.relationshipId, 'RPC-REL-062')
    assert.deepEqual(g.context?.gameProblemRelationships.map((x) => `${x.gameProblemId} ${x.relationship?.relationshipId} ${x.relationship?.strength}`), ['GP-001 RPC-REL-023 PRIMARY', 'GP-002 RPC-REL-024 PRIMARY'])

    // E1: the merge would conceal the distinction, so both rows, both rules and the divergence are reported.
    const p = g.profile
    assert.ok(p)
    assert.deepEqual(p.perGameProblem.map((e) => [e.gameProblemId, e.role, e.ratings]), [
        ['GP-001', 'PRIMARY', { FOI: 'S', OP: 'E', SA: 'S', CIO: 'E' }],
        ['GP-002', 'SECONDARY', { FOI: 'E', OP: 'E', SA: 'S', CIO: 'E' }],
    ])
    assert.deepEqual(p.merged.ratings, { FOI: 'E', OP: 'E', SA: 'S', CIO: 'E' })
    assert.deepEqual(p.merged.ratings, p.perGameProblem[1].ratings, 'strongest necessity makes the composite identical to the secondary alone')
    assert.deepEqual(p.underPrimaryWins?.ratings, { FOI: 'S', OP: 'E', SA: 'S', CIO: 'E' })
    assert.deepEqual(p.divergent, [{ requirement: 'FOI', primary: 'S', secondary: 'E', merged: 'E' }])
    assert.deepEqual(g.gameProblemRelationships.map((x) => `${x.source} ${x.relationship} ${x.target}`), ['GP-001 same_domain GP-002'])
    assert.deepEqual(g.openDecisions.map((d) => d.id), ['OPEN-E1-MERGE-RULE'])
    assert.deepEqual(g.requirements.map((q) => [q.id, q.status]), [['REQ-E1-CONTEXT-SENSITIVE-RESOLUTION', 'RECORDED_NOT_IMPLEMENTED']])

    // Check 7: GF2 and GF3 are identical on every dimension; GF7 trades context strength for the secondary Game Problem.
    const f = r.gameForm
    assert.equal(f.status, 'INSUFFICIENT_EVIDENCE')
    assert.equal(f.selected, null)
    assert.deepEqual(f.compatible, ['GF2', 'GF3', 'GF7'])
    assert.deepEqual(f.undominated, ['GF2', 'GF3', 'GF7'])
    assert.deepEqual(f.comparisons.map((c) => `${c.a}-${c.b} ${c.outcome}`), ['GF2-GF3 SAME_ON_EVERY_DIMENSION', 'GF2-GF7 TRADEOFF', 'GF3-GF7 TRADEOFF'])
    assert.equal(f.missingBasis.length, 3)
    assert.match(f.missingBasis[0], /GF2 and GF3 are related identically on every dimension/)
    assert.match(f.missingBasis[1], /GF7 is stronger on FORM_DECLARES_SECONDARY GP-002/)
}

function testSecurePossessionResolvesOnItsApprovedRoutingWithTheContextDecisionOpen(): void {
    const r = runStage1('TA02')
    const g = r.resolution
    assert.equal(g.status, 'RESOLVED')
    assert.equal(g.gameProblems.basis, 'APPROVED_TRANSLATION')
    assert.deepEqual([g.gameProblems.primary, g.gameProblems.secondary], [['GP-015'], []])
    assert.deepEqual(g.gameProblems.cites.map((c) => `${c.table} ${c.row}`), ['engine_translation TA02'])
    assert.equal(g.context?.rpcId, 'RPC-003', 'not routed to Counterattack: his E2 ruling keeps the approved routing until the context decision is made')
    assert.equal(g.context?.goalRelationship?.strength, 'SECONDARY')
    assert.equal(g.context?.gameProblemRelationships[0].relationship?.strength, 'SECONDARY')
    assert.deepEqual(g.profile?.merged.ratings, { FOI: 'E', OP: 'E', SA: 'E', CIO: 'E' })
    assert.equal(g.profile?.underPrimaryWins, null)
    assert.deepEqual(g.profile?.divergent, [])
    assert.deepEqual(g.openDecisions.map((d) => d.id), ['OPEN-E2-CONTEXT-FIT'])
    assert.deepEqual(g.requirements, [])

    const f = r.gameForm
    assert.equal(f.status, 'SELECTED')
    assert.equal(f.selected, 'GF2')
    assert.deepEqual(f.compatible, ['GF2'])
    for (const id of ['GF3', 'GF7']) {
        const c = f.candidates.find((x) => x.gameFormId === id)
        assert.ok(c && !c.compatible, id)
        assert.deepEqual(c.excludedBecause.map((e) => e.split(':')[0]), ['DECLARES_PRIMARY_GAME_PROBLEM'], id)
    }
    assert.equal(f.candidates.find((x) => x.gameFormId === 'GF2')?.checks.find((c) => c.check === 'ARCHETYPE_GAME_PROBLEM')?.detail, 'GA-001 relates GP-015 COMPATIBLE.')
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Check 2: relationships, not word matching
// -------------------------------------------------------------------------------------------------------------------------------------

function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/** Every repository module a file reaches through relative imports. */
function importClosure(files: string[]): string[] {
    const seen = new Set<string>()
    const stack = [...files]
    while (stack.length) {
        const file = stack.pop() as string
        if (seen.has(file)) continue
        seen.add(file)
        if (!file.endsWith('.ts')) continue
        const source = fs.readFileSync(file, 'utf8')
        for (const match of source.matchAll(/from\s+'(\.[^']+)'/g)) {
            const base = path.resolve(path.dirname(file), match[1])
            const candidate = [`${base}.ts`, base, path.join(base, 'index.ts')].find((p) => fs.existsSync(p) && fs.statSync(p).isFile())
            if (candidate) stack.push(candidate)
        }
    }
    return [...seen].map((f) => path.relative(SRC, f).replace(/\\/g, '/')).sort()
}

function testTheStageReachesNoKeywordParserOrTokenScorer(): void {
    const closure = importClosure(STAGE_FILES)
    const forbidden = [
        'system/input-constraints/deriveInputConstraints.ts',
        'system/test-library/generateSelection.ts',
        'system/test-library/normalizeCoachingInput.ts',
        'system/sport-module/guided-selection.ts',
        'system/knowledge-core/affordance-target-matrix.ts', // holds the PROVISIONAL keyword-to-Game Problem map
    ]
    for (const f of forbidden) assert.ok(!closure.includes(f), `the stage reaches ${f}`)
    // Everything it does reach is a knowledge file or a loader that reads only its own knowledge file.
    assert.deepEqual(
        closure.filter((f) => f.endsWith('.ts')),
        [
            'system/design-reasoning/forms.ts',
            'system/design-reasoning/knowledge.ts',
            'system/design-reasoning/resolve.ts',
            'system/design-reasoning/stage1.ts',
            'system/session-planning/session-planning-model.ts',
            'system/sport-module/design-knowledge-sources.ts',
        ]
    )
    for (const f of STAGE_FILES) {
        const code = stripComments(fs.readFileSync(f, 'utf8'))
        for (const name of ['SIGNAL_GROUP_TO_GAME_PROBLEM', 'resolveAffordanceTargetProfile', 'learningGoalIdForPhrase', 'entry_language', 'signalGroup', 'matchedSignals', 'toLowerCase', 'includes(text', 'RegExp(']) {
            assert.ok(!code.includes(name), `${path.basename(f)} uses ${name}`)
        }
    }
}

/** No narrative column is read by the stage; only the demo runner reads a goal's display name, after the decisions are made. */
function testTheStageReadsNoNarrativeColumn(): void {
    const narrative = ['Learning Goal', 'Coach Definition', 'Choose This When...', 'Coach Phrase', 'Practice Situation', 'Notes', 'notes', 'provenance', 'RPC Name', 'rpc_name', 'statement_text', 'identity_statement', 'property_text', 'Knowledge_Statement', 'Rationale', 'Name', 'canonical_name', 'game_form_name', 'coach_vocabulary', 'objective', 'role_structure', 'representative_requirements', 'setup_guidance', 'known_limitations', 'typical_affordances']
    for (const f of STAGE_FILES) {
        const code = stripComments(fs.readFileSync(f, 'utf8'))
        for (const column of narrative) assert.ok(!code.includes(`'${column}'`) && !code.includes(`"${column}"`), `${path.basename(f)} reads the narrative column ${column}`)
    }
    assert.ok(fs.readFileSync(RUNNER, 'utf8').includes(`'Learning Goal'`), 'the runner is where the display name is read')
    for (const f of STAGE_FILES) assert.ok(!fs.readFileSync(f, 'utf8').includes('run-stage1-demo'), `${path.basename(f)} imports the runner`)
}

const REWRITE = {
    learning_goals: ['Learning Goal', 'Coach Definition', 'Choose This When...'],
    practice_situations: ['Practice Situation'],
    entry_language: ['Coach Phrase'],
    engine_translation: ['Notes'],
    rpc_routing: ['Learning Goal', 'RPC Name'],
}

/** Every goal's wording, and every narrative cell the stage could have been tempted by, rewritten. */
function rewrittenWording(): DesignKnowledge {
    const k = committedKnowledge()
    const planning = k.planning as unknown as Record<string, Array<Record<string, unknown>>>
    for (const [sheet, columns] of Object.entries(REWRITE)) {
        for (const row of planning[sheet] ?? []) for (const c of columns) if (row[c] !== null && row[c] !== undefined) row[c] = `Reworded ${String(row[c]).split('').reverse().join('')}`
    }
    for (const row of k.contexts.relationships) row['notes'] = 'Reworded note'
    for (const row of k.contexts.registry) row['rpc_name'] = `Reworded ${String(row['rpc_name'])}`
    for (const row of (k.contexts as unknown as { statements: Array<Record<string, unknown>> }).statements) row['statement_text'] = 'Reworded statement'
    for (const row of k.contexts.identity_rules) row['identity_statement'] = 'Reworded identity statement'
    for (const row of k.sportModule.game_forms) for (const c of ['game_form_name', 'coach_vocabulary', 'objective', 'notes', 'representative_requirements', 'role_structure', 'setup_guidance']) row[c] = 'Reworded'
    for (const row of k.gameProblems.gameProblems) row['Name'] = `Reworded ${String(row['Name'])}`
    for (const row of k.car.ratings) row['canonical_name'] = 'Reworded'
    return k
}

function testEveryDecisionIsIdenticalWhenTheWordingIsRewritten(): void {
    const committed = committedKnowledge()
    const rewritten = rewrittenWording()
    // The copy really is different where a reader of wording would look.
    assert.notEqual(json(rewritten.planning.learning_goals), json(committed.planning.learning_goals))
    assert.equal(json(runStage1ForEveryGoal(rewritten)), json(runStage1ForEveryGoal(committed)))
}

/** Two goals' coach-facing wording swapped: each still resolves by its id to its own knowledge. */
function testSwappingTwoGoalsWordingChangesNothing(): void {
    const k = committedKnowledge()
    const a = k.planning.learning_goals.find((g) => cell(g, 'ID') === 'A05') as Record<string, unknown>
    const b = k.planning.learning_goals.find((g) => cell(g, 'ID') === 'TA02') as Record<string, unknown>
    for (const c of REWRITE.learning_goals) [a[c], b[c]] = [b[c], a[c]]
    assert.equal(json(runStage1ForEveryGoal(k)), json(runStage1ForEveryGoal()))
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Check 6: one process, no goal-specific code
// -------------------------------------------------------------------------------------------------------------------------------------

function testNoGoalOrKnowledgeIdAppearsInTheStageCode(): void {
    const ids = goalIds(committedKnowledge())
    assert.equal(ids.length, 13)
    for (const f of [...STAGE_FILES, RUNNER, path.join(SRC, 'system/sport-module/design-knowledge-sources.ts')]) {
        const source = fs.readFileSync(f, 'utf8')
        for (const id of ids) assert.ok(!new RegExp(`\\b${id}\\b`).test(source), `${path.basename(f)} names the goal ${id}`)
        // Nor any Game Problem, context or Game Form id: no special case for any of them, comments included.
        assert.ok(!/\b(GP-\d{3}|RPC-\d{3}|RPC-REL-\d{3}|GF\d+|GA-\d{3})\b/.test(source), `${path.basename(f)} names a knowledge id`)
    }
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Check 8: knowledge actually governs
// -------------------------------------------------------------------------------------------------------------------------------------

function testOneCarRatingMovesOnlyTheProfileThatReadsIt(): void {
    const before = runStage1ForEveryGoal()
    const k = committedKnowledge()
    const row = k.car.ratings.find((r) => cell(r, 'game_problem_id') === 'GP-001') as Record<string, unknown>
    row['FOI'] = 'E'
    const after = runStage1ForEveryGoal(k)
    const diff = changes(before, after)
    assert.deepEqual(diff.goals, ['A05'], 'only the goal whose resolution reads the GP-001 row')
    assert.ok(diff.paths.every((p) => p.startsWith('A05.resolution.')), `Game Form decisions moved: ${diff.paths.filter((p) => !p.startsWith('A05.resolution.')).join(', ')}`)
    const a05 = byGoal(after)['A05'].resolution
    assert.deepEqual(a05.profile?.divergent, [], 'no divergence remains')
    assert.deepEqual(a05.openDecisions.map((d) => d.id), [], 'so the merge-rule question no longer applies')
}

function testOneContextStrengthMovesOnlyTheFormDecisionsThatReadIt(): void {
    const before = runStage1ForEveryGoal()
    const k = committedKnowledge()
    relationshipRow(k, 'RPC-REL-029')['relationship_strength'] = 'PRIMARY' // RPC-003 -> GF7
    const after = byGoal(runStage1ForEveryGoal(k))
    const diff = changes(before, Object.values(after))
    assert.deepEqual(diff.goals, ['A05', 'TA02'], 'the two goals routed to that context')
    assert.ok(diff.paths.every((p) => p.includes('.gameForm.')), 'no resolution moved')
    assert.equal(after['A05'].gameForm.status, 'SELECTED')
    assert.equal(after['A05'].gameForm.selected, 'GF7', 'GF7 now matches the others on context strength and is stronger on the secondary Game Problem')
    assert.equal(after['TA02'].gameForm.selected, 'GF2', 'GF7 still declares nothing about GP-015')
    // For the other goal only the changed row's own report moves: its strength, the check that quotes it, its dimension value.
    assert.deepEqual(diff.paths.filter((p) => p.startsWith('TA02.')), [
        'TA02.gameForm.candidates.2.checks.0.detail',
        'TA02.gameForm.candidates.2.contextRelationship.strength',
        'TA02.gameForm.candidates.2.dimensions.1.value',
    ])
}

function testOneFormDeclarationMovesOnlyTheGoalsWhosePrimaryItNames(): void {
    const before = runStage1ForEveryGoal()
    const k = committedKnowledge()
    formRow(k, 'GF3')['secondary_game_problem_ids'] = 'GP-005; GP-015'
    const after = byGoal(runStage1ForEveryGoal(k))
    const diff = changes(before, Object.values(after))
    // Every goal whose context relates GF3 sees the changed declaration reported; only the GP-015 goals' decisions can move.
    for (const id of diff.goals) assert.ok(diff.paths.filter((p) => p.startsWith(`${id}.`)).every((p) => p.includes('.gameForm.')), id)
    for (const id of ['A02', 'TA02']) {
        assert.equal(after[id].gameForm.selected, 'GF2', id)
        assert.deepEqual(after[id].gameForm.compatible, ['GF2', 'GF3'], id)
        assert.deepEqual(after[id].gameForm.comparisons.map((c) => c.outcome), ['A_DOMINATES'], `${id}: GF2 declares GP-015 primary, GF3 secondary`)
    }
    for (const id of goalIds(k).filter((g) => !['A02', 'TA02'].includes(g))) {
        assert.equal(json([after[id].gameForm.status, after[id].gameForm.selected, after[id].gameForm.undominated]), json([byGoal(before)[id].gameForm.status, byGoal(before)[id].gameForm.selected, byGoal(before)[id].gameForm.undominated]), id)
    }
}

function testOneRulingMovesOnlyTheGoalItNames(): void {
    const before = runStage1ForEveryGoal()
    const k = committedKnowledge()
    k.rulings.scopedTranslations[0].secondaryGameProblemIds = []
    const after = byGoal(runStage1ForEveryGoal(k))
    assert.deepEqual(changes(before, Object.values(after)).goals, ['A05'])
    const a05 = after['A05']
    assert.equal(a05.resolution.profile?.underPrimaryWins, null)
    assert.deepEqual(a05.resolution.requirements, [], 'the recorded requirement applies only while both related Game Problems are resolved')
    assert.deepEqual(a05.gameForm.undominated, ['GF2', 'GF3'], 'without the secondary, GF7 is dominated on context strength')
    assert.equal(a05.gameForm.status, 'INSUFFICIENT_EVIDENCE')
}

/** A governed preference, if he authors one, decides between forms the strengths cannot separate. */
function testAPreferredRelationshipIsHonouredAsAGovernedPreference(): void {
    const k = committedKnowledge()
    relationshipRow(k, 'RPC-REL-028')['relationship_type'] = 'PREFERRED' // RPC-003 -> GF2
    const after = byGoal(runStage1ForEveryGoal(k))
    assert.deepEqual(after['A05'].gameForm.undominated, ['GF2', 'GF7'], 'GF2 now dominates GF3; GF7 still trades against GF2')
    assert.equal(after['TA02'].gameForm.selected, 'GF2')
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Guards
// -------------------------------------------------------------------------------------------------------------------------------------

function testARulingNeverOverridesAnApprovedTranslation(): void {
    const k = committedKnowledge()
    k.rulings.scopedTranslations.push({ ...k.rulings.scopedTranslations[0], id: 'TEST-OVERRIDE', learningGoalId: 'TA02' })
    const r = runStage1('TA02', k)
    assert.equal(r.resolution.status, 'UNRESOLVED')
    assert.deepEqual(r.resolution.missing.map((m) => m.kind), ['RULING_WOULD_OVERRIDE_TRANSLATION'])
    assert.equal(r.gameForm.status, 'NOT_EVALUATED')
}

function testAnUnknownGoalIsRefusedNotGuessed(): void {
    const r = runStage1('NOT-A-GOAL')
    assert.equal(r.resolution.status, 'UNRESOLVED')
    assert.deepEqual(r.resolution.missing.map((m) => m.kind), ['UNKNOWN_LEARNING_GOAL'])
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Check 10: determinism, and no listing order decides anything
// -------------------------------------------------------------------------------------------------------------------------------------

function testTwoRunsAreByteIdenticalAndCopiesAreIndependent(): void {
    const first = json(runStage1ForEveryGoal())
    const k = committedKnowledge()
    k.car.ratings.length = 0
    assert.equal(json(runStage1ForEveryGoal()), first, 'changing one copy changes no other')
}

function testReversingEveryListChangesNothing(): void {
    const k = committedKnowledge()
    k.contexts.relationships.reverse()
    k.sportModule.game_forms.reverse()
    k.car.ratings.reverse()
    k.planning.engine_translation.reverse()
    k.planning.rpc_routing.reverse()
    k.planning.learning_goals.reverse()
    k.archetypes.knowledge.reverse()
    k.gameProblems.relationships.reverse()
    assert.equal(json(runStage1ForEveryGoal(k)), json(runStage1ForEveryGoal()))
}

// -------------------------------------------------------------------------------------------------------------------------------------
// His added test: a goal the stage was not developed on, and every goal in the registry
// -------------------------------------------------------------------------------------------------------------------------------------

/** Win the Ball Back: a defending goal, another Game Problem (GP-016) and another context (RPC-007); not one of the two development goals. */
function testAGoalNotUsedInDevelopment(): void {
    const r = runStage1('D02')
    assert.equal(r.resolution.status, 'RESOLVED')
    assert.equal(r.resolution.gameProblems.basis, 'APPROVED_TRANSLATION')
    assert.deepEqual(r.resolution.gameProblems.primary, ['GP-016'])
    assert.equal(r.resolution.context?.rpcId, 'RPC-007')
    assert.equal(r.gameForm.status, 'SELECTED')
    assert.equal(r.gameForm.selected, 'GF4')
    assert.equal(r.gameForm.candidates.find((c) => c.gameFormId === 'GF4')?.contextRelationship.relationshipId, 'RPC-REL-051')
}

function testEveryGoalGetsAnAnswerThatNamesItsBasisOrWhatIsMissing(): void {
    const results = runStage1ForEveryGoal()
    assert.equal(results.length, 13)
    const summary: Record<string, string> = {}
    for (const r of results) {
        summary[r.learningGoalId] = `${r.resolution.status} ${r.gameForm.status}${r.gameForm.selected ? ` ${r.gameForm.selected}` : ''}`
        if (r.gameForm.status === 'SELECTED') assert.deepEqual(r.gameForm.undominated, [r.gameForm.selected], r.learningGoalId)
        else assert.ok(r.resolution.missing.length + r.gameForm.missing.length + r.gameForm.missingBasis.length > 0, `${r.learningGoalId} says nothing about why`)
    }
    assert.deepEqual(summary, {
        A01: 'RESOLVED INSUFFICIENT_EVIDENCE',
        A02: 'RESOLVED SELECTED GF2',
        A03: 'RESOLVED NO_COMPATIBLE_FORM',
        A04: 'UNRESOLVED NOT_EVALUATED',
        A05: 'RESOLVED INSUFFICIENT_EVIDENCE',
        A06: 'UNRESOLVED NOT_EVALUATED',
        D01: 'RESOLVED NO_COMPATIBLE_FORM',
        D02: 'RESOLVED SELECTED GF4',
        D03: 'RESOLVED NO_COMPATIBLE_FORM',
        TA01: 'RESOLVED SELECTED GF4',
        TA02: 'RESOLVED SELECTED GF2',
        TD01: 'RESOLVED NO_COMPATIBLE_FORM',
        TD02: 'RESOLVED NO_COMPATIBLE_FORM',
    })
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Confined to the review pathway
// -------------------------------------------------------------------------------------------------------------------------------------

function listTs(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listTs(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []))
}

function testNothingOutsideTheStageImportsIt(): void {
    for (const file of listTs(SRC)) {
        if (file.endsWith('.unit.ts') || file.startsWith(HERE + path.sep)) continue
        const source = fs.readFileSync(file, 'utf8')
        assert.ok(!/from\s+'[^']*design-reasoning[^']*'/.test(source), `${path.relative(SRC, file)} imports the design-reasoning stage`)
        assert.ok(!/from\s+'[^']*design-knowledge-sources'/.test(source), `${path.relative(SRC, file)} imports the stage's sport-layer source`)
    }
}

testReadersAgreeWithTheExistingLoaders()
testMergeEqualsTheExistingCompositeRuntime()
testProgressTheAttackResolvesFromHisScopedRuling()
testSecurePossessionResolvesOnItsApprovedRoutingWithTheContextDecisionOpen()
testTheStageReachesNoKeywordParserOrTokenScorer()
testTheStageReadsNoNarrativeColumn()
testEveryDecisionIsIdenticalWhenTheWordingIsRewritten()
testSwappingTwoGoalsWordingChangesNothing()
testNoGoalOrKnowledgeIdAppearsInTheStageCode()
testOneCarRatingMovesOnlyTheProfileThatReadsIt()
testOneContextStrengthMovesOnlyTheFormDecisionsThatReadIt()
testOneFormDeclarationMovesOnlyTheGoalsWhosePrimaryItNames()
testOneRulingMovesOnlyTheGoalItNames()
testAPreferredRelationshipIsHonouredAsAGovernedPreference()
testARulingNeverOverridesAnApprovedTranslation()
testAnUnknownGoalIsRefusedNotGuessed()
testTwoRunsAreByteIdenticalAndCopiesAreIndependent()
testReversingEveryListChangesNothing()
testAGoalNotUsedInDevelopment()
testEveryGoalGetsAnAnswerThatNamesItsBasisOrWhatIsMissing()
testNothingOutsideTheStageImportsIt()

console.log('design-reasoning Stage 1: all tests passed')
