/**
 * **The field diagram as a model, and the check that it agrees with Coach Details** — stage 5A of the communication work, 22 October 2026.
 * The model and its check are the administrator's (`ServedActivity.diagramDraft`); since stage 5B every viewer is served the diagram a
 * coach reads, composed from this model and held to it (`coach-diagram.ts`, `ServedActivity.diagram`), and the page draws it.
 *
 * His reply filed 22 October 2026, item 1, puts *"a simple diagram"* in the Coach Overview; item 7: *"I appreciate that the prototype draws
 * from stored activity data and refuses to invent missing positions or geometry."*, *"For coach-facing terminology, I prefer: Marked line /
 * Target zone"*, *"Please avoid depicting fixed player formations or passing patterns when the activity does not authorize them."* and
 * *"Please ensure the diagram reflects whichever block is being viewed without introducing contradictions."* His reply filed 23 October
 * 2026, item 5, refines it, and governs here wherever it differs from anything earlier:
 *
 *   - Goals: *"The diagram should draw goals only when the authorized activity representation includes them. It should never assume their
 *     existence or invent their dimensions or placement."* The register holds physical objects (O1-O5: a kind, a count, a position along
 *     and across); an object the game positions is drawn where its realized position is held, at the size held, once a served sentence
 *     says it. An objective may score at an object rather than a region: that target is read from the object's realized position exactly
 *     as a region's is (its place, the end it touches for the attacking direction, what each marked zone is), and Set up must say it. An
 *     object a target references, or one the game positions, without a realized position withholds the diagram rather than being placed
 *     by guess. No kind of object is named here. (Realization places no object today, so none is drawn yet.)
 *   - Target zones: *"I'd prefer that target zones use a consistent, visually recognizable color [...] rather than different colors based on
 *     which team attacks them. The diagram should distinguish team identity from scoring-area identity."* and *"the display still needs to
 *     distinguish physical target markings from whichever zones are active scoring objectives in the current block."* So the model keeps
 *     three things apart: the MARKINGS (what is on the ground), the TARGETS active in the block viewed (one kind of thing, whichever team
 *     attacks it, with that team named only as `attackedBy`), and what each marked zone is in that block (`markedZones`: the target, inside
 *     a target, or only marked). Team identity is carried by the teams: noun, counts, attacking direction and starting area.
 *   - Block-specific information: *"I would prefer that each block's diagram emphasize its active objectives while retaining any physical
 *     markings that will be used later."* Each block carries its own targets and the markings on the ground in that block; no word names
 *     another block (the check refuses one).
 *   - Missing data: *"missing information prevents rendering only when a required visual relationship cannot be represented faithfully.
 *     An unspecified [specialized-role] starting point, for example, should not prevent the system from drawing an otherwise valid field
 *     with authorized team starting areas. The system must never invent missing spatial information."* (his role noun bracketed, as the
 *     coupling ratchet keeps a sport's nouns out of this layer). REQUIRED: the area, the markings Set up says to mark, each block's active
 *     targets, each team's attacking direction, every starting area the game authorizes for a team (a group that is a registered team
 *     designation or a block role: one no team of the block holds cannot be drawn without inventing whose it is), and every object it
 *     positions. Anything else is not drawn, with a note for the administrator: a restart location, individual positions, an unplaced
 *     object, and where any group that is not a team starts (a role within a team, an individual, neutral players; register P9, *"team
 *     designation or role"*), whether or not the game specifies it, since the model draws no individual's position (D8). A required
 *     relationship that cannot be read whole withholds the diagram, never the activity.
 *   - *"The diagram should not prescribe formations, passing patterns, or movement solutions that the activity does not authorize."* The
 *     model has no field for a player, a position inside an area, a path or a movement; the check refuses one (D8).
 *
 * **The model** is in metres along the area's length (`along`, 0 at one end line) and across its width, every element citing the game paths
 * it is read from: the area (the session's numbers, as the game holds them); the markings — the physical layout where every block's
 * markings are set out once (`physical-layout.ts`, his reply filed 23 October 2026, item 2), else each block's own, as its Set up sentences
 * mark them; per block, the active targets, what each marked zone is, the teams (their DRAFT nouns, their counts from `teamCountPhrases`,
 * the Players sentence's own builder, their starting areas and the end each attacks), and the dimensions a sentence states. The starting
 * configuration only: no adjustment is drawn.
 *
 * **Words** (his reply filed 22 October 2026, item 7, and the stage's rule): his two terms, "marked line" and "target zone"; DRAFT diagram
 * words from one table (`DIAGRAM_WORDS`); or a noun a served sentence already carries with its status (a role's DRAFT noun, a count as the
 * Players sentence says it). Never a data key, a designation or an actor value.
 *
 * **Team identity and roles** (stage C2, his reply filed 24 October 2026, item 4: *"For colors, I would generally prefer stable team
 * identities, with building and pressing roles identified separately. If Team A is blue in Block 1, it should ordinarily remain blue in
 * Block 2, even though its responsibilities change. However, the current activity also reassigns a [specialized role] and one outfield
 * player between teams, so please check how best to represent that clearly. My priority is that a coach can distinguish team identity,
 * assigned role, and attacking direction without confusion."*; his role noun bracketed, as above). Each team carries the realized team it
 * is (`handle`, its element of the game's teams, the same team in every block, and `position`, its place among them), so its look follows
 * the physical team, never the role it holds in a block. Where a team's noun (its role's) does not stay with it across the blocks, every team is named by a DRAFT neutral label
 * in the realized team order (`label`, "Team A", "Team B": the knowledge holds no team names, so nothing else could name one), and the
 * noun stays its role in the block. What changes between the blocks for each team is drawn as each block's counts, and said once per block
 * (`exchanges`): the performers the recorded reassignments move to the team that newly holds a role, from the team that held it in the
 * block the exchange is called from, in the words of the served Role exchange sentence that says them. No movement path or position.
 *
 * **The agreement check** (`checkFieldDiagram`, D1-D8, D10) holds the model to the served Coach Details, block by block, reading the game again
 * rather than taking the builder's word: the area; every drawn region cited (markings and targets by Set up, starting areas by the sentence
 * that says where the teams start), and every team's authorized starting area drawn; the markings exactly what Set up says to mark; every
 * number the game's own value at its path and stated by a sentence citing that path; each block's roles (D5: the served role-block account
 * and the model's holders are both built from the same block holders, so of D5's comparisons only the one with the game's own record,
 * `record.roleBlock.holders`, is independent of the builder); every word allowed; each arrow toward the end its own target touches;
 * nothing the standard leaves out; and (D10, stage C2) each team the realized team it says, at its place, in every block, its label the
 * one its place gives, and what moves at each exchange exactly what the recorded reassignments, the served Role exchange sentence and each
 * block's counts state. Any finding withholds the diagram only, with the reasons for the administrator; the activity is served exactly as
 * without it.
 *
 * Nothing here names a goal, a role, a sport term or a value: every number comes from the game, every word from the table or a served sentence.
 */
import { isRegisteredDesignation, roleOfHolder } from '../derivation/designation'
import { Reassignment, reassignmentsIn } from '../derivation/reassignment'
import { RegisterIndex } from '../derivation/register'
import { splitPath } from '../derivation/resolved-game'
import { asList, GameBlock, objectivesOf, readPath, teamsOf, transitionsOf } from './game-reading'
import { layoutLeafNumberAt, MARK_UNION_ONCE, PhysicalLayout } from './physical-layout'
import { Binding, gameReadingOf, Instruction, ROLE_EXCHANGE, teamCountPhrases } from './render-concrete-game'
import type { ActivitySession } from './session-envelope'

/**
 * **Every word the diagram may write that no served sentence carries.** His terms, reply filed 22 October 2026, item 7: *"For coach-facing
 * terminology, I prefer: Marked line / Target zone"*. Every other word is DRAFT, awaiting his approval: the block's name for the block
 * switcher (his reply filed 23 October 2026, item 5: *"A Block 1 / Block 2 view would be useful if it can be implemented simply."*), the
 * unit after a dimension, the legend's name for a starting area, and (polish pass P7, 22 October 2026) the word set before a target line's
 * own noun, read from the game (`targetLineWords`: a line a team scores at, "target line" where the game calls it a line), so the legend
 * can say what a green line is. Stage C2 (his reply filed 24 October 2026, item 4), all DRAFT: the word before a team's neutral label
 * (`team`, "Team", then a letter for its place among the realized teams), and the legend's three words where teams are labelled: what a team
 * colour is, what the role badge is, and what an arrow is.
 */
export const DIAGRAM_WORDS = {
    his: { markedLine: 'marked line', targetZone: 'target zone' },
    draft: {
        block: 'Block',
        metres: 'm',
        startingArea: 'starting area',
        target: 'target',
        team: 'Team',
        teamColour: 'team colour, kept in every block',
        role: 'role in this block',
        attack: 'attacking direction',
    },
} as const

/** The letters a team's neutral label takes, in the realized team order (DRAFT); a team beyond them has none. */
const TEAM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** **A team's neutral label** (stage C2, DRAFT): "Team" and the letter of its place among the realized teams, or null past the letters. */
export const teamLabelText = (position: number): string | null =>
    Number.isInteger(position) && position >= 0 && position < TEAM_LETTERS.length ? `${DIAGRAM_WORDS.draft.team} ${TEAM_LETTERS[position]}` : null

/**
 * **The words for a target that is a line** (polish pass P7, DRAFT): the line's own noun as the game holds it, with the DRAFT word "target"
 * before it, said once ("target zone" is how Set up and his term say a zone; a noun that already begins with it is kept as it is). Null
 * where the game holds no noun for it: nothing is composed in its place.
 */
export const targetLineWords = (noun: unknown): string | null => {
    if (typeof noun !== 'string' || !noun.trim()) return null
    return noun.toLowerCase().startsWith(DIAGRAM_WORDS.draft.target) ? noun : `${DIAGRAM_WORDS.draft.target} ${noun}`
}

const SET_UP = 'Set up'
const PLAYERS = 'Players'

export interface Interval {
    from: number
    to: number
}

/** A word the diagram writes: his term, a DRAFT diagram word, or a noun a served sentence carries (`carriedBy`, also DRAFT wording). */
export interface DiagramWord {
    text: string
    status: 'HIS_TERM' | 'DRAFT'
    carriedBy: { section: string; text: string } | null
}

/** A line on the ground: across the area at a place along it, or along it at a place across. */
export interface DiagramLine {
    elementId: string
    along: Interval
    across: Interval
    /** The line the Details call "the marked line" (`gameReadingOf` `markedLines`), labelled with his term. */
    markedLine: boolean
    label: DiagramWord | null
    cites: string[]
}

/** A marked zone on the ground: its outline is marked; what it is in a block is that block's `markedZones`. */
export interface DiagramZone {
    elementId: string
    along: Interval
    across: Interval
    cites: string[]
}

export interface DiagramMarkings {
    lines: DiagramLine[]
    zones: DiagramZone[]
}

/** A physical object the game positions, at its realized position and size. */
export interface DiagramObject {
    elementId: string
    along: Interval
    across: Interval
    label: DiagramWord | null
    cites: string[]
}

/** A target active in the block viewed: one kind of thing whichever team attacks it (`attackedBy` names the team, never its look). */
export interface DiagramTarget {
    objective: string
    /** The element the objective scores at: a region, or a physical object the game holds (then also drawn among the block's objects). */
    region: string
    attackedBy: string
    along: Interval
    across: Interval
    line: boolean
    /** The marked zone it is exactly, if it is one. */
    markedZone: string | null
    label: DiagramWord | null
    cites: string[]
}

/** What a marked zone is in the block viewed: a target, inside a target, or only marked (a zone used in another block). */
export interface DiagramZoneState {
    zone: string
    state: 'TARGET' | 'INSIDE_TARGET' | 'MARKED'
    /** The team whose target it is, or lies inside. */
    of: string | null
}

/** A count as the Players sentence says it, with the number's binding (`team`: its position in `performers.teams`, or null for all). */
export interface DiagramCount {
    word: DiagramWord
    bindings: Binding[]
    team: number | null
}

export interface DiagramStart {
    placement: string
    along: Interval
    across: Interval
    timing: string | null
    cites: string[]
}

export interface DiagramAttack {
    /** The end line the team attacks: 0 or the area's length, along. */
    end: number
    target: string
    objective: string
    cites: string[]
}

export interface DiagramTeam {
    /** The role the team holds in the block, or its designation where it holds none. */
    key: string
    role: string | null
    designation: string | null
    /** Stage C2: the realized team it is (its element of the game's teams), the same team in every block, whatever role it holds. */
    handle: string
    /** Stage C2: its place among the game's teams (0 for the first), the same in every block; its look and label follow it. */
    position: number
    /**
     * Stage C2: its DRAFT neutral label ("Team A", by `position`) where some team's noun does not stay with it across the blocks, so the noun
     * alone cannot say which team it is; null otherwise (the noun names it, as before).
     */
    label: DiagramWord | null
    noun: DiagramWord | null
    counts: DiagramCount[]
    start: DiagramStart | null
    attacks: DiagramAttack[]
}

/**
 * **What moves at the exchange into a block** (stage C2): the performers the recorded reassignments move to the team that holds `toRole` in
 * this block (`to`, a realized team), from the team that held it in the block the exchange is called from (`from`, `fromBlock`), as the served
 * Role exchange sentence says them (`moving`, `noun`; each count bound to its reassignment). No movement path or position.
 */
export interface DiagramExchange {
    toRole: string
    to: string
    from: string
    fromBlock: string
    moving: DiagramWord
    /** How many performers move, together (the verb's number). */
    total: number
    /** The noun of the role they join, as the same sentence says it. */
    noun: DiagramWord
    bindings: Binding[]
    cites: string[]
}

export type DimensionKind = 'AREA_LENGTH' | 'AREA_WIDTH' | 'ZONE_DEPTH' | 'LINE_OFFSET'

/** A dimension rail: from, to, along or across; the number it states, the game path it is the value of, and its label. */
export interface DiagramDimension {
    kind: DimensionKind
    axis: 'along' | 'across'
    from: number
    to: number
    quantity: number
    path: string
    /** The zone or line it measures, or null for the area. */
    of: string | null
    label: DiagramWord
}

export interface DiagramBlock {
    blockId: string
    /** "Block n" where there are blocks (DRAFT), naming this block only; null for a game not played in blocks. */
    label: DiagramWord | null
    holders: Record<string, string>
    markings: DiagramMarkings
    objects: DiagramObject[]
    targets: DiagramTarget[]
    markedZones: DiagramZoneState[]
    teams: DiagramTeam[]
    dimensions: DiagramDimension[]
    /** Stage C2: what moves at the exchange into this block, one per role the performers join; none for a game not played in blocks. */
    exchanges: DiagramExchange[]
}

export interface FieldDiagram {
    units: 'm'
    area: { lengthM: number; widthM: number; cites: string[] }
    /** True where every block's markings are set out once (the physical layout): each block then carries the same markings. */
    markingsSetOutOnce: boolean
    /** Counts said for every team together (teams not told apart by role; neutral players), as the Players sentence says them. */
    counts: DiagramCount[]
    blocks: DiagramBlock[]
    /** The words a legend may show: his terms where the diagram uses them, and the DRAFT name of a starting area. */
    legend: DiagramWord[]
}

/**
 * The rules a model is held to. D0: a required relationship that cannot be read whole (the model is not built). D1 the area; D2 every drawn
 * region cited; D3 the markings exactly what Set up says to mark, and each marked zone's state; D4 every number; D5 the roles each block's
 * teams hold; D6 every word; D7 every attacking direction; D8 nothing the standard leaves out. D9 (stage 5B, `coach-diagram.ts`): the
 * diagram a coach is served says only what the checked model says, in coach words, with no data key, id or path in any of them. D10 (stage
 * C2): each team is the realized team it says, at its place, the same in every block, labelled as its place gives where labels are needed,
 * and what moves at each exchange is what the reassignments, the served Role exchange sentence and the blocks' counts state.
 */
export type DiagramRule = 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10'

export interface DiagramFinding {
    rule: DiagramRule
    blockId: string | null
    what: string
}

/**
 * **The diagram as an administrator reviews it** (stage 5A). `verdict` DRAWN where the model was built and agrees with Coach Details in
 * every block; WITHHELD otherwise, with every finding. The model is kept where it was built, so a withheld diagram shows what disagreed.
 * `notes` say what is not drawn and why (an optional element the game does not place). `served` (stage 5B, `coach-diagram.ts`
 * `diagramForServing`): true where the coach's diagram was composed from the model and passed D9, and every viewer is served it; false
 * otherwise (`fieldDiagramDraftOf` alone serves nothing, so it says false).
 */
export interface FieldDiagramDraft {
    served: boolean
    verdict: 'DRAWN' | 'WITHHELD'
    diagram: FieldDiagram | null
    findings: DiagramFinding[]
    notes: string[]
}

/** What the diagram is read from: the session, each block's game with its own Details, the Details a coach is served, the role-block account. */
export interface DiagramInput {
    session: Pick<ActivitySession, 'lengthM' | 'widthM'>
    games: (GameBlock & { rendered: Instruction[] })[]
    served: Instruction[]
    /** The served role-block account's blocks (`ServedActivity.roleBlocks.blocks`), or null for a game not played in blocks. */
    roleBlocks: { blockId: string; holders: Record<string, string> }[] | null
    index: RegisterIndex
}

/* ------------------------------------------------------------------ reading ------------------------------------------------------------------ */

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
const intervalOf = (value: any): Interval | null => (value && finite(value.from) && finite(value.to) && value.from <= value.to ? { from: value.from, to: value.to } : null)
const geometryAt = (fixture: any, path: string): any => asList(fixture?.status?.geometry).find(entry => entry?.path === path)?.geometry ?? null
const intervalAt = (fixture: any, path: string): Interval | null => intervalOf(geometryAt(fixture, path)?.interval)
const regionPaths = (id: string) => ({ noun: `space.regions[${id}].noun`, along: `space.regions[${id}].position.along`, across: `space.regions[${id}].position.across` })
const objectPaths = (id: string) => ({ noun: `objects[${id}].kind`, along: `objects[${id}].position.along`, across: `objects[${id}].position.across` })
const isObjectOf = (fixture: any, id: string): boolean => asList(fixture?.game?.objects).some(object => String(object?.elementId) === id)
/** A region's noun as the game holds it (`space.regions[<id>].noun`), or undefined; an object is no region. */
const regionNounOf = (fixture: any, id: string): unknown => (isObjectOf(fixture, id) ? undefined : asList(fixture?.game?.space?.regions).find(region => String(region?.elementId) === id)?.noun)
/** Where a target's place is read: a physical object's paths where the objective references an object the game holds (O1-O5), else a region's. */
const placePaths = (fixture: any, id: string) => (isObjectOf(fixture, id) ? objectPaths(id) : regionPaths(id))
/** Whether a sentence path says a target's place: a region by its noun; an object by its kind or its position. */
const saysPlaceOf = (fixture: any, id: string) => {
    const paths = placePaths(fixture, id)
    return (path: string): boolean => path === paths.noun || (isObjectOf(fixture, id) && (path === paths.along || path === paths.across))
}
/**
 * Whether a start placement's group names a team (register P9, *"team designation or role"*): a registered team designation (RC-22's list)
 * or a role of the register's block roles. Any other group (a role within a team, an individual, neutral players) is not a team.
 */
const namesTeam = (index: RegisterIndex, group: unknown): boolean => isRegisteredDesignation(index, group) || (index.roleBlocks?.roles ?? []).includes(String(group))
const same = (a: Interval, b: Interval): boolean => a.from === b.from && a.to === b.to
const within = (inner: Interval, outer: Interval): boolean => outer.from <= inner.from && inner.to <= outer.to
const isLine = (along: Interval, across: Interval): boolean => along.from === along.to || across.from === across.to
const bindingsOf = (instruction: Instruction): Binding[] => (instruction.parts ?? []).flatMap(part => part.bindings ?? [])
const refId = (ref: any): string | null => (ref && typeof ref.contractId === 'string' && typeof ref.itemId === 'string' ? `c:${ref.contractId}:${ref.itemId}` : null)
/** The one end line an interval along the length touches, or null where it touches neither or both. */
const touchedEnd = (span: Interval, lengthM: number): number | null => {
    const ends = [...(span.from === 0 ? [0] : []), ...(span.to === lengthM ? [lengthM] : [])]
    return ends.length === 1 ? ends[0] : null
}
const otherEnd = (end: number, lengthM: number): number => (end === 0 ? lengthM : 0)
const his = (text: string): DiagramWord => ({ text, status: 'HIS_TERM', carriedBy: null })
const draft = (text: string): DiagramWord => ({ text, status: 'DRAFT', carriedBy: null })
const carried = (text: string, by: Instruction | undefined): DiagramWord => ({ text, status: 'DRAFT', carriedBy: by ? { section: by.section, text: by.text } : null })
const metresWord = (quantity: number): DiagramWord => draft(`${quantity} ${DIAGRAM_WORDS.draft.metres}`)
const blockWord = (ordinal: number): DiagramWord => draft(`${DIAGRAM_WORDS.draft.block} ${ordinal}`)
const playersSentenceOf = (rendered: Instruction[]): Instruction | undefined => rendered.find(i => i.section === PLAYERS && i.from.includes('envelope.players'))
/** A Set up sentence's cited regions, by id (`space.regions[<id>].noun`), in the order first cited. */
const regionsCitedBy = (instructions: Instruction[]): string[] => {
    const found: string[] = []
    for (const instruction of instructions) {
        for (const path of instruction.from) {
            if (!path.startsWith('space.regions[') || !path.endsWith('].noun')) continue
            const id = path.slice('space.regions['.length, path.length - '].noun'.length)
            if (!found.includes(id)) found.push(id)
        }
    }
    return found
}
/**
 * Where a Set up sentence states a region's extent as limits the coach chooses within, not a value: it cites the region's position and
 * binds a limit (REQUIRED_LIMIT) to a position (a sentence saying several regions at once binds the limits to the first one's path).
 */
const statedAsLimit = (instructions: Instruction[], id: string): boolean => {
    const paths = regionPaths(id)
    return instructions.some(
        instruction =>
            (instruction.from.includes(paths.along) || instruction.from.includes(paths.across)) &&
            bindingsOf(instruction).some(binding => binding.as === 'REQUIRED_LIMIT' && binding.path.startsWith('space.regions[') && binding.path.includes('].position.')),
    )
}
/** Whether a sentence of these states this number for this path: it cites the path and binds the number. */
const stated = (instructions: Instruction[], path: string, quantity: number): boolean => instructions.some(instruction => instruction.from.includes(path) && bindingsOf(instruction).some(binding => binding.quantity === quantity))

/** Where a game holds its reassignments (the register's reassignment row's collection), or null where the register has none. */
const reassignmentsAt = (index: RegisterIndex): string | null => {
    const path = index.reassignment ? index.rows.get(index.reassignment.row)?.path : undefined
    return path ? (splitPath(String(path)).container ?? String(path)) : null
}
/** The game path of a reassignment's count, as a sentence binds it. */
const reassignmentCountPath = (index: RegisterIndex, at: string, id: string): string => `${at}[${id}].${index.reassignment?.countLeaf ?? 'count'}`
/** The leaf of a team element a performer row counts (`performers.teams[].<leaf>`). */
const performerLeafOf = (index: RegisterIndex, row: string): string => String(index.rows.get(row)?.path ?? '').split('[].').pop() ?? row
/** A realized team's count at a leaf, in this game, or null. */
const teamCountAt = (fixture: any, handle: string, leaf: string): number | null => {
    const value = asList(fixture?.game?.performers?.teams).find(team => String(team?.elementId) === handle)?.[leaf]
    return finite(value) ? value : null
}
/** The reassignments a game holds, grouped by the role the performers join, in the order the roles first appear. */
const reassignmentsByRole = (found: Reassignment[]): [string, Reassignment[]][] => {
    const groups = new Map<string, Reassignment[]>()
    for (const entry of found) groups.set(entry.toRole, [...(groups.get(entry.toRole) ?? []), entry])
    return [...groups.entries()]
}
/**
 * The block an exchange into block `i` is called from: the one before it, and for the first the last — with two blocks, the other one.
 * Which block is played first is the coach's (`FIRST_BLOCK_BASIS`, INFERRED) and the coach calls every exchange ("When you call the next
 * block"), so the first block shown is entered by an exchange too whenever it is called again.
 */
const calledFrom = (i: number, blocks: number): number => (i + blocks - 1) % blocks

/** The role a team or role-holder designation names in this game, or null: a block's holders, then the role-holder names. */
function roleNamedBy(fixture: any, index: RegisterIndex, holders: Record<string, string>, designation: unknown): string | null {
    const name = String(designation)
    return Object.entries(holders).find(([, holder]) => holder === name)?.[0] ?? fixture?.roleNouns?.holders?.[name] ?? roleOfHolder(index, name) ?? null
}

/* ------------------------------------------------------------------ the model ------------------------------------------------------------------ */

/**
 * **The model, or what it cannot represent** (D0, each a required relationship that cannot be read whole), with the administrator's notes.
 * Read from the games only; every word from the table or a served sentence of the block.
 */
export function buildFieldDiagram(input: DiagramInput): { diagram: FieldDiagram | null; gaps: DiagramFinding[]; notes: string[] } {
    const gaps: DiagramFinding[] = []
    const notes: string[] = []
    const gap = (blockId: string | null, what: string) => gaps.push({ rule: 'D0', blockId, what })
    const { games, index } = input
    if (!games.length) return { diagram: null, gaps: [{ rule: 'D0', blockId: null, what: 'there is no game to draw' }], notes }
    const first = games[0].fixture
    const lengthM = Number(first?.game?.envelope?.area?.length_m)
    const widthM = Number(first?.game?.envelope?.area?.width_m)
    if (!(lengthM > 0) || !(widthM > 0)) return { diagram: null, gaps: [{ rule: 'D0', blockId: null, what: 'the game holds no area to draw (envelope.area)' }], notes }
    const area = { lengthM, widthM, cites: ['envelope.area.length_m', 'envelope.area.width_m'] }

    // The markings set out once: only where every block carries the same physical layout.
    const layouts = games.map(game => (game.fixture?.layout?.policy === MARK_UNION_ONCE ? (game.fixture.layout as PhysicalLayout) : null))
    const setOutOnce = games.length > 1 && layouts.every(Boolean)
    if (!setOutOnce && layouts.some(Boolean)) gap(null, 'some blocks carry the markings set out once and some do not, so no one set of markings can be drawn')
    if (setOutOnce && layouts.some(layout => JSON.stringify(layout) !== JSON.stringify(layouts[0]))) gap(null, 'the blocks carry different layouts of the markings set out once')

    const blocks: DiagramBlock[] = []
    games.forEach((game, i) => {
        const fixture = game.fixture
        const blockId = game.blockId
        const rendered = game.rendered
        const setUp = rendered.filter(instruction => instruction.section === SET_UP)
        const reading = gameReadingOf(fixture)
        const rectAt = (paths: { along: string; across: string }): { along: Interval; across: Interval } | null => {
            const along = intervalAt(fixture, paths.along)
            const across = intervalAt(fixture, paths.across)
            return along && across ? { along, across } : null
        }
        const rect = (id: string) => rectAt(regionPaths(id))

        // ── The markings ─────────────────────────────────────────────────────────────────────
        const markings: DiagramMarkings = { lines: [], zones: [] }
        const layout = setOutOnce ? layouts[i] : null
        if (layout) {
            for (const mark of layout.marks) {
                const marked = mark.line !== null && reading.markedLines.has(mark.line)
                markings.lines.push({
                    elementId: mark.elementId,
                    along: { from: mark.at, to: mark.at },
                    across: { from: 0, to: widthM },
                    markedLine: marked,
                    label: marked ? his(DIAGRAM_WORDS.his.markedLine) : null,
                    cites: [`layout.marks[${mark.elementId}].at`, ...(mark.line ? [regionPaths(mark.line).along] : []), 'envelope.area.width_m'],
                })
            }
            for (const zone of layout.zones) {
                markings.zones.push({ elementId: zone.elementId, along: { from: zone.from, to: zone.to }, across: { from: 0, to: widthM }, cites: [`layout.zones[${zone.elementId}].depthM`, `layout.marks[${zone.inner}].at`, 'envelope.area.width_m'] })
            }
        } else {
            for (const id of regionsCitedBy(setUp)) {
                const shape = rect(id)
                if (!shape) {
                    gap(blockId, `${id}, which Set up says to mark, holds no realized position along and across the area`)
                    continue
                }
                if (statedAsLimit(setUp, id)) {
                    gap(blockId, `${id}: Set up states its extent as limits the coach chooses within, so drawing it at one size would state a size the activity does not fix`)
                    continue
                }
                const paths = regionPaths(id)
                if (isLine(shape.along, shape.across)) {
                    const marked = reading.markedLines.has(id)
                    markings.lines.push({ elementId: id, along: shape.along, across: shape.across, markedLine: marked, label: marked ? his(DIAGRAM_WORDS.his.markedLine) : null, cites: [paths.noun, paths.along, paths.across] })
                } else markings.zones.push({ elementId: id, along: shape.along, across: shape.across, cites: [paths.noun, paths.along, paths.across] })
            }
        }
        for (const entry of [...markings.lines, ...markings.zones]) {
            if (entry.along.from < 0 || entry.along.to > lengthM || entry.across.from < 0 || entry.across.to > widthM) gap(blockId, `${entry.elementId} lies outside the area`)
        }

        // ── Physical objects: drawn where the game positions them; never placed by guess ────────────────
        const objects: DiagramObject[] = []
        const objectiveRefs = new Set(asList(fixture?.game?.objectives).map(objective => refId(objective?.reference?.structuralRef)).filter((id): id is string => !!id))
        const unplaced: string[] = []
        for (const object of asList(fixture?.game?.objects)) {
            const id = String(object?.elementId)
            const paths = objectPaths(id)
            const along = intervalAt(fixture, paths.along)
            const across = intervalAt(fixture, paths.across)
            if (along && across) {
                const by = rendered.find(instruction => instruction.from.includes(paths.noun) && typeof object?.kind === 'string' && instruction.text.includes(object.kind))
                objects.push({ elementId: id, along, across, label: by ? carried(String(object.kind), by) : null, cites: [paths.along, paths.across] })
            } else if (object?.position !== undefined || objectiveRefs.has(id)) {
                gap(blockId, `the object ${id} is ${objectiveRefs.has(id) ? 'a target' : 'positioned by the game'} and holds no realized position, so it cannot be drawn without inventing where it is`)
            } else unplaced.push(`${id}${typeof object?.kind === 'string' ? ` (${object.kind})` : ''}`)
        }
        if (i === 0 && unplaced.length) notes.push(`not drawn: ${unplaced.join(', ')}, which the game holds with no position in the area`)

        // ── The teams, their counts and the roles they hold ──────────────────────────────────────────
        const counts = teamCountPhrases(fixture)
        const players = playersSentenceOf(rendered)
        const roleOrder = Object.keys(game.holders)
        const rank = (role: string | null) => (role && roleOrder.includes(role) ? roleOrder.indexOf(role) : roleOrder.length)
        // Each team in the block's role order (as the Players sentence says them), keeping its position in `performers.teams`.
        const teams: DiagramTeam[] = teamsOf(game, index)
            .map((team, teamIndex) => ({ team, teamIndex }))
            .sort((a, b) => rank(a.team.role) - rank(b.team.role) || a.teamIndex - b.teamIndex)
            .map(({ team, teamIndex }) => {
                const role = team.role
                const key = role ?? team.designation ?? team.handle
                const nounText = role ? reading.roleNounOf[role] ?? null : null
                const phrase = counts.byRole ? counts.teams.find(entry => entry.team === teamIndex) : undefined
                // The noun as a served sentence carries it: the Players sentence, which says each team's counts by it, else the first that says it.
                const carrier = nounText ? (players && players.text.includes(nounText) ? players : rendered.find(instruction => instruction.text.includes(nounText))) : undefined
                return {
                    key,
                    role,
                    designation: team.designation,
                    handle: team.handle,
                    position: teamIndex,
                    label: null,
                    noun: nounText ? carried(nounText, carrier) : null,
                    counts: (phrase?.segments ?? []).map(segment => ({ word: carried(segment.text, players), bindings: segment.bindings.map(binding => ({ ...binding })), team: teamIndex })),
                    start: null,
                    attacks: [],
                }
            })
        const teamFor = (designation: unknown): DiagramTeam | undefined => {
            const named = String(designation)
            const role = roleNamedBy(fixture, index, game.holders, named)
            return teams.find(team => team.designation === named) ?? (role ? teams.find(team => team.role === role) : undefined)
        }

        // ── The targets active in this block, and each team's attacking direction ────────────────────
        const targets: DiagramTarget[] = []
        for (const objective of objectivesOf(game, index)) {
            const team = teamFor(objective.team)
            if (!team) {
                gap(blockId, `the objective ${objective.elementId} is attacked by ${objective.team}, which is no team of the game`)
                continue
            }
            // The target's place: a region's, or a physical object's where the objective references one (read the same way).
            const regionId = objective.regionId
            const paths = regionId ? placePaths(fixture, regionId) : null
            const shape = paths ? rectAt(paths) : null
            if (!regionId || !paths || !shape) {
                gap(blockId, `the target ${regionId ?? '(no region)'} of the objective ${objective.elementId} holds no realized position along and across the area, so the ${team.key} target cannot be drawn`)
                continue
            }
            const end = touchedEnd(shape.along, lengthM)
            if (end === null) {
                gap(blockId, `the ${team.key} target ${regionId} (${shape.along.from}-${shape.along.to} m) does not touch exactly one end line, so no attacking direction can be drawn without inventing one`)
                continue
            }
            const line = isLine(shape.along, shape.across)
            const objectivePaths = [`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`]
            // Polish pass P7: a line target is named by its own noun, as the game holds it, after the DRAFT word "target"; none without one.
            const lineWords = line ? targetLineWords(regionNounOf(fixture, regionId)) : null
            targets.push({
                objective: objective.elementId,
                region: regionId,
                attackedBy: team.key,
                along: shape.along,
                across: shape.across,
                line,
                markedZone: markings.zones.find(zone => same(zone.along, shape.along) && same(zone.across, shape.across))?.elementId ?? null,
                label: line ? (lineWords ? draft(lineWords) : null) : his(DIAGRAM_WORDS.his.targetZone),
                cites: [...objectivePaths, paths.noun, paths.along, paths.across],
            })
            team.attacks.push({ end, target: regionId, objective: objective.elementId, cites: objectivePaths })
        }
        for (const team of teams) if (!team.attacks.length) notes.push(`block ${blockId}: the ${team.key} team attacks no target, so it has no attacking direction`)

        // What each marked zone is in this block: the target, inside a target, or only marked.
        const markedZones: DiagramZoneState[] = markings.zones.map(zone => {
            const exact = targets.find(target => same(target.along, zone.along) && same(target.across, zone.across))
            const around = exact ? undefined : targets.find(target => within(zone.along, target.along) && within(zone.across, target.across))
            return { zone: zone.elementId, state: exact ? 'TARGET' : around ? 'INSIDE_TARGET' : 'MARKED', of: (exact ?? around)?.attackedBy ?? null }
        })

        // ── The starting areas the game authorizes ──────────────────────────────────────────────────
        for (const placement of asList(fixture?.game?.performers?.startPlacement)) {
            const id = String(placement?.elementId)
            const team = teamFor(placement?.group)
            const regionPath = `performers.startPlacement[${id}].region`
            if (!team) {
                // A team's starting area that no team of this block holds cannot be drawn without inventing whose it is. Any other group
                // (a role within a team, an individual, neutral players) is not drawn, specified or not (his reply filed 23 October 2026,
                // item 5: an unspecified [specialized-role] starting point "should not prevent the system from drawing an otherwise valid
                // field with authorized team starting areas"); the model draws no individual's position (D8).
                if (namesTeam(index, placement?.group)) gap(blockId, `the starting area ${id} is for ${placement?.group}, a team designation no team of this block holds, so it cannot be drawn without inventing whose it is`)
                else notes.push(`block ${blockId}: not drawn: where ${String(placement?.group)} starts (${id}); only team starting areas are drawn`)
                continue
            }
            if (team.start) {
                gap(blockId, `the ${team.key} team has more than one starting area`)
                continue
            }
            const region = placement?.region
            const direct = refId(region?.structuralRef)
            const realized = geometryAt(fixture, regionPath)
            let shape: { along: Interval; across: Interval; cites: string[] } | null = null
            if (direct) {
                const read = rect(direct)
                shape = read ? { ...read, cites: [regionPaths(direct).along, regionPaths(direct).across] } : null
            } else if (realized && realized.axis === 'along' && intervalOf(realized.interval) && refId(region?.of?.structuralRef)) {
                // A starting area stated as the part of the area beyond a marked reference: along as realized, across as wide as that reference.
                const referent = refId(region.of.structuralRef)!
                const across = intervalAt(fixture, regionPaths(referent).across)
                shape = across ? { along: intervalOf(realized.interval)!, across, cites: [regionPaths(referent).across] } : null
            }
            if (!shape) {
                gap(blockId, `the ${team.key} team's starting area (${id}) cannot be read along and across the area, so it cannot be drawn without inventing it`)
                continue
            }
            team.start = { placement: id, along: shape.along, across: shape.across, timing: typeof placement?.timing === 'string' ? placement.timing : null, cites: [`performers.startPlacement[${id}].group`, regionPath, ...shape.cites] }
        }
        for (const team of teams) if (!team.start) notes.push(`block ${blockId}: no starting area is authorized for the ${team.key} team, so none is drawn`)

        // ── The dimensions a sentence states ────────────────────────────────────────────────────────
        const dimensions: DiagramDimension[] = [
            { kind: 'AREA_LENGTH', axis: 'along', from: 0, to: lengthM, quantity: lengthM, path: 'envelope.area.length_m', of: null, label: metresWord(lengthM) },
            { kind: 'AREA_WIDTH', axis: 'across', from: 0, to: widthM, quantity: widthM, path: 'envelope.area.width_m', of: null, label: metresWord(widthM) },
        ]
        for (const zone of markings.zones) {
            if (touchedEnd(zone.along, lengthM) === null) continue
            const depth = zone.along.to - zone.along.from
            const path = layout ? `layout.zones[${zone.elementId}].depthM` : regionPaths(zone.elementId).along
            if (stated(rendered, path, depth)) dimensions.push({ kind: 'ZONE_DEPTH', axis: 'along', from: zone.along.from, to: zone.along.to, quantity: depth, path, of: zone.elementId, label: metresWord(depth) })
        }
        for (const region of asList(fixture?.game?.space?.regions)) {
            const id = String(region?.elementId)
            if (!reading.markedLines.has(id)) continue
            const value = region?.position?.along
            const offset = value?.offsetM
            const at = intervalAt(fixture, regionPaths(id).along)
            const owner = teamFor(value?.forTeam)
            const attacked = owner?.attacks.length === 1 ? owner.attacks[0].end : null
            if (!at || !offset || offset.from !== offset.to) {
                gap(blockId, `the marked line ${id} is not held at one distance from one team's end line`)
                continue
            }
            if (attacked === null) {
                gap(blockId, `the marked line ${id} is measured from the end line of ${String(value?.forTeam)}, whose end cannot be read from the target it attacks`)
                continue
            }
            const ownEnd = otherEnd(attacked, lengthM)
            if (Math.abs(at.from - ownEnd) !== offset.from) {
                gap(blockId, `the marked line ${id} is at ${at.from} m, not ${offset.from} m from the ${owner!.key} team's end line, where the game says it is`)
                continue
            }
            const path = regionPaths(id).along
            if (stated(rendered, path, offset.from)) dimensions.push({ kind: 'LINE_OFFSET', axis: 'along', from: Math.min(ownEnd, at.from), to: Math.max(ownEnd, at.from), quantity: offset.from, path, of: id, label: metresWord(offset.from) })
        }
        if (layout) {
            // The layout's marks are the blocks' own edges (RB-L): the marked line where the block's geometry puts it.
            for (const line of markings.lines.filter(entry => entry.markedLine)) {
                const mark = layout.marks.find(entry => entry.elementId === line.elementId)
                const at = mark?.line ? intervalAt(fixture, regionPaths(mark.line).along) : null
                if (!at || at.from !== line.along.from) gap(blockId, `the marked line set out once at ${line.along.from} m is at ${at ? at.from : 'no realized place'} in this block's game`)
            }
        }

        // ── What moves at the exchange into this block (stage C2): only where the game is played in blocks ─────────────────
        const exchanges: DiagramExchange[] = []
        const at = reassignmentsAt(index)
        const { found, problems } = reassignmentsIn(fixture?.game ?? {}, index)
        if (games.length > 1 && at) {
            for (const problem of problems) gap(blockId, `a reassignment cannot be read, so what moves between the blocks cannot be said: ${problem}`)
            const fromGame = games[calledFrom(i, games.length)]
            const fromTeams = teamsOf(fromGame, index)
            const nouns: Record<string, { singular?: unknown; plural?: unknown }> = fixture?.reassignmentNouns?.nouns ?? {}
            for (const [toRole, moving] of reassignmentsByRole(found)) {
                const joining = teams.find(team => team.role === toRole)
                const left = fromTeams.find(team => team.role === toRole)?.handle
                if (!joining || !left || left === joining.handle) {
                    gap(blockId, `the ${toRole} role is not held by one team here and another in the block the exchange is called from, so where its reassigned performers go cannot be drawn`)
                    continue
                }
                const countPaths = moving.map(entry => reassignmentCountPath(index, at, entry.elementId))
                // The served Role exchange sentence that says these reassignments: it cites every count, and gives their order.
                const sentence = rendered.find(instruction => instruction.section === ROLE_EXCHANGE && input.served.some(entry => entry.section === instruction.section && entry.text === instruction.text) && countPaths.every(path => instruction.from.includes(path)))
                const nounText = reading.roleNounOf[toRole] ?? null
                if (!sentence || !nounText) {
                    gap(blockId, `no served Role exchange sentence says the reassignments to the ${toRole} role${nounText ? '' : ' by its noun'}, so what changes between the blocks cannot be shown`)
                    continue
                }
                const ordered = [...moving].sort((a, b) => sentence.from.indexOf(reassignmentCountPath(index, at, a.elementId)) - sentence.from.indexOf(reassignmentCountPath(index, at, b.elementId)))
                const said = ordered.map(entry => {
                    const noun = nouns[entry.performerRow]
                    const word = entry.count === 1 ? noun?.singular : noun?.plural
                    return typeof word === 'string' && word.trim() ? `${entry.count} ${word}` : null
                })
                if (said.some(word => word === null)) {
                    gap(blockId, `a reassignment to the ${toRole} role has no noun for its performers, so it cannot be said`)
                    continue
                }
                const words = said as string[]
                const phrase = words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0]
                exchanges.push({
                    toRole,
                    to: joining.handle,
                    from: left,
                    fromBlock: fromGame.blockId,
                    moving: carried(phrase, sentence),
                    total: ordered.reduce((sum, entry) => sum + entry.count, 0),
                    noun: carried(nounText, sentence),
                    bindings: ordered.map(entry => ({ quantity: entry.count, path: reassignmentCountPath(index, at, entry.elementId) })),
                    cites: ordered.flatMap(entry => [`${at}[${entry.elementId}].${index.reassignment!.toRoleLeaf}`, `${at}[${entry.elementId}].${index.reassignment!.performerRowLeaf}`, reassignmentCountPath(index, at, entry.elementId)]),
                })
            }
        }

        blocks.push({ blockId, label: games.length > 1 ? blockWord(i + 1) : null, holders: { ...game.holders }, markings, objects, targets, markedZones, teams, dimensions, exchanges })
    })

    // ── Team identity across the blocks (stage C2): each realized team at one place in every block; labelled where its noun moves ─────
    if (blocks.length > 1) {
        const handlesOf = (block: DiagramBlock) => block.teams.map(team => `${team.position}:${team.handle}`).sort().join('|')
        for (const block of blocks.slice(1)) {
            if (handlesOf(block) !== handlesOf(blocks[0])) gap(block.blockId, 'the blocks do not hold the same realized teams at the same places, so no team can keep one look across them')
        }
    }
    const handles = [...new Set(blocks.flatMap(block => block.teams.map(team => team.handle)))]
    const labelled = blocks.length > 1 && handles.some(handle => new Set(blocks.map(block => block.teams.find(team => team.handle === handle)?.noun?.text ?? null)).size > 1)
    if (labelled) {
        for (const block of blocks) {
            for (const team of block.teams) {
                const text = teamLabelText(team.position)
                if (text) team.label = draft(text)
                else gap(block.blockId, `the team at place ${team.position} has no neutral label, so it cannot be told apart across the blocks`)
            }
        }
    }

    // ── What the game holds and the diagram does not draw (optional elements), for the administrator ─────────────────────
    const restarts = transitionsOf(games[0], index).filter(row => row.location !== null)
    if (restarts.length) notes.push(`not drawn: where play restarts (${restarts.map(row => row.elementId).join(', ')}); no restart location is drawn`)
    const neutrals = readPath(first?.game ?? {}, 'performers.neutrals.count')
    if (finite(neutrals)) notes.push(`not drawn: where the ${neutrals} neutral players are; they are counted, not placed`)
    const adjustments = asList(first?.adjustments?.entries).map(entry => String(entry?.id ?? '')).filter(Boolean)
    if (adjustments.length) notes.push(`not drawn: the authorized adjustments (${adjustments.join(', ')}); each block is drawn in its starting configuration`)

    // Counts said for every team together, as the first block's Players sentence says them.
    const firstCounts = teamCountPhrases(first)
    const firstPlayers = playersSentenceOf(games[0].rendered)
    const together: DiagramCount[] = [
        ...(!firstCounts.byRole && firstCounts.teamsCount ? [{ word: carried(firstCounts.teamsCount.text, firstPlayers), bindings: firstCounts.teamsCount.bindings.map(binding => ({ ...binding })), team: null }] : []),
        ...(firstCounts.neutrals ? [{ word: carried(firstCounts.neutrals.text, firstPlayers), bindings: firstCounts.neutrals.bindings.map(binding => ({ ...binding })), team: null }] : []),
    ]

    const uses = (predicate: (block: DiagramBlock) => boolean) => blocks.some(predicate)
    // Polish pass P7: each target line's words once (the 5B review: green end lines had no legend word).
    const lineTargetTexts = [...new Set(blocks.flatMap(block => block.targets.filter(target => target.line && target.label).map(target => target.label!.text)))]
    const legend: DiagramWord[] = [
        ...(uses(block => block.markings.lines.some(line => line.markedLine)) ? [his(DIAGRAM_WORDS.his.markedLine)] : []),
        ...(uses(block => block.targets.some(target => !target.line)) ? [his(DIAGRAM_WORDS.his.targetZone)] : []),
        ...lineTargetTexts.map(text => draft(text)),
        ...(uses(block => block.teams.some(team => !!team.start)) ? [draft(DIAGRAM_WORDS.draft.startingArea)] : []),
        // Stage C2: where teams are labelled, colour, role and arrow are three carriers, and each is said once.
        ...(labelled ? [draft(DIAGRAM_WORDS.draft.teamColour), draft(DIAGRAM_WORDS.draft.role), draft(DIAGRAM_WORDS.draft.attack)] : []),
    ]
    return { diagram: gaps.length ? null : { units: 'm', area, markingsSetOutOnce: setOutOnce, counts: together, blocks, legend }, gaps, notes }
}

/* ------------------------------------------------------------------ the agreement check ------------------------------------------------------------------ */

/** The keys each part of the model may hold (D8): no player, position inside an area, path or movement. */
const MODEL_KEYS: Record<'diagram' | 'area' | 'block' | 'markings' | 'line' | 'zone' | 'object' | 'target' | 'zoneState' | 'team' | 'count' | 'start' | 'attack' | 'dimension' | 'word' | 'exchange' | 'binding', string[]> = {
    diagram: ['units', 'area', 'markingsSetOutOnce', 'counts', 'blocks', 'legend'],
    area: ['lengthM', 'widthM', 'cites'],
    block: ['blockId', 'label', 'holders', 'markings', 'objects', 'targets', 'markedZones', 'teams', 'dimensions', 'exchanges'],
    markings: ['lines', 'zones'],
    line: ['elementId', 'along', 'across', 'markedLine', 'label', 'cites'],
    zone: ['elementId', 'along', 'across', 'cites'],
    object: ['elementId', 'along', 'across', 'label', 'cites'],
    target: ['objective', 'region', 'attackedBy', 'along', 'across', 'line', 'markedZone', 'label', 'cites'],
    zoneState: ['zone', 'state', 'of'],
    team: ['key', 'role', 'designation', 'handle', 'position', 'label', 'noun', 'counts', 'start', 'attacks'],
    count: ['word', 'bindings', 'team'],
    start: ['placement', 'along', 'across', 'timing', 'cites'],
    attack: ['end', 'target', 'objective', 'cites'],
    dimension: ['kind', 'axis', 'from', 'to', 'quantity', 'path', 'of', 'label'],
    word: ['text', 'status', 'carriedBy'],
    // Stage C2: what moves at an exchange, as counts and words only: no path, position or movement.
    exchange: ['toRole', 'to', 'from', 'fromBlock', 'moving', 'total', 'noun', 'bindings', 'cites'],
    binding: ['quantity', 'path', 'as'],
}

/**
 * **What is data in these games, never a coach word** (D6, and since stage 5B D9 on the coach's diagram): every role, designation and
 * role-holder name, every designation a binding names, every restart's actor and awardee (`forbidden`, matched whole by D6); every element
 * id of the games, every block id and every id of the markings set out once (`ids`, matched anywhere in a word). Stage 5B added the block
 * ids and the layout's ids to `ids` (a tightening of D6: no word drawn so far contains one).
 */
export function dataWordsOf(input: Pick<DiagramInput, 'games' | 'index'>): { forbidden: Set<string>; ids: string[] } {
    const forbidden = new Set<string>()
    const ids: string[] = []
    for (const game of input.games) {
        for (const [role, holder] of Object.entries(game.holders)) forbidden.add(role).add(holder)
        for (const name of Object.keys(game.fixture?.roleNouns?.holders ?? {})) forbidden.add(name)
        for (const binding of asList(game.fixture?.record?.designationBindings)) forbidden.add(String(binding?.designation))
        for (const row of transitionsOf(game, input.index)) {
            if (typeof row.actor === 'string') forbidden.add(row.actor)
            if (typeof row.awardedTo === 'string') forbidden.add(row.awardedTo)
        }
        for (const collection of [game.fixture?.game?.space?.regions, game.fixture?.game?.objectives, game.fixture?.game?.performers?.teams, game.fixture?.game?.performers?.startPlacement, game.fixture?.game?.objects, game.fixture?.game?.transitions]) {
            for (const element of asList(collection)) if (element?.elementId) ids.push(String(element.elementId))
        }
        if (game.blockId) ids.push(String(game.blockId))
        for (const entry of [...asList(game.fixture?.layout?.marks), ...asList(game.fixture?.layout?.zones)]) if (entry?.elementId) ids.push(String(entry.elementId))
    }
    return { forbidden, ids }
}

/**
 * **Does the model agree with Coach Details, block by block?** Every rule reads the game and the sentences again; none takes the builder's
 * word. Each finding withholds the diagram, never the activity.
 */
export function checkFieldDiagram(diagram: FieldDiagram, input: DiagramInput): DiagramFinding[] {
    const findings: DiagramFinding[] = []
    const finding = (rule: DiagramRule, blockId: string | null, what: string) => findings.push({ rule, blockId, what })
    const { games, served, index } = input
    const { lengthM, widthM } = diagram.area
    const servedSays = (instruction: Instruction): boolean => served.some(entry => entry.section === instruction.section && entry.text === instruction.text)

    // D8: only what the standard draws.
    const keysAre = (what: string, value: object, allowed: string[], blockId: string | null) => {
        const extra = Object.keys(value).filter(key => !allowed.includes(key))
        if (extra.length) finding('D8', blockId, `${what} holds ${extra.join(', ')}, which the diagram does not draw`)
    }
    const wordKeys = (what: string, value: DiagramWord | null, blockId: string | null) => {
        if (value) keysAre(what, value, MODEL_KEYS.word, blockId)
    }
    const countKeys = (count: DiagramCount, blockId: string | null) => {
        keysAre('a count', count, MODEL_KEYS.count, blockId)
        wordKeys('a count\'s word', count.word, blockId)
    }
    keysAre('the diagram', diagram, MODEL_KEYS.diagram, null)
    keysAre('the area', diagram.area, MODEL_KEYS.area, null)
    for (const count of diagram.counts) countKeys(count, null)
    for (const entry of diagram.legend) wordKeys('a legend word', entry, null)
    for (const block of diagram.blocks) {
        const at = block.blockId
        keysAre(`block ${at}`, block, MODEL_KEYS.block, at)
        wordKeys('the block\'s name', block.label, at)
        keysAre('the markings', block.markings, MODEL_KEYS.markings, at)
        for (const line of block.markings.lines) {
            keysAre(`the line ${line.elementId}`, line, MODEL_KEYS.line, at)
            wordKeys('a line\'s label', line.label, at)
        }
        for (const zone of block.markings.zones) keysAre(`the zone ${zone.elementId}`, zone, MODEL_KEYS.zone, at)
        for (const object of block.objects) {
            keysAre(`the object ${object.elementId}`, object, MODEL_KEYS.object, at)
            wordKeys('an object\'s label', object.label, at)
        }
        for (const target of block.targets) {
            keysAre(`the target ${target.region}`, target, MODEL_KEYS.target, at)
            wordKeys('a target\'s label', target.label, at)
        }
        for (const state of block.markedZones) keysAre(`the state of ${state.zone}`, state, MODEL_KEYS.zoneState, at)
        for (const exchange of block.exchanges ?? []) {
            keysAre(`the exchange to the ${exchange.toRole} role`, exchange, MODEL_KEYS.exchange, at)
            wordKeys('the performers an exchange moves', exchange.moving, at)
            wordKeys('the noun of the role an exchange joins', exchange.noun, at)
            for (const binding of exchange.bindings ?? []) keysAre('an exchange\'s count', binding, MODEL_KEYS.binding, at)
        }
        for (const team of block.teams) {
            keysAre(`the ${team.key} team`, team, MODEL_KEYS.team, at)
            wordKeys('a team\'s noun', team.noun, at)
            wordKeys('a team\'s label', team.label, at)
            for (const count of team.counts) countKeys(count, at)
            if (team.start) keysAre(`the ${team.key} team's starting area`, team.start, MODEL_KEYS.start, at)
            for (const attack of team.attacks) keysAre(`the ${team.key} team's direction`, attack, MODEL_KEYS.attack, at)
        }
        for (const dimension of block.dimensions) {
            keysAre(`the ${dimension.kind} dimension`, dimension, MODEL_KEYS.dimension, at)
            wordKeys('a dimension\'s label', dimension.label, at)
        }
    }

    // D1: the area is the session's and every game's.
    if (lengthM !== input.session.lengthM || widthM !== input.session.widthM) finding('D1', null, `the area drawn is ${lengthM} m by ${widthM} m and the session's is ${input.session.lengthM} m by ${input.session.widthM} m`)
    if (diagram.blocks.length !== games.length) finding('D5', null, `${diagram.blocks.length} blocks are drawn and the activity has ${games.length}`)

    // D6: words that are data, never a coach word.
    const { forbidden, ids } = dataWordsOf(input)
    const blockOrdinals = diagram.blocks.map((_, n) => n + 1)
    const checkWord = (word: DiagramWord | null, expected: string | null, blockId: string | null, rendered: Instruction[] | null, ordinal: number | null) => {
        if (!word) return
        if (forbidden.has(word.text) || ids.some(id => word.text.includes(id))) finding('D6', blockId, `"${word.text}" is a data key or value, not a coach word`)
        if (word.status === 'HIS_TERM') {
            if (word.carriedBy || !Object.values(DIAGRAM_WORDS.his).includes(word.text as never)) finding('D6', blockId, `"${word.text}" is marked as his term and is not one`)
        } else if (word.carriedBy) {
            const by = word.carriedBy
            const sentence = (rendered ?? []).find(instruction => instruction.section === by.section && instruction.text === by.text)
            if (!sentence || !servedSays(sentence) || !sentence.text.includes(word.text)) finding('D6', blockId, `"${word.text}" is not carried by a served sentence of this block`)
        } else if (expected === null || word.text !== expected) finding('D6', blockId, `"${word.text}" is no DRAFT diagram word in its place${expected ? ` (expected "${expected}")` : ''}`)
        // No word names another block (his reply filed 23 October 2026, item 5).
        for (const other of blockOrdinals) if (other !== ordinal && word.text.includes(`${DIAGRAM_WORDS.draft.block} ${other}`)) finding('D6', blockId, `"${word.text}" names another block`)
    }
    // Stage C2 (D10): teams are labelled exactly where some realized team's noun does not stay with it across the blocks.
    const handles = [...new Set(diagram.blocks.flatMap(block => block.teams.map(team => team.handle)))]
    const labelled = diagram.blocks.length > 1 && handles.some(handle => new Set(diagram.blocks.map(block => block.teams.find(team => team.handle === handle)?.noun?.text ?? null)).size > 1)
    const teamLegend: string[] = [DIAGRAM_WORDS.draft.teamColour, DIAGRAM_WORDS.draft.role, DIAGRAM_WORDS.draft.attack]
    for (const text of teamLegend) {
        const has = diagram.legend.some(word => word.text === text)
        if (has !== labelled) finding('D10', null, `the legend ${has ? 'says' : 'does not say'} "${text}" where the teams ${labelled ? 'are' : 'are not'} labelled`)
    }
    // A DRAFT legend word is the starting area's name, (polish pass P7) a target line's words, which D6 holds to the game below, or (stage
    // C2) one of the three words for labelled teams.
    const lineTargetTexts = new Set(diagram.blocks.flatMap(block => block.targets.filter(target => target.line && target.label).map(target => target.label!.text)))
    const draftLegendWord = (text: string): string => (lineTargetTexts.has(text) || (labelled && teamLegend.includes(text)) ? text : DIAGRAM_WORDS.draft.startingArea)
    for (const word of diagram.legend) checkWord(word, word.status === 'DRAFT' ? draftLegendWord(word.text) : null, null, null, null)

    // D4 for the counts said for every team together: the first block's Players sentence carries each, and each number is the game's.
    const countValue = (fixture: any, binding: Binding, team: number | null): number | null => {
        const teams = asList(fixture?.game?.performers?.teams)
        if (binding.path === 'performers.teams') return teams.length
        if (binding.path.startsWith('performers.teams[].')) {
            const leaf = binding.path.slice('performers.teams[].'.length)
            const values = (team === null ? teams : [teams[team]]).map(entry => entry?.[leaf])
            return values.length && values.every(value => value === values[0]) && finite(values[0]) ? values[0] : null
        }
        const value = readPath(fixture?.game ?? {}, binding.path)
        return finite(value) ? value : null
    }
    const checkCounts = (counts: DiagramCount[], fixture: any, rendered: Instruction[], blockId: string | null, ordinal: number | null) => {
        const players = playersSentenceOf(rendered)
        for (const count of counts) {
            checkWord(count.word, null, blockId, rendered, ordinal)
            for (const binding of count.bindings) {
                if (countValue(fixture, binding, count.team) !== binding.quantity) finding('D4', blockId, `"${count.word.text}" says ${binding.quantity} for ${binding.path}, which the game does not hold`)
                const part = players?.parts?.find(entry => entry.text.endsWith(count.word.text) && entry.bindings.some(held => held.path === binding.path && held.quantity === binding.quantity))
                if (!part) finding('D4', blockId, `"${count.word.text}" is not said with ${binding.quantity} for ${binding.path} by the Players sentence`)
            }
        }
    }
    if (games.length) checkCounts(diagram.counts, games[0].fixture, games[0].rendered, null, null)

    diagram.blocks.forEach((block, i) => {
        const game = games[i]
        if (!game) return
        const blockId = block.blockId
        const fixture = game.fixture
        const rendered = game.rendered
        const setUp = rendered.filter(instruction => instruction.section === SET_UP && servedSays(instruction))
        const citedBy = (list: Instruction[], test: (path: string) => boolean) => list.some(instruction => instruction.from.some(test))
        const ordinal = i + 1
        if (blockId !== game.blockId) finding('D5', blockId, `block ${i + 1} is drawn as ${blockId} and the activity's is ${game.blockId}`)
        checkWord(block.label, games.length > 1 ? `${DIAGRAM_WORDS.draft.block} ${ordinal}` : null, blockId, rendered, ordinal)

        // D1: this game's area, and a Set up sentence that marks it with both numbers.
        const envelope = fixture?.game?.envelope?.area
        if (envelope?.length_m !== lengthM || envelope?.width_m !== widthM || fixture?.envelope?.lengthM !== lengthM || fixture?.envelope?.widthM !== widthM) finding('D1', blockId, 'the area drawn is not the one this block\'s game holds')
        const areaSaid = setUp.some(instruction => ['envelope.area.length_m', 'envelope.area.width_m'].every(path => instruction.from.includes(path)) && stated([instruction], 'envelope.area.length_m', lengthM) && stated([instruction], 'envelope.area.width_m', widthM))
        if (!areaSaid) finding('D1', blockId, 'no Set up sentence marks the area with both its numbers')

        // D5: the roles each block's teams hold are the served role-block account's.
        const account = input.roleBlocks ? input.roleBlocks[i] : null
        const holdersHeld = fixture?.record?.roleBlock?.holders ?? {}
        const sameHolders = (a: Record<string, string>, b: Record<string, string>) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort())
        if (input.roleBlocks ? !account || account.blockId !== blockId || !sameHolders(account.holders, block.holders) || !sameHolders(holdersHeld, block.holders) : Object.keys(block.holders).length > 0) {
            finding('D5', blockId, `the roles drawn (${JSON.stringify(block.holders)}) are not the ones the served role-block account holds for this block`)
        }
        for (const team of block.teams) {
            if (team.role && block.holders[team.role] !== team.designation) finding('D5', blockId, `the ${team.key} team is drawn holding ${team.role}, which ${team.designation} does not hold in this block`)
        }

        // D2 and D3: the markings are exactly what Set up says to mark.
        const layout: PhysicalLayout | null = diagram.markingsSetOutOnce ? (fixture?.layout as PhysicalLayout) : null
        const drawnLines = new Set(block.markings.lines.map(line => line.elementId))
        const drawnZones = new Set(block.markings.zones.map(zone => zone.elementId))
        const targetRegions = new Set(block.targets.map(target => target.region))
        for (const line of block.markings.lines) {
            const cited = layout ? citedBy(setUp, path => path.startsWith(`layout.marks[${line.elementId}]`)) : citedBy(setUp, path => path === regionPaths(line.elementId).noun)
            if (!cited) finding('D2', blockId, `the line ${line.elementId} is drawn and no Set up sentence marks it`)
            checkWord(line.label, line.markedLine ? DIAGRAM_WORDS.his.markedLine : null, blockId, rendered, ordinal)
        }
        for (const zone of block.markings.zones) {
            const cited = layout ? citedBy(setUp, path => path.startsWith(`layout.zones[${zone.elementId}]`)) : citedBy(setUp, path => path === regionPaths(zone.elementId).noun)
            if (!cited) finding('D2', blockId, `the zone ${zone.elementId} is drawn and no Set up sentence marks it`)
        }
        if (layout) {
            for (const instruction of setUp) {
                for (const path of instruction.from) {
                    const mark = path.startsWith('layout.marks[') ? path.slice('layout.marks['.length, path.indexOf(']')) : null
                    const zone = path.startsWith('layout.zones[') ? path.slice('layout.zones['.length, path.indexOf(']')) : null
                    if (mark && !drawnLines.has(mark)) finding('D3', blockId, `Set up marks ${mark} and it is not drawn`)
                    if (zone && !drawnZones.has(zone)) finding('D3', blockId, `Set up marks ${zone} and it is not drawn`)
                }
            }
            const sources = new Set([...layout.marks.map(mark => mark.line), ...layout.marks.flatMap(mark => mark.sources.map(source => source.regionId)), ...layout.zones.flatMap(zone => zone.sources.map(source => source.regionId))])
            for (const id of regionsCitedBy(setUp)) if (!sources.has(id) && !targetRegions.has(id)) finding('D3', blockId, `Set up marks ${id} and it is neither a marking drawn nor a target`)
            const first = diagram.blocks[0]
            if (JSON.stringify(first.markings) !== JSON.stringify(block.markings)) finding('D3', blockId, 'the markings set out once differ from the first block\'s')
        } else {
            for (const id of regionsCitedBy(setUp)) if (!drawnLines.has(id) && !drawnZones.has(id)) finding('D3', blockId, `Set up marks ${id} and it is not drawn`)
        }
        // Each marked zone's state, read again from the targets' geometry.
        for (const state of block.markedZones) {
            const zone = block.markings.zones.find(entry => entry.elementId === state.zone)
            if (!zone) {
                finding('D3', blockId, `a state is given for ${state.zone}, which is not drawn`)
                continue
            }
            const exact = block.targets.find(target => same(target.along, zone.along) && same(target.across, zone.across))
            const around = exact ? undefined : block.targets.find(target => within(zone.along, target.along) && within(zone.across, target.across))
            const expected = exact ? 'TARGET' : around ? 'INSIDE_TARGET' : 'MARKED'
            if (state.state !== expected || state.of !== ((exact ?? around)?.attackedBy ?? null)) finding('D3', blockId, `${state.zone} is drawn as ${state.state} and is ${expected} in this block`)
        }
        if (block.markedZones.length !== block.markings.zones.length) finding('D3', blockId, 'not every marked zone says what it is in this block')

        // D2: a physical object is drawn only where the game realizes its place and a served sentence of this block says it.
        for (const object of block.objects) {
            if (!citedBy(rendered.filter(servedSays), path => path.startsWith(`objects[${object.elementId}]`))) finding('D2', blockId, `the object ${object.elementId} is drawn and no served sentence says it`)
            const along = intervalAt(fixture, `objects[${object.elementId}].position.along`)
            const across = intervalAt(fixture, `objects[${object.elementId}].position.across`)
            if (!along || !across || !same(along, object.along) || !same(across, object.across)) finding('D2', blockId, `the object ${object.elementId} is not drawn where this block's game puts it`)
            checkWord(object.label, null, blockId, rendered, ordinal)
        }

        // D2 and D7: the targets, cited by Set up, and each team's arrow toward the end its own target touches.
        for (const target of block.targets) {
            if (!citedBy(setUp, saysPlaceOf(fixture, target.region))) finding('D2', blockId, `the target ${target.region} is drawn and no Set up sentence marks it`)
            const paths = placePaths(fixture, target.region)
            const along = intervalAt(fixture, paths.along)
            const across = intervalAt(fixture, paths.across)
            if (!along || !across || !same(along, target.along) || !same(across, target.across)) finding('D2', blockId, `the target ${target.region} is not drawn where this block's game puts it`)
            // Polish pass P7: a line target's words are its own noun, read again from this block's game, after the DRAFT word "target".
            checkWord(target.label, target.line ? targetLineWords(regionNounOf(fixture, target.region)) : DIAGRAM_WORDS.his.targetZone, blockId, rendered, ordinal)
            if (target.line && target.label?.status === 'HIS_TERM') finding('D6', blockId, `the target line ${target.region} is named with his term "${target.label.text}", which names a zone`)
        }
        for (const objective of objectivesOf(game, index)) {
            const along = objective.regionId ? intervalAt(fixture, placePaths(fixture, objective.regionId).along) : null
            const end = along ? touchedEnd(along, lengthM) : null
            const team = block.teams.find(entry => entry.attacks.some(attack => attack.objective === objective.elementId))
            const attack = team?.attacks.find(entry => entry.objective === objective.elementId)
            if (!team || !attack) {
                finding('D7', blockId, `no team is drawn attacking the target of the objective ${objective.elementId}`)
                continue
            }
            const holder = roleNamedBy(fixture, index, game.holders, objective.team)
            if (team.designation !== objective.team && team.role !== holder) finding('D7', blockId, `the ${team.key} team is drawn attacking the target of ${objective.team}`)
            if (end === null || attack.end !== end || attack.target !== objective.regionId) finding('D7', blockId, `the ${team.key} team's arrow points to the end at ${attack.end} m, and its target touches ${end === null ? 'no one end' : `the end at ${end} m`}`)
        }

        // D2: each starting area, where a served sentence says where that team starts, as the game realizes it.
        for (const team of block.teams) {
            checkWord(team.noun, null, blockId, rendered, ordinal)
            checkCounts(team.counts, fixture, rendered, blockId, ordinal)
            if (!team.start) continue
            const regionPath = `performers.startPlacement[${team.start.placement}].region`
            if (!citedBy(rendered.filter(servedSays), path => path === regionPath)) finding('D2', blockId, `the ${team.key} team's starting area is drawn and no served sentence says where it starts`)
            const realized = intervalAt(fixture, regionPath)
            const direct = refId(asList(fixture?.game?.performers?.startPlacement).find(entry => String(entry?.elementId) === team.start!.placement)?.region?.structuralRef)
            const expected = realized ?? (direct ? intervalAt(fixture, regionPaths(direct).along) : null)
            if (!expected || !same(expected, team.start.along)) finding('D2', blockId, `the ${team.key} team's starting area is not drawn where this block's game puts it`)
            if (team.start.along.from < 0 || team.start.along.to > lengthM || team.start.across.from < 0 || team.start.across.to > widthM) finding('D2', blockId, `the ${team.key} team's starting area lies outside the area`)
        }
        // D2: every starting area the game authorizes for a team is drawn as that team's, read again from the game's placements; a team's
        // placement no drawn team holds is refused. A placement for any other group is drawn by nothing (D8: no individual's position).
        for (const placement of asList(fixture?.game?.performers?.startPlacement)) {
            const id = String(placement?.elementId)
            const group = String(placement?.group)
            const holder = roleNamedBy(fixture, index, game.holders, group)
            const team = block.teams.find(entry => entry.designation === group) ?? (holder ? block.teams.find(entry => entry.role === holder) : undefined)
            if (team ? team.start?.placement !== id : namesTeam(index, group)) finding('D2', blockId, `the starting area ${id} the game authorizes for ${group} is not drawn as ${team ? `the ${team.key} team's` : 'any drawn team\'s'}`)
        }

        // D10 (stage C2): each team is the realized team it says, at its place among this block's game's teams, every one drawn once; its
        // label the one its place gives, where teams are labelled, and none elsewhere.
        const realizedTeams = teamsOf(game, index)
        if (block.teams.length !== realizedTeams.length || new Set(block.teams.map(team => team.handle)).size !== block.teams.length) finding('D10', blockId, `${block.teams.length} teams are drawn and this block's game holds ${realizedTeams.length}, each to be drawn once`)
        for (const team of block.teams) {
            const held = realizedTeams[team.position]
            if (!held || held.handle !== team.handle || held.designation !== team.designation) finding('D10', blockId, `the ${team.key} team is drawn as the realized team ${team.handle} at place ${team.position}, which this block's game does not hold there`)
            if ((team.label !== null) !== labelled) finding('D10', blockId, `the ${team.key} team ${team.label ? `is labelled "${team.label.text}"` : 'has no label'} where the teams ${labelled ? 'are' : 'are not'} labelled`)
            checkWord(team.label, labelled ? teamLabelText(team.position) : null, blockId, rendered, ordinal)
        }

        // D10: what moves at the exchange into this block, read again from this block's recorded reassignments, the teams holding each role
        // here and in the block the exchange is called from, the served Role exchange sentence that says it, and both blocks' counts.
        const reassignedAt = reassignmentsAt(index)
        const groups = games.length > 1 && reassignedAt ? reassignmentsByRole(reassignmentsIn(fixture?.game ?? {}, index).found) : []
        const exchanges = block.exchanges ?? []
        const roleList = (roles: string[]) => roles.join(', ') || 'none'
        if (exchanges.length !== groups.length || groups.some(([role]) => exchanges.filter(exchange => exchange.toRole === role).length !== 1)) {
            finding('D10', blockId, `the exchanges drawn (${roleList(exchanges.map(exchange => exchange.toRole))}) are not the reassignments this block's game records (${roleList(groups.map(([role]) => role))})`)
        }
        const calledFromGame = games.length > 1 ? games[calledFrom(i, games.length)] : null
        const there = calledFromGame ? teamsOf(calledFromGame, index) : []
        const roleNouns = gameReadingOf(fixture).roleNounOf
        const change = new Map<string, number>()
        for (const exchange of exchanges) {
            const group = groups.find(([role]) => role === exchange.toRole)?.[1] ?? []
            const joins = realizedTeams.find(team => team.role === exchange.toRole)?.handle
            const leaves = there.find(team => team.role === exchange.toRole)?.handle
            if (!calledFromGame || exchange.fromBlock !== calledFromGame.blockId || exchange.to !== joins || exchange.from !== leaves || exchange.to === exchange.from) {
                finding('D10', blockId, `the performers reassigned to the ${exchange.toRole} role are drawn moving from ${exchange.from} to ${exchange.to}, and the games move them from ${leaves ?? 'no team'} to ${joins ?? 'no team'}`)
            }
            const expected = group.map(entry => `${reassignmentCountPath(index, reassignedAt!, entry.elementId)}=${entry.count}`).sort()
            const drawn = (exchange.bindings ?? []).map(binding => `${binding.path}=${binding.quantity}`).sort()
            if (JSON.stringify(drawn) !== JSON.stringify(expected) || exchange.total !== group.reduce((sum, entry) => sum + entry.count, 0)) {
                finding('D10', blockId, `the exchange to the ${exchange.toRole} role says ${drawn.join(', ') || 'no count'} (${exchange.total} together), and the game records ${expected.join(', ') || 'none'}`)
            }
            // The words: carried by one served Role exchange sentence (D6 holds each to it) that binds every count and says the role's noun.
            checkWord(exchange.moving, null, blockId, rendered, ordinal)
            checkWord(exchange.noun, null, blockId, rendered, ordinal)
            const carrier = rendered.find(instruction => instruction.section === exchange.moving.carriedBy?.section && instruction.text === exchange.moving.carriedBy?.text)
            if (!carrier || carrier.section !== ROLE_EXCHANGE || exchange.noun.carriedBy?.text !== carrier.text || !(exchange.bindings ?? []).every(binding => stated([carrier], binding.path, binding.quantity))) {
                finding('D10', blockId, `the exchange to the ${exchange.toRole} role is not said by one served Role exchange sentence binding each of its counts`)
            }
            if (exchange.noun.text !== roleNouns[exchange.toRole]) finding('D10', blockId, `the exchange to the ${exchange.toRole} role names it "${exchange.noun.text}", which is not that role's noun`)
            for (const entry of group) {
                const leaf = performerLeafOf(index, entry.performerRow)
                change.set(`${exchange.to}|${leaf}`, (change.get(`${exchange.to}|${leaf}`) ?? 0) + entry.count)
                change.set(`${exchange.from}|${leaf}`, (change.get(`${exchange.from}|${leaf}`) ?? 0) - entry.count)
            }
        }
        // Each team's counts here, against the block the exchange is called from: changed exactly as the exchanges drawn state, so the counts
        // drawn in each block and the sentence drawn with them never disagree.
        if (calledFromGame && index.reassignment) {
            for (const team of realizedTeams) {
                for (const leaf of index.reassignment.performerRows.map(row => performerLeafOf(index, row))) {
                    const here = teamCountAt(fixture, team.handle, leaf)
                    const before = teamCountAt(calledFromGame.fixture, team.handle, leaf)
                    if (here === null && before === null) continue
                    const actual = here === null || before === null ? NaN : here - before
                    const drawnChange = change.get(`${team.handle}|${leaf}`) ?? 0
                    if (actual !== drawnChange) finding('D10', blockId, `the team ${team.handle} holds ${here} ${leaf} here and ${before} in the block the exchange is called from, a change the exchanges drawn state as ${drawnChange}`)
                }
            }
        }

        // D4: every dimension is the game's own value at its path, and a sentence of this block that cites the path says it.
        for (const dimension of block.dimensions) {
            checkWord(dimension.label, `${dimension.quantity} ${DIAGRAM_WORDS.draft.metres}`, blockId, rendered, ordinal)
            let held: number | null = null
            if (dimension.kind === 'AREA_LENGTH' || dimension.kind === 'AREA_WIDTH') {
                const value = readPath(fixture?.game ?? {}, dimension.path)
                held = finite(value) ? value : null
            } else if (dimension.kind === 'ZONE_DEPTH') {
                const leaf = layout ? layoutLeafNumberAt(layout, dimension.path) : []
                const span = layout ? null : intervalAt(fixture, dimension.path)
                held = layout ? (leaf.length === 1 ? leaf[0] : null) : span ? span.to - span.from : null
                const zone = block.markings.zones.find(entry => entry.elementId === dimension.of)
                if (!zone || zone.along.from !== dimension.from || zone.along.to !== dimension.to) finding('D4', blockId, `the ${dimension.label.text} rail does not run along the marked zone ${dimension.of}`)
            } else {
                // A line measured from a team's end line: the game holds the distance (S5 version 2, `offsetM`), and the rail runs from an
                // end line to the line where this block's game realizes it.
                const offset = readPath(fixture?.game ?? {}, `${dimension.path}.offsetM`) as any
                held = offset && offset.from === offset.to && finite(offset.from) ? offset.from : null
                const at = intervalAt(fixture, dimension.path)
                const ends = [dimension.from, dimension.to]
                if (!at || !ends.includes(at.from) || !ends.some(end => end === 0 || end === lengthM)) finding('D4', blockId, `the ${dimension.label.text} rail does not run from an end line to the line ${dimension.of} where the game puts it`)
            }
            if (held !== dimension.quantity) finding('D4', blockId, `${dimension.label.text} is drawn for ${dimension.path}, where the game holds ${held}`)
            if (dimension.to - dimension.from !== dimension.quantity) finding('D4', blockId, `the ${dimension.label.text} rail runs ${dimension.from}-${dimension.to} m`)
            if (!stated(rendered.filter(servedSays), dimension.path, dimension.quantity)) finding('D4', blockId, `no served sentence of this block says ${dimension.quantity} citing ${dimension.path}`)
        }
    })
    // D10 (stage C2): each realized team at one place in every block, so its look and label can follow it.
    const placeOf = new Map<string, number>()
    for (const block of diagram.blocks) {
        for (const team of block.teams) {
            if (placeOf.has(team.handle) && placeOf.get(team.handle) !== team.position) finding('D10', block.blockId, `the realized team ${team.handle} is at place ${placeOf.get(team.handle)} in one block and ${team.position} in another`)
            else placeOf.set(team.handle, team.position)
        }
    }
    return findings
}

/* ------------------------------------------------------------------ the draft ------------------------------------------------------------------ */

/** **The administrator's diagram draft**: the model where it can be built, the check, and the notes. Never refuses or changes the activity. */
export function fieldDiagramDraftOf(input: DiagramInput): FieldDiagramDraft {
    const built = buildFieldDiagram(input)
    const findings = built.diagram ? checkFieldDiagram(built.diagram, input) : built.gaps
    return { served: false, verdict: built.diagram && !findings.length ? 'DRAWN' : 'WITHHELD', diagram: built.diagram, findings, notes: built.notes }
}

/** A diagram that could not be computed at all: withheld, with why; the activity is served exactly as without it. */
export function failedDiagramDraft(why: string): FieldDiagramDraft {
    return { served: false, verdict: 'WITHHELD', diagram: null, findings: [{ rule: 'D0', blockId: null, what: `the diagram could not be computed: ${why}` }], notes: [] }
}
