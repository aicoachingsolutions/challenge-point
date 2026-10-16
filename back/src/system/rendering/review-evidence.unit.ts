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
 *      not CONFIRMED is not approved, and a withheld field keeps the row the renderer reported.
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
import { buildActivity, buildActivityForReview, buildActivityWithFixture, RefusedActivity } from './build-activity'
import { buildPilotActivity } from './build-pilot-activity'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import { renderConcreteGame } from './render-concrete-game'
import { EvidenceBlock, readPath, reviewEvidenceOf } from './review-evidence'
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

const review = buildActivityForReview(a01, { includeDrafts: true }) as RefusedActivity
const evidence = review.evidence!
const fact = (facts: { what: string; value: unknown }[], what: string) => {
    const found = facts.find(f => f.what === what)
    assert.ok(found, `no fact "${what}" among ${JSON.stringify(facts.map(f => f.what))}`)
    return found!.value as any
}

test('1. end to end on production data: only communication stops it, both blocks valid, every check PASS, nothing unfaithful in what is said', () => {
    assert.equal(review.outcome, 'refused')
    assert.equal(review.stage, 'communication')
    assert.equal(evidence.status, 'EVIDENCE_FOR_REVIEW_NOT_SERVED')
    assert.deepEqual(fact(evidence.acceptance, 'outcome of the build'), 'communication')
    assert.deepEqual(fact(evidence.acceptance, 'blocks built through validation'), BLOCKS)
    assert.equal(fact(evidence.acceptance, 'every structural check passes (Gate A rerun per block, post-realization owed invariants, cross-block checks, composition)'), true)
    assert.deepEqual(fact(evidence.acceptance, 'fidelity violations in the text that is said'), [])
    // The 22 violations are all Q3 "established and no instruction carries it" on the withheld build-out conditions (communication.unit.ts 1).
    assert.equal(fact(evidence.acceptance, 'fidelity violations about fields awaiting approved wording'), 22)
    assert.equal(fact(evidence.acceptance, 'fields awaiting approved wording'), 30)
    assert.deepEqual(fact(evidence.acceptance, 'sentences'), { total: 24, approved: 0, draft: 24 })
    // Measured at this stage: 19 Gate A checks per block, all PASS; the 9 cross-block checks; 11 owed invariants per block.
    assert.deepEqual(evidence.structure.summary.gateChecks, { PASS: 38 })
    assert.deepEqual(evidence.structure.summary.crossBlock, { PASS: 9 })
    assert.deepEqual(evidence.structure.summary.owed, { PASS: 22 })
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
    assert.ok(byId.R4.awaiting.length > 0 && byId.R4.awaiting.every(p => p.startsWith('value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-')))
    assert.ok(byId.R5.blocks[0].elements.some(e => e.path === 'objectives[c:restated:GF2:GF2-08.e].reference'))
    assert.equal(byId.R8.sentences.length, 24)
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
    // The restart rests on his provisional choices (the taker among them), the ball on the sport profile.
    const restart = said(`The building team's ${ROLE} restarts play`)
    assert.ok(restart.sources.some(s => s.standing === 'PROVISIONAL' && s.ref === 'provisional:A01-R1::A01-R1-T3-1'))
    assert.ok(restart.sources.some(s => s.layer === 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS' && s.standing === 'APPROVED'))
    // The post-regain area's depth: the item bounding it is found (the fixture carries the bound without it).
    const depth = said("Mark the pressing team's target zone")
    assert.ok(depth.sources.some(s => s.ref === 'provisional:A01-R1::A01-R1-S5-3' && s.standing === 'PROVISIONAL'), JSON.stringify(depth.sources))
    // An adjustment: his provisional choice, through a relationship he CONFIRMED on 18 October.
    const moveLine = said('You may choose to move the marked line')
    assert.ok(moveLine.sources.some(s => s.ref === 'record A01-ADJ-3' && s.standing === 'PROVISIONAL'))
    assert.ok(moveLine.sources.some(s => s.ref === 'relationship RPC-001~EM-0002' && s.standing === 'APPROVED' && s.layer === 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS'))
    // The withheld conditions are GAP elements; nothing said is.
    const conditions = evidence.provenance.elements.filter(e => e.path.startsWith('value.primaryEvent.conditions['))
    assert.ok(conditions.some(e => e.standings.includes('GAP')))
    assert.ok(instructions.every(i => !i.standings.includes('GAP')))
    // Our readings are named, not hidden: the assumed bound beside the across-the-axis default.
    assert.ok(instructions.some(i => i.standings.includes('OUR_READING')))
    assert.equal(evidence.provenance.lists!.at, 'account.authorizationLists')
    assert.deepEqual(evidence.provenance.lists!.gapsStillNeeded, [])
})

test('4. key identity: the evidence reaches the administrator\'s review of a goal that asks for it, and nothing else', () => {
    const plain = buildActivity(a01) as RefusedActivity
    const { draft, evidence: carried, ...rest } = review
    assert.ok(draft && carried)
    assert.deepEqual(rest, plain, 'apart from the two admin-only keys, the administrator receives what the coach receives')
    assert.ok(!('evidence' in plain))
    assert.ok(!('reviewRequest' in (plain.account.authorization as object)), "the coach's account no longer copies the request")
    const stored: any = { _id: 'TEST-ONLY', createdBy: 'TEST-ONLY', playerCount: 12, fieldLength: '40', fieldWidth: '30', specializedRoles: { ...none, [ROLE]: 1 } }
    assert.ok(!('evidence' in reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 })))
    assert.deepEqual((reviewActivity(stored, { learningGoalId: 'A01', durationMin: 20 }, { includeDrafts: true }) as RefusedActivity).evidence, evidence)
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
    const READ = ['citedAs', 'layers', 'items', 'requests', 'evaluation', 'flags', 'pathway', 'judgement', 'rationale']
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
    assert.equal(naming.length, 3)
    assert.ok(naming.every((s: any) => s.obligationWords.length === 0 && s.q4.length === 0))
    // No prescription: nothing on the rows that would restrict play, no prescription finding, no lexicon word, no library constraint.
    const np = evidence.sections.noPrescription
    for (const blockId of BLOCKS) {
        for (const row of ['action restrictions (R1: a rule changing whether an otherwise available action or target is eligible)', 'consequences (V11, including an ACCESS effect, V13)', 'time windows (V23)', 'value modifiers (V7)', 'objective sets (J5)']) assert.equal(fact(np, `block ${blockId}: ${row}`), 0, row)
        assert.deepEqual(fact(np, `block ${blockId}: condition types the game holds`), ['origin', 'progression', 'control', 'exclusion'])
    }
    assert.deepEqual(fact(np, 'prescription rule (fidelity Q4) findings on the activity'), [])
    assert.deepEqual(fact(np, 'sentences carrying a word of the obligation lexicon'), [])
    assert.deepEqual(fact(np, 'library constraints selected'), [])
    assert.ok(fact(np, 'excluded from this goal by its record').length >= 1)
})

test('6. his item 6 flag answered from the game, the read-only knowledge listed; the regain case flagged and never settled', () => {
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
    // The regain case: facts, no rule.
    assert.equal(regain.kind, 'REGAIN_INSIDE_TARGET')
    assert.ok(regain.answer.startsWith('Not settled by the game'))
    assert.deepEqual(fact(regain.blocks[0].facts, "the PRESSING role's target (c:restated:GF2:GF2-03.e)"), { from: 0, to: 5 })
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
    // His item 7: the checked pathway is not the live one, and why, beside his words.
    assert.equal(evidence.pathway.route, 'CHECKED_REVIEW')
    assert.ok(String(fact(evidence.pathway.facts, 'the live generation route')).startsWith('does not serve this activity'))
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

    // A withheld field keeps the row the renderer reported: the four condition scopes (V3) are rows, and item 4 waits on all 15.
    const scopes = evidence.provenance.elements.filter(e => e.path.endsWith('.scope') && e.path.startsWith('value.primaryEvent.conditions['))
    assert.equal(scopes.length, 4)
    assert.ok(scopes.every(e => e.row === 'V3' && e.sources.some(s => s.standing === 'GAP' && String(s.detail).startsWith('row V3:'))))
    assert.ok(!evidence.provenance.elements.some(e => e.standings.includes('GAP') && e.row === null))
    const r4 = evidence.items.find(i => i.id === 'R4')!
    assert.equal(r4.awaiting.length, new Set(review.draft!.withheld.map(w => w.path)).size)

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

console.log(`review-evidence.unit.ts — ${passed} passed`)
