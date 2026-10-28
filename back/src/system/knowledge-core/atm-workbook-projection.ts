/**
 * The Affordance Target Matrix workbook, read and projected without Python, so the projection can be PROVED.
 *
 * Added for item B1 (after his reply filed 30 October 2026). `affordance-target-matrix.ts` said the committed workbook
 * (back/data/knowledge-core/Affordance_Target_Matrix_RC1_2_Canonical.xlsx) was "projected completely" into
 * atm-workbook.rc1.2.json. It was not: the generator was never committed, and the JSON carried the Version Metadata
 * sheet as key -> value only, so its `required` and `notes` columns were lost, among them his one-line definitions
 * of the four affordances (D29-D32) and the notes on the GP-004 audit and the GP-015 flag (D38, D39). Nothing could
 * see it, because nothing read the workbook. This module reads it with no dependency; `atm-workbook-projection.unit.ts`
 * requires the committed JSON to be exactly this projection and, separately, every populated cell of every sheet to
 * be found in the JSON. A projection is only proved by a consumer (the silent-loss lesson); that test is the consumer.
 *
 * THE PROJECTION (the first three keys reproduce the JSON committed on 21 July 2026 byte for byte; the last two
 * were added by B1, after them, so nothing already there moved):
 *   metadata             Version Metadata: metadata_key -> metadata_value (the loader's long-standing map).
 *   gameProblemRegistry  Game Problem Registry: one object per data row, header -> value.
 *   ratings              Ratings Grid: likewise.
 *   metadataRows         Version Metadata: likewise, so `required` and `notes` are carried.
 *   sheets               Every sheet in workbook order: its name, its title cell (A1) and its header row.
 * In every row object an empty cell is omitted (as the committed JSON always omitted GP-003's empty
 * evidence_source); strings are kept exactly as written, untrimmed; a boolean cell is true/false; a number an integer.
 * Written as JSON.stringify(…, null, 1) with no trailing newline, LF: the committed file's own format.
 *
 * IT REFUSES RATHER THAN DROPS. A sheet not declared below, a populated cell above the header row other than the
 * title, a populated cell in a column with no header, a data row with no key, a duplicated key or header, a formula,
 * a non-integer number, a number in a non-general format or naming a style the workbook does not define, an error or
 * date cell, and an element this reader does not parse inside sheetData each throw, naming what was found. Each of
 * those would otherwise be lost silently.
 *
 * Regenerate (from back/): node node_modules/ts-node/dist/bin.js --files src/scripts/project-atm-workbook.ts
 */
import { columnOf, readSharedStrings, readStyleNumberFormats, readZipEntries, xmlAttributes, xmlText, zipEntryData } from '../session-planning/workbook-projection'

export type AtmCellValue = string | number | boolean

/** The sheets the workbook holds, in its order, each with the key its data rows are projected under. */
export const ATM_SHEETS: ReadonlyArray<readonly [string, string]> = [
    ['Game Problem Registry', 'gameProblemRegistry'],
    ['Ratings Grid', 'ratings'],
    ['Version Metadata', 'metadataRows'],
]

/** Row 1 holds each sheet's title in A1, row 2 is empty, row 3 holds the headers; data starts at row 4. */
export const ATM_TITLE_ROW = 1
export const ATM_HEADER_ROW = 3

const MAIN_NAMESPACE = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

/**
 * The workbook writes every element with a prefix bound to the SpreadsheetML namespace (`<x:c …>`). The prefix bound
 * to that namespace on the root element is removed from element names, so one set of patterns reads either form.
 * Only that prefix is removed: any other prefixed element left inside sheetData is refused by `readAtmSheetCells`.
 */
export function withoutMainPrefix(xml: string): string {
    // The first element (an XML declaration starts with "<?", which a name cannot) is the root.
    const root = xml.match(/<[A-Za-z_][\w.:-]*\b[^>]*>/)
    if (!root) return xml
    const binding = [...root[0].matchAll(/xmlns:([A-Za-z_][\w.-]*)="([^"]*)"/g)].find(match => match[2] === MAIN_NAMESPACE)
    if (!binding) return xml
    const prefix = binding[1]
    return xml.split(`<${prefix}:`).join('<').split(`</${prefix}:`).join('</')
}

/** The text of an inline string, every `<t>` run joined. Phonetic runs are refused rather than joined in. */
function inlineStringText(inner: string, where: string): string {
    if (inner.includes('<rPh')) throw new Error(`ATM workbook: ${where} carries phonetic runs, which are not read`)
    let out = ''
    for (const match of inner.matchAll(/<t(?:\s[^>]*)?(?:\/>|>([^<]*)<\/t>)/g)) out += xmlText(match[1] ?? '')
    return out
}

/**
 * One worksheet's POPULATED cells, as row -> column -> value. A cell with no value, or an empty string, is absent.
 * Every `<row>` and `<c>` element in sheetData must be parsed, so a cell this reader cannot see is an error, not a gap.
 */
export function readAtmSheetCells(rawXml: string, sharedStrings: string[], numberFormats: number[], sheetName: string): Map<number, Map<number, AtmCellValue>> {
    const xml = withoutMainPrefix(rawXml)
    const sheetData = xml.match(/<sheetData\b[^>]*?(?:\/>|>([\s\S]*?)<\/sheetData>)/)
    if (!sheetData) throw new Error(`ATM workbook: sheet "${sheetName}" has no sheetData`)
    const body = sheetData[1] ?? ''
    const stray = body.match(/<\/?[A-Za-z_][\w.-]*:[A-Za-z_]/)
    if (stray) throw new Error(`ATM workbook: sheet "${sheetName}" holds a prefixed element (${stray[0]}…) this reader does not parse`)
    const rows = new Map<number, Map<number, AtmCellValue>>()
    let rowElements = 0
    let cellElements = 0
    for (const row of body.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
        rowElements++
        const rowNumber = Number(xmlAttributes(row[1]).r)
        if (!Number.isInteger(rowNumber) || rowNumber < 1) throw new Error(`ATM workbook: a row in "${sheetName}" has no number`)
        if (rows.has(rowNumber)) throw new Error(`ATM workbook: row ${rowNumber} of "${sheetName}" appears twice`)
        const cells = new Map<number, AtmCellValue>()
        for (const cell of (row[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
            cellElements++
            const attributes = xmlAttributes(cell[1])
            const reference = attributes.r
            if (!reference) throw new Error(`ATM workbook: a cell in row ${rowNumber} of "${sheetName}" has no reference`)
            if (Number(reference.replace(/^[A-Z]+/, '')) !== rowNumber) throw new Error(`ATM workbook: ${sheetName}!${reference} sits in row ${rowNumber}`)
            const where = `${sheetName}!${reference}`
            const inner = cell[2] ?? ''
            if (/<f[\s>/]/.test(inner)) throw new Error(`ATM workbook: ${where} holds a formula; its cached value is not a written value, so it is refused`)
            const type = attributes.t ?? 'n'
            const v = inner.match(/<v(?:\s[^>]*)?>([^<]*)<\/v>/)
            let value: AtmCellValue | null
            if (type === 'str') {
                value = v ? xmlText(v[1]) : null
            } else if (type === 'inlineStr') {
                const is = inner.match(/<is(?:\s[^>]*)?>([\s\S]*?)<\/is>/)
                value = is ? inlineStringText(is[1], where) : null
            } else if (type === 's') {
                const index = Number(v?.[1])
                if (!v || !Number.isInteger(index) || index < 0 || index >= sharedStrings.length) throw new Error(`ATM workbook: ${where} names shared string ${v?.[1]}, which does not exist`)
                value = sharedStrings[index]
            } else if (type === 'b') {
                if (!v) value = null
                else if (v[1] === '1' || v[1] === '0') value = v[1] === '1'
                else throw new Error(`ATM workbook: ${where} is a boolean holding "${v[1]}", which is refused`)
            } else if (type === 'n') {
                if (!v) {
                    value = null
                } else {
                    const text = v[1]
                    if (!/^-?[0-9]+$/.test(text) || !Number.isSafeInteger(Number(text))) throw new Error(`ATM workbook: ${where} holds the non-integer number ${text}, which is refused`)
                    // No style named and no cellXfs at all is General; a style the workbook does not hold is refused.
                    const format = attributes.s === undefined && !numberFormats.length ? 0 : numberFormats[Number(attributes.s ?? 0)]
                    if (format === undefined) throw new Error(`ATM workbook: ${where} names style ${attributes.s ?? 0}, which the workbook's cellXfs does not hold, so its number format is unknown and it is refused`)
                    if (format !== 0) throw new Error(`ATM workbook: ${where} holds a number in format ${format} (a date or formatted number), which is refused`)
                    value = Number(text)
                }
            } else {
                throw new Error(`ATM workbook: ${where} has cell type "${type}", which is not read`)
            }
            if (value === null || value === '') continue
            const column = columnOf(reference)
            if (cells.has(column)) throw new Error(`ATM workbook: ${where} appears twice`)
            cells.set(column, value)
        }
        rows.set(rowNumber, cells)
    }
    // Every element counted must have been parsed by the patterns above; a mismatch means a cell went unseen.
    const rowTags = (body.match(/<row\b/g) ?? []).length
    const cellTags = (body.match(/<c\b/g) ?? []).length
    if (rowTags !== rowElements || cellTags !== cellElements) {
        throw new Error(`ATM workbook: "${sheetName}" has ${rowTags} rows and ${cellTags} cells, but ${rowElements} and ${cellElements} were parsed`)
    }
    return rows
}

/** The workbook opened from its bytes: sheet names in workbook order, and each sheet's populated cells. */
export interface AtmWorkbookCells {
    sheetNames: string[]
    cells: (sheetName: string) => Map<number, Map<number, AtmCellValue>>
}

export function openAtmWorkbook(zip: Buffer): AtmWorkbookCells {
    const entries = new Map(readZipEntries(zip).map(entry => [entry.name, entry]))
    const read = (name: string): string | null => {
        const entry = entries.get(name)
        return entry ? zipEntryData(zip, entry).toString('utf8') : null
    }
    const workbook = read('xl/workbook.xml')
    const rels = read('xl/_rels/workbook.xml.rels')
    if (!workbook || !rels) throw new Error('ATM workbook: xl/workbook.xml or its relationships are missing')
    const targets = new Map<string, string>()
    for (const match of rels.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
        const attributes = xmlAttributes(match[1])
        targets.set(attributes.Id, attributes.Target.startsWith('/') ? attributes.Target.slice(1) : `xl/${attributes.Target}`)
    }
    const sheets = new Map<string, string>()
    const workbookXml = withoutMainPrefix(workbook)
    for (const match of workbookXml.matchAll(/<sheet\b([^>]*?)\/?>/g)) {
        const attributes = xmlAttributes(match[1])
        const target = targets.get(attributes['r:id'])
        if (!target) throw new Error(`ATM workbook: sheet "${attributes.name}" has no relationship target`)
        sheets.set(attributes.name, target)
    }
    if ((workbookXml.match(/<sheet\b/g) ?? []).length !== sheets.size) throw new Error('ATM workbook: a sheet entry in xl/workbook.xml was not read')
    const shared = read('xl/sharedStrings.xml')
    const styles = read('xl/styles.xml')
    const sharedStrings = readSharedStrings(shared ? withoutMainPrefix(shared) : null)
    const numberFormats = readStyleNumberFormats(styles ? withoutMainPrefix(styles) : null)
    return {
        sheetNames: [...sheets.keys()],
        cells: (sheetName: string) => {
            const target = sheets.get(sheetName)
            const xml = target ? read(target) : null
            if (!xml) throw new Error(`ATM workbook: sheet "${sheetName}" is missing`)
            return readAtmSheetCells(xml, sharedStrings, numberFormats, sheetName)
        },
    }
}

/** One cell reference, for messages: (3, 4) -> D3. */
export function cellReference(row: number, column: number): string {
    let letters = ''
    for (let n = column; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters
    return `${letters}${row}`
}

export interface AtmProjectedSheet {
    name: string
    title: string
    headers: string[]
    rows: Record<string, AtmCellValue>[]
}

/** One sheet by the rules in the header: title, headers, and one object per populated data row. */
export function projectAtmSheet(cells: Map<number, Map<number, AtmCellValue>>, name: string): AtmProjectedSheet {
    for (const [rowNumber, row] of cells) {
        if (rowNumber >= ATM_HEADER_ROW) continue
        for (const column of row.keys()) {
            if (rowNumber !== ATM_TITLE_ROW || column !== 1) throw new Error(`ATM workbook: ${name}!${cellReference(rowNumber, column)} lies above the header row and is not the title`)
        }
    }
    const title = cells.get(ATM_TITLE_ROW)?.get(1)
    if (typeof title !== 'string') throw new Error(`ATM workbook: "${name}" has no title in A${ATM_TITLE_ROW}`)
    const headerCells = cells.get(ATM_HEADER_ROW) ?? new Map<number, AtmCellValue>()
    const headers: string[] = []
    for (let column = 1; column <= headerCells.size; column++) {
        const header = headerCells.get(column)
        if (typeof header !== 'string') throw new Error(`ATM workbook: ${name}!${cellReference(ATM_HEADER_ROW, column)} must be a header (the header row is contiguous text from A)`)
        if (headers.includes(header)) throw new Error(`ATM workbook: "${name}" repeats the header "${header}"`)
        headers.push(header)
    }
    if (!headers.length) throw new Error(`ATM workbook: "${name}" has no header row`)
    const rows: Record<string, AtmCellValue>[] = []
    const keys = new Set<AtmCellValue>()
    for (const rowNumber of [...cells.keys()].filter(n => n > ATM_HEADER_ROW).sort((a, b) => a - b)) {
        const row = cells.get(rowNumber)!
        if (!row.size) continue
        for (const column of row.keys()) {
            if (column > headers.length) throw new Error(`ATM workbook: ${name}!${cellReference(rowNumber, column)} is populated but its column has no header`)
        }
        const key = row.get(1)
        if (key === undefined) throw new Error(`ATM workbook: ${name} row ${rowNumber} has no ${headers[0]}`)
        if (keys.has(key)) throw new Error(`ATM workbook: ${name} repeats the ${headers[0]} "${String(key)}"`)
        keys.add(key)
        const projected: Record<string, AtmCellValue> = {}
        headers.forEach((header, index) => {
            const value = row.get(index + 1)
            if (value !== undefined) projected[header] = value
        })
        rows.push(projected)
    }
    return { name, title, headers, rows }
}

/** The whole projection, as an object, in the key order described in the header. */
export function projectAtmWorkbookObject(zip: Buffer): Record<string, unknown> {
    const workbook = openAtmWorkbook(zip)
    const declared = ATM_SHEETS.map(([name]) => name)
    const undeclared = workbook.sheetNames.filter(name => !declared.includes(name))
    if (undeclared.length) throw new Error(`ATM workbook: sheet(s) not projected anywhere: ${undeclared.join(', ')}`)
    const missing = declared.filter(name => !workbook.sheetNames.includes(name))
    if (missing.length) throw new Error(`ATM workbook: expected sheet(s) missing: ${missing.join(', ')}`)
    const sheets = new Map(workbook.sheetNames.map(name => [name, projectAtmSheet(workbook.cells(name), name)]))
    const rowsOf = (name: string) => sheets.get(name)!.rows
    const metadata: Record<string, AtmCellValue> = {}
    for (const row of rowsOf('Version Metadata')) {
        const key = row['metadata_key']
        const value = row['metadata_value']
        if (typeof key !== 'string' || value === undefined) throw new Error(`ATM workbook: a Version Metadata row lacks metadata_key or metadata_value (${JSON.stringify(row)})`)
        metadata[key] = value
    }
    return {
        metadata,
        gameProblemRegistry: rowsOf('Game Problem Registry'),
        ratings: rowsOf('Ratings Grid'),
        metadataRows: rowsOf('Version Metadata'),
        sheets: workbook.sheetNames.map(name => ({ name, title: sheets.get(name)!.title, headers: sheets.get(name)!.headers })),
    }
}

/** The projection as the committed file is written: indent 1, non-ASCII kept, no trailing newline, LF. */
export function projectAtmWorkbook(zip: Buffer): string {
    return JSON.stringify(projectAtmWorkbookObject(zip), null, 1)
}
