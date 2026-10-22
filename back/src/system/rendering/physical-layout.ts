/**
 * **The markings of every role block, set out once where they can be** — stage 2D of the communication work, 21 October 2026, for
 * Christian's reply filed 22 October 2026, item 7:
 *
 *   > *"For this particular 40 × 30 m configuration, we can also simplify setup by marking the halfway line and both 5 m end zones at the
 *   > beginning. Role exchanges should not require unnecessary physical re-marking."*
 *   > *"The knowledge can continue to represent the distinct targets and relationships for each block, even where the physical markings
 *   > remain unchanged."*
 *
 * The knowledge keeps each block's own targets (RB-8 still mirrors them, fidelity Q6 still reads them); what this adds is a reading of
 * the two blocks' REALIZED geometry: the physical marks a coach would set out for every block at once. It is general, keyed by element
 * kind and never by activity:
 *
 *   - the marks are the union of every block's region edges strictly inside the area, along its length;
 *   - it is ADMISSIBLE where every region runs across the full width (a mark across the area sets it out), every line element holds one
 *     position in every block (for a line measured from a role's end, RB-8's mirror makes that exactly half the length), and every mark
 *     is sayable: a line at half the length, or the inner edge of an end zone some block's region is exactly; with end zones at both
 *     ends, of one depth, or none;
 *   - and it is APPLIED only where a recorded choice says so for this area (`MARK_UNION_ONCE`, his item 7, read from the goal's
 *     authorization record, `appliesTo` exactly the session's area). Everywhere else nothing changes: each block's render reads as it
 *     did, and where a choice was recorded and does not apply, why is said.
 *
 * The narrow reading (a recorded choice per configuration) is ours, of his first sentence; whether his second may govern every
 * configuration whose blocks' marks coincide is put to him. Nothing here names a goal, a value or a sport: the area's numbers come from
 * the record and the session, every position from the realized geometry.
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

/** The choice code this module acts on (`PROVISIONAL_CHOICE_VALUES` in the authorization records' loader). */
export const MARK_UNION_ONCE = 'MARK_UNION_ONCE'

/** The relative position RC-21 names for a line measured from the end a team defends (S5 version 2). */
const OWN_END = 'own end (of team T)'

/** His recorded choice, as the layout carries it. */
export interface LayoutChoice {
    value: string
    appliesTo: { lengthM: number; widthM: number }
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
    because: LayoutChoice
    lengthM: number
    widthM: number
    marks: LayoutMark[]
    zones: LayoutZone[]
    regions: LayoutRegion[]
    movedBy: LayoutMove[]
}

/**
 * Whether the markings are set out once: the layout where they are (`applies`, `layout`), or why not (`why`), and whether a choice was
 * recorded at all. One shape for both (the back end compiles without strict narrowing of boolean discriminants).
 */
export interface LayoutDecision {
    applies: boolean
    layout: PhysicalLayout | null
    recorded: boolean
    why: string[]
}

/** His recorded choices to set the markings out once, from a goal's authorization record: authorized by his ruling, with their area. */
export function layoutChoicesOf(record: LearningGoalAuthorization | null | undefined): LayoutChoice[] {
    return (record?.provisionalChoices ?? [])
        .filter(choice => choice.value === MARK_UNION_ONCE && choice.status === 'AUTHORIZED_BY_RULING' && !!choice.appliesTo)
        .map(choice => ({ value: String(choice.value), appliesTo: { lengthM: Number(choice.appliesTo!.lengthM), widthM: Number(choice.appliesTo!.widthM) }, ruledOn: choice.ruledOn, by: choice.by, citedAs: choice.citedAs, words: choice.words }))
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

/**
 * **The physical layout of these blocks, or why the markings stay block by block.** `choices` are his recorded choices for the goal
 * (`layoutChoicesOf`), `movers` the adjustments that change a position's magnitude for a role (`layoutMoversOf`). Pure: the same blocks
 * and record give the same layout, which is what RB-L recomputes.
 */
export function layoutOf(blocks: { blockId: string; fixture: any }[], choices: LayoutChoice[], movers: LayoutMover[] = []): LayoutDecision {
    const chosen = choices.filter(choice => choice.value === MARK_UNION_ONCE)
    if (!chosen.length) return { applies: false, layout: null, recorded: false, why: [] }
    const no = (...why: string[]): LayoutDecision => ({ applies: false, layout: null, recorded: true, why })
    if (blocks.length < 2) return no('the activity is not played in role blocks, so nothing is exchanged and nothing would be re-marked')
    const envelope = blocks[0].fixture?.envelope ?? {}
    const lengthM = Number(envelope.lengthM)
    const widthM = Number(envelope.widthM)
    if (!blocks.every(block => Number(block.fixture?.envelope?.lengthM) === lengthM && Number(block.fixture?.envelope?.widthM) === widthM)) return no('the blocks were built for different areas')
    const choice = chosen.find(entry => entry.appliesTo.lengthM === lengthM && entry.appliesTo.widthM === widthM)
    if (!choice) {
        return no(...chosen.map(entry => `the recorded choice ${MARK_UNION_ONCE} (${entry.citedAs}) applies to an area ${entry.appliesTo.lengthM} m long by ${entry.appliesTo.widthM} m wide, and this session's area is ${lengthM} m long by ${widthM} m wide`))
    }

    // Every region of every block, as realized: full width, inside the area.
    const why: string[] = []
    const read: { blockId: string; regionId: string; path: string; from: number; to: number; line: boolean; region: any }[] = []
    for (const block of blocks) {
        for (const region of (block.fixture?.game?.space?.regions ?? []) as any[]) {
            const regionId = String(region?.elementId)
            const path = `space.regions[${regionId}].position.along`
            const along = intervalAt(block.fixture, path)
            const across = intervalAt(block.fixture, `space.regions[${regionId}].position.across`)
            if (!along || !across) {
                why.push(`${regionId} holds no realized position along and across the area in block ${block.blockId}`)
                continue
            }
            if (across.from !== 0 || across.to !== widthM) why.push(`${regionId} does not run across the full width in block ${block.blockId}, so a mark across the area cannot set it out`)
            if (along.from < 0 || along.to > lengthM || along.from > along.to) why.push(`${regionId} is not inside the area along its length in block ${block.blockId}`)
            read.push({ blockId: block.blockId, regionId, path, from: along.from, to: along.to, line: along.from === along.to, region })
        }
    }
    // Every line element holds one position in every block, and that position is one the activity has words for once: half the length.
    const lineIds = [...new Set(read.filter(entry => entry.line).map(entry => entry.regionId))]
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

    // The marks: every region edge strictly inside the area, once.
    const at = [...new Set(read.flatMap(entry => [entry.from, entry.to]).filter(x => x > 0 && x < lengthM))].sort((a, b) => a - b)
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
            because: { ...choice, appliesTo: { ...choice.appliesTo } },
            lengthM,
            widthM,
            marks,
            zones,
            regions: read.map(entry => ({ blockId: entry.blockId, path: entry.path, from: entry.from, to: entry.to })),
            movedBy,
        },
        recorded: true,
        why: [],
    }
}

/**
 * **The leaves of the layout that hold a number a sentence may say** — hardening H3, 21 October 2026 (the 2D review's should-fix 4): a
 * mark's position, and a zone's two edges and its depth. Fidelity Q2 admits a number of the layout only through one of these, cited by its
 * own path (`layout.zones[zone-1].depthM`): a broader node (`layout.zones[zone-1]`, `layout.marks`, the recorded choice's area under
 * `layout.because`, the per-block `layout.regions`) holds numbers too, and citing it admitted any of them.
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
