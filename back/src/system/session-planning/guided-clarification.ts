/**
 * Guided clarification for broad coach terms.
 *
 * WHERE THIS COMES FROM. The Session Creation Experience Specification, "Intelligent Guidance":
 * when a coach begins with a broad concept, the platform should respond conversationally — "When
 * does this become most difficult during games?" — and offer directions. Its stated aim is worth
 * keeping in view: "The objective is not validation. The objective is richer planning context."
 *
 * Christian routed a specific case here at the Cycle 8 close-out: "defend" and "defending" are
 * "genuinely ambiguous coaching terms rather than routing failures. A coach saying 'today we're
 * working on defending' hasn't yet expressed a planning intention." Rather than forcing them into a
 * Learning Goal, they become part of this experience.
 *
 * WHY THERE IS NO LIST OF BROAD TERMS HERE.
 *
 * The first version of this file carried the Experience Specification's five example terms as a
 * constant. The sport-coupling guard rejected it, and it was right to — those examples are SPORT
 * VOCABULARY, and a hardcoded list of them in a sport-neutral file is precisely the leak the whole
 * workbook exercise exists to prevent. A different sport would need an entirely different list, and
 * nothing here should know which sport it is serving.
 *
 * So breadth is MEASURED instead of declared: a term is broad when it could lead to more than one
 * Learning Goal. That definition is sport-neutral, needs no vocabulary in code, and is truer to what
 * Christian actually said — the problem with "defending" is not that it is a technique word, it is
 * that it has not yet narrowed to a single planning intention. It also self-adjusts: as the registry
 * and its coach language grow, terms become broad or specific without anyone maintaining a list.
 *
 * THE OWNERSHIP SPLIT. The QUESTION is experience, from the Experience Specification, and ours to
 * render. The DIRECTIONS are knowledge, derived from the registry. Neither is authored here.
 */
import { sessionPlanningModel } from './session-planning-model'

/** The coach-facing question, verbatim from the Experience Specification. */
export const CLARIFYING_QUESTION = 'When does this become most difficult during games?'

/**
 * A term leading to this many Learning Goals or more is broad enough to be worth a question.
 *
 * Two is the honest threshold: one destination is an answer and needs no clarification, while two
 * genuinely competing destinations mean the coach has not yet said which they mean.
 */
const BREADTH_THRESHOLD = 2

export interface ClarificationDirection {
    learningGoalId: string
    learningGoal: string
    phase: string
    /** The situation that makes this direction concrete, when the goal declares one. */
    example: string | null
}

export interface Clarification {
    term: string
    question: string
    directions: ClarificationDirection[]
}

const norm = (value: unknown): string => String(value ?? '').trim().toLowerCase()

/**
 * Which Learning Goals a term could plausibly lead to.
 *
 * Phase first, and the order matters. A term naming a phase should offer that whole phase rather
 * than whichever single goal happens to mention the word; falling back the other way would answer a
 * phase-level term with one arbitrary goal and quietly hide the rest.
 */
function directionsFor(term: string): ClarificationDirection[] {
    const needle = norm(term)
    const goals = sessionPlanningModel.learningGoals()

    const byPhase = goals.filter((goal) => norm(goal['Phase']).includes(needle))

    const byLanguage = goals.filter((goal) => {
        const id = String(goal['ID'])
        if (norm(goal['Learning Goal']).includes(needle) || norm(goal['Coach Definition']).includes(needle)) return true
        return sessionPlanningModel
            .entryLanguage()
            .some((entry) => String(entry['Learning Goal ID']) === id && norm(entry['Coach Phrase']).includes(needle))
    })

    const matched = byPhase.length > 0 ? byPhase : byLanguage

    return matched.map((goal) => {
        const id = String(goal['ID'])
        const situations = sessionPlanningModel.practiceSituationsFor(id)
        return {
            learningGoalId: id,
            learningGoal: String(goal['Learning Goal'] ?? ''),
            phase: String(goal['Phase'] ?? ''),
            // One concrete situation makes the direction recognisable — the spec's own examples are
            // situation-flavoured ("Against a compact defense") rather than bare goal names.
            example: situations.length > 0 ? String(situations[0]['Practice Situation'] ?? '') : null,
        }
    })
}

/**
 * Terms the WORKBOOK treats as terms in their own right — the only things eligible to be broad.
 *
 * Two sources, both authored:
 *
 *   PHASE WORDS. A phase names a whole region of the game, so its words are broad by definition.
 *   This is what makes "defending" and "defend" work, which is the case Christian routed here.
 *
 *   SINGLE-WORD ENTRY PHRASES. A word Christian authored as an entry phrase on its own is a term a
 *   coach genuinely opens with.
 *
 * Splitting MULTI-word phrases into component words was tried first and was wrong: it produced
 * "after", "through" and "back" as broad terms, out of "Immediately After Winning Possession" and
 * "build from the back". A coach typing "back" would have been asked which of two planning
 * intentions they meant — noise dressed as helpfulness. A word only counts if the workbook treats it
 * as a phrase in its own right.
 */
function candidateTerms(): Set<string> {
    const candidates = new Set<string>()

    for (const goal of sessionPlanningModel.learningGoals()) {
        for (const word of norm(goal['Phase']).split(/\W+/)) {
            if (word.length > 3) candidates.add(word)
        }
    }

    for (const entry of sessionPlanningModel.entryLanguage()) {
        const phrase = norm(entry['Coach Phrase'])
        if (phrase.length > 3 && !phrase.includes(' ')) candidates.add(phrase)
    }

    return candidates
}

/**
 * Clarification for what the coach typed, or `null` when nothing useful can be asked.
 *
 * Null in two different situations, both correct: the term leads somewhere specific (no question
 * needed — let them through), or it leads nowhere at all (a question offering nothing is worse than
 * no question, because it stops the coach without helping).
 */
export function clarificationFor(term: string): Clarification | null {
    const needle = norm(term)
    // A multi-word phrase is already a narrowing — "win the ball back" is a planning intention in a
    // way "defend" is not — so breadth is only assessed for single words.
    if (!needle || needle.includes(' ')) return null
    // Candidacy is checked HERE as well as when building the served list, so this function and the
    // list can never disagree. Without it, "after" clarifies through this entry point while being
    // absent from what the client was given — the kind of split that produces a bug nobody can
    // reproduce.
    if (!candidateTerms().has(needle)) return null

    const directions = directionsFor(needle)
    if (directions.length < BREADTH_THRESHOLD) return null

    return { term: needle, question: CLARIFYING_QUESTION, directions }
}

/**
 * Every single word appearing in the registry's own coach-facing language that turns out to be
 * broad, precomputed and served with the planning registry.
 *
 * The candidate words come from the WORKBOOK — phase names, goal names, entry phrases — so no
 * vocabulary is invented here. Serving them lets the client recognise a broad term as the coach
 * types, without a round trip and without the client holding any planning knowledge.
 */
export function allClarifications(): Clarification[] {
    return [...candidateTerms()]
        .map((term) => clarificationFor(term))
        .filter((c): c is Clarification => c !== null)
        .sort((a, b) => a.term.localeCompare(b.term))
}
