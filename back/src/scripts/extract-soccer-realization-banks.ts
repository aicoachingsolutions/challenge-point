/**
 * Soccer Module extraction — Realization Banks sheet.
 *
 * ONE-TIME MIGRATION. Emits the `environmentalRealizations` arrays as a normalized one-to-many
 * child resource, one row per alternative spine, rather than flattening them into a delimited cell.
 *
 * WHY A SHEET AND NOT A COLUMN. Three reasons, in order of how much damage the alternative does:
 *
 *   1. ORDER IS BEHAVIOUR. build-activity-skeleton.ts designates a spine with
 *      `realizations[(variationIndex + i) % realizations.length]`. Position is not presentation —
 *      it decides which realization a given repeat design is built around. A normalized resource
 *      makes that explicit as `bank_ordinal`; a delimited cell makes it an accident of typing.
 *   2. THE ENTRIES ARE PROSE. Every one is a full sentence, several containing the semicolons and
 *      dashes that already shredded setup guidance once. A cell holding four sentences is a
 *      delimiter incident waiting to happen; a cell holding one sentence cannot be split wrongly.
 *   3. THE SCHEMA ALREADY SAID SO. The Realizations sheet declares `realization_bank_id` — a single
 *      ID, pointing at a bank that did not exist yet. This populates the other end of that FK
 *      instead of contradicting it.
 *
 * The bank is keyed by `realization_bank_id`, not by the realization, so two realizations can share
 * a bank later without duplicating rows. Today each bank has exactly one owner.
 *
 * Run:  npx ts-node --files -r tsconfig-paths/register ./src/scripts/extract-soccer-realization-banks.ts
 * Then: python back/data/sport-modules/soccer/write-workbook.py
 */
import fs from 'node:fs'
import path from 'node:path'

import { TEST_LIBRARY_V0_CONSTRAINTS } from '../system/test-library/constraints'
import { TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../system/test-library/environmental-manipulations'
import type { TestLibraryV0Constraint } from '../system/test-library/types'

interface BankRow {
    [column: string]: string | number | null
}

const SOURCE_GROUPS: Array<{
    universalConceptType: 'INTERACTION_REGULATION' | 'ENVIRONMENTAL_MANIPULATION'
    rows: TestLibraryV0Constraint[]
}> = [
    { universalConceptType: 'INTERACTION_REGULATION', rows: TEST_LIBRARY_V0_CONSTRAINTS },
    { universalConceptType: 'ENVIRONMENTAL_MANIPULATION', rows: TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS },
]

/**
 * Bank ID derived from the owning realization so the FK is legible in the workbook. `tl-v0-constraint-x`
 * becomes `RB-X` — stable, and obviously related to its owner when read by a human in a spreadsheet.
 */
export function bankIdFor(realizationId: string): string {
    return `RB-${realizationId.replace(/^tl-v0-constraint-/, '').toUpperCase()}`
}

function buildRows(): { banks: BankRow[]; owners: Array<{ realization_id: string; realization_bank_id: string }> } {
    const banks: BankRow[] = []
    const owners: Array<{ realization_id: string; realization_bank_id: string }> = []

    for (const group of SOURCE_GROUPS) {
        for (const source of group.rows) {
            const entries = source.environmentalRealizations ?? []
            if (entries.length === 0) continue

            const bankId = bankIdFor(source.id)
            owners.push({ realization_id: source.id, realization_bank_id: bankId })

            entries.forEach((entry, index) => {
                banks.push({
                    // Ordinal is part of the key: the entry's identity includes its position, because
                    // its position is what selects it.
                    realization_bank_entry_id: `${bankId}-${String(index + 1).padStart(2, '0')}`,
                    realization_bank_id: bankId,
                    realization_id: source.id,
                    // 1-based and contiguous. The loader enforces both — a gap would silently shift
                    // every later entry into a different variation slot.
                    bank_ordinal: index + 1,
                    realization_text: entry,
                    universal_concept_type: group.universalConceptType,
                    status: 'ACTIVE',
                    introduced_version: 'RC1-CANDIDATE-V3',
                    last_verified_version: 'RC1-CANDIDATE-V3',
                    provenance: `Extracted from ${source.id}.environmentalRealizations via extract-soccer-realization-banks.ts`,
                    notes: '',
                })
            })
        }
    }

    return { banks, owners }
}

function main(): void {
    const { banks, owners } = buildRows()
    const dir = path.resolve(__dirname, '../../data/sport-modules/soccer')

    fs.writeFileSync(path.join(dir, 'realization-banks.extracted.json'), `${JSON.stringify(banks, null, 2)}\n`)
    // The owning realization rows are AUTHORED in the workbook, so the writer will not rewrite that
    // sheet. This emits just the FK assignments for the one-time schema script to apply in place.
    fs.writeFileSync(path.join(dir, 'realization-bank-owners.extracted.json'), `${JSON.stringify(owners, null, 2)}\n`)

    console.log(`Extracted ${banks.length} bank entries across ${owners.length} banks.`)
    for (const owner of owners) {
        const size = banks.filter((b) => b.realization_bank_id === owner.realization_bank_id).length
        console.log(`  ${owner.realization_bank_id}  ${size} entries  ← ${owner.realization_id}`)
    }
}

main()
