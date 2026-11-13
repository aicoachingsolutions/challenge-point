/**
 * **The Stage 1 demonstration (Steps 1 and 2), offline** — `npm run design:stage1 -- [--json <file>] [<goal id> ...]`.
 *
 * Prints, for each goal asked (every goal when none is named): the resolved Game Problems and context, the composite profile (each Game
 * Problem's row, the union view, the primary-led effective profile, the findings), the compatible Game Forms with the relationships behind
 * them, and every open decision and missing piece of knowledge. `--json` also writes the full results, every citation included. No
 * network, no database, no route: it reads the committed knowledge and nothing else.
 *
 * Since Stage 2 the two steps run as Christian's D1 and D3 direct (reply received 4 November 2026), so this runner prints their current output.
 * Stage 1's evidence files (`docs/audits/design-reasoning-stage1/evidence/`) are the record of Stage 1 as delivered and are not regenerated
 * (their wording alone was swept of gendered pronouns on 6 November, noted in the Stage 1 README).
 * The Stage 2 demonstration is `run-stage2-demo.ts`.
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
        const p = g.profile
        lines.push('2. Composite profile (primary-led; Christian\'s D1)')
        for (const e of p.rows) {
            lines.push(`   ${e.role.padEnd(9)} ${e.gameProblemId}: ${CAR_REQUIREMENTS.map((q) => `${q}=${e.ratings[q]}`).join(' ')}  (${e.rowStatus}; ${e.validationStatus}; confidence ${e.confidence})`)
        }
        lines.push(`   union view: ${CAR_REQUIREMENTS.map((q) => `${q}=${p.unionView.perRequirement[q].rating} (${p.unionView.perRequirement[q].suppliedBy.join(', ')})`).join(' ')}  [${p.unionView.rule}; never the effective profile]`)
        lines.push(`   effective : ${CAR_REQUIREMENTS.map((q) => `${q}=${p.effectiveProfile.ratings[q]}`).join(' ')}  [${p.effectiveProfile.rule}]`)
        for (const d of p.findings) lines.push(`   FINDING on ${d.requirement} (${d.requirementName}): primary ${d.primary.rating}, secondary ${d.secondary.rating}: ${d.outcome}, ${d.reason}`)
    }
    for (const rel of g.gameProblemRelationships) lines.push(`   Game Problem library: ${rel.source} ${rel.relationship} ${rel.target}`)

    const f = r.gameForm
    lines.push(`3. Game Form: ${f.status}${f.selected ? ` -> ${f.selected}` : ''}`)
    const archetype = f.candidates.flatMap((c) => c.checks).find((c) => c.check === 'ARCHETYPE_GAME_PROBLEM')
    if (archetype) lines.push(`   Archetype workbook: ${archetype.detail} (${archetype.cites.map((c) => c.row).join(', ')})`)
    for (const c of f.candidates) {
        const info = c.compatibilityInformation
        lines.push(`   ${c.gameFormId} ${c.compatible ? 'compatible' : 'EXCLUDED'} via ${c.contextRelationship.relationshipId} (${info.contextRelationshipType} ${info.contextRelationshipStrength}; ${info.declares.map((d) => `declares ${d.gameProblemId}: ${d.declared}`).join('; ')}) [${info.label}]`)
        for (const why of c.excludedBecause) lines.push(`      excluded (${why.reason}): ${why.detail}`)
    }
    lines.push('4. Preference, open decisions, missing knowledge')
    if (f.status === 'COMPATIBLE_ALTERNATIVES') lines.push(`   preference: ${f.preference.status}. ${f.preference.statement}`)
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
