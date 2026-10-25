/**
 * **How far an adjustment may move the line it moves, read from the bounds on that line** — P2, 25 October 2026. Christian, reply filed 28
 * October 2026, item 2: *"The marked progression line should remain outside the [handling area]."* *"The coach should retain flexibility to adjust
 * it within a valid range, but the engine should prevent incompatible geometry through general validation rather than activity-specific
 * restrictions."* (his noun bracketed: the coupling ratchet keeps a sport's nouns out of this layer; the knowledge quotes him whole).
 *
 * **The validation is the knowledge's, not this module's.** A bound on a line's position, authored beside its value as RC-21's "beyond X (for
 * team T)" (the register's machine-readable relative term), is checked on the realized geometry by GA-RELATIVE-PLACEMENT in every block before
 * an activity is shown: a game placing the line on the wrong side of X is refused at validation. Which line must stay clear of which element is
 * the knowledge item's (its selector and its typed referent), never a name here.
 *
 * **What this module reads is the same bound, for the coach's choice.** An authorized adjustment that changes a position's magnitude for a role
 * (the rendering fixture carries that role as `adjustments[].moves`, read from the record's parameter and role by `physical-layout.ts`
 * `layoutMoversOf`) moves a line positioned by RC-21's "own end (of team T)" (an anchor at the end line T defends, with a distance) where T stands
 * for that role. The range it may be moved in is the set of distances from that end line, strictly inside the area, at which every bound on the
 * line still holds:
 *   - "beyond X (for team T')": the line's near edge at or past X's far edge in the direction T' attacks (read from the game's own objectives,
 *     `team-ends.ts`), so X's far edge, measured from the line's end line, is the NEAREST it may come (T' attacking away from that end line) or
 *     the FARTHEST it may go (T' attacking toward it); "at or past" lets it reach the limit;
 *   - nothing else bounds it here: the area's own end lines bound every line, and are no limit a coach is told.
 * Read on one block's fixture: each block is rendered from its own game, and a range differing between blocks would give the blocks two
 * sentences, which the composition refuses. A bound this module cannot read (another relation, an unplaced referent, a team whose direction the
 * game does not establish) is `unreadable`, never skipped: fidelity refuses an activity whose moved line carries a bound it cannot tell truly.
 *
 * Pure and sport-neutral: rows, terms, designations and element ids are data; the renderer (the sentence), fidelity (each limit said, and only
 * those) and the review evidence read the same reading.
 */
import { RegisterIndex } from '../derivation/register'
import { teamEndPositionOf } from '../derivation/types'
import { attackingEndIn } from '../realization/team-ends'

/** One limit on how far a moved line may go, with the bound and the element it comes from. */
export interface AdjustmentLimit {
    /** Metres from the end line the line is measured from. */
    metres: number
    /** Whether the line may be set exactly at the limit ("at or past"). */
    reachable: boolean
    /** The bound as derivation made it: RC-21's term, its referent and the team whose direction it is read in. */
    bound: { term: string; relation: string; of: { contractId: string; itemId: string }; forTeam: string }
    /** The referent's element id and the path of its realized position along the area, which a sentence cites. */
    referent: string
    referentPath: string
}

/** The range an authorized adjustment may move its line in, on one block's realized geometry. */
export interface AdjustmentRange {
    adjustmentId: string
    /** The line the adjustment moves, and the path of its position along the area. */
    elementId: string
    path: string
    /** The designation whose defended end line the line is measured from. */
    forTeam: string
    /** Where the line is in this block, in metres from that end line. */
    at: number
    nearest: AdjustmentLimit | null
    farthest: AdjustmentLimit | null
}

export interface AdjustmentRangeReading {
    ranges: AdjustmentRange[]
    /** Every bound on a moved line that could not be read, as a sentence (fidelity refuses the activity on any). */
    unreadable: string[]
}

const stated = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
const SAME = 1e-9

/** The path of an element's position along the area in the game, and its realized interval and anchor there. */
function along(fixture: any, elementId: string): { path: string; interval: { from: number; to: number }; anchor: number | null } | null {
    const entry = ((fixture?.status?.geometry ?? []) as any[]).find(g => typeof g?.path === 'string' && g.path.includes(`[${elementId}]`) && g.path.endsWith('.along'))
    const interval = entry?.geometry?.interval
    if (!entry || !interval || !stated(interval.from) || !stated(interval.to)) return null
    return { path: String(entry.path), interval: { from: interval.from, to: interval.to }, anchor: stated(entry.geometry.anchor) ? entry.geometry.anchor : null }
}

/**
 * **The range each authorized adjustment that moves a line may move it in, on this block's fixture.** Empty where no adjustment moves a line, and
 * where a moved line carries no bound (its range is the area itself, which nothing here says).
 */
export function adjustmentRangesOf(fixture: any, index: RegisterIndex): AdjustmentRangeReading {
    const ranges: AdjustmentRange[] = []
    const unreadable: string[] = []
    const terms: Record<string, any> = ((index.relativeTerms ?? {}) as any).machineReadable?.terms ?? {}
    const holders: Record<string, string> = fixture?.roleNouns?.holders ?? {}
    const lengthM = Number(fixture?.envelope?.lengthM)
    const widthM = Number(fixture?.envelope?.widthM)
    const L = Number.isFinite(lengthM) && Number.isFinite(widthM) ? Math.max(lengthM, widthM) : NaN
    const regions: any[] = Array.isArray(fixture?.game?.space?.regions) ? fixture.game.space.regions : []
    const bounds: any[] = Array.isArray(fixture?.status?.bounds) ? fixture.status.bounds : []
    const roleBlock = fixture?.record?.roleBlock ?? null
    for (const adjustment of (fixture?.adjustments?.entries ?? []) as any[]) {
        const role = typeof adjustment?.moves?.role === 'string' ? adjustment.moves.role : null
        if (!role) continue
        for (const region of regions) {
            const position = teamEndPositionOf(region?.position?.along)
            const term = position ? terms[position.term] : null
            // A line (one distance, no depth) placed from the end line the holder of the adjustment's role defends.
            if (!position || !term || term.kind !== 'anchor' || term.axis !== 'along' || term.at !== 0) continue
            if (position.offsetM.from !== position.offsetM.to || holders[position.forTeam] !== role) continue
            const elementId = String(region.elementId)
            const placed = along(fixture, elementId)
            const own = bounds.find(entry => entry?.path === placed?.path)?.bounds ?? []
            const relative = (own as any[]).filter(bound => bound && bound.kind === 'RELATIVE' && !bound.forbidden && !bound.preferred)
            if (!relative.length) continue
            const what = `${adjustment.id} moves ${elementId}`
            if (!placed || placed.interval.from !== placed.interval.to || (placed.anchor !== 0 && placed.anchor !== L) || !Number.isFinite(L)) {
                unreadable.push(`${what}, whose realized position is not one distance from an end line of the area`)
                continue
            }
            const fromEnd = (p: number) => (placed.anchor === 0 ? p : L - p)
            const range: AdjustmentRange = { adjustmentId: String(adjustment.id), elementId, path: placed.path, forTeam: position.forTeam, at: fromEnd(placed.interval.from), nearest: null, farthest: null }
            for (const bound of relative) {
                const referent = `c:${bound.of?.contractId}:${bound.of?.itemId}`
                if (bound.relation !== 'beyond') {
                    unreadable.push(`${what}, which carries a bound of the relation ${JSON.stringify(bound.relation)} that no range is read for`)
                    continue
                }
                const x = along(fixture, referent)
                const attacks = typeof bound.forTeam === 'string' ? attackingEndIn(fixture.game, index, roleBlock, bound.forTeam) : null
                if (!x || attacks === null) {
                    unreadable.push(`${what}, bounded "${bound.term}" of ${referent} for ${String(bound.forTeam)}, and ${!x ? 'that element has no realized position along the area' : 'the end that team attacks is not established in this game'}`)
                    continue
                }
                // RC-21: near edge at or past X's far edge, in the attacking direction; on a line, its one position.
                const direction = attacks === 1 ? 1 : -1
                const far = direction > 0 ? x.interval.to : x.interval.from
                const limit = fromEnd(far)
                // Measured from the line's own end line, the limit is a floor where the team attacks away from that end, a ceiling otherwise.
                const awayFromEnd = (placed.anchor === 0) === (direction > 0)
                const found: AdjustmentLimit = { metres: limit, reachable: true, bound: { term: String(bound.term), relation: String(bound.relation), of: { contractId: String(bound.of.contractId), itemId: String(bound.of.itemId) }, forTeam: String(bound.forTeam) }, referent, referentPath: x.path }
                if (awayFromEnd) {
                    if (!range.nearest || limit > range.nearest.metres + SAME) range.nearest = found
                } else if (!range.farthest || limit < range.farthest.metres - SAME) range.farthest = found
            }
            // A limit at an end line of the area, or one the line already breaks, is no range a coach can be given (validation refuses the latter).
            for (const side of ['nearest', 'farthest'] as const) {
                const limit = range[side]
                if (limit && !(limit.metres > SAME && limit.metres < L - SAME)) range[side] = null
            }
            if ((range.nearest && range.at < range.nearest.metres - SAME) || (range.farthest && range.at > range.farthest.metres + SAME)) {
                unreadable.push(`${what}, which lies at ${range.at} m, outside the range its own bounds give`)
                continue
            }
            if (range.nearest || range.farthest) ranges.push(range)
        }
    }
    return { ranges, unreadable }
}
