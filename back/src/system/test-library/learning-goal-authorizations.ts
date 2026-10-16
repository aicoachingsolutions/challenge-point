/**
 * Which library constraints a Learning Goal may select — read from an owner-ruled record, with an integrity gate.
 *
 * Christian, 15 October 2026 (item 1): *"approving Gain Access does not automatically authorize the candidate
 * constraints currently derived from vocabulary coverage. I would prefer that the activity's constraints be
 * selected based on their documented relationship to the approved context, Game Problem, and target
 * affordances. … Please identify the smallest set of authorized manipulations needed to create a
 * representative build-out problem, and flag any missing knowledge rather than filling gaps through
 * inference."*
 *
 * **Why a record and not a pool edit.** His rule of 13 October is that candidate pools are learning-design
 * knowledge and are never changed to make something generate — or to make something stop. The wording pools and
 * the Coverage rows stay as they are; for a goal that has a record, selection simply asks the record instead
 * (`guidedSelectionHints`, the one consultation point both pathways share). The record holds ids, citations,
 * statuses and his words, and nothing else: no value, no Environmental Manipulation or Affordance Target id (he
 * deferred that inference on 13 September), no phrase a selector reads.
 *
 * **Not yet evaluated, evaluated as none, and evaluated as some are three different things** (15 October 2026, his
 * reply of that day — called his 16 October reply — item 1). He answered the question we had put as decision D1 with
 * a GENERAL PRINCIPLE: *"A library constraint is not mandatory unless its inclusion is justified by the approved
 * knowledge and intended learning environment"*, and *"please don't establish Play Out from the Back as a permanent
 * special-case exception."* So the principle is recorded ONCE, at the top of the file, and read here once; a record
 * says only what its evaluation found:
 *   - `authorizedConstraints: null` — not yet evaluated: selection reports `NO_AUTHORIZED_CONSTRAINTS`, builds nothing;
 *   - `[]` with its finding — evaluated, none justified: under the principle the goal is selected with no library
 *     constraint (`generateSelection`), and every structural check still runs on it ("The engine should continue
 *     enforcing structural validity and any genuinely required conditions");
 *   - a non-empty list — those constraints, and only those, under the ordinary size rule.
 * The per-record `zeroConstraintRuling` this replaced is gone: a per-goal flag is the special case he refused. Without
 * the recorded principle an evaluated empty set is a gap again, never a licence — the loader refuses a record file
 * whose principle is malformed rather than read it.
 *
 * **The gate refuses at load**, because a record that names a constraint the library does not hold, or that both
 * authorizes and excludes one, or that says something without saying who ruled it, would silently decide what a
 * coach is served. Sport-neutral: every name in it is data.
 *
 * **Since 15 October 2026 (stage H3) the record also says what the activity still lacks.** His 16 October reply, item
 * 10, asks for four categories kept apart, and for *"a clear refusal and a narrowly described gap"* rather than an
 * activity that solves a different problem. So each entry names its category beside its status, a status that is a gap
 * names the decisions and capabilities that would supply it (defined once in the record), and `neededRecordGaps` hands
 * the builder every such entry to refuse on. `authorizationLists` is the review page's view of the same entries, sorted
 * by category: what existing knowledge authorizes, his provisional choices, and the gaps.
 */
import type { ProvisionalRealization } from '../derivation/corpus'
import { loadProvisionalRealizations, PROVISIONAL_REALIZATION_CHOICE } from '../derivation/corpus'
import { knowledgeKey } from '../derivation/knowledge-key'
import type { LearningDesignHold } from './learning-design-holds'
import { learningGoalSelectionHolds } from './learning-design-holds'
import record from './library/learning-goal-authorizations.json'
import { testLibraryRegistry } from './library/registry'

/**
 * **Whether the activity can carry an entry now.** `MISSING_CAPABILITY` added 15 October 2026 (stage H3): his 16
 * October reply asks for things the knowledge authorizes or he chose that the engine cannot yet build — the
 * asymmetric structure first among them — and those are not knowledge gaps.
 */
export const MANIPULATION_STATUSES = ['AUTHORIZED_VIA_GAME_FORM_OR_SESSION', 'AUTHORIZED_BY_RULING', 'MISSING_KNOWLEDGE', 'MISSING_CAPABILITY', 'NOT_SELECTED_FOR_FIRST_DEMO'] as const
export type ManipulationStatus = (typeof MANIPULATION_STATUSES)[number]

/**
 * The two statuses that mean *the activity his rulings ask for needs this, and it is not in place*. A record entry
 * carrying one refuses the build (`neededRecordGaps`), naming the decisions and capabilities that would supply it.
 */
export const GAP_STATUSES = ['MISSING_KNOWLEDGE', 'MISSING_CAPABILITY'] as const
export const isGapStatus = (status: string): boolean => (GAP_STATUSES as readonly string[]).includes(status)

/**
 * **His four categories, kept apart** — 16 October reply, item 10: *"The decisions above should be interpreted as
 * either: General learning-design principles. Provisional realization choices for the first activity. Existing
 * knowledge relationships that require verification. Genuine implementation or knowledge gaps. Please keep those
 * categories distinct."* A category says what an entry's AUTHORITY is; its status says whether the activity can
 * carry it now. They are different questions: his choice of an asymmetric game is a provisional realization choice
 * (category) that the engine cannot build (status). A general principle is recorded once, at the top of the file,
 * never as an entry.
 */
export const ENTRY_CATEGORIES = ['PROVISIONAL_REALIZATION_CHOICE', 'EXISTING_KNOWLEDGE_TO_VERIFY', 'GENUINE_GAP'] as const
export type EntryCategory = (typeof ENTRY_CATEGORIES)[number]

/** One manipulation his context names, evaluated: his phrase, where it is written, what carries it, and its status. */
export interface ManipulationRecord {
    /** His words, verbatim. */
    phrase: string
    phraseFrom: string
    /** Which part of the phrase this entry is about, where one phrase splits (null where it does not). */
    aspect: string | null
    tier: 'CORE' | 'COMMON' | null
    /** Where the manipulation is written: a library section and tier, a contract item, or his ruling. */
    source: string
    registerRows: string[]
    /** What the entry's authority is (his item 10). Added 15 October 2026. */
    category: EntryCategory
    status: ManipulationStatus
    /** The decisions and capabilities (ids in the record's `gaps`) that would supply it. Empty unless the status is a gap. */
    gaps: string[]
    /** Why the status is what it is — his ruling quoted, or the contract items that carry it. */
    statusBasis: string
    note: string | null
}

/**
 * A decision or capability the activity waits on, with a one-line description. OUR wording, as put to him — never
 * quoted as his. Read by the refusal and the review page; nothing here is restated in code.
 */
export interface RecordGapDefinition {
    id: string
    kind: 'DECISION' | 'CAPABILITY'
    description: string
    note: string | null
}

/** Something existing knowledge already authorizes for the activity, with the sources that carry it. */
export interface ExistingKnowledgeRecord {
    category: 'EXISTING_KNOWLEDGE_TO_VERIFY'
    what: string
    sources: string[]
    note: string | null
}

/** Something his ruling keeps out of this goal's activity. A cross-reference where an existing hold already says it. */
export interface AuthorizationExclusion {
    knowledgeId: string
    ruledOn: string
    by: string
    /** His words, verbatim. */
    ruling: string
    /** The holds file that already holds it, cross-referenced rather than restated; null where this record is the ruling. */
    heldBy: 'learning-design-holds.json' | null
}

/**
 * A GENERAL PRINCIPLE he ruled (his item 10 of 16 October keeps the categories apart): recorded once, applied without
 * any goal id. `principle` is the one sentence that is the rule; `words` are his surrounding sentences, verbatim.
 */
export interface LibraryConstraintPrinciple {
    category: 'GENERAL_PRINCIPLE'
    ruledOn: string
    by: string
    citedAs: string
    principle: string
    words: string[]
    appliedAs: string
}

/**
 * **A relationship between a context and an Environmental Manipulation, as he confirmed it** — added 15 October 2026 (stage
 * K4). His reply filed 17 October 2026, D6: *"Please authorize this initial numerical asymmetry through the appropriate
 * existing knowledge relationship, rather than hardcoding it to Play Out from the Back."* His reply filed 18 October 2026,
 * item 5: *"Both should be represented as knowledge-authorized relationships rather than hardcoded behavior for this Learning
 * Goal."* Context-level: it names no goal. `rows` are the register rows a realization citing it may author per team; it
 * authorizes something only once `status` is CONFIRMED (`realization-deferral.ts`).
 */
export interface ContextManipulationRelationship {
    id: string
    category: 'EXISTING_KNOWLEDGE_RELATIONSHIP'
    contextId: string
    contextName: string
    manipulationId: string
    manipulationName: string
    manipulationStatus: string
    dimension: string
    parameters: string[]
    scope: string
    rows: string[]
    via: string[]
    identified: string
    status: 'IDENTIFIED' | 'CONFIRMED'
    confirmedOn: string | null
    confirmedBy: string | null
    citedAs: string
    /** His words, verbatim: the confirmation. */
    words: string[]
    note: string | null
}

/**
 * **The adjustments he authorized for one goal's activity, in his words** — added 15 October 2026 (stage K4). His reply filed
 * 17 October 2026, D6: *"For now, I am asking that these remain possible, authorized adjustments—not that we implement a live
 * challenge-regulation system."* Read only to say them in "Adjusting the activity" (DRAFT); no state, trigger or count.
 */
export interface AuthorizedAdjustment {
    id: string
    category: 'PROVISIONAL_REALIZATION_CHOICE'
    ruledOn: string
    by: string
    citedAs: string
    /** His sentence naming the adjustment, verbatim. */
    words: string
    /** His sentence on its consequence, verbatim, where he gave one. */
    consequence: string | null
    /** The relationship (an id in `contextManipulationRelationships`) and the manipulation's parameter it moves. */
    relationship: string
    parameter: string
    /** The role whose team it changes (a role of the register's role vocabulary). */
    role: string
    sources: string[]
    note: string | null
}

export interface AuthorizedAdjustments {
    /** His sentences framing the adjustments, verbatim. */
    words: string[]
    citedAs: string
    note: string | null
    entries: AuthorizedAdjustment[]
}

/** A PROVISIONAL REALIZATION CHOICE of his for one goal's activity: cited, labelled provisional, never a mechanism. */
export interface ProvisionalChoice {
    category: 'PROVISIONAL_REALIZATION_CHOICE'
    choice: string
    ruledOn: string
    by: string
    citedAs: string
    /** His words, verbatim (non-adjacent passages joined by an ellipsis). */
    words: string
    /** Whether the activity can carry the choice now, and what it waits on — as for a manipulation. Added 15 October 2026. */
    status: ManipulationStatus
    gaps: string[]
    note: string | null
}

export interface LearningGoalAuthorization {
    learningGoalId: string
    contextId: string
    gameProblemId: string
    ruledOn: string
    by: string
    /** His ruling, verbatim, one paragraph per entry. */
    ruling: string[]
    /** Null: not yet evaluated (a gap). A list, empty included: the evaluation, whose reasoning is the finding. */
    authorizedConstraints: string[] | null
    authorizedConstraintsFinding: string
    /** His provisional choices for this goal's activity, each cited. Never read by selection. */
    provisionalChoices?: ProvisionalChoice[]
    /** What existing knowledge already authorizes for the activity (15 October 2026). Optional: a record may list none. */
    existingKnowledge?: ExistingKnowledgeRecord[]
    /** The decisions and capabilities its entries wait on, defined once (15 October 2026). Optional where none is named. */
    gaps?: RecordGapDefinition[]
    excluded: AuthorizationExclusion[]
    manipulations: ManipulationRecord[]
    /**
     * **The provisional realization this goal's activity is built with, by id** (15 October 2026, stage K2), or absent.
     * Christian, reply filed 17 October 2026: *"without introducing unnecessary architecture or treating this first
     * realization as the canonical version of the Learning Goal."* The id names an entry of
     * `docs/audits/conformance/stage-b/provisional-realizations.json`; derivation adds that realization's items only for
     * a goal whose record names it (`derivationInputFor`), and the record itself still holds no value.
     */
    provisionalRealization?: string
    /** The adjustments he authorized for this goal's activity (15 October 2026, stage K4), or absent. */
    authorizedAdjustments?: AuthorizedAdjustments
}

const filled = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

/**
 * Everything wrong with a set of authorization records, as sentences. Empty means it may be loaded.
 *
 * Parameters other than the entries exist so a test can hand the gate a damaged copy; production passes none.
 */
export function validateLearningGoalAuthorizations(
    entries: LearningGoalAuthorization[],
    selectableIds: string[] = testLibraryRegistry.selectableConstraints().map((c) => c.id),
    holds: LearningDesignHold[] = learningGoalSelectionHolds(),
    provisionalIds: string[] = loadProvisionalRealizations().map((realization) => realization.provisionalId)
): string[] {
    const errors: string[] = []
    const selectable = new Set(selectableIds.map(knowledgeKey))
    const held = new Set(holds.map((hold) => knowledgeKey(hold.knowledgeId)))
    const seen = new Set<string>()
    for (const entry of entries) {
        const goal = entry.learningGoalId || '(no goal)'
        if (!filled(entry.learningGoalId)) errors.push('an authorization names no Learning Goal')
        if (seen.has(goal)) errors.push(`${goal}: more than one authorization record`)
        seen.add(goal)
        if (!filled(entry.ruledOn) || !filled(entry.by) || !Array.isArray(entry.ruling) || !entry.ruling.length || !entry.ruling.every(filled)) {
            errors.push(`${goal}: the record cites no ruling (ruledOn, by and his words are all required)`)
        }
        if (!filled(entry.contextId) || !filled(entry.gameProblemId)) errors.push(`${goal}: the record names no context or Game Problem`)
        if (!filled(entry.authorizedConstraintsFinding)) errors.push(`${goal}: the authorized set carries no finding`)
        // `undefined` is neither answer: a record that forgot the field would otherwise read as "not yet evaluated".
        if (entry.authorizedConstraints !== null && !Array.isArray(entry.authorizedConstraints)) {
            errors.push(`${goal}: authorizedConstraints must be a list (the evaluation) or null (not yet evaluated)`)
        }
        if ('zeroConstraintRuling' in (entry as object)) errors.push(`${goal}: a per-goal zero-constraint ruling is not read; the general principle governs every record alike`)
        // A record that names a provisional realization nobody can find would build the goal without the choices it asks for.
        if (entry.provisionalRealization !== undefined && (!filled(entry.provisionalRealization) || !provisionalIds.includes(String(entry.provisionalRealization)))) {
            errors.push(`${goal}: names the provisional realization ${entry.provisionalRealization}, which provisional-realizations.json does not hold`)
        }

        /**
         * **The gaps an entry waits on are defined once, in the record, and every name resolves** (15 October 2026).
         * A refusal names them, and the review page lists them with their descriptions; a name that resolves to
         * nothing would be a refusal citing a decision nobody can find.
         */
        const defined = new Set<string>()
        for (const [i, gap] of (entry.gaps ?? []).entries()) {
            if (!filled(gap.id) || !filled(gap.description) || !['DECISION', 'CAPABILITY'].includes(gap.kind)) {
                errors.push(`${goal}: gap ${i + 1} must have an id, a kind (DECISION or CAPABILITY) and a one-line description`)
            }
            if (defined.has(gap.id)) errors.push(`${goal}: the gap ${gap.id} is defined twice`)
            defined.add(gap.id)
        }
        for (const [i, known] of (entry.existingKnowledge ?? []).entries()) {
            if (known.category !== 'EXISTING_KNOWLEDGE_TO_VERIFY') errors.push(`${goal}: existing knowledge ${i + 1} is not labelled EXISTING_KNOWLEDGE_TO_VERIFY`)
            if (!filled(known.what) || !Array.isArray(known.sources) || !known.sources.length || !known.sources.every(filled)) {
                errors.push(`${goal}: existing knowledge ${i + 1} must say what is authorized and cite at least one source`)
            }
        }
        /**
         * **A status and its category must agree with each other and with what the entry names** (his item 10: keep
         * the categories distinct). A genuine gap is by definition not in place; a status that is a gap must name what
         * would supply it, and one that is not must name nothing; an authorization by his ruling is his choice, and an
         * authorization via the game form or the session is existing knowledge.
         */
        const statusErrors = (which: string, category: string, status: string, gaps: unknown): string[] => {
            const found: string[] = []
            if (!(MANIPULATION_STATUSES as readonly string[]).includes(status)) found.push(`${which} has the unknown status ${status}`)
            if (!Array.isArray(gaps)) return [...found, `${which} lists no gaps (an empty list says it waits on none)`]
            if (isGapStatus(status) && !gaps.length) found.push(`${which} is ${status} and names no decision or capability that would supply it`)
            if (!isGapStatus(status) && gaps.length) found.push(`${which} is ${status} and names gaps; only a missing entry waits on one`)
            for (const id of gaps) if (!defined.has(String(id))) found.push(`${which} names the gap ${id}, which the record does not define`)
            if (category === 'GENUINE_GAP' && !isGapStatus(status)) found.push(`${which} is a GENUINE_GAP with the status ${status}`)
            if (status === 'AUTHORIZED_BY_RULING' && category !== 'PROVISIONAL_REALIZATION_CHOICE') found.push(`${which} is AUTHORIZED_BY_RULING but not his PROVISIONAL_REALIZATION_CHOICE`)
            if (status === 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION' && category !== 'EXISTING_KNOWLEDGE_TO_VERIFY') found.push(`${which} is AUTHORIZED_VIA_GAME_FORM_OR_SESSION but not EXISTING_KNOWLEDGE_TO_VERIFY`)
            return found
        }
        for (const [i, choice] of (entry.provisionalChoices ?? []).entries()) {
            if (choice.category !== 'PROVISIONAL_REALIZATION_CHOICE') errors.push(`${goal}: provisional choice ${i + 1} is not labelled PROVISIONAL_REALIZATION_CHOICE`)
            if (!filled(choice.choice) || !filled(choice.ruledOn) || !filled(choice.by) || !filled(choice.citedAs) || !filled(choice.words)) {
                errors.push(`${goal}: provisional choice ${i + 1} must say what it is and cite who chose it, when, where and in his words`)
            }
            errors.push(...statusErrors(`${goal}: provisional choice ${i + 1}`, choice.category, choice.status, choice.gaps))
        }
        const authorized = new Set((entry.authorizedConstraints ?? []).map(knowledgeKey))
        for (const id of entry.authorizedConstraints ?? []) {
            if (!selectable.has(knowledgeKey(id))) errors.push(`${goal}: authorizes ${id}, which the selectable library does not hold`)
            if (held.has(knowledgeKey(id))) errors.push(`${goal}: authorizes ${id}, which a ruling holds out of Learning Goal selection`)
        }
        for (const exclusion of entry.excluded ?? []) {
            const id = exclusion.knowledgeId
            if (!selectable.has(knowledgeKey(id))) errors.push(`${goal}: excludes ${id}, which the selectable library does not hold`)
            if (authorized.has(knowledgeKey(id))) errors.push(`${goal}: ${id} is both authorized and excluded`)
            if (!filled(exclusion.ruledOn) || !filled(exclusion.by) || !filled(exclusion.ruling)) errors.push(`${goal}: the exclusion of ${id} cites no ruling`)
            // A cross-reference that points at nothing would leave the exclusion resting on a hold that is not there.
            if (exclusion.heldBy !== null && exclusion.heldBy !== undefined && !held.has(knowledgeKey(id))) {
                errors.push(`${goal}: the exclusion of ${id} cross-references ${exclusion.heldBy}, which does not hold it`)
            }
        }
        for (const [i, manipulation] of (entry.manipulations ?? []).entries()) {
            const which = `${goal}: manipulation ${i + 1} (${manipulation.phrase || 'no phrase'})`
            if (!filled(manipulation.phrase) || !filled(manipulation.phraseFrom)) errors.push(`${which} quotes no phrase or names no source for it`)
            if (!filled(manipulation.source)) errors.push(`${which} cites no source`)
            if (!filled(manipulation.statusBasis)) errors.push(`${which} gives no basis for its status`)
            if (!(ENTRY_CATEGORIES as readonly string[]).includes(manipulation.category)) errors.push(`${which} names no category of his (${manipulation.category})`)
            errors.push(...statusErrors(which, manipulation.category, manipulation.status, manipulation.gaps))
            if (!Array.isArray(manipulation.registerRows)) errors.push(`${which} lists no register rows (an empty list says it touches none)`)
        }
    }
    return errors
}

/**
 * Everything wrong with the recorded principle, as sentences. The rule sentence must be one of his own sentences
 * recorded beside it, so the principle cannot drift from his words without the file failing to load.
 */
export function validateLibraryConstraintPrinciple(principle: LibraryConstraintPrinciple | null | undefined): string[] {
    if (!principle) return ['the library-constraint principle is not recorded']
    const errors: string[] = []
    if (principle.category !== 'GENERAL_PRINCIPLE') errors.push('the library-constraint principle is not labelled GENERAL_PRINCIPLE')
    if (!filled(principle.ruledOn) || !filled(principle.by) || !filled(principle.citedAs)) errors.push('the library-constraint principle cites no ruling (ruledOn, by and citedAs are all required)')
    if (!filled(principle.principle)) errors.push('the library-constraint principle states no rule')
    if (!Array.isArray(principle.words) || !principle.words.every(filled) || !principle.words.includes(principle.principle)) {
        errors.push('the library-constraint principle is not one of his recorded sentences')
    }
    if (!filled(principle.appliedAs)) errors.push('the library-constraint principle does not say how it is applied')
    return errors
}

/**
 * **His allocation principle, held to the same gate as the library-constraint principle** (15 October 2026, stage K4): its
 * rule sentence must be one of his recorded sentences, so it cannot drift from his words without the file failing to load.
 */
export function validateAllocationPrinciple(principle: LibraryConstraintPrinciple | null | undefined): string[] {
    return validateLibraryConstraintPrinciple(principle).map(error => error.replace('the library-constraint principle', 'the allocation principle'))
}

/**
 * Everything wrong with the context-manipulation relationships, and with what cites them, as sentences (15 October 2026,
 * stage K4). A relationship must say what it links, which rows it authorizes, who identified it and — where it is
 * CONFIRMED — who confirmed it, when and in his words. Every provisional realization item that cites one (`authorizedBy`)
 * must name a relationship that exists, for the context that realization realizes, authorizing the item's row; every
 * authorized adjustment must name one that exists. A citation that resolves to nothing would let a requirement defer on
 * nobody's word. Parameters exist so a test can hand the gate a damaged copy.
 */
export function validateContextManipulationRelationships(
    relationships: ContextManipulationRelationship[] | undefined,
    records: LearningGoalAuthorization[],
    provisional: ProvisionalRealization[] = loadProvisionalRealizations(),
): string[] {
    const errors: string[] = []
    const list = relationships ?? []
    if (!Array.isArray(list)) return ['contextManipulationRelationships must be a list']
    const byId = new Map<string, ContextManipulationRelationship>()
    for (const [i, entry] of list.entries()) {
        const which = `relationship ${entry?.id || i + 1}`
        if (!filled(entry?.id)) errors.push(`relationship ${i + 1} has no id`)
        if (byId.has(entry.id)) errors.push(`${which} is defined twice`)
        byId.set(entry.id, entry)
        if (entry.category !== 'EXISTING_KNOWLEDGE_RELATIONSHIP') errors.push(`${which} is not labelled EXISTING_KNOWLEDGE_RELATIONSHIP`)
        if (!filled(entry.contextId) || !filled(entry.manipulationId) || !filled(entry.manipulationStatus)) errors.push(`${which} must name its context, its manipulation and the manipulation's status`)
        if (!Array.isArray(entry.rows) || !entry.rows.length || !entry.rows.every(filled)) errors.push(`${which} authorizes no register row`)
        if (!Array.isArray(entry.via) || !entry.via.length || !entry.via.every(filled)) errors.push(`${which} names nothing the relationship runs through (via)`)
        if (!filled(entry.identified)) errors.push(`${which} does not say who identified it`)
        if (entry.status !== 'IDENTIFIED' && entry.status !== 'CONFIRMED') errors.push(`${which} has the unknown status ${entry.status}`)
        if (entry.status === 'CONFIRMED' && (!filled(entry.confirmedOn) || !filled(entry.confirmedBy) || !filled(entry.citedAs) || !Array.isArray(entry.words) || !entry.words.length || !entry.words.every(filled))) {
            errors.push(`${which} is CONFIRMED and does not say who confirmed it, when, where and in his words`)
        }
    }
    for (const realization of provisional) {
        for (const item of realization.items) {
            if (item.authorizedBy === undefined) continue
            const at = `${realization.contractId}::${item.itemId}`
            const relationship = typeof item.authorizedBy === 'string' ? byId.get(item.authorizedBy) : undefined
            if (!relationship) {
                errors.push(`${at} cites the relationship ${JSON.stringify(item.authorizedBy)}, which contextManipulationRelationships does not hold`)
                continue
            }
            if (relationship.contextId !== realization.realizes) errors.push(`${at} cites ${relationship.id}, a relationship of ${relationship.contextId}, while its realization realizes ${realization.realizes}`)
            if (!relationship.rows.includes(String(item.row))) errors.push(`${at} is on ${String(item.row)}, which ${relationship.id} does not authorize`)
        }
    }
    for (const entry of records) {
        const adjustments = entry.authorizedAdjustments
        if (adjustments === undefined) continue
        const goal = entry.learningGoalId
        if (!Array.isArray(adjustments.words) || !adjustments.words.length || !adjustments.words.every(filled) || !filled(adjustments.citedAs)) errors.push(`${goal}: the authorized adjustments quote none of his words`)
        const seen = new Set<string>()
        for (const [i, adjustment] of (Array.isArray(adjustments.entries) ? adjustments.entries : []).entries()) {
            const which = `${goal}: adjustment ${adjustment?.id || i + 1}`
            if (!filled(adjustment.id) || seen.has(adjustment.id)) errors.push(`${which} has no id, or one used twice`)
            seen.add(adjustment.id)
            if (adjustment.category !== 'PROVISIONAL_REALIZATION_CHOICE') errors.push(`${which} is not labelled PROVISIONAL_REALIZATION_CHOICE`)
            if (!filled(adjustment.words) || !filled(adjustment.citedAs) || !filled(adjustment.ruledOn) || !filled(adjustment.by)) errors.push(`${which} must quote him and say who ruled it, when and where`)
            if (adjustment.consequence !== null && !filled(adjustment.consequence)) errors.push(`${which} gives a consequence that is not his sentence`)
            if (!byId.has(adjustment.relationship)) errors.push(`${which} names the relationship ${adjustment.relationship}, which contextManipulationRelationships does not hold`)
            if (!filled(adjustment.role) || !filled(adjustment.parameter)) errors.push(`${which} must name the role whose team it changes and the parameter it moves`)
        }
        if (!Array.isArray(adjustments.entries) || !adjustments.entries.length) errors.push(`${goal}: authorizedAdjustments lists no adjustment`)
    }
    return errors
}

const RECORDS = record.authorizations as LearningGoalAuthorization[]
const PRINCIPLE = (record as { libraryConstraintPrinciple?: LibraryConstraintPrinciple }).libraryConstraintPrinciple ?? null
const ALLOCATION_PRINCIPLE = (record as { allocationPrinciple?: LibraryConstraintPrinciple }).allocationPrinciple ?? null
const RELATIONSHIPS = ((record as { contextManipulationRelationships?: ContextManipulationRelationship[] }).contextManipulationRelationships ?? []) as ContextManipulationRelationship[]
{
    const errors = [
        ...validateLibraryConstraintPrinciple(PRINCIPLE),
        ...validateAllocationPrinciple(ALLOCATION_PRINCIPLE),
        ...validateLearningGoalAuthorizations(RECORDS),
        ...validateContextManipulationRelationships(RELATIONSHIPS, RECORDS),
    ]
    if (errors.length) throw new Error(`learning-goal-authorizations.json failed its integrity gate: ${errors.join(' | ')}`)
}

/** His allocation principle (17 October 2026, D6), as a copy. */
export function allocationPrinciple(): LibraryConstraintPrinciple {
    return JSON.parse(JSON.stringify(ALLOCATION_PRINCIPLE)) as LibraryConstraintPrinciple
}

/** The context-manipulation relationships, as copies: what a realization may cite (`realization-deferral.ts`). */
export function contextManipulationRelationships(): ContextManipulationRelationship[] {
    return JSON.parse(JSON.stringify(RELATIONSHIPS)) as ContextManipulationRelationship[]
}

/** His general principle on library constraints, as a copy: what an evaluated, empty authorized set is read under. */
export function libraryConstraintPrinciple(): LibraryConstraintPrinciple {
    return JSON.parse(JSON.stringify(PRINCIPLE)) as LibraryConstraintPrinciple
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Every authorization record, as copies, so no caller can edit a ruling in place. */
export function learningGoalAuthorizations(): LearningGoalAuthorization[] {
    return copy(RECORDS)
}

/** The record for one goal, as a copy, or null where the goal has none (its candidates then come from vocabulary). */
export function learningGoalAuthorization(learningGoalId: string, records: LearningGoalAuthorization[] = RECORDS): LearningGoalAuthorization | null {
    const found = records.find((entry) => entry.learningGoalId === learningGoalId)
    return found ? copy(found) : null
}

/** How an entry is named in a refusal and on the review page: his phrase and its aspect, or the choice as recorded. */
const manipulationLabel = (manipulation: ManipulationRecord): string => (manipulation.aspect ? `${manipulation.phrase} — ${manipulation.aspect}` : manipulation.phrase)

/** One record entry the activity needs that is not in place, with the decisions and capabilities that would supply it. */
export interface NeededRecordGap {
    from: 'manipulation' | 'provisional choice'
    label: string
    category: string
    status: (typeof GAP_STATUSES)[number]
    gaps: RecordGapDefinition[]
}

/**
 * **Every entry of a record that the activity needs and does not have** — added 15 October 2026 (stage H3).
 *
 * Christian, 16 October reply, item 10: *"if the existing game form cannot represent the intended learning
 * environment, I would rather see a clear refusal and a narrowly described gap than an activity that is technically
 * valid but solves a different problem."* A record entry whose status is `MISSING_KNOWLEDGE` or `MISSING_CAPABILITY`
 * says exactly that about one part of the activity his rulings ask for, so the build refuses on it, naming each one.
 * Read from the record and nothing else: no goal is named here, and a record with no such entry yields nothing.
 */
export function neededRecordGaps(record: LearningGoalAuthorization): NeededRecordGap[] {
    const defined = new Map((record.gaps ?? []).map(gap => [gap.id, gap]))
    const resolve = (ids: string[]): RecordGapDefinition[] => ids.map(id => copy(defined.get(id) ?? { id, kind: 'DECISION' as const, description: '(not defined in the record)', note: null }))
    return [
        ...record.manipulations
            .filter(manipulation => isGapStatus(manipulation.status))
            .map(manipulation => ({ from: 'manipulation' as const, label: manipulationLabel(manipulation), category: manipulation.category, status: manipulation.status as NeededRecordGap['status'], gaps: resolve(manipulation.gaps) })),
        ...(record.provisionalChoices ?? [])
            .filter(choice => isGapStatus(choice.status))
            .map(choice => ({ from: 'provisional choice' as const, label: choice.choice, category: choice.category, status: choice.status as NeededRecordGap['status'], gaps: resolve(choice.gaps) })),
    ]
}

/** One line of the review page's three lists, each field copied from the record. */
export interface AuthorizationListEntry {
    from: 'existing knowledge' | 'manipulation' | 'provisional choice' | 'provisional realization'
    label: string
    /** His words and where he said them, for a provisional choice; null otherwise. */
    words: string | null
    citedAs: string | null
    /** The sources that carry it (existing knowledge), or the basis the record gives for its status. */
    sources: string[]
    status: string | null
    gaps: string[]
    note: string | null
}

/**
 * **The three lists his 16 October reply asks the next review to keep apart** (stage H3): *"It should also distinguish
 * what was authorized by existing knowledge from what remains a provisional design choice."* — and, from item 10, the
 * gaps. Each list is the record's own entries, sorted by the category the record gives them; no sentence is written
 * here.
 *
 *   - AUTHORIZED BY EXISTING KNOWLEDGE: `existingKnowledge`, then the manipulations authorized via the game form or
 *     the session, each with its sources.
 *   - PROVISIONAL CHOICES (his, cited): `provisionalChoices`, then the manipulations whose category is his choice.
 *   - GAPS: each decision and capability the record defines, with its one-line description and the entries that
 *     wait on it (none, where it waits on the context's own lines rather than on an entry here).
 */
export interface AuthorizationLists {
    authorizedByExistingKnowledge: AuthorizationListEntry[]
    provisionalChoices: AuthorizationListEntry[]
    gaps: (RecordGapDefinition & { neededBy: string[] })[]
}

/**
 * `provisional` (15 October 2026, stage K2) is the provisional realization the record names, as derivation received it:
 * each of its items whose category is his provisional choice joins the PROVISIONAL CHOICES list, cited by its contract
 * item, so the review page reads the category from the items that shape the game rather than from a second copy. Null
 * where the record names none, and then the lists are exactly what they were.
 */
export function authorizationLists(record: LearningGoalAuthorization, provisional: ProvisionalRealization | null = null): AuthorizationLists {
    const fromManipulation = (manipulation: ManipulationRecord): AuthorizationListEntry => ({
        from: 'manipulation',
        label: manipulationLabel(manipulation),
        words: null,
        citedAs: null,
        sources: [manipulation.statusBasis],
        status: manipulation.status,
        gaps: [...manipulation.gaps],
        note: manipulation.note,
    })
    const needing = neededRecordGaps(record)
    return {
        authorizedByExistingKnowledge: [
            ...(record.existingKnowledge ?? []).map(known => ({ from: 'existing knowledge' as const, label: known.what, words: null, citedAs: null, sources: [...known.sources], status: null, gaps: [], note: known.note })),
            ...record.manipulations.filter(manipulation => manipulation.category === 'EXISTING_KNOWLEDGE_TO_VERIFY' && manipulation.status === 'AUTHORIZED_VIA_GAME_FORM_OR_SESSION').map(fromManipulation),
        ],
        provisionalChoices: [
            ...(record.provisionalChoices ?? []).map(choice => ({
                from: 'provisional choice' as const,
                label: choice.choice,
                words: choice.words,
                citedAs: choice.citedAs,
                sources: [],
                status: choice.status,
                gaps: [...choice.gaps],
                note: choice.note,
            })),
            ...record.manipulations.filter(manipulation => manipulation.category === 'PROVISIONAL_REALIZATION_CHOICE').map(fromManipulation),
            ...(provisional?.items ?? [])
                .filter(item => item.category === PROVISIONAL_REALIZATION_CHOICE)
                .map(item => {
                    const authored = item as unknown as { choice?: unknown; words?: unknown; citedAs?: unknown; note?: unknown }
                    return {
                        from: 'provisional realization' as const,
                        label: String(authored.choice ?? item.itemId),
                        words: typeof authored.words === 'string' ? authored.words : null,
                        citedAs: typeof authored.citedAs === 'string' ? authored.citedAs : null,
                        sources: [`${provisional!.contractId}::${item.itemId}`],
                        status: null,
                        gaps: [],
                        note: typeof authored.note === 'string' ? authored.note : null,
                    }
                }),
        ],
        gaps: (record.gaps ?? []).map(gap => ({ ...copy(gap), neededBy: needing.filter(entry => entry.gaps.some(named => named.id === gap.id)).map(entry => entry.label) })),
    }
}
