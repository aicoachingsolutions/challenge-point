/**
 * **The Stage 1 demonstration, offline** — `npm run design:stage1 -- [--json <file>] [<goal id> ...]`.
 *
 * Prints, for each goal asked (every goal when none is named): the resolved Game Problems and context, the Affordance Requirement Profile
 * (each Game Problem's row, the merge, the divergences), the compatible Game Forms with the relationships behind them, and every tie, open
 * decision and missing piece of knowledge. `--json` also writes the full results, every citation included. No network, no database, no
 * route: it reads the committed knowledge and nothing else.
 *
 * This runner is the only file of the stage that prints a goal's display name, and it does so after the results are computed, for the
 * reader. The names never reach the stage (see knowledge.ts).
 */
import fs from 'node:fs'
import path from 'node:path'

import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { CAR_REQUIREMENTS, committedKnowledge } from './knowledge'
import { runStage1, runStage1ForEveryGoal, Stage1Result } from './stage1'

function displayName(id: string): string {
    const row = sessionPlanningModel.learningGoal(id)
    return row ? String(row['Learning Goal'] ?? '') : ''
}

function report(r: Stage1Result): string {
    const lines: string[] = []
    const g = r.resolution
    lines.push(`=== ${r.learningGoalId} ${displayName(r.learningGoalId)} ===`)
    lines.push(`1. Resolution: ${g.status}`)
    if (g.gameProblems.basis) {
        lines.push(`   Game Problems (${g.gameProblems.basis}${g.gameProblems.scope ? `, scope ${g.gameProblems.scope}` : ''}): primary ${g.gameProblems.primary.join(', ')}; secondary ${g.gameProblems.secondary.join(', ') || 'none'}`)
        if (g.gameProblems.qualifier) lines.push(`   Qualifier: "${g.gameProblems.qualifier}"`)
        lines.push(`   Sources: ${g.gameProblems.cites.map((c) => `${path.basename(c.file)} ${c.table} ${c.row}`).join('; ')}`)
    }
    if (g.context) {
        const rel = g.context.goalRelationship
        lines.push(`   Context: ${g.context.rpcId} (routing row ${g.context.routing.row}; library row ${rel ? `${rel.relationshipId} ${rel.type} ${rel.strength}` : 'MISSING'})`)
        for (const gp of g.context.gameProblemRelationships) {
            lines.push(`     ${gp.role} ${gp.gameProblemId}: ${gp.relationship ? `${gp.relationship.relationshipId} ${gp.relationship.type} ${gp.relationship.strength}` : 'no relationship row'}`)
        }
    }
    if (g.profile) {
        lines.push('2. Affordance Requirement Profile')
        for (const e of g.profile.perGameProblem) {
            lines.push(`   ${e.role.padEnd(9)} ${e.gameProblemId}: ${CAR_REQUIREMENTS.map((q) => `${q}=${e.ratings[q]}`).join(' ')}  (${e.rowStatus}; ${e.validationStatus}; confidence ${e.confidence})`)
        }
        lines.push(`   merged    : ${CAR_REQUIREMENTS.map((q) => `${q}=${g.profile!.merged.ratings[q]}`).join(' ')}  [${g.profile.merged.rule}]`)
        if (g.profile.underPrimaryWins) lines.push(`   primary-wins: ${CAR_REQUIREMENTS.map((q) => `${q}=${g.profile!.underPrimaryWins!.ratings[q]}`).join(' ')}`)
        for (const d of g.profile.divergent) lines.push(`   DIVERGES on ${d.requirement} (${g.profile.requirementNames[d.requirement]}): primary ${d.primary}, secondary ${d.secondary}, merged ${d.merged}`)
    }
    for (const rel of g.gameProblemRelationships) lines.push(`   Game Problem library: ${rel.source} ${rel.relationship} ${rel.target}`)

    const f = r.gameForm
    lines.push(`3. Game Form: ${f.status}${f.selected ? ` -> ${f.selected}` : ''}`)
    const archetype = f.candidates.flatMap((c) => c.checks).find((c) => c.check === 'ARCHETYPE_GAME_PROBLEM')
    if (archetype) lines.push(`   Archetype workbook: ${archetype.detail} (${archetype.cites.map((c) => c.row).join(', ')})`)
    for (const c of f.candidates) {
        const dims = c.dimensions.map((d) => `${d.dimension}=${d.value}`).join('; ')
        lines.push(`   ${c.gameFormId} ${c.compatible ? 'compatible' : 'EXCLUDED'} via ${c.contextRelationship.relationshipId} (${dims})`)
        for (const why of c.excludedBecause) lines.push(`      excluded: ${why}`)
    }
    for (const cmp of f.comparisons) lines.push(`   ${cmp.a} vs ${cmp.b}: ${cmp.outcome}${cmp.aStronger.length ? `; ${cmp.a} stronger on ${cmp.aStronger.join(', ')}` : ''}${cmp.bStronger.length ? `; ${cmp.b} stronger on ${cmp.bStronger.join(', ')}` : ''}`)
    lines.push('4. Unresolved ties, open decisions, missing knowledge')
    if (f.status === 'INSUFFICIENT_EVIDENCE') lines.push(`   INSUFFICIENT EVIDENCE between ${f.undominated.join(', ')}`)
    for (const m of f.missingBasis) lines.push(`   missing basis: ${m}`)
    for (const d of g.openDecisions) lines.push(`   OPEN ${d.id}: ${d.question}`)
    for (const q of g.requirements) lines.push(`   REQUIREMENT ${q.id} (${q.status}): ${q.statement}`)
    for (const m of [...g.missing, ...f.missing]) lines.push(`   missing (${m.kind}): ${m.detail}`)
    return lines.join('\n')
}

function main(): void {
    const args = process.argv.slice(2)
    const jsonIndex = args.indexOf('--json')
    const jsonOut = jsonIndex >= 0 ? args[jsonIndex + 1] : null
    const ids = args.filter((a, i) => jsonIndex < 0 || (i !== jsonIndex && i !== jsonIndex + 1))
    const knowledge = committedKnowledge()
    const results = ids.length ? ids.map((id) => runStage1(id, knowledge)) : runStage1ForEveryGoal(knowledge)
    console.log(results.map(report).join('\n\n'))
    if (jsonOut) {
        fs.writeFileSync(path.resolve(process.cwd(), jsonOut), `${JSON.stringify(results, null, 2)}\n`)
        console.log(`\nwrote ${results.length} results to ${jsonOut}`)
    }
}

main()
