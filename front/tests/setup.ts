import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
    // jsdom has no media-query evaluation; SelectField uses this to choose its desktop UI.
    vi.stubGlobal('matchMedia', (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
    }))
})

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

// jsdom has no layout or scrolling; the page uses this only after a response arrives.
HTMLElement.prototype.scrollIntoView = vi.fn()
