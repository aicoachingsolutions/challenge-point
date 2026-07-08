import type { TestLibraryV0AffordanceLens } from '../../types'
import { optionalStringArray, requireNonEmptyString, requireString, requireStringArray, result } from './common'
import type { TestLibrarySchemaValidationError, TestLibrarySchemaValidationResult } from './types'

const REQUIRED_NON_EMPTY_FIELDS: (keyof TestLibraryV0AffordanceLens)[] = [
    'id',
    'title',
    'description',
    'type',
    'category',
    'designIntent',
]

const STRING_FIELDS: (keyof TestLibraryV0AffordanceLens)[] = [
    'affordanceTagGroup',
    'notes',
    'contextualAudit',
    'suggestedConstraintPrompt',
    'logicUsageNote',
]

const STRING_ARRAY_FIELDS: (keyof TestLibraryV0AffordanceLens)[] = [
    'gameTemplateAnchor',
    'constraintSupport',
    'exampleConsequencePatterns',
    'visibilityTriggers',
]

export function validateAffordanceLensSchema(row: TestLibraryV0AffordanceLens): TestLibrarySchemaValidationResult {
    const errors: TestLibrarySchemaValidationError[] = []
    for (const field of REQUIRED_NON_EMPTY_FIELDS) requireNonEmptyString(errors, row, field)
    for (const field of STRING_FIELDS) requireString(errors, row, field)
    for (const field of STRING_ARRAY_FIELDS) requireStringArray(errors, row, field)
    optionalStringArray(errors, row, 'coachVocabulary')
    return result(errors)
}
