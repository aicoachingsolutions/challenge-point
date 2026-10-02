/**
 * Does bounded placement authority actually fit every placement line — or would it swallow something?
 *
 * His rule, before it may be implemented generally:
 *
 *   > Authorize realization to choose metric placement where the element's existence is already
 *   > established; the representation establishes the structural relationship/function that placement
 *   > must preserve; the session envelope supplies the outer geometric boundary; no selected object
 *   > authors a more specific placement or bound; the choice creates no new structure and alters no
 *   > authored relationship; and the realized value is recorded as a realization choice.
 *
 * And the condition that makes the test worth running rather than assuming:
 *
 *   > *I specifically want to know whether any of the thirteen require more than placement — whether
 *   > choosing their value would determine a relationship, function, trigger, consequence or tactical
 *   > condition that the knowledge did not establish. If any do, return those separately rather than
 *   > allowing this rule to swallow them.*
 *
 * So this checks each line against each condition **and** looks for the swallow case: a placement
 * whose value something else in the representation depends on. A placement that another line
 * references is not only a placement — choosing it would settle that reference too.
 *
 * Run: npm run corpus:placement
 */
import { corpusInput } from './corpus'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'

/** The four rows his authority would cover. */
const PLACEMENT_ROWS = new Set(['S5', 'S6', 'O4', 'O5'])

const input = corpusInput()
const result = runDerivation(input)
if (isStampedHalt(result)) {
    console.error('halted')
    process.exit(1)
}
const staged: any = runStages0to10(input)
const index = indexRegister(input.register)
const game = assembleResolvedGame(result, staged.classes, index)
const classById = new Map<string, any>(staged.classes.map((c: any) => [c.classId, c]))

const lines = game.notEstablished.filter(e => PLACEMENT_ROWS.has(e.lineId.split('::').pop()!))

/**
 * Does anything in the representation refer to this element in a way that placement would settle?
 *
 * This is the swallow test. A region that a trigger, an objective or a value condition points at is
 * not a free piece of geometry: where it sits decides when the trigger fires or what scores. Choosing
 * its metres would then be choosing a tactical condition the knowledge never authored.
 */
function referencedBy(elementId: string): { lineId: string; path: string; value: string }[] {
    const hits: { lineId: string; path: string; value: string }[] = []
    for (const entry of result.resolution) {
        if (entry.state !== 'derived' || entry.elementId === elementId) continue
        const text = JSON.stringify(entry.value ?? '')
        if (!text || text === 'null') continue
        // A reference is either the class id itself, or the authoring item id the class is named for.
        const cls = classById.get(elementId)
        const itemId = cls?.fromItem?.itemId
        if (text.includes(elementId) || (itemId && text.includes(itemId))) {
            const row = index.rows.get(entry.row) as any
            hits.push({ lineId: entry.lineId, path: row?.path ?? entry.row, value: String(entry.value).slice(0, 120) })
        }
    }
    return hits
}

/** Does any selected object author a more specific placement or bound on this line? */
function authoredBounds(lineId: string): unknown[] {
    const record = staged.derived.lines.get(lineId)
    return [...(record?.bounding ?? []).map((b: any) => b.bound), ...(record?.entailing ?? []).map((e: any) => e.value)]
}

console.log('PATTERN 2 — TESTING BOUNDED PLACEMENT AUTHORITY AGAINST EVERY LINE')
console.log('='.repeat(96))
console.log(`${lines.length} placement line(s) on S5, S6, O4, O5.\n`)

const swallowed: typeof lines = []
const clean: typeof lines = []

for (const line of lines) {
    const row = line.lineId.split('::').pop()!
    const cls = line.elementId ? classById.get(line.elementId) : null
    const registerRow = index.rows.get(row) as any
    const references = line.elementId ? referencedBy(line.elementId) : []
    const bounds = authoredBounds(line.lineId)

    console.log(`  ${line.path}`)
    console.log(`     row ${row}  (${registerRow?.valueType})`)
    console.log(`     existence established        ${cls ? `yes — ${cls.fromItem.contractId}::${cls.fromItem.itemId}` : 'NO'}`)
    console.log(`     register marks it fillable   ${registerRow?.fillable ? `yes — "${registerRow.fillable}"` : 'NO'}`)
    console.log(`     a more specific bound        ${bounds.length ? JSON.stringify(bounds) : 'none'}`)
    console.log(`     referenced elsewhere         ${references.length ? `${references.length} — SWALLOW RISK` : 'no'}`)
    for (const r of references) console.log(`         ${r.path}  <-  ${r.value}`)

    if (references.length || bounds.length) swallowed.push(line)
    else clean.push(line)
    console.log('')
}

console.log('\nRESULT')
console.log('-'.repeat(96))
console.log(`  placement only, the rule fits                 ${clean.length}`)
console.log(`  needs separate ruling (referenced or bounded) ${swallowed.length}`)
for (const line of swallowed) console.log(`     ${line.path}`)
console.log('\n  A line that is referenced elsewhere is not only a placement: choosing its metres would')
console.log('  settle whatever points at it. Those are returned rather than swallowed by the rule.')
