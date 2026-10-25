import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ActivityGenerator from '@/app/ActivityGenerator'
import ActivityPage from '@/app/ActivityPage'
import SessionPage from '@/app/SessionPage'
import PathwayNotice from '@/components/PathwayNotice'
import type { IPathwayNotice } from '@/MODELS/activity.model'

import fixture from './fixtures/pathway-notice.json'

/**
 * The live-app status notice (25 October 2026). Christian, reply filed 26 October 2026, item 9(a): "Other Learning Goals may continue through
 * their existing pathway during this transitional period, provided their status and limitations are not misrepresented."
 *
 * Every body below is the server's own (fixtures/pathway-notice.json, its provenance): the generated choice and the saved activities from the
 * REAL router on the built bundle with a TEST-ONLY stubbed model, the checked activity and the planning registry from the regression snapshot.
 * The notice's words are never written here: each assertion reads them from the body the server sent.
 */
vi.mock('@/services/authentication.service', () => ({ useAuth: () => ({ user: { _id: 'test-coach' } }) }))

type Doc = Record<string, unknown> & { pathway?: string; title: string }
// The checked build is stored once in the fixture (its provenance records that each copy equals it); put back where the server sent it.
const withBuild = (doc: Doc) => (doc.pathway === 'CHECKED_CHAIN' ? { ...doc, checkedActivity: fixture.checkedResult.checkedActivity } : doc)
const notice = fixture.legacyResult.pathwayNotice as IPathwayNotice
const goals = fixture.registry.phases.flatMap((phase) => phase.learningGoals)
const goalNamed = (id: string) => goals.find((goal) => goal.id === id)!

const unexpectedRequests: string[] = []
const generateRequests: Record<string, unknown>[] = []
let generateAnswer: unknown = null
const saved: Record<string, Doc> = {
    'test-legacy': fixture.legacySaved as Doc,
    'test-earlier': fixture.earlierSaved as Doc,
    'test-checked': withBuild(fixture.checkedSaved as Doc),
}
const storedSession = {
    _id: 'test-session', name: 'TEST-ONLY session', sessionStatus: 'inProgress', playerCount: 12, fieldLength: '40', fieldWidth: '30',
}

beforeEach(() => {
    unexpectedRequests.length = 0
    generateRequests.length = 0
    generateAnswer = null
    localStorage.setItem('token', JSON.stringify({ accessToken: 'offline', refreshToken: 'offline', tokenType: 'Bearer' }))
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        let body: unknown
        const id = Object.keys(saved).find((key) => url.endsWith(`/activity/${key}`))
        if (url.endsWith('/session-planning')) body = fixture.registry
        else if (url.endsWith('/generate-activities/test-session') && init?.body) {
            generateRequests.push(JSON.parse(String(init.body)) as Record<string, unknown>)
            body = generateAnswer
        } else if (id) body = saved[id]
        else if (url.endsWith('/activity/session/test-session')) body = (fixture.sessionList as Doc[]).map(withBuild)
        else if (url.endsWith('/session/test-session')) body = storedSession
        else if (url.endsWith('/coach-event') && init?.body) body = {}
        else {
            unexpectedRequests.push(url)
            throw new Error(`Unexpected offline request: ${url}`)
        }
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
    }))
})

afterEach(() => {
    expect(unexpectedRequests).toEqual([])
})

/** The notice as the page shows it, or null: found by what it is (a note carrying the server's label), never by words written here. */
const shownNotice = () => document.querySelector<HTMLElement>('[data-pathway-notice="notice"]')
const shownLabels = () => [...document.querySelectorAll<HTMLElement>('[data-pathway-notice="label"]')]

function expectTheServersNotice(element: HTMLElement | null) {
    if (!element) throw new Error('no notice is shown')
    expect(element.getAttribute('role')).toBe('note')
    expect(within(element).getByText(notice.label)).toBeTruthy()
    expect(within(element).getByText(notice.words)).toBeTruthy()
}

/** The guided planning conversation, answered as a coach would, for a goal of the registry; the server answers with `answer`. */
async function generateFor(goalId: string, answer: unknown) {
    generateAnswer = answer
    render(
        <MemoryRouter initialEntries={['/session/test-session/activity-generator']}>
            <Routes>
                <Route path='/session/:id/activity-generator' element={<ActivityGenerator />} />
            </Routes>
        </MemoryRouter>,
    )
    const goal = goalNamed(goalId)
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(`^${goal.name}`) }))
    if (goal.practiceSituations.length > 0) fireEvent.click(screen.getByRole('button', { name: 'None of these — continue' }))
    fireEvent.click(screen.getByRole('button', { name: /^First Time Exploring/ }))
    fireEvent.click(screen.getByRole('button', { name: '20 min' }))
    fireEvent.click(screen.getByRole('button', { name: 'Generate activity' }))
}

function openSaved(id: string) {
    render(
        <MemoryRouter initialEntries={[`/activity/${id}`]}>
            <Routes>
                <Route path='/activity/:id' element={<ActivityPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('the status notice beside an activity the checked pathway did not build', () => {
    it('the fixture is the server\'s: the generated choice carries a DRAFT notice, the checked activity none', () => {
        expect(notice.status).toBe('DRAFT')
        expect(typeof notice.label).toBe('string')
        expect(typeof notice.words).toBe('string')
        expect('pathwayNotice' in fixture.checkedResult).toBe(false)
        expect(fixture.checkedResult.pathway).toBe('CHECKED_CHAIN')
        expect(fixture.legacySaved.pathwayNotice).toEqual(notice)
        expect(fixture.earlierSaved.pathwayNotice).toEqual(notice)
        expect('pathwayNotice' in fixture.checkedSaved).toBe(false)
    })

    it('the live choice of generated activities shows the server\'s notice once, above the activities', async () => {
        await generateFor('D01', fixture.legacyResult)
        await screen.findByRole('heading', { name: 'Choose Your Activity' })
        expect(generateRequests).toHaveLength(1)
        expect((generateRequests[0].planning as { learningGoalId: string }).learningGoalId).toBe('D01')
        expectTheServersNotice(shownNotice())
        expect(document.querySelectorAll('[data-pathway-notice]')).toHaveLength(1)
        // Above the activity card: the coach reads it before choosing.
        const [card] = screen.getAllByText(fixture.legacyResult.activities[0].title)
        expect(shownNotice().compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('the checked activity on the live route shows no notice', async () => {
        await generateFor('A01', fixture.checkedResult)
        await screen.findByRole('button', { name: 'Select This Activity' })
        expect(generateRequests).toHaveLength(1)
        expect(shownNotice()).toBeNull()
        expect(document.querySelectorAll('[data-pathway-notice]')).toHaveLength(0)
        expect(screen.queryByText(notice.label)).toBeNull()
    })

    it.each([
        ['saved from the live choice', 'test-legacy', fixture.legacySaved.title],
        ['saved before this notice (no pathway recorded)', 'test-earlier', fixture.earlierSaved.title],
    ])('a saved activity opened later shows the notice: %s', async (_what, id, title) => {
        openSaved(id)
        await screen.findAllByRole('heading', { name: title })
        expectTheServersNotice(shownNotice())
        expect(document.querySelectorAll('[data-pathway-notice]')).toHaveLength(1)
    })

    it('a saved checked activity opened later shows no notice', async () => {
        openSaved('test-checked')
        await screen.findAllByRole('heading', { name: fixture.checkedSaved.title })
        // The stored build is shown (the review page's own component, behind the in-progress page's details toggle);
        // nothing says it is unchecked.
        fireEvent.click(screen.getByRole('button', { name: 'Show full details' }))
        expect(document.querySelector('article')).not.toBeNull()
        expect(shownNotice()).toBeNull()
        expect(document.querySelectorAll('[data-pathway-notice]')).toHaveLength(0)
    })

    it('the session\'s list shows the short status beside each unchecked activity and none beside the checked one', async () => {
        render(
            <MemoryRouter initialEntries={['/session/test-session']}>
                <Routes>
                    <Route path='/session/:id' element={<SessionPage />} />
                </Routes>
            </MemoryRouter>,
        )
        const list = fixture.sessionList as Doc[]
        await screen.findByText(list[0].title)
        const unchecked = list.filter((doc) => doc.pathway !== 'CHECKED_CHAIN')
        expect(unchecked.length).toBeGreaterThan(0)
        expect(list.some((doc) => doc.pathway === 'CHECKED_CHAIN')).toBe(true)
        expect(shownLabels()).toHaveLength(unchecked.length)
        for (const label of shownLabels()) {
            expect(label.textContent).toBe(notice.label)
            expect(label.getAttribute('title')).toBe(notice.words)
        }
        // Each label sits in the card of an activity the checked pathway did not build.
        const cardTitles = shownLabels().map((label) => label.parentElement.querySelector('h3').textContent)
        expect(cardTitles).toEqual(unchecked.map((doc) => doc.title))
    })

    it('renders nothing of its own: no notice sent, or one without its words, shows nothing', () => {
        const { container } = render(
            <>
                <PathwayNotice notice={null} />
                <PathwayNotice notice={undefined} compact />
                <PathwayNotice notice={{ ...notice, words: ' ' }} />
                <PathwayNotice notice={{ ...notice, label: '' }} compact />
            </>,
        )
        expect(container.innerHTML).toBe('')
    })
})
