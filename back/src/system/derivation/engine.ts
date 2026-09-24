/**
 * Derivation engine — increment 1: stages 0 (load), 1 (normalise) and 2 (index).
 *
 * A pure function over loaded data: no I/O, no clock, no randomness, no ambient state.
 *
 * SD-48, the implementation rule: "If a stage reaches semantics not explicitly established by the
 * specification, stop that path and report it. Do not complete the behavior from developer judgment."
 * Every such stop is recorded in `run` output as `stopped[]` and reported, never resolved here.
 */

import { HaltError, indexRegister, buildVersions, RegisterIndex } from './register'
import { loadContracts } from './load'
import { resolveScopes } from './scope'
import { deriveLines, DerivedLine } from './derive'
import { classifyLines, ClassifiedLine } from './classify'
import { forwardResults } from './forward'
import { runGates } from './gates'
import { emit, DerivationResult, StampedHalt } from './emit'
import { parseSelector, predicateKey } from './selector'
import {
    ContractItem,
    DerivationInput,
    ElementClass,
    FailureRecord,
    ItemRef,
    LoadedContract,
    PartialResult,
    RefusalRecord,
    ResolutionLine,
    SpecClause,
} from './types'

export const ENGINE_VERSION = '0.1.0-increment-1'

const CLAUSE = (section: string): SpecClause => ({ document: 'derivation-engine-design-package', section })

/** Content-derived ids: an unrelated record must never renumber the rest (package §3.1). */
function recordId(kind: string, locus: string, ordinal: number): string {
    return `${kind}#${locus}#${ordinal}`
}

/**
 * §8 requires "byte-identical output on repeat **and under shuffled input**", and the digest is part of
 * the output. So it is taken over a canonical form: contracts, their items and the selection are ordered
 * by id, and object keys are ordered, before hashing.
 *
 * **Array values are left exactly as authored.** AM-11 keeps the member order inside a value set as the
 * author wrote it, so sorting values would both violate that and make two genuinely different inputs
 * hash alike. Only the collections whose order carries no meaning are ordered.
 */
function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical)
    if (!value || typeof value !== 'object') return value
    const source = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) out[key] = canonical(source[key])
    return out
}

function byId(list: any[] | undefined, key: string): any[] {
    return [...(list || [])].sort((a, b) => String(a?.[key] ?? '').localeCompare(String(b?.[key] ?? '')))
}

function canonicalInput(input: DerivationInput): unknown {
    return canonical({
        selection: byId(input.selection as any[], 'objectId'),
        contracts: byId(input.contracts as any[], 'contractId').map(contract => ({
            ...contract,
            items: byId(contract.items, 'itemId'),
        })),
        envelope: input.envelope,
        registerVersion: input.register?.version,
        derivationRules: input.derivationRules,
    })
}

function digest(value: unknown): string {
    const text = JSON.stringify(value)
    let h1 = 0x811c9dc5
    for (let i = 0; i < text.length; i++) {
        h1 ^= text.charCodeAt(i)
        h1 = Math.imul(h1, 0x01000193) >>> 0
    }
    return h1.toString(16).padStart(8, '0')
}

const EXISTENCE_REQUIREMENTS = new Set(['EXISTS', 'COUNT', 'RANGE'])

function cardinalityOf(item: ContractItem): { min: number | null; max: number | null } {
    if (item.requirement === 'EXISTS') return { min: 1, max: null }
    const value = item.value
    if (typeof value === 'number') return { min: value, max: item.requirement === 'COUNT' ? value : null }
    const text = String(value ?? '')
    const min = text.match(/min(?:imum)?\s*:?\s*(\d+)/i) || text.match(/^(\d+)/)
    const max = text.match(/max(?:imum)?\s*:?\s*(\d+)/i)
    return {
        min: min ? Number(min[1]) : null,
        max: max ? Number(max[1]) : null,
    }
}

/**
 * Stage 2 — element classes (package §2.3, SD-47).
 * "Existence requirements establish supported classes defined by authoritative selectors. Derivation
 * does not manufacture individual identity or equivalence between classes."
 */
function formClasses(contracts: LoadedContract[], index: RegisterIndex): ElementClass[] {
    const classes: ElementClass[] = []

    for (const contract of contracts) {
        for (const item of contract.items || []) {
            const row = index.rows.get(String(item.row))
            if (!row || row.kind !== 'COLLECTION') continue
            if (!EXISTENCE_REQUIREMENTS.has(String(item.requirement))) continue

            const parsed = parseSelector(item.selector, String(item.row), index)
            // A selector that will not normalise was already recorded once, at stage 1. One defect,
            // one id: an item that cannot be normalised simply forms no class.
            if (!parsed.predicate) continue

            classes.push({
                classId: `c:${contract.contractId}:${item.itemId}`,
                row: String(item.row),
                fromItem: { contractId: contract.contractId, itemId: item.itemId },
                constraints: parsed.predicate,
                cardinality: cardinalityOf(item),
            })
        }
    }

    return classes.sort((a, b) => a.classId.localeCompare(b.classId))
}

/** Stage 1 — normalise every structural reference, in selectors and in values (SD-32). */
function normaliseSelectors(contracts: LoadedContract[], index: RegisterIndex, defects: FailureRecord[]): void {
    let ordinal = 0
    for (const contract of contracts) {
        for (const item of contract.items || []) {
            const rowId = String(item.row)
            if (!index.rows.has(rowId)) continue
            const parsed = parseSelector(item.selector, rowId, index)
            if (parsed.predicate) continue
            defects.push({
                failureId: recordId('REFERENCE_DEFECT', `${contract.contractId}:${item.itemId}`, ordinal++),
                kind: 'REFERENCE_DEFECT',
                stage: 1,
                locus: { contractId: contract.contractId, itemRef: { contractId: contract.contractId, itemId: item.itemId } },
                implicated: { contractIds: [contract.contractId], objectIds: [contract.objectId] },
                clause: CLAUSE('§2.2 stage 1'),
                offendingInput: String(item.selector ?? ''),
                detailRef: parsed.defect,
            })
        }
    }
}

/**
 * Stage 2 — structurally reachable triggers (SD-44). Only the prerequisites that are existence-level
 * facts are decided here; structural accessibility for REGION_ENTRY is a stage-6 withdrawal and is not
 * part of increment 1.
 */
function constructTriggers(classes: ElementClass[], index: RegisterIndex, envelope: DerivationInput['envelope']): string[] {
    const triggers: string[] = ['START', 'STANDING']
    if (index.citableStandingDecisions.has('SD-06')) triggers.push('SCORE')
    if (envelope && envelope.lengthM && envelope.widthM) triggers.push('OUT_END_LINE', 'OUT_TOUCHLINE')

    const teamClasses = classes.filter(c => c.row === 'P1')
    const ballClasses = classes.filter(c => c.row === 'O1' && c.constraints.terms.some(t => t.op === '=' && t.value === 'ball'))
    if (teamClasses.length >= 1 && ballClasses.length >= 1) triggers.push('POSSESSION_CHANGE')

    for (const region of classes.filter(c => c.row === 'S2')) triggers.push(`REGION_ENTRY{${region.classId}}`)
    for (const window of classes.filter(c => c.row === 'V23')) triggers.push(`TIME_EXPIRY{${window.classId}}`)

    return triggers.sort()
}

/** Stage 2 — the line inventory: one line per (class, row), and one per game-level row. */
function enumerateLines(classes: ElementClass[], index: RegisterIndex, stopped: PartialResult['stopped']): ResolutionLine[] {
    const lines: ResolutionLine[] = []

    for (const row of index.rows.values()) {
        if (row.kind === 'VIEW') continue // a view gets no line
        if (row.kind === 'COLLECTION') continue // existence is the class's cardinality, not a line of its own
        if (index.ownerRow.has(row.id)) continue // handled per class below
        lines.push({ lineId: `game::${row.id}`, elementId: null, row: row.id, member: null, lineState: 'ENUMERATED' })
    }

    for (const cls of classes) {
        for (const row of index.rows.values()) {
            if (row.kind !== 'FIELD') continue
            if (index.ownerRow.get(row.id) !== cls.row) continue

            const condition = index.applicability.get(row.id)
            const line: ResolutionLine = {
                lineId: `${cls.classId}::${row.id}`,
                elementId: cls.classId,
                row: row.id,
                member: null,
                lineState: condition ? 'CONDITIONAL' : 'ENUMERATED',
            }
            if (condition) line.conditionalOn = `${cls.classId}::${condition.row}`
            lines.push(line)

            // SD-51, his ruling of 23 September: "Do not enumerate member lines before membership is
            // authoritatively resolved. Resolve the set/collection membership first. Materialize member
            // lines only from an authoritative resolved member set. OPEN, failed or gapped membership
            // does not authorize creation of member identities."
            //
            // So stage 2 enumerates the membership line and nothing else. Member lines are materialized
            // after stage 6, and only where the membership line is RESOLVED — see `materialiseMembers`.
        }
    }

    return lines.sort((a, b) => {
        const rowDelta = (index.rowOrdinal.get(a.row) ?? 0) - (index.rowOrdinal.get(b.row) ?? 0)
        if (rowDelta !== 0) return rowDelta
        const elementDelta = String(a.elementId).localeCompare(String(b.elementId))
        if (elementDelta !== 0) return elementDelta
        return String(a.member).localeCompare(String(b.member))
    })
}

function haltResult(halt: 'H1' | 'H2', message: string, input: DerivationInput): PartialResult {
    return {
        versions: null,
        classes: [],
        lines: [],
        triggers: [],
        failures: [],
        refusals: [
            {
                refusalId: recordId('INPUT_DEFECT', halt, 0),
                kind: 'INPUT_DEFECT',
                cause: `${halt}: ${message}`,
                stage: 0,
                clause: CLAUSE('§3.5'),
                openQuestion: null,
                affects: { lineIds: [], itemRefs: [], contractIds: (input.contracts || []).map(c => c.contractId).sort() },
            },
        ],
        run: {
            mode: input.candidate ? 'CHECKING' : 'DERIVATION',
            halted: true,
            divergent: false,
            inputDigest: digest(canonicalInput(input)),
            counts: {},
        },
        stopped: [],
    }
}

/** Stages 0–2. A result is always returned; a failure to stamp returns a stamped halt, never nothing. */
export function runStages0to2(input: DerivationInput): PartialResult {
    let index: RegisterIndex
    try {
        index = indexRegister(input.register)
    } catch (error) {
        if (error instanceof HaltError) return haltResult(error.halt, error.message, input)
        throw error
    }

    let versions
    try {
        versions = buildVersions(index, { contracts: input.contracts || [], selection: input.selection || [], derivationRules: input.derivationRules }, ENGINE_VERSION)
    } catch (error) {
        if (error instanceof HaltError) return haltResult(error.halt, error.message, input)
        throw error
    }

    const failures: FailureRecord[] = []
    const refusals: RefusalRecord[] = []
    const stopped: PartialResult['stopped'] = []

    // Stage 0 — load, per contract, the run continuing.
    const loaded = loadContracts(input.contracts || [], index)
    loaded.refusals.forEach((refusal, i) => {
        const itemRef: ItemRef[] = refusal.itemId ? [{ contractId: refusal.contractId, itemId: refusal.itemId }] : []
        failures.push({
            failureId: recordId('LOAD_REFUSAL', refusal.contractId, i),
            kind: 'LOAD_REFUSAL',
            stage: 0,
            locus: { contractId: refusal.contractId, itemRef: itemRef[0] },
            implicated: { contractIds: [refusal.contractId], objectIds: [] },
            clause: CLAUSE('§2.2 stage 0'),
            offendingInput: refusal.offendingInput,
            detailRef: refusal.reason,
        })
    })

    // A selected object with no admitted contract is a run-level refusal, not a halt.
    const admittedObjects = new Set(loaded.admitted.map(c => c.objectId))
    for (const entry of input.selection || []) {
        if (admittedObjects.has(entry.objectId)) continue
        refusals.push({
            refusalId: recordId('SELECTION_CONTRACT_MISMATCH', entry.objectId, 0),
            kind: 'SELECTION_CONTRACT_MISMATCH',
            cause: `selected object ${entry.objectId} has no admitted contract`,
            stage: 0,
            clause: CLAUSE('§2.2 stage 0'),
            openQuestion: null,
            affects: { lineIds: [], itemRefs: [], contractIds: [] },
        })
    }

    // Stage 1 — normalise.
    normaliseSelectors(loaded.admitted, index, failures)

    // Stage 2 — classes, triggers, lines.
    const classes = formClasses(loaded.admitted, index)
    const triggers = constructTriggers(classes, index, input.envelope)
    const lines = enumerateLines(classes, index, stopped)

    // One entry per distinct stop, not one per occurrence.
    const distinctStops = [...new Map(stopped.map(s => [`${s.where}|${s.why}`, s])).values()].sort((a, b) => a.where.localeCompare(b.where))

    return {
        versions,
        classes,
        lines,
        triggers,
        failures: failures.sort((a, b) => a.failureId.localeCompare(b.failureId)),
        refusals: refusals.sort((a, b) => a.refusalId.localeCompare(b.refusalId)),
        run: {
            mode: input.candidate ? 'CHECKING' : 'DERIVATION',
            halted: false,
            divergent: false,
            inputDigest: digest(canonicalInput(input)),
            counts: {
                contractsAdmitted: loaded.admitted.length,
                contractsRefused: loaded.refusals.length,
                classes: classes.length,
                lines: lines.length,
                triggers: triggers.length,
                failures: failures.length,
                refusals: refusals.length,
            },
        },
        stopped: distinctStops,
    }
}

/**
 * SD-51 — materialize one line per member of a set-valued row, **only** from a member set that has been
 * authoritatively resolved.
 *
 * "OPEN, failed or gapped membership does not authorize creation of member identities." A membership
 * line that is open, unauthored or unresolved yields no member lines at all: the engine holds no
 * identity for a member it cannot establish. Each materialized line carries the member's own value and
 * inherits the membership line's support, creating no new authority.
 */
function materialiseMembers(
    lines: ResolutionLine[],
    classified: Map<string, ClassifiedLine>,
    derived: Map<string, DerivedLine>,
    index: RegisterIndex,
): { lines: ResolutionLine[]; classified: Map<string, ClassifiedLine>; derived: Map<string, DerivedLine>; withheld: number } {
    const produced: ResolutionLine[] = []
    const verdicts = new Map<string, ClassifiedLine>()
    const records = new Map<string, DerivedLine>()
    let withheld = 0

    for (const line of lines) {
        if (line.member !== null) continue
        const row = index.rows.get(line.row)
        if (!row || !/one property per (member|referent|trigger)/i.test(row.valueType || '')) continue

        const membership = classified.get(line.lineId)
        if (!membership || membership.verdict !== 'RESOLVED:ENTAILED') {
            withheld++
            continue
        }

        const record = derived.get(line.lineId)
        const value = record?.session ? record.session.value : record?.entailing.length ? record.entailing[0].value : record?.standingValue?.value
        const memberValues = Array.isArray(value) ? value : typeof value === 'string' ? parseMemberSet(value) : null
        if (!memberValues || !memberValues.length) {
            // Resolved, but the value is not a set this stage can enumerate. No member identity is
            // invented from it; the membership line stands alone and the case is counted.
            withheld++
            continue
        }

        for (const member of [...new Set(memberValues.map(String))].sort()) {
            const memberLine: ResolutionLine = {
                lineId: `${line.lineId}::${member}`,
                elementId: line.elementId,
                row: line.row,
                member,
                lineState: 'ENUMERATED',
            }
            produced.push(memberLine)
            verdicts.set(memberLine.lineId, {
                lineId: memberLine.lineId,
                lineState: 'ENUMERATED',
                verdict: 'RESOLVED:ENTAILED',
                reason: null,
                collidingItems: [],
                resolvedBy: membership.resolvedBy,
            })

            // §1.4 requires a value wherever a line is derived. A member line's value is the member,
            // and its support is the membership line's — inherited, never newly minted.
            records.set(memberLine.lineId, {
                lineId: memberLine.lineId,
                entailing: record && record.entailing.length ? record.entailing.map(e => ({ ...e, value: member })) : [],
                bounding: [],
                undetermined: [],
                open: null,
                standingDecisions: record ? [...record.standingDecisions] : [],
                standingValue: record && record.standingValue && !record.entailing.length && !record.session ? { id: record.standingValue.id, value: member } : null,
                session: record && record.session ? { row: record.session.row, value: member } : null,
            })
        }
    }

    return { lines: produced, classified: verdicts, derived: records, withheld }
}

/**
 * A set written as authored text. Only the two unambiguous spellings are read — a braced or
 * comma-separated list of bare tokens. Anything carrying prose is not a member set this stage can
 * enumerate, and yields no members rather than a guess (SD-32 forbids meaning matching).
 */
function parseMemberSet(text: string): string[] | null {
    const trimmed = text.trim()
    const braced = trimmed.match(/^\{([^{}]*)\}$/)
    const body = braced ? braced[1] : trimmed
    if (!body.trim()) return null
    const parts = body.split(',').map(p => p.trim())
    if (!parts.length || parts.some(p => !p || /\s/.test(p))) return null
    return parts
}

export { predicateKey }

/**
 * Increment 5 — stage 11, Emit. The complete pipeline: load through gates, assembled and stamped.
 *
 * Stages 7 and 9 remain deliberately unbuilt, and he has confirmed both (23 September): comparative
 * execution is not built against invented cases, and no candidate-game input is fabricated merely to
 * exercise checking mode. So `candidate` is null and Gate B reverse is `NOT_APPLICABLE` — neither is an
 * empty result standing in for a check that did not happen.
 */
export function runDerivation(input: DerivationInput): DerivationResult | StampedHalt {
    const staged = runStages0to10(input)

    return emit({
        versions: staged.versions,
        lines: staged.lines,
        classified: staged.classified ?? new Map(),
        derived: staged.derived?.lines ?? new Map(),
        forward: staged.forward ?? [],
        gates: staged.gates ?? {
            gateA: { verdict: 'NOT_EVALUABLE', checks: [], notEstablished: [] },
            gateBForward: { verdict: 'NOT_EVALUABLE', checks: [], notEstablished: [] },
            gateBReverse: { verdict: 'NOT_APPLICABLE', checks: [], notEstablished: [] },
        },
        failures: staged.failures,
        refusals: staged.refusals,
        run: staged.run,
        stopped: staged.stopped,
    })
}

/**
 * Increment 4 — stage 10, the gates, on top of 0–8.
 *
 * Stage 9 (checking a candidate game) is still not built: it needs a `CandidateGame` input, and none
 * exists. Gate B reverse is stage 9's remainder step and is `NOT_APPLICABLE` in derivation mode, never
 * a `PASS` it has not earned.
 */
export function runStages0to10(input: DerivationInput) {
    const base = runStages0to8(input)
    if (base.run.halted || !base.classified || !base.derived) return { ...base, gates: null }

    const index = indexRegister(input.register)
    const admitted = (input.contracts || []).filter(c => !base.failures.some(f => f.kind === 'LOAD_REFUSAL' && f.locus.contractId === c.contractId))

    const gates = runGates({
        classes: base.classes,
        lines: base.lines,
        classified: base.classified,
        derived: base.derived.lines,
        index,
        envelope: input.envelope || {},
        triggers: base.triggers,
        failures: base.failures,
        forward: base.forward || [],
        contracts: admitted,
    })

    base.refusals.push(...gates.refusals)
    base.stopped.push(...gates.stopped)

    base.run.counts.gateAChecks = gates.gateA.checks.length
    for (const [verdict, count] of Object.entries(
        gates.gateA.checks.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.verdict]: (acc[c.verdict] || 0) + 1 }), {}),
    )) {
        base.run.counts[`gateA:${verdict}`] = count
    }
    base.run.counts.gateANotEstablished = gates.gateA.notEstablished.length
    base.run.counts.refusals = base.refusals.length

    return {
        ...base,
        refusals: base.refusals.sort((a, b) => a.refusalId.localeCompare(b.refusalId)),
        stopped: [...new Map(base.stopped.map(s => [`${s.where}|${s.why}`, s])).values()].sort((a, b) => a.where.localeCompare(b.where)),
        gates,
    }
}

/**
 * Increment 3 — stages 6 (classify) and 8 (forward) on top of 0–5.
 *
 * Stage 7 (relationships) is not implemented: the corpus contains **zero** comparative items (SD-41),
 * so it would be built against constructed cases only. Stages 9–11 follow.
 */
export function runStages0to8(input: DerivationInput) {
    const base = runStages0to5(input)
    if (base.run.halted || !base.derived || !base.scope) return { ...base, classified: null, forward: null }

    const index = indexRegister(input.register)
    const admitted = (input.contracts || []).filter(c => !base.failures.some(f => f.kind === 'LOAD_REFUSAL' && f.locus.contractId === c.contractId))

    const classified = classifyLines(base.lines, base.derived.lines, base.scope.declarations, index)
    const forward = forwardResults(admitted, base.lines, base.derived.lines, classified, base.scope.applicationSets, index)

    // SD-51 — member lines, materialized only from an authoritatively resolved member set.
    const members = materialiseMembers(base.lines, classified, base.derived.lines, index)
    base.lines.push(...members.lines)
    for (const [lineId, line] of members.classified) classified.set(lineId, line)
    for (const [lineId, record] of members.derived) base.derived.lines.set(lineId, record)
    base.run.counts.memberLines = members.lines.length
    base.run.counts.memberSetsUnresolved = members.withheld

    // §1.4: "`failed` is `NOT_AUTHORED` or `UNRESOLVED`", and §3.2 raises a `GAP` at stage 6, one gap
    // one id. Increment 3 raised none, so a run could report thirteen unauthored lines with no failure
    // record at all — and Gate A's `GA-NO-FAILED-LINE`, which asks exactly this question, would have
    // certified that corpus vacuously.
    let gapOrdinal = 0
    for (const line of [...classified.values()].sort((a, b) => a.lineId.localeCompare(b.lineId))) {
        if (line.verdict !== 'NOT_AUTHORED') continue
        base.failures.push({
            failureId: recordId('GAP', line.lineId, gapOrdinal++),
            kind: 'GAP',
            stage: 6,
            locus: { lineId: line.lineId },
            implicated: { contractIds: [], objectIds: [] },
            clause: CLAUSE('§3.2'),
            detailRef: `the line's value is unauthored (${line.reason ?? 'coverage'})`,
        })
    }

    // A collision on a line is a failure record in its own right: without it, an audit can show a game
    // stopped without showing which two items stopped it.
    let collisionOrdinal = 0
    for (const line of classified.values()) {
        if (line.verdict !== 'UNRESOLVED') continue
        base.failures.push({
            failureId: recordId('COLLISION', line.lineId, collisionOrdinal++),
            kind: 'COLLISION',
            stage: 6,
            locus: { lineId: line.lineId },
            implicated: {
                contractIds: [...new Set(line.collidingItems.map(i => i.contractId))].sort(),
                objectIds: [],
            },
            clause: CLAUSE('§6'),
            detailRef: 'two support-capable items on one line that no single value satisfies, and nothing authored decides it (SD-02)',
        })
    }

    const tally = (list: string[]) => list.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: (acc[key] || 0) + 1 }), {})
    base.run.counts.verdicts = Object.keys(tally([...classified.values()].map(l => String(l.verdict)))).length
    for (const [verdict, count] of Object.entries(tally([...classified.values()].map(l => String(l.verdict))))) {
        base.run.counts[`verdict:${verdict}`] = count
    }
    for (const [result, count] of Object.entries(tally(forward.map(f => f.result)))) {
        base.run.counts[`forward:${result}`] = count
    }

    return {
        ...base,
        failures: base.failures.sort((a, b) => a.failureId.localeCompare(b.failureId)),
        classified,
        forward,
    }
}

/**
 * Increment 2 — stages 3 (scope), 4 (reach) and 5 (derive), on top of 0–2.
 *
 * Still no verdicts: classification is stage 6. Still no value on an open line: SD-39 authorises the
 * freedom, and the downstream choice process fills it.
 */
export function runStages0to5(input: DerivationInput): PartialResult & {
    scope: ReturnType<typeof resolveScopes> | null
    derived: ReturnType<typeof deriveLines> | null
} {
    const base = runStages0to2(input)
    if (base.run.halted) return { ...base, scope: null, derived: null }

    const index = indexRegister(input.register)
    const admitted = (input.contracts || []).filter(c => !base.failures.some(f => f.kind === 'LOAD_REFUSAL' && f.locus.contractId === c.contractId))

    const scope = resolveScopes(admitted, base.classes)
    for (const divergence of scope.divergence) {
        base.refusals.push({
            refusalId: recordId('PASS_DIVERGENCE', divergence.contractId, 0),
            kind: 'PASS_DIVERGENCE',
            cause: divergence.why,
            stage: 3,
            clause: CLAUSE('§2.1'),
            openQuestion: null,
            affects: { lineIds: [], itemRefs: [], contractIds: [divergence.contractId] },
        })
    }

    const derived = deriveLines(admitted, base.classes, base.lines, scope.applicationSets, scope.declarations, index, input.envelope || {})
    base.stopped.push(...derived.stopped)

    // SD-48 — an item whose reach a class neither entails nor contradicts. The package's reach rule is
    // written for an element; under SD-47 an element is a class, and a selector the class leaves open
    // would constrain some of its elements and not others. Nothing establishes what that means, so the
    // engine records it, derives nothing from it, and reports it rather than choosing a reading.
    if (derived.undeterminedReaches.length) {
        base.stopped.push({
            where: 'stage 4, reach',
            why:
                `${derived.undeterminedReaches.length} item-to-class reaches are undetermined: the class's authoritative selector ` +
                'neither entails nor contradicts the item\'s selector, so the item would constrain some elements of the class and ' +
                'not others. The package\'s reach rule is written for an element, and SD-47 makes an element a class. Nothing is ' +
                'derived from these, and no reading is chosen here.',
        })
    }

    const openCount = [...derived.lines.values()].filter(l => l.open).length
    base.run.counts.applicationSets = scope.applicationSets.length
    base.run.counts.declarationsPreserved = scope.declarations.length
    base.run.counts.linesWithEntailment = [...derived.lines.values()].filter(l => l.entailing.length > 0).length
    base.run.counts.linesOpen = openCount
    base.run.counts.undeterminedReaches = derived.undeterminedReaches.length

    return {
        ...base,
        stopped: [...new Map(base.stopped.map(s => [`${s.where}|${s.why}`, s])).values()].sort((a, b) => a.where.localeCompare(b.where)),
        scope,
        derived,
    }
}
