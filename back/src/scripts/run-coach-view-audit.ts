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
 * It audits only what a coach reads: the six sections Christian settled on 2026-09-10, plus Teams
 * behind the optional expansion. Coaching Focus, Constraint and How to Play are still produced for
 * the validator and the engine but no screen shows them, so they are not coach text to audit.
 */
import 'dotenv/config'
import '../loadEnv'

import { ConstraintRoles } from '../models/constraint.model'
import type { IAffordance } from '../models/affordance.model'
import type { IConstraint } from '../models/constraint.model'
import type { ISession } from '../models/session.model'
import { SessionStatus } from '../models/session.model'
import { assembleActivities } from '../services/completion.service'
import {
    applyStandardToRequiredSection,
    findCommunicationStandardViolations,
} from '../system/activity/coach-communication-standard'
import { toCoachingObjective, type ObjectiveSource } from '../system/activity/coach-facing-sections'
import { translateCoachLanguage } from '../system/activity/coach-language'
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
import { sessionPlanningModel } from '../system/session-planning/session-planning-model'
import { gateCandidateGameFormsToContext } from '../system/sport-module/context-selection'
import { resolvePrimaryScoringDirectives } from '../system/sport-module/primary-scoring'
import type { PrimaryScoringDirective } from '../system/types'
import { generateSelection } from '../system/test-library/generateSelection'
import type {
    TestLibrarySelectionResult,
    TestLibraryV0AffordanceLens,
    TestLibraryV0Constraint,
} from '../system/test-library/types'

const DEFAULT_INPUTS = [
    'Help players break defensive lines.',
    'Players keep winning the ball but turning away from field vision.',
    'Help players recognize space behind the defense.',
]

/** Overridable with AUDIT_INPUTS ("goal one|goal two"), for reading a specific coaching intention. */
const overrideInputs = (process.env.AUDIT_INPUTS ?? '')
    .split('|')
    .map((goal) => goal.trim())
    .filter(Boolean)
const INPUTS: string[] = overrideInputs.length > 0 ? overrideInputs : DEFAULT_INPUTS

/**
 * THE GUIDED PATH. PLANNING_GOAL_IDS="A06|TA01" runs each Learning Goal the way the planning
 * conversation sends it — the goal's name as text, its id alongside — so the routed context and its
 * resolved primary scoring event reach assembly exactly as on the live route. Free-text inputs never
 * get a context, which is the point: it is not inferred from wording.
 */
const PLANNING_GOAL_IDS = (process.env.PLANNING_GOAL_IDS ?? '')
    .split('|')
    .map((id) => id.trim())
    .filter(Boolean)

type AuditCase = { input: string; learningGoalId?: string }

const CASES: AuditCase[] =
    PLANNING_GOAL_IDS.length > 0
        ? PLANNING_GOAL_IDS.map((id) => {
              const goal = sessionPlanningModel.learningGoal(id)
              if (!goal) throw new Error(`Unknown Learning Goal "${id}".`)
              return { input: String(goal['Learning Goal']), learningGoalId: id }
          })
        : INPUTS.map((input) => ({ input }))

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
        // Overridable so the harness can be pointed at what the session form actually collects.
        // Running it at the form's own default (330x160) is how the missing-dimensions defect was
        // found: two of three setups came back with no area at all, and the third invented one.
        fieldLength: process.env.FIELD_LENGTH ?? '40',
        fieldWidth: process.env.FIELD_WIDTH ?? '30',
        fieldType: 'grass',
        createdAt: d,
        updatedAt: d,
    }
}

function buildSystemAssemblyInput(
    sel: TestLibrarySelectionResult,
    learningGoal: string,
    guided: { learningGoalId?: string; primaryScoring?: PrimaryScoringDirective[] } = {}
): SystemAssemblyInput {
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
        coachInput: { challengeLevel: 'intermediate', duration: 20, learningGoals: [learningGoal], ...guided },
        affordances: affordanceField,
        archetype: archetypeDef,
        archetypeSelection: buildArchetypeSelection(archetypeDef),
        constraintPackage,
    }
}

// What a coach reads, in the order they read it, and nothing else (Christian, 2026-09-11): six
// sections, each answering one question. Constraint, How to Play, Coaching Focus and Teams are still
// produced — the validator requires several of them — but no screen shows them, so they are not
// coach text to audit.
const FIELDS = ['title', 'intent', 'setup', 'rules', 'scoringSystem', 'winCondition', 'equipmentNeeded'] as const

async function main() {
    let totalViolations = 0
    // How each Objective was produced, and whether assembly had to retry. The Objective instruction
    // changed on 2026-09-10; these two figures are how that change is judged rather than assumed.
    const objectiveSources: Record<ObjectiveSource, number> = { generated: 0, 'learning-goal': 0, 'game-form': 0, fallback: 0 }
    let retriedAssemblies = 0
    let failedAssemblies = 0

    for (const { input, learningGoalId } of CASES) {
        // Same as the live route: a guided goal selects within its routed context.
        const routedRpcId = learningGoalId
            ? (sessionPlanningModel.rpcRouting().find((route) => route.learningGoalId === learningGoalId)?.rpcId ?? null)
            : null
        const baseHints = deriveInputConstraints(input)
        const hints = routedRpcId ? gateCandidateGameFormsToContext(baseHints, routedRpcId) : baseHints
        const sel = generateSelection({ learningGoals: [input], learningGoalId }, hints)
        let primaryScoring: PrimaryScoringDirective[] | undefined
        if (routedRpcId) {
            try {
                primaryScoring = resolvePrimaryScoringDirectives(routedRpcId, sel.archetype.game_form_id)
            } catch (err) {
                console.log('\n' + '='.repeat(90))
                console.log(`INPUT: ${input} (${learningGoalId}) -> ${routedRpcId} via ${sel.archetype.game_form_name}`)
                console.log(`PRIMARY SCORING UNRESOLVED: ${err instanceof Error ? err.message : String(err)}`)
                continue
            }
        }
        const assemblyInput = buildSystemAssemblyInput(sel, input, { learningGoalId, primaryScoring })
        // One failed assembly must not end the run: a validation failure is itself a finding to report,
        // and it once hid every goal queued behind it.
        let assembled: Awaited<ReturnType<typeof assembleActivities>>
        try {
            assembled = await assembleActivities(assemblyInput)
        } catch (err) {
            failedAssemblies++
            console.log('\n' + '='.repeat(90))
            console.log(`INPUT: ${input}${learningGoalId ? ` (${learningGoalId})` : ''}  ARCHETYPE: ${sel.archetype.game_form_name}`)
            console.log(`ASSEMBLY FAILED: ${err instanceof Error ? err.message : String(err)}`)
            continue
        }
        if (assembled.retriedAfterValidationFailure) retriedAssemblies++

        // Reproduce the route exactly: map to the persisted shape, then compress with the same
        // per-slot modifier lines production passes. Passing [] here once produced a false claim.
        const legacy = assembled.structuredActivities.map((a) => mapStructuredActivityToLegacy(a, assemblyInput))
        const perSlotModifierLines = ([1, 2, 3] as const).map((idx) =>
            getSlotMechanicalVariations(assemblyInput.session.sessionEmphasis, idx).map((m) => m.mechanicLine)
        )
        const compressed = compressActivitiesForCoach(legacy, perSlotModifierLines)
        // SLOT_INDEX picks which of the three generated alternatives to print ("all" prints every
        // one from the same generation). Defaulting to slot 1 for every input is what made an earlier
        // reading of "identical across activities" wrong: three slot-1 activities are not three slots.
        const requestedSlots = process.env.SLOT_INDEX === 'all' ? [1, 2, 3] : [Number(process.env.SLOT_INDEX ?? '1')]

        // Recomputed the way compress-activity-output does it, only to learn WHICH route fired.
        for (const a of legacy) {
            const rawObjective = translateCoachLanguage(a.intent ?? '')
            objectiveSources[
                toCoachingObjective(
                    applyStandardToRequiredSection(rawObjective),
                    rawObjective,
                    a.systemTrace?.planning?.learningGoalName
                ).source
            ]++
        }

        for (const slot of requestedSlots) {
            const slotIndex = Math.min(Math.max(slot, 1), compressed.length) - 1
            const activity = compressed[slotIndex] as unknown as Record<string, unknown>

            console.log('\n' + '='.repeat(90))
            console.log(`INPUT: ${input}${learningGoalId ? ` (${learningGoalId})` : ''}`)
            console.log(`ARCHETYPE: ${sel.archetype.game_form_name}  SLOT: ${slotIndex + 1} of ${compressed.length}`)
            const directive = primaryScoring?.[slotIndex]
            if (directive) {
                console.log(
                    `CONTEXT: ${directive.contextId} ${directive.contextName}  EVENT: ${directive.eventKey}` +
                        `${directive.objectKey ? `/${directive.objectKey}` : ''}${directive.realizationCoverage ? `  [coverage: ${directive.realizationCoverage}]` : ''}`
                )
            }
            console.log('='.repeat(90))

            for (const field of FIELDS) {
                const raw = activity[field]
                const text = Array.isArray(raw) ? raw.join('\n  - ') : String(raw ?? '')
                console.log(`\n--- ${field.toUpperCase()} ---`)
                console.log(Array.isArray(raw) ? `  - ${text}` : text)

                // Attribute any emptied field: show what it held BEFORE compression, so a field the
                // standard blanked is distinguishable from one generation never filled.
                // The SAME slot's pre-compression value. This compared against slot 1 whatever slot was
                // printed, which made the check meaningless for SLOT_INDEX 2 and 3.
                const before = (legacy[slotIndex] as unknown as Record<string, unknown>)[field]
                const beforeText = Array.isArray(before) ? before.join(' | ') : String(before ?? '')
                if (!text.trim() && beforeText.trim()) {
                    console.log(`  !! EMPTIED BY COMPRESSION. Before: "${beforeText}"`)
                }

                const flat = Array.isArray(raw) ? raw.join(' ') : String(raw ?? '')
                const violations = findCommunicationStandardViolations(flat)
                if (violations.length) {
                    totalViolations += violations.length
                    console.log(`  !! CCS VIOLATIONS: ${JSON.stringify(violations)}`)
                }
            }
        }
    }

    console.log('\n' + '='.repeat(90))
    console.log(`TOTAL CCS VIOLATIONS ACROSS ALL COACH-FACING FIELDS: ${totalViolations}`)
    console.log(`OBJECTIVE SOURCES (all three slots per input): ${JSON.stringify(objectiveSources)}`)
    console.log(`ASSEMBLIES THAT RETRIED AFTER A VALIDATION FAILURE: ${retriedAssemblies} of ${CASES.length}`)
    console.log(`ASSEMBLIES THAT FAILED OUTRIGHT: ${failedAssemblies} of ${CASES.length}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
