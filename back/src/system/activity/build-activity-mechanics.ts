import type { ActivitySkeletonBundle, ActivitySkeletonSlot } from './build-activity-skeleton'

export type ActivityMechanics = {
    rules: string[]
    scoring: string[]
    constraints: string[]
    decisionCues: string[]
    opponentConsequences: string[]
    teams: string
}

export type ActivityMechanicsBundle = {
    activities: ActivityMechanics[]
}

function stripPrefix(line: string): string {
    return line.replace(/^\[(Affordance|Constraint)\]\s*/i, '').trim()
}

function sanitizeMechanicLine(line: string): string {
    return stripPrefix(line)
        .replace(/\bPlayers must decide whether\b/gi, 'Players decide whether')
        .replace(/\bPlayers must face a decision to\b/gi, 'Players decide whether to')
        // Specific case before the general "Players must" rule: "Players must face a decision" → "Players face a decision"
        // (Without this, the general rule turns it into the broken "Players decide to face a decision".)
        .replace(/\bPlayers must face a decision\b/gi, 'Players face a decision')
        .replace(/\bplayers must face a decision\b/gi, 'players face a decision')
        .replace(/\bPlayers must\b/gi, 'Players decide to')
        .replace(/\bplayers must decide whether\b/gi, 'players decide whether')
        .replace(/\bplayers must\b/gi, 'players decide to')
        .trim()
}

/**
 * Scaffolding-line prefixes that identify AI-instruction text not intended for coach-facing fields.
 * These lines are built into the requiredX mechanic arrays so the AI receives them as obligations,
 * but they should not flow through to activity.rules / activity.scoring / activity.coachingFocus
 * because coaches see those fields directly.
 *
 * Priority 1 originally addressed this for activity.constraints[] by introducing coachFacingConstraints.
 * The same cleanup pattern is now applied to rules and scoring by filtering on this denylist.
 */
const SCAFFOLDING_LINE_PREFIXES = [
    'Archetype identity:',
    'Archetype interaction structure:',
    'Archetype constraint pattern support:',
    'Archetype objective emphasis:',
    'Archetype player structure logic:',
    'Archetype incentive pattern support:',
    'Coaching emphasis:',
    'Constraint-support pattern:',
    'Scoring-support pattern:',
    'Affordance lens "',
    'Affordance tag emphasis for "',
    'Affordance decision cue for "',
    'Affordance consequence pattern for "',
    'Affordance constraint support for "',
    'Selected foundation constraint "',
    'Selected shaping constraint "',
    'Selected consequence constraint "',
    'Assembly guardrail —',
    'Interaction exchange —',
    'Opponent consequence:',
    'Opponent consequence emphasis',
    'Two-sided exchange rule',
    'Rules must',
    'Rules and scoring must',
    'Scoring or live advantage must',
    'Scoring must',
    '[Affordance]',
    '[Constraint]',
] as const

function isCoachFacingMechanicLine(line: string): boolean {
    const trimmed = line.trim()
    if (!trimmed) return false
    return !SCAFFOLDING_LINE_PREFIXES.some((p) => trimmed.startsWith(p))
}

/**
 * Strip the internal "Opponent consequence:" / "Opponent consequence emphasis (reflect in scoring or rules):"
 * / "Interaction exchange — outcomes:" prefixes from opponent-consequence lines so the residual text reads
 * as coach-facing. If the residual is empty or still looks like scaffolding, returns ''.
 */
function cleanOpponentConsequenceLine(line: string): string {
    const trimmed = line.trim()
    const cleaned = trimmed
        .replace(/^Opponent consequence emphasis \(reflect in scoring or rules\):\s*/i, '')
        .replace(/^Opponent consequence emphasis:\s*/i, '')
        .replace(/^Opponent consequence:\s*/i, '')
        .replace(/^Interaction exchange — outcomes:\s*/i, '')
        .trim()
    if (!cleaned) return ''
    // If the stripped content still begins with a scaffolding marker, drop it entirely.
    if (cleaned.startsWith('reward or advantage when ') || cleaned.startsWith('Affordance')) return ''
    return cleaned
}

function uniqueLines(lines: string[]): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const line of lines.map((x) => x.trim()).filter(Boolean)) {
        const key = line.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(line)
    }
    return out
}

function extractAfterPrefix(lines: string[], prefix: string): string | null {
    const match = lines.find((line) => line.startsWith(prefix))
    if (!match) return null
    return match.slice(prefix.length).trim()
}

function buildTeamsFromSlot(slot: ActivitySkeletonSlot): string {
    const playerStructure = extractAfterPrefix(slot.requiredArchetypeMechanics, 'Archetype player structure logic: ')
    switch (slot.archetypeName) {
        case 'Directional Possession Games':
            return uniqueLines([
                'Two teams compete in the same direction, with one team trying to keep and progress possession toward the target while the other applies pressure and tries to regain to attack back.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Overload Games':
            return uniqueLines([
                'Two teams compete with one side using a numerical or positional overload against live defenders, and roles switch immediately when possession changes.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Pressing & Regain Games':
            return uniqueLines([
                'Two teams compete with live pressure, one side trying to regain and the other trying to secure or escape, with immediate transition when the ball changes hands.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'End Zone Games':
            return uniqueLines([
                'Two teams compete to progress into a target zone while the opponent blocks, delays, and counters on regains.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Positional Play Games':
            return uniqueLines([
                'Two teams compete in a structured positional game; one team maintains positional shape and creates advantages through spacing and relationships while the other disrupts structure, fills spaces, and blocks lines of progression.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Transition Games':
            return uniqueLines([
                'Two teams compete with the transition moment as the live contest; when possession changes, the team gaining the ball immediately becomes the attacker exploiting disorganized space, while the other team decides whether to press immediately or recover defensive shape.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Target Games':
            return uniqueLines([
                'Two teams compete with a target player or target area as the forward focal point; one team works to connect to the target under pressure while the other contests the connection, covers the target, and attacks immediately from regains.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Channel Games':
            return uniqueLines([
                'Two teams compete across defined spatial channels; the attacking team reads which channel is open based on defensive coverage and attacks through it, while the defending team organizes channel coverage and counter-attacks from regains.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Finishing Games':
            return uniqueLines([
                'Two teams compete in final third attacking and defending; the attacking team creates and converts scoring chances under live defensive pressure while the defending team contests finishing opportunities and counter-attacks immediately from clearances.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Constraint-Driven Free Play':
            return uniqueLines([
                'Two teams compete in a free live game shaped by the selected constraints; both teams make open decisions within the constraint structure while maintaining a genuine two-sided contest of possession, pressure, and counter-attack.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        default:
            return uniqueLines([
                `Two teams compete in a live, opposed game that clearly reflects ${slot.archetypeName}.`,
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
    }
}

/**
 * Archetype-specific "read / react" decision-cue pairs. Each archetype names the live picture players
 * actually read in that game form. Replaces two hardcoded possession-leaning cues that previously
 * appeared in every activity regardless of archetype.
 */
const ARCHETYPE_DECISION_CUE_PAIRS: Record<string, readonly [string, string]> = {
    'End Zone Games': [
        'Players read defensive coverage between the ball and the target zone, deciding whether to penetrate directly, support behind the ball, or recycle to find a better angle.',
        'Players react to the moment the target zone becomes contested — choose to attack now, draw defenders, or switch the entry route.',
    ],
    'Directional Possession Games': [
        'Players read pressure and decide whether to secure possession, progress forward, or switch play based on the live picture.',
        'Players react to space, support, and opponent recovery before the next action.',
    ],
    'Positional Play Games': [
        'Players read the positional structure — numerical advantage, free player, or open lane — and decide whether to play forward or maintain structure to build a better advantage.',
        'Players react to defensive coverage shifts, choosing the moment when a positional advantage is genuinely exploitable before the structure recovers.',
    ],
    'Transition Games': [
        'Players read the moment of possession change and decide whether to attack the transition space immediately or hold while the picture clarifies.',
        'Players react to opponent recovery speed — choose to commit forward, support the attack, or recover defensive shape based on whether shape has been restored.',
    ],
    'Overload Games': [
        'Players read whether the overload is live and decide whether to exploit it now, hold to draw defenders, or reset to rebuild the advantage.',
        'Players react to defensive adjustments and choose when the numerical or positional edge is genuinely actionable.',
    ],
    'Target Games': [
        'Players read whether the target is genuinely available — accounting for defensive cover, support angles, and pressure — and decide when to play the target ball.',
        'Players react to the target connection: continue forward, lay back to support, or rebuild the picture if the connection is contested.',
    ],
    'Channel Games': [
        'Players read which channel is genuinely open based on defensive coverage and decide when to commit to attacking through it.',
        'Players react to coverage shifts — when the defense closes one channel, recognize and attack the channel that has opened.',
    ],
    'Pressing & Regain Games': [
        'Players read the press triggers — opponent body shape, support cover, distance to ball — and decide when to commit to pressure.',
        'Players react to the regain moment: attack the disorganized opponent immediately or recover shape if the press window has closed.',
    ],
    'Finishing Games': [
        'Players read goalkeeper position, defensive cover, and angle of approach before deciding to shoot, cut inside, or hold for a better chance.',
        'Players react to defensive recovery on each attempt — finish under pressure, lay off to a supporting finisher, or rebuild the chance.',
    ],
    'Constraint-Driven Free Play': [
        'Players read the live picture shaped by the selected constraints and decide which constraint outcome is genuinely available right now.',
        'Players react to the opponent response to the constraint — adapt timing and route to the constraint problem on each possession.',
    ],
}

function archetypeDecisionCues(archetypeName: string): readonly [string, string] {
    return (
        ARCHETYPE_DECISION_CUE_PAIRS[archetypeName] ?? [
            'Players read the live game picture — pressure, space, support — and decide the next action based on what is genuinely available.',
            'Players react to the opponent response and adapt their next decision based on the changing picture.',
        ]
    )
}

function buildDecisionCues(slot: ActivitySkeletonSlot): string[] {
    const archetypeObjective = extractAfterPrefix(slot.requiredArchetypeMechanics, 'Archetype objective emphasis: ')
    const coachingEmphasis = extractAfterPrefix(slot.requiredArchetypeMechanics, 'Coaching emphasis: ')
    const [primaryCue, secondaryCue] = archetypeDecisionCues(slot.archetypeName)
    // Drop the "Coaching emphasis:" prefix when surfacing in coach-facing fields — the raw
    // archetype overlay text reads naturally without the meta-label.
    const cleanCoachingEmphasis = coachingEmphasis ? coachingEmphasis.trim() : ''
    const cues = [
        archetypeObjective ? `Session focus: ${archetypeObjective}` : '',
        primaryCue,
        secondaryCue,
        cleanCoachingEmphasis,
    ]
    // Pull constraint/affordance decision-focus lines that have specific coach-readable patterns.
    // These are the curated "players prioritize..." and "players should recognize..." lines —
    // not the verbose lens/constraint dumps. Pass through sanitization then filter scaffolding.
    const constraintDecisionFocus = slot.requiredConstraintMechanics.filter((line) =>
        /players prioritize .* in decisions\./i.test(line)
    )
    cues.push(...constraintDecisionFocus.map(sanitizeMechanicLine).filter(isCoachFacingMechanicLine))
    const affordanceDecisionFocus = slot.requiredAffordanceMechanics.filter((line) =>
        /players should recognize .* before choosing the next action\./i.test(line)
    )
    // These start with "Affordance decision cue for "X":" — strip that prefix to keep just the cue.
    cues.push(
        ...affordanceDecisionFocus
            .map(sanitizeMechanicLine)
            .map((line) => line.replace(/^Affordance decision cue for "[^"]+":\s*/i, ''))
            .filter(Boolean)
    )
    return uniqueLines(cues.filter(Boolean))
}

function buildExplicitExchangeRule(slot: ActivitySkeletonSlot): string {
    const liveRule = extractAfterPrefix(slot.requiredConstraintMechanics, 'Interaction exchange — live rule and cues: ')
    if (liveRule) {
        const trimmed = liveRule.split(' Visible opportunity cue:')[0]?.trim()
        if (trimmed) return sanitizeMechanicLine(trimmed)
    }

    switch (slot.archetypeName) {
        case 'Pressing & Regain Games':
            return 'If a team regains under pressure, then they attack immediately while the counter window is live; but if they force the next action into recovered pressure, then the opponent attacks immediately from the regain or turnover.'
        case 'Overload Games':
            return 'If the attacking team uses the overload to move the defense, then play continues toward advantage; but if the overload is forced or read too slowly, then the opponent regains and attacks into the exposed space.'
        case 'End Zone Games':
            return 'If a team reaches the target zone under pressure, then play continues with advantage; but if the entry is forced or lost, then the opponent attacks immediately the other way.'
        case 'Positional Play Games':
            return 'If a team creates a positional advantage and plays forward before the structure is recovered, then play continues with forward momentum; but if the ball is played into a covered zone or forced without positional advantage, then the opponent regains and exploits the disorganized shape immediately.'
        case 'Transition Games':
            return 'If a team wins possession and attacks the transition space before the opponent recovers defensive shape, then the advantage is live and play continues forward; but if the attack stalls or the opponent recovers shape, then the game resets and the next transition moment defines who attacks.'
        case 'Target Games':
            return 'If a team connects to the target under live defensive pressure, then play continues forward from the target with advantage; but if the connection is blocked or turned over, then the opponent attacks immediately from the regain.'
        case 'Channel Games':
            return 'If a team identifies and attacks an open channel before defensive coverage shifts to close it, then the forward advantage is live and play continues through the channel; but if the channel entry is forced into coverage or lost, then the opponent attacks through the opposite open channel.'
        case 'Finishing Games':
            return 'If a team creates a genuine scoring chance under live defensive pressure, then the finishing attempt is live and play continues from the result; but if the chance is forced or rushed without advantage, then the defending team regains and counter-attacks immediately from the clearance.'
        case 'Constraint-Driven Free Play':
            return 'If a team solves the selected constraint problem in the live game, then play continues with the earned advantage from that constraint outcome; but if the constraint condition is missed or forced, then the opponent earns possession or the restart advantage immediately.'
        default:
            return 'If a team keeps possession and progresses toward the target under pressure, then the next action stays live; but if the ball is forced into pressure and lost, then the opponent attacks immediately from the regain.'
    }
}

function buildOpponentConsequenceLines(slot: ActivitySkeletonSlot): string[] {
    const lines = slot.requiredConstraintMechanics.filter(
        (line) =>
            line.startsWith('Opponent consequence:') ||
            line.startsWith('Opponent consequence emphasis') ||
            line.startsWith('Interaction exchange — outcomes:')
    )
    const affordanceConsequenceLines = slot.requiredAffordanceMechanics
        .filter((line) => line.startsWith('Affordance consequence pattern'))
        // strip the scaffolding prefix so the residual text reads as coach-facing
        .map((line) => line.replace(/^Affordance consequence pattern for "[^"]+":\s*/i, ''))

    if (lines.length > 0 || affordanceConsequenceLines.length > 0) {
        return uniqueLines([...lines, ...affordanceConsequenceLines].map(sanitizeMechanicLine))
    }

    return [
        'If the live opportunity is forced after it closes, the opponent inherits the connected advantage immediately.',
    ]
}

function buildScoringLines(slot: ActivitySkeletonSlot, opponentConsequences: string[]): string[] {
    // Coach-facing scoring: drop AI-instruction lines (affordance lens descriptions, selected
    // constraint dumps, assembly guardrails, interaction exchange metadata, etc.) and only keep
    // natural-language scoring rules. The full requiredScoringMechanics is still used for the
    // AI prompt; this filter only affects what flows into activity.scoring.
    const scoringBase = slot.requiredScoringMechanics
        .map(sanitizeMechanicLine)
        .filter(isCoachFacingMechanicLine)
    const scoringSupport = slot.requiredArchetypeMechanics
        .filter((line) => line.startsWith('Archetype incentive pattern support:'))
        .map((line) => sanitizeMechanicLine(line).replace(/^Archetype incentive pattern support:\s*/i, ''))
        .filter(Boolean)
    const firstLineMap: Record<string, string> = {
        'Directional Possession Games':
            'A point or live advantage counts only when possession is maintained under pressure and the ball is progressed toward the target before the picture closes.',
        'Overload Games':
            'A point or live advantage counts only when the overload is used to create or exploit the free side before the defense resets.',
        'Pressing & Regain Games':
            'A point or live advantage counts only when the regain creates an immediate attacking chance before the opponent recovers pressure.',
        'End Zone Games':
            'A point counts only when the team progresses into the target zone under live opposition and keeps the next action alive.',
        'Positional Play Games':
            'A point or live advantage counts only when a positional advantage — numerical superiority, a free player in a zone, or a clear line of progression — is used before defensive structure recovers.',
        'Transition Games':
            'A point or live advantage counts only when the team attacks the transition space immediately after winning possession — before the defensive shape is restored.',
        'Target Games':
            'A point or live advantage counts only when the team connects to the target under live defensive pressure and continues the attack from that connection.',
        'Channel Games':
            'A point or live advantage counts only when the team exploits an open channel — attacking the defensive imbalance before coverage shifts to close the lane.',
        'Finishing Games':
            'A goal or live advantage counts only when the team creates a genuine scoring chance under live defensive pressure and converts it.',
        'Constraint-Driven Free Play':
            'A point or live advantage counts only when the selected constraint problem is solved in a genuinely contested two-sided live game.',
    }
    const firstLine =
        firstLineMap[slot.archetypeName] ??
        'A point or live advantage counts only when the selected game problem is solved under pressure and opposition.'

    const cleanConsequences = opponentConsequences.map(cleanOpponentConsequenceLine).filter(Boolean)
    return uniqueLines([firstLine, ...scoringBase, ...scoringSupport, ...cleanConsequences])
}

function buildConstraintLines(slot: ActivitySkeletonSlot): string[] {
    return uniqueLines(slot.coachFacingConstraints)
}

function buildRuleLines(slot: ActivitySkeletonSlot, explicitExchangeRule: string): string[] {
    // Coach-facing rules: drop AI-instruction lines. The full requiredRuleMechanics array is still
    // used in the AI prompt brief (ruleSummaries) but coaches see only natural-language rules.
    // Previously this returned all of requiredRuleMechanics plus the scaffolding-prefixed
    // archetypeAnchor and archetypeRuleSupport lines, producing 30+ rules per activity (most
    // unreadable scaffolding text). Now: exchange rule + game-form anchor + filtered base only.
    const ruleBase = slot.requiredRuleMechanics
        .map(sanitizeMechanicLine)
        .filter(isCoachFacingMechanicLine)
    const gameFormAnchor = `Game form: ${slot.archetypeName}.`
    return uniqueLines([explicitExchangeRule, gameFormAnchor, ...ruleBase])
}

function buildMechanicsForSlot(slot: ActivitySkeletonSlot): ActivityMechanics {
    const opponentConsequences = buildOpponentConsequenceLines(slot)
    const rules = buildRuleLines(slot, buildExplicitExchangeRule(slot))
    const scoring = buildScoringLines(slot, opponentConsequences)
    const constraints = buildConstraintLines(slot)
    const decisionCues = buildDecisionCues(slot)

    return {
        rules,
        scoring,
        constraints,
        decisionCues,
        opponentConsequences,
        teams: buildTeamsFromSlot(slot),
    }
}

export function buildActivityMechanicsFromSkeleton(skeleton: ActivitySkeletonBundle): ActivityMechanicsBundle {
    return {
        activities: skeleton.activities.map(buildMechanicsForSlot),
    }
}
