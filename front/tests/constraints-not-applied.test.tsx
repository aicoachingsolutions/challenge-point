import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArrivedAt } from '@/app/ActivityReviewPage'
import { ConstraintsNotApplied } from '@/app/ConstraintsNotApplied'
import type { ActivityReviewResult, ReviewConstraintNotApplied } from '@/MODELS/activity-review.model'
import fixture from './fixtures/a01.json'

/**
 * The members of the selector's combination the package did not use, on the review page's 'Constraints selected' panel (13 November 2026;
 * the VL verification, checks 1 and 6). Christian, received 12 November 2026, item 4, asks that the system distinguish "Constraints
 * considered or eligible." "Constraints actually selected for application." "Constraints validated." "Constraints included in the final
 * activity." Each line names the engine rule and the member kept, never a fit with the game, never 'considered', and carries a visible
 * '(ours, DRAFT)' for every viewer.
 *
 * The served body is A01's, unchanged (fixtures/a01.json, its provenance there); only `account.constraintsNotApplied` is added, one entry for
 * each rule the server can send, with TEST-ONLY titles and ids. The wording asserted is ours, DRAFT, for Christian's review.
 */
const ENTRIES: ReviewConstraintNotApplied[] = [
    {
        id: 'TEST-ONLY-dropped-foundation',
        title: 'TEST-ONLY dropped foundation',
        role: 'foundation',
        rule: 'ONE_MEMBER_PER_ROLE',
        kept: { id: 'TEST-ONLY-kept-foundation', title: 'TEST-ONLY kept foundation' },
    },
    { id: 'TEST-ONLY-dropped-consequence', title: 'TEST-ONLY dropped consequence', role: 'consequence', rule: 'CONSEQUENCE_SCORE_AT_OR_BELOW_12', kept: null },
    { id: 'TEST-ONLY-dropped-shaping', title: 'TEST-ONLY dropped shaping', role: 'shaping', rule: 'NO_ROLE_MATCH', kept: null },
]
const SAID = [
    "In the selector's combination, not used: TEST-ONLY dropped foundation (the package uses one foundation constraint; TEST-ONLY kept foundation was kept) (ours, DRAFT). (TEST-ONLY-dropped-foundation)",
    "In the selector's combination, not used: TEST-ONLY dropped consequence (the package keeps a consequence constraint only where its package score is above 12; none was) (ours, DRAFT). (TEST-ONLY-dropped-consequence)",
    "In the selector's combination, not used: TEST-ONLY dropped shaping (the package's role scoring admitted no shaping constraint here) (ours, DRAFT). (TEST-ONLY-dropped-shaping)",
]

describe('constraints not applied', () => {
    it('the review page lists each after the constraints applied, each line with a visible (ours, DRAFT), naming the rule and never a fit', () => {
        const result = { ...fixture.activity, account: { ...fixture.activity.account, constraintsNotApplied: ENTRIES } } as unknown as ActivityReviewResult
        render(<ArrivedAt result={result} />)
        fireEvent.click(screen.getByRole('button', { name: 'Show' }))
        const field = screen.getByText('Constraints selected').parentElement as HTMLElement
        const lines = within(field).getAllByText(/^In the selector's combination, not used: /, { selector: 'p' })
        expect(lines.map((line) => line.textContent)).toEqual(SAID)
        for (const line of lines) expect(line.textContent).toContain('(ours, DRAFT)')
        expect(field.textContent).not.toMatch(/considered|fits this game|closely enough/i)
    })

    it("the debug panels' shape (title, rule, the title kept; no role, no id) gets the same wording and the same visible label", () => {
        render(<ConstraintsNotApplied entries={[{ title: 'TEST-ONLY dropped', rule: 'ONE_MEMBER_PER_ROLE', kept: 'TEST-ONLY kept' }]} />)
        const line = screen.getByText(/^In the selector's combination, not used: TEST-ONLY dropped /, { selector: 'p' })
        expect(line.textContent).toBe("In the selector's combination, not used: TEST-ONLY dropped (the package uses one constraint per role; TEST-ONLY kept was kept) (ours, DRAFT).")
    })
})
