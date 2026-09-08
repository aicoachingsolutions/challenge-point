/**
 * Print the coach-facing view of REAL generated activities and audit it against the Coach
 * Communication Standard.
 *
 *   cd back && npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-coach-view-audit.ts
 *
 * WHY THIS EXISTS. Claims about generated output cannot be assessed by reading code. The Coach
 * Communication Standard was wired in, its unit tests passed against Christian's own before/after
 * examples, and the full suite was green — and it was still shipping four defects to a coach:
 * "Teams aim to exploit the central corridor" (a section the standard was never applied to),
 * "…blind side counts more, so." (authored knowledge truncated mid-sentence), "…possession change;
 * the the." (an orphaned determiner), and a setup that said "Two teams of 5 players each" and
 * "Teams play 6v6" in the same paragraph. None of those are visible from the unit tests, because
 * every one of them lives in the gap between what the tests fixture and what generation writes.
 *
 * TWO THINGS THIS SCRIPT GETS RIGHT ON PURPOSE, both learned by getting them wrong:
 *
 *   It audits the LAST layer, not the first. Compression runs at the route on the persisted
 *   IActivity, so an audit of assembleActivities' output measures a shape no coach ever sees. It
 *   reproduces the route: map to legacy, then compress.
 *
 *   It passes the REAL per-slot modifier lines. Passing [] here once produced a confident, wrong
 *   claim that all three activities had identical rules.
 *
 * scaffolding is reported separately rather than counted as violations: coachingFocus is the one
 * section deliberately allowed to describe perception. See compress-activity-output.ts.
 */
import 'dotenv/config'
import '../loadEnv'

import { ConstraintRoles } from '../models/constraint.model'
import type { IAffordance } from '../models/affordance.model'
import type { IConstraint } from '../models/constraint.model'
import type { ISession } from '../models/session.model'
import { SessionStatus } from '../models/session.model'
import { assembleActivities } from '../services/completion.service'
import { findCommunicationStandardViolations } from '../system/activity/coach-communication-standard'
import { compressActivitiesForCoach } from '../system/activity/compress-activity-output'
import { mapStructuredActivityToLegacy } from '../system/activity/map-structured-activity-to-legacy'
import { getSlotMechanicalVariations } from '../system/activity/slot-mechanics-variations'
import { testLibraryArchetypeToSystemDefinition } from '../system/activity/resolve-test-library-archetype'
import { buildConstraintPackage } from '../system/build-constraint-package'
import type {
    AffordanceField,
    AffordanceFieldCandidate,
    ArchetypeDefinition,
    ArchetypeSelection,
    SystemAssemblyInput,
} from '../system/types'
import { deriveInputConstraints } from '../system/input-constraints/deriveInputConstraints'
import { generateSelection } from '../system/test-library/generateSelection'
import type {
    TestLibrarySelectionResult,
    TestLibraryV0AffordanceLens,
    TestLibraryV0Constraint,
} from '../system/test-library/types'

const INPUTS: string[] = [
    'Help players break defensive lines.',
    'Players keep winning the ball but turning away from field vision.',
    'Help players recognize space behind the defense.',
]

function lensToIAffordance(lens: TestLibraryV0AffordanceLens): IAffordance {
    const d = new Date()
    return {
        _id: lens.id,
        title: lens.title,
        description: lens.description,
        type: lens.type,
        affordanceTagGroup: lens.affordanceTagGroup,
        notes: lens.notes,
        contextualAudit: lens.contextualAudit,
        suggestedConstraintPrompt: lens.suggestedConstraintPrompt,
        gameTemplateAnchor: lens.gameTemplateAnchor.join('|'),
        designIntent: lens.designIntent,
        createdAt: d,
        updatedAt: d,
    }
}

function mapConstraintRole(role: string): ConstraintRoles {
    const r = role.toLowerCase()
    if (r === 'structure') return ConstraintRoles.Foundation
    if (r === 'hybrid') return ConstraintRoles.Shaping
    return ConstraintRoles.Consequence
}

function constraintToIConstraint(c: TestLibraryV0Constraint): IConstraint {
    const d = new Date()
    return {
        _id: c.id,
        title: c.title,
        description: c.description,
        type: c.type,
        affordanceTagGroup: c.affordanceTagGroup,
        notes: c.notes,
        contextualAudit: c.contextualAudit,
        suggestedConstraintPrompt: c.suggestedConstraintPrompt,
        gameTemplateAnchor: c.gameTemplateAnchor.join('|'),
        designIntent: c.designIntent,
        constraintArchetype: c.constraintArchetype,
        constraintRole: mapConstraintRole(c.constraintRole),
        createdAt: d,
        updatedAt: d,
    }
}

function buildAffordanceField(lenses: TestLibraryV0AffordanceLens[]): AffordanceField {
    const mocks = lenses.map(lensToIAffordance)
    const ranked: AffordanceFieldCandidate[] = mocks.map((m, i) => ({
        affordance: m,
        score: 100 - i,
        band: i === 0 ? 'primary' : 'supporting',
    }))
    return { primary: mocks[0], supporting: mocks.slice(1), viableCandidates: mocks, ranked }
}

function buildArchetypeSelection(archetype: ArchetypeDefinition): ArchetypeSelection {
    return {
        selected: archetype,
        candidates: [],
        selectionKey: 'test-library-v0',
        selectedReason: 'Test Library V0 generateSelection',
    }
}

function buildMockSession(): ISession {
    const d = new Date()
    return {
        _id: 'ccs-coach-view-session',
        createdBy: 'ccs-coach-view' as unknown as ISession['createdBy'],
        name: 'CCS coach view',
        sessionStatus: SessionStatus['In Progress'],
        playerCount: 12,
        fieldLength: '40',
        fieldWidth: '30',
        fieldType: 'grass',
        createdAt: d,
        updatedAt: d,
    }
}

function buildSystemAssemblyInput(sel: TestLibrarySelectionResult, learningGoal: string): SystemAssemblyInput {
    const archetypeDef = testLibraryArchetypeToSystemDefinition(sel.archetype)
    const affordanceField = buildAffordanceField(sel.affordanceLenses)
    const constraintPackage = buildConstraintPackage(
        sel.constraints.map(constraintToIConstraint),
        affordanceField,
        archetypeDef
    )

    return {
        session: buildMockSession(),
        previousActivities: [],
        coachInput: { challengeLevel: 'intermediate', duration: 20, learningGoals: [learningGoal] },
        affordances: affordanceField,
        archetype: archetypeDef,
        archetypeSelection: buildArchetypeSelection(archetypeDef),
        constraintPackage,
    }
}

// The fields a coach actually reads, on the persisted IActivity the route returns.
const FIELDS = [
    'title',
    'setup',
    'intent',
    'constraint',
    'howToPlay',
    'rules',
    'scoringSystem',
    'winCondition',
    'scaffolding',
    'extensions',
] as const

async function main() {
    let totalViolations = 0

    for (const input of INPUTS) {
        const sel = generateSelection({ learningGoals: [input] }, deriveInputConstraints(input))
        const assemblyInput = buildSystemAssemblyInput(sel, input)
        const assembled = await assembleActivities(assemblyInput)

        // Reproduce the route exactly: map to the persisted shape, then compress with the same
        // per-slot modifier lines production passes. Passing [] here once produced a false claim.
        const legacy = assembled.structuredActivities.map((a) => mapStructuredActivityToLegacy(a, assemblyInput))
        const perSlotModifierLines = ([1, 2, 3] as const).map((idx) =>
            getSlotMechanicalVariations(assemblyInput.session.sessionEmphasis, idx).map((m) => m.mechanicLine)
        )
        const activity = compressActivitiesForCoach(legacy, perSlotModifierLines)[0] as unknown as Record<
            string,
            unknown
        >

        console.log('\n' + '='.repeat(90))
        console.log(`INPUT: ${input}`)
        console.log(`ARCHETYPE: ${sel.archetype.game_form_name}`)
        console.log('='.repeat(90))

        for (const field of FIELDS) {
            const raw = activity[field]
            const text = Array.isArray(raw) ? raw.join('\n  - ') : String(raw ?? '')
            console.log(`\n--- ${field.toUpperCase()} ---`)
            console.log(Array.isArray(raw) ? `  - ${text}` : text)

            // Attribute any emptied field: show what it held BEFORE compression, so a field the
            // standard blanked is distinguishable from one generation never filled.
            const before = (legacy[0] as unknown as Record<string, unknown>)[field]
            const beforeText = Array.isArray(before) ? before.join(' | ') : String(before ?? '')
            if (!text.trim() && beforeText.trim()) {
                console.log(`  !! EMPTIED BY COMPRESSION. Before: "${beforeText}"`)
            }

            const flat = Array.isArray(raw) ? raw.join(' ') : String(raw ?? '')
            const violations = findCommunicationStandardViolations(flat)
            if (violations.length) {
                // scaffolding is coachingFocus: the section that tells a coach what to watch for, and
                // therefore the one place perception language is the content rather than a leak.
                if (field === 'scaffolding') {
                    console.log(`  (observation voice, exempt by design: ${JSON.stringify(violations)})`)
                } else {
                    totalViolations += violations.length
                    console.log(`  !! CCS VIOLATIONS: ${JSON.stringify(violations)}`)
                }
            }
        }
    }

    console.log('\n' + '='.repeat(90))
    console.log(`TOTAL CCS VIOLATIONS ACROSS ALL COACH-FACING FIELDS: ${totalViolations}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
