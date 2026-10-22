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
 *     arrow and starting area), assigned by the noun the coach reads (the role, where the game has roles; else the team), so a team's words
 *     have the same look in every block.
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
 * with the model's words; one identity per team across the blocks; and no word holding a data key or id of the games (`dataWordsOf`), a
 * character no coach word has, or another block's name. Any finding withholds the diagram only (the administrator's draft says why); the
 * activity, and its overview, are served exactly as without it.
 *
 * Nothing here names a goal, a role, a sport term or a value: every number comes from the model, every word from it or the table below.
 */
import { DIAGRAM_WORDS, DiagramBlock, DiagramFinding, DiagramInput, DiagramTeam, DimensionKind, FieldDiagram, FieldDiagramDraft, fieldDiagramDraftOf, dataWordsOf, Interval } from './field-diagram'

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

export interface CoachDiagramTeam {
    /** The team's look, the same in every block: 0 for the first team of the first block, and so on (see the module doc). */
    identity: number
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
    lines: CoachDiagramLine[]
    zones: CoachDiagramZone[]
    targets: CoachDiagramTarget[]
    objects: CoachDiagramObject[]
    teams: CoachDiagramTeam[]
    dimensions: CoachDiagramDimension[]
}

export type CoachLegendKind = 'MARKED_LINE' | 'TARGET_ZONE' | 'STARTING_AREA'

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
 */
export const DIAGRAM_COMPOSITION = {
    targetLabel: (noun: string, term: string) => `${noun}'s ${term}`,
    title: (activity: string, block: string | null) => (block ? `${activity}: ${block}` : activity),
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
    anObject: 'An object',
    objectWord: 'object',
    objectOn: (place: string) => `on ${place}`,
    team: (noun: string, counts: string[], start: string | null, attack: string | null) =>
        `The ${noun}${counts.length ? `: ${counts.join(' and ')}` : ''}${start ? `; ${start}` : ''}${attack ? `; ${attack}` : ''}.`,
    startingArea: (word: string, near: string, far: string) => `${word} from ${near} to ${far}`,
    itsEndLine: 'its end line',
    theMarkedLine: (name: string) => `the ${name}`,
    fromItsEndLine: (distance: string) => `${distance} from its end line`,
    attacksToward: (place: string) => `attacks toward ${place}`,
    together: (counts: string[]) => `${counts.join(' and ')}.`,
} as const

/** Characters no coach word holds: those of paths, keys and markup (D9). */
const NOT_IN_A_COACH_WORD = ['[', ']', '{', '}', '=', '_', '<', '>', '|']

const same = (a: Interval, b: Interval): boolean => a.from === b.from && a.to === b.to
const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
const metres = (quantity: number): string => `${quantity} ${DIAGRAM_WORDS.draft.metres}`
const otherEnd = (end: number, lengthM: number): number => (end === 0 ? lengthM : 0)
/** The key a team's look follows: its role where it holds one, else its designation. */
const lookKey = (team: DiagramTeam): string => team.role ?? team.designation ?? team.key
const nounOf = (team: DiagramTeam | undefined): string | null => team?.noun?.text ?? null
const isObjectTarget = (block: DiagramBlock, region: string): boolean => block.objects.some(object => object.elementId === region)

/** The label a target zone carries for a coach: his term after the attacking team's noun, or his term alone; a line target has none. */
function targetLabelOf(block: DiagramBlock, target: DiagramBlock['targets'][number]): string | null {
    if (!target.label) return null
    const noun = nounOf(block.teams.find(team => team.key === target.attackedBy))
    return noun ? DIAGRAM_COMPOSITION.targetLabel(noun, target.label.text) : target.label.text
}

/** Each team's look, by the key it follows, in the order the first block lists the teams (then any later block's new key). */
function identitiesOf(model: FieldDiagram): Map<string, number> {
    const identities = new Map<string, number>()
    for (const block of model.blocks) for (const team of block.teams) if (!identities.has(lookKey(team))) identities.set(lookKey(team), identities.size)
    return identities
}

/* ------------------------------------------------------------------ the description ------------------------------------------------------------------ */

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

    // The active targets that are no marked zone and no object: a zone by its depth and end, a line by its end.
    const named = block.teams.some(team => team.noun)
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
    // Teams with no noun: one sentence where each attacks the other team's end with the same kind of target.
    if (!named && block.teams.length > 1) {
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
        if (eachOther && kinds.size === 1 && kind) sentences.push(C.eachAttacksOther(kind))
    }

    // Objects, where the game positions them.
    for (const object of block.objects) {
        const end = touched(object.along)
        const scorer = block.targets.find(target => target.region === object.elementId)
        const where = end !== null ? C.objectOn(endLineOf(end)) : C.from(metres(object.along.from), endLineOf(0))
        sentences.push(C.object(object.label ? capital(object.label.text) : C.anObject, where, scorer ? nounOf(block.teams.find(team => team.key === scorer.attackedBy)) : null))
    }

    // Each team the coach can tell apart: its counts, its starting area and the end it attacks.
    for (const team of block.teams) {
        const noun = nounOf(team)
        if (!noun) continue
        const home = ownEnd(team)
        let start: string | null = null
        if (team.start && home !== null) {
            const place = (at: number): string =>
                at === home ? C.itsEndLine : at === otherEnd(home, lengthM) ? endLineOf(at) : markedAt.has(at) ? C.theMarkedLine(DIAGRAM_WORDS.his.markedLine) : C.fromItsEndLine(metres(Math.abs(at - home)))
            const [near, far] = home === 0 ? [team.start.along.from, team.start.along.to] : [team.start.along.to, team.start.along.from]
            start = C.startingArea(DIAGRAM_WORDS.draft.startingArea, place(near), place(far))
        }
        const attack = team.attacks.length === 1 ? C.attacksToward(endOf(team.attacks[0].end)) : null
        sentences.push(C.team(noun, team.counts.map(count => count.word.text), start, attack))
    }
    if (model.counts.length) sentences.push(C.together(model.counts.map(count => count.word.text)))
    return sentences.join(' ')
}

/* ------------------------------------------------------------------ the projection ------------------------------------------------------------------ */

/** **The coach's diagram, composed from a model that agrees with Coach Details**: the model's elements and words, with no id or citation. */
export function coachDiagramOf(model: FieldDiagram, context: { title: string }): CoachDiagram {
    const identities = identitiesOf(model)
    const legendKind = (text: string): CoachLegendKind | null =>
        text === DIAGRAM_WORDS.his.markedLine ? 'MARKED_LINE' : text === DIAGRAM_WORDS.his.targetZone ? 'TARGET_ZONE' : text === DIAGRAM_WORDS.draft.startingArea ? 'STARTING_AREA' : null
    return {
        area: { lengthM: model.area.lengthM, widthM: model.area.widthM },
        counts: model.counts.map(count => count.word.text),
        legend: model.legend.flatMap(word => {
            const kind = legendKind(word.text)
            return kind ? [{ kind, text: word.text }] : []
        }),
        blocks: model.blocks.map(block => ({
            label: block.label?.text ?? null,
            title: DIAGRAM_COMPOSITION.title(context.title, block.label?.text ?? null),
            desc: describeBlock(model, block),
            lines: block.markings.lines.map(line => ({ along: { ...line.along }, across: { ...line.across }, markedLine: line.markedLine, label: line.label?.text ?? null })),
            zones: block.markings.zones.map(zone => ({ along: { ...zone.along }, across: { ...zone.across }, state: block.markedZones.find(entry => entry.zone === zone.elementId)?.state ?? 'MARKED' })),
            targets: block.targets
                .filter(target => !isObjectTarget(block, target.region))
                .map(target => ({ along: { ...target.along }, across: { ...target.across }, line: target.line, label: targetLabelOf(block, target) })),
            objects: block.objects.map(object => ({ along: { ...object.along }, across: { ...object.across }, label: object.label?.text ?? null, target: block.targets.some(target => target.region === object.elementId) })),
            teams: block.teams.map(team => ({
                identity: identities.get(lookKey(team))!,
                noun: nounOf(team),
                counts: team.counts.map(count => count.word.text),
                start: team.start ? { along: { ...team.start.along }, across: { ...team.start.across } } : null,
                attacks: team.attacks.map(attack => attack.end),
            })),
            dimensions: block.dimensions.map(dimension => ({ kind: dimension.kind, axis: dimension.axis, from: dimension.from, to: dimension.to, label: dimension.label.text })),
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
    const wordsOk = (words: (string | null)[], blockId: string | null, ordinal: number | null) => {
        for (const word of words) {
            if (word === null) continue
            if (typeof word !== 'string' || !word.trim()) {
                finding(blockId, `an empty or non-text word: ${JSON.stringify(word)}`)
                continue
            }
            if (forbidden.has(word)) finding(blockId, `"${word}" is a data key or value, not a coach word`)
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

    keysAre('the diagram', coach, ['area', 'counts', 'legend', 'blocks'], null)
    if (coach.area.lengthM !== model.area.lengthM || coach.area.widthM !== model.area.widthM) finding(null, 'the area is not the model\'s')
    if (JSON.stringify(coach.counts) !== JSON.stringify(model.counts.map(count => count.word.text))) finding(null, 'the counts said together are not the model\'s')
    if (JSON.stringify(coach.legend.map(entry => entry.text)) !== JSON.stringify(model.legend.map(word => word.text))) finding(null, 'the legend is not the model\'s')
    const kinds: Record<CoachLegendKind, string> = { MARKED_LINE: DIAGRAM_WORDS.his.markedLine, TARGET_ZONE: DIAGRAM_WORDS.his.targetZone, STARTING_AREA: DIAGRAM_WORDS.draft.startingArea }
    for (const entry of coach.legend) if (kinds[entry.kind] !== entry.text) finding(null, `the legend gives "${entry.text}" to ${entry.kind}`)
    wordsOk([...coach.counts, ...coach.legend.map(entry => entry.text)], null, null)
    if (coach.blocks.length !== model.blocks.length) finding(null, `${coach.blocks.length} blocks are shown and the model has ${model.blocks.length}`)

    const looks = new Map<string, number>()
    model.blocks.forEach((block, i) => {
        const shown = coach.blocks[i]
        const blockId = block.blockId
        if (!shown) return
        const ordinal = i + 1
        keysAre(`block ${ordinal}`, shown, ['label', 'title', 'desc', 'lines', 'zones', 'targets', 'objects', 'teams', 'dimensions'], blockId)
        // As D8 holds the model: nothing beyond these keys, so no player, position inside an area, path or movement rides along.
        for (const line of shown.lines) keysAre('a line', line, ['along', 'across', 'markedLine', 'label'], blockId)
        for (const zone of shown.zones) keysAre('a zone', zone, ['along', 'across', 'state'], blockId)
        for (const target of shown.targets) keysAre('a target', target, ['along', 'across', 'line', 'label'], blockId)
        for (const object of shown.objects) keysAre('an object', object, ['along', 'across', 'label', 'target'], blockId)
        for (const team of shown.teams) {
            keysAre('a team', team, ['identity', 'noun', 'counts', 'start', 'attacks'], blockId)
            if (team.start) keysAre('a starting area', team.start, ['along', 'across'], blockId)
        }
        for (const dimension of shown.dimensions) keysAre('a dimension', dimension, ['kind', 'axis', 'from', 'to', 'label'], blockId)
        if (shown.label !== (block.label?.text ?? null)) finding(blockId, `the block is named "${shown.label}" and the model names it "${block.label?.text ?? null}"`)
        if (shown.title !== DIAGRAM_COMPOSITION.title(context.title, block.label?.text ?? null)) finding(blockId, `the title "${shown.title}" is not the activity's with this block's name`)
        if (!shown.desc) finding(blockId, 'the drawing has no description')

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
            if (view.noun !== nounOf(team) || JSON.stringify(view.counts) !== JSON.stringify(team.counts.map(count => count.word.text))) finding(blockId, `the ${n + 1}. team's words are not the model's`)
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
                ...shown.lines.map(line => line.label),
                ...shown.targets.map(target => target.label),
                ...shown.objects.map(object => object.label),
                ...shown.teams.flatMap(team => [team.noun, ...team.counts]),
                ...shown.dimensions.map(dimension => dimension.label),
            ],
            blockId,
            model.blocks.length > 1 ? ordinal : null,
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
