/**
 * Composing from the TEST-ONLY draft store, read at the build's own answer (B2, 28 October 2026; E1-lite and one shared ball). A projection is
 * proved only by a consumer, so every carry below is read where the build hands it back: `buildActivityUnderAuthorizationRecords` given the
 * real store of `docs/audits/drafts/ta02-composition/` (the RPC-003 Attack Development draft and the TA02 draft record), with no in-memory
 * loader patch and no TEST-ONLY record. His reply filed 30 October 2026, item 1: *"I agree that the current Attack Development context doesn't
 * adequately represent this moment, because it begins after organized possession has already been established."* So nothing here tries to
 * make TA02 compose: these builds are measurements of the engine, and every one of them
 * that is served or near-served carries a TEST-ONLY stand-in labelled so.
 *
 * What is pinned:
 *   - the store is the only door: without it TA02 is refused as in production (its context has no contract);
 *   - as drafted (probe-k1-final U1, now with RPC-003-04.a withdrawn): refused at structure on the same two lines, waiting on him;
 *   - with the proposed rulings PR-1 and PR-2 as TEST-ONLY stand-ins, the origin withheld and NO identification (probe-k1-final D9 on the
 *     goal's path): ONE ball in the game, the playing environment's, and refused only for want of his approved wording on the conditions; no
 *     longer for a second ball;
 *   - the same over a TEST-ONLY copy with RPC-003-04.a reinstated: refused at validation, the second ball named (the guard);
 *   - the draft account: an element resting on a draft item shows DRAFT, never APPROVED alone; every draft item is a DRAFT source; the draft
 *     narrowing of the primary event's kind (an open line a choice closes) is a DRAFT source of that element; the draft declarations listed;
 *     the context's contract marked DRAFT; derivation's provenance stamp says `draft`; the review draft's sentences name their DRAFT sources,
 *     including (B2 review, on a constructed fixture) a count a draft item decided and an element instantiated to satisfy one;
 *   - a production build carries none of these keys.
 *
 * B4 (28 October 2026): the sport's Laws check now holds the draft composition. Under our DRAFT classification (LAW-11 MATERIAL, LAW-8
 * PROCEDURAL) the U2 build is refused at validation, naming LAW-11 and reporting LAW-8; the B2 measurement above is made under a TEST-ONLY
 * stand-in classifying LAW-11 PROCEDURAL, where both laws are reported and nothing else changes.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadSportEnvironmentElements } from '../derivation/corpus'
import { LawsMateriality } from '../derivation/default-laws'
import { DRAFTS_DIR, loadDraftStore, loadLawsMateriality } from '../derivation/draft-store'
import { runDerivation } from '../derivation/engine'
import { derivationInputFor } from '../derivation/run-bounded-selection'
import { DRAFT_KNOWLEDGE } from '../derivation/types'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity } from './build-activity'
import { reviewDraftOf } from './review-draft'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}

const store = loadDraftStore('ta02-composition')
const roles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles }
const records = learningGoalAuthorizations()
const environment = loadSportEnvironmentElements()!
const ENVIRONMENT_ELEMENT = `c:${environment.contractId}:${environment.elements[0].item}`
const draftItems = new Set(store.contracts.flatMap(contract => contract.items.map(item => `${contract.contractId}::${item.itemId}`)))

/* TEST-ONLY stand-ins for his proposed rulings, applied to the derivation input's copy exactly as probe-k1-final applied them: NOT his. */
const rpc003 = (contracts: any[]) => contracts.find(contract => contract.contractId === 'restated:RPC-003')
const PR1 = (contracts: any[]) => {
    rpc003(contracts).items.find((item: any) => item.itemId === 'RPC-003-11.b').value = { objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored: 'TEST-ONLY PR-1: not his ruling' }
}
const PR2 = (contracts: any[]) => {
    rpc003(contracts).items.push({
        itemId: 'RPC-003-12.c', origId: 'RPC-003-12', row: 'V5', selector: 'type=control', requirement: 'EQUALS',
        value: { objectiveReferenceOf: 'SCORING_TEAM', role: 'PRIMARY_SCORING', asAuthored: 'TEST-ONLY PR-2: not his ruling' },
        strictness: 'REQUIRED', valueStatus: 'REQUIRED_RANGE', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', basisEvidence: 'TEST-ONLY PR-2: not his ruling',
        checkability: 'PARTLY_STRUCTURAL', structuralClause: 'TEST-ONLY', fitNote: 'TEST-ONLY PR-2', category: DRAFT_KNOWLEDGE,
    })
}
const withoutOrigin = (contracts: any[]) => {
    rpc003(contracts).items = rpc003(contracts).items.filter((item: any) => !['RPC-003-10.a', 'RPC-003-10.b'].includes(item.itemId))
}
const U2_NO_IDENTIFICATION = (contracts: any[]) => [PR1, PR2, withoutOrigin].forEach(step => step(contracts))
const build = (drafts: typeof store | undefined, alter?: (contracts: any[]) => void, lawsMateriality?: LawsMateriality) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'TA02', session }, records, { ...(drafts ? { drafts } : {}), review: { includeDrafts: true }, ...(alter ? { alter } : {}), ...(lawsMateriality ? { lawsMateriality } : {}) })
/**
 * B4 (28 October 2026): the sport's Laws check holds a composed activity (his reply filed 30 October 2026, item 4). Our DRAFT classification
 * reads LAW-11 as MATERIAL, so TA02's draft composition owing it is refused at validation before its wording is reached. To keep the B2
 * measurement (one ball; refused only for his wording), the build is also made under this TEST-ONLY copy with LAW-11 PROCEDURAL, a stand-in
 * for a ruling of his on it for this environment that he has not made: not our reading and not his.
 */
const ourMateriality = loadLawsMateriality()
const LAW_11_PROCEDURAL: LawsMateriality = {
    ...ourMateriality,
    file: 'TEST-ONLY',
    standing: 'DRAFT - TEST-ONLY stand-in, LAW-11 PROCEDURAL: neither our reading nor his',
    classifications: ourMateriality.classifications.map(entry => (entry.law === 'LAW-11' ? { ...entry, materiality: 'PROCEDURAL' as const, ourReading: 'TEST-ONLY stand-in.' } : entry)),
}

/* ── The store is the only door ───────────────────────────────────────────────────────────────────────────────────────────── */
{
    const without = build(undefined).activity as RefusedActivity
    assert.equal(without.outcome, 'refused')
    assert.equal(without.stage, 'knowledge', 'without the store, its context has no contract, as in production')
    assert.equal(without.draftKnowledge, undefined)
}

/* ── As drafted: refused at structure, on the two lines that wait on him ─────────────────────────────────────────────────── */
{
    const built = build(store)
    const activity = built.activity as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'structure')
    assert.ok(activity.reasons.includes('2 unresolved properties are neither an authorized choice nor an authorized claim: c:restated:RPC-003:RPC-003-12.a::V5, c:restated:RPC-003:RPC-003-10.a::V6'), activity.reasons.join(' | '))
    assert.deepEqual(activity.account.context?.contract, 'DRAFT', 'the draft context is marked so, beside inThisActivity')
    const account = activity.draftKnowledge!
    assert.equal(account.status, 'BUILT_FROM_DRAFT_KNOWLEDGE_NOT_APPROVED')
    assert.deepEqual(account.records, ['TA02'])
    assert.deepEqual(account.store.files, store.files)
    assert.deepEqual(account.contracts.map(contract => contract.contractId), ['restated:RPC-003'])
    assert.equal(account.elements, null, 'no game was assembled')
    // The draft declarations of the derivation input, each listed: a declaration can resolve lines on another contract's elements.
    assert.equal(account.declarations.length, store.contracts[0].declarations.length)
    const ball = account.declarations.find(declaration => declaration.row === 'O1' && declaration.declaration === 'CLAIMED')!
    assert.ok(ball.note!.includes('RPC-003-04.a was withdrawn'), ball.note!)
    // Derivation's provenance stamp says the context's knowledge is the draft.
    const input = derivationInputFor(built.selection!)
    assert.deepEqual(input.selection.filter(entry => entry.knowledgeVersion !== 'stage-b'), [{ objectId: 'RPC-003', knowledgeVersion: 'draft' }])
    const versions = (runDerivation({ ...input, envelope: { ...session, roles: { ...roles } } } as any) as any).versions
    assert.ok(versions.objects.some((entry: any) => entry.id === 'RPC-003' && entry.version === 'draft'))
}

/* ── B4: the same build under our DRAFT classification of the laws: refused at validation, LAW-11 material, LAW-8 reported ─── */
{
    const activity = build(store, U2_NO_IDENTIFICATION, ourMateriality).activity as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'validation', activity.reasons.join(' | '))
    assert.deepEqual(activity.reasons.map(reason => reason.split(' - ')[0]), [
        "the sport's default-laws check (BY_MATERIALITY, his reply filed 30 October 2026, item 4) holds this composed activity: 1 material adaptation is owed, which prevents approval",
        'LAW-11 (Law 11 (Offside)) at the game: an adaptation is owed',
        'reported for review, not refused: LAW-8 (Law 8 (The Start and Restart of Play), the kick-off) at the game: an adaptation is owed',
    ])
    assert.deepEqual(activity.lawsCheck!.materiality!.classifiedBy, { file: ourMateriality.file, standing: ourMateriality.standing })
}

/* ── PR-1 + PR-2 as TEST-ONLY stand-ins, origin withheld, NO identification: one ball, refused only for his wording ───────── */
{
    // B4: under the TEST-ONLY stand-in classifying LAW-11 PROCEDURAL, so the sport's check refuses nothing and reports both laws.
    const built = build(store, U2_NO_IDENTIFICATION, LAW_11_PROCEDURAL)
    const activity = built.activity as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'communication')
    assert.deepEqual(activity.lawsCheck!.materiality!.reportedForReview.map(sentence => sentence.split(' ')[0]), ['LAW-8', 'LAW-11'])
    assert.deepEqual(activity.lawsCheck!.materiality!.material, [])
    // Exactly the six fields of the two conditions awaiting his approved wording, and fidelity's six on the same fields; nothing else.
    const conditions = ['RPC-003-11.a', 'RPC-003-12.a'].flatMap(id => ['type', 'referents', 'value'].map(leaf => `value.primaryEvent.conditions[c:restated:RPC-003:${id}].${leaf}`))
    assert.equal(activity.reasons.length, 12, activity.reasons.join(' | '))
    for (const field of conditions) {
        assert.ok(activity.reasons.some(reason => reason.startsWith(`awaiting approved wording: ${field} (`)), field)
        assert.ok(activity.reasons.includes(`fidelity Q3: ${field} is established by the game and no instruction carries it`), field)
    }
    assert.ok(!activity.reasons.some(reason => reason.includes('objects[')), 'no longer refused for a second ball (probe-k1-final D9 named the environment ball, said by no instruction)')
    // One ball: the playing environment's, and no element of the context's own in its collection.
    const objects: any[] = (built.fixture as any).game.objects
    const own = objects.find(object => object.elementId === ENVIRONMENT_ELEMENT)
    assert.ok(own, 'the environment element is in the game')
    assert.deepEqual(objects.filter(object => JSON.stringify(object.selector) === JSON.stringify(own.selector)).map(object => object.elementId), [ENVIRONMENT_ELEMENT])
    assert.ok(!objects.some(object => String(object.elementId).includes('RPC-003')), 'the context establishes no object of its own')
    assert.equal((built.fixture as any).record.satisfiedByEstablished, undefined, 'and no identification was needed')

    // The draft account, graded as the review evidence grades it.
    const elements = activity.draftKnowledge!.elements!
    assert.ok(elements.length > 0)
    for (const element of elements) {
        for (const source of element.sources) {
            if (draftItems.has(source.ref) || source.ref === 'restated:RPC-003::RPC-003-12.c') assert.equal(source.standing, 'DRAFT', `${element.path}: ${source.ref} is a draft item`)
        }
        if (element.sources.some(source => source.standing === 'DRAFT')) assert.equal(element.standings[0], 'DRAFT', `${element.path}: DRAFT leads its standings`)
    }
    const condition = elements.find(element => element.path === 'value.primaryEvent.conditions[c:restated:RPC-003:RPC-003-11.a].type')!
    assert.deepEqual(condition.standings, ['DRAFT', 'GAP'], 'an AUTHORED draft item is DRAFT, never APPROVED')
    assert.ok(condition.sources.some(source => source.ref === 'restated:RPC-003::RPC-003-11.a' && source.detail === 'DRAFT knowledge awaiting his review (drafted with basis AUTHORED)'))
    // The draft narrowing of an open line a choice closes (the primary event's kind, closed by the game form's choice under SD-39).
    const kind = elements.find(element => element.path === 'value.primaryEvent.kind')!
    assert.ok(kind.standings.includes('DRAFT') && kind.standings.includes('APPROVED'), JSON.stringify(kind.standings))
    assert.ok(kind.sources.some(source => source.standing === 'DRAFT' && source.ref === 'restated:RPC-003::RPC-003-03.a'), JSON.stringify(kind.sources))
    const choice = ((built.fixture as any).status.choices as any[]).find(entry => entry.path === 'value.primaryEvent.kind')
    assert.ok(choice.draftShapedBy.some((ref: any) => ref.itemId === 'RPC-003-03.a' && ref.category === DRAFT_KNOWLEDGE), 'carried from emit through realization onto the choice')
    // The review draft: a sentence resting on draft knowledge names it, apart from his provisional choices.
    const score = activity.draft!.instructions.find(instruction => instruction.section === 'How to score' && (instruction.draftSources ?? []).length)!
    assert.ok(score.draftSources!.includes('restated:RPC-003::RPC-003-03.a'), JSON.stringify(score))
    assert.ok(!score.provisionalSources.some(source => source.includes('RPC-003')))
}

/* ── RPC-003-04.a reinstated in a TEST-ONLY copy: a second ball, named before communication ───────────────────────────────── */
{
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2-two-balls-'))
    const real = path.join(DRAFTS_DIR, 'ta02-composition')
    for (const name of fs.readdirSync(real).filter(n => n.endsWith('.DRAFT.json'))) fs.copyFileSync(path.join(real, name), path.join(dir, name))
    const file = path.join(dir, 'rpc-003-contract.DRAFT.json')
    const draft = JSON.parse(fs.readFileSync(file, 'utf8'))
    draft.contractEntry.result.items.push(draft.withdrawnItems[0].item)
    fs.writeFileSync(file, JSON.stringify(draft, null, 2) + '\n')
    const activity = build(loadDraftStore(dir), U2_NO_IDENTIFICATION).activity as RefusedActivity
    assert.equal(activity.outcome, 'refused')
    assert.equal(activity.stage, 'validation', activity.reasons.join(' | '))
    assert.ok(activity.reasons.some(reason => reason.startsWith('objects[c:restated:RPC-003:RPC-003-04.a] is a second element where the playing environment already has one') && reason.includes(ENVIRONMENT_ELEMENT)), activity.reasons.join(' | '))
}

/* ── The review draft reads an entailment and an instantiation a draft item decided (B2 review), on a constructed fixture ───── */
{
    // An entailment and an instantiation carry only the items that decided them, never their category, so the contracts say which are drafts.
    const contracts = [{ contractId: 'restated:TEST-ONLY', items: [{ itemId: 'T-1', category: DRAFT_KNOWLEDGE }, { itemId: 'T-2', category: DRAFT_KNOWLEDGE }, { itemId: 'T-3' }] }]
    const fixture = {
        game: {},
        status: {
            entailed: [{ collection: 'teams', leaf: 'count', supportedBy: [{ contractId: 'restated:TEST-ONLY', itemId: 'T-1' }, { contractId: 'restated:TEST-ONLY', itemId: 'T-3' }] }],
            instantiations: [{ handle: 'zone-1', satisfies: 'c:restated:TEST-ONLY:T-2#1' }],
        },
    }
    const rendered = {
        instructions: [
            { section: 'TEST-ONLY', text: 'TEST-ONLY count', from: ['teams[].count'] },
            { section: 'TEST-ONLY', text: 'TEST-ONLY zone', from: ['objects[zone-1].width'] },
            { section: 'TEST-ONLY', text: 'TEST-ONLY other', from: ['field.length'] },
        ],
        withheld: [],
    } as any
    assert.deepEqual(
        reviewDraftOf([fixture], rendered, [], contracts).instructions.map(instruction => instruction.draftSources),
        [['restated:TEST-ONLY::T-1'], ['restated:TEST-ONLY::T-2'], undefined],
        'a count a draft item decided, and an element instantiated to satisfy one, name it; an approved item does not',
    )
    assert.deepEqual(
        reviewDraftOf([fixture], rendered, []).instructions.map(instruction => instruction.draftSources),
        [undefined, undefined, undefined],
    )
}

/* ── A production build carries none of it ───────────────────────────────────────────────────────────────────────────────── */
{
    const keeper = specializedRoleNames().find(role => /goal/i.test(role))!
    const served: any = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', session: { ...session, roles: { ...roles, [keeper]: 1 }, objects: { goal: { count: 0 } } } }, { includeDrafts: true })
    assert.equal(served.outcome, 'served')
    const text = JSON.stringify(served)
    for (const key of ['draftKnowledge', 'draftShapedBy', 'draftSources', DRAFT_KNOWLEDGE, 'lawsCheck', 'laws-materiality']) assert.ok(!text.includes(key), `no ${key} in a production answer`)
    assert.equal(served.account.context.contract, undefined)
    assert.ok(!served.evidence.provenance.elements.some((element: any) => element.standings.includes('DRAFT')))
}

console.log = quiet
console.log('draft-composition unit tests: all cases passed.')
