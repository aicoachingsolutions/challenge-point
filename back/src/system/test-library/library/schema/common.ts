import type { TestLibrarySchemaValidationError, TestLibrarySchemaValidationResult } from './types'

type Row = object

function fieldValue(row: Row, field: string): unknown {
    return (row as Record<string, unknown>)[field]
}

export function result(errors: TestLibrarySchemaValidationError[]): TestLibrarySchemaValidationResult {
    return { valid: errors.length === 0, errors }
}

export function requireNonEmptyString(errors: TestLibrarySchemaValidationError[], row: Row, field: string): void {
    const value = fieldValue(row, field)
    if (typeof value !== 'string' || value.trim().length === 0) {
        errors.push({ field, message: 'must be a non-empty string' })
    }
}

export function requireString(errors: TestLibrarySchemaValidationError[], row: Row, field: string): void {
    if (typeof fieldValue(row, field) !== 'string') {
        errors.push({ field, message: 'must be a string' })
    }
}

export function requireBoolean(errors: TestLibrarySchemaValidationError[], row: Row, field: string): void {
    if (typeof fieldValue(row, field) !== 'boolean') {
        errors.push({ field, message: 'must be a boolean' })
    }
}

export function requireStringArray(errors: TestLibrarySchemaValidationError[], row: Row, field: string): void {
    const value = fieldValue(row, field)
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
        errors.push({ field, message: 'must be an array of strings' })
    }
}

export function optionalStringArray(errors: TestLibrarySchemaValidationError[], row: Row, field: string): void {
    if (fieldValue(row, field) === undefined) return
    requireStringArray(errors, row, field)
}
