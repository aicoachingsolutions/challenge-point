/**
 * Records the 13 September 2026 primary scoring additions and the 11 November 2026 correction in the RPC workbook's two record
 * sheets, "RC1.1 Resolutions" and "RC1.1 Audit", on Christian's approval of 11 November 2026 (second reply), item 5.
 *
 * Run from back/:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/apply-rpc-2026-11-11-rc11-record-sheets.ts
 *
 * CHRISTIAN'S WORDS (reply received 11 November 2026, the second that day, item 5, verbatim):
 *
 *   "I also approve updating the RC1.1 Resolutions and Audit sheets to accurately document the September 13 scoring additions and
 *   the November 11 correction.
 *   Please preserve the dates, original decisions, revisions, and provenance.
 *   This is documentation maintenance, not authorization to revise other governing knowledge.
 *   Please also retain the reported limitation concerning the tenth sheet that the verification check could not read. That should
 *   be addressed if it affects an authoritative dependency, but need not interrupt A02 otherwise." (received 11 November 2026,
 *   second reply)
 *
 * WHAT IT WRITES, AND NOTHING ELSE. Rows 6 to 11 of RC1.1 Resolutions (until now empty, formatted rows) and rows 27 to 32 of
 * RC1.1 Audit (until now empty), each cell an inline string in style 13, the style of every existing entry; and the Audit sheet's
 * dimension, A1:D26 to A1:D32. Every existing row is kept as written: the record is added to, never revised. The texts are in
 * RESOLUTION_ROWS and AUDIT_ROWS below. Christian's words are in double quotation marks with the date received; the
 * implementation's words, cell texts and labels are in single quotation marks.
 *
 * SCOPE OF THE RECORD. The two sheets record how RC1.1's action items landed. Their row '4 — Coach-facing scoring' records a How
 * to Score decision that made no canonical change, so coach-facing scoring decisions are within their scope: the three Attack
 * Development scoring rules (program text in primary-scoring.ts, not workbook rows) are recorded as such, with 'None' as their
 * canonical change. Nothing else of Christian's second reply of 11 November 2026 is recorded here.
 *
 * THE TWO SHEETS ARE NOT PROJECTED. project-rpc-workbook.py declares ten sheets and leaves the README and these two out ("Both are
 * Christian's record of how the action items landed, written for people, so they are not projected either."), so the library,
 * rpc-library.rc1.json, is not written. This script proves it: the library must equal the projection of the workbook, all ten
 * sheets and the derived metadata, byte for byte, before and after (the reader reads Metadata's boolean cells since 11 November
 * 2026; see workbook-projection.ts ReadOptions).
 *
 * WHAT EACH ROW STATES IS CHECKED BEFORE IT IS WRITTEN (checkWhatTheRowsState): the 7 scoring_event rows, RPC-REL-071 to
 * RPC-REL-094 in the approved order, RPC-PROP-132 to RPC-PROP-139, their provenance and status, RC1.1 ACTIVE, the scoring
 * vocabulary scope row, RPC-PROP-134's corrected wording against Christian's 13 September sentence, and that every other sheet
 * is byte for byte its state at the end of 13 September 2026 (commit 3288b92), Properties apart from D135.
 *
 * IDEMPOTENT, AND IT REFUSES ANYTHING ELSE. Each record sheet's XML must hash to its state since 13 September 2026 (the prior
 * state) or, with the new rows taken back out, to that same hash (already written: nothing is rewritten, everything re-verified).
 * Any other state stops it. Only the two sheets' zip entries are rewritten; every other entry's local header, compressed bytes
 * and central record (offset aside) are copied raw, so docProps/core.xml keeps its 'modified' date. It runs no python.
 */
import { createHash } from 'crypto'
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
    readSheetCells,
    readZipEntries,
    xmlAttributes,
    zipEntryData,
} from '../system/session-planning/workbook-projection'

const BACK = path.resolve(__dirname, '../..')
const XLSM = path.join(BACK, 'data/sport-modules/soccer/rpc-workbook.rc1.1.xlsm')
const LIBRARY = path.join(BACK, 'src/system/sport-module/rpc-library.rc1.json')

const RESOLUTIONS = 'RC1.1 Resolutions'
const AUDIT = 'RC1.1 Audit'

/** sha256 of each sheet's XML at the end of 13 September 2026 (commit 3288b92), measured 11 November 2026. */
const SEPTEMBER_13_SHEETS: Record<string, string> = {
    README: 'fba3156b55b413fdbd65cbe9ad33bb3bd968015b8df48066778c1783dc17cb23',
    Registry: 'fa1b1114722f84ba98b9b9953816f0c3656528179e434c7a95da141f1a90dd62',
    Statements: '7bda81d25836ff745cd6265d85928c63f101df000ecb72c6615fec0e36d16660',
    Properties: 'a5685d73976745941da8f987deab997772c5d98370ad1b5b0f0593ab2b2ed458',
    'Identity Rules': '198735bd1f51dc20f48eb7c3abe36de6fd55f86b78d1204969303c859a406d4b',
    'Context Transitions': '7850b4395f0a9697621a874d93d02a24ed99c414895578c63546873fccb21eb4',
    Relationships: '676733438756e8e92e0c9495f0a994ffd086c5209f668c7dcfdba1a77b7eb6fd',
    'Validation Rules': '6327ef59e3f3c31bf8e67c46a6d7cc7339780d08f549ee7ac2d73cf36a704cc6',
    Metadata: '45a90f8ddd1b1d9b29ce3ee39d360f6112689db6d5f6379a37882870677314a1',
    'Controlled Vocabulary': '653243cc445d46fc42f8c10c8f52031d3b84f26a305e376eda4713ba6f5157fd',
    'Implementation Staging': '5c42161930a681497897298b2e0a49b219e5f2e75f398b69a8c42c54b9be89b3',
    [RESOLUTIONS]: '88e515716859da370a294b5f4b170ca74e7718f0a7ef193220a0b21f64d40664',
    [AUDIT]: 'ea0a82c01fe3c3ce2b73ca5020b74df16e13b606de0f3624abe770dc12765d98',
}

/** Properties!D135 as transcribed on 13 September 2026 and as corrected on 11 November 2026 (commit 062cb7c). */
const D135 = (text: string): string => `<c r="D135" s="4" t="inlineStr"><is><t>${text}</t></is></c>`
const TRANSCRIBED =
    "Purposeful advancement from the attack's starting condition rather than possession alone: reaching a more advanced representative area while maintaining attacking possession."
const CORRECTED =
    "Purposeful advancement from the attack's starting condition rather than possession alone—for example, reaching a more advanced representative area while maintaining attacking possession."

/** Christian's 13 September 2026 email, line 38 of the filed copy, verbatim (curly apostrophe included). */
const SEPTEMBER_13_SENTENCE =
    'The qualifying condition should require purposeful advancement from the attack’s starting condition rather than possession alone—for example, reaching a more advanced representative area while maintaining attacking possession.'

const PROVENANCE = 'Christian, 2026-09-13: Primary Scoring Event approval (RC1.1)'
const SCORING_EVENTS = ['goal', 'target_player', 'line_crossed', 'target_zone_entered', 'gate', 'regain', 'denial']
/** Each context's valid events in the order Christian approved them on 13 September 2026 (apply-rpc-scoring-events.py). */
const CONTEXT_EVENTS: [string, string[]][] = [
    ['RPC-001', ['line_crossed', 'target_zone_entered', 'gate', 'target_player']],
    ['RPC-002', ['line_crossed', 'target_zone_entered', 'gate', 'target_player']],
    ['RPC-003', ['target_zone_entered', 'line_crossed', 'gate', 'target_player']],
    ['RPC-004', ['target_zone_entered', 'gate', 'target_player']],
    ['RPC-005', ['goal']],
    ['RPC-006', ['goal', 'line_crossed', 'target_zone_entered', 'target_player']],
    ['RPC-007', ['regain', 'denial']],
    ['RPC-008', ['regain', 'denial']],
]

/** The commit that taught the reader Metadata's boolean cells and put Metadata in the library comparison. */
const TENTH_SHEET_SAFEGUARD = '544b7fc'

type Row = [string, string, string, string]

/** RC1.1 Resolutions: Action Item | Decision | Canonical Change | Implementation Status. Rows 6 to 11. */
const RESOLUTION_ROWS: Row[] = [
    [
        'Record note (11 November 2026)',
        `"I also approve updating the RC1.1 Resolutions and Audit sheets to accurately document the September 13 scoring additions and the November 11 correction." "Please preserve the dates, original decisions, revisions, and provenance." "This is documentation maintenance, not authorization to revise other governing knowledge." (received 11 November 2026, second reply)`,
        'None. Rows 2 to 5 are kept as written. Rows 7 to 11 are added below them, each dated, and no other sheet is changed.',
        `Written on 11 November 2026 by Joe's implementation (back/src/scripts/apply-rpc-2026-11-11-rc11-record-sheets.ts), which checks what each row states against the workbook before writing it.`,
    ],
    [
        '4 — Coach-facing scoring: Primary Scoring Event approval (13 September 2026)',
        `Christian approved the Primary Scoring Event rows: "observable event + qualifying condition"; "the eight-row structure is approved with the refinements above;" "conditions can attach to any scoring event;" "no shot-on-target event for Chance Creation;" "add Denial as the seventh controlled event instead of Held;" "use the existing 5-second window for Counter-Press;" "do not establish a canonical fixed time window for Attack Prevention;" "close the Channel and Finishing/Positional Play realization gaps;" "use the event vocabulary with GA-001 Invasion for now without making a broader ownership decision." "Once those changes are reflected and the validation passes, I’m comfortable with RPC RC1.1 moving from PROPOSED to ACTIVE." (received 13 September 2026)`,
        `Added the same evening by Joe's implementation (commit e954541, apply-rpc-scoring-events.py), with the provenance '${PROVENANCE}' on each relationship and property row. Controlled Vocabulary: 7 scoring_event rows, under the event names Christian agreed (goal, target_player, line_crossed, target_zone_entered, gate, regain, denial); their descriptions are the implementation's wording, except denial's, which restates Christian's definition. Relationships: RPC-REL-071 to RPC-REL-094, 24 SCORING_EVENT rows, each context's valid events in the approved order. Properties: RPC-PROP-132 to RPC-PROP-139, one PRIMARY_SCORING_CONDITION per context, transcribed from Christian's condition for that context. Later that night: runtime_status PROPOSED to ACTIVE in Metadata and on the 8 Registry rows (commit 52cdd94, apply-rpc-rc1.1-active.py), and the Metadata row scoring_event_vocabulary_scope (commit 3288b92, apply-rpc-scoring-vocabulary-scope.py).`,
        `Applied 13 September 2026; RC1.1 ACTIVE since that night. The row '4 — Coach-facing scoring' above is kept as written; this row records what followed it.`,
    ],
    [
        '4 — Coach-facing scoring: RPC-PROP-134 transcription error (verified 10 November 2026)',
        `A finding, not a decision. Christian's email reads "${SEPTEMBER_13_SENTENCE}" (received 13 September 2026). The transcription of 13 September 2026 (commit e954541) wrote a colon in place of "—for example,", so the example read as the condition. Verified on 10 November 2026 against the filed copy of that email (sources repository: sources/2026-09-13-scoring-approval/originals/christian-scoring-approval-email.txt).`,
        `None that day: the offline review record was corrected, and the canonical change was prepared for Christian's separate approval (next row).`,
        `Properties!D135 then read: '${TRANSCRIBED}'`,
    ],
    [
        '4 — Coach-facing scoring: RPC-PROP-134 canonical correction (approved 11 November 2026)',
        `"I approve the canonical workbook correction." "The correction should replace the erroneous colon with the dash and "for example," without changing anything else in the canonical row." "The wording establishes an example of purposeful attacking advancement, not a mandatory condition requiring possession to be maintained in every qualifying scoring event." "Please preserve the original wording, the corrected wording, and the source and change provenance as you've already done in the offline review record." (received 11 November 2026)`,
        `Properties!D135 (RPC-PROP-134, property_text) only. Original wording: the previous row. Corrected wording: '${CORRECTED}' G135, the provenance '${PROVENANCE}', and every other cell are unchanged. The library row and apply-rpc-scoring-events.py's text were corrected with it (commit 062cb7c, apply-rpc-2026-11-11-attack-development-condition.ts).`,
        'Applied 11 November 2026 (commit 062cb7c), with a focused check that an example keeps the authority of an example (commit 1945baf). Not released: the live application is unchanged.',
    ],
    [
        '4 — Coach-facing scoring: meaning of the attacking-zone and attacking-line events (11 November 2026, second reply)',
        `"I approve the specific interpretation that controlled reception can complete the existing attacking-zone and attacking-line scoring events." "A player may also complete the event by dribbling through the relevant boundary." "Control on reception is judged by the coach in the immediate scoring situation. It should not imply an additional retention period, subsequent mandatory pass, or universal post-score possession consequence." "I am not granting blanket approval to all controlled-vocabulary descriptions." "Please preserve the distinction between the specific meanings approved here and other descriptions that remain unreviewed." (received 11 November 2026, second reply)`,
        'None: no Controlled Vocabulary row changed. The approved meaning is recorded for Attack Development (RPC-003) target_zone_entered and line_crossed only; every other context and scoring_event description remains unreviewed.',
        'Recorded in the program, not the workbook (primary-scoring.ts, APPROVED_EVENT_MEANINGS; commit f46857a). Not released.',
    ],
    [
        '4 — Coach-facing scoring: the three Attack Development scoring rules (11 November 2026, second reply)',
        `"I approve removing the unsupported phrase "and your team keeps the ball" from all three affected Attack Development scoring rules." "Attacking Zone — Approved" "Attacking Line — Approved" "Gate — Option 2 Approved" "This remains a narrow decision for the Attack Development gate event. It should not become a universal requirement for all gate-based activities." (received 11 November 2026, second reply)`,
        `None: the three rules are program text (primary-scoring.ts), not workbook rows. Recorded here because the row '4 — Coach-facing scoring' above records a How to Score decision that also made no canonical change.`,
        `Applied in the program in Christian's approved wording (commit f46857a). Not released.`,
    ],
]

const tail = (text: string): string => text.slice(text.indexOf('rather than possession alone'))

/** RC1.1 Audit: Audit Area | Check | Status | Evidence / Notes. Rows 27 to 32. */
const AUDIT_ROWS: Row[] = [
    [
        'Record note (11 November 2026)',
        'Rows 28 to 32 added; rows 2 to 26 kept as written',
        'NOTE',
        `Added on Christian's approval: "I also approve updating the RC1.1 Resolutions and Audit sheets to accurately document the September 13 scoring additions and the November 11 correction." (received 11 November 2026, second reply). Written by Joe's implementation (back/src/scripts/apply-rpc-2026-11-11-rc11-record-sheets.ts), which checks each PASS below against the workbook before writing it. Row 26 is kept as written; the canonical scoring change followed on 13 September 2026 (row 28).`,
    ],
    [
        'Action Item 4 — Scoring (13 September 2026)',
        'Primary scoring rows present, with provenance',
        'PASS',
        `Controlled Vocabulary: 7 scoring_event rows (goal, target_player, line_crossed, target_zone_entered, gate, regain, denial). Relationships: RPC-REL-071 to RPC-REL-094, 24 SCORING_EVENT rows, ACTIVE, each context's events in the approved order. Properties: RPC-PROP-132 to RPC-PROP-139, one PRIMARY_SCORING_CONDITION per context, ACTIVE. Provenance on all 32 relationship and property rows: '${PROVENANCE}'. Added by commit e954541. runtime_status ACTIVE in Metadata and on all 8 Registry rows (commit 52cdd94).`,
    ],
    [
        'Action Item 4 — Scoring (10 November 2026)',
        "RPC-PROP-134 matches Christian's 13 September email",
        'FAIL',
        `Expected: "${tail(SEPTEMBER_13_SENTENCE)}" (received 13 September 2026) | Actual: '${tail(TRANSCRIBED)}' The colon was the transcription of 13 September 2026 (commit e954541). Corrected 11 November 2026: row 30.`,
    ],
    [
        'Action Item 4 — Scoring (11 November 2026)',
        "RPC-PROP-134 matches Christian's 13 September email",
        'PASS',
        `Expected: "${tail(SEPTEMBER_13_SENTENCE)}" (received 13 September 2026) | Actual (Properties!D135): '${tail(CORRECTED)}' Only D135 changed (commit 062cb7c): the Properties sheet is otherwise as on 13 September 2026, G135 included, and the library row is equal. The row's straight apostrophe in 'attack's' is its own typography, not part of the correction.`,
    ],
    [
        'Action Item 4 — Scoring (11 November 2026, second reply)',
        'No workbook row changed for the three scoring rules or the event meaning',
        'PASS',
        'Both are recorded in the program (primary-scoring.ts, commit f46857a). Every sheet other than Properties, RC1.1 Resolutions and RC1.1 Audit, Controlled Vocabulary included, is as written on 13 September 2026; Properties differs only in D135 (row 30).',
    ],
    [
        'Verification check (11 November 2026)',
        "The library is the workbook's projection, all ten projected sheets",
        'PASS',
        `Reported limitation, kept: the check added with the correction (commit 062cb7c) compared nine of the ten projected sheets; the tenth, Metadata, was not read, because the reader refused its boolean cells. Metadata carries runtime_status, which the live application checks before it routes a guided goal to its context, so the gap could have hidden a change. Addressed (commit ${TENTH_SHEET_SAFEGUARD}): the reader reads boolean cells when asked, and rpc-library.unit.ts compares all ten sheets and the whole library, byte for byte.`,
    ],
]

const FIRST_RESOLUTION_ROW = 6
const FIRST_AUDIT_ROW = 27
const AUDIT_DIMENSION_BEFORE = '<dimension ref="A1:D26" />'
const AUDIT_DIMENSION_AFTER = `<dimension ref="A1:D${FIRST_AUDIT_ROW + AUDIT_ROWS.length - 1}" />`

/** The ten sheets project-rpc-workbook.py projects, in its order, with their keys in the library. */
const PROJECTED_TABLES: [string, string][] = [
    ['Registry', 'registry'],
    ['Statements', 'statements'],
    ['Relationships', 'relationships'],
    ['Properties', 'properties'],
    ['Identity Rules', 'identity_rules'],
    ['Context Transitions', 'transitions'],
    ['Validation Rules', 'validation_rules'],
    ['Controlled Vocabulary', 'controlled_vocabulary'],
    ['Implementation Staging', 'implementation_staging'],
    ['Metadata', 'metadata_rows'],
]

type Table = Record<string, CellValue>[]

const sha256 = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex')
const occurrences = (text: string, anchor: string): number => text.split(anchor).length - 1
const escapeXml = (text: string): string => text.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;')

function cellsXml(row: number, values: Row): string {
    return values.map((value, i) => `<c r="${'ABCD'[i]}${row}" s="13" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`).join('')
}

/** Each written row as [empty XML, filled XML]: the empty one is the sheet's own formatted blank row, attributes kept. */
function resolutionRowEdits(): [string, string][] {
    return RESOLUTION_ROWS.map((values, i) => {
        const n = FIRST_RESOLUTION_ROW + i
        return [`<row r="${n}"><c r="A${n}" s="4" t="n" /><c r="B${n}" s="4" t="n" /><c r="C${n}" s="4" t="n" /><c r="D${n}" s="4" t="n" /></row>`, `<row r="${n}">${cellsXml(n, values)}</row>`]
    })
}

function auditRowEdits(): [string, string][] {
    const edits: [string, string][] = AUDIT_ROWS.map((values, i) => {
        const n = FIRST_AUDIT_ROW + i
        return [`<row r="${n}" ht="15.75" customHeight="1" s="15"></row>`, `<row r="${n}" ht="15.75" customHeight="1" s="15">${cellsXml(n, values)}</row>`]
    })
    return [[AUDIT_DIMENSION_BEFORE, AUDIT_DIMENSION_AFTER], ...edits]
}

/** Applies each edit, each anchor required exactly once; `back` undoes them. Refuses naming the first anchor that is not there once. */
function applyEdits(xml: string, edits: [string, string][], back: boolean, sheet: string): string {
    let out = xml
    for (const [empty, filled] of edits) {
        const [from, to] = back ? [filled, empty] : [empty, filled]
        if (occurrences(out, from) !== 1) throw new Error(`${sheet}: expected exactly one ${from.slice(0, 80)}…; nothing written`)
        out = out.replace(from, () => to)
    }
    return out
}

/** The zip entry holding the named sheet, found through the workbook and its relationships — never assumed. */
function sheetEntries(zip: Buffer): Map<string, string> {
    const entries = readZipEntries(zip)
    const read = (name: string) => zipEntryData(zip, entries.find((entry) => entry.name === name)!).toString('utf8')
    const rels = new Map([...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b([^>]*?)\/?>/g)].map((m) => xmlAttributes(m[1])).map((a) => [a.Id, a.Target]))
    const out = new Map<string, string>()
    for (const sheet of [...read('xl/workbook.xml').matchAll(/<sheet\b([^>]*?)\/?>/g)].map((m) => xmlAttributes(m[1]))) {
        const target = rels.get(sheet['r:id'])
        if (!target) throw new Error(`sheet ${sheet.name} has no relationship`)
        out.set(sheet.name, target.startsWith('/') ? target.slice(1) : `xl/${target}`)
    }
    return out
}

function entryText(zip: Buffer, name: string): string {
    return zipEntryData(zip, readZipEntries(zip).find((entry) => entry.name === name)!).toString('utf8')
}

/** The archive with the named entries' content replaced; every other entry's local header and compressed bytes copied raw. */
function rewriteEntries(zip: Buffer, contents: Map<string, Buffer>): Buffer {
    const entries = readZipEntries(zip)
    const eocd = endOfCentralDirectory(zip)
    const locals: Buffer[] = []
    const centrals: Buffer[] = []
    let offset = 0
    let cdAt = zip.readUInt32LE(eocd + 16)
    for (const entry of entries) {
        const dataStart = entryDataOffset(zip, entry)
        const header = Buffer.from(zip.subarray(entry.localHeaderOffset, dataStart))
        const nameLength = zip.readUInt16LE(cdAt + 28)
        const cdLength = 46 + nameLength + zip.readUInt16LE(cdAt + 30) + zip.readUInt16LE(cdAt + 32)
        const central = Buffer.from(zip.subarray(cdAt, cdAt + cdLength))
        cdAt += cdLength
        let data: Buffer = zip.subarray(dataStart, dataStart + entry.compressedSize)
        const content = contents.get(entry.name)
        if (content) {
            if (entry.method !== 8) throw new Error(`${entry.name} is not deflated; refusing to change its method`)
            data = deflateRawSync(content)
            for (const [buffer, at] of [[header, 14], [central, 16]] as const) {
                buffer.writeUInt32LE(crc32(content), at)
                buffer.writeUInt32LE(data.length, at + 4)
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
function entriesNotCopiedRaw(original: Buffer, written: Buffer, changed: Set<string>): string[] {
    const before = readZipEntries(original)
    const after = readZipEntries(written)
    if (JSON.stringify(before.map((entry) => entry.name)) !== JSON.stringify(after.map((entry) => entry.name))) return ['the entry list or its order']
    const centralBefore = centralRecords(original)
    const centralAfter = centralRecords(written)
    const bytes = (zip: Buffer, entry: (typeof before)[number]) => zip.subarray(entry.localHeaderOffset, entryDataOffset(zip, entry) + entry.compressedSize)
    return before
        .filter((entry, i) => !changed.has(entry.name) && (!bytes(original, entry).equals(bytes(written, after[i])) || !centralBefore.get(entry.name)!.equals(centralAfter.get(entry.name)!)))
        .map((entry) => entry.name)
}

/** project-rpc-workbook.py's clean(): a string stripped, a blank one None; a number or a boolean as it is. */
const clean = (value: CellValue): CellValue => (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value)

function projectTables(zip: Buffer): Record<string, Table> {
    const workbook = openWorkbook(zip, { booleans: true })
    return Object.fromEntries(
        PROJECTED_TABLES.map(([sheet, key]) => [key, projectSheet(workbook.cells(sheet)).map((row) => Object.fromEntries(Object.entries(row).map(([column, value]) => [column, clean(value)])))]),
    )
}

/** The library as project-rpc-workbook.py writes it from these tables (rpc-library.unit.ts C0 proves the same for the committed pair). */
function libraryText(tables: Record<string, Table>): string {
    const projection: Record<string, unknown> = { source_workbook: path.basename(XLSM), header_row: 1 }
    for (const [, key] of PROJECTED_TABLES) projection[key] = tables[key]
    projection['metadata'] = Object.fromEntries(tables['metadata_rows'].map((row) => [String(row['metadata_key']), row['metadata_value']]))
    return JSON.stringify(projection, null, 2) + '\n'
}

/** Every statement the PASS rows make, checked against the workbook itself. Refuses naming the first that does not hold. */
function checkWhatTheRowsState(zip: Buffer, sheets: Map<string, string>): void {
    const fail = (what: string): never => {
        throw new Error(`the record would state what the workbook does not hold: ${what}; nothing written`)
    }
    // Every sheet but the two record sheets is byte for byte its 13 September 2026 state; Properties too, once D135 is put back.
    for (const [sheet, entry] of sheets) {
        if (sheet === RESOLUTIONS || sheet === AUDIT) continue
        let xml = entryText(zip, entry)
        if (sheet === 'Properties') {
            if (occurrences(xml, D135(CORRECTED)) !== 1) fail('Properties!D135 does not hold the corrected wording once')
            xml = xml.replace(D135(CORRECTED), () => D135(TRANSCRIBED))
        }
        if (SEPTEMBER_13_SHEETS[sheet] === undefined || sha256(xml) !== SEPTEMBER_13_SHEETS[sheet]) fail(`the ${sheet} sheet is not as it was on 13 September 2026${sheet === 'Properties' ? ' apart from D135' : ''}`)
    }
    if (sheets.size !== Object.keys(SEPTEMBER_13_SHEETS).length) fail('the workbook does not hold the thirteen sheets it held on 13 September 2026')

    const tables = projectTables(zip)
    const vocabulary = tables['controlled_vocabulary'].filter((row) => row['vocabulary'] === 'scoring_event').map((row) => row['value'])
    if (JSON.stringify(vocabulary) !== JSON.stringify(SCORING_EVENTS)) fail(`scoring_event rows ${JSON.stringify(vocabulary)}`)

    const relationships = tables['relationships'].filter((row) => row['related_library'] === 'SCORING_EVENT')
    const expectedIds = Array.from({ length: 24 }, (_, i) => `RPC-REL-${String(71 + i).padStart(3, '0')}`)
    if (JSON.stringify(relationships.map((row) => row['relationship_id'])) !== JSON.stringify(expectedIds)) fail('SCORING_EVENT relationships other than RPC-REL-071 to RPC-REL-094')
    for (const [rpcId, events] of CONTEXT_EVENTS) {
        const got = relationships.filter((row) => row['rpc_id'] === rpcId).map((row) => row['related_id'])
        if (JSON.stringify(got) !== JSON.stringify(events)) fail(`${rpcId}'s scoring events ${JSON.stringify(got)}, not the approved order`)
    }

    const conditions = tables['properties'].filter((row) => row['property_category'] === 'PRIMARY_SCORING_CONDITION')
    const expectedProperties = Array.from({ length: 8 }, (_, i) => `RPC-PROP-${132 + i}`)
    if (JSON.stringify(conditions.map((row) => row['property_id'])) !== JSON.stringify(expectedProperties)) fail('PRIMARY_SCORING_CONDITION rows other than RPC-PROP-132 to RPC-PROP-139')
    if (JSON.stringify(conditions.map((row) => row['rpc_id'])) !== JSON.stringify(CONTEXT_EVENTS.map(([rpcId]) => rpcId))) fail('a context without exactly one condition')
    for (const row of [...relationships, ...conditions]) {
        if (row['provenance'] !== PROVENANCE) fail(`${String(row['relationship_id'] ?? row['property_id'])}'s provenance`)
        if (row['status'] !== 'ACTIVE') fail(`${String(row['relationship_id'] ?? row['property_id'])} is not ACTIVE`)
    }

    const condition = conditions.find((row) => row['property_id'] === 'RPC-PROP-134')
    if (condition?.['property_text'] !== CORRECTED) fail("RPC-PROP-134's corrected wording")
    if (tail(CORRECTED) !== tail(SEPTEMBER_13_SENTENCE)) fail('the corrected wording, from "rather than" on, differs from the 13 September sentence')

    const metadata = Object.fromEntries(tables['metadata_rows'].map((row) => [String(row['metadata_key']), row['metadata_value']]))
    if (metadata['runtime_status'] !== 'ACTIVE') fail('Metadata runtime_status ACTIVE')
    if (tables['registry'].length !== 8 || tables['registry'].some((row) => row['runtime_status'] !== 'ACTIVE')) fail('the 8 Registry rows ACTIVE')
    if (metadata['scoring_event_vocabulary_scope'] !== 'Used with GA-001 Invasion; no broader ownership claim') fail('the Metadata row scoring_event_vocabulary_scope')
}

/** Each record sheet read back by the reader: the rows it held before, then exactly the rows written. The consumer proves the XML. */
function checkReadBack(priorXml: string, writtenXml: string, rows: Row[], sheet: string): void {
    const project = (xml: string) => projectSheet(readSheetCells(xml)).map((row) => Object.values(row))
    const expected = [...project(priorXml), ...rows]
    if (JSON.stringify(project(writtenXml)) !== JSON.stringify(expected)) throw new Error(`${sheet} does not read back as its earlier rows followed by the rows written; nothing written`)
}

function main(): void {
    const original = readFileSync(XLSM)
    const sheets = sheetEntries(original)
    const library = readFileSync(LIBRARY, 'utf8').split('\r\n').join('\n')
    const tablesBefore = projectTables(original)
    if (libraryText(tablesBefore) !== library) throw new Error('the library is not the workbook projected (all ten sheets and metadata); nothing written')
    checkWhatTheRowsState(original, sheets)

    const plan: [string, [string, string][], Row[]][] = [
        [RESOLUTIONS, resolutionRowEdits(), RESOLUTION_ROWS],
        [AUDIT, auditRowEdits(), AUDIT_ROWS],
    ]
    const states = plan.map(([sheet, edits]) => {
        const xml = entryText(original, sheets.get(sheet)!)
        if (sha256(xml) === SEPTEMBER_13_SHEETS[sheet]) return 'prior'
        let reverted = ''
        try {
            reverted = applyEdits(xml, edits, true, sheet)
        } catch {
            return 'other'
        }
        return sha256(reverted) === SEPTEMBER_13_SHEETS[sheet] ? 'written' : 'other'
    })

    if (states.every((state) => state === 'prior')) {
        const contents = new Map<string, Buffer>()
        for (const [sheet, edits, rows] of plan) {
            const xml = entryText(original, sheets.get(sheet)!)
            const written = applyEdits(xml, edits, false, sheet)
            checkReadBack(xml, written, rows, sheet)
            contents.set(sheets.get(sheet)!, Buffer.from(written, 'utf8'))
        }
        const written = rewriteEntries(original, contents)
        const notRaw = entriesNotCopiedRaw(original, written, new Set(contents.keys()))
        if (notRaw.length) throw new Error(`the rewrite would change ${notRaw.join(', ')} as well; nothing written`)
        const tablesAfter = projectTables(written)
        if (libraryText(tablesAfter) !== library) throw new Error('the rewrite would change the projection of the ten library sheets; nothing written')
        checkWhatTheRowsState(written, sheetEntries(written))
        writeFileSync(XLSM, written)
        console.log(`wrote ${XLSM}: ${RESOLUTIONS} rows ${FIRST_RESOLUTION_ROW} to ${FIRST_RESOLUTION_ROW + RESOLUTION_ROWS.length - 1}, ${AUDIT} rows ${FIRST_AUDIT_ROW} to ${FIRST_AUDIT_ROW + AUDIT_ROWS.length - 1} and its dimension; the other ${readZipEntries(written).length - 2} entries copied raw; the library's ten tables and metadata unchanged`)
    } else if (states.every((state) => state === 'written')) {
        for (const [sheet, edits, rows] of plan) {
            const xml = entryText(original, sheets.get(sheet)!)
            checkReadBack(applyEdits(xml, edits, true, sheet), xml, rows, sheet)
        }
        console.log('both record sheets already hold these rows; nothing rewritten, everything re-verified')
    } else {
        throw new Error(`the record sheets are in neither the prior state nor the written state (${plan.map(([sheet], i) => `${sheet}: ${states[i]}`).join(', ')}); refusing`)
    }
}

main()
