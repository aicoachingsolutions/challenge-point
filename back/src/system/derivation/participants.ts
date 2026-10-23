/**
 * **Which participant a value names — the one reader every consumer asks.** Added 22 October 2026 (register version 15).
 *
 * Christian, reply filed 25 October 2026, item 6: *"Any participant or role required by an activity must actually be present in
 * the authorized configuration."* *"This safeguard should not depend on particular wording or on the current realization's
 * existing [specialized-role]-count restriction."* *"The same principle should apply to other required participants or specialized
 * roles."* (His role noun is bracketed: the coupling ratchet keeps a sport's nouns out of this layer.)
 *
 * **What was there.** Two exact strings decided who a value named: the begin condition's taker match compared an arm's `takenBy`
 * with a transition's taker as raw text (`gates.ts`), and the renderer recognised the one authored taker that is not a role by a
 * literal copy of its wording (`render-concrete-game.ts`). Nothing at all asked whether the participant a value named was in the
 * game: a copy of Play Out from the Back with none of its specialized role on either team was served saying the building team's
 * holder of that role restarts play. Now a value names a participant only through the register:
 *
 *   - a **specialized role** where it is the role name a `specializedRole` row carries — the row's path leaf, which is also the
 *     name the session states availability under — so the role is found by the row, never by a word written here;
 *   - a **form** of the register's `participants` block, matched by its whole value, with the kind the engine implements for it;
 *   - **nothing** otherwise: open text establishes no participant (SD-63, *"Open-text equality does not establish identity for a
 *     structural referent"*), so a check that needs one withholds, and a begin condition is met by no taker it cannot identify.
 *
 * Sport-neutral: no role, form or designation is named here.
 */
import { ParticipantFormKind, RegisterIndex } from './register'

export type Participant =
    /** A role a specialized-role row counts per team; `row` is that row. */
    | { kind: 'SPECIALIZED_ROLE'; row: string; name: string; value: string }
    /** A form of the register's participants block; `row` is a COUNTED_GROUP's count row, else null. */
    | { kind: ParticipantFormKind; row: string | null; name: string | null; value: string }

/** The participant a value names, or null where the register types none (open text, or not a string). */
export function participantOf(index: RegisterIndex, value: unknown): Participant | null {
    if (typeof value !== 'string') return null
    for (const [row, role] of index.specializedRoleRows) if (role === value) return { kind: 'SPECIALIZED_ROLE', row, name: role, value }
    const form = index.participants?.forms.find(entry => entry.value === value)
    return form ? { kind: form.kind, row: form.countRow, name: form.coachNoun, value } : null
}

/** Do two values name one participant? False where either names none: two identical open texts identify nobody (SD-63). */
export function sameParticipant(index: RegisterIndex, a: unknown, b: unknown): boolean {
    const left = participantOf(index, a)
    const right = participantOf(index, b)
    return !!left && !!right && left.kind === right.kind && left.row === right.row && left.value === right.value
}

/**
 * **The rows that count a team's performers** — the outfield row and every specialized-role row of the teams row, as the register's
 * reassignment block lists them (the same reading the cross-block membership check RB-M makes), or, in a register without that
 * block, the specialized-role rows owned by the teams row after the outfield count GA-ROSTER-SUM sums.
 */
export function performerRows(index: RegisterIndex): string[] {
    if (index.reassignment) return [...index.reassignment.performerRows]
    const teamsRow = index.designations.teamsRow
    return ['P2', ...[...index.specializedRoleRows.keys()].filter(row => !teamsRow || index.ownerRow.get(row) === teamsRow)]
}
