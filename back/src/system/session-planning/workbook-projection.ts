/**
 * The Session Planning Model workbook, read and projected without Python — so the projection can be PROVED.
 *
 * Added 15 October 2026 (stage G1). `session-planning-model.ts` says the .xlsx is canonical and the JSON its
 * complete projection, *"never hand-edit"*; the projector was `project-workbook.py`, and Python is absent here.
 * So nothing proved the committed JSON was the committed workbook's projection, and the next approval (his
 * 15 October item 1: *"I approve Gain Access as the primary Game Problem for Play Out from the Back"*) would
 * have had to be written into two files by hand and kept equal by care. This module reads the workbook with
 * no dependency and projects it by `project-workbook.py`'s own rules; `session-planning-model.unit.ts` projects
 * the committed xlsx and requires the committed JSON to equal it. A projection is only proved by a consumer
 * (the silent-loss lesson) — this is the consumer.
 *
 * THE RULES MIRRORED, from project-workbook.py: header row 1; the six declared sheets, each required; a row is
 * skipped only when EVERY cell in it is empty or blank text (header-less columns included, as `any(...)` over
 * the raw row reads them); every column with a non-empty header is kept, an empty cell as null; the output is
 * `json.dump(indent=2, ensure_ascii=False)` plus a newline — byte-identical to JSON.stringify(…, null, 2) for
 * strings, integers and null, which is all the workbook holds.
 *
 * IT REFUSES RATHER THAN GUESSES. openpyxl would read a formula's cached value, a date as a datetime and
 * 2.0 as a float; none occurs in this workbook (measured 14 October: inline strings and integer values only,
 * numFmtId 0 throughout) and each would project differently here than there. So a formula, a non-integer
 * number, a number in a non-general format, a boolean/error/formula-string cell, a ZIP64 or data-descriptor
 * archive and a CRC mismatch each throw, naming what was found. Shared strings (t="s") are read, because an
 * Excel-saved revision will use them.
 */
import { inflateRawSync } from 'zlib'

/** One entry of the archive's central directory, with what is needed to read it — or to copy it raw. */
export interface ZipEntry {
    name: string
    method: number
    flags: number
    crc32: number
    compressedSize: number
    uncompressedSize: number
    localHeaderOffset: number
}

const CRC_TABLE = (() => {
    const table = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        table[n] = c >>> 0
    }
    return table
})()

/** CRC-32 as ZIP computes it. Our own, so the check does not depend on which Node version has `zlib.crc32`. */
export function crc32(data: Buffer): number {
    let c = 0xffffffff
    for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
}

const EOCD = 0x06054b50
const CENTRAL = 0x02014b50
const LOCAL = 0x04034b50

/** Where the end-of-central-directory record starts. */
export function endOfCentralDirectory(zip: Buffer): number {
    for (let at = zip.length - 22; at >= Math.max(0, zip.length - 22 - 0xffff); at--) {
        if (zip.readUInt32LE(at) === EOCD) return at
    }
    throw new Error('workbook: not a zip archive (no end-of-central-directory record)')
}

/** The central directory, in archive order. */
export function readZipEntries(zip: Buffer): ZipEntry[] {
    const eocd = endOfCentralDirectory(zip)
    const count = zip.readUInt16LE(eocd + 10)
    let at = zip.readUInt32LE(eocd + 16)
    if (count === 0xffff || at === 0xffffffff) throw new Error('workbook: ZIP64 archives are not read')
    const entries: ZipEntry[] = []
    for (let i = 0; i < count; i++) {
        if (zip.readUInt32LE(at) !== CENTRAL) throw new Error(`workbook: central directory entry ${i} is malformed`)
        const nameLength = zip.readUInt16LE(at + 28)
        const extraLength = zip.readUInt16LE(at + 30)
        const commentLength = zip.readUInt16LE(at + 32)
        const entry: ZipEntry = {
            flags: zip.readUInt16LE(at + 8),
            method: zip.readUInt16LE(at + 10),
            crc32: zip.readUInt32LE(at + 16),
            compressedSize: zip.readUInt32LE(at + 20),
            uncompressedSize: zip.readUInt32LE(at + 24),
            localHeaderOffset: zip.readUInt32LE(at + 42),
            name: zip.toString('utf8', at + 46, at + 46 + nameLength),
        }
        // A data descriptor (flag bit 3) moves sizes and CRC after the data; nothing here writes one, and a
        // reader that half-supports it is how a projection silently reads the wrong bytes.
        if (entry.flags & 0x8) throw new Error(`workbook: ${entry.name} uses a data descriptor, which is not read`)
        entries.push(entry)
        at += 46 + nameLength + extraLength + commentLength
    }
    return entries
}

/** Where an entry's compressed bytes start, past its local header. */
export function entryDataOffset(zip: Buffer, entry: ZipEntry): number {
    const at = entry.localHeaderOffset
    if (zip.readUInt32LE(at) !== LOCAL) throw new Error(`workbook: local header of ${entry.name} is malformed`)
    return at + 30 + zip.readUInt16LE(at + 26) + zip.readUInt16LE(at + 28)
}

/** One entry's bytes, inflated and CRC-checked. */
export function zipEntryData(zip: Buffer, entry: ZipEntry): Buffer {
    const start = entryDataOffset(zip, entry)
    const raw = zip.subarray(start, start + entry.compressedSize)
    const data = entry.method === 0 ? Buffer.from(raw) : entry.method === 8 ? inflateRawSync(raw) : null
    if (!data) throw new Error(`workbook: ${entry.name} uses compression method ${entry.method}, which is not read`)
    if (data.length !== entry.uncompressedSize || crc32(data) !== entry.crc32) throw new Error(`workbook: ${entry.name} fails its size or CRC check`)
    return data
}

const ENTITY: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** XML character data, unescaped. An entity this does not know is refused, not passed through. */
export function xmlText(raw: string): string {
    return raw.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (whole, name: string) => {
        if (name.startsWith('#x')) return String.fromCodePoint(parseInt(name.slice(2), 16))
        if (name.startsWith('#')) return String.fromCodePoint(parseInt(name.slice(1), 10))
        if (ENTITY[name] === undefined) throw new Error(`workbook: unknown XML entity ${whole}`)
        return ENTITY[name]
    })
}

/** The attributes of one start tag. */
export function xmlAttributes(tag: string): Record<string, string> {
    const out: Record<string, string> = {}
    for (const match of tag.matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g)) out[match[1]] = xmlText(match[2])
    return out
}

/** The text of a string item — an inline `<is>` or a shared `<si>` — every `<t>` run joined, as openpyxl joins them. */
function stringItemText(inner: string, where: string): string {
    if (inner.includes('<rPh')) throw new Error(`workbook: ${where} carries phonetic runs, which are not read`)
    let out = ''
    for (const match of inner.matchAll(/<t(?:\s[^>]*)?(?:\/>|>([^<]*)<\/t>)/g)) out += xmlText(match[1] ?? '')
    return out
}

/** The shared strings table, or an empty one where the workbook has none (every string inline). */
export function readSharedStrings(xml: string | null): string[] {
    if (!xml) return []
    return [...xml.matchAll(/<si(?:\s[^>]*)?(?:\/>|>([\s\S]*?)<\/si>)/g)].map((match, i) => stringItemText(match[1] ?? '', `shared string ${i}`))
}

/** Each cell style's number format id, by style index (cellXfs order). */
export function readStyleNumberFormats(xml: string | null): number[] {
    if (!xml) return []
    const block = xml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)
    if (!block) return []
    return [...block[1].matchAll(/<xf\b([^>]*?)\/?>/g)].map(match => Number(xmlAttributes(match[1]).numFmtId ?? 0))
}

export type CellValue = string | number | null

/** One-based column number of a cell reference: A1 → 1, AA7 → 27. */
export function columnOf(reference: string): number {
    const letters = reference.match(/^[A-Z]+/)
    if (!letters) throw new Error(`workbook: cell reference ${reference} has no column`)
    let n = 0
    for (const ch of letters[0]) n = n * 26 + (ch.charCodeAt(0) - 64)
    return n
}

/**
 * One worksheet's cells, as row → column → value. Rows and cells absent from the XML are simply absent.
 * Every cell type openpyxl would read differently from a plain string or integer is refused, named.
 */
export function readSheetCells(xml: string, sharedStrings: string[] = [], numberFormats: number[] = []): Map<number, Map<number, CellValue>> {
    if (/<[A-Za-z]\w*:worksheet\b/.test(xml)) throw new Error('workbook: a namespace-prefixed worksheet is not read')
    const rows = new Map<number, Map<number, CellValue>>()
    const sheetData = xml.match(/<sheetData\b[^>]*?(?:\/>|>([\s\S]*?)<\/sheetData>)/)
    if (!sheetData) throw new Error('workbook: worksheet has no sheetData')
    for (const row of (sheetData[1] ?? '').matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
        const rowNumber = Number(xmlAttributes(row[1]).r)
        if (!Number.isInteger(rowNumber)) throw new Error('workbook: a row has no number')
        const cells = new Map<number, CellValue>()
        for (const cell of (row[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
            const attributes = xmlAttributes(cell[1])
            const reference = attributes.r
            if (!reference) throw new Error(`workbook: a cell in row ${rowNumber} has no reference`)
            const inner = cell[2] ?? ''
            if (/<f[\s>/]/.test(inner)) throw new Error(`workbook: ${reference} holds a formula; openpyxl would read its cached value, so it is refused`)
            const type = attributes.t ?? 'n'
            const v = inner.match(/<v(?:\s[^>]*)?>([^<]*)<\/v>/)
            let value: CellValue
            if (type === 'inlineStr') {
                const is = inner.match(/<is(?:\s[^>]*)?>([\s\S]*?)<\/is>/)
                value = is ? stringItemText(is[1], reference) : null
            } else if (type === 's') {
                const index = Number(v?.[1])
                if (!v || !Number.isInteger(index) || index < 0 || index >= sharedStrings.length) throw new Error(`workbook: ${reference} names shared string ${v?.[1]}, which does not exist`)
                value = sharedStrings[index]
            } else if (type === 'n') {
                if (!v) {
                    value = null
                } else {
                    const text = v[1].trim()
                    // Python would print 2.0 for a float; a value that is not a plain integer is refused, not converted.
                    if (!/^-?[0-9]+$/.test(text) || !Number.isSafeInteger(Number(text))) throw new Error(`workbook: ${reference} holds the non-integer number ${text}, which is refused`)
                    const format = numberFormats[Number(attributes.s ?? 0)] ?? 0
                    // A number format other than General is how a date is stored; openpyxl would read it as one.
                    if (format !== 0) throw new Error(`workbook: ${reference} holds a number in format ${format} (a date or formatted number), which is refused`)
                    value = Number(text)
                }
            } else {
                throw new Error(`workbook: ${reference} has cell type "${type}", which is not read`)
            }
            cells.set(columnOf(reference), value)
        }
        rows.set(rowNumber, cells)
    }
    return rows
}

/** A workbook opened from its bytes: sheets by name. */
export interface WorkbookReader {
    sheetNames: string[]
    cells: (sheetName: string) => Map<number, Map<number, CellValue>>
}

export function openWorkbook(zip: Buffer): WorkbookReader {
    const entries = new Map(readZipEntries(zip).map(entry => [entry.name, entry]))
    const read = (name: string): string | null => {
        const entry = entries.get(name)
        return entry ? zipEntryData(zip, entry).toString('utf8') : null
    }
    const workbook = read('xl/workbook.xml')
    const rels = read('xl/_rels/workbook.xml.rels')
    if (!workbook || !rels) throw new Error('workbook: xl/workbook.xml or its relationships are missing')
    const targets = new Map<string, string>()
    for (const match of rels.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
        const attributes = xmlAttributes(match[1])
        // A target is relative to xl/ unless it is absolute within the package.
        targets.set(attributes.Id, attributes.Target.startsWith('/') ? attributes.Target.slice(1) : `xl/${attributes.Target}`)
    }
    const sheets = new Map<string, string>()
    for (const match of workbook.matchAll(/<sheet\b([^>]*?)\/?>/g)) {
        const attributes = xmlAttributes(match[1])
        const target = targets.get(attributes['r:id'])
        if (!target) throw new Error(`workbook: sheet "${attributes.name}" has no relationship target`)
        sheets.set(attributes.name, target)
    }
    const sharedStrings = readSharedStrings(read('xl/sharedStrings.xml'))
    const numberFormats = readStyleNumberFormats(read('xl/styles.xml'))
    return {
        sheetNames: [...sheets.keys()],
        cells: (sheetName: string) => {
            const target = sheets.get(sheetName)
            const xml = target ? read(target) : null
            if (!xml) throw new Error(`workbook: sheet "${sheetName}" is missing`)
            return readSheetCells(xml, sharedStrings, numberFormats)
        },
    }
}

/** The sheets project-workbook.py declares, in its order, with the key each is projected under. */
export const SESSION_PLANNING_SHEETS: [string, string][] = [
    ['Learning Goal Registry', 'learning_goals'],
    ['Practice Situation Registry', 'practice_situations'],
    ['Entry Language', 'entry_language'],
    ['Engine Translation', 'engine_translation'],
    ['Governance', 'governance'],
    ['RPC Routing', 'rpc_routing'],
]

export const SESSION_PLANNING_HEADER_ROW = 1

/** One sheet as project-workbook.py's `read_sheet` makes it. */
export function projectSheet(cells: Map<number, Map<number, CellValue>>, headerRow = SESSION_PLANNING_HEADER_ROW): Record<string, CellValue>[] {
    const headerCells = cells.get(headerRow) ?? new Map<number, CellValue>()
    const headers = [...headerCells.entries()]
        .filter(([, value]) => value !== null && value !== '')
        .sort(([a], [b]) => a - b)
        .map(([column, value]) => [column, String(value)] as const)
    const out: Record<string, CellValue>[] = []
    for (const rowNumber of [...cells.keys()].filter(n => n > headerRow).sort((a, b) => a - b)) {
        const row = cells.get(rowNumber)!
        if (![...row.values()].some(value => value !== null && String(value).trim() !== '')) continue
        const projected: Record<string, CellValue> = {}
        for (const [column, header] of headers) projected[header] = row.get(column) ?? null
        out.push(projected)
    }
    return out
}

/** The whole projection, as an object, in project-workbook.py's key order. */
export function projectSessionPlanningWorkbookObject(zip: Buffer, sourceWorkbook = 'session-planning-model.rc1.xlsx'): Record<string, unknown> {
    const workbook = openWorkbook(zip)
    const missing = SESSION_PLANNING_SHEETS.map(([name]) => name).filter(name => !workbook.sheetNames.includes(name))
    if (missing.length) throw new Error(`Workbook is missing expected sheet(s): ${missing.join(', ')}`)
    const projection: Record<string, unknown> = { source_workbook: sourceWorkbook, header_row: SESSION_PLANNING_HEADER_ROW }
    for (const [name, key] of SESSION_PLANNING_SHEETS) projection[key] = projectSheet(workbook.cells(name))
    return projection
}

/** The projection as project-workbook.py writes it: indent 2, non-ASCII kept, a trailing newline, LF. */
export function projectSessionPlanningWorkbook(zip: Buffer, sourceWorkbook = 'session-planning-model.rc1.xlsx'): string {
    return JSON.stringify(projectSessionPlanningWorkbookObject(zip, sourceWorkbook), null, 2) + '\n'
}
