/**
 * **A member of the selector's combination that the constraint package did not use, in plain words** (13 November 2026; wording ours,
 * DRAFT, for Christian's review). Christian, received 12 November 2026, item 4, asks that the system distinguish "Constraints considered or
 * eligible." "Constraints actually selected for application." "Constraints validated." "Constraints included in the final activity." The
 * constraints applied are listed where each screen lists them; each line here names one member of the selector's combination that the
 * package left out, the existing engine rule that left it out, and the member of its role the package kept, as the server sent them.
 *
 * What a line never says: that a constraint fits, or does not fit, this game. The package's scores are keyword scores, not a judgement about
 * the game. Nor does it say 'considered': that names Christian's whole first stage (every eligible constraint), and these lines list only
 * the combination's members left out. The label '(ours, DRAFT)' is part of every line, so it shows wherever the line shows, for every viewer.
 *
 * One wording for the three screens that show these members: the review page's 'Constraints selected' panel (its account carries the role
 * and the member kept as an object), and the creation screen's debug panel and the selection debug page (their trace carries the member
 * kept as a title and no role).
 */

/** One member not applied, in either shape the server sends (the review account's, or the debug trace's). */
export interface ConstraintNotAppliedLine {
    title: string
    /** The existing package rule that left it out: 'ONE_MEMBER_PER_ROLE', 'CONSEQUENCE_SCORE_AT_OR_BELOW_12' or 'NO_ROLE_MATCH'. */
    rule: string
    /** The package role, where the record carries it (the review account does; the debug trace does not). */
    role?: string
    /** The member of its role the package kept: an object with its title (review account), its title (debug trace), or null for none. */
    kept?: { title: string } | string | null
    /** The library id, shown after the line where the record carries it. */
    id?: string
}

const keptTitle = (kept: ConstraintNotAppliedLine['kept']): string | null =>
    kept === null || kept === undefined ? null : typeof kept === 'string' ? kept : kept.title

/** The line for one member not applied: the engine rule and the member kept, then '(ours, DRAFT)'. */
export function constraintNotAppliedSaid(entry: ConstraintNotAppliedLine): string {
    const oneOf = entry.role ? `one ${entry.role} constraint` : 'one constraint per role'
    const why =
        entry.rule === 'ONE_MEMBER_PER_ROLE'
            ? `the package uses ${oneOf}; ${keptTitle(entry.kept) ?? 'another member'} was kept`
            : entry.rule === 'CONSEQUENCE_SCORE_AT_OR_BELOW_12'
              ? 'the package keeps a consequence constraint only where its package score is above 12; none was'
              : entry.rule === 'NO_ROLE_MATCH'
                ? "the package's role scoring admitted no shaping constraint here"
                : `the package's rule ${entry.rule}`
    return `In the selector's combination, not used: ${entry.title} (${why}) (ours, DRAFT).`
}

type ConstraintsNotAppliedProps = { entries: readonly ConstraintNotAppliedLine[] | null | undefined; className?: string }

/** One line per member not applied, after the constraints applied; nothing where there is none. Read defensively: the debug trace is untyped. */
export function ConstraintsNotApplied({ entries, className = 'mt-1 text-xs text-gray-600' }: ConstraintsNotAppliedProps) {
    const lines: readonly ConstraintNotAppliedLine[] = Array.isArray(entries) ? (entries as readonly ConstraintNotAppliedLine[]) : []
    if (lines.length === 0) return null
    return (
        <>
            {lines.map((entry, index) => (
                <p key={entry.id ?? `${entry.title}-${index}`} className={className}>
                    {constraintNotAppliedSaid(entry)}
                    {entry.id && <span className='text-gray-500'> ({entry.id})</span>}
                </p>
            ))}
        </>
    )
}
