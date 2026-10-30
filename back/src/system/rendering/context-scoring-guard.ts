/**
 * Does the realized game carry its context's approved scoring? A guard that only refuses.
 *
 * Christian, 14 October 2026: *"the Primary Scoring Event and qualifying condition approved for each
 * Representative Performance Context should govern the generated activity. This is particularly important
 * because scoring defines what constitutes success within the environment."*
 *
 * **Why a guard after realization, when the context's contract already reached derivation.** A contract in
 * the derivation input is not proof its scoring reached the game: an authored field can be dropped by any
 * projection between the two, and in this project that loss has happened silently more than once. A
 * projection is only proved by a consumer. So the concrete game itself is read:
 *
 *   - its primary event (register V1, `value.primaryEvent.kind`) must be one the context approves — the
 *     approved set comes from the context library's scoring-event relationships, passed in by the caller;
 *   - every condition the context's contract CONSTITUTES (register V3, an `EXISTS` item, required, on the
 *     selector `type=<condition type>`) must be present in `value.primaryEvent.conditions[]` with that type
 *     (register V4, `conditions[].type`).
 *
 * The shape was read from a served fixture on 14 October: the concrete game holds `value.primaryEvent` as
 * `{ value, kind }`, and holds `conditions` only where a contract constitutes one — no served game does yet,
 * so the condition half is read at the register's path and tested on constructed games.
 *
 * It names what is missing and fills nothing in. It never scores or ranks anything: it is not a selection
 * input. The event kinds and condition types are data; this file names none of them.
 */
import { CheckResult, EPISODE_SCOPES } from '../derivation/gates'
import { RELATIONSHIP_CONFIRMED } from '../derivation/realization-deferral'
import { RegisterIndex } from '../derivation/register'
import { CONDITION_ROW, conditionScopeNotEvaluable, EVALUABLE_CONDITION_SCOPE } from '../derivation/resolved-game'
import { LoadedContract } from '../derivation/types'
import { eventKindOf, registerIndex, roleElementsOf } from './game-reading'

/**
 * The selector prefix a constituting item names its condition type by (`type=<condition type>`), on the conditions row (`CONDITION_ROW`,
 * named once in `resolved-game.ts`), so the requirement account reads conditions exactly as this guard does (29 October 2026).
 */
export const CONDITION_TYPE_PREFIX = 'type='

/** The Gate A check that decides whether an episode a condition is authored for can begin in the game (gates.ts). */
export const EPISODE_REACHABLE_CHECK = 'GA-EPISODE-REACHABLE'

/**
 * **An episode-scoped condition is confirmed to govern the game where the game is shown to begin that episode** — 15 October 2026
 * (stage K7). His reply received 15 October 2026 (16 October, 9.3): *"Build-out condition applies only to build-out episodes:
 * Approved."* (SD-36, ruling C52). Until this the guard below confirmed only whole-game conditions, so every game carrying his
 * approved scope was refused at validation however completely it carried it: the K6 review measured A01 stopping there in both
 * blocks with no decision of his behind the stop, and named what would move it — the guard confirming an episode-scoped
 * condition against the episode the game carries.
 *
 * Confirmed only where ALL of this holds, read from the Gate A check rerun on the CONCRETE game (post-realization, so every value
 * it reads is the realized one): the scope is one that check decides (`EPISODE_SCOPES`, gates.ts); the check PASSES as a whole —
 * a typed begin condition (C58) is met by at least one transition (non-vacuously: it ranged over at least one condition), every
 * such transition is awarded to one team (his D7), and every re-established start placement names an episode a transition
 * begins. A deferred, withheld, failed or vacuous verdict confirms nothing, and with no check given (any other caller) the guard
 * reads exactly as before. Nothing here applies the condition to every score: `conditionScopeNotEvaluable` still says so to every
 * reader that would.
 */
export function episodeConfirmed(scope: unknown, check: CheckResult | undefined): boolean {
    if (!check || check.checkId !== EPISODE_REACHABLE_CHECK || typeof scope !== 'string' || !EPISODE_SCOPES.includes(scope)) return false
    if (check.verdict !== 'PASS' || !check.clauses.length || !check.clauses.every(clause => clause.verdict === 'PASS')) return false
    const reach = check.clauses[0]
    return reach.basis !== 'NO_APPLICABLE_INSTANCES' && Number(reach.instances) > 0
}

/**
 * **Another occurrence counted as the context's primary event stands only on his explicit ruling** — 17 October 2026 (stage M2,
 * register version 14, row V27 `value.primaryEvent.alsoCounts[]`). The context's approved scoring governs (his 14 October words
 * above), and an occurrence that also counts as its primary event is a further way to score that the context's own scoring events
 * may not approve: the design verifier read that RPC-001 approves the zone entry but not the regain (approved only for other
 * contexts). It is admitted beside the context's event only on his explicit ruling, under his answer 9 of 15 October 2026:
 * *"Specific knowledge governs where it explicitly defines or specializes a condition."* The ruling is his reply filed 19 October
 * 2026, item 2: *"For the previously flagged
 * corner case, I favor allowing a controlled regain inside that area to count as a score, provided the pressing team genuinely
 * establishes possession."* So every item that establishes such an element or fills one of its fields must be an OWNER_RULING
 * item; any other basis is named here and refuses the game. A game holding such an element with no support given cannot be
 * confirmed, and says so. Names no kind, team or sport term: the element is read at the register's path.
 */
export interface AlsoCountsSupport {
    elementId: string
    /** Every item that establishes the element or entails one of its fields, with its basis. */
    items: { contractId: string; itemId: string; basis: string }[]
}

/**
 * **A role's own scoring event stands only on his explicit ruling** — stage A, 22 October 2026 (register version 16, row B9), on the
 * pattern of `alsoCountsFindings` below. Christian, reply filed 25 October 2026, item 2: *"Please implement this as a general role-specific
 * scoring capability, preserving structural validation and knowledge authorization."* The context's approved scoring governs (his 14
 * October words above), and a role scoring by an event of its own is a way to score the context's own scoring events may not approve
 * (his item 3 approves such an event for one role of one context, and is not yet recorded among that context's events). So every item
 * that writes a role's own event must be an OWNER_RULING item; any other basis is named and refuses the
 * game, and a game holding such an event with no support given cannot be confirmed, and says so. Whether the event departs from a
 * permitted set is GA-ROLE-EVENTS clause 6's; this guard only refuses. Read through `eventKindOf`; names no kind, role or sport term.
 */
export interface RoleEventSupport {
    /** The role element (its elementId) and the role it is. */
    elementId: string
    role: string
    /**
     * Every item that writes the role's own event, with its basis and (stage A review fix) the relationship it cites, where it cites one, and
     * (stage A re-review fix, 23 October 2026) the context its contribution realizes, where it realizes one (a provisional realization's
     * `realizes`; null on canonical knowledge).
     */
    items: { contractId: string; itemId: string; basis: string; authorizedBy?: string | null; realizes?: string | null }[]
}

/** What the guard reads of a context relationship (the authorization records hold the whole entry; `contextRelationships`). */
export interface ScoringAuthority {
    id: string
    contextId: string
    status: string
    scoringEvent?: string
    role?: string
    /** The register rows the relationship authorizes a realization to author (stage A re-review fix: the event row must be among them). */
    rows?: string[]
}

/**
 * **An event the context does not approve stands only on a confirmed scoring relationship of that context, for that role and that event**
 * (stage A review fix, 22 October 2026). Until this fix the context's approved events were read only into the message, so a role's own
 * event outside them rested entirely on GA-ROLE-EVENTS clause 6 finding a REQUIRED list on the event row in some contract. His 14 October
 * words (above) make the context's approved scoring govern; his 15 October answer 9 lets specific knowledge depart only "through an
 * authorized relationship". So such an event is confirmed only where an item writing it cites (`authorizedBy`) a CONFIRMED relationship of
 * this context naming exactly this event and this role (`relationships`, the records' context relationships of every kind); otherwise it
 * is named here and refuses the game. An event the context approves needs none (his OWNER_RULING basis is still required, above).
 *
 * **What a citation must also be, as the role yields require it** (stage A re-review fix, 23 October 2026): the relationship authorizes the
 * event row (`roleScoring.eventRow` among its `rows`), and the citing item's own contribution realizes this context (`realizes`) — the two
 * conditions `applyRoleYields` (realization-deferral.ts `authorizingRelationship`) already holds a citation to. Until this fix the guard
 * checked status, context, event and role only: measured in the re-review on a full TEST-ONLY build, a confirmed scoring relationship
 * authorizing only the objective-reference row let an event-row item stand here, the build stopping only at communication.
 */
export function roleEventFindings(contextId: string, game: any, approvedEvents: string[], support: RoleEventSupport[] | undefined, index?: RegisterIndex, relationships: ScoringAuthority[] = []): string[] {
    const findings: string[] = []
    const eventRow = (index ?? registerIndex()).roleScoring?.eventRow
    for (const { elementId: id, role } of roleElementsOf(game, index)) {
        const own = eventKindOf(game, role, index)
        if (!own.byRole) continue
        const found = (support ?? []).find(entry => entry.elementId === id)
        if (!found || !found.items.length) {
            findings.push(`the role ${role} (${id}) scores by its own event "${String(own.kind)}", and what writes it was not given, so it cannot be confirmed to stand on his ruling`)
            continue
        }
        for (const item of found.items) {
            if (item.basis === 'OWNER_RULING') continue
            findings.push(
                `the role ${role} (${id}) scores by its own event "${String(own.kind)}" on ${item.contractId}::${item.itemId}, whose basis is ${item.basis}: the Representative Performance Context ${contextId} approves ${approvedEvents.join(', ') || 'nothing'}, so a role's own way to score stands only on his explicit ruling (OWNER_RULING)`,
            )
        }
        if (approvedEvents.includes(String(own.kind))) continue
        const authorized = found.items.some(item => {
            const relationship = relationships.find(entry => entry.id === item.authorizedBy)
            return (
                !!relationship &&
                relationship.status === RELATIONSHIP_CONFIRMED &&
                relationship.contextId === contextId &&
                relationship.scoringEvent === String(own.kind) &&
                relationship.role === role &&
                // Re-review fix: the relationship authorizes the event row, and the citing item's contribution realizes this context.
                typeof eventRow === 'string' &&
                Array.isArray(relationship.rows) &&
                relationship.rows.includes(eventRow) &&
                item.realizes === contextId
            )
        })
        if (!authorized) {
            findings.push(
                `the role ${role} (${id}) scores by its own event "${String(own.kind)}", which the Representative Performance Context ${contextId} does not approve (it approves: ${approvedEvents.join(', ') || 'nothing'}), and no item writing it cites a confirmed scoring relationship of ${contextId} authorizing "${String(own.kind)}" for ${role} on its row (${eventRow ?? 'no event row registered'}) from a contribution realizing ${contextId}`,
            )
        }
    }
    return findings
}

export function alsoCountsFindings(contextId: string, game: any, approvedEvents: string[], support: AlsoCountsSupport[] | undefined): string[] {
    const elements: any[] = Array.isArray(game?.value?.primaryEvent?.alsoCounts) ? game.value.primaryEvent.alsoCounts : []
    const findings: string[] = []
    for (const element of elements) {
        const id = String(element?.elementId)
        const found = (support ?? []).find(entry => entry.elementId === id)
        if (!found || !found.items.length) {
            findings.push(`the occurrence ${id} also counts as the primary event, and what establishes it was not given, so it cannot be confirmed to stand on his ruling`)
            continue
        }
        for (const item of found.items) {
            if (item.basis === 'OWNER_RULING') continue
            findings.push(
                `the occurrence ${id} also counts as the primary event on ${item.contractId}::${item.itemId}, whose basis is ${item.basis}: the Representative Performance Context ${contextId} approves ${approvedEvents.join(', ') || 'nothing'}, so a further way to score stands only on his explicit ruling (OWNER_RULING)`,
            )
        }
    }
    return findings
}

/** The condition types the context's contract constitutes, each with the item that constitutes it. */
export function constitutedConditionTypes(contract: LoadedContract): { type: string; itemId: string }[] {
    const prefix = CONDITION_TYPE_PREFIX
    return (contract.items ?? [])
        .filter(item => String(item.row) === CONDITION_ROW && String(item.requirement) === 'EXISTS' && String(item.strictness) === 'REQUIRED')
        .filter(item => String(item.selector ?? '').startsWith(prefix))
        .map(item => ({ type: String(item.selector).slice(prefix.length).trim(), itemId: item.itemId }))
}

/**
 * **One condition item, read exactly as the guard reads it** — 29 October 2026, moved out of `contextScoringFindings` unchanged (the
 * requirement account's R-3; his reply filed 3 November 2026, section 2: *"accounting for each component of a scoring condition rather than
 * simply confirming that the condition exists"*). `why` is EXACTLY the finding the guard pushes for this item today, in the same branch
 * order — the type absent from the primary event, then a scope that did not arrive as authored, then a scope narrower than the whole game
 * that the concrete game is not shown to begin — or null where the guard pushes none; `governs` is `why === null`. The rest is what the
 * reading saw, for the requirement account's evidence: whether some condition of the type is present (the guard's own test), whether the
 * item's OWN element is on the event (which the guard does not require: a reader may, report-only), the authored and carried scopes, and
 * whether the episode is confirmed.
 *
 * An item whose selector is not `type=<condition type>` (an `IN`, a compound) has `type` null, never governs, and a `why` the guard never
 * pushes: `contextScoringFindings` reads only the items `constitutedConditionTypes` returns, every one of which has a type.
 */
export interface ConditionReading {
    contractId: string
    itemId: string
    type: string | null
    /** Some condition of that type is on the realized primary event (the guard's test). */
    present: boolean
    /** The item's own element, `c:<contract>:<item>`, is on the realized primary event. */
    elementFound: boolean
    authoredScope: unknown
    /** What arrived on the element; the evaluable scope where the element carries no scope key, as the guard reads it. */
    carriedScope: unknown
    scopeMatches: boolean
    notEvaluable: string | null
    episodeConfirmed: boolean
    governs: boolean
    why: string | null
}

export function conditionReadingOf(
    contextId: string,
    contract: LoadedContract,
    itemId: string,
    game: any,
    episodeCheck?: CheckResult,
    /** The type `constitutedConditionTypes` read for this item, where the caller has it (the guard): exactly the old loop's (round 2, R1 NIT 6). */
    constitutedType?: string,
): ConditionReading {
    const item = (contract.items ?? []).find(entry => entry.itemId === itemId)
    const selector = String(item?.selector ?? '')
    const type = constitutedType ?? (selector.startsWith(CONDITION_TYPE_PREFIX) ? selector.slice(CONDITION_TYPE_PREFIX.length).trim() : null)
    const event = game?.value?.primaryEvent
    const conditions: any[] = Array.isArray(event?.conditions) ? event.conditions : []
    const present = type !== null && conditions.some((condition: any) => String(condition?.type) === type)
    /**
     * **Present is not yet governing, where the condition was authored for less than every score** — 15 October
     * 2026. The constituting item's own scope must have arrived on the condition (a projection is proved by its
     * consumer), and a scope narrower than the whole game cannot be confirmed by a check that reads only whether
     * the condition is there: it would be passing a condition on every score that was authored for some. His
     * SD-36 and 16 October 9.3 ("Build-out condition applies only to build-out episodes: Approved.").
     */
    const authored = item?.scope
    const element = conditions.find((condition: any) => String(condition?.elementId) === `c:${contract.contractId}:${itemId}`)
    const carried = element && Object.prototype.hasOwnProperty.call(element, 'scope') ? element.scope : EVALUABLE_CONDITION_SCOPE
    const notEvaluable = conditionScopeNotEvaluable(element)
    const confirmed = episodeConfirmed(carried, episodeCheck)
    let why: string | null = null
    if (type === null) {
        why = `${contract.contractId}::${itemId} does not name a condition type by its selector, so the context-scoring guard does not read it`
    } else if (!present) {
        why = `the ${type} condition ${contextId} constitutes (${itemId}) is not in the realized game's primary event`
    } else if (element && authored !== undefined && String(carried) !== String(authored)) {
        why = `the ${type} condition ${contextId} constitutes (${itemId}) is authored for the ${String(authored)} scope and reached the realized game as ${JSON.stringify(carried)}`
    } else if (notEvaluable && !(authored !== undefined && String(carried) === String(authored) && confirmed)) {
        // Carried with its authored scope (checked just above), and the concrete game begins that episode (stage K7): confirmed. Otherwise:
        why = `the ${type} condition ${contextId} constitutes (${itemId}) cannot be confirmed to govern this game: ${notEvaluable}`
    }
    return {
        contractId: contract.contractId,
        itemId,
        type,
        present,
        elementFound: !!element,
        authoredScope: authored ?? null,
        carriedScope: carried,
        scopeMatches: authored === undefined || String(carried) === String(authored),
        notEvaluable,
        episodeConfirmed: confirmed,
        governs: why === null,
        why,
    }
}

/**
 * **The guard's reading of the realized primary event's kind, and of what else scores** — 29 October 2026, moved out of
 * `contextScoringFindings` unchanged (R-3). `findings` is EXACTLY what the guard pushed first, in its order: each role's own event
 * (`roleEventFindings`), each occurrence also counted (`alsoCountsFindings`), then the event kind where the context does not approve it.
 * `roleEvents` lists each role scoring by an event of its own, for the requirement account's evidence (the guard reads them above).
 */
export interface EventKindReading {
    kind: unknown
    approvedEvents: string[]
    approved: boolean
    roleEvents: { elementId: string; role: string; kind: unknown }[]
    /** Each occurrence the game also counts as its primary event (register V27), by element id. */
    alsoCounts: string[]
    findings: string[]
}

export function eventKindReadingOf(
    contextId: string,
    game: any,
    approvedEvents: string[],
    alsoCountsSupport?: AlsoCountsSupport[],
    roleEventSupport?: RoleEventSupport[],
    index?: RegisterIndex,
    relationships?: ScoringAuthority[],
): EventKindReading {
    const findings: string[] = [...roleEventFindings(contextId, game, approvedEvents, roleEventSupport, index, relationships), ...alsoCountsFindings(contextId, game, approvedEvents, alsoCountsSupport)]
    // Stage A: the game's primary event read through the one kind reader (a role's own event is the per-role clause's, above).
    const kind = eventKindOf(game, null, index).kind
    const approved = approvedEvents.includes(String(kind))
    if (!approved) {
        findings.push(
            `the realized primary event is ${kind === undefined ? 'absent' : `"${kind}"`}, which the Representative Performance Context ${contextId} does not approve (it approves: ${approvedEvents.join(', ') || 'nothing'})`,
        )
    }
    const roleEvents = roleElementsOf(game, index)
        .map(({ elementId, role }) => ({ elementId, role, own: eventKindOf(game, role, index) }))
        .filter(entry => entry.own.byRole)
        .map(entry => ({ elementId: entry.elementId, role: entry.role, kind: entry.own.kind }))
    const alsoCounts = (Array.isArray(game?.value?.primaryEvent?.alsoCounts) ? game.value.primaryEvent.alsoCounts : []).map((element: any) => String(element?.elementId))
    return { kind, approvedEvents: [...approvedEvents], approved, roleEvents, alsoCounts, findings }
}

/**
 * What the realized game lacks of its context's approved scoring, as reasons for the technical account. Empty
 * where it carries all of it.
 *
 * 29 October 2026 (R-3): composed of the two readings above, which hold the body this function always ran, moved unchanged, so the
 * requirement account reads conditions and the event kind exactly as this guard does; the findings, their words and their order are
 * byte-identical (`context-scoring-guard.unit.ts` holds them to a copy of the function as it stood at 7fd9713).
 */
export function contextScoringFindings(
    contextId: string,
    contract: LoadedContract | undefined,
    game: any,
    approvedEvents: string[],
    /** Stage K7: the episode check as rerun on this concrete game, where the caller has one (`episodeConfirmed`). */
    episodeCheck?: CheckResult,
    /** Stage M2: the items that establish and fill each occurrence the game counts as its primary event (`AlsoCountsSupport`). */
    alsoCountsSupport?: AlsoCountsSupport[],
    /** Stage A: the items that write each role's own scoring event (`RoleEventSupport`), and the register the game is read by. */
    roleEventSupport?: RoleEventSupport[],
    index?: RegisterIndex,
    /** Stage A review fix: the context relationships a role's own event outside the approved events may rest on (`roleEventFindings`). */
    relationships?: ScoringAuthority[],
): string[] {
    if (!contract) return [`the contract of the Representative Performance Context ${contextId} did not reach the build, so its scoring cannot be checked`]
    const findings: string[] = [...eventKindReadingOf(contextId, game, approvedEvents, alsoCountsSupport, roleEventSupport, index, relationships).findings]
    for (const { type, itemId } of constitutedConditionTypes(contract)) {
        const { why } = conditionReadingOf(contextId, contract, itemId, game, episodeCheck, type)
        if (why) findings.push(why)
    }
    return findings
}
