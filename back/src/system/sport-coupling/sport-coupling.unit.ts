/**
 * Unit tests - sport-coupling guard.
 *
 * This is a ratchet for keeping sport-specific vocabulary out of sport-neutral system and
 * service code. To regenerate the baseline after removing existing violations, run:
 *
 *   UPDATE_SPORT_COUPLING_BASELINE=1 npm test
 *
 * Regenerating is only correct when violations have been removed. Do not use baseline updates to
 * silence new sport coupling; move the vocabulary to the sport layer, or declare the file in
 * SPORT_LAYER_FILES if it is intentionally sport-specific.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

type SportCouplingViolation = {
    file: string
    term: string
    line: number
}

/**
 * The baseline is keyed on (file, term, COUNT) — deliberately not on line number.
 *
 * Line numbers make a ratchet brittle: adding an unrelated line above a known violation reports it
 * as both a new violation and a stale entry, from an edit that changed nothing. generateSelection.ts
 * alone carries eleven entries and is actively edited, so that would fire regularly — and the
 * natural response to a spurious failure is to regenerate the baseline, which is precisely how a
 * ratchet starts silently accepting real new coupling. A guard people routinely reset is worse than
 * no guard, because it looks like protection.
 *
 * Counting per (file, term) keeps every property that matters: a new occurrence increments the
 * count and fails, a removed one decrements it and is reported stale, and moving code around is
 * correctly ignored. Exact line numbers still appear in failure messages, taken from the live scan.
 */
type SportCouplingBaselineEntry = {
    file: string
    term: string
    count: number
}

const SPORT_LAYER_FILES = [
    'system/test-library/archetypes.ts',
    'system/test-library/constraints.ts',
    'system/test-library/environmental-manipulations.ts',
    'system/test-library/affordanceLenses.ts',
    'system/input-constraints/deriveInputConstraints.ts',
    'system/test-library/normalizeCoachingInput.ts',
    'system/knowledge-core/em-selection-metadata.ts',
    // The Soccer Sport Module loader. Sport-specific BY DESIGN — this is the detachable layer the
    // extraction is moving knowledge into, so soccer vocabulary here is the goal rather than a leak.
    // Declared explicitly because the guard is default-deny: it caught this file on creation, which
    // is the behaviour we want.
    'system/sport-module/soccer-module.ts',
    // Reconstructs engine objects from the Soccer Module workbook. Sport-specific by design, for the
    // same reason as the loader above.
    'system/sport-module/soccer-module-adapter.ts',
]

const SPORT_TERMS = [
    'soccer',
    'football',
    'goalkeeper',
    'goalkeeping',
    'offside',
    'dribble',
    'dribbling',
    'dribbles',
    'throw-in',
    'corner kick',
    'penalty kick',
    'free kick',
    'final third',
    'midfielder',
    'midfield',
    'striker',
    'winger',
    'centre-back',
    'center-back',
    'full-back',
    'centre forward',
]

const SRC_ROOT = path.resolve(__dirname, '..', '..')
const SCAN_ROOTS = [path.join(SRC_ROOT, 'system'), path.join(SRC_ROOT, 'services')]
const BASELINE_PATH = path.join(__dirname, 'known-sport-coupling.json')
const WORD_CHAR = '[A-Za-z0-9_]'

function toRepoPath(filePath: string): string {
    return path.relative(SRC_ROOT, filePath).replace(/\\/g, '/')
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function termRegex(term: string): RegExp {
    return new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(term)}(?!${WORD_CHAR})`, 'i')
}

function listTypeScriptFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        return []
    }

    const files: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...listTypeScriptFiles(entryPath))
            continue
        }
        if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.unit.ts')) {
            files.push(entryPath)
        }
    }
    return files
}

function compareViolations(a: SportCouplingViolation, b: SportCouplingViolation): number {
    return a.file.localeCompare(b.file) || a.line - b.line || a.term.localeCompare(b.term)
}

function compareEntries(a: SportCouplingBaselineEntry, b: SportCouplingBaselineEntry): number {
    return a.file.localeCompare(b.file) || a.term.localeCompare(b.term)
}

/** Identity of a baseline row: one term within one file. Line is deliberately not part of it. */
function entryKey(entry: { file: string; term: string }): string {
    return [entry.file, entry.term].join('\u0000')
}

function formatViolation(violation: SportCouplingViolation): string {
    return `${violation.file}:${violation.line} "${violation.term}"`
}

/** Collapse line-level findings into the (file, term, count) rows the baseline stores. */
function summarize(violations: SportCouplingViolation[]): SportCouplingBaselineEntry[] {
    const counts = new Map<string, SportCouplingBaselineEntry>()
    for (const violation of violations) {
        const key = entryKey(violation)
        const existing = counts.get(key)
        if (existing) existing.count += 1
        else counts.set(key, { file: violation.file, term: violation.term, count: 1 })
    }
    return [...counts.values()].sort(compareEntries)
}

function collectSportCouplingViolations(): SportCouplingViolation[] {
    const sportLayerFiles = new Set(SPORT_LAYER_FILES)
    const violations: SportCouplingViolation[] = []
    // Compiled once rather than per line — the scan covers every system and services file.
    const matchers = SPORT_TERMS.map((term) => [term, termRegex(term)] as const)

    for (const filePath of SCAN_ROOTS.flatMap(listTypeScriptFiles)) {
        const file = toRepoPath(filePath)
        if (sportLayerFiles.has(file)) continue

        const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
        lines.forEach((lineText, index) => {
            for (const [term, matcher] of matchers) {
                if (matcher.test(lineText)) violations.push({ file, term, line: index + 1 })
            }
        })
    }

    return violations.sort(compareViolations)
}

function assertBaselineEntry(value: unknown): asserts value is SportCouplingBaselineEntry {
    assert.ok(value !== null && typeof value === 'object', 'Baseline entries must be objects.')
    const candidate = value as Partial<SportCouplingBaselineEntry>
    assert.equal(typeof candidate.file, 'string', 'Baseline entry file must be a string.')
    assert.equal(typeof candidate.term, 'string', 'Baseline entry term must be a string.')
    assert.equal(typeof candidate.count, 'number', 'Baseline entry count must be a number.')
}

function readBaseline(): SportCouplingBaselineEntry[] {
    const raw = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) as unknown
    assert.ok(Array.isArray(raw), 'known-sport-coupling.json must contain an array.')
    raw.forEach(assertBaselineEntry)
    return (raw as SportCouplingBaselineEntry[]).sort(compareEntries)
}

function writeBaseline(entries: SportCouplingBaselineEntry[]): void {
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(entries, null, 2)}\n`)
}

function testBaselineRatchet(): void {
    const violations = collectSportCouplingViolations()
    const current = summarize(violations)

    if (process.env.UPDATE_SPORT_COUPLING_BASELINE === '1') {
        writeBaseline(current)
        console.log(`sport-coupling baseline regenerated: ${violations.length} occurrences across ${current.length} rows.`)
        return
    }

    const baseline = readBaseline()
    const baselineByKey = new Map(baseline.map((entry) => [entryKey(entry), entry]))
    const currentByKey = new Map(current.map((entry) => [entryKey(entry), entry]))

    // Grew or newly appeared → new coupling.
    const increased = current.filter((entry) => entry.count > (baselineByKey.get(entryKey(entry))?.count ?? 0))
    // Shrank or disappeared → baseline is stale and must be lowered, or the ratchet slips back.
    const decreased = baseline.filter((entry) => (currentByKey.get(entryKey(entry))?.count ?? 0) < entry.count)

    const total = violations.length
    const baselineTotal = baseline.reduce((sum, entry) => sum + entry.count, 0)
    console.log(`sport-coupling occurrences: ${total}; baseline: ${baselineTotal}.`)

    assert.deepEqual(
        increased,
        [],
        [
            'New sport coupling detected.',
            ...increased.flatMap((entry) =>
                violations
                    .filter((v) => entryKey(v) === entryKey(entry))
                    .map(
                        (v) =>
                            `${formatViolation(v)} - Move this to the sport layer, or declare the file in SPORT_LAYER_FILES if it is intentionally sport-specific.`
                    )
            ),
        ].join('\n')
    )

    assert.deepEqual(
        decreased,
        [],
        [
            'Sport coupling was removed — lower the baseline so it cannot come back.',
            ...decreased.map(
                (entry) =>
                    `${entry.file} "${entry.term}": baseline ${entry.count}, now ${
                        currentByKey.get(entryKey(entry))?.count ?? 0
                    }. Regenerate with UPDATE_SPORT_COUPLING_BASELINE=1.`
            ),
        ].join('\n')
    )
}

function runAll(): void {
    testBaselineRatchet()
    console.log('sport-coupling unit tests: all cases passed.')
}

runAll()
