/**
 * The first game, end to end, with nothing between the stages hidden.
 *
 *     selection → resolved game → realization request → realization decisions → concrete game
 *               → post-realization Gate A
 *
 * He asked for the complete trace, so this prints every stage's own output rather than a summary of
 * it: what selection committed to, what the knowledge established, what it left open and on whose
 * authority, what realization decided and why, the game that resulted, and what the invariants make of
 * it once their subjects exist.
 *
 * Run: npm run first:game            · A04, the authorized game
 *      npm run first:game -- A05     · any other goal, to see why it is not
 */
import fs from 'node:fs'
import path from 'node:path'

import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { derivationInputFor, selectFor } from '../derivation/run-bounded-selection'
import { runPostRealizationGates } from './post-realization-gate'
import { checkRealization, isRefused, realize, Realized } from './realize'

const goalId = process.argv.find(a => /^[A-Z]+[0-9]+$/.test(a)) ?? 'A04'
const CHOICES = path.resolve(__dirname, '../../../../docs/audits/a04-realization-choices.json')

const rule = (title: string) => console.log(`\n${title}\n${'='.repeat(title.length)}`)

// ---------------------------------------------------------------------------------------------
rule(`1 · SELECTION — ${goalId}`)
const selection = selectFor(goalId, null)
console.log(`  ${selection.goalName}`)
for (const s of selection.selected) console.log(`    ${s.role.padEnd(24)} ${s.id}`)
console.log(`  contracted ${selection.contracted.length}/${selection.selected.length}; missing ${selection.missing.length}: ${selection.missing.join(', ') || 'none'}`)

// ---------------------------------------------------------------------------------------------
rule('2 · RESOLVED GAME')
const input = derivationInputFor(selection)
const result = runDerivation(input)
if (isStampedHalt(result)) {
    console.error('the run halted')
    process.exit(1)
}
const staged: any = runStages0to10(input)
const resolved = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)

console.log(`  contracts ${input.contracts.length}  ·  lines ${result.resolution.length}`)
console.log(`  derived ${resolved.counts.derived}  ·  open ${resolved.counts.open}  ·  existential ${resolved.counts.existential}  ·  not established ${resolved.counts.notEstablished}`)
console.log(`  collisions ${result.failures.filter(f => f.kind === 'COLLISION').length}`)
console.log(`\n  pre-realization      ${resolved.coherence.preRealization}`)
console.log(`  realization authorized ${resolved.coherence.realizationAuthorized ? 'YES' : 'NO'}`)
for (const why of resolved.coherence.notAuthorizedBecause) console.log(`      not, because: ${why}`)
console.log(`  post-realization still required (${resolved.coherence.postRealizationRequired.length}):`)
for (const owed of resolved.coherence.postRealizationRequired) console.log(`      ${owed.checkId.padEnd(22)} ${owed.clause}\n          owes: ${owed.owes}`)

if (!resolved.coherence.realizationAuthorized) {
    console.log('\n  Realization does not proceed. Nothing below is run.')
    process.exit(0)
}

// ---------------------------------------------------------------------------------------------
rule('3 · REALIZATION REQUEST — what the game asks of realization, and on whose authority')
for (const choice of resolved.open) {
    console.log(`  CHOOSE       ${choice.path}`)
    console.log(`               ${choice.lineId}  (${choice.kind})`)
    if (choice.permitted) console.log(`               one of ${JSON.stringify(choice.permitted)}`)
    else if (choice.bounds.length) console.log(`               bounded by ${JSON.stringify(choice.bounds)}`)
    if (choice.permittedBy) console.log(`               authority ${choice.permittedBy.authority}`)
}
for (const claim of resolved.existential) {
    const card = claim.cardinality.min === null && claim.cardinality.max === null ? 'at least one' : `min ${claim.cardinality.min ?? '-'}, max ${claim.cardinality.max ?? '-'}`
    const verb = claim.shortfall === 0 ? 'SATISFIED  ' : 'INSTANTIATE'
    console.log(`  ${verb}  ${claim.path}  (${card})  from ${claim.from.contractId}::${claim.from.itemId}`)
    if (claim.satisfiedBy.length) console.log(`               already established: ${claim.satisfiedBy.join(', ')}`)
    console.log(`               ${claim.shortfall === 0 ? 'nothing owed — no member may be instantiated for it' : `${claim.shortfall} member(s) owed`}`)
}
for (const condition of resolved.jointConditions) {
    console.log(`  JOINTLY      ${condition.kind} over ${condition.path} on ${condition.rows.join('/')}  —  "${condition.asAuthored}"`)
}

// ---------------------------------------------------------------------------------------------
rule('4 · REALIZATION DECISIONS')
const supplied = JSON.parse(fs.readFileSync(CHOICES, 'utf8'))
const realizationResult = realize(resolved, supplied.choices, supplied.instantiations, indexRegister(input.register), input.envelope)
if (isRefused(realizationResult)) {
    console.log(`  REFUSED — ${realizationResult.because.length} reason(s):`)
    for (const because of realizationResult.because) console.log(`      · ${because}`)
    process.exit(1)
}
const realized = realizationResult as Realized
for (const choice of realized.record.choices) {
    console.log(`  ${choice.lineId}`)
    console.log(`      -> ${JSON.stringify(choice.value)}`)
    console.log(`      at ${choice.path};  bound ${choice.boundCheck};  authority ${choice.authority ?? 'none carried'}`)
    console.log(`      because ${choice.because}`)
}
for (const instantiation of realized.record.instantiations) {
    console.log(`  ${instantiation.classId} -> ${JSON.stringify(instantiation.member)} at ${instantiation.path}`)
    console.log(`      because ${instantiation.because}`)
}
if (realized.record.unverified.length) console.log(`  unverified against a qualitative bound (SD-15): ${realized.record.unverified.join(', ')}`)

rule('5 · ACCEPTANCE — nothing lost, nothing invented, nothing closed without authority')
const checks = checkRealization(resolved, realized)
const report = (label: string, problems: string[]) => {
    console.log(`  ${label.padEnd(36)} ${problems.length === 0 ? 'ok' : `${problems.length} VIOLATION(S)`}`)
    for (const problem of problems) console.log(`      · ${problem}`)
}
report('nothing closed without authority', checks.nothingClosedWithoutAuthority)
report('nothing derived is lost', checks.nothingLost)
report('nothing is invented', checks.nothingInvented)
const accepted = !checks.nothingClosedWithoutAuthority.length && !checks.nothingLost.length && !checks.nothingInvented.length

// ---------------------------------------------------------------------------------------------
rule('6 · CONCRETE GAME')
console.log(
    JSON.stringify(realized.game, null, 1)
        .split('\n')
        .map(l => `  ${l}`)
        .join('\n'),
)

// ---------------------------------------------------------------------------------------------
rule('7 · POST-REALIZATION GATE A — the same invariants, now that their subjects exist')
const post = runPostRealizationGates(
    { ...staged.gateContext, contracts: input.contracts },
    resolved.coherence.postRealizationRequired.map(o => ({ checkId: o.checkId, clause: o.clause })),
    realized,
)
for (const entry of post.owed) {
    console.log(`  ${String(entry.verdict).padEnd(30)} ${entry.checkId.padEnd(22)} ${entry.clause}`)
    if (entry.verdict !== 'PASS' && entry.why) console.log(`      ${entry.why}`)
}
console.log(`\n  validated (render-eligible)  ${post.validated ? 'YES' : 'NO'}`)
for (const outstanding of post.outstanding) console.log(`      outstanding: ${outstanding}`)

rule('RESULT')
console.log(`  realization acceptance      ${accepted ? 'PASSED' : 'FAILED'}`)
console.log(`  post-realization Gate A     ${post.validated ? 'PASSED' : 'NOT PASSED'}`)
console.log(`  render-eligible             ${accepted && post.validated ? 'YES' : 'NO'}`)
