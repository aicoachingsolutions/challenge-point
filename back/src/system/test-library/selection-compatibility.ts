import type { IAffordance } from '../../models/affordance.model'
import { ConstraintRoles, type IConstraint } from '../../models/constraint.model'
import { testLibraryArchetypeToSystemDefinition } from '../activity/resolve-test-library-archetype'
import { buildConstraintPackage } from '../build-constraint-package'
import type { AffordanceField, AffordanceFieldCandidate } from '../types'
import { validateConstraintPackage } from '../validate-constraint-package'
import type { TestLibraryV0AffordanceLens, TestLibraryV0Archetype, TestLibraryV0Constraint } from './types'

export type SelectionPackageCompatibilityInput = {
    archetype: TestLibraryV0Archetype
    affordanceLenses: TestLibraryV0AffordanceLens[]
    constraints: TestLibraryV0Constraint[]
}

function mapConstraintRole(role: string): ConstraintRoles {
    const r = role.toLowerCase()
    if (r === 'structure') return ConstraintRoles.Foundation
    if (r === 'hybrid') return ConstraintRoles.Shaping
    return ConstraintRoles.Consequence
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

function testLibraryConstraintToIConstraint(c: TestLibraryV0Constraint): IConstraint {
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

function buildAffordanceFieldFromLenses(lenses: TestLibraryV0AffordanceLens[]): AffordanceField {
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

/**
 * Runs the same constraint-package assembly + `validateConstraintPackage` checks used after selection.
 * Used to skip scoring combinations that cannot become a valid assembly package before AI.
 */
export function isSelectionPackageCompatible(input: SelectionPackageCompatibilityInput): {
    compatible: boolean
    reasons: string[]
} {
    const reasons: string[] = []
    try {
        const archetypeDef = testLibraryArchetypeToSystemDefinition(input.archetype)
        const affordanceField = buildAffordanceFieldFromLenses(input.affordanceLenses)
        const iConstraints = input.constraints.map(testLibraryConstraintToIConstraint)
        const pkg = buildConstraintPackage(iConstraints, affordanceField, archetypeDef)
        validateConstraintPackage(affordanceField, archetypeDef, pkg)
        return { compatible: true, reasons: [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        reasons.push(msg)
        return { compatible: false, reasons }
    }
}
