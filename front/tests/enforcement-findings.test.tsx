import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EnforcementFindings } from '@/app/ActivityReviewPage'
import type { RequirementAccount, RequirementEnforcementFailure } from '@/MODELS/activity-review.model'

/**
 * The Enforcement panel's findings in his two classes (round 4; the fix round, the R3 review's S-6). His reply filed 5 November 2026, item 1,
 * asks that the diagnostic report clearly distinguish a missing or altered requirement from a verification failure. The page shows what the
 * server sends: one group per class that holds a finding, in the order the server lists the classes, under the label sent, with the
 * definition quoted and cited, and each finding's reason and why it is in its class. A back without the classes shows the plain list.
 *
 * Every string below is a TEST-ONLY stand-in: his labels and definitions are never written here, since the panel only renders what it is sent.
 */
const failure = (failureClass: string, reason: string, blocks: string[]): RequirementEnforcementFailure => ({
    failureClass,
    source: 'COMPONENT',
    rowId: 'TEST-ONLY-ROW',
    component: 'TEST-ONLY-COMPONENT',
    partId: 'TEST-ONLY-PART',
    cause: 'NOT_CARRIED',
    because: `TEST-ONLY because of ${reason} (ours, DRAFT).`,
    reason,
    blocks,
})
const CLASSES = [
    { id: 'FIRST', label: 'TEST-ONLY first label', words: 'TEST-ONLY first definition.', citedAs: 'TEST-ONLY citation' },
    { id: 'SECOND', label: 'TEST-ONLY second label', words: 'TEST-ONLY second definition.', citedAs: 'TEST-ONLY citation' },
]
const accountWith = (enforcement: Record<string, unknown>) =>
    ({ blocks: [{ blockId: 'block-a' }, { blockId: 'block-b' }], enforcement: { findings: [], coachObservedOnly: [], ...enforcement } }) as unknown as RequirementAccount
const blockLabel = (blockId: string) => `label of ${blockId}`

describe('EnforcementFindings', () => {
    it('groups the findings by class in the order the classes are sent, each under its label and count, its definition quoted and cited', () => {
        // Sent in the other order: the second class's finding first.
        const failures = [failure('SECOND', 'TEST-ONLY reason 2', ['block-a', 'block-b']), failure('FIRST', 'TEST-ONLY reason 1', ['block-b'])]
        render(<EnforcementFindings account={accountWith({ classes: CLASSES, failures, findings: failures.map((entry) => entry.reason), classRule: { rule: 'TEST-ONLY rule', standing: 'DRAFT', by: 'OURS' } })} blockLabel={blockLabel} />)
        const groups = screen.getAllByRole('group')
        expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['TEST-ONLY first label', 'TEST-ONLY second label'])
        const [first, second] = groups
        expect(within(first).getByText('TEST-ONLY first label (1)')).toBeTruthy()
        expect(within(first).getByText(/TEST-ONLY first label: TEST-ONLY first definition\./)).toBeTruthy()
        expect(within(first).getByText('(TEST-ONLY citation)')).toBeTruthy()
        expect(within(first).getByText('TEST-ONLY reason 1')).toBeTruthy()
        // Why it is in its class, said once as ours (the server's words end so), and the block that gave it where not every block did.
        expect(within(first).getByText(/^Why this class: TEST-ONLY because of TEST-ONLY reason 1 \(ours, DRAFT\)\. \(label of block-b\)$/)).toBeTruthy()
        expect(within(second).getByText('TEST-ONLY reason 2')).toBeTruthy()
        expect(within(second).getByText(/^Why this class: TEST-ONLY because of TEST-ONLY reason 2 \(ours, DRAFT\)\.$/)).toBeTruthy()
        expect(within(first).queryByText('TEST-ONLY reason 2')).toBeNull()
        expect(screen.getByText('TEST-ONLY rule (ours, DRAFT)')).toBeTruthy()
    })

    it('shows no group for a class that holds no finding', () => {
        const failures = [failure('SECOND', 'TEST-ONLY reason 2', ['block-a', 'block-b'])]
        render(<EnforcementFindings account={accountWith({ classes: CLASSES, failures, findings: failures.map((entry) => entry.reason) })} blockLabel={blockLabel} />)
        expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(['TEST-ONLY second label'])
    })

    it('shows a class the page does not know under its own id, after the known ones', () => {
        const failures = [failure('TEST-ONLY-NEW', 'TEST-ONLY reason 3', ['block-a']), failure('FIRST', 'TEST-ONLY reason 1', ['block-a', 'block-b'])]
        render(<EnforcementFindings account={accountWith({ classes: CLASSES, failures, findings: failures.map((entry) => entry.reason) })} blockLabel={blockLabel} />)
        const groups = screen.getAllByRole('group')
        expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['TEST-ONLY first label', 'TEST-ONLY-NEW'])
        expect(within(groups[1]).getByText('TEST-ONLY reason 3')).toBeTruthy()
    })

    it('falls back to the plain list of findings for a back without the classes', () => {
        render(<EnforcementFindings account={accountWith({ findings: ['TEST-ONLY finding A', 'TEST-ONLY finding B'] })} blockLabel={blockLabel} />)
        expect(screen.queryAllByRole('group')).toEqual([])
        expect(screen.getByText('TEST-ONLY finding A')).toBeTruthy()
        expect(screen.getByText('TEST-ONLY finding B')).toBeTruthy()
    })
})
