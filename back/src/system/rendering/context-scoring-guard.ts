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
import { conditionScopeNotEvaluable, EVALUABLE_CONDITION_SCOPE } from '../derivation/resolved-game'
import { LoadedContract } from '../derivation/types'

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
): string[] {
    if (!contract) return [`the contract of the Representative Performance Context ${contextId} did not reach the build, so its scoring cannot be checked`]
    const findings: string[] = []
    const event = game?.value?.primaryEvent
    const kind = event?.kind
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
