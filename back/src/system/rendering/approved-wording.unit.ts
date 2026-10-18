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
    partitionWording,
    POSSESSION_CONTINUES,
    templateUnusableBecause,
    unapprovedTemplateSentences,
    unapprovedWording,
} from './approved-wording'
import { buildActivityWithFixture } from './build-activity'
import { checkFidelity } from './fidelity'
import { renderConcreteGame } from './render-concrete-game'
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

test('BASELINE of 14 October 2026: the table is EMPTY', () => {
    // So the first approved sentence is a visible change to this line, with his words beside it in the file.
    assert.equal(approvedWording().length, 0)
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
 */
const ROLE = specializedRoleNames()[0]
const noRoles = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const a01Session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...noRoles, [ROLE]: 1 } }
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
    const alone = renderConcreteGame(a01Block)
    assert.equal(alone.withheld.length, entry.covers.length + 4)
    assert.deepEqual(rendered.withheld.map(w => w.path), alsoCountsWithheld(alone))
})

test('(M3, L8) a locator picking out no element or more than one, a scoped condition without its exact scope, or one failing cover: nothing is said', () => {
    const withheldAlone = renderConcreteGame(a01Block).withheld
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
    assert.deepEqual(alsoCountsWithheld(rendered), alsoCountsWithheld(renderConcreteGame(a01Block)), 'the regain fields stay withheld too')
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

test('(M4, L10) one approved template sentence, his words verbatim, reproduced exactly by its parts', () => {
    assert.deepEqual(unapprovedTemplateSentences(), [], 'the loader ignores these, and the data must not hold them')
    const templates = approvedTemplateSentences()
    assert.deepEqual(templates.map(t => t.id), [POSSESSION_CONTINUES])
    const [template] = templates
    assert.equal(template.sentence, HIS_POSSESSION_SENTENCE)
    assert.ok(template.approvedBy.quote.includes(HIS_POSSESSION_SENTENCE))
    assert.equal(template.approvedBy.date, '2026-10-19')
    // His letter, verbatim.
    const letter = fs.readFileSync(path.resolve(__dirname, '../../../../docs/audits/approved-coach-wording.json'), 'utf8')
    assert.ok(letter.includes('"approvedTemplateSentences"'))
    assert.equal(fillTemplate(template.parts, template.example), HIS_POSSESSION_SENTENCE.replace(/\.$/, ''))
})

test('(M4, L10) a template without his approval, whose sentence is not in the quote, or whose parts do not reproduce it, is not used', () => {
    const [good] = approvedTemplateSentences()
    const bad = (over: Record<string, unknown>) => templateUnusableBecause({ ...JSON.parse(JSON.stringify(good)), ...over })
    assert.equal(templateUnusableBecause(good), null)
    assert.equal(bad({ approvedBy: { ...good.approvedBy, who: '' } }), 'it does not say who approved it')
    assert.equal(bad({ approvedBy: { ...good.approvedBy, quote: 'something else he said' } }), 'his sentence is not in the quote of his approval')
    assert.equal(bad({ parts: ['When possession changes, play carries on with no stoppage', good.parts[1]] }), `its parts with the example values read "When possession changes, play carries on with no stoppage, and each team keeps attacking the same zone", not his sentence`)
    assert.equal(bad({ example: {} }), 'a slot of its parts has no example value')
    assert.equal(bad({ parts: [] }), 'it has no parts')
})

test('(M4, L10) the renderer says the record: A01 reads his sentence verbatim, a TEST-ONLY template moves it, no template says nothing', () => {
    const a01 = buildActivityWithFixture({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...Object.fromEntries(specializedRoleNames().map(r => [r, 0])), [specializedRoleNames()[0]]: 1 } } } as any)
    const block = (a01.fixture as any).roleBlocks.blocks[0].fixture
    const possession = (rendered: ReturnType<typeof renderConcreteGame>) => rendered.instructions.filter(i => i.text.startsWith('When possession changes')).map(i => i.text)
    assert.deepEqual(possession(renderConcreteGame(block)), [HIS_POSSESSION_SENTENCE.replace(/\.$/, '')], 'his words, from the record')
    const [template] = approvedTemplateSentences()
    const moved = { ...template, parts: ['TEST-ONLY first part', ', TEST-ONLY second part about the {targetNoun}'] }
    assert.deepEqual(possession(renderConcreteGame(block, approvedWording(), [moved])), [], 'the sentence follows the record, not code')
    assert.ok(renderConcreteGame(block, approvedWording(), [moved]).instructions.some(i => i.text === 'TEST-ONLY first part, TEST-ONLY second part about the zone'))
    const without = renderConcreteGame(block, approvedWording(), [])
    assert.deepEqual(possession(without), [])
    assert.ok(without.coachingObservations.some(o => o.includes(POSSESSION_CONTINUES) && o.includes('not said rather than said in unapproved words')))
    // And fidelity then refuses: the continuing transition's play state is established and nothing carries it.
    assert.ok(checkFidelity(block, without).findings.some(f => f.question === 3 && f.severity === 'VIOLATION' && /^transitions\[[^\]]+\]\.playState is established/.test(f.what)))
    // A game with line targets reads the same template with its own noun: a generalization of his words, DRAFT.
    assert.deepEqual(possession(renderConcreteGame(golden)), ['When possession changes, play carries on without a stoppage, and each team keeps attacking the same line'])
})

console.log(`approved-wording.unit.ts — ${passed} passed`)
