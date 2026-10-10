/**
 * Build the A04 pilot activity, once, for every caller that needs it.
 *
 * **Why this exists as its own module.** His instruction for the read-only route is that it must
 * *"serve the same validated, rendered activity without introducing unverified transformations"*. Two
 * copies of the pipeline — one in the script, one in the route — is exactly how that promise breaks:
 * they drift, and the thing the route serves stops being the thing the script validated. So the
 * pipeline lives here and both call it.
 *
 * **It refuses rather than degrades.** If anything in the chain fails to authorize, fails acceptance,
 * fails a post-realization gate, or renders with a fidelity violation, this returns a refusal naming
 * what failed. Nothing partial is returned for a caller to serve anyway, because his standing
 * instruction is not to *"substitute generic fallback output"* or present an activity that has not
 * passed. A refusal is the honest response to a pilot that is not ready.
 *
 * **It does not touch generation.** Selection, derivation, the gates, realization, rendering and the
 * fidelity check — nothing here calls the frozen activity-generation path.
 */
import fs from 'node:fs'
import path from 'node:path'

import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { completeConcreteGame } from '../realization/assemble-concrete-game'
import { runPostRealizationGates } from '../realization/post-realization-gate'
import { checkRealization, isRefused, realize, Realized } from '../realization/realize'
import { checkFidelity } from './fidelity'
import { RenderedActivity, renderConcreteGame } from './render-concrete-game'

const CHOICES = path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json')

export interface PilotSession {
    players: number
    lengthM: number
    widthM: number
    durationMin: number
}

/** The session the pilot runs at: a 4v4 in a tight box. The envelope is session input, not knowledge. */
export const PILOT_SESSION: PilotSession = { players: 8, lengthM: 30, widthM: 25, durationMin: 20 }

export interface PilotActivity {
    goalId: 'A04'
    goalName: string
    session: PilotSession
    rendered: RenderedActivity
    /** How the activity was arrived at — the selection account, so nothing is taken on trust. */
    provenance: {
        resolution: 'matched'
        signalGroup: string
        gameForm: string
        affordanceLenses: string[]
        contracted: string[]
        selectedWithoutContract: string[]
    }
    /** Every check that had to pass before this could be served. */
    integrity: {
        gateA: string
        realizationAuthorized: boolean
        acceptance: { nothingClosedWithoutAuthority: unknown[]; nothingLost: unknown[]; nothingInvented: unknown[] }
        postRealizationValidated: boolean
        instructions: number
        fidelityViolations: number
    }
}

export interface PilotRefused {
    refused: true
    because: string[]
}

export const isPilotRefused = (result: PilotActivity | PilotRefused): result is PilotRefused =>
    (result as PilotRefused).refused === true

export function buildPilotActivity(session: PilotSession = PILOT_SESSION): PilotActivity | PilotRefused {
    const because: string[] = []

    /**
     * **Selection first, and it must have RESOLVED.** `selectFor` throws where the status is `fallback`
     * or `unresolved`, which is the invariant his 8 October ruling put at this boundary. Catching it
     * here turns the throw into a refusal the route can serve as a 409 rather than a stack trace.
     */
    let selection
    try {
        selection = selectFor('A04', null)
    } catch (error) {
        return { refused: true, because: [`selection: ${error instanceof Error ? error.message : String(error)}`] }
    }

    const base = derivationInputFor(selection)
    const input: any = { ...base, envelope: { ...(base.envelope as any), ...session } }

    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)

    if (!resolved.coherence.realizationAuthorized) {
        return {
            refused: true,
            because: [`Gate A is ${resolved.coherence.gateA}`, ...(resolved.coherence.notAuthorizedBecause ?? [])],
        }
    }

    const supplied = JSON.parse(fs.readFileSync(CHOICES, 'utf8'))
    const realization = realize(resolved, supplied.choices, supplied.instantiations, index, input.envelope)
    if (isRefused(realization)) return { refused: true, because: ['realization refused', ...((realization as any).because ?? [])] }
    const realized = realization as Realized

    const ctx = { ...staged.gateContext, contracts: input.contracts }
    const entailed = completeConcreteGame(ctx, realized)
    const acceptance = checkRealization(resolved, realized)
    const post = runPostRealizationGates(
        ctx,
        resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause })),
        realized
    )

    for (const [name, entries] of Object.entries(acceptance)) if ((entries as unknown[]).length) because.push(`${name}: ${JSON.stringify(entries)}`)
    if (!post.validated) because.push('a post-realization gate did not validate')

    const fixture: any = {
        provenance: resolved.provenance,
        closure: { renderEligible: true },
        envelope: { ...session, roles: (input.envelope as any).roles ?? {} },
        game: realized.game,
        record: realized.record,
        status: {
            derived: resolved.derived.map((d: any) => ({ path: d.path, lineId: d.lineId, value: d.value })),
            choices: realized.record.choices.map((c: any) => ({ path: c.path, lineId: c.lineId, value: c.value })),
            instantiations: realized.record.instantiations.map((i: any) => ({
                path: i.path,
                classId: i.classId,
                handle: i.handle,
                memberIndex: i.memberIndex,
                member: i.member,
            })),
            entailed,
            geometry: realized.record.geometry,
            jointConditions: resolved.jointConditions,
            notEstablished: resolved.notEstablished.map((n: any) => ({ path: n.path, lineId: n.lineId, reason: n.reason, declared: n.declared })),
        },
    }

    const rendered = renderConcreteGame(fixture)
    const report = checkFidelity(fixture, rendered)
    const violations = report.findings.filter((f: any) => f.severity === 'VIOLATION')
    for (const v of violations) because.push(`fidelity Q${v.question}: ${v.what}`)

    if (because.length) return { refused: true, because }

    return {
        goalId: 'A04',
        goalName: String((selection as any).goalName),
        session,
        rendered,
        provenance: {
            resolution: 'matched',
            signalGroup: 'J_attacking_duel',
            gameForm: String(selection.selected.find(s => s.role === 'game form')?.id),
            affordanceLenses: selection.selected.filter(s => s.role.startsWith('affordance lens')).map(s => s.id.replace('tl-v0-lens-', '')),
            contracted: selection.contracted,
            selectedWithoutContract: selection.missing.map(m => m.replace('tl-v0-constraint-', '')),
        },
        integrity: {
            gateA: String(resolved.coherence.gateA),
            realizationAuthorized: Boolean(resolved.coherence.realizationAuthorized),
            acceptance,
            postRealizationValidated: Boolean(post.validated),
            instructions: rendered.instructions.length,
            fidelityViolations: violations.length,
        },
    }
}
