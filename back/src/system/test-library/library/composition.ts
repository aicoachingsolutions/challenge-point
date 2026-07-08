import type { TestLibraryV0AffordanceLens, TestLibraryV0Archetype, TestLibraryV0Constraint } from '../types'
import type { TestLibrarySchemaValidationError, TestLibrarySchemaValidationResult } from './schema'

export interface TestLibraryCompositionInput {
    affordanceLenses: TestLibraryV0AffordanceLens[]
    constraints: TestLibraryV0Constraint[]
    environmentalManipulations?: TestLibraryV0Constraint[]
    archetypes: TestLibraryV0Archetype[]
}

const KNOWN_TARGET_AFFORDANCE_PRIMITIVES = new Set(['perception'])
const KNOWN_RECOMMENDED_CONSTRAINT_TYPE_PRIMITIVES = new Set(['Any (balanced mix)'])

function slug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
}

function affordanceRefs(input: TestLibraryCompositionInput): Set<string> {
    const refs = new Set<string>()
    for (const lens of input.affordanceLenses) {
        refs.add(slug(lens.category))
        refs.add(slug(lens.title))
    }
    for (const archetype of input.archetypes) {
        for (const ref of [...archetype.primaryAffordances, ...archetype.secondaryAffordances]) {
            refs.add(ref)
        }
    }
    return refs
}

export function validateLibraryComposition(input: TestLibraryCompositionInput): TestLibrarySchemaValidationResult {
    const errors: TestLibrarySchemaValidationError[] = []
    const knownAffordances = affordanceRefs(input)
    const allConstraints = [...input.constraints, ...(input.environmentalManipulations ?? [])]
    const knownConstraintArchetypes = new Set(allConstraints.map((constraint) => constraint.constraintArchetype).filter(Boolean))

    function validateConstraintRefs(constraint: TestLibraryV0Constraint, fieldPrefix: string): void {
        const target = constraint.targetAffordancePrimary
        if (target && !knownAffordances.has(target) && !KNOWN_TARGET_AFFORDANCE_PRIMITIVES.has(target)) {
            errors.push({
                field: `${fieldPrefix}.targetAffordancePrimary`,
                message: `unknown target affordance reference: ${target}`,
            })
        }
        if (
            (constraint.primaryConstraintType || '').toLowerCase() === 'information' &&
            (constraint.environmentalRealizations?.length ?? 0) === 0
        ) {
            errors.push({
                field: `${fieldPrefix}.environmentalRealizations`,
                message: 'information constraints must define environmentalRealizations',
            })
        }
    }

    input.constraints.forEach((constraint, index) => validateConstraintRefs(constraint, `constraints[${index}]`))
    ;(input.environmentalManipulations ?? []).forEach((constraint, index) =>
        validateConstraintRefs(constraint, `environmentalManipulations[${index}]`)
    )

    input.archetypes.forEach((archetype, index) => {
        for (const recommendedType of archetype.recommended_constraint_types) {
            if (!knownConstraintArchetypes.has(recommendedType) && !KNOWN_RECOMMENDED_CONSTRAINT_TYPE_PRIMITIVES.has(recommendedType)) {
                errors.push({
                    field: `archetypes[${index}].recommended_constraint_types`,
                    message: `unknown recommended constraint type: ${recommendedType}`,
                })
            }
        }
    })

    return { valid: errors.length === 0, errors }
}
