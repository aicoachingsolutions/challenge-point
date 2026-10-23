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
import { conditionScopeNotEvaluable, EVALUABLE_CONDITION_SCOPE } from '../derivation/resolved-game'
import { LoadedContract } from '../derivation/types'
import { eventKindOf, roleElementsOf } from './game-reading'

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
    /** Every item that writes the role's own event, with its basis and (stage A review fix) the relationship it cites, where it cites one. */
    items: { contractId: string; itemId: string; basis: string; authorizedBy?: string | null }[]
}

/** What the guard reads of a context relationship (the authorization records hold the whole entry; `contextRelationships`). */
export interface ScoringAuthority {
    id: string
    contextId: string
    status: string
    scoringEvent?: string
    role?: string
}

/**
 * **An event the context does not approve stands only on a confirmed scoring relationship of that context, for that role and that event**
 * (stage A review fix, 22 October 2026). Until this fix the context's approved events were read only into the message, so a role's own
 * event outside them rested entirely on GA-ROLE-EVENTS clause 6 finding a REQUIRED list on the event row in some contract. His 14 October
 * words (above) make the context's approved scoring govern; his 15 October answer 9 lets specific knowledge depart only "through an
 * authorized relationship". So such an event is confirmed only where an item writing it cites (`authorizedBy`) a CONFIRMED relationship of
 * this context naming exactly this event and this role (`relationships`, the records' context relationships of every kind); otherwise it
 * is named here and refuses the game. An event the context approves needs none (his OWNER_RULING basis is still required, above).
 */
export function roleEventFindings(contextId: string, game: any, approvedEvents: string[], support: RoleEventSupport[] | undefined, index?: RegisterIndex, relationships: ScoringAuthority[] = []): string[] {
    const findings: string[] = []
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
            return !!relationship && relationship.status === RELATIONSHIP_CONFIRMED && relationship.contextId === contextId && relationship.scoringEvent === String(own.kind) && relationship.role === role
        })
        if (!authorized) {
            findings.push(
                `the role ${role} (${id}) scores by its own event "${String(own.kind)}", which the Representative Performance Context ${contextId} does not approve (it approves: ${approvedEvents.join(', ') || 'nothing'}), and no item writing it cites a confirmed scoring relationship of ${contextId} authorizing "${String(own.kind)}" for ${role}`,
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
    const prefix = 'type='
    return (contract.items ?? [])
        .filter(item => String(item.row) === 'V3' && String(item.requirement) === 'EXISTS' && String(item.strictness) === 'REQUIRED')
        .filter(item => String(item.selector ?? '').startsWith(prefix))
        .map(item => ({ type: String(item.selector).slice(prefix.length).trim(), itemId: item.itemId }))
}

/**
 * What the realized game lacks of its context's approved scoring, as reasons for the technical account. Empty
 * where it carries all of it.
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
    const findings: string[] = [...roleEventFindings(contextId, game, approvedEvents, roleEventSupport, index, relationships), ...alsoCountsFindings(contextId, game, approvedEvents, alsoCountsSupport)]
    const event = game?.value?.primaryEvent
    // Stage A: the game's primary event read through the one kind reader (a role's own event is the per-role clause's, above).
    const kind = eventKindOf(game, null, index).kind
    if (!approvedEvents.includes(String(kind))) {
        findings.push(
            `the realized primary event is ${kind === undefined ? 'absent' : `"${kind}"`}, which the Representative Performance Context ${contextId} does not approve (it approves: ${approvedEvents.join(', ') || 'nothing'})`,
        )
    }
    const conditions: any[] = Array.isArray(event?.conditions) ? event.conditions : []
    const present = new Set(conditions.map((condition: any) => String(condition?.type)))
    for (const { type, itemId } of constitutedConditionTypes(contract)) {
        if (!present.has(type)) {
            findings.push(`the ${type} condition ${contextId} constitutes (${itemId}) is not in the realized game's primary event`)
            continue
        }
        /**
         * **Present is not yet governing, where the condition was authored for less than every score** — 15 October
         * 2026. The constituting item's own scope must have arrived on the condition (a projection is proved by its
         * consumer), and a scope narrower than the whole game cannot be confirmed by a check that reads only whether
         * the condition is there: it would be passing a condition on every score that was authored for some. His
         * SD-36 and 16 October 9.3 ("Build-out condition applies only to build-out episodes: Approved.").
         */
        const authored = (contract.items ?? []).find(item => item.itemId === itemId)?.scope
        const element = conditions.find((condition: any) => String(condition?.elementId) === `c:${contract.contractId}:${itemId}`)
        const carried = element && Object.prototype.hasOwnProperty.call(element, 'scope') ? element.scope : EVALUABLE_CONDITION_SCOPE
        if (element && authored !== undefined && String(carried) !== String(authored)) {
            findings.push(`the ${type} condition ${contextId} constitutes (${itemId}) is authored for the ${String(authored)} scope and reached the realized game as ${JSON.stringify(carried)}`)
            continue
        }
        const notEvaluable = conditionScopeNotEvaluable(element)
        // Carried with its authored scope (checked just above), and the concrete game begins that episode (stage K7).
        if (notEvaluable && authored !== undefined && String(carried) === String(authored) && episodeConfirmed(carried, episodeCheck)) continue
        if (notEvaluable) findings.push(`the ${type} condition ${contextId} constitutes (${itemId}) cannot be confirmed to govern this game: ${notEvaluable}`)
    }
    return findings
}
