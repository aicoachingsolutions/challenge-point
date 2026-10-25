/**
 * **No offside, told once** — R3, 24 October 2026 (the d27 design's stage R3: *"Offside: realization-level `departsFrom` (validated and read
 * by the check); LAW-11 WHOLE on A01-R1, inherited by A01-R2 (zone coverage is OUR READING, disclosed in the note); "There is no offside."
 * said once (fidelity: a law departed from for communication is cited by exactly one sentence); limitation L2 updated ("no offside; observe
 * advanced positioning")."*). Every word said to a coach below is DRAFT.
 *
 * Christian, reply filed 27 October 2026, item 2: *"I approve no offside for this initial realization, with that modification communicated
 * once to the coach."* *"We have previously discussed the possibility of players positioning themselves near a scoring target rather than
 * participating in the intended game problem."* *"Rather than introducing a new offside mechanism now, I’d prefer to observe whether this
 * actually undermines the activity."* *"If it does, we can evaluate an appropriate adjustment based on the observed behavior."*
 *
 * What is pinned here (the departure on the realization itself, its validation and its account are pinned in default-laws.unit.ts):
 *   1. the DRAFT wording data: one sentence for LAW-11, "There is no offside", with his item 2 words, and the loader's refusals: a law the
 *      profile does not name or marks a restart law, a law twice, a slot, a final full stop, no words of his, a claim of approval, and no
 *      profile laws;
 *   2. production A01 (the zone version) at 12/1, 12/2 and 11/1, served to coach and administrator alike: the sentence said once, in How it
 *      works, citing only LAW-11's entries in the account; 28 Details (the design's 4.3 pin: no more than the 28 before R1); nothing said
 *      twice; the overview unchanged by it (offside stays in Details); the review evidence tracing it to the profile's laws (his item 10)
 *      and to the departure A01-R1 records on itself (his item 2), nothing untraced; limitation L2 carrying his item 2 words;
 *   3. the projection proved by its consumers: each block's fixture account records LAW-11 as departed from, the block's own render says
 *      the sentence once from it, fidelity finds nothing, and placement reads the account's root as how play runs;
 *   4. fidelity's clauses, each refusing a TEST-ONLY copy of block one: the sentence said twice, not said, said where the account owes the
 *      law or does not record it, said with no account, said without citing the law's entries; the entries cited by another sentence; a law
 *      of the account cited that no sentence is written for; and the renderer says nothing where the account owes the law;
 *   5. the TEST-ONLY goal completion: the sentence said once too, its Details no more than the zone version's.
 *
 * Nothing here changes a production file. TEST-ONLY copies are labelled and held in memory.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/departed-law-wording.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { loadProvisionalRealizations, loadRegister, loadSportDefaultLaws, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivity, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from './build-activity'
import { DRAFT_COACH_WORDING_FILE, draftCoachWordingLoad, draftCoachWordingLoadOf, draftCoachWordingUnusableBecause } from './draft-coach-wording'
import { checkFidelity, FidelityFinding } from './fidelity'
import { Instruction, renderConcreteGame, sectionFactsOf } from './render-concrete-game'
import { defaultLawPath, departedThroughout } from './rendering-fixture'
import { kindOfPath } from './sections'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('no offside, told once (R3, DRAFT)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
/**
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3): a session given no objects here states that it has no goal, so A01's build
 * serves the zone version (A01-R1) these tests read, exactly as before. Since K3 A01's record tries the goal version (A01-R2) first, and a
 * session that has not said what goals it has is asked first (his reply filed 26 October 2026, item 11: "Do not infer a goal from the
 * presence of a goalkeeper or silently treat missing information as confirmation that no goal exists."). The real goal version says the
 * sentence folded with the normal rules (goal-version-communication.unit.ts).
 */
const sessionOf = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects: objects ?? { goal: { count: 0 } } })
const request = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, objects) }) as any

const OFFSIDE = 'There is no offside'
const LAW = 'LAW-11'
const AT = defaultLawPath(LAW)
const ITEM_2 = 'I approve no offside for this initial realization, with that modification communicated once to the coach.'
/** The Details count before R1 (28, measured on H4): the zone version's is never higher (the design's 4.3 pin). */
const DETAILS_BEFORE_R1 = 28

const built = new Map<string, { activity: ServedActivity; fixture: any }>()
const zone = (players: number, keepers: number) => {
    const key = `${players}/${keepers}`
    if (!built.has(key)) {
        const result = buildActivityUnderAuthorizationRecords(request(players, keepers), learningGoalAuthorizations(), { review: { includeDrafts: true } } as any)
        assert.equal(result.activity.outcome, 'served', `${key}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
        built.set(key, { activity: result.activity as ServedActivity, fixture: result.fixture })
    }
    return built.get(key)!
}
const blocksOf = (fixture: any): { blockId: string; fixture: any }[] => fixture.roleBlocks.blocks
const said = <T extends { text: string }>(instructions: T[], text: string): T[] => instructions.filter(instruction => instruction.text === text)
const violations = (findings: FidelityFinding[]) => findings.filter(finding => finding.severity === 'VIOLATION')
const about = (findings: FidelityFinding[], includes: string) => violations(findings).filter(finding => finding.what.includes(includes))

// ── 1. The DRAFT wording data ──────────────────────────────────────────────────────────────────────────────────
test('the DRAFT wording data: one sentence for LAW-11, with his item 2 words; LAW-11 is a law the profile names and no restart law', () => {
    const load = draftCoachWordingLoad()
    assert.equal(load.why, null)
    assert.deepEqual(load.wording.departedLaws, [{ law: LAW, words: OFFSIDE, basis: { words: [ITEM_2], citedAs: 'his reply filed 27 October 2026, item 2' } }])
    const law = loadSportDefaultLaws()!.laws.find(entry => entry.id === LAW)!
    assert.deepEqual([law.restart, law.scope], [false, 'GAME'])
    assert.ok(String(law.note).includes('AMENDED 24 October 2026 (R3') && String(law.note).includes(`"${ITEM_2}"`), 'the profile\'s note says what answers it')
})

test('the loader refuses: a law the profile does not name or marks a restart law, a law twice, a slot, a final full stop, no words of his, a claim of approval, no profile laws', () => {
    const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
    assert.equal(draftCoachWordingUnusableBecause(file, index), null)
    // Re-pointed 24 October 2026 (stage L): the wording gains boundRegions and appliedLaws, empty like every other list where the file cannot be used.
    // Re-pointed 24 October 2026 (stage I): the empty wording gains objectChoices.
    // Re-pointed 25 October 2026 (P1): and methods and equipment (his reply filed 28 October 2026, items 1 and 3).
    const empty = { adjustmentLimits: null, methods: [], equipment: [], objectKinds: [], facings: [], scoringAtObjects: [], normalLaws: null, triggers: [], deadBallRestart: {}, restartLawNouns: [], departedLaws: [], boundRegions: [], appliedLaws: [], objectChoices: [] }
    const refused = (alter: (f: any) => void, pattern: RegExp, what: string, laws = loadSportDefaultLaws()) => {
        const damaged = copy(file)
        alter(damaged)
        const why = draftCoachWordingUnusableBecause(damaged, index, laws)
        assert.ok(why && pattern.test(why), `${what}: ${why}`)
        assert.deepEqual(draftCoachWordingLoadOf(damaged, index, laws).wording, empty, `${what}: an unusable file loads as no wording at all`)
    }
    refused(f => (f.departedLaws[0].law = 'LAW-99'), /departed law 1 names "LAW-99", which is no law the Sport Profile's defaultLaws block names/, 'a law off the profile')
    refused(f => (f.departedLaws[0].law = 'LAW-13'), /marks as a restart law: a restart law is named by the Restarts and ball out sentence/, 'a restart law')
    refused(f => f.departedLaws.push(copy(f.departedLaws[0])), /departed law 2 lists LAW-11 again/, 'a law twice')
    refused(f => (f.departedLaws[0].words = 'There is no {rule}'), /its words are missing or hold a slot/, 'a slot')
    refused(f => (f.departedLaws[0].words = 'There is no offside.'), /end with a full stop/, 'a final full stop')
    refused(f => (f.departedLaws[0].basis = { words: [], citedAs: 'his reply filed 27 October 2026, item 2' }), /quotes none of his words/, 'no words of his')
    refused(f => (f.departedLaws[0].basis.citedAs = 'the design'), /which of his replies/, 'words not said where they are filed')
    refused(f => (f.departedLaws[0].approvedBy = 'TEST-ONLY'), /departed law 1 carries "approvedBy"/, 'a claim of approval')
    refused(f => (f.departedLaws = { LAW: 'TEST-ONLY' }), /its departedLaws entry is not a list/, 'not a list')
    refused(f => (f.restartLawNouns = []), /it lists departedLaws, and the Sport Profile names no default laws/, 'no profile laws', null)
})

// ── 2. Production A01, the zone version ──────────────────────────────────────────────────────────────────────
test('production A01 at 12/1, 12/2 and 11/1: "There is no offside" said once, in How it works, citing only LAW-11\'s entries; 28 Details; nothing said twice; coach and administrator alike', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        const { activity } = zone(players, keepers)
        const details = activity.rendered.instructions
        const told = said(details, OFFSIDE)
        assert.equal(told.length, 1, what)
        assert.deepEqual([told[0].section, told[0].when, told[0].status, told[0].from], ['How it works', 'UNDERSTAND_AND_BEGIN', 'DERIVED', [AT]], what)
        assert.equal(details.filter(instruction => instruction.text.includes('offside')).length, 1, `${what}: said once`)
        // It closes How it works: after the restart sentences, before How to score.
        const at = details.indexOf(told[0])
        assert.deepEqual([details[at - 1].section, details[at + 1].section], ['How it works', 'How to score'], what)
        // 4.3: R2's 27 Details and this one; never more than before R1.
        assert.equal(details.length, 28, what)
        assert.ok(details.length <= DETAILS_BEFORE_R1, what)
        assert.equal(new Set(details.map(instruction => instruction.text)).size, details.length, `${what}: no sentence is said twice`)
        // DRAFT: the evidence names its wording so.
        const evidence = activity.evidence!.sections.instructions.find(entry => entry.text === OFFSIDE)!
        assert.equal(evidence.wording, 'DRAFT', what)
        // A coach is served the same sentence.
        const coach = buildActivity(request(players, keepers)) as ServedActivity
        assert.deepEqual(said(coach.rendered.instructions, OFFSIDE), told, what)
        // Offside stays in Details (the design's 2.8): the overview says nothing of it.
        assert.ok(!JSON.stringify(activity.overview).includes('offside'), `${what}: not in the overview`)
    }
})

test('the review evidence traces the sentence to the profile\'s laws (his item 10) and to the departure A01-R1 records on itself (his item 2); nothing untraced; limitation L2 carries his item 2 words', () => {
    const { activity } = zone(12, 1)
    const evidence = activity.evidence!
    const entry = evidence.sections.instructions.find(instruction => instruction.text === OFFSIDE)!
    assert.deepEqual(
        entry.sources.map(source => [source.layer, source.standing, source.ref, source.detail]),
        [
            ['SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', 'APPROVED', "the sport's normal laws as the default (his reply filed 26 October 2026, item 10)", 'block BUILDING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END: LAW-11 (Law 11 (Offside)): the game DEPARTED'],
            ['ACTIVITY_REALIZATION_CHOICE', 'PROVISIONAL', 'departure recorded by A01-R1 (WHOLE)', 'his reply filed 27 October 2026, item 2'],
            ['SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', 'APPROVED', "the sport's normal laws as the default (his reply filed 26 October 2026, item 10)", 'block BUILDING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START: LAW-11 (Law 11 (Offside)): the game DEPARTED'],
        ],
    )
    assert.deepEqual(entry.layers, ['SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', 'ACTIVITY_REALIZATION_CHOICE'])
    assert.deepEqual(evidence.provenance.untraced, [])
    const element = evidence.provenance.elements.find(candidate => candidate.path === AT)!
    assert.deepEqual([element.row, element.blocks.length, element.sources.length], [null, 2, 3])
    const l2 = evidence.limitations.find(limitation => limitation.id === 'L2')!
    assert.deepEqual(
        l2.his.filter(words => words.citedAs === 'his reply filed 27 October 2026, item 2').map(words => words.words),
        [
            ITEM_2,
            'We have previously discussed the possibility of players positioning themselves near a scoring target rather than participating in the intended game problem.',
            'Rather than introducing a new offside mechanism now, I’d prefer to observe whether this actually undermines the activity.',
            'If it does, we can evaluate an appropriate adjustment based on the observed behavior.',
        ],
    )
    // Observed, not decided: the flag it rests on still answers that nothing restricts where a player stands.
    assert.ok(String(l2.facts[0].value && (l2.facts[0].value as any).answer).startsWith('Yes. Once play starts, nothing in the generated game prevents'), JSON.stringify(l2.facts))
})

// ── 3. The projection, proved by its consumers ─────────────────────────────────────────────────────────────────
test('each block\'s fixture account records LAW-11 as departed from; the block\'s own render says the sentence once from it; fidelity finds nothing; placement reads the account\'s root as how play runs', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]] as const) {
        const what = `A01 ${players}/${keepers}`
        for (const block of blocksOf(zone(players, keepers).fixture)) {
            const entries = block.fixture.defaultLaws.laws.filter((entry: any) => entry.law === LAW)
            // Re-pointed 24 October 2026 (stage L, the R3 review's should-fix): the entry says it is departed from only by the departure the
            // realization records on itself (removedByRealization), so fidelity holds its sentence to the departure, not the data alone.
            assert.deepEqual(entries, [{ law: LAW, end: null, status: 'DEPARTED', removedByRealization: true }], `${what}: ${block.blockId}`)
            assert.deepEqual(block.fixture.defaultLaws.laws.filter((entry: any) => entry.removedByRealization).map((entry: any) => entry.law), [LAW], `${what}: only the law removed on the realization is marked`)
            assert.equal(departedThroughout(block.fixture.defaultLaws.laws, LAW), true)
            const rendered = renderConcreteGame(block.fixture)
            assert.equal(said(rendered.instructions, OFFSIDE).length, 1, `${what}: ${block.blockId}`)
            assert.deepEqual(violations(checkFidelity(block.fixture, rendered).findings), [], `${what}: ${block.blockId}`)
            assert.equal(kindOfPath(AT, sectionFactsOf(block.fixture)), 'IN_PLAY')
        }
    }
    // departedThroughout: departed at some place, and nothing a coach could meet anywhere else.
    assert.equal(departedThroughout([{ law: 'X', end: 0, status: 'DEPARTED' }, { law: 'X', end: 1, status: 'NOT_APPLICABLE' }], 'X'), true)
    assert.equal(departedThroughout([{ law: 'X', end: 0, status: 'DEPARTED' }, { law: 'X', end: 1, status: 'APPLIES' }], 'X'), false)
    assert.equal(departedThroughout([{ law: 'X', end: 0, status: 'DEPARTED' }, { law: 'X', end: 1, status: 'ADAPTATION_OWED' }], 'X'), false)
    assert.equal(departedThroughout([{ law: 'X', end: 0, status: 'NOT_APPLICABLE' }, { law: 'X', end: 1, status: 'NOT_APPLICABLE' }], 'X'), false)
    assert.equal(departedThroughout([], 'X'), false)
})

// ── 4. Fidelity's clauses, each on a TEST-ONLY copy of block one ──────────────────────────────────────────────
test('fidelity refuses the sentence said twice, not said, said where the account owes the law, said with no account or without citing its entries, its entries cited by another sentence, and a law of the account cited with no sentence written; the renderer says nothing where the law is owed', () => {
    const block = copy(blocksOf(zone(12, 1).fixture)[0].fixture)
    const rendered = renderConcreteGame(block)
    assert.deepEqual(violations(checkFidelity(block, rendered).findings), [])
    const withInstructions = (change: (instructions: Instruction[]) => Instruction[], game = block) => checkFidelity(game, { ...rendered, instructions: change(copy(rendered.instructions)) }).findings
    const sentence = (text: string, from: string[]): Instruction => ({ section: 'How it works', text, status: 'DERIVED', from, quantities: [], parts: [{ text, status: 'DERIVED', from, quantities: [], bindings: [] }] }) as Instruction
    // Said twice (Q2): a second sentence saying it.
    assert.ok(about(withInstructions(list => [...list, sentence(`${OFFSIDE} at any time`, [AT])]), '2 sentences tell the coach the activity departs from LAW-11').length, 'said twice')
    // Not said (Q3).
    const lost = about(withInstructions(list => list.filter(i => i.text !== OFFSIDE)), 'records LAW-11 as departed from, and no sentence tells the coach "There is no offside"')
    assert.deepEqual(lost.map(f => f.question), [3], 'not said')
    // Said where the account owes the law (Q2), and the renderer then says nothing.
    const owed = copy(block)
    owed.defaultLaws.laws = owed.defaultLaws.laws.map((entry: any) => (entry.law === LAW ? { ...entry, status: 'ADAPTATION_OWED' } : entry))
    assert.ok(about(checkFidelity(owed, rendered).findings, 'tells the coach the activity departs from LAW-11, and the game\'s default-laws account does not record LAW-11 as departed from').length, 'said where owed')
    assert.equal(said(renderConcreteGame(owed).instructions, OFFSIDE).length, 0, 'the renderer never says a law owed away')
    assert.deepEqual(violations(checkFidelity(owed, renderConcreteGame(owed)).findings), [], 'and then nothing is owed to the coach about it')
    // Said where the account does not hold the law at all (Q2).
    const absent = copy(block)
    absent.defaultLaws.laws = absent.defaultLaws.laws.filter((entry: any) => entry.law !== LAW)
    assert.ok(about(checkFidelity(absent, rendered).findings, 'does not record LAW-11 as departed from').length, 'not in the account')
    // Said with no account (Q2).
    const noAccount = copy(block)
    delete noAccount.defaultLaws
    assert.ok(about(checkFidelity(noAccount, rendered).findings, 'tells the coach the activity departs from LAW-11, and the game carries no default-laws account').length, 'no account')
    assert.equal(said(renderConcreteGame(noAccount).instructions, OFFSIDE).length, 0, 'no account, no sentence')
    // Said without citing the law's entries (Q2).
    assert.ok(about(withInstructions(list => [...list.filter(i => i.text !== OFFSIDE), sentence(OFFSIDE, ['restartPolicy.deadBall'])]), 'does not cite defaultLaws.laws[LAW-11]').length, 'not citing')
    // Its entries cited by a sentence that does not say it (Q2).
    assert.ok(about(withInstructions(list => [...list, sentence('Play on', [AT])]), 'cites defaultLaws.laws[LAW-11] and does not say "There is no offside"').length, 'cited by another sentence')
    // A law of the account cited that no sentence is written for (Q2).
    assert.ok(about(withInstructions(list => [...list, sentence('Handle as you like', [defaultLawPath('LAW-12-GK')])]), 'cites defaultLaws.laws[LAW-12-GK], a part of the game\'s default-laws account for which no sentence is written').length, 'an unworded law cited')
    // Stage L (the R3 review's should-fix, NEW, a tightening): a law the account records as removed by the realization itself that the data
    // writes no sentence for is a loss (Q3), whatever the data holds. TEST-ONLY: the account records LAW-12-GK so (no departedLaws entry).
    const removedUnworded = copy(block)
    removedUnworded.defaultLaws.laws = removedUnworded.defaultLaws.laws.map((entry: any) => (entry.law === 'LAW-12-GK' ? { ...entry, status: 'DEPARTED', removedByRealization: true } : entry))
    const unworded = about(checkFidelity(removedUnworded, renderConcreteGame(removedUnworded)).findings, 'records LAW-12-GK as removed by its realization without being replaced, and no sentence is written to tell the coach so')
    assert.deepEqual(unworded.map(f => f.question), [3], 'a law removed on the realization with no sentence written')
    // Departed from by an item (no mark), the same law owes no sentence of its own here (an item's replacement says it).
    const byItem = copy(block)
    byItem.defaultLaws.laws = byItem.defaultLaws.laws.map((entry: any) => (entry.law === 'LAW-12-GK' ? { ...entry, status: 'DEPARTED' } : entry))
    assert.equal(about(checkFidelity(byItem, renderConcreteGame(byItem)).findings, 'removed by its realization').length, 0)
})

// ── 5. The TEST-ONLY goal completion ────────────────────────────────────────────────────────────────────────────
test('the TEST-ONLY goal completion: "There is no offside" said once too (inherited from A01-R1), its Details no more than the zone version\'s', () => {
    const records = learningGoalAuthorizations()
    const record = records.find(r => r.learningGoalId === 'A01') as any
    record.realizations = record.realizations.map((entry: any) => (entry.realization === 'A01-R2' ? { realization: entry.realization, words: entry.words, citedAs: entry.citedAs } : entry))
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const variant = file.realizations.find((r: any) => r.id === 'A01-R2')
    // Re-pointed 24 October 2026 (K2): A01-R2 now records its goal's penalty area (A01-R2-S2-1 to S7-1, pinned in
    // goal-version-penalty-area.unit.ts). This completion hands the build no bound-region block for its TEST-ONLY 5 m goal, so those items
    // would be realized with no pairing to word them, and the build is refused at communication (fidelity Q3, measured); they are left out
    // of the copy, in memory, so the completion is the no-region goal it was before K2.
    // Re-pointed 25 October 2026 (P2): and the item bounding the marked line relative to the penalty area (A01-R2-S5-2, his reply filed 28 October 2026, item 2), which names it.
    variant.items = variant.items.filter((i: any) => i.selector !== 'noun=zone & functions ∋ penalty-area' && i.value?.of?.structuralRef?.itemId !== 'A01-R2-S2-1')
    variant.objectSuitability = [{ kind: 'goal', widthM: { min: 1, max: 10 }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    variant.defaultLawsCheck = { mode: 'REPORT', because: 'TEST-ONLY: D-DEFAULT-LAWS completed in memory', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }
    for (const [players, keepers] of [[12, 1], [11, 1]] as const) {
        const what = `goal ${players}/${keepers}`
        const result = buildActivityUnderAuthorizationRecords(request(players, keepers, { goal: { count: 1, widthM: 5 } }), records, { realizations: loadProvisionalRealizations(file), review: { includeDrafts: true }, boundRegions: null } as any)
        assert.equal(result.activity.outcome, 'served', `${what}: ${JSON.stringify((result.activity as RefusedActivity).reasons ?? null)}`)
        const details = (result.activity as ServedActivity).rendered.instructions
        assert.deepEqual(said(details, OFFSIDE).map(i => [i.section, i.from]), [['How it works', [AT]]], what)
        assert.ok(details.length <= zone(players, keepers).activity.rendered.instructions.length, `${what}: ${details.length} Details`)
    }
})

console.log(`${passed} passed`)
