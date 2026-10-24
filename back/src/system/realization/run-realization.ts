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
 * **Since 13 October it closes what the pathway closes by rule, and prints each such line as a default.**
 * The choices files stopped holding a line whose authored bound has one member — that is a justified
 * default now, not a decision — so a runner calling `realize` bare refused two lines of a game the builder
 * serves, on the very file the builder reads. A justified default is not a choice the runner invents: it is
 * the one value the knowledge leaves, produced by the same call the builder and the freezer make.
 *
 * **What it derives is not necessarily what is served** (24 October 2026, the K3 review's should-fix). For a goal it derives the
 * realization the selection is built with - the record's first alternative that can be tried, unless `--realization` threads another of
 * the record's alternatives - and NO role block. The served build tries the record's alternatives in order and builds a game played in
 * role blocks once per block, so a Gate A FAIL here for such a game says nothing about it. It prints which, before anything else
 * (`runner-derivation-note.ts`), so nobody reads that as a regression; `npm run snapshot` records what is served.
 *
 * Run: npm run realize            · the conformance corpus
 *      npm run realize -- A01 A01-02 --choices path/to/choices.json
 *      npm run realize -- A01 --realization A01-R1     · another of the record's alternatives, threaded as the build threads it
 */
import fs from 'node:fs'

import { corpusInput } from '../derivation/corpus'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame, ResolvedGame } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { completeConcreteGame } from './assemble-concrete-game'
import { realizeWithJustifiedDefaults } from './justified-defaults'
import { Choice, checkRealization, Instantiation, isRefused, Realized } from './realize'
import { runnerDerivationNote, threadRunnerRealization } from './runner-derivation-note'

function resolvedGameFor(goalId: string | null, situationId: string | null, realizationId: string | null) {
    if (realizationId && !goalId) throw new Error('--realization names one of a goal\'s alternatives: give the goal too')
    const selection = goalId ? threadRunnerRealization(selectFor(goalId, situationId), realizationId) : null
    const input = selection ? derivationInputFor(selection) : corpusInput()
    const result = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('the run halted; there is no game to realize')
    const staged: any = runStages0to10(input)
    const index = indexRegister(input.register)
    return {
        label: goalId ? `${goalId}${situationId ? ` · ${situationId}` : ''}` : 'conformance corpus',
        game: assembleResolvedGame(result, staged.classes, index, input.contracts) as ResolvedGame,
        index,
        envelope: input.envelope ?? {},
        // Carried so this runner can entail over the concrete game too. Without it this runner printed a
        // DIFFERENT game from `first:game` on identical inputs — teams with no size, and nothing owed.
        gateContext: { ...staged.gateContext, contracts: input.contracts },
        // Which realization was derived and whether the game has role blocks (the K3 review's should-fix); none for the corpus.
        note: selection ? runnerDerivationNote(selection, input) : [],
    }
}

const goalId = process.argv.find(a => /^[A-Z]+[0-9]+$/.test(a)) ?? null
const situationId = process.argv.find(a => /^[A-Z]+[0-9]+-[0-9]+$/.test(a)) ?? null
const choicesArg = process.argv[process.argv.indexOf('--choices') + 1]
const supplied: { choices: Choice[]; instantiations: Instantiation[] } =
    process.argv.includes('--choices') && choicesArg ? JSON.parse(fs.readFileSync(choicesArg, 'utf8')) : { choices: [], instantiations: [] }
const realizationArg = process.argv.includes('--realization') ? (process.argv[process.argv.indexOf('--realization') + 1] ?? null) : null

const { label, game: resolved, index: derivationIndex, envelope: derivationEnvelope, gateContext, note } = resolvedGameFor(goalId, situationId, realizationArg)

console.log(`REALIZATION — ${label}`)
console.log('='.repeat(72))
if (note.length) {
    console.log('  WHAT THIS RUNNER DERIVES — not necessarily what is served')
    for (const line of note) console.log(`  ${line}`)
    console.log('-'.repeat(72))
}
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
    const card = claim.cardinalityUnreadable ? 'UNREADABLE COUNT (no number the parser can read; not an inferred minimum of one)' : `min ${claim.cardinality.min ?? '-'}, max ${claim.cardinality.max ?? '-'}`
    console.log(`  INSTANTIATE ${claim.path}  (${card})  claim ${claim.classId} from ${claim.from.contractId}::${claim.from.itemId}`)
}

const { realization: result } = realizeWithJustifiedDefaults(resolved, supplied, derivationIndex, derivationEnvelope, gateContext as any)
if (!isRefused(result)) completeConcreteGame(gateContext, result as Realized)

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
    console.log(`  ${choice.lineId}  ->  ${JSON.stringify(choice.value)}${choice.defaultedBy ? `   (DEFAULT — ${choice.defaultedBy})` : ''}`)
    console.log(`     at ${choice.path};  authority ${choice.authority ?? 'none carried'};  bound ${choice.boundCheck};  because ${choice.because}`)
}
for (const inst of realized.record.instantiations) console.log(`  ${inst.classId}  ->  ${JSON.stringify(inst.member)} at ${inst.path};  because ${inst.because}`)
if (realized.record.unverified.length) console.log(`  unverified against a qualitative bound (SD-15): ${realized.record.unverified.join(', ')}`)

console.log('\nCONCRETE GAME')
console.log('-'.repeat(72))
console.log(JSON.stringify(realized.game, null, 1).split('\n').map(l => `  ${l}`).join('\n'))
