/**
 * **Stage B3 of the A02 complete-activity package: the review-level activity's evidence, Christian's acceptance walkthrough read from the
 * built game's structure, the rewording measurement and the safeguard check on the HPE-1 runs** (12 November 2026). TEST-ONLY review evidence:
 * nothing here is served to a coach, written to production knowledge or approved wording, or an authorization.
 *
 * Christian, received 12 November 2026: "The resulting activity must make the intended High Press Escape problem recognizable and actionable
 * for a coach." "I want to see where coordinated pressure comes from, how players encounter information about that pressure, what genuine
 * escape opportunities exist, and how the game's consequences make successful solutions meaningful." "A generic Directional Possession Game
 * with additional wording would not, by itself, establish that we've achieved this." "That evaluation will be part of my ecological review."
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
import { rpcLibrary } from '../sport-module/rpc-library'
import * as S from './a02-safeguards.unit'
import { inputs as a02Inputs, quotedSpans } from './a02.unit'
import { displayCell } from './assembly-display'
import { citedDateOf } from './assembly'
import { fourPartPrint, printRefusals, PrintedOnly, SaidSentence } from './four-part-print.unit'
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
export interface Answer {
    n: number
    question: string
    facts: Fact[]
    established: boolean
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
    const f1a = fact(m, blocks, '1a', 'one team presses for the whole block: a role held until the coach calls the exchange, the other team holding the other role', (b) => {
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
    const f1d = fact(m, blocks, '1d', "the two teams' targets differ: the pressing team's is the escaping team's end line, the escaping team's a region beyond the marked line (an asymmetric game, not two mirrored attacks)", (b) => {
        const esc = regionOfRef(b.game, objectiveOf(b.game, b.holders?.ESCAPING)?.reference)
        const pre = regionOfRef(b.game, objectiveOf(b.game, b.holders?.PRESSING)?.reference)
        const holds = !!esc && !!pre && esc.elementId !== pre.elementId && esc.noun !== pre.noun
        return { holds, said: holds ? `the escaping team attacks a ${esc.noun}, the pressing team a ${pre.noun}` : 'no two role targets that differ', paths: [esc, pre].filter(Boolean).map((r) => `${regionPath(r)}.noun`) }
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
    const f4a = fact(m, blocks, '4a', 'the escaping team scores only from an attack that began against coordinated pressure, and only beyond the marked line (the conditions on its event, the whole game)', (b) => {
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

    const answers: Answer[] = [
        [f1a, f1b, f1c, f1d],
        [f2a, f2b, f2c],
        [f3a, f3b, f3c, f3d],
        [f4a, f4b, f4c, f4d],
    ].map((facts, n) => ({ n: n + 1, question: QUESTIONS[n], facts, established: facts.every((f) => f.holds) }))
    return { runId: m.id, answers, count: answers.filter((a) => a.established).length }
}

const ESTABLISHED = "established by the game's structure"
const NOT_ESTABLISHED = 'not established'
export function walkthroughLines(w: Walkthrough): string[] {
    const out: string[] = []
    for (const a of w.answers) {
        out.push(`${a.n}. ${a.question}: ${a.established ? ESTABLISHED : NOT_ESTABLISHED}`)
        for (const f of a.facts) {
            out.push(`   ${f.id} [${f.holds ? 'holds' : 'DOES NOT HOLD'}] ${f.what}`)
            for (const e of f.evidence) out.push(`      ${e}`)
            if (f.cites.length) out.push(`      elements: ${f.cites.join('; ')}`)
        }
    }
    out.push(`${w.runId}: ${w.count} of 4 established by the game's structure`)
    return out
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The four-part print (as a02-hpe1-wording.unit.ts W7 prints the review-level run), and A02-GF2W printed with our wording beside it
// ---------------------------------------------------------------------------------------------------------------------------------------

const SOURCES = candidateWordingSourcesOf(a02Inputs.rulings.map((r) => ({ id: r.id, words: r.words, received: r.received })))
const WORDING = loadCandidateWording(SOURCES)
const PURPOSE = displayCell(committedKnowledge(), { source: 'planning', table: 'learning_goals', row: 'A02', column: 'Coach Definition' }).text
const PURPOSE_NOTE = "the Learning Goal's Coach Definition, verbatim: the source Christian chose (received 21 October 2026); its Active status is not a dated approval"
export const MARKERS = "Markers: [A] APPROVED, [C] CANDIDATE (ours, for review), [D] DRAFT (the renderer's own words), [P] PROPOSED (new knowledge of ours, for approval)."
const saidOf = (m: Made): SaidSentence[] => m.answer.sentences.map((s) => ({ section: s.section, block: s.block, text: s.text, from: s.from, wording: s.wording }))
/** The ILLUSTRATIVE label of a path the run's sentence cites: the session's values, and every line resting on an item the chain received ILLUSTRATIVE. */
function illustrativeOfRun(m: Made): (p: string) => string | null {
    const items = new Set(m.answer.contracts.flatMap((c) => c.items.filter((i) => i.category === 'ILLUSTRATIVE').map((i) => `${c.contractId}::${i.itemId}`)))
    const schematic = new Set(m.answer.lines.filter((l) => l.kind === 'DERIVED' && (l.support ?? []).some((s) => items.has(`${s.contractId}::${s.itemId}`))).map((l) => l.path))
    return (p) => (p.startsWith('envelope.') && p !== 'envelope.roles' ? 'ILLUSTRATIVE: session value, a test value' : schematic.has(p) ? 'ILLUSTRATIVE: the schematic 12 m of this 40 m area; the placement rule governs (PROPOSED)' : null)
}
const printedOnly = (): PrintedOnly[] => [
    ...WORDING.printerOnly.map((p) => ({ id: p.id, part: p.part, label: p.label, sentence: p.sentence })),
    { id: 'L1', part: 'Learning explanation' as const, label: 'APPROVED' as const, sentence: PURPOSE, note: PURPOSE_NOTE },
]
export function reviewPrint(m: Made) {
    const said = saidOf(m)
    const illustrativeOf = illustrativeOfRun(m)
    const heading = [
        `REVIEW LEVEL, TEST-ONLY. Built through the checked pathway for Christian's review; ${m.answer.outcome === 'served' ? 'SERVED at review level' : `REFUSED AT ${String(m.answer.stage).toUpperCase()}, so this is the draft an administrator sees`}, never served to any coach; nothing here is live.`,
        MARKERS,
    ]
    const print = fourPartPrint({ heading, said, printed: printedOnly(), illustrativeOf })
    return { print, said, illustrativeOf, words: said.reduce((n, s) => n + s.text.split(/\s+/).length, 0) }
}
/** A02-GF2W's text with our CANDIDATE wording printed beside it: plain GF2 'with additional wording', the wording entering no structure. */
export function gf2wPrint(m: Made) {
    const said = saidOf(m)
    const printed: PrintedOnly[] = [{ id: WORDING.entries[0].id, part: 'Scoring', label: 'CANDIDATE', sentence: WORDING.entries[0].sentence, note: 'printed beside the text only: no element of this game carries it' }, ...printedOnly()]
    const heading = ["NEGATIVE CONTROL, TEST-ONLY: plain GF2 (A02-D's build) with our CANDIDATE wording printed beside it; the wording enters no structure; never served; nothing here is live.", MARKERS]
    return fourPartPrint({ heading, said, printed, illustrativeOf: illustrativeOfRun(m) })
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The element table, generated from the build: every configuration line of the review-level run, by element, with its labels
// ---------------------------------------------------------------------------------------------------------------------------------------

export function elementTable(m: Made): string[] {
    const out: string[] = []
    const elementOf = (p: string) => (p.indexOf(']') > 0 ? p.slice(0, p.indexOf(']') + 1) : p.split('.')[0])
    const groups = new Map<string, string[]>()
    // A line nothing establishes says why (the chain's reason), and where our CANDIDATE restatement declares it needs no further value, says so
    // (an established absence, read from the chain's own line; the handoff's grading still reads every such line UNRESOLVED: left open).
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
export const A01_SENTENCES = 27

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
            ? `The review-level run ${REVIEW_RUN} is served at review level (stage A1, 13 November 2026; TEST-ONLY, never released), with ${review.built?.activity?.integrity?.fidelityViolations ?? 'unknown'} fidelity violations: the renderer and fidelity read the register the game was derived over (TEST-ONLY, only on a build given our CANDIDATE wording); each role's own-event sentence cites its own objective's role; the two targets (the zone beyond the marked line, the escaping team's end line) are named in one sentence read only from our CANDIDATE wording file; and the PROPOSED restart (question Q6) starts play, and restarts it after each point and when the ball goes over an end line, the ball to the escaping team. Fidelity reads our CANDIDATE wording beside the approved table, as it reads approved wording (stage B2).`
            : `The review-level run ${REVIEW_RUN} is refused at ${review.answer.stage}; it is printed below as the draft an administrator sees, never as served.`,
    )
    out.push(`Pending (awaiting Christian's approval, never a pass): ${(review.answer.reviewLevel?.pendingApproval ?? []).map((e) => `${e.item} (question ${e.questionId}), in ${e.blocks.length} blocks: ${withoutGenderedPronouns(plain(e.finding))}`).join('; ') || 'none'} (the guard's words, printed without a gendered pronoun)`)
    // Stage A1, re-pinned openly: the heading said 'the administrator's draft of the refused run'.
    out.push(`F2. THE REVIEW-LEVEL ACTIVITY IN FOUR PARTS (${review.answer.outcome === 'served' ? 'the text served at review level' : "the administrator's draft of the refused run"}; every sentence marked; every ILLUSTRATIVE quantity labelled where it shows):`)
    out.push(...p.print.text.split('\n').map((l) => `   ${l}`))
    out.push(`Concision (measured): ${p.said.length} sentences and ${p.words} words in the engine's text, beside the printed-only sentences; A01's served Details hold ${A01_SENTENCES} sentences.`)
    out.push('F3. THE ELEMENT TABLE (generated from the build: every configuration line of the review-level run, by element, each with the labels of what it rests on, read from the item\'s category by the handoff\'s grading; never typed by hand):')
    out.push(...elementTable(review))
    out.push(`F4. THE ACCEPTANCE WALKTHROUGH (Christian's four questions, ${christian('A02-12NOV-PACKAGE', 14)}; each answered from the realized game's elements in both role blocks, never from a sentence; a development finding only, never ecological validation, which Christian keeps for the ecological review, received 12 November 2026, item 6):`)
    out.push(...walkthroughLines(w).map((l) => `   ${l}`))
    out.push(`The negative control ${GF2W} (plain GF2 as A02-D builds it, with our CANDIDATE wording printed beside it; ${christian('A02-12NOV-PACKAGE', 15)}):`)
    out.push(...walkthroughLines(control).map((l) => `   ${l}`))
    out.push(`   what a coach would read in ${GF2W} (the wording claims what no element carries):`)
    out.push(...gf2wPrint(at(GF2W, from)).text.split('\n').map((l) => `      ${l}`))
    out.push(`Limits kept visible (each is Christian's ecological review or a field trial, not this walkthrough): whether the pressing team presses together, and how often a qualifying start arises; whether the line's place (the schematic 12 m, ILLUSTRATIVE) serves the problem, and whether a coach can apply the placement rule; whether an escaping team, which cannot score unpressed, waits for or invites pressure; whether the PROPOSED restart (question Q6, stage A1: the ball to an escaping player near their own end at the start, after each point and when the ball goes over an end line) recreates the pressure conditions, which it never stands in for (the coach still judges the pressure in play; a ball given at a restart is not assumed to create organized opposition, Christian's caution received 5 November 2026); that no item writes the restart policy row, so every other dead ball keeps the normal Laws, and the kick-off stays owed in the laws account (PROCEDURAL under our DRAFT reading, reported); whether a coach can judge the start under pressure in play; the pressing team's reward (question 2); offside (question 3); and Christian's concern, ${christian('A02-12NOV-NEXT-ACTION', 14)} (OURS: in A02-HPE1 the escaping team has no goal, so no shot arises; the concern stays visible for the ecological review). No player-learning effect is claimed (Christian asks for none yet, received 12 November 2026, item 6).`)
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

test("the walkthrough on A02-HPE1's realized game: 4 of 4 established by the game's structure, every fact holding in both role blocks, each citing its elements with their labels", () => {
    const w = walkthroughOf(at(REVIEW_RUN))
    assert.deepEqual(w.answers.map((a) => [a.n, a.established, a.facts.filter((f) => !f.holds).map((f) => f.id)]), [
        [1, true, []],
        [2, true, []],
        [3, true, []],
        [4, true, []],
    ])
    assert.equal(w.count, 4)
    // Every fact that reads an element cites it with its labels, each read from the handoff's grading (never 'no line' where an element is read).
    for (const a of w.answers) for (const f of a.facts) for (const c of f.cites) assert.ok(!c.endsWith('[no line]'), `${f.id}: ${c}`)
    const cites = w.answers.flatMap((a) => a.facts.flatMap((f) => f.cites))
    assert.ok(cites.includes('activityRoles[c:proposed:A02-HPE1:A02-HPE1-B1-2].scoresBy [PROPOSED]'), json(cites))
    assert.ok(cites.includes('space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].position.along [ILLUSTRATIVE]'), 'the schematic offset reads ILLUSTRATIVE where it is cited')
    assert.ok(cites.includes('value.primaryEvent.conditions[c:restated:RPC-002:RPC-002-02.a].value [CANDIDATE (our restatement)]'))
    assert.ok(cites.includes("objectives[c:restated:GF2:GF2-08.c].reference [RULING (Christian's, recorded on the knowledge item)]"))
    assert.ok(cites.includes('value.primaryEvent.kind [PROPOSED]'), 'the choice of the zone event among the approved four is our PROPOSED item')
    assert.ok(cites.includes('space.regions[c:proposed:A02-HPE1:A02-HPE1-S2-1].functions [NOT_ESTABLISHED]'), 'the line\'s function is named only by the PROPOSED item\'s selector: its realized field is cited as not established')
})

test(`the negative control A02-GF2W (plain GF2 with our CANDIDATE wording beside it): questions 1 and 4 not established, and none of the four (at most 2 expected); the walkthrough reads no sentence`, () => {
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
    // The walkthrough reads no sentence: the review-level run read with every sentence removed, and with our wording said on A02-GF2W, is the same.
    const silent = copy(at(REVIEW_RUN).answer)
    silent.sentences = []
    assert.deepEqual(walkthroughOf(at(REVIEW_RUN), at(REVIEW_RUN).built, silent), walkthroughOf(at(REVIEW_RUN)))
    const worded = copy(at(GF2W).answer)
    worded.sentences = [...worded.sentences, ...WORDING.entries.map((e) => ({ section: 'How to score', block: null, text: e.sentence, from: [], wording: 'CANDIDATE' }))] as any
    assert.deepEqual(walkthroughOf(at(GF2W), at(GF2W).built, worded), control, 'our wording added to plain GF2 establishes nothing')
    // The print of A02-GF2W carries our wording beside the plain text, marked CANDIDATE.
    assert.ok(gf2wPrint(at(GF2W)).lines.some((l) => l.marker === 'C' && l.text.startsWith(WORDING.entries[0].sentence)))
})

test('each question\'s predicate bites, on a changed copy of the review-level run\'s realized game: the pressing team\'s own event folded (1 and 4), the escape line\'s referent removed (2, 3 and 4), the conditions removed (4), an element of another kind added (2 and 3)', () => {
    const base = at(REVIEW_RUN)
    const changed = (change: (game: any) => void) => {
        const built = copy({ fixture: base.built.fixture })
        for (const b of built.fixture.roleBlocks.blocks) change(b.fixture.game)
        return walkthroughOf(base, built).answers.map((a) => a.established)
    }
    assert.deepEqual(changed((g) => delete g.activityRoles.find((r: any) => r.activityRole === 'PRESSING').scoresBy), [false, true, true, false])
    assert.deepEqual(changed((g) => delete g.value.primaryEvent.conditions.find((c: any) => c.type === 'progression').referents), [true, false, false, false])
    assert.deepEqual(changed((g) => (g.value.primaryEvent.conditions = [])), [true, false, false, false])
    assert.deepEqual(changed((g) => (g.restrictions = [{ elementId: 'BITE', rule: 'no backward pass' }])), [true, false, false, true])
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
test('the four-part print of the review-level run (served at review level, stage A1): every sentence in exactly one part with its marker, every ILLUSTRATIVE quantity labelled; 19 sentences, 377 words', () => {
    const { print, said, illustrativeOf, words } = reviewPrint(at(REVIEW_RUN))
    assert.deepEqual(printRefusals(print, said, illustrativeOf), [])
    assert.deepEqual(print.findings, [])
    assert.deepEqual([said.length, words], [19, 377])
    assert.ok(print.text.startsWith('REVIEW LEVEL, TEST-ONLY.') && print.text.includes('SERVED at review level') && !print.text.includes('REFUSED AT'))
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
