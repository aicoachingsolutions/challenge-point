/**
 * **What a developer runner derives, said beside what it prints** — added 24 October 2026 (the K3 review's should-fix).
 *
 * `npm run realize` and `npm run first:game` derive ONE game: the realization the selection is built with (`realizationOf`: the one
 * threaded, otherwise the record's first alternative that can be tried) and NO role block. The served build (the review page and the live
 * route, `build-activity.ts`) tries the record's alternatives in their order, moving to the next only where the one tried does not apply to
 * the session, and builds a game played in role blocks once per block. Since K3 a record's first alternative can be a game that is built
 * only per block, so what a runner prints for it (a Gate A FAIL, failed lines, a refusal) says nothing about the served build. These lines
 * say which realization was derived, which alternatives the record lists, and whether the game has role blocks, so nobody reads such a
 * result as a regression. They change nothing that is derived: the runners derive exactly as before and print these lines beside it.
 *
 * Nothing here names a goal, a realization or a sport noun: all of it is read from the selection's record and the base derivation.
 */
import { runStages0to5 } from '../derivation/engine'
import { indexRegister } from '../derivation/register'
import { roleBlocksOf } from '../derivation/role-blocks'
import { realizationOf } from '../derivation/run-bounded-selection'
import type { KnowledgeSelection } from '../derivation/run-bounded-selection'
import { provisionalRealizationNamed } from '../derivation/corpus'
import type { DerivationInput } from '../derivation/types'
import { realizationAlternativesOf } from '../test-library/learning-goal-authorizations'

type RunnerSelection = Pick<KnowledgeSelection, 'authorization' | 'realization'>

/**
 * The selection with one of its record's alternatives threaded through it (`--realization <id>`), exactly as the build threads the
 * alternative it is trying; the selection unchanged where no id is given. An id the record does not list is refused, never derived.
 */
export function threadRunnerRealization<T extends RunnerSelection>(selection: T, id: string | null | undefined): T {
    if (!id) return selection
    const listed = realizationAlternativesOf(selection.authorization).map(alternative => alternative.realization)
    if (!listed.includes(id)) throw new Error(`--realization ${id}: the selection's record lists ${listed.length ? listed.join(', ') : 'no realization'}, so ${id} is not derived`)
    return { ...selection, realization: provisionalRealizationNamed(id) }
}

/** The lines a runner prints before its result: which realization it derived, the record's alternatives, and the game's role blocks. */
export function runnerDerivationNote(selection: RunnerSelection, input: DerivationInput): string[] {
    const lines: string[] = []
    const alternatives = realizationAlternativesOf(selection.authorization)
    const derived = realizationOf(selection)
    const threaded = selection.realization !== undefined
    lines.push(
        derived
            ? `realization derived   ${derived.provisionalId} (${threaded ? 'threaded with --realization' : "the record's first alternative that can be tried"})`
            : `realization derived   none (${threaded ? 'none threaded' : 'no record names one'})`,
    )
    if (alternatives.length > 1) {
        lines.push(`record's alternatives ${alternatives.map(a => (a.selectable ? a.realization : `${a.realization} (listed, waiting on ${a.gaps.join(', ')}: never tried)`)).join(', then ')}`)
        lines.push('                      the served build (the review page and the live route) tries them in this order, moving to the next only')
        lines.push('                      where the one tried does not apply to the session; derive another with --realization <id>')
    }
    const base: any = runStages0to5(input)
    const found = base.run.halted || !base.derived ? null : roleBlocksOf(base.classes, base.derived.lines, indexRegister(input.register))
    if (!found) lines.push('role blocks           not read: the base derivation halted')
    else if (found.kind === 'REFUSED') lines.push(`role blocks           refused: ${found.why.join('; ')}`)
    else if (found.kind === 'NONE') lines.push('role blocks           none: derived as one game, as the served build derives it')
    else {
        lines.push(`role blocks           ${found.blocks.length} (${found.blocks.map(block => block.blockId).join('; ')}), and this runner derives with NO role block`)
        lines.push('                      the served build derives this game once per block, so a line only a block binds is open or failed here:')
        lines.push('                      a Gate A FAIL, failed lines or a refusal below say nothing about the served per-block build')
        lines.push('                      (npm run snapshot records what the review page and the live route serve)')
    }
    return lines
}
