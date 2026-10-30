/**
 * **The context-scoring guard's refactor is byte-identical** — 29 October 2026 (the specification's T11, with the R-engine review's S5).
 *
 * The requirement account reads each condition and the event kind exactly as the guard does, so the guard's loop body and its event-kind half
 * were moved, unchanged, into `conditionReadingOf` and `eventKindReadingOf`, and `contextScoringFindings` composes them. That is a move, not a
 * change: validation is neither loosened nor tightened. The guard's existing tests mostly count findings, and the snapshot's served builds have
 * none, so neither shows the words and the order are the same. So the function as it stood at 7fd9713 is kept below, TEST-ONLY, as the
 * oracle, and the refactored guard is held deep-equal to it over: every constructed game the two existing guard tests build (scoped and
 * unscoped conditions, a dropped scope, a condition missing, an unapproved and an absent event, no primary event, no contract), each with the
 * episode check absent, passing, failing in every way the K7 test lists, and a check of another id; Play Out from the Back's realized games,
 * both versions and both role blocks, as the build hands them to the account, with the also-counts and role-event supports absent, given on
 * his ruling, and given on an assumed basis, and with and without the context relationships; and the same real games under the contract with
 * each constituted condition removed. And `conditionReadingOf(...).why` is non-null exactly where a finding names that item.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/rendering/context-scoring-guard.unit.ts
 */
import assert from 'node:assert/strict'

import { loadCorpusContracts, loadSportBoundRegions } from '../derivation/corpus'
import { CheckResult } from '../derivation/gates'
import { RegisterIndex } from '../derivation/register'
import { conditionScopeNotEvaluable, EVALUABLE_CONDITION_SCOPE } from '../derivation/resolved-game'
import { LoadedContract } from '../derivation/types'
import { rpcLibrary } from '../sport-module/rpc-library'
import { contextRelationships, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { buildActivityUnderAuthorizationRecords } from './build-activity'
import {
    alsoCountsFindings,
    AlsoCountsSupport,
    conditionReadingOf,
    constitutedConditionTypes,
    contextScoringFindings,
    EPISODE_REACHABLE_CHECK,
    episodeConfirmed,
    roleEventFindings,
    RoleEventSupport,
    ScoringAuthority,
} from './context-scoring-guard'
import { eventKindOf, roleElementsOf } from './game-reading'
import { BlockRequirementInputs } from './requirement-account'
import { specializedRoleNames } from './session-envelope'

const quiet = console.log
let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    quiet(`  ok  ${name}`)
}
quiet("the context-scoring guard's refactor, held to the function as it stood at 7fd9713")

/** TEST-ONLY ORACLE: `contextScoringFindings` exactly as at 7fd9713 (context-scoring-guard.ts lines 201-253), never changed. */
function oracle(
    contextId: string,
    contract: LoadedContract | undefined,
    game: any,
    approvedEvents: string[],
    episodeCheck?: CheckResult,
    alsoCountsSupport?: AlsoCountsSupport[],
    roleEventSupport?: RoleEventSupport[],
    index?: RegisterIndex,
    relationships?: ScoringAuthority[],
): string[] {
    if (!contract) return [`the contract of the Representative Performance Context ${contextId} did not reach the build, so its scoring cannot be checked`]
    const findings: string[] = [...roleEventFindings(contextId, game, approvedEvents, roleEventSupport, index, relationships), ...alsoCountsFindings(contextId, game, approvedEvents, alsoCountsSupport)]
    const event = game?.value?.primaryEvent
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
        const authored = (contract.items ?? []).find(item => item.itemId === itemId)?.scope
        const element = conditions.find((condition: any) => String(condition?.elementId) === `c:${contract.contractId}:${itemId}`)
        const carried = element && Object.prototype.hasOwnProperty.call(element, 'scope') ? element.scope : EVALUABLE_CONDITION_SCOPE
        if (element && authored !== undefined && String(carried) !== String(authored)) {
            findings.push(`the ${type} condition ${contextId} constitutes (${itemId}) is authored for the ${String(authored)} scope and reached the realized game as ${JSON.stringify(carried)}`)
            continue
        }
        const notEvaluable = conditionScopeNotEvaluable(element)
        if (notEvaluable && authored !== undefined && String(carried) === String(authored) && episodeConfirmed(carried, episodeCheck)) continue
        if (notEvaluable) findings.push(`the ${type} condition ${contextId} constitutes (${itemId}) cannot be confirmed to govern this game: ${notEvaluable}`)
    }
    return findings
}

type Case = { label: string; contextId: string; contract: LoadedContract | undefined; game: any; approved: string[]; check?: CheckResult; also?: AlsoCountsSupport[]; roles?: RoleEventSupport[]; index?: RegisterIndex; relationships?: ScoringAuthority[] }
let compared = 0
let nonEmpty = 0
function same(entry: Case): void {
    const ours = contextScoringFindings(entry.contextId, entry.contract, entry.game, entry.approved, entry.check, entry.also, entry.roles, entry.index, entry.relationships)
    const theirs = oracle(entry.contextId, entry.contract, entry.game, entry.approved, entry.check, entry.also, entry.roles, entry.index, entry.relationships)
    assert.deepStrictEqual(ours, theirs, entry.label)
    compared++
    if (theirs.length) nonEmpty++
    // Each constituted condition's reading says why exactly where a finding names its item.
    if (entry.contract)
        for (const { itemId } of constitutedConditionTypes(entry.contract)) {
            const reading = conditionReadingOf(entry.contextId, entry.contract, itemId, entry.game, entry.check)
            assert.equal(reading.why !== null, theirs.some(finding => finding.includes(`(${itemId})`)), `${entry.label}: ${itemId}`)
            if (reading.why) assert.ok(theirs.includes(reading.why), `${entry.label}: ${itemId}'s why is the finding itself`)
        }
}

const RPC = 'restated:RPC-001'
const CONDITION_ITEMS = ['RPC-001-18.a', 'RPC-001-18.c', 'RPC-001-18.f', 'RPC-001-19.a']
const clause = (verdict: string, extra: Record<string, unknown> = {}) => ({ clause: 'TEST-ONLY', verdict, basis: 'EVALUATED', instances: 4, ...extra })
const checkWith = (verdict: string, clauses: any[], checkId = EPISODE_REACHABLE_CHECK): any => ({ checkId, verdict, subjects: [], why: 'TEST-ONLY', clauses, pendingOn: [], blockedBy: [] })
const CHECKS: [string, CheckResult | undefined][] = [
    ['no check', undefined],
    ['passing', checkWith('PASS', [clause('PASS'), clause('PASS'), clause('PASS')])],
    ['deferred', checkWith('DEFERRED_TO_REALIZATION', [clause('DEFERRED_TO_REALIZATION'), clause('PASS'), clause('PASS')])],
    ['withheld', checkWith('NOT_EVALUABLE', [clause('NOT_EVALUABLE'), clause('NOT_EVALUABLE'), clause('PASS')])],
    ['a second awardee', checkWith('FAIL', [clause('PASS'), clause('FAIL'), clause('PASS')])],
    ['a vacuous pass', checkWith('PASS', [clause('PASS', { basis: 'NO_APPLICABLE_INSTANCES', instances: 0 }), clause('PASS'), clause('PASS')])],
    ['another check', checkWith('PASS', [clause('PASS'), clause('PASS'), clause('PASS')], 'GA-TRIGGER-REACHABLE')],
    ['a PASS verdict over a failing clause', checkWith('PASS', [clause('PASS'), clause('FAIL'), clause('PASS')])],
]

test('the constructed games of the two guard tests, every episode check: byte-identical findings, in the same order', () => {
    const base: any = JSON.parse(JSON.stringify(loadCorpusContracts().find(contract => contract.contractId === RPC)))
    const approved = rpcLibrary.scoringEventsForContext('RPC-001')
    const scoped: any = JSON.parse(JSON.stringify(base))
    for (const item of scoped.items) if (CONDITION_ITEMS.includes(item.itemId)) item.scope = 'BUILD_OUT_EPISODE'
    const perTeam: any = JSON.parse(JSON.stringify(base))
    for (const item of perTeam.items) if (CONDITION_ITEMS.includes(item.itemId)) item.scope = 'PER_TEAM'
    const noControl: any = JSON.parse(JSON.stringify(base))
    noControl.items = noControl.items.filter((item: any) => item.itemId !== 'RPC-001-18.f')
    const conditions = (scope: string | undefined, types = ['18.a:origin', '18.c:progression', '18.f:control', '19.a:exclusion']) =>
        types.map(pair => {
            const [id, type] = pair.split(':')
            return { elementId: `c:${RPC}:RPC-001-${id}`, type, ...(scope === undefined ? {} : { scope }) }
        })
    const games: [string, any][] = [
        ['scoped, carried', { value: { primaryEvent: { value: 1, kind: 'line_crossed', conditions: conditions('BUILD_OUT_EPISODE') } } }],
        ['scope dropped', { value: { primaryEvent: { value: 1, kind: 'line_crossed', conditions: conditions(undefined) } } }],
        ['per team', { value: { primaryEvent: { value: 1, kind: 'line_crossed', conditions: conditions('PER_TEAM') } } }],
        ['control missing', { value: { primaryEvent: { value: 1, kind: 'line_crossed', conditions: conditions('BUILD_OUT_EPISODE', ['18.a:origin', '18.c:progression', '19.a:exclusion']) } } }],
        ['types only', { value: { primaryEvent: { value: 1, kind: 'line_crossed', conditions: ['origin', 'progression', 'control', 'exclusion'].map(type => ({ type })) } } }],
        ['an unapproved event', { value: { primaryEvent: { value: 1, kind: 'regain', conditions: conditions('BUILD_OUT_EPISODE') } } }],
        ['no conditions', { value: { primaryEvent: { value: 1, kind: 'line_crossed' } } }],
        ['no primary event', {}],
    ]
    for (const [contractLabel, contract] of [['unscoped', base], ['scoped', scoped], ['per team', perTeam], ['without control', noControl], ['no contract', undefined]] as [string, any][]) {
        for (const [gameLabel, game] of games) {
            for (const [checkLabel, check] of CHECKS) {
                for (const events of [approved, ['line_crossed'], ['regain'], []]) same({ label: `${contractLabel} / ${gameLabel} / ${checkLabel} / ${events.join(',')}`, contextId: 'RPC-001', contract, game, approved: events, check })
            }
        }
    }
})

test("Play Out from the Back's realized games, both versions and both blocks, with every kind of support and each condition removed: byte-identical", () => {
    const keeper = specializedRoleNames()[0]
    const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
    const fa = loadSportBoundRegions()!.pairings.find(pairing => pairing.id === 'FA-MINI-SOCCER-5V5-2026')!
    const observed: BlockRequirementInputs[] = []
    for (const objects of [{ goal: { count: 0 } }, { goal: { count: 1, type: fa.object.type!, widthM: fa.object.widthM } }]) {
        console.log = () => undefined
        try {
            buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...none, [keeper]: 1 }, objects } }, learningGoalAuthorizations(), {
                review: { includeDrafts: true },
                observeRequirementInputs: inputs => observed.push(inputs),
            })
        } finally {
            console.log = quiet
        }
    }
    assert.equal(observed.length, 4, 'two versions, two blocks each')
    const relationships = contextRelationships() as unknown as ScoringAuthority[]
    for (const inputs of observed) {
        const contract = inputs.contracts.find(entry => entry.contractId === RPC)!
        const game: any = inputs.game
        const approved = inputs.eventKind.approvedEvents
        const supports = (basis: string): { also: AlsoCountsSupport[]; roles: RoleEventSupport[] } => ({
            also: (game?.value?.primaryEvent?.alsoCounts ?? []).map((element: any) => ({ elementId: String(element.elementId), items: [{ contractId: 'TEST-ONLY', itemId: 'TEST-ONLY', basis }] })),
            roles: roleElementsOf(game, inputs.index).map(({ elementId, role }) => ({ elementId, role, items: [{ contractId: 'TEST-ONLY', itemId: 'TEST-ONLY', basis, authorizedBy: null, realizes: inputs.contextId }] })),
        })
        const variants: [string, LoadedContract][] = [
            ['as built', contract],
            ...constitutedConditionTypes(contract).map(({ type }) => [`${type} removed`, { ...contract, items: contract.items.filter(item => !(['V3', 'V5', 'V6'].includes(String(item.row)) && item.selector === `type=${type}`)) }] as [string, LoadedContract]),
        ]
        for (const [variant, altered] of variants) {
            for (const [supportLabel, support] of [['no supports', null], ['on his ruling', supports('OWNER_RULING')], ['assumed', supports('ASSUMED')]] as const) {
                for (const [checkLabel, check] of [['the real check', inputs.episodeCheck], ...CHECKS] as [string, CheckResult | undefined][]) {
                    for (const given of [relationships, undefined]) {
                        same({ label: `${inputs.blockId} / ${variant} / ${supportLabel} / ${checkLabel}`, contextId: inputs.contextId, contract: altered, game, approved, check, also: support?.also, roles: support?.roles, index: inputs.index, relationships: given })
                    }
                }
            }
        }
    }
})

test('the corpus is not vacuous: findings were compared, not only empty lists', () => {
    assert.ok(compared > 1000, `${compared} cases compared`)
    assert.ok(nonEmpty > compared / 2, `${nonEmpty} of them with findings`)
})

console.log = quiet
console.log(`context-scoring-guard unit tests: ${passed} passed (${compared} cases held to the oracle).`)
