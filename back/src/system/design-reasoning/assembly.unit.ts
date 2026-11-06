/**
 * Unit tests — the bounded A05 activity-assembly experiment, review pathway only, offline (Christian's second reply of 5 November 2026:
 * *"Test that the assembled activity's written instructions faithfully express its underlying configuration, including scoring,
 * restarts, rules, and player relationships."* / *"As before, passing engineering tests should not be presented as proof of
 * representative learning effectiveness."*).
 *
 * The lead's design, section 8, items (a) to (y), each a function below named for its item:
 *   faithfulness (a)-(k): every material value reaches the coach text or the learning-design block; `expresses` equals what a template
 *     says; a changed value changes or refuses the text, for every value; keywords imply the value they concern; numbers bound in order;
 *     the prescription lexicon (fidelity's own OBLIGATIONS) over every unquoted sentence; scoring sentences name the target zone, never a
 *     line; the observation block keeps the starting condition out but for one pointer; no effect claim in the rationale; the workbook
 *     text printed byte-equal and never stated as a rule; display texts equal their cells;
 *   provenance (l)-(q): his six classes table-driven; the validator's bite tests; value evidence verbatim in his words; flip tests for
 *     what the code computes; every scope and note printed; the Stage 2 grouping fails closed;
 *   forms and scenarios (r)-(s); Laws and contracts (t)-(u); isolation and determinism (v)-(y).
 * Each lexical check has a bite test: a planted bad sentence must fail it.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { namesRole, numbersIn, OBLIGATIONS, ROLE_ORDERING, TARGET_AS_LINE } from '../rendering/fidelity'
import { rpcLibrary } from '../sport-module/rpc-library'
import { displayCell, displayTextsFor, DISPLAY_ALLOWLIST } from './assembly-display'
import {
    AssembledActivity,
    Choice,
    ClassInput,
    committedExperimentData,
    committedWordingData,
    Experiment,
    markerOf,
    placeholdersOf,
    SIX_CLASSES,
    SixClass,
    sixClassOf,
    validateExperiment,
    validateWording,
    Wording,
} from './assembly'
import { AssemblyRun, buildAssemblyReport, runAssembly, suitabilityReview } from './assembly-review'
import { activeContextRelationships, cell, committedKnowledge, contextIdentityRules, contextValidationRules, DesignKnowledge, STANDINGS, Standing } from './knowledge'
import { runStage2ForEveryGoal, STAGE2_STANDING } from './stage2'
import { conclusionGroup, STANDING_ORDER, weakestStanding } from './trace'

const HERE = __dirname
const SRC = path.resolve(HERE, '..', '..')
const BACK = path.resolve(SRC, '..')
const REPO = path.resolve(BACK, '..')
const json = (v: unknown) => JSON.stringify(v)

type Raw = Record<string, any>
const display = (k: DesignKnowledge, x: Experiment, r: Parameters<typeof displayTextsFor>[2], f: Parameters<typeof displayTextsFor>[3]) => displayTextsFor(k, x, r, f, 'Learning Goal')
const run = (k: DesignKnowledge = committedKnowledge(), x: unknown = committedExperimentData(), w: unknown = committedWordingData()): AssemblyRun => runAssembly(display, k, x, w)
const rawX = () => committedExperimentData() as Raw
const rawW = () => committedWordingData() as Raw
const BASE = run()
const REPORT = buildAssemblyReport(BASE)
const REPORT_TEXT = REPORT.report
const RESULTS_TEXT = json(REPORT.results)
const sentences = (r: AssemblyRun = BASE) => r.composed.sections.flatMap((s) => s.sentences)
/** A sentence with every double-quoted span removed (his quoted words, and approved text, are checked verbatim instead). */
const unquoted = (t: string) => t.replace(/"[^"]*"/g, '"…"')
const choiceOf = (x: Experiment, p: string) => x.choices.find((c) => c.path === p) as Choice
const throwsWith = (fn: () => unknown, label: string) => assert.throws(fn, undefined, label)

// -------------------------------------------------------------------------------------------------------------------------------------
// Faithfulness (a)-(k)
// -------------------------------------------------------------------------------------------------------------------------------------

const EXEMPT = ['scoring.qualifyingCondition.workbookText', 'scoring.qualifyingCondition.sep13Text', 'coachQuestion']

function unexpressedOf(r: AssemblyRun): string[] {
    const expressed = new Set([...r.composed.expressed, ...r.design.flatMap((d) => d.expresses)])
    return r.experiment.choices.map((c) => c.path).filter((p) => !r.experiment.exemptions.some((e) => e.path === p) && !expressed.has(p))
}

/** (a) Every material value (every choice minus the pinned exemptions) is expressed; the nine parts are all covered. */
function testA_everyMaterialValueIsExpressed(): void {
    assert.deepEqual(BASE.experiment.exemptions.map((e) => e.path), EXEMPT, 'the exemptions are pinned')
    assert.deepEqual(unexpressedOf(BASE), [])
    assert.equal(BASE.experiment.requiredParts.length, 9)
    for (const p of BASE.experiment.requiredParts) assert.ok(p.paths.length > 0 || p.generatedFromTrace, p.part)
    // Bites: without the continuous-play sentence, or without the Game Problems in the learning-design block, a value goes unexpressed.
    const w = rawW()
    w.templates = w.templates.filter((t: Raw) => t.id !== 'ru-continuous')
    assert.deepEqual(unexpressedOf(run(committedKnowledge(), rawX(), w)), ['play.continuous'])
    const x = rawX()
    x.designBlockPaths = x.designBlockPaths.filter((p: string) => p !== 'gameProblems.primary' && p !== 'gameProblems.secondary')
    assert.deepEqual(unexpressedOf(run(committedKnowledge(), x)), ['gameProblems.primary', 'gameProblems.secondary'])
}

/** (b) Each template's `expresses` equals its placeholders plus its whenValue paths; a template that claims more or less is refused. */
function testB_expressesEqualsWhatTheTemplateSays(): void {
    for (const t of BASE.wording.templates) assert.deepEqual([...t.expresses].sort(), [...new Set([...placeholdersOf(t.text), ...Object.keys(t.whenValue ?? {})])].sort(), t.id)
    const w = rawW()
    w.templates.find((t: Raw) => t.id === 'ru-offside').expresses = ['rules.offside', 'rules.fouls']
    throwsWith(() => validateWording(w, BASE.experiment), 'a template claiming a path it does not say')
    const w2 = rawW()
    w2.templates.find((t: Raw) => t.id === 'st-zones').expresses = ['endZones.placement', 'area.includesEndZones']
    throwsWith(() => validateWording(w2, BASE.experiment), 'a template saying a placeholder it does not claim')
}

/** (c) Mutating EVERY value: the pipeline refuses, or the new value appears in a sentence that expresses that path. */
function testC_everyValueMutationReachesTheTextOrRefuses(): void {
    let reached = 0
    let refused = 0
    for (const c of BASE.experiment.choices) {
        const x = rawX()
        const target = x.choices.find((y: Raw) => y.path === c.path)
        const v = target.value
        const next = typeof v === 'number' ? v + 1 : typeof v === 'boolean' ? !v : 'SENTINEL_MUTATION'
        target.value = next
        let r: AssemblyRun
        try {
            r = run(committedKnowledge(), x)
        } catch {
            refused++
            continue
        }
        const exempt = BASE.experiment.exemptions.some((e) => e.path === c.path)
        const texts = exempt ? [buildAssemblyReport(r).report] : [...sentences(r).filter((s) => s.expresses.includes(c.path)).map((s) => s.text), ...r.design.filter((d) => d.expresses.includes(c.path)).map((d) => d.text)]
        const shown = r.activity.choices.find((y) => y.path === c.path)?.rendered ?? ''
        assert.ok(texts.some((t) => t.includes(String(next)) || (shown !== String(next) && t.includes(shown))), `${c.path}: changed to ${String(next)} but no sentence expressing it shows it`)
        reached++
    }
    assert.equal(reached + refused, BASE.experiment.choices.length)
    assert.ok(reached >= 8 && refused >= 30, `reached ${reached}, refused ${refused}`)
    console.log(`mutation loop over ${BASE.experiment.choices.length} values: ${reached} reached the text, ${refused} refused`)
}

const KEYWORDS: Array<[string, string[]]> = [
    ['offside', ['rules.offside']],
    ['kick-off', ['start.method', 'start.kickoffDetails', 'restart.afterPoint.method']],
    ['kickoff', ['start.method', 'start.kickoffDetails', 'restart.afterPoint.method']],
    ['throw-in', ['restart.touchline']],
    ['free kick', ['rules.fouls']],
    ['handl', ['rules.handling']],
    ['target zone', ['endZones.depthM', 'endZones.placement', 'endZones.positioning', 'endZones.access', 'scoring.event', 'scoring.means', 'scoring.afterRegain', 'scoring.startingCondition', 'scoring.mirrored', 'directions', 'area.includesEndZones', 'equipment.markers']],
    ['halfway', ['area.halfwayLine', 'equipment.markers']],
    ['centre mark', ['area.centreMark', 'equipment.markers']],
    ['block', ['duration.blocks', 'duration.blockMinutes', 'duration.breaks', 'win.condition']],
    ['minute', ['duration.blocks', 'duration.blockMinutes']],
    ['bib', ['equipment.bibs']],
    ['point', ['scoring.event', 'scoring.means', 'scoring.mirrored', 'win.condition', 'restart.afterPoint.method', 'restart.afterPoint.who']],
    ['goalkeeper', ['players.goalkeepers', 'area.goalkeepersCounted']],
    ['end line', ['restart.endLine.status', 'restart.endLine.illustrativeValue']],
    ['touchline', ['restart.touchline']],
    ['penalty', ['laws.goalEnd']],
    ['corner', ['laws.goalEnd']],
    ['goal kick', ['laws.goalEnd']],
    ['continu', ['play.continuous']],
]
const keywordViolations = (list: Array<{ id: string; text: string; expresses: string[] }>) =>
    list.flatMap((s) => KEYWORDS.filter(([word, paths]) => unquoted(s.text).toLowerCase().includes(word) && !paths.some((p) => s.expresses.includes(p))).map(([word]) => `${s.id}: "${word}"`))

/** (d) A sentence containing a keyword expresses the value the keyword concerns. */
function testD_keywordsImplyTheirValues(): void {
    assert.deepEqual(keywordViolations(sentences()), [])
    assert.deepEqual(keywordViolations([{ id: 'planted', text: 'Offside applies near the halfway line.', expresses: ['area.lengthM'] }]), ['planted: "offside"', 'planted: "halfway"'])
}

const NUMBER_WORDS = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/i
const numberViolations = (w: Wording, r: AssemblyRun): string[] => {
    const out: string[] = []
    for (const t of w.templates) {
        const literal = t.text.replace(/\{[A-Za-z0-9.]+\}/g, ' ')
        if (numbersIn(literal).length || /\d/.test(literal) || NUMBER_WORDS.test(literal)) out.push(`${t.id}: a number in the template's own words`)
    }
    for (const s of sentences(r)) {
        const t = w.templates.find((x) => x.id === s.id) as Raw
        const expected = placeholdersOf(t.text).flatMap((p) => numbersIn((r.activity.choices.find((c) => c.path === p) as Raw).rendered))
        if (json(numbersIn(s.text)) !== json(expected)) out.push(`${s.id}: numbers ${json(numbersIn(s.text))} but its values give ${json(expected)}`)
        if (/\d[A-Za-z]|[A-Za-z]\d/.test(unquoted(s.text))) out.push(`${s.id}: a digit next to a letter`)
        if (/\b(GP|RPC|GA|GAK)-\d|\bGF\d|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(s.text)) out.push(`${s.id}: an id or a date`)
    }
    return out
}

/** (e) Numbers: the templates' own words carry none; each sentence's numbers equal its values', in order; no digit beside a letter. */
function testE_numbersAreBoundToTheirValues(): void {
    assert.deepEqual(numberViolations(BASE.wording, BASE), [])
    const w = rawW()
    w.templates.find((t: Raw) => t.id === 'st-zones').text = 'At each end, mark a target zone {endZones.depthM}m deep across the full width of the area; both target zones are inside the area.'
    const r = run(committedKnowledge(), rawX(), w)
    assert.ok(numberViolations(r.wording, r).some((v) => v.startsWith('st-zones: a digit next to a letter')), 'bite: 5m')
    const w2 = rawW()
    w2.templates.find((t: Raw) => t.id === 'ru-offside').text = 'There is no offside for two minutes.'
    const r2 = run(committedKnowledge(), rawX(), w2)
    assert.ok(numberViolations(r2.wording, r2).some((v) => v.startsWith('ru-offside: a number')), 'bite: a number in the words')
}

/** Specialized roles the configuration names: none (no target player, no goalkeeper), so the role-ordering rule is vacuous here. */
const SPECIALIZED_ROLES: string[] = []
const obligationViolations = (list: Array<{ id: string; text: string; quoted?: boolean }>, exempt: Array<{ id: string; word: string; path: string }> = []) =>
    list.flatMap((s) => {
        if (s.quoted) return []
        const t = unquoted(s.text)
        const hits = OBLIGATIONS.filter((re) => re.test(t)).map((re) => re.source).filter((src) => !exempt.some((e) => e.id === s.id && src.includes(e.word)))
        const ordering = SPECIALIZED_ROLES.some((role) => namesRole(t, role)) && ROLE_ORDERING.some((re) => re.test(t)) ? ['role ordering'] : []
        return [...hits, ...ordering].map((h) => `${s.id}: ${h}`)
    })

/** (f) Fidelity's prescription lexicon over every unquoted coach sentence; quoted text verbatim against its source; bite. */
function testF_noPrescriptionAndQuotesAreVerbatim(): void {
    const PINNED_EXEMPTIONS: Array<{ id: string; word: string; path: string }> = []
    assert.deepEqual(obligationViolations(sentences(), PINNED_EXEMPTIONS), [])
    assert.deepEqual(obligationViolations(BASE.design.map((d, i) => ({ id: `design-${i}`, text: d.text }))), [])
    assert.deepEqual(SPECIALIZED_ROLES, [], 'ROLE_ORDERING is recorded vacuous: the configuration names no specialized role')
    assert.equal(obligationViolations([{ id: 'planted', text: 'Players must pass before shooting.' }]).length > 0, true, 'bite')
    // Quoted text: his words verbatim in the record; the approved scoring-event description verbatim from its cell.
    for (const t of BASE.wording.templates.filter((x) => x.quote)) {
        const r = BASE.experiment.rulings.find((y) => y.id === t.quote?.rulingRef)
        assert.ok(r && r.words.includes(t.text), t.id)
    }
    const k = committedKnowledge()
    const vocab = k.contexts.controlled_vocabulary.find((r) => cell(r, 'vocabulary') === 'scoring_event' && cell(r, 'value') === 'target_zone_entered')
    assert.ok(sentences().find((s) => s.id === 'sc-event')?.text.includes(`"${cell(vocab, 'description')}"`))
}

const scoringViolations = (list: Array<{ id: string; text: string; expresses: string[] }>) =>
    list
        .filter((s) => s.expresses.some((p) => p.startsWith('scoring.')))
        .flatMap((s) => {
            const t = unquoted(s.text)
            const out: string[] = []
            if (!t.includes('target zone')) out.push(`${s.id}: does not name the target zone`)
            if (/\bline/i.test(t) || /\bcross/i.test(t)) out.push(`${s.id}: says line or cross`)
            if (TARGET_AS_LINE.some((re) => re.test(t))) out.push(`${s.id}: a target called a line`)
            return out
        })

/** (g) Every sentence expressing a scoring value names the target zone, never a line; bite. */
function testG_scoringSentencesNameTheTargetZone(): void {
    assert.deepEqual(scoringViolations(sentences()), [])
    assert.ok(sentences().filter((s) => s.expresses.some((p) => p.startsWith('scoring.'))).length >= 5)
    assert.ok(scoringViolations([{ id: 'planted', text: 'A point is scored by crossing the far end line.', expresses: ['scoring.event'] }]).length >= 2, 'bite')
}

const STARTING_WORDS = /starting condition|where the attack starts|from deep|\borigin|build from/i
/** (h) The observation block: his sentence verbatim; the starting condition only in the pinned pointer; no numbers or learning claims. */
function testH_observationBlock(): void {
    const block = BASE.composed.sections.find((s) => s.id === 'CD-WATCH')?.sentences ?? []
    assert.ok(block.some((s) => s.text === 'Both scoring situations remain legitimate.'))
    assert.deepEqual(block.filter((s) => STARTING_WORDS.test(s.text)).map((s) => s.id), ['ob-pointer'])
    for (const s of block) {
        assert.ok(!/\d|%|percent/i.test(s.text) && !NUMBER_WORDS.test(s.text), `${s.id}: a number`)
        assert.ok(!/\blearning\b|\bevidence\b/i.test(s.text), `${s.id}: a learning or evidence claim`)
    }
    // The pointer says the categories decide nothing about scoring and do not settle the starting condition.
    assert.match(block.find((s) => s.id === 'ob-pointer')?.text ?? '', /do not decide whether .* counts, and they do not settle the role of the attack's starting condition/)
    // And the starting condition is shown in Scoring, as an open question.
    assert.ok(BASE.composed.sections.find((s) => s.id === 'CD-SCORING')?.sentences.some((s) => s.expresses.includes('scoring.startingCondition') && s.text.includes('not yet decided')))
}

const EFFECT_WORDS = /\b(invite[sd]?|encourage[sd]?|create[sd]? opportunit\w*|creates opportunit\w*|help[s]? players|improve[sd]?|develop[sd]?|promote[sd]?|ensure[sd]?|leads to|so that|restore[sd]?|reorganize[sd]?)\b/i
const rationaleLines = (report: string) => {
    const lines = report.split('\n')
    const start = lines.findIndex((l) => l.startsWith('DESIGN RATIONALE'))
    const end = lines.findIndex((l, i) => i > start && l.startsWith('==='))
    return lines.slice(start + 1, end).filter((l) => l.trim())
}
/** (i) Each rationale line cites a value; no effect wording outside his quoted words; bite. */
function testI_rationaleMakesNoEffectClaim(): void {
    const lines = rationaleLines(REPORT_TEXT)
    const paths = BASE.experiment.choices.map((c) => c.path)
    assert.equal(lines.length, paths.length)
    for (const l of lines) {
        assert.ok(paths.some((p) => l.trim().startsWith(`${p}:`)), l)
        assert.ok(!EFFECT_WORDS.test(unquoted(l)), l)
    }
    assert.ok(EFFECT_WORDS.test(unquoted('The target zones encourage players to create space.')), 'bite')
}

/** (j) No coach sentence states the possession clause as a rule; the printed workbook text is byte-equal to its cell. */
function testJ_workbookTextAndThePossessionClause(): void {
    for (const s of sentences()) assert.ok(!s.text.includes('while maintaining attacking possession'), s.id)
    const k = committedKnowledge()
    const prop = k.contexts.properties.find((r) => r['property_id'] === 'RPC-PROP-134') as Raw
    const printed = BASE.activity.choices.find((c) => c.path === 'scoring.qualifyingCondition.workbookText')
    assert.equal(printed?.value, prop['property_text'])
    assert.equal(printed?.value, rpcLibrary.primaryScoringCondition('RPC-003'))
    assert.ok(REPORT_TEXT.includes(`"${prop['property_text']}"`))
}

/** (k) Every display text equals its cell; the new readers agree with the existing loader. */
function testK_displayTextsEqualTheirCells(): void {
    const k = committedKnowledge()
    const raw = (source: string, table: string) => (k as unknown as Record<string, Record<string, Raw[]>>)[source][table]
    for (const c of BASE.experiment.choices.filter((x) => x.readBy === 'DISPLAY_CELL')) {
        const ref = c.knowledgeRef as Raw
        const key = DISPLAY_ALLOWLIST.find((a) => a.table === ref.table && a.column === ref.column)?.keyColumn as string
        const rowKey = ref.table === 'controlled_vocabulary' ? ref.row.split(' ')[1] : ref.row
        const row = raw(ref.source, ref.table).find((r) => r[key] === rowKey && (ref.table !== 'controlled_vocabulary' || r.vocabulary === ref.row.split(' ')[0]))
        assert.equal(BASE.display.cells[c.path].text, row?.[ref.column], c.path)
    }
    for (const [id, n] of Object.entries(BASE.display.names)) {
        const row = id.startsWith('GF') ? raw('sportModule', 'game_forms').find((r) => r.game_form_id === id) : raw('gameProblems', 'gameProblems').find((r) => r.ID === id)
        assert.equal(n.text, id.startsWith('GF') ? row?.game_form_name : row?.Name, id)
    }
    assert.equal(BASE.display.goalName.text, raw('planning', 'learning_goals').find((r) => r.ID === 'A05')?.['Learning Goal'])
    throwsWith(() => displayCell(k, { source: 'planning', table: 'learning_goals', row: 'A05', column: 'Choose This When...' }), 'a cell outside the allowlist')
    // The readers this experiment added agree with the context library's own loader.
    for (const rpc of ['RPC-001', 'RPC-003', 'RPC-007']) {
        assert.deepEqual(contextIdentityRules(k, rpc).map((r) => r.identityRuleId), rpcLibrary.identityRules(rpc).map((r) => String(r['identity_rule_id'])).sort(), rpc)
        assert.deepEqual(contextValidationRules(k, rpc).map((r) => r.validationId), rpcLibrary.validationRules(rpc).map((r) => String(r['validation_id'])).sort(), rpc)
    }
    assert.deepEqual(activeContextRelationships(k, 'RPC-003', 'SCORING_EVENT').map((r) => r.relatedId).sort(), [...rpcLibrary.scoringEventsForContext('RPC-003')].sort())
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Provenance (l)-(q)
// -------------------------------------------------------------------------------------------------------------------------------------

/** (l) His six classes, table-driven over every standing and the provisional flag, with the mixed cases. */
function testL_sixClasses(): void {
    const expected: Record<Standing, SixClass | 'THROWS'> = { APPROVED: 1, RULING: 2, PROVISIONAL: 'THROWS', CANDIDATE: 3, 'REFERENCE ONLY': 'THROWS', OURS: 6, 'TEST ASSUMPTION': 4, 'TEST INPUT': 4, ILLUSTRATIVE: 5, UNRESOLVED: 6 }
    for (const s of STANDINGS) {
        if (expected[s] === 'THROWS') throwsWith(() => sixClassOf([{ standing: s }]), s)
        else assert.equal(sixClassOf([{ standing: s }]), expected[s], s)
    }
    assert.equal(sixClassOf([{ standing: 'RULING', provisional: true }]), 3, 'his provisional ruling')
    const mixed: Array<[ClassInput[], SixClass]> = [
        [[{ standing: 'OURS' }, { standing: 'ILLUSTRATIVE' }], 6],
        [[{ standing: 'ILLUSTRATIVE' }, { standing: 'TEST INPUT' }], 5],
        [[{ standing: 'RULING' }, { standing: 'ILLUSTRATIVE' }], 5],
        [[{ standing: 'APPROVED' }, { standing: 'APPROVED' }], 1],
        [[], 6],
    ]
    for (const [items, cls] of mixed) assert.equal(sixClassOf(items), cls, json(items))
    assert.equal(sixClassOf([{ standing: 'APPROVED' }], null, 'LOGICAL INFERENCE'), 6, 'a logical inference resting on approved rows is never class 1')
    throwsWith(() => sixClassOf([{ standing: 'Ruling' as Standing }]), 'an unknown standing')
    assert.equal(SIX_CLASSES.length, 6)
    const at = (p: string) => BASE.activity.choices.find((c) => c.path === p)
    for (const c of BASE.activity.choices.filter((x) => x.howReached === 'UNRESOLVED')) assert.equal(c.sixClass, 6, c.path)
    assert.equal(at('gameProblems.candidate')?.sixClass, 3, 'Gain Access')
    for (const p of ['scoring.event', 'rules.offside', 'start.method', 'observation.categories', 'opposition.reciprocal']) {
        assert.equal(at(p)?.sixClass, 3, `${p}: his provisional ruling, class 3`)
        assert.ok(REPORT_TEXT.includes(`his provisional ruling, received`), p)
    }
    for (const c of BASE.activity.choices.filter((x) => x.declaredStatus === 'ILLUSTRATIVE')) assert.equal(c.sixClass, 5, c.path)
    for (const c of BASE.activity.choices.filter((x) => x.declaredStatus === 'OURS')) assert.equal(c.sixClass, 6, c.path)
    // Each sentence's marker is the weakest class among its values; class 1 unmarked.
    for (const s of sentences()) {
        const classes = s.expresses.map((p) => (at(p) as Raw).sixClass as number)
        const cls = classes.length ? (Math.max(...classes) as SixClass) : null
        assert.equal(s.sixClass, cls, s.id)
        assert.equal(s.marker, markerOf(cls), s.id)
    }
    // "Status of this example" lists exactly the values not in class 1.
    const status = REPORT_TEXT.split('Status of this example')[1].split('\n\n')[0]
    for (const c of BASE.activity.choices) assert.equal(status.includes(`\n  ${c.path}: `), c.sixClass !== 1, c.path)
}

/** (m) The validator's bite tests: each planted defect throws. */
function testM_validatorBites(): void {
    const plant = (change: (x: Raw) => void, label: string) => {
        const x = rawX()
        change(x)
        throwsWith(() => validateExperiment(x), label)
    }
    const ch = (x: Raw, p: string) => x.choices.find((c: Raw) => c.path === p)
    plant((x) => (ch(x, 'teams.count').declaredStatus = 'Ruling'), 'unknown standing Ruling')
    plant((x) => (ch(x, 'players.perTeam').declaredStatus = 'ILLUSTRATIVE '), 'trailing space')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].standing = 'RULING '), 'trailing space in decidedBy')
    plant((x) => (ch(x, 'teams.count').notes = 'misspelt key'), 'unknown key on a choice')
    plant((x) => (x.citedonly = []), 'unknown top-level key')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].scope = 'x'), 'unknown key on a decisive item')
    plant((x) => delete x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').received, 'a ruling without received')
    plant((x) => delete x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').file, 'a ruling without file')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').words = []), 'a ruling without words')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].standing = 'PROVISIONAL'), 'decisive PROVISIONAL')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].standing = 'REFERENCE ONLY'), 'decisive REFERENCE ONLY')
    plant((x) => delete ch(x, 'teams.count').decidedBy[0].valueEvidence, 'missing valueEvidence')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].valueEvidence = 'Three opposing teams'), 'valueEvidence not in his words')
    plant((x) => (ch(x, 'players.perTeam').declaredStatus = 'APPROVED'), 'declared status stronger than decisive (and an illustrative value declared APPROVED)')
    plant((x) => (ch(x, 'endZones.positioning').decidedBy = [{ rulingRef: 'ASM-28OCT-PROVISIONAL', standing: 'RULING', valueEvidence: 'Scoring target: Controlled arrival in an appropriately positioned advanced end zone.' }]), 'an UNRESOLVED value decided by a ruling')
    plant((x) => (ch(x, 'gameProblems.candidate').decidedBy = [{ rulingRef: 'ASM-AUTH-GAIN-ACCESS', standing: 'RULING', valueEvidence: 'Gain Access remains a candidate relationship, not an approved addition.' }]), 'a CANDIDATE value decided by a ruling that only sets its status')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].rulingRef = 'ASM-NOT-FILED'), 'a ruling reference not in the registry')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').file = 'C:/Users/x/AppData/Local/Temp/scratchpad/reply.txt'), 'a scratchpad path')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-REV1-KICKOFF').scopeWords = ['not his words']), 'scope words not in his words')
    plant((x) => x.rulings.push({ ...x.rulings[0] }), 'a ruling filed twice')
    plant((x) => (ch(x, 'purpose').value = 'Typed purpose'), 'a value read by code given an entered value')
    // The committed record validates.
    validateExperiment(rawX())
}

/** (n) Every decisive ruling's value evidence is verbatim in his words; every decisive approved cell equals the cell; values agree. */
function testN_valueEvidence(): void {
    const k = committedKnowledge()
    const x = BASE.experiment
    for (const c of x.choices) {
        for (const d of c.decidedBy) {
            if (d.rulingRef) assert.ok(x.rulings.find((r) => r.id === d.rulingRef)?.words.some((w) => w.includes(d.valueEvidence as string)), `${c.path} ${d.rulingRef}`)
            if (d.knowledgeRef && d.standing === 'APPROVED') {
                const ref = d.knowledgeRef
                const cellText = ref.column && ['Coach Definition', 'description', 'property_text'].includes(ref.column) ? displayCell(k, ref).text : null
                assert.equal(d.valueEvidence, cellText, `${c.path}: the approved cell`)
            }
        }
    }
    // Each value evidenced in his words agrees with the words that state it (pinned: the term his words use for the value).
    const AGREES: Record<string, string> = {
        'teams.count': 'Two opposing teams',
        'teams.equalOutfield': 'equal outfield counts',
        directions: 'attacks one direction and defends the opposite',
        'scoring.event': 'Controlled arrival in an appropriately positioned advanced end zone',
        'scoring.afterRegain': 'should count',
        'opposition.reciprocal': 'Reciprocal objectives',
        'play.continuous': 'continuous play through turnovers',
        'start.method': 'ordinary kickoff',
        'restart.afterPoint.method': 'ordinary kickoff',
        'rules.offside': 'None for this initial small-sided realization',
        'restart.touchline': 'normal Laws of the Game should apply by default',
        'rules.fouls': 'fouls',
        'rules.handling': 'normal Laws of the Game should apply by default',
        'laws.default': 'normal Laws of the Game should apply by default',
        'observation.categories': 'Observation criteria',
        'scoring.qualifyingCondition.sep13Text': 'for example',
    }
    for (const c of x.choices.filter((y) => y.howReached === 'ENTERED_EVIDENCED')) {
        assert.ok(AGREES[c.path], `${c.path}: no pinned agreement term`)
        assert.ok(c.decidedBy.some((d) => (d.valueEvidence ?? '').includes(AGREES[c.path])), `${c.path}: its evidence does not state "${AGREES[c.path]}"`)
    }
    // An illustrative value is decided by his permission to use one, quoted where it says "illustrative".
    for (const c of x.choices.filter((y) => y.howReached === 'ENTERED_ILLUSTRATIVE')) assert.ok(c.decidedBy.some((d) => /\billustrative (value|configuration)\b/.test(d.valueEvidence ?? '') && /\bmay be used\b/.test(d.valueEvidence ?? '')), c.path)
}

/** (o) What the code computes moves, or the assembly refuses, when the knowledge it reads changes. */
function testO_flipTests(): void {
    const k1 = committedKnowledge()
    k1.rulings.scopedTranslations[0].secondaryGameProblemIds = ['GP-005']
    throwsWith(() => run(k1), 'the Game Problems differ from the ones his words name')
    const k2 = committedKnowledge()
    ;(k2.sportModule.game_forms.find((r) => cell(r, 'game_form_id') === 'GF2') as Raw).status = 'DRAFT'
    throwsWith(() => run(k2), 'the illustrative form is no longer compatible')
    const k3 = committedKnowledge()
    ;(k3.contexts.relationships.find((r) => cell(r, 'relationship_id') === 'RPC-REL-079') as Raw).status = 'INACTIVE'
    throwsWith(() => run(k3), 'the scoring event is no longer the context\'s')
    const k4 = committedKnowledge()
    ;(k4.planning.learning_goals.find((r) => cell(r, 'ID') === 'A05') as Raw)['Coach Definition'] = 'A reworded coach definition.'
    assert.equal(sentences(run(k4)).find((s) => s.id === 'ov-purpose')?.text, 'A reworded coach definition.')
    const k5 = committedKnowledge()
    ;(k5.contexts.relationships.find((r) => cell(r, 'relationship_id') === 'RPC-REL-025') as Raw).related_id = 'GP-015'
    assert.match(run(k5).design.find((d) => d.expresses.includes('gameProblems.candidate'))?.text ?? '', /Maintain Possession/)
    const k6 = committedKnowledge()
    ;(k6.car.ratings.find((r) => cell(r, 'game_problem_id') === 'GP-002') as Raw).FOI = 'S'
    assert.equal(run(k6).activity.choices.find((c) => c.path === 'gameProblems.secondaryFinding')?.rendered, 'none', 'no finding once the secondary no longer rates FOI more strongly')
    // And the computed traces are Stage 2's own, unchanged.
    assert.equal(json(BASE.activity.computed[0].trace), json(BASE.resolution.gameProblems.trace))
    assert.equal(json(BASE.activity.computed.find((c) => c.id === 'game forms')?.trace), json(BASE.forms.trace))
}

/** (p) Every scope, scope word and note in the data is printed in the report (a projection is proved only by a consumer). */
function testP_everyScopeAndNoteIsPrinted(): void {
    const x = BASE.experiment
    const strings: string[] = []
    for (const r of x.rulings) strings.push(...(r.scope ? [r.scope] : []), ...(r.scopeWords ?? []), ...(r.scopeCovers ? [r.scopeCovers.replace(/\.$/, '')] : []))
    for (const c of x.choices) strings.push(c.note, ...c.consulted.map((y) => y.note))
    strings.push(x.gameProblemScope.note, x.gameProblemScope.idResolution, ...x.derived.map((d) => d.note), ...x.requirementAccount.map((a) => a.note), ...x.suitability.properties.map((p) => p.note), ...x.exemptions.map((e) => e.reason), ...x.laws.map((l) => l.reason))
    strings.push(...x.contractItems.filter((c) => c.notUsed).map((c) => c.notUsed as string), ...x.openDecisions.map((d) => d.question), ...x.dependencies.map((d) => d.what))
    for (const s of strings) assert.ok(REPORT_TEXT.includes(s), `not printed: ${s}`)
    // The governing scope shown is his 5 November scope, never the filed Stage 1 label in the coach text.
    assert.ok(BASE.design[0].text.includes('within the scoped circumstance of progressing against organized opposition'))
    for (const s of sentences()) assert.ok(!s.text.includes('STAGE1_DEVELOPMENT_DEMONSTRATION'), s.id)
}

/** (q) The Stage 2 grouping fails closed on the two new standings; the rank keeps Stage 2's order with the new standings last. */
function testQ_stage2GroupingFailsClosed(): void {
    assert.deepEqual([...STANDING_ORDER], ['APPROVED', 'RULING', 'PROVISIONAL', 'CANDIDATE', 'OURS', 'REFERENCE ONLY', 'TEST ASSUMPTION', 'TEST INPUT', 'ILLUSTRATIVE', 'UNRESOLVED'])
    assert.deepEqual([...STANDING_ORDER].sort(), [...STANDINGS].sort(), 'every standing is ranked')
    for (const s of ['ILLUSTRATIVE', 'UNRESOLVED'] as Standing[]) {
        throwsWith(() => conclusionGroup({ id: 'x', step: 'x', statement: 'x', establishedBy: 'RULING', testOnly: false, trace: { influencedBy: [{ ref: 'r', standing: 'APPROVED', role: 'x' }, { ref: 'i', standing: s, role: 'x' }], consulted: [], citedOnly: [] } }), s)
    }
    throwsWith(() => weakestStanding({ influencedBy: [{ ref: 'r', standing: 'ILUSTRATIVE' as Standing, role: 'x' }], consulted: [], citedOnly: [] }), 'a typo ranks nowhere')
    // The assembled structural conditions carry the illustrative team sizes and no 'held' wording.
    for (const e of BASE.suitability.structural) {
        const text = json(e)
        assert.ok(!text.includes('Step 3 is held') && !text.includes('no activity is assembled'), e.gameFormId)
        assert.ok(e.preconditions.every((p) => p.trace.influencedBy.some((i) => i.standing === 'ILLUSTRATIVE' && i.role === 'the assembled activity\'s team sizes')), e.gameFormId)
    }
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Forms and scenarios (r)-(s)
// -------------------------------------------------------------------------------------------------------------------------------------

/** (r) GF3 and GF7 stay visible and unranked; structural conditions for all three, alike, in id order. */
function testR_gameFormAlternatives(): void {
    assert.deepEqual(BASE.forms.compatible, ['GF2', 'GF3', 'GF7'])
    assert.equal(BASE.forms.preference.status, 'INSUFFICIENT_EVIDENCE')
    assert.deepEqual(BASE.suitability.structural.map((s) => s.gameFormId), ['GF2', 'GF3', 'GF7'])
    assert.deepEqual(BASE.suitability.otherForms.map((o) => [o.gameFormId, o.configurationRows]), [['GF3', 'MISSING'], ['GF7', 'MISSING']])
    const formLine = BASE.design.find((d) => d.expresses.includes('gameForm.illustrativeChoice'))?.text ?? ''
    assert.ok(formLine.includes('illustrative') && formLine.includes(BASE.display.names.GF3.text) && formLine.includes(BASE.display.names.GF7.text), formLine)
    const part3 = REPORT_TEXT.split('=== PART 3.')[1].split('=== PART 4.')[0]
    assert.ok(!/\b(superior|best|ranked|first choice|recommended form)\b/i.test(part3))
    // The suitability join: a property whose cited value is missing reads NOT_SUPPLIED, never the data's status.
    const without: AssembledActivity = { ...BASE.activity, choices: BASE.activity.choices.filter((c) => c.path !== 'play.continuous') }
    const s = suitabilityReview(committedKnowledge(), BASE.resolution, BASE.forms, BASE.experiment, without)
    assert.equal(s.properties.find((p) => p.property === 'adaptive player roles')?.structural.status, 'NOT_SUPPLIED')
    for (const p of BASE.suitability.properties) {
        assert.equal(p.functional.status, 'ONLY_VERIFIABLE_IN_PLAY', p.property)
        assert.deepEqual(p.structural.missingRows, [], p.property)
    }
    assert.equal(BASE.suitability.scale.statement, 'UNVERIFIED for every scale; 6 v 6 is not preferred over larger formats.')
    // The illustrative team size and the Stage 2 fixture's test input agree, deliberately independent.
    const fixture = JSON.parse(fs.readFileSync(path.join(HERE, 'width-scenarios.test-fixture.json'), 'utf8'))
    assert.deepEqual(fixture.structuralActivity.playersPerTeam.value, [6, 6])
    assert.equal(choiceOf(BASE.experiment, 'players.perTeam').value, 6)
}

/** (s) The Game Problems never change; outcomes equal the data's expectations; nothing anywhere offers or names a widening. */
function testS_scenarios(): void {
    assert.equal(BASE.scenarios.length, 3)
    for (const r of BASE.scenarios) {
        assert.deepEqual([r.gameProblems.primary, r.gameProblems.secondary, r.gameProblems.unchanged], [['GP-001'], ['GP-002'], true], r.id)
        assert.deepEqual({ mismatchReported: r.mismatch.reported, uncertaintyReported: r.uncertainty.reported }, r.expected, r.id)
        assert.deepEqual([r.width.outcome, r.width.basis, r.width.proposalStatus], ['INSUFFICIENT_EVIDENCE', 'CIRCUMSTANCES_NOT_SUPPLIED', 'NONE_INSUFFICIENT_EVIDENCE'], r.id)
    }
    assert.deepEqual(BASE.scenarios.map((r) => [r.id, r.mismatch.reported, r.uncertainty.reported]), [['E1', false, false], ['E2', true, false], ['E3', false, true]])
    for (const text of [REPORT_TEXT, RESULTS_TEXT]) {
        assert.ok(!text.includes('OFFERED_TEST_ONLY'))
        assert.ok(!/widen/i.test(text))
    }
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Laws and contracts (t)-(u)
// -------------------------------------------------------------------------------------------------------------------------------------

/** (t) One Laws entry per law the Sport Profile lists, read from the profile. */
function testT_lawsAccount(): void {
    const profile = JSON.parse(fs.readFileSync(path.join(REPO, 'docs', 'audits', 'conformance', 'stage-b', 'sport-profile-soccer.json'), 'utf8'))
    const ids = (profile.defaultLaws.laws as Raw[]).map((l) => l.id).sort()
    assert.deepEqual(BASE.experiment.laws.filter((l) => l.lawId).map((l) => l.lawId).sort(), ids)
    assert.equal(BASE.experiment.laws.filter((l) => l.status === 'ADAPTATION OWED').length, 1)
    assert.equal(BASE.experiment.laws.find((l) => l.lawId === 'LAW-11')?.status, 'DEPARTED')
}

/** (u) Every GF2 contract item is mapped to a value or listed as not used, with its reason; the unauthored restart after a score is reported. */
function testU_contractItems(): void {
    const sets = JSON.parse(fs.readFileSync(path.join(REPO, 'docs', 'audits', 'conformance', 'stage-b', 'contracts.json'), 'utf8')) as Raw[]
    const gf2 = sets.find((s) => String(s.name).includes('(GF2)')) as Raw
    const ids = (gf2.result.items as Raw[]).map((i) => i.id).sort()
    assert.deepEqual(BASE.experiment.contractItems.map((c) => c.itemId).sort(), ids)
    for (const c of BASE.experiment.contractItems) assert.ok(c.mappedTo.length > 0 || (c.notUsed ?? '').length > 0, c.itemId)
    assert.ok(BASE.experiment.contractDeclarationsReported.some((d) => d.what === 'restart after a score'))
    assert.ok((gf2.result.declarations as Raw[]).some((d) => d.declaration === 'NOT_AUTHORED' && String(d.note).includes('restart after a score')))
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Isolation and determinism (v)-(y)
// -------------------------------------------------------------------------------------------------------------------------------------

/** (v) Two runs are byte-identical. */
function testV_determinism(): void {
    const again = buildAssemblyReport(run())
    assert.equal(again.report, REPORT_TEXT)
    assert.equal(json(again.results), RESULTS_TEXT)
}

/** (w) Stage 2 is unchanged: its results in process, and its report re-generated to a scratch folder, equal the committed evidence. */
function testW_stage2Unchanged(): void {
    const evidence = path.join(REPO, 'docs', 'audits', 'design-reasoning-stage2', 'evidence')
    const results = `${JSON.stringify({ stage: 'DESIGN_REASONING_STAGE_2', standing: STAGE2_STANDING, results: runStage2ForEveryGoal() }, null, 2)}\n`
    assert.equal(results, fs.readFileSync(path.join(evidence, 'stage2-results.json'), 'utf8'))
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'stage2-check-'))
    try {
        const child = spawnSync(process.execPath, [path.join(BACK, 'node_modules', 'ts-node', 'dist', 'bin.js'), '--files', '-r', 'tsconfig-paths/register', './src/system/design-reasoning/run-stage2-demo.ts', '--out', out], { cwd: BACK, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 })
        assert.equal(child.status, 0, child.stderr)
        assert.equal(fs.readFileSync(path.join(out, 'stage2-report.txt'), 'utf8'), fs.readFileSync(path.join(evidence, 'stage2-report.txt'), 'utf8'))
        assert.equal(fs.readFileSync(path.join(out, 'stage2-results.json'), 'utf8'), fs.readFileSync(path.join(evidence, 'stage2-results.json'), 'utf8'))
    } finally {
        fs.rmSync(out, { recursive: true, force: true })
    }
}

/** (x) Registered in the unit-test list, with its npm script. */
function testX_registered(): void {
    const registry = JSON.parse(fs.readFileSync(path.join(BACK, 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/assembly.unit.ts'))
    const pkg = JSON.parse(fs.readFileSync(path.join(BACK, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    assert.match(pkg.scripts['design:assembly'], /run-assembly-experiment\.ts$/)
}

/** (y) No goal-specific literal in the stage code or runner (the experiment's own ids and paths included); none in the wording's templates. */
function testY_noGoalSpecificLiterals(): void {
    const x = BASE.experiment
    const files = ['assembly.ts', 'assembly-review.ts', 'assembly-display.ts', 'run-assembly-experiment.ts'].map((f) => path.join(HERE, f))
    const ids = [...x.rulings.map((r) => r.id), ...x.openDecisions.map((d) => d.id), ...x.requirementAccount.map((a) => a.id), ...x.dependencies.map((d) => d.id), ...x.scenarios.items.map((s) => s.id)]
    for (const f of files) {
        const source = fs.readFileSync(f, 'utf8')
        for (const id of ids) assert.ok(!source.includes(id), `${path.basename(f)} names ${id}`)
        for (const c of x.choices) assert.ok(!source.includes(`'${c.path}'`) && !source.includes(`"${c.path}"`) && !source.includes(`\`${c.path}\``), `${path.basename(f)} names the path ${c.path}`)
        for (const word of ['offside', 'goalkeeper', 'dribble', 'throw-in', 'free kick', 'soccer']) assert.ok(!source.toLowerCase().includes(word), `${path.basename(f)} names ${word}`)
    }
    const k = committedKnowledge()
    const goalNames = k.planning.learning_goals.map((g) => cell(g, 'Learning Goal'))
    const gpNames = k.gameProblems.gameProblems.map((g) => cell(g, 'Name'))
    const templates = json(BASE.wording.templates)
    for (const g of k.planning.learning_goals) assert.ok(!new RegExp(`\\b${cell(g, 'ID')}\\b`).test(templates), cell(g, 'ID'))
    for (const n of [...goalNames, ...gpNames]) assert.ok(!templates.includes(n), n)
    assert.ok(!/\b(GP-\d{3}|RPC-\d{3}|RPC-REL-\d{3}|RPC-PROP-\d{3}|GF\d+|GA-\d{3})\b/.test(templates))
}

testA_everyMaterialValueIsExpressed()
testB_expressesEqualsWhatTheTemplateSays()
testC_everyValueMutationReachesTheTextOrRefuses()
testD_keywordsImplyTheirValues()
testE_numbersAreBoundToTheirValues()
testF_noPrescriptionAndQuotesAreVerbatim()
testG_scoringSentencesNameTheTargetZone()
testH_observationBlock()
testI_rationaleMakesNoEffectClaim()
testJ_workbookTextAndThePossessionClause()
testK_displayTextsEqualTheirCells()
testL_sixClasses()
testM_validatorBites()
testN_valueEvidence()
testO_flipTests()
testP_everyScopeAndNoteIsPrinted()
testQ_stage2GroupingFailsClosed()
testR_gameFormAlternatives()
testS_scenarios()
testT_lawsAccount()
testU_contractItems()
testV_determinism()
testW_stage2Unchanged()
testX_registered()
testY_noGoalSpecificLiterals()

console.log('design-reasoning assembly experiment: all tests passed')
