import type { IActivity } from '../../models/activity.model'
import type { IAffordance } from '../../models/affordance.model'
import { ConstraintRoles, type IConstraint } from '../../models/constraint.model'
import type { ISession } from '../../models/session.model'
import { testLibraryArchetypeToSystemDefinition } from '../activity/resolve-test-library-archetype'
import { buildConstraintPackage } from '../build-constraint-package'
import type {
    AffordanceField,
    AffordanceFieldCandidate,
    ArchetypeDefinition,
    ArchetypeSelection,
    SystemAssemblyInput,
} from '../types'
import type { TestLibrarySelectionResult, TestLibraryV0AffordanceLens, TestLibraryV0Constraint } from './types'

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
        // SELECTION METADATA MUST SURVIVE THE PROJECTION.
        //
        // This function is an allowlist: it names the fields to copy and silently drops everything
        // else. build-constraint-package.ts reads all four of these — and none of them were listed,
        // so every one arrived `undefined` and the entire constraint-metadata overlay produced
        // nothing on the live path. The visible symptom was the one Christian reported on 22 Aug:
        // every activity's scoring collapsed to the hardcoded "A point or live advantage counts…"
        // template, because the authored incentive mechanism never reached the code meant to express
        // it. The workbook had five distinct mechanisms; the runtime saw none of them.
        //
        // Third allowlist projection this week to drop authored content on the floor (after `setup`
        // and `howToPlay`). Any field a downstream layer reads has to be named in every projection
        // between here and there, and nothing fails when it is not — the value just quietly becomes
        // undefined and some fallback covers for it.
        incentiveMechanism: c.incentiveMechanism,
        visibilityEffect: c.visibilityEffect,
        primaryConstraintType: c.primaryConstraintType,
        targetAffordancePrimary: c.targetAffordancePrimary,
        // NOTE: the realizations sheet also has an `incentive_patterns` column, intended for the
        // coach-facing phrasing of each mechanism. It is empty on all 23 rows, so it is not mapped
        // by the adapter yet. When it is authored, map it there and carry it here — expressIncentive
        // already prefers authored phrasing over anything it derives.
        createdAt: d,
        updatedAt: d,
    } as IConstraint
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

/**
 * Builds `SystemAssemblyInput` from a validated Test Library V0 selection (same path as pipeline/quality runners).
 */
export function systemAssemblyInputFromTestLibrarySelection(params: {
    selection: TestLibrarySelectionResult
    session: ISession
    previousActivities: IActivity[]
    // learningStage is optional: the free-text form never asks for one, and IC-001 requires the
    // experience to PROVIDE the stage rather than the runtime assuming a default.
    coachInput: {
        challengeLevel: string
        duration: number
        learningGoals: string[]
        learningStage?: string
        practiceSituation?: { id: string; name: string; definition: string }
        learningGoalId?: string
    }
}): SystemAssemblyInput {
    const { selection, session, previousActivities, coachInput } = params
    const archetypeDef = testLibraryArchetypeToSystemDefinition(selection.archetype)
    const affordanceField = buildAffordanceField(selection.affordanceLenses)
    const constraintMocks = selection.constraints.map(constraintToIConstraint)
    const constraintPackage = buildConstraintPackage(constraintMocks, affordanceField, archetypeDef)

    return {
        session,
        previousActivities,
        coachInput,
        affordances: affordanceField,
        archetype: archetypeDef,
        archetypeSelection: buildArchetypeSelection(archetypeDef),
        constraintPackage,
        // Natural deterministic seed: how many activities already exist in this session. The first
        // activity uses realization[0]; each subsequent "give me another" advances the rotation.
        variationIndex: previousActivities.length,
    }
}
