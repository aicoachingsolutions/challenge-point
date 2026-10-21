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
 * This stage computes three parts of the overview, for an administrator only (`ServedActivity.overviewDraft`, set by the review build
 * with drafts); nothing here is served to a coach and nothing here decides whether an activity is served. Stage 3B adds the wording
 * statuses as data and, per block, the verbatim extracts of the approved wording the game says (`derived-wording.ts`); 3C the scoring
 * group, and 3D the agreement check (Q7) and serving.
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
 */
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { DerivedExtract, extractsFor, WithheldExtract } from './derived-wording'
import { ATTACKING_END, BEYOND, Binding, gameReadingOf, InstructionPart, SIDE_BY_POSSESSION, SourceStatus, statusesOf, strongest, teamCountPhrases } from './render-concrete-game'

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
    part: 'purpose' | 'game' | 'parameters'
    blockId?: string
    what: string
}

/**
 * **The overview's parts as computed for an administrator** (stage 3A). `served` is false: a coach receives none of it until stage 3D
 * checks the overview against Details (Q7). One entry per game the activity was built from: each role block, or the one game.
 */
export interface CoachOverviewDraft {
    served: false
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
                rule: 'the marked line is held at a single point, and twice its distance from the end line it is measured from is the length of the area',
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

/**
 * **The overview's purpose, game sentence and parameters for one activity** (stage 3A, for an administrator): the purpose once, the game
 * and parameters per game the activity was built from. Whatever goes wrong is a gap: the overview never refuses, or changes, the activity.
 */
export function coachOverviewDraftOf(goalId: string | null, blocks: { blockId: string; fixture: any }[]): CoachOverviewDraft {
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
    // Stage 3B: each block's extracts of the approved wording its own game says, read from that game alone.
    const extracts = blocks.map(({ blockId, fixture }) => ({ blockId, ...extractsFor(fixture?.game ?? {}) }))
    return { served: false, purpose, blocks: read, sameTextInEveryBlock: read.length > 0 && read.every(entry => textOf(entry) === textOf(read[0])), gaps, extracts }
}
