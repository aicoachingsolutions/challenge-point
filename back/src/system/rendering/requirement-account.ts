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
 * (bindings unreadable, or refused where the enforcement reads them; a reader that fails; a scoring condition not classified) the build
 * refuses too — fail-closed, our addition beyond his item 7 for his decision, as the 28 October decision made the pathway notice (PR #147).
 * Which parts are such components is our DRAFT reading (`SCORING_ENFORCEMENT`); every other part is reported, not enforced.
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
import { CheckResult } from '../derivation/gates'
import { knowledgeKey } from '../derivation/knowledge-key'
import { RegisterIndex } from '../derivation/register'
import { CONDITION_ROW, splitPath } from '../derivation/resolved-game'
import { beginConditionReferentOf, DRAFT_KNOWLEDGE, ElementClass, LoadedContract, relationalReferentOf, structuralRefOf } from '../derivation/types'
import { PRIMARY_SCORING_CONDITION, rpcLibrary } from '../sport-module/rpc-library'
import { ConditionReading, conditionReadingOf, EventKindReading } from './context-scoring-guard'
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

/**
 * **What the build enforces, and what it does not** (round 3; his reply filed 4 November 2026, item 7). Which parts are "clearly defined,
 * structurally necessary, and mechanically verifiable" components is our DRAFT reading: a structural part of the approved scoring
 * condition's row that quotes his words (`enforced`; the gate lets only a structural part naming a component quote them). A part of that row
 * quoting none of his words — our reading of another ruling — is reported, not enforced.
 */
export const SCORING_ENFORCEMENT = {
    scope: 'SCORING_CONDITION_COMPONENTS' as const,
    what:
        "A component of the approved scoring condition that quotes his words, missing or altered in the activity as built (its condition, a pinned value or scope, or its referent), refuses the activity at the validation stage, on every route. Fail-closed, and ours beyond his item 7 for his decision: where the components cannot be verified (a bindings file that cannot be read, or that the gate refuses where the enforcement reads it; a reader that fails; an approved scoring condition the bindings do not classify, or words of his row that no part classifies), the activity is refused too. Nothing else refuses.",
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
}
/** The check id a refusal's reasons carry (technical; DRAFT). */
export const SCORING_COMPONENTS_CHECK = 'CS-SCORING-COMPONENTS'

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
     * the components classified only for coach observation, reported and never refused (the round-3 review's R2 M1).
     */
    enforcement: typeof SCORING_ENFORCEMENT & { applied: boolean; findings: string[]; coachObservedOnly: CoachObservedOnly[] }
}

/** A component of the approved scoring condition classified only for coach observation: judged in play, reported, never refused (round 3b). */
export interface CoachObservedOnly {
    rowId: string
    component: string
    partId: string
    /** The words of his row this part alone classifies — its observable covers them and no enforced span does (round 3c: word by word). */
    words: string
}

/** R2 S1 and N4: the applicable set is ours, and his words are "supported" (the categories) and "maintain" (the standards). Round 3: what is enforced. */
export const REQUIREMENT_ACCOUNT_ABOUT =
    "How each requirement of this activity's context in the applicable set (our DRAFT) is accounted for, part by part, in the four categories Christian supported and the three standards he asked to keep distinct; the context's other approved rows are listed under Not accounted. Every classification is ours and DRAFT, for his review. This is a report; one part of it is enforced: since his reply filed 4 November 2026, the build refuses an activity whose approved scoring condition has a component quoting his words missing or altered (Enforcement)."

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
    const otherKindWords = (contract: LoadedContract): string =>
        constraintIds.has(knowledgeKey(contract.contractId)) ? 'a constraint' : contract.contractId.startsWith(SPORT_PROFILE_PREFIX) ? 'the Sport Profile' : 'neither the context, the realization nor the game form'

    const matches = (item: LoadedContract['items'][number], pattern: Pick<ItemPattern, 'row' | 'requirement' | 'strictness' | 'terms'>, strictnessDefault = DEFAULT_STRICTNESS): boolean =>
        String(item.row) === pattern.row &&
        (!pattern.requirement || pattern.requirement.includes(String(item.requirement))) &&
        (pattern.strictness ?? strictnessDefault).includes(String(item.strictness)) &&
        selectorHolds(item.selector, String(item.row), pattern.terms, index)

    /** One facet over every contract of the block. */
    const facetOf = (part: BindingPart, facet: ItemPattern): FacetAccount => {
        const carriers: CarrierEvidence[] = []
        const declarations: DeclarationEvidence[] = []
        const considered: ConsideredItem[] = []
        let notGoverning = false
        /** Round 3: an item matched but held another value or scope than the pin (his approved knowledge): the part is altered, not absent. */
        let altered = false
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
            return { facetId: facet.id, label: facet.label, account, carriers, declarations, considered, cause: account === 4 ? 'VALUE_MISSING' : null }
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
                if (facet.value !== undefined && !samePinnedValue(facet.value, item.value)) {
                    why.push(`its value is ${shown(item.value)}; this facet asks ${shown(facet.value)}`)
                    if (wouldCount) altered = true
                }
                if (facet.scope && !facet.scope.includes(String(item.scope))) {
                    why.push(`its scope is ${String(item.scope)}; this facet asks ${facet.scope.join(' or ')}`)
                    if (wouldCount) altered = true
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
                        else why.push(`its element ${own} is not in the realized game`)
                    } else {
                        // S2: a reached line counts only where it is entailed, on a class holding every term of the pattern, whose element is in the game.
                        const alive = [...new Set(outcome.reach ?? [])].filter(line => {
                            const classId = String(line).split('::')[0]
                            const terms = (classes.get(classId)?.constraints?.terms ?? []) as { attribute: string; op: string; value?: string; values?: string[] }[]
                            const holds = (facet.terms ?? []).every(term => terms.some(entry => termHeld(entry, term)))
                            return String(input.classified?.get(line)?.verdict ?? '') === 'RESOLVED:ENTAILED' && holds && inGame(classId)
                        })
                        if (!alive.length) why.push("no line it reaches is entailed, on an element of the realized game holding the pattern's terms")
                        else {
                            survives = { how: 'REACHED_LINE', elementIds: [...new Set(alive.map(line => String(line).split('::')[0]))], vacuous: false, rereadInGame: true }
                            if (rowSpec?.kind === 'FIELD') {
                                // M1: the value the finished game holds at each surviving line, read at the register's path.
                                const leaf = splitPath(String(rowSpec.path)).leaf
                                const realized = alive.flatMap(line => {
                                    const [classId, row] = String(line).split('::')
                                    const elements = elementsOf(input.game, classId, row ?? String(item.row), index, input.standsFor)
                                    return elements.length ? elements.map(element => readPath(element, leaf)) : [undefined]
                                })
                                value = { authored: copied(item.value), realized: copied(realized) }
                                if (requirement !== 'EQUALS') why.push(`its requirement is ${requirement}: the value the finished game holds cannot be compared with it, so it is not counted (DRAFT)`)
                                else {
                                    const lost = realized.filter(held => !sameValue(item.value, held))
                                    if (lost.length) why.push(`authored ${shown(item.value)}; the finished game holds ${lost.map(shown).join(', ')}`)
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
                    }
                }
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
        return { facetId: facet.id, label: facet.label, account, carriers, declarations, considered, cause: account === 4 ? (notGoverning ? 'NOT_GOVERNING' : altered ? 'ALTERED' : 'NOT_CARRIED') : null }
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
            enforced: STRUCTURAL.includes(fields.kind) && !!fields.rowSpan && fields.rowSheet === 'properties' && fields.rowRole === PRIMARY_SCORING_CONDITION,
            standardWords: HIS_STANDARDS[fields.standard],
        }
    }
    const describe = (facets: FacetAccount[]): string =>
        facets
            .filter(facet => facet.account === 4)
            .map(facet => `${facet.label}: ${facet.considered.length ? `considered ${facet.considered.map(entry => `${entry.contractId}::${entry.itemId} (${entry.why.join('; ')})`).join(', ')}` : facet.cause === 'VALUE_MISSING' ? 'no declaration says it needs no further value, and no value is carried' : 'no item of any contract matches'}`)
            .join(' | ')

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
        const facets = (part.facets ?? []).map(facet => facetOf(part, facet))
        const worst = !facets.length || facets.some(facet => facet.account === 4) ? 4 : (Math.max(...facets.map(facet => facet.account)) as 1 | 2)
        const causeKind: ComputedCause | null =
            worst !== 4
                ? null
                : facets.some(facet => facet.cause === 'NOT_GOVERNING')
                  ? 'NOT_GOVERNING'
                  : facets.some(facet => facet.cause === 'ALTERED')
                    ? 'ALTERED'
                    : facets.some(facet => facet.cause === 'VALUE_MISSING') && facets.every(facet => facet.account !== 4 || facet.cause === 'VALUE_MISSING')
                      ? 'VALUE_MISSING'
                      : 'NOT_CARRIED'
        const carriers = facets.flatMap(facet => facet.carriers)
        return finish({
            ...common,
            facets,
            account: worst,
            cause: causeKind ? { kind: causeKind, detail: describe(facets) } : null,
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

/** What the enforcement found on one block (round 3b): the refusal's reasons, and the components classified only for coach observation. */
export interface ScoringEnforcementReading {
    findings: string[]
    coachObservedOnly: CoachObservedOnly[]
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
 * **Fail-closed, ours beyond his item 7, for his decision**: bindings refused or unreadable where the enforcement reads them (the caller's
 * `enforcementBindingsFor`), a reader that failed, a scoring condition outside the applicable set or not classified at all, and words no
 * part classifies, each refuse — an activity whose components cannot be verified is not served, as the 28 October decision made the pathway
 * notice fail-closed (PR #147). A context whose workbook has no ACTIVE approved scoring condition gives nothing to enforce. Which parts the
 * row binds is read from the bindings, so the full reading and the enforced one say the same. Pure: the caller decides whether to enforce (a
 * production-contracted context's build, on every route).
 */
export function scoringComponentReading(account: BlockRequirementAccount, bindings: RequirementBindings | null): ScoringEnforcementReading {
    const { contextId } = account
    const cannot = (why: string) => `${SCORING_COMPONENTS_CHECK}: the components of ${contextId}'s approved scoring condition cannot be verified, so the activity is not served (fail-closed): ${why}`
    if (account.status === 'BINDINGS_REFUSED') return { findings: [cannot(`the requirement bindings were refused: ${account.reasons.join(' | ')}`)], coachObservedOnly: [] }
    if (account.status === 'ERROR') return { findings: [cannot(`the reader failed: ${account.reasons.join(' | ')}`)], coachObservedOnly: [] }
    if (!bindings) return { findings: [cannot('no requirement bindings were read')], coachObservedOnly: [] }
    const findings: string[] = []
    const coachObservedOnly: CoachObservedOnly[] = []
    const accounted = applicableRows(contextId, bindings.applicability).accounted
    const contextBindings = bindings.contexts.find(entry => entry.contextId === contextId) ?? null
    for (const row of contextRowsOf(contextId).filter(candidate => candidate.sheet === 'properties' && candidate.role === PRIMARY_SCORING_CONDITION)) {
        if (!accounted.some(candidate => candidate.rowId === row.rowId)) {
            findings.push(cannot(`its row ${row.rowId} is outside the applicable set of ${bindings.file}`))
            continue
        }
        const binding = contextBindings?.rows.find(entry => entry.rowId === row.rowId) ?? null
        if (!binding || !binding.parts.length) {
            findings.push(cannot(`${row.rowId} is not classified into components in ${bindings.file}`))
            continue
        }
        // The enforced components: the parts of the row quoting his words, each read from this block's own account.
        const enforcedParts = binding.parts.filter(part => part.rowSpan !== undefined && STRUCTURAL.includes(part.kind))
        for (const part of enforcedParts) {
            const read = account.parts.find(entry => entry.rowId === row.rowId && entry.partId === part.id)
            // Read by the account itself (1 or 2 carries it), never by a field derived from it.
            if (read && (read.account === 1 || read.account === 2)) continue
            const kind: ComputedCause = read ? (read.cause?.kind ?? 'NOT_CARRIED') : 'NO_BINDING'
            const detail = read ? (read.cause?.detail ?? 'not carried') : `the ${part.id} part is bound but was not read in this block`
            findings.push(`${SCORING_COMPONENTS_CHECK}: the ${part.component} component of ${contextId}'s approved scoring condition (${row.rowId}), "${part.rowSpan}", ${FAILURE_WORDS[kind] ?? `is not carried (${kind})`}: ${detail}`)
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
        if (unclassified !== null) findings.push(cannot(`words of ${row.rowId} that no part classifies: "${unclassified}"`))
    }
    return { findings, coachObservedOnly }
}
/**
 * **The fail-closed reading where the enforcement itself failed** (round 3b, the round-3 review's R1 S3): built from the message alone, with
 * no other reading, so the build's last resort cannot throw out of the route.
 */
export function failClosedReading(contextId: string, message: string): ScoringEnforcementReading {
    return { findings: [`${SCORING_COMPONENTS_CHECK}: the components of ${contextId}'s approved scoring condition cannot be verified, so the activity is not served (fail-closed): the enforcement failed: ${message}`], coachObservedOnly: [] }
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
/** Round 3: the build enforces where the context's contract is a production one (a TEST-ONLY draft contract is reported only). */
const enforcementOf = (applied: boolean, findings: string[], coachObservedOnly: CoachObservedOnly[]): RequirementAccount['enforcement'] => ({ ...copied(SCORING_ENFORCEMENT), applied, findings, coachObservedOnly: copied(coachObservedOnly) })

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
    const readings = enforced ? input.blocks.map(entry => (entry.enforcement !== undefined ? entry.enforcement : entry.account ? scoringComponentReading(entry.account, bindings) : null)).filter((reading): reading is ScoringEnforcementReading => !!reading) : []
    const findings = [...new Set(readings.flatMap(reading => reading.findings))]
    const coachObservedOnly = readings.flatMap(reading => reading.coachObservedOnly).filter((entry, at, all) => all.findIndex(other => other.rowId === entry.rowId && other.partId === entry.partId) === at)
    /** Round 3b (the round-3 reviews' R2 S5, R3 S2): a state the enforcement refused never ends "refuses nothing"; it says the activity was refused. */
    const refusedFailClosed = enforced && findings.length > 0
    const failClosed = ' Its components cannot be verified, so the activity was refused at the validation stage (fail-closed: ours beyond his item 7, for his decision).'
    /** What ends a headline where nothing was refused: on a production contract, only the components are enforced; on a draft one, nothing. */
    const nothingRefused = enforced ? 'Only the components quoting his words are enforced, and nothing else refuses.' : 'This account refuses nothing.'
    const coachOnlyWords = coachObservedOnly.map(entry => `"${entry.words}"`).join('; ')
    let headline: string
    if (status === 'BINDINGS_REFUSED')
        headline = `The requirement account could not be computed: the bindings file was refused. ${
            !enforced
                ? 'The activity is unchanged.'
                : refusedFailClosed
                  ? 'The components of the approved scoring condition cannot be verified where the enforcement reads them, so the activity was refused at the validation stage (fail-closed: ours beyond his item 7, for his decision).'
                  : "No reason of the gate reaches what the enforcement reads, so the approved scoring condition's components were enforced from the file as read, and nothing was refused."
        }`
    else if (status === 'ERROR')
        headline = `The requirement account could not be computed: the reader failed. ${
            !enforced ? 'The activity is unchanged.' : refusedFailClosed ? 'Whether the components were carried could not be fully read, so the activity was refused at the validation stage (fail-closed: ours beyond his item 7, for his decision).' : 'The approved scoring condition\'s components were read on their own and were carried, so nothing was refused.'
        }`
    else if (sc && sc.missing.length)
        headline = refusedFailClosed
            ? `Missing or altered in the approved scoring condition: ${sc.missing.map(entry => entry.label).join('; ')}. The activity was refused at the validation stage: a missing or altered component of an approved scoring condition is enforced.`
            : `Missing from the approved scoring condition: ${sc.missing.map(entry => entry.label).join('; ')}. The activity was ${served ? 'served' : `refused at the ${outcome} stage`} without ${sc.missing.length === 1 ? 'it' : 'them'}. ${nothingRefused}`
    else if (!sc || sc.state === 'NOT_APPLICABLE') headline = `No approved scoring condition of this context is in the applicable set, so none is accounted.${refusedFailClosed ? failClosed : ` ${nothingRefused}`}`
    else if (sc.state === 'NOT_CLASSIFIED') headline = `The approved scoring condition has not been classified into components for this context, so whether its components are carried is not accounted.${refusedFailClosed ? failClosed : ` ${nothingRefused}`}`
    else if (sc.state === 'NO_STRUCTURAL_COMPONENT')
        headline = `No component of the approved scoring condition is structurally represented.${
            refusedFailClosed ? failClosed : `${coachObservedOnly.length ? ` Classified for coach observation only, judged in play and not enforced (his item 7): ${coachOnlyWords}.` : ''} ${nothingRefused}`
        }`
    else if (sc.unaccountedBlocks.length)
        headline = `${sc.unaccountedBlocks.map(blockNumber).join(', ').replace(/^b/, 'B')} ${sc.unaccountedBlocks.length === 1 ? 'was' : 'were'} not accounted: ${sc.unaccountedBlocks.length === 1 ? 'it' : 'they'} stopped before the context scoring guard.${refusedFailClosed ? failClosed : ` ${nothingRefused}`}`
    else if (sc.uncoveredWords !== null)
        // R1 S1: words of his approved scoring condition no component accounts for are named, never passed over (round 3: enforced; round 3b:
        // words a coach-observed part classifies are reported, not refused).
        headline = refusedFailClosed
            ? `Words of the approved scoring condition no component accounts for: "${sc.uncoveredWords}". Words no part classifies cannot be verified, so the activity was refused at the validation stage (fail-closed: ours beyond his item 7, for his decision).`
            : coachObservedOnly.length
              ? `Words of the approved scoring condition classified for coach observation only: ${coachOnlyWords}. They are judged in play, reported and not enforced (his item 7). ${nothingRefused}`
              : `Words of the approved scoring condition no component accounts for: "${sc.uncoveredWords}". Whether they are carried by ${asBuilt} is not accounted. ${nothingRefused}`
    else {
        const constructed = sc.components.filter(entry => entry.byConstruction)
        // Round 3, his item 3: the flag in his distinction — reaching the target is not, by itself, meaningful progression.
        const byConstruction = constructed.length
            ? ` ${constructed.map(entry => entry.label).join('; ')} ${constructed.length === 1 ? 'holds' : 'hold'} by construction: reaching the target does not by itself establish meaningful progression, and the target's placement and its relationship to the intended Game Problem are still to be verified (ours, DRAFT).`
            : ''
        // Round 3b (R2 N9): beside the Enforcement block, "nothing else refuses" reads plainer than "this account refuses nothing".
        headline = `Every component of the approved scoring condition is carried by ${asBuilt}.${byConstruction} ${plural(counts['3'], 'requirement part depends', 'requirement parts depend')} on coach observation and ${plural(counts['4'], 'is', 'are')} unsupported or missing. ${nothingRefused}`
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
        enforcement: enforcementOf(enforced, findings, coachObservedOnly),
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
        enforcement: enforcementOf(!draftContract, [], []),
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
