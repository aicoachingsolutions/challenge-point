/**
 * The relevance trace (B3, 28 October 2026; `relevance-trace.ts`), read where the TEST-ONLY builds hand it back. Christian, his reply filed 30
 * October 2026, item 5: *"For the initial composition test, the explanation should serve as review evidence. It should not turn plausible but
 * unverified interpretations into established facts."* and *"Where a required relationship is missing, the system should identify that gap."*
 *
 * What is pinned:
 *   - the DRAFT join-rule table loads through the TEST-ONLY draft store and is refused whole when a rule's words are not verbatim in its
 *     affordance's definition (the definitions carried since B1: this is their consumer), when it gives Support Availability a rule, when it
 *     names a row the register lacks, a selector attribute or a field the register does not hold there, when it is not marked DRAFT and ours,
 *     or when its anchor defines another affordance; its rules (ids, ceilings, anchors) are pinned as written, and the trace's summary of them;
 *   - the plain Directional Possession game against GP-015: GF2's authored mapping and the matrix's ratings AUTHORIZED; the object-level
 *     inference labelled as such, and never for Support Availability; FOI and CIO reached at INFERRED by approved premises, each coverage row
 *     with what its links do not show; Open Pathway only by an unverified reading, so a gap; Support Availability never graded, a gap, with its
 *     measured facts (5 possible supporters against 6 possible pressers; 100 m2 each; no rule removing a direction, a receiver or a place);
 *     every element read placed by layer, reached or not;
 *   - removing GF2's mapping (a TEST-ONLY reader) leaves no object-level link and names the gap; a context with neither row names both gaps;
 *   - an ASSUMED premise is never better than UNVERIFIED; a DRAFT premise never better than UNVERIFIED (the TA02 composition over the store);
 *   - each grading guard on one element (TEST-ONLY sources, readers and copies): no contract item, a ref holding '::' that names no contract,
 *     the engine's mechanisms and the wording gap kept out of the premises, the element's own item added, a DRAFT realization choice making a
 *     shaping gap, J-CIO-TURNOVER only where play continues, J-OBJ only for an Essential affordance, notInGame only where no block holds a path;
 *   - A01, both versions: the review evidence's own elements are read; the context's authored rows are AUTHORIZED; a goal object is never read
 *     as the task object; a path the realized game does not hold is neither a link nor a gap; his provisional choices (the scoring event, each
 *     adjustment) are shaping gaps resting on PROVISIONAL; every element read placed by layer, reached or not;
 *   - for every trace: an INFERRED element link rests only on approved premises, one an item of a contract the build derived from, and a rule
 *     whose ceiling allows it; no link of any level names an affordance the table marks NONE; every unreached shaping element is a path gap;
 *   - it never feeds selection: no selection module and no coach-text module (the renderer and its sentence modules) reaches
 *     `relevance-trace.ts` through its imports, and only `build-activity.ts` and the TEST-ONLY draft store import it. Modules that import the
 *     build (the live route's, the review's) can reach it, so what holds it out of every answer is that only the TEST-ONLY entry points attach
 *     it: no production answer carries it (checked on the live chain and the review route), and the snapshot holds them all unchanged;
 *   - the trace names no goal, context, form, Game Problem or role (a literal scan of its source);
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
import { AFFORDANCE_TARGET_MATRIX_BY_ID, atmRatingRowOf, CANONICAL_AFFORDANCE_DEFINITIONS, CANONICAL_AFFORDANCES } from '../knowledge-core/affordance-target-matrix'
import { gameFormGameProblemMapping } from '../sport-module/rpc-library'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityForReview, buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords, buildActivityWithSelection } from './build-activity'
import { RELEVANCE_TRACE_STATUS, RelevanceTrace, relevanceJoinRulesRefusals, relevanceTraceOf } from './relevance-trace'
import { ElementProvenance, elementProvenanceOf } from './review-evidence'
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

/**
 * What holds of every trace: an INFERRED element link rests only on approved premises, at least one an item (`<contract>::<item>`) of a contract
 * the build derived from, and a rule allowing it; no link of any level, J-OBJ included, names an affordance the table marks NONE.
 */
const honest = (trace: RelevanceTrace, label: string) => {
    assert.equal(trace.status, RELEVANCE_TRACE_STATUS, label)
    const isItem = (ref: string) => trace.objects.some(object => ref.startsWith(`${object.contractId}::`) && !ref.slice(object.contractId.length + 2).includes(':'))
    for (const element of trace.elements) {
        for (const link of element.links) {
            assert.ok(!noneAffordances.has(link.affordance as any), `${label}: ${element.path} is linked to ${link.affordance}, which takes no rule`)
            if (link.grade !== 'INFERRED') continue
            assert.equal(ceilingOf.get(link.rule!), 'INFERRED', `${label}: ${element.path} is INFERRED by ${link.rule}, a reading`)
            assert.ok(link.premises.length && link.premises.every(premise => premise.standing === 'APPROVED'), `${label}: ${element.path} is INFERRED on ${JSON.stringify(link.premises)}`)
            assert.ok(link.premises.some(premise => isItem(premise.ref)), `${label}: ${element.path} is INFERRED on no knowledge item`)
        }
    }
    for (const link of trace.objectLevel) if (link.rule) assert.ok(!noneAffordances.has(link.affordance as any), `${label}: ${link.from} -> ${link.to} by ${link.rule}, an affordance that takes no rule`)
    assert.deepEqual(trace.measured.affordances, [...noneAffordances], label)
    // The two sentences an administrator reads first, pinned by what they must say.
    for (const words of ['never served and never a selection input', 'AUTHORIZED', 'INFERRED', 'UNVERIFIED', 'GAP', 'Nothing here claims how the activity plays.']) assert.ok(trace.about.includes(words), `${label}: about: ${words}`)
    assert.ok(trace.measured.note.includes('Not evidence that support opportunities emerge'), `${label}: measured.note`)
    // Every shaping element no rule reaches is a gap naming its path, and nothing else is a path gap.
    assert.deepEqual(trace.gaps.filter(gap => gap.path !== null).map(gap => gap.path), trace.notReached.find(group => group.layer === 'SHAPING')?.paths ?? [], `${label}: path gaps`)
}
/** The table's rules as the trace must summarize them, read from the file itself (not the loader). */
const tableSummary = () => ({
    file: 'docs/audits/drafts/relevance-join-rules.DRAFT.json',
    standing: 'DRAFT',
    ours: true,
    objectRule: raw.objectRule.id,
    rules: raw.rules.map((rule: any) => ({ id: rule.id, affordance: rule.affordance, ceiling: rule.ceiling, anchor: `${rule.anchor.metadataKey}: "${rule.anchor.words}"` })),
})
const doesNotShowOf = (id: string): string => raw.rules.find((rule: any) => rule.id === id).doesNotShow
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
    // A where that names a selector attribute or a field the register does not hold would reach nothing, silently: refused.
    const turnover = raw.rules.findIndex((rule: any) => rule.id === 'J-CIO-TURNOVER')
    assert.ok(damaged(t => (t.rules[turnover].where.selector = { TEST_ONLY_trigger: 'POSSESSION_CHANGE' })).some(e => e.includes('TEST_ONLY_trigger is not a selector attribute of the collection T6 sits on')))
    assert.ok(damaged(t => (t.rules[turnover].where.fields = { TEST_ONLY_playState: 'CONTINUE' })).some(e => e.includes('the register holds no field TEST_ONLY_playState on the collection T6 sits on')))
    assert.ok(damaged(t => (t.rules[0].where.selector = { TEST_ONLY_kind: 'ball' })).some(e => e.includes('TEST_ONLY_kind is not a selector attribute of the collection O1 sits on')))
    // The rules as written (ours, DRAFT): ids, ceilings and anchors, so an edit to the table is seen here.
    assert.deepEqual(
        raw.rules.map((rule: any) => [rule.id, rule.affordance, rule.ceiling, `${rule.anchor.metadataKey}: "${rule.anchor.words}"`]),
        [
            ['J-FOI-OBJECT', 'Functional Object Interaction', 'INFERRED', 'car_foi_definition: "the task object"'],
            ['J-CIO-TEAMS', 'Competitive Interaction Opportunity', 'INFERRED', 'car_cio_definition: "competitor"'],
            ['J-OP-TARGET', 'Open Pathway', 'UNVERIFIED', 'car_op_definition: "a functional route"'],
            ['J-CIO-TURNOVER', 'Competitive Interaction Opportunity', 'UNVERIFIED', 'car_cio_definition: "contest, or disrupt developing interaction"'],
        ],
    )
    // No activity-specific engine code: the trace names no goal, context, form, Game Problem or role (the literal scan, as review-evidence's).
    const source = fs.readFileSync(path.join(__dirname, 'relevance-trace.ts'), 'utf8')
    for (const literal of ['A01', 'TA02', 'RPC-0', 'GF2', 'GP-0', 'EM-0', 'BUILDING', 'PRESSING']) assert.ok(!source.includes(literal), literal)

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
    assert.deepEqual(plain.affordances.map(entry => [entry.affordance, entry.rating, entry.required, entry.definition, entry.inference]), CANONICAL_AFFORDANCES.map(a => [a, 'Essential', true, CANONICAL_AFFORDANCE_DEFINITIONS[a], a === SA ? 'NONE' : 'BY_RULE']))
    assert.deepEqual(plain.objects, [{ contractId: 'restated:GF2', objectId: 'GF2', layer: 'GAME_FORM' }, { contractId: 'sport-profile:soccer', objectId: 'sport-profile:soccer', layer: 'CONSTITUTIVE' }])
    assert.deepEqual(plain.joinRules, tableSummary(), 'the trace summarizes the table as the file writes it')

    const authorized = plain.objectLevel.filter(link => link.grade === 'AUTHORIZED')
    assert.deepEqual(
        authorized.map(link => `${link.from} -> ${link.to}: ${link.says}`),
        [
            ...CANONICAL_AFFORDANCES.map(a => `GP-015 -> ${a}: rated Essential`),
            'game form GF2 -> GP-015: primary_game_problem_ids: "GP-015; GP-001"',
            'archetype GA-001 (of game form GF2) -> GP-015: COMPATIBLE: "This Game Problem can occur within the archetype but is weakly diagnostic or usually subordinate." Rationale: "Possession is compatible but remains instrumental to progression rather than terminal."',
        ],
    )
    // The form's mapping is graded AUTHORIZED with who wrote it and the module's own standing beside it.
    assert.equal(
        authorized.find(link => link.from === 'game form GF2')!.why,
        `one authored row makes this link; ${gameFormGameProblemMapping('GF2')!.module.record}; the module's metadata: module_status "DRAFT", approved_by "TBD", approval_date null`,
    )
    assert.ok(authorized.filter(link => link.from !== 'game form GF2').every(link => link.why === 'one authored row makes this link'))
    // J-OBJ for the three Essential affordances that take a rule; Support Availability (inference NONE) keeps only the matrix's own row, above.
    const objectInferred = plain.objectLevel.filter(link => link.grade === 'INFERRED')
    assert.deepEqual(objectInferred.map(link => [link.from, link.to, link.rule, link.level]), CANONICAL_AFFORDANCES.filter(a => a !== SA).map(a => ['game form GF2', a, 'J-OBJ', 'OBJECT']))
    assert.ok(objectInferred.every(link => link.says === joinRules.objectRule.says && link.says.startsWith('Object level:') && link.doesNotShow === joinRules.objectRule.doesNotShow), 'object level, said so')

    assert.deepEqual(best(plain), { 'Functional Object Interaction': 'INFERRED', 'Open Pathway': 'UNVERIFIED', [SA]: 'GAP', 'Competitive Interaction Opportunity': 'INFERRED' })
    const coverage = Object.fromEntries(plain.coverage.map(entry => [entry.affordance, entry]))
    assert.deepEqual(coverage['Functional Object Interaction'].inferredBy, ['objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind'])
    assert.deepEqual(coverage['Competitive Interaction Opportunity'].inferredBy, ['performers.teams'])
    assert.deepEqual(coverage['Competitive Interaction Opportunity'].unverifiedBy, ['transitions[c:restated:GF2:GF2-07.a].playState'])
    assert.deepEqual(coverage['Open Pathway'].unverifiedBy, ['objectives[c:restated:GF2:GF2-08.c].reference', 'objectives[c:restated:GF2:GF2-08.e].reference'])
    // A row at INFERRED shows presence only: each row carries what its best links do not show, in the rule's own words.
    assert.deepEqual(
        plain.coverage.map(entry => [entry.affordance, entry.doesNotShow]),
        [['Functional Object Interaction', [doesNotShowOf('J-FOI-OBJECT')]], ['Open Pathway', [doesNotShowOf('J-OP-TARGET')]], [SA, []], ['Competitive Interaction Opportunity', [doesNotShowOf('J-CIO-TEAMS')]]],
    )
    assert.deepEqual(plain.gaps.map(gap => gap.affordance), ['Open Pathway', SA], 'the two Essential affordances not reached at INFERRED, and nothing else')
    assert.match(plain.gaps[1].missing, /admits no rule for it \(inference NONE\)/)
    assert.equal(plain.elements.flatMap(element => element.links).filter(link => link.affordance === SA).length, 0, 'support is never graded')
    // Every element a rule reached, with its row and layer, and every element no rule reached, by layer.
    assert.deepEqual(
        plain.elements.map(element => [element.path, element.row, element.layer, element.links.map(link => `${link.grade} ${link.rule}`)]),
        [
            ['objectives[c:restated:GF2:GF2-08.c].reference', 'J2', 'GAME_FORM', ['UNVERIFIED J-OP-TARGET']],
            ['objectives[c:restated:GF2:GF2-08.e].reference', 'J2', 'GAME_FORM', ['UNVERIFIED J-OP-TARGET']],
            ['objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind', 'O2', 'CONSTITUTIVE', ['INFERRED J-FOI-OBJECT']],
            ['performers.teams', null, 'GAME_FORM', ['INFERRED J-CIO-TEAMS']],
            ['transitions[c:restated:GF2:GF2-07.a].playState', 'T6', 'GAME_FORM', ['UNVERIFIED J-CIO-TURNOVER']],
        ],
    )
    assert.deepEqual(plain.notReached, [
        {
            layer: 'GAME_FORM',
            paths: [
                'objectives[c:restated:GF2:GF2-08.c].role', 'objectives[c:restated:GF2:GF2-08.c].team', 'objectives[c:restated:GF2:GF2-08.e].role', 'objectives[c:restated:GF2:GF2-08.e].team',
                'performers.teams[c:restated:GF2:GF2-14.a#1].goalkeeper', 'performers.teams[c:restated:GF2:GF2-14.a#1].outfieldCount', 'performers.teams[c:restated:GF2:GF2-14.a#2].goalkeeper', 'performers.teams[c:restated:GF2:GF2-14.a#2].outfieldCount',
                'space.regions[c:restated:GF2:GF2-03.e].noun', 'space.regions[c:restated:GF2:GF2-03.e].position.across', 'space.regions[c:restated:GF2:GF2-03.e].position.along',
                'space.regions[c:restated:GF2:GF2-03.f].noun', 'space.regions[c:restated:GF2:GF2-03.f].position.across', 'space.regions[c:restated:GF2:GF2-03.f].position.along',
                'transitions', 'transitions[c:restated:GF2:GF2-07.a].selector', 'transitions[c:restated:GF2:GF2-07.a].startsEpisode',
            ],
        },
        {
            layer: 'ENGINE_OR_SESSION',
            paths: ['envelope.area.length_m', 'envelope.area.width_m', 'envelope.duration_min', 'envelope.players', 'envelope.roles', 'performers.teams[].goalkeeper', 'performers.teams[].outfieldCount', 'possession.team', 'space.axis', 'value.primaryEvent.kind', 'value.primaryEvent.value'],
        },
    ])
    assert.deepEqual(plain.notInGame, [])
    assert.equal(plain.elementsRead, plain.elements.length + plain.notReached.reduce((n, group) => n + group.paths.length, 0), 'every element read is reached or not reached')

    assert.equal(plain.measured.status, 'FACTS_NOT_GRADES')
    assert.deepEqual(plain.measured.his.map(entry => entry.words), joinRules.affordances.find(entry => entry.affordance === SA)!.his!.map(entry => entry.words))
    const facts = Object.fromEntries(plain.measured.blocks[0].facts.map(fact => [fact.id, fact.value as any]))
    assert.deepEqual(Object.keys(facts), ['SA-1', 'SA-2', 'SA-3', 'SA-4', 'SA-6'])
    assert.deepEqual(facts['SA-1'].teams.map((team: any) => [team.total, team.possibleSupporters, team.possiblePressers]), [[6, 5, 6], [6, 5, 6]])
    assert.deepEqual(facts['SA-1'].neutrals, { count: 0, on: null, joins: null, takesEffect: null })
    assert.deepEqual(facts['SA-2'], { lengthM: 40, widthM: 30, areaM2: 1200, performers: 12, m2PerPerformer: 100 })
    assert.deepEqual(facts['SA-3'], [
        { what: 'action restrictions (R1: a rule changing whether an otherwise available action or target is eligible)', value: 0 },
        { what: 'consequences (V11, including an ACCESS effect, V13)', value: 0 },
        { what: 'time windows (V23)', value: 0 },
        { what: 'value modifiers (V7)', value: 0 },
        { what: 'information rules (V15)', value: 0 },
        { what: 'objective sets (J5)', value: 0 },
        { what: 'regions with the access function (S4)', value: [] },
        { what: 'primary-event conditions of type eligibility (V4)', value: [] },
    ], 'no rule of the plain game removes a direction, a receiver or a place')
    assert.deepEqual(facts['SA-4'], [{ trigger: 'POSSESSION_CHANGE', playState: 'CONTINUE' }])
    assert.equal(facts['SA-6'].length, 2)
}

/*
 * The trace read directly over the plain game's fixture (the reading the build attaches, above), so a TEST-ONLY reader or a TEST-ONLY copy of the
 * contracts changes one premise and nothing else (a build over an ASSUMED copy is refused at structure, so it has no game to read).
 */
interface Over {
    readers?: any
    /** A TEST-ONLY copy of the plain game's fixture to read the provenance from (default: the plain build's own). */
    fixture?: any
    /** A TEST-ONLY change to the provenance read, before the trace reads it. */
    edit?: (elements: ElementProvenance[]) => void
    /** The games the trace reads, from the fixture (default: the one game). */
    games?: (fixture: any) => { blockId: string; holders: Record<string, string>; fixture: any }[]
    learningGoalId?: string
}
const traceOver = (contracts: any[], over: Over = {}): RelevanceTrace => {
    const fixture: any = over.fixture ?? plainBuilt.fixture
    const rendered = (plainBuilt.activity as any).rendered
    const { elements } = elementProvenanceOf({ blocks: [{ blockId: 'game', holders: {}, fixture, contracts, rendered, findings: [], gateChecks: [], owed: [] }], composed: rendered, adjustments: new Map(), relationships: new Map(), index, defaultLaws: null })
    over.edit?.(elements)
    const games = over.games ? over.games(fixture) : [{ blockId: 'game', holders: {}, fixture }]
    return relevanceTraceOf({ elements, contracts, games, gameProblemId: 'GP-015', learningGoalId: over.learningGoalId ?? null, index, joinRules, readers: over.readers ?? {} })
}
const plainContracts = () => JSON.parse(JSON.stringify(derivationInputFor({ selected: [{ id: 'GF2' }], authorization: null, realization: null } as any).contracts))
const copyOf = <T>(value: T): T => JSON.parse(JSON.stringify(value))
/** A TEST-ONLY edit: the element at `path` rests on exactly these sources. */
const restsOn = (at: string, sources: any[]) => (elements: ElementProvenance[]) => {
    const element = elements.find(entry => entry.path === at)
    assert.ok(element, at)
    element!.sources = sources
}
const linksOf = (trace: RelevanceTrace, at: string) => trace.elements.find(element => element.path === at)?.links ?? []

/* ── Without GF2's mapping to the Game Problem (a TEST-ONLY reader), there is no object-level link, and the gap is named ─────── */
{
    assert.deepEqual(traceOver(plainContracts()).coverage, plain.coverage, 'the same reading as the build attached')
    const unmapped = traceOver(plainContracts(), { readers: { gameFormMapping: (id: string) => { const real = gameFormGameProblemMapping(id); return real && { ...real, primary: [], secondary: [] } } } })
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

/* ── Each grading guard on one element at a time: TEST-ONLY sources, readers and fixture copies over the plain game (B3 review MF1, MF2) ── */
{
    const FOI = 'Functional Object Interaction'
    const CIO = 'Competitive Interaction Opportunity'
    const TEAMS = 'performers.teams'
    const engine = { layer: 'GENERAL_ENGINE_MECHANISM', standing: 'APPROVED', ref: 'entailment at assembly', detail: 'TEST-ONLY' }
    const approved = (ref: string) => ({ layer: 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', standing: 'APPROVED', ref, detail: 'TEST-ONLY' })

    // An element resting on no contract item (the engine's approved mechanisms only) is never better than UNVERIFIED.
    const engineOnly = traceOver(plainContracts(), { edit: restsOn(TEAMS, [engine]) })
    honest(engineOnly, 'engine only')
    assert.deepEqual(linksOf(engineOnly, TEAMS).map(link => [link.grade, link.premises.length]), [['UNVERIFIED', 0]])
    assert.match(linksOf(engineOnly, TEAMS)[0].why, /rests on no contract item of the knowledge/)
    assert.equal(engineOnly.elements.find(element => element.path === TEAMS)!.layer, 'ENGINE_OR_SESSION')

    // Only `<contract>::<item>` of a contract the build derived from is a knowledge item: an approved source whose ref merely holds '::' is not.
    for (const ref of ['choice game::V1', 'restated:GF2::GF2-14.a::S3']) {
        const notAnItem = traceOver(plainContracts(), { edit: restsOn(TEAMS, [approved(ref)]) })
        honest(notAnItem, `${ref}: a ref holding :: that is not exactly <contract>::<item>`)
        assert.deepEqual(linksOf(notAnItem, TEAMS).map(link => [link.grade, link.why]), [['UNVERIFIED', linksOf(engineOnly, TEAMS)[0].why]], ref)
        assert.equal(notAnItem.elements.find(element => element.path === TEAMS)!.layer, 'ENGINE_OR_SESSION', ref)
    }

    // The engine's approved mechanisms and the wording gap are no premises: on an approved item and both, the link is INFERRED on the item alone.
    const wordingGap = { layer: 'GENERAL_ENGINE_MECHANISM', standing: 'GAP', ref: 'awaiting approved wording', detail: 'TEST-ONLY' }
    const keptOut = traceOver(plainContracts(), { edit: restsOn(TEAMS, [approved('restated:GF2::GF2-14.a'), engine, wordingGap]) })
    assert.deepEqual(linksOf(keptOut, TEAMS).map(link => [link.grade, link.premises.map(premise => premise.ref)]), [['INFERRED', ['restated:GF2::GF2-14.a']]])

    // The element's own establishing item is a premise even where its provenance omits it: DRAFT there, the link is UNVERIFIED, the element SHAPING.
    const ownDraft = plainContracts()
    ownDraft.find((c: any) => c.contractId === 'sport-profile:soccer').items.find((i: any) => i.itemId === 'SPORT-SOCCER-01').category = DRAFT_KNOWLEDGE
    const KIND = 'objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind'
    const own = traceOver(ownDraft, { edit: restsOn(KIND, [approved('restated:GF2::GF2-14.a')]) })
    honest(own, 'own item DRAFT')
    assert.deepEqual(linksOf(own, KIND).map(link => [link.grade, link.premises.map(premise => `${premise.ref} ${premise.standing}`)]), [['UNVERIFIED', ['restated:GF2::GF2-14.a APPROVED', 'sport-profile:soccer::SPORT-SOCCER-01 DRAFT']]])
    assert.equal(own.elements.find(element => element.path === KIND)!.layer, 'SHAPING')

    // A DRAFT realization choice (a TEST-ONLY copy of the plain game's own choice of its scoring event) makes the element SHAPING and a gap
    // resting on DRAFT, although its ref (`choice <line>`) names no contract: the contracts alone would file it with the engine (MF1).
    const drafted: any = copyOf(plainBuilt.fixture)
    const choice = (drafted.status.choices as any[]).find(entry => entry.path === 'value.primaryEvent.kind')
    assert.ok(choice, 'the plain game chooses its scoring event')
    choice.category = DRAFT_KNOWLEDGE
    const draftChoice = traceOver(plainContracts(), { fixture: drafted })
    honest(draftChoice, 'a DRAFT realization choice')
    assert.deepEqual(draftChoice.notReached.find(group => group.layer === 'SHAPING')?.paths, ['value.primaryEvent.kind'])
    const draftGap = draftChoice.gaps.find(gap => gap.path === 'value.primaryEvent.kind')
    assert.ok(draftGap?.restsOn?.includes('DRAFT'), JSON.stringify(draftChoice.gaps))
    assert.ok(!draftChoice.notReached.find(group => group.layer === 'ENGINE_OR_SESSION')!.paths.includes('value.primaryEvent.kind'))

    // J-CIO-TURNOVER reaches a transition only where play continues: in a TEST-ONLY copy whose play stops, it reaches nothing.
    const stops = traceOver(plainContracts(), {
        games: fixture => {
            const copy = copyOf(fixture)
            for (const member of copy.game.transitions) member.playState = 'TEST-ONLY-STOP'
            return [{ blockId: 'game', holders: {}, fixture: copy }]
        },
    })
    assert.deepEqual(linksOf(stops, 'transitions[c:restated:GF2:GF2-07.a].playState'), [])
    assert.deepEqual(stops.coverage.find(entry => entry.affordance === CIO)!.unverifiedBy, [])

    // A path one block holds and another does not is in the game; only a path no block holds is notInGame (TEST-ONLY blocks without one target).
    const OBJECTIVE = 'objectives[c:restated:GF2:GF2-08.c]'
    const without = (fixture: any) => {
        const copy = copyOf(fixture)
        copy.game.objectives = copy.game.objectives.filter((member: any) => member.elementId !== 'c:restated:GF2:GF2-08.c')
        return copy
    }
    const oneOfTwo = traceOver(plainContracts(), { games: fixture => [{ blockId: 'B1', holders: {}, fixture }, { blockId: 'B2', holders: {}, fixture: without(fixture) }] })
    assert.deepEqual(oneOfTwo.notInGame, [])
    assert.deepEqual(linksOf(oneOfTwo, `${OBJECTIVE}.reference`).map(link => link.grade), ['UNVERIFIED'])
    const neither = traceOver(plainContracts(), { games: fixture => [{ blockId: 'B1', holders: {}, fixture: without(fixture) }, { blockId: 'B2', holders: {}, fixture: without(fixture) }] })
    assert.deepEqual([...neither.notInGame].sort(), [`${OBJECTIVE}.reference`, `${OBJECTIVE}.role`, `${OBJECTIVE}.team`])

    // A context with no row to the Game Problem and none to the goal (a TEST-ONLY reader reads the form as a context with one unrelated row).
    const unrelated = traceOver(plainContracts(), {
        learningGoalId: 'TEST-ONLY-LG',
        readers: { contextRelationships: (id: string) => (id === 'GF2' ? [{ relationshipId: 'TEST-ONLY-REL', library: 'GAME_FORM', relatedId: 'TEST-ONLY-GF', type: 'COMPATIBLE', strength: 'PRIMARY' }] : null) },
    })
    assert.deepEqual(
        unrelated.gaps.filter(gap => gap.missing.startsWith('the context')).map(gap => gap.missing),
        ['the context GF2 has no ACTIVE relationship row to GP-015', 'the context GF2 has no ACTIVE relationship row to TEST-ONLY-LG'],
    )
    assert.ok(!unrelated.objectLevel.some(link => link.from === 'context GF2'), 'no authored row, no link')

    // A Supportive affordance takes no J-OBJ (a TEST-ONLY profile rating FOI Supportive): only the matrix's own row stays.
    const supportive = traceOver(plainContracts(), { readers: { profile: (id: string) => ({ ...AFFORDANCE_TARGET_MATRIX_BY_ID[id], [FOI]: 'Supportive' }) } })
    assert.deepEqual(supportive.objectLevel.filter(link => link.affordance === FOI).map(link => `${link.grade} ${link.from} -> ${link.to}: ${link.says}`), [`AUTHORIZED GP-015 -> ${FOI}: rated Supportive`])
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
    assert.ok(!trace.gaps.some(gap => gap.missing.startsWith('the context')), 'a context with both rows is no gap')
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
    // J-OBJ for each object mapped to GP-005 and each Essential affordance; never Support Availability, which is Supportive here and takes no rule.
    assert.deepEqual(
        trace.objectLevel.filter(link => link.rule === 'J-OBJ').map(link => `${link.from} -> ${link.to}`),
        ['game form GF2', 'context RPC-001'].flatMap(object => ['Functional Object Interaction', 'Open Pathway', 'Competitive Interaction Opportunity'].map(a => `${object} -> ${a}`)),
        version,
    )
    // His provisional choices are shaping elements whatever their refs name (MF1): the scoring event and each adjustment, gaps resting on PROVISIONAL.
    assert.ok(trace.gaps.find(gap => gap.path === 'value.primaryEvent.kind')?.restsOn?.includes('PROVISIONAL'), `${version}: the scoring event`)
    for (const n of [1, 2, 3, 4]) {
        const gaps = trace.gaps.filter(gap => gap.path?.startsWith(`adjustments[A01-ADJ-${n}]`))
        assert.ok(gaps.length && gaps.every(gap => gap.restsOn?.includes('PROVISIONAL')), `${version}: A01-ADJ-${n}`)
    }
    // Every element read, by layer: the ones a rule reached (row and layer), and the ones it did not; the shaping ones are all the rest.
    assert.deepEqual(trace.elements.map(element => [element.path, element.row, element.layer]), [
        ['objectives[c:restated:GF2:GF2-08.c].reference', 'J2', 'GAME_FORM'],
        ['objectives[c:restated:GF2:GF2-08.e].reference', 'J2', version === 'goal' ? 'SHAPING' : 'GAME_FORM'],
        ['objects[c:sport-profile:soccer:SPORT-SOCCER-01]', 'O1', 'CONSTITUTIVE'],
        ['objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind', 'O2', 'CONSTITUTIVE'],
        ['performers.teams', null, 'GAME_FORM'],
        ['transitions[c:restated:GF2:GF2-07.a].playState', 'T6', 'GAME_FORM'],
    ], version)
    const objectives = ['objectives[c:restated:GF2:GF2-08.c].role', 'objectives[c:restated:GF2:GF2-08.c].team', 'objectives[c:restated:GF2:GF2-08.e].role', 'objectives[c:restated:GF2:GF2-08.e].team']
    const envelope = ['envelope.area.length_m', 'envelope.area.width_m', 'envelope.duration_min', 'envelope.players']
    assert.deepEqual(
        trace.notReached.filter(group => group.layer !== 'SHAPING'),
        version === 'zone'
            ? [
                  { layer: 'GAME_FORM', paths: [...objectives, 'space.regions[c:restated:GF2:GF2-03.e].position.across', 'space.regions[c:restated:GF2:GF2-03.f].position.across', 'transitions[c:restated:GF2:GF2-07.a].selector'] },
                  {
                      layer: 'ENGINE_OR_SESSION',
                      paths: [
                          ...envelope, 'layout.marks[mark-1].at', 'layout.marks[mark-2].at', 'layout.marks[mark-3].at', 'layout.movedBy[A01-ADJ-3]', 'layout.policy', 'layout.rectangles[rectangle-1]', 'layout.rectangles[rectangle-2]',
                          'layout.zones[zone-1]', 'layout.zones[zone-1].depthM', 'layout.zones[zone-2]', 'layout.zones[zone-2].depthM', 'space.axis', 'value.primaryEvent.value',
                      ],
                  },
              ]
            : [
                  { layer: 'GAME_FORM', paths: [...objectives, 'space.regions[c:restated:GF2:GF2-03.f].position.across', 'transitions[c:restated:GF2:GF2-07.a].selector'] },
                  { layer: 'ENGINE_OR_SESSION', paths: [...envelope, 'layout.marks[mark-1].at', 'layout.objects[object-1]', 'layout.policy', 'layout.rectangles[rectangle-1]', 'space.axis', 'value.primaryEvent.value'] },
              ],
        version,
    )
    assert.deepEqual(trace.notReached.map(group => group.layer), ['SHAPING', 'GAME_FORM', 'ENGINE_OR_SESSION'], version)
    const placed = new Set([...trace.notInGame, ...trace.elements.map(element => element.path), ...trace.notReached.filter(group => group.layer !== 'SHAPING').flatMap(group => group.paths)])
    const rest = (activity.evidence.provenance.elements as { path: string }[]).map(element => element.path).filter(at => !placed.has(at))
    assert.deepEqual(trace.notReached.find(group => group.layer === 'SHAPING')!.paths, rest, version)
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

    // No production answer carries it. `build-activity.ts` imports it, so every module that imports the build (the live route's, the review's) can
    // reach it through its imports: what holds it out is that only the TEST-ONLY entry points attach it. Checked here on the production entry
    // points — the live chain (`buildActivityWithSelection`, as `activity-review.ts` and the pilot call it) and the review route's build (an
    // administrator's, with drafts) for a goal and a demonstration — and on the TEST-ONLY entry points when no trace is asked; the snapshot
    // holds every production answer unchanged.
    const answers = [
        buildActivityWithSelection({ kind: 'learning-goal', goalId: 'A01', session: { ...session, roles: { ...roles, [keeper]: 1 }, objects: { goal: { count: 0 } } } } as any).activity,
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
    const metadata = (sportModuleWorkbook as any).metadata as Record<string, unknown>
    const record = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', '..', 'docs', 'GAME_FORM_LIBRARY_PROVENANCE.md'), 'utf8')
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
            module: {
                standing: ['module_status', 'approved_by', 'approval_date'].map(field => ({ field, value: metadata[field] === null || metadata[field] === undefined ? null : String(metadata[field]) })),
                record: 'our provenance record (docs/GAME_FORM_LIBRARY_PROVENANCE.md): canonical_game_archetype_id and primary_game_problem_ids on all eleven forms, and secondary_game_problem_ids on all but GF10, entered the module with his authoring pass ingested on 4 August 2026 (1c71f9a)',
            },
        })
    }
    // What the reader cites is what the record says: the 4 August commit, and the three fields it wrote (GF10 without its secondary ids).
    assert.ok(record.includes('`1c71f9a38bb4ed093829879077ff756f013b4a7b` | "Ingest Christian\'s authoring pass — the workbook is now the authority"'))
    assert.ok(record.includes('`canonical_game_archetype_id` and `primary_game_problem_ids` on all eleven, `secondary_game_problem_ids` on all but GF10'))
    assert.equal(gameFormGameProblemMapping('TEST-ONLY-GF'), null)
    const row = (atmWorkbook as any).ratings.find((entry: any) => entry.game_problem_id === 'GP-015')
    assert.deepEqual(atmRatingRowOf('GP-015'), Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)])))
    assert.equal(atmRatingRowOf('TEST-ONLY-GP'), null)
}

console.log = quiet
console.log('relevance-trace unit tests: all cases passed.')
