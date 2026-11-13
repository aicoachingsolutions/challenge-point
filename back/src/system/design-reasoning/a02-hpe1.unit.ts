/**
 * **Stage B1 of the A02 complete-activity package: the CANDIDATE restatement of Christian's two rulings, the PROPOSED configuration A02-HPE1
 * and the TEST-ONLY engine pieces that carry it, reaching a realized game** (12 November 2026). TEST-ONLY review evidence: nothing here is
 * served, written to production knowledge, or an authorization.
 *
 * Christian, received 12 November 2026: "Please develop the smallest executable restatement consistent with these decisions, preserving its
 * candidate status until I've reviewed it." "Please propose the simplest representative configuration that makes the relevant defensive
 * pressure and escape target observable to the coach." "The final interpretation and any consequential new knowledge should remain subject
 * to my approval."
 *
 * What is pinned, every value measured first (scratchpad pkg3/B1: the P0 probe and its shapes, the runs):
 *   T1 the restatement's shape (02.b on V6, the two NO_FURTHER_VALUE declarations, WHOLE_GAME, no restart arrangement), with three bites;
 *   T2 no silent loss, proved by a consumer: the realized escaping event carries 'established coordinated pressure', with two bites;
 *   T3 the continuation: 04.b verbatim, no number, time, distance or specific action on a control item, with two bites;
 *   T4 the PROPOSED gate (`draft-store.ts` `loadProposedRealization`): admitted whole; each defect refuses the file;
 *   T5 the realized HPE-1 game, read from the game in both blocks, with three bites;
 *   T6 P0 held: the condition is not on the pressing team's score, with its bite;
 *   T7 labels: every HPE-1 item grades PROPOSED or ILLUSTRATIVE (never APPROVED, never Christian's choice), with two bites;
 *   T8 the treatment PROPOSED_PENDING: one pending entry naming Q2 and the item, with three bites;
 *   and the stops each A02 run reaches, the static scan, the registration.
 *
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-hpe1.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { DraftStoreRefused, loadDraftStore, loadProposedRealization, PROPOSED_HPE1_FILE, withProposedReplacements } from '../derivation/draft-store'
import { indexRegister } from '../derivation/register'
import { registerWith, selectFor, UpstreamDecisions } from '../derivation/run-bounded-selection'
import { beginConditionReferentOf, ILLUSTRATIVE, PROPOSED } from '../derivation/types'
import { contextScoringFindings, splitProposedPending } from '../rendering/context-scoring-guard'
import { itemSource } from '../rendering/review-evidence'
import { actionClassesIn } from '../sport-module/action-words'
import { rpcLibrary } from '../sport-module/rpc-library'
import { ChainAnswer, ChainRequest, HandoffChain, HandoffResult, runHandoffCases } from './handoff'
import { productionRecords, realChain, withoutGenderedPronouns } from './handoff-chain.unit'
import { committedKnowledge } from './knowledge'
import { inputs as a02Inputs } from './a02.unit'

const quiet = console.log
console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('[selection-search]')) return
    quiet(...args)
}
let passed = 0
const MAIN = require.main === module
function test(name: string, run: () => void): void {
    if (!MAIN) return
    try {
        run()
        passed++
        quiet(`  ok  ${name}`)
    } catch (error) {
        quiet(`  FAIL ${name}: ${(error as Error).stack ?? (error as Error).message}`)
        process.exitCode = 1
    }
}
if (MAIN) quiet(`stage B1 of the A02 complete-activity package: the CANDIDATE restatement and the PROPOSED configuration A02-HPE1 (Christian's reply received 12 November 2026)`)

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const STORE_DIR = path.join(WT, 'docs', 'audits', 'drafts', 'a02-composition')
const C = 'restated:RPC-002'
const P = 'proposed:A02-HPE1'
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))
const INP = readJson(path.join(HERE, 'a02-inputs.review.json'))
const wordsOf = (id: string): string[] => INP.rulings.find((r: { id: string }) => r.id === id).words
const RUNS = ['A02-0', 'A02-1', 'A02-1b', 'A02-2', 'A02-D', 'A02-HPE1-S', 'A02-HPE1-L']

// ---------------------------------------------------------------------------------------------------------------------------------------
// The runs: every A02 case through the handoff and the real chain, each request, answer and built activity captured (read-only wraps).
// ---------------------------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require('../derivation/engine')
const derive = engine.runDerivation
let gateA: any[] = []
engine.runDerivation = (input: unknown) => {
    const result = derive(input)
    gateA = result?.gates?.gateA?.checks ?? []
    return result
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildModule = require('../rendering/build-activity')
const entry = buildModule.buildActivityUnderAuthorizationRecords
let lastBuilt: any = null
buildModule.buildActivityUnderAuthorizationRecords = (...args: unknown[]) => (lastBuilt = entry(...args))

interface Made {
    result: HandoffResult
    request: ChainRequest
    answer: ChainAnswer
    built: any
    gates: any[]
}
const made = new Map<string, Made>()
{
    const capture: HandoffChain = {
        build: (r) => {
            const answer = realChain.build(r)
            made.set(r.caseId, { result: null as unknown as HandoffResult, request: copy(r), answer, built: lastBuilt, gates: copy(gateA) })
            return answer
        },
    }
    for (const result of runHandoffCases(a02Inputs, capture, committedKnowledge())) made.get(result.caseId)!.result = result
}
const at = (id: string): Made => {
    const m = made.get(id)
    assert.ok(m, `no run ${id}`)
    return m
}
/** One more build of a captured request, changed, through the real chain: its answer, its built activity and its Gate A. */
function buildWith(base: string, change: (r: ChainRequest) => void): { answer: ChainAnswer; built: any; gates: any[] } {
    const request = copy(at(base).request)
    change(request)
    const answer = realChain.build(request)
    return { answer, built: lastBuilt, gates: copy(gateA) }
}
/** A TEST-ONLY copy of the PROPOSED configuration, changed, in a temporary folder; its absolute path. */
function configurationCopy(change: (raw: any) => void): string {
    const raw = readJson(PROPOSED_HPE1_FILE)
    change(raw)
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-proposed-'))
    const file = path.join(dir, 'hpe1.PROPOSED.json')
    fs.writeFileSync(file, JSON.stringify(raw, null, 2))
    return file
}
/** A TEST-ONLY copy of the a02-composition draft store folder with its restatement changed; the folder's absolute path. */
function storeCopy(change: (raw: any) => void): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a02-composition-'))
    for (const name of fs.readdirSync(STORE_DIR)) fs.copyFileSync(path.join(STORE_DIR, name), path.join(dir, name))
    const file = path.join(dir, 'rpc-002-contract.DRAFT.json')
    const raw = readJson(file)
    change(raw)
    fs.writeFileSync(file, JSON.stringify(raw, null, 2))
    return dir
}
const itemOfConfiguration = (raw: any, id: string): any => raw.proposed.realization.items.find((i: any) => i.id === id)
const restatedItem = (raw: any, id: string): any => raw.contractEntry.result.items.find((i: any) => i.id === id)
const blocksOf = (built: any): any[] => (built?.fixture?.roleBlocks?.blocks ?? []) as any[]

// ---------------------------------------------------------------------------------------------------------------------------------------
// The checks the tests hold the runs to (each a function, so its bite runs the same check on a changed run)
// ---------------------------------------------------------------------------------------------------------------------------------------

/** T1: what the CANDIDATE restatement's shape must be; each defect named. A begin-condition referent is 'a mandatory restart arrangement'. */
function restatementShapeRefusals(raw: any): string[] {
    const out: string[] = []
    const result = raw.contractEntry.result
    const items: any[] = result.items
    const decl = (row: string, selector: string, declaration: string) => (result.declarations as any[]).find((d) => d.row === row && d.selector === selector && d.declaration === declaration)
    const b = items.find((i) => i.id === 'RPC-002-02.b')
    if (!b || b.row !== 'V6' || b.value !== 'established coordinated pressure') out.push('02.b is not on V6 with its verbatim words')
    for (const t of ['origin', 'control']) if (decl('V5', `type=${t}`, 'NON_CLAIMED')?.qualifier !== 'NO_FURTHER_VALUE') out.push(`V5 ${t} is not declared NO_FURTHER_VALUE`)
    if (!decl('V6', 'type ∈ {origin, progression, control}', 'CLAIMED')) out.push('V6 is not CLAIMED for origin, progression and control')
    if (!decl('V5', 'type=progression', 'CLAIMED')) out.push('V5 is not CLAIMED for progression alone')
    for (const i of items.filter((x) => ['V3', 'V5', 'V6'].includes(String(x.row)))) if (i.scope !== 'WHOLE_GAME') out.push(`${i.id} is scoped ${i.scope}, not WHOLE_GAME (an episode scope)`)
    for (const i of items) if (beginConditionReferentOf(i.value)) out.push(`${i.id} carries a begin condition: a mandatory restart arrangement, which Christian declined (received 12 November 2026)`)
    for (const i of items) if (i.value && typeof i.value === 'object' && 'whileState' in i.value) out.push(`${i.id} carries a state (whileState)`)
    for (const i of items) if (/^[TP][0-9]/.test(String(i.row)) && String(i.row) !== 'P1') out.push(`${i.id} is on a transition or placement row (${i.row})`)
    return out
}
/** T2: the realized escaping event carries the origin's words (a projection is proved by its consumer). */
const originWordsCarried = (game: any): boolean =>
    ((game?.value?.primaryEvent?.conditions ?? []) as any[]).some((c) => c.type === 'origin' && c.elementId === `c:${C}:RPC-002-02.a` && c.value === 'established coordinated pressure')
/** T3: the continuation names no number, time, distance or specific action (a value or a sentence). */
function continuationRefusals(texts: string[]): string[] {
    const out: string[] = []
    for (const text of texts) {
        if (/[0-9]/.test(text)) out.push(`'${text}' holds a number`)
        if (/\b(second|seconds|minute|minutes|metre|metres|meter|meters|yard|yards)\b/i.test(text)) out.push(`'${text}' holds a time or a distance`)
        const named = actionClassesIn(text)
        if (named.length) out.push(`'${text}' names a specific action (${named.join(', ')})`)
    }
    return out
}
/** T5: the realized HPE-1 game in both blocks, read from the games; each defect named, empty where it holds. */
function hpe1GameFindings(built: any, answer: ChainAnswer): string[] {
    const out: string[] = []
    const blocks = blocksOf(built)
    if (blocks.length !== 2) return [`no realized game in two blocks (${blocks.length} blocks; the build stopped at ${built?.activity?.stage ?? built?.activity?.outcome}; ${String(built?.activity?.reasons?.[0] ?? '').slice(0, 160)})`]
    const approved = rpcLibrary.scoringEventsForContext('RPC-002')
    const holdersSeen = new Set<string>()
    for (const block of blocks) {
        const at = `block ${block.blockId}`
        const game = block.fixture.game
        const geometry = new Map<string, any>(((block.fixture.status.geometry ?? []) as any[]).map((g) => [g.path, g.geometry]))
        const holders = block.holders as Record<string, string>
        holdersSeen.add(JSON.stringify(holders))
        const escapingEnd = holders.ESCAPING === 'TEAM_AT_AXIS_START' ? 0 : block.fixture.envelope.lengthM
        const farEnd = escapingEnd === 0 ? block.fixture.envelope.lengthM : 0
        const roles = (game.activityRoles ?? []) as any[]
        const escaping = roles.find((r) => r.activityRole === 'ESCAPING')
        const pressing = roles.find((r) => r.activityRole === 'PRESSING')
        if (!escaping || !pressing || !holders.ESCAPING || !holders.PRESSING || holders.ESCAPING === holders.PRESSING) out.push(`${at}: the roles are not held, one per team`)
        if (escaping?.scoresBy !== undefined) out.push(`${at}: the escaping team scores by an event of its own, not the primary event`)
        // The escape line: one marked line, 12 m (ILLUSTRATIVE) from the escaping team's end line, across the full width.
        const line = `space.regions[c:${P}:A02-HPE1-S2-1]`
        const along = geometry.get(`${line}.position.along`)
        const across = geometry.get(`${line}.position.across`)
        const lineAt = along?.interval?.from
        if (!along || along.interval?.from !== along.interval?.to || Math.abs(lineAt - escapingEnd) !== 12) out.push(`${at}: the escape line is not at the escaping team's end (${JSON.stringify(along?.interval ?? null)})`)
        if (!across || across.interval?.from !== 0 || across.interval?.to !== block.fixture.envelope.widthM) out.push(`${at}: the escape line does not run the full width`)
        // Each team's objective, read from the game: the escaping team's target beyond the line, the pressing team's the escaping team's end line.
        const objectiveOf = (team: string) => ((game.objectives ?? []) as any[]).find((o) => o.team === team && o.role === 'PRIMARY_SCORING')
        const regionOf = (o: any) => ((game.space?.regions ?? []) as any[]).find((r) => r.elementId === `c:${o?.reference?.structuralRef?.contractId}:${o?.reference?.structuralRef?.itemId}`)
        const escTarget = regionOf(objectiveOf(holders.ESCAPING))
        const escAlong = escTarget ? geometry.get(`space.regions[${escTarget.elementId}].position.along`)?.interval : null
        if (escTarget?.noun !== 'zone' || !escAlong || Math.min(escAlong.from, escAlong.to) !== Math.min(lineAt, farEnd) || Math.max(escAlong.from, escAlong.to) !== Math.max(lineAt, farEnd))
            out.push(`${at}: the escaping team's target is not the zone from the escape line to the far end line (${escTarget?.noun} ${JSON.stringify(escAlong)})`)
        const preTarget = regionOf(objectiveOf(holders.PRESSING))
        const preAlong = preTarget ? geometry.get(`space.regions[${preTarget.elementId}].position.along`)?.interval : null
        if (preTarget?.noun !== 'line' || !preAlong || preAlong.from !== escapingEnd || preAlong.to !== escapingEnd) out.push(`${at}: the pressing team's target is not the escaping team's end line (${preTarget?.noun} ${JSON.stringify(preAlong)})`)
        if (pressing?.scoresBy !== 'line_crossed') out.push(`${at}: the pressing team does not score by its own event over that line (${pressing?.scoresBy})`)
        // The escaping team's event: an approved RPC-002 event, with the three conditions on it, 03.b's referent the escape line.
        const event = game.value?.primaryEvent
        if (event?.kind !== 'target_zone_entered' || !approved.includes(String(event?.kind))) out.push(`${at}: the escaping team's event is not target_zone_entered among RPC-002's approved events (${event?.kind})`)
        const conditions = (event?.conditions ?? []) as any[]
        const condition = (type: string) => conditions.find((c) => c.type === type)
        if (!originWordsCarried(game)) out.push(`${at}: the origin condition's words are not on the event`)
        if (condition('progression')?.value !== 'beyond' || condition('progression')?.referents?.structuralRef?.itemId !== 'A02-HPE1-S2-1') out.push(`${at}: the progression condition is not 'beyond' the escape line`)
        if (condition('control')?.value !== 'retains possession through the next action') out.push(`${at}: the control condition's words are not on the event`)
        // Play continues on a change of possession; 6 v 6.
        if (!((game.transitions ?? []) as any[]).some((t) => (t.selector ?? []).some((s: any) => s.attribute === 'trigger' && s.value === 'POSSESSION_CHANGE') && t.playState === 'CONTINUE')) out.push(`${at}: play does not continue on a change of possession`)
        if (JSON.stringify(((game.performers?.teams ?? []) as any[]).map((t) => t.outfieldCount)) !== JSON.stringify([6, 6])) out.push(`${at}: the teams are not 6 v 6`)
    }
    if (holdersSeen.size !== 2) out.push('the two blocks do not exchange the roles')
    // No constraint, under K2's empty set (the account, never a record).
    if (JSON.stringify(answer.account?.constraints ?? null) !== '[]' || answer.observed?.constraintAuthority !== 'REVIEW_PATHWAY_K2') out.push(`constraints ${JSON.stringify(answer.account?.constraints)} under ${answer.observed?.constraintAuthority}, not the empty set under REVIEW_PATHWAY_K2`)
    return out
}
/** T6: the condition is off the pressing team's score: its role scores by its own event, which takes no condition (GA-ROLE-EVENTS). */
function conditionOnPressingScore(built: any, gates: any[]): string[] {
    const out: string[] = []
    for (const block of blocksOf(built)) {
        const pressing = ((block.fixture.game.activityRoles ?? []) as any[]).find((r) => r.activityRole === 'PRESSING')
        if (!pressing?.scoresBy) out.push(`block ${block.blockId}: the pressing team scores by the primary event, so the condition is on its score`)
    }
    if (!blocksOf(built).length) out.push('no game')
    const clause = ((gates.find((c) => c.checkId === 'GA-ROLE-EVENTS')?.clauses ?? []) as any[]).find((c) => String(c.clause).startsWith('a role scoring by an event of its own takes no condition'))
    if (!clause || clause.verdict !== 'PASS' || !(Number(clause.instances) >= 1)) out.push(`GA-ROLE-EVENTS 'takes no condition' is ${clause ? `${clause.verdict}, ${clause.instances} instance(s)` : 'absent'}`)
    return out
}
/** T7: how each item of the configuration grades: by the account, the handoff's premises and the review evidence. */
function labelRefusals(result: HandoffResult, answer: ChainAnswer): string[] {
    const out: string[] = []
    const contract = answer.contracts.find((c) => c.contractId === P)
    if (!contract || contract.origin !== 'PROPOSED') out.push(`the configuration reached the chain as ${contract?.origin ?? 'nothing'}, not PROPOSED`)
    const items = new Map<string, any>((contract?.items ?? []).map((i) => [`${P}::${i.itemId}`, i]))
    for (const i of contract?.items ?? []) {
        if (i.category !== PROPOSED && i.category !== ILLUSTRATIVE) out.push(`${i.itemId} is stamped ${i.category}`)
        const graded = itemSource({ contractId: P, itemId: i.itemId }, items, i.category)
        if (i.category === PROPOSED ? graded.standing !== 'PROPOSED' : !(graded.standing === 'DRAFT' && String(graded.detail).startsWith('ILLUSTRATIVE'))) out.push(`${i.itemId} grades ${graded.standing} in the review evidence`)
    }
    for (const line of result.lines) {
        for (const p of line.premises.filter((x) => x.ref.startsWith(`${P} `))) {
            if (p.kind !== 'PROPOSED_ITEM' && p.kind !== 'ILLUSTRATIVE_ITEM') out.push(`${line.lineId} rests on ${p.ref}, graded ${p.kind}`)
            if (!(p.label.startsWith('PROPOSED') || p.label.startsWith('ILLUSTRATIVE'))) out.push(`${line.lineId} rests on ${p.ref}, labelled '${p.label}'`)
        }
    }
    for (const x of answer.reviewLevel?.proposedElements.items ?? []) if (x.category !== PROPOSED && x.category !== ILLUSTRATIVE) out.push(`the account lists ${x.itemId} as ${x.category}`)
    return out
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The stops each A02 run reaches (measured)
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the stops (measured): A02-0 at structure on 03.b (the pressing line, open text); A02-1 and A02-1b at validation on the Laws; A02-2 at communication; A02-D served; A02-HPE1-S reaches a realized game and stops at communication; A02-HPE1-L at validation on LAW-11', () => {
    assert.deepEqual(RUNS.map((id) => [id, at(id).result.chain?.outcome, at(id).result.chain?.stage]), [
        ['A02-0', 'refused', 'structure'],
        ['A02-1', 'refused', 'validation'],
        ['A02-1b', 'refused', 'validation'],
        ['A02-2', 'refused', 'communication'],
        ['A02-D', 'served', null],
        ['A02-HPE1-S', 'refused', 'communication'],
        ['A02-HPE1-L', 'refused', 'validation'],
    ])
    // A02-0: Gate A cannot evaluate the progression clause's open text, the only open text left (02.b is on V6, origin and control name no place).
    assert.deepEqual(at('A02-0').result.chain?.reasons, ['Gate A is NOT_EVALUABLE', 'a pre-realization Gate A invariant cannot be evaluated, so it is not satisfied: GA-ONE-PRIMARY-EVENT, GA-REFERENCE-INTEGRITY'])
    assert.ok(at('A02-0').gates.some((c) => c.checkId === 'GA-REFERENCE-INTEGRITY' && String(c.why).includes('1 established no structural identity')), JSON.stringify(at('A02-0').gates.find((c) => c.checkId === 'GA-REFERENCE-INTEGRITY')?.why))
    assert.deepEqual(at('A02-0').answer.refusalDetail?.owedLines.map((o) => o.lineId) ?? [], [], 'no owed line: what stops it is the open text, not a declared gap')
    // A02-HPE1-S: a realized game in both blocks; what it waits on is approved wording for the three conditions' fields, and fidelity.
    const s = at('A02-HPE1-S').result.chain!.reasons
    for (const field of ['RPC-002-02.a].type (V4)', 'RPC-002-02.a].value (V6)', 'RPC-002-03.a].type (V4)', 'RPC-002-03.a].referents (V5)', 'RPC-002-03.a].value (V6)', 'RPC-002-04.a].type (V4)', 'RPC-002-04.a].value (V6)'])
        for (const block of ['ESCAPING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'ESCAPING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START'])
            assert.ok(s.includes(`block ${block}: awaiting approved wording: value.primaryEvent.conditions[c:${C}:${field}`), `${block} ${field}`)
    assert.equal(blocksOf(at('A02-HPE1-S').built).length, 2, 'a realized game in each block')
    // A02-HPE1-L: LAW-11 MATERIAL under our DRAFT reading, in both blocks (no stand-in), LAW-8 reported.
    const l = at('A02-HPE1-L').result.chain!.reasons
    assert.equal(l.filter((x) => x.includes('LAW-11 (Law 11 (Offside)) at the game: an adaptation is owed') && x.includes('[MATERIAL')).length, 2)
    assert.equal(l.filter((x) => x.startsWith('reported for review, not refused:') && x.includes('LAW-8')).length, 2)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// T1 to T3: the CANDIDATE restatement
// ---------------------------------------------------------------------------------------------------------------------------------------

test('T1 the restatement: 02.b on V6, verbatim; V5 origin and V5 control NO_FURTHER_VALUE; V6 CLAIMED for the three clauses, V5 for progression; WHOLE_GAME; no restart, state, T or P row; bites: 02.b on V5, an episode scope, an arm-bearing begin condition', () => {
    const raw = readJson(path.join(STORE_DIR, 'rpc-002-contract.DRAFT.json'))
    assert.deepEqual(restatementShapeRefusals(raw), [])
    assert.ok(String(raw.standing).includes('preserved until Christian has reviewed it'))
    // Bite 1: 02.b back on V5 (its 7dcb5d6 place), V5 CLAIMED for origin again and the origin's value declared needing none (UA2's N1): Gate A
    // cannot evaluate the open text, two items now establishing no structural identity.
    const onV5 = buildWith('A02-0', (r) => {
        r.draftStore = storeCopy((x) => {
            restatedItem(x, 'RPC-002-02.b').row = 'V5'
            const result = x.contractEntry.result
            result.declarations = result.declarations.filter((y: any) => !(y.row === 'V5' && y.selector === 'type=origin'))
            result.declarations.find((y: any) => y.row === 'V5' && y.declaration === 'CLAIMED').selector = 'type ∈ {origin, progression}'
            result.declarations.find((y: any) => y.row === 'V6' && y.declaration === 'CLAIMED').selector = 'type ∈ {progression, control}'
            result.declarations.push({ row: 'V6', declaration: 'NON_CLAIMED', qualifier: 'NO_FURTHER_VALUE', selector: 'type=origin', scope: 'WHOLE_GAME', note: 'BITE T1' })
        })
    })
    assert.deepEqual([onV5.answer.outcome, onV5.answer.stage, onV5.answer.reasons[0]], ['refused', 'structure', 'Gate A is NOT_EVALUABLE'])
    assert.ok(onV5.gates.some((c) => c.checkId === 'GA-REFERENCE-INTEGRITY' && String(c.why).includes('2 established no structural identity')), JSON.stringify(onV5.gates.find((c) => c.checkId === 'GA-REFERENCE-INTEGRITY')?.why))
    // Bite 2: the origin scoped to an episode: the shape check names it, and GA-EPISODE-REACHABLE fails on GF2-07.a (a possession change
    // never begins a build-out episode: an episode scope would leave scores outside it unconditioned, and on GF2 no transition begins one).
    const scopedRaw = copy(raw)
    restatedItem(scopedRaw, 'RPC-002-02.a').scope = 'BUILD_OUT_EPISODE'
    assert.ok(restatementShapeRefusals(scopedRaw).some((x) => x.includes('RPC-002-02.a is scoped BUILD_OUT_EPISODE')))
    const scoped = buildWith('A02-0', (r) => {
        r.draftStore = storeCopy((x) => (restatedItem(x, 'RPC-002-02.a').scope = 'BUILD_OUT_EPISODE'))
    })
    const episode = scoped.gates.find((c) => c.checkId === 'GA-EPISODE-REACHABLE')
    assert.deepEqual([scoped.answer.stage, episode?.verdict], ['structure', 'FAIL'])
    assert.ok(String(episode?.why).includes('c:restated:GF2:GF2-07.a'), String(episode?.why))
    // Bite 3: an arm-bearing begin condition on 02.b is a mandatory restart arrangement (Christian declined it), named by the shape check.
    const armed = copy(raw)
    restatedItem(armed, 'RPC-002-02.b').value = { beginsEpisodeOf: 'BUILD_OUT_EPISODE', arms: [{ takenBy: 'a player of the team in this element\'s T2' }] }
    assert.ok(restatementShapeRefusals(armed).some((x) => x.includes('a mandatory restart arrangement')), JSON.stringify(restatementShapeRefusals(armed)))
})

test('T2 no silent loss, proved by a consumer: the realized escaping event carries the origin words in both blocks; bites: 02.b withheld refuses at structure on 02.a::V6 (claimed, unresolved); a V6 NO_FURTHER_VALUE copy with the words gone is caught', () => {
    for (const block of blocksOf(at('A02-HPE1-S').built)) assert.ok(originWordsCarried(block.fixture.game), block.blockId)
    // Bite 1: the words withheld from the chain's copy: the CLAIMED V6 refuses (GA-NO-FAILED-LINE, 'claimed but unresolved').
    const withheld = buildWith('A02-HPE1-S', (r) => r.withhold.push({ contractId: C, itemIds: ['RPC-002-02.b'], treatmentId: 'BITE-T2' }))
    assert.deepEqual([withheld.answer.outcome, withheld.answer.stage], ['refused', 'structure'])
    assert.ok(withheld.answer.reasons.some((x) => x.endsWith('a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE')), JSON.stringify(withheld.answer.reasons))
    assert.ok(String(withheld.gates.find((c) => c.checkId === 'GA-NO-FAILED-LINE')?.why).includes('RPC-002-02.a::V6'))
    // Bite 2: the words gone and the gap declared away (V6 origin NO_FURTHER_VALUE): the build gets past structure, and the check catches it.
    const gone = buildWith('A02-HPE1-S', (r) => {
        r.draftStore = storeCopy((x) => {
            const result = x.contractEntry.result
            result.items = result.items.filter((i: any) => i.id !== 'RPC-002-02.b')
            result.declarations.find((d: any) => d.row === 'V6' && d.declaration === 'CLAIMED').selector = 'type ∈ {progression, control}'
            result.declarations.push({ row: 'V6', declaration: 'NON_CLAIMED', qualifier: 'NO_FURTHER_VALUE', selector: 'type=origin', scope: 'WHOLE_GAME', note: 'BITE T2' })
        })
    })
    assert.ok(blocksOf(gone.built).length === 2 && blocksOf(gone.built).every((b) => !originWordsCarried(b.fixture.game)), 'the words are gone from the realized event, and the check says so')
})

test(`T3 the continuation: 04.b verbatim; no control item names a number, time, distance or specific action; bites: 'through the next touch', 'within 3 seconds'`, () => {
    const raw = readJson(path.join(STORE_DIR, 'rpc-002-contract.DRAFT.json'))
    assert.equal(restatedItem(raw, 'RPC-002-04.b').value, 'retains possession through the next action')
    const controlTexts = (x: any) => (x.contractEntry.result.items as any[]).filter((i) => i.selector === 'type=control' && typeof i.value === 'string' && i.value !== 'N/A').map((i) => String(i.value))
    assert.deepEqual(continuationRefusals(controlTexts(raw)), [])
    for (const [doctored, words] of [['retains possession through the next touch', 'names a specific action (touch)'], ['retains possession within 3 seconds', 'holds a number']] as const) {
        const changed = copy(raw)
        restatedItem(changed, 'RPC-002-04.b').value = doctored
        assert.ok(continuationRefusals(controlTexts(changed)).some((x) => x.includes(words)), `${doctored}: ${JSON.stringify(continuationRefusals(controlTexts(changed)))}`)
    }
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// T4: the PROPOSED gate
// ---------------------------------------------------------------------------------------------------------------------------------------

const refusedWith = (file: string): string => {
    try {
        loadProposedRealization(file)
        return 'ADMITTED'
    } catch (error) {
        assert.ok(error instanceof DraftStoreRefused, String(error))
        return (error as Error).message
    }
}

test('T4 the PROPOSED gate: the file admitted whole, every item stamped PROPOSED or ILLUSTRATIVE, every request quoted verbatim with its date; each defect refuses the file', () => {
    const configuration = loadProposedRealization()
    assert.equal(configuration.file, 'docs/audits/drafts/a02-proposed/hpe1.PROPOSED.json')
    assert.deepEqual([configuration.realization.contractId, configuration.realization.category, configuration.realization.realizes, configuration.realization.words, configuration.realization.realizationChoices], [P, PROPOSED, 'RPC-002', [], null])
    assert.deepEqual(configuration.realization.items.map((i) => [i.itemId, i.category, (i as any).waitsOn]), [
        ['A02-HPE1-B1-1', PROPOSED, 'Q1'],
        ['A02-HPE1-B1-2', PROPOSED, 'Q1'],
        ['A02-HPE1-B3-1', PROPOSED, 'Q1'],
        ['A02-HPE1-S2-1', PROPOSED, 'Q1'],
        ['A02-HPE1-S5-1', ILLUSTRATIVE, 'Q1'],
        ['A02-HPE1-S6-1', PROPOSED, 'Q1'],
        ['A02-HPE1-S3-1', PROPOSED, 'Q1'],
        ['A02-HPE1-S5-2', PROPOSED, 'Q1'],
        ['A02-HPE1-V1-1', PROPOSED, 'Q1'],
        ['A02-HPE1-B9-1', PROPOSED, 'Q2'],
        ['A02-HPE1-S3-2', PROPOSED, 'Q2'],
        ['A02-HPE1-S5-3', PROPOSED, 'Q2'],
        // Stage A1 (13 November 2026), re-pinned openly: the PROPOSED restart's nine items join (decision R4, question Q6): the start, a score and
        // the ball over either end line, each stopping and restarting play, awarded to the escaping team, taken by one of its players from the
        // feet at a place the coach chooses (BEFORE: the twelve items above).
        ['A02-HPE1-T1-1', PROPOSED, 'Q6'],
        ['A02-HPE1-T1-2', PROPOSED, 'Q6'],
        ['A02-HPE1-T1-3', PROPOSED, 'Q6'],
        ['A02-HPE1-T1b-1', PROPOSED, 'Q6'],
        ['A02-HPE1-T6-1', PROPOSED, 'Q6'],
        ['A02-HPE1-T2-1', PROPOSED, 'Q6'],
        ['A02-HPE1-T3-1', PROPOSED, 'Q6'],
        ['A02-HPE1-T5-1', PROPOSED, 'Q6'],
        ['A02-HPE1-T4-1', PROPOSED, 'Q6'],
    ])
    assert.ok(configuration.realization.items.every((i) => i.basis === 'AUTHORED'), 'AUTHORED so it establishes; its category says what it is')
    assert.deepEqual(configuration.roles, [{ token: 'ESCAPING', noun: 'escaping team' }, { token: 'PRESSING', noun: null }])
    assert.deepEqual(configuration.replacements.map((x) => [x.contractId, x.replaces, x.item.itemId, x.item.category]), [[C, 'RPC-002-03.b', 'A02-HPE1-03.b', 'DRAFT_KNOWLEDGE']])
    // Stage A1, re-pinned openly: the opening holder of possession (game::PS1) joins, entailed by the PROPOSED start's awardee (was the three).
    assert.deepEqual(configuration.setsAsideChoices, ['game::V1', 'c:restated:GF2:GF2-03.e::S3', 'c:restated:GF2:GF2-03.f::S3', 'game::PS1'])
    assert.deepEqual((configuration.realization.items.find((i) => i.itemId === 'A02-HPE1-S5-1')!.value as any).offsetM, { from: 12, to: 12 }, 'never A01\'s 20 m')
    // Every request quoted is Christian's, verbatim (the package ruling's words), with its received date. Stage A1, re-pinned openly: or the
    // pressure ruling's words of the same reply, which the PROPOSED restart (question Q6) answers (was the package ruling's words only).
    const words = [...wordsOf('A02-12NOV-PACKAGE'), ...wordsOf('A02-12NOV-PRESSURE')]
    const raw = readJson(PROPOSED_HPE1_FILE)
    for (const text of [...raw.proposed.questions.map((q: any) => q.askedFor), ...raw.proposed.realization.items.map((i: any) => i.askedFor)]) {
        const quoted = String(text).split('"')[1]
        assert.ok(words.includes(quoted) && String(text).endsWith('(received 12 November 2026)'), text)
    }
    // The store it replaces into is unchanged on disk; the replacement is made on a copy, keeping the replaced item's sources.
    const store = loadDraftStore('a02-composition', { recordsSetAsideBy: 'TT-K2-RETAIN-FORM' })
    const before = JSON.stringify(store)
    const replaced = withProposedReplacements(store, configuration, 'TT-X')
    assert.equal(JSON.stringify(store), before)
    const typed = replaced.contracts.find((c) => c.contractId === C)!.items.find((i) => i.itemId === 'A02-HPE1-03.b') as any
    assert.ok(typed && !replaced.contracts.find((c) => c.contractId === C)!.items.some((i) => i.itemId === 'RPC-002-03.b') && typed.source.some((s: any) => s.rowId === 'RPC-PROP-133'))
    // Bites: each defect refuses the whole file.
    assert.equal(refusedWith(configurationCopy(() => undefined)), 'ADMITTED', 'an unchanged copy is admitted')
    const cases: Array<[string, (raw: any) => void, string]> = [
        ['OWNER_RULING', (x) => (itemOfConfiguration(x, 'A02-HPE1-B9-1').basis = 'OWNER_RULING'), 'claims OWNER_RULING'],
        ['authorizedBy', (x) => (itemOfConfiguration(x, 'A02-HPE1-B9-1').authorizedBy = 'RPC-001~SCORING-goal'), 'carries authorizedBy, which only a ruled restatement'],
        ['yieldsForRole', (x) => (itemOfConfiguration(x, 'A02-HPE1-V1-1').yieldsForRole = 'AUTHORIZED_ROLE_SCORING'), 'carries yieldsForRole, which only a ruled restatement'],
        ['an item departsFrom', (x) => (itemOfConfiguration(x, 'A02-HPE1-S2-1').departsFrom = [{ law: 'LAW-11' }]), 'carries departsFrom, which only a ruled restatement'],
        ['a constraint id', (x) => (itemOfConfiguration(x, 'A02-HPE1-B9-1').basisEvidence = 'PROPOSED: tl-v0-constraint-turnover-reward'), 'names a library constraint'],
        ['a P row', (x) => x.proposed.realization.items.push({ ...itemOfConfiguration(x, 'A02-HPE1-B1-1'), id: 'A02-HPE1-P8-1', row: 'P8', selector: 'group=ROLE_HOLDER_PRESSING' }), 'is on the participant row P8'],
        ["A01's 20 m on S5", (x) => (itemOfConfiguration(x, 'A02-HPE1-S5-1').value.offsetM = { from: 20, to: 20 }), 'copies an offset a production provisional realization holds'],
        ['a missing question id', (x) => delete itemOfConfiguration(x, 'A02-HPE1-S2-1').waitsOn, 'names no question of the file it waits on'],
        ['a missing request', (x) => delete itemOfConfiguration(x, 'A02-HPE1-S2-1').askedFor, 'does not quote the request it answers'],
        ['a standing without PROPOSED', (x) => (x.standing = 'DRAFT - TEST-ONLY'), 'does not begin DRAFT and say PROPOSED and TEST-ONLY'],
        ['evidence not labelled', (x) => (itemOfConfiguration(x, 'A02-HPE1-S6-1').basisEvidence = 'across the width'), "does not begin 'PROPOSED:' or 'ILLUSTRATIVE:'"],
        ['a ruled realization key', (x) => (x.proposed.realization.ruledOn = '2026-11-12'), 'carries ruledOn, which only a ruled realization writes'],
        ['a held role token proposed as new', (x) => (x.proposed.roles[0].token = 'BUILDING'), 'is already in the register'],
        ['a production id', (x) => (itemOfConfiguration(x, 'A02-HPE1-B3-1').id = 'A01-R1-B3-1'), 'uses an id a production contract'],
        ['an episode scope', (x) => (itemOfConfiguration(x, 'A02-HPE1-B3-1').scope = 'BUILD_OUT_EPISODE'), 'a PROPOSED item is scoped to the whole game'],
        ['a replacement typed elsewhere', (x) => (x.proposed.restatementReplacements[0].item.value.structuralRef = { contractId: 'restated:GF2', itemId: 'GF2-03.f' }), 'is not typed to an item of proposed:A02-HPE1'],
    ]
    for (const [what, change, words] of cases) {
        const said = refusedWith(configurationCopy(change))
        assert.ok(said.includes(words), `${what}: ${said}`)
    }
    // The role vocabulary of the copy: the configuration's two tokens and their nouns; the register file itself untouched.
    const register = loadRegister()
    const overlaid = registerWith(register, { episodeScopes: [], treatmentId: '', roles: configuration.roles, rolesTreatmentId: 'TT-X' })
    assert.deepEqual([overlaid.vocabularies['B1.activityRole'], overlaid.roleBlocks.coachNouns.nouns, String(overlaid.version).endsWith('+PROPOSED(TT-X)')], [['ESCAPING', 'PRESSING'], { ESCAPING: 'escaping team', PRESSING: 'pressing team' }, true])
    assert.deepEqual(register.vocabularies['B1.activityRole'], ['BUILDING', 'PRESSING'], 'the register itself is untouched')
    assert.throws(() => registerWith(register, { episodeScopes: [], treatmentId: '', roles: [{ token: 'PRESSING', noun: 'other team' }, { token: 'ESCAPING', noun: 'escaping team' }] }), /keeps the register's noun/)
    assert.throws(() => registerWith(register, { episodeScopes: [], treatmentId: '', roles: [{ token: 'ESCAPING', noun: null }, { token: 'PRESSING', noun: null }] }), /comes with the noun proposed for it/)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// T5 and T6: the realized HPE-1 game, and P0
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The bite builds of T5 and T6 (each a TEST-ONLY copy of the configuration), made once. */
let biteBuilds: Record<string, { answer: ChainAnswer; built: any; gates: any[] }> | null = null
const bites = () =>
    (biteBuilds ??= {
        noLine: buildWith('A02-HPE1-S', (r) => {
            r.proposed!.file = configurationCopy((x) => {
                x.proposed.realization.items = x.proposed.realization.items.filter((i: any) => !['A02-HPE1-S2-1', 'A02-HPE1-S5-1', 'A02-HPE1-S6-1', 'A02-HPE1-S5-2', 'A02-HPE1-S5-3'].includes(i.id))
                x.proposed.restatementReplacements = []
            })
        }),
        plainTarget: buildWith('A02-HPE1-S', (r) => {
            r.proposed!.file = configurationCopy((x) => {
                x.proposed.realization.items = x.proposed.realization.items.filter((i: any) => i.id !== 'A02-HPE1-S5-2')
                itemOfConfiguration(x, 'A02-HPE1-S3-1').value = 'line'
                itemOfConfiguration(x, 'A02-HPE1-V1-1').value = 'line_crossed'
            })
        }),
        folded: buildWith('A02-HPE1-S', (r) => {
            r.proposed!.file = configurationCopy((x) => {
                x.proposed.realization.items = x.proposed.realization.items.filter((i: any) => i.id !== 'A02-HPE1-B9-1')
                itemOfConfiguration(x, 'A02-HPE1-S3-2').value = 'zone'
            })
        }),
    })

test("T5 the realized HPE-1 game, read from the game in both blocks: roles held and exchanged; the escape line 12 m (ILLUSTRATIVE) from the escaping team's end, full width; the escaping target the zone beyond it; target_zone_entered with the three conditions, 03.b's referent the line; the pressing target the escaping team's end line, by its own event; play continues; 6 v 6; no constraint under K2; bites: no line, the plain GF2 target, the pressing objective folded", () => {
    const s = at('A02-HPE1-S')
    assert.deepEqual(hpe1GameFindings(s.built, s.answer), [])
    // Bite 1: without the line, the progression clause decides nothing: refused at structure on the open text; no game.
    assert.deepEqual([bites().noLine.answer.outcome, bites().noLine.answer.stage], ['refused', 'structure'])
    assert.ok(hpe1GameFindings(bites().noLine.built, bites().noLine.answer)[0].startsWith('no realized game'))
    // Bite 2: the escaping target at the far end line (plain GF2's): built, and T5 names the target.
    const plain = hpe1GameFindings(bites().plainTarget.built, bites().plainTarget.answer)
    assert.ok(plain.some((x) => x.includes("the escaping team's target is not the zone from the escape line")), JSON.stringify(plain))
    // Bite 3: without the pressing team's own objective (its event folded into the primary event, its target a zone beyond the line): measured,
    // the two teams' targets then meet on the line and the build is refused at validation (GA-DIRECTION), so no HPE-1 game is built; and on a
    // copy of the realized game with the pressing team's own event removed, T5 names it.
    assert.deepEqual([bites().folded.answer.outcome, bites().folded.answer.stage], ['refused', 'validation'])
    assert.ok(bites().folded.answer.reasons.some((x) => x.includes('GA-DIRECTION')), JSON.stringify(bites().folded.answer.reasons))
    assert.ok(hpe1GameFindings(bites().folded.built, bites().folded.answer)[0].startsWith('no realized game'))
    const unpressed = withoutPressingEvent(s.built)
    const folded = hpe1GameFindings(unpressed, s.answer)
    assert.ok(folded.some((x) => x.includes('the pressing team does not score by its own event')), JSON.stringify(folded))
})

/** A copy of a build whose pressing role scores by the primary event (its own event removed): the fold, on the realized games themselves. */
function withoutPressingEvent(built: any): any {
    const changed = copy({ activity: { stage: built.activity.stage, outcome: built.activity.outcome }, fixture: built.fixture })
    for (const block of changed.fixture.roleBlocks.blocks) for (const role of block.fixture.game.activityRoles) if (role.activityRole === 'PRESSING') delete role.scoresBy
    return changed
}

test('T6 P0 held (measured shape B): the pressing team scores by its own event, which takes no condition of the primary event (GA-ROLE-EVENTS), so the condition is on the escaping team\'s score only; bite: the pressing event folded back into the shared primary event is caught', () => {
    assert.deepEqual(conditionOnPressingScore(at('A02-HPE1-S').built, at('A02-HPE1-S').gates), [])
    // Bite: the pressing event folded back into the shared primary event, on a copy of the realized games: caught in each block.
    const folded = conditionOnPressingScore(withoutPressingEvent(at('A02-HPE1-S').built), at('A02-HPE1-S').gates)
    assert.equal(folded.filter((x) => x.includes('the pressing team scores by the primary event, so the condition is on its score')).length, 2, JSON.stringify(folded))
    // And the build that folds it: GA-ROLE-EVENTS reads no role scoring by an event of its own (measured: 0 instances), and no game is built.
    assert.ok(conditionOnPressingScore(bites().folded.built, bites().folded.gates).some((x) => x.includes("'takes no condition' is PASS, 0 instance(s)")))
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// T7 and T8: labels, and the treatment PROPOSED_PENDING
// ---------------------------------------------------------------------------------------------------------------------------------------

test("T7 labels: every HPE-1 item grades PROPOSED or ILLUSTRATIVE in the account, the handoff's premises and the review evidence, never APPROVED or as Christian's choice; the restatement's typed referent grades CANDIDATE; bites: an item stamped PROVISIONAL_REALIZATION_CHOICE on the chain's copy, and handed to the selection", () => {
    for (const id of ['A02-HPE1-S', 'A02-HPE1-L']) assert.deepEqual(labelRefusals(at(id).result, at(id).answer), [], id)
    const s = at('A02-HPE1-S')
    assert.ok(s.result.lines.some((l) => l.premises.some((p) => p.kind === 'PROPOSED_ITEM' && p.sixClass === 6)), 'lines rest on PROPOSED items, class 6')
    assert.ok(s.result.lines.some((l) => l.premises.some((p) => p.ref === `${C} A02-HPE1-03.b` && p.kind === 'DRAFT_ITEM')), 'the typed referent is our CANDIDATE restatement')
    assert.deepEqual([s.answer.reviewLevel?.status, s.answer.reviewLevel?.proposedElements.contractId, s.answer.reviewLevel?.basis.map((b) => b.received)], ['REVIEW_LEVEL_NOT_CHECKED_FOR_RELEASE', P, ['2026-11-12', '2026-11-12', '2026-11-12']])
    // Bite 1: one item stamped as Christian's choice on the chain's copy: the labels say so.
    const doctored = copy(s.answer)
    doctored.contracts.find((c) => c.contractId === P)!.items[0].category = 'PROVISIONAL_REALIZATION_CHOICE'
    assert.ok(labelRefusals(s.result, doctored).some((x) => x.includes('A02-HPE1-B1-1 is stamped PROVISIONAL_REALIZATION_CHOICE')))
    // Bite 2: the same handed to the selection: refused whole (a PROPOSED configuration is read only whole).
    const configuration = loadProposedRealization()
    configuration.realization.items[0].category = 'PROVISIONAL_REALIZATION_CHOICE'
    const consume = s.request.consume!
    const upstream: UpstreamDecisions = {
        gameProblem: { gameProblemId: consume.gameProblem.gameProblemId, step1Basis: consume.gameProblem.basis as UpstreamDecisions['gameProblem']['step1Basis'], label: consume.gameProblem.label },
        gameForm: copy(consume.gameForm),
        reviewManipulations: { basis: 'K2_REVIEW_ONLY', set: [], rule: consume.k2!.rule, limit: consume.k2!.limit, cited: consume.k2!.cited },
        proposedRealization: { realization: configuration.realization, roles: configuration.roles, treatmentId: 'BITE-T7' },
    }
    const drafts = loadDraftStore('a02-composition', { recordsSetAsideBy: 'TT-K2-RETAIN-FORM' })
    assert.throws(() => selectFor('A02', null, productionRecords, undefined, { contracts: drafts.contracts, draftsAdmitted: true }, upstream), /a PROPOSED configuration whole/)
})

test('T8 the treatment PROPOSED_PENDING: one pending entry, naming Q2 and the pressing team\'s own event, in both blocks; bites: the same finding on a non-PROPOSED item still refuses, a PROPOSED own event the context does not approve still refuses, and without the treatment the build refuses exactly as before', () => {
    const pending = at('A02-HPE1-S').answer.reviewLevel!.pendingApproval
    assert.deepEqual(pending.map((e) => [e.treatmentId, e.item, e.questionId, e.blocks]), [['TT-PROPOSED-PENDING', `${P}::A02-HPE1-B9-1`, 'Q2', ['ESCAPING=TEAM_AT_AXIS_START,PRESSING=TEAM_AT_AXIS_END', 'ESCAPING=TEAM_AT_AXIS_END,PRESSING=TEAM_AT_AXIS_START']]])
    assert.ok(pending[0].finding.startsWith(`the role PRESSING (c:${P}:A02-HPE1-B1-2) scores by its own event "line_crossed" on ${P}::A02-HPE1-B9-1, whose basis is AUTHORED`), pending[0].finding)
    assert.deepEqual(at('A02-HPE1-L').answer.reviewLevel!.pendingApproval.map((e) => e.item), [`${P}::A02-HPE1-B9-1`])
    // The guard's own reading of a realized block, read again here, so the split can be run on its findings.
    const block = blocksOf(at('A02-HPE1-S').built)[0]
    const index = indexRegister(registerWith(loadRegister(), { episodeScopes: [], treatmentId: '', roles: loadProposedRealization().roles, rolesTreatmentId: 'T8' }))
    const contract = loadDraftStore('a02-composition', { recordsSetAsideBy: 'TT-K2-RETAIN-FORM' }).contracts.find((c) => c.contractId === C)!
    const support = [{ elementId: `c:${P}:A02-HPE1-B1-2`, role: 'PRESSING', items: [{ contractId: P, itemId: 'A02-HPE1-B9-1', basis: 'AUTHORED', authorizedBy: null, realizes: 'RPC-002' }] }]
    const readOf = (approved: string[]) => {
        const grounds: any[] = []
        const found = contextScoringFindings('RPC-002', contract, block.fixture.game, approved, undefined, undefined, support, index, [], grounds)
        return { found, grounds }
    }
    const read = readOf(rpcLibrary.scoringEventsForContext('RPC-002'))
    const role = read.found.filter((x) => x.startsWith('the role PRESSING'))
    assert.deepEqual([role.length, read.grounds.length], [1, 1])
    assert.deepEqual(splitProposedPending(read.found, read.grounds, () => true).moved.map((g) => g.itemId), ['A02-HPE1-B9-1'])
    // Bite 1: the same finding on an item that is not PROPOSED (a CANDIDATE, an ILLUSTRATIVE or a knowledge item) stays refusing.
    assert.ok(splitProposedPending(read.found, read.grounds, () => false).refusing.includes(role[0]))
    const illustrative = buildWith('A02-HPE1-S', (r) => {
        r.proposed!.file = configurationCopy((x) => (itemOfConfiguration(x, 'A02-HPE1-B9-1').basisEvidence = 'ILLUSTRATIVE: the pressing team\'s own event (a negative control)'))
    })
    assert.deepEqual([illustrative.answer.outcome, illustrative.answer.stage, illustrative.answer.reviewLevel?.pendingApproval], ['refused', 'validation', []])
    assert.ok(illustrative.answer.reasons.some((x) => x.includes(`scores by its own event "line_crossed" on ${P}::A02-HPE1-B9-1`)), JSON.stringify(illustrative.answer.reasons))
    // Bite 2: a PROPOSED own event the context does not approve: its authorization finding records no basis ground, so it stays refusing.
    const unapproved = readOf(['target_zone_entered', 'gate', 'target_player'])
    const split = splitProposedPending(unapproved.found, unapproved.grounds, () => true)
    assert.ok(split.refusing.some((x) => x.includes('which the Representative Performance Context RPC-002 does not approve')), JSON.stringify(split.refusing))
    // Bite 3: without the treatment the build refuses on that finding, in each block, exactly as before (the guard's words).
    const without = buildWith('A02-HPE1-S', (r) => (r.proposed!.pendingTreatmentId = null))
    assert.deepEqual([without.answer.outcome, without.answer.stage, without.answer.reviewLevel?.pendingApproval], ['refused', 'validation', []])
    // (The chain prints its own sentences without a gendered pronoun, `withoutGenderedPronouns`; the pending entry keeps the guard's words.)
    for (const b of pending[0].blocks) assert.ok(without.answer.reasons.includes(`block ${b}: ${withoutGenderedPronouns(pending[0].finding)}`), `${b}: ${JSON.stringify(without.answer.reasons)}`)
})

// ---------------------------------------------------------------------------------------------------------------------------------------
// No production module reaches the configuration
// ---------------------------------------------------------------------------------------------------------------------------------------

test('the static scan: the configuration, its loader, its replacements and its treatment kinds are named by no production module; no production knowledge holds the PROPOSED category or the ESCAPING token', () => {
    const SRC = path.resolve(HERE, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name)
            if (fs.statSync(full).isDirectory()) walk(full)
            else if (name.endsWith('.ts') && !name.endsWith('.unit.ts')) files.push(full)
        }
    }
    walk(SRC)
    const allowed = new Set(['derivation/draft-store.ts', 'design-reasoning/handoff.ts'].map((f) => path.join(SRC, 'system', f)))
    // (The treatment kinds' names appear in the TEST-ONLY branches' comments of the bundled modules; the loader, its composition and the file do not.)
    for (const word of ['loadProposedRealization', 'withProposedReplacements', 'a02-proposed', 'hpe1.PROPOSED']) {
        const naming = files.filter((f) => !allowed.has(f) && fs.readFileSync(f, 'utf8').includes(word)).map((f) => path.relative(SRC, f))
        assert.deepEqual(naming, [], `${word} is named by: ${naming.join(', ')}`)
    }
    const knowledge = ['contracts.json', 'corpus-restatements.json', 'provisional-realizations.json', 'sport-profile-soccer.json'].map((f) => path.join(WT, 'docs', 'audits', 'conformance', 'stage-b', f))
    for (const f of [...knowledge, path.join(WT, 'docs', 'audits', 'conformance', 'register-2026-09-18.json'), path.join(WT, 'back', 'src', 'system', 'test-library', 'library', 'learning-goal-authorizations.json')]) {
        const text = fs.readFileSync(f, 'utf8')
        assert.ok(!text.includes('"category": "PROPOSED"') && !text.includes('ESCAPING') && !text.includes('proposed:A02'), path.basename(f))
    }
})

test('registered', () => {
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-hpe1.unit.ts'))
})

if (MAIN) quiet(`a02 HPE-1 (stage B1): ${passed} passed`)
