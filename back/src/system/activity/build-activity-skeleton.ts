import type { IAffordance } from '../../models/affordance.model'
import { SessionEmphasis } from '../../models/session.model'
import type { ConstraintSelectionCandidate, SystemAssemblyInput } from '../types'
import { testLibraryRegistry } from '../test-library/library/registry'
import type { TestLibraryV0Archetype, TestLibraryV0Constraint } from '../test-library/types'
import { registryIdString } from './assembly-package-ids'
import { getEmphasisVariationProfile, getSlotVariationSpec } from './emphasis-variation-profile'
import { getSlotMechanicalVariations, type ValueLandscapeModifier } from './slot-mechanics-variations'
import { learningStageDirective } from './learning-stage-realization'
import { practiceSituationDirective } from './practice-situation-realization'
import { experienceDesignDirective } from './experience-design-directive'
import { expressIncentive } from './incentive-expression'

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
    /**
     * Coach-facing constraint display: one line per selected constraint, describing what it DOES.
     * Never the constraint's internal name — see buildCoachFacingConstraintLine for why.
     */
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
    /** IC-001 realization directive. Empty when the coach was never asked for a Learning Stage. */
    learningStageDirective: string[]
    /** IC-002 representative-context directive. Empty when the goal has no Practice Situations. */
    practiceSituationDirective: string[]
    /** Experience Design RC1. Empty when no Representative Stakes were applied — a normal outcome. */
    experienceDesignDirective: string[]
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
                'Score awarded only when possession is maintained or secured under live opponent pressure; losing the ball once the space closes hands the connected advantage to the opponent.',
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
        return ['The next action plays immediately after the ball changes hands, while the shape is still unsettled — no reset, no stoppage.']
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
    return testLibraryRegistry.archetypes().find((row) => row.game_form_name === archetypeName || row.id === archetypeName)
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

/**
 * Turn a squad size into the formats that actually fit it, so the model never does the arithmetic.
 *
 * Every option returned accounts for EVERY player: sides plus neutrals equal the squad exactly. An
 * activity that needs more players than the coach has is not a lesser activity, it is an activity
 * they cannot run — and it is invisible to us, because the stored group size stays correct while
 * only the setup prose disagrees.
 */
/**
 * Choose the ONE format the activity will use. Deterministic Before Generative.
 *
 * Three attempts taught this. Stating the count as a parameter ("12 players total") produced 7v7
 * plus two neutrals — sixteen. Offering a list of valid formats produced 7v6 — thirteen, because
 * the game form wanted an overload and the model added a player rather than moving one. Forbidding
 * wrong formats strongly enough made the model stop naming a format at all ("each team has equal
 * numbers"), which is not wrong but is useless to a coach setting up a field.
 *
 * The common factor is that we kept asking the model to decide something we already know. The squad
 * size is a fact, the overload requirement is a property of the selected game form, so the format is
 * derivable and there is nothing to negotiate. The model is told what the format IS, and only has to
 * write it into a sentence.
 */
export function choosePlayerFormat(total: number, archetypeName: string): string {
    const wantsOverload = /overload/i.test(archetypeName)

    if (wantsOverload) {
        const larger = Math.ceil(total / 2) + (total % 2 === 0 ? 1 : 0)
        const smaller = total - larger
        if (smaller >= 2) return `${larger}v${smaller}`
    }
    if (total % 2 === 0) return `${total / 2}v${total / 2}`
    const perSide = (total - 1) / 2
    if (perSide >= 2) return `${perSide}v${perSide} plus 1 neutral player`
    return `two teams totalling ${total} players`
}

function archetypeMechanics(archetypeName: string): string[] {
    const overlay = archetypeLibraryOverlay(archetypeName)
    switch (archetypeName) {
        case 'Directional Possession Games':
            return [
                'Teams attack toward a defined goal or end, so every progression has a direction.',
                'Maintain possession under pressure as a live game condition.',
                'Support options and spacing must shape available passes and outlets.',
                'Players decide whether to secure possession, progress forward, or switch play.',
                ...overlay.mechanics,
            ]
        case 'Overload Games':
            return [
                'One team plays with a numerical or positional overload in the area where the contest happens.',
                'Opponent pressure must remain live — not passive shadow defence.',
                'Players must decide whether to use the overload, reset circulation, or switch the attack.',
                'Success must depend on actually exploiting the overload to gain advantage.',
                ...overlay.mechanics,
            ]
        case 'Pressing & Regain Games':
            return [
                'Defenders keep live pressure on the ball and the passing lanes.',
                'Winning possession or forcing a turnover is a clear, live regain opportunity.',
                'Play transitions immediately after a regain — the team winning it attacks, the other defends the counter.',
                'Opponent consequence on turnover — the other side gains a live advantage or restart.',
                ...overlay.mechanics,
            ]
        case 'End Zone Games':
            return [
                'Teams score by progressing to the target or end zone.',
                'Live opposition contests every attempt to progress.',
                'Players decide whether to penetrate, support behind the ball, or recycle when the lane is closed.',
                'Scoring is tied to reaching or using the end zone or target area.',
                ...overlay.mechanics,
            ]
        case 'Positional Play Games':
            return [
                'Teams hold their spatial relationships and distances to create advantages in defined areas.',
                'A numerical superiority or a free player in a zone shapes when and how the team plays forward.',
                'Live opposition contests the positional structure — defenders fill spaces and close lines of progression.',
                'Players decide whether to circulate to create an advantage or to exploit a free area that already exists.',
                ...overlay.mechanics,
            ]
        case 'Transition Games':
            return [
                'The immediate action after possession changes decides the contest — that transition moment is the game.',
                'Attacking team exploits unorganized space before the defensive shape is restored after the turnover.',
                'Defending team decides whether to press immediately, track recovery runs, or delay to reorganize.',
                'Players decide whether to attack the transition space now or hold possession until a better option appears.',
                ...overlay.mechanics,
            ]
        case 'Target Games':
            return [
                'A target player or designated area is the live focal point for forward progression throughout the game.',
                'Connecting to the target under live defensive pressure is the core demand — not a scripted or required pass.',
                'Defensive opposition actively contests target connections and attacks immediately from regains.',
                'When the target is available, players decide whether to connect now or recirculate to create a better angle.',
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
                'All game actions take place in or around the scoring area under live defensive pressure.',
                'Creating a clear scoring chance requires reading timing, movement options, and entry angles under live opposition.',
                'Live defenders contest every finishing attempt; clearances and saves create immediate counter-attack opportunities.',
                'Players decide whether to shoot, cut inside, or hold for a better angle based on goalkeeper position and defensive cover.',
                ...overlay.mechanics,
            ]
        case 'Constraint-Driven Free Play':
            return [
                'Both teams play a live, two-sided game; the conditions below define the structure rather than fixed positions.',
                'Both teams solve the problems below through open decision-making in a genuinely contested live game.',
                'Defending and attacking are both live — the conditions shape what players notice, not how they play.',
                'Players decide on every action — the conditions create the visible problem; open play decides the solution.',
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
        // Whole sentences only. Slicing at a character count produced "…finishing …." in every
        // generated activity, because the model copied the fragment through verbatim.
        const snippet = firstSentencesWithin(extras, 320)
        lines.push(
            `Affordance lens "${title}" — reflect lens behaviors in objective, rules, scoring, constraints, or coachingFocus: ${snippet}`
        )
    }
    return lines
}


/**
 * As many whole sentences as fit within `budget` characters, never cutting one in half.
 *
 * Returns the first sentence even when it exceeds the budget: a single complete sentence a coach can
 * act on is better than a fragment, and the budget exists to bound prompt size rather than to
 * guarantee a maximum.
 */
function firstSentencesWithin(text: string, budget: number): string {
    const sentences = text.split(/(?<=\.)\s+/).filter(Boolean)
    if (sentences.length === 0) return text

    let out = sentences[0]
    for (const sentence of sentences.slice(1)) {
        if (`${out} ${sentence}`.length > budget) break
        out = `${out} ${sentence}`
    }
    return out
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

    // HOW THIS GAME REWARDS, one line per selected constraint that carries an authored incentive
    // mechanism. These are plain coach-facing sentences with no scaffolding prefix, so they survive
    // isCoachFacingMechanicLine and land in the coach's Scoring section — which is the whole point:
    // the mechanism used to be expressed (badly) into prompt-only text that coaches never saw.
    for (const candidate of [pkg.foundation, pkg.shaping, pkg.consequence]) {
        const constraint = candidate?.constraint as (typeof candidate.constraint & {
            incentiveMechanism?: string
            exampleIncentivePatterns?: string[]
        }) | undefined
        if (!constraint) continue
        const incentive = expressIncentive(constraint.incentiveMechanism, {
            designIntent: constraint.designIntent,
            description: constraint.description,
            incentivePatterns: constraint.exampleIncentivePatterns,
        })
        if (incentive) lines.push(incentive)
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

/**
 * One coach-facing line describing what a constraint does — WITHOUT naming it.
 *
 * This used to emit `"${title}: ${firstSentence}…"`, which put our internal library names straight
 * in front of a coach and cut the sentence mid-thought. Generating eighteen real activities showed
 * it in ALL EIGHTEEN — coaches were reading a run of constraint titles followed by a fragment that
 * stopped mid-clause. (The example that made it obvious is not quoted here: it is sport vocabulary,
 * and the coupling guard rightly rejects that in this file.)
 *
 * The title is dropped entirely rather than translated. A constraint's NAME is an internal handle
 * for a mechanism; what a coach needs is what the mechanism does to the game, which the design
 * intent already says. Keeping the name and softening it would still be showing an engine label.
 *
 * The clip is gone too. If a description is long, the whole first sentence is used — a complete
 * sentence a coach can act on beats a truncated one that fits a width nobody chose deliberately.
 */
function buildCoachFacingConstraintLine(candidate: ConstraintSelectionCandidate): string {
    const c = candidate.constraint
    const body = (c.designIntent || c.description || '').trim()
    if (!body) return ''

    const firstSentence = (body.split(/(?<=\.)\s+/)[0] ?? body).trim()
    return firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`
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
        const row = testLibraryRegistry.selectableConstraints().find((c) => c.id === cId)
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

/**
 * Information-expression directive (Round 8D.2). When a selected constraint is an information mechanism
 * (`primaryConstraintType === 'information'`), the AI assembly tends to render a familiar possession /
 * overload game that merely *contains* the mechanic rather than making the PERCEPTUAL problem the
 * visible point — selection is correct but expression defaults to the familiar. This returns a strong
 * prompt directive that elevates the information mechanic to the activity's core problem and injects its
 * concrete instantiation, so the activity reads as an information problem to the coach. Returns '' when
 * no information constraint is selected.
 */
export function informationExpressionDirective(input: SystemAssemblyInput): string {
    const pkg = input.constraintPackage
    const members: Array<ConstraintSelectionCandidate | undefined> = [pkg.foundation, pkg.shaping, pkg.consequence]
    const infoRows: TestLibraryV0Constraint[] = []
    for (const m of members) {
        const c = m?.constraint as { _id?: unknown; id?: unknown } | undefined
        const id = String(c?._id ?? c?.id ?? '').trim()
        if (!id) continue
        const row = testLibraryRegistry.selectableConstraints().find((r) => r.id === id)
        if (row && (row.primaryConstraintType || '').toLowerCase() === 'information') infoRows.push(row)
    }
    if (infoRows.length === 0) return ''

    const lines: string[] = [
        'INFORMATION MECHANICS — THIS IS A PERCEPTION PROBLEM (do not default to a generic game)',
        'This activity includes information-shaping constraint(s). The CORE problem players solve is',
        'PERCEPTUAL: they succeed by reading, anticipating, or handling information under uncertainty — NOT',
        'merely by keeping possession, using an overload, or progressing to a target. Those may be the medium,',
        'but the point of the activity is the information demand below.',
        '',
        'Do not just SAY the activity is about reading — build an environment where reading is UNAVOIDABLE',
        'because of how the rules and scoring function. Each mechanic below names ONE designated environmental',
        'realization to build the activity around (environment/scoring rules, not prescribed player behaviors):',
    ]
    // Representative-realization diversity (Batch 2): rotate deterministically through each mechanic's
    // realization bank by the Decision Context's variationIndex, so repeated designs for the same goal
    // land on DIFFERENT valid spines instead of the AI defaulting to the same one every time. `+ ri`
    // decorrelates multiple info constraints so they don't all pick the same bank position.
    const seed = input.variationIndex ?? 0
    infoRows.forEach((r, ri) => {
        lines.push(`- ${r.title}: ${r.description}`)
        const realizations = r.environmentalRealizations ?? []
        if (realizations.length > 0) {
            const chosen = realizations[(seed + ri) % realizations.length]
            lines.push('  Build the activity around THIS designated realization — make it the spine, do not blend the others:')
            lines.push(`    • ${chosen}`)
            if (realizations.length > 1) {
                lines.push(
                    '    (Other valid realizations exist for this mechanic; use only the designated one above so repeated designs stay distinct.)'
                )
            }
        } else {
            for (const g of r.setupGuidance ?? []) lines.push(`    • ${g}`)
        }
    })
    lines.push('')
    lines.push(
        'Coach-facing wording: describe the chosen realization in plain language a coach uses on the field (e.g.'
    )
    lines.push(
        '"the active goal changes after the first forward pass"). Keep internal terms OUT of the activity text —'
    )
    lines.push(
        'no "information mechanic", "perception problem", "affordance", or "decision window"; the activity should'
    )
    lines.push('simply BE a perception problem through its conditions, not announce that it is one.')
    lines.push('')
    lines.push(
        'TEST before finishing: if you deleted every descriptive phrase about "reading" or "deciding" from the'
    )
    lines.push(
        'activity, the chosen realization above must STILL force the information problem through the rules and'
    )
    lines.push(
        'scoring alone. If stripping those phrases leaves an ordinary possession or overload game, the activity'
    )
    lines.push('has NOT expressed the information problem — rebuild it around the realization.')
    return lines.join('\n')
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
    // THE COUNT WAS STATED AND NEVER ENFORCED. "Players: 12 players total." sat among a dozen other
    // parameters, and a real activity for a 12-player group came back as "7v7 with a neutral player
    // in each wide channel" — sixteen players. A coach with twelve cannot run it at all, and nothing
    // downstream noticed, because the stored group size (12) is correct; only the prose disagrees.
    //
    // So the count is now given as ARITHMETIC ALREADY DONE rather than a number to reason from.
    // Asking a language model to divide and then respect the remainder is asking for the one thing
    // it is least reliable at; handing it valid splits removes the arithmetic from its job entirely.
    const playerSpec =
        playerCount && playerCount > 0
            ? `${choosePlayerFormat(playerCount, input.archetype.name)} — exactly ${playerCount} players, all of them on the field. ` +
              `Write this format into the setup as stated; do not substitute a different one.`
            : 'team count appropriate to the constraint package'

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
        // Role, not name. Labelling these with the constraint's internal title put that title into
        // generated setup text — the model treats a label as part of the content to reproduce.
        lines.push('- The base condition of the game:')
        for (const g of guidance.foundationGuidance) lines.push(`  • ${g}`)
    }
    if (guidance.shapingGuidance.length > 0) {
        lines.push('- What shapes the decisions inside it:')
        for (const g of guidance.shapingGuidance) lines.push(`  • ${g}`)
    }
    if (guidance.consequenceGuidance.length > 0 && input.constraintPackage.consequence) {
        lines.push('- What makes success and failure matter:')
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
export function slotProgressionEmphasisFor(
    index: 1 | 2 | 3,
    emphasis: SessionEmphasis | undefined
): string {
    // Note the function is retained as slotProgressionEmphasisFor for backward compatibility
    // with the slot field name; the framework it now describes is emphasis-aware parallel
    // realization, not progression. Renaming the field is a separate sweep.
    const spec = getSlotVariationSpec(emphasis, index)
    const realizationLetter = index === 1 ? 'A' : index === 2 ? 'B' : 'C'
    const holdSummary = spec.holdAxes.length > 0
        ? `Hold these axes stable across the three activities: ${spec.holdAxes.join(', ')}.`
        : 'Differentiation across all primary environmental axes is permitted under this emphasis.'

    // NOTE: the slot's internal `spec.label` is intentionally NOT included in this AI-facing
    // text. Earlier iterations exposed labels like "shared-configuration" / "micro-vary-
    // working-area" to the AI, which then used them as title seeds ("Core Configuration",
    // "Spatial Shift"). Labels are internal index strings; the directive carries the actual
    // instruction.
    return [
        `Activity ${index} of 3 — alternative realization ${realizationLetter} of the session emphasis.`,
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

/**
 * Does this mechanic describe how points are AWARDED, or how the game is PLAYED?
 *
 * Both kinds used to be required in the rules block AND the scoring block, identically. The model
 * did exactly as instructed and satisfied each mechanic twice, which is why generated activities
 * repeated themselves — measured at 5.3 sentences appearing verbatim in both sections.
/**
 * CAUTION: the word boundaries below must be the two characters backslash + b. They were once
 * written through a Python heredoc that interpreted \b as a literal BACKSPACE byte (0x08), so this
 * regex read as /<BS>scor(e|es|ed|ing)<BS>|<BS>points?<BS>|.../ and matched nothing whatsoever.
 *
 * It failed silently and expensively. Every mechanic routed to Rules, because !isScoringMechanic was
 * true for all of them, and Scoring kept only the hardcoded per-archetype template. That is the
 * mechanical cause of two things Christian reported as separate design problems: scoring statements
 * appearing inside Rules, and every Scoring section collapsing to "A point or live advantage counts".
 */
function isScoringMechanic(mechanic: string): boolean {
    return /\b(?:scor(?:e|es|ed|ing)|points?|counts?|awarded|bonus)\b|advantage counts/i.test(mechanic)
}

// A routing predicate that silently matches NOTHING is indistinguishable from one with nothing to
// route, which is why this went a week unnoticed. Prove at load time that it still recognises the
// plainest scoring sentence there is.
if (!isScoringMechanic('Bonus points are awarded when the team scores.')) {
    throw new Error('isScoringMechanic no longer matches scoring language - check for control characters in the pattern.')
}

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
        //
        // Modifier lines are appended to requiredRuleMechanics / requiredScoringMechanics
        // WITHOUT a bracketed prefix — the modifier text itself is coach-facing language
        // and flows through buildActivityMechanicsFromSkeleton into activity.rules /
        // activity.scoring directly. The polish prompt's explicit slotMechanicalVariations
        // block (see formatActivitySkeletonForPrompt below) is what tells the AI which
        // lines are modifiers; no internal scaffolding tag is needed in the data.
        const slotModifiers = getSlotMechanicalVariations(sessionEmphasis, idx)
        const ruleModifierLines = slotModifiers.filter((m) => m.placement === 'rule').map((m) => m.mechanicLine)
        const scoringModifierLines = slotModifiers
            .filter((m) => m.placement === 'scoring')
            .map((m) => m.mechanicLine)

        // Each mechanic belongs to ONE section — see isScoringMechanic. Previously both blocks
        // carried the identical affordance and constraint arrays, which instructed the model to say
        // the same thing twice.
        const combinedRulesForSlot: string[] = [
            ...archRulesScoring.rules,
            ...slotAffMechanics.filter((m) => !isScoringMechanic(m)).map((m) => `[Affordance] ${m}`),
            ...constraintMechanics.filter((m) => !isScoringMechanic(m)).map((m) => `[Constraint] ${m}`),
            ...ruleModifierLines,
        ]
        const combinedScoringForSlot: string[] = [
            ...archRulesScoring.scoring,
            ...slotAffMechanics.filter(isScoringMechanic).map((m) => `[Affordance] ${m}`),
            ...constraintMechanics.filter(isScoringMechanic).map((m) => `[Constraint] ${m}`),
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

    return {
        activities: slots,
        sessionEmphasis,
        // Realization only. Every selection decision above is already fixed, which is what makes
        // IC-001's "MUST NOT change the Learning Goal / Practice Situation" true by construction.
        learningStageDirective: learningStageDirective(input.coachInput.learningStage),
        practiceSituationDirective: practiceSituationDirective(input.coachInput.practiceSituation),
        experienceDesignDirective: experienceDesignDirective(input),
    }
}


/**
 * The internal object names present in the current package, so the prompt can forbid them by name.
 *
 * Read from the registry rather than listed, for the same reason the coach-language detector is:
 * a constraint renamed in the workbook is forbidden under its new name with no code change.
 */
function libraryNamesInPackage(): string[] {
    return [
        ...testLibraryRegistry.selectableConstraints().map((c) => String(c.title ?? '')),
        ...testLibraryRegistry.archetypes().map((a) => String(a.game_form_name ?? '')),
    ].filter((name) => name.length > 3)
}

export function formatActivitySkeletonForPrompt(bundle: ActivitySkeletonBundle): string {
    // NAMES THE MODEL MUST NOT ECHO.
    //
    // The scaffolding below necessarily contains our internal object names — the validator matches
    // against those requirement lines, so they cannot simply be removed. The model then borrowed
    // them for titles ("Directional Possession with Interception Reward"), which is how the last
    // name leak survived after the deterministic ones were fixed.
    //
    // Naming the exact forbidden strings works where a general instruction does not: the model is
    // reliable at "do not output this literal phrase" and unreliable at "avoid internal jargon",
    // because it has no way to know which of our phrases are internal.
    const forbiddenNames = [...new Set(libraryNamesInPackage())].filter(Boolean)

    const lines: string[] = [
        'SYSTEM-OWNED ACTIVITY SKELETON (mandatory — do not invent a different structure):',
        ...(forbiddenNames.length > 0
            ? [
                  `NEVER write these names in any coach-facing text, including titles: ${forbiddenNames.join(' / ')}.`,
                  'They are internal labels. Describe what the condition DOES to the game instead.',
              ]
            : []),
        'You are filling coach-facing wording for this skeleton only.',
        'Do not omit any required mechanics listed below.',
        'Every required mechanic must be satisfied inside objective, rules, scoring, constraints, and/or coachingFocus with clear natural language.',
        'Do not remove meaning; paraphrase is allowed.',
        '',
    ]

    // Stakes last of the three: the context frames the activity, the stage shapes how it is realized,
    // and the intervention sharpens what is already there. Reversing that lets the intervention read
    // as the point of the activity rather than an amplifier of it.
    // Context first, then how it is realized for these players — the order a coach would describe it.
    if (bundle.practiceSituationDirective.length > 0) {
        lines.push(...bundle.practiceSituationDirective)
        lines.push('')
    }

    if (bundle.learningStageDirective.length > 0) {
        lines.push(...bundle.learningStageDirective)
        lines.push('')
    }

    if (bundle.experienceDesignDirective.length > 0) {
        lines.push(...bundle.experienceDesignDirective)
        lines.push('')
    }

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
    lines.push('EMPHASIS-AWARE BANDWIDTH:')
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
                // Modifier label deliberately omitted from the AI brief — earlier iterations
                // saw labels like "narrow spatial-value shift" used as title seeds. The
                // placement and mechanicLine carry everything the AI needs.
                lines.push(`  - [${m.placement}] ${m.mechanicLine}`)
            }
        } else {
            lines.push('slotMechanicalVariations (this activity): none — this activity carries the shared value structure that the other two slots will re-weight from.')
        }
        lines.push('requiredRuleMechanics (this activity):')
        for (const r of slot.requiredRuleMechanics) lines.push(`  - ${r}`)
        lines.push('requiredScoringMechanics (this activity):')
        for (const r of slot.requiredScoringMechanics) lines.push(`  - ${r}`)
        lines.push('')
    }

    return lines.join('\n')
}
