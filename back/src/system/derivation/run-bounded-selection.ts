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
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { GameProblemAuthority, guidedSelectionHints } from '../sport-module/guided-selection'
import { constraintBalanceBucket, generateSelection, isSelectionKnowledgeGap, SelectionKnowledgeGap } from '../test-library'
import type { ConstraintPoolAccount } from '../test-library/types'
import { CORPUS_ENVELOPE, loadCorpusContracts, loadRegister, loadSportProfile } from './corpus'
import { isStampedHalt } from './emit'
import { runDerivation, runStages0to10 } from './engine'
import { knowledgeKey } from './knowledge-key'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { DerivationInput, LoadedContract } from './types'

/**
 * Library ids and contract ids spell the same object differently; neither is rewritten.
 *
 * Exported 13 October as `knowledgeKey`, because a second thing now has to ask "which knowledge object is
 * this?" — the builder looks up a game form's realization choices by it — and a second spelling rule beside
 * this one is how the two would come to disagree. Since 14 October 2026 the rule itself lives in
 * `knowledge-key.ts`, so selection can apply holds by it too; it is re-exported here unchanged.
 */
export { knowledgeKey }
const key = knowledgeKey

/**
 * What a set of selected knowledge objects comes to at the contract boundary: which of them have a
 * contribution contract and which do not. Affordance lenses are a reasoning dimension and are in neither.
 *
 * Its own type since 13 October because a mechanism demonstration is exactly this and nothing more — it
 * names its knowledge objects and involves no Learning Goal — so the pathway from derivation onward has to
 * be able to run on it without a goal having been invented to carry it.
 */
export interface KnowledgeSelection {
    /** Every knowledge object selected, with the part it plays. */
    selected: { id: string; role: string }[]
    contracted: string[]
    missing: string[]
}

/** Split selected knowledge into what is contracted and what is not. One rule, for a goal and for a demonstration. */
export function contractCoverage(selected: { id: string; role: string }[]): Pick<KnowledgeSelection, 'contracted' | 'missing'> {
    const available = new Map(loadCorpusContracts().map(c => [key(c.contractId), c.contractId]))
    const knowledge = selected.filter(s => !s.role.startsWith('affordance lens'))
    return {
        contracted: knowledge.filter(s => available.has(key(s.id))).map(s => s.id),
        missing: knowledge.filter(s => !available.has(key(s.id))).map(s => s.id),
    }
}

export interface BoundedSelection extends KnowledgeSelection {
    goalId: string
    goalName: string
    /**
     * The signal groups the selection resolved through, as selection reported them. Carried since
     * 13 October so the account of an activity reads them from the run instead of from a literal: the
     * pilot's account named its group in a string constant, which stayed true only while nobody moved it.
     */
    matchedSignalGroups: string[]
    practiceSituations: { id: string; name: string }[]
    /** The situation the coach chose, resolved to its canonical identity (never to prose). */
    chosenSituation: { id: string; name: string } | null
    /**
     * Whose Game Problem this selection was made for: the approved translation, or UNRESOLVED where none
     * is approved. Carried so the account of an activity can say which, and never has to infer it.
     */
    gameProblem: GameProblemAuthority
    /** The Representative Performance Context the goal routes to, which limited the game forms. */
    contextId: string | null
    /**
     * What the constraints were drawn from: the goal's own candidates (always, since his ruling of 14
     * October), which of them his rulings hold, and which roles none of them fills — each a knowledge gap,
     * reported and never filled. READ from the selection trace, where `constraintPoolFor` put it, so the
     * account cannot disagree with what selection did: there is no second computation to drift.
     */
    constraintPool: ConstraintPoolAccount
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

/** The part a goal's Representative Performance Context plays in a selection. A role name, not a sport term. */
export const CONTEXT_ROLE = 'representative performance context'

/**
 * A Learning Goal whose designated knowledge cannot be combined into a selection (`SelectionKnowledgeGap`),
 * with what this boundary adds: the goal's name, its Game Problem authority and its context. Thrown by
 * `selectFor` so the builder can refuse at `selection` with a filled account.
 */
export class GoalSelectionGap extends Error {
    constructor(
        readonly gap: SelectionKnowledgeGap,
        readonly goalName: string,
        readonly gameProblem: GameProblemAuthority,
        readonly contextId: string | null,
    ) {
        super(gap.message)
        this.name = 'GoalSelectionGap'
    }
}

export function selectFor(goalId: string, situationId: string | null = null): BoundedSelection {
    const goal: any = sessionPlanningModel.learningGoal(goalId)
    if (!goal) throw new Error(`no such learning goal: ${goalId}`)
    const text = `${goal['Learning Goal']}. ${goal['Coach Definition']}`
    /**
     * **The same hints the application gives selection, from the same function.** This used to pass the
     * wording's hints straight through, which left out the context rule the application route applies —
     * so seven of the thirteen goals were selected here onto a game form the application would never
     * have chosen, and every figure reported from this pathway for a month described a selection no
     * coach could reach. An approved rule carried by one caller and not the other is the same loss as
     * an authored field dropped by a projection; it is closed the same way, by having one source.
     */
    const guided = guidedSelectionHints(goalId, text)
    let result: any
    try {
        result = generateSelection({ learningGoals: [text], learningGoalId: goalId } as any, guided.hints)
    } catch (error) {
        // A knowledge gap is reported WITH what this boundary alone knows — the goal's Game Problem authority
        // and its context — so the account of the refusal is filled from the same computation, not a second one.
        if (isSelectionKnowledgeGap(error)) throw new GoalSelectionGap(error, String(goal['Learning Goal']), guided.gameProblem, guided.contextId)
        throw error
    }

    /**
     * **A selection that did not resolve must not proceed as a successful Learning Goal selection.**
     * Owner ruling, 8 October: *"fallback and unresolved selections must not proceed as successful
     * Learning Goal selections."*
     *
     * This is the only boundary that can enforce it. The status and the goal identity coexist here
     * and nowhere downstream — `BoundedSelection` carries no resolution, `DerivationInput` carries no
     * goal, and the resolved game's provenance carries neither — so every later stage operates on
     * knowledge objects with no idea which goal asked for them. Refusing anywhere else would mean
     * adding a field for the sole purpose of carrying the bad news.
     *
     * It is a throw because that is already what this boundary does for the other two ways a
     * goal/selection relationship can be invalid, and because nothing but our own harness reads it:
     * the coach-facing route refuses earlier, in its own register, with suggestions.
     *
     * `fallback` means a general default package was committed; `unresolved` means the commitment is
     * not traceable to coach intent at all. Both are "not matched", and neither may be presented as
     * the goal having been satisfied.
     */
    const resolutionStatus = String(result.resolution?.status ?? 'unresolved')
    if (resolutionStatus !== 'matched') {
        throw new Error(
            `${goalId} did not resolve: selection status is ${resolutionStatus}, so no package may be presented as satisfying this Learning Goal. ` +
                `${String(result.resolution?.reason ?? '').trim()}`
        )
    }

    const selected: { id: string; role: string }[] = []
    const add = (id: unknown, role: string) => {
        if (id) selected.push({ id: String(id), role })
    }
    add(result.archetype?.id, 'game form')
    // Each constraint by its own balance role. These were labelled by POSITION in the list (first
    // foundation, second shaping, third consequence), which named a second foundation constraint a shaping
    // one — wrong for A03 before 14 October, and wrong for every goal whose candidates hold no shaping
    // constraint once selection stopped borrowing one.
    ;(result.constraints ?? []).forEach((c: any) => add(c?.id, `${constraintBalanceBucket(c)} constraint`))
    // Affordance lenses are a reasoning dimension, not authored knowledge with a contract. They are
    // listed so the account of what was selected is complete, and excluded from what is derived.
    ;(result.affordanceLenses ?? []).forEach((l: any) => add(l?.id, 'affordance lens (not contracted knowledge)'))

    // The coach's situation, as a canonical knowledge object among the others.
    const chosenSituation = resolveSituation(goalId, situationId)
    if (chosenSituation) selected.push({ id: chosenSituation.id, role: 'practice situation' })

    /**
     * **The goal's context, as a selected knowledge object — so its approved scoring governs the game.**
     * Christian, 14 October 2026: *"the Primary Scoring Event and qualifying condition approved for each
     * Representative Performance Context should govern the generated activity. This is particularly
     * important because scoring defines what constitutes success within the environment."*
     *
     * Selection used to hand derivation a game form and constraints and never the context, so every activity
     * served here was scored by a set-up choice whatever the context approved — three of them (A04, D01, D03)
     * on an event their context does not approve, D01 and D03 being exactly his counter-example of a
     * defending goal measured by the attacking team's progression. Carried here, the context goes through the
     * same contract rule as every other object: contracted, its contract shapes the game (RPC-001 loads by
     * `knowledgeKey`); not contracted, it is reported missing and the builder refuses the goal before
     * derivation rather than serve it scored some other way.
     */
    if (guided.contextId) selected.push({ id: guided.contextId, role: CONTEXT_ROLE })

    return {
        goalId,
        goalName: String(goal['Learning Goal']),
        matchedSignalGroups: ((result.resolution?.matchedSignalGroups ?? []) as unknown[]).map(String),
        selected,
        ...contractCoverage(selected),
        practiceSituations: (sessionPlanningModel.practiceSituationsFor(goalId) as any[]).map(p => ({ id: p.ID, name: p['Practice Situation'] })),
        chosenSituation,
        gameProblem: guided.gameProblem,
        contextId: guided.contextId,
        constraintPool: result.selectionTrace.constraintPool as ConstraintPoolAccount,
    }
}

/**
 * The derivation input a selection implies: the contracts for the objects it chose, and nothing else.
 *
 * It reads only WHICH objects were selected, so it takes exactly that — a goal's selection and a mechanism
 * demonstration's are the same thing to derivation, which has never known what a goal is.
 */
export function derivationInputFor(selection: Pick<KnowledgeSelection, 'selected'>): DerivationInput {
    const wanted = new Set(selection.selected.map(s => key(s.id)))
    const selected: LoadedContract[] = loadCorpusContracts().filter(c => wanted.has(key(c.contractId)))

    /**
     * **The Sport Profile is added unconditionally, because it is constitutive rather than selected.**
     *
     * Authorized 6 October. Every other contract here was chosen for this goal; this one is the environment the
     * goal runs in, so filtering it by the selection would be asking an activity to select the sport it is played
     * in — which is the thing his boundary ruling says an activity should not have to do.
     *
     * **It goes into BOTH lists, and that is not incidental.** A contract present in `contracts` but absent from
     * `selection` still forms its elements and contributes its lines — it only loses its entry in
     * `versions.objects`, the stamp that exists so a stored result can be known stale when a list's membership
     * changes. Omitting it there would have left the provenance stamp silent about the thing the game most
     * depends on.
     */
    const contracts: LoadedContract[] = [...selected, ...loadSportProfile()]
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

/**
 * **Only when this file is the script that was run.** `require.main === module` is not enough: the deployed
 * server is one bundle, in which every module is the main one, so that test alone made the server print this
 * report for A05 at start-up — and exit if the run halted. The entry script's own name is what distinguishes
 * `npm run bounded:selection` from a server that merely imports `selectFor`.
 */
const runAsScript = require.main === module && String(process.argv[1] ?? '').includes('run-bounded-selection')

if (runAsScript) {
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
