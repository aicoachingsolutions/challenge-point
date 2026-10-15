/**
 * **Team designations, resolved once (AM-01) — the one resolver every consumer asks.** Added 15 October 2026 (stage K2).
 *
 * Christian, reply filed 17 October 2026, M2: *"Team-specific facts: Approved. Please implement the previously adopted
 * September 20 designation rule, rather than introducing a narrower workaround solely for this activity."* (His next
 * sentence calls it a reusable capability.) The adopted rule, AM-01: *"Use the game's
 * transitions/episode context to resolve contextual team designations. An episode-scoped designation remains
 * episode-scoped."*
 *
 * **What was there.** Nothing implemented it. The register held the designations as glossed strings; `reach.ts` compared
 * a designation as text; one gate read the gloss for the substring `PS1`, another tested `startsWith`; and the roster
 * refused every team-naming selector because nothing told one instantiated team from the other. Four readers, four
 * readings. Now the register types each entry (`teamDesignations.resolutions`, version 9) and this module is the only
 * place that reads the types:
 *
 *   - **in a value** designations compare as canonical entries (the spec's elaboration of AM-01, RC-22): a glossed
 *     spelling and a value written "(= ENTRY)" count as that entry, two named teams are equal only by name —
 *     `designationKey`, `sameDesignation` (GA-DIRECTION);
 *   - **what kind of answer** a designation has — every team, the possession relation by the register's own gloss —
 *     `isAllTeams`, `followsPossessionRelation` (GA-DIRECTION, GA-AFFILIATION), `isRegisteredDesignation`
 *     (GA-REFERENCE-INTEGRITY's relational referent);
 *   - **which instantiated team** a designation reaches, for a STANDING property — `memberDesignations`, carried on the
 *     member class realization forms (`post-realization-gate.ts`), read by `reach.ts` and by the roster
 *     (`assemble-concrete-game.ts`).
 *
 * **A standing property never reaches through a team that changes.** A designation whose scope is EPISODE, DYNAMIC or
 * TRIGGER picks out a team that changes during play while a performer count does not, so for a standing property it is
 * UNDETERMINED with that reason, never TRUE for "the team it was once". This keeps the refusal the roster always gave a
 * possession-relative count, and adds the one answer AM-01 makes available: a setup assignment (TEAM_AT_AXIS_*) reaches
 * exactly the team realization recorded for it.
 *
 * **Which team holds a setup assignment is a governed symmetric choice** (SD-39, as the initial possession holder is),
 * recorded by realization (`DesignationBinding`) from the game form's realization input; it is never read off an
 * ordinal. Without a binding the designation stays UNDETERMINED — exactly the state before this module existed.
 *
 * Sport-neutral: no designation name is written here. Kinds, scopes and names are register data.
 */
import { designationName, DesignationResolution, RegisterIndex } from './register'
import type { RoleBlock } from './types'

/** A designation's resolution with the entry it resolved to. */
export interface ResolvedDesignation extends DesignationResolution {
    entry: string
}

/** The prefix an entry spelled with a placeholder is written with (`TEAM_<id>` gives `TEAM_`), or null. */
function templatePrefix(entry: string): string | null {
    const at = entry.indexOf('<')
    return at > 0 ? entry.slice(0, at) : null
}

/**
 * **The entry a placeholder spelling stands for** — a named team (`TEAM_A` → `TEAM_<id>`), and since 15 October 2026 (stage
 * K3, his M1) a role holder (`ROLE_HOLDER_BUILDING` → `ROLE_HOLDER_<role>`), which counts only where what follows the prefix
 * is a role of the register's role vocabulary: a role holder of a role nobody registered names nothing.
 */
function templatedEntry(index: RegisterIndex, text: string): string | null {
    if (text.includes(' ')) return null
    for (const [name, resolution] of index.designations.resolutions) {
        const prefix = templatePrefix(name)
        if (!prefix || !text.startsWith(prefix) || text.length <= prefix.length) continue
        if (resolution.kind === 'NAMED') return name
        if (resolution.kind === 'BLOCK_ROLE' && (index.roleBlocks?.roles ?? []).includes(text.slice(prefix.length))) return name
    }
    return null
}

/**
 * **The canonical entry a value names, or null where it names none.** Exact names first, so a setup designation is never
 * mistaken for a named team; then a glossed spelling (`ENTRY (gloss)`); then a value written `(= ENTRY)`, which AM-01's
 * elaboration says counts as that entry; then a named team (`TEAM_A` → `TEAM_<id>`).
 */
export function designationEntry(index: RegisterIndex, value: unknown): string | null {
    if (typeof value !== 'string') return null
    const text = value.trim()
    const names = index.designations.resolutions
    if (names.has(text)) return text
    const first = designationName(text)
    if (first !== text && names.has(first)) return first
    const marker = text.indexOf('(= ')
    if (marker >= 0) {
        const close = text.indexOf(')', marker)
        const inner = close > marker ? text.slice(marker + 3, close).trim() : ''
        if (names.has(inner)) return inner
    }
    return templatedEntry(index, text)
}

export function resolutionOf(index: RegisterIndex, value: unknown): ResolvedDesignation | null {
    const entry = designationEntry(index, value)
    if (!entry) return null
    return { entry, ...index.designations.resolutions.get(entry)! }
}

export const isRegisteredDesignation = (index: RegisterIndex, value: unknown): boolean => designationEntry(index, value) !== null

/**
 * **The list entry a value IS, by its name or its whole text — or null** (K2 review, 15 October 2026). `designationEntry`
 * answers RC-22's comparison question, where a value MAPS to an entry (a named team to `TEAM_<id>`, prose ending
 * "(= ENTRY)" to that entry). Whether a value names a registered designation at all is a different question, and before
 * this resolver the gates answered it by the list's own spelling only. Answering it by mapping turned two established
 * failures into something weaker with no ruling for it: a relational referent designating `TEAM_RED` resolved to every
 * objective of its role (GA-REFERENCE-INTEGRITY FAIL → PASS), and a neutral side `TEAM_RED` became undecided
 * (GA-AFFILIATION FAIL → NOT_EVALUABLE). So registration keeps the list's spelling; mapping stays for comparison.
 */
export function listedEntry(index: RegisterIndex, value: unknown): string | null {
    if (typeof value !== 'string') return null
    const listed = index.teamDesignations.find(entry => entry === value || designationName(entry) === value)
    return listed === undefined ? null : designationName(listed)
}

export const isListedDesignation = (index: RegisterIndex, value: unknown): boolean => listedEntry(index, value) !== null

/**
 * **The key two values compare by (RC-22: "Two designations are equal only if they map to one entry").** A named team
 * keeps its own name, because two different named teams map to the one NAMED entry and are not equal. A value that is
 * no registered designation keys as itself, so a reader that groups by this key groups exactly as it did by the text.
 */
export function designationKey(index: RegisterIndex, value: unknown): string {
    const resolved = resolutionOf(index, value)
    if (!resolved) return String(value)
    // A role holder keeps its own name too (stage K3): the holders of two roles map to one entry and are not equal.
    return resolved.kind === 'NAMED' || resolved.kind === 'BLOCK_ROLE' ? String(value).trim() : resolved.entry
}

/**
 * **The role a role-holder designation names** (`ROLE_HOLDER_BUILDING` → `BUILDING`), or null where the value is none —
 * 15 October 2026, stage K3, his M1. Read from the register's spelling and role vocabulary, never from a literal.
 */
export function roleOfHolder(index: RegisterIndex, value: unknown): string | null {
    const resolved = resolutionOf(index, value)
    if (!resolved || resolved.kind !== 'BLOCK_ROLE') return null
    const prefix = templatePrefix(resolved.entry)
    return prefix ? String(value).trim().slice(prefix.length) : null
}

/** Every role holder spelled out, one per role of the register's role vocabulary (`ROLE_HOLDER_BUILDING`, …). */
export function roleHolderNames(index: RegisterIndex): string[] {
    const template = index.roleBlocks?.holderDesignation
    const prefix = template ? templatePrefix(template) : null
    return prefix ? (index.roleBlocks?.roles ?? []).map(role => `${prefix}${role}`) : []
}

/**
 * **The setup assignment a role holder stands for in this block, or null** — his M1, *"Keep role assignments separate from
 * fixed ends."* A role is held by one end-assigned team for the block; which end is the block's binding, recorded and
 * never chosen here. Without a block, or for a value that is no role holder, there is no answer (never a guess).
 */
export function holderInBlock(index: RegisterIndex, value: unknown, roleBlock: RoleBlock | null | undefined): string | null {
    const role = roleOfHolder(index, value)
    if (!role || !roleBlock) return null
    const holder = roleBlock.holders[role]
    return holder && resolutionOf(index, holder)?.kind === 'SETUP_ASSIGNMENT' ? designationKey(index, holder) : null
}

/** Equal as designations (RC-22), or null where either value is no registered designation. */
export function sameDesignation(index: RegisterIndex, a: unknown, b: unknown): boolean | null {
    if (!isRegisteredDesignation(index, a) || !isRegisteredDesignation(index, b)) return null
    return designationKey(index, a) === designationKey(index, b)
}

/** Every team of the game (kind ALL). */
export const isAllTeams = (index: RegisterIndex, value: unknown): boolean => resolutionOf(index, value)?.kind === 'ALL'

/**
 * **Defined by the possession relation, on the register's own word.** Only a POSSESSION_RELATION resolution whose basis
 * is the entry's GLOSS counts: the relation is what the gloss says (his ruling of 2 October), and a designation we read
 * as possession-relative without a gloss is our interpretation, which decides nothing in a gate.
 */
export function followsPossessionRelation(index: RegisterIndex, value: unknown): boolean {
    // A list entry, by its spelling (K2 review): prose ending "(= ENTRY)" is not the entry, so it follows nothing.
    const entry = listedEntry(index, value)
    const resolved = entry ? resolutionOf(index, entry) : null
    return !!resolved && resolved.kind === 'POSSESSION_RELATION' && resolved.basis === 'GLOSS'
}

/** Is this selector attribute, on this row (or the collection that owns it), designation-valued? */
export function isDesignationAttribute(index: RegisterIndex, rowId: string, attribute: string): boolean {
    const owner = index.ownerRow.get(rowId) ?? rowId
    return index.designations.attributes.some(entry => entry.row === owner && entry.attribute === attribute)
}

/**
 * **Which instantiated team holds a setup assignment** — recorded by realization, never derived. His ruling of 3 October
 * keeps the handle opaque ("The handle establishes identity only; it carries no domain meaning"), so a binding names a
 * handle the way the initial possession holder does, and swapping the two bindings would leave the game identical.
 */
export interface DesignationBinding {
    designation: string
    handle: string
    because: string
}

/**
 * **What one instantiated team meets, for a STANDING property** — the resolver's answer, carried on the member class so
 * `reach.ts` reads it without a second copy of these rules. `met` and `notMet` hold entry names; every other registered
 * designation is `undetermined`, each with the reason a refusal can quote.
 */
export interface MemberDesignations {
    /** The designation-valued selector attributes of the member's collection. */
    attributes: string[]
    handle: string
    met: string[]
    notMet: string[]
    undetermined: { designation: string; why: string }[]
}

export function memberDesignations(
    index: RegisterIndex,
    collectionRow: string,
    handle: string,
    bindings: DesignationBinding[] = [],
    /** The role block the game is derived for (stage K3, his M1); without one a role holder stays undetermined. */
    roleBlock: RoleBlock | null = null,
): MemberDesignations {
    const attributes = index.designations.attributes.filter(entry => entry.row === collectionRow).map(entry => entry.attribute)
    const met: string[] = []
    const notMet: string[] = []
    const undetermined: { designation: string; why: string }[] = []
    const standing = new Set(index.designations.standingScopes)
    for (const [name, resolution] of index.designations.resolutions) {
        if (resolution.kind === 'ALL') {
            met.push(name)
            continue
        }
        /**
         * **A role holder reaches the team holding the role in THIS block** (15 October 2026, stage K3, his M1): through the
         * block's binding to a setup assignment, then through the setup assignment's recorded binding to a team. Each role
         * is answered by its own spelled name, because a selector names `ROLE_HOLDER_BUILDING`, never the template. Two
         * recorded steps, nothing chosen: without a block, or with the setup assignment unbound, it stays undetermined.
         */
        if (resolution.kind === 'BLOCK_ROLE' && standing.has(resolution.scope)) {
            for (const holder of roleHolderNames(index)) {
                const setup = holderInBlock(index, holder, roleBlock)
                const bound = setup ? bindings.find(binding => designationKey(index, binding.designation) === setup) : undefined
                if (!roleBlock) undetermined.push({ designation: holder, why: `${holder} is held for a block, and no block binding is recorded` })
                else if (!setup) undetermined.push({ designation: holder, why: `the role block ${roleBlock.blockId} binds ${holder} to no setup assignment` })
                else if (!bound) undetermined.push({ designation: holder, why: `${holder} is ${setup} in the role block ${roleBlock.blockId}, and which team holds ${setup} is a setup choice that realization has not recorded` })
                else (bound.handle === handle ? met : notMet).push(holder)
            }
            continue
        }
        if (!standing.has(resolution.scope)) {
            undetermined.push({
                designation: name,
                why: `${name} is ${resolution.scope.toLowerCase()}-scoped: the team it picks out can change while a standing property does not, so nothing standing is reached through it (register teamDesignations.standingScopes; AM-01: "An episode-scoped designation remains episode-scoped.")`,
            })
            continue
        }
        if (resolution.kind === 'SETUP_ASSIGNMENT') {
            const bound = bindings.find(binding => designationKey(index, binding.designation) === name)
            if (!bound) {
                undetermined.push({ designation: name, why: `which team holds ${name} is a setup choice that realization has not recorded` })
                continue
            }
            ;(bound.handle === handle ? met : notMet).push(name)
            continue
        }
        undetermined.push({
            designation: name,
            why:
                resolution.kind === 'NAMED'
                    ? `${name} names a particular team, and the game names none of its teams`
                    : resolution.kind === 'BLOCK_ROLE'
                      ? `${name} is held for a block, and no block binding is recorded`
                      : `${name} is decided by ${resolution.at ? `the ${resolution.at} transition's award` : 'a transition'}, and no such award is recorded for this team`,
        })
    }
    return { attributes, handle, met, notMet, undetermined }
}

/** Why a selector term on a designation-valued attribute does not reach this member, for a refusal to quote. */
export function whyNotReached(designations: MemberDesignations | undefined, values: string[]): string | null {
    if (!designations) return null
    const found = designations.undetermined.filter(entry => values.includes(entry.designation)).map(entry => entry.why)
    return found.length ? found.join('; ') : null
}

/**
 * **What an objective region is the target of** — the register's derived attribute `targetOf` (version 10), 15 October
 * 2026, stage K3, his M1: *"Allow target configurations to reflect each team's role during the block."* The structure
 * (which objectives reference the region, and whether every reference was decided) is found by `target-of.ts`; this
 * answers it as designations, in the shape `reach.ts` already reads for a team:
 *
 *   - a setup assignment is MET where an objective of its team references the region, and NOT MET only where every
 *     reference was decided and every attacker is a setup assignment — then the other setup assignment's objective
 *     references another region (C42: "each team attacks the target opposite its own assigned end");
 *   - a role holder is met or not met exactly as the setup assignment the block binds it to, and is undetermined
 *     without a block — so a role-keyed target configuration reaches the region of THAT block's holder, and nothing at
 *     all where no block is in force;
 *   - every other designation is undetermined: nothing here reads an episode, a trigger or the possession relation.
 *
 * `attackers` are the team designations as the objectives' selectors spell them.
 */
export function targetDesignations(index: RegisterIndex, regionId: string, attackers: string[], decided: boolean, roleBlock: RoleBlock | null = null): MemberDesignations {
    const attribute = index.targetOf?.attribute ?? ''
    const met: string[] = []
    const notMet: string[] = []
    const undetermined: { designation: string; why: string }[] = []
    const attacking = new Set(attackers.map(attacker => designationKey(index, attacker)))
    const onlySetup = attackers.every(attacker => resolutionOf(index, attacker)?.kind === 'SETUP_ASSIGNMENT')
    for (const [name, resolution] of index.designations.resolutions) {
        if (resolution.kind !== 'SETUP_ASSIGNMENT') continue
        if (attacking.has(name)) met.push(name)
        else if (decided && onlySetup) notMet.push(name)
        else undetermined.push({ designation: name, why: `whether an objective of ${name} references ${regionId} is not decided by the reference items` })
    }
    for (const holder of roleHolderNames(index)) {
        const setup = holderInBlock(index, holder, roleBlock)
        if (!roleBlock) undetermined.push({ designation: holder, why: `${holder} is held for a block, and the game is derived for no role block` })
        else if (setup && met.includes(setup)) met.push(holder)
        else if (setup && notMet.includes(setup)) notMet.push(holder)
        else undetermined.push({ designation: holder, why: `${holder} is ${setup ?? 'no setup assignment'} in the role block ${roleBlock.blockId}, and whether its objective references ${regionId} is not decided` })
    }
    return { attributes: attribute ? [attribute] : [], handle: regionId, met, notMet, undetermined }
}
