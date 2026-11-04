/**
 * Unit tests — design-reasoning Stage 2, the bounded demonstration, review pathway only.
 *
 * What his reply to the Stage 2 decision package (received 4 November 2026) authorized the demonstration to show, each pinned here:
 *   - D1: A05's primary and secondary requirements preserved without concealing their difference (rows, union view with sources, the
 *     primary-led effective profile, one FOI finding at INSUFFICIENT_EVIDENCE, never promoted; lowering the secondary's FOI in a test
 *     copy removes the finding);
 *   - D3: GF2, GF3 and GF7 as compatible alternatives for A05 (and A01) with no manufactured preference; a context strength changed in a
 *     test copy moves no form decision; exclusions worded as no governed relationship established;
 *   - the Step 1 defect: TD01 and TD02 say their context has no row for their Game Problem;
 *   - D5: the six width scenarios; with the deciding circumstances NOT_SUPPLIED, a grid of areas and team sizes always gives insufficient
 *     evidence; no proposal ever exceeds the available space; both hypotheses are always reported; nothing is labelled established or
 *     production-eligible; flipping one test assumption moves exactly the width outcome;
 *   - D6: the structural preconditions, the integrity classification against the workbook, the reference boundary sentence never among
 *     what decided anything;
 *   - determinism, wording invariance, no ids in the code, no live import, and the data quotes that name repository rows match them.
 *
 * Run: part of `npm test`.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { cell, committedKnowledge, DesignKnowledge } from './knowledge'
import { committedWidthFixture, runStage2, runStage2ForEveryGoal, Stage2Result } from './stage2'
import { InfluenceTrace } from './trace'
import { compareWidth, WidthFixture, WidthScenario } from './width-comparison'
import { evaluateStructuralConditions } from './structural'

const HERE = __dirname
const SRC = path.resolve(HERE, '..', '..')
const REPO = path.resolve(SRC, '..', '..')
const json = (value: unknown) => JSON.stringify(value)
const byGoal = (results: Stage2Result[]) => Object.fromEntries(results.map((r) => [r.learningGoalId, r]))

function leaves(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
    if (value !== null && typeof value === 'object') {
        const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value as Record<string, unknown>)
        if (!entries.length) out[prefix] = Array.isArray(value) ? '[]' : '{}'
        for (const [key, v] of entries) leaves(v, prefix ? `${prefix}.${key}` : key, out)
    } else {
        out[prefix] = JSON.stringify(value)
    }
    return out
}

function changedPaths(before: Stage2Result[], after: Stage2Result[]): string[] {
    const a = leaves(byGoal(before))
    const b = leaves(byGoal(after))
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => a[p] !== b[p]).sort()
}

/** Every influence trace anywhere in a value. */
function traces(value: unknown, out: InfluenceTrace[] = []): InfluenceTrace[] {
    if (value !== null && typeof value === 'object') {
        const v = value as Record<string, unknown>
        if (Array.isArray(v.influencedBy) && Array.isArray(v.consulted) && Array.isArray(v.citedOnly)) out.push(v as unknown as InfluenceTrace)
        for (const child of Array.isArray(value) ? value : Object.values(v)) traces(child, out)
    }
    return out
}

const a05Scenario = (fixture: WidthFixture, id: string) => fixture.scenarios.find((s) => s.id === id) as WidthScenario

// -------------------------------------------------------------------------------------------------------------------------------------
// D1: the composite profile
// -------------------------------------------------------------------------------------------------------------------------------------

function testA05CompositeProfile(): void {
    const p = runStage2('A05').resolution.profile
    assert.ok(p)
    assert.deepEqual(p.rows.map((r) => [r.gameProblemId, r.role, `${r.ratings.FOI},${r.ratings.OP},${r.ratings.SA},${r.ratings.CIO}`]), [
        ['GP-001', 'PRIMARY', 'S,E,S,E'],
        ['GP-002', 'SECONDARY', 'E,E,S,E'],
    ])
    // Provenance: the CAR row each came from, and the ruling that set its role.
    assert.deepEqual(p.rows.map((r) => r.provenance.carRow.row), ['GP-001', 'GP-002'])
    for (const r of p.rows) assert.deepEqual(r.provenance.roleSetBy.map((c) => c.row), ['RUL-E1-A05', 'A05'])
    // Union view: strongest necessity under merge_precedence, with its sources; labelled; never the effective profile.
    const u = p.unionView.perRequirement
    assert.deepEqual([u.FOI.rating, u.OP.rating, u.SA.rating, u.CIO.rating], ['E', 'E', 'S', 'E'])
    assert.deepEqual(u.FOI.suppliedBy, ['GP-002'])
    for (const q of ['OP', 'SA', 'CIO'] as const) assert.deepEqual(u[q].suppliedBy, ['GP-001', 'GP-002'], q)
    assert.equal(p.unionView.usedAsEffectiveProfile, false)
    assert.match(p.unionView.label, /union view/)
    assert.match(p.unionView.rule, /merge_precedence E>S>NR/)
    // Effective profile: primary-led; scoped to the isolated review pathway; not a canonical amendment.
    assert.deepEqual(p.effectiveProfile.ratings, { FOI: 'S', OP: 'E', SA: 'S', CIO: 'E' })
    assert.equal(p.effectiveProfile.scope, 'ISOLATED_REVIEW_PATHWAY')
    assert.equal(p.effectiveProfile.canonicalAmendment, false)
    assert.equal(p.effectiveProfile.establishedBy, 'RULING')
    assert.ok(p.effectiveProfile.trace.citedOnly.some((i) => i.ref.startsWith('Composite Game Problem Runtime Specification RC1 v1.0') && i.standing === 'REFERENCE ONLY'))
    // One finding, on FOI, at insufficient evidence, never promoted.
    assert.equal(p.findings.length, 1)
    const f = p.findings[0]
    assert.deepEqual([f.requirement, f.primary.rating, f.secondary.rating, f.outcome, f.promotedIntoEffectiveProfile], ['FOI', 'S', 'E', 'INSUFFICIENT_EVIDENCE', false])
    assert.equal(f.reason, 'no approved relationship establishes how to reconcile the difference')
    assert.equal(f.description, 'an unresolved secondary consideration')
    assert.deepEqual(f.possibleOutcomes, ['INCLUDED', 'NOT_INCLUDED', 'CONFLICT_UNRESOLVED', 'INSUFFICIENT_EVIDENCE'])
}

/** For every pair of CAR rows as primary and secondary: the effective profile is the primary's row, and a finding marks each stronger secondary rating. */
function testNoPromotionForAnyPair(): void {
    const base = committedKnowledge()
    const order = String(base.car.metadata['merge_precedence']).split('>')
    const ids = base.car.ratings.map((r) => cell(r, 'game_problem_id'))
    for (const primary of ids) {
        for (const secondary of ids) {
            if (primary === secondary) continue
            const k = committedKnowledge()
            k.rulings.scopedTranslations[0].primaryGameProblemIds = [primary]
            k.rulings.scopedTranslations[0].secondaryGameProblemIds = [secondary]
            const p = runStage2('A05', k).resolution.profile
            assert.ok(p, `${primary} + ${secondary}`)
            const row = (id: string) => k.car.ratings.find((r) => cell(r, 'game_problem_id') === id) as Record<string, unknown>
            const expectedFindings = ['FOI', 'OP', 'SA', 'CIO'].filter((q) => order.indexOf(String(row(secondary)[q])) < order.indexOf(String(row(primary)[q])))
            assert.deepEqual(p.effectiveProfile.ratings, { FOI: row(primary).FOI, OP: row(primary).OP, SA: row(primary).SA, CIO: row(primary).CIO }, `${primary} + ${secondary}`)
            assert.deepEqual(p.findings.map((x) => x.requirement), expectedFindings, `${primary} + ${secondary}`)
            assert.ok(p.findings.every((x) => x.outcome === 'INSUFFICIENT_EVIDENCE' && x.promotedIntoEffectiveProfile === false))
        }
    }
}

function testLoweringTheSecondarysFoiRemovesTheFinding(): void {
    const k = committedKnowledge()
    ;(k.car.ratings.find((r) => cell(r, 'game_problem_id') === 'GP-002') as Record<string, unknown>)['FOI'] = 'S'
    const p = runStage2('A05', k).resolution.profile
    assert.ok(p)
    assert.deepEqual(p.findings, [])
    assert.deepEqual(p.unionView.perRequirement.FOI, { rating: 'S', suppliedBy: ['GP-001', 'GP-002'] })
    assert.deepEqual(p.effectiveProfile.ratings, { FOI: 'S', OP: 'E', SA: 'S', CIO: 'E' })
}

function testStage1OpenDecisionsAreSupersededAndAttachedNowhere(): void {
    const k = committedKnowledge()
    for (const id of ['OPEN-E1-MERGE-RULE', 'OPEN-E2-CONTEXT-FIT']) assert.ok(k.rulings.openDecisions.find((d) => d.id === id)?.supersededBy, id)
    for (const r of runStage2ForEveryGoal()) assert.ok(!r.resolution.openDecisions.some((d) => d.id === 'OPEN-E1-MERGE-RULE' || d.id === 'OPEN-E2-CONTEXT-FIT'), r.learningGoalId)
    assert.deepEqual(runStage2('TA02').resolution.openDecisions.map((d) => d.id), ['OPEN-D2-POSSESSION-STABILIZATION'])
    // The requirement for context-sensitive resolution stays recorded, not implemented.
    assert.deepEqual(runStage2('A05').resolution.requirements.map((q) => [q.id, q.status]), [['REQ-E1-CONTEXT-SENSITIVE-RESOLUTION', 'RECORDED_NOT_IMPLEMENTED']])
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Step 1 defect and D3: Game Forms
// -------------------------------------------------------------------------------------------------------------------------------------

function testGoalsWhoseContextHasNoRowForTheirGameProblem(): void {
    for (const id of ['TD01', 'TD02']) {
        const r = runStage2(id)
        assert.equal(r.resolution.status, 'RESOLVED_NOT_RELATED_TO_CONTEXT', id)
        assert.equal(r.resolution.context?.primaryRelatedToContext, false, id)
        assert.equal(r.gameForm.status, 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED', id)
    }
    // A test copy giving RPC-007 an ACTIVE row for GP-004 makes TD01 plainly RESOLVED: the status reads the row.
    const k = committedKnowledge()
    const template = k.contexts.relationships.find((r) => cell(r, 'related_library') === 'GAME_PROBLEM' && cell(r, 'status') === 'ACTIVE') as Record<string, unknown>
    k.contexts.relationships.push({ ...template, relationship_id: 'TEST-REL', rpc_id: 'RPC-007', related_id: 'GP-004' })
    assert.equal(runStage2('TD01', k).resolution.status, 'RESOLVED')
}

function testA05AndA01AreCompatibleAlternatives(): void {
    for (const id of ['A05', 'A01']) {
        const f = runStage2(id).gameForm
        assert.equal(f.status, 'COMPATIBLE_ALTERNATIVES', id)
        assert.deepEqual(f.compatible, ['GF2', 'GF3', 'GF7'], id)
        assert.equal(f.selected, null, id)
        assert.equal(f.preference.status, 'INSUFFICIENT_EVIDENCE', id)
        assert.deepEqual(f.preference.preferred, [], id)
        assert.ok(f.preference.whatCouldDistinguish.every((w) => w.present === false), id)
        assert.match(f.preference.conditionalPreferenceWords ?? '', /that preference should be conditional, source-grounded and justified by its relevance to the intended learning problem/)
        for (const c of f.candidates) assert.equal(c.compatibilityInformation.label, 'compatibility information, not a preference', `${id} ${c.gameFormId}`)
        // The withdrawn machinery is gone from the output.
        assert.ok(!('comparisons' in f) && !('undominated' in f) && !('dimensionDefinitions' in f), id)
    }
}

function testNoContextStrengthMovesAnyFormDecision(): void {
    const decisions = (results: Stage2Result[]) => json(results.map((r) => [r.learningGoalId, r.gameForm.status, r.gameForm.selected, r.gameForm.compatible, r.gameForm.preference]))
    const before = decisions(runStage2ForEveryGoal())
    for (const strength of ['REQUIRED', 'PRIMARY', 'SECONDARY', 'SUPPORTING']) {
        const k = committedKnowledge()
        ;(k.contexts.relationships.find((r) => cell(r, 'relationship_id') === 'RPC-REL-029') as Record<string, unknown>)['relationship_strength'] = strength
        assert.equal(decisions(runStage2ForEveryGoal(k)), before, `GF7 ${strength}`)
    }
    // Nor does every GAME_FORM row's strength at once.
    const k = committedKnowledge()
    for (const r of k.contexts.relationships) if (cell(r, 'related_library') === 'GAME_FORM') r['relationship_strength'] = 'SUPPORTING'
    assert.equal(decisions(runStage2ForEveryGoal(k)), before, 'every form row SUPPORTING')
}

function testExclusionWording(): void {
    const excluded = runStage2ForEveryGoal().flatMap((r) => r.gameForm.candidates.flatMap((c) => c.excludedBecause.map((e) => ({ goal: r.learningGoalId, form: c.gameFormId, ...e }))))
    assert.ok(excluded.length > 0)
    for (const e of excluded) {
        assert.equal(e.reason, 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED', `${e.goal} ${e.form}`)
        assert.match(e.detail, /no governed relationship established; not evidence that the Game Form is ecologically unsuitable/)
    }
    // Other gate failures keep their own reasons.
    const k = committedKnowledge()
    ;(k.sportModule.game_forms.find((r) => cell(r, 'game_form_id') === 'GF2') as Record<string, unknown>)['status'] = 'DRAFT'
    const gf2 = runStage2('TA02', k).gameForm.candidates.find((c) => c.gameFormId === 'GF2')
    assert.deepEqual(gf2?.excludedBecause.map((e) => e.reason), ['FORM_NOT_ACTIVE'])
    assert.equal(runStage2('TA02', k).gameForm.status, 'NO_GOVERNED_RELATIONSHIP_ESTABLISHED')
}

// -------------------------------------------------------------------------------------------------------------------------------------
// D5: the paired width comparison
// -------------------------------------------------------------------------------------------------------------------------------------

function testEachWidthScenario(): void {
    const w = Object.fromEntries(runStage2('A05').widthComparison.map((s) => [s.scenarioId, s]))
    const summary = Object.fromEntries(Object.entries(w).map(([id, s]) => [id, `${s.outcome} | ${s.proposal.status} | ${s.hypotheses.map((h) => `${h.entryId}:${h.status}`).join(' ')}`]))
    assert.deepEqual(summary, {
        S1: 'PRIMARY_INVITATION_CONDITIONS_MET | OFFERED_TEST_ONLY | W-H1:CONDITIONS_MET_UNDER_TEST_ASSUMPTIONS W-H2:CONDITIONS_NOT_MET',
        S2: 'SECONDARY_EXPLOITATION_CONDITIONS_MET | NOT_OFFERED_FOR_PRIMARY | W-H1:CONDITIONS_NOT_MET W-H2:CONDITIONS_MET_UNDER_TEST_ASSUMPTIONS',
        S3: 'INSUFFICIENT_EVIDENCE | NONE_INSUFFICIENT_EVIDENCE | W-H1:INSUFFICIENT_EVIDENCE W-H2:INSUFFICIENT_EVIDENCE',
        S4: 'INSUFFICIENT_EVIDENCE | NONE_INSUFFICIENT_EVIDENCE | W-H1:INSUFFICIENT_EVIDENCE W-H2:INSUFFICIENT_EVIDENCE',
        S5: 'NO_ROOM_WITHIN_AVAILABLE_SPACE | NO_ROOM_WITHIN_AVAILABLE_SPACE | W-H1:CONDITIONS_MET_UNDER_TEST_ASSUMPTIONS W-H2:CONDITIONS_NOT_MET',
        S6: 'INSUFFICIENT_EVIDENCE | NONE_INSUFFICIENT_EVIDENCE | W-H1:INSUFFICIENT_EVIDENCE W-H2:INSUFFICIENT_EVIDENCE',
    })
    // S1: explicit proposal from 30 m to 40 m, length unchanged, with its basis; the representative risks reported as risks.
    assert.deepEqual([w.S1.proposal.fromWidthM, w.S1.proposal.toWidthM, w.S1.proposal.lengthM], [30, 40, 40])
    assert.match(w.S1.proposal.statement, /from 30 m to 40 m/)
    assert.equal(w.S1.proposal.basis, 'the coach\'s available width is the only bound supplied; no knowledge sets the size of a widening')
    assert.deepEqual(w.S1.risks.map((r) => [r.ref.split(' ').pop(), r.status]), [
        ['W-L2', 'REPORTED_RISK'],
        ['RPC-PROP-042', 'REPORTED_RISK'],
        ['(GA-001-OIC-06)', 'REPORTED_RISK'],
        ['(GA-001-OIC-07)', 'REPORTED_RISK'],
    ])
    assert.deepEqual(w.S1.structuralFacts.configured, { lengthM: 40, widthM: 30, areaM2: 1200, areaPerPlayerM2: 100 })
    assert.deepEqual(w.S1.structuralFacts.widened, { lengthM: 40, widthM: 40, areaM2: 1600, areaPerPlayerM2: 133.3 })
    assert.equal(w.S1.configuredWidthKept, false)
    // S2: not offered for the primary; the primary stays; the long-term requirement and the boundary sentence cited only.
    assert.equal(w.S2.primaryGameProblem.gameProblemId, 'GP-001')
    assert.equal(w.S2.configuredWidthKept, true)
    assert.match(w.S2.statement, /might make exploitation \(GP-002, the secondary Game Problem's problem\) the more immediate one/)
    assert.ok(w.S2.trace.citedOnly.some((i) => i.ref.endsWith('PGPL-CREATE-SPACE-BOUNDARY') && i.standing === 'REFERENCE ONLY'))
    assert.ok(w.S2.trace.citedOnly.some((i) => i.ref.endsWith('REQ-E1-CONTEXT-SENSITIVE-RESOLUTION')))
    // S3: what is missing and where it could come from in future; never geometry.
    assert.deepEqual(w.S3.missingCircumstances.map((m) => m.circumstance), ['defendersCanStillOrganizeShiftAndContest', 'usableSpaceAlreadyExists'])
    for (const m of w.S3.missingCircumstances) assert.match(m.futureSource, /coach observation or future feedback; never geometry/)
    // S4 and S6: the configured width is kept; S6 names the structural assumption it could not evaluate.
    for (const id of ['S3', 'S4', 'S5', 'S6']) assert.equal(w[id].configuredWidthKept, true, id)
    assert.equal(w.S6.hypotheses[0].structuralAssumptions[0].status, 'NOT_EVALUABLE')
    assert.equal(w.S6.structuralChecks.find((c) => c.entryId === 'N-L1')?.status, 'UNCERTAINTY_REPORTED')
    // Only an offered proposal carries risks.
    for (const id of ['S2', 'S3', 'S4', 'S5', 'S6']) assert.deepEqual(w[id].risks, [], id)
}

/** With either deciding circumstance NOT_SUPPLIED, no area, available space or team size ever decides anything. */
function testNotSuppliedGivesInsufficientEvidenceForEveryGeometry(): void {
    const k = committedKnowledge()
    const r = runStage2('A05', k)
    const base = a05Scenario(committedWidthFixture(), 'S3')
    let count = 0
    for (const missing of [['defendersCanStillOrganizeShiftAndContest', 'usableSpaceAlreadyExists'], ['defendersCanStillOrganizeShiftAndContest'], ['usableSpaceAlreadyExists']]) {
        for (const [length, width] of [[20, 15], [40, 30], [60, 40], [100, 64]]) {
            for (const extra of [0, 5, 20, 60]) {
                for (const players of [[1, 1], [3, 3], [5, 4], [6, 6], [7, 5], [11, 11], [4, 8]]) {
                    const scenario: WidthScenario = JSON.parse(JSON.stringify(base))
                    scenario.configuredArea = { lengthM: length, widthM: width, standing: 'TEST INPUT' }
                    scenario.availableSpace = { lengthM: length + extra, widthM: width + extra, standing: 'TEST INPUT' }
                    scenario.playersPerTeam = { value: players, standing: 'TEST INPUT' }
                    scenario.decidingCircumstances = {
                        defendersCanStillOrganizeShiftAndContest: { value: missing.includes('defendersCanStillOrganizeShiftAndContest') ? 'NOT_SUPPLIED' : true, label: 'TEST ASSUMPTION' },
                        usableSpaceAlreadyExists: { value: missing.includes('usableSpaceAlreadyExists') ? 'NOT_SUPPLIED' : false, label: 'TEST ASSUMPTION' },
                    }
                    const result = compareWidth(k, r.resolution, r.gameForm, scenario, 'grid')
                    assert.equal(result.outcome, 'INSUFFICIENT_EVIDENCE', json(scenario))
                    assert.equal(result.proposal.status, 'NONE_INSUFFICIENT_EVIDENCE', json(scenario))
                    assert.ok(result.hypotheses.every((h) => h.status === 'INSUFFICIENT_EVIDENCE'), json(scenario))
                    assert.equal(result.configuredWidthKept, true)
                    assert.deepEqual(result.missingCircumstances.map((m) => m.circumstance), [...missing].sort())
                    count++
                }
            }
        }
    }
    assert.equal(count, 3 * 4 * 4 * 7)
}

/** Across a grid, no proposal exceeds the coach's available width, the length never changes, and no room gives no proposal. */
function testNeverProposesBeyondTheAvailableSpace(): void {
    const k = committedKnowledge()
    const r = runStage2('A05', k)
    const base = a05Scenario(committedWidthFixture(), 'S1')
    for (const [length, width] of [[20, 15], [40, 30], [60, 40]]) {
        for (const [extraLength, extraWidth] of [[0, 0], [0, 10], [10, 0], [10, 25], [-5, 10], [0, -5]]) {
            const scenario: WidthScenario = JSON.parse(JSON.stringify(base))
            scenario.configuredArea = { lengthM: length, widthM: width, standing: 'TEST INPUT' }
            scenario.availableSpace = { lengthM: length + extraLength, widthM: width + extraWidth, standing: 'TEST INPUT' }
            const result = compareWidth(k, r.resolution, r.gameForm, scenario, 'grid')
            if (result.proposal.status === 'OFFERED_TEST_ONLY') {
                assert.ok((result.proposal.toWidthM as number) <= scenario.availableSpace.widthM, json(scenario))
                assert.ok((result.proposal.toWidthM as number) > scenario.configuredArea.widthM, json(scenario))
                assert.equal(result.proposal.lengthM, scenario.configuredArea.lengthM)
                assert.ok(scenario.configuredArea.lengthM <= scenario.availableSpace.lengthM)
            } else {
                assert.equal(result.proposal.status, 'NO_ROOM_WITHIN_AVAILABLE_SPACE', json(scenario))
                assert.ok(extraWidth <= 0 || extraLength < 0, json(scenario))
                assert.equal(result.configuredWidthKept, true)
            }
        }
    }
}

function testBothHypothesesAreAlwaysReportedTogether(): void {
    const k = committedKnowledge()
    const pairIds = k.conditionsOfUse.widthComparison.hypotheses
    for (const s of runStage2('A05').widthComparison) assert.deepEqual(s.hypotheses.map((h) => h.entryId), pairIds, s.scenarioId)
    // Even a goal the comparison does not apply to says so, naming both.
    const fixture = committedWidthFixture()
    fixture.learningGoalId = 'TA02'
    for (const s of runStage2('TA02', k, fixture).widthComparison) {
        assert.equal(s.outcome, 'NOT_APPLICABLE', s.scenarioId)
        for (const id of pairIds) assert.ok(s.statement.includes(id), `${s.scenarioId} names ${id}`)
    }
}

function testNothingIsLabelledEstablishedOrProductionEligible(): void {
    const k = committedKnowledge()
    const results = runStage2ForEveryGoal()
    const text = json(results)
    assert.ok(!text.includes('"productionEligible":true') && !text.includes('"empiricallyEstablished":true'))
    const mentions = text.split('empirically established').length - 1
    const negated = text.split('not empirically established').length - 1
    assert.equal(mentions, negated, 'every mention of empirically established is negated')
    for (const r of results) for (const w of r.widthComparison) for (const c of w.conclusions) assert.ok(c.testOnly && c.establishedBy !== 'APPROVED KNOWLEDGE' && c.establishedBy !== 'RULING', `${w.scenarioId} ${c.id}`)
    for (const e of k.conditionsOfUse.entries) {
        assert.notEqual(e.kind as string, 'empirically validated effect', e.id)
        assert.equal(e.fieldEvidence, 'none', e.id)
        if (e.evidenceClass === 'CAUSAL HYPOTHESIS') assert.ok(['TEST-ONLY COMPARISON', 'DEFERRED'].includes(e.permittedEngineUse), e.id)
    }
    assert.equal(k.conditionsOfUse.entries.find((e) => e.id === 'N-H1')?.permittedEngineUse, 'DEFERRED')
    assert.equal(k.conditionsOfUse.entries.find((e) => e.id === 'PGPL-CREATE-SPACE-BOUNDARY')?.permittedEngineUse, 'TRACE CITATION ONLY')
    assert.ok(!k.conditionsOfUse.widthComparison.hypotheses.includes('N-H1'), 'the deferred numerical hypothesis is not in the comparison')
    for (const r of results) for (const w of r.widthComparison) assert.ok(!w.hypotheses.some((h) => h.entryId === 'N-H1'), 'the deferred numerical hypothesis is evaluated nowhere')
}

/** The boundary sentence is reference knowledge: shown, never among what decided anything, under any assumption. */
function testTheBoundarySentenceNeverInfluencesADecision(): void {
    const k = committedKnowledge()
    const refs = k.conditionsOfUse.widthComparison.referenceEntries
    const check = (results: unknown, label: string) => {
        for (const t of traces(results)) {
            for (const i of t.influencedBy) {
                assert.ok(!refs.some((id) => i.ref.includes(id)), `${label}: ${i.ref} in influencedBy`)
                assert.notEqual(i.standing, 'REFERENCE ONLY', `${label}: ${i.ref} in influencedBy`)
            }
        }
    }
    check(runStage2ForEveryGoal(), 'committed')
    for (const defenders of [true, false, 'NOT_SUPPLIED'] as const) {
        for (const usable of [true, false, 'NOT_SUPPLIED'] as const) {
            const fixture = committedWidthFixture()
            for (const s of fixture.scenarios) s.decidingCircumstances = { defendersCanStillOrganizeShiftAndContest: { value: defenders, label: 'TEST ASSUMPTION' }, usableSpaceAlreadyExists: { value: usable, label: 'TEST ASSUMPTION' } }
            check(runStage2('A05', k, fixture), `${defenders}/${usable}`)
        }
    }
}

/** One test assumption flipped moves exactly that scenario's width result, and nothing else for any goal. */
function testFlippingOneAssumptionMovesExactlyTheWidthOutcome(): void {
    const before = runStage2ForEveryGoal()
    const fixture = committedWidthFixture()
    a05Scenario(fixture, 'S1').decidingCircumstances.usableSpaceAlreadyExists.value = true
    const after = runStage2ForEveryGoal(committedKnowledge(), fixture)
    const paths = changedPaths(before, after)
    assert.ok(paths.length > 0)
    const a05 = byGoal(after)['A05']
    for (const p of paths) {
        const ok = p.startsWith('A05.widthComparison.0.') || (p.startsWith('A05.conclusions.') && a05.conclusions[Number(p.split('.')[2])].id.startsWith('S1 '))
        assert.ok(ok, `moved: ${p}`)
    }
    assert.equal(a05.widthComparison[0].outcome, 'INSUFFICIENT_EVIDENCE', 'both circumstances true decide neither')
    assert.equal(json(a05.resolution), json(byGoal(before)['A05'].resolution))
    assert.equal(json(a05.gameForm), json(byGoal(before)['A05'].gameForm))
}

// -------------------------------------------------------------------------------------------------------------------------------------
// D6: structural conditions
// -------------------------------------------------------------------------------------------------------------------------------------

function testIntegrityClassificationMatchesTheWorkbook(): void {
    const k = committedKnowledge()
    const rows = k.archetypes.knowledge.filter((r) => cell(r, 'Archetype_ID') === 'GA-001' && cell(r, 'Knowledge_Type') === 'ORGANIZATIONAL_INTEGRITY_CONDITION')
    const cls = k.stage2Rulings.relevance.integrityConditions.classification
    assert.equal(rows.length, 8)
    assert.deepEqual(cls.map((c) => c.conditionId), rows.map((r) => cell(r, 'Target_ID')).sort())
    for (const c of cls) {
        const row = rows.find((r) => cell(r, 'Target_ID') === c.conditionId)
        assert.equal(cell(row, 'Record_ID'), c.recordId, c.conditionId)
        assert.equal(cell(row, 'Knowledge_Role'), 'CONDITION', c.conditionId)
        const n = Number(c.conditionId.slice(-2))
        assert.equal(c.class, n <= 5 ? 'REQUIRED CONDITION' : 'BREACH DESCRIPTION', c.conditionId)
    }
}

function testStructuralConditionsOfTheA05Forms(): void {
    const r = runStage2('A05')
    assert.deepEqual(r.structural.map((s) => s.gameFormId), ['GF2', 'GF3', 'GF7'])
    for (const s of r.structural) {
        assert.deepEqual(s.preconditions.map((p) => [p.id, p.status, p.evidenceStatus, p.testOnly]), [
            ['PRE-TASK-OBJECT', 'PRESENT', 'INFERRED', true],
            ['PRE-COMPETITOR', 'PRESENT', 'INFERRED', true],
        ])
        for (const p of s.preconditions) assert.match(p.detail, /not evidence of ecological relevance; does not distinguish Create Space from Exploit Space/)
        assert.equal(s.continuousPlay.status, 'HOLDS_BY_DESIGN')
        assert.equal(s.continuousPlay.notAnInteractionRegulation, true)
        assert.deepEqual(Object.fromEntries(s.integrity.conditions.map((c) => [c.conditionId.slice(-2), c.status])), {
            '01': 'NOT_EVALUABLE_BEFORE_ACTIVITY_ASSEMBLY',
            '02': 'NOT_EVALUABLE_BEFORE_ACTIVITY_ASSEMBLY',
            '03': 'STRUCTURAL_SIGNAL_PRESENT',
            '04': 'NOT_EVALUABLE_BEFORE_ACTIVITY_ASSEMBLY',
            '05': 'STRUCTURAL_SIGNAL_PRESENT',
            '06': 'RISK_NOT_EVALUABLE',
            '07': 'RISK_NOT_INDICATED_BY_DESIGN',
            '08': 'RISK_NOT_EVALUABLE',
        })
        // A continuum, not a pass-or-fail judgement: no verdict anywhere in the structural output.
        const text = json(s)
        assert.ok(!/"(verdict|passed|failed|integrityHolds)"/.test(text) && !text.includes('"PASS"') && !text.includes('"FAIL"'), s.gameFormId)
        assert.match(s.integrity.noVerdict, /continuum describing ecological fidelity rather than a pass-or-fail judgement/)
    }
}

/** A team with no players: the structural signals turn, and W-L2 and N-L1 decide because it is structurally certain. */
function testATeamWithNoPlayers(): void {
    const k = committedKnowledge()
    const r = runStage2('A05', k)
    const s = evaluateStructuralConditions(k, r.resolution, r.gameForm.candidates[0], { playersPerTeam: [6, 0], source: 'test' })
    assert.ok(s.preconditions.every((p) => p.status === 'ABSENT'))
    assert.equal(s.integrity.conditions.find((c) => c.conditionId.endsWith('03'))?.status, 'STRUCTURAL_SIGNAL_ABSENT')
    assert.equal(s.integrity.conditions.find((c) => c.conditionId.endsWith('07'))?.status, 'RISK_INDICATED_BY_DESIGN')
    const scenario: WidthScenario = JSON.parse(JSON.stringify(a05Scenario(committedWidthFixture(), 'S1')))
    scenario.playersPerTeam = { value: [6, 0], standing: 'TEST INPUT' }
    const w = compareWidth(k, r.resolution, r.gameForm, scenario, 'test')
    assert.deepEqual(w.structuralChecks.map((c) => [c.entryId, c.status]), [['W-L2', 'STRUCTURALLY_CERTAIN'], ['N-L1', 'STRUCTURALLY_CERTAIN']])
    assert.equal(w.outcome, 'INSUFFICIENT_EVIDENCE')
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Data integrity: the quotes that name repository rows match them
// -------------------------------------------------------------------------------------------------------------------------------------

function stringValues(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) value.forEach((v) => stringValues(v, out))
    else if (value && typeof value === 'object') Object.values(value).forEach((v) => stringValues(v, out))
    return out
}

function testDataQuotesMatchTheRepositoryRows(): void {
    const k = committedKnowledge()
    // Every entry source that names a repository file quotes a string held in that file.
    for (const e of k.conditionsOfUse.entries) {
        for (const s of e.sources.filter((x) => x.file)) {
            const values = stringValues(JSON.parse(fs.readFileSync(path.join(REPO, s.file as string), 'utf8')))
            assert.ok(values.some((v) => v.includes(s.quote)), `${e.id}: "${s.quote}" is not in ${s.file}`)
        }
    }
    // The width risks name rows by id; their quotes are those rows' text.
    for (const risk of k.conditionsOfUse.widthComparison.risksOfWidening) {
        if (risk.kind === 'CONTEXT_PROPERTY') {
            const row = (k.contexts.properties ?? []).find((r) => cell(r, 'property_id') === risk.propertyId)
            assert.equal(cell(row, 'property_text'), risk.quote, risk.propertyId)
            assert.equal(cell(row, 'property_category'), risk.expectedCategory, risk.propertyId)
            assert.equal(cell(row, 'rpc_id'), 'RPC-003', risk.propertyId)
        }
        if (risk.kind === 'INTEGRITY_CONDITION') {
            const row = k.archetypes.knowledge.find((r) => cell(r, 'Target_ID') === risk.conditionId)
            assert.equal(cell(row, 'Knowledge_Statement'), risk.quote, risk.conditionId)
        }
    }
    // The archetype role label and the PREFERRED value are the vocabulary's own.
    assert.ok(k.contexts.controlled_vocabulary.some((r) => cell(r, 'vocabulary') === 'relationship_type' && cell(r, 'value') === 'PREFERRED' && cell(r, 'description') === k.stage2Rulings.gameFormStep.gate.vocabularyQuote))
    // The CAR merge note the rulings file quotes.
    const note = ((k.car as unknown as { metadataRows: Array<Record<string, unknown>> }).metadataRows).find((r) => cell(r, 'metadata_key') === 'merge_precedence')
    assert.equal(cell(note, 'notes'), k.stage2Rulings.compositeProfile.carMergeNote.quote)
}

function testEntriesFollowTheApprovedStructure(): void {
    const k = committedKnowledge()
    const v = k.conditionsOfUse.vocabulary as Record<string, string[]>
    assert.deepEqual(k.conditionsOfUse.entries.map((e) => e.id), ['W-P', 'W-L1', 'W-H1', 'W-H2', 'W-L2', 'N-P', 'N-L1', 'N-H1', 'C-BASE', 'PGPL-CREATE-SPACE-BOUNDARY'])
    for (const e of k.conditionsOfUse.entries) {
        assert.ok(v.evidenceClass.includes(e.evidenceClass), e.id)
        assert.ok(v.kind.includes(e.kind), e.id)
        assert.ok(v.permittedEngineUse.includes(e.permittedEngineUse), e.id)
        assert.ok(e.sources.length > 0 && e.sources.every((s) => v.sourceStanding.includes(s.standing) && s.quote.length > 0), e.id)
        assert.ok(e.intendedInfluence && Array.isArray(e.assumptions) && Array.isArray(e.limitations), e.id)
        if (e.kind === 'hypothesis') assert.ok(Array.isArray(e.failureModes), e.id)
    }
    // His D4 classifications are data only: no stage file reads them.
    for (const f of fs.readdirSync(HERE).filter((x) => x.endsWith('.ts') && !x.endsWith('.unit.ts'))) assert.ok(!fs.readFileSync(path.join(HERE, f), 'utf8').includes('classifications'), f)
}

// -------------------------------------------------------------------------------------------------------------------------------------
// Determinism, wording invariance, confinement
// -------------------------------------------------------------------------------------------------------------------------------------

function testDeterminism(): void {
    const first = json(runStage2ForEveryGoal())
    assert.equal(json(runStage2ForEveryGoal()), first, 'two runs')
    const k = committedKnowledge()
    k.contexts.relationships.reverse()
    k.contexts.properties.reverse()
    k.sportModule.game_forms.reverse()
    k.car.ratings.reverse()
    k.planning.engine_translation.reverse()
    k.planning.rpc_routing.reverse()
    k.planning.learning_goals.reverse()
    k.archetypes.knowledge.reverse()
    k.gameProblems.relationships.reverse()
    const fixture = committedWidthFixture()
    fixture.scenarios.reverse()
    assert.equal(json(runStage2ForEveryGoal(k, fixture)), first, 'reversed lists')
}

function testWordingRewriteChangesNothing(): void {
    const k = committedKnowledge()
    const planning = k.planning as unknown as Record<string, Array<Record<string, unknown>>>
    const rewrite = { learning_goals: ['Learning Goal', 'Coach Definition', 'Choose This When...'], practice_situations: ['Practice Situation'], entry_language: ['Coach Phrase'], engine_translation: ['Notes'], rpc_routing: ['Learning Goal', 'RPC Name'] }
    for (const [sheet, columns] of Object.entries(rewrite)) for (const row of planning[sheet] ?? []) for (const c of columns) if (row[c] !== null && row[c] !== undefined) row[c] = `Reworded ${String(row[c]).split('').reverse().join('')}`
    for (const row of k.contexts.relationships) row['notes'] = 'Reworded note'
    for (const row of k.contexts.registry) row['rpc_name'] = `Reworded ${String(row['rpc_name'])}`
    for (const row of k.contexts.properties) row['property_text'] = 'Reworded property'
    for (const row of k.contexts.identity_rules) row['identity_statement'] = 'Reworded identity statement'
    for (const row of k.archetypes.knowledge) {
        row['Knowledge_Statement'] = 'Reworded statement'
        row['Rationale'] = 'Reworded rationale'
        row['Target_Name'] = 'Reworded name'
    }
    for (const row of k.sportModule.game_forms) for (const c of ['game_form_name', 'coach_vocabulary', 'objective', 'notes', 'representative_requirements', 'role_structure', 'setup_guidance']) row[c] = 'Reworded'
    for (const row of k.gameProblems.gameProblems) row['Name'] = `Reworded ${String(row['Name'])}`
    for (const row of k.car.ratings) row['canonical_name'] = 'Reworded'
    assert.notEqual(json(k.archetypes.knowledge), json(committedKnowledge().archetypes.knowledge))
    assert.equal(json(runStage2ForEveryGoal(k)), json(runStage2ForEveryGoal()))
}

function listTs(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listTs(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []))
}

function testNoLiveFileImportsTheStageOrItsData(): void {
    const reaches = /(from\s+|require\(\s*|import\(\s*)'[^']*(design-reasoning|stage2-rulings|conditions-of-use\.stage2|width-scenarios\.test-fixture)[^']*'/
    for (const file of listTs(SRC)) {
        if (file.startsWith(HERE + path.sep) || file.endsWith('.unit.ts')) continue
        assert.ok(!reaches.test(fs.readFileSync(file, 'utf8')), `${path.relative(SRC, file)} imports the stage or its data`)
    }
    // Only the review-only folder, its registered tests and the npm script name it in back/; the sport-layer source is Stage 1's.
    const pkg = JSON.parse(fs.readFileSync(path.join(SRC, '..', 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    assert.match(pkg.scripts['design:stage2'], /run-stage2-demo\.ts$/)
    const registry = JSON.parse(fs.readFileSync(path.join(SRC, '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/stage2.unit.ts'))
}

testA05CompositeProfile()
testNoPromotionForAnyPair()
testLoweringTheSecondarysFoiRemovesTheFinding()
testStage1OpenDecisionsAreSupersededAndAttachedNowhere()
testGoalsWhoseContextHasNoRowForTheirGameProblem()
testA05AndA01AreCompatibleAlternatives()
testNoContextStrengthMovesAnyFormDecision()
testExclusionWording()
testEachWidthScenario()
testNotSuppliedGivesInsufficientEvidenceForEveryGeometry()
testNeverProposesBeyondTheAvailableSpace()
testBothHypothesesAreAlwaysReportedTogether()
testNothingIsLabelledEstablishedOrProductionEligible()
testTheBoundarySentenceNeverInfluencesADecision()
testFlippingOneAssumptionMovesExactlyTheWidthOutcome()
testIntegrityClassificationMatchesTheWorkbook()
testStructuralConditionsOfTheA05Forms()
testATeamWithNoPlayers()
testDataQuotesMatchTheRepositoryRows()
testEntriesFollowTheApprovedStructure()
testDeterminism()
testWordingRewriteChangesNothing()
testNoLiveFileImportsTheStageOrItsData()

console.log('design-reasoning Stage 2: all tests passed')
