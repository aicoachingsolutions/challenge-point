import type { IAffordance } from '../../models/affordance.model'
import { SessionEmphasis } from '../../models/session.model'
import type { ConstraintSelectionCandidate, SystemAssemblyInput } from '../types'
import { TEST_LIBRARY_V0_ARCHETYPES } from '../test-library/archetypes'
import { TEST_LIBRARY_V0_CONSTRAINTS } from '../test-library/constraints'
import type { TestLibraryV0Archetype } from '../test-library/types'
import { registryIdString } from './assembly-package-ids'
import { getEmphasisVariationProfile, getSlotVariationSpec } from './emphasis-variation-profile'
import { getSlotMechanicalVariations, type ValueLandscapeModifier } from './slot-mechanics-variations'

/** One of three system-owned activity slots; AI fills wording but must not remove these mechanics. */
export type ActivitySkeletonSlot = {
    /** 1-based activity index */
    activityIndex: 1 | 2 | 3
    /** Archetype name for soft-matching when long archetype bullet text is paraphrased. */
    archetypeName: string
    titleFrame: string
    setupFrame: string
    /**
     * Environmental configuration directive for this slot under the chosen session emphasis.
     * Tells the AI how this activity's environmental configuration differs from the other two
     * parallel realizations. The field name is retained for code-compatibility with earlier
     * shape; semantics are now parallel realization (Phase 1) + emphasis-aware variation
     * bandwidth (Phase 3), not progression.
     */
    slotProgressionEmphasis: string
    requiredRuleMechanics: string[]
    requiredScoringMechanics: string[]
    /** Per selected affordance lens — structural obligations (titles + lens copy from package) */
    requiredAffordanceMechanics: string[]
    /** Selected foundation/shaping/consequence + assemblyGuardrails obligations (AI scaffolding only — not coach-facing) */
    requiredConstraintMechanics: string[]
    /** Clean coach-facing constraint display: one line per selected constraint (title + brief intent) */
    coachFacingConstraints: string[]
    /** From selected archetype game form */
    requiredArchetypeMechanics: string[]
    /** Decision stems that must appear somewhere in the activity text bundle */
    requiredDecisionLanguage: string[]
    /**
     * Phase 3.5 — Per-slot value-landscape modifiers. These are appended to the slot's
     * required rules / scoring mechanics so the validator enforces their presence in
     * this slot specifically (and not in the other two). Modifiers re-weight value within
     * the shared constraint package; they do not change WHAT the game is.
     */
    slotMechanicalVariations: ValueLandscapeModifier[]
}

export type ActivitySkeletonBundle = {
    activities: ActivitySkeletonSlot[]
    /**
     * The session emphasis the skeleton was built under (Phase 3). Surfaces into the prompt
     * so the AI receives emphasis-specific variation-bandwidth guidance alongside the slot
     * directives. Undefined when the session has no stored emphasis; downstream consumers
     * default to 'applying' per Christian's MVP2 decision.
     */
    sessionEmphasis: SessionEmphasis | undefined
}

const DECISION_STEMS = ['choose', 'read', 'react', 'based on', 'decision', 'adapt', 'option'] as const

type ExtendedAffordance = IAffordance & {
    visibilityTriggers?: string[]
    exampleConsequencePatterns?: string[]
    constraintSupport?: string[]
    gameTemplateAnchor?: string[] | string
    category?: { name?: string; description?: string } | string
}

/** Wording for prompts/validation that must not nudge the model toward prohibited "players must" phrasing. */
function coachSafeGuardrailText(s: string): string {
    return s
        .replace(/\bplayers must decide\b/gi, 'players decide')
        .replace(/\bmust decide whether\b/gi, 'decide whether')
        .replace(/\bmust decide\b/gi, 'decide')
}

/**
 * Lens core mechanic, written in coach voice.
 *
 * Christian's translation-layer feedback: the engine "still SPEAKS in validator architecture" —
 * every lens core mechanic was previously phrased as a system-to-system instruction ("Rules and
 * scoring must require X"). When surfaced in coach-facing scoring, that read as the system
 * talking to itself, not as a coaching rule.
 *
 * The rewrites below preserve the ecological tokens the skeleton validator scans for (regain,
 * line-breaking, possession, pressure, space, etc.) but voice-shift from "the system must require"
 * to "score awarded for / coaches watch for" — i.e., what a coach would actually write.
 */
function affordanceMechanics(title: string): string[] {
    switch (title) {
        case 'Possession Stability Opportunity':
            return [
                'Score awarded only when possession is maintained or secured under live opponent pressure; losing the ball when the picture closes hands the connected advantage to the opponent.',
            ]
        case 'Space Creation Opportunity':
            return [
                'Score awarded for plays that visibly create or open space for a teammate — stretching, unbalancing, or pulling defenders out of position so a teammate has a free option.',
            ]
        case 'Space Exploitation Opportunity':
            return [
                'Score awarded for attacks that use available space to gain advantage — players must progress into the open space before defensive pressure recovers, or the chance is lost.',
            ]
        case 'Line-Breaking Opportunity':
            return [
                'Score awarded for passes or runs that break or bypass a defensive line; line-breaking attempts that are read and intercepted hand the advantage to the opponent on the regain.',
            ]
        case 'Regain Opportunity':
            return [
                'Score awarded for winning the ball back or forcing a turnover; the regain moment immediately switches roles between attackers and defenders, and the new attackers play live.',
            ]
        case 'Transition Attack Opportunity':
            return [
                'Score awarded for quick attacking action immediately after winning possession; the transition window stays live only until the defensive shape recovers, after which the advantage dissipates.',
            ]
        case 'Finishing Opportunity':
            return [
                'Score awarded only for genuine chances created and converted under live defensive contest — chances that survive live defender pressure and goalkeeper presence count, raw shot counts do not.',
            ]
        case 'Delay or Deny Opportunity':
            return [
                'Defenders score when they slow attacking progression or deny forward options — attacks forced backward, wide, or into recovered pressure count as defensive success, not only turnovers.',
            ]
        case 'Space Protection Opportunity':
            return [
                'Defenders score when attacks are forced away from protected space — defensive shape and compactness shape what the attack can access, and successful protection counts as advantage.',
            ]
        case 'Recovery Opportunity':
            return [
                'Defenders score when they recover shape after disruption — tracking back, restoring structure, and reorganizing before the attack converts counts as defensive success.',
            ]
        default:
            return [
                `Score awarded when players visibly engage with the "${title}" problem in live play — not when they recite or label the affordance.`,
            ]
    }
}

function normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((entry) => String(entry).trim()).filter(Boolean)
    }
    const next = String(value ?? '').trim()
    return next ? [next] : []
}

function affordanceFamilyHints(aff: ExtendedAffordance): string[] {
    const searchSpace = [
        aff.title,
        aff.designIntent,
        typeof aff.category === 'string' ? aff.category : aff.category?.name,
        ...normalizeStringArray(aff.gameTemplateAnchor),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

    if (/space|width|depth/.test(searchSpace)) {
        return ['Players read spacing, width, and depth before choosing the next action — the available space defines what is on.']
    }
    if (/transition|regain|recover|attack quickly|fast/.test(searchSpace)) {
        return ['The next action plays immediately after the ball changes hands while the picture is still changing — no reset, no stoppage.']
    }
    if (/retain|possession|stable|support/.test(searchSpace)) {
        return ['Players read possession security, support distance, and safe exits under pressure before choosing the next action.']
    }
    if (/protect|delay|deny|recover shape|defensive/.test(searchSpace)) {
        return ['Defenders use shielding, protection of space, or defensive body position to shape how attackers respond to pressure.']
    }
    if (/finish|goal|shot|target/.test(searchSpace)) {
        return ['Players read shot access, target availability, and final completion pressure to choose whether the attack is ready now.']
    }
    if (/break|line|progress|penetrate/.test(searchSpace)) {
        return ['Players choose whether to attack through, around, or away from pressure based on whether forward penetration is on or the line is closed.']
    }
    return []
}

function lookupArchetypeRow(archetypeName: string): TestLibraryV0Archetype | undefined {
    return TEST_LIBRARY_V0_ARCHETYPES.find((row) => row.game_form_name === archetypeName || row.id === archetypeName)
}

function archetypeLibraryOverlay(archetypeName: string): {
    mechanics: string[]
    ruleSupport: string[]
    scoringSupport: string[]
    coachingSupport: string[]
    setupSupport: string[]
} {
    const row = lookupArchetypeRow(archetypeName)
    if (!row) {
        return {
            mechanics: [],
            ruleSupport: [],
            scoringSupport: [],
            coachingSupport: [],
            setupSupport: [],
        }
    }

    const mechanics: string[] = []
    const ruleSupport: string[] = []
    const scoringSupport: string[] = []
    const coachingSupport: string[] = []
    const setupSupport: string[] = []

    if (row.objective) {
        mechanics.push(`Archetype objective emphasis: ${row.objective}.`)
    }
    if (row.interaction_structure) {
        mechanics.push(`Archetype interaction structure: The activity interaction should follow: ${row.interaction_structure}.`)
        ruleSupport.push(`The activity interaction should follow: ${row.interaction_structure}.`)
    }
    if (row.player_structure_logic) {
        mechanics.push(`Archetype player structure logic: ${row.player_structure_logic}.`)
        setupSupport.push(`Use player relationships consistent with: ${row.player_structure_logic}.`)
    }
    if (row.representative_design_notes) {
        mechanics.push(`Coaching emphasis: ${row.representative_design_notes}.`)
        coachingSupport.push(`Coaching emphasis: ${row.representative_design_notes}.`)
    }
    for (const pattern of row.exampleConstraintPatterns ?? []) {
        mechanics.push(`Archetype constraint pattern support: ${pattern}.`)
        ruleSupport.push(`Constraint-support pattern: ${pattern}.`)
    }
    for (const pattern of row.exampleIncentivePatterns ?? []) {
        mechanics.push(`Archetype incentive pattern support: ${pattern}.`)
        scoringSupport.push(`Scoring-support pattern: ${pattern}.`)
    }

    return {
        mechanics,
        ruleSupport,
        scoringSupport,
        coachingSupport,
        setupSupport,
    }
}

function archetypeMechanics(archetypeName: string): string[] {
    const overlay = archetypeLibraryOverlay(archetypeName)
    switch (archetypeName) {
        case 'Directional Possession Games':
            return [
                'Directional target or progression (attack toward a defined goal or end).',
                'Maintain possession under pressure as a live game condition.',
                'Support options and spacing must shape available passes and outlets.',
                'Players must face a decision to secure possession, progress forward, or switch play.',
                ...overlay.mechanics,
            ]
        case 'Overload Games':
            return [
                'Numerical or positional overload must be built into the game structure.',
                'Opponent pressure must remain live — not passive shadow defence.',
                'Players must decide whether to use the overload, reset circulation, or switch the attack.',
                'Success must depend on actually exploiting the overload to gain advantage.',
                ...overlay.mechanics,
            ]
        case 'Pressing & Regain Games':
            return [
                'Live pressure on the ball or passing lanes.',
                'Clear regain opportunity — winning possession or forcing a turnover.',
                'Immediate transition after regain (attack or defend the counter).',
                'Opponent consequence on turnover — the other side gains a live advantage or restart.',
                ...overlay.mechanics,
            ]
        case 'End Zone Games':
            return [
                'Target or end-zone progression as core structure.',
                'Active opposition contesting progression.',
                'Decision to penetrate, support behind the ball, or recycle when the lane is closed.',
                'Scoring tied to reaching or using the end zone / target area.',
                ...overlay.mechanics,
            ]
        case 'Positional Play Games':
            return [
                'Positional structure — teams maintain spatial relationships and distances to create advantages in defined areas.',
                'Positional advantage (numerical superiority or a free player in a zone) shapes when and how the team plays forward.',
                'Live opposition contests the positional structure — defenders fill spaces and close lines of progression.',
                'Players must face a decision to circulate to create a positional advantage or to exploit a free area that already exists.',
                ...overlay.mechanics,
            ]
        case 'Transition Games':
            return [
                'Transition moment is the core game event — the immediate action after possession changes defines the contest.',
                'Attacking team exploits unorganized space before the defensive shape is restored after the turnover.',
                'Defending team decides whether to press immediately, track recovery runs, or delay to reorganize.',
                'Players must face a decision — attack the transition space now or hold possession while the picture clarifies.',
                ...overlay.mechanics,
            ]
        case 'Target Games':
            return [
                'A target player or designated area is the live focal point for forward progression throughout the game.',
                'Connecting to the target under live defensive pressure is the core demand — not a scripted or required pass.',
                'Defensive opposition actively contests target connections and attacks immediately from regains.',
                'Players must face a decision — when the target is available, whether to connect now or recirculate to create a better angle.',
                ...overlay.mechanics,
            ]
        case 'Channel Games':
            return [
                'Defined spatial channels (wide, half-space, central) structure how both teams progress and defend.',
                'Channel balance — overloading one channel opens another — is the live read both teams must make.',
                'Players decide which channel is genuinely open based on defensive positioning before committing to the attack.',
                'Scoring and advantage must be tied to genuine channel exploitation — reading the imbalance before coverage recovers.',
                ...overlay.mechanics,
            ]
        case 'Finishing Games':
            return [
                'Final third context — all game actions take place in or around the scoring area under live defensive pressure.',
                'Creating a clear scoring chance requires reading timing, movement options, and entry angles under live opposition.',
                'Live defenders contest every finishing attempt; clearances and saves create immediate counter-attack opportunities.',
                'Players must face a decision — shoot, cut inside, or hold for a better angle based on goalkeeper position and defensive cover.',
                ...overlay.mechanics,
            ]
        case 'Constraint-Driven Free Play':
            return [
                'Live two-sided game where the selected constraints define the structure — no fixed positional scheme beyond constraint outcomes.',
                'Both teams solve the constraint problems through open decision-making in a genuinely contested live game.',
                'Defensive and attacking phases must both be live — the constraint shapes what players notice, not how they play.',
                'Players must face a decision on every action — the constraint creates the visible problem; open play decides the solution.',
                ...overlay.mechanics,
            ]
        default:
            return [
                `Game structure must clearly embody "${archetypeName}" — field relations, opposition, and incentives match this game form.`,
                ...overlay.mechanics,
            ]
    }
}

/** Split archetype bullets into rule-leaning vs scoring-leaning heuristically for the skeleton arrays. */
function ruleAndScoringFromArchetype(archetypeName: string): { rules: string[]; scoring: string[] } {
    const core = archetypeMechanics(archetypeName)
    const overlay = archetypeLibraryOverlay(archetypeName)
    switch (archetypeName) {
        case 'Directional Possession Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    core[2],
                    'Two-sided contest: when the team in possession progresses toward the target, play continues live; when the ball is forced or lost, the opponent regains and attacks back.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'A point or live advantage counts when the team progresses possession toward the directional target.',
                    'Possession kept under live pressure is scored when retention itself is the contest.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Overload Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    core[2],
                    'Two-sided contest: the overload side exploits the numerical advantage to create a clear opportunity; the under-numbered side counter-threatens on every regain.',
                    ...overlay.ruleSupport,
                ],
                scoring: [core[3], 'A point or live advantage counts when the team enters or exploits the overload to create a clear opportunity.', ...overlay.scoringSupport],
            }
        case 'Pressing & Regain Games':
            return {
                rules: [core[0], core[1], core[2], 'Every regain immediately chains into the next phase — no whistle, no reset, the regaining team plays on with the live advantage.', ...overlay.ruleSupport],
                scoring: [core[3], 'A point or live advantage shifts on each turnover or regain — the side that wins the ball plays live with the advantage.', ...overlay.scoringSupport],
            }
        case 'End Zone Games':
            return {
                rules: [core[0], core[1], core[2], 'Teams contest entry into the target zone — attackers progress toward it under live pressure, defenders block and counter on any regain.', ...overlay.ruleSupport],
                scoring: [core[3], 'A goal or bonus counts only when the team enters or uses the target end zone under live opposition.', ...overlay.scoringSupport],
            }
        case 'Positional Play Games':
            return {
                rules: [
                    core[0],
                    core[2],
                    'Two-sided contest: the team in possession finds a positional advantage — numerical superiority or a free player in a zone — and exploits it before the defensive shape recovers or disrupts the structure.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'A point or live advantage counts when a positional advantage — numerical superiority, a free player in a zone, or a clear line of progression — is used before the defensive structure recovers.',
                    core[1],
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Transition Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    'The transition moment chains directly into the next attacking action — the advantage is live only before the defensive shape is restored.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'A point or live advantage counts when the team attacks the transition space immediately after winning possession — before the defensive shape is restored.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Target Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    'Two-sided contest: attackers earn the target connection under live pressure; defenders contest the connection and counter on any failed delivery.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'A point or live advantage counts when the team connects to the target under live defensive pressure and continues the attack from that connection.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Channel Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    'Two-sided contest: attackers earn entry into an open channel; defenders shift coverage to close the lane or force a switch to the next channel.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'A point or live advantage counts when the team exploits an open channel — attacking the defensive imbalance through the lane before coverage shifts to close it.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Finishing Games':
            return {
                rules: [
                    core[0],
                    core[2],
                    'Defenders contest every finishing attempt; clearances and saves immediately become counter-attack opportunities for the defending team.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'A goal or live advantage counts only for genuine finishing chances created and converted under live defensive pressure — not for raw shot counts.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Constraint-Driven Free Play':
            return {
                rules: [
                    core[0],
                    core[1],
                    'The selected constraints define the structure; all other play is free within a genuinely contested live game.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring reflects the selected constraint outcomes — both teams earn advantages and face live risks shaped by the constraint package.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        default:
            return {
                rules: ['Rules describe opposition, the live environment, and continuation of play after each outcome.', core[0], ...overlay.ruleSupport],
                scoring: ['Scoring describes how each side earns advantage in the archetype contest.', ...overlay.scoringSupport],
            }
    }
}

function uniqueSelectedAffordances(input: SystemAssemblyInput): IAffordance[] {
    const list = [input.affordances.primary, ...input.affordances.supporting]
    const seen = new Set<string>()
    const out: IAffordance[] = []
    for (const affordance of list) {
        const id = registryIdString((affordance as { _id?: unknown; id?: unknown })._id ?? (affordance as { id?: unknown }).id)
        if (!id || seen.has(id)) continue
        seen.add(id)
        out.push(affordance)
    }
    return out
}

function affordanceMechanicsForLens(aff: IAffordance): string[] {
    const lens = aff as ExtendedAffordance
    const title = lens.title ?? ''
    const titleMechanics = affordanceMechanics(title)
    const lines: string[] = []
    for (const line of titleMechanics) {
        lines.push(`Affordance lens "${title}": ${line}`)
    }
    for (const line of affordanceFamilyHints(lens)) {
        lines.push(`Affordance tag emphasis for "${title}" (${lens.affordanceTagGroup ?? 'unclassified'}): ${line}`)
    }

    for (const trigger of normalizeStringArray(lens.visibilityTriggers)) {
        lines.push(`Affordance decision cue for "${title}": Players should recognize ${trigger} before choosing the next action.`)
    }

    for (const pattern of normalizeStringArray(lens.exampleConsequencePatterns)) {
        lines.push(`Affordance consequence pattern for "${title}": The activity consequence should reward or punish: ${pattern}.`)
    }

    const supports = normalizeStringArray(lens.constraintSupport)
    if (supports.length > 0) {
        lines.push(`Affordance constraint support for "${title}": The constraint should support ${supports.join(', ')}.`)
    }

    const extras = [lens.designIntent, lens.description, lens.notes, lens.suggestedConstraintPrompt, lens.gameTemplateAnchor]
        .filter(Boolean)
        .join(' ')
        .trim()
    if (extras.length > 0) {
        const snippet = extras.length > 320 ? `${extras.slice(0, 317)}…` : extras
        lines.push(
            `Affordance lens "${title}" — reflect lens behaviors in objective, rules, scoring, constraints, or coachingFocus: ${snippet}`
        )
    }
    return lines
}

function pushConstraintCandidate(lines: string[], role: string, candidate: ConstraintSelectionCandidate): void {
    const c = candidate.constraint
    const title = c.title ?? 'constraint'
    const body = [c.designIntent, c.description, c.notes, c.suggestedConstraintPrompt, c.gameTemplateAnchor].filter(Boolean).join(' ')
    if (body.trim()) {
        lines.push(`Selected ${role} constraint "${title}" — required behaviors: ${body.trim()}`)
    } else {
        lines.push(
            `Selected ${role} constraint "${title}" — title and role must anchor objective, rules, scoring, constraints, or coachingFocus.`
        )
    }
}

function constraintAndGuardrailMechanics(input: SystemAssemblyInput): string[] {
    const pkg = input.constraintPackage
    const lines: string[] = []
    pushConstraintCandidate(lines, 'foundation', pkg.foundation)
    pushConstraintCandidate(lines, 'shaping', pkg.shaping)
    if (pkg.consequence) {
        pushConstraintCandidate(lines, 'consequence', pkg.consequence)
    }

    const g = pkg.assemblyGuardrails
    const visibleSignals = g.visibleCue.signals?.length ? ` Signals: ${g.visibleCue.signals.join('; ')}` : ''
    lines.push(
        `Assembly guardrail — visible cue: ${coachSafeGuardrailText(g.visibleCue.summary)}${visibleSignals ? coachSafeGuardrailText(visibleSignals) : ''}`
    )
    const dims = g.decisionProblem.preservedDecisions.join(', ')
    lines.push(
        `Assembly guardrail — decision problem: ${coachSafeGuardrailText(g.decisionProblem.summary)} Player decision freedom stays live on: ${dims}.`
    )
    lines.push(
        `Interaction exchange — live rule and cues: ${coachSafeGuardrailText(g.interactionExchange.canonicalRule)} Visible opportunity cue: ${coachSafeGuardrailText(g.interactionExchange.visibleOpportunityCue)}. In-play decision: ${coachSafeGuardrailText(g.interactionExchange.decisionProblem)}.`
    )
    lines.push(
        `Interaction exchange — outcomes: reward or advantage when ${coachSafeGuardrailText(g.interactionExchange.rewardAdvantage)}; risk when ${coachSafeGuardrailText(g.interactionExchange.misreadOrForceRisk)}; opponent ${coachSafeGuardrailText(g.interactionExchange.opponentAdvantage)}; continuation ${coachSafeGuardrailText(g.interactionExchange.liveContinuation)}.`
    )
    lines.push(`Opponent consequence: ${coachSafeGuardrailText(g.opponentConsequence.summary)}`)
    if (g.opponentConsequence.signals?.length) {
        lines.push(`Opponent consequence emphasis (reflect in scoring or rules): ${g.opponentConsequence.signals.join('; ')}`)
    }
    return lines
}

function buildCoachFacingConstraintLine(candidate: ConstraintSelectionCandidate): string {
    const c = candidate.constraint
    const title = c.title ?? 'Constraint'
    const body = (c.designIntent || c.description || '').trim()
    if (!body) {
        return `${title}.`
    }
    const firstSentence = body.split(/\.\s/)[0] ?? body
    const clipped = firstSentence.length > 160 ? `${firstSentence.slice(0, 157)}…` : firstSentence
    return `${title}: ${clipped}.`
}

function buildCoachFacingConstraints(input: SystemAssemblyInput): string[] {
    const pkg = input.constraintPackage
    const lines: string[] = [
        buildCoachFacingConstraintLine(pkg.foundation),
        buildCoachFacingConstraintLine(pkg.shaping),
    ]
    if (pkg.consequence) {
        lines.push(buildCoachFacingConstraintLine(pkg.consequence))
    }
    return lines.filter(Boolean)
}

/**
 * Per Christian's Session Emphasis & Environmental Intention Framework, the three activities are
 * PARALLEL ENVIRONMENTAL REALIZATIONS of the same session emphasis — not progressive stages.
 * Title frames signal "alternative realization N" rather than "stage N of a difficulty ramp."
 * The system must avoid implying Activity 3 is more advanced or that Activity 2 builds toward
 * Activity 3.
 */
function titleFrameForSlot(archetypeName: string, index: 1 | 2 | 3): string {
    const themes = [
        `Alternative realization of the ${archetypeName} game form — this activity offers one configuration of the session's environmental intention. Title should distinguish this activity from the other two without implying it is easier, earlier, or less advanced.`,
        `Alternative realization of the ${archetypeName} game form — this activity offers a different configuration of the same environmental intention (different spatial organization, transition condition, scoring nuance, or numerical relationship). Title should signal a parallel design, not a progression.`,
        `Alternative realization of the ${archetypeName} game form — this activity offers a third configuration of the same environmental intention. Title should signal a parallel design, not the "hardest" or "final" version.`,
    ]
    return `${themes[index - 1]} Titles across the three activities should read as alternatives a coach might choose between, not as a ladder.`
}

/**
 * Look up setupGuidance for the selected archetype and constraints. Returns a flat array of
 * coach-facing setup parameter lines (zone definitions, time windows, numerical structures,
 * equipment specifics). This is the data the AI uses to write a concrete setup description
 * rather than a generic "mark cones if needed" placeholder.
 */
function collectSetupGuidance(input: SystemAssemblyInput): {
    archetypeGuidance: string[]
    foundationGuidance: string[]
    shapingGuidance: string[]
    consequenceGuidance: string[]
} {
    const archetypeRow = lookupArchetypeRow(input.archetype.name)
    const findConstraintSetup = (id: unknown): string[] => {
        const cId = String(id ?? '').trim()
        if (!cId) return []
        const row = TEST_LIBRARY_V0_CONSTRAINTS.find((c) => c.id === cId)
        return row?.setupGuidance ?? []
    }
    return {
        archetypeGuidance: archetypeRow?.setupGuidance ?? [],
        foundationGuidance: findConstraintSetup(
            (input.constraintPackage.foundation.constraint as { _id?: unknown; id?: unknown })._id ??
                (input.constraintPackage.foundation.constraint as { id?: unknown }).id
        ),
        shapingGuidance: findConstraintSetup(
            (input.constraintPackage.shaping.constraint as { _id?: unknown; id?: unknown })._id ??
                (input.constraintPackage.shaping.constraint as { id?: unknown }).id
        ),
        consequenceGuidance: input.constraintPackage.consequence
            ? findConstraintSetup(
                  (input.constraintPackage.consequence.constraint as { _id?: unknown; id?: unknown })._id ??
                      (input.constraintPackage.consequence.constraint as { id?: unknown }).id
              )
            : [],
    }
}

function setupFrameForSlot(
    input: SystemAssemblyInput,
    index: 1 | 2 | 3,
    emphasis: SessionEmphasis | undefined
): string {
    const overlay = archetypeLibraryOverlay(input.archetype.name)
    const guidance = collectSetupGuidance(input)
    const fieldLength = input.session.fieldLength
    const fieldWidth = input.session.fieldWidth
    const fieldType = input.session.fieldType ?? 'surface'
    const fieldSpec = fieldLength && fieldWidth ? `${fieldLength}x${fieldWidth} ${fieldType}` : `${fieldType} (dimensions not specified — choose appropriate size for player count)`
    const playerCount = input.session.playerCount ? Number(input.session.playerCount) : null
    const playerSpec = playerCount && playerCount > 0 ? `${playerCount} players total` : 'team count appropriate to the constraint package'

    // Phase 3: emphasis-aware variation. Setup framing is shaped by the variation profile
    // (see emphasis-variation-profile.ts). For 'discovering', each slot foregrounds a
    // distinct primary axis (spatial / transition / overload + scoring). For 'applying',
    // all slots share the core configuration and vary modestly along one micro-parameter.
    // The no-progression guardrails still apply: no slot is the "easier", "introductory",
    // or "final" version regardless of emphasis.
    const profile = getEmphasisVariationProfile(emphasis)
    const spec = profile.slots[index - 1]
    const slotSpecific = spec.directive

    const lines: string[] = [
        `Setup (${index}/3) for ${input.archetype.name}: write a concrete coach-facing setup paragraph.`,
        `Field: ${fieldSpec}. Players: ${playerSpec}.`,
        slotSpecific,
        '',
        'Include the following parameters from the selected game form and constraints (rewrite into a coherent setup paragraph — do not just list them):',
    ]
    if (guidance.archetypeGuidance.length > 0) {
        lines.push(`- Game form (${input.archetype.name}):`)
        for (const g of guidance.archetypeGuidance) lines.push(`  • ${g}`)
    }
    if (guidance.foundationGuidance.length > 0) {
        lines.push(`- Foundation constraint (${input.constraintPackage.foundation.constraint.title ?? 'foundation'}):`)
        for (const g of guidance.foundationGuidance) lines.push(`  • ${g}`)
    }
    if (guidance.shapingGuidance.length > 0) {
        lines.push(`- Shaping constraint (${input.constraintPackage.shaping.constraint.title ?? 'shaping'}):`)
        for (const g of guidance.shapingGuidance) lines.push(`  • ${g}`)
    }
    if (guidance.consequenceGuidance.length > 0 && input.constraintPackage.consequence) {
        lines.push(`- Consequence constraint (${input.constraintPackage.consequence.constraint.title ?? 'consequence'}):`)
        for (const g of guidance.consequenceGuidance) lines.push(`  • ${g}`)
    }
    lines.push('')
    lines.push('Coach should be able to walk onto the field, read this setup, and physically set it up without inventing parameters. Include opposed teams, restart logic consistent with the skeleton, and the specific zones/numbers/timers the constraints require.')

    if (overlay.setupSupport.length > 0) {
        lines.push('')
        lines.push(`Additional archetype setup hints: ${overlay.setupSupport.join(' ')}`)
    }

    return lines.join('\n')
}

/**
 * Per Christian's Session Emphasis & Environmental Intention Framework, the three activities are
 * NOT a progression. They are alternative realizations of the same session emphasis.
 *
 * Phase 3: the slot directive is now ALSO emphasis-aware. The variation profile (see
 * emphasis-variation-profile.ts) prescribes which environmental axes vary across the three
 * slots and with what bandwidth:
 *
 *   - 'discovering' → wide bandwidth, each slot foregrounds a different primary axis
 *     (spatial, transition, overload + scoring).
 *   - 'applying' → narrow bandwidth, all slots share core configuration, each slot varies
 *     modestly along one micro-parameter (baseline, spatial micro-vary, timing/scoring
 *     micro-vary).
 *
 * The system must still avoid implying "Activity 3 is more advanced", "Activity 2 builds
 * toward Activity 3", or "this is the correct progression pathway." Emphasis shapes WHICH
 * parallel-realization pattern is used; it does NOT loosen the no-progression guardrails.
 */
function slotProgressionEmphasisFor(
    index: 1 | 2 | 3,
    emphasis: SessionEmphasis | undefined
): string {
    // Note the function is retained as slotProgressionEmphasisFor for backward compatibility
    // with the slot field name; the framework it now describes is emphasis-aware parallel
    // realization, not progression. Renaming the field is a separate sweep.
    const spec = getSlotVariationSpec(emphasis, index)
    const realizationLetter = index === 1 ? 'A' : index === 2 ? 'B' : 'C'
    const variationLabel = spec.label
    const holdSummary = spec.holdAxes.length > 0
        ? `Hold these axes stable across the three activities: ${spec.holdAxes.join(', ')}.`
        : 'Variation across all primary environmental axes is permitted under this emphasis.'

    return [
        `Activity ${index} of 3 — alternative realization ${realizationLetter} of the session emphasis (variation role: ${variationLabel}).`,
        'The three activities are PARALLEL designs the coach can choose between, not stages of a difficulty ramp.',
        spec.directive,
        holdSummary,
    ].join(' ')
}

/**
 * Per Christian's Session Emphasis & Environmental Intention Framework, the three activities are
 * parallel realizations of the same session emphasis — not progressive stages. Therefore each
 * slot receives the FULL selected affordance lens set, not a progressive subset.
 *
 * The previous slot 1 = primary only / slot 2 = primary + first supporting / slot 3 = all lenses
 * pattern implied a difficulty ramp (slot 1 simpler, slot 3 more demanding). That contradicts the
 * parallel-realization principle. All three activities now operate at the same affordance density;
 * differentiation between activities lives in the environmental configuration (space, transition,
 * overload, scoring nuance) — not in how many lenses are active.
 */
function slotAffordanceCountFor(_idx: 1 | 2 | 3, total: number): number {
    return total
}

/**
 * Deterministic activity skeleton: three slots, structurally differentiated by affordance subset.
 * AI supplies readable wording for each slot; mechanic obligations progress 1→2→all lenses.
 */
export function buildActivitySkeleton(input: SystemAssemblyInput): ActivitySkeletonBundle {
    const archetypeName = input.archetype.name
    const affordances = uniqueSelectedAffordances(input)
    const constraintMechanics = constraintAndGuardrailMechanics(input)
    const archRulesScoring = ruleAndScoringFromArchetype(archetypeName)
    const requiredArchetypeMechanics = archetypeMechanics(archetypeName)
    const coachFacingConstraints = buildCoachFacingConstraints(input)

    // Phase 3: read session emphasis once. Undefined / missing values default to 'applying'
    // inside getEmphasisVariationProfile (Christian's MVP2 decision for existing sessions
    // without the stored field).
    const sessionEmphasis = input.session?.sessionEmphasis

    const slots: ActivitySkeletonSlot[] = ([1, 2, 3] as const).map((idx) => {
        const slotAffordanceCount = slotAffordanceCountFor(idx, affordances.length)
        const slotAffordances = affordances.slice(0, slotAffordanceCount)
        const slotAffMechanics = slotAffordances.flatMap((a) => affordanceMechanicsForLens(a))

        // Phase 3.5: value-landscape modifiers for this slot. Wide for discovering,
        // narrow for applying; applying slot 1 returns an empty array (shared baseline).
        const slotModifiers = getSlotMechanicalVariations(sessionEmphasis, idx)
        const ruleModifierLines = slotModifiers
            .filter((m) => m.placement === 'rule')
            .map((m) => `[Slot Mechanics — ${m.label}] ${m.mechanicLine}`)
        const scoringModifierLines = slotModifiers
            .filter((m) => m.placement === 'scoring')
            .map((m) => `[Slot Mechanics — ${m.label}] ${m.mechanicLine}`)

        const combinedRulesForSlot: string[] = [
            ...archRulesScoring.rules,
            ...slotAffMechanics.map((m) => `[Affordance] ${m}`),
            ...constraintMechanics.map((m) => `[Constraint] ${m}`),
            ...ruleModifierLines,
        ]
        const combinedScoringForSlot: string[] = [
            ...archRulesScoring.scoring,
            ...slotAffMechanics.map((m) => `[Affordance] ${m}`),
            ...constraintMechanics.map((m) => `[Constraint] ${m}`),
            ...scoringModifierLines,
        ]

        return {
            activityIndex: idx,
            archetypeName,
            titleFrame: titleFrameForSlot(archetypeName, idx),
            setupFrame: setupFrameForSlot(input, idx, sessionEmphasis),
            slotProgressionEmphasis: slotProgressionEmphasisFor(idx, sessionEmphasis),
            requiredRuleMechanics: combinedRulesForSlot,
            requiredScoringMechanics: combinedScoringForSlot,
            requiredAffordanceMechanics: [...slotAffMechanics],
            requiredConstraintMechanics: [...constraintMechanics],
            coachFacingConstraints,
            requiredArchetypeMechanics,
            requiredDecisionLanguage: [...DECISION_STEMS],
            slotMechanicalVariations: slotModifiers,
        }
    })

    return { activities: slots, sessionEmphasis }
}

export function formatActivitySkeletonForPrompt(bundle: ActivitySkeletonBundle): string {
    const lines: string[] = [
        'SYSTEM-OWNED ACTIVITY SKELETON (mandatory — do not invent a different structure):',
        'You are filling coach-facing wording for this skeleton only.',
        'Do not omit any required mechanics listed below.',
        'Every required mechanic must be satisfied inside objective, rules, scoring, constraints, and/or coachingFocus with clear natural language.',
        'Do not remove meaning; paraphrase is allowed.',
        '',
    ]

    const ref = bundle.activities[0]
    if (ref) {
        // Genuinely shared across all slots: archetype identity, constraint package, decision language.
        // (Affordance/rule/scoring mechanics now progress per slot — see per-slot blocks below.)
        lines.push('Shared mechanics (apply to activities 1, 2, and 3 — each activity must satisfy all of these):')
        lines.push('requiredArchetypeMechanics:')
        for (const r of ref.requiredArchetypeMechanics) lines.push(`  - ${r}`)
        lines.push('requiredConstraintMechanics (foundation, shaping, consequence, assembly guardrails):')
        for (const r of ref.requiredConstraintMechanics) lines.push(`  - ${r}`)
        lines.push('requiredDecisionLanguage (use whole-word stems somewhere in each activity bundle):')
        lines.push(`  - ${ref.requiredDecisionLanguage.join(', ')}`)
        lines.push('')
    }

    lines.push('PARALLEL REALIZATION FRAMEWORK:')
    lines.push('The three activities below are PARALLEL environmental realizations of the same session emphasis. They are NOT a progression. Do not treat Activity 3 as more advanced than Activity 1. Vary the environmental configuration (spatial organization, transition condition, scoring nuance, numerical relationship, overload structure) across the three activities while keeping the session emphasis identity constant. Coaches choose between alternatives; they do not progress through stages.')
    lines.push('')

    // Phase 3: emphasis-aware variation bandwidth. Surfaces the prescribed bandwidth so the
    // AI knows HOW MUCH the three activities should differ from one another under the chosen
    // session emphasis. This shapes WHICH parallel-realization pattern to use; it does NOT
    // loosen the no-progression guardrails above.
    const variationProfile = getEmphasisVariationProfile(bundle.sessionEmphasis)
    lines.push('EMPHASIS-AWARE VARIATION BANDWIDTH:')
    lines.push(`- Session emphasis: ${variationProfile.emphasis}`)
    lines.push(`- Bandwidth: ${variationProfile.bandwidthSummary}`)
    lines.push(`- Rule: ${variationProfile.bandwidthRule}`)
    lines.push('')

    for (const slot of bundle.activities) {
        lines.push(`--- Activity ${slot.activityIndex} (parallel realization, not stage ${slot.activityIndex}) ---`)
        lines.push(`environmentalConfiguration: ${slot.slotProgressionEmphasis}`)
        lines.push(`titleFrame: ${slot.titleFrame}`)
        lines.push(`setupFrame: ${slot.setupFrame}`)
        lines.push('requiredAffordanceMechanics (this activity — same lens set as the other two; all three activities operate at the same affordance density):')
        for (const r of slot.requiredAffordanceMechanics) lines.push(`  - ${r}`)
        // Phase 3.5: surface this slot's value-landscape modifiers as a distinct block so
        // the AI clearly understands these mechanics belong to THIS activity only and the
        // re-weighting they describe is what differentiates this activity from its siblings
        // within the shared session emphasis.
        if (slot.slotMechanicalVariations.length > 0) {
            lines.push('slotMechanicalVariations (this activity — value-landscape modifiers that re-weight value within the shared constraint package; these mechanics must appear in this activity\'s rules or scoring and must NOT be re-stated in the other two activities):')
            for (const m of slot.slotMechanicalVariations) {
                lines.push(`  - [${m.placement}] (${m.label}) ${m.mechanicLine}`)
            }
        } else {
            lines.push('slotMechanicalVariations (this activity): none — this activity carries the shared baseline value structure that the other two slots will re-weight from.')
        }
        lines.push('requiredRuleMechanics (this activity):')
        for (const r of slot.requiredRuleMechanics) lines.push(`  - ${r}`)
        lines.push('requiredScoringMechanics (this activity):')
        for (const r of slot.requiredScoringMechanics) lines.push(`  - ${r}`)
        lines.push('')
    }

    return lines.join('\n')
}
