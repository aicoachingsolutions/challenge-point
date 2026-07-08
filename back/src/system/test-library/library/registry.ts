import { TEST_LIBRARY_V0_ARCHETYPES } from '../archetypes'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from '../affordanceLenses'
import { TEST_LIBRARY_V0_CONSTRAINT_POOL_ORDER, TEST_LIBRARY_V0_CONSTRAINTS } from '../constraints'
import { TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS } from '../environmental-manipulations'
import { validateLibraryComposition } from './composition'
import { validateAffordanceLensSchema, validateArchetypeSchema, validateConstraintSchema } from './schema'
import type { TestLibraryV0AffordanceLens, TestLibraryV0Archetype, TestLibraryV0Constraint } from '../types'
import type { TestLibrarySchemaValidationError } from './schema'

export type TestLibraryRegistryType = 'affordanceLenses' | 'constraints' | 'environmentalManipulations' | 'archetypes'

export type TestLibraryRegistryItems = {
    affordanceLenses: TestLibraryV0AffordanceLens[]
    constraints: TestLibraryV0Constraint[]
    environmentalManipulations: TestLibraryV0Constraint[]
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

export interface RegisteredTestLibraryCompositionValidationSummary {
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
    environmentalManipulations: new Map(),
    archetypes: new Map(),
}

const schemaValidationResults: { [K in TestLibraryRegistryType]: Map<string, RegisteredTestLibrarySchemaValidationSummary> } = {
    affordanceLenses: new Map(),
    constraints: new Map(),
    environmentalManipulations: new Map(),
    archetypes: new Map(),
}

const compositionValidationResults = new Map<string, RegisteredTestLibraryCompositionValidationSummary>()

const activeVersions: Record<TestLibraryRegistryType, string> = {
    affordanceLenses: 'v0',
    constraints: 'v0',
    environmentalManipulations: 'v0',
    archetypes: 'v0',
}

function validateRegisteredItems<T extends TestLibraryRegistryType>(registration: TestLibraryRegistration<T>): RegisteredTestLibrarySchemaValidationSummary {
    const errors: TestLibrarySchemaValidationError[] = []
    registration.items.forEach((item, index) => {
        const validation =
            registration.type === 'affordanceLenses'
                ? validateAffordanceLensSchema(item as TestLibraryV0AffordanceLens)
                : registration.type === 'constraints' || registration.type === 'environmentalManipulations'
                  ? validateConstraintSchema(item as TestLibraryV0Constraint)
                  : validateArchetypeSchema(item as TestLibraryV0Archetype)
        for (const error of validation.errors) {
            errors.push({ field: 'items[' + index + '].' + error.field, message: error.message })
        }
    })
    return { type: registration.type, version: registration.version, valid: errors.length === 0, errors }
}

function refreshCompositionValidation(version: string): void {
    const affordanceLenses = registeredLibraries.affordanceLenses.get(version)
    const constraints = registeredLibraries.constraints.get(version)
    const environmentalManipulations = registeredLibraries.environmentalManipulations.get(version) ?? []
    const archetypes = registeredLibraries.archetypes.get(version)
    if (!affordanceLenses || !constraints || !archetypes) return

    const validation = validateLibraryComposition({
        affordanceLenses,
        constraints: selectableConstraintPool(constraints, environmentalManipulations),
        archetypes,
    })
    compositionValidationResults.set(version, { version, valid: validation.valid, errors: validation.errors })
}

export function registerLibrary<T extends TestLibraryRegistryType>(registration: TestLibraryRegistration<T>): void {
    registeredLibraries[registration.type].set(registration.version, registration.items)
    schemaValidationResults[registration.type].set(registration.version, validateRegisteredItems(registration))
    activeVersions[registration.type] = registration.version
    refreshCompositionValidation(registration.version)
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

function selectableConstraintPool(
    constraints: TestLibraryV0Constraint[],
    environmentalManipulations: TestLibraryV0Constraint[]
): TestLibraryV0Constraint[] {
    const byId = new Map([...constraints, ...environmentalManipulations].map((constraint) => [constraint.id, constraint]))
    return TEST_LIBRARY_V0_CONSTRAINT_POOL_ORDER.map((id) => {
        const constraint = byId.get(id)
        if (!constraint) {
            throw new Error(`Missing Test Library V0 selectable constraint during pool assembly: ${id}`)
        }
        return constraint
    })
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

export function registeredLibraryCompositionValidationResults(): RegisteredTestLibraryCompositionValidationSummary[] {
    return Array.from(compositionValidationResults.values())
}

export const testLibraryRegistry = {
    affordanceLenses: () => activeItems('affordanceLenses'),
    constraints: () => activeItems('constraints'),
    environmentalManipulations: () => activeItems('environmentalManipulations'),
    selectableConstraints: () => selectableConstraintPool(activeItems('constraints'), activeItems('environmentalManipulations')),
    archetypes: () => activeItems('archetypes'),
    activeVersion: activeLibraryVersion,
    registeredLibraries: registeredLibrarySummaries,
    schemaValidationResults: registeredLibrarySchemaValidationResults,
    compositionValidationResults: registeredLibraryCompositionValidationResults,
}

registerLibrary({ type: 'affordanceLenses', version: 'v0', items: TEST_LIBRARY_V0_AFFORDANCE_LENSES })
registerLibrary({ type: 'constraints', version: 'v0', items: TEST_LIBRARY_V0_CONSTRAINTS })
registerLibrary({ type: 'environmentalManipulations', version: 'v0', items: TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS })
registerLibrary({ type: 'archetypes', version: 'v0', items: TEST_LIBRARY_V0_ARCHETYPES })
