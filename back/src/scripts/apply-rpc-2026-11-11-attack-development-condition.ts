/**
 * Restores Christian's 13 September 2026 wording in the Attack Development scoring row, RPC-PROP-134, on Christian's
 * approval of 11 November 2026. Writes the canonical RPC workbook AND its JSON projection, the knowledge library.
 *
 * Run from back/:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/apply-rpc-2026-11-11-attack-development-condition.ts
 *
 * CHRISTIAN'S WORDS (reply received 11 November 2026, item 1, verbatim):
 *
 *   "1. Canonical Scoring Correction — Approved
 *   I approve the canonical workbook correction.
 *   Please restore the verified September 13 wording in the Attack Development scoring row:
 *   "rather than possession alone—for example, reaching a more advanced representative area while maintaining attacking possession."
 *   The correction should replace the erroneous colon with the dash and "for example," without changing anything else in the canonical row.
 *   The wording establishes an example of purposeful attacking advancement, not a mandatory condition requiring possession to be
 *   maintained in every qualifying scoring event.
 *   Please preserve the original wording, the corrected wording, and the source and change provenance as you've already done in the
 *   offline review record." (received 11 November 2026)
 *
 * THE SOURCE (Christian's email of 13 September 2026, under "Context Rows", "Attack Development — approved.", the sentence after
 * the list of valid events, verbatim as filed, curly apostrophe included):
 *
 *   "The qualifying condition should require purposeful advancement from the attack’s starting condition rather than possession
 *   alone—for example, reaching a more advanced representative area while maintaining attacking possession." (received 13 September 2026)
 *
 *   Verified on 10 November 2026 against the filed copy of that email in the sources repository
 *   (sources/2026-09-13-scoring-approval/originals/christian-scoring-approval-email.txt). The colon was our transcription of
 *   13 September (commit e954541, which wrote this cell and apply-rpc-scoring-events.py's text together). The row keeps the
 *   library's straight apostrophe in 'attack's': a typographic difference, not part of this correction.
 *
 * THE TEXT IT REPLACES (Properties D135, and rpc-library.rc1.json's RPC-PROP-134 property_text, verbatim): BEFORE below.
 * THE TEXT IT WRITES: AFTER below. The one change: the colon after 'possession alone' becomes '—for example,' (an em dash, then
 * 'for example', then a comma); the space before 'reaching' is kept. No other character changes.
 *
 * WHAT IT CHANGES, AND NOTHING ELSE. The cell Properties!D135 (RPC-PROP-134's property_text). G135 (its provenance, 'Christian,
 * 2026-09-13: Primary Scoring Event approval (RC1.1)') and every other cell of row 135 stay as they are: "without changing anything
 * else in the canonical row" (received 11 November 2026). Only the Properties sheet's zip entry is rewritten; every other entry's
 * local header, compressed bytes and central record (its offset aside) are copied raw, so docProps/core.xml's 'modified' date is
 * left as it was (openpyxl, as apply-rpc-scoring-events.py and resolve-rpc-staging.py save, would rewrite every part). The library
 * is then written by parse, set RPC-PROP-134's property_text, JSON.stringify(…, null, 2) and a newline, LF: for this file that is
 * byte for byte what project-rpc-workbook.py's json.dump(indent=2, ensure_ascii=False) writes (measured 11 November 2026 on
 * 9919ea3: the committed library round-trips exactly), and the script refuses to write if it does not round-trip. Before writing,
 * it requires that the library's nine tables that workbook-projection.ts's reader can read equal that reader's projection of the
 * workbook, before and after; Metadata is the tenth, whose boolean cells that reader refuses, and its entry is copied raw.
 *
 * IDEMPOTENT, AND IT REFUSES ANYTHING ELSE (apply-spm-2026-10-15-a01-game-problem.ts's pattern): it asserts the exact prior cell
 * once, the A135 and G135 cells once each, and the library row's text; on the post state it rewrites nothing and only re-verifies;
 * on any other state it stops. After rewriting, it requires the workbook's projection to differ from the previous one in exactly
 * properties[RPC-PROP-134].property_text, and the library's text to differ in exactly the one line holding that value.
 *
 * NOT WHAT IT DOES. It changes no coach rule: "Please keep any changes to the three coach-facing scoring rules separate until I have
 * reviewed their proposed wording." (received 11 November 2026). It deploys nothing: "The canonical correction is approved, but this
 * email does not authorize deploying changes to the live application or coach-facing activities." (received 11 November 2026). It
 * does not edit the workbook's "RC1.1 Resolutions" or "RC1.1 Audit" sheets. It runs no python; project-rpc-workbook.py, run
 * afterwards, is expected to change nothing.
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { deflateRawSync } from 'zlib'

import {
    CellValue,
    crc32,
    endOfCentralDirectory,
    entryDataOffset,
    openWorkbook,
    projectSheet,
    readZipEntries,
    xmlAttributes,
    zipEntryData,
} from '../system/session-planning/workbook-projection'

const BACK = path.resolve(__dirname, '../..')
const XLSM = path.join(BACK, 'data/sport-modules/soccer/rpc-workbook.rc1.1.xlsm')
const LIBRARY = path.join(BACK, 'src/system/sport-module/rpc-library.rc1.json')

const ROW_ID = 'RPC-PROP-134'
const BEFORE =
    "Purposeful advancement from the attack's starting condition rather than possession alone: reaching a more advanced representative area while maintaining attacking possession."
const AFTER =
    "Purposeful advancement from the attack's starting condition rather than possession alone—for example, reaching a more advanced representative area while maintaining attacking possession."

const D135 = (text: string): string => `<c r="D135" s="4" t="inlineStr"><is><t>${text}</t></is></c>`
const A135 = '<c r="A135" s="4" t="inlineStr"><is><t>RPC-PROP-134</t></is></c>'
const G135 = '<c r="G135" s="4" t="inlineStr"><is><t>Christian, 2026-09-13: Primary Scoring Event approval (RC1.1)</t></is></c>'

/** The sheets project-rpc-workbook.py projects, with their keys, less Metadata (its boolean cells are refused by the reader). */
const READABLE_TABLES: [string, string][] = [
    ['Registry', 'registry'],
    ['Statements', 'statements'],
    ['Relationships', 'relationships'],
    ['Properties', 'properties'],
    ['Identity Rules', 'identity_rules'],
    ['Context Transitions', 'transitions'],
    ['Validation Rules', 'validation_rules'],
    ['Controlled Vocabulary', 'controlled_vocabulary'],
    ['Implementation Staging', 'implementation_staging'],
]

type Table = Record<string, CellValue>[]

const occurrences = (text: string, anchor: string): number => text.split(anchor).length - 1

/** project-rpc-workbook.py's clean(): a string stripped, a blank one None. */
const clean = (value: CellValue): CellValue => (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value)

/** The nine readable tables, as project-rpc-workbook.py's read_table makes them. */
function projectTables(zip: Buffer): Record<string, Table> {
    const workbook = openWorkbook(zip)
    return Object.fromEntries(
        READABLE_TABLES.map(([sheet, key]) => [key, projectSheet(workbook.cells(sheet)).map((row) => Object.fromEntries(Object.entries(row).map(([column, value]) => [column, clean(value)])))]),
    )
}

/** Every field where two projections differ, as 'table[first-column value].column'. */
function differences(before: Record<string, Table>, after: Record<string, Table>): string[] {
    const out: string[] = []
    for (const [, key] of READABLE_TABLES) {
        const a = before[key]
        const b = after[key]
        if (a.length !== b.length) {
            out.push(`${key} (row count ${a.length} → ${b.length})`)
            continue
        }
        a.forEach((row, i) => {
            for (const column of new Set([...Object.keys(row), ...Object.keys(b[i])])) {
                if (JSON.stringify(row[column]) !== JSON.stringify(b[i][column])) out.push(`${key}[${String(Object.values(row)[0] ?? i)}].${column}`)
            }
        })
    }
    return out
}

/** The library's nine tables must be exactly the workbook's projection of them; refuses naming the first table that is not. */
function requireLibraryIsProjection(library: Record<string, unknown>, projection: Record<string, Table>, when: string): void {
    for (const [sheet, key] of READABLE_TABLES) {
        if (JSON.stringify(library[key]) !== JSON.stringify(projection[key])) throw new Error(`${when}: the library's ${key} is not the workbook's ${sheet} sheet projected; nothing written`)
    }
}

/** The zip entry holding the named sheet, found through the workbook and its relationships — never assumed (apply-spm-2026-10-15). */
function sheetEntryName(zip: Buffer, sheetName: string): string {
    const entries = readZipEntries(zip)
    const read = (name: string) => zipEntryData(zip, entries.find((entry) => entry.name === name)!).toString('utf8')
    const sheet = [...read('xl/workbook.xml').matchAll(/<sheet\b([^>]*?)\/?>/g)].map((m) => xmlAttributes(m[1])).find((a) => a.name === sheetName)
    if (!sheet) throw new Error(`no sheet named ${sheetName}`)
    const rel = [...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b([^>]*?)\/?>/g)].map((m) => xmlAttributes(m[1])).find((a) => a.Id === sheet['r:id'])
    if (!rel) throw new Error(`sheet ${sheetName} has no relationship`)
    return rel.Target.startsWith('/') ? rel.Target.slice(1) : `xl/${rel.Target}`
}

/** The archive with one entry's content replaced; every other entry's local header and compressed bytes copied raw (apply-spm-2026-10-15). */
function rewriteEntry(zip: Buffer, name: string, content: Buffer): Buffer {
    const entries = readZipEntries(zip)
    const eocd = endOfCentralDirectory(zip)
    const cdStart = zip.readUInt32LE(eocd + 16)
    const compressed = deflateRawSync(content)
    const crc = crc32(content)
    const locals: Buffer[] = []
    const centrals: Buffer[] = []
    let offset = 0
    let cdAt = cdStart
    for (const entry of entries) {
        const dataStart = entryDataOffset(zip, entry)
        const header = Buffer.from(zip.subarray(entry.localHeaderOffset, dataStart))
        const nameLength = zip.readUInt16LE(cdAt + 28)
        const cdLength = 46 + nameLength + zip.readUInt16LE(cdAt + 30) + zip.readUInt16LE(cdAt + 32)
        const central = Buffer.from(zip.subarray(cdAt, cdAt + cdLength))
        cdAt += cdLength
        let data: Buffer = zip.subarray(dataStart, dataStart + entry.compressedSize)
        if (entry.name === name) {
            if (entry.method !== 8) throw new Error(`${name} is not deflated; refusing to change its method`)
            data = compressed
            for (const [buffer, at] of [[header, 14], [central, 16]] as const) {
                buffer.writeUInt32LE(crc, at)
                buffer.writeUInt32LE(compressed.length, at + 4)
                buffer.writeUInt32LE(content.length, at + 8)
            }
        }
        central.writeUInt32LE(offset, 42)
        locals.push(header, data)
        centrals.push(central)
        offset += header.length + data.length
    }
    const cd = Buffer.concat(centrals)
    const end = Buffer.from(zip.subarray(eocd))
    end.writeUInt32LE(cd.length, 12)
    end.writeUInt32LE(offset, 16)
    return Buffer.concat([...locals, cd, end])
}

/** Each central-directory record by entry name, with its local-header offset zeroed (it moves when an earlier entry changes size). */
function centralRecords(zip: Buffer): Map<string, Buffer> {
    const eocd = endOfCentralDirectory(zip)
    const count = zip.readUInt16LE(eocd + 10)
    let at = zip.readUInt32LE(eocd + 16)
    const out = new Map<string, Buffer>()
    for (let i = 0; i < count; i++) {
        const nameLength = zip.readUInt16LE(at + 28)
        const length = 46 + nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32)
        const record = Buffer.from(zip.subarray(at, at + length))
        record.writeUInt32LE(0, 42)
        out.set(zip.toString('utf8', at + 46, at + 46 + nameLength), record)
        at += length
    }
    return out
}

/** The entries, other than `changed`, whose local header, compressed bytes or central record (offset aside) differ, or whose order moved. */
function entriesNotCopiedRaw(original: Buffer, written: Buffer, changed: string): string[] {
    const before = readZipEntries(original)
    const after = readZipEntries(written)
    if (JSON.stringify(before.map((entry) => entry.name)) !== JSON.stringify(after.map((entry) => entry.name))) return ['the entry list or its order']
    const centralBefore = centralRecords(original)
    const centralAfter = centralRecords(written)
    const bytes = (zip: Buffer, entry: (typeof before)[number]) => zip.subarray(entry.localHeaderOffset, entryDataOffset(zip, entry) + entry.compressedSize)
    return before
        .filter((entry, i) => entry.name !== changed && (!bytes(original, entry).equals(bytes(written, after[i])) || !centralBefore.get(entry.name)!.equals(centralAfter.get(entry.name)!)))
        .map((entry) => entry.name)
}

/** One-based numbers of the lines where two LF texts differ (the same number of lines required). */
function changedLines(before: string, after: string): number[] {
    const a = before.split('\n')
    const b = after.split('\n')
    if (a.length !== b.length) throw new Error(`the library would change from ${a.length} to ${b.length} lines; nothing written`)
    return a.map((line, i) => (line === b[i] ? 0 : i + 1)).filter((n) => n > 0)
}

function main(): void {
    const original = readFileSync(XLSM)
    const target = sheetEntryName(original, 'Properties')
    const entry = readZipEntries(original).find((e) => e.name === target)!
    const xml = zipEntryData(original, entry).toString('utf8')
    for (const anchor of [A135, G135]) if (occurrences(xml, anchor) !== 1) throw new Error(`expected exactly one ${anchor}; refusing`)
    const before = occurrences(xml, D135(BEFORE))
    const after = occurrences(xml, D135(AFTER))

    // The library as git stores it (LF), and the one row.
    const libraryText = readFileSync(LIBRARY, 'utf8').split('\r\n').join('\n')
    const library = JSON.parse(libraryText) as Record<string, any>
    if (JSON.stringify(library, null, 2) + '\n' !== libraryText) throw new Error('the library does not round-trip through JSON.stringify(…, null, 2); refusing to rewrite it')
    const rows = (library.properties as Record<string, unknown>[]).filter((row) => row['property_id'] === ROW_ID)
    if (rows.length !== 1) throw new Error(`the library holds ${rows.length} rows ${ROW_ID}; refusing`)
    const [row] = rows

    if (before === 1 && after === 0) {
        if (row['property_text'] !== BEFORE) throw new Error(`the workbook holds the 13 September transcription but the library's ${ROW_ID} reads ${JSON.stringify(row['property_text'])}; refusing`)
        const committedProjection = projectTables(original)
        requireLibraryIsProjection(library, committedProjection, 'before the correction')

        const written = rewriteEntry(original, target, Buffer.from(xml.replace(D135(BEFORE), D135(AFTER)), 'utf8'))
        const notRaw = entriesNotCopiedRaw(original, written, target)
        if (notRaw.length) throw new Error(`the rewrite would change ${notRaw.join(', ')} as well as ${target}; nothing written`)
        const writtenProjection = projectTables(written)
        const moved = differences(committedProjection, writtenProjection)
        if (JSON.stringify(moved) !== JSON.stringify([`properties[${ROW_ID}].property_text`])) throw new Error(`the edit moved ${JSON.stringify(moved)}, not exactly ${ROW_ID}'s property_text; nothing written`)

        row['property_text'] = AFTER
        const libraryAfter = JSON.stringify(library, null, 2) + '\n'
        const lines = changedLines(libraryText, libraryAfter)
        const held = lines.length === 1 ? libraryAfter.split('\n')[lines[0] - 1] : ''
        if (lines.length !== 1 || !held.includes(`"property_text": ${JSON.stringify(AFTER)}`)) throw new Error(`the library would change at lines ${JSON.stringify(lines)}, not exactly the one holding ${ROW_ID}'s property_text; nothing written`)
        requireLibraryIsProjection(JSON.parse(libraryAfter), writtenProjection, 'after the correction')

        writeFileSync(XLSM, written)
        writeFileSync(LIBRARY, libraryAfter)
        console.log(`wrote ${XLSM}: Properties!D135 (${ROW_ID}) restored to the 13 September wording; ${target} rewritten, the other ${readZipEntries(written).length - 1} entries copied raw; projection moved ${moved.join(', ')}`)
        console.log(`wrote ${LIBRARY}: line ${lines[0]} only`)
    } else if (after === 1 && before === 0) {
        if (row['property_text'] !== AFTER) throw new Error(`the workbook holds the corrected wording but the library's ${ROW_ID} reads ${JSON.stringify(row['property_text'])}; refusing`)
        requireLibraryIsProjection(library, projectTables(original), 'already corrected')
        console.log('the workbook and the library already hold the 13 September wording; nothing rewritten')
    } else {
        throw new Error(`Properties!D135 is in neither the transcribed state nor the corrected state (before ${before}, after ${after}); refusing`)
    }
}

main()
