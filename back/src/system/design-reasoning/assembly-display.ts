/**
 * **Display texts for the assembly experiment, read from knowledge cells after the decisions** — presentation only (Christian's second reply
 * of 5 November 2026, the bounded assembly experiment). This is the one stage file that reads narrative cells, and it reads only the cells
 * on its allowlist: a Learning Goal's coach-facing definition (the learning purpose: his 21 October ruling names it the primary source) and
 * display name, a Game Problem's name, a Game Form's name, the context library's controlled-vocabulary description of a scoring event, and a
 * context property's text. Each text is returned with its citation, verbatim, for the coach text and the report; the assembly receives them
 * as an argument after every decision is made, so no decision reads them. A static test pins the allowlist and that only the runner and the
 * unit tests import this file. No goal, Game Problem, context, Game Form or row id appears here: the rows to read come from the record.
 */
import { DisplayTexts, Experiment, KnowledgeRef, relationshipRelatedId } from './assembly'
import { GameFormSelection } from './forms'
import { cell, Cite, DesignKnowledge, SOURCE } from './knowledge'
import { DesignResolution } from './resolve'

type Row = Record<string, unknown>

/** The only cells this file reads: source, table, the key column a row is found by, and the display column. */
export const DISPLAY_ALLOWLIST: ReadonlyArray<{ source: string; table: string; keyColumn: string; column: string }> = [
    { source: 'planning', table: 'learning_goals', keyColumn: 'ID', column: 'Coach Definition' },
    { source: 'planning', table: 'learning_goals', keyColumn: 'ID', column: 'Learning Goal' },
    { source: 'gameProblems', table: 'gameProblems', keyColumn: 'ID', column: 'Name' },
    { source: 'sportModule', table: 'game_forms', keyColumn: 'game_form_id', column: 'game_form_name' },
    { source: 'contexts', table: 'controlled_vocabulary', keyColumn: 'value', column: 'description' },
    { source: 'contexts', table: 'properties', keyColumn: 'property_id', column: 'property_text' },
]

const FILES: Record<string, string> = { planning: SOURCE.planning, gameProblems: SOURCE.gameProblems, sportModule: SOURCE.sportModule, contexts: SOURCE.contexts }

/**
 * One allowlisted cell, verbatim, with its citation. A vocabulary row is named `<vocabulary> <value>`. A reference outside the allowlist,
 * or a row that is missing or empty, throws: a display text is never guessed.
 */
export function displayCell(k: DesignKnowledge, ref: KnowledgeRef): { text: string; cite: Cite } {
    const allowed = DISPLAY_ALLOWLIST.find((a) => a.source === ref.source && a.table === ref.table && a.column === ref.column)
    if (!allowed) throw new Error(`display reader: ${ref.source} ${ref.table} ${String(ref.column)} is not on the allowlist`)
    const rows = (((k as unknown as Record<string, Record<string, Row[]>>)[ref.source] ?? {})[ref.table] ?? []) as Row[]
    let vocabulary: string | null = null
    let key = ref.row
    if (ref.table === 'controlled_vocabulary') {
        const space = ref.row.indexOf(' ')
        if (space < 0) throw new Error(`display reader: a vocabulary row is named "<vocabulary> <value>", not "${ref.row}"`)
        vocabulary = ref.row.slice(0, space)
        key = ref.row.slice(space + 1)
    }
    const found = rows.filter((r) => cell(r, allowed.keyColumn) === key && (vocabulary === null || cell(r, 'vocabulary') === vocabulary))
    if (found.length !== 1) throw new Error(`display reader: ${found.length} rows for ${ref.source} ${ref.table} ${ref.row}`)
    const raw = found[0][allowed.column]
    if (typeof raw !== 'string' || !raw.length) throw new Error(`display reader: ${ref.source} ${ref.table} ${ref.row} ${String(ref.column)} is empty`)
    return { text: raw, cite: { file: FILES[ref.source], table: ref.table, row: `${ref.row} ${String(ref.column)}` } }
}

/** Every display text the assembly needs: the cells its record reads, the names of the ids the computation returns, the goal's name. */
export function displayTextsFor(k: DesignKnowledge, experiment: Experiment, resolution: DesignResolution, forms: GameFormSelection, goalNameColumn: string): DisplayTexts {
    const cells: DisplayTexts['cells'] = {}
    const names: DisplayTexts['names'] = {}
    const gameProblemIds = new Set<string>([...resolution.gameProblems.primary, ...resolution.gameProblems.secondary])
    for (const c of experiment.choices) {
        if (c.readBy === 'DISPLAY_CELL') cells[c.path] = displayCell(k, c.knowledgeRef as KnowledgeRef)
        if (c.readBy === 'CONTEXT_RELATIONSHIP_ROW' && resolution.context) gameProblemIds.add(relationshipRelatedId(k, resolution.context.rpcId, c.knowledgeRef as KnowledgeRef).relatedId)
    }
    for (const f of resolution.profile?.findings ?? []) {
        gameProblemIds.add(f.primary.gameProblemId)
        gameProblemIds.add(f.secondary.gameProblemId)
    }
    for (const id of [...gameProblemIds].sort()) names[id] = displayCell(k, { source: 'gameProblems', table: 'gameProblems', row: id, column: 'Name' })
    for (const id of forms.compatible) names[id] = displayCell(k, { source: 'sportModule', table: 'game_forms', row: id, column: 'game_form_name' })
    const goalName = displayCell(k, { source: 'planning', table: 'learning_goals', row: experiment.learningGoalId, column: goalNameColumn })
    return { cells, names, goalName }
}
