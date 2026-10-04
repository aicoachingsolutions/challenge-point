/**
 * The realization layer — smallest possible form.
 *
 * Its whole job, and the only thing it is being asked to prove:
 *
 *   > Can a structurally valid resolved game be turned into one concrete, playable game **without
 *   > losing support, inventing structure, or closing freedoms the system has no authority to close?**
 *
 * No coach language, no variation, no activity slots. One game, faithfully.
 *
 * **The governing rule, his:** *"Deterministic knowledge establishes the game structure, authoritative
 * requirements, and legitimate degrees of freedom. Realization may resolve only freedoms for which it
 * has explicit authority. It may not convert missing knowledge into a choice or repair an unresolved
 * game by invention."*
 *
 * So this module can do exactly three things:
 *
 *   1. **choose** a value for a line the resolved game lists as `open`, inside the bounds carried
 *      with it, recording the choice and what authorized it;
 *   2. **instantiate** a member that satisfies an `existential` claim, recording that it did;
 *   3. **refuse**, naming what it could not do.
 *
 * Everything else is a refusal, and the refusals are the point. A realization layer that quietly
 * fills a gap produces a game that looks better and means less, which is the failure this whole phase
 * was built to prevent.
 */

import { canonical, digest } from '../derivation/engine'
import { ExistentialClaim, OpenChoice, ResolvedGame } from '../derivation/resolved-game'
import { RegisterIndex } from '../derivation/register'
import { Bounds } from '../derivation/types'
import { realizeSpatialRelation, RealizedGeometry } from './spatial'

/** A value the realizer chooses for one open line. */
export interface Choice {
    lineId: string
    value: unknown
    /** Why this value, in the realizer's own words. Recorded, never interpreted. */
    because: string
}

/** A member the realizer creates to satisfy an existential claim. */
export interface Instantiation {
    classId: string
    /** The member's own properties. Nothing here may contradict the resolved game. */
    member: Record<string, unknown>
    because: string
}

/**
 * **The opaque referential handle for an instantiated member** — his ruling of 3 October:
 *
 *   > *Every instantiated member may receive a unique, stable, opaque referential handle. The handle
 *   > establishes identity only; it carries no domain meaning.*
 *
 * It is minted as an `elementId`, extending the one canonical addressing mechanism rather than adding a
 * second: a derived element's `elementId` is the item that authored it, and a member's is the claim that
 * authorized it plus an ordinal distinguishing it from its siblings. So `container[handle].leaf` addresses
 * a member exactly as it already addresses a derived element, and a typed structural reference resolves
 * against the same field.
 *
 * **The ordinal is beneath the semantic boundary.** It exists only to make siblings distinguishable, per
 * his ruling that *"an ordinal may be used internally to mint the opaque handle"* while *"that ordering
 * must remain beneath the semantic boundary and must never become evidence for a represented property"*.
 * Nothing may order by it, parse it, compare it other than for equality, or recover instantiation order
 * from it; `identity.unit.ts` holds that boundary, including the permutation test.
 *
 * It is deliberately **readable** rather than hashed. He asked not to introduce a content-derived
 * distinction between indiscernible members without a technical reason, and there is none — the ordinal is
 * already reproducible from the realization input. A legible handle keeps the audit trail legible.
 */
export const memberHandle = (classId: string, ordinal: number): string => `${classId}#${ordinal}`

export interface RecordedChoice extends Choice {
    path: string
    /** What authorized it, carried from the resolved game. */
    authority: string | null
    /** How the bound was checked — or that it could not be. */
    boundCheck: 'WITHIN_PERMITTED_SET' | 'WITHIN_COUNT' | 'UNVERIFIABLE_QUALITATIVE_BOUND' | 'UNBOUNDED'
}

export interface RealizationRecord {
    /** The digest of the input the RESOLVED GAME was derived from. Says which knowledge, not which realization. */
    fromDigest: string
    /**
     * **The digest of the realization input** — the choices and instantiations as supplied, in the order
     * supplied.
     *
     * His ruling of 3 October: *"Please extend the realization record's digest/audit identity so that it covers
     * the realization input as well as the resolved-game input. Two distinct realizations of the same resolved
     * game should not carry an audit stamp that makes them appear identical."*
     *
     * The record used to carry only `fromDigest`, which is the resolved game's own input digest, so it said
     * nothing about the decisions realization made — two different realizations of one resolved game stamped
     * identically. That was found while answering whether the handle's ordinal is reproducible: it is, from the
     * realization input, and the gap was that the stamp did not cover that input.
     *
     * **Order is preserved deliberately, not canonicalised away.** The instantiation order determines which
     * handle each member receives, so sorting the list before hashing would make two genuinely different
     * realizations hash alike — the exact defect this closes. Choices are order-insensitive in effect but are
     * hashed as given for the same reason: the stamp describes the input, not a normalisation of it.
     *
     * This is provenance only. Nothing reads it to decide anything about the game.
     */
    realizationDigest: string
    /** The single stamp to compare: the resolved-game input and the realization input together. */
    auditDigest: string
    /**
     * Authored spatial relations instantiated against the envelope. The phrase remains the value in the
     * concrete game; this is what it entails in metres, recorded beside it with its own reason. Where a
     * phrase fixes a position but not an extent, `extentUnresolved` says so and no number is invented
     * for the missing part.
     */
    geometry: { lineId: string; path: string; geometry: RealizedGeometry }[]
    choices: RecordedChoice[]
    /**
     * `handle` is the member's **identity** — the opaque referential handle minted at instantiation (see
     * `memberHandle`). Everything that needs to say *which member* uses it.
     *
     * `memberIndex` is the member's **position** in the collection it was placed into, and nothing more.
     * It used to be the identity, because two members of one claim share a `satisfies` and so could not be
     * told apart by any path. That is what the handle fixes. The index is kept as positional provenance —
     * where in the array this member landed — and `identity.unit.ts` asserts that no check reads it to
     * decide which member it is looking at.
     */
    instantiations: (Instantiation & { path: string; handle: string; memberIndex: number })[]
    /**
     * **Values entailed once the concrete game exists**, written back into it.
     *
     * Some properties cannot be derived until realization has created their subject. The roster is the
     * case that exposed this: the outfield count per team follows necessarily from the session total,
     * the stated specialized roles, the instantiated team count and an authored equality item — but
     * none of that can be evaluated until the teams exist, which is after realization.
     *
     * These are **not realization choices.** Nothing is selected and nothing is bounded; the value is
     * entailed, and the entry carries the chain that entails it. They are recorded separately precisely
     * so they cannot be mistaken for choices, and so `nothingInvented` can account for them by name
     * rather than by the blanket permission that membership of an instantiation used to confer.
     */
    entailed: {
        lineId: string
        /** The collection, the member's HANDLE, and the leaf — the exact address of a member's property. */
        collection: string
        handle: string
        leaf: string
        /**
         * The canonical element path: `performers.teams[c:restated:GF2:GF2-14.a#1].outfieldCount`.
         *
         * This used to be subscripted by the member's index, which made it a display string only — nothing
         * could resolve it, because an index is not an `elementId`. Addressed by the handle it is an
         * ordinary element path, so `splitElementPath` parses it and `nothingLost` can read it.
         */
        path: string
        value: unknown
        because: string
    }[]
    /**
     * Choices whose bound is a qualitative term. SD-15 forbids inventing a number for one, so the
     * realizer cannot check the value against it and says so rather than implying it verified.
     */
    unverified: string[]
    /**
     * Joint conditions that were NOT evaluated, and why — because their scope cannot be partitioned here,
     * because their set is unidentifiable, or because a violation was found under a non-authoritative basis
     * that SD-27 forbids refusing on.
     *
     * Recorded rather than dropped: a condition silently not evaluated is indistinguishable from one that
     * passed, which is exactly how the corpus's only joint condition went unnoticed.
     */
    jointConditionsNotEvaluated: string[]
}

export interface Realized {
    outcome: 'REALIZED'
    /** The concrete game: every derived value, plus every choice and instantiation. */
    game: Record<string, unknown>
    record: RealizationRecord
}

export interface Refused {
    outcome: 'REFUSED'
    /** Every reason, not the first — a realizer that stops at one hides the rest. */
    because: string[]
}

export type RealizationResult = Realized | Refused

export const isRefused = (result: RealizationResult): result is Refused => result.outcome === 'REFUSED'

// ---------------------------------------------------------------------------------------------

export function readAt(root: Record<string, unknown>, path: string): unknown {
    let node: any = root
    for (const part of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = node[part]
    }
    return node
}

export function place(root: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.')
    let node: any = root
    for (const part of parts.slice(0, -1)) {
        if (typeof node[part] !== 'object' || node[part] === null) node[part] = {}
        node = node[part]
    }
    node[parts[parts.length - 1]] = value
}

/**
 * A collection's own path, without the register's `[]` marker.
 *
 * Without this an instantiated member was placed at the literal key `"objectives[]"`, beside the
 * derived `objectives` — **two collections where the game has one**, so anything reading `objectives`
 * would have silently missed every member realization supplied. The concrete game must have one
 * collection per collection.
 */
export const collectionPath = (path: string): string => path.replace(/\[\]$/, '')

/** `space.regions[c:x:y].position.along` → the element bucket and the leaf inside it. */
function splitElementPath(path: string): { container: string; elementId: string; leaf: string } | null {
    const match = path.match(/^(.+?)\[([^\]]+)\](?:\.(.*))?$/)
    if (!match) return null
    return { container: match[1], elementId: match[2], leaf: match[3] ?? '' }
}

/**
 * Is the chosen value inside what the knowledge permits?
 *
 * A qualitative bound is the honest hard case. SD-15 ruled that terms like *"long kick"* are coach
 * judgements and that no number may be invented for one, so there is nothing here to compare against.
 * The realizer neither rejects the value nor pretends to have checked it: the choice is recorded as
 * unverified, and the record says which ones.
 */
/**
 * **A choice must satisfy the canonical register as well as the authored narrowing** — his ruling of
 * 1 October, and it is general rather than a fix for the case that exposed it:
 *
 *   > *A permitted set cannot extend a closed canonical vocabulary merely by containing an additional
 *   > member. If those disagree, realization must refuse and expose the inconsistency.*
 *
 * The case: `GF2-03.b` narrowed the target's noun to `[zone, line]`, and `line` was not in `S3.noun`.
 * Realization checked the permitted set, found `line` in it, and wrote an unregistered value into the
 * concrete game while every check reported success. SD-18 is explicit that a draft list is still closed
 * — *"a value outside it is refused, not admitted as an extension"* — and nothing was enforcing it at
 * this boundary.
 *
 * The refusal names both sides, because the useful information is the **disagreement**: an authored set
 * offering a member the register does not have is a knowledge defect, not a bad choice by a realizer.
 */
/**
 * A preferred extent, expressed inside the required one — never beside it and never over it.
 *
 * Both are brought to metres first, because one may be a fraction of the axis and the other absolute:
 * the channel's requirement is 0.15–0.25 of the width and its preference is 6–10 m, and on a 30 m
 * width those are 4.5–7.5 m and 6–10 m. The overlap, 6–7.5 m, is where a realizer may legitimately
 * follow the guidance. Where they do not overlap at all the preference is reported incompatible and the
 * requirement stands — his words: the preference "must never override or widen the requirement".
 */
function intersect(required: Bounds, preference: Bounds, envelope: { lengthM?: number; widthM?: number }): unknown {
    const across = Math.min(Number(envelope.lengthM), Number(envelope.widthM))
    const along = Math.max(Number(envelope.lengthM), Number(envelope.widthM))
    const metres = (bound: Bounds, which: 'min' | 'max'): number | null => {
        const raw = bound[which]
        if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) return null
        // A fraction is of the axis the bound belongs to; the across dimension is the one a channel
        // width is measured on, and `along` is carried so the helper is not silently across-only.
        return bound.fractionOfAxis ? Number(raw) * (bound.axis === 'along' ? along : across) : Number(raw)
    }
    const lo = Math.max(metres(required, 'min') ?? 0, metres(preference, 'min') ?? 0)
    const hiCandidates = [metres(required, 'max'), metres(preference, 'max')].filter((n): n is number => n !== null)
    const hi = hiCandidates.length ? Math.min(...hiCandidates) : null
    if (hi === null) return { min: lo, max: null, note: 'the preference has no upper limit inside the requirement' }
    if (lo > hi) {
        return {
            compatible: false,
            note: `the preferred extent lies wholly outside the required interval, so it is not offered and the requirement stands`,
        }
    }
    return { min: lo, max: hi, compatible: true, note: 'the preference, expressed inside the requirement, in metres' }
}

function checkVocabulary(choice: OpenChoice, value: unknown, index?: RegisterIndex): string | null {
    if (!index) return null
    const row = choice.lineId.split('::').pop() ?? ''
    // The register names its closed lists `<row>.<leaf>`; a row with no closed list constrains nothing.
    const vocabularyName = [...index.vocabularies.keys()].find(name => name.startsWith(`${row}.`))
    if (!vocabularyName) return null
    const members = index.vocabularies.get(vocabularyName) ?? []
    if (!members.length || typeof value !== 'string' || members.includes(value)) return null
    return (
        `${choice.lineId}: ${JSON.stringify(value)} is not a member of the canonical vocabulary ${vocabularyName} ` +
        `(${members.join(', ')}). The authored permitted set offers it, and a permitted set cannot extend a closed ` +
        `vocabulary — so the knowledge and the register disagree, and that is what needs resolving, not the choice.`
    )
}

function checkBound(choice: OpenChoice, value: unknown): { ok: boolean; how: RecordedChoice['boundCheck']; why?: string } {
    if (choice.permitted) {
        const ok = choice.permitted.some(m => JSON.stringify(m) === JSON.stringify(value))
        return ok
            ? { ok: true, how: 'WITHIN_PERMITTED_SET' }
            : { ok: false, how: 'WITHIN_PERMITTED_SET', why: `${choice.lineId}: ${JSON.stringify(value)} is not one of the permitted alternatives ${JSON.stringify(choice.permitted)}` }
    }

    // **A preferred default is not a ceiling.** Enforcing every count bound would silently intersect
    // them, and where one item states a required floor with *no authored maximum* while another
    // states a preferred 1–2, that intersection turns a preference into a hard limit the knowledge
    // never states. SD-90 governs the relationship; here the preferred bounds are simply not enforced.
    const counts = (choice.bounds as Bounds[]).filter(b => b?.kind === 'COUNT' && !b.preferred)
    if (counts.length) {
        if (typeof value !== 'number') {
            return { ok: false, how: 'WITHIN_COUNT', why: `${choice.lineId}: the bound is a count and ${JSON.stringify(value)} is not a number` }
        }
        for (const bound of counts) {
            if (bound.min !== null && bound.min !== undefined && value < bound.min) {
                return { ok: false, how: 'WITHIN_COUNT', why: `${choice.lineId}: ${value} is below the authored minimum ${bound.min}` }
            }
            if (bound.max !== null && bound.max !== undefined && value > bound.max) {
                return { ok: false, how: 'WITHIN_COUNT', why: `${choice.lineId}: ${value} is above the authored maximum ${bound.max}` }
            }
        }
        return { ok: true, how: 'WITHIN_COUNT' }
    }

    const sets = (choice.bounds as Bounds[]).filter(b => b?.kind === 'SET' && Array.isArray(b.members))
    if (sets.length) {
        for (const bound of sets) {
            const ok = bound.members!.some(m => JSON.stringify(m) === JSON.stringify(value))
            if (!ok) {
                return { ok: false, how: 'WITHIN_PERMITTED_SET', why: `${choice.lineId}: ${JSON.stringify(value)} is not among the authored members ${JSON.stringify(bound.members)}` }
            }
        }
        return { ok: true, how: 'WITHIN_PERMITTED_SET' }
    }

    if ((choice.bounds as Bounds[]).some(b => b?.kind === 'QUALITATIVE')) return { ok: true, how: 'UNVERIFIABLE_QUALITATIVE_BOUND' }
    return { ok: true, how: 'UNBOUNDED' }
}

/**
 * Turn a resolved game into one concrete game, or refuse.
 *
 * Every refusal below is a rule from somewhere else, restated as code:
 * Gate A's claim gates realization; `notEstablished` is missing knowledge and not a choice (his
 * governing rule); an unlisted line has no authority behind it; an unclosed freedom is not a
 * concrete game.
 */
export function realize(
    resolved: ResolvedGame,
    choices: Choice[],
    instantiations: Instantiation[] = [],
    index?: RegisterIndex,
    envelope?: { lengthM?: number; widthM?: number },
): RealizationResult {
    const because: string[] = []

    /**
     * The realization input's own digest, taken from the arguments as given and BEFORE anything is applied,
     * so it describes what was supplied rather than what the realizer made of it. Order is preserved: the
     * instantiation order fixes which handle each member gets, so normalising it away would stamp two
     * genuinely different realizations alike.
     */
    const realizationDigest = digest(canonical({ choices, instantiations }))

    if (!resolved.coherence.mayRealize) {
        because.push(`the resolved game may not be realized: Gate A is ${resolved.coherence.gateA}${resolved.coherence.failingChecks.length ? ` (${resolved.coherence.failingChecks.join(', ')})` : ''}`)
    }

    const openByLine = new Map(resolved.open.map(o => [o.lineId, o]))
    const notEstablished = new Set(resolved.notEstablished.map(n => n.lineId))
    const existentialById = new Map(resolved.existential.map(e => [e.classId, e]))
    const seen = new Set<string>()
    const recorded: RecordedChoice[] = []

    for (const choice of choices) {
        if (seen.has(choice.lineId)) {
            because.push(`${choice.lineId}: chosen twice; a line has one value`)
            continue
        }
        seen.add(choice.lineId)

        if (notEstablished.has(choice.lineId)) {
            because.push(`${choice.lineId}: nobody established this, so it is not a freedom to close — filling it would convert missing knowledge into a choice`)
            continue
        }
        const open = openByLine.get(choice.lineId)
        if (!open) {
            because.push(`${choice.lineId}: the resolved game does not list this line as open, so nothing authorizes a value for it`)
            continue
        }
        const bound = checkBound(open, choice.value)
        if (!bound.ok) {
            because.push(bound.why!)
            continue
        }
        // Both, not either: the authored bound AND the canonical vocabulary.
        const unregistered = checkVocabulary(open, choice.value, index)
        if (unregistered) {
            because.push(unregistered)
            continue
        }
        recorded.push({ ...choice, path: open.path, authority: open.permittedBy?.authority ?? null, boundCheck: bound.how })
    }

    for (const open of resolved.open) {
        if (!seen.has(open.lineId)) because.push(`${open.lineId} is open and was not chosen: a concrete game leaves no freedom unclosed`)
    }

    const recordedInstantiations: (Instantiation & { path: string; handle: string; memberIndex: number })[] = []
    for (const instantiation of instantiations) {
        const claim = existentialById.get(instantiation.classId)
        if (!claim) {
            because.push(`${instantiation.classId}: no existential claim authorizes instantiating a member here`)
            continue
        }
        // `handle` and `memberIndex` are both filled when the member is actually placed, below.
        recordedInstantiations.push({ ...instantiation, path: claim.path, handle: '', memberIndex: -1 })
    }
    /**
     * **Claims on ONE collection are evaluated against ONE population** — his instruction of 3 October to
     * repair *"the collection/co-reference/cardinality hole exposed across A01/A02/A05"*.
     *
     * Each claim used to own a private population: `made` counted only that claim's own instantiations, and
     * the maximum was checked against that count alone. So two claims on `performers.teams[]` — `PCG-08`
     * asserting teams exist, and `GF2-14.a` authoring exactly two — were satisfied by **three teams**, one
     * attributed to the first claim and two to the second, with no objection from either. Two teams were
     * refused whichever way they were attributed. The collection-level cardinality check could not cover for
     * it: it is restricted to individuated classes and is empty for `performers.teams[]` corpus-wide.
     *
     * Five goals carry that shape — A01, A02, A05, TA01 and TA02 — all of them GF2 beside the Pass
     * Combination Gate.
     *
     * **This decides no co-reference question.** It does not rule that the two claims are about the same
     * teams; it stops each claim behaving as though the collection were its own. His own ruling governs the
     * semantics: *"multiple source rows do not by themselves entail multiple physical elements."* So the owed
     * count is the greatest any single claim requires rather than the sum, and every claim's maximum binds the
     * whole population.
     */
    const claimsByCollection = new Map<string, typeof resolved.existential>()
    for (const claim of resolved.existential) {
        const path = collectionPath(claim.path)
        claimsByCollection.set(path, [...(claimsByCollection.get(path) ?? []), claim])
    }
    for (const [path, claims] of claimsByCollection) {
        const classIds = new Set(claims.map(c => c.classId))
        const made = recordedInstantiations.filter(i => classIds.has(i.classId)).length

        /**
         * **A claim whose cardinality could not be read refuses the realization — fail rather than infer.**
         *
         * His ruling of 3 October. The engine used to substitute a minimum of one for an unreadable count, so
         * such a claim looked satisfied by whatever happened to exist. It cannot be: nobody knows how many the
         * author asked for. `UNBOUNDED_COUNT_FILL` is the refusal kind the closed list already reserves for
         * filling a count that is not bounded, and it had never been raised.
         */
        const unreadable = claims.filter(c => c.cardinalityUnreadable)
        if (unreadable.length) {
            for (const claim of unreadable) {
                because.push(
                    `UNBOUNDED_COUNT_FILL — ${claim.classId}: ${path} asserts a count whose value states no readable ` +
                        `number ("${claim.from.contractId}::${claim.from.itemId}"), so how many members it owes is unknown. ` +
                        `The engine will not fill an unreadable count with a minimum of one; the authored number must be ` +
                        `typed under SD-86 before this claim can be satisfied`,
                )
            }
            continue
        }
        // `satisfiedBy` is computed from the ROW, so claims on one collection hold the same established
        // classes. The union is taken so grouping can never double-count them.
        const established = new Set(claims.flatMap(c => c.satisfiedBy))
        const population = established.size + made
        // The greatest shortfall any one claim has, not the sum — one population serves them all. Every claim
        // here has a readable cardinality, because an unreadable one refused above.
        const owed = Math.max(...claims.map(c => c.shortfall ?? 0))
        const describe = claims.map(c => c.classId).join(', ')

        // **A collection already met by established members authorizes nothing.** Instantiating anyway
        // would add a member the knowledge never asked for — an invention with a claim's name on it.
        if (owed === 0) {
            if (made) {
                because.push(
                    `${describe}: ${path} is already satisfied by ${[...established].join(', ')}, so instantiating ${made} more is not authorized`,
                )
            }
            continue
        }

        if (!made) {
            because.push(
                `${describe}: ${path} is asserted to exist and nothing was instantiated to satisfy it` +
                    (established.size ? ` (${established.size} established, ${owed} still owed)` : ''),
            )
            continue
        }

        if (made < owed) {
            because.push(`${describe}: ${path} still owes ${owed} member(s), and ${made} was instantiated`)
        }
        // **Every claim's maximum binds the whole population**, whichever claim a member was attributed to.
        for (const claim of claims) {
            const { max } = claim.cardinality
            if (max !== null && population > max) {
                because.push(
                    `${claim.classId}: ${path} asserts at most ${max}, and ${population} would exist` +
                        (claims.length > 1 ? ` (counting every claim on this collection: ${describe})` : ''),
                )
            }
        }
    }

    /**
     * **An authored collection cardinality constrains realization, not only an existential claim.**
     *
     * His direction of 1 October: *"an authored collection cardinality must actually constrain resolution
     * rather than becoming dead data."* It was dead: the number was consumed only through `existential`,
     * and a class carrying a selector never becomes an existential claim — so the Wide Zone's authored
     * *exactly two channels* constrained nothing while the run produced three.
     *
     * Checked against what the resolved game ESTABLISHED, before any member is instantiated, because a
     * population that already exceeds its authored maximum is not something realization can fix by
     * choosing well. Refusing is the existing mechanism for that, so no new one is introduced.
     */
    for (const bound of resolved.collectionCardinality ?? []) {
        if (bound.max !== null && bound.established > bound.max) {
            because.push(
                `${bound.classId}: ${bound.path} is authored with at most ${bound.max} element(s)` +
                    `${bound.min === bound.max ? ` (exactly ${bound.max})` : ''}, and the resolved game establishes ${bound.established}`,
            )
        }
    }

    if (because.length) return { outcome: 'REFUSED', because }

    // **DISTINCT_ON — the joint check, after every individual bound has already passed.**
    // This is the case the condition exists for: each placement can sit inside its own authored
    // bound and the *set* still be invalid, because two members ended up in the same place. Nothing
    // is repaired here; the realization is refused and the offending pair is named.
    const jointFailures: string[] = []
    const jointNotEvaluable: string[] = []
    for (const condition of resolved.jointConditions ?? []) {
        if (condition.kind !== 'DISTINCT_ON') continue
        if (condition.notEvaluable) {
            jointNotEvaluable.push(`${condition.from.itemId}: ${condition.notEvaluable}`)
            continue
        }
        /**
         * **A scope this layer cannot evaluate makes the condition NOT EVALUABLE, never satisfied.**
         *
         * The corpus's one condition is authored `PER_OBJECTIVE_SET` — *"differs from every other candidate's
         * in the same set"*. Comparing every member of `objects[]` against every other would be a different
         * and stronger claim than the author made, so the honest result is to report that the condition cannot
         * be evaluated rather than to pass it or to over-reach with it.
         */
        if (condition.scope && condition.scope !== 'WHOLE_GAME') {
            jointNotEvaluable.push(
                `${condition.from.itemId}: authored scope ${condition.scope}, and this layer cannot partition ` +
                    `${condition.path} by it — the set the condition ranges over is not identified, so it is ` +
                    `reported rather than evaluated: "${condition.asAuthored}"`,
            )
            continue
        }
        // One tuple per element, over the rows the condition names, taking each value from the
        // recorded choice where realization made one and from the derived value otherwise.
        const tuples = new Map<string, string>()
        const prefix = collectionPath(condition.path)
        for (const entry of [...resolved.derived, ...recorded.map(c => ({ path: c.path, lineId: c.lineId, value: c.value }))]) {
            const parts = splitElementPath(entry.path)
            if (!parts || parts.container !== prefix) continue
            const row = entry.lineId.split('::').pop()!
            if (!condition.rows.includes(row)) continue
            tuples.set(`${parts.elementId}|${row}`, JSON.stringify(entry.value))
        }
        const byElement = new Map<string, string[]>()
        for (const [key, value] of tuples) {
            const elementId = key.split('|')[0]
            byElement.set(elementId, [...(byElement.get(elementId) ?? []), `${key.split('|')[1]}=${value}`])
        }
        const seen = new Map<string, string>()
        for (const [elementId, fields] of [...byElement.entries()].sort()) {
            if (fields.length !== condition.rows.length) continue // not fully placed; nothing to compare yet
            const signature = fields.sort().join(', ')
            const clash = seen.get(signature)
            if (clash) {
                const report =
                    `${condition.from.itemId}: ${clash} and ${elementId} occupy the same ${condition.rows.join('/')} (${signature}). ` +
                    `Each placement is inside its own bound; the set is not — "${condition.asAuthored}"`
                // **SD-27: an assumed item may not create an authoritative collision.** It bounds and never
                // entails, so a violation of it is reported and may not refuse the realization.
                if (condition.authoritative) jointFailures.push(report)
                else jointNotEvaluable.push(`${report} (reported only: the condition's basis is not authoritative)`)
            } else {
                seen.set(signature, elementId)
            }
        }
    }
    if (jointFailures.length) return { outcome: 'REFUSED', because: jointFailures }

    // Nothing above failed, so the concrete game is the derived one plus the authorized additions.
    const game: Record<string, unknown> = JSON.parse(JSON.stringify(resolved.game))

    /**
     * **Mint each instantiated member its opaque handle, and place it under that identity.**
     *
     * The ordinal counts within the claim, so sibling members of one claim differ and members of different
     * claims cannot collide (their claim ids already differ). It is appended unconditionally, even where a
     * claim owes only one member: a mint that yielded the bare `classId` would make a member findable by the
     * element lookups driven from `resolved.derived`, and a member's leaf could then stand in for a derived
     * element's in the acceptance checks — a silent false pass.
     *
     * `satisfies` stays exactly as it was. It says which claim authorized this member, which is a different
     * question from which member this is, and some consumers legitimately want the claim.
     *
     * **Members are placed BEFORE choices are applied.** The order used to be the other way round, which made
     * a realization choice about an instantiated member's property impossible: the choice loop below refuses
     * on an element the game does not yet hold, so such a choice was rejected as naming a missing element
     * before any accounting could see it. Instantiation must precede a choice about the thing instantiated.
     */
    const ordinalWithinClaim = new Map<string, number>()
    for (const instantiation of recordedInstantiations) {
        const path = collectionPath(instantiation.path)
        const bucket = readAt(game, path)
        const list = Array.isArray(bucket) ? (bucket as unknown[]) : []
        const ordinal = (ordinalWithinClaim.get(instantiation.classId) ?? 0) + 1
        ordinalWithinClaim.set(instantiation.classId, ordinal)
        instantiation.handle = memberHandle(instantiation.classId, ordinal)
        instantiation.memberIndex = list.length
        place(game, path, [...list, { ...instantiation.member, satisfies: instantiation.classId, elementId: instantiation.handle }])
    }

    for (const choice of recorded) {
        const parts = splitElementPath(choice.path)
        if (!parts) {
            place(game, choice.path, choice.value)
            continue
        }
        const bucket = readAt(game, parts.container)
        const element = Array.isArray(bucket) ? (bucket as any[]).find(e => e?.elementId === parts.elementId) : null
        if (!element) return { outcome: 'REFUSED', because: [`${choice.lineId}: the element ${parts.elementId} is not in the resolved game`] }
        if (parts.leaf) place(element, parts.leaf, choice.value)
    }

    // Instantiate every authored spatial relation the concrete game now holds, derived AND chosen
    // alike, against the envelope. The prose stays as the value; the metres sit beside it as
    // `realizedGeometry`, carrying the phrase as their own authority.
    const geometry: RealizationRecord['geometry'] = []
    if (index) {
        // A COUNT bound on the same line is an authored EXTENT, and an anchor composed with one is an
        // interval. The bound is read from wherever the resolved game carries it — a derived line's own
        // bounds, or an open line's — so the composition works the same whether the position was
        // derived or chosen.
        /**
         * The extent to resolve against the envelope, and **the requirement wins.**
         *
         * A line may carry both a required extent and a preferred one — the channel carries the
         * authored `bounded minority` requirement and the 6–10 m preference together. His rule of
         * 1 October: *"Where preferred guidance and required bounds both apply, the preference may
         * operate only inside the required feasible interval; it must never override or widen the
         * requirement."* So the required bound is what composes, and the preference is carried beside
         * it **intersected into** the requirement, offered and never enforced. Picking whichever bound
         * came first — which is what this did — let a preference decide the geometry.
         */
        const extentOf = (lineId: string): (Bounds & { preferenceWithin?: unknown }) | undefined => {
            const bounds = [...(resolved.open.find(o => o.lineId === lineId)?.bounds ?? []), ...(resolved.extentBounds?.[lineId] ?? [])] as Bounds[]
            const counts = bounds.filter(b => b?.kind === 'COUNT' && (b.min !== null || b.max !== null))
            const required = counts.find(b => !b.preferred)
            if (!required) return counts[0]
            const preference = counts.find(b => b.preferred)
            return preference ? { ...required, preferenceWithin: intersect(required, preference, envelope ?? {}) } : required
        }
        const spatial = [...resolved.derived.map(d => ({ lineId: d.lineId, path: d.path, value: d.value })), ...recorded.map(c => ({ lineId: c.lineId, path: c.path, value: c.value }))]

        /** Which axis a row is about, read from the register's own path rather than from a row-id list. */
        const axisOf = (lineId: string): 'along' | 'across' | null => {
            const path = String(index.rows.get(lineId.split('::').pop() ?? '')?.path ?? '')
            return path.endsWith('.along') ? 'along' : path.endsWith('.across') ? 'across' : null
        }
        /** The noun realized or derived for this element, if any — the realization choice wins. */
        const nounOf = (elementId: string): string | undefined => {
            const nounRow = (id: string) => String(index.rows.get(id.split('::').pop() ?? '')?.path ?? '').endsWith('.noun')
            const chosen = recorded.find(c => nounRow(c.lineId) && c.lineId.startsWith(elementId))
            if (chosen) return String(chosen.value)
            const derivedNoun = resolved.derived.find(d => nounRow(d.lineId) && d.lineId.startsWith(elementId))
            return derivedNoun ? String(derivedNoun.value) : undefined
        }

        for (const entry of spatial) {
            const axis = axisOf(entry.lineId)
            if (!axis) continue
            const elementId = splitElementPath(entry.path)?.elementId ?? ''
            const noun = nounOf(elementId)
            const dimensions = noun ? Number((index.nounSemantics as any)?.extentDimensions?.[noun]) : undefined

            // Does the element's OTHER axis carry an extent? For a one-dimensional noun that is what
            // makes this axis the thickness rather than the length — orientation from the geometry, not
            // from the noun.
            const other = axis === 'along' ? 'across' : 'along'
            const otherAxisHasExtent = spatial.some(
                o => (splitElementPath(o.path)?.elementId ?? '') === elementId && axisOf(o.lineId) === other && typeof o.value === 'string' && !!(index.relativeTerms as any)?.phraseIndex?.map?.[o.value],
            )

            /**
             * **The element's own authored `lateral` value, read from the selector the game now carries.**
             *
             * His boundary of 2 October: *"realization may consume those authored selectors; it may not
             * infer wide-left/wide-right merely from COUNT 2."* So this reads the element's authored
             * selector and nothing else — no count, no ordering, no position of the element in its
             * collection. An element whose knowledge names no side gets none, and its term's own anchor
             * stands.
             */
            const selectorTerms = (readAt(game, `${splitElementPath(entry.path)?.container}`) as unknown[] | undefined)?.find?.(
                (e: any) => e?.elementId === elementId,
            ) as { selector?: { attribute: string; value?: unknown }[] } | undefined
            const lateral = selectorTerms?.selector?.find(t => t.attribute === 'lateral')?.value

            const realizedGeometry = realizeSpatialRelation(entry.value, index, {
                envelope: envelope ?? {},
                axis,
                extentBound: extentOf(entry.lineId) as any,
                nounExtentDimensions: Number.isFinite(dimensions) ? dimensions : undefined,
                otherAxisHasExtent,
                lateral: typeof lateral === 'string' ? lateral : undefined,
            })
            if (!realizedGeometry) continue
            geometry.push({ lineId: entry.lineId, path: entry.path, geometry: realizedGeometry })
            const parts = splitElementPath(entry.path)
            if (!parts) continue
            const bucket = readAt(game, parts.container)
            const element = Array.isArray(bucket) ? (bucket as any[]).find(e => e?.elementId === parts.elementId) : null
            if (element && parts.leaf) place(element, `realizedGeometry.${parts.leaf}`, realizedGeometry)
        }
    }

    return {
        outcome: 'REALIZED',
        game,
        record: {
            fromDigest: resolved.provenance.inputDigest,
            realizationDigest,
            auditDigest: digest([resolved.provenance.inputDigest, realizationDigest]),
            geometry,
            choices: recorded,
            instantiations: recordedInstantiations,
            // Empty here by construction: nothing is entailed over the concrete game until the concrete
            // game exists. The post-realization entailment pass fills this.
            entailed: [],
            unverified: recorded.filter(c => c.boundCheck === 'UNVERIFIABLE_QUALITATIVE_BOUND').map(c => c.lineId),
            jointConditionsNotEvaluated: jointNotEvaluable,
        },
    }
}

// ---------------------------------------------------------------------------------------------
// The three acceptance conditions. **The third is the one worth having**: it is the only one that
// fails silently, because a game with a gap quietly filled looks better than one without.
// ---------------------------------------------------------------------------------------------

/** **Nothing closed without authority** — no line the knowledge left unestablished carries a value. */
export function nothingClosedWithoutAuthority(resolved: ResolvedGame, realized: Realized): string[] {
    const problems: string[] = []
    for (const entry of resolved.notEstablished) {
        const parts = splitElementPath(entry.path)
        const value = parts
            ? (() => {
                  const bucket = readAt(realized.game, parts.container)
                  const element = Array.isArray(bucket) ? (bucket as any[]).find(e => e?.elementId === parts.elementId) : null
                  return element && parts.leaf ? readAt(element, parts.leaf) : undefined
              })()
            : readAt(realized.game, entry.path)
        if (value !== undefined) {
            problems.push(`${entry.lineId}: nobody established it and the concrete game holds ${JSON.stringify(value)}`)
        }
    }
    return problems
}

/** **Nothing lost** — every derived value survives into the concrete game unchanged. */
export function nothingLost(resolved: ResolvedGame, realized: Realized): string[] {
    const problems: string[] = []
    for (const entry of resolved.derived) {
        const parts = splitElementPath(entry.path)
        const value = parts
            ? (() => {
                  const bucket = readAt(realized.game, parts.container)
                  const element = Array.isArray(bucket) ? (bucket as any[]).find(e => e?.elementId === parts.elementId) : null
                  return element && parts.leaf ? readAt(element, parts.leaf) : undefined
              })()
            : readAt(realized.game, entry.path)

        /**
         * **A set-valued field holds its members in an array, so a member survives by being IN it.**
         *
         * Found by the Wide Zone restatement: `functions` is set-valued (RC-16), and an item establishing
         * `perceptual-reference` derives the member itself while the concrete game holds
         * `["perceptual-reference"]`. Comparing the two directly reported a loss on a value that had
         * arrived intact — and reporting a false loss on a correct game is as damaging as missing a real
         * one, because it trains you to disbelieve the check.
         *
         * Containment is checked, not shape: an array that does NOT contain the derived member is still a
         * loss, and so is a scalar that differs. The member is never assumed present because the field
         * exists.
         */
        /**
         * **A member-subscripted path names one member of a set-valued field**, and must be read as such.
         *
         * The derivation emits two entries for an established member: the field
         * (`…functions` = `"perceptual-reference"`) and the member
         * (`…functions[perceptual-reference]`). The second is a subscript, not a dotted path, so reading it
         * by splitting on `.` resolved nothing and reported a loss on a value sitting correctly in the game.
         */
        const subscript = parts?.leaf.match(/^(.+)\[([^\]]+)\]$/)
        const resolvedValue = (() => {
            if (!subscript || !parts) return value
            const bucket = readAt(realized.game, parts.container)
            const element = Array.isArray(bucket) ? (bucket as any[]).find(e => e?.elementId === parts.elementId) : null
            return element ? readAt(element, subscript[1]) : undefined
        })()

        const survived = Array.isArray(resolvedValue) && !Array.isArray(entry.value)
            ? (resolvedValue as unknown[]).some(member => JSON.stringify(member) === JSON.stringify(entry.value))
            : JSON.stringify(resolvedValue) === JSON.stringify(entry.value)

        if (!survived) {
            problems.push(`${entry.lineId}: derived ${JSON.stringify(entry.value)}, concrete ${JSON.stringify(resolvedValue)}`)
        }
    }
    return problems
}

/**
 * **Nothing invented** — every concrete value traces to a derived value, a recorded choice, or a
 * recorded instantiation. Walks the concrete game rather than the resolved one, because inventions
 * are precisely what the resolved game has no entry for.
 */
export function nothingInvented(resolved: ResolvedGame, realized: Realized): string[] {
    const accounted = new Set<string>()
    for (const entry of resolved.derived) accounted.add(entry.path)
    for (const choice of realized.record.choices) accounted.add(choice.path)
    // Realized geometry traces to the authored phrase it instantiates — it IS that value, in metres,
    // and the record names the line it came from. Accounting for it here is not a loophole: a geometry
    // block with no entry in `record.geometry` would still be reported.
    for (const entry of realized.record.geometry) {
        const parts = splitElementPath(entry.path)
        if (parts) accounted.add(`${parts.container}[${parts.elementId}].realizedGeometry.${parts.leaf}`)
    }
    const instantiated = new Set(realized.record.instantiations.map(i => collectionPath(i.path)))

    /**
     * **Membership of an instantiation is no longer a blanket permission.**
     *
     * This check used to return as soon as it was inside an instantiated member, on the grounds that
     * the existential claim authorized it and the record held it. That was true of the fields the member
     * actually arrived with — and it meant **any value written into a member afterwards escaped the
     * invention check entirely.** Writing the derived roster into a team would have landed in exactly
     * that blind spot, which is how a fix for one silent loss creates the next.
     *
     * So a value inside a member is accounted only if the member genuinely carries it, or a recorded
     * entailment names it. Anything else is an invention, member or not.
     */
    const memberOf = new Map<string, Record<string, unknown>>()
    /**
     * Keyed by member AND leaf, holding the entailed VALUE — not just the leaf name.
     *
     * Name-only accounting was a hole: a member carrying `outfieldCount: 99` beside an entailment recording
     * `outfieldCount` reported nothing, because the set said only that *some* value at that leaf was
     * licensed. An entailment licenses the value it entails and no other.
     */
    const entailedValues = new Map<string, unknown>()
    /** A member's property is addressed by its HANDLE and its leaf — never by its position. */
    const key = (handle: string, leaf: string) => `${handle}#${leaf}`
    for (const instantiation of realized.record.instantiations) {
        if (instantiation.handle) memberOf.set(instantiation.handle, instantiation.member)
    }
    for (const entry of realized.record.entailed) {
        entailedValues.set(key(entry.handle, entry.leaf), entry.value)
    }

    /**
     * Member properties a recorded realization CHOICE governs — the second legitimate route. A choice carries
     * its own path, its authority and the bound that was checked, so it supports the value in its own right.
     *
     * **Two defects his 3 October audit found here, and both are fixed by the handle.**
     *
     * It used to locate the member with `instantiations.findIndex(i => i.classId === parts.elementId)` —
     * *the first* instantiation of a matching claim. Two members of one claim share that claim id, so a
     * choice about **either** member always resolved to the first one. And it stored only the leaf NAME in a
     * `Set<string>`, so the entry licensed *any* value at that leaf rather than the one chosen.
     *
     * Together they were wrong in both directions at once: the first member accepted a value nothing had
     * chosen, and the second member's correct value was reported as an invention. The map immediately above
     * had already been hardened against the name-only half — *"an entailment licenses the value it entails
     * and no other"* — and this one had not been brought with it.
     *
     * Now a choice is matched to the member whose handle its path names, and the value is held, not the name.
     */
    const chosenValues = new Map<string, unknown>()
    for (const choice of realized.record.choices) {
        const parts = splitElementPath(choice.path)
        if (!parts || !parts.leaf || !memberOf.has(parts.elementId)) continue
        chosenValues.set(key(parts.elementId, parts.leaf), choice.value)
    }

    const problems: string[] = []
    /** The member a value sits inside, and the leaf path it has reached within that member. */
    type Within = { member: Record<string, unknown>; memberKey: string; leaf: string; label: string } | null
    const walk = (node: unknown, path: string, within: Within) => {
        // **Stop at an accounted path.** A derived value may itself be a structured object — a typed
        // structural reference is `{structuralRef: {contractId, itemId}, asAuthored}` — and its
        // internal shape is part of that one value, not three separate unaccounted ones. Descending
        // into it reported the contents of derived knowledge as inventions, which is how this check
        // first ran: three violations, every one of them a value the run had derived.
        if (path && accounted.has(path) && !within) return

        /**
         * **Stop at an accounted MEMBER property too, before descending into it.**
         *
         * The mirror of the short-circuit above, and it exists for the same reason: an entailed value may itself
         * be structured, and its shape is part of that one value rather than several unaccounted ones. Checking
         * only at the leaves split a structured entailed value into one false invention per field — the exact
         * mistake the comment above records this check making once before.
         */
        if (within && within.leaf) {
            const k = key(within.memberKey, within.leaf)
            for (const [licensed, source] of [
                [entailedValues, 'the entailment records'] as const,
                [chosenValues, 'the recorded choice is'] as const,
            ]) {
                if (!licensed.has(k)) continue
                const expected = licensed.get(k)
                if (JSON.stringify(expected) === JSON.stringify(node)) return
                problems.push(`${within.label}.${within.leaf}: the game holds ${JSON.stringify(node)} but ${source} ${JSON.stringify(expected)}`)
                return
            }
        }
        if (Array.isArray(node)) {
            const here = instantiated.has(path)
            node.forEach((entry, i) => {
                // **An instantiated member is addressed by its own handle**, which it carries as `elementId`
                // exactly as a derived element does. Before the handle existed this fell back to `satisfies`,
                // which is the CLAIM's id and therefore the same for every member of that claim — so two
                // members collapsed to one path and a failure named a path matching both.
                const id = entry && typeof entry === 'object' ? (entry as any).elementId ?? (entry as any).satisfies : null
                const handle = entry && typeof entry === 'object' ? (entry as any).elementId : null
                const member = here && handle ? memberOf.get(String(handle)) : undefined
                // **An array INSIDE a member advances the leaf by its index**, or `readAt` would be handed
                // `roles.name` for `roles[0].name` and resolve nothing — reporting a value the member
                // genuinely carries as an invention. A team may own a `roles[]` collection, so this is
                // reachable, not hypothetical. The index here is a position within one member's own list,
                // not an answer to which member this is.
                const next: Within = member
                    ? { member, memberKey: String(handle), leaf: '', label: `${path}[${String(handle)}]` }
                    : within
                    ? { ...within, leaf: within.leaf ? `${within.leaf}.${i}` : String(i) }
                    : null
                walk(entry, id ? `${path}[${id}]` : path, next)
            })
            return
        }
        if (node && typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) {
                // `elementId`, `satisfies` and `selector` are an element's IDENTITY — which element this
                // is, and which claim or authored selector picks it out. They are not values established
                // about it, so they are not candidates for invention.
                if (k === 'elementId' || k === 'satisfies' || k === 'selector') continue
                walk(v, path ? `${path}.${k}` : k, within ? { ...within, leaf: within.leaf ? `${within.leaf}.${k}` : k } : null)
            }
            return
        }
        if (node === undefined) return
        if (within) {
            /**
             * **Authority to instantiate an element does not entail authority to populate its properties.**
             *
             * His ruling of 2 October, and it closes the last blanket permission in this check. The existential
             * support that establishes a team, a region or an objective establishes **that element**. A property
             * ON that element still needs its own support: an entailment, or a governed realization choice whose
             * permissible choice space is itself supported.
             *
             * Until now a value the instantiation simply asserted was accepted because the member carried it —
             * which made "the claim authorized this member" do duty for "something authorizes this value". That is
             * how `performers.teams[].designation` reached the concrete game: an unregistered property, supplied
             * with the positional reason "first of the two", carrying a token canonical knowledge defines as the
             * team CURRENTLY IN POSSESSION.
             *
             * Two routes remain, and both carry their support in the record rather than in the instantiation:
             * a recorded ENTAILMENT, or a recorded CHOICE whose bound was checked.
             */
            const licensedKey = key(within.memberKey, within.leaf)
            for (const [licensed, source] of [
                [entailedValues, 'the entailment records'] as const,
                [chosenValues, 'the recorded choice is'] as const,
            ]) {
                if (!licensed.has(licensedKey)) continue
                const expected = licensed.get(licensedKey)
                if (JSON.stringify(expected) === JSON.stringify(node)) return
                problems.push(`${within.label}.${within.leaf}: the game holds ${JSON.stringify(node)} but ${source} ${JSON.stringify(expected)}`)
                return
            }

            problems.push(
                `${within.label}.${within.leaf}: ${JSON.stringify(node)} is a property of an instantiated member with no ` +
                    `support of its own — the claim establishes the element, not its properties, and nothing entails or ` +
                    `governs this value`,
            )
            return
        }
        if (!accounted.has(path)) problems.push(`${path}: ${JSON.stringify(node)} traces to nothing derived, chosen or instantiated`)
    }
    walk(realized.game, '', null)
    return problems
}

/** All three, in the order that matters. */
export function checkRealization(resolved: ResolvedGame, realized: Realized) {
    return {
        nothingClosedWithoutAuthority: nothingClosedWithoutAuthority(resolved, realized),
        nothingLost: nothingLost(resolved, realized),
        nothingInvented: nothingInvented(resolved, realized),
    }
}
