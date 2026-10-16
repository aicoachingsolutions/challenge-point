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
 * Exactly one such objective must answer, or nothing is answered: a shared target, two objectives, a reference that names no
 * held region or a region whose selector fixes no end all leave the team's end unestablished, and nothing is placed by it.
 * Sport-neutral: rows, paths, the role value and the selector attribute are register data.
 */
import { designationKey, holderInBlock, resolutionOf } from '../derivation/designation'
import { RegisterIndex } from '../derivation/register'
import { splitPath } from '../derivation/resolved-game'
import { RoleBlock, structuralRefOf } from '../derivation/types'
import { longitudinalAnchorOf } from './spatial'

/** The setup assignment a designation stands for in this game, or null where it stands for none. */
export function setupAssignmentOf(index: RegisterIndex, designation: string, roleBlock: RoleBlock | null | undefined): string | null {
    const held = holderInBlock(index, designation, roleBlock)
    if (held) return held
    return resolutionOf(index, designation)?.kind === 'SETUP_ASSIGNMENT' ? designationKey(index, designation) : null
}

const readAt = (root: unknown, path: string): unknown =>
    path.split('.').reduce<any>((node, key) => (node === null || node === undefined ? undefined : node[key]), root)

/** The end line (0 or 1, a fraction of the along axis) the team a designation stands for attacks, or null. */
export function attackingEndIn(game: unknown, index: RegisterIndex, roleBlock: RoleBlock | null | undefined, designation: string): 0 | 1 | null {
    const spec = index.targetOf
    if (!spec) return null
    const team = setupAssignmentOf(index, designation, roleBlock)
    if (!team) return null
    const objectivesAt = splitPath(String(index.rows.get(spec.objectivesRow)?.path ?? '')).container
    const regionsAt = splitPath(String(index.rows.get(spec.row)?.path ?? '')).container
    if (!objectivesAt || !regionsAt) return null
    const objectives = readAt(game, objectivesAt)
    const regions = readAt(game, regionsAt)
    if (!Array.isArray(objectives) || !Array.isArray(regions)) return null
    const attacking = objectives.filter((objective: any) => String(objective?.[spec.roleLeaf]) === spec.role && designationKey(index, objective?.[spec.teamLeaf]) === team)
    if (attacking.length !== 1) return null
    const ref = structuralRefOf(attacking[0]?.[spec.referenceLeaf])
    if (!ref) return null
    const region = regions.find((element: any) => element?.elementId === `c:${ref.contractId}:${ref.itemId}`) as { selector?: { attribute: string; op: string; value?: unknown }[] } | undefined
    const longitudinal = region?.selector?.find(term => term.attribute === 'longitudinal' && term.op === '=')?.value
    const end = typeof longitudinal === 'string' ? longitudinalAnchorOf(longitudinal) : undefined
    return end === 0 || end === 1 ? end : null
}
