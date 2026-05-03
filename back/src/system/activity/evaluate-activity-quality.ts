import type { Activity } from './activity-schema'
import { findPrescriptivePhraseViolations } from './validate-activity-structure'

export interface ActivityQualityEvaluation {
    oppositionQuality: 0 | 1 | 2
    decisionQuality: 0 | 1 | 2
    consequenceQuality: 0 | 1 | 2
    ecologicalIntegrity: 0 | 1 | 2
    coachingUsability: 0 | 1 | 2
    total: number
    status: 'PASS' | 'FAIL'
    reasons: string[]
}

const ISOLATED = /\bunopposed\b|\bwithout defenders\b|\bisolated drill\b|\bline up\b|\btake turns\b|\bone at a time\b|\bcoach serves\b/i
const LIVE_OPP =
    /\b(live|contested|v\.?s\.?|attackers|defenders|defend|press|pressing|pressure|contest|break on|turnover|regain|counter|opposing)\b/i
const TOKEN_OPP = /\b(opponent|opponents|defender|defensive|attack|attacking|pressure|challenge|oppose|opposed)\b/i

const PREDETERMINED = /\b(always|same pattern|one way|fixed|designated|only the|the only)\b/i
const MULTI_DECISION =
    /(\bchoose\b.*\bor\b|\bor\b.*\bchoose\b|\bmultiple\b|\bseveral\b|\bbased on\b|\bif\b.*\bthen\b|\bread\b.*\b(react|opponent|pressure)|\badapt\b|\boption\b.*\boption\b)/i
const WEAK_DECISION = /\b(choose|read|react|decide|when to|whether|if\b|adapt|option)\b/i

const STRONG_CONSEQ =
    /\b(turnover|misread|counter|regain|advantage|opponent gains|live advantage|pressure\s+(forces|wins)|restart\s+for|transition)\b/i
const GENERIC_SCORE = /\b(points?|score|goal|win|lose|bonus|penalty)\b/i

const TECH_DRILL = /\brehearse\b|\bpractice the\b|\btechnical\b|\bcone dribbling\b|\bdemo\b|\bone-touch only\b|\btwo-touch only\b/i
const ECO_STRONG =
    /\b(goal|goals|channel|half[- ]space|transition|end\s*zone|overload|underload|numbers|width|depth|cue|perception)\b/i

/** Minimum combined length for coaching usability baseline (setup + teams + objective). */
const MIN_RUNNABLE_LENGTH = 120

export function joinActivityForQuality(activity: Activity): string {
    return [
        activity.title,
        activity.setup,
        activity.teams,
        activity.objective,
        activity.scoring,
        ...activity.rules,
        ...activity.constraints,
        ...activity.coachingFocus,
    ].join('\n')
}

function scoreOpposition(full: string): 0 | 1 | 2 {
    if (ISOLATED.test(full)) return 0
    const hasLive = LIVE_OPP.test(full) && (/\bvs\.?\b|\battackers\b|\bdefenders\b/i.test(full) || STRONG_CONSEQ.test(full))
    if (hasLive) return 2
    if (TOKEN_OPP.test(full)) return 1
    return 0
}

function scoreDecision(full: string): 0 | 1 | 2 {
    if (PREDETERMINED.test(full)) return 0
    if (MULTI_DECISION.test(full)) return 2
    const wc = (full.match(/\b(and|or)\b/gi) ?? []).length
    if (WEAK_DECISION.test(full) && wc >= 2) return 2
    if (WEAK_DECISION.test(full)) return 1
    return 0
}

function scoreConsequence(activity: Activity, full: string): 0 | 1 | 2 {
    const scoringLine = activity.scoring.trim()
    if (!GENERIC_SCORE.test(scoringLine) && !GENERIC_SCORE.test(full)) return 0
    if (STRONG_CONSEQ.test(full) || /\b(if|when)\b.*\b(opponent|counter|turnover|gain)\b/i.test(scoringLine)) return 2
    return 1
}

function scoreEcological(full: string): 0 | 1 | 2 {
    if (TECH_DRILL.test(full) && !LIVE_OPP.test(full)) return 0
    if (ECO_STRONG.test(full) && LIVE_OPP.test(full)) return 2
    if (/\b(field|pitch|zone|space|game)\b/i.test(full)) return 1
    return 0
}

function scoreCoachingUsability(activity: Activity): 0 | 1 | 2 {
    const core = `${activity.setup} ${activity.teams} ${activity.objective}`.trim()
    const cf = activity.coachingFocus.join(' ').trim()
    if (core.length < 60 || cf.length < 20) return 0
    const hasStructure = /\d|\bx\s*\d|\bzone\b|\bhalf\b|\bgoal\b|\bm\b|\byards?\b/i.test(activity.setup)
    const cfConcrete = /\b(watch|when|if|first|look for|cue|pressure)\b/i.test(cf)
    if (core.length >= MIN_RUNNABLE_LENGTH && hasStructure && cfConcrete) return 2
    if (core.length >= 80) return 1
    return 0
}

/**
 * Heuristic quality rubric (deterministic, text-based). Does not call external AI.
 * PASS: total >= 8, no dimension 0, no prescriptive red flags.
 */
export function evaluateActivityQuality(activity: Activity): ActivityQualityEvaluation {
    const full = joinActivityForQuality(activity)
    const prescriptive = findPrescriptivePhraseViolations(full)

    const oppositionQuality = scoreOpposition(full)
    const decisionQuality = scoreDecision(full)
    const consequenceQuality = scoreConsequence(activity, full)
    const ecologicalIntegrity = scoreEcological(full)
    const coachingUsability = scoreCoachingUsability(activity)

    const total =
        oppositionQuality + decisionQuality + consequenceQuality + ecologicalIntegrity + coachingUsability

    const anyZero =
        oppositionQuality === 0 ||
        decisionQuality === 0 ||
        consequenceQuality === 0 ||
        ecologicalIntegrity === 0 ||
        coachingUsability === 0
    const passBar = total >= 8 && !anyZero && prescriptive.length === 0
    const status: 'PASS' | 'FAIL' = passBar ? 'PASS' : 'FAIL'

    const reasons: string[] = []
    if (!passBar) {
        if (prescriptive.length > 0) {
            for (const p of prescriptive) {
                reasons.push(`Prescriptive red flag: ${p}`)
            }
        } else {
            if (oppositionQuality === 0) {
                reasons.push('Opposition quality 0: isolated / no live defender interaction.')
            }
            if (decisionQuality === 0) {
                reasons.push('Decision quality 0: predetermined or no clear choice.')
            }
            if (consequenceQuality === 0) {
                reasons.push('Consequence quality 0: no score or outcome.')
            }
            if (ecologicalIntegrity === 0) {
                reasons.push('Ecological integrity 0: technique drill or weak game representativeness.')
            }
            if (coachingUsability === 0) {
                reasons.push('Coaching usability 0: unclear or unusable setup / coaching focus.')
            }
            if (anyZero) {
                reasons.push('At least one rubric category scored 0.')
            }
            if (total < 8) {
                reasons.push(`Total ${total} < 8 (threshold).`)
            }
        }
    }

    return {
        oppositionQuality,
        decisionQuality,
        consequenceQuality,
        ecologicalIntegrity,
        coachingUsability,
        total,
        status,
        reasons,
    }
}
