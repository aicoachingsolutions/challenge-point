/**
 * **Stage B3 of the A02 complete-activity package: the review-level activity's evidence, Christian's acceptance walkthrough read from the
 * built game's structure, the rewording measurement and the safeguard check on the HPE-1 runs** (12 November 2026). TEST-ONLY review evidence:
 * nothing here is served to a coach, written to production knowledge or approved wording, or an authorization.
 *
 * Christian, received 12 November 2026: "The resulting activity must make the intended High Press Escape problem recognizable and actionable
 * for a coach." "I want to see where coordinated pressure comes from, how players encounter information about that pressure, what genuine
 * escape opportunities exist, and how the game's consequences make successful solutions meaningful." "A generic Directional Possession Game
 * with additional wording would not, by itself, establish that we've achieved this." "That evaluation will be part of my ecological review."
 * (all four received 12 November 2026)
 *
 * What is built (each run through the handoff and the real chain, its request, answer and built activity captured):
 *   the three HPE-1 runs of the inputs (A02-HPE1, the review-level run; A02-HPE1-S; A02-HPE1-L), as they stand after stages B1 and B2;
 *   A02-GF2W, the walkthrough's negative control: GF2 as A02-D builds it (every condition item withheld, TEST-ONLY; the LAW-11 stand-in),
 *     without the PROPOSED configuration, our CANDIDATE wording printed beside its text (the wording enters no structure);
 *   A02-HPE1 under the two rewordings of the A02-2~ family (a02-safeguards.unit.ts `reworded`: the goal's wording rewritten in the knowledge
 *     copy and in the row the chain reads; restored, the restore asserted).
 * What is pinned, every value measured first (scratchpad pkg3/B3):
 *   the stops; the walkthrough (4 of 4 established on A02-HPE1's realized game, none on A02-GF2W's), with its bites (the walkthrough reads no
 *   sentence; each question's predicate bites on a changed copy of the game); the rewordings (no knowledge-governed result moves; the engine
 *   lenses do, reported only); the safeguard check on the HPE-1 runs (the progression clause read through the configuration's replacement);
 *   the LAW-11 premise of the review-level run graded PROPOSED, never a ruling; the four-part print; appendix F of the A02 evidence.
 * The walkthrough is a development finding only, never ecological validation (Christian keeps that for the ecological review).
 *
 * Imported (by a02-evidence.unit.ts, for appendix F), the runs are built and none of the tests below runs.
 * Run: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/a02-acceptance.unit.ts
 */
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { loadProposedRealization } from '../derivation/draft-store'
import { loadCandidateWording } from '../rendering/candidate-coach-wording'
import { loadCandidateCoachRules } from '../sport-module/candidate-coach-rules'
import { actionClassesIn } from '../sport-module/action-words'
import { eventMeaningStanding } from '../sport-module/primary-scoring'
import { rpcLibrary } from '../sport-module/rpc-library'
import * as S from './a02-safeguards.unit'
import { inputs as a02Inputs, quotedSpans } from './a02.unit'
import { displayCell } from './assembly-display'
import { citedDateOf } from './assembly'
import { approvedSourceOf, engineLines, fourPartPrint, printRefusals, PrintedOnly, SaidSentence } from './four-part-print.unit'
import { CaseInput, ChainAnswer, ChainRequest, HandoffResult, runHandoff } from './handoff'
import { candidateWordingSourcesOf, holdsGenderedPronoun, realChain, withoutGenderedPronouns } from './handoff-chain.unit'
import { handoffReportText, plain, quoted, show } from './handoff-report'
import { committedKnowledge, DesignKnowledge } from './knowledge'
import { classOf, Finding, OpenDisconnection, ownershipOf, safeguardRunOf } from './safeguards'

const quiet = console.log
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
if (MAIN) quiet(`stage B3 of the A02 complete-activity package: the evidence, the acceptance walkthrough, the rewordings (Christian's reply received 12 November 2026)`)

const HERE = __dirname
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const json = (v: unknown) => JSON.stringify(v)
const sha = (v: unknown) => crypto.createHash('sha256').update(json(v)).digest('hex')
const short = (v: unknown) => sha(v).slice(0, 12)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The runs (read-only wrap of the build entry, as a02-hpe1.unit.ts and a02-hpe1-wording.unit.ts wrap it)
// ---------------------------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const buildModule = require('../rendering/build-activity')
const entry = buildModule.buildActivityUnderAuthorizationRecords
let lastBuilt: any = null
buildModule.buildActivityUnderAuthorizationRecords = (...args: unknown[]) => (lastBuilt = entry(...args))

export interface Made {
    id: string
    result: HandoffResult
    request: ChainRequest
    answer: ChainAnswer
    /** The built activity (its fixture holds the realized game in each role block), captured from the build entry. */
    built: any
}
export const HPE1_IDS = ['A02-HPE1', 'A02-HPE1-S', 'A02-HPE1-L']
export const REVIEW_RUN = 'A02-HPE1'
export const GF2W = 'A02-GF2W'
export const REWORDINGS = ['reversed', 'neutral']
export const reworded = (name: string) => `${REVIEW_RUN}~${name}`
export const B3_RUN_IDS = [...HPE1_IDS, GF2W, ...REWORDINGS.map(reworded)]

const caseOf = (id: string): CaseInput => {
    const c = a02Inputs.cases.find((x) => x.id === id)
    assert.ok(c, `the inputs hold ${id}`)
    return copy(c)
}
function made(c: CaseInput, kk: DesignKnowledge): Made {
    let request: ChainRequest | null = null
    let answer: ChainAnswer | null = null
    let built: any = null
    const result = runHandoff(
        c,
        a02Inputs,
        {
            build: (r) => {
                request = copy(r)
                lastBuilt = null
                answer = realChain.build(r)
                built = lastBuilt
                return answer
            },
        },
        kk,
    )
    assert.ok(request && answer, `${c.id} reached the chain`)
    return { id: c.id, result, request: request as ChainRequest, answer: answer as ChainAnswer, built }
}
/** A02-GF2W: A02-D's case under its own id and label (the walkthrough's negative control). */
function gf2wCase(): CaseInput {
    const c = caseOf('A02-D') as CaseInput & { basedOn?: string }
    delete c.basedOn
    c.id = GF2W
    c.label = `${GF2W}, the walkthrough's negative control: GF2 as A02-D builds it (every condition item withheld, TEST-ONLY; the TEST-ONLY LAW-11 stand-in), without the PROPOSED configuration; our CANDIDATE wording is printed beside its text and enters no structure`
    return c
}
/** Every stage-B3 run, built afresh (the evidence builds them twice, and the two generations must be identical). */
export function buildB3(): Map<string, Made> {
    const out = new Map<string, Made>()
    for (const id of HPE1_IDS) out.set(id, made(caseOf(id), committedKnowledge()))
    out.set(GF2W, made(gf2wCase(), committedKnowledge()))
    for (const name of REWORDINGS)
        S.reworded(name, (kk) => {
            const c = caseOf(REVIEW_RUN)
            c.id = reworded(name)
            c.label = `${REVIEW_RUN} under the ${name} wording (the goal's wording rewritten in the knowledge copy and in the row the chain reads, as for A02-2~)`
            out.set(c.id, made(c, kk))
        })
    return out
}
export const B3 = buildB3()
const at = (id: string, from: Map<string, Made> = B3): Made => {
    const m = from.get(id)
    assert.ok(m, `no stage-B3 run ${id}`)
    return m
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Labels: each path's line as the handoff grades it (by the item's category first, then its origin and basis: handoff.ts `itemPremise`)
// ---------------------------------------------------------------------------------------------------------------------------------------

const TAG: Record<string, string> = {
    PROPOSED_ITEM: 'PROPOSED',
    ILLUSTRATIVE_ITEM: 'ILLUSTRATIVE',
    SESSION_ILLUSTRATIVE: 'ILLUSTRATIVE (session value)',
    DRAFT_ITEM: 'CANDIDATE (our restatement)',
    RESTATED_ITEM: 'CANDIDATE (our restatement of the knowledge workbooks)',
    KNOWLEDGE_RULING_ITEM: "RULING (Christian's, recorded on the knowledge item)",
    STANDING_DECISION: "RULING (a standing decision recording Christian's)",
    ASSUMED_ITEM: 'OURS (an assumption in our restatement)',
    ASSUMED_BOUND: 'OURS (the one value a bound assumed in our restatement admits)',
    COACH: 'the coach decides',
    DECLARED_ABSENCE: 'CANDIDATE (an absence our restatement declares)',
}
const tagOf = (p: { kind: string; standing: string | null; provisional: boolean }): string => TAG[p.kind] ?? `${p.standing ?? 'no standing'}${p.provisional ? ', provisional' : ''}`
/** The labels of the line at a path: each premise's, read from the handoff's grading of the run; 'no line' where the run holds none. */
export function labelsAt(m: Made, p: string): string {
    const lines = m.result.lines.filter((l) => l.path === p)
    if (!lines.length) return 'no line'
    return [...new Set(lines.flatMap((l) => (l.kind === 'NOT_ESTABLISHED' ? ['NOT_ESTABLISHED'] : l.premises.map(tagOf))))].join(' + ')
}
const cite = (m: Made, paths: string[]) => paths.map((p) => `${p} [${labelsAt(m, p)}]`)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The acceptance walkthrough: Christian's four questions, each answered from the realized game's elements in every role block, never from a
// sentence (the functions below read the built fixture and the chain's account only; test 'reads no sentence' holds it)
// ---------------------------------------------------------------------------------------------------------------------------------------

const QUESTIONS = [
    'where coordinated pressure comes from',
    'how players encounter information about that pressure',
    'what genuine escape opportunities exist',
    "how the game's consequences make successful solutions meaningful",
]
/** The game element kinds the walkthrough knows; an element of any other kind (a restriction, a zone with an access rule) is named. */
const KNOWN_ELEMENT_KINDS = ['envelope', 'space', 'value', 'activityRoles', 'objectives', 'objects', 'transitions', 'performers', 'possession']
interface Block {
    tag: string
    game: any
    holders: Record<string, string> | null
    geometry: Map<string, any>
    lengthM: number
    widthM: number
}
function blocksOf(built: any): Block[] {
    const blocks: any[] = built?.fixture?.roleBlocks?.blocks ?? []
    const of = (fixture: any, tag: string, holders: Record<string, string> | null): Block => ({
        tag,
        game: fixture.game,
        holders,
        geometry: new Map<string, any>(((fixture.status?.geometry ?? []) as any[]).map((g) => [g.path, g.geometry])),
        lengthM: Number(fixture.envelope?.lengthM),
        widthM: Number(fixture.envelope?.widthM),
    })
    if (blocks.length) return blocks.map((b) => of(b.fixture, `block ${b.blockId}`, b.holders as Record<string, string>))
    return built?.fixture?.game ? [of(built.fixture, 'the one game', null)] : []
}
const regionPath = (r: any) => `space.regions[${r.elementId}]`
const roleOf = (game: any, token: string) => ((game.activityRoles ?? []) as any[]).find((r) => r.activityRole === token) ?? null
const objectiveOf = (game: any, team: string | undefined) => ((game.objectives ?? []) as any[]).find((o) => o.team === team && o.role === 'PRIMARY_SCORING') ?? null
const regionOfRef = (game: any, ref: any) => ((game.space?.regions ?? []) as any[]).find((r) => r.elementId === `c:${ref?.structuralRef?.contractId}:${ref?.structuralRef?.itemId}`) ?? null
const interval = (b: Block, region: any, axis: 'along' | 'across') => (region ? (b.geometry.get(`${regionPath(region)}.position.${axis}`)?.interval ?? null) : null)
/** The end line a team defends: the team at the axis start defends the 0 end (realization/team-ends.ts reads it so). */
const endOf = (b: Block, team: string | undefined) => (team === 'TEAM_AT_AXIS_START' ? 0 : b.lengthM)
const conditionOf = (game: any, type: string) => ((game.value?.primaryEvent?.conditions ?? []) as any[]).find((c) => c.type === type) ?? null
/** The marked line the progression condition is stated beyond (read from the condition's referent, never from an id). */
const escapeLineOf = (game: any) => regionOfRef(game, conditionOf(game, 'progression')?.referents)
const fullWidth = (b: Block, region: any) => {
    const i = interval(b, region, 'across')
    return !!i && Math.min(i.from, i.to) === 0 && Math.max(i.from, i.to) === b.widthM
}

export interface Fact {
    id: string
    what: string
    holds: boolean
    /** What was read, block by block (or why it does not hold). */
    evidence: string[]
    /** The elements read, each with the labels of its line (the handoff's grading). */
    cites: string[]
}
/** Stage A2: one of RPC-002's approved rows read against the realized game (OURS: which element carries it; the verdict computed). */
export interface ApprovedRowReading {
    rowId: string
    words: string
    category: string
    verdict: 'held' | 'partly held' | 'not held' | 'punished' | 'partly punished' | 'not punished' | 'rewarded' | 'not rewarded' | 'not addressed' | 'not read'
    reading: string
    cites: string[]
}
export interface Answer {
    n: number
    question: string
    facts: Fact[]
    /** Every structural fact holds, in every block. */
    established: boolean
    /** Stage A2: the answer as printed (Q1_VERDICT for question 1). */
    verdict: string
    /** Stage A2: RPC-002's approved rows read against the game (question 2: information; question 4: degenerate solutions). */
    rows: ApprovedRowReading[]
    /** Stage A2: question 3's LAW-11 arms (the built one read from the laws account; the other described). */
    arms: string[]
    /** FIX (13 November 2026, V4 finding 1): what a fact of the answer does not cover, read from the game (question 4: the end-line restart). */
    limits: string[]
}
export interface Walkthrough {
    runId: string
    answers: Answer[]
    count: number
}

/** One fact read in every block: holds only where it holds in each (a run with no realized game holds none). */
function fact(m: Made, blocks: Block[], id: string, what: string, read: (b: Block) => { holds: boolean; said: string; paths: string[] }): Fact {
    if (!blocks.length) return { id, what, holds: false, evidence: ['no realized game'], cites: [] }
    const reads = blocks.map((b) => ({ b, r: read(b) }))
    return {
        id,
        what,
        holds: reads.every((x) => x.r.holds),
        evidence: reads.map((x) => `${x.b.tag}: ${x.r.holds ? '' : 'DOES NOT HOLD: '}${x.r.said}`),
        cites: cite(m, [...new Set(reads.flatMap((x) => x.r.paths))]),
    }
}

/** The walkthrough of one run, from its built game and the chain's account (never a sentence). */
export function walkthroughOf(m: Made, built: any = m.built, answer: ChainAnswer = m.answer): Walkthrough {
    const blocks = blocksOf(built)
    const approved = rpcLibrary.scoringEventsForContext('RPC-002')
    const escapingOf = (b: Block) => roleOf(b.game, 'ESCAPING')
    const pressingOf = (b: Block) => roleOf(b.game, 'PRESSING')
    const rolePath = (r: any, field: string) => `activityRoles[${r?.elementId}].${field}`
    const objPath = (o: any, field: string) => `objectives[${o?.elementId}].${field}`

    // Q1: where coordinated pressure comes from.
    // FIX (13 November 2026, V4 L8), re-pinned openly: 1a said 'one team presses for the whole block'; the structure gives a role, not pressing.
    const f1a = fact(m, blocks, '1a', 'one team holds the pressing role for the whole block: a role held until the coach calls the exchange, the other team holding the other role', (b) => {
        const p = pressingOf(b)
        const e = escapingOf(b)
        const holds = !!p && !!e && p.exchange === 'COACH_CALLS' && !!b.holders?.PRESSING && b.holders.PRESSING !== b.holders.ESCAPING
        return { holds, said: holds ? `the pressing role is held by ${b.holders!.PRESSING}, the escaping role by ${b.holders!.ESCAPING}, exchanged when the coach calls it` : 'no team holds a pressing role', paths: p ? [rolePath(p, 'activityRole'), rolePath(p, 'exchange')] : [] }
    })
    const f1b = fact(m, blocks, '1b', "the pressing team scores only by its own event, over the line at the end the escaping team defends, with the ball: so a regain near that end is its shortest route to a point", (b) => {
        const p = pressingOf(b)
        const o = objectiveOf(b.game, b.holders?.PRESSING)
        const target = regionOfRef(b.game, o?.reference)
        const along = interval(b, target, 'along')
        const escEnd = endOf(b, b.holders?.ESCAPING)
        const holds = !!p && !!p.scoresBy && approved.includes(String(p.scoresBy)) && target?.noun === 'line' && !!along && along.from === escEnd && along.to === escEnd
        return {
            holds,
            said: holds ? `its event ${p.scoresBy} (an approved event of the context), its target the line at ${escEnd} m, the end the escaping team defends` : `the pressing team's score: event ${p?.scoresBy ?? 'none of its own'}, target ${target?.noun ?? 'none'} at ${show(along)}`,
            paths: [...(p ? [rolePath(p, 'scoresBy')] : []), ...(o ? [objPath(o, 'reference')] : []), ...(target ? [`${regionPath(target)}.noun`, `${regionPath(target)}.position.along`] : [])],
        }
    })
    const transition = (b: Block) => ((b.game.transitions ?? []) as any[]).find((t) => (t.selector ?? []).some((s: any) => s.attribute === 'trigger' && s.value === 'POSSESSION_CHANGE'))
    const f1c = fact(m, blocks, '1c', 'play continues on every change of possession: a regain is at once a chance to score, and the team that lost the ball is next to its own end line', (b) => {
        const t = transition(b)
        const holds = t?.playState === 'CONTINUE'
        return { holds, said: holds ? 'on a change of possession play continues (no stoppage, no restart)' : `on a change of possession: ${t?.playState ?? 'no transition'}`, paths: t ? [`transitions[${t.elementId}].playState`] : [] }
    })
    /*
     * Stage A2 (13 November 2026, the lead's decision W3), re-pinned openly. BEFORE: 1d held where the two role targets differ in their nouns (a
     * zone against a line), which says nothing about position and would fail an equally High Press Escape game scored over a line. AFTER: 1d
     * reads the targets' positions only: both teams' targets lie at or near one end (each begins within the half of the area at that end), and
     * where the game holds roles that end is the one the escaping team defends. Plain GF2's targets are the two end lines, one at each end.
     */
    const f1d = fact(m, blocks, '1d', "both teams' targets lie at or near one end, the end the escaping team defends: the pressing team's at that end line, the escaping team's beginning at the marked line near it (play concentrated at one end, not two mirrored attacks; read from the targets' positions, never their nouns)", (b) => {
        const targets = ((b.game.objectives ?? []) as any[]).filter((o) => o.role === 'PRIMARY_SCORING').map((o) => regionOfRef(b.game, o.reference)).filter(Boolean)
        const reach = (r: any, end: number) => {
            const i = interval(b, r, 'along')
            return i ? Math.min(Math.abs(i.from - end), Math.abs(i.to - end)) : Number.POSITIVE_INFINITY
        }
        const ends = [0, b.lengthM].filter((end) => targets.length === 2 && targets[0].elementId !== targets[1].elementId && targets.every((r) => reach(r, end) <= b.lengthM / 2))
        const escEnd = b.holders?.ESCAPING ? endOf(b, b.holders.ESCAPING) : null
        const holds = ends.length === 1 && (escEnd === null || ends[0] === escEnd)
        return {
            holds,
            said: holds
                ? `both targets begin within ${b.lengthM / 2} m of the end at ${ends[0]} m (${targets.map((r) => `${r.noun} over ${show(interval(b, r, 'along'))}`).join(', ')})${escEnd === null ? '' : ', the end the escaping team defends'}`
                : `the targets lie over ${targets.map((r) => show(interval(b, r, 'along'))).join(' and ') || 'nothing'}: ${ends.length ? `near the end at ${ends.join(' and ')} m, not the escaping team's` : 'not both near one end'}`,
            paths: targets.map((r) => `${regionPath(r)}.position.along`),
        }
    })
    // Stage A2 (decision W3): the recurrence Christian asked for rests on the PROPOSED restart (question Q6): at the start, after each point and
    // when the ball goes over an end line play stops and the escaping team restarts it (read from the realized transitions, never a sentence).
    const restartTriggers = ['START', 'SCORE', 'OUT_END_LINE']
    const triggerOf = (t: any) => ((t.selector ?? []) as any[]).find((s) => s.attribute === 'trigger')?.value
    // FIX (V4 L9), re-pinned openly: '(the recurrence: the PROPOSED restart, question Q6)'; coordination is not established, so the request is
    // not shown met: the restart is our PROPOSED answer to it.
    const f1e = fact(m, blocks, '1e', 'play restarts with the escaping team at the start, after each point and when the ball goes over an end line, so the problem begins again near its own end (our PROPOSED answer to the recurrence: the restart, question Q6)', (b) => {
        const ts = ((b.game.transitions ?? []) as any[]).filter((t) => restartTriggers.includes(triggerOf(t)) && t.playState === 'STOP_RESUME' && t.awardedTo === 'ROLE_HOLDER_ESCAPING')
        const found = restartTriggers.filter((x) => ts.some((t) => triggerOf(t) === x))
        const holds = found.length === restartTriggers.length && !!b.holders?.ESCAPING
        return { holds, said: holds ? `restarts awarded to the escaping team (${b.holders!.ESCAPING}) at ${found.join(', ')}` : `restarts awarded to the escaping team at: ${found.join(', ') || 'none'}`, paths: ts.flatMap((t) => [`transitions[${t.elementId}].awardedTo`, `transitions[${t.elementId}].playState`]) }
    })

    // Q2: how players encounter information about that pressure.
    const f2a = fact(m, blocks, '2a', 'every player plays live, in equal numbers: two teams of equal outfield count, no goalkeeper, no neutral player, no player limited in what may be done', (b) => {
        const teams = (b.game.performers?.teams ?? []) as any[]
        const holds = teams.length === 2 && teams[0].outfieldCount === teams[1].outfieldCount && teams.every((t) => !t.goalkeeper) && !b.game.performers?.neutrals
        return { holds, said: `teams ${teams.map((t) => `${t.outfieldCount}${t.goalkeeper ? `+${t.goalkeeper} goalkeeper` : ''}`).join(' v ')}${b.game.performers?.neutrals ? ', neutral players' : ''}`, paths: teams.map((t) => `performers.teams[${t.elementId}].outfieldCount`) }
    })
    const f2b = fact(m, blocks, '2b', "a marked line across the full width, near the escaping team's own end, which the PROPOSED item names a perceptual reference (its selector; the realized functions field itself holds no value, not constrained): the place where the press has to be beaten is visible", (b) => {
        const line = escapeLineOf(b.game)
        const along = interval(b, line, 'along')
        const escEnd = endOf(b, b.holders?.ESCAPING)
        const near = !!along && along.from === along.to && Math.abs(along.from - escEnd) < b.lengthM / 2
        const reference = ((line?.selector ?? []) as any[]).some((s) => s.attribute === 'functions' && s.value === 'perceptual-reference')
        const holds = line?.noun === 'line' && near && fullWidth(b, line) && reference
        return { holds, said: line ? `the ${line.noun} at ${along?.from} m (the escaping team's end at ${escEnd} m), across ${show(interval(b, line, 'across'))}${reference ? ', a perceptual reference' : ''}` : 'no marked line the condition is stated beyond', paths: line ? [`${regionPath(line)}.noun`, `${regionPath(line)}.position.along`, `${regionPath(line)}.position.across`, `${regionPath(line)}.functions`] : [] }
    })
    const otherKinds = (b: Block) => Object.keys(b.game).filter((k) => KNOWN_ELEMENT_KINDS.indexOf(k) < 0)
    const constraintsOf = () => (answer.account?.constraints ?? null) as string[] | null
    const f2c = fact(m, blocks, '2c', 'no element tells either team how to press or how to escape: no constraint or manipulation is applied (the review pathway\'s K2 result, the empty set) and the game holds no element of another kind (no restriction, no zone with an access rule)', (b) => {
        const constraints = constraintsOf()
        const holds = !!constraints && constraints.length === 0 && otherKinds(b).length === 0
        return { holds, said: `constraints ${show(constraints)} under ${answer.observed?.constraintAuthority ?? 'no authority'}; element kinds outside the known set: ${otherKinds(b).join(', ') || 'none'}`, paths: [] }
    })

    // Q3: what genuine escape opportunities exist.
    const f3a = fact(m, blocks, '3a', "the escaping team's target is the whole region beyond the marked line, to the far end line", (b) => {
        const o = objectiveOf(b.game, b.holders?.ESCAPING)
        const target = regionOfRef(b.game, o?.reference)
        const line = escapeLineOf(b.game)
        const along = interval(b, target, 'along')
        const lineAt = interval(b, line, 'along')?.from
        const far = b.lengthM - endOf(b, b.holders?.ESCAPING)
        const holds = !!escapingOf(b) && target?.noun === 'zone' && !!along && lineAt !== undefined && Math.min(along.from, along.to) === Math.min(lineAt, far) && Math.max(along.from, along.to) === Math.max(lineAt, far)
        return { holds, said: target ? `the escaping team's target: the ${target.noun} over ${show(along)}; the line at ${lineAt ?? 'none'}, the far end line at ${far} m` : 'no team holds the escaping role, so no escape target', paths: [...(o ? [objPath(o, 'reference')] : []), ...(target ? [`${regionPath(target)}.noun`, `${regionPath(target)}.position.along`] : [])] }
    })
    const f3b = fact(m, blocks, '3b', 'the line and the target run the full width: escape is possible anywhere across the area', (b) => {
        const line = escapeLineOf(b.game)
        const target = regionOfRef(b.game, objectiveOf(b.game, b.holders?.ESCAPING)?.reference)
        const holds = !!line && !!target && fullWidth(b, line) && fullWidth(b, target)
        return { holds, said: `the line across ${show(interval(b, line, 'across'))}, the target across ${show(interval(b, target, 'across'))}`, paths: [line, target].filter(Boolean).map((r) => `${regionPath(r)}.position.across`) }
    })
    const f3c = fact(m, blocks, '3c', "the escaping team's scoring event is one of the context's approved scoring events (RPC-002), and enters the region beyond the line (target_zone_entered: the event's meaning, a dribble in or a controlled reception there, is said by our restatement and the renderer, not read here)", (b) => {
        const kind = String(b.game.value?.primaryEvent?.kind ?? '')
        const holds = approved.includes(kind) && kind === 'target_zone_entered' && !!escapingOf(b) && !escapingOf(b).scoresBy
        return { holds, said: `the primary event ${kind || 'none'}${approved.includes(kind) ? ' (approved for RPC-002)' : ''}${escapingOf(b) ? ', scored by the escaping team' : ', no escaping team'}`, paths: ['value.primaryEvent.kind'] }
    })
    const f3d = fact(m, blocks, '3d', 'no element removes a passing or dribbling option: the form\'s own exclusion of rules removing passing options (GF2-22) is among the knowledge the chain derived from, and no constraint or element of another kind is applied', (b) => {
        const gf222 = answer.contracts.some((c) => c.items.some((i) => i.itemId === 'GF2-22'))
        const constraints = constraintsOf()
        const holds = gf222 && !!constraints && constraints.length === 0 && otherKinds(b).length === 0
        return { holds, said: `GF2-22 ${gf222 ? 'derived from' : 'NOT among the contracts'}; constraints ${show(constraints)}; other element kinds: ${otherKinds(b).join(', ') || 'none'}`, paths: [] }
    })

    // Q4: how the game's consequences make successful solutions meaningful.
    // Stage A2, re-pinned openly: 'from an attack that began against coordinated pressure' reads 'in a possession that began ...' (Christian keeps a
    // restart, a change of possession and a new attack apart, received 8 November 2026); the predicate is unchanged.
    // FIX (V4 L1), re-pinned openly: 'only in a possession that began against coordinated pressure' was stricter than the condition (the sequence
    // begins when the pressure is faced, not when the possession starts); the predicate is unchanged.
    const f4a = fact(m, blocks, '4a', 'the escaping team scores only if, in that possession, it faced coordinated pressure before scoring, and only beyond the marked line (the conditions on its event, the whole game)', (b) => {
        const origin = conditionOf(b.game, 'origin')
        const progression = conditionOf(b.game, 'progression')
        const line = escapeLineOf(b.game)
        const holds = origin?.value === 'established coordinated pressure' && progression?.value === 'beyond' && line?.noun === 'line' && !!escapingOf(b) && !escapingOf(b).scoresBy
        return {
            holds,
            said: origin || progression ? `origin '${origin?.value ?? 'none'}', progression '${progression?.value ?? 'none'}' the ${line?.noun ?? 'no referent'}` : 'no condition on the scoring event',
            paths: [...(origin ? [`value.primaryEvent.conditions[${origin.elementId}].value`] : []), ...(progression ? [`value.primaryEvent.conditions[${progression.elementId}].referents`, `value.primaryEvent.conditions[${progression.elementId}].value`] : [])],
        }
    })
    const f4b = fact(m, blocks, '4b', 'and only if it keeps the ball through its next action: a ball merely cleared or played into the region and lost scores nothing', (b) => {
        const control = conditionOf(b.game, 'control')
        const holds = control?.value === 'retains possession through the next action'
        return { holds, said: control ? `control '${control.value}'` : 'no control condition', paths: control ? [`value.primaryEvent.conditions[${control.elementId}].value`] : [] }
    })
    const f4c = fact(m, blocks, '4c', "losing the ball exposes the escaping team's own end line to the pressing team's score at once (the pressing team's target at that end, and play continuing on the change of possession)", (b) => ({
        holds: f1b.holds && f1c.holds,
        said: f1b.holds && f1c.holds ? "read from 1b and 1c" : 'the pressing team has no target at the escaping team\'s end, or play does not continue',
        paths: [],
    }))
    const f4d = fact(m, blocks, '4d', "the pressing team's own success is meaningful only as a regain carried over the escaping team's end line: its own event, which takes none of the escaping team's conditions", (b) => {
        const p = pressingOf(b)
        const holds = !!p?.scoresBy && f1b.holds
        return { holds, said: holds ? `the pressing role scores by its own ${p.scoresBy}, so the conditions on the primary event do not bind it` : 'the pressing team has no event of its own', paths: p ? [rolePath(p, 'scoresBy')] : [] }
    })

    const factSets = [
        [f1a, f1b, f1c, f1d, f1e],
        [f2a, f2b, f2c],
        [f3a, f3b, f3c, f3d],
        [f4a, f4b, f4c, f4d],
    ]
    const established = factSets.map((facts) => facts.every((f) => f.holds))

    /*
     * Stage A2 (decision W3, V2 findings 2 and 3): each question read against RPC-002's own approved rows, read from the RPC library (never
     * typed here): the information rows RPC-PROP-022 to -025 (question 2), each held or not held with the element that carries it, and the
     * degenerate solutions RPC-PROP-026 to -029 (question 4), each punished, rewarded or not addressed by the game. Which element carries a row
     * is OURS (our reading, for Christian's ecological review); each verdict is computed from the facts above and the realized game.
     */
    const rowOf = (id: string) => {
        const row = rpcLibrary.properties('RPC-002').find((r: any) => r.property_id === id) as any
        assert.ok(row, `RPC-002 holds ${id}`)
        return { rowId: id, words: String(row.property_text), category: String(row.property_category) }
    }
    const kindOf = (b: Block) => String(b.game.value?.primaryEvent?.kind ?? '')
    const eventWords = (kind: string) => (kind ? displayCell(committedKnowledge(), { source: 'contexts', table: 'controlled_vocabulary', row: `scoring_event ${kind}`, column: 'description' }).text : '')
    // A lone player's dribble scores wherever the scoring event's approved description counts one player dribbling (with or without roles).
    const lonePlayerDribbleScores = blocks.length > 0 && blocks.every((b) => actionClassesIn(eventWords(kindOf(b))).includes('dribble'))
    const noRestriction = blocks.length > 0 && blocks.every((b) => otherKinds(b).length === 0)
    /*
     * FIX (13 November 2026, from the V4 verification, finding 1): the restart over an end line, read from the realized transitions. Where it is
     * awarded to the escaping team, whoever touched the ball last, a clearance over an end line (its own included) gives the escaping team the
     * ball back, and a defender can stop the pressing team's dribble the same way; the possession game's own award there (GF2-16.a) is to the
     * team that did not touch it last.
     */
    const endLineRestarts = blocks.flatMap((b) => ((b.game.transitions ?? []) as any[]).filter((t) => triggerOf(t) === 'OUT_END_LINE' && t.playState === 'STOP_RESUME'))
    const endLineToEscaping = endLineRestarts.some((t) => t.awardedTo === 'ROLE_HOLDER_ESCAPING')
    const endLinePaths = [...new Set(endLineRestarts.map((t) => `transitions[${t.elementId}].awardedTo`))]
    // FIX (V4 finding 3): the event's meaning for RPC-002, read from the standing of its vocabulary description (never typed here).
    const meaningStanding = blocks.length ? eventMeaningStanding('RPC-002', kindOf(blocks[0])) : 'UNREVIEWED'
    const rows: ApprovedRowReading[] = [
        { ...rowOf('RPC-PROP-022'), verdict: f1b.holds ? 'partly held' : 'not held', reading: f1b.holds ? "direction held by the pressing team's only target, at the end the escaping team defends (1b); intensity held by no element: it is the pressing team's play, and whether it presses together is judged by the coach (the CANDIDATE condition, 4a)" : "no element gives the press a direction: the pressing team has no target at the escaping team's end (1b does not hold)", cites: f1b.cites },
        { ...rowOf('RPC-PROP-023'), verdict: f2a.holds && f2c.holds ? 'partly held' : 'not held', reading: f2a.holds && f2c.holds ? 'immediate support held by live, equal teams with no player restricted (2a, 2c); free-player availability created by no element (equal numbers, no neutral player): a free player arises only where the press leaves one' : 'the teams are not live, equal and unrestricted (2a or 2c does not hold)', cites: f2a.cites },
        { ...rowOf('RPC-PROP-024'), verdict: f3b.holds && f3d.holds ? 'held' : 'not held', reading: f3b.holds && f3d.holds ? "held by the marked line and the target across the full width, no option removed (3b, 3d); which lanes are open is the live press's, and the room beyond the line is set by the placement rule, PROPOSED and applied by the coach (question Q1)" : 'the line or the target does not run the full width, or an element removes an option (3b or 3d does not hold)', cites: f3b.cites },
        { ...rowOf('RPC-PROP-025'), verdict: f3b.holds && f1c.holds && f4b.holds ? 'held' : f3b.holds ? 'partly held' : 'not held', reading: f3b.holds ? `weak-side opportunities held by the full-width line and target (3b): a switch reaches the target anywhere across; recovery behaviour ${f1c.holds && f4b.holds ? 'held while play continues on a turnover and the escaping team must still keep the ball through its next action (1c, 4b), so a recovering press can still win it' : 'not held: play stops on a turnover, or no continuation is required'}${f1e.holds ? '; after a point play restarts (1e)' : ''}` : 'the line or the target does not run the full width (3b does not hold)', cites: [...f3b.cites, ...f4b.cites] },
        // FIX (V4 finding 1), re-pinned openly: 'punished' read only the control condition and 4c; the end-line restart is read too.
        {
            ...rowOf('RPC-PROP-026'),
            verdict: !f4b.holds ? 'not punished' : endLineToEscaping ? 'partly punished' : 'punished',
            reading: f4b.holds
                ? `a clearance that loses the ball in play scores nothing (the control condition, 4b)${f4c.holds ? ", and a ball lost near the escaping team's end gives the pressing team a short route to its point (4c)" : ''}${endLineToEscaping ? "; but a clearance over either end line, whoever touched the ball last, returns it to the escaping team at the restart (1e, PROPOSED Q6), and a defender can stop the pressing team's dribble the same way, where the possession game's own award (GF2-16.a) gives the ball to the team that did not touch it last" : ''}`
                : 'no continuation is required, so a clearance that reaches the target scores',
            cites: [...f4b.cites, ...(endLineToEscaping ? cite(m, endLinePaths) : [])],
        },
        // FIX (V4 finding 3), re-pinned openly: 'rewarded by the approved event itself ... as the approved High Press Escape rules count' overstated
        // the standing: the event kind is approved for RPC-002, its vocabulary description's meaning for RPC-002 is not (read, not typed), and
        // the live High Press Escape rules are live text, not Christian's approved wording.
        { ...rowOf('RPC-PROP-027'), verdict: lonePlayerDribbleScores ? 'rewarded' : 'not rewarded', reading: lonePlayerDribbleScores ? `rewarded by the event's vocabulary description, which counts one player dribbling ('${eventWords(kindOf(blocks[0]))}'; its meaning for RPC-002 is ${meaningStanding})${escapingOf(blocks[0]) ? ', and which the live High Press Escape rules follow in counting a player who dribbles over the line or into the zone' : ''}; the event kind itself is approved for RPC-002; nothing asks for more than one player, so a lone dribble ${f4b.holds ? 'past the line that keeps the ball' : 'to the target'} scores. A tension between RPC-002's approved degenerate-solution row and the event's ${meaningStanding} meaning, for Christian's ecological review: reported, not fixed` : 'the scoring event does not count a lone dribble', cites: cite(m, ['value.primaryEvent.kind']) },
        { ...rowOf('RPC-PROP-028'), verdict: 'not addressed', reading: "no element reads how the escaping team's support moves: static support that collapses the escape options is neither rewarded nor punished; it only fails to score", cites: [] },
        { ...rowOf('RPC-PROP-029'), verdict: noRestriction ? 'not punished' : 'not read', reading: noRestriction ? `no element limits backward circulation: possession that never ${f3a.holds ? 'crosses the line' : 'reaches the target'} scores nothing and costs nothing${f4c.holds ? ", except that a ball lost near the escaping team's own end exposes its end line (4c)" : ''}` : 'an element of another kind is in the game; not read here', cites: [] },
    ]
    // Question 3: the LAW-11 arms beside it (decision W3): the built arm read from the laws account, the other described, not built.
    const law11 = answer.lines.find((l) => l.lineId === 'defaultLaws:LAW-11')
    const arms = law11
        ? [
              `built (PROPOSED, question Q3; LAW-11 ${String(law11.value)}): no offside, so an escaping player may wait beyond the line for a long ball, which our own DRAFT laws reading names as material ('${LAW11_BYPASS}', laws-materiality.DRAFT.json): the escape could bypass the press`,
              'described, not built: escaping players stay short of the line until a teammate plays the ball beyond it, which keeps the escape an interaction with the press, at the cost of one more rule for the coach to judge',
          ]
        : []

    const verdictOf = (n: number): string => {
        if (!established[n]) return NOT_ESTABLISHED
        if (n === 0) return Q1_VERDICT
        return ESTABLISHED
    }
    // FIX (V4 finding 1): the limit under 4c, read from the end-line restart.
    const q4Limits = f4c.holds && endLineToEscaping ? ["4c is weaker than it reads: a ball the escaping team knocks over an end line, its own included, comes back to it at the restart (1e, PROPOSED Q6), so losing the ball near its own end exposes its end line only while the ball stays in play"] : []
    const answers: Answer[] = factSets.map((facts, n) => ({
        n: n + 1,
        question: QUESTIONS[n],
        facts,
        established: established[n],
        verdict: verdictOf(n),
        rows: n === 1 ? rows.filter((r) => r.category === 'REPRESENTATIVE_INFORMATION') : n === 3 ? rows.filter((r) => r.category === 'DEGENERATE_SOLUTION') : [],
        arms: n === 2 ? arms : [],
        limits: n === 3 ? q4Limits : [],
    }))
    return { runId: m.id, answers, count: answers.filter((a) => a.established).length }
}

/** The reason our DRAFT laws reading gives for LAW-11's materiality, read from the DRAFT file (never typed here). */
const LAW11_BYPASS = (() => {
    const draft = JSON.parse(fs.readFileSync(path.resolve(HERE, '..', '..', '..', '..', 'docs', 'audits', 'drafts', 'laws-materiality.DRAFT.json'), 'utf8')) as { classifications: Array<{ law: string; ourReading: string }> }
    const reading = draft.classifications.find((e) => e.law === 'LAW-11')?.ourReading ?? ''
    const from = reading.indexOf('players could wait there')
    assert.ok(from >= 0, 'our DRAFT laws reading of LAW-11 names the bypass')
    return reading.slice(from, reading.indexOf('.', from))
})()

const ESTABLISHED = "established by the game's structure"
const NOT_ESTABLISHED = 'not established'
// FIX (13 November 2026, V4 L8), re-pinned openly: was 'pressure: established; coordination: not established (coach-judged)' (the lead's decided
// words); 'established' is Christian's own word for the condition, so the structure's part is named for what it gives: a role and a reason.
const Q1_VERDICT = 'pressure: a pressing role and a reason to press (structural); coordination: not established (coach-judged)'
export function walkthroughLines(w: Walkthrough): string[] {
    const out: string[] = []
    for (const a of w.answers) {
        out.push(`${a.n}. ${a.question}: ${a.verdict}`)
        for (const f of a.facts) {
            out.push(`   ${f.id} [${f.holds ? 'holds' : 'DOES NOT HOLD'}] ${f.what}`)
            for (const e of f.evidence) out.push(`      ${e}`)
            if (f.cites.length) out.push(`      elements: ${f.cites.join('; ')}`)
        }
        if (a.rows.length) {
            out.push(`   against RPC-002's approved ${a.n === 2 ? 'information rows' : 'degenerate solutions'} (read from the RPC library; which element carries each is OURS, for Christian's ecological review):`)
            for (const r of a.rows) out.push(`      ${r.rowId} '${r.words}': ${r.verdict.toUpperCase()}: ${r.reading}${r.cites.length ? `; elements: ${r.cites.join('; ')}` : ''}`)
        }
        if (a.arms.length) {
            out.push("   beside question Q3, LAW-11's two arms:")
            for (const arm of a.arms) out.push(`      - ${arm}`)
        }
        for (const limit of a.limits) out.push(`   limit: ${limit}`)
    }
    const tally = (verdict: string) => w.answers.flatMap((a) => a.rows).filter((r) => r.verdict === verdict).length
    // FIX (V4 L8, finding 1), re-pinned openly: question 1's summary named pressure 'established'; the tally counts 'partly punished'.
    out.push(`${w.runId}: the structural facts of ${w.count} of 4 questions hold${w.answers[0].established ? ' (question 1: a pressing role and a reason to press, structural; coordination not established, judged by the coach)' : ''}; RPC-002's information rows: ${tally('held')} held, ${tally('partly held')} partly held, ${tally('not held')} not held; its degenerate solutions: ${tally('punished')} punished, ${tally('partly punished')} partly punished, ${tally('rewarded')} rewarded, ${tally('not punished')} not punished, ${tally('not addressed')} not addressed`)
    return out
}

/**
 * Stage A2 (decision W3, V2 finding 2): what differs from plain GF2, read from the two realized games (the review-level run's first block and
 * A02-GF2W's one game), each element with its labels from the review-level run's grading; what is GF2's own is said too.
 */
export function differsFromPlainGf2(review: Made, control: Made): string {
    const g = blocksOf(review.built)[0]?.game
    const c = blocksOf(control.built)[0]?.game
    if (!g || !c) return 'not read: a run holds no realized game'
    const ids = (game: any, list: any[] | undefined) => new Set((list ?? []).map((e) => String(e.elementId)))
    const added = (of: (game: any) => any[] | undefined) => (of(g) ?? []).filter((e) => !ids(c, of(c)).has(String(e.elementId)))
    const label = (p: string) => `[${labelsAt(review, p)}]`
    const parts: string[] = []
    const roles = added((x) => x.activityRoles)
    if (roles.length) parts.push(`the roles held for a block (${roles.map((r) => r.activityRole).join(', ')}) ${label(`activityRoles[${roles[0].elementId}].activityRole`)}`)
    const regions = added((x) => x.space?.regions)
    for (const r of regions) parts.push(`the marked ${r.noun} ${label(`${regionPath(r)}.noun`)}`)
    const zone = ((g.space?.regions ?? []) as any[]).find((r) => r.noun === 'zone')
    const plainOf = zone ? ((c.space?.regions ?? []) as any[]).find((r) => r.elementId === zone.elementId) : null
    if (zone && plainOf?.noun !== 'zone') parts.push(`the escaping team's target, a zone beginning at the marked line (plain GF2: the ${plainOf?.noun ?? 'no'} ${plainOf ? 'at the far end' : 'target'}) ${label(`${regionPath(zone)}.noun`)}`)
    const pressing = ((g.activityRoles ?? []) as any[]).find((r) => r.scoresBy)
    if (pressing) parts.push(`the pressing team's own event (${pressing.scoresBy}) ${label(`activityRoles[${pressing.elementId}].scoresBy`)}`)
    const restarts = added((x) => x.transitions)
    if (restarts.length) parts.push(`the restart at the start, after each point and over an end line (${restarts.length} transitions) ${label(`transitions[${restarts[0].elementId}].awardedTo`)}`)
    const conditions = ((g.value?.primaryEvent?.conditions ?? []) as any[]).filter((x) => !ids(c, c.value?.primaryEvent?.conditions).has(String(x.elementId)))
    if (conditions.length) parts.push(`the conditions on the escaping team's event (${conditions.map((x) => x.type).join(', ')}) ${label(`value.primaryEvent.conditions[${conditions[0].elementId}].value`)}, judged by the coach in play`)
    if (labelsAt(review, 'defaultLaws.laws[LAW-11]') !== 'no line') parts.push(`no offside ${label('defaultLaws.laws[LAW-11]')}`)
    const sameTarget = ((g.objectives ?? []) as any[]).filter((o) => ((c.objectives ?? []) as any[]).some((x) => x.elementId === o.elementId && canonical(x.reference) === canonical(o.reference)))
    return `${parts.join('; ')}. GF2's own, in both: ${sameTarget.length ? "the pressing team's target is GF2's end-line objective" : 'no shared objective'}${(c.transitions ?? []).some((t: any) => t.playState === 'CONTINUE') ? ', and play continues on a change of possession' : ''}.`
}
const canonical = (v: unknown) => JSON.stringify(v)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The four-part print (as a02-hpe1-wording.unit.ts W7 prints the review-level run), and A02-GF2W printed with our wording beside it
// ---------------------------------------------------------------------------------------------------------------------------------------

const SOURCES = candidateWordingSourcesOf(a02Inputs.rulings.map((r) => ({ id: r.id, words: r.words, received: r.received })))
const WORDING = loadCandidateWording(SOURCES)
// FIX (13 November 2026, V4 finding 5): the CANDIDATE High Press Escape rules, read from their file through the tests-only reader.
const CANDIDATE_RULES = loadCandidateCoachRules()
/**
 * FIX (13 November 2026, from the V4 verification, finding 2): where a printed-only sentence says less than, or other than, the engine sentences
 * it stands for, measured by reading both. The coach-text test holds each `has` to the printed sentence and each `dropped` to a sentence it
 * stands for and not to the printed one, so a reworded sentence cannot leave this list stale.
 */
const PRINT_DIVERGENCES: Array<{ id: string; says: string; has?: string; dropped: string }> = [
    { id: 'A02-HPE1-R1', says: "says 'with a ball to an escaping player' where the engine says a player of the escaping team restarts play from the feet, and leaves out that the coach chooses where", has: 'with a ball to an escaping player', dropped: 'choose where' },
    { id: 'A02-HPE1-K5', says: "states only the pressing team's half of the two-targets sentence (the zone's half is in our condition sentence)", dropped: 'The escaping team attacks the zone beyond the marked line' },
    { id: 'A02-HPE1-S4', says: "leaves out 'there is no set block length'", dropped: 'there is no set block length' },
]
const PURPOSE = displayCell(committedKnowledge(), { source: 'planning', table: 'learning_goals', row: 'A02', column: 'Coach Definition' }).text
// Stage A2 (V2 finding 12), re-pinned openly: the note read 'the Learning Goal's Coach Definition, verbatim: the source Christian chose (received 21
// October 2026); its Active status is not a dated approval' beside a bare [A]; the marker now says whose source it is and when it was chosen
// (Christian's reply received 21 October 2026, recovered at 2026-10-21T17-25-28Z: the Learning Goal's coach-facing definition as the primary source).
const PURPOSE_NOTE = "the Learning Goal's Coach Definition, verbatim"
// FIX (13 November 2026, V3 check 4), re-pinned openly: the marker words are the words after the letter (were 'A: the source ...'); the line
// prints the same '[A: the source Christian chose, received 21 October 2026]', and the print's check now requires them on every APPROVED line.
const PURPOSE_MARKER = 'the source Christian chose, received 21 October 2026'
export const MARKERS = "Markers: [A] APPROVED, [C] CANDIDATE (ours, for review), [D] DRAFT (the renderer's own words), [P] PROPOSED (new knowledge of ours, for approval). Beside the marker, the grade: 'PROPOSED Qn' where a DRAFT or PROPOSED sentence rests on an element of ours awaiting Christian's question Qn, 'contingent on Qn' where an APPROVED or CANDIDATE sentence does."
/**
 * Stage A2 (the lead's decision W2): the questions each said sentence rests on, as the handoff grades it (appendix F7): every line the sentence
 * joins, every premise of that line naming an item of our PROPOSED configuration (its category PROPOSED) or its restatement replacement
 * (CANDIDATE, contingent on its question), and a PROPOSED departure from a law (the configuration's question on that law); each item's
 * question read from the configuration file (`waitsOn`), never typed here.
 */
function questionsOfRun(m: Made): (n: number) => string[] {
    const items = new Map<string, string>()
    for (const i of CONFIGURATION.realization.items as Array<{ itemId: string; category?: string; waitsOn?: string }>) if (i.category === 'PROPOSED' && i.waitsOn) items.set(i.itemId, i.waitsOn)
    for (const r of CONFIGURATION.replacements as Array<{ item: { itemId: string; waitsOn?: string } }>) if (r.item.waitsOn) items.set(r.item.itemId, r.item.waitsOn)
    const lawQuestion = (law: string) => CONFIGURATION.questions.find((q) => q.asks.startsWith(`${law} `))?.id ?? null
    const ofPremise = (p: { kind: string; ref: string }): string | null => {
        const [first, second] = p.ref.split(' ')
        if (second && items.has(second)) return items.get(second)!
        if (p.kind === 'PROPOSED_ITEM' && first.startsWith('LAW-')) return lawQuestion(first)
        return null
    }
    return (n) => {
        const graded = m.result.sentences[n]
        assert.ok(graded && graded.text === m.answer.sentences[n].text, `${m.id}: the handoff graded sentence ${n + 1} as said`)
        const lines = m.result.lines.filter((l) => graded.joined.includes(l.lineId))
        return [...new Set(lines.flatMap((l) => l.premises.map(ofPremise)).filter((q): q is string => q !== null))]
    }
}
const saidOf = (m: Made): SaidSentence[] => {
    const questions = m.result.sentences.length === m.answer.sentences.length ? questionsOfRun(m) : () => []
    // FIX (13 November 2026, V3 check 4, FAIL A): an APPROVED sentence carries whose approved wording it is and when Christian's reply was received.
    return m.answer.sentences.map((s, n) => ({ section: s.section, block: s.block, text: s.text, from: s.from, wording: s.wording, questions: questions(n), ...(s.wording === 'APPROVED' ? { source: approvedSourceOf(s.text) } : {}) }))
}
/** The ILLUSTRATIVE label of a path the run's sentence cites: the session's values, and every line resting on an item the chain received ILLUSTRATIVE. */
function illustrativeOfRun(m: Made): (p: string) => string | null {
    const items = new Set(m.answer.contracts.flatMap((c) => c.items.filter((i) => i.category === 'ILLUSTRATIVE').map((i) => `${c.contractId}::${i.itemId}`)))
    const schematic = new Set(m.answer.lines.filter((l) => l.kind === 'DERIVED' && (l.support ?? []).some((s) => items.has(`${s.contractId}::${s.itemId}`))).map((l) => l.path))
    return (p) => (p.startsWith('envelope.') && p !== 'envelope.roles' ? SESSION_LABEL : schematic.has(p) ? 'ILLUSTRATIVE: the schematic 12 m of this 40 m area; the placement rule governs (PROPOSED)' : null)
}
const SESSION_LABEL = 'ILLUSTRATIVE: session value, a test value'
/**
 * Stage A2 (decision W2, V1 check 3 B): a quantity a sentence shows that equals a session value, where the sentence does not cite the session's
 * path (the end line's '30 m long' is the area's width): the area's length and width in metres, the duration in minutes, the players.
 */
function illustrativeShownOfRun(m: Made): Array<{ shows: string; label: string }> {
    const at = (p: string) => m.answer.lines.find((l) => l.path === p && l.kind === 'DERIVED')?.value
    const out: Array<{ shows: string; label: string }> = []
    for (const [p, unit] of [['envelope.area.length_m', ' m'], ['envelope.area.width_m', ' m'], ['envelope.duration_min', ' minutes'], ['envelope.players', ' players']] as const) {
        const v = at(p)
        if (typeof v === 'number') out.push({ shows: `${v}${unit}`, label: SESSION_LABEL })
    }
    return out
}
/** Our printed sentences (the wording file's printerOnly) and the purpose, the purpose first in its part (V2's order). */
const printedOnly = (withStandsFor = true): PrintedOnly[] => [
    { id: 'L1', part: 'Learning explanation' as const, label: 'APPROVED' as const, sentence: PURPOSE, note: PURPOSE_NOTE, markerWords: PURPOSE_MARKER },
    // FIX (V3 check 4): each printed sentence keeps its own questions (restsOn) and its own ILLUSTRATIVE label in every print, so the negative
    // control's print, where they state nothing, still shows their grades and the 12 m's label.
    ...WORDING.printerOnly.map((p) => ({ id: p.id, part: p.part, label: p.label, sentence: p.sentence, ...(p.restsOn ? { restsOn: [...p.restsOn] } : {}), ...(p.illustrative ? { illustrative: p.illustrative } : {}), ...(withStandsFor && p.standsFor ? { standsFor: [...p.standsFor] } : {}) })),
]
/** The said sentences of our CANDIDATE wording that state other said sentences (an entry's `standsFor`). */
const saidStandsFor = () => WORDING.entries.filter((e) => e.standsFor).map((e) => ({ text: e.sentence, standsFor: [...e.standsFor!] }))
/** What a coach reads in a print (V2's method): every line's sentence alone (no marker, label or note), sentences split at '. ', words at spaces. */
export function readingOf(lines: Array<{ part: string; plain: string }>) {
    const tally = (ls: Array<{ plain: string }>) => ({ lines: ls.length, sentences: ls.reduce((n, l) => n + l.plain.split('. ').length, 0), words: ls.reduce((n, l) => n + l.plain.split(' ').filter(Boolean).length, 0) })
    return { total: tally(lines), byPart: Object.fromEntries(['Setup', 'Rules', 'Scoring', 'Learning explanation'].map((part) => [part, tally(lines.filter((l) => l.part === part))])) }
}
export function reviewPrint(m: Made) {
    const said = saidOf(m)
    const illustrativeOf = illustrativeOfRun(m)
    const illustrativeShown = illustrativeShownOfRun(m)
    const heading = [
        `REVIEW LEVEL, TEST-ONLY. Built through the checked pathway for Christian's review; ${m.answer.outcome === 'served' ? 'SERVED at review level' : `REFUSED AT ${String(m.answer.stage).toUpperCase()}, so this is the draft an administrator sees`}, never served to any coach; nothing here is live. The coach text: the engine's sentences, each printed as said or stated in fewer words by one sentence of ours (CANDIDATE or PROPOSED), which takes its grades; every engine sentence is listed below the text with where it is printed.`,
        MARKERS,
    ]
    const print = fourPartPrint({ heading, said, printed: printedOnly(), illustrativeOf, illustrativeShown, saidStandsFor: saidStandsFor() })
    const engine = engineLines(print, said, { illustrativeOf, illustrativeShown })
    return { print, said, illustrativeOf, engine, reading: readingOf(print.lines), words: said.reduce((n, s) => n + s.text.split(/\s+/).length, 0) }
}
/** A02-GF2W's text with our CANDIDATE wording printed beside it: plain GF2 'with additional wording', the wording entering no structure. */
export function gf2wPrint(m: Made) {
    const said = saidOf(m)
    // Beside the text only: our sentences state none of this game's sentences (they name a pressing team and a marked line no element holds).
    // FIX (V3 check 4): our condition sentence names the escaping team and the marked line (PROPOSED, Q1), so it shows that grade here too.
    const printed: PrintedOnly[] = [{ id: WORDING.entries[0].id, part: 'Scoring', label: 'CANDIDATE', sentence: WORDING.entries[0].sentence, note: 'printed beside the text only: no element of this game carries it', restsOn: ['Q1'] }, ...printedOnly(false)]
    const heading = ["NEGATIVE CONTROL, TEST-ONLY: plain GF2 (A02-D's build) with our CANDIDATE wording printed beside it; the wording enters no structure; never served; nothing here is live.", MARKERS]
    return fourPartPrint({ heading, said, printed, illustrativeOf: illustrativeOfRun(m), illustrativeShown: illustrativeShownOfRun(m) })
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The element table, generated from the build: every configuration line of the review-level run, by element, with its labels
// ---------------------------------------------------------------------------------------------------------------------------------------

export function elementTable(m: Made): string[] {
    const out: string[] = []
    const elementOf = (p: string) => (p.indexOf(']') > 0 ? p.slice(0, p.indexOf(']') + 1) : p.split('.')[0])
    const groups = new Map<string, string[]>()
    // A line nothing establishes says why (the chain's reason), and where our CANDIDATE restatement declares it needs no further value, says so
    // (an established absence, read from the chain's own line; since stage A2 the handoff grades it DECLARED_ABSENCE, CANDIDATE, where every
    // declaring contract is our DRAFT restatement).
    const why = (lineId: string) => {
        const c = m.answer.lines.find((x) => x.lineId === lineId)
        return c?.nonClaim ? `, declared NO_FURTHER_VALUE by ${c.nonClaim.by.join(', ')} (an established absence)` : c?.reason ? ` (${c.reason})` : ''
    }
    for (const l of m.result.lines) {
        const key = elementOf(l.path)
        const said = l.kind === 'NOT_ESTABLISHED' ? `not established${why(l.lineId)}` : `= ${show(l.value)}`
        const labels = l.kind === 'NOT_ESTABLISHED' ? 'NOT_ESTABLISHED' : [...new Set(l.premises.map(tagOf))].join(' + ')
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(`   ${l.path} ${said} [${labels}]`)
    }
    for (const [key, lines] of groups) out.push(`- ${key}`, ...lines)
    return out
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The rewordings: A02-HPE1 under each, compared with the goal's own wording, facet by facet
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The facets compared; `governed` false marks the engine lenses (ENGINE_LENS: wording-derived engine inputs, reported only). */
const FACETS: Array<{ id: string; governed: boolean; of: (m: Made) => unknown }> = [
    { id: 'routed context (Step 1)', governed: true, of: (m) => m.result.receive.step1?.contextId ?? null },
    { id: 'the context in the chain\'s account', governed: true, of: (m) => m.answer.account?.contextId ?? null },
    { id: 'Game Problem (Step 1)', governed: true, of: (m) => m.result.receive.step1?.primary ?? null },
    { id: 'Game Form (consumed)', governed: true, of: (m) => m.result.consumption?.form?.formId ?? null },
    { id: 'constraint set and its authority', governed: true, of: (m) => [m.answer.account?.constraints ?? null, m.answer.observed?.constraintAuthority ?? null] },
    { id: 'each block\'s realized game (sha-256)', governed: true, of: (m) => blocksOf(m.built).map((b) => short(b.game)) },
    { id: 'the configuration lines (sha-256)', governed: true, of: (m) => short(m.answer.lines) },
    { id: 'the stop', governed: true, of: (m) => [m.answer.outcome, m.answer.stage, short(m.answer.reasons)] },
    { id: 'every sentence said (sha-256 of section, block, text, marker)', governed: true, of: (m) => short(m.answer.sentences.map((s) => [s.section, s.block, s.text, s.wording])) },
    { id: 'the pending entries', governed: true, of: (m) => (m.answer.reviewLevel?.pendingApproval ?? []).map((p) => [p.item, p.questionId]) },
    { id: 'engine lenses committed (ENGINE_LENS, report only)', governed: false, of: (m) => m.answer.observed?.lensIds ?? null },
    { id: 'engine lens candidates (ENGINE_LENS, report only)', governed: false, of: (m) => m.result.consumption?.lensCandidateIds ?? null },
]
export interface RewordingRow {
    facet: string
    governed: boolean
    own: unknown
    reworded: Record<string, unknown>
    moves: string[]
}
export function rewordingRows(from: Map<string, Made> = B3): RewordingRow[] {
    const own = at(REVIEW_RUN, from)
    return FACETS.map((f) => {
        const reworded: Record<string, unknown> = Object.fromEntries(REWORDINGS.map((name) => [name, f.of(at(`${REVIEW_RUN}~${name}`, from))]))
        return { facet: f.id, governed: f.governed, own: f.of(own), reworded, moves: REWORDINGS.filter((name) => json(reworded[name]) !== json(f.of(own))) }
    })
}
/** 'no material effect' when no knowledge-governed facet moves under either rewording; else each facet that moves, named. */
export const materialEffects = (rows: RewordingRow[]): string[] => rows.filter((r) => r.governed && r.moves.length).map((r) => `${r.facet} moves under ${r.moves.join(' and ')}`)

// ---------------------------------------------------------------------------------------------------------------------------------------
// The safeguard check on the HPE-1 runs (safeguards.ts, as a02-safeguards.unit.ts runs it), the progression clause read through the
// configuration's replacement of RPC-002-03.b (read from the configuration file, never typed here)
// ---------------------------------------------------------------------------------------------------------------------------------------

const CONFIGURATION = loadProposedRealization()
export const replacedScoring = () => ({
    ...S.SCORING,
    clauses: S.SCORING.clauses.map((c) => ({ clause: c.clause, items: c.items.map((id) => CONFIGURATION.replacements.find((r) => r.contractId === S.SCORING.contractId && r.replaces === id)?.item.itemId ?? id) })),
})
export const SAFEGUARD_RUNS = [...HPE1_IDS, ...REWORDINGS.map(reworded)]
export function safeguardFindings(m: Made, scoring = replacedScoring()): Finding[] {
    return ownershipOf(safeguardRunOf(m.result, m.answer, m.request.consume !== undefined, { ...S.K2_FACTS, standIns: [], scoring, engineRule: null }))
}
/** The open disconnections with OD-CONTEXT carried by these runs too (the same disconnection: the chain reads the routing itself). */
export const ENTRIES: OpenDisconnection[] = S.OPEN_DISCONNECTIONS.map((e) => (e.id === 'OD-CONTEXT' ? { ...e, runs: [...e.runs, ...SAFEGUARD_RUNS] } : e))
export const failureOf = (findings: Finding[]): string => {
    try {
        S.assertExperimentRun(findings, ENTRIES)
    } catch (error) {
        return (error as Error).message
    }
    return 'PASSED'
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The LAW-11 premise of the review-level run: our PROPOSED departure, graded PROPOSED, never a ruling of a production realization
// ---------------------------------------------------------------------------------------------------------------------------------------

export function lawPremiseRefusals(r: HandoffResult): string[] {
    const out: string[] = []
    const line = r.lines.find((l) => l.lineId === 'defaultLaws:LAW-11')
    if (!line || line.value !== 'DEPARTED') return ['no LAW-11 departure on the run']
    for (const p of line.premises) if (p.kind !== 'PROPOSED_ITEM' || !String(p.label).startsWith('PROPOSED')) out.push(`the LAW-11 departure rests on ${p.kind} '${p.label}' (${p.ref})`)
    return out
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The stops of the stage-B3 runs (measured), and appendix F of the A02 evidence
// ---------------------------------------------------------------------------------------------------------------------------------------

const ruling = (id: string) => {
    const r = a02Inputs.rulings.find((x) => x.id === id)
    assert.ok(r, id)
    return r
}
const christian = (id: string, n: number) => `${quoted(ruling(id).words[n])} (${citedDateOf(ruling(id))})`
/**
 * FIX (13 November 2026, from the V3 verification, check 6), re-pinned openly: was A01_SENTENCES = 27, printed 'A01's served Details hold 27
 * sentences', a count no pin holds (27 was A01's Details count before 'There is no offside' was added, 24 October 2026). A01's served Details,
 * the goal version at 12 players with 1 goalkeeper, hold 28 instructions (lines, like the coach text's lines): goal-version-communication.unit.ts
 * pins it, and the coach-text test holds this figure to that pin's own text (A01_PIN).
 */
export const A01_DETAILS_INSTRUCTIONS = 28
export const A01_PIN = `assert.equal(activity.rendered.instructions.length, ${A01_DETAILS_INSTRUCTIONS})`
/**
 * Stage A2 (the lead's decision W4, V2 finding 9): the qualifier every claim of a complete or served activity carries, so a pass is never read
 * as Christian's criterion met. FIX (13 November 2026, V4 L15): it also names how many TEST-ONLY treatments the run rests on (read from the run).
 */
export const notYetQualifier = (): string =>
    `not yet the activity Christian asked for, ${christian('A02-12NOV-PACKAGE', 0)}: N1, N2, N3, the restart and LAW-11 are PROPOSED and the condition is our CANDIDATE restatement; validation passes with one guard finding carried as pending (TT-PROPOSED-PENDING, Q2) and the laws check in REPORT mode; the run rests on ${at(REVIEW_RUN).result.testOnlyTreatments.length} TEST-ONLY treatments (appendix F, F1)`

/** Appendix F of the A02 evidence: everything stage B3 adds, generated from the runs (`from`: the first or the second build). */
export function appendixF(from: Map<string, Made> = B3): string[] {
    const out: string[] = []
    const review = at(REVIEW_RUN, from)
    const w = walkthroughOf(review)
    const control = walkthroughOf(at(GF2W, from))
    const p = reviewPrint(review)
    const rows = rewordingRows(from)
    const material = materialEffects(rows)
    out.push("APPENDIX F: THE COMPLETE-ACTIVITY PACKAGE (stage B3, 12 November 2026): the review-level activity A02-HPE1, Christian's acceptance walkthrough read from the built game's structure, the rewordings, the safeguard check on the HPE-1 runs (TEST-ONLY; for Christian's review; nothing here is served or live)")
    out.push(`Christian asked: ${christian('A02-12NOV-PACKAGE', 0)} ${christian('A02-12NOV-PACKAGE', 13)}`)
    out.push('F1. THE RUNS AND THEIR STOPS (measured):')
    for (const id of B3_RUN_IDS) {
        const m = at(id, from)
        out.push(`- ${id}: ${m.answer.outcome}${m.answer.stage ? ` at ${m.answer.stage}` : ''}; treatments ${m.result.testOnlyTreatments.map((t) => t.id).join(', ')}; ${m.answer.reasons.length} reasons${m.answer.reasons.length ? `, the first: ${plain(m.answer.reasons[0])}` : ''}`)
    }
    // Stage A1 (13 November 2026), re-pinned openly: this paragraph said the run is refused at communication on four limits of the production
    // renderer and is printed as the draft an administrator sees; since the lead's decisions R1 to R4 it is served at review level.
    out.push(
        review.answer.outcome === 'served'
            ? `The review-level run ${REVIEW_RUN} is served at review level (stage A1, 13 November 2026; TEST-ONLY, never released), with ${review.built?.activity?.integrity?.fidelityViolations ?? 'unknown'} fidelity violations: the renderer and fidelity read the register the game was derived over (TEST-ONLY, only on a build given our CANDIDATE wording); each role's own-event sentence cites its own objective's role; the two targets (the zone beyond the marked line, the escaping team's end line) are named in one sentence read only from our CANDIDATE wording file; and the PROPOSED restart (question Q6) starts play, and restarts it after each point and when the ball goes over an end line, the ball to the escaping team. Fidelity reads our CANDIDATE wording beside the approved table, as it reads approved wording (stage B2). Served at review level is ${notYetQualifier()} (stage A2).`
            : `The review-level run ${REVIEW_RUN} is refused at ${review.answer.stage}; it is printed below as the draft an administrator sees, never as served.`,
    )
    // FIX (13 November 2026, from the V4 verification, finding 2): what the fidelity count and the print do not cover, said where the count is.
    out.push(`What the fidelity count and the coach text do not cover (FIX, V4 finding 2): the ${review.built?.activity?.integrity?.fidelityViolations ?? 'unknown'} fidelity violations rest on our CANDIDATE wording read as approved wording, so fidelity skips its obligation lexicon on our condition sentence ('only if'), while the Coach Overview's check, reading the approved table alone, finds that lexicon's findings on the same sentence (stage A1, R6; the Coach Overview stays withheld). The coach text (F2) is a print, not what the engine serves (F2b): its printed-only sentences (${WORDING.printerOnly.map((x) => x.id).join(', ')}) are said by no engine and are under no fidelity or meaning check. Measured differences from the engine sentences they stand for: ${PRINT_DIVERGENCES.map((d) => `${d.id} ${d.says}`).join('; ')}.`)
    out.push(`Pending (awaiting Christian's approval, never a pass): ${(review.answer.reviewLevel?.pendingApproval ?? []).map((e) => `${e.item} (question ${e.questionId}), in ${e.blocks.length} blocks: ${withoutGenderedPronouns(plain(e.finding))}`).join('; ') || 'none'} (the guard's words, printed without a gendered pronoun)`)
    // Stage A1, re-pinned openly: the heading said 'the administrator's draft of the refused run'. Stage A2 (decisions W1 and W2), re-pinned
    // openly: the print was the engine's sentences with the printed-only sentences beside them, marked by whose words they are; it is the coach
    // text (each engine sentence printed as said or stated by one sentence of ours, which takes its grades), every line graded, and the engine's
    // own sentences are listed after it (F2b) with where each is printed.
    out.push(`F2. THE REVIEW-LEVEL ACTIVITY IN FOUR PARTS: THE COACH TEXT (${review.answer.outcome === 'served' ? 'from the text served at review level' : "from the administrator's draft of the refused run"}; every line marked and graded; every ILLUSTRATIVE quantity labelled where it shows):`)
    out.push(...p.print.text.split('\n').map((l) => `   ${l}`))
    out.push("F2b. THE ENGINE'S OWN SENTENCES (in the order said, each marked and graded, and where the coach text prints it):")
    out.push(...p.engine.map((l) => `   ${l}`))
    const r = p.reading
    out.push(`Concision (measured; V2's method: labels and notes stripped, sentences split at '. ', words at spaces): what a coach reads in the coach text, ${r.total.lines} lines, ${r.total.sentences} sentences and ${r.total.words} words (${['Setup', 'Rules', 'Scoring', 'Learning explanation'].map((part) => `${part} ${r.byPart[part].lines}/${r.byPart[part].sentences}/${r.byPart[part].words}`).join(', ')}); the engine's own text, ${p.said.length} sentences and ${p.words} words; A01's served Details (the goal version at 12 players with 1 goalkeeper) hold ${A01_DETAILS_INSTRUCTIONS} instructions, against the coach text's ${r.total.lines} lines.`)
    // FIX (13 November 2026, from the V4 verification, finding 5): the four High Press Escape rules, live beside our CANDIDATE, read from the
    // CANDIDATE rules file (its loader holds each live text to COACH_RULES), for the review Christian asked for alongside the complete activity.
    out.push(`F2c. THE FOUR HIGH PRESS ESCAPE RULES, LIVE BESIDE OUR CANDIDATE (${christian('A02-12NOV-NEXT-ACTION', 16)}; the CANDIDATE rules are held, never released; COACH_RULES, the live text, is unchanged):`)
    for (const rule of CANDIDATE_RULES.rules) out.push(`- ${rule.key}`, `   live: ${rule.live}`, `   CANDIDATE: ${rule.candidate}`, ...(rule.setupCandidate ? [`   CANDIDATE setup: ${rule.setupCandidate}`] : []))
    out.push('F3. THE ELEMENT TABLE (generated from the build: every configuration line of the review-level run, by element, each with the labels of what it rests on, read from the item\'s category by the handoff\'s grading; never typed by hand):')
    out.push(...elementTable(review))
    out.push(`F4. THE ACCEPTANCE WALKTHROUGH (Christian's four questions, ${christian('A02-12NOV-PACKAGE', 14)}; each answered from the realized game's elements in both role blocks, never from a sentence, and questions 2 and 4 read against RPC-002's approved rows (stage A2); a development finding only, never ecological validation, which Christian keeps for the ecological review, received 12 November 2026, item 6):`)
    out.push(`   What differs from plain GF2 (read from the two realized games): ${differsFromPlainGf2(review, at(GF2W, from))}`)
    out.push(...walkthroughLines(w).map((l) => `   ${l}`))
    out.push(`The negative control ${GF2W} (plain GF2 as A02-D builds it, with our CANDIDATE wording printed beside it; ${christian('A02-12NOV-PACKAGE', 15)}):`)
    out.push(...walkthroughLines(control).map((l) => `   ${l}`))
    out.push(`   what a coach would read in ${GF2W} (the wording claims what no element carries):`)
    out.push(...gf2wPrint(at(GF2W, from)).text.split('\n').map((l) => `      ${l}`))
    out.push(`Limits kept visible (each is Christian's ecological review or a field trial, not this walkthrough): whether the pressing team presses together, and how often a qualifying start arises; that the condition can give the pressing team a reason not to press together (a possession it does not press together cannot score), for Christian to weigh; that RPC-PROP-027 (isolated dribbling) is rewarded by the event's vocabulary description (its meaning for RPC-002 ${eventMeaningStanding('RPC-002', 'target_zone_entered')}; the event kind approved for RPC-002), which the live High Press Escape rules follow, a tension between RPC-002's approved degenerate-solution row and that meaning, reported and not fixed (FIX, V4 finding 3); that RPC-PROP-026 (panic clearances) is only partly punished: a clearance over either end line returns the ball to the escaping team at the PROPOSED restart, whoever touched it last (question Q6; the other arm, described and not built: the restart over an end line keeps the possession game's own award, to the team that did not touch the ball last, GF2-16.a) (FIX, V4 finding 1); that in the PROPOSED structure the restart is the activity's rule, not one option among the coach's (question Q6, FIX, V4 finding 4); whether the line's place (the schematic 12 m, ILLUSTRATIVE) serves the problem, and whether a coach can apply the placement rule; whether an escaping team, which cannot score unpressed, waits for or invites pressure; whether the PROPOSED restart (question Q6, stage A1: the ball to an escaping player near their own end at the start, after each point and when the ball goes over an end line) recreates the pressure conditions, which it never stands in for (the coach still judges the pressure in play; a ball given at a restart is not assumed to create organized opposition, Christian's caution received 5 November 2026); that no item writes the restart policy row, so every other dead ball keeps the normal Laws, and the kick-off stays owed in the laws account (PROCEDURAL under our DRAFT reading, reported); whether a coach can judge the start under pressure in play; the pressing team's reward (question 2); offside (question 3); and Christian's concern, ${christian('A02-12NOV-NEXT-ACTION', 14)} (OURS: in A02-HPE1 the escaping team has no goal, so no shot arises; the concern stays visible for the ecological review). No player-learning effect is claimed (Christian asks for none yet, received 12 November 2026, item 6).`)
    out.push(`F5. THE REWORDINGS (A02-HPE1 under the reversed and the neutral wording, the A02-2~ family's method; Christian's item 7: context routing and lens ranking where alternative wording could change a knowledge-governed result): ${material.length === 0 ? 'no material effect: no knowledge-governed result moves; the engine lenses move (ENGINE_LENS, report only), and nothing built reads them on this run' : `MATERIAL: ${material.join('; ')}`}. OD-WORDING-FLIP and OD-WORDING-LENSES stay open as recorded.`)
    for (const r of rows) out.push(`- ${r.facet}${r.governed ? '' : ' (not knowledge-governed)'}: own ${show(r.own)}; ${REWORDINGS.map((name) => `${name} ${show(r.reworded[name])}`).join('; ')}; ${r.moves.length ? `MOVES under ${r.moves.join(' and ')}` : 'the same'}`)
    out.push('F6. THE SAFEGUARD CHECK ON THE HPE-1 RUNS (the same pure check as appendix B; the progression clause read through the configuration\'s replacement of RPC-002-03.b by A02-HPE1-03.b, read from the configuration file: our CANDIDATE item typing the pressing line to the PROPOSED escape line, contingent on question 1, so the clause is carried, not approved; OD-CONTEXT carried by these runs too):')
    for (const id of SAFEGUARD_RUNS) {
        const findings = safeguardFindings(at(id, from))
        out.push(`- ${id}: ${failureOf(findings) === 'PASSED' ? 'the assertion every experiment run must pass PASSES' : `FAILS: ${plain(failureOf(findings))}`}`)
        for (const f of findings) out.push(`   ${f.row}${f.clause ? ` (${f.clause})` : ''}: ${f.verdict} [${classOf(f)}]: ${plain(f.why)}`)
    }
    out.push('F7. THE HPE-1 RUNS AS THE HANDOFF REPORTS THEM (inputs, Steps 1 and 2, the form, the chain, configuration lines with their grades, coach text, laws and requirement accounts, refusals and what they rest on):')
    out.push(handoffReportText(HPE1_IDS.map((id) => at(id, from).result), a02Inputs, []))
    out.push('')
    return out
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The tests (every value pinned below was measured first: scratchpad pkg3/B3)
// ---------------------------------------------------------------------------------------------------------------------------------------

// Stage A1 (13 November 2026), re-pinned openly: A02-HPE1 and its two rewordings were refused at communication on four renderer limits; the
// lead's decisions R1 to R4 (the register the game was derived over, each role citing its own objective, the two targets in our CANDIDATE words,
// the PROPOSED restart) serve them at review level (measured, scratchpad pkg4/A1). A02-HPE1-S and A02-HPE1-L keep their stops.
test('the stops (measured): A02-HPE1 served at review level (stage A1), A02-HPE1-S at communication, A02-HPE1-L at validation on LAW-11, A02-GF2W served (plain GF2), A02-HPE1 under each rewording served as A02-HPE1 is', () => {
    assert.deepEqual(
        B3_RUN_IDS.map((id) => [id, at(id).answer.outcome, at(id).answer.stage]),
        [
            ['A02-HPE1', 'served', null],
            ['A02-HPE1-S', 'refused', 'communication'],
            ['A02-HPE1-L', 'refused', 'validation'],
            ['A02-GF2W', 'served', null],
            ['A02-HPE1~reversed', 'served', null],
            ['A02-HPE1~neutral', 'served', null],
        ],
    )
    // The review-level run's realized game exists in both role blocks (the walkthrough reads it), and its pending entry names Q2 only.
    assert.equal(blocksOf(at(REVIEW_RUN).built).length, 2)
    assert.deepEqual((at(REVIEW_RUN).answer.reviewLevel?.pendingApproval ?? []).map((e) => [e.item, e.questionId]), [['proposed:A02-HPE1::A02-HPE1-B9-1', 'Q2']])
    assert.equal(blocksOf(at(GF2W).built).length, 1, 'A02-GF2W: one game, no role blocks')
})

// Stage A2 (13 November 2026, the lead's decision W3), re-pinned openly: the title said '4 of 4 established by the game's structure'; the
// structural facts still hold for all four questions (1d now read from the targets' positions, 1e the PROPOSED restart added), and question 1
// is printed 'pressure: established; coordination: not established (coach-judged)'; questions 2 and 4 are read against RPC-002's approved rows.
// FIX (13 November 2026, from the V4 verification), re-pinned openly: question 1 is printed Q1_VERDICT (L8); RPC-PROP-026 is 'partly punished'
// (was 'punished': the end-line restart returns a clearance to the escaping team, finding 1), with its limit under 4c; RPC-PROP-027 is rewarded
// by the event's vocabulary description, whose meaning for RPC-002 is UNREVIEWED (was 'by the approved event itself', finding 3).
test("the walkthrough on A02-HPE1's realized game: the structural facts of 4 of 4 questions hold in both role blocks (1d read from the targets' positions, 1e the PROPOSED restart), question 1 printed 'pressure: a pressing role and a reason to press (structural); coordination: not established', RPC-002's approved rows read (RPC-PROP-026 partly punished, with its limit; RPC-PROP-027 rewarded by the event's UNREVIEWED description), each citing its elements with their labels", () => {
    const w = walkthroughOf(at(REVIEW_RUN))
    assert.deepEqual(w.answers.map((a) => [a.n, a.established, a.facts.filter((f) => !f.holds).map((f) => f.id)]), [
        [1, true, []],
        [2, true, []],
        [3, true, []],
        [4, true, []],
    ])
    assert.equal(w.count, 4)
    assert.deepEqual(w.answers.map((a) => a.verdict), ['pressure: a pressing role and a reason to press (structural); coordination: not established (coach-judged)', ESTABLISHED, ESTABLISHED, ESTABLISHED])
    assert.deepEqual(w.answers[0].facts.map((f) => f.id), ['1a', '1b', '1c', '1d', '1e'])
    // RPC-002's approved rows, each read from the library and its verdict computed from the game (OURS: which element carries it).
    assert.deepEqual(w.answers.flatMap((a) => a.rows.map((r) => [a.n, r.rowId, r.verdict])), [
        [2, 'RPC-PROP-022', 'partly held'],
        [2, 'RPC-PROP-023', 'partly held'],
        [2, 'RPC-PROP-024', 'held'],
        [2, 'RPC-PROP-025', 'held'],
        [4, 'RPC-PROP-026', 'partly punished'],
        [4, 'RPC-PROP-027', 'rewarded'],
        [4, 'RPC-PROP-028', 'not addressed'],
        [4, 'RPC-PROP-029', 'not punished'],
    ])
    // FIX (V4 finding 1): the end-line restart is cited, and the limit under 4c is printed with question 4 only.
    const r026 = w.answers[3].rows.find((r) => r.rowId === 'RPC-PROP-026')!
    assert.ok(r026.reading.includes('a clearance over either end line, whoever touched the ball last, returns it to the escaping team') && r026.cites.some((c) => c.startsWith('transitions[c:proposed:A02-HPE1:A02-HPE1-T1-3].awardedTo')), json(r026))
    assert.deepEqual(w.answers.map((a) => a.limits.length), [0, 0, 0, 1])
    assert.ok(w.answers[3].limits[0].startsWith('4c is weaker than it reads'))
    // FIX (V4 finding 3): the event's meaning for RPC-002 is read UNREVIEWED; nothing calls it approved knowledge.
    const r027 = w.answers[3].rows.find((r) => r.rowId === 'RPC-PROP-027')!
    assert.ok(r027.reading.includes('its meaning for RPC-002 is UNREVIEWED') && !r027.reading.includes('inside approved knowledge') && !r027.reading.includes('approved High Press Escape rules'), r027.reading)
    for (const r of w.answers.flatMap((a) => a.rows)) assert.equal(r.words, (rpcLibrary.properties('RPC-002').find((x: any) => x.property_id === r.rowId) as any).property_text, `${r.rowId}: the row's own words`)
    // Question 3's two LAW-11 arms: the built one read from the laws account (DEPARTED), naming our DRAFT laws reading's bypass.
    assert.equal(w.answers[2].arms.length, 2)
    assert.ok(w.answers[2].arms[0].startsWith('built (PROPOSED, question Q3; LAW-11 DEPARTED)') && w.answers[2].arms[0].includes(`'${LAW11_BYPASS}'`))
    // Every fact that reads an element cites it with its labels, each read from the handoff's grading (never 'no line' where an element is read).
    for (const a of w.answers) for (const f of a.facts) for (const c of f.cites) assert.ok(!c.endsWith('[no line]'), `${f.id}: ${c}`)
    const cites = w.answers.flatMap((a) => a.facts.flatMap((f) => f.cites))
    assert.ok(cites.includes('activityRoles[c:proposed:A02-HPE1:A02-HPE1-B1-2].scoresBy [PROPOSED]'), json(cites))
    assert.ok(cites.includes('space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].position.along [ILLUSTRATIVE]'), 'the schematic offset reads ILLUSTRATIVE where it is cited')
    assert.ok(cites.includes('value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-02.a].value [CANDIDATE (our restatement)]'))
    assert.ok(cites.includes("objectives[c:restated:GF2:GF2-08.c].reference [RULING (Christian's, recorded on the knowledge item)]"))
    assert.ok(cites.includes('value.primaryEvent.kind [PROPOSED]'), 'the choice of the zone event among the approved four is our PROPOSED item')
    assert.ok(cites.includes('space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].functions [NOT_ESTABLISHED]'), 'the line\'s function is named only by the PROPOSED item\'s selector: its realized field is cited as not established')
    assert.ok(cites.includes('transitions[c:proposed:A02-HPE1:A02-HPE1-T1-2].awardedTo [PROPOSED]'), 'the restart after a point is our PROPOSED item (Q6)')
    // What differs from plain GF2, read from the two realized games, every element labelled.
    const differs = differsFromPlainGf2(at(REVIEW_RUN), at(GF2W))
    for (const words of ['the roles held for a block (ESCAPING, PRESSING) [PROPOSED]', 'the marked line [PROPOSED]', "the pressing team's own event (line_crossed) [PROPOSED]", 'the restart at the start, after each point and over an end line (3 transitions) [PROPOSED]', "the conditions on the escaping team's event (origin, progression, control) [CANDIDATE (our restatement)], judged by the coach in play", 'no offside [PROPOSED]', "the pressing team's target is GF2's end-line objective"]) assert.ok(differs.includes(words), `what differs names: ${words} (it said ${differs})`)
})

// Stage A2, re-pinned openly: 1d failed on the control because its targets' nouns are alike; it now fails because its two targets lie at
// opposite ends (read from positions), so that fact no longer measures a label. The control's score is unchanged: 0 of 4. Which control facts
// still fail only for want of a PROPOSED role token or own event is reported (1a, 1b, 1e, 3a, 3c, 4c, 4d), not hidden.
test(`the negative control A02-GF2W (plain GF2 with our CANDIDATE wording beside it): none of the four questions (at most 2 expected), 1d failing on position (its targets at opposite ends); RPC-002's approved rows read on it; the walkthrough reads no sentence`, () => {
    const control = walkthroughOf(at(GF2W))
    assert.deepEqual(control.answers.map((a) => [a.n, a.established]), [
        [1, false],
        [2, false],
        [3, false],
        [4, false],
    ])
    assert.ok(control.count <= 2, 'at most 2 of 4 on the control')
    // What holds on plain GF2 is said, never hidden: live equal teams, play continuing, the approved event, no constraint.
    const holding = control.answers.flatMap((a) => a.facts.filter((f) => f.holds).map((f) => f.id))
    assert.deepEqual(holding, ['1c', '2a', '2c', '3d'])
    const f1d = control.answers[0].facts.find((f) => f.id === '1d')!
    assert.ok(f1d.evidence[0].endsWith('not both near one end'), `1d fails on position: ${f1d.evidence[0]}`)
    assert.deepEqual(control.answers.flatMap((a) => a.rows.map((r) => [r.rowId, r.verdict])), [
        ['RPC-PROP-022', 'not held'],
        ['RPC-PROP-023', 'partly held'],
        ['RPC-PROP-024', 'not held'],
        ['RPC-PROP-025', 'not held'],
        ['RPC-PROP-026', 'not punished'],
        ['RPC-PROP-027', 'rewarded'],
        ['RPC-PROP-028', 'not addressed'],
        ['RPC-PROP-029', 'not punished'],
    ])
    // The walkthrough reads no sentence: the review-level run read with every sentence removed, and with our wording said on A02-GF2W, is the same.
    const silent = copy(at(REVIEW_RUN).answer)
    silent.sentences = []
    assert.deepEqual(walkthroughOf(at(REVIEW_RUN), at(REVIEW_RUN).built, silent), walkthroughOf(at(REVIEW_RUN)))
    const worded = copy(at(GF2W).answer)
    worded.sentences = [...worded.sentences, ...WORDING.entries.map((e) => ({ section: 'How to score', block: null, text: e.sentence, from: [], wording: 'CANDIDATE' }))] as any
    assert.deepEqual(walkthroughOf(at(GF2W), at(GF2W).built, worded), control, 'our wording added to plain GF2 establishes nothing')
    // The print of A02-GF2W carries our wording beside the plain text, marked CANDIDATE, stating none of its sentences.
    const print = gf2wPrint(at(GF2W))
    assert.ok(print.lines.some((l) => l.marker === 'C' && l.text.startsWith(WORDING.entries[0].sentence)))
    assert.ok(print.lines.every((l) => !l.states.length), 'beside the text only: our sentences state none of its sentences')
})

// Stage A2 (V2 finding 18), re-pinned openly: the title said 'the conditions removed (4)' while the test asserts 2, 3 and 4 (the line is found
// only through the progression condition's referent, so removing the conditions removes questions 2 and 3 too). New bites: 1d (a target
// moved beyond the half at the escaping team's end), 1e (the restart removed), and RPC-002's rows (the control condition removed: RPC-PROP-026
// not punished; the scoring event made one that counts no dribble: RPC-PROP-027 not rewarded).
test("each question's predicate bites, on a changed copy of the review-level run's realized game: the pressing team's own event folded (1 and 4), the escape line's referent removed (2, 3 and 4), the conditions removed (2, 3 and 4: the line is found through the progression condition's referent), an element of another kind added (2 and 3), the escaping team's target moved beyond the half (1), the restart removed (1); and RPC-002's rows: the control removed (RPC-PROP-026 not punished), the end-line restart against the last toucher (RPC-PROP-026 punished), an event counting no dribble (RPC-PROP-027 not rewarded)", () => {
    const base = at(REVIEW_RUN)
    const changedBuilt = (change: (fixture: any) => void) => {
        const built = copy({ fixture: base.built.fixture })
        for (const b of built.fixture.roleBlocks.blocks) change(b.fixture)
        return built
    }
    const changed = (change: (game: any) => void) => walkthroughOf(base, changedBuilt((f) => change(f.game))).answers.map((a) => a.established)
    assert.deepEqual(changed((g) => delete g.activityRoles.find((r: any) => r.activityRole === 'PRESSING').scoresBy), [false, true, true, false])
    assert.deepEqual(changed((g) => delete g.value.primaryEvent.conditions.find((c: any) => c.type === 'progression').referents), [true, false, false, false])
    assert.deepEqual(changed((g) => (g.value.primaryEvent.conditions = [])), [true, false, false, false])
    assert.deepEqual(changed((g) => (g.restrictions = [{ elementId: 'BITE', rule: 'no backward pass' }])), [true, false, false, true])
    // 1d: the escaping team's zone moved to begin beyond the half of the area at its own end (25 m from it): question 1 not established.
    const moved = changedBuilt((f) => {
        for (const g of f.status.geometry as any[]) {
            const region = (f.game.space.regions as any[]).find((r) => g.path === `space.regions[${r.elementId}].position.along` && r.noun === 'zone')
            if (region) g.geometry.interval = g.geometry.interval.from === 0 ? { from: 0, to: 15 } : { from: 25, to: 40 }
        }
    })
    const movedWalk = walkthroughOf(base, moved)
    assert.deepEqual(movedWalk.answers[0].facts.filter((f) => !f.holds).map((f) => f.id), ['1d'], 'bite: only 1d fails')
    assert.equal(movedWalk.answers[0].established, false)
    // 1e: the restart's transitions removed: question 1 not established.
    const noRestart = walkthroughOf(base, changedBuilt((f) => (f.game.transitions = (f.game.transitions as any[]).filter((t) => t.playState !== 'STOP_RESUME'))))
    assert.deepEqual(noRestart.answers[0].facts.filter((f) => !f.holds).map((f) => f.id), ['1e'], 'bite: only 1e fails')
    // RPC-002's rows: the control condition removed (RPC-PROP-026 not punished); the event made target_player, whose approved description
    // counts no dribble (RPC-PROP-027 not rewarded).
    const rowsOf = (w: Walkthrough) => Object.fromEntries(w.answers.flatMap((a) => a.rows.map((r) => [r.rowId, r.verdict])))
    assert.equal(rowsOf(walkthroughOf(base, changedBuilt((f) => (f.game.value.primaryEvent.conditions = (f.game.value.primaryEvent.conditions as any[]).filter((c) => c.type !== 'control')))))['RPC-PROP-026'], 'not punished')
    assert.equal(rowsOf(walkthroughOf(base, changedBuilt((f) => (f.game.value.primaryEvent.kind = 'target_player'))))['RPC-PROP-027'], 'not rewarded')
    // FIX (13 November 2026, V4 finding 1): the end-line restart awarded against the last toucher (the possession game's own NOT_LAST_TOUCH):
    // RPC-PROP-026 punished and no limit under 4c; the end-line restart removed: punished too (no restart hands a clearance back).
    const lastTouch = walkthroughOf(base, changedBuilt((f) => {
        for (const t of f.game.transitions as any[]) if (((t.selector ?? []) as any[]).some((s) => s.attribute === 'trigger' && s.value === 'OUT_END_LINE')) t.awardedTo = 'NOT_LAST_TOUCH'
    }))
    assert.equal(rowsOf(lastTouch)['RPC-PROP-026'], 'punished', 'bite: an end-line restart against the last toucher punishes the clearance')
    assert.deepEqual(lastTouch.answers[3].limits, [])
    const noEndLine = walkthroughOf(base, changedBuilt((f) => (f.game.transitions = (f.game.transitions as any[]).filter((t) => !((t.selector ?? []) as any[]).some((s: any) => s.attribute === 'trigger' && s.value === 'OUT_END_LINE')))))
    assert.equal(rowsOf(noEndLine)['RPC-PROP-026'], 'punished')
    // And the chain's account: a constraint applied reads as an element that may instruct a team (2 and 3).
    const constrained = copy(base.answer)
    constrained.account!.constraints = ['tl-v0-constraint-turnover-reward']
    assert.deepEqual(walkthroughOf(base, base.built, constrained).answers.map((a) => a.established), [true, false, false, true])
})

test('the rewordings (the A02-2~ family\'s method): no knowledge-governed result of A02-HPE1 moves (context, Game Problem, form, constraints, both realized games, lines, stop, sentences, pending entry); the engine lenses move (reported only); a moved block is named material (bite)', () => {
    const rows = rewordingRows()
    assert.deepEqual(materialEffects(rows), [])
    assert.deepEqual(rows.filter((r) => r.moves.length).map((r) => [r.facet, r.governed, r.moves]), [
        ['engine lenses committed (ENGINE_LENS, report only)', false, ['reversed', 'neutral']],
        ['engine lens candidates (ENGINE_LENS, report only)', false, ['reversed', 'neutral']],
    ])
    // The rewrite reached the chain: the lenses it commits follow the wording.
    assert.notDeepEqual(at(reworded('reversed')).answer.observed?.lensIds, at(REVIEW_RUN).answer.observed?.lensIds)
    // Bite: a reworded build whose first block's game differs is named material.
    const doctored = new Map(B3)
    const changed = copy(at(reworded('neutral')))
    changed.built.fixture.roleBlocks.blocks[0].fixture.game.performers.teams[0].outfieldCount = 7
    doctored.set(changed.id, changed)
    assert.deepEqual(materialEffects(rewordingRows(doctored)), ["each block's realized game (sha-256) moves under neutral"])
})

test('the safeguard check on the HPE-1 runs: Steps 1 and 2 and the constraints consumed, every clause CARRIED (progression through the configuration\'s replacement), the display CARRIED, OD-CONTEXT the only violation; bite: read without the replacement, the progression clause is CITED_NOT_CARRIED', () => {
    for (const id of SAFEGUARD_RUNS) {
        const findings = safeguardFindings(at(id))
        assert.equal(failureOf(findings), 'PASSED', id)
        assert.deepEqual(findings.map((f) => [f.row, f.clause, f.verdict]), [
            ['GAME_PROBLEM', null, 'CONSUMED'],
            ['GAME_PROBLEM_HINTS', null, 'CONSUMED'],
            ['CONTEXT', null, 'AGREES_INDEPENDENTLY'],
            ['GAME_FORM', null, 'CONSUMED'],
            ['CONSTRAINTS', null, 'CONSUMED'],
            ['SELECTION_OUTCOME', null, 'LEGITIMATE_CHAIN_DECISION'],
            ['SCORING', 'origin', 'CARRIED'],
            ['SCORING', 'progression', 'CARRIED'],
            ['SCORING', 'control', 'CARRIED'],
            ['SCORING_DISPLAY', null, 'CARRIED'],
            ['REALIZATION', null, 'LEGITIMATE_CHAIN_DECISION'],
        ], id)
        assert.ok(findings.find((f) => f.clause === 'progression')!.why.startsWith('RPC-002-03.a, A02-HPE1-03.b, RPC-002-03.c entered derivation'), id)
    }
    // Bite: the clause read from the store as it stands (RPC-002-03.b, which the configuration replaces on the chain's copy) is caught.
    const blind = safeguardFindings(at(REVIEW_RUN), S.SCORING)
    assert.equal(blind.find((f) => f.clause === 'progression')?.verdict, 'CITED_NOT_CARRIED')
    assert.notEqual(failureOf(blind), 'PASSED')
    // And without OD-CONTEXT carried by these runs, the context's violation is unlisted (the entry is what lists it).
    assert.throws(() => S.assertExperimentRun(safeguardFindings(at(REVIEW_RUN))), /AGREES_INDEPENDENTLY/)
})

test("the review-level run's LAW-11 departure is graded PROPOSED (our configuration's laws block, ours, not a ruling), never a ruling of a production provisional realization; bite: the same answer graded for a case whose configuration does not carry its departures reads the ruling, and is caught", () => {
    assert.deepEqual(lawPremiseRefusals(at(REVIEW_RUN).result), [])
    const line = at(REVIEW_RUN).result.lines.find((l) => l.lineId === 'defaultLaws:LAW-11')!
    assert.deepEqual([line.premises.map((p) => p.ref), line.sixClass], [['LAW-11 departed from on our PROPOSED configuration (TT-PROPOSED-HPE1-LAWS: its laws block; ours, not a ruling)'], 6])
    // Bite: the case copy without lawDepartures, graded on the review-level run's own answer.
    const c = caseOf(REVIEW_RUN)
    for (const t of c.testOnlyTreatments) if (t.proposed) delete t.proposed.lawDepartures
    const regraded = runHandoff(c, a02Inputs, { build: () => copy(at(REVIEW_RUN).answer) }, committedKnowledge())
    assert.ok(lawPremiseRefusals(regraded).some((x) => x.includes("LAW_DEPARTURE 'RULING, provisional'")), json(lawPremiseRefusals(regraded)))
})

// Stage A1, re-pinned openly: the print was the administrator's draft of the refused run, 15 sentences and 276 words (stage B2); it is the
// served text, 19 sentences and 377 words (measured): the escape line and the two targets are now said, the opening pick is replaced by the
// PROPOSED restart's three sentences, and Christian's possession sentence is said whole.
// Stage A2 (13 November 2026, the lead's decisions W1 and W2), re-pinned openly: BEFORE, the print was the engine's 19 sentences (377 words)
// with the printed-only sentences beside them, marked only by whose words they are. AFTER: the coach text, 12 lines, 17 sentences and 330 words
// (measured: what a coach reads), each engine sentence printed as said or stated by one sentence of ours, every line graded as the handoff
// grades it; the engine's own text is 19 sentences and 435 words (our condition sentence, said by the engine, now carries the escaping team's
// whole scoring: the event, the condition, no extra touch, the stoppage).
// FIX (13 November 2026, from the V3 and V4 verifications), re-pinned openly. BEFORE: 330 words (Scoring 126, Learning explanation 48), the
// engine's 435 words; the possession sentence '[A | contingent on Q6]'; L1 '[A: ...]' from markerWords holding the letter; R1 '[P | PROPOSED Q6]';
// L2 '[C | contingent on Q2]'; 'A01's 27 sentences'. AFTER (measured): 326 words (Scoring 116: 'before scoring', 'or', the stoppage sentence
// without the repeated next action, 'judgment', K5's 'a point'; Learning explanation 54: L2 in the scoring line's words), the engine's 425 words;
// the possession sentence names its approved source and the date Christian's reply was received (V3 FAIL A); R1 and L2 carry Q1 (the escaping
// team's noun, PROPOSED with N3); A01's 28 Details instructions, the goal version's pinned count (V3 check 6). The whole marker of every line is
// recomputed by the print's check: [C] stripped from our condition line and L1's source cut to [A] are caught (V3 FAIL B).
test("the coach text of the review-level run (served at review level): every engine sentence printed exactly once, as said or stated by one sentence of ours; every line marked and graded ('[D | PROPOSED Qn]', '[C | contingent on Qn]', '[A: source, received date | ...]') and every ILLUSTRATIVE quantity labelled, the session's '30 m' too; 12 lines, 17 sentences and 326 words against A01's 28 Details instructions (the goal version's pin); the engine's own text 19 sentences and 425 words; a stripped grade, a stripped session label, a stripped [C] and L1's source cut to [A] are caught; the print's stated differences from the engine sentences hold", () => {
    const m = at(REVIEW_RUN)
    const { print, said, illustrativeOf, engine, reading, words } = reviewPrint(m)
    assert.deepEqual(printRefusals(print, said, illustrativeOf), [])
    assert.deepEqual(print.findings, [])
    assert.deepEqual([said.length, words], [19, 425])
    assert.deepEqual([reading.total.lines, reading.total.sentences, reading.total.words], [12, 17, 326])
    assert.deepEqual(['Setup', 'Rules', 'Scoring', 'Learning explanation'].map((part) => [reading.byPart[part].lines, reading.byPart[part].sentences, reading.byPart[part].words]), [[4, 5, 97], [4, 4, 59], [2, 6, 116], [2, 2, 54]])
    // FIX (V3 check 6): A01's figure is the goal version's pinned Details count, held to that pin's own text (bite: 27, the old figure, is no pin).
    const a01Pin = fs.readFileSync(path.resolve(HERE, '..', 'rendering', 'goal-version-communication.unit.ts'), 'utf8')
    assert.ok(a01Pin.includes(A01_PIN), `A01's figure is the pinned count: ${A01_PIN}`)
    assert.ok(!a01Pin.includes('assert.equal(activity.rendered.instructions.length, 27)'), 'bite: 27 is not the pinned count')
    // FIX (V4 finding 2): each difference the report states between a printed-only sentence and the engine sentences it stands for still holds.
    for (const d of PRINT_DIVERGENCES) {
        const p = WORDING.printerOnly.find((x) => x.id === d.id)!
        if (d.has) assert.ok(p.sentence.includes(d.has), `${d.id} says '${d.has}'`)
        assert.ok(!p.sentence.includes(d.dropped) && (p.standsFor ?? []).some((s) => s.includes(d.dropped)), `${d.id} leaves out '${d.dropped}', which a sentence it stands for says`)
    }
    assert.ok(print.text.startsWith('REVIEW LEVEL, TEST-ONLY.') && print.text.includes('SERVED at review level') && !print.text.includes('REFUSED AT'))
    assert.ok(!print.text.includes('{block'), 'no raw block token')
    // Every line's marker and grade, part by part, in each part's order (as the text prints them).
    const byPart = ['Setup', 'Rules', 'Scoring', 'Learning explanation'].flatMap((part) => print.lines.filter((l) => l.part === part))
    assert.deepEqual(byPart.map((l) => [l.part, l.shownMarker, 'printed' in l.of ? l.of.printed : 'said']), [
        ['Setup', '[D]', 'said'],
        ['Setup', '[P | PROPOSED Q1]', 'A02-HPE1-S3'],
        ['Setup', '[D]', 'said'],
        ['Setup', '[P | PROPOSED Q1]', 'A02-HPE1-S4'],
        ['Rules', "[A: Christian's approved wording POSSESSION_CONTINUES, received 25 October 2026 | contingent on Q6]", 'said'],
        ['Rules', '[P | PROPOSED Q1 | PROPOSED Q6]', 'A02-HPE1-R1'],
        ['Rules', '[D | PROPOSED Q3]', 'said'],
        ['Rules', '[D]', 'said'],
        ['Scoring', '[C | contingent on Q1]', 'said'],
        ['Scoring', '[P | PROPOSED Q1 | PROPOSED Q2]', 'A02-HPE1-K5'],
        ['Learning explanation', `[A: ${PURPOSE_MARKER}]`, 'L1'],
        ['Learning explanation', '[C | contingent on Q1 | contingent on Q2]', 'A02-HPE1-L2'],
    ])
    // FIX (V3 check 4, FAIL B): the print's check recomputes every marker. Bites on the real print: [C] stripped from our condition line, L1's
    // source cut to [A], [D] made [A] on 'There is no offside', [P] made [C] on the restart line, the possession sentence's source stripped.
    const remarked = (start: string, from: string, to: string) => ({ ...print, lines: print.lines.map((l) => (l.plain.startsWith(start) ? { ...l, shownMarker: l.shownMarker.split(from).join(to) } : l)) })
    for (const [start, from, to, what] of [
        ['The escaping team scores a point', '[C', '[', '[C] stripped from our condition line'],
        ['Continue progressing', `: ${PURPOSE_MARKER}`, '', "L1's source cut to [A]"],
        ['There is no offside', '[D', '[A', "[D] made [A] on 'There is no offside'"],
        ['Start, and restart', '[P', '[C', '[P] made [C] on the restart line'],
        ['When possession changes', ": Christian's approved wording POSSESSION_CONTINUES, received 25 October 2026", '', "the possession sentence's source stripped"],
    ])
        assert.ok(printRefusals(remarked(start, from, to), said, illustrativeOf).some((r) => r.includes('shows the marker')), `bite: ${what} is caught`)
    // The engine's 19 sentences, each where the coach text prints it.
    assert.deepEqual(engine.map((l) => l.slice(l.lastIndexOf(' -> ') + 4)), [
        'printed as said',
        'stated by A02-HPE1-S3',
        'stated by A02-HPE1-K5',
        `stated by the said sentence '${WORDING.entries[0].sentence.slice(0, 40)}...'`,
        'printed as said',
        'printed as said',
        'stated by A02-HPE1-R1',
        'printed as said',
        `stated by the said sentence '${WORDING.entries[0].sentence.slice(0, 40)}...'`,
        'stated by A02-HPE1-K5',
        `stated by the said sentence '${WORDING.entries[0].sentence.slice(0, 40)}...'`,
        'stated by A02-HPE1-K5',
        'printed as said',
        'printed as said',
        'stated by A02-HPE1-S4',
        'stated by A02-HPE1-S4',
        'stated by A02-HPE1-R1',
        'stated by A02-HPE1-R1',
        'stated by A02-HPE1-R1',
    ])
    // Bite (W2): a grade stripped from a line is caught (the pressing team's PROPOSED Q2; our condition sentence's contingent on Q1).
    const strip = (words: string) => ({ ...print, lines: print.lines.map((l) => ({ ...l, shownMarker: l.shownMarker.split(` | ${words}`).join('') })) })
    assert.ok(printRefusals(strip('PROPOSED Q2'), said, illustrativeOf).some((r) => r.includes('does not show its grade PROPOSED Q2')), 'bite: PROPOSED Q2 stripped')
    assert.ok(printRefusals(strip('contingent on Q1'), said, illustrativeOf).some((r) => r.includes('does not show its grade contingent on Q1')), 'bite: contingent on Q1 stripped')
    // The session's '30 m' (the end line's length, the area's width): in the print without our sentences in the engine's place, the engine's
    // '30 m long' line carries the session label though it cites no session path; stripped, it is caught.
    const plainPrint = fourPartPrint({ heading: [], said, printed: [], illustrativeOf, illustrativeShown: illustrativeShownOfRun(m) })
    assert.deepEqual(printRefusals(plainPrint, said, illustrativeOf), [])
    const endLine = plainPrint.lines.find((l) => l.plain.includes('30 m long'))!
    assert.ok(endLine.text.endsWith(`[${SESSION_LABEL}]`) && 'said' in endLine.of && !endLine.of.said.from.some((p) => p.startsWith('envelope.')), endLine.text)
    const unlabelled = { ...plainPrint, lines: plainPrint.lines.map((l) => (l === endLine ? { ...l, text: l.text.split(` [${SESSION_LABEL}]`).join('') } : l)) }
    assert.ok(printRefusals(unlabelled, said, illustrativeOf).some((r) => r.includes('30 m long') && r.includes('without its label')), 'bite: the session label stripped from the 30 m is caught')
})

// Stage A2 (B3's leftover, the lead's decision W6): a line our CANDIDATE restatement declares needs no further value is graded as that
// restatement (DECLARED_ABSENCE, CANDIDATE, class 3), no longer UNRESOLVED (class 6); declared by any contract that is not our DRAFT one, it stays
// UNRESOLVED (the bite).
test("a line our restatement declares needs no further value (the origin's and the continuation's place, V5) is graded DECLARED_ABSENCE, CANDIDATE, class 3; declared by a contract that is not our DRAFT restatement it is UNRESOLVED again (bite)", () => {
    const declared = (r: HandoffResult) => r.lines.filter((l) => l.kind === 'NOT_ESTABLISHED' && l.premises.some((p) => p.kind === 'DECLARED_ABSENCE'))
    const review = at(REVIEW_RUN)
    assert.deepEqual(declared(review.result).map((l) => [l.lineId, l.sixClass, l.premises.map((p) => p.kind)]), [
        ['c:restated:RPC-002:RPC-002-02.a::V5', 3, ['DECLARED_ABSENCE']],
        ['c:restated:RPC-002:RPC-002-04.a::V5', 3, ['DECLARED_ABSENCE']],
    ])
    // Bite: the same answer graded with the declaring contract renamed to one the chain did not read from the draft store.
    const c = caseOf(REVIEW_RUN)
    const answer = copy(review.answer)
    for (const l of answer.lines) if (l.nonClaim) l.nonClaim.by = ['restated:NOT-A-DRAFT']
    const regraded = runHandoff(c, a02Inputs, { build: () => copy(answer) }, committedKnowledge())
    assert.deepEqual(declared(regraded).length, 0)
    assert.ok(regraded.lines.filter((l) => l.lineId.endsWith('::V5') && l.kind === 'NOT_ESTABLISHED').every((l) => l.sixClass === 6 && l.premises.every((p) => p.kind === 'UNRESOLVED')), 'bite: UNRESOLVED again')
})

test('appendix F: generated twice from two builds, identical; double quotation marks only around Christian\'s words; no gendered pronoun', () => {
    const first = appendixF().join('\n')
    const second = appendixF(buildB3()).join('\n')
    assert.equal(second, first)
    const words = new Set(a02Inputs.rulings.flatMap((r) => r.words))
    const spans = quotedSpans(first)
    assert.ok(spans.length > 3)
    for (const s of spans) assert.ok(words.has(s), `a double-quoted span that is not Christian's words: ${s}`)
    const hit = first.split('\n').findIndex((l) => holdsGenderedPronoun(l))
    assert.equal(hit, -1, `a gendered pronoun at line ${hit + 1}`)
})

test('registered', () => {
    const registry = JSON.parse(fs.readFileSync(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json'), 'utf8')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/a02-acceptance.unit.ts'))
})

// Under A02_ACCEPTANCE_PRINT=<file>: appendix F written there (the measurement the pins above were read from).
if (MAIN && process.env.A02_ACCEPTANCE_PRINT) fs.writeFileSync(process.env.A02_ACCEPTANCE_PRINT, appendixF().join('\n'))
if (MAIN) quiet(`a02 acceptance (stage B3): ${passed} passed`)
