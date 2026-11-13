/**
 * **The review print of an activity in Christian's four parts, every sentence marked and graded** (TEST-ONLY; stage B2 of the A02
 * complete-activity package, 12 November 2026; stage A2, 13 November 2026, the grades and the coach text). Christian, received 12 November 2026,
 * item 5: "Setup: What the coach needs to arrange." "Rules: What players need to know to play." "Scoring: What earns a point and when."
 * "Learning explanation: A short, meaningful connection between the game conditions and the intended learning problem."
 *
 * A print only: it groups the sentences the chain said (served, or the administrator's draft of a refusal) by OUR DRAFT map of today's
 * sections to the four parts (`PART_OF_SECTION`), never renaming a served section (sections.ts and A01's page do not change: renaming them
 * would be a live coach-facing change, Christian's). Each line carries its marker, whose words it is: [A] APPROVED (Christian's approved
 * wording), [C] CANDIDATE (our wording of approved knowledge, for review), [D] DRAFT (the renderer's own template words), [P] PROPOSED (new
 * knowledge of ours, a printed-only sentence); and, since stage A2, its grade beside the marker, as the handoff grades the sentence (appendix
 * F7): 'PROPOSED Qn' on a DRAFT or PROPOSED line resting on an item of ours that waits on Christian's question Qn, 'contingent on Qn' on an
 * APPROVED or CANDIDATE line resting on one; and every quantity whose support is ILLUSTRATIVE carries its label inline, where the line shows
 * it (by the path it cites, or, stage A2, by showing a session value such as the area's width).
 *
 * The coach text (stage A2): a printed-only sentence, or a said sentence of our CANDIDATE wording, may state one or more said sentences in
 * fewer words (`standsFor`, each said sentence named by its exact text). It is then printed in their place, in its own part, where the first
 * of them in that part was said; it takes every grade those sentences carry, and the ILLUSTRATIVE label of each quantity it shows that they
 * show. Every said sentence is printed exactly once: as itself, or stated by exactly one line; a sentence stated twice, a sentence printed
 * nowhere, and a `standsFor` naming no said sentence are refused (`printRefusals`). The engine's own sentences, each with its grade and where
 * it is printed, are listed beside the text (`engineLines`), so the reader sees what the engine says.
 *
 * 'Adjusting the activity' belongs to no part: where present it is printed as a finding (K2 retains the form without manipulation, so it
 * should be empty). A sentence whose section has no part is a finding too, never dropped.
 *
 * Imported, it runs nothing; run alone (it is registered), it holds its own checks with their bites.
 *
 * Run alone: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/four-part-print.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

/** The four parts, in Christian's order (received 12 November 2026, item 5). */
export const PARTS = ['Setup', 'Rules', 'Scoring', 'Learning explanation'] as const
export type Part = (typeof PARTS)[number]

/** OUR DRAFT map of today's sections (sections.ts) to the four parts; 'Adjusting the activity' is no part (a finding where present). */
export const PART_OF_SECTION: Readonly<Record<string, Part>> = {
    'Set up': 'Setup',
    Players: 'Setup',
    'How it works': 'Rules',
    'When it ends': 'Rules',
    'Restarts and ball out': 'Rules',
    'Role exchange': 'Rules',
    'How to score': 'Scoring',
}

export type Marker = 'A' | 'C' | 'D' | 'P'
const MARKER_OF: Readonly<Record<string, Marker>> = { APPROVED: 'A', CANDIDATE: 'C', DRAFT: 'D' }

/** One sentence the chain said, as the handoff's answer carries it. */
export interface SaidSentence {
    section: string
    block: string | null
    text: string
    from: string[]
    wording: string
    /** Stage A2: the questions of Christian's that the items of ours it rests on wait on, as the handoff grades the sentence (none: []). */
    questions?: string[]
    /**
     * FIX (13 November 2026, from the V3 verification, check 4): for an APPROVED sentence, whose approved wording it is and when Christian's reply
     * approving it was received (`approvedSourceOf`); printed as the marker's words. An APPROVED line without one is refused by `printRefusals`.
     */
    source?: string
}
/** A sentence the engine never says, printed in its part with its label (our CANDIDATE wording file's `printerOnly`, or the purpose). */
export interface PrintedOnly {
    id: string
    part: Part
    label: 'APPROVED' | 'PROPOSED' | 'CANDIDATE'
    sentence: string
    note?: string
    /** Stage A2: the said sentences (exact texts) this sentence states in their place. */
    standsFor?: string[]
    /** Stage A2: the questions this sentence rests on beyond what it states (a learning explanation resting on a PROPOSED element). */
    restsOn?: string[]
    /**
     * Stage A2: the marker's own words where they say more than the letter (the purpose: whose source, and when it was chosen). FIX (13 November
     * 2026, V3 check 4): the words after the letter, printed '[A: words | grades]'; required on every APPROVED line, naming a received date.
     */
    markerWords?: string
    /**
     * FIX (13 November 2026, V3 check 4): the sentence's own ILLUSTRATIVE label, for a quantity it shows that no sentence it states labels (the
     * placement rule's 'about 12 m' printed beside a game that says no line); required in its text by `printRefusals`.
     */
    illustrative?: string
}
/** Stage A2: a said sentence of our CANDIDATE wording that states other said sentences in their place (its entry's `standsFor`). */
export interface SaidStandsFor {
    text: string
    standsFor: string[]
}
export interface PrintedLine {
    part: Part
    marker: Marker
    /** The marker as printed, with the grade: '[D | PROPOSED Q3]', '[C | contingent on Q1]', '[A: ...]'. */
    shownMarker: string
    /** The line as printed after its marker: the sentence, its block where it is one block's, its ILLUSTRATIVE labels, its note. */
    text: string
    /** The sentence alone (no label, no note): what a coach reads. */
    plain: string
    /** The ILLUSTRATIVE labels the line carries inline, one per ILLUSTRATIVE quantity it shows. */
    illustrative: string[]
    /** Stage A2: the grades the line carries beside its marker. */
    grades: string[]
    /** The chain's sentence it prints, or the printed-only sentence's id. */
    of: { said: SaidSentence } | { printed: string }
    /** Stage A2: the said sentences this line states in their place. */
    states: SaidSentence[]
}
export interface FourPartPrint {
    lines: PrintedLine[]
    findings: string[]
    text: string
    /** FIX (13 November 2026, V3 check 4): the printed-only sentences the print was given, so `printRefusals` recomputes each line's marker from them. */
    printed: PrintedOnly[]
}
export interface PrintInput {
    heading: string[]
    said: SaidSentence[]
    printed: PrintedOnly[]
    illustrativeOf: (path: string) => string | null
    /** Stage A2: session values a sentence may show without citing their path ('30 m'), each with its ILLUSTRATIVE label. */
    illustrativeShown?: Array<{ shows: string; label: string }>
    /** Stage A2: said sentences of our CANDIDATE wording that state other said sentences. */
    saidStandsFor?: SaidStandsFor[]
    /**
     * FIX (13 November 2026, from the HPE-2 verification V2 F14): a sentence printed as said that ends without a full stop is printed with one
     * (the line's text only: what a coach reads, `plain`, and the engine's own list keep the engine's words). Off unless a print asks for it, so
     * every print made before it is unchanged.
     */
    stopSaid?: boolean
}
/** Whether a sentence already ends as a sentence does. */
const endsAsSentence = (text: string): boolean => ['.', '!', '?'].includes(text.slice(-1))

/** Whether `text` shows `shown` at a word start (so '12 m' is not read inside '112 m'). */
const shows = (text: string, shown: string): boolean => {
    let at = text.indexOf(shown)
    while (at >= 0) {
        const before = at === 0 ? ' ' : text[at - 1]
        if (before < '0' || before > '9') return true
        at = text.indexOf(shown, at + 1)
    }
    return false
}
/** The numbers a text shows, as written (digit runs). */
const numbersIn = (text: string): string[] => {
    const out: string[] = []
    let cur = ''
    for (const ch of `${text} `) {
        if (ch >= '0' && ch <= '9') cur += ch
        else if (cur) {
            out.push(cur)
            cur = ''
        }
    }
    return out
}
/** A grade as printed beside a marker: PROPOSED where the line's words are DRAFT or PROPOSED, contingent where they are APPROVED or CANDIDATE. */
const gradeWords = (marker: Marker, question: string) => (marker === 'D' || marker === 'P' ? `PROPOSED ${question}` : `contingent on ${question}`)
const byQuestion = (a: string, b: string) => Number(a.slice(1)) - Number(b.slice(1)) || a.localeCompare(b)
/** A printed-only sentence's letter, from its label. */
const markerOfLabel = (label: PrintedOnly['label']): Marker => (label === 'APPROVED' ? 'A' : label === 'PROPOSED' ? 'P' : 'C')
/** The marker as printed: the letter, its words where it has them ('A: whose wording, received ...'), then the grades. */
const shownMarkerOf = (marker: Marker, grades: string[], words?: string) => `[${marker}${words ? `: ${words}` : ''}${grades.length ? ` | ${grades.join(' | ')}` : ''}]`
/** Whether marker words name the date Christian's reply was received ('received ' followed by a day). */
const namesReceived = (words: string | undefined): boolean => {
    const at = words ? words.indexOf('received ') : -1
    const day = at >= 0 ? words!.charAt(at + 'received '.length) : ''
    return day >= '0' && day <= '9'
}

/**
 * FIX (13 November 2026, from the V3 verification, check 4, FAIL A): the approved wording each APPROVED sentence the engine says comes from, and
 * the date Christian's reply approving it was RECEIVED, verified against the recovered reply (the approval record's own date is our filing date,
 * which ran ahead of when replies arrived). POSSESSION_CONTINUES: its current sentence holds Christian's item 5 replacement of its second
 * clause, in the reply received 25 October 2026, recovered at 2026-10-25T11-49-28Z (the record dates it 2026-10-28, our filing date).
 * A said APPROVED sentence that matches no row here gets no source, and `printRefusals` refuses it (fail closed). Each row is held to the
 * approved table (its id there, approved, its first part the sentence's start) by `approvedSourceRefusals`.
 */
export const APPROVED_SOURCES: ReadonlyArray<{ id: string; startsWith: string; received: string }> = [
    { id: 'POSSESSION_CONTINUES', startsWith: 'When possession changes, play carries on without a stoppage', received: '25 October 2026' },
]
/** The marker words of an APPROVED sentence: whose approved wording it is and when Christian's reply was received; undefined where no row matches. */
export const approvedSourceOf = (text: string): string | undefined => {
    const row = APPROVED_SOURCES.find((r) => text.startsWith(r.startsWith))
    return row ? `Christian's approved wording ${row.id}, received ${row.received}` : undefined
}
/** Each source row held to the approved table: the id is an approved template or entry there, and its first part begins as the row says. */
export function approvedSourceRefusals(rows: ReadonlyArray<{ id: string; startsWith: string; received: string }> = APPROVED_SOURCES): string[] {
    const table = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', '..', 'docs', 'audits', 'approved-coach-wording.json'), 'utf8'))
    const all: any[] = [...(table.entries ?? []), ...(table.approvedTemplateSentences ?? [])]
    const out: string[] = []
    for (const r of rows) {
        const hit = all.find((x) => x.id === r.id)
        if (!hit) out.push(`${r.id} is not in the approved table`)
        else if (!hit.approvedBy?.who || !hit.approvedBy?.date) out.push(`${r.id} carries no approval in the approved table`)
        else if (!String(hit.parts?.[0] ?? hit.sentence ?? '').startsWith(r.startsWith)) out.push(`${r.id}'s approved words do not begin '${r.startsWith}'`)
    }
    return out
}
/** The ILLUSTRATIVE labels a said sentence owes: by each path it cites, and by each session value it shows. */
function ownIllustrative(s: SaidSentence, input: PrintInput): string[] {
    const byPath = s.from.map(input.illustrativeOf).filter((label): label is string => label !== null)
    const byShown = (input.illustrativeShown ?? []).filter((x) => shows(s.text, x.shows)).map((x) => x.label)
    return [...new Set([...byPath, ...byShown])]
}
/** The ILLUSTRATIVE labels a line stating other sentences owes: each stated sentence's, where the line shows a number that sentence shows. */
function inheritedIllustrative(lineText: string, states: SaidSentence[], input: PrintInput): string[] {
    const mine = new Set(numbersIn(lineText))
    return states.flatMap((s) => (numbersIn(s.text).some((n) => mine.has(n)) ? ownIllustrative(s, input) : []))
}

/**
 * The print: every line in the part it belongs to (a said sentence by its section, a printed sentence by its own part), ordered in each part
 * by where the first sentence it prints or states in that part was said (a printed sentence stating none follows, in its list's order); then
 * the text (a heading, then each part with its lines).
 */
export function fourPartPrint(input: PrintInput, map: Readonly<Record<string, Part>> = PART_OF_SECTION): FourPartPrint {
    const findings: string[] = []
    const indexOf = new Map<SaidSentence, number>(input.said.map((s, n) => [s, n]))
    const saidWithText = (text: string) => input.said.filter((s) => s.text === text)
    const statedBy = (who: string, texts: string[] | undefined): SaidSentence[] => {
        const out: SaidSentence[] = []
        for (const text of texts ?? []) {
            const hit = saidWithText(text)
            if (!hit.length) findings.push(`${who} stands for ${JSON.stringify(text)}, which no sentence said`)
            out.push(...hit)
        }
        return out
    }
    const keyed: Array<{ line: PrintedLine; key: number; order: number }> = []
    const keyOf = (part: Part, own: SaidSentence | null, states: SaidSentence[]) => {
        const all = [...(own ? [own] : []), ...states]
        const inPart = all.filter((s) => map[s.section] === part)
        const pool = inPart.length ? inPart : all
        return pool.length ? Math.min(...pool.map((s) => indexOf.get(s)!)) : Number.POSITIVE_INFINITY
    }
    // What each standing sentence states, read once (so a dangling text is one finding).
    const statesOfSaid = new Map<string, SaidSentence[]>((input.saidStandsFor ?? []).map((x) => [x.text, statedBy(`the said sentence ${JSON.stringify(x.text.slice(0, 40))}`, x.standsFor)]))
    const statesOfPrinted = new Map<string, SaidSentence[]>(input.printed.map((p) => [p.id, statedBy(p.id, p.standsFor)]))
    const stating = new Set<SaidSentence>([...statesOfSaid.values(), ...statesOfPrinted.values()].flat())
    let order = 0
    for (const s of input.said) {
        const part = map[s.section]
        const marker = MARKER_OF[s.wording]
        if (!part) {
            findings.push(`a sentence of the section ${JSON.stringify(s.section)} belongs to no part: ${s.text}`)
            continue
        }
        if (!marker) {
            findings.push(`a sentence carries no marker (${JSON.stringify(s.wording)}): ${s.text}`)
            continue
        }
        const own = statesOfSaid.get(s.text)
        // A sentence another line states is printed there, not here (printRefusals holds that it is stated exactly once).
        if (stating.has(s) && !own) continue
        const states = (own ?? []).filter((x) => x !== s)
        const grades = [...new Set([...(s.questions ?? []), ...states.flatMap((x) => x.questions ?? [])])].sort(byQuestion).map((q) => gradeWords(marker, q))
        const illustrative = [...new Set([...ownIllustrative(s, input), ...inheritedIllustrative(s.text, states, input)])]
        // A sentence said for one block only (its citations differ by block) says which, so a reader sees why it is said twice.
        const text = `${s.text}${input.stopSaid && !endsAsSentence(s.text) ? '.' : ''}${s.block ? ` (block ${s.block} only)` : ''}${illustrative.length ? ` [${illustrative.join('; ')}]` : ''}`
        // FIX (V3 check 4, FAIL A): an APPROVED sentence shows whose approved wording it is and when Christian's reply was received.
        keyed.push({ line: { part, marker, shownMarker: shownMarkerOf(marker, grades, marker === 'A' ? s.source : undefined), text, plain: s.text, illustrative, grades, of: { said: s }, states }, key: keyOf(part, s, states), order: order++ })
    }
    for (const p of input.printed) {
        const marker = markerOfLabel(p.label)
        const states = statesOfPrinted.get(p.id) ?? []
        const grades = [...new Set([...(p.restsOn ?? []), ...states.flatMap((x) => x.questions ?? [])])].sort(byQuestion).map((q) => gradeWords(marker, q))
        const illustrative = [...new Set([...(p.illustrative ? [p.illustrative] : []), ...inheritedIllustrative(p.sentence, states, input)])]
        const text = `${p.sentence}${illustrative.length ? ` [${illustrative.join('; ')}]` : ''}${p.note ? ` (${p.note})` : ''}`
        keyed.push({ line: { part: p.part, marker, shownMarker: shownMarkerOf(marker, grades, p.markerWords), text, plain: p.sentence, illustrative, grades, of: { printed: p.id }, states }, key: keyOf(p.part, null, states), order: order++ })
    }
    const lines = keyed.sort((a, b) => a.key - b.key || a.order - b.order).map((x) => x.line)
    const out: string[] = [...input.heading]
    for (const part of PARTS) {
        out.push('', part.toUpperCase())
        const inPart = lines.filter((l) => l.part === part)
        if (!inPart.length) out.push('  (nothing)')
        for (const l of inPart) out.push(`  ${l.shownMarker} ${l.text}`)
    }
    if (findings.length) out.push('', 'FINDINGS (printed, never dropped)', ...findings.map((f) => `  - ${f}`))
    return { lines, findings, text: out.join('\n'), printed: input.printed }
}

/** Where each said sentence is printed: by itself, or stated by a line (its printed id, or the said sentence's first words). */
const printedWhere = (print: FourPartPrint, s: SaidSentence): PrintedLine[] => print.lines.filter((l) => ('said' in l.of && l.of.said === s) || l.states.includes(s))
const nameOf = (l: PrintedLine) => ('printed' in l.of ? l.of.printed : `the said sentence '${l.plain.slice(0, 40)}...'`)

/**
 * The engine's own sentences, in the order said, each with its marker and grade, its ILLUSTRATIVE labels, and where the coach text prints it
 * (stage A2): what the engine says, beside the coach text that states it.
 */
export function engineLines(print: FourPartPrint, said: SaidSentence[], input: Pick<PrintInput, 'illustrativeOf' | 'illustrativeShown'>): string[] {
    return said.map((s, n) => {
        const marker = MARKER_OF[s.wording] ?? '?'
        const grades = [...new Set(s.questions ?? [])].sort(byQuestion).map((q) => gradeWords(marker as Marker, q))
        const illustrative = ownIllustrative(s, { heading: [], said, printed: [], ...input })
        const where = printedWhere(print, s)
        const at = where.length !== 1 ? `PRINTED ${where.length} TIMES` : 'said' in where[0].of && where[0].of.said === s ? 'printed as said' : `stated by ${nameOf(where[0])}`
        return `${n + 1}. ${shownMarkerOf(marker as Marker, grades, marker === 'A' ? s.source : undefined)} ${s.text}${s.block ? ` (block ${s.block} only)` : ''}${illustrative.length ? ` [${illustrative.join('; ')}]` : ''} -> ${at}`
    })
}

/**
 * The reasons the print does not hold: a said sentence printed other than exactly once (as itself or stated by exactly one line); a line that
 * does not show a grade or an ILLUSTRATIVE label it owes; a `standsFor` naming no said sentence (the print's findings, refused here too).
 * FIX (13 November 2026, from the V3 verification, check 4, FAIL B): each line's whole marker recomputed from whose words it is (a said
 * sentence's wording, a printed sentence's label as given to the print), its marker words and its grades, and any difference refused; an
 * APPROVED line whose marker names no source with the date Christian's reply was received is refused.
 */
export function printRefusals(print: FourPartPrint, said: SaidSentence[], illustrativeOf: (path: string) => string | null): string[] {
    const reasons: string[] = []
    for (const s of said) {
        const where = printedWhere(print, s)
        if (where.length !== 1) reasons.push(`"${s.text}" is printed ${where.length} times, not once`)
    }
    const printedById = new Map((print.printed ?? []).map((p) => [p.id, p]))
    for (const l of print.lines) {
        // The marker, recomputed (never read from the line's own marker, grades or text).
        const given = 'printed' in l.of ? printedById.get(l.of.printed) : undefined
        if ('printed' in l.of && !given) reasons.push(`"${l.plain}" is printed as ${l.of.printed}, a sentence the print was not given`)
        const letter: Marker | undefined = 'said' in l.of ? MARKER_OF[l.of.said.wording] : given ? markerOfLabel(given.label) : undefined
        if (letter) {
            const words = 'said' in l.of ? (letter === 'A' ? l.of.said.source : undefined) : given?.markerWords
            if (letter === 'A' && !namesReceived(words)) reasons.push(`"${l.plain}" is APPROVED and its marker names no source with the date Christian's reply was received`)
            const owed = [...new Set([...('said' in l.of ? l.of.said.questions ?? [] : given?.restsOn ?? []), ...l.states.flatMap((s) => s.questions ?? [])])].sort(byQuestion).map((q) => gradeWords(letter, q))
            const expected = shownMarkerOf(letter, owed, words)
            if (l.shownMarker !== expected) reasons.push(`"${l.plain}" shows the marker ${l.shownMarker}, where whose words it is and its grades give ${expected}`)
        }
        // What the line owes, recomputed from what it prints and states (never read from the line's own lists alone).
        const own = 'said' in l.of ? [l.of.said] : []
        const owedIllustrative = [...new Set([...own.flatMap((s) => s.from.map(illustrativeOf).filter((label): label is string => label !== null)), ...(given?.illustrative ? [given.illustrative] : []), ...l.illustrative])]
        for (const label of owedIllustrative) if (!l.text.includes(label)) reasons.push(`"${l.plain}" shows an ILLUSTRATIVE quantity without its label (${label})`)
        const owedQuestions = [...new Set([...own.flatMap((s) => s.questions ?? []), ...l.states.flatMap((s) => s.questions ?? [])])]
        for (const q of owedQuestions) if (!l.shownMarker.includes(` ${q}`)) reasons.push(`"${l.plain}" does not show its grade ${gradeWords(l.marker, q)}`)
        for (const g of l.grades) if (!l.shownMarker.includes(g)) reasons.push(`"${l.plain}" does not show its grade ${g}`)
    }
    for (const f of print.findings) if (f.includes('which no sentence said')) reasons.push(f)
    return reasons
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Run alone (registered): the print's own checks, each with its bite
// ---------------------------------------------------------------------------------------------------------------------------------------

if (require.main === module) {
    const said: SaidSentence[] = [
        { section: 'Set up', block: null, text: 'Mark out an area 40 m long by 30 m wide', from: ['envelope.area.length_m', 'envelope.area.width_m'], wording: 'DRAFT' },
        { section: 'Role exchange', block: null, text: 'Play in blocks', from: ['activityRoles[x].activityRole'], wording: 'DRAFT', questions: ['Q1'] },
        { section: 'How to score', block: null, text: 'A point counts only if ...', from: ['value.primaryEvent.conditions[c].type'], wording: 'CANDIDATE', questions: ['Q1'] },
    ]
    const illustrativeOf = (p: string) => (p.startsWith('envelope.') ? 'ILLUSTRATIVE: session value' : null)
    const print = fourPartPrint({ heading: ['TEST'], said, printed: [{ id: 'L', part: 'Learning explanation', label: 'CANDIDATE', sentence: 'Why.', restsOn: ['Q2'] }], illustrativeOf })
    assert.deepEqual(printRefusals(print, said, illustrativeOf), [], 'every sentence once, every ILLUSTRATIVE quantity labelled, every grade shown')
    assert.deepEqual(print.lines.map((l) => [l.part, l.shownMarker]), [['Setup', '[D]'], ['Rules', '[D | PROPOSED Q1]'], ['Scoring', '[C | contingent on Q1]'], ['Learning explanation', '[C | contingent on Q2]']])
    assert.ok(print.text.includes('[D] Mark out an area 40 m long by 30 m wide [ILLUSTRATIVE: session value]'))
    // Bite 1: a dropped section mapping: the sentence is printed nowhere, named as a finding, and the check refuses.
    const dropped = { ...PART_OF_SECTION } as Record<string, Part>
    delete dropped['Role exchange']
    const withoutMap = fourPartPrint({ heading: ['TEST'], said, printed: [], illustrativeOf }, dropped)
    assert.ok(printRefusals(withoutMap, said, illustrativeOf).some((r) => r.startsWith('"Play in blocks" is printed 0 times')), 'bite: a dropped section mapping is caught')
    assert.ok(withoutMap.findings.some((f) => f.includes('"Role exchange" belongs to no part')))
    // Bite 2: a label stripped from a printed quantity is caught.
    const stripped: FourPartPrint = { ...print, lines: print.lines.map((l) => ({ ...l, text: l.text.replace(' [ILLUSTRATIVE: session value]', '') })) }
    assert.ok(printRefusals(stripped, said, illustrativeOf).some((r) => r.includes('without its label')), 'bite: a stripped ILLUSTRATIVE label is caught')
    // Bite 3 (stage A2): a grade stripped from a marker is caught, on a said line and on a printed line.
    const ungraded: FourPartPrint = { ...print, lines: print.lines.map((l) => ({ ...l, shownMarker: l.shownMarker.split(' | PROPOSED Q1').join('') })) }
    assert.ok(printRefusals(ungraded, said, illustrativeOf).some((r) => r.includes('does not show its grade PROPOSED Q1')), 'bite: a stripped PROPOSED grade is caught')
    const ungradedPrinted: FourPartPrint = { ...print, lines: print.lines.map((l) => ({ ...l, shownMarker: l.shownMarker.split(' | contingent on Q2').join('') })) }
    assert.ok(printRefusals(ungradedPrinted, said, illustrativeOf).some((r) => r.includes('does not show its grade contingent on Q2')), 'bite: a stripped contingent grade on a printed line is caught')
    // Stage A2: a session value shown without its path cited (the end line's '30 m long') carries the session label.
    const shownSaid: SaidSentence[] = [{ section: 'Set up', block: null, text: 'Mark a line across one end, 30 m long', from: ['space.regions[r].noun'], wording: 'DRAFT', questions: ['Q2'] }]
    const shownInput = { heading: [], said: shownSaid, printed: [], illustrativeOf, illustrativeShown: [{ shows: '30 m', label: 'ILLUSTRATIVE: session value' }] }
    const shownPrint = fourPartPrint(shownInput)
    assert.ok(shownPrint.text.includes('[D | PROPOSED Q2] Mark a line across one end, 30 m long [ILLUSTRATIVE: session value]'), shownPrint.text)
    const shownStripped: FourPartPrint = { ...shownPrint, lines: shownPrint.lines.map((l) => ({ ...l, text: l.text.replace(' [ILLUSTRATIVE: session value]', '') })) }
    assert.ok(printRefusals(shownStripped, shownSaid, illustrativeOf).some((r) => r.includes('without its label')), 'bite: the session label stripped from a shown value is caught')
    // Stage A2: a printed sentence stating two said sentences is printed where the first of them was said, takes their grades and the label of
    // the number it shows; each is printed once; the engine's list names where each is printed.
    const coachSaid: SaidSentence[] = [
        { section: 'Set up', block: null, text: 'Mark out an area 40 m long by 30 m wide', from: ['envelope.area.length_m'], wording: 'DRAFT' },
        { section: 'Set up', block: null, text: 'Mark a line 12 m from the end', from: ['line.along'], wording: 'DRAFT', questions: ['Q1'] },
        { section: 'Restarts and ball out', block: null, text: 'Restart with the escaping team', from: ['t.awardedTo'], wording: 'DRAFT', questions: ['Q6'] },
        { section: 'How it works', block: null, text: 'There is no offside', from: ['defaultLaws.laws[LAW-11]'], wording: 'DRAFT', questions: ['Q3'] },
    ]
    const lineOf = (p: string) => (p === 'line.along' ? 'ILLUSTRATIVE: the schematic 12 m' : illustrativeOf(p))
    const coachPrinted: PrintedOnly[] = [
        { id: 'S3', part: 'Setup', label: 'PROPOSED', sentence: 'Mark a line where the press can just cover the width (about 12 m here).', standsFor: ['Mark a line 12 m from the end'] },
        { id: 'R1', part: 'Rules', label: 'PROPOSED', sentence: 'Start and restart with the escaping team.', standsFor: ['Restart with the escaping team'] },
    ]
    const coach = fourPartPrint({ heading: [], said: coachSaid, printed: coachPrinted, illustrativeOf: lineOf })
    assert.deepEqual(printRefusals(coach, coachSaid, lineOf), [])
    assert.deepEqual(coach.lines.map((l) => [l.part, l.shownMarker, l.plain.slice(0, 20)]), [
        ['Setup', '[D]', 'Mark out an area 40 '],
        ['Setup', '[P | PROPOSED Q1]', 'Mark a line where th'],
        ['Rules', '[P | PROPOSED Q6]', 'Start and restart wi'],
        ['Rules', '[D | PROPOSED Q3]', 'There is no offside'],
    ])
    assert.ok(coach.text.includes('(about 12 m here). [ILLUSTRATIVE: the schematic 12 m]'), 'the stated sentence\'s ILLUSTRATIVE label goes with the number the line shows')
    assert.deepEqual(engineLines(coach, coachSaid, { illustrativeOf: lineOf }).map((l) => l.slice(l.indexOf('->'))), ['-> printed as said', '-> stated by S3', '-> stated by R1', '-> printed as said'])
    // Bite 4: a sentence stated by two lines is caught; bite 5: a standsFor naming no said sentence is caught; bite 6: a stated sentence's
    // grade dropped from the stating line is caught.
    const twice = fourPartPrint({ heading: [], said: coachSaid, printed: [...coachPrinted, { id: 'X', part: 'Rules', label: 'PROPOSED', sentence: 'Again.', standsFor: ['Restart with the escaping team'] }], illustrativeOf: lineOf })
    assert.ok(printRefusals(twice, coachSaid, lineOf).some((r) => r.startsWith('"Restart with the escaping team" is printed 2 times')), 'bite: stated twice is caught')
    const dangling = fourPartPrint({ heading: [], said: coachSaid, printed: [{ ...coachPrinted[0], standsFor: ['Mark a line 13 m from the end'] }, coachPrinted[1]], illustrativeOf: lineOf })
    const danglingReasons = printRefusals(dangling, coachSaid, lineOf)
    assert.ok(danglingReasons.some((r) => r.includes('which no sentence said')), 'bite: a dangling standsFor is caught')
    assert.ok(dangling.lines.some((l) => l.plain === 'Mark a line 12 m from the end' && 'said' in l.of), 'the sentence it missed is printed as said, never dropped')
    const lost: FourPartPrint = { ...coach, lines: coach.lines.map((l) => ({ ...l, shownMarker: l.shownMarker.split(' | PROPOSED Q6').join('') })) }
    assert.ok(printRefusals(lost, coachSaid, lineOf).some((r) => r.includes('does not show its grade PROPOSED Q6')), 'bite: a stated sentence\'s grade lost on the stating line is caught')
    // FIX (13 November 2026, from the V3 verification, check 4): the whole marker is recomputed from whose words a line is, its marker words and
    // its grades; an APPROVED line names its source with the date Christian's reply was received. Bites: [C] stripped, [D] made [A], [P] made
    // [C], a printed APPROVED line's source cut to the letter, a said APPROVED line's source stripped, an APPROVED sentence given no source, a
    // printed sentence's own ILLUSTRATIVE label stripped; and a source row the approved table does not hold.
    assert.deepEqual(approvedSourceRefusals(), [], 'every source row is approved wording in the approved table')
    assert.ok(approvedSourceRefusals([{ id: 'NO_SUCH_TEMPLATE', startsWith: 'When', received: '1 January 2026' }]).some((r) => r.includes('NO_SUCH_TEMPLATE is not in the approved table')), 'bite: a source row the table does not hold is caught')
    const possession = 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same target'
    assert.equal(approvedSourceOf('An approved sentence no row names'), undefined)
    const markedSaid: SaidSentence[] = [{ section: 'How it works', block: null, text: possession, from: ['transitions[t].playState'], wording: 'APPROVED', questions: ['Q6'], source: approvedSourceOf(possession) }, ...coachSaid]
    const markedPrinted: PrintedOnly[] = [
        { ...coachPrinted[0], standsFor: undefined, illustrative: 'ILLUSTRATIVE: the schematic 12 m' },
        coachPrinted[1],
        { id: 'L1', part: 'Learning explanation', label: 'APPROVED', sentence: 'Continue.', markerWords: 'the source Christian chose, received 21 October 2026' },
    ]
    const marked = fourPartPrint({ heading: [], said: markedSaid, printed: markedPrinted, illustrativeOf: lineOf })
    assert.deepEqual(printRefusals(marked, markedSaid, lineOf), [])
    assert.ok(marked.text.includes(`[A: Christian's approved wording POSSESSION_CONTINUES, received 25 October 2026 | contingent on Q6] ${possession}`), marked.text)
    assert.ok(marked.text.includes('[A: the source Christian chose, received 21 October 2026] Continue.'), marked.text)
    assert.ok(marked.text.includes('(about 12 m here). [ILLUSTRATIVE: the schematic 12 m]'), "a printed sentence's own ILLUSTRATIVE label is printed where it states nothing")
    const remarked = (p: FourPartPrint, start: string, from: string, to: string): FourPartPrint => ({ ...p, lines: p.lines.map((l) => (l.plain.startsWith(start) ? { ...l, shownMarker: l.shownMarker.split(from).join(to) } : l)) })
    const markerCaught = (p: FourPartPrint, s: SaidSentence[], what: string) => assert.ok(printRefusals(p, s, lineOf).some((r) => r.includes('shows the marker')), `bite: ${what} is caught`)
    markerCaught(remarked(print, 'A point counts only if', '[C', '['), said, '[C] stripped')
    markerCaught(remarked(marked, 'There is no offside', '[D', '[A'), markedSaid, '[D] made [A]')
    markerCaught(remarked(marked, 'Start and restart', '[P', '[C'), markedSaid, '[P] made [C]')
    markerCaught(remarked(marked, 'Continue.', ': the source Christian chose, received 21 October 2026', ''), markedSaid, "L1's source cut to [A]")
    markerCaught(remarked(marked, 'When possession changes', ": Christian's approved wording POSSESSION_CONTINUES, received 25 October 2026", ''), markedSaid, "the approved line's source stripped")
    const unsourcedSaid = markedSaid.map((s) => (s.wording === 'APPROVED' ? { ...s, source: undefined } : s))
    assert.ok(printRefusals(fourPartPrint({ heading: [], said: unsourcedSaid, printed: markedPrinted, illustrativeOf: lineOf }), unsourcedSaid, lineOf).some((r) => r.includes('is APPROVED and its marker names no source')), 'bite: an APPROVED sentence given no source is refused')
    const unsourcedPrinted = markedPrinted.map((p) => (p.id === 'L1' ? { ...p, markerWords: undefined } : p))
    assert.ok(printRefusals(fourPartPrint({ heading: [], said: markedSaid, printed: unsourcedPrinted, illustrativeOf: lineOf }), markedSaid, lineOf).some((r) => r.includes('"Continue." is APPROVED and its marker names no source')), 'bite: a printed APPROVED sentence given no source is refused')
    const ownLabelStripped: FourPartPrint = { ...marked, lines: marked.lines.map((l) => ({ ...l, text: l.text.split(' [ILLUSTRATIVE: the schematic 12 m]').join(''), illustrative: [] })) }
    assert.ok(printRefusals(ownLabelStripped, markedSaid, lineOf).some((r) => r.startsWith('"Mark a line where the press') && r.includes('without its label (ILLUSTRATIVE: the schematic 12 m)')), "bite: a printed sentence's own ILLUSTRATIVE label stripped is caught")
    // FIX (V2 F14): stopSaid prints a said sentence's missing full stop on the line's text only; off, nothing changes; a sentence ending with a
    // stop gets no second one; the check still holds.
    const stopped = fourPartPrint({ heading: [], said: markedSaid, printed: markedPrinted, illustrativeOf: lineOf, stopSaid: true })
    assert.deepEqual(printRefusals(stopped, markedSaid, lineOf), [])
    const possessionLine = (p: FourPartPrint) => p.lines.find((l) => l.plain === possession)!
    assert.deepEqual([possessionLine(stopped).text, possessionLine(stopped).plain, possessionLine(marked).text], [`${possession}.`, possession, possession])
    assert.ok(stopped.text.includes('(about 12 m here). [ILLUSTRATIVE') && !stopped.text.includes('..'), 'a printed sentence is never given a second stop')
    // 'Adjusting the activity' is no part: printed as a finding, never dropped.
    const adjusting = fourPartPrint({ heading: [], said: [{ section: 'Adjusting the activity', block: null, text: 'Make it bigger', from: [], wording: 'DRAFT' }], printed: [], illustrativeOf })
    assert.ok(adjusting.findings.some((f) => f.includes('Adjusting the activity')))
    const registry = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/four-part-print.unit.ts'), 'registered')
    console.log('four-part print: every sentence once (as said or stated by one line), every grade and ILLUSTRATIVE quantity labelled; a dropped mapping, a stripped label or grade, a sentence stated twice and a dangling standsFor are caught; every marker recomputed and an APPROVED line\'s source required (a changed letter, a stripped source, an own label stripped are caught); registered')
}
