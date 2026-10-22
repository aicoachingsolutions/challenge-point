/**
 * **The Coach Overview: its learning purpose, game sentence and basic parameters** — stage 3A, 21 October 2026 (every coach word below
 * is DRAFT except the purpose, which is his authored knowledge, verbatim).
 *
 * His reply filed 22 October 2026, item 1: *"Coach Overview — The immediate understanding of the activity: learning purpose,
 * one-sentence game description, basic parameters, essential scoring objectives, and a simple diagram."* and *"Both levels must derive
 * from the same authorized activity representation, with no contradictions or invented instructions."* Item 3: *"My preference is to
 * use the Learning Goal's coach-facing definition as the primary source."* and *"the source and any translation should remain traceable
 * to approved knowledge. The system should not independently invent a learning purpose."* Item 5: *"I would also avoid wording that
 * implies prescribed solutions or unnecessarily specifies how players must move."*
 *
 * This stage computes three parts of the overview, for an administrator (`ServedActivity.overviewDraft`, set by the review build with
 * drafts); nothing here decides whether an activity is served. Stage 3B adds the wording statuses as data and, per block, the verbatim
 * extracts of the approved wording the game says (`derived-wording.ts`); 3C the scoring group, and 3D the agreement check (Q7) and serving
 * (`overview-fidelity.ts`: a coach is served the overview's words and pointers only where it agrees with Details in every block).
 *
 *   - **Learning purpose**: the Learning Goal's "Coach Definition", verbatim, cited to the planning model's `learning_goals` row. A
 *     mechanism demonstration has none. A goal with no definition shows none, with a gap for an administrator; none is ever composed.
 *     The context path his item 3 allows (*"Where a selected Practice Situation or other authorized context materially changes the
 *     learning emphasis"*) is NOT built: no knowledge records such a change, and the checked review selects no Practice Situation. The
 *     routed context's own statements stay unused until he records that one materially changes the emphasis.
 *   - **The game**: one template for every activity, read from the same game the Details sentences are read from (`gameReadingOf`,
 *     `teamCountPhrases`, both shared with the renderer). In role blocks, per role in the block's role order: "The {role noun} ({its
 *     counts}) attacks {its target}", joined by "; ". Otherwise: "{N} teams of {k}[, with {n} neutral players who support {side}]:
 *     each team attacks the {noun} at the other team's end." A target no rule below covers withholds the sentence, never the activity.
 *   - **Basic parameters**: area, players, duration: "{L} x {W} m, {N} players, {D} minutes", each number bound to the path the Details
 *     sentence binds it to. Digits only: fidelity reads no "one" (its known limit), so a count is never spelled out.
 *
 * "Halfway" is a DERIVED TERM, never knowledge (BUILD PLAN; his item 7 speaks of it for one particular area only): it is said only
 * where the marked line is held at a single point and twice its distance from the end line is the area's length, and the sentence cites
 * both values. No goal, activity, value or sport term is written here; every noun is the game's or the role's DRAFT noun.
 *
 * **Stage 3C: how each team scores** (`scoringGroupsOf`, below). Which conditions the overview must state is read from the PROPOSED
 * essentials table (`docs/audits/overview-essentials.json`, loaded here), keyed by register row and condition type and never by
 * activity; per team, the composer chooses his approved wording said whole, then the shortest verbatim extract of it, then the Details
 * sentence or a DRAFT shortening of it, and points every detail it leaves out to the Details sentence saying it in full.
 *
 * **Stage 3F (his reply filed 23 October 2026, items 4 and 6)**: what a sentence states is its meaning, never its citations (his wording
 * said whole by its recorded reading, `wholes`); an exception is material where the condition it follows from is absent (`followsFrom`);
 * the composer keeps the most concise set that states every material field; and each team's group opens with one line saying how the
 * team scores (`place`), which the served overview presents first.
 *
 * **Polish pass P1 (22 October 2026)**: the coach is served one group per team, in the game sentence's team order, each under its heading
 * (`teamHeadingOf`, DRAFT): the team's line first, then its own qualifications; a pointer every team's group has is shown once after the
 * groups (`overview-fidelity.ts` `coachOverviewOf`, held by Q7).
 */
import fs from 'node:fs'
import path from 'node:path'

import { loadRegister } from '../derivation/corpus'
import { AUDITS_DIR } from '../derivation/knowledge-root'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { ApprovedWording, approvedWording, canonicalJson } from './approved-wording'
import { coverReadingOf, ReadingsAccount, readingsAccountOf, readingsAccountOfReading, ReadingsLoad, recordedReading, recordedReadings } from './approved-wording-readings'
import {
    approvedEntriesSaid,
    CoverReading,
    DerivedExtract,
    detailsWordingOf,
    extractStatusOf,
    extractsFor,
    ExtractUnit,
    ReadingRecord,
    sentencesOf,
    WholeReading,
    wholeReadingOfSentence,
    wholeReadingsFor,
    WithheldExtract,
    WordingSource,
    WordingStatus,
} from './derived-wording'
import { MECHANISM_DEMONSTRATIONS } from './mechanism-demonstrations'
import {
    ATTACKING_END,
    BEYOND,
    Binding,
    boundedEpisodeStartersOf,
    gameReadingOf,
    Instruction,
    InstructionPart,
    renderConcreteGame,
    SIDE_BY_POSSESSION,
    SourceStatus,
    statusesOf,
    strongest,
    teamCountPhrases,
    UNBOUNDED_CREDIT,
} from './render-concrete-game'
import type { OverviewCheck, OverviewReading, PresentedOverview } from './overview-fidelity'
import { genericPath, KIND_OF_ROW, registerRowIndex, rowOfPath } from './sections'

/** Where a learning purpose is read from: the planning model's Learning Goals sheet, its coach-facing definition (his item 3). */
export const PURPOSE_SOURCE = { file: 'back/src/system/session-planning/session-planning-model.rc1.json', table: 'learning_goals', column: 'Coach Definition' } as const

/** The learning purpose: his authored knowledge text, verbatim, with where it is read from. */
export interface OverviewPurpose {
    text: string
    /** Approved canonical wording: approved knowledge, word for word (the RC3 draft's first status). */
    wording: 'APPROVED'
    source: { kind: 'KNOWLEDGE'; file: typeof PURPOSE_SOURCE.file; table: typeof PURPOSE_SOURCE.table; id: string; column: typeof PURPOSE_SOURCE.column }
}

/** A word said from values rather than read from knowledge, with the rule it holds by and the values it cites. */
export interface DerivedTerm {
    term: string
    rule: string
    values: Binding[]
}

/** One overview sentence, built from parts exactly as an instruction is (`InstructionPart`: status, citations, bindings). */
export interface OverviewSentence {
    slot: 'game' | 'parameters'
    text: string
    /** Newly proposed language awaiting his approval (the RC3 draft's third status). */
    wording: 'DRAFT'
    /** The sentence's source status: the strongest its parts carry. */
    status: SourceStatus
    from: string[]
    quantities: number[]
    parts: InstructionPart[]
    derivedTerms: DerivedTerm[]
}

/** Something the overview could not say, for an administrator. Never a reason to refuse the activity. */
export interface OverviewGap {
    /**
     * `extracts` (stage 3B review): a block's extracts of approved wording could not be generated; that block lists none. `scoring` (stage
     * 3C): a block's scoring groups could not be composed; that block lists none.
     */
    part: 'purpose' | 'game' | 'parameters' | 'extracts' | 'scoring'
    blockId?: string
    what: string
}

/**
 * **The overview's parts as computed for an administrator** (stage 3A). One entry per game the activity was built from: each role block,
 * or the one game. Since stage 3D the build checks it against each game's Details (`overview-fidelity.ts`, Q7) and serves the coach its words
 * and pointers only where it agrees (`ServedActivity.overview`); this draft, with the check, stays the administrator's.
 */
export interface CoachOverviewDraft {
    /**
     * Stage 3D: whether the overview is served (`ServedActivity.overview`, coach and administrator alike): true exactly where the agreement
     * check (`check`, Q7) found no violation in any block. False otherwise, and on every draft computed without the check.
     */
    served: boolean
    /** Stage 3D: the agreement check's verdict and findings (`overview-fidelity.ts`); null where it was not run. Admin-only. */
    check: OverviewCheck | null
    /** Stage 3D: word count and reading seconds of what the overview says — EVIDENCE, never a gate. Null where nothing is presented. */
    reading: OverviewReading | null
    /** Stage 3D: the overview as presented (block 1's, every block agreeing), with each sentence's status and source, for an administrator. */
    presented: PresentedOverview | null
    purpose: OverviewPurpose | null
    blocks: { blockId: string; game: OverviewSentence | null; parameters: OverviewSentence | null }[]
    /** Whether every block says the same game and parameter words (Q7.8 will also compare what they cite). */
    sameTextInEveryBlock: boolean
    gaps: OverviewGap[]
    /**
     * **Stage 3B: the verbatim extracts of the approved wording each block's game says** (`derived-wording.ts` `extractsFor`), for the
     * composer of stage 3C to choose from: each DERIVED_FROM_APPROVED, with its source entry and the covers it keeps and leaves; and those
     * withheld, with why (a source entry the game does not say). None is a sentence of the overview yet. One entry per block.
     */
    extracts: { blockId: string; extracts: DerivedExtract[]; withheld: WithheldExtract[] }[]
    /**
     * **Stage 3C: how each team scores, composed per block from that block's own Details** (`scoringGroupsOf`), with the essentials table
     * it was built on and that table's status. Labelled for an administrator while the table is PROPOSED. Never served (stage 3D checks it
     * against Details, Q7, before a coach sees it) and never deciding whether the activity is served.
     */
    scoring: OverviewScoring
    /**
     * **Stage 3F: what each approved entry said for the block states, said whole** (`derived-wording.ts` `wholeReadingsFor`), by the reading
     * the overview was built with: the covers its words state, those they do not (each with the reading's reason) and the reading's record.
     * The composer counts his wording said whole only for this; the agreement check (Q7) re-reads it, never taking this copy's word.
     */
    wholes: { blockId: string; wholes: WholeReading[] }[]
}

const stated = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/** A part, as the renderer builds one: its numbers read off its bindings, its citations each once. */
const part = (status: SourceStatus, text: string, from: string[], bindings: Binding[] = []): InstructionPart => ({ text, status, from: [...new Set(from)], quantities: bindings.map(b => b.quantity), bindings })

const sentenceOf = (slot: OverviewSentence['slot'], parts: InstructionPart[], derivedTerms: DerivedTerm[] = []): OverviewSentence => ({
    slot,
    text: parts.map(p => p.text).join(''),
    wording: 'DRAFT',
    status: strongest(parts.map(p => p.status), 'DERIVED'),
    from: [...new Set(parts.flatMap(p => p.from))],
    quantities: parts.flatMap(p => p.quantities),
    parts,
    derivedTerms,
})

/**
 * **The learning purpose** (his item 3): the Learning Goal's "Coach Definition", byte for byte, and where it is read from. Null for a
 * mechanism demonstration (`goalId` null), which claims no goal and has no purpose. Null with a gap where the goal has no definition:
 * nothing is composed in its place. `lookup` is the planning model's own row reader; a test may hand another.
 */
export function purposeOf(goalId: string | null, lookup: (id: string) => Record<string, unknown> | undefined = sessionPlanningModel.learningGoal): { purpose: OverviewPurpose | null; gap: OverviewGap | null } {
    if (goalId === null) return { purpose: null, gap: null }
    const definition = lookup(goalId)?.[PURPOSE_SOURCE.column]
    if (typeof definition !== 'string' || !definition.trim()) {
        return {
            purpose: null,
            gap: { part: 'purpose', what: `the Learning Goal ${goalId} has no "${PURPOSE_SOURCE.column}" in ${PURPOSE_SOURCE.file} ${PURPOSE_SOURCE.table}, so no learning purpose is shown; none is composed in its place` },
        }
    }
    return { purpose: { text: definition, wording: 'APPROVED', source: { kind: 'KNOWLEDGE', ...PURPOSE_SOURCE, id: goalId } }, gap: null }
}

/**
 * **The rule each derived term is said by, read from the values it cites** — stage 3D, 21 October 2026, for the overview's agreement check
 * (Q7.2, `overview-fidelity.ts`), which re-reads every derived term the overview says from its values, each also held to the number the
 * Details sentence binds at the same path. "halfway": the line's distance from the end line it is measured from, and the area's length,
 * twice the one being the other (the single-point condition is the binding itself: one number at the line's position). A term this table
 * does not hold is never said.
 */
export const DERIVED_TERM_RULES: Record<string, { rule: string; holds: (values: Binding[]) => boolean }> = {
    halfway: {
        rule: 'the marked line is held at a single point, and twice its distance from the end line it is measured from is the length of the area',
        holds: values => values.length === 2 && values[1].path === 'envelope.area.length_m' && values[0].path !== values[1].path && values[0].quantity * 2 === values[1].quantity,
    },
}

/** A target noun said with "target" once ("target zone"), as the Details scoring sentence says it (hardening H5). */
const targetWords = (noun: string): string => (noun.toLowerCase().startsWith('target') ? noun : `target ${noun}`)

/**
 * **The one-sentence game** (his item 1), or why it is not said. Read only from the fixture, through the readers the Details sentences
 * use; every number is bound to the path the Details sentence binds it to.
 */
export function gameSentenceOf(fixture: any): { sentence: OverviewSentence | null; gap: string | null } {
    const game = fixture?.game ?? {}
    const reading = gameReadingOf(fixture)
    const statusOf = statusesOf(fixture)
    const statusAt = (paths: string[], fallback: SourceStatus): SourceStatus => strongest(paths.map(p => statusOf.get(p)).filter((s): s is SourceStatus => !!s), fallback)
    const counts = teamCountPhrases(fixture)
    const regions: any[] = game.space?.regions ?? []
    const objectives: any[] = game.objectives ?? []
    const { areaLength, areaWidth } = reading
    const objectivePaths = (objective: any) => [`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`, `objectives[${objective.elementId}].role`]
    const regionOf = (objective: any) => regions.find(region => reading.referencedBy(region) === objective)

    /**
     * "At halfway": a DERIVED term. Said only where the marked line is held at one point (the line `fromTeamEnd` reads: one offset from a
     * team's end, realized at a single point inside the area) and twice that offset, and twice the point, are the area's length; cited
     * by both values. A line held anywhere else, or as a range, never reads "halfway".
     */
    const halfwayOf = (line: any): { from: string[]; term: DerivedTerm } | null => {
        const positioned = reading.fromTeamEnd(line)
        const along = reading.geometryFor(line?.elementId, 'along')
        const point = along?.geometry?.interval
        if (!positioned || !along?.path || !point || point.from !== point.to || !stated(areaLength) || positioned.offset * 2 !== areaLength || point.from * 2 !== areaLength) return null
        return {
            from: [along.path, 'envelope.area.length_m'],
            term: {
                term: 'halfway',
                rule: DERIVED_TERM_RULES.halfway.rule,
                values: [
                    { quantity: positioned.offset, path: along.path },
                    { quantity: areaLength, path: 'envelope.area.length_m' },
                ],
            },
        }
    }

    /**
     * **A role's target, by where the game puts it** — the two cases the Details target sentences say (render-concrete-game.ts, stage K7
     * and 2D), on the same conditions: a region the objective references, other than a line, across the full width, touching the end
     * of the other role's team (RC-21 "attacking end (of team T)"), and either a required depth equal to its realized extent ("the {d} m
     * target {noun} at the {other role}'s end") or beginning at the marked line ("the target {noun} beyond the marked line[ at
     * halfway]"). Anything else has no words here.
     */
    const roleTarget = (objective: any): { text: string; from: string[]; bindings: Binding[]; derivedTerms: DerivedTerm[] } | null => {
        const region = regionOf(objective)
        if (typeof region?.noun !== 'string' || region.noun === 'line') return null
        const defender = reading.otherTeamNoun(objective.team)
        const along = reading.geometryFor(region.elementId, 'along')
        const across = reading.geometryFor(region.elementId, 'across')
        const span = along?.geometry?.interval
        const wide = across?.geometry?.interval
        if (!defender || !span || !wide || wide.from !== 0 || wide.to !== areaWidth || along.geometry.term !== ATTACKING_END) return null
        if (!(span.from === 0 || span.to === areaLength)) return null
        const from = [`space.regions[${region.elementId}].noun`, along.path, across.path, ...objectivePaths(objective)]
        const depth = along.geometry.extentBound?.requiredWithin
        if (depth && stated(depth.min) && depth.min === depth.max && span.to - span.from === depth.min) {
            return { text: `the ${depth.min} m ${targetWords(region.noun)} at the ${defender}'s end`, from, bindings: [{ quantity: depth.min, path: along.path }], derivedTerms: [] }
        }
        const of = along.geometry.relation?.of
        const referent = of ? `c:${of.contractId}:${of.itemId}` : null
        if (referent && reading.markedLines.has(referent) && along.geometry.relation.term === BEYOND) {
            const halfway = halfwayOf(regions.find(r => String(r.elementId) === referent))
            return {
                text: `the ${targetWords(region.noun)} beyond the marked line${halfway ? ' at halfway' : ''}`,
                from: [...from, `space.regions[${referent}].noun`, ...(halfway ? halfway.from : [])],
                bindings: [],
                derivedTerms: halfway ? [halfway.term] : [],
            }
        }
        return null
    }

    const roles = Object.keys(reading.holdersInBlock).filter(role => reading.roleNounOf[role])
    if (roles.length) {
        // ── Role blocks: each role in the block's role order, its counts and its target ──
        const parts: InstructionPart[] = []
        const derivedTerms: DerivedTerm[] = []
        const byRole = counts.mode === 'BY_ROLE' || counts.mode === 'BY_ROLE_COUNTED'
        if (!byRole) {
            if (!counts.teamsCount) return { sentence: null, gap: 'the game holds no teams to count' }
            const { text, status, from, bindings } = counts.teamsCount
            parts.push(part(status, `${text}: `, from, bindings))
        }
        for (const [i, role] of roles.entries()) {
            const held = objectives.filter(objective => reading.roleOfDesignation(objective.team) === role)
            if (held.length !== 1) return { sentence: null, gap: `the ${reading.roleNounOf[role]} attacks ${held.length} objectives in this block, and the game sentence names exactly one target per role` }
            const objective = held[0]
            const target = roleTarget(objective)
            if (!target) return { sentence: null, gap: `no wording here says where the ${reading.roleNounOf[role]}'s target lies (objective ${objective.elementId})` }
            const team = byRole ? counts.teams.find(entry => entry.role === role) : undefined
            if (byRole && !team) return { sentence: null, gap: `the ${reading.roleNounOf[role]} has no counts of its own in this block` }
            const lead = `${i === 0 ? (byRole ? 'The' : 'the') : '; the'} ${reading.roleNounOf[role]}`
            parts.push(part(statusAt([`objectives[${objective.elementId}].team`], 'DERIVED'), team ? `${lead} (` : lead, [`objectives[${objective.elementId}].team`]))
            team?.segments.forEach((segment, j) => parts.push(part(segment.status, `${j === 0 ? '' : segment.joiner}${segment.text}`, segment.from, segment.bindings)))
            parts.push(part(statusAt(target.from, 'DERIVED'), `${team ? ')' : ''} attacks ${target.text}`, target.from, target.bindings))
            derivedTerms.push(...target.derivedTerms)
        }
        const last = parts[parts.length - 1]
        parts[parts.length - 1] = { ...last, text: `${last.text}.` }
        return { sentence: sentenceOf('game', parts, derivedTerms), gap: null }
    }

    // ── One game, no roles: the teams together, each attacking the target at the other team's end ──
    if (!counts.teamsCount) return { sentence: null, gap: 'the game holds no teams to count' }
    const directional = objectives.length > 1 && objectives[0]?.team !== 'EACH_TEAM' && new Set(objectives.map(objective => String(objective.team))).size === objectives.length
    if (!directional) return { sentence: null, gap: 'the game does not give each team a target of its own, and the game sentence has no wording for any other arrangement' }
    const targets = objectives.map(objective => ({ objective, region: regionOf(objective) }))
    const atOtherEnd = targets.every(({ region }) => {
        const along = region ? reading.geometryFor(region.elementId, 'along') : undefined
        const span = along?.geometry?.interval
        return typeof region?.noun === 'string' && along?.geometry?.term === ATTACKING_END && span && (span.from === 0 || span.to === areaLength)
    })
    const nouns = new Set(targets.map(({ region }) => region?.noun))
    if (!atOtherEnd || nouns.size !== 1) return { sentence: null, gap: "the teams' targets are not each at the other team's end, all of one noun, so the game sentence has no wording for them" }
    const noun = String(targets[0].region.noun)
    const parts: InstructionPart[] = []
    const { text, status, from, bindings } = counts.teamsCount
    parts.push(part(status, text, from, bindings))
    if (counts.neutrals) {
        const neutrals = counts.neutrals
        parts.push(part(neutrals.status, `, with ${neutrals.text}`, neutrals.from, neutrals.bindings))
        // Who they play with, where the Details allegiance sentence says it (a side the possession relation decides, a standing rule).
        const affiliation = game.performers?.neutrals?.affiliation
        const side = typeof affiliation?.joins === 'string' ? SIDE_BY_POSSESSION[affiliation.joins] : undefined
        if (side && game.possession?.team !== undefined && affiliation?.on === 'STANDING') {
            const joinsPath = 'performers.neutrals.affiliation.joins'
            parts.push(part(statusOf.get(joinsPath) ?? 'DERIVED', ` who support${neutrals.count === 1 ? 's' : ''} ${side}`, [joinsPath, 'performers.neutrals.affiliation.on']))
        }
    }
    const targetFrom = targets.flatMap(({ objective, region }) => [...objectivePaths(objective), `space.regions[${region.elementId}].noun`, `space.regions[${region.elementId}].position.along`])
    parts.push(part(statusAt(targetFrom, 'DERIVED'), `: each team attacks the ${noun} at the other team's end.`, targetFrom))
    return { sentence: sentenceOf('game', parts), gap: null }
}

/**
 * **The basic parameters** (his item 1): "{L} x {W} m, {N} players, {D} minutes", each part with the status and binding the Details
 * sentence saying it carries ("Mark out an area ...", "Divide {N} players ...", "Play for {D} minutes"). A value the game does not hold is
 * left out; with none, nothing is said.
 */
export function parametersOf(fixture: any): { sentence: OverviewSentence | null; gap: string | null } {
    const envelope = fixture?.game?.envelope ?? {}
    const statusOf = statusesOf(fixture)
    const recorded = (path: string): SourceStatus => statusOf.get(path) ?? 'SESSION'
    const parts: InstructionPart[] = []
    const lead = () => (parts.length ? ', ' : '')
    const length = envelope.area?.length_m
    const width = envelope.area?.width_m
    if (stated(length) && stated(width)) {
        parts.push(part(recorded('envelope.area.length_m'), `${length} x ${width} m`, ['envelope.area.length_m', 'envelope.area.width_m'], [
            { quantity: length, path: 'envelope.area.length_m' },
            { quantity: width, path: 'envelope.area.width_m' },
        ]))
    }
    if (stated(envelope.players)) parts.push(part(recorded('envelope.players'), `${lead()}${envelope.players} players`, ['envelope.players'], [{ quantity: envelope.players, path: 'envelope.players' }]))
    if (stated(envelope.duration_min)) parts.push(part(recorded('envelope.duration_min'), `${lead()}${envelope.duration_min} minutes`, ['envelope.duration_min'], [{ quantity: envelope.duration_min, path: 'envelope.duration_min' }]))
    return parts.length ? { sentence: sentenceOf('parameters', parts), gap: null } : { sentence: null, gap: 'the game holds no area, player count or duration' }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// Stage 3C, 21 October 2026: the essentials table and the scoring-group composer.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * **What the overview must say of how a team scores, by class** — his reply filed 22 October 2026, item 6: *"the overview should not
 * reproduce every qualification, exception, and restart condition. Those belong in Coach Details, with any essential qualification
 * included in the overview when omitting it would materially misrepresent the game."* Which kinds qualify is a learning-design judgement,
 * so it is DATA (`overview-essentials.json`), PROPOSED until he approves it:
 *
 *   - CONSTITUTIVE: a way to score; every group for a team that scores this way states it ("every way to score appears" is a rule of the
 *     table, `ways`, not a branch of code);
 *   - ESSENTIAL: stated by some sentence of the team's group (a pointer does not excuse it);
 *   - DETAIL: may be left to Coach Details, only with a "full rule" pointer to the Details sentence saying it.
 */
export const OVERVIEW_CLASSES = ['CONSTITUTIVE', 'ESSENTIAL', 'DETAIL'] as const
export type OverviewClass = (typeof OVERVIEW_CLASSES)[number]

/** Where the table is read from (`build.js` copies it beside the bundle), and how it is named to an administrator. */
export const ESSENTIALS_FILE = path.join(AUDITS_DIR, 'overview-essentials.json')
export const ESSENTIALS_SOURCE = 'docs/audits/overview-essentials.json' as const

/** A condition on the element a cited field belongs to: a field's value (a condition type, a credit bound), or a structural reading. */
export type RuleWhere = { field: string; equals: unknown } | { field: string; notEquals: unknown } | { beginsBoundedEpisode: true }

/** One rule of the table: a class for fields on register rows (`rows`, optionally `where`), or the way-level rule (`ways`). */
export interface EssentialsRule {
    id: string
    class: OverviewClass
    rows?: string[]
    ways?: string[]
    where?: RuleWhere
    /**
     * Stage 3F, on a DETAIL rule only: the rules whose condition the exception follows from. It may be left to Coach Details only where
     * the team's group has a field those rules class under the same way to score and states every such field; otherwise it is material.
     */
    followsFrom?: string[]
    why: string
}

/** The table as read: its status (PROPOSED until it carries his approval), the approval, and its rules. */
export interface EssentialsTable {
    status: 'PROPOSED' | 'APPROVED'
    approvedBy: { who: string; date: string; quote: string } | null
    rules: EssentialsRule[]
}

/** The table, or why it cannot be used (every group is then withheld, with that reason). */
export interface EssentialsLoad {
    table: EssentialsTable | null
    why: string | null
}

interface RegisterRow {
    id: string
    kind: string
    path: string
    ownerRow: string | null
}
let registerById: Map<string, RegisterRow> | null = null
/** The live register's rows by id, with their kind and owner (read once; the register is versioned data). */
function registerRowsById(): Map<string, RegisterRow> {
    if (!registerById) {
        registerById = new Map(
            ((loadRegister().rows ?? []) as any[]).map(row => [String(row?.id), { id: String(row?.id), kind: String(row?.kind), path: String(row?.path), ownerRow: row?.ownerRow ? String(row.ownerRow) : null }] as const),
        )
    }
    return registerById
}

/**
 * **The names a rule may never be keyed by** (BUILD PLAN stage 3C: "the loader refuses ... activity-keyed rows"): every Learning Goal of
 * the planning model, every mechanism demonstration and every approved entry. An element handle of a game (`c:...`) is refused too.
 */
export function activityNames(): Set<string> {
    return new Set([
        ...sessionPlanningModel
            .learningGoals()
            .map(row => String(row['ID'] ?? ''))
            .filter(Boolean),
        ...MECHANISM_DEMONSTRATIONS.map(demonstration => demonstration.id),
        ...approvedWording().map(entry => entry.id),
    ])
}

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const TABLE_KEYS = new Set(['about', 'status', 'approvedBy', 'proposal', 'classes', 'ruleShape', 'rules'])
const RULE_KEYS = new Set(['id', 'class', 'rows', 'ways', 'where', 'followsFrom', 'why'])
const isClass = (value: unknown): value is OverviewClass => (OVERVIEW_CLASSES as readonly unknown[]).includes(value)

/** Every string a value holds, at any depth. */
const stringsIn = (value: unknown): string[] =>
    typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(stringsIn) : value && typeof value === 'object' ? Object.values(value).flatMap(stringsIn) : []

function whereUnusableBecause(where: any): string | null {
    if (!where || typeof where !== 'object' || Array.isArray(where)) return 'its element condition is not an object'
    const keys = Object.keys(where).sort().join(',')
    if (keys === 'beginsBoundedEpisode') return where.beginsBoundedEpisode === true ? null : 'beginsBoundedEpisode is only ever true'
    if (keys === 'equals,field' || keys === 'field,notEquals') return nonEmpty(where.field) ? null : 'its element condition names no field'
    return `its element condition holds "${keys}": it is { field, equals }, { field, notEquals } or { beginsBoundedEpisode: true }`
}

let vocabularyValues: Set<string> | null = null
/**
 * **Every value of a closed vocabulary the register records** (its `vocabularies`: each list, and each list inside an object of lists) —
 * stage 3D, 21 October 2026, the 3C review's should-fix: a rule's element condition compares a field with such a value (a condition type, a
 * credit bound), never with authored text, a contract, a context or an element of one game, which a list of refused names cannot exhaust.
 */
export function registerVocabularyValues(): Set<string> {
    if (!vocabularyValues) {
        const values = new Set<string>()
        const add = (list: unknown) => {
            if (Array.isArray(list)) for (const value of list) if (typeof value === 'string') values.add(value)
        }
        for (const entry of Object.values((loadRegister()?.vocabularies ?? {}) as Record<string, unknown>)) {
            if (Array.isArray(entry)) add(entry)
            else if (entry && typeof entry === 'object') for (const inner of Object.values(entry as Record<string, unknown>)) add(inner)
        }
        vocabularyValues = values
    }
    return vocabularyValues
}

/** A name's words, lower case, split wherever a character is neither a letter nor a digit ("X9_ORIGIN" is "x9", "origin"). */
const tokensOf = (name: string): string[] => name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
/** Whether one name's words run, in order and together, inside another's ("X9-W3_RULE" holds "X9-W3"). */
const holdsName = (container: string, name: string): boolean => {
    const outer = tokensOf(container)
    const inner = tokensOf(name)
    return inner.length > 0 && outer.some((_, at) => inner.every((token, k) => outer[at + k] === token))
}

function ruleUnusableBecause(rule: any, register: Map<string, RegisterRow>, activities: Set<string>, vocabulary: Set<string> = registerVocabularyValues()): string | null {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return 'not an object'
    for (const key of Object.keys(rule)) if (!RULE_KEYS.has(key)) return `it is keyed by "${key}": a rule is keyed by register row and condition type, never by activity`
    if (!nonEmpty(rule.id)) return 'it has no id'
    if (!isClass(rule.class)) return `its class "${rule.class}" is not one the overview knows (${OVERVIEW_CLASSES.join(', ')})`
    if (!nonEmpty(rule.why)) return 'it gives no reason'
    if ((rule.rows === undefined) === (rule.ways === undefined)) return 'it names rows or ways: exactly one of them'
    const listed: unknown = rule.rows ?? rule.ways
    if (!Array.isArray(listed) || !listed.length || !listed.every(nonEmpty)) return 'its rows or ways are not register row ids'
    for (const id of listed as string[]) {
        const row = register.get(id)
        if (!row) return `it names "${id}", which is no register row`
        if (rule.ways !== undefined && row.kind !== 'COLLECTION') return `its way ${id} is not a collection, whose elements are ways to score`
    }
    if (rule.ways !== undefined && rule.where !== undefined) return 'the way-level rule takes no element condition'
    if (rule.where !== undefined) {
        const why = whereUnusableBecause(rule.where)
        if (why) return why
    }
    // Stage 3F: an exception left to Coach Details where the condition it follows from is stated; checked against the other rules below.
    if (rule.followsFrom !== undefined) {
        if (rule.class !== 'DETAIL') return 'only a DETAIL rule follows from another: an exception left to Coach Details where the overview states the condition it follows from'
        if (!Array.isArray(rule.followsFrom) || !rule.followsFrom.length || !rule.followsFrom.every(nonEmpty)) return 'its followsFrom names no rule'
    }
    const named = [rule.id, ...(listed as string[]), ...stringsIn(rule.where), ...stringsIn(rule.followsFrom)].find(value => activities.has(value) || value.startsWith('c:'))
    if (named !== undefined) return `it names "${named}", an activity, an approved entry or an element of a game: a rule is keyed by register row and condition type, never by activity`
    // Stage 3D (the 3C review's should-fix, a TIGHTENING): an id holding an activity's name among its words, and an element condition
    // comparing with anything but a value of a closed vocabulary the register records, are keyed by activity too.
    const inId = [...activities].find(name => holdsName(rule.id, name))
    if (inId !== undefined) return `its id "${rule.id}" holds "${inId}", an activity or an approved entry: a rule is keyed by register row and condition type, never by activity`
    if (rule.where && 'field' in rule.where) {
        const value = 'equals' in rule.where ? rule.where.equals : rule.where.notEquals
        if (typeof value !== 'string' || !vocabulary.has(value)) return `its element condition compares ${rule.where.field} with ${JSON.stringify(value)}, which is no value of a closed vocabulary the register records: a rule is keyed by condition type, never by authored text, a contract, a context or an element of a game`
    }
    return null
}

/**
 * **Why the table cannot be used, or null** — its keys, its status and approval (APPROVED only with approvedBy carrying who, a date and
 * his words; a PROPOSED table carries none), exactly the three classes, and every rule: a known class, register rows (or, for the
 * way-level rule, collection rows), an element condition of a known form, a reason, nothing keyed by an activity, and no row classed twice
 * on the same element condition. Since stage 3D an element condition compares only with a value of a closed register vocabulary, and no
 * rule id holds an activity's name among its words.
 */
export function essentialsUnusableBecause(file: any, register: Map<string, RegisterRow> = registerRowsById(), activities: Set<string> = activityNames()): string | null {
    if (!file || typeof file !== 'object' || Array.isArray(file)) return 'the table is not an object'
    for (const key of Object.keys(file)) if (!TABLE_KEYS.has(key)) return `the table carries "${key}", which no table holds`
    if (file.status !== 'PROPOSED' && file.status !== 'APPROVED') return `its status "${file.status}" is neither PROPOSED nor APPROVED`
    const approval = file.approvedBy
    if (approval !== undefined) {
        if (file.status !== 'APPROVED') return 'it carries approvedBy and says it is PROPOSED'
        if (!approval || !nonEmpty(approval.who) || !nonEmpty(approval.date) || !nonEmpty(approval.quote)) return 'its approval does not say who approved it, when, and in his words'
    } else if (file.status === 'APPROVED') {
        return 'it says APPROVED and carries no approvedBy: the table stays PROPOSED until he approves it'
    }
    if (file.classes !== undefined) {
        const names = Object.keys(file.classes ?? {})
        if (names.length !== OVERVIEW_CLASSES.length || !names.every(isClass)) return `its classes are ${JSON.stringify(names)}, and the overview knows exactly ${OVERVIEW_CLASSES.join(', ')}`
    }
    if (!Array.isArray(file.rules) || !file.rules.length) return 'it has no rules'
    const ids = new Set<string>()
    const classed = new Set<string>()
    for (const rule of file.rules) {
        const why = ruleUnusableBecause(rule, register, activities)
        if (why) return `rule ${JSON.stringify(rule?.id ?? null)}: ${why}`
        if (ids.has(rule.id)) return `rule "${rule.id}" is listed twice`
        ids.add(rule.id)
        for (const row of rule.rows ?? []) {
            const key = canonicalJson([row, rule.where ?? null])
            if (classed.has(key)) return `row ${row} is classed twice on the same element condition (rule "${rule.id}")`
            classed.add(key)
        }
    }
    // Stage 3F: each rule an exception follows from is another rule of the table, one the overview must state (CONSTITUTIVE or ESSENTIAL).
    for (const rule of file.rules) {
        for (const id of rule.followsFrom ?? []) {
            const governing = file.rules.find((other: any) => other.id === id)
            if (!governing || id === rule.id) return `rule "${rule.id}" follows from "${id}", which is no other rule of the table`
            if (governing.class === 'DETAIL') return `rule "${rule.id}" follows from "${id}", a DETAIL: an exception is left to Coach Details only where the overview states a condition it must state`
        }
    }
    return null
}

/** The table from its parsed file: copied, or null with why. */
export function essentialsLoadOf(file: any): EssentialsLoad {
    const why = essentialsUnusableBecause(file)
    if (why) return { table: null, why }
    return {
        table: {
            status: file.status,
            approvedBy: file.approvedBy ? { who: String(file.approvedBy.who), date: String(file.approvedBy.date), quote: String(file.approvedBy.quote) } : null,
            rules: JSON.parse(JSON.stringify(file.rules)),
        },
        why: null,
    }
}

function readEssentials(): EssentialsLoad {
    try {
        const text = fs.readFileSync(ESSENTIALS_FILE, 'utf8')
        return essentialsLoadOf(JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text))
    } catch (error) {
        return { table: null, why: `${ESSENTIALS_SOURCE} could not be read: ${error instanceof Error ? error.message : String(error)}` }
    }
}
const ESSENTIALS = readEssentials()
/** The essentials table as loaded at module load, as a copy. */
export const essentialsTable = (): EssentialsLoad => JSON.parse(JSON.stringify(ESSENTIALS))

/** The coach-facing words of a pointer to the Details sentence saying a rule in full (DRAFT). */
export const FULL_RULE_LABEL = 'full rule'
/** What an administrator is told where an overview is built on a table he has not approved (DRAFT words). */
export const PROPOSED_TABLE_LABEL = 'Built on a PROPOSED table of which scoring conditions the overview must state; he has not approved it'
/** The one group of a game played without roles: what every team does. */
export const EVERY_TEAM = 'EVERY_TEAM'
/** The heading of the one group of a game played without roles (DRAFT words, polish pass P1). */
export const EVERY_TEAM_HEADING = 'Each team'
/**
 * **The heading a team's scoring group is shown under** — polish pass P1, 22 October 2026 (the 3F and Stage 4 reviews: a qualification must
 * be read as the team's it qualifies). DRAFT words: the role's noun as the game reads it, with a capital ("Building team"), or
 * `EVERY_TEAM_HEADING` for the one group of a game played without roles. Never composed from anything else, so a heading names only a
 * team the game names.
 */
export const teamHeadingOf = (noun: string | null): string => (noun ? `${noun.charAt(0).toUpperCase()}${noun.slice(1)}` : EVERY_TEAM_HEADING)

/** A Details sentence, by its place in its own block's render, its section and its words (the served Details hold it by the last two). */
export interface DetailsRef {
    blockIndex: number
    section: string
    text: string
}

/** A pointer from the overview to the Details sentence saying a rule in full, and why it is there. */
export interface DetailsPointer extends DetailsRef {
    label: typeof FULL_RULE_LABEL
    labelStatus: 'DRAFT'
    /** `DETAIL_LEFT_OUT`: a DETAIL field the group does not state; `SHORTENED_WAY_TO_SCORE`: a way to score the group says shortened. */
    because: ('DETAIL_LEFT_OUT' | 'SHORTENED_WAY_TO_SCORE')[]
    paths: string[]
}

/** One sentence of a team's scoring group, with its status, where its words come from and what it states. */
export interface ScoringSentence {
    text: string
    /** The three statuses (his item 4): his wording said whole, a verbatim extract of it, or newly proposed language. */
    wording: WordingStatus
    source: WordingSource | null
    /** Which of the composer's choices gave it: his approved wording said whole, the shortest extract, or the Details sentence. */
    chosenBy: 'APPROVED_ENTRY' | 'SHORTEST_EXTRACT' | 'DETAILS_SENTENCE'
    form: 'WHOLE' | 'EXTRACT' | 'SHORTENING'
    extractId: string | null
    /** The Details sentence it says or shortens, and the words of it that it does not say. */
    details: DetailsRef
    drops: string[]
    /**
     * Stage 3D: what its words cite and bind in this block's game — the Details sentence's own (said whole), the extract's (its kept covers
     * and the slots inside its words), or the parts a shortening keeps whole. The agreement check (Q7) holds every one to Details.
     */
    from: string[]
    bindings: Binding[]
    /** The group's required fields it states, each with its class and the rule classing it. */
    states: { path: string; class: OverviewClass; rule: string }[]
    fullRule: DetailsPointer | null
    /**
     * Stage 3E: for an extract kept by a recorded reading, where that reading is recorded and its standing (the PROPOSED record:
     * "reading PROPOSED, awaiting confirmation", for an administrator only); null for every other sentence. Since stage 3F also for his
     * approved wording said whole, which states only what its recorded reading gives it.
     */
    reading: ReadingRecord | null
    /**
     * Stage 3F (his reply filed 23 October 2026, item 6: *"a concise explanation that communicates the opposing objectives immediately,
     * without requiring the coach to read several procedural statements first"*): `LEAD`, the one line stating how the team scores (the
     * sentence stating most of the fields of its first way to score, one sentence where one does), presented first in its team's group
     * (polish pass P1; was: with every other team's lead before any qualification); `QUALIFICATION`, everything after it.
     */
    place: 'LEAD' | 'QUALIFICATION'
}

/** How one team scores, as the overview says it (or withheld, with why). */
export interface ScoringGroup {
    /** The role whose holder this is, in the block's role order, or EVERY_TEAM in a game played without roles. */
    group: string
    noun: string | null
    withheld: boolean
    why: string[]
    sentences: ScoringSentence[]
    /** Pointers no sentence of the group carries (a DETAIL whose Details sentence the group does not shorten). */
    fullRules: DetailsPointer[]
    /** Every field the group's Details sentences cite that the table classes, and the sentences stating it. */
    requirements: { path: string; row: string; class: OverviewClass; rule: string; statedBy: number[]; pointedTo: boolean }[]
    /** Each way to score the group speaks of, and the sentences showing it (by a stated CONSTITUTIVE field under it). */
    ways: { way: string; shownBy: number[] }[]
    /** Extracts of the group's approved sources that keep nothing, because no reading of what a part of his wording states is recorded. */
    extractsKeepingNothing: string[]
    notes: string[]
}

/** The overview's scoring, per block, with the table it was built on. */
export interface OverviewScoring {
    table: { source: typeof ESSENTIALS_SOURCE; status: 'PROPOSED' | 'APPROVED' | 'UNUSABLE'; label: string | null; labelStatus: 'DRAFT'; why: string | null }
    /** Stage 3E: the PROPOSED record of what parts of his wording state, which the extracts keep by (`approved-wording-readings.ts`). */
    readings: ReadingsAccount
    blocks: { blockId: string; groups: ScoringGroup[] }[]
    /** Whether every block's groups say the same words. */
    sameTextInEveryBlock: boolean
}

/** A path's steps: a name and, where it names a member of a collection, the member's id (an id may hold dots: brackets are read whole). */
function stepsOf(path: string): { name: string; id: string | null; end: number }[] {
    const steps: { name: string; id: string | null; end: number }[] = []
    let name = ''
    let id: string | null = null
    let inside = ''
    let depth = 0
    for (let at = 0; at < path.length; at++) {
        const char = path[at]
        if (depth > 0) {
            if (char === '[') depth++
            if (char === ']' && --depth === 0) {
                id = inside
                inside = ''
                continue
            }
            inside += char
            continue
        }
        if (char === '[') {
            depth = 1
            continue
        }
        if (char === '.') {
            steps.push({ name, id, end: at })
            name = ''
            id = null
            continue
        }
        name += char
    }
    steps.push({ name, id, end: path.length })
    return steps
}

/** The value a path names in the game (a member of a collection found by its element id), or undefined. */
function valueAt(game: any, steps: { name: string; id: string | null }[]): any {
    let node = game
    for (const step of steps) {
        node = node == null ? undefined : node[step.name]
        if (step.id !== null) node = Array.isArray(node) && step.id ? node.find(member => String(member?.elementId) === step.id) : undefined
    }
    return node
}

/** The prefix of a path whose generic form is `generic`, as its steps, or null. */
function prefixAt(path: string, generic: string): { name: string; id: string | null; end: number }[] | null {
    const steps = stepsOf(path)
    for (let n = 0; n < steps.length; n++) if (genericPath(path.slice(0, steps[n].end)) === generic) return steps.slice(0, n + 1)
    return null
}

/**
 * **The element a cited field belongs to**: the member of its row's own collection (the row itself where it is a collection, else the
 * row it is owned by) that the path names. Null where the row belongs to no collection or the game holds no such member.
 */
function elementOf(game: any, path: string, rowId: string | null, register: Map<string, RegisterRow>): any {
    const row = rowId ? register.get(rowId) : undefined
    const collection = row ? (row.kind === 'COLLECTION' ? row : row.ownerRow ? register.get(row.ownerRow) : undefined) : undefined
    if (!collection || !collection.path.endsWith('[]')) return null
    const steps = prefixAt(path, collection.path)
    const element = steps ? valueAt(game, steps) : undefined
    return element && typeof element === 'object' ? element : null
}

/** Whether a rule's element condition holds on an element. */
function whereHolds(where: RuleWhere | undefined, element: any, starters: Map<string, string[]>): boolean {
    if (!where) return true
    if (!element) return false
    if ('beginsBoundedEpisode' in where) return starters.has(String(element.elementId))
    if (!(where.field in element)) return false
    const same = canonicalJson(element[where.field]) === canonicalJson('equals' in where ? where.equals : where.notEquals)
    return 'equals' in where ? same : !same
}

/** Which roles a game is played in, and how a field or a sentence is read as one role's. */
function rolesOf(fixture: any) {
    const game = fixture?.game ?? {}
    const reading = gameReadingOf(fixture)
    const list = Object.keys(reading.holdersInBlock).filter(role => reading.roleNounOf[role])
    const elements: any[] = Array.isArray(game.activityRoles) ? game.activityRoles : []
    const roleOfElement = new Map<string, string>(elements.filter(element => list.includes(element?.activityRole)).map(element => [String(element.elementId), String(element.activityRole)] as const))
    const bounded = elements.filter(element => list.includes(element?.activityRole) && element?.creditedWithin != null && canonicalJson(element.creditedWithin) !== canonicalJson(UNBOUNDED_CREDIT))
    const starters = boundedEpisodeStartersOf(game)
    const designated = (value: unknown): string | null => (typeof value === 'string' ? reading.roleOfDesignation(value) : null)
    /**
     * A classed field's own roles: the role element it is on; the roles whose bounded episode a transition begins; the roles whose bounded
     * credit a condition is scoped to; the role whose holder an element's team is. None: it is said for whichever roles its sentence names.
     */
    const ofField = (element: any): string[] => {
        if (!element) return []
        if (list.includes(element.activityRole)) return [String(element.activityRole)]
        const starting = (starters.get(String(element.elementId)) ?? []).filter(id => roleOfElement.has(id)).map(id => roleOfElement.get(id)!)
        if (starting.length) return [...new Set(starting)]
        const scoped = element.scope != null ? bounded.filter(role => canonicalJson(role.creditedWithin) === canonicalJson(element.scope)).map(role => String(role.activityRole)) : []
        if (scoped.length) return [...new Set(scoped)]
        const team = designated(element.team)
        return team ? [team] : []
    }
    return { game, list, nounOf: reading.roleNounOf, starters, designated, ofField }
}

export const wordsIn = (text: string): number => text.split(' ').filter(Boolean).length
export const withFullStop = (text: string): string => ('.!?'.includes(text[text.length - 1] ?? '') ? text : `${text}.`)

/**
 * A shortening of a DRAFT Details sentence: its first words up to a cut (`end`, the cut's place in the sentence), what it drops, what it
 * still cites and binds (the parts it keeps whole), and the kind of cut.
 */
export interface DraftShortening {
    text: string
    drops: string
    from: string[]
    bindings: Binding[]
    end: number
    cut: 'ASIDE' | 'ELABORATION' | 'CLAUSE' | 'SENTENCE'
}

/**
 * **The DRAFT shortenings of a DRAFT Details sentence** — each a proper prefix of its words, never a word added or changed (his item 4:
 * a shortened form of proposed language stays proposed, so each is DRAFT). Cut before the bracketed aside that closes the sentence
 * (ASIDE), before its last ": " (ELABORATION), before a "; " (CLAUSE), or after a sentence's end (SENTENCE). What it still cites and binds
 * is read from the renderer's parts: ONLY the parts it keeps whole. A part any cut splits keeps none of its citations, whatever the kind of
 * cut. None where the parts do not make up the sentence.
 *
 * **Stage 3D, 21 October 2026: the ASIDE and ELABORATION leniency is gone (a TIGHTENING).** Until 3D a part an ASIDE or ELABORATION cut
 * kept its citations ("the words before an elaboration still say what it elaborates" — our claim, never checked). The 3C review showed
 * the hole: with the restart moments' sentence rendered as ONE part (TEST-ONLY), the elaboration cut keeping only the words before its
 * colon (who restarts play) claimed to state every restart moment, the group was served, and nothing pointed to them. Citations alone cannot tell
 * that case from one where the kept words do state the field, so the overview's agreement check (`overview-fidelity.ts`, Q7) counts only
 * words kept whole, and so does this composer. Where the renderer attributes a citation to the words that state it, as its own part, a
 * cut keeping that part keeps it.
 */
export function draftShorteningsOf(instruction: { text: string; parts?: InstructionPart[] }): DraftShortening[] {
    const text = instruction.text
    const parts = instruction.parts ?? []
    if (!parts.length || parts.map(p => p.text).join('') !== text) return []
    const spans: { start: number; end: number; from: string[]; bindings: Binding[] }[] = []
    let at = 0
    for (const p of parts) {
        spans.push({ start: at, end: at + p.text.length, from: p.from, bindings: p.bindings ?? [] })
        at += p.text.length
    }
    const cuts = new Map<number, DraftShortening['cut']>()
    const open = text.lastIndexOf(' (')
    if (open > 0 && text.endsWith(')') && text.indexOf(')', open) === text.length - 1) cuts.set(open, 'ASIDE')
    const colon = text.lastIndexOf(': ')
    if (colon > 0 && !cuts.has(colon)) cuts.set(colon, 'ELABORATION')
    for (let k = text.indexOf('; '); k > 0; k = text.indexOf('; ', k + 1)) if (!cuts.has(k)) cuts.set(k, 'CLAUSE')
    let start = 0
    for (const sentence of sentencesOf(text).slice(0, -1)) {
        const end = start + sentence.text.length
        if (!cuts.has(end)) cuts.set(end, 'SENTENCE')
        start = end + 1
    }
    return [...cuts.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([end, cut]) => {
            const kept = text.slice(0, end).trimEnd()
            const whole = spans.filter(span => span.end <= end)
            return { text: withFullStop(kept), drops: text.slice(end).trim(), from: [...new Set(whole.flatMap(span => span.from))], bindings: whole.flatMap(span => span.bindings.map(b => ({ ...b }))), end, cut }
        })
        .filter(shortening => wordsIn(shortening.text) > 0 && shortening.drops.length > 0)
}

/** A Details sentence as the composer reads it: its place in its block's render, and its wording status and source. */
export interface DetailsSentence {
    instruction: Instruction
    at: number
    wording: 'APPROVED' | 'DRAFT'
    source: WordingSource | null
}

/** A field a team's group must account for: its row, its class and the rule classing it, and the way to score it lies under. */
export interface ScoringRequirement {
    path: string
    row: string
    class: OverviewClass
    rule: string
    /** The first Details sentence citing it (its canonical statement), and the order it was first cited in. */
    at: number
    order: number
    /** The way to score it lies under (the concrete prefix naming that way, by the table's way-level rule), or null. */
    way: string | null
}

/**
 * **What each team's overview group must account for, read from one block's own Details through the essentials table** — the reading
 * the composer chooses sentences for and the overview's agreement check (Q7, `overview-fidelity.ts`) holds a group to. It is the
 * specification both sides read; neither the composer's choice nor what it says a sentence states is in it.
 */
export interface ScoringRequirements {
    /** The block's roles in role order, or EVERY_TEAM for a game played without roles. */
    groups: string[]
    nouns: Record<string, string | null>
    /** Per group, its requirements in the order the Details first cite them. */
    requirements: Record<string, ScoringRequirement[]>
    /** Per group, why it cannot be composed at all (a How to score sentence citing a scoring row the table does not class, a field two rules class). */
    problems: Record<string, string[]>
    details: DetailsSentence[]
    /**
     * Stage 3F (the 3E review's should-fix 2): every classed field's own roles (the role element it is on, the roles whose bounded episode
     * it begins, whose bounded credit it is scoped to, or whose holder its element's team is); empty where it is said for whichever roles
     * its sentence names. A group's sentence never states a field another role owns.
     */
    owners: Record<string, string[]>
}

/** The element a field belongs to: its path up to the first member of a collection it names, else up to its last step (stage 3F evidence). */
export function elementPathOf(path: string): string {
    const steps = stepsOf(path)
    const member = steps.find(step => step.id !== null)
    if (member) return path.slice(0, member.end)
    return steps.length > 1 ? path.slice(0, steps[steps.length - 2].end) : path
}

/**
 * **The conditions an exception follows from, in its group** — stage 3F, 22 October 2026 (his reply filed 23 October 2026, item 4: the
 * overview preserves "exceptions" where they are material). For a requirement whose rule names `followsFrom`, each of those rules with the
 * group's fields it classes under the same way to score; null where the rule names none. The exception may be left to Coach Details only
 * where every listed rule has such a field and the group states each one (`coach-overview` composer, Q7.4).
 */
export function followsFromOf(requirement: ScoringRequirement, requirements: ScoringRequirement[], table: EssentialsTable): { rule: string; fields: ScoringRequirement[] }[] | null {
    const rule = table.rules.find(entry => entry.id === requirement.rule)
    if (!rule?.followsFrom?.length) return null
    return rule.followsFrom.map(id => ({ rule: id, fields: requirements.filter(other => other.rule === id && other.way === requirement.way) }))
}

/**
 * **The requirements of every team's group, for one block** (stage 3C's reading, shared since stage 3D): every field a Details sentence
 * cites that a rule classes is a requirement of the team it is said for — a classed field's own role (the role element it is on, a
 * transition beginning that role's bounded episode, a condition scoped to its bounded credit, an element whose team is its holder), else
 * the roles its sentence names (a role element it cites, or a field whose value is a role's holder), else every team. A How to score
 * sentence citing a scoring row the table does not class is a problem for the groups it speaks for: nothing is left out by default.
 */
export function scoringRequirementsOf(fixture: any, rendered: Instruction[], table: EssentialsTable, wording: ApprovedWording[] = approvedWording()): ScoringRequirements {
    const roles = rolesOf(fixture)
    const game = roles.game
    const groupIds = roles.list.length ? roles.list : [EVERY_TEAM]
    const register = registerRowsById()
    const rowIndex = registerRowIndex()
    const said = approvedEntriesSaid(game, wording)
    const details: DetailsSentence[] = rendered.map((instruction, at) => ({ instruction, at, ...detailsWordingOf(instruction.text, said) }))
    const classRules = table.rules.filter(rule => rule.rows)
    const wayRows = table.rules.flatMap(rule => rule.ways ?? []).map(id => register.get(id)!.path)

    /** The rule classing a cited field, none, or the rules that disagree about it. */
    const classify = (path: string, row: string | null): { rule: EssentialsRule | null; ambiguous: string[] } => {
        if (!row) return { rule: null, ambiguous: [] }
        const element = elementOf(game, path, row, register)
        const hits = classRules.filter(rule => rule.rows!.includes(row) && whereHolds(rule.where, element, roles.starters))
        return hits.length > 1 ? { rule: null, ambiguous: hits.map(rule => rule.id) } : { rule: hits[0] ?? null, ambiguous: [] }
    }
    /** The way to score a field is under: the longest way row its path lies under, as the concrete prefix naming that way. */
    const wayOf = (path: string): string | null => {
        const generic = genericPath(path)
        const under = wayRows.filter(way => generic === way || generic.startsWith(`${way}.`) || generic.startsWith(`${way}[`)).sort((a, b) => b.length - a.length)[0]
        if (!under) return null
        const steps = prefixAt(path, under)
        return steps ? path.slice(0, steps[steps.length - 1].end) : null
    }

    const requirements = new Map<string, Map<string, ScoringRequirement>>(groupIds.map(group => [group, new Map()]))
    const problems = new Map<string, string[]>(groupIds.map(group => [group, []]))
    const owners: Record<string, string[]> = {}
    let order = 0
    for (const sentence of details) {
        const { instruction } = sentence
        const named = [
            ...new Set(
                instruction.from.flatMap(path => {
                    const steps = stepsOf(path)
                    const element = elementOf(game, path, rowOfPath(path, rowIndex), register)
                    return [element && roles.list.includes(element.activityRole) ? String(element.activityRole) : null, roles.designated(valueAt(game, steps))].filter((role): role is string => !!role)
                }),
            ),
        ].filter(role => requirements.has(role))
        const speaksFor = new Set<string>()
        const unclassed: string[] = []
        for (const path of instruction.from) {
            const row = rowOfPath(path, rowIndex)
            const { rule, ambiguous } = classify(path, row)
            if (ambiguous.length) {
                unclassed.push(`${path} is classed by more than one rule (${ambiguous.join(', ')})`)
                continue
            }
            if (!rule) {
                if (instruction.section === 'How to score' && row && KIND_OF_ROW[row] === 'SCORING') unclassed.push(`${path} is on row ${row}, which the essentials table does not class`)
                continue
            }
            const own = roles.ofField(elementOf(game, path, row, register))
            owners[path] = [...own]
            const targets = own.length ? own : named.length ? named : groupIds
            for (const group of targets.filter(target => requirements.has(target))) {
                const held = requirements.get(group)!
                if (!held.has(path)) held.set(path, { path, row: row!, class: rule.class, rule: rule.id, at: sentence.at, order: order++, way: wayOf(path) })
                speaksFor.add(group)
            }
        }
        if (unclassed.length) {
            const groups = speaksFor.size ? [...speaksFor] : named.length ? named : groupIds
            for (const group of groups) problems.get(group)!.push(`"${instruction.text}": ${unclassed.join('; ')}; nothing is left out of the overview by default`)
        }
    }
    return {
        groups: groupIds,
        nouns: Object.fromEntries(groupIds.map(group => [group, group === EVERY_TEAM ? null : (roles.nounOf[group] ?? null)])),
        requirements: Object.fromEntries(groupIds.map(group => [group, [...requirements.get(group)!.values()].sort((a, b) => a.order - b.order)])),
        problems: Object.fromEntries(groupIds.map(group => [group, [...problems.get(group)!]])),
        details,
        owners,
    }
}

type Requirement = ScoringRequirement

interface Candidate {
    chosenBy: ScoringSentence['chosenBy']
    form: ScoringSentence['form']
    at: number
    text: string
    wording: WordingStatus
    source: WordingSource | null
    extract: DerivedExtract | null
    drops: string[]
    states: string[]
    from: string[]
    bindings: Binding[]
    /** Stage 3F: the record of the reading its words state by (an extract's, or his wording said whole), or null. */
    reading: ReadingRecord | null
}

/** The numbers an instruction binds, in the order it says them (its parts'), each copied. Exported for the agreement check (Q7.2). */
export const bindingsOfInstruction = (instruction: Instruction): Binding[] => (instruction.parts ?? []).flatMap(p => (p.bindings ?? []).map(b => ({ ...b })))

const refOf = (sentence: DetailsSentence): DetailsRef => ({ blockIndex: sentence.at, section: sentence.instruction.section, text: sentence.instruction.text })

/** Parts in reading order: by sentence, a whole sentence before its leading clause. */
const byPlace = (a: ExtractUnit, b: ExtractUnit): number => a.sentence - b.sentence || (a.part === b.part ? 0 : a.part === 'WHOLE_SENTENCE' ? -1 : 1)

/** The words of an approved sentence an extract of it does not say: each sentence it skips, and the rest of one it cuts to its clause. */
function droppedBy(sourceText: string, units: ExtractUnit[]): string[] {
    return sentencesOf(sourceText).flatMap((sentence, n) => {
        const unit = units.find(u => u.sentence === n)
        if (!unit) return [sentence.text]
        if (unit.part !== 'LEADING_CLAUSE' || sentence.clause === null) return []
        const rest = sentence.text.slice(sentence.clause.length)
        return [rest.startsWith(';') ? rest.slice(1).trimStart() : rest]
    })
}

/**
 * **How each team scores, for one block** — stage 3C, 21 October 2026. His reply filed 22 October 2026, item 6: *"Yes. The overview should
 * briefly communicate the scoring objectives. Understanding how each team scores is fundamental to understanding the game."* And item 4:
 * *"Shortening must not introduce new meanings, omit a condition that changes the essential understanding, or silently turn a qualified
 * rule into an unrestricted one."*
 *
 * **What a group must say** is read from the block's own Details, through the PROPOSED essentials table (`scoringRequirementsOf`, which the
 * agreement check Q7 reads too; since stage 3D): every field a Details sentence
 * cites that a rule classes is a requirement of the team it is said for — a classed field's own role (the role element it is on, a
 * transition beginning that role's bounded episode, a condition scoped to its bounded credit, an element whose team is its holder), else
 * the roles its sentence names (a role element it cites, or a field whose value is a role's holder), else every team. A How to score
 * sentence citing a scoring row the table does not class withholds the groups it speaks for: nothing is left out by default.
 *
 * **What it says**, chosen in this order (BUILD PLAN stage 3C), field by field in the order the Details cite them:
 *
 *   1. APPROVED_ENTRY: his approved wording said whole (as Details say it), where it states a field not yet stated and holds no DETAIL;
 *   2. SHORTEST_EXTRACT: the shortest verbatim extract of it (`derived-wording.ts`) whose recorded reading keeps the field — never one
 *      that omits words between its parts (`omitsBetween`, the 3B review: a candidate dropping a sentence between two it keeps is not
 *      chosen on length). An extract keeps only what a recorded reading of its parts gives it (since stage 3E the PROPOSED record,
 *      `approved-wording-readings.ts`), so one with no reading keeps nothing and is never chosen;
 *   3. DETAILS_SENTENCE: the first Details sentence citing the field — his approved wording whole, or, for a DRAFT sentence, its shortest
 *      DRAFT shortening that still cites every required field it cites other than a DETAIL (`draftShorteningsOf`), else the sentence whole.
 *
 * Then: an extract of a sentence also said whole is dropped (it is inside it); extracts of one sentence become the one extract of all
 * their parts, where it is listed and keeps what they keep. The group is withheld, with why, where a CONSTITUTIVE or ESSENTIAL field is
 * stated by none of its sentences, or a way to score it speaks of is shown by no stated CONSTITUTIVE field under it (the table's `ways`).
 * A "full rule" pointer goes to the Details sentence saying each DETAIL the group leaves out, and to each Details sentence stating a way to
 * score that the group says shortened; it is carried by the sentence shortening that Details sentence, else by the group. Sentences read
 * How to score sentences first, then the rest, each in Details order.
 *
 * **Stage 3F, 22 October 2026: meaning, not citations, and the opposing objectives first.** His reply filed 23 October 2026, item 4:
 * *"The system should evaluate the meaning of the complete overview rather than simply confirm that related words or conditions appear
 * somewhere."* Item 6: *"a concise explanation that communicates the opposing objectives immediately, without requiring the coach to read
 * several procedural statements first."* So:
 *
 *   - his approved wording said whole states only what its recorded reading of every sentence of it gives it (`wholes`, from
 *     `derived-wording.ts` `wholeReadingsFor`), none without one, never every field it cites; a DRAFT sentence states what the parts it
 *     keeps whole cite (unchanged); step 3 takes the first Details sentence whose words STATE the field;
 *   - a DETAIL whose rule follows from conditions (`followsFrom`) is material where the group has no field those rules class under the same
 *     way to score: it is then chosen for like an ESSENTIAL field, and is pointed to only where it is not material;
 *   - the most concise set: once chosen, any sentence whose material fields the others state is dropped, the longest first (so his
 *     eligibility sentence stays only where nothing else states what it states);
 *   - one LEAD per group: the chosen sentence stating most of the fields of its first way to score (the way of the first CONSTITUTIVE field
 *     the Details cite), one sentence where one does; it comes first and is never joined with other extracts; everything else is a
 *     QUALIFICATION, in the order above. Since polish pass P1 the served overview presents each team's group under its heading, its lead
 *     first and then its own qualifications (`overview-fidelity.ts`); was (3F-5B): every team's lead before any qualification.
 */
export function scoringGroupsOf(
    fixture: any,
    rendered: Instruction[],
    extracts: DerivedExtract[],
    load: EssentialsLoad = ESSENTIALS,
    wording: ApprovedWording[] = approvedWording(),
    wholes: WholeReading[] = [],
): ScoringGroup[] {
    const roles = rolesOf(fixture)
    const groupIds = roles.list.length ? roles.list : [EVERY_TEAM]
    const nounOf = (group: string): string | null => (group === EVERY_TEAM ? null : (roles.nounOf[group] ?? null))
    const withheld = (group: string, why: string[], extra: Partial<ScoringGroup> = {}): ScoringGroup => ({
        group,
        noun: nounOf(group),
        withheld: true,
        why,
        sentences: [],
        fullRules: [],
        requirements: [],
        ways: [],
        extractsKeepingNothing: [],
        notes: [],
        ...extra,
    })
    const table = load.table
    if (!table) return groupIds.map(group => withheld(group, [`the essentials table cannot be used: ${load.why}`]))
    const reading = scoringRequirementsOf(fixture, rendered, table, wording)
    const details = reading.details
    const requirements = new Map<string, Map<string, Requirement>>(groupIds.map(group => [group, new Map((reading.requirements[group] ?? []).map(r => [r.path, r] as const))]))
    const problems = new Map<string, string[]>(groupIds.map(group => [group, [...(reading.problems[group] ?? [])]]))
    const wayOf = (path: string): string | null => {
        for (const held of requirements.values()) if (held.has(path)) return held.get(path)!.way
        return null
    }

    return groupIds.map(group => {
        const required = requirements.get(group)!
        const listed = [...required.values()].sort((a, b) => a.order - b.order)
        const requirementsOut = (chosen: Candidate[], pointed: Set<string>) =>
            listed.map(r => ({ path: r.path, row: r.row, class: r.class, rule: r.rule, statedBy: chosen.flatMap((c, n) => (c.states.includes(r.path) ? [n] : [])), pointedTo: pointed.has(r.path) }))
        if (problems.get(group)!.length) return withheld(group, problems.get(group)!, { requirements: requirementsOut([], new Set()) })
        if (!listed.length) return withheld(group, ['no Details sentence of this block cites a field the essentials table classes for this team, so no scoring is said for it'])

        const inGroup = (from: string[]) => from.filter(path => required.has(path))
        /** Stage 3F: CONSTITUTIVE and ESSENTIAL always; a DETAIL only where a condition it follows from has no field in this group. */
        const isMaterial = (path: string): boolean => {
            const requirement = required.get(path)!
            if (requirement.class !== 'DETAIL') return true
            const governing = followsFromOf(requirement, listed, table)
            return governing !== null && governing.some(entry => entry.fields.length === 0)
        }
        /** What a Details sentence said whole states: his wording by its recorded reading (nothing without one); a DRAFT one what it cites. */
        const wholeOf = (sentence: DetailsSentence): WholeReading | null => wholeReadingOfSentence(wholes, sentence.instruction, sentence.source)
        const statesWhole = (sentence: DetailsSentence): string[] => inGroup(sentence.wording === 'APPROVED' ? (wholeOf(sentence)?.states ?? []) : sentence.instruction.from)
        const sourceOf = (extract: DerivedExtract): DetailsSentence | null => {
            const element = extract.id.includes('@') ? extract.id.slice(extract.id.indexOf('@') + 1) : null
            return (
                details.find(
                    sentence =>
                        sentence.wording === 'APPROVED' &&
                        sentence.source?.kind === 'APPROVED_ENTRY' &&
                        sentence.source.id === extract.source.id &&
                        (element === null || sentence.instruction.from.some(path => path.startsWith(`${element}.`))),
                ) ?? null
            )
        }
        const usable = extracts.map(extract => ({ extract, source: sourceOf(extract) })).filter((entry): entry is { extract: DerivedExtract; source: DetailsSentence } => entry.source !== null)
        const keptPaths = (extract: DerivedExtract) => inGroup(extract.keeps.map(ref => ref.path).filter((path): path is string => !!path))
        const whole = (sentence: DetailsSentence, chosenBy: Candidate['chosenBy']): Candidate => ({
            chosenBy,
            form: 'WHOLE',
            at: sentence.at,
            text: withFullStop(sentence.instruction.text),
            wording: sentence.wording,
            source: sentence.source,
            extract: null,
            drops: [],
            states: statesWhole(sentence),
            from: [...sentence.instruction.from],
            bindings: bindingsOfInstruction(sentence.instruction),
            reading: sentence.wording === 'APPROVED' && wholeOf(sentence)?.readingRecord ? { ...wholeOf(sentence)!.readingRecord! } : null,
        })
        const ofExtract = (extract: DerivedExtract, source: DetailsSentence): Candidate => ({
            chosenBy: 'SHORTEST_EXTRACT',
            form: 'EXTRACT',
            at: source.at,
            text: extract.text,
            wording: extract.wording,
            source: { ...extract.source },
            extract,
            drops: droppedBy(source.instruction.text, extract.units),
            states: keptPaths(extract),
            from: [...extract.from],
            bindings: extract.bindings.map(b => ({ ...b })),
            reading: extract.readingRecord ? { ...extract.readingRecord } : null,
        })
        const shorter = (a: { text: string; id?: string }, b: { text: string; id?: string }) => wordsIn(a.text) - wordsIn(b.text) || a.text.length - b.text.length || String(a.id ?? '').localeCompare(String(b.id ?? ''))

        const needed = listed.filter(r => isMaterial(r.path))
        let chosen: Candidate[] = []
        const stated = new Set<string>()
        const take = (candidate: Candidate) => {
            chosen.push(candidate)
            candidate.states.forEach(path => stated.add(path))
        }
        // 1. His approved wording said whole, holding nothing the table leaves to Details, where its reading states a material field not yet stated.
        for (const sentence of details) {
            if (sentence.wording !== 'APPROVED') continue
            const paths = inGroup(sentence.instruction.from)
            if (!paths.length || paths.some(path => !isMaterial(path))) continue
            if (!statesWhole(sentence).some(path => isMaterial(path) && !stated.has(path))) continue
            take(whole(sentence, 'APPROVED_ENTRY'))
        }
        // 2. The shortest verbatim extract of his wording whose recorded reading keeps the field.
        for (const r of needed) {
            if (stated.has(r.path)) continue
            const options = usable.filter(({ extract }) => extract.omitsBetween.length === 0 && keptPaths(extract).includes(r.path)).sort((a, b) => shorter(a.extract, b.extract))
            if (options.length) take(ofExtract(options[0].extract, options[0].source))
        }
        // 3. The first Details sentence whose words state it: his wording whole by its reading, or a DRAFT sentence's shortest shortening
        // still citing what it must (stage 3F: an approved sentence citing the field whose reading does not state it is passed over).
        for (const r of needed) {
            if (stated.has(r.path)) continue
            for (const sentence of details.filter(candidate => candidate.instruction.from.includes(r.path))) {
                if (sentence.wording === 'APPROVED') {
                    if (!statesWhole(sentence).includes(r.path)) continue
                    take(whole(sentence, 'DETAILS_SENTENCE'))
                    break
                }
                const must = inGroup(sentence.instruction.from).filter(isMaterial)
                const shortening = draftShorteningsOf(sentence.instruction)
                    .filter(candidate => must.every(path => candidate.from.includes(path)))
                    .sort(shorter)[0]
                take(
                    shortening
                        ? {
                              chosenBy: 'DETAILS_SENTENCE',
                              form: 'SHORTENING',
                              at: sentence.at,
                              text: shortening.text,
                              wording: extractStatusOf('DRAFT'),
                              source: null,
                              extract: null,
                              drops: [shortening.drops],
                              states: inGroup(shortening.from),
                              from: [...shortening.from],
                              bindings: shortening.bindings.map(b => ({ ...b })),
                              reading: null,
                          }
                        : whole(sentence, 'DETAILS_SENTENCE'),
                )
                break
            }
        }
        // An extract of a sentence also said whole is inside it.
        chosen = chosen.filter(c => !(c.form === 'EXTRACT' && chosen.some(other => other.form === 'WHOLE' && other.at === c.at)))
        // Stage 3F: the most concise set that states every material field: drop, the longest first, a sentence whose material fields the
        // others state.
        for (let dropped = true; dropped; ) {
            dropped = false
            for (const c of [...chosen].sort((a, b) => shorter(b, a))) {
                const others = new Set(chosen.filter(other => other !== c).flatMap(other => other.states))
                if (!c.states.filter(isMaterial).every(path => others.has(path))) continue
                chosen = chosen.filter(other => other !== c)
                dropped = true
                break
            }
        }
        const inOrder = (a: Candidate, b: Candidate): number => {
            const first = (c: Candidate) => (details[c.at].instruction.section === 'How to score' ? 0 : 1)
            const unit = (c: Candidate) => c.extract?.units[0]?.sentence ?? -1
            return first(a) - first(b) || a.at - b.at || unit(a) - unit(b)
        }
        // Stage 3F: the group's LEAD, the line stating how the team scores: the sentence stating most of the CONSTITUTIVE fields of its first
        // way to score (the way of the first CONSTITUTIVE field the Details cite), one sentence where one does, then the first in order.
        const firstWay = listed.find(r => r.class === 'CONSTITUTIVE')?.way ?? null
        const shows = (c: Candidate) => c.states.filter(path => required.get(path)!.class === 'CONSTITUTIVE' && required.get(path)!.way === firstWay).length
        const oneSentence = (c: Candidate) => (sentencesOf(c.text).length === 1 ? 1 : 0)
        const lead: Candidate | null = chosen.filter(c => shows(c) > 0).sort((a, b) => oneSentence(b) - oneSentence(a) || shows(b) - shows(a) || inOrder(a, b))[0] ?? null
        // Extracts of one sentence (never the lead) become the one extract of all their parts.
        for (const at of [...new Set(chosen.filter(c => c.form === 'EXTRACT' && c !== lead).map(c => c.at))]) {
            const parts = chosen.filter(c => c.form === 'EXTRACT' && c.at === at && c !== lead)
            if (parts.length < 2) continue
            // Their parts together, a sentence said whole taking the place of its leading clause.
            const bySentence = new Map<number, ExtractUnit>()
            for (const unit of parts.flatMap(c => c.extract!.units)) {
                const held = bySentence.get(unit.sentence)
                if (!held || (held.part === 'LEADING_CLAUSE' && unit.part === 'WHOLE_SENTENCE')) bySentence.set(unit.sentence, { ...unit })
            }
            const units = [...bySentence.values()].sort(byPlace)
            const union = new Set(parts.flatMap(c => c.states))
            const source = details[at]
            const everySentence = sentencesOf(source.instruction.text).every((_, n) => bySentence.get(n)?.part === 'WHOLE_SENTENCE')
            if (everySentence) {
                chosen = [...chosen.filter(c => !parts.includes(c)), whole(source, 'APPROVED_ENTRY')]
                continue
            }
            const joined = usable.find(
                ({ extract, source: from }) => from.at === at && extract.omitsBetween.length === 0 && canonicalJson(extract.units) === canonicalJson(units) && [...union].every(path => keptPaths(extract).includes(path)),
            )
            if (!joined) continue
            chosen = [...chosen.filter(c => !parts.includes(c)), ofExtract(joined.extract, joined.source)]
        }
        stated.clear()
        chosen.forEach(c => c.states.forEach(path => stated.add(path)))
        chosen.sort((a, b) => (a === lead ? -1 : b === lead ? 1 : 0) || inOrder(a, b))

        const why: string[] = []
        for (const r of needed) {
            if (stated.has(r.path)) continue
            // Stage 3F: where his wording cites the field and its recorded reading does not say its words state it, say so.
            const citing = [...new Set(details.filter(sentence => sentence.wording === 'APPROVED' && sentence.instruction.from.includes(r.path)).map(sentence => sentence.source?.id ?? 'his wording'))]
            const material = r.class === 'DETAIL' ? ', material: a condition it follows from has no field in this group' : ''
            why.push(`${r.path} (${r.class}${material}, rule ${r.rule}) is stated by no sentence of the group${citing.length ? ` (${citing.join(' and ')} ${citing.length > 1 ? 'cite' : 'cites'} it, and no recorded reading says those words state it)` : ''}`)
        }
        // Every way to score the group speaks of is shown by a stated CONSTITUTIVE field under it (the table's way-level rule).
        const ways = [...new Set(listed.map(r => wayOf(r.path)).filter((way): way is string => !!way))].map(way => ({
            way,
            shownBy: chosen.flatMap((c, n) => (c.states.some(path => wayOf(path) === way && required.get(path)!.class === 'CONSTITUTIVE') ? [n] : [])),
        }))
        for (const way of ways) {
            if (!listed.some(r => wayOf(r.path) === way.way && r.class === 'CONSTITUTIVE')) why.push(`the way to score ${way.way} has no field the essentials table classes CONSTITUTIVE, so it cannot be shown to appear`)
            else if (!way.shownBy.length) why.push(`the way to score ${way.way} is shown by no sentence of the group`)
        }
        // Stage 3F: a group that says anything opens with the line saying how the team scores.
        if (!why.length && !lead) why.push('no sentence of the group states its first way to score, so no line can say first how the team scores')

        // "Full rule" pointers: each DETAIL left out, and each way to score said shortened, to the Details sentence saying it in full.
        const pointers = new Map<number, DetailsPointer>()
        const point = (at: number, because: DetailsPointer['because'][number], paths: string[]) => {
            const pointer = pointers.get(at) ?? { ...refOf(details[at]), label: FULL_RULE_LABEL, labelStatus: 'DRAFT' as const, because: [], paths: [] }
            if (!pointer.because.includes(because)) pointer.because.push(because)
            for (const path of paths) if (!pointer.paths.includes(path)) pointer.paths.push(path)
            pointers.set(at, pointer)
        }
        for (const r of listed) if (!isMaterial(r.path) && !stated.has(r.path)) point(r.at, 'DETAIL_LEFT_OUT', [r.path])
        for (const c of chosen) {
            if (c.form === 'WHOLE' || chosen.some(other => other.form === 'WHOLE' && other.at === c.at)) continue
            const ways = inGroup(details[c.at].instruction.from).filter(path => required.get(path)!.class === 'CONSTITUTIVE')
            if (ways.length) point(c.at, 'SHORTENED_WAY_TO_SCORE', ways)
        }
        const carriedBy = new Map<number, number>()
        chosen.forEach((c, n) => {
            if (c.form !== 'WHOLE' && pointers.has(c.at) && !carriedBy.has(c.at)) carriedBy.set(c.at, n)
        })
        const pointed = new Set([...pointers.values()].flatMap(pointer => pointer.paths))

        const keepingNothing = usable.filter(({ extract, source }) => extract.reading === 'NONE_RECORDED' && inGroup(source.instruction.from).length > 0).map(({ extract }) => extract.id)
        // Stage 3E: since a reading of some parts is recorded (PROPOSED), the note says how many of the sentence's extracts have one.
        const notes = chosen
            .filter(c => c.form === 'WHOLE' && c.chosenBy === 'DETAILS_SENTENCE' && c.wording === 'APPROVED' && usable.some(({ extract, source }) => source.at === c.at && extract.reading === 'NONE_RECORDED'))
            .map(c => {
                const own = usable.filter(({ source }) => source.at === c.at)
                const read = own.filter(({ extract }) => extract.reading === 'RECORDED').length
                return read === 0
                    ? `${c.source?.id ?? 'the approved sentence'} is said whole: it holds a field the table leaves to Coach Details, and none of its extracts keeps anything, because no reading of what a part of his wording states is recorded (his decision)`
                    : `${c.source?.id ?? 'the approved sentence'} is said whole: it holds a field the table leaves to Coach Details, and no extract of it keeps what this group needs from it (${read} of its ${own.length} extracts are kept by a recorded reading; the others keep nothing)`
            })
        const sentences: ScoringSentence[] = chosen.map((c, n) => ({
            text: c.text,
            wording: c.wording,
            source: c.source,
            chosenBy: c.chosenBy,
            form: c.form,
            extractId: c.extract?.id ?? null,
            details: refOf(details[c.at]),
            drops: c.drops,
            from: c.from,
            bindings: c.bindings,
            states: c.states.map(path => ({ path, class: required.get(path)!.class, rule: required.get(path)!.rule })),
            fullRule: carriedBy.get(c.at) === n ? pointers.get(c.at)! : null,
            reading: c.reading ? { ...c.reading } : null,
            place: c === lead ? 'LEAD' : 'QUALIFICATION',
        }))
        const fullRules = [...pointers.entries()].filter(([at]) => !carriedBy.has(at)).map(([, pointer]) => pointer)
        const out = { requirements: requirementsOut(chosen, pointed), ways, extractsKeepingNothing: keepingNothing, notes }
        if (why.length) return withheld(group, why, out)
        return { group, noun: nounOf(group), withheld: false, why: [], sentences, fullRules, ...out }
    })
}

/** The table as an administrator is told of it: where it is, its status, its label while PROPOSED, and why it cannot be used. */
const tableAccountOf = (load: EssentialsLoad): OverviewScoring['table'] => ({
    source: ESSENTIALS_SOURCE,
    status: load.table ? load.table.status : 'UNUSABLE',
    label: load.table?.status === 'PROPOSED' ? PROPOSED_TABLE_LABEL : null,
    labelStatus: 'DRAFT',
    why: load.why,
})

/** The draft where the overview could not be computed at all: one gap saying why, nothing else (the activity is unaffected). */
export function failedOverviewDraft(what: string): CoachOverviewDraft {
    return {
        served: false,
        check: null,
        reading: null,
        presented: null,
        purpose: null,
        blocks: [],
        sameTextInEveryBlock: false,
        gaps: [{ part: 'game', what: `the overview could not be computed: ${what}` }],
        extracts: [],
        scoring: { table: tableAccountOf(ESSENTIALS), readings: readingsAccountOf(recordedReadings()), blocks: [], sameTextInEveryBlock: false },
        wholes: [],
    }
}

/**
 * **The overview's purpose, game sentence and parameters for one activity** (stage 3A, for an administrator): the purpose once, the game
 * and parameters per game the activity was built from. Whatever goes wrong is a gap: the overview never refuses, or changes, the activity.
 * A block whose extracts cannot be generated lists none, with a gap naming why, and every other part stands (stage 3B review). `extractsOf`
 * is the generator; a test may hand one that fails.
 *
 * Stage 3C: and how each team scores, per block (`scoringGroupsOf`), from that block's own render (`rendered`, the build's; a caller that
 * hands none has the block's fixture rendered here, by the same renderer) and that block's extracts. `options` hand another table or
 * approved wording (tests). A block whose groups cannot be composed lists none, with a `scoring` gap; every other part stands.
 *
 * Stage 3E: the extracts are generated with the PROPOSED record of what parts of his wording state (`recordedReading`, the serving path's
 * reading) unless a generator is handed in; the draft names that record (`scoring.readings`, from `options.readings`, the loaded record
 * by default).
 *
 * Stage 3F: one reading for everything (`options.reading`; else the record `options.readings` gives; else the loaded PROPOSED record):
 * the default extracts and what his wording said whole states (`wholes`, per block) are both read by it, and the draft's account
 * (`scoring.readings`) describes exactly that reading (the 3E review's bookkeeping item). A generator handed in replaces the extracts only.
 */
export function coachOverviewDraftOf(
    goalId: string | null,
    blocks: { blockId: string; fixture: any; rendered?: { instructions: Instruction[] } }[],
    extractsOf?: (game: any) => { extracts: DerivedExtract[]; withheld: WithheldExtract[] },
    options: { essentials?: EssentialsLoad; wording?: ApprovedWording[]; readings?: ReadingsLoad; reading?: CoverReading } = {},
): CoachOverviewDraft {
    const wordingFor = options.wording ?? approvedWording()
    const reading: CoverReading = options.reading ?? (options.readings ? coverReadingOf(options.readings, wordingFor) : recordedReading())
    const generate = extractsOf ?? ((game: any) => extractsFor(game, { reading, wording: wordingFor }))
    const gaps: OverviewGap[] = []
    const { purpose, gap } = purposeOf(goalId)
    if (gap) gaps.push(gap)
    const read = blocks.map(({ blockId, fixture }) => {
        const game = gameSentenceOf(fixture)
        const parameters = parametersOf(fixture)
        if (game.gap) gaps.push({ part: 'game', blockId, what: game.gap })
        if (parameters.gap) gaps.push({ part: 'parameters', blockId, what: parameters.gap })
        return { blockId, game: game.sentence, parameters: parameters.sentence }
    })
    const textOf = (entry: (typeof read)[number]) => JSON.stringify([entry.game?.text ?? null, entry.parameters?.text ?? null])
    // Stage 3B: each block's extracts of the approved wording its own game says, read from that game alone. A failure is that block's gap.
    const extracts = blocks.map(({ blockId, fixture }) => {
        try {
            return { blockId, ...generate(fixture?.game ?? {}) }
        } catch (error) {
            gaps.push({ part: 'extracts' as const, blockId, what: `the extracts of approved wording could not be generated: ${error instanceof Error ? error.message : String(error)}` })
            return { blockId, extracts: [], withheld: [] }
        }
    })
    const load = options.essentials ?? ESSENTIALS
    const wording = wordingFor
    // Stage 3F: what each approved entry said for the block states, said whole, by the same reading. A failure is that block's gap.
    const wholes = blocks.map(({ blockId, fixture }) => {
        try {
            return { blockId, wholes: wholeReadingsFor(fixture?.game ?? {}, { wording, reading }) }
        } catch (error) {
            gaps.push({ part: 'extracts' as const, blockId, what: `what his wording said whole states could not be read: ${error instanceof Error ? error.message : String(error)}` })
            return { blockId, wholes: [] as WholeReading[] }
        }
    })
    // Stage 3C: each block's scoring groups, from its own Details and extracts. A failure is that block's gap.
    const scoringBlocks = blocks.map(({ blockId, fixture, rendered }, n) => {
        try {
            const instructions = rendered?.instructions ?? renderConcreteGame(fixture, wording).instructions
            return { blockId, groups: scoringGroupsOf(fixture, instructions, extracts[n].extracts, load, wording, wholes[n].wholes) }
        } catch (error) {
            gaps.push({ part: 'scoring' as const, blockId, what: `how each team scores could not be composed: ${error instanceof Error ? error.message : String(error)}` })
            return { blockId, groups: [] as ScoringGroup[] }
        }
    })
    const scoringText = (entry: { groups: ScoringGroup[] }) => JSON.stringify(entry.groups.map(group => [group.group, group.withheld, group.sentences.map(sentence => sentence.text), group.fullRules.map(pointer => pointer.text)]))
    const scoring: OverviewScoring = {
        table: tableAccountOf(load),
        readings: options.reading ? readingsAccountOfReading(options.reading) : readingsAccountOf(options.readings ?? recordedReadings()),
        blocks: scoringBlocks,
        sameTextInEveryBlock: scoringBlocks.length > 0 && scoringBlocks.every(entry => scoringText(entry) === scoringText(scoringBlocks[0])),
    }
    return {
        served: false,
        check: null,
        reading: null,
        presented: null,
        purpose,
        blocks: read,
        sameTextInEveryBlock: read.length > 0 && read.every(entry => textOf(entry) === textOf(read[0])),
        gaps,
        extracts,
        scoring,
        wholes,
    }
}
