/**
 * **Stage K8, 15 October 2026 — the review evidence of the first complete activity (design step J9, BRIEF-OCT17 §3 and §5).**
 *
 * Christian, reply filed 17 October 2026, *"Next review and acceptance evidence"*: the nine items, *"Please verify the configuration's
 * structural consistency, including player totals, spatial relationships, scoring conditions, and restarts."*, and *"I would also like
 * the review to demonstrate that the goalkeeper remains a functional deep support option and that the activity does not require
 * predetermined passing patterns or prescribed player behaviors."* His reply filed 18 October 2026: item 6, *"Please flag whether the
 * generated activity permits players to remain beyond the progression line without any meaningful defensive interaction."*; item 7, the
 * three layers and *"Please keep that distinction visible as we approach acceptance."*; item 8, *"I agree that the unresolved
 * regain-inside-target case should remain flagged for review rather than be settled through an invented rule."*
 *
 * What is pinned here, on the PRODUCTION chain (A01 at 12 players, 40 x 30 m, one keeper, through the checked pathway) unless a line
 * says TEST-ONLY:
 *
 *   1. the end-to-end acceptance: refused only at communication, both blocks built through validation, every structural check PASS,
 *      no fidelity violation in the text that is said, and the withheld fields exactly the build-out conditions awaiting his wording;
 *   2. the nine items, each his words verbatim from the record, each resolved to game elements, checks and sentences;
 *   3. provenance by his three layers and by standing, every cited path traced, nothing untraced;
 *   4. key identity: the evidence reaches the administrator's review answer of a goal whose record asks for it and nothing else; the
 *      coach's account no longer copies the request; every quotation is the record's, byte for byte;
 *   5. the specialized role as a deep support option, and no prescription, as facts of the game;
 *   6. his item 6 flag answered from the game (yes: nothing prevents it), with the read-only knowledge listing, and the regain case
 *      flagged and never settled — and a TEST-ONLY action restriction changes the answer;
 *   7. the structural report reads the gates' own verdicts, and the request's loader refuses a damaged request;
 *   8. (K8 review) the structural report FAILS on a broken copy of each part he named — player totals, spatial relationships, scoring
 *      conditions, restarts — with the post-realization gates rerun on the broken concrete game, never a verdict written by hand;
 *   9. (K8 review) the relationships he confirmed on 18 October reach every element and sentence whose item cites one, a relationship
 *      not CONFIRMED is not approved, and a withheld field keeps the row the renderer reported;
 *  11. (review of stage 2A) every section label the served activity uses is in the evidence with when the coach needs it and its
 *      status, and none is approved.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { runDerivation, runStages0to10, runStages0to5 } from '../derivation/engine'
import { applyRealizationDeferrals } from '../derivation/realization-deferral'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { roleBlocksOf } from '../derivation/role-blocks'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { LoadedContract, RoleBlock } from '../derivation/types'
import { completeConcreteGame } from '../realization/assemble-concrete-game'
import { realizeWithJustifiedDefaults } from '../realization/justified-defaults'
import { runPostRealizationGates } from '../realization/post-realization-gate'
import { suppliedRealizationFor } from '../realization/supplied-realization'
import { contextManipulationRelationships, learningGoalAuthorization, REVIEW_LAYERS, validateLearningGoalAuthorizations, validateReviewRequest } from '../test-library/learning-goal-authorizations'
import { reviewActivity } from './activity-review'
import * as wordingModule from './approved-wording'
import { buildActivity, buildActivityForReview, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { buildPilotActivity } from './build-pilot-activity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { renderConcreteGame } from './render-concrete-game'
import { EvidenceBlock, readPath, reviewEvidenceOf } from './review-evidence'
import { RESTARTS, SECTION_ORDER, WHEN_IT_ENDS, WHEN_OF_SECTION } from './sections'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('review evidence of the first complete activity (stage K8)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: 1 } }
const a01 = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session }
const index = indexRegister(loadRegister())
const record = learningGoalAuthorization('A01')!
const request = record.reviewRequest!
const BLOCKS = ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START']
/** His reply filed 19 October 2026, item 1, verbatim ("Approved with revised wording"): production entry A01-W1 since stage M5. */
const HIS_ITEM_1 =
    "Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score."

/** His reply filed 20 October 2026, item 1 ("Approved as written."): production entry A01-W2 since design step L14. */
const HIS_W2 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession; a contested touch, deflection or loose ball does not count.'
/** His reply filed 20 October 2026, item 2 (his own wording): production entry A01-W3 since design step L14. */
const HIS_W3 = 'If the building team loses possession or plays the ball out, it cannot score again until the next goalkeeper restart.'

/*
 * Re-pointed 18 October 2026 (design step L14): production A01 is SERVED (his reply filed 20 October 2026, items 1 and 2: entries A01-W2
 * and A01-W3), and the administrator's answer carries the evidence beside the served activity. What the evidence shows for a field
 * awaiting approved wording (GAP, the row it keeps, the item awaiting it) is still pinned, measured on the build as it stood at stage M5:
 * a TEST-ONLY table holding A01-W1 alone, refused at communication for the regain score's four fields (`atStageM5`).
 */
const review = buildActivityForReview(a01, { includeDrafts: true }) as ServedActivity
const evidence = review.evidence!
const atStageM5 = (() => {
    const read = wordingModule.approvedWording
    const production = read()
    try {
        ;(wordingModule as any).approvedWording = () => JSON.parse(JSON.stringify(production.filter(entry => entry.id === 'A01-W1')))
        return buildActivityForReview(a01, { includeDrafts: true }) as RefusedActivity
    } finally {
        ;(wordingModule as any).approvedWording = read
    }
})()
const evidenceAtStageM5 = atStageM5.evidence!
const fact = (facts: { what: string; value: unknown }[], what: string) => {
    const found = facts.find(f => f.what === what)
    assert.ok(found, `no fact "${what}" among ${JSON.stringify(facts.map(f => f.what))}`)
    return found!.value as any
}

test('1. end to end on production data: SERVED (design step L14; was refused only at communication), both blocks valid, every check PASS, nothing unfaithful in what is said', () => {
    // Moved 18 October 2026 (design step L14): refused at communication -> served. His reply filed 20 October 2026, item 1 ("Pressing
    // team's regain score — Approved as written.", entry A01-W2) says the four fields that were all that stopped it; item 2 gave his
    // own eligibility sentence (entry A01-W3). The evidence itself is still the administrator's, never served to a coach (its status).
    assert.equal(review.outcome, 'served')
    assert.equal(atStageM5.stage, 'communication', 'the TEST-ONLY table as at stage M5 still stops where production stopped')
    assert.equal(evidence.status, 'EVIDENCE_FOR_REVIEW_NOT_SERVED')
    assert.deepEqual(fact(evidence.acceptance, 'outcome of the build'), 'served')
    assert.deepEqual(fact(evidenceAtStageM5.acceptance, 'outcome of the build'), 'communication')
    assert.deepEqual(fact(evidence.acceptance, 'blocks built through validation'), BLOCKS)
    assert.equal(fact(evidence.acceptance, 'every structural check passes (Gate A rerun per block, post-realization owed invariants, cross-block checks, composition)'), true)
    // Moved 17 October 2026 (stage M1), [] -> the pressing role's credit bound, once per block: row B8 (his reply filed 19 October 2026,
    // item 1 and item 3 C) gives the pressing role WHOLE_GAME explicitly (A01-R1-B8-2), which states no condition and so is not
    // withheld, and no sentence cites it yet - a Q3 loss, not a wrong statement. The per-role scoring sentence that cites it is design
    // step L9 (stage M3), which returns this fact to []. Nothing in the said text is unfaithful.
    // Moved back 17 October 2026 (stage M3, design step L9), [pressingBound, pressingBound] -> []: the pressing role's own scoring
    // sentence ("Pressing team: Score by ...", DRAFT) cites its whole-game bound, so nothing in the said text is lost or unfaithful.
    assert.deepEqual(fact(evidence.acceptance, 'fidelity violations in the text that is said'), [])
    // The 22 violations are all Q3 "established and no instruction carries it" on the withheld build-out conditions (communication.unit.ts 1).
    // Moved 17 October 2026 (stage M1), 22 -> 24 and 30 -> 32: the building role's credit bound, withheld in each block until approved
    // words say it (communication.unit.ts 1; credit-episode.unit.ts).
    // Moved 17 October 2026 (stage M2), 24 -> 32 and 32 -> 40: the pressing role's regain score, its four fields withheld in each block
    // until approved words say them (rows V28-V31, his reply filed 19 October 2026, item 2; communication.unit.ts 1; also-counts.unit.ts).
    // The text that is said gains no violation: the fact above is unchanged.
    // Moved 18 October 2026 (stage M5, design step L13), 32 -> 8 and 40 -> 8: his approved sentence (entry A01-W1, reply filed 19
    // October 2026, item 1, "Approved with revised wording") says the building role's bound and every field of the four build-out
    // conditions, so what awaits approved wording is the regain score's four fields per block alone (the sentence put to him, A01-W2).
    // Moved 18 October 2026 (design step L14), 8 -> 0 and 8 -> 0: A01-W2 says them (his reply filed 20 October 2026, item 1); the eight
    // are still what the TEST-ONLY table as at stage M5 awaits.
    assert.equal(fact(evidence.acceptance, 'fidelity violations about fields awaiting approved wording'), 0)
    assert.equal(fact(evidence.acceptance, 'fields awaiting approved wording'), 0)
    assert.equal(fact(evidenceAtStageM5.acceptance, 'fidelity violations about fields awaiting approved wording'), 8)
    assert.equal(fact(evidenceAtStageM5.acceptance, 'fields awaiting approved wording'), 8)
    assert.deepEqual(fact(evidence.provenance.openForReview, 'fields awaiting his approved wording'), [], 'the review page lists no field awaiting his wording')
    // Moved 17 October 2026 (stage M3, design step L9), 24 -> 25: the team-neutral scoring sentence gives way to the pressing role's
    // own sentence and "Each score is worth 1 point" (both DRAFT; communication.unit.ts 1 and 8).
    // Moved 17 October 2026 (stage M4, design step L10), approved 0 -> 1: the possession sentence is his approved words (reply filed 19
    // October 2026, item 4), an approved template sentence read from approved-coach-wording.json; the total is unchanged.
    // Moved 18 October 2026 (stage M5, design step L13), total 25 -> 26 and approved 1 -> 2: his build-out sentence, entry A01-W1, said
    // once for the bound and the four conditions (the drafts are unchanged).
    // Moved 18 October 2026 (design step L14), total 26 -> 28 and approved 2 -> 4: his two scoring statements (entries A01-W2 and
    // A01-W3, his reply filed 20 October 2026, items 1 and 2), each said once; the drafts are unchanged ("this approval applies
    // specifically to the two scoring statements, not yet to the entire activity").
    // Moved 21 October 2026 (stage 2B), total 28 -> 29 and draft 24 -> 25: the opening restart is said as WHEN and HOW (both DRAFT; his
    // reply filed 22 October 2026, item 2), and where it is taken names its own restart; nothing approved changes.
    // Moved 21 October 2026 (stage 2C), total 29 -> 27 and draft 25 -> 23: the two target sentences each block said in the same words,
    // each citing its own role's target, are each said once (his reply filed 22 October 2026, item 8: "Correct section assignment,
    // repetition, and information classification in the checked pathway."; communication.unit.ts 9); nothing approved changes.
    // Moved 21 October 2026 (stage 2D), total 27 -> 28 and draft 23 -> 24: every block's markings set out once (his reply filed 22
    // October 2026, item 7): the line at halfway, the end zones once, each role's target said by role, and the coach's choice of ends on
    // its own; "Each team attacks the zone at the other team's end ..." is no longer said (physical-layout.unit.ts); nothing approved changes.
    assert.deepEqual(fact(evidence.acceptance, 'sentences'), { total: 28, approved: 4, draft: 24 })
    assert.deepEqual(evidence.sections.instructions.filter(i => i.wording === 'APPROVED').map(i => i.text), ['When possession changes, play carries on without a stoppage, and each team keeps attacking the same zone', HIS_ITEM_1, HIS_W3, HIS_W2])
    // Measured at this stage: 19 Gate A checks per block, all PASS; the 9 cross-block checks; 11 owed invariants per block.
    // Re-pointed 21 October 2026 (stage 2D): 10 cross-block checks, RB-L joining.
    // Re-pointed 22 October 2026: 20 Gate A checks per block (40), GA-PARTICIPANTS-PRESENT joining (his reply filed 25 October 2026,
    // item 6), and its five clauses owed per block (22 -> 32), every one passing on applicable instances (participants-present.unit.ts).
    // Re-pointed 22 October 2026 (stage A): 21 Gate A checks per block (42), GA-ROLE-EVENTS joining (his reply filed 25 October 2026, item
    // 2), its target and yield clauses owed per block (32 -> 36), each passing on the two teams it examined (role-events.unit.ts).
    assert.deepEqual(evidence.structure.summary.gateChecks, { PASS: 42 })
    assert.deepEqual(evidence.structure.summary.crossBlock, { PASS: 10 })
    assert.deepEqual(evidence.structure.summary.owed, { PASS: 36 })
    assert.equal(evidence.structure.composition.length, 0)
    // Only production data: the record names the realization, and no TEST-ONLY value is anywhere in what was built.
    assert.ok(!JSON.stringify(review).includes('TEST-ONLY'))
})

test('2. the nine items: his words from the record, each resolved to elements, checks and sentences', () => {
    assert.equal(evidence.items.length, 9)
    assert.deepEqual(evidence.items.map(i => i.words), request.items.map(i => i.words))
    for (const item of evidence.items) {
        assert.ok(item.resolved, `${item.id} resolves`)
        if (item.kind === 'GAME') {
            assert.ok(item.blocks.every(b => b.elements.length > 0), `${item.id} has elements in both blocks`)
            assert.ok(item.sentences.length > 0, `${item.id} is carried by at least one sentence`)
            assert.ok(item.checks.every(c => c.verdict === 'PASS'), `${item.id}: ${JSON.stringify(item.checks)}`)
        }
    }
    const byId = Object.fromEntries(evidence.items.map(i => [i.id, i]))
    // Item 4 (the building team's success): its target and the four conditions; the conditions are what waits on his wording.
    assert.ok(byId.R4.blocks[0].elements.some(e => e.path === 'objectives[c:restated:GF2:GF2-08.c].reference'))
    assert.ok(!byId.R4.blocks[0].elements.some(e => e.path.startsWith('objectives[c:restated:GF2:GF2-08.e]')), 'the other role\'s objective is item 5\'s')
    // Re-pointed 17 October 2026 (stage M3, design step L7): item 4 also awaits the building role's credit bound (row B8), which it now
    // lists; every other field it awaits is a condition's (test 9 pins the whole list).
    // Re-pointed 18 October 2026 (stage M5, design step L13): item 4 awaits nothing - his approved sentence (A01-W1) says the bound and
    // every condition field - and the sentence is among item 4's sentences, approved. Was: awaiting the bound and the condition fields.
    assert.deepEqual(byId.R4.awaiting, [])
    const his = evidence.sections.instructions.find(i => i.text === HIS_ITEM_1)!
    assert.equal(his.wording, 'APPROVED')
    assert.ok(byId.R4.sentences.includes(his.index), JSON.stringify(byId.R4.sentences))
    // Added 18 October 2026 (design step L14): his eligibility sentence (A01-W3) is among item 4's sentences and his regain sentence
    // (A01-W2) among item 5's, each APPROVED, because each cites fields of its item's elements.
    const w3 = evidence.sections.instructions.find(i => i.text === HIS_W3)!
    const w2 = evidence.sections.instructions.find(i => i.text === HIS_W2)!
    assert.deepEqual([w3.wording, w2.wording], ['APPROVED', 'APPROVED'])
    assert.ok(byId.R4.sentences.includes(w3.index), JSON.stringify(byId.R4.sentences))
    assert.ok(byId.R5.sentences.includes(w2.index), JSON.stringify(byId.R5.sentences))
    assert.ok(byId.R5.blocks[0].elements.some(e => e.path === 'objectives[c:restated:GF2:GF2-08.e].reference'))
    // Moved 17 October 2026 (stage M3, design step L9), 24 -> 25 (test 1). Moved 18 October 2026 (stage M5), 25 -> 26: his sentence.
    // Moved 18 October 2026 (design step L14), 26 -> 28: his two scoring statements (A01-W2, A01-W3).
    // Moved 21 October 2026 (stage 2B), 28 -> 29: the opening restart's WHEN and HOW are two sentences.
    // Moved 21 October 2026 (stage 2C), 29 -> 27: the two mirrored target sentences are each said once (test 1).
    // Moved 21 October 2026 (stage 2D), 27 -> 28: every block's markings set out once (test 1).
    assert.equal(byId.R8.sentences.length, 28)
    // Stage 2D (21 October 2026): RB-L joins the cross-block checks (test 1), and an item's checks are the ones his review request lists for
    // it (the record's data, unchanged), so R7 still reads the nine.
    assert.ok(byId.R7.checks.map(c => c.checkId).join() === 'RB-1,RB-2,RB-3,RB-4,RB-5,RB-6,RB-7,RB-8,RB-M')
})

test('3. provenance: his three layers and the standings, every cited path traced', () => {
    assert.deepEqual(evidence.layers.map(l => l.code), [...REVIEW_LAYERS])
    assert.deepEqual(evidence.provenance.untraced, [])
    const instructions = evidence.sections.instructions
    assert.ok(instructions.every(i => i.sources.length > 0))
    const said = (start: string) => instructions.find(i => i.text.startsWith(start))!
    // The area is the session's and nothing else.
    assert.deepEqual(said('Mark out an area').layers, ['SESSION_INPUT'])
    // The restart rests on his provisional choices (the taker among them), the ball on the sport profile. Re-pointed 21 October 2026
    // (stage 2B): it is said as WHEN ("... restarts play: {triggers}") and HOW ("... restarts play from the feet, ..."); both name the
    // taker and rest on it, and only HOW names the ball. Was one sentence resting on both.
    const restartWhen = said(`The building team's ${ROLE} restarts play:`)
    const restartHow = said(`The building team's ${ROLE} restarts play from the feet`)
    for (const restart of [restartWhen, restartHow]) assert.ok(restart.sources.some(s => s.standing === 'PROVISIONAL' && s.ref === 'provisional:A01-R1::A01-R1-T3-1'), restart.text)
    assert.ok(restartHow.sources.some(s => s.layer === 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS' && s.standing === 'APPROVED'))
    assert.ok(!restartWhen.sources.some(s => s.layer === 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS'), 'the WHEN names no ball')
    // The post-regain area's depth: the item bounding it is found (the fixture carries the bound without it).
    // Re-pointed 21 October 2026 (stage 2D): with every block's markings set out once, the sentence names the end zone the target is
    // ("The pressing team's target zone is the 5 m end zone at the building team's end"; was "Mark the pressing team's target zone at the
    // building team's end, 5 m deep, across the full width"), and rests on his recorded choice too.
    // Re-pointed 21 October 2026 (stage 2G): the layout rests on his general presentation rule (reply filed 23 October 2026, item 2), a
    // general mechanism he authorized, no longer the goal's provisional record ('record MARK_UNION_ONCE', his reply filed 22 October 2026,
    // item 7); the reading of the blocks' edges stays ours.
    const depth = said("The pressing team's target zone")
    assert.ok(depth.sources.some(s => s.ref === 'provisional:A01-R1::A01-R1-S5-3' && s.standing === 'PROVISIONAL'), JSON.stringify(depth.sources))
    assert.ok(depth.sources.some(s => s.ref === 'presentation rule MARK_UNION_ONCE' && s.layer === 'GENERAL_ENGINE_MECHANISM' && s.standing === 'APPROVED' && s.detail === 'his reply filed 23 October 2026, item 2'), JSON.stringify(depth.sources))
    assert.ok(!depth.sources.some(s => s.ref.startsWith('record MARK_UNION_ONCE')), 'no record of a choice')
    assert.ok(depth.sources.some(s => s.standing === 'OUR_READING' && s.ref === "physical layout (the union of every block's realized edges)"))
    // An adjustment: his provisional choice, through a relationship he CONFIRMED on 18 October.
    const moveLine = said('You may choose to move the marked line')
    assert.ok(moveLine.sources.some(s => s.ref === 'record A01-ADJ-3' && s.standing === 'PROVISIONAL'))
    assert.ok(moveLine.sources.some(s => s.ref === 'relationship RPC-001~EM-0002' && s.standing === 'APPROVED' && s.layer === 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS'))
    // The withheld fields are GAP elements; nothing said is. Re-pointed 18 October 2026 (stage M5, design step L13): the conditions are
    // said in his approved words (A01-W1), so they are no longer GAP; the GAP elements are exactly the regain score's four fields, which
    // await the sentence put to him (A01-W2). Was: the conditions were GAP.
    const conditions = evidence.provenance.elements.filter(e => e.path.startsWith('value.primaryEvent.conditions['))
    assert.ok(conditions.length > 0 && conditions.every(e => !e.standings.includes('GAP')))
    // Re-pointed 18 October 2026 (design step L14): A01-W2 says the regain score's four fields (his reply filed 20 October 2026, item 1),
    // so no element is GAP; on the TEST-ONLY table as at stage M5 they are still exactly the GAP elements.
    assert.deepEqual(evidence.provenance.elements.filter(e => e.standings.includes('GAP')).map(e => e.path), [])
    assert.deepEqual(evidenceAtStageM5.provenance.elements.filter(e => e.standings.includes('GAP')).map(e => e.path).sort(), ['control', 'exclusion', 'team', 'trigger'].map(field => `value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].${field}`))
    assert.ok(instructions.every(i => !i.standings.includes('GAP')))
    // Our readings are named, not hidden: the assumed bound beside the across-the-axis default.
    assert.ok(instructions.some(i => i.standings.includes('OUR_READING')))
    assert.equal(evidence.provenance.lists!.at, 'account.authorizationLists')
    // Re-pointed 26 October 2026 (Stage F): the two decisions the goal version (A01-R2) is listed waiting on are still needed - his, open,
    // and settled by no words of his - while the zone version served here waits on neither.
    assert.deepEqual(evidence.provenance.lists!.gapsStillNeeded, ['D-GOAL-SUITABILITY', 'D-PENALTY-AREA'])
    // 17 October 2026 (stage M4, design step L11): still needed is now "no words of his settle it, or an entry waits on it" (it was
    // only the latter, which cannot tell a settled gap from one waiting on the context's own lines); all thirteen are settled.
    assert.deepEqual(evidence.provenance.lists!.gapsSettled, ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'M1', 'M2', 'M3', 'M4', 'M5', 'M7'])
})

test('4. key identity: the evidence reaches the administrator\'s review of a goal that asks for it, and nothing else', () => {
    // Re-pointed 18 October 2026 (design step L14): the activity is served, so the administrator's answer carries one admin-only key, the
    // evidence (a draft belongs to a refusal at communication only); everything else is what the coach receives. Was: draft and evidence.
    const plain = buildActivity(a01) as ServedActivity
    assert.equal(plain.outcome, 'served')
    // Re-pointed 21 October 2026 (stage 3A): beside the evidence, the administrator's answer carries the Coach Overview's parts as computed
    // for review (`overviewDraft`, admin-only until stage 3D); the coach's carries neither.
    // Re-pointed 22 October 2026 (stage 5A): and the field diagram's model and agreement check (`diagramDraft`, admin-only until stage 5B).
    const { evidence: carried, overviewDraft, diagramDraft, ...rest } = review
    assert.ok(carried && overviewDraft && diagramDraft && !('draft' in review))
    assert.deepEqual(rest, plain, 'apart from the admin-only evidence, overview draft and diagram draft, the administrator receives what the coach receives')
    assert.ok(!('evidence' in plain) && !('overviewDraft' in plain) && !('diagramDraft' in plain))
    assert.ok(!('reviewRequest' in (plain.account.authorization as object)), "the coach's account no longer copies the request")
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    assert.ok(!('evidence' in reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 })))
    assert.deepEqual((reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as ServedActivity).evidence, evidence)
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const asked = buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session: { ...session, roles: none } }, { includeDrafts: true })
        assert.ok(!('evidence' in asked), demonstration.id)
    }
    // Every other goal: no record asks, so nothing is attached even for an administrator.
    for (const goalId of ['A02', 'A03', 'A04', 'A05', 'A06', 'D01', 'D02', 'D03', 'TA01', 'TA02', 'TD01', 'TD02']) {
        assert.ok(!('evidence' in buildActivityForReview({ kind: 'learning-goal', goalId, situationId: null, session }, { includeDrafts: true })), goalId)
    }
    assert.ok(!JSON.stringify(buildPilotActivity()).includes('"evidence"'))
    // The record's request is carried whole into what the evidence reads: every quotation byte for byte.
    assert.deepEqual(evidence.requests.map(r => r.words), request.requests.map(r => r.words))
    assert.deepEqual(evidence.evaluation.points.map(p => p.words), request.evaluation.points.map(p => p.words))
    assert.deepEqual(evidence.flags.map(f => f.his), request.flags.map(f => f.words))
    assert.deepEqual(evidence.rationale.features.map(f => f.words), request.rationale.map(r => r.words))
    assert.deepEqual(evidence.rationale.his.words, request.judgement.words)
    assert.deepEqual(evidence.pathway.his, request.pathway)
    assert.deepEqual(evidence.layers.map(l => l.words), request.layers.entries.map(e => e.words))
    // Key identity of the request: every key is read, or excluded here with its reason.
    // 'limitations' joined 17 October 2026 (stage M3, design step L7): his reply filed 19 October 2026, item 5, read whole below.
    const READ = ['citedAs', 'layers', 'items', 'requests', 'evaluation', 'flags', 'limitations', 'pathway', 'judgement', 'rationale']
    assert.deepEqual(evidence.limitations.map(l => l.his), request.limitations!.map(l => l.words))
    assert.deepEqual(evidence.flags.map(f => f.settledBy), request.flags.map(f => f.settledBy ?? []))
    const EXCLUDED = { ruledOn: 'the date travels in citedAs', by: 'the request is his; citedAs says where', note: 'for readers of the record file' }
    assert.deepEqual(Object.keys(request).sort(), [...READ, ...Object.keys(EXCLUDED)].sort())
    // The approved statements a rationale cites are read from the workbook, whole.
    assert.ok(evidence.rationale.features.flatMap(f => f.statements).every(s => typeof s.text === 'string' && s.text.length > 0))
    // No goal literal and no knowledge id in the reader (the sport-coupling ratchet covers sport terms).
    const source = fs.readFileSync(path.join(__dirname, 'review-evidence.ts'), 'utf8')
    for (const literal of ['A01', 'RPC-0', 'GF2', 'EM-0', 'BUILDING', 'PRESSING']) assert.ok(!source.includes(literal), literal)
})

test('5. the specialized role as a deep support option, and no prescription, as facts of the game', () => {
    const [role] = evidence.sections.specializedRoles.filter(r => r.role === ROLE)
    assert.equal(role.available, 1)
    const facts = role.facts
    // In each block the one specialized player is on the team holding the building role.
    for (const [i, blockId] of BLOCKS.entries()) {
        const onTeams = facts.filter(f => f.what.startsWith(`block ${blockId}: `) && f.what.includes(' on team '))
        assert.deepEqual(onTeams.map(f => [f.value, f.what.endsWith('holds the BUILDING role')]).sort(), [[0, false], [1, true]], `block ${i + 1}`)
        const takes = fact(facts, `block ${blockId}: transitions this role takes`)
        assert.deepEqual(takes.map((t: any) => t.trigger), ['START', 'SCORE', 'COACH_JUDGED_EPISODE_CONCLUSION'])
        assert.ok(takes.every((t: any) => t.awardedToRole === 'BUILDING' && t.beginsConditionedEpisode && t.method === 'FROM_THE_FEET'))
        // Nowhere else but as one arm of the origin's alternative: no access rule, condition of its own or value modifier names it.
        assert.deepEqual(fact(facts, `block ${blockId}: other places the game names the role (not a team count or a restart's taker)`), ['value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-18.a].referents.arms[0].takenBy'])
    }
    const naming = fact(facts, 'sentences naming the role, with any word of obligation or prescription finding')
    // Moved 18 October 2026 (stage M5, design step L13), 3 -> 4: his approved build-out sentence (A01-W1) names the role ("the
    // goalkeeper's build-out") and carries "must". It has no prescription finding: the role is a value of the origin condition it covers
    // (arms[].takenBy), and his approval exempts it from the lexicon, never from the role rule (communication.unit.ts 3d). The evidence
    // still lists the word, so he sees it. The three DRAFT sentences are unchanged.
    // Moved 18 October 2026 (design step L14), 4 -> 5: his eligibility sentence (A01-W3, his reply filed 20 October 2026, item 2) names
    // the role ("the next goalkeeper restart") and carries "cannot" and "until". No prescription finding, for the same reason as his build-out
    // sentence: it covers the origin condition whose arm the role is, and approval exempts it from the lexicon only. Listed, so he sees it.
    // Moved 21 October 2026 (stage 2B), 5 -> 7: the opening restart is said as WHEN and HOW, both naming its taker, and where it is taken
    // now names its own restart ("You choose where the building team's goalkeeper restarts play, ..."), so three DRAFT sentences name the
    // role where one did; none carries a word of obligation or a prescription finding.
    assert.equal(naming.length, 7)
    assert.deepEqual(
        naming.filter((s: any) => s.text.includes(`building team's ${ROLE} restarts play`)).map((s: any) => s.text.split(',')[0].split(':')[0]),
        [`The building team's ${ROLE} restarts play`, `The building team's ${ROLE} restarts play from the feet`, `You choose where the building team's ${ROLE} restarts play`],
    )
    assert.ok(naming.every((s: any) => s.q4.length === 0))
    assert.deepEqual(naming.filter((s: any) => s.obligationWords.length).map((s: any) => [s.text, s.obligationWords]), [[HIS_ITEM_1, [String(/\bmust\b/i)]], [HIS_W3, [String(/\bcan ?not\b/i), String(/\buntil\b/i)]]])
    // No prescription: nothing on the rows that would restrict play, no prescription finding, no lexicon word, no library constraint.
    const np = evidence.sections.noPrescription
    for (const blockId of BLOCKS) {
        for (const row of ['action restrictions (R1: a rule changing whether an otherwise available action or target is eligible)', 'consequences (V11, including an ACCESS effect, V13)', 'time windows (V23)', 'value modifiers (V7)', 'objective sets (J5)']) assert.equal(fact(np, `block ${blockId}: ${row}`), 0, row)
        assert.deepEqual(fact(np, `block ${blockId}: condition types the game holds`), ['origin', 'progression', 'control', 'exclusion'])
    }
    assert.deepEqual(fact(np, 'prescription rule (fidelity Q4) findings on the activity'), [])
    // Moved 18 October 2026 (stage M5), [] -> his approved sentence, which says "must" (above); no DRAFT sentence carries one.
    // Moved 18 October 2026 (design step L14): and his eligibility sentence (A01-W3), which says "cannot" and "until"; still no DRAFT.
    assert.deepEqual(fact(np, 'sentences carrying a word of the obligation lexicon'), [HIS_ITEM_1, HIS_W3])
    assert.deepEqual(fact(np, 'library constraints selected'), [])
    assert.ok(fact(np, 'excluded from this goal by its record').length >= 1)
})

test('6. his item 6 flag answered from the game, the read-only knowledge listed; the regain case settled only by his ruling carried in the game (re-pointed 17 October 2026, stage M3)', () => {
    const [advanced, regain] = evidence.flags
    assert.equal(advanced.kind, 'ADVANCED_POSITIONING')
    assert.equal(advanced.status, 'FLAGGED_FOR_REVIEW')
    assert.ok(advanced.answer.startsWith('Yes. Once play starts, nothing in the generated game prevents a player of the BUILDING role'), advanced.answer)
    const first = advanced.blocks[0].facts
    assert.deepEqual(fact(first, "the BUILDING role's target (c:restated:GF2:GF2-03.f)"), { from: 20, to: 40 })
    assert.deepEqual(fact(first, 'the element its target is placed beyond, a separate element'), { elementId: 'c:provisional:A01-R1:A01-R1-S2-1', noun: 'line', along: { from: 20, to: 20 } })
    assert.deepEqual(fact(first, "the BUILDING role's start placement"), { region: { from: 0, to: 20 }, timing: 'CONDITIONAL_RESET', resetsAt: 'BUILD_OUT_EPISODE' })
    assert.deepEqual(fact(first, "the other role's start placement, and whether it lies in this target"), [{ group: 'ROLE_HOLDER_PRESSING', region: { from: 20, to: 40 }, insideTarget: true }])
    // Read-only listing: the two library entries typed spatial, none contracted, authorized or applied; the corpus items on those rows,
    // measured: four exclusions (the game form excludes rules removing legal passing options, banned receivers among them; the context
    // excludes a consequence making high pressure dominant; the wide-zone constraint, excluded from this goal, forbids an access function
    // on its channels and names them as a forbidden referent) and one supporting consequence (that constraint's free restart on entering
    // a channel). None authors a rule on where a player may be.
    const library = advanced.knowledge!.libraryEntries
    assert.deepEqual(library.map(e => e.what.split(' — ')[0]).sort(), ['tl-v0-constraint-final-third-value', 'tl-v0-constraint-support-lane-requirement'])
    assert.ok(library.every(e => !(e.value as any).contracted && !(e.value as any).authorizedForThisGoal))
    const corpus = advanced.knowledge!.corpusItems
    assert.deepEqual(
        corpus.map(e => [e.what, (e.value as any).strictness]),
        [
            ['restated:RPC-001::RPC-001-21.b (V11)', 'EXCLUSION'],
            ['restated:GF2::GF2-22 (R1)', 'EXCLUSION'],
            ['restated:WIDE-ZONE-ADVANTAGE::WIDEZONE-08.a (S4)', 'EXCLUSION'],
            ['restated:WIDE-ZONE-ADVANTAGE::WIDEZONE-08.b (V14b)', 'EXCLUSION'],
            ['restated:WIDE-ZONE-ADVANTAGE::WIDEZONE-13.c (V13)', 'SUPPORTING'],
        ],
    )
    // The regain case: facts, no invented rule.
    // Re-pointed 17 October 2026 (stage M3, design step L7): his reply filed 19 October 2026, item 2, settles it provisionally ("For the
    // previously flagged corner case, I favor allowing a controlled regain inside that area to count as a score, provided the pressing
    // team genuinely establishes possession."), and the game carries it (A01-R1-V27-1, stage M2). Was: status FLAGGED_FOR_REVIEW and
    // the answer "Not settled by the game: ...", which test 10 shows returns exactly where the element and his ruling are both removed.
    assert.equal(regain.kind, 'REGAIN_INSIDE_TARGET')
    assert.equal(regain.status, 'SETTLED_BY_RULING')
    assert.ok(regain.answer.startsWith('Settled by his ruling, provisionally (his reply filed 19 October 2026, item 2)'), regain.answer)
    assert.deepEqual(regain.settledBy, request.flags[1].settledBy)
    assert.deepEqual(fact(regain.blocks[0].facts, "the PRESSING role's target (c:restated:GF2:GF2-03.e)"), { from: 0, to: 5 })
    const deciding = (blockIndex: number) => fact(regain.blocks[blockIndex].facts, 'elements deciding whether gaining possession inside the target scores')
    assert.deepEqual(deciding(0).map((e: any) => [e.elementId, e.team, e.trigger, e.target.region, e.everyItemHisRuling]), [['c:provisional:A01-R1:A01-R1-V27-1', 'ROLE_HOLDER_PRESSING', 'POSSESSION_CHANGE', 'c:restated:GF2:GF2-03.e', true]])
    assert.deepEqual(deciding(1).map((e: any) => [e.elementId, e.target.region, e.target.along]), [['c:provisional:A01-R1:A01-R1-V27-1', 'c:restated:GF2:GF2-03.f', { from: 35, to: 40 }]])
    assert.deepEqual(deciding(0)[0].support.map((s: any) => [s.item, s.basis, s.citedAs]), ['V27-1', 'V29-1', 'V30-1', 'V31-1'].map(id => [`provisional:A01-R1::A01-R1-${id}`, 'OWNER_RULING', 'his reply filed 19 October 2026, item 2']))
    // The entry meaning is unchanged (his 17 October D7 on entry stands): still no element makes it an entry.
    assert.deepEqual(fact(regain.blocks[0].facts, 'elements deciding whether gaining possession inside the target is an entry into it'), [])
    assert.deepEqual(fact(regain.blocks[0].facts, 'a change of possession'), [{ playState: 'CONTINUE', beginsConditionedEpisode: false }])

    // TEST-ONLY: the same games with an action restriction added to each change the answer — the flag reads the game, it does not assume it.
    const { fixture } = buildActivityWithFixture(a01)
    const blocks: EvidenceBlock[] = ((fixture as any).roleBlocks.blocks as any[]).map(block => {
        const copy = JSON.parse(JSON.stringify(block.fixture))
        copy.game.rules = { actionRestrictions: [{ elementId: 'c:TEST-ONLY:R-1', kind: 'receiver_eligibility' }] }
        return { blockId: block.blockId, holders: block.holders, fixture: copy, contracts: [], rendered: renderConcreteGame(copy), findings: [], gateChecks: [], owed: [] }
    })
    const altered = reviewEvidenceOf({ outcome: 'TEST-ONLY', session, blocks, composed: blocks[0].rendered, compositionFindings: [], crossBlock: [], record: record as any, lists: null, relationships: [], selectedConstraints: [], index })
    assert.ok(altered.flags[0].answer.startsWith('The game holds a rule'), altered.flags[0].answer)
    assert.equal(fact(altered.flags[0].blocks[0].facts, 'action restrictions (R1: a rule changing whether an otherwise available action or target is eligible)'), 1)
})

test('7. the structural report reads the gates\' own verdicts; the checked pathway is said; the loader refuses a damaged request', () => {
    for (const block of evidence.structure.blocks) {
        assert.ok(block.sections.playerTotals.checks.some(c => c.checkId === 'GA-ROSTER-SUM' && c.verdict === 'PASS'))
        assert.deepEqual(fact(block.sections.playerTotals.facts, 'players in the teams, against the session'), { inTeams: 12, session: 12 })
        assert.equal(fact(block.sections.spatial.facts, 'the scoring targets share no stretch of the axis (touching at a line is not sharing)'), true)
        // Every check of the rerun appears in exactly one section, so nothing is hidden by the grouping.
        const shown = Object.values(block.sections).flatMap(s => s.checks.map(c => c.checkId))
        assert.equal(new Set(shown).size + shown.filter(id => id === 'GA-EPISODE-REACHABLE').length - 1, shown.length, 'only the episode check is shown twice (scoring and restarts)')
    }
    // A vacuous pass is named as such, never counted as evidence: GA-TIME-WINDOWS has no window to range over.
    assert.ok(evidence.structure.summary.vacuousClauses.some(c => c.includes('GA-TIME-WINDOWS')))
    // His item 7: which pathway built it, and what the live route does with it, beside his words. Restated 22 October 2026 (the live-app
    // fix): the live route builds a record-backed selection through this same checked pathway, so the fact says so, read from the authority.
    assert.equal(evidence.pathway.route, 'CHECKED_REVIEW')
    assert.ok(String(fact(evidence.pathway.facts, 'the live generation route')).startsWith('builds this activity through this same checked pathway'))
    // The loader: a damaged copy of the request is refused, naming what is wrong (TEST-ONLY copies).
    const damaged = (alter: (copy: any) => void) => {
        const copy = JSON.parse(JSON.stringify(request))
        alter(copy)
        return validateReviewRequest('A01', copy)
    }
    assert.deepEqual(validateReviewRequest('A01', request), [])
    assert.ok(damaged(c => c.layers.entries.pop()).some(e => e.includes('three layers')))
    assert.ok(damaged(c => (c.items[0].sections = ['NOT_A_SECTION'])).some(e => e.includes('points at no section')))
    assert.ok(damaged(c => (c.items[1].words = '')).some(e => e.includes('quotes nothing')))
    assert.ok(damaged(c => (c.flags[0].kind = 'TEST-ONLY')).some(e => e.includes('flag 1')))
    assert.ok(damaged(c => (c.rationale[0].words[0].citedAs = '')).some(e => e.includes('rationale 1')))
    assert.ok(damaged(c => (c.items[0].rows = [])).some(e => e.includes('names no register row')))
    // And through the whole record's gate.
    assert.ok(validateLearningGoalAuthorizations([{ ...record, reviewRequest: { ...request, pathway: { words: '', citedAs: '' } } }]).some(e => e.includes('checked pathway')))
    // Every item's rows are register rows and every check is one the evidence can read.
    for (const item of request.items) for (const row of item.rows) assert.ok(index.rows.has(row), `${item.id}: ${row}`)
    const known = new Set([...evidence.structure.blocks[0].sections.playerTotals.checks, ...Object.values(evidence.structure.blocks[0].sections).flatMap(s => s.checks)].map(c => c.checkId))
    for (const item of request.items) for (const check of item.checks) assert.ok(check.startsWith('RB-') || known.has(check), `${item.id}: ${check}`)
    // readPath reads member ids that hold dots and colons whole.
    assert.equal(readPath({ regions: [{ elementId: 'c:x:Y-1.e', noun: 'zone' }] }, 'regions[c:x:Y-1.e].noun'), 'zone')
    assert.deepEqual(readPath({ teams: [{ n: 1 }, { n: 2 }] }, 'teams[].n'), [1, 2])
})

/*
 * K8 review, 15 October 2026. Each block of A01's production selection built through the same steps as the checked pathway (as
 * target-placement.unit.ts builds them), so a COPY of a block's concrete game can be broken and the post-realization gates rerun on it.
 * The evidence for a broken copy is then made from the gates' own verdicts on that copy: nothing below writes a verdict by hand.
 */
const productionFixture: any = buildActivityWithFixture(a01).fixture
const productionBlocks: any[] = productionFixture.roleBlocks.blocks
function a01Games() {
    const selection = selectFor('A01', null)
    const input: any = { ...derivationInputFor(selection), envelope: session }
    input.contracts = applyRealizationDeferrals(JSON.parse(JSON.stringify(input.contracts)), contextManipulationRelationships(), index).contracts
    const base: any = runStages0to5(input)
    const found: any = roleBlocksOf(base.classes, base.derived.lines, index)
    assert.equal(found?.kind, 'BLOCKS')
    return (found.blocks as RoleBlock[]).map(block => {
        const blockInput = { ...input, roleBlock: block }
        const derived: any = runDerivation(blockInput)
        const staged: any = runStages0to10(blockInput)
        const resolved: any = assembleResolvedGame(derived, staged.classes, index, blockInput.contracts)
        const ctx = { ...staged.gateContext, contracts: blockInput.contracts }
        const { realization } = realizeWithJustifiedDefaults(resolved, JSON.parse(JSON.stringify(suppliedRealizationFor(selection))), index, blockInput.envelope, ctx)
        const realized: any = realization
        assert.equal(realized.outcome, 'REALIZED')
        completeConcreteGame(ctx, realized)
        const owed = resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause }))
        return { block, ctx, owed, realized, contracts: blockInput.contracts as LoadedContract[] }
    })
}
const games = a01Games()
/** One block's evidence input from a (possibly broken) concrete game: the gates rerun on it, mapped exactly as build-activity maps them. */
function evidenceBlock(game: ReturnType<typeof a01Games>[number], realized: any, ctx: any = game.ctx, alterFixture: (fixture: any) => void = () => undefined): EvidenceBlock {
    const post = runPostRealizationGates(ctx, game.owed, realized)
    const production = productionBlocks.find(b => b.blockId === game.block.blockId)
    const fixture = JSON.parse(JSON.stringify(production.fixture))
    alterFixture(fixture)
    return {
        blockId: game.block.blockId,
        holders: { ...production.holders },
        fixture,
        contracts: game.contracts,
        rendered: renderConcreteGame(fixture),
        findings: [],
        gateChecks: post.gateA.checks.map(check => ({ checkId: check.checkId, verdict: String(check.verdict), clauses: check.clauses.map(clause => ({ clause: clause.clause, verdict: String(clause.verdict), ...(clause.basis ? { basis: String(clause.basis) } : {}), ...(typeof clause.instances === 'number' ? { instances: clause.instances } : {}) })) })),
        owed: post.owed.map(entry => ({ checkId: entry.checkId, clause: entry.clause, verdict: entry.verdict })),
    }
}
const evidenceFrom = (blocks: EvidenceBlock[], relationships = contextManipulationRelationships()) =>
    reviewEvidenceOf({ outcome: 'TEST-ONLY', session, blocks, composed: blocks[0].rendered, compositionFindings: [], crossBlock: [], record: record as any, lists: null, relationships, selectedConstraints: [], index })
const copyOf = (realized: any) => JSON.parse(JSON.stringify(realized))

test('8. the structural report FAILS on a broken copy of each part he named, from the gates rerun on that copy', () => {
    // The helper reproduces the pathway: on the unbroken games every rerun check passes, the same checks the production evidence shows.
    const intact = evidenceFrom(games.map(game => evidenceBlock(game, game.realized)))
    assert.equal(intact.structure.summary.everyCheckPasses, true)
    assert.deepEqual(intact.structure.summary.gateChecks, evidence.structure.summary.gateChecks)

    const [first, second] = games
    const broken = (section: 'playerTotals' | 'spatial' | 'scoring' | 'restarts', checkId: string, clause: string, block: EvidenceBlock) => {
        const report = evidenceFrom([block, evidenceBlock(second, second.realized)])
        const row = report.structure.blocks[0].sections[section].checks.find(c => c.checkId === checkId)
        assert.ok(row, `${section}: ${checkId} is shown`)
        assert.equal(row!.verdict, 'FAIL', `${section}: ${checkId}`)
        assert.ok(row!.clausesNotPassing.some(c => c.clause === clause && c.verdict === 'FAIL'), `${section}: ${JSON.stringify(row!.clausesNotPassing)}`)
        assert.equal(report.structure.summary.everyCheckPasses, false, section)
        assert.equal(fact(report.acceptance, 'every structural check passes (Gate A rerun per block, post-realization owed invariants, cross-block checks, composition)'), false, section)
        assert.equal(report.structure.blocks[1].sections[section].checks.every(c => c.verdict === 'PASS'), true, `${section}: the other block is untouched`)
        return report
    }

    // Player totals (TEST-ONLY): one more outfield player on the team holding the building role than the session has.
    const roster = copyOf(first.realized)
    roster.game.performers.teams[0].outfieldCount += 1
    const totals = broken('playerTotals', 'GA-ROSTER-SUM', 'outfield + goalkeepers + neutrals = the session players', evidenceBlock(first, roster, first.ctx, fixture => (fixture.game.performers.teams[0].outfieldCount += 1)))
    assert.deepEqual(fact(totals.structure.blocks[0].sections.playerTotals.facts, 'players in the teams, against the session'), { inTeams: 13, session: 12 })

    // Spatial relationships (TEST-ONLY): the pressing role's target stretched from 5 m to 25 m deep, into the building role's target.
    const spatial = copyOf(first.realized)
    spatial.record.geometry.find((g: any) => g.lineId === 'c:restated:GF2:GF2-03.e::S5').geometry.interval = { from: 0, to: 25 }
    broken('spatial', 'GA-DIRECTION', "the opposed objectives' targets do not overlap along the axis", evidenceBlock(first, spatial))

    // Scoring conditions (TEST-ONLY): a primary event of no registered kind.
    const scoring = copyOf(first.realized)
    scoring.record.choices.find((c: any) => c.lineId === 'game::V1').value = 'TEST-ONLY-kind'
    broken('scoring', 'GA-ONE-PRIMARY-EVENT', 'exactly one primary event, of a registered kind', evidenceBlock(first, scoring))

    // Restarts (TEST-ONLY): the start transition made CONTINUE while it still carries its taker and the coach's location.
    const playState = 'c:provisional:A01-R1:A01-R1-T1-1::T6'
    const line = first.ctx.derived.get(playState)
    const derived = new Map(first.ctx.derived)
    derived.set(playState, { ...line, entailing: line.entailing.map((e: any) => ({ ...e, value: 'CONTINUE' })) })
    broken('restarts', 'GA-TRANSITION-COHERENCE', 'a CONTINUE transition carries no placement', evidenceBlock(first, first.realized, { ...first.ctx, derived }))
})

test('9. the relationships he confirmed reach every element and sentence whose item cites one; a withheld field keeps its row', () => {
    // Every provisional item that cites a relationship, wherever it is a source, stands beside that relationship, CONFIRMED and approved.
    const cites = new Map<string, string>(games[0].contracts.flatMap(contract => (contract.items ?? []).filter((item: any) => typeof item.authorizedBy === 'string').map((item: any) => [`${contract.contractId}::${item.itemId}`, String(item.authorizedBy)] as const)))
    assert.equal(cites.size, 8, 'eight provisional items cite a relationship (measured at this stage)')
    const carriers = [...evidence.provenance.elements, ...evidence.sections.instructions]
    let seen = 0
    for (const carrier of carriers) {
        for (const source of carrier.sources) {
            const relationship = cites.get(source.ref)
            if (!relationship) continue
            seen++
            assert.ok(carrier.sources.some(s => s.ref === `relationship ${relationship}` && s.standing === 'APPROVED' && s.layer === 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS'), `${source.ref} without ${relationship}`)
        }
    }
    assert.ok(seen > 0)
    const said = (start: string) => evidence.sections.instructions.find(i => i.text.startsWith(start))!
    assert.ok(said('Divide 12 players').sources.some(s => s.ref === 'relationship RPC-001~EM-0006' && s.standing === 'APPROVED'))
    assert.ok(said('Before each of these restarts').sources.some(s => s.ref === 'relationship RPC-001~EM-0002' && s.standing === 'APPROVED'))
    // TEST-ONLY: the same relationship not CONFIRMED is our reading, never approved; one the record file lacks is named as missing.
    const blocks = games.map(game => evidenceBlock(game, game.realized))
    const unconfirmed = evidenceFrom(blocks, contextManipulationRelationships().map(r => ({ ...r, status: 'TEST-ONLY' as any })))
    const placement = unconfirmed.provenance.elements.find(e => e.sources.some(s => s.ref === 'relationship RPC-001~EM-0002'))!
    assert.ok(placement.sources.filter(s => s.ref === 'relationship RPC-001~EM-0002').every(s => s.standing === 'OUR_READING'))
    const missing = evidenceFrom(blocks, [])
    assert.ok(missing.provenance.elements.some(e => e.sources.some(s => s.ref === 'relationship RPC-001~EM-0006' && s.standing === 'OUR_READING' && String(s.detail).includes('not found'))))

    // A withheld field keeps the row the renderer reported. Re-pointed 18 October 2026 (stage M5, design step L13): the four condition
    // scopes are no longer withheld or GAP, said by his approved sentence (A01-W1); the withheld fields are now the regain score's four,
    // each GAP on the row the renderer reported (V28-V31). Was: the scopes GAP on row V3, and item 4 waiting on all 15. The scopes keep
    // row V3 once said (wordedFieldRows, stage M5: measured, without it they lost the row and item 4 dropped its four scope elements),
    // and item 4 still lists each scope in both blocks.
    const scopes = evidence.provenance.elements.filter(e => e.path.endsWith('.scope') && e.path.startsWith('value.primaryEvent.conditions['))
    assert.equal(scopes.length, 4)
    assert.ok(scopes.every(e => e.row === 'V3' && !e.sources.some(s => s.standing === 'GAP')), JSON.stringify(scopes.map(e => [e.path, e.row])))
    const itemFour = evidence.items.find(i => i.id === 'R4')!
    for (const block of itemFour.blocks) assert.deepEqual(block.elements.filter(e => e.path.endsWith('.scope')).map(e => [e.row, e.value]), scopes.map(() => ['V3', 'BUILD_OUT_EPISODE']), block.blockId)
    // Re-pointed 18 October 2026 (design step L14): on production the regain score's four fields are said by A01-W2 (his reply filed 20
    // October 2026, item 1) and keep their rows, never GAP; withheld (the TEST-ONLY table as at stage M5) each is GAP on its row.
    const ALSO_ROWS: Record<string, string> = { team: 'V28', trigger: 'V29', control: 'V30', exclusion: 'V31' }
    for (const [field, row] of Object.entries(ALSO_ROWS)) {
        const path = `value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].${field}`
        const element = evidence.provenance.elements.find(e => e.path === path)!
        assert.ok(element.row === row && !element.sources.some(s => s.standing === 'GAP'), `${field}: ${JSON.stringify(element)}`)
        const withheld = evidenceAtStageM5.provenance.elements.find(e => e.path === path)!
        assert.ok(withheld.row === row && withheld.sources.some(s => s.standing === 'GAP'), `${field} (as at stage M5): ${JSON.stringify(withheld)}`)
    }
    assert.ok(!evidence.provenance.elements.some(e => e.standings.includes('GAP') && e.row === null))
    assert.ok(!evidenceAtStageM5.provenance.elements.some(e => e.standings.includes('GAP') && e.row === null))
    const r4 = evidence.items.find(i => i.id === 'R4')!
    // Re-pointed 17 October 2026 (stage M1): the building role's credit bound (row B8, his reply filed 19 October 2026, item 1 and item
    // 3 C) is withheld too, and it sits on the role element, so the item whose rows hold the roles (R7) is the one that awaits it
    // until design step L7 (stage M3) shows it under item 4. R4 still awaits every withheld condition field, and between them the two
    // items await every withheld field.
    // Re-pointed 17 October 2026 (stage M3, design step L7): item 4 now lists row B8, so it awaits the building role's bound beside the
    // conditions; the role element belongs to the item of the role it names, so item 5 (which lists B8 too) does not await it.
    // Re-pointed 18 October 2026 (stage M5, design step L13): items 4 and 7 await nothing - his approved sentence (A01-W1) says the bound
    // and every condition field - so item 5 alone awaits, and its four fields are every withheld field. Was: R4 the conditions and the
    // bound, R7 the bound.
    const CREDIT_BOUND = 'activityRoles[c:provisional:A01-R1:A01-R1-B1-1].creditedWithin'
    // Re-pointed 18 October 2026 (design step L14): production withholds nothing (review.rendered.withheld) and no item awaits anything;
    // the item-by-item account of a withheld field below is measured on the TEST-ONLY table as at stage M5, unchanged.
    assert.deepEqual(review.rendered.withheld, [])
    assert.deepEqual(evidence.items.map(i => [i.id, i.awaiting]), evidence.items.map(i => [i.id, []]))
    const withheldPaths = new Set(atStageM5.draft!.withheld.map(w => w.path))
    assert.deepEqual([...withheldPaths].filter(p => p.startsWith('value.primaryEvent.conditions[') || p === CREDIT_BOUND), [])
    const r4AtM5 = evidenceAtStageM5.items.find(i => i.id === 'R4')!
    assert.deepEqual(r4.awaiting, [])
    assert.deepEqual(r4AtM5.awaiting, [])
    const r7 = evidenceAtStageM5.items.find(i => i.id === 'R7')!
    assert.deepEqual(r7.awaiting, [])
    // Re-pointed 17 October 2026 (stage M2): the pressing role's regain score (rows V27-V31, his reply filed 19 October 2026, item 2)
    // is withheld too, and the record's item 5 (R5, the pressing team's post-regain objective) now lists its rows, so R5 awaits exactly
    // its four fields; between the three items every withheld field is awaited.
    const r5 = evidenceAtStageM5.items.find(i => i.id === 'R5')!
    assert.deepEqual([...r5.awaiting].sort(), ['control', 'exclusion', 'team', 'trigger'].map(field => `value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1].${field}`))
    // Re-pointed 17 October 2026 (stage M3): the bound is awaited by item 4 and item 7, so the union, not the sum, is every withheld field.
    assert.deepEqual(new Set([...r4AtM5.awaiting, ...r5.awaiting, ...r7.awaiting]), withheldPaths)
    assert.ok(!r5.blocks.some(b => b.elements.some(e => e.path === CREDIT_BOUND)), 'the building role\'s bound is not item 5\'s')
    assert.ok(r5.blocks.every(b => b.elements.some(e => e.path === 'activityRoles[c:provisional:A01-R1:A01-R1-B1-2].creditedWithin' && e.value === 'WHOLE_GAME')), 'the pressing role\'s whole-game bound is item 5\'s')

    // His M8 safeguard, recorded on the item that types the exclusion's target, is read beside the conditions (scoring and the item 6
    // flag), whole from the knowledge: compared with the item's own note, never with a sentence written here.
    const noted = games[0].contracts.flatMap(contract => (contract.items ?? []).map((item: any) => ({ ref: `${contract.contractId}::${item.itemId}`, fitNote: item.fitNote })))
    const notes = (value: any[]) => value.flatMap(condition => condition.notes as { item: string; fitNote: string }[])
    const scoringNotes = notes(fact(evidence.sections.scoring, `block ${BLOCKS[0]}: the items each condition rests on, and the notes the knowledge records on them`))
    const flagNotes = notes(fact(evidence.flags[0].blocks[0].facts, 'conditions on the primary event, with the episode each applies within and the notes the knowledge records on the items each rests on'))
    for (const list of [scoringNotes, flagNotes]) {
        assert.ok(list.length > 0)
        for (const note of list) assert.equal(note.fitNote, noted.find(n => n.ref === note.item)!.fitNote, note.item)
        assert.ok(list.some(note => note.fitNote.includes('SAFEGUARD')), 'the safeguard is among the notes')
    }
})

/*
 * Stage M3, 17 October 2026 (design step L7). His reply filed 19 October 2026: item 1 ("Please ensure the underlying scoring
 * eligibility reflects this distinction, rather than relying solely on the coach-facing wording."), item 2 (the pressing team's
 * controlled regain), item 5 (limitations kept visible) and item 6 ("please proceed with the review-page activity, provided its actual
 * scoring eligibility matches the approved distinction between an active build-out and subsequent possession regains.").
 */
test('10. (M3) items 4 and 5 show each role\'s credit and the regain score; the transition table says what begins and ends credit; F2 follows the game and his ruling; the limitations are listed', () => {
    const T = (id: string) => `c:provisional:A01-R1:A01-R1-${id}`
    const byId = Object.fromEntries(evidence.items.map(i => [i.id, i]))
    for (const [i, blockId] of BLOCKS.entries()) {
        const r4 = byId.R4.facts.find(b => b.blockId === blockId)!.facts
        assert.deepEqual(fact(r4, "the BUILDING role's scoring credit (B8), and the items it rests on"), {
            element: `activityRoles[${T('B1-1')}].creditedWithin`,
            creditedWithin: 'BUILD_OUT_EPISODE',
            support: [{ item: 'provisional:A01-R1::A01-R1-B8-1', basis: 'OWNER_RULING', citedAs: 'his reply filed 19 October 2026, item 1; item 3 C' }],
        })
        // As stage M1 measured on the gate (credit-episode.unit.ts): begun by the three goalkeeper restarts, ended by the change of
        // possession and the two restarts after the building team plays the ball out, kept by the two awarded to it.
        assert.deepEqual(fact(r4, "the transitions that begin the BUILDING role's credit (its episode begins)"), [T('T1-1'), T('T1-2'), T('T1-3')], `block ${i + 1}`)
        assert.deepEqual([...fact(r4, 'the transitions that end it (each begins another episode)')].sort(), [T('T1-5'), T('T1-7'), 'c:restated:GF2:GF2-07.a'].sort())
        assert.deepEqual(fact(r4, "the restarts that keep it (they begin no episode and are awarded to the team holding the BUILDING role)"), [T('T1-4'), T('T1-6')])
        assert.deepEqual(fact(r4, 'transitions that neither end nor keep it'), [])
        const authority = fact(r4, 'the authority: the episode check (GA-EPISODE-REACHABLE) on this block, and its two credit clauses')
        assert.equal(authority.verdict, 'PASS')
        assert.equal(authority.begins.verdict, 'PASS')
        assert.equal(authority.ends.verdict, 'PASS')
        assert.notEqual(authority.begins.basis, 'NO_APPLICABLE_INSTANCES', 'clause 4 is not vacuous')
        assert.notEqual(authority.ends.basis, 'NO_APPLICABLE_INSTANCES', 'clause 5 is not vacuous')
        // No occurrence also counts as the primary event for the building team.
        assert.deepEqual(fact(r4, 'occurrences that also count as the primary event for the team holding the BUILDING role (V27)'), [])
        const r5 = byId.R5.facts.find(b => b.blockId === blockId)!.facts
        assert.deepEqual(fact(r5, "the PRESSING role's scoring credit (B8), and the items it rests on").creditedWithin, 'WHOLE_GAME')
        assert.ok(!r5.some(f => f.what.startsWith('the transitions that begin')), 'a whole-game credit has no beginning or end to show')
        const regain = fact(r5, 'occurrences that also count as the primary event for the team holding the PRESSING role (V27)')
        assert.deepEqual(regain.map((e: any) => [e.elementId, e.team, e.trigger, e.target.region, e.control, e.exclusion]), [
            [T('V27-1'), 'ROLE_HOLDER_PRESSING', 'POSSESSION_CHANGE', i === 0 ? 'c:restated:GF2:GF2-03.e' : 'c:restated:GF2:GF2-03.f', 'genuinely establishes possession', 'a contested touch, deflection, or loose ball'],
        ])
        // The transition table: which transitions begin and end the building role's credit.
        const rows = evidence.sections.restarts.filter(r => r.blockId === blockId)
        assert.deepEqual(rows.filter(r => r.beginsCredit.length).map(r => [r.elementId, r.beginsCredit]), [T('T1-1'), T('T1-2'), T('T1-3')].map(id => [id, ['BUILDING']]))
        assert.deepEqual(rows.filter(r => r.endsCredit.length).map(r => r.elementId).sort(), [T('T1-5'), T('T1-7'), 'c:restated:GF2:GF2-07.a'].sort())
    }
    // Items about no role carry no role facts.
    assert.ok(evidence.items.filter(i => !i.role).every(i => i.facts.every(b => b.facts.length === 0)))
    // The scoring section still lists the four condition types: the credit bound is no condition, and F1 does not read it.
    for (const blockId of BLOCKS) assert.deepEqual(fact(evidence.sections.noPrescription, `block ${blockId}: condition types the game holds`), ['origin', 'progression', 'control', 'exclusion'])
    assert.deepEqual(fact(evidence.sections.noPrescription, `block ${BLOCKS[0]}: occurrences that also count as the primary event (V27)`), [{ elementId: T('V27-1'), team: 'ROLE_HOLDER_PRESSING', trigger: 'POSSESSION_CHANGE' }])

    // F2 follows the game and his ruling together (TEST-ONLY copies, the gates rerun on the unbroken games).
    const intact = games.map(game => evidenceBlock(game, game.realized))
    const withoutElement = games.map(game => evidenceBlock(game, game.realized, game.ctx, fixture => (fixture.game.value.primaryEvent.alsoCounts = [])))
    const unruled = { ...request, flags: request.flags.map(f => ({ ...f, settledBy: undefined })) }
    const from = (blocks: EvidenceBlock[], reviewRequest: any = request) => reviewEvidenceOf({ outcome: 'TEST-ONLY', session, blocks, composed: blocks[0].rendered, compositionFindings: [], crossBlock: [], record: { ...record, reviewRequest } as any, lists: null, relationships: contextManipulationRelationships(), selectedConstraints: [], index })
    const settled = from(intact)
    assert.equal(settled.flags[1].status, 'SETTLED_BY_RULING')
    assert.equal(settled.flags[1].answer, evidence.flags[1].answer, 'the helper reproduces the production answer')
    const notInGame = from(withoutElement)
    assert.equal(notInGame.flags[1].status, 'RULED_NOT_IN_GAME')
    assert.ok(notInGame.flags[1].answer.startsWith('Ruled and not in the game'))
    const oneBlockOnly = from([intact[0], withoutElement[1]])
    assert.equal(oneBlockOnly.flags[1].status, 'RULED_NOT_IN_GAME', 'every block must hold it')
    const notHisRuling = from(games.map(game => ({ ...evidenceBlock(game, game.realized), contracts: game.contracts.map(c => ({ ...c, items: (c.items ?? []).map((item: any) => (String(item.itemId).startsWith('A01-R1-V') ? { ...item, basis: 'TEST-ONLY' } : item)) })) })))
    assert.equal(notHisRuling.flags[1].status, 'RULED_NOT_IN_GAME', 'an element resting on anything but his ruling does not settle it')
    const unsettled = from(withoutElement, unruled)
    assert.equal(unsettled.flags[1].status, 'FLAGGED_FOR_REVIEW')
    assert.equal(unsettled.flags[1].answer, 'Not settled by the game: no element decides whether gaining possession inside this target is an entry into it. Flagged for his review, as he asked; no rule is invented.', 'the old answer, exactly')
    const elementOnly = from(intact, unruled)
    assert.equal(elementOnly.flags[1].status, 'FLAGGED_FOR_REVIEW')
    assert.ok(elementOnly.flags[1].answer.startsWith('The game holds an occurrence'), 'an element with no ruling is not settled')
    // F1 is untouched by all of it: byte-identical answer and facts in every variant.
    for (const variant of [notInGame, unsettled, elementOnly]) {
        assert.equal(variant.flags[0].status, 'FLAGGED_FOR_REVIEW')
        assert.deepEqual([variant.flags[0].answer, variant.flags[0].blocks], [settled.flags[0].answer, settled.flags[0].blocks])
    }
    assert.equal(evidence.flags[0].answer, settled.flags[0].answer)

    // The limitations he asked to keep visible, each in his words with what the game or the build holds.
    assert.deepEqual(evidence.limitations.map(l => [l.id, l.kind]), [['L1', 'SPECIALIZED_PERFORMERS_BEYOND_ROLE'], ['L2', 'FLAGGED_CASE'], ['L3', 'CHECKED_PATHWAY_ONLY']])
    const [second, advanced, live] = evidence.limitations
    assert.equal(fact(second.facts, `${ROLE}s available in the session`), 1)
    assert.equal(fact(second.facts, `block ${BLOCKS[0]}: ${ROLE}s the session has beyond the teams' counts (counted among the other players)`), 0)
    assert.deepEqual(fact(second.facts, `at an exchange of roles, ${ROLE}s that move`).map((r: any) => r.count), [1])
    assert.deepEqual(fact(advanced.facts, 'flag F1'), { kind: 'ADVANCED_POSITIONING', status: 'FLAGGED_FOR_REVIEW', answer: evidence.flags[0].answer })
    // Restated 22 October 2026 (the live-app fix): limitation L3's measured fact; his words stay as provenance.
    assert.ok(String(fact(live.facts, 'the live generation route')).startsWith('builds this activity through this same checked pathway'))
    assert.ok(live.his.some(w => w.words.includes('checked review pathway')), 'his L3 words are kept as he wrote them')
    assert.deepEqual(fact(evidence.provenance.openForReview, 'limitations kept visible, as he asked'), ['L1', 'L2', 'L3'])
    // At two goalkeepers the second is counted among the other players, in each block (a fact, no prescription).
    const twoKeepers = (buildActivityForReview({ ...a01, session: { ...session, roles: { ...session.roles, [ROLE]: 2 } } }, { includeDrafts: true }) as ServedActivity).evidence!
    assert.equal(fact(twoKeepers.limitations[0].facts, `block ${BLOCKS[1]}: ${ROLE}s the session has beyond the teams' counts (counted among the other players)`), 1)

    // The loader refuses a ruling on a flag no ruling settles, a settledBy without his cited words, and a limitation it cannot read.
    const damaged = (alter: (copy: any) => void) => {
        const copy = JSON.parse(JSON.stringify(request))
        alter(copy)
        return validateReviewRequest('A01', copy)
    }
    assert.ok(damaged(c => (c.flags[0].settledBy = c.flags[1].settledBy)).some(e => e.includes('of a kind no ruling settles')))
    assert.ok(damaged(c => (c.flags[1].settledBy = [{ words: '', citedAs: 'x' }])).some(e => e.includes('settled by no cited words')))
    assert.ok(damaged(c => (c.limitations[1].flag = 'F9')).some(e => e.includes('names the flag F9')))
    assert.ok(damaged(c => (c.limitations[0].kind = 'TEST-ONLY')).some(e => e.includes('unknown kind')))
    assert.ok(damaged(c => delete c.limitations[0].role).some(e => e.includes('names no specialized role')))
    assert.ok(damaged(c => (c.limitations[2].words = [])).some(e => e.includes('must quote him')))
})

test('11. (review of stage 2A) every section label the served activity uses has a recorded status: none approved, When it ends and Restarts and ball out DRAFT', () => {
    // A section label is coach-facing wording; until the review of stage 2A its status was in code comments only, and the evidence said
    // each sentence's status but no label's. Read by the section's name (sections.ts LABEL_STATUS), never by goal.
    const labels = evidence.sections.labels
    const used = SECTION_ORDER.filter(section => review.rendered.instructions.some(i => i.section === section))
    assert.deepEqual(labels.map(l => l.section), used, 'one label per section the served activity uses, in reading order')
    assert.deepEqual(used, [...SECTION_ORDER], 'A01 uses every section')
    for (const label of labels) {
        assert.equal(label.when, WHEN_OF_SECTION[label.section], label.section)
        assert.equal(label.status, 'DRAFT', `${label.section}: no section label is approved`)
        assert.ok(label.sentences.length > 0 && label.sentences.every(n => evidence.sections.instructions[n].section === label.section), label.section)
    }
    assert.deepEqual(labels.flatMap(l => l.sentences).sort((a, b) => a - b), evidence.sections.instructions.map(i => i.index), 'every sentence under exactly one label')
    for (const name of [WHEN_IT_ENDS, RESTARTS]) assert.equal(labels.find(l => l.section === name)?.status, 'DRAFT', name)
    assert.deepEqual(fact(evidence.acceptance, 'section labels'), { total: 8, approved: 0, draft: 8, draftLabels: [...SECTION_ORDER] })
})

console.log(`review-evidence.unit.ts — ${passed} passed`)
