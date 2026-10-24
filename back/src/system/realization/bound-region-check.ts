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
 */
import { bindingOf, BoundRegionPairing, BoundRegionRequirement, regionFunctionsOf, SportBoundRegions } from '../derivation/bound-regions'
import { RegisterIndex } from '../derivation/register'
import { splitPath } from '../derivation/resolved-game'
import { teamEndPositionOf } from '../derivation/types'
import { axisLengths } from './spatial'

export const BOUND_REGION_CHECK = 'GA-BOUND-REGION'

/** Why the game's bound regions do not hold, one closed cause each, with the facts a sentence is made from (the builder never reads `why`). */
export type BoundRegionRefusal =
    | { cause: 'BOUND_REGION_NOT_AUTHORIZED'; kind: string; regionFunction: string; widthM: number | null; why: string }
    | { cause: 'BOUND_REGION_DOES_NOT_FIT'; kind: string; regionFunction: string; widthM: number; pairing: string; why: string }
    | { cause: 'BOUND_REGION_INVALID'; problems: string[]; why: string }

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
    requirement: BoundRegionRequirement
    widthM: number | null
    pairings: BoundRegionPairing[]
}

function subjectsOf(read: Read, block: SportBoundRegions, envelope: unknown, index: RegisterIndex): Subject[] {
    const found: Subject[] = []
    for (const requirement of block.requirements) {
        for (const object of read.objects) {
            if (readAt(object, read.kindLeaf) !== requirement.object.kind) continue
            const id = String(object.elementId ?? '(no id)')
            const defended = isDefended(object, read)
            const holdsOne = read.regions.some(region => bindingOf(region, index)?.objectId === id && regionFunctionsOf(region, index).includes(requirement.region.function))
            if (!defended && !holdsOne) continue
            const widthM = statedWidthOf(envelope, requirement.object.kind)
            const pairings = block.pairings.filter(entry => entry.object.kind === requirement.object.kind && entry.region.function === requirement.region.function && widthM !== null && Math.abs(entry.object.widthM - widthM) < SAME)
            found.push({ object, id, kind: requirement.object.kind, defended, requirement, widthM, pairings })
        }
    }
    return found
}

const pairingsText = (block: SportBoundRegions, requirement: BoundRegionRequirement): string => {
    const entries = block.pairings.filter(entry => entry.object.kind === requirement.object.kind && entry.region.function === requirement.region.function)
    return entries.length ? entries.map(entry => `${entry.id} for a ${entry.object.kind} ${entry.object.widthM} m wide (${entry.document}, ${entry.citedAs})`).join('; ') : 'none'
}

/**
 * **The check before realization**, on the resolved game: authorization first, then the bindings, then the fit (see the module note). Null
 * where it holds, or where the register or the profile names no bound region (then nothing is read).
 */
export function boundRegionRefusalBefore(index: RegisterIndex, game: unknown, envelope: unknown, block: SportBoundRegions | null): BoundRegionRefusal | null {
    const spec = index.boundRegions
    const read = readGame(index, game)
    if (!spec || !read || !block || !block.requirements.length) return null
    const subjects = subjectsOf(read, block, envelope, index)
    // 1. Authorization: one authorized pairing for each object held, as the session states it.
    for (const entry of subjects) {
        if (entry.pairings.length === 1) continue
        const fn = entry.requirement.region.function
        const what = entry.defended ? `${entry.id} is a defended ${entry.kind}` : `${entry.id} is a ${entry.kind} no team defends, holding a ${fn} region,`
        const why =
            entry.pairings.length === 0
                ? `${what}${entry.widthM === null ? ' whose width the session does not state' : ` ${entry.widthM} m wide as the session states it`}, and no authorized pairing of the Sport Profile gives a ${fn} region for it (its pairings for the kind: ${pairingsText(block, entry.requirement)}); which ${fn} region goes with it is a knowledge decision nobody has made, so none is borrowed from another entry and none is clipped`
                : `${what} ${entry.widthM} m wide, and ${entry.pairings.length} authorized pairings give a ${fn} region for it (${entry.pairings.map(p => p.id).join(', ')}); which applies is not decided`
        return { cause: 'BOUND_REGION_NOT_AUTHORIZED', kind: entry.kind, regionFunction: fn, widthM: entry.widthM, why: `${BOUND_REGION_CHECK}: ${why}` }
    }
    // 2. The bindings, whatever the session.
    const problems: string[] = []
    const functionsBound = new Set(block.requirements.map(requirement => requirement.region.function))
    const objectOf = (id: string) => read.objects.find(object => object.elementId === id)
    for (const region of read.regions) {
        const regionId = String(region.elementId ?? '(no id)')
        const binding = bindingOf(region, index)
        const served = regionFunctionsOf(region, index).filter(fn => functionsBound.has(fn))
        if (binding && !served.length) problems.push(`${regionId} is bound to ${binding.objectId} (${spec.ofObjectRow}) and serves no function the Sport Profile binds to an object`)
        for (const fn of served) {
            const kinds = block.requirements.filter(requirement => requirement.region.function === fn).map(requirement => requirement.object.kind)
            if (!binding) {
                problems.push(`${regionId} serves ${fn}, which the Sport Profile binds to an object of the kind ${kinds.join(' or ')}, and is bound to none (${spec.ofObjectRow})`)
                continue
            }
            const object = objectOf(binding.objectId)
            const kind = object ? String(readAt(object, read.kindLeaf)) : null
            if (!object) problems.push(`${regionId} is bound to ${binding.objectId}, which the game holds as no object`)
            else if (!kinds.includes(String(kind))) problems.push(`${regionId} serves ${fn} and is bound to ${binding.objectId}, an object of the kind ${kind}; the Sport Profile binds ${fn} only to ${kinds.join(' or ')}`)
        }
    }
    for (const entry of subjects) {
        const { requirement } = entry
        const fn = requirement.region.function
        const bound = read.regions.filter(region => bindingOf(region, index)?.objectId === entry.id && regionFunctionsOf(region, index).includes(fn))
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
        const cited = bindingOf(region, index)!.pairing
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
    return null
}

/**
 * **The check after realization**, on the concrete game: each object it holds (defended, or holding a bound region) stands on an end line, and its bound region
 * lies from that end line into the area exactly as deep and as wide as its pairing says, centred on the object, inside the touchlines. Null
 * where it holds (or where nothing is required); the bindings and the authorization were held before realization, so this reads geometry.
 */
export function boundRegionRefusalAfter(index: RegisterIndex, game: unknown, envelope: unknown, block: SportBoundRegions | null): BoundRegionRefusal | null {
    const spec = index.boundRegions
    const read = readGame(index, game)
    const axes = axisLengths((envelope ?? {}) as { lengthM?: number; widthM?: number })
    if (!spec || !read || !block || !block.requirements.length) return null
    const problems: string[] = []
    const intervalAt = (element: unknown, leaf: string): { from: number; to: number } | null => {
        const interval = (readAt(element, `realizedGeometry.${leaf}`) as { interval?: { from?: unknown; to?: unknown } } | undefined)?.interval
        return interval && typeof interval.from === 'number' && typeof interval.to === 'number' ? { from: interval.from, to: interval.to } : null
    }
    for (const entry of subjectsOf(read, block, envelope, index)) {
        const pairing = entry.pairings[0]
        if (!pairing || !axes) {
            problems.push(`${entry.id} could not be read against an authorized pairing and the session's area after realization`)
            continue
        }
        const fn = entry.requirement.region.function
        const region = read.regions.find(candidate => bindingOf(candidate, index)?.objectId === entry.id && regionFunctionsOf(candidate, index).includes(fn))
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

/** One bound region as the review evidence shows it: the region, what it serves, the object it is bound to, the pairing, where it lies. */
export interface BoundRegionBinding {
    region: string
    noun: string | null
    functions: string[]
    object: string
    kind: string | null
    defendedBy: string | null
    pairing: BoundRegionPairing | null
    along: { from: number; to: number } | null
    across: { from: number; to: number } | null
}

/** The bound regions of an activity, for the administrator's review evidence only; null where no game holds one. */
export interface BoundRegionAccount {
    status: 'ACCOUNT_FOR_REVIEW'
    check: typeof BOUND_REGION_CHECK
    source: { file: string; authority: SportBoundRegions['authority'] }
    requirements: BoundRegionRequirement[]
    blocks: { blockId: string; bindings: BoundRegionBinding[] }[]
}

/** The account of the games as built: every region bound to an object in each, with the pairing it cites as the profile holds it. */
export function boundRegionAccountOf(index: RegisterIndex, blocks: { blockId: string; game: unknown }[], block: SportBoundRegions | null): BoundRegionAccount | null {
    const spec = index.boundRegions
    if (!spec || !block) return null
    const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
    const accounted = blocks.map(({ blockId, game }) => {
        const read = readGame(index, game)
        const bindings: BoundRegionBinding[] = []
        for (const region of read?.regions ?? []) {
            const binding = bindingOf(region, index)
            if (!binding || !read) continue
            const object = read.objects.find(candidate => candidate.elementId === binding.objectId)
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
                object: binding.objectId,
                kind: object ? String(readAt(object, read.kindLeaf)) : null,
                defendedBy: typeof defended === 'string' ? defended : null,
                pairing: pairing ? copy(pairing) : null,
                along: interval(spec.alongLeaf),
                across: interval(spec.acrossLeaf),
            })
        }
        return { blockId, bindings }
    })
    if (!accounted.some(entry => entry.bindings.length)) return null
    return { status: 'ACCOUNT_FOR_REVIEW', check: BOUND_REGION_CHECK, source: { file: block.file, authority: copy(block.authority) }, requirements: copy(block.requirements), blocks: accounted }
}
