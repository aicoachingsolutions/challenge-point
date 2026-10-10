/**
 * Print the A04 pilot activity, and write it where a coach can read it.
 *
 * **It builds nothing itself.** The pipeline lives in `build-pilot-activity`, and the read-only route
 * calls the same function — which is the point. His requirement for the route is that it serve *"the
 * same validated artifact without unverified transformations"*, and two copies of the chain is how
 * that promise quietly breaks. This script formats; it does not decide.
 *
 * **Why it is separate from `run-render-a04.ts`.** That one reads the frozen fixture and nothing else,
 * to isolate the rendering boundary. This one runs the whole chain, because the question it answers is
 * the pilot question: does the complete path, from the Learning Goal to the words a coach reads,
 * produce an authorized and faithfully communicated activity at the size the coach will set out.
 *
 * Run: npm run pilot:a04
 */
import fs from 'node:fs'
import path from 'node:path'

import { buildPilotActivity, isPilotRefused } from './build-pilot-activity'

const OUT = path.resolve(__dirname, '../../../../docs/audits/a04-pilot-activity.txt')

const lines: string[] = []
const say = (s = '') => {
    lines.push(s)
    console.log(s)
}

const activity = buildPilotActivity()
if (isPilotRefused(activity)) {
    console.error('The pilot activity did not pass its checks, so nothing was written:')
    for (const because of activity.because) console.error(`  - ${because}`)
    process.exit(1)
}

const { rendered, provenance, integrity, session } = activity

say('A04 — BEAT DEFENDERS 1v1')
say('='.repeat(72))
say(`Coach definition   ${activity.goalName} — eliminate individual defenders.`)
say(`Session            ${session.players} players, ${session.lengthM} m x ${session.widthM} m, ${session.durationMin} minutes`)
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
say(`  learning goal resolved     ${provenance.resolution} (signal group ${provenance.signalGroup})`)
say(`  game form                  ${provenance.gameForm}`)
say(`  affordance lenses          ${provenance.affordanceLenses.join(', ')}`)
say(`  contracted knowledge       ${provenance.contracted.join(', ')}`)
say(`  selected without contract  ${provenance.selectedWithoutContract.join(', ') || '(none)'}`)
say('')
say('WHAT THE CONTRACTED/UNCONTRACTED SPLIT ABOVE MEANS')
say('='.repeat(72))
say('  A selected knowledge object with no contract contributes NOTHING to the game. So the realized')
say('  activity is the game form plus the sport profile, and the four constraints named above shaped')
say('  none of it. The selection resolves specifically to this Learning Goal, which it did not before,')
say('  but the constraint package is not yet aligned with the Learning Goal.')
say('')
say('  The checks below establish that the activity is authorized, internally coherent and faithfully')
say('  communicated. They do NOT establish that it is well designed for what it is meant to teach.')
say('  That is a separate question and this file does not answer it.')
say('')
say('INTEGRITY OF THIS ACTIVITY')
say('='.repeat(72))
say(`  Gate A                     ${integrity.gateA}`)
say(`  realization authorized     ${integrity.realizationAuthorized}`)
say(`  nothing closed w/o author  ${integrity.acceptance.nothingClosedWithoutAuthority.length === 0 ? 'clean' : 'FAILED'}`)
say(`  nothing lost               ${integrity.acceptance.nothingLost.length === 0 ? 'clean' : 'FAILED'}`)
say(`  nothing invented           ${integrity.acceptance.nothingInvented.length === 0 ? 'clean' : 'FAILED'}`)
say(`  post-realization gates     ${integrity.postRealizationValidated ? 'validated' : 'NOT VALIDATED'}`)
say(`  instructions               ${integrity.instructions}, every one citing a property`)
say(`  fidelity violations        ${integrity.fidelityViolations}`)

say('')
say('WHAT THE ACTIVITY DOES NOT SETTLE')
say('='.repeat(72))
for (const observation of rendered.coachingObservations) say(`  · ${observation}`)

fs.writeFileSync(OUT, lines.join('\n') + '\n')
console.log(`\nwrote ${path.relative(process.cwd(), OUT)}`)
