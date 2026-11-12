/**
 * **The reasoning-disconnection safeguards, the per-run disposition of the selection checks, and the earliest consequential blocker** —
 * review pathway only, TEST-ONLY review evidence (stage 9, DESIGN-9 sections 3, 4 and 6; Christian's authorization, pasted 10 November 2026,
 * section 3):
 *   "I would like a test to fail when a downstream decision contradicts its authorized input or relies on an unsupported replacement."
 *
 * Pure. It reads plain data a unit test assembles from a handoff run (`safeguardRunOf`: the handoff's result, the chain's answer and the facts
 * the test states, such as the authorized set of the record and the clauses of the cited approved row), and returns verdicts. It imports
 * nothing of the checked chain, adds no library, layer or monitoring, changes no check and names no goal, Game Problem, context, Game Form,
 * law or row id: every such value arrives as data.
 *
 * What it holds:
 *   - `OWNERSHIP_TABLE`: each consequential decision with its owner, input, output and authority (principle A, decision ownership).
 *   - `ownershipOf`: one verdict per decision row for one run. CONSUMED needs the value equal to the upstream decision AND the run's own
 *     evidence that the decision was made from it (the chain's TEST-ONLY consumption record: the forms its scorer was handed, the record's
 *     pool, the Game Problem that governed its hints); equal values without that evidence are AGREES_INDEPENDENTLY, never consumption
 *     (principle C). A Game Problem the chain carries from Step 1 and no decision of the chain reads reads CARRIED_NOT_READ, never CONSUMED
 *     (Christian's authorization, section 3: a citation the engine ignores is insufficient); since stage W1 (a), 11 November 2026, Step 1's
 *     Game Problem governs the chain's lens hints and matched signals, and the chain records which Game Problem did, so the Game Problem and
 *     the hints read CONSUMED where that record names Step 1's (CARRIED_NOT_READ remains for a run without that record). The other verdicts: CONTRADICTED,
 *     REFUSED_ON_OWN_CHOICE, UNAUTHORIZED_SOURCE, ENGINE_RULE_DECIDED (with its attribution, on a refusal whose basis is NOT KNOWLEDGE),
 *     CARRIED (every open item of the clause derived and resolved, no declaration replaced) / CARRIED_UNDER_TREATMENT / WITHHELD_BY_TREATMENT /
 *     REFUSED_ON_CLAUSE_LINE / CITED_NOT_CARRIED per clause of the cited approved row and for the account's display, NOT_REACHED (the run
 *     stopped before the decision, and its refusal cites none of the clause's lines), LEGITIMATE_CHAIN_DECISION (the chain's own rows),
 *     MISSING (a reached stage without its field, a withheld item that entered derivation, or a selection refusal no rule can be attributed to
 *     because its basis is not NOT KNOWLEDGE), K2_NOT_TAKEN (stage W1 (b), 11 November 2026: the review pathway proposed no manipulation, so
 *     its K2 result applies, and a TEST-ONLY record of ours stood in for it; detected, never a pass). The constraints read CONSUMED on K2's
 *     result only as the empty set, with no record beside it, no manipulation proposed, and K2's limit carried.
 *   - `classOf`: PASS, DETECTED (printed as a detected disconnection, never a pass: a declared TEST-ONLY treatment withholding a clause, or
 *     carrying it by a replaced declaration; a clause whose own line the run's refusal cites; the carried Game Problem no decision reads; an
 *     engine rule kept under the authorization's section 5 refusing after consumption) or VIOLATION.
 *   - `unlisted` / `stale`: the findings no open-disconnection entry lists, and the entries no finding supports (the list is data; an entry may
 *     name its measured run and verdict pairs, and the rule of each engine refusal, and then lists only those).
 *   - `DISPOSITION`: every selection check, kept-enforced or bypassed (the numerical size rule only), with its source, origin and authority,
 *     and `dispositionOf`, the per-run column: ran, not run on this path (the zero branch, or no combination enumerated), bypassed, or not
 *     reached.
 *   - `blockerSequence`: the stops of the paths in chain order, which ones a later path passes (a later stage, or a later check of the same
 *     stage), and the earliest that remains, named in the failure-source categories Christian listed (Christian's words, handed in as data).
 *   - `safeguardsText`: the report's lines. Double quotation marks are never printed (category names are printed bare).
 */
import { ChainAnswer, HandoffResult } from './handoff'

// ---------------------------------------------------------------------------------------------------------------------------------------
// Decision ownership (principle A)
// ---------------------------------------------------------------------------------------------------------------------------------------

export const DECISION_ROWS = ['GAME_PROBLEM', 'GAME_PROBLEM_HINTS', 'CONTEXT', 'GAME_FORM', 'CONSTRAINTS', 'SELECTION_OUTCOME', 'SCORING', 'SCORING_DISPLAY', 'REALIZATION'] as const
export type DecisionRow = (typeof DECISION_ROWS)[number]

/** Each consequential decision: who owns it, what it reads, what it decides, and on whose authority (OURS, for Christian's review). */
export const OWNERSHIP_TABLE: Array<{ row: DecisionRow; decision: string; owner: string; input: string; output: string; authority: string }> = [
    {
        row: 'GAME_PROBLEM',
        decision: 'the Game Problem',
        owner: 'Step 1',
        input: 'the goal id, the approved translation or a scoped ruling, the routing',
        output: 'the resolved primary Game Problem, carried by the chain beside its own reading and read by the chain\'s hints (the next row)',
        authority: 'the approved translation, or the scoped ruling it rests on',
    },
    {
        row: 'GAME_PROBLEM_HINTS',
        decision: 'the Game Problem reading that governs the engine lens hints and matched signals',
        owner: 'Step 1 (since stage W1 (a), 11 November 2026, on the experiment path)',
        input: 'Step 1\'s resolved primary Game Problem, handed to the guided selection hints as the approved one (TEST-ONLY); the planning model\'s reading stays in the account beside it',
        output: 'the lens hints and the matched signals the resolution check reads, recorded with the Game Problem that governed them',
        authority: 'Christian\'s rule of 13 October 2026 (the approved Game Problem translation governs where it disagrees with the wording), applied with Step 1\'s resolution of that translation',
    },
    {
        row: 'CONTEXT',
        decision: 'the Representative Performance Context',
        owner: 'Step 1',
        input: 'the routing of the planning model',
        output: 'the context whose approved rows govern scoring',
        authority: 'the routing; the chain reads it itself (no consumption record exists for it)',
    },
    {
        row: 'GAME_FORM',
        decision: 'Game Form eligibility and choice',
        owner: 'Step 2, under D3 over CANDIDATE cells',
        input: 'Step 1, the context form rows, the form Game Problem cells, D3',
        output: 'SELECTED, retained alternatives or none; the chain\'s candidate forms filtered to it (an intersection)',
        authority: 'Step 2 under D3; each cell keeps its own grade (a CANDIDATE cell is never printed as approved, preferred or sufficient)',
    },
    {
        row: 'CONSTRAINTS',
        decision: 'the constraints (manipulations)',
        owner: 'the upstream result the chain takes, one of: Christian\'s authorization record (AUTHORIZATION_RECORD); the review pathway\'s K2 result where it proposes no manipulation (REVIEW_PATHWAY_K2, the empty set only, review-only, since stage W1 (b)); or a TEST-ONLY record whose finding is ours (AUTHORIZATION_RECORD, printed distinctly)',
        input: 'the record\'s authorized set (the record route), or K2\'s result with its limit (in place of a per-goal record, never beside one); where the review pathway proposes no manipulation and a TEST-ONLY record of ours stood in, K2_NOT_TAKEN',
        output: 'the selection\'s candidate pool and the constraints built',
        authority: 'Christian\'s ruling where Christian\'s record governs; K2 (approved for review-only use, received 7 November 2026) with E5 (received 3 November 2026), our reading, where its result is taken; none where the record is a TEST-ONLY one of ours',
    },
    {
        row: 'SELECTION_OUTCOME',
        decision: 'whether the selection commits',
        owner: 'the owned decisions above; an engine rule may refuse only as a check kept under the authorization\'s section 5',
        input: 'the consumed form, the authorized set and the engine lenses',
        output: 'a committed selection, or a refusal with the rule that refused',
        authority: 'none found for the engine rules (reported with source and authority)',
    },
    {
        row: 'SCORING',
        decision: 'the context\'s approved identity and scoring, clause by clause',
        owner: 'the context\'s approved rows, through our CANDIDATE restatement',
        input: 'the restated items that constitute each clause of the cited approved row',
        output: 'the clause carried into the built game, withheld by a declared treatment, or not carried',
        authority: 'the approved row; the restatement is ours and unreviewed',
    },
    {
        row: 'SCORING_DISPLAY',
        decision: 'what the account displays about the approved condition',
        owner: 'the same approved row',
        input: 'the account\'s context display',
        output: 'whether the account says the condition is in this activity',
        authority: 'the approved row; a display is never a pass',
    },
    {
        row: 'REALIZATION',
        decision: 'realization choices and justified defaults',
        owner: 'the chain, legitimately',
        input: 'the consumed contracts and the realization choices',
        output: 'the configuration lines, the text and the diagram',
        authority: 'derives; closes open lines within authored bounds (graded line by line by the handoff)',
    },
]

// ---------------------------------------------------------------------------------------------------------------------------------------
// The run, as the check reads it
// ---------------------------------------------------------------------------------------------------------------------------------------

export const VERDICTS = [
    'CONSUMED',
    'CARRIED_NOT_READ',
    'AGREES_INDEPENDENTLY',
    'CONTRADICTED',
    'REFUSED_ON_OWN_CHOICE',
    'UNAUTHORIZED_SOURCE',
    'ENGINE_RULE_DECIDED',
    'CARRIED',
    'CARRIED_UNDER_TREATMENT',
    'WITHHELD_BY_TREATMENT',
    'REFUSED_ON_CLAUSE_LINE',
    'NOT_REACHED',
    'CITED_NOT_CARRIED',
    'LEGITIMATE_CHAIN_DECISION',
    'MISSING',
    'K2_NOT_TAKEN',
] as const
export type Verdict = (typeof VERDICTS)[number]

/** The chain's stages in order (the handoff's own stop first). A stage the order does not hold is refused, never guessed. */
export const STAGE_ORDER = ['handoff (form)', 'selection', 'knowledge', 'session', 'structure', 'realization', 'validation', 'communication', 'served'] as const

/** An engine rule's attribution, from the exported package check re-run on the run's own form, lens combinations and set (the unit test). */
export interface EngineRuleAttribution {
    /** The disposition row that refused (its `id`), or null where nothing could be attributed. */
    rule: string | null
    /** What the attribution read, in a few words (e.g. every lens combination refused with the same reason). */
    how: string
}

export interface SafeguardRun {
    runId: string
    /** The run's request consumed Steps 1 and 2 (the experiment path); otherwise the legacy route. */
    experiment: boolean
    /** The decisions as their owners gave them: Step 1's primary and context, Step 2's form, the record's authorized set. */
    given: {
        gameProblemId: string | null
        contextId: string | null
        formId: string | null
        /** The authorized set of the record the run's case governs by; null where no record governs (the goal's own candidates, labelled VOCABULARY_POOL). */
        authorizedSet: string[] | null
        recordKind: 'CHRISTIANS_RECORD' | 'TEST_ONLY_RECORD' | 'NONE'
        /** Constraint ids the case declares as TEST-ONLY relationship stand-ins (labelled, never knowledge). */
        standIns: string[]
        /**
         * Stage W1 (b): the manipulations the review pathway handed on (placed, or entering by the record route), each on a relationship or its
         * TEST-ONLY stand-in, read from the handoff's own manipulation entries; empty where it proposed none, which is where K2 applies.
         */
        proposed: string[]
    }
    handoffStop: string | null
    chain: null | {
        outcome: string
        stage: string | null
        reasons: string[]
        refusalVerdict: string | null
        /** The chain's own form pick as its selection returned it (null where the selection returned nothing). */
        ownPick: string[] | null
        form: string | null
        gameProblemId: string | null
        gameProblemStatus: string | null
        contextId: string | null
        constraints: string[]
        constraintAuthority: string | null
        lenses: string[]
        /**
         * Stage W1 (a): `hintsGameProblemId`, the Game Problem the chain recorded as governing its lens hints (null where it recorded none).
         * Stage W1 (b): `k2`, the review pathway's K2 result as the chain recorded it (its basis, set, limit and citation), or null.
         */
        consumption: null | { gameProblemId: string | null; gameProblemSource: string | null; formCandidatesScored: string[]; formCandidatesFrom: string; constraintAuthority: string; constraintCandidateIds: string[]; sizeRuleBypassed: boolean; hintsGameProblemId: string | null; lensCandidateIds: string[]; hintsSignals: string[]; k2: { basis: string; set: string[]; limit: string; cited: string } | null }
        contextInThisActivity: boolean | null
        scoringCondition: { state: string; rowId: string | null; carried: boolean } | null
    }
    /** The clauses of the cited approved row and what became of their constituting items; null where the run cites no such row. */
    scoring: null | {
        rowId: string
        clauses: Array<{ clause: string; items: string[] }>
        /** Items that entered derivation (the contracts the chain derived from). */
        derived: string[]
        /** Items a line of the built game that establishes something rests on, or that the chain records as shaping a line it built. */
        resting: string[]
        /** The lines of an item (line id c:<contract>:<item>::<row>) that establish nothing (NOT_ESTABLISHED). */
        unestablished: Array<{ itemId: string; lineId: string }>
        /** Items resolved: resting, and no line of the item establishes nothing. */
        resolved: string[]
        /** Items withheld by a declared TEST-ONLY treatment, with the treatment. */
        withheld: Array<{ itemId: string; treatmentId: string }>
        /** Declaration replacements by declared TEST-ONLY treatments: the clause, the treatment and the register row whose declaration it replaced. */
        declarationTreatments: Array<{ selectorClause: string; treatmentId: string; row: string | null }>
        /** The items a line of which the run's refusal cites (its refusal basis's cited lines, or else its reasons), with the line cited. */
        refusedOn: Array<{ itemId: string; ref: string }>
    }
    engineRule: EngineRuleAttribution | null
}

/** What the test states beside a handoff run (every id arrives here, as data). */
export interface SafeguardFacts {
    authorizedSet: string[] | null
    recordKind: SafeguardRun['given']['recordKind']
    standIns?: string[]
    scoring?: { contractId: string; rowId: string; clauses: Array<{ clause: string; items: string[] }> } | null
    engineRule?: EngineRuleAttribution | null
}

/** The run as the check reads it, from the handoff's result, the chain's answer (null where the handoff stopped first) and the test's facts. */
export function safeguardRunOf(r: HandoffResult, a: ChainAnswer | null, experiment: boolean, facts: SafeguardFacts): SafeguardRun {
    const scoring = facts.scoring ?? null
    const ref = (itemId: string) => (scoring ? `${scoring.contractId} ${itemId}` : itemId)
    const allItems = scoring ? scoring.clauses.flatMap((c) => c.items) : []
    const derived = scoring && a ? allItems.filter((id) => a.contracts.some((c) => c.contractId === scoring.contractId && c.origin === 'DRAFT_STORE' && c.items.some((i) => i.itemId === id))) : []
    const resting = scoring ? allItems.filter((id) => r.lines.some((l) => l.kind !== 'NOT_ESTABLISHED' && l.premises.some((p) => p.ref === ref(id))) || (r.consumption?.draftShaped ?? []).some((s) => s.by.some((b) => b.split(' ').slice(0, 2).join(' ') === ref(id)))) : []
    const lineOf = (itemId: string) => (scoring ? `c:${scoring.contractId}:${itemId}::` : '')
    const unestablished = scoring ? allItems.flatMap((id) => r.lines.filter((l) => l.kind === 'NOT_ESTABLISHED' && l.lineId.indexOf(lineOf(id)) === 0).map((l) => ({ itemId: id, lineId: l.lineId }))) : []
    // DESIGN-9 section 3, 'its lines resolved': an item is resolved only when a line rests on it and no line of it establishes nothing.
    const resolved = resting.filter((id) => !unestablished.some((u) => u.itemId === id))
    const withheld = scoring
        ? r.testOnlyTreatments.filter((t) => t.kind === 'WITHHOLD_ITEMS' && t.contractId === scoring.contractId).flatMap((t) => (t.itemIds ?? []).filter((id) => allItems.indexOf(id) >= 0).map((itemId) => ({ itemId, treatmentId: t.id })))
        : []
    const declarationTreatments = scoring
        ? r.testOnlyTreatments
              .filter((t) => t.kind === 'REPLACE_DECLARATION' && t.contractId === scoring.contractId && t.declaration)
              .map((t) => ({ selectorClause: String(t.declaration!.selector.split('=').slice(1).join('=')), treatmentId: t.id, row: t.declaration!.row ? String(t.declaration!.row) : null }))
        : []
    // The lines the run's refusal cites: the refusal basis's cited lines where it names any, otherwise the chain's reasons (a line is cited as
    // c:<contract>:<item>::<row>; within a reason, up to the next space, comma or semicolon).
    const cited = r.refusalBasis && r.refusalBasis.cited.length ? r.refusalBasis.cited.map((c) => c.ref) : r.chain ? r.chain.reasons : []
    const lineCited = (text: string, prefix: string): string | null => {
        const at = text.indexOf(prefix)
        if (at < 0) return null
        let end = at
        while (end < text.length && ' ,;'.indexOf(text[end]) < 0) end++
        return text.slice(at, end)
    }
    const refusedOn = scoring && r.chain && r.chain.outcome !== 'served' ? allItems.flatMap((id) => cited.map((text) => lineCited(text, lineOf(id))).filter((x): x is string => x !== null).map((ref) => ({ itemId: id, ref }))) : []
    const consumption = a?.consumption ?? null
    return {
        runId: r.caseId,
        experiment,
        given: {
            gameProblemId: r.receive.step1?.primary[0] ?? null,
            contextId: r.receive.step1?.contextId ?? null,
            formId: r.form.formId,
            authorizedSet: facts.authorizedSet === null ? null : [...facts.authorizedSet],
            recordKind: facts.recordKind,
            standIns: [...(facts.standIns ?? [])],
            proposed: r.manipulations.filter((m) => m.premise !== null).map((m) => m.manipulation),
        },
        handoffStop: r.form.stop,
        chain:
            r.chain && a
                ? {
                      outcome: r.chain.outcome,
                      stage: r.chain.stage,
                      reasons: [...r.chain.reasons],
                      refusalVerdict: r.refusalBasis?.verdict ?? null,
                      ownPick: a.scorerPick ? [...a.scorerPick] : null,
                      form: a.account?.gameFormId ?? null,
                      gameProblemId: a.account?.gameProblem?.gameProblemId ?? null,
                      gameProblemStatus: a.account?.gameProblem?.status ?? null,
                      contextId: a.account?.contextId ?? null,
                      constraints: [...(a.account?.constraints ?? [])],
                      constraintAuthority: a.observed?.constraintAuthority ?? null,
                      lenses: [...(a.account?.affordanceLenses ?? [])],
                      consumption: consumption
                          ? {
                                gameProblemId: consumption.gameProblem?.gameProblemId ?? null,
                                gameProblemSource: consumption.gameProblem?.source ?? null,
                                formCandidatesScored: [...consumption.formCandidatesScored],
                                formCandidatesFrom: consumption.formCandidatesFrom,
                                constraintAuthority: consumption.constraintAuthority,
                                constraintCandidateIds: [...consumption.constraintCandidateIds],
                                sizeRuleBypassed: consumption.sizeRuleBypassed,
                                hintsGameProblemId: consumption.hintsGameProblemId ?? null,
                                lensCandidateIds: [...(consumption.lensCandidateIds ?? [])],
                                hintsSignals: [...(consumption.hintsSignals ?? [])],
                                k2: consumption.reviewManipulations ? { basis: consumption.reviewManipulations.basis, set: [...consumption.reviewManipulations.set], limit: consumption.reviewManipulations.limit, cited: consumption.reviewManipulations.cited } : null,
                            }
                          : null,
                      contextInThisActivity: a.observed ? a.observed.contextInThisActivity : null,
                      scoringCondition: a.observed?.scoringCondition ? { ...a.observed.scoringCondition } : null,
                  }
                : null,
        scoring: scoring ? { rowId: scoring.rowId, clauses: scoring.clauses.map((c) => ({ clause: c.clause, items: [...c.items] })), derived, resting, unestablished, resolved, withheld, declarationTreatments, refusedOn } : null,
        engineRule: facts.engineRule ? { ...facts.engineRule } : null,
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The pure check (principles A and C)
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface Finding {
    runId: string
    row: DecisionRow
    /** For SCORING, the clause; otherwise null. */
    clause: string | null
    verdict: Verdict
    why: string
    /** What was consulted beside the decision (printed, never sets a verdict). */
    consulted: string | null
    /** ENGINE_RULE_DECIDED only: the refusing rule is a kept-enforced row of the disposition table; and whether it reads wording-derived lenses. */
    keptRule?: { id: string; source: string; origin: string; readsLenses: boolean } | null
}

const stageIndex = (stage: string): number => {
    const at = (STAGE_ORDER as readonly string[]).indexOf(stage)
    if (at < 0) throw new Error(`safeguards: the stage ${stage} is not in the stage order (fail closed)`)
    return at
}
/** Where a run stopped, as an index into the stage order (served last; the handoff's own stop first). */
export function stopIndexOf(run: SafeguardRun): number {
    if (!run.chain) return stageIndex('handoff (form)')
    return run.chain.outcome === 'served' ? stageIndex('served') : stageIndex(String(run.chain.stage))
}
const sameSet = (a: string[], b: string[]): boolean => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
const list = (xs: string[]): string => (xs.length ? xs.join(', ') : 'none')

/**
 * One verdict per decision row for one run (OURS: the rules of DESIGN-9 section 3, with the three departures the review decided, each described
 * in the header: CARRIED_NOT_READ, REFUSED_ON_CLAUSE_LINE and CARRIED_UNDER_TREATMENT). Pure.
 */
export function ownershipOf(run: SafeguardRun): Finding[] {
    const out: Finding[] = []
    const push = (row: DecisionRow, verdict: Verdict, why: string, consulted: string | null = null, clause: string | null = null, keptRule?: Finding['keptRule']) =>
        out.push({ runId: run.runId, row, clause, verdict, why, consulted, ...(keptRule !== undefined ? { keptRule } : {}) })
    const c = run.chain
    const u = run.given
    const stop = stopIndexOf(run)
    const notRun = run.handoffStop ? `the handoff stopped before the chain (${run.handoffStop})` : 'the chain was not run'
    const x = c?.consumption ?? null

    // The Game Problem: the chain's record of Step 1's value. Where the chain also records that Step 1's value governed its lens hints (stage W1
    // (a)), a decision of the chain read it: CONSUMED. Without that record it is a carried record no decision reads (CARRIED_NOT_READ, a detected
    // disconnection, never CONSUMED: the authorization's section 3, a citation the engine ignores is insufficient).
    const hintsByStep1 = !!x && x.hintsGameProblemId !== null && x.hintsGameProblemId === x.gameProblemId && x.gameProblemSource === 'Step 1 (review pathway)'
    if (!c) push('GAME_PROBLEM', 'NOT_REACHED', notRun)
    else if (x && x.gameProblemId !== null) {
        if (x.gameProblemId !== u.gameProblemId) push('GAME_PROBLEM', 'CONTRADICTED', `the chain carried ${x.gameProblemId} where Step 1 resolved ${u.gameProblemId ?? 'none'}`)
        else if (x.gameProblemSource !== 'Step 1 (review pathway)') push('GAME_PROBLEM', 'AGREES_INDEPENDENTLY', `equal to Step 1, and the chain's record names no Step 1 source (${x.gameProblemSource ?? 'none'})`)
        else if (hintsByStep1)
            push(
                'GAME_PROBLEM',
                'CONSUMED',
                `the chain carries Step 1's ${x.gameProblemId} (source Step 1, review pathway) and its own record shows Step 1's value governed its lens hints and matched signals (row GAME_PROBLEM_HINTS); the planning model's reading stays in the account beside it, never in its place`,
                `the chain's own reading (planning model): ${c.gameProblemStatus ?? 'none'} ${c.gameProblemId ?? 'none'}`,
            )
        else
            push(
                'GAME_PROBLEM',
                'CARRIED_NOT_READ',
                `the chain carries Step 1's ${x.gameProblemId} as a record (source Step 1, review pathway); no decision of the chain reads it (its record names ${x.hintsGameProblemId === null ? 'no Game Problem' : x.hintsGameProblemId} as governing its hints); Step 1's Game Problem reaches the chain's decisions only through Step 2's form (row GAME_FORM)`,
                `the chain's own reading (planning model): ${c.gameProblemStatus ?? 'none'} ${c.gameProblemId ?? 'none'}`,
            )
    } else if (c.gameProblemStatus === null) push('GAME_PROBLEM', 'MISSING', 'the chain was run and its account carries no Game Problem')
    else if (c.gameProblemId === u.gameProblemId) push('GAME_PROBLEM', 'AGREES_INDEPENDENTLY', `the chain's own reading (${c.gameProblemStatus} ${c.gameProblemId}, the planning model, which also governs the hints) equals Step 1's, and nothing records Step 1's value as consumed`)
    else push('GAME_PROBLEM', 'CONTRADICTED', `the chain's own reading is ${c.gameProblemStatus} ${c.gameProblemId ?? 'none'}; Step 1 resolved ${u.gameProblemId ?? 'none'}`)

    // The hint-governing reading (experiment runs only; on the legacy route the row above is that reading). CONSUMED only where the chain's own
    // record names the Game Problem that governed its hints and it is Step 1's (stage W1 (a)); without that record, the planning model's reading.
    if (run.experiment) {
        if (!c) push('GAME_PROBLEM_HINTS', 'NOT_REACHED', notRun)
        else if (x && x.hintsGameProblemId !== null) {
            if (x.hintsGameProblemId !== u.gameProblemId) push('GAME_PROBLEM_HINTS', 'CONTRADICTED', `the chain's record names ${x.hintsGameProblemId} as governing its lens hints and matched signals, where Step 1 resolved ${u.gameProblemId ?? 'none'}`)
            else if (!hintsByStep1) push('GAME_PROBLEM_HINTS', 'AGREES_INDEPENDENTLY', `the chain's record names ${x.hintsGameProblemId} as governing its hints, equal to Step 1's, and does not show it was Step 1's value (the carried value ${x.gameProblemId ?? 'none'}, source ${x.gameProblemSource ?? 'none'})`)
            else
                push(
                    'GAME_PROBLEM_HINTS',
                    'CONSUMED',
                    `Step 1's ${x.hintsGameProblemId} governed the lens hints and matched signals, as the chain's own record shows (lens candidates handed to the selector: ${list(x.lensCandidateIds)}; matched signals: ${list(x.hintsSignals)})`,
                    `the planning model's reading, kept in the account: ${c.gameProblemStatus ?? 'none'} ${c.gameProblemId ?? 'none'}`,
                )
        } else if (c.gameProblemStatus === null) push('GAME_PROBLEM_HINTS', 'MISSING', 'the chain was run and its account carries no Game Problem reading')
        else if (c.gameProblemId === u.gameProblemId) push('GAME_PROBLEM_HINTS', 'AGREES_INDEPENDENTLY', `the planning model's reading (${c.gameProblemStatus} ${c.gameProblemId}) still governs the lens hints and matched signals; it equals Step 1's by agreement, not consumption`)
        else push('GAME_PROBLEM_HINTS', 'CONTRADICTED', `the planning model's reading (${c.gameProblemStatus} ${c.gameProblemId ?? 'none'}) governs the lens hints and matched signals, where Step 1 resolved ${u.gameProblemId ?? 'none'}`)
    }

    // The context.
    if (!c) push('CONTEXT', 'NOT_REACHED', notRun)
    else if (c.contextId === null) push('CONTEXT', u.contextId === null ? 'NOT_REACHED' : 'MISSING', u.contextId === null ? 'no context on either side' : 'the chain was run and its account names no context')
    else if (c.contextId === u.contextId) push('CONTEXT', 'AGREES_INDEPENDENTLY', `the chain reads the routing itself (${c.contextId}); it equals Step 1's, and no record of consumption exists for the context`)
    else push('CONTEXT', 'CONTRADICTED', `the chain's context is ${c.contextId}; Step 1 resolved ${u.contextId ?? 'none'}`)

    // The Game Form.
    let formVerdict: Verdict = 'NOT_REACHED'
    if (!c) push('GAME_FORM', 'NOT_REACHED', notRun)
    else if (c.form === null) {
        formVerdict = 'MISSING'
        push('GAME_FORM', 'MISSING', 'the chain was run and its account names no form')
    } else if (x) {
        const scoredOnly = JSON.stringify(x.formCandidatesScored) === JSON.stringify([u.formId])
        const from = x.formCandidatesFrom === 'SELECTION_TRACE_RANKING' || x.formCandidatesFrom === 'CANDIDATES_HANDED_TO_SELECTOR'
        formVerdict = c.form !== u.formId ? 'CONTRADICTED' : scoredOnly && from ? 'CONSUMED' : 'AGREES_INDEPENDENTLY'
        push(
            'GAME_FORM',
            formVerdict,
            formVerdict === 'CONSUMED'
                ? `the account's form ${c.form} is Step 2's, and the chain's scorer was handed only it (read from ${x.formCandidatesFrom})`
                : formVerdict === 'CONTRADICTED'
                  ? `the chain used ${c.form} where Step 2's form is ${u.formId ?? 'none'}`
                  : `equal to Step 2's ${u.formId}, and the chain's scorer ranked ${list(x.formCandidatesScored)} (read from ${x.formCandidatesFrom})`,
            `the chain's own pick: ${c.ownPick ? list(c.ownPick) : 'none (its selection returned nothing)'}`,
        )
    } else if (c.stage === 'selection') {
        formVerdict = c.form === u.formId ? 'AGREES_INDEPENDENTLY' : 'REFUSED_ON_OWN_CHOICE'
        push('GAME_FORM', formVerdict, formVerdict === 'REFUSED_ON_OWN_CHOICE' ? `the chain refused at selection on its own choice ${c.form} before consuming Step 2's ${u.formId ?? 'none'}` : `the chain refused at selection on its own choice ${c.form}, equal to Step 2's, with nothing consumed`)
    } else {
        const own = c.ownPick && c.ownPick.length ? c.ownPick[0] : c.form
        formVerdict = own === u.formId ? 'AGREES_INDEPENDENTLY' : 'CONTRADICTED'
        push(
            'GAME_FORM',
            formVerdict,
            formVerdict === 'CONTRADICTED'
                ? `the chain's own selection chose ${own} where Step 2's form is ${u.formId ?? 'none'}${c.form !== own ? `; the handoff then placed ${c.form} over it, after the selection had run on ${own}` : ''}`
                : `the chain's own pick ${own} equals Step 2's, and nothing records it as consumed`,
        )
    }

    // The constraints.
    const record = u.recordKind === 'CHRISTIANS_RECORD' ? 'Christian\'s record' : u.recordKind === 'TEST_ONLY_RECORD' ? 'a TEST-ONLY record (finding OURS)' : 'no record'
    if (!c) push('CONSTRAINTS', 'NOT_REACHED', notRun)
    else {
        const outside = u.authorizedSet === null ? c.constraints.filter((id) => u.standIns.indexOf(id) < 0) : c.constraints.filter((id) => u.authorizedSet!.indexOf(id) < 0 && u.standIns.indexOf(id) < 0)
        const unauthorizedAuthority = c.constraints.length > 0 && c.constraintAuthority !== 'AUTHORIZATION_RECORD'
        if (outside.length || unauthorizedAuthority)
            push('CONSTRAINTS', 'UNAUTHORIZED_SOURCE', `${c.constraints.length} built from ${c.constraintAuthority ?? 'no named authority'}${outside.length ? `; outside the authorized set: ${outside.join(', ')}` : ''} (${record})`)
        else if (x) {
            const subset = u.authorizedSet ? u.authorizedSet.filter((id) => c.constraints.indexOf(id) < 0) : []
            const built = stop > stageIndex('selection') ? `built ${list(c.constraints)}${subset.length ? `; authorized and not built: ${subset.join(', ')} (dropped by the commit rule over the bounded search)` : ''}` : 'not built (refused at selection)'
            if (x.constraintAuthority === 'REVIEW_PATHWAY_K2') {
                // Stage W1 (b): the review pathway's K2 result, taken in place of a per-goal record: only the empty set, only where the review
                // pathway proposed no manipulation and no record governs, and only with K2's limit carried beside it.
                if (u.recordKind !== 'NONE') push('CONSTRAINTS', 'CONTRADICTED', `the chain took the review pathway's K2 result beside ${record}: K2's result stands in place of a per-goal record, never beside one`)
                else if (x.constraintCandidateIds.length || u.proposed.length) push('CONSTRAINTS', 'CONTRADICTED', `the chain took the review pathway's K2 result with candidates ${list(x.constraintCandidateIds)} where the review pathway proposed ${list(u.proposed)}: K2 yields no manipulation, so it is taken only as the empty set where none is proposed`)
                else if (!x.k2 || x.k2.set.length || !x.k2.limit) push('CONSTRAINTS', 'MISSING', `the chain's candidates carry REVIEW_PATHWAY_K2 and its record carries ${x.k2 ? 'a non-empty set or no limit' : 'no K2 result'}: K2's limit travels with its result`)
                else push('CONSTRAINTS', 'CONSUMED', `the review pathway's K2 result (no manipulation proposed; basis ${x.k2.basis}, review-only), taken in place of a per-goal authorization record: candidates none; ${built}; K2's limit carried with it into the account (${x.k2.cited})`)
            } else if (x.constraintAuthority !== 'AUTHORIZATION_RECORD') push('CONSTRAINTS', 'UNAUTHORIZED_SOURCE', `the candidates carried ${x.constraintAuthority}, not the record route (${record})`)
            else if (u.authorizedSet === null || !sameSet(x.constraintCandidateIds, u.authorizedSet)) push('CONSTRAINTS', 'CONTRADICTED', `the candidates ${list(x.constraintCandidateIds)} are not the authorized set ${u.authorizedSet ? list(u.authorizedSet) : 'none'} (${record})`)
            else if (u.recordKind === 'TEST_ONLY_RECORD' && !u.proposed.length)
                // Stage W1 (b): the review pathway proposed no manipulation, so K2's result applies; our TEST-ONLY record stood in for it.
                push('CONSTRAINTS', 'K2_NOT_TAKEN', `the review pathway proposed no manipulation, so its K2 result applies (the empty set), and the chain took ${record} in its place (its set ${list(x.constraintCandidateIds)}); ${built} (a detected disconnection, never a pass: the comparison arm)`)
            else push('CONSTRAINTS', 'CONSUMED', `the candidates are exactly the authorized set of ${record} (${list(x.constraintCandidateIds)}); ${built}`)
        } else if (c.stage === 'selection') push('CONSTRAINTS', 'NOT_REACHED', `the chain refused at selection; nothing was built`, `the candidates' authority: ${c.constraintAuthority ?? 'none'}`)
        else push('CONSTRAINTS', 'AGREES_INDEPENDENTLY', `built ${list(c.constraints)} from ${c.constraintAuthority ?? 'no named authority'}, within the authorized set of ${record}; nothing records the set as consumed`)
    }

    // The selection outcome: an engine rule deciding after the form was consumed.
    if (!c) push('SELECTION_OUTCOME', 'NOT_REACHED', notRun)
    else if (c.stage === 'selection' && x && formVerdict === 'CONSUMED' && c.refusalVerdict !== 'NOT KNOWLEDGE')
        // DESIGN-9 section 3 limits ENGINE_RULE_DECIDED to a refusal whose basis is NOT KNOWLEDGE; any other basis fails closed.
        push('SELECTION_OUTCOME', 'MISSING', `refused at selection after consuming the form, on a refusal basis ${c.refusalVerdict ?? 'none'}, not NOT KNOWLEDGE: no engine rule is attributed to it (fails closed)`)
    else if (c.stage === 'selection' && x && formVerdict === 'CONSUMED') {
        const rule = run.engineRule?.rule ? DISPOSITION.find((d) => d.id === run.engineRule!.rule) ?? null : null
        const kept = rule !== null && rule.disposition === 'KEPT_ENFORCED'
        push(
            'SELECTION_OUTCOME',
            'ENGINE_RULE_DECIDED',
            kept
                ? `refused by an engine rule kept under the authorization's section 5 (${rule!.check}); source ${rule!.where}; origin ${rule!.origin}; authority ${rule!.authority}; reads wording-derived lenses: ${rule!.readsLenses ? 'yes' : 'no'}; attributed by ${run.engineRule!.how}`
                : `refused at selection after consuming the form, by a rule not attributed to a kept check (${run.engineRule ? run.engineRule.how : 'no attribution'})`,
            null,
            null,
            kept ? { id: rule!.id, source: rule!.where, origin: rule!.origin, readsLenses: rule!.readsLenses } : null,
        )
    } else if (c.stage === 'selection') push('SELECTION_OUTCOME', 'NOT_REACHED', 'the chain refused at selection before consuming anything; the form row holds the verdict')
    else push('SELECTION_OUTCOME', 'LEGITIMATE_CHAIN_DECISION', c.outcome === 'served' ? 'the selection committed and the chain served the run' : `the selection committed; the chain's own checks then stopped the run at ${c.stage}`)

    // The scoring clauses and the account's display.
    const s = run.scoring
    if (s) {
        const verdicts: Verdict[] = []
        for (const clause of s.clauses) {
            const withheld = s.withheld.filter((w) => clause.items.indexOf(w.itemId) >= 0)
            const open = clause.items.filter((id) => !withheld.some((w) => w.itemId === id))
            const leaked = withheld.filter((w) => s.derived.indexOf(w.itemId) >= 0)
            const refused = s.refusedOn.filter((r) => open.indexOf(r.itemId) >= 0)
            const declared = s.declarationTreatments.filter((d) => d.selectorClause === clause.clause)
            let v: Verdict
            let why: string
            if (leaked.length) {
                // A withholding is read from what derivation received, not only from the declaration.
                v = 'MISSING'
                why = `declared withheld by ${[...new Set(leaked.map((w) => w.treatmentId))].join(', ')}, yet ${leaked.map((w) => w.itemId).join(', ')} entered derivation (the treatment was not applied)`
            } else if (!open.length) {
                v = 'WITHHELD_BY_TREATMENT'
                why = `every constituting item withheld by ${[...new Set(withheld.map((w) => w.treatmentId))].join(', ')} (a detected disconnection, never a pass)`
            } else if (refused.length) {
                // The clause was decided: the run's refusal cites its own line (explicitly unresolved), so it is neither unreached nor a pass.
                v = 'REFUSED_ON_CLAUSE_LINE'
                why = `the chain refused at ${STAGE_ORDER[stop]} on this clause's line(s) ${[...new Set(refused.map((r) => r.ref))].join(', ')}: explicitly unresolved, never a pass`
            } else if (stop <= stageIndex('realization')) {
                v = 'NOT_REACHED'
                why = `no game was built (the run stopped at ${STAGE_ORDER[stop]}), and the refusal cites none of this clause's lines`
            } else {
                // CARRIED only when every open item is derived and resolved; a line the clause's replaced declaration covers is carried only
                // under that treatment; a clause carried with a declaration replaced reads CARRIED_UNDER_TREATMENT, never a pass.
                const carried = open.filter((id) => s.derived.indexOf(id) >= 0 && s.resolved.indexOf(id) >= 0)
                const notCarried = open.filter((id) => carried.indexOf(id) < 0)
                const linesOf = (id: string) => s.unestablished.filter((u) => u.itemId === id).map((u) => u.lineId)
                const coveredBy = (lineId: string) => declared.filter((d) => d.row !== null && lineId.slice(-(`::${d.row}`.length)) === `::${d.row}`)
                const underTreatment = (id: string) => s.derived.indexOf(id) >= 0 && s.resting.indexOf(id) >= 0 && linesOf(id).length > 0 && linesOf(id).every((l) => coveredBy(l).length > 0)
                const treatments = [...new Set(declared.map((d) => d.treatmentId))].join(', ')
                const notCarriedWhy = (id: string) =>
                    `${id} (${s.derived.indexOf(id) < 0 ? 'not derived' : s.resting.indexOf(id) < 0 ? 'derived, and no line rests on it' : `line(s) ${linesOf(id).join(', ')} establish nothing`})`
                if (!notCarried.length && !declared.length) {
                    v = 'CARRIED'
                    why = `${carried.join(', ')} entered derivation and lines of the built game rest on ${carried.length === 1 ? 'it' : 'them'}; none of ${carried.length === 1 ? 'its' : 'their'} lines is NOT_ESTABLISHED`
                } else if (declared.length && notCarried.every(underTreatment)) {
                    v = 'CARRIED_UNDER_TREATMENT'
                    why = `${open.join(', ')} entered derivation and lines of the built game rest on ${open.length === 1 ? 'it' : 'them'}, carried only under ${treatments}, a declaration replaced${notCarried.length ? `: line(s) ${notCarried.flatMap(linesOf).join(', ')} establish nothing` : ''} (a detected disconnection, never a pass)`
                } else {
                    v = 'CITED_NOT_CARRIED'
                    why = carried.length
                        ? `partly carried: ${carried.join(', ')}; not carried: ${notCarried.map(notCarriedWhy).join('; ')}${declared.length ? ` (with a declaration replaced by ${treatments})` : ', with no declared treatment'}`
                        : `cited by the approved row and carried by no line of the built game (${notCarried.map(notCarriedWhy).join('; ')})${declared.length ? ` (with a declaration replaced by ${treatments})` : ', with no declared treatment'}`
                }
            }
            verdicts.push(v)
            push('SCORING', v, why, null, clause.clause)
        }
        const state = c?.scoringCondition ? `the requirement account's state ${c.scoringCondition.state}${c.scoringCondition.state === 'NOT_CLASSIFIED' ? ` (a limitation: no requirement bindings for ${s.rowId}; never a pass)` : ''}` : 'the requirement account is not on this run'
        const underTreatment = s.clauses.filter((_, n) => verdicts[n] === 'CARRIED_UNDER_TREATMENT').map((cl) => cl.clause)
        if (!c) push('SCORING_DISPLAY', 'NOT_REACHED', notRun)
        else if (c.contextInThisActivity === null) push('SCORING_DISPLAY', 'MISSING', 'the chain was run and its account displays no context')
        else if (c.contextInThisActivity && verdicts.some((v) => v !== 'CARRIED'))
            push(
                'SCORING_DISPLAY',
                'CITED_NOT_CARRIED',
                `the account displays the approved condition as in this activity while ${s.clauses.filter((_, n) => verdicts[n] !== 'CARRIED').map((cl) => cl.clause).join(', ')} ${verdicts.filter((v) => v !== 'CARRIED').length === 1 ? 'is' : 'are'} not carried${underTreatment.length ? ` (${underTreatment.join(', ')} only under a declared TEST-ONLY treatment)` : ''}`,
                state,
            )
        else if (c.contextInThisActivity) push('SCORING_DISPLAY', 'CARRIED', 'every clause carried, and the account says so', state)
        else push('SCORING_DISPLAY', 'NOT_REACHED', 'the account does not display the condition as in this activity', state)
    }

    // The chain's own row: a refusal by the realizer itself is the chain's own decision.
    if (!c || stop < stageIndex('realization')) push('REALIZATION', 'NOT_REACHED', !c ? notRun : `no game was built (the run stopped at ${STAGE_ORDER[stop]})`)
    else if (stop === stageIndex('realization')) push('REALIZATION', 'LEGITIMATE_CHAIN_DECISION', `the realizer refused: ${c.reasons.join('; ')}`)
    else push('REALIZATION', 'LEGITIMATE_CHAIN_DECISION', 'the chain closed the open lines within their authored bounds (each line graded by the handoff)')
    return out
}

export const VIOLATION_VERDICTS: Verdict[] = ['AGREES_INDEPENDENTLY', 'CONTRADICTED', 'REFUSED_ON_OWN_CHOICE', 'UNAUTHORIZED_SOURCE', 'CITED_NOT_CARRIED', 'MISSING']

/** The verdicts printed as a detected disconnection, never a pass (beside a kept engine rule's refusal). */
export const DETECTED_VERDICTS: Verdict[] = ['CARRIED_NOT_READ', 'WITHHELD_BY_TREATMENT', 'CARRIED_UNDER_TREATMENT', 'REFUSED_ON_CLAUSE_LINE', 'K2_NOT_TAKEN']

/** PASS, DETECTED (printed as a detected disconnection, never a pass) or VIOLATION. */
export function classOf(f: Finding): 'PASS' | 'DETECTED' | 'VIOLATION' {
    if (VIOLATION_VERDICTS.indexOf(f.verdict) >= 0) return 'VIOLATION'
    if (f.verdict === 'ENGINE_RULE_DECIDED') return f.keptRule ? 'DETECTED' : 'VIOLATION'
    if (DETECTED_VERDICTS.indexOf(f.verdict) >= 0) return 'DETECTED'
    return 'PASS'
}

/** The detected disconnections of a set of findings, counted by verdict (in the order of VERDICTS), for the report. */
export function detectedByVerdict(findings: Finding[]): string {
    const detected = findings.filter((f) => classOf(f) === 'DETECTED')
    return VERDICTS.filter((v) => detected.some((f) => f.verdict === v))
        .map((v) => `${v} ${detected.filter((f) => f.verdict === v).length}`)
        .join(', ')
}

/** A finding an open-disconnection entry must list: every violation, and every detected engine-rule refusal that reads wording-derived lenses. */
export const mustBeListed = (f: Finding): boolean => classOf(f) === 'VIOLATION' || (f.verdict === 'ENGINE_RULE_DECIDED' && !!f.keptRule && f.keptRule.readsLenses)

/** One open disconnection (data: the unit test's list), the findings it lists, and its measured evidence. */
export interface OpenDisconnection {
    id: string
    what: string
    /** EXPERIMENT: entered against the experiment path; LEGACY: the legacy (production) route, reported only. */
    scope: 'EXPERIMENT' | 'LEGACY'
    rows: DecisionRow[]
    verdicts: Verdict[]
    runs: string[]
    /**
     * Optional: the measured (run, verdict) pairs, with the rule each engine refusal was attributed to. Where given, the entry lists only a
     * finding of one of its pairs (never a cross product of its runs and verdicts).
     */
    pairs?: Array<{ run: string; verdict: Verdict; rule?: string }>
    evidence: string
    measured?: { before: string; after: string }
}
const listedBy = (f: Finding, e: OpenDisconnection): boolean => {
    if (e.rows.indexOf(f.row) < 0 || e.verdicts.indexOf(f.verdict) < 0 || e.runs.indexOf(f.runId) < 0) return false
    // An engine refusal no kept check is attributed to is never listed (it fails test 1).
    if (f.verdict === 'ENGINE_RULE_DECIDED' && !f.keptRule) return false
    if (!e.pairs) return true
    return e.pairs.some((p) => p.run === f.runId && p.verdict === f.verdict && (f.verdict !== 'ENGINE_RULE_DECIDED' || p.rule === f.keptRule?.id))
}
/** The findings that must be listed and no entry (of the given scopes) lists. */
export function unlisted(findings: Finding[], entries: OpenDisconnection[], scopes: Array<OpenDisconnection['scope']>): Finding[] {
    const inScope = entries.filter((e) => scopes.indexOf(e.scope) >= 0)
    return findings.filter((f) => mustBeListed(f) && !inScope.some((e) => listedBy(f, e)))
}
/**
 * The (entry, run) pairs no finding supports: an entry naming a run where it is no longer detected is stale. An entry with no verdict is a
 * comparison entry (a change the wording test measures, not a verdict): the test that measures it holds it, not this.
 */
export function stale(findings: Finding[], entries: OpenDisconnection[]): Array<{ entry: string; run: string }> {
    const out: Array<{ entry: string; run: string }> = []
    for (const e of entries.filter((x) => x.verdicts.length)) {
        const pairs: Array<{ run: string; verdict?: Verdict }> = e.pairs ?? e.runs.map((run) => ({ run }))
        for (const p of pairs) if (!findings.some((f) => f.runId === p.run && (p.verdict === undefined || f.verdict === p.verdict) && listedBy(f, e) && mustBeListed(f))) out.push({ entry: e.id, run: p.run })
    }
    return out
}

/** The message test 1 fails with, for one finding (OURS). */
export const ownershipMessage = (f: Finding): string => {
    const owner = OWNERSHIP_TABLE.find((o) => o.row === f.row)
    return `ownership: ${f.runId}: ${owner ? owner.decision : f.row}${f.clause ? ` (${f.clause})` : ''} owned by ${owner ? owner.owner : 'none'}: ${f.verdict}: ${f.why}`
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The disposition of every selection check, per run (DESIGN-9 sections 0, 3 and 4)
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface DispositionRow {
    id: string
    check: string
    where: string
    origin: string
    disposition: 'KEPT_ENFORCED' | 'BYPASSED_SIZE_RULE_ONLY'
    /** Reported with its source and authority under the authorization's section 5 (the role mix and the foundation clause), or as an engine heuristic. */
    reported: string | null
    authority: string
    readsLenses: boolean
    /** What it reads from the wording, in a few words. */
    reads: string
    /** The path it runs on: every selection; a non-empty set only (the zero branch skips it); a committed selection only. */
    path: 'EVERY_SELECTION' | 'NON_EMPTY_SET' | 'COMMITTED_SELECTION' | 'EMPTY_SET'
    /** The words its refusal is recognized by in the package check's reasons (attribution), where it has any. */
    marks: string[]
    /** Its negative control in these runs, or why none. */
    control: string
}

export const DISPOSITION: DispositionRow[] = [
    { id: 'RECORD_POOL', check: 'the pool: the record\'s authorized set replaces the goal\'s own candidate constraints (which no record authorizes; the engine labels their authority VOCABULARY_POOL), minus holds', where: 'generateSelection.ts:135-190; guided-selection.ts (the record route)', origin: 'dc98ecb, 14 October 2026 (authorized constraints only); 1f18a02, 15 October 2026 (the record route)', disposition: 'KEPT_ENFORCED', reported: null, authority: 'Christian\'s 14 and 15 October rulings (constraints only from the goal\'s authorized set)', readsLenses: false, reads: 'nothing of the wording', path: 'EVERY_SELECTION', marks: [], control: 'the quota runs: the pool equals the authorized set (asserted)' },
    { id: 'TOKEN_CHECK', check: 'the token check: the wording must hold a non-stopword token', where: 'generateSelection.ts:931-937', origin: '3980188, 3 May 2026', disposition: 'KEPT_ENFORCED', reported: 'wording-keyed: a wording-only change can trigger it', authority: 'none found; engine rule', readsLenses: false, reads: 'the wording\'s tokens', path: 'EVERY_SELECTION', marks: [], control: 'none run here (no wording without a token is used)' },
    { id: 'LENS_HINTS', check: 'the lens hints and matched signals of the guided selection', where: 'guided-selection.ts:218-246 (governByApprovedGameProblem, :131)', origin: 'c725117, 13 October 2026', disposition: 'KEPT_ENFORCED', reported: 'wording-keyed: the engine lenses (ENGINE_LENS) follow the wording', authority: 'none over an owned decision (the lenses are engine inputs; the context\'s affordance targets were deferred by Christian on 13 September)', readsLenses: true, reads: 'the wording, and the Game Problem that governs the hints (Step 1\'s on the experiment path since stage W1 (a); the planning model\'s on the legacy route)', path: 'EVERY_SELECTION', marks: [], control: 'the wording test: the lens list changes under every rewording (an open disconnection)' },
    { id: 'ZERO_BRANCH', check: 'the zero branch: an evaluated empty set commits lenses with no constraint', where: 'generateSelection.ts:811-815, :1029-1030', origin: '1f18a02 (the branch, then switched by a per-record zeroConstraintRuling) and 487dc32 (the general-principle switch, :1030), 15 October 2026; the review pathway\'s K2 result admitted as an empty set only at :1029 (TEST-ONLY, stage W1 (b), 11 November 2026)', disposition: 'KEPT_ENFORCED', reported: null, authority: 'Christian\'s general principle of 15 October 2026 (a constraint is not mandatory unless justified)', readsLenses: false, reads: 'nothing of the wording', path: 'EMPTY_SET', marks: [], control: 'the base cases (empty set) commit through it' },
    { id: 'SIZE_RULE', check: 'the numerical size rule: 2 to 4 constraints', where: 'generateSelection.ts:719-721 (assertSelectionContract), :835 (the sizes enumerated)', origin: '3980188, 3 May 2026', disposition: 'BYPASSED_SIZE_RULE_ONLY', reported: 'bypassed only under the TEST-ONLY SIZE_RULE_BYPASS treatment (the authorization\'s section 5); under the bypass the sizes enumerated are the set\'s own size and 2 to 4, so for a set of 2 to 4 a one-manipulation subset is never tried (the floor of 2 remains for subsets)', authority: 'none found; engine rule', readsLenses: false, reads: 'nothing of the wording', path: 'NON_EMPTY_SET', marks: [], control: 'a lone manipulation is refused without the bypass and selected with it' },
    { id: 'ROLE_MIX', check: 'the role mix', where: 'generateSelection.ts:590-612, applied :839', origin: '3980188, 3 May 2026 (the rule, :590-612); dc98ecb, 14 October 2026 (its needs read over the goal\'s pool, :819-827, applied :839)', disposition: 'KEPT_ENFORCED', reported: 'reported with its source and authority (the authorization\'s section 5); it refuses no set run here: a set of 1 or 2 is enumerated only whole, and its needs are read over the pool (generateSelection.ts:827, :835-836, :590-612)', authority: 'none found for the rule; the pool-relative reading of its needs is our reading of Christian\'s 14 October ruling (constraints only from the goal\'s designated candidates), not a ruling on the role mix', readsLenses: true, reads: 'the constraint scores of each lens combination (the wording\'s tokens and the lens slugs, generateSelection.ts:572-580, :817-827)', path: 'NON_EMPTY_SET', marks: [], control: 'none needed: read from the code, it refuses no set run here (no observer is added to the selector)' },
    { id: 'FOUNDATION_CLAUSE', check: 'the foundation clause (with its keyword threshold)', where: 'build-constraint-package.ts:614-621 (threshold :147-153); validate-constraint-package.ts:325-327', origin: 'e60a740, 18 April 2026 (the build-constraint-package.ts lines); dc98ecb, 14 October 2026 (validate-constraint-package.ts:325-326: the shaping half removed after Christian\'s 14 October ruling, the foundation half kept, not ruled)', disposition: 'KEPT_ENFORCED', reported: 'reported with its source and authority (the authorization\'s section 5)', authority: 'none found; engine rule (our own comment calls it not ruled)', readsLenses: true, reads: 'the primary lens title (the keyword threshold)', path: 'NON_EMPTY_SET', marks: ['No compatible foundation constraint was found for archetype'], control: 'a lone shaping or consequence manipulation is refused on every lens combination (attribution)' },
    { id: 'PACKAGE_ROW_O', check: 'the package check: a clear relationship to the selected affordance (row o)', where: 'validate-constraint-package.ts:484-493', origin: 'e60a740, 18 April 2026', disposition: 'KEPT_ENFORCED', reported: 'an engine keyword heuristic, reported', authority: 'none found; engine heuristic', readsLenses: true, reads: 'the primary lens title and tag group, and ten words in the members\' own text', path: 'NON_EMPTY_SET', marks: ['does not show a clear relationship to the selected affordance or open problem space'], control: 'the goal\'s own pool members are refused on every lens combination (attribution)' },
    { id: 'PACKAGE_ROW_K', check: 'the package check: each member supports the selected affordance tag group (row k)', where: 'validate-constraint-package.ts:356-367', origin: 'e60a740, 18 April 2026', disposition: 'KEPT_ENFORCED', reported: 'an engine compatibility check, reported', authority: 'UNCONFIRMED (the tag-group data)', readsLenses: true, reads: 'the lens tag group', path: 'NON_EMPTY_SET', marks: ['does not support the selected affordance tag group'], control: 'a consequence member is refused on the reworded lenses (attribution)' },
    { id: 'PACKAGE_OTHER', check: 'the other package checks (rows h-j, l-n, p)', where: 'validate-constraint-package.ts:306-555', origin: 'e60a740, 02adc8b, 5222486', disposition: 'KEPT_ENFORCED', reported: 'engine checks and heuristics, reported', authority: 'none found', readsLenses: true, reads: 'the lenses and the members\' own text', path: 'NON_EMPTY_SET', marks: [], control: 'none refused in these runs' },
    { id: 'BOUNDED_SEARCH', check: 'the bounded search: 3 lenses, 2 constraints per bucket', where: 'generateSelection.ts:635-690', origin: 'ded8aaa, 13 May 2026', disposition: 'KEPT_ENFORCED', reported: 'an engine performance heuristic, reported (it can drop an authorized constraint beyond 2 per bucket)', authority: 'none found; engine heuristic', readsLenses: true, reads: 'the lens and constraint scores', path: 'NON_EMPTY_SET', marks: [], control: 'none needed here (no set holds more than 2 per bucket)' },
    { id: 'LENS_RULE', check: 'the lens rule: 2 or 3 lenses', where: 'generateSelection.ts:704-709, :801', origin: '3980188, 3 May 2026', disposition: 'KEPT_ENFORCED', reported: 'a numerical engine rule on lenses, reported (the authorization\'s section 5 names manipulations only)', authority: 'none found; engine rule', readsLenses: true, reads: 'the lens candidates', path: 'COMMITTED_SELECTION', marks: [], control: 'every committed selection holds 3 lenses' },
    { id: 'COMMIT_RULE', check: 'the commit rule: the highest-scoring possibility, ties to the smallest key', where: 'generateSelection.ts:868-876', origin: '1f01d41, 8 July 2026', disposition: 'KEPT_ENFORCED', reported: 'an engine heuristic, reported (commit all or choose stays open)', authority: 'none found; engine heuristic', readsLenses: true, reads: 'the lens and constraint scores', path: 'COMMITTED_SELECTION', marks: [], control: 'every committed non-empty set was committed whole (asserted)' },
    { id: 'RESOLUTION_STATUS', check: 'the resolution status: a selection that did not resolve is refused', where: 'run-bounded-selection.ts:452', origin: '3a5aeed, 8 October 2026', disposition: 'KEPT_ENFORCED', reported: 'wording-keyed (the matched signals)', authority: 'Christian\'s ruling of 8 October 2026 (unresolved selections must not proceed)', readsLenses: false, reads: 'the matched signals of the wording', path: 'COMMITTED_SELECTION', marks: [], control: 'none refused in these runs' },
]

/** The rule a package refusal is recognized by: the one disposition row whose marks every given reason holds, or null. */
export function ruleOfReasons(reasons: string[]): DispositionRow | null {
    if (!reasons.length) return null
    const hits = DISPOSITION.filter((d) => d.marks.length && reasons.every((reason) => d.marks.some((m) => reason.indexOf(m) >= 0)))
    return hits.length === 1 ? hits[0] : null
}

/** Each check of the disposition table, with whether it ran on this run: ran, not run on this path (the zero branch), bypassed, or not reached. */
export function dispositionOf(run: SafeguardRun): Array<{ id: string; ran: string }> {
    const c = run.chain
    const x = c?.consumption ?? null
    const ids = x ? x.constraintCandidateIds : run.given.authorizedSet ?? null
    // Stage W1 (b): the review pathway's K2 result reaches the zero branch as an evaluated empty set does.
    const recordRoute = x ? x.constraintAuthority === 'AUTHORIZATION_RECORD' || x.constraintAuthority === 'REVIEW_PATHWAY_K2' : c?.constraintAuthority === 'AUTHORIZATION_RECORD'
    const zero = !!c && recordRoute && ids !== null && ids.length === 0
    const committed = !!c && stopIndexOf(run) > stageIndex('selection')
    const zeroWords = 'not run on this path (zero branch, generateSelection.ts:811-815)'
    // A consumed set smaller than 2 (the smallest size generateSelection.ts:1037 enumerates without the bypass) is never enumerated: no
    // combination reaches the role mix or the package checks (generateSelection.ts:835-836 skips every size larger than the pool).
    const unenumerated = !!x && !x.sizeRuleBypassed && ids !== null && ids.length > 0 && ids.length < 2
    const unenumeratedWords = `not run on this path (no combination enumerated: the set holds ${ids ? ids.length : 0}; without the bypass the sizes enumerated are 2 to 4, generateSelection.ts:835-836)`
    const ENUMERATED_ONLY = ['ROLE_MIX', 'FOUNDATION_CLAUSE', 'PACKAGE_ROW_O', 'PACKAGE_ROW_K', 'PACKAGE_OTHER']
    return DISPOSITION.map((d) => {
        if (!c) return { id: d.id, ran: 'not reached (the chain was not run)' }
        if (d.path === 'EVERY_SELECTION') return { id: d.id, ran: 'ran' }
        if (d.path === 'EMPTY_SET') return { id: d.id, ran: zero ? 'ran' : 'not on this path (the set is not empty, or no evaluated record governs)' }
        if (d.path === 'COMMITTED_SELECTION') return { id: d.id, ran: committed ? 'ran' : 'not reached (no selection was committed)' }
        if (zero) return { id: d.id, ran: zeroWords }
        if (unenumerated && ENUMERATED_ONLY.indexOf(d.id) >= 0) return { id: d.id, ran: unenumeratedWords }
        if (d.id === 'SIZE_RULE' && x && x.sizeRuleBypassed) return { id: d.id, ran: 'bypassed (TEST-ONLY): the set\'s own size tried, and the contract admits 1 to its size (a one-manipulation subset of a set of 2 to 4 is not tried)' }
        return { id: d.id, ran: 'ran' }
    })
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The earliest consequential blocker (DESIGN-9 section 6)
// ---------------------------------------------------------------------------------------------------------------------------------------

/**
 * One stop: a path of the experiment or a downstream run, where it stopped, and our reading of its source. The paths come in chain order;
 * each path's text names what it holds, and a later path passes an earlier stop by what it adds (a path may also set a piece aside, so
 * that its own stop shows what that piece closes; its text says so).
 */
export interface Stop {
    id: string
    path: string
    stage: string
    reason: string
    kind: 'PATH' | 'DOWNSTREAM'
    /**
     * Where two paths stop in one stage: the source line of the refusing check (the checks of a stage run in source order; the test holds
     * each line to the source text). A later path passes a stop in the same stage only where both name one and its check comes later.
     */
    within?: number
    /** OURS: the failure-source categories (indices into Christian's words) and why. */
    categories: number[]
    why: string
}

/** The paths in chain order with which a later path passes, the earliest that remains, and the downstream stops (recorded, not investigated). */
export function blockerSequence(stops: Stop[]): { sequence: Array<Stop & { passed: boolean; passedBy: string | null }>; earliest: Stop; downstream: Stop[] } {
    const paths = stops.filter((s) => s.kind === 'PATH')
    if (!paths.length) throw new Error('safeguards: no path stop')
    const past = (p: Stop, s: Stop) => stageIndex(p.stage) > stageIndex(s.stage) || (p.stage === s.stage && s.within !== undefined && p.within !== undefined && p.within > s.within)
    const sequence = paths.map((s, n) => {
        const later = paths.slice(n + 1).find((p) => past(p, s)) ?? null
        return { ...s, passed: later !== null, passedBy: later ? later.id : null }
    })
    const earliest = sequence.find((s) => !s.passed) as Stop
    return { sequence, earliest, downstream: stops.filter((s) => s.kind === 'DOWNSTREAM') }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The report's lines
// ---------------------------------------------------------------------------------------------------------------------------------------

export interface SafeguardsReport {
    /**
     * Each run with its findings, its label, the group it is counted in (data: e.g. the experiment path, the controls, the legacy route) and the
     * short tag its line prints for that group (so a control is never tagged as the path whose assertion it is not held to).
     */
    runs: Array<{ run: SafeguardRun; findings: Finding[]; label: string; group: string; tag: string }>
    entries: OpenDisconnection[]
    /** Christian's failure-source categories: Christian's words, in Christian's order. */
    categories: string[]
    stops: Stop[]
    /** Lines the test adds (the quota runs' triples, the wording test's measurements), printed as given. */
    notes: string[]
}

/** The violation verdicts and detected disconnections of each group of runs, in the order the groups first appear (so a total is never read alone). */
export function countsByGroup(runs: SafeguardsReport['runs']): Array<{ group: string; runs: number; violations: number; detected: number }> {
    const groups = [...new Set(runs.map((r) => r.group))]
    return groups.map((group) => {
        const findings = runs.filter((r) => r.group === group).flatMap((r) => r.findings)
        return { group, runs: runs.filter((r) => r.group === group).length, violations: findings.filter((f) => classOf(f) === 'VIOLATION').length, detected: findings.filter((f) => classOf(f) === 'DETECTED').length }
    })
}

const plainText = (s: string): string => s.split(String.fromCharCode(34)).join(String.fromCharCode(39))
const bare = (words: string): string => (words.slice(-1) === '.' ? words.slice(0, -1) : words)

export function safeguardsText(rep: SafeguardsReport): string[] {
    const out: string[] = []
    out.push('REASONING-DISCONNECTION SAFEGUARDS (TEST-ONLY review evidence; OURS, for Christian\'s review)')
    out.push('')
    out.push('DECISION OWNERSHIP')
    for (const o of OWNERSHIP_TABLE) out.push(`- ${o.decision}: owner ${o.owner}; input ${o.input}; output ${o.output}; authority ${o.authority}`)
    out.push('')
    const all = rep.runs.flatMap((r) => r.findings)
    const violations = all.filter((f) => classOf(f) === 'VIOLATION')
    const detected = all.filter((f) => classOf(f) === 'DETECTED')
    out.push(`open disconnections detected: ${violations.length} violation verdicts and ${detected.length} detected disconnections over ${rep.runs.length} runs (none of them a pass; the detected, by verdict: ${detectedByVerdict(all)})`)
    out.push(`by group (a total never read alone): ${countsByGroup(rep.runs).map((g) => `${g.group}: ${g.violations} violation verdicts and ${g.detected} detected disconnections over ${g.runs} runs`).join('; ')}`)
    out.push('')
    out.push('THE RUNS, DECISION BY DECISION')
    for (const r of rep.runs) {
        out.push(`- ${r.run.runId} [${r.tag}] ${plainText(r.label)}`)
        for (const f of r.findings) out.push(`   ${f.row}${f.clause ? ` (${f.clause})` : ''}: ${f.verdict} [${classOf(f)}]: ${plainText(f.why)}${f.consulted ? `; consulted: ${plainText(f.consulted)}` : ''}`)
        out.push(`   checks: ${dispositionOf(r.run).map((d) => `${d.id} ${d.ran}`).join('; ')}`)
    }
    out.push('')
    out.push('THE SELECTION CHECKS (kept-enforced unless named; the numerical size rule alone is bypassed, TEST-ONLY)')
    for (const d of DISPOSITION) out.push(`- ${d.id}: ${d.check}; ${d.disposition}; source ${d.where}; origin ${d.origin}; authority ${d.authority}; reads ${d.reads}; reads wording-derived lenses: ${d.readsLenses ? 'yes' : 'no'}${d.reported ? `; ${d.reported}` : ''}; negative control: ${d.control}`)
    out.push('')
    out.push(`OPEN DISCONNECTIONS (${rep.entries.length}; printed as open disconnections, never as safeguards passing)`)
    // An entry with measured pairs prints them, grouped by verdict and rule; otherwise its rows and verdicts on its runs.
    const pairsText = (e: OpenDisconnection): string => {
        const keys = [...new Set(e.pairs!.map((p) => `${p.verdict}${p.rule ? ` (${p.rule})` : ''}`))]
        return `${e.rows.join(', ')}: ${keys.map((key) => `${key} on ${e.pairs!.filter((p) => `${p.verdict}${p.rule ? ` (${p.rule})` : ''}` === key).map((p) => p.run).join(', ')}`).join('; ')}`
    }
    for (const e of rep.entries) {
        out.push(`- ${e.id} [${e.scope === 'EXPERIMENT' ? 'experiment path' : 'legacy route, reported only'}] ${plainText(e.what)}: ${e.pairs ? pairsText(e) : e.verdicts.length ? `${e.rows.join(', ')} ${e.verdicts.join(', ')} on ${e.runs.join(', ')}` : `a measured change, no verdict on ${e.runs.join(', ')}`}`)
        out.push(`   evidence: ${plainText(e.evidence)}`)
        if (e.measured) out.push(`   measured: before ${plainText(e.measured.before)}; after ${plainText(e.measured.after)}`)
    }
    const failsOn = rep.entries.filter((e) => e.measured && e.scope === 'EXPERIMENT')
    out.push(`safeguard B fails on: ${failsOn.length ? failsOn.map((e) => e.id).join(', ') : 'nothing measured'}`)
    out.push('')
    const seq = blockerSequence(rep.stops)
    const names = (ids: number[]) => ids.map((i) => bare(rep.categories[i])).join('; and ')
    out.push('THE EARLIEST CONSEQUENTIAL BLOCKER (computed from the runs; each stop read in Christian\'s failure-source categories, our reading)')
    for (const s of seq.sequence) out.push(`- ${s.path}: ${s.stage}: ${plainText(s.reason)} [${names(s.categories)}] ${s.passed ? `(passed by ${s.passedBy})` : '(remains)'}`)
    out.push(`earliest remaining: ${seq.earliest.path}: ${seq.earliest.stage}; ${names(seq.earliest.categories)}: ${plainText(seq.earliest.why)}`)
    out.push('downstream, recorded and not investigated:')
    for (const s of seq.downstream) out.push(`- ${s.path}: ${s.stage}: ${plainText(s.reason)} [${names(s.categories)}]`)
    out.push('')
    for (const n of rep.notes) out.push(plainText(n))
    return out
}
