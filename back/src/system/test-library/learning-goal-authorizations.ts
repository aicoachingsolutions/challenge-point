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
import { loadProvisionalRealizations, loadRegister, PROVISIONAL_REALIZATION_CHOICE } from '../derivation/corpus'
import { knowledgeKey } from '../derivation/knowledge-key'
import { indexRegister } from '../derivation/register'
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
    /**
     * **His words settling it, where he has** — stage M4, 17 October 2026 (design step L11). His reply filed 17 October 2026 asked for
     * *"Provenance distinguishing approved knowledge, provisional realization choices, and any remaining gaps."*, and by 19 October every
     * decision and capability the record named had been ruled on; the review page listed them all as "still needed" because nothing
     * marked one settled, and no entry waiting on it (`neededBy` empty) cannot say so — a gap can wait on the context's own lines rather
     * than on an entry. So a gap is settled only by his cited words, never by an empty `neededBy`; the validator refuses settled words
     * on a gap an entry still waits on, and the page splits the list into still needed and settled.
     */
    settledBy?: { words: string; citedAs: string }[]
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
 * **A context's scoring relationship** — stage A, 22 October 2026 (the design's X3: *"The pressing role's event (B9) and its objective
 * reference (J2): a context SCORING relationship."*). Christian, reply filed 25 October 2026, item 2: *"preserving structural validation
 * and knowledge authorization."* Context-level, like a manipulation relationship: it names no goal; `rows` are the register rows a
 * realization citing it may author; it authorizes something only once `status` is CONFIRMED. Held in the records' optional
 * `contextScoringRelationships` list, which held no entry on 22 October 2026 and holds one since Stage F (26 October 2026: one role of one
 * context scoring by an event of its own, his reply filed 26 October 2026, item 1, and his reply filed 25 October 2026, item 3).
 * Validated with the manipulation relationships, and passed with them wherever relationships are read (`contextRelationships`).
 */
export interface ContextScoringRelationship {
    id: string
    category: 'CONTEXT_SCORING_RELATIONSHIP'
    contextId: string
    contextName: string
    /**
     * The one scoring event the relationship authorizes: a member of the register's scoring-event vocabulary (`roleScoring.kindVocabulary`),
     * checked at load (stage A review fix). `applyRoleYields` counts an item writing a role's own event as citing it only where the item
     * writes exactly this event.
     */
    scoringEvent: string
    /**
     * The one role it is confirmed for: a member of the register's role vocabulary (`roleBlocks.roles`), checked at load (stage A review
     * fix; the design's K3: *"authorizing rows B9 and J2 for the pressing role only"*). GA-ROLE-EVENTS clause 6 lets it stand only for
     * that role's event and objective reference. OUR READING of K3's scope, recorded as a field so it is never inferred.
     */
    role: string
    rows: string[]
    via: string[]
    identified: string
    status: 'IDENTIFIED' | 'CONFIRMED'
    confirmedOn: string | null
    confirmedBy: string | null
    citedAs: string
    words: string[]
    note: string | null
    /**
     * The items (`contractId::itemId`) a CONFIRMED relationship names as superseded for its one role (stage A, 22 October 2026; read by
     * `realization-deferral.ts` `applyRoleYields`). Only a scoring relationship may name them (a manipulation relationship names no event or
     * role it authorizes, so what it superseded could never stand, and the validator refuses it there).
     */
    supersedes?: string[]
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
    /**
     * **Our DRAFT coach wording for the choice, where his words are not themselves a choice a coach can be given** — stage K7, 15
     * October 2026. His 18 October item 3, *"The pressure reference should be adjustable in either direction."*, authorizes an
     * adjustment and is not an instruction; the renderer puts an adjustment to the coach as "You may choose to …", which needs an
     * action. Optional and never his: `words` stays his sentence, verbatim, and is what the review cites as the authority. Absent on
     * an entry whose own words are the action (his D6 list).
     */
    coachWords?: string
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
    /*
     * Stage 2D (21 October 2026) added `value` (a code a reader acts on, `PROVISIONAL_CHOICE_VALUES`, one member: MARK_UNION_ONCE) and
     * `appliesTo` (the area his reply filed 22 October 2026, item 7, scoped it to). Stage 2G removed both, with the one entry that carried
     * them: his reply filed 23 October 2026, item 2, *"This should be a general presentation rule, not something requiring my approval for
     * each configuration."* Marking once is decided by `rendering/physical-layout.ts` from the blocks themselves; the loader refuses either
     * field (below), so a per-configuration record cannot come back unread.
     */
}

/**
 * **The evidence sections a review request may point at** — stage K8, 15 October 2026. Named by the review evidence
 * (`rendering/review-evidence.ts`), which fills each from the game; listed here so the record's loader can refuse a section no
 * reader fills. Engine vocabulary, never his words.
 */
export const REVIEW_SECTIONS = ['ALLOCATION', 'SPECIALIZED_ROLES', 'SPATIAL', 'PRESSURE', 'SCORING', 'RESTARTS', 'ROLE_EXCHANGE', 'INSTRUCTIONS', 'PROVENANCE', 'STRUCTURE', 'NO_PRESCRIPTION', 'FLAGS', 'RATIONALE'] as const
export type ReviewSection = (typeof REVIEW_SECTIONS)[number]
/** His three layers (reply filed 18 October 2026, item 7), as codes; the words are read from the record. */
export const REVIEW_LAYERS = ['GENERAL_ENGINE_MECHANISM', 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', 'ACTIVITY_REALIZATION_CHOICE'] as const
export type ReviewLayer = (typeof REVIEW_LAYERS)[number]
/** The two cases he asked to see flagged, each an analysis the review evidence makes from the game and never a rule. */
export const REVIEW_FLAG_KINDS = ['ADVANCED_POSITIONING', 'REGAIN_INSIDE_TARGET'] as const
export type ReviewFlagKind = (typeof REVIEW_FLAG_KINDS)[number]
/**
 * **The flag kinds a ruling of his can settle, because the review evidence reads the game for what the ruling put there** — stage M3,
 * 17 October 2026 (design step L7). His reply filed 19 October 2026, item 2, settles the regain case provisionally; the evidence then
 * shows it SETTLED only where every block holds the element carrying it (`review-evidence.ts`). A kind whose evidence reads no such
 * element cannot be settled by words alone, so `settledBy` on it is refused.
 */
export const SETTLEABLE_FLAG_KINDS: readonly ReviewFlagKind[] = ['REGAIN_INSIDE_TARGET']
/**
 * **The limitations he asked to keep visible, by what the evidence reads for each** — stage M3, 17 October 2026 (design step L7). His
 * reply filed 19 October 2026, item 5: *"The second-[specialized role] case and optional rotation can remain visible as limitations for
 * now."* (the role bracketed for the coupling ratchet; the record quotes him whole),
 * the advanced-positioning case he acknowledged there, and the live application. Engine vocabulary, never his words:
 *
 *   - `SPECIALIZED_PERFORMERS_BEYOND_ROLE`: performers of a specialized role the session has beyond those the teams' counts of that
 *     role hold (read per block from the game), and who moves at an exchange;
 *   - `FLAGGED_CASE`: a case one of the request's flags analyses (the flag's own status and answer);
 *   - `CHECKED_PATHWAY_ONLY`: the activity is built through the checked review pathway, with what the live route does with it (the pathway
 *     facts). Since 22 October 2026 (the live-app fix) the live route builds a record-backed selection through that same pathway, so the fact
 *     read for it says so; his words, which describe the state before, are kept as provenance. The kind's name is unchanged.
 */
export const REVIEW_LIMITATION_KINDS = ['SPECIALIZED_PERFORMERS_BEYOND_ROLE', 'FLAGGED_CASE', 'CHECKED_PATHWAY_ONLY'] as const
export type ReviewLimitationKind = (typeof REVIEW_LIMITATION_KINDS)[number]

/** One of his sentences with where he said it. */
export interface CitedWords {
    words: string
    citedAs: string
}

/**
 * **What he asked the next review of this goal's activity to show, in his words** — stage K8, 15 October 2026. His reply filed 17
 * October 2026, *"Next review and acceptance evidence"* (the nine items, the structural consistency, the specialized player as a
 * deep support option, no prescribed patterns), and his reply filed 18 October 2026 (item 6, the flag; item 7, the three layers and
 * the checked pathway; item 8, the points he will evaluate as a coach). Read only by the review evidence for an administrator's
 * review; never by selection, derivation or rendering. Every `words` is his, verbatim; every row, check, section, role and feature
 * label is OURS (presentation), which is why each item must resolve to the game or name what is missing.
 */
export interface ReviewRequest {
    ruledOn: string
    by: string
    citedAs: string
    note: string | null
    layers: { citedAs: string; words: string; entries: { code: ReviewLayer; words: string }[] }
    items: { id: string; words: string; role: string | null; kind: 'GAME' | 'INSTRUCTIONS' | 'PROVENANCE'; rows: string[]; checks: string[]; sections: ReviewSection[] }[]
    requests: (CitedWords & { sections: ReviewSection[] })[]
    evaluation: { citedAs: string; words: string; points: { id: string; words: string; sections: ReviewSection[] }[] }
    /** `settledBy` (stage M3): his words settling the case, for a kind in SETTLEABLE_FLAG_KINDS only. */
    flags: { id: string; kind: ReviewFlagKind; role: string; words: CitedWords[]; settledBy?: CitedWords[] }[]
    /** What he asked to keep visible as limitations (stage M3), each in his words; `role` names a specialized role, `flag` a flag id. */
    limitations?: { id: string; kind: ReviewLimitationKind; role?: string; flag?: string; words: CitedWords[] }[]
    pathway: CitedWords
    judgement: { words: string[]; citedAs: string }
    rationale: { feature: string; words: CitedWords[]; statements: string[] }[]
}

/** Everything wrong with one review request, as sentences (stage K8). */
export function validateReviewRequest(goal: string, request: ReviewRequest): string[] {
    const errors: string[] = []
    const cited = (entry: CitedWords | undefined) => !!entry && filled(entry.words) && filled(entry.citedAs)
    const sectionsKnown = (sections: unknown) => Array.isArray(sections) && sections.length > 0 && sections.every(section => (REVIEW_SECTIONS as readonly string[]).includes(String(section)))
    if (!filled(request.ruledOn) || !filled(request.by) || !filled(request.citedAs)) errors.push(`${goal}: the review request cites no ruling (ruledOn, by and citedAs are required)`)
    const codes = (request.layers?.entries ?? []).map(entry => entry.code)
    if (!filled(request.layers?.words) || !filled(request.layers?.citedAs) || codes.length !== REVIEW_LAYERS.length || !REVIEW_LAYERS.every(code => codes.includes(code)) || !(request.layers?.entries ?? []).every(entry => filled(entry.words))) {
        errors.push(`${goal}: the review request must name his three layers once each, in his words`)
    }
    const ids = new Set<string>()
    for (const [i, item] of (request.items ?? []).entries()) {
        const which = `${goal}: review item ${i + 1}`
        if (!filled(item.id) || ids.has(item.id)) errors.push(`${which} has no id or repeats one`)
        ids.add(item.id)
        if (!filled(item.words)) errors.push(`${which} quotes nothing`)
        if (!['GAME', 'INSTRUCTIONS', 'PROVENANCE'].includes(item.kind)) errors.push(`${which} has the unknown kind ${item.kind}`)
        if (!Array.isArray(item.rows) || !Array.isArray(item.checks) || ![...item.rows, ...item.checks].every(filled)) errors.push(`${which} must list its rows and checks (empty lists say none)`)
        if (item.kind === 'GAME' && !item.rows.length) errors.push(`${which} is read from the game and names no register row`)
        if (item.role !== null && !filled(item.role)) errors.push(`${which} names an empty role`)
        if (!sectionsKnown(item.sections)) errors.push(`${which} points at no section the review evidence fills`)
    }
    if (!(request.items ?? []).length) errors.push(`${goal}: the review request lists no item`)
    for (const [i, entry] of (request.requests ?? []).entries()) if (!cited(entry) || !sectionsKnown(entry.sections)) errors.push(`${goal}: review request ${i + 1} must quote him, cite where and point at a section`)
    if (!filled(request.evaluation?.words) || !filled(request.evaluation?.citedAs) || !(request.evaluation?.points ?? []).length) errors.push(`${goal}: the evaluation points must quote him and cite where`)
    for (const [i, point] of (request.evaluation?.points ?? []).entries()) if (!filled(point.id) || !filled(point.words) || !sectionsKnown(point.sections)) errors.push(`${goal}: evaluation point ${i + 1} must have an id, his words and a section`)
    for (const [i, flag] of (request.flags ?? []).entries()) {
        if (!(REVIEW_FLAG_KINDS as readonly string[]).includes(flag.kind) || !filled(flag.id) || !filled(flag.role) || !(flag.words ?? []).length || !flag.words.every(cited)) {
            errors.push(`${goal}: flag ${i + 1} must be of a known kind, name a role and quote him with citations`)
        }
        // Stage M3: a ruling settling a flag is his words, cited, on a kind whose evidence reads the game for what it settles.
        if (flag.settledBy !== undefined) {
            if (!Array.isArray(flag.settledBy) || !flag.settledBy.length || !flag.settledBy.every(cited)) errors.push(`${goal}: flag ${i + 1} is settled by no cited words of his`)
            if (!SETTLEABLE_FLAG_KINDS.includes(flag.kind)) errors.push(`${goal}: flag ${i + 1} (${flag.kind}) is of a kind no ruling settles: the evidence reads nothing in the game for it`)
        }
    }
    const flagIds = new Set((request.flags ?? []).map(flag => flag.id))
    const limitationIds = new Set<string>()
    for (const [i, limitation] of (request.limitations ?? []).entries()) {
        const which = `${goal}: limitation ${i + 1}`
        if (!filled(limitation.id) || limitationIds.has(limitation.id)) errors.push(`${which} has no id or repeats one`)
        limitationIds.add(limitation.id)
        if (!(REVIEW_LIMITATION_KINDS as readonly string[]).includes(limitation.kind)) errors.push(`${which} has the unknown kind ${limitation.kind}`)
        if (!(limitation.words ?? []).length || !limitation.words.every(cited)) errors.push(`${which} must quote him with citations`)
        if (limitation.kind === 'SPECIALIZED_PERFORMERS_BEYOND_ROLE' && !filled(limitation.role)) errors.push(`${which} names no specialized role`)
        if (limitation.kind === 'FLAGGED_CASE' && !flagIds.has(String(limitation.flag))) errors.push(`${which} names the flag ${limitation.flag}, which the request does not hold`)
    }
    if (!cited(request.pathway)) errors.push(`${goal}: the review request must quote his words on the checked pathway`)
    if (!filled(request.judgement?.citedAs) || !(request.judgement?.words ?? []).length || !request.judgement.words.every(filled)) errors.push(`${goal}: the judgement must quote him`)
    for (const [i, entry] of (request.rationale ?? []).entries()) {
        if (!filled(entry.feature) || !(entry.words ?? []).length || !entry.words.every(cited) || !Array.isArray(entry.statements) || !entry.statements.every(filled)) {
            errors.push(`${goal}: rationale ${i + 1} must name the feature and quote only his reasons, each cited`)
        }
    }
    return errors
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
    /**
     * **The alternative realizations of this goal's activity, in the order he authorized them** (stage E, 23 October 2026), or absent. His
     * reply filed 25 October 2026, item 4: *"I approve retaining both alternatives."* *"These should be alternative knowledge-authorized
     * realizations, not separate hardcoded implementations of the same Learning Goal."* Item 3: *"My preference is to use the
     * physical-[object] version when an appropriate [object] and [specialized performer] are available and the selected realization supports
     * that relationship."* (His nouns bracketed for the coupling ratchet; the record quotes him whole.)
     *
     * Each entry names a realization of `provisional-realizations.json`, with his words for its place in the order. The build tries them in
     * that order and moves to the next ONLY where the one tried does not apply to the session (a typed applicability refusal); an entry whose
     * status is a gap (MISSING_KNOWLEDGE, MISSING_CAPABILITY) is listed, with what it waits on, and never tried. A record names its
     * realizations one way: `provisionalRealization` (one, read as a list of one) or this list, never both. No production record carried the
     * list on 23 October 2026. Since Stage F (his replies filed 25 and 26 October 2026) one record does: an alternative waiting on two
     * decisions of his first, so listed and never tried, then the realization that record named before, which is built exactly as it was.
     * AMENDED 24 October 2026 (K3): 'an alternative waiting on two decisions of his first, so listed and never tried' is no longer true. His
     * words settle every decision that alternative waited on (the record's `settledBy`, from his replies filed 26 and 27 October 2026), so it
     * waits on none and is tried first; the realization the record named before is tried second, only where the first does not apply to the
     * session (a typed applicability refusal).
     */
    realizations?: RealizationAlternativeRecord[]
    /** The adjustments he authorized for this goal's activity (15 October 2026, stage K4), or absent. */
    authorizedAdjustments?: AuthorizedAdjustments
    /** What he asked the next review of this goal's activity to show (stage K8, 15 October 2026), or absent. */
    reviewRequest?: ReviewRequest
    /**
     * **A record we drafted for his review** — B2, 28 October 2026 (E1-lite). Stamped only by the TEST-ONLY draft store (`draft-store.ts`) on
     * the record it loads; admitted only where the gate is told drafts are admitted, and then held to the ruling requirement INVERTED (no
     * ruling, no date, no ruler: nothing of ours may read as his). Absent on every production record, and a record carrying it in the
     * production file stops the server at load.
     */
    knowledgeStatus?: 'DRAFT'
}

/** One alternative realization as a record lists it (stage E): the realization, his words for its place, and whether it can be tried now. */
export interface RealizationAlternativeRecord {
    realization: string
    words: string
    citedAs: string
    /** Absent: the realization can be tried. A gap status: listed with what it waits on (`gaps`, defined in the record), never tried. */
    status?: ManipulationStatus
    gaps?: string[]
}

/** One alternative as the build reads it: from the list, or the record's single realization read as a list of one (stage E). */
export interface RealizationAlternative {
    realization: string
    /** His words and where he said them, from the list; null for a record's single realization, which names no order. */
    words: string | null
    citedAs: string | null
    /** False for an entry whose status is a gap: listed, never tried. */
    selectable: boolean
    status: string | null
    gaps: string[]
}

/**
 * **A record's realizations in the order the build tries them** (stage E, 23 October 2026), copied from the record: its ordered list, or its
 * single `provisionalRealization` read as a list of one (every production record on that day), or none. The one reader of which realization
 * a record names: derivation's default (`run-bounded-selection.ts` realizationOf), the build's loop and the account all read this.
 */
export function realizationAlternativesOf(record: Pick<LearningGoalAuthorization, 'provisionalRealization' | 'realizations'> | null | undefined): RealizationAlternative[] {
    if (!record) return []
    if (Array.isArray(record.realizations)) {
        return record.realizations.map(entry => ({
            realization: entry.realization,
            words: entry.words,
            citedAs: entry.citedAs,
            selectable: !(typeof entry.status === 'string' && isGapStatus(entry.status)),
            status: entry.status ?? null,
            // Read only as a list (after the third E2 review, 27 October 2026): the gate refuses any other value, and a value that is not
            // a list (`{}`, a number) made the gate's own call below throw ("is not iterable") instead of refusing. A record the gate admits
            // carries a list, null or nothing here, so this reads every admitted record exactly as `?? []` did.
            gaps: Array.isArray(entry.gaps) ? [...entry.gaps] : [],
        }))
    }
    return record.provisionalRealization ? [{ realization: record.provisionalRealization, words: null, citedAs: null, selectable: true, status: null, gaps: [] }] : []
}

const filled = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

/** A record (an object that is not a list), as the gate reads an entry: `null`, a word, a number or a list is none. */
const isRecord = (value: unknown): boolean => typeof value === 'object' && value !== null && !Array.isArray(value)

/** How an alternative realization waiting on a gap is named where the gap is listed (stage F): engine wording, never his. */
const alternativeLabel = (realization: unknown): string => `the alternative realization ${String(realization)}`

/**
 * Everything wrong with a set of authorization records, as sentences. Empty means it may be loaded.
 *
 * Parameters other than the entries exist so a test can hand the gate a damaged copy; production passes none.
 */
export function validateLearningGoalAuthorizations(
    entries: LearningGoalAuthorization[],
    selectableIds: string[] = testLibraryRegistry.selectableConstraints().map((c) => c.id),
    holds: LearningDesignHold[] = learningGoalSelectionHolds(),
    provisionalIds: string[] = loadProvisionalRealizations().map((realization) => realization.provisionalId),
    /**
     * B2 (28 October 2026), TEST-ONLY: whether a DRAFT record (one the draft store stamped `knowledgeStatus: 'DRAFT'`) is admitted. Only the
     * build given a draft store says so; the production gate at load passes nothing, so a DRAFT record in the production file is refused.
     */
    options: { draftsAdmitted?: boolean } = {}
): string[] {
    const errors: string[] = []
    const selectable = new Set(selectableIds.map(knowledgeKey))
    const held = new Set(holds.map((hold) => knowledgeKey(hold.knowledgeId)))
    const seen = new Set<string>()
    for (const entry of entries) {
        // After the third E2 review (27 October 2026): an entry of the list that is not a record (`null`, a word, a number) threw a TypeError
        // on `learningGoalId`. It is refused by the gate's existing sentence for an entry that names no goal, and read as no entry.
        if (!isRecord(entry)) {
            errors.push('an authorization names no Learning Goal')
            continue
        }
        const goal = entry.learningGoalId || '(no goal)'
        if (!filled(entry.learningGoalId)) errors.push('an authorization names no Learning Goal')
        if (seen.has(goal)) errors.push(`${goal}: more than one authorization record`)
        seen.add(goal)
        /**
         * **A DRAFT record: admitted only through the draft store, and then its ruling requirement is inverted, never skipped** (B2, 28 October
         * 2026; E1-lite). A record we drafted cites no ruling of his, so it must carry none: no words, no date, no ruler. Given TEST-ONLY ruling
         * words to pass the requirement below, it would read as his. Any other value of the marker is refused as well.
         */
        const draft = 'knowledgeStatus' in entry
        if (draft && (entry.knowledgeStatus !== 'DRAFT' || options.draftsAdmitted !== true)) {
            errors.push(`${goal}: a DRAFT record is read only through the TEST-ONLY draft store (knowledgeStatus ${JSON.stringify(entry.knowledgeStatus)})`)
        } else if (draft) {
            if (filled(entry.ruledOn) || filled(entry.by) || !Array.isArray(entry.ruling) || entry.ruling.length) {
                errors.push(`${goal}: a DRAFT record cites no ruling of his (ruledOn, by and his words must all be empty)`)
            }
        } else if (!filled(entry.ruledOn) || !filled(entry.by) || !Array.isArray(entry.ruling) || !entry.ruling.length || !entry.ruling.every(filled)) {
            errors.push(`${goal}: the record cites no ruling (ruledOn, by and his words are all required)`)
        }
        if (!filled(entry.contextId) || !filled(entry.gameProblemId)) errors.push(`${goal}: the record names no context or Game Problem`)
        if (!filled(entry.authorizedConstraintsFinding)) errors.push(`${goal}: the authorized set carries no finding`)
        // `undefined` is neither answer: a record that forgot the field would otherwise read as "not yet evaluated".
        if (entry.authorizedConstraints !== null && !Array.isArray(entry.authorizedConstraints)) {
            errors.push(`${goal}: authorizedConstraints must be a list (the evaluation) or null (not yet evaluated)`)
        }
        /**
         * **The manipulations are a list, an empty one included** (E2, 27 October 2026, a TIGHTENING). The type requires the field and
         * every reader dereferences it (`neededRecordGaps`, `authorizationLists`), while this gate read it with `?? []`, so a record copy
         * that left it out passed the gate and crashed the build with a TypeError. Refused here instead, as a register-row list is below.
         * The gate's own reads below take only a list (after the E2 review): a value present but not a list (`{}`, a word, a number) slipped
         * past `?? []` and crashed THIS gate with a TypeError instead of being refused by the sentence above.
         */
        if (!Array.isArray(entry.manipulations)) errors.push(`${goal}: lists no manipulations (an empty list says it records none)`)
        /**
         * **The exclusions are a list too, an empty one included** (after the third E2 review, 27 October 2026, a TIGHTENING). The type
         * requires the field and its readers dereference it without a fallback (`authorizationOf` in build-activity.ts, the review
         * evidence), while this gate read absent or null as "excludes none", so a record copy that left it out passed the gate and crashed
         * the build with a TypeError, as the manipulations did before E2. Refused here instead, absent, null or any value not a list alike.
         */
        if (!Array.isArray(entry.excluded)) errors.push(`${goal}: lists no exclusions (an empty list says it excludes none)`)
        /**
         * **The lists the gate reads entry by entry, read as lists and their entries as records** (after the second E2 review, 27 October
         * 2026, a TIGHTENING; completed after the third). Each case below crashed this gate with a TypeError (`m.status` of null, `.filter
         * is not a function`, `.map is not a function`, `realization` of null, `ruledOn` of null) or, for some words and numbers, was refused
         * by several sentences that each named a missing field instead of the value that was wrong:
         * - an entry that is not a record (`null`, a word, a number, a list) in the manipulations, the gaps, the provisional choices, the
         *   existing knowledge, the exclusions or the alternative realizations (below), or in the list of records itself (above);
         * - the gaps, the provisional choices, the existing knowledge or the authorized constraints present but not a list (`{}`, a word);
         * - a review request present but not a record (`null`, a word).
         * Each is refused by one sentence and an entry is read as no entry, its place in the list kept so later entries are numbered as the
         * record numbers them. Absent (or null) gaps, provisional choices or existing knowledge still say the record lists none, as before
         * and as their readers below take them (`?? []`); the manipulations and the exclusions, whose readers dereference them, must be lists
         * (above). Not covered: the lists inside a review request, read by `validateReviewRequest` as before.
         */
        const listed = <T>(field: string, value: unknown, absent: string): (T | null)[] => {
            if (value === undefined || value === null) return []
            if (!Array.isArray(value)) {
                errors.push(`${goal}: ${field} must be a list (${absent})`)
                return []
            }
            return value.map(element => (isRecord(element) ? (element as T) : null))
        }
        const manipulationEntries: (ManipulationRecord | null)[] = Array.isArray(entry.manipulations) ? entry.manipulations.map(m => (isRecord(m) ? m : null)) : []
        const manipulations = manipulationEntries.filter((m): m is ManipulationRecord => m !== null)
        const gapEntries = listed<RecordGapDefinition>('gaps', entry.gaps, 'absent says it defines none')
        const choiceEntries = listed<ProvisionalChoice>('provisionalChoices', entry.provisionalChoices, 'absent says it records none')
        const choices = choiceEntries.filter((c): c is ProvisionalChoice => c !== null)
        const knownEntries = listed<ExistingKnowledgeRecord>('existingKnowledge', entry.existingKnowledge, 'absent says it lists none')
        const exclusionEntries: (AuthorizationExclusion | null)[] = Array.isArray(entry.excluded) ? entry.excluded.map(e => (isRecord(e) ? e : null)) : []
        if ('zeroConstraintRuling' in (entry as object)) errors.push(`${goal}: a per-goal zero-constraint ruling is not read; the general principle governs every record alike`)
        // Stage K8: a review request that cannot be read whole would let the review evidence silently omit what he asked to see.
        if (entry.reviewRequest !== undefined) {
            if (!isRecord(entry.reviewRequest)) errors.push(`${goal}: the review request is not a record (absent says the record holds none)`)
            else errors.push(...validateReviewRequest(goal, entry.reviewRequest))
        }
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
        for (const [i, gap] of gapEntries.entries()) {
            if (gap === null || !filled(gap.id) || !filled(gap.description) || !['DECISION', 'CAPABILITY'].includes(gap.kind)) {
                errors.push(`${goal}: gap ${i + 1} must have an id, a kind (DECISION or CAPABILITY) and a one-line description`)
            }
            if (gap === null) continue
            if (defined.has(gap.id)) errors.push(`${goal}: the gap ${gap.id} is defined twice`)
            defined.add(gap.id)
            // Stage M4: settled only by his cited words, and never while an entry of the record still waits on it.
            if (gap.settledBy !== undefined) {
                if (!Array.isArray(gap.settledBy) || !gap.settledBy.length || !gap.settledBy.every(w => filled(w?.words) && filled(w?.citedAs))) errors.push(`${goal}: the gap ${gap.id} is settled by no cited words of his`)
                const waiting = [
                    ...manipulations.filter(m => isGapStatus(m.status) && Array.isArray(m.gaps) && m.gaps.includes(gap.id)).map(m => m.phrase),
                    ...choices.filter(c => isGapStatus(c.status) && Array.isArray(c.gaps) && c.gaps.includes(gap.id)).map(c => c.choice),
                    // Stage F (26 October 2026): an alternative realization listed waiting on the gap waits on it as an entry does.
                    ...(Array.isArray(entry.realizations) ? entry.realizations : [])
                        .filter(alternative => isGapStatus(String(alternative?.status)) && Array.isArray(alternative?.gaps) && alternative.gaps.includes(gap.id))
                        .map(alternative => alternativeLabel(alternative.realization)),
                ]
                if (waiting.length) errors.push(`${goal}: the gap ${gap.id} is marked settled, and ${waiting.join('; ')} still waits on it`)
            }
        }
        for (const [i, known] of knownEntries.entries()) {
            if (known === null) {
                errors.push(`${goal}: existing knowledge ${i + 1} must say what is authorized and cite at least one source`)
                continue
            }
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
        for (const [i, choice] of choiceEntries.entries()) {
            if (choice === null) {
                errors.push(`${goal}: provisional choice ${i + 1} must say what it is and cite who chose it, when, where and in his words`)
                continue
            }
            if (choice.category !== 'PROVISIONAL_REALIZATION_CHOICE') errors.push(`${goal}: provisional choice ${i + 1} is not labelled PROVISIONAL_REALIZATION_CHOICE`)
            if (!filled(choice.choice) || !filled(choice.ruledOn) || !filled(choice.by) || !filled(choice.citedAs) || !filled(choice.words)) {
                errors.push(`${goal}: provisional choice ${i + 1} must say what it is and cite who chose it, when, where and in his words`)
            }
            errors.push(...statusErrors(`${goal}: provisional choice ${i + 1}`, choice.category, choice.status, choice.gaps))
            /**
             * Stage 2G (21 October 2026), his reply filed 23 October 2026, item 2: *"This should be a general presentation rule, not something
             * requiring my approval for each configuration."* Stage 2D's code and area (`value`, `appliesTo`) are read by nothing any longer,
             * so a choice carrying either is refused: it would be a value acted on by nobody, or a per-configuration record his general rule
             * replaced. (Until stage 2G one code, MARK_UNION_ONCE, with exactly lengthM and widthM, was admitted for his ruling.)
             */
            if ('value' in choice || 'appliesTo' in choice) {
                errors.push(`${goal}: provisional choice ${i + 1} carries a code or an area a reader would act on (value, appliesTo); marking once is a general presentation rule since his reply filed 23 October 2026, item 2, and no reader acts on a choice per configuration`)
            }
        }
        /**
         * **The alternative realizations, read whole or refused** (stage E, 23 October 2026). A record names its realizations one way; the
         * list names each realization once, each one the provisional realizations hold, each with his words for its place in the order; an
         * entry's status, where given, follows the record's own rule (a gap status names what would supply it, any other names nothing), and
         * a list in which no entry can be tried is refused, because a goal whose record lists realizations and can build none of them is a gap
         * the record must say as an entry, not leave the build to discover.
         */
        if (entry.realizations !== undefined) {
            if (entry.provisionalRealization !== undefined) errors.push(`${goal}: names its realizations twice (provisionalRealization and realizations); a record names them one way`)
            const list = Array.isArray(entry.realizations) ? entry.realizations : []
            if (!list.length) errors.push(`${goal}: lists no realization in realizations (absent says it names none)`)
            const named = new Set<string>()
            const alternatives: RealizationAlternativeRecord[] = []
            for (const [i, alternative] of list.entries()) {
                const which = `${goal}: alternative realization ${i + 1}`
                if (!isRecord(alternative)) {
                    errors.push(`${which} names no realization and does not quote him for its place in the order`)
                    continue
                }
                alternatives.push(alternative)
                if (!filled(alternative?.realization) || !provisionalIds.includes(String(alternative.realization))) errors.push(`${which} names the provisional realization ${alternative?.realization}, which provisional-realizations.json does not hold`)
                if (named.has(String(alternative?.realization))) errors.push(`${which} names ${alternative.realization} a second time`)
                named.add(String(alternative?.realization))
                if (!filled(alternative?.words) || !filled(alternative?.citedAs)) errors.push(`${which} does not quote him for its place in the order (words and citedAs are required)`)
                if (alternative?.status !== undefined || alternative?.gaps !== undefined) {
                    // Tried (his ruling) or waiting on a gap: no other status says whether a realization can be tried.
                    if (alternative.status !== 'AUTHORIZED_BY_RULING' && !isGapStatus(String(alternative.status))) errors.push(`${which} has the status ${alternative.status}; an alternative is AUTHORIZED_BY_RULING or waits on a gap (${GAP_STATUSES.join(', ')})`)
                    errors.push(...statusErrors(which, 'PROVISIONAL_REALIZATION_CHOICE', String(alternative.status), alternative.gaps ?? []))
                }
            }
            // Read from the entries that are records: an entry that is not one is refused above and read as no entry.
            if (alternatives.length && !realizationAlternativesOf({ realizations: alternatives }).some(alternative => alternative.selectable)) errors.push(`${goal}: no alternative realization it lists can be tried (each waits on a gap)`)
        }

        // Read only as a list: a value that is not one is refused above ("must be a list"), and read as no list here.
        const authorizedIds = Array.isArray(entry.authorizedConstraints) ? entry.authorizedConstraints : []
        const authorized = new Set(authorizedIds.map(knowledgeKey))
        for (const id of authorizedIds) {
            if (!selectable.has(knowledgeKey(id))) errors.push(`${goal}: authorizes ${id}, which the selectable library does not hold`)
            if (held.has(knowledgeKey(id))) errors.push(`${goal}: authorizes ${id}, which a ruling holds out of Learning Goal selection`)
        }
        for (const [i, exclusion] of exclusionEntries.entries()) {
            if (exclusion === null) {
                errors.push(`${goal}: exclusion ${i + 1} names no knowledge and cites no ruling`)
                continue
            }
            const id = exclusion.knowledgeId
            if (!selectable.has(knowledgeKey(id))) errors.push(`${goal}: excludes ${id}, which the selectable library does not hold`)
            if (authorized.has(knowledgeKey(id))) errors.push(`${goal}: ${id} is both authorized and excluded`)
            if (!filled(exclusion.ruledOn) || !filled(exclusion.by) || !filled(exclusion.ruling)) errors.push(`${goal}: the exclusion of ${id} cites no ruling`)
            // A cross-reference that points at nothing would leave the exclusion resting on a hold that is not there.
            if (exclusion.heldBy !== null && exclusion.heldBy !== undefined && !held.has(knowledgeKey(id))) {
                errors.push(`${goal}: the exclusion of ${id} cross-references ${exclusion.heldBy}, which does not hold it`)
            }
        }
        for (const [i, manipulation] of manipulationEntries.entries()) {
            if (manipulation === null) {
                errors.push(`${goal}: manipulation ${i + 1} (no phrase) quotes no phrase or names no source for it`)
                continue
            }
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
    /**
     * Stage A, 22 October 2026: the records' context SCORING relationships, validated by the same rules beside the manipulation ones,
     * so a realization item may cite a relationship of either kind and every citation resolves against both (`contextRelationships`).
     */
    scoring: ContextScoringRelationship[] | undefined = [],
    /**
     * Stage A review fix: the register a scoring relationship's event and role are checked against (its scoring-event and role
     * vocabularies). Read only where a scoring relationship is given; a parameter only so a test can hand a damaged copy.
     */
    register?: unknown,
): string[] {
    const errors: string[] = []
    const list = relationships ?? []
    if (!Array.isArray(list)) return ['contextManipulationRelationships must be a list']
    const scoringList = scoring ?? []
    if (!Array.isArray(scoringList)) return ['contextScoringRelationships must be a list']
    const byId = new Map<string, ContextManipulationRelationship | ContextScoringRelationship>()
    /** What every relationship must say, whatever its kind (the manipulation rules since stage K4, shared since stage A). */
    const common = (entry: ContextManipulationRelationship | ContextScoringRelationship, which: string) => {
        if (!Array.isArray(entry.rows) || !entry.rows.length || !entry.rows.every(filled)) errors.push(`${which} authorizes no register row`)
        if (!Array.isArray(entry.via) || !entry.via.length || !entry.via.every(filled)) errors.push(`${which} names nothing the relationship runs through (via)`)
        if (!filled(entry.identified)) errors.push(`${which} does not say who identified it`)
        if (entry.status !== 'IDENTIFIED' && entry.status !== 'CONFIRMED') errors.push(`${which} has the unknown status ${entry.status}`)
        if (entry.status === 'CONFIRMED' && (!filled(entry.confirmedOn) || !filled(entry.confirmedBy) || !filled(entry.citedAs) || !Array.isArray(entry.words) || !entry.words.length || !entry.words.every(filled))) {
            errors.push(`${which} is CONFIRMED and does not say who confirmed it, when, where and in his words`)
        }
    }
    for (const [i, entry] of list.entries()) {
        const which = `relationship ${entry?.id || i + 1}`
        if (!filled(entry?.id)) errors.push(`relationship ${i + 1} has no id`)
        if (byId.has(entry.id)) errors.push(`${which} is defined twice`)
        byId.set(entry.id, entry)
        if (entry.category !== 'EXISTING_KNOWLEDGE_RELATIONSHIP') errors.push(`${which} is not labelled EXISTING_KNOWLEDGE_RELATIONSHIP`)
        if (!filled(entry.contextId) || !filled(entry.manipulationId) || !filled(entry.manipulationStatus)) errors.push(`${which} must name its context, its manipulation and the manipulation's status`)
        // Stage A review fix: only a scoring relationship, which names the event and the role it authorizes, may supersede items for one role.
        if ((entry as { supersedes?: unknown }).supersedes !== undefined) errors.push(`${which} names items it supersedes for one role, which only a context scoring relationship (naming the event and the role it authorizes) may`)
        common(entry, which)
    }
    // The register's vocabularies, read once and only where a scoring relationship is given (none is recorded on 22 October 2026).
    const vocabularies = scoringList.length ? indexRegister(register ?? loadRegister()) : null
    for (const [i, entry] of scoringList.entries()) {
        const which = `scoring relationship ${entry?.id || i + 1}`
        if (!filled(entry?.id)) errors.push(`scoring relationship ${i + 1} has no id`)
        if (byId.has(entry.id)) errors.push(`${which} is defined twice`)
        byId.set(entry.id, entry)
        if (entry.category !== 'CONTEXT_SCORING_RELATIONSHIP') errors.push(`${which} is not labelled CONTEXT_SCORING_RELATIONSHIP`)
        if (!filled(entry.contextId) || !filled(entry.scoringEvent)) errors.push(`${which} must name its context and the scoring event it authorizes`)
        /**
         * Stage A review fix: the event is one member of the register's scoring-event vocabulary, and the role one member of its role
         * vocabulary, so the relationship authorizes exactly one event for exactly one role (`applyRoleYields`, GA-ROLE-EVENTS clause 6).
         */
        const roleScoring = vocabularies?.roleScoring
        if (!roleScoring) errors.push(`${which} authorizes a scoring event, and the register holds no role-scoring block to read it by`)
        else if (filled(entry.scoringEvent) && !roleScoring.kinds.includes(entry.scoringEvent)) errors.push(`${which} authorizes the scoring event ${JSON.stringify(entry.scoringEvent)}, which is not a member of ${roleScoring.kindVocabulary}`)
        const roles = vocabularies?.roleBlocks?.roles ?? []
        if (!filled(entry.role) || !roles.includes(entry.role)) errors.push(`${which} must name the one role it is confirmed for, a member of the register's roles (${roles.join(', ') || 'none'}); it names ${JSON.stringify(entry.role)}`)
        // Stage A: what a relationship supersedes for its role names items, each as contractId::itemId (applyRoleYields matches them whole).
        if (entry.supersedes !== undefined && (!Array.isArray(entry.supersedes) || !entry.supersedes.length || !entry.supersedes.every(key => filled(key) && String(key).split('::').length === 2 && String(key).split('::').every(filled)))) {
            errors.push(`${which} names what it supersedes as something other than a list of items (contractId::itemId)`)
        }
        common(entry, which)
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
            if (adjustment.coachWords !== undefined && !filled(adjustment.coachWords)) errors.push(`${which} gives coach wording that says nothing`)
            // A manipulation relationship only (stage A review fix): the shared lookup above also holds scoring relationships, which no
            // adjustment of a team's numbers or space may rest on; until this fix an adjustment could have resolved to one.
            if (!list.some(relationship => relationship.id === adjustment.relationship)) errors.push(`${which} names the relationship ${adjustment.relationship}, which contextManipulationRelationships does not hold`)
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
// Stage A (22 October 2026): the optional list of context scoring relationships; the records hold none on that day.
const SCORING_RELATIONSHIPS = ((record as { contextScoringRelationships?: ContextScoringRelationship[] }).contextScoringRelationships ?? []) as ContextScoringRelationship[]
{
    const errors = [
        ...validateLibraryConstraintPrinciple(PRINCIPLE),
        ...validateAllocationPrinciple(ALLOCATION_PRINCIPLE),
        ...validateLearningGoalAuthorizations(RECORDS),
        ...validateContextManipulationRelationships(RELATIONSHIPS, RECORDS, undefined, SCORING_RELATIONSHIPS),
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

/** The context scoring relationships, as copies (stage A; none recorded on 22 October 2026). */
export function contextScoringRelationships(): ContextScoringRelationship[] {
    return JSON.parse(JSON.stringify(SCORING_RELATIONSHIPS)) as ContextScoringRelationship[]
}

/**
 * **Every context relationship the records hold, of every kind, as copies** — stage A, 22 October 2026 (the design's X3: *"The deferral's
 * input is kind-neutral ... Today it is fed only contextManipulationRelationships(). Feeding it every recorded kind is a general change."*).
 * What a realization item may cite (`authorizedBy`), read by the deferral and the role yields (`realization-deferral.ts`) and by the
 * allocation account. On 22 October 2026 this equals `contextManipulationRelationships()` entry for entry: no scoring relationship is
 * recorded.
 */
export function contextRelationships(): (ContextManipulationRelationship | ContextScoringRelationship)[] {
    return [...contextManipulationRelationships(), ...contextScoringRelationships()]
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
        /**
         * Stage F (26 October 2026): a gap an alternative realization is listed waiting on names that alternative among what needs it, so the
         * review page says what the decision would supply (the record's ordered realizations; his reply filed 25 October 2026, item 4). It
         * refuses nothing: an alternative waiting on a gap is never tried (`realizationAlternativesOf`), and `neededRecordGaps` - what refuses
         * the build - still reads the record's entries alone.
         */
        gaps: (record.gaps ?? []).map(gap => ({
            ...copy(gap),
            neededBy: [
                ...needing.filter(entry => entry.gaps.some(named => named.id === gap.id)).map(entry => entry.label),
                ...realizationAlternativesOf(record)
                    .filter(alternative => !alternative.selectable && alternative.gaps.includes(gap.id))
                    .map(alternative => alternativeLabel(alternative.realization)),
            ],
        })),
    }
}
