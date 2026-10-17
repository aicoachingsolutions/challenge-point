/**
 * **Does anything in a concrete game restrict where a group may go once play runs?** — added 15 October 2026 (stage K6).
 *
 * Christian, reply filed 18 October 2026, item 3: *"Starting placement: building-team outfield players begin short of the
 * pressure/progression line."* and *"The building team's initial positioning requirement should not prevent players from
 * advancing into useful positions as play develops."* Reply filed 17 October 2026, D4: *"However, the pressure reference should
 * not automatically become a mandatory release line. Defenders should be permitted to press immediately unless a specific,
 * authorized realization calls for a restriction."* M5: *"No universal starting distance or formation."*
 *
 * A start placement says where a group BEGINS. This reads the concrete game — the persisted state rendering receives — and lists
 * everything in it that would restrict a group after the start, so that a starting relationship can never quietly become a
 * standing one:
 *
 *   - a start placement whose timing is not one of the register's timings (P10a), or that states none — a placement with no timing
 *     would read as holding throughout;
 *   - a region serving the access function (register S4) — a region a group may not enter;
 *   - a consequence whose effect is an access change (register V13);
 *   - an action restriction of any kind (register R1-R4): a spatial eligibility rule on a receiver is one, and his 18 October item 6 asks that
 *     whether one is needed be decided on the generated activity, not assumed;
 *   - a scoring condition that names the element a start placement is stated relative to (register V5), which would make the
 *     marked reference part of how a score is judged.
 *
 * Generic: rows, paths and tokens are register data, and no element, team or sport is named. It refuses nothing itself; the
 * caller decides what a finding means (tests pin the first activity's answer: none).
 */
import { RegisterIndex } from '../derivation/register'
import { splitPath } from '../derivation/resolved-game'
import { relativePositionOf, structuralRefOf } from '../derivation/types'

export interface PlacementRestriction {
    kind: 'UNTIMED_PLACEMENT' | 'ACCESS_REGION' | 'ACCESS_CONSEQUENCE' | 'ACTION_RESTRICTION' | 'REFERENCE_IN_A_CONDITION'
    where: string
    what: string
}

const readAt = (root: unknown, path: string): unknown =>
    path.split('.').reduce<any>((node, key) => (node === null || node === undefined ? undefined : node[key]), root)

export function placementRestrictions(game: unknown, index: RegisterIndex): PlacementRestriction[] {
    const found: PlacementRestriction[] = []
    const at = (row: string) => splitPath(String(index.rows.get(row)?.path ?? ''))
    const list = (row: string): any[] => {
        const container = at(row).container
        const value = container ? readAt(game, container) : undefined
        return Array.isArray(value) ? value : []
    }
    const vocabulary = (name: string) => index.vocabularies.get(name) ?? []

    // Start placements, and the elements they are stated relative to.
    const timings = vocabulary(`P10a.${at('P10a').leaf}`)
    const referents = new Set<string>()
    for (const placement of list('P8')) {
        const timing = readAt(placement, at('P10a').leaf)
        if (typeof timing !== 'string' || !timings.includes(timing)) found.push({ kind: 'UNTIMED_PLACEMENT', where: String(placement?.elementId), what: `its timing is ${JSON.stringify(timing)}, not one of ${timings.join(', ')}` })
        const region = readAt(placement, at('P10').leaf)
        const relative = relativePositionOf(region)
        const ref = relative ? relative.of.structuralRef : structuralRefOf(region)
        if (ref) referents.add(`c:${ref.contractId}:${ref.itemId}`)
    }

    // Regions a group may not enter. The access function is the register's S4 member.
    const functionsLeaf = at('S4').leaf
    const accessFunction = vocabulary(`S4.${functionsLeaf}`).find(member => member === 'access')
    for (const region of list('S2')) {
        const functions = readAt(region, functionsLeaf)
        const members = Array.isArray(functions) ? functions : typeof functions === 'string' ? [functions] : []
        const selectorSays = Array.isArray(region?.selector) && region.selector.some((term: any) => term?.attribute === functionsLeaf && term?.value === accessFunction)
        if (accessFunction && (members.includes(accessFunction) || selectorSays)) found.push({ kind: 'ACCESS_REGION', where: String(region?.elementId), what: 'a region serving the access function' })
    }

    // Consequences that change access.
    const effectLeaf = at('V13').leaf
    const accessEffect = vocabulary(`V13.${effectLeaf}`).find(member => member === 'ACCESS')
    for (const consequence of list('V11')) {
        if (accessEffect && readAt(consequence, effectLeaf) === accessEffect) found.push({ kind: 'ACCESS_CONSEQUENCE', where: String(consequence?.elementId), what: 'a consequence whose effect changes access' })
    }

    // Action restrictions, of any kind.
    for (const restriction of list('R1')) found.push({ kind: 'ACTION_RESTRICTION', where: String(restriction?.elementId), what: `an action restriction (${JSON.stringify(readAt(restriction, at('R2').leaf) ?? null)})` })

    // A scoring condition that names a placement's reference.
    const referentsLeaf = at('V5').leaf
    for (const condition of list('V3')) {
        const named = readAt(condition, referentsLeaf)
        for (const referent of Array.isArray(named) ? named : named === undefined ? [] : [named]) {
            const ref = structuralRefOf(referent)
            if (ref && referents.has(`c:${ref.contractId}:${ref.itemId}`)) found.push({ kind: 'REFERENCE_IN_A_CONDITION', where: String(condition?.elementId), what: `a scoring condition names ${ref.contractId}::${ref.itemId}, which a start placement is stated relative to` })
        }
    }
    return found
}
