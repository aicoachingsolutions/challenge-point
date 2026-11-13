/**
 * **Package 5, the A02 ecological revision: the revised activity A02-HPE2 at review level, beside the baseline A02-HPE1** (13 November 2026).
 * TEST-ONLY review evidence: nothing here is served to a coach, written to production knowledge or approved wording, or an authorization.
 *
 * Christian, received 13 November 2026: "Present the revised activity with concise coach-facing instructions and clear labels distinguishing
 * approved, candidate, proposed and illustrative elements." "If both teams understand the rules and genuinely attempt to win, do their available
 * opportunities and incentives make the intended learning problem likely to emerge?" "No changes to the A02 pathway or unapproved scoring
 * arrangements are authorized for release." (all three received 13 November 2026)
 *
 * What is built (each through the handoff and the real chain, its request, answer and built activity captured): A02-HPE2, the review-level run
 * of our PROPOSED configuration docs/audits/drafts/a02-proposed/hpe2.PROPOSED.json over the draft store a02-hpe2-composition (our CANDIDATE
 * restatement with the revised origin and progression values) with our CANDIDATE wording a02-hpe2-coach-wording.CANDIDATE.json, from the
 * review data a02-hpe2-inputs.review.json composed with the baseline's (its rulings and its case A02-0, read, never copied); and two negative
 * controls, HPE-2 changed on a TEST-ONLY copy (B11): the end-line award given back to the escaping team, and the pressing target put on the
 * escaping team's end line. The baseline A02-HPE1 is a02-acceptance.unit.ts's build, unchanged.
 * What is pinned, every value measured first (scratchpad pkg5/build): the stop and the review-level account (B1); the realized game, the award
 * read from the possession game and the conditions carried (B1, B3, the consumer of the revised values); the diagram (B13); the loader's dates
 * (B2) with its bites; the walkthrough re-expressed for HPE-2 (B8) with a bite for each re-expressed predicate; the two-team check on both runs
 * and its negative controls (B10, B11) with a bite for each question; the four-part print of the served text (B12), RPC-STMT-010 printed from
 * the library as approved wording (B5), the stated differences from the engine held; the static scan; and the evidence
 * (docs/audits/design-reasoning-a02/evidence/a02-hpe2-report.txt and a02-hpe2-results.json), generated twice from two builds, identical, and
 * equal to the committed files (rewritten only under UPDATE_A02_HPE2_EVIDENCE=1; under A02_HPE2_EVIDENCE_BODY=<file> the report is also
 * written there, for reading only).
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-hpe2.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { DraftStoreRefused, loadDraftStore, loadProposedRealization, PROPOSED_HPE1_FILE } from '../derivation/draft-store'
import { buildActivity } from '../rendering/build-activity'
import { loadCandidateWording } from '../rendering/candidate-coach-wording'
import { libraryRow } from '../sport-module/candidate-coach-rules'
import { eventMeaningStanding } from '../sport-module/primary-scoring'
import { rpcLibrary } from '../sport-module/rpc-library'
import { B3, elementTable, HPE1_SHAPE, labelsAt, Made, MARKERS, readingOf, REVIEW_RUN, reviewPrint, TwoTeamCheck, twoTeamCheckOf, twoTeamLines, walkthroughLines, walkthroughOf, WalkthroughShape } from './a02-acceptance.unit'
import { inputs as a02Inputs, quotedSpans } from './a02.unit'
import { citedDateOf } from './assembly'
import { displayCell } from './assembly-display'
import { approvedSourceOf, engineLines, fourPartPrint, FourPartPrint, printRefusals, PrintedOnly, SaidSentence } from './four-part-print.unit'
import { CaseInput, ChainAnswer, ChainRequest, HandoffInputs, runHandoff, validateHandoffInputs } from './handoff'
import { candidateWordingSourcesOf, holdsGenderedPronoun, realChain, sessionOf, withoutGenderedPronouns } from './handoff-chain.unit'
import { handoffReportText, plain, quoted, show } from './handoff-report'
import { committedKnowledge } from './knowledge'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
function test(name: string, run: () => void): void {
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
quiet("package 5, the A02 ecological revision: A02-HPE2 at review level beside the baseline A02-HPE1 (Christian's reply received 13 November 2026)")

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const DRAFTS = path.join(WT, 'docs', 'audits', 'drafts')
const EVIDENCE = path.join(WT, 'docs', 'audits', 'design-reasoning-a02', 'evidence')
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const json = (v: unknown) => JSON.stringify(v)
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))

export const REVIEW2 = 'A02-HPE2'
export const HPE2_FILE = path.join(DRAFTS, 'a02-proposed', 'hpe2.PROPOSED.json')
const STORE2 = 'a02-hpe2-composition'
const WORDING2_FILE = path.join(DRAFTS, STORE2, 'a02-hpe2-coach-wording.CANDIDATE.json')
const P2 = (item: string) => `c:proposed:A02-HPE2:${item}`
const BLOCK1 = 'ESCAPING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END|TEAM_AT_AXIS_START<TEAM_AT_AXIS_START,TEAM_AT_AXIS_END<TEAM_AT_AXIS_END'
const BLOCK2 = 'ESCAPING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END|TEAM_AT_AXIS_START<TEAM_AT_AXIS_END,TEAM_AT_AXIS_END<TEAM_AT_AXIS_START'

// ---------------------------------------------------------------------------------------------------------------------------------------
// The inputs: the 13 November data composed with the baseline's (its rulings, and its case A02-0 that A02-HPE2 is based on), never copied
// ---------------------------------------------------------------------------------------------------------------------------------------

const a02raw = readJson(path.join(HERE, 'a02-inputs.review.json'))
const hpe2raw = readJson(path.join(HERE, 'a02-hpe2-inputs.review.json'))
export const inputs2: HandoffInputs = validateHandoffInputs({
    standing: hpe2raw.standing,
    rulings: [...a02Inputs.rulings, ...hpe2raw.rulings],
    cases: [a02raw.cases.find((c: any) => c.id === 'A02-0'), ...hpe2raw.cases],
    grading: (a02Inputs as any).grading,
})
const ruling = (id: string) => {
    const r = inputs2.rulings.find((x) => x.id === id)
    assert.ok(r, id)
    return r
}
const christian = (id: string, n: number) => `${quoted(ruling(id).words[n])} (${citedDateOf(ruling(id))})`
const SOURCES2 = candidateWordingSourcesOf(inputs2.rulings.map((r) => ({ id: r.id, words: r.words, received: r.received })))
const WORDING2 = loadCandidateWording(SOURCES2, WORDING2_FILE)
const CONFIG2 = loadProposedRealization(HPE2_FILE, { lawDepartures: true })
/** The revised values, read from the store's own items (never typed here): the walkthrough's 4a holds the game to them. */
const STORE_ITEMS = (loadDraftStore(STORE2, { recordsSetAsideBy: 'TT-K2-RETAIN-FORM' }).contracts.find((c) => c.contractId === 'restated:RPC-002')?.items ?? []) as any[]
const storeValue = (id: string) => String(STORE_ITEMS.find((i) => i.itemId === id)?.value)
/**
 * FIX (13 November 2026, V1 M2 and M3): what the handoff's grading cannot show, read from the configuration and the store: the end zone's depth,
 * realized from A02-HPE2-S5-3's typedBound while no configuration line cites that item (the zone's position line rests on GF2-04), and the
 * PROPOSED parts of the two revised values (the grading reads a draft-store value whole as our restatement). Each is added to its path's labels
 * in the comparison with the baseline (H1), the element table (H3) and the walkthrough's elements (H4); test B1 holds each path to a line the run
 * holds and each note to the item or fitNote it reads.
 */
const DEPTH_ITEM = (CONFIG2.realization.items as any[]).find((i) => i.itemId === 'A02-HPE2-S5-3')
const evidenceLabel = (evidence: string) => (evidence.indexOf(';') >= 0 ? evidence.slice(0, evidence.indexOf(';')) : evidence)
export const LABEL_NOTES2: ReadonlyArray<{ path: string; label: string }> = [
    { path: 'space.regions[c:restated:GF2:GF2-03.e].position.along', label: `${evidenceLabel(String(DEPTH_ITEM.basisEvidence))} (the depth realized from ${DEPTH_ITEM.itemId}'s typedBound, ${DEPTH_ITEM.typedBound.min} m, question ${DEPTH_ITEM.waitsOn}, though no configuration line cites that item)` },
    { path: 'value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-02.a].value', label: "PROPOSED: the closing words 'by this crossing' (the store item RPC-002-02.b)" },
    { path: 'value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-03.a].value', label: `PROPOSED: the whole value '${storeValue('RPC-002-03.c')}', our crossing reading of RPC-PROP-133's 'beyond' (the store item RPC-002-03.c)` },
]
const noteAt = (p: string) => LABEL_NOTES2.find((n) => n.path === p)?.label ?? null
export const HPE2_SHAPE: WalkthroughShape = { id: 'HPE-2', pressingTarget: 'zone', endLine: 'NOT_LAST_TOUCH', origin: storeValue('RPC-002-02.b'), progression: storeValue('RPC-002-03.c'), knownKinds: ['blocks'], labelNotes: LABEL_NOTES2 }

// ---------------------------------------------------------------------------------------------------------------------------------------
// The runs (read-only wrap of the build entry, as the other A02 tests wrap it)
// ---------------------------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildModule = require('../rendering/build-activity')
const entry = buildModule.buildActivityUnderAuthorizationRecords
let lastBuilt: any = null
buildModule.buildActivityUnderAuthorizationRecords = (...args: unknown[]) => (lastBuilt = entry(...args))

function made(c: CaseInput, inputs: HandoffInputs): Made {
    let request: ChainRequest | null = null
    let answer: ChainAnswer | null = null
    let built: any = null
    const result = runHandoff(
        c,
        inputs,
        {
            build: (r) => {
                request = copy(r)
                lastBuilt = null
                answer = realChain.build(r)
                built = lastBuilt
                return answer
            },
        },
        committedKnowledge(),
    )
    assert.ok(request && answer, `${c.id} reached the chain`)
    return { id: c.id, result, request: request as ChainRequest, answer: answer as ChainAnswer, built }
}
/**
 * A TEST-ONLY copy of a file, changed, in a temporary folder (its path is never printed in the evidence). FIX (13 November 2026, V1 L5): each
 * copy and its folder are removed when the process exits (the file, then the empty folder; nothing else is ever removed).
 */
const COPIES: string[] = []
process.on('exit', () => {
    for (const file of COPIES) {
        try {
            fs.unlinkSync(file)
            fs.rmdirSync(path.dirname(file))
        } catch {
            // already gone
        }
    }
})
function fileCopy(file: string, change: (raw: any) => void): string {
    const raw = readJson(file)
    change(raw)
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-hpe2-'))
    const out = path.join(dir, path.basename(file))
    fs.writeFileSync(out, JSON.stringify(raw, null, 2))
    COPIES.push(out)
    return out
}
const itemOf = (raw: any, id: string) => raw.proposed.realization.items.find((i: any) => i.id === id)
/** A negative control: HPE-2's captured request with its configuration replaced by a changed copy, through the real chain. */
export interface Control {
    id: string
    what: string
    answer: ChainAnswer
    built: any
}
function controlOf(base: Made, id: string, what: string, change: (raw: any) => void): Control {
    const request = copy(base.request)
    request.proposed!.file = fileCopy(HPE2_FILE, change)
    lastBuilt = null
    const answer = realChain.build(request)
    return { id, what, answer, built: lastBuilt }
}
/** B11 (i): the pressing team's target put back on the escaping team's end line, scored by a dribble over it (HPE-1's N2 (a)). */
const pressingLine = (raw: any) => {
    const b9 = itemOf(raw, 'A02-HPE2-B9-1')
    b9.value = 'line_crossed'
    b9.basisEvidence = "PROPOSED: NEGATIVE CONTROL (B11), HPE-1's pressing score: a dribble over the escaping team's end line"
    itemOf(raw, 'A02-HPE2-S3-2').value = 'line'
    const s53 = itemOf(raw, 'A02-HPE2-S5-3')
    s53.value = { term: 'beyond X (for team T)', of: { structuralRef: { contractId: 'proposed:A02-HPE2', itemId: 'A02-HPE2-S2-1' }, asAuthored: 'the marked line' }, forTeam: 'ROLE_HOLDER_PRESSING', asAuthored: "NEGATIVE CONTROL: the escaping team's end line, beyond the marked line" }
    delete s53.typedBound
    s53.basisEvidence = "PROPOSED: NEGATIVE CONTROL (B11), the pressing team's target on the escaping team's end line"
}
/** B11 (ii): the end-line award given back to the escaping team whoever touched the ball last (HPE-1's restart). */
const endLineToEscaping = (raw: any) => {
    raw.proposed.realization.items.push({ ...copy(itemOf(raw, 'A02-HPE2-T5-2')), id: 'A02-HPE2-T2-2', row: 'T2', value: 'ROLE_HOLDER_ESCAPING', basisEvidence: 'PROPOSED: NEGATIVE CONTROL (B11), the end-line award to the escaping team whoever touched the ball last, as in HPE-1', fitNote: "NEGATIVE CONTROL, TEST-ONLY: HPE-1's end-line award put back on HPE-2." })
}
export const CONTROL_IDS = ['A02-HPE2~END-LINE-TO-ESCAPING', 'A02-HPE2~PRESSING-LINE']
export interface Hpe2Runs {
    hpe2: Made
    hpe1: Made
    controls: Control[]
}
/** Every run of the package, built afresh (the evidence builds them twice, and the two generations must be identical). */
export function buildHpe2(hpe1: Made): Hpe2Runs {
    const c = inputs2.cases.find((x) => x.id === REVIEW2)
    assert.ok(c, `the inputs hold ${REVIEW2}`)
    const hpe2 = made(copy(c), inputs2)
    const controls = [
        controlOf(hpe2, CONTROL_IDS[0], "HPE-2 with the end-line award given back to the escaping team whoever touched the ball last (HPE-1's restart): (ii) must find it", endLineToEscaping),
        controlOf(hpe2, CONTROL_IDS[1], "HPE-2 with the pressing team's target on the escaping team's end line, scored by a dribble over it (HPE-1's pressing score): (i) must find it", pressingLine),
    ]
    return { hpe2, hpe1, controls }
}
/** HPE-1 built again, as a02-acceptance.unit.ts builds it (for the second generation of the evidence). */
function hpe1Again(): Made {
    const c = a02Inputs.cases.find((x) => x.id === REVIEW_RUN)
    assert.ok(c)
    return made(copy(c), a02Inputs)
}
const RUNS = buildHpe2(B3.get(REVIEW_RUN)!)
const H2 = RUNS.hpe2
const blockOf = (m: { built: any }, blockId: string): any => (m.built.fixture.roleBlocks.blocks as any[]).find((b) => b.blockId === blockId)!.fixture

// ---------------------------------------------------------------------------------------------------------------------------------------
// The coach text: the four-part print of the served text (B12), the learning explanation from knowledge (B5)
// ---------------------------------------------------------------------------------------------------------------------------------------

const SESSION_LABEL = 'ILLUSTRATIVE: session value, a test value'
/** The Learning Goal's Coach Definition, read from planning knowledge (the source Christian chose, received 21 October 2026). */
const PURPOSE = displayCell(committedKnowledge(), { source: 'planning', table: 'learning_goals', row: 'A02', column: 'Coach Definition' }).text
const PURPOSE_MARKER = 'the source Christian chose, received 21 October 2026'
/**
 * B5: RPC-STMT-010, High Press Escape's coach translation, read from the RPC library (never typed here) and printed as approved wording: Christian
 * asked us to use "the existing approved High Press Escape coach translation" (received 13 November 2026, heading 6; the row id is ours to name:
 * RPC-002's one COACH_TRANSLATION statement, ACTIVE, of RC1 provenance). The marker names the source and the date that reply was received.
 */
const TRANSLATION_ROW = libraryRow('RPC-STMT-010')
const TRANSLATION = rpcLibrary.context('RPC-002')!.coachTranslation
const TRANSLATION_MARKER = "RPC-STMT-010, High Press Escape's coach translation (ACTIVE, RPC Library RC1), the approved translation Christian asked us to use, received 13 November 2026"
const TRANSLATION_NOTE = 'verbatim, read from the RPC library'

/** The questions each said sentence rests on (as appendix F7 grades it): every line it joins whose premise names an item of HPE-2's configuration. */
function questionsOfRun(m: Made): (n: number) => string[] {
    const items = new Map<string, string>()
    for (const i of CONFIG2.realization.items as Array<{ itemId: string; category?: string; waitsOn?: string }>) if ((i.category === 'PROPOSED' || i.category === 'ILLUSTRATIVE') && i.waitsOn) items.set(i.itemId, i.waitsOn)
    for (const r of CONFIG2.replacements as Array<{ item: { itemId: string; waitsOn?: string } }>) if (r.item.waitsOn) items.set(r.item.itemId, r.item.waitsOn)
    const lawQuestion = (law: string) => CONFIG2.questions.find((q) => q.asks.startsWith(`${law} `))?.id ?? null
    const ofPremise = (p: { kind: string; ref: string }): string | null => {
        const [first, second] = p.ref.split(' ')
        if (second && items.has(second)) return items.get(second)!
        if (p.kind === 'PROPOSED_ITEM' && first.startsWith('LAW-')) return lawQuestion(first)
        return null
    }
    return (n) => {
        const graded = m.result.sentences[n]
        assert.ok(graded && graded.text === m.answer.sentences[n].text, `${m.id}: the handoff graded sentence ${n + 1} as said`)
        const lines = m.result.lines.filter((l) => graded.joined.includes(l.lineId))
        return [...new Set(lines.flatMap((l) => l.premises.map(ofPremise)).filter((q): q is string => q !== null))]
    }
}
const saidOf = (m: Made): SaidSentence[] => {
    const questions = questionsOfRun(m)
    return m.answer.sentences.map((s, n) => ({ section: s.section, block: s.block, text: s.text, from: s.from, wording: s.wording, questions: questions(n), ...(s.wording === 'APPROVED' ? { source: approvedSourceOf(s.text) } : {}) }))
}
/** An ILLUSTRATIVE item's label: its evidence up to the first ';', read from the configuration the chain received (never typed here). */
const labelOfEvidence = (evidence: string) => {
    const body = evidence.slice('ILLUSTRATIVE: '.length)
    return `ILLUSTRATIVE: ${body.indexOf(';') >= 0 ? body.slice(0, body.indexOf(';')) : body}`
}
/** The ILLUSTRATIVE label of a path: the session's values, and each line resting on an ILLUSTRATIVE item, labelled by that item. */
function illustrativeOfRun(m: { answer: ChainAnswer }): (p: string) => string | null {
    const labels = new Map<string, string>()
    for (const c of m.answer.contracts) for (const i of c.items) if (i.category === 'ILLUSTRATIVE') labels.set(`${c.contractId}::${i.itemId}`, labelOfEvidence(i.basisEvidence))
    const byPath = new Map<string, string>()
    for (const l of m.answer.lines) if (l.kind === 'DERIVED') for (const s of (l.support ?? []) as any[]) if (labels.has(`${s.contractId}::${s.itemId}`)) byPath.set(l.path, labels.get(`${s.contractId}::${s.itemId}`)!)
    return (p) => (p.startsWith('envelope.') && p !== 'envelope.roles' ? SESSION_LABEL : (byPath.get(p) ?? null))
}
/**
 * A quantity a sentence shows without citing its path: the session's values (as a02-acceptance.unit.ts reads them), and the typed value of an
 * ILLUSTRATIVE item the realization consumes with no configuration line citing it (measured: the end zone's 6 m depth is realized from
 * A02-HPE2-S5-3's typedBound while the zone's position line rests on GF2-04; the B13 test proves the consumer).
 */
function illustrativeShownOfRun(m: { answer: ChainAnswer }): Array<{ shows: string; label: string }> {
    const at = (p: string) => m.answer.lines.find((l) => l.path === p && l.kind === 'DERIVED')?.value
    const out: Array<{ shows: string; label: string }> = []
    for (const [p, unit] of [['envelope.area.length_m', ' m'], ['envelope.area.width_m', ' m'], ['envelope.duration_min', ' minutes'], ['envelope.players', ' players']] as const) {
        const v = at(p)
        if (typeof v === 'number') out.push({ shows: `${v}${unit}`, label: SESSION_LABEL })
    }
    for (const c of m.answer.contracts)
        for (const i of c.items as any[]) {
            const bound = (CONFIG2.realization.items as any[]).find((x) => `proposed:A02-HPE2` === c.contractId && x.itemId === i.itemId)?.typedBound
            if (i.category === 'ILLUSTRATIVE' && bound && bound.min === bound.max) out.push({ shows: `${bound.min} m`, label: labelOfEvidence(i.basisEvidence) })
        }
    return out
}
/** The learning explanation (from knowledge, never from our wording file), then our printed sentences. */
const printedOnly = (): PrintedOnly[] => [
    { id: 'L1', part: 'Learning explanation', label: 'APPROVED', sentence: PURPOSE, note: "the Learning Goal's Coach Definition, verbatim", markerWords: PURPOSE_MARKER },
    { id: 'L2', part: 'Learning explanation', label: 'APPROVED', sentence: TRANSLATION, note: TRANSLATION_NOTE, markerWords: TRANSLATION_MARKER },
    ...WORDING2.printerOnly.map((p) => ({ id: p.id, part: p.part, label: p.label, sentence: p.sentence, ...(p.restsOn ? { restsOn: [...p.restsOn] } : {}), ...(p.illustrative ? { illustrative: p.illustrative } : {}), ...(p.standsFor ? { standsFor: [...p.standsFor] } : {}) })),
]
const saidStandsFor = () => WORDING2.entries.filter((e) => e.standsFor).map((e) => ({ text: e.sentence, standsFor: [...e.standsFor!] }))
const HEADING = `REVIEW LEVEL, TEST-ONLY. ${REVIEW2}, the revised activity, built through the checked pathway for Christian's ecological review beside the baseline ${REVIEW_RUN}; SERVED at review level, never served to any coach; nothing here is live. The coach text: the engine's sentences, each printed as said or stated in fewer words by one sentence of ours (CANDIDATE or PROPOSED), which takes its grades; every engine sentence is listed below the text with where it is printed.`
/** FIX (13 November 2026, V2 F15): what [A] means on a sentence printed as said (A02-HPE2's heading only; the shared legend is the baseline's). */
const APPROVED_SAID = "An [A] on a sentence printed as said marks Christian's approved wording, not approval of what it states here: the possession sentence is A01's approved wording, its use in A02 our CANDIDATE."
export function reviewPrint2(m: Made) {
    const said = saidOf(m)
    const illustrativeOf = illustrativeOfRun(m)
    const illustrativeShown = illustrativeShownOfRun(m)
    // FIX (V2 F14): a sentence printed as said is printed with its full stop (the engine's own list, H2b, keeps the engine's words).
    const print = fourPartPrint({ heading: [HEADING, MARKERS, APPROVED_SAID], said, printed: printedOnly(), illustrativeOf, illustrativeShown, saidStandsFor: saidStandsFor(), stopSaid: true })
    const engine = engineLines(print, said, { illustrativeOf, illustrativeShown })
    return { print, said, illustrativeOf, engine, reading: readingOf(print.lines), words: said.reduce((n, s) => n + s.text.split(/\s+/).length, 0) }
}
/**
 * Where a printed sentence of ours says less than, more than, or other than the engine sentences it stands for (measured by reading both). The
 * coach text follows the engine where the engine cannot say a line of our draft (the lead's decision A3); each difference is held here: `has` to
 * the printed sentence, `dropped` to a sentence it stands for and not to the printed one.
 */
export const DIVERGENCES2: Array<{ id: string; says: string; has?: string; dropped?: string }> = [
    { id: 'A02-HPE2-S1', says: "says '6 v 6' for 'Divide 12 players into 2 teams of 6'", has: '6 v 6', dropped: 'Divide 12 players' },
    { id: 'A02-HPE2-S2', says: "leaves out whose target the end zone is (the pressing team's: K2 says so)", has: 'end zone', dropped: "the pressing team's target zone" },
    { id: 'A02-HPE2-S3', says: "says 'Swap roles when you choose' for 'When you call the next block' and leaves out 'there is no set block length'; the clock of our draft ('every 3 minutes') is said by neither: the engine cannot state a block length, so the text gives a coach no guide to how often to swap (whether a coach's regular call may stand in for the clock is Christian's, Q5)", has: 'Swap roles when you choose', dropped: 'there is no set block length' },
    // FIX (V2 F13): two engine sentences listed as stated by a line that implies or shows them without saying them.
    { id: 'A02-HPE2-S3', says: "is where the engine's 'Decide which team starts at which end' is listed, though it does not say it: the coach decides it by choosing which team defends the marked end", dropped: 'Decide which team starts at which end' },
    { id: 'A02-HPE2-W1', says: "is where the engine's 'Mark the escaping team's target zone from the marked line to the pressing team's end line, across the full width' is listed, though it marks nothing: the zone is everything beyond the marked line, labelled in the diagram and read from 'over the line'", dropped: "Mark the escaping team's target zone" },
    // FIX (V1 M1, V2 F4): the limit the engine cannot hold, said here so the evidence names it (a cold-read gap, for the delivery beside Q6).
    { id: 'A02-HPE2-R1', says: "says 'whenever you judge an attempt has run its course' for the engine's 'whenever you decide that an attack has run its course (at a stoppage or while play is on)', and adds an example the engine does not say; the narrower trigger of our draft and its limit (never while the pressing team has the ball) are said by neither, so, as served, a coach may also restart with the escaping team just after the pressing team wins the ball, and nothing in the text says otherwise", has: 'for example when the escaping team holds the ball beyond the line unpressed', dropped: 'an attack has run its course' },
    { id: 'A02-HPE2-R2', says: "adds 'Throw-ins and free kicks as normal' (true of the laws account: LAW-13 and LAW-15 apply; no engine sentence says it, and the engine's own 'otherwise, normal soccer rules apply' stays unsaid while the kick-off is owed); our draft's 'opponents stand back as at a free kick' is said by neither: no register row holds it", has: 'Throw-ins and free kicks as normal' },
    { id: 'A02-HPE2-K2', says: "adds 'Points from both roles add up; most points wins' (no engine words for a total or a winner; PROPOSED), and leaves out 'worth 1 point' (it says 'a point')", has: 'Points from both roles add up; most points wins', dropped: 'worth 1 point' },
]
/** The digit runs a text shows, as written. */
const digitRuns = (text: string): string[] => {
    const out: string[] = []
    let cur = ''
    for (const ch of `${text} `) {
        if (ch >= '0' && ch <= '9') cur += ch
        else if (cur) {
            out.push(cur)
            cur = ''
        }
    }
    return out
}
/**
 * FIX (13 November 2026, V2 F12 and F5), printed in H2c, measured: an engine sentence carrying an ILLUSTRATIVE label none of whose quantities its
 * own words show (the label follows an element the sentence cites, not its words); and Q4, which governs the escaping team's scoring sentence
 * though no item waits on it, so no line's marker can show it.
 */
export function engineNotes2(said: SaidSentence[], illustrativeOf: (p: string) => string | null): string[] {
    const out: string[] = []
    said.forEach((s, n) => {
        for (const label of [...new Set(s.from.map(illustrativeOf).filter((l): l is string => l !== null))]) {
            const shown = digitRuns(label)
            if (shown.length && !shown.some((d) => digitRuns(s.text).includes(d))) out.push(`H2b ${n + 1} ('${s.text.slice(0, 48)}...') carries the label '${label}' though its words show none of that label's quantities: the label follows an element the sentence cites, not its words`)
        }
    })
    const waiting = (CONFIG2.realization.items as any[]).filter((i) => i.waitsOn === 'Q4').length
    if (CONFIG2.questions.some((q) => q.id === 'Q4')) out.push(`Q4 (a crossing after the press has dropped off; needed before the coach text is used with players) governs the escaping team's scoring sentence (A02-HPE2-W1), but ${waiting} items wait on it, so no line's marker can show it (a marker shows the questions of the items a line rests on)`)
    return out
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// What changed from the baseline, read from the two realized games (each element with its labels from HPE-2's grading)
// ---------------------------------------------------------------------------------------------------------------------------------------

export function differsFromHpe1(h2: Made, h1: Made): string[] {
    const g2 = h2.built.fixture.roleBlocks.blocks[0].fixture
    const g1 = h1.built.fixture.roleBlocks.blocks[0].fixture
    const geometry = (f: any, p: string) => (f.status.geometry as any[]).find((g) => g.path === p)?.geometry?.interval ?? null
    const pressing = (f: any) => {
        const role = (f.game.activityRoles as any[]).find((r) => r.activityRole === 'PRESSING')
        const o = (f.game.objectives as any[]).find((x) => x.role === 'PRIMARY_SCORING' && x.team === 'TEAM_AT_AXIS_END')
        const region = (f.game.space.regions as any[]).find((r) => r.elementId === `c:${o?.reference?.structuralRef?.contractId}:${o?.reference?.structuralRef?.itemId}`)
        return { role, region, along: region ? geometry(f, `space.regions[${region.elementId}].position.along`) : null }
    }
    const triggerOf = (t: any) => ((t.selector ?? []) as any[]).find((s) => s.attribute === 'trigger')?.value
    const transition = (f: any, trigger: string) => (f.game.transitions as any[]).find((t) => triggerOf(t) === trigger) ?? null
    const condition = (f: any, type: string) => (f.game.value.primaryEvent.conditions as any[]).find((c) => c.type === type)
    // FIX (V1 M2, M3): a path's note joins its labels (LABEL_NOTES2).
    const label = (p: string) => `[${labelsAt(h2, p)}${noteAt(p) ? ` + ${noteAt(p)}` : ''}]`
    const p1 = pressing(g1)
    const p2 = pressing(g2)
    const end1 = transition(g1, 'OUT_END_LINE')
    const end2 = transition(g2, 'OUT_END_LINE')
    const start1 = transition(g1, 'START')
    const start2 = transition(g2, 'START')
    const coach2 = transition(g2, 'COACH_JUDGED_EPISODE_CONCLUSION')
    return [
        `the pressing team's score: ${REVIEW_RUN} ${p1.role?.scoresBy} into the ${p1.region?.noun} over ${show(p1.along)}; ${REVIEW2} ${p2.role?.scoresBy} into the ${p2.region?.noun} over ${show(p2.along)} ${label(`space.regions[${p2.region?.elementId}].noun`)} ${label(`space.regions[${p2.region?.elementId}].position.along`)}`,
        `the ball over an end line: ${REVIEW_RUN} to ${end1?.awardedTo}; ${REVIEW2} to ${end2?.awardedTo === 'NOT_LAST_TOUCH' ? 'the team that did not touch it last' : end2?.awardedTo} ${label(`transitions[${end2?.elementId}].awardedTo`)}, its place ${show(end2?.placement?.region)} ${label(`transitions[${end2?.elementId}].placement.region`)}`,
        `the start's place: ${REVIEW_RUN} ${show(start1?.placement?.region)}; ${REVIEW2} ${show(start2?.placement?.region)} ${label(`transitions[${start2?.elementId}].placement.region`)}`,
        `the coach's restart: ${REVIEW_RUN} ${transition(g1, 'COACH_JUDGED_EPISODE_CONCLUSION') ? 'present' : 'none'}; ${REVIEW2} ${coach2 ? `${triggerOf(coach2)}, awarded to ${coach2.awardedTo} ${label(`transitions[${coach2.elementId}].awardedTo`)}` : 'none'}`,
        `the teams' ends between blocks: ${REVIEW_RUN} ${show(g1.game.blocks ?? 'kept (the marked line moved)')}; ${REVIEW2} ${show(g2.game.blocks)} ${label('blocks.endAssignment')}`,
        `the origin value: ${REVIEW_RUN} ${show(condition(g1, 'origin')?.value)}; ${REVIEW2} ${show(condition(g2, 'origin')?.value)} ${label(`value.primaryEvent.conditions[${condition(g2, 'origin')?.elementId}].value`)} (the grading reads the whole value as our restatement)`,
        `the progression value: ${REVIEW_RUN} ${show(condition(g1, 'progression')?.value)}; ${REVIEW2} ${show(condition(g2, 'progression')?.value)} ${label(`value.primaryEvent.conditions[${condition(g2, 'progression')?.elementId}].value`)} (the grading reads the whole value as our restatement; no part of it is Christian's word)`,
    ]
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The evidence (generated from the runs; `from` is the first or the second build)
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The served Coach Overview's scoring groups: each group's label and its lines. */
const OVERVIEW_GROUPS = (m: { built: any }): Array<[string, string[]]> => ((m.built.activity.overview?.scoring?.groups ?? []) as any[]).map((g) => [String(g.label), (g.lines as any[]).map((l) => String(l.text))])
/** A line's subject, where it opens with a group's role name ('Escaping team: ...' or 'The escaping team ...'). */
const subjectOf = (line: string, roles: string[]) => roles.find((r) => line.startsWith(`${r}:`) || line.startsWith(`The ${r.toLowerCase()} `)) ?? null
/**
 * FIX (13 November 2026, V1 M4): each role group's lines whose subject is another role. A PROPOSED diagnostic of ours, gating nothing: the
 * overview's own check has no clause that reads it (its verdict on A02-HPE2 is PASS), so the evidence names that gap.
 */
export function overviewStrays(groups: Array<[string, string[]]>): string[] {
    const roles = groups.map(([label]) => label)
    return groups.flatMap(([label, lines]) =>
        lines
            .filter((l) => {
                const s = subjectOf(l, roles)
                return s !== null && s !== label
            })
            .map((l) => `the '${label}' group holds '${l.slice(0, 50)}...', whose subject is the ${String(subjectOf(l, roles)).toLowerCase()}`),
    )
}
/**
 * FIX (13 November 2026, V1 L2): A02-HPE1's game read with HPE-2's RPC-PROP-026 predicate (HPE-1's own values, HPE-2's predicate id; only that
 * row is used), so the evidence shows why the two runs' tallies are equal though their predicates differ.
 */
export function rpc026Across(h1: Made) {
    const w = walkthroughOf(h1, h1.built, h1.answer, { ...HPE1_SHAPE, id: 'HPE-2' })
    return w.answers[3].rows.find((r) => r.rowId === 'RPC-PROP-026')!
}
const stopOf = (a: ChainAnswer) => `${a.outcome}${a.stage ? ` at ${a.stage}` : ''}; ${a.reasons.length} reasons`
const markersOf = (a: ChainAnswer) => Object.fromEntries(['APPROVED', 'CANDIDATE', 'DRAFT'].map((w) => [w, a.sentences.filter((s) => s.wording === w).length]))
const CHECKS = (runs: Hpe2Runs) => [
    { id: REVIEW_RUN, check: twoTeamCheckOf(REVIEW_RUN, runs.hpe1.built) },
    { id: REVIEW2, check: twoTeamCheckOf(REVIEW2, runs.hpe2.built) },
    ...runs.controls.map((c) => ({ id: c.id, check: twoTeamCheckOf(c.id, c.built) })),
]
export function evidenceOf(runs: Hpe2Runs): { report: string; json: string } {
    const h2 = runs.hpe2
    const h1 = runs.hpe1
    const p2 = reviewPrint2(h2)
    const p1 = reviewPrint(h1)
    const w2 = walkthroughOf(h2, h2.built, h2.answer, HPE2_SHAPE)
    const w1 = walkthroughOf(h1)
    const checks = CHECKS(runs)
    const level = (h2.built.activity.reviewLevel ?? {}) as any
    const diagram = h2.built.activity.diagram
    const out: string[] = []
    out.push(`A02-HPE2: THE REVISED A02 ACTIVITY AT REVIEW LEVEL, BESIDE THE BASELINE A02-HPE1 (package 5, the A02 ecological revision, 13 November 2026; TEST-ONLY; for Christian's ecological review; nothing here is served or live; no player-learning effect is claimed)`)
    out.push(`Christian asked: ${christian('A02-13NOV-REVISION', 5)} ${christian('A02-13NOV-REVISION', 2)} ${christian('A02-13NOV-REVISION', 7)}`)
    out.push(`How to read the labels: APPROVED is Christian's (wording, a ruling or a library row, its source named on the line); CANDIDATE is our restatement or wording of approved knowledge, for review; PROPOSED is new knowledge of ours, for approval; ILLUSTRATIVE is a test value. Every claim about play is our reasoning, not evidence of learning.`)
    out.push('H1. THE RUNS AND THEIR STOPS (measured):')
    out.push(`- ${REVIEW2}: ${stopOf(h2.answer)}; fidelity violations ${h2.built.activity.integrity.fidelityViolations}; ${h2.built.activity.integrity.instructions} instructions; markers ${show(markersOf(h2.answer))}; treatments ${h2.result.testOnlyTreatments.map((t) => t.id).join(', ')}`)
    out.push(`- ${REVIEW_RUN} (the baseline, unchanged): ${stopOf(h1.answer)}; fidelity violations ${h1.built.activity.integrity.fidelityViolations}; ${h1.built.activity.integrity.instructions} instructions; markers ${show(markersOf(h1.answer))}`)
    for (const c of runs.controls) out.push(`- ${c.id} (negative control, TEST-ONLY copy): ${stopOf(c.answer)}; ${c.what}`)
    out.push(`Pending (awaiting Christian's approval, never a pass): ${(level.pendingApproval ?? []).map((e: any) => `${e.item} (question ${e.questionId}), in ${e.blocks.length} blocks: ${withoutGenderedPronouns(plain(e.finding))}`).join('; ') || 'none'} (the guard's words, printed without a gendered pronoun)`)
    out.push(`Laws: owed ${show(h2.answer.laws?.owed ?? [])}; reported ${show(h2.answer.laws?.reportedForReview ?? [])}; per block ${(h2.built.fixture.roleBlocks.blocks as any[]).map((b, n) => `block ${n + 1}: ${(b.fixture.defaultLaws.laws as any[]).map((l) => `${l.law} ${l.status}`).join(', ')}`).join('; ')}`)
    out.push(`The configuration (${CONFIG2.realization.items.length} items: ${(CONFIG2.realization.items as any[]).filter((i) => i.category === 'ILLUSTRATIVE').map((i) => i.itemId).join(', ')} ILLUSTRATIVE, the rest PROPOSED; one CANDIDATE replacement, ${CONFIG2.replacements.map((r) => r.item.itemId).join(', ')}); the questions it waits on:`)
    for (const q of CONFIG2.questions) out.push(`- ${q.id} (${(CONFIG2.realization.items as any[]).filter((i) => i.waitsOn === q.id).length} items): ${plain(q.asks)}`)
    out.push(`What changed from the baseline (read from the two realized games, block 1; each element of ${REVIEW2} with its labels):`)
    out.push(...differsFromHpe1(h2, h1).map((l) => `- ${l}`))
    out.push('H2. THE COACH TEXT IN FOUR PARTS (from the text served at review level; every line marked and graded; every ILLUSTRATIVE quantity labelled where it shows):')
    out.push(...p2.print.text.split('\n').map((l) => `   ${l}`))
    const r2 = p2.reading
    const r1 = p1.reading
    const parts = ['Setup', 'Rules', 'Scoring', 'Learning explanation']
    out.push(`Concision (measured; labels and notes stripped, sentences split at '. ', words at spaces): ${REVIEW2}'s coach text ${r2.total.lines} lines, ${r2.total.sentences} sentences, ${r2.total.words} words (${parts.map((p) => `${p} ${r2.byPart[p].lines}/${r2.byPart[p].sentences}/${r2.byPart[p].words}`).join(', ')}); the baseline ${REVIEW_RUN}'s ${r1.total.lines} lines, ${r1.total.sentences} sentences, ${r1.total.words} words (${parts.map((p) => `${p} ${r1.byPart[p].lines}/${r1.byPart[p].sentences}/${r1.byPart[p].words}`).join(', ')}). The engine's own text: ${REVIEW2} ${p2.said.length} sentences, ${p2.words} words; ${REVIEW_RUN} ${p1.said.length} sentences, ${p1.words} words.`)
    out.push("H2b. THE ENGINE'S OWN SENTENCES (A02-HPE2, in the order said, each marked and graded, and where the coach text prints it):")
    out.push(...p2.engine.map((l) => `   ${l}`))
    out.push('H2c. WHERE THE COACH TEXT DIFFERS FROM THE ENGINE (measured, each held by a test), and what the engine cannot say:')
    for (const d of DIVERGENCES2) out.push(`- ${d.id} ${d.says}`)
    for (const note of engineNotes2(p2.said, p2.illustrativeOf)) out.push(`- ${note}`)
    out.push(`- The four High Press Escape coach rules are held, as Christian asked (${christian('A02-13NOV-SEQUENCE', 5)}): COACH_RULES unchanged, not printed here.`)
    out.push('H3. THE ELEMENT TABLE (A02-HPE2, generated from the build: every configuration line, by element, each with the labels of what it rests on):')
    out.push(...elementTable(h2))
    out.push("What the grading cannot show at a path (read from the configuration and the store; each also joins that path's labels in H1 and in the walkthrough's elements, H4):")
    for (const n of LABEL_NOTES2) out.push(`- ${n.path}: ${n.label}`)
    out.push(`H4. THE ACCEPTANCE WALKTHROUGH (Christian's four questions, received 12 November 2026, read from each realized game, never from a sentence; re-expressed per configuration, the lead's build item B8; a development finding only, never ecological validation):`)
    out.push(`${REVIEW2} (HPE-2's shape: the end zone, the end-line award by last touch, the store's origin and progression values, the end assignment read as instructing no team):`)
    out.push(...walkthroughLines(w2).map((l) => `   ${l}`))
    out.push(`${REVIEW_RUN} (the baseline, HPE-1's shape, as pinned):`)
    out.push(...walkthroughLines(w1).map((l) => `   ${l}`))
    const cross = rpc026Across(h1)
    out.push(`RPC-PROP-026 side by side (measured; V1 L2): the two runs' verdicts come from different predicates, so their equal tallies are an artefact of the predicates, not equal play. HPE-2's predicate also reads a long ball that stays in play and is lost far from the escaping team's end (wherever 1b holds); HPE-1's, as pinned, does not read that case, though it holds in ${REVIEW_RUN} too. ${REVIEW_RUN} read with HPE-2's predicate: ${cross.verdict.toUpperCase()}: ${cross.reading}. Read by one predicate, ${REVIEW_RUN} is partly punished for two reasons (the end-line give-back and the long ball) and ${REVIEW2} for one (the long ball).`)
    out.push(`H5. THE TWO-TEAM CHECK (the lead's build items B10 and B11: PROPOSED diagnostics of ours, derived from Christian's concerns received 13 November 2026, reported and gating nothing; read from each realized game, never from a sentence; an event's ways read from its vocabulary description, whose meaning for RPC-002 is ${eventMeaningStanding('RPC-002', 'target_zone_entered')}):`)
    out.push(`Christian's concerns: ${christian('A02-13NOV-REVISION', 10)} ${christian('A02-13NOV-ROLES', 3)} ${christian('A02-13NOV-ROLES', 4)}`)
    for (const { id, check } of checks) {
        out.push(`${id}:`)
        out.push(...twoTeamLines(check).map((l) => `   ${l}`))
    }
    out.push('H6. THE DIAGRAM (A02-HPE2, the existing machinery; served only where it agrees with the Coach Details):')
    out.push(`served ${h2.built.activity.diagramDraft.served}; findings ${show(h2.built.activity.diagramDraft.findings)}`)
    for (const b of diagram.blocks as any[]) out.push(`- ${b.label}: lines ${show(b.lines.map((l: any) => [l.along.from, l.markedLine]))}; zones ${show(b.zones.map((z: any) => [z.along.from, z.along.to, z.state]))}; dimensions ${show(b.dimensions.map((d: any) => `${d.kind} ${d.label}`))}; teams ${show((b.teams ?? []).map((t: any) => `${t.label} at ${show(t.attacks ?? t.attacksEnd ?? null)}`))}`)
    const overview = h2.built.activity.overview
    out.push(`THE COACH OVERVIEW (the existing machinery, measured): ${overview === undefined ? 'withheld' : 'SERVED at review level'} for ${REVIEW2} (its check's verdict ${h2.built.activity.overviewDraft?.check?.verdict ?? 'none'}); for ${REVIEW_RUN} ${h1.built.activity.overview === undefined ? 'withheld' : 'served'}.`)
    if (overview) {
        out.push(`- game: ${overview.game}`, `- parameters: ${overview.parameters}`, `- purpose: ${overview.purpose}`)
        for (const [label, lines] of OVERVIEW_GROUPS(h2)) out.push(`- ${label}:`, ...lines.map((l) => `     ${l}`))
        const strays = overviewStrays(OVERVIEW_GROUPS(h2))
        out.push(`  FINDING (reported, not changed: the overview composer is production code): ${strays.length} lines sit in a role's group whose subject is the other role (a PROPOSED diagnostic of ours, measured): ${strays.join('; ')}. A coach reading the 'Pressing team' group sees the escaping team's scoring under the pressing team.`)
        out.push(`  SAFEGUARD GAP (V1 M4): the overview's own check gave PASS; no clause of it reads whether a role's group holds another role's lines. Such a clause is NEW (production code), as is correcting the grouping.`)
        out.push(`  NOT FOR REVIEW: the activity presented for review is the four-part text (H2) and the diagram (H6); this overview is a second coach-facing surface, measured and reported only.`)
    }
    out.push(`H7. ${REVIEW2} AS THE HANDOFF REPORTS IT (inputs, Steps 1 and 2, the form, the chain, configuration lines with their grades, coach text, laws and requirement accounts):`)
    out.push(handoffReportText([h2.result], inputs2, []))
    out.push('')
    const report = out.join('\n')
    const results = {
        standing: 'TEST-ONLY review evidence for package 5 (A02-HPE2 beside the baseline A02-HPE1), generated by a02-hpe2.unit.ts; nothing here is served, live, approved or an authorization.',
        runs: [
            { id: REVIEW2, outcome: h2.answer.outcome, stage: h2.answer.stage, reasons: h2.answer.reasons, fidelityViolations: h2.built.activity.integrity.fidelityViolations, instructions: h2.built.activity.integrity.instructions, markers: markersOf(h2.answer), pending: (level.pendingApproval ?? []).map((e: any) => [e.item, e.questionId, e.blocks.length]), laws: h2.answer.laws, treatments: h2.result.testOnlyTreatments.map((t) => t.id) },
            { id: REVIEW_RUN, outcome: h1.answer.outcome, stage: h1.answer.stage, fidelityViolations: h1.built.activity.integrity.fidelityViolations, instructions: h1.built.activity.integrity.instructions, markers: markersOf(h1.answer) },
            ...runs.controls.map((c) => ({ id: c.id, outcome: c.answer.outcome, stage: c.answer.stage, reasonCount: c.answer.reasons.length })),
        ],
        configuration: { items: (CONFIG2.realization.items as any[]).map((i) => ({ itemId: i.itemId, row: i.row, selector: i.selector, value: i.value, category: i.category, waitsOn: i.waitsOn })), questions: CONFIG2.questions.map((q) => q.id), replacements: CONFIG2.replacements.map((r) => r.item.itemId) },
        game: (h2.built.fixture.roleBlocks.blocks as any[]).map((b) => ({ blockId: b.blockId, holders: b.holders, game: b.fixture.game, laws: b.fixture.defaultLaws.laws })),
        coachText: { lines: p2.print.lines.map((l) => ({ part: l.part, marker: l.shownMarker, text: l.text, of: 'printed' in l.of ? l.of.printed : 'said' })), reading: r2, baselineReading: r1, engine: p2.engine, engineWords: p2.words, divergences: DIVERGENCES2 },
        walkthrough: { [REVIEW2]: w2, [REVIEW_RUN]: w1 },
        twoTeam: Object.fromEntries(checks.map(({ id, check }) => [id, check])),
        diagram: { served: h2.built.activity.diagramDraft.served, findings: h2.built.activity.diagramDraft.findings, blocks: diagram.blocks },
        differsFromBaseline: differsFromHpe1(h2, h1),
    }
    return { report, json: `${JSON.stringify(results, null, 1)}\n` }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The tests (every value pinned below was measured first: scratchpad pkg5/build)
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The coach text's lines, part by part, as measured (B12). */
const EXPECTED_LINES: Array<[string, string, string]> = [
    ['Setup', '[C]', 'A02-HPE2-S1'],
    ['Setup', '[P | PROPOSED Q1 | PROPOSED Q2]', 'A02-HPE2-S2'],
    ['Setup', '[P | PROPOSED Q1 | PROPOSED Q2 | PROPOSED Q5]', 'A02-HPE2-S3'],
    ['Rules', "[A: Christian's approved wording POSSESSION_CONTINUES, received 25 October 2026 | contingent on Q6]", 'said'],
    ['Rules', '[P | PROPOSED Q6]', 'A02-HPE2-R1'],
    ['Rules', '[P | PROPOSED Q3 | PROPOSED Q6]', 'A02-HPE2-R2'],
    ['Scoring', '[C | contingent on Q1 | contingent on Q2]', 'said'],
    ['Scoring', '[P | PROPOSED Q1 | PROPOSED Q2]', 'A02-HPE2-K2'],
    ['Learning explanation', `[A: ${PURPOSE_MARKER}]`, 'L1'],
    ['Learning explanation', `[A: ${TRANSLATION_MARKER}]`, 'L2'],
]
/**
 * What a coach reads (lines, sentences, words), measured: against A02-HPE1's 12, 17 and 326. FIX (13 November 2026, V1 M1, V2 F1 to F3),
 * re-pinned openly: was 305 words; the scoring sentence's first clause 42 words to 39, the end-line restart's 'marked line' one more.
 */
const EXPECTED_READING = [10, 17, 303]

test('B1 the run: A02-HPE2 served at review level, fidelity violations 0, 19 sentences (1 APPROVED, 1 CANDIDATE, 17 DRAFT), the pending entry Q2 only, the kick-off still owed (PROCEDURAL, reported), every configuration item labelled with the question it waits on; the baseline A02-HPE1 unchanged', () => {
    const m = H2
    assert.deepEqual([m.answer.outcome, m.answer.stage, m.answer.reasons, m.answer.withheld, m.answer.sentencesServed], ['served', null, [], [], true])
    const integrity = m.built.activity.integrity
    assert.deepEqual([integrity.realizationAuthorized, integrity.postRealizationValidated, integrity.instructions, integrity.fidelityViolations], [true, true, 19, 0])
    assert.deepEqual(markersOf(m.answer), { APPROVED: 1, CANDIDATE: 1, DRAFT: 17 })
    assert.deepEqual(m.answer.laws?.owed, ['LAW-8'])
    assert.ok(m.answer.laws!.reportedForReview.length === 1 && m.answer.laws!.reportedForReview[0].startsWith('LAW-8 at the game: an adaptation is owed; PROCEDURAL under our DRAFT classification'))
    const level = m.built.activity.reviewLevel
    assert.deepEqual(level.pendingApproval.map((p: any) => [p.item, p.questionId, p.blocks.length]), [['proposed:A02-HPE2::A02-HPE2-B9-1', 'Q2', 2]])
    const items: { itemId: string; category: string; waitsOn: string | null }[] = level.proposedElements.items
    assert.equal(items.length, 26)
    assert.deepEqual(items.filter((i) => i.category === 'ILLUSTRATIVE').map((i) => i.itemId), ['A02-HPE2-S5-1', 'A02-HPE2-S5-3'])
    assert.ok(items.every((i) => ['PROPOSED', 'ILLUSTRATIVE'].includes(i.category) && !!i.waitsOn), 'every item labelled, with its question')
    assert.deepEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((q) => items.filter((i) => i.waitsOn === q).length), [8, 3, 0, 0, 2, 13])
    assert.deepEqual(m.result.testOnlyTreatments.map((t) => t.id), ['TT-CONSUMED-STEPS', 'TT-DRAFT-STORE', 'TT-K2-RETAIN-FORM', 'TT-PROPOSED-HPE2-LAWS', 'TT-PROPOSED-PENDING', 'TT-CANDIDATE-WORDING'])
    // FIX (V1 M2, V2 F6): the two revised store values open by saying what of them is ours, never 'the verbatim value' or 'the authored words'.
    const fit = (id: string) => String(STORE_ITEMS.find((i) => i.itemId === id)?.fitNote)
    assert.ok(fit('RPC-002-03.c').startsWith("CANDIDATE, OURS, unreviewed: the item restates RPC-PROP-133, but its value, revised for HPE-2 to 'over', is wholly PROPOSED") && !fit('RPC-002-03.c').includes('the verbatim value'), fit('RPC-002-03.c'))
    assert.ok(fit('RPC-002-02.b').startsWith("CANDIDATE, OURS, unreviewed: RPC-PROP-133's words 'established coordinated pressure' with our PROPOSED closing words") && fit('RPC-002-02.b').includes("'by this crossing' are PROPOSED") && !fit('RPC-002-02.b').includes('the authored words carried'), fit('RPC-002-02.b'))
    // FIX (V1 M2, M3): each label note names a line the run holds; the depth note names the pressing team's end zone and the item the realization
    // consumes; the origin note's closing words are the value's.
    for (const n of LABEL_NOTES2) assert.notEqual(labelsAt(m, n.path), 'no line', n.path)
    const pressingObjective = (blockOf(m, BLOCK1).game.objectives as any[]).find((o) => o.team === 'TEAM_AT_AXIS_END' && o.role === 'PRIMARY_SCORING')
    assert.equal(`space.regions[c:${pressingObjective.reference.structuralRef.contractId}:${pressingObjective.reference.structuralRef.itemId}].position.along`, LABEL_NOTES2[0].path)
    assert.ok(LABEL_NOTES2[0].label.startsWith('ILLUSTRATIVE: a schematic 6 m depth for the end zone') && LABEL_NOTES2[0].label.includes("A02-HPE2-S5-3's typedBound, 6 m, question Q2"), LABEL_NOTES2[0].label)
    assert.ok(HPE2_SHAPE.origin.endsWith('by this crossing') && HPE2_SHAPE.progression === 'over')
    // FIX (V1 L7): HPE-2's configuration names its own question Q1 where HPE-1 named its element N1.
    assert.ok(!fs.readFileSync(HPE2_FILE, 'utf8').includes('N1'), "hpe2.PROPOSED.json names no element 'N1'")
    // The baseline stays as pinned by its own tests (a02-hpe1-served.unit.ts): served, 19 sentences, its pending entry Q2.
    const h1 = RUNS.hpe1
    assert.deepEqual([h1.answer.outcome, h1.built.activity.integrity.instructions, h1.built.activity.integrity.fidelityViolations, (h1.answer.reviewLevel?.pendingApproval ?? []).map((p) => p.item)], ['served', 19, 0, ['proposed:A02-HPE1::A02-HPE1-B9-1']])
})

test("B1, B3 the realized game in both blocks: the pressing team's target the end zone (0 to 6 m) scored by its own event; the start, a point and the coach's restart to the escaping team at a place the coach chooses outside the end zone; the ball over an end line to the team that did not touch it last, its award and play state read from the possession game (GF2-16.a, GF2-16.b, DEFAULT), no item writing them; the teams' ends exchanged; the revised origin and progression values carried; the Laws: LAW-8 owed, LAW-11 departed, LAW-13 and LAW-15 apply", () => {
    const START = "near the escaping team's own end, outside the end zone"
    const PLACES = "for the escaping team near its own end, outside the end zone; for the pressing team on the marked line"
    for (const blockId of [BLOCK1, BLOCK2]) {
        const f = blockOf(H2, blockId)
        const game = f.game
        const triggerOf = (t: any) => (t.selector as any[]).find((s) => s.attribute === 'trigger')?.value
        assert.deepEqual(
            (game.transitions as any[]).map((t) => [t.elementId, triggerOf(t), t.awardedTo ?? null, t.placement?.actor ?? null, t.placement?.method ?? null, t.placement?.region ?? null, t.playState]),
            [
                [P2('A02-HPE2-T1-3'), 'OUT_END_LINE', 'NOT_LAST_TOUCH', "a player of the team in this element's T2", 'FROM_THE_FEET', { coachDecides: PLACES }, 'STOP_RESUME'],
                [P2('A02-HPE2-T1-1'), 'START', 'ROLE_HOLDER_ESCAPING', "a player of the team in this element's T2", 'FROM_THE_FEET', { coachDecides: START }, 'STOP_RESUME'],
                [P2('A02-HPE2-T1-2'), 'SCORE', 'ROLE_HOLDER_ESCAPING', "a player of the team in this element's T2", 'FROM_THE_FEET', { coachDecides: START }, 'STOP_RESUME'],
                [P2('A02-HPE2-T1-4'), 'COACH_JUDGED_EPISODE_CONCLUSION', 'ROLE_HOLDER_ESCAPING', "a player of the team in this element's T2", 'FROM_THE_FEET', { coachDecides: START }, 'STOP_RESUME'],
                ['c:restated:GF2:GF2-07.a', 'POSSESSION_CHANGE', null, null, null, null, 'CONTINUE'],
            ],
            blockId,
        )
        assert.deepEqual([game.possession?.team, game.restartPolicy, game.blocks], ['ROLE_HOLDER_ESCAPING', undefined, { endAssignment: 'EXCHANGED' }])
        assert.deepEqual((game.activityRoles as any[]).map((r) => [r.activityRole, r.scoresBy ?? null, r.exchange]), [['ESCAPING', null, 'COACH_CALLS'], ['PRESSING', 'target_zone_entered', 'COACH_CALLS']])
        // B3, the consumer: the revised values carried on the realized event (read from the store, never typed here).
        assert.deepEqual((game.value.primaryEvent.conditions as any[]).map((c) => [c.type, c.value]), [['origin', HPE2_SHAPE.origin], ['progression', 'over'], ['control', 'retains possession through the next action']])
        assert.equal(HPE2_SHAPE.origin, 'established coordinated pressure, encountered and then escaped by this crossing')
        const laws = f.defaultLaws.laws as any[]
        const status = (law: string) => laws.filter((l) => l.law === law).map((l) => l.status)
        assert.deepEqual(['LAW-8', 'LAW-11', 'LAW-13', 'LAW-15', 'LAW-16', 'LAW-17'].map(status), [['ADAPTATION_OWED'], ['DEPARTED'], ['APPLIES'], ['APPLIES'], ['NOT_APPLICABLE', 'NOT_APPLICABLE'], ['NOT_APPLICABLE', 'NOT_APPLICABLE']])
    }
    // The end-line award and play state are the possession game's own defaults (no item writes them).
    const awardLines = H2.answer.lines.filter((l) => l.lineId === `${P2('A02-HPE2-T1-3')}::T2` || l.lineId === `${P2('A02-HPE2-T1-3')}::T6`)
    assert.deepEqual(awardLines.map((l: any) => [l.lineId.slice(-2), l.value, l.support.map((s: any) => `${s.contractId}:${s.itemId}`), l.strength]), [
        ['T2', 'NOT_LAST_TOUCH', ['restated:GF2:GF2-16.a'], 'DEFAULT'],
        ['T6', 'STOP_RESUME', ['restated:GF2:GF2-16.b'], 'DEFAULT'],
    ])
    assert.ok(!(CONFIG2.realization.items as any[]).some((i) => i.selector === 'trigger=OUT_END_LINE' && ['T2', 'T6'].includes(i.row)), 'no item writes the end-line award or play state')
    // Bite (B3): the wording's cover reverted to HPE-1's origin value no longer matches the realized value, so every condition field is withheld.
    const request = copy(H2.request)
    request.candidateWording!.file = fileCopy(WORDING2_FILE, (w) => (w.entries[0].covers.find((c: any) => c.row === 'V6' && c.element.equals === 'origin').match.equals = 'established coordinated pressure'))
    const reverted = realChain.build(request)
    assert.deepEqual([reverted.outcome, reverted.stage], ['refused', 'communication'])
    assert.ok(reverted.reasons.some((r) => r.includes('awaiting approved wording: value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-02.a].value (V6)')), json(reverted.reasons.slice(0, 3)))
})

test('B13 the diagram, both blocks: served, no finding; the same markings in both (the marked line 12 m from the escaping team\'s end line, the end zone 0 to 6 m and the escaping team\'s zone 12 to 40 m, both TARGET), the 6 m and 12 m dimensions; the teams change ends', () => {
    const activity = H2.built.activity
    assert.deepEqual([activity.diagramDraft.served, activity.diagramDraft.findings], [true, []])
    const blocks = activity.diagram.blocks as any[]
    assert.deepEqual(
        blocks.map((b) => [b.label, b.lines.map((l: any) => [l.along.from, l.markedLine]), b.zones.map((z: any) => [z.along.from, z.along.to, z.state]), b.dimensions.filter((d: any) => ['ZONE_DEPTH', 'LINE_OFFSET'].includes(d.kind)).map((d: any) => `${d.kind} ${d.label}`)]),
        [
            ['Block 1', [[12, true]], [[0, 6, 'TARGET'], [12, 40, 'TARGET']], ['ZONE_DEPTH 6 m', 'LINE_OFFSET 12 m']],
            ['Block 2', [[12, true]], [[0, 6, 'TARGET'], [12, 40, 'TARGET']], ['ZONE_DEPTH 6 m', 'LINE_OFFSET 12 m']],
        ],
    )
    assert.notDeepEqual(blocks[0].teams, blocks[1].teams, 'the teams change ends between blocks')
    // The end zone's depth is consumed from the ILLUSTRATIVE item (no configuration line cites it): a copy with 7 m realizes and draws 7 m.
    const deeper = controlOf(H2, 'DEPTH-7', 'the end zone 7 m deep', (raw) => {
        const s53 = itemOf(raw, 'A02-HPE2-S5-3')
        s53.value = '7 m deep'
        s53.typedBound = { min: 7, max: 7 }
    })
    assert.deepEqual((deeper.built.activity.diagram.blocks as any[])[0].zones.map((z: any) => [z.along.from, z.along.to]), [[0, 7], [12, 40]], 'the depth is read from A02-HPE2-S5-3')
    assert.ok(!H2.answer.lines.some((l: any) => (l.support ?? []).some((s: any) => s.itemId === 'A02-HPE2-S5-3')), 'no configuration line cites A02-HPE2-S5-3 (its label is read from its value in the print)')
    // Measured (a difference from the expectation, reported): the Coach Overview is SERVED for A02-HPE2 (A02-HPE1's is withheld: its composer had no
    // words for a line target beside a zone). Its 'Pressing team' group repeats the escaping team's two lines: the overview composer's grouping,
    // production code, not changed here (reported, NEW to correct).
    assert.deepEqual([activity.overviewDraft.served, activity.overviewDraft.check.verdict], [true, 'PASS'])
    assert.deepEqual(OVERVIEW_GROUPS(H2), [
        ['Escaping team', ['Escaping team: Score by getting the ball under control into its target zone.', WORDING2.entries[0].sentence]],
        ['Pressing team', ['Escaping team: Score by getting the ball under control into its target zone.', 'Pressing team: Score by getting the ball under control into its target zone.', WORDING2.entries[0].sentence]],
    ])
    // FIX (V1 M4): the diagnostic finds the two lines the check passed, both in the 'Pressing team' group; bite: the groups as they should be
    // (each role's lines only) give none.
    const strays = overviewStrays(OVERVIEW_GROUPS(H2))
    assert.equal(strays.length, 2, json(strays))
    assert.ok(strays.every((s) => s.startsWith("the 'Pressing team' group holds") && s.endsWith('whose subject is the escaping team')), json(strays))
    assert.deepEqual(overviewStrays(OVERVIEW_GROUPS(H2).map(([label, lines]) => [label, lines.filter((l) => subjectOf(l, ['Escaping team', 'Pressing team']) === label)])), [], 'bite: own lines only, no finding')
})

test("B2 the loader's received dates: HPE-2's quotations with 13 November 2026 and HPE-1's with 12 November 2026 are admitted; a question, an item or a laws basis quoting another date is refused (bites), and the message names both dates", () => {
    assert.ok(CONFIG2.questions.every((q) => q.askedFor.includes('(received 13 November 2026)')))
    assert.ok(loadProposedRealization(PROPOSED_HPE1_FILE).questions.every((q) => q.askedFor.includes('(received 12 November 2026)')))
    const refused = (change: (raw: any) => void, expected: string) => {
        const file = fileCopy(HPE2_FILE, change)
        assert.throws(() => loadProposedRealization(file, { lawDepartures: true }), (e: unknown) => e instanceof DraftStoreRefused && e.message.includes(expected), expected)
    }
    const BOTH = '(received 12 November 2026) or (received 13 November 2026)'
    refused((raw) => (raw.proposed.questions[5].askedFor = raw.proposed.questions[5].askedFor.replace('(received 13 November 2026)', '(received 14 November 2026)')), `the request it answers quoted with ${BOTH}`)
    refused((raw) => (itemOf(raw, 'A02-HPE2-T1-1').askedFor = itemOf(raw, 'A02-HPE2-T1-1').askedFor.replace('(received 13 November 2026)', '')), `does not quote the request it answers with ${BOTH}`)
    refused((raw) => (raw.proposed.laws.departsFrom[0].basis.citedAs = raw.proposed.laws.departsFrom[0].basis.citedAs.replace('(received 13 November 2026)', '(received 14 November 2026)')), `names the request it answers ${BOTH}`)
})

test("B8 the walkthrough re-expressed for HPE-2: the structural facts of 4 of 4 questions hold in both blocks (1b the end zone, 1e the end-line award by last touch, 2c and 3d with the end assignment read as instructing no team, 4a the store's revised values); RPC-002's rows: information 2 held and 2 partly held; RPC-PROP-026 partly punished (the long ball lost in play far from the escaping team's end costs only the ball), 027 rewarded, 028 not addressed, 029 not punished; each re-expressed predicate bites", () => {
    const w = walkthroughOf(H2, H2.built, H2.answer, HPE2_SHAPE)
    assert.deepEqual(w.answers.map((a) => [a.n, a.established, a.facts.filter((f) => !f.holds).map((f) => f.id)]), [[1, true, []], [2, true, []], [3, true, []], [4, true, []]])
    assert.deepEqual(w.answers.flatMap((a) => a.rows.map((r) => [r.rowId, r.verdict])), [
        ['RPC-PROP-022', 'partly held'],
        ['RPC-PROP-023', 'partly held'],
        ['RPC-PROP-024', 'held'],
        ['RPC-PROP-025', 'held'],
        ['RPC-PROP-026', 'partly punished'],
        ['RPC-PROP-027', 'rewarded'],
        ['RPC-PROP-028', 'not addressed'],
        ['RPC-PROP-029', 'not punished'],
    ])
    assert.deepEqual(w.answers.map((a) => a.limits.length), [0, 0, 0, 0])
    assert.equal(w.answers[2].arms.length, 3)
    const r026 = w.answers[3].rows.find((r) => r.rowId === 'RPC-PROP-026')!
    assert.ok(r026.reading.includes('goes to the team that did not touch it last') && r026.reading.includes('costs only the ball') && r026.cites.some((c) => c.startsWith(`transitions[${P2('A02-HPE2-T1-3')}].awardedTo [`)), json(r026))
    const cites = w.answers.flatMap((a) => a.facts.flatMap((f) => f.cites))
    for (const c of cites) assert.ok(!c.endsWith('[no line]'), c)
    assert.ok(cites.includes(`activityRoles[${P2('A02-HPE2-B1-2')}].scoresBy [PROPOSED]`), json(cites))
    assert.ok(cites.includes(`space.regions[${P2('A02-HPE2-S2-1')}].position.along [ILLUSTRATIVE]`))
    // The walkthrough reads no sentence: with every sentence removed it is the same.
    const silent = copy(H2.answer)
    silent.sentences = []
    assert.deepEqual(walkthroughOf(H2, H2.built, silent, HPE2_SHAPE), w)
    // FIX (V1 M2, M3): the notes join the labels of the cites they name (1b and RPC-PROP-022 the end zone's depth; 4a the revised values).
    assert.ok(w.answers[0].facts.find((f) => f.id === '1b')!.cites.includes(`${LABEL_NOTES2[0].path} [CANDIDATE (our restatement of the knowledge workbooks) + ${LABEL_NOTES2[0].label}]`), json(w.answers[0].facts.find((f) => f.id === '1b')!.cites))
    const cites4a = w.answers[3].facts.find((f) => f.id === '4a')!.cites
    for (const n of LABEL_NOTES2.slice(1)) assert.ok(cites4a.includes(`${n.path} [CANDIDATE (our restatement) + ${n.label}]`), json(cites4a))
    assert.ok(walkthroughOf(RUNS.hpe1).answers.flatMap((a) => [...a.facts.flatMap((f) => f.cites), ...a.rows.flatMap((r) => r.cites)]).every((c) => !c.includes(' + PROPOSED: the') && !c.includes('typedBound')), "HPE-1's cites carry no note")
    // FIX (V1 L2): RPC-PROP-026 read on A02-HPE1 with HPE-2's predicate: partly punished for both reasons, the give-back and the long ball.
    const across = rpc026Across(RUNS.hpe1)
    assert.ok(across.verdict === 'partly punished' && across.reading.includes('returns it to the escaping team at the restart') && across.reading.includes('costs only the ball'), json(across))
    // Read with HPE-1's shape, the same game fails exactly where the shapes differ (the probe's measurement, now named): 1b, 1e, 2c, 3d, 4a, 4c, 4d.
    const asHpe1 = walkthroughOf(H2, H2.built, H2.answer, HPE1_SHAPE)
    assert.deepEqual(asHpe1.answers.flatMap((a) => a.facts.filter((f) => !f.holds).map((f) => f.id)), ['1b', '1e', '2c', '3d', '4a', '4c', '4d'])
    // Bites, each on a changed copy of the realized game read with HPE-2's shape.
    const changedBuilt = (change: (fixture: any) => void) => {
        const built = copy({ fixture: H2.built.fixture })
        for (const b of built.fixture.roleBlocks.blocks) change(b.fixture)
        return built
    }
    const failing = (change: (fixture: any) => void) => walkthroughOf(H2, changedBuilt(change), H2.answer, HPE2_SHAPE).answers.flatMap((a) => a.facts.filter((f) => !f.holds).map((f) => f.id))
    const pressingZone = (f: any) => {
        const o = (f.game.objectives as any[]).find((x) => x.role === 'PRIMARY_SCORING' && x.team === 'TEAM_AT_AXIS_END')
        return (f.status.geometry as any[]).find((g) => g.path === `space.regions[c:${o.reference.structuralRef.contractId}:${o.reference.structuralRef.itemId}].position.along`)
    }
    assert.deepEqual(failing((f) => (pressingZone(f).geometry.interval = { from: 6, to: 12 })), ['1b', '4c', '4d'], 'bite: the end zone moved off the end line')
    // FIX (V1 L1): 1b's 'the zone has depth' bites (an end zone with no depth at the end line).
    assert.deepEqual(failing((f) => (pressingZone(f).geometry.interval = { from: 0, to: 0 })), ['1b', '4c', '4d'], 'bite: an end zone with no depth')
    const toEscaping = (f: any) => {
        for (const t of f.game.transitions as any[]) if ((t.selector as any[]).some((s) => s.attribute === 'trigger' && s.value === 'OUT_END_LINE')) t.awardedTo = 'ROLE_HOLDER_ESCAPING'
    }
    assert.deepEqual(failing(toEscaping), ['1e'], 'bite: the end-line award given back to the escaping team')
    // FIX (V1 L1): 1e's START and SCORE awards under HPE-2's shape bite, each on its own (the restart given to the pressing team).
    for (const trigger of ['START', 'SCORE']) {
        const toPressing = (f: any) => {
            for (const t of f.game.transitions as any[]) if ((t.selector as any[]).some((s) => s.attribute === 'trigger' && s.value === trigger)) t.awardedTo = 'ROLE_HOLDER_PRESSING'
        }
        assert.deepEqual(failing(toPressing), ['1e'], `bite: the ${trigger} restart given to the pressing team`)
    }
    assert.deepEqual(failing((f) => (f.game.blocks = { endAssignment: 'EXCHANGED', timer: 'EVERY_3_MINUTES' })), ['2c', '3d'], 'bite: an end assignment holding more than the ends is an element of another kind again')
    assert.deepEqual(failing((f) => ((f.game.value.primaryEvent.conditions as any[]).find((c) => c.type === 'origin').value = 'established coordinated pressure')), ['4a'], "bite: HPE-1's origin value")
    assert.deepEqual(failing((f) => ((f.game.value.primaryEvent.conditions as any[]).find((c) => c.type === 'progression').value = 'beyond')), ['4a'], "bite: HPE-1's progression value")
    // And RPC-PROP-026 under HPE-2's shape: the end-line award given back reads 'partly punished' with the give-back named.
    const rows = walkthroughOf(H2, changedBuilt(toEscaping), H2.answer, HPE2_SHAPE).answers[3].rows
    assert.ok(rows.find((r) => r.rowId === 'RPC-PROP-026')!.reading.includes('returns it to the escaping team at the restart'))
})

test('B10, B11 the two-team check: A02-HPE1 has a finding on (i) (the pressing team scores by a dribble only) and (ii) (the ball over an end line comes back to the escaping team whoever put it out), none on (iii); A02-HPE2 has none on (i) to (iii); (iv) and (v) reported on both (the lead state); the negative controls through the real chain find (ii) and (i); each question bites; gating nothing', () => {
    const checks = Object.fromEntries(CHECKS(RUNS).map(({ id, check }) => [id, check])) as Record<string, TwoTeamCheck>
    const kinds = (c: TwoTeamCheck) => c.answers.map((a) => `${a.id} ${a.kind}`)
    assert.deepEqual(kinds(checks[REVIEW_RUN]), ['i FINDING', 'ii FINDING', 'iii NO FINDING', 'iv REPORTED', 'v REPORTED'])
    assert.deepEqual(kinds(checks[REVIEW2]), ['i NO FINDING', 'ii NO FINDING', 'iii NO FINDING', 'iv REPORTED', 'v REPORTED'])
    assert.deepEqual(kinds(checks[CONTROL_IDS[0]]), ['i NO FINDING', 'ii FINDING', 'iii NO FINDING', 'iv REPORTED', 'v REPORTED'])
    assert.deepEqual(kinds(checks[CONTROL_IDS[1]]), ['i FINDING', 'ii NO FINDING', 'iii NO FINDING', 'iv REPORTED', 'v REPORTED'])
    // The controls' stops: the end-line award given back serves; the pressing line needs the two-targets template HPE-2's wording does not hold,
    // so it is refused at communication (the realized game, which the check reads, exists either way).
    assert.deepEqual(RUNS.controls.map((c) => [c.id, c.answer.outcome, c.answer.stage]), [[CONTROL_IDS[0], 'served', null], [CONTROL_IDS[1], 'refused', 'communication']])
    assert.ok(checks[REVIEW_RUN].findings.some((f) => f.startsWith('(i)') && f.includes('the pressing team: line_crossed') && f.includes('not by a reception')))
    assert.ok(checks[REVIEW_RUN].findings.some((f) => f.startsWith('(ii)') && f.includes('goes to ROLE_HOLDER_ESCAPING, whoever touched it last')))
    for (const id of [REVIEW_RUN, REVIEW2]) {
        assert.ok(checks[id].answers[3].evidence.every((e) => e.includes("the escaping team's eligibility depends on the pressing team's choice")), `${id}: (iv) reports the dependency`)
        assert.ok(checks[id].answers[4].evidence.every((e) => e.includes('no element reads the score') && e.includes('a leading pressing team may decline to press together')), `${id}: (v) reports the lead state`)
    }
    assert.ok(checks[REVIEW2].answers[3].evidence.every((e) => e.includes("the coach's restart (COACH_JUDGED_EPISODE_CONCLUSION")) && !checks[REVIEW_RUN].answers[3].evidence.some((e) => e.includes("the coach's restart")))
    // Bites on changed copies of HPE-2's realized game: (iii) the pressing target moved to the far end; (iv) the origin condition removed; (v) an
    // element reading the score added; (i) the end zone given no depth; (ii) a side-line restart to a fixed role.
    const changedBuilt = (change: (fixture: any) => void) => {
        const built = copy({ fixture: H2.built.fixture })
        for (const b of built.fixture.roleBlocks.blocks) change(b.fixture)
        return built
    }
    const answerOf = (change: (fixture: any) => void, id: string) => twoTeamCheckOf('BITE', changedBuilt(change)).answers.find((a) => a.id === id)!
    const pressingZone = (f: any) => {
        const o = (f.game.objectives as any[]).find((x) => x.role === 'PRIMARY_SCORING' && x.team === 'TEAM_AT_AXIS_END')
        return (f.status.geometry as any[]).find((g) => g.path === `space.regions[c:${o.reference.structuralRef.contractId}:${o.reference.structuralRef.itemId}].position.along`)
    }
    assert.equal(answerOf((f) => (pressingZone(f).geometry.interval = { from: 34, to: 40 }), 'iii').kind, 'FINDING', 'bite (iii)')
    assert.ok(answerOf((f) => (f.game.value.primaryEvent.conditions = (f.game.value.primaryEvent.conditions as any[]).filter((c) => c.type !== 'origin')), 'iv').evidence.every((e) => e.includes("no condition ties the escaping team's points")), 'bite (iv)')
    assert.ok(answerOf((f) => (f.game.value.modifiers = [{ elementId: 'BITE' }]), 'v').evidence.every((e) => e.includes('elements that read the score: value.modifiers')), 'bite (v)')
    assert.equal(answerOf((f) => (pressingZone(f).geometry.interval = { from: 0, to: 0 }), 'i').kind, 'FINDING', 'bite (i): a zone with no depth')
    assert.equal(answerOf((f) => f.game.transitions.push({ ...copy(f.game.transitions[0]), elementId: 'BITE', selector: [{ attribute: 'trigger', op: '=', value: 'OUT_TOUCHLINE' }], awardedTo: 'ROLE_HOLDER_PRESSING', qualifiers: null }), 'ii').kind, 'FINDING', 'bite (ii): a side-line restart to a fixed role')
    // FIX (V1 L1): (ii)'s exemption bites: an end-line award to a fixed role keyed to the other role's last touch never returns the ball to the
    // team that put it out (NO FINDING); the same award without the key is a FINDING.
    const endLineTo = (lastTouch: string | null) => (f: any) => {
        const t = (f.game.transitions as any[]).find((x) => (x.selector as any[]).some((s) => s.attribute === 'trigger' && s.value === 'OUT_END_LINE'))
        f.game.transitions.push({ ...copy(t), elementId: 'BITE', awardedTo: 'ROLE_HOLDER_ESCAPING', qualifiers: { ...(t.qualifiers ?? {}), lastTouch } })
    }
    assert.equal(answerOf(endLineTo('ROLE_HOLDER_PRESSING'), 'ii').kind, 'NO FINDING', "bite (ii): keyed to the other role's last touch, exempt")
    assert.equal(answerOf(endLineTo(null), 'ii').kind, 'FINDING', 'bite (ii): the same award with no key is found')
    // A run with no role blocks is not read (plain GF2, the walkthrough's negative control).
    assert.ok(twoTeamCheckOf('A02-GF2W', B3.get('A02-GF2W')!.built).answers.every((a) => a.kind === 'NOT READ'))
})

test("B12, B5 the coach text of A02-HPE2 (served at review level): every engine sentence printed exactly once, as said or stated by one sentence of ours; every line marked and graded and every ILLUSTRATIVE quantity labelled; RPC-STMT-010 printed from the library as Christian's approved coach translation, its marker naming the source and the date the reply was received; 10 lines; the stated differences from the engine hold; bites", () => {
    const { print, said, illustrativeOf, engine, reading, words } = reviewPrint2(H2)
    assert.deepEqual(printRefusals(print, said, illustrativeOf), [])
    assert.deepEqual(print.findings, [])
    // FIX (V2 F1, F2), re-pinned openly: was 430 words (the said scoring sentence 3 words shorter).
    assert.deepEqual([said.length, words], [19, 427])
    const byPart = ['Setup', 'Rules', 'Scoring', 'Learning explanation'].flatMap((part) => print.lines.filter((l) => l.part === part))
    assert.deepEqual(byPart.map((l) => [l.part, l.shownMarker, 'printed' in l.of ? l.of.printed : 'said']), EXPECTED_LINES)
    assert.deepEqual([reading.total.lines, reading.total.sentences, reading.total.words], EXPECTED_READING)
    assert.ok(engine.every((l) => !l.includes('PRINTED 0 TIMES') && !l.includes('PRINTED 2 TIMES')))
    // B5: the translation is the library's row, ACTIVE, the context's COACH_TRANSLATION, verbatim.
    assert.ok(TRANSLATION_ROW && TRANSLATION_ROW.row.statement_text === TRANSLATION && TRANSLATION_ROW.row.status === 'ACTIVE' && TRANSLATION_ROW.row.statement_type === 'COACH_TRANSLATION' && TRANSLATION_ROW.row.rpc_id === 'RPC-002')
    assert.ok(print.text.includes(`[A: ${TRANSLATION_MARKER}] ${TRANSLATION} (${TRANSLATION_NOTE})`), print.text)
    assert.ok(ruling('A02-13NOV-SEQUENCE').words.some((w) => w.includes('existing approved High Press Escape coach translation')))
    // Every difference stated in the evidence still holds of the printed sentence and the engine sentences it stands for.
    for (const d of DIVERGENCES2) {
        // FIX (V2 F13): a difference may be the said entry's (W1) as well as a printed sentence's.
        const p = (WORDING2.printerOnly.find((x) => x.id === d.id) ?? WORDING2.entries.find((e) => e.id === d.id))!
        assert.ok(p, d.id)
        if (d.has) assert.ok(p.sentence.includes(d.has), `${d.id} says '${d.has}'`)
        if (d.dropped) assert.ok(!p.sentence.includes(d.dropped) && (p.standsFor ?? []).some((s) => s.includes(d.dropped!)), `${d.id} leaves out '${d.dropped}'`)
    }
    // FIX (V2 F12, F5): the notes measured: H2b 16 carries the marked line's label with no quantity of it in its words; Q4 governs W1 with no item.
    const notes = engineNotes2(said, illustrativeOf)
    assert.equal(notes.length, 2, json(notes))
    assert.ok(notes[0].startsWith("H2b 16 ('When you call the next block") && notes[0].includes("'ILLUSTRATIVE: a schematic 12 m from the escaping team's end line"), notes[0])
    assert.ok(notes[1].startsWith('Q4 ') && notes[1].includes('but 0 items wait on it'), notes[1])
    // FIX (V2 F1, F2, F3): the scoring sentence asks the coach for the escape and says the crossing ('a ball played over it'), no 'attempt' and no
    // 'beyond'; the end-line restart names the marked line.
    const w1 = WORDING2.entries[0].sentence
    assert.ok(w1.startsWith('The escaping team scores a point when it escapes the pressing team pressing together:') && w1.includes('receives and controls a ball played over it') && !w1.includes('attempt') && !w1.includes('beyond'), w1)
    assert.ok(WORDING2.printerOnly.find((p) => p.id === 'A02-HPE2-R2')!.sentence.includes('the pressing team on the marked line'))
    // FIX (V2 F14, F15): the possession sentence is printed with its full stop (its words as said, H2b keeps the engine's); the heading says what
    // [A] means on a sentence printed as said.
    const possession = print.lines.find((l) => l.plain.startsWith('When possession changes'))!
    assert.ok(possession.text.endsWith('the same target.') && !possession.plain.endsWith('.'), possession.text)
    assert.ok(engine.some((l) => l.endsWith('keeps attacking the same target -> printed as said')))
    assert.ok(print.text.includes(APPROVED_SAID))
    // No prescription for defensive behaviour, and no live origin sentence: 'set to press together' is in no sentence of ours.
    assert.ok(print.lines.every((l) => !l.plain.includes('set to press together')))
    // Bites: the translation's source cut to [A]; the possession sentence's source stripped; a [P] made [C]; a stated sentence's grade dropped.
    const remarked = (start: string, from: string, to: string): FourPartPrint => ({ ...print, lines: print.lines.map((l) => (l.plain.startsWith(start) ? { ...l, shownMarker: l.shownMarker.split(from).join(to) } : l)) })
    for (const [start, from, to, what] of [
        [TRANSLATION.slice(0, 20), `: ${TRANSLATION_MARKER}`, '', "the translation's source cut to [A]"],
        ['When possession changes', ": Christian's approved wording POSSESSION_CONTINUES, received 25 October 2026", '', "the possession sentence's source stripped"],
        ['If the ball goes over an end line', '[P', '[C', '[P] made [C] on the end-line line'],
    ])
        assert.ok(printRefusals(remarked(start, from, to), said, illustrativeOf).some((r) => r.includes('shows the marker')), `bite: ${what} is caught`)
    const stripped: FourPartPrint = { ...print, lines: print.lines.map((l) => ({ ...l, shownMarker: l.shownMarker.split(' | PROPOSED Q6').join('') })) }
    assert.ok(printRefusals(stripped, said, illustrativeOf).some((r) => r.includes('does not show its grade PROPOSED Q6')), 'bite: a PROPOSED Q6 grade stripped')
    const unlabelled: FourPartPrint = { ...print, lines: print.lines.map((l) => ({ ...l, text: l.text.split('ILLUSTRATIVE: a schematic 6 m depth for the end zone, for this 40 m area only').join('') })) }
    assert.ok(printRefusals(unlabelled, said, illustrativeOf).some((r) => r.includes('without its label (ILLUSTRATIVE: a schematic 6 m depth')), "bite: the end zone's ILLUSTRATIVE label stripped")
})

test('the static scan and production: no production module names the HPE-2 configuration, its store or its wording; the coach\'s builds (A02 refused, A01 served) say none of HPE-2\'s sentences', () => {
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
    for (const word of ['hpe2.PROPOSED', 'a02-hpe2', 'A02-HPE2']) {
        const naming = files.filter((f) => fs.readFileSync(f, 'utf8').includes(word)).map((f) => path.relative(SRC, f))
        assert.deepEqual(naming, [], `${word} is named by: ${naming.join(', ')}`)
    }
    const a02 = { kind: 'learning-goal', goalId: 'A02', situationId: null, session: sessionOf(H2.request.session) } as any
    const a01 = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf({ ...H2.request.session, players: 12, specializedRoles: 1, goals: 0, durationMin: 20 }) } as any
    const ours = [...WORDING2.entries.map((e) => e.sentence), ...WORDING2.printerOnly.map((p) => p.sentence)]
    for (const b of [buildActivity(a02), buildActivity(a01)]) for (const s of ours) assert.ok(!JSON.stringify(b).includes(s.slice(0, 60)), s)
})

test('the evidence: generated twice from two builds, identical; equal to the committed files (rewritten only under UPDATE_A02_HPE2_EVIDENCE=1); double quotation marks only around Christian\'s words; no gendered pronoun', () => {
    const first = evidenceOf(RUNS)
    const second = evidenceOf(buildHpe2(hpe1Again()))
    assert.equal(second.report, first.report, 'two builds, identical report')
    assert.equal(second.json, first.json, 'two builds, identical results')
    const words = new Set(inputs2.rulings.flatMap((r) => r.words))
    const spans = quotedSpans(first.report)
    assert.ok(spans.length > 5)
    for (const s of spans) assert.ok(words.has(s), `a double-quoted span that is not Christian's words: ${s}`)
    for (const [file, text] of [['a02-hpe2-report.txt', first.report], ['a02-hpe2-results.json', first.json]]) {
        const hit = text.split('\n').findIndex((l) => holdsGenderedPronoun(l))
        assert.equal(hit, -1, `${file}: a gendered pronoun at line ${hit + 1}`)
    }
    assert.ok(!first.report.includes(os.tmpdir()) && !first.json.includes(os.tmpdir()), 'no temporary path is printed')
    const reportFile = path.join(EVIDENCE, 'a02-hpe2-report.txt')
    const jsonFile = path.join(EVIDENCE, 'a02-hpe2-results.json')
    if (process.env.UPDATE_A02_HPE2_EVIDENCE === '1') {
        fs.writeFileSync(reportFile, first.report)
        fs.writeFileSync(jsonFile, first.json)
        quiet('  (evidence rewritten under UPDATE_A02_HPE2_EVIDENCE=1)')
    }
    if (process.env.A02_HPE2_EVIDENCE_BODY) fs.writeFileSync(process.env.A02_HPE2_EVIDENCE_BODY, first.report)
    assert.equal(fs.readFileSync(reportFile, 'utf8'), first.report, 'a02-hpe2-report.txt equals the generated report')
    assert.equal(fs.readFileSync(jsonFile, 'utf8'), first.json, 'a02-hpe2-results.json equals the generated results')
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-hpe2.unit.ts'))
})

quiet(`a02 HPE-2 (package 5): ${passed} passed`)
