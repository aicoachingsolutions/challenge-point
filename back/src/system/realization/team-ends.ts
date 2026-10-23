/**
 * **Which end line a team attacks, read from the game's own objectives** — added 15 October 2026 (stage K6, register version 13).
 *
 * RC-21 states its positional terms by a team: *"own end (of team T): touches the end line T defends"*, *"attacking end (of team
 * T): touches the end line T attacks"*, *"beyond X (for team T): the element's near edge is at or past X's far edge, in T's
 * attacking direction"*. Until now the only team those terms were read for was the one an element's own selector already placed
 * (`longitudinal`, his 9 October ruling), so the team never had to be resolved. His reply filed 18 October 2026, item 3, states
 * positions by a role — *"Pressure reference: 20 m from the building team's end line."* — and in a game played in role blocks
 * which end the building team attacks is decided by the block (his M1: *"Keep role assignments separate from fixed ends."*).
 *
 * So the answer is read, never assumed:
 *
 *   - a role holder (`ROLE_HOLDER_<role>`) stands for the setup assignment that holds the role in this block (`holderInBlock`);
 *     a setup assignment (`TEAM_AT_AXIS_*`) stands for itself; any other designation — possession-relative, episode, trigger —
 *     holds no end, and is answered null;
 *   - the team attacks the end its primary objective's target touches: the objective (the register's `targetOf` rows: J1 with
 *     role PRIMARY_SCORING and team J3) references a region (J2), and that region's authored `longitudinal` selector fixes the
 *     end it touches (end-near the 0 end line, end-far the far one — the register's interval tests).
 *
 * **An object target** — 23 October 2026 (stage B, register version 17, `objectGeometry`). Christian, reply filed 25 October 2026, item
 * 3: *"I approve a [specialized-role]-protected physical goal as an authorized alternative to the pressing team's 5 m target zone"* and *"The
 * goal should be positioned at the building team's end."* An objective may reference an object (register J2, *"object or region
 * reference"*); until this only a region answered, so a team attacking an object attacked no end (T16) while the diagram drew it from
 * the object's realized place (T18). An object carries no `longitudinal` selector; its end is read from its own typed along position,
 * RC-21's "own end (of team T2)" or "attacking end (of team T2)" ({term, forTeam, offsetM}): the end line T2 defends or attacks, so T2's
 * end is resolved first — **with one level of recursion**. T2's own target must answer without another object positioned by a team (a
 * second level is not followed), and a team whose end would depend on itself (its target placed by its own end: T2 is the team being
 * resolved) is a **cycle, which refuses**: nothing is answered, and nothing is placed by it. A phrase, an untyped value or a position
 * measured from nothing names no end, and answers nothing (T15: never a fixed anchor).
 *
 * Exactly one such objective must answer, or nothing is answered: a shared target, two objectives, a reference that names no
 * held region or object, a region whose selector fixes no end, or an object whose position fixes none all leave the team's end
 * unestablished, and nothing is placed by it. Sport-neutral: rows, paths, the role value and the selector attribute are register data.
 */
import { designationKey, holderInBlock, resolutionOf } from '../derivation/designation'
import { RegisterIndex } from '../derivation/register'
import { splitPath } from '../derivation/resolved-game'
import { RoleBlock, structuralRefOf, teamEndPositionOf } from '../derivation/types'
import { longitudinalAnchorOf } from './spatial'

/** The setup assignment a designation stands for in this game, or null where it stands for none. */
export function setupAssignmentOf(index: RegisterIndex, designation: string, roleBlock: RoleBlock | null | undefined): string | null {
    const held = holderInBlock(index, designation, roleBlock)
    if (held) return held
    return resolutionOf(index, designation)?.kind === 'SETUP_ASSIGNMENT' ? designationKey(index, designation) : null
}

const readAt = (root: unknown, path: string): unknown =>
    path.split('.').reduce<any>((node, key) => (node === null || node === undefined ? undefined : node[key]), root)

/** The end line a team attacks (0 or 1, a fraction of the along axis), or null, and why — so a refusal says what it could not read. */
export interface AttackingEnd {
    end: 0 | 1 | null
    /** The target the end was read from (`c:<contract>:<item>`), where one was found. */
    target: string | null
    why: string
}

/** The end line (0 or 1, a fraction of the along axis) the team a designation stands for attacks, or null. */
export function attackingEndIn(game: unknown, index: RegisterIndex, roleBlock: RoleBlock | null | undefined, designation: string): 0 | 1 | null {
    return attackingEndOf(game, index, roleBlock, designation).end
}

/**
 * **The end a team attacks, with why** (stage B, 23 October 2026): the reading `attackingEndIn` answers, kept whole so a test and a
 * refusal can say what was not established — a cycle, a second level, an object positioned by nothing, a region whose selector fixes no
 * end. `through` is the chain of teams already being resolved (internal: the one level of recursion through an object's typed position).
 */
export function attackingEndOf(game: unknown, index: RegisterIndex, roleBlock: RoleBlock | null | undefined, designation: string, through: string[] = []): AttackingEnd {
    const none = (why: string, target: string | null = null): AttackingEnd => ({ end: null, target, why })
    const spec = index.targetOf
    if (!spec) return none('the register names no targetOf rows')
    const team = setupAssignmentOf(index, designation, roleBlock)
    if (!team) return none(`${designation} stands for no setup assignment in this game, so it holds no end`)
    if (through.includes(team)) return none(`the end ${team} attacks would be read from a position stated by ${team}'s own end: a cycle, so no end is answered`)
    const objectivesAt = splitPath(String(index.rows.get(spec.objectivesRow)?.path ?? '')).container
    const regionsAt = splitPath(String(index.rows.get(spec.row)?.path ?? '')).container
    if (!objectivesAt || !regionsAt) return none('the register names no objectives or regions collection')
    const objectives = readAt(game, objectivesAt)
    const regions = readAt(game, regionsAt)
    if (!Array.isArray(objectives) || !Array.isArray(regions)) return none('the game holds no objectives or regions')
    const attacking = objectives.filter((objective: any) => String(objective?.[spec.roleLeaf]) === spec.role && designationKey(index, objective?.[spec.teamLeaf]) === team)
    if (attacking.length !== 1) return none(`${team} attacks ${attacking.length} primary objectives, not exactly one`)
    const ref = structuralRefOf(attacking[0]?.[spec.referenceLeaf])
    if (!ref) return none(`${team}'s primary objective references no element`)
    const id = `c:${ref.contractId}:${ref.itemId}`
    const region = regions.find((element: any) => element?.elementId === id) as { selector?: { attribute: string; op: string; value?: unknown }[] } | undefined
    if (region) {
        const longitudinal = region.selector?.find(term => term.attribute === 'longitudinal' && term.op === '=')?.value
        const end = typeof longitudinal === 'string' ? longitudinalAnchorOf(longitudinal) : undefined
        return end === 0 || end === 1 ? { end, target: id, why: `${team} attacks the region ${id}, whose selector states ${String(longitudinal)}` } : none(`${team} attacks the region ${id}, whose selector fixes no end`, id)
    }
    return objectTargetEnd(game, index, roleBlock, team, id, [...through, team])
}

/**
 * The end an object target is at, read from its own typed along position (stage B, 23 October 2026): "own end (of team T2)" is the end T2
 * defends, "attacking end (of team T2)" the end it attacks (the register's machine-readable anchors, at 0 and 1), so T2 is resolved first
 * — once. Null, with why, where the object is not held, its position is not such a typed position, the term is no end-line anchor, T2
 * would need a second level, or T2's end depends on the team being resolved (a cycle).
 */
function objectTargetEnd(game: unknown, index: RegisterIndex, roleBlock: RoleBlock | null | undefined, team: string, id: string, through: string[]): AttackingEnd {
    const none = (why: string): AttackingEnd => ({ end: null, target: id, why })
    const rows = index.objectGeometry
    if (!rows) return none(`${team} attacks ${id}, which is no region, and the register names no object rows`)
    const objectsAt = splitPath(String(index.rows.get(rows.row)?.path ?? '')).container
    const objects = objectsAt ? readAt(game, objectsAt) : undefined
    const object = Array.isArray(objects) ? objects.find((element: any) => element?.elementId === id) : undefined
    if (!object) return none(`${team} attacks ${id}, which the game holds neither as a region nor as an object`)
    const position = teamEndPositionOf(readAt(object, rows.alongLeaf))
    if (!position) return none(`${team} attacks the object ${id}, whose along position is not stated from a team's end line, so it fixes no end`)
    const terms = ((index.relativeTerms ?? {}) as any).machineReadable?.terms ?? {}
    const definition = terms[position.term]
    if (!definition || definition.kind !== 'anchor' || definition.axis !== 'along' || (definition.at !== 0 && definition.at !== 1)) {
        return none(`${team} attacks the object ${id}, whose position names ${JSON.stringify(position.term)}, which is no end-line anchor of the register`)
    }
    // One level of recursion: the team the object's position names is resolved once, and may not itself answer through another object.
    if (through.length > 1) return none(`the object ${id} is positioned by the end of ${position.forTeam}, which is a second level of objects positioned by a team; only one is followed`)
    const of = attackingEndOf(game, index, roleBlock, position.forTeam, through)
    if (of.end === null) return none(`${team} attacks the object ${id}, positioned at the end line ${position.forTeam} ${definition.at === 1 ? 'attacks' : 'defends'}, and that end is not established: ${of.why}`)
    const end: 0 | 1 = definition.at === 1 ? of.end : of.end === 1 ? 0 : 1
    return { end, target: id, why: `${team} attacks the object ${id}, at the end line ${position.forTeam} ${definition.at === 1 ? 'attacks' : 'defends'} (${of.why})` }
}
