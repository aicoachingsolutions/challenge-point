import type { IAffordance } from '../../models/affordance.model'
import type { ConstraintSelectionCandidate, SystemAssemblyInput } from '../types'
import { TEST_LIBRARY_V0_ARCHETYPES } from '../test-library/archetypes'
import { TEST_LIBRARY_V0_CONSTRAINTS } from '../test-library/constraints'
import type { TestLibraryV0Archetype } from '../test-library/types'
import { registryIdString } from './assembly-package-ids'

/** One of three system-owned activity slots; AI fills wording but must not remove these mechanics. */
export type ActivitySkeletonSlot = {
    /** 1-based activity index */
    activityIndex: 1 | 2 | 3
    /** Archetype name for soft-matching when long archetype bullet text is paraphrased. */
    archetypeName: string
    titleFrame: string
    setupFrame: string
    /** Session progression role for this slot: 1=establish, 2=apply pressure, 3=full contest. Tells AI how this activity differs from the other two. */
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
}

export type ActivitySkeletonBundle = {
    activities: ActivitySkeletonSlot[]
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

function affordanceMechanics(title: string): string[] {
    switch (title) {
        case 'Possession Stability Opportunity':
            return [
                'Rules and scoring must require maintaining or securing possession under pressure; success cannot ignore retention under opponent pressure.',
            ]
        case 'Space Creation Opportunity':
            return [
                'Rules and scoring must require creating or opening space for a teammate; the game must reward or hinge on stretching or unbalancing defenders.',
            ]
        case 'Space Exploitation Opportunity':
            return [
                'Rules and scoring must require using open space to gain advantage; success must connect to attacking or progressing into available space before pressure recovers.',
            ]
        case 'Line-Breaking Opportunity':
            return [
                'Rules and scoring must require breaking or bypassing a defensive line; the game must reward or punish outcomes tied to line-breaking attempts.',
            ]
        case 'Regain Opportunity':
            return [
                'Rules and scoring must reward winning the ball back or forcing a turnover; regain moments must change who attacks and who defends.',
            ]
        case 'Transition Attack Opportunity':
            return [
                'Rules and scoring must structurally reward quick attacking action immediately after winning possession; the transition window must be live and the advantage must dissipate when defensive shape recovers.',
            ]
        case 'Finishing Opportunity':
            return [
                'Rules and scoring must create live finishing situations under defensive contest; success must reward genuine chance creation and conversion — chances that survive live defender pressure and goalkeeper presence — not raw shot counts.',
            ]
        case 'Delay or Deny Opportunity':
            return [
                'Rules and scoring must reward defensive actions that slow attacking progression or deny forward options; success must include outcomes where attacks are forced backward, wide, or into recovered pressure — not just turnovers.',
            ]
        case 'Space Protection Opportunity':
            return [
                'Rules and scoring must require defending teams to protect critical space; success must include outcomes where attacks are forced away from protected areas, with defensive shape and compactness shaping what the attack can access.',
            ]
        case 'Recovery Opportunity':
            return [
                'Rules and scoring must reward defensive recovery after disruption — tracking runs back, restoring shape, and reorganizing under transition pressure; success must depend on whether the defense restores shape before the attack converts.',
            ]
        default:
            return [
                `Rules and scoring must structurally require players to engage with "${title}" — not as a coaching label only.`,
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
        return ['Spacing, width, and depth must shape how the next action is chosen and executed.']
    }
    if (/transition|regain|recover|attack quickly|fast/.test(searchSpace)) {
        return ['The game must make the next action immediate after regain or loss while the picture is still changing.']
    }
    if (/retain|possession|stable|support/.test(searchSpace)) {
        return ['Possession security, support distance, and safe exits under pressure must shape the next action.']
    }
    if (/protect|delay|deny|recover shape|defensive/.test(searchSpace)) {
        return ['Shielding, protection of space, or defensive body position must shape the response to pressure.']
    }
    if (/finish|goal|shot|target/.test(searchSpace)) {
        return ['Shot, target access, or final completion pressure must shape whether the attack is ready now.']
    }
    if (/break|line|progress|penetrate/.test(searchSpace)) {
        return ['Forward penetration or line breaking must shape whether the team attacks through, around, or away from pressure.']
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
                    'Two-sided exchange rule must describe opportunity, opponent response, and live continuation.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring or live advantage must reward progression toward the directional target.',
                    'Scoring must reflect maintaining possession under pressure when that is the contest.',
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
                    'Two-sided exchange rule must describe overload opportunity and opponent counter-threat.',
                    ...overlay.ruleSupport,
                ],
                scoring: [core[3], 'Points or advantages tied to successful overload entry or exploitation.', ...overlay.scoringSupport],
            }
        case 'Pressing & Regain Games':
            return {
                rules: [core[0], core[1], core[2], 'Rules must chain regain to immediate next-phase play.', ...overlay.ruleSupport],
                scoring: [core[3], 'Scoring or advantage shifts on turnover or regain.', ...overlay.scoringSupport],
            }
        case 'End Zone Games':
            return {
                rules: [core[0], core[1], core[2], 'Rules define how teams contest entry into the target zone.', ...overlay.ruleSupport],
                scoring: [core[3], 'Goals or bonuses tied to end-zone entry or use.', ...overlay.scoringSupport],
            }
        case 'Positional Play Games':
            return {
                rules: [
                    core[0],
                    core[2],
                    'Two-sided exchange rule must describe positional advantage gained and opponent ability to recover or disrupt the structure.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring or live advantage must reward positional advantage — numerical superiority or a free player in a zone — exploited before defensive coverage recovers.',
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
                    'Rules must chain the transition moment to immediate attacking action — the advantage exists only before defensive shape is restored.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring or live advantage must reward exploitation of transition space — attacking before the defensive shape recovers.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Target Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    'Two-sided exchange rule must describe target connection earned under pressure and opponent contest of that connection.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring or live advantage must reward successful target connection under live pressure and continuation from that connection.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Channel Games':
            return {
                rules: [
                    core[0],
                    core[1],
                    'Two-sided exchange rule must describe channel entry earned and opponent coverage shift to close or switch the open lane.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring or live advantage must reward channel exploitation — attacking the defensive imbalance through the open lane before coverage recovers.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Finishing Games':
            return {
                rules: [
                    core[0],
                    core[2],
                    'Rules must establish live finishing situations — defenders contest every attempt and counter-attack from clearances is immediate.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring must be tied to genuine finishing chances created and converted under live defensive pressure.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        case 'Constraint-Driven Free Play':
            return {
                rules: [
                    core[0],
                    core[1],
                    'Rules are defined by the selected constraints — all other play is free within the genuinely contested live game.',
                    ...overlay.ruleSupport,
                ],
                scoring: [
                    'Scoring reflects the selected constraint outcomes — both teams earn advantages and face live risks from the constraint game.',
                    core[3],
                    ...overlay.scoringSupport,
                ],
            }
        default:
            return {
                rules: ['Rules encode opposition, environment, and live continuation.', core[0], ...overlay.ruleSupport],
                scoring: ['Scoring states advantage for both teams and ties to the archetype contest.', ...overlay.scoringSupport],
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

function titleFrameForSlot(archetypeName: string, index: 1 | 2 | 3): string {
    const themes = [
        `Establishing variant of the ${archetypeName} game form — Activity 1 introduces the central problem. Title should signal this is the entry-level expression of the session goal.`,
        `Pressure variant of the ${archetypeName} game form — Activity 2 dials up the shaping pressure with the same constraint package. Title should signal sharper behavioral demand, not a different game.`,
        `Full-contest variant of the ${archetypeName} game form — Activity 3 is the most complex. Title should signal the maximum challenge and the full constraint contest.`,
    ]
    return `${themes[index - 1]} Title must stay distinct from the other two activities and reflect this slot's session role.`
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

function setupFrameForSlot(input: SystemAssemblyInput, index: 1 | 2 | 3): string {
    const overlay = archetypeLibraryOverlay(input.archetype.name)
    const guidance = collectSetupGuidance(input)
    const fieldLength = input.session.fieldLength
    const fieldWidth = input.session.fieldWidth
    const fieldType = input.session.fieldType ?? 'surface'
    const fieldSpec = fieldLength && fieldWidth ? `${fieldLength}x${fieldWidth} ${fieldType}` : `${fieldType} (dimensions not specified — choose appropriate size for player count)`
    const playerCount = input.session.playerCount ? Number(input.session.playerCount) : null
    const playerSpec = playerCount && playerCount > 0 ? `${playerCount} players total` : 'team count appropriate to the constraint package'

    const slotSpecific =
        index === 1
            ? 'Setup describes the entry-level picture: standard space and numbers for the archetype with the foundation constraint clearly visible in the environment. This is the least complex of the three setups.'
            : index === 2
              ? 'Setup tightens the picture relative to Activity 1: slightly reduced space, tighter numbers, or a sharper shaping element to dial up the behavioral pressure. Same constraint package, sharper expression.'
              : 'Setup describes the full contest: the most demanding space and numbers configuration of the three activities, with all constraints (foundation, shaping, and consequence if present) clearly visible in the environment.'

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

function slotProgressionEmphasisFor(index: 1 | 2 | 3): string {
    switch (index) {
        case 1:
            return 'Activity 1 of 3 — establish: this is the entry-level expression of the session goal. Players read the archetype and primary affordance lens for the first time. Keep the picture clean enough that the central decision problem is unmistakable.'
        case 2:
            return 'Activity 2 of 3 — apply pressure: same archetype and constraint package as Activity 1, but the shaping constraint behavioral demand dominates the decision picture. Add intensity through spacing, support timing, or numbers — not by changing the game.'
        case 3:
            return 'Activity 3 of 3 — full contest: the most demanding and complete activity of the session. All selected affordance lenses must be visibly active in objective, rules, scoring, and coachingFocus. Constraint package operates at full strength.'
    }
}

/**
 * Per-slot affordance subset count. Implements structural slot differentiation (item H from the
 * Phase 1 review): each activity slot now has a genuinely different set of affordance lens
 * obligations rather than every slot being byte-identical with only title/objective varying.
 *
 * - Slot 1 (Establish): primary lens only. The coach sees the core decision problem cleanly,
 *   without secondary lenses muddying the picture.
 * - Slot 2 (Apply Pressure): primary + first supporting lens. A second decision layer is added.
 * - Slot 3 (Full Contest): all selected lenses. Full complexity, all decisions active.
 *
 * The constraint package and archetype mechanics stay the same across slots (those define the
 * game form, which is constant). Only the affordance lens content varies progressively.
 */
function slotAffordanceCountFor(idx: 1 | 2 | 3, total: number): number {
    if (idx === 1) return Math.min(1, total)
    if (idx === 2) return Math.min(2, total)
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

    const slots: ActivitySkeletonSlot[] = ([1, 2, 3] as const).map((idx) => {
        const slotAffordanceCount = slotAffordanceCountFor(idx, affordances.length)
        const slotAffordances = affordances.slice(0, slotAffordanceCount)
        const slotAffMechanics = slotAffordances.flatMap((a) => affordanceMechanicsForLens(a))

        const combinedRulesForSlot: string[] = [
            ...archRulesScoring.rules,
            ...slotAffMechanics.map((m) => `[Affordance] ${m}`),
            ...constraintMechanics.map((m) => `[Constraint] ${m}`),
        ]
        const combinedScoringForSlot: string[] = [
            ...archRulesScoring.scoring,
            ...slotAffMechanics.map((m) => `[Affordance] ${m}`),
            ...constraintMechanics.map((m) => `[Constraint] ${m}`),
        ]

        return {
            activityIndex: idx,
            archetypeName,
            titleFrame: titleFrameForSlot(archetypeName, idx),
            setupFrame: setupFrameForSlot(input, idx),
            slotProgressionEmphasis: slotProgressionEmphasisFor(idx),
            requiredRuleMechanics: combinedRulesForSlot,
            requiredScoringMechanics: combinedScoringForSlot,
            requiredAffordanceMechanics: [...slotAffMechanics],
            requiredConstraintMechanics: [...constraintMechanics],
            coachFacingConstraints,
            requiredArchetypeMechanics,
            requiredDecisionLanguage: [...DECISION_STEMS],
        }
    })

    return { activities: slots }
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

    for (const slot of bundle.activities) {
        lines.push(`--- Activity ${slot.activityIndex} ---`)
        lines.push(`slotProgressionEmphasis: ${slot.slotProgressionEmphasis}`)
        lines.push(`titleFrame: ${slot.titleFrame}`)
        lines.push(`setupFrame: ${slot.setupFrame}`)
        lines.push('requiredAffordanceMechanics (this slot — fewer lenses for slot 1, all lenses for slot 3):')
        for (const r of slot.requiredAffordanceMechanics) lines.push(`  - ${r}`)
        lines.push('requiredRuleMechanics (this slot):')
        for (const r of slot.requiredRuleMechanics) lines.push(`  - ${r}`)
        lines.push('requiredScoringMechanics (this slot):')
        for (const r of slot.requiredScoringMechanics) lines.push(`  - ${r}`)
        lines.push('')
    }

    return lines.join('\n')
}
