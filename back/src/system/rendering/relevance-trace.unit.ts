/**
 * The relevance trace (B3, 28 October 2026; `relevance-trace.ts`), read where the TEST-ONLY builds hand it back. Christian, his reply filed 30
 * October 2026, item 5: *"For the initial composition test, the explanation should serve as review evidence. It should not turn plausible but
 * unverified interpretations into established facts."* and *"Where a required relationship is missing, the system should identify that gap."*
 *
 * What is pinned:
 *   - the DRAFT join-rule table loads through the TEST-ONLY draft store and is refused whole when a rule's words are not verbatim in its
 *     affordance's definition (the definitions carried since B1: this is their consumer), when it gives Support Availability a rule, when it
 *     names a row the register lacks, when it is not marked DRAFT and ours, or when its anchor defines another affordance;
 *   - the plain Directional Possession game against GP-015: GF2's authored mapping and the matrix's ratings AUTHORIZED; the object-level
 *     inference labelled as such; FOI and CIO reached at INFERRED by approved premises; Open Pathway only by an unverified reading, so a gap;
 *     Support Availability never graded, a gap, with its measured facts (5 possible supporters against 6 possible pressers; 100 m2 each);
 *   - removing GF2's mapping (a TEST-ONLY reader) leaves no object-level link and names the gap;
 *   - an ASSUMED premise is never better than UNVERIFIED; a DRAFT premise never better than UNVERIFIED (the TA02 composition over the store);
 *   - A01, both versions: the review evidence's own elements are read; the context's authored rows are AUTHORIZED; a goal object is never read
 *     as the task object; a path the realized game does not hold is neither a link nor a gap;
 *   - for every trace: an INFERRED element link rests only on approved premises and a rule whose ceiling allows it; no element link names an
 *     affordance the table marks NONE;
 *   - it never feeds selection or coach text: no selection module and no coach-text module reaches `relevance-trace.ts` through its imports,
 *     only `build-activity.ts` and the TEST-ONLY draft store import it, and no production answer carries it;
 *   - the two readers added for it hand back the knowledge verbatim (every game form's mapping cells; GP-015's Ratings Grid row).
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import atmWorkbook from '../knowledge-core/atm-workbook.rc1.2.json'
import sportModuleWorkbook from '../sport-module/soccer-module.rc1-v3.json'
import { loadRegister } from '../derivation/corpus'
import { DraftStoreRefused, loadDraftStore, loadRelevanceJoinRules, RELEVANCE_JOIN_RULES_FILE } from '../derivation/draft-store'
import { indexRegister } from '../derivation/register'
import { derivationInputFor } from '../derivation/run-bounded-selection'
import { DRAFT_KNOWLEDGE } from '../derivation/types'
import { atmRatingRowOf, CANONICAL_AFFORDANCE_DEFINITIONS, CANONICAL_AFFORDANCES } from '../knowledge-core/affordance-target-matrix'
import { gameFormGameProblemMapping } from '../sport-module/rpc-library'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityForReview, buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords } from './build-activity'
import { RELEVANCE_TRACE_STATUS, RelevanceTrace, relevanceJoinRulesRefusals, relevanceTraceOf } from './relevance-trace'
import { elementProvenanceOf } from './review-evidence'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}

const index = indexRegister(loadRegister())
const joinRules = loadRelevanceJoinRules()
const raw = JSON.parse(fs.readFileSync(RELEVANCE_JOIN_RULES_FILE, 'utf8'))
const roles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const keeper = specializedRoleNames()[0]
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles }
const records = learningGoalAuthorizations()
const SA = 'Support Availability'
const ceilingOf = new Map(joinRules.rules.map(rule => [rule.id, rule.ceiling]))
const noneAffordances = new Set(joinRules.affordances.filter(entry => entry.inference === 'NONE').map(entry => entry.affordance))

/** What holds of every trace: an INFERRED element link rests only on approved premises, at least one a knowledge item, and a rule allowing it. */
const honest = (trace: RelevanceTrace, label: string) => {
    assert.equal(trace.status, RELEVANCE_TRACE_STATUS, label)
    for (const element of trace.elements) {
        for (const link of element.links) {
            assert.ok(!noneAffordances.has(link.affordance as any), `${label}: ${element.path} is linked to ${link.affordance}, which takes no rule`)
            if (link.grade !== 'INFERRED') continue
            assert.equal(ceilingOf.get(link.rule!), 'INFERRED', `${label}: ${element.path} is INFERRED by ${link.rule}, a reading`)
            assert.ok(link.premises.length && link.premises.every(premise => premise.standing === 'APPROVED'), `${label}: ${element.path} is INFERRED on ${JSON.stringify(link.premises)}`)
            assert.ok(link.premises.some(premise => premise.ref.includes('::')), `${label}: ${element.path} is INFERRED on no knowledge item`)
        }
    }
    assert.deepEqual(trace.measured.affordances, [...noneAffordances], label)
}
const best = (trace: RelevanceTrace) => Object.fromEntries(trace.coverage.map(entry => [entry.affordance, entry.best]))

/* ── The DRAFT join-rule table ────────────────────────────────────────────────────────────────────────────────────────────── */
{
    assert.equal(joinRules.standing, 'DRAFT')
    assert.equal(joinRules.ours, true)
    assert.equal(joinRules.file, 'docs/audits/drafts/relevance-join-rules.DRAFT.json')
    assert.deepEqual(relevanceJoinRulesRefusals(raw, index), [])
    assert.deepEqual([...noneAffordances], [SA], 'Support Availability takes no rule')
    // The B1 definitions' consumer: every rule's words are in its affordance's definition as carried from the workbook.
    for (const rule of joinRules.rules) assert.ok(CANONICAL_AFFORDANCE_DEFINITIONS[rule.affordance].includes(rule.anchor.words), rule.id)

    const damaged = (edit: (table: any) => void): string[] => {
        const copy = JSON.parse(JSON.stringify(raw))
        edit(copy)
        return relevanceJoinRulesRefusals(copy, index)
    }
    assert.ok(damaged(t => (t.rules[0].anchor.words = 'the shared object')).some(e => e.includes('is not verbatim in the definition (car_foi_definition)')), 'words not in the definition')
    assert.ok(
        damaged(t => t.rules.push({ ...t.rules[1], id: 'TEST-ONLY-SA', affordance: SA, anchor: { metadataKey: 'car_sa_definition', words: 'another performer' } })).some(e => e.includes('Support Availability takes no rule')),
        'no rule may infer Support Availability',
    )
    assert.ok(damaged(t => (t.rules[1].rows = ['P1', 'TEST-ONLY-ROW'])).some(e => e.includes('the register holds no row TEST-ONLY-ROW')))
    assert.ok(damaged(t => (t.standing = 'APPROVED')).some(e => e.includes('standing must say DRAFT')))
    assert.ok(damaged(t => (t.ours = false)).some(e => e.includes('ours must be true')))
    assert.ok(damaged(t => (t.rules[0].anchor.metadataKey = 'car_op_definition')).some(e => e.includes('defines Open Pathway, not Functional Object Interaction')))
    assert.ok(damaged(t => (t.affordances = t.affordances.filter((entry: any) => entry.affordance !== SA))).some(e => e.includes('Support Availability must be listed once (found 0)')))
    assert.ok(damaged(t => (t.rules[0].extra = 1)).some(e => e.includes('the key extra is not one this table holds')))

    // Refused whole by the loader, through the store's own refusal.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b3-join-rules-'))
    const file = path.join(dir, 'relevance-join-rules.DRAFT.json')
    fs.writeFileSync(file, JSON.stringify({ ...raw, rules: [{ ...raw.rules[0], anchor: { ...raw.rules[0].anchor, words: 'TEST-ONLY words' } }, ...raw.rules.slice(1)] }))
    assert.throws(() => loadRelevanceJoinRules(file), (error: unknown) => error instanceof DraftStoreRefused && error.reasons.some(reason => reason.includes('"TEST-ONLY words" is not verbatim')))
    fs.rmSync(dir, { recursive: true, force: true })
}

/* ── The plain Directional Possession game, against GP-015 ───────────────────────────────────────────────────────────────── */
const plainBuilt = buildActivityFromKnowledge(['GF2'], session, { relevance: { joinRules, gameProblemId: 'GP-015' } })
const plain = plainBuilt.activity.relevance!
{
    assert.equal(plainBuilt.activity.outcome, 'served')
    honest(plain, 'plain GF2')
    assert.equal(plain.gameProblem.id, 'GP-015')
    assert.equal(plain.gameProblem.name, 'Maintain Possession')
    assert.equal(plain.gameProblem.ratingRow?.validation_status, 'Approved; SA flagged for field validation')
    assert.deepEqual(plain.gameProblem.keyedNotes, [{ key: 'gp015_validation_flag', value: 'SA=E retained', notes: 'Direct legacy migration retained; field validation recommended.' }])
    assert.deepEqual(plain.affordances.map(entry => [entry.affordance, entry.rating, entry.required, entry.definition]), CANONICAL_AFFORDANCES.map(a => [a, 'Essential', true, CANONICAL_AFFORDANCE_DEFINITIONS[a]]))
    assert.deepEqual(plain.objects, [{ contractId: 'restated:GF2', objectId: 'GF2', layer: 'GAME_FORM' }, { contractId: 'sport-profile:soccer', objectId: 'sport-profile:soccer', layer: 'CONSTITUTIVE' }])

    const authorized = plain.objectLevel.filter(link => link.grade === 'AUTHORIZED')
    assert.deepEqual(
        authorized.map(link => `${link.from} -> ${link.to}: ${link.says}`),
        [
            ...CANONICAL_AFFORDANCES.map(a => `GP-015 -> ${a}: rated Essential`),
            'game form GF2 -> GP-015: primary_game_problem_ids: "GP-015; GP-001"',
            'archetype GA-001 (of game form GF2) -> GP-015: COMPATIBLE: "This Game Problem can occur within the archetype but is weakly diagnostic or usually subordinate." Rationale: "Possession is compatible but remains instrumental to progression rather than terminal."',
        ],
    )
    const objectInferred = plain.objectLevel.filter(link => link.grade === 'INFERRED')
    assert.deepEqual(objectInferred.map(link => [link.from, link.to, link.rule, link.level]), CANONICAL_AFFORDANCES.map(a => ['game form GF2', a, 'J-OBJ', 'OBJECT']))
    assert.ok(objectInferred.every(link => link.says === joinRules.objectRule.says && link.says.startsWith('Object level:') && link.doesNotShow === joinRules.objectRule.doesNotShow), 'object level, said so')

    assert.deepEqual(best(plain), { 'Functional Object Interaction': 'INFERRED', 'Open Pathway': 'UNVERIFIED', [SA]: 'GAP', 'Competitive Interaction Opportunity': 'INFERRED' })
    const coverage = Object.fromEntries(plain.coverage.map(entry => [entry.affordance, entry]))
    assert.deepEqual(coverage['Functional Object Interaction'].inferredBy, ['objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind'])
    assert.deepEqual(coverage['Competitive Interaction Opportunity'].inferredBy, ['performers.teams'])
    assert.deepEqual(coverage['Competitive Interaction Opportunity'].unverifiedBy, ['transitions[c:restated:GF2:GF2-07.a].playState'])
    assert.deepEqual(coverage['Open Pathway'].unverifiedBy, ['objectives[c:restated:GF2:GF2-08.c].reference', 'objectives[c:restated:GF2:GF2-08.e].reference'])
    assert.deepEqual(plain.gaps.map(gap => gap.affordance), ['Open Pathway', SA], 'the two Essential affordances not reached at INFERRED, and nothing else')
    assert.match(plain.gaps[1].missing, /admits no rule for it \(inference NONE\)/)
    assert.equal(plain.elements.flatMap(element => element.links).filter(link => link.affordance === SA).length, 0, 'support is never graded')

    assert.equal(plain.measured.status, 'FACTS_NOT_GRADES')
    assert.deepEqual(plain.measured.his.map(entry => entry.words), joinRules.affordances.find(entry => entry.affordance === SA)!.his!.map(entry => entry.words))
    const facts = Object.fromEntries(plain.measured.blocks[0].facts.map(fact => [fact.id, fact.value as any]))
    assert.deepEqual(Object.keys(facts), ['SA-1', 'SA-2', 'SA-3', 'SA-4', 'SA-6'])
    assert.deepEqual(facts['SA-1'].teams.map((team: any) => [team.total, team.possibleSupporters, team.possiblePressers]), [[6, 5, 6], [6, 5, 6]])
    assert.deepEqual(facts['SA-1'].neutrals, { count: 0, on: null, joins: null, takesEffect: null })
    assert.deepEqual(facts['SA-2'], { lengthM: 40, widthM: 30, areaM2: 1200, performers: 12, m2PerPerformer: 100 })
    assert.deepEqual(facts['SA-4'], [{ trigger: 'POSSESSION_CHANGE', playState: 'CONTINUE' }])
    assert.equal(facts['SA-6'].length, 2)
}

/*
 * The trace read directly over the plain game's fixture (the reading the build attaches, above), so a TEST-ONLY reader or a TEST-ONLY copy of the
 * contracts changes one premise and nothing else (a build over an ASSUMED copy is refused at structure, so it has no game to read).
 */
const traceOver = (contracts: any[], readers: any = {}): RelevanceTrace => {
    const fixture: any = plainBuilt.fixture
    const rendered = (plainBuilt.activity as any).rendered
    const { elements } = elementProvenanceOf({ blocks: [{ blockId: 'game', holders: {}, fixture, contracts, rendered, findings: [], gateChecks: [], owed: [] }], composed: rendered, adjustments: new Map(), relationships: new Map(), index, defaultLaws: null })
    return relevanceTraceOf({ elements, contracts, games: [{ blockId: 'game', holders: {}, fixture }], gameProblemId: 'GP-015', learningGoalId: null, index, joinRules, readers })
}
const plainContracts = () => JSON.parse(JSON.stringify(derivationInputFor({ selected: [{ id: 'GF2' }], authorization: null, realization: null } as any).contracts))

/* ── Without GF2's mapping to the Game Problem (a TEST-ONLY reader), there is no object-level link, and the gap is named ─────── */
{
    assert.deepEqual(traceOver(plainContracts()).coverage, plain.coverage, 'the same reading as the build attached')
    const unmapped = traceOver(plainContracts(), { gameFormMapping: (id: string) => { const real = gameFormGameProblemMapping(id); return real && { ...real, primary: [], secondary: [] } } })
    assert.ok(!unmapped.objectLevel.some(link => link.from === 'game form GF2'), JSON.stringify(unmapped.objectLevel.map(link => link.from)))
    assert.ok(unmapped.gaps.some(gap => gap.missing === 'no selected game form (GF2) has an authored relationship to GP-015'))
}

/* ── An ASSUMED premise is never better than UNVERIFIED ──────────────────────────────────────────────────────────────────── */
{
    const contracts = plainContracts()
    for (const [contractId, itemId] of [['restated:GF2', 'GF2-14.a'], ['sport-profile:soccer', 'SPORT-SOCCER-01']]) contracts.find((c: any) => c.contractId === contractId).items.find((i: any) => i.itemId === itemId).basis = 'ASSUMED'
    const assumed = traceOver(contracts)
    honest(assumed, 'ASSUMED premises')
    assert.deepEqual(best(assumed), { 'Functional Object Interaction': 'UNVERIFIED', 'Open Pathway': 'UNVERIFIED', [SA]: 'GAP', 'Competitive Interaction Opportunity': 'UNVERIFIED' })
    const teams = assumed.elements.find(element => element.path === 'performers.teams')!.links[0]
    assert.equal(teams.grade, 'UNVERIFIED')
    assert.match(teams.why, /a premise is not approved knowledge: restated:GF2::GF2-14.a \(OUR_READING\)/)
    assert.deepEqual(assumed.gaps.map(gap => gap.affordance), ['Functional Object Interaction', 'Open Pathway', SA, 'Competitive Interaction Opportunity'])
}

/* ── The TA02 composition test over the draft store: a DRAFT premise is never better than UNVERIFIED, and the gaps say DRAFT ─── */
{
    const drafts = loadDraftStore('ta02-composition')
    const rpc003 = (contracts: any[]) => contracts.find(contract => contract.contractId === 'restated:RPC-003')
    const standIns = (contracts: any[]) => {
        rpc003(contracts).items.find((item: any) => item.itemId === 'RPC-003-11.b').value = { objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored: 'TEST-ONLY PR-1: not his ruling' }
        rpc003(contracts).items.push({
            itemId: 'RPC-003-12.c', origId: 'RPC-003-12', row: 'V5', selector: 'type=control', requirement: 'EQUALS',
            value: { objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored: 'TEST-ONLY PR-2: not his ruling' },
            strictness: 'REQUIRED', valueStatus: 'REQUIRED_RANGE', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', basisEvidence: 'TEST-ONLY PR-2: not his ruling',
            checkability: 'PARTLY_STRUCTURAL', structuralClause: 'TEST-ONLY', fitNote: 'TEST-ONLY PR-2', category: DRAFT_KNOWLEDGE,
        })
        rpc003(contracts).items = rpc003(contracts).items.filter((item: any) => !['RPC-003-10.a', 'RPC-003-10.b'].includes(item.itemId))
    }
    const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'TA02', session }, records, { drafts, review: { includeDrafts: true }, alter: standIns, relevance: { joinRules } })
    const trace = built.activity.relevance!
    assert.equal(built.activity.outcome, 'refused')
    honest(trace, 'TA02 composition')
    assert.equal(trace.gameProblem.id, 'GP-015', 'the goal\'s Game Problem, as selection resolved it')
    assert.ok(trace.objects.some(object => object.contractId === 'restated:RPC-003' && object.layer === 'SHAPING'))
    const said = trace.objectLevel.map(link => `${link.grade} ${link.from} -> ${link.to} (${link.source ?? link.rule})`)
    for (const row of ['AUTHORIZED context RPC-003 -> GP-015 (the context workbook, RPC-REL-026)', 'AUTHORIZED context RPC-003 -> TA02 (the context workbook, RPC-REL-068)', 'AUTHORIZED context RPC-003 -> game form GF2 (the context workbook, RPC-REL-028)']) assert.ok(said.includes(row), row)
    for (const element of trace.elements) for (const link of element.links) if (link.premises.some(premise => premise.standing === 'DRAFT')) assert.equal(link.grade, 'UNVERIFIED', element.path)
    const draftGaps = trace.gaps.filter(gap => gap.path?.includes('RPC-003'))
    assert.ok(draftGaps.length >= 6 && draftGaps.every(gap => gap.restsOn?.includes('DRAFT')), JSON.stringify(draftGaps))
    assert.deepEqual(best(trace), best(plain), 'the draft context adds no affordance the plain game does not reach')
}

/* ── A01, both versions, through the review evidence's own elements ──────────────────────────────────────────────────────── */
for (const [version, objects] of [
    ['zone', { goal: { count: 0 } }],
    ['goal', { goal: { count: 1, type: 'scaled', widthM: 3.6576 } }],
] as const) {
    const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { ...session, roles: { ...roles, [keeper]: 1 }, objects } } as any, records, { review: { includeDrafts: true }, relevance: { joinRules } })
    const activity: any = built.activity
    const trace = activity.relevance as RelevanceTrace
    assert.equal(activity.outcome, 'served', version)
    honest(trace, `A01 ${version}`)
    assert.equal(trace.elementsRead, activity.evidence.provenance.elements.length, 'the review evidence\'s own elements')
    assert.equal(trace.gameProblem.id, 'GP-005')
    assert.equal(trace.measured.blocks.length, 2, 'every role block measured')
    const said = trace.objectLevel.map(link => `${link.grade} ${link.from} -> ${link.to}: ${link.says}`)
    for (const row of ['AUTHORIZED context RPC-001 -> GP-005: COMPATIBLE PRIMARY', 'AUTHORIZED context RPC-001 -> A01: COMPATIBLE PRIMARY', 'AUTHORIZED game form GF2 -> GP-005: secondary_game_problem_ids: "GP-005"']) assert.ok(said.includes(row), `${version}: ${row}`)
    assert.deepEqual(best(trace), { 'Functional Object Interaction': 'INFERRED', 'Open Pathway': 'UNVERIFIED', [SA]: 'GAP', 'Competitive Interaction Opportunity': 'INFERRED' }, version)
    assert.equal(trace.affordances.find(entry => entry.affordance === SA)!.rating, 'Supportive')
    assert.ok(!trace.gaps.some(gap => gap.affordance === SA), 'a Supportive affordance is reported, not required')
    // A goal object is never read as the task object; the context's own object, identified with the environment's, is not in the game.
    const foi = trace.elements.filter(element => element.links.some(link => link.affordance === 'Functional Object Interaction')).map(element => element.path)
    assert.deepEqual(foi, ['objects[c:sport-profile:soccer:SPORT-SOCCER-01]', 'objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind'], version)
    assert.deepEqual(trace.notInGame, ['objects[c:restated:RPC-001:RPC-001-10.a].kind'], version)
    if (version === 'goal') assert.ok(trace.gaps.some(gap => gap.path === 'objects[c:provisional:A01-R2:A01-R2-O1-1].kind' && gap.restsOn?.includes('PROVISIONAL')), 'the goal object is a shaping element no rule relates')
}

/* ── It never feeds selection or coach text ──────────────────────────────────────────────────────────────────────────────── */
{
    const SRC = path.resolve(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(SRC)
    const SPECIFIER = /(?:from|require\s*\(|import\s*\()\s*['"](\.[^'"]*)['"]/g
    const resolve = (from: string, specifier: string): string | null => {
        const base = path.resolve(path.dirname(from), specifier)
        return [`${base}.ts`, path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate)) ?? null
    }
    const closure = (starts: string[]): Set<string> => {
        const seen = new Set(starts)
        const queue = [...starts]
        while (queue.length) {
            const file = queue.shift()!
            for (const match of fs.readFileSync(file, 'utf8').matchAll(SPECIFIER)) {
                const next = resolve(file, match[1])
                if (next && !seen.has(next)) {
                    seen.add(next)
                    queue.push(next)
                }
            }
        }
        return seen
    }
    const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
    const selection = files.filter(file => /select/i.test(path.basename(file)))
    for (const expected of ['system/derivation/run-bounded-selection.ts', 'system/sport-module/guided-selection.ts', 'system/sport-module/context-selection.ts']) assert.ok(selection.map(relative).includes(expected), expected)
    const coach = ['render-concrete-game', 'coach-overview', 'coach-diagram', 'overview-fidelity', 'derived-wording', 'sections', 'fidelity', 'field-diagram'].map(name => path.join(__dirname, `${name}.ts`))
    for (const [label, starts] of [['selection', selection], ['coach text', coach]] as const) {
        const reached = [...closure(starts)].map(relative)
        assert.ok(reached.length > starts.length, `${label}: the closure reads imports`)
        assert.ok(!reached.includes('system/rendering/relevance-trace.ts'), `${label} reaches the relevance trace`)
    }
    const IMPORTS = /(from|require\s*\(|import\s*\()\s*['"][^'"]*relevance-trace['"]/
    assert.deepEqual(files.filter(file => IMPORTS.test(fs.readFileSync(file, 'utf8'))).map(relative).sort(), ['system/derivation/draft-store.ts', 'system/rendering/build-activity.ts'])

    // No production answer carries it: the review route's build (an administrator's, with drafts) for a goal and a demonstration, and the TEST-ONLY
    // entry points when no trace is asked.
    const answers = [
        buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', session: { ...session, roles: { ...roles, [keeper]: 1 }, objects: { goal: { count: 0 } } } }, { includeDrafts: true }),
        buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session }, { includeDrafts: true }),
        buildActivityFromKnowledge(['GF2'], session).activity,
        buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'TA02', session }, records, { drafts: loadDraftStore('ta02-composition') }).activity,
    ]
    for (const answer of answers) {
        assert.equal((answer as any).relevance, undefined, answer.title)
        assert.ok(!JSON.stringify(answer).includes(RELEVANCE_TRACE_STATUS), answer.title)
    }
}

/* ── The readers added for it hand back the knowledge verbatim ───────────────────────────────────────────────────────────── */
{
    const forms = (sportModuleWorkbook as any).game_forms as Record<string, unknown>[]
    assert.equal(forms.length, 11)
    for (const form of forms) {
        const mapping = gameFormGameProblemMapping(String(form.game_form_id))!
        const cell = (field: string) => (form[field] === null || form[field] === undefined ? null : String(form[field]))
        const split = (field: string) => (cell(field) ?? '').split(';').map(id => id.trim()).filter(Boolean)
        assert.deepEqual(mapping, {
            gameFormId: form.game_form_id,
            archetypeId: cell('canonical_game_archetype_id'),
            primary: split('primary_game_problem_ids'),
            secondary: split('secondary_game_problem_ids'),
            fields: ['canonical_game_archetype_id', 'primary_game_problem_ids', 'secondary_game_problem_ids'].map(field => ({ field, value: cell(field) })),
        })
    }
    assert.equal(gameFormGameProblemMapping('TEST-ONLY-GF'), null)
    const row = (atmWorkbook as any).ratings.find((entry: any) => entry.game_problem_id === 'GP-015')
    assert.deepEqual(atmRatingRowOf('GP-015'), Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)])))
    assert.equal(atmRatingRowOf('TEST-ONLY-GP'), null)
}

console.log = quiet
console.log('relevance-trace unit tests: all cases passed.')
