/**
 * **The requirement account: each requirement of the activity's context in the applicable set, part by part, in his four categories and
 * three standards — a report, of which the approved scoring condition's components are enforced** — 29 October 2026 (R-4 of the
 * specification, with the reviews' corrections, rounds 1 to 3b).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Each generated activity should be evaluated against the applicable, approved
 * context requirements, accounting for each component of a scoring condition rather than simply confirming that the condition exists."*
 * *"A requirement should not automatically count as satisfied merely because the coach could theoretically judge it."* *"Missing components
 * of approved scoring conditions should not silently pass."* And *"let's verify the classifications before enabling refusals broadly"*. So
 * this reads; the account itself refuses nothing, scores nothing, is no selection input, and reaches no coach: the build attaches it only to
 * an administrator's review build (`build-activity.ts` `requirementAccount`), and a CI test holds every production-contracted context's
 * builds to it (`requirement-scoring-gate.unit.ts`).
 *
 * **One reading is enforced** (29 October 2026, round 3). His reply filed 4 November 2026, item 7: *"I approve beginning narrowly with missing or
 * altered components of approved scoring conditions, where those components are clearly defined, structurally necessary, and mechanically
 * verifiable."* *"I would not yet extend refusal to every unsupported purpose statement, inferred affordance relationship, or coach-observed
 * condition."* So on every build of a production-contracted context that reaches the context-scoring guard, on every route, the build reads
 * the approved scoring condition's components alone (`only: 'ENFORCED'`, so a coach's build computes nothing else) and
 * `scoringComponentReading` names each structural part of that row quoting his words (a SCORING_CONDITION_COMPONENT, or a guard or pattern
 * part given a span of his row) that is not carried — missing, altered (a pinned value or scope), not governing, or not on the same
 * referent — and any words of his row that no part classifies; the build refuses on them at the validation stage. A component classified
 * only for coach observation is reported, never refused (round 3b, the round-3 review's R2 M1). Where the components cannot be verified
 * (bindings unreadable, or refused where the enforcement reads them; a reader or check that fails, is absent or does not decide; a scoring
 * condition not classified) the build refuses too: a verification failure, the safeguard he approved (round 4, his reply filed 5 November
 * 2026, item 1: *"I approve retaining the safeguard that refuses a checked activity when an essential scoring-condition component cannot be
 * verified."*). Each finding names its class in his distinction — *"Missing or altered requirement"*, *"Verification failure"* — and the
 * account carries them apart (`EnforcementFailure`); which cause falls in which class is our DRAFT reading. Which parts are such components
 * is our DRAFT reading (`SCORING_ENFORCEMENT`); every other part is reported, not enforced.
 *
 * **Satisfied, and where its authority originates** (round 3; his reply filed 4 November 2026, item 2: *"Those are two complementary pieces
 * of information, not competing classifications."*): every part carries both, beside his four categories, which are unchanged.
 *
 * **What it reads, per block, right after the context-scoring guard** — the same realized game, the same readings: the block's derivation
 * input contracts (deferrals and role yields applied), the forward results, element classes and line verdicts derivation computed, the
 * concrete game after relative counts, the episode check rerun on it, and the guard's own readings of each condition and of the event kind
 * (`context-scoring-guard.ts` `conditionReadingOf`, `eventKindReadingOf`: one reading, no second copy). The bindings (`requirement-bindings.ts`)
 * say which items to look for, by register row, selector term, requirement, strictness, scope and value; never by id.
 *
 * **When an item carries a requirement** (our DRAFT rule, restated in the bindings, which can never loosen it):
 *   - its basis is AUTHORED or OWNER_RULING — our extension of the engine's record of his SD-83 ruling of 25 September, *"EXCLUSION, ASSUMED,
 *     ENGINE_ONLY, and OUTSIDE_BOUNDARY contributions do not establish existence."* (`derive.ts`), from establishing an element to carrying a
 *     requirement;
 *   - its forward result is SATISFIED, and its value and scope are the ones the pattern pins (round 2: a component pins what his approved
 *     knowledge carries, so an altered value or scope reads 4);
 *   - it survives into the finished game: an existence's own element is there (or what a recorded identification lets stand for it); a
 *     value's reached line is entailed, on a class holding the pattern's terms, whose element is there (the R-engine review's S2), and the
 *     value the finished game holds at it is the value authored (the R-rulings review's M1: "explicitly represented in the finished activity"
 *     is read in the finished activity, not by presence); an exclusion holds per derivation, flagged vacuous where nothing of its row is in the
 *     game at all (S1) and flagged as not re-read in the finished game (round 2, R1 NIT 3);
 *   - from the game form's contract, only where his workbook relates the context to that game form (ACTIVE GAME_FORM);
 *   - for a component's condition, the guard's own reading governs, on the item's own element (stricter than the guard, which accepts any
 *     condition of the type; report only, so it loosens nothing).
 * An item matched outside those (a constraint's, the Sport Profile's, an ASSUMED one, an INERT one) is listed as considered with why, never
 * dropped (the R-engine review's S7).
 *
 * **His categories, as read here** (ours, DRAFT): 1 where a carrier sits in the context's or the realization's contract; 2 where every
 * carrier sits in the game form's, through his relationship; 3 for coach observation with an identified observable, which this account does
 * not count as satisfied — our DRAFT rule, read from his *"should not automatically count as satisfied merely because the coach could
 * theoretically judge it"*, not his words; 4 where nothing carries, the guard's reading does not govern, the value, scope or referent is not
 * the one authored, coach observation has no observable (his category 3 needs one: the R-rulings review's S4), or the part is unsupported.
 * Whether 1 and 2 should instead be told apart by what the finished game shows rather than by the contract a carrier sits in is put to him.
 *
 * **Merging over blocks fails closed** (round 2, R3 S2): a block that lacks a part another block has reads 4 for it, never the favourable
 * value. **Each block's evidence is kept, once** (round 2, R3 S1): a block's parts are carried beside the merged parts only where they
 * differ from them; `partsIdenticalToMerged` counts the rest.
 *
 * Not read: the relevance trace (`relevance-trace.ts`), which is TEST-ONLY and stands on DRAFT join rules (the R-engine review's N10); and the
 * draft store's reader of scoring-condition rows (`draft-store.ts`), which is TEST-ONLY and which no production module may import (N1).
 *
 * Sport-neutral: rows, terms, kinds and values are data; no goal, context, team, line or sport term is written here.
 */
import { ItemOutcome } from '../derivation/forward'
import { CheckResult, EPISODE_SCOPES } from '../derivation/gates'
import { knowledgeKey } from '../derivation/knowledge-key'
import { RegisterIndex } from '../derivation/register'
import { CONDITION_ROW, splitPath } from '../derivation/resolved-game'
import { parseSelector } from '../derivation/selector'
import { beginConditionReferentOf, DRAFT_KNOWLEDGE, ElementClass, ForwardResult, LoadedContract, relationalReferentOf, structuralRefOf } from '../derivation/types'
import { PRIMARY_SCORING_CONDITION, rpcLibrary } from '../sport-module/rpc-library'
import { ConditionReading, conditionReadingOf, EPISODE_REACHABLE_CHECK, EventKindReading } from './context-scoring-guard'
import {
    applicableRows,
    BindingPart,
    BindingsMode,
    canonical,
    CarrierKind,
    ContextRow,
    contextRowsOf,
    ELIGIBLE_BASES,
    ItemPattern,
    KnowledgeRowCitation,
    ObservableSource,
    ReplyCitation,
    RequirementBindings,
    RequirementStandard,
    RowSheet,
    samePinnedValue,
    sameValue,
    selectorHolds,
    SPORT_PROFILE_PREFIX,
    termHeld,
} from './requirement-bindings'

export type AccountKind = 1 | 2 | 3 | 4
/** His four categories, verbatim (his reply filed 3 November 2026, section 2). */
export const HIS_ACCOUNTS: Record<AccountKind, string> = {
    1: 'Explicitly represented in the finished activity.',
    2: 'Supported through an authorized Game Form or other knowledge relationship.',
    3: 'Dependent on coach observation or judgment, with the relevant observable conditions identified.',
    4: 'Unsupported or missing.',
}
/** His three standards, verbatim (same reply). */
export const HIS_STANDARDS: Record<RequirementStandard, string> = {
    STRUCTURAL_VALIDITY: 'Structural validity: The required elements, conditions, and consequences are present.',
    LEARNING_DESIGN_RELEVANCE: 'Learning-design relevance: The environment has a grounded relationship to the intended Game Problem and affordances.',
    FIELD_EFFECTIVENESS: 'Field effectiveness: The activity actually provides the intended opportunities during play, requiring coach observation.',
}
export const HIS_WORDS_CITED_AS = 'his reply filed 3 November 2026, section 2' as const
/**
 * **Our rule for coach observation, kept apart from his words** (round 2, R2 M1): his category 3 is quoted as he wrote it, and our reading of
 * his hedge is said as ours — never in his voice, and no stronger than "in this account".
 */
export const COACH_OBSERVATION_RULE = {
    rule: 'Not counted as satisfied in this account.',
    standing: 'DRAFT' as const,
    by: 'OURS' as const,
    his: { words: 'A requirement should not automatically count as satisfied merely because the coach could theoretically judge it.', citedAs: HIS_WORDS_CITED_AS },
}

/** His reply filed 4 November 2026 (round 3): the citation for each of his answers read below. */
const HIS_4_NOVEMBER = (item: number) => `his reply filed 4 November 2026, item ${item}`
/** His reply filed 5 November 2026, item 1 (round 4): the citation for the safeguard he approved and his two classes. */
const HIS_5_NOVEMBER_ITEM_1 = 'his reply filed 5 November 2026, item 1' as const

/**
 * **His two classes of what refuses an activity** (round 4, his reply filed 5 November 2026, item 1: *"Both should prevent an activity from
 * being served as checked, but the diagnostic report should clearly distinguish them."*). Which cause falls in which class is our DRAFT
 * reading (`SCORING_ENFORCEMENT.classRule`); the class never decides whether to refuse — every finding refuses, as before.
 */
export type EnforcementFailureClass = 'MISSING_OR_ALTERED' | 'VERIFICATION_FAILURE'

/**
 * **What the build enforces, and what it does not** (round 3; his reply filed 4 November 2026, item 7). Which parts are "clearly defined,
 * structurally necessary, and mechanically verifiable" components is our DRAFT reading: a structural part of the approved scoring
 * condition's row that quotes his words (`enforced`; the gate lets only a structural part naming a component quote them). A part of that row
 * quoting none of his words — our reading of another ruling — is reported, not enforced. Round 4 (his reply filed 5 November 2026, item 1):
 * refusing where a component cannot be verified is the safeguard he approved (`safeguard`), each finding in one of his two classes
 * (`classes`, in his words and his order), by our DRAFT rule (`classRule`). Item 2 of the same reply defers any expansion: nothing new is
 * required or refused here (the reads added in round 4 only classify what already refused).
 */
export const SCORING_ENFORCEMENT = {
    scope: 'SCORING_CONDITION_COMPONENTS' as const,
    what:
        "A component of the approved scoring condition that quotes his words, missing or altered in the activity as built (its condition, a pinned value or scope, or its referent), refuses the activity at the validation stage, on every route: a missing or altered requirement. Where a component cannot be verified, the activity is refused too, the safeguard he approved (his reply filed 5 November 2026, item 1): a verification failure (our DRAFT reading of which causes these are: a bindings file that cannot be read, or that the gate refuses where the enforcement reads it; a reader or a check that fails, is absent or does not decide; evidence a check needs that is missing, a carrier that cannot be read, or the context's contract missing from a block; an approved scoring condition the bindings do not classify, or words of his row that no part classifies). Each finding names its class; which cause falls in which class is our DRAFT reading. Nothing else refuses.",
    notEnforced:
        "Every other part is reported and never refused. Unsupported and coach-observed parts are shown in their categories, a component classified only for coach observation among them; a structural part quoting none of his row's words (our reading of another ruling) is reported only. For a component that holds by construction (its referent the target the scoring event reaches), only that its condition and target are carried is enforced; whether the target's placement makes it meaningful progression stays flagged (his item 3).",
    standing: 'DRAFT' as const,
    by: 'OURS' as const,
    his: {
        words: [
            'I approve beginning narrowly with missing or altered components of approved scoring conditions, where those components are clearly defined, structurally necessary, and mechanically verifiable.',
            'I would not yet extend refusal to every unsupported purpose statement, inferred affordance relationship, or coach-observed condition.',
            'Those should remain clearly flagged until we have established reliable criteria for evaluating them.',
        ],
        citedAs: HIS_4_NOVEMBER(7),
    },
    /** Round 4: the safeguard he approved, in his words. */
    safeguard: {
        words: [
            'I approve retaining the safeguard that refuses a checked activity when an essential scoring-condition component cannot be verified.',
            'Both should prevent an activity from being served as checked, but the diagnostic report should clearly distinguish them.',
            'This should remain narrowly scoped to approved scoring-condition components for now.',
        ],
        citedAs: HIS_5_NOVEMBER_ITEM_1,
    },
    /** Round 4: his two classes, his label and his definition of each, verbatim, in his order. */
    classes: [
        { id: 'MISSING_OR_ALTERED', label: 'Missing or altered requirement', words: 'The finished activity demonstrably fails to preserve an approved condition.', citedAs: HIS_5_NOVEMBER_ITEM_1 },
        {
            id: 'VERIFICATION_FAILURE',
            label: 'Verification failure',
            words: 'The system cannot establish whether the condition is satisfied because its classification, supporting evidence, or check is missing or malfunctioning.',
            citedAs: HIS_5_NOVEMBER_ITEM_1,
        },
    ] as { id: EnforcementFailureClass; label: string; words: string; citedAs: string }[],
    /**
     * Round 4: which cause falls in which class — ours, DRAFT, never his words. The fix round (the R2 review's S1): the readings we hold as
     * ambiguous are named in it, each with its current class, so none is shown to him as settled.
     */
    classRule: {
        rule: "A finding is a missing or altered requirement only where the reader positively read the activity as built (its contracts, the engine's checks and the finished game) and found the component absent (no carrier the DRAFT carrier classification counts) or different (another value, scope, referent or condition); an episode check that ran and decided FAIL is such a reading, and the finding says which clause decided it. Every finding where the bindings, the reader, a check, or the evidence a check needs could not establish it is a verification failure: a check absent, undecided or vacuous, evidence missing, a carrier whose selector cannot be read, the context's contract missing from a block. Within a facet any one carrier suffices, so one that cannot be established leaves the facet unestablished, even beside another carrier shown altered; across facets all must carry, so one facet that demonstrably fails makes the component missing or altered. Readings we hold as ambiguous, for his review, each with its current class: (1) an item set aside by the DRAFT carrier classification (a contract kind the facet does not take, a basis that is not eligible, a game form without his ACTIVE relationship) is evidence neither way, so a component carried only by such an item, even one holding the approved value, is missing or altered; (2) a condition of the approved type that governs the scoring event while the component's own element is not on it is missing or altered; (3) an episode check that decided FAIL only on a later clause (its awardee, resets or credit), its reach clause not failing, is missing or altered; (4) a condition authored with no scope that reaches the scoring event with a narrower scope is missing or altered; (5) an engine check that is UNMET or NOT_REALIZED because the line it reaches is unresolved or has no authored value is missing or altered; (6) within one facet, a carrier that cannot be established outweighs another carrier shown altered, so the facet is a verification failure; (7) the context's contract missing from a block is a verification failure.",
        standing: 'DRAFT' as const,
        by: 'OURS' as const,
    },
}
/** The check id a refusal's reasons carry (technical; DRAFT). */
export const SCORING_COMPONENTS_CHECK = 'CS-SCORING-COMPONENTS'
/** Round 4: the head of each refusal reason, naming its class in his words (technical; DRAFT). Every reason still carries the check id. */
export const SCORING_REASON_HEAD: Record<EnforcementFailureClass, string> = {
    MISSING_OR_ALTERED: `${SCORING_COMPONENTS_CHECK} (missing or altered requirement): `,
    VERIFICATION_FAILURE: `${SCORING_COMPONENTS_CHECK} (verification failure): `,
}

/**
 * **Where a finding comes from** (round 4; ours, DRAFT). COMPONENT: an enforced component read and not carried; PART_NOT_READ: a bound
 * component this block's reading holds no part for; READ_WITHOUT_CAUSE: one read as not carried with no cause recorded; the path-level
 * sources: the bindings refused, the reader failed, no bindings read, the scoring row outside the applicable set or not classified, words of
 * his row no part classifies, the enforcement itself failing. UNTYPED: a finding handed to the account without a class (defensive).
 */
export type EnforcementFailureSource =
    | 'COMPONENT'
    | 'PART_NOT_READ'
    | 'READ_WITHOUT_CAUSE'
    | 'BINDINGS_REFUSED'
    | 'READER_FAILED'
    | 'NO_BINDINGS'
    | 'OUTSIDE_APPLICABLE_SET'
    | 'NOT_CLASSIFIED'
    | 'UNCLASSIFIED_WORDS'
    | 'ENFORCEMENT_FAILED'
    | 'UNTYPED'
/** One finding of the enforcement in his two classes (round 4): the refusal's reason, verbatim, and why it is in its class (ours, DRAFT). */
export interface EnforcementFailure {
    /** Not `class`: a destructured `class` is a syntax error. */
    failureClass: EnforcementFailureClass
    source: EnforcementFailureSource
    rowId: string | null
    component: string | null
    partId: string | null
    cause: ComputedCause | null
    /** Why it is in its class: ours, DRAFT. */
    because: string
    /** The refusal's technical reason it gave, verbatim: one of the reading's `findings`. */
    reason: string
}
/** A finding as the activity's account carries it: once, with the blocks whose reading gave it, in block order. */
export type AccountEnforcementFailure = EnforcementFailure & { blocks: string[] }

/**
 * **Whether a part is satisfied, apart from where its authority originates** (round 3; his reply filed 4 November 2026, item 2: *"I'd like us
 * to distinguish whether a requirement is satisfied from where its authority originates."*). YES for his categories 1 and 2 (a carrier is in
 * the finished activity: *"provided the corresponding feature genuinely exists in the finished activity"*), NOT_COUNTED for 3 (our DRAFT
 * rule), NO for 4.
 */
export type SatisfiedStanding = 'YES' | 'NO' | 'NOT_COUNTED'
export const SATISFIED_WORDS: Record<SatisfiedStanding, string> = {
    YES: 'Satisfied: what carries it is in the finished activity (ours, DRAFT).',
    NOT_COUNTED: 'Not counted as satisfied in this account (coach observation; our DRAFT rule).',
    NO: 'Not satisfied: unsupported or missing (ours, DRAFT).',
}
/** Round 3b (the round-3 review's R2 S3): a part satisfied only by absence says so, so its words never contradict its flag. */
export const SATISFIED_BY_ABSENCE_WORDS = 'Satisfied only by absence: nothing in the finished activity restricts it; not yet supported by a check of the applicable rules (flag below; ours, DRAFT).'
/** Where the authority for what carries a part originates (round 3, his item 2). Round 3b: only origins the reader produces (R2 N3). */
export type AuthorityOrigin = 'CONTEXT_KNOWLEDGE' | 'PROVISIONAL_REALIZATION' | 'GAME_FORM_KNOWLEDGE'
const AUTHORITY_OF_KIND: Record<CarrierKind, AuthorityOrigin> = { CONTEXT: 'CONTEXT_KNOWLEDGE', REALIZATION: 'PROVISIONAL_REALIZATION', GAME_FORM: 'GAME_FORM_KNOWLEDGE' }

/**
 * **The two flags, kept and worded in his distinction** (round 3; his reply filed 4 November 2026, item 3: *"Please retain both flags for
 * now."*). The sentence of ours says what the flag means and what is still to be verified; his words are quoted beside it.
 */
export interface PartFlag {
    kind: 'BY_ABSENCE' | 'BY_CONSTRUCTION'
    ours: string
    his: { words: string[]; citedAs: string }
}
export const PART_FLAGS: Record<PartFlag['kind'], PartFlag> = {
    BY_ABSENCE: {
        kind: 'BY_ABSENCE',
        // Round 3b (R2 S3): the register row it reads is named where the flag is made (`byAbsenceFlag`); this is the sentence's frame.
        ours: 'Satisfied only by the absence of any restriction: no rule on its register row is in the finished game. That conclusion is still to be supported by a check of the applicable rules and restrictions, which is not built (deferred; ours, DRAFT).',
        // Round 3b (R2 N2): his words are about representative information, and the citation says so, so they are never read as about another row.
        his: { words: ['However, this conclusion should be supported by a check of the applicable rules and restrictions, rather than simply an assumption that nothing is hidden.'], citedAs: `${HIS_4_NOVEMBER(3)}, on representative information` },
    },
    BY_CONSTRUCTION: {
        kind: 'BY_CONSTRUCTION',
        ours: "Holds whenever the scoring event occurs: its referent is the target the event reaches. Reaching the target does not by itself establish meaningful progression; the target's placement and its relationship to the intended Game Problem are still to be verified (ours, DRAFT).",
        his: { words: ['Reaching a target should not automatically establish meaningful progression merely because the target is present.', "The target's placement and relationship to the intended Game Problem matter."], citedAs: `${HIS_4_NOVEMBER(3)}, on progression` },
    },
}
/** A by-absence flag naming the register rows it reads (round 3b, R2 S3). */
const byAbsenceFlag = (rows: string[]): PartFlag => ({
    ...PART_FLAGS.BY_ABSENCE,
    ours: PART_FLAGS.BY_ABSENCE.ours.replace('no rule on its register row is', `no rule on its register row (${rows.join(', ')}) is`),
    his: { ...PART_FLAGS.BY_ABSENCE.his, words: [...PART_FLAGS.BY_ABSENCE.his.words] },
})

export type ComputedCause =
    | 'MISSING_KNOWLEDGE'
    | 'MISSING_IMPLEMENTATION'
    | 'NOT_CARRIED'
    | 'NOT_GOVERNING'
    | 'NO_BINDING'
    | 'VALUE_MISSING'
    | 'NOT_THE_SAME_REFERENT'
    | 'OBSERVABLE_NOT_IDENTIFIED'
    /** Round 3: an item matched the pattern but holds a value or scope other than the one the pattern pins to his approved knowledge. */
    | 'ALTERED'

export interface CarrierEvidence {
    contractId: string
    itemId: string
    contractKind: CarrierKind
    row: string
    selector: string | null
    requirement: string
    strictness: string
    basis: string
    /** PROVISIONAL_REALIZATION_CHOICE, DRAFT_KNOWLEDGE, or null for canonical knowledge. */
    category: string | null
    /** The scope the item is authored for, where it states one. */
    scope: string | null
    forward: { result: string; why: string; reach: string[] }
    /** `rereadInGame` false: the exclusion holds per derivation and was not matched against the finished game's elements (R1 NIT 3). */
    survives: { how: 'ELEMENT' | 'REACHED_LINE' | 'EXCLUSION_HOLDS'; elementIds: string[]; vacuous: boolean; rereadInGame: boolean }
    /** For a value on a field row: what was authored, and what the finished game holds at each surviving line (the R-rulings review's M1). */
    value: { authored: unknown; realized: unknown[] } | null
    /** A referent of the pattern's `byConstructionWhen` form: the condition holds whenever the event it qualifies occurs (S3). */
    byConstruction: boolean
    /** The context's ACTIVE GAME_FORM relationship id, for a carrier in the game form's contract. */
    relationship: string | null
    /** The guard's per-condition reading, for a component's condition. */
    condition: ConditionReading | null
}
/** A declaration of a contract that a declaration facet reads (the R-rulings review's S2). */
export interface DeclarationEvidence {
    contractId: string
    contractKind: CarrierKind
    row: string
    selector: string | null
    declaration: string
    qualifier: string
    note: string | null
    relationship: string | null
}
export interface ConsideredItem {
    contractId: string
    itemId: string
    contractKind: CarrierKind | null
    forward: string | null
    why: string[]
}
export interface FacetAccount {
    facetId: string
    label: string
    account: 1 | 2 | 4
    carriers: CarrierEvidence[]
    declarations: DeclarationEvidence[]
    considered: ConsideredItem[]
    cause: ComputedCause | null
    /**
     * Round 4 (his reply filed 5 November 2026, item 1): on a failing facet of a part the enforcement reads, what of it could not be
     * established — a candidate's check absent or undecided, the evidence a check needs missing, a carrier whose selector cannot be read,
     * the context's contract missing from the block (ours, DRAFT). Absent everywhere else, so every served part is exactly as it was.
     */
    unverified?: string[]
    /**
     * The fix round (the R2 review's M1): on the same facets, what the reader read that shows a condition not governing as authored — the
     * branch of the guard's reading, and for the episode check which clause decided FAIL and what that clause decides (ours, DRAFT). The
     * mirror of `unverified`; absent everywhere else.
     */
    shown?: string[]
}

export interface RequirementPartAccount {
    rowId: string
    rowSheet: RowSheet
    /** The identity role, property category or validation domain, as the workbook holds it. */
    rowRole: string
    /** His row text, verbatim from the context workbook. */
    rowText: string
    /** The validation row's expected evidence, verbatim; null on other sheets. */
    expectedEvidence: string | null
    partId: string
    partLabel: string
    kind: BindingPart['kind'] | 'NO_BINDING'
    /** The scoring-condition component the part concerns, or null. */
    component: string | null
    /** His words the component stands for (S1), or null. */
    rowSpan: string | null
    account: AccountKind
    accountWords: string
    /**
     * True only for accounts 1 and 2. Account 3 is not counted as satisfied in this account: our DRAFT reading of his "A requirement should
     * not automatically count as satisfied merely because the coach could theoretically judge it." (`COACH_OBSERVATION_RULE`); whether 2
     * is, is put to him.
     */
    countsAsSatisfied: boolean
    /** Round 3, his item 2: whether it is satisfied (`SATISFIED_WORDS`), apart from where its authority originates. */
    satisfied: SatisfiedStanding
    satisfiedWords: string
    /** Round 3, his item 2: where the authority for what carries it originates; empty where nothing carries it. */
    authority: { from: AuthorityOrigin[]; words: string }
    /** Round 3, his item 3: a flag kept (by absence, by construction), in his distinction; null where none. */
    flag: PartFlag | null
    /** Round 3, his item 7: a missing or altered part refuses the activity (a component quoting his words); false for every other part. */
    enforced: boolean
    standard: RequirementStandard
    standardWords: string
    facets: FacetAccount[]
    guard: (EventKindReading & { relationshipIds: string[] }) | null
    observable: { text: string; source: ObservableSource; citedAs: KnowledgeRowCitation | ReplyCitation | null; expect: 'PRESENT' | 'ABSENT'; standing: 'DRAFT' } | null
    observableIdentified: boolean
    recordedOutside: { contractId: string; itemId: string }[]
    /** Control and exclusion against the progression outcome (M1): evaluated, and whether the referents are one. */
    sameReferent: { component: string; facet: string; evaluated: boolean; holds: boolean | null; detail: string } | null
    /** A carrier holds by construction (S3), shown in the chip as `vacuous` is for an exclusion. */
    byConstruction: boolean
    /** An exclusion that holds because nothing of its row is in the game (N6), shown in the chip. */
    vacuous: boolean
    accountsFor: string[]
    cause: { kind: ComputedCause; detail: string } | null
    /** A carrier rests on DRAFT knowledge (the TEST-ONLY draft store). */
    restsOnDraftKnowledge: boolean
    classification: { standing: 'DRAFT'; by: 'OURS'; bindingsVersion: string | null; note: string | null }
}

export interface BlockRequirementAccount {
    blockId: string
    contextId: string
    status: 'ACCOUNTED' | 'BINDINGS_REFUSED' | 'ERROR'
    /** BINDINGS_REFUSED: the gate's reasons; ERROR: the thrown message. */
    reasons: string[]
    /** Empty unless ACCOUNTED. */
    parts: RequirementPartAccount[]
    /** Rows accounted in general that do not apply to this build (S8), with why. */
    notApplicable: { rowId: string; rowRole: string; rowText: string; why: string }[]
    /** A role scores by an event of its own, or another occurrence also counts: that scoring is the realization's, not a context requirement (N7). */
    roleScoring: boolean
}

export type MergedPart = RequirementPartAccount & { perBlock: { blockId: string; account: AccountKind }[] }
/** A block as the activity's account carries it: only the parts that differ from the merged ones, and how many do not (R3 S1). */
export type AccountBlock = BlockRequirementAccount & { partsIdenticalToMerged: number }

export interface ScoringConditionSummary {
    /**
     * ACCOUNTED: classified into structural components and read; NOT_CLASSIFIED: no part of the row is drafted; NO_STRUCTURAL_COMPONENT: its
     * parts name no structural component; NOT_APPLICABLE: no scoring-condition row is in the applicable set (the R-engine review's M3).
     */
    state: 'ACCOUNTED' | 'NOT_CLASSIFIED' | 'NO_STRUCTURAL_COMPONENT' | 'NOT_APPLICABLE'
    rowId: string | null
    rowText: string | null
    components: {
        component: string
        /** The component's label; where its worst structural part is not the component part itself, that part is named too (R2 S2). */
        label: string
        rowSpans: string[]
        /** The worst account of its structural parts. */
        account: AccountKind
        perBlock: { blockId: string; account: AccountKind }[]
        /** The worst account of its coach-observed parts (N4); null where it has none. */
        inPlay: AccountKind | null
        byConstruction: boolean
        cause: { kind: ComputedCause; detail: string } | null
    }[]
    /** Components whose structural part is 4 in any block. */
    missing: { component: string; label: string; blocks: string[]; cause: { kind: ComputedCause; detail: string } }[]
    /** Components with no structural part at all: only coach-observed, or unsupported, parts. */
    notStructurallyRepresented: { component: string; label: string }[]
    /** Words of his row no component's span covers (S1); null where every word is covered (and where no part quotes a span). */
    uncoveredWords: string | null
    /** Blocks that stopped before the guard, so are not accounted. */
    unaccountedBlocks: string[]
}

export interface RequirementSummary {
    /** Plain DRAFT sentence. It names the missing components first, wherever there are any. */
    headline: string
    /** True only where the headline may say every component of the approved scoring condition is carried (M3, R1 S1). */
    scoringConditionCarried: boolean
    scoringCondition: ScoringConditionSummary | null
    counts: Record<'1' | '2' | '3' | '4', number>
    /** Of the parts in account 1, how many hold by absence and how many by construction (R2 S7). */
    representedHow: { byAbsence: number; byConstruction: number }
    unsupported: { rowId: string; partId: string; label: string; cause: { kind: ComputedCause; detail: string } }[]
    coachObservedWithoutObservable: { rowId: string; partId: string; label: string }[]
    blocksDisagree: { rowId: string; partId: string; perBlock: { blockId: string; account: AccountKind }[] }[]
}

export interface RequirementAccount {
    /**
     * Round 3b (the coordinator's item 5): what is true of this account. REPORT_AND_ENFORCEMENT: a report, and on this build the approved
     * scoring condition's components quoting his words were enforced; REPORT_ONLY: a report, nothing enforced (a TEST-ONLY draft contract);
     * BINDINGS_REFUSED or ERROR: no report could be computed (whether the build refused is `enforcement.findings`).
     */
    status: 'REPORT_AND_ENFORCEMENT' | 'REPORT_ONLY' | 'BINDINGS_REFUSED' | 'ERROR'
    /** What this is, and what of it is enforced. */
    about: string
    /** BINDINGS_REFUSED or ERROR: why, once (R3 S4); empty otherwise. */
    reasons: string[]
    contextId: string
    contextName: string | null
    /** Where the build ended: 'served', or the stage it was refused at. */
    outcome: string
    bindings: { file: string | null; version: string | null; mode: BindingsMode | null; standing: 'DRAFT' }
    /** 'DRAFT' where the context's contract is the TEST-ONLY draft store's. */
    contract: 'PRODUCTION' | 'DRAFT'
    summary: RequirementSummary
    /** Merged over blocks: one entry per row and part, the worst account over blocks, with each block's (N5: the fields are the first block's, in block order, holding the worst account). */
    parts: MergedPart[]
    blocks: AccountBlock[]
    blocksWithoutAccount: { blockId: string; why: string }[]
    /** Every ACTIVE row of the context outside the accounted set, accounted inside another part, or not applicable to this build, with why and where it is cited. */
    notAccounted: { rowId: string; rowRole: string; rowText: string; why: string; standing: 'NOT_ACCOUNTED' | 'NOT_APPLICABLE' | 'ACCOUNTED_INSIDE'; citedAsObservableBy: string[]; accountedInside: string | null }[]
    /** What else is not accounted here, said plainly (N7, R2 N12). */
    alsoNotAccounted: string[]
    accounts: { id: AccountKind; words: string }[]
    standards: { id: RequirementStandard; words: string }[]
    /** Our rule for coach observation, with his words it reads (R2 M1). */
    coachObservationRule: typeof COACH_OBSERVATION_RULE
    citedAs: typeof HIS_WORDS_CITED_AS
    /**
     * Round 3, his item 7: what the build enforces — the approved scoring condition's components — and whether it did on this build
     * (`applied`: the context's contract is a production one), with what it found (the refusal's reasons, where it refused). Round 3b:
     * the components classified only for coach observation, reported and never refused (the round-3 review's R2 M1). Round 4 (his reply
     * filed 5 November 2026, item 1): each finding once, in his two classes (`failures`, in the order of `findings`), and how many of each.
     */
    enforcement: typeof SCORING_ENFORCEMENT & {
        applied: boolean
        findings: string[]
        failures: AccountEnforcementFailure[]
        counts: Record<EnforcementFailureClass, number>
        coachObservedOnly: CoachObservedOnly[]
    }
}

/** A component of the approved scoring condition classified only for coach observation: judged in play, reported, never refused (round 3b). */
export interface CoachObservedOnly {
    rowId: string
    component: string
    partId: string
    /** The words of his row this part alone classifies — its observable covers them and no enforced span does (round 3c: word by word). */
    words: string
}

/** R2 S1 and N4: the applicable set is ours, and his words are "supported" (the categories) and "maintain" (the standards). Round 3: what is enforced; round 4: the safeguard he approved. */
export const REQUIREMENT_ACCOUNT_ABOUT =
    "How each requirement of this activity's context in the applicable set (our DRAFT) is accounted for, part by part, in the four categories Christian supported and the three standards he asked to keep distinct; the context's other approved rows are listed under Not accounted. Every classification is ours and DRAFT, for his review. This is a report; one part of it is enforced: since his reply filed 4 November 2026, the build refuses an activity whose approved scoring condition has a component quoting his words missing or altered, and, as he approved retaining it (his reply filed 5 November 2026, item 1), one whose components cannot be verified (Enforcement)."

// ── Reading the finished game ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Every element id in the realized game, its instance suffix `#n` dropped (a deep walk: only `elementId` keys name elements). */
export function elementIdsIn(value: unknown, out: Set<string> = new Set()): Set<string> {
    if (Array.isArray(value)) value.forEach(entry => elementIdsIn(entry, out))
    else if (value && typeof value === 'object') {
        const id = (value as { elementId?: unknown }).elementId
        if (typeof id === 'string') out.add(id.split('#')[0])
        Object.values(value).forEach(entry => elementIdsIn(entry, out))
    }
    return out
}

const readPath = (root: unknown, dotted: string): unknown =>
    dotted
        .split('.')
        .filter(Boolean)
        .reduce<any>((node, key) => (node === null || node === undefined ? undefined : node[key]), root)

/**
 * The elements of a class in the realized game (every instance), at the collection the row's owner holds; through what stands for it. A
 * field row whose owner holds no collection reads nothing, so it fails closed.
 */
function elementsOf(game: unknown, classId: string, row: string, index: RegisterIndex, standsFor: Map<string, string>): any[] {
    const owner = index.ownerRow.get(row) ?? row
    const container = splitPath(String(index.rows.get(owner)?.path ?? '')).container
    const bucket = container ? readPath(game, container) : undefined
    const wanted = standsFor.get(classId) ?? classId
    return Array.isArray(bucket) ? bucket.filter(element => typeof element?.elementId === 'string' && element.elementId.split('#')[0] === wanted) : []
}

/** What a referent designates, as the engine names it (`engine.ts` `memberKey`, `gates.ts` `describeReferent`): never `[object Object]`. */
export function referentIdentity(value: unknown): string {
    const typed = structuralRefOf(value)
    if (typed) return `${typed.contractId}::${typed.itemId}`
    const relational = relationalReferentOf(value)
    if (relational) return `the ${relational.role} objective reference of ${relational.objectiveReferenceOf}`
    const begins = beginConditionReferentOf(value)
    if (begins) return `the restarts that begin ${begins.beginsEpisodeOf} (${canonical(begins.arms)})`
    return canonical(value)
}

const shown = (value: unknown): string => {
    const text = JSON.stringify(value)
    return text === undefined ? 'nothing' : text.length > 160 ? `${text.slice(0, 157)}...` : text
}
const copied = <T>(value: T): T => (value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T))

// ── One block ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The inputs one block's account reads. A TEST-ONLY observer may read them (`observeRequirementInputs`) and must not mutate them. */
export interface BlockRequirementInputs {
    blockId: string
    contextId: string
    bindings: RequirementBindings | null
    refused: string[] | null
    /** The block's derivation input contracts: deferrals and role yields applied, after any TEST-ONLY alteration. */
    contracts: LoadedContract[]
    forward: ItemOutcome[]
    classes: ElementClass[]
    classified: Map<string, { verdict: unknown }> | null
    /** The concrete game, after relative counts: the one the guard read. */
    game: unknown
    /** What a recorded identification lets stand for an element (`realized.record.satisfiedByEstablished`). */
    standsFor: Map<string, string>
    episodeCheck: CheckResult | undefined
    gameFormId: string | null
    /** The selection's entries, so a constraint's contract is named as one (S7). */
    selected: { id: string; role: string }[]
    eventKind: EventKindReading
    /** Whether the build returns alternatives (S8). The checked pathway returns one activity. */
    alternativesReturned: boolean
    index: RegisterIndex
    /**
     * Round 3: 'ENFORCED' reads only what the build enforces — the parts of the approved scoring condition's row quoting his words, each
     * exactly as the full reading reads it — for every build that is not an administrator's review (a coach's build computes
     * nothing else). Absent: every applicable row.
     */
    only?: 'ENFORCED'
}

const EXISTENCE = ['EXISTS', 'COUNT', 'RANGE']
const DEFAULT_STRICTNESS = ['REQUIRED', 'SUPPORTING']
const KIND_WORDS: Record<CarrierKind, string> = { CONTEXT: "the context's", REALIZATION: "the realization's", GAME_FORM: "the game form's" }

/** A block whose reading threw: status ERROR with the message, nothing accounted (R3 NIT 5, the `failedOverviewDraft` idiom). */
export function failedBlockRequirementAccount(blockId: string, contextId: string, message: string): BlockRequirementAccount {
    return { blockId, contextId, status: 'ERROR', reasons: [message], parts: [], notApplicable: [], roleScoring: false }
}

/** The cause a part read 4 takes from its facets: not governing, then altered, then a value missing where nothing else failed, else not carried. */
function causeOfFacets(facets: FacetAccount[]): ComputedCause {
    return facets.some(facet => facet.cause === 'NOT_GOVERNING')
        ? 'NOT_GOVERNING'
        : facets.some(facet => facet.cause === 'ALTERED')
          ? 'ALTERED'
          : facets.some(facet => facet.cause === 'VALUE_MISSING') && facets.every(facet => facet.account !== 4 || facet.cause === 'VALUE_MISSING')
            ? 'VALUE_MISSING'
            : 'NOT_CARRIED'
}
/** What each failing facet considered, the detail of a part's cause (moved out of the block reader in the fix round, unchanged, for the R3 review's S-3). */
function describeFacets(facets: FacetAccount[]): string {
    return facets
        .filter(facet => facet.account === 4)
        .map(facet => `${facet.label}: ${facet.considered.length ? `considered ${facet.considered.map(entry => `${entry.contractId}::${entry.itemId} (${entry.why.join('; ')})`).join(', ')}` : facet.cause === 'VALUE_MISSING' ? 'no declaration says it needs no further value, and no value is carried' : 'no item of any contract matches'}`)
        .join(' | ')
}

/**
 * Round 4 (ours, DRAFT): the engine's forward results that decide nothing about the item — the check is not evaluable, outside the
 * representation, or a freedom not yet chosen. Every other result but SATISFIED is the engine establishing that the item does not carry it.
 * Typed (the R1 review's S3), so a change to the engine's vocabulary fails to compile rather than turning an undecided result into a shown one.
 *
 * Ambiguous, proposed (ours, DRAFT; the R1 review's S2): forward.ts also gives UNMET or NOT_REALIZED where the line the item reaches is
 * UNRESOLVED or has no authored value. Both are read here as shown, though they could be read as the supporting evidence missing — a
 * verification failure. Open for his review; if that is his reading, it is to be decided from the typed verdicts of `outcome.reach` in
 * `input.classified` (every reached line UNRESOLVED or not authored), never from `outcome.why`. Probably unreachable on a build that reaches
 * the guard: structure stops an unresolved required line.
 */
const UNDECIDED_RESULTS: ForwardResult[] = ['NOT_EVALUABLE', 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION', 'PENDING_CHOICE']

/** Where an ambiguous reading is said in a note, for his review (ours, DRAFT). */
const AMBIGUOUS_NOTE = ' (a reading we hold as ambiguous, for his review)'

/**
 * **Whether a condition the guard does not confirm was shown not to govern, and what shows it, or could not be established** — round 4 (his
 * reply filed 5 November 2026, item 1; the design review's M1; the fix round, the R2 review's M1). Read from the guard's own reading
 * (`conditionReadingOf`) and the episode check it was given, in the guard's branch order, with no second copy of the guard and no change to it.
 * `shown`, where the finished game demonstrably fails, says what the reader read: the condition is not on the scoring event; it reached it with
 * another scope than authored; a condition of its type governs but its own element is not there (the design review's S2, option A;
 * ambiguous); it is authored with no scope and carries a narrower one (ambiguous); or the episode check ran and decided FAIL — on its reach
 * clause, that the finished game cannot begin the episode; on a later clause (its awardee, resets or credit) only, that it does not hold it as
 * that clause requires (ambiguous). `unverified` otherwise: the guard cannot read the condition's type, or the episode check is absent, another
 * check, not one that decides the scope, without clauses, undecided, or passed without reading any condition. Ours, DRAFT.
 */
function conditionEvidenceOf(condition: ConditionReading, check: CheckResult | undefined): { shown: string } | { unverified: string } {
    const item = `${condition.contractId}::${condition.itemId}`
    const own = `c:${condition.contractId}:${condition.itemId}`
    if (condition.type === null) return { unverified: `${item} names no condition type the context-scoring guard reads` }
    if (!condition.present) return { shown: `no ${condition.type} condition is on the realized scoring event` }
    if (condition.elementFound && !condition.scopeMatches)
        return { shown: `${item} reached the realized scoring event with the scope ${JSON.stringify(condition.carriedScope)}, not the ${String(condition.authoredScope)} scope it is authored for` }
    if (condition.governs) return { shown: `a condition of the ${condition.type} type governs the realized scoring event, but ${item}'s own element (${own}) is not on it${AMBIGUOUS_NOTE}` }
    // The guard's "cannot be confirmed to govern" branch: its own element carries a scope narrower than the whole game.
    if (condition.authoredScope === null)
        // Ambiguous, proposed (ours, DRAFT): the knowledge authored no scope and the finished game holds one, so it is altered; one stating
        // no scope at all is not established.
        return typeof condition.carriedScope === 'string'
            ? { shown: `${item} is authored with no scope, and reached the realized scoring event with the scope ${condition.carriedScope}, narrower than the whole game${AMBIGUOUS_NOTE}` }
            : { unverified: `${item} is on the scoring event stating no scope, so whether it governs every score cannot be established` }
    const scope = String(condition.carriedScope)
    const episode = `whether the finished game begins the ${scope} episode ${item} is authored for cannot be established`
    if (!check) return { unverified: `the episode check (${EPISODE_REACHABLE_CHECK}) was not given, so ${episode}` }
    if (check.checkId !== EPISODE_REACHABLE_CHECK) return { unverified: `the check given is ${check.checkId}, not the episode check (${EPISODE_REACHABLE_CHECK}), so ${episode}` }
    if (!EPISODE_SCOPES.includes(scope)) return { unverified: `the episode check (${EPISODE_REACHABLE_CHECK}) does not decide the ${scope} scope, so whether ${item} governs this game cannot be established` }
    if (!check.clauses.length) return { unverified: `the episode check (${EPISODE_REACHABLE_CHECK}) holds no clause, so ${episode}` }
    const reach = check.clauses[0]
    // A check that ran and decided FAIL is a demonstration, and the note says which clause decided it and what that clause decides (its own words).
    if (reach.verdict === 'FAIL') return { shown: `the episode check (${EPISODE_REACHABLE_CHECK}) ran and decided FAIL on its reach clause ("${reach.clause}"): the finished game cannot begin the ${scope} episode ${item} is authored for` }
    const later = check.clauses.map((clause, at) => ({ clause, at })).filter(entry => entry.at > 0 && entry.clause.verdict === 'FAIL')
    if (later.length)
        // Ambiguous, proposed (ours, DRAFT): the reach clause did not fail, so the game may begin the episode; what failed is how it holds it
        // (a later clause can be about how the episode ends), and where the reach clause did not pass, whether it begins it is not established.
        return {
            shown: `the episode check (${EPISODE_REACHABLE_CHECK}) ran and decided FAIL on ${later.map(entry => `its clause ${entry.at + 1} of ${check.clauses.length} ("${entry.clause.clause}")`).join(' and ')}, while its reach clause gave ${reach.verdict}: the finished game does not hold the ${scope} episode ${item} is authored for as that clause requires${reach.verdict === 'PASS' ? '' : `, and whether it begins that episode is not established`}${AMBIGUOUS_NOTE}`,
        }
    if (check.verdict === 'PASS' && check.clauses.every(clause => clause.verdict === 'PASS'))
        return { unverified: `the episode check (${EPISODE_REACHABLE_CHECK}) passed without reading any condition authored for an episode (its reach clause: ${reach.basis ?? 'no basis'}, ${Number(reach.instances ?? 0)} instances), so ${episode}` }
    return { unverified: `the episode check (${EPISODE_REACHABLE_CHECK}) decided nothing against it (its verdict ${check.verdict}; its clauses ${check.clauses.map(clause => clause.verdict).join(', ')}), so ${episode}` }
}

export function blockRequirementAccountOf(input: BlockRequirementInputs): BlockRequirementAccount {
    const { blockId, contextId, bindings, index } = input
    const roleScoring = input.eventKind.roleEvents.length > 0 || input.eventKind.alsoCounts.length > 0
    const empty = { parts: [] as RequirementPartAccount[], notApplicable: [] as BlockRequirementAccount['notApplicable'], roleScoring }
    if (input.refused) return { blockId, contextId, status: 'BINDINGS_REFUSED', reasons: [...input.refused], ...empty }
    if (!bindings) return { blockId, contextId, status: 'ERROR', reasons: ['no requirement bindings were given'], ...empty }

    const contextBindings = bindings.contexts.find(entry => entry.contextId === contextId) ?? null
    const ids = elementIdsIn(input.game)
    /** In the game, directly or through what a recorded identification lets stand for it (R1 NIT 4). */
    const inGame = (elementId: string) => ids.has(elementId) || (input.standsFor.has(elementId) && ids.has(input.standsFor.get(elementId)!))
    const forward = new Map(input.forward.map(outcome => [`${outcome.item.contractId}::${outcome.item.itemId}`, outcome]))
    const classes = new Map(input.classes.map(cls => [cls.classId, cls]))
    const eligibleBases = bindings.carriers.eligibleBases.filter(basis => (ELIGIBLE_BASES as readonly string[]).includes(basis))
    const gameFormRelationship = input.gameFormId ? (rpcLibrary.gameFormsForContext(contextId).find(entry => knowledgeKey(entry.relatedId) === knowledgeKey(input.gameFormId!)) ?? null) : null
    const constraintIds = new Set(input.selected.filter(entry => entry.role.includes('constraint')).map(entry => knowledgeKey(entry.id)))
    const kindOf = (contract: LoadedContract): CarrierKind | null =>
        knowledgeKey(contract.contractId) === knowledgeKey(contextId)
            ? 'CONTEXT' // the reading build-activity.ts uses for the context's contract
            : (contract as { realizes?: unknown }).realizes === contextId
              ? 'REALIZATION' // the field the guard's role-event support reads
              : input.gameFormId && knowledgeKey(contract.contractId) === knowledgeKey(input.gameFormId)
                ? 'GAME_FORM'
                : null
    /** The fix round: whether the context's own contract is among the block's contracts (one pass; it decides only where a facet of an enforced part fails). */
    const contextPresent = input.contracts.some(contract => kindOf(contract) === 'CONTEXT')
    const otherKindWords = (contract: LoadedContract): string =>
        constraintIds.has(knowledgeKey(contract.contractId)) ? 'a constraint' : contract.contractId.startsWith(SPORT_PROFILE_PREFIX) ? 'the Sport Profile' : 'neither the context, the realization nor the game form'

    const matches = (item: LoadedContract['items'][number], pattern: Pick<ItemPattern, 'row' | 'requirement' | 'strictness' | 'terms'>, strictnessDefault = DEFAULT_STRICTNESS): boolean =>
        String(item.row) === pattern.row &&
        (!pattern.requirement || pattern.requirement.includes(String(item.requirement))) &&
        (pattern.strictness ?? strictnessDefault).includes(String(item.strictness)) &&
        selectorHolds(item.selector, String(item.row), pattern.terms, index)

    /**
     * One facet over every contract of the block. Round 4 (his reply filed 5 November 2026, item 1: *"Verification failure: The system cannot
     * establish whether the condition is satisfied because its classification, supporting evidence, or check is missing or malfunctioning."*):
     * on a part the enforcement reads (`enforcedPart`), a failing facet also records what of it could not be established (`unverified`) — a
     * candidate whose engine check is absent or undecided, whose reached lines lack the evidence a check needs, whose value could not be read
     * or compared, whose condition the guard cannot read or whose episode check is absent, undecided or vacuous (`conditionEvidenceOf`), an
     * item or declaration whose selector does not normalise, and the context's contract missing from the block. Only a candidate is evidence
     * either way — an item the facet would count, from a game form only through his relationship; one set aside is neither (the design review's
     * S2, option A). The fix round (the R2 review's M1): a condition shown not governing records what shows it (`shown`). Which sub-path is
     * which is our DRAFT reading. `account`, `cause`, `considered` and `carriers` are computed exactly as before, so a served part is unchanged.
     */
    const facetOf = (part: BindingPart, facet: ItemPattern, enforcedPart: boolean): FacetAccount => {
        const carriers: CarrierEvidence[] = []
        const declarations: DeclarationEvidence[] = []
        const considered: ConsideredItem[] = []
        let notGoverning = false
        /** Round 3: an item matched but held another value or scope than the pin (his approved knowledge): the part is altered, not absent. */
        let altered = false
        /** Round 4: what of this facet could not be established (ours, DRAFT); kept only on a failing facet of an enforced part. */
        const unverified: string[] = []
        /** The fix round (R2 M1): what shows a condition of this facet not governing as authored (ours, DRAFT); kept as `unverified` is. */
        const shownNotes: string[] = []
        /**
         * Round 4, and the fix round (R2 S1 and the R3 review's S-2): the context's contract missing from the block's contracts leaves a facet
         * that takes the context's carriers unestablished, as the guard's own reason for the same build says its scoring cannot be checked. A
         * reading we hold as ambiguous, for his review (ours, DRAFT). Only on a failing facet, so nothing served changes.
         */
        const contextMissing = (account: 1 | 2 | 4) => {
            if (enforcedPart && account === 4 && facet.from.includes('CONTEXT') && !contextPresent)
                unverified.push(`the context's contract (${contextId}) is not among the contracts this block was built from, so whether the activity carries the component cannot be established`)
        }
        const withUnverified = (account: 1 | 2 | 4): Pick<FacetAccount, 'unverified' | 'shown'> =>
            enforcedPart && account === 4 ? { ...(unverified.length ? { unverified: [...new Set(unverified)] } : {}), ...(shownNotes.length ? { shown: [...new Set(shownNotes)] } : {}) } : {}
        /** Round 4 (the design review's M2): a selector that does not normalise holds no term, so its item is never matched — unread, not absent. */
        const selectorDefect = (selector: unknown, row: string): string | null => {
            const parsed = parseSelector(selector, row, index)
            return parsed.predicate ? null : (parsed.defect ?? 'it gives no predicate')
        }
        /** A contract whose items or declarations this facet would count: a kind it takes, a game form only through his relationship. */
        const counted = (kind: CarrierKind | null): kind is CarrierKind => !!kind && facet.from.includes(kind) && (kind !== 'GAME_FORM' || !!gameFormRelationship)
        if (facet.declaration) {
            // S2: a declaration of the contract, read where it is (the context's, the realization's, or the game form's through his relationship).
            for (const contract of input.contracts) {
                const kind = kindOf(contract)
                for (const declaration of (contract.declarations ?? []) as any[]) {
                    if (String(declaration?.row) !== facet.row || declaration?.declaration !== facet.declaration.kind || declaration?.qualifier !== facet.declaration.qualifier) continue
                    if (!selectorHolds(declaration.selector ?? null, facet.row, facet.terms, index)) continue
                    const why: string[] = []
                    if (!kind || !facet.from.includes(kind)) why.push(kind ? `its contract is ${KIND_WORDS[kind]}, and this facet takes carriers only from ${facet.from.join(', ')}` : `its contract is ${otherKindWords(contract)}, not a carrier kind in this increment (DRAFT)`)
                    if (kind === 'GAME_FORM' && !gameFormRelationship) why.push('the context has no ACTIVE relationship to the selected game form in his workbook')
                    if (why.length) {
                        considered.push({ contractId: contract.contractId, itemId: `${facet.row} ${declaration.declaration} ${declaration.qualifier} ${declaration.selector ?? '*'}`, contractKind: kind, forward: null, why })
                        continue
                    }
                    declarations.push({
                        contractId: contract.contractId,
                        contractKind: kind!,
                        row: facet.row,
                        selector: declaration.selector ?? null,
                        declaration: String(declaration.declaration),
                        qualifier: String(declaration.qualifier),
                        note: typeof declaration.note === 'string' ? declaration.note : null,
                        relationship: kind === 'GAME_FORM' ? (gameFormRelationship?.relationshipId ?? null) : null,
                    })
                }
            }
            const account: 1 | 2 | 4 = !declarations.length ? 4 : declarations.some(entry => entry.contractKind !== 'GAME_FORM') ? 1 : 2
            // Round 4 (M2): only where the facet fails — a declaration it would count, on its row, kind and qualifier, whose selector cannot be read.
            if (enforcedPart && account === 4 && (facet.terms ?? []).length)
                for (const contract of input.contracts) {
                    if (!counted(kindOf(contract))) continue
                    for (const declaration of (contract.declarations ?? []) as any[]) {
                        if (String(declaration?.row) !== facet.row || declaration?.declaration !== facet.declaration.kind || declaration?.qualifier !== facet.declaration.qualifier) continue
                        const defect = selectorDefect(declaration.selector ?? null, facet.row)
                        if (defect) unverified.push(`the selector of ${contract.contractId}'s ${facet.row} ${String(declaration.declaration)} ${String(declaration.qualifier)} declaration does not normalise (${defect}), so whether it declares the component cannot be established`)
                    }
                }
            contextMissing(account)
            return { facetId: facet.id, label: facet.label, account, carriers, declarations, considered, cause: account === 4 ? 'VALUE_MISSING' : null, ...withUnverified(account) }
        }
        for (const contract of input.contracts) {
            const kind = kindOf(contract)
            for (const item of contract.items ?? []) {
                if (!matches(item, facet)) continue
                const outcome = forward.get(`${contract.contractId}::${item.itemId}`)
                const why: string[] = []
                if (!kind || !facet.from.includes(kind)) why.push(kind ? `its contract is ${KIND_WORDS[kind]}, and this facet takes carriers only from ${facet.from.join(', ')}` : `its contract is ${otherKindWords(contract)}, not a carrier kind in this increment (DRAFT)`)
                if (!eligibleBases.includes(String(item.basis)))
                    why.push(`its basis is ${String(item.basis)}: only ${eligibleBases.join(' or ')} items carry a requirement (our extension of SD-83, "EXCLUSION, ASSUMED, ENGINE_ONLY, and OUTSIDE_BOUNDARY contributions do not establish existence.")`)
                if (outcome?.result !== 'SATISFIED') why.push(`the engine's check is ${outcome?.result ?? 'absent'}${outcome?.why ? ` (${outcome.why})` : ''}`)
                // Round 2, R1 S2: what the pattern pins of his approved knowledge. Round 3b (the round-3 review's R3 S3): it reads ALTERED only
                // from an item the facet would otherwise count — a contract kind it takes, an eligible basis — never from one it would not.
                const wouldCount = !!kind && facet.from.includes(kind) && eligibleBases.includes(String(item.basis))
                // Round 4 (ours, DRAFT): on an enforced part, a candidate is shown not to carry it (`demonstrated`), or what of it could not be
                // established is said (`notEstablished`); a shown failure wins. Reads of values computed here; nothing below changes for it.
                const candidate = enforcedPart && wouldCount && counted(kind)
                let demonstrated = false
                let notEstablished: string | null = null
                let shownNote: string | null = null
                if (candidate && outcome?.result !== 'SATISFIED') {
                    if (!outcome || UNDECIDED_RESULTS.includes(outcome.result)) notEstablished = `the engine's check of ${contract.contractId}::${item.itemId} is ${outcome?.result ?? 'absent'}${outcome?.why ? ` (${outcome.why})` : ''}`
                    else demonstrated = true
                }
                if (facet.value !== undefined && !samePinnedValue(facet.value, item.value)) {
                    why.push(`its value is ${shown(item.value)}; this facet asks ${shown(facet.value)}`)
                    if (wouldCount) altered = true
                    demonstrated = true
                }
                if (facet.scope && !facet.scope.includes(String(item.scope))) {
                    why.push(`its scope is ${String(item.scope)}; this facet asks ${facet.scope.join(' or ')}`)
                    if (wouldCount) altered = true
                    demonstrated = true
                }
                let survives: CarrierEvidence['survives'] | null = null
                let value: CarrierEvidence['value'] = null
                let byConstruction = false
                if (!why.length && outcome) {
                    const rowSpec = index.rows.get(String(item.row))
                    const requirement = String(item.requirement)
                    const strictness = String(item.strictness)
                    const isCollection = rowSpec?.kind === 'COLLECTION'
                    if (requirement === 'NOT_EXISTS' || (strictness === 'EXCLUSION' && isCollection && EXISTENCE.includes(requirement))) {
                        // S1: negative existence holds per derivation; vacuous only where no element of its row is in the game at all.
                        survives = { how: 'EXCLUSION_HOLDS', elementIds: [], vacuous: !input.classes.some(cls => cls.row === String(item.row) && inGame(cls.classId)), rereadInGame: false }
                    } else if (strictness === 'EXCLUSION') {
                        // An excluded value: its satisfied result always read values (forward.ts), so it is never vacuous; not re-read here.
                        survives = { how: 'EXCLUSION_HOLDS', elementIds: [], vacuous: false, rereadInGame: false }
                    } else if (isCollection && EXISTENCE.includes(requirement)) {
                        const own = `c:${contract.contractId}:${item.itemId}`
                        if (inGame(own)) survives = { how: 'ELEMENT', elementIds: [own], vacuous: false, rereadInGame: true }
                        else {
                            why.push(`its element ${own} is not in the realized game`)
                            demonstrated = true
                        }
                    } else {
                        // S2: a reached line counts only where it is entailed, on a class holding every term of the pattern, whose element is in the game.
                        const alive = [...new Set(outcome.reach ?? [])].filter(line => {
                            const classId = String(line).split('::')[0]
                            const terms = (classes.get(classId)?.constraints?.terms ?? []) as { attribute: string; op: string; value?: string; values?: string[] }[]
                            const holds = (facet.terms ?? []).every(term => terms.some(entry => termHeld(entry, term)))
                            return String(input.classified?.get(line)?.verdict ?? '') === 'RESOLVED:ENTAILED' && holds && inGame(classId)
                        })
                        if (!alive.length) {
                            why.push("no line it reaches is entailed, on an element of the realized game holding the pattern's terms")
                            // Round 4 (the design review's S7): read only here, where no line survives — whether the evidence the check needs was given.
                            if (candidate) {
                                const lines = [...new Set(outcome.reach ?? [])].map(String)
                                const missing = !input.classified
                                    ? 'no line verdicts were given'
                                    : lines.some(line => input.classified!.get(line)?.verdict === undefined || input.classified!.get(line)?.verdict === null)
                                      ? 'a reached line has no verdict'
                                      : lines.some(line => !classes.has(line.split('::')[0]))
                                        ? "a reached line's element class is not among the classes read"
                                        : null
                                if (missing) notEstablished = `the evidence for the lines ${contract.contractId}::${item.itemId} reaches is missing (${missing})`
                                else demonstrated = true
                            }
                        } else {
                            survives = { how: 'REACHED_LINE', elementIds: [...new Set(alive.map(line => String(line).split('::')[0]))], vacuous: false, rereadInGame: true }
                            if (rowSpec?.kind === 'FIELD') {
                                // M1: the value the finished game holds at each surviving line, read at the register's path. Round 4 (S7): with,
                                // per line, only whether its element was found.
                                const leaf = splitPath(String(rowSpec.path)).leaf
                                const perLine = alive.map(line => {
                                    const [classId, row] = String(line).split('::')
                                    const elements = elementsOf(input.game, classId, row ?? String(item.row), index, input.standsFor)
                                    return { line: String(line), found: elements.length > 0, held: elements.length ? elements.map(element => readPath(element, leaf)) : [undefined] }
                                })
                                const realized = perLine.flatMap(entry => entry.held)
                                value = { authored: copied(item.value), realized: copied(realized) }
                                if (requirement !== 'EQUALS') {
                                    why.push(`its requirement is ${requirement}: the value the finished game holds cannot be compared with it, so it is not counted (DRAFT)`)
                                    notEstablished = `its requirement is ${requirement}: the check cannot compare it with the value the finished game holds`
                                } else {
                                    const lost = realized.filter(held => !sameValue(item.value, held))
                                    if (lost.length) {
                                        why.push(`authored ${shown(item.value)}; the finished game holds ${lost.map(shown).join(', ')}`)
                                        // Round 4 (A6): a value read from an element found, and lost, is shown; one whose element the reader could not
                                        // locate at the register's collection is not established.
                                        if (perLine.some(entry => entry.found && entry.held.some(held => !sameValue(item.value, held)))) demonstrated = true
                                        else
                                            notEstablished = `the element at ${perLine
                                                .filter(entry => !entry.found)
                                                .map(entry => entry.line)
                                                .join(', ')} was not found where the register places its row's collection, so the value the finished game holds could not be read`
                                    }
                                }
                                if (facet.byConstructionWhen === 'RELATIONAL_REFERENT' && realized.some(held => !!relationalReferentOf(held))) byConstruction = true
                            }
                        }
                    }
                }
                if (!why.length && kind === 'GAME_FORM' && !gameFormRelationship) why.push('the context has no ACTIVE relationship to the selected game form in his workbook')
                let condition: ConditionReading | null = null
                if (!why.length && part.kind === 'SCORING_CONDITION_COMPONENT' && facet.row === CONDITION_ROW) {
                    condition = conditionReadingOf(contextId, contract, item.itemId, input.game, input.episodeCheck)
                    if (!(condition.governs && condition.elementFound)) {
                        notGoverning = true
                        why.push(condition.why ?? `its own element c:${contract.contractId}:${item.itemId} is not on the realized primary event`)
                        // Round 4 (the design review's M1): which of the guard's branches it was, and the episode check's state, from its own
                        // reading; the fix round (R2 M1): where it is shown, what shows it.
                        if (candidate) {
                            const evidence = conditionEvidenceOf(condition, input.episodeCheck)
                            notEstablished = 'unverified' in evidence ? evidence.unverified : null
                            shownNote = 'shown' in evidence ? evidence.shown : null
                            demonstrated = notEstablished === null
                        }
                    }
                }
                if (candidate && !demonstrated && notEstablished) unverified.push(notEstablished)
                if (candidate && demonstrated && shownNote) shownNotes.push(shownNote)
                if (why.length || !survives || !kind) {
                    considered.push({ contractId: contract.contractId, itemId: item.itemId, contractKind: kind, forward: outcome?.result ?? null, why })
                    continue
                }
                carriers.push({
                    contractId: contract.contractId,
                    itemId: item.itemId,
                    contractKind: kind,
                    row: String(item.row),
                    selector: typeof item.selector === 'string' ? item.selector : null,
                    requirement: String(item.requirement),
                    strictness: String(item.strictness),
                    basis: String(item.basis),
                    category: typeof item.category === 'string' ? item.category : null,
                    scope: item.scope === undefined || item.scope === null ? null : String(item.scope),
                    forward: { result: String(outcome!.result), why: outcome!.why, reach: [...(outcome!.reach ?? [])] },
                    survives,
                    value,
                    byConstruction,
                    relationship: kind === 'GAME_FORM' ? (gameFormRelationship?.relationshipId ?? null) : null,
                    condition: copied(condition),
                })
            }
        }
        const account: 1 | 2 | 4 = !carriers.length ? 4 : carriers.some(carrier => carrier.contractKind !== 'GAME_FORM') ? 1 : 2
        // Round 4 (the design review's M2): only where the facet fails — an item it would count, on its row, requirement and strictness, whose
        // selector does not normalise, so it was never matched: whether it carries the component cannot be established.
        if (enforcedPart && account === 4 && (facet.terms ?? []).length)
            for (const contract of input.contracts) {
                if (!counted(kindOf(contract))) continue
                for (const item of contract.items ?? []) {
                    if (!eligibleBases.includes(String(item.basis)) || !matches(item, { row: facet.row, requirement: facet.requirement, strictness: facet.strictness, terms: [] })) continue
                    const defect = selectorDefect(item.selector, String(item.row))
                    if (defect) unverified.push(`the selector of ${contract.contractId}::${item.itemId} does not normalise (${defect}), so whether it carries the component cannot be established`)
                }
            }
        contextMissing(account)
        return {
            facetId: facet.id,
            label: facet.label,
            account,
            carriers,
            declarations,
            considered,
            cause: account === 4 ? (notGoverning ? 'NOT_GOVERNING' : altered ? 'ALTERED' : 'NOT_CARRIED') : null,
            ...withUnverified(account),
        }
    }

    const classification = (note: string | null) => ({ standing: 'DRAFT' as const, by: 'OURS' as const, bindingsVersion: bindings.version, note })
    const base = (row: ContextRow) => ({ rowId: row.rowId, rowSheet: row.sheet, rowRole: row.role, rowText: row.text, expectedEvidence: row.expectedEvidence })
    type Derived = 'accountWords' | 'countsAsSatisfied' | 'standardWords' | 'satisfied' | 'satisfiedWords' | 'authority' | 'flag' | 'enforced'
    /** Round 3, his item 2: where the authority for what carries a part originates, named by the contract it sits in (DRAFT words). */
    const authorityWords = (kind: CarrierKind, contractId: string, relationship: string | null, basis: string | null): string =>
        kind === 'CONTEXT'
            ? `the context's knowledge (${knowledgeKey(contractId)})`
            : kind === 'REALIZATION'
              ? `this activity's provisional realization${basis === 'OWNER_RULING' ? ', his provisional choice' : ''} (${contractId})`
              : // Round 3b (R2 N1): the relationship is the context's (his mapping, our resolution), not his alone.
                `the Game Form's knowledge (${knowledgeKey(contractId)}${relationship ? `, through the context's relationship ${relationship}` : ''})`
    const authorityOf = (fields: Omit<RequirementPartAccount, Derived>): RequirementPartAccount['authority'] => {
        const entries: { origin: AuthorityOrigin; words: string }[] = []
        const add = (origin: AuthorityOrigin, words: string) => {
            if (!entries.some(entry => entry.words === words)) entries.push({ origin, words })
        }
        for (const facet of fields.facets) {
            for (const carrier of facet.carriers) add(AUTHORITY_OF_KIND[carrier.contractKind], authorityWords(carrier.contractKind, carrier.contractId, carrier.relationship, carrier.basis))
            for (const declaration of facet.declarations) add(AUTHORITY_OF_KIND[declaration.contractKind], authorityWords(declaration.contractKind, declaration.contractId, declaration.relationship, null))
        }
        if (fields.guard && fields.account !== 4) add('CONTEXT_KNOWLEDGE', `the context's knowledge: the scoring events it approves${fields.guard.relationshipIds.length ? ` (${fields.guard.relationshipIds.join(', ')})` : ''}`)
        return {
            from: [...new Set(entries.map(entry => entry.origin))],
            // Round 3b (R2 N4): never "no authority" — a coach-observed part's observable has its own source, shown beside it.
            words: entries.length
                ? entries.map(entry => entry.words).join('; ')
                : fields.kind === 'COACH_OBSERVED'
                  ? "No feature of the activity carries it: the coach judges it in play (its observable's source is below)."
                  : 'Nothing in the activity carries it.',
        }
    }
    const finish = (fields: Omit<RequirementPartAccount, Derived>): RequirementPartAccount => {
        const satisfied: SatisfiedStanding = fields.account === 1 || fields.account === 2 ? 'YES' : fields.account === 3 ? 'NOT_COUNTED' : 'NO'
        const byAbsence = satisfied === 'YES' && fields.vacuous
        const absentRows = [...new Set(fields.facets.flatMap(facet => facet.carriers.filter(carrier => carrier.survives.vacuous).map(carrier => carrier.row)))]
        return {
            ...fields,
            accountWords: HIS_ACCOUNTS[fields.account],
            countsAsSatisfied: satisfied === 'YES',
            satisfied,
            satisfiedWords: byAbsence ? SATISFIED_BY_ABSENCE_WORDS : SATISFIED_WORDS[satisfied],
            authority: authorityOf(fields),
            flag: fields.vacuous ? byAbsenceFlag(absentRows) : fields.byConstruction ? copied(PART_FLAGS.BY_CONSTRUCTION) : null,
            // Round 3, his item 7 (our DRAFT reading): a structural component of the approved scoring condition that quotes his words.
            enforced: enforcedPartOf({ sheet: fields.rowSheet, role: fields.rowRole }, fields),
            standardWords: HIS_STANDARDS[fields.standard],
        }
    }
    const partOf = (row: ContextRow, part: BindingPart): RequirementPartAccount => {
        const common = {
            ...base(row),
            partId: part.id,
            partLabel: part.label,
            kind: part.kind,
            component: part.component ?? null,
            rowSpan: part.rowSpan ?? null,
            standard: part.standard,
            facets: [] as FacetAccount[],
            guard: null as RequirementPartAccount['guard'],
            observable: null as RequirementPartAccount['observable'],
            observableIdentified: false,
            recordedOutside: [] as RequirementPartAccount['recordedOutside'],
            sameReferent: null as RequirementPartAccount['sameReferent'],
            byConstruction: false,
            vacuous: false,
            accountsFor: [...(part.accountsFor ?? [])],
            restsOnDraftKnowledge: false,
            classification: classification(part.standingNote ?? null),
        }
        if (part.kind === 'COACH_OBSERVED') {
            const observable = part.observable ?? null
            // Recorded outside the representation: listed for information, never counted.
            const recordedOutside = input.contracts.flatMap(contract =>
                (contract.items ?? [])
                    .filter(item => (part.recordedOutsideBy ?? []).some(pattern => matches(item, pattern) && (!kindOf(contract) || pattern.from.includes(kindOf(contract)!))))
                    .filter(item => forward.get(`${contract.contractId}::${item.itemId}`)?.result === 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION')
                    .map(item => ({ contractId: contract.contractId, itemId: item.itemId })),
            )
            // S4: his category 3 is "with the relevant observable conditions identified"; without one, the part is 4.
            return finish({
                ...common,
                observable: observable ? { text: observable.text, source: observable.source, citedAs: observable.citedAs ? { ...observable.citedAs } : null, expect: observable.expect ?? 'PRESENT', standing: 'DRAFT' } : null,
                observableIdentified: !!observable,
                recordedOutside,
                account: observable ? 3 : 4,
                cause: observable ? null : { kind: 'OBSERVABLE_NOT_IDENTIFIED', detail: 'No observable condition is identified for the coach to judge, and his category 3 requires one, so the part is unsupported until one is.' },
            })
        }
        if (part.kind === 'UNSUPPORTED') return finish({ ...common, account: 4, cause: { kind: part.cause!.kind, detail: part.cause!.detail } })
        if (part.kind === 'GUARD_EVENT_KIND') {
            const reading = input.eventKind
            const relationshipIds = rpcLibrary
                .relationships(contextId, 'SCORING_EVENT')
                .filter(entry => entry.relatedId === String(reading.kind))
                .map(entry => entry.relationshipId)
            const carried = reading.approved && reading.findings.length === 0
            return finish({
                ...common,
                guard: { ...copied(reading), relationshipIds },
                account: carried ? 1 : 4,
                cause: carried ? null : { kind: 'NOT_CARRIED', detail: reading.findings.join(' | ') || 'the realized primary event is not one the context approves' },
            })
        }
        // Round 4: a part the enforcement reads — the one predicate `finish` and `scoringComponentReading` read too — records what of a failing
        // facet could not be established, or what shows it failing.
        const enforcedPart = enforcedPartOf(row, part)
        const facets = (part.facets ?? []).map(facet => facetOf(part, facet, enforcedPart))
        const worst = !facets.length || facets.some(facet => facet.account === 4) ? 4 : (Math.max(...facets.map(facet => facet.account)) as 1 | 2)
        const causeKind: ComputedCause | null = worst !== 4 ? null : causeOfFacets(facets)
        const carriers = facets.flatMap(facet => facet.carriers)
        return finish({
            ...common,
            facets,
            account: worst,
            cause: causeKind ? { kind: causeKind, detail: describeFacets(facets) } : null,
            byConstruction: carriers.some(carrier => carrier.byConstruction),
            vacuous: carriers.length > 0 && carriers.every(carrier => carrier.survives.vacuous),
            restsOnDraftKnowledge: carriers.some(carrier => carrier.category === DRAFT_KNOWLEDGE),
        })
    }

    const parts: RequirementPartAccount[] = []
    const notApplicable: BlockRequirementAccount['notApplicable'] = []
    const over = new Set(bindings.applicability.overReturnedAlternatives.validationDomains)
    const enforcedOnly = input.only === 'ENFORCED'
    for (const row of applicableRows(contextId, bindings.applicability).accounted) {
        // Round 3: what the build enforces only — the approved scoring condition's row, and of it only its components (below).
        if (enforcedOnly && !(row.sheet === 'properties' && row.role === PRIMARY_SCORING_CONDITION)) continue
        if (!input.alternativesReturned && row.sheet === 'validation_rules' && over.has(row.role)) {
            notApplicable.push({ rowId: row.rowId, rowRole: row.role, rowText: row.text, why: bindings.applicability.overReturnedAlternatives.why })
            continue
        }
        const binding = contextBindings?.rows.find(entry => entry.rowId === row.rowId) ?? null
        if (!binding) {
            // Only possible for a context the bindings do not cover (a TEST-ONLY draft build): visible, never silent.
            parts.push(
                finish({
                    ...base(row),
                    partId: 'not-classified',
                    partLabel: 'No classification of this row has been drafted',
                    kind: 'NO_BINDING',
                    component: null,
                    rowSpan: null,
                    account: 4,
                    standard: 'STRUCTURAL_VALIDITY',
                    facets: [],
                    guard: null,
                    observable: null,
                    observableIdentified: false,
                    recordedOutside: [],
                    sameReferent: null,
                    byConstruction: false,
                    vacuous: false,
                    accountsFor: [],
                    cause: { kind: 'NO_BINDING', detail: `no classification of ${row.rowId} has been drafted in ${bindings.file}` },
                    restsOnDraftKnowledge: false,
                    classification: classification(null),
                }),
            )
            continue
        }
        // Round 3: under `only: 'ENFORCED'`, the components quoting his words alone (the gate lets only a structural part naming a component
        // quote them), each read exactly as below; the referent check reads components only, and every component quotes his words.
        const bound = enforcedOnly ? binding.parts.filter(part => part.rowSpan !== undefined) : binding.parts
        const rowParts = bound.map(part => partOf(row, part))
        // M1: control and exclusion are evaluated against the progression outcome, read from the referents the finished game holds.
        for (const [at, part] of bound.entries()) {
            const same = part.sameReferentAs
            if (!same) continue
            const account = rowParts[at]
            const other = rowParts.find(candidate => candidate.kind === 'SCORING_CONDITION_COMPONENT' && candidate.component === same.component && candidate !== account)
            const referents = (target: RequirementPartAccount | undefined) => [...new Set((target?.facets.find(facet => facet.facetId === same.facet)?.carriers ?? []).flatMap(carrier => (carrier.value?.realized ?? []).map(referentIdentity)))]
            const mine = referents(account)
            const theirs = referents(other)
            if (!mine.length || !theirs.length) {
                account.sameReferent = { component: same.component, facet: same.facet, evaluated: false, holds: null, detail: !mine.length ? 'not evaluated: this component carries no referent' : `not evaluated: the ${same.component} component carries no referent to compare with` }
                continue
            }
            const holds = mine.every(identity => theirs.includes(identity))
            account.sameReferent = { component: same.component, facet: same.facet, evaluated: true, holds, detail: holds ? `the same referent as the ${same.component} component: ${mine.join(', ')}` : `its referent (${mine.join(', ')}) is not the referent of the ${same.component} component (${theirs.join(', ')})` }
            if (!holds) {
                rowParts[at] = finish({ ...account, account: 4, cause: { kind: 'NOT_THE_SAME_REFERENT', detail: `${account.sameReferent.detail}. ${same.because}` } })
            }
        }
        parts.push(...rowParts)
    }
    return { blockId, contextId, status: 'ACCOUNTED', reasons: [], parts, notApplicable, roleScoring }
}

// ── The activity ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const ORDER: AccountKind[] = [1, 2, 3, 4]
/** The worst account: 4 > 3 > 2 > 1, so that 3 (not counted as satisfied in this account: our DRAFT rule) is worse than 1 and 2. */
const worse = (a: AccountKind, b: AccountKind): AccountKind => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b)
const STRUCTURAL: RequirementPartAccount['kind'][] = ['SCORING_CONDITION_COMPONENT', 'PATTERN', 'GUARD_EVENT_KIND']
/**
 * **The one statement of which parts the enforcement reads** — the fix round (the R1 review's S5): our DRAFT reading of his item 7, a
 * structural part of the approved scoring condition's row that quotes his words. The block reader (what records `unverified` and `shown`),
 * `finish` (`enforced`) and `scoringComponentReading` (what refuses) all read it, so they cannot drift apart.
 */
function enforcedPartOf(row: { sheet: string; role: string }, part: { kind: RequirementPartAccount['kind']; rowSpan?: string | null }): boolean {
    return STRUCTURAL.includes(part.kind) && !!part.rowSpan && row.sheet === 'properties' && row.role === PRIMARY_SCORING_CONDITION
}
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
/** A part's fields without its per-block accounts, as text, to tell a block's part from the merged one. */
const partText = ({ perBlock: _perBlock, ...part }: MergedPart | (RequirementPartAccount & { perBlock?: unknown })) => canonical(part)

/**
 * **Which characters of his row's text the spans cover** (round 3c, the recheck's S-A): whitespace collapsed, every occurrence of every span
 * marked, in no order — so a shorter span never stops a longer one from matching, as removing them one after another did.
 */
function coverageOf(text: string, spans: string[]): { normalized: string; covered: boolean[] } {
    const normalized = text.replace(/\s+/g, ' ')
    const covered = new Array<boolean>(normalized.length).fill(false)
    for (const span of spans) {
        const wanted = span.replace(/\s+/g, ' ')
        if (!wanted.length) continue
        for (let at = normalized.indexOf(wanted); at >= 0; at = normalized.indexOf(wanted, at + 1)) covered.fill(true, at, at + wanted.length)
    }
    return { normalized, covered }
}
/** The words of a text, each with where it starts. */
const wordsWithPlaces = (normalized: string): { word: string; at: number }[] => [...normalized.matchAll(/[A-Za-z][A-Za-z'-]*/g)].map(match => ({ word: match[0], at: match.index ?? 0 }))
/** Words of his row's text no span covers, whole (a word counts as covered only where every letter is): every word where there is no span. */
function wordsNotIn(text: string, spans: string[]): string | null {
    const { normalized, covered } = coverageOf(text, spans)
    const words = wordsWithPlaces(normalized).filter(entry => !covered.slice(entry.at, entry.at + entry.word.length).every(Boolean))
    return words.length ? words.map(entry => entry.word).join(' ') : null
}
/** Tokens of his row's text no structural span covers (S1); null where no part quotes a span (the summary's reading). */
const uncoveredWordsOf = (text: string, spans: string[]): string | null => (spans.length ? wordsNotIn(text, spans) : null)
/** The spans the uncovered words are read against: every part quoting his words, which is every enforced component (round 3), so the account and the refusal read alike. */
const enforcedSpans = (rowParts: { rowSpan: string | null }[]): string[] => rowParts.map(part => part.rowSpan).filter((span): span is string => !!span)

/** What each computed cause means for an enforced component, in the refusal's technical reason (DRAFT words). */
const FAILURE_WORDS: Partial<Record<ComputedCause, string>> = {
    NOT_CARRIED: 'is missing from the activity as built',
    VALUE_MISSING: 'is missing: no value is carried, and no declaration says it needs none',
    ALTERED: 'is altered: what the activity holds is not what his approved knowledge carries (a pinned value or scope differs)',
    NOT_GOVERNING: 'does not govern the realized scoring event',
    NOT_THE_SAME_REFERENT: 'is not read on the same referent as the component it qualifies',
    NO_BINDING: 'is not accounted in this block',
}

/**
 * What the enforcement found on one block (round 3b): the refusal's reasons, and the components classified only for coach observation.
 * Round 4 (his reply filed 5 November 2026, item 1): each reason in his two classes, `failures.map(f => f.reason)` equal to `findings` by
 * construction; `findings` stays what the build refuses on.
 */
export interface ScoringEnforcementReading {
    findings: string[]
    failures: EnforcementFailure[]
    coachObservedOnly: CoachObservedOnly[]
}

/** Round 4: why a finding of each path-level source is a verification failure (ours, DRAFT). */
const VERIFICATION_BECAUSE: Record<Exclude<EnforcementFailureSource, 'COMPONENT'>, string> = {
    PART_NOT_READ: "The bindings classify this component, but this block's reading holds no part for it, so it was not checked here (ours, DRAFT).",
    READ_WITHOUT_CAUSE: 'The part was read as not carried with no cause recorded, so what failed cannot be established (ours, DRAFT).',
    BINDINGS_REFUSED: 'The requirement bindings, which classify the components, were refused or could not be read where the enforcement reads them (ours, DRAFT).',
    READER_FAILED: 'The reader failed, so the check of the components gave no result (ours, DRAFT).',
    NO_BINDINGS: 'No requirement bindings were read, so the components are not classified for this reading (ours, DRAFT).',
    OUTSIDE_APPLICABLE_SET: "The approved scoring condition's row is outside the applicable set the bindings classify (ours, DRAFT).",
    NOT_CLASSIFIED: 'The approved scoring condition is not classified into components, so no component can be checked (ours, DRAFT).',
    UNCLASSIFIED_WORDS: 'Words of his approved row are classified by no part, so whether the activity carries what they say cannot be established (ours, DRAFT).',
    ENFORCEMENT_FAILED: 'The enforcement itself failed, so no reading of the components was made (ours, DRAFT).',
    UNTYPED: 'The finding was handed to the account without a class, so its class cannot be established (ours, DRAFT).',
}
/** Round 4: why a component shown missing or altered is in that class, by the cause its words give (ours, DRAFT). */
const DEMONSTRATED_BECAUSE: Partial<Record<ComputedCause, string>> = {
    NOT_CARRIED: 'Read in the activity as built (its contracts and finished game): nothing counted carries it (ours, DRAFT).',
    VALUE_MISSING: 'Read in the activity as built: no value is carried, and no declaration says it needs none (ours, DRAFT).',
    ALTERED: 'Read in the activity as built: what would carry it holds another value or scope than his approved knowledge pins (ours, DRAFT).',
    // The fix round (R2 M1): only where no facet says what shows it (a part handed in by a caller); otherwise the `because` says what was read.
    NOT_GOVERNING: 'Read on the realized scoring event: its condition does not govern it as authored, as the detail of the reason says (ours, DRAFT).',
    NOT_THE_SAME_REFERENT: 'Both referents were read in the finished game, and they are not the same (ours, DRAFT).',
}
/** Round 4 (A.2's P6d): causes that say the part's classification or evidence is missing; none reaches an enforced part today. */
const UNVERIFIABLE_CAUSES: ComputedCause[] = ['NO_BINDING', 'MISSING_KNOWLEDGE', 'MISSING_IMPLEMENTATION', 'OBSERVABLE_NOT_IDENTIFIED']

/**
 * **The class of an enforced component read 4** — round 4 (his reply filed 5 November 2026, item 1; our DRAFT rule, `classRule`). Missing or
 * altered where the reader positively read it so: a referent read on both sides and not the same; an event kind the context does not
 * approve; or a facet that demonstrably fails (a failing facet with nothing `unverified`), whose cause its words give. A verification failure
 * where every failing facet — at least one — could not be established (the design review's S1), where its cause says its classification or
 * evidence is missing, or where the guard reports findings this enforcement does not type (A2). A part read 4 by a caller with no failing
 * facet recorded follows its cause: missing or altered.
 *
 * The fix round: `shown` is what the facets that demonstrably fail say shows it (a condition not governing: the R2 review's M1), stated in the
 * reason and in the `because`; and where a facet beside them could not be established, the reason's words and its `detail` both come from the
 * facets that did fail (the R3 review's S-3), so they never name different failures. Otherwise `detail` is the part's own.
 */
function componentClassOf(read: RequirementPartAccount & { cause: { kind: ComputedCause; detail: string } }): {
    failureClass: EnforcementFailureClass
    cause: ComputedCause
    because: string
    unverified: string | null
    shown: string | null
    detail: string
} {
    const cause = read.cause.kind
    const asShown = (as: ComputedCause, facets: FacetAccount[] = [], detail = read.cause.detail) => {
        const notes = [...new Set(facets.flatMap(facet => facet.shown ?? []))]
        return {
            failureClass: 'MISSING_OR_ALTERED' as const,
            cause: as,
            because: notes.length ? `Read in the activity as built: ${notes.join('; ')} (ours, DRAFT).` : (DEMONSTRATED_BECAUSE[as] ?? `Read in the activity as built: ${as} (ours, DRAFT).`),
            unverified: null,
            shown: notes.length ? notes.join('; ') : null,
            detail,
        }
    }
    const notShown = (unverified: string, because: string) => ({ failureClass: 'VERIFICATION_FAILURE' as const, cause, because, unverified, shown: null, detail: read.cause.detail })
    if (read.kind === 'GUARD_EVENT_KIND')
        return read.guard && !read.guard.approved
            ? { ...asShown(cause), because: 'Read on the realized scoring event: it is not one the context approves (ours, DRAFT).' }
            : notShown("the guard's reading reports findings this enforcement does not type", "The guard's reading reports findings this enforcement does not type, so whether the component is carried cannot be established (ours, DRAFT).")
    if (cause === 'NOT_THE_SAME_REFERENT') return asShown(cause)
    if (UNVERIFIABLE_CAUSES.includes(cause)) return notShown(`its cause, ${cause}, says its classification or evidence is missing`, `Its cause (${cause}) says its classification or evidence is missing, so whether it is carried cannot be established (ours, DRAFT).`)
    const failing = read.facets.filter(facet => facet.account === 4)
    if (failing.length && failing.every(facet => !!facet.unverified?.length))
        return notShown(
            failing.map(facet => `${facet.label}: ${facet.unverified!.join('; ')}`).join('; '),
            'What could carry it was not established: a check absent or undecided, the evidence a check needs missing, or a carrier that cannot be read, so whether the finished activity preserves it cannot be established (ours, DRAFT).',
        )
    // A facet that demonstrably fails makes the component fail. Where a facet beside it could not be established, its words and its detail are
    // those of the facets that did fail (the part's own order of causes); otherwise the part's own, so its reason reads exactly as before.
    const demonstrated = failing.filter(facet => !facet.unverified?.length)
    return demonstrated.length && demonstrated.length < failing.length ? asShown(causeOfFacets(demonstrated), demonstrated, describeFacets(demonstrated)) : asShown(cause, demonstrated)
}

/**
 * **What the build refuses on: the approved scoring condition's components, missing or altered** — 29 October 2026, round 3; round 3b, 30 October 2026. His reply filed 4
 * November 2026, item 7: *"I approve beginning narrowly with missing or altered components of approved scoring conditions, where those
 * components are clearly defined, structurally necessary, and mechanically verifiable."* One block's reading, the full account's or the
 * enforced reading alone (`only: 'ENFORCED'`), gives the technical reasons the build refuses on at the validation stage, each naming the
 * component, his row's words it stands for, and what failed; empty where every component is carried.
 *
 * **Which words are classified** (round 3b, the round-3 review's R2 M1): his row's words are read against every part that classifies them —
 * the enforced components' spans, and the verbatim observable text of each coach-observed part of the same row that names a component and
 * cites this row. A component classified only for coach observation is reported (`coachObservedOnly`), never refused: his item 7, *"I
 * would not yet extend refusal to every unsupported purpose statement, inferred affordance relationship, or coach-observed condition."* Only
 * words that no part classifies refuse.
 *
 * **Verification failures, refused as he approved** (round 4, his reply filed 5 November 2026, item 1: *"I approve retaining the safeguard
 * that refuses a checked activity when an essential scoring-condition component cannot be verified."*): bindings refused or unreadable where
 * the enforcement reads them (the caller's `enforcementBindingsFor`), a reader that failed, a scoring condition outside the applicable set or
 * not classified at all, words no part classifies, and a component whose failing facets could not be established, each refuse — an activity
 * whose components cannot be verified is not served. Every finding carries its class (`failures`): *"Both should prevent an activity from
 * being served as checked, but the diagnostic report should clearly distinguish them."* (same item). Which cause is which class is our DRAFT
 * reading (`componentClassOf`); the class never decides whether to refuse, and every finding is pushed in the branch, the order and the words
 * it was before, with its class named at its head — except that, since the fix round, a condition shown not governing says what shows it,
 * and a component whose shown facet stands beside one that cannot be established takes its words and detail from the shown facet. A
 * context whose workbook has no ACTIVE approved scoring condition gives nothing to enforce. Which parts the row binds is read from the bindings, so the full reading and the enforced one say the same. Pure: the caller
 * decides whether to enforce (a production-contracted context's build, on every route).
 */
export function scoringComponentReading(account: BlockRequirementAccount, bindings: RequirementBindings | null): ScoringEnforcementReading {
    const { contextId } = account
    const findings: string[] = []
    const failures: EnforcementFailure[] = []
    const coachObservedOnly: CoachObservedOnly[] = []
    /** Round 4: every finding is pushed with its class, so `failures` and `findings` say the same by construction. */
    const push = (failureClass: EnforcementFailureClass, source: EnforcementFailureSource, fields: { rowId?: string; component?: string | null; partId?: string; cause?: ComputedCause | null }, because: string, reason: string) => {
        findings.push(reason)
        failures.push({ failureClass, source, rowId: fields.rowId ?? null, component: fields.component ?? null, partId: fields.partId ?? null, cause: fields.cause ?? null, because, reason })
    }
    const cannot = (source: Exclude<EnforcementFailureSource, 'COMPONENT'>, why: string, rowId?: string) =>
        push('VERIFICATION_FAILURE', source, { rowId }, VERIFICATION_BECAUSE[source], `${SCORING_REASON_HEAD.VERIFICATION_FAILURE}the components of ${contextId}'s approved scoring condition cannot be verified, so the activity is not served (fail-closed): ${why}`)
    const done = (): ScoringEnforcementReading => ({ findings, failures, coachObservedOnly })
    if (account.status === 'BINDINGS_REFUSED') {
        cannot('BINDINGS_REFUSED', `the requirement bindings were refused: ${account.reasons.join(' | ')}`)
        return done()
    }
    if (account.status === 'ERROR') {
        cannot('READER_FAILED', `the reader failed: ${account.reasons.join(' | ')}`)
        return done()
    }
    if (!bindings) {
        cannot('NO_BINDINGS', 'no requirement bindings were read')
        return done()
    }
    const accounted = applicableRows(contextId, bindings.applicability).accounted
    const contextBindings = bindings.contexts.find(entry => entry.contextId === contextId) ?? null
    for (const row of contextRowsOf(contextId).filter(candidate => candidate.sheet === 'properties' && candidate.role === PRIMARY_SCORING_CONDITION)) {
        if (!accounted.some(candidate => candidate.rowId === row.rowId)) {
            cannot('OUTSIDE_APPLICABLE_SET', `its row ${row.rowId} is outside the applicable set of ${bindings.file}`, row.rowId)
            continue
        }
        const binding = contextBindings?.rows.find(entry => entry.rowId === row.rowId) ?? null
        if (!binding || !binding.parts.length) {
            cannot('NOT_CLASSIFIED', `${row.rowId} is not classified into components in ${bindings.file}`, row.rowId)
            continue
        }
        // The enforced components: the parts of the row quoting his words, each read from this block's own account.
        const enforcedParts = binding.parts.filter(part => enforcedPartOf(row, part))
        for (const part of enforcedParts) {
            const read = account.parts.find(entry => entry.rowId === row.rowId && entry.partId === part.id)
            // Read by the account itself (1 or 2 carries it), never by a field derived from it.
            if (read && (read.account === 1 || read.account === 2)) continue
            const fields = { rowId: row.rowId, component: part.component ?? null, partId: part.id }
            const head = (failureClass: EnforcementFailureClass) => `${SCORING_REASON_HEAD[failureClass]}the ${part.component} component of ${contextId}'s approved scoring condition (${row.rowId}), "${part.rowSpan}", `
            if (!read) {
                push('VERIFICATION_FAILURE', 'PART_NOT_READ', { ...fields, cause: 'NO_BINDING' }, VERIFICATION_BECAUSE.PART_NOT_READ, `${head('VERIFICATION_FAILURE')}${FAILURE_WORDS.NO_BINDING}: the ${part.id} part is bound but was not read in this block`)
                continue
            }
            const cause = read.cause
            if (!cause) {
                push('VERIFICATION_FAILURE', 'READ_WITHOUT_CAUSE', fields, VERIFICATION_BECAUSE.READ_WITHOUT_CAUSE, `${head('VERIFICATION_FAILURE')}cannot be verified (it was read as not carried with no cause recorded): not carried`)
                continue
            }
            const classed = componentClassOf({ ...read, cause })
            // The fix round (R2 M1): a shown failure says what shows it, as a verification failure says what could not be established.
            if (classed.failureClass === 'MISSING_OR_ALTERED')
                push(
                    'MISSING_OR_ALTERED',
                    'COMPONENT',
                    { ...fields, cause: classed.cause },
                    classed.because,
                    `${head('MISSING_OR_ALTERED')}${FAILURE_WORDS[classed.cause] ?? `is not carried (${classed.cause})`}${classed.shown ? ` (${classed.shown})` : ''}: ${classed.detail}`,
                )
            else push('VERIFICATION_FAILURE', 'COMPONENT', { ...fields, cause: classed.cause }, classed.because, `${head('VERIFICATION_FAILURE')}cannot be verified (${classed.unverified}): ${classed.detail}`)
        }
        // Round 3b (R2 M1): words a coach-observed part classifies — its observable, verbatim in this row — are classified, judged in play.
        const observed = binding.parts.filter(
            part =>
                part.kind === 'COACH_OBSERVED' &&
                !!part.component &&
                part.observable?.source === 'KNOWLEDGE_ROW' &&
                (part.observable.citedAs as KnowledgeRowCitation | null)?.rowId === row.rowId &&
                !!part.observable.text,
        )
        // Round 3c (the recheck's S-A): coverage is marked in character ranges, in no order. Each coach-observed part reports, word by word, the
        // words of his row that it alone classifies — those no enforced span covers — whether or not its component also has an enforced part.
        const structuralSpans = enforcedSpans(enforcedParts.map(part => ({ rowSpan: part.rowSpan ?? null })))
        const structural = coverageOf(row.text, structuralSpans)
        for (const part of observed) {
            const own = coverageOf(row.text, [part.observable!.text])
            const onlyObserved = wordsWithPlaces(own.normalized).filter(entry => {
                const letters = (covered: boolean[]) => covered.slice(entry.at, entry.at + entry.word.length).every(Boolean)
                return letters(own.covered) && !letters(structural.covered)
            })
            if (!onlyObserved.length) continue
            if (coachObservedOnly.some(entry => entry.rowId === row.rowId && entry.partId === part.id)) continue
            coachObservedOnly.push({ rowId: row.rowId, component: part.component!, partId: part.id, words: onlyObserved.map(entry => entry.word).join(' ') })
        }
        const unclassified = wordsNotIn(row.text, [...structuralSpans, ...observed.map(part => part.observable!.text)])
        if (unclassified !== null) cannot('UNCLASSIFIED_WORDS', `words of ${row.rowId} that no part classifies: "${unclassified}"`, row.rowId)
    }
    return done()
}
/**
 * **The fail-closed reading where the enforcement itself failed** (round 3b, the round-3 review's R1 S3): built from the message alone, with
 * no other reading, so the build's last resort cannot throw out of the route. Round 4: a verification failure (his reply filed 5 November
 * 2026, item 1) — the check malfunctioned — still pure string-building.
 */
export function failClosedReading(contextId: string, message: string): ScoringEnforcementReading {
    const reason = `${SCORING_REASON_HEAD.VERIFICATION_FAILURE}the components of ${contextId}'s approved scoring condition cannot be verified, so the activity is not served (fail-closed): the enforcement failed: ${message}`
    return {
        findings: [reason],
        failures: [{ failureClass: 'VERIFICATION_FAILURE', source: 'ENFORCEMENT_FAILED', rowId: null, component: null, partId: null, cause: null, because: VERIFICATION_BECAUSE.ENFORCEMENT_FAILED, reason }],
        coachObservedOnly: [],
    }
}
/** The refusal's reasons alone (`scoringComponentReading`). */
export function scoringComponentFindings(account: BlockRequirementAccount, bindings: RequirementBindings | null): string[] {
    return scoringComponentReading(account, bindings).findings
}

export interface ActivityRequirementInputs {
    contextId: string
    /** 'served', or the stage it was refused at. */
    outcome: string
    bindings: RequirementBindings | null
    refused: string[] | null
    /**
     * Each block: its account, and (round 3b) what the build's enforcement found on it — read by the build itself from the bindings the
     * enforcement may read (`enforcementBindingsFor`), which may differ from the account's where a gate reason reaches no enforced part. Where
     * absent, the enforcement is read again here from the account.
     */
    blocks: { blockId: string; account: BlockRequirementAccount | null; enforcement?: ScoringEnforcementReading | null }[]
    draftContract: boolean
}

/** The standing tail every account carries, whatever its status (R3 NIT 5: one helper). */
const standingOf = () => ({
    about: REQUIREMENT_ACCOUNT_ABOUT,
    accounts: ORDER.map(id => ({ id, words: HIS_ACCOUNTS[id] })),
    standards: (Object.keys(HIS_STANDARDS) as RequirementStandard[]).map(id => ({ id, words: HIS_STANDARDS[id] })),
    coachObservationRule: COACH_OBSERVATION_RULE,
    citedAs: HIS_WORDS_CITED_AS,
})
/** Round 3: the build enforces where the context's contract is a production one (a TEST-ONLY draft contract is reported only). Round 4: with each finding's class, counted. */
const enforcementOf = (applied: boolean, findings: string[], failures: AccountEnforcementFailure[], coachObservedOnly: CoachObservedOnly[]): RequirementAccount['enforcement'] => ({
    ...copied(SCORING_ENFORCEMENT),
    applied,
    findings,
    failures: copied(failures),
    counts: {
        MISSING_OR_ALTERED: failures.filter(failure => failure.failureClass === 'MISSING_OR_ALTERED').length,
        VERIFICATION_FAILURE: failures.filter(failure => failure.failureClass === 'VERIFICATION_FAILURE').length,
    },
    coachObservedOnly: copied(coachObservedOnly),
})

/**
 * **Each finding once, in his two classes, with the blocks that gave it** (round 4, his reply filed 5 November 2026, item 1). One failure per
 * finding, in the order of `findings`: the first block's typed failure of that reason, or — for a reading handed in without one (an older
 * shape) — an UNTYPED verification failure, so the counts always sum to the findings (the design review's S4: read defensively, never thrown).
 */
function failuresOf(findings: string[], readings: { blockId: string; reading: ScoringEnforcementReading }[]): AccountEnforcementFailure[] {
    return findings.map((reason): AccountEnforcementFailure => {
        const typed = readings.flatMap(entry => entry.reading.failures ?? []).find(failure => failure?.reason === reason)
        const blocks = readings.filter(entry => (entry.reading.findings ?? []).includes(reason)).map(entry => entry.blockId)
        return typed
            ? { ...copied(typed), blocks }
            : { failureClass: 'VERIFICATION_FAILURE', source: 'UNTYPED', rowId: null, component: null, partId: null, cause: null, because: VERIFICATION_BECAUSE.UNTYPED, reason, blocks }
    })
}
/** Round 4: what a verification failure that names no component is said as, in a headline (ours, DRAFT). */
const SOURCE_WORDS: Record<EnforcementFailureSource, string> = {
    COMPONENT: 'a component',
    PART_NOT_READ: 'a component not read in a block',
    READ_WITHOUT_CAUSE: 'a component read with no cause',
    BINDINGS_REFUSED: 'the requirement bindings were refused where the enforcement reads them',
    READER_FAILED: 'the reader failed',
    NO_BINDINGS: 'no requirement bindings were read',
    OUTSIDE_APPLICABLE_SET: "the scoring condition's row is outside the applicable set",
    NOT_CLASSIFIED: 'the scoring condition is not classified into components',
    UNCLASSIFIED_WORDS: 'words of his row that no part classifies',
    ENFORCEMENT_FAILED: 'the enforcement itself failed',
    UNTYPED: 'a finding without a class',
}
/** Round 4: a refusal on a verification failure is the safeguard he approved (his reply filed 5 November 2026, item 1). */
const VERIFICATION_APPROVED = `(a verification failure: the safeguard he approved, ${HIS_5_NOVEMBER_ITEM_1})`
const MISSING_SENTENCE = 'The activity was refused at the validation stage: a missing or altered component of an approved scoring condition is enforced.'
const VERIFICATION_SENTENCE = `The activity was refused at the validation stage: a component that cannot be verified is refused too ${VERIFICATION_APPROVED}.`
const BOTH_SENTENCE = `The activity was refused at the validation stage on both: a missing or altered component of an approved scoring condition is enforced, and a component that cannot be verified is refused too ${VERIFICATION_APPROVED}.`

export function requirementAccountOf(input: ActivityRequirementInputs): RequirementAccount {
    const { contextId, outcome, bindings } = input
    const accounted = input.blocks.filter(entry => entry.account?.status === 'ACCOUNTED').map(entry => entry.account!)
    const errored = input.blocks.map(entry => entry.account).filter((account): account is BlockRequirementAccount => account?.status === 'ERROR')
    // Round 3b (the coordinator's item 5): a report is a report; on a production contract its approved scoring condition's components are enforced.
    const enforced = !input.draftContract
    const status: RequirementAccount['status'] = input.refused || input.blocks.some(entry => entry.account?.status === 'BINDINGS_REFUSED') ? 'BINDINGS_REFUSED' : errored.length ? 'ERROR' : enforced ? 'REPORT_AND_ENFORCEMENT' : 'REPORT_ONLY'
    const reported = status === 'REPORT_AND_ENFORCEMENT' || status === 'REPORT_ONLY'
    const blocksWithoutAccount = input.blocks.filter(entry => !entry.account).map(entry => ({ blockId: entry.blockId, why: 'it stopped before the context scoring guard' }))
    /** A block named as a reader counts it (R3 NIT 10): its position among the build's blocks, never its role holders. */
    const blockNumber = (blockId: string) => `block ${input.blocks.findIndex(entry => entry.blockId === blockId) + 1} of ${input.blocks.length}`

    // Merged by (row, part): the worst account over blocks; the fields of the first block (in block order) holding it (N5). Copied, never aliased.
    const parts: MergedPart[] = []
    if (reported) {
        for (const block of accounted) {
            for (const part of block.parts) {
                const merged = parts.find(entry => entry.rowId === part.rowId && entry.partId === part.partId)
                if (!merged) {
                    parts.push({ ...copied(part), perBlock: [{ blockId: block.blockId, account: part.account }] })
                    continue
                }
                merged.perBlock.push({ blockId: block.blockId, account: part.account })
                if (worse(merged.account, part.account) !== merged.account) Object.assign(merged, { ...copied(part), perBlock: merged.perBlock })
            }
        }
        // R3 S2: a block that lacks a part another block has reads 4 for it, never the favourable value.
        for (const part of parts) {
            for (const block of accounted) {
                if (part.perBlock.some(entry => entry.blockId === block.blockId)) continue
                part.perBlock.push({ blockId: block.blockId, account: 4 })
                Object.assign(part, {
                    account: 4 as AccountKind,
                    accountWords: HIS_ACCOUNTS[4],
                    countsAsSatisfied: false,
                    satisfied: 'NO' as const,
                    satisfiedWords: SATISFIED_WORDS.NO,
                    cause: { kind: 'NO_BINDING' as const, detail: `${blockNumber(block.blockId)} holds no such part, so it is not accounted there` },
                })
            }
            part.perBlock.sort((a, b) => input.blocks.findIndex(entry => entry.blockId === a.blockId) - input.blocks.findIndex(entry => entry.blockId === b.blockId))
        }
    }
    const counts: RequirementSummary['counts'] = { '1': 0, '2': 0, '3': 0, '4': 0 }
    for (const part of parts) counts[String(part.account) as '1' | '2' | '3' | '4']++
    const represented = parts.filter(part => part.account === 1)
    const representedHow = { byAbsence: represented.filter(part => part.vacuous).length, byConstruction: represented.filter(part => part.byConstruction).length }

    // The approved scoring condition first.
    let scoringCondition: ScoringConditionSummary | null = null
    if (bindings && reported) {
        const scoringRow = applicableRows(contextId, bindings.applicability).accounted.find(candidate => candidate.sheet === 'properties' && candidate.role === PRIMARY_SCORING_CONDITION) ?? null
        const unaccountedBlocks = blocksWithoutAccount.map(entry => entry.blockId)
        if (!scoringRow) scoringCondition = { state: 'NOT_APPLICABLE', rowId: null, rowText: null, components: [], missing: [], notStructurallyRepresented: [], uncoveredWords: null, unaccountedBlocks }
        else {
            const rowParts = parts.filter(part => part.rowId === scoringRow.rowId)
            const structural = rowParts.filter(part => part.component && STRUCTURAL.includes(part.kind))
            const state: ScoringConditionSummary['state'] = rowParts.some(part => part.kind === 'NO_BINDING') ? 'NOT_CLASSIFIED' : structural.length ? 'ACCOUNTED' : 'NO_STRUCTURAL_COMPONENT'
            const names = [...new Set(structural.map(part => part.component!))]
            const components = names.map(component => {
                const own = structural.filter(part => part.component === component)
                const inPlay = rowParts.filter(part => part.component === component && part.kind === 'COACH_OBSERVED')
                const first = own.find(part => part.kind === 'SCORING_CONDITION_COMPONENT') ?? own[0]
                const account = own.map(part => part.account).reduce(worse)
                // Every accounted block, each read 4 where it holds none of the component's structural parts (R1 NIT 1, R3 S2).
                const perBlock = accounted.map(block => ({ blockId: block.blockId, account: own.map(part => part.perBlock.find(entry => entry.blockId === block.blockId)?.account ?? 4).reduce(worse) as AccountKind }))
                const worstPart = own.find(part => part.account === account)!
                // R2 S2: where the worst part is not the component's own part, it is named beside his words, as ours.
                const label = worstPart === first ? first.partLabel : `${first.partLabel}: ${worstPart.partLabel} (ours, DRAFT)`
                return {
                    component,
                    label,
                    rowSpans: own.map(part => part.rowSpan).filter((span): span is string => !!span),
                    account,
                    perBlock,
                    inPlay: inPlay.length ? inPlay.map(part => part.account).reduce(worse) : null,
                    byConstruction: own.some(part => part.byConstruction),
                    cause: worstPart.cause,
                }
            })
            const missing = components
                .filter(entry => entry.perBlock.some(block => block.account === 4) || entry.account === 4)
                .map(entry => ({ component: entry.component, label: entry.label, blocks: entry.perBlock.filter(block => block.account === 4).map(block => block.blockId), cause: entry.cause ?? { kind: 'NOT_CARRIED' as const, detail: 'not carried' } }))
            const otherNames = [...new Set(rowParts.filter(part => part.component && !names.includes(part.component)).map(part => part.component!))]
            scoringCondition = {
                state,
                rowId: scoringRow.rowId,
                rowText: scoringRow.text,
                components,
                missing,
                notStructurallyRepresented: otherNames.map(component => ({ component, label: rowParts.find(part => part.component === component)!.partLabel })),
                uncoveredWords: uncoveredWordsOf(scoringRow.text, enforcedSpans(rowParts)),
                unaccountedBlocks,
            }
        }
    }

    const served = outcome === 'served'
    const asBuilt = served ? 'the activity as built' : `the activity as built (refused at the ${outcome} stage)`
    const sc = scoringCondition
    const carried = !!sc && sc.state === 'ACCOUNTED' && sc.components.length > 0 && sc.missing.length === 0 && sc.unaccountedBlocks.length === 0 && sc.uncoveredWords === null && reported
    // Round 3, his item 7: what the build found and refused on. Round 3b: as the build read it, from the bindings the enforcement may read,
    // where it says so; otherwise read again here from each block's account. A TEST-ONLY draft contract enforces nothing.
    const readings = enforced
        ? input.blocks
              .map(entry => ({ blockId: entry.blockId, reading: entry.enforcement !== undefined ? entry.enforcement : entry.account ? scoringComponentReading(entry.account, bindings) : null }))
              .filter((entry): entry is { blockId: string; reading: ScoringEnforcementReading } => !!entry.reading)
        : []
    const findings = [...new Set(readings.flatMap(entry => entry.reading.findings))]
    // Round 4 (his reply filed 5 November 2026, item 1): each finding once, in his two classes; `findings` stays what the build refused on.
    const failures = failuresOf(findings, readings)
    const coachObservedOnly = readings.flatMap(entry => entry.reading.coachObservedOnly).filter((entry, at, all) => all.findIndex(other => other.rowId === entry.rowId && other.partId === entry.partId) === at)
    /** Round 3b (the round-3 reviews' R2 S5, R3 S2): a state the enforcement refused never ends "refuses nothing"; it says the activity was refused. */
    const refusedFailClosed = enforced && findings.length > 0
    const failClosed = ` Its components cannot be verified, so the activity was refused at the validation stage ${VERIFICATION_APPROVED}.`
    /** What ends a headline where nothing was refused: on a production contract, only the components are enforced; on a draft one, nothing. */
    const nothingRefused = enforced ? 'Only the components quoting his words are enforced, and nothing else refuses.' : 'This account refuses nothing.'
    const coachOnlyWords = coachObservedOnly.map(entry => `"${entry.words}"`).join('; ')
    /**
     * Round 4: the headline tells his two classes apart, and says both where both occur. Labels are the components' (in the order the summary
     * lists them), and a verification failure naming no component says what failed. The fix round (the R2 review's S2, the R1 review's S1):
     * "Missing or altered" names only the components a missing-or-altered finding names, so the headline agrees with the counts; a component
     * the report found missing through a structural part that is not enforced — whether or not its enforced part also failed verification —
     * is named apart, by that part, as reported and not enforced, so it is never passed over (decided part by part, never component by
     * component).
     */
    const shownFailures = failures.filter(failure => failure.failureClass === 'MISSING_OR_ALTERED')
    const unverifiedFailures = failures.filter(failure => failure.failureClass === 'VERIFICATION_FAILURE')
    const orderOf = (component: string) => {
        const at = sc ? sc.components.findIndex(entry => entry.component === component) : -1
        return at < 0 ? Number.MAX_SAFE_INTEGER : at
    }
    const labelOf = (component: string) => sc?.components.find(entry => entry.component === component)?.label ?? component
    const labelsOf = (list: AccountEnforcementFailure[]): string[] => [
        ...[...new Set(list.map(failure => failure.component).filter((component): component is string => !!component))].sort((a, b) => orderOf(a) - orderOf(b)).map(labelOf),
        ...new Set(list.filter(failure => !failure.component).map(failure => SOURCE_WORDS[failure.source] ?? SOURCE_WORDS.UNTYPED)),
    ]
    const missingLabels = labelsOf(shownFailures)
    const unverifiedLabels = labelsOf(unverifiedFailures)
    /**
     * A component the summary found missing and no missing-or-altered finding names: named by each structural part of it that is not enforced
     * and reads 4 (as the summary names a worst part beside his words, ours); with no such part and no finding at all, by the summary's label.
     */
    const reportedOnly = (sc?.missing ?? []).flatMap(entry => {
        if (shownFailures.some(failure => failure.component === entry.component)) return []
        const own = parts.filter(part => part.rowId === sc!.rowId && part.component === entry.component && STRUCTURAL.includes(part.kind))
        const first = own.find(part => part.kind === 'SCORING_CONDITION_COMPONENT') ?? own[0]
        const notEnforced = own.filter(part => !part.enforced && part.account === 4)
        if (notEnforced.length) return notEnforced.map(part => (part === first ? part.partLabel : `${first.partLabel}: ${part.partLabel} (ours, DRAFT)`))
        return failures.some(failure => failure.component === entry.component) ? [] : [entry.label]
    })
    const reportedSentence = reportedOnly.length ? ` Missing from the approved scoring condition, reported and not enforced: ${reportedOnly.join('; ')}.` : ''
    /** Where a missing or altered component was enforced: named, with what cannot be verified, and what is reported only, beside it where there is any. */
    const missingClassed = () =>
        `Missing or altered in the approved scoring condition: ${missingLabels.join('; ')}.${unverifiedFailures.length ? ` Not verifiable: ${unverifiedLabels.join('; ')}.` : ''}${reportedSentence} ${unverifiedFailures.length ? BOTH_SENTENCE : MISSING_SENTENCE}`
    /** The tail of a headline whose lead says what the account could not read: what the build refused on, in its class. */
    const refusedTail = () => (shownFailures.length ? ` ${missingClassed()}` : failClosed)
    let headline: string
    if (status === 'BINDINGS_REFUSED')
        headline = `The requirement account could not be computed: the bindings file was refused. ${
            !enforced
                ? 'The activity is unchanged.'
                : refusedFailClosed
                  ? shownFailures.length
                      ? missingClassed()
                      : `The components of the approved scoring condition cannot be verified where the enforcement reads them, so the activity was refused at the validation stage ${VERIFICATION_APPROVED}.`
                  : "No reason of the gate reaches what the enforcement reads, so the approved scoring condition's components were enforced from the file as read, and nothing was refused."
        }`
    else if (status === 'ERROR')
        headline = `The requirement account could not be computed: the reader failed. ${
            !enforced
                ? 'The activity is unchanged.'
                : refusedFailClosed
                  ? shownFailures.length
                      ? missingClassed()
                      : `Whether the components were carried could not be fully read, so the activity was refused at the validation stage ${VERIFICATION_APPROVED}.`
                  : "The approved scoring condition's components were read on their own and were carried, so nothing was refused."
        }`
    else if (sc && sc.missing.length)
        headline = refusedFailClosed
            ? shownFailures.length
                ? missingClassed()
                : `Not verifiable in the approved scoring condition: ${unverifiedLabels.join('; ')}.${reportedSentence} ${VERIFICATION_SENTENCE}`
            : `Missing from the approved scoring condition: ${sc.missing.map(entry => entry.label).join('; ')}. The activity was ${served ? 'served' : `refused at the ${outcome} stage`} without ${sc.missing.length === 1 ? 'it' : 'them'}. ${nothingRefused}`
    else if (!sc || sc.state === 'NOT_APPLICABLE') headline = `No approved scoring condition of this context is in the applicable set, so none is accounted.${refusedFailClosed ? refusedTail() : ` ${nothingRefused}`}`
    else if (sc.state === 'NOT_CLASSIFIED') headline = `The approved scoring condition has not been classified into components for this context, so whether its components are carried is not accounted.${refusedFailClosed ? refusedTail() : ` ${nothingRefused}`}`
    else if (sc.state === 'NO_STRUCTURAL_COMPONENT')
        headline = `No component of the approved scoring condition is structurally represented.${
            refusedFailClosed ? refusedTail() : `${coachObservedOnly.length ? ` Classified for coach observation only, judged in play and not enforced (his item 7): ${coachOnlyWords}.` : ''} ${nothingRefused}`
        }`
    else if (sc.unaccountedBlocks.length)
        headline = `${sc.unaccountedBlocks.map(blockNumber).join(', ').replace(/^b/, 'B')} ${sc.unaccountedBlocks.length === 1 ? 'was' : 'were'} not accounted: ${sc.unaccountedBlocks.length === 1 ? 'it' : 'they'} stopped before the context scoring guard.${refusedFailClosed ? refusedTail() : ` ${nothingRefused}`}`
    else if (sc.uncoveredWords !== null)
        // R1 S1: words of his approved scoring condition no component accounts for are named, never passed over (round 3: enforced; round 3b:
        // words a coach-observed part classifies are reported, not refused).
        headline = refusedFailClosed
            ? shownFailures.length
                ? `Words of the approved scoring condition no component accounts for: "${sc.uncoveredWords}". ${missingClassed()}`
                : `Words of the approved scoring condition no component accounts for: "${sc.uncoveredWords}". Words no part classifies cannot be verified, so the activity was refused at the validation stage ${VERIFICATION_APPROVED}.`
            : coachObservedOnly.length
              ? `Words of the approved scoring condition classified for coach observation only: ${coachOnlyWords}. They are judged in play, reported and not enforced (his item 7). ${nothingRefused}`
              : `Words of the approved scoring condition no component accounts for: "${sc.uncoveredWords}". Whether they are carried by ${asBuilt} is not accounted. ${nothingRefused}`
    else {
        const constructed = sc.components.filter(entry => entry.byConstruction)
        // Round 3, his item 3: the flag in his distinction — reaching the target is not, by itself, meaningful progression.
        const byConstruction = constructed.length
            ? ` ${constructed.map(entry => entry.label).join('; ')} ${constructed.length === 1 ? 'holds' : 'hold'} by construction: reaching the target does not by itself establish meaningful progression, and the target's placement and its relationship to the intended Game Problem are still to be verified (ours, DRAFT).`
            : ''
        // Round 3b (R2 N9): beside the Enforcement block, "nothing else refuses" reads plainer than "this account refuses nothing". Round 4: where
        // the build's own reading refused all the same (the enforcement itself failing, or a reading handed in apart from this report), it says
        // what it refused on, in its class, never "nothing else refuses".
        const ending = !refusedFailClosed ? nothingRefused : shownFailures.length ? missingClassed() : `Not verifiable: ${unverifiedLabels.join('; ')}. ${VERIFICATION_SENTENCE}`
        headline = `Every component of the approved scoring condition is carried by ${asBuilt}.${byConstruction} ${plural(counts['3'], 'requirement part depends', 'requirement parts depend')} on coach observation and ${plural(counts['4'], 'is', 'are')} unsupported or missing. ${ending}`
    }

    // Every other row of his workbook, listed: not accounted, accounted inside another part, or not applicable to this build, with where it is cited.
    const notAccounted: RequirementAccount['notAccounted'] = []
    const alsoNotAccounted: string[] = []
    if (bindings) {
        const contextBindings = bindings.contexts.find(entry => entry.contextId === contextId) ?? null
        const allParts = (contextBindings?.rows ?? []).flatMap(row => row.parts.map(part => ({ rowId: row.rowId, part })))
        const citedBy = (rowId: string) => allParts.filter(entry => entry.part.observable?.source === 'KNOWLEDGE_ROW' && (entry.part.observable.citedAs as KnowledgeRowCitation | null)?.rowId === rowId).map(entry => `${entry.rowId} ${entry.part.id}`)
        const inside = (rowId: string) => {
            const found = allParts.find(entry => (entry.part.accountsFor ?? []).includes(rowId))
            return found ? `${found.rowId} ${found.part.id}` : null
        }
        for (const row of applicableRows(contextId, bindings.applicability).notAccounted) {
            const within = inside(row.rowId)
            // R2 N1: a row accounted inside another part says so, in place of "not accounted" and the generic why.
            notAccounted.push({ rowId: row.rowId, rowRole: row.role, rowText: row.text, why: within ? `accounted inside ${within} (ours, DRAFT)` : row.why, standing: within ? 'ACCOUNTED_INSIDE' : 'NOT_ACCOUNTED', citedAsObservableBy: citedBy(row.rowId), accountedInside: within })
        }
        for (const row of accounted[0]?.notApplicable ?? []) notAccounted.push({ ...row, standing: 'NOT_APPLICABLE', citedAsObservableBy: citedBy(row.rowId), accountedInside: null })
        // R2 N12: his workbook's transitions from the context are on a fourth sheet, which no part reads; listed, never dropped.
        const transitions = rpcLibrary.transitionsFrom(contextId).filter(row => String(row.status ?? '') === 'ACTIVE')
        if (transitions.length)
            alsoNotAccounted.push(
                // Round 3b (the round-3 review's R2 S1): he has decided — transitions remain review evidence (his reply filed 4 November 2026, item 1).
                `His workbook's transitions from this context (${transitions.map(row => `${String(row.transition_id)} to ${String(row.to_rpc)}, ${String(row.transition_type)}`).join('; ')}) are on a sheet this account does not read; they remain review evidence (his reply filed 4 November 2026, item 1; DRAFT).`,
            )
    }
    if (accounted.some(block => block.roleScoring))
        alsoNotAccounted.push("A role's own way to score, or another occurrence counted as a score, approved for this activity's realization, is not a requirement of the context and is not accounted here; the context-scoring guard holds it to his ruling (DRAFT).")

    // R3 S1: each block's evidence once: its parts only where they differ from the merged ones; the rest counted.
    const blocks: AccountBlock[] = input.blocks
        .map(entry => entry.account)
        .filter((account): account is BlockRequirementAccount => !!account)
        .map(account => {
            const differing = account.parts.filter(part => {
                const merged = parts.find(entry => entry.rowId === part.rowId && entry.partId === part.partId)
                return !merged || partText(merged) !== partText(part)
            })
            return { ...account, reasons: [...account.reasons], parts: copied(differing), notApplicable: copied(account.notApplicable), partsIdenticalToMerged: account.parts.length - differing.length }
        })

    return {
        ...standingOf(),
        enforcement: enforcementOf(enforced, findings, failures, coachObservedOnly),
        status,
        reasons: reported ? [] : [...new Set([...(input.refused ?? []), ...input.blocks.flatMap(entry => (entry.account && entry.account.status !== 'ACCOUNTED' ? entry.account.reasons : []))])],
        contextId,
        contextName: rpcLibrary.context(contextId)?.name ?? null,
        outcome,
        bindings: { file: bindings?.file ?? null, version: bindings?.version ?? null, mode: bindings?.mode ?? null, standing: 'DRAFT' },
        contract: input.draftContract ? 'DRAFT' : 'PRODUCTION',
        summary: {
            headline,
            scoringConditionCarried: carried,
            scoringCondition,
            counts,
            representedHow,
            unsupported: parts.filter(part => part.account === 4).map(part => ({ rowId: part.rowId, partId: part.partId, label: part.partLabel, cause: part.cause ?? { kind: 'NOT_CARRIED' as const, detail: 'not carried' } })),
            coachObservedWithoutObservable: parts.filter(part => part.kind === 'COACH_OBSERVED' && !part.observableIdentified).map(part => ({ rowId: part.rowId, partId: part.partId, label: part.partLabel })),
            blocksDisagree: parts.filter(part => new Set(part.perBlock.map(entry => entry.account)).size > 1).map(part => ({ rowId: part.rowId, partId: part.partId, perBlock: part.perBlock.map(entry => ({ ...entry })) })),
        },
        parts,
        blocks,
        blocksWithoutAccount,
        notAccounted,
        alsoNotAccounted,
    }
}

/**
 * **The account when merging over blocks itself threw** (the R-engine review's S4): status ERROR with the message, no parts, and the same
 * standing tail, so an administrator's review is never lost to a defect here — the route would otherwise answer 500.
 */
export function failedRequirementAccount(contextId: string, outcome: string, message: string, draftContract: boolean): RequirementAccount {
    return {
        ...standingOf(),
        // The build's enforcement read each block itself; merging is what threw, so its findings are not repeated here.
        enforcement: enforcementOf(!draftContract, [], [], []),
        status: 'ERROR',
        reasons: [message],
        contextId,
        contextName: rpcLibrary.context(contextId)?.name ?? null,
        outcome,
        bindings: { file: null, version: null, mode: null, standing: 'DRAFT' },
        contract: draftContract ? 'DRAFT' : 'PRODUCTION',
        summary: {
            // Round 3b (R2 N8, R3 S2): never "unchanged" — whether the build refused on a component is in its own refusal's reasons.
            headline: `The requirement account could not be computed: merging its blocks failed. ${draftContract ? 'The activity is unchanged.' : "Whether the build refused on a component of the approved scoring condition is in the refusal's reasons, where it refused."}`,
            scoringConditionCarried: false,
            scoringCondition: null,
            counts: { '1': 0, '2': 0, '3': 0, '4': 0 },
            representedHow: { byAbsence: 0, byConstruction: 0 },
            unsupported: [],
            coachObservedWithoutObservable: [],
            blocksDisagree: [],
        },
        parts: [],
        blocks: [{ ...failedBlockRequirementAccount('ALL', contextId, message), partsIdenticalToMerged: 0 }],
        blocksWithoutAccount: [],
        notAccounted: [],
        alsoNotAccounted: [],
    }
}
