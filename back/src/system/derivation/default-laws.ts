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
 * **R3, 24 October 2026 (the d27 design's stage R3, its sections 0.5 and 2.6): a departure the realization itself records.** *"Departures
 * sit on the item that replaces a law. A realization-level `departsFrom` holds a law the activity removes without replacing it"*; *"Both are
 * validated by the same departureRefusals."* Christian, reply filed 27 October 2026, item 2: *"I approve no [restriction on position] for
 * this initial realization, with that modification communicated once to the coach."* (his noun bracketed: the coupling ratchet keeps a
 * sport's nouns out of this layer; the provisional-realizations file quotes him whole). Such a law has no item to carry its departure,
 * because nothing in the game replaces it, so the realization records it beside its items (`departsFrom` on the realization), held to
 * exactly the rules an item's departures are held to (`departureRefusals`), and the account reads it beside its items' departures, cited by
 * the realization that records it (`RealizationDepartures`).
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
 *   - `REGION_OF_PERFORMER {function, row}` (Z, 25 October 2026, register version 25): a region with that function belongs to the team
 *     holding a performer on that specialized row - bound to an object that team defends (row O7 naming the row), or bound to that team's
 *     own end line (row S7's second form, `performerEnd`). Christian, reply filed 28 October 2026, item 7: *"The absence of a physical
 *     [object] shouldn't automatically eliminate the [specialized performer]'s handling privileges or fundamentally alter the player's
 *     functional role during the build-out."* (his nouns bracketed; the Sport Profile quotes him whole). Per end line, only where that region
 *     lies at that end line;
 *   - `SPECIALIZED_PERFORMER_PRESENT {row}`: a team holds a performer on that specialized row (the register's specializedRole rows);
 *   - `UNREPRESENTED {what}`: the representation has no row for it. Always ABSENT, so a law resting on it can only be DEPARTED from or
 *     owed, never said to apply - and so it is refused in a law's `applicableWhen` (H3, the H2 review's should-fix 1): there it would make
 *     the law NOT_APPLICABLE everywhere, a silent pass.
 *
 * Insufficient evidence is never a pass: a predicate that cannot be read is UNKNOWN, and a law resting on it is owed.
 */
import { RegisterIndex } from './register'

/** The closed predicate vocabulary (the design's section 3.2). */
export const LAW_PREDICATES = ['OBJECT_OF_KIND_AT_END', 'REGION_BOUND_TO_OBJECT', 'BOUND_REGION_MARK', 'SPECIALIZED_PERFORMER_PRESENT', 'UNREPRESENTED', 'REGION_OF_PERFORMER'] as const
export type LawPredicateName = (typeof LAW_PREDICATES)[number]

/** The arguments each predicate takes, and only these. */
const PREDICATE_ARGUMENTS: Record<LawPredicateName, readonly string[]> = {
    OBJECT_OF_KIND_AT_END: ['kind'],
    REGION_BOUND_TO_OBJECT: ['function', 'kind'],
    BOUND_REGION_MARK: ['function'],
    SPECIALIZED_PERFORMER_PRESENT: ['row'],
    UNREPRESENTED: ['what'],
    // Z (25 October 2026): a region with the function belonging to the team holding a performer on the row (its defended object or its end).
    REGION_OF_PERFORMER: ['function', 'row'],
}

/** The predicates that read a region a law is keyed on, where a law may give the coach something inside it (Z: either form of binding). */
export const REGION_PREDICATES: readonly LawPredicateName[] = ['REGION_BOUND_TO_OBJECT', 'REGION_OF_PERFORMER']

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

/**
 * **Why the profile lists a law** — R1, 24 October 2026 (the d27 design's section 2.6). ADAPTATION: the law can fail to apply in a modified
 * environment, so it names the preconditions it needs (the six laws H2 listed). DEPARTURE: it is listed only so an activity can record that
 * it departs from it (his reply filed 27 October 2026, item 4: *"There should be no separate [restarts of the sport] for this activity."*,
 * his nouns bracketed: the coupling ratchet keeps a sport's nouns out of this layer, and the register quotes him whole; his reply filed 26
 * October 2026, item 10: *"The governing principle is to inherit established sport
 * rules and explicitly define only the necessary departures."*), so it may need nothing to apply. A law of either kind needing nothing would
 * otherwise be one the profile has no reason to list: an ADAPTATION law still must name a precondition, and a DEPARTURE law nothing departs
 * from is caught by a data test (`default-laws.unit.ts`).
 */
export const LAW_LISTED_FOR = ['ADAPTATION', 'DEPARTURE'] as const
export type LawListedFor = (typeof LAW_LISTED_FOR)[number]

/**
 * The item field a departure is recorded in, and the realization field its strictness is declared in. R3 (24 October 2026): a realization
 * records a departure of its own in the same field, beside its items (`RealizationDepartures`).
 */
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
    /** Why the profile lists it (R1): a law that can fail to apply (ADAPTATION), or one listed for an activity to depart from (DEPARTURE). */
    listedFor: LawListedFor
    /**
     * Whether it is a law of how play restarts (R1): under a game's common dead-ball restart (register row RP1) such a law cannot apply as
     * written, so where it would apply and nothing departs from it, the account says an adaptation is owed (`default-laws-check.ts`).
     */
    restart: boolean
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
    /** B4: the sport's own check for a composed activity (`SportLawsCheck`); null where the block declares none. */
    check: SportLawsCheck | null
}

/**
 * **The sport's own check for a composed activity, by materiality** — B4, 28 October 2026 (R8's E4a, our proposal). Christian, his reply
 * filed 30 October 2026, item 4: *"For [restriction on position] and other Laws of the Game adaptations, normal rules remain the starting
 * point, with explicit modifications where necessary."* *"Material unresolved conflicts affecting the activity's meaning, safety, or
 * structural validity should prevent approval."* *"Minor or nonessential procedural questions may be reported for review without stopping development."* *"We should
 * avoid another extended investigation into every possible [sport] rule before establishing the activity's essential design."* (His nouns
 * bracketed: the coupling ratchet keeps a sport's nouns out of this layer; the Sport Profile quotes him whole.)
 *
 * Until B4 an activity was held to the account only where its provisional realization declared a check (`defaultLawsCheck`), so a composed
 * activity, one whose realization declares none or that has none, gained no account at all. The Sport Profile's default-laws block may now
 * declare one check for the sport (`check`), held only to a Learning Goal's activity and only where no realization of its own declares one
 * (a realization's own check still wins). Its one mode, BY_MATERIALITY, is his distinction applied per owed adaptation: one classified
 * MATERIAL refuses the activity before it is served; one classified PROCEDURAL is reported for review and refuses nothing; one no
 * classification names counts as MATERIAL (fail safe: an owed adaptation nobody has judged minor is never waved through). The
 * classifications are not the check's: none is production knowledge. Ours are a DRAFT reading for his review, read only by composition-test
 * builds (`LawsMateriality`, through the draft store), so a production composition, classified by nothing, is refused for whatever it owes.
 */
export const SPORT_LAWS_CHECK_MODES = ['BY_MATERIALITY'] as const
export type SportLawsCheckMode = (typeof SPORT_LAWS_CHECK_MODES)[number]

/** His two kinds of owed adaptation (his reply filed 30 October 2026, item 4): material (prevents approval) or procedural (reported). */
export const LAW_MATERIALITIES = ['MATERIAL', 'PROCEDURAL'] as const
export type LawMateriality = (typeof LAW_MATERIALITIES)[number]

/** The sport's check for a composed activity (the Sport Profile's `defaultLaws.check`): its mode, why (ours), and his words for it. */
export interface SportLawsCheck {
    mode: SportLawsCheckMode
    because: string
    basis: CitedWords
}

/** One law's materiality, as a classification of ours reads it: which law, which kind, and our reading (never his words). */
export interface LawMaterialityEntry {
    law: string
    materiality: LawMateriality
    ourReading: string
}

/**
 * **A classification of the profile's laws by his materiality test, as a DRAFT of ours** — B4. Never production knowledge: the file is read
 * only by the draft store (`draft-store.ts` `loadLawsMateriality`), for composition-test builds, and held to `lawsMaterialityRefusals`.
 */
export interface LawsMateriality {
    file: string
    standing: string
    readBy: string
    note: string
    /** His test, quoted exactly as the Sport Profile's check quotes it. */
    test: CitedWords
    classifications: LawMaterialityEntry[]
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

/**
 * **The departures a realization records on itself, and which realization records them** — R3, 24 October 2026 (the d27 design's section
 * 2.6: *"Realization-level `departsFrom`, for a law the activity removes without replacing it. The field is added beside the item departures,
 * validated by the same departureRefusals, and read by the check."*; *"A01-R2 inherits it, following the defaultLawsCheck inheritance
 * pattern."*). `recordedBy` is the realization whose own entry they are: the realization itself, or, for a variant stating none of its own,
 * its base - as a variant's kept items keep their base's ids. The account cites each departure by it, as it cites an item's by the item.
 */
export interface RealizationDepartures {
    recordedBy: string
    departures: LawDeparture[]
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

const BLOCK_KEYS = new Set(['source', 'edition', 'editionNote', 'authority', 'restates', 'note', 'laws', 'check'])
const LAW_KEYS = new Set(['id', 'cites', 'name', 'scope', 'applicableWhen', 'requires', 'note', 'listedFor', 'restart'])
const AUTHORITY_KEYS = new Set(['words', 'citedAs', 'by', 'ruledOn'])

/**
 * **Everything wrong with a Sport Profile's default-laws block, as sentences; empty means it may be loaded** (the design's section 3.2:
 * *"a closed list of law ids, his words required, unknown keys refused"*). The source named; the edition named or null with a note saying
 * why; his words with where, who and when; what it restates; and each law once, with what it cites, our name for it, a scope of the closed
 * list and its preconditions in the closed predicate vocabulary. A law that needs nothing to apply would be one the profile has no reason
 * to list, so each names at least one precondition.
 *
 * **R1, 24 October 2026 (the d27 design's section 2.6): the last rule narrows, and two fields are required.** Each law says why it is listed
 * (`listedFor`, closed: ADAPTATION or DEPARTURE) and whether it is a law of how play restarts (`restart`, a boolean, never defaulted). A
 * DEPARTURE law is listed so an activity can record its departure from it, and may need nothing to apply; an ADAPTATION law needing nothing
 * is refused as before. The loosening is bounded and compensated: only a law declared DEPARTURE escapes the rule, and a data test requires
 * that some realization departs from every such law (`default-laws.unit.ts`), so none is listed that nothing reads.
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
    // B4: the sport's own check for a composed activity, where the block declares one (absent: none, and no composition is held to one).
    if (block.check !== undefined) {
        const why = sportLawsCheckRefusal(block.check)
        if (why) errors.push(`the default-laws block ${why}`)
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
        if (!(LAW_LISTED_FOR as readonly unknown[]).includes(law.listedFor)) errors.push(`${which} is listed for ${JSON.stringify(law.listedFor)}, which is none of ${LAW_LISTED_FOR.join(', ')}`)
        if (typeof law.restart !== 'boolean') errors.push(`${which} does not say whether it is a law of how play restarts (restart: true or false)`)
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
        // R1: a law listed for an activity to depart from may need nothing to apply; any other law needing nothing is still refused.
        if (Array.isArray(law.applicableWhen) && Array.isArray(law.requires) && !law.applicableWhen.length && !law.requires.length && law.listedFor !== 'DEPARTURE') {
            errors.push(`${which} needs nothing to apply, so the profile has no reason to list it (unless it is listed for an activity to depart from: listedFor DEPARTURE)`)
        }
    }
    return errors
}

const DEPARTURE_KEYS = new Set(['law', 'because', 'basis', 'extent', 'part', 'whilePreconditionAbsent'])

/**
 * **Everything wrong with the departures an item records, as sentences** (`departsFrom`). A non-empty list; each entry names a law the
 * profile lists, once per item, says why (ours) and quotes his words for it with where, covers the WHOLE of the law or a PART it names, and
 * may rest on the absence of one of that law's own preconditions - only one of its own, so the condition is closed by the profile.
 * R3 (24 October 2026): the departures a realization records on itself are held to exactly these rules (`corpus.ts`).
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

/**
 * **Why the sport's check cannot be used, or null** (B4): exactly its mode of the closed list (there is no default), why (ours), and his
 * words with where he said them. The same three keys a realization's check has; only the mode list differs.
 */
export function sportLawsCheckRefusal(check: unknown): string | null {
    if (!isObject(check)) return 'declares the sport\'s check as something other than an object (mode, because, basis)'
    for (const key of Object.keys(check)) if (!CHECK_KEYS.has(key)) return `declares the sport's check with "${key}"`
    if (!(SPORT_LAWS_CHECK_MODES as readonly unknown[]).includes(check.mode)) return `declares the sport's check ${JSON.stringify(check.mode)}, which is none of ${SPORT_LAWS_CHECK_MODES.join(', ')} (there is no default)`
    if (!filled(check.because)) return 'declares the sport\'s check without saying why (because)'
    const basis = citedWordsRefusal(check.basis)
    return basis ? `declares the sport's check, and ${basis}` : null
}

const MATERIALITY_KEYS = new Set(['standing', 'readBy', 'note', 'test', 'classifications'])
const CLASSIFICATION_KEYS = new Set(['law', 'materiality', 'ourReading'])
/** Whose reading a classification is, one of which its standing must carry beside DRAFT: ours, or a test's stand-in. Never his. */
const MATERIALITY_STANDING_LABELS = ['OUR READING', 'TEST-ONLY'] as const
/** Whether one of his sentences names a kind of owed adaptation (MATERIAL, PROCEDURAL) as a whole word: his test's sentence for that kind. */
const namesKind = (sentence: string, kind: LawMateriality): boolean => new RegExp(`\\b${kind}\\b`, 'i').test(sentence)

/**
 * **Everything wrong with a DRAFT classification of the profile's laws by his materiality test, as sentences; empty means it may be read**
 * (B4). It stands DRAFT and says whose reading it is (OUR READING or TEST-ONLY in its standing, so a stand-in never reads as his), and who
 * reads it; its test is his, quoted exactly: each of its words one of the Sport Profile check's own, cited as the check cites them (so a
 * paraphrase, or a test the sport declares no check for, is refused), and among them both sentences of his test, the one naming MATERIAL and
 * the one naming PROCEDURAL (so a test quoting only a sentence beside them, or only one kind, is refused); and it classifies laws the
 * profile names, each once, MATERIAL or PROCEDURAL, with our reading. Our reading quotes nothing (no double quotation marks, straight or
 * curly): every word of it is ours, and a quotation there would read as his. A law it does not classify is not refused here: the account
 * counts it MATERIAL.
 */
export function lawsMaterialityRefusals(raw: unknown, laws: DefaultLaws | null): string[] {
    if (!isObject(raw)) return ['the classification is not an object']
    const errors: string[] = []
    for (const key of Object.keys(raw)) if (!MATERIALITY_KEYS.has(key)) errors.push(`the classification carries "${key}"`)
    const standing = raw.standing
    if (!filled(standing) || !standing.startsWith('DRAFT')) errors.push(`the classification does not stand DRAFT (its standing: ${JSON.stringify(standing ?? null)})`)
    else if (!MATERIALITY_STANDING_LABELS.some(label => standing.includes(label))) {
        errors.push(`the classification's standing says neither ${MATERIALITY_STANDING_LABELS.join(' nor ')}, so it could read as his (its standing: ${JSON.stringify(standing)})`)
    }
    if (!filled(raw.readBy)) errors.push('the classification does not say what reads it (readBy)')
    if (!filled(raw.note)) errors.push('the classification carries no note of ours (note)')
    const check = laws?.check ?? null
    const test = citedWordsRefusal(raw.test)
    if (test) errors.push(`the classification's test: ${test}`)
    else if (!check) errors.push('the classification quotes a test, and the Sport Profile declares no check of the sport to hold it to')
    else {
        const given = raw.test as { words: string[]; citedAs: string }
        if (given.citedAs !== check.basis.citedAs) errors.push(`the classification's test is cited as ${JSON.stringify(given.citedAs)}, and the Sport Profile's check cites his words as ${JSON.stringify(check.basis.citedAs)}`)
        for (const words of given.words) if (!check.basis.words.includes(words)) errors.push(`the classification's test quotes "${words}", which is not one of the Sport Profile check's words exactly`)
        for (const kind of LAW_MATERIALITIES) {
            const his = check.basis.words.filter(sentence => namesKind(sentence, kind))
            if (!his.length) errors.push(`the Sport Profile's check quotes no sentence of his naming ${kind}, so no classification can quote his test for it`)
            else if (!given.words.some(words => his.includes(words))) {
                errors.push(`the classification's test does not quote his sentence naming ${kind} (${his.map(sentence => `"${sentence}"`).join(' or ')}): it must quote both sentences of his test`)
            }
        }
    }
    if (!Array.isArray(raw.classifications) || !raw.classifications.length) return [...errors, 'the classification classifies no law']
    const seen = new Set<string>()
    for (const [i, entry] of (raw.classifications as unknown[]).entries()) {
        const which = `classification ${isObject(entry) && filled(entry.law) ? entry.law : i + 1}`
        if (!isObject(entry)) {
            errors.push(`${which} is not an object`)
            continue
        }
        for (const key of Object.keys(entry)) if (!CLASSIFICATION_KEYS.has(key)) errors.push(`${which} carries "${key}"`)
        if (!laws?.laws.some(law => law.id === entry.law)) errors.push(`${which} classifies ${JSON.stringify(entry.law ?? null)}, which is no law the Sport Profile names as a default`)
        else if (seen.has(String(entry.law))) errors.push(`${which} is classified twice`)
        if (filled(entry.law)) seen.add(entry.law)
        if (!(LAW_MATERIALITIES as readonly unknown[]).includes(entry.materiality)) errors.push(`${which} is classified ${JSON.stringify(entry.materiality ?? null)}, which is none of ${LAW_MATERIALITIES.join(', ')}`)
        if (!filled(entry.ourReading)) errors.push(`${which} gives no reading of ours (ourReading)`)
        else if (/["“”]/.test(entry.ourReading)) errors.push(`${which}: our reading quotes something, and every word of it is ours (a quotation there would read as his)`)
    }
    return errors
}

/** The departures an item records, as read (the loader has refused any it could not use); none where it records none. */
export function departuresOf(item: unknown): LawDeparture[] {
    const departures = isObject(item) ? item[DEPARTS_FROM_KEY] : undefined
    return Array.isArray(departures) ? (JSON.parse(JSON.stringify(departures)) as LawDeparture[]) : []
}
