/**
 * **The playing environment's elements that knowledge components refer to, rather than establish a second time** — B2, 28 October 2026.
 *
 * Christian, his reply filed 30 October 2026, item 6: *"Yes. Attack Development should use one contested ball shared by the context and Game
 * Form."* *"This should be a reusable representation of the actual playing environment, not an additional ball introduced because two
 * knowledge components refer to possession."* Until this the engine kept no count of such an element: each item establishing one became its
 * own element (SD-47), and only a recorded identification for one pair (`realization-choices-rpc-001.json`, `SatisfiedByEstablished`) let the
 * Sport Profile's element stand for a context's own. A composition without such an identification held two, and was refused only at
 * communication, indirectly, because the renderer said the element once (fidelity Q3).
 *
 * So the Sport Profile, the playing environment every activity of its sport runs in, carries a record beside its contribution (`environmentElements`,
 * never items, so no derivation input and no digest changes): each environment element by the profile item that establishes it, what it is,
 * and every knowledge component recorded as referring to it, with how (IDENTIFIED: the component's own item is identified with it by a
 * recorded identification, which stays as it is; REFERS: the component establishes no element of its own and refers to the environment's)
 * and the ruling that authorizes it, in his words. Which components are listed is the record's data: on 28 October 2026 only the two his
 * rulings name. Whether the representation extends to any other component is not decided, and nothing here applies it to one.
 *
 * And a guard (`duplicateEnvironmentElements`), read on every concrete game before communication: an element in the same collection as an
 * environment element, with the same authored selector, is a second such element, and it is refused, named, unless a recorded
 * identification let the environment's element stand for it (which removes it from the game, so nothing is left to refuse). A component
 * whose knowledge means a second such element must say so and be ruled on; no such knowledge exists, and nothing here admits one.
 *
 * Validated beside the profile's own loader, and refused whole on any defect (`environmentElementsRefusals`). Held against the
 * identifications actually recorded (`environmentIdentificationRefusals`, B2 review): a unit test reads every realization-choices file and
 * requires every identification of an environment element to be listed IDENTIFIED, and every IDENTIFIED entry to have one. Names no sport,
 * kind or component: every one is the record's data.
 */
import { knowledgeKey } from './knowledge-key'
import { LoadedContract } from './types'

export const ENVIRONMENT_ELEMENTS_KEY = 'environmentElements'

/** How a component reaches an environment element: identified with it by a recorded identification, or referring to it with no element of its own. */
export const ENVIRONMENT_REFERENCES = ['IDENTIFIED', 'REFERS'] as const
export type EnvironmentReference = (typeof ENVIRONMENT_REFERENCES)[number]

export interface EnvironmentReferral {
    /** The knowledge component (its library id). */
    object: string
    how: EnvironmentReference
    /** Where the reference is recorded. */
    where: string
    /** The ruling that authorizes it: his words, verbatim, and where they are filed. */
    ruling: { words: string[]; citedAs: string }
}

export interface EnvironmentElement {
    /** The profile item that establishes the element. */
    item: string
    what: string
    referredToBy: EnvironmentReferral[]
}

export interface SportEnvironmentElements {
    file: string
    sportId: string
    /** The profile's contract id, so an element's id is `c:<contractId>:<item>` as derivation mints it. */
    contractId: string
    note: string
    elements: EnvironmentElement[]
}

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const closedKeys = (value: Record<string, unknown>, keys: string[], where: string): string[] =>
    Object.keys(value)
        .filter(key => !keys.includes(key))
        .map(key => `${where}: the key ${key} is not one this record holds`)

/** Every defect of the record, named; empty where it is sound. The profile's own items are what an element may name. */
export function environmentElementsRefusals(block: unknown, profileItemIds: string[]): string[] {
    if (!isObject(block)) return ['the record is not an object']
    const errors = closedKeys(block, ['note', 'elements'], 'the record')
    if (!filled(block.note)) errors.push('the record carries no note saying what it is')
    if (!Array.isArray(block.elements) || !block.elements.length) return [...errors, 'the record lists no element']
    const items = new Set<string>()
    block.elements.forEach((element, at) => {
        const where = `element ${at + 1}`
        if (!isObject(element)) return void errors.push(`${where} is not an object`)
        errors.push(...closedKeys(element, ['item', 'what', 'referredToBy'], where))
        if (!filled(element.item) || !profileItemIds.includes(element.item)) errors.push(`${where} names ${JSON.stringify(element.item)}, which is not an item of the profile`)
        else if (items.has(element.item)) errors.push(`${where} names ${element.item} a second time`)
        else items.add(element.item)
        if (!filled(element.what)) errors.push(`${where} does not say what it is`)
        if (!Array.isArray(element.referredToBy) || !element.referredToBy.length) return void errors.push(`${where} lists no component referring to it`)
        const objects = new Set<string>()
        element.referredToBy.forEach((referral, at2) => {
            const at3 = `${where} referral ${at2 + 1}`
            if (!isObject(referral)) return void errors.push(`${at3} is not an object`)
            errors.push(...closedKeys(referral, ['object', 'how', 'where', 'ruling'], at3))
            if (!filled(referral.object)) errors.push(`${at3} names no component`)
            else if (objects.has(referral.object)) errors.push(`${at3} names ${referral.object} a second time`)
            else objects.add(referral.object)
            if (!(ENVIRONMENT_REFERENCES as readonly unknown[]).includes(referral.how)) errors.push(`${at3}: how ${JSON.stringify(referral.how)} is not one of ${ENVIRONMENT_REFERENCES.join(', ')}`)
            if (!filled(referral.where)) errors.push(`${at3} does not say where the reference is recorded`)
            const ruling = referral.ruling
            if (!isObject(ruling)) return void errors.push(`${at3} carries no ruling`)
            errors.push(...closedKeys(ruling, ['words', 'citedAs'], `${at3} ruling`))
            if (!Array.isArray(ruling.words) || !ruling.words.length || !ruling.words.every(filled)) errors.push(`${at3}: the ruling carries no words of his`)
            if (!filled(ruling.citedAs)) errors.push(`${at3}: the ruling does not say where his words are filed`)
        })
    })
    return errors
}

/** The record as loaded, from the profile's raw file and its loaded contract. Throws, naming every defect, where the record is refused. */
export function environmentElementsFrom(raw: any, file: string, profile: LoadedContract): SportEnvironmentElements | null {
    const block = raw?.[ENVIRONMENT_ELEMENTS_KEY]
    if (block === undefined) return null
    const errors = environmentElementsRefusals(block, profile.items.map(item => item.itemId))
    if (errors.length) throw new Error(`the Sport Profile ${file} environment-element record is refused: ${errors.join('; ')}`)
    const copy = JSON.parse(JSON.stringify(block))
    return {
        file,
        sportId: String(raw.sportId),
        contractId: profile.contractId,
        note: String(copy.note),
        elements: (copy.elements as any[]).map(element => ({
            item: String(element.item),
            what: String(element.what),
            referredToBy: (element.referredToBy as any[]).map(referral => ({
                object: String(referral.object),
                how: referral.how as EnvironmentReference,
                where: String(referral.where),
                ruling: { words: (referral.ruling.words as unknown[]).map(String), citedAs: String(referral.ruling.citedAs) },
            })),
        })),
    }
}

/** One recorded identification as a realization-choices file holds it (`satisfiedByEstablished`): the file, the class removed, the element standing for it. */
export interface RecordedIdentification {
    file: string
    classId: string
    satisfiedBy: string
}

/** The knowledge object a derived class belongs to: `c:<contractId>:<itemId>`, the contract's object by the one spelling rule. */
function objectOfClass(classId: string): string {
    const contractAndItem = classId.replace(/^c:/, '')
    return knowledgeKey(contractAndItem.slice(0, Math.max(0, contractAndItem.lastIndexOf(':'))))
}

/**
 * **The record against the identifications actually recorded** — B2 review, 28 October 2026. The record says which component is IDENTIFIED
 * with an environment element; the realization-choices files say which identification exists. Nothing tied the two: an identification of an
 * environment element by a component the record does not list as IDENTIFIED, or an IDENTIFIED entry with no identification behind it, passed
 * silently. Each is named here, and an IDENTIFIED entry whose `where` does not name the file holding its identification. Pure: the caller
 * hands every recorded identification (a unit test reads every realization-choices file the index and the provisional realizations name).
 */
export function environmentIdentificationRefusals(record: SportEnvironmentElements, identifications: RecordedIdentification[]): string[] {
    const errors: string[] = []
    for (const element of record.elements) {
        const elementId = `c:${record.contractId}:${element.item}`
        const ofElement = identifications.filter(entry => entry.satisfiedBy === elementId)
        for (const entry of ofElement) {
            const object = objectOfClass(entry.classId)
            const referral = element.referredToBy.find(candidate => knowledgeKey(candidate.object) === object)
            if (!referral || referral.how !== 'IDENTIFIED') {
                errors.push(`${entry.file} identifies ${entry.classId} with ${elementId}, and the environment record does not list ${object} as IDENTIFIED with it${referral ? ` (it lists it as ${referral.how})` : ''}`)
            } else if (!referral.where.includes(entry.file)) {
                errors.push(`the environment record lists ${referral.object} as IDENTIFIED with ${elementId}, and its where does not name ${entry.file}, which holds the identification`)
            }
        }
        for (const referral of element.referredToBy.filter(candidate => candidate.how === 'IDENTIFIED')) {
            if (!ofElement.some(entry => objectOfClass(entry.classId) === knowledgeKey(referral.object))) {
                errors.push(`the environment record lists ${referral.object} as IDENTIFIED with ${elementId}, and no realization-choices file records that identification`)
            }
        }
    }
    return errors
}

/** The collection of a game holding the element, by its path, or null where the game holds none. */
function collectionHolding(game: unknown, elementId: string): { path: string; members: any[] } | null {
    const walk = (node: unknown, path: string): { path: string; members: any[] } | null => {
        if (Array.isArray(node)) {
            if (node.some(entry => isObject(entry) && entry.elementId === elementId)) return { path, members: node }
            for (const entry of node) {
                const id = isObject(entry) && typeof entry.elementId === 'string' ? entry.elementId : null
                const found = walk(entry, id ? `${path}[${id}]` : path)
                if (found) return found
            }
            return null
        }
        if (isObject(node)) {
            for (const [key, value] of Object.entries(node)) {
                const found = walk(value, path ? `${path}.${key}` : key)
                if (found) return found
            }
        }
        return null
    }
    return walk(game, '')
}

/**
 * **A second element where the playing environment already has one, named** (see the head of this file): for each environment element the
 * concrete game holds, every other element of its collection carrying the same authored selector, each as a reason. Empty where there is
 * none, and for a game holding no environment element.
 */
export function duplicateEnvironmentElements(game: unknown, record: SportEnvironmentElements | null): string[] {
    if (!record) return []
    const problems: string[] = []
    for (const element of record.elements) {
        const elementId = `c:${record.contractId}:${element.item}`
        const found = collectionHolding(game, elementId)
        if (!found) continue
        const own = found.members.find(entry => isObject(entry) && entry.elementId === elementId)
        const selector = JSON.stringify(own?.selector ?? null)
        for (const other of found.members) {
            if (other === own || !isObject(other) || typeof other.elementId !== 'string' || JSON.stringify(other.selector ?? null) !== selector) continue
            problems.push(
                `${found.path}[${other.elementId}] is a second element where the playing environment already has one: ${elementId} (${element.what}), in the same collection with the same authored selector. ` +
                    `A component refers to the environment's element rather than establish its own; only a recorded identification may let the environment's element stand for another, and none does here ` +
                    `(the Sport Profile's environment record lists ${element.referredToBy.map(referral => `${referral.object}, ${referral.how}`).join('; ')})`,
            )
        }
    }
    return problems
}
