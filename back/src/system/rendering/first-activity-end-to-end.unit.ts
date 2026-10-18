/**
 * **Stage M5, 18 October 2026 — the first complete activity end to end, with his first approved entry (design step L13).**
 *
 * Christian, reply filed 19 October 2026, item 6: *"With the above decisions, please proceed with the review-page activity, provided its
 * actual scoring eligibility matches the approved distinction between an active build-out and subsequent possession regains."*; item 1:
 * *"Approved with revised wording"* (his sentence, now entry A01-W1 in approved-coach-wording.json).
 *
 * What is pinned, on the PRODUCTION chain (Play Out from the Back through the checked review pathway, 40 x 30 m, 20 minutes) at 12
 * players with 1 and with 2 goalkeepers and at 11 players with 1:
 *
 *   1. every structural check passes in both blocks (Gate A rerun per block, the owed post-realization invariants, the cross-block
 *      checks, the composition), nothing in the text that is said is unfaithful, his sentence is said once and APPROVED, and the
 *      activity is refused ONLY at communication, for exactly the four fields of the pressing team's regain score in each block (rows
 *      V28-V31) - the scoring rule the sentence put to him on 19 October (A01-W2) is for. Nothing his A01-W1 sentence says is among the
 *      reasons;
 *   2. on a DEEP COPY of the approved table with TEST-ONLY approvals of both sentences put to him (A01-W2, the regain score; A01-W3,
 *      non-restoration), the same build is SERVED with no fidelity violation, nothing withheld and all three sentences said once;
 *   3. MEASURED and pinned so a change to it is visible: with the TEST-ONLY regain approval alone (no A01-W3) it is served too. No
 *      mechanism requires the non-restoration sentence; whether it is needed is his answer to the 19 October email ("If you feel your own
 *      sentence already says this, tell us and we will leave this one out.");
 *   4. the production table is never touched: the copies are discarded with the call.
 *
 * The TEST-ONLY approvals stand in for the table the renderer, fidelity and the review evidence all read (approvedWording), restored in a
 * finally; the sentences are our drafts put to him, never his words, and approvedBy says TEST-ONLY.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import * as wordingModule from './approved-wording'
import { ApprovedWording } from './approved-wording'
import { buildActivityForReview, RefusedActivity, ServedActivity } from './build-activity'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the first complete activity end to end, with his first approved entry (stage M5)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const SESSIONS: [number, number][] = [[12, 1], [12, 2], [11, 1]]
const requestAt = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers } } })
const BLOCKS = ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START']
const fact = (facts: { what: string; value: unknown }[], what: string): any => {
    const found = facts.find(f => f.what === what)
    assert.ok(found, `no fact "${what}"`)
    return found!.value
}

/** His reply filed 19 October 2026, item 1, verbatim: production entry A01-W1. */
const HIS_ITEM_1 =
    "Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score."
/** The two DRAFT sentences put to him on 19 October 2026 (our words, awaiting his yes). */
const W2_DRAFT = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession; a contested touch, deflection or loose ball does not count.'
const W3_DRAFT = 'Once the building team loses the ball, or plays it out of the area, its chance to score from that build-out is over, even if it wins the ball back later; its next chance starts with the next goalkeeper restart.'
const ALSO = 'value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1]'
const ALSO_ROWS: [string, string][] = [['team', 'V28'], ['trigger', 'V29'], ['control', 'V30'], ['exclusion', 'V31']]

const TEST_ONLY = { who: 'TEST-ONLY', date: '2026-10-19', quote: 'TEST-ONLY: a stand-in for his yes, not his words', ccs: 'TEST-ONLY' }
const regainElement = { base: 'value.primaryEvent.alsoCounts', field: 'team', equals: 'ROLE_HOLDER_PRESSING' }
/** TEST-ONLY A01-W2: the regain score's four fields on the pressing team's element (design step L14). */
const W2: ApprovedWording = {
    id: 'TEST-ONLY-A01-W2',
    covers: [
        { row: 'V28', match: { equals: 'ROLE_HOLDER_PRESSING' }, element: regainElement },
        { row: 'V29', match: { equals: 'POSSESSION_CHANGE' }, element: regainElement },
        { row: 'V30', match: { equals: 'genuinely establishes possession' }, element: regainElement },
        { row: 'V31', match: { equals: 'a contested touch, deflection, or loose ball' }, element: regainElement },
    ],
    sentence: W2_DRAFT,
    section: 'How to score',
    approvedBy: TEST_ONLY,
}
/** TEST-ONLY A01-W3: the building role's bound and the origin condition (design step L14), its covers copied from A01-W1's. */
const W3 = (production: ApprovedWording[]): ApprovedWording => {
    const w1 = production.find(entry => entry.id === 'A01-W1')!
    const covers = w1.covers.filter(cover => cover.row === 'B8' || cover.element?.equals === 'origin')
    return { id: 'TEST-ONLY-A01-W3', covers: JSON.parse(JSON.stringify(covers)), sentence: W3_DRAFT, section: 'How to score', approvedBy: TEST_ONLY }
}

/** Builds under a DEEP COPY of the approved table with `extra` added; the shared table is restored whatever happens. */
function underApprovals<T>(extra: (production: ApprovedWording[]) => ApprovedWording[], body: () => T): T {
    const read = wordingModule.approvedWording
    const production = read()
    try {
        ;(wordingModule as any).approvedWording = () => JSON.parse(JSON.stringify([...production, ...extra(production)]))
        return body()
    } finally {
        ;(wordingModule as any).approvedWording = read
    }
}

const before = JSON.stringify(wordingModule.approvedWording())

test('1. production: every structural check passes in both blocks, his sentence is said once, and only the regain score is refused, at communication', () => {
    for (const [players, keepers] of SESSIONS) {
        const what = `${players} players, ${keepers} ${ROLE}`
        const review = buildActivityForReview(requestAt(players, keepers), { includeDrafts: true }) as RefusedActivity
        assert.equal(review.outcome, 'refused', what)
        assert.equal(review.stage, 'communication', `${what}: ${JSON.stringify(review.reasons)}`)
        assert.equal(review.summary, 'Part of this activity is still waiting for approved coach wording, so it is not being shown.')
        const evidence = review.evidence!
        assert.deepEqual(fact(evidence.acceptance, 'blocks built through validation'), BLOCKS, what)
        assert.equal(fact(evidence.acceptance, 'every structural check passes (Gate A rerun per block, post-realization owed invariants, cross-block checks, composition)'), true, what)
        assert.deepEqual(evidence.structure.summary.gateChecks, { PASS: 38 }, what)
        assert.deepEqual(evidence.structure.summary.crossBlock, { PASS: 9 }, what)
        assert.deepEqual(evidence.structure.summary.owed, { PASS: 22 }, what)
        assert.equal(evidence.structure.composition.length, 0, what)
        assert.deepEqual(fact(evidence.acceptance, 'fidelity violations in the text that is said'), [], what)
        // Refused only for the regain score's four fields per block: withheld, and noted by fidelity as uncarried. Nothing else.
        assert.deepEqual(
            review.reasons,
            BLOCKS.flatMap(block => [
                ...ALSO_ROWS.map(([field, row]) => `block ${block}: awaiting approved wording: ${ALSO}.${field} (${row})`),
                ...ALSO_ROWS.map(([field]) => `block ${block}: fidelity Q3: ${ALSO}.${field} is established by the game and no instruction carries it`),
            ]),
            what,
        )
        assert.deepEqual(review.draft!.withheld.map(w => w.row), ['V28', 'V29', 'V30', 'V31', 'V28', 'V29', 'V30', 'V31'], what)
        assert.ok(!review.reasons.some(reason => reason.includes('creditedWithin') || reason.includes('primaryEvent.conditions[')), `${what}: nothing his sentence says`)
        // His sentence: said once in the composed activity, APPROVED, under How to score.
        const his = evidence.sections.instructions.filter(i => i.text === HIS_ITEM_1)
        assert.deepEqual(his.map(i => [i.section, i.wording]), [['How to score', 'APPROVED']], what)
        assert.ok(!evidence.sections.instructions.some(i => i.text === W2_DRAFT || i.text === W3_DRAFT), `${what}: neither sentence put to him is said`)
        assert.ok(!JSON.stringify(review).includes('TEST-ONLY'), `${what}: production data only`)
    }
})

test('2. TEST-ONLY approvals of both sentences put to him (A01-W2, A01-W3) on a deep copy: SERVED, no fidelity violation, nothing withheld', () => {
    for (const [players, keepers] of SESSIONS) {
        const what = `${players} players, ${keepers} ${ROLE}`
        const served = underApprovals(
            production => [W2, W3(production)],
            () => buildActivityForReview(requestAt(players, keepers), { includeDrafts: true }),
        ) as ServedActivity
        assert.equal(served.outcome, 'served', `${what}: ${JSON.stringify((served as unknown as RefusedActivity).reasons)}`)
        assert.equal(served.integrity.fidelityViolations, 0, what)
        assert.deepEqual(served.rendered.withheld, [], what)
        assert.deepEqual(served.roleBlocks!.checks.map(check => check.verdict), served.roleBlocks!.checks.map(() => 'PASS'), what)
        const evidence = served.evidence!
        assert.equal(fact(evidence.acceptance, 'outcome of the build'), 'served', what)
        assert.equal(fact(evidence.acceptance, 'every structural check passes (Gate A rerun per block, post-realization owed invariants, cross-block checks, composition)'), true, what)
        assert.deepEqual(fact(evidence.acceptance, 'fidelity violations in the text that is said'), [], what)
        assert.equal(fact(evidence.acceptance, 'fields awaiting approved wording'), 0, what)
        assert.equal(fact(evidence.acceptance, 'fidelity violations about fields awaiting approved wording'), 0, what)
        for (const sentence of [HIS_ITEM_1, W2_DRAFT, W3_DRAFT]) {
            assert.deepEqual(served.rendered.instructions.filter(i => i.text === sentence).map(i => i.section), ['How to score'], `${what}: said once`)
            assert.ok(evidence.sections.instructions.some(i => i.text === sentence && i.wording === 'APPROVED'), `${what}: approved`)
        }
        // The regain sentence cites the four fields it says, and nothing it does not.
        const regain = served.rendered.instructions.find(i => i.text === W2_DRAFT)!
        assert.deepEqual(regain.from, ALSO_ROWS.map(([field]) => `${ALSO}.${field}`), what)
    }
    assert.equal(JSON.stringify(wordingModule.approvedWording()), before, 'the production table is restored')
})

test('3. MEASURED: the regain approval alone serves it too - no mechanism requires the non-restoration sentence (his answer decides)', () => {
    for (const [players, keepers] of SESSIONS) {
        const served = underApprovals(
            () => [W2],
            () => buildActivityForReview(requestAt(players, keepers), { includeDrafts: true }),
        ) as ServedActivity
        assert.equal(served.outcome, 'served', `${players} players, ${keepers} ${ROLE}`)
        assert.equal(served.integrity.fidelityViolations, 0)
        assert.ok(!served.rendered.instructions.some(i => i.text === W3_DRAFT))
    }
    // And without either, production refuses (test 1): the regain sentence is the one that stops it.
    assert.equal(JSON.stringify(wordingModule.approvedWording()), before, 'the production table is restored')
})

test('4. the production table is untouched: A01-W1 alone, his words, no TEST-ONLY entry', () => {
    const table = wordingModule.approvedWording()
    assert.deepEqual(table.map(entry => entry.id), ['A01-W1'])
    assert.equal(table[0].sentence, HIS_ITEM_1)
    assert.ok(!JSON.stringify(table).includes('TEST-ONLY'))
    assert.equal(JSON.stringify(table), before)
})

console.log(`first-activity-end-to-end.unit.ts — ${passed} passed`)
