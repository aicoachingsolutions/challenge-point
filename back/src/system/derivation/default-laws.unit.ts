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
const sessionOf = (players: number, keepers: number, objects?: Record<string, unknown>) => ({ players, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [KEEPER]: keepers }, ...(objects ? { objects } : {}) })
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
test("the profile's defaultLaws block: his item 10 words, the restatement, and nine laws in the closed vocabulary, each listed for a reason", () => {
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
        ],
    )
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
    refused(f => delete f.realizations.find((r: any) => r.id === R1).defaultLawsCheck, /records departures from the normal laws \(A01-R1-T2-1, A01-R1-RP1-1\) and declares no default-laws check/, 'departures nothing reads')
    assert.equal(defaultLawsCheckRefusal({ mode: 'REPORT', because: 'TEST-ONLY', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }), null)
    assert.match(defaultLawsCheckRefusal({ mode: 'REPORT', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } })!, /without saying why/)
    // Without the profile's block, neither a check nor a departure is admitted.
    const withoutBlock = validateProvisionalRealizations(raw, undefined, undefined, undefined, undefined, undefined, undefined, undefined, null)
    assert.ok(withoutBlock.some(error => error.includes('declares a default-laws check, and the Sport Profile names no default laws')))
    assert.ok(withoutBlock.some(error => error.includes('records a departure from the normal laws, and the Sport Profile names no default laws')))
})

// ── 3. The zone version, REPORT ──────────────────────────────────────────────────────────────────────────
const admin = (players: number, keepers: number, objects?: Record<string, unknown>) =>
    buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, objects) } as any, { includeDrafts: true })

test('A01-R1 at 12/1, 12/2 and 11/1, REPORT: LAW-8 and the common restart departed, LAW-11 and LAW-12-GK owed, LAW-14/16/17 not applicable; served', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const served = admin(players, keepers) as ServedActivity
        assert.equal(served.outcome, 'served', label)
        const account = served.evidence!.defaultLaws!
        assert.deepEqual([account.status, account.realization, account.mode, account.blocks.length], ['ACCOUNT_FOR_REVIEW', R1, 'REPORT', 2], label)
        for (const at of [0, 1]) {
            const law8 = statusOf(account, at, 'LAW-8').game
            assert.deepEqual([law8.status, items(law8.departedBy)], ['DEPARTED', ['A01-R1-T2-1']], label)
            assert.equal(statusOf(account, at, 'LAW-11').game.status, 'ADAPTATION_OWED', label)
            const handling = statusOf(account, at, 'LAW-12-GK').game
            assert.equal(handling.status, 'ADAPTATION_OWED', label)
            assert.deepEqual(handling.preconditions.map(p => [p.list, p.predicate.predicate, p.reading]), [['applicableWhen', 'SPECIALIZED_PERFORMER_PRESENT', 'PRESENT'], ['requires', 'REGION_BOUND_TO_OBJECT', 'ABSENT']])
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
        assert.deepEqual(account.owed.map(line => line.split(': ')[1].split(' ')[0]), ['LAW-11', 'LAW-12-GK', 'LAW-11', 'LAW-12-GK'], label)
        // The held sentence: DRAFT, from the wording data, and said nowhere a coach reads.
        assert.deepEqual(account.heldSentence, { text: 'Otherwise, normal soccer rules apply.', status: 'DRAFT_HELD_NOT_SERVED', basis: { words: draftCoachWordingLoad().wording.normalLaws!.basis.words, citedAs: 'his reply filed 26 October 2026, item 10' } })
        const coachText = JSON.stringify([served.rendered, served.overview ?? null, served.diagram ?? null])
        assert.ok(!coachText.includes('normal soccer rules') && !coachText.includes('LAW-'), `${label}: nothing a coach reads names the normal laws`)
    }
    // A coach's answer carries no evidence, so no account.
    const coach = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(12, 1) } as any, { includeDrafts: false }) as ServedActivity
    assert.equal(coach.evidence, undefined)
})

/** TEST-ONLY: the realizations file with every default-laws annotation taken out (the departures and both checks), as before H2. */
const unannotated = (): any => {
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    for (const realization of file.realizations) {
        delete realization.defaultLawsCheck
        for (const item of realization.items) delete item.departsFrom
    }
    return file
}

test('nothing a coach reads changes: the same build with every annotation taken out of a copy is the same activity, and gains no account', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const request = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers) } as any
        const production = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { review: { includeDrafts: true } }).activity as ServedActivity
        const bare = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { review: { includeDrafts: true }, realizations: loadProvisionalRealizations(unannotated()) }).activity as ServedActivity
        assert.equal(bare.outcome, 'served', label)
        for (const key of ['rendered', 'overview', 'diagram', 'roleBlocks', 'integrity', 'account', 'title', 'subtitle', 'overviewDraft', 'diagramDraft'] as const) assert.deepEqual(production[key], bare[key], `${label}: ${key}`)
        // A realization declaring no check gains no account; every other part of the evidence is the same.
        assert.equal(bare.evidence!.defaultLaws, undefined, label)
        const { defaultLaws: _account, measured: _digests, ...rest } = production.evidence!
        const { measured: _bareDigests, ...bareRest } = bare.evidence!
        assert.deepEqual(rest, bareRest, `${label}: the evidence gains the account and nothing else`)
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
            assert.deepEqual([statusOf(account, at, 'LAW-8').game.status, statusOf(account, at, 'LAW-11').game.status, statusOf(account, at, 'LAW-12-GK').game.status], ['DEPARTED', 'ADAPTATION_OWED', 'ADAPTATION_OWED'])
        }
        assert.equal(account.owed.length, 4, `${label}: two laws owed in each block`)
    }
})

test('under the ENFORCE it records, the goal copy (its two decisions completed only) is refused at validation, each law named, never falling back', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const refused = goalBuild(players, keepers).activity as RefusedActivity
        assert.deepEqual([refused.outcome, refused.stage], ['refused', 'validation'], label)
        assert.equal(refused.summary, "Where this activity departs from the sport's normal rules has not all been decided yet, so it is not being shown.")
        // Re-pointed 24 October 2026 (R1): four adaptations, down from ten - the common restart departs from the three restart laws.
        assert.equal(refused.reasons[0], `the provisional realization ${R2} holds its activity to the normal laws (ENFORCE), and 4 adaptations are owed`)
        for (const law of ['LAW-11', 'LAW-12-GK']) assert.equal(refused.reasons.filter(reason => reason.includes(`: ${law} (`)).length, 2, `${label} ${law}: named in both blocks`)
        for (const law of ['LAW-8', 'LAW-8-DB', 'LAW-13', 'LAW-14', 'LAW-15', 'LAW-16', 'LAW-17']) assert.ok(!refused.reasons.some(reason => reason.includes(`${law} (`)), `${label}: ${law} is departed from, not owed`)
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
    assert.equal(mutated.evidence!.defaultLaws!.owed.length, 6)
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

console.log(`default-laws.unit.ts — ${passed} passed`)
