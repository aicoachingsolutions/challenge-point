/**
 * Print the resolved game the corpus run describes.
 *
 * Like `run-corpus-diagnostic`, this prints and computes nothing: the assembly is in
 * `resolved-game.ts` and the values are the run's. `--json` emits the object itself, for the day
 * something downstream consumes it.
 *
 * Run: npm run corpus:game  ·  npm run corpus:game -- --json
 */
import { corpusInput } from './corpus'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame, ResolvedGame } from './resolved-game'

function render(game: ResolvedGame): string {
    const out: string[] = []
    const rule = (title: string) => out.push(`\n${title}\n${'-'.repeat(title.length)}`)

    out.push('RESOLVED GAME — assembled from the emitted result')
    out.push('Every value below is a value the run derived. Nothing here is recomputed.')

    rule('PROVENANCE')
    out.push(`  input digest                 ${game.provenance.inputDigest}`)
    out.push(`  engine                       ${game.provenance.engineVersion}`)
    out.push(`  derivation rules             ${game.provenance.derivationRulesVersion}`)

    rule('COHERENCE')
    out.push(`  Gate A                       ${game.coherence.gateA}`)
    out.push(`  failing checks               ${game.coherence.failingChecks.join(', ') || 'none'}`)
    out.push(`  may a realization proceed    ${game.coherence.mayRealize ? 'yes' : 'no'} — Gate A's own claim, restated`)

    rule('THE GAME')
    out.push(
        JSON.stringify(game.game, null, 1)
            .split('\n')
            .map(l => `  ${l}`)
            .join('\n'),
    )

    rule(`OPEN FOR REALIZATION (${game.open.length})`)
    out.push('  An authorized degree of freedom, not a gap. The realization layer closes these.')
    for (const choice of game.open) {
        out.push(`  ${choice.kind.padEnd(13)} ${choice.path}`)
        if (choice.permittedBy) out.push(`                ${choice.permittedBy.authority}: ${choice.permittedBy.choiceSpace}`)
        if (choice.permitted) out.push(`                choose one of ${JSON.stringify(choice.permitted)}`)
        for (const bound of choice.bounds) out.push(`                bounded by ${JSON.stringify(bound)}`)
    }

    rule(`ASSERTED TO EXIST, NOT DESCRIBED (${game.existential.length})`)
    out.push('  SD-97 — something says a member of this collection exists and individuates none.')
    out.push('  A realized game must satisfy these; nothing here can say which element does.')
    for (const claim of game.existential) {
        const card = claim.cardinality.min === null && claim.cardinality.max === null ? 'at least one' : `min ${claim.cardinality.min ?? '-'}, max ${claim.cardinality.max ?? '-'}`
        out.push(`  ${claim.path.padEnd(22)} ${card.padEnd(18)} ${claim.from.contractId}::${claim.from.itemId}`)
    }

    rule(`NOT ESTABLISHED (${game.notEstablished.length})`)
    out.push('  Neither derived nor open. Absence is not a decision, so each is named.')
    out.push('  One reason code per declaration (AM-23, extended 29 September), in a precedence where a')
    out.push('  statement outranks a silence. The declarations are kept beside the code as the evidence.')
    const byReason = new Map<string, number>()
    for (const entry of game.notEstablished) {
        const key = `${entry.reason ?? entry.verdict}${entry.declared.length ? `   declared: ${entry.declared.join('+')}` : '   declared: nothing reaches this row'}`
        byReason.set(key, (byReason.get(key) ?? 0) + 1)
    }
    for (const [reason, count] of [...byReason.entries()].sort()) out.push(`  ${String(count).padStart(4)}  ${reason}`)

    return out.join('\n')
}

const input = corpusInput()
const result = runDerivation(input)
if (isStampedHalt(result)) {
    console.error('the run halted; there is no game to assemble')
    process.exit(1)
}
const staged: any = runStages0to10(input)
const game = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)
console.log(process.argv.includes('--json') ? JSON.stringify(game, null, 1) : render(game))
