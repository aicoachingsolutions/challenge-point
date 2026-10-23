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
 *
 * **A record-named provisional realization's choices REPLACE the game form's, line by line, and only by declaration**
 * (15 October 2026, stage K2). His provisional realization for one goal's activity (`corpus.ts`) may need a different
 * answer for a line the game form's file already closes — his review list for the first complete activity asks for
 * *"Field setup and both target areas."*, where the game form's file chose lines for every game. Two answers to one line
 * used to be refused as "chosen twice", which is right and stays right: here an entry of the realization's file takes the
 * game form's entry's place ONLY where it names that file in `replaces`; an entry that closes another file's line
 * without declaring it, or that declares a replacement of an entry that is not there, refuses the input, so order never
 * settles which answer stands. Every replacement is recorded (`replaced`), and the choice itself keeps its `replaces`
 * and `category` into the realization record. Nothing else of the game form's input is touched: its other choices, its
 * instantiations and its bindings are carried as they are, and an instantiation of a claim another file already
 * instantiates is refused rather than doubled. Only the realization a goal's record names is read, so no other game moves.
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'
import { provisionalRealizationNamed } from '../derivation/corpus'
import { DesignationBinding } from '../derivation/designation'
import { KnowledgeSelection, knowledgeKey, realizationOf } from '../derivation/run-bounded-selection'
import { Choice, Instantiation, SatisfiedByEstablished } from './realize'

const INDEX = 'realization-choices-index.json'

export interface SuppliedRealization {
    choices: Choice[]
    instantiations: Instantiation[]
    /**
     * Recorded identifications of one established element with another (`SatisfiedByEstablished`) — added 15
     * October 2026 for the one his reply of that day approved (9.8, "One ball shared between context and game:
     * Approved."). Read from the object's file like its choices, so the object, not the goal, owns it.
     */
    satisfiedByEstablished: SatisfiedByEstablished[]
    /**
     * Which instantiated team holds each setup assignment (`DesignationBinding`; his M2, 15 October 2026) — read from the
     * file of the object that introduces the setup designations, like its choices. Realization checks each one.
     */
    designationBindings: DesignationBinding[]
    /** The files the input was read from, in the order read. For the account, never for a coach. */
    from: string[]
    /**
     * Each line whose game-form entry a record-named provisional realization's entry replaced, by declaration (15 October
     * 2026, stage K2): the line, the file replaced and the file replacing it, the two values, and the replacing reason.
     */
    replaced: { lineId: string; replacedFrom: string; by: string; replacedValue: unknown; value: unknown; because: string }[]
    /**
     * Each line whose game-form entry a record-named provisional realization WITHDREW, by declaration (15 October 2026, stage
     * K5): the realization's own knowledge settles the line, so it is not the game form's to choose. Carried into the
     * rendering fixture (`withdrawnChoices`) so the account can show what was set aside and why.
     */
    withdrawn: { lineId: string; withdrawnFrom: string; by: string; withdrawnValue: unknown; because: string }[]
}

/**
 * No usable realization input: none exists for the selected game form (`missingFor`), so the game cannot be set out; or
 * (15 October 2026, stage K2) the input contradicts itself (`conflicts`) — two answers to one line, or a replacement
 * nobody can trace — which is refused, never resolved by order. `missingFor` is null for a conflict.
 */
export interface NoSuppliedRealization {
    missingFor: string | null
    conflicts?: string[]
}

export const isNoSuppliedRealization = (supplied: SuppliedRealization | NoSuppliedRealization): supplied is NoSuppliedRealization => 'missingFor' in supplied

/** How a realization input file is read: from the knowledge directory. */
const readKnowledgeFile = (name: string): any => JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, name), 'utf8'))

/**
 * `read` is a parameter ONLY so a test can hand this a TEST-ONLY copy of a file (a replacement nobody can trace, say) and
 * see it refused by the same rule (15 October 2026, stage K2); production passes none, and the files are never written.
 */
export function suppliedRealizationFor(selection: KnowledgeSelection, read: (name: string) => any = readKnowledgeFile): SuppliedRealization | NoSuppliedRealization {
    const index = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, INDEX), 'utf8')).byKnowledgeObject as Record<string, string>
    const supplied: SuppliedRealization = { choices: [], instantiations: [], satisfiedByEstablished: [], designationBindings: [], from: [], replaced: [], withdrawn: [] }
    const conflicts: string[] = []
    // Which file closed each line, so a later entry for the same line is told apart from a declared replacement.
    const closedBy = new Map<string, string>()

    // Contracted objects only, in the order selection committed to them: an object with no contract
    // contributes nothing to the game, so it has left nothing open to close.
    for (const object of selection.selected.filter(entry => selection.contracted.includes(entry.id))) {
        const file = index[knowledgeKey(object.id)]
        if (!file) {
            if (object.role === 'game form') return { missingFor: object.id }
            continue
        }
        const contents = read(file)
        for (const choice of (contents.choices ?? []) as Choice[]) {
            // Only a record-named provisional realization may replace; a knowledge object's own file never declares it.
            if ((choice as { replaces?: unknown }).replaces !== undefined) conflicts.push(`${file} declares that its entry for ${choice.lineId} replaces another, and only a provisional realization a goal's record names may replace an entry`)
            if (!closedBy.has(choice.lineId)) closedBy.set(choice.lineId, file)
            supplied.choices.push(choice)
        }
        supplied.instantiations.push(...(contents.instantiations ?? []))
        supplied.satisfiedByEstablished.push(...(contents.satisfiedByEstablished ?? []))
        supplied.designationBindings.push(...(contents.designationBindings ?? []))
        supplied.from.push(file)
    }

    // Stage E (23 October 2026): the realization the build is trying where it threaded one, the record's preferred one otherwise
    // (`realizationOf`), so the choices read are always those of the realization derivation received.
    const provisional = realizationOf(selection)
    if (provisional?.realizationChoices) conflicts.push(...applyProvisionalChoices(supplied, provisional.realizationChoices, read, closedBy))
    return conflicts.length ? { missingFor: null, conflicts } : supplied
}

/**
 * **For tests, and for nothing that serves a coach** (15 October 2026, stage K5): a provisional realization's choices applied
 * to an input assembled WITHOUT a goal's record — the composition a mechanism proof builds (`buildActivityFromKnowledge` with
 * the realization composed in) — by the same rule the record-named path uses, so the proof and the served game can never
 * read the file differently. Returns the conflicts it found; the input is changed in place, as `alterSupplied` lends it.
 */
export function withProvisionalRealizationChoices(supplied: SuppliedRealization, provisionalId: string, read: (name: string) => any = readKnowledgeFile): string[] {
    const closedBy = new Map<string, string>()
    for (const file of supplied.from) for (const choice of (read(file).choices ?? []) as Choice[]) if (!closedBy.has(choice.lineId)) closedBy.set(choice.lineId, file)
    const provisional = provisionalRealizationNamed(provisionalId)
    return provisional?.realizationChoices ? applyProvisionalChoices(supplied, provisional.realizationChoices, read, closedBy) : []
}

/**
 * One provisional realization's choices, applied: each entry closes a line, replaces another file's entry by declaration
 * (stage K2), or — stage K5, 15 October 2026 — WITHDRAWS another file's entry by declaration, for a line the realization's
 * own knowledge settles so that it is no longer the game form's to choose. The one withdrawal today is the possession game's
 * choice of the initial holder of possession, which the start's awardee entails in Play Out from the Back's activity
 * (register version 12, `entailedBy`): left in, realization would refuse a choice for a line that is not open. A withdrawal
 * carries no value, names the file whose entry it withdraws, and is refused where that file has no entry for the line in this
 * game; every withdrawal is recorded (`withdrawn`). Returns the conflicts; nothing is ever settled by order.
 */
function applyProvisionalChoices(supplied: SuppliedRealization, file: string, read: (name: string) => any, closedBy: Map<string, string>): string[] {
    const conflicts: string[] = []
    {
        const contents = read(file)
        for (const choice of (contents.choices ?? []) as (Choice & { replaces?: unknown; withdraws?: unknown })[]) {
            const earlier = closedBy.get(choice.lineId)
            if (choice.withdraws !== undefined) {
                const named = String(choice.withdraws)
                if (choice.replaces !== undefined || (choice as { value?: unknown }).value !== undefined) conflicts.push(`${file}'s entry for ${choice.lineId} withdraws ${named}'s and also gives a value or a replacement; a withdrawal says only that the line is not the other file's to close`)
                else if (named === file || !earlier || earlier !== named) conflicts.push(`${file} withdraws ${named}'s entry for ${choice.lineId}, and ${earlier ? `the line is closed by ${earlier}` : `${named} has no entry for that line in this game`}`)
                else {
                    const at = supplied.choices.findIndex(existing => existing.lineId === choice.lineId)
                    const [withdrawnChoice] = supplied.choices.splice(at, 1)
                    supplied.withdrawn.push({ lineId: choice.lineId, withdrawnFrom: named, by: file, withdrawnValue: withdrawnChoice.value, because: choice.because })
                    closedBy.delete(choice.lineId)
                }
                continue
            }
            const declared = choice.replaces === undefined ? null : String(choice.replaces)
            // K2 review, 15 October 2026: a replacement is of ANOTHER file's entry. Two entries of this file for one line,
            // the later declaring `replaces` with this file's own name, were otherwise settled by order.
            if (declared === file) {
                conflicts.push(`${file} declares that its entry for ${choice.lineId} replaces its own entry; a file gives one answer to a line, and replaces only another file's`)
                continue
            }
            if (earlier && declared !== earlier) {
                conflicts.push(
                    declared
                        ? `${file} declares that its entry for ${choice.lineId} replaces ${declared}'s, and the line is closed by ${earlier}`
                        : `both ${earlier} and ${file} close ${choice.lineId}, and ${file} does not declare that it replaces ${earlier}'s entry`,
                )
                continue
            }
            if (!earlier && declared) {
                conflicts.push(`${file} declares that its entry for ${choice.lineId} replaces ${declared}'s, and ${declared} has no entry for that line in this game`)
                continue
            }
            if (earlier) {
                const at = supplied.choices.findIndex(existing => existing.lineId === choice.lineId)
                const [replacedChoice] = supplied.choices.splice(at, 1)
                supplied.replaced.push({ lineId: choice.lineId, replacedFrom: earlier, by: file, replacedValue: replacedChoice.value, value: choice.value, because: choice.because })
            }
            closedBy.set(choice.lineId, file)
            supplied.choices.push(choice)
        }
        const instantiated = new Set(supplied.instantiations.map(instantiation => instantiation.classId))
        for (const instantiation of (contents.instantiations ?? []) as Instantiation[]) {
            if (instantiated.has(instantiation.classId)) conflicts.push(`${file} instantiates ${instantiation.classId}, which another file already instantiates; members are never doubled`)
            else supplied.instantiations.push(instantiation)
        }
        supplied.satisfiedByEstablished.push(...(contents.satisfiedByEstablished ?? []))
        supplied.designationBindings.push(...(contents.designationBindings ?? []))
        supplied.from.push(file)
    }
    return conflicts
}
