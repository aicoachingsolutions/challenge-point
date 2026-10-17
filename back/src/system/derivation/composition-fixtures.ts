/**
 * **For tests only.** Named compositions that tests derive from, in place of a Learning Goal's selection.
 *
 * Added 15 October 2026 (stage G1). For a month the corpus's positive control for derivation was
 * `selectFor('A01', 'A01-02')`: Play Out from the Back with From Goal Kicks. What those tests examine is
 * derivation over the knowledge objects that selection committed to — the possession game form (GF2), Wide Zone
 * Advantage, the goal-kick practice situation and the goal's context (RPC-001) — and never whether
 * selection SHOULD commit to them. On 15 October Christian ruled (item 1) that *"approving Gain Access does not
 * automatically authorize the candidate constraints currently derived from vocabulary coverage"*, and (item 7)
 * *"Please leave Wide Zone Advantage out of this initial Play Out from the Back demonstration."* So A01 now
 * selects from its authorization record, which authorizes nothing yet, and stops at selection — and every test
 * that used it as a positive control would have stopped with it, for a reason that is not theirs.
 *
 * Each test is re-pointed to the SAME objects, named here exactly as `selectFor` returned them at e73dc80
 * (measured 15 October 2026, before the record landed), so every assertion they make is unchanged and none is
 * weakened. Nothing here is a selection and nothing serves a coach: these are the objects a test composes, as
 * `buildActivityFromKnowledge` composes a demonstration. It is not a statement that the composition is
 * authorized for any goal — it is exactly the composition he has now said A01 must NOT carry.
 */
import { contractCoverage, KnowledgeSelection } from './run-bounded-selection'

/** What `selectFor('A01', …)` returned on 14 October 2026, in its order and with its roles (measured). */
const A01_SELECTED_UNTIL_15_OCTOBER: { id: string; role: string }[] = [
    { id: 'GF2', role: 'game form' },
    { id: 'tl-v0-constraint-central-density-condition', role: 'foundation constraint' },
    { id: 'tl-v0-constraint-wide-zone-advantage', role: 'shaping constraint' },
    { id: 'tl-v0-constraint-interception-reward', role: 'consequence constraint' },
    { id: 'tl-v0-lens-possession-stability-opportunity', role: 'affordance lens (not contracted knowledge)' },
    { id: 'tl-v0-lens-line-breaking-opportunity', role: 'affordance lens (not contracted knowledge)' },
    { id: 'tl-v0-lens-space-creation-opportunity', role: 'affordance lens (not contracted knowledge)' },
]

/**
 * The composition A01 selected until 15 October, with or without its practice situation — the context last, as
 * `selectFor` placed it. Contracted: GF2, Wide Zone Advantage, A01-02 where named, RPC-001.
 */
export function a01CompositionUntil15October(situationId: 'A01-02' | null): KnowledgeSelection {
    const selected = [
        ...A01_SELECTED_UNTIL_15_OCTOBER.map((entry) => ({ ...entry })),
        ...(situationId ? [{ id: situationId, role: 'practice situation' }] : []),
        { id: 'RPC-001', role: 'representative performance context' },
    ]
    return { selected, ...contractCoverage(selected) }
}
