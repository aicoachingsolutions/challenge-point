import type { TestLibraryV0Constraint } from '../../types'
import { validateConstraintSchema } from './constraint'
import type { TestLibrarySchemaValidationResult } from './types'

export function validateEnvironmentalManipulationSchema(row: TestLibraryV0Constraint): TestLibrarySchemaValidationResult {
    return validateConstraintSchema(row)
}
