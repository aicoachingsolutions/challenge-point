/**
 * **GA-BOUND-REGION: a region bound to an object, checked against the Sport Profile's authorized pairings** — H3, 23 October 2026 (the d26
 * design's build step 3, its N5; register version 21).
 *
 * Christian, reply filed 26 October 2026, item 7: *"Use an existing regulation [handling area] when the activity dimensions and setup permit
 * it."* *"When a smaller field is necessary, use an explicitly defined and knowledge-authorized scaled [handling area]."* *"I would not
 * approve an undefined area that the coach simply points out"* *"Do not assume a scaled dimension without knowledge support."* (His nouns
 * bracketed for the coupling ratchet.)
 *
 * **What it holds**, for every object kind the Sport Profile's `boundRegions` block names (`requirements`) - read from the game as derived
 * and as realized, the session's statement of its objects and its area, and the block's `pairings`; nothing here names a kind, a function, a
 * noun or a document:
 *   - **before realization** (the resolved game), in this order:
 *       1. every defended object of such a kind (its defended-by line, O7, established), and every object of such a kind holding a region
 *          of the required function bound to it, defended or not, is paired: exactly one authorized pairing gives a region of the required
 *          function for an object of its kind as wide as the session states it. None, or more than one, is
 *          **BOUND_REGION_NOT_AUTHORIZED**: a knowledge gap (which region goes with that object nobody has authorized, or which of two is
 *          not decided), so the activity is refused and nothing behind it is tried - never another entry's region, never a clipped one;
 *       2. the bindings are whole, whatever the session: every defended such object holds exactly one region of the required noun and
 *          function bound to it (S7) and an undefended one at most one, each citing the pairing its geometry is from and set out from the
 *          end line the object stands on, by the same end designation as the object's own position; every region of a function the
 *          profile binds is bound, to an object the game holds of a kind the profile binds that function to. Anything else is
 *          **BOUND_REGION_INVALID**, refused at structure;
 *       3. the pairing's region fits the session's area (narrower than its width, shallower than its length). Where it does not, the
 *          realization does not apply to this session: **BOUND_REGION_DOES_NOT_FIT**, a typed applicability refusal, so the build may try
 *          the next alternative the record authorizes, and the review page says why. Typed only where nothing above is wrong, so a broken
 *          alternative is never hidden behind the next one;
 *   - **after realization** (the concrete game): each object held above stands on an end line, and its bound region lies from that end line
 *     into the area exactly as deep as its pairing says, exactly as wide, centred on the object and inside the touchlines. Anything else is
 *     BOUND_REGION_INVALID, refused at validation.
 *
 * **Why it is not a Gate A invariant.** Gate A reads the derivation alone; this reads the session's statement of its objects (the width a
 * pairing is matched by) and the Sport Profile's pairings, exactly as the object-availability rule beside it does
 * (`assemble-concrete-game.ts` objectAvailabilityRefusal). It runs in the builder after that rule, so the order a session meets is: its
 * testing area, its objects, then this.
 *
 * **No adaptation is read.** The design's N5 names one exception, an explicitly authorized adaptation (his item 10: *"Any specifically
 * authorized small-sided adaptations"*). None is authorized and nothing represents one, so every case above is refused as stated.
 *
 * **What the session states of the object, beyond its width** (H4, 23 October 2026, register version 22; the d26 design's build step 4).
 * A pairing records its object's type (IFAB-LAW-1: Law 1.10's 'full-size' goal); the register lists the type as an attribute a session may
 * state of its objects. Step 1 reads each attribute a pairing of the stated width records: a session stating another value matches no such
 * pairing (a knowledge gap, as a goal of another width is); a session stating none is asked for it (BOUND_REGION_OBJECT_NOT_STATED), never
 * assumed to hold the pairing's object. An attribute no such pairing records is never read or asked. This matches the pairing to the object
 * as the session states it; which objects SUIT a realization is his decision 1 of the note sent to him, and nothing here decides it.
 *
 * **A limit, recorded (the H3 review).** Each object's region is held on its own: two defended objects at opposite ends whose regions would
 * overlap along a short area both pass steps 1 to 3. No activity holds two defended objects; a combined fit is to be added with the first
 * one that does, not assumed here.
 *
 * **Z, 25 October 2026 (register version 25): a region bound to the end line of the team holding a specialized performer** (row S7's second
 * form; the Sport Profile's requirements of the performer-end form, PERMITTED, never required). Christian, reply filed 28 October 2026, item
 * 7: *"I favor retaining a defined [specialized performer] handling area in the target-zone version."* *"My preference is to use the same
 * authorized small-sided [handling-area] geometry where appropriate, even when the physical [object] is replaced by a target zone."* (his
 * nouns bracketed). Held per block (each block is its own game), with the block's role holders (`BoundRegionContext`):
 *   - **before realization**, beside step 2: it serves a function the profile permits at the end of the team holding the row it names, is
 *     of the requirement's noun, borrows exactly its pairing's region (["region"]) and cites by id a pairing the profile holds that lends a
 *     region of that function; it is set out from the end line a team defends (RC-21 "own end (of team T)", read from the register's
 *     machine-readable anchor at 0 along), from 0 m, that team's end established; no object of the kind the requirement names (the kind an
 *     object requirement binds that function to) stands at that end - where one does, its own requirement governs; at most one such region
 *     per team and function. Anything else is BOUND_REGION_INVALID, refused at structure. Then, with step 3, the pairing's region fits the
 *     area, or BOUND_REGION_DOES_NOT_FIT (an applicability refusal);
 *   - **after realization**: the team whose end it is set out from holds a performer on that row (at 1 or more) in this block, read from the
 *     realized teams and the block's designation bindings; at most one such region per such team; it lies from that team's end line exactly
 *     as deep as its pairing says, exactly as wide, centred across the area and inside the touchlines; and no object of that kind is realized
 *     on that end line. Anything else is BOUND_REGION_INVALID, refused at validation.
 * A game binding no region to a performer's end reads nothing new.
 */
import { BoundRegionPairing, BoundRegionRequirement, endBindingOf, endRequirementsOf, ObjectBoundRegionRequirement, objectBindingOf, objectRequirementsOf, PerformerEndRegionBinding, PerformerEndRegionRequirement, regionFunctionsOf, SportBoundRegions } from '../derivation/bound-regions'
import { designationKey } from '../derivation/designation'
import { RegisterIndex } from '../derivation/register'
import { splitPath } from '../derivation/resolved-game'
import { RoleBlock, statedAttributeOf, TeamEndPosition, teamEndPositionOf } from '../derivation/types'
import { axisLengths } from './spatial'
import { attackingEndOf, setupAssignmentOf } from './team-ends'

export const BOUND_REGION_CHECK = 'GA-BOUND-REGION'

/** Why the game's bound regions do not hold, one closed cause each, with the facts a sentence is made from (the builder never reads `why`). */
export type BoundRegionRefusal =
    | { cause: 'BOUND_REGION_NOT_AUTHORIZED'; kind: string; regionFunction: string; widthM: number | null; stated: Record<string, string>; why: string }
    /**
     * H4 (23 October 2026, register version 22): a pairing of the width the session states records an attribute of its object (the register's
     * `sessionResources.attributes`) the session does not state, so which pairing applies cannot be read: the session is ASKED, never
     * assumed to have the pairing's object (the d26 design's S1: *"The coach states the type. The engine never infers it, and absent means not
     * stated (it is asked)."*). Raised only where a pairing reads the attribute, so nothing is asked that nothing reads.
     */
    | { cause: 'BOUND_REGION_OBJECT_NOT_STATED'; kind: string; regionFunction: string; attribute: string; values: string[]; why: string }
    /** Z: `kind` and `widthM` are null for a region bound to a performer's end (no object is read: only the pairing's region is borrowed). */
    | { cause: 'BOUND_REGION_DOES_NOT_FIT'; kind: string | null; regionFunction: string; widthM: number | null; pairing: string; why: string }
    | { cause: 'BOUND_REGION_INVALID'; problems: string[]; why: string }

/**
 * **What a block's game is checked with, beyond itself** (Z, 25 October 2026): its role block (which end-assigned team holds each role, so a
 * role holder's end is read) and, after realization, its designation bindings (which realized team is which end-assigned team, so the team
 * holding a performer is known by its end). Absent for every caller that binds no region to a performer's end.
 */
export interface BoundRegionContext {
    roleBlock?: RoleBlock | null
    designationBindings?: { designation: string; handle: string }[] | null
}

const SAME = 1e-9
const readAt = (root: unknown, path: string): unknown => path.split('.').reduce<any>((node, key) => (node === null || node === undefined ? undefined : node[key]), root)
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

interface Read {
    objects: Record<string, unknown>[]
    regions: Record<string, unknown>[]
    kindLeaf: string
    defendedLeaf: string | null
    objectAlongLeaf: string
    objectAcrossLeaf: string
}

/** The game's objects and regions, and the leaves the check reads on them; null without the register's blocks. */
function readGame(index: RegisterIndex, game: unknown): Read | null {
    const spec = index.boundRegions
    const geometry = index.objectGeometry
    if (!spec || !geometry) return null
    const objectsAt = splitPath(spec.objectPath).container
    const regionsAt = splitPath(spec.path).container
    const asList = (value: unknown) => (Array.isArray(value) ? value.filter(isObject) : [])
    const defendedRow = index.roleScoring?.defendedByRow ?? null
    const defendedPath = defendedRow ? String(index.rows.get(defendedRow)?.path ?? '') : ''
    const prefix = `${spec.objectPath}.`
    return {
        objects: objectsAt ? asList(readAt(game, objectsAt)) : [],
        regions: regionsAt ? asList(readAt(game, regionsAt)) : [],
        kindLeaf: geometry.kindLeaf,
        defendedLeaf: defendedPath.startsWith(prefix) ? defendedPath.slice(prefix.length) : null,
        objectAlongLeaf: geometry.alongLeaf,
        objectAcrossLeaf: geometry.acrossLeaf,
    }
}

const isDefended = (object: Record<string, unknown>, read: Read): boolean => {
    if (!read.defendedLeaf) return false
    const value = readAt(object, read.defendedLeaf)
    return typeof value === 'string' && value.trim().length > 0
}

/** The width the session states for its objects of a kind, or null. */
function statedWidthOf(envelope: unknown, kind: string): number | null {
    const stated = (envelope as { objects?: Record<string, { widthM?: unknown }> } | undefined)?.objects
    const width = stated && Object.prototype.hasOwnProperty.call(stated, kind) ? stated[kind]?.widthM : undefined
    return typeof width === 'number' && Number.isFinite(width) && width > 0 ? width : null
}

/**
 * One object of a required kind the check holds - defended (it needs a region), or holding a region of the required function bound to it
 * (a region it holds is held to an authorized pairing whether or not the object is defended: an area of a size nobody authorized is refused
 * however it got there) - with the requirement it answers to and the pairings authorized for its stated width.
 */
interface Subject {
    object: Record<string, unknown>
    id: string
    kind: string
    defended: boolean
    requirement: ObjectBoundRegionRequirement
    widthM: number | null
    /** The pairings authorized for the object as the session states it: its width, and each attribute a pairing of that width records (H4). */
    pairings: BoundRegionPairing[]
    /** H4: the attributes a pairing of the stated width records and the session does not state (asked), and those it states that were read. */
    unstated: { attribute: string; values: string[] }[]
    stated: Record<string, string>
}

/** The value a pairing records for an attribute of its object, or null (H4). */
const recordedBy = (pairing: BoundRegionPairing, attribute: string): string | null => {
    const value = (pairing.object as unknown as Record<string, unknown>)[attribute]
    return typeof value === 'string' && value.length > 0 ? value : null
}

function subjectsOf(read: Read, block: SportBoundRegions, envelope: unknown, index: RegisterIndex): Subject[] {
    const found: Subject[] = []
    const statedObjects = (envelope as { objects?: unknown } | undefined)?.objects
    // Z: the object requirements only; a region at a performer's end is held by `endBoundRead`.
    for (const requirement of objectRequirementsOf(block)) {
        for (const object of read.objects) {
            if (readAt(object, read.kindLeaf) !== requirement.object.kind) continue
            const id = String(object.elementId ?? '(no id)')
            const defended = isDefended(object, read)
            const holdsOne = read.regions.some(region => objectBindingOf(region, index)?.objectId === id && regionFunctionsOf(region, index).includes(requirement.region.function))
            if (!defended && !holdsOne) continue
            const widthM = statedWidthOf(envelope, requirement.object.kind)
            let pairings = block.pairings.filter(entry => entry.object.kind === requirement.object.kind && entry.region.function === requirement.region.function && widthM !== null && Math.abs(entry.object.widthM - widthM) < SAME)
            /**
             * H4 (register version 22): each attribute a session may state of the kind that a pairing of the stated width records is read -
             * stated, a pairing recording another value does not match; not stated, it is asked (`unstated`), never assumed to be the
             * pairing's. An attribute no such pairing records is not read, so a session is never asked for what nothing here uses.
             */
            const unstated: Subject['unstated'] = []
            const stated: Record<string, string> = {}
            for (const { attribute, values } of (index.sessionResources?.attributes ?? []).filter(entry => entry.kind === requirement.object.kind)) {
                if (!pairings.some(entry => recordedBy(entry, attribute) !== null)) continue
                const value = statedAttributeOf(statedObjects, requirement.object.kind, attribute)
                if (value === null) {
                    unstated.push({ attribute, values: [...values] })
                    continue
                }
                stated[attribute] = value
                pairings = pairings.filter(entry => recordedBy(entry, attribute) === null || recordedBy(entry, attribute) === value)
            }
            found.push({ object, id, kind: requirement.object.kind, defended, requirement, widthM, pairings, unstated, stated })
        }
    }
    return found
}

const pairingsText = (block: SportBoundRegions, requirement: ObjectBoundRegionRequirement): string => {
    const entries = block.pairings.filter(entry => entry.object.kind === requirement.object.kind && entry.region.function === requirement.region.function)
    return entries.length ? entries.map(entry => `${entry.id} for a ${entry.object.kind} ${entry.object.widthM} m wide (${entry.document}, ${entry.citedAs})`).join('; ') : 'none'
}

/** One region bound to a performer's end, as read for the check (Z): what it serves, under which requirement, its pairing and its end. */
interface EndBound {
    region: Record<string, unknown>
    regionId: string
    binding: PerformerEndRegionBinding
    requirement: PerformerEndRegionRequirement
    pairing: BoundRegionPairing
    along: TeamEndPosition
    /** The end-assigned team (setup assignment) whose end line it is set out from, and that end (0 or 1, a fraction of the along axis). */
    team: string
    end: 0 | 1
}

/** The register's machine-readable term for "the end line a team defends": the anchor at 0 along (RC-21's "own end (of team T)"). */
function ownEndTermOf(index: RegisterIndex): string | null {
    const terms = (((index.relativeTerms ?? {}) as any).machineReadable?.terms ?? {}) as Record<string, any>
    const found = Object.entries(terms).filter(([, definition]) => definition?.kind === 'anchor' && definition?.axis === 'along' && definition?.at === 0)
    return found.length === 1 ? found[0][0] : null
}

/**
 * **Every region bound to a performer's end, read, with what is wrong with each** (Z, 25 October 2026; the module note). Read on the game as
 * derived and as realized alike: the requirement it answers to, its noun, what it borrows, its pairing, the end line it is set out from and
 * that end established for the block, no object of the bound kind at that end (by its typed position; insufficient evidence is never a
 * pass), and at most one per team and function. Only regions with nothing wrong are returned to be held further.
 */
function endBoundRead(read: Read, block: SportBoundRegions, index: RegisterIndex, game: unknown, context: BoundRegionContext): { held: EndBound[]; problems: string[] } {
    const spec = index.boundRegions!
    const problems: string[] = []
    const held: EndBound[] = []
    const roleBlock = context.roleBlock ?? null
    const ownEnd = ownEndTermOf(index)
    const terms = (((index.relativeTerms ?? {}) as any).machineReadable?.terms ?? {}) as Record<string, any>
    /** The end (0 or 1) a team defends, or null with why. */
    const defendedEnd = (designation: string): { end: 0 | 1 | null; why: string } => {
        const attacking = attackingEndOf(game, index, roleBlock, designation)
        return attacking.end === null ? { end: null, why: attacking.why } : { end: attacking.end === 1 ? 0 : 1, why: attacking.why }
    }
    const seen = new Map<string, string>()
    for (const region of read.regions) {
        const binding = endBindingOf(region, index)
        if (!binding) continue
        const regionId = String(region.elementId ?? '(no id)')
        const functions = regionFunctionsOf(region, index)
        const requirement = endRequirementsOf(block).find(entry => entry.performerEnd.row === binding.row && functions.includes(entry.region.function))
        if (!requirement) {
            problems.push(`${regionId} is bound to the end of the team holding ${binding.row}, and the Sport Profile permits none of its functions (${functions.join(', ') || 'none'}) there`)
            continue
        }
        const fn = requirement.region.function
        const before = problems.length
        if (readAt(region, spec.nounLeaf) !== requirement.region.noun) problems.push(`${regionId} is a ${String(readAt(region, spec.nounLeaf))}, and the Sport Profile (${requirement.id}) permits a ${requirement.region.noun}`)
        if (binding.borrows.length !== 1 || binding.borrows[0] !== 'region') problems.push(`${regionId} borrows ${JSON.stringify(binding.borrows)} of its pairing, and a region at a performer's end borrows exactly the pairing's region (["region"]): the object and the mark never come with it`)
        const pairing = binding.pairing ? block.pairings.find(entry => entry.id === binding.pairing) : undefined
        if (!pairing) problems.push(`${regionId} cites the pairing ${JSON.stringify(binding.pairing)}, which the Sport Profile does not hold: its geometry comes from one authorized pairing, cited by id`)
        else if (pairing.region.function !== fn || !pairing.borrows.includes('region')) problems.push(`${regionId} cites ${pairing.id}, which lends no ${fn} region`)
        const along = teamEndPositionOf(readAt(region, spec.alongLeaf))
        if (!ownEnd || !along || along.term !== ownEnd || along.offsetM.from !== 0) {
            problems.push(`${regionId} is not set out from the end line of a team from 0 m (its along position is ${JSON.stringify(readAt(region, spec.alongLeaf))}; the binding names the end of the team holding ${binding.row}, "${ownEnd ?? 'no end-line term'}" from 0 m)`)
        }
        const team = along ? setupAssignmentOf(index, along.forTeam, roleBlock) : null
        const end = along ? defendedEnd(along.forTeam) : null
        if (along && (!team || !end || end.end === null)) problems.push(`${regionId} is set out from the end line ${along.forTeam} defends, and which end that is is not established in this block${end ? `: ${end.why}` : ''}`)
        // No object of the kind the requirement names stands at that end: where one does, its own requirement governs.
        if (along && end && end.end !== null) {
            for (const object of read.objects.filter(candidate => readAt(candidate, read.kindLeaf) === requirement.performerEnd.whereNoObjectOfKind)) {
                const objectId = String(object.elementId ?? '(no id)')
                const position = teamEndPositionOf(readAt(object, read.objectAlongLeaf))
                const definition = position ? terms[position.term] : null
                const objectEnd = position && definition?.kind === 'anchor' && definition?.axis === 'along' && (definition.at === 0 || definition.at === 1) ? (definition.at === 0 ? defendedEnd(position.forTeam).end : (attackingEndOf(game, index, roleBlock, position.forTeam).end as 0 | 1 | null)) : null
                if (objectEnd === null) problems.push(`${regionId} is bound to the end of the team holding ${binding.row}, and whether ${objectId}, a ${requirement.performerEnd.whereNoObjectOfKind}, stands at that end line cannot be read (its along position is ${JSON.stringify(readAt(object, read.objectAlongLeaf))}): insufficient evidence is never a pass`)
                else if (objectEnd === end.end) problems.push(`${regionId} is bound to the end of the team holding ${binding.row}, and ${objectId}, a ${requirement.performerEnd.whereNoObjectOfKind}, stands at that end line: where a ${requirement.performerEnd.whereNoObjectOfKind} stands, its own requirement governs, never a performer's end`)
            }
        }
        if (team) {
            const key = `${binding.row}|${fn}|${team}`
            if (seen.has(key)) problems.push(`${regionId} and ${seen.get(key)} are both regions of the function ${fn} bound to the end of ${team}, the team holding ${binding.row}: one is permitted`)
            else seen.set(key, regionId)
        }
        if (problems.length === before && pairing && along && team && end && end.end !== null) held.push({ region, regionId, binding, requirement, pairing, along, team, end: end.end })
    }
    return { held, problems }
}

/**
 * **The check before realization**, on the resolved game: authorization first, then the bindings, then the fit (see the module note). Null
 * where it holds, or where the register or the profile names no bound region (then nothing is read). Z (25 October 2026): `context` carries the
 * block's role holders, read only where a region is bound to a performer's end.
 */
export function boundRegionRefusalBefore(index: RegisterIndex, game: unknown, envelope: unknown, block: SportBoundRegions | null, context: BoundRegionContext = {}): BoundRegionRefusal | null {
    const spec = index.boundRegions
    const read = readGame(index, game)
    if (!spec || !read || !block || !block.requirements.length) return null
    const subjects = subjectsOf(read, block, envelope, index)
    // 1. Authorization: one authorized pairing for each object held, as the session states it. Where a pairing of the stated width records an
    // attribute the session does not state (H4), the session is asked first: which pairing applies cannot be read without it.
    for (const entry of subjects) {
        const fn = entry.requirement.region.function
        const what = entry.defended ? `${entry.id} is a defended ${entry.kind}` : `${entry.id} is a ${entry.kind} no team defends, holding a ${fn} region,`
        if (entry.unstated.length) {
            const [{ attribute, values }] = entry.unstated
            const recording = block.pairings.filter(pairing => pairing.object.kind === entry.kind && pairing.region.function === fn && entry.widthM !== null && Math.abs(pairing.object.widthM - entry.widthM) < SAME && recordedBy(pairing, attribute) !== null)
            return {
                cause: 'BOUND_REGION_OBJECT_NOT_STATED',
                kind: entry.kind,
                regionFunction: fn,
                attribute,
                values,
                why: `${BOUND_REGION_CHECK}: ${what} ${entry.widthM} m wide as the session states it, and the authorized pairing${recording.length === 1 ? '' : 's'} of that width (${recording.map(pairing => `${pairing.id}: ${attribute} ${recordedBy(pairing, attribute)}`).join('; ')}) record${recording.length === 1 ? 's' : ''} the ${attribute} of the ${entry.kind}, which the session does not state: absent means NOT STATED, so it is asked, never assumed`,
            }
        }
        if (entry.pairings.length === 1) continue
        const statedText = Object.entries(entry.stated).map(([attribute, value]) => `, of the ${attribute} ${value}`).join('')
        const why =
            entry.pairings.length === 0
                ? `${what}${entry.widthM === null ? ' whose width the session does not state' : ` ${entry.widthM} m wide${statedText} as the session states it`}, and no authorized pairing of the Sport Profile gives a ${fn} region for it (its pairings for the kind: ${pairingsText(block, entry.requirement)}); which ${fn} region goes with it is a knowledge decision nobody has made, so none is borrowed from another entry and none is clipped`
                : `${what} ${entry.widthM} m wide${statedText}, and ${entry.pairings.length} authorized pairings give a ${fn} region for it (${entry.pairings.map(p => p.id).join(', ')}); which applies is not decided`
        return { cause: 'BOUND_REGION_NOT_AUTHORIZED', kind: entry.kind, regionFunction: fn, widthM: entry.widthM, stated: { ...entry.stated }, why: `${BOUND_REGION_CHECK}: ${why}` }
    }
    // 2. The bindings, whatever the session.
    const problems: string[] = []
    const functionsBound = new Set(block.requirements.map(requirement => requirement.region.function))
    const objectOf = (id: string) => read.objects.find(object => object.elementId === id)
    const regionBinding = (region: Record<string, unknown>) => objectBindingOf(region, index) ?? endBindingOf(region, index)
    for (const region of read.regions) {
        const regionId = String(region.elementId ?? '(no id)')
        const binding = regionBinding(region)
        const served = regionFunctionsOf(region, index).filter(fn => functionsBound.has(fn))
        if (binding && !served.length) problems.push(binding.to === 'OBJECT' ? `${regionId} is bound to ${binding.objectId} (${spec.ofObjectRow}) and serves no function the Sport Profile binds to an object` : `${regionId} is bound to the end of the team holding ${binding.row} (${spec.ofObjectRow}) and serves no function the Sport Profile permits there`)
        for (const fn of served) {
            const kinds = objectRequirementsOf(block).filter(requirement => requirement.region.function === fn).map(requirement => requirement.object.kind)
            const rows = endRequirementsOf(block).filter(requirement => requirement.region.function === fn).map(requirement => requirement.performerEnd.row)
            if (!binding) {
                problems.push(`${regionId} serves ${fn}, which the Sport Profile binds to an object of the kind ${kinds.join(' or ')}${rows.length ? ` (or permits at the end of the team holding ${rows.join(' or ')})` : ''}, and is bound to none (${spec.ofObjectRow})`)
                continue
            }
            // Z: a region bound to a performer's end is held by `endBoundRead` below.
            if (binding.to === 'PERFORMER_END') continue
            const object = objectOf(binding.objectId)
            const kind = object ? String(readAt(object, read.kindLeaf)) : null
            if (!object) problems.push(`${regionId} is bound to ${binding.objectId}, which the game holds as no object`)
            else if (!kinds.includes(String(kind))) problems.push(`${regionId} serves ${fn} and is bound to ${binding.objectId}, an object of the kind ${kind}; the Sport Profile binds ${fn} only to ${kinds.join(' or ') || 'no object kind'}`)
        }
    }
    // Z: every region bound to a performer's end (see the module note).
    const ends = endBoundRead(read, block, index, game, context)
    problems.push(...ends.problems)
    for (const entry of subjects) {
        const { requirement } = entry
        const fn = requirement.region.function
        const bound = read.regions.filter(region => objectBindingOf(region, index)?.objectId === entry.id && regionFunctionsOf(region, index).includes(fn))
        if (bound.length !== 1) {
            problems.push(
                entry.defended
                    ? `${entry.id} is a defended ${entry.kind}, which the Sport Profile (${requirement.id}) needs exactly one ${requirement.region.noun} of the function ${fn} bound to, and the game binds ${bound.length}`
                    : `${entry.id} holds ${bound.length} regions of the function ${fn} bound to it, and the Sport Profile (${requirement.id}) binds one`,
            )
            continue
        }
        const [region] = bound
        const regionId = String(region.elementId ?? '(no id)')
        const pairing = entry.pairings[0]
        // Step 1 returned for every object without exactly one pairing (the H3 review): a reordering of the steps is refused here, named,
        // never a TypeError at run time.
        if (!pairing || entry.pairings.length !== 1) {
            problems.push(`${entry.id}'s bindings were read before its pairing was authorized (the check's steps are out of order)`)
            continue
        }
        const cited = objectBindingOf(region, index)!.pairing
        if (cited !== pairing.id) problems.push(`${regionId} cites the pairing ${JSON.stringify(cited)}, and the one authorized pairing for ${entry.id} as the session states it is ${pairing.id}`)
        if (readAt(region, spec.nounLeaf) !== requirement.region.noun) problems.push(`${regionId} is a ${String(readAt(region, spec.nounLeaf))}, and the Sport Profile (${requirement.id}) binds a ${requirement.region.noun}`)
        const objectAlong = teamEndPositionOf(readAt(entry.object, read.objectAlongLeaf))
        const regionAlong = teamEndPositionOf(readAt(region, spec.alongLeaf))
        if (!objectAlong || objectAlong.offsetM.from !== 0 || objectAlong.offsetM.to !== 0) {
            problems.push(`${entry.id} is not positioned on an end line by a team's end (its along position is ${JSON.stringify(readAt(entry.object, read.objectAlongLeaf))}), so no region can be set out from the end line it stands on`)
        } else if (!regionAlong || regionAlong.term !== objectAlong.term || regionAlong.forTeam !== objectAlong.forTeam || regionAlong.offsetM.from !== 0) {
            problems.push(`${regionId} is not set out from the end line ${entry.id} stands on: its along position is ${JSON.stringify(readAt(region, spec.alongLeaf))}, and the object's is "${objectAlong.term}" of ${objectAlong.forTeam} from 0 m`)
        }
    }
    if (problems.length) return { cause: 'BOUND_REGION_INVALID', problems, why: `${BOUND_REGION_CHECK}: ${problems.join('; ')}` }
    // 3. The fit, typed only where nothing above is wrong.
    const axes = axisLengths((envelope ?? {}) as { lengthM?: number; widthM?: number })
    for (const entry of subjects) {
        const pairing = entry.pairings[0]
        // As in step 2 (the H3 review): the fit is read only of an authorized pairing, so a reordering is refused here, named.
        if (!pairing || entry.pairings.length !== 1) {
            const problem = `${entry.id}'s fit was read before its pairing was authorized (the check's steps are out of order)`
            return { cause: 'BOUND_REGION_INVALID', problems: [problem], why: `${BOUND_REGION_CHECK}: ${problem}` }
        }
        if (axes && pairing.region.widthM < axes.across && pairing.region.depthM < axes.along) continue
        const fn = entry.requirement.region.function
        const area = axes ? `${axes.along} m long and ${axes.across} m wide` : 'of no stated size'
        return {
            cause: 'BOUND_REGION_DOES_NOT_FIT',
            kind: entry.kind,
            regionFunction: fn,
            widthM: entry.widthM!,
            pairing: pairing.id,
            why: `${BOUND_REGION_CHECK}: the ${fn} region the authorized pairing ${pairing.id} gives a ${entry.kind} ${entry.widthM} m wide (${pairing.document}, ${pairing.citedAs}) is ${pairing.region.widthM} m wide and ${pairing.region.depthM} m deep, and the session's area is ${area}: it does not fit inside the area, and it is never clipped`,
        }
    }
    // Z: the fit of each region bound to a performer's end (its pairing's region only), typed only where nothing above is wrong.
    for (const entry of ends.held) {
        if (axes && entry.pairing.region.widthM < axes.across && entry.pairing.region.depthM < axes.along) continue
        const fn = entry.requirement.region.function
        const area = axes ? `${axes.along} m long and ${axes.across} m wide` : 'of no stated size'
        return {
            cause: 'BOUND_REGION_DOES_NOT_FIT',
            kind: null,
            regionFunction: fn,
            widthM: null,
            pairing: entry.pairing.id,
            why: `${BOUND_REGION_CHECK}: the ${fn} region ${entry.regionId} borrows from the authorized pairing ${entry.pairing.id} (${entry.pairing.document}, ${entry.pairing.citedAs}) is ${entry.pairing.region.widthM} m wide and ${entry.pairing.region.depthM} m deep, and the session's area is ${area}: it does not fit inside the area, and it is never clipped`,
        }
    }
    return null
}

/**
 * **The check after realization**, on the concrete game: each object it holds (defended, or holding a bound region) stands on an end line, and its bound region
 * lies from that end line into the area exactly as deep and as wide as its pairing says, centred on the object, inside the touchlines. Null
 * where it holds (or where nothing is required); the bindings and the authorization were held before realization, so this reads geometry.
 */
export function boundRegionRefusalAfter(index: RegisterIndex, game: unknown, envelope: unknown, block: SportBoundRegions | null, context: BoundRegionContext = {}): BoundRegionRefusal | null {
    const spec = index.boundRegions
    const read = readGame(index, game)
    const axes = axisLengths((envelope ?? {}) as { lengthM?: number; widthM?: number })
    if (!spec || !read || !block || !block.requirements.length) return null
    const problems: string[] = []
    const intervalAt = (element: unknown, leaf: string): { from: number; to: number } | null => {
        const interval = (readAt(element, `realizedGeometry.${leaf}`) as { interval?: { from?: unknown; to?: unknown } } | undefined)?.interval
        return interval && typeof interval.from === 'number' && typeof interval.to === 'number' ? { from: interval.from, to: interval.to } : null
    }
    // Z: every region bound to a performer's end, on the concrete game (see the module note).
    problems.push(...endBoundProblemsAfter(read, block, index, game, envelope, context, intervalAt))
    for (const entry of subjectsOf(read, block, envelope, index)) {
        const pairing = entry.pairings[0]
        if (!pairing || !axes) {
            problems.push(`${entry.id} could not be read against an authorized pairing and the session's area after realization`)
            continue
        }
        const fn = entry.requirement.region.function
        const region = read.regions.find(candidate => objectBindingOf(candidate, index)?.objectId === entry.id && regionFunctionsOf(candidate, index).includes(fn))
        if (!region) {
            problems.push(`${entry.id} holds no ${fn} region bound to it after realization`)
            continue
        }
        const regionId = String(region.elementId ?? '(no id)')
        const objectAlong = intervalAt(entry.object, read.objectAlongLeaf)
        const objectAcross = intervalAt(entry.object, read.objectAcrossLeaf)
        const along = intervalAt(region, spec.alongLeaf)
        const across = intervalAt(region, spec.acrossLeaf)
        if (!objectAlong || !objectAcross || !along || !across) {
            problems.push(`${regionId} or ${entry.id} holds no realized position along and across the area`)
            continue
        }
        const line = Math.abs(objectAlong.from) < SAME && Math.abs(objectAlong.to) < SAME ? 0 : Math.abs(objectAlong.from - axes.along) < SAME && Math.abs(objectAlong.to - axes.along) < SAME ? axes.along : null
        if (line === null) {
            problems.push(`${entry.id} stands at ${objectAlong.from}-${objectAlong.to} m along the area, on no end line`)
            continue
        }
        const expected = line === 0 ? { from: 0, to: pairing.region.depthM } : { from: axes.along - pairing.region.depthM, to: axes.along }
        if (Math.abs(along.from - expected.from) > SAME || Math.abs(along.to - expected.to) > SAME) {
            problems.push(`${regionId} lies ${along.from}-${along.to} m along the area; ${pairing.id} sets it out from the end line ${entry.id} stands on (${line} m) ${pairing.region.depthM} m into the area (${expected.from}-${expected.to} m)`)
        }
        const width = across.to - across.from
        const centre = (across.from + across.to) / 2
        const objectCentre = (objectAcross.from + objectAcross.to) / 2
        if (Math.abs(width - pairing.region.widthM) > SAME) problems.push(`${regionId} is ${width} m wide across the area, and ${pairing.id} gives ${pairing.region.widthM} m`)
        if (Math.abs(centre - objectCentre) > SAME) problems.push(`${regionId} is centred at ${centre} m across the area and ${entry.id} at ${objectCentre} m: the region is not centred on the object`)
        if (across.from > objectAcross.from + SAME || across.to < objectAcross.to - SAME) problems.push(`${regionId} (${across.from}-${across.to} m) does not contain ${entry.id} (${objectAcross.from}-${objectAcross.to} m) across the area`)
        if (across.from < -SAME || across.to > axes.across + SAME || width >= axes.across) problems.push(`${regionId} (${across.from}-${across.to} m) does not lie inside the touchlines of a ${axes.across} m width`)
    }
    return problems.length ? { cause: 'BOUND_REGION_INVALID', problems, why: `${BOUND_REGION_CHECK}: ${problems.join('; ')}` } : null
}

/**
 * **Every region bound to a performer's end, on the concrete game** (Z, 25 October 2026; the module note): read as before realization
 * (`endBoundRead`), then the team whose end it is set out from holds a performer on the row, at 1 or more, in this block (the realized teams,
 * matched to their end-assigned team by the block's designation bindings); at most one such region per such team; it lies from that end line
 * exactly as deep as its pairing says, exactly as wide, centred across the area, inside the touchlines; and no object of the bound kind is
 * realized on that end line. Each problem is a sentence; none means it holds.
 */
function endBoundProblemsAfter(
    read: Read,
    block: SportBoundRegions,
    index: RegisterIndex,
    game: unknown,
    envelope: unknown,
    context: BoundRegionContext,
    intervalAt: (element: unknown, leaf: string) => { from: number; to: number } | null,
): string[] {
    const spec = index.boundRegions!
    if (!read.regions.some(region => endBindingOf(region, index))) return []
    const { held, problems } = endBoundRead(read, block, index, game, context)
    const axes = axisLengths((envelope ?? {}) as { lengthM?: number; widthM?: number })
    if (!axes) return [...problems, 'the regions bound to a performer\'s end could not be read against the session\'s area after realization']
    const bindings = context.designationBindings ?? []
    const perTeam = new Map<string, string>()
    for (const entry of held) {
        const row = entry.binding.row
        const { container, leaf } = splitPath(String(index.rows.get(row)?.path ?? ''))
        const teams = container ? readAt(game, container) : undefined
        // The team holding the performer: each realized team holding one or more, by the end-assigned team the block binds it to.
        const holders = Array.isArray(teams)
            ? (teams as Record<string, unknown>[])
                  .filter(team => typeof readAt(team, leaf) === 'number' && Number(readAt(team, leaf)) >= 1)
                  .map(team => {
                      const bound = bindings.find(binding => binding.handle === String(team.elementId))
                      return bound ? designationKey(index, bound.designation) : null
                  })
            : []
        if (!Array.isArray(teams) || holders.some(holder => holder === null)) {
            problems.push(`${entry.regionId} is bound to the end of the team holding ${row}, and which end-assigned team holds a performer on ${row} in this block cannot be read (the realized teams or the block's designation bindings are missing)`)
            continue
        }
        /**
         * Where no team holds a performer on the row at all, the session could not staff it: that is the roster's to refuse, typed as a
         * shortfall (the build may try the next alternative), and the realization's own item requiring the performer refuses it at
         * validation. Read here as well it would hide that type behind a broken binding, which this is not. Where some team holds one, the
         * region must be at that team's end.
         */
        if (holders.length && !holders.includes(entry.team)) {
            problems.push(`${entry.regionId} is set out from the end line ${entry.team} defends (${entry.along.forTeam}), and ${entry.team} holds no performer on ${row} in this block${holders.length ? ` (${holders.join(', ')} holds one)` : ' (no team holds one)'}`)
            continue
        }
        const key = `${row}|${entry.requirement.region.function}|${entry.team}`
        if (perTeam.has(key)) problems.push(`${entry.regionId} and ${perTeam.get(key)} are both regions of the function ${entry.requirement.region.function} at the end of ${entry.team}, the team holding ${row}: one is permitted`)
        perTeam.set(key, entry.regionId)
        const along = intervalAt(entry.region, spec.alongLeaf)
        const across = intervalAt(entry.region, spec.acrossLeaf)
        if (!along || !across) {
            problems.push(`${entry.regionId} holds no realized position along and across the area`)
            continue
        }
        const line = entry.end === 0 ? 0 : axes.along
        const depth = entry.pairing.region.depthM
        const expected = entry.end === 0 ? { from: 0, to: depth } : { from: axes.along - depth, to: axes.along }
        if (Math.abs(along.from - expected.from) > SAME || Math.abs(along.to - expected.to) > SAME) {
            problems.push(`${entry.regionId} lies ${along.from}-${along.to} m along the area; ${entry.pairing.id} sets it out from the end line ${entry.team} defends (${line} m) ${depth} m into the area (${expected.from}-${expected.to} m)`)
        }
        const width = across.to - across.from
        const centre = (across.from + across.to) / 2
        if (Math.abs(width - entry.pairing.region.widthM) > SAME) problems.push(`${entry.regionId} is ${width} m wide across the area, and ${entry.pairing.id} gives ${entry.pairing.region.widthM} m`)
        if (Math.abs(centre - axes.across / 2) > SAME) problems.push(`${entry.regionId} is centred at ${centre} m across the area, and a region at a performer's end is centred across it (${axes.across / 2} m)`)
        if (across.from < -SAME || across.to > axes.across + SAME || width >= axes.across) problems.push(`${entry.regionId} (${across.from}-${across.to} m) does not lie inside the touchlines of a ${axes.across} m width`)
        // No object of the bound kind realized on that end line (its anchor there, or one point on it).
        for (const object of read.objects.filter(candidate => readAt(candidate, read.kindLeaf) === entry.requirement.performerEnd.whereNoObjectOfKind)) {
            const anchor = (readAt(object, `realizedGeometry.${read.objectAlongLeaf}`) as { anchor?: unknown } | undefined)?.anchor
            const at = intervalAt(object, read.objectAlongLeaf)
            const onLine = typeof anchor === 'number' ? Math.abs(anchor - line) < SAME : !!at && Math.abs(at.from - line) < SAME && Math.abs(at.to - line) < SAME
            if (onLine) problems.push(`${entry.regionId} is bound to the end of the team holding ${row}, and ${String(object.elementId ?? '(no id)')}, a ${entry.requirement.performerEnd.whereNoObjectOfKind}, is realized on that end line (${line} m): where one stands, its own requirement governs`)
        }
    }
    return problems
}

/** One bound region as the review evidence shows it: the region, what it serves, the object it is bound to, the pairing, where it lies. */
export interface BoundRegionBinding {
    region: string
    noun: string | null
    functions: string[]
    /** The object it is bound to; null for a region bound to a performer's end (Z). */
    object: string | null
    kind: string | null
    defendedBy: string | null
    pairing: BoundRegionPairing | null
    along: { from: number; to: number } | null
    across: { from: number; to: number } | null
    /** Z (25 October 2026): the performer row whose holder's end it is bound to, and what it borrows of its pairing; absent for an object's region. */
    performerEnd?: string
    borrows?: string[]
}

/** The bound regions of an activity, for the administrator's review evidence only; null where no game holds one. */
export interface BoundRegionAccount {
    status: 'ACCOUNT_FOR_REVIEW'
    check: typeof BOUND_REGION_CHECK
    source: { file: string; authority: SportBoundRegions['authority'] }
    requirements: BoundRegionRequirement[]
    blocks: { blockId: string; bindings: BoundRegionBinding[] }[]
}

/**
 * The account of the games as built: every region bound to an object in each, with the pairing it cites as the profile holds it. Z (25 October
 * 2026): and every region bound to a performer's end, with the row and what it borrows; the requirements shown are those of the forms its
 * bindings answer to (an object's region, a performer's end), so an account of object bindings shows exactly what it did.
 */
export function boundRegionAccountOf(index: RegisterIndex, blocks: { blockId: string; game: unknown }[], block: SportBoundRegions | null): BoundRegionAccount | null {
    const spec = index.boundRegions
    if (!spec || !block) return null
    const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
    const accounted = blocks.map(({ blockId, game }) => {
        const read = readGame(index, game)
        const bindings: BoundRegionBinding[] = []
        for (const region of read?.regions ?? []) {
            const binding = objectBindingOf(region, index) ?? endBindingOf(region, index)
            if (!binding || !read) continue
            const object = binding.to === 'OBJECT' ? read.objects.find(candidate => candidate.elementId === binding.objectId) : undefined
            const interval = (leaf: string) => {
                const value = (readAt(region, `realizedGeometry.${leaf}`) as { interval?: { from: number; to: number } } | undefined)?.interval
                return value && typeof value.from === 'number' && typeof value.to === 'number' ? { from: value.from, to: value.to } : null
            }
            const defended = object && read.defendedLeaf ? readAt(object, read.defendedLeaf) : undefined
            const pairing = block.pairings.find(entry => entry.id === binding.pairing)
            bindings.push({
                region: String(region.elementId ?? '(no id)'),
                noun: typeof readAt(region, spec.nounLeaf) === 'string' ? String(readAt(region, spec.nounLeaf)) : null,
                functions: regionFunctionsOf(region, index),
                object: binding.to === 'OBJECT' ? binding.objectId : null,
                kind: object ? String(readAt(object, read.kindLeaf)) : null,
                defendedBy: typeof defended === 'string' ? defended : null,
                pairing: pairing ? copy(pairing) : null,
                along: interval(spec.alongLeaf),
                across: interval(spec.acrossLeaf),
                ...(binding.to === 'PERFORMER_END' ? { performerEnd: binding.row, borrows: [...binding.borrows] } : {}),
            })
        }
        return { blockId, bindings }
    })
    if (!accounted.some(entry => entry.bindings.length)) return null
    const all = accounted.flatMap(entry => entry.bindings)
    const shown = block.requirements.filter(requirement => ('object' in requirement ? all.some(binding => binding.object !== null) : all.some(binding => binding.performerEnd !== undefined)))
    return { status: 'ACCOUNT_FOR_REVIEW', check: BOUND_REGION_CHECK, source: { file: block.file, authority: copy(block.authority) }, requirements: copy(shown), blocks: accounted }
}
