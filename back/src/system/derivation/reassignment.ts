/**
 * **Participant reassignment: which performers change team when the roles exchange — its own capability.** Added 15 October
 * 2026 (stage K4) for his answer to RD-1, reply filed 18 October 2026:
 *
 *   > *"One architectural distinction: role exchange and participant reassignment should remain separate capabilities.
 *   > Exchanging roles should not inherently require players to change teams. This particular realization uses both
 *   > mechanisms to preserve its intended numerical relationship."*
 *
 * The first realization's own reassignment (his 1(a), quoted on its items in provisional-realizations.json) is that
 * realization's data, never this module's.
 *
 * A reassignment is an element of the register's reassignment row (version 11): at each exchange, `count` performers of the
 * kind `performerRow` counts move to the team that newly holds `toRole`, from the team that held it before. A role exchange
 * (`role-blocks.ts`) moves nobody; where no reassignment is established, every team keeps its performers in every block, and
 * the cross-block membership check (`rendering/role-blocks.ts`, RB-M) refuses any change no reassignment states. His
 * Option 1(c) — keeping membership and changing the numerical problem — is therefore a realization that records none.
 *
 * Read from a realized game (each block's own complete game holds the same elements), validated against the register, and
 * expected per team as a change of counts between two blocks. Sport-neutral: rows, roles and leaves are register data.
 */
import { designationKey } from './designation'
import { RegisterIndex } from './register'
import { splitPath } from './resolved-game'
import { RoleBlock } from './types'

/** One reassignment as a game holds it. */
export interface Reassignment {
    elementId: string
    toRole: string
    performerRow: string
    count: number
}

const read = (root: any, path: string): any => (path ? path.split('.').reduce((node, key) => (node == null ? node : node[key]), root) : root)

/** Where a register row's elements sit in a game (`reassignments`). */
const containerOf = (index: RegisterIndex, rowId: string): string | null => {
    const path = index.rows.get(rowId)?.path
    return path ? (splitPath(String(path)).container ?? String(path)) : null
}

/**
 * The reassignments a game holds, each checked against the register: a role of the role vocabulary, a row that counts a kind
 * of performer per team, a whole count of one or more, and no two for the same role and kind. Anything else is a problem
 * named, never repaired. A register without the capability, or a game holding none, holds none.
 */
export function reassignmentsIn(game: any, index: RegisterIndex): { found: Reassignment[]; problems: string[] } {
    const spec = index.reassignment
    if (!spec) return { found: [], problems: [] }
    const at = containerOf(index, spec.row)
    const elements: any[] = at && Array.isArray(read(game, at)) ? read(game, at) : []
    const found: Reassignment[] = []
    const problems: string[] = []
    const roles = index.roleBlocks?.roles ?? []
    const seen = new Set<string>()
    for (const element of elements) {
        const id = String(element?.elementId)
        const toRole = element?.[spec.toRoleLeaf]
        const performerRow = element?.[spec.performerRowLeaf]
        const raw = element?.[spec.countLeaf]
        const count = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN
        if (typeof toRole !== 'string' || !roles.includes(toRole)) problems.push(`${at}[${id}]: the role the performers join is ${JSON.stringify(toRole)}, which the role vocabulary (${roles.join(', ')}) does not hold`)
        else if (typeof performerRow !== 'string' || !spec.performerRows.includes(performerRow)) problems.push(`${at}[${id}]: the performers are counted by ${JSON.stringify(performerRow)}, which is not one of ${spec.performerRows.join(', ')}`)
        else if (!Number.isInteger(count) || count < 1) problems.push(`${at}[${id}]: ${JSON.stringify(raw)} is not a whole count of one or more performers`)
        else if (seen.has(`${toRole}|${performerRow}`)) problems.push(`${at}[${id}]: a second reassignment of ${performerRow} to the ${toRole} role`)
        else {
            seen.add(`${toRole}|${performerRow}`)
            found.push({ elementId: id, toRole, performerRow, count })
        }
    }
    return { found: found.sort((a, b) => a.elementId.localeCompare(b.elementId)), problems }
}

/**
 * **The change in each team's counts from one block to the next, as the reassignments state it** — keyed by the team's
 * handle, then by the row that counts the performers. The team newly holding `toRole` gains `count`, the team that held it
 * loses `count`; every other change is zero. `bindings` are the end-to-team bindings realization recorded (identical in
 * both blocks, RB-2). Problems where a role is not held by a bound team in either block, or does not pass at the exchange.
 */
export function expectedChange(
    reassignments: Reassignment[],
    from: RoleBlock,
    to: RoleBlock,
    bindings: { designation: string; handle: string }[],
    index: RegisterIndex,
): { change: Map<string, Map<string, number>>; problems: string[] } {
    const change = new Map<string, Map<string, number>>()
    const problems: string[] = []
    const handleOf = (setup: string | undefined) => (setup ? bindings.find(binding => designationKey(index, binding.designation) === designationKey(index, setup))?.handle : undefined)
    const add = (handle: string, row: string, n: number) => {
        const rows = change.get(handle) ?? new Map<string, number>()
        rows.set(row, (rows.get(row) ?? 0) + n)
        change.set(handle, rows)
    }
    for (const reassignment of reassignments) {
        const gaining = handleOf(to.holders[reassignment.toRole])
        const losing = handleOf(from.holders[reassignment.toRole])
        if (!gaining || !losing) {
            problems.push(`the ${reassignment.toRole} role is not held by a team realization bound to an end in both blocks, so where ${reassignment.elementId}'s performers go cannot be told`)
            continue
        }
        if (gaining === losing) {
            problems.push(`the ${reassignment.toRole} role stays with one team across the exchange, so ${reassignment.elementId} moves nobody anywhere`)
            continue
        }
        add(gaining, reassignment.performerRow, reassignment.count)
        add(losing, reassignment.performerRow, -reassignment.count)
    }
    return { change, problems }
}
