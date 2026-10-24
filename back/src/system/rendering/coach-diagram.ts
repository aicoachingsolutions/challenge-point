/**
 * **The field diagram every viewer is served, and the check that it says only what the checked model says** — stage 5B of the
 * communication work, 22 October 2026. The model and its agreement with Coach Details (D0-D8) are `field-diagram.ts`'s; this module
 * composes, from a model that passed, the diagram a coach reads (`ServedActivity.diagram`), and holds it to that model (D9).
 *
 * His reply filed 22 October 2026, item 1, puts *"a simple diagram"* in the Coach Overview, and both levels *"must derive from the same
 * authorized activity representation"*. His reply filed 23 October 2026, item 5, governs what it shows:
 *
 *   - *"I'd prefer that target zones use a consistent, visually recognizable color [...] The diagram should distinguish team identity from
 *     scoring-area identity."* — a target carries no team look here: it says only where it is, and its label names whose it is in words
 *     (his term after the attacking team's noun). Team identity is `identity` on each team (one colour per team for its words, counts,
 *     arrow and starting area). Since stage C2 it follows the realized team, its place among the game's teams, never the role it holds:
 *     his reply filed 24 October 2026, item 4, *"For colors, I would generally prefer stable team identities, with building and pressing
 *     roles identified separately. If Team A is blue in Block 1, it should ordinarily remain blue in Block 2, even though its
 *     responsibilities change."* Where a team's noun (its role) does not stay with it across the blocks, each team carries the model's DRAFT
 *     neutral label ("Team A") and its noun is its role in the block, shown apart; each block says once what moves at the exchange into it
 *     (`exchange`, his *"the current activity also reassigns a [specialized role] and one outfield player between teams, so please check how
 *     best to represent that clearly"*; his role noun bracketed, as the coupling ratchet keeps a sport's nouns out of this layer), from the
 *     served Role exchange sentence's words, the teams named by their labels. Was (5B to C1): one look per noun, so a role's colour
 *     stayed with the role and the teams' colours swapped between the blocks.
 *   - *"the display still needs to distinguish physical target markings from whichever zones are active scoring objectives in the current
 *     block"* and *"each block's diagram emphasize its active objectives while retaining any physical markings that will be used later"* —
 *     every marked zone is carried with what it is in the block (`state`), the active targets apart; no word names another block (D9).
 *   - Goals: *"The diagram should draw goals only when the authorized activity representation includes them."* — objects only as the model
 *     holds them; an object a target scores at is drawn once, as the object, marked as a target (`target`), and is not repeated among the
 *     targets.
 *   - *"The diagram should not prescribe formations, passing patterns, or movement solutions that the activity does not authorize."* —
 *     nothing but the model's elements is carried: no player, position inside an area, path or movement.
 *
 * **Words.** Every word is the model's (his terms "marked line" and "target zone", its DRAFT diagram words, or a noun or count a served
 * sentence carries), or is composed from those by the DRAFT templates of `DIAGRAM_COMPOSITION` (the label "<team noun>'s target zone", the
 * accessible title and description). The accessible description is composed here, on the server, from the same model (the open issue of
 * stage 5A: the front composes no words). A coach's diagram carries no data key, id, path or citation: those stay in the administrator's
 * draft (`diagramDraft`).
 *
 * **D9** reads the coach's diagram against the checked model block by block: every element there, in the same order, at the same place,
 * with the model's words; the title, and since polish pass P4 the description and the block switcher's name, the ones composed from the
 * model (the description's attacking directions and starting areas are also pinned by the unit tests, independently of the composition);
 * since P7 the caption and a target line's legend word; one identity per team across the blocks (since C2 its place among the realized
 * teams, kept by the realized team); since C2 each team's label and each block's exchange sentences, the ones composed from the model; and
 * no word holding a data key or id of the games (`dataWordsOf`), a character no coach word has, or another block's name. Any finding
 * withholds the diagram only (the administrator's draft says why); the activity, and its overview, are served exactly as without it.
 *
 * Nothing here names a goal, a role, a sport term or a value: every number comes from the model, every word from it or the table below.
 */
import { areaLegendTexts, DIAGRAM_WORDS, DiagramBlock, DiagramFinding, DiagramInput, DiagramTeam, DimensionKind, FieldDiagram, FieldDiagramDraft, fieldDiagramDraftOf, dataWordsOf, Interval, keeperLegendText, keeperLegendTexts } from './field-diagram'

/* ------------------------------------------------------------------ what a coach is served ------------------------------------------------------------------ */

export interface CoachDiagramLine {
    along: Interval
    across: Interval
    /** The line the Details call "the marked line" (drawn bold, labelled with his term). */
    markedLine: boolean
    label: string | null
}

/** A marked zone: its outline is marked on the ground; `state` is what it is in this block (a target, inside a target, or only marked). */
export interface CoachDiagramZone {
    along: Interval
    across: Interval
    state: 'TARGET' | 'INSIDE_TARGET' | 'MARKED'
}

/** An active target of this block that is a region (a zone or a line); one look whichever team attacks it. */
export interface CoachDiagramTarget {
    along: Interval
    across: Interval
    line: boolean
    label: string | null
}

/** A physical object the game positions, at its realized place and size; `target` where a team scores at it in this block. */
export interface CoachDiagramObject {
    along: Interval
    across: Interval
    label: string | null
    target: boolean
}

/**
 * Stage L (24 October 2026): a marked area that is no zone across the width (a region bound to an object), drawn grey, never in the target
 * colour, labelled by the noun the Set up sentence marking it carries.
 */
export interface CoachDiagramArea {
    along: Interval
    across: Interval
    label: string | null
}

/**
 * Stage L: a specialized performer's marker, drawn with the object it defends (at the object's place, never a player's position), in a
 * colour neither team has, labelled by the performer's name as the roster sentence carries it.
 */
export interface CoachDiagramKeeper {
    along: Interval
    across: Interval
    label: string
}

export interface CoachDiagramTeam {
    /**
     * The team's look, the same in every block: since stage C2 its place among the realized teams (0 for the first), kept by the realized
     * team whatever role it holds (see the module doc). Was: 0 for the first team of the first block, by its noun.
     */
    identity: number
    /** Stage C2: the team's DRAFT neutral label ("Team A") where teams are labelled (its noun then says its role in this block); else null. */
    label: string | null
    noun: string | null
    /** Its counts as the Players sentence says them. */
    counts: string[]
    start: { along: Interval; across: Interval } | null
    /** The end line(s) it attacks: 0 or the area's length, along. */
    attacks: number[]
}

export interface CoachDiagramDimension {
    kind: DimensionKind
    axis: 'along' | 'across'
    from: number
    to: number
    label: string
}

export interface CoachDiagramBlock {
    /** "Block n" (DRAFT) where there are blocks; null for a game not played in blocks. */
    label: string | null
    /** The accessible title and description of this block's drawing (DRAFT composition, `DIAGRAM_COMPOSITION`). */
    title: string
    desc: string
    /**
     * Polish pass P7 (the 5B review): where the teams have no noun, the one sentence saying how they attack ("Each team attacks the line at
     * the other team's end.", as the game sentence says it), shown beside the drawing so its arrows are explained; null otherwise, and null
     * where no such sentence can be said (the arrows of unnamed teams are then not drawn: nothing is shown that cannot be labelled).
     */
    caption: string | null
    /**
     * Stage C2: what moves at the exchange into this block, one sentence per role the performers join (DRAFT composition from the served
     * Role exchange sentence's words and the teams' labels), shown beside the drawing; empty for a game not played in blocks or one whose
     * teams keep their performers.
     */
    exchange: string[]
    lines: CoachDiagramLine[]
    zones: CoachDiagramZone[]
    targets: CoachDiagramTarget[]
    objects: CoachDiagramObject[]
    teams: CoachDiagramTeam[]
    dimensions: CoachDiagramDimension[]
    /** Stage L: the marked areas (regions bound to an object); present only where there is one. */
    areas?: CoachDiagramArea[]
    /** Stage L: each specialized performer's marker; present only where there is one. */
    keepers?: CoachDiagramKeeper[]
}

/**
 * The kind of mark a legend word explains; `TARGET_LINE` (polish pass P7) a target that is a line, named by its own noun; since stage C2,
 * where teams are labelled, `TEAM_COLOUR` (a team's look, kept in every block), `ROLE` (the badge naming its role in the block) and `ATTACK`
 * (its arrow); since stage L, `MARKED_AREA` (a grey marked area, by its label) and `KEEPER` (a specialized performer's marker colour).
 */
export type CoachLegendKind = 'MARKED_LINE' | 'TARGET_ZONE' | 'TARGET_LINE' | 'STARTING_AREA' | 'TEAM_COLOUR' | 'ROLE' | 'ATTACK' | 'MARKED_AREA' | 'KEEPER'

/**
 * **The field diagram a coach is served**: geometry in metres along the area's length (`along`, 0 at one end line) and across its width,
 * and words; no id, data key, path or citation. Present only where the model agrees with Coach Details in every block (D0-D8) and this
 * diagram agrees with the model (D9).
 */
export interface CoachDiagram {
    area: { lengthM: number; widthM: number }
    /** Counts said for every team together (teams not told apart by role; neutral players), as the Players sentence says them. */
    counts: string[]
    /** The words a legend shows, each with the kind of mark it explains. */
    legend: { kind: CoachLegendKind; text: string }[]
    /** Polish pass P4 (the 5B review): the accessible name of the block switcher where there are blocks (DRAFT); null with one block. */
    tablistLabel: string | null
    blocks: CoachDiagramBlock[]
}

/* ------------------------------------------------------------------ the DRAFT composition ------------------------------------------------------------------ */

/**
 * **How the coach's words are composed from the model's** — every template DRAFT, awaiting his approval; his terms come from
 * `DIAGRAM_WORDS.his`, the unit from `DIAGRAM_WORDS.draft`. A part in angle brackets below is a word the model carries.
 *
 *   - `targetLabel`: "<team noun>'s target zone" (Set up says it in these words where it names each team's target zone).
 *   - `title`: "<activity title>: <block name>", or the activity title for a game not played in blocks.
 *   - the description: one sentence each for the area, the marked line, each marked zone (and what it is in the block), each active target
 *     that is no marked zone, each object, each team (its counts, starting area and attacking direction), and the counts said together.
 *   - `tablist` (polish pass P4): the block switcher's accessible name.
 *   - the caption (polish pass P7): the description's own sentence for how teams with no noun attack (`eachAttacksOther`).
 *   - stage C2: a labelled team's sentence opens "<label>, the <noun>" (`teamLabelled`); and the exchange into a block, "When you call this
 *     block, <performers> move from <label> to <label>, which becomes the <role noun>." (`exchange`), the performers and the role noun in the
 *     served Role exchange sentence's words ("When you call the next block, <performers> move to the team that becomes the <role noun>"),
 *     the teams by their labels; where a team has no label, that sentence's own form (`exchangeUnlabelled`).
 */
export const DIAGRAM_COMPOSITION = {
    targetLabel: (noun: string, term: string) => `${noun}'s ${term}`,
    title: (activity: string, block: string | null) => (block ? `${activity}: ${block}` : activity),
    tablist: 'Field diagram blocks',
    area: (length: string, width: string) => `${length} by ${width} area.`,
    endLine: (noun: string) => `the ${noun}'s end line`,
    someEndLine: 'one end line',
    end: (noun: string) => `the ${noun}'s end`,
    otherEnd: 'the other end',
    across: 'across the area',
    alongArea: 'along the area',
    wide: (width: string) => `${width} wide`,
    from: (distance: string, place: string) => `${distance} from ${place}`,
    markedLine: (name: string, way: string, where: string | null) => `A ${name} ${way}${where ? `, ${where}` : ''}.`,
    line: (way: string, where: string | null) => `A line is marked ${way}${where ? `, ${where}` : ''}.`,
    zone: (depth: string, width: string, where: string | null, state: string) => `A ${depth} zone is marked ${width}${where ? ` ${where}` : ''}${state}.`,
    zoneAt: (place: string) => `at ${place}`,
    zoneStarting: (distance: string, place: string) => `starting ${distance} from ${place}`,
    zoneIsTarget: (label: string) => `: the ${label}`,
    zoneInsideTarget: (label: string) => `, inside the ${label}`,
    target: (label: string, depth: string, place: string, width: string | null) => `The ${label} is the ${depth} at ${place}${width ? `, ${width}` : ''}.`,
    lineTarget: (noun: string, place: string) => `The ${noun}'s target is the line at ${place}.`,
    eachAttacksOther: (kind: string) => `Each team attacks the ${kind} at the other team's end.`,
    lineWord: 'line',
    object: (name: string, where: string, target: string | null) => `${name} is placed ${where}${target ? `: the ${target}'s target` : ''}.`,
    // Stage G, 23 October 2026 (DRAFT): an object named by its label takes "The" ("The <kind> is placed on ..."); was the label alone, capitalised.
    theObject: (label: string) => `The ${label}`,
    anObject: 'An object',
    objectWord: 'object',
    objectOn: (place: string) => `on ${place}`,
    team: (who: string, counts: string[], start: string | null, attack: string | null) =>
        `${who}${counts.length ? `: ${counts.join(' and ')}` : ''}${start ? `; ${start}` : ''}${attack ? `; ${attack}` : ''}.`,
    teamNamed: (noun: string) => `The ${noun}`,
    teamLabelled: (label: string, noun: string | null) => (noun ? `${label}, the ${noun}` : label),
    // The first block is the one the activity starts in, where nothing moves at kick-off: its exchange happens only on coming back to it.
    exchangeLead: (first: boolean) => (first ? 'When you return to this block' : 'When you call this block'),
    exchange: (lead: string, moving: string, verb: string, from: string, to: string, noun: string) => `${lead}, ${moving} ${verb} from ${from} to ${to}, which becomes the ${noun}.`,
    exchangeUnlabelled: (lead: string, moving: string, verb: string, noun: string) => `${lead}, ${moving} ${verb} to the team that becomes the ${noun}.`,
    moves: (total: number) => (total === 1 ? 'moves' : 'move'),
    startingArea: (word: string, near: string, far: string) => `${word} from ${near} to ${far}`,
    itsEndLine: 'its end line',
    theMarkedLine: (name: string) => `the ${name}`,
    fromItsEndLine: (distance: string) => `${distance} from its end line`,
    attacksToward: (place: string) => `attacks toward ${place}`,
    together: (counts: string[]) => `${counts.join(' and ')}.`,
    // Stage L (24 October 2026, DRAFT): a marked area by its label, size and end line; a specialized performer's marker, with what it defends.
    markedArea: (label: string, width: string, depth: string, where: string | null) => `A ${label} ${width} wide and ${depth} deep is marked${where ? ` ${where}` : ''}.`,
    keeper: (label: string, object: string | null) => `The ${label} wears a colour of its own${object ? ` and defends the ${object}` : ''}.`,
} as const

/** Characters no coach word holds: those of paths, keys and markup (D9). */
const NOT_IN_A_COACH_WORD = ['[', ']', '{', '}', '=', '_', '<', '>', '|']

const same = (a: Interval, b: Interval): boolean => a.from === b.from && a.to === b.to
const metres = (quantity: number): string => `${quantity} ${DIAGRAM_WORDS.draft.metres}`
const otherEnd = (end: number, lengthM: number): number => (end === 0 ? lengthM : 0)
/**
 * The key a team's look follows: since stage C2 the realized team it is (his reply filed 24 October 2026, item 4, "stable team
 * identities"), whatever role it holds in the block. Was: its role where it held one, else its designation.
 */
const lookKey = (team: DiagramTeam): string => team.handle
const nounOf = (team: DiagramTeam | undefined): string | null => team?.noun?.text ?? null
const labelOf = (team: DiagramTeam | undefined): string | null => team?.label?.text ?? null
/** How a team is named in its sentence of the description: by its label and role where it has a label, else by its noun. */
const whoOf = (team: DiagramTeam): string | null => (team.label ? DIAGRAM_COMPOSITION.teamLabelled(team.label.text, nounOf(team)) : nounOf(team) ? DIAGRAM_COMPOSITION.teamNamed(nounOf(team)!) : null)

/** **The sentences saying what moves at the exchange into a block** (stage C2, DRAFT composition): one per role the performers join. */
function exchangeSentencesOf(model: FieldDiagram, block: DiagramBlock): string[] {
    const C = DIAGRAM_COMPOSITION
    const lead = C.exchangeLead(model.blocks.indexOf(block) === 0)
    return block.exchanges.map(exchange => {
        const from = labelOf(block.teams.find(team => team.handle === exchange.from))
        const to = labelOf(block.teams.find(team => team.handle === exchange.to))
        const verb = C.moves(exchange.total)
        return from && to ? C.exchange(lead, exchange.moving.text, verb, from, to, exchange.noun.text) : C.exchangeUnlabelled(lead, exchange.moving.text, verb, exchange.noun.text)
    })
}
const isObjectTarget = (block: DiagramBlock, region: string): boolean => block.objects.some(object => object.elementId === region)

/** The label a target zone carries for a coach: his term after the attacking team's noun, or his term alone; a line target has none. */
function targetLabelOf(block: DiagramBlock, target: DiagramBlock['targets'][number]): string | null {
    if (!target.label) return null
    const noun = nounOf(block.teams.find(team => team.key === target.attackedBy))
    return noun ? DIAGRAM_COMPOSITION.targetLabel(noun, target.label.text) : target.label.text
}

/** The words of every target that is a line, as the model names them (polish pass P7): the legend's words for a green line. */
const lineTargetWordsOf = (model: FieldDiagram): Set<string> => new Set(model.blocks.flatMap(block => block.targets.filter(target => target.line && target.label).map(target => target.label!.text)))

/**
 * Each team's look, by the key it follows: since stage C2 its place among the realized teams (the model's `position`, held to the game by
 * D10, the same in every block). Was: in the order the first block listed the teams.
 */
function identitiesOf(model: FieldDiagram): Map<string, number> {
    const identities = new Map<string, number>()
    for (const block of model.blocks) for (const team of block.teams) if (!identities.has(lookKey(team))) identities.set(lookKey(team), team.position)
    return identities
}

/* ------------------------------------------------------------------ the description ------------------------------------------------------------------ */

/**
 * **How teams with no noun attack, in one sentence**, or null: where no team of the block has a noun, there is more than one, each attacks
 * one end, each the end the other starts from (every end attacked once), and every target is of one kind (an object by its noun, a line, or
 * his term). Said in the description and, since polish pass P7, as the caption that explains the drawing's arrows; null elsewhere.
 */
function relationOf(model: FieldDiagram, block: DiagramBlock): string | null {
    const C = DIAGRAM_COMPOSITION
    const { lengthM } = model.area
    if (block.teams.some(team => team.noun) || block.teams.length < 2) return null
    const ownEnd = (team: DiagramTeam): number | null => (team.attacks.length === 1 ? otherEnd(team.attacks[0].end, lengthM) : null)
    const ends = block.teams.map(ownEnd)
    const eachOther = block.teams.every(team => team.attacks.length === 1 && block.teams.some(other => other !== team && ownEnd(other) === team.attacks[0].end)) && new Set(ends).size === ends.length
    // What each attacks, named as the coach's diagram names it: an object by its noun, a line, or his term.
    const kindOf = (team: DiagramTeam): string | null => {
        const target = block.targets.find(entry => entry.attackedBy === team.key)
        if (!target) return null
        const object = block.objects.find(entry => entry.elementId === target.region)
        return object ? object.label?.text ?? C.objectWord : target.line ? C.lineWord : DIAGRAM_WORDS.his.targetZone
    }
    const kinds = new Set(block.teams.map(kindOf))
    const [kind] = [...kinds]
    return eachOther && kinds.size === 1 && kind ? C.eachAttacksOther(kind) : null
}

/** **The accessible description of one block**, composed from the model only (DRAFT, `DIAGRAM_COMPOSITION`). */
function describeBlock(model: FieldDiagram, block: DiagramBlock): string {
    const C = DIAGRAM_COMPOSITION
    const { lengthM, widthM } = model.area
    const ownEnd = (team: DiagramTeam): number | null => (team.attacks.length === 1 ? otherEnd(team.attacks[0].end, lengthM) : null)
    const ownerOf = (end: number): DiagramTeam | undefined => {
        const owners = block.teams.filter(team => ownEnd(team) === end)
        return owners.length === 1 ? owners[0] : undefined
    }
    const endLineOf = (end: number): string => {
        const noun = nounOf(ownerOf(end))
        return noun ? C.endLine(noun) : C.someEndLine
    }
    const endOf = (end: number): string => {
        const noun = nounOf(ownerOf(end))
        return noun ? C.end(noun) : C.otherEnd
    }
    const touched = (span: Interval): number | null => {
        const ends = [...(span.from === 0 ? [0] : []), ...(span.to === lengthM ? [lengthM] : [])]
        return ends.length === 1 ? ends[0] : null
    }
    const fullWidth = (across: Interval) => across.from === 0 && across.to === widthM
    const markedLines = block.markings.lines.filter(line => line.markedLine)
    const markedAt = new Set(markedLines.filter(line => line.along.from === line.along.to).map(line => line.along.from))
    const zoneEdges = new Set(block.markings.zones.flatMap(zone => [zone.along.from, zone.along.to]))
    const targetRegions = new Set(block.targets.map(target => target.region))
    const sentences: string[] = [C.area(metres(lengthM), metres(widthM))]

    // The markings: the marked line, any other line, each marked zone and what it is in this block.
    for (const line of block.markings.lines) {
        const acrossTheArea = line.along.from === line.along.to
        const way = acrossTheArea ? C.across : C.alongArea
        // Its distance from an end line, where a sentence states one: the rail of the line itself, or (markings set out once, whose marks
        // carry their own ids) the rail that runs from an end line to where this line lies.
        const offset = block.dimensions.find(dimension => dimension.kind === 'LINE_OFFSET' && (dimension.of === line.elementId || (acrossTheArea && line.markedLine && [dimension.from, dimension.to].includes(line.along.from))))
        const end = offset ? [offset.from, offset.to].find(value => value === 0 || value === lengthM) : undefined
        if (line.markedLine) {
            sentences.push(C.markedLine(line.label?.text ?? DIAGRAM_WORDS.his.markedLine, way, offset && end !== undefined ? C.from(offset.label.text, endLineOf(end)) : null))
            continue
        }
        if (targetRegions.has(line.elementId)) continue
        if (acrossTheArea && (line.along.from === 0 || line.along.from === lengthM || zoneEdges.has(line.along.from))) continue
        if (!acrossTheArea && (line.across.from === 0 || line.across.from === widthM)) continue
        sentences.push(C.line(way, acrossTheArea ? C.from(metres(line.along.from), endLineOf(0)) : null))
    }
    const within = (inner: Interval, outer: Interval) => outer.from <= inner.from && inner.to <= outer.to
    for (const zone of block.markings.zones) {
        const state = block.markedZones.find(entry => entry.zone === zone.elementId)
        // The target this zone is, or lies inside, read from the geometry as the model's zone state is.
        const target = state && state.of
            ? block.targets.find(entry => entry.attackedBy === state.of && (state.state === 'TARGET' ? same(entry.along, zone.along) && same(entry.across, zone.across) : within(zone.along, entry.along) && within(zone.across, entry.across)))
            : undefined
        const label = target ? targetLabelOf(block, target) : null
        const end = touched(zone.along)
        const where = end !== null ? C.zoneAt(endLineOf(end)) : C.zoneStarting(metres(zone.along.from), endLineOf(0))
        const what = label && state?.state === 'TARGET' ? C.zoneIsTarget(label) : label && state?.state === 'INSIDE_TARGET' ? C.zoneInsideTarget(label) : ''
        sentences.push(C.zone(metres(zone.along.to - zone.along.from), fullWidth(zone.across) ? C.across : C.wide(metres(zone.across.to - zone.across.from)), where, what))
    }
    // Stage L: each marked area, by its label, its size and the end line it is marked at.
    for (const area of block.markings.areas ?? []) {
        if (!area.label) continue
        const end = touched(area.along)
        sentences.push(C.markedArea(area.label.text, metres(area.across.to - area.across.from), metres(area.along.to - area.along.from), end !== null ? C.zoneAt(endLineOf(end)) : null))
    }

    // The active targets that are no marked zone and no object: a zone by its depth and end, a line by its end.
    for (const target of block.targets) {
        if (target.markedZone || isObjectTarget(block, target.region)) continue
        const end = touched(target.along)
        if (end === null) continue
        const attacker = block.teams.find(team => team.key === target.attackedBy)
        if (target.line) {
            if (nounOf(attacker)) sentences.push(C.lineTarget(nounOf(attacker)!, endOf(end)))
            continue
        }
        const label = targetLabelOf(block, target)
        if (label) sentences.push(C.target(label, metres(target.along.to - target.along.from), endOf(end), fullWidth(target.across) ? null : C.wide(metres(target.across.to - target.across.from))))
    }
    // Teams with no noun: one sentence where each attacks the other team's end with the same kind of target (`relationOf`).
    const relation = relationOf(model, block)
    if (relation) sentences.push(relation)

    // Objects, where the game positions them.
    for (const object of block.objects) {
        const end = touched(object.along)
        const scorer = block.targets.find(target => target.region === object.elementId)
        const where = end !== null ? C.objectOn(endLineOf(end)) : C.from(metres(object.along.from), endLineOf(0))
        sentences.push(C.object(object.label ? C.theObject(object.label.text) : C.anObject, where, scorer ? nounOf(block.teams.find(team => team.key === scorer.attackedBy)) : null))
    }
    // Stage L: each specialized performer's marker, with the object it defends.
    for (const keeper of block.keepers ?? []) {
        const object = block.objects.find(entry => entry.elementId === keeper.object)
        sentences.push(C.keeper(keeper.label.text, object?.label?.text ?? null))
    }

    // Each team the coach can tell apart: (since stage C2, its label and role where it has a label) its counts, its starting area and the
    // end it attacks.
    for (const team of block.teams) {
        const who = whoOf(team)
        if (!who) continue
        const home = ownEnd(team)
        let start: string | null = null
        if (team.start && home !== null) {
            const place = (at: number): string =>
                at === home ? C.itsEndLine : at === otherEnd(home, lengthM) ? endLineOf(at) : markedAt.has(at) ? C.theMarkedLine(DIAGRAM_WORDS.his.markedLine) : C.fromItsEndLine(metres(Math.abs(at - home)))
            const [near, far] = home === 0 ? [team.start.along.from, team.start.along.to] : [team.start.along.to, team.start.along.from]
            start = C.startingArea(DIAGRAM_WORDS.draft.startingArea, place(near), place(far))
        }
        const attack = team.attacks.length === 1 ? C.attacksToward(endOf(team.attacks[0].end)) : null
        sentences.push(C.team(who, team.counts.map(count => count.word.text), start, attack))
    }
    // Stage C2: what moves at the exchange into this block.
    sentences.push(...exchangeSentencesOf(model, block))
    if (model.counts.length) sentences.push(C.together(model.counts.map(count => count.word.text)))
    return sentences.join(' ')
}

/* ------------------------------------------------------------------ the projection ------------------------------------------------------------------ */

/** **The coach's diagram, composed from a model that agrees with Coach Details**: the model's elements and words, with no id or citation. */
export function coachDiagramOf(model: FieldDiagram, context: { title: string }): CoachDiagram {
    const identities = identitiesOf(model)
    const lineWords = lineTargetWordsOf(model)
    const areaWords = new Set(areaLegendTexts(model.blocks))
    const keeperWords = new Set(keeperLegendTexts(model.blocks))
    const legendKind = (text: string): CoachLegendKind | null =>
        areaWords.has(text)
            ? 'MARKED_AREA'
            : keeperWords.has(text)
              ? 'KEEPER'
              : text === DIAGRAM_WORDS.his.markedLine
            ? 'MARKED_LINE'
            : text === DIAGRAM_WORDS.his.targetZone
              ? 'TARGET_ZONE'
              : lineWords.has(text)
                ? 'TARGET_LINE'
                : text === DIAGRAM_WORDS.draft.startingArea
                  ? 'STARTING_AREA'
                  : text === DIAGRAM_WORDS.draft.teamColour
                    ? 'TEAM_COLOUR'
                    : text === DIAGRAM_WORDS.draft.role
                      ? 'ROLE'
                      : text === DIAGRAM_WORDS.draft.attack
                        ? 'ATTACK'
                        : null
    return {
        area: { lengthM: model.area.lengthM, widthM: model.area.widthM },
        counts: model.counts.map(count => count.word.text),
        legend: model.legend.flatMap(word => {
            const kind = legendKind(word.text)
            return kind ? [{ kind, text: word.text }] : []
        }),
        tablistLabel: model.blocks.length > 1 ? DIAGRAM_COMPOSITION.tablist : null,
        blocks: model.blocks.map(block => ({
            label: block.label?.text ?? null,
            title: DIAGRAM_COMPOSITION.title(context.title, block.label?.text ?? null),
            desc: describeBlock(model, block),
            caption: relationOf(model, block),
            exchange: exchangeSentencesOf(model, block),
            lines: block.markings.lines.map(line => ({ along: { ...line.along }, across: { ...line.across }, markedLine: line.markedLine, label: line.label?.text ?? null })),
            zones: block.markings.zones.map(zone => ({ along: { ...zone.along }, across: { ...zone.across }, state: block.markedZones.find(entry => entry.zone === zone.elementId)?.state ?? 'MARKED' })),
            targets: block.targets
                .filter(target => !isObjectTarget(block, target.region))
                .map(target => ({ along: { ...target.along }, across: { ...target.across }, line: target.line, label: targetLabelOf(block, target) })),
            objects: block.objects.map(object => ({ along: { ...object.along }, across: { ...object.across }, label: object.label?.text ?? null, target: block.targets.some(target => target.region === object.elementId) })),
            teams: block.teams.map(team => ({
                identity: identities.get(lookKey(team))!,
                label: labelOf(team),
                noun: nounOf(team),
                counts: team.counts.map(count => count.word.text),
                start: team.start ? { along: { ...team.start.along }, across: { ...team.start.across } } : null,
                attacks: team.attacks.map(attack => attack.end),
            })),
            dimensions: block.dimensions.map(dimension => ({ kind: dimension.kind, axis: dimension.axis, from: dimension.from, to: dimension.to, label: dimension.label.text })),
            // Stage L: only where the model holds a marked area or a marker, so every other coach's diagram is exactly what it was.
            ...(block.markings.areas?.length ? { areas: block.markings.areas.map(area => ({ along: { ...area.along }, across: { ...area.across }, label: area.label?.text ?? null })) } : {}),
            ...(block.keepers?.length ? { keepers: block.keepers.map(keeper => ({ along: { ...keeper.along }, across: { ...keeper.across }, label: keeper.label.text })) } : {}),
        })),
    }
}

/* ------------------------------------------------------------------ D9 ------------------------------------------------------------------ */

/**
 * **D9: does the coach's diagram say only what the checked model says?** Read against the model block by block (every element in order, at
 * its place, with the model's words; the label of a target composed from his term and the attacking team's noun only; one look per team
 * across the blocks), and every word read for data: no data key or id of the games, no character of a path, key or markup, no other
 * block's name. Each finding withholds the diagram, never the activity.
 */
export function checkCoachDiagram(coach: CoachDiagram, model: FieldDiagram, input: Pick<DiagramInput, 'games' | 'index'>, context: { title: string }): DiagramFinding[] {
    const findings: DiagramFinding[] = []
    const finding = (blockId: string | null, what: string) => findings.push({ rule: 'D9', blockId, what })
    const { forbidden, ids } = dataWordsOf(input)
    // A key spelled as data (capitals, digits and underscores) is refused anywhere in a word, as a token; any other data value (an actor
    // written as a noun, say) is refused as a whole word, as D6 refuses it, since the same noun may stand in a served count.
    const keyLike = [...forbidden].filter(entry => /^[A-Z][A-Z0-9_]{2,}$/.test(entry))
    const ordinals = model.blocks.map((_, n) => n + 1)
    /**
     * `performers` (stage L, a narrow RELAXATION, as D6's): a specialized performer's name, whole in `forbidden` as a value of the games, is
     * allowed as the label of that performer's marker only, where the checked model labels the marker so (D2 and D6 hold the model's label
     * to the defending row and the served roster sentence); every other word is held exactly as before.
     */
    const wordsOk = (words: (string | null)[], blockId: string | null, ordinal: number | null, performers: Set<string> = new Set()) => {
        for (const word of words) {
            if (word === null) continue
            if (typeof word !== 'string' || !word.trim()) {
                finding(blockId, `an empty or non-text word: ${JSON.stringify(word)}`)
                continue
            }
            if (forbidden.has(word) && !performers.has(word)) finding(blockId, `"${word}" is a data key or value, not a coach word`)
            const tokens = word.split(/[^A-Za-z0-9_]+/)
            const key = keyLike.find(entry => tokens.includes(entry))
            if (key) finding(blockId, `"${word}" holds the data key ${key}`)
            const id = ids.find(entry => word.includes(entry))
            if (id) finding(blockId, `"${word}" holds the id ${id}`)
            const character = NOT_IN_A_COACH_WORD.find(entry => word.includes(entry))
            if (character) finding(blockId, `"${word}" holds "${character}", which no coach word holds`)
            for (const other of ordinals) if (other !== ordinal && word.includes(`${DIAGRAM_WORDS.draft.block} ${other}`)) finding(blockId, `"${word}" names another block`)
        }
    }
    const keysAre = (what: string, value: object, allowed: string[], blockId: string | null) => {
        const extra = Object.keys(value).filter(key => !allowed.includes(key))
        if (extra.length) finding(blockId, `${what} holds ${extra.join(', ')}, which the coach's diagram does not carry`)
    }

    keysAre('the diagram', coach, ['area', 'counts', 'legend', 'tablistLabel', 'blocks'], null)
    if (coach.area.lengthM !== model.area.lengthM || coach.area.widthM !== model.area.widthM) finding(null, 'the area is not the model\'s')
    if (JSON.stringify(coach.counts) !== JSON.stringify(model.counts.map(count => count.word.text))) finding(null, 'the counts said together are not the model\'s')
    if (JSON.stringify(coach.legend.map(entry => entry.text)) !== JSON.stringify(model.legend.map(word => word.text))) finding(null, 'the legend is not the model\'s')
    // Each legend word explains its own kind of mark: his two terms, the starting area's name, or (polish pass P7) a target line's words.
    const lineWords = lineTargetWordsOf(model)
    const areaWords = new Set(areaLegendTexts(model.blocks))
    const keeperWords = new Set(keeperLegendTexts(model.blocks))
    const kindHolds: Record<CoachLegendKind, (text: string) => boolean> = {
        // Stage L: a marked area's label, and a specialized performer's marker words, each read again from the model.
        MARKED_AREA: text => areaWords.has(text),
        KEEPER: text => keeperWords.has(text),
        MARKED_LINE: text => text === DIAGRAM_WORDS.his.markedLine,
        TARGET_ZONE: text => text === DIAGRAM_WORDS.his.targetZone,
        TARGET_LINE: text => lineWords.has(text),
        STARTING_AREA: text => text === DIAGRAM_WORDS.draft.startingArea,
        // Stage C2: the three words for labelled teams, each explaining its own mark.
        TEAM_COLOUR: text => text === DIAGRAM_WORDS.draft.teamColour,
        ROLE: text => text === DIAGRAM_WORDS.draft.role,
        ATTACK: text => text === DIAGRAM_WORDS.draft.attack,
    }
    for (const entry of coach.legend) if (!kindHolds[entry.kind]?.(entry.text)) finding(null, `the legend gives "${entry.text}" to ${entry.kind}`)
    // Polish pass P4: the block switcher's accessible name where there are blocks, and none with one block.
    if ((coach.tablistLabel ?? null) !== (model.blocks.length > 1 ? DIAGRAM_COMPOSITION.tablist : null)) finding(null, `the block switcher is named ${JSON.stringify(coach.tablistLabel ?? null)}`)
    wordsOk([...coach.counts, ...coach.legend.map(entry => entry.text), coach.tablistLabel ?? null], null, null)
    if (coach.blocks.length !== model.blocks.length) finding(null, `${coach.blocks.length} blocks are shown and the model has ${model.blocks.length}`)

    const looks = new Map<string, number>()
    model.blocks.forEach((block, i) => {
        const shown = coach.blocks[i]
        const blockId = block.blockId
        if (!shown) return
        const ordinal = i + 1
        keysAre(`block ${ordinal}`, shown, ['label', 'title', 'desc', 'caption', 'exchange', 'lines', 'zones', 'targets', 'objects', 'teams', 'dimensions', 'areas', 'keepers'], blockId)
        for (const area of shown.areas ?? []) keysAre('a marked area', area, ['along', 'across', 'label'], blockId)
        for (const keeper of shown.keepers ?? []) keysAre('a marker', keeper, ['along', 'across', 'label'], blockId)
        // Stage L: the marked areas and the markers, in order, in place, with the model's words; none where the model has none.
        const areas = block.markings.areas ?? []
        const shownAreas = shown.areas ?? []
        if (shownAreas.length !== areas.length || shownAreas.some((area, n) => !same(area.along, areas[n].along) || !same(area.across, areas[n].across) || area.label !== (areas[n].label?.text ?? null))) {
            finding(blockId, 'the marked areas shown are not the model\'s')
        }
        if (shown.areas !== undefined && !areas.length) finding(blockId, 'the coach\'s diagram carries marked areas the model does not hold')
        const keepers = block.keepers ?? []
        const shownKeepers = shown.keepers ?? []
        if (shownKeepers.length !== keepers.length || shownKeepers.some((keeper, n) => !same(keeper.along, keepers[n].along) || !same(keeper.across, keepers[n].across) || keeper.label !== keepers[n].label.text)) {
            finding(blockId, 'the markers shown are not the model\'s')
        }
        if (shown.keepers !== undefined && !keepers.length) finding(blockId, 'the coach\'s diagram carries markers the model does not hold')
        for (const keeper of shownKeepers) if (keeperLegendText(keeper.label) && !coach.legend.some(entry => entry.kind === 'KEEPER' && entry.text === keeperLegendText(keeper.label))) finding(blockId, `the legend does not say what the ${keeper.label}'s marker is`)
        // As D8 holds the model: nothing beyond these keys, so no player, position inside an area, path or movement rides along.
        for (const line of shown.lines) keysAre('a line', line, ['along', 'across', 'markedLine', 'label'], blockId)
        for (const zone of shown.zones) keysAre('a zone', zone, ['along', 'across', 'state'], blockId)
        for (const target of shown.targets) keysAre('a target', target, ['along', 'across', 'line', 'label'], blockId)
        for (const object of shown.objects) keysAre('an object', object, ['along', 'across', 'label', 'target'], blockId)
        for (const team of shown.teams) {
            keysAre('a team', team, ['identity', 'label', 'noun', 'counts', 'start', 'attacks'], blockId)
            if (team.start) keysAre('a starting area', team.start, ['along', 'across'], blockId)
        }
        for (const dimension of shown.dimensions) keysAre('a dimension', dimension, ['kind', 'axis', 'from', 'to', 'label'], blockId)
        if (shown.label !== (block.label?.text ?? null)) finding(blockId, `the block is named "${shown.label}" and the model names it "${block.label?.text ?? null}"`)
        if (shown.title !== DIAGRAM_COMPOSITION.title(context.title, block.label?.text ?? null)) finding(blockId, `the title "${shown.title}" is not the activity's with this block's name`)
        if (!shown.desc) finding(blockId, 'the drawing has no description')
        // Polish pass P4 (the 5B review's should-fix 1): the description is the one composed from this block of the checked model, as the
        // title is; the unit tests pin its attacking directions and starting areas independently of the composition.
        else if (shown.desc !== describeBlock(model, block)) finding(blockId, 'the description is not the one composed from the model for this block')
        // Polish pass P7: the caption is the model's own sentence for how teams with no noun attack, or none.
        if ((shown.caption ?? null) !== relationOf(model, block)) finding(blockId, `the caption ${JSON.stringify(shown.caption ?? null)} is not the model's sentence for how its teams attack`)
        // Stage C2: what moves at the exchange into this block is the model's, in the sentences composed from it (D10 holds the model's to the
        // reassignments, the served Role exchange sentence and both blocks' counts).
        if (!Array.isArray(shown.exchange) || JSON.stringify(shown.exchange) !== JSON.stringify(exchangeSentencesOf(model, block))) finding(blockId, `the exchange sentences ${JSON.stringify(shown.exchange ?? null)} are not the model's for this block`)

        // The markings, in order and in place.
        const lines = block.markings.lines
        if (shown.lines.length !== lines.length || shown.lines.some((line, n) => !same(line.along, lines[n].along) || !same(line.across, lines[n].across) || line.markedLine !== lines[n].markedLine || line.label !== (lines[n].label?.text ?? null))) {
            finding(blockId, 'the lines shown are not the model\'s markings')
        }
        const zones = block.markings.zones
        const stateOf = (id: string) => block.markedZones.find(entry => entry.zone === id)?.state
        if (shown.zones.length !== zones.length || shown.zones.some((zone, n) => !same(zone.along, zones[n].along) || !same(zone.across, zones[n].across) || zone.state !== stateOf(zones[n].elementId))) {
            finding(blockId, 'the zones shown are not the model\'s marked zones, each as it is in this block')
        }
        // The active targets (an object a team scores at is shown once, as the object), with labels composed only from the model's words.
        const targets = block.targets.filter(target => !isObjectTarget(block, target.region))
        if (shown.targets.length !== targets.length || shown.targets.some((target, n) => !same(target.along, targets[n].along) || !same(target.across, targets[n].across) || target.line !== targets[n].line || target.label !== targetLabelOf(block, targets[n]))) {
            finding(blockId, 'the targets shown are not the model\'s active targets of this block')
        }
        const objects = block.objects
        if (shown.objects.length !== objects.length || shown.objects.some((object, n) => !same(object.along, objects[n].along) || !same(object.across, objects[n].across) || object.label !== (objects[n].label?.text ?? null) || object.target !== block.targets.some(target => target.region === objects[n].elementId))) {
            finding(blockId, 'the objects shown are not the model\'s')
        }
        // The teams: the model's nouns, counts, starting areas and attacking ends; one look per team, kept across the blocks.
        if (shown.teams.length !== block.teams.length) finding(blockId, `${shown.teams.length} teams are shown and the model has ${block.teams.length}`)
        block.teams.forEach((team, n) => {
            const view = shown.teams[n]
            if (!view) return
            if (view.noun !== nounOf(team) || (view.label ?? null) !== labelOf(team) || JSON.stringify(view.counts) !== JSON.stringify(team.counts.map(count => count.word.text))) finding(blockId, `the ${n + 1}. team's words are not the model's`)
            // Stage C2: its look is its place among the realized teams, so a team keeps its colour whatever role it holds.
            if (view.identity !== team.position) finding(blockId, `the ${n + 1}. team's look is ${view.identity} and its place among the realized teams is ${team.position}`)
            const start = team.start
            if (start ? !view.start || !same(view.start.along, start.along) || !same(view.start.across, start.across) : view.start !== null) finding(blockId, `the ${n + 1}. team's starting area is not the model's`)
            if (JSON.stringify(view.attacks) !== JSON.stringify(team.attacks.map(attack => attack.end))) finding(blockId, `the ${n + 1}. team's attacking direction is not the model's`)
            const key = lookKey(team)
            if (looks.has(key) ? looks.get(key) !== view.identity : [...looks.values()].includes(view.identity)) finding(blockId, `the ${n + 1}. team does not keep one look of its own across the blocks`)
            else looks.set(key, view.identity)
        })
        const dimensions = block.dimensions
        if (shown.dimensions.length !== dimensions.length || shown.dimensions.some((dimension, n) => dimension.kind !== dimensions[n].kind || dimension.axis !== dimensions[n].axis || dimension.from !== dimensions[n].from || dimension.to !== dimensions[n].to || dimension.label !== dimensions[n].label.text)) {
            finding(blockId, 'the dimensions shown are not the model\'s')
        }
        // Every word: no data, no other block.
        wordsOk(
            [
                shown.label,
                shown.title,
                shown.desc,
                shown.caption ?? null,
                ...(Array.isArray(shown.exchange) ? shown.exchange : []),
                ...shown.lines.map(line => line.label),
                ...shown.targets.map(target => target.label),
                ...shown.objects.map(object => object.label),
                ...(shown.areas ?? []).map(area => area.label),
                ...shown.teams.flatMap(team => [team.label ?? null, team.noun, ...team.counts]),
                ...shown.dimensions.map(dimension => dimension.label),
            ],
            blockId,
            model.blocks.length > 1 ? ordinal : null,
        )
        // Stage L: each marker's label, its performer's name allowed where the checked model labels that marker so.
        wordsOk(
            shownKeepers.map(keeper => keeper.label),
            blockId,
            model.blocks.length > 1 ? ordinal : null,
            new Set(keepers.map(keeper => keeper.label.text)),
        )
    })
    return findings
}

/* ------------------------------------------------------------------ serving ------------------------------------------------------------------ */

/** What serving the diagram gives the build: the coach's diagram (or null, withheld) and the administrator's draft. */
export interface DiagramOutcome {
    diagram: CoachDiagram | null
    draft: FieldDiagramDraft
}

/**
 * **Build the model, check it (D0-D8), compose the coach's diagram and check it (D9); serve it only where all agree** — stage 5B. Whatever
 * fails withholds the diagram only: the draft says why, for an administrator, and the activity is untouched. `options.project` hands a test
 * another composition.
 */
export function diagramForServing(input: DiagramInput, context: { title: string }, options: { project?: (model: FieldDiagram, context: { title: string }) => CoachDiagram } = {}): DiagramOutcome {
    const draft = fieldDiagramDraftOf(input)
    if (draft.verdict !== 'DRAWN' || !draft.diagram) return { diagram: null, draft: { ...draft, served: false } }
    let coach: CoachDiagram | null = null
    let findings: DiagramFinding[]
    try {
        coach = (options.project ?? coachDiagramOf)(draft.diagram, context)
        findings = checkCoachDiagram(coach, draft.diagram, input, context)
    } catch (error) {
        findings = [{ rule: 'D9', blockId: null, what: `the coach's diagram could not be composed: ${error instanceof Error ? error.message : String(error)}` }]
    }
    if (findings.length || !coach) return { diagram: null, draft: { ...draft, served: false, verdict: 'WITHHELD', findings } }
    return { diagram: coach, draft: { ...draft, served: true } }
}
