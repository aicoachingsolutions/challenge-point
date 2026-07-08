import type { TestLibraryV0Constraint } from '../../types'
import { optionalStringArray, requireBoolean, requireNonEmptyString, requireString, requireStringArray, result } from './common'
import type { TestLibrarySchemaValidationError, TestLibrarySchemaValidationResult } from './types'

const REQUIRED_NON_EMPTY_FIELDS: (keyof TestLibraryV0Constraint)[] = [
    'id',
    'title',
    'description',
    'type',
    'category',
    'designIntent',
    'constraintArchetype',
    'constraintRole',
    'primaryConstraintType',
    'targetAffordancePrimary',
]

const STRING_FIELDS: (keyof TestLibraryV0Constraint)[] = [
    'affordanceTagGroup',
    'notes',
    'contextualAudit',
    'suggestedConstraintPrompt',
    'incentiveMechanism',
    'visibilityEffect',
    'logicUsageNote',
]

export function validateConstraintSchema(row: TestLibraryV0Constraint): TestLibrarySchemaValidationResult {
    const errors: TestLibrarySchemaValidationError[] = []
    for (const field of REQUIRED_NON_EMPTY_FIELDS) requireNonEmptyString(errors, row, field)
    for (const field of STRING_FIELDS) requireString(errors, row, field)
    requireStringArray(errors, row, 'gameTemplateAnchor')
    requireBoolean(errors, row, 'includesIncentiveLayer')
    optionalStringArray(errors, row, 'coachVocabulary')
    optionalStringArray(errors, row, 'setupGuidance')
    optionalStringArray(errors, row, 'environmentalRealizations')
    return result(errors)
}
