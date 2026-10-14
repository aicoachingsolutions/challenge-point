/**
 * **Properties a game establishes that a coach is NOT told — one table, read by the renderer and the checker.**
 *
 * Moved here from `fidelity.ts` on 14 October 2026 (stage S-C2), so the renderer that leaves a property unsaid and
 * the check that excuses it read the same entry and cannot drift: a renderer that skipped a property the checker
 * did not excuse would be refused, and a checker excusing what the renderer still said would be excusing nothing.
 *
 * **His rule of 1 October, which every entry answers to:**
 *
 *   > *An established property does not require coach-facing expression when it is exclusively
 *   > computational/accounting metadata and all of its operational consequences are already faithfully
 *   > represented in coach-facing instructions.*
 *
 * It has two conditions, and the second is the one that does the work. Claiming a property needs no expression is
 * cheap; proving its operational consequences reached the coach is not. So each entry names the property paths
 * that carry its consequences, and the checker **verifies that an instruction actually cites each of them** — an
 * exclusion whose consequences are not in the rendering is reported as a loss, not honoured. Every exclusion is
 * reported, honoured or not (*"I do not want silent filtering."*).
 *
 * **Two grounds now, each with the ruling that admits it:**
 *
 *   - `ACCOUNTING_METADATA` — his 1 October rule itself: an internal convention or event-accounting field;
 *   - `NO_COACH_ACTION` — Christian, 14 October 2026: *"please remove internal engine terminology such as
 *     'perceptual reference' from coach-facing instructions unless it conveys an actual action the coach needs to
 *     take."* A channel's authored function (`perceptual-reference`, from *"Channels are reference markers"*,
 *     WIDEZONE-08.d) told a coach *"It helps if this channel is established as a perceptual reference"* — engine
 *     words with no act in them. The one act the function implies, that the channel is marked so players can see
 *     it, is the marking instruction; so the consequence named is the region's noun, and the checker verifies that
 *     a MARKING instruction cites it (`dischargedBy` — corrected in the review of S-C2: the preference in
 *     "Adjusting the activity" cites the noun too, and marks nothing). The function stays in the GAME; only its
 *     sentence goes.
 *
 * An entry may carry `applies`: it then excludes a path only where that returns true. `.functions` (the whole
 * list) is excluded only where EVERY member of that region's list is itself excluded — a region that is also, say,
 * an objective area keeps the list coach-facing, so excluding one engine term never silences another fact.
 *
 * Sport-neutral: paths, suffixes and the function term are register vocabulary, not a sport's.
 */

export type ExclusionGround = 'ACCOUNTING_METADATA' | 'NO_COACH_ACTION'

export interface CoachFacingExclusion {
    /** The path, or the path's ending, this entry is about. */
    suffix: string
    ground: ExclusionGround
    /** Why a coach does nothing differently for it, in the report's words. */
    because: string
    /** The owner's words that admit this ground, verbatim, with who and when. */
    ruling: string
    /** The paths that must be cited for the exclusion to be honoured — the property's operational consequences. */
    consequences: (path: string) => string[]
    /** Where present, the entry excludes `path` only when this holds on the fixture. */
    applies?: (path: string, fixture: any) => boolean
    /**
     * Where present, a consequence counts as carried only when an instruction of this kind cites it. Added in the
     * review of stage S-C2 (14 October 2026): the perceptual-reference consequence (the region's noun) was said to be
     * cited "only by a marking instruction", and it is not — the channel's preference in "Adjusting the activity"
     * cites the noun too, so with the marking sentence deleted the exclusion was still honoured. The act the function
     * implies is the MARKING, so only a marking instruction discharges it: the same test Q5 applies.
     */
    dischargedBy?: (instruction: { section: string; status: string }) => boolean
}

/** A marking instruction, as Q5 reads one: in "Set up", and not a preference (a width preference marks nothing). */
const marking = (instruction: { section: string; status: string }): boolean => instruction.section === 'Set up' && instruction.status !== 'PREFERENCE'

const ACCOUNTING_RULING =
    'Christian, 2026-10-01: "An established property does not require coach-facing expression when it is exclusively ' +
    'computational/accounting metadata and all of its operational consequences are already faithfully represented in coach-facing instructions."'

const ENGINE_TERMINOLOGY_RULING =
    'Christian, 2026-10-14: "please remove internal engine terminology such as “perceptual reference” from coach-facing ' +
    'instructions unless it conveys an actual action the coach needs to take."'

/** The function member his ruling of 14 October names. Register vocabulary (S4), not a sport term. */
export const PERCEPTUAL_REFERENCE = 'perceptual-reference'

/** `space.regions[<id>]` of a path under it, or null. The id may hold dots and colons, never a closing bracket. */
function regionBase(path: string): string | null {
    const open = path.indexOf('space.regions[')
    if (open !== 0) return null
    const close = path.indexOf(']', open)
    return close < 0 ? null : path.slice(0, close + 1)
}

/** The region a path is about, read from the game. */
function regionAt(path: string, fixture: any): any {
    const base = regionBase(path)
    if (!base) return undefined
    const id = base.slice('space.regions['.length, -1)
    return (fixture?.game?.space?.regions ?? []).find((r: any) => String(r?.elementId) === id)
}

const memberExcluded = (member: unknown): boolean => member === PERCEPTUAL_REFERENCE

export const COACH_FACING_EXCLUSIONS: CoachFacingExclusion[] = [
    {
        suffix: '.startsEpisode',
        ground: 'ACCOUNTING_METADATA',
        because:
            'an episode boundary is event-accounting metadata: it tells the system when to begin attributing ' +
            'events, and a coach does nothing differently because of it',
        ruling: ACCOUNTING_RULING,
        // Its one operational consequence — that this occurrence does not stop play — is carried by the playState
        // instruction for the SAME element (corrected 13 October: it named one element's play state outright).
        consequences: path => [`${path.slice(0, path.length - '.startsEpisode'.length)}.playState`],
    },
    {
        suffix: 'space.axis',
        ground: 'ACCOUNTING_METADATA',
        because:
            'an internal orientation convention naming which envelope dimension is the axis; it has no ' +
            'operational consequence of its own because the rendered geometry is already in metres along and across',
        ruling: ACCOUNTING_RULING,
        consequences: () => [],
    },
    {
        suffix: `.functions[${PERCEPTUAL_REFERENCE}]`,
        ground: 'NO_COACH_ACTION',
        because:
            'the region’s authored function as a perceptual reference is engine terminology with no act in it for a coach; ' +
            'the act it implies, that the region is marked where players can see it, is the marking instruction',
        ruling: ENGINE_TERMINOLOGY_RULING,
        consequences: path => {
            const base = regionBase(path)
            return base ? [`${base}.noun`] : []
        },
        dischargedBy: marking,
    },
    {
        suffix: '.functions',
        ground: 'NO_COACH_ACTION',
        because:
            'every member of the region’s function list is engine terminology excluded by the same ruling, so the list says ' +
            'nothing a coach acts on; the region itself is carried by its marking instruction',
        ruling: ENGINE_TERMINOLOGY_RULING,
        consequences: path => {
            const base = regionBase(path)
            return base ? [`${base}.noun`] : []
        },
        dischargedBy: marking,
        applies: (path, fixture) => {
            const functions = regionAt(path, fixture)?.functions
            return Array.isArray(functions) && functions.length > 0 && functions.every(memberExcluded)
        },
    },
]

/** The entry that excludes this path on this fixture, or undefined where the path is coach-facing. */
export function exclusionFor(path: string, fixture: any): CoachFacingExclusion | undefined {
    return COACH_FACING_EXCLUSIONS.find(entry => (path.endsWith(entry.suffix) || path === entry.suffix) && (!entry.applies || entry.applies(path, fixture)))
}
