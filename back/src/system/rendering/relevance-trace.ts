/**
 * **The relevance trace: why a built environment is relevant to a Game Problem's affordances, graded by what the knowledge authorizes — review
 * evidence only** (B3, 28 October 2026; E7 as our proposal R8 section 6 designed it, built narrowly).
 *
 * Christian, his reply filed 30 October 2026, item 5: *"The system should demonstrate why the selected environment is relevant to those
 * affordances, but distinguish between:"* *"Relationships explicitly authorized in our knowledge."* *"Relationships inferred from existing
 * authorized premises."* *"Interpretations or hypotheses that remain unverified."* And: *"For the initial composition test, the explanation
 * should serve as review evidence. It should not turn plausible but unverified interpretations into established facts."* *"Where a required
 * relationship is missing, the system should identify that gap."*
 *
 * What it reads, never writes or changes: the element provenance the review evidence computes (`elementProvenanceOf`, so a premise's standing
 * is the one the review page shows), the contracts the build derived from, the realized games, and three kinds of existing relationship:
 *   - the Game Problem's row of the Affordance Target Matrix, with his definition of each affordance (carried from the workbook since B1);
 *   - a game form's Game Problem mapping and archetype, as the sport's module writes them (`gameFormGameProblemMapping`), with the archetype
 *     workbook's row relating that archetype to the Game Problem;
 *   - a context's ACTIVE relationship rows in the context workbook (to the Game Problem, the Learning Goal, the game forms present).
 *
 * The grades (ours, applying his three distinctions plus his gap):
 *   - AUTHORIZED: one authored row makes the link (object level only: no authored row relates any element to an affordance today);
 *   - INFERRED: every premise is authored, joined by a NAMED join rule of the DRAFT table we wrote (`docs/audits/drafts/relevance-join-rules
 *     .DRAFT.json`, loaded by the TEST-ONLY draft store), whose words are verbatim in the affordance's definition and whose ceiling allows it;
 *   - UNVERIFIED: the rule is a reading of play (its ceiling), or a premise is not approved knowledge (an assumed bound, a choice not labelled
 *     his, a provisional choice, a draft), or the element rests on no knowledge item at all;
 *   - GAP: a required relationship is missing: no selected game form related to the Game Problem; a context without a row to it (or to the
 *     goal); an Essential affordance no element reaches at INFERRED; a shaping element (a context's, a constraint's, a realization's, a draft's)
 *     that no rule relates to any affordance of the profile.
 * An element is SHAPING where a contract it rests on is a context's, a constraint's or a realization's, and also wherever any source it rests on
 * is a realization choice his record marks PROVISIONAL, or anything DRAFT: such a source names no contract item (`choice game::V1`, `record
 * <id>`, `DRAFT clause for <law>`), so its contracts alone would file it with the engine and its missing relationship would go unreported
 * (B3 review, MF1). Only a ref that is exactly `<contract>::<item>`, of a contract the build derived from, counts as a knowledge item.
 * An object-level inference (rule J-OBJ: an object mapped to the Game Problem, which rates an affordance Essential) is labelled so: it says
 * what the object is mapped to, never what any element does.
 *
 * An affordance the table marks inference NONE (Support Availability) takes no rule, J-OBJ included: his item 5 asks us not to assume support
 * *"simply because players have teammates"*; the matrix's own rating of it is still shown, AUTHORIZED, as the row he wrote. Measured facts of
 * the realized games are reported beside it instead — possession numbers, space per player, rules on direction and eligibility, continuity on
 * a possession change, targets per team (R5's SA-1..SA-4 and SA-6) — as facts, never as a grade. Each coverage row carries what its best links
 * do not show, so a row at INFERRED is never read as the affordance established in play.
 *
 * Never served, never a selection input, never coach text: only the TEST-ONLY entry points of `build-activity.ts` attach it, and a static
 * test holds it out of every selection module's and coach-text module's imports. Sport-neutral: rows, terms and ids are data.
 */
import { loadSportProfile } from '../derivation/corpus'
import { RegisterIndex } from '../derivation/register'
import { LoadedContract } from '../derivation/types'
import {
    AFFORDANCE_TARGET_MATRIX_BY_ID,
    AffordanceTargetRating,
    AffordanceTargetRow,
    ATM_METADATA_ROWS,
    atmRatingRowOf,
    AtmRatingRowAsWritten,
    CANONICAL_AFFORDANCE_DEFINITIONS,
    CANONICAL_AFFORDANCES,
    CanonicalAffordance,
    gameProblemKeyedMetadataRows,
} from '../knowledge-core/affordance-target-matrix'
import { gameArchetypeLibrary } from '../knowledge-core/game-archetype-library'
import { gameFormGameProblemMapping, GameFormGameProblemMapping, rpcLibrary } from '../sport-module/rpc-library'
import { genericOf, objectivesOf, readPath, restrictionsOf, segmentsOf, teamsOf, termsOf, transitionsOf } from './game-reading'
import { ElementProvenance, EvidenceSource, itemRefOf, itemSource } from './review-evidence'

export type RelevanceGrade = 'AUTHORIZED' | 'INFERRED' | 'UNVERIFIED' | 'GAP'
/** The trace's status, and the one string a test looks for to show a production answer never carries it. */
export const RELEVANCE_TRACE_STATUS = 'RELEVANCE_TRACE_REVIEW_EVIDENCE_ONLY' as const

export interface CitedWords {
    words: string
    citedAs: string
}

/* ------------------------------------------------------------------ the DRAFT join-rule table ------------------------------------------------------------------ */

export interface RelevanceJoinRule {
    id: string
    affordance: CanonicalAffordance
    /** Register rows: the kind of structure an element must sit on (its row, or the collection a row's path names). */
    rows: string[]
    /** Optional: what the element's member must hold — selector terms (`attribute = value`) and fields, each compared verbatim. */
    where?: { selector?: Record<string, string>; fields?: Record<string, string> }
    /** The words of the affordance's definition (a Version Metadata row of the matrix) the structure is read as an instance of. */
    anchor: { metadataKey: string; words: string }
    ceiling: 'INFERRED' | 'UNVERIFIED'
    structure: string
    shows: string
    doesNotShow: string
}

export interface RelevanceJoinRules {
    /** Where the table was read from (repository-relative), set by its loader. */
    file: string
    standing: 'DRAFT'
    ours: true
    title: string
    about: string
    his: CitedWords[]
    affordances: { affordance: CanonicalAffordance; inference: 'BY_RULE' | 'NONE'; why?: string; his?: CitedWords[] }[]
    objectRule: { id: string; says: string; doesNotShow: string }
    rules: RelevanceJoinRule[]
}

const TABLE_KEYS = ['standing', 'ours', 'title', 'about', 'his', 'affordances', 'objectRule', 'rules']
const AFFORDANCE_ENTRY_KEYS = ['affordance', 'inference', 'why', 'his']
const RULE_KEYS = ['id', 'affordance', 'rows', 'where', 'anchor', 'ceiling', 'structure', 'shows', 'doesNotShow']
const DEFINITION_KEY = /^car_[a-z]+_definition$/

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const citedWordsRefusals = (value: unknown, where: string): string[] =>
    Array.isArray(value) && value.length && value.every(entry => !!entry && typeof entry === 'object' && filled((entry as any).words) && filled((entry as any).citedAs) && Object.keys(entry).every(key => key === 'words' || key === 'citedAs'))
        ? []
        : [`${where}: must be a non-empty list of { words, citedAs }`]
const unknownKeys = (value: object, allowed: string[], where: string): string[] => Object.keys(value).filter(key => !allowed.includes(key)).map(key => `${where}: the key ${key} is not one this table holds`)
const stringMap = (value: unknown): boolean => !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(filled)

/** The collection row a register row sits on: itself where it is a collection, else the collection that owns it; null for a game-level row. */
const collectionRowOf = (row: string, index: RegisterIndex): string | null => (index.rows.get(row)?.kind === 'COLLECTION' ? row : (index.ownerRow.get(row) ?? null))

/**
 * **Everything wrong with a join-rule table, as sentences; empty means it may be read.** Closed keys; the four canonical affordances once each;
 * an affordance marked NONE carries our reason and takes no rule; every rule names register rows the register holds, a definition row of the
 * matrix that defines the rule's own affordance, and words found verbatim in that definition; a `where` names only selector attributes of the
 * collection each of its rows sits on, and fields the register holds on that collection (a misspelt name would reach nothing, silently).
 */
export function relevanceJoinRulesRefusals(raw: unknown, index: RegisterIndex): string[] {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ['the table is not an object']
    const table = raw as Record<string, any>
    const errors: string[] = [...unknownKeys(table, TABLE_KEYS, 'the table')]
    if (table.standing !== 'DRAFT') errors.push('the table: standing must say DRAFT')
    if (table.ours !== true) errors.push('the table: ours must be true (the rules are ours, never his)')
    if (!filled(table.title) || !filled(table.about)) errors.push('the table: title and about are required')
    errors.push(...citedWordsRefusals(table.his, 'the table his'))
    const entries: any[] = Array.isArray(table.affordances) ? table.affordances : []
    if (!Array.isArray(table.affordances)) errors.push('the table: affordances must be a list')
    for (const affordance of CANONICAL_AFFORDANCES) {
        const count = entries.filter(entry => entry?.affordance === affordance).length
        if (count !== 1) errors.push(`affordances: ${affordance} must be listed once (found ${count})`)
    }
    for (const [i, entry] of entries.entries()) {
        const where = `affordances[${i}]`
        if (!entry || typeof entry !== 'object') {
            errors.push(`${where}: not an object`)
            continue
        }
        errors.push(...unknownKeys(entry, AFFORDANCE_ENTRY_KEYS, where))
        if (!CANONICAL_AFFORDANCES.includes(entry.affordance)) errors.push(`${where}: ${String(entry.affordance)} is not a canonical affordance`)
        if (entry.inference !== 'BY_RULE' && entry.inference !== 'NONE') errors.push(`${where}: inference must be BY_RULE or NONE`)
        if (entry.inference === 'NONE' && !filled(entry.why)) errors.push(`${where}: an affordance taking no rule must say why`)
        if (entry.his !== undefined) errors.push(...citedWordsRefusals(entry.his, `${where} his`))
    }
    const none = new Set(entries.filter(entry => entry?.inference === 'NONE').map(entry => entry.affordance))
    const objectRule = table.objectRule
    if (!objectRule || typeof objectRule !== 'object' || !filled(objectRule.id) || !filled(objectRule.says) || !filled(objectRule.doesNotShow)) errors.push('the table: objectRule needs id, says and doesNotShow')
    else errors.push(...unknownKeys(objectRule, ['id', 'says', 'doesNotShow'], 'objectRule'))
    const rules: any[] = Array.isArray(table.rules) ? table.rules : []
    if (!Array.isArray(table.rules)) errors.push('the table: rules must be a list')
    const ids = new Set<string>(filled(objectRule?.id) ? [objectRule.id] : [])
    for (const [i, rule] of rules.entries()) {
        const where = `rules[${i}]${filled(rule?.id) ? ` (${rule.id})` : ''}`
        if (!rule || typeof rule !== 'object') {
            errors.push(`${where}: not an object`)
            continue
        }
        errors.push(...unknownKeys(rule, RULE_KEYS, where))
        if (!filled(rule.id)) errors.push(`${where}: id is required`)
        else if (ids.has(rule.id)) errors.push(`${where}: the id is used twice`)
        else ids.add(rule.id)
        if (!CANONICAL_AFFORDANCES.includes(rule.affordance)) errors.push(`${where}: ${String(rule.affordance)} is not a canonical affordance`)
        if (none.has(rule.affordance)) errors.push(`${where}: ${rule.affordance} takes no rule (its entry says inference NONE)`)
        if (!Array.isArray(rule.rows) || !rule.rows.length) errors.push(`${where}: rows must be a non-empty list`)
        else for (const row of rule.rows) if (!index.rows.has(String(row))) errors.push(`${where}: the register holds no row ${String(row)}`)
        if (rule.where !== undefined) {
            const w = rule.where
            if (!w || typeof w !== 'object' || Array.isArray(w)) errors.push(`${where}: where must be an object`)
            else {
                errors.push(...unknownKeys(w, ['selector', 'fields'], `${where} where`))
                if ((w.selector !== undefined && !stringMap(w.selector)) || (w.fields !== undefined && !stringMap(w.fields))) errors.push(`${where}: where's selector and fields must map names to values`)
                else if (Array.isArray(rule.rows)) {
                    for (const row of rule.rows.map(String).filter(id => index.rows.has(id))) {
                        const collection = collectionRowOf(row, index)
                        const attributes = (collection && index.rows.get(collection)?.selectorAttributes) || []
                        for (const attribute of Object.keys(w.selector ?? {})) if (!attributes.includes(attribute)) errors.push(`${where}: ${attribute} is not a selector attribute of the collection ${row} sits on`)
                        const fieldPath = (field: string) => (collection ? `${String(index.rows.get(collection)!.path)}.${field}` : null)
                        for (const field of Object.keys(w.fields ?? {})) if (![...index.rows.values()].some(entry => String(entry.path) === fieldPath(field))) errors.push(`${where}: the register holds no field ${field} on the collection ${row} sits on`)
                    }
                }
            }
        }
        const anchor = rule.anchor
        if (!anchor || typeof anchor !== 'object' || !filled(anchor.metadataKey) || !filled(anchor.words)) errors.push(`${where}: anchor needs metadataKey and words`)
        else {
            errors.push(...unknownKeys(anchor, ['metadataKey', 'words'], `${where} anchor`))
            const row = ATM_METADATA_ROWS.find(entry => entry.metadata_key === anchor.metadataKey)
            if (!row || !DEFINITION_KEY.test(anchor.metadataKey)) errors.push(`${where}: ${anchor.metadataKey} is not a definition row of the matrix`)
            else if (row.metadata_value !== rule.affordance) errors.push(`${where}: ${anchor.metadataKey} defines ${String(row.metadata_value)}, not ${String(rule.affordance)}`)
            else if (typeof row.notes !== 'string' || !row.notes.includes(anchor.words)) errors.push(`${where}: "${anchor.words}" is not verbatim in the definition (${anchor.metadataKey})`)
        }
        if (rule.ceiling !== 'INFERRED' && rule.ceiling !== 'UNVERIFIED') errors.push(`${where}: ceiling must be INFERRED or UNVERIFIED`)
        for (const key of ['structure', 'shows', 'doesNotShow']) if (!filled(rule[key])) errors.push(`${where}: ${key} is required`)
    }
    return errors
}

/* ------------------------------------------------------------------ the trace ------------------------------------------------------------------ */

/** A premise of a link: what it rests on, with the standing the review evidence gives it. */
export interface RelevancePremise {
    ref: string
    standing: string
    detail: string | null
}

export interface RelevanceLink {
    grade: RelevanceGrade
    /** OBJECT: about a knowledge object (a form, a context, the Game Problem); ELEMENT: about one element of the realized game. */
    level: 'OBJECT' | 'ELEMENT'
    from: string
    to: string
    affordance: CanonicalAffordance | null
    /** The join rule (ours, DRAFT) that makes an inferred or unverified link; null where an authored row makes it. */
    rule: string | null
    /** Where the authored row is, for an AUTHORIZED link. */
    source: string | null
    premises: RelevancePremise[]
    says: string
    doesNotShow: string | null
    /** Why this grade (ours). */
    why: string
}

export interface RelevanceGap {
    affordance: CanonicalAffordance | null
    path: string | null
    missing: string
    /** For an element's gap: the standings of what it rests on (a draft says DRAFT), so a gap never hides whose knowledge it is. */
    restsOn?: string[]
}

export type ElementLayer = 'CONSTITUTIVE' | 'GAME_FORM' | 'SHAPING' | 'ENGINE_OR_SESSION'

export interface RelevanceTrace {
    status: typeof RELEVANCE_TRACE_STATUS
    about: string
    gameProblem: { id: string | null; name: string | null; ratingRow: AtmRatingRowAsWritten | null; keyedNotes: { key: string; value: string | number | boolean; notes?: string }[] }
    affordances: { affordance: CanonicalAffordance; rating: AffordanceTargetRating | null; required: boolean; definition: string; inference: 'BY_RULE' | 'NONE' }[]
    joinRules: { file: string; standing: 'DRAFT'; ours: true; objectRule: string; rules: { id: string; affordance: CanonicalAffordance; ceiling: string; anchor: string }[] }
    objects: { contractId: string; objectId: string; layer: Exclude<ElementLayer, 'ENGINE_OR_SESSION'> }[]
    objectLevel: RelevanceLink[]
    /** How many elements were read (the review evidence's own list, or the one block's). */
    elementsRead: number
    /** Every element a rule reached, with its links. */
    elements: { path: string; row: string | null; layer: ElementLayer; links: RelevanceLink[] }[]
    /** `doesNotShow`: what the links at the best grade do not show (each rule's own words, once), so a row at INFERRED is never read as more. */
    coverage: { affordance: CanonicalAffordance; rating: AffordanceTargetRating | null; required: boolean; best: RelevanceGrade; inferredBy: string[]; unverifiedBy: string[]; doesNotShow: string[] }[]
    gaps: RelevanceGap[]
    /** The elements no rule reached, by layer (a shaping one is a gap too). */
    notReached: { layer: ElementLayer; paths: string[] }[]
    /** Paths the evidence lists whose element no block's game holds (identified with another element, or never realized): no link, no gap. */
    notInGame: string[]
    /** Facts, never grades, for each affordance the table marks inference NONE. */
    measured: { affordances: CanonicalAffordance[]; status: 'FACTS_NOT_GRADES'; note: string; his: CitedWords[]; blocks: { blockId: string; facts: { id: string; what: string; value: unknown }[] }[] }
}

/** The relationship readers; a test may hand others (`readers`) to show what a missing relationship does. */
export interface RelevanceReaders {
    profile: (gameProblemId: string) => AffordanceTargetRow | undefined
    ratingRow: (gameProblemId: string) => AtmRatingRowAsWritten | null
    gameFormMapping: (objectId: string) => GameFormGameProblemMapping | null
    /** A context's ACTIVE relationship rows, or null where the object is no context. */
    contextRelationships: (objectId: string) => { relationshipId: string; library: string; relatedId: string; type: string; strength: string }[] | null
    archetypeRow: (archetypeId: string, gameProblemId: string) => Record<string, unknown> | null
    constitutive: () => string[]
}

const KNOWLEDGE_READERS: RelevanceReaders = {
    profile: gameProblemId => AFFORDANCE_TARGET_MATRIX_BY_ID[gameProblemId],
    ratingRow: atmRatingRowOf,
    gameFormMapping: gameFormGameProblemMapping,
    contextRelationships: objectId => (rpcLibrary.context(objectId) ? rpcLibrary.relationships(objectId) : null),
    archetypeRow: (archetypeId, gameProblemId) =>
        (gameArchetypeLibrary.knowledgeFor(archetypeId, 'GAME_PROBLEM_RELATIONSHIP').find(row => row.Target_ID === gameProblemId) as unknown as Record<string, unknown>) ?? null,
    constitutive: () => loadSportProfile().map(contract => contract.contractId),
}

export interface RelevanceTraceInput {
    elements: ElementProvenance[]
    contracts: LoadedContract[]
    /** Each block's game (a game not played in blocks is one block with no holders). */
    games: { blockId: string; holders: Record<string, string>; fixture: any }[]
    gameProblemId: string | null
    learningGoalId: string | null
    index: RegisterIndex
    joinRules: RelevanceJoinRules
    readers?: Partial<RelevanceReaders>
}

const ABOUT =
    'Review evidence for an administrator, never served and never a selection input: why the built environment is relevant to the Game Problem\'s affordances, each link graded AUTHORIZED (an authored row makes it), INFERRED (authored premises joined by a named join rule, ours and DRAFT), UNVERIFIED (a reading of play, or a premise that is not approved knowledge) or GAP (a required relationship is missing). Nothing here claims how the activity plays.'
const MEASURED_NOTE =
    'Measured from the realized games only (ours). Not evidence that support opportunities emerge: these are the counts, space and rules the game holds, not what players do.'

const ORDER: RelevanceGrade[] = ['AUTHORIZED', 'INFERRED', 'UNVERIFIED', 'GAP']
const LAYER_RANK: Record<ElementLayer, number> = { ENGINE_OR_SESSION: 0, CONSTITUTIVE: 1, GAME_FORM: 2, SHAPING: 3 }

/** The member of a collection an element path names (its first `[id]`), read from a game, or null. */
function memberOf(game: unknown, path: string): any {
    const segments = segmentsOf(path)
    const at = segments.findIndex(segment => segment.id)
    if (at < 0) return null
    const memberPath = segments
        .slice(0, at + 1)
        .map(segment => (segment.id === undefined ? segment.key : `${segment.key}[${segment.id}]`))
        .join('.')
    return readPath(game, memberPath) ?? null
}

/**
 * Whether no block's game holds the member an element path names, although the game holds the collection: a line derived on an element the
 * realization identified with another (a context's own object, kept as the playing environment's) or never realized. Such a path is in the
 * evidence but not in the environment, so it takes no link and is no gap. False where the path names no member, or no game holds the
 * collection (a fixture-level path: the layout, the laws, the bound regions), where this reading cannot judge.
 */
function notHeldByGames(path: string, games: RelevanceTraceInput['games']): boolean {
    const segments = segmentsOf(path)
    const at = segments.findIndex(segment => segment.id)
    if (at < 0 || !games.length) return false
    const collection = segments
        .slice(0, at + 1)
        .map(segment => segment.key)
        .join('.')
    return games.every(({ fixture }) => {
        const members = readPath(fixture?.game ?? {}, collection)
        return Array.isArray(members) && !members.some(member => String(member?.elementId) === segments[at].id)
    })
}

/** Whether an element sits on one of a rule's rows: its own row, or the collection a row's path names (`performers.teams` for P1). */
function onRows(element: ElementProvenance, rows: string[], index: RegisterIndex): boolean {
    if (element.row && rows.includes(element.row)) return true
    const generic = genericOf(element.path)
    return rows.some(row => {
        const path = index.rows.get(row)?.path
        return !!path && genericOf(String(path)).replace(/\[\]$/, '') === generic
    })
}

function holdsWhere(element: ElementProvenance, rule: RelevanceJoinRule, games: RelevanceTraceInput['games']): boolean {
    if (!rule.where) return true
    return games.some(({ fixture }) => {
        const member = memberOf(fixture?.game ?? {}, element.path)
        if (!member) return false
        const terms = termsOf(member)
        return (
            Object.entries(rule.where!.selector ?? {}).every(([attribute, value]) => String(terms[attribute]) === value) &&
            Object.entries(rule.where!.fields ?? {}).every(([field, value]) => String(member[field]) === value)
        )
    })
}

/**
 * The premises of an element, each with the layer the review evidence gives it: every source the review evidence gave it except the engine's
 * adopted mechanisms (standing decisions, entailment, realized geometry), the session, and the wording gap (a coach-sentence matter, not
 * knowledge); and the item its own id names, graded by the review evidence's reading (`itemSource`).
 */
function premiseSourcesOf(element: ElementProvenance, items: Map<string, any>): EvidenceSource[] {
    const sources: EvidenceSource[] = element.sources.filter(source => source.layer !== 'SESSION_INPUT' && !(source.layer === 'GENERAL_ENGINE_MECHANISM' && (source.standing === 'APPROVED' || source.standing === 'GAP')))
    const first = segmentsOf(element.path).find(segment => segment.id)
    const own = first?.id ? itemRefOf(first.id) : null
    if (own && !sources.some(source => source.ref === `${own.contractId}::${own.itemId}`)) {
        const source = itemSource(own, items, null)
        sources.push({ ...source, detail: `the item that established the element; ${source.detail ?? ''}`.trim() })
    }
    return sources
}

/** The trace: read-only, deterministic; see the header. */
export function relevanceTraceOf(input: RelevanceTraceInput): RelevanceTrace {
    const readers: RelevanceReaders = { ...KNOWLEDGE_READERS, ...(input.readers ?? {}) }
    const { joinRules, index } = input
    const gp = input.gameProblemId
    const profile = gp ? readers.profile(gp) : undefined
    const inference = (affordance: CanonicalAffordance) => joinRules.affordances.find(entry => entry.affordance === affordance)?.inference ?? 'BY_RULE'
    const affordances = CANONICAL_AFFORDANCES.map(affordance => {
        const rating = profile ? profile[affordance] : null
        return { affordance, rating, required: rating === 'Essential', definition: CANONICAL_AFFORDANCE_DEFINITIONS[affordance], inference: inference(affordance) }
    })
    const rated = affordances.filter(entry => entry.rating !== null && entry.rating !== 'Not Required')
    const gaps: RelevanceGap[] = []
    if (!gp) gaps.push({ affordance: null, path: null, missing: 'no Game Problem: the build resolved none and none was given' })
    else if (!profile) gaps.push({ affordance: null, path: null, missing: `${gp} has no row in the Affordance Target Matrix` })

    /* The objects the build derived from, by layer. */
    const constitutive = new Set(readers.constitutive())
    const layerOfContract = new Map<string, Exclude<ElementLayer, 'ENGINE_OR_SESSION'>>()
    const objects: RelevanceTrace['objects'] = input.contracts.map(contract => {
        const layer: Exclude<ElementLayer, 'ENGINE_OR_SESSION'> = constitutive.has(contract.contractId) ? 'CONSTITUTIVE' : readers.gameFormMapping(contract.objectId) ? 'GAME_FORM' : 'SHAPING'
        layerOfContract.set(contract.contractId, layer)
        return { contractId: contract.contractId, objectId: contract.objectId, layer }
    })

    /* Object level: the authored rows, and the object-level inference. */
    const objectLevel: RelevanceLink[] = []
    const authored = (from: string, to: string, source: string, says: string, affordance: CanonicalAffordance | null = null, standing: string | null = null): RelevanceLink => ({
        grade: 'AUTHORIZED', level: 'OBJECT', from, to, affordance, rule: null, source, premises: [], says, doesNotShow: null, why: `one authored row makes this link${standing ? `; ${standing}` : ''}`,
    })
    const ratingRow = gp ? readers.ratingRow(gp) : null
    if (gp && profile) for (const entry of rated) objectLevel.push(authored(gp, entry.affordance, `Affordance Target Matrix, Ratings Grid row ${gp}`, `rated ${entry.rating}`, entry.affordance))
    const mappedToGp: string[] = []
    const forms = objects.filter(object => object.layer === 'GAME_FORM')
    for (const form of forms) {
        const mapping = readers.gameFormMapping(form.objectId)!
        const field = gp && mapping.primary.includes(gp) ? 'primary_game_problem_ids' : gp && mapping.secondary.includes(gp) ? 'secondary_game_problem_ids' : null
        if (gp && field) {
            const value = mapping.fields.find(entry => entry.field === field)?.value ?? null
            // Who wrote the cell, and the module's own standing beside it, so AUTHORIZED is read with both (B3 review).
            const standing = `${mapping.module.record}; the module's metadata: ${mapping.module.standing.map(entry => `${entry.field} ${JSON.stringify(entry.value)}`).join(', ')}`
            objectLevel.push(authored(`game form ${form.objectId}`, gp, `the sport's module, game form ${form.objectId}, ${field}`, `${field}: ${JSON.stringify(value)}`, null, standing))
            mappedToGp.push(`game form ${form.objectId}`)
        }
        const archetype = gp && mapping.archetypeId ? readers.archetypeRow(mapping.archetypeId, gp) : null
        if (gp && archetype) {
            objectLevel.push(
                authored(
                    `archetype ${mapping.archetypeId} (of game form ${form.objectId})`,
                    gp,
                    `the archetype workbook, ${String(archetype['Record_ID'])}`,
                    `${String(archetype['Knowledge_Role'])}: ${JSON.stringify(archetype['Knowledge_Statement'])} Rationale: ${JSON.stringify(archetype['Rationale'])}`,
                ),
            )
        }
    }
    if (gp && !mappedToGp.length) gaps.push({ affordance: null, path: null, missing: forms.length ? `no selected game form (${forms.map(form => form.objectId).join(', ')}) has an authored relationship to ${gp}` : 'no game form was selected' })
    for (const object of objects) {
        const rows = readers.contextRelationships(object.objectId)
        if (!rows) continue
        const toGp = gp ? rows.filter(row => row.library === 'GAME_PROBLEM' && row.relatedId === gp) : []
        for (const row of toGp) objectLevel.push(authored(`context ${object.objectId}`, gp!, `the context workbook, ${row.relationshipId}`, `${row.type} ${row.strength}`))
        if (toGp.length) mappedToGp.push(`context ${object.objectId}`)
        else if (gp) gaps.push({ affordance: null, path: null, missing: `the context ${object.objectId} has no ACTIVE relationship row to ${gp}` })
        if (input.learningGoalId) {
            const toGoal = rows.filter(row => row.library === 'LEARNING_GOAL' && row.relatedId === input.learningGoalId)
            for (const row of toGoal) objectLevel.push(authored(`context ${object.objectId}`, input.learningGoalId, `the context workbook, ${row.relationshipId}`, `${row.type} ${row.strength}`))
            if (!toGoal.length) gaps.push({ affordance: null, path: null, missing: `the context ${object.objectId} has no ACTIVE relationship row to ${input.learningGoalId}` })
        }
        for (const form of forms) for (const row of rows.filter(entry => entry.library === 'GAME_FORM' && entry.relatedId === form.objectId)) objectLevel.push(authored(`context ${object.objectId}`, `game form ${form.objectId}`, `the context workbook, ${row.relationshipId}`, `${row.type} ${row.strength}`))
    }
    // J-OBJ for each Essential affordance that takes a rule; one the table marks NONE keeps only the matrix's rating row (AUTHORIZED, above).
    for (const object of mappedToGp) {
        for (const entry of rated.filter(candidate => candidate.required && candidate.inference === 'BY_RULE')) {
            objectLevel.push({
                grade: 'INFERRED', level: 'OBJECT', from: object, to: entry.affordance, affordance: entry.affordance, rule: joinRules.objectRule.id, source: null,
                premises: [{ ref: `${object} -> ${gp}`, standing: 'APPROVED', detail: 'an authored row (above)' }, { ref: `${gp} -> ${entry.affordance}`, standing: 'APPROVED', detail: `rated ${entry.rating} (above)` }],
                says: joinRules.objectRule.says, doesNotShow: joinRules.objectRule.doesNotShow, why: `object level: both premises are authored rows, joined by ${joinRules.objectRule.id} (ours, DRAFT)`,
            })
        }
    }

    /* Element level: each element a rule reaches, graded by its premises and the rule's ceiling. */
    const items = new Map<string, any>()
    for (const contract of input.contracts) {
        for (const item of contract.items ?? []) items.set(`${contract.contractId}::${item.itemId}`, item)
        for (const deferred of contract.deferredItems ?? []) items.set(`${contract.contractId}::${deferred.item.itemId}`, deferred.item)
    }
    /** The contract a premise names: only a ref that is exactly `<contract>::<item>`, of a contract the build derived from (never `choice game::V1`). */
    const contractOfRef = (ref: string): string | null => {
        const at = ref.indexOf('::')
        const contractId = at > 0 ? ref.slice(0, at) : ''
        const itemId = at > 0 ? ref.slice(at + 2) : ''
        return layerOfContract.has(contractId) && itemId.length > 0 && !/[\s:]/.test(itemId) ? contractId : null
    }
    const elements: RelevanceTrace['elements'] = []
    const notReached = new Map<ElementLayer, string[]>()
    const notInGame: string[] = []
    for (const element of input.elements) {
        if (notHeldByGames(element.path, input.games)) {
            notInGame.push(element.path)
            continue
        }
        const sources = premiseSourcesOf(element, items)
        const premises: RelevancePremise[] = sources.map(source => ({ ref: source.ref, standing: source.standing, detail: source.detail }))
        // A provisional realization choice, or anything DRAFT, makes the element SHAPING whatever (or whether) a contract its refs name (MF1).
        const shapedByChoiceOrDraft = sources.some(source => source.standing === 'DRAFT' || (source.layer === 'ACTIVITY_REALIZATION_CHOICE' && source.standing === 'PROVISIONAL'))
        const layer: ElementLayer = shapedByChoiceOrDraft
            ? 'SHAPING'
            : premises
                  .map(premise => contractOfRef(premise.ref))
                  .filter((id): id is string => id !== null)
                  .reduce<ElementLayer>((best, id) => (LAYER_RANK[layerOfContract.get(id)!] > LAYER_RANK[best] ? layerOfContract.get(id)! : best), 'ENGINE_OR_SESSION')
        const knowledge = premises.filter(premise => contractOfRef(premise.ref) !== null)
        const links: RelevanceLink[] = joinRules.rules
            .filter(rule => rated.some(entry => entry.affordance === rule.affordance) && onRows(element, rule.rows, index) && holdsWhere(element, rule, input.games))
            .map(rule => {
                const notApproved = premises.filter(premise => premise.standing !== 'APPROVED')
                const grade: RelevanceGrade = notApproved.length || !knowledge.length ? 'UNVERIFIED' : rule.ceiling
                const why = notApproved.length
                    ? `a premise is not approved knowledge: ${notApproved.map(premise => `${premise.ref} (${premise.standing})`).join('; ')}`
                    : !knowledge.length
                      ? 'the element rests on no contract item of the knowledge (only the engine\'s adopted mechanisms, the session, or approved sources that are no contract item)'
                      : rule.ceiling === 'INFERRED'
                        ? `every premise is approved knowledge, joined by ${rule.id} (ours, DRAFT)`
                        : `${rule.id} is a reading of play (its ceiling is UNVERIFIED)`
                return {
                    grade, level: 'ELEMENT' as const, from: element.path, to: rule.affordance, affordance: rule.affordance, rule: rule.id, source: null, premises,
                    says: `${rule.structure}, read as "${rule.anchor.words}" (${rule.anchor.metadataKey}). ${rule.shows}`, doesNotShow: rule.doesNotShow, why,
                }
            })
        if (links.length) elements.push({ path: element.path, row: element.row, layer, links })
        else {
            if (!notReached.has(layer)) notReached.set(layer, [])
            notReached.get(layer)!.push(element.path)
            if (layer === 'SHAPING' && rated.length) gaps.push({ affordance: null, path: element.path, missing: 'a shaping element that no join rule relates to any affordance of the profile', restsOn: [...new Set(premises.map(premise => premise.standing))] })
        }
    }

    /* Coverage, and the gap for each Essential affordance no element reaches at INFERRED. */
    const coverage = rated.map(entry => {
        const links = elements.flatMap(element => element.links.filter(link => link.affordance === entry.affordance))
        const inferredBy = links.filter(link => link.grade === 'INFERRED').map(link => link.from)
        const unverifiedBy = links.filter(link => link.grade === 'UNVERIFIED').map(link => link.from)
        const best: RelevanceGrade = inferredBy.length ? 'INFERRED' : unverifiedBy.length ? 'UNVERIFIED' : 'GAP'
        if (entry.required && best !== 'INFERRED') {
            gaps.push({
                affordance: entry.affordance,
                path: null,
                missing:
                    entry.inference === 'NONE'
                        ? `${entry.affordance} is Essential and the table admits no rule for it (inference NONE): its measured facts are reported, not graded`
                        : `${entry.affordance} is Essential and no element reaches it by approved premises and a join rule${unverifiedBy.length ? ` (only unverified readings: ${unverifiedBy.length})` : ''}`,
            })
        }
        const doesNotShow = [...new Set(links.filter(link => link.grade === best && link.doesNotShow).map(link => link.doesNotShow!))]
        return { affordance: entry.affordance, rating: entry.rating, required: entry.required, best, inferredBy, unverifiedBy, doesNotShow }
    })

    const noneAffordances = affordances.filter(entry => entry.inference === 'NONE').map(entry => entry.affordance)
    return {
        status: RELEVANCE_TRACE_STATUS,
        about: ABOUT,
        gameProblem: { id: gp, name: gp && ratingRow ? (ratingRow['canonical_name'] ?? null) : null, ratingRow, keyedNotes: gp ? gameProblemKeyedMetadataRows(gp).map(row => ({ ...row })) : [] },
        affordances,
        joinRules: {
            file: joinRules.file,
            standing: joinRules.standing,
            ours: joinRules.ours,
            objectRule: joinRules.objectRule.id,
            rules: joinRules.rules.map(rule => ({ id: rule.id, affordance: rule.affordance, ceiling: rule.ceiling, anchor: `${rule.anchor.metadataKey}: "${rule.anchor.words}"` })),
        },
        objects,
        objectLevel: objectLevel.sort((a, b) => ORDER.indexOf(a.grade) - ORDER.indexOf(b.grade)),
        elementsRead: input.elements.length,
        elements,
        coverage,
        gaps,
        notReached: [...notReached.entries()].sort(([a], [b]) => LAYER_RANK[b] - LAYER_RANK[a]).map(([layer, paths]) => ({ layer, paths })),
        notInGame,
        measured: {
            affordances: noneAffordances,
            status: 'FACTS_NOT_GRADES',
            note: MEASURED_NOTE,
            his: joinRules.affordances.filter(entry => entry.inference === 'NONE').flatMap(entry => entry.his ?? []),
            blocks: noneAffordances.length ? input.games.map(game => ({ blockId: game.blockId, facts: measuredFactsOf(game, index) })) : [],
        },
    }
}

/**
 * **The measured facts of one block's game** (R5's SA-1..SA-4 and SA-6; SA-5 is the coverage row above). Read from the realized game and its
 * envelope with the readers the review evidence uses; nothing is inferred from them.
 */
function measuredFactsOf(block: RelevanceTraceInput['games'][number], index: RegisterIndex): { id: string; what: string; value: unknown }[] {
    const game = block.fixture?.game ?? {}
    const envelope = block.fixture?.envelope ?? {}
    const teams = teamsOf(block, index)
    const at = (row: string): unknown => {
        const path = index.rows.get(row)?.path
        return path ? (readPath(game, String(path)) ?? null) : null
    }
    const neutrals = typeof at('P5') === 'number' ? (at('P5') as number) : 0
    const total = teams.reduce((n, team) => n + team.total, 0)
    const area = Number(envelope.lengthM) * Number(envelope.widthM)
    const perTeam = new Map<string, string[]>()
    for (const objective of objectivesOf(block, index)) perTeam.set(objective.team, [...(perTeam.get(objective.team) ?? []), objective.regionId ?? '(no target)'])
    return [
        {
            id: 'SA-1',
            what: 'possession numbers: for each team, its performers other than the one in possession (possible supporters) against the other teams\' performers (possible pressers), from the counts alone; neutrals listed beside, not added',
            value: {
                teams: teams.map(team => ({ team: team.designation ?? team.handle, counts: team.counts, total: team.total, possibleSupporters: team.total - 1, possiblePressers: total - team.total })),
                neutrals: { count: neutrals, on: at('P6a'), joins: at('P6b'), takesEffect: at('P6c') },
            },
        },
        {
            id: 'SA-2',
            what: 'space: the area, and the area per performer on the field (teams and neutrals)',
            value: { lengthM: envelope.lengthM ?? null, widthM: envelope.widthM ?? null, areaM2: Number.isFinite(area) ? area : null, performers: total + neutrals, m2PerPerformer: Number.isFinite(area) && total + neutrals > 0 ? Math.round((area / (total + neutrals)) * 10) / 10 : null },
        },
        { id: 'SA-3', what: 'rules that could remove a direction of play, a receiver or a place (counted as the review evidence counts them)', value: restrictionsOf(game, index) },
        { id: 'SA-4', what: 'continuity: each transition\'s trigger and what play does', value: transitionsOf(block, index).map(row => ({ trigger: row.trigger, playState: row.playState })) },
        { id: 'SA-6', what: 'targets per team: what each team\'s objectives score at', value: [...perTeam.entries()].map(([team, targets]) => ({ team, targets })) },
    ]
}
