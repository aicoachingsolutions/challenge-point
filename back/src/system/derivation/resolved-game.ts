/**
 * Derivation engine — the **resolved game**, assembled from an emitted result.
 *
 * The engine emits 125 resolution lines. A generator cannot consume lines: it needs the game those
 * lines describe, and it needs to be told, without having to infer it, which parts of that game the
 * knowledge fixed, which parts a realization layer must choose, and which parts nobody established.
 *
 * **This module computes nothing.** Like `diagnostic.ts`, it re-reads what the run already decided
 * and arranges it by the register's own paths. If a figure here is wrong, the engine is wrong. The
 * constraint is deliberate and it is Christian's: a renderer that adds semantics is a second engine
 * that will eventually disagree with the first, which is how `game::V1` came to be reported two ways.
 *
 * Three things it refuses to do, each because something upstream already ruled it out:
 *
 *   - **It never fills an open line.** SD-39's openness is an authorized degree of freedom, and the
 *     downstream choice process fills it. They are listed, with their bounds and authority, as the
 *     realization layer's input.
 *   - **It never treats absence as a decision.** A line that is neither derived nor open is listed
 *     as not established, with the reason the run gave. A consumer that reads this object must be
 *     unable to mistake "nobody authored this" for "this is not in the game".
 *   - **It never individuates an existential assertion.** SD-97: an existence assertion with no
 *     selector says something of the kind exists and identifies nothing. Those assertions are carried
 *     in their own list, because the engine stopped enumerating lines for them and a realization
 *     layer still has to satisfy them.
 */

import { DerivationResult, ResolutionEntry } from './emit'
import { RegisterIndex } from './register'
import { ElementClass, ItemRef, SupportRef } from './types'

/** A line an authority left open, and everything the realization layer needs to close it. */
export interface OpenChoice {
    /** Where it sits in the game, by the register's path. */
    path: string
    lineId: string
    /** The element it belongs to, or null for a game-level property. */
    elementId: string | null
    /** SD-39's authority and the choice space it authorizes. */
    permittedBy: { authority: string; choiceSpace: string } | null
    /** Whatever the knowledge bounded it to, carried verbatim. */
    bounds: unknown[]
    /** `FREE(a)`, `FREE(b)` or `FREE(choice)` — which kind of freedom this is. */
    kind: string
}

/** A line that is neither derived nor open. Absence is never a decision. */
export interface NotEstablished {
    path: string
    lineId: string
    elementId: string | null
    /** `NOT_AUTHORED` or `UNRESOLVED`, as stage 6 classified it. */
    verdict: string
    /** AM-23's reason code, where the run gave one. */
    reason: string | null
}

/**
 * SD-97 — something asserts a member of this collection exists, and individuates nothing. The
 * assertion is real and a realized game must satisfy it; no element here can be described, because
 * nothing described one.
 */
export interface ExistentialClaim {
    path: string
    classId: string
    from: ItemRef
    cardinality: { min: number | null; max: number | null }
}

export interface ResolvedGame {
    /** §8 — what this game was assembled from. Two runs of one input give two identical objects. */
    provenance: {
        inputDigest: string
        engineVersion: string
        registerVersion: string
        derivationRulesVersion: string
    }
    /**
     * Gate A's own claim is *"this game can be coherently laid out and played as specified"*, so its
     * verdict is the answer to whether a realization layer may proceed. It is carried verbatim and
     * no second judgement is formed here.
     */
    coherence: {
        gateA: string
        failingChecks: string[]
        /** True only where Gate A passed — a restatement of Gate A's claim, not a new one. */
        mayRealize: boolean
    }
    /** The game, nested by the register's paths. Only derived values appear. */
    game: Record<string, unknown>
    /** Every derived value again, flat, with its support — so nothing has to be re-derived to trace it. */
    derived: { path: string; lineId: string; value: unknown; resolvedBy: string; support: SupportRef[] }[]
    open: OpenChoice[]
    existential: ExistentialClaim[]
    notEstablished: NotEstablished[]
    counts: Record<string, number>
}

/** `space.regions[].noun` → `{ container: 'space.regions', leaf: 'noun' }`; a game-level row has no container. */
function splitPath(path: string): { container: string | null; leaf: string } {
    const at = path.indexOf('[]')
    if (at === -1) {
        const dot = path.lastIndexOf('.')
        return { container: null, leaf: dot === -1 ? path : path }
    }
    return { container: path.slice(0, at), leaf: path.slice(at + 2).replace(/^\./, '') }
}

/** Read whatever sits at a dotted path, or undefined. */
function readAt(root: Record<string, unknown>, path: string): unknown {
    let node: any = root
    for (const part of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = node[part]
    }
    return node
}

/** Write `value` at a dotted path, creating the objects on the way. Nothing is overwritten. */
function place(root: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.')
    let node: any = root
    for (const part of parts.slice(0, -1)) {
        if (typeof node[part] !== 'object' || node[part] === null) node[part] = {}
        node = node[part]
    }
    node[parts[parts.length - 1]] = value
}

/**
 * Assemble the game an emitted result describes.
 *
 * `classes` is read, not recomputed: it is the only place an existential assertion survives, because
 * SD-97 stopped those assertions enumerating lines and they therefore appear nowhere in `resolution`.
 * Leaving them out would hide, from the layer that has to satisfy them, that they exist at all.
 */
export function assembleResolvedGame(result: DerivationResult, classes: ElementClass[], index: RegisterIndex): ResolvedGame {
    const rows = index.rows
    const game: Record<string, unknown> = {}
    const derived: ResolvedGame['derived'] = []
    const open: OpenChoice[] = []
    const notEstablished: NotEstablished[] = []

    // Elements, in the order the enumeration fixed, so the assembled object is as canonical as the
    // result it comes from (§8).
    const elements = new Map<string, { container: string; entries: Map<string, Record<string, unknown>> }>()
    const pathOf = (entry: ResolutionEntry): string => {
        const row = rows.get(entry.row)
        if (!row) return entry.row
        if (!entry.elementId) return row.path
        const { container, leaf } = splitPath(row.path)
        const member = entry.member === null ? '' : `[${entry.member}]`
        return `${container ?? row.path}[${entry.elementId}]${leaf ? `.${leaf}` : ''}${member}`
    }

    for (const entry of result.resolution) {
        const row = rows.get(entry.row)
        const path = pathOf(entry)

        if (entry.state === 'derived') {
            derived.push({ path, lineId: entry.lineId, value: entry.value, resolvedBy: String(entry.resolvedBy ?? ''), support: entry.support })
            if (!entry.elementId) {
                if (row) place(game, row.path, entry.value)
            } else if (row) {
                const { container, leaf } = splitPath(row.path)
                const key = container ?? row.path
                if (!elements.has(key)) elements.set(key, { container: key, entries: new Map() })
                const bucket = elements.get(key)!
                if (!bucket.entries.has(entry.elementId)) bucket.entries.set(entry.elementId, { elementId: entry.elementId })
                const element = bucket.entries.get(entry.elementId)!
                // A member line carries one member of a set-valued row; they accumulate in order.
                // The leaf may itself be dotted — `position.along` — and is nested, not used as a key
                // with a dot in it, so a consumer reads the register's own shape.
                if (entry.member !== null) {
                    const existing = Array.isArray(readAt(element, leaf)) ? (readAt(element, leaf) as unknown[]) : []
                    place(element, leaf, [...existing, entry.value])
                } else {
                    place(element, leaf, entry.value)
                }
            }
            continue
        }

        if (entry.state === 'open') {
            open.push({
                path,
                lineId: entry.lineId,
                elementId: entry.elementId,
                permittedBy: entry.permittedBy ? { authority: entry.permittedBy.authority, choiceSpace: String(entry.permittedBy.choiceSpace) } : null,
                bounds: entry.bounds ?? [],
                kind: String(entry.verdict ?? ''),
            })
            continue
        }

        // Withdrawn and conditional lines are not failures: SD-88 withdrew them because the condition
        // they depend on is false, so nothing is owed on them and nothing is reported.
        if (entry.lineState !== 'ENUMERATED') continue

        if (entry.state === 'failed') {
            notEstablished.push({ path, lineId: entry.lineId, elementId: entry.elementId, verdict: String(entry.verdict ?? ''), reason: entry.reason ?? null })
        }
    }

    for (const [key, bucket] of [...elements.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        place(game, key, [...bucket.entries.values()])
    }

    // SD-97 — the assertions that individuate nothing, and therefore appear in no line.
    const existential: ExistentialClaim[] = classes
        // A singleton is individuated by the schema invariant (SD-84), so it is a described element
        // and not an existential claim, even though its assertion carries no selector.
        .filter(cls => cls.constraints.any && !cls.singletonBy)
        .map(cls => ({
            path: rows.get(cls.row)?.path ?? cls.row,
            classId: cls.classId,
            from: cls.fromItem,
            cardinality: { min: cls.cardinality?.min ?? null, max: cls.cardinality?.max ?? null },
        }))
        .sort((a, b) => a.classId.localeCompare(b.classId))

    const failingChecks = result.gates.gateA.checks.filter(c => c.verdict === 'FAIL').map(c => c.checkId).sort()

    return {
        provenance: {
            inputDigest: result.run.inputDigest,
            engineVersion: result.versions.engine,
            registerVersion: String(result.versions.register),
            derivationRulesVersion: String(result.versions.derivation),
        },
        coherence: {
            gateA: result.gates.gateA.verdict,
            failingChecks,
            mayRealize: result.gates.gateA.verdict === 'PASS',
        },
        game,
        derived: derived.sort((a, b) => a.lineId.localeCompare(b.lineId)),
        open: open.sort((a, b) => a.lineId.localeCompare(b.lineId)),
        existential,
        notEstablished: notEstablished.sort((a, b) => a.lineId.localeCompare(b.lineId)),
        counts: {
            derived: derived.length,
            open: open.length,
            existential: existential.length,
            notEstablished: notEstablished.length,
        },
    }
}
