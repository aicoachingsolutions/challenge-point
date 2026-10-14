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
    /**
     * FREE TEXT ONLY: the package must hold a shaping constraint, as every package had to before 14 October.
     *
     * His ruling of 14 October made the shaping slot optional for a Learning Goal (*"I don't want us to assume
     * that every activity necessarily requires an additional shaping constraint"*), and `buildConstraintPackage`
     * no longer throws without one. Free text was to keep its behaviour exactly, his decision on it pending —
     * but without this the relaxed package admitted combinations free-text selection used to reject, and
     * free text moved: measured 14 October in review, "reorganize" (a deriveInputConstraints test input)
     * selected Small Area Condition where it had selected Counter-Press Window, its package now with no
     * shaping constraint. So free text asks for the shaping member here, with the message the builder threw.
     */
    requireShaping?: boolean
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
        if (input.requireShaping && !pkg.shaping) throw new Error(`No compatible shaping constraint was found for archetype "${archetypeDef.name}".`)
        validateConstraintPackage(affordanceField, archetypeDef, pkg)
        return { compatible: true, reasons: [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        reasons.push(msg)
        return { compatible: false, reasons }
    }
}
