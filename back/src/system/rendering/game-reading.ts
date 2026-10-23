/**
 * **How a built game is read, one way for every reader** — stage 5A of the communication work, 22 October 2026. The readers below were
 * written for the administrator's review evidence (stage K8, `review-evidence.ts`) and are moved here UNCHANGED, so the review evidence
 * and the field diagram (`field-diagram.ts`) read the same game the same way: which elements sit on a register row, where a region lies
 * along the area, which team holds which role and counts what, which objective each team attacks, every transition, and what could
 * restrict a player. His reply filed 22 October 2026, item 1: *"Both levels must derive from the same authorized activity representation,
 * with no contradictions or invented instructions."*
 *
 * Reading only: nothing here decides, says or checks anything, and nothing names a goal, a sport term, a value or a knowledge id. Role
 * names, nouns and rows are data.
 */
import { loadRegister } from '../derivation/corpus'
import { awardeeRelation, roleHolderNames, roleOfHolder } from '../derivation/designation'
import { indexRegister, RegisterIndex } from '../derivation/register'
import { UNBOUNDED_CREDIT } from './render-concrete-game'

/** The register, read once for a reader not handed an index (it is versioned data). Exported for the context-scoring guard (stage A re-review fix). */
let cachedIndex: RegisterIndex | null = null
export const registerIndex = (): RegisterIndex => {
    if (!cachedIndex) cachedIndex = indexRegister(loadRegister())
    return cachedIndex
}

/**
 * **The one reader of how a team scores: the scoring event of a role, or of the game** — stage A, 22 October 2026 (register version 16,
 * row B9 and the `roleScoring` block). Christian, reply filed 25 October 2026, item 2: *"I approve extending the September 15 decision to
 * support one primary scoring event per role in an asymmetric activity, rather than requiring both teams to use the same scoring event
 * type."* Every reader of a scoring event's KIND asks here (the grep ratchet in `role-events.unit.ts`: no other file reads the primary
 * event's kind), so no reader can go on reading the game's primary event for a role that scores by its own.
 *
 *   - `role` null: the game's primary event (V1), at its path;
 *   - a role of the register's role vocabulary: that role element's own event (B9) where the game holds one, else the game's primary
 *     event — a role with no event of its own scores by V1.
 *
 * Returns the kind as the game holds it, the path a sentence saying it cites, and whether it is the role's own. The value (V2) and the
 * conditions (V3) are not read here: every role's event earns V2, and V3 qualifies V1's event only (GA-ROLE-EVENTS clauses 9 and 10).
 * Names no row, kind or role: the paths are the register's.
 */
export function eventKindOf(game: any, role: string | null, index: RegisterIndex = registerIndex()): { kind: unknown; path: string; byRole: boolean } {
    const scoring = index.roleScoring
    const kindRow = scoring ? index.rows.get(scoring.kindRow) : null
    const primaryPath = kindRow ? genericOf(String(kindRow.path)) : PRIMARY_KIND_PATH
    const primary = { kind: readPath(game, primaryPath), path: primaryPath, byRole: false }
    const spec = index.roleBlocks
    if (role === null || !scoring || !spec) return primary
    const element = membersAt(game, index, spec.rolesRow).find(member => member?.[spec.roleAttribute] === role)
    const own = element?.[scoring.eventLeaf]
    if (!element || own === undefined || own === null) return primary
    return { kind: own, path: `${container(index, spec.rolesRow)}[${element.elementId}].${scoring.eventLeaf}`, byRole: true }
}

/** The game's primary event's kind, where a register written before version 16 names no row for it. */
const PRIMARY_KIND_PATH = 'value.primaryEvent.kind'

/** The game's role elements, each with the role it is (the register's roles row and role attribute); empty for a game with no roles. */
export function roleElementsOf(game: any, index: RegisterIndex = registerIndex()): { elementId: string; role: string; element: any }[] {
    const spec = index.roleBlocks
    if (!spec) return []
    return membersAt(game, index, spec.rolesRow)
        .filter(member => typeof member?.[spec.roleAttribute] === 'string')
        .map(member => ({ elementId: String(member.elementId), role: String(member[spec.roleAttribute]), element: member }))
}

/**
 * **Every path a sentence may cite to say how a team scores** (stage A): the game's primary event's kind, and each role's own event where
 * the game holds one. Read through `eventKindOf`, for the checks that ask whether a sentence is a scoring sentence (fidelity Q2).
 */
export function eventKindPathsOf(game: any, index: RegisterIndex = registerIndex()): string[] {
    return [...new Set([eventKindOf(game, null, index).path, ...roleElementsOf(game, index).map(({ role }) => eventKindOf(game, role, index).path)])]
}

/** One block's game, as the readers need it (a game not played in blocks is one block with no holders). */
export interface GameBlock {
    blockId: string
    /** Role → the end-assigned team designation holding it in this block. Empty for a game with no roles. */
    holders: Record<string, string>
    fixture: any
}

/** A fact read from the game: what it is, and its value. */
export interface GameFact {
    what: string
    value: unknown
}

export interface TransitionRow {
    blockId: string
    elementId: string
    trigger: string | null
    lastTouch: string | null
    playState: unknown
    awardedTo: unknown
    awardedToRole: string | null
    actor: unknown
    location: unknown
    method: unknown
    startsEpisode: boolean
    /** Read from the begin condition's arms; the authority is the episode gate's verdict in the structural report. */
    beginsConditionedEpisode: boolean
    /** The roles whose credit, confined to an episode (row B8), this transition begins (stage M3, design step L7). */
    beginsCredit: string[]
    /** The roles whose credit, confined to an episode, this transition ends: it begins another episode (stage M3). */
    endsCredit: string[]
}

/* ------------------------------------------------------------------ reading the game ------------------------------------------------------------------ */

interface Segment {
    key: string
    /** Absent: no bracket. Empty string: every member (`[]`). Otherwise the member whose elementId it is. */
    id?: string
}

/** A game path split at its keys; ids may hold dots, so brackets are read whole. */
export function segmentsOf(path: string): Segment[] {
    const out: Segment[] = []
    let key = ''
    for (let i = 0; i < path.length; i++) {
        const ch = path[i]
        if (ch === '[') {
            const close = path.indexOf(']', i)
            out.push({ key, id: path.slice(i + 1, close) })
            key = ''
            i = close
            if (path[i + 1] === '.') i++
        } else if (ch === '.') {
            if (key) out.push({ key })
            key = ''
        } else key += ch
    }
    if (key) out.push({ key })
    return out
}

/** The value at a game path: one value, or every member's for a path through `[]`. */
export function readPath(root: any, path: string): unknown {
    let nodes: any[] = [root]
    let many = false
    for (const segment of segmentsOf(path)) {
        nodes = nodes.flatMap(node => {
            const value = node == null ? undefined : node[segment.key]
            if (segment.id === undefined) return [value]
            if (!Array.isArray(value)) return []
            if (segment.id === '') {
                many = true
                return value
            }
            return value.filter(member => String(member?.elementId) === segment.id)
        })
    }
    return many ? nodes : nodes[0]
}

/** A path with every member id taken out: the register's spelling (`transitions[].placement.actor`). */
export const genericOf = (path: string): string => segmentsOf(path).map(s => (s.id === undefined ? s.key : `${s.key}[]`)).join('.')

export const truthy = (value: unknown): boolean => value === true || value === 'true'
export const asList = (value: unknown): any[] => (Array.isArray(value) ? value : [])
export const container = (index: RegisterIndex, rowId: string): string | null => {
    const path = index.rows.get(rowId)?.path
    return path ? genericOf(String(path)).replace(/\[\]$/, '') : null
}
export const membersAt = (game: any, index: RegisterIndex, rowId: string): any[] => {
    const at = container(index, rowId)
    return at ? asList(readPath(game, at)) : []
}
export const along = (element: any, leaf = 'position'): { from: number; to: number } | null => element?.realizedGeometry?.[leaf]?.along?.interval ?? element?.realizedGeometry?.[leaf]?.interval ?? null

/** The team holding each role in a block, and each team's counts by the register's own leaves. */
export function teamsOf(block: GameBlock, index: RegisterIndex): { handle: string; designation: string | null; role: string | null; counts: Record<string, number>; total: number }[] {
    const game = block.fixture?.game ?? {}
    const bindings = asList(block.fixture?.record?.designationBindings) as { designation: string; handle: string }[]
    const outfieldLeaf = String(index.rows.get('P2')?.path ?? '').split('[].').pop() ?? ''
    const leaves = [outfieldLeaf, ...index.specializedRoleRows.values()].filter(Boolean)
    return membersAt(game, index, 'P1').map(team => {
        const designation = bindings.find(b => b.handle === team?.elementId)?.designation ?? null
        const role = Object.entries(block.holders).find(([, holder]) => holder === designation)?.[0] ?? null
        const counts = Object.fromEntries(leaves.map(leaf => [leaf, typeof team?.[leaf] === 'number' ? team[leaf] : 0]))
        return { handle: String(team?.elementId), designation, role, counts, total: Object.values(counts).reduce((n, v) => n + v, 0) }
    })
}

/** The objectives that score (the register's targetOf role), each with its team, the role the team holds, and its region. */
/**
 * **The element an objective scores at, typed** — 23 October 2026 (stage B, register version 17). Register J2 is *"object or region
 * reference"*: a region of the regions collection (S2) or an object of the objects collection (the register's `objectGeometry.row`), by
 * the id the game holds it under. Null where the reference names neither. Read by the field diagram (its targets and D7).
 */
export interface ObjectiveTarget {
    kind: 'region' | 'object'
    id: string
}

/**
 * Each objective of a block's game: its team, the role that team holds, and what it scores at. `regionId` is the referenced element's id
 * (a region's or an object's, as it always was) and `region` the region it names, or null; `target` (stage B) says which of the two it is.
 */
export function objectivesOf(block: GameBlock, index: RegisterIndex): { elementId: string; team: string; role: string | null; regionId: string | null; region: any; target: ObjectiveTarget | null }[] {
    const game = block.fixture?.game ?? {}
    const spec = index.targetOf
    const regions = membersAt(game, index, 'S2')
    const objects = index.objectGeometry ? membersAt(game, index, index.objectGeometry.row) : []
    return membersAt(game, index, spec?.objectivesRow ?? 'J1').map(objective => {
        const team = String(objective?.[spec?.teamLeaf ?? 'team'])
        const ref = objective?.[spec?.referenceLeaf ?? 'reference']?.structuralRef
        const regionId = ref ? `c:${ref.contractId}:${ref.itemId}` : null
        const region = regions.find(r => r?.elementId === regionId) ?? null
        const object = region ? null : (objects.find(o => o?.elementId === regionId) ?? null)
        const target: ObjectiveTarget | null = region ? { kind: 'region', id: regionId! } : object ? { kind: 'object', id: regionId! } : null
        return { elementId: String(objective?.elementId), team, role: Object.entries(block.holders).find(([, holder]) => holder === team)?.[0] ?? null, regionId, region, target }
    })
}

/** The designation a role is held under (ROLE_HOLDER_<role>, read from the register), or null. */
export const holderOf = (index: RegisterIndex, role: string): string | null => roleHolderNames(index).find(name => roleOfHolder(index, name) === role) ?? null

/** The items a game path rests on, as the fixture records them, with each one's basis and where he said it. */
export function supportOf(block: GameBlock, path: string, items: Map<string, any>): { item: string; basis: string | null; citedAs: string | null }[] {
    return (block.fixture?.status?.derived ?? [])
        .filter((derived: any) => derived?.path === path)
        .flatMap((derived: any) => asList(derived.support))
        .filter((support: any) => support?.kind === 'CONTRACT_ITEM')
        .map((support: any) => {
            const item = items.get(`${support.contractId}::${support.itemId}`)
            return { item: `${support.contractId}::${support.itemId}`, basis: item?.basis ? String(item.basis) : null, citedAs: item?.citedAs ? String(item.citedAs) : null }
        })
}

/** A transition's selector terms as the gate reads them (attribute -> value), qualifiers included. */
export const termsOf = (transition: any): Record<string, unknown> => Object.fromEntries(asList(transition?.selector).filter(term => term?.op === '=').map(term => [String(term.attribute), term.value]))

/**
 * **A role's scoring credit, and where it is confined to an episode, what begins, ends and keeps it** — stage M3, 17 October 2026
 * (design step L7). Christian, reply filed 19 October 2026, item 1: *"If the building team loses possession, that scoring opportunity
 * ends. If it subsequently regains possession, play may continue, but the original build-out scoring opportunity is not restored."*;
 * item 6: *"please proceed with the review-page activity, provided its actual scoring eligibility matches the approved distinction
 * between an active build-out and subsequent possession regains."* Read from the block's game as GA-EPISODE-REACHABLE's clauses 4 and
 * 5 read its classes, and never instead of them: the gate's verdict is the authority and is shown beside these facts.
 *
 *   - begins: a restart (play stops and resumes) that begins an episode and is taken by an arm of the begin condition of the episode
 *     the bound names (the condition whose referents begin that episode);
 *   - ends: a change of possession that begins an episode, and any other restart that begins one;
 *   - keeps: a restart that begins none, awarded to the role's holder (`awardeeRelation` HOLDER);
 *   - notEnded: a change of possession that begins no episode, or a restart that begins none and is not shown to be the holder's.
 *
 * Null where the role holds no element; `bounded` false where its bound is absent or the whole game.
 */
export function creditOf(block: GameBlock, index: RegisterIndex, role: string, items: Map<string, any>) {
    const spec = index.roleBlocks
    const game = block.fixture?.game ?? {}
    if (!spec) return null
    const element = membersAt(game, index, spec.rolesRow).find(member => member?.[spec.roleAttribute] === role)
    if (!element) return null
    const leaf = String(index.rows.get('B8')?.path ?? '').split('[].').pop() ?? ''
    const path = `${container(index, spec.rolesRow)}[${element.elementId}].${leaf}`
    const creditedWithin = element?.[leaf] ?? null
    const bounded = creditedWithin !== null && creditedWithin !== UNBOUNDED_CREDIT
    const facts = { element: String(element.elementId), path, creditedWithin, support: supportOf(block, path, items), bounded, begins: [] as string[], ends: [] as string[], keeps: [] as string[], notEnded: [] as { elementId: string; why: string }[] }
    if (!bounded) return facts
    const holder = holderOf(index, role)
    const takers = new Set(membersAt(game, index, 'V3').filter(condition => condition?.referents?.beginsEpisodeOf === creditedWithin).flatMap(condition => asList(condition?.referents?.arms).filter(arm => arm?.takenBy !== undefined).map(arm => String(arm.takenBy))))
    const teamCount = membersAt(game, index, 'P1').length || null
    for (const transition of membersAt(game, index, 'T1')) {
        const id = String(transition?.elementId)
        const terms = termsOf(transition)
        const starts = truthy(transition?.startsEpisode)
        if (terms.trigger === 'POSSESSION_CHANGE') {
            if (starts) facts.ends.push(id)
            else facts.notEnded.push({ elementId: id, why: 'a change of possession that begins no episode' })
            continue
        }
        if (String(transition?.playState) !== 'STOP_RESUME') continue
        if (starts) {
            if (takers.has(String(transition?.placement?.actor))) facts.begins.push(id)
            else facts.ends.push(id)
            continue
        }
        const relation = holder ? awardeeRelation(index, transition?.awardedTo, terms, holder, teamCount) : 'UNDETERMINED'
        if (relation === 'HOLDER') facts.keeps.push(id)
        else facts.notEnded.push({ elementId: id, why: `a restart that begins no episode, awarded ${relation === 'OTHER' ? 'away from the holder' : 'to a team not shown to be the holder'}` })
    }
    return facts
}

/** Every transition of a block as a row: who, where, how, and whether it begins the episode the conditions are scoped to. */
export function transitionsOf(block: GameBlock, index: RegisterIndex): TransitionRow[] {
    const game = block.fixture?.game ?? {}
    const beginArms = membersAt(game, index, 'V3').flatMap(condition => asList(condition?.referents?.arms).map(arm => ({ arm, episode: condition?.referents?.beginsEpisodeOf })))
    const credits = Object.keys(block.holders).map(role => ({ role, credit: creditOf(block, index, role, new Map()) })).filter(entry => entry.credit?.bounded)
    return membersAt(game, index, 'T1').map(transition => {
        const trigger = asList(transition?.selector).find(term => term?.attribute === 'trigger')?.value ?? null
        const awarded = transition?.awardedTo
        const actor = transition?.placement?.actor
        const starts = truthy(transition?.startsEpisode)
        return {
            blockId: block.blockId,
            elementId: String(transition?.elementId),
            trigger: trigger === null ? null : String(trigger),
            lastTouch: transition?.qualifiers?.lastTouch ? String(transition.qualifiers.lastTouch) : null,
            playState: transition?.playState ?? null,
            awardedTo: awarded ?? null,
            awardedToRole: awarded ? roleOfHolder(index, awarded) : null,
            actor: actor ?? null,
            location: transition?.placement?.region ?? null,
            method: transition?.placement?.method ?? null,
            startsEpisode: starts,
            beginsConditionedEpisode: starts && String(transition?.playState) === 'STOP_RESUME' && beginArms.some(({ arm }) => arm?.takenBy !== undefined && arm.takenBy === actor),
            beginsCredit: credits.filter(entry => entry.credit!.begins.includes(String(transition?.elementId))).map(entry => entry.role),
            endsCredit: credits.filter(entry => entry.credit!.ends.includes(String(transition?.elementId))).map(entry => entry.role),
        }
    })
}

/** The game's elements on the rows that would restrict where or when a player may play, counted. */
export function restrictionsOf(game: any, index: RegisterIndex): GameFact[] {
    const count = (rowId: string) => membersAt(game, index, rowId).length
    const accessRegions = membersAt(game, index, 'S2').filter(region => asList(region?.functions).includes('access')).map(region => String(region.elementId))
    const eligibility = membersAt(game, index, 'V3').filter(condition => condition?.type === 'eligibility').map(condition => String(condition.elementId))
    return [
        { what: 'action restrictions (R1: a rule changing whether an otherwise available action or target is eligible)', value: count('R1') },
        { what: 'consequences (V11, including an ACCESS effect, V13)', value: count('V11') },
        { what: 'time windows (V23)', value: count('V23') },
        { what: 'value modifiers (V7)', value: count('V7') },
        { what: 'information rules (V15)', value: count('V15') },
        { what: 'objective sets (J5)', value: count('J5') },
        { what: 'regions with the access function (S4)', value: accessRegions },
        { what: 'primary-event conditions of type eligibility (V4)', value: eligibility },
    ]
}
