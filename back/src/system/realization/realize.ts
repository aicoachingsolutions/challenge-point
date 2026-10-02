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

export interface RecordedChoice extends Choice {
    path: string
    /** What authorized it, carried from the resolved game. */
    authority: string | null
    /** How the bound was checked — or that it could not be. */
    boundCheck: 'WITHIN_PERMITTED_SET' | 'WITHIN_COUNT' | 'UNVERIFIABLE_QUALITATIVE_BOUND' | 'UNBOUNDED'
}

export interface RealizationRecord {
    fromDigest: string
    /**
     * Authored spatial relations instantiated against the envelope. The phrase remains the value in the
     * concrete game; this is what it entails in metres, recorded beside it with its own reason. Where a
     * phrase fixes a position but not an extent, `extentUnresolved` says so and no number is invented
     * for the missing part.
     */
    geometry: { lineId: string; path: string; geometry: RealizedGeometry }[]
    choices: RecordedChoice[]
    /**
     * `memberIndex` is the member's position in the collection it was placed into. Two members of the
     * same class carry the same `satisfies`, so a path cannot tell them apart — the index is the only
     * exact identity, and `nothingInvented` needs it to know which recorded member a value belongs to.
     */
    instantiations: (Instantiation & { path: string; memberIndex: number })[]
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
        /** The collection, the member's index in it, and the leaf — the only exact address of a member's property. */
        collection: string
        memberIndex: number
        leaf: string
        /** Display form, for traces and provenance: `performers.teams[1].outfieldCount`. */
        path: string
        value: unknown
        because: string
    }[]
    /**
     * Choices whose bound is a qualitative term. SD-15 forbids inventing a number for one, so the
     * realizer cannot check the value against it and says so rather than implying it verified.
     */
    unverified: string[]
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

    const recordedInstantiations: (Instantiation & { path: string; memberIndex: number })[] = []
    for (const instantiation of instantiations) {
        const claim = existentialById.get(instantiation.classId)
        if (!claim) {
            because.push(`${instantiation.classId}: no existential claim authorizes instantiating a member here`)
            continue
        }
        recordedInstantiations.push({ ...instantiation, path: claim.path, memberIndex: -1 })
    }
    for (const claim of resolved.existential) {
        const made = recordedInstantiations.filter(i => i.classId === claim.classId).length

        // **A claim already met by an established member authorizes nothing.** Instantiating anyway
        // would add a member the knowledge never asked for — an invention with a claim's name on it.
        if (claim.shortfall === 0) {
            if (made) {
                because.push(
                    `${claim.classId}: ${claim.path} is already satisfied by ${claim.satisfiedBy.join(', ')}, so instantiating ${made} more is not authorized`,
                )
            }
            continue
        }

        if (!made) {
            because.push(
                `${claim.classId}: ${claim.path} is asserted to exist and nothing was instantiated to satisfy it` +
                    (claim.satisfiedBy.length ? ` (${claim.satisfiedBy.length} established, ${claim.shortfall} still owed)` : ''),
            )
            continue
        }
        // **The claim's cardinality is part of the claim** — but only the shortfall is owed, since an
        // established member counts towards it as much as an instantiated one.
        if (made < claim.shortfall) because.push(`${claim.classId}: ${claim.path} still owes ${claim.shortfall} member(s), and ${made} was instantiated`)
        const { max } = claim.cardinality
        if (max !== null && made + claim.satisfiedBy.length > max) {
            because.push(`${claim.classId}: ${claim.path} asserts at most ${max}, and ${made + claim.satisfiedBy.length} would exist`)
        }
    }

    if (because.length) return { outcome: 'REFUSED', because }

    // **DISTINCT_ON — the joint check, after every individual bound has already passed.**
    // This is the case the condition exists for: each placement can sit inside its own authored
    // bound and the *set* still be invalid, because two members ended up in the same place. Nothing
    // is repaired here; the realization is refused and the offending pair is named.
    const jointFailures: string[] = []
    for (const condition of resolved.jointConditions ?? []) {
        if (condition.kind !== 'DISTINCT_ON') continue
        // One tuple per element, over the rows the condition names, taking each value from the
        // recorded choice where realization made one and from the derived value otherwise.
        const tuples = new Map<string, string>()
        for (const entry of [...resolved.derived, ...recorded.map(c => ({ path: c.path, lineId: c.lineId, value: c.value }))]) {
            const parts = splitElementPath(entry.path)
            if (!parts || !parts.container.startsWith(condition.path.replace(/\[\]$/, ''))) continue
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
                jointFailures.push(
                    `${condition.from.itemId}: ${clash} and ${elementId} occupy the same ${condition.rows.join('/')} (${signature}). ` +
                        `Each placement is inside its own bound; the set is not — "${condition.asAuthored}"`,
                )
            } else {
                seen.set(signature, elementId)
            }
        }
    }
    if (jointFailures.length) return { outcome: 'REFUSED', because: jointFailures }

    // Nothing above failed, so the concrete game is the derived one plus the authorized additions.
    const game: Record<string, unknown> = JSON.parse(JSON.stringify(resolved.game))
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
    for (const instantiation of recordedInstantiations) {
        const path = collectionPath(instantiation.path)
        const bucket = readAt(game, path)
        const list = Array.isArray(bucket) ? (bucket as unknown[]) : []
        instantiation.memberIndex = list.length
        place(game, path, [...list, { ...instantiation.member, satisfies: instantiation.classId }])
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

            const realizedGeometry = realizeSpatialRelation(entry.value, index, {
                envelope: envelope ?? {},
                axis,
                extentBound: extentOf(entry.lineId) as any,
                nounExtentDimensions: Number.isFinite(dimensions) ? dimensions : undefined,
                otherAxisHasExtent,
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
            geometry,
            choices: recorded,
            instantiations: recordedInstantiations,
            // Empty here by construction: nothing is entailed over the concrete game until the concrete
            // game exists. The post-realization entailment pass fills this.
            entailed: [],
            unverified: recorded.filter(c => c.boundCheck === 'UNVERIFIABLE_QUALITATIVE_BOUND').map(c => c.lineId),
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
        if (JSON.stringify(value) !== JSON.stringify(entry.value)) {
            problems.push(`${entry.lineId}: derived ${JSON.stringify(entry.value)}, concrete ${JSON.stringify(value)}`)
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
    const entailedLeaves = new Map<string, Set<string>>()
    const key = (collection: string, index: number) => `${collection}#${index}`
    for (const instantiation of realized.record.instantiations) {
        memberOf.set(key(collectionPath(instantiation.path), instantiation.memberIndex), instantiation.member)
    }
    for (const entry of realized.record.entailed) {
        const k = key(entry.collection, entry.memberIndex)
        if (!entailedLeaves.has(k)) entailedLeaves.set(k, new Set())
        entailedLeaves.get(k)!.add(entry.leaf)
    }

    const problems: string[] = []
    /** The member a value sits inside, and the leaf path it has reached within that member. */
    type Within = { member: Record<string, unknown>; entailed: Set<string>; leaf: string; label: string } | null
    const walk = (node: unknown, path: string, within: Within) => {
        // **Stop at an accounted path.** A derived value may itself be a structured object — a typed
        // structural reference is `{structuralRef: {contractId, itemId}, asAuthored}` — and its
        // internal shape is part of that one value, not three separate unaccounted ones. Descending
        // into it reported the contents of derived knowledge as inventions, which is how this check
        // first ran: three violations, every one of them a value the run had derived.
        if (path && accounted.has(path) && !within) return
        if (Array.isArray(node)) {
            const here = instantiated.has(path)
            node.forEach((entry, i) => {
                const id = entry && typeof entry === 'object' ? (entry as any).elementId ?? (entry as any).satisfies : null
                const member = here && (entry as any)?.satisfies ? memberOf.get(key(path, i)) : undefined
                const next: Within = member
                    ? { member, entailed: entailedLeaves.get(key(path, i)) ?? new Set(), leaf: '', label: `${path}[${i}]` }
                    : within
                walk(entry, id ? `${path}[${id}]` : path, next)
            })
            return
        }
        if (node && typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) {
                if (k === 'elementId' || k === 'satisfies') continue
                walk(v, path ? `${path}.${k}` : k, within ? { ...within, leaf: within.leaf ? `${within.leaf}.${k}` : k } : null)
            }
            return
        }
        if (node === undefined) return
        if (within) {
            // Carried by the member the existential claim authorized, or named by a recorded entailment.
            if (readAt(within.member, within.leaf) !== undefined) return
            if (within.entailed.has(within.leaf)) return
            problems.push(`${within.label}.${within.leaf}: ${JSON.stringify(node)} is inside an instantiated member that does not carry it, and no entailment accounts for it`)
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
