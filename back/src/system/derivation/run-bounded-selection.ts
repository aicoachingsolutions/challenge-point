/**
 * The first real selection across the deterministic boundary.
 *
 * Everything before this has derived from the stage-B conformance corpus: eight knowledge objects
 * restated **together**, for a conformance check, with their non-claims written against each other.
 * This runs the pathway a coach actually triggers —
 *
 *     Session Planning goal → knowledge selection → derivation → gates → resolved game
 *
 * — over whichever of the selected objects have contracts, and says plainly which do not.
 *
 * **It bridges nothing it is not entitled to bridge.** Selection returns a game form and three
 * constraints; this hands the engine the contracts for exactly those, in the session envelope, and
 * asks for nothing else. Where a selected object has no contract it is reported as missing, never
 * substituted, and never quietly dropped from the account of what the game was supposed to contain.
 *
 * Run: npm run bounded:selection -- A05
 */
import { deriveInputConstraints } from '../input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { generateSelection } from '../test-library'
import { CORPUS_ENVELOPE, loadCorpusContracts, loadRegister } from './corpus'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { DerivationInput, LoadedContract } from './types'

/** Library ids and contract ids spell the same object differently; neither is rewritten. */
const key = (id: string) =>
    String(id)
        .replace(/^(restated|blind):/, '')
        .replace(/^tl-v0-constraint-/, '')
        .toUpperCase()

export interface BoundedSelection {
    goalId: string
    goalName: string
    /** Every knowledge object the live selection committed to. */
    selected: { id: string; role: string }[]
    contracted: string[]
    missing: string[]
    practiceSituations: { id: string; name: string }[]
}

export function selectFor(goalId: string): BoundedSelection {
    const goal: any = sessionPlanningModel.learningGoal(goalId)
    if (!goal) throw new Error(`no such learning goal: ${goalId}`)
    const text = `${goal['Learning Goal']}. ${goal['Coach Definition']}`
    const result: any = generateSelection({ learningGoals: [text], learningGoalId: goalId } as any, deriveInputConstraints(text))

    const selected: { id: string; role: string }[] = []
    const add = (id: unknown, role: string) => {
        if (id) selected.push({ id: String(id), role })
    }
    add(result.archetype?.id, 'game form')
    // Selection returns the constraint package as a list, in its balance order.
    const buckets = ['foundation constraint', 'shaping constraint', 'consequence constraint']
    ;(result.constraints ?? []).forEach((c: any, i: number) => add(c?.id, buckets[i] ?? 'constraint'))
    // Affordance lenses are a reasoning dimension, not authored knowledge with a contract. They are
    // listed so the account of what was selected is complete, and excluded from what is derived.
    ;(result.affordanceLenses ?? []).forEach((l: any) => add(l?.id, 'affordance lens (not contracted knowledge)'))

    const available = new Map(loadCorpusContracts().map(c => [key(c.contractId), c.contractId]))
    const knowledge = selected.filter(s => !s.role.startsWith('affordance lens'))
    return {
        goalId,
        goalName: String(goal['Learning Goal']),
        selected,
        contracted: knowledge.filter(s => available.has(key(s.id))).map(s => s.id),
        missing: knowledge.filter(s => !available.has(key(s.id))).map(s => s.id),
        practiceSituations: (sessionPlanningModel.practiceSituationsFor(goalId) as any[]).map(p => ({ id: p.ID, name: p['Practice Situation'] })),
    }
}

/** The derivation input a selection implies: the contracts for the objects it chose, and nothing else. */
export function derivationInputFor(selection: BoundedSelection): DerivationInput {
    const wanted = new Set(selection.selected.map(s => key(s.id)))
    const contracts: LoadedContract[] = loadCorpusContracts().filter(c => wanted.has(key(c.contractId)))
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: 'stage-b' })),
        contracts,
        envelope: CORPUS_ENVELOPE,
        register: loadRegister(),
        derivationRules: { version: 'rev-5' },
    }
}

if (require.main === module) {
    const goalId = process.argv.find(a => /^[A-Z]+[0-9]+$/.test(a)) ?? 'A05'
    const selection = selectFor(goalId)

    console.log(`SELECTION — ${selection.goalId}  ${selection.goalName}`)
    console.log('-'.repeat(60))
    for (const s of selection.selected) console.log(`  ${s.role.padEnd(22)} ${s.id}`)
    console.log(`\n  contracted  ${selection.contracted.length}/${selection.selected.length}: ${selection.contracted.join(', ') || 'none'}`)
    console.log(`  MISSING     ${selection.missing.length}: ${selection.missing.join(', ') || 'none'}`)
    console.log(`  practice situations offered: ${selection.practiceSituations.map(p => `${p.id} ${p.name}`).join(' · ') || 'none'}`)
    console.log('  note: selection carries no practice situation, so none reaches derivation.')

    const input = derivationInputFor(selection)
    const result = runDerivation(input)
    if (isStampedHalt(result)) {
        console.log('\nthe run halted; there is no game to assemble')
        process.exit(1)
    }
    const staged: any = runStages0to10(input)
    const game = assembleResolvedGame(result, staged.classes, indexRegister(input.register))

    console.log(`\nDERIVATION — ${input.contracts.length} contract(s)`)
    console.log('-'.repeat(60))
    console.log(`  lines            ${result.resolution.length}`)
    console.log(`  derived          ${game.counts.derived}`)
    console.log(`  open             ${game.counts.open}`)
    console.log(`  not established  ${game.counts.notEstablished}`)
    console.log(`  existential      ${game.counts.existential}`)
    console.log(`  collisions       ${result.failures.filter(f => f.kind === 'COLLISION').length}`)

    console.log('\nGATE A')
    console.log('-'.repeat(60))
    console.log(`  verdict          ${result.gates.gateA.verdict}`)
    for (const check of result.gates.gateA.checks) {
        if (check.verdict === 'PASS') continue
        console.log(`  ${check.verdict.padEnd(15)} ${check.checkId.padEnd(26)} ${check.why}`)
    }

    console.log('\nRESOLVED GAME')
    console.log('-'.repeat(60))
    console.log(JSON.stringify(game.game, null, 1).split('\n').map(l => `  ${l}`).join('\n'))

    console.log('\nOPEN FOR REALIZATION')
    console.log('-'.repeat(60))
    for (const choice of game.open) console.log(`  ${choice.kind.padEnd(13)} ${choice.path}`)

    console.log('\nNOT ESTABLISHED, by row')
    console.log('-'.repeat(60))
    const byRow = new Map<string, number>()
    for (const entry of game.notEstablished) {
        const row = entry.lineId.split('::').pop()!
        byRow.set(row, (byRow.get(row) ?? 0) + 1)
    }
    for (const [row, n] of [...byRow.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${row}`)
}
