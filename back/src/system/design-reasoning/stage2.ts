/**
 * **The bounded Stage 2 demonstration: one function for every guided goal** — review pathway only (Christian's reply to the Stage 2
 * decision package, received 4 November 2026: *"I authorize a bounded, review-only demonstration using the D1, D3, D5 and D6 directions
 * above."* / *"This does not authorize the full implementation of Steps 3–5, production relevance joins, live routing changes, or
 * coach-facing deployment."*).
 *
 * `runStage2` is, for one Learning Goal id: Step 1 (`resolveDesignContext`, with D1's composite profile), Step 2 (`selectGameForm`, with
 * D3's compatibility-only reading), and, only where the test fixture names the goal, the structural conditions of each compatible Game
 * Form (D6, D5's continuous-play baseline) and the paired, test-only width comparison (D5) for each of the fixture's scenarios. Every goal
 * goes through the same calls with the same knowledge value; nothing branches on which goal it is (the fixture's goal id is data).
 *
 * Every conclusion is gathered with its `establishedBy` and influence trace, so the report can keep apart what approved knowledge
 * establishes, what is demonstrated only under test-only hypotheses, and where the evidence is insufficient.
 *
 * Not here, and held: activity assembly, a general configuration stage and validation (Steps 3-5); production relevance joins; any live
 * routing change. Nothing on the live route or the checked pathway imports this folder (a static test pins it). The output is review
 * evidence: never served, never coach text, never an authorization.
 */
import fixtureData from './width-scenarios.test-fixture.json'
import { cell, committedKnowledge, DesignKnowledge, SOURCE } from './knowledge'
import { selectGameForm, GameFormSelection } from './forms'
import { resolveDesignContext, DesignResolution } from './resolve'
import { evaluateStructuralConditions, StructuralEvaluation } from './structural'
import { Conclusion } from './trace'
import { compareWidth, WidthFixture, WidthScenarioResult } from './width-comparison'

export interface Stage2Result {
    stage: 'DESIGN_REASONING_STAGE_2'
    standing: string
    learningGoalId: string
    resolution: DesignResolution
    gameForm: GameFormSelection
    structural: StructuralEvaluation[]
    widthComparison: WidthScenarioResult[]
    conclusions: Conclusion[]
}

export const STAGE2_STANDING =
    'Review evidence only. Not served, not coach text, not an authorization. Compatible Game Forms pass a gate over approved context and archetype rows and the sport module\'s CANDIDATE Game Form declarations (module DRAFT), read under his D3 as compatibility information: compatibility, not demonstrated suitability. Width results are test-only comparisons of conditional hypotheses under test assumptions: not empirically established, not eligible for production. Passing the stage\'s tests is engineering evidence, not evidence of representative learning quality in the field.'

/** The committed test fixture, as a fresh deep copy each call. */
export function committedWidthFixture(): WidthFixture {
    return JSON.parse(JSON.stringify(fixtureData)) as WidthFixture
}

/** Every conclusion of Steps 1 and 2, gathered from the decisions that carry them. */
function stepConclusions(r: DesignResolution, f: GameFormSelection): Conclusion[] {
    const out: Conclusion[] = []
    const g = r.gameProblems
    out.push({
        id: 'step 1 game problems',
        step: 'Step 1',
        statement: g.basis ? `Game Problems by ${g.basis}: primary ${g.primary.join(', ')}; secondary ${g.secondary.join(', ') || 'none'}.` : `No Game Problem resolved (${r.missing.map((m) => m.kind).join(', ')}).`,
        establishedBy: g.establishedBy,
        testOnly: false,
        trace: g.trace,
    })
    if (r.context) {
        out.push({
            id: 'step 1 context',
            step: 'Step 1',
            statement: `Context ${r.context.rpcId}, by the routing row${r.context.goalRelationship ? ` and the context library's row ${r.context.goalRelationship.relationshipId}` : ''}.`,
            establishedBy: r.context.establishedBy,
            testOnly: false,
            trace: r.context.trace,
        })
    }
    // The status rests on what set the Game Problems and on the context; an unresolved status is insufficient evidence, never established.
    out.push({
        id: 'step 1 status',
        step: 'Step 1',
        statement: `Status ${r.status}${
            r.status === 'RESOLVED_NOT_RELATED_TO_CONTEXT' ? ': the routed context has no relationship row for the resolved primary Game Problem' : r.status === 'UNRESOLVED' ? ` (${r.missing.map((m) => m.kind).join(', ')})` : ''
        }.`,
        establishedBy: r.status === 'UNRESOLVED' ? 'INSUFFICIENT EVIDENCE' : g.establishedBy,
        testOnly: false,
        trace: { influencedBy: [...g.trace.influencedBy, ...(r.context ? r.context.trace.influencedBy : [])], consulted: [], citedOnly: [] },
    })
    if (r.profile) {
        const p = r.profile
        const show = (ratings: Record<string, string>) => Object.entries(ratings).map(([q, v]) => `${q}=${v}`).join(' ')
        out.push({ id: 'step 1 effective profile', step: 'Step 1', statement: `Effective profile (${p.effectiveProfile.rule}): ${show(p.effectiveProfile.ratings)}.`, establishedBy: p.effectiveProfile.establishedBy, testOnly: false, trace: p.effectiveProfile.trace })
        out.push({
            id: 'step 1 union view',
            step: 'Step 1',
            statement: `Union view, never the effective profile: ${Object.entries(p.unionView.perRequirement).map(([q, v]) => `${q}=${v.rating} (${v.suppliedBy.join(', ')})`).join(' ')}.`,
            establishedBy: p.unionView.establishedBy,
            testOnly: false,
            trace: p.unionView.trace,
        })
        for (const finding of p.findings) {
            out.push({
                id: `step 1 finding ${finding.requirement}`,
                step: 'Step 1',
                statement: `${finding.requirement} (${finding.requirementName}): the secondary ${finding.secondary.gameProblemId} rates it ${finding.secondary.rating}, the primary ${finding.primary.gameProblemId} ${finding.primary.rating}; ${finding.outcome}: ${finding.reason}; ${finding.description}. Not promoted into the effective profile.`,
                establishedBy: finding.establishedBy,
                testOnly: false,
                trace: finding.trace,
            })
        }
    }
    out.push({ id: 'step 2 game form', step: 'Step 2', statement: `${f.status}. ${f.statement}${f.knowledgePopulationFinding ? ` Knowledge-population finding (${f.knowledgePopulationFinding.ruling}): "${f.knowledgePopulationFinding.words}"` : ''}`, establishedBy: f.establishedBy, testOnly: false, trace: f.trace })
    if (f.status === 'COMPATIBLE_ALTERNATIVES') {
        out.push({
            id: 'step 2 preference',
            step: 'Step 2',
            statement: `Preference: ${f.preference.status}. ${f.preference.statement}`,
            establishedBy: f.preference.status === 'UNCONDITIONAL_GOVERNED_PREFERENCE' ? 'APPROVED KNOWLEDGE' : 'INSUFFICIENT EVIDENCE',
            testOnly: false,
            trace: f.trace,
        })
    }
    return out
}

export function runStage2(learningGoalId: string, knowledge: DesignKnowledge = committedKnowledge(), fixture: WidthFixture = committedWidthFixture()): Stage2Result {
    const resolution = resolveDesignContext(knowledge, learningGoalId)
    const gameForm = selectGameForm(knowledge, resolution)
    const fixtureApplies = fixture.learningGoalId === learningGoalId
    const structural = fixtureApplies
        ? gameForm.candidates
              .filter((c) => c.compatible)
              .map((c) => evaluateStructuralConditions(knowledge, resolution, c, { playersPerTeam: [...fixture.structuralActivity.playersPerTeam.value], source: `${SOURCE.fixture.split('/').pop()} structuralActivity` }))
        : []
    const widthComparison = fixtureApplies
        ? [...fixture.scenarios].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })).map((s) => compareWidth(knowledge, resolution, gameForm, s, SOURCE.fixture.split('/').pop() as string))
        : []
    const conclusions = [...stepConclusions(resolution, gameForm), ...structural.flatMap((s) => s.conclusions), ...widthComparison.flatMap((w) => w.conclusions)]
    return { stage: 'DESIGN_REASONING_STAGE_2', standing: STAGE2_STANDING, learningGoalId, resolution, gameForm, structural, widthComparison, conclusions }
}

/** Every goal in the registry, by id. */
export function runStage2ForEveryGoal(knowledge: DesignKnowledge = committedKnowledge(), fixture: WidthFixture = committedWidthFixture()): Stage2Result[] {
    const ids = knowledge.planning.learning_goals.map((g) => cell(g, 'ID')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    return ids.map((id) => runStage2(id, knowledge, fixture))
}
