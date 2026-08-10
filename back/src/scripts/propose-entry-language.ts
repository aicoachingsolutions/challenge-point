/**
 * Offer our verified vocabulary as Entry Language candidates for Christian's sheet.
 *
 * WHY. Christian's Entry Language sheet carries 12 phrases, one per Learning Goal. We hold 173
 * phrases extracted from the legacy parser, each PROVEN against the live engine. He said the "real
 * coach goals" request has become Entry Language population; this hands over the raw material so he
 * is editing a list rather than starting from a blank sheet.
 *
 * THE TWO MODELS DO NOT LINE UP, AND THAT IS THE WHOLE PROBLEM. Our phrases map to internal signal
 * groups. His map to Learning Goals. Nothing declares how those relate — the Engine Translation
 * sheet that would is unpopulated. So the bridge is derived the only honest way available: run each
 * Learning Goal's own name and phrases through the parser, see which signal groups it reaches, and
 * invert that. A phrase then belongs to whichever Learning Goal shares its signal group.
 *
 * AMBIGUITY IS REPORTED, NEVER RESOLVED. Several Learning Goals share a signal group — "Win the Ball
 * Back" and "Defend 1v1" both reach regain/pressing, and "Play Through Pressure" and "Secure
 * Possession" both reach possession. A phrase landing on a shared group genuinely could belong to
 * either, and picking one would be inventing a coaching judgement that is Christian's to make. Those
 * go to a review list with the candidates named, not into the clean sheet.
 *
 * OUTPUT SHAPE RESPECTS HIS SCHEMA. Unambiguous rows are written to the Entry Language sheet with
 * exactly its two existing columns, so they can be accepted wholesale. Everything needing judgement
 * goes to a separate clearly-labelled sheet, so his canonical schema is never widened by a proposal.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/scripts/propose-entry-language.ts
 */
import fs from 'node:fs'
import path from 'node:path'

import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { sessionPlanningModel } from '../system/session-planning/session-planning-model'
import { soccerModule } from '../system/sport-module/soccer-module'

const GENERAL_FALLBACK = 'Z_soccer_general'

interface ProposedPhrase {
    phrase: string
    learningGoalId: string
}

interface ReviewPhrase {
    phrase: string
    reason: string
    candidates: string
}

/** Signal group -> the Learning Goals that reach it. Derived, because nothing declares it. */
function signalGroupToLearningGoals(): Map<string, string[]> {
    const map = new Map<string, string[]>()

    for (const goal of sessionPlanningModel.learningGoals()) {
        const id = String(goal['ID'])
        const probes = [
            String(goal['Learning Goal'] ?? ''),
            ...sessionPlanningModel
                .entryLanguage()
                .filter((entry) => String(entry['Learning Goal ID']) === id)
                .map((entry) => String(entry['Coach Phrase'])),
        ].filter(Boolean)

        for (const probe of probes) {
            for (const signal of deriveInputConstraints(probe).matchedSignals) {
                if (!signal.startsWith('signalGroup:')) continue
                const group = signal.replace('signalGroup:', '')
                // The fallback is reached by almost anything, so it carries no information about
                // which goal a phrase belongs to. Including it would map half the vocabulary to
                // whichever goals happen to route poorly.
                if (group === GENERAL_FALLBACK) continue
                const goals = map.get(group) ?? []
                if (!goals.includes(id)) goals.push(id)
                map.set(group, goals)
            }
        }
    }

    return map
}

function main(): void {
    const bridge = signalGroupToLearningGoals()
    const existing = new Set(
        sessionPlanningModel.entryLanguage().map((entry) => String(entry['Coach Phrase']).trim().toLowerCase())
    )

    const proposed: ProposedPhrase[] = []
    const review: ReviewPhrase[] = []
    const seen = new Set<string>()

    for (const row of soccerModule.vocabulary()) {
        const phrase = String(row['phrase'] ?? '').trim()
        const group = String(row['signal_group_id'] ?? '')

        // Only offer phrases that are literal, positive and verified. EXCLUDE rules are polarity
        // overrides rather than things a coach types; structural patterns are not phrases at all.
        if (String(row['match_mode']) !== 'CONTAINS') continue
        if (String(row['routing_polarity']) !== 'INCLUDE') continue
        if (String(row['status']) !== 'ACTIVE') continue
        if (!phrase) continue

        const key = phrase.toLowerCase()
        if (existing.has(key) || seen.has(key)) continue
        seen.add(key)

        const goals = bridge.get(group) ?? []
        if (goals.length === 1) {
            proposed.push({ phrase, learningGoalId: goals[0] })
        } else if (goals.length > 1) {
            review.push({
                phrase,
                reason: `Signal group ${group} is shared by ${goals.length} Learning Goals — which one this phrase means is a coaching judgement.`,
                candidates: goals.join('; '),
            })
        } else {
            review.push({
                phrase,
                reason: `Signal group ${group} is reached by no Learning Goal, so this phrase has no home in the planning model yet.`,
                candidates: '',
            })
        }
    }

    const outDir = path.resolve(__dirname, '../../data/session-planning')
    fs.writeFileSync(path.join(outDir, 'entry-language.proposed.json'), `${JSON.stringify({ proposed, review }, null, 2)}\n`)

    const byGoal = new Map<string, number>()
    for (const row of proposed) byGoal.set(row.learningGoalId, (byGoal.get(row.learningGoalId) ?? 0) + 1)

    console.log(`Entry Language candidates from ${seen.size} verified phrases:\n`)
    console.log(`  ${proposed.length} map to exactly one Learning Goal — ready to accept`)
    for (const [id, count] of [...byGoal].sort((a, b) => b[1] - a[1])) {
        const goal = sessionPlanningModel.learningGoal(id)
        console.log(`      ${id.padEnd(5)} ${String(goal?.['Learning Goal'] ?? '').padEnd(24)} ${count}`)
    }
    console.log(`\n  ${review.length} need your judgement (ambiguous or unmapped)`)
    console.log(`\nWritten to entry-language.proposed.json`)
}

main()
