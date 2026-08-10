/**
 * Draft the Session Planning Model's Engine Translation sheet — a PROPOSAL for Christian.
 *
 * WHY THIS EXISTS. Engine Translation is the join between the coach's planning decision and the
 * sport knowledge, and at RC1 all eleven rows read TBD. Nothing routes structurally until it is
 * populated, and Christian cannot populate it without knowing our canonical Game Problem IDs and
 * which one each Learning Goal currently reaches. That turns a review into an authoring task, which
 * is the slow kind.
 *
 * So this derives a draft EMPIRICALLY rather than guessing: it runs each Learning Goal's own Entry
 * Language phrases through the live parser, follows the resulting signal groups to canonical Game
 * Problems, and writes the result into a copy of his workbook with the reasoning in the Notes
 * column. He accepts, corrects, or rejects each row.
 *
 * IT IS A PROPOSAL, NOT AN ANSWER. Every row is marked PROPOSED and the mapping is a coaching
 * judgement that belongs to Christian under his own Governance Standard — the Session Planning Model
 * owns coach decisions, the sport knowledge layer owns Game Problems, and nothing here should
 * silently become canonical. It writes to a SEPARATE file, never to the ingested workbook.
 *
 * WHAT IT REPORTS RATHER THAN HIDES. Where a Learning Goal reaches no Game Problem, the row is left
 * unpopulated with the reason stated. Those are real gaps in what soccer can currently serve, and
 * writing a plausible-looking ID into them would bury exactly the finding that matters most.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/scripts/propose-engine-translation.ts
 */
import fs from 'node:fs'
import path from 'node:path'

import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { SIGNAL_GROUP_TO_GAME_PROBLEM } from '../system/knowledge-core/affordance-target-matrix'
import { gpLibrary } from '../system/knowledge-core/gp-library'
import { sessionPlanningModel } from '../system/session-planning/session-planning-model'

/**
 * NO CARRIER PHRASE HERE, deliberately.
 *
 * The vocabulary extractor probes defensive SUBTYPE rows with a carrier ("prevent ...") because the
 * sub-classifier only runs once defensive intent exists. Reusing that trick here is wrong and was
 * tried first: prefixing "prevent" INVENTS defensive intent the coach's phrase never had, so every
 * Learning Goal — including "Play Out from the Back" and "Attack Quickly" — picked up Protect Space
 * and the whole draft came back nearly uniform. A mapping proposal must reflect what the coach's own
 * words reach, and nothing else.
 */

interface ProposedRow {
    learningGoalId: string
    learningGoalName: string
    primary: string[]
    secondary: string[]
    notes: string
}

function gameProblemsFor(phrases: string[]): { gps: string[]; groups: string[] } {
    const groups = new Set<string>()
    for (const phrase of phrases) {
        for (const signal of deriveInputConstraints(phrase).matchedSignals) {
            if (!signal.startsWith('signalGroup:')) continue
            const group = signal.replace('signalGroup:', '')
            // The general fallback is not a routing answer — it is the absence of one.
            if (group === 'Z_soccer_general') continue
            groups.add(group)
        }
    }

    const gps: string[] = []
    for (const group of groups) {
        for (const gp of SIGNAL_GROUP_TO_GAME_PROBLEM[`signalGroup:${group}`] ?? []) {
            if (!gps.includes(gp)) gps.push(gp)
        }
    }
    return { gps, groups: [...groups] }
}

function main(): void {
    const rows: ProposedRow[] = []

    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        const name = String(goal['Learning Goal'] ?? '')

        // The goal's OWN entry phrases, plus its name — the name is what a coach sees and clicks,
        // so it has to route as well as the phrases do.
        const phrases = [
            name,
            ...sessionPlanningModel
                .entryLanguage()
                .filter((e) => String(e['Learning Goal ID']) === id)
                .map((e) => String(e['Coach Phrase'])),
        ]

        const { gps, groups } = gameProblemsFor(phrases)
        const named = gps.map((gp) => `${gp} ${gpLibrary.gameProblem(gp)?.Name ?? '?'}`)

        if (gps.length === 0) {
            rows.push({
                learningGoalId: id,
                learningGoalName: name,
                primary: [],
                secondary: [],
                notes:
                    'GAP — no canonical Game Problem is reachable from this goal today. The coach phrases fall ' +
                    'to the general fallback, so the activity would be generic. Needs either vocabulary that ' +
                    'routes it or a decision about which Game Problem it belongs to. Left blank deliberately.',
            })
            continue
        }

        rows.push({
            learningGoalId: id,
            learningGoalName: name,
            // Primary is the first Game Problem reached; anything else is offered as secondary, which
            // matches the Composite Game Problem rule of exactly one primary and zero-or-one secondary.
            primary: [gps[0]],
            secondary: gps.slice(1, 2),
            notes:
                `PROPOSED from the live engine. Coach phrases resolved to signal group(s) ${groups.join(', ')} ` +
                `-> ${named.join(' | ')}.` +
                (gps.length > 2 ? ` Additional reachable: ${named.slice(2).join(' | ')} — needs your judgement.` : ''),
        })
    }

    const outDir = path.resolve(__dirname, '../../data/session-planning')
    const outPath = path.join(outDir, 'engine-translation.proposed.json')
    fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`)

    console.log(`Proposed Engine Translation for ${rows.length} Learning Goals -> ${outPath}\n`)
    for (const row of rows) {
        const mapping = row.primary.length
            ? `${row.primary[0]}${row.secondary.length ? ` (+${row.secondary[0]})` : ''}`
            : 'GAP — no route'
        console.log(`  ${row.learningGoalId.padEnd(5)} ${row.learningGoalName.padEnd(24)} ${mapping}`)
    }
    const gaps = rows.filter((r) => r.primary.length === 0)
    console.log(`\n${rows.length - gaps.length} of ${rows.length} proposed; ${gaps.length} left blank as real gaps.`)
}

main()
