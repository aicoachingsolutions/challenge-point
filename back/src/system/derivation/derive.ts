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
}

/** §3 — what may support: an item that entails, a citable standing decision, or the session. */
function isSupportCapable(item: any): boolean {
    if (item.basis === 'ENGINE_ONLY') return false // SD-21: engine wording supports nothing
    if (item.valueStatus === 'TYPICAL_EXAMPLE') return false // inert
    if (item.checkability === 'OUTSIDE_BOUNDARY') return false
    return true
}

/** An item entails only when it fixes the value: an assumed item bounds but never entails (§3). */
function entails(item: any): boolean {
    if (!isSupportCapable(item)) return false
    if (item.basis === 'ASSUMED') return false
    if (item.strictness === 'EXCLUSION') return false
    return item.requirement === 'EQUALS' || item.requirement === 'POSITIONED' || item.requirement === 'ORIENTED'
}

function boundsOf(item: any): Bounds {
    if (item.requirement === 'RANGE' || item.requirement === 'COUNT') {
        const text = String(item.value ?? '')
        const min = text.match(/(\d+)/)
        return { kind: 'COUNT', min: min ? Number(min[1]) : null, max: null }
    }
    return { kind: 'SET', members: [item.value] as any }
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
    // space itself is not supported, so the line is not open. Whether such a row should instead refuse
    // (as a count fill with no authored maximum does) is not established by the package.
    if (/authored/i.test(choiceSpace) && record.bounding.length === 0) {
        stopped.push({
            where: `stage 5, row ${row}`,
            why:
                `the register expresses this choice space as bounded by authored values (${JSON.stringify(choiceSpace)}), and nothing authored a bound. ` +
                'SD-39 requires the choice space to be supported, so the line is not open here. Whether it should instead refuse, as an unbounded count fill does, is not established.',
        })
        return null
    }

    return { authority: 'SD-39', choiceSpace }
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
        derived.set(line.lineId, { lineId: line.lineId, entailing: [], bounding: [], undetermined: [], open: null, standingDecisions: [] })
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

            if (entails(item)) {
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
    return record.entailing.length === 0
}
