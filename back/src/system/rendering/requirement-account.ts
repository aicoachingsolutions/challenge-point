/**
 * **The requirement account: each requirement of the activity's context in the applicable set, part by part, in his four categories and
 * three standards — report only** — 29 October 2026 (R-4 of the specification, with the reviews' corrections, rounds 1 and 2).
 *
 * Christian, his reply filed 3 November 2026, section 2: *"Each generated activity should be evaluated against the applicable, approved
 * context requirements, accounting for each component of a scoring condition rather than simply confirming that the condition exists."*
 * *"A requirement should not automatically count as satisfied merely because the coach could theoretically judge it."* *"Missing components
 * of approved scoring conditions should not silently pass."* And *"let's verify the classifications before enabling refusals broadly"*. So
 * this reads; it refuses nothing, scores nothing, is no selection input, and reaches no coach: the build attaches it only to an
 * administrator's review build (`build-activity.ts` `requirementAccount`), and a CI test holds every production-contracted context's builds
 * to it (`requirement-scoring-gate.unit.ts`), so in this increment a missing component is shown to an administrator and fails CI, and the
 * coach's build is neither refused nor annotated until he has verified the classifications.
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
    ELIGIBLE_BASES,
    ItemPattern,
    KnowledgeRowCitation,
    ObservableSource,
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

export type ComputedCause =
    | 'MISSING_KNOWLEDGE'
    | 'MISSING_IMPLEMENTATION'
    | 'NOT_CARRIED'
    | 'NOT_GOVERNING'
    | 'NO_BINDING'
    | 'VALUE_MISSING'
    | 'NOT_THE_SAME_REFERENT'
    | 'OBSERVABLE_NOT_IDENTIFIED'

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
    standard: RequirementStandard
    standardWords: string
    facets: FacetAccount[]
    guard: (EventKindReading & { relationshipIds: string[] }) | null
    observable: { text: string; source: ObservableSource; citedAs: KnowledgeRowCitation | null; expect: 'PRESENT' | 'ABSENT'; standing: 'DRAFT' } | null
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
    status: 'REPORT_ONLY' | 'BINDINGS_REFUSED' | 'ERROR'
    /** What this is, and that it refuses nothing. */
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
    refusal: 'NONE_REPORT_ONLY'
}

/** R2 S1 and N4: the applicable set is ours, and his words are "supported" (the categories) and "maintain" (the standards). */
export const REQUIREMENT_ACCOUNT_ABOUT =
    "How each requirement of this activity's context in the applicable set (our DRAFT) is accounted for, part by part, in the four categories Christian supported and the three standards he asked to keep distinct; the context's other approved rows are listed under Not accounted. Every classification is ours and DRAFT, for his review. Report only: nothing here refuses an activity."

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
                // Round 2, R1 S2: what the pattern pins of his approved knowledge.
                if (facet.value !== undefined && !samePinnedValue(facet.value, item.value)) why.push(`its value is ${shown(item.value)}; this facet asks ${shown(facet.value)}`)
                if (facet.scope && !facet.scope.includes(String(item.scope))) why.push(`its scope is ${String(item.scope)}; this facet asks ${facet.scope.join(' or ')}`)
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
        return { facetId: facet.id, label: facet.label, account, carriers, declarations, considered, cause: account === 4 ? (notGoverning ? 'NOT_GOVERNING' : 'NOT_CARRIED') : null }
    }

    const classification = (note: string | null) => ({ standing: 'DRAFT' as const, by: 'OURS' as const, bindingsVersion: bindings.version, note })
    const base = (row: ContextRow) => ({ rowId: row.rowId, rowSheet: row.sheet, rowRole: row.role, rowText: row.text, expectedEvidence: row.expectedEvidence })
    const finish = (fields: Omit<RequirementPartAccount, 'accountWords' | 'countsAsSatisfied' | 'standardWords'>): RequirementPartAccount => ({
        ...fields,
        accountWords: HIS_ACCOUNTS[fields.account],
        countsAsSatisfied: fields.account === 1 || fields.account === 2,
        standardWords: HIS_STANDARDS[fields.standard],
    })
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
        const causeKind: ComputedCause | null = worst !== 4 ? null : facets.some(facet => facet.cause === 'NOT_GOVERNING') ? 'NOT_GOVERNING' : facets.some(facet => facet.cause === 'VALUE_MISSING') && facets.every(facet => facet.account !== 4 || facet.cause === 'VALUE_MISSING') ? 'VALUE_MISSING' : 'NOT_CARRIED'
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
    for (const row of applicableRows(contextId, bindings.applicability).accounted) {
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
        const rowParts = binding.parts.map(part => partOf(row, part))
        // M1: control and exclusion are evaluated against the progression outcome, read from the referents the finished game holds.
        for (const [at, part] of binding.parts.entries()) {
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

/** Tokens of his row's text no span covers (S1): spans removed, whitespace collapsed, words kept. */
function uncoveredWordsOf(text: string, spans: string[]): string | null {
    if (!spans.length) return null
    let rest = text.replace(/\s+/g, ' ')
    for (const span of spans) rest = rest.split(span.replace(/\s+/g, ' ')).join(' ')
    const words = rest.match(/[A-Za-z][A-Za-z'-]*/g) ?? []
    return words.length ? words.join(' ') : null
}

export interface ActivityRequirementInputs {
    contextId: string
    /** 'served', or the stage it was refused at. */
    outcome: string
    bindings: RequirementBindings | null
    refused: string[] | null
    blocks: { blockId: string; account: BlockRequirementAccount | null }[]
    draftContract: boolean
}

/** The standing tail every account carries, whatever its status (R3 NIT 5: one helper). */
const standingOf = () => ({
    about: REQUIREMENT_ACCOUNT_ABOUT,
    accounts: ORDER.map(id => ({ id, words: HIS_ACCOUNTS[id] })),
    standards: (Object.keys(HIS_STANDARDS) as RequirementStandard[]).map(id => ({ id, words: HIS_STANDARDS[id] })),
    coachObservationRule: COACH_OBSERVATION_RULE,
    citedAs: HIS_WORDS_CITED_AS,
    refusal: 'NONE_REPORT_ONLY' as const,
})

export function requirementAccountOf(input: ActivityRequirementInputs): RequirementAccount {
    const { contextId, outcome, bindings } = input
    const accounted = input.blocks.filter(entry => entry.account?.status === 'ACCOUNTED').map(entry => entry.account!)
    const errored = input.blocks.map(entry => entry.account).filter((account): account is BlockRequirementAccount => account?.status === 'ERROR')
    const status: RequirementAccount['status'] = input.refused || input.blocks.some(entry => entry.account?.status === 'BINDINGS_REFUSED') ? 'BINDINGS_REFUSED' : errored.length ? 'ERROR' : 'REPORT_ONLY'
    const blocksWithoutAccount = input.blocks.filter(entry => !entry.account).map(entry => ({ blockId: entry.blockId, why: 'it stopped before the context scoring guard' }))
    /** A block named as a reader counts it (R3 NIT 10): its position among the build's blocks, never its role holders. */
    const blockNumber = (blockId: string) => `block ${input.blocks.findIndex(entry => entry.blockId === blockId) + 1} of ${input.blocks.length}`

    // Merged by (row, part): the worst account over blocks; the fields of the first block (in block order) holding it (N5). Copied, never aliased.
    const parts: MergedPart[] = []
    if (status === 'REPORT_ONLY') {
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
                Object.assign(part, { account: 4 as AccountKind, accountWords: HIS_ACCOUNTS[4], countsAsSatisfied: false, cause: { kind: 'NO_BINDING' as const, detail: `${blockNumber(block.blockId)} holds no such part, so it is not accounted there` } })
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
    if (bindings && status === 'REPORT_ONLY') {
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
                uncoveredWords: uncoveredWordsOf(scoringRow.text, rowParts.map(part => part.rowSpan).filter((span): span is string => !!span)),
                unaccountedBlocks,
            }
        }
    }

    const served = outcome === 'served'
    const asBuilt = served ? 'the activity as built' : `the activity as built (refused at the ${outcome} stage)`
    const sc = scoringCondition
    const carried = !!sc && sc.state === 'ACCOUNTED' && sc.components.length > 0 && sc.missing.length === 0 && sc.unaccountedBlocks.length === 0 && sc.uncoveredWords === null && status === 'REPORT_ONLY'
    let headline: string
    if (status === 'BINDINGS_REFUSED') headline = 'The requirement account could not be computed: the bindings file was refused. The activity is unchanged.'
    else if (status === 'ERROR') headline = 'The requirement account could not be computed: the reader failed. The activity is unchanged.'
    else if (sc && sc.missing.length)
        headline = `Missing from the approved scoring condition: ${sc.missing.map(entry => entry.label).join('; ')}. The activity was ${served ? 'served' : `refused at the ${outcome} stage`} without ${sc.missing.length === 1 ? 'it' : 'them'}. This account refuses nothing.`
    else if (!sc || sc.state === 'NOT_APPLICABLE') headline = 'No approved scoring condition of this context is in the applicable set, so none is accounted. This account refuses nothing.'
    else if (sc.state === 'NOT_CLASSIFIED') headline = 'The approved scoring condition has not been classified into components for this context, so whether its components are carried is not accounted. This account refuses nothing.'
    else if (sc.state === 'NO_STRUCTURAL_COMPONENT') headline = 'No component of the approved scoring condition is structurally represented. This account refuses nothing.'
    else if (sc.unaccountedBlocks.length)
        headline = `${sc.unaccountedBlocks.map(blockNumber).join(', ').replace(/^b/, 'B')} ${sc.unaccountedBlocks.length === 1 ? 'was' : 'were'} not accounted: ${sc.unaccountedBlocks.length === 1 ? 'it' : 'they'} stopped before the context scoring guard. This account refuses nothing.`
    else if (sc.uncoveredWords !== null)
        // R1 S1: words of his approved scoring condition no component accounts for are named, never passed over.
        headline = `Words of the approved scoring condition no component accounts for: "${sc.uncoveredWords}". Whether they are carried by ${asBuilt} is not accounted. This account refuses nothing.`
    else {
        const constructed = sc.components.filter(entry => entry.byConstruction)
        const byConstruction = constructed.length
            ? ` ${constructed.map(entry => entry.label).join('; ')} ${constructed.length === 1 ? 'holds' : 'hold'} by construction: ${constructed.length === 1 ? 'its referent is' : 'their referents are'} the target the scoring event reaches, so ${constructed.length === 1 ? 'it rests' : 'they rest'} on where that target is placed.`
            : ''
        headline = `Every component of the approved scoring condition is carried by ${asBuilt}.${byConstruction} ${plural(counts['3'], 'requirement part depends', 'requirement parts depend')} on coach observation and ${plural(counts['4'], 'is', 'are')} unsupported or missing; this account refuses nothing.`
    }

    // Every other row of his workbook, listed: not accounted, accounted inside another part, or not applicable to this build, with where it is cited.
    const notAccounted: RequirementAccount['notAccounted'] = []
    const alsoNotAccounted: string[] = []
    if (bindings) {
        const contextBindings = bindings.contexts.find(entry => entry.contextId === contextId) ?? null
        const allParts = (contextBindings?.rows ?? []).flatMap(row => row.parts.map(part => ({ rowId: row.rowId, part })))
        const citedBy = (rowId: string) => allParts.filter(entry => entry.part.observable?.source === 'KNOWLEDGE_ROW' && entry.part.observable.citedAs?.rowId === rowId).map(entry => `${entry.rowId} ${entry.part.id}`)
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
                `His workbook's transitions from this context (${transitions.map(row => `${String(row.transition_id)} to ${String(row.to_rpc)}, ${String(row.transition_type)}`).join('; ')}) are on a sheet this account does not read; whether they belong to the applicable set is his decision (DRAFT).`,
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
        status,
        reasons: status === 'REPORT_ONLY' ? [] : [...new Set([...(input.refused ?? []), ...input.blocks.flatMap(entry => (entry.account && entry.account.status !== 'ACCOUNTED' ? entry.account.reasons : []))])],
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
        status: 'ERROR',
        reasons: [message],
        contextId,
        contextName: rpcLibrary.context(contextId)?.name ?? null,
        outcome,
        bindings: { file: null, version: null, mode: null, standing: 'DRAFT' },
        contract: draftContract ? 'DRAFT' : 'PRODUCTION',
        summary: {
            headline: 'The requirement account could not be computed: the reader failed. The activity is unchanged.',
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
