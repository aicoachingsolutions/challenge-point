/**
 * WHAT A COACH READS: Objective, Setup, Rules, Scoring, Win Condition, Equipment.
 *
 * Christian's decision, 2026-09-10, after the section inventory showed ten coach-facing sections
 * against the five in his One Question Per Section table: simplify to these six, and move or remove
 * everything else. The governing test he gave, in his words:
 *
 *   "If a coach wouldn't naturally say it before starting an activity, the activity probably
 *    shouldn't say it either. The engine should perform the educational reasoning. The activity
 *    should communicate only what the coach needs to confidently organize and run the activity."
 *
 * This module holds the section-level decisions that follow from that, as pure functions. It runs in
 * the compress layer — AFTER output validation — on purpose. The validator reads the engine's full
 * narrative (objective, win condition, coaching focus and all) to confirm the representative design
 * is present, and an earlier outage came from changing text the validator depended on. So the
 * engine keeps proving its design to the validator, and only what the coach reads is shaped here.
 *
 * Nothing in this file invents coaching content. Every output is either the engine's own text
 * selected or reordered, the coach's own words, or arithmetic on facts the coach entered.
 */

// ---------------------------------------------------------------------------------------------
// OBJECTIVE — "What are we working on today?"
// ---------------------------------------------------------------------------------------------

/**
 * Sentence shapes that explain the learning rather than name it.
 *
 * Every one of these is a real generated Objective from 2026-09-08, which Christian rejected in
 * favour of intentions like "Create and use space to play forward":
 *
 *   "Success depends on recognizing and exploiting space, especially in wide channels."
 *   "The focus is on recognizing and using space effectively to break lines."
 *   "Recognizing when a channel is open due to defensive shifts is crucial for successful attacks."
 *   "The challenge is to read the transition moment and decide whether to press…"
 *
 * The cause was upstream and explicit: the model was instructed that the objective "should describe
 * the decision problem players read". That instruction is changed too, but this is the guarantee —
 * the model has ignored clearer instructions than that one before.
 */
const NOT_A_COACHING_INTENTION: ReadonlyArray<RegExp> = [
    /^\s*(?:success|progress|improvement)\s+(?:depends|comes|relies)\b/i,
    /^\s*the\s+(?:key|focus|challenge|aim|goal|objective|idea|purpose|emphasis|point)\s+(?:is|here|of|lies)\b/i,
    /\bis\s+(?:crucial|key|essential|vital|critical)\b/i,
    /\b(?:recogni[sz]\w*|perceiv\w*|perception|decision-?making|understand\w*|awareness|cognitive)\b/i,
    /\b(?:players|they)\s+(?:learn|discover|develop)\b/i,
    /\bthis\s+(?:activity|game|exercise|practice|session)\b/i,
]

/**
 * Longer than this and it is a paragraph, not something said before kick-off. Christian's three
 * examples run six to nine words.
 */
const MAX_INTENTION_WORDS = 25

function words(value: string): number {
    return value.trim().split(/\s+/).filter(Boolean).length
}

function sentencesOf(value: string): string[] {
    return value
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
}

function withFullStop(value: string): string {
    const trimmed = value.trim().replace(/[,;:\s]+$/, '')
    if (!trimmed) return ''
    const capitalised = trimmed[0]!.toUpperCase() + trimmed.slice(1)
    return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`
}

export function isCoachingIntention(sentence: string): boolean {
    if (!sentence.trim()) return false
    if (words(sentence) > MAX_INTENTION_WORDS) return false
    return !NOT_A_COACHING_INTENTION.some((pattern) => pattern.test(sentence))
}

/** Coach framing around a goal, removed so what is left is the intention itself. */
const GOAL_FRAMING: ReadonlyArray<RegExp> = [
    /^\s*(?:help|helping|get|teach|coach|encourage)\s+(?:my\s+|our\s+|the\s+)?(?:players|team|kids|group)\s+(?:to\s+)?/i,
    /^\s*(?:we|i)\s+(?:want|need|would\s+like)\s+(?:my\s+|our\s+|the\s+)?(?:players|team|kids|group)\s+to\s+/i,
]

/**
 * A goal written as a PROBLEM rather than an intention: "Players keep winning the ball but turning
 * away from field vision." There is no honest way to turn that into "what we are working on" without
 * writing coaching content, which is not this module's job — so it is declined, not rewritten.
 */
const PROBLEM_DESCRIPTION =
    /^\s*(?:players|we|they|our|my|the\s+team)\s+(?:keep|are|aren't|don't|do\s+not|can't|cannot|struggle|always|never|lose|panic)\b|\bbut\b/i

/** "Break Defensive Lines" -> "Break defensive lines". Registry names are title-cased. */
function fromTitleCase(value: string): string {
    const tokens = value.trim().split(/\s+/)
    const isTitleCase = tokens.length > 1 && tokens.every((t) => /^[A-Z0-9]/.test(t))
    if (!isTitleCase) return value.trim()
    return tokens.map((t, i) => (i === 0 ? t : /^[A-Z][a-z]/.test(t) ? t.toLowerCase() : t)).join(' ')
}

/**
 * The coach's own learning goal, as an intention — or null when it cannot honestly be one.
 *
 * The guided conversation submits "Learning Goal. Practice situation. Optional note." as one string,
 * so only the first sentence is the goal.
 */
export function intentionFromLearningGoal(goal?: string): string | null {
    if (!goal?.trim()) return null

    let first = sentencesOf(goal)[0] ?? goal
    for (const framing of GOAL_FRAMING) first = first.replace(framing, '')
    first = fromTitleCase(first.replace(/[.!?]+$/, ''))

    if (!first || words(first) < 2 || PROBLEM_DESCRIPTION.test(first)) return null
    return withFullStop(first)
}

/**
 * The game form's authored objective, which the engine appends as "Session focus: …".
 *
 * The Communication Standard removes that label from coach text, correctly — but the phrase after it
 * is authored in the Knowledge Core and is already a coaching intention ("Maintain possession with
 * forward intent."). It is generic to the game form, so it is a last resort rather than a first
 * choice, but it is still better than an explanation.
 */
export function gameFormObjective(rawObjective: string): string | null {
    const match = /Session focus:\s*([^.]+)\./i.exec(rawObjective)
    return match ? withFullStop(match[1]!) : null
}

export type ObjectiveSource = 'generated' | 'learning-goal' | 'game-form' | 'fallback'

export interface CoachingObjective {
    text: string
    /** Which route produced it. Recorded so the audit can show how often each one fires. */
    source: ObjectiveSource
}

/**
 * One sentence naming what we are working on today.
 *
 * In order of preference:
 *   1. The first generated sentence that passes the intention test. It is specific to THIS activity
 *      ("Defend the central corridor by organizing quickly after losing possession"), which the
 *      other sources are not.
 *   2. The coach's own learning goal — literally their answer to "what are we working on today?".
 *   3. The game form's authored objective.
 *   4. Whatever the Communication Standard left, so the section is never empty.
 *
 * @param cleanedObjective the objective after the Coach Communication Standard
 * @param rawObjective     the objective before it, which still carries "Session focus: …"
 */
export function toCoachingObjective(
    cleanedObjective: string,
    rawObjective: string,
    learningGoal?: string
): CoachingObjective {
    const generated = sentencesOf(cleanedObjective).find(isCoachingIntention)
    if (generated) return { text: withFullStop(generated), source: 'generated' }

    const fromGoal = intentionFromLearningGoal(learningGoal)
    if (fromGoal) return { text: fromGoal, source: 'learning-goal' }

    const fromGameForm = gameFormObjective(rawObjective)
    if (fromGameForm && isCoachingIntention(fromGameForm)) return { text: fromGameForm, source: 'game-form' }

    return { text: withFullStop(sentencesOf(cleanedObjective)[0] ?? cleanedObjective), source: 'fallback' }
}

// ---------------------------------------------------------------------------------------------
// HOW TO PLAY -> RULES
// ---------------------------------------------------------------------------------------------

/**
 * A line that says how points are earned. Scoring owns that question, and a How to Play line stating
 * its own scoring method is the same defect as the slot incentive that rewarded regains: real output
 * read "Score by reaching the opponent's end zone" beside a Scoring section that paid for
 * line-breaking passes. Two answers to "how do teams score?" in one activity.
 */
const STATES_HOW_TO_SCORE =
    /^\s*(?:score|scoring|earn)\b|\bto\s+score\b|\b(?:score|earn)s?\s+(?:a\s+)?points?\b|\bpoints?\s+(?:are|is)\s+(?:scored|awarded|earned)\b|\b(?:bonus|extra|double)\s+points?\b|\bscoring\s+is\s+weighted\b|\b(?:is|are)\s+worth\s+(?:more|double|extra)\b/i

/**
 * A Setup sentence that states how points are scored.
 *
 * Measured 2026-09-10, slot 3 of all three inputs. One activity's Setup read "Score by completing a
 * pass into the opponent's end zone, with bonus points for using the wide channels", its Rules said
 * "Utilize wide channels for bonus points when scoring", and its Scoring section paid for breaking a
 * defensive line — three answers to "how do teams score?". Another's Setup read "Scoring is
 * weighted: extra points for goals scored from a channel entry" beside a Scoring section that said
 * nothing about channels. Christian's new review question is exactly "was it immediately clear how
 * teams score?", and a coach reading either would rightly say no.
 *
 * Stricter than the Rules test on purpose. Setup legitimately says what teams attack ("Each team
 * attacks a goal at the opposite end") and how play restarts after a goal; neither is a scoring
 * method, and "attack the end zones to score" is still Setup's business. Only sentences that open
 * with scoring, or that price something in points, are Scoring's.
 */
const SETUP_STATES_SCORING =
    /^\s*(?:score|scoring)\b|\b(?:bonus|extra|double)\s+points?\b|\bpoints?\s+(?:are|is)\s+(?:scored|awarded|earned|weighted)\b|\b(?:earn|earns|win|wins)\s+(?:a\s+)?points?\b|\b(?:is|are)\s+worth\s+(?:more|double|extra)\b/i

/**
 * A scoring clause riding on the end of a Setup sentence that is otherwise layout: "A numerical
 * overload is created in the central channel, and scoring is weighted for successful use of
 * overloads." The layout half is Setup's; the clause comes off and the sentence stays.
 */
const SETUP_SCORING_CLAUSE = /,?\s+(?:and|with)\s+scoring\s+(?:is\s+)?weighted\b[^.!?]*/gi

/**
 * Setup answers one question — "how do I organize it?" — so sentences that answer "how do teams
 * score?" leave it. Scoring already owns that answer; nothing is lost, and the contradiction goes.
 * Never empties the section: if every sentence were scoring (it never has been), the original stays.
 */
export function removeScoringFromSetup(setup: string): string {
    const kept = sentencesOf(setup.replace(SETUP_SCORING_CLAUSE, ''))
        .map((sentence) => withFullStop(sentence))
        .filter((sentence) => !SETUP_STATES_SCORING.test(sentence))
    return kept.length > 0 ? kept.join(' ') : setup
}

/** How play BEGINS — Setup's job ("how play begins, and how it restarts" is in its brief). */
const BEGINS_PLAY =
    /^\s*(?:(?:the\s+)?coach\s+)?(?:start|starts|begin|begins|kick\s*-?\s*off)\b|^\s*play\s+(?:begins|starts)\b/i
/** How play RESTARTS. */
const RESTARTS_PLAY =
    /^\s*(?:(?:the\s+)?coach\s+)?(?:restart|restarts)\b|^\s*play\s+restarts\b|^\s*if\s+the\s+ball\s+goes\s+out\b|^\s*after\s+a\s+(?:score|goal|point)\b/i
const SETUP_STATES_BEGINNING = /\b(?:begins?|starts?|kick\s*-?\s*off)\b/i
const SETUP_STATES_RESTART = /\b(?:restarts?|out\s+of\s+play|ball\s+goes\s+out|after\s+a\s+(?:score|goal|point))\b/i

const STOPWORDS = new Set(['with', 'from', 'that', 'this', 'into', 'their', 'your', 'when', 'after', 'before', 'play', 'team', 'teams', 'ball'])

function contentTokens(value: string): Set<string> {
    return new Set(
        value
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
            .map((t) => t.replace(/s$/, ''))
    )
}

/** Most of this line's content already appears in an existing rule. */
function repeatsAnExistingRule(line: string, rules: readonly string[]): boolean {
    const own = contentTokens(line)
    if (own.size === 0) return true
    return rules.some((rule) => {
        const theirs = contentTokens(rule)
        let shared = 0
        for (const token of own) if (theirs.has(token)) shared++
        return shared / own.size >= 0.6
    })
}

/**
 * Fold How to Play into Rules. Christian: How to Play "should only exist if it contains information
 * that cannot naturally fit into Rules. Otherwise, merge it into Rules."
 *
 * Everything How to Play carries is an answer to "how does play work?", which is Rules' question —
 * so in practice it always merges, and the section disappears. Each line goes to whichever section
 * already owns what it says:
 *
 *   - how points are earned        -> nowhere; Scoring owns it (and usually disagreed with it)
 *   - how play begins / restarts   -> nowhere, when Setup already says it; otherwise kept
 *   - neutral players, when Setup has none -> nowhere; they describe players who are not there
 *   - a restatement of a rule      -> nowhere
 *   - anything else                -> Rules, FIRST
 *
 * First, because these are the model's short plain-language lines and the engine's rules are long
 * and mechanical; a coach reading Rules top-down should meet "Switch roles after a score" before
 * "A regain completes only when followed by a connected forward action…". The rules cap still
 * applies downstream, with the exchange rule and slot modifiers still protected.
 */
export function mergeHowToPlayIntoRules(howToPlay: readonly string[], rules: readonly string[], setup: string): string[] {
    const setupHasNeutrals = /\bneutrals?\b/i.test(setup)
    const setupHasExtraPlayer = /\bextra\s+players?\b/i.test(setup)
    const kept: string[] = []

    for (const raw of howToPlay) {
        const line = raw.trim()
        if (!line) continue
        if (STATES_HOW_TO_SCORE.test(line)) continue
        if (BEGINS_PLAY.test(line) && SETUP_STATES_BEGINNING.test(setup)) continue
        if (RESTARTS_PLAY.test(line) && SETUP_STATES_RESTART.test(setup)) continue
        if (!setupHasNeutrals && /\bneutrals?\b/i.test(line)) continue
        // Same for an "extra player": once the format module has taken a phantom one out of Setup,
        // a Rules line built around it describes a player who is not on the field.
        if (!setupHasExtraPlayer && /\bextra\s+players?\b/i.test(line)) continue
        if (repeatsAnExistingRule(line, [...rules, ...kept])) continue
        kept.push(withFullStop(line))
    }

    return [...kept, ...rules]
}

// ---------------------------------------------------------------------------------------------
// WIN CONDITION — "When does the activity end?"
// ---------------------------------------------------------------------------------------------

/**
 * The engine's win condition, written once for every activity:
 *
 *   "Teams compete live under two-sided opposition, and the team with more points when play ends
 *    wins. The opponent inherits the connected advantage on every misread or forced action under
 *    pressure."
 *
 * It never says when play ends — the one question the section exists to answer — and its second
 * sentence fails Christian's test outright: no coach says "the opponent inherits the advantage on
 * every misread" before kick-off. What it means is already in Rules, as the exchange rule.
 *
 * The coach told us how long the activity is. That is the answer.
 */
const ENGINE_WIN_CONDITION = /the\s+team\s+with\s+more\s+points\s+when\s+play\s+ends\s+wins/i

export function describeWinCondition(existing: string | undefined, durationMinutes?: number): string {
    // Anything other than the engine's own template is someone's deliberate condition — a coach's
    // edit, or a future authored one — and is not ours to replace.
    if (existing?.trim() && !ENGINE_WIN_CONDITION.test(existing)) return existing

    const minutes = Number(durationMinutes)
    return Number.isFinite(minutes) && minutes > 0
        ? `Play for ${minutes} minutes. The team with more points at the end wins.`
        : 'The team with more points when time is up wins.'
}

// ---------------------------------------------------------------------------------------------
// EQUIPMENT
// ---------------------------------------------------------------------------------------------

/**
 * The engine's equipment line, identical on every activity: "Marking cones or discs if needed for
 * zones described in setup." Equipment is now one of the six core sections, and a hedged generic
 * line in a core section fails the same test — a coach does not say "if needed".
 */
const ENGINE_EQUIPMENT_DEFAULT = /marking\s+cones\s+or\s+discs\s+if\s+needed/i

const MARKED_ZONES = /\b(?:zones?|channels?|corridors?|lanes?|thirds?|grids?|boxes?)\b/i
const GOALS_AS_EQUIPMENT =
    /\b(?:small|mini|pop-?\s*up)\s+goals?\b|\bgoals?\s+(?:at|on)\s+(?:each|either|both|opposite)\s+ends?\b|\b(?:defends?|attacks?|protects?)\s+(?:a|one|the|their|its)\s+goal\b|\btwo\s+goals\b/i
const SMALL_GOALS = /\b(?:small|mini|pop-?\s*up)\s+goals?\b/i

/**
 * What to bring, read off the Setup the coach will lay out.
 *
 * Deliberately conservative: it names categories and never counts. Setup text says "small goals at
 * each end" far more reliably than it says how many, and an invented number is exactly the kind of
 * made-up parameter the playing-area work removed. Scoring events ("after a goal") are not equipment
 * and do not match — only goals described as things on the field do.
 */
export function deriveEquipment(existing: readonly string[] | undefined, setup: string): string[] {
    const current = (existing ?? []).map((e) => e.trim()).filter(Boolean)
    const isEngineDefault = current.length === 0 || current.every((e) => ENGINE_EQUIPMENT_DEFAULT.test(e))
    // A coach-edited list is theirs. Only the engine's placeholder is replaced.
    if (!isEngineDefault) return current

    const items = [MARKED_ZONES.test(setup) ? 'Cones to mark the area and its zones' : 'Cones to mark the area']
    items.push(/\bneutrals?\b/i.test(setup) ? 'Bibs for two teams and the neutral players' : 'Bibs for two teams')
    items.push('Balls')
    if (GOALS_AS_EQUIPMENT.test(setup)) items.push(SMALL_GOALS.test(setup) ? 'Small goals' : 'Goals')

    return items
}
