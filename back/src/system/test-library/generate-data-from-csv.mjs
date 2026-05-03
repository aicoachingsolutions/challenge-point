/**
 * Reads csv/*.csv and generates affordanceLenses.ts, constraints.ts, archetypes.ts,
 * and libraryConversionReport.ts (counts, skipped rows, validation errors).
 *
 * Run: node src/system/test-library/generate-data-from-csv.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Parses CSV including blank lines as rows (for skip accounting). */
function parseCSV(text) {
    const rows = []
    let i = 0
    let field = ''
    const row = []
    let inQuotes = false
    const pushRow = () => {
        row.push(field)
        rows.push(row.slice())
        row.length = 0
        field = ''
    }
    while (i < text.length) {
        const c = text[i]
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"'
                    i += 2
                    continue
                }
                inQuotes = false
                i++
                continue
            }
            field += c
            i++
            continue
        }
        if (c === '"') {
            inQuotes = true
            i++
            continue
        }
        if (c === ',') {
            row.push(field)
            field = ''
            i++
            continue
        }
        if (c === '\r') {
            i++
            continue
        }
        if (c === '\n') {
            pushRow()
            i++
            continue
        }
        field += c
        i++
    }
    if (field.length || row.length) pushRow()
    return rows
}

function escapeStr(s) {
    return JSON.stringify(s ?? '')
}

function slug(s) {
    return (
        String(s)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'item'
    )
}

function splitPipe(s) {
    if (!s || !String(s).trim()) return []
    return String(s)
        .split('|')
        .map((x) => x.trim())
        .filter(Boolean)
}

function splitComma(s) {
    if (!s || !String(s).trim()) return []
    return String(s)
        .split(',')
        .map((x) => x.trim().replace(/^"|"$/g, ''))
        .filter(Boolean)
}

function splitSemi(s) {
    if (!s || !String(s).trim()) return []
    return String(s)
        .split(';')
        .map((x) => x.trim())
        .filter(Boolean)
}

function parseBoolStrict(s, errors) {
    const t = String(s ?? '').trim().toLowerCase()
    if (t === 'true' || t === '1' || t === 'yes') return true
    if (t === 'false' || t === '0' || t === 'no') return false
    if (t === '') {
        errors.push('includesIncentiveLayer is empty (expected True or False)')
        return false
    }
    errors.push(`includesIncentiveLayer has invalid value "${String(s).trim()}" (expected True or False)`)
    return false
}

/** Parse after row passed validation (known True/False). */
function parseBoolEmit(s) {
    const t = String(s ?? '').trim().toLowerCase()
    return t === 'true' || t === '1' || t === 'yes'
}

function rowObject(header, cells) {
    const o = {}
    header.forEach((h, idx) => {
        o[h] = cells[idx] ?? ''
    })
    return o
}

function isRowEmpty(cells) {
    return !cells.some((c) => String(c ?? '').trim() !== '')
}

const csvDir = path.join(__dirname, 'csv')

const skippedRows = []
const validationErrors = []

function skipRow(sourceFile, csvRowNumber, reason, identifier) {
    skippedRows.push({
        sourceFile,
        csvRowNumber,
        reason,
        ...(identifier ? { identifier } : {}),
    })
}

function headerMismatch(sourceFile, expected, actual) {
    validationErrors.push({
        sourceFile,
        phase: 'header',
        message: `Expected ${expected.length} columns, got ${actual.length}; or header mismatch.`,
    })
}

const AFFORDANCE_LENS_EXPECTED_HEADER = [
    'title',
    'description',
    'type',
    'affordanceTagGroup',
    'notes',
    'contextualAudit',
    'suggestedConstraintPrompt',
    'category',
    'gameTemplateAnchor',
    'designIntent',
    'constraintSupport',
    'exampleConsequencePatterns',
    'visibilityTriggers',
    'logicUsageNote',
]

const CONSTRAINT_EXPECTED_HEADER = [
    'title',
    'description',
    'type',
    'affordanceTagGroup',
    'notes',
    'contextualAudit',
    'suggestedConstraintPrompt',
    'category',
    'gameTemplateAnchor',
    'designIntent',
    'constraintArchetype',
    'constraintRole',
    'primaryConstraintType',
    'includesIncentiveLayer',
    'incentiveMechanism',
    'visibilityEffect',
    'targetAffordancePrimary',
    'logicUsageNote',
]

const ARCHETYPE_EXPECTED_HEADER = [
    'game_form_id',
    'game_form_name',
    'objective',
    'interaction_structure',
    'directionality_type',
    'phase_of_play',
    'player_structure_logic',
    'typical_affordances',
    'recommended_constraint_types',
    'representative_design_notes',
    'primaryAffordances',
    'secondaryAffordances',
    'constraintFit_structural',
    'constraintFit_shaping',
    'constraintFit_consequence',
    'recommendedConstraintTypes',
    'exampleConstraintPatterns',
    'exampleIncentivePatterns',
    'logicUsageNote',
]

function stripBom(s) {
    return String(s ?? '').replace(/^\uFEFF/, '').trim()
}

function headersMatch(expected, actual) {
    if (expected.length !== actual.length) return false
    return expected.every((h, i) => stripBom(actual[i]) === h)
}

function validateAffordanceLens(o) {
    const e = []
    if (!String(o.title || '').trim()) e.push('missing title')
    if (!String(o.description || '').trim()) e.push('missing description')
    if (!String(o.type || '').trim()) e.push('missing type')
    if (!String(o.category || '').trim()) e.push('missing category')
    return e
}

function validateConstraint(o) {
    const e = []
    if (!String(o.title || '').trim()) e.push('missing title')
    if (!String(o.type || '').trim()) e.push('missing type')
    if (!String(o.constraintRole || '').trim()) e.push('missing constraintRole')
    if (!String(o.targetAffordancePrimary || '').trim()) e.push('missing targetAffordancePrimary')
    parseBoolStrict(o.includesIncentiveLayer, e)
    return e
}

function validateArchetype(o) {
    const e = []
    if (!String(o.game_form_id || '').trim()) e.push('missing game_form_id')
    if (!String(o.game_form_name || '').trim()) e.push('missing game_form_name')
    return e
}

// --- Affordance lenses ---
const affPath = path.join(csvDir, 'affordance-lenses.csv')
const affText = fs.readFileSync(affPath, 'utf8')
const affRows = parseCSV(affText)
const affHeader = (affRows[0] || []).map((h) => stripBom(h))
let affObjs = []
const affSeenIds = new Set()

let affDataAttempted = 0
let affDataAccepted = 0

if (!headersMatch(AFFORDANCE_LENS_EXPECTED_HEADER, affHeader)) {
    headerMismatch('affordance-lenses.csv', AFFORDANCE_LENS_EXPECTED_HEADER, affHeader)
}

for (let i = 1; i < affRows.length; i++) {
    const csvRowNumber = i + 1
    const cells = affRows[i]
    if (isRowEmpty(cells)) {
        skipRow('affordance-lenses.csv', csvRowNumber, 'empty_row')
        continue
    }
    affDataAttempted++
    if (cells.length !== affHeader.length) {
        skipRow(
            'affordance-lenses.csv',
            csvRowNumber,
            `column_count_mismatch:expected_${affHeader.length}_got_${cells.length}`
        )
        continue
    }
    const o = rowObject(affHeader, cells)
    const id = `tl-v0-lens-${slug(o.title)}`
    const verr = validateAffordanceLens(o)
    if (verr.length) {
        skipRow('affordance-lenses.csv', csvRowNumber, `validation_failed:${verr.join(';')}`, o.title || '')
        continue
    }
    if (affSeenIds.has(id)) {
        skipRow('affordance-lenses.csv', csvRowNumber, `duplicate_derived_id:${id}`, o.title || '')
        continue
    }
    affSeenIds.add(id)
    affObjs.push({ id, ...o })
    affDataAccepted++
}

let affOut = `import type { TestLibraryV0AffordanceLens } from './types'\n\n`
affOut += `/** Test Library V0 — affordance lenses (from csv/affordance-lenses.csv) */\n`
affOut += `export const TEST_LIBRARY_V0_AFFORDANCE_LENSES: TestLibraryV0AffordanceLens[] = [\n`
for (const o of affObjs) {
    affOut += `  {\n`
    affOut += `    id: ${escapeStr(o.id)},\n`
    affOut += `    title: ${escapeStr(o.title)},\n`
    affOut += `    description: ${escapeStr(o.description)},\n`
    affOut += `    type: ${escapeStr(o.type)},\n`
    affOut += `    affordanceTagGroup: ${escapeStr(o.affordanceTagGroup)},\n`
    affOut += `    notes: ${escapeStr(o.notes)},\n`
    affOut += `    contextualAudit: ${escapeStr(o.contextualAudit)},\n`
    affOut += `    suggestedConstraintPrompt: ${escapeStr(o.suggestedConstraintPrompt)},\n`
    affOut += `    category: ${escapeStr(o.category)},\n`
    affOut += `    gameTemplateAnchor: ${JSON.stringify(splitPipe(o.gameTemplateAnchor))},\n`
    affOut += `    designIntent: ${escapeStr(o.designIntent)},\n`
    affOut += `    constraintSupport: ${JSON.stringify(splitComma(o.constraintSupport))},\n`
    affOut += `    exampleConsequencePatterns: ${JSON.stringify(splitSemi(o.exampleConsequencePatterns))},\n`
    affOut += `    visibilityTriggers: ${JSON.stringify(splitSemi(o.visibilityTriggers))},\n`
    affOut += `    logicUsageNote: ${escapeStr(o.logicUsageNote)},\n`
    affOut += `  },\n`
}
affOut += `]\n`
fs.writeFileSync(path.join(__dirname, 'affordanceLenses.ts'), affOut, 'utf8')

// --- Constraints ---
const conPath = path.join(csvDir, 'constraints.csv')
const conText = fs.readFileSync(conPath, 'utf8')
const conRows = parseCSV(conText)
const conHeader = (conRows[0] || []).map((h) => stripBom(h))
let conObjs = []
const conSeenIds = new Set()

let conDataAttempted = 0
let conDataAccepted = 0

if (!headersMatch(CONSTRAINT_EXPECTED_HEADER, conHeader)) {
    headerMismatch('constraints.csv', CONSTRAINT_EXPECTED_HEADER, conHeader)
}

for (let i = 1; i < conRows.length; i++) {
    const csvRowNumber = i + 1
    const cells = conRows[i]
    if (isRowEmpty(cells)) {
        skipRow('constraints.csv', csvRowNumber, 'empty_row')
        continue
    }
    conDataAttempted++
    if (cells.length !== conHeader.length) {
        skipRow(
            'constraints.csv',
            csvRowNumber,
            `column_count_mismatch:expected_${conHeader.length}_got_${cells.length}`
        )
        continue
    }
    const o = rowObject(conHeader, cells)
    const id = `tl-v0-constraint-${slug(o.title)}`
    const verr = validateConstraint(o)
    if (verr.length) {
        skipRow('constraints.csv', csvRowNumber, `validation_failed:${verr.join(';')}`, o.title || '')
        continue
    }
    if (conSeenIds.has(id)) {
        skipRow('constraints.csv', csvRowNumber, `duplicate_derived_id:${id}`, o.title || '')
        continue
    }
    conSeenIds.add(id)
    conObjs.push({
        id,
        ...o,
        _parsedBool: parseBoolEmit(o.includesIncentiveLayer),
    })
    conDataAccepted++
}

let conOut = `import type { TestLibraryV0Constraint } from './types'\n\n`
conOut += `/** Test Library V0 — constraints (from csv/constraints.csv) */\n`
conOut += `export const TEST_LIBRARY_V0_CONSTRAINTS: TestLibraryV0Constraint[] = [\n`
for (const o of conObjs) {
    const includesIncentiveLayer = o._parsedBool
    delete o._parsedBool
    conOut += `  {\n`
    conOut += `    id: ${escapeStr(o.id)},\n`
    conOut += `    title: ${escapeStr(o.title)},\n`
    conOut += `    description: ${escapeStr(o.description)},\n`
    conOut += `    type: ${escapeStr(o.type)},\n`
    conOut += `    affordanceTagGroup: ${escapeStr(o.affordanceTagGroup)},\n`
    conOut += `    notes: ${escapeStr(o.notes)},\n`
    conOut += `    contextualAudit: ${escapeStr(o.contextualAudit)},\n`
    conOut += `    suggestedConstraintPrompt: ${escapeStr(o.suggestedConstraintPrompt)},\n`
    conOut += `    category: ${escapeStr(o.category)},\n`
    conOut += `    gameTemplateAnchor: ${JSON.stringify(splitPipe(o.gameTemplateAnchor))},\n`
    conOut += `    designIntent: ${escapeStr(o.designIntent)},\n`
    conOut += `    constraintArchetype: ${escapeStr(o.constraintArchetype)},\n`
    conOut += `    constraintRole: ${escapeStr(o.constraintRole)},\n`
    conOut += `    primaryConstraintType: ${escapeStr(o.primaryConstraintType)},\n`
    conOut += `    includesIncentiveLayer: ${includesIncentiveLayer ? 'true' : 'false'},\n`
    conOut += `    incentiveMechanism: ${escapeStr(o.incentiveMechanism)},\n`
    conOut += `    visibilityEffect: ${escapeStr(o.visibilityEffect)},\n`
    conOut += `    targetAffordancePrimary: ${escapeStr(o.targetAffordancePrimary)},\n`
    conOut += `    logicUsageNote: ${escapeStr(o.logicUsageNote)},\n`
    conOut += `  },\n`
}
conOut += `]\n`
fs.writeFileSync(path.join(__dirname, 'constraints.ts'), conOut, 'utf8')

// --- Archetypes ---
const arcPath = path.join(csvDir, 'archetypes.csv')
const arcText = fs.readFileSync(arcPath, 'utf8')
const arcRows = parseCSV(arcText)
const arcHeader = (arcRows[0] || []).map((h) => stripBom(h))
let arcObjs = []
const arcSeenIds = new Set()

let arcDataAttempted = 0
let arcDataAccepted = 0

if (!headersMatch(ARCHETYPE_EXPECTED_HEADER, arcHeader)) {
    headerMismatch('archetypes.csv', ARCHETYPE_EXPECTED_HEADER, arcHeader)
}

for (let i = 1; i < arcRows.length; i++) {
    const csvRowNumber = i + 1
    const cells = arcRows[i]
    if (isRowEmpty(cells)) {
        skipRow('archetypes.csv', csvRowNumber, 'empty_row')
        continue
    }
    arcDataAttempted++
    if (cells.length !== arcHeader.length) {
        skipRow(
            'archetypes.csv',
            csvRowNumber,
            `column_count_mismatch:expected_${arcHeader.length}_got_${cells.length}`
        )
        continue
    }
    const o = rowObject(arcHeader, cells)
    const id = String(o.game_form_id || '').trim() || `tl-v0-archetype-${slug(o.game_form_name)}`
    const verr = validateArchetype(o)
    if (verr.length) {
        skipRow('archetypes.csv', csvRowNumber, `validation_failed:${verr.join(';')}`, o.game_form_id || '')
        continue
    }
    if (arcSeenIds.has(id)) {
        skipRow('archetypes.csv', csvRowNumber, `duplicate_id:${id}`, o.game_form_id || '')
        continue
    }
    arcSeenIds.add(id)
    arcObjs.push({ id, ...o })
    arcDataAccepted++
}

let arcOut = `import type { TestLibraryV0Archetype } from './types'\n\n`
arcOut += `/** Test Library V0 — archetypes / game forms (from csv/archetypes.csv) */\n`
arcOut += `export const TEST_LIBRARY_V0_ARCHETYPES: TestLibraryV0Archetype[] = [\n`
for (const o of arcObjs) {
    arcOut += `  {\n`
    arcOut += `    id: ${escapeStr(o.id)},\n`
    arcOut += `    game_form_id: ${escapeStr(o.game_form_id)},\n`
    arcOut += `    game_form_name: ${escapeStr(o.game_form_name)},\n`
    arcOut += `    objective: ${escapeStr(o.objective)},\n`
    arcOut += `    interaction_structure: ${escapeStr(o.interaction_structure)},\n`
    arcOut += `    directionality_type: ${escapeStr(o.directionality_type)},\n`
    arcOut += `    phase_of_play: ${escapeStr(o.phase_of_play)},\n`
    arcOut += `    player_structure_logic: ${escapeStr(o.player_structure_logic)},\n`
    arcOut += `    typical_affordances: ${JSON.stringify(splitPipe(o.typical_affordances))},\n`
    arcOut += `    recommended_constraint_types: ${JSON.stringify(splitPipe(o.recommended_constraint_types))},\n`
    arcOut += `    representative_design_notes: ${escapeStr(o.representative_design_notes)},\n`
    arcOut += `    primaryAffordances: ${JSON.stringify(splitComma(o.primaryAffordances))},\n`
    arcOut += `    secondaryAffordances: ${JSON.stringify(splitComma(o.secondaryAffordances))},\n`
    arcOut += `    constraintFit_structural: ${escapeStr(o.constraintFit_structural)},\n`
    arcOut += `    constraintFit_shaping: ${escapeStr(o.constraintFit_shaping)},\n`
    arcOut += `    constraintFit_consequence: ${escapeStr(o.constraintFit_consequence)},\n`
    arcOut += `    recommendedConstraintTypes: ${JSON.stringify(splitComma(o.recommendedConstraintTypes))},\n`
    arcOut += `    exampleConstraintPatterns: ${JSON.stringify(splitSemi(o.exampleConstraintPatterns))},\n`
    arcOut += `    exampleIncentivePatterns: ${JSON.stringify(splitSemi(o.exampleIncentivePatterns))},\n`
    arcOut += `    logicUsageNote: ${escapeStr(o.logicUsageNote)},\n`
    arcOut += `  },\n`
}
arcOut += `]\n`
fs.writeFileSync(path.join(__dirname, 'archetypes.ts'), arcOut, 'utf8')

const generatedAtIso = new Date().toISOString()

const report = {
    generatedAtIso,
    sourceCsvRelativeDir: 'src/system/test-library/csv',
    counts: {
        totalArchetypesLoaded: arcObjs.length,
        totalAffordanceLensesLoaded: affObjs.length,
        totalConstraintsLoaded: conObjs.length,
    },
    csvStats: {
        affordanceLenses: {
            dataRowsAttempted: affDataAttempted,
            dataRowsAccepted: affDataAccepted,
        },
        constraints: {
            dataRowsAttempted: conDataAttempted,
            dataRowsAccepted: conDataAccepted,
        },
        archetypes: {
            dataRowsAttempted: arcDataAttempted,
            dataRowsAccepted: arcDataAccepted,
        },
    },
    skippedRows,
    validationErrors,
}

let repOut = `import type { TestLibraryV0LoadReport } from './types'\n\n`
repOut += `/**\n * Auto-generated by generate-data-from-csv.mjs — do not edit by hand.\n * Regenerate: node src/system/test-library/generate-data-from-csv.mjs\n */\n`
repOut += `export const TEST_LIBRARY_V0_LOAD_REPORT: TestLibraryV0LoadReport = ${JSON.stringify(report, null, 2)}\n`
fs.writeFileSync(path.join(__dirname, 'libraryConversionReport.ts'), repOut, 'utf8')

console.log('\n=== Test Library V0 CSV conversion ===')
console.log('Counts loaded:', report.counts)
console.log('CSV row stats:', report.csvStats)
if (skippedRows.length) {
    console.log('\nSkipped rows:', skippedRows.length)
    console.log(JSON.stringify(skippedRows, null, 2))
} else {
    console.log('\nSkipped rows: none')
}
if (validationErrors.length) {
    console.log('\nValidation errors:', validationErrors.length)
    console.log(JSON.stringify(validationErrors, null, 2))
} else {
    console.log('\nValidation errors: none')
}
console.log('\nWrote affordanceLenses.ts, constraints.ts, archetypes.ts, libraryConversionReport.ts')
