/**
 * Derivation engine — the register as data (package §1.2, §2.2 stage 0).
 *
 * The register is versioned data, never code. This module validates it against its own meta-schema
 * (halt H1), indexes it, and builds the `Versions` block (halt H2). It decides nothing about any
 * contract.
 */

import { Versions } from './types'

export interface RegisterRow {
    /**
     * **`SET` where the row holds a set of members rather than one value.** It types what these rows'
     * `valueType` prose already states ("one property per referent/member/trigger"), so two support-capable
     * items on such a row are two MEMBERS and accumulate, instead of colliding under SD-02 as two competing
     * values. Only rows whose own valueType already says so carry it.
     */
    multiplicity?: 'SET'
    id: string
    path: string
    kind: 'COLLECTION' | 'FIELD' | 'VIEW'
    ownerRow?: string
    valueType?: string
    selectorAttributes?: string[]
    /**
     * SD-92 — on a FIELD row, the owning collection's selector attribute this row holds. Stated as
     * data so nothing has to recover the correspondence by matching path text; `T1a`'s path reads
     * `qualifiers.lastTouch` while `T1` registers `qualifier.lastTouch`, and both spellings stay as
     * authored.
     */
    selectorAttribute?: string
    fillable?: string
    /** The collection whose members are this row's choice space, where the row's value is a reference to one. */
    fillableFrom?: string
    /** What every item bounding the line must be for the line to open (register version 12; `FillableRequirement`). */
    fillableRequires?: FillableRequirement
    /** The elements of the owning collection the choice space is for, by a selector attribute (register version 12). */
    fillableWhen?: { selectorAttribute: string; in: string[] }
    /** The line on one element whose entailed value this game-level row takes, where the knowledge entails it (register version 12). */
    entailedBy?: EntailedBy
    outerBound?: string
    sourceKinds?: string[]
}

/**
 * **What may open a coach's choice on a row — register version 12, 15 October 2026.** Christian, reply filed 17 October
 * 2026, M3 (quoted whole in the register's T4 `fillableAuthority`): *"coach-selected restart locations, and activity-specific
 * restart methods. These choices must remain distinguishable from universal requirements."*
 *
 * A row's `fillable` text says in words what may fill it; where the choice is the coach's (SD-15: a term in words is a
 * coach's judgement), this says, as data, which bounds may open it: EVERY item bounding the line must have one of these
 * requirements and bases and give a bound of this kind. So silence never opens the line, and neither does an assumed,
 * engine-only or positioned bound — the design verification of 17 October measured the bare word "authored" in the
 * fillable text opening a goal-kick location to an ASSUMED "own end".
 */
export interface FillableRequirement {
    requirement: string[]
    bound: 'QUALITATIVE'
    basis: string[]
}

/**
 * **A game-level row whose value another line entails — register version 12, 15 October 2026.** The initial possession
 * holder's own note: *"Its INITIAL value is a governed realization choice over the established teams unless selected
 * knowledge says otherwise"* and *"START begins an episode and requires the initial-possession choice."* Where the game holds
 * exactly one element of `collectionRow` whose selector fixes `selectorAttribute` to `value`, and that element's `row` line is
 * entailed, the knowledge has said otherwise: the row takes that line's entailed value and support (derive.ts
 * `applyEntailedBy`). Never a choice and never a default; where the source is absent, open or unentailed, nothing changes.
 */
export interface EntailedBy {
    collectionRow: string
    selectorAttribute: string
    value: string
    row: string
}

/**
 * A row does not apply to every element of its collection. Two kinds of condition express that, and
 * the difference is *when the answer is knowable*.
 *
 * **Governing-line conditions** (`row`) read another line's derived value, so they cannot be settled
 * until stage 6 — the line is enumerated CONDITIONAL and resolved later.
 *
 * **Selector conditions** (`selectorAttribute`) read the element's own identity, which stage 2 fixed
 * when it individuated the class. A transition keyed `trigger=POSSESSION_CHANGE` *is* a turnover; no
 * later line can change that. So the answer is already known at enumeration and the line is withdrawn
 * there, never left conditional on something that will never move.
 *
 * Both express the same invariant, which is his: **the absence of an inapplicable property must never
 * be reported as missing knowledge.**
 */
export interface ApplicabilityCondition {
    /** A governing line on the same element, resolved at stage 6. Mutually exclusive with `selectorAttribute`. */
    row?: string
    /** An attribute the element's own selector fixes, knowable at enumeration. */
    selectorAttribute?: string
    sameElement: boolean
    /** The values for which the row DOES apply. Mutually exclusive with `notIn`. */
    in?: string[]
    /**
     * The values for which the row does NOT apply; anything else keeps its line. Added 5 October.
     *
     * **It exists because a positive list cannot obey this mechanism's own rule on an open-ended attribute.**
     * The rule, stated in `selector.ts` and again in `derive.ts`, is that an applicability condition "may only
     * ever *remove* a line it can positively disqualify" — an undecided condition keeps the line, so a rule can
     * never hide a gap. For a closed attribute like `trigger` a positive list satisfies that. For `kind`, whose
     * values are open-ended and already include two the register's own draft list does not name (`zone`,
     * `target`), a positive list silently disqualifies every kind nobody thought to enumerate: measured, an
     * object selected `kind=goalA` lost its authored layout position. `notIn` disqualifies exactly the values
     * named and keeps everything else, which is what the rule asks for.
     */
    notIn?: string[]
}

/**
 * **A team designation's typed resolution** — register version 9, 15 October 2026, for his M2 (reply filed 17 October):
 * *"Please implement the previously adopted September 20 designation rule, rather than introducing a narrower workaround
 * solely for this activity."* What decides which team the designation picks out (`kind`) and how long that answer holds
 * (`scope`). `basis` says whether it restates the entry's own gloss (`GLOSS`) or is our reading of an entry that has none
 * (`OUR_INTERPRETATION`, never quoted as his). Read by `designation.ts` alone; every consumer asks it.
 */
export interface DesignationResolution {
    kind: string
    scope: string
    /** The trigger the answer is decided at, where the resolution names one. */
    at: string | null
    basis: 'GLOSS' | 'OUR_INTERPRETATION'
    from: string
}

/** The register's team designations as data: each entry's resolution, keyed by the entry's NAME (its gloss stripped). */
export interface DesignationRegister {
    resolutions: Map<string, DesignationResolution>
    kinds: string[]
    scopes: string[]
    /** The scopes a STANDING property of a team (a performer count) may be reached through. */
    standingScopes: string[]
    /** The collection row whose members the designations pick out. */
    teamsRow: string | null
    /** The selector attributes whose values are team designations, by row. */
    attributes: { row: string; attribute: string }[]
}

/** A list entry's name: the designation as a selector or a value spells it, without the gloss. */
export const designationName = (entry: string): string => String(entry).trim().split(/\s/)[0]

/**
 * **Where the role-block capability finds its rows** — register version 10, 15 October 2026, for his M1 (reply filed 17
 * October 2026): *"Keep role assignments separate from fixed ends. Allow target configurations to reflect each team's role
 * during the block. The coach controls the exchange. No new block-duration system is needed."* Read by
 * `derivation/role-blocks.ts` and `designation.ts`; no row, role or designation name is written in code.
 */
export interface RoleBlockRegister {
    /** The COLLECTION row whose elements are the roles (`activityRoles[]`). */
    rolesRow: string
    /** The selector attribute of that row naming the role. */
    roleAttribute: string
    /** The roles, in the vocabulary's order. */
    roles: string[]
    /** The FIELD row, owned by the roles row, saying how a role passes to the other team. */
    exchangeRow: string
    /** The ways a role may pass (one member: the coach calls the next block). */
    exchanges: string[]
    /** The BLOCK_ROLE designation, spelled as the list spells it (`ROLE_HOLDER_<role>`). */
    holderDesignation: string
    /** DRAFT coach nouns, one per role — not approved wording. */
    coachNouns: Record<string, string>
}

/**
 * **The derived region attribute `targetOf`, as data** — register version 10, 15 October 2026, his M1: *"Allow target
 * configurations to reflect each team's role during the block."* Which rows say that an objective of a role, attacked by
 * a team, references a region. Read by `derivation/target-of.ts` (`markTargets`, answered by `designation.ts`
 * `targetDesignations`); no row id is written there.
 */
export interface TargetOfRegister {
    row: string
    attribute: string
    objectivesRow: string
    referenceRow: string
    /** The objective's team and role rows (stage K6, 15 October 2026: GA-RELATIVE-PLACEMENT reads a team's direction of attack through them). */
    teamRow: string
    roleRow: string
    /** The objective's selector attributes for its team and its role (the team and role rows' own `selectorAttribute`). */
    teamAttribute: string
    roleAttribute: string
    role: string
    /** The leaves an objective holds its reference, team and role at in a game (the rows' own paths). */
    referenceLeaf: string
    teamLeaf: string
    roleLeaf: string
}

function indexTargetOf(block: any, rows: Map<string, RegisterRow>, vocabularies: Map<string, string[]>, designations: DesignationRegister): TargetOfRegister | null {
    if (!block || typeof block !== 'object') return null
    const row = String(block.row ?? '')
    const attribute = String(block.attribute ?? '')
    if (rows.get(row)?.kind !== 'COLLECTION' || !(rows.get(row)?.selectorAttributes ?? []).includes(attribute)) throw new HaltError('H1', `targetOf: ${attribute} is not a selector attribute of the COLLECTION row ${row}`)
    if (!designations.attributes.some(entry => entry.row === row && entry.attribute === attribute)) throw new HaltError('H1', `targetOf: ${row}.${attribute} is not listed among the designation-valued attributes`)
    const objectivesRow = String(block.objectivesRow ?? '')
    if (rows.get(objectivesRow)?.kind !== 'COLLECTION') throw new HaltError('H1', `targetOf: ${objectivesRow} is not a COLLECTION row`)
    const owned = (id: string) => rows.get(id)?.kind === 'FIELD' && rows.get(id)?.ownerRow === objectivesRow
    const [referenceRow, teamRow, roleRow] = [String(block.referenceRow ?? ''), String(block.teamRow ?? ''), String(block.roleRow ?? '')]
    for (const id of [referenceRow, teamRow, roleRow]) if (!owned(id)) throw new HaltError('H1', `targetOf: ${id} is not a FIELD row owned by ${objectivesRow}`)
    const teamAttribute = rows.get(teamRow)?.selectorAttribute
    const roleAttribute = rows.get(roleRow)?.selectorAttribute
    if (!teamAttribute || !roleAttribute) throw new HaltError('H1', `targetOf: the team row ${teamRow} and the role row ${roleRow} must each hold a selector attribute`)
    const role = String(block.role ?? '')
    if (!(vocabularies.get(`${roleRow}.${roleAttribute}`) ?? []).includes(role)) throw new HaltError('H1', `targetOf: ${role} is not a member of ${roleRow}.${roleAttribute}`)
    const leaf = (id: string) => String(rows.get(id)?.path ?? '').split('[].').pop() ?? ''
    return { row, attribute, objectivesRow, referenceRow, teamRow, roleRow, teamAttribute, roleAttribute, role, referenceLeaf: leaf(referenceRow), teamLeaf: leaf(teamRow), roleLeaf: leaf(roleRow) }
}

/**
 * The role-block block, validated as the rest of the register is (halt H1): every name it gives must be a row, a
 * vocabulary or a designation the register defines, with the shape the capability needs. A register without the block
 * (one written before version 10) has no role blocks, and every game derives as before.
 */
function indexRoleBlocks(block: any, rows: Map<string, RegisterRow>, vocabularies: Map<string, string[]>, designations: DesignationRegister): RoleBlockRegister | null {
    if (!block || typeof block !== 'object') return null
    const rolesRow = String(block.rolesRow ?? '')
    const roleAttribute = String(block.roleAttribute ?? '')
    if (rows.get(rolesRow)?.kind !== 'COLLECTION') throw new HaltError('H1', `roleBlocks.rolesRow ${rolesRow} is not a COLLECTION row`)
    if (!(rows.get(rolesRow)?.selectorAttributes ?? []).includes(roleAttribute)) throw new HaltError('H1', `roleBlocks.roleAttribute ${roleAttribute} is not a selector attribute of ${rolesRow}`)
    const roles = vocabularies.get(String(block.roleVocabulary ?? ''))
    if (!roles || roles.length !== 2) throw new HaltError('H1', `roleBlocks.roleVocabulary ${block.roleVocabulary} must be a vocabulary of exactly two roles (one per team)`)
    const exchangeRow = String(block.exchangeRow ?? '')
    if (rows.get(exchangeRow)?.kind !== 'FIELD' || rows.get(exchangeRow)?.ownerRow !== rolesRow) throw new HaltError('H1', `roleBlocks.exchangeRow ${exchangeRow} is not a FIELD row owned by ${rolesRow}`)
    const exchanges = vocabularies.get(String(block.exchangeVocabulary ?? ''))
    if (!exchanges || !exchanges.length) throw new HaltError('H1', `roleBlocks.exchangeVocabulary ${block.exchangeVocabulary} is not a vocabulary`)
    const holderDesignation = String(block.holderDesignation ?? '')
    if (designations.resolutions.get(holderDesignation)?.kind !== 'BLOCK_ROLE') throw new HaltError('H1', `roleBlocks.holderDesignation ${holderDesignation} is not a BLOCK_ROLE designation of the list`)
    if (!holderDesignation.endsWith('<role>')) throw new HaltError('H1', `roleBlocks.holderDesignation ${holderDesignation} does not end in the <role> placeholder`)
    const nouns = block.coachNouns?.nouns ?? {}
    for (const role of roles) if (typeof nouns[role] !== 'string' || !nouns[role].trim()) throw new HaltError('H1', `roleBlocks.coachNouns names no noun for ${role}`)
    return { rolesRow, roleAttribute, roles: [...roles], exchangeRow, exchanges: [...exchanges], holderDesignation, coachNouns: Object.fromEntries(roles.map(role => [role, String(nouns[role])])) }
}

/**
 * **Where the participant-reassignment capability finds its rows** — register version 11, 15 October 2026, for his answer
 * to RD-1 (reply filed 18 October 2026): *"role exchange and participant reassignment should remain separate capabilities.
 * Exchanging roles should not inherently require players to change teams. This particular realization uses both mechanisms
 * to preserve its intended numerical relationship."* Read by `derivation/reassignment.ts`; no row id is written there.
 */
export interface ReassignmentRegister {
    /** The COLLECTION row whose elements are the reassignments (`reassignments[]`). */
    row: string
    /** The FIELD rows owned by it: the role the performers join, the kind of performer, and how many. */
    toRoleRow: string
    performerRowRow: string
    countRow: string
    /** The leaves those fields sit at in a game. */
    toRoleLeaf: string
    performerRowLeaf: string
    countLeaf: string
    /** The row counting a team's outfield players. */
    outfieldRow: string
    /** Every row that counts a kind of performer per team: the outfield row, then the specialized-role rows of the teams row. */
    performerRows: string[]
    /** DRAFT coach noun for an outfield player — not approved wording. */
    outfieldNoun: { singular: string; plural: string }
}

/**
 * The reassignment block, validated as the rest of the register is (halt H1): its rows must be the collection and the three
 * fields it owns, the two carried fields must be carried from the collection's own selector attributes (SD-92), and the
 * outfield row must be a field of the teams row. A register without the block has no reassignment, and every game derives
 * as before. It needs the role-block capability: a reassignment happens at an exchange of roles and at nothing else.
 */
function indexReassignment(block: any, rows: Map<string, RegisterRow>, roleBlocks: RoleBlockRegister | null, designations: DesignationRegister): ReassignmentRegister | null {
    if (!block || typeof block !== 'object') return null
    if (!roleBlocks) throw new HaltError('H1', 'reassignment: a reassignment happens at an exchange of roles, and the register has no roleBlocks block')
    const row = String(block.row ?? '')
    if (rows.get(row)?.kind !== 'COLLECTION') throw new HaltError('H1', `reassignment.row ${row} is not a COLLECTION row`)
    const owned = (id: string) => rows.get(id)?.kind === 'FIELD' && rows.get(id)?.ownerRow === row
    const [toRoleRow, performerRowRow, countRow] = [String(block.toRoleRow ?? ''), String(block.performerRowRow ?? ''), String(block.countRow ?? '')]
    for (const id of [toRoleRow, performerRowRow, countRow]) if (!owned(id)) throw new HaltError('H1', `reassignment: ${id} is not a FIELD row owned by ${row}`)
    const attributes = rows.get(row)?.selectorAttributes ?? []
    for (const id of [toRoleRow, performerRowRow]) {
        const carried = rows.get(id)?.selectorAttribute
        if (!carried || !attributes.includes(carried)) throw new HaltError('H1', `reassignment: ${id} must carry a selector attribute of ${row} (SD-92)`)
    }
    const outfieldRow = String(block.outfieldRow ?? '')
    const teamsRow = designations.teamsRow
    if (rows.get(outfieldRow)?.kind !== 'FIELD' || rows.get(outfieldRow)?.ownerRow !== teamsRow) throw new HaltError('H1', `reassignment.outfieldRow ${outfieldRow} is not a FIELD row of the teams row ${teamsRow}`)
    const specialized = [...rows.values()].filter(r => (r as { specializedRole?: boolean }).specializedRole && r.ownerRow === teamsRow).map(r => r.id)
    const noun = block.outfieldNoun ?? {}
    if (typeof noun.singular !== 'string' || !noun.singular.trim() || typeof noun.plural !== 'string' || !noun.plural.trim()) throw new HaltError('H1', 'reassignment.outfieldNoun names no singular and plural noun')
    const leaf = (id: string) => String(rows.get(id)?.path ?? '').split('[].').pop() ?? ''
    return {
        row,
        toRoleRow,
        performerRowRow,
        countRow,
        toRoleLeaf: leaf(toRoleRow),
        performerRowLeaf: leaf(performerRowRow),
        countLeaf: leaf(countRow),
        outfieldRow,
        performerRows: [outfieldRow, ...specialized],
        outfieldNoun: { singular: String(noun.singular), plural: String(noun.plural) },
    }
}

export interface RegisterIndex {
    rows: Map<string, RegisterRow>
    /** Position in `register.rows`, the canonical row order (package §8). */
    rowOrdinal: Map<string, number>
    /** Row id → the collection row that owns it; game-level rows are absent. */
    ownerRow: Map<string, string>
    /** Row id → its `fillable` text. Exhaustive: a row absent here has no structurally defined choice space. */
    fillable: Map<string, string>
    /**
     * Row id → the collection path the row DECLARES its choice space to be the members of.
     *
     * `fillable` says in words what may fill a row — *"one of the teams the game establishes"* — and
     * `fillableFrom` says it as data: `performers.teams[]`. Until 13 October nothing read it, so the one
     * row that carries it accepted any string at all: measured, an initial holder of `banana` and one that
     * named a REGION both realized, passed all three acceptance conditions and passed the post-realization
     * gates. Realization now requires the value to be a member of the collection named here.
     */
    fillableFrom: Map<string, string>
    /** Row id → what every bounding item must be for the line to open (register version 12, his M3). */
    fillableRequires: Map<string, FillableRequirement>
    /**
     * Row id → the elements its choice space is for, by the owning collection's selector attribute (register version 12).
     * T2's fillable text has always said "for trigger START"; until this nothing read it.
     */
    fillableWhen: Map<string, { selectorAttribute: string; in: string[] }>
    /** Game-level row id → the element line whose entailed value it takes (register version 12; `EntailedBy`). */
    entailedBy: Map<string, EntailedBy>
    /** Row id -> the authoritative structure that supplies its OUTER bound, where one does. */
    outerBound: Map<string, string>
    /** RC-21 relative spatial terms: prose test, machine-readable form and phrase index, all canonical. */
    relativeTerms: Record<string, unknown>
    /** S3 noun semantics: how many dimensions a noun gives extent in. Never which axis. */
    nounSemantics: Record<string, unknown>
    /**
     * Per-trigger semantics, indexed so a check can consult the entry for the trigger in front of it.
     *
     * His ruling of 4 October authorized this as a bounded integrity correction: a registered trigger's
     * semantics must be **consulted** where its evaluability depends on them, rather than left in prose that
     * nothing reads. `FIRST_FORWARD_PASS` states its own precondition — *"where that direction is FREE the
     * trigger is NOT EVALUABLE and its line is CONDITIONAL, never failed"* — and nothing enforced it: the
     * admitting check tested list membership alone, so the trigger passed on membership regardless.
     *
     * Only the machine-readable part is acted on. `evaluabilityDependsOn` names the row whose establishment
     * the trigger's evaluability requires; the prose stays prose, because reading a precondition out of prose
     * is what SD-32 forbids. Indexed exactly as `nounSemantics` is, rather than by a second mechanism.
     */
    triggerSemantics: Record<string, { evaluabilityDependsOn?: string; [key: string]: unknown } | string>
    /** Rows counting a specialized performer role -> the role name, which the register carries and the engine does not. */
    specializedRoleRows: Map<string, string>
    /** Row id → the condition under which the row applies at all. */
    applicability: Map<string, ApplicabilityCondition>
    /** Vocabulary name → its closed member list. */
    vocabularies: Map<string, string[]>
    vocabularyVersions: Record<string, string>
    contractEnums: Record<string, string[]>
    /**
     * **SD-84 — singleton collections.** Rows the authoritative schema fixes at cardinality exactly one.
     *
     * Read from the schema invariant itself, as data: a citable standing decision whose item states
     * `COUNT = 1` on a `COLLECTION` row. Never from the row's prose `valueType`, because identity here
     * *"follows from the authoritative schema invariant itself rather than from interpretation of
     * selectors, wording, or presumed equivalence"*.
     */
    singletonRows: Map<string, string>
    /** Contract-level sentinels for an item's `row`. A sentinel is never a row and creates no property. */
    contractSentinels: Record<string, any>
    citableStandingDecisions: Set<string>
    /** The citable entries themselves, as the register states them. */
    standingDecisions: any[]
    /**
     * The canonical team designations (RC-22), each as the register spells it, gloss included. Read by
     * `GA-AFFILIATION` (14 October 2026), which needs to know which designations the register defines by the
     * possession relation; the gloss is the only place that is said.
     */
    teamDesignations: string[]
    /** The same designations typed (register version 9): read by `designation.ts`, the one resolver. */
    designations: DesignationRegister
    /** The role-block capability's rows and names (register version 10, his M1), or null in a register without it. */
    roleBlocks: RoleBlockRegister | null
    /** The derived region attribute naming the team that attacks it (register version 10), or null without it. */
    targetOf: TargetOfRegister | null
    /** The participant-reassignment capability's rows (register version 11, his RD-1 answer), or null without it. */
    reassignment: ReassignmentRegister | null
    registerVersion: string
}

/**
 * **The typed designations, validated as the rest of the register is (halt H1).** A list entry with no resolution, two
 * resolutions for one entry, a resolution for an entry the list does not hold, or a kind, scope or basis outside the
 * closed lists would each let a consumer decide a team on something the register does not say. A register with no
 * `resolutions` block (one written before version 9) indexes an empty map and resolves nothing.
 */
function indexDesignations(block: any, rows: Map<string, RegisterRow>): DesignationRegister {
    const empty: DesignationRegister = { resolutions: new Map(), kinds: [], scopes: [], standingScopes: [], teamsRow: null, attributes: [] }
    if (!block || typeof block !== 'object' || !block.resolutions) return empty
    const kinds: string[] = Array.isArray(block.resolutionKinds) ? block.resolutionKinds.map(String) : []
    const scopes: string[] = Array.isArray(block.resolutionScopes) ? block.resolutionScopes.map(String) : []
    const standingScopes: string[] = Array.isArray(block.standingScopes) ? block.standingScopes.map(String) : []
    for (const scope of standingScopes) if (!scopes.includes(scope)) throw new HaltError('H1', `standing scope ${scope} is not a registered designation scope`)
    const names = (Array.isArray(block.list) ? block.list : []).map((entry: unknown) => designationName(String(entry)))
    const resolutions = new Map<string, DesignationResolution>()
    for (const [name, raw] of Object.entries(block.resolutions as Record<string, any>)) {
        if (!names.includes(name)) throw new HaltError('H1', `designation resolution for ${name}, which the designation list does not hold`)
        if (!raw || !kinds.includes(String(raw.kind)) || !scopes.includes(String(raw.scope))) throw new HaltError('H1', `designation ${name} has a kind or scope outside the closed lists`)
        if (raw.basis !== 'GLOSS' && raw.basis !== 'OUR_INTERPRETATION') throw new HaltError('H1', `designation ${name} names no basis (GLOSS or OUR_INTERPRETATION)`)
        if (typeof raw.from !== 'string' || !raw.from.trim()) throw new HaltError('H1', `designation ${name} does not say where its resolution comes from`)
        resolutions.set(name, { kind: String(raw.kind), scope: String(raw.scope), at: raw.at === null || raw.at === undefined ? null : String(raw.at), basis: raw.basis, from: raw.from })
    }
    for (const name of names) if (!resolutions.has(name)) throw new HaltError('H1', `designation ${name} has no typed resolution`)
    const teamsRow = block.teamsRow ? String(block.teamsRow) : null
    if (teamsRow && rows.get(teamsRow)?.kind !== 'COLLECTION') throw new HaltError('H1', `the designations' teams row ${teamsRow} is not a COLLECTION row`)
    const attributes = (Array.isArray(block.designationAttributes) ? block.designationAttributes : []).map((entry: any) => ({ row: String(entry?.row), attribute: String(entry?.attribute) }))
    for (const { row, attribute } of attributes) {
        if (!(rows.get(row)?.selectorAttributes ?? []).includes(attribute)) throw new HaltError('H1', `designation attribute ${attribute} is not a selector attribute of ${row}`)
    }
    return { resolutions, kinds, scopes, standingScopes, teamsRow, attributes }
}

export class HaltError extends Error {
    constructor(
        public readonly halt: 'H1' | 'H2',
        message: string,
    ) {
        super(message)
    }
}

/** Halt H1 — "the engine cannot name what it is talking about" (package §3.5). */
export function indexRegister(register: any): RegisterIndex {
    if (!register || !Array.isArray(register.rows)) throw new HaltError('H1', 'register has no rows array')

    const rows = new Map<string, RegisterRow>()
    const rowOrdinal = new Map<string, number>()
    const ownerRow = new Map<string, string>()
    const fillable = new Map<string, string>()
    const fillableFrom = new Map<string, string>()
    const outerBound = new Map<string, string>()

    register.rows.forEach((row: RegisterRow, i: number) => {
        if (!row || !row.id || !row.path || !row.kind) throw new HaltError('H1', `row ${i} lacks id, path or kind`)
        if (rows.has(row.id)) throw new HaltError('H1', `duplicate row id ${row.id}`)
        rows.set(row.id, row)
        rowOrdinal.set(row.id, i)
        if (row.ownerRow) ownerRow.set(row.id, row.ownerRow)
        if (row.fillable) {
            if (row.kind === 'VIEW') throw new HaltError('H1', `fillable entry on VIEW row ${row.id}`)
            fillable.set(row.id, row.fillable)
        }
        if (row.fillableFrom) {
            // A declared domain is the domain OF a choice space, so it means nothing on a row without one.
            if (!row.fillable) throw new HaltError('H1', `fillableFrom on ${row.id}, which has no fillable choice space`)
            fillableFrom.set(row.id, String(row.fillableFrom))
        }
        if (row.outerBound) {
            // An outer bound is only meaningful for a row that has a choice space to bound.
            if (!row.fillable) throw new HaltError('H1', `outerBound on ${row.id}, which has no fillable choice space`)
            outerBound.set(row.id, row.outerBound)
        }
    })

    for (const [rowId, owner] of ownerRow) {
        const target = rows.get(owner)
        if (!target) throw new HaltError('H1', `ownerRow ${owner} of ${rowId} is not a row`)
        if (target.kind !== 'COLLECTION') throw new HaltError('H1', `ownerRow ${owner} of ${rowId} is not a COLLECTION`)
    }

    // A declared domain must BE a collection the register knows, or membership of it can never be decided
    // and the declaration would go on being read by nothing.
    for (const [rowId, from] of fillableFrom) {
        if (![...rows.values()].some(row => row.kind === 'COLLECTION' && row.path === from)) {
            throw new HaltError('H1', `fillableFrom ${from} of ${rowId} is not the path of a COLLECTION row`)
        }
    }

    const applicability = new Map<string, ApplicabilityCondition>()
    const appBlock = register.applicability || {}
    for (const key of Object.keys(appBlock)) {
        const entry = appBlock[key]
        if (!entry || typeof entry !== 'object' || !entry.when) continue // prose notes in the same block
        if (!rows.has(key)) throw new HaltError('H1', `applicability keyed on unknown row ${key}`)
        const when = entry.when
        if (!Array.isArray(when.in) && !Array.isArray(when.notIn)) throw new HaltError('H1', `applicability for ${key} has no usable condition`)
        if (Array.isArray(when.in) && Array.isArray(when.notIn)) throw new HaltError('H1', `applicability for ${key} names both in and notIn; they are alternatives`)
        if (Array.isArray(when.notIn) && when.row) throw new HaltError('H1', `applicability for ${key} uses notIn on a governing row; the negative form is defined for a selector attribute only`)
        if (!when.row && !when.selectorAttribute) throw new HaltError('H1', `applicability for ${key} names neither a governing row nor a selector attribute`)
        if (when.row && when.selectorAttribute) throw new HaltError('H1', `applicability for ${key} names both a governing row and a selector attribute; they are alternatives`)
        if (when.row && !rows.has(String(when.row))) throw new HaltError('H1', `applicability for ${key} governs on unknown row ${when.row}`)
        applicability.set(key, {
            ...(when.row ? { row: String(when.row) } : { selectorAttribute: String(when.selectorAttribute) }),
            sameElement: !!when.sameElement,
            ...(Array.isArray(when.notIn) ? { notIn: when.notIn } : { in: when.in }),
        })
    }

    const vocabularies = new Map<string, string[]>()
    const vocabBlock = register.vocabularies || {}
    for (const key of Object.keys(vocabBlock)) {
        const value = vocabBlock[key]
        if (Array.isArray(value)) vocabularies.set(key, value)
    }
    const contractEnums: Record<string, string[]> = (vocabBlock.contractEnums as any) || {}

    /**
     * **Which bounds may open a coach's choice, and for which elements — register version 12 (his M3), validated as the rest
     * of the register is (halt H1).** A requirement, basis or bound kind outside the closed lists, a restriction on a row
     * with no choice space, or one naming an attribute the owning collection does not carry would each let a line open on
     * something the register does not say.
     */
    const fillableRequires = new Map<string, FillableRequirement>()
    const fillableWhen = new Map<string, { selectorAttribute: string; in: string[] }>()
    for (const row of rows.values()) {
        if (row.fillableRequires !== undefined) {
            const raw: any = row.fillableRequires
            if (!row.fillable) throw new HaltError('H1', `fillableRequires on ${row.id}, which has no fillable choice space`)
            const requirement = Array.isArray(raw?.requirement) ? raw.requirement.map(String) : []
            const basis = Array.isArray(raw?.basis) ? raw.basis.map(String) : []
            if (!requirement.length || requirement.some((r: string) => !(contractEnums.requirement ?? []).includes(r))) throw new HaltError('H1', `fillableRequires on ${row.id} names a requirement outside contractEnums.requirement`)
            if (!basis.length || basis.some((b: string) => !(contractEnums.basis ?? []).includes(b))) throw new HaltError('H1', `fillableRequires on ${row.id} names a basis outside contractEnums.basis`)
            if (raw?.bound !== 'QUALITATIVE') throw new HaltError('H1', `fillableRequires on ${row.id} names a bound kind other than QUALITATIVE`)
            fillableRequires.set(row.id, { requirement, basis, bound: 'QUALITATIVE' })
        }
        if (row.fillableWhen !== undefined) {
            const raw: any = row.fillableWhen
            if (!row.fillable) throw new HaltError('H1', `fillableWhen on ${row.id}, which has no fillable choice space`)
            const owner = row.ownerRow ? rows.get(row.ownerRow) : undefined
            const attribute = String(raw?.selectorAttribute ?? '')
            if (!owner || !(owner.selectorAttributes ?? []).includes(attribute)) throw new HaltError('H1', `fillableWhen on ${row.id} names ${attribute}, which is not a selector attribute of its owning collection`)
            const members = Array.isArray(raw?.in) ? raw.in.map(String) : []
            const vocabulary = vocabularies.get(attribute)
            if (!members.length || (vocabulary && members.some((m: string) => !vocabulary.includes(m)))) throw new HaltError('H1', `fillableWhen on ${row.id} names no value, or one outside the ${attribute} vocabulary`)
            fillableWhen.set(row.id, { selectorAttribute: attribute, in: members })
        }
    }
    const entailedBy = new Map<string, EntailedBy>()
    for (const row of rows.values()) {
        if (row.entailedBy === undefined) continue
        const raw: any = row.entailedBy
        const collection = rows.get(String(raw?.collectionRow ?? ''))
        const source = rows.get(String(raw?.row ?? ''))
        if (row.ownerRow) throw new HaltError('H1', `entailedBy on ${row.id}, which is not a game-level row`)
        if (!collection || collection.kind !== 'COLLECTION' || !(collection.selectorAttributes ?? []).includes(String(raw?.selectorAttribute))) throw new HaltError('H1', `entailedBy on ${row.id} names no collection carrying the selector attribute ${raw?.selectorAttribute}`)
        if (!source || source.kind !== 'FIELD' || source.ownerRow !== collection.id) throw new HaltError('H1', `entailedBy on ${row.id} names ${raw?.row}, which is not a field of ${collection.id}`)
        const vocabulary = vocabularies.get(String(raw.selectorAttribute))
        if (typeof raw?.value !== 'string' || (vocabulary && !vocabulary.includes(raw.value))) throw new HaltError('H1', `entailedBy on ${row.id} names a value outside the ${raw.selectorAttribute} vocabulary`)
        entailedBy.set(row.id, { collectionRow: collection.id, selectorAttribute: String(raw.selectorAttribute), value: raw.value, row: source.id })
    }

    // A sentinel may never collide with a row id: that is what keeps it outside the representation.
    const sentinels: Record<string, any> = {}
    for (const [key, entry] of Object.entries(register.contractSentinels || {})) {
        if (key === 'note' || !entry || typeof entry !== 'object') continue
        if (rows.has(key)) throw new HaltError('H1', `contract sentinel ${key} collides with a register row id`)
        sentinels[key] = entry
    }

    // SD-84 — row id → the standing decision that fixes it at exactly one.
    const singletonRows = new Map<string, string>()
    for (const decision of register.citableStandingDecisions || []) {
        const claim = decision && decision.item
        if (!claim || claim.requirement !== 'COUNT' || claim.value !== 1) continue
        const row = rows.get(String(claim.row))
        if (!row || row.kind !== 'COLLECTION') continue
        singletonRows.set(row.id, decision.id)
    }

    const citable = new Set<string>((register.citableStandingDecisions || []).map((d: any) => d.id).filter(Boolean))
    const designations = indexDesignations(register.teamDesignations, rows)
    const roleBlocks = indexRoleBlocks(register.roleBlocks, rows, vocabularies, designations)

    return {
        rows,
        rowOrdinal,
        ownerRow,
        fillable,
        fillableFrom,
        fillableRequires,
        fillableWhen,
        entailedBy,
        outerBound,
        relativeTerms: register.relativeTerms || {},
        nounSemantics: (register.vocabularies && register.vocabularies.nounSemantics) || {},
        triggerSemantics: (register.vocabularies && register.vocabularies.triggerSemantics) || {},
        specializedRoleRows: new Map(
            (register.rows || [])
                .filter((row) => row && row.specializedRole)
                .map((row) => [String(row.id), String(row.path).split(".").pop()]),
        ),
        applicability,
        vocabularies,
        vocabularyVersions: (vocabBlock.versions as any) || {},
        contractEnums,
        singletonRows,
        contractSentinels: sentinels,
        citableStandingDecisions: citable,
        standingDecisions: (register.citableStandingDecisions || []).filter((d: any) => d && d.id),
        teamDesignations: Array.isArray(register.teamDesignations?.list) ? register.teamDesignations.list.map(String) : [],
        designations,
        roleBlocks,
        targetOf: indexTargetOf(register.targetOf, rows, vocabularies, designations),
        reassignment: indexReassignment(register.reassignment, rows, roleBlocks, designations),
        registerVersion: register.version,
    }
}

/**
 * Halt H2 — under SD-30 an unstamped result asserts nothing, so it is refused rather than emitted.
 * Every vocabulary must carry a version: the data model requires each list versioned separately so a
 * stored result can be known stale when a list's membership changes.
 */
export function buildVersions(
    index: RegisterIndex,
    input: { contracts: { contractId: string; knowledgeVersion?: string }[]; selection: { objectId: string; knowledgeVersion?: string }[]; derivationRules: { version: string } },
    engineVersion: string,
): Versions {
    if (!index.registerVersion) throw new HaltError('H2', 'register carries no version')
    if (!input.derivationRules || !input.derivationRules.version) throw new HaltError('H2', 'no derivation-rules version')
    if (!engineVersion) throw new HaltError('H2', 'no engine version')

    const vocabularies: Record<string, string> = {}
    for (const name of [...index.vocabularies.keys()].sort()) {
        const version = index.vocabularyVersions[name]
        if (!version) throw new HaltError('H2', `vocabulary ${name} carries no version`)
        vocabularies[name] = version
    }

    return {
        register: index.registerVersion,
        vocabularies,
        derivation: input.derivationRules.version,
        engine: engineVersion,
        contracts: input.contracts
            .map(c => ({ id: c.contractId, version: c.knowledgeVersion || '' }))
            .sort((a, b) => a.id.localeCompare(b.id)),
        objects: input.selection
            .map(s => ({ id: s.objectId, version: s.knowledgeVersion || '' }))
            .sort((a, b) => a.id.localeCompare(b.id)),
    }
}
