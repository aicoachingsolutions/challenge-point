/**
 * THE FIELD DIAGRAM (stage 5B, 22 October 2026): a thin renderer of the diagram the server serves (`ServedActivity.diagram`,
 * back/src/system/rendering/coach-diagram.ts). The server builds the model from the activity's own games, checks it against the Coach
 * Details block by block, composes every word (labels, title, description) and checks those too; this file only draws.
 *
 * Christian, reply filed 23 October 2026, item 5, is what it follows:
 *   * "target zones use a consistent, visually recognizable color [...] The diagram should distinguish team identity from scoring-area
 *     identity." Every active target zone has ONE look, a light green fill, whichever team attacks it; a target that is a line is a green
 *     line. Team identity is a team colour on the team's words, counts, attacking arrow and dashed starting area only.
 *   * "the display still needs to distinguish physical target markings from whichever zones are active scoring objectives in the current
 *     block" and "each block's diagram emphasize its active objectives while retaining any physical markings that will be used later". The
 *     markings are grey lines in every block; only an active target is filled and labelled. A marked zone that is no target in the block
 *     shows its markings only, with no fill and no label, and no word names another block.
 *   * "A Block 1 / Block 2 view would be useful if it can be implemented simply." A tablist, Block 1 first; switching changes only the fills,
 *     labels, arrows, starting areas and the distance rails, all read from the block served.
 *   * Goals: drawn only where the served diagram has objects. "The diagram should not prescribe formations, passing patterns, or movement
 *     solutions": no player, formation, passing line or restart spot is drawn; there is nothing in the served diagram to draw one from.
 *
 * Colours (contrast measured, WCAG relative luminance): markings #6b7280 measure 4.63:1 on the area (#f9fafb) and 4.40:1 on the target
 * fill (#dcfce7); the marked line #111827 16.98:1 and 16.15:1; a target line #15803d 4.80:1 and 4.57:1; the team colours #1d4ed8 6.41:1
 * and 6.10:1, #9a3412 6.99:1 and 6.65:1; zone labels #374151 9.86:1 and 9.39:1; dimensions #4b5563 7.23:1. The green fill itself is
 * 1.05:1 against the area: it is emphasis only, never the only carrier of meaning (each target zone is labelled, bounded by markings
 * and named in the description).
 *
 * Landscape at 520 px of container width and over, portrait below it (the area turned upright, its first end line at the bottom). Every
 * SVG id is prefixed by React's useId, so several diagrams on one page never share an arrowhead or a title. NO NUMBER, POSITION OR WORD OF
 * THE ACTIVITY IS TYPED HERE: every one is the server's. What is typed is presentation: colours, sizes, offsets and the orientation's
 * threshold.
 */
import { KeyboardEvent, useId, useLayoutEffect, useRef, useState } from 'react'

import { CoachDiagram, CoachDiagramBlock, DiagramInterval } from '@/MODELS/activity-review.model'

/** Container width (px) from which the area is drawn lying down; below it, upright. */
const LANDSCAPE_MIN_WIDTH = 520

const STYLE = {
    font: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    area: '#f9fafb',
    outline: '#374151',
    markedLine: '#111827',
    marking: '#6b7280',
    dimension: '#4b5563',
    zoneText: '#374151',
    targetFill: '#dcfce7',
    targetLine: '#15803d',
    teams: ['#1d4ed8', '#9a3412', '#6d28d9', '#374151'],
}

/** Sizes in viewBox units, per orientation, so text lands near 11-13 px at the widths each orientation is drawn at. */
const SIZES = {
    landscape: { pitch: 400, label: 13, small: 11.5, tiny: 10.5, top: 46, left: 16, right: 40, rail: 20, arrow: 2.4, inset: 7, zoneOffset: 15, maxWidth: 560 },
    portrait: { pitch: 400, label: 18, small: 16, tiny: 15, top: 36, left: 32, right: 48, rail: 24, arrow: 2.8, inset: 7, zoneOffset: 24, maxWidth: 420 },
}

type Orientation = keyof typeof SIZES

const teamColour = (identity: number) => STYLE.teams[identity % STYLE.teams.length]
const textWidth = (text: string, size: number) => text.length * size * 0.55

export default function FieldDiagram({ diagram }: { diagram: CoachDiagram }) {
    const uid = `fd${useId().replace(/[^A-Za-z0-9_-]/g, '')}`
    const [selected, setSelected] = useState(0)
    const container = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState<number | null>(null)
    const tabs = useRef<(HTMLButtonElement | null)[]>([])

    useLayoutEffect(() => {
        const element = container.current
        if (!element) return
        const measure = () => setWidth(element.getBoundingClientRect().width)
        measure()
        if (typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const blocks = diagram.blocks
    if (!blocks.length) return null
    const at = Math.min(selected, blocks.length - 1)
    const orientation: Orientation = width !== null && width < LANDSCAPE_MIN_WIDTH ? 'portrait' : 'landscape'
    const several = blocks.length > 1

    const choose = (index: number) => {
        setSelected(index)
        tabs.current[index]?.focus()
    }
    const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
        const last = blocks.length - 1
        const next = event.key === 'ArrowRight' ? (at === last ? 0 : at + 1) : event.key === 'ArrowLeft' ? (at === 0 ? last : at - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
        if (next === null) return
        event.preventDefault()
        choose(next)
    }

    return (
        <div ref={container} className='min-w-0'>
            {several && (
                <div role='tablist' className='flex flex-wrap gap-2 mb-2'>
                    {blocks.map((block, index) => (
                        <button
                            key={index}
                            ref={(element) => (tabs.current[index] = element)}
                            type='button'
                            role='tab'
                            id={`${uid}-tab-${index}`}
                            aria-selected={index === at}
                            aria-controls={`${uid}-panel`}
                            tabIndex={index === at ? 0 : -1}
                            onClick={() => setSelected(index)}
                            onKeyDown={onKey}
                            className={`min-h-[36px] px-4 text-sm font-medium border rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                                index === at ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
                            }`}
                        >
                            {block.label}
                        </button>
                    ))}
                </div>
            )}
            <div id={`${uid}-panel`} {...(several ? { role: 'tabpanel', 'aria-labelledby': `${uid}-tab-${at}` } : {})}>
                <BlockDrawing diagram={diagram} block={blocks[at]} orientation={orientation} uid={`${uid}-${at}`} />
                <Legend diagram={diagram} />
            </div>
        </div>
    )
}

/** One block, drawn: the area, its active targets, the markings, objects, starting areas, labels, arrows and dimension rails. */
function BlockDrawing({ diagram, block, orientation, uid }: { diagram: CoachDiagram; block: CoachDiagramBlock; orientation: Orientation; uid: string }) {
    const size = SIZES[orientation]
    const { lengthM: L, widthM: W } = diagram.area
    const S = size.pitch / L
    const landscape = orientation === 'landscape'
    const pitchW = (landscape ? L : W) * S
    const pitchH = (landscape ? W : L) * S
    const rows = [block.dimensions.some((d) => d.kind === 'ZONE_DEPTH'), block.dimensions.some((d) => d.kind === 'LINE_OFFSET')].filter(Boolean).length
    const left = size.left
    const top = size.top
    const right = landscape ? size.right : size.right + Math.max(0, rows - 1) * size.rail
    const bottom = landscape ? 10 + rows * size.rail : 12
    const viewW = left + pitchW + right
    const viewH = top + pitchH + bottom
    /** (along, across) in metres to the viewBox: lying down, along runs left to right; upright, the first end line is at the bottom. */
    const P = (a: number, c: number): [number, number] => (landscape ? [left + a * S, top + c * S] : [left + c * S, top + (L - a) * S])
    const rect = (along: DiagramInterval, across: DiagramInterval, inset = 0) => {
        const [x1, y1] = P(along.from, across.from)
        const [x2, y2] = P(along.to, across.to)
        const x = Math.min(x1, x2) + inset
        const y = Math.min(y1, y2) + inset
        return { x, y, width: Math.max(0, Math.abs(x2 - x1) - 2 * inset), height: Math.max(0, Math.abs(y2 - y1) - 2 * inset) }
    }
    const pitch = rect({ from: 0, to: L }, { from: 0, to: W })

    // Each active target zone's label: inside the zone, beside the edge its attackers enter by (the edge on no end line).
    const zoneLabels = block.targets
        .filter((target) => !target.line && target.label)
        .map((target) => {
            const entry = target.along.from === 0 ? target.along.to : target.along.from
            const inward = target.along.from === 0 ? -1 : 1
            const depth = target.along.to - target.along.from
            const offsetM = Math.min(depth / 2, size.zoneOffset / S)
            const stripM = Math.min(depth, (size.zoneOffset + size.tiny + 6) / S)
            return { target, entry, inward, offsetM, strip: inward > 0 ? { from: entry, to: entry + stripM } : { from: entry - stripM, to: entry } }
        })

    // Each team's words, centred in the part of its starting area that no marked zone and no zone label takes.
    const teamPlaces = block.teams.map((team, index) => {
        if (!team.start || !team.noun) return { team, index, place: null }
        let { from, to } = team.start.along
        const takers = [...block.zones.map((zone) => zone.along), ...zoneLabels.map((label) => label.strip)]
        for (const span of takers) {
            if (span.from <= from && span.to >= to) continue
            if (span.from <= from && span.to > from) from = span.to
            if (span.to >= to && span.from < to) to = span.from
        }
        if (to <= from) ({ from, to } = team.start.along)
        return { team, index, place: { from, to, across: (team.start.across.from + team.start.across.to) / 2 } }
    })

    const rails = block.dimensions.filter((d) => d.kind === 'ZONE_DEPTH' || d.kind === 'LINE_OFFSET')
    const rowOf = (kind: string) => (rows === 2 ? (kind === 'ZONE_DEPTH' ? 0 : 1) : 0)
    const length = block.dimensions.find((d) => d.kind === 'AREA_LENGTH')
    const widthRail = block.dimensions.find((d) => d.kind === 'AREA_WIDTH')

    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox={`0 0 ${viewW} ${viewH}`}
            width='100%'
            role='img'
            aria-labelledby={`${uid}-title ${uid}-desc`}
            fontFamily={STYLE.font}
            style={{ maxWidth: size.maxWidth, height: 'auto', display: 'block' }}
        >
            <title id={`${uid}-title`}>{block.title}</title>
            <desc id={`${uid}-desc`}>{block.desc}</desc>
            <defs>
                {block.teams.map((team) => (
                    <marker key={team.identity} id={`${uid}-arrow-${team.identity}`} viewBox='0 0 10 10' refX='8' refY='5' markerWidth='6' markerHeight='6' orient='auto'>
                        <path d='M0,0 L10,5 L0,10 z' fill={teamColour(team.identity)} />
                    </marker>
                ))}
            </defs>

            {/* 1. The area. 2. The active target zones: one look, whichever team attacks them. */}
            <rect {...pitch} fill={STYLE.area} />
            {block.targets
                .filter((target) => !target.line)
                .map((target, index) => (
                    <rect key={`target-${index}`} {...rect(target.along, target.across)} fill={STYLE.targetFill} />
                ))}

            {/* 3. The markings, the same in every block where they are set out once: zone outlines and lines; the marked line bold. */}
            {block.zones.map((zone, index) => (
                <rect key={`zone-${index}`} {...rect(zone.along, zone.across)} fill='none' stroke={STYLE.marking} strokeWidth={1.5} />
            ))}
            {block.lines.map((line, index) => {
                const [x1, y1] = P(line.along.from, line.across.from)
                const [x2, y2] = P(line.along.to, line.across.to)
                return <line key={`line-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={line.markedLine ? STYLE.markedLine : STYLE.marking} strokeWidth={line.markedLine ? 2.5 : 1.5} />
            })}
            <rect {...pitch} fill='none' stroke={STYLE.outline} strokeWidth={2} />
            {/* A target that is a line: a green line over its marking (and over the area's edge, where it is an end line). */}
            {block.targets
                .filter((target) => target.line)
                .map((target, index) => {
                    const [x1, y1] = P(target.along.from, target.across.from)
                    const [x2, y2] = P(target.along.to, target.across.to)
                    return <line key={`target-line-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={STYLE.targetLine} strokeWidth={5} />
                })}
            {/* Objects, only where the served diagram holds them (goals among them); outlined green where a team scores at one. */}
            {block.objects.map((object, index) => (
                <rect key={`object-${index}`} {...rect(object.along, object.across)} fill='#ffffff' stroke={object.target ? STYLE.targetLine : STYLE.markedLine} strokeWidth={object.target ? 3 : 1.5} />
            ))}

            {/* 4. Starting areas: a dashed boundary in the team's colour, inset so it never sits on a marking. */}
            {block.teams.map((team) =>
                team.start ? (
                    <rect
                        key={`start-${team.identity}`}
                        {...rect(team.start.along, team.start.across, size.inset)}
                        rx={4}
                        fill='none'
                        stroke={teamColour(team.identity)}
                        strokeWidth={1.6}
                        strokeDasharray='7 5'
                    />
                ) : null
            )}

            {/* 5. Each active target zone's label, in neutral text: lying down it runs along the entry edge; upright, across it. */}
            {zoneLabels.map(({ target, entry, inward, offsetM }, index) => {
                const [x, y] = P(entry + inward * offsetM, (target.across.from + target.across.to) / 2)
                return (
                    <text
                        key={`zone-label-${index}`}
                        x={x}
                        y={y}
                        fontSize={size.tiny}
                        fontWeight={600}
                        fill={STYLE.zoneText}
                        textAnchor='middle'
                        dominantBaseline='central'
                        transform={landscape ? `rotate(-90 ${x} ${y})` : undefined}
                    >
                        {target.label}
                    </text>
                )
            })}
            {block.objects.map((object, index) => {
                if (!object.label) return null
                const [x, y] = P((object.along.from + object.along.to) / 2, object.across.to)
                return (
                    <text key={`object-label-${index}`} x={x} y={y + size.tiny + 2} fontSize={size.tiny} fill={STYLE.zoneText} textAnchor='middle'>
                        {object.label}
                    </text>
                )
            })}

            {/* 6. Each team: its noun, its counts and one arrow toward the end it attacks, in its colour. */}
            {teamPlaces.map(({ team, index, place }) => {
                const colour = teamColour(team.identity)
                const marker = `url(#${uid}-arrow-${team.identity})`
                if (!place) {
                    // A team the coach cannot tell apart by name and with no starting area: its direction only, across the middle.
                    if (team.attacks.length !== 1) return null
                    const across = ((index + 1) / (block.teams.length + 1)) * W
                    const halfM = Math.min(L / 8, (size.zoneOffset * 3) / S)
                    const dir = team.attacks[0] > L / 2 ? 1 : -1
                    const [x1, y1] = P(L / 2 - dir * halfM, across)
                    const [x2, y2] = P(L / 2 + dir * halfM, across)
                    return <line key={`arrow-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colour} strokeWidth={size.arrow} markerEnd={marker} />
                }
                const midA = (place.from + place.to) / 2
                const [cx, cy] = P(midA, place.across)
                const lines = team.counts
                const lineGap = size.small + 4
                // The words (and, lying down, the arrow's row beneath them) centred on the free part's middle.
                const total = size.label + 4 + lines.length * lineGap + (landscape ? lineGap : 0)
                const firstY = cy - total / 2 + size.label * 0.85
                const arrow = (() => {
                    if (team.attacks.length !== 1) return null
                    const dir = team.attacks[0] > midA ? 1 : -1
                    const halfM = Math.min((place.to - place.from) * 0.28, (size.zoneOffset * 3) / S)
                    if (landscape) {
                        const y = firstY + 4 + lines.length * lineGap + lineGap * 0.7
                        const [x1] = P(midA - dir * halfM, 0)
                        const [x2] = P(midA + dir * halfM, 0)
                        return <line x1={x1} y1={y} x2={x2} y2={y} stroke={colour} strokeWidth={size.arrow} markerEnd={marker} />
                    }
                    const widest = Math.max(textWidth(team.noun ?? '', size.label), ...lines.map((line) => textWidth(line, size.small)))
                    const x = cx + widest / 2 + 14
                    const [, y1] = P(midA - dir * halfM, 0)
                    const [, y2] = P(midA + dir * halfM, 0)
                    return <line x1={x} y1={y1} x2={x} y2={y2} stroke={colour} strokeWidth={size.arrow} markerEnd={marker} />
                })()
                return (
                    <g key={`team-${index}`} fill={colour}>
                        <text x={cx} y={firstY} fontSize={size.label} fontWeight={700} textAnchor='middle'>
                            {team.noun}
                        </text>
                        {lines.map((line, n) => (
                            <text key={n} x={cx} y={firstY + 4 + (n + 1) * lineGap} fontSize={size.small} textAnchor='middle'>
                                {line}
                            </text>
                        ))}
                        {arrow}
                    </g>
                )
            })}

            {/* 7. The marked line's name, once, and the dimensions a sentence states. */}
            {block.lines
                .filter((line) => line.markedLine && line.label && line.along.from === line.along.to)
                .map((line, index) => {
                    const [x, y] = P(line.along.from, line.across.from)
                    if (landscape) {
                        return (
                            <text key={`marked-${index}`} x={x} y={pitch.y - 8} fontSize={size.tiny} fontWeight={600} fill={STYLE.markedLine} textAnchor='middle'>
                                {line.label}
                            </text>
                        )
                    }
                    const w = textWidth(line.label ?? '', size.tiny) + 12
                    return (
                        <g key={`marked-${index}`}>
                            <rect x={pitch.x + 8} y={y - size.tiny * 0.75} width={w} height={size.tiny * 1.5} rx={size.tiny * 0.75} fill='#ffffff' stroke={STYLE.markedLine} strokeWidth={1} />
                            <text x={pitch.x + 8 + w / 2} y={y} fontSize={size.tiny} fontWeight={600} fill={STYLE.markedLine} textAnchor='middle' dominantBaseline='central'>
                                {line.label}
                            </text>
                        </g>
                    )
                })}
            {length && (landscape ? <Rail p0={[pitch.x, pitch.y - 28]} p1={[pitch.x + pitch.width, pitch.y - 28]} label={length.label} size={size.tiny} /> : <Rail p0={[pitch.x - 18, pitch.y]} p1={[pitch.x - 18, pitch.y + pitch.height]} label={length.label} size={size.tiny} />)}
            {widthRail &&
                (landscape ? (
                    <Rail p0={[pitch.x + pitch.width + 18, pitch.y]} p1={[pitch.x + pitch.width + 18, pitch.y + pitch.height]} label={widthRail.label} size={size.tiny} />
                ) : (
                    <Rail p0={[pitch.x, pitch.y - 18]} p1={[pitch.x + pitch.width, pitch.y - 18]} label={widthRail.label} size={size.tiny} />
                ))}
            {rails.map((rail, index) => {
                const row = rowOf(rail.kind)
                if (landscape) {
                    const y = pitch.y + pitch.height + 16 + row * size.rail
                    return <Rail key={`rail-${index}`} p0={[P(rail.from, 0)[0], y]} p1={[P(rail.to, 0)[0], y]} label={rail.label} size={size.tiny} />
                }
                const x = pitch.x + pitch.width + 16 + row * size.rail
                return <Rail key={`rail-${index}`} p0={[x, P(rail.to, 0)[1]]} p1={[x, P(rail.from, 0)[1]]} label={rail.label} size={size.tiny} />
            })}
        </svg>
    )
}

/** A dimension rail: a thin line with end ticks and its label, beside an edge of the area. */
function Rail({ p0, p1, label, size }: { p0: [number, number]; p1: [number, number]; label: string; size: number }) {
    const vertical = Math.abs(p0[0] - p1[0]) < 0.5
    const tick = 4
    const mid: [number, number] = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2]
    const ticks = vertical
        ? [
              [p0[0] - tick, p0[1], p0[0] + tick, p0[1]],
              [p1[0] - tick, p1[1], p1[0] + tick, p1[1]],
          ]
        : [
              [p0[0], p0[1] - tick, p0[0], p0[1] + tick],
              [p1[0], p1[1] - tick, p1[0], p1[1] + tick],
          ]
    return (
        <g stroke={STYLE.dimension} strokeWidth={1}>
            <line x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} />
            {ticks.map(([x1, y1, x2, y2], index) => (
                <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
            {vertical ? (
                <text x={mid[0] - 5} y={mid[1]} fontSize={size} fill={STYLE.dimension} stroke='none' textAnchor='middle' transform={`rotate(-90 ${mid[0] - 5} ${mid[1]})`}>
                    {label}
                </text>
            ) : (
                <text x={mid[0]} y={mid[1] - 5} fontSize={size} fill={STYLE.dimension} stroke='none' textAnchor='middle'>
                    {label}
                </text>
            )}
        </g>
    )
}

/** The legend: the server's words, each beside the mark it explains; then the counts said for every team together, where there are any. */
function Legend({ diagram }: { diagram: CoachDiagram }) {
    if (!diagram.legend.length && !diagram.counts.length) return null
    const swatch = (kind: string) => {
        if (kind === 'MARKED_LINE') return <line x1={1} y1={7} x2={25} y2={7} stroke={STYLE.markedLine} strokeWidth={2.5} />
        if (kind === 'TARGET_ZONE') return <rect x={1} y={1} width={24} height={12} fill={STYLE.targetFill} stroke={STYLE.targetLine} strokeWidth={1.2} />
        if (kind === 'STARTING_AREA') return <rect x={1.5} y={1.5} width={23} height={11} rx={3} fill='none' stroke={STYLE.outline} strokeWidth={1.4} strokeDasharray='5 3' />
        return null
    }
    return (
        <div className='mt-2 space-y-1 text-xs text-gray-700'>
            {diagram.legend.length > 0 && (
                <ul className='flex flex-wrap gap-x-4 gap-y-1'>
                    {diagram.legend.map((entry) => (
                        <li key={entry.kind} className='flex items-center gap-1.5'>
                            <svg aria-hidden width={26} height={14} viewBox='0 0 26 14'>
                                {swatch(entry.kind)}
                            </svg>
                            {entry.text}
                        </li>
                    ))}
                </ul>
            )}
            {diagram.counts.length > 0 && <p>{diagram.counts.join(' · ')}</p>}
        </div>
    )
}
