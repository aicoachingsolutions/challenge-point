/**
 * Unit tests: the Affordance Target Matrix JSON is the COMPLETE projection of its committed workbook (item B1, after
 * his reply filed 30 October 2026).
 *
 * The loader said the workbook was "projected completely"; the Version Metadata sheet's `required` and `notes`
 * columns (his four affordance definitions, D29-D32, and the GP-004 / GP-015 notes, D38-D39) were not in the JSON,
 * and nothing could tell, because nothing read the workbook. Two consumers now do:
 *   1. The committed JSON is exactly `projectAtmWorkbook(workbook)`: it is generated, not hand-edited.
 *   2. Every populated cell of every sheet is found in the committed JSON at its place, with its value, by rules
 *      written HERE, independently of the projector: WHERE a cell belongs (ROWS_KEY below) and WHAT it holds
 *      (`rawWorkbookCells`, which walks the archive's XML and decodes it itself). So a projector or reader that drops
 *      or rewrites a cell cannot pass by regenerating the JSON. (Until the B1 review the values came through the
 *      projector's own reader and only the COUNT was checked raw: a reader that stopped decoding `&gt;` passed.)
 * Each check is shown to bite: on a copy of the JSON with one cell removed, on the pre-B1 shape of the JSON, on a
 * workbook rebuilt with one more note in it, and on a reader that returns one value undecoded.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import committedJson from './atm-workbook.rc1.2.json'
import {
    AtmCellValue,
    AtmWorkbookCells,
    cellReference,
    openAtmWorkbook,
    projectAtmWorkbook,
    readAtmSheetCells,
    withoutMainPrefix,
} from './atm-workbook-projection'
// Only the archive primitives are shared with the projector (unzip, with each entry's size and CRC checked).
import { crc32, readZipEntries, zipEntryData } from '../session-planning/workbook-projection'

const XLSX = path.resolve(__dirname, '../../../data/knowledge-core/Affordance_Target_Matrix_RC1_2_Canonical.xlsx')
const JSON_PATH = path.resolve(__dirname, 'atm-workbook.rc1.2.json')

/**
 * WHERE EACH CELL MUST BE FOUND. Written here, not imported from the projector, on purpose. Row 1 column A is the
 * sheet's title (sheets[].title); row 3 is its header row (sheets[].headers, by column); every cell below is a field
 * of the JSON row whose first field equals that row's column-A cell, under the header of its column, in the array
 * named here. Version Metadata's value column must also be in the long-standing `metadata` map. Any other populated
 * cell has no place in the projection and is reported as missing.
 */
const ROWS_KEY: Record<string, string> = {
    'Game Problem Registry': 'gameProblemRegistry',
    'Ratings Grid': 'ratings',
    'Version Metadata': 'metadataRows',
}
const TOP_LEVEL_KEYS = ['metadata', 'gameProblemRegistry', 'ratings', 'metadataRows', 'sheets']

type Projection = Record<string, unknown>
type Row = Record<string, AtmCellValue>
interface SheetEntry {
    name: string
    title: string
    headers: string[]
}
/** row -> column -> value, for one sheet; and sheet name -> its cells, in workbook order. */
type SheetCells = Map<number, Map<number, AtmCellValue>>
type WorkbookCells = Map<string, SheetCells>

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** XML character data, decoded HERE: the five named entities and numeric references. Any other entity is refused. */
function decodeXml(raw: string, where: string): string {
    return raw.replace(/&(?:#x([0-9A-Fa-f]+)|#([0-9]+)|([A-Za-z][\w.-]*));/g, (whole: string, hex?: string, decimal?: string, name?: string) => {
        if (hex !== undefined) return String.fromCodePoint(parseInt(hex, 16))
        if (decimal !== undefined) return String.fromCodePoint(parseInt(decimal, 10))
        const decoded = XML_ENTITIES[name ?? '']
        if (decoded === undefined) throw new Error(`raw extraction: ${where} holds the unknown entity ${whole}`)
        return decoded
    })
}

function attributesOf(tag: string, where: string): Record<string, string> {
    const out: Record<string, string> = {}
    for (const match of tag.matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)) out[match[1]] = decodeXml(match[2], where)
    return out
}

/**
 * THE INDEPENDENT VALUE SOURCE: every populated cell straight from the archive, nothing taken from the projector or
 * its reader. The sheets are found through xl/workbook.xml and its relationships; each worksheet's `<c>` elements
 * (any namespace prefix) are walked here; the `<v>` text is decoded by `decodeXml` above. A t="str" cell is its
 * decoded text, a t="b" cell a boolean, an untyped or t="n" cell a Number. A cell with no `<v>`, or an empty one, is
 * not populated. Any other cell type is refused, so a cell this test cannot decode fails it instead of passing unseen.
 */
function rawWorkbookCells(zip: Buffer): WorkbookCells {
    const files = new Map(readZipEntries(zip).map(entry => [entry.name, zipEntryData(zip, entry).toString('utf8')]))
    const workbookXml = files.get('xl/workbook.xml')
    const relsXml = files.get('xl/_rels/workbook.xml.rels')
    if (workbookXml === undefined || relsXml === undefined) throw new Error('raw extraction: xl/workbook.xml or its relationships are missing')
    const targets = new Map<string, string>()
    for (const match of relsXml.matchAll(/<(?:\w+:)?Relationship\b([^>]*?)\/?>/g)) {
        const attributes = attributesOf(match[1], 'xl/_rels/workbook.xml.rels')
        targets.set(attributes.Id, attributes.Target.startsWith('/') ? attributes.Target.slice(1) : `xl/${attributes.Target}`)
    }
    const workbook: WorkbookCells = new Map()
    for (const match of workbookXml.matchAll(/<(?:\w+:)?sheet\b([^>]*?)\/?>/g)) {
        const attributes = attributesOf(match[1], 'xl/workbook.xml')
        const xml = files.get(targets.get(attributes['r:id']) ?? '')
        if (xml === undefined) throw new Error(`raw extraction: sheet "${attributes.name}" has no worksheet part`)
        workbook.set(attributes.name, rawSheetCells(xml, attributes.name))
    }
    return workbook
}

function rawSheetCells(xml: string, sheetName: string): SheetCells {
    const sheetData = xml.match(/<(?:\w+:)?sheetData\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?sheetData>)/)
    if (!sheetData) throw new Error(`raw extraction: sheet "${sheetName}" has no sheetData`)
    const cells: SheetCells = new Map()
    for (const cell of (sheetData[1] ?? '').matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
        const attributes = attributesOf(cell[1], sheetName)
        const where = `${sheetName}!${attributes.r}`
        const reference = /^([A-Z]+)([0-9]+)$/.exec(attributes.r ?? '')
        if (!reference) throw new Error(`raw extraction: a cell in "${sheetName}" has the reference ${JSON.stringify(attributes.r)}`)
        const v = (cell[2] ?? '').match(/<(?:\w+:)?v(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?v>/)
        if (!v || v[1] === '') continue
        const type = attributes.t ?? 'n'
        let value: AtmCellValue
        if (type === 'str') {
            value = decodeXml(v[1], where)
        } else if (type === 'b') {
            if (v[1] !== '0' && v[1] !== '1') throw new Error(`raw extraction: ${where} is a boolean holding ${JSON.stringify(v[1])}`)
            value = v[1] === '1'
        } else if (type === 'n') {
            value = Number(v[1])
            if (!Number.isFinite(value)) throw new Error(`raw extraction: ${where} is a number holding ${JSON.stringify(v[1])}`)
        } else {
            throw new Error(`raw extraction: ${where} has cell type "${type}", which this test does not decode`)
        }
        let column = 0
        for (const letter of reference[1]) column = column * 26 + (letter.charCodeAt(0) - 64)
        const rowNumber = Number(reference[2])
        if (!cells.has(rowNumber)) cells.set(rowNumber, new Map())
        if (cells.get(rowNumber)!.has(column)) throw new Error(`raw extraction: ${where} appears twice`)
        cells.get(rowNumber)!.set(column, value)
    }
    return cells
}

/**
 * Every cell where the projector's reader and the raw extraction disagree (absent from one, or not strictly equal),
 * named `Sheet!Ref reader <value> raw <value>`. Empty when the reader returns the archive exactly.
 */
function readerDisagreements(reader: AtmWorkbookCells, raw: WorkbookCells): string[] {
    const out: string[] = []
    const rawSheets = [...raw.keys()]
    if (JSON.stringify(reader.sheetNames) !== JSON.stringify(rawSheets)) out.push(`sheets: reader ${JSON.stringify(reader.sheetNames)} raw ${JSON.stringify(rawSheets)}`)
    const show = (value: AtmCellValue | undefined) => (value === undefined ? '(absent)' : JSON.stringify(value))
    for (const [sheetName, rawCells] of raw) {
        const readCells: SheetCells = reader.sheetNames.includes(sheetName) ? reader.cells(sheetName) : new Map()
        for (const rowNumber of [...new Set([...rawCells.keys(), ...readCells.keys()])].sort((a, b) => a - b)) {
            const columns = new Set([...(rawCells.get(rowNumber)?.keys() ?? []), ...(readCells.get(rowNumber)?.keys() ?? [])])
            for (const column of [...columns].sort((a, b) => a - b)) {
                const fromReader = readCells.get(rowNumber)?.get(column)
                const fromRaw = rawCells.get(rowNumber)?.get(column)
                if (fromReader !== fromRaw) out.push(`${sheetName}!${cellReference(rowNumber, column)} reader ${show(fromReader)} raw ${show(fromRaw)}`)
            }
        }
    }
    return out
}

/** Every populated cell the JSON does not carry at its place, named `Sheet!Ref "value"`. Empty when complete. */
function cellsMissingFromProjection(workbook: WorkbookCells, json: Projection): string[] {
    const missing: string[] = []
    const sheets = Array.isArray(json.sheets) ? (json.sheets as SheetEntry[]) : []
    for (const [sheetName, cells] of workbook) {
        const entry = sheets.find(sheet => sheet.name === sheetName)
        const rowsKey = ROWS_KEY[sheetName]
        const rows = rowsKey && Array.isArray(json[rowsKey]) ? (json[rowsKey] as Row[]) : []
        const headerCells = cells.get(3) ?? new Map<number, AtmCellValue>()
        for (const [rowNumber, row] of cells) {
            for (const [column, value] of row) {
                let carried = false
                if (rowNumber === 1 && column === 1) {
                    carried = entry?.title === value
                } else if (rowNumber === 3) {
                    carried = entry?.headers?.[column - 1] === value
                } else if (rowNumber > 3 && rowsKey) {
                    const header = headerCells.get(column)
                    const keyHeader = headerCells.get(1)
                    const key = row.get(1)
                    const target = rows.find(candidate => candidate[String(keyHeader)] === key)
                    carried = typeof header === 'string' && target !== undefined && target[header] === value
                    if (carried && sheetName === 'Version Metadata' && header === 'metadata_value') {
                        const metadata = (json.metadata ?? {}) as Row
                        carried = metadata[String(key)] === value
                    }
                }
                if (!carried) missing.push(`${sheetName}!${cellReference(rowNumber, column)} ${JSON.stringify(value)}`)
            }
        }
    }
    return missing
}

/** How many values the JSON's per-sheet structure carries: titles, headers and row fields (the map is a view). */
function carriedValueCount(json: Projection): number {
    let count = 0
    for (const sheet of json.sheets as SheetEntry[]) {
        count += 1 + sheet.headers.length
        for (const row of json[ROWS_KEY[sheet.name]] as Row[]) count += Object.keys(row).length
    }
    return count
}

/** How many populated cells hold each kind of value. */
function populatedCellCounts(workbook: WorkbookCells): { total: number; text: number; boolean: number; number: number } {
    const counts = { total: 0, text: 0, boolean: 0, number: 0 }
    for (const cells of workbook.values()) {
        for (const row of cells.values()) {
            for (const value of row.values()) {
                counts.total++
                if (typeof value === 'string') counts.text++
                else if (typeof value === 'boolean') counts.boolean++
                else counts.number++
            }
        }
    }
    return counts
}

/**
 * The legacy section (metadata, gameProblemRegistry, ratings) is what the loader, and through it production, reads.
 * B1 appended metadataRows and sheets after it and said nothing already there moved. Serialised as the projection
 * writes it (indent 1, LF), it must be the file committed in 9a82a2b on 21 July 2026 ("Adopt CAR Matrix RC1.2"; git
 * blob 7d5a49abdc5bee085a5a376a4bcd67c41ade0222), byte for byte. A later workbook release would change it on purpose,
 * and this pin with it.
 */
const JULY_21_JSON_BYTES = 15433
const JULY_21_JSON_SHA256 = '617fbcbee51aec89ef48c60f26e47c27f504f19650a49bb765092efed6ff66ac'

/**
 * **The committed JSON IS the committed workbook's projection.** Line endings aside: git keeps the JSON LF and a
 * Windows checkout writes CRLF.
 */
function testCommittedJsonIsTheWorkbookProjection(): void {
    const zip = readFileSync(XLSX)
    const committed = readFileSync(JSON_PATH, 'utf8').split('\r\n').join('\n')
    assert.equal(projectAtmWorkbook(zip), committed, 'the committed JSON must be exactly the committed workbook projected')
    assert.deepEqual(Object.keys(committedJson), TOP_LEVEL_KEYS, 'the projection has exactly its five keys, in order')
}

/** **The legacy section is still the 21 July 2026 file, byte for byte** (see JULY_21_JSON_SHA256). */
function testLegacySectionIsTheJuly21File(): void {
    const json = committedJson as unknown as Projection
    const legacy = Buffer.from(JSON.stringify({ metadata: json.metadata, gameProblemRegistry: json.gameProblemRegistry, ratings: json.ratings }, null, 1), 'utf8')
    assert.equal(legacy.length, JULY_21_JSON_BYTES, 'the legacy section is as long as the 21 July file')
    assert.equal(createHash('sha256').update(legacy).digest('hex'), JULY_21_JSON_SHA256, 'the legacy section is the 21 July file, byte for byte')
}

/**
 * **Every populated cell of every sheet is in the JSON, with its value** (the consumer that proves the projection).
 * The values come from `rawWorkbookCells`, never from the projector's reader. The reader is also required to return
 * exactly those values, cell by cell, so a reader fault is named where it happens.
 */
function testEveryPopulatedCellIsCarried(): void {
    const zip = readFileSync(XLSX)
    const raw = rawWorkbookCells(zip)
    const json = committedJson as unknown as Projection
    assert.deepEqual([...raw.keys()], ['Game Problem Registry', 'Ratings Grid', 'Version Metadata'])
    const counts = populatedCellCounts(raw)
    assert.deepEqual(counts, { total: 526, text: 476, boolean: 44, number: 6 }, 'RC1.2 holds 526 populated cells (476 text, 44 boolean, 6 number), as measured for item B1')
    assert.equal(raw.get('Version Metadata')?.get(21)?.get(2), 'E>S>NR', 'B21 is written E&gt;S&gt;NR in the archive and decodes to E>S>NR')
    assert.deepEqual(
        { readerDisagreements: readerDisagreements(openAtmWorkbook(zip), raw), missingFromJson: cellsMissingFromProjection(raw, json) },
        { readerDisagreements: [], missingFromJson: [] },
        'the reader returns every populated cell exactly as the archive writes it, and the JSON carries each at its place'
    )
    // And nothing is carried that the workbook does not hold: one value per populated cell.
    assert.equal(carriedValueCount(json), counts.total, 'the JSON carries one value per populated cell, no more')
    assert.equal(Object.keys(json.metadata as Row).length, (json.metadataRows as Row[]).length, 'the metadata map is a view of the rows')

    // The cells B1 found missing are carried, verbatim.
    const rows = json.metadataRows as Row[]
    assert.equal(rows.find(row => row.metadata_key === 'car_sa_definition')?.notes, 'Is coordinated interaction with another performer available?')
    assert.equal(rows.find(row => row.metadata_key === 'gp015_validation_flag')?.notes, 'Direct legacy migration retained; field validation recommended.')
    assert.equal(rows.find(row => row.metadata_key === 'gp015_validation_flag')?.required, false, 'C39 is FALSE in the workbook')
}

/**
 * **It bites.** On the JSON: one note removed from a copy is named, and nothing else is; the pre-B1 shape of the
 * file (metadata, gameProblemRegistry, ratings only) fails on 187 cells: the 78 `required` and `notes` cells it lost
 * outright, the 3 titles and 24 header cells, and the 82 Version Metadata key and value cells it held only as the
 * `metadata` map. On the
 * workbook: an archive rebuilt with every entry stored still projects to the committed JSON untouched; with a note
 * written into the empty D24 it no longer does, and the completeness check names D24; a populated cell in a column
 * with no header is refused by the projector instead of being dropped. On the values: a reader that returns B21
 * undecoded is named, a JSON whose B21 is rewritten the same way is named, and the test's own decoder reads named
 * and numeric references and refuses an unknown entity.
 */
function testTheChecksBite(): void {
    const zip = readFileSync(XLSX)
    const raw = rawWorkbookCells(zip)
    const json = committedJson as unknown as Projection

    const copy = JSON.parse(JSON.stringify(json)) as Projection
    delete (copy.metadataRows as Row[]).find(row => row.metadata_key === 'car_sa_definition')!.notes
    assert.deepEqual(cellsMissingFromProjection(raw, copy), ['Version Metadata!D31 "Is coordinated interaction with another performer available?"'])

    // A value rewritten, not dropped (the B1 review's case: `&gt;` left undecoded), in the reader and in the JSON.
    const reader = openAtmWorkbook(zip)
    const undecoded: AtmWorkbookCells = {
        sheetNames: reader.sheetNames,
        cells: (sheetName: string) => {
            const cells = reader.cells(sheetName)
            if (sheetName === 'Version Metadata') cells.get(21)!.set(2, 'E&gt;S&gt;NR')
            return cells
        },
    }
    assert.deepEqual(readerDisagreements(undecoded, raw), ['Version Metadata!B21 reader "E&gt;S&gt;NR" raw "E>S>NR"'])
    const rewritten = JSON.parse(JSON.stringify(json)) as Projection
    ;(rewritten.metadata as Row).merge_precedence = 'E&gt;S&gt;NR'
    ;(rewritten.metadataRows as Row[]).find(row => row.metadata_key === 'merge_precedence')!.metadata_value = 'E&gt;S&gt;NR'
    assert.deepEqual(cellsMissingFromProjection(raw, rewritten), ['Version Metadata!B21 "E>S>NR"'])
    assert.equal(decodeXml('&lt;&amp;&quot;&apos;&gt; &#8594;&#x2192;', 'T'), '<&"\'> →→')
    assert.throws(() => decodeXml('&nbsp;', 'T!A1'), /T!A1 holds the unknown entity &nbsp;/)

    const preB1 = { metadata: json.metadata, gameProblemRegistry: json.gameProblemRegistry, ratings: json.ratings }
    const lost = cellsMissingFromProjection(raw, preB1)
    assert.equal(lost.length, 187, 'titles 3 + headers 24 + Version Metadata data cells 160')
    const lostOutright = lost.filter(cell => /^Version Metadata![CD]([4-9]|[1-9][0-9]) /.test(cell))
    assert.equal(lostOutright.length, 78, 'the required (41) and notes (37) cells the pre-B1 file did not hold anywhere')
    assert.ok(lost.includes('Version Metadata!D31 "Is coordinated interaction with another performer available?"'))
    assert.ok(lost.includes('Version Metadata!C39 false'))
    assert.ok(!lost.some(cell => /^(Game Problem Registry|Ratings Grid)![A-Z]+([4-9]|[1-9][0-9])\b/.test(cell)), 'the registry and ratings rows were always carried')

    const committed = readFileSync(JSON_PATH, 'utf8').split('\r\n').join('\n')
    const entries = readZipEntries(zip).map(entry => ({ name: entry.name, data: zipEntryData(zip, entry) }))
    const sheet = 'xl/worksheets/sheet3.xml'
    const rebuilt = (from: string, to: string) =>
        storedZip(entries.map(entry => (entry.name === sheet ? { name: entry.name, data: Buffer.from(entry.data.toString('utf8').replace(from, to), 'utf8') } : entry)))
    assert.equal(projectAtmWorkbook(storedZip(entries)), committed, 'the rebuilt archive, untouched, is still the committed projection')

    const emptyD24 = '<x:c r="D24" s="44" t="str" />'
    assert.ok(entries.find(entry => entry.name === sheet)!.data.toString('utf8').includes(emptyD24), 'the D24 anchor exists')
    const withNote = rebuilt(emptyD24, '<x:c r="D24" s="44" t="str"><x:v>A note added in a later revision.</x:v></x:c>')
    assert.notEqual(projectAtmWorkbook(withNote), committed, 'a workbook with one more note no longer projects to the committed JSON')
    assert.deepEqual(cellsMissingFromProjection(rawWorkbookCells(withNote), json), ['Version Metadata!D24 "A note added in a later revision."'])

    const fullD31 = '<x:c r="D31" s="44" t="str"><x:v>Is coordinated interaction with another performer available?</x:v></x:c>'
    const strayColumn = rebuilt(fullD31, `${fullD31}<x:c r="E31" s="44" t="str"><x:v>stray</x:v></x:c>`)
    assert.throws(() => projectAtmWorkbook(strayColumn), /Version Metadata!E31 is populated but its column has no header/)
}

/** What the reader cannot read faithfully, it refuses: each case names the cell. */
function testReaderRefusesWhatItCannotCarry(): void {
    const sheet = (cells: string) => `<x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><x:sheetData><x:row r="1">${cells}</x:row></x:sheetData></x:worksheet>`
    const read = (cells: string, numberFormats: number[] = []) => readAtmSheetCells(sheet(cells), [], numberFormats, 'S')
    assert.equal(
        withoutMainPrefix(sheet('')),
        '<worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"></row></sheetData></worksheet>',
        'only the prefix bound to the SpreadsheetML namespace is removed, from element names only'
    )
    assert.deepEqual(
        [...read('<x:c r="A1" t="str"><x:v> kept  as written </x:v></x:c><x:c r="B1" t="b"><x:v>0</x:v></x:c><x:c r="C1"><x:v>17</x:v></x:c><x:c r="D1" t="str" />').get(1)!.entries()],
        [[1, ' kept  as written '], [2, false], [3, 17]],
        'strings untrimmed, booleans and integers typed, an empty cell absent'
    )
    assert.throws(() => read('<x:c r="A1" t="str"><x:f>B1</x:f><x:v>x</x:v></x:c>'), /S!A1 holds a formula/)
    assert.throws(() => read('<x:c r="A1"><x:v>2.5</x:v></x:c>'), /S!A1 holds the non-integer number 2.5/)
    assert.throws(() => read('<x:c r="A1" s="1"><x:v>45000</x:v></x:c>', [0, 14]), /S!A1 holds a number in format 14/)
    // A style index outside cellXfs is not read as General (B1 review): its format is unknown, so the cell is refused.
    assert.throws(() => read('<x:c r="A1" s="2"><x:v>17</x:v></x:c>', [0, 14]), /S!A1 names style 2, which the workbook's cellXfs does not hold/)
    assert.throws(() => read('<x:c r="A1" s="0"><x:v>17</x:v></x:c>'), /S!A1 names style 0, which the workbook's cellXfs does not hold/)
    assert.equal(read('<x:c r="A1" s="0"><x:v>17</x:v></x:c>', [0]).get(1)!.get(1), 17, 'style 0 in a General cellXfs reads as the integer')
    assert.throws(() => read('<x:c r="A1" t="b"><x:v>2</x:v></x:c>'), /S!A1 is a boolean holding "2"/)
    assert.throws(() => read('<x:c r="A1" t="e"><x:v>#N\/A</x:v></x:c>'), /S!A1 has cell type "e"/)
    assert.throws(() => read('<y:c r="A1" t="str"><y:v>x</y:v></y:c>'), /prefixed element/)
    // A closing tag the cell pattern does not recognise would swallow the next cell; the element count catches it.
    assert.throws(() => read('<x:c r="A1" t="str"><x:v>x</x:v></x:c ><x:c r="B1" t="str"><x:v>y</x:v></x:c>'), /has 1 rows and 2 cells, but 1 and 1 were parsed/)
}

/** For the test above only: a ZIP archive with every entry STORED (method 0), written from scratch. */
function storedZip(files: { name: string; data: Buffer }[]): Buffer {
    const locals: Buffer[] = []
    const centrals: Buffer[] = []
    let offset = 0
    for (const file of files) {
        const name = Buffer.from(file.name, 'utf8')
        const crc = crc32(file.data)
        const local = Buffer.alloc(30)
        local.writeUInt32LE(0x04034b50, 0)
        local.writeUInt16LE(20, 4)
        local.writeUInt32LE(crc, 14)
        local.writeUInt32LE(file.data.length, 18)
        local.writeUInt32LE(file.data.length, 22)
        local.writeUInt16LE(name.length, 26)
        const central = Buffer.alloc(46)
        central.writeUInt32LE(0x02014b50, 0)
        central.writeUInt16LE(20, 4)
        central.writeUInt16LE(20, 6)
        central.writeUInt32LE(crc, 16)
        central.writeUInt32LE(file.data.length, 20)
        central.writeUInt32LE(file.data.length, 24)
        central.writeUInt16LE(name.length, 28)
        central.writeUInt32LE(offset, 42)
        locals.push(local, name, file.data)
        centrals.push(central, name)
        offset += local.length + name.length + file.data.length
    }
    const directory = Buffer.concat(centrals)
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0)
    end.writeUInt16LE(files.length, 8)
    end.writeUInt16LE(files.length, 10)
    end.writeUInt32LE(directory.length, 12)
    end.writeUInt32LE(offset, 16)
    return Buffer.concat([...locals, directory, end])
}

/** Every case runs and each failure is reported by name, so a break shows WHICH check caught it; any failure exits 1. */
function runAll(): void {
    const cases = [testCommittedJsonIsTheWorkbookProjection, testLegacySectionIsTheJuly21File, testEveryPopulatedCellIsCarried, testTheChecksBite, testReaderRefusesWhatItCannotCarry]
    const failed: string[] = []
    for (const run of cases) {
        try {
            run()
        } catch (error) {
            failed.push(run.name)
            console.error(`FAILED ${run.name}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
    if (failed.length) {
        console.error(`atm-workbook-projection unit tests: ${failed.length} of ${cases.length} cases failed (${failed.join(', ')}).`)
        process.exitCode = 1
        return
    }
    console.log('atm-workbook-projection unit tests: all cases passed.')
}

runAll()
