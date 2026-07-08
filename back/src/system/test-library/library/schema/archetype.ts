import type { TestLibraryV0Archetype } from '../../types'
import { optionalStringArray, requireNonEmptyString, requireString, requireStringArray, result } from './common'
import type { TestLibrarySchemaValidationError, TestLibrarySchemaValidationResult } from './types'

const REQUIRED_NON_EMPTY_FIELDS: (keyof TestLibraryV0Archetype)[] = [
    'id',
    'game_form_id',
    'game_form_name',
    'objective',
    'interaction_structure',
    'directionality_type',
    'phase_of_play',
    'player_structure_logic',
    'representative_design_notes',
]

const STRING_FIELDS: (keyof TestLibraryV0Archetype)[] = [
    'constraintFit_structural',
    'constraintFit_shaping',
    'constraintFit_consequence',
    'logicUsageNote',
]

const STRING_ARRAY_FIELDS: (keyof TestLibraryV0Archetype)[] = [
    'typical_affordances',
    'recommended_constraint_types',
    'primaryAffordances',
    'secondaryAffordances',
    'recommendedConstraintTypes',
    'exampleConstraintPatterns',
    'exampleIncentivePatterns',
]

export function validateArchetypeSchema(row: TestLibraryV0Archetype): TestLibrarySchemaValidationResult {
    const errors: TestLibrarySchemaValidationError[] = []
    for (const field of REQUIRED_NON_EMPTY_FIELDS) requireNonEmptyString(errors, row, field)
    for (const field of STRING_FIELDS) requireString(errors, row, field)
    for (const field of STRING_ARRAY_FIELDS) requireStringArray(errors, row, field)
    optionalStringArray(errors, row, 'coachVocabulary')
    optionalStringArray(errors, row, 'setupGuidance')
    return result(errors)
}
