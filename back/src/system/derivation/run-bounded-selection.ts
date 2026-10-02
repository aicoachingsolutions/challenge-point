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
    /** The situation the coach chose, resolved to its canonical identity (never to prose). */
    chosenSituation: { id: string; name: string } | null
}

/**
 * **The Practice Situation bridge.** A coach who chooses *Play Out from the Back → From Goal Kicks*
 * has made a planning choice that changes the game: the situation carries a transition, the restart's
 * team and the Objects area. Until now it reached generation as a sentence in a prompt and reached
 * derivation not at all, so that game had no goal kick in it.
 *
 * The bridge is deliberately the smallest shape that fixes it, and it is the one he asked to be
 * tested first:
 *
 *     coach choice → canonical Practice Situation identity → selected contracted knowledge → derivation
 *
 * **Derivation learns nothing about the Session Planning Model.** The planning side resolves the
 * choice to a canonical id; that id names a knowledge object like any other; and the engine receives
 * it through the contract mechanism it already has. No prose crosses the boundary, and nothing
 * interprets the situation's definition text.
 *
 * A situation the coach did not choose contributes nothing, and a chosen one with no contract is
 * reported missing rather than dropped — the same rule as every other selected object.
 */
function resolveSituation(goalId: string, situationId: string | null): { id: string; name: string } | null {
    if (!situationId) return null
    const offered = sessionPlanningModel.practiceSituationsFor(goalId) as any[]
    const match = offered.find(p => String(p.ID) === situationId)
    if (!match) throw new Error(`${situationId} is not a practice situation of ${goalId}: the planning model offers ${offered.map(p => p.ID).join(', ') || 'none'}`)
    return { id: String(match.ID), name: String(match['Practice Situation']) }
}

export function selectFor(goalId: string, situationId: string | null = null): BoundedSelection {
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

    // The coach's situation, as a canonical knowledge object among the others.
    const chosenSituation = resolveSituation(goalId, situationId)
    if (chosenSituation) selected.push({ id: chosenSituation.id, role: 'practice situation' })

    const available = new Map(loadCorpusContracts().map(c => [key(c.contractId), c.contractId]))
    const knowledge = selected.filter(s => !s.role.startsWith('affordance lens'))
    return {
        goalId,
        goalName: String(goal['Learning Goal']),
        selected,
        contracted: knowledge.filter(s => available.has(key(s.id))).map(s => s.id),
        missing: knowledge.filter(s => !available.has(key(s.id))).map(s => s.id),
        practiceSituations: (sessionPlanningModel.practiceSituationsFor(goalId) as any[]).map(p => ({ id: p.ID, name: p['Practice Situation'] })),
        chosenSituation,
    }
}

/** The derivation input a selection implies: the contracts for the objects it chose, and nothing else. */
/**
 * **TEMPORARY, and named so it cannot be lost: a run without the Wide Zone value modifier.**
 *
 * Ruling C34 authored the advantage as a value modifier on the existing primary event. The modifier is
 * correct knowledge and it cannot be EVALUATED: its referents are the authored prose *"both wide channels of
 * this contract, each a referent"*, and SD-58 forbids comparing open text as identity, so
 * `GA-MODIFIER-OVERLAP` is NOT_EVALUABLE and realization is not authorized.
 *
 * Typing those referents is the canonical remedy (the SD-98 precedent) and **it has no working form today**:
 * an array of two typed references is read as a permitted SET, so the line becomes a choice between the two
 * channels and inverts the authored "both"; two items each typing one referent COLLIDE under SD-02. V8b's
 * registered valueType says "one property per referent", and neither route implements that.
 *
 * So this drops the modifier's items **from a caller's own copy of the input, never from the corpus**, to keep
 * realization's acceptance conditions and the rendering pathway under test while that representational
 * question is with him. The blocker itself is pinned in `realize.unit.ts`.
 *
 * **Delete this function once a condition on two referents is representable.** Every user is a call site, so
 * removing it will not compile until each is revisited.
 */
export function derivationInputWithoutWideZoneModifier(selection: BoundedSelection): DerivationInput {
    const input = derivationInputFor(selection)
    return {
        ...input,
        contracts: input.contracts.map(contract => ({
            ...contract,
            items: (contract.items ?? []).filter(item => !String((item as { itemId?: unknown }).itemId ?? '').startsWith('WIDEZONE-18')),
        })),
    }
}

export function derivationInputFor(selection: BoundedSelection): DerivationInput {
    const wanted = new Set(selection.selected.map(s => key(s.id)))
    const contracts: LoadedContract[] = loadCorpusContracts().filter(c => wanted.has(key(c.contractId)))
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: 'stage-b' })),
        contracts,
        // **A fresh copy per call.** `CORPUS_ENVELOPE` is a module constant, so returning it directly
        // handed every caller the SAME object: anything that varied the envelope — a test exercising a
        // different player count, a script trying a second area — silently changed every later run in
        // the process. A session envelope is session input; two runs do not share one.
        envelope: JSON.parse(JSON.stringify(CORPUS_ENVELOPE)),
        register: loadRegister(),
        derivationRules: { version: 'rev-5' },
    }
}

if (require.main === module) {
    const goalId = process.argv.find(a => /^[A-Z]+[0-9]+$/.test(a)) ?? 'A05'
    const situationId = process.argv.find(a => /^[A-Z]+[0-9]+-[0-9]+$/.test(a)) ?? null
    const selection = selectFor(goalId, situationId)

    console.log(`SELECTION — ${selection.goalId}  ${selection.goalName}`)
    console.log('-'.repeat(60))
    for (const s of selection.selected) console.log(`  ${s.role.padEnd(22)} ${s.id}`)
    console.log(`\n  contracted  ${selection.contracted.length}/${selection.selected.length}: ${selection.contracted.join(', ') || 'none'}`)
    console.log(`  MISSING     ${selection.missing.length}: ${selection.missing.join(', ') || 'none'}`)
    console.log(`  practice situations offered: ${selection.practiceSituations.map(p => `${p.id} ${p.name}`).join(' · ') || 'none'}`)
    console.log(
        selection.chosenSituation
            ? `  chosen situation: ${selection.chosenSituation.id} ${selection.chosenSituation.name} — resolved to its canonical identity and selected as knowledge`
            : '  chosen situation: none',
    )

    const input = derivationInputFor(selection)
    const result = runDerivation(input)
    if (isStampedHalt(result)) {
        console.log('\nthe run halted; there is no game to assemble')
        process.exit(1)
    }
    const staged: any = runStages0to10(input)
    const game = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)

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
