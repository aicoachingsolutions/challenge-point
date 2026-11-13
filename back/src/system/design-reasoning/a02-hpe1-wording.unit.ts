/**
 * **Stage B2 of the A02 complete-activity package: our CANDIDATE coach wording, the PROPOSED LAW-11 departure, the APPROVED / CANDIDATE /
 * DRAFT markers and the review-level label, through the checked pathway** (12 November 2026). TEST-ONLY review evidence: nothing here is served
 * to a coach, written to production knowledge or approved wording, or an authorization.
 *
 * Christian, received 12 November 2026: "Please prepare candidate coach-facing wording for my review, with the complete approved meaning
 * preserved in the underlying representation." "Produce one complete A02 activity through the checked pathway, at review level, with all
 * required conditions grounded in approved knowledge." "Likewise, please identify any necessary Law 11 decision in the context of the proposed
 * activity rather than expanding into a general Laws-of-the-Game redesign."
 *
 * What is pinned, every value measured first (scratchpad pkg3/B2):
 *   the stop: A02-HPE1 (the review-level run) passes structure, realization and validation and is refused at COMMUNICATION, with our
 *     CANDIDATE wording said and the condition carried; what remains are four limits of the production renderer (named in the test);
 *   W1 the CANDIDATE wording's gate (`candidate-coach-wording.ts`), with a bite per refusal and a stale value that withholds the fields;
 *   W2 the markers: no CANDIDATE sentence reads APPROVED, with its bite; the review-level label;
 *   W3 production never sees it: the coach's and the review route's builds carry no review-level key or CANDIDATE marker (A01 among them),
 *     the option is refused without a PROPOSED configuration, and the static scan, each with its bite;
 *   W4 team names, as measured;
 *   W5 LAW-11: 'There is no offside' said once from the PROPOSED departure, with three bites, A01-R1's departure untouched;
 *   W6 conditions, not solutions, with two bites;
 *   W7 the four-part print (four-part-print.unit.ts), printed here, every sentence once and every ILLUSTRATIVE quantity labelled.
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-hpe1-wording.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadProvisionalRealizations } from '../derivation/corpus'
import { DraftStoreRefused, loadProposedRealization, PROPOSED_HPE1_FILE } from '../derivation/draft-store'
import { approvedWording } from '../rendering/approved-wording'
import { buildActivity, buildActivityForReview, buildActivityUnderAuthorizationRecords } from '../rendering/build-activity'
import { CANDIDATE_COACH_WORDING_FILE, CandidateWordingRefused, candidateTable, candidateWordingRefusals, loadCandidateWording } from '../rendering/candidate-coach-wording'
import { approvedSentences } from '../rendering/render-concrete-game'
import { actionWordsIn } from '../sport-module/action-words'
import { displayCell } from './assembly-display'
import { fourPartPrint, printRefusals, SaidSentence } from './four-part-print.unit'
import { ChainAnswer, ChainRequest, HandoffChain, HandoffResult, runHandoffCases } from './handoff'
import { candidateWordingSourcesOf, productionRecords, realChain, sessionOf } from './handoff-chain.unit'
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
if (MAIN) quiet(`stage B2 of the A02 complete-activity package: our CANDIDATE coach wording and the PROPOSED LAW-11 departure, at review level (Christian's reply received 12 November 2026)`)

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))
const SOURCES = candidateWordingSourcesOf(a02Inputs.rulings.map((r) => ({ id: r.id, words: r.words, received: r.received })))
const W1 = 'A02-HPE1-W1'
const NO_OFFSIDE = 'There is no offside'
/** Stage A1 (decision R3): our CANDIDATE template's sentence as the renderer says it (a coach-facing sentence carries no full stop). */
const TARGETS_SENTENCE = "The escaping team attacks the zone beyond the marked line; the pressing team attacks the escaping team's end line"

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
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-b2-'))
    const out = path.join(dir, path.basename(file))
    fs.writeFileSync(out, JSON.stringify(raw, null, 2))
    return out
}
const sentences = (id: string) => at(id).answer.sentences
const textsOf = (id: string) => sentences(id).map((s) => s.text)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The stop
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * Measured 12 November 2026 (scratchpad pkg3/B2/logs). Each reason names its block; both blocks fail alike. The first eight before stage B2
 * (A02-HPE1-S: the condition's seven fields awaiting approved wording, with their seven fidelity Q3 findings) are gone: our CANDIDATE sentence
 * says them. What remains are four limits of the production renderer, none of wording:
 *   (1) the escape line is never set out: the renderer reads the PRODUCTION register, which holds no ESCAPING role, so the end its offset is
 *       measured from cannot be read (realization/team-ends.ts through render-concrete-game.ts `participants()`): Q3 on S2-1's across and along;
 *   (2) a role scoring by its own event cites the first objective's role, not its own: Q2 on the pressing sentence, Q3 on GF2-08.e's role;
 *   (3) targets of two nouns (a zone and a line) have no sentence saying what each team attacks: the zone objective's reference withheld (J2);
 *   (4) so the pressing team's target is named only in Role exchange: Q3 on its objective's team and reference ('needed to begin').
 */
const STOP_REASONS = (block: string, escapingObjective: string, pressingObjective: string) => [
    `block ${block}: awaiting approved wording: objectives[c:restated:GF2:${escapingObjective}].reference (J2)`,
    `block ${block}: fidelity Q3: space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].position.across is established by the game and no instruction carries it`,
    `block ${block}: fidelity Q3: objectives[c:restated:GF2:GF2-08.e].role is established by the game and no instruction carries it`,
    `block ${block}: fidelity Q3: objectives[c:restated:GF2:${pressingObjective}].team is needed to understand and begin the activity, and only a section consulted when needed carries it`,
    `block ${block}: fidelity Q3: objectives[c:restated:GF2:${pressingObjective}].reference is needed to understand and begin the activity, and only a section consulted when needed carries it`,
    `block ${block}: fidelity Q3: space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].position.along is needed to understand and begin the activity, and only a section consulted when needed carries it`,
]

/*
 * Stage A1 (13 November 2026), re-pinned openly. BEFORE: A02-HPE1 refused at communication with the thirteen reasons STOP_REASONS lists (and
 * the Q2 finding on the pressing team's sentence), the zone objective's reference withheld in each block. AFTER: served at review level, no
 * reason and nothing withheld: the lead's decisions R1 (the register the game was derived over), R2 (each role's own objective), R3 (the two
 * targets in our CANDIDATE words) and R4 (the PROPOSED restart). STOP_REASONS stays as the record of what the four limits were.
 */
void STOP_REASONS
test('the run: A02-HPE1 (the review-level run) passes structure, realization and validation, says the condition in our CANDIDATE words, and is served at review level (stage A1; was refused at communication on four limits of the production renderer)', () => {
    const a = at('A02-HPE1').answer
    assert.deepEqual([a.outcome, a.stage, a.reasons, a.withheld], ['served', null, [], []])
    assert.equal(at('A02-HPE1').built.activity.integrity.fidelityViolations, 0)
    assert.equal(at('A02-HPE1-S').answer.withheld.filter((w) => w.path.startsWith('value.primaryEvent.conditions')).length, 14, 'without our wording, the seven condition fields of each block are withheld (A02-HPE1-S)')
    // Validation passed: the configuration's own REPORT check, held by the harness to our DRAFT classification, owes LAW-8 only, PROCEDURAL.
    assert.deepEqual(a.laws?.owed, ['LAW-8'])
    // The pending entry names Q2, and only Q2.
    assert.deepEqual(at('A02-HPE1').built.activity.reviewLevel.pendingApproval.map((p: any) => [p.item, p.questionId]), [['proposed:A02-HPE1::A02-HPE1-B9-1', 'Q2']])
    // The two other runs keep their stage-B1 stops (no departure, no wording): A02-HPE1-S at communication, A02-HPE1-L at validation on LAW-11.
    assert.deepEqual([at('A02-HPE1-S').answer.stage, at('A02-HPE1-L').answer.stage], ['communication', 'validation'])
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// W1: the CANDIDATE wording's gate
// ---------------------------------------------------------------------------------------------------------------------------------------

test('W1 the CANDIDATE wording passes its gate whole; each defect refuses the file (approvedBy, a quote not verbatim, a restated row not verbatim, a standing without CANDIDATE, a cover outside the rows only approved words say, the live origin sentence, the live next pass); a stale value leaves the fields withheld and the build refuses', () => {
    const wording = loadCandidateWording(SOURCES)
    assert.deepEqual(wording.entries.map((e) => e.id), [W1])
    assert.deepEqual(wording.printerOnly.map((p) => [p.id, p.part, p.label]), [
        ['A02-HPE1-S3', 'Setup', 'PROPOSED'],
        ['A02-HPE1-S6', 'Setup', 'CANDIDATE'],
        ['A02-HPE1-K3', 'Scoring', 'CANDIDATE'],
        ['A02-HPE1-K4', 'Scoring', 'CANDIDATE'],
        ['A02-HPE1-L2', 'Learning explanation', 'CANDIDATE'],
    ])
    const raw = readJson(CANDIDATE_COACH_WORDING_FILE)
    const refuses = (alter: (c: any) => void, expected: string) => {
        const c = copy(raw)
        alter(c)
        const reasons = candidateWordingRefusals(c, SOURCES)
        assert.ok(reasons.some((r) => r.includes(expected)), `the gate refuses: ${expected} (it said ${JSON.stringify(reasons)})`)
    }
    refuses((c) => (c.entries[0].approvedBy = { who: 'Christian', date: '2026-11-12', quote: c.entries[0].sentence, ccs: 'RC2' }), 'carries approvedBy')
    refuses((c) => (c.printerOnly[0].approvedBy = { who: 'Christian' }), 'carries approvedBy')
    refuses((c) => (c.entries[0].candidateBy.rulings[2].quote = 'An isolated defender closing down the ball does not constitute coordinated pressure.'), 'not verbatim in the recorded ruling A02-12NOV-PRESSURE')
    refuses((c) => (c.entries[0].candidateBy.rulings[0].received = '2026-11-11'), 'was received 2026-11-12')
    refuses((c) => (c.entries[0].candidateBy.restates[0].words = 'the attacking team retains possession through the next pass'), 'is not verbatim in RPC-PROP-133')
    refuses((c) => (c.standing = c.standing.replace('CANDIDATE', 'APPROVED')), 'does not stand CANDIDATE')
    refuses((c) => c.entries[0].covers.push({ row: 'J2', match: { equals: 'x' }, element: { base: 'objectives', field: 'role', equals: 'PRIMARY_SCORING' } }), 'the cover on J2 is on a row the renderer says in its own words')
    refuses((c) => (c.entries[0].sentence += ' The other team presses from the start of every attack.'), 'which no candidate sentence may say')
    refuses((c) => (c.printerOnly[2].sentence = c.printerOnly[2].sentence.replace('the next action', 'with the next pass')), 'which no candidate sentence may say')
    refuses((c) => (c.entries[0].candidateBy.who = 'Christian'), "not 'ours'")
    refuses((c) => (c.printerOnly[1].part = 'Adjusting the activity'), 'is none of Setup, Rules, Scoring, Learning explanation')
    assert.throws(() => loadCandidateWording(SOURCES, fileCopy(CANDIDATE_COACH_WORDING_FILE, (c) => (c.label = 'APPROVED'))), (e: unknown) => e instanceof CandidateWordingRefused, 'refused whole by the loader')
    // A stale value (the origin's words drifted): the entry no longer matches the game, so it is not said, the fields are withheld and the build
    // refuses at communication naming them (fail closed); the gate cannot see it (the shape holds), the renderer does.
    const stale = fileCopy(CANDIDATE_COACH_WORDING_FILE, (c) => (c.entries[0].covers[1].match.equals = 'coordinated pressure'))
    const { answer, built } = buildWith('A02-HPE1', (r) => (r.candidateWording!.file = stale))
    assert.equal(answer.stage, 'communication')
    assert.ok(answer.withheld.some((w) => w.path === 'value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-02.a].value'), 'the origin value is withheld')
    assert.ok(answer.reasons.some((r) => r.endsWith('awaiting approved wording: value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-02.a].type (V4)')))
    // Stage A1, re-pinned openly (was []): our CANDIDATE template naming the two targets is still said; the stale entry is not.
    assert.deepEqual(built.activity.reviewLevel.candidateEntries, ['A02-HPE1-T1'], 'no candidate entry was said')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// W2: the markers and the review-level label
// ---------------------------------------------------------------------------------------------------------------------------------------

test('W2 markers: our CANDIDATE sentence reads CANDIDATE, never APPROVED; the review-level account names the wording, its file and the entry said; merging the candidate table into the approved one for the marker is caught', () => {
    const said = sentences('A02-HPE1')
    const wording = loadCandidateWording(SOURCES)
    const candidateTexts = new Set(wording.entries.map((e) => e.sentence))
    const w1 = said.filter((s) => candidateTexts.has(s.text))
    assert.equal(w1.length, 1, 'our sentence is said once')
    assert.equal(w1[0].wording, 'CANDIDATE')
    assert.equal(w1[0].section, 'How to score')
    const noCandidateApproved = (list: { text: string; wording: string }[]) => !list.some((s) => candidateTexts.has(s.text) && s.wording === 'APPROVED')
    assert.ok(noCandidateApproved(said))
    // Stage A1, re-pinned openly (was CANDIDATE and DRAFT only): served, Christian's approved possession sentence is said whole (APPROVED, the
    // approved template's own word 'target'), and our CANDIDATE template's sentence naming the two targets reads CANDIDATE.
    assert.deepEqual([...new Set(said.map((s) => s.wording))].sort(), ['APPROVED', 'CANDIDATE', 'DRAFT'], 'every other sentence is DRAFT')
    assert.deepEqual(said.filter((s) => s.wording === 'APPROVED').map((s) => s.text), ['When possession changes, play carries on without a stoppage, and each team keeps attacking the same target'])
    assert.deepEqual(said.filter((s) => s.wording === 'CANDIDATE').map((s) => s.text), [TARGETS_SENTENCE, wording.entries[0].sentence])
    const level = at('A02-HPE1').built.activity.reviewLevel
    // Stage A1, re-pinned openly (was [W1]): the template's id joins.
    assert.deepEqual([level.status, level.wording, level.candidateFile, level.candidateEntries], ['REVIEW_LEVEL_NOT_CHECKED_FOR_RELEASE', 'CANDIDATE_FOR_CHRISTIANS_REVIEW', 'a02-coach-wording.CANDIDATE.json', [W1, 'A02-HPE1-T1']])
    // Without our wording (A02-HPE1-S) the account carries no wording standing.
    assert.equal(at('A02-HPE1-S').built.activity.reviewLevel.wording, undefined)
    // Bite: a marker computed with the candidate table merged into the approved one reads our sentence APPROVED, and the check catches it.
    const game = at('A02-HPE1').built.fixture.game
    const merged = approvedSentences(game, [...approvedWording(), ...candidateTable(wording)])
    const plain = approvedSentences(game)
    const markedWith = (approved: { text: string }[]) => said.map((s) => ({ text: s.text, wording: approved.some((a) => a.text === s.text) ? 'APPROVED' : s.wording }))
    assert.ok(noCandidateApproved(markedWith(plain)), 'the approved table alone marks nothing of ours APPROVED')
    assert.ok(!noCandidateApproved(markedWith(merged)), 'bite: merged, our sentence would read APPROVED, and the check catches it')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// W3: production never sees it
// ---------------------------------------------------------------------------------------------------------------------------------------

test("W3 production never sees it: the coach's and the review route's builds (A02, and A01 served) carry no review-level key, no CANDIDATE marker, no candidate words; the option is refused without a PROPOSED configuration; no production module names the reader or the file; each with its bite", () => {
    const leaks = (activity: unknown): string[] => {
        const text = JSON.stringify(activity)
        return ['reviewLevel', 'CANDIDATE_FOR_CHRISTIANS_REVIEW', '"wording":"CANDIDATE"', 'escaping team', ...loadCandidateWording(SOURCES).entries.map((e) => e.sentence)].filter((w) => text.includes(w))
    }
    const a02 = { kind: 'learning-goal', goalId: 'A02', situationId: null, session: sessionOf(at('A02-HPE1').request.session) } as any
    // A01's zone version as its own pins build it (12 players, one specialized role each, no goal object, 40 x 30 m, 20 minutes).
    const a01 = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf({ ...at('A02-HPE1').request.session, players: 12, specializedRoles: 1, goals: 0, durationMin: 20 }) } as any
    const builds = [buildActivity(a02), buildActivityForReview(a02, { includeDrafts: true }), buildActivity(a01), buildActivityForReview(a01, { includeDrafts: true })]
    assert.deepEqual(builds.map((b) => b.outcome), ['refused', 'refused', 'served', 'served'], 'A02 refused in production; A01 served')
    for (const b of builds) assert.deepEqual(leaks(b), [])
    // Bite: a copy of a coach build with the review-level key injected is caught.
    assert.deepEqual(leaks({ ...copy(builds[2]), reviewLevel: { status: 'REVIEW_LEVEL_NOT_CHECKED_FOR_RELEASE' } }), ['reviewLevel'])
    // The option is read only beside a PROPOSED configuration.
    assert.throws(() => buildActivityUnderAuthorizationRecords(a02, productionRecords, { review: { includeDrafts: true }, candidateWording: { file: 'x', entries: candidateTable(loadCandidateWording(SOURCES)) } }), /read only at review level, beside a PROPOSED configuration/)
    // Static: no non-unit module but the reader imports the reader, names the file or calls its functions (comments may name the module).
    const SRC = path.resolve(HERE, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name)
            if (fs.statSync(full).isDirectory()) walk(full)
            else if (name.endsWith('.ts') && !name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(SRC)
    assert.ok(files.length > 200, 'the scan reads the source tree')
    const NAMES = /(from|require\s*\(|import\s*\()\s*['"][^'"]*candidate-coach-wording['"]|a02-coach-wording\.CANDIDATE|loadCandidateWording|candidateTable|candidateWordingRefusals/
    assert.ok([`import { x } from '../rendering/candidate-coach-wording'`, `require("./candidate-coach-wording")`, `'a02-coach-wording.CANDIDATE.json'`, 'candidateTable(x)'].every((t) => NAMES.test(t)), 'bite: the scan sees each form')
    const naming = files.filter((f) => NAMES.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(SRC, f).split(path.sep).join('/'))
    assert.deepEqual(naming, ['system/rendering/candidate-coach-wording.ts'])
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// W4: team names, as measured
// ---------------------------------------------------------------------------------------------------------------------------------------

/*
 * Stage A1 (13 November 2026), re-pinned openly. BEFORE (limits (1) and (4) of the stop): no sentence set out the escape line, which only the
 * exchange sentence placed, and the pressing team's end-line target was named by no team outside Role exchange. AFTER: the escape line is set
 * out from the escaping team's end line (decision R1), and the pressing team's target is named in How to score by our CANDIDATE template
 * (decision R3). The end line's own marking sentence still names no team (it marks the line, not whose target it is).
 */
test("W4 team names, as measured (stage A1): each role sentence, the escaping team's target zone, the escape line, the two targets and the role exchange name the teams by their role nouns", () => {
    const texts = textsOf('A02-HPE1')
    assert.ok(texts.includes("Mark the escaping team's target zone from the marked line to the pressing team's end line, across the full width"))
    assert.ok(texts.includes('Escaping team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside'))
    assert.ok(texts.includes('Pressing team: Score by getting the ball across the line it is attacking'))
    assert.ok(texts.includes('Play in blocks: in each block one team is the escaping team and the other is the pressing team'))
    assert.ok(texts.includes("Mark a line across the area, 12 m from the escaping team's end line"), 'the escape line is set out (decision R1)')
    assert.ok(texts.includes(TARGETS_SENTENCE), "the pressing team's target is named, beside the escaping team's (decision R3)")
    assert.ok(texts.includes('Mark a line across one end of the area, 30 m long, on the end line itself'), 'the end line is marked, naming no team (as before)')
    const escapeLine = 'space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].position.along'
    assert.deepEqual(sentences('A02-HPE1').filter((s) => s.from.includes(escapeLine)).map((s) => s.section), ['Set up', 'Role exchange'], 'the escape line is set out, and placed again at the exchange')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// W5: LAW-11
// ---------------------------------------------------------------------------------------------------------------------------------------

test("W5 LAW-11: 'There is no offside' said exactly once, from the configuration's PROPOSED departure (DEPARTED, removed by the configuration, in both blocks); without the departure the run refuses at validation on LAW-11; a departure basis claiming a ruling and a departure from no named law are refused by the loader; A01-R1's departure untouched", () => {
    const said = sentences('A02-HPE1').filter((s) => s.text === NO_OFFSIDE)
    assert.deepEqual(said.map((s) => [s.section, s.wording, s.from]), [['How it works', 'DRAFT', ['defaultLaws.laws[LAW-11]']]])
    const blocks: any[] = at('A02-HPE1').built.fixture.roleBlocks.blocks
    assert.equal(blocks.length, 2)
    for (const block of blocks) {
        const law11 = block.fixture.defaultLaws.laws.filter((l: any) => l.law === 'LAW-11')
        assert.deepEqual(law11.map((l: any) => [l.status, l.removedByRealization === true]), [['DEPARTED', true]])
        assert.equal(block.fixture.defaultLaws.realization, 'A02-HPE1')
    }
    assert.match(String(at('A02-HPE1').answer.laws?.mode), /PROPOSED configuration's \(ours, not a ruling\) check\), held by the harness to our DRAFT classification/)
    // Bite 1: without the departure (A02-HPE1-L, our DRAFT classification), LAW-11 is owed and MATERIAL: refused at validation.
    const l = at('A02-HPE1-L').answer
    assert.deepEqual([l.stage, l.reasons.some((r) => r.includes('LAW-11 (Law 11 (Offside)) at the game: an adaptation is owed'))], ['validation', true])
    assert.ok(!textsOf('A02-HPE1-S').includes(NO_OFFSIDE), 'a run without the departure says no offside sentence')
    // And the review-level run without its departure (no classification read: the fail safe) refuses at validation too.
    const without = buildWith('A02-HPE1', (r) => delete r.proposed!.lawDepartures).answer
    assert.deepEqual([without.outcome, without.stage], ['refused', 'validation'])
    // Bite 2: a basis claiming Christian's ruling is refused; bite 3: a departure from a law the Sport Profile does not name is refused.
    const claimed = fileCopy(PROPOSED_HPE1_FILE, (c) => (c.proposed.laws.departsFrom[0].basis.citedAs = "Christian's ruling (received 12 November 2026), item 6"))
    assert.throws(() => loadProposedRealization(claimed, { lawDepartures: true }), (e: unknown) => e instanceof DraftStoreRefused && e.message.includes('is ours, says it is not a ruling'))
    const unnamed = fileCopy(PROPOSED_HPE1_FILE, (c) => (c.proposed.laws.departsFrom[0].law = 'LAW-99'))
    assert.throws(() => loadProposedRealization(unnamed, { lawDepartures: true }), (e: unknown) => e instanceof DraftStoreRefused && e.message.includes('which is no law the Sport Profile names'))
    assert.throws(() => loadProposedRealization(fileCopy(PROPOSED_HPE1_FILE, (c) => delete c.proposed.laws), { lawDepartures: true }), /asked to carry its departures from the Laws, and the file holds none/)
    // Read without the option, the configuration departs from nothing (A02-HPE1-S and A02-HPE1-L): no check, no departure on it.
    const plain = loadProposedRealization() as any
    assert.deepEqual([plain.realization.defaultLawsCheck, plain.realization.realizationDepartures], [undefined, undefined])
    // A01-R1's own departure, untouched: no offside, the whole law, on A01-R1 itself.
    const a01 = loadProvisionalRealizations().find((r) => r.provisionalId === 'A01-R1') as any
    assert.deepEqual(a01.realizationDepartures.departures.map((d: any) => [d.law, d.extent]), [['LAW-11', 'WHOLE']])
    assert.equal(a01.realizationDepartures.recordedBy, 'A01-R1')
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// W6: conditions, not solutions
// ---------------------------------------------------------------------------------------------------------------------------------------

/** Why a CANDIDATE condition sentence asks the escaping team for an action or a measure: the reasons, empty where none. */
function solutionRefusals(sentence: string): string[] {
    const reasons: string[] = []
    const open = sentence.indexOf(' (')
    const close = sentence.indexOf(')', open)
    // Every action word lies inside the parenthesis that says what pressing together is (the pressing team's, not asked of the escaping team).
    for (const word of actionWordsIn(sentence)) if (!(open >= 0 && word.at > open && word.at < close)) reasons.push(`'${word.word}' (${word.actionClass}) is asked outside the description of the pressure`)
    if (/\d/.test(sentence)) reasons.push('it holds a number')
    if (!/through its next action\.$/.test(sentence)) reasons.push('its continuation is not "through its next action", closing the sentence')
    return reasons
}
test('W6 conditions, not solutions: our condition sentence asks the escaping team for no specific action, number, time or distance (its only action words describe the pressure); no CANDIDATE sentence holds the live origin sentence or the next pass; two bites', () => {
    const wording = loadCandidateWording(SOURCES)
    const w1 = wording.entries[0].sentence
    assert.deepEqual(solutionRefusals(w1), [])
    assert.ok(actionWordsIn(w1).length > 0, 'the description of the pressure names what pressing together is')
    assert.ok(solutionRefusals(w1.replace(' and the escaping team keeps it through its next action.', ' and passes forward first, and the escaping team keeps it through its next action.')).some((r) => r.includes("'passes'")), "bite: 'and passes forward first' is caught")
    assert.ok(solutionRefusals(w1.replace('through its next action.', 'within 3 seconds through its next action.')).includes('it holds a number'), "bite: 'within 3 seconds' is caught")
    for (const s of [...wording.entries.map((e) => e.sentence), ...wording.printerOnly.map((p) => p.sentence)]) for (const never of SOURCES.never) assert.ok(!s.includes(never), never)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// W7: the four-part print
// ---------------------------------------------------------------------------------------------------------------------------------------

// Stage A1, re-pinned openly: the print was of the draft of the run refused at communication (heading 'REFUSED AT COMMUNICATION, so this is
// the draft an administrator sees', 15 sentences and 276 words); it is of the text served at review level, 19 sentences and 377 words.
test("W7 the four-part print of A02-HPE1 (served at review level, stage A1): every sentence in exactly one part with its marker, every ILLUSTRATIVE quantity labelled where it shows; printed with the CANDIDATE and PROPOSED printed-only sentences and the Coach Definition", () => {
    const m = at('A02-HPE1')
    const wording = loadCandidateWording(SOURCES)
    // The ILLUSTRATIVE paths: the session's values (HO-07NOV-ILLUSTRATIVE) and every line resting on an item the chain received ILLUSTRATIVE.
    const illustrativeItems = new Set(m.answer.contracts.flatMap((c) => c.items.filter((i) => i.category === 'ILLUSTRATIVE').map((i) => `${c.contractId}::${i.itemId}`)))
    assert.deepEqual([...illustrativeItems], ['proposed:A02-HPE1::A02-HPE1-S5-1'])
    const schematic = new Set(m.answer.lines.filter((l) => l.kind === 'DERIVED' && (l.support ?? []).some((s) => illustrativeItems.has(`${s.contractId}::${s.itemId}`))).map((l) => l.path))
    assert.deepEqual([...schematic], ['space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].position.along'])
    const illustrativeOf = (p: string): string | null =>
        p.startsWith('envelope.') && p !== 'envelope.roles' ? 'ILLUSTRATIVE: session value, a test value' : schematic.has(p) ? 'ILLUSTRATIVE: the schematic 12 m of this 40 m area; the placement rule governs (PROPOSED)' : null
    const said: SaidSentence[] = m.answer.sentences.map((s) => ({ section: s.section, block: s.block, text: s.text, from: s.from, wording: s.wording }))
    const purpose = displayCell(committedKnowledge(), { source: 'planning', table: 'learning_goals', row: 'A02', column: 'Coach Definition' }).text
    const print = fourPartPrint({
        heading: [
            "REVIEW LEVEL, TEST-ONLY. Built through the checked pathway for Christian's review; SERVED at review level, never served to any coach; nothing here is live.",
            'Markers: [A] APPROVED, [C] CANDIDATE (ours, for review), [D] DRAFT (the renderer\'s own words), [P] PROPOSED (new knowledge of ours, for approval).',
        ],
        said,
        printed: [
            ...wording.printerOnly.map((p) => ({ id: p.id, part: p.part, label: p.label, sentence: p.sentence })),
            { id: 'L1', part: 'Learning explanation' as const, label: 'APPROVED' as const, sentence: purpose, note: "the Learning Goal's Coach Definition, verbatim: the source Christian chose (received 21 October 2026); its Active status is not a dated approval" },
        ],
        illustrativeOf,
    })
    assert.deepEqual(printRefusals(print, said, illustrativeOf), [])
    assert.deepEqual(print.findings, [], "no 'Adjusting the activity' sentence (K2 retains the form) and every section has its part")
    assert.ok(print.text.includes('[D] Mark out an area 40 m long by 30 m wide [ILLUSTRATIVE: session value, a test value]'))
    assert.ok(print.lines.some((l) => l.marker === 'C' && l.part === 'Scoring' && l.text === wording.entries[0].sentence))
    assert.ok(print.lines.some((l) => l.marker === 'P' && l.part === 'Setup'), 'the placement rule is printed PROPOSED')
    // Concision, measured: the draft's sentences and words (A01's served Details hold 27 sentences: goal-version-communication.unit.ts).
    const words = said.reduce((n, s) => n + s.text.split(/\s+/).length, 0)
    assert.deepEqual([said.length, words], [19, 377])
    quiet(print.text.split('\n').map((l) => `      ${l}`).join('\n'))
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-hpe1-wording.unit.ts'))
})

if (MAIN) quiet(`a02 HPE-1 wording (stage B2): ${passed} passed`)
