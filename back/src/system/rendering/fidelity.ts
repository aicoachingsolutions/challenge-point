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

import { practical, PracticalKind, practicalRequirement } from '../derivation/practical'
import { effectiveValue, scaleExactly } from '../derivation/rational'
import { CoachFacingExclusion, exclusionFor } from './coach-facing-exclusions'
import { ADJUSTING, Binding, combinedStatus, Instruction, RenderedActivity, SourceStatus } from './render-concrete-game'

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

/**
 * Wording that would make a requirement optional. A requirement carrying any of these is downgraded. `it helps`
 * joined on 14 October 2026 with the ADVISORY status whose hedge it is — a tightening for every firm sentence.
 * `works? well` since stage S-C2 (14 October 2026): "contrasting bibs work well" carried no hedge this list knew,
 * so a firm sentence saying it passed and a preference saying it was refused. A tightening for firm sentences,
 * and the same reading for a preference.
 */
const HEDGES = [/\bif it suits\b/i, /\bif you (can|like|want|prefer)\b/i, /\btry to\b/i, /\bideally\b/i, /\baround\b/i, /\broughly\b/i, /\bor so\b/i, /\bmay\b/i, /\bcould\b/i, /\boptional\b/i, /\bworks? well\b/i, /\bit helps\b/i]
/** Wording that would make a preference compulsory. A preference carrying any of these is upgraded. */
const IMPERATIVES = [/\bmust\b/i, /\balways\b/i, /\bexactly\b/i, /\brequired\b/i, /\bhas to\b/i, /\bneeds to be\b/i]
/** Wording that would present where an activity starts, or a coach's choice, as something the knowledge demanded. */
const NECESSITY = [/\bmust\b/i, /\bthe rules require\b/i, /\bby definition\b/i, /\balways\b/i, /\bnecessarily\b/i]
/** Wording that puts a choice to the coach. A COACH_CHOICE sentence that carries none states a fact it does not hold. */
const CHOICE_WORDS = [/\bpick\b/i, /\bchoose\b/i, /\bdecide\b/i]

/**
 * Every number anywhere in the concrete game and its realization record, as a set of strings.
 *
 * **Except the required limits realization wrote beside an interval (`requiredWithin`) — left out in the
 * review of 13 October.** Those metres are the renderer's own source for a range sentence, and they sit in
 * the game and the geometry this function walks, so a required limit became a number of the game for EVERY
 * sentence: measured against both versions of this check, *"Play for 4.5 minutes"* was refused before the
 * range work and passed after it, because 4.5 — a channel's minimum width — had arrived here. A required
 * limit supports the sentence that cites its line, and it does so from the authored bound (`lineRanges`),
 * never from what was written for the renderer.
 */
function quantitiesInGame(fixture: any): Set<string> {
    const found = new Set<string>()
    const walk = (node: unknown) => {
        if (typeof node === 'number' && Number.isFinite(node)) {
            found.add(String(node))
            // A length is often rendered as the width of an interval, so interval arithmetic is honoured.
            return
        }
        if (Array.isArray(node)) return node.forEach(walk)
        if (node && typeof node === 'object') {
            for (const [key, value] of Object.entries(node as Record<string, unknown>)) if (key !== 'requiredWithin') walk(value)
        }
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

/**
 * **Number words, read as numbers — two to twenty.** Added in stage S-C2, 14 October 2026, a TIGHTENING. This
 * check read digits only, so his own example wording (*"Divide 12 players into two teams of five"*) would have
 * reached a coach with two of its three numbers never checked against the game. The renderer writes digits; a
 * number word in a sentence is now read like a digit — declared, supported and bound, or refused.
 *
 * **KNOWN LIMIT: "one" is not read.** It is a determiner far more often than a count ("one team starts", "one end
 * of the area"), and a check that refused every such sentence would be refusing English. A count of one written as
 * a word is therefore unchecked; the renderer writes "1".
 */
const NUMBER_WORDS: Record<string, number> = {
    two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
    thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
}
const NUMBER_TOKEN = new RegExp(`\\b(\\d+(?:\\.\\d+)?|${Object.keys(NUMBER_WORDS).join('|')})\\b`, 'gi')

/** Every number in a sentence, as a number, in the order it is said — digits and the words two to twenty. */
const numbersIn = (text: string): number[] =>
    [...text.matchAll(NUMBER_TOKEN)].map(match => (match[1].toLowerCase() in NUMBER_WORDS ? NUMBER_WORDS[match[1].toLowerCase()] : Number(match[1])))

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
    for (const entry of fixture.status.bounds ?? []) {
        // A bound that crossed with no path names no line a sentence could cite, so it cannot be checked —
        // and that is said, because a range dropped here in silence is the loss this function exists to stop.
        if (typeof entry?.path !== 'string' && Array.isArray(entry?.bounds) && entry.bounds.some((b: any) => b && b.kind === 'COUNT' && !b.forbidden)) {
            unreadable.push(`the bounds of ${String(entry.lineId)} crossed the rendering boundary with no path, so their limits are not checked against the rendering`)
        }
        add(entry.path, entry.bounds)
    }
    for (const choice of fixture.status.choices ?? []) add(choice.path, choice.within?.bounds)

    const tighten = (limits: Limits[]): Limits | null => {
        const mins = limits.map(l => l.min).filter(stated)
        const maxes = limits.map(l => l.max).filter(stated)
        return mins.length || maxes.length ? { min: mins.length ? Math.max(...mins) : null, max: maxes.length ? Math.min(...maxes) : null } : null
    }
    /**
     * A preference expressed INSIDE the requirement — his rule of 1 October: it "must never override or widen" it.
     * And, since 14 October 2026, as the PRACTICAL values it holds, by the same rule realization establishes the
     * numbers with (`practical.ts`, applied here to the authored bounds, not read from realization): a preference
     * that barely fits is offered as its one practical value, and one that holds none is not offered at all.
     */
    const inside = (path: string, required: Limits | null, preference: Limits | null, kind: PracticalKind): Pick<LineRange, 'preferred' | 'notOffered'> => {
        if (!preference) return { preferred: null, notOffered: null }
        const offered = tighten(required ? [required, preference] : [preference])
        if (offered && stated(offered.min) && stated(offered.max) && offered.min > offered.max) {
            return {
                preferred: null,
                notOffered: `${path} carries an authored preferred range (${describe(preference)}) that lies wholly outside what is required here (${describe(required!)}), so it is not offered and the requirement stands`,
            }
        }
        const onGrain = offered ? practical(offered, kind) : null
        if (offered && !onGrain) {
            return {
                preferred: null,
                notOffered: `${path} carries an authored preferred range whose part inside the requirement (${describe(offered)}) holds no practical value, so it is not offered and the requirement stands`,
            }
        }
        return { preferred: onGrain, notOffered: null }
    }

    /**
     * **A preferred COUNT may be offered only where this session can field every count in it** — the review of
     * S-C1, 14 October 2026, a TIGHTENING. Christian that day: *"Where a preferred count cannot be fielded with
     * the available players, communicate the valid option rather than presenting an impossible alternative."*
     * Measured before it: *"Around 1 to 2 neutral players works well"* passed at 12 players, where 1 leaves no
     * whole equal teams, because a preference was held only to its authored range.
     *
     * Which counts can be fielded is read from the roster rule's own record on the choice (`within.configurations
     * .authorized`: the counts whose teams come out whole, inside the required bounds), never from anything the
     * renderer computed. Where any count of the preferred range is missing from it, the range may not be offered
     * at all: a PREFERENCE stating it is refused at Q2, and its absence is a NOTE that says why. A line whose
     * choice carries no such record is untouched.
     *
     * **Offered within what the session can field — stage S-C2, 14 October 2026.** The same ruling read the other
     * way round: *"communicate the valid option"*. Where the counts of the preferred range this session CAN field
     * form an unbroken run, that run is what may be offered — at 12 players the preferred 1 to 2 is offerable as 2,
     * and only as 2 — exactly as a preference is offered only as far as it lies inside the requirement. A
     * PREFERENCE stating a count outside the run is still refused at Q2 (1 at 12 players, as before), and the run
     * left unsaid is the §7 NOTE. Where no count of it can be fielded, or the fieldable counts are broken by a gap
     * (a run cannot say "2 and 4 but not 3"), nothing is offerable and the NOTE says why. The narrowing itself is
     * also reported, so the technical account shows the authored range beside what was offered.
     */
    const fieldable = (path: string, offer: Pick<LineRange, 'preferred' | 'notOffered'>): Pick<LineRange, 'preferred' | 'notOffered'> => {
        const authorized: unknown = (fixture.status.choices ?? []).find((c: any) => c.path === path)?.within?.configurations?.authorized
        const p = offer.preferred
        if (!Array.isArray(authorized) || !p || !stated(p.min) || !stated(p.max)) return offer
        const unfielded: number[] = []
        const fielded: number[] = []
        for (let n = Math.ceil(p.min); n <= p.max; n++) (authorized.includes(n) ? fielded : unfielded).push(n)
        if (!unfielded.length) return offer
        const unbroken = fielded.length > 0 && fielded[fielded.length - 1] - fielded[0] === fielded.length - 1
        const why = `${unfielded.join(', ')} leave${unfielded.length === 1 ? 's' : ''} no valid configuration; the roster fields ${authorized.join(', ') || 'none'}`
        if (unbroken) {
            const run = { min: fielded[0], max: fielded[fielded.length - 1] }
            return {
                preferred: run,
                notOffered: `${path} carries an authored preferred range (${describe(p)}) that this session can field only as ${describe(run)} (${why}), so only that is offerable`,
            }
        }
        return {
            preferred: null,
            notOffered: `${path} carries an authored preferred range (${describe(p)}) that this session cannot field whole (${why}), so it is not offered`,
        }
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
        // A position line's range is a length; anything else here is a count. Each is held to its practical grain.
        const kind: PracticalKind = lineAxis ? 'EXTENT_METRES' : 'COUNT'
        ranges.push({ path, required: required ? practicalRequirement(required, kind) : null, ...fieldable(path, inside(path, required, preference, kind)), starting: begun })
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
 * Game properties a coach must be told about. Absence from the rendering is a loss.
 *
 * Which properties need NO coach-facing expression is read from the shared table (`coach-facing-exclusions.ts`,
 * moved there in stage S-C2 so the renderer and this check read one list). Each exclusion names the paths that
 * carry its operational consequences, and the check below verifies an instruction cites each — his rule of
 * 1 October, whose second condition is the one that does the work.
 */
function loadBearingPaths(fixture: any): {
    coachFacing: string[]
    excluded: { path: string; because: string; ground: string; ruling: string; consequences: string[]; dischargedBy?: CoachFacingExclusion['dischargedBy'] }[]
} {
    const coachFacing: string[] = []
    const excluded: { path: string; because: string; ground: string; ruling: string; consequences: string[]; dischargedBy?: CoachFacingExclusion['dischargedBy'] }[] = []
    for (const entry of [...fixture.status.derived, ...fixture.status.choices]) {
        const rule = exclusionFor(entry.path, fixture)
        if (rule) excluded.push({ path: entry.path, because: rule.because, ground: rule.ground, ruling: rule.ruling, consequences: rule.consequences(entry.path), dischargedBy: rule.dischargedBy })
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
function supportedQuantity(fixture: any, instruction: Pick<Instruction, 'from'>, quantity: number, inGame: Set<string>): boolean {
    if (inGame.has(String(quantity))) return true
    for (const path of instruction.from) {
        const collection = path.split('.').reduce<any>((node, key) => (node == null ? node : node[key]), fixture.game)
        if (Array.isArray(collection) && collection.length === quantity) return true
    }
    /**
     * **The second narrow arithmetic justification: a value modifier's effective value** — added 14 October 2026
     * (Step 4, component 3). "Worth 3 instead of 1" under ADD 2 states a number the game holds nowhere, and it is
     * still not an invention: SD-30 fixes what the operation does to the base. So it is admitted, and ONLY where
     * the instruction cites all three things it is computed from — the operation, the magnitude and the base
     * value — and only by the same `effectiveValue` the renderer used. Under MULTIPLY 2 on a base of 1 the 2
     * was admitted before by coincidence (it is the magnitude); now it is admitted for the right reason too.
     */
    const base = instruction.from.includes('value.primaryEvent.value') ? fixture.game?.value?.primaryEvent?.value : undefined
    for (const modifier of fixture.game?.value?.valueModifiers ?? []) {
        const at = `value.valueModifiers[${modifier.elementId}]`
        if (!instruction.from.includes(`${at}.operation`) || !instruction.from.includes(`${at}.magnitude`) || base === undefined) continue
        if (effectiveValue(modifier.operation, base, modifier.magnitude) === quantity) return true
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

/**
 * **One checkable statement: a part of a consolidated sentence, or a whole sentence that has no parts.**
 *
 * Added in stage S-C2, 14 October 2026. His §7: *"feel free to propose consolidated, more natural language rather
 * than preserving unnecessary sentence-by-sentence technical structure."* A consolidated sentence says several
 * properties of several statuses at once — *"Divide 12 players into 2 teams of 5, with 2 neutral players"* is a
 * session total, an instantiated roster and a count the activity only starts at — so the status of each, and the
 * hedge and necessity rules that go with it, are held per PART, and every number is held to the property its part
 * BINDS it to, in the order it is said.
 */
interface Statement {
    text: string
    status: SourceStatus
    from: string[]
    quantities: number[]
    /** Each number the text says, in text order, with the path it states. Absent for a sentence built without parts. */
    bindings?: Binding[]
}

/**
 * The statements an instruction makes — and whether its parts really are the instruction.
 *
 * A consolidated instruction is checked part by part, so its parts must BE it: its text the parts' texts joined,
 * its citations their union, its numbers theirs in order, its status the one `combinedStatus` gives them. An
 * instruction whose parts and whole disagree (a sentence rewritten without its parts, say) is a Q1 VIOLATION —
 * the provenance offered for it does not describe what it says — and it is then checked WHOLE, as a sentence
 * without parts always was, so disagreeing can never make anything pass that would otherwise be refused.
 */
function statementsOf(instruction: Instruction): { statements: Statement[]; inconsistency: string | null } {
    const whole: Statement = { text: instruction.text, status: instruction.status, from: instruction.from, quantities: instruction.quantities }
    const parts = instruction.parts
    if (!Array.isArray(parts) || !parts.length) return { statements: [whole], inconsistency: null }
    const union = [...new Set(parts.flatMap(p => p.from))]
    const problems = [
        parts.map(p => p.text).join('') !== instruction.text ? 'its text is not its parts joined' : null,
        JSON.stringify(parts.flatMap(p => p.quantities)) !== JSON.stringify(instruction.quantities) ? 'its numbers are not its parts’ numbers' : null,
        union.length !== new Set(instruction.from).size || union.some(p => !instruction.from.includes(p)) ? 'its citations are not its parts’ citations' : null,
        combinedStatus(parts.map(p => p.status)) !== instruction.status ? 'its status is not the one its parts give it' : null,
    ].filter((p): p is string => !!p)
    if (problems.length) return { statements: [whole], inconsistency: problems.join('; ') }
    // A part is held to its bindings always: one that arrives without a bindings list binds nothing, so any number it
    // says is refused (review of S-C2, 14 October 2026 — it fell back to the set-of-numbers check, which cannot see a swap).
    return { statements: parts.map(p => ({ text: p.text, status: p.status, from: p.from, quantities: p.quantities, bindings: Array.isArray(p.bindings) ? p.bindings : [] })), inconsistency: null }
}

export function checkFidelity(fixture: any, rendered: RenderedActivity): FidelityReport {
    const findings: FidelityFinding[] = []
    const cited = new Set(rendered.instructions.flatMap(i => i.from))
    const inGame = quantitiesInGame(fixture)
    const { ranges, unreadable } = lineRanges(fixture)
    const rangeAt = new Map(ranges.map(range => [range.path, range]))
    /**
     * **An authored limit is a number of the game even where no value equals it** — a required minimum
     * scaled to the axis, the floor of a count — and without that the ACCURATE statement of a range was
     * refused. **But it is a number of ITS LINE, for a sentence that cites that line.** The limits were
     * first added to the set every sentence is tested against, which made each of them supported
     * everywhere: the same *"any number that happens to appear elsewhere in the game"* this change set out
     * to stop, with more numbers in it. Narrowed in the review of 13 October.
     */
    const limitOfCitedLine = (instruction: Pick<Instruction, 'from'>, quantity: number): boolean =>
        instruction.from.some(path => {
            const range = rangeAt.get(path)
            return !!range && [range.required?.min, range.required?.max, range.preferred?.min, range.preferred?.max].some(limit => stated(limit) && limit === quantity)
        })

    // ── Q1 — every part of a consolidated sentence is the sentence ──────────────────────────────
    const statementsByInstruction = new Map<Instruction, Statement[]>()
    for (const instruction of rendered.instructions) {
        const { statements, inconsistency } = statementsOf(instruction)
        statementsByInstruction.set(instruction, statements)
        if (inconsistency) findings.push({ question: 1, severity: 'VIOLATION', what: `"${instruction.text}" does not match the parts it gives as its provenance: ${inconsistency}` })
    }
    const statements: Statement[] = rendered.instructions.flatMap(i => statementsByInstruction.get(i)!)

    // ── Q2 — nothing unsupported ────────────────────────────────────────────────────────────────
    for (const statement of statements) {
        if (!statement.from.length) {
            findings.push({ question: 2, severity: 'VIOLATION', what: `"${statement.text}" cites no concrete-game property` })
        }
        for (const quantity of statement.quantities) {
            if (!supportedQuantity(fixture, statement, quantity, inGame) && !limitOfCitedLine(statement, quantity)) {
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: `"${statement.text}" states ${quantity}, which appears nowhere in the concrete game`,
                })
            }
        }
        // A number in the prose that the instruction did not declare is unchecked, which is as bad as
        // an invented one: it means a quantity reached a coach without passing this test. Number words two to
        // twenty count since stage S-C2 (14 October 2026).
        for (const n of numbersIn(statement.text)) {
            if (!statement.quantities.includes(n)) {
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: `"${statement.text}" contains the number ${n} without declaring it, so it was never checked against the game`,
                })
            }
        }
    }

    /**
     * **Q2, by binding: each number is the number of the property it is bound to, in the order it is said.** Added
     * in stage S-C2, 14 October 2026, a TIGHTENING, and it RETIRES a known limit pinned since 13 October: the range
     * check held a sentence to the SET of numbers its cited lines carry and never knew which number played which
     * part, so *"7.5 m long and between 4.5 m and 40 m wide"* passed for a 40 m channel 4.5 m to 7.5 m wide.
     * Consolidation would have widened that hole — one sentence citing a total, a roster and a count could swap any
     * two of them — so every part names, for each number it says, the path it states.
     *
     * A binding holds where its path is cited by the part and the number is: a value the game holds AT that path (a
     * collection's size included); a required limit of that path's line, where the binding says it is said AS a
     * limit (`REQUIRED_LIMIT`, since the review of S-C2 — and then only that); the value the line STARTS at, said by a
     * STARTING part only; a preferred limit as it may be offered, said by a PREFERENCE part only (and nothing else
     * is, for a preference); or a value modifier's effective value, bound to its operation, where the part cites the
     * operation, the magnitude and the base (SD-30, the same narrow arithmetic as above). The numbers the text says
     * must be the bound numbers, one for one, in order.
     */
    for (const statement of statements) {
        if (!statement.bindings) continue
        const said = numbersIn(statement.text)
        const bound = statement.bindings.map(b => b.quantity)
        if (JSON.stringify(said) !== JSON.stringify(bound)) {
            findings.push({ question: 2, severity: 'VIOLATION', what: `"${statement.text}" says ${JSON.stringify(said)} where its bindings give ${JSON.stringify(bound)}, in that order` })
        }
        for (const { quantity, path, as } of statement.bindings) {
            if (!statement.from.includes(path)) {
                findings.push({ question: 2, severity: 'VIOLATION', what: `"${statement.text}" binds ${quantity} to ${path}, which it does not cite` })
                continue
            }
            const range = rangeAt.get(path)
            const begun = range?.starting
            const asStarting = statement.status === 'STARTING'
            const requiredLimit = [range?.required?.min, range?.required?.max].some(limit => stated(limit) && limit === quantity)
            /**
             * **A limit is said as a limit, a value as a value** — review of stage S-C2, 14 October 2026, a
             * TIGHTENING. A required limit was admitted for ANY binding, so a part could state the floor as the value:
             * *"Divide 12 players into 2 teams of 5, with 1 neutral player"* passed this check where the game holds 2
             * neutral players and 1 is only the least it may hold — the same "which number is which" hole this check
             * was built to close, one level down. A binding marked `REQUIRED_LIMIT` is admitted only as a required
             * limit; an unmarked one only as a value the property holds (or starts at, or its effective value).
             */
            const admitted =
                statement.status === 'PREFERENCE'
                    ? [range?.preferred?.min, range?.preferred?.max].some(limit => stated(limit) && limit === quantity)
                    : as === 'REQUIRED_LIMIT'
                      ? requiredLimit
                      : heldAt(fixture, path).some(n => n === quantity && (asStarting || !stated(begun) || n !== begun || [range?.required?.min, range?.required?.max].includes(n))) ||
                      (asStarting && stated(begun) && begun === quantity) ||
                      (fixture.game?.value?.valueModifiers ?? []).some((modifier: any) => {
                          const at = `value.valueModifiers[${modifier.elementId}]`
                          return (
                              path === `${at}.operation` &&
                              statement.from.includes(`${at}.magnitude`) &&
                              statement.from.includes('value.primaryEvent.value') &&
                              effectiveValue(modifier.operation, fixture.game?.value?.primaryEvent?.value, modifier.magnitude) === quantity
                          )
                      })
            if (!admitted) {
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: `"${statement.text}" binds ${quantity} to ${path}, and that is not a number of that property as a ${statement.status} statement may say it`,
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
     *
     * **The value an activity STARTS at is a choice, and only a choice's sentence may state it — tightened
     * in the review of 13 October.** Where realization closed a line to a starting value, the game holds
     * that value at the line's path, so "a number the game holds at a path it cites" admitted it into ANY
     * firm sentence citing the line. Measured on the neutral-players demonstration: *"The game needs
     * between 1 and 2 neutral players"* passed — the preferred maximum stated as a requirement, admitted
     * because 2 is also where this activity starts. The starting value is the activity's, not the game's,
     * so a sentence of any other status may state it only where it is also a required limit.
     *
     * Held per STATEMENT since stage S-C2 (14 October 2026): a part of a consolidated sentence answers for its own
     * numbers under its own status, so a starting count said beside a roster stays a starting count.
     */
    for (const instruction of statements) {
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
        // Where an activity STARTS is a choice's sentence (REALIZATION_CHOICE until 14 October 2026).
        const asChoice = instruction.status === 'STARTING'
        const allowed = new Set<number>(
            instruction.from.flatMap(path => {
                const begun = rangeAt.get(path)?.starting
                return heldAt(fixture, path).filter(n => asChoice || !stated(begun) || n !== begun)
            }),
        )
        for (const range of about) {
            for (const limit of [range.required?.min, range.required?.max, asChoice ? range.starting : null]) if (stated(limit)) allowed.add(limit)
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
     *
     * **One number said once is one statement — closed in the review of 13 October.** Where the value an
     * activity starts at EQUALS a required limit of its line, the two sentences carried each other: measured
     * on the neutral-players demonstration with thirteen players, the count starts at 1 and the requirement
     * is *"at least 1"*, so deleting *"For this activity, 1 of the 13 players is a neutral player …"* passed
     * (the requirement's sentence states 1) and so did deleting *"The game needs at least 1 neutral player"*
     * (the starting value's sentence states 1). Either way a coach lost something — how many to pick, or
     * that fewer is not this game — and nothing was reported. With twelve players, where the two numbers
     * differ, each deletion was caught.
     *
     * So each is held to the sentence of its own status. The starting value is a value realization chose, so
     * it must be said by a STARTING sentence citing the line (REALIZATION_CHOICE until 14 October 2026), which
     * is the only wording that status has. A required limit may be said by any firm sentence citing the line —
     * the channel's limits sit in its marking sentence — EXCEPT that a choice sentence's number is not taken as
     * the limit it happens to equal: that number is the starting value, already accounted for.
     *
     * **A preference left out is a NOTE, unless it is essential — 14 October 2026, his ruling, not a
     * convenience.** Christian, §7: *"Preferred ranges should be available as guidance, but their omission
     * shouldn't automatically invalidate an otherwise valid activity unless the information is essential."*
     * ESSENTIAL here (the recommended definition, awaiting his confirmation): the preference is the only authored
     * guidance for a value the game leaves to the coach — the line carries no required limit, the activity
     * starts it at no value, and the game holds no number at its path. Then a coach would have nothing to go on,
     * and leaving it out is still a VIOLATION. Every other omission is reported as a NOTE with the same words.
     * Nothing else moves: a WRONG preference is still refused at Q2, a missing required limit or starting value
     * here, and an uncarried property below.
     */
    // Per statement since stage S-C2: the part of a consolidated sentence that says a value is the one held to it.
    for (const range of ranges) {
        const citing = statements.filter(i => i.from.includes(range.path))
        if (!citing.length) continue
        const firm = citing.filter(i => i.status !== 'PREFERENCE')
        const says = (instructions: Statement[], n: number) => instructions.some(i => numbersIn(i.text).includes(n))
        const chosen = firm.filter(i => i.status === 'STARTING')
        for (const [end, limit] of [['minimum', range.required?.min], ['maximum', range.required?.max]] as const) {
            if (!stated(limit)) continue
            const asLimit = stated(range.starting) && limit === range.starting ? firm.filter(i => !chosen.includes(i)) : firm
            if (says(asLimit, limit)) continue
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
                const essential = !range.required && !stated(range.starting) && !heldAt(fixture, range.path).length
                findings.push({
                    question: 3,
                    severity: essential ? 'VIOLATION' : 'NOTE',
                    what:
                        `${range.path} carries an authored preferred range that may be offered here (${describe(range.preferred)}), and no instruction offers it` +
                        (essential ? ' — and it is the only authored guidance for a value the game leaves to the coach, so it is essential' : ''),
                })
            }
        }
        if (range.notOffered) findings.push({ question: 3, severity: 'NOTE', what: range.notOffered })
        if (stated(range.starting) && !says(chosen, range.starting)) {
            findings.push({
                question: 3,
                severity: 'VIOLATION',
                what: `${range.path} starts at ${range.starting} in this activity, inside an authored range, and no instruction that cites it states that value as the choice it is`,
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
        // Where the entry names the kind of instruction that carries its consequence (a marking instruction, for the
        // perceptual-reference exclusion — review of S-C2), only that kind discharges it.
        const carriedBy = entry.dischargedBy ? new Set(rendered.instructions.filter(i => entry.dischargedBy!(i)).flatMap(i => i.from)) : cited
        const undischarged = entry.consequences.filter(path => !carriedBy.has(path))
        if (undischarged.length) {
            findings.push({
                question: 3,
                severity: 'VIOLATION',
                what:
                    `${entry.path} was excluded as ${entry.ground === 'NO_COACH_ACTION' ? 'conveying no action a coach needs to take' : 'accounting metadata'}, but its operational consequence(s) ` +
                    `${undischarged.join(', ')} reached no instruction — so the exclusion is not permitted`,
            })
            continue
        }
        // The ground and the ruling that admits it travel with every NOTE (stage S-C2): an exclusion is auditable
        // only if a reader can see on whose words it stands.
        findings.push({
            question: 3,
            severity: 'NOTE',
            what:
                `${entry.path} is established and deliberately given no coach-facing expression — ${entry.because}. ` +
                (entry.consequences.length
                    ? `Its operational consequence(s) are carried by ${entry.consequences.join(', ')}.`
                    : 'It has no operational consequence to carry.') +
                ` Ground: ${entry.ground}. ${entry.ruling}`,
        })
    }
    // An instantiated member is load-bearing too: a coach cannot field a team the rendering omits.
    if (fixture.status.instantiations.length && !cited.has('performers.teams')) {
        findings.push({ question: 3, severity: 'VIOLATION', what: 'teams were instantiated and the rendering does not mention them' })
    }

    // ── Q4 — no status changed by wording ───────────────────────────────────────────────────────
    /**
     * **A preference or a recommendation is never one part of a firm sentence** — stage S-C2, 14 October 2026. A
     * consolidated sentence keeps a status per part, and the hedge that marks a preference would read across the
     * whole sentence: *"Divide 12 players into 2 teams of 5, which works well"* would soften a roster the game
     * requires. So a PREFERENCE or ADVISORY part shares its sentence with nothing of another status.
     */
    for (const instruction of rendered.instructions) {
        const own = statementsByInstruction.get(instruction)!
        const soft = own.filter(s => s.status === 'PREFERENCE' || s.status === 'ADVISORY')
        if (soft.length && new Set(own.map(s => s.status)).size > 1) {
            findings.push({ question: 4, severity: 'VIOLATION', what: `"${instruction.text}" puts a ${soft[0].status} part in one sentence with parts of another status` })
        }
    }
    // Every rule below is held per STATEMENT since stage S-C2: each part of a consolidated sentence against its own status.
    for (const instruction of statements) {
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
        /**
         * **The three statuses of 14 October 2026, each held to its wording.** His §3: a default is a starting
         * configuration, described *"without implying that it cannot be adjusted"*; and *"Preserve whether each
         * condition is required, preferred, advisory, or left to the coach, all the way through rendering and
         * validation."*
         *
         *   - STARTING (where this activity starts) and COACH_CHOICE (left to the coach) may carry no word of
         *     necessity — the rule REALIZATION_CHOICE was held to, now that the "For this activity" prefix that
         *     also marked it is gone;
         *   - a COACH_CHOICE must put the choice to the coach (pick, choose, decide), or it states a fact the game
         *     does not hold;
         *   - an ADVISORY sentence must carry a hedge and no imperative: a recommendation, never a rule.
         */
        if ((instruction.status === 'STARTING' || instruction.status === 'COACH_CHOICE') && NECESSITY.some(r => r.test(instruction.text))) {
            findings.push({
                question: 4,
                severity: 'VIOLATION',
                what: `a ${instruction.status === 'STARTING' ? 'starting value' : "coach's choice"} is worded as though the knowledge demanded it: "${instruction.text}"`,
            })
        }
        /**
         * **A starting value is stated, not hedged** — the review of S-C1, 14 October 2026, a TIGHTENING. Sentences
         * that were DERIVED until that day (the possession game's "play continues", a preferred default) became
         * STARTING, and DERIVED was the status that refused a hedge; nothing replaced the rule, so "Play may continue
         * when possession changes" would have passed. The activity starts at exactly the value the game holds —
         * his §3, *"a clear description of the starting configuration"* — and that it can be adjusted is said in
         * "Adjusting the activity" (below), not by blurring the value itself.
         */
        if (instruction.status === 'STARTING' && hedged) {
            findings.push({ question: 4, severity: 'VIOLATION', what: `a starting value is worded as optional or approximate: "${instruction.text}"` })
        }
        if (instruction.status === 'COACH_CHOICE' && !CHOICE_WORDS.some(r => r.test(instruction.text))) {
            findings.push({ question: 4, severity: 'VIOLATION', what: `a value left to the coach is not put to the coach as a choice: "${instruction.text}"` })
        }
        if (instruction.status === 'ADVISORY') {
            if (IMPERATIVES.some(r => r.test(instruction.text))) {
                findings.push({ question: 4, severity: 'VIOLATION', what: `an ADVISORY recommendation is worded as compulsory: "${instruction.text}"` })
            }
            if (!hedged) {
                findings.push({ question: 4, severity: 'VIOLATION', what: `an ADVISORY recommendation carries no hedge, so it reads as a rule: "${instruction.text}"` })
            }
        }
    }
    /**
     * **A value the activity only STARTS at is shown as adjustable** — the review of S-C1, 14 October 2026, a
     * TIGHTENING. His §3: *"the coach should receive a clear description of the starting configuration, without
     * implying that it cannot be adjusted"*; his §7: *"Alternative ranges, adjustments, and supporting explanations
     * can be presented separately."* The "For this activity" prefix that used to mark such a value is gone, and a
     * coach reads text, not statuses; what keeps the value from reading as fixed is that the part a coach adjusts
     * within names it. So every line realization closed to a starting value inside a range must be cited by an
     * instruction in "Adjusting the activity". Held today by the neutral count's required floor, which the renderer
     * says there. (Values that start where an authored default or an alternative puts them, with no range around
     * them, have no adjusting sentence yet: that wording waits on his review of the consolidated language.)
     */
    for (const choice of fixture.status.choices ?? []) {
        if (choice?.closure !== 'STARTING_VALUE_IN_RANGE' || typeof choice.path !== 'string' || !cited.has(choice.path)) continue
        if (!rendered.instructions.some(i => i.section === ADJUSTING && i.from.includes(choice.path))) {
            findings.push({ question: 4, severity: 'VIOLATION', what: `${choice.path} is only where this activity starts, and nothing in "Adjusting the activity" names it, so it reads as fixed` })
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
