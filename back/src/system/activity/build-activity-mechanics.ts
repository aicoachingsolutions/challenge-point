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
        .replace(/\bPlayers must\b/gi, 'Players decide to')
        .replace(/\bplayers must decide whether\b/gi, 'players decide whether')
        .replace(/\bplayers must\b/gi, 'players decide to')
        .trim()
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
        default:
            return uniqueLines([
                `Two teams compete in a live, opposed game that clearly reflects ${slot.archetypeName}.`,
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
    }
}

function buildDecisionCues(slot: ActivitySkeletonSlot): string[] {
    const archetypeObjective = extractAfterPrefix(slot.requiredArchetypeMechanics, 'Archetype objective emphasis: ')
    const coachingEmphasis = extractAfterPrefix(slot.requiredArchetypeMechanics, 'Coaching emphasis: ')
    const cues = [
        archetypeObjective ? `Players solve this activity by pursuing: ${archetypeObjective}` : '',
        'Players read pressure and decide whether to secure, progress, or switch based on the live picture.',
        'Players react to space, support, and opponent recovery before the next action.',
        coachingEmphasis ? `Coaching emphasis: ${coachingEmphasis}` : '',
    ]
    if (slot.archetypeName === 'Overload Games') {
        cues.push('Players decide whether to use the overload immediately or reset the picture and attack again.')
    }
    if (slot.archetypeName === 'Pressing & Regain Games') {
        cues.push('Players decide whether the regain window is live enough to attack quickly or whether pressure requires a safer next action.')
    }
    const constraintDecisionFocus = slot.requiredConstraintMechanics.filter((line) =>
        /players prioritize .* in decisions\./i.test(line)
    )
    cues.push(...constraintDecisionFocus.map(sanitizeMechanicLine))
    const affordanceDecisionFocus = slot.requiredAffordanceMechanics.filter((line) =>
        /players should recognize .* before choosing the next action\./i.test(line)
    )
    cues.push(...affordanceDecisionFocus.map(sanitizeMechanicLine))
    return uniqueLines(cues)
}

function buildExplicitExchangeRule(slot: ActivitySkeletonSlot): string {
    const liveRule = extractAfterPrefix(slot.requiredConstraintMechanics, 'Interaction exchange — live rule and cues: ')
    if (liveRule) {
        const trimmed = liveRule.split(' Visible opportunity cue:')[0]?.trim()
        if (trimmed) return sanitizeMechanicLine(trimmed)
    }

    const archetypeRule =
        slot.archetypeName === 'Pressing & Regain Games'
            ? 'If a team regains under pressure, then they attack immediately while the counter window is live; but if they force the next action into recovered pressure, then the opponent attacks immediately from the regain or turnover.'
            : slot.archetypeName === 'Overload Games'
              ? 'If the attacking team uses the overload to move the defense, then play continues toward advantage; but if the overload is forced or read too slowly, then the opponent regains and attacks into the exposed space.'
              : slot.archetypeName === 'End Zone Games'
                ? 'If a team reaches the target zone under pressure, then play continues with advantage; but if the entry is forced or lost, then the opponent attacks immediately the other way.'
                : 'If a team keeps possession and progresses toward the target under pressure, then the next action stays live; but if the ball is forced into pressure and lost, then the opponent attacks immediately from the regain.'

    return archetypeRule
}

function buildOpponentConsequenceLines(slot: ActivitySkeletonSlot): string[] {
    const lines = slot.requiredConstraintMechanics.filter(
        (line) =>
            line.startsWith('Opponent consequence:') ||
            line.startsWith('Opponent consequence emphasis') ||
            line.startsWith('Interaction exchange — outcomes:')
    )
    const affordanceConsequenceLines = slot.requiredAffordanceMechanics.filter((line) =>
        line.startsWith('Affordance consequence pattern')
    )

    if (lines.length > 0 || affordanceConsequenceLines.length > 0) {
        return uniqueLines([...lines, ...affordanceConsequenceLines].map(sanitizeMechanicLine))
    }

    return [
        'If the live opportunity is forced after it closes, the opponent inherits the connected advantage immediately.',
    ]
}

function buildScoringLines(slot: ActivitySkeletonSlot, opponentConsequences: string[]): string[] {
    const scoringBase = slot.requiredScoringMechanics.map(sanitizeMechanicLine)
    const scoringSupport = slot.requiredArchetypeMechanics
        .filter((line) => line.startsWith('Archetype incentive pattern support:'))
        .map(sanitizeMechanicLine)
    const firstLine =
        slot.archetypeName === 'Directional Possession Games'
            ? 'A point or live advantage counts only when possession is maintained under pressure and the ball is progressed toward the target before the picture closes.'
            : slot.archetypeName === 'Overload Games'
              ? 'A point or live advantage counts only when the overload is used to create or exploit the free side before the defense resets.'
              : slot.archetypeName === 'Pressing & Regain Games'
                ? 'A point or live advantage counts only when the regain creates an immediate attacking chance before the opponent recovers pressure.'
                : slot.archetypeName === 'End Zone Games'
                  ? 'A point counts only when the team progresses into the target zone under live opposition and keeps the next action alive.'
                  : 'A point or live advantage counts only when the selected game problem is solved under pressure and opposition.'

    return uniqueLines([firstLine, ...scoringBase, ...scoringSupport, ...opponentConsequences])
}

function buildConstraintLines(slot: ActivitySkeletonSlot): string[] {
    return uniqueLines(slot.coachFacingConstraints)
}

function buildRuleLines(slot: ActivitySkeletonSlot, explicitExchangeRule: string): string[] {
    const ruleBase = slot.requiredRuleMechanics.map(sanitizeMechanicLine)
    const archetypeRuleSupport = slot.requiredArchetypeMechanics
        .filter(
            (line) =>
                line.startsWith('Archetype interaction structure:') ||
                line.startsWith('Archetype constraint pattern support:')
        )
        .map(sanitizeMechanicLine)
    const archetypeAnchor = `Archetype identity: ${slot.archetypeName}.`
    return uniqueLines([explicitExchangeRule, archetypeAnchor, ...archetypeRuleSupport, ...ruleBase])
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
