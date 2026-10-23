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
 * Sport-neutral: law ids, object kinds, region functions and performer rows are the profile's data; the rows and leaves are the register's.
 */
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

/** The objects of a kind the game holds, each with its realized along interval (null where it was not placed). */
function objectsOfKind(game: unknown, index: RegisterIndex, kind: string): { id: string; along: { from: number; to: number } | null }[] {
    const rows = index.objectGeometry
    if (!rows) return []
    const container = splitPath(String(index.rows.get(rows.row)?.path ?? '')).container
    const objects = container ? readAt(game, container) : undefined
    if (!Array.isArray(objects)) return []
    return objects
        .filter((object: any) => readAt(object, rows.kindLeaf) === kind)
        .map((object: any) => {
            const interval = readAt(object?.realizedGeometry, rows.alongLeaf) as { interval?: { from?: unknown; to?: unknown } } | undefined
            const from = interval?.interval?.from
            const to = interval?.interval?.to
            return { id: String(object?.elementId ?? '(no id)'), along: typeof from === 'number' && typeof to === 'number' ? { from, to } : null }
        })
}

/** Whether an object of the kind stands on the end line at `end` (its realized along interval the one point on that line). */
function objectAtEnd(game: unknown, index: RegisterIndex, kind: string, end: 0 | 1, lengthM: number | null): Reading {
    const objects = objectsOfKind(game, index, kind)
    if (!objects.length) return { reading: 'ABSENT', why: `the game holds no object of the kind ${kind}` }
    if (lengthM === null) return { reading: 'UNKNOWN', why: 'the session states no area, so where the end lines lie is not known' }
    const line = end * lengthM
    const standing = objects.filter(object => object.along && Math.abs(object.along.from - line) < SAME && Math.abs(object.along.to - line) < SAME)
    if (standing.length) return { reading: 'PRESENT', why: `${standing.map(object => object.id).join(', ')} stands on the end line at ${line} m` }
    const unplaced = objects.filter(object => !object.along)
    if (unplaced.length) return { reading: 'UNKNOWN', why: `${unplaced.map(object => object.id).join(', ')} was not placed, so whether it stands on this end line cannot be read` }
    return { reading: 'ABSENT', why: `no object of the kind ${kind} stands on the end line at ${line} m (${objects.map(object => `${object.id} at ${object.along!.from}-${object.along!.to} m`).join(', ')})` }
}

/** What one predicate is at one place. Closed: every member of the vocabulary is answered here, and nothing else is. */
function readPredicate(predicate: LawPredicate, game: unknown, index: RegisterIndex, place: Place): Reading {
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
            return {
                reading: 'ABSENT',
                why: `no region with the function ${predicate.function} is bound to an object of the kind ${predicate.kind}: no register row binds a region to an object yet (the d26 design's N2, build step 3)`,
            }
        case 'BOUND_REGION_MARK':
            return { reading: 'ABSENT', why: `no authorized pairing gives the region with the function ${predicate.function} a mark: no pairing table exists yet (the d26 design's N3, build step 3)` }
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
export function blockLawAccountOf(input: { blockId: string; game: unknown; roleBlock: RoleBlock | null; index: RegisterIndex; session: { lengthM?: number; widthM?: number }; laws: DefaultLaws; items: ContractItem[] }): BlockLawAccount {
    const { game, index, roleBlock, laws } = input
    const lengthM = axisLengths(input.session)?.along ?? null
    const ends = endsOf(game, index, roleBlock, lengthM)
    const departures = input.items.flatMap(item => departuresOf(item).map(departure => ({ item: item.itemId, departure })))
    const entries: LawAccountEntry[] = []
    for (const law of laws.laws) {
        const places: Place[] = law.scope === 'PER_END' ? [{ end: 0, lengthM }, { end: 1, lengthM }] : [{ end: null, lengthM }]
        const own = departures.filter(entry => entry.departure.law === law.id)
        for (const place of places) {
            const read = (list: 'applicableWhen' | 'requires') => (list === 'applicableWhen' ? law.applicableWhen : law.requires).map(predicate => ({ list, predicate, ...readPredicate(predicate, game, index, place) }))
            const applicable = read('applicableWhen')
            const required = read('requires')
            const conditionOf = (departure: LawDeparture): Reading | null => (departure.whilePreconditionAbsent ? readPredicate(departure.whilePreconditionAbsent, game, index, place) : null)
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
}): DefaultLawsAccount | null {
    const realization = input.realization
    if (!realization?.defaultLawsCheck || !input.laws) return null
    const laws = input.laws
    const blocks = input.blocks.map(block => blockLawAccountOf({ ...block, index: input.index, session: input.session, laws, items: realization.items }))
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
