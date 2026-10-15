/**
 * Unit tests — Session Planning Model RC1 loading.
 *
 * Pins the things that would break the coach conversation WITHOUT erroring, which is the whole
 * failure class this loader exists to catch: an orphaned Practice Situation silently disappears, a
 * phrase pointing at a deleted goal routes nowhere, and a goal with no Engine Translation row is a
 * dead end the coach only discovers after answering every question.
 *
 * Also pins the shape itself — 13 goals, 20 situations, 4 phases at RC1.1 — so that when Christian
 * revises the workbook the change is deliberate and visible in a diff rather than absorbed silently.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import workbook from './session-planning-model.rc1.json'
import {
    gameProblemsForLearningGoal,
    sessionPlanningModel,
    translationStatus,
    validateSessionPlanningModel,
} from './session-planning-model'
import { projectSessionPlanningWorkbook, projectSessionPlanningWorkbookObject, readSheetCells } from './workbook-projection'

const XLSX = path.resolve(__dirname, '../../../data/session-planning/session-planning-model.rc1.xlsx')
const JSON_PATH = path.resolve(__dirname, 'session-planning-model.rc1.json')

/** Where two Engine Translation sheets disagree, named by goal and column — so a failure says WHICH row moved. */
function engineTranslationDisagreements(projected: Array<Record<string, unknown>>, committed: Array<Record<string, unknown>>): string[] {
    const out: string[] = []
    const ids = new Set([...projected, ...committed].map(row => String(row['Learning Goal ID'])))
    for (const id of ids) {
        const a = projected.find(row => String(row['Learning Goal ID']) === id)
        const b = committed.find(row => String(row['Learning Goal ID']) === id)
        if (!a || !b) {
            out.push(`${id}: present in ${a ? 'the workbook' : 'the JSON'} only`)
            continue
        }
        for (const column of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (JSON.stringify(a[column]) !== JSON.stringify(b[column])) out.push(`${id} ${column}: workbook ${JSON.stringify(a[column])}, JSON ${JSON.stringify(b[column])}`)
        }
    }
    return out
}

/**
 * **The committed JSON IS the committed workbook's projection** — added 15 October 2026 (stage G1).
 *
 * The loader's header says the .xlsx is canonical and the JSON a projection *"never hand-edit"*, and until this
 * nothing checked it: the projector was Python, which this environment lacks, so an approval written into one
 * file and not the other would have loaded without complaint. `workbook-projection.ts` reads the workbook with
 * no dependency by project-workbook.py's rules; this requires the text to be equal (line endings aside — git
 * keeps the JSON LF and a Windows checkout writes CRLF), and then the Engine Translation field by field against
 * what the LOADER imported, so a drift names the goal and the column rather than a character offset. Measured
 * equal on 14 October before any data changed.
 */
function testCommittedJsonIsTheWorkbookProjection(): void {
    const zip = readFileSync(XLSX)
    const committed = readFileSync(JSON_PATH, 'utf8').split('\r\n').join('\n')
    assert.equal(projectSessionPlanningWorkbook(zip), committed, 'the committed JSON must be exactly the committed workbook projected')

    const projected = projectSessionPlanningWorkbookObject(zip) as { engine_translation: Array<Record<string, unknown>> }
    const imported = (workbook as unknown as { engine_translation: Array<Record<string, unknown>> }).engine_translation
    assert.deepEqual(engineTranslationDisagreements(projected.engine_translation, imported), [], 'Engine Translation: workbook and loader agree field by field')

    // It bites: one goal's Primary changed in a copy is named, by goal and column, and nothing else is.
    const altered = JSON.parse(JSON.stringify(projected.engine_translation)) as Array<Record<string, unknown>>
    altered.find(row => row['Learning Goal ID'] === 'A01')!['Primary GP IDs'] = 'GP-999'
    const found = engineTranslationDisagreements(altered, imported)
    assert.equal(found.length, 1, `exactly one disagreement, got ${found.join(' | ')}`)
    assert.ok(found[0].startsWith('A01 Primary GP IDs:'), found[0])
}

/**
 * **What openpyxl would read differently is refused, not guessed** (15 October 2026). A formula's cached value,
 * a float Python would print as 2.0, a number in a date format: none is in the workbook, and each would project
 * differently from project-workbook.py's output, so each throws naming the cell.
 */
function testReaderRefusesWhatItCannotMirror(): void {
    const sheet = (cells: string) => `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${cells}</row></sheetData></worksheet>`
    assert.equal(readSheetCells(sheet('<c r="A1" t="inlineStr"><is><t>A &amp; B</t></is></c><c r="B1"><v>7</v></c><c r="C1" t="n" />')).get(1)!.get(1), 'A & B')
    assert.deepEqual([...readSheetCells(sheet('<c r="A1" t="inlineStr"><is><t>x</t></is></c><c r="B1"><v>7</v></c><c r="C1" t="n" />')).get(1)!.values()], ['x', 7, null])
    assert.throws(() => readSheetCells(sheet('<c r="A1"><f>1+1</f><v>2</v></c>')), /A1 holds a formula/)
    assert.throws(() => readSheetCells(sheet('<c r="A1"><v>2.5</v></c>')), /A1 holds the non-integer number 2.5/)
    assert.throws(() => readSheetCells(sheet('<c r="A1" s="1"><v>45000</v></c>'), [], [0, 14]), /A1 holds a number in format 14/)
    assert.throws(() => readSheetCells(sheet('<c r="A1" t="b"><v>1</v></c>')), /cell type "b"/)
    assert.equal(readSheetCells(sheet('<c r="A1" t="s"><v>1</v></c>'), ['zero', 'one']).get(1)!.get(1), 'one')
    assert.throws(() => readSheetCells(sheet('<c r="A1" t="s"><v>5</v></c>'), ['zero']), /shared string 5/)
}

function testIntegrityGate(): void {
    const result = validateSessionPlanningModel()
    assert.ok(result.valid, `Session Planning Model failed integrity: ${result.errors.slice(0, 6).join(' | ')}`)
}

/** The RC1.1 shape. A change here should be a deliberate workbook revision, not a surprise. */
function testRc1Shape(): void {
    // RC1.1 (Christian, 13 Sep): A05 Progress the Attack and A06 Finish Attacks, added so Attack
    // Development and Finishing have a natural guided entry point.
    assert.equal(sessionPlanningModel.learningGoals().length, 13, 'RC1.1 declares 13 Learning Goals.')
    assert.deepEqual(
        sessionPlanningModel.learningGoalsForPhase('Attacking').map((g) => String(g['ID'])),
        ['A01', 'A02', 'A03', 'A04', 'A05', 'A06']
    )
    assert.deepEqual(
        sessionPlanningModel.phases(),
        ['Attacking', 'Defending', 'Transition to Attack', 'Transition to Defend'],
        'RC1 declares four phases, in authoring order.'
    )
    // Cycle 8: 12 original + 57 merged from the verified runtime extraction, including the judgment
    // phrases resolved by Christian's D02/D03 coaching-intent distinction. RC1.1 adds 7 for A05/A06.
    // The RC1.1 file arrived without the Cycle 8 phrases; apply-rc1.1-package.py restores them, and
    // this count is what catches it if they are ever dropped again.
    assert.equal(sessionPlanningModel.entryLanguage().length, 76, 'Cycle 8 (69) + RC1.1 (7) entry phrases.')
    assert.equal(sessionPlanningModel.governanceRules().length, 6, 'RC1 declares 6 governance rules.')
}

/** Display order is a coaching decision, so it must survive loading rather than falling to file order. */
function testDisplayOrderPreserved(): void {
    for (const phase of sessionPlanningModel.phases()) {
        const goals = sessionPlanningModel.learningGoalsForPhase(phase)
        const orders = goals.map((g) => Number(g['Display Order']))
        assert.deepEqual(
            orders,
            [...orders].sort((a, b) => a - b),
            `${phase} Learning Goals are not in display order.`
        )
    }

    // Spot-pin the first attacking goal — the first thing a coach sees.
    const attacking = sessionPlanningModel.learningGoalsForPhase('Attacking')
    assert.equal(attacking[0]['Learning Goal'], 'Play Out from the Back')
}

/**
 * The conditional step. A goal with situations must offer them in order; a goal without must return
 * an empty list so the application can continue automatically, per Implementation Guide Rule 3.
 */
function testPracticeSituationsResolve(): void {
    const withSituations = sessionPlanningModel.practiceSituationsFor('A01')
    assert.equal(withSituations.length, 4, 'A01 declares four Practice Situations.')
    assert.equal(withSituations[0]['Practice Situation'], 'Against High Pressure')

    // Every situation must belong to a goal that exists — proven for all, not just a sample.
    let total = 0
    for (const goal of sessionPlanningModel.learningGoals()) {
        total += sessionPlanningModel.practiceSituationsFor(String(goal['ID'])).length
    }
    assert.equal(total, 20, 'Every Practice Situation must be reachable from its parent Learning Goal.')

    assert.deepEqual(sessionPlanningModel.practiceSituationsFor('NOPE'), [], 'An unknown goal yields no situations.')
}

/**
 * ENGINE TRANSLATION — approved and applied at RC1.1 (Cycle 8 §4).
 *
 * This test previously asserted zero populated rows, deliberately, so that populating the bridge
 * would force a conscious update rather than appearing silently. It fired exactly as intended when
 * the Cycle 8 decisions landed, and is now updated to the approved state.
 *
 * Nine of eleven were mapped. A01 and A04 remained EMPTY by explicit decision (Cycle 8 §5: "No
 * placeholder mappings should be introduced") — they are runtime realization opportunities rather
 * than knowledge deficiencies, so an empty cell here is the correct recorded answer, not an omission.
 *
 * **Ten since 15 October 2026.** Christian: "I approve Gain Access as the primary Game Problem for Play Out from
 * the Back … This resolves the Cycle 8 translation gap for this Learning Goal through the approved context rather
 * than inference from the goal's wording." A01 is GP-005, primary only ("Let's retain our existing decision to
 * defer secondary Game Problems"), written into the workbook and its projection by
 * apply-spm-2026-10-15-a01-game-problem.ts. A04 stays the one intentional gap.
 */
function testEngineTranslationMatchesApprovedRc11(): void {
    const status = translationStatus()
    assert.equal(status.total, 13, 'Every Learning Goal must have an Engine Translation row.')
    assert.equal(status.populated, 10, 'Cycle 8 approved nine mappings; his 15 October item 1 approved A01.')
    assert.deepEqual(
        status.unpopulated.sort(),
        ['A04', 'A05', 'A06'],
        'A04 is the intentional runtime gap; A05 and A06 are new at RC1.1 and not yet translated. ' +
            'Any other unmapped goal is a regression.'
    )

    // The two kinds of unmapped must stay distinguishable in the workbook itself: A04 was looked
    // at and deliberately left EMPTY; A05/A06 have not been looked at yet, and say TBD.
    const raw = (id: string) =>
        (workbook as unknown as { engine_translation: Array<Record<string, unknown>> }).engine_translation.find(
            (r) => r['Learning Goal ID'] === id
        )
    for (const gap of ['A04']) assert.equal(raw(gap)?.['Primary GP IDs'], null, `${gap} is an intentional gap, not TBD`)
    for (const pending of ['A05', 'A06']) assert.equal(raw(pending)?.['Primary GP IDs'], 'TBD', `${pending} is pending, not a gap`)
    // A01 carries his ruling, and its note says the ruling authorizes no vocabulary-derived constraint.
    assert.equal(raw('A01')?.['Primary GP IDs'], 'GP-005')
    assert.equal(raw('A01')?.['Secondary GP IDs'], null, 'no secondary: the Cycle 8 §4 deferral is retained')
    assert.ok(String(raw('A01')?.['Notes']).startsWith('Approved 2026-10-15 (Christian, A01 decision 1)'), String(raw('A01')?.['Notes']))

    // Spot-pin two approved mappings so a silent change to the canonical workbook is caught.
    assert.deepEqual(gameProblemsForLearningGoal('A02')?.primary, ['GP-015'])
    assert.deepEqual(gameProblemsForLearningGoal('D02')?.primary, ['GP-016'])
    assert.deepEqual(gameProblemsForLearningGoal('A01'), { primary: ['GP-005'], secondary: [] }, 'his 15 October item 1')

    // `null` rather than an empty array for a gap: "no mapping" and "no game problems apply" are
    // opposite meanings, and the Implementation Guide requires failing loudly over defaulting.
    assert.equal(gameProblemsForLearningGoal('A04'), null, 'An intentional gap must report null, not empty.')
    assert.equal(gameProblemsForLearningGoal('NOPE'), null, 'An unknown Learning Goal must report null.')

    // Cycle 8 §4 defers secondary Game Problems to a future version, so none should be recorded.
    for (const goal of sessionPlanningModel.learningGoals()) {
        const mapping = gameProblemsForLearningGoal(String(goal['ID']))
        assert.deepEqual(mapping?.secondary ?? [], [], `${String(goal['ID'])} records a secondary GP; RC1.1 approves primary only.`)
    }
}

/** Entry language is a navigation hint. It must resolve, and it must not invent goals. */
function testEntryLanguageResolves(): void {
    assert.equal(sessionPlanningModel.learningGoalIdForPhrase('build from the back'), 'A01')
    assert.equal(sessionPlanningModel.learningGoalIdForPhrase('  Win The Ball Back  '), 'D02', 'Lookup is forgiving of case and spacing.')
    assert.equal(sessionPlanningModel.learningGoalIdForPhrase('nonsense phrase'), null)

    // RC1.1 (Christian, 13 Sep) — his semantic rule: language about CREATING an opportunity belongs to
    // Create Scoring Chances; language about EXECUTING or CONVERTING one that exists belongs to Finish
    // Attacks. Pinned so a later vocabulary edit cannot quietly put them back together.
    for (const phrase of ['shoot', 'shot', 'shooting', 'convert chance']) {
        assert.equal(sessionPlanningModel.learningGoalIdForPhrase(phrase), 'A06', `"${phrase}" is conversion language`)
    }
    for (const phrase of ['get a shot', 'create chances']) {
        assert.equal(sessionPlanningModel.learningGoalIdForPhrase(phrase), 'A03', `"${phrase}" is creation language`)
    }
}

/** RC1.1: every Guided Learning Goal routes to exactly one Representative Performance Context. */
function testEveryGoalRoutesToOneContext(): void {
    const routes = sessionPlanningModel.rpcRouting()
    assert.equal(routes.length, 13)
    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        assert.equal(routes.filter((r) => r.learningGoalId === id).length, 1, `${id} must route exactly once`)
    }
    assert.equal(routes.find((r) => r.learningGoalId === 'A06')?.rpcId, 'RPC-005', 'Finish Attacks routes to Finishing.')
}

/** Negative cases — proving the gate bites, not merely that it passes on a healthy workbook. */
function testGateCatchesBrokenReferences(): void {
    const healthy = {
        source_workbook: 'test',
        header_row: 1,
        learning_goals: [{ ID: 'A01', Phase: 'Attacking', 'Display Order': 1, 'Learning Goal': 'Goal', 'Coach Definition': 'Def' }],
        practice_situations: [{ ID: 'A01-01', 'Parent ID': 'A01', 'Display Order': 1, 'Practice Situation': 'Sit' }],
        entry_language: [{ 'Coach Phrase': 'phrase', 'Learning Goal ID': 'A01' }],
        engine_translation: [{ 'Learning Goal ID': 'A01', 'Primary GP IDs': 'TBD' }],
        governance: [{ Rule: 'Coach language first.' }],
        rpc_routing: [{ 'Learning Goal ID': 'A01', 'Routed RPC ID': 'RPC-001' }],
    }
    const damaged = (mutate: (d: typeof healthy) => void) => {
        const copy = JSON.parse(JSON.stringify(healthy)) as typeof healthy
        mutate(copy)
        return validateSessionPlanningModel(copy as never).errors
    }

    assert.deepEqual(validateSessionPlanningModel(healthy as never).errors, [], 'A healthy workbook must produce no errors.')

    assert.ok(
        damaged((d) => {
            d.practice_situations[0]['Parent ID'] = 'GONE'
        }).some((e) => e.includes('disappears')),
        'An orphaned Practice Situation must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.entry_language[0]['Learning Goal ID'] = 'GONE'
        }).some((e) => e.includes('does not exist')),
        'A phrase pointing at a missing goal must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.engine_translation = []
        }).some((e) => e.includes('reach nothing')),
        'A goal with no Engine Translation row must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.learning_goals.push({ ...d.learning_goals[0] })
        }).some((e) => e.includes('Duplicate Learning Goal')),
        'A duplicate goal ID must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.learning_goals[0]['Coach Definition'] = ''
        }).some((e) => e.includes('Coach Definition')),
        'A goal with no coach-facing definition must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.rpc_routing[0]['Learning Goal ID'] = 'GONE'
        }).some((e) => e.includes('RPC Routing names Learning Goal "GONE"')),
        'A route for a goal that does not exist must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.rpc_routing = []
        }).some((e) => e.includes('0 RPC Routing rows')),
        'A goal with no route must be caught.'
    )
    assert.ok(
        damaged((d) => {
            d.rpc_routing.push({ ...d.rpc_routing[0] })
        }).some((e) => e.includes('2 RPC Routing rows')),
        'A goal routed twice must be caught.'
    )
}

function runAll(): void {
    testIntegrityGate()
    testCommittedJsonIsTheWorkbookProjection()
    testReaderRefusesWhatItCannotMirror()
    testRc1Shape()
    testDisplayOrderPreserved()
    testPracticeSituationsResolve()
    testEngineTranslationMatchesApprovedRc11()
    testEntryLanguageResolves()
    testEveryGoalRoutesToOneContext()
    testGateCatchesBrokenReferences()
    console.log('session-planning-model unit tests: all cases passed.')
}

runAll()
