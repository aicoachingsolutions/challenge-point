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
 *
 * **Stage D, 23 October 2026 — the end exchange** (register version 18, row B10 and the `endAssignment` block; his reply filed 25
 * October 2026, item 5: *"Team-end assignments may change between coach-controlled blocks when the authorized activity configuration
 * requires it."* and *"Please keep the following concepts separate in the general representation: Team identity. Assigned game role.
 * Assigned field end. Participant membership and reassignment."*). The game's end assignment is read from its base derivation too
 * (`endAssignmentOf`): absent means KEPT, and the two blocks are exactly what they were. Under EXCHANGED both blocks keep the first
 * block's role-to-end holders and the second exchanges which team stands at each end (`endsExchangeOf`, `RoleBlock.ends`), which
 * realization applies to the binding it was given; an exchange of ends in a game establishing no role is refused.
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

/**
 * A block named by its own bindings, role by role in vocabulary order. Stage D (23 October 2026): where the ends are exchanged both blocks
 * hold the same roles at the same ends, so the id adds which team stands at each end (`ends`), end by end in the register's order; a block
 * of a game that keeps its ends has no `ends` and its id is exactly what it was.
 */
export const blockIdOf = (roles: string[], holders: Record<string, string>, ends?: Record<string, string>): string =>
    roles.map(role => `${role}=${holders[role]}`).join(',') + (ends ? `|${Object.keys(ends).map(end => `${end}<${ends[end]}`).join(',')}` : '')

/** The other block: the same roles, each held by the other end-assigned team. */
export function exchangeOf(block: RoleBlock, roles: string[]): RoleBlock | null {
    const ends = roles.map(role => block.holders[role])
    if (roles.length !== 2 || ends.some(end => !end) || ends[0] === ends[1]) return null
    const holders = { [roles[0]]: ends[1], [roles[1]]: ends[0] }
    return { blockId: blockIdOf(roles, holders), holders }
}

/**
 * **The other block where the teams change ends with the roles** — stage D, 23 October 2026 (register version 18, row B10), his reply filed
 * 25 October 2026, item 5: *"The outfield groups exchange ends and building/pressing responsibilities when the coach calls for the next
 * block."* The same roles held at the same ends (the first block's holders), and the two ends exchanged between the teams: each end is held
 * by the team that held the other end in the first block. NOT the role exchange followed by a swap of ends, which would give one team the
 * same role in both blocks from opposite ends. Null unless the first block holds every role at its own end of the two given and stands
 * each team at its own end.
 */
export function endsExchangeOf(block: RoleBlock, roles: string[], ends: string[]): RoleBlock | null {
    const held = roles.map(role => block.holders[role])
    if (roles.length !== 2 || ends.length !== 2 || held.some(end => !ends.includes(end)) || held[0] === held[1]) return null
    if (!block.ends || ends.some(end => block.ends![end] !== end)) return null
    const exchanged = { [ends[0]]: ends[1], [ends[1]]: ends[0] }
    return { blockId: blockIdOf(roles, block.holders, exchanged), holders: { ...block.holders }, ends: exchanged }
}

/**
 * **The game's end assignment, from its base derivation** — stage D, 23 October 2026 (register version 18). The value of the register's
 * game-level end-assignment row (B10) as derivation resolved it. A line no contribution addresses is the kept ends: absent means KEPT, so a
 * game no item writes the row for is played exactly as before. A line some contribution addresses must resolve to one member of the closed
 * list; anything else (an open set, a value outside the list, a reach not decided) is refused, never read as kept.
 */
export function endAssignmentOf(derived: Map<string, DerivedLine>, index: RegisterIndex): { value: string; stated: boolean; lineId: string } | { refused: string } | null {
    const spec = index.endAssignment
    if (!spec) return null
    const lineId = `game::${spec.row}`
    const record = derived.get(lineId)
    const addressed = !!record && (record.entailing.length > 0 || record.bounding.length > 0 || record.narrowing.length > 0 || record.undetermined.length > 0 || !!record.open)
    if (!addressed) return { value: spec.kept, stated: false, lineId }
    const value = resolvedValue(record)?.value
    if (typeof value !== 'string' || !spec.values.includes(value)) {
        return { refused: `${lineId}: whether the teams change ends at a coach-called block is ${value === undefined ? 'not established' : JSON.stringify(value)}; it must be one of ${spec.values.join(', ')}` }
    }
    return { value, stated: true, lineId }
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
    /**
     * Stage D (23 October 2026): the end assignment is read first, so an exchange of ends in a game with no role is refused here rather than
     * passed over as "not a role-block game" (blocks exist only where the roles exchange, his M1; a block mechanism without a role exchange
     * is not built). A game that addresses no end assignment goes on exactly as before.
     */
    const endAssignment = endAssignmentOf(derived, index)
    if (!elements.length) {
        if (endAssignment && 'refused' in endAssignment) return { kind: 'REFUSED', why: [endAssignment.refused] }
        if (endAssignment && !('refused' in endAssignment) && endAssignment.value === index.endAssignment!.exchanged) {
            return { kind: 'REFUSED', why: [`${endAssignment.lineId} exchanges the ends at a coach-called block, and the game establishes no role: blocks exist only where the roles exchange, so there is no block for the teams to change ends at`] }
        }
        return { kind: 'NONE' }
    }

    const why: string[] = []
    if (endAssignment && 'refused' in endAssignment) why.push(endAssignment.refused)
    const exchanged = !!endAssignment && !('refused' in endAssignment) && endAssignment.value === index.endAssignment!.exchanged
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

    // Stage D: the ends the teams exchange are the register's two, and the game must assign exactly those.
    const exchangedEnds = index.endAssignment?.ends ?? []
    if (exchanged && (used.length !== exchangedEnds.length || used.some(end => !exchangedEnds.includes(end)))) {
        why.push(`the teams change ends between ${exchangedEnds.join(' and ')}, and this game assigns ${used.length ? used.join(', ') : 'no team'} to an end`)
    }

    if (why.length) return { kind: 'REFUSED', why }
    const first = Object.fromEntries(spec.roles.map((role, i) => [role, used[i]]))
    /**
     * **Under the end exchange the first block stands each team at its own end and the second exchanges them** (stage D, 23 October 2026,
     * row B10): both blocks keep the first block's role-to-end holders, so each role is played from the same end in every block, and the
     * second block's ends are the first's exchanged (`endsExchangeOf`). Entailed, as the role exchange is: nothing here is chosen. Under
     * the kept ends (every game before stage D) the blocks are exactly what they were.
     */
    if (exchanged) {
        const ends = Object.fromEntries(exchangedEnds.map(end => [end, end]))
        const block: RoleBlock = { blockId: blockIdOf(spec.roles, first, ends), holders: first, ends }
        return {
            kind: 'BLOCKS',
            roles: [...spec.roles],
            exchange: [...exchanges][0],
            blocks: [block, endsExchangeOf(block, spec.roles, exchangedEnds)!],
            from: elements.map(element => ({ ...element.fromItem })),
        }
    }
    const block: RoleBlock = { blockId: blockIdOf(spec.roles, first), holders: first }
    return {
        kind: 'BLOCKS',
        roles: [...spec.roles],
        exchange: [...exchanges][0],
        blocks: [block, exchangeOf(block, spec.roles)!],
        from: elements.map(element => ({ ...element.fromItem })),
    }
}

/**
 * **The second block of a pair, as the first and the game's end assignment entail it** — stage D, 23 October 2026: the role exchange where
 * the first block carries no ends (the kept ends), and the ends exchanged with the holders kept where it does. Read by the cross-block
 * check RB-5, so the pair it compares is the one `roleBlocksOf` derives and no other.
 */
export function secondBlockOf(first: RoleBlock, roles: string[], index: RegisterIndex): RoleBlock | null {
    if (!first.ends) return exchangeOf(first, roles)
    return index.endAssignment ? endsExchangeOf(first, roles, index.endAssignment.ends) : null
}
