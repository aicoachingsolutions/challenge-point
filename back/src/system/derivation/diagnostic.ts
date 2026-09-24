/**
 * Derivation engine — the corpus diagnostic.
 *
 * **This module adds no semantics.** It computes nothing, judges nothing and checks nothing: every
 * number it prints is read back out of a `DerivationResult` the engine already produced. Its only job
 * is to render that record in a form a person can read, so the health of the corpus can be inspected
 * without a script that outlives its own accuracy.
 *
 * If a figure here is wrong, the engine is wrong — there is nowhere else for it to come from.
 */

import { DerivationResult, StampedHalt, isStampedHalt } from './emit'

function tally<T>(rows: T[], key: (row: T) => string): [string, number][] {
    const counts = new Map<string, number>()
    for (const row of rows) counts.set(key(row), (counts.get(key(row)) || 0) + 1)
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function section(title: string): string {
    return `\n${title}\n${'-'.repeat(title.length)}`
}

function table(rows: [string, string | number][], pad = 46): string[] {
    return rows.map(([label, value]) => `  ${String(label).padEnd(pad)} ${value}`)
}

export interface RepairProvenance {
    encoding: { strings: number; charactersRecovered: number }
    restatement: {
        applied: number
        withheld: { item: string; why: string }[]
        itemsRestated?: number
        itemsRemoved?: number
        itemsAdded?: number
        declarationScopes?: number
        notFound?: string[]
    }
}

const NO_REPAIRS: RepairProvenance = { encoding: { strings: 0, charactersRecovered: 0 }, restatement: { applied: 0, withheld: [] } }

export function renderDiagnostic(result: DerivationResult | StampedHalt, repairs: RepairProvenance = NO_REPAIRS): string {
    const out: string[] = []
    out.push('DERIVATION ENGINE — CORPUS DIAGNOSTIC')
    out.push('Every figure below is read from the emitted result. Nothing here is recomputed.')

    if (isStampedHalt(result)) {
        out.push(section('HALTED'))
        out.push('  The run could not be stamped, so it asserts nothing (SD-30).')
        out.push(...table(result.refusals.map(r => [r.kind, r.cause])))
        return out.join('\n')
    }

    out.push(section('RUN'))
    out.push(
        ...table([
            ['mode', result.run.mode],
            ['halted', String(result.run.halted)],
            ['divergent', String(result.run.divergent)],
            ['input digest', result.run.inputDigest],
            ['engine version', result.versions.engine],
            ['register version', result.versions.register],
            ['derivation rules version', result.versions.derivation],
            ['vocabularies stamped', Object.keys(result.versions.vocabularies).length],
        ]),
    )

    out.push(section('CORPUS REPAIR APPLIED TO THIS RUN'))
    out.push('  The source artefact is never modified. Each kind is counted separately, because they are')
    out.push('  different kinds of change: one recovers authored text, the other restates authored meaning.')
    out.push(
        ...table([
            ['encoding repair — strings restored', repairs.encoding.strings],
            ['encoding repair — characters recovered', repairs.encoding.charactersRecovered],
            ['restatement — items rewritten to NO_ROW', repairs.restatement.applied],
            ['restatement — items restated by an individual ruling', repairs.restatement.itemsRestated ?? 0],
            ['restatement — items removed as exceeding their source', repairs.restatement.itemsRemoved ?? 0],
            ['restatement — items added from what the source entails', repairs.restatement.itemsAdded ?? 0],
            ['restatement — declaration scopes restated', repairs.restatement.declarationScopes ?? 0],
            ['restatement — named but withheld on a condition', repairs.restatement.withheld.length],
            ['restatement — named in a ruling but not found', (repairs.restatement.notFound ?? []).length],
        ]),
    )
    for (const withheld of repairs.restatement.withheld) out.push(`    WITHHELD ${withheld.item}: ${withheld.why}`)
    for (const missing of repairs.restatement.notFound ?? []) out.push(`    NOT FOUND ${missing}`)

    out.push(section('KNOWLEDGE ADMITTED'))
    const admitted = result.run.counts.contractsAdmitted ?? 0
    const refused = result.run.counts.contractsRefused ?? 0
    out.push(
        ...table([
            ['contracts admitted', admitted],
            ['contracts refused whole at load', refused],
            ['items carrying a forward result', result.audit.items.length],
        ]),
    )
    if (refused) {
        out.push('\n  Refused, with the item that caused it:')
        for (const failure of result.failures.filter(f => f.kind === 'LOAD_REFUSAL')) {
            out.push(`    ${String(failure.locus.contractId).padEnd(34)} ${failure.locus.itemRef?.itemId ?? '-'}  ${failure.detailRef ?? ''}`)
        }
    }

    out.push(section('RESOLUTION'))
    const enumerated = result.resolution.filter(e => e.lineState === 'ENUMERATED')
    out.push(
        ...table([
            ['lines', result.resolution.length],
            ['enumerated', enumerated.length],
            ['conditional', result.resolution.filter(e => e.lineState === 'CONDITIONAL').length],
            ['withdrawn', result.resolution.filter(e => e.lineState === 'WITHDRAWN').length],
        ]),
    )
    out.push('\n  By state:')
    out.push(...table(tally(enumerated.filter(e => e.state), e => String(e.state)).map(([k, v]) => [k, v]), 44))
    out.push('\n  Derived lines, by route:')
    out.push(...table(tally(result.resolution.filter(e => e.resolvedBy), e => String(e.resolvedBy)).map(([k, v]) => [k, v]), 44))
    const reasons = tally(result.resolution.filter(e => e.reason), e => String(e.reason))
    if (reasons.length) {
        out.push('\n  Unauthored lines, by reason:')
        out.push(...table(reasons.map(([k, v]) => [k, v]), 44))
    }

    out.push(section('ITEM OUTCOMES'))
    out.push(...table(tally(result.audit.items, i => i.result).map(([k, v]) => [k, v])))

    out.push(section('FAILURES AND REFUSALS'))
    out.push(...table(tally(result.failures, f => f.kind).map(([k, v]) => [k, v])))
    if (result.refusals.length) out.push(...table(tally(result.refusals, r => r.kind).map(([k, v]) => [k, v])))
    out.push(
        ...table([
            ['collisions', result.audit.collisions.length],
            ['reference defects', result.audit.referenceDefects.length],
            ['tensions (unrepresentable, SD-27)', result.audit.tensions.length],
        ]),
    )

    out.push(section('GATE A'))
    out.push(...table([['verdict', result.gates.gateA.verdict]]))
    const evidence = result.gates.gateA.evidence
    if (evidence) {
        out.push('\n  Clause evidence — a pass with no applicable instance is not evidence (SD-54):')
        out.push(
            ...table(
                [
                    ['clauses evaluated against real instances', evidence.clausesEvaluated],
                    ['clauses passing with NO applicable instances', evidence.clausesVacuous],
                    ['clauses failed', evidence.clausesFailed],
                    ['clauses not evaluable / blocked', evidence.clausesNotEvaluable],
                    ['clauses outside the representation', evidence.clausesOutsideRepresentation],
                ],
                44,
            ),
        )
    }
    out.push('\n  Per check:')
    for (const check of result.gates.gateA.checks) {
        const basis = check.clauses
            .map(c => (c.verdict === 'PASS' ? (c.basis === 'NO_APPLICABLE_INSTANCES' ? 'pass(vacuous)' : `pass(${c.instances})`) : c.verdict.toLowerCase()))
            .join(', ')
        out.push(`    ${check.verdict.padEnd(22)} ${check.checkId.padEnd(26)} [${basis}]`)
        out.push(`      ${check.why}`)
        if (check.blockedBy.length) out.push(`      blocked on: ${check.blockedBy.slice(0, 3).join(', ')}${check.blockedBy.length > 3 ? ` (+${check.blockedBy.length - 3})` : ''}`)
    }
    const blocks = result.gates.gateA.blocks || []
    if (blocks.length) {
        out.push('\n  Blocked clauses (SD-62) — a gate block is not a derivation gap:')
        out.push('    GAP        = authoritative information required during derivation is missing')
        out.push('    GATE BLOCK = derivation completed as authorized; the gate lacks the structural authority to evaluate')
        for (const block of blocks) {
            out.push(`\n    ${block.kind.padEnd(20)} ${block.checkId}`)
            out.push(`      clause:     ${block.clause}`)
            const dependency = [...block.dependency.lineIds, ...block.dependency.rows]
            out.push(`      depends on: ${dependency.length ? dependency.slice(0, 3).join(', ') + (dependency.length > 3 ? ` (+${dependency.length - 3})` : '') : '(the clause itself has no executable definition)'}`)
            out.push(`      reason:     ${block.reason}`)
        }
    }

    if (result.gates.gateA.notEstablished.length) {
        out.push('\n  Not established — carried with the result, never counted as passed (SD-43):')
        for (const entry of result.gates.gateA.notEstablished) out.push(`    ${entry.checkId.padEnd(26)} ${entry.clause}`)
    }

    out.push(section('GATE B'))
    out.push(
        ...table([
            ['forward', `${result.gates.gateBForward.verdict} — ${result.gates.gateBForward.checks[0]?.why ?? ''}`],
            ['reverse', `${result.gates.gateBReverse.verdict} (derivation mode: stage 9 did not run)`],
        ]),
    )

    out.push(section('UNESTABLISHED SEMANTICS (SD-48 stops)'))
    if (!result.stopped.length) out.push('  none — every stop the implementation carried has been ruled')
    for (const stop of result.stopped) out.push(`  ${stop.where}\n    ${stop.why}`)

    return out.join('\n')
}
