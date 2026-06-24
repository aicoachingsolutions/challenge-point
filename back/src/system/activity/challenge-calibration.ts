/**
 * Challenge Calibration (Round 8B).
 *
 * Christian's Round 8B finding: Game Problem / archetype / affordance / constraint SELECTION is
 * rock-stable across Comfortable / Stretch / Demanding (good), but the three levels produced
 * functionally similar ACTIVITIES — only space footprint, zone emphasis, and timing moved, while
 * pressure, information, numerical conditions, transition volatility, and consequence severity did
 * not. A coach couldn't reliably tell the three apart. Root cause: the only calibration signal the
 * generator received was a single vague line ("fit the requested challenge level") — no structured
 * definition of what each level means.
 *
 * This module defines that structure, expressed through the Environmental Fit dimensions named in the
 * Constraint & Incentive framework (docs/CONSTRAINT_INCENTIVE_FRAMEWORK.md). It deliberately does NOT
 * change selection (which 8B confirmed is mature) — calibration shapes how the SAME selected package
 * is expressed, never which game problem / archetype / lenses / constraints are chosen, and never by
 * scripting behavior. A Demanding environment is harder, not artificial: open play and multiple
 * solutions are preserved at every level.
 */

export type ChallengeLevelKey = 'comfortable' | 'stretch' | 'demanding'

export interface ChallengeCalibrationDimension {
    name: string
    directive: string
}

export interface ChallengeCalibrationProfile {
    key: ChallengeLevelKey
    label: string
    summary: string
    dimensions: ChallengeCalibrationDimension[]
}

/**
 * Accepts coach-facing labels (Comfortable / Stretch / Demanding), system bands (low / medium / high),
 * and common synonyms. Defaults to `stretch` (the match-realistic baseline) when unknown/empty.
 */
export function normalizeChallengeLevel(raw: string | undefined | null): ChallengeLevelKey {
    const t = String(raw ?? '').trim().toLowerCase()
    if (/\b(comfortable|easy|low|beginner|simple)\b/.test(t)) return 'comfortable'
    if (/\b(demanding|hard|high|advanced|difficult|intense)\b/.test(t)) return 'demanding'
    return 'stretch'
}

const PROFILES: Record<ChallengeLevelKey, ChallengeCalibrationProfile> = {
    comfortable: {
        key: 'comfortable',
        label: 'Comfortable',
        summary: 'Lower the environmental demand so players can solve the problem with time and support — without removing opposition or making it a drill.',
        dimensions: [
            { name: 'Space', directive: 'More space per player — a larger area or fewer bodies in the contested zone, so there is room to receive and decide.' },
            { name: 'Time', directive: 'More time on the ball — calmer tempo, restarts allowed to settle play.' },
            { name: 'Pressure', directive: 'Lower pressure — defenders start further away or arrive slightly later, giving the working unit time to read the picture.' },
            { name: 'Information', directive: 'Clearer, earlier cues — predictable starts and visible references so the picture is easy to read.' },
            { name: 'Numerical conditions', directive: 'Tilt numbers in favour of the working unit (e.g. a supporting overload) where the selected constraints allow.' },
            { name: 'Transition volatility', directive: 'Stable phases — reset between repetitions; possession changes do not have to be punished instantly.' },
            { name: 'Consequence severity', directive: 'Light stakes — forgiving restarts; mistakes do not carry sharp immediate cost.' },
        ],
    },
    stretch: {
        key: 'stretch',
        label: 'Stretch',
        summary: 'Match-realistic demand across every dimension — the default representative environment.',
        dimensions: [
            { name: 'Space', directive: 'Realistic, match-like space and density.' },
            { name: 'Time', directive: 'Realistic tempo — time on the ball roughly as it would be in the real game.' },
            { name: 'Pressure', directive: 'Match-realistic pressure — defenders contest as they would in a game.' },
            { name: 'Information', directive: 'Realistic cues — the picture is readable but not handed to the player.' },
            { name: 'Numerical conditions', directive: 'Broadly even numbers in the contest, as selected.' },
            { name: 'Transition volatility', directive: 'Live transitions — possession changes flow as in the real game.' },
            { name: 'Consequence severity', directive: 'Real consequences — outcomes matter as they would in a match.' },
        ],
    },
    demanding: {
        key: 'demanding',
        label: 'Demanding',
        summary: 'Raise the environmental demand so the problem must be solved under real stress — harder, but still open play with multiple solutions, never artificial.',
        dimensions: [
            { name: 'Space', directive: 'Compressed space — a tighter area or more bodies in the contested zone, so actions happen under spatial pressure.' },
            { name: 'Time', directive: 'Less time on the ball — faster restarts and quicker cycles force earlier decisions.' },
            { name: 'Pressure', directive: 'High pressure — immediate, aggressive closing-down with little distance to react.' },
            { name: 'Information', directive: 'Reduced or late information — disguised/varied starts and a faster-changing picture that demands scanning.' },
            { name: 'Numerical conditions', directive: 'Tilt numbers against the working unit (e.g. defend outnumbered, or attack into a set, even defence) where the selected constraints allow.' },
            { name: 'Transition volatility', directive: 'High volatility — no stoppages, live counters, and chained possession changes.' },
            { name: 'Consequence severity', directive: 'Severe stakes — turnovers and failures carry sharp, immediate consequence and bigger swings.' },
        ],
    },
}

export function getChallengeCalibration(raw: string | undefined | null): ChallengeCalibrationProfile {
    return PROFILES[normalizeChallengeLevel(raw)]
}

/**
 * Structured prompt block telling the assembler how to express the requested challenge level through
 * the environment. Replaces the previous single vague line. The blind-test framing is deliberate:
 * a coach should be able to identify the level from the conditions alone (Christian's 8B test).
 */
export function renderChallengeCalibrationPromptSection(raw: string | undefined | null): string {
    const p = getChallengeCalibration(raw)
    const lines = p.dimensions.map((d) => `- ${d.name}: ${d.directive}`).join('\n')
    return [
        `CHALLENGE CALIBRATION — this activity is "${p.label}".`,
        p.summary,
        'Express this level through the ENVIRONMENT, not by changing the game problem or scripting behaviour. Do not change which archetype, affordances, or constraints are used — only how demanding the conditions are. A coach should be able to tell this is the right level from the setup, rules, and scoring alone:',
        lines,
        'Keep it representative: shift these dimensions only as far as the selected constraint package allows, preserve continuous open play and multiple solutions, and never make a higher level artificial.',
    ].join('\n')
}
