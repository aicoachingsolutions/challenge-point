/**
 * The rendering fixture — what crosses from a closed concrete game to the renderer and the fidelity check —
 * assembled in ONE place.
 *
 * **Why it is its own module.** There were three copies of this shape: the builder that serves an activity,
 * the script that freezes the Golden Case, and a test that renders through "the same shape". They agreed
 * only because nobody had changed one. The frozen fixture is what the rendering suite is tested against and
 * the builder's is what a coach is served, so two copies drifting is the frozen game ceasing to be the
 * served one while both keep passing. One assembler, and each of them calls it.
 *
 * **It carries, it does not project.** Christian, 13 October 2026: *"I agree with preserving authored
 * ranges, selected starting values, alternatives, and the reasons for those selections throughout
 * realization and communication … The eventual steam-governor feedback mechanism should be able to use those
 * same adjustable dimensions when recommending changes. We don't need to build that feedback mechanism now,
 * but we should preserve the information it will eventually need."*
 *
 * Until then this boundary cut each derived entry and each choice down to `{ path, lineId, value }`. That is
 * where the ranges were lost — not at the closure rule, which closes every line to one value and always
 * will, but one step later, here. Three things now cross whole:
 *
 *   - **a choice** keeps what it was chosen `within`, what kind of `closure` it was, its reason, and whether
 *     a rule closed it rather than a person (`defaultedBy`);
 *   - **a derived entry** keeps its `support` — which contract item, standing decision or session fact each
 *     property comes from. A later adjustment has to know which constraint a property belongs to before it
 *     may propose changing it — and, since 14 October, its `strength` (required, a default, or advisory);
 *   - **`status.bounds`** is new: every bound that sits BESIDE a derived value (`resolved.extentBounds`),
 *     with the path of the line it bounds. Such a bound is never an open line, so it is never closed and was
 *     never in the record; it had one reader, geometry, and reached the coach for a region's width and for
 *     nothing else. Every bound is carried as derivation made it — required, preferred and forbidden each
 *     marked — and none is filtered by kind here, because a reader that needs a kind can ask for it and a
 *     kind dropped at this boundary cannot be asked for by anybody.
 */
import { ResolvedGame } from '../derivation/resolved-game'
import { Bounds } from '../derivation/types'
import { Entailment } from '../realization/assemble-concrete-game'
import { Realized } from '../realization/realize'

/** The session as the fixture states it. */
export interface FixtureEnvelope {
    players: number
    lengthM: number
    widthM: number
    durationMin: number
    roles: Record<string, number>
}

export interface RenderingFixtureParts {
    resolved: ResolvedGame
    realized: Realized
    /** What assembly entailed over the concrete game (`completeConcreteGame`). */
    entailed: Entailment[]
    envelope: FixtureEnvelope
    /** The three acceptance conditions all held. */
    accepted: boolean
    postRealizationValidated: boolean
    /**
     * The DRAFT coach noun for each role (register `roleBlocks.coachNouns`), given only where the game holds roles — stage
     * K3, 15 October 2026, his M1. Carried so the renderer says a role in register words without a register of its own,
     * and so a frozen fixture renders the same words. Absent, the fixture is exactly what it was.
     */
    roleNouns?: Record<string, string>
    /**
     * Which role each block-scoped role holder names (`ROLE_HOLDER_BUILDING` -> `BUILDING`, register `roleBlocks.holderDesignation`),
     * carried beside the nouns and only where they are — stage K7, 15 October 2026. Read by the renderer to say a value written for a
     * role holder (a restart's awardee, a start placement's group, a position measured from a team's end) by that role's DRAFT noun.
     * Absent, the fixture is exactly what it was.
     */
    roleHolders?: Record<string, string>
    /**
     * DRAFT coach nouns for each kind of performer a reassignment moves (register `reassignment`), given only where the game
     * holds a reassignment — stage K4, 15 October 2026, his RD-1 answer. Absent, the fixture is exactly what it was.
     */
    reassignmentNouns?: Record<string, { singular: string; plural: string }>
    /**
     * The adjustments the goal's authorization record authorizes, in his words, given only where it has them — stage K4. Read
     * by the renderer for "Adjusting the activity" alone. Absent, the fixture is exactly what it was.
     */
    adjustments?: { id: string; words: string; consequence: string | null; citedAs: string; coachWords?: string }[]
    /**
     * What defers in this composition (ruling C56), listed as the alternative with its provenance — stage K4. Absent wherever
     * nothing defers. `defersWith` (stage B review fix, 23 October 2026) names the item an entry yields together with, where it yields only
     * with it; its `defersTo`, `deferredTo` and `relationship` are then that item's. Absent on every unpaired entry.
     */
    alternatives?: { contractId: string; itemId: string; row: string; value: unknown; defersTo: string; deferredTo: { contractId: string; itemId: string }[]; relationship: string; defersWith?: string }[]
    /**
     * The game-form choices a record-named provisional realization withdrew by declaration, with why — stage K5, 15 October
     * 2026 (supplied-realization.ts `withdrawn`): the line is settled by the realization's own knowledge (the initial holder of
     * possession, entailed by the start's awardee). Absent wherever nothing is withdrawn.
     */
    withdrawnChoices?: { lineId: string; withdrawnFrom: string; by: string; withdrawnValue: unknown; because: string }[]
    /**
     * The sport's approved noun for each restart method the game holds a transition for, keyed by trigger and method — stage M4,
     * 17 October 2026, his reply filed 19 October 2026, item 4 (`derivation/corpus.ts` loadSportCoachVocabulary). Given only where
     * the game holds such a transition, so the sport-neutral renderer reads the sport's word from the fixture. Absent, the fixture is
     * exactly what it was.
     */
    methodNouns?: { trigger: string; method: string; article: string; noun: string; approvedBy: { words: string; citedAs: string }[] }[]
    /**
     * **This game's default-laws account, law by law and place by place** — R2, 24 October 2026 (the d27 design's section 2.8: *"under
     * COMMON the Restarts sentence is added from the account"*; V9: fidelity refuses a Restarts sentence naming a law the account does not
     * record as departed from, one leaving out a departed restart law with a noun, and the normal-rules sentence wherever anything is owed).
     * The same reading the build makes for the administrator's review evidence (`realization/default-laws-check.ts` blockLawAccountOf, over
     * the realized game and the composed items of the realization being tried), carried as each law's id, place and status only, and given
     * only where that realization declares `defaultLawsCheck`. Absent, the fixture is exactly what it was.
     */
    defaultLaws?: { realization: string; laws: { law: string; end: 0 | 1 | null; status: string }[] }
}

export function assembleRenderingFixture({ resolved, realized, entailed, envelope, accepted, postRealizationValidated, roleNouns, roleHolders, reassignmentNouns, adjustments, alternatives, withdrawnChoices, methodNouns, defaultLaws }: RenderingFixtureParts): Record<string, unknown> {
    const pathOf = new Map(resolved.derived.map(entry => [entry.lineId, entry.path]))
    return {
        provenance: resolved.provenance,
        closure: {
            preRealization: resolved.coherence.preRealization,
            realizationAuthorized: resolved.coherence.realizationAuthorized,
            postRealizationValidated,
            renderEligible: accepted && postRealizationValidated,
        },
        envelope,
        game: realized.game,
        record: realized.record,
        status: {
            // Whole, not field by field (14 October 2026): the allowlist that stood here would have dropped the
            // `strength` each entry now carries, the way this boundary once dropped every range. Carried, it
            // cannot be lost by the next field either; `fixture-currency.unit.ts` asserts the keys survive.
            derived: resolved.derived.map(d => ({ ...d })),
            choices: realized.record.choices.map(choice => ({ ...choice })),
            instantiations: realized.record.instantiations.map(i => ({ path: i.path, classId: i.classId, handle: i.handle, memberIndex: i.memberIndex, member: i.member })),
            entailed,
            geometry: realized.record.geometry,
            bounds: Object.keys(resolved.extentBounds)
                .sort()
                .map(lineId => ({ lineId, path: pathOf.get(lineId) ?? null, bounds: resolved.extentBounds[lineId] as Bounds[] })),
            jointConditions: resolved.jointConditions,
            /**
             * `governedBy` crosses WHOLE since 15 October 2026 (stage K1). His 17 October M6: the three states — no
             * further value, explicitly unrestricted, missing — *"must not collapse into the same operational
             * meaning"*. Which one an entry is lives on the declarations that decided it (classify.ts
             * `nonClaimState`), and this allowlist kept only the reason code and the row-wide kinds, so the state was
             * lost one step before the renderer, which then could not tell a field needing nothing from a field
             * nobody constrains. Each declaration is copied whole, so the next field on it cannot be lost here either.
             */
            notEstablished: resolved.notEstablished.map(n => ({ path: n.path, lineId: n.lineId, reason: n.reason, declared: n.declared, governedBy: n.governedBy.map(g => ({ ...g })) })),
        },
        ...(roleNouns ? { roleNouns: { status: 'DRAFT', nouns: { ...roleNouns }, ...(roleHolders ? { holders: { ...roleHolders } } : {}) } } : {}),
        ...(reassignmentNouns ? { reassignmentNouns: { status: 'DRAFT', nouns: JSON.parse(JSON.stringify(reassignmentNouns)) } } : {}),
        ...(adjustments?.length ? { adjustments: { status: 'DRAFT', entries: JSON.parse(JSON.stringify(adjustments)) } } : {}),
        ...(alternatives?.length ? { alternatives: JSON.parse(JSON.stringify(alternatives)) } : {}),
        ...(withdrawnChoices?.length ? { withdrawnChoices: JSON.parse(JSON.stringify(withdrawnChoices)) } : {}),
        ...(methodNouns?.length ? { methodNouns: { status: 'APPROVED', entries: JSON.parse(JSON.stringify(methodNouns)) } } : {}),
        ...(defaultLaws ? { defaultLaws: { status: 'ACCOUNT_OF_THIS_GAME', realization: defaultLaws.realization, laws: defaultLaws.laws.map(entry => ({ law: entry.law, end: entry.end, status: entry.status })) } } : {}),
    }
}
