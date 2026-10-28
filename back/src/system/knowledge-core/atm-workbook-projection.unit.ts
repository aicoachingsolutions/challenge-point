/**
 * Unit tests: the Affordance Target Matrix JSON is the COMPLETE projection of its committed workbook (item B1, after
 * his reply filed 30 October 2026).
 *
 * The loader said the workbook was "projected completely"; the Version Metadata sheet's `required` and `notes`
 * columns (his four affordance definitions, D29-D32, and the GP-004 / GP-015 notes, D38-D39) were not in the JSON,
 * and nothing could tell, because nothing read the workbook. Two consumers now do:
 *   1. The committed JSON is exactly `projectAtmWorkbook(workbook)`: it is generated, not hand-edited.
 *   2. Every populated cell of every sheet is found in the committed JSON at its place, by a rule written HERE,
 *      independently of the projector, so a projector that drops a cell cannot pass by regenerating the JSON.
 * Each check is shown to bite: on a copy of the JSON with one cell removed, on the pre-B1 shape of the JSON, and on
 * a workbook rebuilt with one more note in it.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
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

/** Every populated cell the JSON does not carry at its place, named `Sheet!Ref "value"`. Empty when complete. */
function cellsMissingFromProjection(workbook: AtmWorkbookCells, json: Projection): string[] {
    const missing: string[] = []
    const sheets = Array.isArray(json.sheets) ? (json.sheets as SheetEntry[]) : []
    for (const sheetName of workbook.sheetNames) {
        const cells = workbook.cells(sheetName)
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

/** Populated cells counted straight from the archive's worksheet XML, without the projector's reader. */
function rawPopulatedCellCount(zip: Buffer): number {
    let count = 0
    for (const entry of readZipEntries(zip).filter(e => /^xl\/worksheets\/[^/]+\.xml$/.test(e.name))) {
        const xml = zipEntryData(zip, entry).toString('utf8')
        for (const cell of xml.matchAll(/<(?:\w+:)?c\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
            const inner = cell[1] ?? ''
            if (/<(?:\w+:)?v(?:\s[^>]*)?>[^<]+</.test(inner) || /<(?:\w+:)?t(?:\s[^>]*)?>[^<]+</.test(inner)) count++
        }
    }
    return count
}

function populatedCellCount(workbook: AtmWorkbookCells): number {
    let count = 0
    for (const name of workbook.sheetNames) for (const row of workbook.cells(name).values()) count += row.size
    return count
}

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

/**
 * **Every populated cell of every sheet is in the JSON** (the consumer that proves the projection). The reader is
 * checked against a raw count of the archive's cells first, so a cell the reader cannot see cannot vanish from both.
 */
function testEveryPopulatedCellIsCarried(): void {
    const zip = readFileSync(XLSX)
    const workbook = openAtmWorkbook(zip)
    const json = committedJson as unknown as Projection
    assert.deepEqual(workbook.sheetNames, ['Game Problem Registry', 'Ratings Grid', 'Version Metadata'])
    const populated = populatedCellCount(workbook)
    assert.equal(populated, rawPopulatedCellCount(zip), 'the reader sees every populated cell in the archive')
    assert.equal(populated, 526, 'RC1.2 holds 526 populated cells (476 text, 44 boolean, 6 number), as measured for item B1')
    assert.deepEqual(cellsMissingFromProjection(workbook, json), [], 'every populated cell is carried')
    // And nothing is carried that the workbook does not hold: one value per populated cell.
    assert.equal(carriedValueCount(json), populated, 'the JSON carries one value per populated cell, no more')
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
 * with no header is refused by the projector instead of being dropped.
 */
function testTheChecksBite(): void {
    const zip = readFileSync(XLSX)
    const workbook = openAtmWorkbook(zip)
    const json = committedJson as unknown as Projection

    const copy = JSON.parse(JSON.stringify(json)) as Projection
    delete (copy.metadataRows as Row[]).find(row => row.metadata_key === 'car_sa_definition')!.notes
    assert.deepEqual(cellsMissingFromProjection(workbook, copy), ['Version Metadata!D31 "Is coordinated interaction with another performer available?"'])

    const preB1 = { metadata: json.metadata, gameProblemRegistry: json.gameProblemRegistry, ratings: json.ratings }
    const lost = cellsMissingFromProjection(workbook, preB1)
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
    assert.deepEqual(cellsMissingFromProjection(openAtmWorkbook(withNote), json), ['Version Metadata!D24 "A note added in a later revision."'])

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
    const cases = [testCommittedJsonIsTheWorkbookProjection, testEveryPopulatedCellIsCarried, testTheChecksBite, testReaderRefusesWhatItCannotCarry]
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
