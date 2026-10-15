/**
 * Records Christian's 15 October 2026 answer 1 in the Session Planning Model: Play Out from the Back (A01) →
 * Gain Access (GP-005), primary only. Writes the canonical workbook AND regenerates its JSON projection.
 *
 * Run from back/:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/apply-spm-2026-10-15-a01-game-problem.ts
 *
 * HIS WORDS (15 October 2026, item 1, verbatim):
 *
 *   "I approve Gain Access as the primary Game Problem for Play Out from the Back, based on the approved
 *   Goalkeeper Build-Out context and its scoring condition.
 *   Create Space remains relevant as a potential means of solving the problem, but I agree that we should not
 *   assign it as a secondary Game Problem at this stage. Let's retain our existing decision to defer secondary
 *   Game Problems.
 *   This resolves the Cycle 8 translation gap for this Learning Goal through the approved context rather than
 *   inference from the goal's wording.
 *   One important distinction: approving Gain Access does not automatically authorize the candidate
 *   constraints currently derived from vocabulary coverage.
 *   I would prefer that the activity's constraints be selected based on their documented relationship to the
 *   approved context, Game Problem, and target affordances.
 *   The context's existing manipulations—starting positions, field dimensions, progression references,
 *   defensive numbers, goalkeeper positioning, overloads, and support spacing—are appropriate candidates for
 *   evaluation. However, they should not automatically become selected constraints simply because they appear
 *   in that list.
 *   Please identify the smallest set of authorized manipulations needed to create a representative build-out
 *   problem, and flag any missing knowledge rather than filling gaps through inference."
 *
 * It answers our 14 October decision email (A01 Game Problem, Gain Access recommended).
 *
 * THE NOTE IT REPLACES (Engine Translation D2, Cycle 8, verbatim):
 *   "Intentional runtime gap (Cycle 8 §5) — no placeholder mapping. Runtime realization opportunity, not a
 *   knowledge deficiency."
 *
 * WHAT IT CHANGES, AND NOTHING ELSE. Engine Translation row 2 (A01): Primary GP IDs (B2) := 'GP-005'; Secondary
 * GP IDs (C2) stays empty (his Cycle 8 §4 deferral, retained); Notes (D2) := a short provenance note. Only the
 * Engine Translation sheet's zip entry is rewritten; every other entry's compressed bytes are copied raw, so
 * docProps/core.xml's 'modified' date is left as it was (openpyxl would have updated it). The JSON is then
 * regenerated from the written workbook by `workbook-projection.ts` (the same projector the agreement test in
 * session-planning-model.unit.ts runs), written with LF as the index stores it.
 *
 * IDEMPOTENT, AND IT REFUSES ANYTHING ELSE (apply-rc1.1-decisions.py's pattern): it asserts the exact prior cells,
 * each anchor once; on the post state it rewrites nothing and only re-verifies; on any other state it stops.
 * After writing, it re-projects and requires the projection to differ from the previous one in exactly A01's
 * Primary GP IDs and Notes.
 *
 * NOT WHAT IT DOES: it authorizes no constraint. His same item says approving Gain Access "does not
 * automatically authorize the candidate constraints currently derived from vocabulary coverage"; that is
 * recorded, in the same commit, in test-library/library/learning-goal-authorizations.json, which selection
 * consults before the Game Problem's Coverage row.
 */
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { deflateRawSync } from 'zlib'

import {
    crc32,
    endOfCentralDirectory,
    entryDataOffset,
    projectSessionPlanningWorkbookObject,
    projectSessionPlanningWorkbook,
    readZipEntries,
    xmlAttributes,
    zipEntryData,
} from '../system/session-planning/workbook-projection'

const BACK = path.resolve(__dirname, '../..')
const XLSX = path.join(BACK, 'data/session-planning/session-planning-model.rc1.xlsx')
const JSON_OUT = path.join(BACK, 'src/system/session-planning/session-planning-model.rc1.json')

const NOTE =
    'Approved 2026-10-15 (Christian, A01 decision 1) — Primary Representative Game Problem Translation: Gain Access, based on the approved ' +
    'Goalkeeper Build-Out context (RPC-001) and its scoring condition. No secondary (Cycle 8 §4 deferral retained). Replaces the Cycle 8 §5 ' +
    'intentional runtime gap. Does not by itself authorize candidate constraints derived from vocabulary coverage.'

const CYCLE8_NOTE = 'Intentional runtime gap (Cycle 8 §5) — no placeholder mapping. Runtime realization opportunity, not a knowledge deficiency.'

const BEFORE = {
    B2: '<c r="B2" s="4" t="n" />',
    D2: `<c r="D2" s="4" t="inlineStr"><is><t>${CYCLE8_NOTE}</t></is></c>`,
}
const AFTER = {
    B2: '<c r="B2" s="4" t="inlineStr"><is><t>GP-005</t></is></c>',
    D2: `<c r="D2" s="4" t="inlineStr"><is><t>${NOTE}</t></is></c>`,
}
const C2 = '<c r="C2" s="4" t="n" />'
const A2 = '<c r="A2" s="4" t="inlineStr"><is><t>A01</t></is></c>'

const occurrences = (text: string, anchor: string): number => text.split(anchor).length - 1

/** The zip entry holding the named sheet, found through the workbook and its relationships — never assumed. */
function sheetEntryName(zip: Buffer, sheetName: string): string {
    const entries = readZipEntries(zip)
    const read = (name: string) => zipEntryData(zip, entries.find((entry) => entry.name === name)!).toString('utf8')
    const sheet = [...read('xl/workbook.xml').matchAll(/<sheet\b([^>]*?)\/?>/g)].map((m) => xmlAttributes(m[1])).find((a) => a.name === sheetName)
    if (!sheet) throw new Error(`no sheet named ${sheetName}`)
    const rel = [...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b([^>]*?)\/?>/g)].map((m) => xmlAttributes(m[1])).find((a) => a.Id === sheet['r:id'])
    if (!rel) throw new Error(`sheet ${sheetName} has no relationship`)
    return rel.Target.startsWith('/') ? rel.Target.slice(1) : `xl/${rel.Target}`
}

/** The archive with one entry's content replaced; every other entry's local header and compressed bytes copied raw. */
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

/** Every field where two projections differ, as 'sheet[goal or index].column'. */
function differences(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
    const out: string[] = []
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
        const a = before[key]
        const b = after[key]
        if (!Array.isArray(a) || !Array.isArray(b)) {
            if (JSON.stringify(a) !== JSON.stringify(b)) out.push(key)
            continue
        }
        if (a.length !== b.length) out.push(`${key} (row count ${a.length} → ${b.length})`)
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            for (const column of new Set([...Object.keys(a[i]), ...Object.keys(b[i])])) {
                if (JSON.stringify(a[i][column]) !== JSON.stringify(b[i][column])) out.push(`${key}[${a[i]['Learning Goal ID'] ?? i}].${column}`)
            }
        }
    }
    return out
}

function main(): void {
    const original = readFileSync(XLSX)
    const target = sheetEntryName(original, 'Engine Translation')
    const entry = readZipEntries(original).find((e) => e.name === target)!
    const xml = zipEntryData(original, entry).toString('utf8')

    for (const anchor of [A2, C2]) if (occurrences(xml, anchor) !== 1) throw new Error(`expected exactly one ${anchor}; refusing`)
    const before = Object.values(BEFORE).map((anchor) => occurrences(xml, anchor))
    const after = Object.values(AFTER).map((anchor) => occurrences(xml, anchor))
    const committedProjection = projectSessionPlanningWorkbookObject(original)

    let written = original
    if (before.every((n) => n === 1) && after.every((n) => n === 0)) {
        const changed = xml.replace(BEFORE.B2, AFTER.B2).replace(BEFORE.D2, AFTER.D2)
        written = rewriteEntry(original, target, Buffer.from(changed, 'utf8'))
        const moved = differences(committedProjection, projectSessionPlanningWorkbookObject(written))
        const expected = ['engine_translation[A01].Primary GP IDs', 'engine_translation[A01].Notes']
        if (JSON.stringify(moved) !== JSON.stringify(expected)) throw new Error(`the edit moved ${JSON.stringify(moved)}, not exactly A01's Primary and Notes; nothing written`)
        writeFileSync(XLSX, written)
        console.log(`wrote ${XLSX}: A01 Primary GP IDs = GP-005, Notes replaced; ${moved.join(', ')}`)
    } else if (after.every((n) => n === 1) && before.every((n) => n === 0)) {
        console.log('the workbook already records the 15 October ruling; nothing rewritten')
    } else {
        throw new Error(`the Engine Translation row 2 is in neither the Cycle 8 state nor the 15 October state (before ${before}, after ${after}); refusing`)
    }

    // The JSON is the projection of what is on disk now, LF, as the index stores it.
    const projection = projectSessionPlanningWorkbook(readFileSync(XLSX))
    writeFileSync(JSON_OUT, projection)
    const a01 = (JSON.parse(projection).engine_translation as Record<string, unknown>[]).find((row) => row['Learning Goal ID'] === 'A01')!
    if (a01['Primary GP IDs'] !== 'GP-005' || a01['Secondary GP IDs'] !== null || a01['Notes'] !== NOTE) throw new Error(`A01 did not project as recorded: ${JSON.stringify(a01)}`)
    console.log(`wrote ${JSON_OUT}: A01 ${JSON.stringify(a01)}`)
}

main()
