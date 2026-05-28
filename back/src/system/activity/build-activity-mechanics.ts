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
 *
 * Note: Affordance lens / tag emphasis / consequence pattern wrappers were initially in this list
 * but caused validateActivitiesAgainstSkeleton to fail (the validator checks that each lens mechanic
 * line is reflected in the bundle; removing those lines stripped the required tokens). They are
 * now handled by unwrapAffordanceWrappers() instead — the wrapper prefix is stripped but the
 * underlying lens content is preserved, satisfying both coach-readability and validation.
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
    'Affordance decision cue for "',
    'Affordance constraint support for "',
    'Selected foundation constraint "',
    'Selected shaping constraint "',
    'Selected consequence constraint "',
    'Assembly guardrail —',
    'Interaction exchange —',
    'Opponent consequence:',
    'Opponent consequence emphasis',
    'Two-sided exchange rule',
    'The activity interaction should follow:',
    'Game structure must clearly embody',
    '[Affordance]',
    '[Constraint]',
] as const

function isCoachFacingMechanicLine(line: string): boolean {
    const trimmed = line.trim()
    if (!trimmed) return false
    return !SCAFFOLDING_LINE_PREFIXES.some((p) => trimmed.startsWith(p))
}

/**
 * Strip affordance-lens wrapper prefixes so the underlying lens content (which is coach-readable
 * design language like "Rules and scoring must require breaking or bypassing a defensive line...")
 * surfaces in rules and scoring. The wrapper itself is internal scaffolding meant for AI brief
 * formatting; the content inside is the actual lens design instruction.
 *
 * Three wrapper shapes handled:
 *   1. 'Affordance lens "X" — reflect lens behaviors in objective, rules, scoring, constraints,
 *       or coachingFocus: <content>'  (the long lens-description form)
 *   2. 'Affordance lens "X": <content>'  (the core lens mechanic form)
 *   3. 'Affordance tag emphasis for "X" (Group): <content>'  (the family-hint form)
 *   4. 'Affordance consequence pattern for "X": <content>'  (the example-consequence form)
 *
 * Affordance decision cue and Affordance constraint support lines are NOT unwrapped here — those
 * belong in decisionCues (not rules/scoring) and are filtered out by isCoachFacingMechanicLine.
 */
function unwrapAffordanceWrappers(line: string): string {
    const s = line.trim()
    // 'Affordance lens "X" — reflect lens behaviors in objective, rules, scoring, constraints, or
    // coachingFocus: <content>' is dropped from coach-facing output. The content is designIntent +
    // description + notes + suggestedConstraintPrompt + gameTemplateAnchor joined without sentence
    // punctuation, producing run-on text that ends with internal template-anchor tags like
    // "build_up" or "build_up|final_third". The lens content is already represented by the lens
    // core mechanic and tag emphasis (also in scoring), so dropping this line removes the awkward
    // run-on without losing coach-facing or validator-required content.
    const reflectMatch = s.match(/^Affordance lens "[^"]+"\s*—\s*reflect lens behaviors in [^:]+:\s*(.*)$/i)
    if (reflectMatch) return ''
    const coreMatch = s.match(/^Affordance lens "[^"]+":\s*(.*)$/i)
    if (coreMatch) return coreMatch[1]!.trim()
    const tagMatch = s.match(/^Affordance tag emphasis for "[^"]+"\s*\([^)]*\):\s*(.*)$/i)
    if (tagMatch) return tagMatch[1]!.trim()
    const consMatch = s.match(/^Affordance consequence pattern for "[^"]+":\s*(.*)$/i)
    if (consMatch) return consMatch[1]!.trim()
    return s
}

/**
 * Strip the internal "Opponent consequence:" / "Opponent consequence emphasis (reflect in scoring or rules):"
 * / "Interaction exchange — outcomes:" prefixes from opponent-consequence lines so the residual text reads
 * as coach-facing. If the residual is empty or still looks like scaffolding, returns ''.
 */
function cleanOpponentConsequenceLine(line: string): string {
    const trimmed = line.trim()
    // "Opponent consequence emphasis" lines are validator signal-token lists (e.g., "opponent gains;
    // restart; regain; counter"). These are AI/validator metadata, not coach-facing scoring text.
    // Drop them entirely instead of trying to surface the keyword list.
    if (/^Opponent consequence emphasis/i.test(trimmed)) {
        return ''
    }
    const cleaned = trimmed
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
                'Two teams compete with the transition moment as the live contest; when possession changes, the team gaining the ball immediately becomes the attacker into disorganized space while immediate pressure and recovery shape are both available to the other team.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Target Games':
            return uniqueLines([
                'Two teams compete with a target player or target area as the forward focal point; one team works to connect to the target under pressure while the other contests the connection, covers the target, and attacks immediately from regains.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Channel Games':
            return uniqueLines([
                'Two teams compete across defined spatial channels; open channels remain available for forward attacks while the defending team organizes channel coverage and counter-attacks from regains.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Finishing Games':
            return uniqueLines([
                'Two teams compete in final third attacking and defending; the attacking team creates and converts scoring chances under live defensive pressure while the defending team contests finishing opportunities and counter-attacks immediately from clearances.',
                playerStructure ? `Player structure logic: ${playerStructure}` : '',
            ]).join(' ')
        case 'Constraint-Driven Free Play':
            return uniqueLines([
                'Two teams compete in a free live game shaped by the selected constraints; possession, pressure, and counter-attack options remain live inside the constraint structure for both teams.',
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
export const ARCHETYPE_DECISION_CUE_PAIRS: Record<string, readonly [string, string]> = {
    'End Zone Games': [
        'Direct penetration, support behind the ball, and recycling to a new entry angle are all live options; which is available depends on the coverage between the ball and the target zone.',
        'The target zone remains available until it is contested; entry, drawing defenders, and switching the route are live options while the contest is open.',
    ],
    'Directional Possession Games': [
        'Securing possession, progressing forward, and switching play are all live options; which is on depends on where space opens and how pressure is applied.',
        'Space, support, and opponent recovery shape which next action remains available.',
    ],
    'Positional Play Games': [
        'A numerical advantage, free player, or open lane makes forward play available; maintaining structure remains live when the better advantage is still building.',
        'Coverage shifts open and close the forward lane, free player, or overload before the defensive structure recovers.',
    ],
    'Transition Games': [
        'On each possession change, immediate attack into transition space and secure possession are both available while the new picture forms.',
        'Opponent recovery speed governs whether forward commitment, support around the ball, or defensive recovery remains open.',
    ],
    'Overload Games': [
        'Using the overload, holding to draw defenders, and resetting to rebuild the advantage are all live options while the edge remains active.',
        'Defensive adjustments open and close the numerical or positional edge as an actionable route.',
    ],
    'Target Games': [
        'The target is available only when defensive cover, support angles, and pressure leave the connection open.',
        'After a target connection, forward continuation, layoff support, and rebuilding possession are all live options according to how contested the connection is.',
    ],
    'Channel Games': [
        'A channel is available when defensive coverage leaves it open for forward entry.',
        'Coverage shifts close one channel and open another; either channel can become the active route.',
    ],
    'Pressing & Regain Games': [
        'Opponent body shape, support cover, and distance to the ball define when the press window is active.',
        'At the regain moment, immediate attack against disorganization and recovery into shape are both available according to whether the press window remains open.',
    ],
    'Finishing Games': [
        'Shooting, cutting inside, and holding for a better chance are all live options according to goalkeeper position, defensive cover, and angle of approach.',
        'Defensive recovery sets the available finish, layoff to a supporting finisher, or rebuild of the chance on each attempt.',
    ],
    'Constraint-Driven Free Play': [
        'The selected constraints define which outcome is available in the live game at each moment.',
        'Timing and route options stay tied to the opponent response inside the constraint problem on each possession.',
    ],
}

export function archetypeDecisionCues(archetypeName: string): readonly [string, string] {
    return (
        ARCHETYPE_DECISION_CUE_PAIRS[archetypeName] ?? [
            'Pressure, space, and support define which next actions are genuinely available in the live game.',
            'Opponent responses open and close timing, route, and support options as the picture changes.',
        ]
    )
}

function operationalizeDecisionFocusLine(line: string): string {
    const withoutAffordancePrefix = sanitizeMechanicLine(line).replace(/^Affordance decision cue for "[^"]+":\s*/i, '')
    const priorityMatch = withoutAffordancePrefix.match(/^Players prioritize (.*) in decisions\.$/i)
    if (priorityMatch) {
        return `${sentenceCase(priorityMatch[1]!.trim())} remains active in the available option set.`
    }
    const recognizeMatch = withoutAffordancePrefix.match(/^Players should recognize (.*) before choosing the next action\.$/i)
    if (recognizeMatch) {
        return `${sentenceCase(recognizeMatch[1]!.trim())} defines which next actions are available.`
    }
    return withoutAffordancePrefix
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
    cues.push(...constraintDecisionFocus.map(operationalizeDecisionFocusLine).filter(isCoachFacingMechanicLine))
    const affordanceDecisionFocus = slot.requiredAffordanceMechanics.filter((line) =>
        /players should recognize .* before choosing the next action\./i.test(line)
    )
    // These start with "Affordance decision cue for "X":" — strip that prefix to keep just the cue.
    cues.push(...affordanceDecisionFocus.map(operationalizeDecisionFocusLine).filter(Boolean))
    return uniqueLines(cues.filter(Boolean))
}

function sentenceCase(text: string): string {
    const trimmed = text.trim()
    if (!trimmed) return ''
    return `${trimmed[0]!.toUpperCase()}${trimmed.slice(1)}`
}

function cleanExchangeClause(text: string): string {
    return text
        .replace(/\ba team recognizes the live opportunity created by\b/i, 'the live opportunity created by')
        .replace(/\ba team sees\b/i, '')
        .replace(/\ba team creates\b/i, '')
        .replace(/\ba team regains\b/i, 'a regain occurs')
        .replace(/\ba team secures\b/i, '')
        .replace(/\ba team delays\b/i, 'the attack is delayed and')
        .replace(/\ba line open\b/i, 'a line is open')
        .replace(/\bthey force the action into pressure or lose the ball while the picture is closed\b/i, 'a forced action into pressure or turnover after the advantage closes')
        .replace(/\bthey force the entry into pressure or lose the ball on the breakthrough action\b/i, 'a forced entry into pressure or turnover on the breakthrough action')
        .replace(/\bthey drive into crowded pressure or force the entry after the space has closed\b/i, 'a crowded entry or forced action after the space has closed')
        .replace(/\bthey rush the shot into pressure or lose the ball before the finish is prepared\b/i, 'a rushed shot into pressure or turnover before the finish is prepared')
        .replace(/\bthey force the first action into recovered pressure or lose the ball while the window is gone\b/i, 'a forced first action into recovered pressure or turnover after the window is gone')
        .replace(/\bthey panic, clear aimlessly, or force the first outlet into pressure\b/i, 'a rushed clearance or forced first outlet into pressure')
        .replace(/\bthey exploit it\b/i, 'it is used')
        .replace(/\bthey\b/gi, 'the team in possession can')
        .replace(/\bthe team in possession force\b/i, 'a forced')
        .replace(/\bthe team in possession drive\b/i, 'a drive')
        .replace(/\bthe team in possession rush\b/i, 'a rushed')
        .replace(/\bthe team in possession panic\b/i, 'a rushed clearance')
        .replace(/\s+/g, ' ')
        .replace(/\s+,/g, ',')
        .trim()
}

function environmentalExchangeFromLiveRule(liveRule: string): string | null {
    const match = liveRule
        .trim()
        .match(/^If\s+([\s\S]+?),\s+then\s+([\s\S]+?);\s+but if\s+([\s\S]+?),\s+then\s+([\s\S]+?),\s+and\s+([\s\S]+?)\.?$/i)
    if (!match) return null

    const cue = cleanExchangeClause(match[1]!)
    const reward = cleanExchangeClause(match[2]!)
    const risk = cleanExchangeClause(match[3]!)
    const opponent = cleanExchangeClause(match[4]!)
    const continuation = cleanExchangeClause(match[5]!)

    return [
        `${sentenceCase(cue)} remains active for both teams during live play.`,
        `${sentenceCase(reward)} while the advantage is open.`,
        `${sentenceCase(risk)} gives ${opponent}, and ${continuation}.`,
    ].join(' ')
}

export function buildExplicitExchangeRule(slot: ActivitySkeletonSlot): string {
    const liveRule = extractAfterPrefix(slot.requiredConstraintMechanics, 'Interaction exchange — live rule and cues: ')
    if (liveRule) {
        const trimmed = liveRule.split(' Visible opportunity cue:')[0]?.trim()
        const environmental = trimmed ? environmentalExchangeFromLiveRule(sanitizeMechanicLine(trimmed)) : null
        if (environmental) return environmental
    }

    switch (slot.archetypeName) {
        case 'Pressing & Regain Games':
            return 'The press and regain window stays live for both teams. A regain opens an immediate attack, a turnover flips the same advantage to the opponent, and play continues live with no reset.'
        case 'Overload Games':
            return 'The overload remains active during live play and may be used to move the defense toward advantage. A forced action or turnover flips the exposed space to the opponent, and play continues live with no reset.'
        case 'End Zone Games':
            return 'The target zone remains active for both teams throughout play. Entry under pressure keeps the next action live, and any turnover gives the opponent immediate access to attack the other way with no reset.'
        case 'Positional Play Games':
            return 'Positional advantages remain live while the defensive structure is stretched. Forward play can continue through the open lane, and any ball forced into a covered zone gives the opponent immediate access to the disorganized shape with play continuing live.'
        case 'Transition Games':
            return 'Play continues immediately after every possession change with no reset. The team gaining the ball has first access to transition space, and a stalled attack or turnover flips the same transition advantage to the opponent.'
        case 'Target Games':
            return 'The target remains an active forward connection for both teams under live defensive pressure. A completed connection keeps play moving forward, and a blocked connection or turnover gives the opponent the immediate regain attack.'
        case 'Channel Games':
            return 'Wide and central channels remain active throughout play and may be used to progress forward. A channel entry keeps play live, and a forced entry or turnover opens the opposite channel for the opponent with no reset.'
        case 'Finishing Games':
            return 'Finishing chances remain live under defensive pressure, with rebounds, clearances, and counter-attacks continuing from the result. A forced chance or turnover gives the defending team immediate access to counter-attack with no reset.'
        case 'Constraint-Driven Free Play':
            return 'The selected constraint problem remains active for both teams during live play. The earned advantage belongs to whichever team satisfies the condition, and a missed condition or turnover flips possession or restart advantage to the opponent immediately.'
        default:
            return 'Play stays live as possession is secured and progressed toward the target under pressure. A forced ball or turnover flips the immediate attacking advantage to the opponent with no reset.'
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
    // Pipeline per line: sanitize → unwrap affordance wrappers → filter scaffolding prefixes.
    // unwrapAffordanceWrappers surfaces lens content (e.g. "Rules and scoring must require
    // breaking or bypassing a defensive line...") which is needed for skeleton validation
    // AND is coach-readable in its own right.
    const scoringBase = slot.requiredScoringMechanics
        .map(sanitizeMechanicLine)
        .map(unwrapAffordanceWrappers)
        .filter(isCoachFacingMechanicLine)
    // scoringSupport (from "Archetype incentive pattern support:" lines) intentionally dropped —
    // these are example-pattern hints meant for the AI prompt brief, not coach-facing scoring
    // rules. Surfacing them produced lowercase-start fragments like "bonus for achieving target
    // outcome linked to affordance." which reference internal terminology. The AI prompt still
    // receives these patterns via requiredArchetypeMechanics; only coach output is cleaned.
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
    return uniqueLines([firstLine, ...scoringBase, ...cleanConsequences])
}

function buildConstraintLines(slot: ActivitySkeletonSlot): string[] {
    return uniqueLines(slot.coachFacingConstraints)
}

function buildRuleLines(slot: ActivitySkeletonSlot, explicitExchangeRule: string): string[] {
    // Coach-facing rules: sanitize → unwrap affordance wrappers → filter scaffolding prefixes.
    // Affordance wrappers are unwrapped (not filtered) so the underlying lens design language
    // surfaces — this is required for skeleton validation (validateActivitiesAgainstSkeleton
    // checks that each lens mechanic line is reflected in the bundle).
    const ruleBase = slot.requiredRuleMechanics
        .map(sanitizeMechanicLine)
        .map(unwrapAffordanceWrappers)
        .filter(isCoachFacingMechanicLine)
    // Note: previously this prepended `Game form: ${slot.archetypeName}.` as a meta-anchor. That
    // duplicates the activity title (which already names the game form) and reads as system
    // metadata rather than a rule. Dropped per Christian's translation-layer feedback.
    return uniqueLines([explicitExchangeRule, ...ruleBase])
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
