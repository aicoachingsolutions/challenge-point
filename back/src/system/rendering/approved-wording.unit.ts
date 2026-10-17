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

import { approvedWording, ApprovedWording, partitionWording, unapprovedWording } from './approved-wording'
import { renderConcreteGame } from './render-concrete-game'

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

console.log(`approved-wording.unit.ts — ${passed} passed`)
