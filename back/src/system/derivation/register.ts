/**
 * Derivation engine — the register as data (package §1.2, §2.2 stage 0).
 *
 * The register is versioned data, never code. This module validates it against its own meta-schema
 * (halt H1), indexes it, and builds the `Versions` block (halt H2). It decides nothing about any
 * contract.
 */

import { ROLE_YIELD_KEY, ROLE_YIELD_MARKERS, Versions } from './types'

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
    /**
     * **On a COLLECTION row: its elements earn the value another row holds, and hold none of their own** — register version 14,
     * 17 October 2026 (V27, an occurrence that also counts as the primary event and earns its value, V2). Refused at load (H1)
     * where a FIELD row the collection owns sits at the same leaf as the named row, so no element can carry a value of its own.
     *
     * **On a FIELD row owned by a collection: the event it names earns the value another row holds** — register version 16, 22
     * October 2026 (B9, a role's own primary scoring event, earning V2). Refused at load (H1) where the row is a game-level field, or
     * where a FIELD row its owning collection holds sits at the earned row's leaf, so no role can carry a value of its own.
     */
    earnsValueOf?: string
}

/**
 * **Where the role-scoring capability finds its rows** — register version 16, 22 October 2026. Christian, reply filed 25 October 2026,
 * item 2: *"I approve extending the September 15 decision to support one primary scoring event per role in an asymmetric activity,
 * rather than requiring both teams to use the same scoring event type."* *"The engine should verify that the objectives are coherent and
 * compatible rather than simply allow any combination of scoring events."* Read by GA-ROLE-EVENTS (gates.ts) and the one reader of a
 * team's scoring event (rendering/game-reading.ts `eventKindOf`); no row, kind or role is written in either.
 */
export interface RoleScoringRegister {
    /** The FIELD row, owned by the roles row, holding a role's own primary scoring event (B9). */
    eventRow: string
    /** The game's primary event's kind and value (V1, V2), its conditions (V3), value modifiers (V7) and also-counts (V27). */
    kindRow: string
    valueRow: string
    conditionsRow: string
    valueModifiersRow: string
    alsoCountsRow: string
    /** The role's credit bound (B8). */
    creditRow: string
    /** The closed list a scoring event is a member of (V1's vocabulary). */
    kindVocabulary: string
    kinds: string[]
    /** The two kinds of target an objective may reference, each with its row and the row holding its type (noun or kind). */
    targets: { region: { row: string; typeRow: string }; object: { row: string; typeRow: string } }
    /** The region selector term that says a region item describes a target (an objective-area region). */
    targetFunction: { attribute: string; value: string }
    /** OUR_INTERPRETATION: the kind of target each listed scoring event scores at. A kind not listed is not evaluable. */
    targetTypes: Map<string, { target: 'region' | 'object'; type: string | null }[]>
    /** The role-yield marker as the register names it (must equal `ROLE_YIELD_KEY` / `ROLE_YIELD_MARKERS`). */
    roleYield: { key: string; values: string[] }
    /** The leaves the event and the credit sit at on a role element (`scoresBy`, `creditedWithin`). */
    eventLeaf: string
    creditLeaf: string
    /**
     * **The FIELD row of an object target naming the specialized performer whose team defends it** (O7; register version 20, 26 October
     * 2026), or null in a register without it. Christian, reply filed 26 October 2026, item 6: *"Record that the physical [object] is defended
     * by the team with the active [specialized performer] during that block, and validate this relationship in both blocks."* (His nouns
     * bracketed for the coupling ratchet.) Its value is a specialized performer row of the teams collection; read only by GA-ROLE-EVENTS
     * clause 13, which holds the relationship in every game, so in each block of a role-block activity.
     */
    defendedByRow: string | null
}

/**
 * The role-scoring block, validated as the rest of the register is (halt H1): every name must be a row, a vocabulary or a designation
 * the register defines, with the shape the capability needs, and the marker must be the one the engine implements. A register without
 * the block (one written before version 16) has no role scoring: no role scores by an event of its own, and every game reads as before.
 */
function indexRoleScoring(block: any, rows: Map<string, RegisterRow>, vocabularies: Map<string, string[]>, roleBlocks: RoleBlockRegister | null): RoleScoringRegister | null {
    if (!block || typeof block !== 'object') return null
    if (!roleBlocks) throw new HaltError('H1', 'roleScoring: a role scores by an event of its own only in a game played in role blocks, and the register has no roleBlocks block')
    const name = (key: string) => String(block[key] ?? '')
    const field = (id: string) => rows.get(id)?.kind === 'FIELD'
    const collection = (id: string) => rows.get(id)?.kind === 'COLLECTION'
    const eventRow = name('eventRow')
    const creditRow = name('creditRow')
    for (const id of [eventRow, creditRow]) if (!field(id) || rows.get(id)?.ownerRow !== roleBlocks.rolesRow) throw new HaltError('H1', `roleScoring: ${id} is not a FIELD row owned by the roles row ${roleBlocks.rolesRow}`)
    const [kindRow, valueRow] = [name('kindRow'), name('valueRow')]
    for (const id of [kindRow, valueRow]) if (!field(id) || rows.get(id)?.ownerRow) throw new HaltError('H1', `roleScoring: ${id} is not a game-level FIELD row`)
    if (rows.get(eventRow)?.earnsValueOf !== valueRow) throw new HaltError('H1', `roleScoring: ${eventRow} does not earn ${valueRow} (earnsValueOf), so a role's own event would hold a value of its own or none`)
    const [conditionsRow, valueModifiersRow, alsoCountsRow] = [name('conditionsRow'), name('valueModifiersRow'), name('alsoCountsRow')]
    for (const id of [conditionsRow, valueModifiersRow, alsoCountsRow]) if (!collection(id)) throw new HaltError('H1', `roleScoring: ${id} is not a COLLECTION row`)
    const kindVocabulary = name('kindVocabulary')
    const kinds = vocabularies.get(kindVocabulary)
    if (!kinds || !kinds.length) throw new HaltError('H1', `roleScoring.kindVocabulary ${kindVocabulary} is not a vocabulary`)
    const typeVocabulary = (typeRow: string): string[] | undefined => {
        const attribute = rows.get(typeRow)?.selectorAttribute
        return attribute ? vocabularies.get(`${typeRow}.${attribute}`) : undefined
    }
    const targets: RoleScoringRegister['targets'] = { region: { row: '', typeRow: '' }, object: { row: '', typeRow: '' } }
    for (const key of ['region', 'object'] as const) {
        const row = String(block.targets?.[key]?.row ?? '')
        const typeRow = String(block.targets?.[key]?.typeRow ?? '')
        if (!collection(row) || !field(typeRow) || rows.get(typeRow)?.ownerRow !== row) throw new HaltError('H1', `roleScoring.targets.${key}: ${typeRow} is not a FIELD row owned by the COLLECTION row ${row}`)
        if (!typeVocabulary(typeRow)) throw new HaltError('H1', `roleScoring.targets.${key}: ${typeRow} carries no selector attribute with a vocabulary`)
        targets[key] = { row, typeRow }
    }
    const fn = block.targetFunction ?? {}
    const fnAttribute = String(fn.attribute ?? '')
    const fnValue = String(fn.value ?? '')
    if (!(rows.get(targets.region.row)?.selectorAttributes ?? []).includes(fnAttribute)) throw new HaltError('H1', `roleScoring.targetFunction: ${fnAttribute} is not a selector attribute of ${targets.region.row}`)
    const fnRow = [...rows.values()].find(row => row.ownerRow === targets.region.row && row.selectorAttribute === fnAttribute)
    if (!fnRow || !(vocabularies.get(`${fnRow.id}.${fnAttribute}`) ?? []).includes(fnValue)) throw new HaltError('H1', `roleScoring.targetFunction: ${fnValue} is not a member of the ${fnAttribute} vocabulary`)
    const map = block.targetTypes?.map
    if (block.targetTypes?.basis !== 'OUR_INTERPRETATION' || typeof block.targetTypes?.from !== 'string' || !block.targetTypes.from.trim()) throw new HaltError('H1', 'roleScoring.targetTypes must say it is OUR_INTERPRETATION and where it comes from')
    if (!map || typeof map !== 'object') throw new HaltError('H1', 'roleScoring.targetTypes.map is not a map')
    const targetTypes = new Map<string, { target: 'region' | 'object'; type: string | null }[]>()
    for (const [kind, entries] of Object.entries(map as Record<string, any>)) {
        if (!kinds.includes(kind)) throw new HaltError('H1', `roleScoring.targetTypes: ${kind} is not a member of ${kindVocabulary}`)
        if (!Array.isArray(entries) || !entries.length) throw new HaltError('H1', `roleScoring.targetTypes: ${kind} names no target`)
        targetTypes.set(
            kind,
            entries.map((entry: any) => {
                const target = entry?.target
                if (target !== 'region' && target !== 'object') throw new HaltError('H1', `roleScoring.targetTypes: ${kind} names the target ${JSON.stringify(target)}, neither region nor object`)
                const type = entry?.type === undefined ? null : String(entry.type)
                if (type !== null && !(typeVocabulary(targets[target as 'region' | 'object'].typeRow) ?? []).includes(type)) throw new HaltError('H1', `roleScoring.targetTypes: ${kind} names the ${target} type ${type}, which is not a member of its vocabulary`)
                return { target, type }
            }),
        )
    }
    const key = String(block.roleYield?.key ?? '')
    const values = Array.isArray(block.roleYield?.values) ? block.roleYield.values.map(String) : []
    if (key !== ROLE_YIELD_KEY || JSON.stringify(values) !== JSON.stringify([...ROLE_YIELD_MARKERS])) throw new HaltError('H1', `roleScoring.roleYield names ${key} ${JSON.stringify(values)}, which is not the marker the engine implements (${ROLE_YIELD_KEY} ${JSON.stringify(ROLE_YIELD_MARKERS)})`)
    const leaf = (id: string) => String(rows.get(id)?.path ?? '').split('[].').pop() ?? ''
    /**
     * The defended-by row (register version 20), where the block names one: a FIELD row owned by the object target row, never a game-level
     * row or another collection's, so the relationship it states is an object's. Absent: null, and clause 13 has no instance.
     */
    let defendedByRow: string | null = null
    if (block.defendedByRow !== undefined) {
        const id = String(block.defendedByRow ?? '')
        if (!field(id) || rows.get(id)?.ownerRow !== targets.object.row) throw new HaltError('H1', `roleScoring.defendedByRow ${id} is not a FIELD row owned by the object target row ${targets.object.row}`)
        defendedByRow = id
    }
    return { eventRow, kindRow, valueRow, conditionsRow, valueModifiersRow, alsoCountsRow, creditRow, kindVocabulary, kinds: [...kinds], targets, targetFunction: { attribute: fnAttribute, value: fnValue }, targetTypes, roleYield: { key, values }, eventLeaf: leaf(eventRow), creditLeaf: leaf(creditRow), defendedByRow }
}

/**
 * **Where the object-geometry capability finds its rows** — register version 17, 23 October 2026. Christian, reply filed 25 October 2026,
 * item 3: *"The goal should be positioned at the building team's end."* *"Goal dimensions and suitability should be determined through
 * approved [sport] knowledge and available equipment. Please identify any missing knowledge decisions needed here rather than inventing
 * dimensions or treating every goal as interchangeable."* Read by team-ends.ts (which end an object target is at), gates.ts
 * `degenerateIsLegitimate` (a zero extent an object's kind makes legitimate), realize.ts (the width the session states for an object of a
 * kind) and corpus.ts (the provisional realizations' placeholder refusal); no row or kind is written in any of them.
 */
export interface ObjectGeometryRegister {
    /**
     * The objects collection (O1), its kind (O2) and its along and across positions (O4, O5), each read by the consumers named above. The
     * block's facing row (O6) was validated at load and not indexed until its wording existed; since Stage G (23 October 2026) the renderer
     * reads it, below.
     */
    row: string
    kindRow: string
    alongRow: string
    acrossRow: string
    /** The leaves the kind and the along position sit at on an object element (`kind`, `position.along`), as realize.ts and team-ends.ts read them. */
    kindLeaf: string
    alongLeaf: string
    /**
     * **The across position's leaf, and the facing row with its leaf** — Stage G, 23 October 2026: the renderer's Set up sentence placing an
     * object set out once reads where it stands across the area and which way it faces (`render-concrete-game.ts`), and cites each by the
     * register's path, so no leaf is written there. The facing row (O6) was validated and not indexed until a consumer read it.
     */
    acrossLeaf: string
    facingRow: string
    facingLeaf: string
    /** OUR_INTERPRETATION: how many dimensions an object of a kind gives extent in (1: extent on exactly one axis). */
    extentDimensions: Map<string, number>
}

/**
 * The object-geometry block, validated as the rest of the register is (halt H1): every row must be the register's, owned by the objects
 * collection, at the path its role needs; each kind in the dimensions map a member of the kind row's vocabulary, with 1 or 2 dimensions, and
 * the map labelled OUR_INTERPRETATION with a note. A register without the block (one written before version 17) has none: no object kind
 * makes a zero extent legitimate, and no object target's end is read.
 */
function indexObjectGeometry(block: any, rows: Map<string, RegisterRow>, vocabularies: Map<string, string[]>): ObjectGeometryRegister | null {
    if (!block || typeof block !== 'object') return null
    const name = (key: string) => String(block[key] ?? '')
    const row = name('row')
    if (rows.get(row)?.kind !== 'COLLECTION') throw new HaltError('H1', `objectGeometry.row ${row} is not a COLLECTION row`)
    const leafOf = (id: string) => {
        const path = String(rows.get(id)?.path ?? '')
        const container = String(rows.get(row)?.path ?? '')
        return path.startsWith(`${container}.`) ? path.slice(container.length + 1) : ''
    }
    const owned = (key: string, ending: string): string => {
        const id = name(key)
        if (rows.get(id)?.kind !== 'FIELD' || rows.get(id)?.ownerRow !== row) throw new HaltError('H1', `objectGeometry.${key} ${id} is not a FIELD row owned by ${row}`)
        if (!leafOf(id) || !leafOf(id).endsWith(ending)) throw new HaltError('H1', `objectGeometry.${key} ${id} does not sit at a leaf ending ${JSON.stringify(ending)}`)
        return id
    }
    const kindRow = owned('kindRow', '')
    const alongRow = owned('alongRow', '.along')
    const acrossRow = owned('acrossRow', '.across')
    const facingRow = owned('facingRow', '')
    const attribute = rows.get(kindRow)?.selectorAttribute
    const kinds = attribute ? vocabularies.get(`${kindRow}.${attribute}`) : undefined
    if (!kinds || !kinds.length) throw new HaltError('H1', `objectGeometry.kindRow ${kindRow} carries no selector attribute with a vocabulary`)
    const dims = block.extentDimensions
    if (!dims || dims.basis !== 'OUR_INTERPRETATION' || typeof dims.note !== 'string' || !dims.note.trim()) throw new HaltError('H1', 'objectGeometry.extentDimensions must say it is OUR_INTERPRETATION and why (note)')
    const extentDimensions = new Map<string, number>()
    for (const [kind, value] of Object.entries((dims.kinds ?? {}) as Record<string, unknown>)) {
        if (!kinds.includes(kind)) throw new HaltError('H1', `objectGeometry.extentDimensions: ${kind} is not a member of the ${kindRow} vocabulary`)
        if (value !== 1 && value !== 2) throw new HaltError('H1', `objectGeometry.extentDimensions: ${kind} gives extent in ${JSON.stringify(value)} dimensions, which is neither 1 nor 2`)
        extentDimensions.set(kind, value)
    }
    return { row, kindRow, alongRow, acrossRow, kindLeaf: leafOf(kindRow), alongLeaf: leafOf(alongRow), acrossLeaf: leafOf(acrossRow), facingRow, facingLeaf: leafOf(facingRow), extentDimensions }
}

/**
 * **Which objects a session states its availability of** — register version 19, 23 October 2026 (stage E). Christian, reply filed 25 October
 * 2026, item 4: *"Please add the general ability to represent goal availability as a session resource and use authorized knowledge
 * relationships when determining which scoring configuration can be selected."* *"A [specialized performer] being available must not
 * automatically force a [specialized performer] or [object] into an activity that does not require one."* (His nouns are bracketed: the
 * coupling ratchet keeps a sport's nouns out of this layer; the register quotes him whole.) Read by the session envelope (which kinds a
 * statement may name), the availability rule (`realization/assemble-concrete-game.ts` objectAvailabilityRefusal: which objects of the game a
 * statement must cover) and the realizer (an object's width as the session states it); no kind, row or leaf is written in any of them.
 */
export interface SessionResourcesRegister {
    /** The objects collection (O1), where the game holds its objects, and its path. */
    row: string
    path: string
    /** The selector attribute an object element is told apart by (its kind), and the leaf it sits at on an element. */
    attribute: string
    kindLeaf: string
    /** The field counting an element's objects (O3), and its leaf: an element holds as many objects as it says, one where it says none. */
    countRow: string
    countLeaf: string
    /** The object kinds a session states its availability of, in the register's order; each a member of the kind vocabulary. */
    kinds: string[]
    /**
     * **What else a session may state of its objects of a kind** — register version 22, 23 October 2026 (H4, the d26 design's build step 4,
     * its S1). Christian, reply filed 26 October 2026, item 4: *"I agree that the coach should identify the available [object] type and
     * dimensions, without the engine inventing them."* (His noun bracketed for the coupling ratchet; the register quotes him whole.) Each
     * entry: a listed kind, the attribute's name (the key a statement carries it under, beside `count` and `widthM`) and its closed list of
     * values, each quoting the words it is taken from (validated here, never read by a consumer). Empty for a register without them (one
     * written before version 22): no attribute is read or asked for. Read by the session envelope (a stated value must be on the list) and by
     * the bound-region check (a pairing recording an attribute matches only an object the session states with that value, and the build asks
     * for it where it does and the session states none); nothing names an attribute or a value.
     */
    attributes: SessionResourceAttribute[]
}

/** One attribute a session may state of its objects of a kind (register version 22): its name and its closed list of values. */
export interface SessionResourceAttribute {
    kind: string
    attribute: string
    values: string[]
}

/** The keys a statement of objects already carries (`StatedObjects`): no attribute may take one of them. */
const STATED_OBJECT_KEYS = ['count', 'widthM']

/**
 * The attributes a session may state of its objects (register version 22), validated as the rest of the block is (halt H1): each names a kind
 * the block lists and an attribute name no statement already carries, each kind and attribute once, and a closed list of values, each once,
 * each quoting words that contain it (`valueSources`: the words and where they are from), and no source for a value the list does not hold.
 */
function indexSessionResourceAttributes(entries: unknown, kinds: string[]): SessionResourceAttribute[] {
    if (entries === undefined) return []
    if (!Array.isArray(entries)) throw new HaltError('H1', 'sessionResources.attributes must be a list')
    const seen = new Set<string>()
    return entries.map((entry: any, i: number) => {
        const which = `sessionResources.attributes[${i}]`
        if (!entry || typeof entry !== 'object') throw new HaltError('H1', `${which} is not an object`)
        const kind = String(entry.kind ?? '')
        const attribute = String(entry.attribute ?? '')
        if (!kinds.includes(kind)) throw new HaltError('H1', `${which} names the kind ${JSON.stringify(entry.kind)}, which sessionResources.kinds does not list`)
        if (!attribute.trim() || STATED_OBJECT_KEYS.includes(attribute)) throw new HaltError('H1', `${which} must name an attribute other than ${STATED_OBJECT_KEYS.join(' and ')}`)
        if (seen.has(`${kind}|${attribute}`)) throw new HaltError('H1', `${which}: the attribute ${attribute} of ${kind} is listed twice`)
        seen.add(`${kind}|${attribute}`)
        if (typeof entry.note !== 'string' || !entry.note.trim()) throw new HaltError('H1', `${which} must say what it is and why (note)`)
        const values: string[] = Array.isArray(entry.values) ? entry.values.map(String) : []
        if (!values.length || new Set(values).size !== values.length || values.some(value => !value.trim())) throw new HaltError('H1', `${which} must list at least one value, each once`)
        const sources = entry.valueSources && typeof entry.valueSources === 'object' && !Array.isArray(entry.valueSources) ? (entry.valueSources as Record<string, any>) : {}
        for (const value of values) {
            const source = Object.prototype.hasOwnProperty.call(sources, value) ? sources[value] : undefined
            const words = typeof source?.words === 'string' ? source.words : ''
            if (!words.trim() || typeof source?.citedAs !== 'string' || !source.citedAs.trim()) throw new HaltError('H1', `${which}: the value ${value} must quote the words it is taken from and say where (valueSources.${value}: words, citedAs)`)
            if (!words.toLowerCase().includes(value.toLowerCase())) throw new HaltError('H1', `${which}: the value ${value} is not in the words it quotes`)
        }
        for (const value of Object.keys(sources)) if (!values.includes(value)) throw new HaltError('H1', `${which}: valueSources names ${value}, which the list does not hold`)
        return { kind, attribute, values }
    })
}

/**
 * The session-resources block, validated as the rest of the register is (halt H1): its row must be a COLLECTION carrying the attribute as a
 * selector attribute, the attribute read by a FIELD row of that collection with a vocabulary, every kind a member of that vocabulary (listed
 * once), and the count row a FIELD of the collection. A register without the block (one written before version 19) has no session resource:
 * no statement of objects is read, and no game is asked to be covered.
 */
function indexSessionResources(block: any, rows: Map<string, RegisterRow>, vocabularies: Map<string, string[]>): SessionResourcesRegister | null {
    if (!block || typeof block !== 'object') return null
    if (typeof block.note !== 'string' || !block.note.trim()) throw new HaltError('H1', 'sessionResources must say what it is and why (note)')
    const row = String(block.row ?? '')
    const collection = rows.get(row)
    if (collection?.kind !== 'COLLECTION') throw new HaltError('H1', `sessionResources.row ${row} is not a COLLECTION row`)
    const attribute = String(block.attribute ?? '')
    if (!(collection.selectorAttributes ?? []).includes(attribute)) throw new HaltError('H1', `sessionResources.attribute ${attribute} is not a selector attribute of ${row}`)
    const container = String(collection.path)
    const leafOf = (id: string) => {
        const path = String(rows.get(id)?.path ?? '')
        return path.startsWith(`${container}.`) ? path.slice(container.length + 1) : ''
    }
    const attributeRow = [...rows.values()].find(candidate => candidate.kind === 'FIELD' && candidate.ownerRow === row && candidate.selectorAttribute === attribute)
    const vocabulary = attributeRow ? vocabularies.get(`${attributeRow.id}.${attribute}`) : undefined
    if (!attributeRow || !vocabulary || !vocabulary.length || !leafOf(attributeRow.id)) throw new HaltError('H1', `sessionResources.attribute ${attribute} is read by no FIELD row of ${row} with a vocabulary`)
    const countRow = String(block.countRow ?? '')
    if (rows.get(countRow)?.kind !== 'FIELD' || rows.get(countRow)?.ownerRow !== row || !leafOf(countRow)) throw new HaltError('H1', `sessionResources.countRow ${countRow} is not a FIELD row owned by ${row}`)
    const kinds: string[] = Array.isArray(block.kinds) ? block.kinds.map(String) : []
    if (!kinds.length || new Set(kinds).size !== kinds.length) throw new HaltError('H1', 'sessionResources.kinds must list at least one kind, each once')
    for (const kind of kinds) if (!vocabulary.includes(kind)) throw new HaltError('H1', `sessionResources.kinds: ${kind} is not a member of the ${attributeRow.id}.${attribute} vocabulary`)
    return { row, path: container, attribute, kindLeaf: leafOf(attributeRow.id), countRow, countLeaf: leafOf(countRow), kinds, attributes: indexSessionResourceAttributes(block.attributes, kinds) }
}

/**
 * **Where the bound-region capability finds its rows** — register version 21, 23 October 2026 (H3, the d26 design's build step 3, its N1,
 * N2 and N5). Christian, reply filed 26 October 2026, item 7: *"Please investigate the smallest reusable method for representing an
 * authorized [handling area], including its geometry and relationship to the [object] and playing space. Do not assume a scaled dimension
 * without knowledge support."* *"This should be a general [sport] environment capability rather than a [Learning Goal] exception."* (His
 * nouns bracketed: the coupling ratchet keeps a sport's nouns out of this layer; the register quotes him whole.) Read by the bound-region
 * check (`realization/bound-region-check.ts`, GA-BOUND-REGION), the default-laws account (`realization/default-laws-check.ts`), the Sport
 * Profile's loader (`corpus.ts` loadSportBoundRegions) and the renderer (which says no sentence for a bound region yet); no row, leaf,
 * function or kind is written in any of them.
 */
export interface BoundRegionRegister {
    /** The regions collection (S2) and its path; the noun (S3), function (S4), along (S5), across (S6) and bound-object (S7) rows. */
    row: string
    path: string
    nounRow: string
    functionRow: string
    alongRow: string
    acrossRow: string
    ofObjectRow: string
    /** The objects collection a region is bound to (O1), and its path. */
    objectRow: string
    objectPath: string
    /** The leaves on a region element: its noun, functions, along and across positions, and binding; the selector attribute naming its functions. */
    nounLeaf: string
    functionLeaf: string
    alongLeaf: string
    acrossLeaf: string
    ofObjectLeaf: string
    functionAttribute: string
    /** The closed lists a bound region's noun and function are members of (S3's and S4's vocabularies), in the register's order. */
    nouns: string[]
    functions: string[]
}

/**
 * The bound-region block, validated as the rest of the register is (halt H1): its row a COLLECTION; the noun, function, along, across and
 * bound-object rows FIELD rows it owns, at the leaves their roles need (the along and across positions ending .along and .across); the noun
 * and function rows carrying a selector attribute with a vocabulary; the object row a COLLECTION, the objects collection the object-geometry
 * block names where the register has one. A register without the block (one written before version 21) has none: no region is bound to an
 * object, the check has nothing to read, and the default-laws predicates naming a bound region read it absent.
 */
function indexBoundRegions(block: any, rows: Map<string, RegisterRow>, vocabularies: Map<string, string[]>, objectGeometry: ObjectGeometryRegister | null): BoundRegionRegister | null {
    if (!block || typeof block !== 'object') return null
    if (typeof block.note !== 'string' || !block.note.trim()) throw new HaltError('H1', 'boundRegions must say what it is and why (note)')
    const name = (key: string) => String(block[key] ?? '')
    const row = name('row')
    const collection = rows.get(row)
    if (collection?.kind !== 'COLLECTION') throw new HaltError('H1', `boundRegions.row ${row} is not a COLLECTION row`)
    const container = String(collection.path)
    const leafOf = (id: string) => {
        const path = String(rows.get(id)?.path ?? '')
        return path.startsWith(`${container}.`) ? path.slice(container.length + 1) : ''
    }
    const owned = (key: string, ending: string): string => {
        const id = name(key)
        if (rows.get(id)?.kind !== 'FIELD' || rows.get(id)?.ownerRow !== row) throw new HaltError('H1', `boundRegions.${key} ${id} is not a FIELD row owned by ${row}`)
        if (!leafOf(id) || !leafOf(id).endsWith(ending)) throw new HaltError('H1', `boundRegions.${key} ${id} does not sit at a leaf ending ${JSON.stringify(ending)}`)
        return id
    }
    const nounRow = owned('nounRow', '')
    const functionRow = owned('functionRow', '')
    const alongRow = owned('alongRow', '.along')
    const acrossRow = owned('acrossRow', '.across')
    const ofObjectRow = owned('ofObjectRow', '')
    const vocabularyOf = (id: string): { attribute: string; members: string[] } => {
        const attribute = rows.get(id)?.selectorAttribute
        const members = attribute ? vocabularies.get(`${id}.${attribute}`) : undefined
        if (!attribute || !members || !members.length) throw new HaltError('H1', `boundRegions: ${id} carries no selector attribute with a vocabulary`)
        return { attribute, members: [...members] }
    }
    const nouns = vocabularyOf(nounRow)
    const functions = vocabularyOf(functionRow)
    const objectRow = name('objectRow')
    const objects = rows.get(objectRow)
    if (objects?.kind !== 'COLLECTION') throw new HaltError('H1', `boundRegions.objectRow ${objectRow} is not a COLLECTION row`)
    if (objectGeometry && objectGeometry.row !== objectRow) throw new HaltError('H1', `boundRegions.objectRow ${objectRow} is not the objects collection the object-geometry block names (${objectGeometry.row})`)
    return {
        row,
        path: container,
        nounRow,
        functionRow,
        alongRow,
        acrossRow,
        ofObjectRow,
        objectRow,
        objectPath: String(objects.path),
        nounLeaf: leafOf(nounRow),
        functionLeaf: leafOf(functionRow),
        alongLeaf: leafOf(alongRow),
        acrossLeaf: leafOf(acrossRow),
        ofObjectLeaf: leafOf(ofObjectRow),
        functionAttribute: functions.attribute,
        nouns: nouns.members,
        functions: functions.members,
    }
}

/**
 * **A machine-readable relative term the engine composes, validated at load (halt H1)** — register version 17, 23 October 2026, for RC-21's
 * `central` (kind `centred`). A centred term fixes the element's centre on one axis (`at` 0.5 of it) and states no extent; where its extent may
 * come from is a closed list the realizer implements (`CENTRED_EXTENT_SOURCES`). Any other kind is read as it always was.
 */
export const CENTRED_EXTENT_SOURCES = ['REQUIRED_EXTENT', 'SESSION_STATED_WIDTH'] as const

function validateRelativeTerms(block: any): void {
    const terms = block?.machineReadable?.terms
    if (!terms || typeof terms !== 'object') return
    for (const [name, term] of Object.entries(terms as Record<string, any>)) {
        if (term?.kind !== 'centred') continue
        if (term.axis !== 'across' && term.axis !== 'along') throw new HaltError('H1', `relativeTerms ${name}: a centred term names its axis (along or across)`)
        if (term.at !== 0.5) throw new HaltError('H1', `relativeTerms ${name}: a centred term is at the midline of its axis (at 0.5)`)
        const from = Array.isArray(term.extentFrom) ? term.extentFrom : []
        if (!from.length || from.some((source: unknown) => !(CENTRED_EXTENT_SOURCES as readonly unknown[]).includes(source))) throw new HaltError('H1', `relativeTerms ${name}: a centred term says where its extent comes from, from ${CENTRED_EXTENT_SOURCES.join(', ')}`)
        if (typeof term.why !== 'string' || !term.why.trim()) throw new HaltError('H1', `relativeTerms ${name}: a centred term says why (its prose test)`)
    }
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
    /**
     * **How the team picked out at a transition relates to the team a qualifier of that transition names** — register version
     * 14, 17 October 2026, for his reply filed 19 October 2026, item 1: *"Please ensure the underlying scoring eligibility
     * reflects this distinction, rather than relying solely on the coach-facing wording."* `qualifier` is a designation-valued
     * selector attribute of the transitions row; `relation` SAME or OTHER (OTHER determinate only with exactly two teams). It
     * carries his words and where he said them, because a relation that decides a gate clause may not be a reading of ours (the
     * `followsPossessionRelation` precedent). Read only by `designation.ts` `awardeeRelation`.
     */
    relativeTo?: { qualifier: string; relation: 'SAME' | 'OTHER'; words: string; citedAs: string }
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

/**
 * **Where the end-exchange capability finds its row** — register version 18, 23 October 2026 (stage D), for his reply filed 25 October
 * 2026, item 5: *"Team-end assignments may change between coach-controlled blocks when the authorized activity configuration requires
 * it."* *"Please keep the following concepts separate in the general representation: Team identity. Assigned game role. Assigned field
 * end. Participant membership and reassignment."* Read by `derivation/role-blocks.ts` (`endAssignmentOf`), `realization/realize.ts`, the
 * cross-block checks and fidelity Q6 (`rendering/role-blocks.ts`) and the renderer; no row, value or designation is written there.
 */
export interface EndAssignmentRegister {
    /** The game-level FIELD row saying whether the teams change ends at a coach-called block (`blocks.endAssignment`). */
    row: string
    /** Its path in a game. */
    path: string
    /** The closed list, in the register's order. */
    values: string[]
    /** The value a game no item writes the row for is played as: each team keeps its end. */
    kept: string
    /** The value under which the second block keeps the first block's holders and exchanges which team holds each end. */
    exchanged: string
    /** The two end-assigned designations (SETUP_ASSIGNMENT) whose teams change ends, as the list spells them. */
    ends: string[]
}

/**
 * The end-assignment block, validated as the rest of the register is (halt H1): its row must be a game-level FIELD row (never a field of
 * the role collection: his item 5 keeps role and end apart), its vocabulary exactly its two values, and its ends exactly two
 * SETUP_ASSIGNMENT designations of the list. A register without the block (one written before version 18) has no end exchange, and every
 * game keeps its ends. It needs the role-block capability: the ends change only at a coach-called block, and blocks exist only where the
 * roles exchange.
 */
function indexEndAssignment(block: any, rows: Map<string, RegisterRow>, vocabularies: Map<string, string[]>, roleBlocks: RoleBlockRegister | null, designations: DesignationRegister): EndAssignmentRegister | null {
    if (!block || typeof block !== 'object') return null
    if (!roleBlocks) throw new HaltError('H1', 'endAssignment: the ends change only at a coach-called block, and the register has no roleBlocks block')
    const row = String(block.row ?? '')
    const entry = rows.get(row)
    if (entry?.kind !== 'FIELD' || entry.ownerRow) throw new HaltError('H1', `endAssignment.row ${row} is not a game-level FIELD row (the end assignment is never a field of a collection)`)
    if (row === roleBlocks.exchangeRow || entry.ownerRow === roleBlocks.rolesRow) throw new HaltError('H1', `endAssignment.row ${row} is a field of the role collection`)
    const values = vocabularies.get(String(block.vocabulary ?? ''))
    if (!values || values.length !== 2) throw new HaltError('H1', `endAssignment.vocabulary ${block.vocabulary} must be a vocabulary of exactly two values`)
    const [kept, exchanged] = [String(block.kept ?? ''), String(block.exchanged ?? '')]
    if (!values.includes(kept) || !values.includes(exchanged) || kept === exchanged) throw new HaltError('H1', `endAssignment: kept (${kept}) and exchanged (${exchanged}) must be the two different members of ${block.vocabulary}`)
    const ends: string[] = Array.isArray(block.ends) ? block.ends.map(String) : []
    if (ends.length !== 2 || new Set(ends).size !== 2 || ends.some(end => designations.resolutions.get(end)?.kind !== 'SETUP_ASSIGNMENT')) {
        throw new HaltError('H1', `endAssignment.ends ${JSON.stringify(block.ends ?? null)} must be two different SETUP_ASSIGNMENT designations of the list`)
    }
    return { row, path: String(entry.path), values: [...values], kept, exchanged, ends }
}

/**
 * **Which participant a value names, where it is not a specialized role — register version 15, 22 October 2026.** Christian,
 * reply filed 25 October 2026, item 6: *"Any participant or role required by an activity must actually be present in the
 * authorized configuration."* *"This safeguard should not depend on particular wording or on the current realization's existing
 * [specialized-role]-count restriction."* *"The same principle should apply to other required participants or specialized roles."*
 * (His role noun is bracketed: the coupling ratchet keeps a sport's nouns out of this layer.)
 *
 * A form types one value the knowledge already writes, matched whole. The kinds are the closed list the engine implements
 * (`PARTICIPANT_FORM_KINDS`): no performer at all, any performer of the team a transition is awarded to, or the performers a
 * game-level count row counts. Read by `derivation/participants.ts` alone; no participant is named in code.
 */
export const PARTICIPANT_FORM_KINDS = ['NOT_A_PERFORMER', 'PERFORMER_OF_AWARDED_TEAM', 'COUNTED_GROUP'] as const
export type ParticipantFormKind = (typeof PARTICIPANT_FORM_KINDS)[number]

export interface ParticipantForm {
    value: string
    kind: ParticipantFormKind
    /** COUNTED_GROUP only: the game-level FIELD row counting the group's performers. */
    countRow: string | null
    /** DRAFT coach noun, or null where the form names nobody a coach places (COACH). */
    coachNoun: string | null
}

export interface ParticipantRegister {
    forms: ParticipantForm[]
}

/**
 * The participants block, validated as the rest of the register is (halt H1): a form whose value is empty or repeated, whose kind
 * the engine does not implement, whose count row is not a game-level field, or whose value is also a specialized role's name or a
 * registered designation would let one value name two participants, or a participant the engine cannot check. A register without
 * the block (one written before version 15) types no form, and only the specialized roles resolve.
 */
function indexParticipants(block: any, rows: Map<string, RegisterRow>, designations: DesignationRegister): ParticipantRegister | null {
    if (!block || typeof block !== 'object') return null
    if (!Array.isArray(block.forms)) throw new HaltError('H1', 'participants.forms is not a list')
    const roleNames = new Set([...rows.values()].filter(row => (row as { specializedRole?: boolean }).specializedRole).map(row => String(row.path).split('.').pop()))
    const forms: ParticipantForm[] = []
    for (const raw of block.forms) {
        const value = typeof raw?.value === 'string' ? raw.value : ''
        if (!value.trim() || value !== value.trim()) throw new HaltError('H1', `participants: a form has no value, or one with surrounding spaces (${JSON.stringify(raw?.value)})`)
        if (forms.some(form => form.value === value)) throw new HaltError('H1', `participants: the form ${value} is listed twice`)
        if (!(PARTICIPANT_FORM_KINDS as readonly string[]).includes(String(raw?.kind))) throw new HaltError('H1', `participants: the form ${value} has the kind ${raw?.kind}, which the engine does not implement`)
        if (roleNames.has(value)) throw new HaltError('H1', `participants: the form ${value} is also the name of a specialized role`)
        if (designations.resolutions.has(value) || designations.resolutions.has(designationName(value))) throw new HaltError('H1', `participants: the form ${value} is also a registered team designation`)
        const kind = raw.kind as ParticipantFormKind
        let countRow: string | null = null
        if (kind === 'COUNTED_GROUP') {
            countRow = String(raw?.countRow ?? '')
            const row = rows.get(countRow)
            if (!row || row.kind !== 'FIELD' || row.ownerRow) throw new HaltError('H1', `participants: the form ${value} counts by ${raw?.countRow}, which is not a game-level FIELD row`)
        } else if (raw?.countRow !== undefined) {
            throw new HaltError('H1', `participants: the form ${value} is ${kind} and names a count row, which only a COUNTED_GROUP has`)
        }
        if (typeof raw?.gloss !== 'string' || !raw.gloss.trim() || typeof raw?.from !== 'string' || !raw.from.trim()) throw new HaltError('H1', `participants: the form ${value} does not say what it is and where it comes from (gloss, from)`)
        if (raw.coachNoun !== null && (typeof raw.coachNoun !== 'string' || !raw.coachNoun.trim())) throw new HaltError('H1', `participants: the form ${value} has a coachNoun that is neither a noun nor null`)
        forms.push({ value, kind, countRow, coachNoun: raw.coachNoun === null ? null : String(raw.coachNoun) })
    }
    return { forms }
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
    /** The end-exchange capability's row (register version 18, his reply filed 25 October 2026, item 5), or null without it. */
    endAssignment: EndAssignmentRegister | null
    /** The participant forms beside the specialized roles (register version 15, his reply filed 25 October 2026, item 6), or null without them. */
    participants: ParticipantRegister | null
    /** The role-scoring capability's rows (register version 16, his reply filed 25 October 2026, item 2), or null without them. */
    roleScoring: RoleScoringRegister | null
    /** The object-geometry capability's rows (register version 17, his reply filed 25 October 2026, item 3), or null without them. */
    objectGeometry: ObjectGeometryRegister | null
    /** The objects a session states its availability of (register version 19, his reply filed 25 October 2026, item 4), or null without them. */
    sessionResources: SessionResourcesRegister | null
    /** The bound-region capability's rows (register version 21, his reply filed 26 October 2026, item 7), or null without them. */
    boundRegions: BoundRegionRegister | null
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
    /**
     * **A relation to a qualifier, validated as the rest is (register version 14, 17 October 2026).** The qualifier must be a
     * designation-valued attribute the register lists, the relation one of the two, and the relation must quote him with where he
     * said it: a relation that is our reading would let our reading decide a gate clause.
     */
    for (const [name, raw] of Object.entries(block.resolutions as Record<string, any>)) {
        const relative = raw?.relativeTo
        if (relative === undefined) continue
        const qualifier = String(relative?.qualifier ?? '')
        if (!attributes.some((entry: { row: string; attribute: string }) => entry.attribute === qualifier)) throw new HaltError('H1', `designation ${name}: relativeTo names ${qualifier}, which is not a designation-valued attribute`)
        if (relative.relation !== 'SAME' && relative.relation !== 'OTHER') throw new HaltError('H1', `designation ${name}: relativeTo relation must be SAME or OTHER`)
        if (typeof relative.words !== 'string' || !relative.words.trim() || typeof relative.citedAs !== 'string' || !relative.citedAs.trim()) throw new HaltError('H1', `designation ${name}: relativeTo must quote his words and say where (words, citedAs)`)
        resolutions.get(name)!.relativeTo = { qualifier, relation: relative.relation, words: relative.words, citedAs: relative.citedAs }
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

    // Register version 14: a collection whose elements earn another row's value holds no value of its own (`earnsValueOf`).
    const leafOf = (path: string) => String(path).split('.').pop() ?? ''
    for (const row of rows.values()) {
        if (row.earnsValueOf === undefined) continue
        const earned = rows.get(String(row.earnsValueOf))
        if (!earned || earned.kind !== 'FIELD') throw new HaltError('H1', `earnsValueOf on ${row.id} names ${row.earnsValueOf}, which is not a FIELD row`)
        if (row.kind === 'COLLECTION') {
            for (const [rowId, owner] of ownerRow) {
                if (owner === row.id && leafOf(rows.get(rowId)!.path) === leafOf(earned.path)) throw new HaltError('H1', `${rowId} gives ${row.id} a value of its own, and its elements earn ${earned.id}'s (earnsValueOf)`)
            }
            continue
        }
        /**
         * **A FIELD row owned by a collection may earn another row's value** (register version 16, 22 October 2026: B9, a role's own
         * scoring event, earns V2). The compensating checks: the row must be a member property (a game-level field earns nothing for
         * anyone in particular), the earned row a game-level field, and no field its owning collection holds may sit at the earned row's
         * leaf, so the element can never carry a value of its own beside the one it earns. A VIEW is refused as before.
         */
        if (row.kind !== 'FIELD' || !row.ownerRow) throw new HaltError('H1', `earnsValueOf on ${row.id}, which is neither a COLLECTION row nor a FIELD row owned by one`)
        if (earned.ownerRow) throw new HaltError('H1', `earnsValueOf on ${row.id} names ${earned.id}, which is not a game-level FIELD row`)
        // An element that itself earns a value (V27) holds no field earning one too: one occurrence would earn twice.
        if (rows.get(row.ownerRow)?.earnsValueOf !== undefined) throw new HaltError('H1', `earnsValueOf on ${row.id}, a field of ${row.ownerRow}, whose elements already earn ${rows.get(row.ownerRow)!.earnsValueOf}'s value`)
        for (const [rowId, owner] of ownerRow) {
            if (owner === row.ownerRow && leafOf(rows.get(rowId)!.path) === leafOf(earned.path)) throw new HaltError('H1', `${rowId} gives the elements of ${row.ownerRow} a value of their own, and ${row.id} earns ${earned.id}'s (earnsValueOf)`)
        }
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

    validateRelativeTerms(register.relativeTerms)
    const citable = new Set<string>((register.citableStandingDecisions || []).map((d: any) => d.id).filter(Boolean))
    const designations = indexDesignations(register.teamDesignations, rows)
    const roleBlocks = indexRoleBlocks(register.roleBlocks, rows, vocabularies, designations)
    const objectGeometry = indexObjectGeometry(register.objectGeometry, rows, vocabularies)

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
        endAssignment: indexEndAssignment(register.endAssignment, rows, vocabularies, roleBlocks, designations),
        participants: indexParticipants(register.participants, rows, designations),
        roleScoring: indexRoleScoring(register.roleScoring, rows, vocabularies, roleBlocks),
        objectGeometry,
        sessionResources: indexSessionResources(register.sessionResources, rows, vocabularies),
        boundRegions: indexBoundRegions(register.boundRegions, rows, vocabularies, objectGeometry),
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
