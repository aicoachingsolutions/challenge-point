/**
 * **The sport's normal laws as the default, and the adaptations an activity owes where one cannot apply directly** — H2, 23 October 2026
 * (the d26 design's build step 2, its section 3.2; step 5's annotations ride on it).
 *
 * Christian, reply filed 26 October 2026, item 10: *"The normal Laws of the Game should apply by default wherever they are applicable,
 * unless an activity introduces an explicit, knowledge-authorized modification."* *"Where a normal law cannot apply directly because of the
 * modified field, scoring structure, or game format, the system should identify the relevant adaptation rather than silently assume
 * conventional conditions exist."* *"The [restriction on position] question, for example, may need an explicit ruling for this small-sided
 * environment, but we should not expand the current work into a comprehensive reconstruction of [the sport's] laws."* *"The governing
 * principle is to inherit established sport rules and explicitly define only the necessary departures."* (His sport nouns are bracketed:
 * the coupling ratchet keeps them out of this layer; the Sport Profile quotes him whole.)
 *
 * **What this module is.** The sport-neutral half of the mechanism: the CLOSED vocabulary the knowledge is written in, and the validation
 * of every place it is written. The Sport Profile names the laws as the default in a declaration block (`defaultLaws`: the source, his
 * authority, and a short list of the laws that can fail to apply in a modified environment, each with the preconditions it needs) - a
 * declaration, never items, because his item 10 excludes reconstructing the laws as representation. A provisional realization records its
 * departures on its own items (`departsFrom`: which law, why, his words, the whole of it or a part, and optionally the precondition whose
 * absence the departure rests on) and says how strictly its activity is held to the account (`defaultLawsCheck`: ENFORCE or REPORT, with
 * a reason and his words; there is no default). The account itself is computed after realization (`realization/default-laws-check.ts`).
 *
 * **The predicates are closed and sport-neutral; what they name is data.** Law ids, object kinds, region functions and performer rows are
 * the profile's; this file names none of them. Each predicate reads an existing register row, or says plainly that nothing represents
 * what it asks:
 *   - `OBJECT_OF_KIND_AT_END {kind}`: an object of that kind (the register's objectGeometry rows) stands at that end line - its realized
 *     along anchor is that end (the design's "whose O4 anchor is that end");
 *   - `REGION_BOUND_TO_OBJECT {function, kind}`: a region with that function is bound to an object of that kind (register version 21: row
 *     S7, the boundRegions block; H3, the design's N2), at that end line where the law is accounted for per end. Its function is a member
 *     of the register's region-function list (H3 tightened this: until the list held the member, the token was not checked);
 *   - `BOUND_REGION_MARK {function}`: that region's authorized pairing (the Sport Profile's boundRegions block, the design's N3) gives a
 *     mark, and the realization records the spot. No row records a spot (whether it is marked or paced is decision 3 of the note sent to
 *     him), so where a pairing gives a mark it is still ABSENT, saying so;
 *   - `SPECIALIZED_PERFORMER_PRESENT {row}`: a team holds a performer on that specialized row (the register's specializedRole rows);
 *   - `UNREPRESENTED {what}`: the representation has no row for it. Always ABSENT, so a law resting on it can only be DEPARTED from or
 *     owed, never said to apply - and so it is refused in a law's `applicableWhen` (H3, the H2 review's should-fix 1): there it would make
 *     the law NOT_APPLICABLE everywhere, a silent pass.
 *
 * Insufficient evidence is never a pass: a predicate that cannot be read is UNKNOWN, and a law resting on it is owed.
 */
import { RegisterIndex } from './register'

/** The closed predicate vocabulary (the design's section 3.2). */
export const LAW_PREDICATES = ['OBJECT_OF_KIND_AT_END', 'REGION_BOUND_TO_OBJECT', 'BOUND_REGION_MARK', 'SPECIALIZED_PERFORMER_PRESENT', 'UNREPRESENTED'] as const
export type LawPredicateName = (typeof LAW_PREDICATES)[number]

/** The arguments each predicate takes, and only these. */
const PREDICATE_ARGUMENTS: Record<LawPredicateName, readonly string[]> = {
    OBJECT_OF_KIND_AT_END: ['kind'],
    REGION_BOUND_TO_OBJECT: ['function', 'kind'],
    BOUND_REGION_MARK: ['function'],
    SPECIALIZED_PERFORMER_PRESENT: ['row'],
    UNREPRESENTED: ['what'],
}

/** One status per law and place (the design's section 3.2): APPLIES says nothing; the others are said, with why. */
export const LAW_STATUSES = ['APPLIES', 'DEPARTED', 'NOT_APPLICABLE', 'ADAPTATION_OWED'] as const
export type LawStatus = (typeof LAW_STATUSES)[number]

/** Where a law is accounted for: once for the game, or once per end line (a law keyed on what stands at an end). */
export const LAW_SCOPES = ['GAME', 'PER_END'] as const
export type LawScope = (typeof LAW_SCOPES)[number]

/** How strictly a realization's activity is held to the account: ENFORCE refuses an activity owing an adaptation; REPORT says what is owed. */
export const DEFAULT_LAWS_CHECK_MODES = ['ENFORCE', 'REPORT'] as const
export type DefaultLawsCheckMode = (typeof DEFAULT_LAWS_CHECK_MODES)[number]

/** Whether a departure covers the whole of a law where it applies, or only part of it (his "may"): the uncovered part stays the law's. */
export const DEPARTURE_EXTENTS = ['WHOLE', 'PART'] as const
export type DepartureExtent = (typeof DEPARTURE_EXTENTS)[number]

/** The item field a departure is recorded in, and the realization field its strictness is declared in. */
export const DEPARTS_FROM_KEY = 'departsFrom'
export const DEFAULT_LAWS_CHECK_KEY = 'defaultLawsCheck'

export interface LawPredicate {
    predicate: LawPredicateName
    kind?: string
    function?: string
    row?: string
    what?: string
}

/** His words for something, verbatim, and where he said them. */
export interface CitedWords {
    words: string[]
    citedAs: string
}

/** One law the profile names: its id (data), the law it cites, our name for it (DRAFT), where it is accounted for and what it needs. */
export interface DefaultLaw {
    id: string
    cites: string
    name: string
    scope: LawScope
    /** Every one must hold for the law to be applicable at all; where one does not, the law is NOT_APPLICABLE there. */
    applicableWhen: LawPredicate[]
    /** Every one must hold for the law to apply directly; where one does not and nothing departs from it, an adaptation is owed. */
    requires: LawPredicate[]
    note: string | null
}

/** The Sport Profile's default-laws block as derivation receives it. */
export interface DefaultLaws {
    file: string
    sportId: string
    source: string
    edition: string | null
    editionNote: string
    authority: CitedWords & { by: string; ruledOn: string }
    laws: DefaultLaw[]
}

/** One departure an item records (`departsFrom`). */
export interface LawDeparture {
    law: string
    because: string
    basis: CitedWords
    extent: DepartureExtent
    /** For a departure of PART of a law: which part (ours). */
    part?: string
    /** The precondition whose absence the departure rests on: where it holds, the departure's reason is false and an adaptation is owed. */
    whilePreconditionAbsent?: LawPredicate
}

/** How strictly a realization's activity is held to the account (`defaultLawsCheck`), with why and his words. */
export interface DefaultLawsCheck {
    mode: DefaultLawsCheckMode
    because: string
    basis: CitedWords
}

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/** Why his cited words are not usable, or null: a non-empty list of his words and where he said them. */
function citedWordsRefusal(value: unknown): string | null {
    if (!isObject(value)) return 'its basis is not an object of his words (words, citedAs)'
    for (const key of Object.keys(value)) if (key !== 'words' && key !== 'citedAs') return `its basis carries "${key}"`
    if (!Array.isArray(value.words) || !value.words.length || !value.words.every(filled)) return 'its basis quotes none of his words'
    if (!filled(value.citedAs)) return 'its basis does not say where he said them (citedAs)'
    return null
}

/** The object kinds the register's objectGeometry names (the kind row's vocabulary), or none without the block. */
export function objectKindsOf(index: RegisterIndex): string[] {
    const geometry = index.objectGeometry
    const attribute = geometry ? index.rows.get(geometry.kindRow)?.selectorAttribute : undefined
    return geometry && attribute ? (index.vocabularies.get(`${geometry.kindRow}.${attribute}`) ?? []) : []
}

/** Why a predicate cannot be used, or null: a member of the closed list, with exactly its own arguments, each one the register can read. */
export function lawPredicateRefusal(value: unknown, index: RegisterIndex): string | null {
    if (!isObject(value)) return 'is not a predicate object'
    const name = value.predicate
    if (!(LAW_PREDICATES as readonly unknown[]).includes(name)) return `names the predicate ${JSON.stringify(name)}, which is none of ${LAW_PREDICATES.join(', ')}`
    const wanted = PREDICATE_ARGUMENTS[name as LawPredicateName]
    for (const key of Object.keys(value)) if (key !== 'predicate' && !wanted.includes(key)) return `gives ${name} the argument "${key}", which it does not take (${wanted.join(', ')})`
    for (const key of wanted) if (!filled(value[key])) return `gives ${name} no ${key}`
    if ('kind' in value && !objectKindsOf(index).includes(String(value.kind))) return `names the object kind ${JSON.stringify(value.kind)}, which is no member of the register's object-kind vocabulary`
    if ('row' in value && !index.specializedRoleRows.has(String(value.row))) return `names the row ${JSON.stringify(value.row)}, which is no specialized performer row of the register`
    // H3 (register version 21): a region function is a member of the register's region-function list, which the bound-region block names.
    if ('function' in value) {
        const spec = index.boundRegions
        if (!spec) return `names the region function ${JSON.stringify(value.function)}, and the register names no bound-region rows`
        if (!spec.functions.includes(String(value.function))) return `names the region function ${JSON.stringify(value.function)}, which is no member of ${spec.functionRow}'s vocabulary`
    }
    return null
}

/** Two predicates are one where they name the same predicate with the same arguments. */
export function samePredicate(a: LawPredicate | undefined, b: LawPredicate | undefined): boolean {
    if (!a || !b || a.predicate !== b.predicate) return false
    return PREDICATE_ARGUMENTS[a.predicate].every(key => (a as any)[key] === (b as any)[key])
}

const BLOCK_KEYS = new Set(['source', 'edition', 'editionNote', 'authority', 'restates', 'note', 'laws'])
const LAW_KEYS = new Set(['id', 'cites', 'name', 'scope', 'applicableWhen', 'requires', 'note'])
const AUTHORITY_KEYS = new Set(['words', 'citedAs', 'by', 'ruledOn'])

/**
 * **Everything wrong with a Sport Profile's default-laws block, as sentences; empty means it may be loaded** (the design's section 3.2:
 * *"a closed list of law ids, his words required, unknown keys refused"*). The source named; the edition named or null with a note saying
 * why; his words with where, who and when; what it restates; and each law once, with what it cites, our name for it, a scope of the closed
 * list and its preconditions in the closed predicate vocabulary. A law that needs nothing to apply would be one the profile has no reason
 * to list, so each names at least one precondition.
 */
export function defaultLawsRefusals(block: unknown, index: RegisterIndex): string[] {
    if (!isObject(block)) return ['the default-laws block is not an object']
    const errors: string[] = []
    for (const key of Object.keys(block)) if (!BLOCK_KEYS.has(key)) errors.push(`the default-laws block carries "${key}", which no such block holds`)
    if (!filled(block.source)) errors.push('the default-laws block names no source')
    if (block.edition !== null && !filled(block.edition)) errors.push('the default-laws block names no edition, and does not say none is named (edition null)')
    if (!filled(block.editionNote)) errors.push('the default-laws block does not say how its edition was settled (editionNote)')
    if (!filled(block.restates)) errors.push('the default-laws block does not say what it restates (restates)')
    const authority = block.authority
    if (!isObject(authority)) errors.push('the default-laws block carries no authority in his words')
    else {
        for (const key of Object.keys(authority)) if (!AUTHORITY_KEYS.has(key)) errors.push(`the default-laws authority carries "${key}"`)
        if (!Array.isArray(authority.words) || !authority.words.length || !authority.words.every(filled) || !filled(authority.citedAs) || !filled(authority.by) || !filled(authority.ruledOn)) {
            errors.push('the default-laws authority must quote his words and say where, by whom and when (words, citedAs, by, ruledOn)')
        }
    }
    if (!Array.isArray(block.laws) || !block.laws.length) return [...errors, 'the default-laws block lists no laws']
    const ids = new Set<string>()
    for (const [i, law] of (block.laws as unknown[]).entries()) {
        const which = `default law ${isObject(law) && filled(law.id) ? law.id : i + 1}`
        if (!isObject(law)) {
            errors.push(`${which} is not an object`)
            continue
        }
        for (const key of Object.keys(law)) if (!LAW_KEYS.has(key)) errors.push(`${which} carries "${key}"`)
        if (!filled(law.id)) errors.push(`default law ${i + 1} has no id`)
        else if (ids.has(law.id)) errors.push(`${which} is listed twice`)
        if (filled(law.id)) ids.add(law.id)
        if (!filled(law.cites) || !filled(law.name)) errors.push(`${which} must say which law it cites and give it a name (cites, name)`)
        if (!(LAW_SCOPES as readonly unknown[]).includes(law.scope)) errors.push(`${which} is accounted for ${JSON.stringify(law.scope)}, which is none of ${LAW_SCOPES.join(', ')}`)
        if (law.note !== null && law.note !== undefined && !filled(law.note)) errors.push(`${which} carries an empty note`)
        const lists = ['applicableWhen', 'requires'] as const
        for (const list of lists) {
            if (!Array.isArray(law[list])) {
                errors.push(`${which} lists no ${list} (an empty list says it needs none)`)
                continue
            }
            for (const [j, predicate] of (law[list] as unknown[]).entries()) {
                const refused = lawPredicateRefusal(predicate, index)
                if (refused) errors.push(`${which}: ${list} ${j + 1} ${refused}`)
                // H3 (the H2 review's should-fix 1): what nothing represents is always absent, so as a condition of applying at all it would
                // make the law NOT_APPLICABLE everywhere - a silent pass. It may only be what a law requires (owed, or departed from).
                else if (list === 'applicableWhen' && isObject(predicate) && predicate.predicate === 'UNREPRESENTED') {
                    errors.push(`${which}: applicableWhen ${j + 1} rests on what the representation does not hold (UNREPRESENTED), which would make the law not applicable everywhere; it may only be required`)
                }
            }
        }
        if (Array.isArray(law.applicableWhen) && Array.isArray(law.requires) && !law.applicableWhen.length && !law.requires.length) {
            errors.push(`${which} needs nothing to apply, so the profile has no reason to list it`)
        }
    }
    return errors
}

const DEPARTURE_KEYS = new Set(['law', 'because', 'basis', 'extent', 'part', 'whilePreconditionAbsent'])

/**
 * **Everything wrong with the departures an item records, as sentences** (`departsFrom`). A non-empty list; each entry names a law the
 * profile lists, once per item, says why (ours) and quotes his words for it with where, covers the WHOLE of the law or a PART it names, and
 * may rest on the absence of one of that law's own preconditions - only one of its own, so the condition is closed by the profile.
 */
export function departureRefusals(departures: unknown, laws: DefaultLaw[], at: string, index: RegisterIndex): string[] {
    if (!Array.isArray(departures) || !departures.length) return [`${at} records its departures as something other than a non-empty list`]
    const errors: string[] = []
    const seen = new Set<string>()
    for (const [i, departure] of departures.entries()) {
        const which = `${at} departure ${i + 1}`
        if (!isObject(departure)) {
            errors.push(`${which} is not an object`)
            continue
        }
        for (const key of Object.keys(departure)) if (!DEPARTURE_KEYS.has(key)) errors.push(`${which} carries "${key}"`)
        const law = laws.find(candidate => candidate.id === departure.law)
        if (!law) errors.push(`${which} departs from ${JSON.stringify(departure.law)}, which is no law the Sport Profile names as a default`)
        else if (seen.has(law.id)) errors.push(`${which} departs from ${law.id} a second time`)
        if (law) seen.add(law.id)
        if (!filled(departure.because)) errors.push(`${which} does not say why (because)`)
        const basis = citedWordsRefusal(departure.basis)
        if (basis) errors.push(`${which}: ${basis}`)
        if (!(DEPARTURE_EXTENTS as readonly unknown[]).includes(departure.extent)) errors.push(`${which} covers ${JSON.stringify(departure.extent)}, which is none of ${DEPARTURE_EXTENTS.join(', ')}`)
        if (departure.extent === 'PART' && !filled(departure.part)) errors.push(`${which} covers part of the law and does not say which part (part)`)
        if (departure.extent !== 'PART' && departure.part !== undefined) errors.push(`${which} names a part and covers ${JSON.stringify(departure.extent)}`)
        if (departure.whilePreconditionAbsent !== undefined) {
            const refused = lawPredicateRefusal(departure.whilePreconditionAbsent, index)
            if (refused) errors.push(`${which}: its condition ${refused}`)
            else if (law && ![...law.applicableWhen, ...law.requires].some(own => samePredicate(own, departure.whilePreconditionAbsent as LawPredicate))) {
                errors.push(`${which} rests on the absence of a precondition ${law.id} does not have`)
            }
        }
    }
    return errors
}

const CHECK_KEYS = new Set(['mode', 'because', 'basis'])

/** Why a realization's `defaultLawsCheck` cannot be used, or null: a mode of the closed list (there is no default), why, and his words. */
export function defaultLawsCheckRefusal(check: unknown): string | null {
    if (!isObject(check)) return 'declares its default-laws check as something other than an object (mode, because, basis)'
    for (const key of Object.keys(check)) if (!CHECK_KEYS.has(key)) return `declares its default-laws check with "${key}"`
    if (!(DEFAULT_LAWS_CHECK_MODES as readonly unknown[]).includes(check.mode)) return `declares the default-laws check ${JSON.stringify(check.mode)}, which is none of ${DEFAULT_LAWS_CHECK_MODES.join(', ')} (there is no default)`
    if (!filled(check.because)) return 'declares its default-laws check without saying why (because)'
    const basis = citedWordsRefusal(check.basis)
    return basis ? `declares its default-laws check, and ${basis}` : null
}

/** The departures an item records, as read (the loader has refused any it could not use); none where it records none. */
export function departuresOf(item: unknown): LawDeparture[] {
    const departures = isObject(item) ? item[DEPARTS_FROM_KEY] : undefined
    return Array.isArray(departures) ? (JSON.parse(JSON.stringify(departures)) as LawDeparture[]) : []
}
