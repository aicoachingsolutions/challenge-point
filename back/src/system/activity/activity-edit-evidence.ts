/**
 * Coach edit evidence.
 *
 * Coach Intelligence §18 lists activity editing as a Pilot 1 capability, and §38 is explicit that
 * the platform records a coach's decision and **does not judge it**. So editing is unrestricted:
 * a coach may change anything about their own activity, including the parts the engine considers
 * structural. Coach Autonomy is a governing principle, and a tool that refuses a coach's edit on
 * representative grounds would be exactly the automated-coach failure the architecture forbids.
 *
 * What we do instead is *notice*. Every edit is classified as presentation-only or as touching a
 * revalidation trigger, and recorded. Two reasons that matters:
 *
 *   1. It is the calibration data for Representative Validation. When the six-domain engine lands
 *      we will want to know how often coaches override representative structure, and which fields
 *      they reach for. Guessing at that now would be guessing.
 *   2. Integration Spec §36 says structural modifications should be submitted for revalidation.
 *      We cannot do that yet — we run three targeted validators, not the RVD engine — so recording
 *      which edits *would have* triggered it keeps the seam visible instead of silently absent.
 *
 * PROVISIONAL CLASSIFICATION. Coach Intelligence §9 says the orchestrator must route on
 * classifications the owning subsystem emits, and must not invent its own definition of
 * "structural modification". Representative Validation does not emit that classification yet, so
 * the table below fills the gap and is marked accordingly — exactly like
 * SIGNAL_GROUP_TO_GAME_PROBLEM. When RV publishes its adjustable-parameter and revalidation-trigger
 * lists, this table should be REPLACED by them rather than reconciled with them.
 *
 * Each mapping cites its source so the replacement is checkable.
 */

/** Coach-facing activity fields a coach may edit. */
export type EditableActivityField =
    | 'title'
    | 'setup'
    | 'intent'
    | 'constraint'
    | 'rules'
    | 'scoringSystem'
    | 'winCondition'
    | 'scaffolding'
    | 'extensions'

export type EditClassification = 'presentation' | 'revalidation-trigger'

/**
 * Provisional field classification.
 *
 * `revalidation-trigger` sources:
 *   - scoringSystem — RV Coach Communication Contract ("may not alter … scoring"); Integration §36.
 *   - winCondition  — Integration §36 ("objectives").
 *   - rules         — RV Coach Communication Contract ("rules"); Integration §36 ("interaction conditions").
 *   - intent        — RV Coach Communication Contract ("representative intent").
 *   - constraint    — carries the selected package summary; changing it restates the design.
 *   - setup         — Integration §36 ("participation structure"); setup carries area, numbers and
 *                     opposition, which RVD-01 treats as constitutive organization.
 *   - extensions    — progressions. RVD-06H "Progression Drift": a progression can change the
 *                     activity's ecological identity, so it is not presentation.
 *
 * `presentation` sources:
 *   - title         — naming only; no mechanic depends on it.
 *   - scaffolding   — coaching cues / observation prompts. These shape what the COACH attends to,
 *                     not what the activity IS. (Note: RVD-04K treats coach language as capable of
 *                     instructional leakage — that is a language concern owned by the coach-language
 *                     layer, not a structural modification.)
 */
export const FIELD_CLASSIFICATION: Readonly<Record<EditableActivityField, EditClassification>> = {
    title: 'presentation',
    scaffolding: 'presentation',
    setup: 'revalidation-trigger',
    intent: 'revalidation-trigger',
    constraint: 'revalidation-trigger',
    rules: 'revalidation-trigger',
    scoringSystem: 'revalidation-trigger',
    winCondition: 'revalidation-trigger',
    extensions: 'revalidation-trigger',
}

const EDITABLE_FIELDS = Object.keys(FIELD_CLASSIFICATION) as EditableActivityField[]

export interface ActivityEditEvidence {
    /** Fields whose value actually changed. Empty when the save was a no-op. */
    changedFields: EditableActivityField[]
    /** The subset that would require revalidation under Integration Spec §36. */
    revalidationTriggerFields: EditableActivityField[]
    /** True when any structural field changed — the flag Evidence Intelligence will care about. */
    touchesRepresentativeStructure: boolean
}

/** Normalize a field value for comparison. Arrays compare element-wise after trimming. */
function normalize(value: unknown): string | null {
    if (typeof value === 'string') return value.trim()
    if (Array.isArray(value)) {
        return JSON.stringify(value.map((v) => (typeof v === 'string' ? v.trim() : v)))
    }
    if (value === undefined || value === null) return null
    return JSON.stringify(value)
}

/**
 * Which coach-facing fields changed between the stored activity and the incoming update, and which
 * of those are structural?
 *
 * Only fields PRESENT in `after` are considered — a partial update must not read every absent field
 * as a deletion. This matters because the update route accepts partial bodies.
 */
export function diffActivityEdit(
    before: Record<string, unknown>,
    after: Record<string, unknown>
): ActivityEditEvidence {
    const changedFields: EditableActivityField[] = []
    for (const field of EDITABLE_FIELDS) {
        if (!(field in after)) continue
        if (normalize(before[field]) !== normalize(after[field])) changedFields.push(field)
    }
    const revalidationTriggerFields = changedFields.filter((f) => FIELD_CLASSIFICATION[f] === 'revalidation-trigger')
    return {
        changedFields,
        revalidationTriggerFields,
        touchesRepresentativeStructure: revalidationTriggerFields.length > 0,
    }
}
