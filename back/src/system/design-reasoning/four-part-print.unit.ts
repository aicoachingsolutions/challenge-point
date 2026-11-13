/**
 * **The review print of an activity in Christian's four parts, every sentence marked** (TEST-ONLY; stage B2 of the A02 complete-activity
 * package, 12 November 2026). Christian, received 12 November 2026, item 5: "Setup: What the coach needs to arrange." "Rules: What players need to
 * know to play." "Scoring: What earns a point and when." "Learning explanation: A short, meaningful connection between the game conditions and
 * the intended learning problem."
 *
 * A print only: it groups the sentences the chain said (served, or the administrator's draft of a refusal) by OUR DRAFT map of today's
 * sections to the four parts (`PART_OF_SECTION`), never renaming a served section (sections.ts and A01's page do not change: renaming them
 * would be a live coach-facing change, Christian's). Each sentence carries its marker: [A] APPROVED (Christian's approved wording), [C]
 * CANDIDATE (our wording of approved knowledge, for review), [D] DRAFT (the renderer's own template words), [P] PROPOSED (new knowledge of
 * ours, a printed-only sentence); and every quantity whose support is ILLUSTRATIVE carries its label inline, where the sentence shows it.
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
}
/** A sentence the engine never says, printed in its part with its label (our CANDIDATE wording file's `printerOnly`, or the purpose). */
export interface PrintedOnly {
    id: string
    part: Part
    label: 'APPROVED' | 'PROPOSED' | 'CANDIDATE'
    sentence: string
    note?: string
}
export interface PrintedLine {
    part: Part
    marker: Marker
    text: string
    /** The ILLUSTRATIVE labels the line carries inline, one per ILLUSTRATIVE quantity it shows. */
    illustrative: string[]
    /** The chain's sentence it prints, or the printed-only sentence's id. */
    of: { said: SaidSentence } | { printed: string }
}
export interface FourPartPrint {
    lines: PrintedLine[]
    findings: string[]
    text: string
}

/**
 * The print: every said sentence in the part its section maps to, in the order said, then each printed-only sentence in its part, then the
 * text (a heading, then each part with its lines). `illustrativeOf` names the ILLUSTRATIVE label of a cited path, or null.
 */
export function fourPartPrint(input: { heading: string[]; said: SaidSentence[]; printed: PrintedOnly[]; illustrativeOf: (path: string) => string | null }, map: Readonly<Record<string, Part>> = PART_OF_SECTION): FourPartPrint {
    const lines: PrintedLine[] = []
    const findings: string[] = []
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
        const illustrative = [...new Set(s.from.map(input.illustrativeOf).filter((label): label is string => label !== null))]
        // A sentence said for one block only (its citations differ by block) says which, so a reader sees why it is said twice.
        const shown = `${s.text}${s.block ? ` {block ${s.block}}` : ''}${illustrative.length ? ` [${illustrative.join('; ')}]` : ''}`
        lines.push({ part, marker, text: shown, illustrative, of: { said: s } })
    }
    for (const p of input.printed) lines.push({ part: p.part, marker: p.label === 'APPROVED' ? 'A' : p.label === 'PROPOSED' ? 'P' : 'C', text: `${p.sentence}${p.note ? ` (${p.note})` : ''}`, illustrative: [], of: { printed: p.id } })
    const out: string[] = [...input.heading]
    for (const part of PARTS) {
        out.push('', part.toUpperCase())
        const inPart = lines.filter((l) => l.part === part)
        if (!inPart.length) out.push('  (nothing)')
        for (const l of inPart) out.push(`  [${l.marker}] ${l.text}`)
    }
    if (findings.length) out.push('', 'FINDINGS (printed, never dropped)', ...findings.map((f) => `  - ${f}`))
    return { lines, findings, text: out.join('\n') }
}

/** Every said sentence printed in exactly one part, and every ILLUSTRATIVE quantity it cites labelled where it shows: the reasons it does not hold. */
export function printRefusals(print: FourPartPrint, said: SaidSentence[], illustrativeOf: (path: string) => string | null): string[] {
    const reasons: string[] = []
    for (const s of said) {
        const printed = print.lines.filter((l) => 'said' in l.of && l.of.said === s)
        if (printed.length !== 1) reasons.push(`"${s.text}" is printed ${printed.length} times, not once`)
        const labels = [...new Set(s.from.map(illustrativeOf).filter((label): label is string => label !== null))]
        for (const l of printed) for (const label of labels) if (!l.text.includes(label)) reasons.push(`"${s.text}" shows an ILLUSTRATIVE quantity without its label (${label})`)
    }
    return reasons
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Run alone (registered): the print's own checks, each with its bite
// ---------------------------------------------------------------------------------------------------------------------------------------

if (require.main === module) {
    const said: SaidSentence[] = [
        { section: 'Set up', block: null, text: 'Mark out an area 40 m long by 30 m wide', from: ['envelope.area.length_m', 'envelope.area.width_m'], wording: 'DRAFT' },
        { section: 'Role exchange', block: null, text: 'Play in blocks', from: ['activityRoles[x].activityRole'], wording: 'DRAFT' },
        { section: 'How to score', block: null, text: 'A point counts only if ...', from: ['value.primaryEvent.conditions[c].type'], wording: 'CANDIDATE' },
    ]
    const illustrativeOf = (p: string) => (p.startsWith('envelope.') ? 'ILLUSTRATIVE: session value' : null)
    const print = fourPartPrint({ heading: ['TEST'], said, printed: [{ id: 'L', part: 'Learning explanation', label: 'CANDIDATE', sentence: 'Why.' }], illustrativeOf })
    assert.deepEqual(printRefusals(print, said, illustrativeOf), [], 'every sentence once, every ILLUSTRATIVE quantity labelled')
    assert.deepEqual(print.lines.map((l) => [l.part, l.marker]), [['Setup', 'D'], ['Rules', 'D'], ['Scoring', 'C'], ['Learning explanation', 'C']])
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
    // 'Adjusting the activity' is no part: printed as a finding, never dropped.
    const adjusting = fourPartPrint({ heading: [], said: [{ section: 'Adjusting the activity', block: null, text: 'Make it bigger', from: [], wording: 'DRAFT' }], printed: [], illustrativeOf })
    assert.ok(adjusting.findings.some((f) => f.includes('Adjusting the activity')))
    const registry = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/four-part-print.unit.ts'), 'registered')
    console.log('four-part print: every sentence once, every ILLUSTRATIVE quantity labelled; a dropped mapping and a stripped label are caught; registered')
}
