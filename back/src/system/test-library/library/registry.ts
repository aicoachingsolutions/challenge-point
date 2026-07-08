import { TEST_LIBRARY_V0_ARCHETYPES } from '../archetypes'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from '../affordanceLenses'
import { TEST_LIBRARY_V0_CONSTRAINTS } from '../constraints'
import { validateAffordanceLensSchema, validateArchetypeSchema, validateConstraintSchema } from './schema'
import type { TestLibraryV0AffordanceLens, TestLibraryV0Archetype, TestLibraryV0Constraint } from '../types'
import type { TestLibrarySchemaValidationError } from './schema'

export type TestLibraryRegistryType = 'affordanceLenses' | 'constraints' | 'archetypes'

export type TestLibraryRegistryItems = {
    affordanceLenses: TestLibraryV0AffordanceLens[]
    constraints: TestLibraryV0Constraint[]
    archetypes: TestLibraryV0Archetype[]
}

export interface TestLibraryRegistration<T extends TestLibraryRegistryType = TestLibraryRegistryType> {
    type: T
    version: string
    items: TestLibraryRegistryItems[T]
}

export interface RegisteredTestLibrarySummary {
    type: TestLibraryRegistryType
    versions: string[]
    activeVersion: string
    itemCount: number
}

export interface RegisteredTestLibrarySchemaValidationSummary {
    type: TestLibraryRegistryType
    version: string
    valid: boolean
    errors: TestLibrarySchemaValidationError[]
}

type RegisteredLibraries = {
    [K in TestLibraryRegistryType]: Map<string, TestLibraryRegistryItems[K]>
}

const registeredLibraries: RegisteredLibraries = {
    affordanceLenses: new Map(),
    constraints: new Map(),
    archetypes: new Map(),
}

const schemaValidationResults: { [K in TestLibraryRegistryType]: Map<string, RegisteredTestLibrarySchemaValidationSummary> } = {
    affordanceLenses: new Map(),
    constraints: new Map(),
    archetypes: new Map(),
}

const activeVersions: Record<TestLibraryRegistryType, string> = {
    affordanceLenses: 'v0',
    constraints: 'v0',
    archetypes: 'v0',
}

function validateRegisteredItems<T extends TestLibraryRegistryType>(registration: TestLibraryRegistration<T>): RegisteredTestLibrarySchemaValidationSummary {
    const errors: TestLibrarySchemaValidationError[] = []
    registration.items.forEach((item, index) => {
        const validation =
            registration.type === 'affordanceLenses'
                ? validateAffordanceLensSchema(item as TestLibraryV0AffordanceLens)
                : registration.type === 'constraints'
                  ? validateConstraintSchema(item as TestLibraryV0Constraint)
                  : validateArchetypeSchema(item as TestLibraryV0Archetype)
        for (const error of validation.errors) {
            errors.push({ field: 'items[' + index + '].' + error.field, message: error.message })
        }
    })
    return { type: registration.type, version: registration.version, valid: errors.length === 0, errors }
}

export function registerLibrary<T extends TestLibraryRegistryType>(registration: TestLibraryRegistration<T>): void {
    registeredLibraries[registration.type].set(registration.version, registration.items)
    schemaValidationResults[registration.type].set(registration.version, validateRegisteredItems(registration))
    activeVersions[registration.type] = registration.version
}

function activeItems<T extends TestLibraryRegistryType>(type: T): TestLibraryRegistryItems[T] {
    const version = activeVersions[type]
    const items = registeredLibraries[type].get(version)
    if (!items) {
        throw new Error(`Test Library registry missing active library ${type}@${version}`)
    }
    return items
}

export function activeLibraryVersion(type: TestLibraryRegistryType): string {
    return activeVersions[type]
}

export function registeredLibrarySummaries(): RegisteredTestLibrarySummary[] {
    return (Object.keys(registeredLibraries) as TestLibraryRegistryType[]).map((type) => {
        const activeVersion = activeVersions[type]
        return {
            type,
            versions: Array.from(registeredLibraries[type].keys()),
            activeVersion,
            itemCount: activeItems(type).length,
        }
    })
}

export function registeredLibrarySchemaValidationResults(): RegisteredTestLibrarySchemaValidationSummary[] {
    return (Object.keys(schemaValidationResults) as TestLibraryRegistryType[]).flatMap((type) =>
        Array.from(schemaValidationResults[type].values())
    )
}

export const testLibraryRegistry = {
    affordanceLenses: () => activeItems('affordanceLenses'),
    constraints: () => activeItems('constraints'),
    archetypes: () => activeItems('archetypes'),
    activeVersion: activeLibraryVersion,
    registeredLibraries: registeredLibrarySummaries,
    schemaValidationResults: registeredLibrarySchemaValidationResults,
}

registerLibrary({ type: 'affordanceLenses', version: 'v0', items: TEST_LIBRARY_V0_AFFORDANCE_LENSES })
registerLibrary({ type: 'constraints', version: 'v0', items: TEST_LIBRARY_V0_CONSTRAINTS })
registerLibrary({ type: 'archetypes', version: 'v0', items: TEST_LIBRARY_V0_ARCHETYPES })
