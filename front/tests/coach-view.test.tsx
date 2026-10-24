import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ActivityReviewRequest, ServedActivity } from '@/MODELS/activity-review.model'
import { ActivityBlock } from '@/app/CheckedActivityBlock'
import FieldDiagram from '@/app/FieldDiagram'
import ActivityReviewPage from '@/app/ActivityReviewPage'
import SessionForm from '@/forms/SessionForm'
import { NumberField } from '@/form-control/fields'

import fixture from './fixtures/a01.json'

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
