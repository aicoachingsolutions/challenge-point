/**
 * **Where a coach finds each sentence, decided in one place, by the kind of element it states** — stage 2A of the communication
 * work, 21 October 2026, for Christian's reply filed 22 October 2026:
 *
 *   > *"Information should be classified according to when the coach needs it, not simply whether it constitutes a rule."*
 *   > *"Coach Details: The complete instructions organized by function, with supporting procedures, exceptions, restarts, role
 *   > exchanges, and challenge adjustments available when needed."*
 *   > *"The same communication mechanisms can support other Learning Goals without activity-specific implementation exceptions."*
 *
 * Until this stage every producer in `render-concrete-game.ts` wrote its own section literal (41 of them), and an approved entry
 * carried its own. Nothing decided placement by what a sentence states, so a restart procedure and the basic restart condition sat
 * in one section because their producers happened to choose it. Now a producer's literal is a PROPOSAL only, and the section is
 * assigned here, from the register row of every path the sentence cites:
 *
 *   - each cited path is resolved to its register row (every `[...]` read as `[]`, as RB-4's `rowOfPath` reads the first one), or
 *     to one of the two non-row roots a renderer cites (`adjustments`, `envelope.roles`);
 *   - each row has ONE kind (`KIND_OF_ROW`), keyed by the element it holds and never by an activity, a goal or a sentence;
 *   - a transition's kind is read per element from what it holds (`SectionFacts.transitionKind`): one that opens play or the episode
 *     a role's credit is confined to, any other stop-and-restart, or one that keeps play going;
 *   - two structural facts give ADJUST whatever is cited: a PREFERENCE, and a number said as the REQUIRED_LIMIT of a line the
 *     activity only starts at (`SectionFacts.startingLines`);
 *   - the highest kind in `PRECEDENCE` wins, and its section and `when` follow.
 *
 * A path that resolves to no row and no known prefix, a row with no kind, a cited transition the game does not hold, and a sentence
 * no cited path decides are each refused loudly (an Error naming it): silence never places a sentence. Every name below is a DRAFT
 * for his review; "When it ends" is RC2's Win Condition, and "Restarts and ball out" is the consult-when-needed section his item 1
 * names ("restarts ... available when needed").
 *
 * **What stage 2A moves, and only that** (the BUILD PLAN): the duration, to When it ends, and every stop-and-restart that does not
 * open play or a bounded episode (the ball going out), to Restarts and ball out. Three readings keep today's placement where the
 * design (D2) proposed a move that a later stage owns, each recorded at its row: the roles statement (B2) stays in Role exchange
 * (fidelity Q6 unchanged); a performer group's participation (P11-P13) stays in Players; the objectives (J1-J4) stay in How to
 * score, below the marking rows, so a marking sentence that names its objective stays in Set up. An episode opener keeps every
 * field in How it works until stage 2B splits its WHEN from its HOW.
 *
 * Organisation only: nothing is added, dropped, reworded or re-cited here (fidelity Q3 is unchanged), and approved wording is placed
 * like any other sentence (a test requires the classifier to give each approved entry its own validated `section`).
 */
import { loadRegister } from '../derivation/corpus'

/**
 * **The part of an activity a coach reads after the starting setup** — 14 October 2026, his §7: *"My preference is that the main
 * activity present a clear starting setup and playing instructions. Alternative ranges, adjustments, and supporting explanations can
 * be presented separately when useful."* Ranges a coach may move within, preferences, and the limits of a value the activity only
 * starts at go here. The section name is a DRAFT for his review.
 */
export const ADJUSTING = 'Adjusting the activity'

/**
 * **The section saying how the roles pass between the teams** — 15 October 2026 (stage K3), for his D2: *"Please make that
 * distinction explicit in the coach-facing instructions."* Present only for a game played in role blocks. The section name is a
 * DRAFT for his review.
 */
export const ROLE_EXCHANGE = 'Role exchange'

/** **When the activity ends** — RC2's Win Condition ("When does the activity end?"). Stage 2A, DRAFT name. */
export const WHEN_IT_ENDS = 'When it ends'

/** **How play is restarted when it stops for anything but the opening of play or of a bounded episode** — stage 2A, DRAFT name. */
export const RESTARTS = 'Restarts and ball out'

/** The order a coach reads Coach Details in (the BUILD PLAN, stage 2A). Every name is a DRAFT. */
export const SECTION_ORDER = ['Set up', 'Players', 'How it works', 'How to score', WHEN_IT_ENDS, ROLE_EXCHANGE, RESTARTS, ADJUSTING] as const
export type Section = (typeof SECTION_ORDER)[number]

/**
 * **When the coach needs it** — his item 2: *"Some information is essential to understanding and beginning the game. Other
 * information is essential to administering the activity correctly but need not dominate the initial presentation."* and
 * *"adjustments should be available without being presented as requirements for initially running the activity."*
 */
export type When = 'UNDERSTAND_AND_BEGIN' | 'ADMINISTER' | 'ADJUST'
export const WHEN_OF_SECTION: Record<Section, When> = {
    'Set up': 'UNDERSTAND_AND_BEGIN',
    Players: 'UNDERSTAND_AND_BEGIN',
    'How it works': 'UNDERSTAND_AND_BEGIN',
    'How to score': 'UNDERSTAND_AND_BEGIN',
    [WHEN_IT_ENDS]: 'UNDERSTAND_AND_BEGIN',
    [ROLE_EXCHANGE]: 'ADMINISTER',
    [RESTARTS]: 'ADMINISTER',
    [ADJUSTING]: 'ADJUST',
}

/** The kinds of element a sentence can state, each with its one section. */
export type Kind = 'ADJUSTMENT' | 'ROLE_EXCHANGE' | 'SCORING' | 'EPISODE_OPENER' | 'RESTART' | 'IN_PLAY' | 'ORGANISATION' | 'OBJECTIVE' | 'DURATION' | 'PLAYERS'

/**
 * **Which kind decides, highest first.** A sentence states several kinds of element at once (a marking sentence names the objective
 * whose target it marks; a scoring sentence names the object and the target noun), and the most specific function it serves decides:
 * a change a coach may make, then the exchange of roles, then how a team scores, then when play opens, then other restarts, then how
 * play runs, then organisation, then the objectives, then the duration, then picking sides. An opener ranks above other restarts, so
 * a sentence stating when play opens is never sent to the consult-when-needed section by a restart it also names.
 */
export const PRECEDENCE: Kind[] = ['ADJUSTMENT', 'ROLE_EXCHANGE', 'SCORING', 'EPISODE_OPENER', 'RESTART', 'IN_PLAY', 'ORGANISATION', 'OBJECTIVE', 'DURATION', 'PLAYERS']

export const SECTION_OF_KIND: Record<Kind, Section> = {
    ADJUSTMENT: ADJUSTING,
    ROLE_EXCHANGE: ROLE_EXCHANGE,
    SCORING: 'How to score',
    EPISODE_OPENER: 'How it works',
    RESTART: RESTARTS,
    IN_PLAY: 'How it works',
    ORGANISATION: 'Set up',
    OBJECTIVE: 'How to score',
    DURATION: WHEN_IT_ENDS,
    PLAYERS: 'Players',
}

/**
 * **Every register row, by the kind of element it holds** — keyed by row id, never by activity. `TRANSITION` rows are decided per
 * element (`SectionFacts.transitionKind`); `NAME` rows are cited for a noun a sentence uses (an object's kind, a region's noun) and
 * never decide a section. Totality is a test: every row of the register must be here, and a row that is not is refused loudly.
 */
export const KIND_OF_ROW: Record<string, Kind | 'TRANSITION' | 'NAME'> = {
    // The session envelope: who plays, on what area, for how long.
    E1: 'PLAYERS',
    E2: 'ORGANISATION',
    E3: 'ORGANISATION',
    E4: 'DURATION',
    // Space: what a coach marks.
    S1: 'ORGANISATION',
    S2: 'ORGANISATION',
    S3: 'NAME',
    S4: 'ORGANISATION',
    S5: 'ORGANISATION',
    S6: 'ORGANISATION',
    SV1: 'ORGANISATION',
    DV1: 'ORGANISATION',
    // Performers: picking sides. A group's participation state is how a group plays, said where its group is named (stage 2A keeps it
    // in Players, where every render has said it; the design's How it works reading is not taken here).
    P1: 'PLAYERS',
    P2: 'PLAYERS',
    P3: 'PLAYERS',
    P4: 'PLAYERS',
    P5: 'PLAYERS',
    P6a: 'PLAYERS',
    P6b: 'PLAYERS',
    P6c: 'PLAYERS',
    P7: 'PLAYERS',
    P11: 'PLAYERS',
    P12: 'PLAYERS',
    P13: 'PLAYERS',
    // Where teams start, and who starts with possession: needed to begin, said with how play works.
    P8: 'IN_PLAY',
    P9: 'IN_PLAY',
    P10: 'IN_PLAY',
    P10a: 'IN_PLAY',
    P10b: 'IN_PLAY',
    PS1: 'IN_PLAY',
    // Objects: what a coach sets out. The kind is a noun a sentence names.
    O1: 'ORGANISATION',
    O2: 'NAME',
    O3: 'ORGANISATION',
    O4: 'ORGANISATION',
    O5: 'ORGANISATION',
    // Objectives: which target each team attacks (stage 2A keeps them in How to score; a marking sentence naming one stays in Set up).
    J1: 'OBJECTIVE',
    J2: 'OBJECTIVE',
    J3: 'OBJECTIVE',
    J4: 'OBJECTIVE',
    // Objective sets: which targets count, and when.
    J5: 'SCORING',
    J6: 'SCORING',
    J7: 'SCORING',
    J8: 'SCORING',
    J9: 'SCORING',
    J10: 'SCORING',
    J11a: 'SCORING',
    J11b: 'SCORING',
    J12: 'SCORING',
    // Transitions: decided per element.
    T1: 'TRANSITION',
    T1a: 'TRANSITION',
    T1b: 'TRANSITION',
    T1c: 'TRANSITION',
    T2: 'TRANSITION',
    T3: 'TRANSITION',
    T4: 'TRANSITION',
    T5: 'TRANSITION',
    T6: 'TRANSITION',
    T7: 'TRANSITION',
    // Value: how a team scores, what modifies it, its consequences and time windows, and what else counts.
    V0: 'SCORING',
    V1: 'SCORING',
    V2: 'SCORING',
    V3: 'SCORING',
    V4: 'SCORING',
    V5: 'SCORING',
    V6: 'SCORING',
    V7: 'SCORING',
    V8a: 'SCORING',
    V8b: 'SCORING',
    V8c: 'SCORING',
    V8d: 'SCORING',
    V9: 'SCORING',
    V9a: 'SCORING',
    V10: 'SCORING',
    V11: 'SCORING',
    V12: 'SCORING',
    V13: 'SCORING',
    V14a: 'SCORING',
    V14b: 'SCORING',
    V14c: 'SCORING',
    V23: 'SCORING',
    V24: 'SCORING',
    V25: 'SCORING',
    V26: 'SCORING',
    V27: 'SCORING',
    V28: 'SCORING',
    V29: 'SCORING',
    V30: 'SCORING',
    V31: 'SCORING',
    // Information rules and action restrictions: rules players play by from the first second.
    V15: 'IN_PLAY',
    V16: 'IN_PLAY',
    V17: 'IN_PLAY',
    V18: 'IN_PLAY',
    V19: 'IN_PLAY',
    V20: 'IN_PLAY',
    V21: 'IN_PLAY',
    V22: 'IN_PLAY',
    R1: 'IN_PLAY',
    R2: 'IN_PLAY',
    R3: 'IN_PLAY',
    R4: 'IN_PLAY',
    // Roles: which roles the teams hold and how they pass between them (the roles statement stays in Role exchange, fidelity Q6),
    // who changes team at the exchange, and a role's scoring credit, which is how that team scores.
    B1: 'ROLE_EXCHANGE',
    B2: 'ROLE_EXCHANGE',
    B3: 'ROLE_EXCHANGE',
    B4: 'ROLE_EXCHANGE',
    B5: 'ROLE_EXCHANGE',
    B6: 'ROLE_EXCHANGE',
    B7: 'ROLE_EXCHANGE',
    B8: 'SCORING',
}

/**
 * The paths a renderer cites that are no register row, by their root: an authorized adjustment (`adjustments[<id>].words`, the
 * authorization record that crossed with the game), and the session's specialized-role counts (`envelope.roles`).
 */
export const KIND_OF_ROOT: { root: string; kind: Kind }[] = [
    { root: 'adjustments', kind: 'ADJUSTMENT' },
    { root: 'envelope.roles', kind: 'PLAYERS' },
]
const underRoot = (path: string, root: string): boolean => path === root || path.startsWith(`${root}.`) || path.startsWith(`${root}[`)

/** A transition as placement reads it. */
export type TransitionKind = 'EPISODE_OPENER' | 'RESTART' | 'IN_PLAY'

/**
 * **The two structural facts placement reads beside the rows** — computed once per game by the renderer, which owns the reading
 * (`render-concrete-game.ts` `sectionFactsOf`):
 *
 *   - `transitionKind`: for a transition element, whether it opens play (trigger START) or begins the episode a role's credit is
 *     confined to (row B8, its taker meeting an arm of that episode's typed begin condition, read exactly as `beginsEpisode` reads
 *     it), any other stop-and-restart, or a transition that keeps play going; null for an element the game does not hold;
 *   - `startingLines`: every line realization closed to a starting value inside a range (`STARTING_VALUE_IN_RANGE`), whose limits
 *     said as a REQUIRED_LIMIT are what a coach adjusts within.
 */
export interface SectionFacts {
    transitionKind: (elementId: string) => TransitionKind | null
    startingLines: Set<string>
}

/** A register row as placement reads it. */
export interface RowRef {
    id: string
    path: string
}

/** Every `[...]` of a path read as `[]`, so an element's path reads as its row's. */
export function genericPath(path: string): string {
    let out = ''
    let depth = 0
    for (const char of path) {
        if (char === '[') {
            if (depth === 0) out += '[]'
            depth++
            continue
        }
        if (char === ']') {
            depth = Math.max(0, depth - 1)
            continue
        }
        if (depth === 0) out += char
    }
    return out
}

/** The id inside the first `[...]` of a path: the element a top-level collection path is about. */
function firstElementId(path: string): string | null {
    const open = path.indexOf('[')
    const close = path.indexOf(']', open)
    return open < 0 || close < 0 ? null : path.slice(open + 1, close)
}

/** The rows of a register, by their generic path. */
export function rowIndexOf(rows: RowRef[]): Map<string, string> {
    return new Map(rows.map(row => [genericPath(String(row.path)), String(row.id)]))
}

let registerRows: Map<string, string> | null = null
/** The live register's rows, read once (the register is versioned data; nothing here names a row's path). */
export function registerRowIndex(): Map<string, string> {
    if (!registerRows) registerRows = rowIndexOf(((loadRegister().rows ?? []) as any[]).map(row => ({ id: String(row?.id), path: String(row?.path) })))
    return registerRows
}

/**
 * **The register row a cited path is on**: the row whose path equals the generic path; else the collection a bare path names
 * (`performers.teams` is a citation of `performers.teams[]`); else the nearest ancestor that is a row (a condition's `scope` is
 * held by its condition, `transitions[x].selector` by the transition, a referent `[...]` by its referents field). Null where none is.
 */
export function rowOfPath(path: string, rows: Map<string, string>): string | null {
    let generic = genericPath(path)
    if (rows.has(generic)) return rows.get(generic)!
    if (rows.has(`${generic}[]`)) return rows.get(`${generic}[]`)!
    while (generic) {
        const cut = generic.endsWith('[]') ? generic.length - 2 : generic.lastIndexOf('.')
        if (cut <= 0) return null
        generic = generic.slice(0, cut)
        if (rows.has(generic)) return rows.get(generic)!
    }
    return null
}

/**
 * The kind one cited path states, or null where it decides nothing (a noun, a bare transition collection). Refuses loudly where the
 * path is on no row and no known prefix, its row has no kind, or it cites a transition the game does not hold.
 */
export function kindOfPath(path: string, facts: SectionFacts, rows: Map<string, string> = registerRowIndex()): Kind | null {
    const rooted = KIND_OF_ROOT.find(({ root }) => underRoot(path, root))
    if (rooted) return rooted.kind
    const row = rowOfPath(path, rows)
    if (!row) throw new Error(`sections: the cited path "${path}" is on no register row and no known prefix, so no section can be assigned to it`)
    const kind = KIND_OF_ROW[row]
    if (!kind) throw new Error(`sections: register row ${row} (cited as "${path}") has no kind in the section table`)
    if (kind === 'NAME') return null
    if (kind !== 'TRANSITION') return kind
    // A transition's kind is its element's; a bare citation of the collection names no element and decides nothing.
    const id = genericPath(path) === path ? null : firstElementId(path)
    if (id === null) return null
    const transition = facts.transitionKind(id)
    if (!transition) throw new Error(`sections: "${path}" cites transition ${id}, which the game does not hold`)
    return transition
}

/** One sentence's placement: its section, when the coach needs it, the kind that decided, and what stated that kind. */
export interface Placement {
    section: Section
    when: When
    kind: Kind
    by: string
}

/** The fields placement reads: what the sentence cites, its status, and the numbers its parts bind. */
export interface Placeable {
    status: string
    from: string[]
    parts?: { bindings: { path: string; as?: 'REQUIRED_LIMIT' }[] }[]
}

/**
 * **Assign one sentence its section** — the highest kind among its structural facts and the rows its citations are on. Never reads
 * its words, its producer's proposal, its goal or its activity.
 */
export function assignSection(instruction: Placeable, facts: SectionFacts, rows: Map<string, string> = registerRowIndex()): Placement {
    const found: { kind: Kind; by: string }[] = []
    if (instruction.status === 'PREFERENCE') found.push({ kind: 'ADJUSTMENT', by: 'status PREFERENCE' })
    for (const binding of (instruction.parts ?? []).flatMap(part => part.bindings ?? [])) {
        if (binding.as === 'REQUIRED_LIMIT' && facts.startingLines.has(binding.path)) found.push({ kind: 'ADJUSTMENT', by: `a required limit of ${binding.path}, a line the activity only starts at` })
    }
    for (const path of instruction.from) {
        const kind = kindOfPath(path, facts, rows)
        if (kind) found.push({ kind, by: path })
    }
    if (!found.length) throw new Error(`sections: nothing the sentence cites decides a section (${JSON.stringify(instruction.from)})`)
    const best = found.reduce((a, b) => (PRECEDENCE.indexOf(b.kind) < PRECEDENCE.indexOf(a.kind) ? b : a))
    const section = SECTION_OF_KIND[best.kind]
    return { section, when: WHEN_OF_SECTION[section], kind: best.kind, by: best.by }
}

/** Sentences in reading order: by section, keeping the order they were said in within each section. */
export function inSectionOrder<T extends { section: string }>(instructions: T[]): T[] {
    const rank = (section: string) => {
        const at = (SECTION_ORDER as readonly string[]).indexOf(section)
        return at < 0 ? SECTION_ORDER.length : at
    }
    return instructions.map((instruction, said) => ({ instruction, said })).sort((a, b) => rank(a.instruction.section) - rank(b.instruction.section) || a.said - b.said).map(({ instruction }) => instruction)
}
