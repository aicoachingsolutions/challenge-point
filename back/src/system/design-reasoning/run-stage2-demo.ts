/**
 * **The bounded Stage 2 demonstration, offline** — `npm run design:stage2 -- [--out <dir>] [<goal id> ...]`.
 *
 * Runs `runStage2` for every goal in the registry (or the goals named) and writes two evidence files into
 * `docs/audits/design-reasoning-stage2/evidence/` (or `--out`): `stage2-report.txt`, for a reader, and `stage2-results.json`, every result
 * with every citation and influence trace. The files carry no time stamp, so two runs on the same knowledge are byte-identical. No network,
 * no database, no route: it reads the committed knowledge and the committed test fixture, nothing else.
 *
 * This runner is the only Stage 2 file that reads knowledge display text (a goal's name, an integrity condition's statement), and it does
 * so after the results are computed, for the reader. That text never reaches the stage (see knowledge.ts), and it is not written into the
 * JSON. The stage itself copies our own entry and assumption statements into its results for the reader; no decision reads them.
 */
import fs from 'node:fs'
import path from 'node:path'

import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { CAR_REQUIREMENTS, cell, committedKnowledge, DesignKnowledge } from './knowledge'
import { committedWidthFixture, runStage2, runStage2ForEveryGoal, Stage2Result, STAGE2_STANDING } from './stage2'
import { Conclusion, conclusionGroup, CONCLUSION_GROUP_NOTES, CONCLUSION_GROUPS, InfluenceTrace, weakestStanding } from './trace'

const REPO = path.resolve(__dirname, '..', '..', '..', '..')
const DEFAULT_OUT = path.join(REPO, 'docs', 'audits', 'design-reasoning-stage2', 'evidence')

function displayName(id: string): string {
    const row = sessionPlanningModel.learningGoal(id)
    return row ? String(row['Learning Goal'] ?? '') : ''
}

/** An integrity condition's statement, by its workbook record id, for the reader only. */
function integrityStatement(k: DesignKnowledge, recordId: string): string {
    const row = k.archetypes.knowledge.find((r) => cell(r, 'Record_ID') === recordId)
    return row ? cell(row, 'Knowledge_Statement') : ''
}

function traceLines(t: InfluenceTrace, indent: string): string[] {
    const out: string[] = []
    for (const [label, items] of [
        ['influenced by', t.influencedBy],
        ['consulted', t.consulted],
        ['cited only', t.citedOnly],
    ] as const) {
        for (const i of items) out.push(`${indent}${label}: ${i.ref} [${i.standing}] ${i.role}`)
    }
    return out
}

function stepsReport(r: Stage2Result, detail: boolean, k: DesignKnowledge): string[] {
    const lines: string[] = []
    const g = r.resolution
    const f = r.gameForm
    lines.push(`Step 1: ${g.status}`)
    if (g.gameProblems.basis) {
        lines.push(`  Game Problems (${g.gameProblems.basis}${g.gameProblems.scope ? `, scope ${g.gameProblems.scope}` : ''}${g.gameProblems.continuedBy ? `, continued by ${g.gameProblems.continuedBy.ruling}` : ''}): primary ${g.gameProblems.primary.join(', ')}; secondary ${g.gameProblems.secondary.join(', ') || 'none'}  [established by ${g.gameProblems.establishedBy}]`)
    }
    if (g.context) {
        const rel = g.context.goalRelationship
        lines.push(`  Context: ${g.context.rpcId} (routing row ${g.context.routing.row}; library row ${rel ? `${rel.relationshipId} ${rel.type} ${rel.strength}` : 'MISSING'})`)
        for (const gp of g.context.gameProblemRelationships) lines.push(`    ${gp.role} ${gp.gameProblemId}: ${gp.relationship ? `${gp.relationship.relationshipId} ${gp.relationship.type} ${gp.relationship.strength}` : 'no relationship row'}`)
    }
    if (g.profile) {
        const p = g.profile
        for (const e of p.rows) lines.push(`  CAR row ${e.role.padEnd(9)} ${e.gameProblemId}: ${CAR_REQUIREMENTS.map((q) => `${q}=${e.ratings[q]}`).join(' ')}  (${e.rowStatus}; ${e.validationStatus}; confidence ${e.confidence}; role set by ${e.provenance.roleSetBy.map((c) => c.row).join(', ')}${e.provenance.permittedBy.length ? `; permitted by the unpopulated ${e.provenance.permittedBy.map((c) => `${c.table} row ${c.row}`).join(', ')}` : ''})`)
        lines.push(`  Union view: ${CAR_REQUIREMENTS.map((q) => `${q}=${p.unionView.perRequirement[q].rating} (${p.unionView.perRequirement[q].suppliedBy.join(', ')})`).join(' ')}  [${p.unionView.rule}; never the effective profile]`)
        lines.push(`  Effective profile: ${CAR_REQUIREMENTS.map((q) => `${q}=${p.effectiveProfile.ratings[q]}`).join(' ')}  [${p.effectiveProfile.rule}; scope ${p.effectiveProfile.scope}; canonical amendment: ${p.effectiveProfile.canonicalAmendment ? 'yes' : 'no'}]`)
        for (const d of p.findings) lines.push(`  FINDING ${d.requirement} (${d.requirementName}): primary ${d.primary.gameProblemId} ${d.primary.rating}, secondary ${d.secondary.gameProblemId} ${d.secondary.rating} -> ${d.outcome}: ${d.reason}; ${d.description}; promoted into the effective profile: no`)
        if (detail) {
            lines.push('  Effective profile trace:')
            lines.push(...traceLines(p.effectiveProfile.trace, '    '))
            for (const c of k.stage2Rulings.compositeProfile.citedOnly) {
                if (c.tension) lines.push(`    ${c.ref} (${c.received}): ${c.tension}`)
            }
        }
    }
    lines.push(`Step 2: ${f.status}${f.selected ? ` ${f.selected}` : ''}${f.compatible.length > 1 ? ` (${f.compatible.join(', ')})` : ''}  [established by ${f.establishedBy}]`)
    if (f.statement) lines.push(`  ${f.statement}`)
    for (const c of f.candidates) {
        const info = c.compatibilityInformation
        lines.push(`  ${c.gameFormId} ${c.compatible ? 'compatible' : 'EXCLUDED'} via ${c.contextRelationship.relationshipId}: ${info.contextRelationshipType} ${info.contextRelationshipStrength}; ${info.declares.map((d) => `declares ${d.gameProblemId} (${d.role.toLowerCase()}): ${d.declared}`).join('; ')}  [${info.label}]`)
        if (detail) {
            const arch = c.checks.find((x) => x.check === 'ARCHETYPE_GAME_PROBLEM')
            if (arch) lines.push(`    archetype: ${arch.detail} (${arch.cites.map((x) => x.row).join(', ')})`)
        }
        for (const why of c.excludedBecause) lines.push(`    excluded (${why.reason}): ${why.detail}`)
    }
    if (f.status === 'COMPATIBLE_ALTERNATIVES') {
        lines.push(`  Preference: ${f.preference.status}. ${f.preference.statement}`)
        if (detail) {
            for (const w of f.preference.whatCouldDistinguish) lines.push(`    ${w.id} ${w.what}: ${w.present ? 'PRESENT' : 'absent'} (${w.how}; ${w.limitation})`)
            if (f.preference.conditionalPreferenceWords) lines.push(`    Christian's words (D3): "${f.preference.conditionalPreferenceWords}"`)
        }
    }
    if (f.knowledgePopulationFinding) lines.push(`  KNOWLEDGE-POPULATION FINDING (${f.knowledgePopulationFinding.ruling}): "${f.knowledgePopulationFinding.words}" (${f.knowledgePopulationFinding.standing})`)
    for (const d of g.openDecisions) lines.push(`  OPEN ${d.id}: ${d.question}`)
    for (const q of g.requirements) lines.push(`  REQUIREMENT ${q.id} (${q.status}): ${q.statement}`)
    for (const m of [...g.missing, ...f.missing]) lines.push(`  missing (${m.kind}): ${m.detail}`)
    return lines
}

function fixtureReport(r: Stage2Result, k: DesignKnowledge): string[] {
    const lines: string[] = []
    if (r.structural.length) {
        lines.push('', 'Structural conditions of each compatible Game Form (Christian\'s D6; the continuous-play baseline under D5)')
        const first = r.structural[0].integrity
        lines.push(`  Integrity classification: ${first.standing}`)
        lines.push(`  Wording confirmation: ${first.wordingConfirmation}`)
        lines.push(`  Structural signals: ${first.structuralSignalStanding}`)
        for (const s of r.structural) {
            lines.push(`  ${s.gameFormId} (archetype ${s.archetypeId}; configured activity ${s.activity ? s.activity.playersPerTeam.join(' v ') : 'not supplied'}, TEST INPUT)`)
            for (const p of s.preconditions) lines.push(`    precondition '${p.statement}' (${p.requirement}): ${p.status}; evidence status ${p.evidenceStatus}; test-only. ${p.detail}`)
            lines.push(`    continuous play (${s.continuousPlay.entryId}): ${s.continuousPlay.status}. ${s.continuousPlay.detail}`)
            lines.push(`    integrity conditions (no pass-or-fail verdict: "${s.integrity.noVerdict}", ${s.integrity.noVerdictSource}):`)
            for (const c of s.integrity.conditions) lines.push(`      ${c.conditionId} ${c.recordId} [${c.class}] "${integrityStatement(k, c.recordId)}": ${c.status}${c.evidenceStatus ? `; evidence status ${c.evidenceStatus}` : ''}. ${c.detail}`)
        }
    }
    if (r.widthComparison.length) {
        lines.push('', 'Paired width comparison (Christian\'s D5): test-only; deciding circumstances are TEST ASSUMPTIONS; width runs across the direction of play')
        for (const w of r.widthComparison) {
            const dc = Object.entries(w.inputs.decidingCircumstances).map(([key, v]) => `${key}=${String(v.value)}`).join('; ')
            const described = [...new Set(Object.values(w.inputs.decidingCircumstances).map((v) => v.appliesTo ?? 'not stated'))].join('; ')
            lines.push(`  ${w.scenarioId} ${w.label}`)
            lines.push(`    inputs (TEST INPUT): configured ${w.inputs.configuredArea.lengthM} x ${w.inputs.configuredArea.widthM} m; available ${w.inputs.availableSpace.lengthM} x ${w.inputs.availableSpace.widthM} m; players ${w.inputs.playersPerTeam.value.join(' v ')}; ${dc} (TEST ASSUMPTION; each describes ${described})`)
            for (const h of w.hypotheses) {
                lines.push(`    ${h.entryId} (${h.evidenceClass}; ${h.permittedEngineUse}; invites the ${h.invites.toLowerCase()} Game Problem ${h.gameProblemId}): ${h.status}. ${h.detail}`)
                lines.push(`      deciding conditions: ${h.decidingConditions.map((c) => `${c.circumstance} requires ${c.requires}, supplied ${String(c.supplied)}`).join('; ')}`)
                for (const a of h.circumstanceAssumptions) lines.push(`      deciding circumstance ${a.id}: ${a.statement} Stands for ${a.circumstance}${a.requires === null ? '' : ` = ${a.requires}`}: ${a.status}.`)
                for (const a of h.structuralAssumptions) lines.push(`      structural assumption ${a.id}: ${a.status}. ${a.detail}`)
                for (const a of h.backgroundAssumptions) lines.push(`      ${a.status} ${a.id}: ${a.statement}`)
            }
            lines.push(`    OUTCOME ${w.outcome} [rule: ${w.basis}; established by ${w.establishedBy}]: ${w.statement}`)
            lines.push(`    proposal: ${w.proposal.status}. ${w.proposal.statement}${w.proposal.status === 'OFFERED_TEST_ONLY' ? ` Basis: ${w.proposal.basis}.` : ''}`)
            const sf = w.structuralFacts
            lines.push(`    structural facts (${sf.label}): ${sf.playersPerTeam.join(' v ')} (${sf.teamSizes}), equal numbers ${sf.equalNumbers ? 'yes' : 'no'}; configured ${sf.configured.areaM2} m2, ${sf.configured.areaPerPlayerM2 ?? '-'} m2 per player${sf.widened ? `; widened ${sf.widened.areaM2} m2, ${sf.widened.areaPerPlayerM2 ?? '-'} m2 per player` : ''}`)
            for (const c of w.structuralChecks) lines.push(`    structural check ${c.entryId}: ${c.status}. ${c.detail}`)
            for (const risk of w.risks) lines.push(`    risk ${risk.ref} [${risk.standing}]: ${risk.status}.${risk.quote ? ` "${risk.quote}" (${risk.quoteSource})` : ''} ${risk.detail}`)
            for (const m of w.missingCircumstances) lines.push(`    missing circumstance: ${m.label}; could come from ${m.futureSource}`)
            for (const m of w.missing) lines.push(`    missing (${m.kind}): ${m.detail}`)
            for (const d of w.deferredEntries) lines.push(`    deferred, evaluated nowhere: ${d.entryId} (${d.permittedEngineUse})`)
            lines.push('    trace:')
            lines.push(...traceLines(w.trace, '      '))
        }
    }
    return lines
}

function groupsReport(results: Stage2Result[]): string[] {
    const lines: string[] = []
    for (const group of CONCLUSION_GROUPS) {
        lines.push('', `${group}`, `  (${CONCLUSION_GROUP_NOTES[group]})`)
        for (const r of results) {
            const mine: Conclusion[] = r.conclusions.filter((c) => conclusionGroup(c) === group)
            for (const c of mine) lines.push(`  ${r.learningGoalId} ${c.id} [${c.establishedBy}; weakest decisive source ${weakestStanding(c.trace) ?? 'none recorded'}${c.testOnly ? '; test-only' : ''}]: ${c.statement}`)
        }
    }
    return lines
}

function entriesReport(k: DesignKnowledge): string[] {
    const lines: string[] = ['', 'Conditions-of-use entries (structure approved under D5; content OURS unless a field says otherwise; field evidence: none for every entry)']
    const vocabulary = k.conditionsOfUse.vocabulary as Record<string, unknown>
    lines.push(`  Kinds: ${String(vocabulary['kindNote'] ?? '')}`, `  Source standings: ${String(vocabulary['standingNote'] ?? '')}`)
    for (const e of k.conditionsOfUse.entries) {
        lines.push(`  ${e.id}: ${e.evidenceClass}; ${e.kind}; permitted engine use ${e.permittedEngineUse}; field evidence ${e.fieldEvidence}`)
        lines.push(`    ${e.statement}`)
        for (const s of e.sources) lines.push(`    source [${s.standing}] ${s.ref}: "${s.quote}"`)
    }
    return lines
}

function main(): void {
    const args = process.argv.slice(2)
    const outIndex = args.indexOf('--out')
    const outDir = outIndex >= 0 ? path.resolve(process.cwd(), args[outIndex + 1]) : DEFAULT_OUT
    const ids = args.filter((a, i) => outIndex < 0 || (i !== outIndex && i !== outIndex + 1))
    const knowledge = committedKnowledge()
    const fixture = committedWidthFixture()
    const results = ids.length ? ids.map((id) => runStage2(id, knowledge, fixture)) : runStage2ForEveryGoal(knowledge, fixture)

    const lines: string[] = []
    lines.push('Design-reasoning Stage 2: bounded demonstration, review pathway only')
    lines.push(`Standing: ${STAGE2_STANDING}`)
    lines.push('Authorized by Christian\'s reply to the Stage 2 decision package, received 4 November 2026 (D1, D3, D5, D6). Steps 3-5, production relevance joins, live routing changes and coach-facing use are not authorized and are not here.')
    lines.push(`Test fixture: ${fixture.standing}`)
    const fixtureGoal = results.find((r) => r.learningGoalId === fixture.learningGoalId)
    if (fixtureGoal) {
        lines.push('', `=== PART A. ${fixtureGoal.learningGoalId} ${displayName(fixtureGoal.learningGoalId)}: the bounded demonstration ===`)
        lines.push(...stepsReport(fixtureGoal, true, knowledge), ...fixtureReport(fixtureGoal, knowledge))
    }
    lines.push('', '=== PART B. Every goal through Steps 1 and 2 ===')
    for (const r of results) {
        lines.push('', `--- ${r.learningGoalId} ${displayName(r.learningGoalId)} ---`)
        lines.push(...stepsReport(r, false, knowledge))
    }
    lines.push('', '=== PART C. What approved knowledge establishes, what rests on Christian\'s rulings, candidate data or our inference, what is shown only on test inputs or under test-only hypotheses, and where the evidence is insufficient ===')
    lines.push('Each conclusion is grouped by how it is established and by the weakest standing among what decided it.')
    lines.push(...groupsReport(results))
    lines.push('', '=== PART D. Conditions-of-use entries ===')
    lines.push(...entriesReport(knowledge))
    const principles = knowledge.stage2Rulings.relevance.frameworkPrinciples
    lines.push('', '=== PART E. Framework principles the stage was built to respect ===', `  ${principles.standing}`)
    for (const p of principles.principles) lines.push(`  ${p.id}: ${p.principle}. Exercised: ${p.exercised}.${p.pinnedBy.length ? ` Pinned by: ${p.pinnedBy.join(', ')}.` : ''}`)
    lines.push(`  ${principles.waiting}`)

    fs.mkdirSync(outDir, { recursive: true })
    const report = `${lines.join('\n')}\n`
    fs.writeFileSync(path.join(outDir, 'stage2-report.txt'), report)
    fs.writeFileSync(path.join(outDir, 'stage2-results.json'), `${JSON.stringify({ stage: 'DESIGN_REASONING_STAGE_2', standing: STAGE2_STANDING, results }, null, 2)}\n`)
    console.log(report)
    console.log(`wrote ${results.length} results to ${path.relative(process.cwd(), outDir) || '.'} (stage2-report.txt, stage2-results.json)`)
}

main()
