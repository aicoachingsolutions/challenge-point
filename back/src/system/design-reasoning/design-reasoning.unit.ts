/**
 * Unit tests — design-reasoning Stage 1 (Steps 1 and 2), review pathway only.
 *
 * The acceptance checks of the development proposal (section D) that Steps 1 and 2 can answer, as Christian approved them in Christian's reply of
 * 3 November 2026 (item 10: *"I support your ten proposed acceptance checks, including the wording-invariance and knowledge-mutation
 * tests."*), plus Christian's added test on a goal the stage was not developed on:
 *   - check 1: each resolution cites the approved translation (or Christian's scoped ruling) and the routing; no keyword inference;
 *   - check 2: (a) the stage imports no keyword parser or token scorer and reads no narrative column; (b) every decision is identical when
 *     every goal's wording, and every note, is rewritten in a test copy, and when two goals' wordings are swapped;
 *   - check 6: no goal id appears in the stage's code; every goal goes through one function;
 *   - check 7: where the knowledge cannot separate compatible forms, INSUFFICIENT_EVIDENCE names them and the missing basis;
 *   - check 8: one CAR rating, one context strength, one form declaration and one ruling, each changed in a test copy, move exactly the
 *     decisions that depend on that row;
 *   - check 10: two runs are byte-identical, and no listing order decides anything;
 *   - Christian's added test: a goal not used in development, plus every goal in the registry, through the same function.
 * The readers are also required to agree with the existing loaders on the committed knowledge, so the stage reads the same knowledge the
 * rest of the engine does. Check 9 (A01 untouched) is the regression snapshot, run outside this file.
 *
 * STAGE 2 AMENDMENTS (Christian's reply to the Stage 2 decision package, received 4 November 2026). Steps 1 and 2 now run as Christian's D1 and D3
 * direct, so the expectations below changed where those rulings changed the output: the composite profile is primary-led with a union
 * view and explicit findings (no "primary wins" profile, no open merge-rule decision); Game Forms are compatibility only, so the A05 and
 * A01 ties are compatible alternatives GF2, GF3 and GF7, a context strength no longer moves any form decision, and a declaration change
 * leaves alternatives rather than a dominance. The static tests now cover every .ts file of the stage, Stage 2's included. The Stage 2
 * components have their own tests in `stage2.unit.ts`.
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
import { DISPLAY_ALLOWLIST } from './assembly-display'
import { runStage1, runStage1ForEveryGoal, Stage1Result } from './stage1'

const HERE = __dirname
const SRC = path.resolve(HERE, '..', '..')
/** The stage itself: every .ts file of the folder except the tests and the runners (which print display text for a reader). */
const STAGE_FILES = fs
    .readdirSync(HERE)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.unit.ts') && !f.startsWith('run-'))
    .sort()
    .map((f) => path.join(HERE, f))
const RUNNER = path.join(HERE, 'run-stage1-demo.ts')
const RUNNERS = fs
    .readdirSync(HERE)
    .filter((f) => f.startsWith('run-') && f.endsWith('.ts'))
    .sort()
    .map((f) => path.join(HERE, f))

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

/** The union view is the existing Composite Runtime's merge: for the same primary and secondary it gives the same ratings. */
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
            const union = mine.unionView.perRequirement
            assert.deepEqual(
                [name[union.FOI.rating], name[union.OP.rating], name[union.SA.rating], name[union.CIO.rating]],
                [existing.targets['Functional Object Interaction'], existing.targets['Open Pathway'], existing.targets['Support Availability'], existing.targets['Competitive Interaction Opportunity']],
                `${existing.primaryGameProblemId} + ${existing.secondaryGameProblemId}`
            )
        }
    }
}

// -------------------------------------------------------------------------------------------------------------------------------------
// The two development goals (the demonstration's items 1-4) and check 1
// -------------------------------------------------------------------------------------------------------------------------------------

function testProgressTheAttackResolvesFromChristiansScopedRuling(): void {
    const r = runStage1('A05')
    const g = r.resolution
    assert.equal(g.status, 'RESOLVED')
    assert.equal(g.gameProblems.basis, 'SCOPED_RULING', 'the Engine Translation row is unpopulated, so Christian\'s E1 ruling supplies the Game Problems')
    assert.deepEqual([g.gameProblems.primary, g.gameProblems.secondary], [['GP-001'], ['GP-002']])
    assert.deepEqual(g.gameProblems.cites.map((c) => c.row), ['RUL-E1-A05', 'A05'])
    assert.equal(g.gameProblems.scope, 'STAGE1_DEVELOPMENT_DEMONSTRATION')
    assert.equal(g.context?.rpcId, 'RPC-003')
    assert.equal(g.context?.goalRelationship?.relationshipId, 'RPC-REL-062')
    assert.deepEqual(g.context?.gameProblemRelationships.map((x) => `${x.gameProblemId} ${x.relationship?.relationshipId} ${x.relationship?.strength}`), ['GP-001 RPC-REL-023 PRIMARY', 'GP-002 RPC-REL-024 PRIMARY'])

    assert.equal(g.gameProblems.continuedBy?.ruling, 'D1-4NOV', 'Christian\'s D1 retains the designation for the Stage 2 demonstration')

    // E1, as Christian's D1 directs: both rows with role and provenance, the union view, the primary-led effective profile, the FOI finding.
    const p = g.profile
    assert.ok(p)
    assert.deepEqual(p.rows.map((e) => [e.gameProblemId, e.role, e.ratings]), [
        ['GP-001', 'PRIMARY', { FOI: 'S', OP: 'E', SA: 'S', CIO: 'E' }],
        ['GP-002', 'SECONDARY', { FOI: 'E', OP: 'E', SA: 'S', CIO: 'E' }],
    ])
    assert.deepEqual(Object.fromEntries(Object.entries(p.unionView.perRequirement).map(([q, v]) => [q, v.rating])), { FOI: 'E', OP: 'E', SA: 'S', CIO: 'E' })
    assert.equal(p.unionView.usedAsEffectiveProfile, false)
    assert.deepEqual(p.effectiveProfile.ratings, { FOI: 'S', OP: 'E', SA: 'S', CIO: 'E' })
    assert.deepEqual(p.findings.map((d) => [d.requirement, d.primary.rating, d.secondary.rating, d.outcome]), [['FOI', 'S', 'E', 'INSUFFICIENT_EVIDENCE']])
    assert.deepEqual(g.gameProblemRelationships.map((x) => `${x.source} ${x.relationship} ${x.target}`), ['GP-001 same_domain GP-002'])
    assert.deepEqual(g.openDecisions.map((d) => d.id), [], 'the merge-rule question is superseded by Christian\'s D1')
    assert.deepEqual(g.requirements.map((q) => [q.id, q.status]), [['REQ-E1-CONTEXT-SENSITIVE-RESOLUTION', 'RECORDED_NOT_IMPLEMENTED']])

    // Check 7, as Christian's D3 directs: GF2, GF3 and GF7 are compatible alternatives, with insufficient evidence to prefer one.
    const f = r.gameForm
    assert.equal(f.status, 'COMPATIBLE_ALTERNATIVES')
    assert.equal(f.selected, null)
    assert.deepEqual(f.compatible, ['GF2', 'GF3', 'GF7'])
    assert.equal(f.preference.status, 'INSUFFICIENT_EVIDENCE')
    assert.deepEqual(f.preference.whatCouldDistinguish.map((w) => [w.id, w.present]), [['K1', false], ['K2', false], ['K3', false], ['K4', false], ['K5', false]])
}

function testSecurePossessionResolvesOnItsApprovedRoutingWithTheContextDecisionOpen(): void {
    const r = runStage1('TA02')
    const g = r.resolution
    assert.equal(g.status, 'RESOLVED')
    assert.equal(g.gameProblems.basis, 'APPROVED_TRANSLATION')
    assert.deepEqual([g.gameProblems.primary, g.gameProblems.secondary], [['GP-015'], []])
    assert.deepEqual(g.gameProblems.cites.map((c) => `${c.table} ${c.row}`), ['engine_translation TA02'])
    assert.equal(g.context?.rpcId, 'RPC-003', 'not routed to Counterattack: Christian\'s E2 ruling keeps the approved routing until the context decision is made')
    assert.equal(g.context?.goalRelationship?.strength, 'SECONDARY')
    assert.equal(g.context?.gameProblemRelationships[0].relationship?.strength, 'SECONDARY')
    assert.deepEqual(g.profile?.effectiveProfile.ratings, { FOI: 'E', OP: 'E', SA: 'E', CIO: 'E' })
    assert.deepEqual(g.profile?.rows.map((x) => x.role), ['PRIMARY'])
    assert.deepEqual(g.profile?.findings, [])
    assert.deepEqual(g.openDecisions.map((d) => d.id), ['OPEN-D2-POSSESSION-STABILIZATION'], 'Christian\'s D2 supersedes the E2 question; the context stays under review')
    assert.deepEqual(g.requirements, [])

    const f = r.gameForm
    assert.equal(f.status, 'SELECTED')
    assert.equal(f.selected, 'GF2')
    assert.deepEqual(f.compatible, ['GF2'])
    assert.match(f.statement, /the only Game Form with a governed relationship: compatibility, not demonstrated suitability/)
    for (const id of ['GF3', 'GF7']) {
        const c = f.candidates.find((x) => x.gameFormId === id)
        assert.ok(c && !c.compatible, id)
        assert.deepEqual(c.excludedBecause.map((e) => [e.check, e.reason]), [['DECLARES_PRIMARY_GAME_PROBLEM', 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED']], id)
    }
    // R1.2 relabelled: the archetype relationship is non-contradiction only, never support.
    assert.equal(f.candidates.find((x) => x.gameFormId === 'GF2')?.checks.find((c) => c.check === 'ARCHETYPE_GAME_PROBLEM')?.detail, 'GA-001 relates GP-015 COMPATIBLE: non-contradiction (compatibility) only; not support for the Game Form.')
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
        // Static imports, require() and import(), in either quotation mark (a double-quoted or required module is followed too).
        for (const match of source.matchAll(/(?:from\s+|require\(\s*|import\(\s*)['"](\.[^'"]+)['"]/g)) {
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
    // ASSEMBLY EXPERIMENT AMENDMENT (Christian's second reply of 5 November 2026): the three new stage files join the closure; they import only
    // files already in it (and their own two JSON files), so the closure still reaches no loader beyond the two listed below.
    // DRAFT DIAGRAM AMENDMENT (Christian's reply of 6 November 2026, section 9, l.84: "Please produce a draft diagram from the offline
    // configuration record, without changing the live application or A01's diagram-generation pathway."): the diagram file joins the
    // closure (13 files become 14); it imports only assembly.ts, already in it, so the closure still reaches no loader beyond the two below.
    assert.deepEqual(
        closure.filter((f) => f.endsWith('.ts')),
        [
            'system/design-reasoning/assembly-diagram.ts',
            'system/design-reasoning/assembly-display.ts',
            'system/design-reasoning/assembly-review.ts',
            'system/design-reasoning/assembly.ts',
            'system/design-reasoning/forms.ts',
            'system/design-reasoning/knowledge.ts',
            'system/design-reasoning/resolve.ts',
            'system/design-reasoning/stage1.ts',
            'system/design-reasoning/stage2.ts',
            'system/design-reasoning/structural.ts',
            'system/design-reasoning/trace.ts',
            'system/design-reasoning/width-comparison.ts',
            'system/session-planning/session-planning-model.ts',
            'system/sport-module/design-knowledge-sources.ts',
        ]
    )
    // And the JSON it reaches is the committed knowledge, Christian's rulings, our review-only entries and the test fixture; never selection-basis.json.
    assert.ok(!closure.some((f) => f.endsWith('selection-basis.json')), 'the withdrawn orderings are still reached')
    for (const f of STAGE_FILES) {
        const code = stripComments(fs.readFileSync(f, 'utf8'))
        for (const name of ['SIGNAL_GROUP_TO_GAME_PROBLEM', 'resolveAffordanceTargetProfile', 'learningGoalIdForPhrase', 'entry_language', 'signalGroup', 'matchedSignals', 'toLowerCase', 'includes(text', 'RegExp(']) {
            assert.ok(!code.includes(name), `${path.basename(f)} uses ${name}`)
        }
    }
}

/**
 * No narrative column is read by any stage file except the assembly experiment's display reader, which reads only its pinned allowlist,
 * after the decisions, for the coach text and the report; the runners name the goal-name column.
 */
function testTheStageReadsNoNarrativeColumn(): void {
    const narrative = ['Learning Goal', 'Coach Definition', 'Choose This When...', 'Coach Phrase', 'Practice Situation', 'Notes', 'notes', 'provenance', 'RPC Name', 'rpc_name', 'statement_text', 'identity_statement', 'property_text', 'Knowledge_Statement', 'Rationale', 'Name', 'canonical_name', 'game_form_name', 'coach_vocabulary', 'objective', 'role_structure', 'representative_requirements', 'setup_guidance', 'known_limitations', 'typical_affordances', 'description']
    // ASSEMBLY EXPERIMENT AMENDMENT: the experiment's display reader is the one stage file that reads display cells, after the decisions,
    // for the coach text and the report. It is exempt from this ban only for its own allowlist, pinned exactly below, and only the runners
    // and the unit tests may import it, so no decision can read what it reads (the ban's intent).
    const DISPLAY_READER = path.join(HERE, 'assembly-display.ts')
    for (const f of STAGE_FILES.filter((x) => x !== DISPLAY_READER)) {
        const code = stripComments(fs.readFileSync(f, 'utf8'))
        for (const column of narrative) assert.ok(!code.includes(`'${column}'`) && !code.includes(`"${column}"`), `${path.basename(f)} reads the narrative column ${column}`)
    }
    const readerCode = stripComments(fs.readFileSync(DISPLAY_READER, 'utf8'))
    assert.deepEqual(narrative.filter((column) => readerCode.includes(`'${column}'`) || readerCode.includes(`"${column}"`)).sort(), ['Coach Definition', 'Learning Goal', 'Name', 'description', 'game_form_name', 'identity_statement', 'property_text'], 'the display reader reads exactly its allowlisted narrative columns')
    // The allowlist itself, exactly (a new display column, narrative or not, changes this list and must be argued here). The identity rule's
    // statement was added by the recheck of 6 November (S7): the requirement account prints each requirement as its cell states it, beside
    // the account line, after the decisions; the account's categories, statuses and roles are read through the id-only readers, never this.
    assert.deepEqual(
        DISPLAY_ALLOWLIST.map((a) => `${a.source} ${a.table} ${a.keyColumn} ${a.column}`),
        [
            'planning learning_goals ID Coach Definition',
            'planning learning_goals ID Learning Goal',
            'gameProblems gameProblems ID Name',
            'sportModule game_forms game_form_id game_form_name',
            'contexts controlled_vocabulary value description',
            'contexts properties property_id property_text',
            'contexts identity_rules identity_rule_id identity_statement',
        ],
        'the display reader\'s allowlist, exactly'
    )
    // Who imports the display reader: a static import, require() or import(), in either quotation mark, with or without the extension.
    const importsTheReader = (code: string) => /(?:from\s+|require\(\s*|import\(\s*)['"]\.\/assembly-display(?:\.ts)?['"]/.test(code)
    assert.ok(importsTheReader(`import x from "./assembly-display"`) && importsTheReader(`const x = require('./assembly-display.ts')`) && importsTheReader(`await import( './assembly-display' )`), 'bite: every import form is seen')
    const importers = fs.readdirSync(HERE).filter((f) => f.endsWith('.ts') && f !== 'assembly-display.ts' && importsTheReader(stripComments(fs.readFileSync(path.join(HERE, f), 'utf8'))))
    assert.ok(importers.length > 0 && importers.every((f) => f.startsWith('run-') || f.endsWith('.unit.ts')), `only runners and unit tests import the display reader: ${importers.join(', ')}`)
    // And no other stage file names it at all, in any form (comments aside).
    for (const f of STAGE_FILES.filter((x) => x !== DISPLAY_READER)) assert.ok(!/assembly-display/.test(stripComments(fs.readFileSync(f, 'utf8'))), `${path.basename(f)} names the display reader`)
    assert.ok(listTs(SRC).filter((f) => !f.startsWith(HERE + path.sep)).every((f) => !/assembly-display/.test(fs.readFileSync(f, 'utf8'))), 'nothing outside the folder names the display reader')
    for (const runner of RUNNERS) assert.ok(fs.readFileSync(runner, 'utf8').includes(`'Learning Goal'`), `${path.basename(runner)} is where the display name is read`)
    for (const f of STAGE_FILES) for (const runner of RUNNERS) assert.ok(!fs.readFileSync(f, 'utf8').includes(path.basename(runner, '.ts')), `${path.basename(f)} imports ${path.basename(runner)}`)
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
    const k = committedKnowledge()
    const ids = goalIds(k)
    assert.equal(ids.length, 13)
    // Ids that live in the stage's own data files: Christian's rulings, our entries, the open decisions, the precondition ids.
    const dataIds = [
        ...k.stage2Rulings.rulings.map((r) => r.id),
        ...k.conditionsOfUse.entries.map((e) => e.id),
        ...k.rulings.scopedTranslations.map((r) => r.id),
        ...k.rulings.requirements.map((r) => r.id),
        ...k.rulings.openDecisions.map((d) => d.id),
        ...k.stage2Rulings.openDecisions.map((d) => d.id),
        ...k.stage2Rulings.relevance.structuralPreconditions.items.map((p) => p.id),
    ]
    const escape = (s: string) => s.split('').map((c) => (/[A-Za-z0-9]/.test(c) ? c : `\\${c}`)).join('')
    assert.ok(STAGE_FILES.length >= 8, 'every .ts file of the stage is scanned')
    for (const f of [...STAGE_FILES, ...RUNNERS, path.join(SRC, 'system/sport-module/design-knowledge-sources.ts')]) {
        const source = fs.readFileSync(f, 'utf8')
        for (const id of ids) assert.ok(!new RegExp(`\\b${id}\\b`).test(source), `${path.basename(f)} names the goal ${id}`)
        // Nor any Game Problem, context, Game Form, archetype or row id: no special case for any of them, comments included.
        assert.ok(!/\b(GP-\d{3}|RPC-\d{3}|RPC-REL-\d{3}|RPC-PROP-\d{3}|RPC-ID-\d{3}|RPC-TR-\d{3}|RPC-VAL-\d{3}|LAW-\d+|GF\d+|GA-\d{3}|GAK-\d{4}|OIC-\d{2})\b/.test(source), `${path.basename(f)} names a knowledge id`)
        for (const id of dataIds) assert.ok(!new RegExp(`(^|[^A-Za-z0-9-])${escape(id)}($|[^A-Za-z0-9-])`).test(source), `${path.basename(f)} names the data id ${id}`)
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
    assert.deepEqual(a05.profile?.findings, [], 'no finding remains: the primary now rates FOI as strongly as the secondary')
    assert.deepEqual(a05.profile?.effectiveProfile.ratings.FOI, 'E', 'the effective profile still takes the primary\'s own rating')
    assert.deepEqual(a05.openDecisions.map((d) => d.id), [])
}

/** Christian's D3 withdrew the strength ordering: a context strength changed in a test copy moves no form decision, only its own report. */
function testOneContextStrengthMovesNoFormDecision(): void {
    const before = runStage1ForEveryGoal()
    const decision = (r: Stage1Result) => json([r.gameForm.status, r.gameForm.selected, r.gameForm.compatible, r.gameForm.preference.status, r.gameForm.preference.preferred])
    for (const strength of ['PRIMARY', 'REQUIRED', 'SUPPORTING']) {
        const k = committedKnowledge()
        relationshipRow(k, 'RPC-REL-029')['relationship_strength'] = strength // RPC-003 -> GF7
        const after = byGoal(runStage1ForEveryGoal(k))
        for (const r of before) assert.equal(decision(after[r.learningGoalId]), decision(r), `${r.learningGoalId} with GF7 ${strength}`)
        const diff = changes(before, Object.values(after))
        assert.deepEqual(diff.goals, ['A05', 'TA02'], 'only the two goals routed to that context report the changed row')
        // Only the changed row's own report moves: its strength, the check that quotes it, the compatibility information, the trace role.
        assert.ok(
            diff.paths.every((p) => /\.gameForm\.(candidates\.\d+\.(contextRelationship\.strength|checks\.0\.detail|compatibilityInformation\.contextRelationshipStrength)|trace\.consulted\.\d+\.role)$/.test(p)),
            `unexpected change: ${diff.paths.join(', ')}`
        )
    }
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
        // GF2 declares GP-015 primary and GF3 now secondary: compatibility information only, so the two are alternatives (Christian's D3).
        assert.equal(after[id].gameForm.status, 'COMPATIBLE_ALTERNATIVES', id)
        assert.equal(after[id].gameForm.selected, null, id)
        assert.deepEqual(after[id].gameForm.compatible, ['GF2', 'GF3'], id)
        assert.equal(after[id].gameForm.preference.status, 'INSUFFICIENT_EVIDENCE', id)
    }
    for (const id of goalIds(k).filter((g) => !['A02', 'TA02'].includes(g))) {
        assert.equal(json([after[id].gameForm.status, after[id].gameForm.selected, after[id].gameForm.compatible]), json([byGoal(before)[id].gameForm.status, byGoal(before)[id].gameForm.selected, byGoal(before)[id].gameForm.compatible]), id)
    }
}

function testOneRulingMovesOnlyTheGoalItNames(): void {
    const before = runStage1ForEveryGoal()
    const k = committedKnowledge()
    k.rulings.scopedTranslations[0].secondaryGameProblemIds = []
    const after = byGoal(runStage1ForEveryGoal(k))
    assert.deepEqual(changes(before, Object.values(after)).goals, ['A05'])
    const a05 = after['A05']
    assert.deepEqual(a05.resolution.profile?.findings, [])
    assert.deepEqual(a05.resolution.profile?.rows.map((r) => r.role), ['PRIMARY'])
    assert.deepEqual(a05.resolution.requirements, [], 'the recorded requirement applies only while both related Game Problems are resolved')
    assert.deepEqual(a05.gameForm.compatible, ['GF2', 'GF3', 'GF7'], 'no ordering: GF7 stays a compatible alternative without the secondary')
    assert.equal(a05.gameForm.status, 'COMPATIBLE_ALTERNATIVES')
}

/** A governed preference, if Christian authors one, is honoured: reported as unconditional, the forms staying alternatives (Christian's D3). */
function testAPreferredRelationshipIsHonouredAsAGovernedPreference(): void {
    const k = committedKnowledge()
    relationshipRow(k, 'RPC-REL-028')['relationship_type'] = 'PREFERRED' // RPC-003 -> GF2
    const after = byGoal(runStage1ForEveryGoal(k))
    const f = after['A05'].gameForm
    assert.equal(f.status, 'COMPATIBLE_ALTERNATIVES')
    assert.deepEqual(f.compatible, ['GF2', 'GF3', 'GF7'])
    assert.equal(f.preference.status, 'UNCONDITIONAL_GOVERNED_PREFERENCE')
    assert.deepEqual(f.preference.preferred, ['GF2'])
    assert.match(f.preference.statement, /would still need conditions and a justification by its relevance to the intended learning problem/)
    assert.equal(f.preference.whatCouldDistinguish.find((w) => w.id === 'K1')?.present, true)
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
// Christian's added test: a goal the stage was not developed on, and every goal in the registry
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
        if (r.gameForm.status === 'SELECTED') assert.deepEqual(r.gameForm.compatible, [r.gameForm.selected], r.learningGoalId)
        else if (r.gameForm.status === 'COMPATIBLE_ALTERNATIVES') assert.equal(r.gameForm.preference.status, 'INSUFFICIENT_EVIDENCE', r.learningGoalId)
        else assert.ok(r.resolution.missing.length + r.gameForm.missing.length > 0, `${r.learningGoalId} says nothing about why`)
    }
    assert.deepEqual(summary, {
        A01: 'RESOLVED COMPATIBLE_ALTERNATIVES',
        A02: 'RESOLVED SELECTED GF2',
        A03: 'RESOLVED NO_GOVERNED_RELATIONSHIP_ESTABLISHED',
        A04: 'UNRESOLVED NOT_EVALUATED',
        A05: 'RESOLVED COMPATIBLE_ALTERNATIVES',
        A06: 'UNRESOLVED NOT_EVALUATED',
        D01: 'RESOLVED NO_GOVERNED_RELATIONSHIP_ESTABLISHED',
        D02: 'RESOLVED SELECTED GF4',
        D03: 'RESOLVED NO_GOVERNED_RELATIONSHIP_ESTABLISHED',
        TA01: 'RESOLVED SELECTED GF4',
        TA02: 'RESOLVED SELECTED GF2',
        TD01: 'RESOLVED_NOT_RELATED_TO_CONTEXT NO_GOVERNED_RELATIONSHIP_ESTABLISHED',
        TD02: 'RESOLVED_NOT_RELATED_TO_CONTEXT NO_GOVERNED_RELATIONSHIP_ESTABLISHED',
    })
    assert.deepEqual(byGoal(results)['A01'].gameForm.compatible, ['GF2', 'GF3', 'GF7'], 'withdrawing the strength ordering leaves GF7 a compatible alternative for A01 too')
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
testProgressTheAttackResolvesFromChristiansScopedRuling()
testSecurePossessionResolvesOnItsApprovedRoutingWithTheContextDecisionOpen()
testTheStageReachesNoKeywordParserOrTokenScorer()
testTheStageReadsNoNarrativeColumn()
testEveryDecisionIsIdenticalWhenTheWordingIsRewritten()
testSwappingTwoGoalsWordingChangesNothing()
testNoGoalOrKnowledgeIdAppearsInTheStageCode()
testOneCarRatingMovesOnlyTheProfileThatReadsIt()
testOneContextStrengthMovesNoFormDecision()
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

console.log('design-reasoning Steps 1 and 2 (Stage 1, as amended for Stage 2): all tests passed')
