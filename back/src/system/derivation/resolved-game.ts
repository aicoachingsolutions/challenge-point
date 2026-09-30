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
import { ElementClass, ItemRef, LoadedContract, SupportRef } from './types'

/** A line an authority left open, and everything the realization layer needs to close it. */
export interface OpenChoice {
    /** Where it sits in the game, by the register's path. */
    path: string
    lineId: string
    /** The element it belongs to, or null for a game-level property. */
    elementId: string | null
    /** SD-39's authority and the choice space it authorizes. */
    permittedBy: { authority: string; choiceSpace: string } | null
    /** Where the freedom is a choice among stated alternatives, the alternatives (SD-78). */
    permitted: unknown[] | null
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
    /**
     * What the knowledge actually declared on this row — the whole reaching set, not the one code
     * AM-23 could express. `['NON_CLAIMED']` and `['UNDECLARED']` both report as *coverage*, and they
     * are not the same thing: the first is an object saying it does not constrain the row, the
     * second is nobody having looked. Carried so the difference survives to whoever rules on it.
     */
    declared: string[]
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

/**
 * **`DISTINCT_ON`** — a joint realization-validity condition, adopted 29 September.
 *
 * Over a named set, the members must differ pairwise on the stated field rows. No metric, no minimum
 * separation, no inferred geometry, and **no line of its own** — it is not a placement value and
 * nothing derives from it. It exists because three independently valid placements can still be
 * jointly invalid, and before this the constraint was flattened into a per-element bound that could
 * not express that.
 *
 * Realization chooses each placement against its own bound as usual, and is then refused if the
 * resulting set violates this.
 */
export interface JointCondition {
    kind: 'DISTINCT_ON'
    /** The collection whose members are constrained, by register path. */
    path: string
    /** The field rows the members must differ on, as register row ids. */
    rows: string[]
    /** The authored words, kept beside the typed form. */
    asAuthored: string
    from: ItemRef
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
    /**
     * **Three states, deliberately not collapsed into one.** His ruling of 30 September: *"This keeps
     * 'may realize' distinct from 'game is validated.'"*
     *
     * `preRealization` is a verdict over the invariants the resolved game can answer, and it is
     * reported as `PRE_REALIZATION_SATISFIED` rather than `PASS` precisely so it cannot be read as
     * full Gate A having passed. `realizationAuthorized` is the answer to whether realization may
     * proceed, and it requires all three of his conditions. `postRealizationRequired` is what the
     * concrete game still owes before it is validated — a game that realizes is not a game that has
     * been checked.
     */
    coherence: {
        gateA: string
        failingChecks: string[]
        /** `PRE_REALIZATION_SATISFIED`, `FAIL` or `NOT_EVALUABLE` over the pre-realization invariants. */
        preRealization: string
        /** All three of his conditions hold. This is what gates realization. */
        realizationAuthorized: boolean
        /** Where realization is not authorized, every reason. */
        notAuthorizedBecause: string[]
        /** Invariants whose subject does not exist until realization supplies it. Owed, not waived. */
        postRealizationRequired: { checkId: string; clause: string; owes: string }[]
        /**
         * Kept as the name the realization layer reads, and now meaning exactly
         * `realizationAuthorized` — never "the game is valid".
         */
        mayRealize: boolean
        /** @deprecated use `postRealizationRequired`; retained so no reader silently gets `undefined`. */
        deferred: { checkId: string; clause: string; owes: string }[]
    }
    /**
     * The game, nested by the register's paths. Only derived *values* appear — but every element the
     * enumeration individuated appears, even one with no derived value, carrying its identity alone.
     * Omitting those elements made the game claim they did not exist rather than that nothing about
     * them was established, which is the one confusion this object exists to prevent.
     */
    game: Record<string, unknown>
    /** Every derived value again, flat, with its support — so nothing has to be re-derived to trace it. */
    derived: { path: string; lineId: string; value: unknown; resolvedBy: string; support: SupportRef[] }[]
    open: OpenChoice[]
    existential: ExistentialClaim[]
    notEstablished: NotEstablished[]
    /** Conditions over a set of members, which no single line can carry. */
    jointConditions: JointCondition[]
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
/**
 * His three conditions for entering realization, each checked rather than assumed:
 *
 *   1. every pre-realization Gate A invariant passes;
 *   2. every unresolved property is either an authorized OPEN choice or an authorized existential claim;
 *   3. no blocking knowledge gap, collision or unresolved structural relationship remains.
 *
 * Condition 2 is the one that needs care. A row the knowledge **excluded** or declared it does not
 * constrain is not an unresolved property — it is an established absence, and requiring it to be open
 * or existential would make every game ineligible for having decided something. What condition 2
 * forbids is a property that is *owed* and is neither a choice nor a claim.
 */
function authorization(
    result: DerivationResult,
    notEstablished: NotEstablished[],
    open: OpenChoice[],
    existential: ExistentialClaim[],
): Pick<
    ResolvedGame['coherence'],
    'preRealization' | 'realizationAuthorized' | 'notAuthorizedBecause' | 'postRealizationRequired' | 'mayRealize' | 'deferred'
> {
    const gateA = result.gates.gateA
    const knowledge = gateA.knowledgeVerdict ?? gateA.verdict
    const postRealizationRequired = [...(gateA.deferred ?? [])]
    const because: string[] = []

    // (1)
    if (knowledge === 'FAIL') {
        because.push(`a pre-realization Gate A invariant fails: ${(gateA.checks ?? []).filter(c => c.verdict === 'FAIL').map(c => c.checkId).join(', ')}`)
    } else if (knowledge !== 'PASS') {
        const blocked = (gateA.checks ?? [])
            .filter(c => c.verdict === 'NOT_EVALUABLE')
            .map(c => c.checkId)
            .join(', ')
        because.push(`a pre-realization Gate A invariant cannot be evaluated, so it is not satisfied: ${blocked}`)
    }

    // (2) — a property that is owed, and is neither an open choice nor an existential claim.
    const owed = notEstablished.filter(e => e.reason === 'declared gap' || e.reason === 'claimed but unresolved')
    if (owed.length) {
        because.push(
            `${owed.length} unresolved propert${owed.length === 1 ? 'y is' : 'ies are'} neither an authorized choice nor an authorized claim: ` +
                owed.slice(0, 4).map(e => e.lineId).join(', ') + (owed.length > 4 ? ', …' : ''),
        )
    }

    // (3)
    const collisions = result.failures.filter(f => f.kind === 'COLLISION')
    if (collisions.length) because.push(`${collisions.length} collision(s) remain`)
    const unresolved = notEstablished.filter(e => e.verdict === 'UNRESOLVED')
    if (unresolved.length) because.push(`${unresolved.length} unresolved structural relationship(s) remain: ${unresolved.map(e => e.lineId).join(', ')}`)

    const authorized = because.length === 0
    return {
        // Never `PASS`: the state is "the pre-realization requirements are satisfied", which does not
        // say that Gate A has passed, because the deferred invariants have not been evaluated at all.
        preRealization: authorized ? 'PRE_REALIZATION_SATISFIED' : knowledge,
        realizationAuthorized: authorized,
        notAuthorizedBecause: because,
        postRealizationRequired,
        mayRealize: authorized,
        deferred: postRealizationRequired,
    }
}

export function assembleResolvedGame(result: DerivationResult, classes: ElementClass[], index: RegisterIndex, contracts: LoadedContract[] = []): ResolvedGame {
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

    /**
     * Make sure an element the enumeration individuated is *in* the game, whether or not anything
     * about it was derived.
     *
     * Found by the realization layer, which is the first thing to consume this object: an element
     * whose every line was open or failed appeared in `open` and `notEstablished` and **nowhere in
     * `game`**, because entries were only ever created while placing a derived value. On the corpus
     * that silently dropped two elements the knowledge individuates — an object, and the region the
     * Variable Target condition establishes — so the game said there was no such region at all
     * rather than that nothing about it was established.
     *
     * The entry carries its identity and whatever was derived, and nothing else. An element with no
     * properties is the honest statement: this exists, and what it is like is in the other lists.
     */
    const ensureElement = (elementId: string, row: { path: string }): Record<string, unknown> => {
        const { container } = splitPath(row.path)
        const key = container ?? row.path
        if (!elements.has(key)) elements.set(key, { container: key, entries: new Map() })
        const bucket = elements.get(key)!
        if (!bucket.entries.has(elementId)) bucket.entries.set(elementId, { elementId })
        return bucket.entries.get(elementId)!
    }

    for (const entry of result.resolution) {
        const row = rows.get(entry.row)
        const path = pathOf(entry)

        // A withdrawn or conditional line is not owed anything (SD-88), so it establishes no element.
        if (entry.elementId && row && entry.lineState === 'ENUMERATED') ensureElement(entry.elementId, row)

        if (entry.state === 'derived') {
            derived.push({ path, lineId: entry.lineId, value: entry.value, resolvedBy: String(entry.resolvedBy ?? ''), support: entry.support })
            if (!entry.elementId) {
                if (row) place(game, row.path, entry.value)
            } else if (row) {
                const { leaf } = splitPath(row.path)
                const element = ensureElement(entry.elementId, row)
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
                permitted: entry.permitted ? [...entry.permitted] : null,
                bounds: entry.bounds ?? [],
                kind: String(entry.verdict ?? ''),
            })
            continue
        }

        // Withdrawn and conditional lines are not failures: SD-88 withdrew them because the condition
        // they depend on is false, so nothing is owed on them and nothing is reported.
        if (entry.lineState !== 'ENUMERATED') continue

        if (entry.state === 'failed') {
            notEstablished.push({
                path,
                lineId: entry.lineId,
                elementId: entry.elementId,
                verdict: String(entry.verdict ?? ''),
                reason: entry.reason ?? null,
                declared: entry.declared ? [...entry.declared] : [],
            })
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

    // DISTINCT_ON assertions, read from the contracts rather than from any line — they take none.
    const jointConditions: JointCondition[] = []
    for (const contract of contracts) {
        for (const item of contract.items ?? []) {
            const distinctOn = (item as any).distinctOn
            if (!distinctOn || !Array.isArray(distinctOn.rows)) continue
            jointConditions.push({
                kind: 'DISTINCT_ON',
                path: rows.get(String(item.row))?.path ?? String(item.row),
                rows: distinctOn.rows.map(String),
                asAuthored: String(item.value ?? ''),
                from: { contractId: contract.contractId, itemId: item.itemId },
            })
        }
    }
    jointConditions.sort((a, b) => `${a.from.contractId}::${a.from.itemId}`.localeCompare(`${b.from.contractId}::${b.from.itemId}`))

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
            ...authorization(result, notEstablished, open, existential),
        },
        game,
        derived: derived.sort((a, b) => a.lineId.localeCompare(b.lineId)),
        open: open.sort((a, b) => a.lineId.localeCompare(b.lineId)),
        existential,
        jointConditions,
        notEstablished: notEstablished.sort((a, b) => a.lineId.localeCompare(b.lineId)),
        counts: {
            derived: derived.length,
            open: open.length,
            existential: existential.length,
            notEstablished: notEstablished.length,
            elements: [...elements.values()].reduce((n, b) => n + b.entries.size, 0),
            // An element that is in the game and carries no property at all. Counted so that the
            // drop this fixed cannot come back unnoticed as a quietly shrinking game.
            elementsWithNothingEstablished: [...elements.values()].reduce(
                (n, b) => n + [...b.entries.values()].filter(e => Object.keys(e).length === 1).length,
                0,
            ),
        },
    }
}
