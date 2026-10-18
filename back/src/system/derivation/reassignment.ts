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
 * **A relative count, resolved inside the one block whose game holds it** — register B7 version 2 (register version 14), stage M4,
 * 17 October 2026. His reply filed 19 October 2026, item 3 F: *"With 5 outfield players plus a [specialized role] against 5 outfield
 * players, only the [specialized role] changes teams at a role exchange. No additional outfield player transfer is required."* (his
 * role noun bracketed, as the coupling ratchet keeps a sport's nouns out of this layer) and his
 * reply filed 18 October 2026, item 1: *"This preserves the 6 + GK versus 5 relationship in both blocks."*
 *
 * A count written `{keepsCountOf: R}` (R a role of the role vocabulary) is the number of these performers that keeps, in the
 * block the exchange begins, the count of this row the team holding R had in this block. With the two roles of a role block it
 * is the same number whichever role R names: the team holding `toRole` here has n, the team holding the other role has m, and
 * moving n − m keeps both roles' counts (OUR ARITHMETIC, from his stated reason; the relative form is ours, SD-113). It is read
 * from THIS block's game only — its teams, the roles they hold and the end bindings — never from the other block, so the
 * cross-block membership check (RB-M, `rendering/role-blocks.ts`) still compares the second block, built independently, with
 * what this count states. Where it resolves to 0, no reassignment of these performers is established: the element is taken
 * out of the game, never written with a count of 0 (`reassignmentsIn` still refuses a count below 1). Anything that does not
 * resolve — an unknown role, not exactly two roles, a role no bound team holds, a count no team carries, a negative difference —
 * is a problem named, and the element is left as it was, so the membership check refuses it too. Mutates `game`; a game holding
 * no relative count is untouched. Sport-neutral: the rows, roles and leaves are register data.
 */
export function resolveRelativeCounts(
    game: any,
    index: RegisterIndex,
    roleBlock: RoleBlock | null,
    bindings: { designation: string; handle: string }[],
): { resolved: { elementId: string; count: number }[]; removed: string[]; problems: string[] } {
    const spec = index.reassignment
    const out = { resolved: [] as { elementId: string; count: number }[], removed: [] as string[], problems: [] as string[] }
    if (!spec) return out
    const at = containerOf(index, spec.row)
    const elements: any[] = at && Array.isArray(read(game, at)) ? read(game, at) : []
    const relative = (raw: unknown): raw is { keepsCountOf: unknown } => !!raw && typeof raw === 'object' && !Array.isArray(raw) && 'keepsCountOf' in (raw as object)
    if (!elements.some(element => relative(element?.[spec.countLeaf]))) return out
    const roles = index.roleBlocks?.roles ?? []
    const teamsAt = index.designations.teamsRow ? containerOf(index, index.designations.teamsRow) : null
    const teams: any[] = teamsAt && Array.isArray(read(game, teamsAt)) ? read(game, teamsAt) : []
    const handleOf = (setup: string | undefined) => (setup ? bindings.find(binding => designationKey(index, binding.designation) === designationKey(index, setup))?.handle : undefined)
    const leafOf = (rowId: string) => String(index.rows.get(rowId)?.path ?? '').split('[].').pop() ?? rowId
    const keep: any[] = []
    for (const element of elements) {
        const raw = element?.[spec.countLeaf]
        if (!relative(raw)) {
            keep.push(element)
            continue
        }
        const id = String(element?.elementId)
        const fail = (why: string) => {
            out.problems.push(`${at}[${id}]: the count ${JSON.stringify(raw)} cannot be resolved in this block: ${why}`)
            keep.push(element)
        }
        const toRole = element?.[spec.toRoleLeaf]
        const performerRow = element?.[spec.performerRowLeaf]
        const keeps = raw.keepsCountOf
        if (typeof keeps !== 'string' || !roles.includes(keeps)) { fail(`${JSON.stringify(keeps)} is not a role of the role vocabulary (${roles.join(', ')})`); continue }
        if (typeof toRole !== 'string' || !roles.includes(toRole)) { fail(`the role the performers join, ${JSON.stringify(toRole)}, is not a role of the role vocabulary`); continue }
        if (typeof performerRow !== 'string' || !spec.performerRows.includes(performerRow)) { fail(`the performers are counted by ${JSON.stringify(performerRow)}, which is not one of ${spec.performerRows.join(', ')}`); continue }
        if (roles.length !== 2) { fail(`a relative count is defined for two roles, and the role vocabulary holds ${roles.length}`); continue }
        if (!roleBlock) { fail('the game is not one block of a role exchange'); continue }
        const other = roles.find(role => role !== toRole)!
        const [gainingRoleHolder, otherHolder] = [handleOf(roleBlock.holders[toRole]), handleOf(roleBlock.holders[other])]
        if (!gainingRoleHolder || !otherHolder || gainingRoleHolder === otherHolder) { fail(`the ${toRole} and ${other} roles are not held by two teams bound to an end in this block`); continue }
        const leaf = leafOf(performerRow)
        const countOf = (handle: string) => teams.find(team => String(team?.elementId) === handle)?.[leaf]
        const [n, m] = [countOf(gainingRoleHolder), countOf(otherHolder)]
        if (!Number.isInteger(n) || !Number.isInteger(m)) { fail(`the teams carry no whole ${leaf} count in this block`); continue }
        const count = n - m
        if (count < 0) { fail(`the team holding the ${toRole} role has ${n} ${leaf} and the team holding the ${other} role ${m}, so keeping both counts would move performers away from the ${toRole} role`); continue }
        if (count === 0) {
            out.removed.push(id)
            continue
        }
        element[spec.countLeaf] = count
        out.resolved.push({ elementId: id, count })
        keep.push(element)
    }
    if (out.removed.length) {
        const parts = at!.split('.')
        const parent = parts.length > 1 ? read(game, parts.slice(0, -1).join('.')) : game
        parent[parts[parts.length - 1]] = keep
    }
    return out
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
