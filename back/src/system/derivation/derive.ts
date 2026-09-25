/**
 * Derivation engine — stage 5, Derive (package §2.2, §4, §5; SD-39).
 *
 * What this stage may conclude, and nothing more:
 *   - which items **entail** a line's value, and which only **bound** it;
 *   - whether a line is **open** — a degree of freedom SD-39 authorizes — with its bounds and authority;
 *   - which citable standing decisions supply a value, by a monotone closure.
 *
 * It derives no verdicts: classification is stage 6. It never chooses an open value: "OPEN is an
 * explicitly authorized degree of freedom within an already-supported property, not a synonym for
 * unknown", and no code path here writes `value` onto an open line.
 */

import { RegisterIndex } from './register'
import { reaches, Reach } from './reach'
import { parseSelector } from './selector'
import { ApplicationSet, DeclarationReach } from './scope'
import { Bounds, ElementClass, ItemRef, LoadedContract, ResolutionLine, SupportRef } from './types'

export interface DerivedLine {
    lineId: string
    /** Items that entail the value, with what each requires. */
    entailing: { item: ItemRef; value: unknown; support: SupportRef }[]
    /** Items that bound without entailing: assumed items, narrowing ranges, preferred defaults. */
    bounding: { item: ItemRef; bound: Bounds; support: SupportRef }[]
    /** Items whose reach could not be decided — recorded, never used (see engine.ts, SD-48). */
    undetermined: ItemRef[]
    /** Set when SD-39's conditions hold: the line may vary, and no value is written. */
    open: { authority: string; choiceSpace: string } | null
    standingDecisions: string[]
    /**
     * The value a citable standing decision states for this row, carried **verbatim** from the register.
     * §1.4 requires a value wherever a line is derived, and `STANDING_DECISION` is one of the three
     * routes by which it is; without this a line could be RESOLVED and hold nothing.
     *
     * Some entries state a value as a description rather than a literal — SD-11's "the longer envelope
     * dimension". It is not evaluated here: nothing establishes how such a description becomes a value,
     * so it is carried as authored and a consumer that needs a number refuses it (§1.9).
     */
    standingValue: { id: string; value: unknown } | null
    /** Contributions that narrow the line to a set of permitted alternatives (SD-78). */
    narrowing: { item: ItemRef; members: unknown[]; support: SupportRef }[]
    /**
     * SD-78's composition, computed once the narrowings are collected: the **jointly permitted** value
     * set, the intersection of every narrowing that applies. The engine chooses nothing here and
     * establishes no precedence between contributions — it determines what they permit together.
     */
    narrowedTo: { members: unknown[]; items: ItemRef[] } | null
    /** A value the session supplies, on a row the register sources from the session (§1.2, §1.4). */
    session: { row: string; value: unknown } | null
}

/**
 * §1.2 calls the envelope "the `SESSION` source", and §1.4 makes `SESSION` one of the three values of
 * `resolvedBy` — so a session row the envelope supplies is **derived**, not unauthored. The register
 * says which rows the session sources; this table says which envelope field carries each, because the
 * register holds a path and the input holds a field name.
 *
 * A session row absent from this table is never guessed: the engine stops and reports it (SD-48). The
 * first implementation consulted the envelope only to decide openness and silently dropped all four
 * supplied values, which is this project's costliest recurring failure in a new place.
 */
const SESSION_FIELD_BY_PATH: Record<string, string> = {
    'envelope.players': 'players',
    'envelope.area.length_m': 'lengthM',
    'envelope.area.width_m': 'widthM',
    'envelope.duration_min': 'durationMin',
}

/** Stage 5 — the session's contribution. It resolves a line; it never bounds or narrows one. */
function applySession(
    lines: ResolutionLine[],
    derived: Map<string, DerivedLine>,
    index: RegisterIndex,
    envelope: { [k: string]: unknown },
    stopped: { where: string; why: string }[],
): void {
    for (const line of lines) {
        if (line.elementId) continue // the session sources game-level rows only
        const row = index.rows.get(line.row)
        if (!row || !(row.sourceKinds || []).includes('SESSION')) continue

        const field = SESSION_FIELD_BY_PATH[row.path]
        if (!field) {
            stopped.push({
                where: `stage 5, row ${line.row}`,
                why:
                    `the register sources row ${line.row} (${row.path}) from the SESSION, and no envelope field is established for it. ` +
                    'The value is not guessed, and the line is left for stage 6 to classify.',
            })
            continue
        }

        const value = envelope ? envelope[field] : undefined
        if (value === undefined || value === null) continue // the session supplied nothing: a gap, not a guess

        const record = derived.get(line.lineId)!
        record.session = { row: line.row, value }

        // The session and an item that entails the same line are two sources for one value. §6's
        // collision rule is written for two items, so a disagreement here is reported and nothing is
        // derived from it, rather than a collision being minted for a case the package does not cover.
        const disagreeing = record.entailing.filter(e => JSON.stringify(e.value) !== JSON.stringify(value))
        if (disagreeing.length) {
            stopped.push({
                where: `stage 5, row ${line.row}`,
                why:
                    `the session supplies ${JSON.stringify(value)} for this row and ${disagreeing.length} authored item(s) entail a different value. ` +
                    '§6 defines collision between two items; nothing establishes how a session value and an authored value are reconciled, so neither is preferred here.',
            })
        }
    }
}

/**
 * **SD-83 — the establishment boundary.** His ruling of 25 September:
 *
 *   "Only support-capable, authoritative contributions may establish an element class. EXCLUSION,
 *    ASSUMED, ENGINE_ONLY, and OUTSIDE_BOUNDARY contributions do not establish existence."
 *
 * An assumed contribution *"may constrain something whose existence is independently established, but
 * it may not establish the element itself"*.
 *
 * This is the single definition. Class formation used to decide it separately and decided it
 * differently, which is how 19 of 53 element classes came to be manufactured from contributions that
 * support nothing — including two exclusions that were satisfied by creating the very thing they forbid.
 */
export function establishesExistence(item: any): boolean {
    if (!isSupportCapable(item)) return false // ENGINE_ONLY, TYPICAL_EXAMPLE, OUTSIDE_BOUNDARY
    if (item.strictness === 'EXCLUSION') return false // §3: never supports; checked only as an exclusion
    if (item.basis === 'ASSUMED') return false // §3: a bound only; SD-83: never establishes an element
    return EXISTENCE_REQUIREMENTS.has(String(item.requirement))
}

export const EXISTENCE_REQUIREMENTS = new Set(['EXISTS', 'COUNT', 'RANGE'])

/** §3 — what may support: an item that entails, a citable standing decision, or the session. */
function isSupportCapable(item: any): boolean {
    if (item.basis === 'ENGINE_ONLY') return false // SD-21: engine wording supports nothing
    if (item.valueStatus === 'TYPICAL_EXAMPLE') return false // inert
    if (item.checkability === 'OUTSIDE_BOUNDARY') return false
    return true
}

/**
 * SD-78 — a contribution that states a **set of permitted alternatives** narrows the line; it does not
 * fix it. "A set of permitted alternatives is not itself the resolved value of a single-valued property."
 *
 * This is the distinction the value model and §5.8 already draw — *"SELECTION narrows to a valid set …
 * where that leaves a choice the kind is FREE under SD-39 and is chosen downstream"* — and reading it as
 * a fixed assertion is what made three converging narrowings look like a collision.
 *
 * The trigger is narrow on purpose: `REQUIRED_RANGE` **and** an array value. A `REQUIRED_RANGE` carrying
 * a scalar still fixes what it states.
 */
function narrowsToSet(item: any): boolean {
    if (!isSupportCapable(item)) return false
    if (item.basis === 'ASSUMED') return false
    if (item.strictness === 'EXCLUSION') return false
    return item.valueStatus === 'REQUIRED_RANGE' && Array.isArray(item.value)
}

/** An item entails only when it fixes the value: an assumed item bounds but never entails (§3). */
function entails(item: any): boolean {
    if (!isSupportCapable(item)) return false
    if (item.basis === 'ASSUMED') return false
    if (item.strictness === 'EXCLUSION') return false
    if (narrowsToSet(item)) return false // it narrows instead (SD-78)
    return item.requirement === 'EQUALS' || item.requirement === 'POSITIONED' || item.requirement === 'ORIENTED'
}

/**
 * §1.9's bound kinds. A `RANGE` or `COUNT` whose value states no number is a **qualitative** bound
 * carrying the authored term — not a numeric bound with nothing in it. SD-15 forbids inventing a number
 * here, and a `COUNT` with null endpoints bounds nothing while still looking numeric to a consumer,
 * which is how "beyond the first defenders" came to be silently ignored by a feasibility check.
 */
function boundsOf(item: any): Bounds {
    if (item.requirement !== 'RANGE' && item.requirement !== 'COUNT') return { kind: 'SET', members: [item.value] as any }

    if (typeof item.value === 'number') return { kind: 'COUNT', min: item.value, max: item.requirement === 'COUNT' ? item.value : null }

    const text = String(item.value ?? '').trim()
    const explicitMin = text.match(/min(?:imum)?\s*:?\s*(\d+)/i)
    const explicitMax = text.match(/max(?:imum)?\s*:?\s*(\d+)/i)
    const bare = /^(\d+)\s*$/.exec(text)
    if (explicitMin || explicitMax || bare) {
        return {
            kind: 'COUNT',
            min: explicitMin ? Number(explicitMin[1]) : bare ? Number(bare[1]) : null,
            max: explicitMax ? Number(explicitMax[1]) : bare && item.requirement === 'COUNT' ? Number(bare[1]) : null,
        }
    }
    return { kind: 'QUALITATIVE', term: text }
}

/**
 * SD-39, in order: a line may be open only if its existence is supported, its choice space is
 * supported, selected knowledge neither determines nor further constrains it, and no standing rule
 * determines it. Fail any and it is not open — it is a gap, which stage 6 classifies.
 *
 * AM-04 as he ruled it: "Unexamined silence cannot license a free choice." An `UNDECLARED` declaration
 * reaching the row bars openness.
 */
function mayBeOpen(
    line: ResolutionLine,
    index: RegisterIndex,
    record: DerivedLine,
    declarations: DeclarationReach[],
    envelope: { [k: string]: unknown },
    stopped: { where: string; why: string }[],
): { authority: string; choiceSpace: string } | null {
    const row = line.row
    const choiceSpace = index.fillable.get(row)
    if (!choiceSpace) return null
    if (record.session) return null // the session resolved it; a resolved line is not a free one
    if (record.entailing.length > 0) return null
    if (record.standingDecisions.length > 0) return null
    if (declarations.some(d => d.row === row && d.declaration === 'UNDECLARED')) return null // AM-04

    // SD-39: "OPEN is not produced by absence of knowledge. The property's existence and legitimate
    // choice space must already be supported."
    //
    // A class line's existence is supported by the existence item that formed the class. A game-level
    // line has no such item, so its existence must be supported by something that addresses it: the
    // session, a citable standing decision, or a support-capable item. Absent all three, the line is
    // not open — it is a gap, which stage 6 classifies.
    if (!line.elementId) {
        const fromSession = (index.rows.get(row)?.sourceKinds || []).includes('SESSION') && envelope && Object.keys(envelope).length > 0
        const addressed = record.bounding.length > 0 || record.undetermined.length > 0
        if (!fromSession && !addressed) return null
    }

    // The register expresses some choice spaces as bounded by authored values — "a count inside an
    // authored COUNT/RANGE", "metres and position inside authored bounds". With nothing authored, the
    // space itself is unsupported.
    //
    // SD-50, his ruling of 23 September: "If a required property must be resolved, its existence is
    // supported, but the legitimate choice space/bounds required to make it OPEN are unsupported,
    // report a GAP. OPEN requires both: supported existence + supported legitimate choice space.
    // Silence supplies neither." So the line is not open, and stage 6 classifies it NOT_AUTHORED, which
    // raises the GAP. It is not a refusal.
    if (/authored/i.test(choiceSpace) && record.bounding.length === 0) return null

    return { authority: 'SD-39', choiceSpace }
}

/**
 * How a derived line came by its value. `COMPOSITION` is a form of entailment — several contributions
 * entailing jointly — so it reports as `ENTAILMENT` in §1.4's closed `resolvedBy` list, which is
 * unchanged. The distinction is kept here because the support differs: a composition is supported by
 * *every* contributing narrowing (SD-78).
 */
export type ResolutionRoute = 'SESSION' | 'ENTAILMENT' | 'COMPOSITION' | 'STANDING_DECISION'

export interface Resolved {
    route: ResolutionRoute
    value: unknown
    support: SupportRef[]
}

/**
 * **The single answer to "does this line have a value, and from where".**
 *
 * Four places used to decide this independently — the verdict, the emitted value, the emitted support,
 * and the gate's own "no resolved line may be valueless" invariant. When SD-78 added a fourth route,
 * three were updated and the invariant was not, so the gate reported `game::V1` valueless while the
 * emitted result carried `line_crossed` correctly. The value was never lost; the two views had drifted.
 *
 * Every consumer now asks this function, so a future route cannot desynchronise them.
 */
export function resolvedValue(record: DerivedLine | undefined): Resolved | null {
    if (!record) return null
    if (record.session) return { route: 'SESSION', value: record.session.value, support: [{ kind: 'SESSION', row: record.session.row }] }
    if (record.entailing.length) return { route: 'ENTAILMENT', value: record.entailing[0].value, support: record.entailing.map(e => e.support) }
    if (record.narrowedTo) {
        // A composition resolves only where exactly one member survives. More than one is a genuine
        // downstream choice and less than one is a collision — neither carries a value (SD-78, SD-80).
        if (record.narrowedTo.members.length !== 1) return null
        return { route: 'COMPOSITION', value: record.narrowedTo.members[0], support: record.narrowing.map(n => n.support) }
    }
    if (record.standingValue) return { route: 'STANDING_DECISION', value: record.standingValue.value, support: [{ kind: 'STANDING_DECISION', id: record.standingValue.id }] }
    return null
}

export interface DeriveOutcome {
    lines: Map<string, DerivedLine>
    undeterminedReaches: { item: ItemRef; classId: string }[]
    stopped: { where: string; why: string }[]
}

export function deriveLines(
    contracts: LoadedContract[],
    classes: ElementClass[],
    lines: ResolutionLine[],
    applicationSets: ApplicationSet[],
    declarations: DeclarationReach[],
    index: RegisterIndex,
    envelope: any = {},
): DeriveOutcome {
    const byClass = new Map(classes.map(c => [c.classId, c]))
    const itemsById = new Map<string, any>()
    for (const contract of contracts) {
        for (const item of contract.items || []) itemsById.set(`${contract.contractId}:${item.itemId}`, { ...item, contractId: contract.contractId })
    }
    const applicationByItem = new Map(applicationSets.map(a => [`${a.item.contractId}:${a.item.itemId}`, a]))

    const derived = new Map<string, DerivedLine>()
    const stopped: { where: string; why: string }[] = []
    const undeterminedReaches: { item: ItemRef; classId: string }[] = []

    for (const line of lines) {
        derived.set(line.lineId, {
            lineId: line.lineId,
            entailing: [],
            bounding: [],
            undetermined: [],
            open: null,
            standingDecisions: [],
            standingValue: null,
            narrowing: [],
            narrowedTo: null,
            session: null,
        })
    }

    for (const [key, item] of itemsById) {
        const application = applicationByItem.get(key)
        if (!application) continue
        const ref: ItemRef = { contractId: item.contractId, itemId: item.itemId }

        for (const line of lines) {
            if (line.row !== String(item.row)) continue
            const record = derived.get(line.lineId)!

            let reach: Reach = 'TRUE'
            if (line.elementId) {
                if (!application.classIds.includes(line.elementId)) continue
                const cls = byClass.get(line.elementId)
                if (!cls) continue
                const parsed = parseSelector(item.selector, String(item.row), index)
                if (!parsed.predicate) continue
                reach = reaches(parsed.predicate, cls)
            }

            if (reach === 'FALSE') continue
            if (reach === 'UNDETERMINED') {
                record.undetermined.push(ref)
                undeterminedReaches.push({ item: ref, classId: String(line.elementId) })
                continue
            }

            if (narrowsToSet(item)) {
                record.narrowing.push({
                    item: ref,
                    members: (item.value as unknown[]).slice(),
                    support: { kind: 'CONTRACT_ITEM', contractId: ref.contractId, itemId: ref.itemId, relation: 'NARROWS' },
                })
            } else if (entails(item)) {
                record.entailing.push({
                    item: ref,
                    value: item.value,
                    support: { kind: 'CONTRACT_ITEM', contractId: ref.contractId, itemId: ref.itemId, relation: 'ENTAILS' },
                })
            } else if (isSupportCapable(item)) {
                record.bounding.push({
                    item: ref,
                    bound: boundsOf(item),
                    support: { kind: 'CONTRACT_ITEM', contractId: ref.contractId, itemId: ref.itemId, relation: 'NARROWS' },
                })
            }
        }
    }

    // SD-78 — compose the narrowings. Restricted to exactly this: intersecting sets the contracts
    // already state. No ordering is consulted (RC-29 stays unresolved), no contribution outranks
    // another, and membership is compared only by exact equality of the authored member.
    for (const line of lines) {
        const record = derived.get(line.lineId)!
        if (!record.narrowing.length) continue
        record.narrowing.sort((a, b) => `${a.item.contractId}:${a.item.itemId}`.localeCompare(`${b.item.contractId}:${b.item.itemId}`))
        const members = record.narrowing
            .map(n => n.members.map(m => JSON.stringify(m)))
            .reduce((a, b) => a.filter(m => b.includes(m)))
        record.narrowedTo = {
            members: members.map(m => JSON.parse(m)),
            items: record.narrowing.map(n => n.item),
        }
    }

    applySession(lines, derived, index, envelope || {}, stopped)

    // Restricted computation 3 — the monotone closure over citable standing decisions. It may only add
    // support that the decision already carries, so it terminates and its order cannot matter.
    let changed = true
    let passes = 0
    while (changed && passes < 8) {
        changed = false
        passes++
        for (const decision of index.citableStandingDecisions) {
            for (const line of lines) {
                const record = derived.get(line.lineId)!
                if (record.standingDecisions.includes(decision)) continue
                if (!applies(decision, line, index, record)) continue
                record.standingDecisions.push(decision)
                const entry: any = index.standingDecisions.find(d => d.id === decision)
                if (!record.standingValue && entry && entry.item && entry.item.value !== undefined) {
                    record.standingValue = { id: decision, value: entry.item.value }
                }
                changed = true
            }
        }
    }

    for (const line of lines) {
        const record = derived.get(line.lineId)!
        record.entailing.sort((a, b) => `${a.item.contractId}:${a.item.itemId}`.localeCompare(`${b.item.contractId}:${b.item.itemId}`))
        record.bounding.sort((a, b) => `${a.item.contractId}:${a.item.itemId}`.localeCompare(`${b.item.contractId}:${b.item.itemId}`))
        record.standingDecisions.sort()
        record.open = mayBeOpen(line, index, record, declarations, envelope, stopped)
    }

    return {
        lines: derived,
        undeterminedReaches: undeterminedReaches.sort((a, b) => a.classId.localeCompare(b.classId)),
        stopped: [...new Map(stopped.map(s => [s.where + s.why, s])).values()].sort((a, b) => a.where.localeCompare(b.where)),
    }
}

/**
 * A citable standing decision supplies a value only on the row its register entry names. SD-13 carries
 * a condition on another line's **derived** value: under SD-40 a candidate value can never satisfy it,
 * and increment 2 derives no transition values, so it does not fire here.
 */
function applies(decisionId: string, line: ResolutionLine, index: RegisterIndex, record: DerivedLine): boolean {
    const entry: any = index.standingDecisions.find(d => d.id === decisionId)
    if (!entry || !entry.item || !entry.item.row) return false
    const rows = String(entry.item.row).split(/\s+and\s+|,\s*/)
    if (!rows.includes(line.row)) return false
    if (entry.condition && typeof entry.condition === 'object') return false // its dependency is not derived here
    if (record.session) return false // the session already resolved it
    return record.entailing.length === 0
}
