/**
 * **The default-laws account of a realized game: for each law the Sport Profile names, whether it applies, is departed from, does not
 * apply, or is owed an adaptation — once for the game, or once per end line** — H2, 23 October 2026 (the d26 design's build step 2, its
 * section 3.2: *"Check: sport-neutral, after realization, one account per block and per end."*).
 *
 * Christian, reply filed 26 October 2026, item 10: *"Where a normal law cannot apply directly because of the modified field, scoring
 * structure, or game format, the system should identify the relevant adaptation rather than silently assume conventional conditions
 * exist."* *"The governing principle is to inherit established sport rules and explicitly define only the necessary departures."*
 *
 * **Who is checked.** Only a game derived through a provisional realization that declares `defaultLawsCheck` (the build reads it from the
 * realization it received); every other game gains no account and is not checked, so the demonstrations and fixtures are untouched. The
 * strictness is the realization's: ENFORCE refuses an activity owing an adaptation (the build's validation stage, never a fallback: a law
 * owed is a decision of his, not a fact of the session); REPORT says what is owed, to an administrator, and refuses nothing.
 *
 * **How each law is read**, at its place (the game, or one end line):
 *   - NOT_APPLICABLE where one of its `applicableWhen` preconditions is absent, with why; a departure resting on exactly that absence
 *     (`whilePreconditionAbsent`) is cited as what records it;
 *   - otherwise ADAPTATION_OWED where an item departs from it on the absence of a precondition that now HOLDS (the departure's own reason is
 *     false here: the design's X5 - the end-line restarts approved for an end line without an object, kept where one now stands);
 *   - otherwise DEPARTED where an item departs from the whole of it, citing the items and his words;
 *   - otherwise APPLIES where every `requires` precondition holds - nothing is said, and a departure from part of it is cited (the uncovered
 *     part is the law's own, which can apply);
 *   - otherwise ADAPTATION_OWED: a precondition is missing and nothing departs from the whole of it; a departure from part of it is cited.
 * A precondition that cannot be read (UNKNOWN) is never a pass: a law resting on one is owed, saying so. UNREPRESENTED is always absent, so
 * a law resting on it is departed from or owed, never said to apply.
 *
 * **H3, 23 October 2026 (the d26 design's build step 3; register version 21).** The two bound-region predicates are read from the game: a
 * region bound to an object (row S7, the register's boundRegions block) with the function asked for, and the mark its cited pairing gives
 * (the Sport Profile's boundRegions block), so the laws resting on them are evaluated where a game holds such a region (the design: "LAW-12-GK
 * and LAW-14 are evaluated from N2 and N3"). Carried from the H2 review: an object stands at an end line where its realized along ANCHOR is
 * that end (the design's predicate), an object standing off every end line with no anchor is UNKNOWN, and a collection the game holds no
 * readable list of is UNKNOWN, never ABSENT; and each entry carries the law's note from the profile (which decision answers it), so an
 * administrator reading an owed adaptation sees what settles it.
 *
 * Sport-neutral: law ids, object kinds, region functions and performer rows are the profile's data; the rows and leaves are the register's.
 */
import { bindingOf, regionFunctionsOf, SportBoundRegions } from '../derivation/bound-regions'
import { roleHolderNames } from '../derivation/designation'
import { CitedWords, DefaultLaws, DefaultLawsCheck, DefaultLawsCheckMode, departuresOf, LawDeparture, LawPredicate, LawStatus, samePredicate } from '../derivation/default-laws'
import { RegisterIndex } from '../derivation/register'
import { splitPath } from '../derivation/resolved-game'
import { ContractItem, RoleBlock } from '../derivation/types'
import { axisLengths } from './spatial'
import { attackingEndIn } from './team-ends'

/** What a precondition is found to be at one place. */
export type PredicateReading = 'PRESENT' | 'ABSENT' | 'UNKNOWN'

/** A departure as the account cites it: the item, what it covers, why, and his words. */
export interface DepartureCitation {
    item: string
    extent: LawDeparture['extent']
    part: string | null
    because: string
    basis: CitedWords
    whilePreconditionAbsent: LawPredicate | null
}

/** One law at one place, with its status and everything it was read from. */
export interface LawAccountEntry {
    law: string
    cites: string
    name: string
    /** The profile's note on the law (which decision answers it, his words where it quotes them), or null (H3, the H2 review's should-fix 5). */
    note: string | null
    /** Null for the game; for a law accounted for per end line, the end (0 or 1, a fraction of the along axis). */
    end: 0 | 1 | null
    at: string
    status: LawStatus
    why: string
    preconditions: { list: 'applicableWhen' | 'requires'; predicate: LawPredicate; reading: PredicateReading; why: string }[]
    /** Items departing from the whole of the law here (DEPARTED). */
    departedBy: DepartureCitation[]
    /** Items departing from part of it (his "may"): cited beside whatever the rest of it is. */
    departedInPart: DepartureCitation[]
    /** Items departing from it on the absence of a precondition that holds here: their reason is false, so an adaptation is owed. */
    noLongerHolds: DepartureCitation[]
    /** Items departing from it on exactly the absence that makes it NOT_APPLICABLE here. */
    recordedBy: DepartureCitation[]
}

/** One block's account. */
export interface BlockLawAccount {
    blockId: string
    ends: { end: 0 | 1; atM: number | null; defendedBy: string[] }[]
    laws: LawAccountEntry[]
}

/** The account of one activity, for the review evidence (admin only) and, under ENFORCE, the build's refusal. */
export interface DefaultLawsAccount {
    status: 'ACCOUNT_FOR_REVIEW'
    realization: string
    mode: DefaultLawsCheckMode
    check: DefaultLawsCheck
    source: { file: string; source: string; edition: string | null; editionNote: string; authority: DefaultLaws['authority'] }
    blocks: BlockLawAccount[]
    /** Every law owed an adaptation, one sentence per block and place: the refusal's reasons under ENFORCE; reported only under REPORT. */
    owed: string[]
    /** The DRAFT sentence the design holds for the coach, never served by this account (null where no DRAFT wording carries it). */
    heldSentence: { text: string; status: 'DRAFT_HELD_NOT_SERVED'; basis: CitedWords } | null
}

const readAt = (root: unknown, path: string): unknown => path.split('.').reduce<any>((node, key) => (node === null || node === undefined ? undefined : node[key]), root)
const SAME = 1e-9

interface Place {
    end: 0 | 1 | null
    lengthM: number | null
}

interface Reading {
    reading: PredicateReading
    why: string
}

/** One object as the account reads it: its id, kind, realized along anchor and interval (null where it was not placed). */
interface PlacedObject {
    id: string
    kind: unknown
    anchor: number | null
    along: { from: number; to: number } | null
}

/**
 * The objects the game holds, each with its realized along anchor and interval; null where the game holds no readable list of objects (H3,
 * the H2 review's should-fix 3: a collection that cannot be read is UNKNOWN to every reader, never an empty one).
 */
function placedObjects(game: unknown, index: RegisterIndex): PlacedObject[] | null {
    const rows = index.objectGeometry
    if (!rows) return []
    const container = splitPath(String(index.rows.get(rows.row)?.path ?? '')).container
    const objects = container ? readAt(game, container) : undefined
    if (!Array.isArray(objects)) return null
    return objects.map((object: any) => {
        const geometry = readAt(object?.realizedGeometry, rows.alongLeaf) as { anchor?: unknown; interval?: { from?: unknown; to?: unknown } } | undefined
        const from = geometry?.interval?.from
        const to = geometry?.interval?.to
        return {
            id: String(object?.elementId ?? '(no id)'),
            kind: readAt(object, rows.kindLeaf),
            anchor: typeof geometry?.anchor === 'number' && Number.isFinite(geometry.anchor) ? geometry.anchor : null,
            along: typeof from === 'number' && typeof to === 'number' ? { from, to } : null,
        }
    })
}

/**
 * **Whether some of the given objects stand at the end line at `end`** — H3 (the H2 review's should-fix 2): read by the object's realized
 * along ANCHOR, the end line its position is stated from (the design: "an O1 element of that kind whose O4 anchor is that end"), and only
 * where it has none by its realized interval being the one point on that line. An object with neither an anchor nor an interval on an end
 * line cannot be read here, so it is UNKNOWN, never absent: a goal moved 1.5 m into the area with its anchor kept still stands at its end.
 */
function objectsAtEnd(objects: PlacedObject[], what: string, end: 0 | 1, lengthM: number | null): Reading {
    if (!objects.length) return { reading: 'ABSENT', why: `the game holds no ${what}` }
    if (lengthM === null) return { reading: 'UNKNOWN', why: 'the session states no area, so where the end lines lie is not known' }
    const line = end * lengthM
    const onLine = (at: number) => Math.abs(at - line) < SAME
    const onAnyLine = (at: number) => Math.abs(at) < SAME || Math.abs(at - lengthM) < SAME
    const standing = objects.filter(object => (object.anchor !== null ? onLine(object.anchor) : !!object.along && onLine(object.along.from) && onLine(object.along.to)))
    if (standing.length) return { reading: 'PRESENT', why: `${standing.map(object => object.id).join(', ')} stands at the end line at ${line} m` }
    const unread = objects.filter(object => (object.anchor === null ? !object.along || !(onAnyLine(object.along.from) && Math.abs(object.along.from - object.along.to) < SAME) : !onAnyLine(object.anchor)))
    if (unread.length) return { reading: 'UNKNOWN', why: `${unread.map(object => object.id).join(', ')} ${unread.length === 1 ? 'is' : 'are'} placed at no end line by an anchor or a position on the line, so whether ${unread.length === 1 ? 'it stands' : 'they stand'} at this end line cannot be read` }
    return { reading: 'ABSENT', why: `no ${what} stands at the end line at ${line} m (${objects.map(object => `${object.id} at ${object.anchor ?? object.along!.from} m`).join(', ')})` }
}

/** Whether an object of the kind stands at the end line at `end`. */
function objectAtEnd(game: unknown, index: RegisterIndex, kind: string, end: 0 | 1, lengthM: number | null): Reading {
    const objects = placedObjects(game, index)
    if (objects === null) return { reading: 'UNKNOWN', why: 'the game holds no readable list of objects, so whether one stands at this end line cannot be read' }
    return objectsAtEnd(objects.filter(object => object.kind === kind), `object of the kind ${kind}`, end, lengthM)
}

/** The regions with a function that are bound to an object, each with the object it is bound to as the game holds it; null where unreadable. */
function boundRegionsOf(game: unknown, index: RegisterIndex, regionFunction: string): { region: string; object: PlacedObject | null; objectId: string; pairing: string | null }[] | null {
    const spec = index.boundRegions
    if (!spec) return []
    const container = splitPath(spec.path).container
    const regions = container ? readAt(game, container) : undefined
    const objects = placedObjects(game, index)
    if (!Array.isArray(regions) || objects === null) return null
    return regions
        .filter(region => regionFunctionsOf(region, index).includes(regionFunction))
        .map(region => ({ region, binding: bindingOf(region, index) }))
        .filter((entry): entry is { region: any; binding: { objectId: string; pairing: string | null } } => !!entry.binding)
        .map(({ region, binding }) => ({ region: String(region?.elementId ?? '(no id)'), object: objects.find(object => object.id === binding.objectId) ?? null, objectId: binding.objectId, pairing: binding.pairing }))
}

/**
 * **REGION_BOUND_TO_OBJECT {function, kind}** (H3): a region with the function is bound to an object of the kind the game holds - for the
 * game anywhere, and per end line only where that object stands at that end. Read from the register's bound-region rows and the game.
 */
function regionBoundToObject(game: unknown, index: RegisterIndex, predicate: LawPredicate, place: Place): Reading {
    if (!index.boundRegions) return { reading: 'ABSENT', why: 'the register names no row binding a region to an object' }
    const bound = boundRegionsOf(game, index, String(predicate.function))
    if (bound === null) return { reading: 'UNKNOWN', why: `the game holds no readable list of regions or objects, so whether a region with the function ${predicate.function} is bound to an object of the kind ${predicate.kind} cannot be read` }
    const ofKind = bound.filter(entry => entry.object?.kind === predicate.kind)
    if (!ofKind.length) return { reading: 'ABSENT', why: `no region with the function ${predicate.function} is bound to an object of the kind ${predicate.kind}${bound.length ? ` (${bound.map(entry => `${entry.region} is bound to ${entry.objectId}`).join(', ')})` : ''}` }
    const said = ofKind.map(entry => `${entry.region} is bound to ${entry.objectId}`).join(', ')
    if (place.end === null) return { reading: 'PRESENT', why: said }
    const atEnd = objectsAtEnd(ofKind.map(entry => entry.object!), `object of the kind ${predicate.kind} with a region with the function ${predicate.function} bound to it`, place.end, place.lengthM)
    return atEnd.reading === 'PRESENT' ? { reading: 'PRESENT', why: `${said}, and ${atEnd.why}` } : atEnd
}

/**
 * **BOUND_REGION_MARK {function}** (H3): the region with the function bound to an object (at this end line, where the law is accounted for
 * per end) has a pairing that gives a mark, and the realization records the spot. Nothing records a spot, so a pairing giving one still
 * reads ABSENT, saying which pairing gives it and where; a pairing the profile does not hold is UNKNOWN.
 */
function boundRegionMark(game: unknown, index: RegisterIndex, predicate: LawPredicate, place: Place, boundRegions: SportBoundRegions | null): Reading {
    if (!index.boundRegions) return { reading: 'ABSENT', why: 'the register names no row binding a region to an object' }
    const bound = boundRegionsOf(game, index, String(predicate.function))
    if (bound === null) return { reading: 'UNKNOWN', why: `the game holds no readable list of regions or objects, so whether a region with the function ${predicate.function} has a mark cannot be read` }
    let here = bound
    if (place.end !== null) {
        const placed = bound.filter(entry => entry.object)
        here = placed.filter(entry => objectsAtEnd([entry.object!], 'object', place.end!, place.lengthM).reading === 'PRESENT')
        if (!here.length && placed.some(entry => objectsAtEnd([entry.object!], 'object', place.end!, place.lengthM).reading === 'UNKNOWN')) return { reading: 'UNKNOWN', why: `whether a region with the function ${predicate.function} is bound to an object at this end line cannot be read` }
    }
    if (!here.length) return { reading: 'ABSENT', why: `no region with the function ${predicate.function} is bound to an object${place.end === null ? '' : ' at this end line'}, so no pairing gives it a mark` }
    const marks: string[] = []
    for (const entry of here) {
        const pairing = boundRegions?.pairings.find(candidate => candidate.id === entry.pairing)
        if (!pairing) return { reading: 'UNKNOWN', why: `${entry.region} cites the pairing ${JSON.stringify(entry.pairing)}, which the Sport Profile's bound-region block given does not hold, so its mark cannot be read` }
        marks.push(pairing.markM === null ? `${entry.region}'s pairing ${pairing.id} gives no mark` : `${entry.region}'s pairing ${pairing.id} gives a mark at ${pairing.markM} m (${pairing.document}, ${pairing.citedAs})`)
    }
    return { reading: 'ABSENT', why: `${marks.join('; ')}, and no row records the spot the mark is taken from (whether it is marked or paced is not represented)` }
}

/** What one predicate is at one place. Closed: every member of the vocabulary is answered here, and nothing else is. */
function readPredicate(predicate: LawPredicate, game: unknown, index: RegisterIndex, place: Place, boundRegions: SportBoundRegions | null): Reading {
    switch (predicate.predicate) {
        case 'OBJECT_OF_KIND_AT_END': {
            const kind = String(predicate.kind)
            if (place.end !== null) return objectAtEnd(game, index, kind, place.end, place.lengthM)
            // For the game: at either end line.
            const both = [objectAtEnd(game, index, kind, 0, place.lengthM), objectAtEnd(game, index, kind, 1, place.lengthM)]
            const present = both.find(found => found.reading === 'PRESENT')
            if (present) return present
            const unknown = both.find(found => found.reading === 'UNKNOWN')
            return unknown ?? { reading: 'ABSENT', why: both.map(found => found.why).join('; ') }
        }
        case 'SPECIALIZED_PERFORMER_PRESENT': {
            const path = String(index.rows.get(String(predicate.row))?.path ?? '')
            const { container, leaf } = splitPath(path)
            const teams = container ? readAt(game, container) : undefined
            if (!Array.isArray(teams) || !teams.length) return { reading: 'UNKNOWN', why: `the game holds no teams at ${container ?? path}, so whether a performer on ${predicate.row} is present cannot be read` }
            const counts = teams.map((team: any) => readAt(team, leaf))
            if (counts.some(count => typeof count === 'number' && count >= 1)) return { reading: 'PRESENT', why: `a team holds a performer on ${predicate.row} (${path})` }
            if (counts.every(count => typeof count === 'number')) return { reading: 'ABSENT', why: `no team holds a performer on ${predicate.row} (${path})` }
            return { reading: 'UNKNOWN', why: `a team states no count on ${predicate.row} (${path})` }
        }
        case 'REGION_BOUND_TO_OBJECT':
            return regionBoundToObject(game, index, predicate, place)
        case 'BOUND_REGION_MARK':
            return boundRegionMark(game, index, predicate, place, boundRegions)
        case 'UNREPRESENTED':
            return { reading: 'ABSENT', why: `the representation holds no row for it: ${predicate.what}` }
    }
    // Unreachable for a predicate the loader admitted; one it did not is never a pass.
    return { reading: 'UNKNOWN', why: `${JSON.stringify((predicate as { predicate?: unknown }).predicate)} is no predicate of the closed list` }
}

const citationOf = (item: string, departure: LawDeparture): DepartureCitation => ({
    item,
    extent: departure.extent,
    part: departure.part ?? null,
    because: departure.because,
    basis: { words: [...departure.basis.words], citedAs: departure.basis.citedAs },
    whilePreconditionAbsent: departure.whilePreconditionAbsent ? { ...departure.whilePreconditionAbsent } : null,
})

const predicateText = (predicate: LawPredicate): string =>
    `${predicate.predicate}${['kind', 'function', 'row'].filter(key => (predicate as any)[key] !== undefined).map(key => ` ${key}=${(predicate as any)[key]}`).join('')}`

/** The end lines of the area and who defends each in this block (the role holders and setup assignments whose attacking end is the other). */
function endsOf(game: unknown, index: RegisterIndex, roleBlock: RoleBlock | null, lengthM: number | null): BlockLawAccount['ends'] {
    const setup = [...index.designations.resolutions].filter(([, resolution]) => resolution.kind === 'SETUP_ASSIGNMENT').map(([name]) => name)
    const designations = [...roleHolderNames(index), ...setup]
    return ([0, 1] as const).map(end => ({
        end,
        atM: lengthM === null ? null : end * lengthM,
        defendedBy: designations.filter(designation => attackingEndIn(game, index, roleBlock, designation) === (end === 0 ? 1 : 0)),
    }))
}

/** One block's account: every law the profile names, at each of its places, read from the realized game and the items it was derived from. */
export function blockLawAccountOf(input: {
    blockId: string
    game: unknown
    roleBlock: RoleBlock | null
    index: RegisterIndex
    session: { lengthM?: number; widthM?: number }
    laws: DefaultLaws
    items: ContractItem[]
    /** H3: the Sport Profile's bound-region block the build used, whose pairings give a bound region's mark; absent or null: none given. */
    boundRegions?: SportBoundRegions | null
}): BlockLawAccount {
    const { game, index, roleBlock, laws } = input
    const boundRegions = input.boundRegions ?? null
    const lengthM = axisLengths(input.session)?.along ?? null
    const ends = endsOf(game, index, roleBlock, lengthM)
    const departures = input.items.flatMap(item => departuresOf(item).map(departure => ({ item: item.itemId, departure })))
    const entries: LawAccountEntry[] = []
    for (const law of laws.laws) {
        const places: Place[] = law.scope === 'PER_END' ? [{ end: 0, lengthM }, { end: 1, lengthM }] : [{ end: null, lengthM }]
        const own = departures.filter(entry => entry.departure.law === law.id)
        for (const place of places) {
            const read = (list: 'applicableWhen' | 'requires') => (list === 'applicableWhen' ? law.applicableWhen : law.requires).map(predicate => ({ list, predicate, ...readPredicate(predicate, game, index, place, boundRegions) }))
            const applicable = read('applicableWhen')
            const required = read('requires')
            const conditionOf = (departure: LawDeparture): Reading | null => (departure.whilePreconditionAbsent ? readPredicate(departure.whilePreconditionAbsent, game, index, place, boundRegions) : null)
            const holding = own.filter(entry => (conditionOf(entry.departure)?.reading ?? 'ABSENT') === 'ABSENT')
            const failing = own.filter(entry => {
                const condition = conditionOf(entry.departure)
                return condition !== null && condition.reading !== 'ABSENT'
            })
            const endText = place.end === null ? 'the game' : `the end line at ${place.lengthM === null ? (place.end === 0 ? 'the axis start' : 'the axis end') : `${place.end * place.lengthM} m`}${ends[place.end].defendedBy.length ? ` (defended by ${ends[place.end].defendedBy.join(', ')})` : ''}`
            const entry: LawAccountEntry = {
                law: law.id,
                cites: law.cites,
                name: law.name,
                note: law.note,
                end: place.end,
                at: endText,
                status: 'ADAPTATION_OWED',
                why: '',
                preconditions: [...applicable, ...required].map(found => ({ list: found.list, predicate: { ...found.predicate }, reading: found.reading, why: found.why })),
                departedBy: [],
                departedInPart: [],
                noLongerHolds: [],
                recordedBy: [],
            }
            const unknownApplicable = applicable.filter(found => found.reading === 'UNKNOWN')
            const absentApplicable = applicable.filter(found => found.reading === 'ABSENT')
            if (unknownApplicable.length) {
                entry.why = `whether it applies here cannot be read (${unknownApplicable.map(found => found.why).join('; ')}), and insufficient evidence is never a pass`
            } else if (absentApplicable.length) {
                entry.status = 'NOT_APPLICABLE'
                entry.why = absentApplicable.map(found => found.why).join('; ')
                entry.recordedBy = own
                    .filter(found => absentApplicable.some(absent => samePredicate(absent.predicate, found.departure.whilePreconditionAbsent)))
                    .map(found => citationOf(found.item, found.departure))
            } else {
                entry.departedBy = holding.filter(found => found.departure.extent === 'WHOLE').map(found => citationOf(found.item, found.departure))
                entry.departedInPart = holding.filter(found => found.departure.extent === 'PART').map(found => citationOf(found.item, found.departure))
                entry.noLongerHolds = failing.map(found => citationOf(found.item, found.departure))
                const missing = required.filter(found => found.reading !== 'PRESENT')
                const inPart = entry.departedInPart.length ? `; ${entry.departedInPart.map(found => found.item).join(', ')} ${entry.departedInPart.length === 1 ? 'departs' : 'depart'} from part of it` : ''
                const once = (values: string[]) => [...new Set(values)]
                if (failing.length) {
                    entry.why = `${failing.map(found => found.item).join(', ')} ${failing.length === 1 ? 'departs' : 'depart'} from it on the absence of ${once(
                        failing.map(found => predicateText(found.departure.whilePreconditionAbsent!)),
                    ).join(', ')}, which holds here (${once(failing.map(found => conditionOf(found.departure)!.why)).join('; ')}), so ${failing.length === 1 ? 'its reason is' : 'their reason is'} false here${inPart}`
                } else if (entry.departedBy.length) {
                    entry.status = 'DEPARTED'
                    entry.why = `departed from by ${entry.departedBy.map(found => found.item).join(', ')}`
                } else if (!missing.length) {
                    entry.status = 'APPLIES'
                    entry.why = entry.departedInPart.length ? `every precondition holds, and it applies where ${entry.departedInPart.map(found => found.item).join(', ')} does not depart from it` : 'every precondition holds'
                } else {
                    entry.why = `${missing.map(found => found.why).join('; ')}; nothing departs from the whole of it${inPart}`
                }
            }
            entries.push(entry)
        }
    }
    return { blockId: input.blockId, ends, laws: entries }
}

/**
 * **The account of an activity, or null where its realization declares no check** — read from each block's realized game and the composed
 * items of the realization the build received. `owed` holds one sentence per law owed an adaptation, per block and place.
 */
export function defaultLawsAccountOf(input: {
    realization: { provisionalId: string; items: ContractItem[]; defaultLawsCheck?: DefaultLawsCheck } | null | undefined
    laws: DefaultLaws | null
    blocks: { blockId: string; game: unknown; roleBlock: RoleBlock | null }[]
    index: RegisterIndex
    session: { lengthM?: number; widthM?: number }
    heldSentence: DefaultLawsAccount['heldSentence']
    /** H3: the Sport Profile's bound-region block the build used (its pairings give a bound region's mark); absent or null: none given. */
    boundRegions?: SportBoundRegions | null
}): DefaultLawsAccount | null {
    const realization = input.realization
    if (!realization?.defaultLawsCheck || !input.laws) return null
    const laws = input.laws
    const blocks = input.blocks.map(block => blockLawAccountOf({ ...block, index: input.index, session: input.session, laws, items: realization.items, boundRegions: input.boundRegions ?? null }))
    const inBlock = (blockId: string) => (input.blocks.length > 1 ? `block ${blockId}: ` : '')
    const owed = blocks.flatMap(block =>
        block.laws.filter(entry => entry.status === 'ADAPTATION_OWED').map(entry => `${inBlock(block.blockId)}${entry.law} (${entry.cites}) at ${entry.at}: an adaptation is owed - ${entry.why}`),
    )
    return {
        status: 'ACCOUNT_FOR_REVIEW',
        realization: realization.provisionalId,
        mode: realization.defaultLawsCheck.mode,
        check: JSON.parse(JSON.stringify(realization.defaultLawsCheck)),
        source: { file: laws.file, source: laws.source, edition: laws.edition, editionNote: laws.editionNote, authority: JSON.parse(JSON.stringify(laws.authority)) },
        blocks,
        owed,
        heldSentence: input.heldSentence ? JSON.parse(JSON.stringify(input.heldSentence)) : null,
    }
}
