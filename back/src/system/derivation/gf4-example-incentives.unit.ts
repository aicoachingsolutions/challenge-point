/**
 * **Decision 2 of Christian's reply received 7 November 2026: GF4's example incentives are examples, not requirements.**
 *
 * Christian's words (reply received 7 November 2026, section 2, Decision 2; filed in the sources repository, commit e17d6cb), one per line:
 *   "Approved conditionally, following verification against the authoritative Game Form source."
 *   "Illustrative incentive examples should not be interpreted as mandatory structural requirements."
 *   "If the current implementation requires GF4 to include example incentives such as double points for a quick goal or rewards for a regain leading to a shot, that appears inconsistent with their intended illustrative status."
 *   "Please make the smallest correction that restores the source's intended meaning."
 *   "Include targeted tests demonstrating that illustrative incentives remain optional and that genuinely required structural conditions continue to be enforced."
 *   "Both changes should remain isolated and non-deployed until separately approved for production."
 *
 * **The verification, against the sources, verbatim (read on 7 November 2026 before anything was changed; the first test re-reads them).**
 * Each source line is quoted whole, on one line, exactly as the file holds it.
 *
 *   The April Game Form Library (our identification of the file: docs/GAME_FORM_LIBRARY_PROVENANCE.md),
 *   back/src/system/test-library/csv/archetypes.csv:1, the header (column 18 of 19 is exampleIncentivePatterns):
 *     game_form_id,game_form_name,objective,interaction_structure,directionality_type,phase_of_play,player_structure_logic,typical_affordances,recommended_constraint_types,representative_design_notes,primaryAffordances,secondaryAffordances,constraintFit_structural,constraintFit_shaping,constraintFit_consequence,recommendedConstraintTypes,exampleConstraintPatterns,exampleIncentivePatterns,logicUsageNote
 *   back/src/system/test-library/csv/archetypes.csv:5, GF4's row:
 *     GF4,Transition Games,Exploit moments after turnover,Fast phase-switching play,High directional,Transition,Uneven during transitions,A5|A8|A1,Transition Trigger|Time Condition,Design for immediate decision-making after regain,"exploit_space, fast_attack, regain",,medium,high,high,"structural, shaping, consequence",zones or channels; restart conditions; time pressure; support rules,double points for quick goal; reward regain leading to shot,"Select this archetype when its structure naturally produces the target affordance; then choose constraints by role (foundation, shaping, consequence)."
 *
 *   The DRAFT sport module this contract restates, back/src/system/sport-module/soccer-module.rc1-v3.json:
 *     :8     "module_status": "DRAFT",
 *     :5435  "game_form_id": "GF4",
 *     :5472  "example_incentive_patterns": "double points for quick goal || reward regain leading to shot",
 *
 *   Christian's ruling of 23 September, recorded as SD-59, docs/design/game-representation-spec-2026-09-18.md:375:
 *     | SD-59 | **No alternatives mechanism.** GF4 genuinely authors *"double points for quick goal || reward regain leading to shot"* as alternatives, but the corresponding contributions are `TYPICAL_EXAMPLE` and therefore inert for derivation, so **no alternative-contribution mechanism is added**. The limitation is recorded on the task register: *"GF4 contains authored example alternatives that the current contribution grammar cannot preserve structurally."* Revisit only when authoritative knowledge actually requires mutually alternative contributions. The two examples are **not** reinterpreted as one modifier, two coexisting modifiers, or two modifiers the engine must choose between — *"none of those meanings is currently represented"* | task register C7 | [C25] |
 *
 *   Task C7, docs/design/knowledge-authoring-tasks.md:55:
 *     | C7 | **Mutually alternative contributions cannot be preserved structurally** | GF4 authors *"double points for quick goal \|\| reward regain leading to shot"* as genuine alternatives, and the contribution grammar has no way to say that two contributions are alternatives rather than coexisting. Both are `TYPICAL_EXAMPLE` and therefore **inert for derivation**, so no alternative-contribution mechanism is added (SD-59, 23 Sep). The two examples are **not** reinterpreted as one modifier, two coexisting modifiers, or two the engine must choose between — none of those meanings is represented | Revisit **only** when authoritative (non-example) knowledge actually requires mutually alternative contributions |
 *
 *   Our restatement item I17, docs/audits/conformance/stage-b/contracts.json:11103-11118 (contract "GF4 Transition Games", l.10842-10843):
 *     "id": "I17", "origId": "GF4.example_incentive_patterns", "row": "V7", "selector": "condition.type=event", "requirement": "EXISTS",
 *     "value": "N/A", "strictness": "SUPPORTING", "valueStatus": "N/A", "scope": "WHOLE_GAME", "basis": "AUTHORED",
 *     "basisEvidence": "\"double points for quick goal || reward regain leading to shot\" (game_forms[GF4].example_incentive_patterns)",
 *     "checkability": "STRUCTURAL", "structuralClause": "whole item",
 *     "fitNote": "The two patterns are alternatives separated by '||', and both are examples only (L17)."
 *   and the three declarations resting only on the example items, contracts.json:11823-11829, 11837-11843, 11844-11850:
 *     "row": "V7",  "declaration": "CLAIMED", "selector": "condition.type=event", "scope": "WHOLE_GAME", "note": "I17, examples only."
 *     "row": "V8b", "declaration": "CLAIMED", "selector": "condition.type=event", "scope": "WHOLE_GAME", "note": "I15"
 *     "row": "V9",  "declaration": "CLAIMED", "selector": "condition.type=event", "scope": "WHOLE_GAME", "note": "I14"
 *
 * Every source holds the two patterns as examples, and SD-59 makes them TYPICAL_EXAMPLE and inert, never one modifier. I17 was EXISTS
 * with valueStatus N/A (our run convention RC-6), so it established exactly one event-conditioned value modifier, whose referents
 * (V8b) and magnitude (V9) GF4's own claims then required: every GF4 game failed GA-NO-FAILED-LINE on them. That is the
 * inconsistency Decision 2 names.
 *
 * **The correction (DESIGN-7 section 1, variant D), in docs/audits/conformance/stage-b/corpus-restatements.json only; contracts.json is
 * untouched:** an `items` entry setting I17's valueStatus TYPICAL_EXAMPLE, and three `declarations` entries restating GF4's V7, V8b and
 * V9 claims CLAIMED -> NON_CLAIMED (GF2's shape: its example incentives "bind nothing"), each under the ruling label
 * 'SD-59; 7 November 2026, section 2, Decision 2', each naming in its why the departure from our RC-6 convention.
 *
 * **What it does not do.** GF4 still does not generate: its teams (I10-I12) are ASSUMED and establish nothing (SD-83), so
 * GA-TRIGGER-REACHABLE fails on its POSSESSION_CHANGE transition, alone and in the four goals that select it; composed with a form
 * that supplies teams it stops at realization (no realization choices are recorded for GF4); and the four GF4 goals (TA01, D02, TD01,
 * TD02) are refused at knowledge first, before derivation, because their contexts (RPC-006, RPC-007) have no contract. GF4's P2 claim
 * (note "I13, example only.") resting only on I13 (TYPICAL_EXAMPLE, "unequal between the teams, e.g. 4 and 6 (4v6)") is left as it is
 * (latent until GF4 has teams; not an incentive matter). Reported, not corrected here.
 *
 * Every 'before' below is computed IN the test: the correction undone on a DEEP COPY (I17's valueStatus and the three declarations'
 * kinds set back to what contracts.json authors), so each pin compares the corrected knowledge with the knowledge as it stood, not with a
 * number copied from a probe. Nothing here writes knowledge; every TEST-ONLY item lives in this file only.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivityFromKnowledge } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { CONFORMANCE_DIR, corpusInput, loadCorpusContracts } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { derivationInputFor, selectFor } from './run-bounded-selection'
import { DerivationInput } from './types'

let passed = 0
const test = (name: string, fn: () => void) => {
    try {
        fn()
        passed++
        console.log(`  ok  ${name}`)
    } catch (error) {
        console.log(`  FAIL ${name}: ${(error as Error).message}`)
        process.exitCode = 1
    }
}

const GF4 = 'blind:GF4'
const RULING = 'SD-59; 7 November 2026, section 2, Decision 2'
const EXAMPLE_ROWS = ['V7', 'V8b', 'V9']
const REPO = path.resolve(__dirname, '../../../..')
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))

/** GF4's contract as contracts.json authors it (the blind restatement, never edited by a ruling). */
const authoredGF4 = () => (readJson(path.join(CONFORMANCE_DIR, 'stage-b/contracts.json')) as any[]).find(c => c.kind === 'blind' && c.name === 'GF4 Transition Games').result
const loadedGF4 = () => loadCorpusContracts().find(c => c.contractId === GF4) as any

/**
 * **TEST-ONLY: the correction undone on a deep copy** — I17's valueStatus and the three declarations' kinds set back to what
 * contracts.json authors. It asserts it found the corrected values first, so it can never silently undo nothing.
 */
const undo = (contracts: any[]) => {
    const contract = contracts.find(c => c.contractId === GF4)
    if (!contract) return
    const authored = authoredGF4()
    const i17 = contract.items.find((i: any) => i.itemId === 'I17')
    assert.equal(i17.valueStatus, 'TYPICAL_EXAMPLE', 'the copy starts from the correction')
    i17.valueStatus = authored.items.find((i: any) => i.id === 'I17').valueStatus
    for (const row of EXAMPLE_ROWS) {
        const declaration = contract.declarations.find((d: any) => d.row === row && d.selector === 'condition.type=event')
        assert.equal(declaration.declaration, 'NON_CLAIMED', `${row}: the copy starts from the correction`)
        declaration.declaration = authored.declarations.find((d: any) => d.row === row && d.selector === 'condition.type=event').declaration
    }
}
type Alter = ((contracts: any[]) => void) | null
const both = (...alters: Alter[]) => (contracts: any[]) => { for (const alter of alters) if (alter) alter(contracts) }
/** A derivation over a DEEP COPY of its input, altered (the loader's objects are shared). */
const staged = (make: () => DerivationInput, alter: Alter = null): any => {
    const input = make()
    input.contracts = JSON.parse(JSON.stringify(input.contracts))
    if (alter) alter(input.contracts as any[])
    return runStages0to10(input)
}
const gf4Alone = () => derivationInputFor({ selected: [{ id: GF4, role: 'test composition' }] })
const check = (s: any, id: string) => s.gates.gateA.checks.find((c: any) => c.checkId === id)
const forwardOf = (s: any, itemId: string) => (s.forward as any[]).find(f => f.item?.contractId === GF4 && f.item.itemId === itemId)?.result
const reasonOf = (s: any, lineId: string) => `${s.classified.get(lineId)?.verdict}/${s.classified.get(lineId)?.reason}`
const collisionsOf = (s: any) => (s.failures as any[]).filter(f => f.kind === 'COLLISION' || f.kind === 'VIOLATION').map(f => `${f.kind} ${f.locus?.lineId ?? ''}`)

const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 18, roles: Object.fromEntries(specializedRoleNames().map(role => [role, 0])) } as any
const build = (alter: Alter = null) => {
    const activity: any = buildActivityFromKnowledge(['GF4'], session, alter ? { alter } : {}).activity
    return { outcome: activity.outcome, stage: activity.stage ?? null, reasons: (activity.reasons ?? []) as string[] }
}

/** TEST-ONLY items: never knowledge. */
const testItem = (itemId: string, row: string, selector: string, requirement: string, value: unknown) => ({
    itemId, row, selector, requirement, value, strictness: 'REQUIRED', valueStatus: requirement === 'EXISTS' ? 'N/A' : 'REQUIRED_RANGE', scope: 'WHOLE_GAME',
    basis: 'OWNER_RULING', basisEvidence: 'TEST-ONLY: never production data', checkability: 'STRUCTURAL', structuralClause: 'whole item',
})
const addToGF4 = (item: any) => (contracts: any[]) => void contracts.find(c => c.contractId === GF4).items.push(item)
const removeFromGF4 = (itemId: string) => (contracts: any[]) => {
    const contract = contracts.find(c => c.contractId === GF4)
    assert.ok(contract.items.some((i: any) => i.itemId === itemId), `${itemId} is there to remove`)
    contract.items = contract.items.filter((i: any) => i.itemId !== itemId)
}
const I17_LINES = ['V10', 'V8a', 'V8b', 'V8c', 'V8d', 'V9', 'V9a'].map(row => `c:blind:GF4:I17::${row}`)
const I17_FAILED = I17_LINES.filter(line => !line.endsWith('::V8a'))
const withoutI17 = (ids: string[]) => ids.filter(id => !id.includes('GF4:I17'))

// ── 0. The verification and the correction, as data ─────────────────────────────────────────────────────────────────────
console.log('Decision 2 (7 November 2026): GF4\'s example incentives')

test('the sources still read as verified: the April Game Form Library, the DRAFT module, SD-59 and task C7 hold the patterns as examples', () => {
    // The April Game Form Library: a minimal CSV reader (quoted fields may hold commas).
    const fields = (line: string): string[] => {
        const out: string[] = []
        let field = ''
        let quoted = false
        for (const char of line) {
            if (char === '"') quoted = !quoted
            else if (char === ',' && !quoted) {
                out.push(field)
                field = ''
            } else field += char
        }
        out.push(field)
        return out
    }
    const csv = fs.readFileSync(path.join(__dirname, '../test-library/csv/archetypes.csv'), 'utf8').split(/\r?\n/)
    const header = fields(csv[0])
    const column = header.indexOf('exampleIncentivePatterns')
    assert.equal(column, 17, 'column 18 of the header')
    assert.equal(header.length, 19)
    const gf4Row = fields(csv[4])
    assert.equal(gf4Row[0], 'GF4', 'line 5 is GF4\'s row')
    assert.equal(gf4Row[column], 'double points for quick goal; reward regain leading to shot')
    // The DRAFT sport module this contract restates.
    const module = readJson(path.join(__dirname, '../sport-module/soccer-module.rc1-v3.json'))
    assert.equal(module.metadata.module_status, 'DRAFT')
    const form = (module.game_forms as any[]).find(f => f.game_form_id === 'GF4')
    assert.equal(form.example_incentive_patterns, 'double points for quick goal || reward regain leading to shot')
    // SD-59 and task C7: the record of the 23 September ruling.
    const spec = fs.readFileSync(path.join(REPO, 'docs/design/game-representation-spec-2026-09-18.md'), 'utf8').split(/\r?\n/)
    assert.ok(spec[374].startsWith('| SD-59 | **No alternatives mechanism.**'), 'SD-59 sits at line 375')
    assert.ok(spec[374].includes('the corresponding contributions are `TYPICAL_EXAMPLE` and therefore inert for derivation'))
    assert.ok(spec[374].includes('The two examples are **not** reinterpreted as one modifier, two coexisting modifiers, or two modifiers the engine must choose between'))
    const tasks = fs.readFileSync(path.join(REPO, 'docs/design/knowledge-authoring-tasks.md'), 'utf8').split(/\r?\n/)
    assert.ok(tasks[54].startsWith('| C7 | **Mutually alternative contributions cannot be preserved structurally**'), 'C7 sits at line 55')
    assert.ok(tasks[54].includes('Both are `TYPICAL_EXAMPLE` and therefore **inert for derivation**'))
})

test('contracts.json is untouched: I17 is authored EXISTS on V7 with valueStatus N/A, and GF4 CLAIMS V7, V8b and V9 on the examples', () => {
    const authored = authoredGF4()
    const i17 = authored.items.find((i: any) => i.id === 'I17')
    assert.deepEqual([i17.row, i17.selector, i17.requirement, i17.value, i17.strictness, i17.valueStatus, i17.basis], ['V7', 'condition.type=event', 'EXISTS', 'N/A', 'SUPPORTING', 'N/A', 'AUTHORED'])
    assert.equal(i17.basisEvidence, '"double points for quick goal || reward regain leading to shot" (game_forms[GF4].example_incentive_patterns)')
    for (const [id, status] of [['I14', 'TYPICAL_EXAMPLE'], ['I15', 'TYPICAL_EXAMPLE']]) assert.equal(authored.items.find((i: any) => i.id === id).valueStatus, status, id)
    const notes = Object.fromEntries(EXAMPLE_ROWS.map(row => [row, authored.declarations.find((d: any) => d.row === row && d.selector === 'condition.type=event')]))
    assert.deepEqual(EXAMPLE_ROWS.map(row => [notes[row].declaration, notes[row].note]), [['CLAIMED', 'I17, examples only.'], ['CLAIMED', 'I15'], ['CLAIMED', 'I14']])
})

test('the correction is four ruled restatements in corpus-restatements.json, each citing SD-59 and Decision 2 and naming the RC-6 departure', () => {
    const ledger = readJson(path.join(CONFORMANCE_DIR, 'stage-b/corpus-restatements.json'))
    const items = (ledger.items as any[]).filter(r => r.ruling === RULING)
    assert.deepEqual(items.map(r => [r.item, r.set]), [['blind:GF4::I17', { valueStatus: 'TYPICAL_EXAMPLE' }]], 'one field on one item')
    assert.ok(items[0].why.includes('DEPARTURE FROM RC-6'), 'the departure from our convention is named')
    for (const words of ['"Approved conditionally, following verification against the authoritative Game Form source."', '"Illustrative incentive examples should not be interpreted as mandatory structural requirements."', '"Please make the smallest correction that restores the source\'s intended meaning."']) {
        assert.ok(items[0].why.includes(words), `Christian's words travel with it: ${words}`)
    }
    const declarations = (ledger.declarations as any[]).filter(r => r.ruling === RULING)
    assert.deepEqual(declarations.map(r => [r.contractId, r.row, r.from, r.to, 'defersTo' in r]), EXAMPLE_ROWS.map(row => [GF4, row, 'CLAIMED', 'NON_CLAIMED', false]))
    for (const r of declarations) assert.ok(r.why.includes('RC-6') && r.why.includes('"Illustrative incentive examples should not be interpreted as mandatory structural requirements."'), r.row)
    // As loaded: I17 differs from its authored self in valueStatus alone, and the three declarations in their kind alone.
    const authored = authoredGF4()
    const loaded = loadedGF4()
    const { id, ...authoredI17 } = authored.items.find((i: any) => i.id === 'I17')
    assert.equal(id, 'I17')
    assert.deepEqual(loaded.items.find((i: any) => i.itemId === 'I17'), { itemId: 'I17', ...authoredI17, valueStatus: 'TYPICAL_EXAMPLE' })
    const kindsMoved = (authored.declarations as any[]).map((d, i) => [d, loaded.declarations[i]]).filter(([d, l]) => d.declaration !== l.declaration)
    assert.deepEqual(kindsMoved.map(([d, l]) => `${d.row} ${d.declaration} -> ${l.declaration} ${l.selector} ${l.scope} ${l.note}`), [
        'V7 CLAIMED -> NON_CLAIMED condition.type=event WHOLE_GAME I17, examples only.',
        'V8b CLAIMED -> NON_CLAIMED condition.type=event WHOLE_GAME I15',
        'V9 CLAIMED -> NON_CLAIMED condition.type=event WHOLE_GAME I14',
    ])
})

// ── (i) Illustrative incentives remain optional ────────────────────────────────────────────────────────────────────────
test('(i) GF4 alone holds no value modifier: no V7 class, no I17 line, GA-NO-FAILED-LINE names no I17 line, GA-MODIFIER-OVERLAP reads none instantiated', () => {
    const now = staged(gf4Alone)
    assert.deepEqual(now.classes.filter((c: any) => c.row === 'V7').map((c: any) => c.classId), [])
    assert.deepEqual(now.lines.filter((l: any) => l.lineId.includes('GF4:I17')).map((l: any) => l.lineId), [])
    assert.deepEqual([check(now, 'GA-NO-FAILED-LINE').verdict, check(now, 'GA-NO-FAILED-LINE').subjects], ['PASS', []])
    assert.deepEqual([check(now, 'GA-MODIFIER-OVERLAP').verdict, check(now, 'GA-MODIFIER-OVERLAP').why], ['PASS', 'no value modifier is instantiated'])
    // Before (the correction undone on a copy): the one modifier I17 established, and the two lines it failed on.
    const before = staged(gf4Alone, undo)
    assert.deepEqual(before.classes.filter((c: any) => c.row === 'V7').map((c: any) => c.classId), ['c:blind:GF4:I17'])
    assert.deepEqual([check(before, 'GA-NO-FAILED-LINE').verdict, check(before, 'GA-NO-FAILED-LINE').subjects], ['FAIL', ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9']])
    assert.deepEqual([check(before, 'GA-MODIFIER-OVERLAP').verdict, check(before, 'GA-MODIFIER-OVERLAP').why], ['NOT_EVALUABLE', '1 event-conditioned modifier(s); overlap execution is unspecified; 0 region referent(s) compared by structural identity'])
    // The checked build: refused at structure on the trigger alone, naming no example line.
    assert.deepEqual(build(), { outcome: 'refused', stage: 'structure', reasons: ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-TRIGGER-REACHABLE'] })
    assert.deepEqual(build(undo), {
        outcome: 'refused',
        stage: 'structure',
        reasons: ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE, GA-TRIGGER-REACHABLE', '2 unresolved properties are neither an authorized choice nor an authorized claim: c:blind:GF4:I17::V8b, c:blind:GF4:I17::V9'],
    })
})

test('(i) I17, I14, I14.op and I15 are TYPICAL_EXAMPLE and INERT; I17 was SATISFIED (it established the modifier) before', () => {
    const loaded = loadedGF4()
    for (const itemId of ['I14', 'I14.op', 'I15', 'I17']) assert.equal(loaded.items.find((i: any) => i.itemId === itemId).valueStatus, 'TYPICAL_EXAMPLE', itemId)
    const now = staged(gf4Alone)
    assert.deepEqual(['I14', 'I14.op', 'I15', 'I17'].map(id => forwardOf(now, id)), ['INERT', 'INERT', 'INERT', 'INERT'])
    assert.equal(forwardOf(staged(gf4Alone, undo), 'I17'), 'SATISFIED')
})

test('(i) the full corpus holds one value-modifier class, Wide Zone\'s; GF4\'s is gone', () => {
    assert.deepEqual(staged(corpusInput).classes.filter((c: any) => c.row === 'V7').map((c: any) => c.classId), ['c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-18.a'])
    assert.deepEqual(staged(corpusInput, undo).classes.filter((c: any) => c.row === 'V7').map((c: any) => c.classId), ['c:blind:GF4:I17', 'c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-18.a'])
})

/** TEST-ONLY: a separate object authoring its own event-conditioned incentive and nothing else (an incentive a context might one day author). */
const OTHER = 'restated:TEST-ONLY-EVENT-INCENTIVE'
const otherIncentive = (contracts: any[]) => {
    contracts.push({ contractId: OTHER, objectId: 'TEST-ONLY-EVENT-INCENTIVE', knowledgeVersion: 'test-only', relationshipRules: [], declarations: [], items: [testItem('TEST-ONLY-M1', 'V7', 'condition.type=event', 'EXISTS', 'N/A')] })
}
const otherLines = (s: any) => ['V8b', 'V9'].map(row => `c:${OTHER}:TEST-ONLY-M1::${row}`).map(lineId => [reasonOf(s, lineId), (s.classified.get(lineId)?.governedBy ?? []).map((g: any) => `${g.contractId} ${g.declaration}`)])

test('(i) another object\'s own event incentive beside GF4 is \'not constrained\' (non-blocking), as without GF4 (\'no coverage\', non-blocking); before, GF4\'s example claims made it block', () => {
    const alone = staged(() => derivationInputFor({ selected: [] }), otherIncentive)
    assert.deepEqual(otherLines(alone), [['NOT_AUTHORED/no coverage', []], ['NOT_AUTHORED/no coverage', []]])
    assert.equal(check(alone, 'GA-NO-FAILED-LINE').verdict, 'PASS')
    const beside = staged(gf4Alone, otherIncentive)
    assert.deepEqual(otherLines(beside), [['NOT_AUTHORED/not constrained', ['blind:GF4 NON_CLAIMED']], ['NOT_AUTHORED/not constrained', ['blind:GF4 NON_CLAIMED']]])
    assert.deepEqual([check(beside, 'GA-NO-FAILED-LINE').verdict, check(beside, 'GA-NO-FAILED-LINE').subjects], ['PASS', []])
    const before = staged(gf4Alone, both(undo, otherIncentive))
    assert.deepEqual(otherLines(before), [['NOT_AUTHORED/claimed but unresolved', ['blind:GF4 CLAIMED']], ['NOT_AUTHORED/claimed but unresolved', ['blind:GF4 CLAIMED']]])
    assert.deepEqual(check(before, 'GA-NO-FAILED-LINE').subjects, ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9', `c:${OTHER}:TEST-ONLY-M1::V8b`, `c:${OTHER}:TEST-ONLY-M1::V9`])
})

test('(i) the four goals that select GF4 lose exactly the seven I17 lines (six of them failed), and nothing else moves but the checks they fed', () => {
    const expectedChecks: Record<string, string[]> = {
        // TA01 composes Wide Zone beside GF4, whose overlap check still fails on its own (unchanged).
        TA01: ['GA-NO-FAILED-LINE: FAIL -> PASS'],
        TD01: ['GA-MODIFIER-OVERLAP: NOT_EVALUABLE -> PASS', 'GA-NO-FAILED-LINE: FAIL -> PASS'],
        D02: ['GA-MODIFIER-OVERLAP: NOT_EVALUABLE -> PASS', 'GA-NO-FAILED-LINE: FAIL -> PASS'],
        TD02: ['GA-MODIFIER-OVERLAP: NOT_EVALUABLE -> PASS', 'GA-NO-FAILED-LINE: FAIL -> PASS'],
    }
    for (const goal of Object.keys(expectedChecks)) {
        const make = () => derivationInputFor(selectFor(goal, null))
        assert.ok(make().contracts.some(c => c.contractId === GF4), `${goal} selects GF4`)
        const now = staged(make)
        const before = staged(make, undo)
        const lineMap = (s: any) => new Map<string, string>(s.lines.map((l: any) => [l.lineId, `${s.classified.get(l.lineId)?.verdict}/${s.classified.get(l.lineId)?.reason}/${s.classified.get(l.lineId)?.lineState ?? l.lineState}`]))
        const [a, b] = [lineMap(now), lineMap(before)]
        assert.deepEqual([...b.keys()].filter(k => !a.has(k)).sort(), I17_LINES, `${goal}: the lines lost`)
        assert.deepEqual([...a.keys()].filter(k => !b.has(k)), [], `${goal}: no line gained`)
        assert.deepEqual([...a.keys()].filter(k => a.get(k) !== b.get(k)), [], `${goal}: every other line keeps its verdict and reason`)
        const checks = (s: any) => Object.fromEntries(s.gates.gateA.checks.map((c: any) => [c.checkId, c.verdict]))
        const [ca, cb] = [checks(now), checks(before)]
        assert.deepEqual(Object.keys(ca).filter(k => ca[k] !== cb[k]).map(k => `${k}: ${cb[k]} -> ${ca[k]}`), expectedChecks[goal], `${goal}: the checks that move`)
        assert.deepEqual([before.gates.gateA.verdict, now.gates.gateA.verdict], ['FAIL', 'FAIL'], `${goal}: Gate A stays FAIL (GA-TRIGGER-REACHABLE, not an incentive matter)`)
        assert.equal(check(now, 'GA-TRIGGER-REACHABLE').verdict, 'FAIL', goal)
        // The failed lines (completed-pass.unit.ts pins the counts): exactly the six unauthored I17 lines leave.
        const failed = (alter: Alter) => {
            const input = make()
            input.contracts = JSON.parse(JSON.stringify(input.contracts))
            if (alter) alter(input.contracts as any[])
            return new Set(((runDerivation(input) as any).resolution ?? []).filter((e: any) => e.state === 'failed').map((e: any) => String(e.lineId)))
        }
        const [fa, fb] = [failed(null), failed(undo)]
        assert.deepEqual([...fb].filter(id => !fa.has(id)).sort(), I17_FAILED.slice().sort(), `${goal}: the failed lines lost`)
        assert.deepEqual([...fa].filter(id => !fb.has(id)), [], `${goal}: no failed line gained`)
    }
})

// ── (ii) Genuinely required structural conditions are still enforced, identical to before ─────────────────────────────
test('(ii) every GF4 item but I17 keeps its forward result, before and after: I01 UNMET, I02, I06 and I08 SATISFIED, the ASSUMED teams UNMET', () => {
    const results = (s: any) => (s.forward as any[]).filter(f => f.item?.contractId === GF4 && f.item.itemId !== 'I17').map(f => `${f.item.itemId} ${f.result}`)
    const now = results(staged(gf4Alone))
    assert.deepEqual(now, results(staged(gf4Alone, undo)))
    for (const pinned of ['I01 UNMET', 'I02 SATISFIED', 'I05 UNMET', 'I06 SATISFIED', 'I07 INERT', 'I08 SATISFIED', 'I10 UNMET', 'I11 UNMET', 'I12 UNMET', 'I13 INERT']) assert.ok(now.includes(pinned), pinned)
})

test('(ii) I02 still establishes the target class, and I06 the POSSESSION_CHANGE transition', () => {
    for (const s of [staged(gf4Alone), staged(gf4Alone, undo)]) {
        assert.deepEqual(s.classes.filter((c: any) => c.row === 'O1' && c.fromItem.contractId === GF4).map((c: any) => [c.classId, c.supportedBy]), [['c:blind:GF4:I02', [{ contractId: GF4, itemId: 'I02' }]]])
        assert.deepEqual(s.classes.filter((c: any) => c.row === 'T1').map((c: any) => c.classId), ['c:blind:GF4:I06'])
        assert.deepEqual(s.classes.filter((c: any) => c.row === 'P1').map((c: any) => c.classId), [], 'no team: I10-I12 are ASSUMED and establish nothing (SD-83)')
    }
})

test('(ii) GA-TRIGGER-REACHABLE still fails on GF4\'s POSSESSION_CHANGE transition, word for word as before', () => {
    const why = '1 transition trigger(s) checked against 6 reachable trigger(s); 1 not reachable: c:blind:GF4:I06: POSSESSION_CHANGE; 1 turnover transition(s): possession relation FREE(a)'
    for (const s of [staged(gf4Alone), staged(gf4Alone, undo)]) assert.deepEqual([check(s, 'GA-TRIGGER-REACHABLE').verdict, check(s, 'GA-TRIGGER-REACHABLE').why], ['FAIL', why])
})

test('(ii) I08 contradicted (TEST-ONLY: the turnover STOP_RESUME on a copy) collides and is refused at structure naming the collision, identically before and after', () => {
    const X1 = testItem('TEST-ONLY-X1', 'T6', 'trigger=POSSESSION_CHANGE', 'EQUALS', 'STOP_RESUME')
    for (const [name, alter] of [['now', addToGF4(X1)], ['before', both(undo, addToGF4(X1))]] as [string, Alter][]) {
        const s = staged(gf4Alone, alter)
        assert.deepEqual(collisionsOf(s), ['COLLISION c:blind:GF4:I06::T6'], name)
        assert.equal(check(s, 'GA-TRIGGER-UNIQUE').verdict, 'FAIL', name)
        const refused = build(alter)
        assert.deepEqual([refused.outcome, refused.stage], ['refused', 'structure'], name)
        assert.ok(refused.reasons.includes('a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE, GA-TRIGGER-REACHABLE, GA-TRIGGER-UNIQUE'), name)
        assert.ok(refused.reasons.includes('1 collision(s) remain'), name)
        assert.ok(refused.reasons.includes('1 unresolved structural relationship(s) remain: c:blind:GF4:I06::T6'), name)
    }
})

test('(ii) without I01 the primary event is claimed but unresolved and the build is refused naming game::V1, as before (the I17 lines aside)', () => {
    const now = staged(gf4Alone, removeFromGF4('I01'))
    const before = staged(gf4Alone, both(undo, removeFromGF4('I01')))
    for (const s of [now, before]) assert.equal(reasonOf(s, 'game::V1'), 'NOT_AUTHORED/claimed but unresolved')
    assert.deepEqual(check(now, 'GA-NO-FAILED-LINE').subjects, ['game::V1'])
    assert.deepEqual(withoutI17(check(before, 'GA-NO-FAILED-LINE').subjects), ['game::V1'])
    assert.deepEqual(build(removeFromGF4('I01')), {
        outcome: 'refused',
        stage: 'structure',
        reasons: ['Gate A is FAIL', 'a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE, GA-TRIGGER-REACHABLE', '1 unresolved property is neither an authorized choice nor an authorized claim: game::V1'],
    })
    const was = build(both(undo, removeFromGF4('I01')))
    assert.deepEqual([was.stage, was.reasons[2]], ['structure', '3 unresolved properties are neither an authorized choice nor an authorized claim: game::V1, c:blind:GF4:I17::V8b, c:blind:GF4:I17::V9'])
})

test('(ii) without I06 the transition is gone and Gate A cannot be evaluated: NOT_EVALUABLE on the same three checks as before (the I17 lines aside)', () => {
    const now = staged(gf4Alone, removeFromGF4('I06'))
    const before = staged(gf4Alone, both(undo, removeFromGF4('I06')))
    const notEvaluable = (s: any) => s.gates.gateA.checks.filter((c: any) => c.verdict === 'NOT_EVALUABLE').map((c: any) => c.checkId)
    assert.equal(now.gates.gateA.verdict, 'NOT_EVALUABLE')
    assert.deepEqual(notEvaluable(now), ['GA-DIRECTION', 'GA-LAYOUT-FEASIBLE', 'GA-ROSTER-SUM'])
    for (const s of [now, before]) {
        assert.deepEqual(s.classes.filter((c: any) => c.row === 'T1'), [])
        assert.equal(check(s, 'GA-TRIGGER-REACHABLE').verdict, 'PASS', 'vacuous: no transition to reach')
    }
    // Before, I17's modifier added its own unevaluable overlap and its failed lines beside the same three.
    assert.deepEqual(notEvaluable(before), ['GA-DIRECTION', 'GA-LAYOUT-FEASIBLE', 'GA-MODIFIER-OVERLAP', 'GA-ROSTER-SUM'])
    assert.deepEqual([before.gates.gateA.verdict, check(before, 'GA-NO-FAILED-LINE').subjects], ['FAIL', ['c:blind:GF4:I17::V8b', 'c:blind:GF4:I17::V9']])
    assert.deepEqual(build(removeFromGF4('I06')), {
        outcome: 'refused',
        stage: 'structure',
        reasons: ['Gate A is NOT_EVALUABLE', 'a pre-realization Gate A invariant cannot be evaluated, so it is not satisfied: GA-DIRECTION, GA-LAYOUT-FEASIBLE, GA-ROSTER-SUM'],
    })
})

// ── (iii) An honest limit, pre-existing: the correction neither causes nor fixes it ────────────────────────────────────
test('(iii) I01\'s set and I02\'s count are NOT enforced against a contradicting entailment at derivation today, identically before and after', () => {
    // A pre-existing limit, found while verifying (ii), recorded here so it is not mistaken for enforcement. A TEST-ONLY item
    // entailing a primary event outside I01's set resolves the line to it with no collision, and I01 stays UNMET (not VIOLATED); a
    // TEST-ONLY item counting three goals or targets forms a second class beside I02's with no collision. Whether realization or the
    // post-realization gate would catch either is not verified: GF4 never reaches realization alone. Decision 2 does not authorize
    // closing this, and the correction moves neither case.
    const X2 = testItem('TEST-ONLY-X2', 'V1', '*', 'EQUALS', 'target_zone_entered')
    const X3 = testItem('TEST-ONLY-X3', 'O1', 'kind ∈ {goal, target}', 'COUNT', '3')
    const read = (s: any) => ({
        v1: reasonOf(s, 'game::V1'),
        v1Value: (s.derived.lines.get('game::V1')?.entailing ?? []).map((e: any) => e.value),
        o1: s.classes.filter((c: any) => c.row === 'O1').map((c: any) => c.classId),
        collisions: collisionsOf(s),
        forward: ['I01', 'I02', 'TEST-ONLY-X2', 'TEST-ONLY-X3'].map(id => `${id} ${forwardOf(s, id) ?? 'absent'}`),
        gateBForward: s.gates.gateBForward?.verdict ?? null,
    })
    const x2 = read(staged(gf4Alone, addToGF4(X2)))
    assert.deepEqual(x2, read(staged(gf4Alone, both(undo, addToGF4(X2)))), 'X2: identical before and after')
    assert.deepEqual([x2.v1, x2.v1Value, x2.collisions, x2.forward[0], x2.gateBForward], ['RESOLVED:ENTAILED/null', ['target_zone_entered'], [], 'I01 UNMET', 'PASS'])
    const x3 = read(staged(gf4Alone, addToGF4(X3)))
    assert.deepEqual(x3, read(staged(gf4Alone, both(undo, addToGF4(X3)))), 'X3: identical before and after')
    assert.deepEqual([x3.o1, x3.collisions, x3.forward[1], x3.forward[3], x3.gateBForward], [['c:blind:GF4:I02', 'c:blind:GF4:TEST-ONLY-X3', 'c:sport-profile:soccer:SPORT-SOCCER-01'], [], 'I02 SATISFIED', 'TEST-ONLY-X3 SATISFIED', 'PASS'])
})

test('nothing shared was altered: the loaded knowledge carries no TEST-ONLY item and the correction as ruled', () => {
    const text = JSON.stringify(loadCorpusContracts())
    assert.ok(!text.includes('TEST-ONLY'))
    assert.equal(loadedGF4().items.find((i: any) => i.itemId === 'I17').valueStatus, 'TYPICAL_EXAMPLE')
})

console.log(`gf4 example incentives: ${passed} passed`)
