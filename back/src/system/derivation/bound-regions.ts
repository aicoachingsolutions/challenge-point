/**
 * **A region bound to an object, and the authorized pairings its geometry comes from** — H3, 23 October 2026 (the d26 design's build step 3,
 * its N1 to N5; register version 21).
 *
 * Christian, reply filed 26 October 2026, item 7: *"My preference is for standard [sport] [specialized performer] handling rules to apply,
 * using a regulation [handling area] whenever the playing environment can accommodate it appropriately."* *"Use an existing regulation
 * [handling area] when the activity dimensions and setup permit it."* *"When a smaller field is necessary, use an explicitly defined and
 * knowledge-authorized scaled [handling area]."* *"I would not approve an undefined area that the coach simply points out"* *"Please
 * investigate the smallest reusable method for representing an authorized [handling area], including its geometry and relationship to the
 * [object] and playing space. Do not assume a scaled dimension without knowledge support."* *"This should be a general [sport] environment
 * capability rather than a [Learning Goal] exception."* (His nouns are bracketed: the coupling ratchet keeps them out of this layer; the
 * Sport Profile quotes him whole.)
 *
 * **What this module is.** The sport-neutral half of the capability: the shape of the Sport Profile's `boundRegions` block and its
 * validation, and the two readers every consumer shares - which functions a region serves, and which object it is bound to with the pairing
 * it cites. The block says, as data:
 *   - `requirements`: which object kinds need a region of which noun and function bound to them, when the object is defended (the
 *     register's defended-by row, O7). The check (`realization/bound-region-check.ts`, GA-BOUND-REGION) holds every such object to exactly
 *     one such region, and every region of such a function to exactly that relationship;
 *   - `pairings`: the authorized geometry, each entry one named document or ruling giving an object of a kind and size together with its
 *     region (width and depth) and, where it has one, a mark distance - only that geometry is borrowed (`borrows`), never the document's
 *     other provisions. A region's items cite the entry they take their geometry from (the binding's `pairing`), and the check holds the
 *     realized region to that entry. An object no entry pairs with is a knowledge gap, never a reason to borrow another entry's region.
 *
 * Nothing here names an object kind, a function, a noun or a document: they are the profile's and the register's.
 */
import { CitedWords } from './default-laws'
import { RegisterIndex } from './register'
import { structuralRefOf } from './types'

/** One object kind that needs a bound region: of which noun and function, when its object is defended, why (ours) and his words. */
export interface BoundRegionRequirement {
    id: string
    object: { kind: string; whenDefended: true }
    region: { noun: string; function: string }
    cites: string
    because: string
    basis: CitedWords
}

/** What a document says of the format its geometry belongs to: shown with the entry, never read back as "an area gives an object size". */
export interface PairingFormatConditions {
    players: string | null
    ageBand: string | null
    pitch: string | null
}

/**
 * **A figure of a pairing that is PROVISIONAL, with where each source puts it and his words** — P2, 25 October 2026. Christian, reply filed
 * 28 October 2026, item 8: *"Please preserve source traceability and treat the [figure] as provisional until we can verify the authoritative
 * specification."* *"I don't want an uncertain interpretation silently becoming canonical knowledge."* *"However, I wouldn't postpone an initial
 * field test solely while awaiting clarification from [the governing body], provided the provisional dimensions are identified and consistently
 * applied."* (his words bracketed where they name a figure or a body; the Sport Profile quotes him whole). `leaf` names the figure on the pairing
 * (`PAIRING_FIGURE_LEAVES`), `value` is the one value every use reads (equal to the pairing's own), `sources` each document's statement of it
 * with its metres, one of them stating the value applied, `applied` why that value is the one used, and his words. The loader refuses anything
 * else; a figure carrying no entry is as recorded, never marked here by default.
 */
export interface PairingProvisionalFigure {
    leaf: string
    status: 'PROVISIONAL'
    value: number
    sources: { document: string; edition: string | null; citedAs: string; states: string; metres: number }[]
    applied: string
    authority: CitedWords
}

/** One authorized pairing: an object of a kind and size, the region that goes with it, and its mark, from one named document or ruling. */
export interface BoundRegionPairing {
    id: string
    document: string
    edition: string | null
    citedAs: string
    formatConditions: PairingFormatConditions
    object: { kind: string; type: string; widthM: number; heightM: number | null }
    region: { function: string; widthM: number; depthM: number }
    markM: number | null
    /** What comes with the entry: only its geometry (the object, the region, the mark where it has one), never the document's other provisions. */
    borrows: string[]
    authority: CitedWords
    note: string | null
    /** P2: the figures of the entry that are provisional, each with its sources and his words; absent where every figure is as recorded. */
    provisional?: PairingProvisionalFigure[]
}

/** The figures of a pairing, by the leaf that names each (P2): what a provisional entry may name. */
export const PAIRING_FIGURE_LEAVES = ['object.widthM', 'object.heightM', 'region.widthM', 'region.depthM', 'markM'] as const

/** The pairing's own value of one of its figures, or null where it records none (P2). */
export function pairingFigureAt(pairing: unknown, leaf: string): number | null {
    if (!(PAIRING_FIGURE_LEAVES as readonly string[]).includes(leaf) || !pairing || typeof pairing !== 'object') return null
    const value = leaf.split('.').reduce<any>((node, key) => (node === null || node === undefined ? undefined : node[key]), pairing)
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** The provisional entry for one figure of a pairing, or null where that figure is as recorded (P2). */
export function provisionalFigureOf(pairing: unknown, leaf: string): PairingProvisionalFigure | null {
    const entries = pairing && typeof pairing === 'object' ? (pairing as { provisional?: unknown }).provisional : undefined
    return Array.isArray(entries) ? ((entries as PairingProvisionalFigure[]).find(entry => entry?.leaf === leaf) ?? null) : null
}

/** The closed list of statuses a figure of a pairing may carry beside its recorded value (P2). */
export const PAIRING_FIGURE_STATUSES = ['PROVISIONAL'] as const

/** The Sport Profile's bound-region block as derivation receives it. */
export interface SportBoundRegions {
    file: string
    sportId: string
    authority: CitedWords & { by: string; ruledOn: string }
    requirements: BoundRegionRequirement[]
    pairings: BoundRegionPairing[]
}

/** The closed list of what a pairing may borrow: its geometry, and nothing else. */
export const PAIRING_BORROWS = ['object', 'region', 'mark'] as const

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const measured = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

function citedWordsRefusal(value: unknown, what: string): string | null {
    if (!isObject(value)) return `${what} is not an object of his words (words, citedAs)`
    for (const key of Object.keys(value)) if (key !== 'words' && key !== 'citedAs') return `${what} carries "${key}"`
    if (!Array.isArray(value.words) || !value.words.length || !value.words.every(filled)) return `${what} quotes none of his words`
    if (!filled(value.citedAs)) return `${what} does not say where he said them (citedAs)`
    return null
}

const keysRefused = (value: Record<string, unknown>, allowed: string[], which: string): string[] => Object.keys(value).filter(key => !allowed.includes(key)).map(key => `${which} carries "${key}", which no such entry holds`)

/** The object kinds the register's object rows name (the kind row's vocabulary). */
function objectKindsOf(index: RegisterIndex): string[] {
    const geometry = index.objectGeometry
    const attribute = geometry ? index.rows.get(geometry.kindRow)?.selectorAttribute : undefined
    return geometry && attribute ? (index.vocabularies.get(`${geometry.kindRow}.${attribute}`) ?? []) : []
}

/**
 * **Everything wrong with a Sport Profile's bound-region block, as sentences; empty means it may be loaded.** His words with where, who and
 * when; at least one requirement, each naming an object kind of the register's object-kind vocabulary that a session states its availability
 * of (its width is what a pairing is matched by), defended (the register's defended-by row), and a region noun and function of the register's
 * vocabularies, each kind and function once, with what it cites, why and his words; and the pairings, each id once, naming its document,
 * edition (or null) and citation, its format conditions (each stated or null), an object of a required kind with its type and a width (and a
 * height or null), a region of that requirement's function with a width and a depth, a mark or null, exactly the geometry it borrows, and his
 * words. A pairing no requirement reads would be one nothing checks, so it is refused. ANY defect refuses the block whole (the loader).
 */
export function boundRegionsRefusals(block: unknown, index: RegisterIndex): string[] {
    if (!isObject(block)) return ['the bound-region block is not an object']
    const errors: string[] = keysRefused(block, ['authority', 'note', 'requirements', 'pairings'], 'the bound-region block')
    const spec = index.boundRegions
    if (!spec) return [...errors, 'the register names no bound-region rows (boundRegions), so no region can be bound to an object']
    if (block.note !== undefined && block.note !== null && !filled(block.note)) errors.push('the bound-region block carries an empty note')
    const authority = block.authority
    if (!isObject(authority) || !Array.isArray(authority.words) || !authority.words.length || !authority.words.every(filled) || !filled(authority.citedAs) || !filled(authority.by) || !filled(authority.ruledOn)) {
        errors.push('the bound-region authority must quote his words and say where, by whom and when (words, citedAs, by, ruledOn)')
    } else errors.push(...keysRefused(authority, ['words', 'citedAs', 'by', 'ruledOn'], 'the bound-region authority'))
    const kinds = objectKindsOf(index)
    const stated = index.sessionResources?.kinds ?? []
    const requirements: unknown[] = Array.isArray(block.requirements) ? block.requirements : []
    if (!requirements.length) errors.push('the bound-region block lists no requirement (requirements)')
    const required = new Set<string>()
    const ids = new Set<string>()
    for (const [i, requirement] of requirements.entries()) {
        const which = `bound-region requirement ${isObject(requirement) && filled(requirement.id) ? requirement.id : i + 1}`
        if (!isObject(requirement)) {
            errors.push(`${which} is not an object`)
            continue
        }
        errors.push(...keysRefused(requirement, ['id', 'object', 'region', 'cites', 'because', 'basis'], which))
        if (!filled(requirement.id)) errors.push(`${which} has no id`)
        else if (ids.has(requirement.id)) errors.push(`${which} is listed twice`)
        if (filled(requirement.id)) ids.add(requirement.id)
        const object = isObject(requirement.object) ? requirement.object : {}
        const region = isObject(requirement.region) ? requirement.region : {}
        errors.push(...keysRefused(object, ['kind', 'whenDefended'], `${which}: its object`), ...keysRefused(region, ['noun', 'function'], `${which}: its region`))
        if (!kinds.includes(String(object.kind))) errors.push(`${which} names the object kind ${JSON.stringify(object.kind)}, which is no member of the register's object-kind vocabulary`)
        else if (!stated.includes(String(object.kind))) errors.push(`${which} names the object kind ${JSON.stringify(object.kind)}, which no session states its availability of, so no width would match a pairing`)
        if (object.whenDefended !== true) errors.push(`${which} must say its object needs the region when it is defended (whenDefended true), the one form the check reads`)
        else if (!index.roleScoring?.defendedByRow) errors.push(`${which} needs the region when its object is defended, and the register names no defended-by row`)
        if (!spec.nouns.includes(String(region.noun))) errors.push(`${which} names the region noun ${JSON.stringify(region.noun)}, which is no member of ${spec.nounRow}'s vocabulary`)
        if (!spec.functions.includes(String(region.function))) errors.push(`${which} names the region function ${JSON.stringify(region.function)}, which is no member of ${spec.functionRow}'s vocabulary`)
        const key = `${String(object.kind)}|${String(region.function)}`
        if (required.has(key)) errors.push(`${which} binds the function ${String(region.function)} to the kind ${String(object.kind)} a second time`)
        required.add(key)
        if (!filled(requirement.cites) || !filled(requirement.because)) errors.push(`${which} must say what it cites and why (cites, because)`)
        const basis = citedWordsRefusal(requirement.basis, `${which}: its basis`)
        if (basis) errors.push(basis)
    }
    if (!Array.isArray(block.pairings)) return [...errors, 'the bound-region block lists its pairings as something other than a list (an empty list says none is authorized)']
    const pairingIds = new Set<string>()
    for (const [i, pairing] of (block.pairings as unknown[]).entries()) {
        const which = `bound-region pairing ${isObject(pairing) && filled(pairing.id) ? pairing.id : i + 1}`
        if (!isObject(pairing)) {
            errors.push(`${which} is not an object`)
            continue
        }
        errors.push(...keysRefused(pairing, ['id', 'document', 'edition', 'citedAs', 'formatConditions', 'object', 'region', 'markM', 'borrows', 'authority', 'note', 'provisional'], which))
        if (pairing.provisional !== undefined) errors.push(...provisionalFigureRefusals(pairing, which))
        if (!filled(pairing.id)) errors.push(`${which} has no id`)
        else if (pairingIds.has(pairing.id)) errors.push(`${which} is listed twice`)
        if (filled(pairing.id)) pairingIds.add(pairing.id)
        if (!filled(pairing.document) || !filled(pairing.citedAs)) errors.push(`${which} must name its document and where in it (document, citedAs)`)
        if (pairing.edition !== null && !filled(pairing.edition)) errors.push(`${which} names no edition, and does not say none is named (edition null)`)
        const conditions = pairing.formatConditions
        if (!isObject(conditions) || Object.keys(conditions).sort().join() !== 'ageBand,pitch,players' || !Object.values(conditions).every(value => value === null || filled(value))) {
            errors.push(`${which} must state its format conditions (players, ageBand, pitch), each in words or null`)
        }
        const object = isObject(pairing.object) ? pairing.object : {}
        const region = isObject(pairing.region) ? pairing.region : {}
        errors.push(...keysRefused(object, ['kind', 'type', 'widthM', 'heightM'], `${which}: its object`), ...keysRefused(region, ['function', 'widthM', 'depthM'], `${which}: its region`))
        if (!kinds.includes(String(object.kind))) errors.push(`${which} pairs the object kind ${JSON.stringify(object.kind)}, which is no member of the register's object-kind vocabulary`)
        if (!filled(object.type) || !measured(object.widthM) || !(object.heightM === null || measured(object.heightM))) errors.push(`${which} must state its object's type and width in metres, and its height in metres or null`)
        // H4 (register version 22): a value it records for an attribute a session may state of its kind is one of that attribute's values,
        // since the check matches it to the session's statement by equality; a value off the list would match no session, silently.
        for (const { attribute, values } of (index.sessionResources?.attributes ?? []).filter(entry => entry.kind === String(object.kind))) {
            if (object[attribute] !== undefined && !values.includes(String(object[attribute]))) errors.push(`${which} records the ${attribute} ${JSON.stringify(object[attribute])} for its object, which is none of the values a session may state (${values.join(', ')})`)
        }
        if (!spec.functions.includes(String(region.function))) errors.push(`${which} pairs the region function ${JSON.stringify(region.function)}, which is no member of ${spec.functionRow}'s vocabulary`)
        if (!measured(region.widthM) || !measured(region.depthM)) errors.push(`${which} must state its region's width and depth in metres`)
        if (!required.has(`${String(object.kind)}|${String(region.function)}`)) errors.push(`${which} pairs the kind ${String(object.kind)} with the function ${String(region.function)}, which no requirement binds, so nothing would read it`)
        if (!(pairing.markM === null || measured(pairing.markM))) errors.push(`${which} must state its mark in metres or null`)
        const borrows = Array.isArray(pairing.borrows) ? pairing.borrows.map(String) : []
        const expected = ['object', 'region', ...(pairing.markM === null ? [] : ['mark'])]
        if (new Set(borrows).size !== borrows.length || borrows.some(entry => !(PAIRING_BORROWS as readonly string[]).includes(entry)) || [...borrows].sort().join() !== [...expected].sort().join()) {
            errors.push(`${which} must borrow exactly its geometry (${expected.join(', ')}), none of it twice and nothing else`)
        }
        const words = citedWordsRefusal(pairing.authority, `${which}: its authority`)
        if (words) errors.push(words)
        if (pairing.note !== undefined && pairing.note !== null && !filled(pairing.note)) errors.push(`${which} carries an empty note`)
    }
    return errors
}

/**
 * **Everything wrong with a pairing's provisional figures, as sentences** (P2, 25 October 2026; his reply filed 28 October 2026, item 8, quoted
 * on `PairingProvisionalFigure`). A list (an absent key says every figure is as recorded; an empty list is refused, as saying nothing); each
 * entry names a figure of the pairing (`PAIRING_FIGURE_LEAVES`) the pairing records, once, a status of the closed list, the value every use
 * reads, equal to the pairing's own (one value), at least two sources (a figure in doubt has more than one statement of it), each naming its
 * document, its edition or null, where in it, what it states and that in metres, one of them stating the value applied, why that value is the
 * one used, and his words. A value differing from the pairing's own would be two values for one figure, so it is refused.
 */
function provisionalFigureRefusals(pairing: Record<string, unknown>, which: string): string[] {
    const errors: string[] = []
    if (!Array.isArray(pairing.provisional) || !pairing.provisional.length) return [`${which} lists its provisional figures as something other than a non-empty list`]
    const leaves = new Set<string>()
    for (const [i, entry] of (pairing.provisional as unknown[]).entries()) {
        const at = `${which}: provisional figure ${i + 1}`
        if (!isObject(entry)) {
            errors.push(`${at} is not an object`)
            continue
        }
        errors.push(...keysRefused(entry, ['leaf', 'status', 'value', 'sources', 'applied', 'authority'], at))
        const leaf = String(entry.leaf)
        const recorded = pairingFigureAt(pairing, leaf)
        if (!(PAIRING_FIGURE_LEAVES as readonly string[]).includes(leaf)) errors.push(`${at} names ${JSON.stringify(entry.leaf)}, which is no figure of a pairing (${PAIRING_FIGURE_LEAVES.join(', ')})`)
        else if (recorded === null) errors.push(`${at} names ${leaf}, which the pairing records no value for`)
        if (leaves.has(leaf)) errors.push(`${at} names ${leaf} a second time`)
        leaves.add(leaf)
        if (!(PAIRING_FIGURE_STATUSES as readonly string[]).includes(String(entry.status))) errors.push(`${at} carries the status ${JSON.stringify(entry.status)}, which is none of ${PAIRING_FIGURE_STATUSES.join(', ')}`)
        if (!measured(entry.value)) errors.push(`${at} states no value in metres`)
        else if (recorded !== null && entry.value !== recorded) errors.push(`${at} states ${entry.value} for ${leaf}, and the pairing records ${recorded}: one figure has one value`)
        const sources: unknown[] = Array.isArray(entry.sources) ? entry.sources : []
        if (sources.length < 2) errors.push(`${at} lists fewer than two sources, so nothing records why the figure is in doubt`)
        for (const [j, source] of sources.entries()) {
            const where = `${at}, source ${j + 1}`
            if (!isObject(source)) {
                errors.push(`${where} is not an object`)
                continue
            }
            errors.push(...keysRefused(source, ['document', 'edition', 'citedAs', 'states', 'metres'], where))
            if (!filled(source.document) || !filled(source.citedAs) || !filled(source.states)) errors.push(`${where} must name its document, where in it, and what it states (document, citedAs, states)`)
            if (source.edition !== null && !filled(source.edition)) errors.push(`${where} names no edition, and does not say none is named (edition null)`)
            if (!measured(source.metres)) errors.push(`${where} does not give what it states in metres`)
        }
        if (measured(entry.value) && !sources.some(source => isObject(source) && source.metres === entry.value)) errors.push(`${at} applies ${String(entry.value)}, which none of its sources states`)
        if (!filled(entry.applied)) errors.push(`${at} does not say why its value is the one applied (applied)`)
        const words = citedWordsRefusal(entry.authority, `${at}: its authority`)
        if (words) errors.push(words)
    }
    return errors
}

/** The region functions a region serves: its selector's terms on the function attribute, and the function leaf where the game holds one. */
export function regionFunctionsOf(region: unknown, index: RegisterIndex): string[] {
    const spec = index.boundRegions
    if (!spec || !isObject(region)) return []
    const fromSelector = (Array.isArray(region.selector) ? region.selector : [])
        .filter((term: any) => term?.attribute === spec.functionAttribute && (term?.op === 'CONTAINS' || term?.op === '='))
        .map((term: any) => String(term.value))
    const leaf = region[spec.functionLeaf]
    const fromLeaf = Array.isArray(leaf) ? leaf.map(String) : typeof leaf === 'string' ? [leaf] : []
    return [...new Set([...fromSelector, ...fromLeaf])]
}

/** The element a typed reference names in a game: the element the item it names established. */
export const elementIdOf = (ref: { contractId: string; itemId: string }): string => `c:${ref.contractId}:${ref.itemId}`

/** The object a region is bound to and the pairing it cites (the bound-object row's value), or null where nothing binds it. */
export function bindingOf(region: unknown, index: RegisterIndex): { objectId: string; pairing: string | null } | null {
    const spec = index.boundRegions
    if (!spec || !isObject(region)) return null
    const value = region[spec.ofObjectLeaf]
    const ref = structuralRefOf(value)
    if (!ref) return null
    const pairing = isObject(value) && filled(value.pairing) ? value.pairing : null
    return { objectId: elementIdOf(ref), pairing }
}
