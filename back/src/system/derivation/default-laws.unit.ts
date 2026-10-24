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
const LAWS = ['LAW-8', 'LAW-11', 'LAW-12-GK', 'LAW-14', 'LAW-16', 'LAW-17']
const laws = loadSportDefaultLaws()!
/** The Sport Profile file as authored (a fresh copy each time). */
const profileFile = (): any => readJson(laws.file)

/** One law's entries in a block account, by place: the game, end 0 or end 1. */
const statusOf = (account: DefaultLawsAccount, blockAt: number, law: string) =>
    Object.fromEntries(account.blocks[blockAt].laws.filter(entry => entry.law === law).map(entry => [entry.end === null ? 'game' : `end${entry.end}`, entry]))
const items = (entries: { item: string }[]) => entries.map(entry => entry.item)

// ── 1. The block in the Sport Profile ────────────────────────────────────────────────────────────────────
test("the profile's defaultLaws block: his item 10 words, the restatement, and six laws in the closed vocabulary", () => {
    assert.deepEqual([laws.source, laws.edition, laws.authority.citedAs, laws.authority.by, laws.authority.ruledOn], ['IFAB Laws of the Game', null, 'his reply filed 26 October 2026, item 10', 'Christian', '2026-10-26'])
    assert.deepEqual(laws.authority.words, ITEM_10, 'his item 10, verbatim and whole sentences')
    assert.ok(laws.editionNote.startsWith('He names no edition.'))
    const raw = profileFile()
    assert.ok(raw.deliberatelyNotContributed[0].startsWith('Ordinary Laws of the Game are not authored here: no law becomes an item or a line of the game. RESTATED 23 October 2026'))
    assert.ok(raw.deliberatelyNotContributed[0].includes(`"${ITEM_10[0]}"`), 'restated with his authority, his words quoted')
    assert.ok(raw.deliberatelyNotContributed[0].includes('Until this restatement the entry read: "Ordinary Laws of the Game: out-of-play behaviour, restarts, offside, legal actions."'), 'the old reading kept, quoted')
    assert.ok(raw.defaultLaws.restates.startsWith('deliberatelyNotContributed[0]'))
    assert.deepEqual(laws.laws.map(law => [law.id, law.scope]), [['LAW-8', 'GAME'], ['LAW-11', 'GAME'], ['LAW-12-GK', 'GAME'], ['LAW-14', 'PER_END'], ['LAW-16', 'PER_END'], ['LAW-17', 'PER_END']])
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
    refused(b => (b.appliesTo = 'TEST-ONLY'), /carries "appliesTo"/, 'an unknown key')
    refused(b => b.laws.push(copy(b.laws[0])), /LAW-8 is listed twice/, 'a law twice')
    refused(b => (b.laws[0].requires[0].predicate = 'TEST-ONLY'), /none of OBJECT_OF_KIND_AT_END/, 'a predicate outside the closed list')
    refused(b => (b.laws[3].applicableWhen[0].row = 'P3'), /does not take/, 'an argument the predicate does not take')
    refused(b => (b.laws[3].applicableWhen[0].kind = 'TEST-ONLY'), /no member of the register's object-kind vocabulary/, 'an object kind outside the vocabulary')
    refused(b => (b.laws[2].applicableWhen[0].row = 'P2'), /no specialized performer row/, 'a row that is no specialized performer')
    refused(b => (b.authority.words = []), /must quote his words/, 'no words of his')
    refused(b => delete b.edition, /does not say none is named/, 'an edition neither named nor null')
    refused(b => (b.laws[5].applicableWhen = []), /needs nothing to apply/, 'a law needing nothing')
    refused(b => (b.laws[1].scope = 'PER_BLOCK'), /none of GAME, PER_END/, 'a scope outside the list')
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
    assert.deepEqual(recorded, [
        ['A01-R1-T1-3', [['LAW-16', 'PART', null]]],
        ['A01-R1-T2-1', [['LAW-8', 'WHOLE', null]]],
        ['A01-R1-T4-3', [['LAW-16', 'WHOLE', 'OBJECT_OF_KIND_AT_END'], ['LAW-17', 'WHOLE', 'OBJECT_OF_KIND_AT_END']]],
        ['A01-R1-T5-3', [['LAW-16', 'WHOLE', 'OBJECT_OF_KIND_AT_END'], ['LAW-17', 'WHOLE', 'OBJECT_OF_KIND_AT_END']]],
    ])
    // His words, verbatim, where he said them.
    const t13 = r1.items.find((item: any) => item.id === 'A01-R1-T1-3').departsFrom[0]
    assert.ok(t13.basis.words.includes("Shots going out: The coach may conclude the episode and restart the goalkeeper's build-out under the already authorized activity structure. We do not need an additional scoring mechanism."))
    assert.equal(t13.basis.citedAs, 'his reply filed 26 October 2026, item 11; his reply filed 18 October 2026, item 2')
    assert.ok(r1.items.find((item: any) => item.id === 'A01-R1-T2-1').departsFrom[0].basis.words.includes('The coach initiating a new goalkeeper build-out after a completed episode.'))
    // A01-R2 records none of its own; it keeps all four.
    assert.ok(!raw.realizations.find((r: any) => r.id === R2).items.some((item: any) => item.departsFrom))
    const loaded = loadProvisionalRealizations()
    const of = (id: string) => loaded.find(r => r.provisionalId === id)!
    assert.deepEqual([of(R1).defaultLawsCheck!.mode, of(R2).defaultLawsCheck!.mode], ['REPORT', 'ENFORCE'])
    assert.deepEqual(of(R2).items.filter(item => item.departsFrom).map(item => item.itemId), ['A01-R1-T1-3', 'A01-R1-T2-1', 'A01-R1-T4-3', 'A01-R1-T5-3'])
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
    refused(f => delete departure(f, 'A01-R1-T1-3')[0].part, /does not say which part/, 'a part not named')
    refused(f => (departure(f, 'A01-R1-T4-3')[0].whilePreconditionAbsent = { predicate: 'SPECIALIZED_PERFORMER_PRESENT', row: 'P3' }), /rests on the absence of a precondition LAW-16 does not have/, 'a condition not the law\'s own')
    refused(f => (departure(f, 'A01-R1-T4-3')[0].extent = 'MOST'), /none of WHOLE, PART/, 'an extent outside the list')
    refused(f => (departure(f, 'A01-R1-T2-1')[0].appliesTo = 'TEST-ONLY'), /carries "appliesTo"/, 'an unknown key')
    refused(f => (f.realizations.find((r: any) => r.id === R2).defaultLawsCheck.mode = 'WARN'), /none of ENFORCE, REPORT \(there is no default\)/, 'a strictness outside the list')
    refused(f => delete f.realizations.find((r: any) => r.id === R1).defaultLawsCheck, /records departures from the normal laws \(A01-R1-T1-3, A01-R1-T2-1, A01-R1-T4-3, A01-R1-T5-3\) and declares no default-laws check/, 'departures nothing reads')
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

test('A01-R1 at 12/1, 12/2 and 11/1, REPORT: LAW-8 departed, LAW-11 and LAW-12-GK owed, LAW-14/16/17 not applicable at both ends; served', () => {
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
                    assert.deepEqual(items(entry.recordedBy), law === 'LAW-14' ? [] : ['A01-R1-T4-3', 'A01-R1-T5-3'], `${label} ${law} ${end}: the end-line restarts recorded`)
                }
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

test('the TEST-ONLY goal copy: LAW-17 owed at the goal end, not applicable at the other; LAW-16 owed and partly departed from; in both blocks', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const served = goalBuild(players, keepers, REPORT).activity as ServedActivity
        assert.equal(served.outcome, 'served', label)
        const account = served.evidence!.defaultLaws!
        assert.equal(account.realization, R2)
        for (const at of [0, 1]) {
            // The goal stands on the end line at 0 m in both blocks, defended by the team holding the building role (the ends exchanged).
            assert.deepEqual(account.blocks[at].ends.map(end => [end.atM, end.defendedBy[0]]), [[0, 'ROLE_HOLDER_BUILDING'], [40, 'ROLE_HOLDER_PRESSING']], label)
            const corner = statusOf(account, at, 'LAW-17')
            assert.deepEqual([corner.end0.status, corner.end1.status], ['ADAPTATION_OWED', 'NOT_APPLICABLE'], label)
            assert.deepEqual(items(corner.end0.noLongerHolds), ['A01-R1-T4-3', 'A01-R1-T5-3'], `${label}: the kept end-line restarts' reason is false at the goal end (X5)`)
            assert.deepEqual(items(corner.end1.recordedBy), ['A01-R1-T4-3', 'A01-R1-T5-3'])
            const kick = statusOf(account, at, 'LAW-16')
            assert.deepEqual([kick.end0.status, items(kick.end0.departedInPart), items(kick.end0.noLongerHolds)], ['ADAPTATION_OWED', ['A01-R1-T1-3'], ['A01-R1-T4-3', 'A01-R1-T5-3']], label)
            assert.ok(kick.end0.why.endsWith('A01-R1-T1-3 departs from part of it'), kick.end0.why)
            assert.equal(kick.end0.departedInPart[0].part, 'a shot that goes over the end line a goal stands on, when the coach concludes the episode')
            assert.equal(kick.end1.status, 'NOT_APPLICABLE')
            const penalty = statusOf(account, at, 'LAW-14')
            assert.deepEqual([penalty.end0.status, penalty.end1.status], ['ADAPTATION_OWED', 'NOT_APPLICABLE'], label)
            assert.deepEqual([statusOf(account, at, 'LAW-8').game.status, statusOf(account, at, 'LAW-11').game.status, statusOf(account, at, 'LAW-12-GK').game.status], ['DEPARTED', 'ADAPTATION_OWED', 'ADAPTATION_OWED'])
        }
        assert.equal(account.owed.length, 10, `${label}: five laws owed in each block`)
    }
})

test('under the ENFORCE it records, the goal copy (its two decisions completed only) is refused at validation, each law named, never falling back', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const refused = goalBuild(players, keepers).activity as RefusedActivity
        assert.deepEqual([refused.outcome, refused.stage], ['refused', 'validation'], label)
        assert.equal(refused.summary, "Where this activity departs from the sport's normal rules has not all been decided yet, so it is not being shown.")
        assert.equal(refused.reasons[0], `the provisional realization ${R2} holds its activity to the normal laws (ENFORCE), and 10 adaptations are owed`)
        for (const law of ['LAW-11', 'LAW-12-GK', 'LAW-14', 'LAW-16', 'LAW-17']) assert.equal(refused.reasons.filter(reason => reason.includes(`: ${law} (`)).length, 2, `${label} ${law}: named in both blocks`)
        assert.ok(!refused.reasons.some(reason => reason.includes('LAW-8 (')), 'the departed law is not owed')
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
    const partOnly = accountWith(lawsWith({ id: 'LAW-16', cites: 'TEST-ONLY', name: 'TEST-ONLY', scope: 'PER_END', applicableWhen: [{ predicate: 'OBJECT_OF_KIND_AT_END', kind: 'goal' }], requires: [], note: null }), block.fixture.game, r2.items.filter(item => item.itemId === 'A01-R1-T1-3'))
    assert.deepEqual([partOnly.laws[0].status, items(partOnly.laws[0].departedInPart)], ['APPLIES', ['A01-R1-T1-3']])
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
    // The end-line restarts without the condition they rest on: at the goal end they depart from LAW-17 as recorded, and it is DEPARTED.
    const unconditioned = goalBuild(12, 1, file => {
        REPORT(file)
        for (const id of ['A01-R1-T4-3', 'A01-R1-T5-3']) for (const departure of file.realizations.find((r: any) => r.id === R1).items.find((item: any) => item.id === id).departsFrom) delete departure.whilePreconditionAbsent
    }).activity as ServedActivity
    const corner = statusOf(unconditioned.evidence!.defaultLaws!, 0, 'LAW-17')
    assert.deepEqual([corner.end0.status, items(corner.end0.departedBy), corner.end1.status], ['DEPARTED', ['A01-R1-T4-3', 'A01-R1-T5-3'], 'NOT_APPLICABLE'])
})

console.log(`default-laws.unit.ts — ${passed} passed`)
