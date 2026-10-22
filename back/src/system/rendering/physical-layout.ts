/**
 * **The markings of every role block, set out once where they occupy the same places — a general presentation rule.** Stage 2G of the
 * communication work, 21 October 2026. The authority is Christian's reply filed 23 October 2026, item 2:
 *
 *   > *"Please authorize marking once whenever the system can establish that the physical markings occupy the same locations across all
 *   > blocks. This should be a general presentation rule, not something requiring my approval for each configuration. If markings change
 *   > location between blocks, the instructions should identify what needs to be adjusted. The distinction between physical markings and
 *   > role-specific scoring relationships must remain intact in the underlying knowledge."*
 *
 * It supersedes the per-configuration record stage 2D read here (the choice `MARK_UNION_ONCE` in the goal's authorization record, scoped
 * to the area of his reply filed 22 October 2026, item 7: *"For this particular 40 × 30 m configuration, we can also simplify setup by
 * marking the halfway line and both 5 m end zones at the beginning. Role exchanges should not require unnecessary physical re-marking."*).
 * No record is read: the rule applies wherever its test holds, and nowhere else.
 *
 * The knowledge keeps each block's own targets (RB-8 still mirrors them, fidelity Q6 still reads them): what this adds is a reading of
 * the blocks' REALIZED geometry, the physical marks a coach would set out. It is general, keyed by element kind and never by activity:
 *
 *   - the marks are the union of every block's region edges strictly inside the area, along its length (an edge on an end line is the
 *     area's own edge, not a mark);
 *   - the markings occupy the same places in every block (ADMISSIBLE) where every region runs across the full width (a mark across the
 *     area sets it out), every line element inside the area holds one position in every block (for a line measured from a role's end,
 *     RB-8's mirror makes that exactly half the length), and every mark is sayable: a line at half the length, or the inner edge of an end
 *     zone some block's region is exactly; with end zones at both ends, of one depth, or none;
 *   - where that holds and there is a mark to set out, the layout APPLIES: every block's markings are set out once (`MARK_UNION_ONCE`
 *     names this policy in the layout; it is no longer a record's code).
 *
 * **Where the markings do not occupy the same places** (his third sentence), the markings are presented block by block, as each block's
 * own render says them, and `remarkingOf` reads what moves at the exchange: every mark whose position differs between blocks, named by
 * what it is in each block (the region it bounds, by the role whose objective references it, and which edge) and where it is in each
 * block. The exchange sentence says each one and where it goes (`render-concrete-game.ts`), fidelity Q5-L holds it to naming every one,
 * and RB-L recomputes it. The fourth sentence is what the layout and the moves never touch: each block's targets, objectives and their
 * relationships stay the block's own game.
 *
 * Nothing here names a goal, a value or a sport: the area's numbers come from the session, every position from the realized geometry.
 *
 * **What else moves a mark set out once** (stage 2D, the general consequence rule): an authorized adjustment whose parameter is a
 * position's magnitude (the knowledge core's Position dimension, its Magnitude parameter: "How location or displacement is expressed")
 * for a role, where a line is placed at a distance from the end that role's holder defends. Moving that line moves it in one block only,
 * so the exchange must not say "nothing is re-marked" without saying so, and the adjustment must say what that means at the exchange.
 * Recorded as `movedBy`. That an adjustment of a role's position magnitude moves a line measured from that role's end is our reading of
 * the record (its parameter and role are themselves our reading, as its note says), DRAFT.
 */
import { EM_CANONICAL_SCHEMA } from '../knowledge-core/em-canonical'
import type { LearningGoalAuthorization } from '../test-library/learning-goal-authorizations'

/** The name of the policy a layout carries: every block's markings set out once, as their union. A mechanism's name, read by no loader. */
export const MARK_UNION_ONCE = 'MARK_UNION_ONCE'

/**
 * **The authority for the policy** (stage 2G): his general rule, verbatim, as the layout carries it so the admin evidence can cite it. Not
 * knowledge and not a record: a presentation rule he authorized for every configuration whose markings coincide.
 */
export const MARK_ONCE_RULE = {
    ruledOn: '2026-10-23',
    by: 'Christian',
    citedAs: 'his reply filed 23 October 2026, item 2',
    words:
        'Please authorize marking once whenever the system can establish that the physical markings occupy the same locations across all blocks. This should be a general presentation rule, not something requiring my approval for each configuration. If markings change location between blocks, the instructions should identify what needs to be adjusted. The distinction between physical markings and role-specific scoring relationships must remain intact in the underlying knowledge.',
} as const

/** The relative position RC-21 names for a line measured from the end a team defends (S5 version 2). */
const OWN_END = 'own end (of team T)'

/** The rule the layout rests on, as it carries it. */
export interface LayoutAuthority {
    ruledOn: string
    by: string
    citedAs: string
    words: string
}

/** An authorized adjustment that changes a position's magnitude for a role. */
export interface LayoutMover {
    id: string
    role: string
}

/** Where a mark or zone comes from: a region of one block. */
export interface LayoutSource {
    blockId: string
    regionId: string
    path: string
    edge?: 'from' | 'to' | 'at'
}

/** One mark set out across the area, `at` metres along its length. `line` is the line element held there in every block, if one is. */
export interface LayoutMark {
    elementId: string
    at: number
    line: string | null
    sources: LayoutSource[]
}

/** A zone at one end, bounded by the end line and one mark, that some block's region is exactly. */
export interface LayoutZone {
    elementId: string
    from: number
    to: number
    depthM: number
    /** The mark that is its inner edge. */
    inner: string
    sources: LayoutSource[]
}

/** One block's region as the layout read it: its realized interval along the length. */
export interface LayoutRegion {
    blockId: string
    path: string
    from: number
    to: number
}

/** An authorized adjustment that moves a mark set out once (by its id). */
export interface LayoutMove {
    elementId: string
    mark: string
    line: string
    role: string
    forTeam: string
}

export interface PhysicalLayout {
    policy: typeof MARK_UNION_ONCE
    because: LayoutAuthority
    lengthM: number
    widthM: number
    marks: LayoutMark[]
    zones: LayoutZone[]
    regions: LayoutRegion[]
    movedBy: LayoutMove[]
}

/**
 * One edge of a block's region strictly inside the area, and what it is in a way every block can share: the region by the role whose
 * objective references it (where exactly one region of the block is referenced by that role's objectives), otherwise by its own id; and
 * which edge (`at` a line, the `inner` edge of a region touching one end line, else `from` or `to`).
 */
export interface MarkingFeature {
    regionId: string
    path: string
    edge: 'at' | 'from' | 'to'
    /** True where the edge is the inner edge of a region touching one end line (an end zone's mark). */
    inner: boolean
    identity: string
}

/** Where one marking is in one block: its position (null where the block has no such edge) and the edges there that are it. */
export interface MarkingPlace {
    blockId: string
    at: number | null
    features: MarkingFeature[]
    /** True where another marking that does NOT move sits at the same position in this block, so the mark there cannot simply be moved. */
    shared: boolean
}

/** One marking whose position differs between the blocks: the identities that are it, and where it is in each block. */
export interface MarkingChange {
    elementId: string
    identities: string[]
    places: MarkingPlace[]
}

/** What moves at the exchange where the markings are presented block by block (stage 2G). */
export interface Remarking {
    lengthM: number
    changes: MarkingChange[]
}

/**
 * Whether the markings are set out once: the layout where they are (`applies`, `layout`); why not where a reason is known (`why`, empty
 * where there is nothing to set out once); and, where they are presented block by block and some marking moves, what moves
 * (`remarking`). One shape for every case (the back end compiles without strict narrowing of boolean discriminants).
 */
export interface LayoutDecision {
    applies: boolean
    layout: PhysicalLayout | null
    why: string[]
    remarking: Remarking | null
}

/**
 * The authorized adjustments that change a position's magnitude for a role: each whose parameter names (first, by its id) a parameter of
 * the knowledge core's EM schema in a Position dimension whose category is Magnitude. Read from the record and the schema; no adjustment,
 * role or parameter id is named here.
 */
export function layoutMoversOf(record: LearningGoalAuthorization | null | undefined): LayoutMover[] {
    const dimensions = new Map(EM_CANONICAL_SCHEMA.engineeringDimensions.map(dimension => [dimension.DIM_ID, dimension]))
    const magnitude = (parameter: unknown): boolean => {
        const id = String(parameter ?? '').trim().split(' ')[0]
        const found = EM_CANONICAL_SCHEMA.parameters.find(entry => entry.PARAM_ID === id)
        return !!found && found.Category === 'Magnitude' && dimensions.get(found.DIM_ID)?.Dimension_Name === 'Position'
    }
    return (record?.authorizedAdjustments?.entries ?? []).filter(entry => typeof entry.role === 'string' && magnitude(entry.parameter)).map(entry => ({ id: entry.id, role: entry.role }))
}

const intervalAt = (fixture: any, path: string): { from: number; to: number } | null => {
    const interval = ((fixture?.status?.geometry ?? []) as any[]).find(g => g?.path === path)?.geometry?.interval
    return interval && Number.isFinite(interval.from) && Number.isFinite(interval.to) ? { from: Number(interval.from), to: Number(interval.to) } : null
}

/** A block's region as realized along and across. */
interface ReadRegion {
    blockId: string
    regionId: string
    path: string
    from: number
    to: number
    line: boolean
    region: any
}

/**
 * **The physical layout of these blocks, or why the markings stay block by block and what then moves.** `movers` are the adjustments
 * that change a position's magnitude for a role (`layoutMoversOf`). Pure: the same blocks and adjustments give the same decision, which
 * is what RB-L recomputes. No record is read (his reply filed 23 October 2026, item 2: a general presentation rule).
 */
export function layoutOf(blocks: { blockId: string; fixture: any }[], movers: LayoutMover[] = []): LayoutDecision {
    // Not played in role blocks: nothing is exchanged, so nothing is set out once or moved.
    if (blocks.length < 2) return { applies: false, layout: null, why: [], remarking: null }
    const envelope = blocks[0].fixture?.envelope ?? {}
    const lengthM = Number(envelope.lengthM)
    const widthM = Number(envelope.widthM)
    if (!blocks.every(block => Number(block.fixture?.envelope?.lengthM) === lengthM && Number(block.fixture?.envelope?.widthM) === widthM)) {
        return { applies: false, layout: null, why: ['the blocks were built for different areas'], remarking: null }
    }

    // Every region of every block, as realized: full width, inside the area.
    const why: string[] = []
    let readable = true
    const read: ReadRegion[] = []
    for (const block of blocks) {
        for (const region of (block.fixture?.game?.space?.regions ?? []) as any[]) {
            const regionId = String(region?.elementId)
            const path = `space.regions[${regionId}].position.along`
            const along = intervalAt(block.fixture, path)
            const across = intervalAt(block.fixture, `space.regions[${regionId}].position.across`)
            if (!along || !across) {
                why.push(`${regionId} holds no realized position along and across the area in block ${block.blockId}`)
                readable = false
                continue
            }
            if (across.from !== 0 || across.to !== widthM) why.push(`${regionId} does not run across the full width in block ${block.blockId}, so a mark across the area cannot set it out`)
            if (along.from < 0 || along.to > lengthM || along.from > along.to) why.push(`${regionId} is not inside the area along its length in block ${block.blockId}`)
            read.push({ blockId: block.blockId, regionId, path, from: along.from, to: along.to, line: along.from === along.to, region })
        }
    }
    /** Not set out once, with why, and what moves where every region could be read. */
    const no = (...reasons: string[]): LayoutDecision => ({ applies: false, layout: null, why: reasons, remarking: readable ? remarkingOf(blocks, read, lengthM) : null })
    const inside = (x: number) => x > 0 && x < lengthM
    // Every line element inside the area holds one position in every block, and that position is one the activity has words for once:
    // half the length. A line on an end line is the area's own edge (stage 2G: it is no mark, so it is not held to half the length).
    const lineIds = [...new Set(read.filter(entry => entry.line && inside(entry.from)).map(entry => entry.regionId))]
    const lineAt = new Map<string, number>()
    for (const id of lineIds) {
        const held = read.filter(entry => entry.regionId === id)
        const positions = [...new Set(held.map(entry => entry.from))]
        if (held.length !== blocks.length || positions.length !== 1 || held.some(entry => !entry.line)) {
            why.push(`the line ${id} is not held at one position in every block (${held.map(entry => `${entry.from}-${entry.to} m in block ${entry.blockId}`).join('; ')}), so it would be re-marked at the exchange`)
            continue
        }
        if (positions[0] * 2 !== lengthM) why.push(`the line ${id} is at ${positions[0]} m along a ${lengthM} m length, not at half of it: no sentence says a line held at one place in every block anywhere else`)
        lineAt.set(id, positions[0])
    }
    if (why.length) return no(...why)

    // The marks: every region edge strictly inside the area, once. With none, there is nothing to set out besides the area itself.
    const at = [...new Set(read.flatMap(entry => [entry.from, entry.to]).filter(inside))].sort((a, b) => a - b)
    if (!at.length) return { applies: false, layout: null, why: [], remarking: null }
    const marks: LayoutMark[] = at.map((x, i) => ({
        elementId: `mark-${i + 1}`,
        at: x,
        line: [...lineAt.entries()].find(([, position]) => position === x)?.[0] ?? null,
        sources: read.flatMap((entry): LayoutSource[] => {
            const source = (edge: 'from' | 'to' | 'at'): LayoutSource => ({ blockId: entry.blockId, regionId: entry.regionId, path: entry.path, edge })
            if (entry.line) return entry.from === x ? [source('at')] : []
            return [...(entry.from === x ? [source('from')] : []), ...(entry.to === x ? [source('to')] : [])]
        }),
    }))
    // The zones: a stretch from an end line to the first mark in from it that is no line, which some block's region is exactly.
    const bounds = [0, ...at, lengthM]
    const zones: LayoutZone[] = []
    for (const [from, to, innerAt] of [
        [bounds[0], bounds[1], bounds[1]],
        [bounds[bounds.length - 2], bounds[bounds.length - 1], bounds[bounds.length - 2]],
    ] as [number, number, number][]) {
        const inner = marks.find(mark => mark.at === innerAt)
        if (!inner || inner.line || zones.some(zone => zone.from === from && zone.to === to)) continue
        const sources = read.filter(entry => !entry.line && entry.from === from && entry.to === to).map(entry => ({ blockId: entry.blockId, regionId: entry.regionId, path: entry.path }))
        if (sources.length) zones.push({ elementId: `zone-${zones.length + 1}`, from, to, depthM: to - from, inner: inner.elementId, sources })
    }
    // Every mark is sayable: a line, or the inner edge of a zone.
    for (const mark of marks) {
        if (!mark.line && !zones.some(zone => zone.inner === mark.elementId)) why.push(`the mark at ${mark.at} m is neither a line nor the inner edge of an end zone a region is, so no sentence sets it out once`)
    }
    if (zones.length && !(zones.length === 2 && zones[0].from === 0 && zones[1].to === lengthM && zones[0].depthM === zones[1].depthM)) {
        why.push(`the zones at the ends are not one zone of one depth at each end (${zones.map(zone => `${zone.from}-${zone.to} m`).join(', ')}), so they cannot be said once`)
    }
    if (why.length) return no(...why)

    // What an authorized adjustment moves: a line placed at a distance from the end the holder of its role defends.
    const movedBy: LayoutMove[] = []
    const holderRoles: Record<string, string> = blocks[0].fixture?.roleNouns?.holders ?? {}
    for (const mover of movers) {
        for (const mark of marks.filter(entry => entry.line)) {
            const region = read.find(entry => entry.regionId === mark.line)?.region
            const along = region?.position?.along
            const forTeam = along && typeof along === 'object' ? String(along.forTeam ?? '') : ''
            if (along?.term !== OWN_END || !along?.offsetM || holderRoles[forTeam] !== mover.role) continue
            movedBy.push({ elementId: mover.id, mark: mark.elementId, line: String(mark.line), role: mover.role, forTeam })
        }
    }
    return {
        applies: true,
        layout: {
            policy: MARK_UNION_ONCE,
            because: { ...MARK_ONCE_RULE },
            lengthM,
            widthM,
            marks,
            zones,
            regions: read.map(entry => ({ blockId: entry.blockId, path: entry.path, from: entry.from, to: entry.to })),
            movedBy,
        },
        why: [],
        remarking: null,
    }
}

/**
 * Each region of one block named as every block can name it: by the role whose objective references it, where that role's objectives
 * reference exactly one region of the block; otherwise by its own id. Roles are read from the block's own binding (`record.roleBlock`)
 * and the role-holder names (`roleNouns.holders`); nothing here names a role.
 */
function regionIdentities(fixture: any): (regionId: string) => string {
    const holdersInBlock: Record<string, string> = fixture?.record?.roleBlock?.holders ?? {}
    const roleOfHolderName: Record<string, string> = fixture?.roleNouns?.holders ?? {}
    const roleOf = (team: unknown): string | null => {
        const name = String(team)
        return roleOfHolderName[name] ?? Object.entries(holdersInBlock).find(([, holder]) => holder === name)?.[0] ?? null
    }
    const referencing = new Map<string, Set<string>>()
    for (const objective of (fixture?.game?.objectives ?? []) as any[]) {
        const ref = objective?.reference?.structuralRef
        const role = roleOf(objective?.team)
        if (!ref || !role) continue
        const regionId = `c:${ref.contractId}:${ref.itemId}`
        referencing.set(regionId, new Set([...(referencing.get(regionId) ?? []), role]))
    }
    const regionsOfRole = new Map<string, string[]>()
    for (const [regionId, roles] of referencing) for (const role of roles) regionsOfRole.set(role, [...(regionsOfRole.get(role) ?? []), regionId])
    return (regionId: string) => {
        const roles = [...(referencing.get(regionId) ?? [])]
        return roles.length === 1 && (regionsOfRole.get(roles[0]) ?? []).length === 1 ? `the region the ${roles[0]} objective references` : `region ${regionId}`
    }
}

/**
 * **What moves at the exchange, where the markings are presented block by block** — stage 2G, 21 October 2026, his reply filed 23 October
 * 2026, item 2: *"If markings change location between blocks, the instructions should identify what needs to be adjusted."* Read from the
 * blocks' realized regions only:
 *
 *   - each block's marks are its regions' edges strictly inside the area, each edge named by its region's identity (`regionIdentities`)
 *     and which edge it is;
 *   - the edges that are at the same position in every block are one marking (a line and the inner edge of the region beyond it, say);
 *   - a marking whose position differs between the blocks, or that one block does not have, is a change, with where it is in each block
 *     (`shared` where a marking that does not move sits at the same place, so the mark there must stay).
 *
 * Changes are listed lines first, then by their position in the first block. Null where nothing moves. Nothing here names a goal, a value
 * or a sport.
 */
function remarkingOf(blocks: { blockId: string; fixture: any }[], read: ReadRegion[], lengthM: number): Remarking | null {
    const inside = (x: number) => x > 0 && x < lengthM
    const byIdentity = new Map<string, Map<string, { at: number; feature: MarkingFeature }>>()
    for (const block of blocks) {
        const identityOf = regionIdentities(block.fixture)
        for (const entry of read.filter(region => region.blockId === block.blockId)) {
            const who = identityOf(entry.regionId)
            const atStart = entry.from === 0
            const atEnd = entry.to === lengthM
            const edges: ['at' | 'from' | 'to', string, number][] = entry.line
                ? [['at', 'at', entry.from]]
                : atStart !== atEnd
                  ? [[atStart ? 'to' : 'from', 'inner edge', atStart ? entry.to : entry.from]]
                  : [
                        ['from', 'from edge', entry.from],
                        ['to', 'to edge', entry.to],
                    ]
            for (const [edge, kind, at] of edges) {
                if (!inside(at)) continue
                const identity = `${who}, ${kind}`
                const held = byIdentity.get(identity) ?? new Map()
                held.set(block.blockId, { at, feature: { regionId: entry.regionId, path: entry.path, edge, inner: kind === 'inner edge', identity } })
                byIdentity.set(identity, held)
            }
        }
    }
    const vectorOf = (identity: string) => blocks.map(block => byIdentity.get(identity)!.get(block.blockId)?.at ?? null)
    const groups = new Map<string, string[]>()
    for (const identity of [...byIdentity.keys()].sort()) {
        const key = JSON.stringify(vectorOf(identity))
        groups.set(key, [...(groups.get(key) ?? []), identity])
    }
    const moves = (vector: (number | null)[]) => vector.some(x => x === null) || new Set(vector).size > 1
    const kept = [...groups.keys()].map(key => JSON.parse(key) as (number | null)[]).filter(vector => !moves(vector))
    const changing = [...groups.entries()]
        .map(([key, identities]) => ({ vector: JSON.parse(key) as (number | null)[], identities }))
        .filter(group => moves(group.vector))
        .map(group => ({ ...group, line: group.identities.some(identity => [...byIdentity.get(identity)!.values()].some(held => held.feature.edge === 'at')) }))
        .sort((a, b) => Number(b.line) - Number(a.line) || (a.vector[0] ?? Number.MAX_SAFE_INTEGER) - (b.vector[0] ?? Number.MAX_SAFE_INTEGER) || a.identities[0].localeCompare(b.identities[0]))
    if (!changing.length) return null
    return {
        lengthM,
        changes: changing.map((group, n) => ({
            elementId: `change-${n + 1}`,
            identities: [...group.identities],
            places: blocks.map((block, i) => ({
                blockId: block.blockId,
                at: group.vector[i],
                features: group.identities.map(identity => byIdentity.get(identity)!.get(block.blockId)?.feature).filter((feature): feature is MarkingFeature => !!feature),
                shared: group.vector[i] !== null && kept.some(vector => vector[i] === group.vector[i]),
            })),
        })),
    }
}

/**
 * **What moves, in words for an administrator** (stage 2G, DRAFT admin-evidence wording): each change, where it is in each block and the
 * region edges that are it there. Read by the admin-only fallback fact (`review-evidence.ts`); never coach text.
 */
export function remarkingSummary(remarking: Remarking | null): string[] {
    return (remarking?.changes ?? []).map(
        change =>
            `${change.elementId} moves: ${change.places
                .map(place => (place.at === null ? `no such mark in block ${place.blockId}` : `at ${place.at} m in block ${place.blockId} (${place.features.map(feature => `${feature.path}, ${feature.edge}`).join('; ')})${place.shared ? ', where a marking that does not move is too' : ''}`))
                .join('; ')}`,
    )
}

/**
 * **The leaves of the layout that hold a number a sentence may say** — hardening H3, 21 October 2026 (the 2D review's should-fix 4): a
 * mark's position, and a zone's two edges and its depth. Fidelity Q2 admits a number of the layout only through one of these, cited by its
 * own path (`layout.zones[zone-1].depthM`): a broader node (`layout.zones[zone-1]`, `layout.marks`, the rule's words under `layout.because`,
 * the per-block `layout.regions`) holds numbers too, and citing it admitted any of them.
 */
export const LAYOUT_NUMBER_LEAVES: Record<'marks' | 'zones', string[]> = { marks: ['at'], zones: ['from', 'to', 'depthM'] }

/** The number a leaf path of the layout holds (`LAYOUT_NUMBER_LEAVES`), as a list of one; empty for every other path or value. */
export function layoutLeafNumberAt(layout: unknown, path: string): number[] {
    if (!layout || typeof layout !== 'object' || !path.startsWith('layout.')) return []
    const rest = path.slice('layout.'.length)
    const open = rest.indexOf('[')
    const close = rest.indexOf(']', open)
    if (open < 0 || close < 0 || rest.charAt(close + 1) !== '.') return []
    const collection = rest.slice(0, open)
    const id = rest.slice(open + 1, close)
    const leaf = rest.slice(close + 2)
    const leaves = collection === 'marks' || collection === 'zones' ? LAYOUT_NUMBER_LEAVES[collection] : []
    if (!leaves.includes(leaf)) return []
    const members = (layout as Record<string, unknown>)[collection]
    const member = Array.isArray(members) ? members.filter(entry => entry && typeof entry === 'object' && (entry as Record<string, unknown>).elementId === id) : []
    if (member.length !== 1) return []
    const value = (member[0] as Record<string, unknown>)[leaf]
    return typeof value === 'number' && Number.isFinite(value) ? [value] : []
}

/**
 * A path under the layout, read as its own value: every number it holds (`layout.zones[zone-1]` holds the zone's edges and depth). Read by
 * the admin evidence to show what a cited layout path holds; fidelity admits a number only through `layoutLeafNumberAt` (hardening H3).
 */
export function layoutNumbersAt(layout: unknown, path: string): number[] {
    if (!layout || !path.startsWith('layout.')) return []
    let nodes: unknown[] = [layout]
    for (const segment of path.slice('layout.'.length).split('.')) {
        const open = segment.indexOf('[')
        const key = open < 0 ? segment : segment.slice(0, open)
        const id = open < 0 ? null : segment.slice(open + 1, segment.indexOf(']', open))
        nodes = nodes.flatMap(node => {
            const next = node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined
            if (id === null) return next === undefined ? [] : [next]
            return Array.isArray(next) ? next.filter(member => member && typeof member === 'object' && (member as Record<string, unknown>).elementId === id) : []
        })
    }
    const found: number[] = []
    const collect = (node: unknown) => {
        if (typeof node === 'number' && Number.isFinite(node)) found.push(node)
        else if (Array.isArray(node)) node.forEach(collect)
        else if (node && typeof node === 'object') Object.values(node as Record<string, unknown>).forEach(collect)
    }
    nodes.forEach(collect)
    return found
}

/**
 * The positions a cited `remarking.changes[<id>]` path holds in this block (stage 2G), for the admin evidence: the change's place in the
 * block whose id is given, as `at` metres, or nothing.
 */
export function remarkingPlaceAt(remarking: unknown, path: string, blockId: string): MarkingPlace | null {
    if (!remarking || typeof remarking !== 'object' || !path.startsWith('remarking.changes[')) return null
    const id = path.slice('remarking.changes['.length, path.indexOf(']'))
    const change = ((remarking as Remarking).changes ?? []).find(entry => entry.elementId === id)
    return change?.places.find(place => place.blockId === blockId) ?? null
}
