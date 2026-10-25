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
import { BoundRegionPairing } from '../derivation/bound-regions'
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
     * by the renderer for "Adjusting the activity" alone. Absent, the fixture is exactly what it was. `moves` (P2, 25 October 2026): the role
     * whose position an adjustment's magnitude changes, only on such an adjustment, read by `adjustment-range.ts` (the renderer's limits on the
     * line it moves, and fidelity's check of them).
     */
    adjustments?: { id: string; words: string; consequence: string | null; citedAs: string; coachWords?: string; moves?: { role: string } }[]
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
     *
     * R3, 24 October 2026: a sentence telling the coach the activity departs from a law it removes without replacing it cites that law's
     * entries here (`defaultLawPath`), as a sentence setting out a mark cites the physical layout.
     */
    defaultLaws?: { realization: string; laws: { law: string; end: 0 | 1 | null; status: string; removedByRealization?: boolean }[] }
    /**
     * **The pairing each region bound to an object cites, whole** — stage L, 24 October 2026 (the d27 design's stage L(b): *"The Set up
     * sentence for the box, figures read from the cited pairing"*). Christian, reply filed 26 October 2026, item 7: *"Use an existing
     * regulation [handling area] when the activity dimensions and setup permit it."* (his noun bracketed for the coupling ratchet). For every
     * region the game binds to an object (register row S7), the entry of the Sport Profile's bound-region block the build checked the game
     * against (GA-BOUND-REGION, which holds the realized region to it after realization), or null where that block holds no entry of the id
     * the region cites. Read by the renderer for the figures the region's sentence says, by fidelity (which refuses that sentence where the
     * pairing's figures are not the region's realized size) and by the review evidence. Given only where the game holds a bound region; absent,
     * the fixture is exactly what it was.
     */
    boundRegions?: { region: string; objectId: string; pairing: BoundRegionPairing | null }[]
}

/**
 * **Where a sentence cites the pairing a bound region's geometry comes from** — stage L (above): the fixture carries it beside the game, as
 * it carries the physical layout and the default-laws account, at `boundRegions.regions[<region element id>]`.
 */
export const BOUND_REGIONS_ROOT = 'boundRegions'
export const boundRegionPath = (region: string): string => `${BOUND_REGIONS_ROOT}.regions[${region}]`

/** One bound region as the fixture carries it: the region, the object it is bound to and the pairing it cites (stage L). */
export interface FixtureBoundRegion {
    elementId: string
    objectId: string
    pairing: BoundRegionPairing | null
}

/** The bound region of that id the fixture carries, or null (stage L). */
export function fixtureBoundRegion(fixture: unknown, region: string): FixtureBoundRegion | null {
    const regions = (fixture as { boundRegions?: { regions?: unknown } } | null | undefined)?.boundRegions?.regions
    return Array.isArray(regions) ? ((regions as FixtureBoundRegion[]).find(entry => entry?.elementId === region) ?? null) : null
}

/**
 * **The account's laws owed an adaptation, as a citation** — stage L, 24 October 2026 (the d27 design's section 2.8: *"It is served only where
 * the default-laws account owes nothing."*). The sentence telling the coach the sport's normal rules apply otherwise cites the account as a
 * whole at this path: what it says rests on nothing being owed at any place. Read by fidelity and the review evidence.
 */
export const DEFAULT_LAWS_OWED = 'defaultLaws.owed'

/**
 * **Where a clause says what a law the account records as applying gives the coach** — stage L, 24 October 2026 (the d27 design's stage L(b)
 * and (c): the handling a region bound to an object carries, and the colour that tells the performer it is for apart). Christian, reply
 * filed 27 October 2026, item 6: *"Where normal [sport] rules remain relevant during live play, they should continue to apply unless
 * explicitly modified."* (his noun bracketed). Cited at `defaultLaws.applied[<law id>]`: a clause qualifying a marking or the roster, so it
 * decides no section (`sections.ts`), while a law departed from is cited at `defaultLawPath` and is said with how play runs.
 */
export const appliedLawPath = (law: string): string => `${APPLIED_LAWS_ROOT}[${law}]`
/** The root every `appliedLawPath` is under (stage L), read by placement and the diagram. */
export const APPLIED_LAWS_ROOT = 'defaultLaws.applied'

/** Whether the account records the law as applying at every place it is accounted for (stage L): only then may a coach be told what it gives. */
export function appliesThroughout(account: FixtureLawEntry[], law: string): boolean {
    const entries = account.filter(entry => entry.law === law)
    return entries.length > 0 && entries.every(entry => entry.status === 'APPLIES')
}

/** Whether the account owes nothing at any place (stage L): only then may a coach be told the normal rules apply otherwise. */
export const owesNothing = (account: FixtureLawEntry[]): boolean => !account.some(entry => entry.status === 'ADAPTATION_OWED')

/**
 * **Where a sentence cites one law of the game's default-laws account** — R3, 24 October 2026 (the d27 design's stage R3: *"fidelity: a law
 * departed from for communication is cited by exactly one sentence"*). Christian, reply filed 27 October 2026, item 2: *"I approve no
 * [restriction on position] for this initial realization, with that modification communicated once to the coach."* (his noun bracketed for
 * the coupling ratchet). The account sits beside the game in the fixture, as the physical layout does, so a law's entries are cited at
 * `defaultLaws.laws[<law id>]` (every place it is accounted for at once). Read by the renderer, placement (`sections.ts`, the root's kind),
 * fidelity and the review evidence; nothing here decides anything.
 */
export const DEFAULT_LAWS_ROOT = 'defaultLaws'
export const defaultLawPath = (law: string): string => `${DEFAULT_LAWS_ROOT}.laws[${law}]`

/**
 * One law at one place, as the fixture carries the account. Stage L (the R3 review's should-fix): `removedByRealization` where it is departed
 * from there only by the departures the realization records on itself (a law its activity removes without replacing it); absent elsewhere.
 */
export interface FixtureLawEntry {
    law: string
    end: 0 | 1 | null
    status: string
    removedByRealization?: boolean
}

/** The account a fixture carries, law by law and place by place, or null where it carries none (R3). */
export function fixtureLawAccount(fixture: unknown): FixtureLawEntry[] | null {
    const laws = (fixture as { defaultLaws?: { laws?: unknown } } | null | undefined)?.defaultLaws?.laws
    return Array.isArray(laws) ? (laws as FixtureLawEntry[]) : null
}

/**
 * **Whether the account records the law as departed from, and nowhere as anything a coach could still meet** (R3): DEPARTED at some place
 * and, at every other place it is accounted for, DEPARTED or NOT_APPLICABLE (where it cannot arise). Only then may a coach be told the
 * activity has none of it; a law that applies or is owed an adaptation anywhere may not be said away.
 */
export function departedThroughout(account: FixtureLawEntry[], law: string): boolean {
    const entries = account.filter(entry => entry.law === law)
    return entries.some(entry => entry.status === 'DEPARTED') && entries.every(entry => entry.status === 'DEPARTED' || entry.status === 'NOT_APPLICABLE')
}

export function assembleRenderingFixture({ resolved, realized, entailed, envelope, accepted, postRealizationValidated, roleNouns, roleHolders, reassignmentNouns, adjustments, alternatives, withdrawnChoices, methodNouns, defaultLaws, boundRegions }: RenderingFixtureParts): Record<string, unknown> {
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
        ...(defaultLaws
            ? { defaultLaws: { status: 'ACCOUNT_OF_THIS_GAME', realization: defaultLaws.realization, laws: defaultLaws.laws.map(entry => ({ law: entry.law, end: entry.end, status: entry.status, ...(entry.removedByRealization ? { removedByRealization: true } : {}) })) } }
            : {}),
        // Stage L: only where the game holds a region bound to an object, so every other fixture is exactly what it was.
        ...(boundRegions?.length ? { boundRegions: { status: 'CITED_PAIRINGS', regions: boundRegions.map(entry => ({ elementId: entry.region, objectId: entry.objectId, pairing: entry.pairing ? JSON.parse(JSON.stringify(entry.pairing)) : null })) } } : {}),
    }
}
