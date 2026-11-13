/**
 * Unit tests — primary scoring event resolution (RC1.1, Christian 2026-09-13).
 *
 * What these pin is the failure the layer exists to end: nine real activities where seven setups
 * marked a scoring object and none scored it — finishing games with goals rewarding "attacking the
 * open space", counter-attack games rewarding the regain. So the tests are about WHICH SIDE of the
 * representative problem earns the point, that the setup has to make the event physically possible,
 * and that compression can no longer demote the resolved rule.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import type { ActivitySkeletonSlot } from '../activity/build-activity-skeleton'
import { findCommunicationStandardViolations } from '../activity/coach-communication-standard'
import { toCoachScoringSentence } from '../activity/coach-voice'
import { compressActivityForCoach } from '../activity/compress-activity-output'
import { validateActivityAgainstSkeleton, withScoringObjectInSetup } from '../activity/validate-activity-skeleton'
import { exampleClauses, normaliseWhitespace, spanIsExample } from '../derivation/example-clauses'
import { AUDITS_DIR } from '../derivation/knowledge-root'
import { approvalUnusableBecause, type ReadingApproval } from '../rendering/approved-wording-readings'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { generateSelection, isSelectionKnowledgeGap } from '../test-library/generateSelection'
import { ACTION_CLASSES, ACTION_WORD_FORMS, actionClassesIn, actionWordsIn, namesGenericAction, type ActionClass } from './action-words'
import { CANDIDATE_COACH_RULES_FILE, candidateCoachRulesRefusals, CandidateCoachRulesRefused, libraryRow, loadCandidateCoachRules, overlaidCoachRules, type CandidateCoachRules } from './candidate-coach-rules'
import { gateCandidateGameFormsToContext } from './context-selection'
import { guidedSelectionHints } from './guided-selection'
import {
    APPROVED_EVENT_MEANINGS,
    COACH_RULES,
    PrimaryScoringResolutionError,
    REALIZATION_COVERAGE,
    authoredScoringObjects,
    availableScoringEvents,
    eventMeaningStanding,
    resolvePrimaryScoring,
    resolvePrimaryScoringDirectives,
} from './primary-scoring'
import { rpcLibrary } from './rpc-library'
import rpcWorkbook from './rpc-library.rc1.json'
import { soccerModule } from './soccer-module'

function compatiblePairs(): Array<{ rpcId: string; gameFormId: string }> {
    return rpcLibrary
        .contexts()
        .flatMap((c) => rpcLibrary.gameFormsForContext(c.id).map((f) => ({ rpcId: c.id, gameFormId: f.relatedId })))
}

/** Christian: "the eight-row structure is approved". Every compatible pair must reach an approved event. */
function testEveryCompatiblePairResolvesToAnApprovedEvent(): void {
    const pairs = compatiblePairs()
    assert.equal(pairs.length, 22, 'RC1.1 declares 22 context x game form pairs.')
    for (const { rpcId, gameFormId } of pairs) {
        const directives = resolvePrimaryScoringDirectives(rpcId, gameFormId)
        assert.equal(directives.length, 3)
        const valid = rpcLibrary.scoringEventsForContext(rpcId)
        for (const d of directives) {
            assert.ok(valid.includes(d.eventKey), `${rpcId} x ${gameFormId} resolved to "${d.eventKey}", which the context does not score through.`)
            assert.equal(d.qualifyingCondition, rpcLibrary.primaryScoringCondition(rpcId), 'the condition must travel with the event')
            assert.ok(d.qualifyingCondition.length > 0)
        }
    }
}

/** The two gaps Christian asked to be closed rather than worked around. */
function testTheApprovedGapsAreClosedByCoverage(): void {
    assert.deepEqual(authoredScoringObjects('GF7'), [], 'Channel Games author no scoring object of their own.')
    for (const rpcId of ['RPC-001', 'RPC-002', 'RPC-003', 'RPC-004']) {
        assert.equal(resolvePrimaryScoring(rpcId, 'GF7', 1).realizationCoverage, 'channel-attacking-object', `${rpcId} x GF7`)
    }
    assert.equal(resolvePrimaryScoring('RPC-008', 'GF7', 1).realizationCoverage, 'channel-protected-zone')

    assert.ok(!authoredScoringObjects('GF3').includes('goal'), 'Positional Play authors no goal.')
    const finishingThroughGrid = resolvePrimaryScoring('RPC-005', 'GF3', 1)
    assert.equal(finishingThroughGrid.eventKey, 'goal')
    assert.equal(finishingThroughGrid.realizationCoverage, 'positional-play-finishing-goal')

    // Coverage is credited only where it supplied the object.
    assert.equal(resolvePrimaryScoring('RPC-005', 'GF9', 1).realizationCoverage, null)
    assert.equal(resolvePrimaryScoring('RPC-003', 'GF3', 1).realizationCoverage, null)

    // Coverage may only close a gap on a pair the knowledge declares compatible.
    for (const coverage of REALIZATION_COVERAGE) {
        for (const rpcId of coverage.rpcIds) {
            assert.ok(
                rpcLibrary.gameFormsForContext(rpcId).some((f) => f.relatedId === coverage.gameFormId),
                `${coverage.id} covers ${rpcId}, which is not compatible with ${coverage.gameFormId}.`
            )
        }
    }
}

/** The motivating evidence, as assertions: the right side of each problem earns the point. */
function testTheRightSideOfTheProblemEarnsThePoint(): void {
    for (const { rpcId, gameFormId } of compatiblePairs()) {
        for (const d of resolvePrimaryScoringDirectives(rpcId, gameFormId)) {
            if (rpcId === 'RPC-005') assert.equal(d.eventKey, 'goal', `Finishing x ${gameFormId} must score goals.`)
            if (rpcId === 'RPC-006') assert.notEqual(d.eventKey, 'regain', `Counterattack x ${gameFormId} rewards the regain.`)
            if (rpcId === 'RPC-004') assert.notEqual(d.eventKey, 'goal', 'Chance Creation ends before the goal.')
        }
    }
}

/** Both approved defensive events reach coaches; a first-match rule would never reach Denial. */
function testBothApprovedDefensiveEventsReachCoaches(): void {
    assert.deepEqual(resolvePrimaryScoringDirectives('RPC-007', 'GF4').map((d) => d.eventKey), ['regain', 'denial', 'regain'])
    assert.deepEqual(
        resolvePrimaryScoringDirectives('RPC-008', 'GF3').map((d) => [d.eventKey, d.objectKey]),
        [
            ['regain', 'zone'],
            ['denial', 'zone'],
            ['regain', 'zone'],
        ]
    )
    // Counter-Press judges its regain on the window alone, but the team that won the ball still gets an
    // escape line to attack, so the setup has a direction without borrowing an unscored object.
    assert.equal(resolvePrimaryScoring('RPC-007', 'GF4', 1).objectKey, 'line')
}

/** "Validation should fail rather than infer if the selected realization cannot produce a valid event." */
function testEmptyIntersectionFailsInsteadOfInferring(): void {
    const isResolutionError = (e: unknown) => e instanceof PrimaryScoringResolutionError
    assert.throws(() => resolvePrimaryScoring('RPC-005', 'GF1', 1), isResolutionError, 'End Zone Games mark no goal.')
    assert.throws(() => resolvePrimaryScoring('RPC-004', 'GF10', 1), isResolutionError, 'Open play marks nothing to create a chance into.')
    assert.throws(() => resolvePrimaryScoring('RPC-999', 'GF9', 1), /Unknown Representative Performance Context/)
    assert.throws(() => availableScoringEvents('RPC-005', 'GF99'), /Unknown game form/)
}

/** The game form column speaks the controlled vocabulary, and never asserts the derived events. */
function testGameFormStructureUsesTheControlledVocabulary(): void {
    const vocabulary = new Set(rpcLibrary.scoringEvents().map((e) => e.key))
    assert.deepEqual([...vocabulary], ['goal', 'target_player', 'line_crossed', 'target_zone_entered', 'gate', 'regain', 'denial'])
    for (const form of soccerModule.gameForms()) {
        const id = String(form['game_form_id'])
        const objects = authoredScoringObjects(id)
        for (const event of objects) assert.ok(vocabulary.has(event), `${id} names "${event}", outside the vocabulary.`)
        assert.ok(!objects.includes('regain') && !objects.includes('denial'), `${id} asserts a derived event.`)
    }
    assert.deepEqual(availableScoringEvents('RPC-005', 'GF9').events, ['goal', 'regain', 'denial'])
    assert.deepEqual(availableScoringEvents('RPC-005', 'GF5').events, ['regain'], 'no object, so nothing to deny')
}

/** Wording exists for exactly the approved events, and a coach can read every rule aloud unchanged. */
function testCoachWordingIsCompleteApprovedAndCoachFacing(): void {
    const keys = Object.keys(COACH_RULES)
    for (const key of keys) {
        const [rpcId, eventKey] = key.split('|')
        assert.ok(rpcLibrary.scoringEventsForContext(rpcId!).includes(eventKey!), `${key} words an event the context does not score through.`)
    }
    for (const context of rpcLibrary.contexts()) {
        for (const event of rpcLibrary.scoringEventsForContext(context.id)) {
            assert.ok(keys.some((key) => key.startsWith(`${context.id}|${event}|`)), `${context.id} ${event} has no coach wording.`)
        }
    }
    for (const [key, wording] of Object.entries(COACH_RULES)) assert.deepEqual(coachWordingFailures(key, wording), [], `${key}: ${wording.rule}`)
}

/**
 * What a coach rule must be to be read aloud unchanged: no Coach Communication Standard violation, untouched by the engine-voice
 * translation, saying how a point is earned, and its setup evidence named in the rule or the setup. One reading, applied to the live
 * rules above and to our CANDIDATE wording (stage W3), where a rewrite would be a paraphrase, which is Christian's.
 */
function coachWordingFailures(key: string, wording: (typeof COACH_RULES)[string]): string[] {
    const failures: string[] = []
    const violations = findCommunicationStandardViolations(wording.rule)
    if (violations.length) failures.push(`${key} breaks the Coach Communication Standard: ${JSON.stringify(violations)}`)
    if (toCoachScoringSentence(wording.rule) !== wording.rule) failures.push(`${key} would be rewritten by the engine-voice translation.`)
    if (!/\bpoint\b/.test(wording.rule)) failures.push(`${key} does not say how a point is earned.`)
    if (!wording.evidence.every((group) => group.length > 0)) failures.push(`${key} has an empty evidence group.`)
    if (!(wording.evidence.length > 0)) failures.push(`${key} has no setup evidence.`)
    // The setup's object must carry the rule's own name for it, so a coach can tell which one scores.
    for (const group of wording.evidence) {
        if (!group.some((word) => wording.rule.toLowerCase().includes(word) || wording.setup.toLowerCase().includes(word)))
            failures.push(`${key}: evidence "${group.join('/')}" is named in neither the rule nor the setup requirement.`)
    }
    return failures
}

/**
 * The possession and control clauses a coach rule can state, in the wordings met so far (a list cannot read every wording): first
 * those of possession kept, then those of control. A rule stating one must name its ground in the table below. Read in any letter
 * case; any wording of possession, maintaining, retaining or holding must name its ground. A bare 'lose' is not read: RPC-007's
 * rules say 'as soon as your team loses the ball'. Keeping control of the ball ('keeps control', 'in control of the ball') is
 * read as possession kept, not as control on reception, so a declared one needs a ground of retaining or maintaining it.
 */
const POSSESSION_KEPT_CLAUSES = [
    /keep(s|ing)? (the ball|it\b|possession|hold)/i, /retain/i, /maintain/i, /possession/i, /\bhold/i, /(without|not|never) los(e|es|ing)\b/i, /\b(has|have|having) the ball\b/i,
    /(n't|n’t) los(e|es|ing)\b/i, /\bgiv(e|es|ing) (the ball|it|possession) away\b/i, /\bkeep(s|ing)? control\b/i, /\bkept (the ball|it|possession|hold|control)\b/i,
    /\b(has|have|having) (it|control)\b/i, /\b(has|have|having) (still )?got (the ball|it)\b/i, /\bin control of (the ball|it)\b/i,
    /\b(stays?|remains?|staying|remaining) in control\b/i, /\bsecur(e|es|ed|ing) (the ball|it|possession)\b/i, /\b(ball|it) (stays|remains) with\b/i,
    /\bturnover\b/i, /\bturn(s|ing)? (it|the ball) over\b/i, /\b(take|takes|taking) care of (the ball|it)\b/i, /\b(look|looks|looking) after (the ball|it)\b/i,
    /\b(hang|hangs|hanging) on to\b/i, /dispossess/i, /(not|never|n't|n’t) (win|wins|get|gets) (the ball|it) back\b/i, /\b(not|never|n't|n’t|being) lost\b/i,
    /\bprotect(s|ing)? (the ball|it|possession)\b/i,
]
const CONTROL_CLAUSES = [/\bcontrols? it\b/i, /under control/i]
const POSSESSION_OR_CONTROL_CLAUSES = [...POSSESSION_KEPT_CLAUSES, ...CONTROL_CLAUSES]
/**
 * Stage A2 (13 November 2026): clauses that name the possession as the qualifying sequence, never a possession kept, each held to the one
 * span of its context's condition that speaks of the sequence (verbatim, kind CONDITION). Our CANDIDATE High Press Escape rules say 'in that
 * possession' (the lead's decision W1) for Christian's sequence: "A qualifying sequence begins when the attacking team possesses the ball while
 * facing established, coordinated defensive pressure." (received 12 November 2026). Any other ground for the clause is read as before.
 */
const SEQUENCE_CLAUSES: ReadonlyArray<{ clause: string; span: string }> = [{ clause: 'in that possession', span: 'The sequence begins under established coordinated pressure' }]

/**
 * Spans of the scoring events' controlled-vocabulary definitions that state control on reception. Our wording in the controlled
 * vocabulary. Christian approved its meaning for Attack Development's zone and line events only, recorded in
 * APPROVED_EVENT_MEANINGS (primary-scoring.ts): "I approve the specific interpretation that controlled reception can complete the
 * existing attacking-zone and attacking-line scoring events." "I am not granting blanket approval to all controlled-vocabulary
 * descriptions." (received 11 November 2026, second reply). For every other context and event these spans stay unreviewed.
 */
const RECEIVES_AND_CONTROLS = {
    line_crossed: 'receives and controls it beyond the line',
    target_zone_entered: 'receives and controls the ball inside it',
    target_player: 'received and controlled',
}

/**
 * Christian's approved wording of the three Attack Development rules, verbatim, under Christian's headings "Attacking Zone —
 * Approved", "Attacking Line — Approved" and "Gate — Option 2 Approved" (received 11 November 2026, second reply). Pinned here, as
 * the reply is not in this repository.
 */
const CHRISTIAN_APPROVED_RULES: Readonly<Record<string, string>> = {
    'RPC-003|target_zone_entered|': 'Earn a point when a player dribbles into the attacking zone, or receives the ball there and controls it. Passing it around without moving forward never scores.',
    'RPC-003|line_crossed|': 'Earn a point when a player dribbles over the attacking line, or receives the ball past it and controls it. Passing it around without moving forward never scores.',
    'RPC-003|gate|': 'Earn a point when a player dribbles forward through a gate, or passes forward through it and a teammate controls it. Passing it around without moving forward never scores.',
}

/**
 * Each possession or control clause of a coach rule or its setup (verbatim in either) with its ground: a span, verbatim, of the
 * rule's event definition in the controlled vocabulary (EVENT), of its context's approved scoring condition (CONDITION), or of
 * Christian's approved wording of that rule (RULING, CHRISTIAN_APPROVED_RULES; today only RPC-003's gate, Option 2, whose event
 * definition and condition say nothing of control). Our reading, for review. It keeps two things apart that Christian's reply
 * received 11 November 2026 asks to keep apart: "I want to avoid inadvertently removing a legitimate requirement for controlled
 * arrival at a target, for example, simply because an unrelated possession-retention requirement was incorrectly introduced."
 * (received 11 November 2026). Control on reception rests on the event definitions; possession kept rests on a context's condition.
 */
const COACH_RULE_GROUNDS: Readonly<Record<string, [clause: string, kind: 'EVENT' | 'CONDITION' | 'RULING', span: string][]>> = {
    'RPC-001|line_crossed|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.line_crossed]],
    'RPC-001|target_zone_entered|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_zone_entered]],
    // presence of the words only: the rule is open-ended where the condition says on arrival; reported 11 November 2026, not changed.
    'RPC-001|gate|': [['keeps the ball', 'CONDITION', 'with possession controlled on arrival']],
    'RPC-001|target_player|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_player]],
    // presence of the words only: 'the next pass' is narrower than "through the next action" (received 13 September 2026); reported 11 November 2026, not changed.
    // Since stage W3 (11 November 2026) Test 2c reads the action word and pins all four 'awaiting release'; our CANDIDATE wording
    // (rpc-002-coach-rules.CANDIDATE.json) says the row's 'through the next action', and this table's clause becomes that there.
    'RPC-002|line_crossed|': [
        ['controls it', 'EVENT', RECEIVES_AND_CONTROLS.line_crossed],
        ['keeps the ball with the next pass', 'CONDITION', 'the attacking team retains possession through the next action'],
    ],
    'RPC-002|target_zone_entered|': [
        ['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_zone_entered],
        ['keeps the ball with the next pass', 'CONDITION', 'the attacking team retains possession through the next action'],
    ],
    'RPC-002|gate|': [['keeps the ball with the next pass', 'CONDITION', 'the attacking team retains possession through the next action']],
    'RPC-002|target_player|': [
        ['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_player],
        ['keeps the ball with the next pass', 'CONDITION', 'the attacking team retains possession through the next action'],
    ],
    'RPC-003|target_zone_entered|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_zone_entered]],
    'RPC-003|line_crossed|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.line_crossed]],
    'RPC-003|gate|': [['controls it', 'RULING', 'passes forward through it and a teammate controls it']],
    'RPC-003|target_player|': [['control it', 'EVENT', RECEIVES_AND_CONTROLS.target_player]],
    'RPC-004|target_zone_entered|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_zone_entered]],
    'RPC-004|gate|': [['controls it', 'CONDITION', 'the ball is received under control']],
    'RPC-004|target_player|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_player]],
    'RPC-006|line_crossed|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.line_crossed]],
    'RPC-006|target_zone_entered|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_zone_entered]],
    'RPC-006|target_player|': [['controls it', 'EVENT', RECEIVES_AND_CONTROLS.target_player]],
}

/**
 * The coach rules whose possession clause rests on words their context's condition gives only as an example, with why each stands.
 * Empty since 11 November 2026: the three Attack Development rules it held ('and your team keeps the ball') now say Christian's
 * approved wording, without the phrase: "I approve removing the unsupported phrase "and your team keeps the ball" from all three
 * affected Attack Development scoring rules." (received 11 November 2026, second reply). Any rule found again fails until it is
 * listed here with why it stands.
 */
const GROUNDED_ON_AN_EXAMPLE: Readonly<Record<string, string>> = {}

/**
 * **Every possession or control clause of a coach rule or its setup names its ground, and none rests on an example**
 * (11 November 2026). Christian's reply received 11 November 2026, item 3, asks for a check that "The executable interpretation
 * does not recreate a possession-retention requirement from that example." (received 11 November 2026). The rules state their
 * contexts' conditions in coach words (types.ts, the qualifying condition: "the scoring rule above already states it"), so each
 * clause of possession or control must point at the words it states, verbatim, and those words must not be given only as an
 * example (example-clauses.ts). The rule and its setup are read together: the setup sentence is also written for the coach word
 * for word. A ground that overlaps an example clause anywhere, even one that starts at or before its marker, counts as resting on
 * the example. A declared clause must itself be a possession or control clause. One of possession kept must be grounded on words
 * of retaining or maintaining it, or on 'possession controlled', which only RPC-001's condition holds; one of control on words of
 * control. The table is hand-written and is reviewed as a fixture: a ground of the right kind that misreads its condition still
 * passes. The clause list has the same kind of limit: a wording it does not read still passes. Measured on 11 November 2026,
 * after a simulated correction of the three Attack Development rules (since made, in Christian's approved wording): 'stays on the
 * ball', 'is still on the ball', 'without an interception' and 'and the attack continues' still pass. The list supports review; it
 * does not replace it. A RULING ground is accepted only where the rule says Christian's approved wording exactly. Until 11 November
 * 2026 the three Attack Development rules said 'and your team keeps the ball' on the strength of the clause the corrected row gives
 * as an example, and were pinned; they now say Christian's approved wording (received 11 November 2026, second reply), so they pass
 * and the pinned list is empty. A rule found on an example again fails until the pinned list is brought up to date.
 */
function testEveryPossessionOrControlClauseNamesItsGround(): void {
    assert.equal(spanIsExample(rpcLibrary.primaryScoringCondition('RPC-003'), 'while maintaining attacking possession'), true, 'the reading still sees the example of the corrected row')
    const { failures, onAnExample } = possessionOrControlFindings(COACH_RULES, COACH_RULE_GROUNDS)
    assert.deepEqual(failures, [], 'every possession or control clause of a coach rule names a verbatim ground')
    assert.deepEqual([...new Set(onAnExample)].sort(), Object.keys(GROUNDED_ON_AN_EXAMPLE).sort(), 'the rules grounded on words given only as an example are exactly the pinned list')
}

type CoachRuleTable = Readonly<Record<string, (typeof COACH_RULES)[string]>>
type CoachRuleGrounds = typeof COACH_RULE_GROUNDS

/** Test 2b's reading, over any table of rules and grounds (the live rules, or our CANDIDATE wording since stage W3). */
function possessionOrControlFindings(rules: CoachRuleTable, grounds: CoachRuleGrounds): { failures: string[]; onAnExample: string[] } {
    const definitions: Record<string, string> = Object.fromEntries(rpcLibrary.scoringEvents().map((event) => [event.key, event.definition]))
    const failures: string[] = []
    const onAnExample: string[] = []
    for (const [key, wording] of Object.entries(rules)) {
        const [rpcId, eventKey] = key.split('|')
        const declared = grounds[key] ?? []
        const ruleAndSetup = wording.rule + ' ' + wording.setup
        const undeclared = declared.reduce((rest, [clause]) => rest.split(clause).join(''), ruleAndSetup)
        for (const pattern of POSSESSION_OR_CONTROL_CLAUSES) {
            if (pattern.test(undeclared)) failures.push(`${key}: a possession or control clause (${pattern}) with no declared ground: ${ruleAndSetup}`)
        }
        for (const [clause, kind, span] of declared) {
            if (!ruleAndSetup.includes(clause)) {
                failures.push(`${key}: the declared clause "${clause}" is not in the rule or its setup`)
                continue
            }
            if (kind === 'RULING' && wording.rule !== CHRISTIAN_APPROVED_RULES[key]) {
                failures.push(`${key}: "${clause}" is grounded on Christian's approved wording, which this rule does not say exactly`)
                continue
            }
            const ground = kind === 'CONDITION' ? rpcLibrary.primaryScoringCondition(rpcId!) : kind === 'RULING' ? CHRISTIAN_APPROVED_RULES[key] ?? '' : definitions[eventKey!] ?? ''
            if (!normaliseWhitespace(ground).includes(normaliseWhitespace(span))) {
                failures.push(`${key}: "${clause}" is grounded on "${span}", which is not verbatim in its ${kind === 'CONDITION' ? "context's approved condition" : kind === 'RULING' ? 'approved wording' : "event's definition"}`)
                continue
            }
            if (!POSSESSION_OR_CONTROL_CLAUSES.some((p) => p.test(clause))) failures.push(`${key}: the declared clause "${clause}" is not itself a possession or control clause`)
            // 'possession controlled' is accepted wherever a condition holds it, and only RPC-001's does; today only RPC-001's gate uses it, a reported departure: the rule is open-ended where the condition says on arrival.
            // Stage A2: a clause naming the possession as the qualifying sequence (SEQUENCE_CLAUSES) is no possession kept, and is held to its own span.
            const sequence = SEQUENCE_CLAUSES.find((s) => s.clause === clause)
            if (sequence && kind === 'CONDITION' && normaliseWhitespace(span) === normaliseWhitespace(sequence.span)) continue
            if (POSSESSION_KEPT_CLAUSES.some((p) => p.test(clause)) && !/retain|maintain|possession controlled/i.test(span)) failures.push(`${key}: "${clause}" (possession kept) is grounded on "${span}", which does not speak of keeping possession`)
            if (CONTROL_CLAUSES.some((p) => p.test(clause)) && !/control/i.test(span)) failures.push(`${key}: "${clause}" (control) is grounded on "${span}", which does not speak of control`)
            const overlapsAnExample = exampleClauses(ground).some((c) => {
                const t = normaliseWhitespace(ground)
                const s = normaliseWhitespace(span)
                for (let at = t.indexOf(s); at >= 0; at = t.indexOf(s, at + 1)) if (at < c.end && at + s.length > c.start) return true
                return false
            })
            if (spanIsExample(ground, span) || overlapsAnExample) onAnExample.push(key)
        }
    }
    for (const key of Object.keys(grounds)) if (!(key in rules)) failures.push(`${key}: grounds declared for a rule that does not exist`)
    return { failures, onAnExample }
}

const ATTACK_DEVELOPMENT_ZONE_AND_LINE = ['RPC-003|line_crossed|', 'RPC-003|target_zone_entered|']

/**
 * **The three Attack Development rules say Christian's approved wording, character for character** (11 November 2026). Christian:
 * "I approve removing the unsupported phrase "and your team keeps the ball" from all three affected Attack Development scoring rules."
 * and "approved interpretations should be protected by regression tests wherever practical." (received 11 November 2026, second
 * reply). What the coach is served carries the same words: each rule reaches a directive unchanged. The fourth Attack Development
 * rule, for the target player, had no such phrase and is held as it was.
 */
function testAttackDevelopmentRulesSayChristiansApprovedWording(): void {
    assert.deepEqual(Object.keys(CHRISTIAN_APPROVED_RULES).sort(), ['RPC-003|gate|', ...ATTACK_DEVELOPMENT_ZONE_AND_LINE].sort())
    for (const [key, approved] of Object.entries(CHRISTIAN_APPROVED_RULES)) assert.equal(COACH_RULES[key]?.rule, approved, `${key} says Christian's approved wording exactly`)
    const served = new Set(compatiblePairs().filter(({ rpcId }) => rpcId === 'RPC-003').flatMap(({ rpcId, gameFormId }) => resolvePrimaryScoringDirectives(rpcId, gameFormId).map((d) => d.scoringRule)))
    for (const [key, approved] of Object.entries(CHRISTIAN_APPROVED_RULES)) assert.ok(served.has(approved), `${key}: a directive serves Christian's approved wording unchanged`)
    assert.equal(COACH_RULES['RPC-003|target_player|']?.rule, 'Earn a point when a forward pass reaches your target player and they control it. Passing it around without moving forward never scores.', 'the target player rule is unchanged')
    for (const [key, wording] of Object.entries(COACH_RULES)) {
        if (key.startsWith('RPC-003|')) assert.doesNotMatch(wording.rule + ' ' + wording.setup, /keeps? the ball/i, `${key} still says the removed phrase`)
    }
}

/**
 * **Control on reception completes the zone and line events, and adds nothing after it** (11 November 2026). Christian: "A player
 * may also complete the event by dribbling through the relevant boundary." "Control on reception is judged by the coach in the
 * immediate scoring situation. It should not imply an additional retention period, subsequent mandatory pass, or universal
 * post-score possession consequence." (received 11 November 2026, second reply). So the zone and line rules keep both ways of
 * completing the event, their control clause ends its sentence, its ground is the approved meaning's span, and neither the rule nor
 * its setup states possession kept (the 2b list), a next action, a period or anything after the score. The gate is read the same
 * way for possession, a next action and the score.
 */
function testControlOnReceptionAddsNoRetentionNextPassOrPostScoreClause(): void {
    const AFTER_THE_EVENT = [/\bnext\b/i, /\bthen\b/i, /\bafter\b/i, /\bstill\b/i, /\buntil\b/i, /\bwhile\b/i, /\bseconds?\b/i, /\bcount/i, /\brestart/i, /\bkick-?off\b/i, /\bpossession\b/i]
    const COMPLETED_BY: Record<string, { dribbling: string; reception: string }> = {
        'RPC-003|target_zone_entered|': { dribbling: 'a player dribbles into the attacking zone', reception: 'receives the ball there and controls it' },
        'RPC-003|line_crossed|': { dribbling: 'a player dribbles over the attacking line', reception: 'receives the ball past it and controls it' },
    }
    for (const key of ATTACK_DEVELOPMENT_ZONE_AND_LINE) {
        const wording = COACH_RULES[key]!
        const [rpcId, eventKey] = key.split('|')
        const meaning = APPROVED_EVENT_MEANINGS.find((m) => m.rpcId === rpcId && m.eventKey === eventKey)
        assert.ok(meaning, `${key} has an approved meaning`)
        const firstSentence = wording.rule.split('. ')[0]!
        assert.ok(firstSentence.includes(COMPLETED_BY[key]!.dribbling), `${key} keeps completing the event by dribbling`)
        assert.ok(firstSentence.endsWith(COMPLETED_BY[key]!.reception), `${key} keeps control on reception, and nothing follows it in its sentence: ${wording.rule}`)
        assert.ok(COACH_RULE_GROUNDS[key]!.some(([clause, kind, span]) => clause === 'controls it' && kind === 'EVENT' && span === meaning!.controlledReception), `${key}: control on reception rests on the approved meaning's span`)
    }
    for (const key of [...ATTACK_DEVELOPMENT_ZONE_AND_LINE, 'RPC-003|gate|']) {
        const ruleAndSetup = COACH_RULES[key]!.rule + ' ' + COACH_RULES[key]!.setup
        for (const pattern of [...POSSESSION_KEPT_CLAUSES, ...AFTER_THE_EVENT]) assert.doesNotMatch(ruleAndSetup, pattern, `${key} states possession kept, a next action, a period or something after the score: ${ruleAndSetup}`)
    }
}

/**
 * **A teammate's control at a gate is Attack Development's alone** (11 November 2026). Christian: "This remains a narrow decision for
 * the Attack Development gate event. It should not become a universal requirement for all gate-based activities." (received 11
 * November 2026, second reply). Option 2's clause is said by RPC-003's gate rule and by no other rule. Among the gate rules, those
 * with a control clause are exactly the pinned list, each with why it stands; Goalkeeper Build-Out's and High Press Escape's gate
 * rules have none. The gate's controlled-vocabulary description stays traversal only and unreviewed, so the clause rests on
 * Christian's decision (a RULING ground in 2b), not on the vocabulary.
 */
function testTeammateControlAtAGateIsAttackDevelopmentsAlone(): void {
    const OPTION_2 = 'passes forward through it and a teammate controls it'
    assert.deepEqual(Object.keys(COACH_RULES).filter((key) => (COACH_RULES[key]!.rule + ' ' + COACH_RULES[key]!.setup).includes(OPTION_2)), ['RPC-003|gate|'], "Option 2's clause is RPC-003's gate rule's alone")
    const GATE_RULES_WITH_CONTROL: Readonly<Record<string, string>> = {
        'RPC-003|gate|': "Christian's Option 2, a narrow decision for the Attack Development gate event (received 11 November 2026, second reply)",
        'RPC-004|gate|': "Chance Creation's own condition, 'the ball is received under control', unchanged since 13 September 2026",
    }
    const gateRulesWithControl = Object.entries(COACH_RULES)
        .filter(([key]) => key.split('|')[1] === 'gate')
        .filter(([, wording]) => [...CONTROL_CLAUSES, /teammate/i].some((pattern) => pattern.test(wording.rule + ' ' + wording.setup)))
        .map(([key]) => key)
    assert.deepEqual(gateRulesWithControl.sort(), Object.keys(GATE_RULES_WITH_CONTROL).sort(), 'the gate rules with a control clause are exactly the pinned list')
    assert.ok(COACH_RULE_GROUNDS['RPC-004|gate|']!.some(([, kind]) => kind === 'CONDITION'), "RPC-004's gate control rests on its own condition")
    const gateDefinition = rpcLibrary.scoringEvents().find((event) => event.key === 'gate')?.definition ?? ''
    assert.ok(gateDefinition.length > 0, 'the gate has a controlled-vocabulary description')
    assert.doesNotMatch(gateDefinition, /control/i, 'the gate description is traversal only')
    assert.equal(eventMeaningStanding('RPC-003', 'gate'), 'UNREVIEWED', 'the gate description stays unreviewed')
}

/** Christian's approval of the controlled-reception meaning, verbatim, line by line as the reply gives it (received 11 November 2026, second reply). */
const CHRISTIAN_CONTROLLED_RECEPTION_APPROVAL = [
    'I approve the specific interpretation that controlled reception can complete the existing attacking-zone and attacking-line scoring events.',
    'A player may also complete the event by dribbling through the relevant boundary.',
    'Control on reception is judged by the coach in the immediate scoring situation. It should not imply an additional retention period, subsequent mandatory pass, or universal post-score possession consequence.',
    'I am not granting blanket approval to all controlled-vocabulary descriptions.',
]

/**
 * **The controlled-vocabulary approval covers two meanings and nothing else reads as approved** (11 November 2026). Christian: "I am
 * not granting blanket approval to all controlled-vocabulary descriptions." "Please preserve the distinction between the specific
 * meanings approved here and other descriptions that remain unreviewed." (received 11 November 2026, second reply). Across every
 * context and every event of the vocabulary, only Attack Development's zone and line read APPROVED. Each record entry carries
 * Christian's words, verbatim, in an approval the approved wording records' check accepts; reads its event's description verbatim,
 * so a changed description no longer matches it; and is scoped by the reply's own words, which name the attacking zone and the
 * attacking line, the names only RPC-003's rules use. 2b consumes it: the control-on-reception grounds that rest on an approved
 * meaning are exactly those two rules', on the recorded span.
 */
function testControlledVocabularyApprovalCoversTwoMeaningsOnly(): void {
    const definitions: Record<string, string> = Object.fromEntries(rpcLibrary.scoringEvents().map((event) => [event.key, event.definition]))
    const approved = rpcLibrary.contexts().flatMap((context) => Object.keys(definitions).filter((eventKey) => eventMeaningStanding(context.id, eventKey) === 'APPROVED').map((eventKey) => `${context.id}|${eventKey}|`))
    assert.deepEqual(approved.sort(), ATTACK_DEVELOPMENT_ZONE_AND_LINE, 'only Attack Development zone and line meanings read APPROVED')
    for (const eventKey of ['gate', 'target_player', 'goal', 'regain', 'denial']) assert.equal(eventMeaningStanding('RPC-003', eventKey), 'UNREVIEWED', `RPC-003 ${eventKey} stays unreviewed`)
    for (const rpcId of ['RPC-001', 'RPC-002', 'RPC-004', 'RPC-006']) {
        for (const eventKey of ['target_zone_entered', 'line_crossed']) assert.equal(eventMeaningStanding(rpcId, eventKey), 'UNREVIEWED', `${rpcId} ${eventKey} stays unreviewed`)
    }
    assert.equal(new Set(APPROVED_EVENT_MEANINGS.map((m) => `${m.rpcId}|${m.eventKey}`)).size, APPROVED_EVENT_MEANINGS.length, 'each meaning is recorded once')
    for (const meaning of APPROVED_EVENT_MEANINGS) {
        const label = `${meaning.rpcId} ${meaning.eventKey}`
        const approval: ReadingApproval = meaning.approvedBy
        assert.equal(approvalUnusableBecause(approval), null, `${label}: the approval is complete`)
        assert.equal(approval.who, 'Christian')
        assert.equal(approval.date, '2026-11-11')
        assert.ok(approval.filed.includes('(received 11 November 2026, second reply)'), `${label}: the approval names the reply`)
        assert.equal(approval.quote, CHRISTIAN_CONTROLLED_RECEPTION_APPROVAL.join(' '), `${label}: the approval quotes Christian verbatim`)
        assert.ok(rpcLibrary.scoringEventsForContext(meaning.rpcId).includes(meaning.eventKey), `${label}: the context scores through the event`)
        assert.ok((definitions[meaning.eventKey] ?? '').includes(meaning.dribbling), `${label}: "${meaning.dribbling}" is verbatim in the event's description`)
        assert.ok((definitions[meaning.eventKey] ?? '').includes(meaning.controlledReception), `${label}: "${meaning.controlledReception}" is verbatim in the event's description`)
        assert.ok(approval.quote.includes(meaning.controlJudgedBy), `${label}: who judges control is Christian's words`)
        assert.deepEqual([...meaning.doesNotImply], ['an additional retention period', 'subsequent mandatory pass', 'universal post-score possession consequence'])
        for (const words of meaning.doesNotImply) assert.ok(approval.quote.includes(words), `${label}: "${words}" is Christian's words`)
    }
    const namingAttackingZoneOrLine = Object.keys(COACH_RULES).filter((key) => /attacking (zone|line)/i.test(COACH_RULES[key]!.rule + ' ' + COACH_RULES[key]!.setup))
    assert.deepEqual(namingAttackingZoneOrLine.sort(), ATTACK_DEVELOPMENT_ZONE_AND_LINE, "the reply's attacking zone and attacking line are RPC-003's rules alone")
    const eventGroundsOnAnApprovedMeaning = Object.entries(COACH_RULE_GROUNDS).flatMap(([key, grounds]) =>
        grounds.filter(([, kind]) => kind === 'EVENT').filter(() => eventMeaningStanding(key.split('|')[0]!, key.split('|')[1]!) === 'APPROVED').map(([, , span]) => ({ key, span }))
    )
    assert.deepEqual(eventGroundsOnAnApprovedMeaning.map((ground) => ground.key).sort(), ATTACK_DEVELOPMENT_ZONE_AND_LINE, 'only the two rules rest on an approved meaning')
    for (const { key, span } of eventGroundsOnAnApprovedMeaning) {
        const [rpcId, eventKey] = key.split('|')
        assert.equal(span, APPROVED_EVENT_MEANINGS.find((m) => m.rpcId === rpcId && m.eventKey === eventKey)!.controlledReception, `${key} rests on the recorded span`)
    }
}

// ── Test 2c: an action word keeps its class (A02 package, stage W3, 11 November 2026) ──────────────────────────────────────────────

/**
 * Christian's approved sentences that may ground a coach rule's action words (DECISION grounds), each verbatim with its date: today the
 * three Attack Development rules approved under "Attacking Zone — Approved", "Attacking Line — Approved" and "Gate — Option 2 Approved"
 * (received 11 November 2026, second reply), pinned in CHRISTIAN_APPROVED_RULES above. A DECISION ground grounds a rule only where the
 * rule says it exactly, as 2b's RULING ground does.
 */
const DECISION_GROUNDS: Readonly<Record<string, { sentence: string; received: string }>> = Object.fromEntries(
    Object.entries(CHRISTIAN_APPROVED_RULES).map(([key, sentence]) => [key, { sentence, received: 'received 11 November 2026, second reply' }])
)

const NEXT_PASS_AWAITING_RELEASE =
    'AWAITING RELEASE: \'with the next pass\' names one kind of action where the approved condition names any, "the attacking team retains possession through the next action." ' +
    '(RPC-PROP-133, approved 13 September 2026). Our CANDIDATE wording (docs/audits/drafts/a02-composition/rpc-002-coach-rules.CANDIDATE.json) says the row\'s ' +
    "'through the next action', every other word kept; the live text is unchanged, held for the same release decision as the three approved Attack Development rules."
/**
 * Christian's rulings on a coach-facing word (WORD_RULING grounds), each verbatim with its date. A WORD_RULING grounds its action class only
 * in its context's rules and only where the rule says its phrase. Today one: A01's 'A long kick ... does not count' rests on the ruling
 * of SD-15's term, item 5c, "`long kick` may remain coach-facing wording rather than a canonical matching term." (received 20 September
 * 2026), with "long clearance" (RPC-PROP-132) the canonical term internally. Stage W3 first pinned these four as a departure from the
 * approved condition; the delivery check of 12 November 2026 found the ruling, so they rest on it instead (the realization's SD-15 reading,
 * realize.ts, already cites it).
 */
const WORD_RULINGS: ReadonlyArray<{ rpcId: string; phrase: string; actionClass: ActionClass; sentence: string; received: string }> = [
    {
        rpcId: 'RPC-001',
        phrase: 'long kick',
        actionClass: 'kick',
        sentence: '`long kick` may remain coach-facing wording rather than a canonical matching term.',
        received: 'received 20 September 2026',
    },
]

/**
 * **The action-word findings of the live coach rules, each with why it stands** (stage W3, measured 11 November 2026). Any finding not
 * listed, or a listed one no longer found, fails until the list is brought up to date. RPC-003's 'Passing it around' is not listed: it is
 * Christian's approved wording (a DECISION ground) on the zone, line and gate, and the target player's own event definition names a pass.
 * RPC-001's 'A long kick' is not listed: it rests on Christian's ruling of 20 September 2026 (a WORD_RULING ground).
 */
const ACTION_WORD_FINDINGS: Readonly<Record<string, string>> = {
    'RPC-002|line_crossed| (i) pass': NEXT_PASS_AWAITING_RELEASE,
    'RPC-002|target_zone_entered| (i) pass': NEXT_PASS_AWAITING_RELEASE,
    'RPC-002|gate| (i) pass': NEXT_PASS_AWAITING_RELEASE,
    'RPC-002|target_player| (i) pass': NEXT_PASS_AWAITING_RELEASE,
}
const HIGH_PRESS_ESCAPE_KEYS = ['RPC-002|line_crossed|', 'RPC-002|target_zone_entered|', 'RPC-002|gate|', 'RPC-002|target_player|']

interface ActionWordFinding {
    id: string
    message: string
}

/**
 * Test 2c's reading, over any table of rules and grounds. (i) A declared clause (2b's table) keeps its class: each specific action word in
 * it must be named, in its class, by its own ground, and a generic 'action' never grounds a specific word. (ii) Every other specific action
 * word of the rule and its setup must be named, in its class, by the event's controlled-vocabulary definition, the context's approved
 * condition, a DECISION ground the rule says exactly, or a WORD_RULING of its context whose phrase the rule says. A finding is
 * `${key} (i|ii) ${class}`.
 */
function actionWordFindings(rules: CoachRuleTable, grounds: CoachRuleGrounds, decisions = DECISION_GROUNDS, wordRulings = WORD_RULINGS): ActionWordFinding[] {
    const definitions: Record<string, string> = Object.fromEntries(rpcLibrary.scoringEvents().map((event) => [event.key, event.definition]))
    const findings: ActionWordFinding[] = []
    for (const [key, wording] of Object.entries(rules)) {
        const [rpcId, eventKey] = key.split('|')
        const declared = grounds[key] ?? []
        for (const [clause, kind, span] of declared) {
            for (const actionClass of actionClassesIn(clause)) {
                if (actionClassesIn(span).includes(actionClass)) continue
                const generic = namesGenericAction(span) ? ", which names only the generic 'action'" : ''
                findings.push({ id: `${key} (i) ${actionClass}`, message: `${key}: '${actionClass}' in the declared clause "${clause}" is not named by its ${kind} ground "${span}"${generic}` })
            }
        }
        const undeclared = declared.reduce((rest, [clause]) => rest.split(clause).join(' '), wording.rule + ' ' + wording.setup)
        const decision = decisions[key] && wording.rule === decisions[key]!.sentence ? decisions[key]!.sentence : ''
        const ruled = wordRulings.filter((ruling) => ruling.rpcId === rpcId && undeclared.toLowerCase().includes(ruling.phrase.toLowerCase())).map((ruling) => ruling.actionClass)
        const grounded = new Set<ActionClass>([...actionClassesIn(definitions[eventKey!] ?? ''), ...actionClassesIn(rpcLibrary.primaryScoringCondition(rpcId!)), ...actionClassesIn(decision), ...ruled])
        for (const actionClass of actionClassesIn(undeclared)) {
            if (grounded.has(actionClass)) continue
            const words = actionWordsIn(undeclared).filter((word) => word.actionClass === actionClass).map((word) => `'${word.word}'`)
            findings.push({ id: `${key} (ii) ${actionClass}`, message: `${key}: ${words.join(', ')} (${actionClass}) is named by neither its event's definition, its context's approved condition, nor a DECISION ground` })
        }
    }
    return findings
}

/**
 * **Test 2c: an action word of a coach rule keeps its class** (A02 package, stage W3, 11 November 2026). High Press Escape's rules say
 * 'with the next pass' where the approved row says "through the next action" (RPC-PROP-133, approved 13 September 2026); Christian: "That
 * appears to introduce an unsupported restriction on the players' possible solutions." and "What automated safeguard could have detected
 * this problem before it affected another activity?" (received 11 November 2026, second reply). Test 2b reads possession and control
 * clauses; it read 'keeps the ball with the next pass' as possession kept, grounded on the row's retention, and passed it: the action word
 * inside the clause was never read. This test reads it, over every coach rule key, through the one tests-only reader (action-words.ts):
 * (i) and (ii) as actionWordFindings says, (iii) the findings equal the pinned list, each with why it stands, (iv) the reader finds 'pass'
 * in today's High Press Escape rule. Its limit is the reader's: it sees words, not meaning ('with the next play' passes unread; 'touch' and
 * 'turn' are read since stage B1 of the A02 complete-activity package, 12 November 2026).
 */
function testAnActionWordKeepsItsClass(): void {
    // (iv) The reader, on today's rule and on every form of every class.
    assert.deepEqual(actionClassesIn(COACH_RULES['RPC-002|line_crossed|']!.rule), ['pass', 'dribble'], "the reader finds 'pass' in today's High Press Escape rule")
    assert.ok(actionWordsIn(COACH_RULES['RPC-002|line_crossed|']!.rule).some((word) => word.actionClass === 'pass' && word.word === 'pass'))
    const FORMS: Record<ActionClass, string[]> = {
        pass: ['pass', 'passes', 'passed', 'passing'],
        dribble: ['dribble', 'dribbles', 'dribbled', 'dribbling'],
        shot: ['shot', 'shots', 'shoot', 'shoots', 'shooting'],
        kick: ['kick', 'kicks', 'kicked', 'kicking'],
        cross: ['cross', 'crosses', 'crossed', 'crossing'],
        clearance: ['clearance', 'clearances', 'clears', 'cleared'],
        header: ['header', 'headers', 'headed'],
        carry: ['carry', 'carries', 'carried', 'carrying'],
        // Stage B1 of the A02 complete-activity package (12 November 2026, UA2 E5): 'touch' and 'turn' are specific classes, so a
        // continuation narrowed to a touch is read (Christian, received 12 November 2026, item 2: "For a player already carrying or dribbling,
        // please avoid introducing an artificial extra touch, distance or time requirement simply to create a separate action.").
        touch: ['touch', 'touches', 'touched', 'touching'],
        turn: ['turn', 'turns', 'turned', 'turning'],
    }
    assert.deepEqual(Object.keys(FORMS), [...ACTION_CLASSES], 'the fixture covers every class, in the reader\'s order')
    assert.deepEqual(Object.keys(ACTION_WORD_FORMS), [...ACTION_CLASSES])
    for (const [actionClass, forms] of Object.entries(FORMS)) {
        for (const form of forms) {
            for (const written of [form, form.toUpperCase(), form[0]!.toUpperCase() + form.slice(1)]) assert.deepEqual(actionClassesIn(`and then ${written}.`), [actionClass], `'${written}' reads as ${actionClass}`)
        }
    }
    // RE-PINNED OPENLY (stage B1, 12 November 2026). BEFORE: 'touch' was in this list (it named no class). AFTER: 'touch' is a class, so it
    // leaves the list; 'touchline', 'turnover' and 'turnaround' join it (other words, which whole-word reading never takes for 'touch' or 'turn').
    for (const word of ['past', 'across', 'passive', 'bypass', 'carrier', 'clear', 'clearly', 'heading', 'head', 'touchline', 'turnover', 'turnaround', 'line_crossed', 'action', 'actions'])
        assert.deepEqual(actionClassesIn(`and then ${word}.`), [], `'${word}' names no specific class`)
    assert.equal(namesGenericAction('through the next action'), true)
    assert.equal(namesGenericAction('a transaction'), false)

    // (i)-(iii) Over every coach rule key: the findings are exactly the pinned list.
    const live = actionWordFindings(COACH_RULES, COACH_RULE_GROUNDS)
    assert.deepEqual(live.map((f) => f.id).sort(), Object.keys(ACTION_WORD_FINDINGS).sort(), `the action-word findings are exactly the pinned list:\n${live.map((f) => f.message).join('\n')}`)
    for (const [id, why] of Object.entries(ACTION_WORD_FINDINGS)) assert.ok(why.startsWith('AWAITING RELEASE'), `${id}: says why it stands`)
    assert.deepEqual(Object.keys(ACTION_WORD_FINDINGS).filter((id) => ACTION_WORD_FINDINGS[id]!.startsWith('AWAITING RELEASE')), HIGH_PRESS_ESCAPE_KEYS.map((key) => `${key} (i) pass`), "the live High Press Escape four are pinned 'awaiting release'")
    for (const finding of live.filter((f) => f.id.startsWith('RPC-002|'))) assert.match(finding.message, /names only the generic 'action'/, `${finding.id}: a generic 'action' never grounds a specific word`)
    assert.ok(Object.keys(COACH_RULES).length >= 28 && live.length === 4, 'every coach rule key was read')

    // The WORD_RULING kind is what grounds A01's 'A long kick' (measured without it: the four RPC-001 rules) ...
    const withoutWordRulings = actionWordFindings(COACH_RULES, COACH_RULE_GROUNDS, DECISION_GROUNDS, [])
    assert.deepEqual(
        withoutWordRulings.map((f) => f.id).filter((id) => !(id in ACTION_WORD_FINDINGS)).sort(),
        ['RPC-001|gate| (ii) kick', 'RPC-001|line_crossed| (ii) kick', 'RPC-001|target_player| (ii) kick', 'RPC-001|target_zone_entered| (ii) kick']
    )
    // ... only where the rule says its phrase ('A kick' alone is not 'long kick') ...
    const shortened = { ...COACH_RULES, 'RPC-001|line_crossed|': { ...COACH_RULES['RPC-001|line_crossed|']!, rule: COACH_RULES['RPC-001|line_crossed|']!.rule.replace('A long kick', 'A kick') } }
    assert.ok(COACH_RULES['RPC-001|line_crossed|']!.rule.includes('A long kick'), "A01's line rule says 'A long kick' today")
    assert.ok(actionWordFindings(shortened, COACH_RULE_GROUNDS).some((f) => f.id === 'RPC-001|line_crossed| (ii) kick'), 'a WORD_RULING grounds only its phrase')
    // ... and only in its own context (the same phrase in Chance Creation's rule is not grounded by an A01 ruling).
    const elsewhere = { ...COACH_RULES, 'RPC-004|target_zone_entered|': { ...COACH_RULES['RPC-004|target_zone_entered|']!, rule: COACH_RULES['RPC-004|target_zone_entered|']!.rule.replace('A hopeful ball', 'A long kick') } }
    assert.ok(actionWordFindings(elsewhere, COACH_RULE_GROUNDS).some((f) => f.id === 'RPC-004|target_zone_entered| (ii) kick'), 'a WORD_RULING grounds only its own context')

    // The DECISION kind is what grounds Attack Development's 'Passing it around' on the zone and line (measured without it).
    const withoutDecisions = actionWordFindings(COACH_RULES, COACH_RULE_GROUNDS, {})
    assert.deepEqual(withoutDecisions.map((f) => f.id).filter((id) => !(id in ACTION_WORD_FINDINGS)).sort(), ['RPC-003|line_crossed| (ii) pass', 'RPC-003|target_zone_entered| (ii) pass'])
    // ... and only where the rule says Christian's sentence exactly: one word changed and the DECISION ground no longer applies.
    const drifted = { ...COACH_RULES, 'RPC-003|line_crossed|': { ...COACH_RULES['RPC-003|line_crossed|']!, rule: COACH_RULES['RPC-003|line_crossed|']!.rule.replace('Passing it around', 'Passing the ball around') } }
    assert.ok(actionWordFindings(drifted, COACH_RULE_GROUNDS).some((f) => f.id === 'RPC-003|line_crossed| (ii) pass'), 'a DECISION ground not said exactly grounds nothing')
    // (ii) catches a specific word in an undeclared clause (fixture: a kick added to a Chance Creation rule).
    const kicked = { ...COACH_RULES, 'RPC-004|target_zone_entered|': { ...COACH_RULES['RPC-004|target_zone_entered|']!, rule: COACH_RULES['RPC-004|target_zone_entered|']!.rule.replace('A hopeful ball', 'A hopeful kick') } }
    assert.deepEqual(actionWordFindings(kicked, COACH_RULE_GROUNDS).map((f) => f.id).filter((id) => !(id in ACTION_WORD_FINDINGS)), ['RPC-004|target_zone_entered| (ii) kick'])
}

/** Christian's item 4, verbatim, line by line as the reply gives it (received 11 November 2026, second reply). */
const CHRISTIAN_HIGH_PRESS_ESCAPE_ITEM = [
    'Your additional finding about High Press Escape is important, particularly because A02 is our current foundational test.',
    'The approved wording refers to retaining possession through the next action, while the existing coach-facing rules specify the next pass.',
    "That appears to introduce an unsupported restriction on the players' possible solutions.",
    'Please include a focused source-to-code check in the A02 work and prepare the smallest correction that faithfully preserves the approved meaning.',
    'Where the intended interpretation is already unambiguous, you may correct it within the isolated, non-deployed pathway and test it.',
    'If the meaning of a qualifying action or its scoring consequence requires a new substantive coaching decision, retain that as a clearly identified question for my review.',
    "I don't want to prescribe passing when a dribble or another functional action may legitimately solve the problem.",
]
/** Christian's other words the CANDIDATE file quotes, verbatim (received 11 November 2026, second reply). */
const CHRISTIAN_OTHER_WORDS = ['It should not become a universal requirement for all gate-based activities.']

/** The live High Press Escape rules, word for word: unchanged by stage W3, awaiting release. */
const LIVE_HIGH_PRESS_ESCAPE_RULES: Readonly<Record<string, string>> = {
    'RPC-002|line_crossed|': 'Earn a point when a player dribbles over the line behind the press, or receives the ball past it and controls it, and your team keeps the ball with the next pass. The other team presses from the start of every attack.',
    'RPC-002|target_zone_entered|': 'Earn a point when a player dribbles into the target zone behind the press, or receives the ball there and controls it, and your team keeps the ball with the next pass. The other team presses from the start of every attack.',
    'RPC-002|gate|': 'Earn a point when a player passes or dribbles through a gate behind the press and your team keeps the ball with the next pass. The other team presses from the start of every attack.',
    'RPC-002|target_player|': 'Earn a point when your target player behind the press receives the ball and controls it, and your team keeps the ball with the next pass. The other team presses from the start of every attack.',
}

/**
 * 2b's grounds with the overlay's replacement made in each covered rule's declared clauses (the spans are the rows' words, unchanged). Stage B2:
 * and each declared rule change made where its words stand in the clause (the clause must read as the candidate rule reads).
 */
function groundsUnder(overlay: CandidateCoachRules): CoachRuleGrounds {
    const covered = new Set(overlay.rules.map((rule) => rule.key))
    const declared = (clause: string) => (overlay.declared ?? []).filter((d) => d.in === 'rule').reduce((text, d) => (text.includes(d.from) ? text.replace(d.from, d.to) : text), clause)
    // Stage A2: where a candidate rule says a sequence clause (SEQUENCE_CLAUSES), its ground is the condition's span for the sequence.
    const sequenceGrounds = (key: string) => {
        const candidate = overlay.rules.find((rule) => rule.key === key)?.candidate ?? ''
        return SEQUENCE_CLAUSES.filter((s) => candidate.includes(s.clause)).map((s) => [s.clause, 'CONDITION', s.span] as [string, 'CONDITION', string])
    }
    return Object.fromEntries(
        Object.entries(COACH_RULE_GROUNDS).map(([key, grounds]) => [key, covered.has(key) ? [...grounds.map(([clause, kind, span]) => [declared(clause.replace(overlay.replacement.from, overlay.replacement.to)), kind, span]), ...sequenceGrounds(key)] : grounds])
    ) as CoachRuleGrounds
}

/** The overlay with other words in place of the replacement's new words (a TEST-ONLY copy, never written). Stage B2: the declared changes are dropped (and the setups kept), so the copy measures the replacement alone, as before. */
function overlayWith(overlay: CandidateCoachRules, to: string): CandidateCoachRules {
    const copy: CandidateCoachRules = JSON.parse(JSON.stringify(overlay))
    copy.replacement.to = to
    delete copy.declared
    for (const rule of copy.rules) {
        rule.candidate = rule.live.replace(copy.replacement.from, to)
        delete rule.setupCandidate
    }
    return copy
}

/** Christian's words of 12 November 2026 the declared changes quote, verbatim (received 12 November 2026, item 1 and item 2). */
const CHRISTIAN_12_NOVEMBER_WORDS = [
    'I approve replacing "with the next pass" with "through the next action" in principle for the four High Press Escape rules.',
    "Whose action: The attacking team's next relevant ball action following completion of the scoring event.",
    'A qualifying sequence begins when the attacking team possesses the ball while facing established, coordinated defensive pressure.',
    'A scoring event must occur within a sequence that began under coordinated pressure.',
    'I want this represented through an observable game situation, not merely through instructions telling players or defenders what they must do.',
    // Stage A2 (13 November 2026): the origin sentence carries Christian's "not necessarily" (received 12 November 2026).
    'An isolated defender closing down the ball does not necessarily constitute coordinated pressure.',
]
/**
 * The four candidate rules held for Christian's review with the complete A02 activity (stage B2; DESIGN section 1), word for word.
 * RE-PINNED OPENLY (stage A2, 13 November 2026, the lead's decision W1). BEFORE: each ended 'It counts only if the attack started against the
 * other team pressing together.' AFTER: 'It counts only if your team faced the other team pressing together before it scored in that
 * possession (one player closing down alone does not necessarily count).' WHY: 'attack' read as stricter than the possession Christian's ruling
 * names (Christian keeps a restart, a change of possession and a new attack apart, received 8 November 2026), and "not necessarily" is
 * Christian's (received 12 November 2026); the press need not still be there when the team scores. Still CANDIDATE, held; COACH_RULES unchanged.
 * RE-PINNED OPENLY (FIX, 13 November 2026, from the V4 verification, L2). BEFORE: '... before it scored in that possession ...'. AFTER: '...
 * before scoring in that possession ...'. WHY: the 'it' could be read as the other team. Our CANDIDATE wording, for the lead to confirm.
 */
const CANDIDATE_HIGH_PRESS_ESCAPE_RULES: Readonly<Record<string, string>> = {
    'RPC-002|line_crossed|': 'Earn a point when a player dribbles over the line behind the press, or receives the ball past it and controls it, and your team keeps the ball through its next action. It counts only if your team faced the other team pressing together before scoring in that possession (one player closing down alone does not necessarily count).',
    'RPC-002|target_zone_entered|': 'Earn a point when a player dribbles into the target zone behind the press, or receives the ball there and controls it, and your team keeps the ball through its next action. It counts only if your team faced the other team pressing together before scoring in that possession (one player closing down alone does not necessarily count).',
    'RPC-002|gate|': 'Earn a point when a player passes or dribbles through a gate behind the press and your team keeps the ball through its next action. It counts only if your team faced the other team pressing together before scoring in that possession (one player closing down alone does not necessarily count).',
    'RPC-002|target_player|': 'Earn a point when your target player behind the press receives the ball and controls it, and your team keeps the ball through its next action. It counts only if your team faced the other team pressing together before scoring in that possession (one player closing down alone does not necessarily count).',
}

/**
 * **High Press Escape's CANDIDATE wording: the source's 'through the next action', every other word kept, never live** (A02 package,
 * stage W3, 11 November 2026). Christian: "Please include a focused source-to-code check in the A02 work and prepare the smallest
 * correction that faithfully preserves the approved meaning." "Where the intended interpretation is already unambiguous, you may correct it
 * within the isolated, non-deployed pathway and test it." (received 11 November 2026, second reply). The file passes its gate
 * (candidate-coach-rules.ts); the live four are unchanged and pinned; the source-to-code check corrects only the CONTROL clauses it finds
 * NARROWED and reports the rest; the candidate passes the wording checks (CCS, coach voice, evidence) unchanged, so no paraphrase is
 * ours; 2b and 2c pass over it; the questions it leaves open are Christian's (Q-a to Q-d); it enters no approved wording.
 */
function testHighPressEscapeCandidateWording(): void {
    const overlay = loadCandidateCoachRules()
    const { from, to } = overlay.replacement
    assert.deepEqual([from, to], ['with the next pass', 'through the next action'])
    assert.ok(rpcLibrary.primaryScoringCondition('RPC-002').includes('the attacking team retains possession through the next action'), "the new words are the approved row's")
    assert.equal(overlay.label, 'CANDIDATE')
    assert.ok(overlay.rules.every((rule) => rule.label === 'CANDIDATE'), 'every candidate is labelled CANDIDATE')
    assert.ok(overlay.standing.startsWith('CANDIDATE - TEST-ONLY, NOT APPROVED, NOT LIVE.'))
    for (const words of overlay.basis.authority) {
        assert.ok(CHRISTIAN_HIGH_PRESS_ESCAPE_ITEM.includes(words.quote), `"${words.quote}" is Christian's, verbatim`)
        assert.equal(words.received, 'received 11 November 2026, second reply')
    }
    for (const question of overlay.questions) for (const words of question.christian) assert.ok([...CHRISTIAN_HIGH_PRESS_ESCAPE_ITEM, ...CHRISTIAN_OTHER_WORDS].includes(words.quote), `${question.id}: "${words.quote}" is Christian's, verbatim`)
    // Stage A2 (13 November 2026, V2 finding 13): Q-a to Q-d are answered by Christian's ruling received 12 November 2026, each sentence verbatim
    // in the recorded ruling (a02-inputs.review.json, A02-12NOV-NEXT-ACTION); Q-a's gate-completion part stays open. Bite: a sentence altered.
    const nextAction = (JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'design-reasoning', 'a02-inputs.review.json'), 'utf8')).rulings as Array<{ id: string; words: string[] }>).find((r) => r.id === 'A02-12NOV-NEXT-ACTION')!.words
    const unanswered = (questions: typeof overlay.questions) => questions.filter((q) => !q.answeredBy || q.answeredBy.ruling !== 'A02-12NOV-NEXT-ACTION' || q.answeredBy.received !== 'received 12 November 2026' || !q.answeredBy.quotes.every((quote) => nextAction.includes(quote))).map((q) => q.id)
    assert.deepEqual(unanswered(overlay.questions), [])
    assert.deepEqual(overlay.questions.filter((q) => q.answeredBy?.stillOpen).map((q) => q.id), ['Q-a'], "only Q-a keeps a part open (the gate's completion)")
    assert.deepEqual(unanswered(overlay.questions.map((q) => (q.id === 'Q-b' ? { ...q, answeredBy: { ...q.answeredBy!, quotes: ['What counts: A meaningful continuation such as a pass.'] } } : q))), ['Q-b'], 'bite: a sentence not verbatim is caught')
    // The gate's shape rule for an answer, with its bite: an answer naming no sentence is refused.
    const noSentence = JSON.parse(JSON.stringify(overlay))
    noSentence.questions[0].answeredBy.quotes = []
    assert.ok(candidateCoachRulesRefusals(noSentence).some((why) => why.includes('question Q-a: its answer names no ruling, no date received or no sentence that answers it')), 'bite: an answer with no sentence is refused by the gate')

    // The live four are unchanged, word for word, and the candidate covers exactly them.
    assert.deepEqual(overlay.rules.map((rule) => rule.key), HIGH_PRESS_ESCAPE_KEYS)
    for (const key of HIGH_PRESS_ESCAPE_KEYS) assert.equal(COACH_RULES[key]!.rule, LIVE_HIGH_PRESS_ESCAPE_RULES[key], `${key}: the live rule is unchanged (awaiting release)`)
    // RE-PINNED OPENLY (stage B2 of the A02 complete-activity package, 12 November 2026). BEFORE: each candidate was the live rule with only
    // 'with the next pass' made 'through the next action', its setup kept. AFTER: the candidate of DESIGN section 1, the live rule with that
    // replacement and the three declared changes (ITS: 'through its next action'; ORIGIN: the live origin sentence replaced by the observable
    // condition; ORIGIN-SETUP: the setup drops it). WHY: Christian, received 12 November 2026: "I approve replacing "with the next pass" with
    // "through the next action" in principle for the four High Press Escape rules." and item 1 (the observable start under coordinated
    // pressure), the final wording held for review with the complete A02 activity. Never live: the live four, pinned above, are unchanged.
    for (const rule of overlay.rules) assert.equal(rule.candidate, CANDIDATE_HIGH_PRESS_ESCAPE_RULES[rule.key], `${rule.key}: the replacement and the declared changes, every other word kept`)
    for (const rule of overlay.rules) assert.equal(rule.setupCandidate, COACH_RULES[rule.key]!.setup.replace(' The other team presses from the start of every attack.', ''), `${rule.key}: the setup drops the origin sentence, every other word kept`)
    assert.deepEqual((overlay.declared ?? []).map((d) => [d.id, d.in, d.from, d.to]), [
        ['ITS', 'rule', 'through the next action', 'through its next action'],
        ['ORIGIN', 'rule', 'The other team presses from the start of every attack.', 'It counts only if your team faced the other team pressing together before scoring in that possession (one player closing down alone does not necessarily count).'],
        ['ORIGIN-SETUP', 'setup', ' The other team presses from the start of every attack.', ''],
    ], 'exactly the three declared changes')
    for (const d of overlay.declared ?? []) for (const words of d.christian) {
        assert.ok(CHRISTIAN_12_NOVEMBER_WORDS.includes(words.quote), `${d.id}: "${words.quote}" is Christian's, verbatim`)
        assert.equal(words.received, 'received 12 November 2026')
    }

    // The source-to-code check, pinned: per rule, each component's verdict; only the CONTROL clauses NARROWED and corrected. Re-pinned openly
    // (stage B2): BEFORE the ORIGIN clause was 'OVER_APPLIED REPORTED_NOT_CHANGED'; AFTER 'OVER_APPLIED CORRECTED_IN_CANDIDATE' (the declared ORIGIN).
    const verdicts = overlay.sourceToCode.map((check) => [check.key, check.clauses.map((clause) => `${clause.in} ${clause.component} ${clause.verdict} ${clause.action}`)])
    const OUTSIDE = ['rule PROGRESSION REALIZATION REPORTED_NOT_CHANGED', 'rule CONTROL NARROWED CORRECTED_IN_CANDIDATE', 'rule ORIGIN OVER_APPLIED CORRECTED_IN_CANDIDATE', 'setup PROGRESSION REALIZATION REPORTED_NOT_CHANGED']
    assert.deepEqual(verdicts, [
        ['RPC-002|line_crossed|', ['rule EVENT FAITHFUL REPORTED_NOT_CHANGED', 'rule EVENT FAITHFUL REPORTED_NOT_CHANGED', ...OUTSIDE]],
        ['RPC-002|target_zone_entered|', ['rule EVENT FAITHFUL REPORTED_NOT_CHANGED', 'rule EVENT FAITHFUL REPORTED_NOT_CHANGED', ...OUTSIDE]],
        ['RPC-002|gate|', ['rule EVENT FAITHFUL REPORTED_NOT_CHANGED', ...OUTSIDE]],
        ['RPC-002|target_player|', ['rule EVENT FAITHFUL REPORTED_NOT_CHANGED', 'rule EVENT WIDER REPORTED_NOT_CHANGED', ...OUTSIDE]],
    ])
    for (const check of overlay.sourceToCode) {
        const eventKey = check.key.split('|')[1]!
        for (const clause of check.clauses.filter((c) => c.component === 'EVENT')) assert.equal(clause.eventStanding, eventMeaningStanding('RPC-002', eventKey), `${check.key}: the event description's standing is recorded as it is`)
    }
    // The other approved rows: every row of RPC-002 that names a specific action is listed with its reading, and none is a scoring condition
    // or a scoring event; no row of RPC-002 names a pass as the next action (the one 'pass' read is a validation that passes).
    const naming: string[] = []
    for (const table of Object.values(rpcWorkbook as unknown as Record<string, unknown>)) {
        if (!Array.isArray(table)) continue
        for (const row of table as Record<string, unknown>[]) {
            if (row['rpc_id'] !== 'RPC-002') continue
            const id = String(Object.values(row)[0])
            const texts = Object.values(row).filter((value): value is string => typeof value === 'string')
            if (texts.some((text) => actionClassesIn(text).length)) naming.push(id)
        }
    }
    assert.deepEqual(naming.sort(), overlay.otherRowsNamingAnAction.map((row) => row.rowId).sort(), 'every RPC-002 row naming a specific action is read and listed')
    assert.deepEqual(overlay.otherRowsNamingAnAction.map((row) => [row.rowId, row.actionClass]), [['RPC-PROP-026', 'clearance'], ['RPC-PROP-027', 'dribble'], ['RPC-VAL-009', 'pass']])
    for (const row of overlay.otherRowsNamingAnAction) assert.notEqual(libraryRow(row.rowId)!.row['property_category'], 'PRIMARY_SCORING_CONDITION', `${row.rowId} is no scoring condition`)
    assert.deepEqual(overlay.questions.map((q) => q.id), ['Q-a', 'Q-b', 'Q-c', 'Q-d'])
    assert.ok(overlay.questions.every((q) => q.sources.some((s) => s.rowId === 'RPC-PROP-133')), 'each question cites the approved condition')

    // The candidate passes the wording checks unchanged (a rewrite would be a paraphrase, which is Christian's), 2b and 2c.
    const overlaid = overlaidCoachRules(overlay)
    for (const key of HIGH_PRESS_ESCAPE_KEYS) {
        assert.deepEqual(coachWordingFailures(key, overlaid[key]!), [], `${key}: the CANDIDATE wording passes CCS, coach voice and evidence unchanged`)
        assert.deepEqual(findCommunicationStandardViolations(overlaid[key]!.rule), [])
        assert.equal(toCoachScoringSentence(overlaid[key]!.rule), overlaid[key]!.rule, `${key}: the coach-voice pass does not rewrite the CANDIDATE sentence`)
        // Re-pinned openly (stage B2): BEFORE the setup was kept; AFTER it is the candidate setup (the origin sentence dropped). Evidence kept.
        assert.deepEqual([overlaid[key]!.setup, overlaid[key]!.evidence], [COACH_RULES[key]!.setup.replace(' The other team presses from the start of every attack.', ''), COACH_RULES[key]!.evidence], `${key}: candidate setup, evidence kept`)
    }
    for (const key of Object.keys(COACH_RULES)) if (!HIGH_PRESS_ESCAPE_KEYS.includes(key)) assert.deepEqual(overlaid[key], COACH_RULES[key], `${key}: untouched by the overlay`)
    const overlaidGrounds = groundsUnder(overlay)
    // Re-pinned openly (stage B2): BEFORE 'keeps the ball through the next action'; AFTER with the declared ITS made ('its', ours).
    // Re-pinned openly (stage A2, 13 November 2026): BEFORE the one ground; AFTER with 'in that possession', a sequence clause (the decided
    // origin sentence), grounded on the condition's words for the sequence.
    assert.deepEqual(overlaidGrounds['RPC-002|gate|'], [
        ['keeps the ball through its next action', 'CONDITION', 'the attacking team retains possession through the next action'],
        ['in that possession', 'CONDITION', 'The sequence begins under established coordinated pressure'],
    ])
    assert.deepEqual(possessionOrControlFindings(overlaid, overlaidGrounds), { failures: [], onAnExample: [] }, '2b holds over the CANDIDATE wording')
    // Bite (stage A2): 'in that possession' grounded on any other span is read as a possession kept, and refused; with no ground, refused.
    const misgrounded = Object.fromEntries(Object.entries(overlaidGrounds).map(([key, grounds]) => [key, grounds.map(([clause, kind, span]) => (clause === 'in that possession' ? [clause, kind, 'established coordinated pressure'] : [clause, kind, span]))])) as CoachRuleGrounds
    assert.ok(possessionOrControlFindings(overlaid, misgrounded).failures.some((f) => f.includes('"in that possession" (possession kept)')), 'bite: a sequence clause on another span is caught')
    const ungrounded = Object.fromEntries(Object.entries(overlaidGrounds).map(([key, grounds]) => [key, grounds.filter(([clause]) => clause !== 'in that possession')])) as CoachRuleGrounds
    assert.ok(possessionOrControlFindings(overlaid, ungrounded).failures.some((f) => f.includes('(/possession/i) with no declared ground')), 'bite: the clause without its ground is caught')
    const overlaidFindings = actionWordFindings(overlaid, overlaidGrounds).map((f) => f.id).sort()
    assert.deepEqual(overlaidFindings, Object.keys(ACTION_WORD_FINDINGS).filter((id) => !id.startsWith('RPC-002|')).sort(), '2c: the four High Press Escape findings are gone under the CANDIDATE wording, and nothing else moves')
    const gatesWithControl = (table: CoachRuleTable) => Object.keys(table).filter((key) => key.split('|')[1] === 'gate' && [...CONTROL_CLAUSES, /teammate/i].some((p) => p.test(table[key]!.rule + ' ' + table[key]!.setup)))
    assert.deepEqual(gatesWithControl(overlaid), gatesWithControl(COACH_RULES), 'Option 2 is not carried over to the High Press Escape gate')

    // Negative controls: another specific action in place of the row's 'action' fails 2c (i) on all four, and the gate refuses it.
    for (const other of ['through the next dribble', 'through the next pass']) {
        const doctored = overlayWith(overlay, other)
        const actionClass = actionClassesIn(other)[0]!
        assert.deepEqual(actionWordFindings(overlaidCoachRules(doctored), groundsUnder(doctored)).map((f) => f.id).filter((id) => id.startsWith('RPC-002|')), HIGH_PRESS_ESCAPE_KEYS.map((key) => `${key} (i) ${actionClass}`), `'${other}' fails 2c`)
        assert.ok(candidateCoachRulesRefusals(doctored).some((why) => why.includes(`the new words "${other}" are not verbatim in RPC-PROP-133`)), `'${other}' is refused by the gate`)
    }
    // RE-PINNED OPENLY (stage B1 of the A02 complete-activity package, 12 November 2026; UA2 E5). BEFORE: the reader's limit was measured
    // here, 'through the next touch' passed 2c unread ([] findings). AFTER: 'touch' is a specific class, so the same doctored wording fails 2c
    // (i) on all four, as 'dribble' and 'pass' do above. WHY: Christian, received 12 November 2026, item 2, rules out "an artificial extra
    // touch"; a continuation narrowed to a touch must be caught, not passed unread. The gate still refuses it (not the row's words).
    const touch = overlayWith(overlay, 'through the next touch')
    assert.deepEqual(actionWordFindings(overlaidCoachRules(touch), groundsUnder(touch)).map((f) => f.id).filter((id) => id.startsWith('RPC-002|')), HIGH_PRESS_ESCAPE_KEYS.map((key) => `${key} (i) touch`), "'touch' is read and fails 2c")
    assert.ok(candidateCoachRulesRefusals(touch).length > 0)
    // The reader's limit, measured again: an action named outside its classes still passes 2c unread ('play' is no class); the gate refuses it.
    const play = overlayWith(overlay, 'through the next play')
    assert.deepEqual(actionWordFindings(overlaidCoachRules(play), groundsUnder(play)).map((f) => f.id).filter((id) => id.startsWith('RPC-002|')), [], "the limit: 'play' is not read")
    assert.ok(candidateCoachRulesRefusals(play).length > 0)
    // The gate: a paraphrase, a drifted live text, a missing rule, an APPROVED label, a wrong line, a clause not verbatim, a narrowing left in place.
    const gateRefuses = (alter: (copy: any) => void, expected: string) => {
        const copy: any = JSON.parse(JSON.stringify(overlay))
        alter(copy)
        const reasons = candidateCoachRulesRefusals(copy)
        assert.ok(reasons.some((why) => why.includes(expected)), `the gate refuses: ${expected} (it said ${JSON.stringify(reasons)})`)
    }
    gateRefuses((c) => (c.rules[0].candidate = c.rules[0].candidate.replace('keeps the ball', 'keeps possession')), 'the candidate is not the live rule with only')
    // Stage B2 (W8): an undeclared extra word is refused; a declared change dropped from the file, or its words changed, leaves the candidates
    // unexplained; a setup changed beyond the declared change is refused; a declared change without Christian's words is refused.
    gateRefuses((c) => (c.rules[0].candidate = c.rules[0].candidate.replace('pressing together', 'pressing hard together')), 'the candidate is not the live rule with only')
    gateRefuses((c) => (c.declared = c.declared.filter((d: any) => d.id !== 'ITS')), 'the candidate is not the live rule with only')
    gateRefuses((c) => (c.declared[1].to = 'It counts only if the other team pressed from the start.'), 'the candidate is not the live rule with only')
    gateRefuses((c) => (c.rules[3].setupCandidate = 'Place a target player behind the pressing players, and press from the start.'), 'the candidate setup is not the live setup')
    gateRefuses((c) => (c.declared[2].christian = []), "quotes none of Christian's words")
    gateRefuses((c) => (c.sourceToCode[0].clauses[4].action = 'REPORTED_NOT_CHANGED'), 'or OVER_APPLIED and replaced by a declared change')
    gateRefuses((c) => (c.rules[1].live = c.rules[1].live.replace('Earn a point', 'Score a point')), 'its live text is not the live rule')
    gateRefuses((c) => c.rules.pop(), 'holds "with the next pass" and has no candidate')
    gateRefuses((c) => (c.rules[2].label = 'APPROVED'), 'not CANDIDATE')
    gateRefuses((c) => (c.label = 'APPROVED'), 'is labelled "APPROVED", not CANDIDATE')
    gateRefuses((c) => (c.standing = c.standing.replace('NOT LIVE', 'LIVE')), 'does not stand CANDIDATE')
    gateRefuses((c) => (c.sourceToCode[0].clauses[3].sources[0].line = 2643), 'is not the line holding property_id of RPC-PROP-133')
    gateRefuses((c) => (c.sourceToCode[0].clauses[3].sources[0].words = 'the attacking team retains possession through the next pass'), 'is not verbatim in RPC-PROP-133')
    gateRefuses((c) => (c.sourceToCode[1].clauses[0].clause = 'a player dribbles into the zone'), 'not verbatim in the live rule')
    gateRefuses((c) => (c.sourceToCode[2].clauses[2].action = 'REPORTED_NOT_CHANGED'), 'a clause is corrected exactly where it is found NARROWED')
    gateRefuses((c) => (c.sourceToCode[3].clauses = c.sourceToCode[3].clauses.filter((x: any) => x.component !== 'ORIGIN')), 'no ORIGIN clause')
    gateRefuses((c) => (c.sourceToCode[2].clauses = c.sourceToCode[2].clauses.filter((x: any) => x.component !== 'EVENT')), "the rule's action word 'passes' lies in no checked clause")
    gateRefuses((c) => (c.questions = c.questions.slice(1)), 'the questions are not Q-a, Q-b, Q-c, Q-d')
    gateRefuses((c) => (c.questions[2].sources[1].rowId = 'RPC-PROP-999'), 'RPC-PROP-999 is no row of the RPC library')
    assert.throws(() => loadCandidateCoachRules(CANDIDATE_COACH_RULES_FILE, { ...COACH_RULES, 'RPC-002|gate|': { ...COACH_RULES['RPC-002|gate|']!, rule: overlay.rules[2]!.candidate } }), (error: unknown) => error instanceof CandidateCoachRulesRefused, 'released (the live rule changed), the file is retired: its live text no longer matches')

    // The candidate never enters the approved coach wording.
    const approvedFiles = ['approved-coach-wording.json', 'approved-wording-readings.json'].map((name) => fs.readFileSync(path.join(AUDITS_DIR, name), 'utf8'))
    const approvedSource = fs.readFileSync(path.join(__dirname, '..', 'rendering', 'approved-wording.ts'), 'utf8')
    for (const text of [...approvedFiles, approvedSource]) {
        assert.ok(!text.includes('through the next action'), 'no approved wording says the CANDIDATE words')
        for (const rule of overlay.rules) assert.ok(!text.includes(rule.candidate))
    }
}

/**
 * **The tests-only readers reach no production module** (stage W3). No non-unit module of back/src imports action-words.ts or
 * candidate-coach-rules.ts, or names the CANDIDATE file, but the reader itself; and the live rules' module names neither. A probe shows
 * the scan sees each import form.
 */
function testTestsOnlyReadersReachNoProductionModule(): void {
    const SRC = path.resolve(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.unit.ts') && !entry.name.endsWith('.d.ts')) files.push(full)
        }
    }
    walk(SRC)
    assert.ok(files.length > 200, 'the scan reads the source tree')
    const READS = /(from|require\s*\(|import\s*\()\s*['"][^'"]*(action-words|candidate-coach-rules)['"]|rpc-002-coach-rules\.CANDIDATE/
    assert.ok([`from './action-words'`, `require('../sport-module/candidate-coach-rules')`, `import ( "./action-words" )`, `'rpc-002-coach-rules.CANDIDATE.json'`].every((text) => READS.test(text)), 'the scan sees each form')
    const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
    assert.deepEqual(files.filter((file) => READS.test(fs.readFileSync(file, 'utf8'))).map(relative), ['system/sport-module/candidate-coach-rules.ts'], 'only the CANDIDATE reader reads the action words and the CANDIDATE file')
    assert.ok(!fs.readFileSync(path.join(__dirname, 'primary-scoring.ts'), 'utf8').includes('through the next action'), 'the live rules do not say the CANDIDATE words')
}

function slotFor(rpcId: string, gameFormId: string, slotIndex: 1 | 2 | 3 = 1): ActivitySkeletonSlot {
    return {
        activityIndex: 1,
        archetypeName: 'Test Games',
        titleFrame: '',
        setupFrame: '',
        slotProgressionEmphasis: '',
        requiredRuleMechanics: [],
        requiredScoringMechanics: [],
        requiredAffordanceMechanics: [],
        requiredConstraintMechanics: [],
        coachFacingConstraints: [],
        requiredArchetypeMechanics: [],
        requiredDecisionLanguage: [],
        slotMechanicalVariations: [],
        primaryScoring: resolvePrimaryScoring(rpcId, gameFormId, slotIndex),
    }
}

function setupFailures(setup: string, slot: ActivitySkeletonSlot): string[] {
    const activity = { title: 't', setup, teams: '', objective: '', rules: [], scoring: '', constraints: [], coachingFocus: [], howToPlay: [] }
    return validateActivityAgainstSkeleton(activity as never, slot, 1).filter((reason) =>
        reason.includes('the setup must mark what this activity scores on')
    )
}

/** The setup check must BITE — a check that cannot fail is worse than none. */
function testSetupMustMarkTheScoringObject(): void {
    const finishing = slotFor('RPC-005', 'GF9')
    assert.equal(setupFailures('Play 6v6 in a 40 x 30 m area with goalkeepers.', finishing).length, 1, '"goalkeepers" is not a goal')
    assert.equal(setupFailures('Play 6v6 with a goal at each end.', finishing).length, 0)
    // Real Finishing setups on 13 Sep named the word and marked nothing.
    assert.equal(setupFailures('Play 6v6. Restart with a goal kick or corner after a score.', finishing).length, 1, 'a goal kick is not a goal')
    assert.equal(setupFailures('Play 6v6. Restart immediately with a new ball after a goal.', finishing).length, 1, 'a restart after a goal is not a goal')
    assert.equal(setupFailures('Play 6v6. Each team defends a goal.', finishing).length, 0)

    const buildOut = slotFor('RPC-001', 'GF2')
    assert.equal(setupFailures('Mark a line beyond the first defenders.', buildOut).length, 1, 'the goalkeeper start is part of the condition')
    assert.equal(setupFailures('The goalkeeper starts every attack. Mark a line beyond the first defenders.', buildOut).length, 0)

    const counterPressDenial = slotFor('RPC-007', 'GF4', 2)
    assert.equal(counterPressDenial.primaryScoring?.eventKey, 'denial')
    assert.equal(setupFailures('Count to five out loud each time a team loses the ball.', counterPressDenial).length, 1)
    assert.equal(setupFailures('Mark an escape line across the pitch for each team.', counterPressDenial).length, 0)

    // The Counter-Press regain game still needs its escape line marked.
    assert.equal(setupFailures('Play 6v6 in a 40 x 30 m area.', slotFor('RPC-007', 'GF4', 1)).length, 1)
    assert.equal(setupFailures('Mark an escape line across the pitch for each team to attack.', slotFor('RPC-007', 'GF4', 1)).length, 0)

    // The object must carry the rule's own name: the game form's "end zones" are not a finishing zone.
    const chanceCreationZone = slotFor('RPC-004', 'GF3')
    assert.equal(setupFailures('Play in a 40 x 30 m area with two end zones.', chanceCreationZone).length, 1)
    assert.equal(setupFailures('Mark a finishing zone at each end.', chanceCreationZone).length, 0)
}

/**
 * When generation omits the object, the system writes the sentence it already knows, once. Every
 * first-attempt failure on 13 Sep was an omitted or renamed object, and Play Out from the Back failed
 * outright after its retry, so without this a coach gets an error instead of activities.
 */
function testSetupGainsTheObjectWhenGenerationOmitsIt(): void {
    const directive = resolvePrimaryScoring('RPC-004', 'GF3', 1)
    const omitted = 'Play 6v6 in a 40 x 30 m (44 x 33 yd) area with two end zones.'
    const repaired = withScoringObjectInSetup(omitted, directive)
    assert.ok(repaired.startsWith(omitted), "the model's own layout is kept")
    assert.ok(repaired.endsWith(directive.setupRequirement), repaired)
    assert.equal(setupFailures(repaired, slotFor('RPC-004', 'GF3')).length, 0, 'the repaired setup passes the check')
    assert.equal(withScoringObjectInSetup(repaired, directive), repaired, 'idempotent')

    const alreadyMarked = 'Mark a finishing zone at each end. Play 6v6.'
    assert.equal(withScoringObjectInSetup(alreadyMarked, directive), alreadyMarked, 'a setup that marks it is untouched')
    assert.equal(withScoringObjectInSetup('Play 6v6', undefined), 'Play 6v6', 'free-text goals are untouched')
    assert.equal(withScoringObjectInSetup('Play 6v6 in a grid', directive), `Play 6v6 in a grid. ${directive.setupRequirement}`)

    // Sentence by sentence: the model's own goal sentence satisfies the object, but the countdown the
    // Scoring rule depends on cannot be recognised in other words, so it is written as it stands.
    const counterattack = resolvePrimaryScoring('RPC-006', 'GF4', 1)
    assert.equal(counterattack.eventKey, 'goal')
    const countdown = 'Before you start, pick a countdown between 6 and 10 seconds that starts each time a team wins the ball.'
    assert.ok(counterattack.setupRequirement.endsWith(countdown))
    assert.equal(withScoringObjectInSetup('Play 6v6. Each team defends a goal.', counterattack), `Play 6v6. Each team defends a goal. ${countdown}`)

    // A goal named in passing marks nothing, so the goal sentence is written too.
    const finishing = resolvePrimaryScoring('RPC-005', 'GF9', 1)
    assert.equal(
        withScoringObjectInSetup('Play in a 40 x 30 m area. Restart with a goal kick after a score.', finishing),
        `Play in a 40 x 30 m area. Restart with a goal kick after a score. ${finishing.setupRequirement}`
    )
}

/**
 * Compression pins the resolved rule; the competing reward from the real evidence cannot lead. And
 * the rest of what a coach reads stays with that one way to score: Setup, Rules and the Objective no
 * longer name the game form's default end zones, and a regain condition leaves a game that scores goals.
 */
function testCompressionPinsTheResolvedRule(): void {
    const directive = resolvePrimaryScoring('RPC-005', 'GF9', 1)
    const regainCondition =
        'A regain completes only when followed by a connected forward action under opposition within the live transition window.'
    const activity = {
        title: 'Finishing game',
        intent: 'Finish quickly to reach the end zone.',
        constraint: '',
        setup: 'Play 6v6 in a 40 x 30 m (44 x 33 yd) area with two 18 m (20 yd) end zones. Teams attack the end zones.',
        rules: [
            'Finishing chances remain live under defensive pressure, with rebounds, clearances, and counter-attacks continuing from the result. A forced chance or turnover gives the defending team immediate access to counter-attack with no reset.',
            'Attack the end zone as quickly as you can.',
            regainCondition,
        ],
        scoringSystem: [
            'A goal or live advantage counts only when the team creates a genuine scoring chance under live defensive pressure and converts it.',
            directive.scoringRule,
            'Score awarded for attacks that use available space to gain advantage — players must progress into the open space before defensive pressure recovers, or the chance is lost.',
        ].join('\n'),
        winCondition: 'Teams compete live under two-sided opposition, and the team with more points when play ends wins.',
        scaffolding: [],
        extensions: [],
        equipmentNeeded: [],
        duration: 20,
        systemTrace: {
            planning: { learningGoalName: 'Finish Attacks' },
            primaryScoring: {
                contextId: directive.contextId,
                eventKey: directive.eventKey,
                objectKey: directive.objectKey,
                scoringRule: directive.scoringRule,
                realizationCoverage: directive.realizationCoverage,
                setupRequirement: directive.setupRequirement,
                setupEvidence: directive.setupEvidence,
            },
        },
    }
    const once = compressActivityForCoach(activity as never, [regainCondition])
    const scoring = String(once.scoringSystem)
    assert.ok(scoring.startsWith('Earn a point for every goal.'), `Scoring does not lead with the resolved rule: "${scoring}"`)
    assert.doesNotMatch(scoring, /open space|genuine scoring chance/i, `A competing reward survived: "${scoring}"`)

    const setup = String(once.setup)
    assert.doesNotMatch(setup, /end zone/i, `Setup still marks end zones nothing scores on: "${setup}"`)
    assert.match(setup, /6v6/, setup)
    assert.match(setup, /40 x 30 m/, setup)
    assert.match(setup, /Put a goal at each end\./, `Setup lost the scoring object: "${setup}"`)
    for (const rule of once.rules ?? []) assert.doesNotMatch(rule, /end zone|\bregain\b/i, `Rules kept "${rule}"`)
    assert.doesNotMatch(String(once.intent), /end zone/i, `Objective still aims at end zones: "${once.intent}"`)

    // Idempotent, like the rest of compression.
    const twice = compressActivityForCoach(once, [regainCondition])
    assert.equal(String(twice.scoringSystem), scoring)
    assert.equal(twice.setup, once.setup)
    assert.deepEqual(twice.rules, once.rules)
    assert.equal(twice.intent, once.intent)
}

/**
 * CONTEXT-GATED SELECTION. Measured before gating: through the live selector only 9 of 13 guided goals
 * landed on a game form their routed context declares, and Create Scoring Chances landed on Finishing
 * Games, where Chance Creation has no valid event, so primary scoring could only refuse. With the
 * candidate pool gated to the context, every guided goal must land on a declared realization and
 * resolve. A future selector change that breaks this fails here, not in front of a coach.
 */
function testEveryGuidedGoalResolvesThroughContextGatedSelection(): void {
    const originalLog = console.log
    console.log = () => undefined
    /**
     * Since 14 October two goals are KNOWLEDGE GAPS: selection draws only from a goal's own candidates (his
     * ruling of that day), and Play Through Pressure's and Defend 1v1's cannot be combined on the game form
     * chosen for them. They select nothing, so there is no form to check here; the list is asserted, so a goal
     * joining or leaving it is noticed. The game form the gap was found on is still one the context declares.
     */
    const gaps: string[] = []
    try {
        for (const goal of sessionPlanningModel.learningGoals()) {
            const id = String(goal['ID'])
            const name = String(goal['Learning Goal'])
            const rpcId = sessionPlanningModel.rpcRouting().find((route) => route.learningGoalId === id)!.rpcId
            // The same hints the application gives selection: approved Game Problem, then context.
            const hints = guidedSelectionHints(id, name).hints
            let selection: ReturnType<typeof generateSelection>
            try {
                selection = generateSelection({ learningGoals: [name], learningGoalId: id }, hints)
            } catch (error) {
                if (!isSelectionKnowledgeGap(error)) throw error
                gaps.push(id)
                assert.ok(rpcLibrary.gameFormsForContext(rpcId).some((form) => form.relatedId === error.archetypeId), `${id}: the gap was found on ${error.archetypeId}, which ${rpcId} does not declare.`)
                continue
            }
            const formId = selection.archetype.game_form_id
            assert.ok(
                rpcLibrary.gameFormsForContext(rpcId).some((form) => form.relatedId === formId),
                `${id} ${name} selected ${formId}, which ${rpcId} does not declare.`
            )
            assert.equal(resolvePrimaryScoringDirectives(rpcId, formId).length, 3, `${id} ${name} does not resolve.`)
        }
    } finally {
        console.log = originalLog
    }
    // A01 joins them on 15 October 2026: its authorization record authorizes no constraint (his item 1 of that day:
    // approving Gain Access "does not automatically authorize the candidate constraints currently derived from
    // vocabulary coverage"), so it is NO_AUTHORIZED_CONSTRAINTS — found on GF2, a form RPC-001 declares (checked above).
    // And it leaves again later the same day: his general principle (16 October reply, item 1 — "A library constraint is
    // not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment")
    // lets its evaluated, empty record select GF2 with no constraint, and GF2 resolves RPC-001's three events (above).
    assert.deepEqual(gaps, ['A02', 'D03'], 'the knowledge gaps of 14 October, and no others')

    // Parser order survives among declared forms; undeclared parser candidates are dropped.
    const gated = gateCandidateGameFormsToContext(
        { candidateArchetypeIds: ['GF9', 'GF3', 'GF1'], candidateAffordanceLensIds: [], candidateConstraintIds: [], matchedSignals: [] },
        'RPC-004'
    )
    assert.deepEqual(gated.candidateArchetypeIds, ['GF3', 'GF2', 'GF7'])
}

testEveryCompatiblePairResolvesToAnApprovedEvent()
testEveryGuidedGoalResolvesThroughContextGatedSelection()
testTheApprovedGapsAreClosedByCoverage()
testTheRightSideOfTheProblemEarnsThePoint()
testBothApprovedDefensiveEventsReachCoaches()
testEmptyIntersectionFailsInsteadOfInferring()
testGameFormStructureUsesTheControlledVocabulary()
testCoachWordingIsCompleteApprovedAndCoachFacing()
testEveryPossessionOrControlClauseNamesItsGround()
testAttackDevelopmentRulesSayChristiansApprovedWording()
testControlOnReceptionAddsNoRetentionNextPassOrPostScoreClause()
testTeammateControlAtAGateIsAttackDevelopmentsAlone()
testControlledVocabularyApprovalCoversTwoMeaningsOnly()
testAnActionWordKeepsItsClass()
testHighPressEscapeCandidateWording()
testTestsOnlyReadersReachNoProductionModule()
testSetupMustMarkTheScoringObject()
testSetupGainsTheObjectWhenGenerationOmitsIt()
testCompressionPinsTheResolvedRule()

console.log('primary-scoring unit tests: all cases passed.')
