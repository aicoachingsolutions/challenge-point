/**
 * Attempt a realization, and say exactly why it did or did not happen.
 *
 * This is the smallest end of the generation pathway:
 *
 *     resolved game → concrete game + realization record
 *
 * No coach language, no variation, no activity slots. The runner supplies no choices of its own: a
 * choice is a decision, and a *runner* inventing one to make the output look finished is the failure
 * this whole layer exists to prevent. It prints the realization request the resolved game implies —
 * every open line with its authority and its permitted alternatives — and then attempts the
 * realization with whatever choices were actually given (a JSON file via `--choices`, or none).
 *
 * Run: npm run realize            · the conformance corpus
 *      npm run realize -- A01 A01-02 --choices path/to/choices.json
 */
import fs from 'node:fs'

import { corpusInput } from '../derivation/corpus'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, ResolvedGame } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { Choice, checkRealization, Instantiation, isRefused, realize, Realized } from './realize'

function resolvedGameFor(goalId: string | null, situationId: string | null): { label: string; game: ResolvedGame } {
    const input = goalId ? derivationInputFor(selectFor(goalId, situationId)) : corpusInput()
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('the run halted; there is no game to realize')
    const staged: any = runStages0to10(input)
    return {
        label: goalId ? `${goalId}${situationId ? ` · ${situationId}` : ''}` : 'conformance corpus',
        game: assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts),
    }
}

const goalId = process.argv.find(a => /^[A-Z]+[0-9]+$/.test(a)) ?? null
const situationId = process.argv.find(a => /^[A-Z]+[0-9]+-[0-9]+$/.test(a)) ?? null
const choicesArg = process.argv[process.argv.indexOf('--choices') + 1]
const supplied: { choices: Choice[]; instantiations: Instantiation[] } =
    process.argv.includes('--choices') && choicesArg ? JSON.parse(fs.readFileSync(choicesArg, 'utf8')) : { choices: [], instantiations: [] }

const { label, game: resolved } = resolvedGameFor(goalId, situationId)

console.log(`REALIZATION — ${label}`)
console.log('='.repeat(72))
console.log(`  Gate A                       ${resolved.coherence.gateA}${resolved.coherence.failingChecks.length ? `  (${resolved.coherence.failingChecks.join(', ')})` : ''}`)
console.log(`  eligible for realization     ${resolved.coherence.mayRealize ? 'yes' : 'no'}`)
console.log(`  derived / open / existential ${resolved.counts.derived} / ${resolved.counts.open} / ${resolved.counts.existential}`)
console.log(`  elements (nothing known of)  ${resolved.counts.elements} (${resolved.counts.elementsWithNothingEstablished})`)

console.log('\nTHE REALIZATION REQUEST — what a realizer must be given, and on whose authority')
console.log('-'.repeat(72))
if (!resolved.open.length && !resolved.existential.length) console.log('  nothing: this game has no open line and no existential claim')
for (const choice of resolved.open) {
    console.log(`  CHOOSE      ${choice.path}`)
    console.log(`              line ${choice.lineId}  (${choice.kind})`)
    if (choice.permittedBy) console.log(`              authority ${choice.permittedBy.authority}: ${choice.permittedBy.choiceSpace}`)
    if (choice.permitted) console.log(`              one of ${JSON.stringify(choice.permitted)}`)
    else if (choice.bounds.length) console.log(`              bounded by ${JSON.stringify(choice.bounds)}`)
    else console.log(`              no bound is carried — a realizer has nothing to check a value against`)
}
for (const claim of resolved.existential) {
    const card = claim.cardinality.min === null && claim.cardinality.max === null ? 'at least one' : `min ${claim.cardinality.min ?? '-'}, max ${claim.cardinality.max ?? '-'}`
    console.log(`  INSTANTIATE ${claim.path}  (${card})  claim ${claim.classId} from ${claim.from.contractId}::${claim.from.itemId}`)
}

const result = realize(resolved, supplied.choices, supplied.instantiations)

console.log(`\nOUTCOME — ${result.outcome}`)
console.log('-'.repeat(72))
if (isRefused(result)) {
    console.log(`  ${result.because.length} reason(s). Each is a thing the system declined to decide for itself.`)
    for (const reason of result.because) console.log(`   · ${reason}`)
    process.exit(0)
}

const realized = result as Realized
const checks = checkRealization(resolved, realized)
console.log(`  nothing closed without authority   ${checks.nothingClosedWithoutAuthority.length === 0 ? 'ok' : `${checks.nothingClosedWithoutAuthority.length} VIOLATION(S)`}`)
for (const p of checks.nothingClosedWithoutAuthority) console.log(`     · ${p}`)
console.log(`  nothing derived is lost            ${checks.nothingLost.length === 0 ? 'ok' : `${checks.nothingLost.length} VIOLATION(S)`}`)
for (const p of checks.nothingLost) console.log(`     · ${p}`)
console.log(`  nothing is invented                ${checks.nothingInvented.length === 0 ? 'ok' : `${checks.nothingInvented.length} VIOLATION(S)`}`)
for (const p of checks.nothingInvented) console.log(`     · ${p}`)

console.log('\nREALIZATION RECORD')
console.log('-'.repeat(72))
for (const choice of realized.record.choices) {
    console.log(`  ${choice.lineId}  ->  ${JSON.stringify(choice.value)}`)
    console.log(`     at ${choice.path};  authority ${choice.authority ?? 'none carried'};  bound ${choice.boundCheck};  because ${choice.because}`)
}
for (const inst of realized.record.instantiations) console.log(`  ${inst.classId}  ->  ${JSON.stringify(inst.member)} at ${inst.path};  because ${inst.because}`)
if (realized.record.unverified.length) console.log(`  unverified against a qualitative bound (SD-15): ${realized.record.unverified.join(', ')}`)

console.log('\nCONCRETE GAME')
console.log('-'.repeat(72))
console.log(JSON.stringify(realized.game, null, 1).split('\n').map(l => `  ${l}`).join('\n'))
