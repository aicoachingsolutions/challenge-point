/**
 * Step 4, component 3 — conditions and information rules said in APPROVED words, or withheld.
 *
 * Christian, 14 October 2026: *"Enable accurate coach-facing communication of scoring conditions and
 * information rules, using approved language."* So the table of approved wording is data he owns, an entry
 * without his approval is never used, and a field no approved sentence covers is withheld — which refuses the
 * activity at communication rather than letting a rule of the game be paraphrased.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
    approvedTemplateSentences,
    approvedWording,
    ApprovedWording,
    canonicalJson,
    fillTemplate,
    FIRST_BLOCK_CHOICE,
    partitionWording,
    POSSESSION_CONTINUES,
    templateUnusableBecause,
    unusableBecause,
    unapprovedTemplateSentences,
    unapprovedWording,
} from './approved-wording'
import { buildActivityWithFixture } from './build-activity'
import { checkFidelity } from './fidelity'
import { renderConcreteGame, wordedFieldRows } from './render-concrete-game'
import { specializedRoleNames } from './session-envelope'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('approved coach wording — Step 4, component 3')

const golden = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json'), 'utf8'))

test('every entry in the table carries his approval — an unapproved one is a data defect', () => {
    assert.deepEqual(unapprovedWording(), [], 'the loader ignores these, and the data must not hold them')
})

/*
 * BASELINE of 14 October 2026: the table was EMPTY, so the first approved sentence would be a visible change to this line.
 * Moved 18 October 2026 (stage M5, design step L13), 0 -> 1: entry A01-W1, his own sentence for the build-out scoring rule. Christian,
 * reply filed 19 October 2026, item 1: "Build-out scoring condition — Approved with revised wording" ... Suggested wording: "Building
 * team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The
 * progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances
 * do not score." The two sentences put to him on 19 October (A01-W2, the regain score; A01-W3, non-restoration) are NOT here: they
 * wait on his yes (design step L14).
 * Moved 18 October 2026 (design step L14), 1 -> 3: his reply filed 20 October 2026. Item 1: "Pressing team's regain score — Approved
 * as written." (entry A01-W2, our draft, his approval); item 2: "Building team's scoring eligibility — Include, with simplified
 * wording." (entry A01-W3, HIS wording, which replaces our draft). "I understand that the remaining coach-facing sentences are still
 * drafts, so this approval applies specifically to the two scoring statements, not yet to the entire activity." The table order is
 * load-bearing (W1 before W3: both cite the building role's bound, and How to score keeps the order they are said in; measured below).
 */
test('BASELINE: three approved entries since 18 October 2026 (design step L14): A01-W1, A01-W2, A01-W3, in that order (was 1 since stage M5, EMPTY since 14 October)', () => {
    assert.equal(approvedWording().length, 3)
    assert.deepEqual(approvedWording().map(e => e.id), ['A01-W1', 'A01-W2', 'A01-W3'])
})

const approval = { who: 'Christian', date: '2026-10-14', quote: 'a test approval, not his words', ccs: 'RC2' }
const entry = (over: Partial<ApprovedWording> & Record<string, unknown> = {}) =>
    ({ id: 'T-ENTRY', covers: [{ row: 'V4', match: { equals: 'progression' } }], sentence: 'A test sentence', section: 'How to score', approvedBy: approval, ...over }) as ApprovedWording

test('an entry without who, a date, a verbatim approval or the standard is ignored, and says why', () => {
    const { approved, unapproved } = partitionWording([
        entry({ id: 'ok' }),
        entry({ id: 'no-approval', approvedBy: undefined as any }),
        entry({ id: 'no-who', approvedBy: { ...approval, who: '' } }),
        entry({ id: 'no-date', approvedBy: { ...approval, date: 'soon' } }),
        entry({ id: 'no-quote', approvedBy: { ...approval, quote: ' ' } }),
        entry({ id: 'no-ccs', approvedBy: { ...approval, ccs: '' } }),
        entry({ id: 'no-cover', covers: [] }),
        entry({ id: 'no-match', covers: [{ row: 'V4', match: {} as any }] }),
        entry({ id: 'bad-section', section: 'Somewhere' as any }),
    ])
    assert.deepEqual(approved.map(e => e.id), ['ok'])
    assert.deepEqual(
        unapproved.map(u => u.id),
        ['no-approval', 'no-who', 'no-date', 'no-quote', 'no-ccs', 'no-cover', 'no-match', 'bad-section'],
    )
    assert.ok(unapproved.every(u => u.why.length > 0))
})

/** The Golden Case with one primary-event condition and one information rule about it added — on a copy. */
const withConditionAndRule = () => {
    const fixture = JSON.parse(JSON.stringify(golden))
    fixture.game.value.primaryEvent.conditions = [{ elementId: 'c:T:T-1', type: 'progression', referents: ['c:restated:GF2:GF2-03.e'], value: 3 }]
    fixture.game.value.informationRules = [{ elementId: 'c:T:T-2', subject: { structuralRef: { contractId: 'T', itemId: 'T-1' } }, trigger: 'STANDING' }]
    return fixture
}

test('the Golden Case holds no condition and no information rule, so nothing is withheld from it', () => {
    const rendered = renderConcreteGame(golden)
    assert.deepEqual(rendered.withheld, [])
})

test('with the table empty, every condition and information-rule field is WITHHELD, by path and row', () => {
    const rendered = renderConcreteGame(withConditionAndRule())
    assert.deepEqual(
        rendered.withheld.map(w => [w.path, w.row, w.reason]),
        [
            ['value.primaryEvent.conditions[c:T:T-1].type', 'V4', 'AWAITING_APPROVED_WORDING'],
            ['value.primaryEvent.conditions[c:T:T-1].referents', 'V5', 'AWAITING_APPROVED_WORDING'],
            ['value.primaryEvent.conditions[c:T:T-1].value', 'V6', 'AWAITING_APPROVED_WORDING'],
            ['value.informationRules[c:T:T-2].subject', 'V16', 'AWAITING_APPROVED_WORDING'],
            ['value.informationRules[c:T:T-2].trigger', 'V17', 'AWAITING_APPROVED_WORDING'],
        ],
    )
    // Nothing is paraphrased in their place.
    assert.deepEqual(renderConcreteGame(withConditionAndRule()).instructions.map(i => i.text), renderConcreteGame(golden).instructions.map(i => i.text))
})

test('an approved entry is said exactly, cites every field it covers, fills its slots only from the element, and says nothing else', () => {
    const wording = [
        entry({
            covers: [
                { row: 'V4', match: { equals: 'progression' } },
                { row: 'V6', match: { equals: 3 } },
            ],
            sentence: 'A test sentence with {count} in it',
            slots: { count: { field: 'value' } },
        }),
        entry({ id: 'T-RULE', covers: [{ row: 'V16', match: { refersToOwnCondition: true } }], sentence: 'A test rule sentence', section: 'How it works' }),
    ]
    const rendered = renderConcreteGame(withConditionAndRule(), wording)
    const said = rendered.instructions.find(i => i.text === 'A test sentence with 3 in it')!
    assert.deepEqual([said.section, said.from, said.quantities], ['How to score', ['value.primaryEvent.conditions[c:T:T-1].type', 'value.primaryEvent.conditions[c:T:T-1].value'], [3]])
    const rule = rendered.instructions.find(i => i.text === 'A test rule sentence')!
    assert.deepEqual(rule.from, ['value.informationRules[c:T:T-2].subject'], 'the subject refers to the condition this game holds')
    // What no entry covered is still withheld.
    assert.deepEqual(rendered.withheld.map(w => w.path), ['value.primaryEvent.conditions[c:T:T-1].referents', 'value.informationRules[c:T:T-2].trigger'])
})

test('a cover that does not hold exactly leaves the field withheld', () => {
    const differentValue = renderConcreteGame(withConditionAndRule(), [entry({ covers: [{ row: 'V6', match: { equals: 4 } }] })])
    assert.ok(differentValue.withheld.some(w => w.path.endsWith('.value')), 'a sentence for 4 is not a sentence for 3')
    const fixture = withConditionAndRule()
    fixture.game.value.informationRules[0].subject = { structuralRef: { contractId: 'T', itemId: 'NOT-A-CONDITION' } }
    const elsewhere = renderConcreteGame(fixture, [entry({ id: 'T-RULE', covers: [{ row: 'V16', match: { refersToOwnCondition: true } }] })])
    assert.ok(elsewhere.withheld.some(w => w.path.endsWith('.subject')), 'a subject that is not one of this game\'s conditions is not covered')
})

/*
 * Stage M3, 17 October 2026 (design step L8): one approved sentence for several elements, said once. Christian, reply filed 19
 * October 2026, item 1: "Approved with revised wording" - one sentence for the build-out scoring rule, which the game holds as the
 * building role's credit bound (B8) and four conditions on the primary event (V3-V6). Read on a block of A01 as the checked pathway
 * built it. Every entry below is TEST-ONLY (approvedBy names TEST-ONLY): the production table stays empty (BASELINE above) until
 * design step L13 writes his entry; the sentence is his item-1 wording verbatim, so the mechanism is exercised on the text it is for.
 * Since stage M5 (18 October 2026) the production table holds his entry A01-W1, so every "with no entry" rendering below passes the
 * empty table ([]) explicitly, which is what the default meant when these tests were written; nothing they assert has moved.
 */
const ROLE = specializedRoleNames()[0]
const noRoles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
// Re-pointed 24 October 2026 (K3, the d27 design's stage K3): A01's session states that it has no goal, so the zone version (A01-R1) is built
// exactly as before. Since K3 A01's record tries the goal version first, and a session that has not said what goals it has is asked first
// (his reply filed 26 October 2026, item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as
// confirmation that no goal exists.").
const a01Session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...noRoles, [ROLE]: 1 }, objects: { goal: { count: 0 } } }
const a01Block: any = (buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: a01Session }).fixture as any).roleBlocks.blocks[0].fixture
const HIS_ITEM_1 =
    "Building team: Score by carrying the ball beyond the marked line or passing to a teammate who receives it under control beyond the line. The progression must begin with the goalkeeper's build-out and occur before the building team loses possession. Uncontrolled clearances do not score."
const TEST_APPROVAL = { who: 'TEST-ONLY', date: '2026-10-19', quote: 'TEST-ONLY', ccs: 'TEST-ONLY' }
const ROLES = 'activityRoles'
const CONDITIONS = 'value.primaryEvent.conditions'
/** A TEST-ONLY located entry covering the building role's bound and every field of every condition, read from the game itself. */
function buildOutEntry(game: any): ApprovedWording {
    const conditions: any[] = game.value.primaryEvent.conditions
    const covers: ApprovedWording['covers'] = [
        { row: 'B8', match: { equals: 'BUILD_OUT_EPISODE' }, element: { base: ROLES, field: 'activityRole', equals: 'BUILDING' } },
        ...conditions.flatMap(condition => {
            const element = { base: CONDITIONS, field: 'type', equals: condition.type }
            return [
                { row: 'V3', match: { equals: condition.scope }, element },
                { row: 'V4', match: { equals: condition.type }, element },
                { row: 'V5', match: { equals: condition.referents }, element },
                ...('value' in condition ? [{ row: 'V6', match: { equals: condition.value }, element }] : []),
            ]
        }),
    ]
    return { id: 'TEST-ONLY-W1', covers, sentence: HIS_ITEM_1, section: 'How to score', approvedBy: TEST_APPROVAL }
}
const alsoCountsWithheld = (rendered: ReturnType<typeof renderConcreteGame>) => rendered.withheld.map(w => w.path).filter(p => !p.startsWith(`${ROLES}[`) && !p.startsWith(`${CONDITIONS}[`))

test('(M3, L8) a located entry is said ONCE for all its elements, citing every covered field in cover order', () => {
    const entry = buildOutEntry(a01Block.game)
    assert.deepEqual(partitionWording([entry]).unapproved, [])
    const rendered = renderConcreteGame(a01Block, [entry])
    const said = rendered.instructions.filter(i => i.text === HIS_ITEM_1)
    assert.equal(said.length, 1, 'his sentence once, not once per element')
    const pathOf = (cover: ApprovedWording['covers'][number]) => {
        const element = cover.element!
        const member = (element.base === ROLES ? a01Block.game.activityRoles : a01Block.game.value.primaryEvent.conditions).find((m: any) => m[element.field] === element.equals)
        const field = { B8: 'creditedWithin', V3: 'scope', V4: 'type', V5: 'referents', V6: 'value' }[cover.row as 'B8']
        return `${element.base}[${member.elementId}].${field}`
    }
    assert.deepEqual(said[0].from, entry.covers.map(pathOf))
    assert.equal(said[0].section, 'How to score')
    // Every field it covers is said; what is left withheld is exactly the regain score's four fields (no entry covers them).
    const alone = renderConcreteGame(a01Block, [])
    assert.equal(alone.withheld.length, entry.covers.length + 4)
    assert.deepEqual(rendered.withheld.map(w => w.path), alsoCountsWithheld(alone))
})

test('(M3, L8) a locator picking out no element or more than one, a scoped condition without its exact scope, or one failing cover: nothing is said', () => {
    const withheldAlone = renderConcreteGame(a01Block, []).withheld
    const nothingSaid = (entry: ApprovedWording, why: string) => {
        const rendered = renderConcreteGame(a01Block, [entry])
        assert.ok(!rendered.instructions.some(i => i.text === HIS_ITEM_1), why)
        assert.deepEqual(rendered.withheld, withheldAlone, `${why}: every field stays withheld`)
    }
    const base = () => JSON.parse(JSON.stringify(buildOutEntry(a01Block.game))) as ApprovedWording
    const none = base()
    none.covers[0].element!.equals = 'TEST-ONLY-NO-SUCH-ROLE'
    nothingSaid(none, 'a locator matching no element')
    const two = base()
    for (const cover of two.covers.slice(1)) if (cover.row === 'V3') cover.element = { base: CONDITIONS, field: 'scope', equals: 'BUILD_OUT_EPISODE' }
    nothingSaid(two, 'a locator matching four elements')
    const unscoped = base()
    unscoped.covers = unscoped.covers.filter(cover => !(cover.row === 'V3' && cover.element!.equals === 'progression'))
    nothingSaid(unscoped, 'a scoped condition covered without its exact scope')
    const wrongScope = base()
    wrongScope.covers.find(cover => cover.row === 'V3')!.match = { equals: 'WHOLE_GAME' }
    nothingSaid(wrongScope, 'a scope cover holding another scope')
    const failing = base()
    failing.covers.find(cover => cover.row === 'V5' && cover.element!.equals === 'exclusion')!.match = { equals: { asAuthored: 'TEST-ONLY' } }
    nothingSaid(failing, 'one cover that does not hold')
    const bound = base()
    bound.covers[0].match = { equals: 'WHOLE_GAME' }
    nothingSaid(bound, 'a bound cover holding another value')
})

test('(M3 review) a located entry binds exactly the fields it names: a field of a located element it does not cover stays withheld', () => {
    // Added in the M3 review, 17 October 2026: the entry without its value covers (V6) is still said, and every value field stays
    // withheld, so the activity is still refused at communication naming them; nothing it does not name is said by it.
    const entry = buildOutEntry(a01Block.game)
    entry.covers = entry.covers.filter(cover => cover.row !== 'V6')
    const rendered = renderConcreteGame(a01Block, [entry])
    const said = rendered.instructions.filter(i => i.text === HIS_ITEM_1)
    assert.equal(said.length, 1)
    assert.ok(!said[0].from.some(p => p.endsWith('.value')), 'it cites no field it does not cover')
    const values = a01Block.game.value.primaryEvent.conditions.filter((c: any) => 'value' in c).map((c: any) => `${CONDITIONS}[${c.elementId}].value`)
    assert.ok(values.length > 0)
    assert.deepEqual(alsoCountsWithheld(rendered), alsoCountsWithheld(renderConcreteGame(a01Block, [])), 'the regain fields stay withheld too')
    assert.deepEqual(rendered.withheld.map(w => w.path).filter(p => p.startsWith(`${CONDITIONS}[`) || p.startsWith(`${ROLES}[`)).sort(), [...values].sort())
})

test('(M3, L8) covers compare as canonical JSON: an approved value whose keys are written in another order still holds', () => {
    const entry = buildOutEntry(a01Block.game)
    for (const cover of entry.covers) {
        if (cover.row !== 'V5') continue
        const value = (cover.match as { equals: any }).equals
        ;(cover.match as { equals: any }).equals = Object.fromEntries(Object.keys(value).reverse().map(key => [key, value[key]]))
    }
    assert.notEqual(JSON.stringify((entry.covers.find(c => c.row === 'V5' && c.element!.equals === 'progression')!.match as any).equals), JSON.stringify(a01Block.game.value.primaryEvent.conditions.find((c: any) => c.type === 'progression').referents), 'the keys really are in another order')
    assert.equal(renderConcreteGame(a01Block, [entry]).instructions.filter(i => i.text === HIS_ITEM_1).length, 1)
    assert.equal(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] }), canonicalJson({ a: [{ c: 3, d: 2 }], b: 1 }))
})

test('(M3, L8) an entry mixing located and unlocated covers, or a located entry with slots, is not an entry', () => {
    const mixed = buildOutEntry(a01Block.game)
    delete mixed.covers[1].element
    const slotted = { ...buildOutEntry(a01Block.game), slots: { n: { field: 'value' } } }
    const incomplete = buildOutEntry(a01Block.game)
    incomplete.covers[0].element = { base: ROLES, field: '', equals: 'BUILDING' }
    const { approved, unapproved } = partitionWording([mixed, slotted, incomplete])
    assert.deepEqual(approved, [])
    assert.deepEqual(unapproved.map(u => u.why), ['it mixes covers that name their element with covers that do not', 'a slot names no element, and its covers each name one', 'the cover on B8 names an element it cannot pick out (base, field and equals are required)'])
    // An unlocated entry is matched element by element exactly as before (the tests above, on the Golden Case copy).
})

/**
 * **His approved template sentence — stage M4, 17 October 2026 (design step L10).** His reply filed 19 October 2026, item 4: "I approve
 * both of your proposed revisions:" ... Use: "When possession changes, play carries on without a stoppage, and each team keeps
 * attacking the same zone." A template, not an entry: it translates fields the renderer already says.
 */
const HIS_POSSESSION_SENTENCE = 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same zone.'
/**
 * **His replacement of its last clause — P1, 25 October 2026.** His reply filed 28 October 2026, item 5: "I approve replacing "each team keeps
 * attacking the same zone" with: "Each team keeps attacking the same target."" and "This accommodates both scoring configurations without
 * changing the intended meaning." The sentence is now the 19 October one with that clause replaced; the 19 October sentence is kept, superseded.
 */
const HIS_POSSESSION_SENTENCE_28 = 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same target.'
const HIS_FIRST_BLOCK_SENTENCE = 'Decide which team builds first.'
const HIS_EQUIPMENT_SENTENCE = 'One 12 × 6 ft goalkeeper-defended goal, balls, cones or field markers, and two team colors plus a distinct goalkeeper color.'
const templateById = (id: string) => approvedTemplateSentences().find(t => t.id === id)!

test('(M4, L10; P1) three approved template sentences, his words verbatim or his replacement of a clause, each reproduced exactly by its parts', () => {
    assert.deepEqual(unapprovedTemplateSentences(), [], 'the loader ignores these, and the data must not hold them')
    const templates = approvedTemplateSentences()
    // Re-pointed 25 October 2026 (P1): his reply filed 28 October 2026 adds FIRST_BLOCK_CHOICE (item 4) and EQUIPMENT (item 3).
    assert.deepEqual(templates.map(t => t.id), [POSSESSION_CONTINUES, FIRST_BLOCK_CHOICE, 'EQUIPMENT'])
    const template = templateById(POSSESSION_CONTINUES)
    // Re-pointed 25 October 2026 (P1): his 28 October replacement of the last clause; the 19 October sentence kept beneath it, superseded.
    assert.equal(template.sentence, HIS_POSSESSION_SENTENCE_28)
    assert.equal(template.approvedBy.date, '2026-10-28')
    assert.equal(template.approvedBy.replaces, 'each team keeps attacking the same zone')
    assert.equal(template.approvedBy.with, 'Each team keeps attacking the same target.')
    for (const words of [template.approvedBy.replaces!, template.approvedBy.with!, 'This accommodates both scoring configurations without changing the intended meaning.']) assert.ok(template.approvedBy.quote.includes(words), words)
    assert.equal(template.superseded!.length, 1)
    const [earlier] = template.superseded!
    assert.equal(earlier.sentence, HIS_POSSESSION_SENTENCE)
    assert.ok(earlier.approvedBy.quote.includes(HIS_POSSESSION_SENTENCE))
    assert.equal(earlier.approvedBy.date, '2026-10-19')
    assert.deepEqual([earlier.supersededBy.date, earlier.supersededBy.citedAs], ['2026-10-28', 'his reply filed 28 October 2026, item 5'])
    // His letter, verbatim.
    const letter = fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/approved-coach-wording.json'), 'utf8')
    assert.ok(letter.includes('"approvedTemplateSentences"'))
    assert.equal(fillTemplate(template.parts, template.example), HIS_POSSESSION_SENTENCE_28.replace(/\.$/, ''))
    assert.equal(fillTemplate(template.parts, earlier.example!), HIS_POSSESSION_SENTENCE.replace(/\.$/, ''), 'the earlier sentence is the same parts with its own example')
    // P1: his item 4 and item 3 sentences, verbatim inside his quotes, reproduced by their parts.
    for (const [id, his] of [[FIRST_BLOCK_CHOICE, HIS_FIRST_BLOCK_SENTENCE], ['EQUIPMENT', HIS_EQUIPMENT_SENTENCE]]) {
        const own = templateById(id)
        assert.equal(own.sentence, his, id)
        assert.ok(own.approvedBy.quote.includes(`"${his}"`), id)
        assert.deepEqual([own.approvedBy.who, own.approvedBy.date], ['Christian', '2026-10-28'], id)
        assert.equal(fillTemplate(own.parts, own.example), his.replace(/\.$/, ''), id)
    }
    assert.equal(templateById(FIRST_BLOCK_CHOICE).role, 'BUILDING')
    const equipment = templateById('EQUIPMENT')
    assert.deepEqual([equipment.kind, equipment.states, equipment.example], ['EQUIPMENT', ['TARGET_OBJECT', 'CARRIER', 'TEAMS_AND_PERFORMER'], { size: '12 × 6 ft' }])
    assert.deepEqual(equipment.when, { targetObject: { kind: 'goal', defendedBy: 'goalkeeper' }, carrier: 'ball', teams: 2, distinguishes: { performer: 'goalkeeper', words: 'a distinct goalkeeper color' } })
})

test('(M4, L10; P1) a template without his approval, whose sentence is not in the quote, or whose parts do not reproduce it, is not used', () => {
    const good = templateById(POSSESSION_CONTINUES)
    const bad = (over: Record<string, unknown>, base: any = good) => templateUnusableBecause({ ...JSON.parse(JSON.stringify(base)), ...over })
    assert.equal(templateUnusableBecause(good), null)
    assert.equal(bad({ approvedBy: { ...good.approvedBy, who: '' } }), 'it does not say who approved it')
    // Re-pointed 25 October 2026 (P1): POSSESSION_CONTINUES now replaces a clause, so a quote without his words is refused for that; a template
    // holding his whole sentence (FIRST_BLOCK_CHOICE) is refused as before.
    assert.equal(bad({ approvedBy: { ...good.approvedBy, quote: 'something else he said' } }), 'the clause it replaces, or his replacement, is not in the quote of his approval')
    const first = templateById(FIRST_BLOCK_CHOICE)
    assert.equal(bad({ approvedBy: { ...first.approvedBy, quote: 'something else he said' } }, first), 'his sentence is not in the quote of his approval')
    assert.equal(bad({ parts: ['When possession changes, play carries on with no stoppage', good.parts[1]] }), `its parts with the example values read "When possession changes, play carries on with no stoppage, and each team keeps attacking the same target", not his sentence`)
    assert.equal(bad({ example: {} }), 'a slot of its parts has no example value')
    assert.equal(bad({ parts: [] }), 'it has no parts')
    // P1: the replacement is held to his words and to what it replaced.
    const { with: _with, ...noWith } = good.approvedBy
    assert.equal(bad({ approvedBy: noWith }), 'it names a replacement without both the clause replaced and his replacement')
    assert.equal(bad({ superseded: undefined }), 'it replaces a clause and keeps no sentence it was replaced in (superseded)')
    assert.equal(bad({ sentence: 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same goal.' }), 'his sentence is not the one he replaced with "each team keeps attacking the same zone" made "each team keeps attacking the same target"')
    assert.equal(bad({ superseded: [{ ...good.superseded![0], sentence: 'When possession changes, play carries on.' }] }), 'the clause it replaces is not in the sentence it superseded')
    assert.equal(bad({ superseded: [{ ...good.superseded![0], supersededBy: { ...good.superseded![0].supersededBy, citedAs: '' } }] }), 'superseded sentence 1 does not say who replaced it, when, in which words and where (supersededBy)')
    assert.equal(bad({ superseded: [{ ...good.superseded![0], approvedBy: { ...good.superseded![0].approvedBy, quote: 'not his sentence' } }] }), 'superseded sentence 1 is not in the quote of its approval')
    // P1: an equipment template's shape (approved-wording.ts equipmentShapeUnusableBecause), and states or when on any other template.
    const equipment = templateById('EQUIPMENT')
    assert.equal(templateUnusableBecause(equipment), null)
    assert.equal(bad({ states: ['TARGET_OBJECT', 'CARRIER'] }, equipment), 'as an equipment template, it does not give one state per part')
    assert.equal(bad({ when: { ...equipment.when, targetObject: null } }, equipment), 'as an equipment template, it states a target object exactly where it names none, or names one it does not state')
    assert.equal(bad({ when: { ...equipment.when, distinguishes: { performer: 'goalkeeper', words: 'a goalkeeper colour of its own' } } }, equipment), 'as an equipment template, its distinguishing words are not in the part that states the teams and the performer')
    assert.equal(bad({ kind: 'OTHER' }, equipment), 'its kind "OTHER" is not one a template has')
    assert.equal(bad({ states: ['CARRIER'] }), 'it gives states or when without being an equipment template')
})

test('(M4, L10) the renderer says the record: A01 reads his sentence verbatim, a TEST-ONLY template moves it, no template says nothing', () => {
    // Re-pointed 24 October 2026 (K3): the session states no goal, as a01Session does (the zone version).
    const a01 = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...Object.fromEntries(specializedRoleNames().map(r => [r, 0])), [specializedRoleNames()[0]]: 1 }, objects: { goal: { count: 0 } } } } as any)
    const block = (a01.fixture as any).roleBlocks.blocks[0].fixture
    const possession = (rendered: ReturnType<typeof renderConcreteGame>) => rendered.instructions.filter(i => i.text.startsWith('When possession changes')).map(i => i.text)
    // Re-pointed 25 October 2026 (P1): his 28 October sentence ("the same target"), the zone version's word being the record's example word.
    assert.deepEqual(possession(renderConcreteGame(block)), [HIS_POSSESSION_SENTENCE_28.replace(/\.$/, '')], 'his words, from the record')
    const template = templateById(POSSESSION_CONTINUES)
    const moved = { ...template, parts: ['TEST-ONLY first part', ', TEST-ONLY second part about the {targetNoun}'] }
    assert.deepEqual(possession(renderConcreteGame(block, approvedWording(), [moved])), [], 'the sentence follows the record, not code')
    assert.ok(renderConcreteGame(block, approvedWording(), [moved]).instructions.some(i => i.text === 'TEST-ONLY first part, TEST-ONLY second part about the target'))
    // P1: the word itself follows the record: a TEST-ONLY example word is what a game whose targets are not lines says.
    const reworded = { ...template, example: { targetNoun: 'TEST-ONLY-WORD' } }
    assert.ok(renderConcreteGame(block, approvedWording(), [reworded]).instructions.some(i => i.text.endsWith('each team keeps attacking the same TEST-ONLY-WORD')))
    const without = renderConcreteGame(block, approvedWording(), [])
    assert.deepEqual(possession(without), [])
    assert.ok(without.coachingObservations.some(o => o.includes(POSSESSION_CONTINUES) && o.includes('not said rather than said in unapproved words')))
    // And fidelity then refuses: the continuing transition's play state is established and nothing carries it.
    assert.ok(checkFidelity(block, without).findings.some(f => f.question === 3 && f.severity === 'VIOLATION' && /^transitions\[[^\]]+\]\.playState is established/.test(f.what)))
    // A game with line targets reads the same template with its own noun: a generalization of his words, DRAFT.
    assert.deepEqual(possession(renderConcreteGame(golden)), ['When possession changes, play carries on without a stoppage, and each team keeps attacking the same line'])
})

/**
 * **His first approved entry, A01-W1 — stage M5, 18 October 2026 (design step L13).** His reply filed 19 October 2026, item 1:
 * "Approved with revised wording", with his sentence for the build-out scoring rule. The entry's covers are the game's own values,
 * written into the file; these tests prove the file says exactly what A01 holds, at every session the checked pathway builds.
 */
test('(M5, L13) A01-W1 is his item-1 sentence verbatim, with his approval: who, the date of his reply, his words and the standard', () => {
    const [entry] = approvedWording()
    assert.equal(entry.sentence, HIS_ITEM_1)
    assert.equal(entry.section, 'How to score')
    assert.deepEqual([entry.approvedBy.who, entry.approvedBy.date], ['Christian', '2026-10-19'])
    assert.ok(entry.approvedBy.quote.includes(`"${HIS_ITEM_1}"`), 'his sentence is inside the quote of his approval')
    assert.ok(entry.approvedBy.quote.includes('Approved with revised wording'))
    assert.ok(entry.approvedBy.ccs.includes('Coach Communication Standard RC2'))
    // The note names the narrowed origin arm as our inferred reading and the match values as the game's.
    const note = String((entry as any).note ?? '')
    assert.ok(note.includes('OUR INFERRED READING') && note.includes('item 4'), note)
    // Every cover names its element (said once), and no cover is TEST-ONLY.
    assert.ok(entry.covers.every(cover => cover.element))
    assert.ok(!JSON.stringify(entry).includes('TEST-ONLY'))
})

/** A01 as the checked pathway builds it, block by block, at the three sessions it reaches communication with (stage M5). */
const a01Sessions: [number, number][] = [[12, 1], [12, 2], [11, 1]]
const a01BlocksAt = (players: number, keepers: number): any[] =>
    ((buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { ...a01Session, players, roles: { ...noRoles, [ROLE]: keepers } } }).fixture as any)?.roleBlocks?.blocks ?? []).map((b: any) => b.fixture)

test('(M5, L13) key identity: A01-W1 covers exactly the values A01 holds in both blocks at 12 and 11 players, and is said once per block citing all 16', () => {
    const [entry] = approvedWording()
    for (const [players, keepers] of a01Sessions) {
        const blocks = a01BlocksAt(players, keepers)
        assert.equal(blocks.length, 2, `${players} players, ${keepers} keepers: two blocks`)
        for (const block of blocks) {
            const what = `${players} players, ${keepers} keepers`
            // The production covers equal, value for value, the covers read from the game itself (buildOutEntry, above).
            assert.equal(canonicalJson(entry.covers), canonicalJson(buildOutEntry(block.game).covers), `${what}: the file holds the game's values`)
            const said = renderConcreteGame(block).instructions.filter(i => i.text === HIS_ITEM_1)
            assert.equal(said.length, 1, `${what}: said once`)
            assert.equal(said[0].from.length, 16, `${what}: the bound and the fifteen condition fields`)
            assert.ok(said[0].from.includes('activityRoles[c:provisional:A01-R1:A01-R1-B1-1].creditedWithin'))
            // Nothing his sentence says is withheld. Re-pointed 18 October 2026 (design step L14): what was withheld, the regain score's
            // four fields awaiting A01-W2 (was ['V28', 'V29', 'V30', 'V31']), is said since his reply filed 20 October 2026, item 1, so
            // nothing is withheld; that A01-W2 says exactly those four is pinned by the L14 tests below.
            assert.deepEqual(renderConcreteGame(block).withheld.map(w => w.row), [], what)
        }
    }
})

test('(M5, L13) the origin arm his sentence leaves unnamed cannot occur: no transition carries a restart kind, and every build-out beginning is taken by the arm he names', () => {
    for (const [players, keepers] of a01Sessions) {
        for (const block of a01BlocksAt(players, keepers)) {
            const game = block.game
            const transitions: any[] = game.transitions
            const origin = game.value.primaryEvent.conditions.find((c: any) => c.type === 'origin')
            const named = origin.referents.arms.filter((arm: any) => typeof arm.takenBy === 'string').map((arm: any) => arm.takenBy)
            assert.deepEqual(named, [ROLE], 'the one arm his sentence names')
            assert.ok(!JSON.stringify(transitions).includes('restartKind'), 'no transition carries a restart kind')
            // The beginnings awarded to the building role's holder (GA-EPISODE-REACHABLE's starters: start, after a score, the coach's call).
            // Re-pointed 24 October 2026 (R1): and every other dead ball (his reply filed 27 October 2026, item 4: "Whenever the ball becomes
            // dead, play resets to a new goalkeeper-initiated build-out."), each taken by the arm he names; compared as a set, the game holding
            // its transitions in no order that matters here.
            const beginnings = transitions.filter(t => String(t.startsEpisode) === 'true' && t.playState === 'STOP_RESUME' && t.awardedTo === 'ROLE_HOLDER_BUILDING')
            assert.deepEqual(beginnings.map(t => t.selector.find((s: any) => s.attribute === 'trigger').value).sort(), ['COACH_DIRECTED_STOPPAGE', 'COACH_JUDGED_EPISODE_CONCLUSION', 'INFRINGEMENT_STOPPAGE', 'OUT_END_LINE', 'OUT_TOUCHLINE', 'SCORE', 'START'])
            assert.ok(beginnings.every(t => named.includes(t.placement.actor)), JSON.stringify(beginnings.map(t => t.placement)))
        }
    }
})

test('(M5) every field only approved words may say keeps its row whether it is said or withheld (wordedFieldRows)', () => {
    // Added 18 October 2026 (stage M5): measured, once A01-W1 said the four scopes the review evidence lost their row (V3), and his
    // item 4 its scope elements, because a row was known only from the withheld list. The rows are the renderer's table, read from the game.
    const [block] = a01BlocksAt(12, 1)
    const rows = wordedFieldRows(block.game)
    const said = new Set(renderConcreteGame(block).instructions.flatMap(i => i.from))
    const withheld = new Set(renderConcreteGame(block).withheld.map(w => w.path))
    assert.equal(rows.length, 20, 'the bound, the fifteen condition fields and the four regain fields')
    assert.ok(rows.every(r => said.has(r.path) !== withheld.has(r.path)), 'each is said or withheld, never both or neither')
    assert.deepEqual(rows.filter(r => r.path.endsWith('.scope')).map(r => r.row), ['V3', 'V3', 'V3', 'V3'])
    // Re-pointed 18 October 2026 (design step L14): the regain score's four rows were the ones withheld (was ['V28', 'V29', 'V30',
    // 'V31']); since his reply filed 20 October 2026, item 1 (entry A01-W2) they are said, so all twenty are said and none withheld.
    assert.deepEqual(rows.filter(r => withheld.has(r.path)).map(r => r.row), [])
    assert.deepEqual(rows.filter(r => r.path.startsWith('value.primaryEvent.alsoCounts[') && said.has(r.path)).map(r => r.row), ['V28', 'V29', 'V30', 'V31'])
    // A whole-game bound states no condition and is not among them (unlessEquals).
    assert.ok(!rows.some(r => r.path.includes('A01-R1-B1-2')))
})

/**
 * **His two scoring statements, A01-W2 and A01-W3 — design step L14, 18 October 2026.** His reply filed 20 October 2026, item 1:
 * "Pressing team's regain score — Approved as written."; item 2: "Building team's scoring eligibility — Include, with simplified
 * wording." with his own sentence, which replaces our draft. Each entry covers exactly the fields its sentence says, with the game's own
 * values; these tests prove the file holds what A01 holds, and measure how two entries covering one field behave.
 */
const HIS_20_OCT_ITEM_1 = 'The pressing team also scores by winning the ball inside that zone, provided it genuinely establishes possession; a contested touch, deflection or loose ball does not count.'
const HIS_20_OCT_ITEM_2 = 'If the building team loses possession or plays the ball out, it cannot score again until the next goalkeeper restart.'
/**
 * **His simplification of A01-W3 — P1, 25 October 2026.** His reply filed 28 October 2026, item 9: "I approve simplifying the sentence to:"
 * "If the building team loses possession, it cannot score again until the next goalkeeper restart." "This is a communication simplification,
 * not a change in scoring eligibility." A01-W3 holds it; his 20 October sentence is kept beneath it, superseded, with its approval.
 */
const HIS_28_OCT_ITEM_9 = 'If the building team loses possession, it cannot score again until the next goalkeeper restart.'
const byId = (id: string) => approvedWording().find(e => e.id === id)!
const ALSO = 'value.primaryEvent.alsoCounts'

test('(L14; P1) A01-W2 is his 20 October sentence verbatim and A01-W3 his 28 October one, each with his approval: who, the date, his words in the quote, the standard', () => {
    for (const [id, his, heading, date, ccs] of [
        ['A01-W2', HIS_20_OCT_ITEM_1, "1. Pressing team's regain score — Approved as written.", '2026-10-20', 'Coach Communication Standard RC2'],
        // Re-pointed 25 October 2026 (P1): his reply filed 28 October 2026, item 9.
        ['A01-W3', HIS_28_OCT_ITEM_9, '9. Build-out scoring eligibility', '2026-10-28', 'Coach Communication Standard RC3'],
    ]) {
        const e = byId(id)
        assert.equal(e.sentence, his, id)
        assert.equal(e.section, 'How to score', id)
        assert.deepEqual([e.approvedBy.who, e.approvedBy.date], ['Christian', date], id)
        assert.ok(e.approvedBy.quote.startsWith(heading), `${id}: his item heading opens the quote`)
        assert.ok(e.approvedBy.quote.includes(`"${his}"`), `${id}: his sentence is inside the quote of his approval`)
        assert.ok(e.approvedBy.ccs.includes(ccs), id)
        assert.ok(e.covers.every(cover => cover.element), `${id}: every cover names its element, so it is said once`)
        assert.ok(!JSON.stringify(e).includes('TEST-ONLY'), id)
    }
    // P1: his 20 October sentence for A01-W3, kept whole beneath the current one with its approval and his words replacing it.
    const w3 = byId('A01-W3')
    assert.equal(w3.superseded!.length, 1)
    const [earlier] = w3.superseded!
    assert.equal(earlier.sentence, HIS_20_OCT_ITEM_2)
    assert.deepEqual([earlier.approvedBy.who, earlier.approvedBy.date], ['Christian', '2026-10-20'])
    assert.ok(earlier.approvedBy.quote.startsWith("2. Building team's scoring eligibility — Include, with simplified wording."))
    assert.ok(earlier.approvedBy.quote.includes(`"${HIS_20_OCT_ITEM_2}"`))
    assert.ok(earlier.supersededBy.quote.includes('This is a communication simplification, not a change in scoring eligibility.'))
    assert.deepEqual([earlier.supersededBy.date, earlier.supersededBy.citedAs], ['2026-10-28', 'his reply filed 28 October 2026, item 9'])
    // The loader holds the record: a superseded sentence that is the current one, or one not in its own approval, makes the entry unusable.
    const damaged = (alter: (e: any) => void) => {
        const copy = JSON.parse(JSON.stringify(w3))
        alter(copy)
        return unusableBecause(copy)
    }
    assert.equal(unusableBecause(JSON.parse(JSON.stringify(w3))), null)
    assert.equal(damaged(e => (e.superseded[0].sentence = e.sentence)), 'superseded sentence 1 is the current sentence')
    assert.equal(damaged(e => (e.superseded[0].approvedBy.quote = 'not his sentence')), 'superseded sentence 1 is not in the quote of its approval')
    assert.equal(damaged(e => (e.superseded = [])), 'its superseded record is not a list of sentences')
    assert.equal(damaged(e => (e.approvedBy.quote = 'something else he said')), 'it replaces an earlier sentence, and its own is not in the quote of his approval')
})

test('(L14) key identity: A01-W2 covers exactly the four fields of the pressing team\'s regain element, with the values A01 holds in both blocks at 12 and 11 players', () => {
    const w2 = byId('A01-W2')
    assert.deepEqual(w2.covers.map(cover => cover.row), ['V28', 'V29', 'V30', 'V31'])
    assert.ok(w2.covers.every(cover => canonicalJson(cover.element) === canonicalJson({ base: ALSO, field: 'team', equals: 'ROLE_HOLDER_PRESSING' })))
    for (const [players, keepers] of a01Sessions) {
        for (const block of a01BlocksAt(players, keepers)) {
            const what = `${players} players, ${keepers} keepers`
            const elements: any[] = block.game.value.primaryEvent.alsoCounts
            assert.equal(elements.length, 1, `${what}: one regain element`)
            const [element] = elements
            assert.deepEqual(w2.covers.map(cover => canonicalJson((cover.match as any).equals)), ['team', 'trigger', 'control', 'exclusion'].map(field => canonicalJson(element[field])), `${what}: the file holds the game's values`)
            const said = renderConcreteGame(block).instructions.filter(i => i.text === HIS_20_OCT_ITEM_1)
            assert.equal(said.length, 1, `${what}: said once`)
            assert.deepEqual(said[0].from, ['team', 'trigger', 'control', 'exclusion'].map(field => `${ALSO}[${element.elementId}].${field}`), `${what}: it cites the four fields it says, and nothing else`)
        }
    }
})

test('(L14) key identity: A01-W3 covers the building role\'s bound and the origin condition only - the same values as A01-W1 - and is said once citing those four fields', () => {
    const w1 = byId('A01-W1')
    const w3 = byId('A01-W3')
    // The fields his sentence says: the bound ("it cannot score again until ...") and the origin that names the goalkeeper restart.
    const fromW1 = w1.covers.filter(cover => cover.row === 'B8' || cover.element?.equals === 'origin')
    assert.equal(canonicalJson(w3.covers), canonicalJson(fromW1), 'the same covers, value for value, as A01-W1 holds for them')
    assert.deepEqual(w3.covers.map(cover => cover.row), ['B8', 'V3', 'V4', 'V5'])
    // Not the progression, control or exclusion conditions: his sentence does not say them.
    assert.ok(!w3.covers.some(cover => ['progression', 'control', 'exclusion'].includes(String(cover.element?.equals))))
    for (const [players, keepers] of a01Sessions) {
        for (const block of a01BlocksAt(players, keepers)) {
            const what = `${players} players, ${keepers} keepers`
            const said = renderConcreteGame(block).instructions.filter(i => i.text === HIS_28_OCT_ITEM_9)
            assert.equal(said.length, 1, `${what}: said once`)
            assert.deepEqual(said[0].from, [
                'activityRoles[c:provisional:A01-R1:A01-R1-B1-1].creditedWithin',
                'value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-18.a].scope',
                'value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-18.a].type',
                'value.primaryEvent.conditions[c:restated:RPC-001:RPC-001-18.a].referents',
            ], what)
        }
    }
})

test('(L14) MEASURED, two entries covering one field: each is said once where its own covers hold, independently, and a field is withheld only where no entry says it', () => {
    const block = a01BlocksAt(12, 1)[0]
    const w1 = byId('A01-W1')
    const w2 = byId('A01-W2')
    const w3 = byId('A01-W3')
    const textsOf = (rendered: ReturnType<typeof renderConcreteGame>) => rendered.instructions.map(i => i.text)
    // Production: A01-W1 and A01-W3 both cite the bound and the origin's three fields; each is said once and nothing is withheld.
    const both = renderConcreteGame(block)
    const citing = (path: string) => both.instructions.filter(i => i.from.includes(path)).map(i => i.text)
    assert.deepEqual(citing('activityRoles[c:provisional:A01-R1:A01-R1-B1-1].creditedWithin'), [HIS_ITEM_1, HIS_28_OCT_ITEM_9])
    assert.deepEqual(both.withheld, [])
    // Without A01-W1 (TEST-ONLY table): A01-W3 is still said, and the conditions only A01-W1 says are withheld (the activity refused).
    const withoutW1 = renderConcreteGame(block, [w2, w3])
    assert.ok(textsOf(withoutW1).includes(HIS_28_OCT_ITEM_9))
    assert.deepEqual([...new Set(withoutW1.withheld.map(w => w.path.split('].')[0].split('[').pop()))], ['c:restated:RPC-001:RPC-001-18.c', 'c:restated:RPC-001:RPC-001-18.f', 'c:restated:RPC-001:RPC-001-19.a'])
    // Without A01-W3: every field is still said by A01-W1, so nothing would stop a build missing his eligibility sentence - which is
    // why first-activity-end-to-end.unit.ts pins that the served activity says it once.
    const withoutW3 = renderConcreteGame(block, [w1, w2])
    assert.deepEqual(withoutW3.withheld, [])
    assert.ok(!textsOf(withoutW3).includes(HIS_28_OCT_ITEM_9))
    // Table order decides the order of the two sentences citing one role's bound: W3 first in the table is said before W1.
    const scoring = (rendered: ReturnType<typeof renderConcreteGame>) => rendered.instructions.filter(i => i.section === 'How to score').map(i => i.text)
    assert.deepEqual(scoring(both).slice(0, 2), [HIS_ITEM_1, HIS_28_OCT_ITEM_9], 'production: his build-out sentence, then his eligibility sentence')
    assert.deepEqual(scoring(renderConcreteGame(block, [w3, w2, w1])).slice(0, 2), [HIS_28_OCT_ITEM_9, HIS_ITEM_1], 'the order is the table\'s')
})

test('(L14) MEASURED: each field A01-W3 binds is needed - without the origin it may not name the goalkeeper, without the bound it is said after the pressing team\'s sentence', () => {
    const block = a01BlocksAt(12, 1)[0]
    const w1 = byId('A01-W1')
    const w2 = byId('A01-W2')
    const w3 = byId('A01-W3')
    // Bound only (TEST-ONLY): said, but fidelity refuses it: an approved sentence may name the goalkeeper only where a field it covers names it (L8).
    const boundOnly = { ...w3, id: 'TEST-ONLY-W3-BOUND', covers: w3.covers.filter(cover => cover.row === 'B8') }
    const rendered = renderConcreteGame(block, [w1, w2, boundOnly])
    assert.ok(rendered.instructions.some(i => i.text === HIS_28_OCT_ITEM_9))
    const refusals = checkFidelity(block, rendered, [w1, w2, boundOnly]).findings.filter(f => f.severity === 'VIOLATION')
    assert.ok(refusals.some(f => f.question === 4 && f.what.includes(HIS_28_OCT_ITEM_9)), JSON.stringify(refusals))
    // Production: no fidelity violation.
    assert.deepEqual(checkFidelity(block, renderConcreteGame(block)).findings.filter(f => f.severity === 'VIOLATION'), [])
    // Origin only (TEST-ONLY): it no longer cites the building role's bound, so How to score no longer keeps it beside the build-out sentence.
    const originOnly = { ...w3, id: 'TEST-ONLY-W3-ORIGIN', covers: w3.covers.filter(cover => cover.row !== 'B8') }
    const scoring = renderConcreteGame(block, [w1, w2, originOnly]).instructions.filter(i => i.section === 'How to score').map(i => i.text)
    assert.ok(scoring.indexOf(HIS_28_OCT_ITEM_9) > 1, JSON.stringify(scoring))
})

console.log(`approved-wording.unit.ts — ${passed} passed`)
