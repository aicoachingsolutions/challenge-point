/**
 * The playing environment's elements, and the guard that names a second one (B2, 28 October 2026; `environment-elements.ts`).
 *
 * Christian, his reply filed 30 October 2026, item 6: *"Yes. Attack Development should use one contested ball shared by the context and Game
 * Form."* *"This should be a reusable representation of the actual playing environment, not an additional ball introduced because two
 * knowledge components refer to possession."*
 *
 * What is pinned:
 *   - the Sport Profile's record, as loaded: one element, SPORT-SOCCER-01, with exactly the two components his rulings name, each with his
 *     words verbatim and where they are filed; RPC-001's identification is the one recorded in `realization-choices-rpc-001.json` (unchanged),
 *     and RPC-003's draft establishes no element on that element's row and selector (its own item withdrawn, kept whole);
 *   - the record's loader refuses a damaged copy whole, naming each defect;
 *   - the guard, on constructed games: a second element in the environment element's collection with its authored selector is named; one with
 *     another selector, a game without the environment element, and no record, are not;
 *   - Goalkeeper Build-Out (A01) as served: its identification still applied, and no second element left (the snapshot holds its bytes).
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { loadProvisionalRealizations, loadSportEnvironmentElements, loadSportProfile, readJson } from './corpus'
import { duplicateEnvironmentElements, environmentElementsRefusals, environmentIdentificationRefusals, RecordedIdentification, SportEnvironmentElements } from './environment-elements'
import { AUDITS_DIR } from './knowledge-root'
import { buildActivityUnderAuthorizationRecords } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}

const record = loadSportEnvironmentElements()!
const [profile] = loadSportProfile()

/* ── The record as loaded ─────────────────────────────────────────────────────────────────────────────────────────────────── */
{
    assert.ok(record, 'the Sport Profile carries the record')
    assert.equal(record.contractId, profile.contractId)
    assert.equal(record.elements.length, 1)
    const [element] = record.elements
    assert.equal(element.item, 'SPORT-SOCCER-01')
    assert.ok(profile.items.some(item => item.itemId === element.item && item.requirement === 'EXISTS'), 'the profile item that establishes it')
    assert.deepEqual(
        element.referredToBy.map(referral => [referral.object, referral.how, referral.ruling.citedAs, referral.ruling.words]),
        [
            ['RPC-001', 'IDENTIFIED', 'his reply received 15 October 2026 (his 16 October reply), item 9 point 8', ['8. One ball shared between context and game: Approved.']],
            [
                'RPC-003',
                'REFERS',
                'his reply filed 30 October 2026, item 6',
                [
                    'Yes. Attack Development should use one contested ball shared by the context and Game Form.',
                    'This should be a reusable representation of the actual playing environment, not an additional ball introduced because two knowledge components refer to possession.',
                ],
            ],
        ],
        'only the two components his rulings name, each with his words',
    )
    assert.ok(/NOT decided/.test(record.note), 'the record says its extension to any other context is not decided')

    // B2 review (28 October 2026): every field the loader carries is pinned. The sport is the profile's own; what the element is; and where
    // each reference is recorded, each naming a file the repository holds.
    assert.equal(record.file, 'stage-b/sport-profile-soccer.json')
    assert.equal(record.sportId, readJson(record.file).sportId)
    assert.equal(record.sportId, 'sport.soccer')
    assert.equal(element.what, 'the one contested ball of play; its contest between the participating teams is SPORT-SOCCER-02')
    assert.ok(profile.items.some(item => item.itemId === 'SPORT-SOCCER-02'), 'the contest the element names is an item of the profile')
    assert.deepEqual(
        element.referredToBy.map(referral => referral.where),
        [
            'docs/audits/realization-choices-rpc-001.json, satisfiedByEstablished: c:restated:RPC-001:RPC-001-10.a satisfied by this element (kept as it is)',
            'docs/audits/drafts/ta02-composition/rpc-003-contract.DRAFT.json (DRAFT, not approved knowledge): RPC-003-04.a, its own establishing item, withdrawn on 28 October 2026; RPC-003-04.b, outside the boundary, establishes nothing',
        ],
    )
    const REPO = path.resolve(AUDITS_DIR, '..', '..')
    for (const referral of element.referredToBy) assert.ok(fs.existsSync(path.join(REPO, referral.where.split(/[\s,]/)[0])), `${referral.object}: where names a file the repository holds (${referral.where})`)

    // RPC-001: the identification the record lists is the one recorded, unchanged, for this element.
    const elementId = `c:${record.contractId}:${element.item}`
    const choices = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, 'realization-choices-rpc-001.json'), 'utf8'))
    assert.deepEqual(
        choices.satisfiedByEstablished.map((entry: any) => [entry.classId, entry.satisfiedBy]),
        [['c:restated:RPC-001:RPC-001-10.a', elementId]],
    )
    assert.ok(choices.satisfiedByEstablished[0].ruling.includes(element.referredToBy[0].ruling.words[0].replace(/^8\. /, '')), 'the same ruling')

    // RPC-003: the draft refers to the element and establishes none of its own on its row and selector.
    const environmentItem = profile.items.find(item => item.itemId === element.item)!
    const draft = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, 'drafts/ta02-composition/rpc-003-contract.DRAFT.json'), 'utf8'))
    const establishing = draft.contractEntry.result.items.filter((item: any) => item.row === environmentItem.row && item.selector === environmentItem.selector && item.requirement === 'EXISTS' && item.checkability !== 'OUTSIDE_BOUNDARY')
    assert.deepEqual(establishing, [], 'no establishing item of its own')
    assert.equal(draft.withdrawnItems[0].item.id, 'RPC-003-04.a')
    // B2 review: the draft's O1 [kind=ball] declaration quotes the same ruling; no code checked it, so it is pinned to the record's copy.
    const declaration = draft.contractEntry.result.declarations.find((entry: any) => entry.row === environmentItem.row && entry.selector === environmentItem.selector && entry.declaration === 'CLAIMED')
    assert.deepEqual(declaration.source, element.referredToBy.find(referral => referral.object === 'RPC-003')!.ruling, 'the declaration and the record quote one ruling, word for word')
}

/* ── The record against every identification recorded (B2 review, 28 October 2026) ──────────────────────────────────────── */
{
    // Every realization-choices file: those the index names by knowledge object, and those the provisional realizations name.
    const index = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, 'realization-choices-index.json'), 'utf8')).byKnowledgeObject as Record<string, string>
    const choiceFiles = [...new Set([...Object.values(index), ...loadProvisionalRealizations().flatMap(realization => (realization.realizationChoices ? [realization.realizationChoices] : []))])].sort()
    assert.ok(choiceFiles.includes('realization-choices-rpc-001.json') && choiceFiles.length >= 4, `the files read: ${choiceFiles.join(', ')}`)
    const identifications: RecordedIdentification[] = choiceFiles.flatMap(file =>
        ((JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, file), 'utf8')).satisfiedByEstablished ?? []) as any[]).map(entry => ({ file, classId: String(entry.classId), satisfiedBy: String(entry.satisfiedBy) })),
    )
    assert.deepEqual(environmentIdentificationRefusals(record, identifications), [], 'the record and the recorded identifications agree')

    // On constructed inputs: an identification by a component the record does not list as IDENTIFIED (unlisted, or listed REFERS); an
    // IDENTIFIED entry with no identification behind it; and one whose where names another file.
    const elementId = `c:${record.contractId}:${record.elements[0].item}`
    assert.deepEqual(environmentIdentificationRefusals(record, [...identifications, { file: 'TEST-ONLY.json', classId: 'c:restated:RPC-099:RPC-099-01', satisfiedBy: elementId }]), [
        `TEST-ONLY.json identifies c:restated:RPC-099:RPC-099-01 with ${elementId}, and the environment record does not list RPC-099 as IDENTIFIED with it`,
    ])
    assert.deepEqual(environmentIdentificationRefusals(record, [...identifications, { file: 'TEST-ONLY.json', classId: 'c:restated:RPC-003:RPC-003-04.a', satisfiedBy: elementId }]), [
        `TEST-ONLY.json identifies c:restated:RPC-003:RPC-003-04.a with ${elementId}, and the environment record does not list RPC-003 as IDENTIFIED with it (it lists it as REFERS)`,
    ])
    assert.deepEqual(environmentIdentificationRefusals(record, []), [`the environment record lists RPC-001 as IDENTIFIED with ${elementId}, and no realization-choices file records that identification`])
    assert.deepEqual(
        environmentIdentificationRefusals(
            record,
            identifications.map(entry => ({ ...entry, file: 'TEST-ONLY.json' })),
        ),
        [`the environment record lists RPC-001 as IDENTIFIED with ${elementId}, and its where does not name TEST-ONLY.json, which holds the identification`],
    )
    // An identification of some other element is not this record's concern.
    assert.deepEqual(environmentIdentificationRefusals(record, [...identifications, { file: 'TEST-ONLY.json', classId: 'c:restated:RPC-099:RPC-099-01', satisfiedBy: 'c:TEST-ONLY:OTHER-01' }]), [])
}

/* ── The loader refuses a damaged copy whole ──────────────────────────────────────────────────────────────────────────────── */
{
    const damaged = (edit: (block: any) => void): string => {
        const read = (file: string) => {
            const raw = readJson(file)
            if (raw.environmentElements) edit(raw.environmentElements)
            return raw
        }
        try {
            loadSportEnvironmentElements(read)
        } catch (error) {
            return error instanceof Error ? error.message : String(error)
        }
        return 'LOADED'
    }
    const item = (block: any) => block.elements[0]
    const referral = (block: any) => block.elements[0].referredToBy[1]
    assert.match(damaged(block => (block.extra = 'TEST-ONLY')), /environment-element record is refused: the record: the key extra is not one this record holds/)
    assert.match(damaged(block => (item(block).item = 'SPORT-SOCCER-99')), /names "SPORT-SOCCER-99", which is not an item of the profile/)
    assert.match(damaged(block => (referral(block).ruling.words = [])), /the ruling carries no words of his/)
    assert.match(damaged(block => (referral(block).ruling.citedAs = '')), /the ruling does not say where his words are filed/)
    assert.match(damaged(block => (referral(block).how = 'MERGED')), /how "MERGED" is not one of IDENTIFIED, REFERS/)
    assert.match(damaged(block => (referral(block).object = 'RPC-001')), /names RPC-001 a second time/)
    assert.match(damaged(block => (item(block).referredToBy = [])), /lists no component referring to it/)
    assert.match(damaged(block => delete block.note), /carries no note/)
    assert.equal(damaged(() => undefined), 'LOADED')
    assert.deepEqual(environmentElementsRefusals({ note: 'TEST-ONLY', elements: [] }, ['X']), ['the record lists no element'])
}

/* ── The guard, on constructed games ──────────────────────────────────────────────────────────────────────────────────────── */
{
    const environment = `c:${record.contractId}:${record.elements[0].item}`
    const selector = profile.items.find(item => item.itemId === record.elements[0].item)!.selector
    const game = (objects: unknown[]) => ({ value: { primaryEvent: { kind: 'TEST-ONLY' } }, objects })
    const twin = { elementId: 'c:restated:TEST-ONLY:TEST-ONLY-1', selector }
    const [problem] = duplicateEnvironmentElements(game([{ elementId: environment, selector }, twin]), record)
    assert.ok(problem.startsWith('objects[c:restated:TEST-ONLY:TEST-ONLY-1] is a second element where the playing environment already has one'), problem)
    assert.ok(problem.includes(environment) && problem.includes('RPC-001, IDENTIFIED; RPC-003, REFERS'))
    assert.ok(problem.includes(`${environment} (${record.elements[0].what})`), 'the guard says what the environment element is')
    assert.equal(duplicateEnvironmentElements(game([{ elementId: environment, selector }, twin]), record).length, 1)
    assert.deepEqual(duplicateEnvironmentElements(game([{ elementId: environment, selector }, { ...twin, selector: 'kind=TEST-ONLY' }]), record), [], 'another selector is another element')
    assert.deepEqual(duplicateEnvironmentElements(game([twin, { ...twin, elementId: 'c:restated:TEST-ONLY:TEST-ONLY-2' }]), record), [], 'a game without the environment element')
    assert.deepEqual(duplicateEnvironmentElements(game([{ elementId: environment, selector }, twin]), null), [], 'no record')
    assert.deepEqual(duplicateEnvironmentElements(game([{ elementId: environment, selector }]), record), [])
}

/* ── Goalkeeper Build-Out as served: its identification applied, no second element left ──────────────────────────────────── */
{
    const roles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
    const keeper = specializedRoleNames().find(role => /goal/i.test(role))!
    // The session states no object of the goal version's kind, so the zone version is built (as the review page's own tests state it).
    const built = buildActivityUnderAuthorizationRecords(
        { kind: 'learning-goal', goalId: 'A01', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...roles, [keeper]: 1 }, objects: { goal: { count: 0 } } } },
        learningGoalAuthorizations(),
    )
    assert.equal(built.activity.outcome, 'served', JSON.stringify((built.activity as any).reasons ?? null))
    const fixture: any = built.fixture
    assert.deepEqual(duplicateEnvironmentElements(fixture.game, record), [])
    assert.ok((fixture.record.satisfiedByEstablished ?? []).some((entry: any) => entry.classId === 'c:restated:RPC-001:RPC-001-10.a'), 'its recorded identification is applied, as before')
    assert.equal(built.activity.draftKnowledge, undefined, 'a build without a draft store carries no draft account')
}

console.log = quiet
console.log('environment-elements unit tests: all cases passed.')
