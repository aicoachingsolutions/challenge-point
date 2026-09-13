/**
 * Primary Scoring Event resolution — RC1.1 (Christian, 2026-09-13).
 *
 * THE CHAIN HE APPROVED: realized Game Form -> physically available scoring events -> Representative
 * Performance Context and its Primary Scoring Identity -> valid intersection -> qualifying condition
 * -> primary scoring event -> activity generation -> coach-facing How to Score.
 *
 * WHY. Nine real activities generated on 13 Sep: seven setups marked a scoring object, and none of the
 * seven scored it. Both finishing games had goals and goalkeepers and awarded points for "attacking
 * the open space"; both counter-attack games awarded the regain, which is the counter-press side of the
 * exchange. Scoring followed the affordance lens, and the "primary" condition was picked out of the
 * text after generation by word ranking. This decides the event BEFORE any activity text exists.
 *
 * WHERE THE KNOWLEDGE LIVES. Nothing below is authored football knowledge except coach wording:
 *   valid events per context, in approved order   RPC workbook, Relationships (SCORING_EVENT)
 *   qualifying condition per context               RPC workbook, Properties (PRIMARY_SCORING_CONDITION)
 *   the event vocabulary and definitions           RPC workbook, Controlled Vocabulary (scoring_event)
 *   objects each game form physically marks        Soccer Module, Game Forms.scoring_structure_type
 *
 * WHAT IS DECIDED HERE, and why none of it is knowledge:
 *   * Regain and denial availability is DERIVED. Every game form is a live two-team contest, so a
 *     change of possession always exists; denial is defined over a progression object, so it exists
 *     wherever one does. Asserting either per row would only restate that.
 *   * The two realization gaps Christian asked to be CLOSED rather than worked around are listed
 *     explicitly in REALIZATION_COVERAGE, so nothing silently generalizes to other game forms.
 *   * The coach's How to Score wording for each approved context and event (COACH_RULES): "The engine
 *     can reason in sophisticated language. The coach should never have to."
 *
 * ACROSS THE THREE ACTIVITIES the valid intersection is used in order, one event per slot, wrapping.
 * Every event used is approved for the context and physically present, so identity holds in all
 * three; and both approved events of Counter-Press and Attack Prevention reach coaches, which a
 * first-match rule would never do for Denial.
 *
 * FAILS RATHER THAN INFERS (his words: "Validation should fail rather than infer if the selected
 * realization cannot produce a valid event for the active Context"). An empty intersection throws.
 *
 * Sport-specific by design: declared in the sport-coupling guard's SPORT_LAYER_FILES.
 */
import type { PrimaryScoringDirective } from '../types'
import { rpcLibrary } from './rpc-library'
import { soccerModule } from './soccer-module'

const PROGRESSION_EVENTS: readonly string[] = ['goal', 'target_player', 'line_crossed', 'target_zone_entered', 'gate']

export class PrimaryScoringResolutionError extends Error {
    readonly rpcId: string
    readonly gameFormId: string
    readonly available: string[]
    readonly valid: string[]

    constructor(rpcId: string, gameFormId: string, available: string[], valid: string[]) {
        super(
            `Primary scoring cannot resolve ${rpcId} through ${gameFormId}: none of its valid events ` +
                `(${valid.join(', ') || 'none'}) is physically available (${available.join(', ') || 'none'}).`
        )
        this.name = 'PrimaryScoringResolutionError'
        this.rpcId = rpcId
        this.gameFormId = gameFormId
        this.available = available
        this.valid = valid
    }
}

export interface RealizationCoverage {
    id: string
    gameFormId: string
    rpcIds: readonly string[]
    /** Scoring objects the realization marks out for these contexts. */
    instantiates: readonly string[]
    purpose: string
}

/**
 * The realization gaps Christian asked to be closed (13 Sep): "preserve those valid RPC ↔ Game Form
 * relationships and fix the realization coverage rather than removing relationships".
 *
 *   Channel Games: "the realization needs to instantiate an observable scoring object appropriate to
 *   the Context. The channel can organize the interaction, but the channel itself does not
 *   automatically provide the scoring consequence." Applied to every context compatible with Channel
 *   Games. Attack Prevention needs a protected zone to deny, rather than an attacking end object.
 *
 *   Positional Play for Finishing: "it needs an actual goal ... so the realization can express
 *   Finishing's Primary Scoring Identity."
 */
export const REALIZATION_COVERAGE: readonly RealizationCoverage[] = [
    {
        id: 'channel-attacking-object',
        gameFormId: 'GF7',
        rpcIds: ['RPC-001', 'RPC-002', 'RPC-003', 'RPC-004'],
        instantiates: ['line_crossed', 'target_zone_entered', 'gate', 'target_player'],
        purpose: 'Channels organize the attack but mark no end object; the realization marks one appropriate to the context.',
    },
    {
        id: 'channel-protected-zone',
        gameFormId: 'GF7',
        rpcIds: ['RPC-008'],
        instantiates: ['target_zone_entered'],
        purpose: 'Attack Prevention through channels needs a marked protected zone the attack can be kept out of.',
    },
    {
        id: 'positional-play-finishing-goal',
        gameFormId: 'GF3',
        rpcIds: ['RPC-005'],
        instantiates: ['goal'],
        purpose: 'Finishing through a positional grid needs a real goal to score in.',
    },
]

interface CoachRule {
    /** How to Score, in the coach's voice. */
    rule: string
    /** What the setup must mark. */
    setup: string
    /**
     * Each group needs one whole-word match in the generated setup. PHYSICAL OBJECTS ONLY, named with
     * the same noun the rule uses. Two lessons from real generation on 13 Sep:
     *   * a bare "zone" was satisfied by the game form's own "end zones" while the rule scored a
     *     "finishing zone", so a coach could not tell which zone scores. Each rule names its object
     *     distinctly, and the setup must use that name;
     *   * timing ("pick a countdown", "count to five") is part of the scoring rule, which the system
     *     writes itself. Demanding it in the setup failed a whole Counterattack assembly twice while
     *     checking nothing a coach has to mark out.
     * Empty when the event needs no marked object.
     */
    evidence: string[][]
}

const GOALKEEPER = ['goalkeeper', 'goalkeepers', 'keeper', 'keepers']
const PRESS = ['press', 'presses', 'pressing']
const LINE = ['line', 'lines']
const GATE = ['gate', 'gates']
const TARGET = ['target player', 'target players']
const GOAL = ['goal', 'goals']
const TARGET_ZONE = ['target zone', 'target zones']
const ATTACKING_ZONE = ['attacking zone', 'attacking zones']
const ATTACKING_LINE = ['attacking line', 'attacking lines']
const FINISHING_ZONE = ['finishing zone', 'finishing zones']
const END_ZONE = ['end zone', 'end zones']
const END_LINE = ['end line', 'end lines']
const ESCAPE_LINE = ['escape line', 'escape lines']
const PROTECTED_ZONE = ['protected zone', 'protected zones']
const PROTECTED_LINE = ['protected line', 'protected lines']

const BUILD_OUT_START = 'Start each attack from your goalkeeper or a restart in your own half.'
const PRESS_START = 'The other team presses from the start of every attack.'
const NOT_FORWARD = 'Passing it around without moving forward never scores.'
const COUNTDOWN_SETUP = 'Before you start, pick a countdown between 6 and 10 seconds that starts each time a team wins the ball.'
const COUNTDOWN_START = 'The countdown starts each time your team wins the ball.'
const COUNT_FIVE = 'When your team loses the ball, count to five out loud.'

/**
 * Coach wording per approved context x event, keyed `${rpcId}|${eventKey}|${objectKey}`. The object
 * part is empty except for regain and denial, which are judged against a marked line or zone.
 *
 * The Counterattack countdown uses the 6-10 second recovery window already authored for Recover &
 * Reorganize Games: the time an attack has before a disrupted defence recovers. No number is
 * canonical for Counterattack, so the coach picks one inside the authored range rather than the
 * engine inventing one. Counter-Press uses the existing 5-second Counter-Press Window, as approved.
 */
export const COACH_RULES: Readonly<Record<string, CoachRule>> = {
    // ---- RPC-001 Goalkeeper Build-Out ---------------------------------------------------------------
    'RPC-001|line_crossed|': {
        rule: `${BUILD_OUT_START} Earn a point when a player dribbles over the line, or receives the ball past it and controls it. A long kick that lands past the line does not count.`,
        setup: `Mark a line across the pitch beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [LINE, GOALKEEPER],
    },
    'RPC-001|target_zone_entered|': {
        rule: `${BUILD_OUT_START} Earn a point when a player dribbles into the target zone, or receives the ball there and controls it. A long kick into the target zone does not count.`,
        setup: `Mark a target zone beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [TARGET_ZONE, GOALKEEPER],
    },
    'RPC-001|gate|': {
        rule: `${BUILD_OUT_START} Earn a point when a player passes or dribbles through a gate and your team keeps the ball. A long kick through a gate does not count.`,
        setup: `Set out gates of two cones beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [GATE, GOALKEEPER],
    },
    'RPC-001|target_player|': {
        rule: `${BUILD_OUT_START} Earn a point when your target player receives the ball and controls it. A long kick straight to the target player does not count.`,
        setup: `Place a target player beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [TARGET, GOALKEEPER],
    },

    // ---- RPC-002 High Press Escape ------------------------------------------------------------------
    'RPC-002|line_crossed|': {
        rule: `${PRESS_START} Earn a point when a player dribbles over the line behind the press, or receives the ball past it and controls it, and your team keeps the ball with the next pass.`,
        setup: `Mark a line behind the pressing players. ${PRESS_START}`,
        evidence: [LINE, PRESS],
    },
    'RPC-002|target_zone_entered|': {
        rule: `${PRESS_START} Earn a point when a player dribbles into the target zone behind the press, or receives the ball there and controls it, and your team keeps the ball with the next pass.`,
        setup: `Mark a target zone behind the pressing players. ${PRESS_START}`,
        evidence: [TARGET_ZONE, PRESS],
    },
    'RPC-002|gate|': {
        rule: `${PRESS_START} Earn a point when a player passes or dribbles through a gate behind the press and your team keeps the ball with the next pass.`,
        setup: `Set out gates of two cones behind the pressing players. ${PRESS_START}`,
        evidence: [GATE, PRESS],
    },
    'RPC-002|target_player|': {
        rule: `${PRESS_START} Earn a point when your target player behind the press receives the ball and controls it, and your team keeps the ball with the next pass.`,
        setup: `Place a target player behind the pressing players. ${PRESS_START}`,
        evidence: [TARGET, PRESS],
    },

    // ---- RPC-003 Attack Development -----------------------------------------------------------------
    'RPC-003|target_zone_entered|': {
        rule: `Earn a point when a player dribbles into the attacking zone, or receives the ball there and controls it, and your team keeps the ball. ${NOT_FORWARD}`,
        setup: 'Mark an attacking zone across the far third of the pitch at each end.',
        evidence: [ATTACKING_ZONE],
    },
    'RPC-003|line_crossed|': {
        rule: `Earn a point when a player dribbles over the attacking line, or receives the ball past it and controls it, and your team keeps the ball. ${NOT_FORWARD}`,
        setup: 'Mark an attacking line across the pitch two thirds of the way up, at each end.',
        evidence: [ATTACKING_LINE],
    },
    'RPC-003|gate|': {
        rule: `Earn a point when a player passes or dribbles forward through a gate and your team keeps the ball. ${NOT_FORWARD}`,
        setup: 'Set out gates of two cones across the middle of the pitch.',
        evidence: [GATE],
    },
    'RPC-003|target_player|': {
        rule: `Earn a point when a forward pass reaches your target player and they control it. ${NOT_FORWARD}`,
        setup: 'Place a target player near the far end for each team.',
        evidence: [TARGET],
    },

    // ---- RPC-004 Chance Creation --------------------------------------------------------------------
    'RPC-004|target_zone_entered|': {
        rule: 'Earn a point when a player dribbles into the finishing zone, or receives the ball there and controls it, while defenders can still stop them. A hopeful ball into the zone does not count.',
        setup: 'Mark a finishing zone at each end, with defenders free to defend it.',
        evidence: [FINISHING_ZONE],
    },
    'RPC-004|gate|': {
        rule: 'Earn a point when the ball goes through a gate into the finishing zone and a teammate controls it, while defenders can still stop them.',
        setup: 'Mark a finishing zone at each end and set out gates of two cones along its edge.',
        evidence: [GATE, FINISHING_ZONE],
    },
    'RPC-004|target_player|': {
        rule: 'Earn a point when your target player receives the ball in the finishing zone and controls it, while defenders can still stop them.',
        setup: 'Mark a finishing zone at each end and place a target player in it for each team.',
        evidence: [TARGET, FINISHING_ZONE],
    },

    // ---- RPC-005 Finishing --------------------------------------------------------------------------
    'RPC-005|goal|': {
        rule: 'Earn a point for every goal. If you use goalkeepers, they play live on every attempt.',
        setup: 'Put a goal at each end. Use goalkeepers if you have them.',
        evidence: [GOAL],
    },

    // ---- RPC-006 Counterattack ----------------------------------------------------------------------
    'RPC-006|goal|': {
        rule: `Earn a point for a goal scored before the countdown ends. ${COUNTDOWN_START}`,
        setup: `Put a goal at each end. ${COUNTDOWN_SETUP}`,
        evidence: [GOAL],
    },
    'RPC-006|line_crossed|': {
        rule: `Earn a point when a player dribbles over the end line, or receives the ball past it and controls it, before the countdown ends. ${COUNTDOWN_START}`,
        setup: `Mark an end line for each team. ${COUNTDOWN_SETUP}`,
        evidence: [END_LINE],
    },
    'RPC-006|target_zone_entered|': {
        rule: `Earn a point when a player dribbles into the end zone, or receives the ball there and controls it, before the countdown ends. ${COUNTDOWN_START}`,
        setup: `Mark an end zone for each team. ${COUNTDOWN_SETUP}`,
        evidence: [END_ZONE],
    },
    'RPC-006|target_player|': {
        rule: `Earn a point when your target player receives the ball and controls it before the countdown ends. ${COUNTDOWN_START}`,
        setup: `Place a target player at each end. ${COUNTDOWN_SETUP}`,
        evidence: [TARGET],
    },

    // ---- RPC-007 Counter-Press ----------------------------------------------------------------------
    'RPC-007|regain|': {
        rule: `${COUNT_FIVE} Earn a point if you win it back before you reach five.`,
        setup: 'Every time a team loses the ball, count to five out loud.',
        evidence: [],
    },
    'RPC-007|denial|line': {
        rule: `${COUNT_FIVE} Earn a point if the other team has not crossed the escape line when you reach five.`,
        setup: 'Mark an escape line across the pitch for each team. Every time a team loses the ball, count to five out loud.',
        evidence: [ESCAPE_LINE],
    },
    'RPC-007|denial|zone': {
        rule: `${COUNT_FIVE} Earn a point if the other team has not got into the target zone when you reach five.`,
        setup: 'Mark a target zone for each team. Every time a team loses the ball, count to five out loud.',
        evidence: [TARGET_ZONE],
    },

    // ---- RPC-008 Attack Prevention ------------------------------------------------------------------
    'RPC-008|regain|zone': {
        rule: 'Earn a point when your team wins the ball before the other team gets into the protected zone.',
        setup: 'Mark a protected zone in front of each goal or end line.',
        evidence: [PROTECTED_ZONE],
    },
    'RPC-008|regain|line': {
        rule: 'Earn a point when your team wins the ball before the other team crosses the protected line.',
        setup: 'Mark a protected line across the pitch that each defending team defends.',
        evidence: [PROTECTED_LINE],
    },
    'RPC-008|denial|zone': {
        rule: "Earn a point when the other team's attack ends without them getting into the protected zone.",
        setup: 'Mark a protected zone in front of each goal or end line.',
        evidence: [PROTECTED_ZONE],
    },
    'RPC-008|denial|line': {
        rule: "Earn a point when the other team's attack ends without them crossing the protected line.",
        setup: 'Mark a protected line across the pitch that each defending team defends.',
        evidence: [PROTECTED_LINE],
    },
}

/** Which marked object a context judges regain and denial against, most natural first. */
const OBJECT_PREFERENCE: Readonly<Record<string, readonly ('line' | 'zone')[]>> = {
    'RPC-007': ['line', 'zone'],
    'RPC-008': ['zone', 'line'],
}

/** Counter-Press judges a regain against its window alone; every other regain or denial needs an object. */
const REGAIN_WITHOUT_OBJECT: readonly string[] = ['RPC-007']

const unique = <T>(values: T[]): T[] => [...new Set(values)]

/** The objects a game form marks, as authored — or a loud failure when nobody has decided. */
export function authoredScoringObjects(gameFormId: string): string[] {
    const row = soccerModule.gameForm(gameFormId)
    if (!row) throw new Error(`Unknown game form "${gameFormId}".`)
    const raw = String(row['scoring_structure_type'] ?? '').trim()
    if (!raw) {
        throw new Error(`Game form ${gameFormId} has no scoring_structure_type; which objects it marks has not been decided.`)
    }
    return raw === 'none' ? [] : raw.split(';').map((value) => value.trim()).filter(Boolean)
}

/** Events physically available for this context in this game form, and the coverage that supplied objects. */
export function availableScoringEvents(rpcId: string, gameFormId: string): { events: string[]; coverage: RealizationCoverage | null } {
    const coverage = REALIZATION_COVERAGE.find((c) => c.gameFormId === gameFormId && c.rpcIds.includes(rpcId)) ?? null
    const objects = unique([...authoredScoringObjects(gameFormId), ...(coverage?.instantiates ?? [])])
    const hasProgressionObject = objects.some((event) => PROGRESSION_EVENTS.includes(event))
    return { events: unique([...objects, 'regain', ...(hasProgressionObject ? ['denial'] : [])]), coverage }
}

function objectFor(rpcId: string, eventKey: string, available: string[]): string {
    if (eventKey !== 'regain' && eventKey !== 'denial') return ''
    if (eventKey === 'regain' && REGAIN_WITHOUT_OBJECT.includes(rpcId)) return ''
    const marked = { line: available.includes('line_crossed'), zone: available.includes('target_zone_entered') }
    return (OBJECT_PREFERENCE[rpcId] ?? ['line', 'zone']).find((object) => marked[object]) ?? ''
}

export const coachRuleKey = (rpcId: string, eventKey: string, objectKey: string): string => `${rpcId}|${eventKey}|${objectKey}`

/** The primary scoring event for one activity slot. Throws rather than infers. */
export function resolvePrimaryScoring(rpcId: string, gameFormId: string, slotIndex: 1 | 2 | 3): PrimaryScoringDirective {
    const context = rpcLibrary.context(rpcId)
    if (!context) throw new Error(`Unknown Representative Performance Context "${rpcId}".`)

    const valid = rpcLibrary.scoringEventsForContext(rpcId)
    const { events: available, coverage } = availableScoringEvents(rpcId, gameFormId)
    const intersection = valid.filter((event) => available.includes(event))
    if (intersection.length === 0) throw new PrimaryScoringResolutionError(rpcId, gameFormId, available, valid)

    const eventKey = intersection[(slotIndex - 1) % intersection.length]!
    const objectKey = objectFor(rpcId, eventKey, available)
    const wording = COACH_RULES[coachRuleKey(rpcId, eventKey, objectKey)]
    if (!wording) {
        throw new PrimaryScoringResolutionError(rpcId, gameFormId, available, valid)
    }

    // Coverage is credited only when it supplied the object this event is scored on — not merely
    // because an entry exists for the pair while the game form already marks the object itself.
    const OBJECT_EVENT: Record<string, string> = { line: 'line_crossed', zone: 'target_zone_entered' }
    const scoredObject = eventKey === 'regain' || eventKey === 'denial' ? OBJECT_EVENT[objectKey] ?? '' : eventKey
    const suppliedByCoverage = Boolean(
        coverage && scoredObject && coverage.instantiates.includes(scoredObject) && !authoredScoringObjects(gameFormId).includes(scoredObject)
    )

    return {
        contextId: rpcId,
        contextName: context.name,
        eventKey,
        objectKey: objectKey || null,
        scoringRule: wording.rule,
        setupRequirement: wording.setup,
        setupEvidence: wording.evidence.map((group) => [...group]),
        qualifyingCondition: rpcLibrary.primaryScoringCondition(rpcId),
        realizationCoverage: suppliedByCoverage ? coverage!.id : null,
    }
}

/** One directive per activity slot. */
export function resolvePrimaryScoringDirectives(rpcId: string, gameFormId: string): PrimaryScoringDirective[] {
    return ([1, 2, 3] as const).map((slot) => resolvePrimaryScoring(rpcId, gameFormId, slot))
}
