/**
 * Unit tests — the coach-event wiring contract.
 *
 * THE FAILURE THIS EXISTS TO PREVENT HAS ALREADY HAPPENED. `activities_viewed` was declared in the
 * front-end event vocabulary and never fired by anything. Nothing broke, nothing failed a test, and
 * the pilot summary would have reported zero activity views for two months — a number that reads as
 * a finding ("coaches generate but never look") when it only means nobody called the function. That
 * is the worst kind of wrong: not missing data, but confident data that is false.
 *
 * A coach event only produces evidence if THREE things line up, and each of the three lives in a
 * different file, maintained at a different time, with nothing connecting them:
 *
 *   1. the name is declared in the front-end vocabulary
 *   2. something in the front-end actually fires it
 *   3. the server summarizer counts it
 *
 * Any two without the third fail silently and look healthy. Declared-but-never-fired reports zero.
 * Fired-but-never-counted throws the evidence away after collecting it. Counted-but-never-declared
 * is a summary field permanently stuck at zero. This is the same shape as the allowlist projections
 * that dropped authored fields: the path terminates one step before its consumer, and nothing fails.
 *
 * So the three are pinned to each other here. It scans source text rather than importing, because
 * the front-end is a separate app with its own toolchain and no test runner of its own — and a guard
 * that cannot run is not a guard.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const BACK_SRC = path.resolve(__dirname, '..', '..')
const FRONT_SRC = path.resolve(BACK_SRC, '..', '..', 'front', 'src')
const VOCABULARY_FILE = path.join(FRONT_SRC, 'services', 'coach-events.service.ts')
const TELEMETRY_FILE = path.join(BACK_SRC, 'services', 'usage-telemetry.service.ts')

/**
 * Names that are deliberately declared but not fired yet.
 *
 * Kept as an explicit, empty-by-default list rather than as silence. An event waiting on UI that
 * does not exist is a legitimate state; the requirement is that someone wrote down that it is
 * intentional, so the next reader can tell it apart from the two months of zeros.
 */
const DECLARED_BUT_NOT_YET_FIRED: readonly string[] = ['activity_details_expanded']

function listSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return []

    const files: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules') continue
            files.push(...listSourceFiles(entryPath))
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            files.push(entryPath)
        }
    }
    return files
}

/** The `CoachEventName` union members, read out of the front-end vocabulary declaration. */
function declaredEventNames(): string[] {
    const source = fs.readFileSync(VOCABULARY_FILE, 'utf8')
    const start = source.indexOf('export type CoachEventName')
    assert.notEqual(start, -1, `could not find the CoachEventName declaration in ${VOCABULARY_FILE}`)

    // The union ends at the next top-level statement.
    const rest = source.slice(start)
    const end = rest.indexOf('export function')
    const block = end === -1 ? rest : rest.slice(0, end)

    const names = [...block.matchAll(/\|\s*'([a-z0-9_]+)'/gi)].map((m) => m[1]!)
    assert.ok(names.length > 0, 'parsed zero event names — the declaration format changed')
    return names
}

/** Event names the front-end actually fires. */
function firedEventNames(): Set<string> {
    const fired = new Set<string>()
    for (const file of listSourceFiles(FRONT_SRC)) {
        const source = fs.readFileSync(file, 'utf8')
        for (const match of source.matchAll(/recordCoachEvent\(\s*'([a-z0-9_]+)'/gi)) {
            fired.add(match[1]!)
        }
    }
    return fired
}

/** Event names the server summarizer counts, read from its `name === '...'` comparisons. */
function countedEventNames(): Set<string> {
    const source = fs.readFileSync(TELEMETRY_FILE, 'utf8')
    const counted = new Set<string>()
    for (const match of source.matchAll(/name\s*===\s*'([a-z0-9_]+)'/gi)) {
        counted.add(match[1]!)
    }
    return counted
}

/** Every declared event must be fired by something, or be listed as deliberately pending. */
function testDeclaredEventsAreFired(): void {
    const fired = firedEventNames()
    const orphans = declaredEventNames().filter(
        (name) => !fired.has(name) && !DECLARED_BUT_NOT_YET_FIRED.includes(name)
    )

    assert.deepEqual(
        orphans,
        [],
        `Declared in the coach-event vocabulary but never fired: ${orphans.join(', ')}. ` +
            'The pilot summary will report zero for these, which reads as a finding rather than as ' +
            'missing wiring. Fire them, or add them to DECLARED_BUT_NOT_YET_FIRED with a reason.'
    )
}

/** Every event the server counts must exist in the front-end vocabulary. */
function testCountedEventsAreDeclared(): void {
    const declared = new Set(declaredEventNames())
    const uncounted = [...countedEventNames()].filter((name) => !declared.has(name))

    assert.deepEqual(
        uncounted,
        [],
        `The summarizer counts events the front-end cannot send: ${uncounted.join(', ')}. ` +
            'These fields are permanently zero.'
    )
}

/**
 * Every fired event must be counted somewhere.
 *
 * The inverse of the two above, and the one that loses data rather than merely reporting zero: an
 * event fired by a coach's browser, written to the database, and then never read by the summary is
 * evidence collected and thrown away.
 */
function testFiredEventsAreCounted(): void {
    const counted = countedEventNames()
    const dropped = [...firedEventNames()].filter(
        (name) => !counted.has(name) && !DECLARED_BUT_NOT_YET_FIRED.includes(name)
    )

    assert.deepEqual(
        dropped,
        [],
        `Fired by the front-end but never counted by summarizeUsage: ${dropped.join(', ')}. ` +
            'The events are being stored and then ignored.'
    )
}

/** The checklist's automatic-collection list, pinned so removing one is a deliberate act. */
function testCheckListedCollectionPointsExist(): void {
    const declared = new Set(declaredEventNames())
    // Path to Pilot Checklist RC4, section 4: "Verify Automatic Data Collection". Only the items
    // collected as coach events appear here — learning goal, practice situation, learning stage,
    // generated activity and coach edits are all recorded server-side from the request itself.
    for (const required of ['planning_started', 'planning_abandoned', 'activities_viewed', 'activity_selected', 'session_completed']) {
        assert.ok(declared.has(required), `checklist requires collecting "${required}", which is not declared`)
    }
}

testDeclaredEventsAreFired()
testCountedEventsAreDeclared()
testFiredEventsAreCounted()
testCheckListedCollectionPointsExist()

console.log('coach-event-wiring unit tests: all cases passed.')
