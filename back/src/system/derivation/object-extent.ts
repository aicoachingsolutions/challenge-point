/**
 * **What may stand on an object's position rows where no knowledge gives the object a dimension** — stage B review fix, 23 October 2026
 * (register version 17, `objectGeometry`). Christian, reply filed 25 October 2026, item 3: *"Goal dimensions and suitability should be
 * determined through approved [sport] knowledge and available equipment. Please identify any missing knowledge decisions needed here rather
 * than inventing dimensions or treating every goal as interchangeable."*
 *
 * A provisional realization (`corpus.ts`, its integrity gate) and a realization choice (`realize.ts`, as each choice closes its line) are
 * ours, not his, so on an object's along or across position they may write only a value whose extent comes from a stated source or is none.
 * An ALLOWLIST, not a list of what is refused, so a term added to the register later cannot become an object's extent unread:
 *
 *   - **a position measured from a team's end line with no depth** (RC-21's "own end (of team T)" or "attacking end (of team T)", typed
 *     {term, forTeam, offsetM} with `offsetM.from` equal to `offsetM.to`), on the axis those end-line anchors are on;
 *   - **a centred term on its own axis** (a register term of kind `centred`, whose extent the realizer takes only from a REQUIRED extent or
 *     the width the session states, and which refuses without one).
 *
 * Everything else is refused, named: an extent in metres (a bare number or interval), a depth from an end line, a fraction-of-axis term
 * ("full extent", "bounded minority"), a phrase, a relative position, or a centred term on the other axis. Which extent such an object
 * should have is a knowledge decision still to be made, never a placeholder. Corpus knowledge and his ruled restatements are not read here.
 *
 * Sport-neutral: the rows and the terms are the register's; nothing here names an object kind.
 */
import { teamEndPositionOf } from './types'

export interface ObjectPositionRows {
    alongRow: string
    acrossRow: string
}

const SOURCE = "an object's dimensions come from the session or from approved knowledge, never a placeholder"

/**
 * Why `value`, written on `row`, would give an object an extent no stated source gives — or null where it is admitted, or where `row` is no
 * object position row (or the register names none). `terms` are the register's machine-readable relative terms (`relativeTerms.machineReadable
 * .terms`).
 */
export function objectPositionRefusal(row: string, value: unknown, rows: ObjectPositionRows | null, terms: Record<string, any>): string | null {
    if (!rows || (row !== rows.alongRow && row !== rows.acrossRow)) return null
    const axis: 'along' | 'across' = row === rows.alongRow ? 'along' : 'across'
    const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n)
    const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null
    if (finite(value) || (record && finite(record.from) && finite(record.to) && record.term === undefined)) {
        return `writes an object's extent on ${row} in metres (${JSON.stringify(value)}) with no stated source: ${SOURCE}`
    }
    const fromEnd = teamEndPositionOf(value)
    if (fromEnd) {
        const definition = terms[fromEnd.term]
        const endLine = !!definition && definition.kind === 'anchor' && definition.axis === 'along' && (definition.at === 0 || definition.at === 1)
        if (!endLine) return `places an object on ${row} by ${JSON.stringify(fromEnd.term)}, which is no end-line anchor of the register, so nothing states where it is: ${SOURCE}`
        if (axis !== 'along') return `places an object on ${row} (its ${axis} position) by ${JSON.stringify(fromEnd.term)}, an end-line anchor on the along axis, so nothing states where it is: ${SOURCE}`
        if (fromEnd.offsetM.to > fromEnd.offsetM.from) return `gives an object on ${row} a depth of ${fromEnd.offsetM.to - fromEnd.offsetM.from} m from a team's end line with no stated source: ${SOURCE}`
        return null
    }
    if (record && typeof record.term === 'string' && Object.keys(record).every(key => key === 'term' || key === 'asAuthored')) {
        const definition = terms[record.term]
        if (definition && definition.kind === 'centred') {
            if (definition.axis === axis) return null
            return `centres an object on ${row} (its ${axis} position) by ${JSON.stringify(record.term)}, which centres on the ${definition.axis} axis, so its extent would be taken from the other axis: ${SOURCE}`
        }
    }
    return `places an object on ${row} by ${JSON.stringify(value)}, which is neither a position on a team's end line with no depth nor a centred term on its ${axis} axis, so its extent would come from no stated source: ${SOURCE}`
}
