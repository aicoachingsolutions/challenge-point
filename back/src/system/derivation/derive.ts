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
    /**
     * SD-90 — preferred defaults **displaced** by an authoritative required value on this line. They
     * are held here rather than in `entailing` for three reasons his ruling states: they supply no
     * support, they take no part in collision resolution, and their source must stay visible.
     */
    displaced: DisplacedContribution[]
    /**
     * SD-92 — members an establishing selector's `∋` term puts into a set-valued field. *"It
     * establishes membership in the set-valued field; it does not by itself define the complete
     * set."* So it is held beside the line, never as the line's value: the field stays unauthored
     * while what is known about it stays visible.
     */
    establishedMembers: { item: ItemRef; member: unknown; support: SupportRef }[]
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

/**
 * **SD-92, his ruling of 27 September**, ratifying RC-16 subordinately.
 *
 *   "Where an authoritative existence selector necessarily fixes an attribute, that selector may
 *    supply the corresponding field value **only where no support-capable item already entails that
 *    field**. … If an authored support-capable item already entails the field, the selector does not
 *    compete with or override it."
 *
 * RC-16 was a conformance **run convention** — *"an item that entails an element also entails each
 * attribute its selector fixes with `=` or `∋`"* — and six of the eight contracts were restated
 * against it, leaving those rows deliberately empty. The engine was built to the specification and
 * never adopted it, so the corpus and the engine held different rules and the difference read as
 * missing knowledge.
 *
 * The operator distinction is his and each does a different thing:
 *
 *   `=`  fixes the value — an entailment carried by the establishing item;
 *   `∋`  establishes **membership** in a set-valued field and does **not** define the complete set,
 *        so it resolves nothing on its own;
 *   `∈`  narrows the allowable set and fixes no single value — SD-78's composition.
 *
 * Subordination is applied uniformly, before any operator is considered: where an item already
 * entails the line, the selector contributes nothing at all. That keeps "does not compete" literal
 * rather than leaving it to a precedence rule, which SD-02 forbids inventing.
 */
function applySelectorCarry(
    lines: ResolutionLine[],
    derived: Map<string, DerivedLine>,
    classes: ElementClass[],
    index: RegisterIndex,
): void {
    const byClass = new Map(classes.map(c => [c.classId, c]))

    for (const line of lines) {
        if (!line.elementId || line.member !== null) continue
        const row = index.rows.get(line.row)
        // The correspondence is data on the row (SD-92), never recovered by matching path text — that
        // matching is what surfaced the qualifiers/qualifier spelling in the first place.
        if (!row || !row.selectorAttribute) continue

        const cls = byClass.get(line.elementId)
        if (!cls || row.ownerRow !== cls.row) continue

        const record = derived.get(line.lineId)!
        if (record.entailing.length) continue // an item entails it: the selector does not compete

        const term = (cls.constraints?.terms || []).find(t => t.attribute === row.selectorAttribute)
        if (!term) continue

        const support: SupportRef = { kind: 'CONTRACT_ITEM', contractId: cls.fromItem.contractId, itemId: cls.fromItem.itemId, relation: 'CARRIES' }

        if (term.op === '=') {
            record.entailing.push({ item: { ...cls.fromItem }, value: term.value, support })
        } else if (term.op === 'CONTAINS') {
            // Membership, and only membership. The line is not resolved by it, because the complete
            // set remains unauthored — so this is recorded beside the line rather than as its value.
            record.establishedMembers.push({ item: { ...cls.fromItem }, member: term.value, support })
        } else if (term.op === 'IN') {
            record.narrowing.push({ item: { ...cls.fromItem }, members: [...term.values], support })
        }
    }
}

/**
 * SD-90 — a preferred default that an authoritative required value displaced.
 *
 * `agreed` separates the two cases he distinguished. A default whose preferred value differs from the
 * one the required contribution establishes has genuinely been adapted; one that names the same value
 * has not adapted at all — it simply adds no authority the required contribution did not already
 * carry. Both leave `entailing`; only the first takes the `ADAPTED` disposition.
 */
export interface DisplacedContribution {
    item: ItemRef
    /** The value this contribution preferred, kept so provenance shows what was displaced. */
    preferred: unknown
    /** The required contribution(s) that resolved the property without it. */
    displacedBy: ItemRef[]
    agreed: boolean
}

/**
 * **SD-90, his ruling of 27 September.** §3 already said *"Adaptation is not support"* and named the
 * `ADAPTED` disposition; nothing implemented it, because no corpus case had displaced a default until
 * SD-89's authored ownership met GF2's authored restart convention on one line.
 *
 * His definition, kept narrow on purpose: *"A `PREFERRED_DEFAULT` contribution is displaced when an
 * applicable, support-capable required contribution authoritatively resolves the same property."* Then
 * the required contribution supplies the value, the default takes no part in collision resolution, the
 * default receives the disposition, its source stays visible, and **adaptation supplies no support**.
 *
 * *"Do not treat this as a universal precedence hierarchy between contribution types."* So this is not
 * a ranking consulted whenever two contributions disagree: it is one behaviour of one value status,
 * and it fires only where the property is authoritatively resolved without the default.
 *
 * **Which axis "required" names.** The displaced side is a `valueStatus`, and SD-08 — the decision §3
 * cites — is the decision that names the three value statuses. So the displacing side is read as
 * `valueStatus: REQUIRED_RANGE`. The corpus carries items where value status and strictness disagree
 * in both directions, so the choice is real; on today's corpus the two readings coincide exactly, and
 * `derivation-stage345.unit.ts` pins the reading rather than leaving it to be rediscovered.
 *
 * **Entailment only.** A narrowed set that intersects to one member also resolves a property, but no
 * corpus line carries both a narrowing and a preferred default, and nothing establishes how a set that
 * has not yet been composed displaces a scalar preference. That path is left alone (SD-48).
 */
function applyDisplacement(lines: ResolutionLine[], derived: Map<string, DerivedLine>, itemsById: Map<string, any>): void {
    const statusOf = (ref: ItemRef) => itemsById.get(`${ref.contractId}:${ref.itemId}`)?.valueStatus

    for (const line of lines) {
        const record = derived.get(line.lineId)!
        const required = record.entailing.filter(e => statusOf(e.item) === 'REQUIRED_RANGE')
        const preferred = record.entailing.filter(e => statusOf(e.item) === 'PREFERRED_DEFAULT')
        if (!required.length || !preferred.length) continue

        record.entailing = record.entailing.filter(e => statusOf(e.item) !== 'PREFERRED_DEFAULT')
        for (const entry of preferred) {
            record.displaced.push({
                item: entry.item,
                preferred: entry.value,
                displacedBy: required.map(r => r.item),
                agreed: required.every(r => JSON.stringify(r.value) === JSON.stringify(entry.value)),
            })
        }
        record.displaced.sort((a, b) => `${a.item.contractId}:${a.item.itemId}`.localeCompare(`${b.item.contractId}:${b.item.itemId}`))
    }
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
            displaced: [],
            establishedMembers: [],
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

    // SD-92 — the establishing selector's contribution, before the narrowings are composed (an `∈`
    // term is one of them) and before anything reads a value off the line.
    applySelectorCarry(lines, derived, classes, index)

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

    // SD-90 — displacement runs before anything reads a value off this line: before the session is
    // reconciled against the entailing set, before the standing-decision closure asks whether the line
    // is already entailed, and before stage 6 looks for a collision. A displaced default must be gone
    // by the time any of those three look, or it would be participating after all.
    applyDisplacement(lines, derived, itemsById)

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
                if (!applies(decision, line, index, record, derived, stopped)) continue
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
 * A citable standing decision supplies a value only on the row its register entry names.
 *
 * **SD-91, his ruling of 27 September**, authorized *"as a separate mechanism from SD-88"*: where a
 * citable standing decision carries an explicitly authored condition on another property's value, and
 * that governing property is authoritatively resolved, the condition is evaluated. *"Evaluation may
 * read the governing value but may not supply, infer or modify it. If the governing value is
 * unresolved, free, failed or valueless, do not infer the condition's result."*
 *
 * It replaces the second lapsed stop — *"increment 2 derives no transition values, so it does not fire
 * here"* — the same sentence as SD-88's, in a different place. This one is a standing decision's
 * condition rather than a line's applicability, which is why it needed its own ruling.
 *
 * SD-40 is untouched: the governing value is read from the derived record, and a candidate value never
 * reaches it.
 */
function applies(
    decisionId: string,
    line: ResolutionLine,
    index: RegisterIndex,
    record: DerivedLine,
    derived: Map<string, DerivedLine>,
    stopped: { where: string; why: string }[],
): boolean {
    const entry: any = index.standingDecisions.find(d => d.id === decisionId)
    if (!entry || !entry.item || !entry.item.row) return false
    const rows = String(entry.item.row).split(/\s+and\s+|,\s*/)
    if (!rows.includes(line.row)) return false
    if (record.session) return false // the session already resolved it
    if (record.entailing.length > 0) return false
    if (entry.condition && typeof entry.condition === 'object' && !conditionHolds(decisionId, entry.condition, line, derived, stopped)) return false
    return true
}

/**
 * SD-91's evaluation, and only that. It reads one value and compares it; there is no branch here that
 * writes to a derived record, and none that decides a condition's result from anything other than a
 * value already established.
 */
function conditionHolds(
    decisionId: string,
    condition: any,
    line: ResolutionLine,
    derived: Map<string, DerivedLine>,
    stopped: { where: string; why: string }[],
): boolean {
    const row = condition.row ? String(condition.row) : null
    if (!row || !('equals' in condition)) {
        // The register states this condition in a shape nothing establishes how to evaluate. Completing
        // it from judgement is what SD-48 forbids, so the decision simply does not fire.
        stopped.push({
            where: `stage 5, ${decisionId}`,
            why:
                `its condition ${JSON.stringify(condition)} is not a governing-row equality, and no other condition shape is established. ` +
                'The decision does not fire, and no result is inferred for it.',
        })
        return false
    }

    // "sameElement" is the only reference form the register uses. A condition on a game-level row would
    // need its own establishment, so it is stopped rather than guessed.
    if (!condition.sameElement) {
        stopped.push({
            where: `stage 5, ${decisionId}`,
            why: `its condition reads row ${row} without sameElement, and how a condition reaches a line on another element is not established.`,
        })
        return false
    }
    if (!line.elementId) return false // a game-level line has no same-element governing line to read

    const governing = resolvedValue(derived.get(`${line.elementId}::${row}`))
    // Unresolved, free, failed or valueless: his four cases, all of which mean the same thing here —
    // there is no established value to read, and the result is not inferred from its absence.
    if (!governing) return false
    return JSON.stringify(governing.value) === JSON.stringify(condition.equals)
}
