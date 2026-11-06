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
 *   provenance (l)-(q): Christian's six classes table-driven; the validator's bite tests; value evidence verbatim in Christian's words; flip tests for
 *     what the code computes; every scope and note printed; the Stage 2 grouping fails closed;
 *   forms and scenarios (r)-(s); Laws and contracts (t)-(u); isolation and determinism (v)-(y);
 *   and, from the code review of 6 November: the requirement account (categories pinned per line; nothing unsupported, unresolved or
 *   observation-only counts; a retired row is excluded) and the wording's scope (goal- and context-scoped templates tagged and counted);
 *   the mutation loop classified by outcome with exact counts (c); an independent phrase table for every sentence written for one value
 *   (c2); no decision moved by a rewritten display text (k2); every value's class and every stated value's evidence pinned here, apart from
 *   the record (l, n); Christian's words' hashes pinned after the external quote check; the committed evidence equal to the code's output (v).
 * Each lexical check has a bite test: a planted bad sentence must fail it.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { namesRole, numbersIn, OBLIGATIONS, ROLE_ORDERING, TARGET_AS_LINE } from '../rendering/fidelity'
import { rpcLibrary } from '../sport-module/rpc-library'
import { assemblyDiagramOf, assemblyDiagramSvg, DiagramModel } from './assembly-diagram'
import { displayCell, displayTextsFor, DISPLAY_ALLOWLIST } from './assembly-display'
import {
    AssembledActivity,
    assembleActivity,
    Choice,
    ChoiceValue,
    ClassInput,
    committedExperimentData,
    committedWordingData,
    composeCoachActivity,
    decidingWords,
    Experiment,
    longDate,
    markerOf,
    premisesOf,
    receivedOf,
    placeholdersOf,
    requirementAccountOf,
    scoringEventMembership,
    sectionsOf,
    sentenceMarker,
    SIX_CLASSES,
    SixClass,
    sixClassOf,
    statedNumber,
    validateExperiment,
    validateWording,
    valueLabel,
    Wording,
} from './assembly'
import { AssemblyRun, buildAssemblyReport, MUTATION_OUTCOMES, mutationLoop, RegressionRecord, runAssembly, scenarioReview, suitabilityReview, validateRegressionRecord } from './assembly-review'
import { selectGameForm } from './forms'
import { activeContextRelationships, cell, committedKnowledge, contextIdentityRules, contextValidationRules, DesignKnowledge, STANDINGS, Standing } from './knowledge'
import { resolveDesignContext } from './resolve'
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
const EVIDENCE = path.join(REPO, 'docs', 'audits', 'design-reasoning-assembly', 'evidence')
/** The committed regression record, which the runner prints in Part 5 (read here so the report built in process is the runner's). */
const REGRESSION: RegressionRecord = validateRegressionRecord(JSON.parse(fs.readFileSync(path.join(EVIDENCE, 'regression-record.json'), 'utf8')))
/** The mutation loop, as the runner runs it (the front and Part 5 print its counts). */
const MUTATION = mutationLoop(display)
const REPORT = buildAssemblyReport(BASE, REGRESSION, MUTATION)
const REPORT_TEXT = REPORT.report
const RESULTS_TEXT = json(REPORT.results)
const sentences = (r: AssemblyRun = BASE) => r.composed.sections.flatMap((s) => s.sentences)
/** A sentence with every double-quoted span removed (Christian's quoted words, and approved text, are checked verbatim instead). */
const unquoted = (t: string) => t.replace(/"[^"]*"/g, '"…"')
const choiceOf = (x: Experiment, p: string) => x.choices.find((c) => c.path === p) as Choice
const throwsWith = (fn: () => unknown, label: string) => assert.throws(fn, undefined, label)
/** A value's block in Part 2: its header line and every line indented under it. */
const part2Block = (p: string, report = REPORT_TEXT) => {
    const lines = report.split('=== PART 2.')[1].split('\n')
    const start = lines.findIndex((l) => l.startsWith(`  ${p} = `))
    const end = lines.findIndex((l, i) => i > start && /^ {2}\S/.test(l))
    assert.ok(start >= 0, `no Part 2 block for ${p}`)
    return lines.slice(start, end).join('\n')
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Faithfulness (a)-(k)
// -------------------------------------------------------------------------------------------------------------------------------------

const EXEMPT = ['scoring.qualifyingCondition.workbookText', 'scoring.qualifyingCondition.sep13Text', 'coachQuestion', 'area.goalkeepersCounted']
/** The values recorded beside the activity but not part of it (the front counts the activity's values without them). */
const NON_ACTIVITY = ['scoring.qualifyingCondition.workbookText', 'scoring.qualifyingCondition.sep13Text', 'coachQuestion']

function unexpressedOf(r: AssemblyRun): string[] {
    const expressed = new Set([...r.composed.expressed, ...r.design.flatMap((d) => d.expresses)])
    return r.experiment.choices.map((c) => c.path).filter((p) => !r.experiment.exemptions.some((e) => e.path === p) && !expressed.has(p))
}

/** Each coach-text sentence (not a review note) that expresses an UNRESOLVED value, as "<id>: <path>". */
const unresolvedInCoachText = (r: AssemblyRun): string[] =>
    sentences(r)
        .filter((s) => !s.reviewOnly)
        .flatMap((s) => s.expresses.filter((p) => choiceOf(r.experiment, p).howReached === 'UNRESOLVED').map((p) => `${s.id}: ${p}`))

/** (a) Every material value (every choice minus the pinned exemptions) is expressed; the nine parts are all covered. */
function testA_everyMaterialValueIsExpressed(): void {
    assert.deepEqual(BASE.experiment.exemptions.map((e) => e.path), EXEMPT, 'the exemptions are pinned')
    assert.deepEqual(BASE.experiment.exemptions.filter((e) => e.nonActivity).map((e) => e.path), NON_ACTIVITY, 'the values not part of the activity are pinned')
    assert.deepEqual(unexpressedOf(BASE), [])
    // A value only a review-only sentence expresses is a review disclosure: only UNRESOLVED values may be in that position.
    const reviewOnlyPaths = BASE.composed.expressed.filter((p) => BASE.composed.expressedInCoachCopy.indexOf(p) < 0 && !BASE.design.some((d) => d.expresses.includes(p)))
    assert.deepEqual(reviewOnlyPaths, ['endZones.positioning', 'restart.endLine.receivingDistance', 'scoring.startingCondition'], 'only unresolved values are expressed by review notes alone')
    for (const p of reviewOnlyPaths) assert.equal(choiceOf(BASE.experiment, p).howReached, 'UNRESOLVED', p)
    // No coach-text sentence expresses an UNRESOLVED value: only a review note may (L5-02(3); Christian's reply of 6 November, section 7).
    assert.deepEqual(unresolvedInCoachText(BASE), [])
    const leaky = rawW()
    delete leaky.templates.find((t: Raw) => t.id === 'rs-r2-distance').reviewOnly
    assert.deepEqual(unresolvedInCoachText(run(committedKnowledge(), rawX(), leaky)), ['rs-r2-distance: restart.endLine.receivingDistance'], 'bite: a review note made coach text')
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

/**
 * (c) Mutating EVERY value (the loop the runner runs): each outcome is classified by what refused it, and the counts are exact. Pinned
 * here, independently of the loop: the values a changed number reaches the text for (entered numbers of ours, each expressed through a
 * placeholder); the exempt values printed in the report only; the values refused for a structural reason (every value read by code, every
 * unresolved value, and five named ones); every other value is refused by a sentence written for its recorded value (whenValue).
 */
// The kick-off distance left this list openly on 6 November: Christian's reply (section 8) now states it, so a changed number is refused by
// the word its evidence uses ("9.15"), as every number Christian's words state is.
const EXPECTED_SUBSTITUTED = ['players.perTeam', 'area.lengthM', 'area.widthM', 'endZones.depthM', 'duration.blocks', 'duration.blockMinutes']
// 6 November: the DRAFT diagram keys area.goalkeepersCounted through its own words, so a changed value is refused there (structural),
// no longer printed in the report only.
const EXPECTED_EXEMPT_PRINTED_ONLY = ['coachQuestion']
/** Structural refusals beyond the values read by code and the unresolved ones, each with the check that refuses it. */
const EXPECTED_STRUCTURAL_NAMED: Record<string, RegExp> = {
    'gameForm.illustrativeChoice': /namesValue: Christian's quoted words must contain the value/,
    'teams.count': /evidenceStates "Two" states 2, not the value 3/,
    'endZones.placement': /maps to no number of target zones/,
    'scoring.event': /is not one of RPC-003's ACTIVE scoring events/,
    'scoring.qualifyingCondition.sep13Text': /valueIsEvidence: the value must equal its first decisive item's evidence/,
    'start.kickoffDistanceM': /evidenceStates "9\.15" states 9\.15, not the value 10\.15/,
    'area.goalkeepersCounted': /no diagram words for the value SENTINEL_MUTATION/,
}
function testC_everyValueMutationIsClassified(): void {
    const x = BASE.experiment
    const outcome = (o: string) => MUTATION.results.filter((r) => r.outcome === o).map((r) => r.path)
    assert.equal(MUTATION.values, x.choices.length)
    assert.deepEqual([...MUTATION_OUTCOMES], ['SUBSTITUTED', 'WHEN_VALUE_PINNED', 'STRUCTURAL', 'EXEMPT_PRINTED_ONLY'])
    assert.deepEqual(outcome('SUBSTITUTED'), EXPECTED_SUBSTITUTED)
    assert.deepEqual(outcome('EXEMPT_PRINTED_ONLY'), EXPECTED_EXEMPT_PRINTED_ONLY)
    const byCodeOrUnresolved = x.choices.filter((c) => c.howReached === 'READ_BY_CODE' || c.howReached === 'UNRESOLVED').map((c) => c.path)
    assert.deepEqual(outcome('STRUCTURAL').sort(), [...byCodeOrUnresolved, ...Object.keys(EXPECTED_STRUCTURAL_NAMED)].sort())
    for (const [p, re] of Object.entries(EXPECTED_STRUCTURAL_NAMED)) assert.match(MUTATION.results.find((r) => r.path === p)?.reason ?? '', re, p)
    for (const r of MUTATION.results.filter((y) => y.howReached === 'READ_BY_CODE')) assert.match(r.reason, /a value read by code has no entered value/, r.path)
    for (const r of MUTATION.results.filter((y) => y.howReached === 'UNRESOLVED')) assert.match(r.reason, /an UNRESOLVED value has no value/, r.path)
    // Every other value is refused by a sentence written for its recorded value, and the refusal names that very value.
    const pinned = x.choices.map((c) => c.path).filter((p) => ![...EXPECTED_SUBSTITUTED, ...EXPECTED_EXEMPT_PRINTED_ONLY, ...outcome('STRUCTURAL')].includes(p))
    assert.deepEqual(outcome('WHEN_VALUE_PINNED'), pinned)
    for (const r of MUTATION.results.filter((y) => y.outcome === 'WHEN_VALUE_PINNED')) {
        assert.ok(r.reason.includes(`whenValue ${r.path} = `), r.path)
        assert.ok(BASE.wording.templates.some((t) => t.whenValue && r.path in t.whenValue), `${r.path}: pinned by a template's whenValue`)
    }
    // Pins moved openly on 6 November: the restart's seven values replace two (five more pinned by whenValue, one more unresolved), and the
    // kick-off distance moves from substituted to structural.
    // And the DRAFT diagram (A2) refuses a changed area.goalkeepersCounted it has no words for: 17 structural become 18, 2 exempt become 1.
    assert.deepEqual(MUTATION.counts, { SUBSTITUTED: 6, WHEN_VALUE_PINNED: 35, STRUCTURAL: 18, EXEMPT_PRINTED_ONLY: 1 })
    // A value Christian's words state, or a value the code reads, is never accepted with a changed value (C4-01).
    for (const r of MUTATION.results.filter((y) => y.outcome === 'SUBSTITUTED' || y.outcome === 'EXEMPT_PRINTED_ONLY')) assert.ok(r.howReached !== 'ENTERED_EVIDENCED' && r.howReached !== 'READ_BY_CODE', `${r.path}: a value Christian's words or the knowledge state was changed and accepted`)
    // The front and Part 5 print exactly these counts.
    assert.ok(REPORT_TEXT.includes(`Of the ${x.choices.length} recorded values, changed one at a time in a copy of the record: 6 are substituted into the coach text`))
    assert.ok(REPORT_TEXT.includes(`    substituted into the coach text, 6: ${EXPECTED_SUBSTITUTED.join(', ')};`))
    assert.ok(REPORT_TEXT.includes('    refused by a sentence written for the recorded value only, 35: '))
    assert.ok(REPORT_TEXT.includes('    refused for structural reasons, 18: 8 read by code'))
    assert.ok(REPORT_TEXT.includes(`    exempt from the coach text and printed in the report only, 1: ${EXPECTED_EXEMPT_PRINTED_ONLY.join(', ')}.`))
    // Bite: a refusal that does not name the changed value (here a crash in the display callback) fails the loop instead of counting.
    const crashing: Parameters<typeof runAssembly>[0] = (k, xx, r, f) => {
        if (xx.choices.find((c) => c.path === 'area.widthM')?.value === 31) throw new TypeError('planted crash')
        return display(k, xx, r, f)
    }
    assert.throws(() => mutationLoop(crashing), /changing area\.widthM was refused for a reason that does not name it: planted crash/)
    console.log(`mutation loop over ${MUTATION.values} values: ${JSON.stringify(MUTATION.counts)}`)
}

/**
 * (c2) What a sentence written for one value SAYS (C3-01; the lead's D3). A whenValue template is honest only if its prose states its value,
 * and the composer cannot check that, so this table, written here independently of the wording file, holds for every (path, value) pair any
 * whenValue uses: `each` must be in every sentence written for that value (null: none common, `somewhere` carries it), `somewhere` in at
 * least one, and `forbid` in no coach sentence at all. The table is exhaustive over the whenValue pairs, so a new or changed pair fails
 * until its phrases are written here.
 */
const VALUE_PHRASES: Array<{ path: string; value: ChoiceValue; each: RegExp | null; somewhere?: RegExp[]; forbid: RegExp }> = [
    { path: 'directions', value: 'EACH_ATTACKS_ONE_DEFENDS_THE_OTHER_ALL_GAME', each: /\battacks\b/, somewhere: [/\battacks one target zone and defends the other for the whole game\b/], forbid: /\bsame direction\b|\b(switch|swap|change)\w* (ends|directions?)\b/i },
    { path: 'scoring.event', value: 'target_zone_entered', each: /\btarget zones?\b/, somewhere: [/\bscores a point when one of its players\b/], forbid: /\bscor\w*\b[^.;]*\b(lines?|cross\w*)\b|\b(lines?|cross\w*)\b[^.;]*\bscor\w*\b/i },
    { path: 'area.includesEndZones', value: true, each: /\bincluding both target zones\b|\bboth target zones are inside the area\b/, forbid: /\b(outside|beyond) the area\b|\bnot included\b/i },
    { path: 'teams.equalOutfield', value: 'EQUAL', each: /\bequal numbers\b/, forbid: /\bunequal\b|\buneven\b|\bextra player\b|\boverload\b/i },
    { path: 'players.goalkeepers', value: 0, each: /\bno goalkeepers\b/, forbid: /\b(a|one|each|the|its) goalkeepers?\b/i },
    { path: 'duration.breaks', value: 'SHORT_BREAK_BETWEEN_BLOCKS', each: /\bbetween blocks\b/, somewhere: [/\ba short break between blocks\b/], forbid: /\bno break\b|\bwithout (a )?break\b/i },
    { path: 'rules.offside', value: 'NONE', each: /\bno offside\b/i, forbid: /\boffside (applies|is called|is played|rules? appl\w*)\b/i },
    { path: 'area.halfwayLine', value: 'MARKED', each: /\ba halfway line\b/, forbid: /\bno halfway line\b/i },
    { path: 'area.centreMark', value: 'MARKED', each: /\bcentre mark\b/, forbid: /\bno centre mark\b/i },
    { path: 'endZones.placement', value: 'ONE_AT_EACH_END_FULL_WIDTH', each: /\b[Aa]t (one|each|the other) end\b|\bat the ends\b/, somewhere: [/\bacross the full width\b/], forbid: /\bin the middle\b|\bpart of the width\b|\bhalf the width\b/i },
    { path: 'endZones.positioning', value: null, each: /\bnot yet decided\b/, forbid: /\bposition of the target zones (is|has been) decided\b/i },
    { path: 'equipment.bibs', value: 'ONE_COLOUR_PER_TEAM_KEPT_ALL_SESSION', each: /\bbib colour\b/, somewhere: [/\beach with its own bib colour\b/, /\bkeeps its bib colour\b/], forbid: /\b(swap|change|switch)\w* (bibs|bib colou?rs?)\b/i },
    { path: 'equipment.markers', value: 'AREA_HALFWAY_CENTRE_TARGET_ZONES', each: /\bmarkers for the area, the halfway line, the centre mark and both target zones\b/, forbid: /\bmarkers? for (a|the) goals?\b/i },
    { path: 'equipment.balls', value: 'SPARE_BALLS', each: /\bspare balls\b/, forbid: /\bno spare balls?\b|\bone ball only\b/i },
    { path: 'opposition.reciprocal', value: 'RECIPROCAL', each: /\bBoth teams attack and defend\b/, forbid: /\bonly one team (attacks|defends)\b|\bone team attacks and the other defends\b/i },
    { path: 'play.continuous', value: 'CONTINUOUS_THROUGH_TURNOVERS', each: /\bPlay continues when the ball changes teams\b/, forbid: /\bplay stops\b|\bstops play\b|\brestarts? (after|on) (a|each) (turnover|change of possession)\b/i },
    { path: 'endZones.access', value: 'ANY_PLAYER_ANY_TIME', each: /\bAny player may enter either target zone at any time\b/, forbid: /\b(only|no) (attackers?|defenders?|players?) may enter\b|\bmay not enter\b|\bcannot enter\b/i },
    { path: 'interactionRegulations', value: 'NONE_ADDED', each: /\bNo other rule limits where players may go or how they may play\b/, forbid: /\b(one|two|three)-touch\b|\btouch limit\b|\bmay not pass\b/i },
    { path: 'rules.fouls', value: 'LAWS_FREE_KICKS', each: /\bfree kicks\b/, forbid: /\bno free kicks?\b|\bfree kicks? (are|is) not\b/i },
    { path: 'rules.handling', value: 'LAWS_HANDLING_UNCHANGED', each: /\bNo player may handle the ball\b/, forbid: /\bany player may handle\b|\bhandling (is )?allowed\b/i },
    { path: 'laws.default', value: 'APPLY', each: /\bThe normal Laws of the game apply to everything not described here\b/, forbid: /\bLaws[^.;]*\b(do not|don't) apply\b|\bLaws (are )?suspended\b/i },
    { path: 'scoring.means', value: 'A player dribbles into a marked zone, or receives and controls the ball inside it.', each: /\bdribbles into the target zone it attacks, or receives and controls the ball inside it\b/, forbid: /\bonly if\b|\bas long as\b/i },
    { path: 'scoring.mirrored', value: 'SAME_FOR_BOTH', each: /\bBoth teams score in the same way\b/, forbid: /\bonly one team scores\b|\bscores? differently\b/i },
    { path: 'scoring.afterRegain', value: 'COUNTS', each: /\bcounts even straight after the team has won the ball\b/, forbid: /\b(does not|doesn't|never) count\b|\bdisallowed\b/i },
    { path: 'scoring.startingCondition', value: null, each: /\bnot yet decided\b/, forbid: /\bmust (start|begin)\b|\bcounts? only (if|when)\b/i },
    { path: 'win.condition', value: 'MORE_POINTS_IN_A_BLOCK', each: /\bthe team with more points at the end of a block wins that block\b/, forbid: /\bfirst to\b|\bsudden death\b|\bgolden (goal|point)\b/i },
    // 6 November: a served ball now restarts play at an end line, so what is forbidden is a served ball (or a dropped ball) as the start.
    { path: 'start.method', value: 'ORDINARY_KICKOFF', each: /\ban ordinary kick-off\b/, forbid: /\bstart\w* (with|by) (a ball the coach serves|the coach serving|a served ball)\b|\bthe coach serves to start\b|\bdropped ball to start\b/i },
    { path: 'start.kickoffDetails', value: 'LAWS_KICKOFF_UNCHANGED', each: /\bown half\b/i, somewhere: [/\bevery player starts in their own half\b/], forbid: /\bstart anywhere\b|\bno restriction at (the )?kick-off\b/i },
    { path: 'restart.afterPoint.method', value: 'KICKOFF', each: /\brestarts play with a kick-off\b/, forbid: /\bafter a point[^.;]*\b(throw-in|goal kick|from the end line|coach serves)\b/i },
    { path: 'restart.afterPoint.who', value: 'CONCEDING_TEAM', each: /\bthe team that conceded it\b/, forbid: /\bthe team that scored (it )?restarts\b/i },
    { path: 'restart.touchline', value: 'LAWS_THROW_IN', each: /\bthrow-in\b/, forbid: /\bkick-in\b|\bdribble-in\b/i },
    // The coach-served end-line restart (Christian's reply of 6 November, section 6), value by value; the old illustrative value and its
    // status note are retired, and their phrases with them (the retired wording is forbidden now).
    { path: 'restart.endLine.method', value: 'COACH_SERVES_NEW_BALL', each: /\bplays a new ball\b|\bend-line restart\b|\bserve[sd]?\b/, somewhere: [/\bthe coach straight away plays a new ball\b/], forbid: /\bthe team defending the target zone at that end restarts\b|\b(goal|corner) kicks? (are|is) taken\b/i },
    { path: 'restart.endLine.toWhom', value: 'TEAM_THAT_DID_NOT_TOUCH_IT_LAST', each: /\ba player of the team that did not touch it last\b/, forbid: /\bover an end line, the team defending\b|\bthe team that touched it last (restarts|receives)\b/i },
    { path: 'restart.endLine.timing', value: 'PROMPTLY', each: /\bstraight away\b|\bpromptly\b/, somewhere: [/\bstraight away\b/], forbid: /\bwait(s|ing)? for\b|\bafter (a|the) (pause|count)\b/i },
    { path: 'restart.endLine.noReset', value: 'NO_REPOSITIONING_REQUIRED', each: /\bstraight away\b/, forbid: /\bnobody moves back\b|\b(players|everyone) (return|go back|retreat)\b|\bmust retreat\b/i },
    { path: 'restart.endLine.contest', value: 'LIVE_WHEN_PLAYED_NO_OPPONENT_DISTANCE', each: /\bas soon as the ball is played\b|\bnothing is added\b/, somewhere: [/\bplay goes on as soon as the ball is played\b/], forbid: /\bopponents (stay|keep) (at least|back|away)\b[^.;]*\bserv/i },
    { path: 'restart.endLine.location', value: 'IN_THE_HALF_WHERE_IT_WENT_OUT_OUTSIDE_BOTH_TARGET_ZONES_NOT_ACROSS_EITHER_COACH_CHOOSES_PLAYER', each: /\bacross\b|\bcrossing\b/, somewhere: [/\bin the half where it went out, outside both target zones and not across either\b/], forbid: /\bnear where it went out\b|\bfrom that end line\b/i },
    { path: 'restart.endLine.receivingDistance', value: null, each: /\bNo ruling gives a distance\b/, forbid: /\b\d+(\.\d+)? m from the target zone\b/i },
    { path: 'laws.goalEnd', value: 'REPLACED_BY_THE_END_LINE_RESTART', each: /\bgoal kicks? and corner kicks?\b/, forbid: /\b(goal|corner) kicks? (are|is) taken\b/i },
    { path: 'adjustments', value: 'NONE_OFFERED', each: /\bNo adjustments are offered\b/, forbid: /\bto make it (harder|easier)\b/i },
    { path: 'observation.categories', value: 'CHRISTIANS_THREE_CATEGORIES', each: null, somewhere: [/^Against organized opposition: /, /^During transition: /, /^Uncertain: /, /^Both scoring situations remain legitimate\.$/], forbid: /\b(target|aim) (of|for) \d|\d+ ?%|\bshould (score|see) more\b/i },
]
const valuePhraseViolations = (r: AssemblyRun): string[] => {
    const out: string[] = []
    const all = sentences(r)
    const pairs = new Map<string, string[]>()
    for (const t of r.wording.templates) for (const [p, v] of Object.entries(t.whenValue ?? {})) pairs.set(`${p} = ${json(v)}`, [...(pairs.get(`${p} = ${json(v)}`) ?? []), t.id])
    const table = new Map(VALUE_PHRASES.map((e) => [`${e.path} = ${json(e.value)}`, e]))
    for (const key of pairs.keys()) if (!table.has(key)) out.push(`${key}: a whenValue pair with no phrases in the table`)
    for (const key of table.keys()) if (!pairs.has(key)) out.push(`${key}: in the table but used by no whenValue`)
    for (const [key, ids] of pairs) {
        const e = table.get(key)
        if (!e) continue
        const written = all.filter((s) => ids.includes(s.id))
        if (e.each) for (const s of written) if (!e.each.test(s.text)) out.push(`${s.id}: does not say ${key} (${e.each.source})`)
        for (const re of e.somewhere ?? []) if (!written.some((s) => re.test(s.text))) out.push(`${key}: no sentence says ${re.source}`)
        for (const s of all.filter((y) => !y.quoted)) if (e.forbid.test(unquoted(s.text))) out.push(`${s.id}: says the opposite of ${key} (${e.forbid.source})`)
    }
    return out
}

/** (c2) Every sentence written for a value states it, and no coach sentence states its opposite; the table covers every whenValue pair. */
function testC2_valuePhrases(): void {
    assert.deepEqual(valuePhraseViolations(BASE), [])
    // Bite (C3-01): "Offside applies as in the normal Laws." while the value is NONE fails twice (it does not say "no offside"; it says
    // the opposite).
    const w = rawW()
    w.templates.find((t: Raw) => t.id === 'ru-offside').text = 'Offside applies as in the normal Laws.'
    const v = valuePhraseViolations(run(committedKnowledge(), rawX(), w))
    assert.ok(v.includes('ru-offside: does not say rules.offside = "NONE" (\\bno offside\\b)') && v.some((y) => y.startsWith('ru-offside: says the opposite of rules.offside')), json(v))
    // Bite: the record and the whenValue changed together (OFFSIDE_APPLIES) with the prose left alone fails, because the new pair has no phrases.
    const x = rawX()
    x.choices.find((c: Raw) => c.path === 'rules.offside').value = 'OFFSIDE_APPLIES'
    const w2 = rawW()
    for (const t of w2.templates) if (t.whenValue && 'rules.offside' in t.whenValue) t.whenValue['rules.offside'] = 'OFFSIDE_APPLIES'
    assert.ok(valuePhraseViolations(run(committedKnowledge(), x, w2)).includes('rules.offside = "OFFSIDE_APPLIES": a whenValue pair with no phrases in the table'))
}

const KEYWORDS: Array<[string, string[]]> = [
    ['offside', ['rules.offside']],
    ['kick-off', ['start.method', 'start.kickoffDetails', 'restart.afterPoint.method']],
    ['kickoff', ['start.method', 'start.kickoffDetails', 'restart.afterPoint.method']],
    ['throw-in', ['restart.touchline']],
    ['free kick', ['rules.fouls']],
    ['handl', ['rules.handling']],
    // A sentence naming the target zone restates the end-zone target itself (Christian's provisional ruling), so it expresses the scoring event and
    // carries its class; a sentence placing a zone at an end restates the illustrative placement.
    ['target zone', ['scoring.event']],
    ['at one end', ['endZones.placement']],
    ['at each end', ['endZones.placement']],
    ['at the other end', ['endZones.placement']],
    ['halfway', ['area.halfwayLine', 'equipment.markers']],
    ['centre mark', ['area.centreMark', 'equipment.markers']],
    ['block', ['duration.blocks', 'duration.blockMinutes', 'duration.breaks', 'win.condition']],
    ['minute', ['duration.blocks', 'duration.blockMinutes']],
    ['bib', ['equipment.bibs']],
    ['point', ['scoring.event', 'scoring.means', 'scoring.mirrored', 'win.condition', 'restart.afterPoint.method', 'restart.afterPoint.who']],
    ['goalkeeper', ['players.goalkeepers', 'area.goalkeepersCounted']],
    ['end line', ['restart.endLine.method', 'restart.endLine.toWhom', 'restart.endLine.timing', 'restart.endLine.noReset', 'restart.endLine.contest', 'restart.endLine.location', 'restart.endLine.receivingDistance']],
    ['touchline', ['restart.touchline']],
    ['penalty', ['laws.goalEnd']],
    ['corner', ['laws.goalEnd']],
    ['goal kick', ['laws.goalEnd']],
    ['continu', ['play.continuous']],
]
/**
 * Keyword exemptions, pinned by template id (the stage 6 review, C2-12): the served-ball review note speaks of how a point soon after a
 * served ball is classified, not of scoring, so 'point' there binds no scoring value. It must stay a review-only note (asserted in (d)).
 */
const KEYWORD_EXEMPT: Record<string, string[]> = { 'rs-served-presentation': ['point'] }
const keywordViolations = (list: Array<{ id: string; text: string; expresses: string[] }>) =>
    list.flatMap((s) => KEYWORDS.filter(([word, paths]) => !(KEYWORD_EXEMPT[s.id] ?? []).includes(word) && unquoted(s.text).toLowerCase().includes(word) && !paths.some((p) => s.expresses.includes(p))).map(([word]) => `${s.id}: "${word}"`))

/** (d) A sentence containing a keyword expresses the value the keyword concerns. */
function testD_keywordsImplyTheirValues(): void {
    assert.deepEqual(keywordViolations(sentences()), [])
    // Each exempt template exists and is a review-only note (never coach text); the exemption is for that template only.
    for (const id of Object.keys(KEYWORD_EXEMPT)) assert.equal(sentences().find((s) => s.id === id)?.reviewOnly, true, `${id}: an exempt template is review-only`)
    assert.deepEqual(keywordViolations([{ id: 'planted', text: 'A point soon after a served ball is classed by the coach.', expresses: ['observation.categories'] }]), ['planted: "point"'], 'bite: the exemption is by template id')
    assert.deepEqual(keywordViolations([{ id: 'planted', text: 'Offside applies near the halfway line.', expresses: ['area.lengthM'] }]), ['planted: "offside"', 'planted: "halfway"'])
    // Bite: a target-zone sentence that expresses only the direction (not the scoring event) is refused.
    assert.deepEqual(keywordViolations([{ id: 'planted', text: 'Each team attacks one target zone.', expresses: ['directions'] }]), ['planted: "target zone"'])
    // The markers that follow (C3-03): the game sentence carries the illustrative placement; the direction and regain sentences the event.
    const marker = (id: string) => sentences().find((s) => s.id === id)?.sixClass
    assert.deepEqual([marker('ov-game'), marker('ru-directions'), marker('sc-regain')], [5, 3, 3], 'the markers restate the weakest of what the sentence says')
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

/**
 * Where each number may stand (C3-07), pinned here independently of the wording: every placeholder of a numeric value sits inside one of
 * its own phrases, so a number joined to the wrong word (6 blocks of 3 minutes; the width given first) fails. The length comes first.
 */
const NUMBER_CONTEXTS: Record<string, RegExp[]> = {
    'teams.count': [/\{teams\.count\} teams\b/g],
    'players.perTeam': [/\{players\.perTeam\} v \{players\.perTeam\}/g, /\bteams of \{players\.perTeam\}/g],
    'area.lengthM': [/\{area\.lengthM\} m long\b/g],
    'area.widthM': [/\{area\.widthM\} m wide\b/g],
    'duration.blocks': [/\{duration\.blocks\} blocks\b/g],
    'duration.blockMinutes': [/\bblocks of \{duration\.blockMinutes\} minutes\b/g],
    'endZones.depthM': [/\{endZones\.depthM\} m deep\b/g],
    'start.kickoffDistanceM': [/\bat least \{start\.kickoffDistanceM\} m from the ball\b/g],
}
const numberContextViolations = (w: Wording, x: Experiment): string[] => {
    const out: string[] = []
    const numeric = [...new Set(w.templates.flatMap((t) => placeholdersOf(t.text)))].filter((p) => typeof choiceOf(x, p).value === 'number')
    for (const p of numeric) if (!NUMBER_CONTEXTS[p]) out.push(`${p}: a number with no pinned phrase`)
    for (const t of w.templates) {
        // Each occurrence of a numeric placeholder must lie inside a match of one of its own phrases, all read on the template as written.
        for (const p of numeric) {
            const spans = (NUMBER_CONTEXTS[p] ?? []).flatMap((re) => [...t.text.matchAll(re)].map((m) => [m.index as number, (m.index as number) + m[0].length]))
            for (let at = t.text.indexOf(`{${p}}`); at >= 0; at = t.text.indexOf(`{${p}}`, at + 1)) {
                if (!spans.some(([a, b]) => at >= a && at + p.length + 2 <= b)) out.push(`${t.id}: {${p}} outside its phrase`)
            }
        }
        // The length is named before the width wherever both appear.
        if (t.text.includes('{area.lengthM}') && t.text.includes('{area.widthM}') && t.text.indexOf('{area.widthM}') < t.text.indexOf('{area.lengthM}')) out.push(`${t.id}: the width before the length`)
    }
    return out
}

/** (e) Numbers: the templates' own words carry none; each number in its own phrase; each sentence's numbers equal its values', in order. */
function testE_numbersAreBoundToTheirValues(): void {
    assert.deepEqual(numberViolations(BASE.wording, BASE), [])
    assert.deepEqual(numberContextViolations(BASE.wording, BASE.experiment), [])
    // Bites (C3-07): a number joined to the wrong noun, and the width given before the length, fail.
    const swapped = rawW()
    swapped.templates.find((t: Raw) => t.id === 'ov-duration').text = 'Duration: {duration.blockMinutes} blocks of {duration.blocks} minutes, with a short break between blocks.'
    assert.ok(numberContextViolations(validateWording(swapped, BASE.experiment), BASE.experiment).some((v) => v.startsWith('ov-duration: {duration.blocks} outside its phrase')), 'bite: 6 blocks of 3 minutes')
    const widthFirst = rawW()
    widthFirst.templates.find((t: Raw) => t.id === 'ov-area').text = 'Area: {area.widthM} x {area.lengthM} m, including both target zones.'
    assert.ok(numberContextViolations(validateWording(widthFirst, BASE.experiment), BASE.experiment).some((v) => v.startsWith('ov-area:')), 'bite: 30 x 40 m')
    const w = rawW()
    w.templates.find((t: Raw) => t.id === 'st-zones').text = 'At each end, mark a target zone {endZones.depthM}m deep across the full width of the area; both target zones are inside the area.'
    const r = run(committedKnowledge(), rawX(), w)
    assert.ok(numberViolations(r.wording, r).some((v) => v.startsWith('st-zones: a digit next to a letter')), 'bite: 5m')
    const w2 = rawW()
    w2.templates.find((t: Raw) => t.id === 'ru-offside').text = 'There is no offside for two minutes.'
    const r2 = run(committedKnowledge(), rawX(), w2)
    assert.ok(numberViolations(r2.wording, r2).some((v) => v.startsWith('ru-offside: a number')), 'bite: a number in the words')
    // Orientation (Christian's 5 November words: width and length are not interchangeable): every template naming the area's length says it is
    // the length ("m long"), and the width that it is the width.
    for (const t of BASE.wording.templates.filter((x) => x.text.includes('{area.lengthM}'))) {
        assert.ok(t.text.includes('{area.lengthM} m long'), `${t.id}: the length is named as the length`)
        assert.ok(t.text.includes('{area.widthM} m wide'), `${t.id}: the width is named as the width`)
    }
    // The Overview states the orientation without reading as the distance between the zones: the length runs from end to end, zones included.
    assert.ok(BASE.wording.templates.some((x) => x.section === 'OV-PARAMETERS' && x.text.includes('{area.lengthM} m long from end to end, including both target zones, by {area.widthM} m wide')), 'the Overview states which side runs from end to end')
    assert.ok(!BASE.wording.templates.some((x) => x.text.includes('the length runs between the target zones')), 'no template reads as 40 m between the target zones')
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

/**
 * Each double-quoted span in a composed sentence must be the printed value of a display-cell placeholder of that sentence's template, or,
 * in a template that quotes Christian's words within it (quotesWithin), words of the ruling it cites.
 */
const quotedSpanViolations = (r: AssemblyRun): string[] =>
    r.composed.sections
        .flatMap((s) => s.sentences)
        .filter((s) => !s.quoted)
        .flatMap((s) => {
            const t = r.wording.templates.find((x) => x.id === s.id)
            const cells = placeholdersOf(t?.text ?? '')
                .filter((p) => choiceOf(r.experiment, p).readBy === 'DISPLAY_CELL')
                .map((p) => r.activity.choices.find((c) => c.path === p)?.rendered)
            const cited = t?.quotesWithin ? r.experiment.rulings.find((x) => x.id === t.quotesWithin?.rulingRef) : undefined
            return [...s.text.matchAll(/"([^"]*)"/g)].filter((m) => !cells.includes(m[1]) && !(cited && cited.words.some((w) => w.includes(m[1])))).map((m) => `${s.id}: "${m[1]}"`)
        })

/** Coach terms RC3 7.4 does not use for this activity: an end zone (the coach term is target zone) and goals (there are none). */
const FORBIDDEN_COACH_TERMS: Array<[RegExp, string]> = [
    [/\bend ?zones?\b/i, 'end zone'],
    [/\bgoals?\b/i, 'goal'],
]
/**
 * Pinned: the sentence that says the Laws' goal restarts are replaced because there are no goals, and the review note on our reading of
 * 'own half' where no goal stands (6 November; the retired end-line gap note left this list with its value).
 */
const FORBIDDEN_TERM_EXEMPT: Record<string, string[]> = { 'rs-goal-end': ['goal'], 'rs-kickoff-half': ['goal'] }
const forbiddenTermViolations = (list: Array<{ id: string; text: string; quoted?: boolean }>) =>
    list.filter((s) => !s.quoted).flatMap((s) => FORBIDDEN_COACH_TERMS.filter(([re, name]) => re.test(unquoted(s.text)) && !(FORBIDDEN_TERM_EXEMPT[s.id] ?? []).includes(name)).map(([, name]) => `${s.id}: ${name}`))

/** No status word reaches a coach sentence (RC3 6.1: status is recorded, hidden from coaches); review-only sentences are dropped anyway. */
const STATUS_WORDS = /\b(approved|canonical|provisional|ruling|candidate|illustrative|ours)\b/i
const statusWordViolations = (list: Array<{ id: string; text: string; reviewOnly?: boolean }>) => list.filter((s) => !s.reviewOnly && STATUS_WORDS.test(unquoted(s.text))).map((s) => s.id)

/** (f) Fidelity's prescription lexicon over every unquoted coach sentence; no status word; quoted text verbatim against its source; bites. */
function testF_noPrescriptionAndQuotesAreVerbatim(): void {
    // Pinned: the kick-off sentence restates the Laws' kick-off (the opponents stay away "until" the ball is kicked), not a prescription.
    // Pinned too (6 November): two review notes that ask Christian a question (R1, R5) and state no rule: R1 asks whether opponents
    // "should" keep a distance or the ball be uncontested "until" first touched; R5 states our exclusion, the serve "never" played into a zone.
    const PINNED_EXEMPTIONS: Array<{ id: string; word: string; path: string }> = [
        { id: 'rs-kickoff', word: 'until', path: 'start.kickoffDetails' },
        { id: 'rs-r1-contest', word: 'should', path: 'restart.endLine.contest' },
        { id: 'rs-r1-contest', word: 'until', path: 'restart.endLine.contest' },
        { id: 'rs-r5-location', word: 'never', path: 'restart.endLine.location' },
    ]
    for (const e of PINNED_EXEMPTIONS) assert.ok(sentences().find((s) => s.id === e.id && (e.id === 'rs-kickoff' || s.reviewOnly)), `${e.id}: an exemption beyond the kick-off sentence holds only for a review note`)
    assert.deepEqual(obligationViolations(sentences(), PINNED_EXEMPTIONS), [])
    assert.deepEqual(obligationViolations(BASE.design.map((d, i) => ({ id: `design-${i}`, text: d.text }))), [])
    assert.deepEqual(SPECIALIZED_ROLES, [], 'ROLE_ORDERING is recorded vacuous: the configuration names no specialized role')
    assert.equal(obligationViolations([{ id: 'planted', text: 'Players must pass before shooting.' }]).length > 0, true, 'bite')
    assert.equal(obligationViolations([{ id: 'rs-start', text: 'Opponents stay back until the ball is kicked.' }], PINNED_EXEMPTIONS).length > 0, true, 'bite: the exemption holds for its own sentence only')
    // No status word in a coach sentence; bite: the old scoring sentence.
    assert.deepEqual(statusWordViolations(sentences()), [])
    assert.deepEqual(statusWordViolations([{ id: 'planted', text: 'A team scores a point with a controlled arrival, as the approved scoring event describes it.' }]), ['planted'])
    // Quoted text: Christian's words verbatim in the record.
    for (const t of BASE.wording.templates.filter((x) => x.quote)) {
        const r = BASE.experiment.rulings.find((y) => y.id === t.quote?.rulingRef)
        assert.ok(r && r.words.includes(t.text), t.id)
    }
    // Every double-quoted span in a composed sentence is a display cell's value printed through its placeholder (checked against its cell
    // in (k)); no other quoted span may hide from these checks (C3-10). The validator refuses a quotation mark in a template that quotes
    // nothing; bites: the two planted sentences.
    assert.deepEqual(quotedSpanViolations(BASE), [])
    const plantQuote = (id: string, text: string) => {
        const w = rawW()
        w.templates.find((t: Raw) => t.id === id).text = text
        throwsWith(() => validateWording(w, BASE.experiment), `bite: ${text}`)
    }
    plantQuote('sc-regain', 'A controlled arrival in the target zone counts even straight after the team has won the ball, as does "a run across the far end line".')
    plantQuote('ru-access', 'Any player may enter either target zone at any time; "attackers must pass before shooting".')
    assert.deepEqual(quotedSpanViolations({ ...BASE, composed: { ...BASE.composed, sections: [{ id: 'X', level: 'Coach Details', title: 'X', rc3: 'x', sentences: [{ ...sentences()[1], text: 'Score "over the far line".' }] }] } }), [`${sentences()[1].id}: "over the far line"`], 'bite: the check itself')
    // No brace survives composition: a malformed placeholder is refused, never printed raw (C2-04).
    for (const s of sentences()) assert.ok(!/[{}]/.test(s.text), s.id)
    for (const bad of ['Mark out an area {area.length_m} m long and {area.widthM} m wide, with a halfway line and a centre mark.', 'Mark out an area { area.lengthM } m long and {area.widthM} m wide, with a halfway line and a centre mark.', 'Mark out an area {area-lengthM} m long and {area.widthM} m wide, with a halfway line and a centre mark.']) {
        const w = rawW()
        w.templates.find((t: Raw) => t.id === 'st-area').text = bad
        assert.throws(() => validateWording(w, BASE.experiment), /malformed placeholder/, bad)
        assert.throws(() => composeCoachActivity({ ...BASE.wording, templates: BASE.wording.templates.map((t) => (t.id === 'st-area' ? { ...t, text: bad } : t)) }, BASE.activity), /malformed placeholder/, `composer: ${bad}`)
    }
    // A template whose section is unknown is refused by the composer itself, not only by the validator (C2-17).
    assert.throws(() => composeCoachActivity({ ...BASE.wording, templates: BASE.wording.templates.map((t) => (t.id === 'ru-continuous' ? { ...t, section: 'CD-NOWHERE' } : t)) }, BASE.activity), /unknown section/)
    // RC3 7.4 names the coach term "target zone": no coach sentence calls it an end zone or speaks of goals, except the pinned sentences
    // that say there are none (C3-21).
    assert.deepEqual(forbiddenTermViolations(sentences()), [])
    assert.deepEqual(forbiddenTermViolations([{ id: 'ru-access', text: 'Any player may enter either end zone at any time.' }]), ['ru-access: end zone'], 'bite')
    assert.deepEqual(forbiddenTermViolations([{ id: 'ru-laws', text: 'Shots at goal are not allowed.' }]), ['ru-laws: goal'], 'bite: goals')
    // The scoring sentence is newly proposed wording derived from the approved scoring-event description (RC3 6.1, third status; RC3 6.2
    // keeps abbreviations to the Overview, so Coach Details carries no sentence labelled an abbreviation): it is locked to that cell by
    // whenValue, and it carries every part of the cell's meaning in coach terms. The record's note on scoring.means says it is derived.
    const k = committedKnowledge()
    const vocab = k.contexts.controlled_vocabulary.find((r) => cell(r, 'vocabulary') === 'scoring_event' && cell(r, 'value') === 'target_zone_entered')
    const template = BASE.wording.templates.find((t) => t.id === 'sc-event')
    assert.equal(template?.status, 'NEWLY PROPOSED')
    assert.ok(!BASE.wording.templates.some((t) => t.status === 'ABBREVIATED FROM APPROVED WORDING' && BASE.wording.sections.find((s) => s.id === t.section)?.level === 'Coach Details'), 'RC3 6.2: no abbreviation in Coach Details')
    assert.ok(REPORT_TEXT.includes('The Coach Details scoring sentence is newly proposed wording derived from this description'), 'the derivation is printed')
    assert.equal(template?.whenValue?.['scoring.means'], cell(vocab, 'description'))
    assert.equal(sentences().find((s) => s.id === 'sc-event')?.text, 'A team scores a point when one of its players dribbles into the target zone it attacks, or receives and controls the ball inside it.')
    // The approved description itself stays printed verbatim in Part 2.
    assert.ok(REPORT_TEXT.includes(`the cell: "${cell(vocab, 'description')}"`))
}

/**
 * Pinned: two sentences name the target zone (so they express the scoring event) and also name a marked line that is not a target: the
 * halfway line among the markings, and the end line a restart is taken from. Only that exact phrase is lifted out of each before the check.
 */
const LINE_PHRASES: Array<{ id: string; phrase: string }> = [
    { id: 'st-equipment', phrase: 'the halfway line' },
    { id: 'rs-end-line', phrase: 'goes over an end line' },
    // 6 November: the retired restart's 'from that end line' left; the review note R2 names the end line a team clears over.
    { id: 'rs-r2-distance', phrase: 'clearing over its own end line' },
]
/** Sentences that say what a team attacks, defends or scores, or how it wins (C3-08): directions, scoring, the win condition, opposition. */
const TARGET_PATHS = (p: string) => p === 'directions' || p === 'win.condition' || p.startsWith('scoring.') || p.startsWith('opposition.')
const LINE_WORDS = /\b(far|opponents'?|their|its own|own|end|goal|target)\s*lines?\b|line\b/i
const scoringViolations = (list: Array<{ id: string; text: string; expresses: string[] }>, targetTerm = BASE.wording.coachTerms.targetZone) =>
    list
        .filter((s) => s.expresses.some(TARGET_PATHS))
        .flatMap((s) => {
            const t = LINE_PHRASES.filter((x) => x.id === s.id).reduce((acc, x) => acc.split(x.phrase).join('…'), unquoted(s.text))
            const scoring = s.expresses.some((p) => p.startsWith('scoring.'))
            const out: string[] = []
            // The coach term is read from the wording's own coach terms (RC3 7.4), not typed here.
            if (scoring && !t.includes(targetTerm)) out.push(`${s.id}: does not name the ${targetTerm}`)
            if (LINE_WORDS.test(t) || /\bcross/i.test(t)) out.push(`${s.id}: says line or cross`)
            if (TARGET_AS_LINE.some((re) => re.test(t))) out.push(`${s.id}: a target called a line`)
            if (scoring && /\b(cross\w*|past|beyond|over)\b/i.test(t)) out.push(`${s.id}: scoring described as passing a boundary`)
            return out
        })

/** (g) Every sentence saying what a team attacks, scores or wins names the target zone (scoring sentences), never a line; bites. */
function testG_scoringSentencesNameTheTargetZone(): void {
    assert.deepEqual(scoringViolations(sentences()), [])
    assert.ok(sentences().filter((s) => s.expresses.some((p) => p.startsWith('scoring.'))).length >= 5)
    assert.equal(BASE.wording.coachTerms.targetZone, 'target zone', 'RC3 7.4')
    // Bite (C2-25): the coach term is read, not typed: with another term every scoring sentence fails.
    assert.equal(scoringViolations(sentences(), 'scoring area').filter((v) => v.endsWith('does not name the scoring area')).length, sentences().filter((s) => s.expresses.some((p) => p.startsWith('scoring.'))).length)
    assert.ok(scoringViolations([{ id: 'planted', text: 'A point is scored by crossing the far end line.', expresses: ['scoring.event'] }]).length >= 2, 'bite')
    // Bite: the lifted phrase is lifted only from its own sentence.
    assert.ok(scoringViolations([{ id: 'sc-event', text: 'A point is scored in the target zone from the halfway line.', expresses: ['scoring.event'] }]).length >= 1, 'bite: the pinned phrase is not lifted elsewhere')
    // Bites (C3-08): a direction sentence calling the target a line; a scoring sentence describing a crossing in other words; "endline".
    assert.ok(scoringViolations([{ id: 'ru-directions', text: 'Each team attacks the far line and defends its own end for the whole game.', expresses: ['directions'] }]).length >= 1, 'bite: the far line')
    assert.ok(scoringViolations([{ id: 'ov-scoring', text: 'Each team scores a point when one of its players carries the ball past the far edge of the target zone it attacks; there is no offside.', expresses: ['scoring.event', 'rules.offside'] }]).length >= 1, 'bite: past the far edge')
    assert.ok(scoringViolations([{ id: 'sc-regain', text: 'A controlled arrival over the endline of the target zone counts even straight after the team has won the ball.', expresses: ['scoring.afterRegain', 'scoring.event'] }]).length >= 1, 'bite: over the endline')
    assert.ok(scoringViolations([{ id: 'wn-points', text: 'The team that reaches the opponents\' line most often wins the block.', expresses: ['win.condition'] }]).length >= 1, 'bite: a win sentence')
}

/** Wording that hands the starting condition to watching, in any of the ways checked here (C3-11; Christian's 5 November and 30 October words). */
const STARTING_WORDS = /starting condition|where (the|each|an) attacks? (start|starts|started|begin|begins|began)|\bbegan\b|\bstarted\b|from deep|\borigin|build(s|ing)?[- ]?(up|from)|built up|settled possession|from (a|the) (settled|organi[sz]ed) (start|possession)|\bwhere (it|they) (began|started)\b/i
/** The What to Watch sentences that are ours (not Christian's quoted categories), pinned word for word. */
const WATCH_OURS: Record<string, string> = {
    'ob-intro': 'These categories describe how a score came about; there is no target for any of them.',
    'ob-pointer': 'The categories do not decide whether an arrival in the target zone counts.',
}
/** (h) The observation block: Christian's sentence verbatim; nothing about the starting condition at all; no numbers or learning claims. */
function testH_observationBlock(): void {
    const block = BASE.composed.sections.find((s) => s.id === 'CD-WATCH')?.sentences ?? []
    assert.ok(block.some((s) => s.text === 'Both scoring situations remain legitimate.'))
    // Christian's 5 November words: "Do not silently remove that condition by transferring it into the coach's observational emphasis."
    assert.deepEqual(block.filter((s) => STARTING_WORDS.test(s.text)).map((s) => s.id), [], 'What to Watch says nothing about the starting condition')
    assert.ok(block.every((s) => !s.expresses.includes('scoring.startingCondition')), 'no What to Watch sentence expresses the starting condition')
    for (const s of block) {
        assert.ok(!/\d|%|percent/i.test(s.text) && !NUMBER_WORDS.test(s.text), `${s.id}: a number`)
        assert.ok(!/\blearning\b|\bevidence\b/i.test(s.text), `${s.id}: a learning or evidence claim`)
    }
    // The pointer, pinned: the categories decide nothing about scoring.
    assert.equal(block.find((s) => s.id === 'ob-pointer')?.text, 'The categories do not decide whether an arrival in the target zone counts.')
    // The open question stays in Scoring (a review note there) and in Part 6.
    assert.ok(BASE.composed.sections.find((s) => s.id === 'CD-SCORING')?.sentences.some((s) => s.expresses.includes('scoring.startingCondition') && s.text.includes('not yet decided')))
    assert.ok(REPORT_TEXT.split('=== PART 6.')[1].includes('scoring.startingCondition [class 6'))
    // Bite: the old pointer sentence fails.
    assert.ok(STARTING_WORDS.test('The categories do not decide whether an arrival counts, and they do not settle the role of the attack\'s starting condition.'))
    // Bite (C3-11): the starting condition handed to watching in other words fails.
    assert.ok(STARTING_WORDS.test('Watch where each attack began: a score built up from a settled possession is the situation this example is for, and there is no target for any of them.'))
    // Every What to Watch sentence of ours is pinned word for word; the rest are Christian's quoted categories, verified verbatim in (f).
    for (const s of block) {
        if (s.quoted) assert.ok(BASE.experiment.rulings.some((r) => r.words.includes(s.text)), s.id)
        else assert.equal(s.text, WATCH_OURS[s.id], `${s.id}: an unpinned What to Watch sentence of ours`)
    }
    assert.deepEqual(block.filter((s) => !s.quoted).map((s) => s.id).sort(), Object.keys(WATCH_OURS).sort())
}

const EFFECT_WORDS =
    /\b(invite[sd]?|inviting|encourag(e|es|ed|ing)|create[sd]? opportunit\w*|creates opportunit\w*|create[sd]? space|creating space|help[s]? players|improv(e|es|ed|ing)|develop(s|ed|ing)?|promot(e|es|ed|ing)|ensur(e|es|ed|ing)|leads? to|so that|restor(e|es|ed|ing)|reorgani[sz](e|es|ed|ing)|reward(s|ed|ing)?|force[sd]?|forcing|gives? \w+ reasons?|allow[s]?|allowing|results? in|make[s]? (\w+ ){1,2}(progress|move|look)|drive[sd]?|driving|teach(es|ing)?|taught|re-?establish(es|ed|ing)?|foster(s|ed|ing)?|shape[sd]?|shaping|increase[sd]? (the )?(frequency|opportunit\w*))\b/i
/**
 * Phrases lifted from a report line before the effect scan (C3-12), each with why it is no effect claim. Names and the approved purpose
 * (display texts) are lifted separately; everything else in the report, outside double quotation marks, is scanned.
 */
const EFFECT_EXEMPT: Array<[string, string]> = [
    ['not promoted', 'a negation: a finding kept, not promoted'],
    ['neither promoted nor discarded', 'a negation (Christian\'s Composite wording)'],
    ['nor automatically promoted', 'a negation in the DRAFT K2 wording (Christian\'s Composite words: a stronger secondary requirement is not automatically promoted)'],
    ['the knowledge in force', 'the knowledge valid at the time K2 is applied (DRAFT K2 wording), not an effect'],
    ['promoted to owner-authored canonical knowledge', 'Christian\'s own ruling\'s verb ("Promote GF2-14.b ... to owner-authored canonical knowledge"), a change of standing, not an effect'],
    ['not a method of restoring', 'a negation of Christian\'s caveat'],
    ['never presented as restoring', 'a negation of Christian\'s caveat'],
    ['hether attacks develop from', 'an observable condition, asked as a question'],
    ['hether attacks improve their conditions', 'an observable condition, asked as a question (the purpose\'s own words)'],
    ['as play develops', 'time, not an effect'],
    ['the advancement that leads to a point', 'an observable condition: which advancement precedes a point'],
    ['the Laws allow no goal', 'a statement of the Laws'],
    ['restore Christian\'s', 'restoring Christian\'s wording, not an effect on play'],
]
const effectViolations = (report: string, lifted: string[]): string[] =>
    report.split('\n').flatMap((line, i) => {
        let t = unquoted(line)
        for (const s of [...lifted, ...EFFECT_EXEMPT.map(([p]) => p)]) t = t.split(s).join('…')
        const m = t.match(EFFECT_WORDS)
        return m ? [`line ${i + 1}: "${m[0]}" in ${t.trim().slice(0, 140)}`] : []
    })
/** The display texts lifted before the effect scan: the Game Problem names and the approved purpose (verified against their cells in (k)). */
const displayLifted = (r: AssemblyRun = BASE) => [...Object.values(r.display.names).map((n) => n.text), ...Object.values(r.display.cells).map((c) => c.text)]
const rationaleLines = (report: string) => {
    const lines = report.split('\n')
    const start = lines.findIndex((l) => l.startsWith('DESIGN RATIONALE'))
    const end = lines.findIndex((l, i) => i > start && l.startsWith('==='))
    return lines.slice(start + 1, end).filter((l) => l.trim())
}
/** (i) Each rationale line cites a value; no effect wording outside Christian's quoted words; bite. */
function testI_rationaleMakesNoEffectClaim(): void {
    const lines = rationaleLines(REPORT_TEXT)
    const paths = BASE.experiment.choices.map((c) => c.path)
    assert.equal(lines.length, paths.length)
    for (const l of lines) {
        assert.ok(paths.some((p) => l.trim().startsWith(`${p}:`)), l)
        // Our values now print in single quotation marks (C1-07: not Christian's words), so each line is scanned as the report scan below
        // scans it: names and the approved purpose lifted, and the pinned negations.
        assert.deepEqual(effectViolations(l, displayLifted()), [], l)
    }
    assert.ok(EFFECT_WORDS.test(unquoted('The target zones encourage players to create space.')), 'bite')
    // Every report line, outside double quotation marks (Christian's words and approved text), is scanned (C3-12).
    assert.deepEqual(effectViolations(REPORT_TEXT, displayLifted()), [])
    // Bites: the nine planted paraphrases are all caught, and so is Christian's caveat when printed outside double quotation marks.
    for (const claim of ['The target zones reward players who arrive.', 'They force defenders to compress.', 'It gives attackers reasons to run.', 'This allows the team to switch play.', 'It results in more forward runs.', 'It will make the attack progress.', 'They drive progression and teach players.', 'The kick-off re-establishes an organized defence.', 'It fosters purposeful advancement.']) {
        assert.equal(effectViolations(claim, []).length, 1, claim)
    }
    assert.equal(effectViolations("Christian's caveat: 'do not promote it as a demonstrated method of restoring organized defensive relationships.'", []).length, 1, 'bite: Christian\'s words in single quotation marks are scanned')
    assert.equal(effectViolations('Christian\'s caveat: "do not promote it as a demonstrated method of restoring organized defensive relationships."', []).length, 0, 'Christian\'s words in double quotation marks are not')
}

/**
 * Keeping possession as a condition of scoring, in any words (C3-13): Christian's 5 November assessment left open whether maintaining possession is a
 * requirement, so no scoring or win sentence may settle it. Pinned exemption: the purpose sentence, the approved Coach Definition verbatim.
 */
const POSSESSION_CONDITION = /\b(keep|keeps|kept|keeping|maintain\w*|retain\w*)\b[^.;]*\bpossession\b|\bprovided\b|\bas long as\b|\bonly if\b/i
const POSSESSION_EXEMPT = ['ov-purpose']
const possessionViolations = (list: Array<{ id: string; text: string; expresses: string[]; quoted?: boolean }>) =>
    list.filter((s) => !s.quoted && !POSSESSION_EXEMPT.includes(s.id) && s.expresses.some((p) => p.startsWith('scoring.') || p === 'win.condition') && POSSESSION_CONDITION.test(unquoted(s.text))).map((s) => s.id)

/** (j) No coach sentence states the possession clause as a rule, in any words; the printed workbook text is byte-equal to its cell. */
function testJ_workbookTextAndThePossessionClause(): void {
    for (const s of sentences()) assert.ok(!s.text.includes('while maintaining attacking possession'), s.id)
    assert.deepEqual(possessionViolations(sentences()), [])
    assert.deepEqual(possessionViolations([{ id: 'sc-event', text: 'A team scores a point with a controlled arrival in the target zone it attacks, provided it keeps possession.', expresses: ['scoring.event'] }]), ['sc-event'], 'bite')
    assert.deepEqual(possessionViolations([{ id: 'wn-points', text: 'The team that retains possession longest in a block wins it.', expresses: ['win.condition'] }]), ['wn-points'], 'bite: a win sentence')
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
    // Each requirement the account cites, as its statement cell holds it (an identity rule's statement, a property's text), one per cited
    // requirement, printed beside every account line that cites it.
    const STATEMENT: Record<string, [string, string]> = { identity_rules: ['identity_rule_id', 'identity_statement'], properties: ['property_id', 'property_text'] }
    assert.deepEqual(Object.keys(BASE.display.statements).sort(), [...new Set(BASE.experiment.requirementAccount.map((a) => `${a.requirementRef.table} ${a.requirementRef.row}`))].sort())
    for (const [key, s] of Object.entries(BASE.display.statements)) {
        const [table, row] = key.split(' ')
        assert.equal(s.text, raw('contexts', table).find((r) => r[STATEMENT[table][0]] === row)?.[STATEMENT[table][1]], key)
    }
    for (const l of BASE.account.lines) {
        const s = BASE.display.statements[`${l.requirementRef.table} ${l.requirementRef.row}`]
        assert.ok(REPORT_TEXT.includes(`    ${l.id} ${l.requirementRef.table} ${l.requirementRef.row} (`), l.id)
        const after = REPORT_TEXT.split(`    ${l.id} ${l.requirementRef.table} ${l.requirementRef.row} (`)[1].split('\n')[1]
        assert.equal(after, `      requirement (${l.requirementRef.row} ${STATEMENT[l.requirementRef.table][1]}): "${s.text}"`, `${l.id}: its requirement is printed on the next line`)
    }
    assert.ok(REPORT_TEXT.includes('requirement (RPC-ID-013 identity_statement): "Possession alone is insufficient as success."'))
    // The readers this experiment added agree with the context library's own loader, for every context (C4-11).
    const byId = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })
    assert.ok(rpcLibrary.contexts().length >= 3)
    for (const { id: rpc } of rpcLibrary.contexts()) {
        assert.deepEqual(contextIdentityRules(k, rpc).map((r) => r.identityRuleId), rpcLibrary.identityRules(rpc).map((r) => String(r['identity_rule_id'])).sort(byId), rpc)
        assert.deepEqual(contextValidationRules(k, rpc).map((r) => r.validationId), rpcLibrary.validationRules(rpc).map((r) => String(r['validation_id'])).sort(byId), rpc)
    }
    // The suitability rows are found through those readers, over the routed context only: a row of another context does not count.
    const otherContextRow = k.contexts.validation_rules.find((r) => cell(r, 'rpc_id') !== BASE.activity.rpcId)
    assert.ok(otherContextRow, 'a validation rule of another context exists')
    const x = rawX()
    x.suitability.properties[0].structural.rows = [cell(otherContextRow, 'validation_id')]
    assert.deepEqual(run(committedKnowledge(), x).suitability.properties[0].structural.missingRows, [cell(otherContextRow, 'validation_id')], 'bite: a row of another context is not found')
    assert.deepEqual(activeContextRelationships(k, 'RPC-003', 'SCORING_EVENT').map((r) => r.relatedId).sort(), [...rpcLibrary.scoringEventsForContext('RPC-003')].sort())
}

/**
 * (k2) No decision reads a display text (C4-05; the display reader's exemption argued from behaviour, not only from imports). Every cell on
 * the display allowlist is rewritten in a copy of the knowledge, the pipeline's deciding steps are re-run with the rewritten display texts,
 * and every decision is identical. Two guards compare display text with Christian's words or an approved cell and can only REFUSE: the Game
 * Problems' names must be in Christian's scope words, and the scoring sentence derived from it is locked to the approved description. The full run
 * therefore refuses with the rewritten texts, for those two reasons only.
 */
function decisionsOf(k: DesignKnowledge): unknown {
    const x = validateExperiment(committedExperimentData())
    const resolution = resolveDesignContext(k, x.learningGoalId)
    const forms = selectGameForm(k, resolution)
    const activity = assembleActivity(k, resolution, forms, x, display(k, x, resolution, forms))
    const account = requirementAccountOf(k, x, activity)
    const suitability = suitabilityReview(k, resolution, forms, x, activity)
    const scenarios = scenarioReview(k, resolution, forms, x, activity)
    return {
        resolution: [resolution.status, resolution.gameProblems.primary, resolution.gameProblems.secondary, resolution.context?.rpcId],
        forms: [forms.status, forms.compatible, forms.preference.status],
        choices: activity.choices.map((c) => [c.path, c.howReached, c.declaredStatus, c.sixClass, c.computed, c.decidedBy.map((i) => i.standing), Array.isArray(c.value) ? c.value : c.howReached === 'READ_BY_CODE' ? null : c.value]),
        derived: activity.derived.map((d) => [d.id, d.value, d.sixClass]),
        counts: activity.counts,
        account: account.lines.map((l) => [l.id, l.category, l.satisfied, l.downgraded, l.excluded]),
        accountCounts: account.counts,
        suitability: [suitability.properties.map((p) => [p.property, p.structural.status, p.functional.status]), suitability.structural.map((e) => [e.gameFormId, e.preconditions.map((p) => p.status), e.continuousPlay.status, e.integrity.conditions.map((c) => c.status)])],
        scenarios: scenarios.map((s) => [s.id, s.mismatch.reported, s.uncertainty.reported, s.scope.established, s.width.outcome]),
    }
}
function testK2_noDecisionReadsADisplayText(): void {
    const k = committedKnowledge()
    let rewritten = 0
    for (const a of DISPLAY_ALLOWLIST) {
        for (const row of (k as unknown as Record<string, Record<string, Raw[]>>)[a.source][a.table]) {
            if (typeof row[a.column] === 'string' && row[a.column].length) {
                row[a.column] = `Reworded ${String(row[a.column]).split('').reverse().join('')}`
                rewritten++
            }
        }
    }
    assert.ok(rewritten > 200, `rewrote ${rewritten} display cells`)
    assert.equal(json(decisionsOf(k)), json(decisionsOf(committedKnowledge())), 'every decision is identical with every display text rewritten')
    // Bite: the projection sees a decision move (one CAR rating changed removes the secondary finding).
    const moved = committedKnowledge()
    ;(moved.car.ratings.find((r) => cell(r, 'game_problem_id') === 'GP-002') as Raw).FOI = 'S'
    assert.notEqual(json(decisionsOf(moved)), json(decisionsOf(committedKnowledge())), 'bite: a knowledge change moves the projection')
    // The full run refuses, by the name guard (the first to read a rewritten name); with the names restored, by the scoring-sentence lock.
    assert.throws(() => run(k), /is not named in Christian's scope words/)
    const k2 = committedKnowledge()
    ;(k2.contexts.controlled_vocabulary.find((r) => cell(r, 'vocabulary') === 'scoring_event' && cell(r, 'value') === 'target_zone_entered') as Raw).description = 'Reworded description.'
    assert.throws(() => run(k2), /whenValue scoring\.means = /)
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Provenance (l)-(q)
// -------------------------------------------------------------------------------------------------------------------------------------

/** Every value's class (Christian's six), written here from the design and the adjudication, not read from the record. */
const EXPECTED_CLASS: Record<string, SixClass> = {
    purpose: 2,
    'gameProblems.primary': 2,
    'gameProblems.secondary': 2,
    'gameProblems.secondaryFinding': 2,
    'gameProblems.candidate': 3,
    'gameForm.illustrativeChoice': 5,
    'gameForm.alternatives': 3,
    'teams.count': 2,
    'teams.equalOutfield': 1,
    'players.perTeam': 5,
    'players.goalkeepers': 5,
    'area.lengthM': 5,
    'area.widthM': 5,
    'area.includesEndZones': 5,
    'area.goalkeepersCounted': 5,
    'area.halfwayLine': 5,
    'area.centreMark': 5,
    'endZones.depthM': 5,
    'endZones.placement': 5,
    'endZones.positioning': 6,
    'endZones.access': 6,
    interactionRegulations: 6,
    directions: 2,
    'scoring.event': 3,
    'scoring.means': 3,
    'scoring.qualifyingCondition.workbookText': 3,
    'scoring.qualifyingCondition.sep13Text': 2,
    'scoring.startingCondition': 6,
    'scoring.afterRegain': 2,
    'scoring.mirrored': 6,
    'opposition.reciprocal': 3,
    'play.continuous': 2,
    'start.method': 3,
    'start.kickoffDetails': 6,
    // 6 November (section 8): Christian's scoped ruling for the current prototype, no longer our reading.
    'start.kickoffDistanceM': 2,
    'restart.afterPoint.method': 3,
    'restart.afterPoint.who': 6,
    'rules.offside': 3,
    'restart.touchline': 2,
    'rules.fouls': 2,
    'rules.handling': 2,
    'laws.default': 2,
    'laws.goalEnd': 6,
    // The coach-served end-line restart (DESIGN-6-v2 A3), as designed: the method and timing Christian's provisional ruling (class 3); to
    // whom, no reset and the live serve our readings (class 6, OURS); the location our illustrative exclusion (class 5); the receiving
    // distance unresolved (class 6, UNRESOLVED).
    'restart.endLine.method': 3,
    'restart.endLine.toWhom': 6,
    'restart.endLine.timing': 3,
    'restart.endLine.noReset': 6,
    'restart.endLine.contest': 6,
    'restart.endLine.location': 5,
    'restart.endLine.receivingDistance': 6,
    'duration.blocks': 5,
    'duration.blockMinutes': 5,
    'duration.breaks': 5,
    'equipment.bibs': 5,
    'equipment.markers': 5,
    'equipment.balls': 5,
    'win.condition': 5,
    'observation.categories': 3,
    adjustments: 6,
    coachQuestion: 6,
}
const classViolations = (choices: Array<{ path: string; sixClass: SixClass }>): string[] => [
    ...choices.filter((c) => EXPECTED_CLASS[c.path] === undefined).map((c) => `${c.path}: no pinned class`),
    ...Object.keys(EXPECTED_CLASS).filter((p) => !choices.some((c) => c.path === p)).map((p) => `${p}: pinned but not a value`),
    ...choices.filter((c) => EXPECTED_CLASS[c.path] !== undefined && c.sixClass !== EXPECTED_CLASS[c.path]).map((c) => `${c.path}: class ${c.sixClass}, expected ${EXPECTED_CLASS[c.path]}`),
]

/**
 * Every value's label (Christian's reply of 6 November, section 7: a missing value, our reading and an illustrative choice kept apart; a
 * value a premise of authority determines labelled by its weakest determining premise), written here apart from the code and the record.
 */
const L_UNRESOLVED = 'UNRESOLVED: no authorized value; needs a knowledge decision'
const L_OURS = 'OURS: LOGICAL INFERENCE (our reading, not canonical; needs Christian\'s confirmation)'
const L_ILLUSTRATIVE = 'ILLUSTRATIVE (for this offline test only; to be replaced before any production use)'
const L_PROVISIONAL = 'RULING, provisional'
const EXPECTED_LABEL: Record<string, string> = {
    purpose: 'RULING', 'gameProblems.primary': 'RULING', 'gameProblems.secondary': 'RULING', 'gameProblems.secondaryFinding': 'RULING', 'gameProblems.candidate': 'CANDIDATE',
    'gameForm.illustrativeChoice': L_ILLUSTRATIVE, 'gameForm.alternatives': 'CANDIDATE', 'teams.count': 'RULING', 'teams.equalOutfield': 'APPROVED',
    'players.perTeam': L_ILLUSTRATIVE, 'players.goalkeepers': L_ILLUSTRATIVE, 'area.lengthM': L_ILLUSTRATIVE, 'area.widthM': L_ILLUSTRATIVE, 'area.includesEndZones': L_ILLUSTRATIVE,
    'area.goalkeepersCounted': L_ILLUSTRATIVE, 'area.halfwayLine': L_ILLUSTRATIVE, 'area.centreMark': L_ILLUSTRATIVE, 'endZones.depthM': L_ILLUSTRATIVE, 'endZones.placement': L_ILLUSTRATIVE,
    'endZones.positioning': L_UNRESOLVED, 'endZones.access': L_OURS, interactionRegulations: L_OURS, directions: 'RULING', 'scoring.event': L_PROVISIONAL, 'scoring.means': L_PROVISIONAL,
    'scoring.qualifyingCondition.workbookText': 'CANDIDATE', 'scoring.qualifyingCondition.sep13Text': 'RULING', 'scoring.startingCondition': L_UNRESOLVED, 'scoring.afterRegain': 'RULING',
    'scoring.mirrored': L_OURS, 'opposition.reciprocal': L_PROVISIONAL, 'play.continuous': 'RULING', 'start.method': L_PROVISIONAL, 'start.kickoffDetails': L_OURS, 'start.kickoffDistanceM': 'RULING',
    'restart.afterPoint.method': L_PROVISIONAL, 'restart.afterPoint.who': L_OURS, 'rules.offside': L_PROVISIONAL, 'restart.touchline': 'RULING', 'rules.fouls': 'RULING', 'rules.handling': 'RULING',
    'laws.default': 'RULING', 'laws.goalEnd': L_OURS, 'restart.endLine.method': L_PROVISIONAL, 'restart.endLine.toWhom': L_OURS, 'restart.endLine.timing': L_PROVISIONAL, 'restart.endLine.noReset': L_OURS,
    'restart.endLine.contest': L_OURS, 'restart.endLine.location': L_ILLUSTRATIVE, 'restart.endLine.receivingDistance': L_UNRESOLVED, 'duration.blocks': L_ILLUSTRATIVE, 'duration.blockMinutes': L_ILLUSTRATIVE,
    'duration.breaks': L_ILLUSTRATIVE, 'equipment.bibs': L_ILLUSTRATIVE, 'equipment.markers': L_ILLUSTRATIVE, 'equipment.balls': L_ILLUSTRATIVE, 'win.condition': L_ILLUSTRATIVE,
    'observation.categories': L_PROVISIONAL, adjustments: L_OURS, coachQuestion: L_OURS,
}
const labelViolations = (choices: Array<{ path: string; label: string }>): string[] => [
    ...choices.filter((c) => EXPECTED_LABEL[c.path] === undefined).map((c) => `${c.path}: no pinned label`),
    ...Object.keys(EXPECTED_LABEL).filter((p) => !choices.some((c) => c.path === p)).map((p) => `${p}: pinned but not a value`),
    ...choices.filter((c) => EXPECTED_LABEL[c.path] !== undefined && c.label !== EXPECTED_LABEL[c.path]).map((c) => `${c.path}: label "${c.label}", expected "${EXPECTED_LABEL[c.path]}"`),
]

/** (l2) Every value's label pinned; the report prints each class with its label; a relabelled value fails; results carry the provisional flag. */
function testL2_labelsAndPremises(): void {
    assert.deepEqual(labelViolations(BASE.activity.choices), [])
    // Bite: our reading relabelled as an illustrative choice (decided by ILLUSTRATIVE, with a permission) fails the pin, though it validates.
    const relabelled = rawX()
    const contest = relabelled.choices.find((c: Raw) => c.path === 'restart.endLine.contest')
    Object.assign(contest, { declaredStatus: 'ILLUSTRATIVE', howReached: 'ENTERED_ILLUSTRATIVE', decidedBy: [{ ref: 'ILLUSTRATIVE', standing: 'ILLUSTRATIVE' }], permittedBy: [{ rulingRef: 'ASM-AUTH-ILLUSTRATIVE', quote: 'an illustrative value may be used for this offline prototype' }] })
    delete contest.readingOf
    assert.deepEqual(labelViolations(run(committedKnowledge(), relabelled).activity.choices), [`restart.endLine.contest: label "${L_ILLUSTRATIVE}", expected "${L_OURS}"`], 'bite: a relabelled value')
    // Every class printed for a value carries its label: Part 2, the rationale and the status list.
    for (const c of BASE.activity.choices) {
        assert.ok(part2Block(c.path).includes(`; class ${c.sixClass}: ${SIX_CLASSES[c.sixClass - 1].slice(0, -1)}; ${EXPECTED_LABEL[c.path]}`), `${c.path}: Part 2 class without its label`)
        assert.ok(rationaleLines(REPORT_TEXT).some((l) => l.trim().startsWith(`${c.path}:`) && l.includes(`; ${EXPECTED_LABEL[c.path]}]`)), `${c.path}: rationale class without its label`)
    }
    // The weakest determining premise(s) named, the rest tallied (Christian's reply of 6 November, section 7).
    assert.ok(part2Block('scoring.means').includes('weakest determining premise: ASM-29OCT-PROVISIONAL (received 29 October 2026; provisional) [RULING, provisional]; the rest: 1 APPROVED'))
    assert.ok(part2Block('restart.endLine.method').includes('weakest determining premises: ASM-06NOV-RESTART (received 6 November 2026; provisional) [RULING, provisional]; ASM-REV1-COACH-SERVED-BALL (received 5 November 2026, first reply; provisional for this decision) [RULING, provisional]; the rest: none'))
    // The first reply's words are not relabelled: the registry still files them as Christian wrote them (not provisional in Christian's words).
    assert.equal(BASE.experiment.rulings.find((r) => r.id === 'ASM-REV1-COACH-SERVED-BALL')?.provisional, false)
    assert.ok(part2Block('restart.endLine.method').includes('(states the value; general, no scope stated; provisional for this decision: used here only within the provisional offline arrangement of the reply of 6 November, section 6 (said of this review prototype; not a general restart rule) (ASM-06NOV-RESTART))'))
    // A reading of ours prints the class of what it reads; a status-setting ruling says it decides no value.
    assert.ok(part2Block('restart.endLine.toWhom').includes('it reads a ruling of class 3: Candidate or provisional knowledge'))
    assert.ok(part2Block('scoring.startingCondition').includes("[RULING] sets this premise's standing, and so the class; decides no value"))
    // The results carry each decisive item's provisional flag (critic G6): true exactly for the provisional rulings.
    const results = REPORT.results as { activity: { choices: Array<{ path: string; decidedBy: Array<{ ref: string; provisional: boolean }> }> } }
    for (const c of results.activity.choices) {
        for (const i of c.decidedBy) {
            const id = i.ref.split(' ')[0]
            const r = BASE.experiment.rulings.find((y) => y.id === id)
            const here = choiceOf(BASE.experiment, c.path).decidedBy.find((d) => d.rulingRef === id)?.provisionalBy
            assert.equal(i.provisional, Boolean(r?.provisional) || Boolean(here), `${c.path} ${i.ref}`)
        }
    }
    // The stage 6 review (C2-05): values of one class with different labels are listed by value; the same class and label is one marker.
    assert.equal(sentenceMarker([{ path: 'a', sixClass: 6, label: L_UNRESOLVED }, { path: 'b', sixClass: 6, label: L_OURS }]), `[class 6: ${SIX_CLASSES[5].slice(0, -1)}; by value: a class 6 (${L_UNRESOLVED}), b class 6 (${L_OURS})]`)
    assert.equal(sentenceMarker([{ path: 'a', sixClass: 3, label: L_PROVISIONAL }, { path: 'b', sixClass: 3, label: L_PROVISIONAL }]), `[class 3: ${SIX_CLASSES[2].slice(0, -1)}; ${L_PROVISIONAL}]`)
    // C2-07: every branch of the label function, the premise standings of Christian's three kinds mapped to the same labels as values.
    const prem = (standing: Standing, provisional = false) => premisesOf([{ ref: 'x', standing, provisional }])
    assert.equal(valueLabel('READ_BY_CODE', prem('OURS'), 6, 'RULING'), L_OURS)
    assert.equal(valueLabel('READ_BY_CODE', prem('ILLUSTRATIVE'), 5, 'RULING'), L_ILLUSTRATIVE)
    assert.equal(valueLabel('READ_BY_CODE', prem('APPROVED'), 3, 'CANDIDATE'), 'declared CANDIDATE')
    assert.equal(valueLabel('READ_BY_CODE', premisesOf([]), 6, 'RULING'), 'LOGICAL INFERENCE (computed by the Stage 1/2 code)')
    assert.equal(valueLabel('ENTERED_EVIDENCED', prem('RULING', true), 3, 'RULING'), L_PROVISIONAL)
    // C2-14: an answered decision is never listed among the open ones; Part 7 counts open and answered apart.
    const front = REPORT_TEXT.split('=== PART 0.')[0]
    const openBlocks = front.split('- Answered, no longer open')[0]
    const answered = BASE.experiment.openDecisions.filter((d) => d.answeredBy)
    for (const d of answered) {
        assert.ok(!openBlocks.includes(`    ${d.id}: `) && !openBlocks.includes(` ${d.id}: ${d.question}`), `${d.id}: an answered decision listed as open`)
        assert.ok(REPORT_TEXT.includes(`    ${d.id} (${d.blocks}): ${d.answeredBy?.statement}`), `${d.id}: printed as answered`)
    }
    assert.equal(answered.length, 3)
    assert.ok(REPORT_TEXT.includes('18 open decisions (and 3 answered, kept by id)'))
    assert.ok(front.includes('- Recorded, nothing asked now (kept open by id):\n    AOD-OPTION-B: '), 'option (b) is recorded, not asked')
    // A derived value prints each source's class and label.
    assert.ok(REPORT_TEXT.split('\n').some((l) => l.startsWith('  area.betweenTargetZonesM2 = ') && l.includes('endZones.placement (class 5: ') && l.includes(', the weakest of its sources')))
    // The front splits class 6 by label and keeps our readings apart from missing values.
    assert.ok(REPORT_TEXT.includes(`- What class 6 holds: 13 values, split by label: 3 ${L_UNRESOLVED}; 10 ${L_OURS}. Our readings are kept distinct within class 6 by label`))
    assert.ok(!REPORT_TEXT.includes('no separate place for our readings'))
}

/** (l) Christian's six classes, table-driven over every standing and the provisional flag, with the mixed cases. */
function testL_sixClasses(): void {
    const expected: Record<Standing, SixClass | 'THROWS'> = { APPROVED: 1, RULING: 2, PROVISIONAL: 'THROWS', CANDIDATE: 3, 'REFERENCE ONLY': 'THROWS', OURS: 6, 'TEST ASSUMPTION': 4, 'TEST INPUT': 4, ILLUSTRATIVE: 5, UNRESOLVED: 6 }
    for (const s of STANDINGS) {
        if (expected[s] === 'THROWS') throwsWith(() => sixClassOf([{ standing: s }]), s)
        else assert.equal(sixClassOf([{ standing: s }]), expected[s], s)
    }
    assert.equal(sixClassOf([{ standing: 'RULING', provisional: true }]), 3, 'Christian\'s provisional ruling')
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
    // Christian's six classes are filed as Christian's words (received 5 November 2026), and cited where they are printed (recheck S10).
    const classesEntry = BASE.experiment.rulings.find((r) => r.id === BASE.experiment.reportRefs.sixClasses.rulingRef)
    assert.deepEqual(classesEntry?.words.slice(1), [...SIX_CLASSES], 'Christian\'s six classes are filed verbatim, in Christian\'s order')
    assert.equal(classesEntry?.received, '2026-11-05')
    assert.ok(REPORT_TEXT.includes(`Christian's six classes, in Christian's order (Christian's words, ${classesEntry?.id}, received 5 November 2026, second reply): ${SIX_CLASSES.map((c, i) => `${i + 1} "${c}"`).join(' / ')}`))
    assert.ok(REPORT_TEXT.includes(`- Christian's six classes (Christian's words, ${classesEntry?.id}, received 5 November 2026, second reply; printed in full in Part 2) over the `))
    const at = (p: string) => BASE.activity.choices.find((c) => c.path === p)
    for (const c of BASE.activity.choices.filter((x) => x.howReached === 'UNRESOLVED')) assert.equal(c.sixClass, 6, c.path)
    assert.equal(at('gameProblems.candidate')?.sixClass, 3, 'Gain Access')
    // Each value Christian's provisional ruling decides is class 3, and its own Part 2 block prints that ruling's received date and words (C3-09).
    for (const p of ['scoring.event', 'rules.offside', 'start.method', 'observation.categories', 'opposition.reciprocal', 'restart.endLine.method', 'restart.endLine.timing']) {
        assert.equal(at(p)?.sixClass, 3, `${p}: Christian's provisional ruling, class 3`)
        const choice = choiceOf(BASE.experiment, p)
        const provisional = choice.decidedBy.filter((d) => d.rulingRef && BASE.experiment.rulings.find((r) => r.id === d.rulingRef)?.provisional)
        assert.ok(provisional.length > 0, p)
        for (const d of provisional) {
            const r = BASE.experiment.rulings.find((y) => y.id === d.rulingRef) as Raw
            assert.ok(part2Block(p).includes(`Christian's provisional ruling, received ${receivedOf(r as { received: string; replyOfDay?: string })}: "${d.valueEvidence}"`), `${p} ${d.rulingRef}`)
        }
    }
    // Every value's class, pinned here from the lead's design (section 4) as corrected in the README and by the adjudication (D11: equal
    // numbers class 1; D4: the goal-end restarts OURS), independently of the record (C3-09, the lead's D2): a label upgrade fails.
    assert.deepEqual(classViolations(BASE.activity.choices), [])
    const upgraded = rawX()
    const wb = upgraded.choices.find((c: Raw) => c.path === 'scoring.qualifyingCondition.workbookText')
    wb.decidedBy[0].standing = 'APPROVED'
    wb.declaredStatus = 'APPROVED'
    wb.decidedBy[0].valueEvidence = displayCell(committedKnowledge(), wb.knowledgeRef).text
    assert.deepEqual(classViolations(run(committedKnowledge(), upgraded).activity.choices), ['scoring.qualifyingCondition.workbookText: class 1, expected 3'], 'bite: the workbook wording upgraded to APPROVED')
    for (const c of BASE.activity.choices.filter((x) => x.declaredStatus === 'ILLUSTRATIVE')) assert.equal(c.sixClass, 5, c.path)
    for (const c of BASE.activity.choices.filter((x) => x.declaredStatus === 'OURS')) assert.equal(c.sixClass, 6, c.path)
    // Each sentence's marker is the weakest class among its values (class 1 unmarked), each value's class listed where they differ; a
    // review-only sentence says it would be dropped from a coach copy.
    for (const s of sentences()) {
        const classes = s.expresses.map((p) => (at(p) as Raw).sixClass as number)
        const cls = classes.length ? (Math.max(...classes) as SixClass) : null
        assert.equal(s.sixClass, cls, s.id)
        assert.equal(s.marker, sentenceMarker(s.expresses.map((p) => ({ path: p, sixClass: (at(p) as Raw).sixClass as SixClass, label: EXPECTED_LABEL[p] })), s.reviewOnly), s.id)
        assert.ok(s.marker.startsWith(markerOf(cls).slice(0, -1)), s.id)
        if (new Set(classes).size > 1) assert.ok(s.marker.includes('; by value: '), `${s.id}: a mixed sentence lists each value's class`)
        // Where the values share a class but differ in label (our reading beside a missing value), each value is listed too (6 November).
        if (new Set(s.expresses.map((p) => `${(at(p) as Raw).sixClass}|${EXPECTED_LABEL[p]}`)).size > 1) assert.ok(s.marker.includes('; by value: '), `${s.id}: values that differ in label are listed`)
        else if (cls !== null && cls > 1) assert.ok(s.marker.includes(`; ${EXPECTED_LABEL[s.expresses[0]]}]`), `${s.id}: the label beside the class`)
        if (s.reviewOnly) assert.ok(s.marker.endsWith('(review only: dropped from a coach copy)'), s.id)
    }
    // The Essential Scoring sentence's marker reflects the scoring event (mirrored scoring is its own sentence).
    assert.equal(sentences().find((s) => s.id === 'ov-scoring')?.sixClass, 3)
    assert.ok(!sentences().find((s) => s.id === 'ov-scoring')?.expresses.includes('scoring.mirrored'))
    // "Status of this example" lists exactly the values not in class 1.
    const status = REPORT_TEXT.split('Status of this example')[1].split('\n\n')[0]
    for (const c of BASE.activity.choices) assert.equal(status.includes(`\n  ${c.path}: `), c.sixClass !== 1, c.path)
}

/**
 * The change log against the record (the stage 6 review, C2-06): an entry for a value starts its 'after' with the value as assembled and
 * names the value's class; an entry for an open decision names a decision that exists, and 'answered by X' is that decision's answering
 * ruling; any other path is one of the pinned non-value entries; a retired path is no longer a value; every section cited is one of the
 * reply's thirteen numbered sections (pinned: Christian's reply of 6 November numbers its sections 1 to 13).
 */
const CHANGE_LOG_OTHER_PATHS = ['restart.endLine.illustrativeValue', 'restart.endLine.status', 'LAW-16, LAW-17', 'contract item GF2-16.a', 'new open decisions']
const changeLogViolations = (r: AssemblyRun): string[] => {
    const out: string[] = []
    for (const e of r.experiment.changeLog) {
        const c = r.activity.choices.find((y) => y.path === e.path)
        const d = r.experiment.openDecisions.find((y) => y.id === e.path)
        if (c) {
            const shown = c.howReached === 'READ_BY_CODE' ? c.rendered : c.value === null ? 'no value' : String(c.value)
            if (!e.after.startsWith(shown) && !e.after.startsWith('scope set') && !e.after.startsWith('status set')) out.push(`${e.path}: after does not start with the value (${shown})`)
            const cls = /class (\d)\)?[^a-z]*$/.exec(e.after) ?? /class (\d)/.exec(e.after)
            if (!cls || Number(cls[1]) !== c.sixClass) out.push(`${e.path}: after names class ${cls ? cls[1] : 'none'}, the value is class ${c.sixClass}`)
        } else if (d) {
            const answered = /^answered by ([A-Z0-9-]+)/.exec(e.after)
            if (answered && d.answeredBy?.rulingRef !== answered[1]) out.push(`${e.path}: answered by ${answered[1]}, the record says ${d.answeredBy?.rulingRef ?? 'not answered'}`)
            if (!answered && d.answeredBy) out.push(`${e.path}: answered in the record, not in the change log`)
        } else if (!CHANGE_LOG_OTHER_PATHS.includes(e.path)) out.push(`${e.path}: neither a value, an open decision nor a pinned entry`)
        if (e.after.startsWith('retired') && c) out.push(`${e.path}: retired, but still a value`)
        if (sectionsOf(e.replySections).some((n) => n < 1 || n > 13)) out.push(`${e.path}: ${e.replySections} is not a section of the reply`)
    }
    return out
}
function testChangeLogMatchesRecord(): void {
    assert.deepEqual(changeLogViolations(BASE), [])
    assert.equal(BASE.experiment.changeLog.length, 32)
    for (const id of ['AOD-PROP-134-MEANING', 'AOD-VERIFY-SEP13', 'AOD-RESTART-AT-A-ZONE', 'scoring.startingCondition', 'gameProblems.primary', 'gameProblems.secondary', 'gameProblems.candidate', 'interactionRegulations', 'adjustments']) assert.ok(BASE.experiment.changeLog.some((e) => e.path === id), `${id}: logged`)
    // Bites: a stale after (the retired value), a mistyped path, a section the reply does not have, a wrong answering ruling.
    const bite = (change: (x: Raw) => void, expected: RegExp) => {
        const x = rawX()
        change(x)
        assert.ok(changeLogViolations(run(committedKnowledge(), x)).some((v) => expected.test(v)), expected.source)
    }
    bite((x) => (x.changeLog.find((e: Raw) => e.path === 'restart.endLine.method').after = 'DEFENDING_TEAM_FROM_ITS_END_LINE (ILLUSTRATIVE; class 5)'), /restart\.endLine\.method: after does not start with the value/)
    bite((x) => (x.changeLog.find((e: Raw) => e.path === 'restart.endLine.method').path = 'restart.endLine.methd'), /restart\.endLine\.methd: neither a value/)
    bite((x) => (x.changeLog[0].replySections = 'section 14'), /section 14 is not a section of the reply/)
    bite((x) => (x.changeLog.find((e: Raw) => e.path === 'AOD-T3-END-LINE').after = 'answered by ASM-06NOV-KICKOFF'), /AOD-T3-END-LINE: answered by ASM-06NOV-KICKOFF/)
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
    plant((x) => (ch(x, 'teams.count').decidedBy[0].valueEvidence = 'Three opposing teams'), 'valueEvidence not in Christian\'s words')
    plant((x) => (ch(x, 'players.perTeam').declaredStatus = 'APPROVED'), 'declared status stronger than decisive (and an illustrative value declared APPROVED)')
    plant((x) => (ch(x, 'endZones.positioning').decidedBy = [{ rulingRef: 'ASM-28OCT-PROVISIONAL', standing: 'RULING', valueEvidence: 'Scoring target: Controlled arrival in an appropriately positioned advanced end zone.' }]), 'an UNRESOLVED value decided by a ruling')
    plant((x) => (ch(x, 'gameProblems.candidate').decidedBy = [{ rulingRef: 'ASM-AUTH-GAIN-ACCESS', standing: 'RULING', valueEvidence: 'Gain Access remains a candidate relationship, not an approved addition.' }]), 'a CANDIDATE value decided by a ruling that only sets its status')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].rulingRef = 'ASM-NOT-FILED'), 'a ruling reference not in the registry')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').file = 'C:/Users/x/AppData/Local/Temp/scratchpad/reply.txt'), 'a scratchpad path')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-REV1-KICKOFF').scopeWords = ['not Christian\'s words']), 'scope words not in Christian\'s words')
    plant((x) => x.rulings.push({ ...x.rulings[0] }), 'a ruling filed twice')
    plant((x) => (ch(x, 'purpose').value = 'Typed purpose'), 'a value read by code given an entered value')
    // Provenance roles (Christian's words never decide a value they do not state).
    plant((x) => (ch(x, 'players.perTeam').decidedBy = [{ rulingRef: 'ASM-AUTH-ILLUSTRATIVE', standing: 'RULING', valueEvidence: 'an illustrative value may be used for this offline prototype if clearly labeled' }]), 'an illustrative value decided by Christian\'s permission')
    plant((x) => delete ch(x, 'players.perTeam').permittedBy, 'an illustrative value without the words that permit it')
    plant((x) => (ch(x, 'scoring.mirrored').decidedBy = [{ rulingRef: 'ASM-28OCT-PROVISIONAL', standing: 'RULING', valueEvidence: 'Opposition: Reciprocal, meaningful objectives with continuous live opposition.' }]), 'our inference decided by a ruling of Christian\'s')
    plant((x) => delete ch(x, 'scoring.mirrored').readingOf, 'our inference without the words it reads')
    plant((x) => (ch(x, 'players.perTeam').permittedBy[0].quote = 'an illustrative value may be used everywhere'), 'a permission quote not in Christian\'s words')
    plant((x) => (ch(x, 'players.perTeam').permittedBy[0].namesValue = true), 'namesValue on a permission that does not contain the value')
    plant((x) => (ch(x, 'teams.count').readingOf = [{ rulingRef: 'ASM-9OCT-TEAMS', quote: 'Two opposing teams' }]), 'readingOf on a value Christian\'s words state')
    plant((x) => (ch(x, 'teams.count').scopeSetBy = [{ rulingRef: 'ASM-9OCT-TEAMS', quote: 'Two opposing teams' }]), 'scopeSetBy on an entered value')
    plant((x) => (ch(x, 'players.perTeam').decidedBy = [{ ref: 'ILLUSTRATIVE', standing: 'OURS' }]), 'a bare ref with another standing')
    plant((x) => (ch(x, 'teams.count').decidedBy[0].standing = 'APPROVED'), 'APPROVED on a ruling that made nothing canonical')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').kind = 'QUESTION'), 'Christian\'s question deciding a value')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').kind = 'Ruling'), 'an unknown kind')
    plant((x) => (x.requiredParts[0].part = 'Learning purpose and Game Problems.'), 'a required part not in Christian\'s words')
    plant((x) => (x.reportRefs.acceptance.quote = 'Can Challenge Point construct an activity?'), 'a report quote not in Christian\'s words')
    plant((x) => (x.suitability.addNothing.quote = 'suitability remains unverified everywhere'), 'the add-nothing quote not in Christian\'s words')
    // A number Christian's words state is bound to the word Christian's evidence uses (C2-02, C4-01): changed alone, re-worded, or unbound, it throws.
    plant((x) => (ch(x, 'teams.count').value = 3), 'teams.count = 3 against "Two"')
    plant((x) => Object.assign(ch(x, 'teams.count'), { value: 3, evidenceStates: 'Three' }), 'evidenceStates not in the evidence')
    plant((x) => delete ch(x, 'teams.count').evidenceStates, 'a number evidenced in Christian\'s words without evidenceStates')
    plant((x) => (ch(x, 'players.perTeam').evidenceStates = 'Six'), 'evidenceStates on an illustrative value')
    assert.deepEqual([statedNumber('Two'), statedNumber('two'), statedNumber('9.15'), statedNumber('TWO'), statedNumber('twofold')], [2, 2, 9.15, null, null])
    // Unknown keys and wrong types at every nested level (C2-03): one planted defect each.
    plant((x) => (x.suitability.scale.extraKey = 1), 'suitability.scale.extraKey')
    plant((x) => (x.suitability.exposure[0].extraKey = 1), 'suitability.exposure[0].extraKey')
    plant((x) => (x.suitability.identityPoint.extraKey = 1), 'suitability.identityPoint.extraKey')
    plant((x) => (x.suitability.addNothing.extraKey = 1), 'suitability.addNothing.extraKey')
    plant((x) => (x.scenarios.circumstances[0].extraKey = 1), 'scenarios.circumstances[0].extraKey')
    plant((x) => (x.scenarios.requirementLink.extraKey = 1), 'scenarios.requirementLink.extraKey')
    plant((x) => (x.scenarios.widthCheck.extraKey = 1), 'scenarios.widthCheck.extraKey')
    plant((x) => (x.scenarios.insufficientWhen[0].extraKey = 1), 'scenarios.insufficientWhen[0].extraKey')
    plant((x) => (x.scenarios.items[0].expected.extraKey = 1), 'scenarios.items[0].expected.extraKey')
    plant((x) => (x.scenarios.items[0].expected.mismatchReported = 'no'), 'scenarios.items[0].expected not true or false')
    plant((x) => (x.reconciliation.extraKey = 1), 'reconciliation.extraKey')
    plant((x) => (x.reconciliation.reuse[0].extraKey = 1), 'reconciliation.reuse[0].extraKey')
    plant((x) => (x.reconciliation.assessmentItems[0].extraKey = 1), 'reconciliation.assessmentItems[0].extraKey')
    plant((x) => (x.dependencies[0].extraKey = 1), 'dependencies[0].extraKey')
    plant((x) => (x.contractDeclarationsReported[0].extraKey = 1), 'contractDeclarationsReported[0].extraKey')
    plant((x) => (x.requirementAccount[0].requirementRef.extraKey = 1), 'requirementAccount[0].requirementRef.extraKey')
    plant((x) => (x.rulings[0].decision = 42), 'rulings[0].decision = 42')
    plant((x) => (x.rulings.find((r: Raw) => r.scopeCovers).scopeCovers = 7), 'scopeCovers = 7')
    plant((x) => (x.laws[0].lawId = 42), 'laws[0].lawId = 42')
    plant((x) => (x.gameProblemScope.primaryGameProblemIds = 'GP-001'), 'gameProblemScope id list not a list')
    plant((x) => (x.secondGoalNeeds = [42]), 'secondGoalNeeds not strings')
    // A received date that does not exist is refused, not rolled over (C2-18).
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').received = '2026-02-30'), 'received 2026-02-30')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').received = '2026-11-31'), 'received 2026-11-31')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').received = '2026-1-09'), 'received 2026-1-09')
    // The values an entry's scope words are said of name values of the record, and need a scope (recheck S1).
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-28OCT-PROVISIONAL').scopePaths = ['rules.offsides']), 'scopePaths naming no value')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-9OCT-TEAMS').scopePaths = ['teams.count']), 'scopePaths without a scope')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-28OCT-PROVISIONAL').scopePaths = []), 'scopePaths empty')
    // Christian's six classes as the code prints them are Christian's words in the registry entry the report cites (recheck S10).
    plant((x) => (x.reportRefs.sixClasses.rulingRef = 'ASM-AUTH-PARTS'), 'the six classes cited to an entry that does not hold them')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-AUTH-CLASSES').words[3] = 'Candidate knowledge.'), 'one of Christian\'s classes reworded in the registry')
    plant((x) => delete x.reportRefs.sixClasses, 'the six classes not cited')
    // The wording's own levels (C2-03).
    const plantW = (change: (w: Raw) => void, label: string) => {
        const w = rawW()
        change(w)
        throwsWith(() => validateWording(w, BASE.experiment), label)
    }
    plantW((w) => (w.sections[0].extraKey = 1), 'wording sections[0].extraKey')
    plantW((w) => (w.keyedFor.extraKey = 1), 'wording keyedFor.extraKey')
    plantW((w) => (w.coachTerms.extraKey = 1), 'wording coachTerms.extraKey')
    plantW((w) => (w.sections[0].level = 'Coach Overveiw'), 'wording sections[0].level misspelt')
    // Christian's reply of 6 November: a sentence of ours quoting Christian within it (quotesWithin) holds only words of the ruling it cites.
    plantW((w) => (w.templates.find((t: Raw) => t.id === 'rs-r5-location').text = 'Our illustrative exclusion: leave it to the coach\'s judgment of "a convenient spot"?'), 'quotesWithin: a quoted span not in the ruling')
    plantW((w) => (w.templates.find((t: Raw) => t.id === 'rs-r5-location').quotesWithin.rulingRef = 'ASM-NOT-FILED'), 'quotesWithin: a ruling not in the registry')
    plantW((w) => delete w.templates.find((t: Raw) => t.id === 'rs-r5-location').quotesWithin, 'a quotation mark in a template that quotes nothing')
    // The change log, the answered decisions, the restart examination and our readings inside a premise (6 November).
    plant((x) => (x.changeLog[0].replySections = 'line 59'), 'changeLog: replySections not naming the reply\'s sections')
    plant((x) => (x.changeLog[0].replySections = 'N6 l.59-60'), 'changeLog: our scratch label instead of the reply\'s section')
    plant((x) => (x.changeLog[0].replySections = 'section 0'), 'changeLog: a section numbered 0')
    // The stage 6 review: an empty quoted span quotes nothing (C2-11); a list that is not a list names its field (C2-15).
    plantW((w) => (w.templates.find((t: Raw) => t.id === 'rs-r5-location').text = 'Our illustrative exclusion: leave it to the coach\'s judgment of "a suitable location" or ""?'), 'quotesWithin: an empty quoted span')
    assert.throws(() => validateExperiment(Object.assign(rawX(), { restartExamination: { ...rawX().restartExamination, rulingRefs: 'ASM-06NOV-RESTART' } })), /rulingRefs must be a list/)
    for (const key of ['notDrawn', 'elements']) {
        const w = rawW()
        w.diagram[key] = {}
        assert.throws(() => validateWording(w, BASE.experiment), /notDrawn and elements must be lists/, key)
    }
    // A ruling made provisional for one decision only (provisionalBy): it names another provisional ruling that decides the same value.
    const method = (x: Raw) => x.choices.find((c: Raw) => c.path === 'restart.endLine.method').decidedBy.find((d: Raw) => d.rulingRef === 'ASM-REV1-COACH-SERVED-BALL')
    plant((x) => (method(x).provisionalBy.rulingRef = 'ASM-23OCT-LAWS'), 'provisionalBy: a ruling that is not provisional')
    plant((x) => (method(x).provisionalBy.rulingRef = 'ASM-29OCT-PROVISIONAL'), 'provisionalBy: a provisional ruling that does not decide this value')
    plant((x) => (method(x).provisionalBy.extraKey = 1), 'provisionalBy: an unknown key')
    plant((x) => (x.choices.find((c: Raw) => c.path === 'restart.endLine.toWhom').decidedBy[0].provisionalBy = { rulingRef: 'ASM-06NOV-RESTART', why: 'x' }), 'provisionalBy on an item that is no ruling')
    // Two replies of one day are told apart (C1-01): each file of the day carries its own replyOfDay.
    plant((x) => delete x.rulings.find((r: Raw) => r.id === 'ASM-REV1-COACH-SERVED-BALL').replyOfDay, 'replyOfDay: one entry of a day without it')
    plant((x) => (x.rulings.find((r: Raw) => r.id === 'ASM-REV1-COACH-SERVED-BALL').replyOfDay = 'second reply'), 'replyOfDay: two files of one day with the same label')
    for (const r of BASE.experiment.rulings.filter((y) => y.received === '2026-11-05')) {
        assert.equal(r.replyOfDay, r.file.startsWith('sources/2026-11-05-a05-review/') ? 'first reply' : r.file.startsWith('sources/2026-11-05-assembly-authorization/') ? 'second reply' : 'UNKNOWN FILE', `${r.id}: which reply of 5 November`)
    }
    plant((x) => (x.changeLog[0].date = '2026-11-31'), 'changeLog: a date that does not exist')
    plant((x) => (x.changeLog[0].after = x.changeLog[0].before), 'changeLog: before equals after')
    plant((x) => (x.changeLog[0].extraKey = 1), 'changeLog: an unknown key')
    plant((x) => (x.changeLog = []), 'changeLog: empty')
    plant((x) => (x.openDecisions.find((d: Raw) => d.answeredBy).answeredBy.rulingRef = 'ASM-AUTH-PURPOSE'), 'answeredBy: a ruling not among the decision\'s rulings')
    plant((x) => (x.openDecisions.find((d: Raw) => d.answeredBy).answeredBy.extraKey = 1), 'answeredBy: an unknown key')
    plant((x) => x.openDecisions.push({ ...x.openDecisions[0] }), 'an open decision listed twice')
    plant((x) => x.restartExamination.rows[4].cells.pop(), 'restartExamination: a row one cell short')
    plant((x) => (x.restartExamination.rulingRefs = ['ASM-NOT-FILED']), 'restartExamination: a ruling not in the registry')
    plant((x) => (x.readingsInsidePremises.items[0].paths = ['rules.offsides']), 'readingsInsidePremises: a path that is no value')
    plant((x) => (x.readingsInsidePremises.items[0].reading = 'Christian\'s scope words cover the offside decision.'), 'readingsInsidePremises: a reading of ours not labelled OURS')
    // The committed record validates.
    validateExperiment(rawX())
    // Christian's provisional flag follows Christian's words (C3-20): an entry whose words call something provisional is filed provisional, unless pinned
    // here with the reason its words do not make the decision itself provisional.
    const NOT_PROVISIONAL_DESPITE_THE_WORD: Record<string, string> = {
        'ASM-AUTH-CLASSES': 'the word names Christian\'s third class ("Candidate or provisional knowledge."); the entry lists Christian\'s six classes and decides nothing provisionally',
    }
    for (const r of BASE.experiment.rulings) {
        const says = r.words.some((w) => /\bprovisional(ly)?\b/i.test(w))
        if (says && !NOT_PROVISIONAL_DESPITE_THE_WORD[r.id]) assert.equal(r.provisional, true, `${r.id}: Christian's words say provisional`)
    }
    assert.equal(BASE.experiment.rulings.find((r) => r.id === 'ASM-30OCT-EVE-EVENT')?.provisional, true)
    assert.equal(BASE.experiment.rulings.find((r) => r.id === 'ASM-30OCT-EVE-ELIGIBLE')?.provisional, false)
    // Christian's words are not all rulings (C1-22): only a RULING may decide; the kinds are counted in Part 7.
    assert.ok(BASE.experiment.choices.every((c) => c.decidedBy.every((d) => !d.rulingRef || BASE.experiment.rulings.find((r) => r.id === d.rulingRef)?.kind === 'RULING')))
    assert.ok(REPORT_TEXT.includes(`${BASE.experiment.rulings.length} entries of Christian's words, verbatim (`))
}

/**
 * Every value a decisive ruling or approved cell states: the value, and the words (or number) its stating evidence must contain. For a value
 * the code reads from a cell (`selects`), the cell states the value and Christian's ruling selects what the code reads: the stating words must be in
 * the cell's evidence, and the selecting words in a decisive ruling's (recheck M1 and S8).
 */
const EXPECTED_VALUE_EVIDENCE: Record<string, { value: ChoiceValue; term: string; states?: number; selects?: string }> = {
    purpose: { value: null, term: 'Improve attacking conditions while maintaining purposeful possession.', selects: "the Learning Goal's coach-facing definition" },
    'teams.count': { value: 2, term: 'Two opposing teams', states: 2 },
    'teams.equalOutfield': { value: 'EQUAL', term: 'equal outfield counts' },
    directions: { value: 'EACH_ATTACKS_ONE_DEFENDS_THE_OTHER_ALL_GAME', term: 'attacks one direction and defends the opposite' },
    'scoring.event': { value: 'target_zone_entered', term: 'Controlled arrival in an appropriately positioned advanced end zone' },
    'scoring.means': { value: null, term: 'A player dribbles into a marked zone, or receives and controls the ball inside it.', selects: 'Controlled arrival in an appropriately positioned advanced end zone' },
    'scoring.qualifyingCondition.sep13Text': { value: 'The qualifying condition should require purposeful advancement from the attack’s starting condition rather than possession alone—for example, reaching a more advanced representative area while maintaining attacking possession.', term: '—for example,' },
    'scoring.afterRegain': { value: 'COUNTS', term: 'should count' },
    'opposition.reciprocal': { value: 'RECIPROCAL', term: 'Reciprocal objectives' },
    'play.continuous': { value: 'CONTINUOUS_THROUGH_TURNOVERS', term: 'continuous play through turnovers' },
    'start.method': { value: 'ORDINARY_KICKOFF', term: 'ordinary kickoff' },
    // 6 November: the kick-off distance, the served end-line restart and its promptness, each stated in Christian's words.
    'start.kickoffDistanceM': { value: 9.15, term: '9.15 m requirement', states: 9.15 },
    'restart.endLine.method': { value: 'COACH_SERVES_NEW_BALL', term: 'coach-served restart' },
    'restart.endLine.timing': { value: 'PROMPTLY', term: 'promptly' },
    'restart.afterPoint.method': { value: 'KICKOFF', term: 'ordinary kickoff' },
    'rules.offside': { value: 'NONE', term: 'None for this initial small-sided realization' },
    'restart.touchline': { value: 'LAWS_THROW_IN', term: 'normal Laws of the Game should apply by default' },
    'rules.fouls': { value: 'LAWS_FREE_KICKS', term: 'fouls' },
    'rules.handling': { value: 'LAWS_HANDLING_UNCHANGED', term: 'normal Laws of the Game should apply by default' },
    'laws.default': { value: 'APPLY', term: 'normal Laws of the Game should apply by default' },
    'observation.categories': { value: 'CHRISTIANS_THREE_CATEGORIES', term: 'Against Organized Opposition, During Transition, and Uncertain' },
}
const decisiveStating = (d: { rulingRef?: string; knowledgeRef?: unknown; standing: Standing }) => (Boolean(d.rulingRef) || Boolean(d.knowledgeRef)) && (d.standing === 'RULING' || d.standing === 'APPROVED')
const valueEvidenceViolations = (choices: Array<Pick<Choice, 'path' | 'value' | 'decidedBy' | 'howReached'>>): string[] => {
    const out: string[] = []
    const stated = choices.filter((c) => c.decidedBy.some(decisiveStating)).map((c) => c.path)
    for (const p of stated) if (!EXPECTED_VALUE_EVIDENCE[p]) out.push(`${p}: a value stated by a decisive ruling or cell, with no pinned evidence`)
    for (const p of Object.keys(EXPECTED_VALUE_EVIDENCE)) if (!stated.includes(p)) out.push(`${p}: pinned, but no decisive ruling or cell states it`)
    for (const c of choices.filter((y) => EXPECTED_VALUE_EVIDENCE[y.path])) {
        const e = EXPECTED_VALUE_EVIDENCE[c.path]
        const stating = c.decidedBy.filter(decisiveStating)
        if (json(c.value) !== json(e.value)) out.push(`${c.path}: value ${json(c.value)}, but its evidence states ${e.states ?? json(e.value)}`)
        // A value read from a cell is stated by the cell, never by the ruling that selects it.
        const statingItems = e.selects ? stating.filter((d) => d.knowledgeRef) : stating
        if (!statingItems.some((d) => (d.valueEvidence ?? '').includes(e.term))) out.push(`${c.path}: no decisive evidence ${e.selects ? 'from the cell ' : ''}contains "${e.term}"`)
        if (e.selects && !stating.some((d) => d.rulingRef && (d.valueEvidence ?? '').includes(e.selects as string))) out.push(`${c.path}: no decisive ruling selects "${e.selects}"`)
        if (c.howReached === 'READ_BY_CODE' && stating.some((d) => d.rulingRef) && !e.selects) out.push(`${c.path}: read by code and decided by a ruling, with no pinned selecting words`)
    }
    return out
}

/** (n) Every decisive ruling's value evidence is verbatim in Christian's words; every decisive approved cell equals the cell; values agree. */
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
    // Each value a decisive ruling or approved cell states agrees with the words that state it (C2-02, C4-01; the lead's D2): the value
    // and the word its evidence must contain, pinned here independently of the record, for every such value. A value read by code has no
    // entered value (null); its evidence is still pinned.
    assert.deepEqual(valueEvidenceViolations(x.choices), [])
    // Bite: teams.count = 3, against "Two opposing teams", fails (the validator refuses it too: see (m)).
    const three = rawX()
    three.choices.find((c: Raw) => c.path === 'teams.count').value = 3
    assert.deepEqual(valueEvidenceViolations(three.choices), ['teams.count: value 3, but its evidence states 2'])
    // Bite: an evidence term that no longer states the value fails.
    const reworded = rawX()
    reworded.choices.find((c: Raw) => c.path === 'rules.offside').decidedBy.forEach((d: Raw) => (d.valueEvidence = 'Offside: as in the normal Laws.'))
    assert.ok(valueEvidenceViolations(reworded.choices).some((v) => v.startsWith('rules.offside: no decisive evidence contains')))
    // Bites (recheck S8): the ruling that selects the purpose's source re-pointed at other words of Christian's fails; so does the categories'
    // evidence put back to words that name no category.
    const selecting = rawX()
    selecting.choices.find((c: Raw) => c.path === 'purpose').decidedBy[0].valueEvidence = 'The system should not independently invent a learning purpose.'
    assert.deepEqual(valueEvidenceViolations(selecting.choices), ['purpose: no decisive ruling selects "the Learning Goal\'s coach-facing definition"'])
    const naming = rawX()
    naming.choices.find((c: Raw) => c.path === 'observation.categories').decidedBy[1].valueEvidence = 'could help evaluate what actually occurs in the review prototype'
    assert.deepEqual(valueEvidenceViolations(naming.choices), ['observation.categories: no decisive evidence contains "Against Organized Opposition, During Transition, and Uncertain"'])
    // A value the code reads from a cell: Christian's deciding words select what the code reads and the cell states the value; no Part 2 block or
    // rationale line of such a value says Christian's words state it (recheck M1).
    const rationaleOf = (p: string) => rationaleLines(REPORT_TEXT).find((l) => l.trim().startsWith(`${p}:`)) as string
    for (const c of x.choices.filter((y) => y.howReached === 'READ_BY_CODE')) {
        assert.ok(!part2Block(c.path).includes('(states the value'), `${c.path}: Part 2 says Christian's words state a value the code reads`)
        assert.ok(!rationaleOf(c.path).includes('(states the value'), `${c.path}: the rationale says Christian's words state a value the code reads`)
        if (c.decidedBy.some((d) => d.rulingRef)) assert.ok(part2Block(c.path).includes('(selects what the code reads; the cell states the value; ') && rationaleOf(c.path).includes('(selects what the code reads; the cell states the value; '), c.path)
    }
    assert.deepEqual(x.choices.filter((y) => y.howReached === 'READ_BY_CODE' && y.decidedBy.some((d) => d.rulingRef)).map((y) => y.path), ['purpose', 'scoring.means'])
    const someRuling = x.rulings.find((r) => r.id === 'ASM-21OCT-PURPOSE') as Experiment['rulings'][number]
    assert.match(decidingWords(someRuling, 'w', 'RULING', { path: 'purpose', howReached: 'READ_BY_CODE' }), /\(selects what the code reads; the cell states the value; general, no scope stated\)$/, 'bite: read by code')
    assert.match(decidingWords(someRuling, 'w', 'RULING', { path: 'purpose', howReached: 'ENTERED_EVIDENCED' }), /\(states the value; general, no scope stated\)$/, 'bite: entered')
    // Scope words said of one value only are not printed as the scope of the other values the entry decides (recheck S1).
    for (const p of ['scoring.event', 'scoring.means', 'opposition.reciprocal']) {
        assert.ok(!part2Block(p).includes('scope INITIAL_SMALL_SIDED_REALIZATION'), `${p}: printed with the offside decision's scope`)
        assert.ok(part2Block(p).includes('no scope stated for this decision (the entry\'s scope words, "for this initial small-sided realization", are said of rules.offside; OURS: the scope words cover the offside decision)'), p)
    }
    assert.ok(part2Block('rules.offside').includes('(states the value; scope INITIAL_SMALL_SIDED_REALIZATION: "for this initial small-sided realization"; OURS: the scope words cover the offside decision)'))
    // A value Christian's words do not state is decided by us: an illustrative value by our choice, with Christian's permission printed beside it; our
    // inference by our reading, with the words it reads printed beside it. No ruling of Christian's is among what decided either.
    for (const c of x.choices.filter((y) => y.howReached === 'ENTERED_ILLUSTRATIVE')) {
        assert.deepEqual(c.decidedBy, [{ ref: 'ILLUSTRATIVE', standing: 'ILLUSTRATIVE' }], c.path)
        // Christian's two permissions: the second reply of 5 November ("may be used") and the reply of 6 November ("may remain acceptable").
        assert.ok((c.permittedBy ?? []).length > 0 && (c.permittedBy ?? []).every((p) => /\bmay be used\b|\bmay remain acceptable\b/.test(p.quote)), `${c.path}: Christian's permission sits under permittedBy`)
    }
    for (const c of x.choices.filter((y) => y.howReached === 'ENTERED_OUR_INFERENCE')) {
        assert.deepEqual(c.decidedBy, [{ ref: 'OURS', standing: 'OURS' }], c.path)
        assert.ok((c.readingOf ?? []).length > 0, `${c.path}: the words our reading reads sit under readingOf`)
    }
    // And the report never says Christian's words state such a value, nor that a ruling of Christian's decided it.
    const illustrativeOrOurs = new Set(x.choices.filter((y) => y.howReached === 'ENTERED_ILLUSTRATIVE' || y.howReached === 'ENTERED_OUR_INFERENCE').map((y) => y.path))
    for (const l of rationaleLines(REPORT_TEXT)) {
        const p = l.trim().split(':')[0]
        if (!illustrativeOrOurs.has(p)) continue
        assert.ok(!l.includes('(states the value') && !l.includes('Decided by: ASM-'), `${p}: printed as decided or stated by Christian's words`)
    }
    for (const p of illustrativeOrOurs) assert.ok(!part2Block(p).includes('(states the value'), `${p}: Part 2 says Christian's words state it`)
    // And every value Christian's words do state says so where it is decided (the positive check that the phrase is in use).
    for (const c of x.choices.filter((y) => y.howReached === 'ENTERED_EVIDENCED')) assert.ok(part2Block(c.path).includes('(states the value'), c.path)
    // A value declared RULING whose every decisive ruling Christian called provisional is printed so (C3-19): never a bare "declared RULING".
    for (const c of BASE.activity.choices.filter((y) => y.allDecisiveRulingsProvisional)) assert.ok(part2Block(c.path).includes('declared RULING (Christian\'s provisional ruling: class 3)'), c.path)
    // Each provisional ruling that decides a value is printed in Christian's order of words: 'Christian's provisional ruling, received <date>: "<words>"'.
    for (const c of BASE.experiment.choices) {
        for (const d of c.decidedBy.filter((y) => y.rulingRef && BASE.experiment.rulings.find((r) => r.id === y.rulingRef)?.provisional)) {
            const r = BASE.experiment.rulings.find((y) => y.id === d.rulingRef) as Raw
            const role = c.howReached === 'READ_BY_CODE' ? 'selects what the code reads' : 'states the value'
            assert.ok(part2Block(c.path).includes(`Christian's provisional ruling, received ${Number(r.received.slice(8, 10))} `) && part2Block(c.path).includes(`: "${d.valueEvidence}" (${role}`), `${c.path} ${d.rulingRef}`)
        }
    }
    for (const c of BASE.activity.choices.filter((y) => y.declaredStatus === 'RULING' && !y.allDecisiveRulingsProvisional)) assert.ok(!part2Block(c.path).includes('(Christian\'s provisional ruling: class 3)'), c.path)
    assert.deepEqual(BASE.activity.choices.filter((y) => y.allDecisiveRulingsProvisional).map((y) => y.path), ['scoring.event', 'scoring.means', 'opposition.reciprocal', 'start.method', 'restart.afterPoint.method', 'rules.offside', 'restart.endLine.method', 'restart.endLine.timing', 'observation.categories'])
}

/** (o) What the code computes moves, or the assembly refuses, when the knowledge it reads changes. */
function testO_flipTests(): void {
    const k1 = committedKnowledge()
    k1.rulings.scopedTranslations[0].secondaryGameProblemIds = ['GP-005']
    throwsWith(() => run(k1), 'the Game Problems differ from the ones Christian\'s words name')
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
    const noFinding = run(k6).activity.choices.find((c) => c.path === 'gameProblems.secondaryFinding')
    assert.equal(noFinding?.rendered, 'none', 'no finding once the secondary no longer rates FOI more strongly')
    // A computed absence carries the class of the profile computation that found none, never class 6 (C2-20).
    assert.ok(noFinding?.computed && noFinding.sixClass < 6, `a computed absence is class ${noFinding?.sixClass}`)
    // The names of the Game Problems the resolution returns must be in Christian's scope words (C2-09): a renamed problem refuses.
    const k7 = committedKnowledge()
    ;(k7.gameProblems.gameProblems.find((r) => cell(r, 'ID') === 'GP-001') as Raw).Name = 'Gain Access'
    assert.throws(() => run(k7), /not named in Christian's scope words/, 'a renamed Game Problem is not attributed to Christian\'s scope words')
    // The scoring event's description must be the vocabulary row of that event (C2-11): another event's description refuses.
    const x8 = rawX()
    const means = x8.choices.find((c: Raw) => c.path === 'scoring.means')
    means.knowledgeRef.row = 'scoring_event line_crossed'
    means.decidedBy[0].knowledgeRef.row = 'scoring_event line_crossed'
    assert.throws(() => run(committedKnowledge(), x8), /not from the vocabulary row of the scoring event/, 'another event\'s description refuses')
    // A decisive cell's standing is read from its row (C2-12): a row no longer active refuses; a recorded standing above its source's refuses.
    const k9 = committedKnowledge()
    ;(k9.planning.learning_goals.find((r) => cell(r, 'ID') === 'A05') as Raw).Status = 'Retired'
    assert.throws(() => run(k9), /not an active row/, 'a retired planning row decides nothing')
    const k10 = committedKnowledge()
    ;(k10.stage2Rulings.sourceStandings as Raw).contexts.standing = 'CANDIDATE'
    assert.throws(() => run(k10), /stronger than its source's standing/, 'a recorded APPROVED cell from a CANDIDATE source refuses')
    // The number of target zones is read from the placement (C2-19): an unmapped placement refuses; the count moves the derived area.
    const x11 = rawX()
    x11.placementZoneCount = { ONE_AT_EACH_END_FULL_WIDTH: 1 }
    // The placement geometry (6 November, for the DRAFT diagram) must draw as many zones as the count says, so it moves with it.
    x11.placementGeometry.ONE_AT_EACH_END_FULL_WIDTH.zones = [{ along: 'FROM_START' }]
    assert.equal(run(committedKnowledge(), x11).activity.derived.find((d) => d.id === 'area.betweenTargetZonesM2')?.value, 87.5, 'one zone: (40 - 5) x 30 / 12')
    for (const along of ['FROM_START', 'FROM_END']) {
        x11.placementGeometry.ONE_AT_EACH_END_FULL_WIDTH.zones = [{ along }]
        const d = run(committedKnowledge(), x11).diagram
        const zone = d.shapes.find((s) => s.id === 'zone-1') as DiagramModel['shapes'][number]
        for (const p of d.texts.filter((y) => y.id.startsWith('placeholder'))) {
            const bx = { x: p.x - p.w / 2, w: p.w }
            assert.ok(bx.x >= d.outline.x && bx.x + bx.w <= d.outline.x + d.outline.w, `${along}: ${p.id} inside the outline`)
            assert.ok(bx.x + bx.w <= zone.x || bx.x >= zone.x + (zone.w as number), `${along}: ${p.id} clear of the zone`)
        }
        assert.ok(d.texts.filter((y) => y.id.startsWith('placeholder')).length <= 2, `${along}: the placeholder is not wrapped word by word`)
    }
    const x11b = rawX()
    x11b.placementZoneCount = { ONE_AT_EACH_END_FULL_WIDTH: 1 }
    throwsWith(() => validateExperiment(x11b), 'bite: a zone count the placement geometry does not draw')
    const x12 = rawX()
    x12.placementZoneCount = { SOME_OTHER_PLACEMENT: 2 }
    x12.placementGeometry = { SOME_OTHER_PLACEMENT: x12.placementGeometry.ONE_AT_EACH_END_FULL_WIDTH }
    assert.throws(() => run(committedKnowledge(), x12), /maps to no number of target zones/)
    assert.ok(BASE.activity.derived.find((d) => d.id === 'area.betweenTargetZonesM2')?.fromPaths.includes('endZones.placement'), 'the placement is among what the derived value rests on')
    // The Game Form line counts the compatible forms it names (C2-08): with two compatible forms it says two, and one alternative.
    const k13 = committedKnowledge()
    ;(k13.sportModule.game_forms.find((r) => cell(r, 'game_form_id') === 'GF7') as Raw).status = 'DRAFT'
    const twoForms = run(k13)
    assert.deepEqual(twoForms.forms.compatible, ['GF2', 'GF3'])
    assert.match(twoForms.design.find((d) => d.expresses.includes('gameForm.illustrativeChoice'))?.text ?? '', /is a compatible alternative, with no ranking among the 2 compatible forms\./)
    // The scoring-event membership reads its sources' governed standings, as Stage 1/2 do (C2-22): the committed sources give APPROVED;
    // a contexts source downgraded to CANDIDATE moves the relationship item's standing and the conclusion's class.
    const membership = BASE.activity.computed.find((c) => c.id === 'scoring-event membership')
    assert.deepEqual(membership?.trace.influencedBy.map((i) => i.standing), ['APPROVED', 'APPROVED'])
    const k14 = committedKnowledge()
    ;(k14.stage2Rulings.sourceStandings as Raw).contexts.standing = 'CANDIDATE'
    const events = activeContextRelationships(k14, BASE.activity.rpcId, 'SCORING_EVENT')
    const routing = (BASE.resolution.context as NonNullable<typeof BASE.resolution.context>).routing
    const moved = scoringEventMembership(k14, BASE.activity.rpcId, routing, events.find((r) => r.relatedId === 'target_zone_entered') as (typeof events)[number], events)
    assert.deepEqual(moved.trace.influencedBy.map((i) => i.standing), ['APPROVED', 'CANDIDATE'])
    assert.equal(sixClassOf(moved.trace.influencedBy.map((i) => ({ standing: i.standing }))), 3)
    assert.ok(REPORT_TEXT.includes('scoring-event membership (established by APPROVED KNOWLEDGE; weakest decisive standing APPROVED, class 1: Approved canonical knowledge)'))
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
    // A projection is proved only by a consumer: every authored string of 25 characters or more anywhere in the record, the wording's
    // notes included, is printed in the report, except a pinned list (template texts with placeholders are printed filled in).
    const leaves: Array<[string, string]> = []
    const walk = (v: unknown, at: string) => {
        if (typeof v === 'string') leaves.push([at, v])
        else if (Array.isArray(v)) v.forEach((y, i) => walk(y, `${at}[${i}]`))
        else if (v && typeof v === 'object') for (const [key, y] of Object.entries(v)) walk(y, `${at}.${key}`)
    }
    walk(rawX(), 'x')
    const w = rawW()
    walk({ standing: w.standing, keyedFor: w.keyedFor, coachTerms: w.coachTerms }, 'w')
    const PINNED_UNPRINTED: Array<[RegExp, string]> = [
        [/^x\.whyThisDesign\[\d+\]\.text$/, 'printed with its placeholders filled in (Part 1, WHY THIS DESIGN)'],
        [/^x\.choices\[\d+\]\.path$|^x\.bindings\.|^x\.designBlockPaths|^x\.requiredParts\[\d+\]\.paths|^x\.gameForm\.choicePath$/, 'configuration paths, printed wherever their values are'],
        [/^x\.derived\[\d+\]\.formula$|^x\.openDecisions\[\d+\]\.blocks$/, 'enumerations: a formula is printed as its label, a blocking class as the heading its decisions are listed under'],
    ]
    const unprinted = leaves.filter(([at, s]) => s.length >= 25 && !REPORT_TEXT.includes(s) && !PINNED_UNPRINTED.some(([re]) => re.test(at)))
    assert.deepEqual(unprinted.map(([at]) => at), [], 'every authored string is printed in the report')
    // The wording's own notes and both coach terms are printed (C2-25): the coach terms have a consumer in the report and in test (g).
    for (const s of [w.keyedFor.note, w.coachTerms.source, `"${w.coachTerms.targetZone}"`, `"${w.coachTerms.markedLine}"`]) assert.ok(REPORT_TEXT.includes(s), s)
    // The governing scope shown is Christian's 5 November scope, never the filed Stage 1 label in the coach text.
    assert.ok(BASE.design.find((d) => d.expresses.includes('gameProblems.primary'))?.text.includes('within the scoped circumstance of progressing against organized opposition'))
    for (const s of sentences()) assert.ok(!s.text.includes('STAGE1_DEVELOPMENT_DEMONSTRATION'), s.id)
    // Christian's nine parts are printed, each with the values that carry it (C3-06).
    for (const p of BASE.experiment.requiredParts) assert.ok(REPORT_TEXT.includes(`  ${p.id} "${p.part}" -> `), p.id)
}

/** (q) The Stage 2 grouping fails closed on the two new standings; the rank keeps Stage 2's order with the new standings last. */
function testQ_stage2GroupingFailsClosed(): void {
    assert.deepEqual([...STANDING_ORDER], ['APPROVED', 'RULING', 'PROVISIONAL', 'CANDIDATE', 'OURS', 'REFERENCE ONLY', 'TEST ASSUMPTION', 'TEST INPUT', 'ILLUSTRATIVE', 'UNRESOLVED'])
    assert.deepEqual([...STANDING_ORDER].sort(), [...STANDINGS].sort(), 'every standing is ranked')
    for (const s of ['ILLUSTRATIVE', 'UNRESOLVED'] as Standing[]) {
        throwsWith(() => conclusionGroup({ id: 'x', step: 'x', statement: 'x', establishedBy: 'RULING', testOnly: false, trace: { influencedBy: [{ ref: 'r', standing: 'APPROVED', role: 'x' }, { ref: 'i', standing: s, role: 'x' }], consulted: [], citedOnly: [] } }), s)
    }
    throwsWith(() => weakestStanding({ influencedBy: [{ ref: 'r', standing: 'ILUSTRATIVE' as Standing, role: 'x' }], consulted: [], citedOnly: [] }), 'a typo ranks nowhere')
    // Only the illustrative form is assembled; the other compatible forms are read with its team sizes applied hypothetically, and never
    // called assembled (C1-02, C2-05). None carries the Stage 2 'held' wording.
    const illustrative = String(choiceOf(BASE.experiment, 'gameForm.illustrativeChoice').value)
    for (const e of BASE.suitability.structural) {
        const text = json(e)
        assert.ok(!text.includes('Step 3 is held') && !text.includes('no activity is assembled'), e.gameFormId)
        const role = e.gameFormId === illustrative ? 'the assembled activity\'s team sizes' : 'the illustrative team sizes, applied hypothetically (this form is not assembled)'
        assert.ok(e.preconditions.every((p) => p.trace.influencedBy.some((i) => i.standing === 'ILLUSTRATIVE' && i.role === role)), e.gameFormId)
        assert.equal(e.activity?.assembled === true, e.gameFormId === illustrative, e.gameFormId)
        if (e.gameFormId !== illustrative) {
            for (const detail of [e.continuousPlay.detail, ...e.integrity.conditions.map((c) => c.detail), ...e.preconditions.map((p) => p.detail)]) assert.ok(!/assembled/i.test(detail.split(/not assembled/i).join('')), `${e.gameFormId}: ${detail}`)
        }
    }
    const part3 = REPORT_TEXT.split('=== PART 3.')[1].split('=== PART 4.')[0]
    for (const l of part3.split('\n').filter((y) => /^ {4}GF\d/.test(y) && !y.startsWith(`    ${illustrative} `))) assert.ok(!/assembled/i.test(l.split(/not assembled/i).join('')), l)
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

/**
 * The expected outcome of each scenario, from Christian's sentences (not from the data's own expectations):
 *   E1 "Organized opposition meaningfully restricts usable attacking space.": Christian's scoped circumstance holds (established); useful space is
 *      not already available, so no mismatch; nothing about information is said, so information sufficiency is unknown (uncertainty).
 *   E2 "Sufficient usable space already exists, ...": useful space is available, so the recorded requirement reports a possible mismatch
 *      (primary unchanged); whether the opposition is organized is not said, so Christian's scope is not established, and information is unknown.
 *   E3 "Information about defensive organization and available opportunities is insufficient.": information is insufficient and both other
 *      circumstances are unknown (uncertainty; scope not established; no mismatch).
 * Christian's words for all three: "report uncertainty where the relevant circumstances are unknown" and never switch the primary.
 */
const SCENARIO_EXPECTATIONS: Array<[string, { mismatch: boolean; uncertainty: boolean; scope: boolean; unknown: string[] }]> = [
    ['E1', { mismatch: false, uncertainty: true, scope: true, unknown: ['informationSufficient'] }],
    ['E2', { mismatch: true, uncertainty: true, scope: false, unknown: ['organizedOppositionRestrictsUsableSpace', 'informationSufficient'] }],
    ['E3', { mismatch: false, uncertainty: true, scope: false, unknown: ['organizedOppositionRestrictsUsableSpace', 'usefulSpaceAlreadyAvailable'] }],
]

/** (s) The Game Problems never change; outcomes equal the expectations from Christian's sentences; every unknown is reported; no widening. */
function testS_scenarios(): void {
    assert.equal(BASE.scenarios.length, 3)
    for (const r of BASE.scenarios) {
        assert.deepEqual([r.gameProblems.primary, r.gameProblems.secondary, r.gameProblems.unchanged], [['GP-001'], ['GP-002'], true], r.id)
        assert.deepEqual({ mismatchReported: r.mismatch.reported, uncertaintyReported: r.uncertainty.reported, scopeEstablished: r.scope.established }, r.expected, r.id)
        assert.deepEqual([r.width.outcome, r.width.basis, r.width.proposalStatus], ['INSUFFICIENT_EVIDENCE', 'CIRCUMSTANCES_NOT_SUPPLIED', 'NONE_INSUFFICIENT_EVIDENCE'], r.id)
        // Every circumstance not supplied is reported as unknown.
        for (const key of r.unknown) assert.ok(r.uncertainty.because.includes(`${key}: NOT_SUPPLIED`), `${r.id}: ${key} unknown but not reported`)
    }
    assert.deepEqual(
        BASE.scenarios.map((r) => [r.id, { mismatch: r.mismatch.reported, uncertainty: r.uncertainty.reported, scope: r.scope.established, unknown: r.unknown }]),
        SCENARIO_EXPECTATIONS
    )
    // The width check reads the assembled values, not a typed copy (C2-07, C4-03).
    assert.ok(BASE.scenarios.every((r) => r.width.configuredArea.lengthM === choiceOf(BASE.experiment, 'area.lengthM').value && r.width.configuredArea.widthM === choiceOf(BASE.experiment, 'area.widthM').value && r.width.configuredArea.standing === 'ILLUSTRATIVE'))
    const xw = rawX()
    xw.choices.find((c: Raw) => c.path === 'area.widthM').value = 35
    const wide = run(committedKnowledge(), xw)
    assert.ok(wide.scenarios.every((r) => r.width.configuredArea.widthM === 35 && r.width.proposalStatement.includes('35 m')), 'a changed width reaches the width check')
    // Bites (C3-17): the scenario logic is read, not copied.
    const x1 = rawX()
    x1.scenarios.requirementLink.engagesWhen = false
    assert.deepEqual(run(committedKnowledge(), x1).scenarios.map((r) => r.mismatch.reported), [true, false, false], 'flipping engagesWhen moves the mismatch to E1')
    const x2 = rawX()
    x2.scenarios.items[0].configuredActivity.usefulSpaceAlreadyAvailable.value = 'NOT_SUPPLIED'
    const e1Unknown = run(committedKnowledge(), x2).scenarios[0]
    assert.ok(e1Unknown.uncertainty.reported && e1Unknown.uncertainty.because.includes('usefulSpaceAlreadyAvailable: NOT_SUPPLIED'), 'E1 with its inferred field not supplied reports it')
    const x3 = rawX()
    x3.scenarios.items[0].configuredActivity.informationSufficient.value = true
    assert.equal(run(committedKnowledge(), x3).scenarios[0].uncertainty.reported, false, 'E1 with every circumstance supplied reports no uncertainty')
    const x4 = rawX()
    x4.scenarios.items[0].configuredActivity.organizedOppositionRestrictsUsableSpace.value = false
    const e1NoScope = run(committedKnowledge(), x4).scenarios[0]
    assert.ok(!e1NoScope.scope.established && e1NoScope.uncertainty.because.some((b) => b.startsWith('organizedOppositionRestrictsUsableSpace: false')) && e1NoScope.gameProblems.primary[0] === 'GP-001', 'a false scope circumstance is reported; the primary does not switch')
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
    // 6 November (DESIGN-6-v2 A3): the goal kick and the corner kick at a goal-less end line print both readings: NOT APPLICABLE as our DRAFT
    // Sport Profile encoding gives it, and, on our reading of the award by last touch, a departure in method and location that Christian's
    // reply authorizes provisionally for this offline prototype; so each is DEPARTED, beside no offside. No adaptation is left owed.
    assert.deepEqual(BASE.experiment.laws.filter((l) => l.status === 'ADAPTATION OWED').map((l) => l.lawId), [])
    assert.deepEqual(BASE.experiment.laws.filter((l) => l.status === 'DEPARTED').map((l) => l.lawId), ['LAW-11', 'LAW-16', 'LAW-17'])
    for (const id of ['LAW-16', 'LAW-17']) {
        const l = BASE.experiment.laws.find((y) => y.lawId === id) as Experiment['laws'][number]
        // The stage 6 review (C4-16): our reading first, then what our DRAFT encoding would say, so the status is never followed by another.
        assert.ok(l.reason.startsWith('On our reading (27 October, OURS) the Laws\' award by last touch still applies') && l.reason.includes('authorized provisionally for this offline prototype by Christian\'s reply of 6 November, section 6') && l.reason.includes('Under our DRAFT Sport Profile encoding the law would be NOT APPLICABLE (no goal stands).'), id)
        assert.ok(!l.reason.includes('assume a goal'), `${id}: the award by last touch needs no goal`)
    }
    assert.ok((BASE.experiment.laws.find((l) => l.lawId === 'LAW-16') as Experiment['laws'][number]).reason.includes('Open representation question (OURS; recorded here; no answer is asked now)'))
    assert.ok((BASE.experiment.laws.find((l) => l.lawId === 'LAW-8') as Experiment['laws'][number]).reason.includes('Note: the Sport Profile marks the centre mark UNREPRESENTED'))
    assert.equal(BASE.experiment.laws.find((l) => l.lawId === 'LAW-11')?.status, 'DEPARTED')
    // Each law's status, and the values its entry rests on, pinned here (C3-14).
    assert.deepEqual(lawViolations(BASE.experiment), [])
    const flat = rawX()
    for (const l of flat.laws) if (l.lawId !== 'LAW-11' && l.status !== 'ADAPTATION OWED') Object.assign(l, { status: 'NOT APPLICABLE', paths: [] })
    assert.ok(lawViolations(validateExperiment(flat)).length >= 4, 'bite: the kick-off, free kicks and throw-ins marked not applicable, with no values')
    const offside = rawX()
    offside.choices.find((c: Raw) => c.path === 'rules.offside').value = 'OFFSIDE_APPLIES'
    assert.ok(lawViolations(validateExperiment(offside)).includes('LAW-11: rules.offside is "OFFSIDE_APPLIES", not "NONE"'), 'bite: a departure the value no longer makes')
}

/** Each law's status in this activity, and the value each status needs, pinned here independently of the record. */
const EXPECTED_LAW_STATUS: Record<string, { status: string; needs: Record<string, ChoiceValue> }> = {
    'LAW-8': { status: 'APPLIES', needs: { 'start.method': 'ORDINARY_KICKOFF', 'start.kickoffDetails': 'LAWS_KICKOFF_UNCHANGED', 'restart.afterPoint.method': 'KICKOFF', 'area.centreMark': 'MARKED', 'area.halfwayLine': 'MARKED' } },
    'LAW-8-DB': { status: 'APPLIES', needs: { 'laws.default': 'APPLY' } },
    'LAW-11': { status: 'DEPARTED', needs: { 'rules.offside': 'NONE' } },
    'LAW-12-GK': { status: 'NOT APPLICABLE', needs: { 'players.goalkeepers': 0 } },
    'LAW-13': { status: 'APPLIES', needs: { 'rules.fouls': 'LAWS_FREE_KICKS' } },
    'LAW-14': { status: 'NOT APPLICABLE', needs: { 'laws.goalEnd': 'REPLACED_BY_THE_END_LINE_RESTART' } },
    'LAW-15': { status: 'APPLIES', needs: { 'restart.touchline': 'LAWS_THROW_IN' } },
    'LAW-16': { status: 'DEPARTED', needs: { 'laws.goalEnd': 'REPLACED_BY_THE_END_LINE_RESTART', 'restart.endLine.method': 'COACH_SERVES_NEW_BALL', 'restart.endLine.toWhom': 'TEAM_THAT_DID_NOT_TOUCH_IT_LAST', 'restart.endLine.location': 'IN_THE_HALF_WHERE_IT_WENT_OUT_OUTSIDE_BOTH_TARGET_ZONES_NOT_ACROSS_EITHER_COACH_CHOOSES_PLAYER' } },
    'LAW-17': { status: 'DEPARTED', needs: { 'laws.goalEnd': 'REPLACED_BY_THE_END_LINE_RESTART', 'restart.endLine.method': 'COACH_SERVES_NEW_BALL', 'restart.endLine.toWhom': 'TEAM_THAT_DID_NOT_TOUCH_IT_LAST', 'restart.endLine.location': 'IN_THE_HALF_WHERE_IT_WENT_OUT_OUTSIDE_BOTH_TARGET_ZONES_NOT_ACROSS_EITHER_COACH_CHOOSES_PLAYER' } },
    'LAW-4-GK': { status: 'NOT APPLICABLE', needs: { 'players.goalkeepers': 0 } },
}
const lawViolations = (x: Experiment): string[] => {
    const out: string[] = []
    for (const l of x.laws.filter((y) => y.lawId)) {
        const e = EXPECTED_LAW_STATUS[l.lawId as string]
        if (!e) {
            out.push(`${l.lawId}: no pinned status`)
            continue
        }
        if (l.status !== e.status) out.push(`${l.lawId}: ${l.status}, expected ${e.status}`)
        if ((l.status === 'APPLIES' || l.status === 'DEPARTED' || l.status === 'ADAPTATION OWED') && !l.paths.length) out.push(`${l.lawId}: ${l.status} with no values`)
        for (const [p, v] of Object.entries(e.needs)) {
            if (!l.paths.includes(p)) out.push(`${l.lawId}: does not rest on ${p}`)
            if (json(choiceOf(x, p).value) !== json(v)) out.push(`${l.lawId}: ${p} is ${json(choiceOf(x, p).value)}, not ${json(v)}`)
        }
    }
    for (const id of Object.keys(EXPECTED_LAW_STATUS)) if (!x.laws.some((l) => l.lawId === id)) out.push(`${id}: pinned, but no entry`)
    return out
}

/** The requirement account (Christian's 29 October ruling; C3-05, C2-10): categories pinned per line; nothing unsupported or observed counts. */
function testAccount_requirementAccount(): void {
    const x = BASE.experiment
    const [c1, c2, c3, c4] = x.accountCategories
    const outside = x.accountOutsideCategories
    const EXPECTED: Record<string, string> = {
        'RA-ID-011': c3, 'RA-ID-012': c3, 'RA-ID-013': c1, 'RA-ID-014': c3, 'RA-ID-015': c3,
        'RA-PROP-134-A1-EXAMPLE': c1, 'RA-PROP-134-A2-EXAMPLE': c3, 'RA-PROP-134-B-EXAMPLE': c4, 'RA-PROP-134-C-EXAMPLE': outside,
        'RA-PROP-134-A1-COLON': c1, 'RA-PROP-134-A2-COLON': c3, 'RA-PROP-134-B-COLON': c4, 'RA-PROP-134-C-COLON': c1, 'RA-PROP-134-D-COLON': c4,
    }
    assert.deepEqual(Object.fromEntries(BASE.account.lines.map((l) => [l.id, l.category])), EXPECTED)
    for (const l of BASE.account.lines) {
        assert.equal(l.satisfied, l.category === c1 || l.category === c2, `${l.id}: only categories 1 and 2 count`)
        // A line resting on an UNRESOLVED value is category 4 and never satisfied (Christian's words: "preserve the unresolved status").
        if (l.paths.some((p) => choiceOf(x, p).howReached === 'UNRESOLVED')) assert.ok(l.category === c4 && !l.satisfied, l.id)
    }
    assert.deepEqual(BASE.account.counts.byReading, {
        FOR_EXAMPLE: { [c1]: 2, [c2]: 0, [c3]: 5, [c4]: 1, [outside]: 1 },
        COLON: { [c1]: 3, [c2]: 0, [c3]: 5, [c4]: 2, [outside]: 0 },
    })
    // Bite: the starting-condition clause re-filed as category 2 still falls to category 4 (its value is UNRESOLVED).
    const xb = rawX()
    xb.requirementAccount.find((a: Raw) => a.id === 'RA-PROP-134-B-EXAMPLE').category = c2
    const refiled = run(committedKnowledge(), xb).account.lines.find((l) => l.id === 'RA-PROP-134-B-EXAMPLE')
    assert.ok(refiled?.category === c4 && !refiled.satisfied && refiled.downgraded, 'an UNRESOLVED clause re-filed as category 2 is downgraded')
    // Bite: a retired requirement is listed as excluded and never counted.
    const k = committedKnowledge()
    ;(k.contexts.identity_rules.find((r) => cell(r, 'identity_rule_id') === 'RPC-ID-013') as Raw).status = 'RETIRED'
    const retired = run(k).account
    assert.ok(retired.lines.find((l) => l.id === 'RA-ID-013')?.excluded && !retired.lines.find((l) => l.id === 'RA-ID-013')?.satisfied)
    assert.deepEqual(retired.counts.excluded, ['RA-ID-013'])
    assert.equal(retired.counts.byReading.FOR_EXAMPLE[c1], 1, 'the retired line no longer counts')
}

/** The wording's reuse is measured, not asserted (C3-16): goal- and context-scoped templates are tagged; a second goal rewrites them. */
function testWordingScope(): void {
    const GOAL_OR_CONTEXT_PATHS = ['observation.categories', 'endZones.positioning', 'scoring.startingCondition']
    const untagged = (w: Wording) => w.templates.filter((t) => !t.scope && t.expresses.some((p) => GOAL_OR_CONTEXT_PATHS.includes(p))).map((t) => t.id)
    assert.deepEqual(untagged(BASE.wording), [])
    assert.ok(BASE.wording.templates.filter((t) => t.quote).every((t) => t.scope === 'GOAL'), 'Christian\'s goal-specific quoted categories are goal-scoped')
    const w = rawW()
    delete w.templates.find((t: Raw) => t.id === 'ob-intro').scope
    assert.deepEqual(untagged(validateWording(w, BASE.experiment)), ['ob-intro'], 'bite')
    // Part 7 counts the locked and the scoped templates from the wording itself.
    const locked = BASE.wording.templates.filter((t) => Object.keys(t.whenValue ?? {}).length).length
    const scoped = BASE.wording.templates.filter((t) => t.scope).length
    assert.ok(REPORT_TEXT.includes(`Wording reuse, counted: ${BASE.wording.templates.length} DRAFT templates; ${locked} are locked by whenValue`) && REPORT_TEXT.includes(`; ${scoped} are scoped to this goal or its context`))
    assert.ok(!BASE.wording.keyedFor.note.includes('reuses these templates'), 'the wording note no longer claims unchanged reuse')
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
    // The load-bearing mappings, pinned (C3-15), and each RANGE or COUNT item with numeric bounds mapped to one numeric value holds it.
    assert.deepEqual(contractViolations(BASE.experiment, gf2.result.items as Raw[]), [])
    const long = rawX()
    long.choices.find((c: Raw) => c.path === 'area.lengthM').value = 70
    assert.deepEqual(contractViolations(validateExperiment(long), gf2.result.items as Raw[]), ['GF2-24.a: area.lengthM = 70, outside 40-60'], 'bite: a length outside the typical range')
    const remapped = rawX()
    for (const c of remapped.contractItems) if (c.mappedTo.length) c.mappedTo = ['equipment.balls']
    assert.ok(contractViolations(validateExperiment(remapped), gf2.result.items as Raw[]).length >= 10, 'bite: every item remapped to the spare balls')
}

/** The contract items whose mapping carries the activity's structure, pinned here; a value outside an item's numeric bounds also fails. */
const EXPECTED_CONTRACT_MAPPINGS: Record<string, string[]> = {
    'GF2-14.a': ['teams.count'],
    'GF2-14.b': ['teams.equalOutfield'],
    'GF2-24.a': ['area.lengthM'],
    'GF2-24.b': ['area.widthM'],
    'GF2-08.a': ['scoring.event'],
    'GF2-08.b': ['scoring.event'],
    'GF2-19': ['scoring.event'],
    'GF2-20': ['scoring.event'],
    'GF2-21': ['scoring.event'],
    'GF2-09.a': ['directions'],
    'GF2-09.b': ['directions'],
    'GF2-10': ['directions'],
    'GF2-11': ['directions'],
    'GF2-07.a': ['play.continuous'],
    'GF2-17': ['play.continuous'],
    'GF2-13': ['opposition.reciprocal'],
}
const contractViolations = (x: Experiment, items: Raw[]): string[] => {
    const out: string[] = []
    for (const [id, paths] of Object.entries(EXPECTED_CONTRACT_MAPPINGS)) if (json(x.contractItems.find((c) => c.itemId === id)?.mappedTo) !== json(paths)) out.push(`${id}: mapped to ${json(x.contractItems.find((c) => c.itemId === id)?.mappedTo)}, expected ${json(paths)}`)
    for (const c of x.contractItems.filter((y) => y.mappedTo.length === 1)) {
        const item = items.find((i) => i.id === c.itemId) as Raw
        const value = choiceOf(x, c.mappedTo[0]).value
        if (typeof value !== 'number' || (item.requirement !== 'RANGE' && item.requirement !== 'COUNT')) continue
        const range = /^(\d+)-(\d+) m$/.exec(String(item.value))
        const count = /^(\d+)$/.exec(String(item.value))
        if (range && (value < Number(range[1]) || value > Number(range[2]))) out.push(`${c.itemId}: ${c.mappedTo[0]} = ${value}, outside ${range[1]}-${range[2]}`)
        if (item.requirement === 'COUNT' && count && value !== Number(count[1])) out.push(`${c.itemId}: ${c.mappedTo[0]} = ${value}, not ${count[1]}`)
        if (!range && !count) out.push(`${c.itemId}: a numeric value mapped to a ${item.requirement} item whose bounds this test cannot read (${String(item.value)})`)
    }
    return out
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Isolation and determinism (v)-(y)
// -------------------------------------------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------------------------------------------
// The DRAFT diagram (Christian's reply of 6 November, section 9; DESIGN-6-v2 A2; U4 T1-T10)
// -------------------------------------------------------------------------------------------------------------------------------------

/** The text inside every <text> element of an SVG, unescaped. */
const svgTexts = (svg: string): string[] => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1].split('&quot;').join('"').split('&lt;').join('<').split('&gt;').join('>').split('&amp;').join('&'))
/** A text box's rectangle (top-left, width, height), as the model places it. */
const boxOf = (t: DiagramModel['texts'][number]) => ({ x: t.anchor === 'middle' ? t.x - t.w / 2 : t.x, y: t.y - t.size, w: t.w, h: t.h })
const overlaps = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
/** The drawing labels that show each numeric value (the stage 6 review, C2-01): a changed value must change exactly these texts. */
const LABEL_OF: Record<string, string[]> = { 'area.lengthM': ['label-length'], 'area.widthM': ['label-width'], 'endZones.depthM': ['label-depth-1', 'label-depth-2'], 'players.perTeam': ['team-1', 'team-2'] }
/** Independent geometry for the committed record (U4 T7), written here: zones 0-5 and 35-40 m along, 0-30 m across; halfway 20; centre 20, 15. */
const EXPECTED_GEOMETRY = { lengthM: 40, widthM: 30, depthM: 5, zones: [{ alongFromM: 0, alongToM: 5, acrossFromM: 0, acrossToM: 30 }, { alongFromM: 35, alongToM: 40, acrossFromM: 0, acrossToM: 30 }], halfwayAlongM: 20, centre: { alongM: 20, acrossM: 15 } }

function testDiagram(): void {
    const m = BASE.diagram
    const svg = assemblyDiagramSvg(m)
    const paths = new Set(BASE.experiment.choices.map((c) => c.path))
    // T1 Trace: every element names the record paths it reads; every number the drawing prints is a value it reads or a class number.
    for (const s of [...m.shapes, ...m.texts]) for (const p of s.readsPaths) assert.ok(paths.has(p), `${s.id}: ${p} is not a value of the record`)
    const numbersRead = new Set(m.values.filter((v) => typeof v.value === 'number').map((v) => String(v.value)))
    // Christian's class numbers ('class 5: ...') and the closing note's 'blocking decision 1' (the proposal's numbering) are lifted by
    // pattern; every other number must be a value the drawing reads (the stage 6 review, C2-01: no blanket allowance).
    const lifted = (s: string) => s.split(/\bclass [1-6]: /).join(' ').split(/\bblocking decision \d+ of the technical proposal\b/).join(' ')
    for (const t of svgTexts(svg)) for (const n of numbersIn(lifted(t))) assert.ok(numbersRead.has(String(n)), `a number the record does not hold: ${n} in '${t}'`)
    assert.deepEqual(numbersIn(lifted('- Area width: 30 m; class 5: An illustrative configuration choice')), [30], 'the class number is lifted, the value kept')
    // T7 Independent expectations: the geometry in metres for the committed record.
    assert.deepEqual(m.metres, EXPECTED_GEOMETRY)
    const textOf = (model: DiagramModel, id: string) => model.texts.find((y) => y.id === id)?.text
    assert.equal(textOf(m, 'label-length'), `${EXPECTED_GEOMETRY.lengthM} m`)
    assert.equal(textOf(m, 'label-width'), `${EXPECTED_GEOMETRY.widthM} m`)
    for (const id of ['label-depth-1', 'label-depth-2']) assert.equal(textOf(m, id), `${EXPECTED_GEOMETRY.depthM} m`, id)
    const perTeam = BASE.activity.choices.find((y) => y.path === 'players.perTeam')?.value
    assert.equal(perTeam, 6)
    for (const id of ['team-1', 'team-2']) assert.ok(textOf(m, id)?.includes(`${perTeam} players`), id)
    // C4-20: under the caption, the drawn values that are ILLUSTRATIVE, read from the key's labels.
    const illustrativeNames = m.key.filter((k) => EXPECTED_LABEL[k.path] === L_ILLUSTRATIVE).map((k) => k.element)
    assert.ok(illustrativeNames.includes('Area length (end line to end line, target zones included)') && illustrativeNames.includes('Players per team'))
    assert.equal(m.texts.filter((y) => y.id.startsWith('caption-illustrative')).map((y) => y.text).join(' '), `ILLUSTRATIVE on this drawing (for this offline test only; see the key): ${illustrativeNames.join('; ')}.`)
    // T2 Coverage: every value of the parts for the Game Form and players and for the dimensions and layout, the directions and the
    // markings, is drawn or keyed; nothing is skipped silently.
    const parts = BASE.experiment.requiredParts.filter((p) => p.id === 'P2' || p.id === 'P3').flatMap((p) => p.paths)
    for (const p of [...parts, 'directions', 'equipment.markers']) assert.ok(m.readsPaths.includes(p), `${p}: neither drawn nor keyed`)
    // T4 Status: each key line's class and label are the report's for the same value; the three labels stay distinct.
    for (const k of m.key) {
        const c = BASE.activity.choices.find((y) => y.path === k.path) as AssembledActivity['choices'][number]
        assert.equal(k.classAndLabel, `class ${c.sixClass}: ${SIX_CLASSES[c.sixClass - 1].slice(0, -1)}; ${EXPECTED_LABEL[k.path]}`, `${k.path}: the key's class and label are the report's`)
        assert.ok(part2Block(k.path).includes(`; ${k.classAndLabel}`), `${k.path}: the same class and label in Part 2`)
        assert.equal(k.route, c.howReached === 'READ_BY_CODE' ? 'read by code' : c.howReached === 'UNRESOLVED' ? 'no value entered (UNRESOLVED)' : 'entered', k.path)
    }
    assert.deepEqual([...new Set(m.key.map((k) => k.classAndLabel.split('; ').slice(1).join('; ')))].filter((l) => [L_UNRESOLVED, L_OURS, L_ILLUSTRATIVE].includes(l)).sort(), [L_ILLUSTRATIVE, L_UNRESOLVED].sort(), 'the key shows ILLUSTRATIVE and UNRESOLVED values apart (no OURS value is drawn)')
    // The unresolved position appears on the field only as the placeholder, never as a shape of its own.
    assert.ok(m.shapes.every((s) => !s.readsPaths.includes('endZones.positioning')))
    assert.deepEqual(m.texts.filter((t) => t.inside && t.readsPaths.includes('endZones.positioning')).map((t) => t.text).join(' '), 'Target-zone position: not decided; this example puts them at the ends.')
    // T5 Absence: no goal, no centre circle, no player or position, no restart spot, no shaded middle region; exactly two zones, one green.
    assert.deepEqual(m.shapes.filter((s) => s.kind === 'zone').map((s) => s.colour), [m.colours.zone, m.colours.zone])
    assert.deepEqual(m.shapes.filter((s) => s.kind === 'mark').map((s) => [s.id, s.r]), [['centre-mark', 3]])
    assert.deepEqual(m.shapes.map((s) => s.id).sort(), ['area', 'arrow-1', 'arrow-2', 'centre-mark', 'dimension-length', 'dimension-width', 'halfway-line', 'zone-1', 'zone-2'])
    assert.ok(m.colours.teams.every((c) => c !== m.colours.zone) && m.colours.teams[0] !== m.colours.teams[1], 'team colours are not green and not alike')
    assert.equal((svg.match(/<circle /g) ?? []).length, 1, 'one circle: the centre mark')
    // Nothing team-coloured inside the area outline: team words and arrows lie above or below it (L5-28).
    const o = m.outline
    const insideOutline = (y: number) => y >= o.y && y <= o.y + o.h
    for (const t of m.texts.filter((y) => y.id.startsWith('team-'))) assert.ok(!insideOutline(t.y) && !insideOutline(t.y - t.size) && !t.inside, t.id)
    for (const s of m.shapes.filter((y) => y.kind === 'arrow')) assert.ok(!insideOutline(s.y) && !insideOutline(s.y2 as number), s.id)
    for (const t of m.texts.filter((y) => y.inside)) assert.ok(!m.colours.teams.includes(t.colour), `${t.id}: team-coloured text inside the area`)
    // On the field only the placeholder and the zone-depth labels; every other flag below the field.
    assert.deepEqual([...new Set(m.texts.filter((t) => t.inside).map((t) => t.id.split('-')[0]))].sort(), ['label', 'placeholder'])
    for (const t of m.texts.filter((y) => y.id.startsWith('flag') || y.id.startsWith('not-drawn') || y.id.startsWith('key') || y.id.startsWith('caption'))) assert.ok(t.y - t.size > o.y + o.h, `${t.id}: below the field`)
    // No two text boxes overlap.
    for (let i = 0; i < m.texts.length; i++) for (let j = i + 1; j < m.texts.length; j++) assert.ok(!overlaps(boxOf(m.texts[i]), boxOf(m.texts[j])), `${m.texts[i].id} overlaps ${m.texts[j].id}`)
    // T6 Words: no path, data key or record id on the drawing; the marking words are carried by Set up sentences expressing the same values.
    for (const t of svgTexts(svg)) {
        assert.ok(![...paths].some((p) => p.includes('.') && t.includes(p)) && !/\b[A-Z]{2,}_[A-Z_]+\b/.test(t), `a path or data key on the drawing: '${t}'`)
        assert.ok(!/\bASM-|\bAOD-|\bRPC-/.test(t), `an id on the drawing: '${t}'`)
    }
    const carried: Array<[string, string]> = [['halfway line', 'area.halfwayLine'], ['centre mark', 'area.centreMark'], ['target zone', 'endZones.depthM']]
    for (const [word, p] of carried) assert.ok(sentences().some((s) => s.section === 'CD-SETUP' && s.expresses.includes(p) && s.text.includes(word)), `${word}: carried by a Set up sentence expressing ${p}`)
    // The banner, the caption and the flags Christian's section 9 asks for (each from the DRAFT diagram words).
    const all = svgTexts(svg).join(' ')
    for (const s of ['DRAFT, offline review only: drawn from the manually authored A05 configuration record; not generated from knowledge and not a served diagram.', 'Start: ordinary kick-off from the centre mark; opponents at least 9.15 m from the ball until it is kicked (no circle is marked).']) assert.ok(all.includes(s), s)
    assert.equal(m.flags.length, 5)
    assert.deepEqual(m.notDrawn.map((n) => n.what), ['Goals', 'A centre circle', 'Players or positions', 'Starting relationships', 'The end-line restart location', "The coach's position", 'Spare balls', 'A principal-interaction region'])
    // T3 Mutation: every value the diagram reads, changed in a copy of the record: refused with its path named, or the drawing changes.
    for (const p of m.readsPaths) {
        const x = rawX()
        const c = x.choices.find((y: Raw) => y.path === p)
        c.value = typeof c.value === 'number' ? c.value + 1 : typeof c.value === 'boolean' ? !c.value : 'SENTINEL_MUTATION'
        let changed: string | null = null
        try {
            changed = assemblyDiagramSvg(run(committedKnowledge(), x).diagram)
        } catch (e) {
            assert.ok(String(e).includes(p), `${p}: refused for a reason that does not name it: ${String(e)}`)
            continue
        }
        assert.notEqual(changed, svg, `${p}: read by the diagram, but a changed value leaves the drawing unchanged`)
        const mutated = run(committedKnowledge(), x).diagram
        for (const id of LABEL_OF[p] ?? []) assert.ok(textOf(mutated, id)?.includes(String(c.value)), `${p}: ${id} does not show the changed value ${String(c.value)}`)
        for (const s of m.shapes.filter((y) => !y.readsPaths.includes(p))) assert.deepEqual(mutated.shapes.find((y) => y.id === s.id), s, `${p}: ${s.id} moved, but does not read it`)
    }
    assert.ok(Object.keys(LABEL_OF).every((p) => m.readsPaths.includes(p)), 'every labelled path is read by the diagram')
    // Fail closed: an unmapped placement, a value with no diagram words, and a position with a value each refuse, naming what.
    const unmapped = rawX()
    unmapped.placementGeometry = { SOME_OTHER_PLACEMENT: unmapped.placementGeometry.ONE_AT_EACH_END_FULL_WIDTH }
    throwsWith(() => run(committedKnowledge(), unmapped), 'a placement geometry for another placement')
    const noWords = rawW()
    delete noWords.diagram.valueWords.markers
    assert.throws(() => run(committedKnowledge(), rawX(), noWords), /assembly-diagram \(equipment\.markers\): no diagram words for the value AREA_HALFWAY_CENTRE_TARGET_ZONES/)
    const r = run()
    assert.throws(() => assemblyDiagramOf({ ...r.activity, choices: r.activity.choices.map((y) => (y.path === 'endZones.positioning' ? { ...y, value: 'DECIDED' } : y)) }, r.experiment, r.wording), /the zones' position has a value/)
    const withValue = (p: string, v: unknown) => ({ ...r.activity, choices: r.activity.choices.map((y) => (y.path === p ? { ...y, value: v as ChoiceValue } : y)) })
    assert.throws(() => assemblyDiagramOf(withValue('area.includesEndZones', false), r.experiment, r.wording), /drawn inside the length only when the record says so/)
    assert.throws(() => assemblyDiagramOf(withValue('teams.equalOutfield', 'UNEQUAL'), r.experiment, r.wording), /drawn equal only when the record says so/)
    assert.throws(() => assemblyDiagramOf(withValue('teams.count', 3), r.experiment, r.wording), /3 teams, 2 drawing labels/)
    const oneZone = JSON.parse(JSON.stringify(r.experiment)) as Experiment
    oneZone.placementGeometry.ONE_AT_EACH_END_FULL_WIDTH.zones = [{ along: 'FROM_START' }]
    assert.throws(() => assemblyDiagramOf(r.activity, oneZone, r.wording), /draws 1 zones, the zone count is 2/)
    // A goalkeeper count other than the one with words is refused (it is never printed against a unit that is a word about 0).
    assert.throws(() => assemblyDiagramOf(withValue('players.goalkeepers', 1), r.experiment, r.wording), /no diagram words for the value 1/)
    // An area too short for an arrow beside the team's words is refused, never drawn reversed; a long area widens the page.
    assert.throws(() => assemblyDiagramOf(withValue('area.lengthM', 12), r.experiment, r.wording), /too short to draw an attacking arrow/)
    const long = assemblyDiagramOf(withValue('area.lengthM', 90), r.experiment, r.wording)
    const widthText = long.texts.find((y) => y.id === 'label-width') as DiagramModel['texts'][number]
    assert.ok(long.width >= widthText.x + widthText.w && long.width >= long.outline.x + long.outline.w, 'a long area stays inside the page')
    for (const s of m.shapes.filter((y) => y.kind === 'arrow')) assert.equal((s.x2 as number) > s.x, s.id === 'arrow-1', `${s.id}: points the way its words say`)
    // The arrows are keyed by the recorded directions value: another value, even one with key words, has no arrows and is refused.
    const otherWay = JSON.parse(JSON.stringify(r.wording)) as Wording
    ;(otherWay.diagram.valueWords as Raw).attackDirections.SWITCH_ENDS_AT_HALF = 'the teams switch ends at half time'
    assert.throws(() => assemblyDiagramOf(withValue('directions', 'SWITCH_ENDS_AT_HALF'), r.experiment, otherWay), /no arrows for the directions value SWITCH_ENDS_AT_HALF/)
    // Two zones on one end, or zones that overlap, are refused.
    const sameEnd = rawX()
    sameEnd.placementGeometry.ONE_AT_EACH_END_FULL_WIDTH.zones = [{ along: 'FROM_START' }, { along: 'FROM_START' }]
    assert.throws(() => validateExperiment(sameEnd), /each zone on its own end/)
    assert.throws(() => assemblyDiagramOf(withValue('endZones.depthM', 25), r.experiment, r.wording), /the target zones overlap or meet/)
    const quoted = rawW()
    quoted.diagram.flags[0] = 'A flag quoting "words of no one".'
    throwsWith(() => validateWording(quoted, BASE.experiment), 'a quotation mark in a diagram word')
    // T8 Isolation: only the review module, the runner and the unit tests import the diagram file; nothing outside the folder names it.
    const importers = fs.readdirSync(HERE).filter((f) => f.endsWith('.ts') && f !== 'assembly-diagram.ts' && /from '\.\/assembly-diagram'/.test(fs.readFileSync(path.join(HERE, f), 'utf8')))
    assert.deepEqual(importers.sort(), ['assembly-review.ts', 'assembly.unit.ts', 'run-assembly-experiment.ts'])
    const outside = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? outside(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []))
    assert.ok(outside(SRC).filter((f) => !f.startsWith(HERE + path.sep)).every((f) => !fs.readFileSync(f, 'utf8').includes('assembly-diagram')), 'nothing outside the folder names the diagram file')
    // The results carry the model; the Overview's note points to the DRAFT diagram.
    assert.ok(json((REPORT.results as { diagram: unknown }).diagram) === json(m))
    assert.equal(sentences().find((s) => s.id === 'ov-diagram')?.text, 'DRAFT diagram drawn from the record (offline review only); not served.')
}

/** (v) Two runs are byte-identical, and the committed evidence is this code's output (C4-02), the committed regression record included. */
function testV_determinism(): void {
    const again = buildAssemblyReport(run(), REGRESSION, mutationLoop(display))
    assert.equal(again.report, REPORT_TEXT)
    assert.equal(json(again.results), RESULTS_TEXT)
    assert.equal(fs.readFileSync(path.join(EVIDENCE, 'assembly-report.txt'), 'utf8'), REPORT_TEXT, 'the committed report is the code\'s output: re-run npm run design:assembly')
    assert.equal(fs.readFileSync(path.join(EVIDENCE, 'assembly-results.json'), 'utf8'), `${JSON.stringify(REPORT.results, null, 2)}\n`, 'the committed results are the code\'s output: re-run npm run design:assembly')
    // The DRAFT diagram (6 November): two builds identical, and the committed SVG is the code's output.
    assert.equal(assemblyDiagramSvg(run().diagram), assemblyDiagramSvg(BASE.diagram))
    assert.equal(fs.readFileSync(path.join(EVIDENCE, 'assembly-diagram.svg'), 'utf8'), assemblyDiagramSvg(BASE.diagram), 'the committed diagram is the code\'s output: re-run npm run design:assembly')
    // Bite: one note changed in the record gives a report that is not the committed one (stale evidence is caught), and so does a
    // regression record other than the committed one.
    const x = rawX()
    x.choices[0].note = `${x.choices[0].note} (changed)`
    assert.notEqual(buildAssemblyReport(run(committedKnowledge(), x), REGRESSION, MUTATION).report, fs.readFileSync(path.join(EVIDENCE, 'assembly-report.txt'), 'utf8'), 'bite: a changed note')
    assert.notEqual(buildAssemblyReport(BASE, { ...REGRESSION, standing: `${REGRESSION.standing} (changed)` }, MUTATION).report, fs.readFileSync(path.join(EVIDENCE, 'assembly-report.txt'), 'utf8'), 'bite: a changed regression record')
    // No gendered pronoun anywhere in the evidence (the binding rule; the stage 6 review, C1-02, C3-01, C4-01): report, results, diagram.
    const PRONOUN = /\b(he|his|him|himself|she|her|hers|herself)\b/i
    for (const f of ['assembly-report.txt', 'assembly-results.json', 'assembly-diagram.svg', 'regression-record.json']) {
        const hit = fs.readFileSync(path.join(EVIDENCE, f), 'utf8').split('\n').findIndex((l) => PRONOUN.test(l))
        assert.equal(hit, -1, `${f}: a gendered pronoun at line ${hit + 1}`)
    }
    assert.ok(PRONOUN.test('as quoted in his reply') && !PRONOUN.test('whether the heron'), 'bite')
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

/**
 * Christian's words, pinned (C3-18; the lead's D11): the sha-256 of each registry entry's words (JSON of the list), taken after the external quote
 * check passed against Christian's replies. A later edit to any of Christian's words fails here until the external check is re-run and the hash re-pinned.
 */
const RULING_WORD_HASHES: Record<string, string> = {
    // Pinned 6 November 2026 after check-quotes.js --no-ban: 212 quotes and 12 terms PASS, 0 FAIL, 201 of 201 citations OK.
    // ASM-AUTH-CLASSES (Christian's six classes) pinned in the recheck the same day, after check-quotes.js --no-ban: 219 quotes and 12 terms PASS,
    // 0 FAIL, 208 of 208 citations OK; no other entry's words changed.
    'ASM-AUTH-CLASSES': 'ac2bfed3b44ed6ea56971667395abd478328848c2c727ed89eb5f7cc862c5ac5',
    'ASM-AUTH-PURPOSE': '4b8559f298f3d97813a7155e44734007503da084553adef5c48c0c4e44e664ac',
    'ASM-AUTH-RECONCILE': '491c62d856d0589b8ef5d84e283760c35b1a7101d044cbfb592097b67211967b',
    'ASM-AUTH-ILLUSTRATIVE': '62578996e752e44e87ed5ac3fecbf3de71d0956e052eb1bb18e0bbb3e1d1e653',
    'ASM-AUTH-GF': '8e7c048d8495af127a2346039e27eb604ccc0500950ac56b29f1af575cd44d10',
    'ASM-REV1-GF2': '94d885f956caab39226e800dfc338f5bb435dfe45d1828bce98ac7e16c614db7',
    'ASM-AUTH-GP-SCOPE': 'd0114f9c96bf06e2ff2210074d16c144465e6eee602265a2c20e19252abb98f2',
    'ASM-REV1-GP-SCOPE': 'ef83c0150d83b5360fd566e1dfa901adc398fd4b0595f96c8c9bbf1b693a35de',
    'ASM-AUTH-GAIN-ACCESS': 'd6564f6e7ea6ef006878d2529b7b4dca6ca58f7c154f75283d99138bece23998',
    'ASM-AUTH-STARTING-CONDITION': '513052cc66b79d8fb02f86789952954ffd7ee5605b4d5bf566b5ec6a0f438d00',
    'ASM-AUTH-D4': 'e9b387cd6ec35e0865b72d91a744434bba256101475b4e2c877b02ac2f7ad533',
    'ASM-AUTH-LIMITS': '3f4938d3da436bde78bf1d2bd2a624172d4b66d366a49eb6974b805f27cd3ff7',
    'ASM-AUTH-SCENARIOS': 'c6ad8848e2af3e7cac81bb167fcd4b4f2d54d0f77dfeeebf626099512ab986f3',
    'ASM-AUTH-SCENARIO-RULES': 'cfd522b1e515774e13c55c3b50f8825fd9f9fcd7664c02b379c2ebec46e1f9ca',
    'ASM-AUTH-PARTS': '8ab75f6841234b074c83d21dcfbd248f578ee4c9f50ec1020c173a5933ad61ee',
    'ASM-AUTH-BOUNDS': '0c0e2f1052b46eb2ae94ebfa9ea395684296a201da078e49b75f688ba3aa75ed',
    'ASM-AUTH-SUITABILITY': 'aba95af80f17ae1cfeccef830b8f412f35a7aec024f8e1589173b9d392ade65f',
    'ASM-AUTH-SCALE': '3efc5281a1eb1d426930ee8cf07762d66d597106506ad1b74227d717305baeb5',
    'ASM-AUTH-COACH-QUESTION': '3ac11d2898e8bc3771275757a87c7174567d117d149d1d10aabfb8fcc081f262',
    'ASM-AUTH-COMPOSITE': '41d3677c5128996abb458026c1b7eadd4807257170e13a560a139d1bbaa51336',
    'ASM-AUTH-SHOW-UNRESOLVED': '33977dd6b48384f1949bf76dad9ee3a47d07026d620dfe063bde71902e9dd523',
    'ASM-REV1-KICKOFF': '640f7b923bc18a6fa720e9db23067d976117b687c5930f0983adf85ac60511bb',
    'ASM-REV1-CONTINUOUS': '6a1de0b6256a79986462d207cc46e573ecb0c1ab2b40568331ee6ba74c1c22d8',
    'ASM-REV1-DIMENSIONS': 'c04220df92b33d36f327a3b680f735436b6899372946ed9dad19806c0ab1d922',
    'ASM-REV1-ADD-NOTHING': '4d7c975727525a4c473dc51116790e79d40d0701d41f9c27cc4a10859b7ea95d',
    'ASM-REV1-OBSERVATION': '8924d95a2cb0450f930874c3b23eb546a0df1b824901afbc6eeb6a750c4853d4',
    'ASM-REV1-SOURCE-FIDELITY': '0cc309220251f5b3dece62312de10eef644934458552a3890dd7931550d4f1fe',
    'ASM-REV1-SMALLEST-CORRECTION': '2667ab924951f5614a6c648df3da79cb94af621918d476bf9892aa1328d957bf',
    'ASM-REV1-COACH-SERVED-BALL': '1f7b541f680f5b5705c943fb788e3480e118863822b9dfeb4903d6f1add587ff',
    'ASM-REV1-NO-FIXED-POSITIONS': '0d1fef78c8ad6a0bc86c0b353d6ee9c0ed152ebe31cf25685e8f71810681f98e',
    'ASM-EVE-MISMATCH': '4ef37129809acfa9eef23e44b53f54aa335cb648046a1f3c13d9e80a7f84df1d',
    'ASM-DEC-CONTINUOUS': 'e5ef4920772db1de3a9e18f491e9346cd38020a2eb85ff1840c78a40ddc3be98',
    'ASM-NOV3-REQ-E1': '4ff10f5a3b35edda0f654c0cc2aa6b9ad87822ea8993f91f06388e0037fafd1b',
    'ASM-1OCT-EQUAL': 'a9cedf248d329fc4bff8e1bd32d4bea5dc765d69dcd220e81f65b0c5d7db9704',
    'ASM-1OCT-SESSION-FACT': 'f42dcb43fccf2ba461940b0d0ca0043c2a5acb3846cb3f97cf0a61b867c4627e',
    'ASM-9OCT-TEAMS': '76113f97c4047cd71a672035c03308d66b6ead742f63a3134551baf88b689cd2',
    'ASM-9OCT-REGAIN': 'd4606e68ae99622618585f94ca209031295c037980b3306f7cbec67d10366cb6',
    'ASM-15SEP-DIRECTION': '456d97a682cbe6aba0cb53411cbac656d7f778f1faa8c8ba56060e1c871dec3d',
    'ASM-28OCT-ENDZONE': '24bf342ec5e148e2f97b5791066b72b6687a6e937f9f6141d77d4cbcdcd0b381',
    'ASM-28OCT-PROVISIONAL': 'e1559915d0550a27ca828f52b1839b0eea3b3c532039c238dd31c751f7e81391',
    'ASM-29OCT-PROVISIONAL': '49892df45ad19cb632577bd352f97e810da9c0156ab60d4c4d1a7c53ff5b9e69',
    'ASM-29OCT-EVE-PROVISIONAL': 'c110cc68bbabb9f267d481aaa5bd589bbeac592e6301fa2f8dc512bcaea5990d',
    'ASM-29OCT-ACCOUNTING': 'e446057c161515fe452864876d8f519cd82779d59c2e63e38613030928e623c8',
    'ASM-29OCT-4B': '992793168961c4f9ac8610f5b7fefd128212381cb418cb06c75dca6d49995584',
    'ASM-29OCT-ADAPTED-KICKOFF': '8cfbbbf22bb7a0b8a3146c6d4689f8a610fca2b9f52086c1efeb83aa94eaa265',
    'ASM-30OCT-REGAIN': 'f1984e7211147c49b21b7bd2a987f220678e45b097cbc86b40d64dec0b8ffc1c',
    'ASM-30OCT-OPTION5': 'a94e78e84b4424d79673b88f68d5bddae5ba3ad992e5569add6fc11f1374d8bd',
    'ASM-30OCT-WALKTHROUGH': '8b153b7c3dca4f6d95431bd710fa1cfb2450386c7f6434d7739c5b68bdeeb8cf',
    'ASM-30OCT-RESTART': '838d9475730d34530ad1e7d7d45baad771e88bba44c98c039970d339e87c2184',
    'ASM-30OCT-EVE-EVENT': '02ae67cbd465cffd00eb0d1fd4d22516c5baaf2de2a0195947f9b10b92f0fdb3',
    'ASM-30OCT-EVE-ELIGIBLE': '39f05db4804846031ded543507e6103f778a889c411e0c8482a91bb7f9bc72c3',
    'ASM-30OCT-EVE-UNRESOLVED': '6be7b1cc8d57a028eec90d326695af2d7b84f900a1483ed2faa9764f1d2ec60b',
    'ASM-30OCT-EVE-OBSERVATION': 'eac503afbe0146804c79697541b424d0866722cf7d9050acb2fd6c92710d18c1',
    'ASM-23OCT-LAWS': 'a10ae30eaabc323ba8ebf840aa58e34a698b733d715666dacf506a18b919dcf1',
    'ASM-21OCT-PURPOSE': '941651b4c05f1890b409adc3c773ecf97f66ecfbc895853a8c778ac9cc4df3bd',
    'ASM-21OCT-PRESENTATION': 'ac7e514b2974111a7fd08b886caf0750fe1029c78fa3b6602a29473e2b6bb3b6',
    'ASM-22OCT-COLOURS': '8fd77f114ea889dc7f1b79d7ed1bf38286f7b0a4ac9add5b8a7b239e70a864ab',
    'ASM-15OCT-WAITING': '2020741036d08e70174e64ee5dd2e90462e9796d9922547c94b78e0ededf882a',
    'ASM-13SEP-SCORING': 'e832471b19ed0ba5ceebf2eff2e1d374cc4c37b4ca2329114eac07465355bf3c',
    'ASM-31OCT-ORGANIZED': '40f38041a9299355b752a62edce1faa350f600ff6d4319a2dd6d648b4078af36',
    'ASM-28OCT-ACCEPTANCE': '53d7412db559d5d5e08f9da7c86079b200a5d511abeb2cd234d06d7155b85e3b',
    // Christian's reply of 6 November and two earlier entries it occasioned, pinned 6 November 2026 after dump-quotes3.js and
    // check-quotes.js --no-ban: 310 quotes and 16 terms PASS, 0 FAIL, 298 of 298 citations OK; no earlier entry's words changed.
    'ASM-06NOV-DIAGNOSTIC': '7e2cc2a4ccb212eab4b171faf8042eeaba0135ab2e8ac1d97283ff446112602f',
    'ASM-06NOV-STARTING': '491e4d5eb977881e6283147847c7823f154a753c35a20610bd3c6fa4b7fb4725',
    'ASM-06NOV-SOURCE': '18b14d8942dffd4723af8a80866620d091aadc54d2f12685795ed83d4327869a',
    'ASM-06NOV-OPTION-A': '0b631f24cc924bdc81215ba8ab79cd3510e48d74aa668502371fd42ee2995364',
    'ASM-06NOV-K2': '03be0a245957000a24081afe3fdd66ba73c31c495490beac9010259601eff453',
    'ASM-06NOV-CREATE-SPACE': '3816990cf2a2c5fb6f3f028f6ee83489563b5675d483ceecd61c2dd0390d4993',
    'ASM-06NOV-RESTART': '82cd0a5472188c385818e5c5e78457bba9dc231e21773322d3b4f421836fe3ad',
    'ASM-06NOV-PROVENANCE': '77274f5adf9b445db741b898c44782a98cd2455263e798582c43fec74b29e25b',
    'ASM-06NOV-KICKOFF': '7d67a01d2ab5ee7362109c47379fb370adf295f887b06ae0aa428dee48aba3f0',
    'ASM-06NOV-DIAGRAM': '8e47f76c79a437007c0123eb6776e951a7262499a68de9c441ff3670d95db2de',
    'ASM-06NOV-ILLUSTRATIVE-OFFLINE': '7c48f1862fe8465de3551cffc856c541ca248d93fb7fcf4f8f717249a2f326aa',
    'ASM-15OCT-NOT-MANDATORY': '0f72b178b805df4dc161344dfc6761f8c86d6abc9c725f92ec972239cdb644a0',
    'ASM-30OCT-EVE-SUFFICIENCY': 'c7d333ed1eb4385cacceff34ac6addcc98a81f0612deec7b8e8b7bafef3eab27',
}
function testRulingWordsPinned(): void {
    const actual = Object.fromEntries(BASE.experiment.rulings.map((r) => [r.id, crypto.createHash('sha256').update(JSON.stringify(r.words)).digest('hex')]))
    assert.deepEqual(actual, RULING_WORD_HASHES, 'Christian\'s words changed since the external quote check: re-run it, then re-pin')
    // Bite: one character of Christian's words changed (organization -> organisation) fails.
    const x = rawX()
    const r = x.rulings.find((y: Raw) => y.id === 'ASM-30OCT-EVE-OBSERVATION')
    r.words = r.words.map((w: string) => w.split('organization').join('organisation'))
    assert.notEqual(crypto.createHash('sha256').update(JSON.stringify(r.words)).digest('hex'), RULING_WORD_HASHES['ASM-30OCT-EVE-OBSERVATION'], 'bite')
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
    // 6 November: the DRAFT diagram file is held to the same rules (no record id, no path literal, no sport word; comments included).
    const files = ['assembly.ts', 'assembly-review.ts', 'assembly-display.ts', 'assembly-diagram.ts', 'run-assembly-experiment.ts'].map((f) => path.join(HERE, f))
    const ids = [...x.rulings.map((r) => r.id), ...x.openDecisions.map((d) => d.id), ...x.requirementAccount.map((a) => a.id), ...x.dependencies.map((d) => d.id), ...x.scenarios.items.map((s) => s.id)]
    for (const f of files) {
        const source = fs.readFileSync(f, 'utf8')
        for (const id of ids) assert.ok(!source.includes(id), `${path.basename(f)} names ${id}`)
        for (const c of x.choices) assert.ok(!source.includes(`'${c.path}'`) && !source.includes(`"${c.path}"`) && !source.includes(`\`${c.path}\``), `${path.basename(f)} names the path ${c.path}`)
        // Sport words, the ratchet's and the kick-off and outfield words the ratchet does not list (C4-08).
        for (const word of ['offside', 'goalkeeper', 'dribble', 'throw-in', 'free kick', 'soccer', 'kickoff', 'kick-off', 'outfield']) assert.ok(!source.toLowerCase().includes(word), `${path.basename(f)} names ${word}`)
    }
    // Every id the record and the wording hold (ids, law ids, contract item ids, rows, the vocabulary value, section and template ids),
    // scanned in every non-test file of the folder, comments included (C4-14): no special case on any of them.
    const recordIds = new Set<string>()
    const collect = (v: unknown, key = '') => {
        if (typeof v === 'string' && ['id', 'lawId', 'itemId', 'row', 'rulingRef', 'requirementId', 'scoringEvent', 'gameForm'].includes(key)) recordIds.add(v)
        else if (Array.isArray(v)) v.forEach((y) => collect(y, key === 'rows' ? 'row' : key === 'rulingRefs' ? 'rulingRef' : ''))
        else if (v && typeof v === 'object') for (const [k2, y] of Object.entries(v)) collect(y, k2)
    }
    collect(rawX())
    collect(rawW())
    // A row named "<vocabulary> <value>" is scanned by its value; ids that are configuration paths are covered by the path scan above.
    const scanIds = [...recordIds].map((id) => (id.includes(' ') ? id.split(' ').slice(-1)[0] : id)).filter((id) => !x.choices.some((c) => c.path === id) && !x.derived.some((d) => d.id === id))
    assert.ok(scanIds.length > 150, `${scanIds.length} ids scanned`)
    const escape = (s: string) => s.split('').map((ch) => (/[A-Za-z0-9]/.test(ch) ? ch : `\\${ch}`)).join('')
    // The experiment's own files are scanned comments included; the Stage 1/2 files, which predate the record, with their comments set aside
    // (their comments cite Christian's earlier review items by name, such as Christian's Stage 1 item E1, which a short scenario id here repeats).
    const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
    const folderFiles = fs.readdirSync(HERE).filter((f) => f.endsWith('.ts') && !f.endsWith('.unit.ts')).map((f) => path.join(HERE, f))
    const hits = folderFiles.flatMap((f) => {
        const raw = fs.readFileSync(f, 'utf8')
        const source = files.includes(f) ? raw : stripComments(raw)
        return scanIds.filter((id) => new RegExp(`(^|[^A-Za-z0-9_.-])${escape(id)}($|[^A-Za-z0-9_-])`).test(source)).map((id) => `${path.basename(f)} names ${id}`)
    })
    assert.deepEqual(hits, [])
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
testC_everyValueMutationIsClassified()
testC2_valuePhrases()
testD_keywordsImplyTheirValues()
testE_numbersAreBoundToTheirValues()
testF_noPrescriptionAndQuotesAreVerbatim()
testG_scoringSentencesNameTheTargetZone()
testH_observationBlock()
testI_rationaleMakesNoEffectClaim()
testJ_workbookTextAndThePossessionClause()
testK_displayTextsEqualTheirCells()
testK2_noDecisionReadsADisplayText()
testL_sixClasses()
testL2_labelsAndPremises()
testM_validatorBites()
testChangeLogMatchesRecord()
testN_valueEvidence()
testRulingWordsPinned()
testO_flipTests()
testP_everyScopeAndNoteIsPrinted()
testQ_stage2GroupingFailsClosed()
testR_gameFormAlternatives()
testS_scenarios()
testT_lawsAccount()
testAccount_requirementAccount()
testWordingScope()
testU_contractItems()
testDiagram()
testV_determinism()
testW_stage2Unchanged()
testX_registered()
testY_noGoalSpecificLiterals()

console.log('design-reasoning assembly experiment: all tests passed')
