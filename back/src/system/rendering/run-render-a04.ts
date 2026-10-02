/**
 * Render the frozen A04 concrete game, and report the fidelity trace.
 *
 * It reads `docs/audits/a04-concrete-game-fixture.json` and nothing else — no selection, no derivation,
 * no realization. That is deliberate and it is his instruction: *"do not reselect or re-realize it. I
 * want to isolate the rendering/communication boundary rather than test the entire chain again at once."*
 *
 * Run: npm run render:a04
 */
import fs from 'node:fs'
import path from 'node:path'

import { checkFidelity } from './fidelity'
import { renderConcreteGame } from './render-concrete-game'

const FIXTURE = path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json')
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))

const rule = (title: string) => console.log(`\n${title}\n${'='.repeat(title.length)}`)

console.log('RENDERING THE FROZEN A04 CONCRETE GAME')
console.log('='.repeat(72))
console.log(`  fixture        ${path.basename(FIXTURE)}`)
console.log(`  input digest   ${fixture.provenance.inputDigest}`)
console.log(`  render-eligible ${fixture.closure.renderEligible ? 'yes' : 'no'}  (from the closure run; not recomputed)`)

const rendered = renderConcreteGame(fixture)

// ---------------------------------------------------------------------------------------------
rule('THE COACH-FACING ACTIVITY')
for (const section of ['Set up', 'Players', 'How it works', 'How to score', 'What to watch'] as const) {
    const lines = rendered.instructions.filter(i => i.section === section)
    if (!lines.length) continue
    console.log(`\n${section}`)
    for (const line of lines) console.log(`  · ${line.text}`)
}

// ---------------------------------------------------------------------------------------------
const report = checkFidelity(fixture, rendered)

rule('1 · PROVENANCE — which concrete-game properties produced each instruction')
for (const entry of report.provenance) {
    console.log(`\n  "${entry.text}"`)
    console.log(`     status ${entry.status}`)
    for (const from of entry.from) console.log(`     from   ${from}`)
}

rule('2-5 · FIDELITY')
const byQuestion: Record<number, string> = {
    2: 'anything in the rendering lacking support from the concrete game',
    3: 'anything required by the concrete game that disappeared in translation',
    4: 'wording that changed the status of anything',
    5: 'whether a coach could lay out and play the game from this alone',
}
for (const question of [2, 3, 4, 5] as const) {
    const found = report.findings.filter(f => f.question === question)
    const violations = found.filter(f => f.severity === 'VIOLATION')
    console.log(`\n  Q${question} — ${byQuestion[question]}`)
    console.log(`     ${violations.length === 0 ? 'no violation' : `${violations.length} VIOLATION(S)`}`)
    for (const finding of found) console.log(`       ${finding.severity === 'VIOLATION' ? '·' : 'note:'} ${finding.what}`)
}

rule('COACHING OBSERVATIONS — reported, not repaired')
if (!rendered.coachingObservations.length) console.log('  none')
for (const observation of rendered.coachingObservations) console.log(`\n  · ${observation}`)

rule('RESULT')
console.log(`  fidelity  ${report.passed ? 'PASSED' : 'FAILED'}`)
console.log(`  ${rendered.instructions.length} instruction(s), ${rendered.coachingObservations.length} observation(s) returned as evidence`)
