/**
 * The realization input for a selection: the choices and instantiations that close what its knowledge leaves
 * open, looked up by the KNOWLEDGE OBJECT that leaves it open.
 *
 * **It was looked up by Learning Goal, and that was wrong in a way that only showed with a second goal.** The
 * builder read `a04-realization-choices.json` because the goal was A04. Every line that file closes is the
 * possession game form's (`c:restated:GF2:…`) or the game's own (`game::…`); none of it is about the goal.
 * So the two other goals that select the same game form and nothing else contracted — the identical game —
 * had no file, and would have been refused for want of decisions that had already been made.
 *
 * So the question asked here is the one the files actually answer: *what does this knowledge object leave
 * open, and how was it closed?* A game form must have an answer, because a game cannot be set out without
 * one; any other contracted object may have one, and its choices are added to the game form's.
 *
 * **Nothing is defaulted and nothing is filtered.** A choice for a line this game does not hold open is
 * passed to realization exactly as written and realization refuses it, as it always has — a file that no
 * longer fits its game should be seen to no longer fit. Which object owns which file is data
 * (`realization-choices-index.json`), so no knowledge object is named in this module.
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'
import { KnowledgeSelection, knowledgeKey } from '../derivation/run-bounded-selection'
import { Choice, Instantiation } from './realize'

const INDEX = 'realization-choices-index.json'

export interface SuppliedRealization {
    choices: Choice[]
    instantiations: Instantiation[]
    /** The files the input was read from, in the order read. For the account, never for a coach. */
    from: string[]
}

/** No realization input exists for the selected game form, so the game cannot be set out. */
export interface NoSuppliedRealization {
    missingFor: string
}

export const isNoSuppliedRealization = (supplied: SuppliedRealization | NoSuppliedRealization): supplied is NoSuppliedRealization =>
    typeof (supplied as NoSuppliedRealization).missingFor === 'string'

export function suppliedRealizationFor(selection: KnowledgeSelection): SuppliedRealization | NoSuppliedRealization {
    const index = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, INDEX), 'utf8')).byKnowledgeObject as Record<string, string>
    const supplied: SuppliedRealization = { choices: [], instantiations: [], from: [] }

    // Contracted objects only, in the order selection committed to them: an object with no contract
    // contributes nothing to the game, so it has left nothing open to close.
    for (const object of selection.selected.filter(entry => selection.contracted.includes(entry.id))) {
        const file = index[knowledgeKey(object.id)]
        if (!file) {
            if (object.role === 'game form') return { missingFor: object.id }
            continue
        }
        const read = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, file), 'utf8'))
        supplied.choices.push(...(read.choices ?? []))
        supplied.instantiations.push(...(read.instantiations ?? []))
        supplied.from.push(file)
    }
    return supplied
}
