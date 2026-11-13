import type { IAffordance } from '../../models/affordance.model'
import { ConstraintRoles, type IConstraint } from '../../models/constraint.model'
import { testLibraryArchetypeToSystemDefinition } from '../activity/resolve-test-library-archetype'
import { buildConstraintPackage } from '../build-constraint-package'
import type { AffordanceField, AffordanceFieldCandidate } from '../types'
import { validateConstraintPackage } from '../validate-constraint-package'
import type {
    ConstraintBalanceBucket,
    ConstraintNotApplied,
    ConstraintNotAppliedRule,
    TestLibraryV0AffordanceLens,
    TestLibraryV0Archetype,
    TestLibraryV0Constraint,
} from './types'

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
     * **Every member validated: for an authorization record's set, which is taken whole or refused** (12 November 2026, Christian's item 4:
     * "A jointly required, authorized set should not be silently reduced."). The package holds one member per role (`buildConstraintPackage`
     * picks the best of each role, and keeps a consequence only above 12), so a member can be absent from it and never validated; with this
     * set, a set any member of which is absent from the checked package is refused, with the members named. A tightening, passed by the
     * selector only for a record-backed set (`generateSelection`); an eligible pool passes nothing here, and its members not applied are
     * recorded instead (`notApplied`). Ported from the A02 line's TEST-ONLY E4 (7dcb5d6), here without its switch.
     */
    everyMemberValidated?: true
}

/** The words a refusal for a member absent from the checked package is recognized by (as on the A02 line, 7dcb5d6). */
export const ABSENT_MEMBER_WORDS = 'absent from the checked package'

/** What the package check found: whether the combination is admitted, and, where it is, which of its members the package holds. */
export type SelectionPackageCompatibility = {
    compatible: boolean
    reasons: string[]
    /**
     * The members of the package built from the combination (ids, in the combination's order): the constraints validated, and those applied.
     * Empty where the combination is refused.
     */
    members: string[]
    /** Each member of the combination the package does not hold, with the existing rule that left it out. Empty where it is refused. */
    notApplied: ConstraintNotApplied[]
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
 *
 * Since 12 November 2026 it also says which members of the combination the package holds (`members`: validated here, and the ones the
 * activity is built from) and, for each it does not, the existing rule that left it out (`notApplied`), read from the package it built.
 * Which combinations it admits is unchanged unless `everyMemberValidated` is set.
 */
export function isSelectionPackageCompatible(input: SelectionPackageCompatibilityInput): SelectionPackageCompatibility {
    const reasons: string[] = []
    try {
        const archetypeDef = testLibraryArchetypeToSystemDefinition(input.archetype)
        const affordanceField = buildAffordanceFieldFromLenses(input.affordanceLenses)
        const iConstraints = input.constraints.map(testLibraryConstraintToIConstraint)
        const pkg = buildConstraintPackage(iConstraints, affordanceField, archetypeDef)
        if (input.requireShaping && !pkg.shaping) throw new Error(`No compatible shaping constraint was found for archetype "${archetypeDef.name}".`)
        validateConstraintPackage(affordanceField, archetypeDef, pkg)
        const held = packageMembersByRole(pkg)
        const members = input.constraints.filter((c) => Object.values(held).some((member) => member?.id === c.id))
        const absent = input.constraints.filter((c) => !members.includes(c))
        // After the checks of the members present (they report first), as on the A02 line.
        if (input.everyMemberValidated && absent.length) {
            throw new Error(
                `The selected ${absent.length === 1 ? 'constraint' : 'constraints'} ${absent.map((c) => `"${c.title}"`).join(', ')} ${absent.length === 1 ? 'is' : 'are'} ${ABSENT_MEMBER_WORDS}, so ${absent.length === 1 ? 'it was' : 'they were'} never validated (the package holds one member per role, and drops a consequence scoring 12 or less).`
            )
        }
        return { compatible: true, reasons: [], members: members.map((c) => c.id), notApplied: absent.map((c) => notAppliedEntry(c, held)) }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        reasons.push(msg)
        return { compatible: false, reasons, members: [], notApplied: [] }
    }
}

type HeldMember = { id: string; title: string } | undefined

/** The package's member of each role, by id and title, read from the package `buildConstraintPackage` returned. */
function packageMembersByRole(pkg: ReturnType<typeof buildConstraintPackage>): Record<ConstraintBalanceBucket, HeldMember> {
    const of = (member: { constraint: IConstraint } | undefined): HeldMember => (member ? { id: String(member.constraint._id), title: String(member.constraint.title ?? member.constraint._id) } : undefined)
    return { foundation: of(pkg.foundation), shaping: of(pkg.shaping), consequence: of(pkg.consequence) }
}

/**
 * The rule that left a combination member out of the package, read from the package: one member per role where the package holds another
 * of its role; otherwise, for a consequence, that none scores above 12 (the best consequence is kept exactly where it scores above 12, so
 * none is kept only where every one scores 12 or less); for a shaping member, that the role scoring admits none (a shaping member scored at
 * all would be kept, there is no threshold). A foundation member always has a kept one: a package without one throws before this is read.
 */
function notAppliedEntry(c: TestLibraryV0Constraint, held: Record<ConstraintBalanceBucket, HeldMember>): ConstraintNotApplied {
    const role = constraintRoleBucket(c)
    const kept = held[role]
    const rule: ConstraintNotAppliedRule = kept ? 'ONE_MEMBER_PER_ROLE' : role === 'consequence' ? 'CONSEQUENCE_SCORE_AT_OR_BELOW_12' : 'NO_ROLE_MATCH'
    return { id: c.id, title: c.title, role, rule, kept: kept ? { ...kept } : null }
}

/** The package role of a library constraint: the same mapping the package is built with (`mapConstraintRole`). */
function constraintRoleBucket(c: TestLibraryV0Constraint): ConstraintBalanceBucket {
    const role = mapConstraintRole(c.constraintRole)
    return role === ConstraintRoles.Foundation ? 'foundation' : role === ConstraintRoles.Shaping ? 'shaping' : 'consequence'
}
