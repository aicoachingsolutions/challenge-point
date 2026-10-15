/**
 * **Which objective a region is the target of — the derived attribute `targetOf`, set before reach.** Added 15 October
 * 2026 (stage K3) for his M1, reply filed 17 October 2026: *"Keep role assignments separate from fixed ends. Allow target
 * configurations to reflect each team's role during the block."*
 *
 * **Why it is derived and not authored.** A role-keyed target configuration (the building team's progression target, the
 * pressing team's post-regain area) has to land on a region that already exists — the possession game's two objective
 * regions, one per end (ruling C42: *"exactly two active objectives and two corresponding target regions, not three"*).
 * The only thing that tells those regions apart by team is the objective that references each: GF2's own region phrase
 * reads "of the team J3 names for the objective referencing it". So `targetOf` is that relation made selectable, computed
 * here from the objectives' own selectors (their team and role are selector attributes, SD-92) and from the reference
 * items that ENTAIL a reference (an assumed item bounds and never entails, SD-27). It is written on the region class's
 * `designations` — the same answer shape `reach.ts` reads for a team — and never into the region's authored selector,
 * which the game carries unchanged.
 *
 * **Materialised only where something asks.** Every region could carry it; it is computed only where a selected item's
 * selector names the attribute, so a game that never asks derives exactly the classes it always did (measured: every
 * goal, every demonstration and the A04 fixture). The answer does not depend on whether it is asked.
 *
 * **What is decided, and what is not.** A setup assignment (TEAM_AT_AXIS_*) is met by the region its objective
 * references; it is NOT met only where every reference item was decided against every individuated objective. An
 * objective individuated by nothing (SD-97, a `*` selector) has no reference line, so it cannot reference a region and
 * does not stop the decision. A role holder (`ROLE_HOLDER_<role>`) answers through the role block the game is derived
 * for, and stays undetermined without one (`designation.ts` `targetDesignations`) — undetermined is never rounded
 * (invariant 3), so nothing is derived from it.
 *
 * Sport-neutral: rows, attributes and the role value are register data (`targetOf`, register version 10).
 */
import { entails } from './derive'
import { targetDesignations } from './designation'
import { reaches } from './reach'
import { RegisterIndex } from './register'
import { parseSelector } from './selector'
import { ElementClass, LoadedContract, RoleBlock, structuralRefOf } from './types'

/** The value a class's own selector fixes for an attribute with `=`, or null. */
function fixedBy(cls: ElementClass, attribute: string): string | null {
    const term = cls.constraints.terms.find(t => t.attribute === attribute && t.op === '=')
    return term && term.op === '=' ? String(term.value) : null
}

/** Does any selected item's selector name this attribute? */
function asked(contracts: LoadedContract[], index: RegisterIndex, row: string, attribute: string): boolean {
    for (const contract of contracts) {
        for (const item of contract.items ?? []) {
            const owner = index.ownerRow.get(String(item.row)) ?? String(item.row)
            if (owner !== row) continue
            const parsed = parseSelector(item.selector, String(item.row), index)
            if (parsed.predicate?.terms.some(term => term.attribute === attribute)) return true
        }
    }
    return false
}

/**
 * Mark every objective-row region with what it is the target of, where a selector asks. Mutates the classes it is handed
 * (derivation's own, before reach); returns how many it marked.
 */
export function markTargets(classes: ElementClass[], contracts: LoadedContract[], index: RegisterIndex, roleBlock: RoleBlock | null): number {
    const spec = index.targetOf
    if (!spec || !asked(contracts, index, spec.row, spec.attribute)) return 0

    const individuated = (cls: ElementClass) => !cls.constraints.any || !!cls.singletonBy
    const objectives = classes.filter(cls => cls.row === spec.objectivesRow && individuated(cls))
    // An individuated objective whose role its selector does not fix might be of the role: its references are unknown.
    let decided = objectives.every(objective => fixedBy(objective, spec.roleAttribute) !== null)
    const ofRole = objectives.filter(objective => fixedBy(objective, spec.roleAttribute) === spec.role)
    const regions = classes.filter(cls => cls.row === spec.row)
    const regionOf = (ref: { contractId: string; itemId: string }) =>
        regions.find(region => [region.fromItem, ...region.supportedBy].some(by => by.contractId === ref.contractId && by.itemId === ref.itemId))

    const attackers = new Map<string, Set<string>>()
    for (const contract of contracts) {
        for (const item of contract.items ?? []) {
            if (String(item.row) !== spec.referenceRow || !entails(item)) continue
            const ref = structuralRefOf(item.value)
            const parsed = parseSelector(item.selector, String(item.row), index)
            if (!parsed.predicate) {
                decided = false
                continue
            }
            for (const objective of ofRole) {
                const reach = reaches(parsed.predicate, objective)
                if (reach === 'FALSE') continue
                const region = ref ? regionOf(ref) : undefined
                const team = fixedBy(objective, spec.teamAttribute)
                // A reference that may or may not be this objective's, or names no region the game holds, or an objective
                // whose team is not fixed: the relation is not established, and nothing is concluded from it.
                if (reach === 'UNDETERMINED' || !region || !team) {
                    decided = false
                    continue
                }
                if (!attackers.has(region.classId)) attackers.set(region.classId, new Set())
                attackers.get(region.classId)!.add(team)
            }
        }
    }

    for (const region of regions) region.designations = targetDesignations(index, region.classId, [...(attackers.get(region.classId) ?? [])].sort(), decided, roleBlock)
    return regions.length
}
