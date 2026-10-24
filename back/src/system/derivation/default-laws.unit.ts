/**
 * **The sport's normal laws as the default, and the adaptations an activity owes** — H2, 23 October 2026 (the d26 design's build step 2,
 * its section 3.2, with step 5's annotations).
 *
 * Christian, reply filed 26 October 2026, item 10: *"The normal Laws of the Game should apply by default wherever they are applicable,
 * unless an activity introduces an explicit, knowledge-authorized modification."* *"Where a normal law cannot apply directly because of the
 * modified field, scoring structure, or game format, the system should identify the relevant adaptation rather than silently assume
 * conventional conditions exist."* *"The governing principle is to inherit established sport rules and explicitly define only the
 * necessary departures."*
 *
 * What is pinned here (the design's step 2 tests, and the gate's):
 *   1. the Sport Profile's defaultLaws block: his item 10 words verbatim, deliberatelyNotContributed[0] restated with his authority, the six
 *      laws in the closed predicate vocabulary, and the loader refusing every defect (the profile pin itself is restated in
 *      sport-profile.unit.ts: still two items, no law authored);
 *   2. the departures A01-R1's items record and the strictness each realization declares, as projected (A01-R1 REPORT, A01-R2 ENFORCE, a
 *      variant inheriting), and the gate refusing every defect - a departure read by nothing included;
 *   3. A01-R1 at 12/1, 12/2 and 11/1, REPORT: LAW-8 departed, LAW-11 and LAW-12-GK owed, LAW-14/16/17 not applicable at both ends (the
 *      end-line restarts recorded); served, and nothing a coach reads changes (the same build with every annotation taken out of a copy);
 *   4. the TEST-ONLY goal copy: LAW-17 owed at the goal end and not applicable at the other, LAW-16 owed and partly departed from (his item
 *      11), the kept end-line restarts' reason false there (the design's X5); under the ENFORCE it records, refused at validation, naming
 *      each law owed, and never falling back to the zone version;
 *   5. UNREPRESENTED never yields APPLIES, an unreadable precondition never passes, and a law with every precondition holding applies;
 *   6. a realization declaring no check gains no account; and mutations - a departure removed flips DEPARTED to ADAPTATION_OWED, a condition
 *      removed flips the goal end's owed law to DEPARTED.
 *
 * **Re-pointed 24 October 2026 (R1, the d27 design's section 2.6 and 2.10)** for his reply filed 27 October 2026, items 3 and 4 (the one
 * common restart): nine laws, each saying why it is listed (ADAPTATION or DEPARTURE) and whether it is a restart law, the three DEPARTURE laws
 * each departed from by a realization; A01-R1's departures are A01-R1-T2-1's and the common restart's (A01-R1-RP1-1, WHOLE, six laws), the
 * end-line restarts and A01-R1-T1-3's part departure gone with what they recorded; the zone account departs from the dropped ball, free kicks
 * and the throw-in, LAW-14/16/17 not applicable at both ends and recorded by nothing; the goal copy departs from LAW-14/16/17 at the goal end
 * and owes four (offside, handling); the X5 condition and the part departure are exercised on TEST-ONLY copies; and the common-restart clause
 * makes a restart law that would apply owed, and none where the game keeps a restart per trigger.
 *
 * **Re-pointed 24 October 2026 (R3, the d27 design's stage R3, its sections 2.6 and 2.10)** for his reply filed 27 October 2026, item 2 ("I
 * approve no offside for this initial realization, with that modification communicated once to the coach."): A01-R1 records its departure
 * from LAW-11 on itself (the realization-level departsFrom, WHOLE), validated by the same rules as an item's and refused where an item departs
 * from the same law, inherited by A01-R2; the zone account departs from offside and owes only the goalkeeper's handling (two, one per block);
 * the goal copy owes two as well, and under ENFORCE is refused naming only LAW-12-GK; the coach is told once, "There is no offside" (DRAFT),
 * so the build with every annotation taken out differs by that sentence and the Restarts sentence, and by nothing else - now pinned on the
 * acceptance, the items and the overview's evidence too (the R2 review's should-fix); and mutations: the departure taken out makes LAW-11
 * owed (served under REPORT with no such sentence; refused under ENFORCE naming it), and moved to A01-R2 alone it covers the goal version
 * only (the design's reversal of OUR READING).
 *
 * **Re-pointed 24 October 2026 (the completeness audit of the field-test build, item 1)** for his reply filed 27 October 2026, item 6
 * ("Goalkeeper identification: The goalkeeper should be visually distinguishable from the outfield players. Stable team identities and clear
 * role labels remain important in the diagram."): ten laws, the tenth LAW-4-GK (IFAB Law 4.3, the goalkeeper's colours), listed for
 * ADAPTATION with the one precondition that a goalkeeper plays and nothing required, so it is never owed; it APPLIES in both blocks of the
 * zone version (whose owed laws are unchanged: the handling, in each block) and is NOT_APPLICABLE where no team holds a goalkeeper.
 *
 * Nothing here changes a production file. TEST-ONLY copies are labelled and held in memory.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/default-laws.unit.ts
 */
import assert from 'node:assert/strict'

import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { draftCoachWordingLoad } from '../rendering/draft-coach-wording'
import { specializedRoleNames } from '../rendering/session-envelope'
import { blockLawAccountOf, DefaultLawsAccount } from '../realization/default-laws-check'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { loadProvisionalRealizations, loadRegister, loadSportDefaultLaws, loadSportProfile, PROVISIONAL_REALIZATIONS_FILE, readJson, validateProvisionalRealizations } from './corpus'
import { DefaultLaws, defaultLawsCheckRefusal, defaultLawsRefusals, LAW_PREDICATES } from './default-laws'
import { indexRegister } from './register'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log("the sport's normal laws as the default (H2)")

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
/**
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3): a session given no objects here states that it has no goal, so A01's build
 * serves the zone version (A01-R1) these tests read, exactly as before. Since K3 A01's record tries the goal version (A01-R2) first, and a
 * session that has not said what goals it has is asked first (his reply filed 26 October 2026, item 11: "Do not infer a goal from the
 * presence of a goalkeeper or silently treat missing information as confirmation that no goal exists."). The real goal version's account
 * (ENFORCE, owing nothing) is pinned in goal-version-switch.unit.ts and goal-version-penalty-area.unit.ts.
 */
const sessionOf = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, objects: objects ?? { goal: { count: 0 } } })
const GOAL = { goal: { count: 1, widthM: 5 } }
const R1 = 'A01-R1'
const R2 = 'A01-R2'
const ITEM_10 = [
    'The normal Laws of the Game should apply by default wherever they are applicable, unless an activity introduces an explicit, knowledge-authorized modification.',
    'We should not need to redefine ordinary soccer rules separately for every Learning Goal, game form, or activity.',
    'Where a normal law cannot apply directly because of the modified field, scoring structure, or game format, the system should identify the relevant adaptation rather than silently assume conventional conditions exist.',
    "The offside question, for example, may need an explicit ruling for this small-sided environment, but we should not expand the current work into a comprehensive reconstruction of soccer's laws.",
    'The governing principle is to inherit established sport rules and explicitly define only the necessary departures.',
]
const laws = loadSportDefaultLaws()!
/** The Sport Profile file as authored (a fresh copy each time). */
const profileFile = (): any => readJson(laws.file)

/** One law's entries in a block account, by place: the game, end 0 or end 1. */
const statusOf = (account: DefaultLawsAccount, blockAt: number, law: string) =>
    Object.fromEntries(account.blocks[blockAt].laws.filter(entry => entry.law === law).map(entry => [entry.end === null ? 'game' : `end${entry.end}`, entry]))
const items = (entries: { item: string }[]) => entries.map(entry => entry.item)

// ── 1. The block in the Sport Profile ────────────────────────────────────────────────────────────────────
test("the profile's defaultLaws block: his item 10 words, the restatement, and ten laws in the closed vocabulary, each listed for a reason", () => {
    assert.deepEqual([laws.source, laws.edition, laws.authority.citedAs, laws.authority.by, laws.authority.ruledOn], ['IFAB Laws of the Game', null, 'his reply filed 26 October 2026, item 10', 'Christian', '2026-10-26'])
    assert.deepEqual(laws.authority.words, ITEM_10, 'his item 10, verbatim and whole sentences')
    assert.ok(laws.editionNote.startsWith('He names no edition.'))
    const raw = profileFile()
    assert.ok(raw.deliberatelyNotContributed[0].startsWith('Ordinary Laws of the Game are not authored here: no law becomes an item or a line of the game. RESTATED 23 October 2026'))
    assert.ok(raw.deliberatelyNotContributed[0].includes(`"${ITEM_10[0]}"`), 'restated with his authority, his words quoted')
    assert.ok(raw.deliberatelyNotContributed[0].includes('Until this restatement the entry read: "Ordinary Laws of the Game: out-of-play behaviour, restarts, offside, legal actions."'), 'the old reading kept, quoted')
    assert.ok(raw.defaultLaws.restates.startsWith('deliberatelyNotContributed[0]'))
    // Re-pointed 24 October 2026 (R1, the d27 design's section 2.6): nine laws, each saying why it is listed and whether it is a restart law;
    // the three listed for DEPARTURE (the dropped ball, free kicks, the throw-in) need nothing to apply, for his reply filed 27 October 2026,
    // items 3 and 4.
    assert.deepEqual(
        laws.laws.map(law => [law.id, law.scope, law.listedFor, law.restart]),
        [
            ['LAW-8', 'GAME', 'ADAPTATION', true],
            ['LAW-8-DB', 'GAME', 'DEPARTURE', true],
            ['LAW-11', 'GAME', 'ADAPTATION', false],
            ['LAW-12-GK', 'GAME', 'ADAPTATION', false],
            ['LAW-14', 'PER_END', 'ADAPTATION', true],
            ['LAW-13', 'GAME', 'DEPARTURE', true],
            ['LAW-15', 'GAME', 'DEPARTURE', true],
            ['LAW-16', 'PER_END', 'ADAPTATION', true],
            ['LAW-17', 'PER_END', 'ADAPTATION', true],
            // Re-pointed 24 October 2026 (the completeness audit, item 1): the goalkeeper's colours, listed after the nine.
            ['LAW-4-GK', 'GAME', 'ADAPTATION', false],
        ],
    )
    // The completeness audit, item 1: LAW-4-GK arises only where a goalkeeper plays and needs nothing the representation holds (never owed);
    // its note cites IFAB Law 4.3 and quotes his item 6 whole.
    const colours = laws.laws.find(law => law.id === 'LAW-4-GK')!
    assert.deepEqual([colours.applicableWhen, colours.requires], [[{ predicate: 'SPECIALIZED_PERFORMER_PRESENT', row: 'P3' }], []])
    assert.ok(String(colours.note).includes('"Each goalkeeper must wear colours that are distinguishable from the other players and the match officials"'), 'IFAB Law 4.3, as stage L cited it')
    assert.ok(String(colours.note).includes('"Goalkeeper identification: The goalkeeper should be visually distinguishable from the outfield players. Stable team identities and clear role labels remain important in the diagram."'), 'his item 6, whole')
    for (const law of laws.laws.filter(entry => entry.listedFor === 'DEPARTURE')) {
        assert.deepEqual([law.applicableWhen, law.requires], [[], []], `${law.id}: listed only to be departed from`)
        assert.ok(String(law.note).startsWith('Listed 24 October 2026 (R1') && String(law.note).includes('His reply filed 27 October 2026'), law.id)
    }
    // A law listed for DEPARTURE must be departed from by some realization, or the profile lists it for nothing (the loader's narrowed rule,
    // compensated here).
    const departed = new Set(loadProvisionalRealizations().flatMap(r => r.items.flatMap(item => ((item as any).departsFrom ?? []).map((d: any) => d.law))))
    for (const law of laws.laws.filter(entry => entry.listedFor === 'DEPARTURE')) assert.ok(departed.has(law.id), `${law.id} is departed from by a realization`)
    const predicates = laws.laws.flatMap(law => [...law.applicableWhen, ...law.requires].map(p => p.predicate))
    assert.deepEqual([...new Set(predicates)].sort(), [...LAW_PREDICATES].sort(), 'every predicate of the closed list is used, and no other')
    // A declaration, never items: the profile's contribution is what it was.
    assert.deepEqual(loadSportProfile()[0].items.map(item => item.itemId), ['SPORT-SOCCER-01', 'SPORT-SOCCER-02'])
})

test('the loader refuses the block whole on any defect: unknown keys, a law twice, a predicate outside the list, foreign arguments, no words of his', () => {
    const raw = profileFile()
    assert.deepEqual(defaultLawsRefusals(raw.defaultLaws, index), [])
    const refused = (alter: (block: any) => void, pattern: RegExp, what: string) => {
        const damaged = copy(raw)
        alter(damaged.defaultLaws)
        const errors = defaultLawsRefusals(damaged.defaultLaws, index)
        assert.ok(errors.some(error => pattern.test(error)), `${what}: ${errors.join(' | ')}`)
        assert.throws(() => loadSportDefaultLaws(() => damaged, index), /default-laws block is refused/, what)
    }
    const at = (b: any, id: string) => b.laws.find((law: any) => law.id === id)
    refused(b => (b.appliesTo = 'TEST-ONLY'), /carries "appliesTo"/, 'an unknown key')
    refused(b => b.laws.push(copy(b.laws[0])), /LAW-8 is listed twice/, 'a law twice')
    refused(b => (at(b, 'LAW-8').requires[0].predicate = 'TEST-ONLY'), /none of OBJECT_OF_KIND_AT_END/, 'a predicate outside the closed list')
    refused(b => (at(b, 'LAW-14').applicableWhen[0].row = 'P3'), /does not take/, 'an argument the predicate does not take')
    refused(b => (at(b, 'LAW-14').applicableWhen[0].kind = 'TEST-ONLY'), /no member of the register's object-kind vocabulary/, 'an object kind outside the vocabulary')
    refused(b => (at(b, 'LAW-12-GK').applicableWhen[0].row = 'P2'), /no specialized performer row/, 'a row that is no specialized performer')
    refused(b => (b.authority.words = []), /must quote his words/, 'no words of his')
    refused(b => delete b.edition, /does not say none is named/, 'an edition neither named nor null')
    refused(b => (at(b, 'LAW-17').applicableWhen = []), /needs nothing to apply/, 'a law needing nothing')
    refused(b => (at(b, 'LAW-11').scope = 'PER_BLOCK'), /none of GAME, PER_END/, 'a scope outside the list')
    // R1 (24 October 2026): why a law is listed and whether it is a restart law are required; only a DEPARTURE law may need nothing.
    refused(b => delete at(b, 'LAW-13').listedFor, /is listed for undefined, which is none of ADAPTATION, DEPARTURE/, 'no reason for listing')
    refused(b => (at(b, 'LAW-13').listedFor = 'TEST-ONLY'), /none of ADAPTATION, DEPARTURE/, 'a reason off the list')
    refused(b => (at(b, 'LAW-13').listedFor = 'ADAPTATION'), /LAW-13 needs nothing to apply/, 'a law needing nothing, listed for adaptation')
    refused(b => delete at(b, 'LAW-15').restart, /does not say whether it is a law of how play restarts/, 'no restart flag')
    refused(b => (at(b, 'LAW-15').restart = 'yes'), /does not say whether it is a law of how play restarts/, 'a restart flag that is no boolean')
    // The profile's items may record no departure: only an activity's realization does.
    const marked = copy(raw)
    marked.result.items[0].departsFrom = [{ law: 'LAW-8' }]
    assert.throws(() => loadSportProfile(() => marked), /records a departure from the normal laws, which only an activity's provisional realization records/)
})

// ── 2. The departures and the strictness, as projected ───────────────────────────────────────────────────
test("A01-R1's items record the departures his rulings already state, no value changed; each realization's strictness is projected", () => {
    const raw = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const r1 = raw.realizations.find((r: any) => r.id === R1)
    const recorded = r1.items.filter((item: any) => item.departsFrom).map((item: any) => [item.id, item.departsFrom.map((d: any) => [d.law, d.extent, d.whilePreconditionAbsent?.predicate ?? null])])
    // Re-pointed 24 October 2026 (R1): his reply filed 27 October 2026, items 3 and 4, record the one common restart (A01-R1-RP1-1), which
    // departs from the whole of every restart it replaces; the part departure of A01-R1-T1-3 and the end-line restarts' departures (A01-R1-T4-3,
    // T5-3, withdrawn) go with what they recorded.
    assert.deepEqual(recorded, [
        ['A01-R1-T2-1', [['LAW-8', 'WHOLE', null]]],
        ['A01-R1-RP1-1', ['LAW-8-DB', 'LAW-13', 'LAW-14', 'LAW-15', 'LAW-16', 'LAW-17'].map(law => [law, 'WHOLE', null])],
    ])
    // His words, verbatim, where he said them.
    const rp1 = r1.items.find((item: any) => item.id === 'A01-R1-RP1-1').departsFrom
    assert.ok(rp1.find((d: any) => d.law === 'LAW-14').basis.words.includes('For this activity, a dead ball should result in a new goalkeeper-initiated build-out, not a penalty kick or another set-piece restart.'))
    assert.equal(rp1.find((d: any) => d.law === 'LAW-14').basis.citedAs, 'his reply filed 27 October 2026, item 3')
    assert.ok(rp1.find((d: any) => d.law === 'LAW-15').basis.words.includes('There should be no separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this activity.'))
    assert.ok(r1.items.find((item: any) => item.id === 'A01-R1-T2-1').departsFrom[0].basis.words.includes('The coach initiating a new goalkeeper build-out after a completed episode.'))
    // A01-R2 records none of its own; it keeps both.
    assert.ok(!raw.realizations.find((r: any) => r.id === R2).items.some((item: any) => item.departsFrom))
    const loaded = loadProvisionalRealizations()
    const of = (id: string) => loaded.find(r => r.provisionalId === id)!
    assert.deepEqual([of(R1).defaultLawsCheck!.mode, of(R2).defaultLawsCheck!.mode], ['REPORT', 'ENFORCE'])
    assert.deepEqual(of(R2).items.filter(item => item.departsFrom).map(item => item.itemId), ['A01-R1-T2-1', 'A01-R1-RP1-1'])
    // A variant stating no check inherits its base's, as it inherits its items.
    const inheriting = copy(raw)
    delete inheriting.realizations.find((r: any) => r.id === R2).defaultLawsCheck
    assert.equal(loadProvisionalRealizations(inheriting).find(r => r.provisionalId === R2)!.defaultLawsCheck!.mode, 'REPORT')
    // R3 (24 October 2026): A01-R1 records on itself the departure from a law its activity removes without replacing it - offside, the whole
    // of it, in his item 2 words - beside its items; A01-R2 states none on itself and inherits it, cited by A01-R1.
    assert.deepEqual(r1.departsFrom.map((d: any) => [d.law, d.extent, d.whilePreconditionAbsent ?? null, d.part ?? null]), [['LAW-11', 'WHOLE', null, null]])
    assert.deepEqual(r1.departsFrom[0].basis, { words: ['I approve no offside for this initial realization, with that modification communicated once to the coach.'], citedAs: 'his reply filed 27 October 2026, item 2' })
    assert.ok(r1.departsFrom[0].because.includes('OUR READING') && r1.departsFrom[0].because.includes('"2. Offside, both versions"'), 'the zone coverage is labelled OUR READING, with the question we put to him')
    assert.equal(raw.realizations.find((r: any) => r.id === R2).departsFrom, undefined)
    assert.ok(!r1.items.some((item: any) => (item.departsFrom ?? []).some((d: any) => d.law === 'LAW-11')), 'no item carries it: nothing in the game replaces the law')
    assert.deepEqual([of(R1).realizationDepartures!.recordedBy, of(R1).realizationDepartures!.departures.map(d => d.law)], [R1, ['LAW-11']])
    assert.deepEqual(of(R2).realizationDepartures, of(R1).realizationDepartures, 'inherited whole, cited by the realization recording it')
    // TEST-ONLY: a variant stating its own replaces its base's, cited by itself; a realization stating none and based on none has none.
    const own = copy(raw)
    own.realizations.find((r: any) => r.id === R2).departsFrom = [{ ...copy(r1.departsFrom[0]), because: 'TEST-ONLY' }]
    assert.deepEqual(loadProvisionalRealizations(own).find(r => r.provisionalId === R2)!.realizationDepartures!.recordedBy, R2)
    assert.ok(loaded.filter(r => r.basedOn === undefined && r.provisionalId !== R1).every(r => r.realizationDepartures === undefined))
    // The R1 review's carried should-fix: A01-R1's REPORT now says why in his 27 October words - offside answered (item 2), handling open (item 5).
    const because = r1.defaultLawsCheck.because
    assert.ok(because.includes('AMENDED 24 October 2026 (R3') && because.includes('"For now, preserve the validated target-zone version without silently adding new handling restrictions."') && because.includes('item 5'), because)
})

test('the gate refuses a departure it cannot read, a strictness outside the list, and a departure nothing reads', () => {
    const raw = readJson(PROVISIONAL_REALIZATIONS_FILE)
    assert.deepEqual(validateProvisionalRealizations(raw), [])
    const refused = (alter: (file: any) => void, pattern: RegExp, what: string) => {
        const damaged = copy(raw)
        alter(damaged)
        const errors = validateProvisionalRealizations(damaged)
        assert.ok(errors.some(error => pattern.test(error)), `${what}: ${errors.join(' | ')}`)
        assert.throws(() => loadProvisionalRealizations(damaged), /failed its integrity gate/, what)
    }
    const departure = (file: any, id: string) => file.realizations.find((r: any) => r.id === R1).items.find((item: any) => item.id === id).departsFrom
    refused(f => (departure(f, 'A01-R1-T2-1')[0].law = 'LAW-99'), /departs from "LAW-99", which is no law the Sport Profile names as a default/, 'a law the profile does not name')
    refused(f => departure(f, 'A01-R1-T2-1').push(copy(departure(f, 'A01-R1-T2-1')[0])), /departs from LAW-8 a second time/, 'a law twice on one item')
    refused(f => (departure(f, 'A01-R1-T2-1')[0].basis = { words: [], citedAs: 'TEST-ONLY' }), /quotes none of his words/, 'no words of his')
    // Re-pointed 24 October 2026 (R1): the departures A01-R1-RP1-1 records stand in for the withdrawn items' (LAW-16 is its fifth).
    refused(f => (departure(f, 'A01-R1-RP1-1')[4].extent = 'PART'), /does not say which part/, 'a part not named')
    refused(f => (departure(f, 'A01-R1-RP1-1')[4].whilePreconditionAbsent = { predicate: 'SPECIALIZED_PERFORMER_PRESENT', row: 'P3' }), /rests on the absence of a precondition LAW-16 does not have/, 'a condition not the law\'s own')
    refused(f => (departure(f, 'A01-R1-RP1-1')[4].extent = 'MOST'), /none of WHOLE, PART/, 'an extent outside the list')
    refused(f => (departure(f, 'A01-R1-T2-1')[0].appliesTo = 'TEST-ONLY'), /carries "appliesTo"/, 'an unknown key')
    refused(f => (f.realizations.find((r: any) => r.id === R2).defaultLawsCheck.mode = 'WARN'), /none of ENFORCE, REPORT \(there is no default\)/, 'a strictness outside the list')
    // Re-pointed 24 October 2026 (R3): the departure A01-R1 records on itself is named among what nothing would read.
    refused(f => delete f.realizations.find((r: any) => r.id === R1).defaultLawsCheck, /records departures from the normal laws \(A01-R1-T2-1, A01-R1-RP1-1, the realization itself\) and declares no default-laws check/, 'departures nothing reads')
    // R3 (24 October 2026): the departures a realization records on itself are held to exactly an item's rules.
    const onItself = (file: any, id: string = R1) => file.realizations.find((r: any) => r.id === id).departsFrom
    refused(f => (onItself(f)[0].law = 'LAW-99'), /realization A01-R1 \(on itself\) departure 1 departs from "LAW-99", which is no law the Sport Profile names as a default/, 'on itself: a law the profile does not name')
    refused(f => onItself(f).push(copy(onItself(f)[0])), /\(on itself\) departure 2 departs from LAW-11 a second time/, 'on itself: a law twice')
    refused(f => (onItself(f)[0].basis = { words: [], citedAs: 'TEST-ONLY' }), /\(on itself\) departure 1: its basis quotes none of his words/, 'on itself: no words of his')
    refused(f => delete onItself(f)[0].because, /\(on itself\) departure 1 does not say why/, 'on itself: no reason')
    refused(f => (onItself(f)[0].extent = 'PART'), /\(on itself\) departure 1 covers part of the law and does not say which part/, 'on itself: a part not named')
    refused(f => (onItself(f)[0].whilePreconditionAbsent = { predicate: 'OBJECT_OF_KIND_AT_END', kind: 'goal' }), /rests on the absence of a precondition LAW-11 does not have/, 'on itself: a condition not the law\'s own')
    refused(f => (onItself(f)[0].appliesTo = 'TEST-ONLY'), /\(on itself\) departure 1 carries "appliesTo"/, 'on itself: an unknown key')
    refused(f => (f.realizations.find((r: any) => r.id === R1).departsFrom = []), /\(on itself\) records its departures as something other than a non-empty list/, 'on itself: an empty list')
    // NEW (a tightening): one law, one record - a law removed without replacement is recorded on the realization, one an item replaces on that item.
    refused(f => onItself(f).push({ ...copy(departure(f, 'A01-R1-T2-1')[0]) }), /realization A01-R1 departs from LAW-8 on itself and on its item A01-R1-T2-1: a law the activity removes without replacing it is recorded on the realization, a law an item replaces on that item, never both/, 'one law on the realization and an item')
    refused(f => (f.realizations.find((r: any) => r.id === R2).items[0].departsFrom = copy(onItself(f))), /realization A01-R2 departs from LAW-11 on its base A01-R1 and on its item A01-R2-O1-1/, 'a variant\'s item departing from a law its base records on itself')
    refused(f => (f.realizations.find((r: any) => r.id === R2).departsFrom = [{ ...copy(onItself(f)[0]), law: 'LAW-77' }]), /realization A01-R2 \(on itself\) departure 1 departs from "LAW-77"/, 'a variant\'s own departure on itself, held to the same rules')
    // Stage L (the R3 review's should-fix, NEW, a tightening): a variant's own list replaces its base's whole, so it restates every law of it.
    // TEST-ONLY: A01-R2 stating on itself a departure from LAW-12-GK alone, leaving out the LAW-11 its base records - refused, naming it.
    refused(f => (f.realizations.find((r: any) => r.id === R2).departsFrom = [{ ...copy(onItself(f)[0]), law: 'LAW-12-GK' }]), /realization A01-R2 states departures on itself and leaves out LAW-11, which its base A01-R1 departs from on itself: a variant's own list replaces its base's whole/, 'a variant\'s own list leaving out a law of its base\'s')
    // Restating it beside its own is accepted (the list is read whole).
    {
        const file = copy(raw)
        file.realizations.find((r: any) => r.id === R2).departsFrom = [copy(onItself(file)[0]), { ...copy(onItself(file)[0]), law: 'LAW-12-GK' }]
        assert.ok(!validateProvisionalRealizations(file).some(error => error.includes('leaves out')), 'a variant restating its base\'s list is not refused for it')
    }
    refused(f => {
        delete f.realizations.find((r: any) => r.id === R1).defaultLawsCheck
        delete f.realizations.find((r: any) => r.id === R2).defaultLawsCheck
        for (const item of f.realizations.find((r: any) => r.id === R1).items) delete item.departsFrom
    }, /realization A01-R2 records departures from the normal laws \(its base A01-R1 itself\) and declares no default-laws check/, 'an inherited departure on itself nothing reads')
    assert.equal(defaultLawsCheckRefusal({ mode: 'REPORT', because: 'TEST-ONLY', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }), null)
    assert.match(defaultLawsCheckRefusal({ mode: 'REPORT', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } })!, /without saying why/)
    // Without the profile's block, neither a check nor a departure is admitted.
    const withoutBlock = validateProvisionalRealizations(raw, undefined, undefined, undefined, undefined, undefined, undefined, undefined, null)
    assert.ok(withoutBlock.some(error => error.includes('declares a default-laws check, and the Sport Profile names no default laws')))
    assert.ok(withoutBlock.some(error => error.includes('records a departure from the normal laws, and the Sport Profile names no default laws')))
    assert.ok(withoutBlock.some(error => error.includes('realization A01-R1 records a departure from the normal laws on itself, and the Sport Profile names no default laws')))
})

// ── 3. The zone version, REPORT ──────────────────────────────────────────────────────────────────────────
const admin = (players: number, keepers: number, objects?: Record<string, unknown>) =>
    buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, objects) } as any, { includeDrafts: true })

test('A01-R1 at 12/1, 12/2 and 11/1, REPORT: LAW-8, the common restart and offside departed, LAW-12-GK owed, LAW-14/16/17 not applicable; served', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const served = admin(players, keepers) as ServedActivity
        assert.equal(served.outcome, 'served', label)
        const account = served.evidence!.defaultLaws!
        assert.deepEqual([account.status, account.realization, account.mode, account.blocks.length], ['ACCOUNT_FOR_REVIEW', R1, 'REPORT', 2], label)
        for (const at of [0, 1]) {
            const law8 = statusOf(account, at, 'LAW-8').game
            assert.deepEqual([law8.status, items(law8.departedBy)], ['DEPARTED', ['A01-R1-T2-1']], label)
            // Re-pointed 24 October 2026 (R3): offside is departed from, the whole of it, cited by the realization that records it on itself,
            // in his reply filed 27 October 2026, item 2 words. Was ADAPTATION_OWED.
            const offside = statusOf(account, at, 'LAW-11').game
            // Stage L (the R3 review's test-clarity should-fix): the status and who departs are asserted first, so a mutation removing the
            // departure fails on a named assertion, not on a TypeError indexing an empty list.
            assert.deepEqual([offside.status, items(offside.departedBy)], ['DEPARTED', [R1]], `${label}: LAW-11 is departed from by ${R1} on itself`)
            assert.deepEqual([offside.departedBy[0].extent, offside.departedBy[0].basis.citedAs, offside.why], ['WHOLE', 'his reply filed 27 October 2026, item 2', `departed from by ${R1}`], label)
            const handling = statusOf(account, at, 'LAW-12-GK').game
            assert.equal(handling.status, 'ADAPTATION_OWED', label)
            assert.deepEqual(handling.preconditions.map(p => [p.list, p.predicate.predicate, p.reading]), [['applicableWhen', 'SPECIALIZED_PERFORMER_PRESENT', 'PRESENT'], ['requires', 'REGION_BOUND_TO_OBJECT', 'ABSENT']])
            // The completeness audit, item 1: the goalkeeper's colours apply in each block of the zone version (a goalkeeper plays in both).
            const colours = statusOf(account, at, 'LAW-4-GK').game
            assert.deepEqual([colours.status, colours.preconditions.map(p => [p.list, p.predicate.predicate, p.reading])], ['APPLIES', [['applicableWhen', 'SPECIALIZED_PERFORMER_PRESENT', 'PRESENT']]], `${label} LAW-4-GK`)
            for (const law of ['LAW-14', 'LAW-16', 'LAW-17']) {
                for (const end of ['end0', 'end1']) {
                    const entry = statusOf(account, at, law)[end]
                    assert.equal(entry.status, 'NOT_APPLICABLE', `${label} ${law} ${end}`)
                    // Re-pointed 24 October 2026 (R1): the end-line restarts that recorded LAW-16 and LAW-17 here are withdrawn; the common
                    // restart's departure rests on no absence, so it records nothing where no goal stands (the design's 2.6: "the T4-3/T5-3
                    // citations go").
                    assert.deepEqual(items(entry.recordedBy), [], `${label} ${law} ${end}`)
                }
            }
            // R1: the restarts the common restart replaces and that can apply here are departed from by it, in his words.
            for (const law of ['LAW-8-DB', 'LAW-13', 'LAW-15']) {
                const entry = statusOf(account, at, law).game
                assert.deepEqual([entry.status, items(entry.departedBy)], ['DEPARTED', ['A01-R1-RP1-1']], `${label} ${law}`)
            }
        }
        // Each block's ends are named by who defends them in it.
        assert.deepEqual(account.blocks.map(block => block.ends.map(end => end.defendedBy[0])), [['ROLE_HOLDER_BUILDING', 'ROLE_HOLDER_PRESSING'], ['ROLE_HOLDER_PRESSING', 'ROLE_HOLDER_BUILDING']], label)
        // Re-pointed 24 October 2026 (R3): only the goalkeeper's handling is owed, in each block (his item 5 keeps it open). Was four.
        assert.deepEqual(account.owed.map(line => line.split(': ')[1].split(' ')[0]), ['LAW-12-GK', 'LAW-12-GK'], label)
        // The held sentence: DRAFT, from the wording data, and said nowhere a coach reads (the zone version owes LAW-12-GK).
        // Re-pointed 24 October 2026 (stage L, the d27 design's section 2.8): the words are the design's ('during play', no final full stop,
        // since a renderer says them where nothing is owed) and rest on his reply filed 27 October 2026, item 6 too. Was: 'Otherwise, normal
        // soccer rules apply.', item 10 alone. The status stays held here, since this account owes LAW-12-GK.
        assert.deepEqual(account.heldSentence, { text: 'Otherwise, normal soccer rules apply during play', status: 'DRAFT_HELD_NOT_SERVED', basis: { words: draftCoachWordingLoad().wording.normalLaws!.basis.words, citedAs: 'his reply filed 26 October 2026, item 10; his reply filed 27 October 2026, item 6' } })
        // Re-pointed 24 October 2026 (R3): read on the words a coach reads - the sentences, the overview and the diagram - since the one
        // sentence telling the coach there is no offside cites that law's entries in the account (its provenance names the law's id, as every
        // sentence's provenance names the elements it says). Was the whole rendering, provenance included.
        const coachText = JSON.stringify([served.rendered.instructions.map(i => i.text), served.overview ?? null, served.diagram ?? null])
        assert.ok(!coachText.includes('normal soccer rules') && !coachText.includes('LAW-'), `${label}: nothing a coach reads names the normal laws`)
        // R3: the one sentence for the law it removes without replacing it, said once, in How it works, citing only that law's entries.
        const told = served.rendered.instructions.filter(i => i.text.includes('offside'))
        assert.deepEqual(told.map(i => [i.text, i.section, i.from]), [['There is no offside', 'How it works', ['defaultLaws.laws[LAW-11]']]], label)
    }
    // A coach's answer carries no evidence, so no account.
    const coach = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(12, 1) } as any, { includeDrafts: false }) as ServedActivity
    assert.equal(coach.evidence, undefined)
})

/**
 * TEST-ONLY: the realizations file with every default-laws annotation taken out (the departures and both checks), as before H2. R3: the
 * departures a realization records on itself go too.
 */
const unannotated = (): any => {
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    for (const realization of file.realizations) {
        delete realization.defaultLawsCheck
        delete realization.departsFrom
        for (const item of realization.items) delete item.departsFrom
    }
    return file
}

/**
 * Re-pointed 24 October 2026 (R2, the d27 design's section 2.8: "under COMMON the Restarts sentence is added from the account"; his reply
 * filed 27 October 2026, item 4: "There should be no separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this
 * activity."): the account now says one thing to the coach - which of the sport's restarts the activity does not use - so the build with every
 * annotation taken out differs by exactly that sentence, and by what counts it (the sentence counts, the Details' word count read as evidence),
 * and by nothing else: every other sentence, the overview, the diagram and the account a coach reads are the same. Was: the same activity.
 */
const RESTARTS_SENTENCE = 'There are no throw-ins or free kicks in this activity; fouls still matter, so deal with them appropriately'
/**
 * R3 (24 October 2026, the d27 design's stage R3: '"There is no offside." said once'; his reply filed 27 October 2026, item 2): the account
 * says a second thing to the coach - that the activity has no offside - so the build with every annotation taken out differs by these two
 * sentences and by what counts them, and by nothing else. The R2 review's should-fix (a test-strength gap) is carried: the acceptance is
 * compared with only its sentence counts moved, the nine items whole, and the overview's evidence with only its sentence-dependent fields moved.
 */
const OFFSIDE_SENTENCE = 'There is no offside'
const ACCOUNT_SENTENCES = [RESTARTS_SENTENCE, OFFSIDE_SENTENCE]
/**
 * Which of his review request's items the account's two sentences bear on (measured 24 October 2026, R3): the restarts item (R6) the
 * Restarts sentence, and the complete text (R8) both.
 */
const ACCOUNT_ITEMS: [string, string][] = [
    ['R6', RESTARTS_SENTENCE],
    ['R8', OFFSIDE_SENTENCE],
    ['R8', RESTARTS_SENTENCE],
]
/**
 * Re-pointed 24 October 2026 (the completeness audit of the field-test build, item 1; his reply filed 27 October 2026, item 6: "Goalkeeper
 * identification: The goalkeeper should be visually distinguishable from the outfield players. Stable team identities and clear role labels
 * remain important in the diagram."): the account says a third thing to the coach, inside a sentence rather than as one - the clause closing
 * the roster sentence, written for LAW-4-GK, which applies wherever a goalkeeper plays. `uncoloured` takes that clause out of production's
 * values (the words from every string ending with them, its part from every list of parts, its citation from every list of paths), so the
 * comparison below still says what it said: nothing else a coach reads differs.
 */
const COLOUR = '; give the goalkeeper a colour neither team wears'
const COLOUR_AT = 'defaultLaws.applied[LAW-4-GK]'
const uncoloured = (value: any): any => {
    if (typeof value === 'string') return value.endsWith(COLOUR) ? value.slice(0, -COLOUR.length) : value
    if (Array.isArray(value)) return value.filter(entry => entry !== COLOUR_AT && !(entry && typeof entry === 'object' && entry.text === COLOUR)).map(uncoloured)
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, uncoloured(entry)]))
    return value
}
/**
 * The two values are the same but for each `blockIndex` (a Details sentence's place in its block) at or after `from` in the bare build, which
 * is one more in production (a sentence said before it); every other leaf is equal.
 */
function shifted(production: unknown, bare: unknown, from: number, at: string): void {
    if (Array.isArray(bare)) {
        assert.ok(Array.isArray(production) && production.length === bare.length, `${at}: a list of ${bare.length}`)
        bare.forEach((value, i) => shifted((production as unknown[])[i], value, from, `${at}[${i}]`))
        return
    }
    if (bare && typeof bare === 'object') {
        assert.ok(production && typeof production === 'object' && !Array.isArray(production), `${at}: an object`)
        assert.deepEqual(Object.keys(production as object).sort(), Object.keys(bare).sort(), `${at}: its keys`)
        for (const [key, value] of Object.entries(bare)) {
            const own = (production as Record<string, unknown>)[key]
            if (key === 'blockIndex' && typeof value === 'number') assert.equal(own, value >= from ? value + 1 : value, `${at}.${key}`)
            else shifted(own, value, from, `${at}.${key}`)
        }
        return
    }
    assert.deepEqual(production, bare, at)
}
test('what a coach reads changes only by the account\'s two sentences: the same build with every annotation taken out of a copy says everything else the same, and gains no account', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const request = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers) } as any
        const production = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { review: { includeDrafts: true } }).activity as ServedActivity
        const bare = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { review: { includeDrafts: true }, realizations: loadProvisionalRealizations(unannotated()) }).activity as ServedActivity
        assert.equal(bare.outcome, 'served', label)
        for (const key of ['overview', 'diagram', 'account', 'title', 'subtitle'] as const) assert.deepEqual(production[key], bare[key], `${label}: ${key}`)
        // The completeness audit, item 1: the administrator's diagram model carries the roster sentence's words; with the clause taken out
        // it is the bare build's.
        assert.deepEqual(uncoloured(production.diagramDraft), bare.diagramDraft, `${label}: diagramDraft, but the colour clause`)
        // The account's sentences: each said once with it, never without it; every other sentence the same.
        for (const sentence of ACCOUNT_SENTENCES) assert.deepEqual(production.rendered.instructions.filter(i => i.text === sentence).length, 1, `${label}: ${sentence}`)
        assert.ok(!bare.rendered.instructions.some(i => i.text.startsWith('There are no ') || i.text.startsWith('There is no ')), `${label}: no account, neither sentence`)
        // The completeness audit, item 1: the colour clause closes the roster sentence once with the account, citing LAW-4-GK as applied,
        // and is never said without it.
        const roster = production.rendered.instructions.filter(i => i.section === 'Players' && i.text.endsWith(COLOUR))
        assert.equal(roster.length, 1, `${label}: the colour clause closes one roster sentence`)
        assert.deepEqual(roster[0].parts!.filter(part => part.text === COLOUR).map(part => part.from[0]), [COLOUR_AT], label)
        assert.ok(!JSON.stringify(bare.rendered).includes('colour'), `${label}: no account, no colour clause`)
        const without = (instructions: { text: string }[]) => instructions.filter(i => !ACCOUNT_SENTENCES.includes(i.text))
        assert.deepEqual(uncoloured({ ...production.rendered, instructions: without(production.rendered.instructions) }), bare.rendered, `${label}: rendered`)
        // What counts the sentences: two more with the account, nothing else.
        const more = ACCOUNT_SENTENCES.length
        assert.deepEqual({ ...production.integrity, instructions: production.integrity.instructions - more }, bare.integrity, `${label}: integrity`)
        assert.deepEqual(
            { ...production.roleBlocks, blocks: production.roleBlocks!.blocks.map((block: any) => ({ ...block, integrity: { ...block.integrity, instructions: block.integrity.instructions - more } })) },
            bare.roleBlocks,
            `${label}: roleBlocks`,
        )
        const { reading: productionReading, ...productionDraft } = production.overviewDraft!
        const { reading: bareReading, ...bareDraft } = bare.overviewDraft!
        // R3: the offside sentence closes How it works, so every Details sentence after it sits one place later in its block: the drafts are
        // the same but for each such index moved by one (`shifted`), and nothing else.
        const after = production.rendered.instructions.findIndex(i => i.text === OFFSIDE_SENTENCE)
        assert.ok(after > 0, label)
        shifted(uncoloured(productionDraft), bareDraft, after, `${label}: overviewDraft`)
        assert.deepEqual({ ...productionReading!, detailsWords: 0 }, { ...bareReading!, detailsWords: 0 }, `${label}: the overview's reading, but the Details' word count`)
        // A realization declaring no check gains no account (the evidence's sentence lists and counts differ by the two sentences).
        assert.equal(bare.evidence!.defaultLaws, undefined, label)
        const { defaultLaws: _account, measured: _digests, acceptance: _a, items: _i, sections: _s, overview: _o, provenance: _p, ...rest } = production.evidence!
        const { measured: _bareDigests, acceptance: _ba, items: _bi, sections: _bs, overview: _bo, provenance: _bp, ...bareRest } = bare.evidence!
        assert.deepEqual(rest, bareRest, `${label}: the evidence gains the account and the two sentences, and nothing else`)
        assert.deepEqual(without(production.evidence!.sections.instructions).map(i => uncoloured(i.text)), bare.evidence!.sections.instructions.map(i => i.text), label)
        // The provenance: one element more, the offside sentence's citation of LAW-11's entries in the account; every other the same.
        // Re-pointed 24 October 2026 (the completeness audit, item 1): and one more again, the colour clause's citation of LAW-4-GK as applied.
        const { elements, ...provenance } = production.evidence!.provenance
        const { elements: bareElements, ...bareProvenance } = bare.evidence!.provenance
        assert.deepEqual(provenance, bareProvenance, `${label}: provenance`)
        assert.deepEqual(elements.filter(element => element.path !== 'defaultLaws.laws[LAW-11]' && element.path !== COLOUR_AT), bareElements, `${label}: the provenance's elements, but the account's`)
        assert.equal(elements.length, bareElements.length + 2, label)
        // The overview's evidence: the same but for the Details places moved by the offside sentence, and the Details' word count by exactly
        // the two sentences' words (and, since the completeness audit's item 1, the colour clause's).
        const accountWords = ACCOUNT_SENTENCES.reduce((n, sentence) => n + sentence.split(/\s+/).length, 0) + COLOUR.trim().split(/\s+/).length - 1
        const overviewEvidence = production.evidence!.overview as any
        assert.equal(overviewEvidence.reading.detailsWords, (bare.evidence!.overview as any).reading.detailsWords + accountWords, `${label}: the Details' words`)
        shifted(uncoloured({ ...overviewEvidence, reading: { ...overviewEvidence.reading, detailsWords: overviewEvidence.reading.detailsWords - accountWords } }), bare.evidence!.overview, after, `${label}: the overview's evidence`)
        // The R2 review's should-fix: the acceptance with only its sentence counts moved (two more DRAFT sentences), and the nine items whole.
        const counted = (acceptance: { what: string; value: any }[], by: number) => acceptance.map(fact => (fact.what === 'sentences' ? { ...fact, value: { ...fact.value, draft: fact.value.draft - by, total: fact.value.total - by } } : fact))
        assert.deepEqual(counted(production.evidence!.acceptance as any, more), bare.evidence!.acceptance, `${label}: the acceptance, but two more DRAFT sentences`)
        // The nine items: each lists the sentences bearing on it by their place, so with the account's two sentences taken out of production's
        // lists and every later place moved back, the items are the bare build's whole; which items the two sentences bear on is pinned.
        const accountAt = production.rendered.instructions.flatMap((i, n) => (ACCOUNT_SENTENCES.includes(i.text) ? [n] : []))
        const back = (n: number) => n - accountAt.filter(at => at < n).length
        const itemsWithout = (list: any[]) => list.map(item => ({ ...item, sentences: (item.sentences as number[]).filter(n => !accountAt.includes(n)).map(back) }))
        assert.deepEqual(itemsWithout(production.evidence!.items as any[]), bare.evidence!.items, `${label}: the nine items, but the account's two sentences`)
        assert.deepEqual(
            (production.evidence!.items as any[]).flatMap(item => (item.sentences as number[]).filter(n => accountAt.includes(n)).map(n => [item.id, production.rendered.instructions[n].text])),
            ACCOUNT_ITEMS,
            `${label}: the items the account's sentences bear on`,
        )
    }
})

// ── 4. The goal version, TEST-ONLY ───────────────────────────────────────────────────────────────────────
/**
 * TEST-ONLY, in memory: the record lists the goal version as one that can be tried and its goal a suitability; `mode` replaces its check. H3
 * (23 October 2026): and no bound-region block is handed to the build (`boundRegions: null`), a stand-in for D-PENALTY-AREA, so the 5 m goal
 * is required no region (with the profile's block in force it is a knowledge gap, bound-regions.unit.ts): every law reads as before.
 */
const goalBuild = (players: number, keepers: number, alter: (file: any) => void = () => undefined) => {
    const records = learningGoalAuthorizations()
    const record = records.find(r => r.learningGoalId === 'A01') as any
    record.realizations = record.realizations.map((entry: any) => (entry.realization === R2 ? { realization: entry.realization, words: entry.words, citedAs: entry.citedAs } : entry))
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    // Re-pointed 24 October 2026 (K2): A01-R2 now records its goal's penalty area (A01-R2-S2-1 to S7-1, pinned in
    // goal-version-penalty-area.unit.ts, where its account owes nothing). This stand-in hands the build no bound-region block for its
    // TEST-ONLY 5 m goal, so those items would be realized with no pairing to word them, and the build is refused at communication (fidelity
    // Q3, measured); they are left out of the copy, in memory, so the stand-in is the no-region goal it was before K2 and LAW-12-GK stays
    // owed, as the tests below measure.
    const variant = file.realizations.find((r: any) => r.id === R2)
    variant.items = variant.items.filter((i: any) => i.selector !== 'noun=zone & functions ∋ penalty-area')
    file.realizations.find((r: any) => r.id === R2).objectSuitability = [{ kind: 'goal', widthM: { min: 1, max: 10 }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    alter(file)
    return buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, GOAL) } as any, records, { realizations: loadProvisionalRealizations(file), review: { includeDrafts: true }, boundRegions: null })
}
const REPORT = (file: any) => (file.realizations.find((r: any) => r.id === R2).defaultLawsCheck = { mode: 'REPORT', because: 'TEST-ONLY', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } })

/**
 * Re-pointed 24 October 2026 (R1, the d27 design's section 2.6): the goal version inherits the one common restart (A01-R1-RP1-1), whose
 * departures hold at the goal end as at the other, so penalty kicks, goal kicks and corner kicks are DEPARTED where the goal stands and not
 * applicable at the other end; the end-line restarts' X5 citations go with them. What the copy still owes is offside and the goalkeeper's
 * handling, in each block (four, down from ten): offside waits on the next stage (his item 2), handling on the goal's penalty area.
 */
test('the TEST-ONLY goal copy: LAW-14, LAW-16 and LAW-17 departed at the goal end by the common restart, not applicable at the other; in both blocks', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const served = goalBuild(players, keepers, REPORT).activity as ServedActivity
        assert.equal(served.outcome, 'served', label)
        const account = served.evidence!.defaultLaws!
        assert.equal(account.realization, R2)
        for (const at of [0, 1]) {
            // The goal stands on the end line at 0 m in both blocks, defended by the team holding the building role (the ends exchanged).
            assert.deepEqual(account.blocks[at].ends.map(end => [end.atM, end.defendedBy[0]]), [[0, 'ROLE_HOLDER_BUILDING'], [40, 'ROLE_HOLDER_PRESSING']], label)
            for (const law of ['LAW-14', 'LAW-16', 'LAW-17']) {
                const entry = statusOf(account, at, law)
                assert.deepEqual([entry.end0.status, items(entry.end0.departedBy), items(entry.end0.noLongerHolds), items(entry.end0.departedInPart), entry.end1.status], ['DEPARTED', ['A01-R1-RP1-1'], [], [], 'NOT_APPLICABLE'], `${label} ${law}`)
            }
            for (const law of ['LAW-8-DB', 'LAW-13', 'LAW-15']) assert.deepEqual([statusOf(account, at, law).game.status, items(statusOf(account, at, law).game.departedBy)], ['DEPARTED', ['A01-R1-RP1-1']], `${label} ${law}`)
            // Re-pointed 24 October 2026 (R3): offside is departed from, inherited from A01-R1, which records it on itself. Was owed.
            assert.deepEqual([statusOf(account, at, 'LAW-8').game.status, statusOf(account, at, 'LAW-11').game.status, items(statusOf(account, at, 'LAW-11').game.departedBy), statusOf(account, at, 'LAW-12-GK').game.status], ['DEPARTED', 'DEPARTED', [R1], 'ADAPTATION_OWED'])
        }
        // Re-pointed 24 October 2026 (R3): only the goalkeeper's handling is owed, in each block (the design's 2.6: "After R3 it owes two").
        assert.deepEqual(account.owed.map(line => line.split(': ')[1].split(' ')[0]), ['LAW-12-GK', 'LAW-12-GK'], `${label}: one law owed in each block`)
        // The goal version tells the coach once too (the design's 2.8: "Offside, said once, in both versions").
        assert.equal(served.rendered.instructions.filter(i => i.text === OFFSIDE_SENTENCE).length, 1, label)
    }
})

test('under the ENFORCE it records, the goal copy (its two decisions completed only) is refused at validation, each law named, never falling back', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const refused = goalBuild(players, keepers).activity as RefusedActivity
        assert.deepEqual([refused.outcome, refused.stage], ['refused', 'validation'], label)
        assert.equal(refused.summary, "Where this activity departs from the sport's normal rules has not all been decided yet, so it is not being shown.")
        // Re-pointed 24 October 2026 (R1): four adaptations, down from ten - the common restart departs from the three restart laws. Re-pointed
        // 24 October 2026 (R3): two - offside is departed from (inherited from A01-R1); the goalkeeper's handling waits on the goal's penalty area.
        assert.equal(refused.reasons[0], `the provisional realization ${R2} holds its activity to the normal laws (ENFORCE), and 2 adaptations are owed`)
        assert.equal(refused.reasons.filter(reason => reason.includes(': LAW-12-GK (')).length, 2, `${label} LAW-12-GK: named in both blocks`)
        for (const law of ['LAW-8', 'LAW-8-DB', 'LAW-11', 'LAW-13', 'LAW-14', 'LAW-15', 'LAW-16', 'LAW-17']) assert.ok(!refused.reasons.some(reason => reason.includes(`${law} (`)), `${label}: ${law} is departed from, not owed`)
        // A knowledge gap, never a fallback: the zone version behind it is not tried.
        assert.deepEqual((refused.account.realizationSelection as any[]).map(entry => [entry.realization, entry.outcome, entry.stage]), [[R2, 'REFUSED', 'validation'], [R1, 'NOT_TRIED', null]], label)
        assert.equal(refused.evidence!.defaultLaws!.mode, 'ENFORCE')
    }
})

// ── 5. UNREPRESENTED, UNKNOWN and APPLIES ────────────────────────────────────────────────────────────────
test('UNREPRESENTED never yields APPLIES; an unreadable precondition never passes; a law whose preconditions all hold applies', () => {
    const built: any = goalBuild(12, 1, REPORT)
    const block = built.fixture.roleBlocks.blocks[0]
    const r2 = loadProvisionalRealizations().find(r => r.provisionalId === R2)!
    const accountWith = (laws: DefaultLaws, game: unknown = block.fixture.game, items = r2.items) => blockLawAccountOf({ blockId: block.blockId, game, roleBlock: block.fixture.record.roleBlock, index, session: sessionOf(12, 1), laws, items })
    const lawsWith = (law: any): DefaultLaws => ({ ...copy(laws), laws: [law] })
    // On every production account, an UNREPRESENTED precondition reads ABSENT, and no law resting on one applies.
    for (const account of [(admin(12, 1) as ServedActivity).evidence!.defaultLaws!, built.activity.evidence.defaultLaws as DefaultLawsAccount]) {
        for (const entry of account.blocks.flatMap(b => b.laws)) {
            const unrepresented = entry.preconditions.filter(p => p.predicate.predicate === 'UNREPRESENTED')
            assert.ok(unrepresented.every(p => p.reading === 'ABSENT'))
            if (unrepresented.length) assert.notEqual(entry.status, 'APPLIES', entry.law)
        }
    }
    // TEST-ONLY: a law needing only what is not represented, with no departure, is owed - never applies.
    const bare = accountWith(lawsWith({ id: 'TEST-ONLY', cites: 'TEST-ONLY', name: 'TEST-ONLY', scope: 'GAME', applicableWhen: [], requires: [{ predicate: 'UNREPRESENTED', what: 'TEST-ONLY' }], note: null }))
    assert.equal(bare.laws[0].status, 'ADAPTATION_OWED')
    // TEST-ONLY control: a law whose every precondition holds, and which nothing departs from, applies.
    const holding = accountWith(lawsWith({ id: 'TEST-ONLY', cites: 'TEST-ONLY', name: 'TEST-ONLY', scope: 'PER_END', applicableWhen: [], requires: [{ predicate: 'OBJECT_OF_KIND_AT_END', kind: 'goal' }], note: null }))
    assert.deepEqual(holding.laws.map(entry => entry.status), ['APPLIES', 'ADAPTATION_OWED'], 'at the goal end it applies; at the other, the goal is missing')
    // The completeness audit, item 1: the goalkeeper's colours apply where a team holds a goalkeeper, and where no team does (TEST-ONLY: every
    // team's count on the goalkeeper row set to 0) they are not applicable, so nothing is said or owed for them - never applying, never owed.
    const colours = laws.laws.find(law => law.id === 'LAW-4-GK')!
    assert.equal(accountWith(lawsWith(colours)).laws[0].status, 'APPLIES', 'a goalkeeper plays')
    const keeperLeaf = String(index.rows.get('P3')?.path ?? '').split('[].').pop()!
    const noKeeper = copy(block.fixture.game)
    for (const team of noKeeper.performers.teams) team[keeperLeaf] = 0
    const without = accountWith(lawsWith(colours), noKeeper).laws[0]
    assert.deepEqual([without.status, without.preconditions.map(p => p.reading)], ['NOT_APPLICABLE', ['ABSENT']], 'no team holds a goalkeeper')
    // TEST-ONLY: the goal with its realized place taken out cannot be read, so LAW-17 there is owed, saying so - never not applicable.
    const unplaced = copy(block.fixture.game)
    for (const object of unplaced.objects) delete object.realizedGeometry
    const unread = accountWith(lawsWith(laws.laws.find(law => law.id === 'LAW-17')), unplaced)
    assert.deepEqual(unread.laws.map(entry => entry.status), ['ADAPTATION_OWED', 'ADAPTATION_OWED'])
    assert.ok(unread.laws[0].why.includes('cannot be read') && unread.laws[0].why.includes('insufficient evidence is never a pass'), unread.laws[0].why)
    // A departure from part of a law whose preconditions all hold is cited, and the rest of the law applies (the uncovered part is its own).
    // Re-pointed 24 October 2026 (R1): no production item records a part departure since the common restart replaced A01-R1-T1-3's, so the
    // item is a TEST-ONLY copy of it carrying the part it recorded.
    const partItem: any = { ...copy(r2.items.find(item => item.itemId === 'A01-R1-T1-3')!), departsFrom: [{ law: 'LAW-16', because: 'TEST-ONLY', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' }, extent: 'PART', part: 'a shot that goes over the end line a goal stands on, when the coach concludes the episode' }] }
    const partOnly = accountWith(lawsWith({ id: 'LAW-16', cites: 'TEST-ONLY', name: 'TEST-ONLY', scope: 'PER_END', applicableWhen: [{ predicate: 'OBJECT_OF_KIND_AT_END', kind: 'goal' }], requires: [], note: null }), block.fixture.game, [partItem])
    assert.deepEqual([partOnly.laws[0].status, items(partOnly.laws[0].departedInPart)], ['APPLIES', ['A01-R1-T1-3']])
    // R1 (24 October 2026): the common-restart clause. Under the game's common dead-ball restart a restart law whose preconditions all hold
    // and that nothing departs from is owed - never APPLIES; the same law not marked a restart law applies; and a game keeping a restart per
    // trigger leaves the restart law applying.
    assert.equal(block.fixture.game.restartPolicy?.deadBall, 'COMMON', 'the goal copy holds the common restart (inherited A01-R1-RP1-1)')
    const restartLaw = { id: 'TEST-ONLY', cites: 'TEST-ONLY', name: 'TEST-ONLY', scope: 'GAME', applicableWhen: [], requires: [], note: null, listedFor: 'DEPARTURE', restart: true }
    const common = accountWith(lawsWith(restartLaw), block.fixture.game, [])
    assert.equal(common.laws[0].status, 'ADAPTATION_OWED')
    assert.ok(common.laws[0].why.includes("the game's dead-ball restart policy (restartPolicy.deadBall) is COMMON"), common.laws[0].why)
    assert.equal(accountWith(lawsWith({ ...restartLaw, restart: false }), block.fixture.game, []).laws[0].status, 'APPLIES')
    const perTrigger = copy(block.fixture.game)
    perTrigger.restartPolicy.deadBall = 'PER_TRIGGER'
    assert.equal(accountWith(lawsWith(restartLaw), perTrigger, []).laws[0].status, 'APPLIES')
    delete perTrigger.restartPolicy
    assert.equal(accountWith(lawsWith(restartLaw), perTrigger, []).laws[0].status, 'APPLIES')
})

// ── 6. Mutations ─────────────────────────────────────────────────────────────────────────────────────────
test('mutation: removing one departure flips DEPARTED to ADAPTATION_OWED; removing the condition flips the goal end from owed to DEPARTED', () => {
    const withoutT21 = readJson(PROVISIONAL_REALIZATIONS_FILE)
    delete withoutT21.realizations.find((r: any) => r.id === R1).items.find((item: any) => item.id === 'A01-R1-T2-1').departsFrom
    const mutated = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(12, 1) } as any, learningGoalAuthorizations(), { review: { includeDrafts: true }, realizations: loadProvisionalRealizations(withoutT21) }).activity as ServedActivity
    assert.equal(mutated.outcome, 'served', 'REPORT refuses nothing')
    for (const at of [0, 1]) {
        const law8 = statusOf(mutated.evidence!.defaultLaws!, at, 'LAW-8').game
        assert.deepEqual([law8.status, items(law8.departedBy)], ['ADAPTATION_OWED', []])
    }
    // Re-pointed 24 October 2026 (R3): the kick-off and the goalkeeper's handling in each block (offside is departed from). Was 6.
    assert.equal(mutated.evidence!.defaultLaws!.owed.length, 4)
    // Re-pointed 24 October 2026 (R1): the condition mechanism (the design of 26 October's X5) is exercised on a TEST-ONLY copy, since no
    // production departure rests on an absence any more. With the common restart's LAW-17 departure resting on there being no goal at that
    // end, its reason is false at the goal end and an adaptation is owed there; without the condition, it is DEPARTED, as production records.
    const conditioned = goalBuild(12, 1, file => {
        REPORT(file)
        const departure = file.realizations.find((r: any) => r.id === R1).items.find((item: any) => item.id === 'A01-R1-RP1-1').departsFrom.find((d: any) => d.law === 'LAW-17')
        departure.whilePreconditionAbsent = { predicate: 'OBJECT_OF_KIND_AT_END', kind: 'goal' }
    }).activity as ServedActivity
    const owedCorner = statusOf(conditioned.evidence!.defaultLaws!, 0, 'LAW-17')
    assert.deepEqual([owedCorner.end0.status, items(owedCorner.end0.noLongerHolds), owedCorner.end1.status, items(owedCorner.end1.recordedBy)], ['ADAPTATION_OWED', ['A01-R1-RP1-1'], 'NOT_APPLICABLE', ['A01-R1-RP1-1']])
    const corner = statusOf((goalBuild(12, 1, REPORT).activity as ServedActivity).evidence!.defaultLaws!, 0, 'LAW-17')
    assert.deepEqual([corner.end0.status, items(corner.end0.departedBy), corner.end1.status], ['DEPARTED', ['A01-R1-RP1-1'], 'NOT_APPLICABLE'])
    // R1: the common restart's departure from LAW-17 taken out of a copy: the corner would apply at the goal end (it requires nothing), and
    // the common-restart clause makes it owed - never APPLIES while the coach is told every dead ball restarts one way.
    const undeparted = goalBuild(12, 1, file => {
        REPORT(file)
        const rp1 = file.realizations.find((r: any) => r.id === R1).items.find((item: any) => item.id === 'A01-R1-RP1-1')
        rp1.departsFrom = rp1.departsFrom.filter((d: any) => d.law !== 'LAW-17')
    }).activity as ServedActivity
    const bare = statusOf(undeparted.evidence!.defaultLaws!, 0, 'LAW-17')
    assert.equal(bare.end0.status, 'ADAPTATION_OWED')
    assert.ok(bare.end0.why.includes('is COMMON') && bare.end0.why.includes('this restart law cannot apply as written'), bare.end0.why)
    assert.equal(bare.end1.status, 'NOT_APPLICABLE')
})

/**
 * R3 (24 October 2026; the d27 design's 4.2 mutation "remove the offside departure: LAW-11 owed, refused under ENFORCE", and its 4.5 "zone-
 * version offside (R3), reversible by moving the LAW-11 departure to A01-R2 only"): TEST-ONLY copies of the realizations file.
 */
test('mutation: the departure on the realization taken out makes LAW-11 owed - served under REPORT with no sentence, refused under ENFORCE naming it; moved to A01-R2 it covers the goal version only', () => {
    const withoutOffside = (file: any) => delete file.realizations.find((r: any) => r.id === R1).departsFrom
    const zone = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(12, 1) } as any, learningGoalAuthorizations(), {
        review: { includeDrafts: true },
        realizations: loadProvisionalRealizations((() => {
            const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
            withoutOffside(file)
            return file
        })()),
    }).activity as ServedActivity
    assert.equal(zone.outcome, 'served', 'REPORT refuses nothing')
    for (const at of [0, 1]) {
        const offside = statusOf(zone.evidence!.defaultLaws!, at, 'LAW-11').game
        assert.deepEqual([offside.status, items(offside.departedBy)], ['ADAPTATION_OWED', []])
    }
    assert.equal(zone.evidence!.defaultLaws!.owed.length, 4)
    assert.ok(!zone.rendered.instructions.some(i => i.text === OFFSIDE_SENTENCE), 'a law owed is never said away')
    const refused = goalBuild(12, 1, withoutOffside).activity as RefusedActivity
    assert.deepEqual([refused.outcome, refused.stage, refused.reasons[0]], ['refused', 'validation', `the provisional realization ${R2} holds its activity to the normal laws (ENFORCE), and 4 adaptations are owed`])
    assert.equal(refused.reasons.filter(reason => reason.includes(': LAW-11 (')).length, 2, 'named in both blocks')
    // Moved to the goal version alone (the reversal of OUR READING): the zone version owes it and says nothing; the goal version departs from it.
    const moved = (file: any) => {
        const r1 = file.realizations.find((r: any) => r.id === R1)
        file.realizations.find((r: any) => r.id === R2).departsFrom = r1.departsFrom
        delete r1.departsFrom
    }
    const zoneMoved = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(12, 1) } as any, learningGoalAuthorizations(), {
        review: { includeDrafts: true },
        realizations: loadProvisionalRealizations((() => {
            const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
            moved(file)
            return file
        })()),
    }).activity as ServedActivity
    assert.deepEqual([zoneMoved.outcome, statusOf(zoneMoved.evidence!.defaultLaws!, 0, 'LAW-11').game.status, zoneMoved.rendered.instructions.some(i => i.text === OFFSIDE_SENTENCE)], ['served', 'ADAPTATION_OWED', false])
    const goalMoved = goalBuild(12, 1, file => {
        REPORT(file)
        moved(file)
    }).activity as ServedActivity
    const offside = statusOf(goalMoved.evidence!.defaultLaws!, 0, 'LAW-11').game
    assert.deepEqual([goalMoved.outcome, offside.status, items(offside.departedBy), goalMoved.rendered.instructions.filter(i => i.text === OFFSIDE_SENTENCE).length], ['served', 'DEPARTED', [R2], 1])
})

console.log(`default-laws.unit.ts — ${passed} passed`)
