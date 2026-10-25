import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ActivityReviewRequest, CoachDiagram, ServedActivity } from '@/MODELS/activity-review.model'
import { ActivityBlock } from '@/app/CheckedActivityBlock'
import FieldDiagram from '@/app/FieldDiagram'
import ActivityReviewPage, { BoundRegionEvidence, ProvisionalFigures } from '@/app/ActivityReviewPage'
import type { ReviewBoundRegionAccount, ReviewBoundRegionPairing } from '@/MODELS/activity-review.model'
import SessionForm from '@/forms/SessionForm'
import { NumberField } from '@/form-control/fields'

import fixture from './fixtures/a01.json'
import faPairingFixture from './fixtures/fa-pairing.json'
import boundRegionsFixture from './fixtures/bound-regions.json'
import zoneDiagramFixture from './fixtures/zone-diagram.json'

// Only authentication is replaced. FormWrapper, fields, resource hooks, API serialization,
// and the review question all run unchanged; fetch is the offline server boundary below.
vi.mock('@/services/authentication.service', () => ({ useAuth: () => ({ user: { _id: 'test-coach' } }) }))

const activity = fixture.activity as unknown as ServedActivity
const diagram = activity.diagram
const question = fixture.refusal.question
const authorized = question.choices.filter((choice) => typeof choice.states.widthM === 'number')
const faChoice = authorized.find((choice) => choice.states.widthM === 3.6576)!
const otherChoice = question.choices.find((choice) => choice.enters.includes('widthM'))!
const goal = fixture.options.goals.find((entry) => entry.name === activity.title)!

function stringLeaves(value: unknown): string[] {
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return value.flatMap(stringLeaves)
    if (value !== null && typeof value === 'object') return Object.values(value).flatMap(stringLeaves)
    return []
}
// The words the served activity gives the coach: title, subtitle, overview, diagram and Details sentences.
const coachText = [activity.title, activity.subtitle, ...stringLeaves(activity.overview), ...stringLeaves(activity.diagram),
    ...activity.rendered.instructions.map((line) => line.text)].join('\n')
// The account's own strings (citations, notes, ids) of 12 characters or more, short ones being too ambiguous to search
// for, less those a coach-facing text above also says (here the four adjustments' coach words, which Coach Details shows).
const accountOnly = [...new Set(stringLeaves(activity.account))].filter((text) => text.length >= 12 && !coachText.includes(text))

type PostedSession = { objects?: Record<string, { count: number; widthM?: number; type?: string }> }
const reviewPosts: ActivityReviewRequest[] = []
const sessionPosts: PostedSession[] = []
// api() catches whatever the double throws and hands the page an ordinary error, so a request this double
// does not serve would otherwise pass unnoticed. Each one is recorded here and fails its test in afterEach.
const unexpectedRequests: string[] = []
// Adapt the snapshot's session envelope to the stored-session API's field names.
const storedSession = {
    _id: 'test-session',
    name: 'Snapshot session',
    playerCount: activity.session.players,
    fieldLength: String(activity.session.lengthM),
    fieldWidth: String(activity.session.widthM),
    specializedRoles: activity.session.roles,
}

beforeEach(() => {
    reviewPosts.length = 0
    sessionPosts.length = 0
    unexpectedRequests.length = 0
    localStorage.setItem('token', JSON.stringify({ accessToken: 'offline', refreshToken: 'offline', tokenType: 'Bearer' }))
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        let body: unknown
        if (url.endsWith('/session/object-choices')) body = fixture.equipment
        else if (url.endsWith('/checked-activity/test-session') && init?.body) {
            const request = JSON.parse(String(init.body)) as ActivityReviewRequest
            reviewPosts.push(request)
            body = request.objects ? fixture.activity : fixture.refusal
        } else if (url.endsWith('/checked-activity')) body = fixture.options
        else if (url.endsWith('/session/test-session')) body = storedSession
        else if (url.endsWith('/session') && init?.body) {
            sessionPosts.push(JSON.parse(String(init.body)) as PostedSession)
            body = { data: { _id: 'saved-session' } }
        } else {
            unexpectedRequests.push(url)
            throw new Error(`Unexpected offline request: ${url}`)
        }
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
    }))
})

afterEach(() => {
    expect(unexpectedRequests).toEqual([])
})

function renderPage(page: 'review' | 'session') {
    render(
        <MemoryRouter initialEntries={[page === 'review' ? '/review/test-session' : '/session/new']}>
            <Routes>
                <Route path='/review/:id' element={<ActivityReviewPage />} />
                <Route path='/session/new' element={<SessionForm />} />
                <Route path='/session/:id' element={<p>Saved</p>} />
            </Routes>
        </MemoryRouter>,
    )
}

// NumberField's visible label is a sibling rather than an associated input label.
// Scope to the chosen radio's row so unrelated session and availability numbers cannot match.
function choiceNumber(label: string) {
    const radio = screen.getByRole('radio', { name: label })
    return within(radio.parentElement.parentElement).getAllByRole<HTMLInputElement>('spinbutton')
}

async function askGoalQuestion() {
    renderPage('review')
    fireEvent.click(await screen.findByRole('button', { name: `${activity.session.durationMin} min` }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${goal.name}`) }))
    fireEvent.click(screen.getByRole('button', { name: 'Build the activity' }))
    await screen.findAllByText(question.words)
}

type Interval = { from: number; to: number }
type Box = { x: number; y: number; width: number; height: number }
const number = (element: Element, attribute: string) => Number(element.getAttribute(attribute))
// Rounded so a drawing and the data it was drawn from compare as plain values, with readable failures.
const round = (value: number) => Math.round(value * 1000) / 1000
const roundBox = ({ x, y, width, height }: Box): Box => ({ x: round(x), y: round(y), width: round(width), height: round(height) })
const box = (element: Element): Box => ({
    x: number(element, 'x'), y: number(element, 'y'), width: number(element, 'width'), height: number(element, 'height'),
})
const ends = (element: Element) => ['x1', 'y1', 'x2', 'y2'].map((attribute) => round(number(element, attribute)))

describe('FieldDiagram', () => {
    it.each([800, 400])('draws the area, marked line and green target zone where the diagram data puts them at container width %i', (width) => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            x: 0, y: 0, left: 0, top: 0, right: width, bottom: 600, width, height: 600, toJSON: () => ({}),
        })
        render(<FieldDiagram diagram={diagram} />)
        // FieldDiagram's documented orientation: lying down from 520 px, along the length left to right;
        // upright below it, along the length bottom to top (the first end line at the bottom).
        const landscape = width >= 520
        const { lengthM, widthM } = diagram.area
        for (const block of diagram.blocks) {
            fireEvent.click(screen.getByRole('tab', { name: block.label }))
            const svg = screen.getByRole('img', { name: block.title })
            const area = svg.querySelector('rect[fill="#f9fafb"]')
            expect(area).not.toBeNull()
            const pitch = box(area)
            const along = landscape ? pitch.width : pitch.height
            const across = landscape ? pitch.height : pitch.width
            expect(along / across).toBeCloseTo(lengthM / widthM)
            // Metres to drawing units, measured from the drawn area itself rather than the component's sizes.
            const metre = along / lengthM
            const place = (a: number, c: number) => (landscape
                ? [pitch.x + a * metre, pitch.y + c * metre]
                : [pitch.x + c * metre, pitch.y + (lengthM - a) * metre])
            const expectedBox = (a: Interval, c: Interval) => {
                const [x1, y1] = place(a.from, c.from)
                const [x2, y2] = place(a.to, c.to)
                return roundBox({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) })
            }

            const zones = block.targets.filter((target) => !target.line)
            expect(zones.length).toBeGreaterThan(0)
            const drawnZones = Array.from(svg.querySelectorAll('rect[fill="#bbf7d0"]'), (element) => roundBox(box(element)))
            expect(drawnZones).toEqual(zones.map((zone) => expectedBox(zone.along, zone.across)))
            // Each zone's green edge runs just inside it.
            const edges = Array.from(svg.querySelectorAll('rect[fill="none"][stroke="#15803d"]'), box)
            for (const zone of drawnZones) {
                expect(edges.some((edge) => edge.x > zone.x && edge.y > zone.y
                    && edge.x + edge.width < zone.x + zone.width && edge.y + edge.height < zone.y + zone.height)).toBe(true)
            }

            const marked = block.lines.filter((line) => line.markedLine)
            expect(marked.length).toBeGreaterThan(0)
            const drawnLines = Array.from(svg.querySelectorAll('line[stroke="#111827"]'), ends)
            for (const line of marked) {
                const expected = [...place(line.along.from, line.across.from), ...place(line.along.to, line.across.to)]
                expect(drawnLines).toContainEqual(expected.map(round))
            }
        }
    })

    it('keeps team colours across blocks while the displayed roles swap', () => {
        render(<FieldDiagram diagram={diagram} />)
        const colours = new Map<number, string | null>()
        for (const [index, block] of diagram.blocks.entries()) {
            fireEvent.click(screen.getByRole('tab', { name: block.label }))
            expect(screen.getByRole('tab', { name: block.label }).getAttribute('aria-selected')).toBe('true')
            const svg = screen.getByRole('img', { name: block.title })
            for (const team of block.teams) {
                const text = within(svg).getByText(team.label, { selector: 'text' })
                const colour = text.closest('[fill]')!.getAttribute('fill')
                expect(colour).toMatch(/^#[0-9a-f]{6}$/)
                expect(text.closest('g')!.textContent).toContain(team.noun)
                if (index === 0) colours.set(team.identity, colour)
                else {
                    expect(colour).toBe(colours.get(team.identity))
                    expect(team.noun).not.toBe(diagram.blocks[0].teams.find((first) => first.identity === team.identity)!.noun)
                }
            }
        }
        expect(new Set(colours.values()).size).toBe(2)
    })

    it('uses coach labels with no internal ids in either block', () => {
        render(<FieldDiagram diagram={diagram} />)
        const internal = [goal.id, ...activity.roleBlocks.blocks.map((block) => block.blockId),
            ...activity.rendered.instructions.flatMap((line) => line.from)]
        for (const block of diagram.blocks) {
            fireEvent.click(screen.getByRole('tab', { name: block.label }))
            const svg = screen.getByRole('img', { name: block.title })
            const labels = [svg.textContent, ...Array.from(svg.querySelectorAll('[aria-label]'), (node) => node.getAttribute('aria-label'))].join(' ')
            for (const id of internal) expect(labels).not.toContain(id)
        }
    })
})

// The Z review, round 1 (25 October 2026): the zone version's diagram, whose two penalty areas lie on active target zones in both blocks.
const zoneDiagram = zoneDiagramFixture.diagram as unknown as CoachDiagram
const overlapping = (a: Interval, b: Interval) => a.from < b.to && b.from < a.to
const boxesMeet = (a: Box, b: Box) =>
    Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)
const boxInside = (a: Box, b: Box) => a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height
const follows = (first: Element, second: Element) => (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
const atWidth = (width: number) =>
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: 0, left: 0, top: 0, right: width, bottom: 600, width, height: 600, toJSON: () => ({}),
    })
// A drawn text's box from its own attributes, at FieldDiagram's documented width estimate (0.55 of the font size per character).
const textBox = (element: Element): Box => {
    const size = number(element, 'font-size')
    const width = (element.textContent ?? '').length * size * 0.55
    const x = number(element, 'x')
    const left = element.getAttribute('text-anchor') === 'start' ? x : x - width / 2
    const y = number(element, 'y')
    // Centred on y, or on a baseline at y with 0.8 of the size above it and 0.2 below.
    const top = element.getAttribute('dominant-baseline') === 'central' ? y - size / 2 : y - size * 0.8
    return { x: left, y: top, width, height: size }
}

describe('FieldDiagram: marked areas on active target zones (the zone version)', () => {
    it.each([800, 400])('paints no area fill over an active target, and keeps each area\'s grey edge over it, at container width %i', (width) => {
        atWidth(width)
        render(<FieldDiagram diagram={zoneDiagram} />)
        let met = 0
        for (const block of zoneDiagram.blocks) {
            fireEvent.click(screen.getByRole('tab', { name: block.label }))
            const svg = screen.getByRole('img', { name: block.title })
            const areas = block.areas ?? []
            const zones = block.targets.filter((target) => !target.line)
            const areaFills = Array.from(svg.querySelectorAll('rect[fill="#e5e7eb"]'))
            const targetFills = Array.from(svg.querySelectorAll('rect[fill="#bbf7d0"]'))
            const greenEdges = Array.from(svg.querySelectorAll('rect[fill="none"][stroke="#15803d"]'))
            const outlines = Array.from(svg.querySelectorAll('rect[fill="none"][stroke="#6b7280"]'))
            expect(areaFills).toHaveLength(areas.length)
            expect(targetFills).toHaveLength(zones.length)
            // By render order: no area fill is painted after any target's fill or green edge, so no part of an active target is hidden.
            for (const fill of areaFills) for (const mark of [...targetFills, ...greenEdges]) expect(follows(fill, mark)).toBe(true)
            // By the data and the geometry drawn: each area lying on a target keeps its grey edge, drawn after the target, so it stays visible.
            for (const [i, area] of areas.entries()) {
                const edge = outlines.find((outline) => JSON.stringify(roundBox(box(outline))) === JSON.stringify(roundBox(box(areaFills[i]))))
                expect(edge).toBeDefined()
                for (const [j, zone] of zones.entries()) {
                    if (!overlapping(area.along, zone.along) || !overlapping(area.across, zone.across)) continue
                    met++
                    expect(boxesMeet(box(areaFills[i]), box(targetFills[j]))).toBe(true)
                    expect(follows(targetFills[j], edge)).toBe(true)
                }
            }
            // One area label in each block, drawn inside the area the data labels.
            const labelled = areas.filter((area) => area.label)
            expect(labelled).toHaveLength(1)
            const drawn = within(svg).getAllByText(labelled[0].label, { selector: 'text' })
            expect(drawn).toHaveLength(1)
            const at = areaFills[areas.indexOf(labelled[0])]
            const [x, y] = [number(drawn[0], 'x'), number(drawn[0], 'y')]
            expect(boxInside({ x, y, width: 0, height: 0 }, box(at))).toBe(true)
        }
        // The case this test exists for: an area on a target in every block.
        expect(met).toBeGreaterThanOrEqual(zoneDiagram.blocks.length)
    })

    it('shows the marked area in the legend both ways where it lies on a target, and as before where it does not', () => {
        render(<FieldDiagram diagram={zoneDiagram} />)
        const text = zoneDiagram.legend.find((entry) => entry.kind === 'MARKED_AREA')!.text
        // The legend's entry (the drawing labels an area with the same words).
        const legendSwatch = (words: string) =>
            screen.getAllByText(words).map((element) => element.closest('li')).find(Boolean)!.querySelector('svg')!
        const swatch = legendSwatch(text)
        expect(swatch.querySelector('rect[fill="#e5e7eb"]')).not.toBeNull()
        expect(swatch.querySelector('rect[fill="#bbf7d0"]')).not.toBeNull()
        expect(swatch.querySelector('rect[fill="none"][stroke="#6b7280"]')).not.toBeNull()
        cleanup()
        // The goal version's area lies on no active target zone: its swatch is the grey area alone.
        render(<FieldDiagram diagram={diagram} />)
        const goalText = diagram.legend.find((entry) => entry.kind === 'MARKED_AREA')!.text
        const goalSwatch = legendSwatch(goalText)
        expect(goalSwatch.querySelector('rect[fill="#e5e7eb"]')).not.toBeNull()
        expect(goalSwatch.querySelector('rect[fill="#bbf7d0"]')).toBeNull()
    })

    it.each([800, 400])('keeps each team\'s words clear of the marked areas and inside their dashed starting area at container width %i', (width) => {
        atWidth(width)
        for (const shown of [zoneDiagram, diagram]) {
            render(<FieldDiagram diagram={shown} />)
            for (const block of shown.blocks) {
                fireEvent.click(screen.getByRole('tab', { name: block.label }))
                const svg = screen.getByRole('img', { name: block.title })
                const areaBoxes = Array.from(svg.querySelectorAll('rect[fill="#e5e7eb"]'), box)
                for (const team of block.teams) {
                    const word = within(svg).getByText(team.label, { selector: 'text' })
                    const group = word.parentElement
                    const dashed = Array.from(svg.querySelectorAll('rect[stroke-dasharray]'))
                        .find((rect) => rect.getAttribute('stroke') === group.getAttribute('fill'))!
                    const pieces = [
                        ...Array.from(group.querySelectorAll(':scope > text'), textBox),
                        ...Array.from(group.querySelectorAll(':scope > g > rect'), box),
                    ]
                    expect(pieces.length).toBeGreaterThanOrEqual(3)
                    for (const piece of pieces) {
                        for (const area of areaBoxes) expect(boxesMeet(piece, area)).toBe(false)
                        expect(boxInside(piece, box(dashed))).toBe(true)
                    }
                }
            }
            cleanup()
        }
    })
})

describe('CheckedActivityBlock', () => {
    it('shows every overview sentence before collapsed Coach Details', () => {
        render(<ActivityBlock activity={activity} />)
        const overview = activity.overview
        const toggle = screen.getByRole('button', { name: 'Coach details' })
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        const details = document.getElementById(toggle.getAttribute('aria-controls')!)!
        expect(details.hidden).toBe(true)
        const sentences = [overview.purpose, overview.game, overview.parameters,
            ...overview.scoring.groups.flatMap((group) => group.lines.map((line) => line.text))]
        for (const sentence of sentences) {
            const visible = screen.getAllByText(sentence).filter((node) => !node.closest('[hidden]'))
            expect(visible.length).toBeGreaterThan(0)
            expect(visible[0].compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
        }
    })

    it('keeps closed details and internal source strings out of the visible overview', () => {
        const { container } = render(<ActivityBlock activity={activity} />)
        const visible = container.cloneNode(true) as HTMLElement
        visible.querySelectorAll('[hidden]').forEach((node) => node.remove())
        const overview = activity.overview
        const overviewText = [overview.purpose, overview.game, overview.parameters,
            ...overview.scoring.groups.flatMap((group) => group.lines.map((line) => line.text))].join(' ')
        const onlyDetails = activity.rendered.instructions.filter((line) => !overviewText.includes(line.text))
        expect(onlyDetails.length).toBeGreaterThan(0)
        for (const line of onlyDetails) expect(visible.textContent).not.toContain(line.text)
        for (const line of activity.rendered.instructions) {
            for (const source of line.from) expect(visible.textContent).not.toContain(source)
        }
        for (const block of activity.roleBlocks.blocks) expect(visible.textContent).not.toContain(block.blockId)
        expect(visible.textContent).not.toContain(goal.id)
        expect(accountOnly.length).toBeGreaterThan(0)
        expect(accountOnly.filter((text) => visible.textContent.includes(text))).toEqual([])
    })

    it('opens Coach Details on request and reveals the fixture instructions', () => {
        render(<ActivityBlock activity={activity} />)
        const toggle = screen.getByRole('button', { name: 'Coach details' })
        fireEvent.click(toggle)
        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        const details = document.getElementById(toggle.getAttribute('aria-controls')!)!
        expect(details.hidden).toBe(false)
        for (const line of activity.rendered.instructions) expect(details.textContent).toContain(line.text)
    })
})

describe('Goal question', () => {
    it('renders exactly one radio per snapshot choice using the data labels', async () => {
        await askGoalQuestion()
        expect(screen.getAllByRole('radio')).toHaveLength(question.choices.length)
        for (const choice of question.choices) expect(screen.getByRole('radio', { name: choice.label })).toBeTruthy()
    })

    it.each(authorized)('submits the exact authorized width for $id', async (choice) => {
        await askGoalQuestion()
        fireEvent.click(screen.getByRole('radio', { name: choice.label }))
        const submit = screen.getByRole<HTMLButtonElement>('button', { name: 'Build the activity with this answer' })
        expect(submit.disabled).toBe(true)
        fireEvent.change(choiceNumber(choice.label)[0], { target: { value: '1' } })
        fireEvent.click(submit)
        await waitFor(() => expect(reviewPosts).toHaveLength(2))
        expect(reviewPosts[0].objects).toBeUndefined()
        expect(reviewPosts[1].objects?.[question.objectKind]).toEqual({ ...choice.states, count: 1 })
        expect(reviewPosts[1].objects?.[question.objectKind].widthM).toBe(choice.states.widthM)
        await screen.findByRole('heading', { name: activity.title })
    })
})

describe('SessionForm', () => {
    it('saves the exact FA width supplied by a choice', async () => {
        renderPage('session')
        fireEvent.click(await screen.findByRole('radio', { name: faChoice.label }))
        fireEvent.change(choiceNumber(faChoice.label)[0], { target: { value: '1' } })
        fireEvent.click(screen.getByRole('button', { name: 'Start Session' }))
        await waitFor(() => expect(sessionPosts).toHaveLength(1))
        expect(sessionPosts[0].objects?.[question.objectKind]).toEqual({ ...faChoice.states, count: 1 })
        expect(sessionPosts[0].objects?.[question.objectKind].widthM).toBe(3.6576)
        await screen.findByText('Saved')
    })

    it('preserves the fixture choice width when entered in the session numeric width input', async () => {
        renderPage('session')
        fireEvent.click(await screen.findByRole('radio', { name: otherChoice.label }))
        fireEvent.change(choiceNumber(otherChoice.label)[0], { target: { value: '1' } })
        const width = choiceNumber(otherChoice.label)[1]
        fireEvent.change(width, { target: { value: String(faChoice.states.widthM) } })
        expect(width.type).toBe('number')
        expect(width.step).toBe('any')
        expect(width.value).toBe('3.6576')
        expect(width.valueAsNumber).toBe(3.6576)
        fireEvent.click(screen.getByRole('button', { name: 'Start Session' }))
        await waitFor(() => expect(sessionPosts).toHaveLength(1))
        expect(sessionPosts[0].objects?.[question.objectKind].widthM).toBe(3.6576)
        await screen.findByText('Saved')
    })

    it('NumberField (step any) displays 3.6576 exactly and reports a typed 7.32 unrounded', () => {
        const onChange = vi.fn()
        render(<NumberField value={faChoice.states.widthM} onChange={onChange} step='any' />)
        const width = screen.getByRole<HTMLInputElement>('spinbutton')
        expect(width.value).toBe('3.6576')
        expect(width.valueAsNumber).toBe(faChoice.states.widthM)
        fireEvent.change(width, { target: { value: '7.32' } })
        expect(onChange).toHaveBeenCalledWith(7.32)
    })

    // Existing bug: NumberField renders a sibling <label> without htmlFor or a matching
    // input id, so this visible label supplies no accessible name. Task 07 forbids fixing it.
    it.fails('associates the session numeric width input with its visible label', async () => {
        renderPage('session')
        fireEvent.click(await screen.findByRole('radio', { name: otherChoice.label }))
        expect(screen.getByRole('spinbutton', { name: 'How wide, in metres?' })).toBeTruthy()
    })
})

// P2 (his reply filed 28 October 2026, item 8): the review evidence's provisional figure of a pairing, as the administrator's page shows it.
// The pairing is copied unchanged from the built-bundle snapshot's administrator evidence (fixtures/fa-pairing.json, provenance recorded).
describe('Review evidence: provisional figures', () => {
    const pairing = faPairingFixture.pairing as unknown as ReviewBoundRegionPairing

    it('shows each provisional figure with its status, the value applied, every source and his words', () => {
        const { container } = render(<ProvisionalFigures pairing={pairing} />)
        const [figure] = pairing.provisional
        expect(container.textContent).toContain(`${figure.status}: ${figure.leaf} of ${pairing.id}, ${figure.value} m applied.`)
        expect(figure.status).toBe('PROVISIONAL')
        expect(container.textContent).toContain(figure.applied)
        for (const source of figure.sources) expect(container.textContent).toContain(`${source.citedAs}: ${source.states} (${source.metres} m)`)
        for (const words of figure.authority.words) expect(screen.getByText(words, { exact: false })).toBeTruthy()
        expect(container.textContent).toContain(figure.authority.citedAs)
    })

    it('shows nothing for a pairing that marks no figure provisional', () => {
        const { container } = render(<ProvisionalFigures pairing={{ ...pairing, provisional: undefined }} />)
        expect(container.textContent).toBe('')
    })
})

// Z (his reply filed 28 October 2026, item 7): the administrator's account of the regions bound in both versions, copied unchanged from the
// built-bundle snapshot's review evidence (fixtures/bound-regions.json, provenance recorded): the zone version's penalty area bound to the end
// of the team holding the goalkeeper row, the goal version's bound to its goal.
describe('Review evidence: bound regions', () => {
    const zone = boundRegionsFixture.zone as unknown as ReviewBoundRegionAccount
    const goal = boundRegionsFixture.goal as unknown as ReviewBoundRegionAccount
    const label = (blockId: string) => `Block for ${blockId}`
    const AREA = 'c:provisional:A01-R1:A01-R1-S2-2'

    it("shows the zone version's region as permitted at the goalkeeper's end, bound there in each block with what it borrows", () => {
        const { container } = render(<BoundRegionEvidence account={zone} blockLabel={label} />)
        const text = container.textContent ?? ''
        const [requirement] = zone.requirements
        expect(text).toContain('BOUND-REGION-PERFORMER-END: one zone of the function penalty-area is permitted at the end of the team holding P3,')
        expect(text).toContain(`where no goal stands (${requirement.cites})`)
        expect(text).not.toContain('needs one')
        expect(zone.blocks.map((block) => block.blockId)).toHaveLength(2)
        for (const block of zone.blocks) expect(text).toContain(label(block.blockId))
        const said = `${AREA} (zone; penalty-area) bound to the end of the team holding P3, borrowing region of its pairing`
        expect(text.split(said)).toHaveLength(3)
        expect(text).toContain('Lies 0-9 m along and 7.5-22.5 m across the area')
        expect(text).toContain('Lies 31-40 m along and 7.5-22.5 m across the area')
        expect(text.split('Pairing FA-MINI-SOCCER-5V5-2026: ')).toHaveLength(3)
        expect(text).not.toContain('bound to null')
    })

    it("shows the goal version's region as needed by its goal and bound to it, as before", () => {
        const { container } = render(<BoundRegionEvidence account={goal} blockLabel={label} />)
        const text = container.textContent ?? ''
        expect(text).toContain('BOUND-REGION-GOAL: a goal that is defended needs one zone of the function penalty-area bound to it')
        const said = '(zone; penalty-area) bound to c:provisional:A01-R2:A01-R2-O1-1 (goal), defended by the team holding P3'
        expect(text.split(said)).toHaveLength(3)
        expect(text).not.toContain('permitted at the end')
    })
})
