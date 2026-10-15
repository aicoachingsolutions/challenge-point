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
import { practical, practicalRequirement } from '../derivation/practical'
import { scaleExactly } from '../derivation/rational'
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

/**
 * **What KIND of closing a choice was** — read from the open line it closed, never from its `because`.
 *
 * Christian, 13 October: *"I agree with preserving authored ranges, selected starting values, alternatives,
 * and the reasons for those selections throughout realization and communication … The initial activity
 * should establish a purposeful starting environment, not prescribe an ideal configuration for the entire
 * session."* Until then the only account of whether a value was the one thing permitted, one of several, a
 * place to start inside a range, or simply the coach's was a sentence of prose nothing interprets.
 *
 *   - `ONLY_VALUE` — exactly one value is authored for the line, so nothing was chosen. Whether that value
 *     is REQUIRED or is an authored preferred default is not said by this word: `within.bounds` carries the
 *     bound with its `preferred` mark, and a reader that needs the difference reads it there;
 *   - `CHOSEN_AMONG_ALTERNATIVES` — one of several stated alternatives; the others are in `within`;
 *   - `STARTING_VALUE_IN_RANGE` — a number inside an authored range: where this activity STARTS, with the
 *     range kept beside it;
 *   - `COACH_DECIDES` — bounded only by a term in words, which SD-15 makes a coach's judgement; the
 *     recorded value stands in for a decision that is theirs;
 *   - `UNBOUNDED` — open, with no permitted set and no bound.
 *
 * **This does not change the closure rule.** A concrete game still leaves no freedom unclosed: the roster
 * has to add up and a region has to be somewhere, so every open line still takes exactly one value. What
 * changes is that the value no longer arrives alone.
 */
export type Closure = 'ONLY_VALUE' | 'CHOSEN_AMONG_ALTERNATIVES' | 'STARTING_VALUE_IN_RANGE' | 'COACH_DECIDES' | 'UNBOUNDED'

/**
 * The two rules under which an open line nobody chose a value for may still be closed. See
 * `justified-defaults.ts`, which is the only place a default is produced; `realize` holds each one it is
 * handed to the rule it names (`unearnedDefault`).
 */
export type DefaultRule = 'ONLY_MEMBER_OF_AUTHORED_BOUND' | 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS'

/** A value offered for an open line in case nobody chose one, with the rule that justifies it. */
export interface JustifiedDefault extends Choice {
    rule: DefaultRule
}

/**
 * **The three things a valid configuration had run together**, kept apart for a count the roster reads —
 * Christian, 14 October 2026: structural validity, knowledge authorization, ecological appropriateness.
 * Each set is a subset of the one before it; `ecological` is a verdict nothing gives yet, and says so.
 */
export interface CountConfigurations {
    /** The roster arithmetic alone: the counts for which the teams still come out whole and equal. */
    structural: number[]
    /** The structural counts inside the REQUIRED bounds — the manipulation's permitted parameters. */
    authorized: number[]
    /** The authorized counts inside the authored PREFERRED range: the normal starting configurations, by his ruling. */
    offered: number[]
    offeredBasis: 'PREFERRED_RANGE_FOR_NORMAL_STARTING_CONFIGURATIONS' | 'NO_PREFERRED_RANGE_AUTHORED'
    /** No learning-design knowledge establishes it. Never filled in by arithmetic. */
    ecological: 'NOT_ASSESSED'
}

export interface RecordedChoice extends Choice {
    path: string
    /** What authorized it, carried from the resolved game. */
    authority: string | null
    /**
     * How the bound was checked — or that it could not be. `WITHIN_DECLARED_DOMAIN` is a value checked
     * against the members of the collection the register declares for its row (`fillableFrom`): the
     * reference is verified, which is a different claim from an authored set having been satisfied.
     */
    boundCheck: 'WITHIN_PERMITTED_SET' | 'WITHIN_COUNT' | 'WITHIN_DECLARED_DOMAIN' | 'UNVERIFIABLE_QUALITATIVE_BOUND' | 'UNBOUNDED'
    /**
     * **What the value was chosen WITHIN** — the open line's own permitted set and bounds, copied at the
     * moment it was closed.
     *
     * The record used to keep the value and the name of the check that passed, and drop the thing it was
     * checked against. So a recorded `2` could not be told from a recorded `2 of 1–2 preferred, at least 1
     * required`, and neither rendering nor any later adjustment could say what else the knowledge allows.
     * `bounds` is every bound on the line as derivation carried it — required, preferred and forbidden each
     * marked as such. `permitted` is the authored alternatives; for a row with a declared domain it is the
     * members of that domain as this game holds them.
     *
     * `configurations` is present only for a count the roster rule reads, and is written at the assembly
     * boundary by that rule (`assemble-concrete-game`), never here. Christian, 13 October: *"I also want
     * neutral-player numbers and participation conditions to remain adjustable during a session, within
     * valid configurations."* And on 14 October, the three things a "valid configuration" had run together:
     * structural validity, knowledge authorization and ecological appropriateness. So it keeps them apart —
     * see `CountConfigurations`.
     */
    within: { permitted: unknown[] | null; bounds: Bounds[]; configurations?: CountConfigurations }
    closure: Closure
    /** Present where nobody chose this value: the rule under which it was closed anyway. */
    defaultedBy?: DefaultRule
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
     *
     * A choice on a row that declares its domain is NOT listed here, though its authored bound is still a
     * term in words: its value was compared with the members of that domain, so it is recorded as
     * `WITHIN_DECLARED_DOMAIN`. What this list names is a value that was compared with nothing.
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
 * One end of a bound, in metres on this envelope. Null where that end is not authored.
 *
 * A fraction is of the axis the bound belongs to — its own where it names one, otherwise the axis of the
 * line it sits on. **The product is taken exactly** (`scaleExactly`): 0.15 of a 23 m width is 3.45 m, and
 * the float product is 3.4499999999999997, which is not a number any coach should be handed and not one a
 * check can compare with the fraction it came from.
 */
function boundInMetres(bound: Bounds, which: 'min' | 'max', envelope: { lengthM?: number; widthM?: number }, lineAxis: 'along' | 'across'): number | null {
    const raw = bound[which]
    if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) return null
    if (!bound.fractionOfAxis) return Number(raw)
    const across = Math.min(Number(envelope.lengthM), Number(envelope.widthM))
    const along = Math.max(Number(envelope.lengthM), Number(envelope.widthM))
    const axis = bound.axis === 'along' || bound.axis === 'across' ? bound.axis : lineAxis
    return scaleExactly(Number(raw), axis === 'along' ? along : across)
}

/**
 * A preferred extent, expressed inside the required one — never beside it and never over it.
 *
 * Both are brought to metres first, because one may be a fraction of the axis and the other absolute:
 * the channel's requirement is 0.15–0.25 of the width and its preference is 6–10 m, and on a 30 m
 * width those are 4.5–7.5 m and 6–10 m. The overlap, 6–7.5 m, is where a realizer may legitimately
 * follow the guidance. Where they do not overlap at all the preference is reported incompatible and the
 * requirement stands — his words: the preference "must never override or widen the requirement".
 */
function intersect(required: Bounds, preference: Bounds, envelope: { lengthM?: number; widthM?: number }, lineAxis: 'along' | 'across' = 'across'): unknown {
    const metres = (bound: Bounds, which: 'min' | 'max'): number | null => boundInMetres(bound, which, envelope, lineAxis)
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

/**
 * The preference inside the requirement, as the practical values it holds (14 October 2026). Only the values on
 * the grain are offered: a range narrower than one step that holds one is that one value; one that holds none is
 * not offered, and says why rather than implying the preference still applies (his §7: *"Don't silently imply that
 * the original preference remains applicable"*). The exact overlap is kept beside it for the record.
 */
function practicalPreference(within: unknown): unknown {
    const exact = within as { min?: number | null; max?: number | null; compatible?: boolean }
    if (!exact || exact.compatible === false || typeof exact.min !== 'number') return within
    const onGrain = practical({ min: exact.min, max: typeof exact.max === 'number' ? exact.max : null }, 'EXTENT_METRES')
    // The exact overlap is recorded in WORDS, never as numbers: every number the game holds is a number a sentence
    // may state (fidelity's quantitiesInGame), and the exact ends are precisely what is not to be stated.
    const exactly = `${exact.min} to ${exact.max ?? 'no upper limit'} m`
    if (!onGrain) {
        return { compatible: false, note: `the preferred extent left inside the requirement (exactly ${exactly}) holds no practical value, so it is not offered and the requirement stands` }
    }
    const moved = onGrain.min !== exact.min || onGrain.max !== (exact.max ?? null)
    return { ...exact, min: onGrain.min, max: onGrain.max, ...(moved ? { note: `${String((exact as any).note ?? 'the preference, expressed inside the requirement, in metres')}; rounded inward to the practical grain from exactly ${exactly}` } : {}) }
}

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

/**
 * The bounds that say what a line MAY be. An exclusion's bound says what it may not be, in words, and is
 * never among them — see `Bounds.forbidden`. Every reader below that asks what is permitted starts here.
 */
const permitting = (choice: OpenChoice): Bounds[] => (choice.bounds as Bounds[]).filter(b => b && !b.forbidden)

/** The members common to every SET bound on the line — what `checkBound` will actually accept. */
function setMembers(choice: OpenChoice): unknown[] | null {
    const sets = permitting(choice).filter(b => b.kind === 'SET' && Array.isArray(b.members))
    if (!sets.length) return null
    return sets[0].members!.filter(member => sets.every(set => set.members!.some(m => JSON.stringify(m) === JSON.stringify(member))))
}

/** A numeric bound that states at least one end. */
const ranged = (b: Bounds): boolean => b.kind === 'COUNT' && ((b.min !== null && b.min !== undefined) || (b.max !== null && b.max !== undefined))

/**
 * Which kind of closing this line admits, from the line alone — **decided in the order `checkBound`
 * decides**, so the kind recorded and the check that passed are always about the same bound: an authored
 * set of alternatives first; then a REQUIRED numeric range; then a set carried as a bound; then a range that
 * is only preferred; then a term in words.
 *
 * It read the sets before the required range until the review of 13 October, while `checkBound` reads the
 * range first. A line carrying both was therefore checked as a count and recorded as *"the only value"* — a
 * record saying one thing was verified when another was. No line in the corpus carries both; the order is
 * fixed here so the first that does is recorded as what it was checked as.
 *
 * A range that is only PREFERRED still makes the value a starting value: the knowledge gave a range to
 * start inside and the value starts there. And a qualitative term is the coach's whether or not the row
 * also declares a domain (SD-15: such terms *"are FREE qualitative coach judgements"*); where it does, the
 * members of the domain are recorded in `within.permitted` so the judgement has its candidates beside it.
 */
export function closureOf(choice: OpenChoice): Closure {
    if (choice.permitted) return choice.permitted.length > 1 ? 'CHOSEN_AMONG_ALTERNATIVES' : 'ONLY_VALUE'
    const bounds = permitting(choice)
    if (bounds.some(b => ranged(b) && !b.preferred)) return 'STARTING_VALUE_IN_RANGE'
    const members = setMembers(choice)
    if (members) return members.length > 1 ? 'CHOSEN_AMONG_ALTERNATIVES' : 'ONLY_VALUE'
    if (bounds.some(ranged)) return 'STARTING_VALUE_IN_RANGE'
    if (bounds.some(b => b.kind === 'QUALITATIVE')) return 'COACH_DECIDES'
    return 'UNBOUNDED'
}

// ── What each default rule is ABOUT ─────────────────────────────────────────────────────────────
//
// The two rules' subjects are stated here, beside the check they must agree with, and read from here by
// both sides: `justified-defaults.ts`, which produces a default, and `realize` below, which will not take
// one on trust.

/**
 * Rule 1's subject: the ONE value the line's sets leave, or nothing.
 *
 * Nothing where the line carries a set of alternatives — that is somebody's decision however small — and
 * nothing where it carries a required numeric range, because then `checkBound` decides by the range and
 * the set is not what the value is held to.
 *
 * **`preferred` says which kind of single member it is, and it matters.** Measured on 13 October: all four
 * lines this rule closes in the corpus — each target's across-extent, each channel's along-extent — carry
 * their one member from a `PREFERRED_DEFAULT` item. It is still the only value AUTHORED for the line, and
 * `checkBound` holds a value to a set whether or not the set is preferred, so no other value realizes; but
 * *"the only value the knowledge permits"* is not what a preferred default is, and the reason recorded for
 * such a default says which it was.
 */
export function onlyPermittedMember(open: OpenChoice): { value: unknown; preferred: boolean } | null {
    if (open.permitted) return null
    const bounds = permitting(open)
    if (bounds.some(b => b.kind === 'COUNT' && !b.preferred)) return null
    const members = setMembers(open)
    if (!members || members.length !== 1) return null
    const sets = bounds.filter(b => b.kind === 'SET' && Array.isArray(b.members))
    const requiredSets = sets.filter(set => !set.preferred)
    if (!requiredSets.length) return { value: members[0], preferred: true }
    // **Where something is REQUIRED, the requirement alone must leave the one value.** A requirement that
    // leaves several, with a preference picking one of them, is a set of alternatives that has a preferred
    // member — a decision the knowledge has an opinion about, not a line it has closed — and no rule makes it.
    const required = requiredSets[0].members!.filter(member => requiredSets.every(set => set.members!.some(m => JSON.stringify(m) === JSON.stringify(member))))
    return required.length === 1 ? { value: members[0], preferred: false } : null
}

const whole = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)

/**
 * Rule 2's candidates: the whole numbers inside the authored preferred range and inside every requirement,
 * with the two ranges they were read from. Null where the line is not such a count.
 *
 * It is deliberately hard to qualify. Every numeric bound must be a whole-number count in its own units —
 * a fraction of an axis is an extent, not a count; there must be an authored preference, or there is nothing
 * to prefer; and the preference must close the range at both ends, or there is no finite set to look in.
 */
export function preferredCounts(open: OpenChoice): { candidates: number[]; preferred: { min: number; max: number }; required: { min: number | null; max: number | null } } | null {
    if (open.permitted) return null
    const bounds = permitting(open)
    if (bounds.some(bound => bound.kind !== 'COUNT')) return null
    if (bounds.some(bound => bound.fractionOfAxis)) return null
    const limits = (wanted: Bounds[], which: 'min' | 'max'): number[] | null => {
        const stated = wanted.map(bound => bound[which]).filter(limit => limit !== null && limit !== undefined)
        return stated.every(whole) ? (stated as number[]) : null
    }
    const preferredBounds = bounds.filter(bound => bound.preferred)
    const requiredBounds = bounds.filter(bound => !bound.preferred)
    if (!preferredBounds.length) return null
    const [preferredMins, preferredMaxes, requiredMins, requiredMaxes] = [limits(preferredBounds, 'min'), limits(preferredBounds, 'max'), limits(requiredBounds, 'min'), limits(requiredBounds, 'max')]
    if (!preferredMins || !preferredMaxes || !requiredMins || !requiredMaxes) return null
    if (!preferredMins.length || !preferredMaxes.length) return null
    const preferred = { min: Math.max(...preferredMins), max: Math.min(...preferredMaxes) }
    const required = { min: requiredMins.length ? Math.max(...requiredMins) : null, max: requiredMaxes.length ? Math.min(...requiredMaxes) : null }
    const from = Math.max(preferred.min, required.min ?? preferred.min)
    const to = Math.min(preferred.max, required.max ?? preferred.max)
    const candidates: number[] = []
    for (let n = from; n <= to; n++) candidates.push(n)
    return { candidates, preferred, required }
}

/**
 * **A default is held to its rule HERE, where it is taken — not only where it is made.** Added in the review
 * of 13 October.
 *
 * `realize` consulted whatever it was handed as a default and checked it only as a value. Measured: with the
 * target's noun withheld, a default of `zone` marked `ONLY_MEMBER_OF_AUTHORED_BOUND` realized, and the
 * record then said a rule had closed a line that holds two design alternatives; the same for who starts with
 * the ball, and for a scoring kind offered under the count rule. `justified-defaults.ts` produces none of
 * those — but the promise is that a default NEVER closes an alternative set or a coach's row, and a promise
 * kept by one caller's good behaviour is not kept by the realizer. His condition, the same day: defaults are
 * welcome *"provided they don't silently override important learning-design choices."*
 *
 * So the rule a default names must be one this line is the subject of, and the value must be the one that
 * rule yields. Whether the ROSTER admits a count is the session's question and stays with the pathway, which
 * can ask it; what is decided here is everything about the line itself. Returns the refusal, or null.
 */
function unearnedDefault(open: OpenChoice, value: unknown, rule: DefaultRule): string | null {
    const refusal = (why: string) =>
        `${open.lineId}: a default was offered under ${String(rule)}, and that rule does not close this line — ${why}. ` +
        `A rule closes only a line the knowledge leaves one value for; anything else is a decision, and needs a choice`
    if (rule === 'ONLY_MEMBER_OF_AUTHORED_BOUND') {
        const only = onlyPermittedMember(open)
        if (!only) return refusal(open.permitted ? 'it holds a set of alternatives' : 'its authored bounds do not come to exactly one member')
        return JSON.stringify(only.value) === JSON.stringify(value) ? null : refusal(`its one member is ${JSON.stringify(only.value)}, not ${JSON.stringify(value)}`)
    }
    if (rule === 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS') {
        const counts = preferredCounts(open)
        if (!counts) return refusal('it is not a whole-number count with an authored preferred range')
        return counts.candidates.some(candidate => candidate === value)
            ? null
            : refusal(`${JSON.stringify(value)} is not a whole number inside both the preferred range ${counts.preferred.min} to ${counts.preferred.max} and what is required`)
    }
    return refusal('it names no rule there is')
}

/**
 * Is the chosen value inside what the knowledge permits?
 *
 * A qualitative bound is the honest hard case. SD-15 ruled that terms like *"long kick"* are coach
 * judgements and that no number may be invented for one, so there is nothing here to compare against.
 * The realizer neither rejects the value nor pretends to have checked it: the choice is recorded as
 * unverified, and the record says which ones.
 */
function checkBound(choice: OpenChoice, value: unknown): { ok: boolean; how: RecordedChoice['boundCheck']; why?: string } {
    if (choice.permitted) {
        const ok = choice.permitted.some(m => JSON.stringify(m) === JSON.stringify(value))
        return ok
            ? { ok: true, how: 'WITHIN_PERMITTED_SET' }
            : { ok: false, how: 'WITHIN_PERMITTED_SET', why: `${choice.lineId}: ${JSON.stringify(value)} is not one of the permitted alternatives ${JSON.stringify(choice.permitted)}` }
    }

    /**
     * **A forbidden set is not a permitted one, and is skipped here.** Latent until 13 October because the
     * one open line carrying an exclusion also carries a permitted set, which is checked first: with that
     * narrowing withheld, the scoring kind was refused as *"not among the authored members"* of the very
     * values the item forbids. Whether a value breaches an exclusion is the forward list's question.
     */
    const bounds = permitting(choice)

    // **A preferred default is not a ceiling.** Enforcing every count bound would silently intersect
    // them, and where one item states a required floor with *no authored maximum* while another
    // states a preferred 1–2, that intersection turns a preference into a hard limit the knowledge
    // never states. SD-90 governs the relationship; here the preferred bounds are simply not enforced.
    const counts = bounds.filter(b => b?.kind === 'COUNT' && !b.preferred)
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

    const sets = bounds.filter(b => b?.kind === 'SET' && Array.isArray(b.members))
    if (sets.length) {
        for (const bound of sets) {
            const ok = bound.members!.some(m => JSON.stringify(m) === JSON.stringify(value))
            if (!ok) {
                return { ok: false, how: 'WITHIN_PERMITTED_SET', why: `${choice.lineId}: ${JSON.stringify(value)} is not among the authored members ${JSON.stringify(bound.members)}` }
            }
        }
        return { ok: true, how: 'WITHIN_PERMITTED_SET' }
    }

    if (bounds.some(b => b?.kind === 'QUALITATIVE')) return { ok: true, how: 'UNVERIFIABLE_QUALITATIVE_BOUND' }
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
    /**
     * **Justified defaults — a SEPARATE input, consulted only for a line that is open and was not chosen.**
     *
     * They cannot simply be appended to `choices`: a choice for a line this game does not hold open is
     * refused (*"nobody established this, so it is not a freedom to close"*), which is right for a decision
     * somebody made about THIS game and wrong for a rule that says what to do wherever a certain kind of
     * line turns up. So a default for a line that is not open, or that somebody chose a value for, is never
     * looked at — an explicit choice always wins — and one that is consulted passes every check a choice
     * passes and is recorded as a choice, with the rule that produced it.
     *
     * His condition for them, 13 October: defaults are welcome *"provided they don't silently override
     * important learning-design choices."* `justified-defaults.ts` produces them, and only where the
     * knowledge and the session admit exactly one value; and a default is not taken on that module's word —
     * it is refused here unless the line is one its rule closes (`unearnedDefault`), so a default handed in
     * for a set of alternatives or for a coach's row closes nothing.
     */
    defaults: JustifiedDefault[] = [],
): RealizationResult {
    const because: string[] = []

    /**
     * The realization input's own digest, taken from the arguments as given and BEFORE anything is applied,
     * so it describes what was supplied rather than what the realizer made of it. Order is preserved: the
     * instantiation order fixes which handle each member gets, so normalising it away would stamp two
     * genuinely different realizations alike. Defaults are input too, and are stamped where there are any —
     * a run given none stamps exactly as it did before they existed.
     */
    const realizationDigest = digest(canonical(defaults.length ? { choices, instantiations, defaults } : { choices, instantiations }))

    if (!resolved.coherence.mayRealize) {
        because.push(`the resolved game may not be realized: Gate A is ${resolved.coherence.gateA}${resolved.coherence.failingChecks.length ? ` (${resolved.coherence.failingChecks.join(', ')})` : ''}`)
    }

    const openByLine = new Map(resolved.open.map(o => [o.lineId, o]))
    const notEstablished = new Set(resolved.notEstablished.map(n => n.lineId))
    const existentialById = new Map(resolved.existential.map(e => [e.classId, e]))
    const seen = new Set<string>()
    const recorded: RecordedChoice[] = []

    /**
     * One value for one open line, checked and recorded — the same for a choice somebody made and for a
     * default nobody did. **The bound it was checked against is kept with it** (`within`), and so is what
     * kind of closing it was (`closure`): see `RecordedChoice`.
     */
    const close = (open: OpenChoice, choice: Choice, defaultedBy?: DefaultRule): void => {
        const bound = checkBound(open, choice.value)
        if (!bound.ok) {
            because.push(bound.why!)
            return
        }
        // Both, not either: the authored bound AND the canonical vocabulary.
        const unregistered = checkVocabulary(open, choice.value, index)
        if (unregistered) {
            because.push(unregistered)
            return
        }
        // A default has passed what a choice passes; it must also be what its rule yields for THIS line.
        const unearned = defaultedBy ? unearnedDefault(open, choice.value, defaultedBy) : null
        if (unearned) {
            because.push(unearned)
            return
        }
        recorded.push({
            ...choice,
            path: open.path,
            authority: open.permittedBy?.authority ?? null,
            boundCheck: bound.how,
            within: { permitted: open.permitted ? [...open.permitted] : null, bounds: (open.bounds as Bounds[]).map(b => ({ ...b })) },
            closure: closureOf(open),
            ...(defaultedBy ? { defaultedBy } : {}),
        })
    }

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
        close(open, choice)
    }

    for (const open of resolved.open) {
        if (seen.has(open.lineId)) continue
        const offered = defaults.filter(candidate => candidate.lineId === open.lineId)
        if (offered.length === 1) {
            const [{ rule, ...value }] = offered
            close(open, value, rule)
            continue
        }
        // Two defaults for one line are two answers to a question that must have exactly one, so neither is taken.
        if (offered.length > 1) because.push(`${open.lineId}: ${offered.length} defaults were offered for one line, and a line has one value`)
        else because.push(`${open.lineId} is open and was not chosen: a concrete game leaves no freedom unclosed`)
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

    /**
     * **The same refusal, on the VALUE side — added 6 October after it caught a live defect.**
     *
     * The loop above refuses a choice whose *path* names an element the game does not hold. A choice whose
     * *value* names one was unchecked, and that gap was not hypothetical: the initial possession holder had been
     * recorded as `…GF2-14.a#0` while this function mints handles from 1, so the one realized game on the pilot
     * path carried a reference to a team that does not exist. Three things had to line up for it to pass —
     * PS1's bound is qualitative, so `boundCheck` is `UNVERIFIABLE_QUALITATIVE_BOUND` and nothing compared the
     * value to anything; no consumer reads `possession.team` yet, so nothing downstream tripped over it; and the
     * acceptance account reported nothing lost and nothing invented, because a dangling reference is neither.
     *
     * **An unverifiable bound means the TERM cannot be checked. It does not mean any string will do.**
     *
     * The test is deliberately narrow, so that it guesses at nothing. It fires only where the value is
     * `<classId>#<digits>` for a class *this realization instantiated* — which is `memberHandle`'s own output
     * for a claim whose members were just minted here — and that exact handle is not among the ones minted.
     * Ordinary prose containing a hash is untouched, and a reference to an established element is untouched,
     * because neither names a class whose members this run produced.
     */
    const mintedHandles = new Set(recordedInstantiations.map(i => String(i.handle)).filter(Boolean))
    const mintedClasses = new Set(recordedInstantiations.map(i => String(i.classId)))
    for (const choice of recorded) {
        const value = choice.value
        if (typeof value !== 'string' || mintedHandles.has(value)) continue
        const hash = value.lastIndexOf('#')
        if (hash < 1 || !/^\d+$/.test(value.slice(hash + 1)) || !mintedClasses.has(value.slice(0, hash))) continue
        return {
            outcome: 'REFUSED',
            because: [
                `${choice.lineId}: the chosen value ${value} names no member of this game. ` +
                    `${value.slice(0, hash)} holds ${[...mintedHandles].sort().join(', ') || 'no members'}`,
            ],
        }
    }

    /**
     * **A row that DECLARES its domain is held to it — added 13 October.**
     *
     * The check above is narrow on purpose and catches one shape: a handle one ordinal out. Everything else
     * still passed. The register says of the possession row that it is filled by *"one of the teams the game
     * establishes"* and says where those are — `fillableFrom: performers.teams[]` — and no code read it.
     * Measured before this: an initial holder of `banana`, and one naming a REGION of the same game, were
     * each accepted here, passed all three acceptance conditions and passed the post-realization gates. Only
     * the fidelity check stopped them, and by accident — the renderer withholds a sentence it cannot word.
     *
     * So the value must be the handle of a member of the collection the row names, as THIS game holds it —
     * established elements and instantiated members alike, which is why it is asked here, after the members
     * are placed. The members are recorded as what the choice was made within: *"left to the coach, among
     * these"* becomes a checked statement instead of one nothing could verify. It needs the register, so a
     * caller that passes none is told nothing about domains, exactly as it is told nothing about vocabularies.
     */
    if (index) {
        for (const choice of recorded) {
            const domain = index.fillableFrom.get(choice.lineId.split('::').pop() ?? '')
            if (!domain) continue
            const bucket = readAt(game, collectionPath(domain))
            const members = (Array.isArray(bucket) ? (bucket as any[]) : []).map(member => member?.elementId).filter((id): id is string => typeof id === 'string')
            if (!members.some(member => member === choice.value)) {
                return {
                    outcome: 'REFUSED',
                    because: [
                        `${choice.lineId}: the chosen value ${JSON.stringify(choice.value)} is not a member of ${domain}, which is what the register ` +
                            `declares this row to be filled from. ${collectionPath(domain)} holds ${members.join(', ') || 'no members'}`,
                    ],
                }
            }
            choice.within.permitted = members
            choice.boundCheck = 'WITHIN_DECLARED_DOMAIN'
        }
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
        /** Which axis a row is about, read from the register's own path rather than from a row-id list. */
        const axisOf = (lineId: string): 'along' | 'across' | null => {
            const path = String(index.rows.get(lineId.split('::').pop() ?? '')?.path ?? '')
            return path.endsWith('.along') ? 'along' : path.endsWith('.across') ? 'across' : null
        }
        /**
         * **`requiredWithin` — the requirement in metres on this envelope, both ends — added 13 October.**
         *
         * The requirement is authored as a fraction of an axis, and only its MAXIMUM ever became metres: the
         * interval is composed at the widest permitted extent. So the game held 7.5 m and never 4.5 m, and
         * the activity said *"up to 7.5 m wide"* about a channel his ruling of 1 October gives *"a minimum of
         * 0.15 and a maximum of 0.25 of the available across dimension"*. A renderer may not work the
         * minimum out for itself — a number computed into the prose is a number on the renderer's own
         * authority — so it is established here, where the fraction already meets the envelope, and
         * carried beside the preference that is expressed inside it.
         */
        const extentOf = (lineId: string, axis: 'along' | 'across'): (Bounds & { requiredWithin?: unknown; preferenceWithin?: unknown }) | undefined => {
            const bounds = ([...(resolved.open.find(o => o.lineId === lineId)?.bounds ?? []), ...(resolved.extentBounds?.[lineId] ?? [])] as Bounds[]).filter(b => b && !b.forbidden)
            const counts = bounds.filter(b => b?.kind === 'COUNT' && (b.min !== null || b.max !== null))
            const required = counts.find(b => !b.preferred)
            if (!required) return counts[0]
            const preference = counts.find(b => b.preferred)
            const measurable = Number.isFinite(Number(envelope?.lengthM)) && Number.isFinite(Number(envelope?.widthM))
            /**
             * **Both written at the practical grain — 14 October 2026** (his §7, rounding at establishment; the
             * grain is data and a proposal awaiting his confirmation). The requirement is rounded INWARD, or kept
             * exact where it holds no practical value; the preference is the practical values inside it, so one
             * that barely fits is one value (*"a practical starting recommendation rather than an awkwardly narrow
             * numerical range"*) and one that holds none is not offered. The same rule is applied to the authored
             * bounds by the fidelity check, independently.
             */
            const exactRequired = { min: boundInMetres(required, 'min', envelope ?? {}, axis), max: boundInMetres(required, 'max', envelope ?? {}, axis) }
            return {
                ...required,
                ...(measurable ? { requiredWithin: practicalRequirement(exactRequired, 'EXTENT_METRES') } : {}),
                ...(preference ? { preferenceWithin: practicalPreference(intersect(required, preference, envelope ?? {}, axis)) } : {}),
            }
        }
        const spatial = [...resolved.derived.map(d => ({ lineId: d.lineId, path: d.path, value: d.value })), ...recorded.map(c => ({ lineId: c.lineId, path: c.path, value: c.value }))]
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
            const longitudinal = selectorTerms?.selector?.find(t => t.attribute === 'longitudinal')?.value

            const realizedGeometry = realizeSpatialRelation(entry.value, index, {
                envelope: envelope ?? {},
                axis,
                extentBound: extentOf(entry.lineId, axis) as any,
                nounExtentDimensions: Number.isFinite(dimensions) ? dimensions : undefined,
                otherAxisHasExtent,
                lateral: typeof lateral === 'string' ? lateral : undefined,
                longitudinal: typeof longitudinal === 'string' ? longitudinal : undefined,
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

/**
 * Every element in a game that carries an authored `scope`, by the path the invention walk names it with
 * (`container[elementId]`). Only primary-event conditions carry one, and only where it is not whole-game
 * (`assembleResolvedGame`, 15 October 2026); read generically so no collection is named here.
 */
function carriedScopes(game: unknown): Map<string, unknown> {
    const found = new Map<string, unknown>()
    const walk = (node: unknown, path: string) => {
        if (Array.isArray(node)) {
            for (const entry of node) {
                const id = entry && typeof entry === 'object' ? (entry as any).elementId : null
                if (id && Object.prototype.hasOwnProperty.call(entry, 'scope')) found.set(`${path}[${id}]`, (entry as any).scope)
                walk(entry, id ? `${path}[${id}]` : path)
            }
            return
        }
        if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k)
    }
    walk(game, '')
    return found
}

/** **Nothing lost** — every derived value survives into the concrete game unchanged. */
export function nothingLost(resolved: ResolvedGame, realized: Realized): string[] {
    const problems: string[] = []
    /**
     * **And every condition's authored scope survives with it** — 15 October 2026. A condition that arrives without
     * the scope it was authored for reads as governing every score, which is the loss the scope was carried to end
     * (SD-36; his 16 October 9.3, "Build-out condition applies only to build-out episodes: Approved."). A projection
     * is only proved by a consumer, so the concrete game is held to the resolved one here.
     */
    const realizedScopes = carriedScopes(realized.game)
    for (const [path, scope] of carriedScopes(resolved.game)) {
        if (!realizedScopes.has(path) || JSON.stringify(realizedScopes.get(path)) !== JSON.stringify(scope)) {
            problems.push(`${path}.scope: authored ${JSON.stringify(scope)}, concrete ${realizedScopes.has(path) ? JSON.stringify(realizedScopes.get(path)) : 'absent'}`)
        }
    }
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
    // An authored condition scope is accounted where — and only where — the resolved game carries the same one on
    // the same element (15 October 2026). It is what the knowledge says the condition is FOR, not a value realization
    // chose; one the resolved game does not carry is an invention like any other.
    const authoredScopes = carriedScopes(resolved.game)
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
                if (k === 'scope' && !within && authoredScopes.has(path) && JSON.stringify(authoredScopes.get(path)) === JSON.stringify(v)) continue
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
