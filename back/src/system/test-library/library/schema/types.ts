export interface TestLibrarySchemaValidationError {
    field: string
    message: string
}

export interface TestLibrarySchemaValidationResult {
    valid: boolean
    errors: TestLibrarySchemaValidationError[]
}
