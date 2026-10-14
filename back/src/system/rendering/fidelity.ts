/**
 * The five fidelity questions, checked against the rendered activity rather than asserted about it.
 *
 * His list, in his order:
 *
 *   1. which concrete-game properties produced each load-bearing coach-facing instruction;
 *   2. whether anything in the rendered activity lacks support from the concrete game;
 *   3. whether anything required by the concrete game disappeared in translation;
 *   4. whether wording changed the STATUS of anything — requirement → suggestion, preference →
 *      requirement, realization choice → derived knowledge;
 *   5. whether a coach could actually lay out and play the game from the rendered output alone.
 *
 * **(2) and (4) are the ones that matter most**, because they are the two that fail quietly. An invented
 * number reads as helpful detail, and a requirement softened to a suggestion reads as friendly coaching.
 * Both are checked structurally: every quantity in the text must appear in the game, and the modality of
 * every sentence must match the status of what produced it.
 */

import { scaleExactly } from '../derivation/rational'
import { Instruction, RenderedActivity, SourceStatus } from './render-concrete-game'

export interface FidelityFinding {
    question: 1 | 2 | 3 | 4 | 5
    severity: 'VIOLATION' | 'NOTE'
    what: string
}

export interface FidelityReport {
    /** Q1 — instruction to the properties behind it. */
    provenance: { text: string; status: SourceStatus; from: string[] }[]
    findings: FidelityFinding[]
    passed: boolean
}

/** Wording that would make a requirement optional. A requirement carrying any of these is downgraded. */
const HEDGES = [/\bif it suits\b/i, /\bif you (can|like|want|prefer)\b/i, /\btry to\b/i, /\bideally\b/i, /\baround\b/i, /\broughly\b/i, /\bor so\b/i, /\bmay\b/i, /\bcould\b/i, /\boptional\b/i, /\bworks well\b/i]
/** Wording that would make a preference compulsory. A preference carrying any of these is upgraded. */
const IMPERATIVES = [/\bmust\b/i, /\balways\b/i, /\bexactly\b/i, /\brequired\b/i, /\bhas to\b/i, /\bneeds to be\b/i]
/** Wording that would present a realization choice as something the knowledge demanded. */
const NECESSITY = [/\bmust\b/i, /\bthe rules require\b/i, /\bby definition\b/i, /\balways\b/i, /\bnecessarily\b/i]

/** Every number anywhere in the concrete game and its realization record, as a set of strings. */
function quantitiesInGame(fixture: any): Set<string> {
    const found = new Set<string>()
    const walk = (node: unknown) => {
        if (typeof node === 'number' && Number.isFinite(node)) {
            found.add(String(node))
            // A length is often rendered as the width of an interval, so interval arithmetic is honoured.
            return
        }
        if (Array.isArray(node)) return node.forEach(walk)
        if (node && typeof node === 'object') Object.values(node as Record<string, unknown>).forEach(walk)
    }
    walk(fixture.game)
    walk(fixture.envelope)
    walk(fixture.status.geometry)
    // Interval widths: a rendered "40 m long" comes from an interval [0,40], not from a literal 40.
    for (const g of fixture.status.geometry ?? []) {
        const interval = g.geometry?.interval
        if (interval) found.add(String(interval.to - interval.from))
        const preference = g.geometry?.extentBound?.preferenceWithin
        if (preference && typeof preference.min === 'number') {
            found.add(String(preference.min))
            found.add(String(preference.max))
        }
    }
    return found
}

// ── Ranges ──────────────────────────────────────────────────────────────────────────────────────

/** Every number in a sentence, as a number — the same reading question 2 takes of the prose. */
const numbersIn = (text: string): number[] => [...text.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map(match => Number(match[1]))

const stated = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

interface Limits {
    min: number | null
    max: number | null
}

/** One line of the game and the range the knowledge authored for it, in the unit a coach is given. */
interface LineRange {
    path: string
    /** What is REQUIRED. Each end that is stated must reach the coach. */
    required: Limits | null
    /** The preferred range as it may be offered — inside the requirement. Null where there is none to offer. */
    preferred: Limits | null
    /** Why an authored preference is not offerable here, where it is not. Reported, never silent. */
    notOffered: string | null
    /** The value realization closed the line to, where it closed it inside a numeric range. */
    starting: number | null
}

const describe = (limits: Limits): string =>
    stated(limits.min) && stated(limits.max) ? `${limits.min} to ${limits.max}` : stated(limits.min) ? `at least ${limits.min}` : stated(limits.max) ? `at most ${limits.max}` : 'no stated limit'

/**
 * **The ranges this game carries, read from the AUTHORED bounds and worked out here, independently.**
 *
 * This check used to know nothing about ranges. A number was supported if it appeared anywhere in the game,
 * the envelope or the geometry — so, measured on the possession game with a scoring modifier at 40 × 30, it
 * passed *"Around 12 m to 20 m wide works well"* (12 is the players, 20 the minutes) and *"up to 30 m
 * wide"* for a channel the knowledge holds between 4.5 m and 7.5 m; it passed the preference being left out
 * altogether; and it REFUSED the accurate *"between 4.5 m and 7.5 m wide"*, because 4.5 was nowhere in the
 * game. It could not hold a flexible value accurate in either direction.
 *
 * His condition for keeping values flexible is that they are still told truly: *"If a condition materially
 * affects the activity, it must be represented and communicated accurately."* So the range of each line is
 * established here from what was AUTHORED — the bounds that travel beside a derived value (`status.bounds`)
 * and the bounds a choice was made within — scaled to this session's axis where the bound is a fraction of
 * one. It is deliberately NOT read from the metres realization wrote beside the interval, which is what the
 * renderer prints: a checker that reads the renderer's own source agrees with it by construction. If the
 * two ever differ, the sentence fails.
 *
 * **A fixture frozen before 13 October carries neither**, so for it — and only where nothing authored is
 * found for a line — the realized geometry's own bound is read instead. That is the one place the
 * renderer's source is used, and it is used so that an old game is still checked for a range rather than
 * waved through.
 *
 * An exclusion's bound says what a line may not be and is no part of any range (`Bounds.forbidden`).
 */
function lineRanges(fixture: any): { ranges: LineRange[]; unreadable: string[] } {
    const lengthM = Number(fixture.envelope?.lengthM)
    const widthM = Number(fixture.envelope?.widthM)
    // `along` is the longer dimension (the register's S1), exactly as realization takes it.
    const axes = Number.isFinite(lengthM) && Number.isFinite(widthM) ? { along: Math.max(lengthM, widthM), across: Math.min(lengthM, widthM) } : null
    const unreadable: string[] = []

    const authored = new Map<string, any[]>()
    const add = (path: unknown, bounds: unknown) => {
        if (typeof path !== 'string' || !Array.isArray(bounds) || !bounds.length) return
        authored.set(path, [...(authored.get(path) ?? []), ...bounds])
    }
    for (const entry of fixture.status.bounds ?? []) add(entry.path, entry.bounds)
    for (const choice of fixture.status.choices ?? []) add(choice.path, choice.within?.bounds)

    const tighten = (limits: Limits[]): Limits | null => {
        const mins = limits.map(l => l.min).filter(stated)
        const maxes = limits.map(l => l.max).filter(stated)
        return mins.length || maxes.length ? { min: mins.length ? Math.max(...mins) : null, max: maxes.length ? Math.min(...maxes) : null } : null
    }
    /** A preference expressed INSIDE the requirement — his rule of 1 October: it "must never override or widen" it. */
    const inside = (path: string, required: Limits | null, preference: Limits | null): Pick<LineRange, 'preferred' | 'notOffered'> => {
        if (!preference) return { preferred: null, notOffered: null }
        const offered = tighten(required ? [required, preference] : [preference])
        if (offered && stated(offered.min) && stated(offered.max) && offered.min > offered.max) {
            return {
                preferred: null,
                notOffered: `${path} carries an authored preferred range (${describe(preference)}) that lies wholly outside what is required here (${describe(required!)}), so it is not offered and the requirement stands`,
            }
        }
        return { preferred: offered, notOffered: null }
    }

    const ranges: LineRange[] = []
    const starting = (path: string): number | null => {
        const choice = (fixture.status.choices ?? []).find((c: any) => c.path === path)
        return choice && choice.closure === 'STARTING_VALUE_IN_RANGE' && stated(choice.value) ? choice.value : null
    }

    for (const [path, bounds] of authored) {
        const lineAxis = path.endsWith('.along') ? 'along' : path.endsWith('.across') ? 'across' : null
        let readable = true
        const inUnits = (bound: any): Limits => {
            const scale = (raw: unknown): number | null => {
                if (!stated(raw)) return null
                if (!bound.fractionOfAxis) return raw
                const axis = bound.axis === 'along' || bound.axis === 'across' ? bound.axis : lineAxis
                if (!axis || !axes) {
                    readable = false
                    return null
                }
                return scaleExactly(raw, axes[axis as 'along' | 'across'])
            }
            return { min: scale(bound.min), max: scale(bound.max) }
        }
        const counts = bounds.filter((b: any) => b && b.kind === 'COUNT' && !b.forbidden)
        const required = tighten(counts.filter((b: any) => !b.preferred).map(inUnits))
        const preference = tighten(counts.filter((b: any) => b.preferred).map(inUnits))
        if (!readable) {
            unreadable.push(`${path} carries a bound that is a fraction of an axis this check cannot identify, so its limits are not checked against the rendering`)
            continue
        }
        const begun = starting(path)
        if (!required && !preference && begun === null) continue
        ranges.push({ path, required, ...inside(path, required, preference), starting: begun })
    }

    for (const g of fixture.status.geometry ?? []) {
        const bound = g.geometry?.extentBound
        if (!bound || typeof g.path !== 'string' || authored.has(g.path)) continue
        const axis = g.geometry?.axis as 'along' | 'across' | undefined
        const scaled = (raw: unknown): number | null => (!stated(raw) ? null : !bound.fractionOfAxis ? raw : axes && axis ? scaleExactly(raw, axes[axis]) : null)
        const own: Limits = { min: scaled(bound.min), max: scaled(bound.max) }
        if (bound.preferred) {
            ranges.push({ path: g.path, required: null, preferred: tighten([own]), notOffered: null, starting: null })
            continue
        }
        const preference = bound.preferenceWithin
        ranges.push({
            path: g.path,
            required: tighten([own]),
            preferred: preference && preference.compatible !== false && stated(preference.min) ? { min: preference.min, max: stated(preference.max) ? preference.max : null } : null,
            notOffered: preference && preference.compatible === false ? `${g.path} carries an authored preferred extent that is not offered: ${String(preference.note ?? 'it is incompatible with the requirement')}` : null,
            starting: null,
        })
    }
    return { ranges, unreadable }
}

/** A path into the game, split at the dots that are not inside a subscript — an element id may hold dots of its own. */
function segmentsOf(path: string): { key: string; subscript: string | null }[] {
    const segments: { key: string; subscript: string | null }[] = []
    let key = ''
    let subscript: string | null = null
    let depth = 0
    let buffer = ''
    for (const ch of path) {
        if (ch === '[') {
            if (depth++ === 0) {
                buffer = ''
                continue
            }
        } else if (ch === ']') {
            if (--depth === 0) {
                subscript = buffer
                continue
            }
        }
        if (depth > 0) buffer += ch
        else if (ch === '.') {
            segments.push({ key, subscript })
            key = ''
            subscript = null
        } else key += ch
    }
    segments.push({ key, subscript })
    return segments
}

/**
 * **The numbers the game holds AT a cited path** — and nowhere else.
 *
 * A value at the path; every number beneath it where it is a structure; the size of a collection it names;
 * and, for a realized position, the EXTENT of its interval — how long or how wide the thing is. A path with
 * an open subscript (`teams[].outfieldCount`) is read across every member, since that is what a sentence
 * speaking for all of them cites. This is what lets a sentence about one line be held to that line: the old
 * test asked only whether the number appeared anywhere in the game.
 *
 * **The interval's two coordinates are deliberately NOT among them.** A channel against the far touchline of
 * a 30 m width occupies 22.5 to 30, so admitting its ends admitted *"up to 30 m wide"* for that channel
 * while refusing it for its twin on the near side — found by the test for exactly that sentence. No
 * instruction states a coordinate today; one that comes to will need to say which number is which.
 */
function heldAt(fixture: any, path: string): number[] {
    const found: number[] = []
    for (const g of fixture.status.geometry ?? []) {
        if (g.path !== path) continue
        const interval = g.geometry?.interval
        if (interval && stated(interval.from) && stated(interval.to)) found.push(interval.to - interval.from)
    }
    const collect = (node: unknown) => {
        if (stated(node)) found.push(node)
        else if (Array.isArray(node)) found.push(node.length)
        else if (node && typeof node === 'object') Object.values(node as Record<string, unknown>).forEach(collect)
    }
    let nodes: unknown[] = [fixture.game]
    for (const { key, subscript } of segmentsOf(path)) {
        nodes = nodes.flatMap(node => {
            const next = node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined
            if (subscript === null) return next === undefined ? [] : [next]
            if (!Array.isArray(next)) return []
            return subscript === '' ? next : next.filter(member => member === subscript || (member && typeof member === 'object' && (member as Record<string, unknown>).elementId === subscript))
        })
    }
    nodes.forEach(collect)
    return found
}

/**
 * Properties established by the game that need no coach-facing expression.
 *
 * **His rule of 1 October, which this encodes rather than paraphrases:**
 *
 *   > *An established property does not require coach-facing expression when it is exclusively
 *   > computational/accounting metadata and all of its operational consequences are already faithfully
 *   > represented in coach-facing instructions.*
 *
 * It has two conditions, and the second is the one that does the work. Claiming a property is metadata is
 * cheap; proving that its operational consequences reached the coach is not. So each exclusion must name
 * the property paths that carry its consequences, and the checker **verifies that an instruction actually
 * cites each of them**. An exclusion whose consequences are not in the rendering is reported as a loss,
 * not honoured — which means this list cannot be used to quietly drop something load-bearing.
 *
 * `consequences: []` asserts there are none to represent, and is only defensible for a property that
 * changes nothing a coach does — an internal convention rather than a rule of the game.
 *
 * He also asked that exclusions stay explicit and auditable: *"I do not want silent filtering."* Every
 * entry is reported in the output with its reason and its discharge, whether or not it passes.
 */
const NO_COACH_FACING_EXPRESSION: { suffix: string; because: string; consequences: string[] }[] = [
    {
        suffix: '.startsEpisode',
        because:
            'an episode boundary is event-accounting metadata: it tells the system when to begin attributing ' +
            'events, and a coach does nothing differently because of it',
        // Its one operational consequence — that a turnover does not stop play — is carried by the
        // playState instruction, so the second condition of his rule is discharged by naming it.
        consequences: ['transitions[c:restated:GF2:GF2-07.a].playState'],
    },
    {
        suffix: 'space.axis',
        because:
            'an internal orientation convention naming which envelope dimension is the axis; it has no ' +
            'operational consequence of its own because the rendered geometry is already in metres along and across',
        consequences: [],
    },
]

/** Game properties a coach must be told about. Absence from the rendering is a loss. */
function loadBearingPaths(fixture: any): {
    coachFacing: string[]
    excluded: { path: string; because: string; consequences: string[] }[]
} {
    const coachFacing: string[] = []
    const excluded: { path: string; because: string; consequences: string[] }[] = []
    for (const entry of [...fixture.status.derived, ...fixture.status.choices]) {
        const rule = NO_COACH_FACING_EXPRESSION.find(r => entry.path.endsWith(r.suffix) || entry.path === r.suffix)
        if (rule) excluded.push({ path: entry.path, because: rule.because, consequences: rule.consequences })
        else coachFacing.push(entry.path)
    }
    /**
     * **What assembly entailed is established too, and it was not on this list.** Added 13 October.
     *
     * The roster — each team's size and its count for every specialized role — is written into the game at
     * the assembly boundary and recorded under `status.entailed`, which this function never read. So the
     * one part of the game a coach needs in order to pick sides could go unsaid with no violation, and it
     * did: measured before this, a session with one specialized performer available per team rendered
     * "12 players in total / 2 teams of 5", said nothing about the other two, and passed with 0.
     *
     * **Each is required by its PROPERTY path, with the member left open.** An entailment is addressed to
     * a member by handle, and a handle may not reach coach-facing output, citations included
     * (`identity.unit.ts`). An instruction that speaks for every team cites `<collection>[].<leaf>`, so
     * that is what is looked for — once per property, however many members hold it.
     */
    for (const entry of fixture.status.entailed ?? []) {
        const property = `${entry.collection}[].${entry.leaf}`
        if (!coachFacing.includes(property)) coachFacing.push(property)
    }
    return { coachFacing, excluded }
}

/**
 * A quantity is supported if the game contains it as a value, OR if it is the size of a collection the
 * instruction cites. "2 teams" is not an invention — the game contains two team members — but the 2 is a
 * cardinality rather than a stored value, so it needs its own narrow justification. Counting the members
 * of a cited collection is the only arithmetic permitted; nothing else may be computed into the prose.
 */
function supportedQuantity(fixture: any, instruction: Instruction, quantity: number, inGame: Set<string>): boolean {
    if (inGame.has(String(quantity))) return true
    for (const path of instruction.from) {
        const collection = path.split('.').reduce<any>((node, key) => (node == null ? node : node[key]), fixture.game)
        if (Array.isArray(collection) && collection.length === quantity) return true
    }
    return false
}

/**
 * **Does this physical feature do anything in the game?** His ruling of 1 October, in his words:
 *
 *   > *Every physical game feature that a coach is instructed to create must participate in at least one
 *   > established operational relationship in the game. That could be scoring, eligibility/access, value
 *   > modification, transition behavior, information, or another represented game relationship. It does not
 *   > necessarily require a prose description saying what the region is "for."*
 *
 * So this deliberately does NOT look at the `functions` row. A region whose `functions` is excluded may
 * still be fully realized operationally — by being a scoring target, by modifying value, by triggering a
 * transition, by being the subject of an information rule. And a region carrying a decorative function
 * string would still not be realized if nothing in the game changes when players interact with it.
 *
 *   > *If the game establishes a channel geometrically but nothing establishes what changes when
 *   > players/ball interact with it, then the channel is structurally present but not functionally
 *   > realized. Rendering should not invent its purpose, and I don't think we should call the resulting
 *   > output a runnable coach activity.*
 *
 * Hence a VIOLATION rather than a note: the rendering is faithful, and the activity is not runnable.
 *
 * A reference may name the region by its element id or by the authored item id the element id ends with —
 * `objectives[].reference` carries `{structuralRef: {contractId, itemId}}`, and the itemId is the authored
 * `GF2-03.a` while the element is `c:restated:GF2:GF2-03.a`. Both forms count.
 */
function operationalRelationships(fixture: any, elementId: string): string[] {
    const itemId = String(elementId).split(':').pop() ?? elementId
    const found: string[] = []

    const walk = (node: unknown, path: string) => {
        // A region's own entry describes it; it cannot be the relationship that gives it a purpose.
        if (path.startsWith('space.regions')) return
        if (typeof node === 'string') {
            if (node === elementId || node === itemId) found.push(path)
            return
        }
        if (Array.isArray(node)) return node.forEach((entry, i) => walk(entry, `${path}[${i}]`))
        if (node && typeof node === 'object') {
            for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
                walk(value, path ? `${path}.${key}` : key)
            }
        }
    }
    walk(fixture.game, '')
    return found
}

export function checkFidelity(fixture: any, rendered: RenderedActivity): FidelityReport {
    const findings: FidelityFinding[] = []
    const cited = new Set(rendered.instructions.flatMap(i => i.from))
    const inGame = quantitiesInGame(fixture)
    // An authored limit is a number of the game even where no value equals it — a required minimum scaled
    // to the axis, the floor of a count. Without this the ACCURATE statement of a range was refused.
    const { ranges, unreadable } = lineRanges(fixture)
    for (const range of ranges) {
        for (const limits of [range.required, range.preferred]) {
            for (const limit of [limits?.min, limits?.max]) if (stated(limit)) inGame.add(String(limit))
        }
    }

    // ── Q2 — nothing unsupported ────────────────────────────────────────────────────────────────
    for (const instruction of rendered.instructions) {
        if (!instruction.from.length) {
            findings.push({ question: 2, severity: 'VIOLATION', what: `"${instruction.text}" cites no concrete-game property` })
        }
        for (const quantity of instruction.quantities) {
            if (!supportedQuantity(fixture, instruction, quantity, inGame)) {
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: `"${instruction.text}" states ${quantity}, which appears nowhere in the concrete game`,
                })
            }
        }
        // A number in the prose that the instruction did not declare is unchecked, which is as bad as
        // an invented one: it means a quantity reached a coach without passing this test.
        for (const match of instruction.text.matchAll(/\b(\d+(?:\.\d+)?)\b/g)) {
            if (!instruction.quantities.map(String).includes(match[1])) {
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: `"${instruction.text}" contains the number ${match[1]} without declaring it, so it was never checked against the game`,
                })
            }
        }
    }

    /**
     * **Q2, for a sentence about a line that carries a range: its numbers must be THAT line's.** Added
     * 13 October — a tightening, on his condition that a flexible value is still *"represented and
     * communicated accurately"*.
     *
     * The test above asks only whether a number appears somewhere in the game, and nearly every small
     * number does: 12 players, 20 minutes, a 30 m width. So two wrong ranges passed. Here a sentence that
     * cites a ranged line is held to what it cites:
     *
     *   - a PREFERENCE may state only the preferred range of a line it cites, as that range may be offered.
     *     A preference that states numbers and cites nothing with a preferred range is offering a range
     *     nobody authored;
     *   - any other sentence may state the required limits of a ranged line it cites, the value the activity
     *     starts at, and a number the game holds AT a path it cites — and nothing else. A preferred limit in
     *     a requirement's sentence is a preference stated as a requirement, and is refused here.
     *
     * A sentence that cites no ranged line is untouched by this and answers to the test above, as before.
     */
    const rangeAt = new Map(ranges.map(range => [range.path, range]))
    for (const instruction of rendered.instructions) {
        const about = instruction.from.map(path => rangeAt.get(path)).filter((range): range is LineRange => !!range)
        const numbers = [...new Set(numbersIn(instruction.text))]
        if (instruction.status === 'PREFERENCE') {
            const offerable = about.filter(range => range.preferred)
            const allowed = new Set(offerable.flatMap(range => [range.preferred!.min, range.preferred!.max].filter(stated)))
            for (const n of numbers) {
                if (allowed.has(n)) continue
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: offerable.length
                        ? `"${instruction.text}" offers ${n} as a preference, and the preferred range of what it cites is ${offerable.map(range => `${describe(range.preferred!)} (${range.path})`).join('; ')}`
                        : `"${instruction.text}" offers ${n} as a preference, and nothing it cites carries a preferred range that may be offered`,
                })
            }
            continue
        }
        if (!about.length) continue
        const allowed = new Set<number>(instruction.from.flatMap(path => heldAt(fixture, path)))
        for (const range of about) {
            for (const limit of [range.required?.min, range.required?.max, range.starting]) if (stated(limit)) allowed.add(limit)
        }
        for (const n of numbers) {
            if (allowed.has(n)) continue
            findings.push({
                question: 2,
                severity: 'VIOLATION',
                what:
                    `"${instruction.text}" states ${n}, which is neither a value the game holds at a property it cites nor a required limit of one: ` +
                    about.map(range => `${range.path} is ${range.required ? `required to be ${describe(range.required)}` : 'under no required limit'}`).join('; '),
            })
        }
    }

    // ── Q3 — nothing lost ───────────────────────────────────────────────────────────────────────
    /**
     * **A range is something the game establishes, so losing part of one is a loss.** Added 13 October.
     *
     *   - every stated end of a REQUIRED range must be said by a sentence that cites the line and is not a
     *     preference. The channel sentence said only the maximum for as long as it existed, and nothing
     *     noticed, because the minimum was not a path and question 3 looks for paths;
     *   - a PREFERRED range that may be offered must be offered, whole, by a preference that cites the line.
     *     Authored guidance left out is authored knowledge lost — this check accepted both preference
     *     sentences being deleted with nothing reported;
     *   - where realization closed a line to a starting value inside a range, that value must be said.
     *
     * A line no instruction cites at all is left to the path test below, which already reports it; saying
     * it twice would be two findings for one loss. A preference that cannot be offered here — because it
     * lies wholly outside the requirement on this session's area — is reported and not graded.
     */
    for (const range of ranges) {
        const citing = rendered.instructions.filter(i => i.from.includes(range.path))
        if (!citing.length) continue
        const firm = citing.filter(i => i.status !== 'PREFERENCE')
        const says = (instructions: Instruction[], n: number) => instructions.some(i => numbersIn(i.text).includes(n))
        for (const [end, limit] of [['minimum', range.required?.min], ['maximum', range.required?.max]] as const) {
            if (!stated(limit) || says(firm, limit)) continue
            findings.push({
                question: 3,
                severity: 'VIOLATION',
                what: `${range.path} has a required ${end} of ${limit} (required: ${describe(range.required!)}), and no instruction that cites it states that ${end}`,
            })
        }
        if (range.preferred) {
            const ends = [range.preferred.min, range.preferred.max].filter(stated)
            const offered = citing.some(i => i.status === 'PREFERENCE' && ends.every(n => numbersIn(i.text).includes(n)))
            if (!offered) {
                findings.push({
                    question: 3,
                    severity: 'VIOLATION',
                    what: `${range.path} carries an authored preferred range that may be offered here (${describe(range.preferred)}), and no instruction offers it`,
                })
            }
        }
        if (range.notOffered) findings.push({ question: 3, severity: 'NOTE', what: range.notOffered })
        if (stated(range.starting) && !says(firm, range.starting)) {
            findings.push({
                question: 3,
                severity: 'VIOLATION',
                what: `${range.path} starts at ${range.starting} in this activity, inside an authored range, and no instruction that cites it states that value`,
            })
        }
    }
    for (const what of unreadable) findings.push({ question: 3, severity: 'NOTE', what })

    const { coachFacing, excluded } = loadBearingPaths(fixture)
    for (const path of coachFacing) {
        if (![...cited].some(c => c === path)) {
            findings.push({ question: 3, severity: 'VIOLATION', what: `${path} is established by the game and no instruction carries it` })
        }
    }
    /**
     * Every exclusion is reported — he asked for no silent filtering — and **each one must discharge the
     * second half of his rule**: the operational consequences it names must actually be cited by some
     * instruction. An exclusion whose consequences did not reach the coach is a VIOLATION, because then the
     * property was not merely accounting metadata, and dropping it lost something a coach needed.
     */
    for (const entry of excluded) {
        if (cited.has(entry.path)) continue
        const undischarged = entry.consequences.filter(path => !cited.has(path))
        if (undischarged.length) {
            findings.push({
                question: 3,
                severity: 'VIOLATION',
                what:
                    `${entry.path} was excluded as accounting metadata, but its operational consequence(s) ` +
                    `${undischarged.join(', ')} reached no instruction — so the exclusion is not permitted`,
            })
            continue
        }
        findings.push({
            question: 3,
            severity: 'NOTE',
            what:
                `${entry.path} is established and deliberately given no coach-facing expression — ${entry.because}. ` +
                (entry.consequences.length
                    ? `Its operational consequence(s) are carried by ${entry.consequences.join(', ')}.`
                    : 'It has no operational consequence to carry.'),
        })
    }
    // An instantiated member is load-bearing too: a coach cannot field a team the rendering omits.
    if (fixture.status.instantiations.length && !cited.has('performers.teams')) {
        findings.push({ question: 3, severity: 'VIOLATION', what: 'teams were instantiated and the rendering does not mention them' })
    }

    // ── Q4 — no status changed by wording ───────────────────────────────────────────────────────
    for (const instruction of rendered.instructions) {
        const hedged = HEDGES.some(r => r.test(instruction.text))
        if ((instruction.status === 'DERIVED' || instruction.status === 'INSTANTIATED') && hedged) {
            findings.push({
                question: 4,
                severity: 'VIOLATION',
                what: `a ${instruction.status} requirement is worded as optional: "${instruction.text}"`,
            })
        }
        if (instruction.status === 'PREFERENCE') {
            if (IMPERATIVES.some(r => r.test(instruction.text))) {
                findings.push({ question: 4, severity: 'VIOLATION', what: `a PREFERENCE is worded as compulsory: "${instruction.text}"` })
            }
            if (!hedged) {
                findings.push({ question: 4, severity: 'VIOLATION', what: `a PREFERENCE carries no hedge, so it reads as a requirement: "${instruction.text}"` })
            }
        }
        if (instruction.status === 'REALIZATION_CHOICE' && NECESSITY.some(r => r.test(instruction.text))) {
            findings.push({
                question: 4,
                severity: 'VIOLATION',
                what: `a realization CHOICE is worded as though the knowledge demanded it: "${instruction.text}"`,
            })
        }
    }

    // ── Q5 — a coach could lay it out and play it ───────────────────────────────────────────────
    const sections = new Set(rendered.instructions.map(i => i.section))
    for (const required of ['Set up', 'Players', 'How to score'] as const) {
        if (!sections.has(required)) {
            findings.push({ question: 5, severity: 'VIOLATION', what: `nothing tells the coach "${required}"` })
        }
    }
    // Every physical element the game contains must have a MARKING instruction — one that carries the
    // region's noun, which is what produces "mark a <noun>". Any-instruction-citing-the-region is too weak
    // a test: a preference about a channel's width cites the channel and marks nothing.
    for (const region of fixture.game.space?.regions ?? []) {
        const nounPath = `space.regions[${region.elementId}].noun`
        const marked = rendered.instructions.some(
            i => i.section === 'Set up' && i.status !== 'PREFERENCE' && i.from.includes(nounPath),
        )
        if (!marked) {
            findings.push({ question: 5, severity: 'VIOLATION', what: `region ${region.elementId} exists in the game and has no marking instruction` })
            continue
        }
        // Marked, therefore a physical feature the coach is instructed to create — so it must do something.
        const relationships = operationalRelationships(fixture, region.elementId)
        if (!relationships.length) {
            findings.push({
                question: 5,
                severity: 'VIOLATION',
                what:
                    `a coach is instructed to mark ${region.elementId}, and nothing in the concrete game establishes what ` +
                    `changes when players or the ball interact with it — no scoring, access, value modification, transition ` +
                    `or information relationship references it. It is structurally present but not functionally realized, ` +
                    `so this output is not a runnable coach activity.`,
            })
        } else {
            findings.push({
                question: 5,
                severity: 'NOTE',
                what: `${region.elementId} participates operationally via ${relationships.join(', ')}`,
            })
        }
    }
    /**
     * **A scoring rule a coach cannot tell they have satisfied is operationally obscured.**
     *
     * His original question for this pass was whether the rendering loses, invents, contradicts **or
     * operationally obscures** anything established. This is the fourth of those, and it is the one that
     * passes every other test: the game establishes the whole consequence — a region condition over two named
     * channels, MULTIPLY, magnitude 2 — so nothing is lost and nothing invented, and the channels do
     * participate operationally, so the participation requirement is satisfied. And a coach still cannot
     * award the bonus, because nothing establishes what counts as a qualifying interaction with a channel.
     *
     * `REGION_ENTRY` carries no registered `triggerSemantics`, and the authoring note states the gap in its
     * own words: *"no rule for what counts as 'moving through' (ball, player, touch)"*. So the criterion is
     * an owner value, deliberately held, and rendering must not choose ball, player or touch to make the
     * output look runnable.
     */
    for (const modifier of fixture.game.value?.valueModifiers ?? []) {
        const carried = rendered.instructions.some(i => i.from.some(f => f.includes(String(modifier.elementId))))
        if (!carried) continue
        /**
         * **This no longer gates the finding on a field that cannot be authored.** On his ruling of 5 October,
         * scoped to exactly that and no further.
         *
         * It used to raise a VIOLATION whenever `modifier.condition.satisfiedBy` was `undefined`. Two things
         * were wrong with that, and together they made the check unsatisfiable:
         *
         * 1. **`condition.satisfiedBy` has no register row.** The value-modifier rows are V7 (the collection),
         *    V8a (`condition.type`), V8b (`condition.referents`), V9 (`magnitude`), V9a (`operation`) and V10
         *    (`combination`). None carries a criterion, and no row anywhere in the register is named
         *    `satisfiedBy`. So the only state that cleared this violation was one the invention check must
         *    reject — it traces to nothing derived, chosen or instantiated. **No legitimate representation
         *    satisfied both checks at once.**
         * 2. Reading the field at all implied it would resolve the finding, which is the thing he asked to
         *    stop. Presence in a grammar is evidence a concept is *sayable*, not that it is authorable here.
         *
         * **The finding itself is true and is preserved** — a coach genuinely cannot tell what meets the
         * condition. What changes is its severity and its basis. It is a NOTE on exactly the ground the missing
         * team size below is a NOTE: **the rendering is faithful.** It refuses to choose ball, player or touch,
         * and the gap is in the GAME, which this checker reports rather than grades. `passed` tracks whether the
         * rendering lost, invented, contradicted or obscured something of its own; it is not a claim that the
         * game is coachable.
         *
         * **It is unconditional, and that is a statement about the representation rather than a missing test:**
         * no row can carry a criterion for meeting a value-modifier condition, so no concrete game can
         * establish one. The moment a register row exists for it, this must become conditional again — the test
         * for this block pins that, so the next person is told rather than left to notice.
         */
        findings.push({
            question: 5,
            severity: 'NOTE',
            what:
                `a coach is told that meeting the ${modifier.condition?.type ?? 'region'} condition changes the score, and nothing in the ` +
                `game establishes what MEETS it. The scoring rule is complete and unusable: the consequence is established, the ` +
                `qualifying interaction is not, so a coach cannot tell when to award it. Rendering will not choose one. No register ` +
                `row carries a criterion for meeting a condition, so this cannot be closed by authoring — it needs a representational ` +
                `decision the owner holds, and the rendering is faithful to the game as it stands.`,
        })
    }

    // A coach needs team sizes to pick sides. This is a NOTE and not a VIOLATION because the rendering is
    // faithful — the number is absent from the GAME. Q5 is the question it fails, and it fails it honestly.
    const teams = fixture.game.performers?.teams ?? []
    if (teams.length && !teams.every((t: any) => Number.isFinite(t.outfieldCount))) {
        findings.push({
            question: 5,
            severity: 'NOTE',
            what:
                `no team carries \`outfieldCount\`, so the rendering can state the squad total and the number of teams but not ` +
                `how many play per side — a coach cannot pick sides from this output alone. The game, not the rendering, is missing it.`,
        })
    }

    return { provenance: rendered.instructions.map(i => ({ text: i.text, status: i.status, from: i.from })), findings, passed: !findings.some(f => f.severity === 'VIOLATION') }
}
