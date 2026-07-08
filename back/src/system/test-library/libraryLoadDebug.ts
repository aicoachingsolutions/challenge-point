import {
    testLibraryRegistry,
    type RegisteredTestLibraryCompositionValidationSummary,
    type RegisteredTestLibrarySchemaValidationSummary,
} from './library/registry'
import { TEST_LIBRARY_V0_LOAD_REPORT } from './libraryConversionReport'
import type { TestLibraryV0LoadReport } from './types'

export interface TestLibraryV0LoadDebug extends TestLibraryV0LoadReport {
    /** Lengths of in-memory arrays (must match `counts` after CSV regeneration). */
    runtimeArrayLengths: {
        archetypes: number
        affordanceLenses: number
        constraints: number
    }
    /** True when generated counts disagree with current TS array lengths. */
    runtimeCountsMismatch: boolean
    /** Schema validation results captured when each library was registered. */
    schemaValidation: RegisteredTestLibrarySchemaValidationSummary[]
    /** Cross-object composition validation results for fully registered library versions. */
    compositionValidation: RegisteredTestLibraryCompositionValidationSummary[]
}

/** Snapshot for logs/API: CSV conversion report plus live array lengths. */
export function getTestLibraryV0LoadDebug(): TestLibraryV0LoadDebug {
    const r = TEST_LIBRARY_V0_LOAD_REPORT
    const runtimeArrayLengths = {
        archetypes: testLibraryRegistry.archetypes().length,
        affordanceLenses: testLibraryRegistry.affordanceLenses().length,
        constraints: testLibraryRegistry.constraints().length,
    }
    const runtimeCountsMismatch =
        r.counts.totalArchetypesLoaded !== runtimeArrayLengths.archetypes ||
        r.counts.totalAffordanceLensesLoaded !== runtimeArrayLengths.affordanceLenses ||
        r.counts.totalConstraintsLoaded !== runtimeArrayLengths.constraints

    return {
        ...r,
        runtimeArrayLengths,
        runtimeCountsMismatch,
        schemaValidation: testLibraryRegistry.schemaValidationResults(),
        compositionValidation: testLibraryRegistry.compositionValidationResults(),
    }
}
