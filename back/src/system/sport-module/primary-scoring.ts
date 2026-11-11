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
 *   which event meanings Christian approved        APPROVED_EVENT_MEANINGS below (11 November 2026); every other one UNREVIEWED
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
     * Never empty: even the Counter-Press regain, judged on its five-second window, marks an escape line
     * for the team that won the ball to attack. Without one, real setups fell back on end zones.
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
const COUNT_FIVE = 'Count to five out loud as soon as your team loses the ball.'

/**
 * Coach wording per approved context x event, keyed `${rpcId}|${eventKey}|${objectKey}`. The object
 * part is empty except for regain and denial, which are judged against a marked line or zone.
 *
 * The Counterattack countdown uses the 6-10 second recovery window already authored for Recover &
 * Reorganize Games: the time an attack has before a disrupted defence recovers. No number is
 * canonical for Counterattack, so the coach picks one inside the authored range rather than the
 * engine inventing one. Counter-Press uses the existing 5-second Counter-Press Window, as approved.
 *
 * EVERY RULE LEADS WITH HOW THE POINT IS EARNED. Christian: "If I have to reread the Scoring section to
 * determine how points are earned, it probably isn't clear enough." Real output on 13 Sep opened
 * Goalkeeper Build-Out's Scoring with "Start each attack from your goalkeeper…" and Counter-Press's
 * with "When your team loses the ball, count to five…", so the start and the count now follow.
 */
export const COACH_RULES: Readonly<Record<string, CoachRule>> = {
    // ---- RPC-001 Goalkeeper Build-Out ---------------------------------------------------------------
    'RPC-001|line_crossed|': {
        rule: `Earn a point when a player dribbles over the line, or receives the ball past it and controls it. A long kick that lands past the line does not count. ${BUILD_OUT_START}`,
        setup: `Mark a line across the pitch beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [LINE, GOALKEEPER],
    },
    'RPC-001|target_zone_entered|': {
        rule: `Earn a point when a player dribbles into the target zone, or receives the ball there and controls it. A long kick into the target zone does not count. ${BUILD_OUT_START}`,
        setup: `Mark a target zone beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [TARGET_ZONE, GOALKEEPER],
    },
    'RPC-001|gate|': {
        rule: `Earn a point when a player passes or dribbles through a gate and your team keeps the ball. A long kick through a gate does not count. ${BUILD_OUT_START}`,
        setup: `Set out gates of two cones beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [GATE, GOALKEEPER],
    },
    'RPC-001|target_player|': {
        rule: `Earn a point when your target player receives the ball and controls it. A long kick straight to the target player does not count. ${BUILD_OUT_START}`,
        setup: `Place a target player beyond the first defenders. ${BUILD_OUT_START}`,
        evidence: [TARGET, GOALKEEPER],
    },

    // ---- RPC-002 High Press Escape ------------------------------------------------------------------
    'RPC-002|line_crossed|': {
        rule: `Earn a point when a player dribbles over the line behind the press, or receives the ball past it and controls it, and your team keeps the ball with the next pass. ${PRESS_START}`,
        setup: `Mark a line behind the pressing players. ${PRESS_START}`,
        evidence: [LINE, PRESS],
    },
    'RPC-002|target_zone_entered|': {
        rule: `Earn a point when a player dribbles into the target zone behind the press, or receives the ball there and controls it, and your team keeps the ball with the next pass. ${PRESS_START}`,
        setup: `Mark a target zone behind the pressing players. ${PRESS_START}`,
        evidence: [TARGET_ZONE, PRESS],
    },
    'RPC-002|gate|': {
        rule: `Earn a point when a player passes or dribbles through a gate behind the press and your team keeps the ball with the next pass. ${PRESS_START}`,
        setup: `Set out gates of two cones behind the pressing players. ${PRESS_START}`,
        evidence: [GATE, PRESS],
    },
    'RPC-002|target_player|': {
        rule: `Earn a point when your target player behind the press receives the ball and controls it, and your team keeps the ball with the next pass. ${PRESS_START}`,
        setup: `Place a target player behind the pressing players. ${PRESS_START}`,
        evidence: [TARGET, PRESS],
    },

    // ---- RPC-003 Attack Development -----------------------------------------------------------------
    // The zone, line and gate rules are Christian's approved wording, character for character: "I approve removing the
    // unsupported phrase "and your team keeps the ball" from all three affected Attack Development scoring rules." (received 11
    // November 2026, second reply). The zone and line rules keep control on reception, on the meaning recorded in
    // APPROVED_EVENT_MEANINGS. The gate is Option 2: "This remains a narrow decision for the Attack Development gate event. It
    // should not become a universal requirement for all gate-based activities." (received 11 November 2026, second reply). The
    // target player rule had no such phrase and is unchanged. Changed on an unmerged branch only; nothing deployed.
    'RPC-003|target_zone_entered|': {
        rule: `Earn a point when a player dribbles into the attacking zone, or receives the ball there and controls it. ${NOT_FORWARD}`,
        setup: 'Mark an attacking zone across the far third of the pitch at each end.',
        evidence: [ATTACKING_ZONE],
    },
    'RPC-003|line_crossed|': {
        rule: `Earn a point when a player dribbles over the attacking line, or receives the ball past it and controls it. ${NOT_FORWARD}`,
        setup: 'Mark an attacking line across the pitch two thirds of the way up, at each end.',
        evidence: [ATTACKING_LINE],
    },
    'RPC-003|gate|': {
        rule: `Earn a point when a player dribbles forward through a gate, or passes forward through it and a teammate controls it. ${NOT_FORWARD}`,
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
        // Goalkeepers are the rule's to mention. Repeated in Setup, the sentence was appended after
        // setups that already had a goalkeeper in each goal.
        setup: 'Put a goal at each end.',
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
    // The regain is judged on the five-second window alone, but the team that won the ball still needs
    // somewhere to attack. Without it, real setups fell back on end zones nothing scored on.
    'RPC-007|regain|line': {
        rule: `Earn a point if your team wins the ball back before you reach five. ${COUNT_FIVE}`,
        setup: 'Mark an escape line across the pitch for each team to attack. Every time a team loses the ball, count to five out loud.',
        evidence: [ESCAPE_LINE],
    },
    'RPC-007|regain|zone': {
        rule: `Earn a point if your team wins the ball back before you reach five. ${COUNT_FIVE}`,
        setup: 'Mark a target zone for each team to attack. Every time a team loses the ball, count to five out loud.',
        evidence: [TARGET_ZONE],
    },
    'RPC-007|denial|line': {
        rule: `Earn a point if the other team has not crossed the escape line when you reach five. ${COUNT_FIVE}`,
        setup: 'Mark an escape line across the pitch for each team. Every time a team loses the ball, count to five out loud.',
        evidence: [ESCAPE_LINE],
    },
    'RPC-007|denial|zone': {
        rule: `Earn a point if the other team has not got into the target zone when you reach five. ${COUNT_FIVE}`,
        setup: 'Mark a target zone for each team. Every time a team loses the ball, count to five out loud.',
        evidence: [TARGET_ZONE],
    },

    // ---- RPC-008 Attack Prevention ------------------------------------------------------------------
    'RPC-008|regain|zone': {
        rule: 'Earn a point when your team wins the ball before the other team gets into the protected zone.',
        setup: 'Mark a protected zone at each end.',
        evidence: [PROTECTED_ZONE],
    },
    'RPC-008|regain|line': {
        rule: 'Earn a point when your team wins the ball before the other team crosses the protected line.',
        setup: 'Mark a protected line across the pitch that each defending team defends.',
        evidence: [PROTECTED_LINE],
    },
    'RPC-008|denial|zone': {
        rule: "Earn a point when the other team's attack ends without them getting into the protected zone.",
        setup: 'Mark a protected zone at each end.',
        evidence: [PROTECTED_ZONE],
    },
    'RPC-008|denial|line': {
        rule: "Earn a point when the other team's attack ends without them crossing the protected line.",
        setup: 'Mark a protected line across the pitch that each defending team defends.',
        evidence: [PROTECTED_LINE],
    },
}

/** Where a controlled-vocabulary scoring event's description stands for one context: a specific meaning approved, or not reviewed. */
export type EventMeaningStanding = 'APPROVED' | 'UNREVIEWED'

/**
 * Christian's approval of one item, in the shape the approved wording records use (`ReadingApproval` in
 * rendering/approved-wording-readings.ts, checked by its `approvalUnusableBecause` in the unit test): who, the date (YYYY-MM-DD), the
 * reply it is filed in (naming that date in words) and Christian's words, verbatim. Declared here by shape, not imported, so the sport
 * layer gains no dependency on rendering.
 */
export interface EventMeaningApproval {
    who: string
    date: string
    filed: string
    quote: string
}

/** One specific meaning of a controlled-vocabulary scoring event that Christian approved, for one context. */
export interface ApprovedEventMeaning {
    rpcId: string
    eventKey: string
    /** The span of the event's controlled-vocabulary description that completes it by dribbling through the boundary, verbatim. */
    dribbling: string
    /** The span of the same description that completes it by controlled reception, verbatim. */
    controlledReception: string
    /** Christian's words, verbatim inside the approval: who judges control on reception, and when. */
    controlJudgedBy: string
    /** Christian's words, verbatim inside the approval: what control on reception does not imply. */
    doesNotImply: readonly string[]
    approvedBy: EventMeaningApproval
}

const CONTROLLED_RECEPTION_APPROVAL: EventMeaningApproval = {
    who: 'Christian',
    date: '2026-11-11',
    filed: 'Christian\'s reply filed 11 November 2026, the second that day (received 11 November 2026, second reply), item 2, "Controlled-Vocabulary Authority", answering question 2 of our document of 11 November 2026 on the Attack Development scoring rules',
    quote:
        'I approve the specific interpretation that controlled reception can complete the existing attacking-zone and attacking-line scoring events. ' +
        'A player may also complete the event by dribbling through the relevant boundary. ' +
        'Control on reception is judged by the coach in the immediate scoring situation. ' +
        'It should not imply an additional retention period, subsequent mandatory pass, or universal post-score possession consequence. ' +
        'I am not granting blanket approval to all controlled-vocabulary descriptions.',
}
const CONTROLLED_RECEPTION_NOT_IMPLIED = ['an additional retention period', 'subsequent mandatory pass', 'universal post-score possession consequence'] as const
const CONTROL_JUDGED_BY = 'judged by the coach in the immediate scoring situation'

/**
 * **The specific meanings of controlled-vocabulary scoring events that Christian has approved, and nothing else** (11 November 2026).
 *
 * The scoring-event descriptions (RPC workbook, Controlled Vocabulary, scoring_event) are our wording, from our proposal of 13
 * September 2026; they were not approved one by one. Asked whether they count as approved knowledge, Christian approved one meaning
 * for two events and no more: "I approve the specific interpretation that controlled reception can complete the existing
 * attacking-zone and attacking-line scoring events." "I am not granting blanket approval to all controlled-vocabulary descriptions."
 * "Please preserve the distinction between the specific meanings approved here and other descriptions that remain unreviewed."
 * (received 11 November 2026, second reply).
 *
 * So each entry is one context and one event: Attack Development (RPC-003), whose coach rules name these events the attacking zone
 * and the attacking line. Every description not listed stays UNREVIEWED (`eventMeaningStanding`): the gate, the target player, the
 * goal, the regain and the denial everywhere, and the zone and the line in every other context. Each entry names, verbatim, the spans
 * of its event's description that the approval reads, so a changed description no longer matches it (the unit test checks), and
 * Christian's limits on control on reception: "Control on reception is judged by the coach in the immediate scoring situation. It
 * should not imply an additional retention period, subsequent mandatory pass, or universal post-score possession consequence."
 * (received 11 November 2026, second reply). It records the standing of descriptions the knowledge library holds; it changes none
 * of them. Read by the unit tests; no runtime path reads it, so what a coach is served is unchanged by it.
 */
export const APPROVED_EVENT_MEANINGS: readonly ApprovedEventMeaning[] = [
    {
        rpcId: 'RPC-003',
        eventKey: 'target_zone_entered',
        dribbling: 'dribbles into a marked zone',
        controlledReception: 'receives and controls the ball inside it',
        controlJudgedBy: CONTROL_JUDGED_BY,
        doesNotImply: CONTROLLED_RECEPTION_NOT_IMPLIED,
        approvedBy: CONTROLLED_RECEPTION_APPROVAL,
    },
    {
        rpcId: 'RPC-003',
        eventKey: 'line_crossed',
        dribbling: 'dribbles the ball over a marked line',
        controlledReception: 'receives and controls it beyond the line',
        controlJudgedBy: CONTROL_JUDGED_BY,
        doesNotImply: CONTROLLED_RECEPTION_NOT_IMPLIED,
        approvedBy: CONTROLLED_RECEPTION_APPROVAL,
    },
]

/** Whether a context's use of a controlled-vocabulary scoring event has a specific meaning Christian approved; UNREVIEWED otherwise. */
export const eventMeaningStanding = (rpcId: string, eventKey: string): EventMeaningStanding =>
    APPROVED_EVENT_MEANINGS.some((meaning) => meaning.rpcId === rpcId && meaning.eventKey === eventKey) ? 'APPROVED' : 'UNREVIEWED'

/** Which marked object a context judges regain and denial against, most natural first. */
const OBJECT_PREFERENCE: Readonly<Record<string, readonly ('line' | 'zone')[]>> = {
    'RPC-007': ['line', 'zone'],
    'RPC-008': ['zone', 'line'],
}

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
