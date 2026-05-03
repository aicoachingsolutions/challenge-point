import type { Activity } from './activity-schema'
import { normalizeText } from '../text'

export interface ActivityDiversityEvaluation {
    titleRepeats: string[]
    setupSimilarityFlags: string[]
    scoringSimilarityFlags: string[]
    constraintExpressionRepeats: string[]
    repeatedKeywords: string[]
    diversityStatus: 'PASS' | 'FAIL'
    reasons: string[]
}

const WIDE_FRAMING = /\bwide\s*zones?\b|\bwide\s*channels?\b|\bwide\s*areas?\b|\bwide\s*flank/i
const TRANSITION_FRAMING = /\btransition\b/i

function tokens(text: string): Set<string> {
    const t = normalizeText(text)
        .split(/[^a-z0-9]+/)
        .filter((x) => x.length > 3)
    return new Set(t)
}

function jaccard(a: Set<string>, b: Set<string>): number {
    let inter = 0
    for (const x of a) {
        if (b.has(x)) inter++
    }
    const u = a.size + b.size - inter
    return u === 0 ? 0 : inter / u
}

function clusterIndices(
    texts: string[],
    threshold: number
): { size: number; indices: number[] }[] {
    const n = texts.length
    const parent = Array.from({ length: n }, (_, i) => i)
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
    const union = (a: number, b: number) => {
        const ra = find(a)
        const rb = find(b)
        if (ra !== rb) parent[ra] = rb
    }
    const tok = texts.map((t) => tokens(t))
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (jaccard(tok[i], tok[j]) >= threshold) union(i, j)
        }
    }
    const groups = new Map<number, number[]>()
    for (let i = 0; i < n; i++) {
        const r = find(i)
        if (!groups.has(r)) groups.set(r, [])
        groups.get(r)!.push(i)
    }
    return [...groups.values()].map((indices) => ({ size: indices.length, indices }))
}

function joinConstraints(a: Activity): string {
    return a.constraints.join(' | ')
}

/** Learning goal suggests width / channels / overload / space — wide framing is on-topic. */
function inputSuggestsWideFraming(learningGoal: string): boolean {
    return /\b(wide|width|channel|overload|space\s+behind|angles?|support|flank)/i.test(learningGoal)
}

function inputSuggestsTransitionFraming(learningGoal: string): boolean {
    return /\b(transition|turnover|regain|counter|pressing|intercept|defensive\s+lines?|break\s+lines?)/i.test(learningGoal)
}

/**
 * Cross-corpus diversity diagnostic for a list of `Activity` values (e.g. first activity per pipeline run).
 * Does not modify activities; measurement only.
 */
export function evaluateActivityDiversity(
    activities: Activity[],
    learningGoals: string[]
): ActivityDiversityEvaluation {
    const titleRepeats: string[] = []
    const setupSimilarityFlags: string[] = []
    const scoringSimilarityFlags: string[] = []
    const constraintExpressionRepeats: string[] = []
    const repeatedKeywords: string[] = []
    const reasons: string[] = []

    if (activities.length === 0) {
        return {
            titleRepeats,
            setupSimilarityFlags,
            scoringSimilarityFlags,
            constraintExpressionRepeats,
            repeatedKeywords,
            diversityStatus: 'FAIL',
            reasons: ['No activities supplied for diversity measurement.'],
        }
    }

    const normTitles = activities.map((a) => normalizeText(a.title))
    const titleCount = new Map<string, string>()
    for (const t of normTitles) {
        const display = activities.find((a) => normalizeText(a.title) === t)?.title ?? t
        titleCount.set(t, display)
    }
    const seenTitle = new Map<string, number>()
    for (const t of normTitles) {
        seenTitle.set(t, (seenTitle.get(t) ?? 0) + 1)
    }
    for (const [norm, count] of seenTitle.entries()) {
        if (count > 1) {
            const display = titleCount.get(norm) ?? norm
            titleRepeats.push(`${display} (×${count})`)
            reasons.push(`Repeated title: "${display}" appears ${count} times.`)
        }
    }

    const setups = activities.map((a) => a.setup)
    for (const c of clusterIndices(setups, 0.52)) {
        if (c.size >= 3) {
            const snippet = normalizeText(setups[c.indices[0]]).slice(0, 72)
            setupSimilarityFlags.push(`cluster_size_${c.size}: "${snippet}…"`)
            reasons.push(`Setup similarity: ${c.size} activities share high token overlap (Jaccard ≥ 0.52).`)
        }
    }

    const scorings = activities.map((a) => a.scoring)
    for (const c of clusterIndices(scorings, 0.5)) {
        if (c.size >= 3) {
            const snippet = normalizeText(scorings[c.indices[0]]).slice(0, 72)
            scoringSimilarityFlags.push(`cluster_size_${c.size}: "${snippet}…"`)
            reasons.push(`Scoring similarity: ${c.size} activities share high overlap in scoring text.`)
        }
    }

    const constraintBlobs = activities.map(joinConstraints)
    for (const c of clusterIndices(constraintBlobs, 0.58)) {
        if (c.size >= 3) {
            constraintExpressionRepeats.push(`cluster_size_${c.size}`)
            reasons.push(`Constraint language: ${c.size} activities use nearly identical constraint strings (Jaccard ≥ 0.58).`)
        }
    }

    let wideHeavy = 0
    let transitionHeavy = 0
    let wideOnWeakInput = 0
    for (let i = 0; i < activities.length; i++) {
        const blob = [activities[i].title, activities[i].setup, activities[i].objective, activities[i].scoring, ...activities[i].constraints].join(
            ' '
        )
        if (WIDE_FRAMING.test(blob)) wideHeavy++
        if (TRANSITION_FRAMING.test(blob)) transitionHeavy++
        const goal = learningGoals[i] ?? ''
        if (WIDE_FRAMING.test(blob) && TRANSITION_FRAMING.test(blob) && !inputSuggestsWideFraming(goal)) {
            wideOnWeakInput++
        }
    }
    const n = activities.length
    const goalsWide = learningGoals.filter(inputSuggestsWideFraming).length
    const goalsTransition = learningGoals.filter(inputSuggestsTransitionFraming).length

    if (wideHeavy >= Math.max(3, Math.ceil(n * 0.75))) {
        repeatedKeywords.push(`wide_framing_hits:${wideHeavy}/${n}`)
    }
    if (transitionHeavy >= Math.max(3, Math.ceil(n * 0.75))) {
        repeatedKeywords.push(`transition_keyword_hits:${transitionHeavy}/${n}`)
    }
    if (wideOnWeakInput >= 3) {
        repeatedKeywords.push(`wide_plus_transition_on_narrow_goal:${wideOnWeakInput}/${n}`)
        reasons.push(
            `"Wide zone" style framing combined with "transition" appears strongly on ${wideOnWeakInput} runs whose learning goal did not emphasize width/channels/overload/space (possible overuse).`
        )
    }

    let wideDominatesUnrelated = false
    if (wideHeavy >= 4 && goalsWide < 2) {
        wideDominatesUnrelated = true
        reasons.push(
            `Wide-zone-style language appears in ${wideHeavy}/${n} activities while fewer than two learning goals emphasized width/channels/overload/space framing.`
        )
        repeatedKeywords.push('wide_zone_dominates_corpus_vs_inputs')
    }

    let transitionDominatesUnrelated = false
    if (transitionHeavy >= 4 && goalsTransition < 2) {
        transitionDominatesUnrelated = true
        reasons.push(
            `"Transition" appears in ${transitionHeavy}/${n} activities while fewer than two learning goals emphasized transition/turnover/regain/pressing framing.`
        )
        repeatedKeywords.push('transition_dominates_corpus_vs_inputs')
    }

    const fail =
        titleRepeats.length > 0 ||
        setupSimilarityFlags.length > 0 ||
        scoringSimilarityFlags.length > 0 ||
        constraintExpressionRepeats.length > 0 ||
        wideOnWeakInput >= 3 ||
        wideDominatesUnrelated ||
        transitionDominatesUnrelated

    return {
        titleRepeats,
        setupSimilarityFlags,
        scoringSimilarityFlags,
        constraintExpressionRepeats,
        repeatedKeywords,
        diversityStatus: fail ? 'FAIL' : 'PASS',
        reasons: fail ? reasons : [],
    }
}
