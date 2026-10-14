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
}

export function assembleRenderingFixture({ resolved, realized, entailed, envelope, accepted, postRealizationValidated }: RenderingFixtureParts): Record<string, unknown> {
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
            notEstablished: resolved.notEstablished.map(n => ({ path: n.path, lineId: n.lineId, reason: n.reason, declared: n.declared })),
        },
    }
}
