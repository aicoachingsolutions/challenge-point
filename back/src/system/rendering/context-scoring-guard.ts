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
import { LoadedContract } from '../derivation/types'

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
export function contextScoringFindings(contextId: string, contract: LoadedContract | undefined, game: any, approvedEvents: string[]): string[] {
    if (!contract) return [`the contract of the Representative Performance Context ${contextId} did not reach the build, so its scoring cannot be checked`]
    const findings: string[] = []
    const event = game?.value?.primaryEvent
    const kind = event?.kind
    if (!approvedEvents.includes(String(kind))) {
        findings.push(
            `the realized primary event is ${kind === undefined ? 'absent' : `"${kind}"`}, which the Representative Performance Context ${contextId} does not approve (it approves: ${approvedEvents.join(', ') || 'nothing'})`,
        )
    }
    const present = new Set((Array.isArray(event?.conditions) ? event.conditions : []).map((condition: any) => String(condition?.type)))
    for (const { type, itemId } of constitutedConditionTypes(contract)) {
        if (!present.has(type)) findings.push(`the ${type} condition ${contextId} constitutes (${itemId}) is not in the realized game's primary event`)
    }
    return findings
}
