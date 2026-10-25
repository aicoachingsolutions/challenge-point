/**
 * **Stage M5, 18 October 2026 — the first complete activity end to end, with his first approved entry (design step L13); SERVED since
 * design step L14 (18 October 2026), on his two scoring statements.**
 *
 * Christian, reply filed 19 October 2026, item 6: *"With the above decisions, please proceed with the review-page activity, provided its
 * actual scoring eligibility matches the approved distinction between an active build-out and subsequent possession regains."*; item 1:
 * *"Approved with revised wording"* (his sentence, entry A01-W1 in approved-coach-wording.json). His reply filed 20 October 2026, item 1:
 * *"Pressing team's regain score — Approved as written."* (entry A01-W2); item 2: *"Building team's scoring eligibility — Include, with
 * simplified wording."* (entry A01-W3, his own sentence); *"With those two decisions, please proceed with making the complete activity
 * available on the review page."* and *"I understand that the remaining coach-facing sentences are still drafts, so this approval
 * applies specifically to the two scoring statements, not yet to the entire activity."*
 *
 * What is pinned, on the PRODUCTION chain (Play Out from the Back through the checked review pathway, 40 x 30 m, 20 minutes) at 12
 * players with 1 and with 2 goalkeepers and at 11 players with 1:
 *
 *   1. SERVED (re-pointed 18 October 2026, design step L14; until then refused only at communication, for exactly the four fields of
 *      the pressing team's regain score in each block, rows V28-V31, awaiting A01-W2): every structural check passes in both blocks
 *      (Gate A rerun per block, the owed post-realization invariants, the cross-block checks, the composition), nothing in the text that
 *      is said is unfaithful, nothing is withheld, and each of his three scoring sentences is said once, APPROVED;
 *   2. How to score reads in the order the design's coach text and our email of 19 October 2026 showed him (A01-W1, A01-W3, the
 *      pressing team's sentence, A01-W2, the value, the ends), and the sentences marked APPROVED are exactly his: the three scoring
 *      sentences and his possession sentence; every other sentence is DRAFT (the touchline sentence is DRAFT, its noun "throw-in" his
 *      approved word, carried as APPROVED sport coach vocabulary);
 *   3. MEASURED and pinned so a change to it is visible: no mechanism requires A01-W3 (every field it says is said by A01-W1 too), so a
 *      TEST-ONLY table without it still serves - which is why test 2 pins that production says it once;
 *   4. the production table holds his three entries, in that order, and no TEST-ONLY entry;
 *   5. 10 and 13 players are still refused, at the session, with their sentences.
 *
 * The TEST-ONLY table in test 3 stands in for the one the renderer, fidelity and the review evidence all read (approvedWording),
 * restored in a finally.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'

import * as wordingModule from './approved-wording'
import { ApprovedWording } from './approved-wording'
import { buildActivityForReview, buildActivityWithFixture, RefusedActivity, ServedActivity } from './build-activity'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the first complete activity end to end, served on his approved scoring statements (stages M5, L14)')

const ROLE = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const SESSIONS: [number, number][] = [[12, 1], [12, 2], [11, 1]]
// Re-pointed 24 October 2026 (K3, the d27 design's stage K3): the session states that it has no goal, so the zone version (A01-R1) is built
// exactly as before. Since K3 A01's record tries the goal version first, and a session that has not said what goals it has is asked first
// (his reply filed 26 October 2026, item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as
// confirmation that no goal exists.").
const requestAt = (players: number, keepers: number) => ({ kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [ROLE]: keepers }, objects: { goal: { count: 0 } } } })
const BLOCKS = ['BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START']
const fact = (facts: { what: string; value: unknown }[], what: string): any => {
    const found = facts.find(f => f.what === what)
    assert.ok(found, `no fact "${what}"`)
    return found!.value
}

/** His reply filed 19 October 2026, item 1, verbatim: production entry A01-W1. */
const HIS_ITEM_1 =
    "Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score."
/** His reply filed 20 October 2026, item 1, verbatim (our draft, approved as written): production entry A01-W2. */
const HIS_W2 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession; a contested touch, deflection or loose ball does not count.'
/**
 * His reply filed 20 October 2026, item 2, verbatim (his own wording): production entry A01-W3. Re-pointed 25 October 2026 (P1): his simplified
 * sentence, his reply filed 28 October 2026, item 9 ("This is a communication simplification, not a change in scoring eligibility."); the
 * 20 October sentence is kept superseded in the record and is never said (HIS_W3_20_OCT).
 */
const HIS_W3 = 'If the building team loses possession, it cannot score again until the next goalkeeper restart.'
const HIS_W3_20_OCT = 'If the building team loses possession or plays the ball out, it cannot score again until the next goalkeeper restart.'
/**
 * His reply filed 19 October 2026, item 4 (approved template sentence), as an instruction says it (no final full stop). Re-pointed 25 October
 * 2026 (P1): his reply filed 28 October 2026, item 5 replaces its last clause ("Each team keeps attacking the same target.").
 */
const HIS_POSSESSION = 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same target'
/** His reply filed 28 October 2026, item 4 (approved template sentence FIRST_BLOCK_CHOICE), as an instruction says it (P1). */
const HIS_FIRST_BLOCK = 'Decide which team builds first'
/** The draft our 19 October email put to him as sentence 2; his item 2 replaced it, so it is never said. */
const OUR_W3_DRAFT = 'Once the building team loses the ball, or plays it out of the area, its chance to score from that build-out is over, even if it wins the ball back later; its next chance starts with the next goalkeeper restart.'
const ALSO = 'value.primaryEvent.alsoCounts[c:provisional:A01-R1:A01-R1-V27-1]'
const ALSO_ROWS: [string, string][] = [['team', 'V28'], ['trigger', 'V29'], ['control', 'V30'], ['exclusion', 'V31']]

/** Builds under a DEEP COPY of the approved table filtered by `keep`; the shared table is restored whatever happens. */
function underTable<T>(keep: (entry: ApprovedWording) => boolean, body: () => T): T {
    const read = wordingModule.approvedWording
    const production = read()
    try {
        ;(wordingModule as any).approvedWording = () => JSON.parse(JSON.stringify(production.filter(keep)))
        return body()
    } finally {
        ;(wordingModule as any).approvedWording = read
    }
}

const before = JSON.stringify(wordingModule.approvedWording())

test('1. production: SERVED at 12 players (1 and 2 goalkeepers) and 11 - every structural check passes in both blocks, nothing unfaithful, nothing withheld', () => {
    for (const [players, keepers] of SESSIONS) {
        const what = `${players} players, ${keepers} ${ROLE}`
        const served = buildActivityForReview(requestAt(players, keepers), { includeDrafts: true }) as ServedActivity
        assert.equal(served.outcome, 'served', `${what}: ${JSON.stringify((served as unknown as RefusedActivity).reasons)}`)
        assert.equal(served.integrity.fidelityViolations, 0, what)
        assert.deepEqual(served.rendered.withheld, [], what)
        assert.deepEqual(served.roleBlocks!.checks.map(check => check.verdict), served.roleBlocks!.checks.map(() => 'PASS'), what)
        const evidence = served.evidence!
        assert.equal(fact(evidence.acceptance, 'outcome of the build'), 'served', what)
        assert.deepEqual(fact(evidence.acceptance, 'blocks built through validation'), BLOCKS, what)
        assert.equal(fact(evidence.acceptance, 'every structural check passes (Gate A rerun per block, post-realization owed invariants, cross-block checks, composition)'), true, what)
        // Re-pointed 22 October 2026: GA-PARTICIPANTS-PRESENT joins each block (38 -> 40) with its five clauses owed (22 -> 32), his reply
        // filed 25 October 2026, item 6 (participants-present.unit.ts).
        // Re-pointed 22 October 2026 (stage A): GA-ROLE-EVENTS joins each block (40 -> 42) with its target and yield clauses owed (32 -> 36),
        // his reply filed 25 October 2026, item 2 (role-events.unit.ts).
        // Re-pointed 24 October 2026 (R1): GA-DEAD-BALL-RESTART joins each block (42 -> 44) with its location clause owed (36 -> 38), his
        // reply filed 27 October 2026, item 4 (dead-ball-restart.unit.ts).
        assert.deepEqual(evidence.structure.summary.gateChecks, { PASS: 44 }, what)
        // Re-pointed 21 October 2026 (stage 2D): ten, RB-L joining (the markings set out once are the blocks' own).
        assert.deepEqual(evidence.structure.summary.crossBlock, { PASS: 10 }, what)
        assert.deepEqual(evidence.structure.summary.owed, { PASS: 38 }, what)
        assert.equal(evidence.structure.composition.length, 0, what)
        assert.deepEqual(fact(evidence.acceptance, 'fidelity violations in the text that is said'), [], what)
        assert.equal(fact(evidence.acceptance, 'fields awaiting approved wording'), 0, what)
        assert.equal(fact(evidence.acceptance, 'fidelity violations about fields awaiting approved wording'), 0, what)
        // Each of his three scoring sentences: said once, under How to score, APPROVED.
        for (const sentence of [HIS_ITEM_1, HIS_W2, HIS_W3]) {
            assert.deepEqual(served.rendered.instructions.filter(i => i.text === sentence).map(i => i.section), ['How to score'], `${what}: said once`)
            assert.deepEqual(evidence.sections.instructions.filter(i => i.text === sentence).map(i => i.wording), ['APPROVED'], `${what}: approved`)
        }
        // The regain sentence cites the four fields it says, and nothing it does not.
        assert.deepEqual(served.rendered.instructions.find(i => i.text === HIS_W2)!.from, ALSO_ROWS.map(([field]) => `${ALSO}.${field}`), what)
        assert.ok(!served.rendered.instructions.some(i => i.text === OUR_W3_DRAFT), `${what}: our draft, which his wording replaced, is not said`)
        assert.ok(!JSON.stringify(served).includes('TEST-ONLY'), `${what}: production data only`)
    }
})

test('2. How to score in the order shown to him, and APPROVED exactly for his sentences: the three scoring statements and his possession sentence', () => {
    for (const [players, keepers] of SESSIONS) {
        const what = `${players} players, ${keepers} ${ROLE}`
        const served = buildActivityForReview(requestAt(players, keepers), { includeDrafts: true }) as ServedActivity
        /*
         * Added 18 October 2026 (review of stage M5), production since design step L14: How to score reads in the order the design's coach
         * text and our email of 19 October 2026 showed him ("For context, How to score would read:"): the building team's sentence, the
         * non-restoration sentence (now his own wording), the pressing team's sentence, its regain sentence ("... inside that zone ..."
         * straight after the sentence naming that zone), then the value and the ends.
         */
        assert.deepEqual(
            served.rendered.instructions.filter(i => i.section === 'How to score').map(i => i.text),
            [
                HIS_ITEM_1,
                HIS_W3,
                // Moved 21 October 2026 (hardening H5, DRAFT): "into its target zone", his term; was "into the zone it is attacking".
                'Pressing team: Score by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside',
                HIS_W2,
                'Each score is worth 1 point',
                // Moved 21 October 2026 (stage 2D, his reply filed 22 October 2026, item 7): with every block's markings set out once, "Each
                // team attacks the zone at the other team's end. Decide which team starts at which end; the ends stay the same for the whole
                // game" is no longer said: each target sentence (Set up) says which marked zone each role attacks, "Decide which team starts
                // at which end" is said on its own in Set up, and the exchange sentence says each team keeps its end
                // (physical-layout.unit.ts). The order shown to him is otherwise unchanged.
            ],
            what,
        )
        // His approval covers his sentences only ("not yet to the entire activity"): every other sentence is a DRAFT.
        const instructions = served.evidence!.sections.instructions
        // Re-pointed 25 October 2026 (P1): his reply filed 28 October 2026, item 4 adds his first-block sentence (Set up, said first).
        assert.deepEqual(instructions.filter(i => i.wording === 'APPROVED').map(i => i.text), [HIS_FIRST_BLOCK, HIS_POSSESSION, HIS_ITEM_1, HIS_W3, HIS_W2], what)
        assert.equal(instructions.filter(i => i.wording === 'DRAFT').length, instructions.length - 5, what)
        // P1: his 20 October eligibility sentence, superseded by his 28 October one, is never said.
        assert.ok(!instructions.some(i => i.text === HIS_W3_20_OCT), what)
        // Re-pointed 24 October 2026 (R1): there is no throw-in any more (his reply filed 27 October 2026, item 4: "There should be no
        // separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this activity."), so no sentence names it and no block
        // carries the sport's restart noun; the ball going out is said in the DRAFT restart sentence. Was: the touchline sentence, DRAFT, its
        // noun his approved word carried into each block as APPROVED sport coach vocabulary.
        // Re-pointed 24 October 2026 (R2): one sentence names the throw-in now, to say there are none (DRAFT, Restarts and ball out, from the
        // default-laws account: dead-ball-wording.unit.ts). Was: no sentence named it.
        assert.deepEqual(
            instructions.filter(i => i.text.includes('throw-in')).map(i => [i.section, i.text, i.wording]),
            [['Restarts and ball out', 'There are no throw-ins or free kicks in this activity; fouls still matter, so deal with them appropriately', 'DRAFT']],
            what,
        )
        assert.deepEqual(instructions.filter(i => i.text.includes('whenever the ball goes out of play')).map(i => i.wording), ['DRAFT'], what)
        const blocks: any[] = ((buildActivityWithFixture(requestAt(players, keepers)).fixture as any)?.roleBlocks?.blocks ?? []).map((b: any) => b.fixture)
        assert.equal(blocks.length, 2, what)
        for (const block of blocks) assert.equal(block.methodNouns, undefined, what)
    }
})

test('3. MEASURED: no mechanism requires A01-W3 - a TEST-ONLY table without it still serves, every field it says being said by A01-W1 too', () => {
    for (const [players, keepers] of SESSIONS) {
        const served = underTable(
            entry => entry.id !== 'A01-W3',
            () => buildActivityForReview(requestAt(players, keepers), { includeDrafts: true }),
        ) as ServedActivity
        assert.equal(served.outcome, 'served', `${players} players, ${keepers} ${ROLE}`)
        assert.equal(served.integrity.fidelityViolations, 0)
        assert.ok(!served.rendered.instructions.some(i => i.text === HIS_W3))
    }
    // And without A01-W2 it is refused at communication for exactly the regain score's four fields per block (the state before L14).
    const refused = underTable(
        entry => entry.id !== 'A01-W2',
        () => buildActivityForReview(requestAt(12, 1), { includeDrafts: true }),
    ) as RefusedActivity
    assert.equal(refused.outcome, 'refused')
    assert.equal(refused.stage, 'communication')
    assert.deepEqual(
        refused.reasons,
        BLOCKS.flatMap(block => [
            ...ALSO_ROWS.map(([field, row]) => `block ${block}: awaiting approved wording: ${ALSO}.${field} (${row})`),
            ...ALSO_ROWS.map(([field]) => `block ${block}: fidelity Q3: ${ALSO}.${field} is established by the game and no instruction carries it`),
        ]),
    )
    assert.equal(JSON.stringify(wordingModule.approvedWording()), before, 'the production table is restored')
})

test('4. the production table holds his three entries, in order, his words, no TEST-ONLY entry', () => {
    const table = wordingModule.approvedWording()
    assert.deepEqual(table.map(entry => entry.id), ['A01-W1', 'A01-W2', 'A01-W3'])
    assert.deepEqual(table.map(entry => entry.sentence), [HIS_ITEM_1, HIS_W2, HIS_W3])
    assert.ok(!JSON.stringify(table).includes('TEST-ONLY'))
    assert.equal(JSON.stringify(table), before)
})

test('5. 10 and 13 players are still refused at the session, each with its sentence', () => {
    for (const players of [10, 13]) {
        const refused = buildActivityForReview(requestAt(players, 1), { includeDrafts: true }) as RefusedActivity
        assert.equal(refused.outcome, 'refused', `${players} players`)
        assert.equal(refused.stage, 'session', `${players} players`)
        assert.ok(refused.summary.length > 0, `${players} players: a sentence`)
        assert.ok(refused.reasons.some(reason => reason.includes('CONFIGURATION_DOES_NOT_FIT') && reason.includes(`${players} session performers`)), `${players} players: ${JSON.stringify(refused.reasons)}`)
    }
})

console.log(`first-activity-end-to-end.unit.ts — ${passed} passed`)
