/**
 * Derivation engine — stage 11, Emit (package §1.3, §1.4, §8).
 *
 * The final assembly. This stage **derives nothing**: it assembles what the earlier stages established
 * into the one record the system hands on, and stamps it.
 *
 * Two rules govern it, and both are enforced here rather than assumed.
 *
 *   - **SD-30, the stamp.** "An unstamped result asserts nothing." A result with no `versions` block is
 *     not emitted as a result; it is emitted as a stamped halt that says so.
 *   - **§1.4, field presence.** Each `ResolutionEntry` field is required *iff* its condition holds:
 *     `state` only on an `ENUMERATED` line, `value` and `resolvedBy` only where `derived`, `reason` only
 *     on `NOT_AUTHORED`, `bounds`/`permittedBy` only where `open`, `conditionalOn` only where
 *     `CONDITIONAL`. Assembling a field outside its condition would state something the derivation did
 *     not establish, so the assembly asserts the shape it produced.
 */

import { ClassifiedLine } from './classify'
import { DerivedLine, resolvedValue } from './derive'
import { ItemOutcome } from './forward'
import { GateReport } from './gates'
import {
    Bounds,
    FailureRecord,
    ItemRef,
    RefusalRecord,
    ResolutionLine,
    RunReport,
    SupportRef,
    Versions,
} from './types'

export type LineState2 = 'derived' | 'open' | 'failed'

/** §1.4 — one per enumerated line of the resolution. */
export interface ResolutionEntry {
    lineId: string
    elementId: string | null
    row: string
    member: string | null
    lineState: ResolutionLine['lineState']
    state?: LineState2
    verdict?: string
    reason?: string
    value?: unknown
    bounds?: Bounds[]
    permittedBy?: { authority: string; choiceSpace: unknown }
    resolvedBy?: 'ENTAILMENT' | 'STANDING_DECISION' | 'SESSION'
    support: SupportRef[]
    conditionalOn?: string
    failureIds?: string[]
    refusalIds?: string[]
}

export interface AuditProperty {
    lineId: string
    sources: SupportRef[]
    lineState: ResolutionLine['lineState']
    collisionId: string | null
}

export interface AuditItem {
    contractId: string
    itemId: string
    result: string
    reach: string[]
}

export interface Audit {
    properties: AuditProperty[]
    items: AuditItem[]
    collisions: { collisionId: string; lineId: string; items: ItemRef[] }[]
    relationshipConflicts: unknown[]
    /** SD-27 made tensions unrepresentable. The field stays, always empty, so no gate can read one. */
    tensions: never[]
    referenceDefects: { contractId: string; itemId: string; where: string; text: string; why: string }[]
    dispositions: unknown[]
}

export interface DerivationResult {
    versions: Versions
    resolution: ResolutionEntry[]
    audit: Audit
    gates: { gateA: GateReport; gateBForward: GateReport; gateBReverse: GateReport }
    candidate: null
    failures: FailureRecord[]
    refusals: RefusalRecord[]
    run: RunReport
    /** Discrepancies reported rather than resolved (SD-48). Empty is the goal, not the assumption. */
    stopped: { where: string; why: string }[]
}

/** §3.5 — a result is always returned; a failure to stamp returns a stamped halt, never nothing. */
export interface StampedHalt {
    versions: null
    halted: true
    resolution: never[]
    failures: FailureRecord[]
    refusals: RefusalRecord[]
    run: RunReport
    stopped: { where: string; why: string }[]
}

export function isStampedHalt(result: DerivationResult | StampedHalt): result is StampedHalt {
    return result.versions === null
}

/** §1.4 — `failed` is `NOT_AUTHORED` or `UNRESOLVED`, or an invented line in checking mode. */
function stateOf(verdict: string | null | undefined): LineState2 | undefined {
    if (!verdict) return undefined
    if (verdict === 'NOT_AUTHORED' || verdict === 'UNRESOLVED' || verdict === 'INVENTED') return 'failed'
    if (verdict.startsWith('FREE')) return 'open'
    if (verdict === 'RESOLVED:ENTAILED') return 'derived'
    return undefined
}

export interface EmitInput {
    versions: Versions | null
    lines: ResolutionLine[]
    classified: Map<string, ClassifiedLine>
    derived: Map<string, DerivedLine>
    forward: ItemOutcome[]
    gates: { gateA: GateReport; gateBForward: GateReport; gateBReverse: GateReport }
    failures: FailureRecord[]
    refusals: RefusalRecord[]
    run: RunReport
    stopped: { where: string; why: string }[]
}

/**
 * Assemble and stamp. Canonical ordering throughout (§8): the resolution follows the line order the
 * enumeration fixed, and every derived list is sorted by a content-derived key, so the same
 * authoritative input yields a byte-identical record.
 */
export function emit(input: EmitInput): DerivationResult | StampedHalt {
    if (!input.versions) {
        // SD-30: an unstamped result asserts nothing, so nothing is asserted.
        return {
            versions: null,
            halted: true,
            resolution: [],
            failures: input.failures,
            refusals: input.refusals,
            run: { ...input.run, halted: true },
            stopped: input.stopped,
        }
    }

    const failuresByLine = new Map<string, string[]>()
    for (const failure of input.failures) {
        const lineId = failure.locus.lineId
        if (!lineId) continue
        failuresByLine.set(lineId, [...(failuresByLine.get(lineId) || []), failure.failureId])
    }
    const refusalsByLine = new Map<string, string[]>()
    for (const refusal of input.refusals) {
        for (const lineId of refusal.affects.lineIds || []) {
            refusalsByLine.set(lineId, [...(refusalsByLine.get(lineId) || []), refusal.refusalId])
        }
    }

    const resolution: ResolutionEntry[] = []
    for (const line of input.lines) {
        const classified = input.classified.get(line.lineId)
        const record = input.derived.get(line.lineId)
        const state = stateOf(classified?.verdict)

        const entry: ResolutionEntry = {
            lineId: line.lineId,
            elementId: line.elementId,
            row: line.row,
            member: line.member,
            lineState: classified?.lineState ?? line.lineState,
            support: supportOf(record, classified),
        }

        // §1.4 — `state` and `verdict` only on an ENUMERATED line.
        if (entry.lineState === 'ENUMERATED' && classified?.verdict) {
            entry.state = state
            entry.verdict = classified.verdict
        }
        if (classified?.verdict === 'NOT_AUTHORED' && classified.reason) entry.reason = classified.reason

        if (entry.state === 'derived') {
            entry.value = valueOf(record)
            if (classified?.resolvedBy) entry.resolvedBy = classified.resolvedBy
        }
        if (entry.state === 'open') {
            entry.bounds = (record?.bounding || []).map(b => b.bound)
            if (record?.open) entry.permittedBy = { authority: record.open.authority, choiceSpace: record.open.choiceSpace }
        }
        if (entry.lineState === 'CONDITIONAL' && (classified?.conditionalOn || line.conditionalOn)) {
            entry.conditionalOn = classified?.conditionalOn ?? line.conditionalOn
        }

        const failureIds = failuresByLine.get(line.lineId)
        if (failureIds && failureIds.length) entry.failureIds = [...failureIds].sort()
        const refusalIds = refusalsByLine.get(line.lineId)
        if (refusalIds && refusalIds.length) entry.refusalIds = [...new Set(refusalIds)].sort()

        resolution.push(entry)
    }

    const collisions = input.failures
        .filter(f => f.kind === 'COLLISION' && f.locus.lineId)
        .map(f => ({
            collisionId: f.failureId,
            lineId: String(f.locus.lineId),
            items: (input.classified.get(String(f.locus.lineId))?.collidingItems || []).slice().sort((a, b) => `${a.contractId}:${a.itemId}`.localeCompare(`${b.contractId}:${b.itemId}`)),
        }))
    const collisionByLine = new Map(collisions.map(c => [c.lineId, c.collisionId]))

    const audit: Audit = {
        properties: resolution.map(entry => ({
            lineId: entry.lineId,
            sources: entry.support,
            lineState: entry.lineState,
            collisionId: collisionByLine.get(entry.lineId) ?? null,
        })),
        items: input.forward
            .map(outcome => ({
                contractId: outcome.item.contractId,
                itemId: outcome.item.itemId,
                result: outcome.result,
                reach: [...outcome.reach].sort(),
            }))
            .sort((a, b) => `${a.contractId}:${a.itemId}`.localeCompare(`${b.contractId}:${b.itemId}`)),
        collisions: collisions.sort((a, b) => a.collisionId.localeCompare(b.collisionId)),
        relationshipConflicts: [],
        tensions: [],
        referenceDefects: input.failures
            .filter(f => f.kind === 'REFERENCE_DEFECT')
            .map(f => ({
                contractId: String(f.locus.contractId ?? ''),
                itemId: String(f.locus.itemRef?.itemId ?? ''),
                where: 'SELECTOR',
                text: String(f.offendingInput ?? ''),
                why: String(f.detailRef ?? ''),
            }))
            .sort((a, b) => `${a.contractId}:${a.itemId}`.localeCompare(`${b.contractId}:${b.itemId}`)),
        dispositions: [],
    }

    return {
        versions: input.versions,
        resolution,
        audit,
        gates: input.gates,
        candidate: null, // derivation mode: stage 9 did not run, and no empty check list is invented
        failures: [...input.failures].sort((a, b) => a.failureId.localeCompare(b.failureId)),
        refusals: [...input.refusals].sort((a, b) => a.refusalId.localeCompare(b.refusalId)),
        run: input.run,
        stopped: input.stopped,
    }
}

/** §1.4: "`support` — knowledge entailment only; `[]` unless derived." */
/**
 * §1.4: "`support` — knowledge entailment only; `[]` unless derived." SD-78 adds that a composition is
 * supported by *every* contributing narrowing, not only the one whose member survived.
 */
function supportOf(record: DerivedLine | undefined, classified: ClassifiedLine | undefined): SupportRef[] {
    if (classified?.verdict !== 'RESOLVED:ENTAILED') return []
    return resolvedValue(record)?.support ?? []
}

/**
 * SD-80 — a set of permitted alternatives is never emitted as a resolved value. A line resolved by
 * composition carries **the single surviving member**, and a composition that left more than one member
 * is `FREE(choice)`, which carries no value at all.
 */
function valueOf(record: DerivedLine | undefined): unknown {
    return resolvedValue(record)?.value
}
