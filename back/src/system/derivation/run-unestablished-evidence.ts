/**
 * The unestablished lines, with the evidence needed to rule on them — **before** anything is authored.
 *
 * The question this exists to answer is his, and it is not "how do we fill these in":
 *
 *   > *What is the minimum authoritative knowledge a resolved game actually needs before realization
 *   > can faithfully make it concrete?*
 *
 * So this prints evidence, never a repair. For each line: the knowledge object and contribution that
 * established the element, the register row, the declaration that produced the failure, **the
 * authored source language on both sides**, and what the declaring object said it could not author.
 *
 * It computes no classification of its own. The categories are a judgement about authored knowledge
 * and they are made in the audit note, against this output, by a person — a script that sorted these
 * into "should be authored" and "should not block" would be making exactly the ruling he asked to
 * make himself.
 *
 * What it *does* compute is the recurrence: the same row failing under the same declaration across
 * many objects is one unresolved rule wearing many hats, and that is the shape he asked about.
 *
 * Run: npm run corpus:unestablished  ·  npm run corpus:unestablished -- --json
 */
import fs from 'node:fs'
import path from 'node:path'

import { corpusInput } from './corpus'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { ContractItem, Declaration, LoadedContract } from './types'

const DOCS = path.resolve(__dirname, '../../../../docs/audits/conformance')

/** The restatement sheets, read for the human wording no structured field carries. */
function originalPlacements(): Map<string, any> {
    const raw = JSON.parse(fs.readFileSync(path.join(DOCS, 'stage-b/contracts.json'), 'utf8').replace(/^﻿/, ''))
    const byItem = new Map<string, any>()
    for (const sheet of raw as any[]) {
        for (const placement of sheet.result?.originalPlacement ?? []) {
            if (placement?.itemId) byItem.set(String(placement.itemId), placement)
        }
    }
    return byItem
}

interface Evidence {
    lineId: string
    path: string
    row: string
    /** The object whose contribution individuated the element this line sits on. */
    object: string | null
    contribution: string | null
    /** What that contribution actually says, in the authored words. */
    establishedBy: string | null
    verdict: string
    reason: string | null
    /** Every declaration reaching the row, so a silence is never mistaken for a statement. */
    declared: string[]
    /** The objects that declared NOT_AUTHORED on this row, and what each said it could not author. */
    notAuthoredBy: { object: string; note: string }[]
    /** The objects that declared they do not constrain the row, and why. */
    nonClaimedBy: { object: string; note: string }[]
    excludedBy: { object: string; note: string }[]
    /** Objects that DO claim this row — a value another selected object could legitimately supply. */
    claimedBy: { object: string; note: string }[]
}

const input = corpusInput()
const result = runDerivation(input)
if (isStampedHalt(result)) {
    console.error('the run halted; there is nothing to report')
    process.exit(1)
}
const staged: any = runStages0to10(input)
const index = indexRegister(input.register)
const game = assembleResolvedGame(result, staged.classes, index)

const contracts: LoadedContract[] = input.contracts
const placements = originalPlacements()
const classById = new Map<string, any>(staged.classes.map((c: any) => [c.classId, c]))
const itemById = new Map<string, { contract: LoadedContract; item: ContractItem }>()
for (const contract of contracts) for (const item of contract.items ?? []) itemById.set(`${contract.contractId}::${item.itemId}`, { contract, item })

/** What an item actually says, preferring the authored quote over the structured restatement. */
function authoredWords(contractId: string, itemId: string): string | null {
    const found = itemById.get(`${contractId}::${itemId}`)
    if (!found) return null
    const evidence: any = found.item.basisEvidence
    const quote = evidence && typeof evidence === 'object' ? evidence.quote : null
    const placement = placements.get(itemId)
    const original = placement?.originalText ?? placement?.text ?? placement?.sourceText ?? null
    const restated = `${found.item.requirement} ${found.item.selector ?? ''} ${found.item.value === undefined ? '' : JSON.stringify(found.item.value)}`.trim()
    return [quote ? `"${quote}"` : null, original && original !== quote ? `original: "${original}"` : null, `as restated: ${restated}`].filter(Boolean).join('  ·  ')
}

function declarationsOn(row: string, kind: string): { object: string; note: string }[] {
    const out: { object: string; note: string }[] = []
    for (const contract of contracts) {
        for (const declaration of (contract.declarations ?? []) as Declaration[]) {
            if (String(declaration.row) !== row || String(declaration.declaration) !== kind) continue
            out.push({ object: contract.contractId, note: String(declaration.note ?? '').trim() })
        }
    }
    return out
}

const evidence: Evidence[] = game.notEstablished
    .filter(entry => entry.declared.includes('NOT_AUTHORED'))
    .map(entry => {
        const row = entry.lineId.split('::').pop()!
        const cls = entry.elementId ? classById.get(entry.elementId) : null
        const object = cls?.fromItem?.contractId ?? null
        const contribution = cls?.fromItem?.itemId ?? null
        return {
            lineId: entry.lineId,
            path: entry.path,
            row,
            object,
            contribution,
            establishedBy: object && contribution ? authoredWords(object, contribution) : null,
            verdict: entry.verdict,
            reason: entry.reason,
            declared: entry.declared,
            notAuthoredBy: declarationsOn(row, 'NOT_AUTHORED'),
            nonClaimedBy: declarationsOn(row, 'NON_CLAIMED'),
            excludedBy: declarationsOn(row, 'EXCLUDED'),
            claimedBy: declarationsOn(row, 'CLAIMED'),
        }
    })

if (process.argv.includes('--json')) {
    console.log(JSON.stringify(evidence, null, 1))
    process.exit(0)
}

const wrap = (text: string, indent: string, width = 96): string =>
    text
        .split(/\s+/)
        .reduce((lines: string[], word) => {
            const last = lines[lines.length - 1]
            if (last !== undefined && `${last} ${word}`.length <= width) lines[lines.length - 1] = `${last} ${word}`
            else lines.push(word)
            return lines
        }, [])
        .map(l => `${indent}${l}`)
        .join('\n')

console.log('UNESTABLISHED LINES WHERE AN OBJECT DECLARES IT NEEDS THE ROW AND CANNOT AUTHOR IT')
console.log('='.repeat(100))
console.log(`${evidence.length} line(s), of ${game.counts.notEstablished} unestablished in total.`)
console.log('Grouped by the knowledge object whose contribution established the element, then by row.')
console.log('No classification is made here: this is the evidence, not the ruling.')

// ---------------------------------------------------------------------------------------------
// The recurrence question first, because it is the one that decides whether to author anything.
// ---------------------------------------------------------------------------------------------
console.log('\n\nRECURRENCE — does this collapse into a few rules, or is it 43 independent gaps?')
console.log('='.repeat(100))

const byRow = new Map<string, Evidence[]>()
for (const e of evidence) {
    if (!byRow.has(e.row)) byRow.set(e.row, [])
    byRow.get(e.row)!.push(e)
}
console.log(`\n${byRow.size} distinct register rows carry the ${evidence.length} lines.\n`)
console.log(`  ${'row'.padEnd(6)} ${'lines'.padEnd(6)} ${'objects affected'.padEnd(34)} property`)
console.log(`  ${'-'.repeat(6)} ${'-'.repeat(6)} ${'-'.repeat(34)} ${'-'.repeat(40)}`)
for (const [row, lines] of [...byRow.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) {
    const objects = [...new Set(lines.map(l => l.object ?? 'game-level'))].sort()
    const rowPath = (index.rows.get(row) as any)?.path ?? ''
    console.log(`  ${row.padEnd(6)} ${String(lines.length).padEnd(6)} ${String(objects.length).padEnd(34)} ${rowPath}`)
}

// The same NOT_AUTHORED note repeated across rows is one unresolved rule, not several.
console.log('\n\nTHE DECLARED REASONS THEMSELVES, DEDUPLICATED')
console.log('-'.repeat(100))
const byNote = new Map<string, { rows: Set<string>; lines: number; object: string }>()
for (const e of evidence) {
    for (const d of e.notAuthoredBy) {
        const key = `${d.object} :: ${d.note}`
        if (!byNote.has(key)) byNote.set(key, { rows: new Set(), lines: 0, object: d.object })
        const b = byNote.get(key)!
        b.rows.add(e.row)
        b.lines++
    }
}
console.log(`${byNote.size} distinct "cannot author" statements across the ${evidence.length} lines.\n`)
for (const [key, b] of [...byNote.entries()].sort((a, b) => b[1].rows.size - a[1].rows.size)) {
    const [object, note] = key.split(' :: ')
    console.log(`  ${object}  —  rows ${[...b.rows].sort().join(', ')}`)
    console.log(wrap(note, '        '))
    console.log('')
}

// ---------------------------------------------------------------------------------------------
// The lines themselves.
// ---------------------------------------------------------------------------------------------
console.log('\nTHE LINES, GROUPED BY KNOWLEDGE OBJECT THEN ROW')
console.log('='.repeat(100))

const byObject = new Map<string, Evidence[]>()
for (const e of evidence) {
    const key = e.object ?? '(game-level — no element)'
    if (!byObject.has(key)) byObject.set(key, [])
    byObject.get(key)!.push(e)
}

for (const [object, lines] of [...byObject.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) {
    console.log(`\n\n${'#'.repeat(100)}`)
    console.log(`## ${object}   —   ${lines.length} line(s)`)
    console.log('#'.repeat(100))

    const rows = new Map<string, Evidence[]>()
    for (const e of lines) {
        if (!rows.has(e.row)) rows.set(e.row, [])
        rows.get(e.row)!.push(e)
    }

    for (const [row, group] of [...rows.entries()].sort()) {
        const registerRow: any = index.rows.get(row)
        console.log(`\n  ROW ${row}  —  ${registerRow?.path ?? '(not in register)'}`)
        console.log(`  ${'-'.repeat(96)}`)
        console.log(`    valueType     ${registerRow?.valueType ?? '-'}`)
        console.log(`    kind          ${registerRow?.kind ?? '-'}${registerRow?.ownerRow ? `   owner ${registerRow.ownerRow}` : ''}`)
        console.log(`    lines here    ${group.length}: ${group.map(g => g.path).join(', ')}`)
        console.log(`    declared      ${group[0].declared.join(', ')}`)
        console.log(`    reported as   ${group[0].reason ?? group[0].verdict}`)

        const first = group[0]
        if (first.establishedBy) {
            console.log(`\n    the contribution that established the element (${first.contribution}):`)
            console.log(wrap(first.establishedBy, '        '))
        }
        if (first.notAuthoredBy.length) {
            console.log(`\n    WHY IT IS NEEDED AND CANNOT BE AUTHORED — the declaring object's own words:`)
            for (const d of first.notAuthoredBy) {
                console.log(`        [${d.object}]`)
                console.log(wrap(d.note || '(no note)', '          '))
            }
        }
        if (first.claimedBy.length) {
            console.log(`\n    ANOTHER SELECTED OBJECT CLAIMS THIS ROW — a value may already be available here:`)
            for (const d of first.claimedBy) {
                console.log(`        [${d.object}]`)
                console.log(wrap(d.note || '(no note)', '          '))
            }
        }
        if (first.nonClaimedBy.length) {
            console.log(`\n    objects that looked and declared they do not constrain it:`)
            for (const d of first.nonClaimedBy) {
                console.log(`        [${d.object}] ${d.note ? '' : '(no note)'}`)
                if (d.note) console.log(wrap(d.note, '          '))
            }
        }
        if (first.excludedBy.length) {
            console.log(`\n    objects that EXCLUDE it:`)
            for (const d of first.excludedBy) {
                console.log(`        [${d.object}]`)
                console.log(wrap(d.note || '(no note)', '          '))
            }
        }
    }
}
