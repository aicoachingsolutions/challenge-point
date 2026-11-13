import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/**
 * The selection debug page renders the members of the selector's combination the package did not use, beside the constraints applied
 * (13 November 2026, from the VL2 verification, note N1: the debug screens had no rendering test of their own). The server's response is
 * replaced by a TEST-ONLY body in the shape /api/app/debug-selection sends (`selectedConstraints` the applied titles; each not-applied entry
 * its title, the rule and the title kept; no role, no id). The wording asserted is ours, DRAFT, for Christian's review.
 */
vi.mock('@/services/api.service', () => ({
    api: vi.fn(async () => ({
        data: {
            learningGoal: 'TEST-ONLY goal',
            selection: {
                selectedArchetype: { id: 'TEST-ONLY-archetype', name: 'TEST-ONLY archetype' },
                selectedAffordances: [],
                selectedConstraints: ['TEST-ONLY kept'],
                constraintsNotApplied: [{ title: 'TEST-ONLY dropped', rule: 'ONE_MEMBER_PER_ROLE', kept: 'TEST-ONLY kept' }],
            },
        },
    })),
}))

import DebugSelection from '@/app/DebugSelection'

describe('selection debug page', () => {
    it("shows each member not applied inside 'Selected constraints / incentives', after the applied list, with a visible (ours, DRAFT)", async () => {
        render(<DebugSelection />)
        fireEvent.change(screen.getByPlaceholderText(/protecting central space/), { target: { value: 'TEST-ONLY goal' } })
        fireEvent.click(screen.getByRole('button', { name: 'Run' }))
        const line = await screen.findByText(/^In the selector's combination, not used: TEST-ONLY dropped /, { selector: 'p' })
        expect(line.textContent).toBe("In the selector's combination, not used: TEST-ONLY dropped (the package uses one constraint per role; TEST-ONLY kept was kept) (ours, DRAFT).")
        const field = screen.getByText('Selected constraints / incentives').parentElement as HTMLElement
        expect(field.contains(line)).toBe(true)
        expect(field.textContent?.indexOf('TEST-ONLY kept')).toBeLessThan(field.textContent?.indexOf("In the selector's combination") ?? -1)
    })
})
