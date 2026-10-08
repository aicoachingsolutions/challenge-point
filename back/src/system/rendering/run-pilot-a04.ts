/**
 * Produce the A04 pilot activity, at a session envelope the coach chooses.
 *
 * **Why this is separate from `run-render-a04.ts`.** That script reads the frozen fixture and nothing
 * else, deliberately, to isolate the rendering boundary. This one runs the whole chain — selection,
 * derivation, Gate A, realization, the post-realization gates, rendering and fidelity — because the
 * question it answers is the pilot question: does the complete path, from the Learning Goal to the
 * words a coach reads, produce an authorized and faithfully communicated activity at the size the
 * coach is actually going to set out.
 *
 * **Why the envelope is an input here.** `E1`-`E4` are `sourceKinds: ["SESSION"]`: the area, the
 * player count and the duration are session input, not knowledge. The Golden Case freezes one
 * envelope (the corpus one, 40 x 30 with 12 players) so the reference artifact is stable; a coach
 * running a tighter game is choosing a different session, not a different game. Both are the same
 * resolved game, and this script shows either.
 *
 * Run: npm run pilot:a04            (the 4v4 in 30 x 25)
 *      CP_PLAYERS=12 CP_LENGTH=40 CP_WIDTH=30 npm run pilot:a04
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
import { renderConcreteGame } from './render-concrete-game'

const CHOICES = path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json')
const OUT = path.resolve(__dirname, '../../../../docs/audits/a04-pilot-activity.txt')

const players = Number(process.env.CP_PLAYERS ?? 8)
const lengthM = Number(process.env.CP_LENGTH ?? 30)
const widthM = Number(process.env.CP_WIDTH ?? 25)
const durationMin = Number(process.env.CP_DURATION ?? 20)

const lines: string[] = []
const say = (s = '') => {
    lines.push(s)
    console.log(s)
}

const selection = selectFor('A04', null)
const base = derivationInputFor(selection)
const input: any = { ...base, envelope: { ...(base.envelope as any), players, lengthM, widthM, durationMin } }

const result: any = runDerivation(input)
const staged: any = runStages0to10(input)
const index = indexRegister(input.register)
const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)

/**
 * **Only the choices this game actually asks for.** A choice naming a line the resolved game does not
 * hold is not silently ignored — `realize` refuses it — so the request is filtered to the open lines
 * and anything left over is reported rather than dropped quietly.
 */
const supplied = JSON.parse(fs.readFileSync(CHOICES, 'utf8'))
const open = new Set<string>(resolved.open.map((o: any) => String(o.lineId)))
const choices = supplied.choices.filter((c: any) => open.has(String(c.lineId)))
const unused = supplied.choices.filter((c: any) => !open.has(String(c.lineId))).map((c: any) => String(c.lineId))

const realization = realize(resolved, choices, supplied.instantiations, index, input.envelope)
if (isRefused(realization)) {
    console.error('REFUSED:', JSON.stringify((realization as any).because ?? realization, null, 2))
    process.exit(1)
}
const realized = realization as Realized
const ctx = { ...staged.gateContext, contracts: input.contracts }
const entailed = completeConcreteGame(ctx, realized)
const acceptance = checkRealization(resolved, realized)
const post = runPostRealizationGates(
    ctx,
    resolved.coherence.postRealizationRequired.map((o: any) => ({ checkId: o.checkId, clause: o.clause })),
    realized
)

const fixture: any = {
    provenance: resolved.provenance,
    closure: { renderEligible: true },
    envelope: { players, lengthM, widthM, durationMin, roles: (input.envelope as any).roles ?? {} },
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
        notEstablished: resolved.notEstablished.map((n: any) => ({
            path: n.path,
            lineId: n.lineId,
            reason: n.reason,
            declared: n.declared,
        })),
    },
}

const rendered = renderConcreteGame(fixture)
const report = checkFidelity(fixture, rendered)
const violations = report.findings.filter((f: any) => f.severity === 'VIOLATION')

say('A04 — BEAT DEFENDERS 1v1')
say('='.repeat(72))
say(`Coach definition   ${String((selectFor('A04', null) as any).goalName)} — eliminate individual defenders.`)
say(`Session            ${players} players, ${lengthM} m x ${widthM} m, ${durationMin} minutes`)
say('')

for (const section of ['Set up', 'Players', 'How it works', 'How to score', 'What to watch'] as const) {
    const group = rendered.instructions.filter(i => i.section === section)
    if (!group.length) continue
    say(section)
    for (const instruction of group) say(`  · ${instruction.text}`)
    say('')
}

say('')
say('HOW THIS ACTIVITY WAS ARRIVED AT')
say('='.repeat(72))
say(`  learning goal resolved     matched (signal group J_attacking_duel)`)
say(`  game form                  ${selection.selected.find(s => s.role === 'game form')?.id}`)
say(`  affordance lenses          ${selection.selected.filter(s => s.role.startsWith('affordance lens')).map(s => s.id.replace('tl-v0-lens-', '')).join(', ')}`)
say(`  contracted knowledge       ${selection.contracted.join(', ')}`)
say(`  selected without contract  ${selection.missing.map(m => m.replace('tl-v0-constraint-', '')).join(', ') || '(none)'}`)
say('')
say('INTEGRITY OF THIS ACTIVITY')
say('='.repeat(72))
say(`  Gate A                     ${resolved.coherence.gateA}`)
say(`  realization authorized     ${resolved.coherence.realizationAuthorized}`)
say(`  nothing closed w/o author  ${acceptance.nothingClosedWithoutAuthority.length === 0 ? 'clean' : JSON.stringify(acceptance.nothingClosedWithoutAuthority)}`)
say(`  nothing lost               ${acceptance.nothingLost.length === 0 ? 'clean' : JSON.stringify(acceptance.nothingLost)}`)
say(`  nothing invented           ${acceptance.nothingInvented.length === 0 ? 'clean' : JSON.stringify(acceptance.nothingInvented)}`)
say(`  post-realization gates     ${post.validated ? 'validated' : 'NOT VALIDATED'}`)
say(`  instructions               ${rendered.instructions.length}, every one citing a property`)
say(`  fidelity violations        ${violations.length}`)
if (unused.length) say(`  realization choices unused ${unused.join(', ')}`)
for (const v of violations) say(`    Q${v.question} ${v.what}`)

say('')
say('WHAT THE ACTIVITY DOES NOT SETTLE')
say('='.repeat(72))
for (const observation of rendered.coachingObservations) say(`  · ${observation}`)

fs.writeFileSync(OUT, lines.join('\n') + '\n')
console.log(`\nwrote ${path.relative(process.cwd(), OUT)}`)
if (violations.length) process.exit(1)
