/**
 * **Role blocks: which games are played in blocks, and the two blocks they are played in.** Added 15 October 2026 (stage
 * K3) for his M1, reply filed 17 October 2026:
 *
 *   > *"M1 — Role exchange by block: Approved. Keep role assignments separate from fixed ends. Allow target configurations
 *   > to reflect each team's role during the block. The coach controls the exchange. No new block-duration system is
 *   > needed."*
 *
 * and his D2: *"One team builds out while the other presses. The coach determines when the teams exchange roles. No
 * mandatory block duration is needed."*
 *
 * **What it decides, and what it does not.** A game is played in role blocks where its selected contributions establish
 * every role of the register's role vocabulary, one element each, and every role passes by an exchange of the register's
 * exchange vocabulary (today one member: the coach calls the next block). Two roles and two end-assigned teams admit
 * exactly two bijections, so the two blocks are ENTAILED, never chosen; which one is played first is the coach's, and
 * nothing here orders them beyond the register's own list order. A game establishing none of it is not a role-block game
 * and goes on exactly as before. A game establishing PART of it — one role, a role nobody registered, an exchange the
 * vocabulary does not hold, roles without two end-assigned teams to hold them — is refused with the reason, never
 * completed: a role exchange half-described is not one the coach can run.
 *
 * **Why each block is derived as its own complete game** (the builder's job, `build-activity.ts`): every check the engine
 * has then runs on each block unchanged, and nothing downstream has to learn per-block overlays — an overlay one consumer
 * skips passes silently. What the blocks share and how they differ is then checked across them (`rendering/role-blocks.ts`,
 * RB-1 to RB-8).
 *
 * Read from the base derivation of the game (stages 0-5), so the roles are the classes the knowledge actually formed and
 * the exchange is the value derivation actually resolved — nothing is re-read from the items' text. Sport-neutral: rows,
 * roles, exchanges and designations are register data (`roleBlocks`, register version 10).
 */
import { DerivedLine, resolvedValue } from './derive'
import { designationKey } from './designation'
import { RegisterIndex } from './register'
import { ElementClass, ItemRef, RoleBlock } from './types'

export type RoleBlocksFound =
    /** The game establishes no role: it is not a role-block game. */
    | { kind: 'NONE' }
    /** The game is played in two role blocks. */
    | { kind: 'BLOCKS'; roles: string[]; exchange: string; blocks: [RoleBlock, RoleBlock]; from: ItemRef[] }
    /** The game establishes part of a role exchange: refused, each reason said. */
    | { kind: 'REFUSED'; why: string[] }

/** A block named by its own bindings, role by role in vocabulary order. */
export const blockIdOf = (roles: string[], holders: Record<string, string>): string => roles.map(role => `${role}=${holders[role]}`).join(',')

/** The other block: the same roles, each held by the other end-assigned team. */
export function exchangeOf(block: RoleBlock, roles: string[]): RoleBlock | null {
    const ends = roles.map(role => block.holders[role])
    if (roles.length !== 2 || ends.some(end => !end) || ends[0] === ends[1]) return null
    const holders = { [roles[0]]: ends[1], [roles[1]]: ends[0] }
    return { blockId: blockIdOf(roles, holders), holders }
}

/**
 * The role blocks of a game, from its base derivation. `classes` and `derived` are stages 2 and 5 of a run made WITHOUT a
 * role block; `designated` is every team designation the game's classes name, so roles are bound only to ends the game
 * actually assigns.
 */
export function roleBlocksOf(classes: ElementClass[], derived: Map<string, DerivedLine>, index: RegisterIndex): RoleBlocksFound {
    const spec = index.roleBlocks
    if (!spec) return { kind: 'NONE' }
    const elements = classes.filter(cls => cls.row === spec.rolesRow)
    if (!elements.length) return { kind: 'NONE' }

    const why: string[] = []
    const roleOf = new Map<string, string>()
    for (const element of elements) {
        const term = element.constraints.terms.find(t => t.attribute === spec.roleAttribute && t.op === '=')
        const role = term && term.op === '=' ? String(term.value) : null
        const by = `${element.fromItem.contractId}::${element.fromItem.itemId}`
        if (!role) why.push(`${by} establishes an element of ${spec.rolesRow} whose ${spec.roleAttribute} its selector does not fix, so it is no role`)
        else if (!spec.roles.includes(role)) why.push(`${by} establishes the role ${role}, which the role vocabulary (${spec.roles.join(', ')}) does not hold`)
        else roleOf.set(element.classId, role)
    }
    const established = [...roleOf.values()]
    for (const role of spec.roles) {
        const count = established.filter(r => r === role).length
        if (count === 0) why.push(`no contribution establishes the role ${role}: a role block needs every role of ${spec.roles.join(', ')}, one team each`)
        if (count > 1) why.push(`the role ${role} is established ${count} times; each role is held by one team`)
    }

    const exchanges = new Set<string>()
    for (const element of elements) {
        const lineId = `${element.classId}::${spec.exchangeRow}`
        const value = resolvedValue(derived.get(lineId))?.value
        if (typeof value !== 'string' || !spec.exchanges.includes(value)) {
            why.push(`${lineId}: how the role passes to the other team is ${value === undefined ? 'not established' : JSON.stringify(value)}; it must be one of ${spec.exchanges.join(', ')}`)
            continue
        }
        exchanges.add(value)
    }
    if (exchanges.size > 1) why.push(`the roles pass to the other team in different ways (${[...exchanges].join(', ')}); the teams exchange roles together`)

    // The two end-assigned teams the roles are held by: the register's setup assignments the game itself names.
    const named = new Set(classes.flatMap(cls => cls.constraints.terms.flatMap(t => (t.op === 'IN' ? t.values : [t.value])).map(value => designationKey(index, value))))
    const ends = [...index.designations.resolutions.entries()].filter(([, resolution]) => resolution.kind === 'SETUP_ASSIGNMENT').map(([name]) => name)
    const used = ends.filter(end => named.has(end))
    if (used.length !== 2 || used.length !== spec.roles.length) {
        why.push(`a role is held by an end-assigned team, and this game assigns ${used.length ? used.join(', ') : 'no team'} to an end; role blocks need ${spec.roles.length}, one per role`)
    }

    if (why.length) return { kind: 'REFUSED', why }
    const first = Object.fromEntries(spec.roles.map((role, i) => [role, used[i]]))
    const block: RoleBlock = { blockId: blockIdOf(spec.roles, first), holders: first }
    return {
        kind: 'BLOCKS',
        roles: [...spec.roles],
        exchange: [...exchanges][0],
        blocks: [block, exchangeOf(block, spec.roles)!],
        from: elements.map(element => ({ ...element.fromItem })),
    }
}
