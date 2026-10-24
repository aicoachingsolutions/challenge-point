/**
 * **The choices a coach states a session's objects by** — stage I, 24 October 2026 (the d27 design's stage I(a) and (b), its risk 3).
 *
 * Christian, reply filed 26 October 2026, item 4: *"I agree that the coach should identify the available [object] type and dimensions,
 * without the engine inventing them."* Item 11: *"Do not infer a [object] from the presence of a [specialized performer] or silently treat
 * missing information as confirmation that no [object] exists."* His reply filed 27 October 2026, item 1: *"Please verify the applicable
 * [governing body] specification and keep the [object], [handling area], and [mark] dimensions from the same authorized source rather than
 * combining unrelated formats."* (His nouns bracketed: the coupling ratchet keeps a sport's nouns out of this layer; the data files quote him
 * whole.)
 *
 * **Why choices, and not a number.** The bound-region check matches a pairing to the session's object by its width EXACTLY
 * (`bound-region-check.ts`, `SAME` = 1e-9), and an authorized object's width may be a conversion no number field states (a width recorded
 * as an exact conversion from feet, say, which a field stepping by 0.1 m truncates). Tolerance is avoided, not decided: adding one would be
 * inventing a rule (the design's risk 3). So the session's question offers, for each kind the register's sessionResources block lists:
 *   - each object of the kind an authorized Sport Profile pairing gives a region for (`boundRegions.pairings`), named with its document and
 *     size, stating what the pairing records of it - its width and each attribute the register lists for the kind (its type) - copied
 *     exactly, so a coach who chooses it states the object the pairing is matched by; one choice per distinct object, naming every document
 *     that records it;
 *   - a choice by each attribute value the wording data lists (an object stated by its type alone);
 *   - another object of the kind, whose width the coach enters: a width typed at a rounded figure is another object, matched by no pairing
 *     whose width it does not equal, and the realization it does not suit says which object it is built for (`choicesSuitedTo`);
 *   - none, a statement that the session has none (never "not stated", which is no answer at all).
 * The coach always says how many (the count); nothing here defaults it. The labels are DRAFT wording data (`objectChoices` in
 * docs/audits/draft-coach-wording.json); a kind with no labels has no choices, and the question is asked as before (a count and a width).
 *
 * **The height is shown and not stated.** A pairing records its object's height and the label says it; no choice states it, because no rule
 * reads a stated height (the register's sessionResources note: "The height is not asked: no authorized entry reads it."), the envelope
 * carries no key the register does not list (session-envelope.ts), and his item 9(b) asks that we "avoid requesting information that the
 * active generation pathway cannot meaningfully interpret". A stated height would be a projection nothing consumes.
 *
 * **Feet are shown only where exact.** The size is given in metres, and also in feet where both figures are a whole number of feet at
 * 0.3048 m per foot (the definition of the international foot): a width recorded as the exact conversion of a figure a document states in
 * feet reads in both, and a width a document states in metres reads in metres alone, never rounded to a foot figure nobody stated.
 *
 * Read by the build's question (`build-activity.ts`, `SessionQuestion.choices`, which the review page and the live route pass on), by the
 * session form (GET /session/object-choices) and by the sentence saying which objects a realization is built for. Nothing here decides
 * which objects suit an activity: that is the realization's authorized knowledge (`objectSuitability`), read where it is given.
 */
import { BoundRegionPairing, SportBoundRegions } from '../derivation/bound-regions'
import { loadRegister, loadSportBoundRegions } from '../derivation/corpus'
import { indexRegister, RegisterIndex } from '../derivation/register'
import { axisLengths } from '../realization/spatial'
import { DraftCoachWording, draftCoachWordingLoad, fillSlots } from './draft-coach-wording'

/** What a coach enters beside a choice: how many (always, except for none), and the width where the choice states none. */
export type ObjectChoiceEntry = 'count' | 'widthM'

/** One choice a coach states a session's objects of a kind by (stage I). */
export interface ObjectChoice {
    /** `pairing:<id>`, `attribute:<name>=<value>`, `other` or `none`: stable, so the review page and the form can tell which was chosen. */
    id: string
    /** DRAFT words, from the wording data. */
    label: string
    /** What choosing it states beside what the coach enters, copied from what it names (a pairing's width and type; a count of none). */
    states: Record<string, string | number>
    /** What the coach still enters: how many, and the width where the choice states none. Empty for none. */
    enters: ObjectChoiceEntry[]
    /** For an authorized object: every pairing that records it, with its document and citation (shown, never matched by the client). */
    from: { pairing: string; document: string; citedAs: string }[] | null
    status: 'DRAFT'
}

/** The definition of the international foot, in metres: a unit, not a figure of any document. */
const METRES_PER_FOOT = 0.3048
const SAME = 1e-9

/** A number of metres as a whole number of feet, or null where it is not one (exactly, within floating point). */
function wholeFeet(metres: number): number | null {
    const feet = metres / METRES_PER_FOOT
    const whole = Math.round(feet)
    return whole > 0 && Math.abs(feet - whole) < SAME ? whole : null
}

/** An object's size as a coach reads it: width by height in metres, or width alone; also in feet where every figure is a whole number of feet. */
export function sizeWords(widthM: number, heightM: number | null): string {
    const metres = heightM === null ? `${widthM} m wide` : `${widthM} m x ${heightM} m`
    const widthFt = wholeFeet(widthM)
    const heightFt = heightM === null ? null : wholeFeet(heightM)
    if (widthFt === null || (heightM !== null && heightFt === null)) return metres
    return heightM === null ? `${widthFt} ft (${widthM} m) wide` : `${widthFt} ft x ${heightFt} ft (${widthM} m x ${heightM} m)`
}

/** What a pairing's object states, as a choice copies it: each attribute the register lists for the kind that it records, and its width. */
function statesOf(pairing: BoundRegionPairing, index: RegisterIndex): Record<string, string | number> {
    const states: Record<string, string | number> = {}
    for (const { attribute } of (index.sessionResources?.attributes ?? []).filter(entry => entry.kind === pairing.object.kind)) {
        const value = (pairing.object as unknown as Record<string, unknown>)[attribute]
        if (typeof value === 'string' && value.length > 0) states[attribute] = value
    }
    states.widthM = pairing.object.widthM
    return states
}

/**
 * **The choices for one kind**, in the order offered: each authorized object (in the order the Sport Profile lists its pairings), each
 * attribute value the wording lists, another object, none. Empty where the register lists no such kind or the wording labels none.
 */
export function objectChoicesOf(
    kind: string,
    index: RegisterIndex = indexRegister(loadRegister()),
    block: SportBoundRegions | null = loadSportBoundRegions(),
    wording: DraftCoachWording = draftCoachWordingLoad().wording,
): ObjectChoice[] {
    if (!(index.sessionResources?.kinds ?? []).includes(kind)) return []
    const words = wording.objectChoices.find(entry => entry.kind === kind)
    if (!words) return []
    const authorized: { states: Record<string, string | number>; heightM: number | null; pairings: BoundRegionPairing[] }[] = []
    for (const pairing of block?.pairings ?? []) {
        if (pairing.object.kind !== kind) continue
        const states = statesOf(pairing, index)
        const same = authorized.find(entry => JSON.stringify(entry.states) === JSON.stringify(states) && entry.heightM === pairing.object.heightM)
        if (same) same.pairings.push(pairing)
        else authorized.push({ states, heightM: pairing.object.heightM, pairings: [pairing] })
    }
    const choices: ObjectChoice[] = []
    for (const entry of authorized) {
        const label = fillSlots(words.authorized.label, { kind, document: entry.pairings.map(pairing => pairing.document).join(' and '), size: sizeWords(Number(entry.states.widthM), entry.heightM) })
        if (label === null) continue
        choices.push({
            id: `pairing:${entry.pairings[0].id}`,
            label,
            states: { ...entry.states },
            enters: ['count'],
            from: entry.pairings.map(pairing => ({ pairing: pairing.id, document: pairing.document, citedAs: pairing.citedAs })),
            status: 'DRAFT',
        })
    }
    for (const choice of words.attributeValues) {
        // A named authorized object already offers this value in the session form. ATTRIBUTE asks offer it separately below.
        if (authorized.some(entry => entry.states[choice.attribute] === choice.value)) continue
        choices.push({ id: `attribute:${choice.attribute}=${choice.value}`, label: choice.label, states: { [choice.attribute]: choice.value }, enters: ['count'], from: null, status: 'DRAFT' })
    }
    choices.push({ id: 'other', label: words.other.label, states: {}, enters: ['count', 'widthM'], from: null, status: 'DRAFT' })
    choices.push({ id: 'none', label: words.none.label, states: { count: 0 }, enters: [], from: null, status: 'DRAFT' })
    return choices
}

/**
 * **The choices that answer an ATTRIBUTE question.** K1: with a stated width, only authorized objects of exactly that width, each
 * DRAFT attribute value preserving that width, and none. Another object states no attribute and cannot answer the question.
 *
 * An attribute value's choice is dropped where an authorized choice already offered states everything it would state (the same rule
 * `objectChoicesOf` applies to the session list, here with the width the value's choice keeps): two choices stating the same thing
 * would make the coach choose between identical statements under different names.
 */
export function choicesAnswering(choices: ObjectChoice[], attribute: string, widthM?: number, kind?: string): ObjectChoice[] {
    if (widthM === undefined) return choices.filter(choice => choice.id === 'none' || typeof choice.states[attribute] === 'string')
    const values = objectChoiceWordingFor(kind)?.attributeValues.filter(entry => entry.attribute === attribute) ?? []
    const authorized = choices.filter(choice => choice.from && choice.states.widthM === widthM && typeof choice.states[attribute] === 'string')
    const statesNothingNew = (states: Record<string, string | number>) =>
        authorized.some(offered => Object.entries(states).every(([name, value]) => offered.states[name] === value))
    return [
        ...authorized,
        ...values
            .map(entry => ({ id: `attribute:${attribute}=${entry.value}`, label: entry.label, states: { [attribute]: entry.value, widthM }, enters: ['count'] as ObjectChoiceEntry[], from: null, status: 'DRAFT' as const }))
            .filter(choice => !statesNothingNew(choice.states)),
        ...choices.filter(choice => choice.id === 'none'),
    ]
}

function objectChoiceWordingFor(kind?: string) {
    return draftCoachWordingLoad().wording.objectChoices.find(entry => entry.kind === kind)
}

/**
 * **The authorized objects a realization is built for, in a session of this size** — the d27 design's stage I(b): *"The reason in the
 * closed panel names the authorized goal ... so the coach can choose it."* Each authorized choice of the kind whose width every
 * suitability rule of the realization admits, and one of whose pairings gives a region that fits the session's area (narrower than its width
 * and shallower than its length, the bound-region check's own test), so no object is named that the realization would refuse or not apply
 * with. Empty where none is: then the sentence names none.
 */
export function choicesSuitedTo(
    kind: string,
    rules: { min: number | null; max: number | null; attributes?: Record<string, string[]> }[],
    area: { lengthM: number; widthM: number },
    index: RegisterIndex = indexRegister(loadRegister()),
    block: SportBoundRegions | null = loadSportBoundRegions(),
    wording: DraftCoachWording = draftCoachWordingLoad().wording,
): ObjectChoice[] {
    const axes = axisLengths(area)
    if (!axes || !rules.length) return []
    return objectChoicesOf(kind, index, block, wording).filter(choice => {
        if (!choice.from) return false
        const width = Number(choice.states.widthM)
        if (!rules.every(rule => (rule.min === null || width >= rule.min) && (rule.max === null || width <= rule.max))) return false
        if (!rules.every(rule => Object.entries(rule.attributes ?? {}).every(([attribute, allowed]) => allowed.includes(String(choice.states[attribute]))))) return false
        return choice.from.some(source => {
            const pairing = block?.pairings.find(entry => entry.id === source.pairing)
            return !!pairing && pairing.region.widthM < axes.across && pairing.region.depthM < axes.along
        })
    })
}

/** Every kind's choices, as GET /session/object-choices serves them to the session form (the files' register, profile and wording). */
export function sessionObjectChoices(): { kinds: { kind: string; choices: ObjectChoice[] }[] } {
    const index = indexRegister(loadRegister())
    const block = loadSportBoundRegions()
    const wording = draftCoachWordingLoad().wording
    return { kinds: (index.sessionResources?.kinds ?? []).map(kind => ({ kind, choices: objectChoicesOf(kind, index, block, wording) })) }
}
