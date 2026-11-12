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
    /**
     * TEST-ONLY (the isolated A02 experiment, stage W2 of the A02 package, 11 November 2026, E4): every selected member validated. The package
     * holds one member per role (`buildConstraintPackage` picks the best of each role, and drops a consequence scoring 12 or less), so a
     * selected constraint can be absent from it and never validated; with this set, a set any member of which is absent from the checked package
     * is refused, with the members named. A tightening: passed by the selector only under its TEST-ONLY switch (`quotaBypass`), where it is always
     * on. Production passes nothing here and is unchanged (the same hole exists there by construction: reported, not changed).
     */
    everyMemberValidated?: true
    /**
     * TEST-ONLY (stage W2, E3): the declared treatment FOUNDATION_PRESENCE_BYPASS (see build-constraint-package.ts): a package may hold no
     * foundation member. Applied only together with `everyMemberValidated` (refused otherwise, before any check runs).
     */
    foundationPresenceBypass?: true
}

/** TEST-ONLY (stage W2, E4): the words a refusal for a member absent from the checked package is recognized by (the disposition row MEMBER_PRESENCE). */
export const ABSENT_MEMBER_WORDS = 'absent from the checked package'

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
    // TEST-ONLY (stage W2): foundation presence is bypassed only where every selected member is validated (E3 never without E4).
    if (input.foundationPresenceBypass && !input.everyMemberValidated) throw new Error('TEST-ONLY: FOUNDATION_PRESENCE_BYPASS is applied only with every selected member validated (a structure member under its threshold would otherwise leave the package unvalidated)')
    try {
        const archetypeDef = testLibraryArchetypeToSystemDefinition(input.archetype)
        const affordanceField = buildAffordanceFieldFromLenses(input.affordanceLenses)
        const iConstraints = input.constraints.map(testLibraryConstraintToIConstraint)
        if (input.foundationPresenceBypass) {
            // TEST-ONLY (stage W2, E3 with E4): the same build and checks, the foundation clause alone not applied.
            const pkg = buildConstraintPackage(iConstraints, affordanceField, archetypeDef, { foundationPresenceBypass: true })
            if (input.requireShaping && !pkg.shaping) throw new Error(`No compatible shaping constraint was found for archetype "${archetypeDef.name}".`)
            validateConstraintPackage(affordanceField, archetypeDef, pkg, { foundationPresenceBypass: true })
            refuseAbsentMembers(input.constraints, [pkg.foundation, pkg.shaping, pkg.consequence])
            return { compatible: true, reasons: [] }
        }
        const pkg = buildConstraintPackage(iConstraints, affordanceField, archetypeDef)
        if (input.requireShaping && !pkg.shaping) throw new Error(`No compatible shaping constraint was found for archetype "${archetypeDef.name}".`)
        validateConstraintPackage(affordanceField, archetypeDef, pkg)
        // TEST-ONLY (stage W2, E4): under the selector's switch only, after the checks of the members present (they report first, as before).
        if (input.everyMemberValidated) refuseAbsentMembers(input.constraints, [pkg.foundation, pkg.shaping, pkg.consequence])
        return { compatible: true, reasons: [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        reasons.push(msg)
        return { compatible: false, reasons }
    }
}

/**
 * TEST-ONLY (stage W2, E4): throws, naming them, where any selected constraint is not a member of the checked package (one member per role;
 * a consequence scoring 12 or less dropped: build-constraint-package.ts), so it would be committed without ever being validated.
 */
function refuseAbsentMembers(selected: TestLibraryV0Constraint[], members: Array<{ constraint: IConstraint } | undefined>): void {
    const present = new Set(members.filter((m): m is { constraint: IConstraint } => m !== undefined).map((m) => String(m.constraint._id)))
    const absent = selected.filter((c) => !present.has(c.id))
    if (absent.length) throw new Error(`The selected ${absent.length === 1 ? 'constraint' : 'constraints'} ${absent.map((c) => `"${c.title}"`).join(', ')} ${absent.length === 1 ? 'is' : 'are'} ${ABSENT_MEMBER_WORDS}, so ${absent.length === 1 ? 'it was' : 'they were'} never validated (the package holds one member per role, and drops a consequence scoring 12 or less).`)
}
