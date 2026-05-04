/**
 * Selection + real AI assembly tests (no Express, no Mongo).
 * Loads env for OPENAI_API_KEY when running full pipeline.
 *
 * cd back && npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-selection-pipeline-tests.ts
 */
import 'dotenv/config'

import '../loadEnv'

import { ConstraintRoles } from '../models/constraint.model'
import type { IAffordance } from '../models/affordance.model'
import type { IConstraint } from '../models/constraint.model'
import type { ISession } from '../models/session.model'
import { SessionStatus } from '../models/session.model'
import { ActivityAssemblyValidationError, assembleActivities } from '../services/completion.service'
import type { Activity } from '../system/activity/activity-schema'
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

const SELECTION_INPUTS: string[] = [
    'Help players break defensive lines.',
    'Players keep winning the ball but turning away from field vision.',
    'We want players to create better support angles under pressure.',
    'Help players recognize space behind the defense.',
    'Create more attacking opportunities without forcing specific passes.',
]

const BREAK_IT_INPUTS: string[] = [
    'Create a warm-up.',
    'Improve fitness.',
    'Make a fun activity.',
    'Teach better technique.',
]

/** Input constraint layer + selection (no AI before selection). */
const INPUT_CONSTRAINT_CASES: string[] = [
    'work on touches with pressure and spacing',
    'improve first touch under pressure',
]

type SelectionOnlyRow = {
    input: string
    selectedArchetype: string
    selectedAffordanceLenses: string[]
    selectedConstraints: string[]
    aiCalled: false
}

type AssemblyRunMeta = {
    assemblyAttempts: number
    retriedAfterValidationFailure: boolean
    validationFailureReasons?: string[]
}

/** Activity Assembly V1 proof row: `generatedActivity` is the validated system `Activity` only (never legacy `IActivity`). */
type FullPipelineRow = {
    input: string
    selectedArchetype: string
    selectedAffordanceLenses: string[]
    selectedConstraints: string[]
    aiCalled: boolean
    aiCalledAfterSelection: boolean
    selectionComplete: boolean
    generatedActivity: Activity | null
    validationResult: {
        status: 'PASS' | 'FAIL'
        reasons: string[]
    }
    assembly?: AssemblyRunMeta
}

type BreakItRow = {
    input: string
    status: 'FAIL'
    selectionFailed: true
    aiCalled: false
    reason: string
}

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
    const primary = mocks[0]
    const supporting = mocks.slice(1)
    const viableCandidates = mocks
    const ranked: AffordanceFieldCandidate[] = mocks.map((m, i) => ({
        affordance: m,
        score: 100 - i,
        band: i === 0 ? 'primary' : 'supporting',
    }))
    return { primary, supporting, viableCandidates, ranked }
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
        _id: 'pipeline-test-session',
        createdBy: 'pipeline-test-user' as unknown as ISession['createdBy'],
        name: 'Pipeline test session',
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
    const constraintMocks = sel.constraints.map(constraintToIConstraint)
    const constraintPackage = buildConstraintPackage(constraintMocks, affordanceField, archetypeDef)

    return {
        session: buildMockSession(),
        previousActivities: [],
        coachInput: {
            challengeLevel: 'intermediate',
            duration: 20,
            learningGoals: [learningGoal],
        },
        affordances: affordanceField,
        archetype: archetypeDef,
        archetypeSelection: buildArchetypeSelection(archetypeDef),
        constraintPackage,
    }
}

function runSelectionOnly(input: string): SelectionOnlyRow {
    const sel = generateSelection({ learningGoals: [input] }, deriveInputConstraints(input))
    return {
        input,
        selectedArchetype: sel.archetype.game_form_name,
        selectedAffordanceLenses: sel.affordanceLenses.map((l) => l.title),
        selectedConstraints: sel.constraints.map((c) => c.title),
        aiCalled: false,
    }
}

async function runFullPipeline(input: string): Promise<FullPipelineRow> {
    let selectionComplete = false
    let aiCalled = false
    let aiCalledAfterSelection = false

    try {
        const sel = generateSelection({ learningGoals: [input] }, deriveInputConstraints(input))
        selectionComplete = true

        const selectedArchetype = sel.archetype.game_form_name
        const selectedAffordanceLenses = sel.affordanceLenses.map((l) => l.title)
        const selectedConstraints = sel.constraints.map((c) => c.title)

        if (!process.env.OPENAI_API_KEY?.trim()) {
            return {
                input,
                selectedArchetype,
                selectedAffordanceLenses,
                selectedConstraints,
                aiCalled: false,
                aiCalledAfterSelection: false,
                selectionComplete: true,
                generatedActivity: null,
                validationResult: {
                    status: 'FAIL',
                    reasons: ['OPENAI_API_KEY is not set; cannot invoke assembleActivities (real AI assembly path).'],
                },
            }
        }

        const assemblyInput = buildSystemAssemblyInput(sel, input)
        aiCalled = true
        aiCalledAfterSelection = selectionComplete

        const assembled = await assembleActivities(assemblyInput)
        const generatedActivity = assembled.structuredActivities[0]

        return {
            input,
            selectedArchetype,
            selectedAffordanceLenses,
            selectedConstraints,
            aiCalled: true,
            aiCalledAfterSelection: true,
            selectionComplete: true,
            generatedActivity,
            validationResult: { status: 'PASS', reasons: [] },
            assembly: {
                assemblyAttempts: assembled.assemblyAttempts,
                retriedAfterValidationFailure: assembled.retriedAfterValidationFailure,
                validationFailureReasons: assembled.validationFailureReasons,
            },
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const isSel = selectionComplete
        const assemblyMeta: AssemblyRunMeta | undefined =
            err instanceof ActivityAssemblyValidationError
                ? {
                      assemblyAttempts: err.assemblyAttempts,
                      retriedAfterValidationFailure: err.retriedAfterValidationFailure,
                      validationFailureReasons: err.validationFailureReasons,
                  }
                : undefined
        return {
            input,
            selectedArchetype: '',
            selectedAffordanceLenses: [],
            selectedConstraints: [],
            aiCalled,
            aiCalledAfterSelection: isSel && aiCalled,
            selectionComplete: isSel,
            generatedActivity: null,
            validationResult: { status: 'FAIL', reasons: [msg] },
            assembly: assemblyMeta,
        }
    }
}

function runBreakIt(input: string): BreakItRow {
    try {
        generateSelection({ learningGoals: [input] })
        return {
            input,
            status: 'FAIL',
            selectionFailed: true,
            aiCalled: false,
            reason: 'Selection unexpectedly succeeded for a blocked coach-intent phrase.',
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
            input,
            status: 'FAIL',
            selectionFailed: true,
            aiCalled: false,
            reason: msg,
        }
    }
}

async function main() {
    const selectionOnlyResults: SelectionOnlyRow[] = SELECTION_INPUTS.map(runSelectionOnly)

    const fullPipelineResults: FullPipelineRow[] = []
    for (const input of SELECTION_INPUTS) {
        fullPipelineResults.push(await runFullPipeline(input))
    }

    const breakItResults: BreakItRow[] = BREAK_IT_INPUTS.map(runBreakIt)

    const inputConstraintLayerResults = INPUT_CONSTRAINT_CASES.map((input) => {
        const hints = deriveInputConstraints(input)
        const sel = generateSelection({ learningGoals: [input] }, hints)
        return {
            input,
            inputConstraints: hints,
            selectedArchetype: sel.archetype.game_form_name,
            affordanceLensTitles: sel.affordanceLenses.map((l) => l.title),
            constraintTitles: sel.constraints.map((c) => c.title),
        }
    })

    const aiCalledTooEarly = fullPipelineResults.some((r) => r.aiCalled && !r.selectionComplete)

    const packet = {
        selectionOnlyResults,
        fullPipelineResults,
        fullPipelineSummary: {
            assemblyRetryCases: fullPipelineResults.filter((r) => r.assembly?.retriedAfterValidationFailure === true)
                .length,
            totalAssemblyAttempts: fullPipelineResults.reduce((acc, r) => acc + (r.assembly?.assemblyAttempts ?? 0), 0),
        },
        breakItResults,
        inputConstraintLayerResults,
        aiCalledTooEarly,
        notes: [
            'Selection path: generateSelection (back/src/system/test-library) only; selection-only rows never call assembleActivities.',
            'Full pipeline proof: generateSelection → assembleActivities; PASS iff structured Activity JSON validates (no legacy projection in packet). Legacy `generatedActivities` exists only inside completion.service for routes — not used here as proof.',
            'AI is invoked only after selection succeeds and OPENAI_API_KEY is set.',
            'Break-it phrases fail inside generateSelection before any assembly.',
            'fullPipelineSummary: assembly metadata from assembleActivities (matches quality/diversity runners).',
            'inputConstraintLayerResults: deriveInputConstraints (keyword rules only) narrows pools passed into generateSelection; final archetype/lenses/constraints are still scoring-selected.',
            'assembleActivities: retry path asserts archetype + affordance IDs + constraint IDs unchanged vs assembly start.',
        ],
    }

    console.log(JSON.stringify(packet, null, 2))
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
