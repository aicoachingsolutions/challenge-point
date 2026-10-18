/**
 * **The review evidence an administrator reads beside a goal's activity — what the generated game holds, item by item, and where
 * each part of it comes from.** Stage K8, 15 October 2026 (design step J9).
 *
 * Christian, reply filed 17 October 2026: *"For the next review, I'd like to see one complete Play Out from the Back activity
 * generated through the normal pathway"*, with nine items, the structural consistency (*"including player totals, spatial
 * relationships, scoring conditions, and restarts"*), and *"Provenance distinguishing approved knowledge, provisional realization
 * choices, and any remaining gaps."* And: *"The objective is not to demonstrate that the engine can satisfy a collection of rules. It
 * is to demonstrate that those rules produce a representative learning environment."* His reply filed 18 October 2026, item 7, asks
 * that every capability keep three layers apart — general engine mechanisms, sport-specific knowledge and authorized relationships,
 * activity-specific realization choices — and item 8 names the points he will evaluate as a coach.
 *
 * **What this is, and what it is not.** It reads the games the builder already built (each block's fixture, the contracts it was
 * derived from, the Gate A rerun on its concrete game, the cross-block checks), the rendering it made, and the goal's authorization
 * record — and states FACTS about them. It decides nothing: no verdict here is new (every verdict is a gate's or a cross-block
 * check's, each of which refuses the build where it fails), and no fact here moves a build. It claims nothing about play: whether the
 * opportunities he asks about arise is his judgement, and the evidence says so in his words. It restates no knowledge: every quotation
 * is read from the record, every value from the game.
 *
 * **Layers and standings.** Each element of the game and each sentence is tagged by the layers its sources lie in (his three, read
 * from the record, plus the session, which is none of them: the coach's numbers) and by a standing — APPROVED (an item he authored or
 * ruled, or an engine rule he adopted), PROVISIONAL (his provisional realization choice), GAP (a field awaiting approved wording, or a
 * case he asked to see flagged), OUR_READING (an item whose basis is ours, a bound assumed, a choice not labelled his), SESSION.
 *
 * Sport-neutral: role names, nouns, rows and the items he asked for are data; no goal, sport term or knowledge id is written here.
 */
import { RegisterIndex } from '../derivation/register'
import { awardeeRelation, roleHolderNames, roleOfHolder } from '../derivation/designation'
import { CREDIT_BEGINS_CLAUSE, CREDIT_ENDS_CLAUSE } from '../derivation/gates'
import { LoadedContract } from '../derivation/types'
import { contractCoverage } from '../derivation/run-bounded-selection'
import { loadCorpusContracts } from '../derivation/corpus'
import { parseSelector } from '../derivation/selector'
import { rpcLibrary } from '../sport-module/rpc-library'
import type { AuthorizationLists, CitedWords, ContextManipulationRelationship, LearningGoalAuthorization, ReviewLayer, ReviewRequest } from '../test-library/learning-goal-authorizations'
import { learningGoalSelectionHolds } from '../test-library/learning-design-holds'
import { testLibraryRegistry } from '../test-library/library/registry'
import { FidelityFinding, OBLIGATIONS } from './fidelity'
import { approvedTemplateSentences } from './approved-wording'
import { approvedSentences, Instruction, RenderedActivity, UNBOUNDED_CREDIT, wordedFieldRows } from './render-concrete-game'
import type { RoleBlockCheck } from './role-blocks'
import type { ActivitySession } from './session-envelope'

/** One block's game as the builder left it (a game not played in blocks is one block with no holders). */
export interface EvidenceBlock {
    blockId: string
    /** Role → the end-assigned team designation holding it in this block. Empty for a game with no roles. */
    holders: Record<string, string>
    fixture: any
    contracts: LoadedContract[]
    rendered: RenderedActivity
    /** Every fidelity finding on this block's rendering (VIOLATION and NOTE). */
    findings: FidelityFinding[]
    /** Gate A as rerun on this block's concrete game: every check with its clauses. */
    gateChecks: { checkId: string; verdict: string; clauses: { clause: string; verdict: string; basis?: string; instances?: number }[] }[]
    /** The post-realization owed invariants and what the rerun made of each. */
    owed: { checkId: string; clause: string; verdict: string }[]
}

export interface EvidenceInput {
    /** Where the build ended: `served`, or the stage it was refused at. */
    outcome: string
    session: ActivitySession
    blocks: EvidenceBlock[]
    /** What the coach would read: for a game in role blocks, the one composed activity. */
    composed: RenderedActivity
    /** The composition's own fidelity findings (Q6); empty for one game. */
    compositionFindings: FidelityFinding[]
    crossBlock: RoleBlockCheck[]
    record: LearningGoalAuthorization & { reviewRequest: ReviewRequest }
    lists: AuthorizationLists | null
    /** The knowledge-authorized relationships the record's adjustments cite (the record file's own list). */
    relationships: ContextManipulationRelationship[]
    /** The goal's selected library constraints, as the account lists them (ids). */
    selectedConstraints: string[]
    index: RegisterIndex
}

export type Layer = ReviewLayer | 'SESSION_INPUT'
export type Standing = 'APPROVED' | 'PROVISIONAL' | 'GAP' | 'OUR_READING' | 'SESSION'

/** One source of an element: its layer, its standing and what it is. */
export interface EvidenceSource {
    layer: Layer
    standing: Standing
    ref: string
    detail: string | null
}

/** A check's verdict as the evidence reads it: the gate's own, never recomputed. */
export interface CheckRow {
    checkId: string
    verdict: string
    clauseCount: number
    /** Clauses that passed with nothing to range over: not evidence that the property holds (SD-54). */
    vacuousClauses: string[]
    clausesNotPassing: { clause: string; verdict: string; basis: string | null; instances: number | null }[]
}

export interface Fact {
    what: string
    value: unknown
}

export interface ReviewEvidence {
    status: 'EVIDENCE_FOR_REVIEW_NOT_SERVED'
    about: string
    measured: { blocks: { blockId: string; inputDigest: string | null; registerVersion: string | null; engineVersion: string | null }[] }
    pathway: { route: 'CHECKED_REVIEW'; facts: Fact[]; his: { words: string; citedAs: string } }
    acceptance: Fact[]
    layers: { code: string; words: string }[]
    items: ItemEvidence[]
    structure: StructuralReport
    sections: {
        allocation: Fact[]
        specializedRoles: SpecializedRoleEvidence[]
        pressure: Fact[]
        scoring: Fact[]
        restarts: TransitionRow[]
        roleExchange: Fact[]
        noPrescription: Fact[]
        instructions: InstructionEvidence[]
    }
    flags: FlagEvidence[]
    /** What he asked to keep visible as limitations (stage M3), each in his words with the facts the game holds for it. */
    limitations: LimitationEvidence[]
    evaluation: { his: { words: string; citedAs: string }; points: { id: string; words: string; sections: string[] }[]; judgement: string }
    requests: { words: string; citedAs: string; sections: string[] }[]
    provenance: { elements: ElementProvenance[]; untraced: string[]; lists: { at: string; authorizedByExistingKnowledge: number; provisionalChoices: number; gaps: number; gapsStillNeeded: string[]; gapsSettled: string[] } | null; openForReview: Fact[] }
    rationale: { features: RationaleEntry[]; his: { words: string[]; citedAs: string }; judgement: string }
}

export interface ItemEvidence {
    id: string
    words: string
    citedAs: string
    kind: string
    role: string | null
    blocks: { blockId: string; elements: { path: string; row: string; value: unknown }[] }[]
    checks: { checkId: string; blockId: string | null; verdict: string }[]
    /** Indexes into `sections.instructions` of the sentences that carry it. */
    sentences: number[]
    /** What it waits on: fields awaiting approved wording, by path. */
    awaiting: string[]
    sections: string[]
    resolved: boolean
    /**
     * For an item about one role (stage M3, design step L7): per block, the role's scoring credit (row B8) with the items it rests on;
     * where it is confined to an episode, the transitions that begin, end and keep it (read from the game with `awardeeRelation`) and
     * the episode check's verdict on its two credit clauses, which is the authority; and the occurrences that also count as the
     * primary event for the team holding the role (V27). Empty for an item about no role.
     */
    facts: { blockId: string; facts: Fact[] }[]
}

export interface LimitationEvidence {
    id: string
    kind: string
    his: { words: string; citedAs: string }[]
    facts: Fact[]
}

export interface StructuralReport {
    blocks: { blockId: string; holders: Record<string, string>; sections: Record<'playerTotals' | 'spatial' | 'scoring' | 'restarts' | 'other', { checks: CheckRow[]; facts: Fact[] }>; owed: { checkId: string; clause: string; verdict: string }[] }[]
    crossBlock: { checkId: string; what: string; verdict: string; problems: string[] }[]
    composition: string[]
    summary: { gateChecks: Record<string, number>; crossBlock: Record<string, number>; owed: Record<string, number>; everyCheckPasses: boolean; vacuousClauses: string[] }
}

export interface SpecializedRoleEvidence {
    role: string
    row: string
    available: unknown
    facts: Fact[]
}

export interface TransitionRow {
    blockId: string
    elementId: string
    trigger: string | null
    lastTouch: string | null
    playState: unknown
    awardedTo: unknown
    awardedToRole: string | null
    actor: unknown
    location: unknown
    method: unknown
    startsEpisode: boolean
    /** Read from the begin condition's arms; the authority is the episode gate's verdict in the structural report. */
    beginsConditionedEpisode: boolean
    /** The roles whose credit, confined to an episode (row B8), this transition begins (stage M3, design step L7). */
    beginsCredit: string[]
    /** The roles whose credit, confined to an episode, this transition ends: it begins another episode (stage M3). */
    endsCredit: string[]
}

export interface InstructionEvidence {
    index: number
    section: string
    block: string | null
    text: string
    wording: 'APPROVED' | 'DRAFT'
    obligationWords: string[]
    q4: string[]
    layers: Layer[]
    standings: Standing[]
    sources: EvidenceSource[]
}

export interface ElementProvenance {
    path: string
    row: string | null
    blocks: string[]
    layers: Layer[]
    standings: Standing[]
    sources: EvidenceSource[]
}

export interface FlagEvidence {
    id: string
    kind: string
    role: string
    his: { words: string; citedAs: string }[]
    /**
     * Stage M3 (design step L7): SETTLED_BY_RULING where the record carries his ruling (`settledBy`) and every block holds what it put
     * in the game; RULED_NOT_IN_GAME where the ruling is recorded and some block does not hold it; FLAGGED_FOR_REVIEW otherwise.
     */
    status: 'FLAGGED_FOR_REVIEW' | 'SETTLED_BY_RULING' | 'RULED_NOT_IN_GAME'
    /** His words settling the case, read from the record (empty where none). */
    settledBy: { words: string; citedAs: string }[]
    answer: string
    blocks: { blockId: string; facts: Fact[] }[]
    knowledge?: { libraryEntries: Fact[]; registerRows: Fact[]; corpusItems: Fact[] }
}

/** The register rows on which a game can hold a rule about whether, or where, an action or a player is eligible (engine layer). */
const ELIGIBILITY_ROWS = ['R1', 'R2', 'R3', 'R4', 'V4', 'S4', 'V11', 'V13', 'V14b']

/**
 * **Read-only: every contribution item of the corpus, as authored, that states a rule on those rows** — an access function on a region,
 * an eligibility condition, an action restriction, or a consequence. Listed for his item 6 question (does existing knowledge support a
 * spatial eligibility relationship?), never selected or applied. The two rows that hold many ordinary members (S4 functions, V4 condition
 * types) are listed only where the authored value opens with the vocabulary member that concerns eligibility.
 */
function corpusEligibilityItems(): Fact[] {
    const found: Fact[] = []
    for (const contract of loadCorpusContracts()) {
        for (const item of contract.items ?? []) {
            const row = String(item.row)
            if (!ELIGIBILITY_ROWS.includes(row)) continue
            const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value ?? null)
            if (row === 'S4' && !value.startsWith('access')) continue
            if (row === 'V4' && !value.startsWith('eligibility')) continue
            // Requirement and strictness say whether the item authors such a rule or excludes one; both are read, never inferred.
            const authored = item as any
            found.push({ what: `${contract.contractId}::${item.itemId} (${row})`, value: { value, requirement: authored.requirement ?? null, strictness: authored.strictness ?? null, selector: authored.selector ?? null, basis: authored.basis ?? null } })
        }
    }
    return found
}

export interface RationaleEntry {
    feature: string
    featureBasis: 'OURS'
    words: { words: string; citedAs: string }[]
    statements: { id: string; category: string | null; text: string | null; provenance: string | null }[]
}

/* ------------------------------------------------------------------ reading the game ------------------------------------------------------------------ */

interface Segment {
    key: string
    /** Absent: no bracket. Empty string: every member (`[]`). Otherwise the member whose elementId it is. */
    id?: string
}

/** A game path split at its keys; ids may hold dots, so brackets are read whole. */
function segmentsOf(path: string): Segment[] {
    const out: Segment[] = []
    let key = ''
    for (let i = 0; i < path.length; i++) {
        const ch = path[i]
        if (ch === '[') {
            const close = path.indexOf(']', i)
            out.push({ key, id: path.slice(i + 1, close) })
            key = ''
            i = close
            if (path[i + 1] === '.') i++
        } else if (ch === '.') {
            if (key) out.push({ key })
            key = ''
        } else key += ch
    }
    if (key) out.push({ key })
    return out
}

/** The value at a game path: one value, or every member's for a path through `[]`. */
export function readPath(root: any, path: string): unknown {
    let nodes: any[] = [root]
    let many = false
    for (const segment of segmentsOf(path)) {
        nodes = nodes.flatMap(node => {
            const value = node == null ? undefined : node[segment.key]
            if (segment.id === undefined) return [value]
            if (!Array.isArray(value)) return []
            if (segment.id === '') {
                many = true
                return value
            }
            return value.filter(member => String(member?.elementId) === segment.id)
        })
    }
    return many ? nodes : nodes[0]
}

/** A path with every member id taken out: the register's spelling (`transitions[].placement.actor`). */
const genericOf = (path: string): string => segmentsOf(path).map(s => (s.id === undefined ? s.key : `${s.key}[]`)).join('.')

/** The register row a game path sits on, or null. */
function rowOf(index: RegisterIndex, path: string): string | null {
    const generic = genericOf(path.endsWith('#realized') ? path.slice(0, -'#realized'.length) : path)
    for (const row of index.rows.values()) if (String(row.path) === generic) return row.id
    return null
}

/** The contract item an element id names (`c:<contract>:<item>`, an instance suffix `#n` dropped), or null. */
function itemRefOf(elementId: string): { contractId: string; itemId: string } | null {
    if (!elementId.startsWith('c:')) return null
    const bare = elementId.slice(2).split('#')[0]
    const at = bare.lastIndexOf(':')
    return at > 0 ? { contractId: bare.slice(0, at), itemId: bare.slice(at + 1) } : null
}

const truthy = (value: unknown): boolean => value === true || value === 'true'
const asList = (value: unknown): any[] => (Array.isArray(value) ? value : [])
const tally = (values: string[]): Record<string, number> => values.reduce<Record<string, number>>((n, v) => ({ ...n, [v]: (n[v] ?? 0) + 1 }), {})
const container = (index: RegisterIndex, rowId: string): string | null => {
    const path = index.rows.get(rowId)?.path
    return path ? genericOf(String(path)).replace(/\[\]$/, '') : null
}
const membersAt = (game: any, index: RegisterIndex, rowId: string): any[] => {
    const at = container(index, rowId)
    return at ? asList(readPath(game, at)) : []
}
const along = (element: any, leaf = 'position'): { from: number; to: number } | null => element?.realizedGeometry?.[leaf]?.along?.interval ?? element?.realizedGeometry?.[leaf]?.interval ?? null
const overlaps = (a: { from: number; to: number } | null, b: { from: number; to: number } | null): boolean => !!a && !!b && Math.max(a.from, b.from) < Math.min(a.to, b.to)

/* ------------------------------------------------------------------ provenance ------------------------------------------------------------------ */

/** The source an item is, by what crossed with it: his provisional choice, or knowledge whose standing its basis gives. */
function itemSource(ref: { contractId: string; itemId: string }, items: Map<string, any>, category: unknown): EvidenceSource {
    const item = items.get(`${ref.contractId}::${ref.itemId}`)
    const basis = item?.basis ? String(item.basis) : null
    if (category === 'PROVISIONAL_REALIZATION_CHOICE' || item?.category === 'PROVISIONAL_REALIZATION_CHOICE') {
        return { layer: 'ACTIVITY_REALIZATION_CHOICE', standing: 'PROVISIONAL', ref: `${ref.contractId}::${ref.itemId}`, detail: basis ? `basis ${basis}` : null }
    }
    const approved = basis === 'AUTHORED' || basis === 'OWNER_RULING'
    return { layer: 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', standing: approved ? 'APPROVED' : 'OUR_READING', ref: `${ref.contractId}::${ref.itemId}`, detail: basis ? `basis ${basis}` : 'basis not found in the contracts the block was derived from' }
}

/** A knowledge-authorized relationship as a source: CONFIRMED by him is approved; any other status, or one the record file lacks, is not. */
function relationshipSource(id: string, relationships: Map<string, any>): EvidenceSource {
    const relationship = relationships.get(id)
    if (!relationship) return { layer: 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', standing: 'OUR_READING', ref: `relationship ${id}`, detail: 'cited, and not found in the record file\'s relationships' }
    return { layer: 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', standing: relationship.status === 'CONFIRMED' ? 'APPROVED' : 'OUR_READING', ref: `relationship ${relationship.id}`, detail: `${relationship.status}${relationship.confirmedOn ? ` ${relationship.confirmedOn}` : ''}` }
}

/**
 * **An item's sources: the item, and the knowledge-authorized relationship it cites in `authorizedBy`, where it cites one** — K8 review,
 * 15 October 2026. His reply filed 18 October 2026, item 5, confirmed the two relationships of the context with Performer
 * Configuration and with Participant Composition: *"Both should be represented as knowledge-authorized relationships rather than
 * hardcoded behavior for this Learning Goal."*, and item 7 names *"Sport-specific knowledge and authorized relationships."* as a layer of
 * its own. Until this review the evidence read the relationship only on an adjustment, so the starting counts and start placements that
 * cite it (eight provisional items) showed his provisional choice and no authorizing relationship: the layer he asked to see was missing
 * from exactly the elements it authorizes.
 */
function itemSources(ref: { contractId: string; itemId: string }, items: Map<string, any>, category: unknown, relationships: Map<string, any>): EvidenceSource[] {
    const cited = items.get(`${ref.contractId}::${ref.itemId}`)?.authorizedBy
    return [itemSource(ref, items, category), ...(typeof cited === 'string' && cited.length ? [relationshipSource(cited, relationships)] : [])]
}

/** Every source of one path in one block, from what the fixture carries; empty where nothing traces it. */
/**
 * **The items that bound a target's line for the team holding a role** (`targetOf=ROLE_HOLDER_<role>`). The fixture carries a line's bound
 * beside its value (`status.bounds`, `realizedGeometry.extentBound`) but not the item that authored it (measured 15 October 2026: the
 * post-regain area's depth reached the fixture as a bare `5 m deep`), so the item is found the way the cross-block check RB-4 finds it:
 * on the line's row, its selector naming the holder of the role whose target the region is in this block.
 */
function boundingItemsOf(path: string, block: EvidenceBlock, index: RegisterIndex): { contractId: string; itemId: string }[] {
    const spec = index.targetOf
    const first = segmentsOf(path).find(s => s.id)
    const row = rowOf(index, path)
    if (!spec || !first?.id || !row) return []
    const objective = objectivesOf(block, index).find(o => o.regionId === first.id)
    const holder = objective?.role ? holderOf(index, objective.role) : null
    if (!holder) return []
    return (block.contracts ?? []).flatMap(contract =>
        (contract.items ?? [])
            .filter(item => String(item.row) === row && (parseSelector(item.selector, row, index).predicate?.terms ?? []).some(term => term.attribute === spec.attribute && term.op === '=' && term.value === holder))
            .map(item => ({ contractId: contract.contractId, itemId: item.itemId })),
    )
}

function sourcesOf(path: string, block: EvidenceBlock, items: Map<string, any>, adjustments: Map<string, any>, relationships: Map<string, any>, index: RegisterIndex): EvidenceSource[] {
    const status = block.fixture?.status ?? {}
    const generic = genericOf(path)
    const found: EvidenceSource[] = []
    for (const derived of status.derived ?? []) {
        if (derived?.path !== path) continue
        for (const support of derived.support ?? []) {
            if (support?.kind === 'CONTRACT_ITEM') found.push(...itemSources(support, items, support.category, relationships))
            else if (support?.kind === 'STANDING_DECISION') found.push({ layer: 'GENERAL_ENGINE_MECHANISM', standing: 'APPROVED', ref: String(support.id), detail: `standing decision, resolved by ${derived.resolvedBy ?? 'derivation'}` })
            else if (support?.kind === 'SESSION') found.push({ layer: 'SESSION_INPUT', standing: 'SESSION', ref: `session row ${support.row}`, detail: null })
            else found.push({ layer: 'GENERAL_ENGINE_MECHANISM', standing: 'OUR_READING', ref: String(support?.kind ?? 'unknown support'), detail: null })
        }
    }
    for (const choice of status.choices ?? []) {
        if (choice?.path !== path) continue
        const coach = choice.value && typeof choice.value === 'object' && 'coachDecides' in choice.value
        if (choice.category === 'PROVISIONAL_REALIZATION_CHOICE') found.push({ layer: 'ACTIVITY_REALIZATION_CHOICE', standing: 'PROVISIONAL', ref: `choice ${choice.lineId}`, detail: coach ? 'the coach decides at the session' : null })
        else if (choice.authority) found.push({ layer: 'GENERAL_ENGINE_MECHANISM', standing: 'APPROVED', ref: `${choice.authority}${choice.defaultedBy ? ` (${choice.defaultedBy})` : ''}`, detail: `closed by rule (${choice.closure ?? 'rule'}), not chosen` })
        else found.push({ layer: 'ACTIVITY_REALIZATION_CHOICE', standing: 'OUR_READING', ref: `choice ${choice.lineId}`, detail: 'a realization choice not labelled his' })
        for (const bound of choice.within?.bounds ?? []) if (bound?.assumed) found.push({ layer: 'GENERAL_ENGINE_MECHANISM', standing: 'OUR_READING', ref: `bound of ${choice.lineId}`, detail: 'the bound is assumed' })
    }
    for (const entailed of status.entailed ?? []) {
        if (entailed?.path !== path && `${entailed?.collection}[].${entailed?.leaf}` !== generic) continue
        found.push({ layer: 'GENERAL_ENGINE_MECHANISM', standing: 'APPROVED', ref: 'entailment at assembly', detail: `${entailed.collection}[${entailed.handle}].${entailed.leaf} = ${JSON.stringify(entailed.value)}` })
        for (const ref of entailed.supportedBy ?? []) found.push(...itemSources(ref, items, null, relationships))
    }
    for (const geometry of status.geometry ?? []) {
        if (geometry?.path !== path) continue
        found.push({ layer: 'GENERAL_ENGINE_MECHANISM', standing: 'APPROVED', ref: 'realization (realized geometry)', detail: `${geometry.geometry?.term ?? ''} ${JSON.stringify(geometry.geometry?.interval ?? null)}`.trim() })
    }
    for (const instantiation of status.instantiations ?? []) {
        const handle = String(instantiation?.handle ?? instantiation?.elementId ?? '')
        if (handle && path.includes(`[${handle}]`) && instantiation.satisfies) found.push(...itemSources(itemRefOf(String(instantiation.satisfies)) ?? { contractId: '', itemId: '' }, items, null, relationships))
    }
    if (path.startsWith('adjustments[')) {
        const id = path.slice('adjustments['.length, path.indexOf(']'))
        const entry = adjustments.get(id)
        found.push({ layer: 'ACTIVITY_REALIZATION_CHOICE', standing: 'PROVISIONAL', ref: `record ${id}`, detail: entry ? entry.citedAs : null })
        const relationship = entry ? relationships.get(entry.relationship) : null
        if (relationship) found.push(relationshipSource(String(relationship.id), relationships))
    }
    for (const ref of boundingItemsOf(path, block, index)) {
        const [item, ...authorizing] = itemSources(ref, items, null, relationships)
        found.push({ ...item, detail: `bounds this line for the team holding a role (${index.targetOf?.attribute ?? 'targetOf'})` }, ...authorizing)
    }
    if (path.startsWith('envelope.')) found.push({ layer: 'SESSION_INPUT', standing: 'SESSION', ref: 'session', detail: path })
    if (!found.length) {
        // The element's own establishing item: every element id names the item that established it.
        const first = segmentsOf(path).find(s => s.id)
        const ref = first?.id ? itemRefOf(first.id) : null
        if (ref) found.push(...itemSources(ref, items, null, relationships))
        // A whole collection cited as such (`transitions`, `performers.teams`): the items that established its members.
        if (!first) {
            const members = readPath(block.fixture?.game ?? {}, path)
            for (const member of asList(members)) {
                const memberRef = member?.elementId ? itemRefOf(String(member.elementId)) : null
                if (memberRef) found.push(...itemSources(memberRef, items, null, relationships))
            }
        }
    }
    return found
}

const dedupe = (sources: EvidenceSource[]): EvidenceSource[] => {
    const seen = new Map<string, EvidenceSource>()
    for (const source of sources) seen.set(JSON.stringify([source.layer, source.standing, source.ref]), source)
    return [...seen.values()]
}
const LAYER_ORDER: Layer[] = ['GENERAL_ENGINE_MECHANISM', 'SPORT_KNOWLEDGE_AND_AUTHORIZED_RELATIONSHIPS', 'ACTIVITY_REALIZATION_CHOICE', 'SESSION_INPUT']
const STANDING_ORDER: Standing[] = ['APPROVED', 'PROVISIONAL', 'OUR_READING', 'SESSION', 'GAP']
const layersOf = (sources: EvidenceSource[]): Layer[] => LAYER_ORDER.filter(layer => sources.some(s => s.layer === layer))
const standingsOf = (sources: EvidenceSource[]): Standing[] => STANDING_ORDER.filter(standing => sources.some(s => s.standing === standing))

/* ------------------------------------------------------------------ the structural sections ------------------------------------------------------------------ */

/** Which gate check reports on which part of his request ("player totals, spatial relationships, scoring conditions, and restarts"). */
const STRUCTURE_CHECKS: Record<'playerTotals' | 'spatial' | 'scoring' | 'restarts', string[]> = {
    playerTotals: ['GA-ROSTER-SUM', 'GA-AFFILIATION'],
    spatial: ['GA-ENVELOPE-FIT', 'GA-LAYOUT-FEASIBLE', 'GA-DIRECTION', 'GA-RELATIVE-PLACEMENT', 'GA-REGION-FUNCTION'],
    scoring: ['GA-ONE-PRIMARY-EVENT', 'GA-OBJECTIVE-SETS', 'GA-REFERENCE-INTEGRITY', 'GA-EPISODE-REACHABLE', 'GA-MODIFIER-OVERLAP', 'GA-EFFECT-TYPED', 'GA-INFORMATION', 'GA-TIME-WINDOWS'],
    restarts: ['GA-TRANSITION-COHERENCE', 'GA-TRIGGER-REACHABLE', 'GA-TRIGGER-UNIQUE', 'GA-EPISODE-REACHABLE'],
}

/** A check as the report shows it: its verdict, how many clauses it ran, the vacuous ones by name, and every clause that did not pass. */
const checkRow = (check: EvidenceBlock['gateChecks'][number]): CheckRow => ({
    checkId: check.checkId,
    verdict: String(check.verdict),
    clauseCount: check.clauses.length,
    vacuousClauses: check.clauses.filter(c => c.verdict === 'PASS' && c.basis === 'NO_APPLICABLE_INSTANCES').map(c => c.clause),
    clausesNotPassing: check.clauses.filter(c => c.verdict !== 'PASS').map(c => ({ clause: c.clause, verdict: String(c.verdict), basis: c.basis ?? null, instances: typeof c.instances === 'number' ? c.instances : null })),
})

/** The team holding each role in a block, and each team's counts by the register's own leaves. */
function teamsOf(block: EvidenceBlock, index: RegisterIndex): { handle: string; designation: string | null; role: string | null; counts: Record<string, number>; total: number }[] {
    const game = block.fixture?.game ?? {}
    const bindings = asList(block.fixture?.record?.designationBindings) as { designation: string; handle: string }[]
    const outfieldLeaf = String(index.rows.get('P2')?.path ?? '').split('[].').pop() ?? ''
    const leaves = [outfieldLeaf, ...index.specializedRoleRows.values()].filter(Boolean)
    return membersAt(game, index, 'P1').map(team => {
        const designation = bindings.find(b => b.handle === team?.elementId)?.designation ?? null
        const role = Object.entries(block.holders).find(([, holder]) => holder === designation)?.[0] ?? null
        const counts = Object.fromEntries(leaves.map(leaf => [leaf, typeof team?.[leaf] === 'number' ? team[leaf] : 0]))
        return { handle: String(team?.elementId), designation, role, counts, total: Object.values(counts).reduce((n, v) => n + v, 0) }
    })
}

/** The objectives that score (the register's targetOf role), each with its team, the role the team holds, and its region. */
function objectivesOf(block: EvidenceBlock, index: RegisterIndex): { elementId: string; team: string; role: string | null; regionId: string | null; region: any }[] {
    const game = block.fixture?.game ?? {}
    const spec = index.targetOf
    const regions = membersAt(game, index, 'S2')
    return membersAt(game, index, spec?.objectivesRow ?? 'J1').map(objective => {
        const team = String(objective?.[spec?.teamLeaf ?? 'team'])
        const ref = objective?.[spec?.referenceLeaf ?? 'reference']?.structuralRef
        const regionId = ref ? `c:${ref.contractId}:${ref.itemId}` : null
        return { elementId: String(objective?.elementId), team, role: Object.entries(block.holders).find(([, holder]) => holder === team)?.[0] ?? null, regionId, region: regions.find(r => r?.elementId === regionId) ?? null }
    })
}

/** The designation a role is held under (ROLE_HOLDER_<role>, read from the register), or null. */
const holderOf = (index: RegisterIndex, role: string): string | null => roleHolderNames(index).find(name => roleOfHolder(index, name) === role) ?? null

/** The items a game path rests on, as the fixture records them, with each one's basis and where he said it. */
function supportOf(block: EvidenceBlock, path: string, items: Map<string, any>): { item: string; basis: string | null; citedAs: string | null }[] {
    return (block.fixture?.status?.derived ?? [])
        .filter((derived: any) => derived?.path === path)
        .flatMap((derived: any) => asList(derived.support))
        .filter((support: any) => support?.kind === 'CONTRACT_ITEM')
        .map((support: any) => {
            const item = items.get(`${support.contractId}::${support.itemId}`)
            return { item: `${support.contractId}::${support.itemId}`, basis: item?.basis ? String(item.basis) : null, citedAs: item?.citedAs ? String(item.citedAs) : null }
        })
}

/** A transition's selector terms as the gate reads them (attribute -> value), qualifiers included. */
const termsOf = (transition: any): Record<string, unknown> => Object.fromEntries(asList(transition?.selector).filter(term => term?.op === '=').map(term => [String(term.attribute), term.value]))

/**
 * **A role's scoring credit, and where it is confined to an episode, what begins, ends and keeps it** — stage M3, 17 October 2026
 * (design step L7). Christian, reply filed 19 October 2026, item 1: *"If the building team loses possession, that scoring opportunity
 * ends. If it subsequently regains possession, play may continue, but the original build-out scoring opportunity is not restored."*;
 * item 6: *"please proceed with the review-page activity, provided its actual scoring eligibility matches the approved distinction
 * between an active build-out and subsequent possession regains."* Read from the block's game as GA-EPISODE-REACHABLE's clauses 4 and
 * 5 read its classes, and never instead of them: the gate's verdict is the authority and is shown beside these facts.
 *
 *   - begins: a restart (play stops and resumes) that begins an episode and is taken by an arm of the begin condition of the episode
 *     the bound names (the condition whose referents begin that episode);
 *   - ends: a change of possession that begins an episode, and any other restart that begins one;
 *   - keeps: a restart that begins none, awarded to the role's holder (`awardeeRelation` HOLDER);
 *   - notEnded: a change of possession that begins no episode, or a restart that begins none and is not shown to be the holder's.
 *
 * Null where the role holds no element; `bounded` false where its bound is absent or the whole game.
 */
function creditOf(block: EvidenceBlock, index: RegisterIndex, role: string, items: Map<string, any>) {
    const spec = index.roleBlocks
    const game = block.fixture?.game ?? {}
    if (!spec) return null
    const element = membersAt(game, index, spec.rolesRow).find(member => member?.[spec.roleAttribute] === role)
    if (!element) return null
    const leaf = String(index.rows.get('B8')?.path ?? '').split('[].').pop() ?? ''
    const path = `${container(index, spec.rolesRow)}[${element.elementId}].${leaf}`
    const creditedWithin = element?.[leaf] ?? null
    const bounded = creditedWithin !== null && creditedWithin !== UNBOUNDED_CREDIT
    const facts = { element: String(element.elementId), path, creditedWithin, support: supportOf(block, path, items), bounded, begins: [] as string[], ends: [] as string[], keeps: [] as string[], notEnded: [] as { elementId: string; why: string }[] }
    if (!bounded) return facts
    const holder = holderOf(index, role)
    const takers = new Set(membersAt(game, index, 'V3').filter(condition => condition?.referents?.beginsEpisodeOf === creditedWithin).flatMap(condition => asList(condition?.referents?.arms).filter(arm => arm?.takenBy !== undefined).map(arm => String(arm.takenBy))))
    const teamCount = membersAt(game, index, 'P1').length || null
    for (const transition of membersAt(game, index, 'T1')) {
        const id = String(transition?.elementId)
        const terms = termsOf(transition)
        const starts = truthy(transition?.startsEpisode)
        if (terms.trigger === 'POSSESSION_CHANGE') {
            if (starts) facts.ends.push(id)
            else facts.notEnded.push({ elementId: id, why: 'a change of possession that begins no episode' })
            continue
        }
        if (String(transition?.playState) !== 'STOP_RESUME') continue
        if (starts) {
            if (takers.has(String(transition?.placement?.actor))) facts.begins.push(id)
            else facts.ends.push(id)
            continue
        }
        const relation = holder ? awardeeRelation(index, transition?.awardedTo, terms, holder, teamCount) : 'UNDETERMINED'
        if (relation === 'HOLDER') facts.keeps.push(id)
        else facts.notEnded.push({ elementId: id, why: `a restart that begins no episode, awarded ${relation === 'OTHER' ? 'away from the holder' : 'to a team not shown to be the holder'}` })
    }
    return facts
}

/**
 * **The occurrences that also count as the primary event for the team holding a role** (row V27) — stage M3 (design step L7). His
 * reply filed 19 October 2026, item 2: *"For the previously flagged corner case, I favor allowing a controlled regain inside that area
 * to count as a score, provided the pressing team genuinely establishes possession."* Each element with its team, trigger, the target
 * it lies inside (the one its team attacks: the role's own objective, as GA-ONE-PRIMARY-EVENT's clause reads it), its control and
 * exclusion as recorded, and the items it rests on with their basis and citation.
 */
function alsoCountsFor(block: EvidenceBlock, index: RegisterIndex, role: string, items: Map<string, any>) {
    const game = block.fixture?.game ?? {}
    const holder = holderOf(index, role)
    const at = container(index, 'V27')
    const own = objectivesOf(block, index).find(o => o.role === role)
    return membersAt(game, index, 'V27')
        .filter(element => holder !== null && element?.team === holder)
        .map(element => {
            const prefix = `${at}[${element.elementId}]`
            const support = dedupeSupport(['team', 'trigger', 'control', 'exclusion'].flatMap(field => supportOf(block, `${prefix}.${field}`, items)))
            return {
                elementId: String(element.elementId),
                team: element.team ?? null,
                trigger: element.trigger ?? null,
                target: own ? { region: own.regionId, along: along(own.region) } : null,
                control: element.control ?? null,
                exclusion: element.exclusion ?? null,
                support,
                everyItemHisRuling: support.length > 0 && support.every(s => s.basis === 'OWNER_RULING'),
            }
        })
}
const dedupeSupport = <T extends { item: string }>(list: T[]): T[] => [...new Map(list.map(entry => [entry.item, entry])).values()]

/** Every transition of a block as a row: who, where, how, and whether it begins the episode the conditions are scoped to. */
function transitionsOf(block: EvidenceBlock, index: RegisterIndex): TransitionRow[] {
    const game = block.fixture?.game ?? {}
    const beginArms = membersAt(game, index, 'V3').flatMap(condition => asList(condition?.referents?.arms).map(arm => ({ arm, episode: condition?.referents?.beginsEpisodeOf })))
    const credits = Object.keys(block.holders).map(role => ({ role, credit: creditOf(block, index, role, new Map()) })).filter(entry => entry.credit?.bounded)
    return membersAt(game, index, 'T1').map(transition => {
        const trigger = asList(transition?.selector).find(term => term?.attribute === 'trigger')?.value ?? null
        const awarded = transition?.awardedTo
        const actor = transition?.placement?.actor
        const starts = truthy(transition?.startsEpisode)
        return {
            blockId: block.blockId,
            elementId: String(transition?.elementId),
            trigger: trigger === null ? null : String(trigger),
            lastTouch: transition?.qualifiers?.lastTouch ? String(transition.qualifiers.lastTouch) : null,
            playState: transition?.playState ?? null,
            awardedTo: awarded ?? null,
            awardedToRole: awarded ? roleOfHolder(index, awarded) : null,
            actor: actor ?? null,
            location: transition?.placement?.region ?? null,
            method: transition?.placement?.method ?? null,
            startsEpisode: starts,
            beginsConditionedEpisode: starts && String(transition?.playState) === 'STOP_RESUME' && beginArms.some(({ arm }) => arm?.takenBy !== undefined && arm.takenBy === actor),
            beginsCredit: credits.filter(entry => entry.credit!.begins.includes(String(transition?.elementId))).map(entry => entry.role),
            endsCredit: credits.filter(entry => entry.credit!.ends.includes(String(transition?.elementId))).map(entry => entry.role),
        }
    })
}

/** The game's elements on the rows that would restrict where or when a player may play, counted. */
function restrictionsOf(game: any, index: RegisterIndex): Fact[] {
    const count = (rowId: string) => membersAt(game, index, rowId).length
    const accessRegions = membersAt(game, index, 'S2').filter(region => asList(region?.functions).includes('access')).map(region => String(region.elementId))
    const eligibility = membersAt(game, index, 'V3').filter(condition => condition?.type === 'eligibility').map(condition => String(condition.elementId))
    return [
        { what: 'action restrictions (R1: a rule changing whether an otherwise available action or target is eligible)', value: count('R1') },
        { what: 'consequences (V11, including an ACCESS effect, V13)', value: count('V11') },
        { what: 'time windows (V23)', value: count('V23') },
        { what: 'value modifiers (V7)', value: count('V7') },
        { what: 'information rules (V15)', value: count('V15') },
        { what: 'objective sets (J5)', value: count('J5') },
        { what: 'regions with the access function (S4)', value: accessRegions },
        { what: 'primary-event conditions of type eligibility (V4)', value: eligibility },
    ]
}

/* ------------------------------------------------------------------ the evidence ------------------------------------------------------------------ */

const LIVE_ROUTE_REFUSES = 'does not serve this activity: it builds only from a selection with at least one library constraint, and this selection has none, so it refuses with no model call'

const PLAIN_ABOUT =
    'Facts read from the games the checked pathway built, for an administrator\'s review; never served. Every verdict is a gate\'s or a cross-block check\'s (each refuses the build where it fails); every fact is read from the game; every quotation is read from the goal\'s authorization record. Nothing here claims how the activity plays.'

export function reviewEvidenceOf(input: EvidenceInput): ReviewEvidence {
    const { blocks, index, record, composed } = input
    const request = record.reviewRequest
    const adjustments = new Map<string, any>((record.authorizedAdjustments?.entries ?? []).map(entry => [entry.id, entry]))
    const relationships = new Map<string, any>(input.relationships.map(relationship => [relationship.id, relationship]))
    for (const block of blocks) for (const entry of asList(block.fixture?.adjustments?.entries ?? block.fixture?.adjustments)) if (entry?.id && !adjustments.has(entry.id)) adjustments.set(entry.id, entry)
    const itemsOf = (block: EvidenceBlock) => new Map((block.contracts ?? []).flatMap(contract => (contract.items ?? []).map(item => [`${contract.contractId}::${item.itemId}`, item] as const)))
    const blockItems = blocks.map(itemsOf)
    const roles = Object.keys(blocks[0]?.holders ?? {})
    const nouns: Record<string, string> = index.roleBlocks?.coachNouns ?? {}

    /* Instructions, with their provenance and the prescription rule's findings on them. */
    const approved = blocks.flatMap(block => approvedSentences(block.fixture?.game ?? {}))
    // Stage M4: a sentence that IS one of his approved template sentences, word for word (an instruction carries no final full stop),
    // is approved wording too; the same template filled with any other value is a generalization of his words, DRAFT.
    const approvedTemplates = approvedTemplateSentences().map(template => template.sentence.replace(/\.$/, ''))
    const allFindings = [...blocks.flatMap(block => block.findings), ...input.compositionFindings]
    const instructions: InstructionEvidence[] = composed.instructions.map((instruction: Instruction, i) => {
        const owners = instruction.block ? blocks.filter(block => block.blockId === instruction.block) : blocks
        const sources = dedupe(owners.flatMap(block => instruction.from.flatMap(path => sourcesOf(path, block, blockItems[blocks.indexOf(block)], adjustments, relationships, index))))
        return {
            index: i,
            section: instruction.section,
            block: instruction.block ?? null,
            text: instruction.text,
            wording: approved.some(sentence => sentence.text === instruction.text) || approvedTemplates.includes(instruction.text) ? 'APPROVED' : 'DRAFT',
            obligationWords: OBLIGATIONS.filter(word => word.test(instruction.text)).map(word => String(word)),
            q4: allFindings.filter(f => f.question === 4 && f.what.includes(instruction.text)).map(f => `${f.severity}: ${f.what}`),
            layers: layersOf(sources),
            standings: standingsOf(sources),
            sources,
        }
    })

    /* Withheld fields: the parts awaiting approved wording, and which fidelity findings are about them rather than the text said. */
    const withheld = composed.withheld.map(field => field.path)
    /**
     * The row of a path: the register's, or — for a withheld field whose path the register does not spell (a condition's scope, row V3,
     * is withheld at `…conditions[x].scope`) — the row the renderer reported it on. K8 review, 15 October 2026: read from the path alone,
     * the four withheld scope fields had no row, so his item 4 listed 11 of the 15 fields its conditions wait on, and the provenance named
     * their row '?'.
     */
    const withheldRow = new Map(composed.withheld.map(field => [field.path, String(field.row)] as const))
    // Stage M5, 18 October 2026: and a field only approved words may say keeps its row once his sentence says it (wordedFieldRows):
    // measured, the four build-out scopes lost row V3, and his item 4 its four scope elements, when his first approved entry said them.
    const wordedRow = new Map(blocks.flatMap(block => wordedFieldRows(block.fixture?.game ?? {})).map(field => [field.path, field.row] as const))
    const rowAt = (path: string): string | null => rowOf(index, path) ?? withheldRow.get(path) ?? wordedRow.get(path) ?? null
    const aboutWithheld = (finding: FidelityFinding) => finding.question === 3 && withheld.some(path => finding.what.startsWith(`${path} `))
    const violations = allFindings.filter(f => f.severity === 'VIOLATION')
    const inSaidText = violations.filter(f => !aboutWithheld(f))

    /* Element provenance: every path the fixtures carry or the sentences cite, merged across blocks. */
    const paths = new Map<string, Set<string>>()
    const note = (path: string, blockId: string) => {
        if (!paths.has(path)) paths.set(path, new Set())
        paths.get(path)!.add(blockId)
    }
    for (const block of blocks) {
        const status = block.fixture?.status ?? {}
        for (const entry of [...(status.derived ?? []), ...(status.choices ?? []), ...(status.geometry ?? [])]) if (entry?.path) note(String(entry.path), block.blockId)
        for (const entry of status.entailed ?? []) note(String(entry.path ?? `${entry.collection}[${entry.handle}].${entry.leaf}`), block.blockId)
    }
    for (const instruction of composed.instructions) for (const path of instruction.from) for (const block of blocks) if (!instruction.block || instruction.block === block.blockId) note(path, block.blockId)
    for (const path of withheld) for (const block of blocks) note(path, block.blockId)
    const untraced: string[] = []
    const elements: ElementProvenance[] = [...paths.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([path, where]) => {
        const sources = dedupe(blocks.filter(block => where.has(block.blockId)).flatMap(block => sourcesOf(path, block, blockItems[blocks.indexOf(block)], adjustments, relationships, index)))
        if (withheld.includes(path)) sources.push({ layer: 'GENERAL_ENGINE_MECHANISM', standing: 'GAP', ref: 'awaiting approved wording', detail: `row ${rowAt(path) ?? '?'}: no approved sentence says it yet` })
        if (!sources.length) untraced.push(path)
        return { path, row: rowAt(path), blocks: [...where].sort(), layers: layersOf(sources), standings: standingsOf(sources), sources }
    })

    /* Structural report, block by block. */
    const structure: StructuralReport = {
        blocks: blocks.map(block => {
            const game = block.fixture?.game ?? {}
            const rows = block.gateChecks.map(checkRow)
            const pick = (ids: string[]) => rows.filter(row => ids.includes(row.checkId))
            const listed = new Set(Object.values(STRUCTURE_CHECKS).flat())
            const teams = teamsOf(block, index)
            const objectives = objectivesOf(block, index)
            const regions = membersAt(game, index, 'S2')
            const targets = objectives.map(o => along(o.region))
            const players = Number(block.fixture?.envelope?.players)
            return {
                blockId: block.blockId,
                holders: { ...block.holders },
                owed: block.owed.map(o => ({ ...o })),
                sections: {
                    playerTotals: {
                        checks: pick(STRUCTURE_CHECKS.playerTotals),
                        facts: [
                            ...teams.map(team => ({ what: `team ${team.handle}${team.designation ? ` (${team.designation})` : ''}${team.role ? ` holds the ${team.role} role` : ''}`, value: { ...team.counts, total: team.total } })),
                            { what: 'players in the teams, against the session', value: { inTeams: teams.reduce((n, t) => n + t.total, 0), session: players } },
                        ],
                    },
                    spatial: {
                        checks: pick(STRUCTURE_CHECKS.spatial),
                        facts: [
                            ...regions.map(region => {
                                const objective = objectives.find(o => o.regionId === region?.elementId)
                                const relation = region?.realizedGeometry?.position?.along?.relation
                                return {
                                    what: `region ${region?.elementId} (${region?.noun ?? 'no noun'})${objective ? `: the target of ${objective.team}${objective.role ? `, the ${objective.role} role` : ''}` : ''}${relation?.of ? `; placed beyond ${relation.of.contractId}::${relation.of.itemId} for ${relation.forTeam}` : ''}`,
                                    value: { along: along(region), across: region?.realizedGeometry?.position?.across?.interval ?? null },
                                }
                            }),
                            { what: 'the scoring targets share no stretch of the axis (touching at a line is not sharing)', value: targets.length === 2 ? !overlaps(targets[0], targets[1]) : null },
                            { what: 'area (session)', value: { lengthM: block.fixture?.envelope?.lengthM, widthM: block.fixture?.envelope?.widthM } },
                        ],
                    },
                    scoring: {
                        checks: pick(STRUCTURE_CHECKS.scoring),
                        facts: [
                            { what: 'primary event (V1 kind, V2 value)', value: { kind: readPath(game, 'value.primaryEvent.kind'), value: readPath(game, 'value.primaryEvent.value') } },
                            ...objectives.map(o => ({ what: `objective ${o.elementId}: ${o.team}${o.role ? ` (${o.role})` : ''} scores in ${o.regionId}`, value: along(o.region) })),
                            ...membersAt(game, index, 'V3').map(condition => ({ what: `condition ${condition?.elementId} (${condition?.type}), scope ${condition?.scope ?? 'WHOLE_GAME'}`, value: condition?.referents?.asAuthored ?? condition?.value ?? null })),
                        ],
                    },
                    restarts: { checks: pick(STRUCTURE_CHECKS.restarts), facts: transitionsOf(block, index).map(t => ({ what: `transition ${t.elementId} on ${t.trigger}${t.lastTouch ? ` (last touch ${t.lastTouch})` : ''}`, value: { playState: t.playState, awardedTo: t.awardedTo, actor: t.actor, startsEpisode: t.startsEpisode, beginsConditionedEpisode: t.beginsConditionedEpisode } })) },
                    other: { checks: rows.filter(row => !listed.has(row.checkId)), facts: [] },
                },
            }
        }),
        crossBlock: input.crossBlock.map(check => ({ checkId: check.checkId, what: check.what, verdict: check.verdict, problems: [...check.problems] })),
        composition: input.compositionFindings.filter(f => f.severity === 'VIOLATION').map(f => `fidelity Q${f.question}: ${f.what}`),
        summary: {
            gateChecks: tally(blocks.flatMap(block => block.gateChecks.map(c => String(c.verdict)))),
            crossBlock: tally(input.crossBlock.map(c => c.verdict)),
            owed: tally(blocks.flatMap(block => block.owed.map(o => o.verdict))),
            everyCheckPasses:
                blocks.every(block => block.gateChecks.every(c => c.verdict === 'PASS') && block.owed.every(o => o.verdict === 'PASS')) &&
                input.crossBlock.every(c => c.verdict === 'PASS') &&
                !input.compositionFindings.some(f => f.severity === 'VIOLATION'),
            vacuousClauses: blocks.flatMap(block => block.gateChecks.map(checkRow).flatMap(row => row.vacuousClauses.map(clause => `${block.blockId}: ${row.checkId} — ${clause}`))),
        },
    }

    /* Sections. */
    const transitions = blocks.flatMap(block => transitionsOf(block, index))
    const allocation: Fact[] = [
        ...blocks.flatMap(block => teamsOf(block, index).map(team => ({ what: `block ${block.blockId}: team ${team.handle}${team.role ? ` (${team.role})` : ''}`, value: { ...team.counts, total: team.total } }))),
        ...blocks.slice(0, 1).flatMap(block => membersAt(block.fixture?.game ?? {}, index, 'B4').map(r => ({ what: `at an exchange of roles, ${r.count} of ${r.performerRow} move to the team taking the ${r.toRole} role (${r.elementId})`, value: r.count }))),
        ...asList(blocks[0]?.fixture?.alternatives).map(alt => ({ what: `deferring as the alternative (${alt.defersTo}, relationship ${alt.relationship}): ${alt.contractId}::${alt.itemId} ${alt.row}`, value: alt.value })),
        { what: 'session', value: { players: input.session.players, roles: { ...input.session.roles } } },
    ]

    const specializedRoles: SpecializedRoleEvidence[] = [...index.specializedRoleRows.entries()].map(([row, role]) => {
        const leaf = String(index.rows.get(row)?.path ?? '').split('[].').pop() ?? role
        const facts: Fact[] = []
        for (const block of blocks) {
            const game = block.fixture?.game ?? {}
            for (const team of teamsOf(block, index)) facts.push({ what: `block ${block.blockId}: ${team.counts[leaf] ?? 0} on team ${team.handle}${team.role ? `, which holds the ${team.role} role` : ''}`, value: team.counts[leaf] ?? 0 })
            const takes = transitionsOf(block, index).filter(t => t.actor === role)
            facts.push({ what: `block ${block.blockId}: transitions this role takes`, value: takes.map(t => ({ elementId: t.elementId, trigger: t.trigger, awardedToRole: t.awardedToRole, method: t.method, location: t.location, beginsConditionedEpisode: t.beginsConditionedEpisode })) })
            // Where else the game names the role: anything beyond a team's count and a restart's taker.
            const named: string[] = []
            const scan = (node: any, at: string) => {
                if (typeof node === 'string') {
                    if (node === role) named.push(at)
                } else if (Array.isArray(node)) node.forEach((member, i) => scan(member, `${at}[${member?.elementId ?? i}]`))
                else if (node && typeof node === 'object') for (const [key, value] of Object.entries(node)) scan(value, at ? `${at}.${key}` : key)
            }
            scan(game, '')
            facts.push({ what: `block ${block.blockId}: other places the game names the role (not a team count or a restart's taker)`, value: named.filter(at => !at.endsWith('.placement.actor')) })
        }
        const naming = instructions.filter(i => i.text.toLowerCase().includes(role.toLowerCase()))
        facts.push({ what: 'sentences naming the role, with any word of obligation or prescription finding', value: naming.map(i => ({ index: i.index, text: i.text, obligationWords: i.obligationWords, q4: i.q4 })) })
        return { role, row, available: input.session.roles?.[role] ?? null, facts }
    })

    const pressure: Fact[] = blocks.flatMap(block => {
        const game = block.fixture?.game ?? {}
        const placements = membersAt(game, index, 'P8')
        const objectives = objectivesOf(block, index)
        return [
            ...roles.map(role => {
                const holder = holderOf(index, role)
                const placement = placements.find(p => p?.group === holder)
                const ownTarget = objectives.find(o => o.role === role)
                const otherTargets = objectives.filter(o => o.role && o.role !== role)
                const start = along(placement, 'region')
                return {
                    what: `block ${block.blockId}: the ${role} role (${nouns[role] ?? role}) — team counts, start placement and targets`,
                    value: {
                        team: teamsOf(block, index).find(t => t.role === role)?.counts ?? null,
                        start: placement ? { region: start, asAuthored: placement?.region?.asAuthored ?? null, timing: placement?.timing ?? null, resetsAt: placement?.resetsAt ?? null } : null,
                        startInsideOtherRoleTarget: otherTargets.map(o => ({ target: o.regionId, overlaps: overlaps(start, along(o.region)) })),
                        target: ownTarget ? { region: ownTarget.regionId, along: along(ownTarget.region) } : null,
                    },
                }
            }),
            { what: `block ${block.blockId}: start placements are re-established at the transitions that begin the conditioned episode`, value: transitionsOf(block, index).filter(t => t.beginsConditionedEpisode).map(t => t.elementId) },
            ...restrictionsOf(game, index).map(fact => ({ ...fact, what: `block ${block.blockId}: ${fact.what}` })),
        ]
    })

    /**
     * **Each condition on the primary event, with the episode it applies within and the notes recorded on the items it rests on** — K8
     * review, 15 October 2026. The design's item 4 asks for his M8 safeguard beside the exclusion it guards (reply filed 17 October 2026,
     * M8), and it bears on his item 6 flag: whether a pass to a player waiting in the target can count. The safeguard is recorded, in his
     * words, in the note of the item that types the exclusion's target (C57); until this review the evidence showed the conditions and
     * none of what the knowledge records beside them. Read whole from the items the block was derived from (their own `fitNote`), never
     * restated here; a note is the knowledge's record, his words only where it quotes him.
     */
    const conditionsOf = (block: EvidenceBlock) => {
        const at = container(index, 'V3')
        const items: Map<string, any> = blockItems[blocks.indexOf(block)]
        return membersAt(block.fixture?.game ?? {}, index, 'V3').map(condition => {
            const prefix = `${at}[${condition?.elementId}]`
            const refs = new Set<string>()
            const own = itemRefOf(String(condition?.elementId ?? ''))
            if (own) refs.add(`${own.contractId}::${own.itemId}`)
            for (const derived of block.fixture?.status?.derived ?? []) {
                if (!String(derived?.path ?? '').startsWith(prefix)) continue
                for (const support of derived.support ?? []) if (support?.kind === 'CONTRACT_ITEM') refs.add(`${support.contractId}::${support.itemId}`)
            }
            const notes = [...refs].map(ref => ({ item: ref, fitNote: items.get(ref)?.fitNote })).filter(note => typeof note.fitNote === 'string' && note.fitNote.length > 0)
            return { elementId: condition?.elementId ?? null, type: condition?.type ?? null, scope: condition?.scope ?? 'WHOLE_GAME', items: [...refs], notes }
        })
    }

    const scoring: Fact[] = blocks.flatMap(block => {
        const game = block.fixture?.game ?? {}
        const rows = transitionsOf(block, index)
        return [
            ...objectivesOf(block, index).map(o => ({ what: `block ${block.blockId}: ${o.role ?? o.team} scores by ${readPath(game, 'value.primaryEvent.kind')} in ${o.regionId}`, value: { along: along(o.region), noun: o.region?.noun ?? null } })),
            ...membersAt(game, index, 'V3').map(c => ({ what: `block ${block.blockId}: condition ${c?.elementId} (${c?.type}) applies within ${c?.scope ?? 'WHOLE_GAME'}`, value: c?.referents ?? c?.value ?? null })),
            { what: `block ${block.blockId}: the items each condition rests on, and the notes the knowledge records on them`, value: conditionsOf(block).map(({ elementId, items, notes }) => ({ elementId, items, notes })) },
            { what: `block ${block.blockId}: after a score`, value: rows.filter(t => t.trigger === 'SCORE').map(t => ({ playState: t.playState, awardedToRole: t.awardedToRole, actor: t.actor, startsEpisode: t.startsEpisode })) },
            { what: `block ${block.blockId}: after a change of possession`, value: rows.filter(t => t.trigger === 'POSSESSION_CHANGE').map(t => ({ playState: t.playState, startsEpisode: t.startsEpisode, beginsConditionedEpisode: t.beginsConditionedEpisode })) },
        ]
    })

    const roleExchange: Fact[] = [
        ...membersAt(blocks[0]?.fixture?.game ?? {}, index, 'B1').map(element => ({ what: `role ${element?.activityRole} (${element?.elementId}), exchanged by`, value: element?.exchange ?? null })),
        ...blocks.map(block => ({ what: `block ${block.blockId}: holders`, value: { ...block.holders } })),
        { what: 'cross-block checks', value: input.crossBlock.map(c => `${c.checkId} ${c.verdict}`) },
        { what: 'a block length, time expiry or window written for a role (RB-7)', value: input.crossBlock.find(c => c.checkId === 'RB-7')?.problems ?? null },
    ]

    const holds = learningGoalSelectionHolds()
    const noPrescription: Fact[] = [
        ...blocks.flatMap(block => restrictionsOf(block.fixture?.game ?? {}, index).map(fact => ({ ...fact, what: `block ${block.blockId}: ${fact.what}` }))),
        ...blocks.map(block => ({ what: `block ${block.blockId}: condition types the game holds`, value: membersAt(block.fixture?.game ?? {}, index, 'V3').map(c => c?.type) })),
        // Stage M3: a further way to score is no restriction (F1 does not read it), and it is listed here so nothing scoring is unseen.
        ...blocks.map(block => ({ what: `block ${block.blockId}: occurrences that also count as the primary event (V27)`, value: membersAt(block.fixture?.game ?? {}, index, 'V27').map(e => ({ elementId: e?.elementId, team: e?.team ?? null, trigger: e?.trigger ?? null })) })),
        ...blocks.map(block => ({ what: `block ${block.blockId}: start placement timing`, value: membersAt(block.fixture?.game ?? {}, index, 'P8').map(p => ({ group: p?.group, timing: p?.timing, resetsAt: p?.resetsAt })) })),
        { what: 'prescription rule (fidelity Q4) findings on the activity', value: allFindings.filter(f => f.question === 4).map(f => f.what) },
        { what: 'sentences carrying a word of the obligation lexicon', value: instructions.filter(i => i.obligationWords.length).map(i => i.text) },
        { what: 'excluded from this goal by its record', value: record.excluded.map(e => ({ knowledgeId: e.knowledgeId, ruledOn: e.ruledOn })) },
        { what: 'held out of every Learning Goal by ruling', value: holds.map(h => ({ knowledgeId: h.knowledgeId, ruledOn: h.ruledOn })) },
        { what: 'library constraints selected', value: [...input.selectedConstraints] },
    ]

    /* The two flags he asked for. */
    const flags: FlagEvidence[] = request.flags.map(flag => {
        const holder = holderOf(index, flag.role)
        const perBlock = blocks.map(block => {
            const game = block.fixture?.game ?? {}
            const objectives = objectivesOf(block, index)
            const placements = membersAt(game, index, 'P8')
            const own = objectives.find(o => o.role === flag.role)
            const target = along(own?.region)
            const relation = own?.region?.realizedGeometry?.position?.along?.relation
            const referent = relation?.of ? membersAt(game, index, 'S2').find(r => r?.elementId === `c:${relation.of.contractId}:${relation.of.itemId}`) : null
            const placement = placements.find(p => p?.group === holder)
            const others = placements.filter(p => p !== placement)
            const rows = transitionsOf(block, index)
            const facts: Fact[] = []
            if (flag.kind === 'ADVANCED_POSITIONING') {
                facts.push({ what: `the ${flag.role} role's target (${own?.regionId ?? 'none'})`, value: target })
                facts.push({ what: 'the element its target is placed beyond, a separate element', value: referent ? { elementId: referent.elementId, noun: referent.noun ?? null, along: along(referent) } : null })
                facts.push({ what: `the ${flag.role} role's start placement`, value: placement ? { region: along(placement, 'region'), timing: placement.timing ?? null, resetsAt: placement.resetsAt ?? null } : null })
                facts.push({ what: 'the transitions at which it is re-established', value: rows.filter(t => t.beginsConditionedEpisode).map(t => t.elementId) })
                facts.push({ what: 'the other role\'s start placement, and whether it lies in this target', value: others.map(p => ({ group: p.group, region: along(p, 'region'), insideTarget: overlaps(along(p, 'region'), target) })) })
                facts.push(...restrictionsOf(game, index))
                // K8 review: whether a score can come from a player already in the target is decided, if at all, by the conditions on the
                // primary event; they are listed with the notes their items record (his M8 safeguard among them), and their wording is
                // still awaiting his approval.
                facts.push({ what: 'conditions on the primary event, with the episode each applies within and the notes the knowledge records on the items each rests on', value: conditionsOf(block) })
            } else {
                facts.push({ what: `the ${flag.role} role's target (${own?.regionId ?? 'none'})`, value: target })
                facts.push({ what: 'start placements lying in it', value: placements.map(p => ({ group: p.group, region: along(p, 'region'), overlaps: overlaps(along(p, 'region'), target) })) })
                facts.push({ what: 'restarts whose location the coach chooses, with the recorded description of it', value: rows.filter(t => t.location && typeof t.location === 'object' && 'coachDecides' in (t.location as object)).map(t => ({ elementId: t.elementId, awardedToRole: t.awardedToRole, location: (t.location as any).coachDecides })) })
                facts.push({ what: 'a change of possession', value: rows.filter(t => t.trigger === 'POSSESSION_CHANGE').map(t => ({ playState: t.playState, beginsConditionedEpisode: t.beginsConditionedEpisode })) })
                facts.push({ what: 'conditions on the primary event, with the episode each applies within', value: membersAt(game, index, 'V3').map(c => ({ elementId: c?.elementId, type: c?.type, scope: c?.scope ?? 'WHOLE_GAME' })) })
                facts.push({ what: 'the primary event', value: readPath(game, 'value.primaryEvent.kind') })
                // Stage M3 (design step L7): his 19 October item 2 makes a controlled regain inside this target count as a score; it is
                // carried by an occurrence that also counts as the primary event (V27), not by a new meaning of entering the target.
                facts.push({ what: 'elements deciding whether gaining possession inside the target scores', value: alsoCountsFor(block, index, flag.role, blockItems[blocks.indexOf(block)]) })
                facts.push({ what: 'elements deciding whether gaining possession inside the target is an entry into it', value: [] })
            }
            return { blockId: block.blockId, facts }
        })
        const settledBy: CitedWords[] = (flag.settledBy ?? []).map(w => ({ ...w }))
        const regains = blocks.map(block => alsoCountsFor(block, index, flag.role, blockItems[blocks.indexOf(block)]).filter(e => e.target && e.everyItemHisRuling))
        const inEveryBlock = blocks.length > 0 && regains.every(list => list.length > 0)
        const status: FlagEvidence['status'] = flag.kind === 'REGAIN_INSIDE_TARGET' && settledBy.length ? (inEveryBlock ? 'SETTLED_BY_RULING' : 'RULED_NOT_IN_GAME') : 'FLAGGED_FOR_REVIEW'
        const unrestricted = blocks.every(block => restrictionsOf(block.fixture?.game ?? {}, index).every(fact => (Array.isArray(fact.value) ? fact.value.length === 0 : fact.value === 0)))
        const placementOnlyAtRestarts = blocks.every(block => membersAt(block.fixture?.game ?? {}, index, 'P8').filter(p => p?.group === holder).every(p => ['INITIAL', 'CONDITIONAL_RESET'].includes(String(p?.timing))))
        const answer =
            flag.kind === 'ADVANCED_POSITIONING'
                ? unrestricted && placementOnlyAtRestarts
                    ? `Yes. Once play starts, nothing in the generated game prevents a player of the ${flag.role} role from moving beyond the element its target begins at and staying there: its start placement applies only at the transitions that (re)start an episode, and the game holds no action restriction, access rule, eligibility condition, consequence or time window. Whether the defensive interaction there is meaningful is not a fact the game holds; it is for his evaluation.`
                    : `The game holds a rule or a standing placement that bears on where a player of the ${flag.role} role may be; see the facts. Whether it settles his concern is for his evaluation.`
                : status === 'SETTLED_BY_RULING'
                  ? `Settled by his ruling, provisionally (${[...new Set(settledBy.map(w => w.citedAs))].join('; ')}): in every block the game holds an occurrence that also counts as the primary event (${readPath(blocks[0]?.fixture?.game ?? {}, 'value.primaryEvent.kind')}) for the team holding the ${flag.role} role, inside the target that team attacks, on ${[...new Set(regains.flat().map(e => String(e.trigger)))].join(', ')}, with its control ("${[...new Set(regains.flat().map(e => String(e.control)))].join('", "')}") and exclusion ("${[...new Set(regains.flat().map(e => String(e.exclusion)))].join('", "')}") recorded in his words; it earns the primary event's own value, and every item it rests on is his ruling. Entering the target keeps its meaning: no element makes gaining possession inside it an entry into it. Whether this creates the intended consequences is for his evaluation.`
                  : status === 'RULED_NOT_IN_GAME'
                    ? `Ruled and not in the game: the record carries his ruling settling this case, and not every block holds an occurrence that also counts as the primary event for the team holding the ${flag.role} role inside its target, resting only on his ruling. See the facts.`
                    : regains.some(list => list.length)
                      ? `The game holds an occurrence that also counts as the primary event inside this target for the team holding the ${flag.role} role, and the record carries no ruling settling the case. Flagged for his review.`
                      : 'Not settled by the game: no element decides whether gaining possession inside this target is an entry into it. Flagged for his review, as he asked; no rule is invented.'
        const evidence: FlagEvidence = { id: flag.id, kind: flag.kind, role: flag.role, his: flag.words.map(w => ({ ...w })), status, settledBy, answer, blocks: perBlock }
        if (flag.kind === 'ADVANCED_POSITIONING') {
            // Read-only: which knowledge the engine holds that could carry a spatial eligibility relationship. Nothing is selected or built.
            const entries = testLibraryRegistry.constraints() as any[]
            const contracted = new Set(contractCoverage(entries.map(e => ({ id: String(e.id), role: 'constraint' }))).contracted)
            const authorized = new Set(record.authorizedConstraints ?? [])
            const excluded = new Set(record.excluded.map(e => e.knowledgeId))
            const held = new Set(holds.map(h => h.knowledgeId))
            evidence.knowledge = {
                libraryEntries: entries
                    .filter(e => String(e.primaryConstraintType ?? '').toLowerCase() === 'spatial' || String(e.constraintArchetype ?? '').toLowerCase().includes('spatial'))
                    .map(e => ({
                        what: `${e.id} — ${e.title}`,
                        value: { description: e.description ?? null, primaryConstraintType: e.primaryConstraintType ?? null, constraintArchetype: e.constraintArchetype ?? null, constraintRole: e.constraintRole ?? null, contracted: contracted.has(String(e.id)), authorizedForThisGoal: authorized.has(String(e.id)), excludedFromThisGoal: excluded.has(String(e.id)), held: held.has(String(e.id)) },
                    })),
                registerRows: ELIGIBILITY_ROWS.filter(id => index.rows.has(id)).map(id => ({ what: `${id} ${index.rows.get(id)!.path}`, value: { valueType: (index.rows.get(id) as any).valueType ?? null, elementsInThisGame: blocks.map(block => ({ blockId: block.blockId, count: asList(readPath(block.fixture?.game ?? {}, genericOf(String(index.rows.get(id)!.path)))).length })) } })),
                corpusItems: corpusEligibilityItems(),
            }
        }
        return evidence
    })

    /**
     * **What an item about one role shows of the role's scoring** — stage M3, 17 October 2026 (design step L7). His reply filed 19
     * October 2026, item 6: *"please proceed with the review-page activity, provided its actual scoring eligibility matches the
     * approved distinction between an active build-out and subsequent possession regains."* So the item of each role shows its credit
     * bound and, where bounded, what begins, ends and keeps it beside the episode check's own verdict on the two credit clauses (the
     * authority), and the occurrences that also count as the primary event for its team. Facts only; no verdict is made here.
     */
    const roleFacts = (block: EvidenceBlock, role: string): Fact[] => {
        const items = blockItems[blocks.indexOf(block)]
        const credit = creditOf(block, index, role, items)
        const check = block.gateChecks.find(c => c.checkId === 'GA-EPISODE-REACHABLE')
        const clause = (name: string) => check?.clauses.find(c => c.clause === name) ?? null
        const facts: Fact[] = [{ what: `the ${role} role's scoring credit (B8), and the items it rests on`, value: credit ? { element: credit.path, creditedWithin: credit.creditedWithin, support: credit.support } : null }]
        if (credit?.bounded) {
            facts.push(
                { what: `the transitions that begin the ${role} role's credit (its episode begins)`, value: credit.begins },
                { what: `the transitions that end it (each begins another episode)`, value: credit.ends },
                { what: `the restarts that keep it (they begin no episode and are awarded to the team holding the ${role} role)`, value: credit.keeps },
                { what: 'transitions that neither end nor keep it', value: credit.notEnded },
                {
                    what: 'the authority: the episode check (GA-EPISODE-REACHABLE) on this block, and its two credit clauses',
                    value: { verdict: check?.verdict ?? 'NOT_RUN', begins: clause(CREDIT_BEGINS_CLAUSE), ends: clause(CREDIT_ENDS_CLAUSE) },
                },
            )
        }
        facts.push({ what: `occurrences that also count as the primary event for the team holding the ${role} role (V27)`, value: alsoCountsFor(block, index, role, items) })
        return facts
    }

    /**
     * **The limitations he asked to keep visible** — stage M3, 17 October 2026 (design step L7). His reply filed 19 October 2026, item
     * 5, each limitation in his words from the record with what the game or the build holds for it. Nothing here implements or decides
     * any of them: his item 5 asks for them *"to retain for review, not additional implementation now"*.
     */
    const limitations: LimitationEvidence[] = (request.limitations ?? []).map(limitation => {
        const facts: Fact[] = []
        if (limitation.kind === 'SPECIALIZED_PERFORMERS_BEYOND_ROLE' && limitation.role) {
            const role = limitation.role
            const row = [...index.specializedRoleRows.entries()].find(([, name]) => name === role)?.[0] ?? null
            const leaf = row ? String(index.rows.get(row)?.path ?? '').split('[].').pop() ?? role : role
            const available = Number(input.session.roles?.[role] ?? 0)
            facts.push({ what: `${role}s available in the session`, value: available })
            for (const block of blocks) {
                const teams = teamsOf(block, index)
                const held = teams.reduce((n, team) => n + (team.counts[leaf] ?? 0), 0)
                facts.push({ what: `block ${block.blockId}: ${role}s each team's count holds`, value: teams.map(team => ({ team: team.handle, role: team.role, count: team.counts[leaf] ?? 0 })) })
                facts.push({ what: `block ${block.blockId}: ${role}s the session has beyond the teams' counts (counted among the other players)`, value: Math.max(0, available - held) })
            }
            facts.push({ what: `at an exchange of roles, ${role}s that move`, value: blocks.slice(0, 1).flatMap(block => membersAt(block.fixture?.game ?? {}, index, 'B4').filter(r => r?.performerRow === row).map(r => ({ elementId: r.elementId, count: r.count, toRole: r.toRole }))) })
        } else if (limitation.kind === 'FLAGGED_CASE') {
            const flag = flags.find(f => f.id === limitation.flag)
            facts.push({ what: `flag ${limitation.flag}`, value: flag ? { kind: flag.kind, status: flag.status, answer: flag.answer } : null })
        } else if (limitation.kind === 'CHECKED_PATHWAY_ONLY') {
            facts.push({ what: 'library constraints selected', value: [...input.selectedConstraints] })
            facts.push({ what: 'the live generation route', value: input.selectedConstraints.length === 0 ? LIVE_ROUTE_REFUSES : 'not measured here' })
        }
        return { id: limitation.id, kind: limitation.kind, his: limitation.words.map(w => ({ ...w })), facts }
    })

    /* The nine items. */
    const itemPaths = (item: ReviewRequest['items'][number], block: EvidenceBlock): string[] => {
        const game = block.fixture?.game ?? {}
        const wanted = new Set(item.rows)
        const objectives = objectivesOf(block, index)
        const holder = item.role ? holderOf(index, item.role) : null
        const ownRegions = new Set(objectives.filter(o => o.role === item.role).map(o => o.regionId))
        const belongs = (path: string): boolean => {
            if (!item.role) return true
            const first = segmentsOf(path).find(s => s.id)
            if (!first?.id) return true
            const row = rowOf(index, path)
            if (row && (index.ownerRow.get(row) ?? row) === (index.targetOf?.objectivesRow ?? 'J1')) return objectives.some(o => o.elementId === first.id && o.role === item.role)
            if (row && (index.ownerRow.get(row) ?? row) === 'S2') return ownRegions.has(first.id)
            const element = readPath(game, path.slice(0, path.indexOf(']') + 1)) as any
            // Stage M3: a role element belongs to the item about that role, by the role it names (its selector attribute, SD-92); it
            // names no holder, so the test below would give every role's element to every role's item.
            const spec = index.roleBlocks
            if (spec && row && (index.ownerRow.get(row) ?? row) === spec.rolesRow) return element?.[spec.roleAttribute] === item.role
            const mentions = JSON.stringify(element ?? null)
            const otherHolders = roleHolderNames(index).filter(name => name !== holder)
            return !otherHolders.some(name => mentions.includes(`"${name}"`)) || (!!holder && mentions.includes(`"${holder}"`))
        }
        return [...paths.keys()].filter(path => paths.get(path)!.has(block.blockId)).filter(path => {
            const row = rowAt(path)
            return row !== null && (wanted.has(row) || wanted.has(index.ownerRow.get(row) ?? '')) && belongs(path)
        })
    }
    const items: ItemEvidence[] = request.items.map(item => {
        const perBlock = blocks.map(block => ({ blockId: block.blockId, elements: item.kind === 'GAME' ? itemPaths(item, block).map(path => ({ path, row: rowAt(path) ?? '', value: readPath(block.fixture?.game ?? {}, path.replace(/#realized$/, '')) })) : [] }))
        const carried = new Set(perBlock.flatMap(b => b.elements.map(e => e.path)))
        const sentences = item.kind === 'INSTRUCTIONS' ? instructions.map(i => i.index) : item.kind === 'GAME' ? instructions.filter(i => composed.instructions[i.index].from.some(path => carried.has(path) || (genericOf(path) !== path && [...carried].some(c => genericOf(c) === genericOf(path))))).map(i => i.index) : []
        const checks = item.checks.flatMap((checkId): ItemEvidence['checks'] =>
            checkId.startsWith('RB-')
                ? input.crossBlock.filter(c => c.checkId === checkId).map(c => ({ checkId, blockId: null, verdict: c.verdict }))
                : blocks.map(block => ({ checkId, blockId: block.blockId, verdict: String(block.gateChecks.find(c => c.checkId === checkId)?.verdict ?? 'NOT_RUN') })),
        )
        const awaiting = item.kind === 'INSTRUCTIONS' ? [...withheld] : withheld.filter(path => carried.has(path))
        const resolved = item.kind === 'PROVENANCE' ? elements.length > 0 : item.kind === 'INSTRUCTIONS' ? instructions.length > 0 : carried.size > 0 || sentences.length > 0
        const facts = blocks.map(block => ({ blockId: block.blockId, facts: item.role ? roleFacts(block, item.role) : [] }))
        return { id: item.id, words: item.words, citedAs: request.citedAs, kind: item.kind, role: item.role, blocks: perBlock, checks, sentences, awaiting: [...new Set(awaiting)], sections: [...item.sections], resolved, facts }
    })

    /* Rationale: his reasons, and the approved statements they cite, read whole. */
    const contextId = record.contextId
    const properties = rpcLibrary.properties(contextId)
    const rationale = request.rationale.map(entry => ({
        feature: entry.feature,
        featureBasis: 'OURS' as const,
        words: entry.words.map(w => ({ ...w })),
        statements: entry.statements.map(id => {
            const row: any = properties.find(p => String(p['property_id']) === id)
            return { id, category: row ? String(row['property_category']) : null, text: row ? String(row['property_text']) : null, provenance: row ? String(row['provenance']) : null }
        }),
    }))

    const constraintsNone = input.selectedConstraints.length === 0
    return {
        status: 'EVIDENCE_FOR_REVIEW_NOT_SERVED',
        about: PLAIN_ABOUT,
        measured: {
            blocks: blocks.map(block => ({
                blockId: block.blockId,
                inputDigest: block.fixture?.provenance?.inputDigest ?? null,
                // The register's version note opens with its number; the note itself is the register's, not repeated here.
                registerVersion: block.fixture?.provenance?.registerVersion ? String(block.fixture.provenance.registerVersion).split(',')[0] : null,
                engineVersion: block.fixture?.provenance?.engineVersion ? String(block.fixture.provenance.engineVersion).split(',')[0] : null,
            })),
        },
        pathway: {
            route: 'CHECKED_REVIEW',
            facts: [
                { what: 'built through', value: 'the checked review pathway (the one chain every review build runs: selection, derivation, Gate A, realization, assembly, post-realization gates, context scoring, rendering, fidelity)' },
                { what: 'library constraints selected', value: [...input.selectedConstraints] },
                {
                    what: 'the live generation route',
                    value: constraintsNone ? LIVE_ROUTE_REFUSES : 'not measured here',
                },
            ],
            his: { ...request.pathway },
        },
        acceptance: [
            { what: 'outcome of the build', value: input.outcome },
            { what: 'blocks built through validation', value: blocks.map(b => b.blockId) },
            { what: 'every structural check passes (Gate A rerun per block, post-realization owed invariants, cross-block checks, composition)', value: structure.summary.everyCheckPasses },
            { what: 'fidelity violations in the text that is said', value: inSaidText.map(f => `fidelity Q${f.question}: ${f.what}`) },
            { what: 'fidelity violations about fields awaiting approved wording', value: violations.length - inSaidText.length },
            { what: 'fields awaiting approved wording', value: withheld.length },
            { what: 'sentences', value: { total: instructions.length, approved: instructions.filter(i => i.wording === 'APPROVED').length, draft: instructions.filter(i => i.wording === 'DRAFT').length } },
        ],
        layers: request.layers.entries.map(entry => ({ ...entry })),
        items,
        structure,
        sections: { allocation, specializedRoles, pressure, scoring, restarts: transitions, roleExchange, noPrescription, instructions },
        flags,
        limitations,
        evaluation: {
            his: { words: request.evaluation.words, citedAs: request.evaluation.citedAs },
            points: request.evaluation.points.map(point => ({ ...point, sections: [...point.sections] })),
            judgement: 'Each point is answered by the sections it names, with facts the generated game holds. Whether the activity creates those opportunities in play is his judgement as a coach; nothing here claims it.',
        },
        requests: request.requests.map(r => ({ ...r, sections: [...r.sections] })),
        provenance: {
            elements,
            untraced,
            // The record's three lists are on the same answer (`account.authorizationLists`); named here, not copied a second time.
            lists: input.lists
                ? {
                      at: 'account.authorizationLists',
                      authorizedByExistingKnowledge: input.lists.authorizedByExistingKnowledge.length,
                      provisionalChoices: input.lists.provisionalChoices.length,
                      gaps: input.lists.gaps.length,
                      // Stage M4: still needed unless his words settle it (`settledBy`), and always while an entry waits on it.
                      gapsStillNeeded: input.lists.gaps.filter(g => g.neededBy.length || !(g.settledBy ?? []).length).map(g => g.id),
                      gapsSettled: input.lists.gaps.filter(g => !g.neededBy.length && (g.settledBy ?? []).length).map(g => g.id),
                  }
                : null,
            openForReview: [
                { what: 'fields awaiting his approved wording', value: [...new Set(withheld)] },
                ...flags.map(flag => ({ what: `flag ${flag.id} (${flag.kind})`, value: flag.status })),
                { what: 'limitations kept visible, as he asked', value: limitations.map(l => l.id) },
                { what: 'record gaps any entry still waits on', value: (input.lists?.gaps ?? []).filter(g => g.neededBy.length).map(g => g.id) },
            ],
        },
        rationale: { features: rationale, his: { words: [...request.judgement.words], citedAs: request.judgement.citedAs }, judgement: 'Every reason above is his, quoted from the record, or an approved statement of the context, read from the workbook. Whether the game produces the learning environment those reasons describe is his judgement as a coach.' },
    }
}
