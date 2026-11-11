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

import type { ActivitySkeletonSlot } from '../activity/build-activity-skeleton'
import { findCommunicationStandardViolations } from '../activity/coach-communication-standard'
import { toCoachScoringSentence } from '../activity/coach-voice'
import { compressActivityForCoach } from '../activity/compress-activity-output'
import { validateActivityAgainstSkeleton, withScoringObjectInSetup } from '../activity/validate-activity-skeleton'
import { exampleClauses, normaliseWhitespace, spanIsExample } from '../derivation/example-clauses'
import { approvalUnusableBecause, type ReadingApproval } from '../rendering/approved-wording-readings'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { generateSelection, isSelectionKnowledgeGap } from '../test-library/generateSelection'
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
    for (const [key, wording] of Object.entries(COACH_RULES)) {
        assert.deepEqual(findCommunicationStandardViolations(wording.rule), [], `${key}: ${wording.rule}`)
        assert.equal(toCoachScoringSentence(wording.rule), wording.rule, `${key} would be rewritten by the engine-voice translation.`)
        assert.match(wording.rule, /\bpoint\b/, `${key} does not say how a point is earned.`)
        assert.ok(wording.evidence.every((group) => group.length > 0), `${key} has an empty evidence group.`)
        assert.ok(wording.evidence.length > 0, `${key} has no setup evidence.`)
        // The setup's object must carry the rule's own name for it, so a coach can tell which one scores.
        for (const group of wording.evidence) {
            assert.ok(
                group.some((word) => wording.rule.toLowerCase().includes(word) || wording.setup.toLowerCase().includes(word)),
                `${key}: evidence "${group.join('/')}" is named in neither the rule nor the setup requirement.`
            )
        }
    }
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
    const definitions: Record<string, string> = Object.fromEntries(rpcLibrary.scoringEvents().map((event) => [event.key, event.definition]))
    const failures: string[] = []
    const onAnExample: string[] = []
    assert.equal(spanIsExample(rpcLibrary.primaryScoringCondition('RPC-003'), 'while maintaining attacking possession'), true, 'the reading still sees the example of the corrected row')
    for (const [key, wording] of Object.entries(COACH_RULES)) {
        const [rpcId, eventKey] = key.split('|')
        const declared = COACH_RULE_GROUNDS[key] ?? []
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
    for (const key of Object.keys(COACH_RULE_GROUNDS)) if (!(key in COACH_RULES)) failures.push(`${key}: grounds declared for a rule that does not exist`)
    assert.deepEqual(failures, [], 'every possession or control clause of a coach rule names a verbatim ground')
    assert.deepEqual([...new Set(onAnExample)].sort(), Object.keys(GROUNDED_ON_AN_EXAMPLE).sort(), 'the rules grounded on words given only as an example are exactly the pinned list')
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
testSetupMustMarkTheScoringObject()
testSetupGainsTheObjectWhenGenerationOmitsIt()
testCompressionPinsTheResolvedRule()

console.log('primary-scoring unit tests: all cases passed.')
