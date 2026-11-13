/**
 * **Stage A1 of the A02 package: the review-level run A02-HPE1 served, with the PROPOSED restart** (13 November 2026). TEST-ONLY review
 * evidence: nothing here is served to a coach, written to production knowledge or approved wording, or an authorization.
 *
 * Christian, received 12 November 2026: "Produce one complete A02 activity through the checked pathway, at review level, with all required
 * conditions grounded in approved knowledge." "Resolve the identified renderer issue concerning the attacking team's name." "I'd also like the
 * eventual activity to make clear how coordinated pressure arises repeatedly and meaningfully within the game structure."
 *
 * The lead's decisions of round 2 (section B-I), each pinned here, every value measured first (scratchpad pkg4/A1):
 *   R1 the renderer and fidelity read the register the game was derived over, through a TEST-ONLY scoped override set only on a build given our
 *      CANDIDATE wording (render-concrete-game.ts `underDerivationRegister`); the escape line is then set out;
 *   R2 in the own-event branch only, each role's sentence cites its own objective's role (production path; inert in production, measured by the
 *      snapshot, A01's pins and the bundle diff, never here);
 *   R3 where the two teams' targets differ (a zone beyond the marked line, the other team's end line), the one sentence naming each target comes
 *      only from our CANDIDATE wording file (its template CANDIDATE_TARGETS_BY_ROLE), read only beside a PROPOSED configuration; without it the
 *      renderer withholds exactly as before; every claim of the words is read from the realized game first;
 *   R4 the PROPOSED restart (question Q6): transitions at the start, after a score and when the ball goes over either end line, through the
 *      existing transition rows only (T1-T7); the restart policy row is not written (one restart per trigger), the kick-off stays owed;
 *   R6 the Coach Overview and the diagram through the existing machinery only: the diagram is served, the overview withheld (pinned as measured).
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-hpe1-served.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { DraftStoreRefused, loadProposedRealization, PROPOSED_HPE1_FILE } from '../derivation/draft-store'
import { indexRegister } from '../derivation/register'
import { registerWith } from '../derivation/run-bounded-selection'
import { approvedTemplateSentences, approvedWording } from '../rendering/approved-wording'
import { buildActivity } from '../rendering/build-activity'
import { CANDIDATE_COACH_WORDING_FILE, candidateTable, candidateTemplates, candidateWordingRefusals, loadCandidateWording } from '../rendering/candidate-coach-wording'
import { checkFidelity } from '../rendering/fidelity'
import { CANDIDATE_TARGETS_BY_ROLE, renderConcreteGame, underDerivationRegister } from '../rendering/render-concrete-game'
import { VALUE_LABELS } from './assembly'
import { ChainAnswer, ChainRequest, HandoffChain, HandoffResult, runHandoffCases } from './handoff'
import { candidateWordingSourcesOf, realChain, sessionOf } from './handoff-chain.unit'
import { committedKnowledge } from './knowledge'
import { inputs as a02Inputs } from './a02.unit'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
const MAIN = require.main === module
function test(name: string, run: () => void): void {
    if (!MAIN) return
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
if (MAIN) quiet(`stage A1 of the A02 package: the review-level run A02-HPE1 served, with the PROPOSED restart (the lead's decisions R1 to R6)`)

const HERE = __dirname
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))
const SOURCES = candidateWordingSourcesOf(a02Inputs.rulings.map((r) => ({ id: r.id, words: r.words, received: r.received })))
const REVIEW = 'A02-HPE1'
const BLOCK1 = 'ESCAPING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END'
const BLOCK2 = 'ESCAPING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START'
const P = (item: string) => `c:proposed:A02-HPE1:${item}`
const G = (item: string) => `c:restated:GF2:${item}`
/** The escape line set out (decision R1) and our CANDIDATE template's sentence (decision R3), as the renderer says them. */
const ESCAPE_LINE = "Mark a line across the area, 12 m from the escaping team's end line"
const TARGETS = "The escaping team attacks the zone beyond the marked line; the pressing team attacks the escaping team's end line"
const BOUND = "near the escaping team's own end, with the pressing team set to press together"

// ---------------------------------------------------------------------------------------------------------------------------------------
// The runs: the three HPE-1 cases through the handoff and the real chain, each request, answer and built activity captured (read-only wraps).
// ---------------------------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildModule = require('../rendering/build-activity')
const entry = buildModule.buildActivityUnderAuthorizationRecords
let lastBuilt: any = null
buildModule.buildActivityUnderAuthorizationRecords = (...args: unknown[]) => (lastBuilt = entry(...args))

interface Made {
    result: HandoffResult
    request: ChainRequest
    answer: ChainAnswer
    built: any
}
const made = new Map<string, Made>()
if (MAIN) {
    const capture: HandoffChain = {
        build: (r) => {
            const answer = realChain.build(r)
            made.set(r.caseId, { result: null as unknown as HandoffResult, request: copy(r), answer, built: lastBuilt })
            return answer
        },
    }
    const ids = ['A02-HPE1', 'A02-HPE1-S', 'A02-HPE1-L']
    for (const result of runHandoffCases({ ...a02Inputs, cases: a02Inputs.cases.filter((c) => ids.includes(c.id)) }, capture, committedKnowledge())) made.get(result.caseId)!.result = result
}
const at = (id: string): Made => {
    const m = made.get(id)
    assert.ok(m, `no run ${id}`)
    return m
}
/** One more build of a captured request, changed, through the real chain: its answer and its built activity. */
function buildWith(base: string, change: (r: ChainRequest) => void): { answer: ChainAnswer; built: any } {
    const request = copy(at(base).request)
    change(request)
    const answer = realChain.build(request)
    return { answer, built: lastBuilt }
}
/** A TEST-ONLY copy of a file, changed, in a temporary folder; its absolute path. */
function fileCopy(file: string, change: (raw: any) => void): string {
    const raw = readJson(file)
    change(raw)
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-a1-'))
    const out = path.join(dir, path.basename(file))
    fs.writeFileSync(out, JSON.stringify(raw, null, 2))
    return out
}
const blocksOf = (id: string): { blockId: string; fixture: any }[] => at(id).built.fixture.roleBlocks.blocks
const blockOf = (id: string, blockId: string): any => blocksOf(id).find((b) => b.blockId === blockId)!.fixture

// The tables a TEST-ONLY build hands the renderer, and the register copy its game was derived over (the configuration's roles, as the build
// derives it: run-bounded-selection.ts withProposedRoles over no store overlay, measured: the store a02-composition writes none).
const WORDING = loadCandidateWording(SOURCES)
const TABLE = [...approvedWording(), ...candidateTable(WORDING)]
const TEMPLATES = [...approvedTemplateSentences(), ...candidateTemplates(WORDING)]
const CONFIGURATION = loadProposedRealization(PROPOSED_HPE1_FILE, { lawDepartures: true })
const DERIVED = indexRegister(registerWith(loadRegister(), { episodeScopes: [], treatmentId: '', roles: CONFIGURATION.roles, rolesTreatmentId: 'TT-PROPOSED-HPE1-LAWS' }))
/** One block's game rendered with the TEST-ONLY tables, over the register it was derived over (R1) or the production register. */
const render = (fixture: any, options: { derived?: boolean; templates?: any[] } = {}) => {
    const run = () => renderConcreteGame(fixture, TABLE, options.templates ?? TEMPLATES)
    return options.derived === false ? run() : underDerivationRegister(DERIVED, run)
}
const textsOfRendering = (rendered: { instructions: { text: string }[] }) => rendered.instructions.map((i) => i.text)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The served run
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the run (decisions R1 to R4): A02-HPE1 served at review level, fidelity violations 0, every sentence marked, the pending entry Q2 only, the kick-off still owed (PROCEDURAL, reported), every configuration item labelled with the question it waits on; A02-HPE1-S and A02-HPE1-L keep their stops', () => {
    const m = at(REVIEW)
    assert.deepEqual([m.answer.outcome, m.answer.stage, m.answer.reasons, m.answer.withheld, m.answer.sentencesServed], ['served', null, [], [], true])
    const integrity = m.built.activity.integrity
    assert.deepEqual([integrity.realizationAuthorized, integrity.postRealizationValidated, integrity.instructions, integrity.fidelityViolations], [true, true, 19, 0])
    const byMarker = (w: string) => m.answer.sentences.filter((s) => s.wording === w).length
    assert.deepEqual([byMarker('APPROVED'), byMarker('CANDIDATE'), byMarker('DRAFT'), m.answer.sentences.length], [1, 2, 16, 19])
    assert.deepEqual(m.answer.laws?.owed, ['LAW-8'])
    assert.equal(m.answer.laws?.reportedForReview.length, 1)
    assert.ok(m.answer.laws!.reportedForReview[0].startsWith('LAW-8 at the game: an adaptation is owed; PROCEDURAL under our DRAFT classification'))
    const level = m.built.activity.reviewLevel
    assert.deepEqual(level.pendingApproval.map((p: any) => [p.item, p.questionId]), [['proposed:A02-HPE1::A02-HPE1-B9-1', 'Q2']])
    const items: { itemId: string; category: string; waitsOn: string | null }[] = level.proposedElements.items
    assert.equal(items.length, 21)
    assert.deepEqual(items.filter((i) => i.category === 'ILLUSTRATIVE').map((i) => i.itemId), ['A02-HPE1-S5-1'])
    assert.ok(items.every((i) => ['PROPOSED', 'ILLUSTRATIVE'].includes(i.category) && !!i.waitsOn), 'every item labelled, with its question')
    assert.deepEqual(['Q1', 'Q2', 'Q6'].map((q) => items.filter((i) => i.waitsOn === q).length), [9, 3, 9])
    assert.deepEqual([at('A02-HPE1-S').answer.stage, at('A02-HPE1-L').answer.stage], ['communication', 'validation'])
    assert.ok(at('A02-HPE1-L').answer.reasons.some((r) => r.includes('LAW-11 (Law 11 (Offside)) at the game: an adaptation is owed')), 'A02-HPE1-L still refuses on LAW-11 (its bite)')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// R1: the register the game was derived over (TEST-ONLY)
// ---------------------------------------------------------------------------------------------------------------------------------------

test('R1 the renderer and fidelity read the register the game was derived over, only through the TEST-ONLY override: with it the escape line is set out in each block and nothing is withheld; over the production register (bite) the line is not set out and fidelity finds it uncarried; build-activity.ts sets the override only on a build given our CANDIDATE wording', () => {
    for (const blockId of [BLOCK1, BLOCK2]) {
        const fixture = blockOf(REVIEW, blockId)
        const derived = render(fixture)
        assert.ok(textsOfRendering(derived).includes(ESCAPE_LINE), `${blockId}: the escape line is set out`)
        assert.deepEqual(derived.withheld, [], `${blockId}: nothing withheld`)
        const report = underDerivationRegister(DERIVED, () => checkFidelity(fixture, derived, TABLE))
        assert.deepEqual(report.findings.filter((f: any) => f.severity === 'VIOLATION'), [], `${blockId}: no fidelity violation`)
        // Bite: the same game over the production register (no escaping role): the line is not set out, and fidelity says so.
        const production = render(fixture, { derived: false })
        assert.ok(!textsOfRendering(production).includes(ESCAPE_LINE), `${blockId}: over the production register the line is not set out`)
        const productionReport = checkFidelity(fixture, production, TABLE)
        assert.ok(productionReport.findings.some((f: any) => f.severity === 'VIOLATION' && String(f.what).startsWith(`space.regions[${P('A02-HPE1-S2-1')}].position.across is established by the game and no instruction carries it`)), `${blockId}: bite`)
    }
    // The override is scoped: outside the call the production register is read again (the same production rendering, before and after).
    const fixture = blockOf(REVIEW, BLOCK1)
    assert.deepEqual(textsOfRendering(render(fixture, { derived: false })), textsOfRendering(render(fixture, { derived: false })))
    // Statically: the two calls in build-activity.ts are each the arm of a `wordingTable ?` (our CANDIDATE wording, read only beside a PROPOSED
    // configuration); production passes no wording, so it takes the other arm.
    const source = fs.readFileSync(path.resolve(HERE, '..', 'rendering', 'build-activity.ts'), 'utf8').split(/\r?\n/)
    const calls = source.filter((l) => l.includes('underDerivationRegister(')).map((l) => l.trim())
    assert.deepEqual(calls, [
        'const said = wordingTable ? underDerivationRegister(index, () => renderConcreteGame(assembled, wordingTable, templateTable)) : renderConcreteGame(assembled)',
        'const report = wordingTable ? underDerivationRegister(index, () => checkFidelity(assembled, rendered, wordingTable)) : checkFidelity(assembled, rendered)',
    ])
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// R2: each role cites its own objective
// ---------------------------------------------------------------------------------------------------------------------------------------

test("R2 in the own-event branch each role's sentence cites its own objective's role, in each block (the pressing team's its end-line objective, the escaping team's its zone objective); the bounded-credit branch (A01's) is untouched", () => {
    const own = { [BLOCK1]: { escaping: G('GF2-08.c'), pressing: G('GF2-08.e') }, [BLOCK2]: { escaping: G('GF2-08.e'), pressing: G('GF2-08.c') } }
    for (const blockId of [BLOCK1, BLOCK2]) {
        const said = render(blockOf(REVIEW, blockId)).instructions
        const pressing = said.find((i) => i.text === 'Pressing team: Score by getting the ball across the line it is attacking')!
        const escaping = said.find((i) => i.text.startsWith('Escaping team: Score by getting the ball under control into its target zone'))!
        assert.ok(pressing.from.includes(`objectives[${own[blockId].pressing}].role`) && !pressing.from.includes(`objectives[${own[blockId].escaping}].role`), `${blockId}: the pressing team's sentence`)
        assert.ok(escaping.from.includes(`objectives[${own[blockId].escaping}].role`) && !escaping.from.includes(`objectives[${own[blockId].pressing}].role`), `${blockId}: the escaping team's sentence`)
    }
    // The change sits in the own-event branch only: its one line in the renderer, after `else if (ownEvents)`, before the bounded branch's end.
    const renderer = fs.readFileSync(path.resolve(HERE, '..', 'rendering', 'render-concrete-game.ts'), 'utf8')
    const branch = renderer.indexOf('} else if (ownEvents) {')
    const mapped = renderer.indexOf('const ownPaths = said.paths.map(')
    assert.ok(branch > 0 && mapped > branch && renderer.indexOf('} else if (!how) withholdKind(kindPath)', branch) > mapped, 'the mapping lies inside the own-event branch')
    assert.equal(renderer.split('const ownPaths = said.paths.map(').length, 2, 'one mapping')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// R3: the two targets in our CANDIDATE words, only from the CANDIDATE file
// ---------------------------------------------------------------------------------------------------------------------------------------

test('R3 the two targets named in one sentence of our CANDIDATE template, CANDIDATE, citing both objectives; without the template the run refuses exactly as before (the zone objective withheld, the pressing objective needed to begin); the renderer reads no template carrying an approval, and says nothing where the game does not hold what the words claim; each defect of a template refuses the file; production says none of it', () => {
    const said = at(REVIEW).answer.sentences.filter((s) => s.text === TARGETS)
    assert.deepEqual(said.map((s) => [s.section, s.wording]), [['How to score', 'CANDIDATE']])
    for (const o of ['GF2-08.c', 'GF2-08.e']) for (const f of ['team', 'reference', 'role']) assert.ok(said[0].from.includes(`objectives[${G(o)}].${f}`), `${o}.${f}`)
    assert.deepEqual(WORDING.templates.map((t) => [t.id, t.template, t.sentence]), [['A02-HPE1-T1', CANDIDATE_TARGETS_BY_ROLE, `${TARGETS}.`]])
    // Without the template (the CANDIDATE file without it): refused at communication, exactly the withholding production makes for such targets.
    const without = buildWith(REVIEW, (r) => (r.candidateWording!.file = fileCopy(CANDIDATE_COACH_WORDING_FILE, (c) => delete c.templates))).answer
    assert.deepEqual([without.outcome, without.stage], ['refused', 'communication'])
    assert.deepEqual(without.withheld.map((w) => w.path), [`objectives[${G('GF2-08.c')}].reference`, `objectives[${G('GF2-08.e')}].reference`])
    assert.deepEqual(without.reasons, [
        `block ${BLOCK1}: awaiting approved wording: objectives[${G('GF2-08.c')}].reference (J2)`,
        `block ${BLOCK1}: fidelity Q3: objectives[${G('GF2-08.e')}].team is needed to understand and begin the activity, and only a section consulted when needed carries it`,
        `block ${BLOCK1}: fidelity Q3: objectives[${G('GF2-08.e')}].reference is needed to understand and begin the activity, and only a section consulted when needed carries it`,
        `block ${BLOCK2}: awaiting approved wording: objectives[${G('GF2-08.e')}].reference (J2)`,
        `block ${BLOCK2}: fidelity Q3: objectives[${G('GF2-08.c')}].team is needed to understand and begin the activity, and only a section consulted when needed carries it`,
        `block ${BLOCK2}: fidelity Q3: objectives[${G('GF2-08.c')}].reference is needed to understand and begin the activity, and only a section consulted when needed carries it`,
    ])
    assert.ok(!without.sentences.some((s) => s.text === TARGETS))
    // The renderer's own guard: a template under the name that carries an approval is never read (the gate refuses it first; this is the second line).
    const fixture = blockOf(REVIEW, BLOCK1)
    const approvedCopy = TEMPLATES.map((t) => (t.id === CANDIDATE_TARGETS_BY_ROLE ? { ...copy(t), approvedBy: { who: 'Christian', date: '2026-11-13', quote: TARGETS, ccs: 'RC2' } } : t))
    const refusedTemplate = render(fixture, { templates: approvedCopy as any[] })
    assert.ok(!textsOfRendering(refusedTemplate).includes(TARGETS) && refusedTemplate.withheld.some((w) => w.path === `objectives[${G('GF2-08.c')}].reference`), 'a template carrying an approval is not read')
    // Each claim is read from the game: the line target moved to the zone team's attacking end, or the zone not beginning beyond the marked
    // line, and nothing is said (the zone objective withheld, as without the template).
    const geometryAt = (f: any, leaf: string) => f.status.geometry.find((g: any) => g.path === leaf)
    const moved = copy(fixture)
    geometryAt(moved, `space.regions[${G('GF2-03.e')}].position.along`).geometry.interval = { from: 40, to: 40 }
    const notBeyond = copy(fixture)
    geometryAt(notBeyond, `space.regions[${G('GF2-03.f')}].position.along`).geometry.relation.term = 'own end (of team T)'
    for (const [name, changed] of [['the line target moved', moved], ['the zone not beyond the line', notBeyond]] as const) {
        const r = render(changed)
        assert.ok(!textsOfRendering(r).includes(TARGETS) && r.withheld.some((w) => w.path === `objectives[${G('GF2-08.c')}].reference`), `${name}: not said`)
    }
    // The gate, each defect refusing the file.
    const raw = readJson(CANDIDATE_COACH_WORDING_FILE)
    const refuses = (alter: (c: any) => void, expected: string) => {
        const c = copy(raw)
        alter(c)
        const reasons = candidateWordingRefusals(c, SOURCES)
        assert.ok(reasons.some((r) => r.includes(expected)), `the gate refuses: ${expected} (it said ${JSON.stringify(reasons)})`)
    }
    refuses((c) => (c.templates[0].approvedBy = { who: 'Christian' }), 'carries approvedBy: a candidate template is never approved wording')
    refuses((c) => (c.templates[0].template = 'POSSESSION_CONTINUES'), 'and the renderer reads our words only as CANDIDATE_TARGETS_BY_ROLE')
    refuses((c) => (c.templates[0].parts = ['The {who} attacks the {zoneNoun} beyond the marked line']), 'the slot {who} is none the renderer fills')
    refuses((c) => (c.templates[0].sentence = 'The escaping team attacks the zone.'), 'its parts with its example values read')
    refuses((c) => (c.templates[0].candidateBy.who = 'Christian'), "not 'ours'")
    refuses((c) => (c.templates[0].candidateBy.rulings[0].quote = 'Resolve the renderer issue.'), 'not verbatim in the recorded ruling A02-12NOV-PACKAGE')
    refuses((c) => (c.templates[0].sentence = `${c.templates[0].sentence} ${SOURCES.never[0]}`), 'which no candidate sentence may say')
    assert.deepEqual(candidateWordingRefusals(raw, SOURCES), [], 'the file itself passes')
    // Production: the coach's builds (A02 refused, A01 served) never say the sentence.
    const a02 = { kind: 'learning-goal', goalId: 'A02', situationId: null, session: sessionOf(at(REVIEW).request.session) } as any
    const a01 = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf({ ...at(REVIEW).request.session, players: 12, specializedRoles: 1, goals: 0, durationMin: 20 }) } as any
    for (const b of [buildActivity(a02), buildActivity(a01)]) assert.ok(!JSON.stringify(b).includes(TARGETS) && !JSON.stringify(b).includes(CANDIDATE_TARGETS_BY_ROLE))
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// R4: the PROPOSED restart (question Q6)
// ---------------------------------------------------------------------------------------------------------------------------------------

test('R4 the PROPOSED restart through the existing transition rows: in each block the start, a score and the ball over either end line stop and restart play, awarded to the escaping team, taken by one of its players from the feet at a place the coach chooses; the opening holder is the escaping team; no item writes the restart policy (one restart per trigger), so the throw-in still applies and the kick-off stays owed; said in three DRAFT sentences; the coach decides each place (a stand-in, so labelled); the gate refuses a ruling claimed and an item-level departure', () => {
    for (const blockId of [BLOCK1, BLOCK2]) {
        const game = blockOf(REVIEW, blockId).game
        const restarts = (game.transitions as any[]).filter((t) => t.playState === 'STOP_RESUME')
        assert.deepEqual(restarts.map((t) => [t.elementId, t.selector[0].value, t.awardedTo, t.placement.actor, t.placement.method, t.placement.region]), [
            [P('A02-HPE1-T1-3'), 'OUT_END_LINE', 'ROLE_HOLDER_ESCAPING', "a player of the team in this element's T2", 'FROM_THE_FEET', { coachDecides: BOUND }],
            [P('A02-HPE1-T1-1'), 'START', 'ROLE_HOLDER_ESCAPING', "a player of the team in this element's T2", 'FROM_THE_FEET', { coachDecides: BOUND }],
            [P('A02-HPE1-T1-2'), 'SCORE', 'ROLE_HOLDER_ESCAPING', "a player of the team in this element's T2", 'FROM_THE_FEET', { coachDecides: BOUND }],
        ])
        assert.deepEqual(restarts[0].qualifiers, { endLine: 'EACH_TEAM' })
        assert.deepEqual([game.possession?.team, game.restartPolicy], ['ROLE_HOLDER_ESCAPING', undefined])
        const laws = blockOf(REVIEW, blockId).defaultLaws.laws as any[]
        const status = (law: string) => laws.filter((l) => l.law === law).map((l) => l.status)
        assert.deepEqual([status('LAW-8'), status('LAW-15'), status('LAW-11'), status('LAW-16'), status('LAW-17')], [['ADAPTATION_OWED'], ['APPLIES'], ['DEPARTED'], ['NOT_APPLICABLE', 'NOT_APPLICABLE'], ['NOT_APPLICABLE', 'NOT_APPLICABLE']])
    }
    assert.deepEqual(at(REVIEW).answer.lines.filter((l) => l.lineId === 'game::RP1').map((l) => l.kind), ['NOT_ESTABLISHED'])
    const texts = at(REVIEW).answer.sentences.map((s) => [s.section, s.wording, s.text])
    assert.deepEqual(texts.filter(([, , t]) => String(t).includes('restarts play')), [
        ['How it works', 'DRAFT', 'A player of the escaping team restarts play: at the start and after either team scores'],
        ['Restarts and ball out', 'DRAFT', 'A player of the escaping team restarts play from the feet, with the ball still or moving'],
        ['Restarts and ball out', 'DRAFT', `You choose where a player of the escaping team restarts play, ${BOUND}`],
        ['Restarts and ball out', 'DRAFT', `If the ball goes out over either end line, a player of the escaping team restarts play, from the feet, with the ball still or moving; you choose where (${BOUND})`],
    ])
    assert.ok(!texts.some(([, , t]) => String(t).startsWith('Pick which team starts with the ball')), 'the opening pick is replaced by the start')
    // The coach decides each place: the case's stand-in for that decision on the PROPOSED item's line, ILLUSTRATIVE, and said to be one.
    assert.deepEqual(at(REVIEW).request.choices.map((c) => [c.lineId, c.because]), ['T1-1', 'T1-2', 'T1-3'].map((t) => [`${P(`A02-HPE1-${t}`)}::T4`, `${VALUE_LABELS.ILLUSTRATIVE}: a stand-in for the coach's decision on a line our PROPOSED configuration opens, its bound the PROPOSED item's words, for this case only`]))
    // Every restart item is PROPOSED and waits on Q6, which quotes the request it answers.
    const q6 = CONFIGURATION.questions.find((q) => q.id === 'Q6')!
    assert.ok(q6.askedFor.startsWith('"Through a representative restart that recreates the relevant pressure conditions." (received 12 November 2026)'))
    assert.ok(q6.asks.includes('never stands in for the pressure condition'))
    // The gate: a restart item claiming a ruling is refused; so is an item carrying a departure (why the kick-off stays owed: a replacing departure
    // is recorded on an item, which a PROPOSED item may not carry).
    const claimed = fileCopy(PROPOSED_HPE1_FILE, (c) => (c.proposed.realization.items.find((i: any) => i.id === 'A02-HPE1-T1-2').basis = 'OWNER_RULING'))
    assert.throws(() => loadProposedRealization(claimed), (e: unknown) => e instanceof DraftStoreRefused && e.message.includes("claims OWNER_RULING: a PROPOSED item never claims a ruling of Christian's"))
    const departing = fileCopy(PROPOSED_HPE1_FILE, (c) => (c.proposed.realization.items.find((i: any) => i.id === 'A02-HPE1-T1-1').departsFrom = [{ law: 'LAW-8', extent: 'WHOLE' }]))
    assert.throws(() => loadProposedRealization(departing), (e: unknown) => e instanceof DraftStoreRefused && e.message.includes('carries departsFrom, which only a ruled restatement or a provisional realization writes'))
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// R6: the Coach Overview and the diagram, through the existing machinery only
// ---------------------------------------------------------------------------------------------------------------------------------------

test('R6 the Coach Overview and the diagram through the existing machinery (measured, no new production code): the diagram is served in both blocks, the marked line 12 m from the escaping team\'s end line; the overview is withheld, on the gaps and findings pinned here', () => {
    const activity = at(REVIEW).built.activity
    assert.deepEqual([activity.diagramDraft.served, activity.diagramDraft.findings], [true, []])
    const blocks = activity.diagram.blocks as any[]
    assert.deepEqual(
        blocks.map((b) => [b.label, b.lines.map((l: any) => [l.along.from, l.markedLine]), b.zones.map((z: any) => [z.along.from, z.along.to, z.state]), b.dimensions.filter((d: any) => d.kind === 'LINE_OFFSET').map((d: any) => d.label)]),
        [
            ['Block 1', [[12, true], [0, false]], [[12, 40, 'TARGET']], ['12 m']],
            ['Block 2', [[28, true], [40, false]], [[0, 28, 'TARGET']], ['12 m']],
        ],
    )
    const overview = activity.overviewDraft
    assert.equal(activity.overview, undefined, 'the overview is not served')
    assert.deepEqual([overview.served, overview.check.verdict], [false, 'FAIL'])
    const violations = (overview.check.findings as any[]).filter((f) => f.severity === 'VIOLATION').map((f) => `${f.question} ${f.blockId === BLOCK1 ? 'block 1' : f.blockId === BLOCK2 ? 'block 2' : 'activity'}: ${String(f.what).slice(0, 70)}`)
    // Measured: the overview's composer has no words for where the pressing team's target lies (a line at the other team's end, beside a zone
    // target), so each block has a gap and no game sentence (7.0); and the overview's check reads the approved table alone, so our CANDIDATE
    // condition sentence's 'only if' is held to the obligation lexicon there (7.7), which Details fidelity, reading our CANDIDATE wording as it
    // reads approved wording (stage B2), does not. Each needs new production code (overview wording, or our CANDIDATE wording threaded into the
    // overview), which decision R6 does not authorize: reported, not built.
    assert.deepEqual(violations, [
        '7.0 block 1: the overview has a gap (game): no wording here says where the pressing',
        '7.0 block 2: the overview has a gap (game): no wording here says where the pressing',
        '7.0 block 1: the overview has no game sentence for this block',
        "7.7 block 1: the escaping team's sentence 1 \"An escaping team's score counts only i",
        "7.7 block 1: the pressing team's sentence 1 \"An escaping team's score counts only i",
        '7.0 block 2: the overview has no game sentence for this block',
        "7.7 block 2: the escaping team's sentence 1 \"An escaping team's score counts only i",
        "7.7 block 2: the pressing team's sentence 1 \"An escaping team's score counts only i",
    ])
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-hpe1-served.unit.ts'))
})

if (MAIN) quiet(`a02 HPE-1 served (stage A1): ${passed} passed`)
