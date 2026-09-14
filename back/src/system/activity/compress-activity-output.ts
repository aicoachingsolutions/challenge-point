/**
 * Phase 4A — Output Translation & Compression.
 *
 * Christian's directive after the Phase 3.5 test cycle: the ecology now works underneath,
 * but the coach-facing output over-explains itself. The bottleneck has shifted from
 * ecological architecture to sideline usability.
 *
 * This pass runs AFTER the activity has been validated (validateGeneratedActivities) and
 * BEFORE the activity is returned to the frontend. It does five things, none of which
 * change what the activity IS — only what the coach sees:
 *
 *   1. Strip the guardrail closing line ("If the live opportunity is forced after it
 *      closes, the opponent inherits the connected advantage immediately.") from scoring
 *      and rules. It already appears in winCondition and surfacing it three times is the
 *      redundancy Christian named.
 *
 *   2. Strip "Players read / Players decide / Players choose" narration from scoring and
 *      rules. These belong in coachingFocus (where they appear naturally as observation
 *      cues). The validator-required decision STEMS (choose / read / react / based on /
 *      decide / adapt / option) survive in their original rule and scoring positions
 *      naturally; only the meta-narration "Players read X before Y" gets dropped.
 *
 *   3. Cross-field semantic dedup. Nonessential rules that overlap heavily with
 *      winCondition are removed, and scoring sentences that overlap heavily with
 *      winCondition or rules are removed from scoring (the longer field).
 *      Token-Jaccard threshold > 0.6 counts as overlap.
 *
 *   4. Cap section length:
 *        - rules: 5 entries max
 *        - scoringSystem: 4 sentences max
 *        - scaffolding (coachingFocus): 3 entries max
 *      Cap selection is by distinctiveness, with hard must-keep predicates for
 *      rules[0] (the explicit exchange rule) and any line carrying slot-modifier text
 *      (Phase 3.5 value-landscape modifiers must survive the cap).
 *
 *   5. Idempotent. compress(compress(x, m), m) deep-equals compress(x, m).
 *
 * The Phase 3.5 modifier preservation requirement is non-negotiable. If a slot's
 * value-landscape modifier text would be dropped by the cap, it gets prioritized in over
 * higher-distinctiveness shared text — because the modifier IS what differentiates this
 * slot from its siblings, and that's the entire point of Phase 3.5.
 *
 * Christian's "go ruthless" cap settings are deliberately aggressive on the first cut.
 * If the next test cycle shows compression has clipped meaning, the caps relax. We
 * don't widen them speculatively.
 */

import type { IActivity } from '../../models/activity.model'
import { translateCoachLanguage } from './coach-language'
import { applyCoachCommunicationStandard, applyStandardToRequiredSection } from './coach-communication-standard'
import {
    deriveEquipment,
    describeWinCondition,
    mergeHowToPlayIntoRules,
    removeScoringFromSetup,
    toCoachingObjective,
} from './coach-facing-sections'
import { toCoachRuleVoice, toCoachScoringSentence } from './coach-voice'
import { rulesForScoredObject, withoutUnscoredObjects, type ScoredObject } from './scoring-object-consistency'
import { withScoringObjectInSetup } from './validate-activity-skeleton'
import {
    isNotAWayToEarnPoints,
    leadWithClearestScoringSentence,
    routeRulesForCoach,
    selectPrimarySuccessCondition,
    toCoachScoringVoice,
    toObservationVoice,
} from './coach-section-ownership'
import { isGenericPointTemplate, isIncentiveExpression } from './incentive-expression'

const RULES_CAP = 5
const SCORING_SENTENCE_CAP = 4
const COACHING_FOCUS_CAP = 3
const SEMANTIC_OVERLAP_THRESHOLD = 0.6

/**
 * The guardrail closing line gets surfaced from assemblyGuardrails.opponentConsequence
 * and appears verbatim (or near-verbatim) in scoring text. The exact wording varies a
 * little across archetypes, so we match by the distinctive opening pattern.
 */
const GUARDRAIL_CLOSE_PATTERN = /\bIf the live opportunity is forced after it closes[^.]*\.\s*/gi

/**
 * Player-narration patterns. These are the meta-pedagogy explanations that should live
 * in coachingFocus only — not in rules and scoring. Match "Players read/decide/choose X"
 * up to the next sentence terminator.
 */
const PLAYER_NARRATION_PATTERNS: RegExp[] = [
    /\bPlayers read [^.]*\.\s*/gi,
    /\bPlayers decide [^.]*\.\s*/gi,
    /\bPlayers choose [^.]*\.\s*/gi,
]

const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'as', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'of', 'by', 'from', 'into', 'this', 'that', 'these',
    'those', 'it', 'its', 'their', 'they', 'them', 'when', 'where', 'while', 'than', 'then', 'if',
    'so', 'only', 'also', 'such', 'each', 'every', 'any', 'all', 'some', 'no', 'not', 'do', 'does',
    'did', 'has', 'have', 'had', 'can', 'may', 'will', 'would', 'should', 'must',
])

function tokenize(text: string): Set<string> {
    return new Set(
        (text || '')
            .toLowerCase()
            .replace(/[^a-z0-9 \-']/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    )
}

function jaccardOverlap(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0
    let intersection = 0
    for (const t of a) if (b.has(t)) intersection += 1
    const union = a.size + b.size - intersection
    return union === 0 ? 0 : intersection / union
}

/**
 * Sentence splitter that handles em-dashes and inline clauses. Returns sentences with
 * trailing punctuation preserved (so the recombined text reads as natural prose).
 */
export function splitSentences(text: string): string[] {
    if (!text) return []
    // Split on sentence terminators followed by whitespace, keeping the terminator.
    const parts = text
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map((s) => s.trim())
        .filter(Boolean)
    return parts
}

/**
 * Distinctiveness ranking: each line is scored by the inverse of its average Jaccard
 * overlap against every other line in the candidate set. Higher score = more distinctive.
 * Tie-break by shorter length (we want compression).
 */
function rankByDistinctiveness(lines: string[]): string[] {
    const tokens = lines.map(tokenize)
    const scored = lines.map((line, i) => {
        let overlapSum = 0
        let count = 0
        for (let j = 0; j < lines.length; j++) {
            if (i === j) continue
            overlapSum += jaccardOverlap(tokens[i], tokens[j])
            count += 1
        }
        const avgOverlap = count === 0 ? 0 : overlapSum / count
        const distinctiveness = 1 - avgOverlap
        return { line, distinctiveness, length: line.length }
    })
    scored.sort((a, b) => {
        if (b.distinctiveness !== a.distinctiveness) return b.distinctiveness - a.distinctiveness
        return a.length - b.length
    })
    return scored.map((s) => s.line)
}

/**
 * Given a list of items and a cap, select up to `cap` items: all must-keep items are
 * preserved (even if it exceeds cap — Phase 3.5 modifier preservation is non-negotiable),
 * remaining slots are filled from the most-distinctive candidates.
 *
 * Returns items in their ORIGINAL input order (not selection-order). This is required for
 * idempotency: compress(compress(x)) === compress(x). Reordering by selection rank means
 * a second pass would reshuffle the surviving lines, breaking the idempotency invariant
 * and making the output non-deterministic across re-renders.
 */
function capByDistinctiveness<T>(
    items: T[],
    isMustKeep: (item: T) => boolean,
    cap: number,
    toRankString: (item: T) => string
): T[] {
    const mustKeepSet = new Set<T>()
    const candidates: T[] = []
    for (const item of items) {
        if (isMustKeep(item)) mustKeepSet.add(item)
        else candidates.push(item)
    }
    const remainingSlots = Math.max(0, cap - mustKeepSet.size)
    const rankedCandidateStrings = rankByDistinctiveness(candidates.map(toRankString))
    const stringToItem = new Map<string, T>()
    for (const item of candidates) stringToItem.set(toRankString(item), item)
    const selectedCandidateSet = new Set<T>()
    let slotsUsed = 0
    for (const s of rankedCandidateStrings) {
        if (slotsUsed >= remainingSlots) break
        const found = stringToItem.get(s)
        if (found !== undefined && !selectedCandidateSet.has(found)) {
            selectedCandidateSet.add(found)
            slotsUsed += 1
        }
    }
    return items.filter((item) => mustKeepSet.has(item) || selectedCandidateSet.has(item))
}

/**
 * Does a line contain (in token-overlap terms) text from any of the modifier
 * mechanicLines? Used to make Phase 3.5 modifier lines must-keep across the cap.
 */
function containsModifierText(line: string, modifierMechanicLines: string[]): boolean {
    if (modifierMechanicLines.length === 0) return false
    const lineTokens = tokenize(line)
    for (const mod of modifierMechanicLines) {
        const modTokens = tokenize(mod)
        if (modTokens.size === 0) continue
        // Use containment rather than Jaccard — a sentence "carries" the modifier if it
        // shares most of the modifier's distinctive tokens, even if the sentence is
        // longer or shorter than the modifier itself.
        let hits = 0
        for (const t of modTokens) if (lineTokens.has(t)) hits += 1
        const containmentRatio = hits / modTokens.size
        if (containmentRatio >= 0.55) return true
    }
    return false
}

/**
 * Strip the guardrail closing line and player-narration patterns from a freeform text
 * field. Returns the cleaned text. Repeated whitespace from removed segments is
 * collapsed.
 *
 * Post-strip cleanup: when a stripped clause sat between two clauses joined by an
 * em-dash (e.g. "advantage — Players decide to X. Y starts here"), removing the middle
 * leaves a dangling " — " connecting two independent clauses ("advantage — Y"). That
 * reads bizarrely. We promote those dangling em-dash boundaries back to proper sentence
 * breaks when the following clause clearly starts an independent scoring/rule sentence
 * (whitelist of safe sentence-start patterns).
 */
function stripScaffoldingNarration(text: string): string {
    if (!text) return ''
    let next = text
    next = next.replace(GUARDRAIL_CLOSE_PATTERN, ' ')
    for (const pat of PLAYER_NARRATION_PATTERNS) {
        next = next.replace(pat, ' ')
    }
    next = next.replace(/\s+/g, ' ').trim()
    // Promote dangling em-dash connectors left behind by stripping a middle clause.
    // Safe-to-promote patterns: clauses that virtually always start an independent
    // scoring or rule sentence after a strip.
    const DANGLING_EM_DASH_PROMOTERS = [
        /\s+—\s+(?=Score awarded\b)/gi,
        /\s+—\s+(?=A point counts\b)/gi,
        /\s+—\s+(?=A point or live advantage counts\b)/gi,
        /\s+—\s+(?=A goal\b)/gi,
        /\s+—\s+(?=A bonus\b)/gi,
        /\s+—\s+(?=Possession kept\b)/gi,
        /\s+—\s+(?=Scoring (tied|awarded|completes)\b)/gi,
        /\s+—\s+(?=Defenders score\b)/gi,
        /\s+—\s+(?=The field is treated\b)/gi,
        /\s+—\s+(?=The working area\b)/gi,
        /\s+—\s+(?=The decision window\b)/gi,
        /\s+—\s+(?=On possession change\b)/gi,
    ]
    for (const re of DANGLING_EM_DASH_PROMOTERS) {
        next = next.replace(re, '. ')
    }

    // GENERAL RULE, because the whitelist above went stale the moment the scoring openers were
    // renamed ("Score awarded for" became "Earn a point for"), and a coach was shown
    // "…use available space to gain advantage — Earn an extra point for quick attacking actions…".
    // A capital letter after a dangling dash means a new sentence started: legitimate em-dash
    // continuations read on in lower case ("advantage — the defending team…"). This is what the
    // whitelist was approximating one phrase at a time.
    next = next.replace(/\s+—\s+(?=[A-Z])/g, '. ')
    // TRAILING connector cleanup. The promoters above only handle a dangling dash with a clause
    // AFTER it; they cannot help when the stripped clause ran to the END of the line. A coach was
    // shown the rule "Score awarded for attacks that use available space to gain advantage —",
    // which stops mid-thought, because the narration clause following the dash was the rest of the
    // sentence.
    //
    // Deliberately a general rule rather than another whitelist entry: the whitelist grows one
    // sighting at a time and only ever covers phrasings someone already noticed, which is how this
    // one survived a fix that claimed to have removed all truncated text.
    next = next.replace(/[\s]*[—–-]\s*$/, '')
    next = next.replace(/[\s]*[,;:]\s*$/, '')
    next = next.replace(/\s+\b(and|or|but|so|because|while|before|after)\b\s*$/i, '')
    next = next.trim()
    // Restore terminal punctuation if the cut removed it, so the line still reads as a sentence.
    if (next && !/[.!?]$/.test(next)) next = `${next}.`
    return next
}

/**
 * Same strips applied to an array of rule entries. Empty / whitespace-only entries are
 * dropped since the validator will have already accepted the bundle by this point.
 */
function stripScaffoldingNarrationFromArray(lines: string[]): string[] {
    return lines
        .map((line) => stripScaffoldingNarration(line))
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
}

/**
 * Does `text` share enough distinctive tokens with any candidate line/sentence to
 * count as repeated environmental truth?
 */
function overlapsAnyCandidate(text: string, candidates: string[]): boolean {
    const textTokens = tokenize(text)
    if (textTokens.size === 0) return false
    return candidates.some((candidate) => {
        const candidateTokens = tokenize(candidate)
        return candidateTokens.size > 0 && jaccardOverlap(textTokens, candidateTokens) >= SEMANTIC_OVERLAP_THRESHOLD
    })
}

/**
 * Remove sentences from `text` whose Jaccard token-overlap with any candidate exceeds
 * SEMANTIC_OVERLAP_THRESHOLD. Used to dedupe scoring against winCondition and rules.
 */
function removeSentencesOverlappingWithCandidates(
    text: string,
    candidates: string[],
    modifierMechanicLines: string[]
): string {
    if (!text || candidates.length === 0) return text
    const sentences = splitSentences(text)
    const kept = sentences.filter((s) => {
        if (containsModifierText(s, modifierMechanicLines)) return true
        return !overlapsAnyCandidate(s, candidates)
    })
    return kept.join(' ').trim()
}

/**
 * Remove sentences that repeat an EARLIER sentence in the same text.
 *
 * Every dedup pass here compared one field against ANOTHER field; none compared a field against
 * itself. That gap was masked: winCondition used to embed scoring's opening sentence, so a scoring
 * sentence duplicated within scoring was usually removed as a side effect of matching winCondition.
 * When winCondition stopped embedding it, real output immediately showed a coach two consecutive
 * sentences differing by one word ("...counts only when..." / "...counts when...").
 *
 * Keeps the FIRST occurrence: earlier sentences carry the archetype's own scoring rule, and later
 * near-copies are restatements.
 */
function removeSelfRepeatingSentences(text: string, modifierMechanicLines: string[]): string {
    if (!text) return text
    const kept: string[] = []
    for (const sentence of splitSentences(text)) {
        if (containsModifierText(sentence, modifierMechanicLines) || !overlapsAnyCandidate(sentence, kept)) {
            kept.push(sentence)
        }
    }
    return kept.join(' ').trim()
}

function removeLinesOverlappingWithCandidates(
    lines: string[],
    candidates: string[],
    modifierMechanicLines: string[],
    isMustKeep: (line: string) => boolean
): string[] {
    if (candidates.length === 0) return lines
    return lines.filter((line) => {
        if (isMustKeep(line) || containsModifierText(line, modifierMechanicLines)) return true
        return !overlapsAnyCandidate(line, candidates)
    })
}

/**
 * Compress the activity for coach-facing output. The mechanics that validate the
 * activity must already have been confirmed present (call validateGeneratedActivities
 * BEFORE this). Compression does not re-validate; it presents.
 *
 * @param activity                The activity returned by the assembly pipeline.
 * @param modifierMechanicLines   The mechanicLine text of any Phase 3.5 slot modifiers
 *                                that apply to this activity (from the skeleton bundle's
 *                                slotMechanicalVariations for this slot). Pass [] for
 *                                a baseline slot (applying slot 1).
 */
export function compressActivityForCoach(activity: IActivity, modifierMechanicLines: string[] = []): IActivity {
    // Step 1: strip the guardrail closing line and player-narration patterns from scoring
    // and rules. winCondition retains the closing-line semantics because the template
    // already includes "The opponent inherits the connected advantage on every misread or
    // forced action under pressure" — same meaning, different wording, more compact.
    const strippedScoring = stripScaffoldingNarration(activity.scoringSystem ?? '')
    const strippedRules = stripScaffoldingNarrationFromArray(activity.rules ?? [])

    // Step 2: cross-field dedup. Win condition is the terminal statement, so repeated
    // nonessential rules defer to it; scoring then defers to win condition and rules.
    // Modifier text is protected throughout.
    const winConditionSentences = splitSentences(activity.winCondition ?? '')
    const exchangeRule = strippedRules[0]
    const dedupedRules = removeLinesOverlappingWithCandidates(
        strippedRules,
        winConditionSentences,
        modifierMechanicLines,
        (line) => line === exchangeRule
    )
    const dedupedScoringAgainstWin = removeSentencesOverlappingWithCandidates(
        strippedScoring,
        winConditionSentences,
        modifierMechanicLines
    )
    const dedupedScoringAgainstRules = removeSentencesOverlappingWithCandidates(
        dedupedScoringAgainstWin,
        dedupedRules,
        modifierMechanicLines
    )
    // ...and finally against ITSELF. Cross-field dedup never caught a field repeating its own
    // content; see removeSelfRepeatingSentences.
    const dedupedScoring = removeSelfRepeatingSentences(dedupedScoringAgainstRules, modifierMechanicLines)

    // Step 2b: SECTION OWNERSHIP. Rules keep only what a coach could read aloud to players;
    // scoring statements defer to Scoring, and design rationale, coaching principles and
    // restatements of the ordinary run of play are dropped. Runs before the cap so the cap spends its budget
    // on rules a coach can act on rather than on sentences explaining why the activity works.
    // See coach-section-ownership.ts — knowledge is untouched, only what gets shown.
    //
    // HOW TO PLAY FOLDS IN HERE, before routing (Christian, 2026-09-10: merge it into Rules unless it
    // holds something Rules cannot). Merging first means the same ownership routing and the same cap
    // apply to its lines as to every other rule, so How to Play cannot smuggle a scoring claim or a
    // design explanation past the rules that already keep those out. See coach-facing-sections.ts.
    const howToPlayLines = Array.isArray((activity as unknown as Record<string, unknown>).howToPlay)
        ? ((activity as unknown as Record<string, unknown>).howToPlay as string[])
        : []
    const setupText = typeof activity.setup === 'string' ? activity.setup : ''
    const rulesWithHowToPlay = mergeHowToPlayIntoRules(howToPlayLines, dedupedRules, setupText)
    const routedRules = routeRulesForCoach(rulesWithHowToPlay, modifierMechanicLines)

    // ONE WAY TO SCORE (RC1.1). When the scoring event was resolved before generation, Rules may not
    // name an object nothing scores on, or state a second way to earn points. Before the cap, so the
    // cap spends its budget on rules that fit the game. See scoring-object-consistency.ts.
    const primaryScoring = activity.systemTrace?.primaryScoring
    const scoredObject: ScoredObject | null = primaryScoring?.setupEvidence
        ? { eventKey: primaryScoring.eventKey, names: primaryScoring.setupEvidence.flat() }
        : null
    const rulesForThisGame = scoredObject
        ? rulesForScoredObject(
              routedRules.rules,
              scoredObject,
              (line) => line === exchangeRule || containsModifierText(line, modifierMechanicLines)
          )
        : routedRules.rules

    // Step 3: cap rules. rules[0] is the explicit exchange rule (validator requires it
    // there) — must-keep. Any rule that carries Phase 3.5 modifier text — must-keep.
    // capByDistinctiveness preserves input order, so rules[0] stays at index 0.
    const cappedRules = capByDistinctiveness(
        rulesForThisGame,
        (line) => line === exchangeRule || containsModifierText(line, modifierMechanicLines),
        RULES_CAP,
        (line) => line
    )

    // Step 4: cap scoring sentences. First sentence (consequence rule) must-keep. Any
    // sentence carrying modifier text — must-keep. Input sentence order preserved.
    // ONCE A REAL INCENTIVE MECHANISM HAS SPOKEN, DROP THE GENERIC TEMPLATE.
    //
    // "A point or live advantage counts…" is the hardcoded per-archetype sentence that used to be
    // the ONLY incentive an activity could express. Now that authored mechanisms produce their own
    // scoring lines, keeping both gives the coach a specific incentive followed by a generic
    // restatement of it — precisely the repetition Christian reported. The template survives only
    // when nothing else says how the game rewards, which is still the honest outcome for the nine
    // realizations authored with no incentive mechanism.
    const allScoringSentences = splitSentences(dedupedScoring)
    const hasSpecificIncentive = allScoringSentences.some((s) => !isGenericPointTemplate(s) && /\b(point|score|bonus|double|advantage)\b/i.test(s))
    const scoringAfterTemplateSuppression = hasSpecificIncentive
        ? allScoringSentences.filter((s) => !isGenericPointTemplate(s))
        : allScoringSentences

    // "How do teams score?" must be answerable from the first sentence — Christian's test is that a
    // coach should not have to reread Scoring to find out how points are earned.
    // Scoring answers one question: how are points earned. Design constraints on how the activity
    // was built are dropped, and what remains is put in the coach's voice ("Score awarded for" ->
    // "Earn a point for"). Never emptied: if every sentence looks like rationale, the coach keeps
    // the original text rather than an empty section.
    const scoringCandidates =
        scoringAfterTemplateSuppression.length > 0 ? scoringAfterTemplateSuppression : allScoringSentences
    const scoringWaysToEarn = scoringCandidates.filter((s) => !isNotAWayToEarnPoints(s))
    const inCoachVoice = leadWithClearestScoringSentence(
        (scoringWaysToEarn.length > 0 ? scoringWaysToEarn : scoringCandidates).map(toCoachScoringVoice)
    )

    // ONE PRIMARY SUCCESS CONDITION, plus this slot's own variation if it has one. Every other
    // reward statement leaves for Coaching Focus — see selectPrimarySuccessCondition for why
    // aggregating them made the section unreadable and several of them unscoreable.
    //
    // UNLESS THE PRIMARY EVENT WAS ALREADY DECIDED (RC1.1). The ranking exists because, without a
    // resolved event, the primary condition had to be picked out of text after the fact — and in real
    // output it picked the wrong side: "attacking the open space" in finishing games with goals and
    // goalkeepers, the regain in counter-attack games. When the event was resolved before generation,
    // its rule IS the primary condition. This slot's value modifier may follow as the one secondary,
    // because it re-weights where points count without adding a competing way to earn them. Every
    // other reward statement, authored incentives included, is relocated exactly as before.
    const pinnedRule = activity.systemTrace?.primaryScoring?.scoringRule
    const ownership = pinnedRule
        ? pinPrimaryScoringRule(pinnedRule, inCoachVoice, (s) => containsModifierText(s, modifierMechanicLines))
        : selectPrimarySuccessCondition(
              inCoachVoice,
              (s) => containsModifierText(s, modifierMechanicLines),
              isIncentiveExpression
          )
    const scoringSentences = ownership
        ? [ownership.primary, ...(ownership.secondary ? [ownership.secondary] : [])]
        : inCoachVoice
    const firstScoringSentence = scoringSentences[0]
    const cappedScoringSentences = capByDistinctiveness(
        scoringSentences,
        (s) => s === firstScoringSentence || isIncentiveExpression(s) || containsModifierText(s, modifierMechanicLines),
        SCORING_SENTENCE_CAP,
        (s) => s
    )
    // Scoring in coach voice, sentence by sentence — the last section still written in engine
    // language once Rules were plain (Christian, 11 Sep). A sentence that is the tail of an
    // already-translated template returns empty and drops out. See coach-voice.ts.
    const finalScoring = cappedScoringSentences.map(toCoachScoringSentence).filter(Boolean).join(' ').trim()

    // Step 5: cap scaffolding (coachingFocus) to 3 entries. No modifier-preservation
    // need here — coachingFocus doesn't carry modifier text; that lives in rules/scoring.
    // Rationale relocated out of Rules joins Coaching Focus, which is the section that owns "what
    // should I watch for". Appended after the authored focus lines so the coach's primary cues stay
    // first, and still subject to the cap.
    // Reward statements that are no longer ways to score become things to watch for. Re-voiced,
    // because "Earn a point for X" sitting under Coaching Focus is the same competing criterion in a
    // new place. The cap widens by two to absorb them rather than silently dropping content that was
    // moved here to be kept.
    // RELOCATED CONTENT MUST NOT BE CROWDED OUT BY BOILERPLATE. Appending it after the authored
    // focus meant the cap dropped it entirely — the section already carried five lines, two of them
    // generic ("Coach observation: focus on the live decisions…"). Content moved here to be KEPT
    // cannot be the first thing cut, so the authored cues take the original cap and the relocations
    // take the widened remainder.
    // Displaced REWARD statements come first. They are representative content a coach can act on
    // ("watch for players creating space"); the rule-layer rationale behind them is true but is the
    // thing most safely lost if only one fits.
    const relocated = [
        ...(ownership?.movedToCoachingFocus ?? []).map(toObservationVoice),
        ...routedRules.movedToCoachingFocus,
    ]
    // IDEMPOTENT BY CONSTRUCTION. Appending relocations after the authored cues broke
    // compress(compress(x)) === compress(x): on a second pass the relocations are part of
    // `scaffolding`, nothing new is relocated, and a plain re-slice cut them straight back out.
    // Interleaving at a fixed position makes the second pass reproduce the first exactly, because
    // the relocated lines simply arrive as later authored entries.
    const authoredFocus = activity.scaffolding ?? []
    const cappedScaffolding = [
        ...new Set([
            ...authoredFocus.slice(0, COACHING_FOCUS_CAP),
            ...relocated.slice(0, 2),
            ...authoredFocus.slice(COACHING_FOCUS_CAP),
        ]),
    ].slice(0, COACHING_FOCUS_CAP + 2)

    // Step 6: final coach-language pass — the Coach Vocabulary & Translation Dictionary applied to
    // every coach-facing field. Lives in ./coach-language so vocabulary can be revised without
    // touching compression, and vice versa. Runs LAST so the dedup/cap logic above still matches on
    // the original engine phrasing.
    // Setup answers "how do I organize it?" and nothing else — a scoring method stated here is a
    // second answer to "how do teams score?", and in real output it disagreed with Scoring.
    const setupWithoutScoring =
        typeof activity.setup === 'string'
            ? removeScoringFromSetup(applyCoachCommunicationStandard(translateCoachLanguage(activity.setup)))
            : activity.setup
    // With a resolved scoring event, Setup marks that object and no other. Cleaning can remove the
    // sentence that marked it (a layout sentence also naming an unscored object), so it is re-ensured.
    const coachSetup =
        typeof setupWithoutScoring === 'string' && scoredObject && primaryScoring?.setupRequirement && primaryScoring.setupEvidence
            ? withScoringObjectInSetup(withoutUnscoredObjects(setupWithoutScoring, scoredObject), {
                  setupRequirement: primaryScoring.setupRequirement,
                  setupEvidence: primaryScoring.setupEvidence,
              })
            : setupWithoutScoring

    // OBJECTIVE — "what are we working on today?" (Christian, 2026-09-10). The Communication Standard
    // removes what must not be said; this then picks the one sentence that names the intention, or
    // falls back to the coach's own goal. See toCoachingObjective for the order and why.
    // An intention naming an object nothing scores on ("…to reach the end zone") is not today's work,
    // so with a resolved scoring event it is set aside and the coach's own goal names the intention.
    const translatedObjective = typeof activity.intent === 'string' ? translateCoachLanguage(activity.intent) : ''
    const rawObjective = scoredObject ? withoutUnscoredObjects(translatedObjective, scoredObject, 'drop') : translatedObjective
    const coachObjective =
        typeof activity.intent === 'string'
            ? toCoachingObjective(
                  applyStandardToRequiredSection(rawObjective),
                  rawObjective,
                  activity.systemTrace?.planning?.learningGoalName
              ).text
            : activity.intent

    return {
        ...activity,
        // COACH COMMUNICATION STANDARD (RC2) runs LAST, after the vocabulary dictionary. Translation
        // swaps terms; the standard removes whole clauses that describe cognition or announce
        // purpose. Doing it last means it also cleans up anything translation introduced.
        //
        // WHAT A COACH READS is six sections — Objective, Setup, Rules, Scoring, Win Condition,
        // Equipment — plus Teams behind an optional expansion (Christian, 2026-09-10). The other
        // fields below are still produced, because the output validator requires them and the engine
        // reasons with them; they are simply no longer shown. See coach-facing-sections.ts.
        title: translateCoachLanguage(activity.title),
        setup: coachSetup,
        // Rules answer "what do players have to do?" — in coach voice. toCoachRuleVoice runs FIRST,
        // swapping the engine's validator-coupled sentence for what a coach would say putting cones
        // out; the vocabulary pass and the Communication Standard then run on that. See
        // coach-voice.ts for why this is a translation rather than a rewrite at source.
        rules: cappedRules
            .map((r) => applyCoachCommunicationStandard(translateCoachLanguage(toCoachRuleVoice(r))))
            .filter(Boolean),
        // Folded into Rules above. Left as an empty array rather than removed so an activity always
        // has the same shape, and the section simply does not render.
        howToPlay: [],
        scoringSystem: applyCoachCommunicationStandard(translateCoachLanguage(finalScoring)),
        // "When does the activity end?" — which the engine's template never said. The coach told us.
        winCondition:
            typeof activity.winCondition === 'string' || activity.duration
                ? applyCoachCommunicationStandard(
                      translateCoachLanguage(describeWinCondition(activity.winCondition, activity.duration))
                  )
                : activity.winCondition,
        // Read off the Setup the coach will actually lay out, replacing the engine's hedged
        // one-line placeholder. A coach-edited list is kept as they wrote it.
        equipmentNeeded: deriveEquipment(activity.equipmentNeeded, typeof coachSetup === 'string' ? coachSetup : ''),
        // NOT COACH-FACING since 2026-09-10: Christian judged Coaching Focus redundant with the
        // Learning Goal and the Objective. Still produced — the validator requires the field and its
        // observation language carries the decision vocabulary the structural check looks for — but
        // no screen shows it. It stays exempt from the Communication Standard, because it is the one
        // place perception language is the content rather than a leak.
        scaffolding: cappedScaffolding.map((s) => (typeof s === 'string' ? translateCoachLanguage(s) : s)),
        intent: coachObjective,
        // NOT COACH-FACING since 2026-09-10 ("Constraint should not be coach-facing"). Kept intact:
        // it carries the selected constraint package summary, which the validator checks — removing
        // it is what caused the generation outage of 2026-08-16.
        constraint: typeof activity.constraint === 'string' ? applyCoachCommunicationStandard(translateCoachLanguage(activity.constraint)) : activity.constraint,
        // Shown to coaches as "Teams", behind the optional expansion. The field name is historical:
        // it holds the team structure (map-structured-activity-to-legacy puts `activity.teams` here),
        // not progressions.
        extensions: Array.isArray(activity.extensions)
            ? activity.extensions.map((e) =>
                  typeof e === 'string' ? applyCoachCommunicationStandard(translateCoachLanguage(e)) : e
              )
            : activity.extensions,
    }
}

/**
 * Ownership when the primary scoring event was resolved before generation: the resolved rule leads,
 * this slot's modifier may follow, and every other reward sentence is relocated. Sentences that are
 * pieces of the rule itself (scoring is split into sentences upstream) are recognised and dropped
 * rather than relocated as if they competed with it.
 */
function pinPrimaryScoringRule(
    rule: string,
    sentences: string[],
    isSlotModifier: (sentence: string) => boolean
): NonNullable<ReturnType<typeof selectPrimarySuccessCondition>> {
    const flatten = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()
    const ruleText = flatten(rule)
    const others = sentences.filter((sentence) => !ruleText.includes(flatten(sentence)))
    const secondary = others.find(isSlotModifier) ?? null
    return { primary: rule, secondary, movedToCoachingFocus: others.filter((sentence) => sentence !== secondary) }
}

/**
 * Apply compression to every activity in an assembly result, using the corresponding
 * slot's modifier mechanicLines from the skeleton bundle.
 */
export function compressActivitiesForCoach<T extends IActivity>(
    activities: T[],
    perSlotModifierLines: string[][]
): T[] {
    if (perSlotModifierLines.length === 0) {
        return activities.map((a) => compressActivityForCoach(a, []) as T)
    }
    return activities.map((a, i) => {
        const mods = perSlotModifierLines[i] ?? []
        return compressActivityForCoach(a, mods) as T
    })
}
