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
 * **An empty authorized set is a knowledge gap, not a licence.** `zeroConstraintRuling` stays null until he
 * answers whether a goal may be built with no library constraint (decision D1); until then selection reports
 * `NO_AUTHORIZED_CONSTRAINTS` and builds nothing. The mechanism that commits zero constraints exists and is
 * reachable only through a record whose ruling is non-null and cited (see `generateSelection`).
 *
 * **The gate refuses at load**, because a record that names a constraint the library does not hold, or that both
 * authorizes and excludes one, or that says something without saying who ruled it, would silently decide what a
 * coach is served. Sport-neutral: every name in it is data.
 */
import { knowledgeKey } from '../derivation/knowledge-key'
import type { LearningDesignHold } from './learning-design-holds'
import { learningGoalSelectionHolds } from './learning-design-holds'
import record from './library/learning-goal-authorizations.json'
import { testLibraryRegistry } from './library/registry'

export const MANIPULATION_STATUSES = ['AUTHORIZED_VIA_GAME_FORM_OR_SESSION', 'AUTHORIZED_BY_RULING', 'MISSING_KNOWLEDGE', 'NOT_SELECTED_FOR_FIRST_DEMO'] as const
export type ManipulationStatus = (typeof MANIPULATION_STATUSES)[number]

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
    status: ManipulationStatus
    /** Why the status is what it is — his ruling quoted, or the contract items that carry it. */
    statusBasis: string
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

export interface ZeroConstraintRuling {
    ruledOn: string
    by: string
    /** His words, verbatim. */
    ruling: string
}

export interface LearningGoalAuthorization {
    learningGoalId: string
    contextId: string
    gameProblemId: string
    ruledOn: string
    by: string
    /** His ruling, verbatim, one paragraph per entry. */
    ruling: string[]
    authorizedConstraints: string[]
    authorizedConstraintsFinding: string
    /** Null until he rules that this goal may be built with no library constraint (decision D1). */
    zeroConstraintRuling: ZeroConstraintRuling | null
    zeroConstraintRulingPending?: string
    excluded: AuthorizationExclusion[]
    manipulations: ManipulationRecord[]
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
    holds: LearningDesignHold[] = learningGoalSelectionHolds()
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
        const ruling = entry.zeroConstraintRuling
        if (ruling !== null && ruling !== undefined && (!filled(ruling.ruledOn) || !filled(ruling.by) || !filled(ruling.ruling))) {
            errors.push(`${goal}: a zero-constraint ruling must cite who ruled, when, and his words`)
        }
        for (const [i, manipulation] of (entry.manipulations ?? []).entries()) {
            const which = `${goal}: manipulation ${i + 1} (${manipulation.phrase || 'no phrase'})`
            if (!filled(manipulation.phrase) || !filled(manipulation.phraseFrom)) errors.push(`${which} quotes no phrase or names no source for it`)
            if (!filled(manipulation.source)) errors.push(`${which} cites no source`)
            if (!filled(manipulation.statusBasis)) errors.push(`${which} gives no basis for its status`)
            if (!(MANIPULATION_STATUSES as readonly string[]).includes(manipulation.status)) errors.push(`${which} has the unknown status ${manipulation.status}`)
            if (!Array.isArray(manipulation.registerRows)) errors.push(`${which} lists no register rows (an empty list says it touches none)`)
        }
    }
    return errors
}

const RECORDS = record.authorizations as LearningGoalAuthorization[]
{
    const errors = validateLearningGoalAuthorizations(RECORDS)
    if (errors.length) throw new Error(`learning-goal-authorizations.json failed its integrity gate: ${errors.join(' | ')}`)
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
