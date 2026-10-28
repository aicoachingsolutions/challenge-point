/**
 * **The general Laws check for a composed activity, by his materiality distinction** — B4, 28 October 2026 (R8's E4a; the E4 design's
 * section 4.5, built narrowly).
 *
 * Christian, his reply filed 30 October 2026, item 4: *"Material unresolved conflicts affecting the activity's meaning, safety, or
 * structural validity should prevent approval."* *"Minor or nonessential procedural questions may be reported for review without stopping
 * development."* *"We should avoid another extended investigation into every possible [sport] rule before establishing the activity's
 * essential design."* (his noun bracketed for the coupling ratchet; the Sport Profile quotes him whole). And, in the same reply: *"The
 * draft-knowledge separation, specialized restart precedence, and other necessary structural safeguards are appropriate general
 * improvements. However, I don't want them to become another extended development cycle disconnected from the composition test."*
 *
 * What is pinned (each read where a consumer reads it: the build's answer, the loader's copy, the account):
 *   1. the Sport Profile's `defaultLaws.check`: BY_MATERIALITY, his item 4 words exactly and whole, cited as his reply filed 30 October 2026,
 *      item 4; copied by the loader as authored; the block gate refusing a check it cannot read (no default mode, no foreign key, his words);
 *   2. our DRAFT classification (`docs/audits/drafts/laws-materiality.DRAFT.json`): ours, DRAFT, his test quoted exactly as the check quotes
 *      it, every profile law classified as R6 (c3) reads it (LAW-11 and LAW-12-GK MATERIAL, the rest PROCEDURAL); the gate refusing every
 *      defect, including (since the B4 review) a DRAFT standing saying neither OUR READING nor TEST-ONLY, and a test that does not quote both
 *      of his sentences, the material and the procedural; read only by the draft store (a static scan);
 *   3. the plain Directional Possession composition in a TEST-ONLY copy (the TA02 DRAFT record with its context taken out of a copy of the
 *      selection: the game form alone, under a Learning Goal's build), whose account owes LAW-8 and LAW-11 as probe-laws.txt measured:
 *        - nothing classified (as in production): refused at validation, both counted MATERIAL (fail safe);
 *        - our DRAFT classification: refused at validation naming LAW-11; LAW-8 reported for review;
 *        - a TEST-ONLY stand-in with LAW-11 PROCEDURAL: served, both reported, its coach text the game form's own (no account reaches the
 *          renderer: no new coach wording);
 *        - our classification with LAW-11 left out (TEST-ONLY): LAW-11 counts MATERIAL again (the fail-safe default bites);
 *        - a coach's build carries no account, and is refused or served exactly as the administrator's;
 *   4. A01: its realization's own check still wins, its account the same whatever classification is given, never the sport's;
 *   5. every mechanism demonstration: never held (no account, served as before), though the sport's check WOULD refuse each that serves
 *      (measured here on its own game), so the exemption is explicit and load-bearing;
 *   6. the account function's precedence, on one game: a realization's own check, else the sport's for a composition, else none;
 *   7. a TEST-ONLY classification the gate refuses is refused by the build too.
 *
 * Nothing here changes a production file. TEST-ONLY copies are labelled and held in memory.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/realization/default-laws-composition.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadRegister, loadSportBoundRegions, loadSportDefaultLaws, readJson } from '../derivation/corpus'
import { LawsMateriality, lawsMaterialityRefusals, defaultLawsRefusals } from '../derivation/default-laws'
import { DraftStoreRefused, LAWS_MATERIALITY_FILE, loadDraftStore, loadLawsMateriality } from '../derivation/draft-store'
import { indexRegister } from '../derivation/register'
import { buildActivityForReview, buildActivityFromKnowledge, buildActivityUnderAuthorizationRecords, buildActivityWithFixture, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { MECHANISM_DEMONSTRATIONS } from '../rendering/mechanism-demonstrations'
import { specializedRoleNames } from '../rendering/session-envelope'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { defaultLawsAccountOf } from './default-laws-check'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    quiet(`  ok  ${name}`)
}
quiet('the general Laws check for a composed activity (B4)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const laws = loadSportDefaultLaws()!
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none } }

/** His reply filed 30 October 2026, item 4: the sentences the Sport Profile's check quotes, exactly and whole. */
const HIS_ITEM_4 = [
    'For offside and other Laws of the Game adaptations, normal rules remain the starting point, with explicit modifications where necessary.',
    'For the general Laws check, I favor this distinction:',
    "Material unresolved conflicts affecting the activity's meaning, safety, or structural validity should prevent approval.",
    'Minor or nonessential procedural questions may be reported for review without stopping development.',
    "We should avoid another extended investigation into every possible soccer rule before establishing the activity's essential design.",
]
const CITED_AS = 'his reply filed 30 October 2026, item 4'

// ── 1. The sport's check in the Sport Profile ────────────────────────────────────────────────────────────────────────────────────
test("the Sport Profile's check: BY_MATERIALITY, his item 4 words exactly, copied by the loader as authored", () => {
    const raw = readJson(laws.file).defaultLaws.check
    assert.deepEqual(Object.keys(raw), ['mode', 'because', 'basis'])
    assert.deepEqual(laws.check, raw, 'the loader copies the check whole')
    assert.equal(laws.check!.mode, 'BY_MATERIALITY')
    assert.deepEqual(laws.check!.basis, { words: HIS_ITEM_4, citedAs: CITED_AS })
    // Why is ours, and says the classification is not production knowledge.
    assert.ok(laws.check!.because.startsWith('B4, 28 October 2026 (ours'), laws.check!.because)
    assert.ok(laws.check!.because.includes('No classification is held here or anywhere in production knowledge'))
})

test('the block gate refuses a check it cannot read: no default mode, a foreign key, no reason, none of his words; absent is accepted', () => {
    const raw = readJson(laws.file)
    assert.deepEqual(defaultLawsRefusals(raw.defaultLaws, index), [])
    const refused = (alter: (check: any, block: any) => void, pattern: RegExp, what: string) => {
        const damaged = copy(raw)
        alter(damaged.defaultLaws.check, damaged.defaultLaws)
        const errors = defaultLawsRefusals(damaged.defaultLaws, index)
        assert.ok(errors.some(error => pattern.test(error)), `${what}: ${errors.join(' | ')}`)
        assert.throws(() => loadSportDefaultLaws(() => damaged, index), /default-laws block is refused/, what)
    }
    refused(check => (check.mode = 'ENFORCE'), /declares the sport's check "ENFORCE", which is none of BY_MATERIALITY \(there is no default\)/, 'a realization mode')
    refused(check => delete check.mode, /declares the sport's check undefined, which is none of BY_MATERIALITY/, 'no mode')
    refused(check => (check.appliesTo = 'TEST-ONLY'), /declares the sport's check with "appliesTo"/, 'a foreign key')
    refused(check => delete check.because, /without saying why/, 'no reason')
    refused(check => (check.basis.words = []), /its basis quotes none of his words/, 'none of his words')
    refused(check => delete check.basis.citedAs, /does not say where he said them/, 'no citation')
    refused((_check, block) => (block.check = 'BY_MATERIALITY'), /as something other than an object/, 'not an object')
    const without = copy(raw)
    delete without.defaultLaws.check
    assert.equal(loadSportDefaultLaws(() => without, index)!.check, null, 'absent: no check, and no composition is held to one')
})

// ── 2. Our DRAFT classification ──────────────────────────────────────────────────────────────────────────────────────────────────
const ours = loadLawsMateriality()
const R6_READING: [string, string][] = [
    ['LAW-8', 'PROCEDURAL'],
    ['LAW-8-DB', 'PROCEDURAL'],
    ['LAW-11', 'MATERIAL'],
    ['LAW-12-GK', 'MATERIAL'],
    ['LAW-14', 'PROCEDURAL'],
    ['LAW-13', 'PROCEDURAL'],
    ['LAW-15', 'PROCEDURAL'],
    ['LAW-16', 'PROCEDURAL'],
    ['LAW-17', 'PROCEDURAL'],
    ['LAW-4-GK', 'PROCEDURAL'],
]
test('our DRAFT classification: ours, DRAFT, his test quoted exactly, every profile law classified as R6 (c3) reads it', () => {
    assert.equal(ours.file, 'docs/audits/drafts/laws-materiality.DRAFT.json')
    assert.ok(ours.standing.startsWith('DRAFT - OUR READING') && ours.standing.includes('not his classification') && ours.standing.includes('not production knowledge'), ours.standing)
    assert.ok(ours.readBy.includes('no production module imports'), ours.readBy)
    assert.deepEqual(ours.test, { words: [HIS_ITEM_4[2], HIS_ITEM_4[3]], citedAs: CITED_AS })
    assert.deepEqual(ours.classifications.map(entry => [entry.law, entry.materiality]), R6_READING)
    assert.deepEqual(ours.classifications.map(entry => entry.law), laws.laws.map(law => law.id), 'every law the profile names, in its order')
    for (const entry of ours.classifications) assert.ok(entry.ourReading.length > 40, entry.law)
})

test('the classification gate refuses every defect, and the loader refuses the file whole', () => {
    const raw = JSON.parse(fs.readFileSync(LAWS_MATERIALITY_FILE, 'utf8'))
    assert.deepEqual(lawsMaterialityRefusals(raw, laws), [])
    const refused = (alter: (file: any) => void, pattern: RegExp, what: string, against = laws) => {
        const damaged = copy(raw)
        alter(damaged)
        const errors = lawsMaterialityRefusals(damaged, against)
        assert.ok(errors.some(error => pattern.test(error)), `${what}: ${errors.join(' | ')}`)
    }
    const entry = (file: any, law: string) => file.classifications.find((candidate: any) => candidate.law === law)
    refused(f => (f.standing = 'APPROVED'), /does not stand DRAFT/, 'a standing that is not DRAFT')
    // A DRAFT standing must also say whose reading it is, ours or a test's, so a stand-in never reads as his.
    refused(f => (f.standing = 'DRAFT - approved by him'), /standing says neither OUR READING nor TEST-ONLY, so it could read as his/, 'a DRAFT standing that does not say whose reading it is')
    for (const standing of ['DRAFT - OUR READING, retyped', 'DRAFT - TEST-ONLY stand-in']) assert.deepEqual(lawsMaterialityRefusals({ ...raw, standing }, laws), [], standing)
    refused(f => delete f.readBy, /does not say what reads it/, 'no reader named')
    refused(f => delete f.note, /carries no note of ours/, 'no note')
    refused(f => (f.ruledOn = '2026-10-30'), /the classification carries "ruledOn"/, 'a foreign key')
    refused(f => (f.test.words[0] = f.test.words[0].replace('should prevent approval', 'must prevent approval')), /is not one of the Sport Profile check's words exactly/, 'his test paraphrased')
    refused(f => (f.test.citedAs = 'his reply filed 29 October 2026, item 4'), /cites his words as "his reply filed 30 October 2026, item 4"/, 'his test cited elsewhere')
    refused(f => (f.test.words = []), /its basis quotes none of his words/, 'no test')
    // His test is both of its sentences, the material and the procedural: one of them alone, or a sentence beside them, is not his test.
    refused(f => (f.test.words = [HIS_ITEM_4[2]]), /does not quote his sentence naming PROCEDURAL \("Minor or nonessential procedural questions/, 'only the material sentence of his test')
    refused(f => (f.test.words = [HIS_ITEM_4[3]]), /does not quote his sentence naming MATERIAL \("Material unresolved conflicts/, 'only the procedural sentence of his test')
    {
        const beside = copy(raw)
        beside.test.words = [HIS_ITEM_4[1]]
        const errors = lawsMaterialityRefusals(beside, laws)
        for (const kind of ['MATERIAL', 'PROCEDURAL']) assert.ok(errors.some(error => error.includes(`does not quote his sentence naming ${kind}`)), `a sentence beside his test, for ${kind}: ${errors.join(' | ')}`)
    }
    refused(() => undefined, /the Sport Profile's check quotes no sentence of his naming PROCEDURAL/, 'a profile check without his procedural sentence', {
        ...laws,
        check: { ...laws.check!, basis: { ...laws.check!.basis, words: laws.check!.basis.words.filter(words => words !== HIS_ITEM_4[3]) } },
    })
    // A kind is named as a whole word: a sentence that only contains it inside another word (procedurally) does not name it.
    {
        const inside = 'Anything handled procedurally is noted.'
        const against = { ...laws, check: { ...laws.check!, basis: { ...laws.check!.basis, words: laws.check!.basis.words.map(words => (words === HIS_ITEM_4[3] ? inside : words)) } } }
        refused(f => (f.test.words = [HIS_ITEM_4[2], inside]), /the Sport Profile's check quotes no sentence of his naming PROCEDURAL/, 'a kind named only inside another word', against)
    }
    refused(() => undefined, /the Sport Profile declares no check of the sport to hold it to/, 'a profile declaring no check', { ...laws, check: null })
    refused(f => (entry(f, 'LAW-8').law = 'LAW-99'), /classifies "LAW-99", which is no law the Sport Profile names/, 'a law the profile does not name')
    refused(f => f.classifications.push(copy(entry(f, 'LAW-11'))), /classification LAW-11 is classified twice/, 'a law twice')
    refused(f => (entry(f, 'LAW-11').materiality = 'MINOR'), /is classified "MINOR", which is none of MATERIAL, PROCEDURAL/, 'a kind off the list')
    refused(f => (entry(f, 'LAW-11').ourReading = ''), /gives no reading of ours/, 'no reading of ours')
    refused(f => (entry(f, 'LAW-11').ourReading += ' He said "this is material".'), /our reading quotes something/, 'our reading quoting (straight quotes)')
    refused(f => (entry(f, 'LAW-11').ourReading += ' He said “this is material”.'), /our reading quotes something/, 'our reading quoting (curly quotes)')
    refused(f => (entry(f, 'LAW-11').appliesTo = 'TEST-ONLY'), /classification LAW-11 carries "appliesTo"/, 'a foreign key on a classification')
    refused(f => (f.classifications = []), /classifies no law/, 'no classification')
    // The loader refuses a damaged copy whole, naming it.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b4-materiality-'))
    const file = path.join(dir, 'laws-materiality.DRAFT.json')
    const damaged = copy(raw)
    damaged.classifications[2].materiality = 'MINOR'
    fs.writeFileSync(file, JSON.stringify(damaged, null, 2))
    assert.throws(() => loadLawsMateriality(file), (error: unknown) => error instanceof DraftStoreRefused && error.reasons.some(reason => /classification LAW-11 is classified "MINOR"/.test(reason)))
})

test('read only by the draft store: no other module names the file or its loader', () => {
    const src = path.resolve(__dirname, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name)
            if (fs.statSync(full).isDirectory()) walk(full)
            else if (name.endsWith('.ts') && !name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(src)
    // A read: the loader called, its file constant, or the file's name as a string. (No production module imports the draft store at all:
    // draft-store.unit.ts pins that.)
    const naming = files.filter(file => /loadLawsMateriality\(|LAWS_MATERIALITY_FILE|['"`][^'"`]*laws-materiality\.DRAFT\.json['"`]/.test(fs.readFileSync(file, 'utf8')))
    assert.deepEqual(naming.map(file => path.relative(src, file).split(path.sep).join('/')), ['system/derivation/draft-store.ts'])
})

// ── 3. The plain Directional Possession composition, in a TEST-ONLY copy ─────────────────────────────────────────────────────────
const store = loadDraftStore('ta02-composition')
const records = learningGoalAuthorizations()
/** TEST-ONLY: the TA02 DRAFT record's selection with its context taken out of a copy, so the game is the game form alone. */
const withoutContext = (selection: any) => {
    selection.selected = selection.selected.filter((entry: { role: string }) => entry.role !== 'representative performance context')
}
const composition = (lawsMateriality?: LawsMateriality, includeDrafts = true) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'TA02', session }, records, { drafts: store, alterSelection: withoutContext, review: { includeDrafts }, ...(lawsMateriality ? { lawsMateriality } : {}) })
/** TEST-ONLY stand-in: our classification with LAW-11 PROCEDURAL, for a ruling of his on it for this environment that he has not made. */
const LAW_11_PROCEDURAL: LawsMateriality = {
    ...copy(ours),
    file: 'TEST-ONLY',
    standing: 'DRAFT - TEST-ONLY stand-in, LAW-11 PROCEDURAL: neither our reading nor his',
    classifications: ours.classifications.map(entry => (entry.law === 'LAW-11' ? { ...entry, materiality: 'PROCEDURAL' as const, ourReading: 'TEST-ONLY stand-in.' } : { ...entry })),
}
const lawOf = (sentence: string) => sentence.replace(/^reported for review, not refused: /, '').split(' ')[0]
/** probe-laws.txt (docs/audits/drafts/ta02-composition/evidence), plain GF2: every law and place, as measured on 27 October. */
const PROBE_LAWS: [string, 0 | 1 | null, string][] = [
    ['LAW-8', null, 'ADAPTATION_OWED'],
    ['LAW-8-DB', null, 'APPLIES'],
    ['LAW-11', null, 'ADAPTATION_OWED'],
    ['LAW-12-GK', null, 'NOT_APPLICABLE'],
    ['LAW-14', 0, 'NOT_APPLICABLE'],
    ['LAW-14', 1, 'NOT_APPLICABLE'],
    ['LAW-13', null, 'APPLIES'],
    ['LAW-15', null, 'APPLIES'],
    ['LAW-16', 0, 'NOT_APPLICABLE'],
    ['LAW-16', 1, 'NOT_APPLICABLE'],
    ['LAW-17', 0, 'NOT_APPLICABLE'],
    ['LAW-17', 1, 'NOT_APPLICABLE'],
    ['LAW-4-GK', null, 'NOT_APPLICABLE'],
]

test('the plain Directional Possession composition: the game form alone, owing LAW-8 and LAW-11 as probe-laws.txt measured', () => {
    const built = composition()
    assert.deepEqual(built.selection!.selected.filter(entry => !entry.role.includes('lens')).map(entry => entry.id), ['GF2'], 'the game form alone, no context, no constraint')
    const account = (built.activity as RefusedActivity).lawsCheck!
    assert.deepEqual(account.blocks.flatMap(block => block.laws.map(entry => [entry.law, entry.end, entry.status])), PROBE_LAWS)
    assert.deepEqual(account.owed.map(lawOf), ['LAW-8', 'LAW-11'])
})

test('nothing classified, as in production: refused at validation, LAW-8 and LAW-11 each MATERIAL (fail safe), the account the sport\'s', () => {
    const activity = composition().activity as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'validation')
    assert.equal(activity.summary, "Where this activity departs from the sport's normal rules has not all been decided yet, so it is not being shown.")
    assert.equal(activity.reasons[0], `the sport's default-laws check (BY_MATERIALITY, ${CITED_AS}) holds this composed activity: 2 material adaptations are owed, which prevent approval`)
    assert.deepEqual(activity.reasons.slice(1).map(lawOf), ['LAW-8', 'LAW-11'])
    for (const law of ['LAW-8', 'LAW-11']) assert.ok(activity.reasons.some(reason => reason.startsWith(law) && reason.endsWith(`[MATERIAL: no classification names ${law}, so it counts as material (fail safe)]`)), law)
    const account = activity.lawsCheck!
    assert.deepEqual([account.status, account.declaredBy, account.mode, account.realization, account.heldSentence], ['ACCOUNT_FOR_REVIEW', 'SPORT_PROFILE', 'BY_MATERIALITY', null, null])
    assert.deepEqual(account.check, laws.check, "the check is the Sport Profile's, his words with it")
    assert.deepEqual(account.materiality!.classifiedBy, null)
    assert.deepEqual(account.materiality!.owed.map(entry => [entry.law, entry.materiality, entry.classified, entry.ourReading]), [['LAW-8', 'MATERIAL', false, null], ['LAW-11', 'MATERIAL', false, null]])
    // Each owed entry names the block and place the account owes it at, and its sentence is the account's own owed sentence, kind added.
    assert.deepEqual(
        account.materiality!.owed.map(entry => [entry.blockId, entry.end]),
        account.blocks.flatMap(block => block.laws.filter(entry => entry.status === 'ADAPTATION_OWED').map(entry => [block.blockId, entry.end])),
    )
    account.materiality!.owed.forEach((entry, i) => assert.ok(entry.sentence.startsWith(`${account.owed[i]} [MATERIAL`), entry.sentence))
    assert.deepEqual(account.materiality!.material, activity.reasons.slice(1))
    assert.deepEqual(account.materiality!.reportedForReview, [])
})

test('our DRAFT classification: refused at validation naming LAW-11 (MATERIAL); LAW-8 reported for review (PROCEDURAL), each labelled ours', () => {
    const activity = composition(ours).activity as RefusedActivity
    assert.deepEqual([activity.outcome, activity.stage], ['refused', 'validation'])
    assert.deepEqual(activity.reasons.map(lawOf).slice(1), ['LAW-11', 'LAW-8'])
    assert.ok(activity.reasons[0].includes('1 material adaptation is owed, which prevents approval'), activity.reasons[0])
    assert.ok(activity.reasons[2].startsWith('reported for review, not refused: LAW-8'), activity.reasons[2])
    const materiality = activity.lawsCheck!.materiality!
    assert.deepEqual(materiality.classifiedBy, { file: ours.file, standing: ours.standing })
    const label = `, as classified in ${ours.file}, standing ${ours.standing}]`
    assert.deepEqual(materiality.material.map(lawOf), ['LAW-11'])
    assert.ok(materiality.material[0].endsWith(`[MATERIAL${label}`), materiality.material[0])
    assert.deepEqual(materiality.reportedForReview.map(lawOf), ['LAW-8'])
    assert.ok(materiality.reportedForReview[0].endsWith(`[PROCEDURAL${label}`), materiality.reportedForReview[0])
    // Each owed entry carries our reading from the file, read where the account is read.
    for (const entry of materiality.owed) assert.equal(entry.ourReading, ours.classifications.find(candidate => candidate.law === entry.law)!.ourReading, entry.law)
})

test('a TEST-ONLY stand-in with LAW-11 PROCEDURAL: served, both reported; the coach text is the game form\'s own, no account in it', () => {
    const built = composition(LAW_11_PROCEDURAL)
    const activity = built.activity as ServedActivity
    assert.equal(activity.outcome, 'served', JSON.stringify((built.activity as RefusedActivity).reasons))
    assert.deepEqual(activity.lawsCheck!.materiality!.material, [])
    assert.deepEqual(activity.lawsCheck!.materiality!.reportedForReview.map(lawOf), ['LAW-8', 'LAW-11'])
    // No account reaches the renderer: the fixture carries none, no sentence cites one, and the game is said as the game form alone says it.
    assert.equal((built.fixture as any).defaultLaws, undefined)
    assert.ok(!activity.rendered.instructions.some(instruction => instruction.from.some(path => path.startsWith('defaultLaws'))))
    const demonstration = buildActivityFromKnowledge(['GF2'], session).activity as ServedActivity
    assert.equal(demonstration.outcome, 'served')
    assert.deepEqual(activity.rendered.instructions, demonstration.rendered.instructions, "the same instructions as the game form's, which no check holds")
})

test('the fail-safe default bites: our classification with LAW-11 left out (TEST-ONLY) counts LAW-11 MATERIAL again', () => {
    const leftOut: LawsMateriality = { ...copy(ours), file: 'TEST-ONLY', standing: 'DRAFT - TEST-ONLY copy of ours, LAW-11 left out', classifications: ours.classifications.filter(entry => entry.law !== 'LAW-11') }
    const activity = composition(leftOut).activity as RefusedActivity
    assert.deepEqual([activity.outcome, activity.stage], ['refused', 'validation'])
    const materiality = activity.lawsCheck!.materiality!
    assert.deepEqual(materiality.owed.map(entry => [entry.law, entry.materiality, entry.classified]), [['LAW-8', 'PROCEDURAL', true], ['LAW-11', 'MATERIAL', false]])
    assert.ok(materiality.material[0].endsWith('[MATERIAL: no classification names LAW-11, so it counts as material (fail safe)]'), materiality.material[0])
})

test("a coach's build: no account on its answer, refused or served exactly as the administrator's", () => {
    const refusedForCoach = composition(ours, false).activity as RefusedActivity
    const refusedForAdmin = composition(ours, true).activity as RefusedActivity
    assert.equal(refusedForCoach.lawsCheck, undefined)
    assert.deepEqual([refusedForCoach.stage, refusedForCoach.summary, refusedForCoach.reasons], [refusedForAdmin.stage, refusedForAdmin.summary, refusedForAdmin.reasons])
    const servedForCoach = composition(LAW_11_PROCEDURAL, false).activity as ServedActivity
    assert.equal(servedForCoach.outcome, 'served')
    assert.equal(servedForCoach.lawsCheck, undefined)
    assert.ok(!JSON.stringify(servedForCoach).includes('BY_MATERIALITY'))
})

// ── 4. A01: its realization's own check wins ─────────────────────────────────────────────────────────────────────────────────────
test("A01: its realization's own check still wins; the account is the same whatever classification is given, never the sport's", () => {
    const keeper = specializedRoleNames()[0]
    const request = { kind: 'learning-goal' as const, goalId: 'A01', situationId: null, session: { ...session, roles: { ...none, [keeper]: 1 }, objects: { goal: { count: 0 } } } }
    const plain = buildActivityUnderAuthorizationRecords(request, records, { review: { includeDrafts: true } }).activity as ServedActivity
    const given = buildActivityUnderAuthorizationRecords(request, records, { review: { includeDrafts: true }, lawsMateriality: ours }).activity as ServedActivity
    assert.deepEqual([plain.outcome, given.outcome], ['served', 'served'])
    const account = given.evidence!.defaultLaws!
    assert.deepEqual([account.realization, account.mode, account.declaredBy, account.materiality, account.owed], ['A01-R1', 'ENFORCE', undefined, undefined, []])
    assert.ok(!('declaredBy' in account) && !('materiality' in account), 'the keys are absent, so its account is what it was')
    assert.deepEqual(given.evidence!.defaultLaws, plain.evidence!.defaultLaws)
    assert.deepEqual(given.rendered, plain.rendered)
    assert.equal(given.lawsCheck, undefined)
    const production = buildActivityForReview(request, { includeDrafts: true }) as ServedActivity
    assert.deepEqual(production.evidence!.defaultLaws, plain.evidence!.defaultLaws)
})

// ── 5. Demonstrations are exempt, explicitly ─────────────────────────────────────────────────────────────────────────────────────
test('every mechanism demonstration: never held, served or refused as before; the sport\'s check would refuse each that serves', () => {
    for (const demonstration of MECHANISM_DEMONSTRATIONS) {
        const request = { kind: 'mechanism-demonstration' as const, demonstrationId: demonstration.id, session }
        const reviewed = buildActivityForReview(request, { includeDrafts: true })
        assert.equal(reviewed.lawsCheck, undefined, demonstration.id)
        assert.equal(reviewed.evidence?.defaultLaws, undefined, demonstration.id)
        if (reviewed.outcome !== 'served') {
            assert.notEqual((reviewed as RefusedActivity).stage, 'validation', `${demonstration.id}: not refused by a Laws check`)
            continue
        }
        // Measured on its own game: were a demonstration held as a composition is, nothing classified, it would be refused for LAW-8 and LAW-11.
        const { fixture } = buildActivityWithFixture(request)
        const would = defaultLawsAccountOf({ realization: null, laws, blocks: [{ blockId: 'game', game: (fixture as any).game, roleBlock: null }], index, session, heldSentence: null, boundRegions: loadSportBoundRegions(), composed: { materiality: null } })!
        assert.deepEqual(would.materiality!.material.map(lawOf), ['LAW-8', 'LAW-11'], demonstration.id)
    }
    assert.ok(MECHANISM_DEMONSTRATIONS.filter(demonstration => buildActivityForReview({ kind: 'mechanism-demonstration', demonstrationId: demonstration.id, session }, { includeDrafts: false }).outcome === 'served').length >= 2, 'the two that production serves')
})

// ── 6. The account function's precedence ─────────────────────────────────────────────────────────────────────────────────────────
test("the account's precedence on one game: a realization's own check, else the sport's for a composition, else none", () => {
    const { fixture } = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session })
    const blocks = [{ blockId: 'game', game: (fixture as any).game, roleBlock: null }]
    const of = (realization: any, composed: any, given = laws) => defaultLawsAccountOf({ realization, laws: given, blocks, index, session, heldSentence: null, boundRegions: loadSportBoundRegions(), composed })
    const own = { provisionalId: 'TEST-ONLY-R', items: [], defaultLawsCheck: { mode: 'REPORT' as const, because: 'TEST-ONLY', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } } }
    const withOwn = of(own, { materiality: null })!
    assert.deepEqual([withOwn.realization, withOwn.mode, 'declaredBy' in withOwn, 'materiality' in withOwn], ['TEST-ONLY-R', 'REPORT', false, false], 'its own check wins')
    assert.deepEqual(withOwn, of(own, null), 'and the account is the same as without a composition')
    const withoutOwn = of({ provisionalId: 'TEST-ONLY-R', items: [] }, { materiality: null })!
    assert.deepEqual([withoutOwn.realization, withoutOwn.mode, withoutOwn.declaredBy], ['TEST-ONLY-R', 'BY_MATERIALITY', 'SPORT_PROFILE'], "a realization declaring none: the sport's")
    assert.equal(of(null, null), null, 'not a composition: none')
    assert.equal(of({ provisionalId: 'TEST-ONLY-R', items: [] }, null), null, 'a realization declaring none, not a composition: none')
    assert.equal(of(null, { materiality: null }, { ...laws, check: null }), null, 'a composition, and the sport declares no check: none')
})

// ── 7. A TEST-ONLY classification the gate refuses is refused by the build ───────────────────────────────────────────────────────
test('the build holds a TEST-ONLY classification to the gate the DRAFT file is held to', () => {
    const paraphrased: LawsMateriality = { ...copy(ours), test: { ...ours.test, words: ['Material conflicts should prevent approval.'] } }
    assert.throws(() => composition(paraphrased), /a TEST-ONLY classification of the laws is refused by the gate the DRAFT file is held to: .*is not one of the Sport Profile check's words exactly/)
})

console.log = quiet
quiet(`default-laws-composition.unit.ts — ${passed} passed`)
