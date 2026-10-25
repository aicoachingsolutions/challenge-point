/**
 * **The status notice beside an activity the checked pathway did not build** — the live-app status notice, 25 October 2026. Christian, reply
 * filed 26 October 2026, item 9(a): *"The live application should use checked generation whenever an activity has an evaluated,
 * knowledge-authorized design."* *"Other Learning Goals may continue through their existing pathway during this transitional period, provided
 * their status and limitations are not misrepresented."*
 *
 * Pinned here:
 *   1. the words are DRAFT wording data (`draft-coach-wording.json` notCheckedNotice) with his words beside them, and the loader validates the
 *      entry: a damaged TEST-ONLY copy is refused and the file then loads as no wording at all (fail-closed, as for every entry);
 *   2. the notice follows the PATHWAY and nothing else: a stored activity recorded as CHECKED_CHAIN has none, every other one has it, an
 *      activity saved before this notice (which records no pathway) included; a read adds it beside the stored fields and changes nothing
 *      else, and no update writes it;
 *   3. the live route: both of the generation route's served responses carry it, the checked pathway's does not, and every read of a stored
 *      activity carries it by its pathway (the route's own source, as live-activity.unit.ts reads it);
 *   4. no word of it is written in a back or front source file: the front renders what the server sends.
 * The response bodies themselves are measured through the REAL router on the built bundle (a TEST-ONLY stubbed model, outside the regression
 * snapshot, whose stubbed model answers empty, so its generation keys are refusals and carry no notice).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/pathway-notice.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'
import { DRAFT_COACH_WORDING_FILE, draftCoachWordingLoad, draftCoachWordingLoadOf, draftCoachWordingUnusableBecause } from './draft-coach-wording'
import { CHECKED_CHAIN, editableUpdateOf, notCheckedNotice, READ_ONLY_FIELDS, storedPathwayNotice, withPathwayNotice } from './live-activity'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('the status notice beside an activity the checked pathway did not build (the live-app status notice)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const index = indexRegister(loadRegister())
const file = JSON.parse(fs.readFileSync(DRAFT_COACH_WORDING_FILE, 'utf8'))
const entry = file.notCheckedNotice
const notice = notCheckedNotice()!

test('the shipped wording file loads, DRAFT, and carries the notice with his words for it', () => {
    assert.equal(draftCoachWordingLoad().why, null, 'the file is usable')
    assert.equal(file.status, 'DRAFT', 'every word of the file is DRAFT')
    assert.ok(entry && typeof entry.label === 'string' && typeof entry.words === 'string', 'the entry carries a label and words')
    assert.deepEqual(notice, { label: entry.label, words: entry.words, status: 'DRAFT' }, 'served whole and marked DRAFT')
    assert.equal(entry.basis.citedAs, 'his reply filed 26 October 2026, item 9(a)')
    assert.ok(
        entry.basis.words.includes('Other Learning Goals may continue through their existing pathway during this transitional period, provided their status and limitations are not misrepresented.'),
        'his words for it, verbatim',
    )
    assert.ok(typeof file.entryShape.notCheckedNotice === 'string' && file.about.includes('AMENDED 25 October 2026 (the live-app status notice)'), 'the file says what the entry is and why it was added')
    // Nothing in it claims an approval or a check it has not had.
    for (const text of [entry.label, entry.words]) assert.ok(!/\bapproved\b|\bauthori[sz]ed\b/i.test(text), `claims no approval: ${text}`)
})

test('the loader validates the entry: each damaged TEST-ONLY copy is refused, and the file then loads as no wording at all', () => {
    const damages: [string, (entry: any) => unknown][] = [
        ['a key no such entry holds', e => ({ ...e, approved: true })],
        ['no label', e => ({ words: e.words, basis: e.basis })],
        ['empty words', e => ({ ...e, words: '  ' })],
        ['a slot in the words', e => ({ ...e, words: `${e.words} {team}` })],
        ['a slot in the label', e => ({ ...e, label: '{status}' })],
        ['a stray brace', e => ({ ...e, words: `${e.words} }` })],
        ['no basis', e => ({ label: e.label, words: e.words })],
        ['a basis citing no reply', e => ({ ...e, basis: { words: e.basis.words, citedAs: 'TEST-ONLY' } })],
        ['a basis quoting nothing', e => ({ ...e, basis: { words: [], citedAs: e.basis.citedAs } })],
        ['a list', e => [e]],
        ['a sentence', e => e.words],
    ]
    for (const [what, damage] of damages) {
        const damaged = copy(file)
        damaged.notCheckedNotice = damage(copy(entry))
        const why = draftCoachWordingUnusableBecause(damaged, index)
        assert.ok(why && why.includes('notCheckedNotice'), `${what}: refused, naming the entry (${why})`)
        const load = draftCoachWordingLoadOf(damaged, index)
        assert.ok(load.why, `${what}: the load says why`)
        assert.equal(load.wording.notCheckedNotice, null, `${what}: no notice`)
        assert.deepEqual(load.wording.equipment, [], `${what}: and no other wording either (fail-closed)`)
        assert.equal(notCheckedNotice(load.wording), null, `${what}: nothing is served from it`)
    }
    // The entry is optional, as every later entry is: a file without it loads, and no notice is served from it.
    const without = copy(file)
    delete without.notCheckedNotice
    assert.equal(draftCoachWordingUnusableBecause(without, index), null)
    assert.equal(notCheckedNotice(draftCoachWordingLoadOf(without, index).wording), null)
    // An approval still never belongs in this file.
    assert.match(draftCoachWordingUnusableBecause({ ...copy(file), approval: true }, index) ?? '', /approved-coach-wording\.json/)
})

test('by the recorded pathway alone: CHECKED_CHAIN has no notice; every other stored activity has it, one saved before this notice included', () => {
    assert.equal(storedPathwayNotice({ pathway: CHECKED_CHAIN }), null, 'the checked pathway shows no notice')
    for (const [what, stored] of [
        ['saved before this notice (no pathway recorded)', {}],
        ['a generated activity as it is saved today', { title: 'TEST-ONLY', constraint: 'TEST-ONLY', intent: 'TEST-ONLY' }],
        ['a pathway recorded as undefined', { pathway: undefined }],
        ['a pathway recorded as null', { pathway: null }],
        ['the generation pathway named', { pathway: 'GENERATION' }],
        ['another spelling of the checked pathway', { pathway: 'checked_chain' }],
    ] as [string, Record<string, unknown>][]) {
        assert.deepEqual(storedPathwayNotice(stored), notice, what)
    }
    assert.deepEqual(storedPathwayNotice(null), notice, 'nothing recorded at all')
    assert.deepEqual(storedPathwayNotice(undefined), notice, 'nothing recorded at all')
    const without = draftCoachWordingLoadOf({ ...copy(file), notCheckedNotice: undefined }, index).wording
    assert.equal(storedPathwayNotice({}, without), null, 'no notice where the wording carries none')
})

test('a read serves the activity as stored, with the notice beside an unchecked one only; nothing stored changes and no update writes it', () => {
    const legacy = { _id: 'TEST-ONLY-1', title: 'TEST-ONLY', setup: 'TEST-ONLY', rules: ['TEST-ONLY'], activityStatus: 'inProgress', session: { _id: 'TEST-ONLY-S' } }
    const before = copy(legacy)
    const served = withPathwayNotice(legacy)
    assert.deepEqual(legacy, before, 'the stored copy is not changed')
    assert.deepEqual(served, { ...before, pathwayNotice: notice }, 'every stored field as it was, and the notice beside them')

    const checked = { _id: 'TEST-ONLY-2', title: 'TEST-ONLY', pathway: CHECKED_CHAIN, checkedActivity: { outcome: 'served' }, checkedInputs: { learningGoalId: 'TEST-ONLY' } }
    assert.deepEqual(withPathwayNotice(checked), checked, 'a checked activity is served exactly as stored')
    assert.ok(!('pathwayNotice' in withPathwayNotice(checked)))

    // A notice is never the client's or the store's: a copy carrying one (posted back by the review form, say) is read afresh.
    assert.deepEqual(withPathwayNotice({ ...checked, pathwayNotice: { label: 'TEST-ONLY' } }), checked, 'a checked activity sheds a notice it carries')
    assert.deepEqual(withPathwayNotice({ ...before, pathwayNotice: { label: 'TEST-ONLY' } }), { ...before, pathwayNotice: notice }, 'an unchecked one gets the server\'s')

    assert.deepEqual(READ_ONLY_FIELDS, ['pathwayNotice'])
    const edit = { _id: 'TEST-ONLY-1', title: 'TEST-ONLY edited', pathwayNotice: notice, 'pathwayNotice.label': 'TEST-ONLY', pathway: CHECKED_CHAIN }
    assert.deepEqual(editableUpdateOf(edit), { _id: 'TEST-ONLY-1', title: 'TEST-ONLY edited' }, 'no update writes the notice, nor the pathway it is read from')
})

test('the live route: both served generation responses carry the notice, the checked pathway\'s does not; every read of a stored activity carries it by its pathway', () => {
    // Read with its line endings as git keeps them (a Windows checkout writes CRLF).
    const read = (file: string) => fs.readFileSync(path.join(__dirname, file), 'utf8').split('\r\n').join('\n')
    const routes = read('../../routes/app.routes.ts')
    const start = routes.indexOf('router.post(`${ROUTES.generateActivities}/:id`')
    const end = routes.indexOf('\n})\n', start)
    assert.ok(start > 0 && end > start, 'the generation route is found')
    const handler = routes.slice(start, end)
    const checkedStart = handler.indexOf('if (checkedPathway) {')
    const checkedEnd = handler.indexOf("if (livePathwayOf(selection) === CHECKED_CHAIN) throw new Error('a record-backed selection reached the generation pathway')")
    assert.ok(checkedStart > 0 && checkedEnd > checkedStart, 'the checked branch is found')
    assert.ok(!handler.slice(checkedStart, checkedEnd).includes('pathwayNotice'), 'the checked pathway serves no notice')
    // The notice is read once, from the wording data, with no argument: no goal, form or context decides it.
    assert.equal(handler.split('const pathwayNotice = notCheckedNotice()\n').length - 1, 1)
    assert.ok(handler.indexOf('const pathwayNotice = notCheckedNotice()') > checkedEnd, 'read only after the checked pathway has returned')
    // Both 200 responses of the generation route (debug and not) carry it beside their activities.
    // Each response body runs to the line that closes it (a line holding only "})").
    const served = handler.split('return res.status(200).json({').slice(1).map(part => part.slice(0, part.search(/\n\s*\}\)\n/)))
    const generated = served.filter(part => part.includes('activities: compressedActivities'))
    assert.equal(generated.length, 2, 'the generation route serves activities in two places')
    for (const part of generated) assert.ok(part.includes('...(pathwayNotice ? { pathwayNotice } : {}),'), 'each carries the notice')
    assert.equal(handler.split('pathwayNotice').length - 1, 1 + 2 * 2, 'and nowhere else in the route: the read, and the two spreads (two mentions each)')

    // Every read of a stored activity: the activity page (BaseRoutes GET /activity/:id and GET /activity), the session's list and the coach's list.
    assert.ok(routes.includes('    transform: withPathwayNotice,\n})'), 'the activity reads BaseRoutes serves carry it')
    assert.equal(routes.split('activities.map(servedActivity)').length - 1, 2, 'the two list routes carry it')
    const helper = read('../../routes/helper.ts')
    assert.equal(helper.split('transform(excludeProperties(').length - 1, 2, 'both BaseRoutes reads apply it')
})

test('no word of the notice is written in a back or front source file: the front renders what the server sends', () => {
    const roots = [path.join(__dirname, '../..'), path.join(__dirname, '../../../../front/src')]
    const files: string[] = []
    const walk = (dir: string) => {
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name)
            if (fs.statSync(full).isDirectory()) walk(full)
            else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.unit.ts')) files.push(full)
        }
    }
    for (const root of roots) {
        assert.ok(fs.existsSync(root), `${root} exists`)
        walk(root)
    }
    assert.ok(files.some(file => file.endsWith('ActivityGenerator.tsx')) && files.some(file => file.endsWith('live-activity.ts')), 'both sides are read')
    // The label whole, and every run of six words of the notice.
    const words = entry.words.split(' ')
    const runs = [entry.label, ...words.slice(0, words.length - 5).map((_: string, at: number) => words.slice(at, at + 6).join(' '))]
    for (const file of files) {
        const text = fs.readFileSync(file, 'utf8')
        for (const run of runs) assert.ok(!text.includes(run), `${path.basename(file)} writes "${run}"`)
    }
})

console.log(`pathway-notice.unit.ts — ${passed} passed`)
