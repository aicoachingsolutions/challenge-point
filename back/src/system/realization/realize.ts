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
import { Bounds } from '../derivation/types'

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
    choices: RecordedChoice[]
    instantiations: (Instantiation & { path: string })[]
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

function readAt(root: Record<string, unknown>, path: string): unknown {
    let node: any = root
    for (const part of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = node[part]
    }
    return node
}

function place(root: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.')
    let node: any = root
    for (const part of parts.slice(0, -1)) {
        if (typeof node[part] !== 'object' || node[part] === null) node[part] = {}
        node = node[part]
    }
    node[parts[parts.length - 1]] = value
}

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
export function realize(resolved: ResolvedGame, choices: Choice[], instantiations: Instantiation[] = []): RealizationResult {
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
        recorded.push({ ...choice, path: open.path, authority: open.permittedBy?.authority ?? null, boundCheck: bound.how })
    }

    for (const open of resolved.open) {
        if (!seen.has(open.lineId)) because.push(`${open.lineId} is open and was not chosen: a concrete game leaves no freedom unclosed`)
    }

    const recordedInstantiations: (Instantiation & { path: string })[] = []
    for (const instantiation of instantiations) {
        const claim = existentialById.get(instantiation.classId)
        if (!claim) {
            because.push(`${instantiation.classId}: no existential claim authorizes instantiating a member here`)
            continue
        }
        recordedInstantiations.push({ ...instantiation, path: claim.path })
    }
    for (const claim of resolved.existential) {
        if (!recordedInstantiations.some(i => i.classId === claim.classId)) {
            because.push(`${claim.classId}: ${claim.path} is asserted to exist and nothing was instantiated to satisfy it`)
        }
    }

    if (because.length) return { outcome: 'REFUSED', because }

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
        const bucket = readAt(game, instantiation.path)
        const list = Array.isArray(bucket) ? (bucket as unknown[]) : []
        place(game, instantiation.path, [...list, { ...instantiation.member, satisfies: instantiation.classId }])
    }

    return {
        outcome: 'REALIZED',
        game,
        record: {
            fromDigest: resolved.provenance.inputDigest,
            choices: recorded,
            instantiations: recordedInstantiations,
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
    const instantiated = new Set(realized.record.instantiations.map(i => i.path))

    const problems: string[] = []
    const walk = (node: unknown, path: string, insideInstantiation: boolean) => {
        if (Array.isArray(node)) {
            const here = instantiated.has(path)
            node.forEach(entry => {
                const id = entry && typeof entry === 'object' ? (entry as any).elementId ?? (entry as any).satisfies : null
                walk(entry, id ? `${path}[${id}]` : path, insideInstantiation || (here && !!(entry as any)?.satisfies))
            })
            return
        }
        if (node && typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) {
                if (k === 'elementId' || k === 'satisfies') continue
                walk(v, path ? `${path}.${k}` : k, insideInstantiation)
            }
            return
        }
        if (node === undefined) return
        if (insideInstantiation) return // authorized by the existential claim, and recorded
        if (!accounted.has(path)) problems.push(`${path}: ${JSON.stringify(node)} traces to nothing derived, chosen or instantiated`)
    }
    walk(realized.game, '', false)
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
