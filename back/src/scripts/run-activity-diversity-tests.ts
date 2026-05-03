/**
 * Cross-run activity diversity diagnostic (same 5 inputs as quality runner).
 *
 * cd back && npx ts-node --files -r tsconfig-paths/register ./src/scripts/run-activity-diversity-tests.ts
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
import { evaluateActivityDiversity } from '../system/activity/evaluate-activity-diversity'
import { testLibraryArchetypeToSystemDefinition } from '../system/activity/resolve-test-library-archetype'
import { buildConstraintPackage } from '../system/build-constraint-package'
import type {
    AffordanceField,
    AffordanceFieldCandidate,
    ArchetypeDefinition,
    ArchetypeSelection,
    SystemAssemblyInput,
} from '../system/types'
import { generateSelection } from '../system/test-library/generateSelection'
import type {
    TestLibrarySelectionResult,
    TestLibraryV0AffordanceLens,
    TestLibraryV0Constraint,
} from '../system/test-library/types'

const DIVERSITY_INPUTS: string[] = [
    'Help players break defensive lines.',
    'Players keep winning the ball but turning away from field vision.',
    'We want players to create better support angles under pressure.',
    'Help players recognize space behind the defense.',
    'Create more attacking opportunities without forcing specific passes.',
]

type AssemblyRunMeta = {
    assemblyAttempts: number
    retriedAfterValidationFailure: boolean
    validationFailureReasons?: string[]
}

type DiversityRow = {
    input: string
    selectedArchetype: string
    selectedAffordanceLenses: string[]
    selectedConstraints: string[]
    generatedActivity: Activity | null
    assembly?: AssemblyRunMeta
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
        _id: 'activity-diversity-session',
        createdBy: 'activity-diversity-test' as unknown as ISession['createdBy'],
        name: 'Activity diversity test session',
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

async function runDiversityCase(input: string): Promise<DiversityRow> {
    let sel: TestLibrarySelectionResult
    try {
        sel = generateSelection({ learningGoals: [input] })
    } catch {
        return {
            input,
            selectedArchetype: '',
            selectedAffordanceLenses: [],
            selectedConstraints: [],
            generatedActivity: null,
        }
    }

    const selectedArchetype = sel.archetype.game_form_name
    const selectedAffordanceLenses = sel.affordanceLenses.map((l) => l.title)
    const selectedConstraints = sel.constraints.map((c) => c.title)

    if (!process.env.OPENAI_API_KEY?.trim()) {
        return {
            input,
            selectedArchetype,
            selectedAffordanceLenses,
            selectedConstraints,
            generatedActivity: null,
        }
    }

    try {
        const assemblyInput = buildSystemAssemblyInput(sel, input)
        const assembled = await assembleActivities(assemblyInput)
        return {
            input,
            selectedArchetype,
            selectedAffordanceLenses,
            selectedConstraints,
            generatedActivity: assembled.structuredActivities[0],
            assembly: {
                assemblyAttempts: assembled.assemblyAttempts,
                retriedAfterValidationFailure: assembled.retriedAfterValidationFailure,
                validationFailureReasons: assembled.validationFailureReasons,
            },
        }
    } catch (err) {
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
            selectedArchetype,
            selectedAffordanceLenses,
            selectedConstraints,
            generatedActivity: null,
            assembly: assemblyMeta,
        }
    }
}

async function main() {
    const results: DiversityRow[] = []
    for (const input of DIVERSITY_INPUTS) {
        results.push(await runDiversityCase(input))
    }

    const paired = results
        .map((r, i) => ({ r, goal: DIVERSITY_INPUTS[i] }))
        .filter((p): p is { r: DiversityRow & { generatedActivity: Activity }; goal: string } => p.r.generatedActivity !== null)

    const diversityEvaluation =
        paired.length === 0
            ? {
                  titleRepeats: [] as string[],
                  setupSimilarityFlags: [] as string[],
                  scoringSimilarityFlags: [] as string[],
                  constraintExpressionRepeats: [] as string[],
                  repeatedKeywords: [] as string[],
                  diversityStatus: 'FAIL' as const,
                  reasons: ['No assembled activities available (missing API key or assembly errors).'],
              }
            : evaluateActivityDiversity(
                  paired.map((p) => p.r.generatedActivity),
                  paired.map((p) => p.goal)
              )

    const packet = {
        results,
        diversityEvaluation,
        summary: {
            assemblyRetryCases: results.filter((r) => r.assembly?.retriedAfterValidationFailure === true).length,
            totalAssemblyAttempts: results.reduce((acc, r) => acc + (r.assembly?.assemblyAttempts ?? 0), 0),
        },
        notes: [
            'Measures repetition across the first generated Activity per input (same five learning goals as quality runner).',
            'Does not change prompts, validators, or selection.',
            'assemblyRetryCases: inputs where assembleActivities retried after strict Activity validation failure.',
        ],
    }

    console.log(JSON.stringify(packet, null, 2))
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
