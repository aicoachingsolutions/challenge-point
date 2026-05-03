import { TEST_LIBRARY_V0_ARCHETYPES } from './archetypes'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from './affordanceLenses'
import { TEST_LIBRARY_V0_CONSTRAINTS } from './constraints'
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
}

/** Snapshot for logs/API: CSV conversion report plus live array lengths. */
export function getTestLibraryV0LoadDebug(): TestLibraryV0LoadDebug {
    const r = TEST_LIBRARY_V0_LOAD_REPORT
    const runtimeArrayLengths = {
        archetypes: TEST_LIBRARY_V0_ARCHETYPES.length,
        affordanceLenses: TEST_LIBRARY_V0_AFFORDANCE_LENSES.length,
        constraints: TEST_LIBRARY_V0_CONSTRAINTS.length,
    }
    const runtimeCountsMismatch =
        r.counts.totalArchetypesLoaded !== runtimeArrayLengths.archetypes ||
        r.counts.totalAffordanceLensesLoaded !== runtimeArrayLengths.affordanceLenses ||
        r.counts.totalConstraintsLoaded !== runtimeArrayLengths.constraints

    return {
        ...r,
        runtimeArrayLengths,
        runtimeCountsMismatch,
    }
}
