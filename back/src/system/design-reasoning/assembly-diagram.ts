/**
 * **A DRAFT diagram drawn from the offline configuration record** — review pathway only, offline (Christian's reply of 6 November 2026,
 * section 9: *"Please produce a draft diagram from the offline configuration record"*, without changing the live application or the
 * checked pathway's diagram generation / *"It should not introduce additional design choices or imply that unresolved values have been
 * authorized."* / *"Please flag any remaining ambiguity that prevents accurate rendering."*).
 *
 * WHAT IT IS. A pure function from the assembled activity, the validated record and the DRAFT wording to a model, and a second pure function
 * from the model to an SVG string (no DOM, no clock). It reads configuration values only through the record's bindings, and the geometry
 * of the target zones only through the record's placement geometry (data, labelled OURS; an unmapped placement throws). Every drawn element
 * names the paths it reads, their values, their class and label as the assembly computed them, and how each reached the record; the key
 * prints the same class and label the report prints. Every word comes from the DRAFT diagram words (wording file), a value with its unit,
 * a display name the assembly already read, or Christian's class words. Positions the record does not hold are computed and said to be:
 * the halfway line halfway along the length, the centre mark at the centre of the area.
 *
 * WHAT IT IS NOT. Not the checked pathway's diagram (nothing in the rendering layer is read or changed), not served, not a coach diagram: a review
 * drawing with a banner saying so. It draws no goal, no centre circle, no player, no position, no starting area, no restart spot and no
 * region the record does not hold; what it does not draw is listed below the field with the reason, and every ambiguity is flagged.
 */
import { AssembledActivity, AssembledChoice, AssembledValue, BindingKey, classAndLabel, Experiment, HowReached, SixClass, Wording } from './assembly'

/** One value the diagram reads, as the assembly computed it. */
export interface DiagramValue {
    path: string
    value: AssembledValue
    sixClass: SixClass
    howReached: HowReached
    label: string
}

/** A text box on the drawing (pixels), with the paths it shows; `inside` is true for a box within the area outline. */
export interface DiagramText {
    id: string
    text: string
    x: number
    y: number
    w: number
    h: number
    size: number
    anchor: 'start' | 'middle'
    inside: boolean
    readsPaths: string[]
    colour: string
    weight?: 'bold'
    italic?: true
}

export interface DiagramShape {
    id: string
    kind: 'outline' | 'zone' | 'line' | 'mark' | 'arrow' | 'dimension'
    /** Pixels: a rectangle (x, y, w, h), a line or arrow (x, y to x2, y2), or a mark (x, y, r). */
    x: number
    y: number
    w?: number
    h?: number
    x2?: number
    y2?: number
    r?: number
    colour: string
    readsPaths: string[]
    /** How a position the record does not hold was computed (said, never hidden). */
    computed?: string
}

export interface DiagramKeyLine {
    path: string
    element: string
    valueText: string
    classAndLabel: string
    route: 'read by code' | 'entered'
}

export interface DiagramModel {
    standing: string
    /** The area and the zones, in metres along the length (end line to end line) and across the width. */
    metres: { lengthM: number; widthM: number; depthM: number; zones: Array<{ alongFromM: number; alongToM: number; acrossFromM: number; acrossToM: number }>; halfwayAlongM: number; centre: { alongM: number; acrossM: number } }
    values: DiagramValue[]
    readsPaths: string[]
    shapes: DiagramShape[]
    texts: DiagramText[]
    key: DiagramKeyLine[]
    notDrawn: Array<{ what: string; why: string }>
    flags: string[]
    width: number
    height: number
    /** The area outline in pixels, for the checks that nothing team-coloured lies inside it. */
    outline: { x: number; y: number; w: number; h: number }
    colours: { zone: string; teams: string[]; marking: string; outline: string }
}

// Presentation only (OURS): pixels per metre, the page, and the colours. Team colours are two hues apart from the one target-zone green
// (the coach communication standard: target zones share one colour, apart from team identity); none is a bib colour (the record names none).
const PX = 14
const MARGIN = 40
const PAGE_W = 1240
const FONT = 11
const CHAR = 0.6
const COLOURS = { zone: '#2e9e4f', teams: ['#1f5fbf', '#b5470f'], marking: '#8a8a8a', outline: '#333333', text: '#222222', flag: '#7a4a00' }

/** A refusal, naming the record path it concerns where there is one (so the mutation loop can classify it). */
const fail = (why: string, path: string | null = null): never => {
    throw new Error(`assembly-diagram${path ? ` (${path})` : ''}: ${why}`)
}

/** Words wrapped to a width in characters (a word longer than the width stands alone). */
function wrap(text: string, chars: number): string[] {
    const out: string[] = []
    let line = ''
    for (const word of text.split(' ')) {
        if (line && line.length + 1 + word.length > chars) {
            out.push(line)
            line = word
        } else line = line ? `${line} ${word}` : word
    }
    if (line) out.push(line)
    return out
}

/** A diagram word with its binding placeholders filled from the assembled values (an unknown placeholder throws). */
function fill(text: string, rendered: (b: BindingKey) => string, keys: readonly string[]): string {
    return text.replace(/\{([A-Za-z]+)\}/g, (_, b: string) => {
        if (keys.indexOf(b) < 0) return fail(`the diagram word placeholder {${b}} is not a binding`)
        return rendered(b as BindingKey)
    })
}

/**
 * The model, from the assembled activity, the record and the DRAFT wording. Throws on an unmapped placement, a value with no diagram words,
 * a number where a number is drawn but the value is not one, and a value the record holds that the diagram cannot show faithfully.
 */
export function assemblyDiagramOf(activity: AssembledActivity, experiment: Experiment, wording: Wording): DiagramModel {
    const words = wording.diagram
    const b = experiment.bindings
    const keys = Object.keys(b)
    const at = (key: BindingKey): AssembledChoice => {
        const c = activity.choices.find((x) => x.path === b[key])
        if (!c) return fail(`the binding ${key} names no assembled value`)
        return c
    }
    const num = (key: BindingKey): number => {
        const v = at(key).value
        if (typeof v !== 'number') return fail('the value must be a number to draw', b[key])
        return v
    }
    const valueWords = (key: BindingKey): string => {
        const c = at(key)
        // A value the assembly already rendered as a display name (read by code, or an id it named) is printed as rendered.
        if (c.howReached === 'READ_BY_CODE' || (typeof c.value === 'string' && c.rendered !== c.value)) return c.rendered
        if (c.value === null) return words.noValue
        if (typeof c.value === 'number') return `${c.value}${words.units[key] ?? ''}`
        const w = (words.valueWords[key] ?? {})[String(c.value)]
        if (!w) return fail(`no diagram words for the value ${String(c.value)}`, c.path)
        return w
    }
    const rendered = (key: BindingKey): string => (typeof at(key).value === 'number' ? String(at(key).value) : valueWords(key))

    // Geometry, read from the record: the placement's zones through the placement geometry (OURS data), the rest computed and said so.
    const lengthM = num('areaLength')
    const widthM = num('areaWidth')
    const depthM = num('targetZoneDepth')
    const placement = String(at('targetZonePlacement').value)
    const geometry = experiment.placementGeometry[placement]
    if (!geometry) return fail(`the placement ${placement} has no placement geometry`, b.targetZonePlacement)
    if (geometry.zones.length !== experiment.placementZoneCount[placement]) fail(`the placement geometry for ${placement} draws ${geometry.zones.length} zones, the zone count is ${String(experiment.placementZoneCount[placement])}`, b.targetZonePlacement)
    if (at('includesEndZones').value !== true) fail('the zones are drawn inside the length only when the record says so', b.includesEndZones)
    const zones = geometry.zones.map((z) => ({
        alongFromM: z.along === 'FROM_START' ? 0 : lengthM - depthM,
        alongToM: z.along === 'FROM_START' ? depthM : lengthM,
        acrossFromM: 0,
        acrossToM: geometry.across === 'FULL_WIDTH' ? widthM : fail(`unknown extent ${geometry.across}`),
    }))
    const halfwayAlongM = lengthM / 2
    const centre = { alongM: lengthM / 2, acrossM: widthM / 2 }
    const teams = num('teamCount')
    if (teams !== words.teamLabels.length) fail(`${teams} teams, ${words.teamLabels.length} drawing labels`, b.teamCount)
    if (at('equalNumbers').value !== 'EQUAL') fail('the team counts are drawn equal only when the record says so', b.equalNumbers)
    const perTeam = num('playersPerTeam')

    // The values the diagram reads, each as the assembly computed it; the key prints the same class and label as the report.
    const drawnBindings = words.elements.map((e) => e.binding)
    const values: DiagramValue[] = drawnBindings.map((key) => {
        const c = at(key)
        return { path: c.path, value: c.value, sixClass: c.sixClass, howReached: c.howReached, label: c.label }
    })
    const key: DiagramKeyLine[] = words.elements.map((e) => {
        const c = at(e.binding)
        return { path: c.path, element: e.name, valueText: valueWords(e.binding), classAndLabel: classAndLabel(c), route: c.howReached === 'READ_BY_CODE' ? 'read by code' : 'entered' }
    })

    // Layout (pixels; OURS presentation). The length runs left to right; Team A's words and arrow sit above the outline, Team B's below.
    const texts: DiagramText[] = []
    const shapes: DiagramShape[] = []
    const lineH = Math.round(FONT * 1.45)
    let y = MARGIN
    const textBlock = (id: string, text: string, size: number, colour: string, readsPaths: string[], extra: Partial<DiagramText> = {}) => {
        for (const [i, line] of wrap(text, Math.floor((PAGE_W - 2 * MARGIN) / (size * CHAR))).entries()) {
            texts.push({ id: `${id}${i ? `-${i}` : ''}`, text: line, x: MARGIN, y: y + size, w: line.length * size * CHAR, h: size * 1.3, size, anchor: 'start', inside: false, readsPaths, colour, ...extra })
            y += Math.round(size * 1.45)
        }
    }
    textBlock('banner', fill(words.banner.split('{goal}').join(experiment.learningGoalId), rendered, keys), 13, COLOURS.flag, [], { weight: 'bold' })
    y += 10
    const fx = MARGIN + 60
    const fw = lengthM * PX
    const fh = widthM * PX
    // The length's dimension, above everything else that touches the field.
    const dimY = y + 18
    shapes.push({ id: 'dimension-length', kind: 'dimension', x: fx, y: dimY, x2: fx + fw, y2: dimY, colour: COLOURS.marking, readsPaths: [b.areaLength] })
    const lengthLabel = `${lengthM}${words.units.areaLength ?? ''}`
    texts.push({ id: 'label-length', text: lengthLabel, x: fx + fw / 2, y: dimY - 5, w: lengthLabel.length * FONT * CHAR, h: FONT * 1.3, size: FONT, anchor: 'middle', inside: false, readsPaths: [b.areaLength], colour: COLOURS.text })
    // Team A's row (above the outline): words and count, then one arrow along the length toward the zone it attacks.
    const teamRow = (i: number, rowY: number) => {
        const towardEnd = words.teamAttacks[i] === 'TOWARD_END'
        const label = `${words.teamLabels[i]}: ${fill(words.teamCount, (k) => (k === 'playersPerTeam' ? String(perTeam) : rendered(k)), keys)}`
        texts.push({ id: `team-${i + 1}`, text: label, x: fx, y: rowY + 4, w: label.length * 12 * CHAR, h: 12 * 1.3, size: 12, anchor: 'start', inside: false, readsPaths: [b.teamCount, b.playersPerTeam, b.equalNumbers], colour: COLOURS.teams[i], weight: 'bold' })
        const a0 = fx + 170
        const a1 = fx + fw - 40
        shapes.push({ id: `arrow-${i + 1}`, kind: 'arrow', x: towardEnd ? a0 : a1, y: rowY, x2: towardEnd ? a1 : a0, y2: rowY, colour: COLOURS.teams[i], readsPaths: [b.attackDirections] })
    }
    const fy = dimY + 46
    teamRow(0, fy - 20)
    shapes.push({ id: 'area', kind: 'outline', x: fx, y: fy, w: fw, h: fh, colour: COLOURS.outline, readsPaths: [b.areaLength, b.areaWidth] })
    for (const [i, z] of zones.entries()) {
        shapes.push({ id: `zone-${i + 1}`, kind: 'zone', x: fx + z.alongFromM * PX, y: fy + z.acrossFromM * PX, w: (z.alongToM - z.alongFromM) * PX, h: (z.acrossToM - z.acrossFromM) * PX, colour: COLOURS.zone, readsPaths: [b.targetZonePlacement, b.targetZoneDepth, b.areaLength, b.areaWidth, b.scoringEvent, b.includesEndZones] })
        const depthLabel = `${depthM}${words.units.targetZoneDepth ?? ''}`
        texts.push({ id: `label-depth-${i + 1}`, text: depthLabel, x: fx + ((z.alongFromM + z.alongToM) / 2) * PX, y: fy + 18, w: depthLabel.length * FONT * CHAR, h: FONT * 1.3, size: FONT, anchor: 'middle', inside: true, readsPaths: [b.targetZoneDepth], colour: COLOURS.text })
    }
    if (at('halfwayLine').value === 'MARKED') shapes.push({ id: 'halfway-line', kind: 'line', x: fx + halfwayAlongM * PX, y: fy, x2: fx + halfwayAlongM * PX, y2: fy + fh, colour: COLOURS.marking, readsPaths: [b.halfwayLine, b.areaLength], computed: words.computed.halfway })
    if (at('centreMark').value === 'MARKED') shapes.push({ id: 'centre-mark', kind: 'mark', x: fx + centre.alongM * PX, y: fy + centre.acrossM * PX, r: 3, colour: COLOURS.marking, readsPaths: [b.centreMark, b.areaLength, b.areaWidth], computed: words.computed.centre })
    // The one flag on the field: the target zones' position is not decided (UNRESOLVED); drawn where the illustrative placement puts them.
    if (at('targetZonePositioning').value !== null) fail("the zones' position has a value; the placeholder would misstate it", b.targetZonePositioning)
    const inner = zones.length ? { from: Math.min(...zones.map((z) => (z.alongFromM === 0 ? z.alongToM : lengthM))), to: Math.max(...zones.map((z) => (z.alongFromM === 0 ? 0 : z.alongFromM))) } : { from: 0, to: lengthM }
    const innerChars = Math.floor(((inner.to - inner.from) * PX - 20) / (FONT * CHAR))
    // Two clauses fit on two lines when each fits; otherwise the words are wrapped to the width between the zones.
    const clauses = words.zonePlaceholder.split('; ')
    const placeholderLines = clauses.length === 2 && clauses.every((c) => c.length + 1 <= innerChars) ? [`${clauses[0]};`, clauses[1]] : wrap(words.zonePlaceholder, innerChars)
    for (const [i, line] of placeholderLines.entries()) {
        texts.push({ id: `placeholder-${i}`, text: line, x: fx + ((inner.from + inner.to) / 2) * PX, y: fy + 46 + i * lineH, w: line.length * FONT * CHAR, h: FONT * 1.3, size: FONT, anchor: 'middle', inside: true, readsPaths: [b.targetZonePositioning, b.targetZonePlacement], colour: COLOURS.flag, italic: true })
    }
    // The width's dimension, to the right of the outline.
    shapes.push({ id: 'dimension-width', kind: 'dimension', x: fx + fw + 20, y: fy, x2: fx + fw + 20, y2: fy + fh, colour: COLOURS.marking, readsPaths: [b.areaWidth] })
    const widthLabel = `${widthM}${words.units.areaWidth ?? ''}`
    texts.push({ id: 'label-width', text: widthLabel, x: fx + fw + 28, y: fy + fh / 2 + 4, w: widthLabel.length * FONT * CHAR, h: FONT * 1.3, size: FONT, anchor: 'start', inside: false, readsPaths: [b.areaWidth], colour: COLOURS.text })
    teamRow(1, fy + fh + 24)
    // Below the field: the caption, the flags, what is not drawn and why, the key, and the measured context.
    y = fy + fh + 56
    textBlock('caption', fill(words.caption, rendered, keys), FONT + 1, COLOURS.text, [b.startMethod, b.startDistance, b.centreMark])
    y += 8
    textBlock('flags-title', words.flagsTitle, FONT, COLOURS.flag, [], { weight: 'bold' })
    const flags = words.flags.map((f) => fill(f, rendered, keys))
    for (const [i, f] of flags.entries()) textBlock(`flag-${i + 1}`, `- ${f}`, FONT, COLOURS.flag, [])
    y += 8
    textBlock('not-drawn-title', words.notDrawnTitle, FONT, COLOURS.text, [], { weight: 'bold' })
    const notDrawn = words.notDrawn.map((n) => ({ what: fill(n.what, rendered, keys), why: fill(n.why, rendered, keys) }))
    for (const [i, n] of notDrawn.entries()) textBlock(`not-drawn-${i + 1}`, `- ${n.what}: ${n.why}`, FONT, COLOURS.text, [])
    y += 8
    textBlock('key-title', words.keyTitle, FONT, COLOURS.text, [], { weight: 'bold' })
    for (const [i, k] of key.entries()) textBlock(`key-${i + 1}`, `- ${k.element}: ${k.valueText}; ${k.classAndLabel}; ${k.route}`, FONT, COLOURS.text, [k.path])
    y += 8
    textBlock('context', fill(words.measuredContext, rendered, keys), FONT, COLOURS.text, [])
    const readsPaths = [...new Set([...shapes.flatMap((s) => s.readsPaths), ...texts.flatMap((t) => t.readsPaths), ...key.map((k) => k.path)])].sort()
    return {
        standing: words.standing,
        metres: { lengthM, widthM, depthM, zones, halfwayAlongM, centre },
        values,
        readsPaths,
        shapes,
        texts,
        key,
        notDrawn,
        flags,
        width: PAGE_W,
        height: y + MARGIN,
        outline: { x: fx, y: fy, w: fw, h: fh },
        colours: { zone: COLOURS.zone, teams: [...COLOURS.teams], marking: COLOURS.marking, outline: COLOURS.outline },
    }
}

const esc = (s: string): string => s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;')
const n = (v: number): string => String(Math.round(v * 10) / 10)

/** The SVG string of a model: deterministic, no clock, no DOM; every element carries its id. */
export function assemblyDiagramSvg(m: DiagramModel): string {
    const out: string[] = []
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${n(m.height)}" viewBox="0 0 ${m.width} ${n(m.height)}" font-family="Arial, Helvetica, sans-serif">`)
    out.push(`<title>${esc(m.texts.find((t) => t.id === 'banner')?.text ?? '')}</title>`)
    out.push(`<desc>${esc(m.standing)}</desc>`)
    out.push(`<rect data-element="page" x="0" y="0" width="${m.width}" height="${n(m.height)}" fill="#ffffff"/>`)
    out.push('<defs>')
    m.colours.teams.forEach((c, i) => out.push(`<marker id="head-${i + 1}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8 Z" fill="${c}"/></marker>`))
    out.push('</defs>')
    for (const s of m.shapes) {
        const attrs = `data-element="${s.id}" data-reads="${esc(s.readsPaths.join(' '))}"${s.computed ? ` data-computed="${esc(s.computed)}"` : ''}`
        if (s.kind === 'outline') out.push(`<rect ${attrs} x="${n(s.x)}" y="${n(s.y)}" width="${n(s.w as number)}" height="${n(s.h as number)}" fill="none" stroke="${s.colour}" stroke-width="2"/>`)
        else if (s.kind === 'zone') out.push(`<rect ${attrs} x="${n(s.x)}" y="${n(s.y)}" width="${n(s.w as number)}" height="${n(s.h as number)}" fill="${s.colour}" fill-opacity="0.35" stroke="${s.colour}" stroke-width="1.5"/>`)
        else if (s.kind === 'line') out.push(`<line ${attrs} x1="${n(s.x)}" y1="${n(s.y)}" x2="${n(s.x2 as number)}" y2="${n(s.y2 as number)}" stroke="${s.colour}" stroke-width="1.5"/>`)
        else if (s.kind === 'mark') out.push(`<circle ${attrs} cx="${n(s.x)}" cy="${n(s.y)}" r="${n(s.r as number)}" fill="${s.colour}"/>`)
        else if (s.kind === 'dimension') out.push(`<line ${attrs} x1="${n(s.x)}" y1="${n(s.y)}" x2="${n(s.x2 as number)}" y2="${n(s.y2 as number)}" stroke="${s.colour}" stroke-width="1" stroke-dasharray="4 3"/>`)
        else {
            const i = Number(s.id.split('-')[1])
            out.push(`<line ${attrs} x1="${n(s.x)}" y1="${n(s.y)}" x2="${n(s.x2 as number)}" y2="${n(s.y2 as number)}" stroke="${s.colour}" stroke-width="2.5" marker-end="url(#head-${i})"/>`)
        }
    }
    for (const t of m.texts) {
        if (t.inside && t.italic) out.push(`<rect data-element="${t.id}-ground" x="${n(t.anchor === 'middle' ? t.x - t.w / 2 - 3 : t.x - 3)}" y="${n(t.y - t.size)}" width="${n(t.w + 6)}" height="${n(t.h + 2)}" fill="#ffffff" fill-opacity="0.85"/>`)
        out.push(`<text data-element="${t.id}" data-reads="${esc(t.readsPaths.join(' '))}" x="${n(t.x)}" y="${n(t.y)}" font-size="${t.size}" fill="${t.colour}" text-anchor="${t.anchor}"${t.weight ? ' font-weight="bold"' : ''}${t.italic ? ' font-style="italic"' : ''}>${esc(t.text)}</text>`)
    }
    out.push('</svg>')
    return `${out.join('\n')}\n`
}
