/**
 * Coach Language layer — implements Christian's **Coach Vocabulary & Translation Dictionary RC1**
 * (the "what words to choose" contract) and the parts of the **Coach Communication Standard RC1**
 * that are mechanically checkable.
 *
 * WHY THIS IS A SEPARATE MODULE. In the Knowledge Core's three-layer model, this is the third
 * layer — Knowledge Object (what the intervention IS) → Selection Metadata (how the engine finds
 * and ranks it) → **Rule Realization (how it becomes coach-facing language)**. The canonical
 * libraries own the first two and we must not edit them; the wording is ours, governed by the
 * dictionary. Keeping it here means Christian can revise vocabulary without touching selection,
 * and selection can change without touching vocabulary.
 *
 * WHAT THIS IS NOT. It is not a thesaurus applied to AI prose. Dictionary Rule 1 is "translate
 * ideas, never translate individual words literally", so everything below targets a specific
 * *internal* term that has no business reaching a coach — engine vocabulary, library names, and
 * object titles. General prose is left alone.
 *
 * ENFORCEMENT POSTURE. `NEVER_DISPLAY_TERMS` (dictionary §9 + §6) are scrubbed where we have a
 * translation and *reported* where we don't — deliberately not thrown. Representative Validation
 * classifies coach-language problems as correctable ("Revise"), not constitutive ("Reject"), and
 * its correction hierarchy puts output-language correction at the lowest layer. A coach should
 * never lose an activity because a word leaked; the leak should become evidence instead. See
 * `findNeverDisplayViolations`.
 */

/**
 * Dictionary §9 "Never Display List", plus the three library names §6 marks never-display.
 * These are internal ontology terms. If one reaches coach-facing text, the translation layer has
 * a gap — that is a reportable defect, not a stylistic preference.
 *
 * Matching is whole-word and case-insensitive. Entries are stored lowercase; `label` is what we
 * show a developer in the violation report.
 */
export const NEVER_DISPLAY_TERMS: readonly string[] = [
    // §9 Never Display List
    'affordance',
    'affordances',
    'canonical knowledge object',
    'knowledge object',
    'ontology',
    'semantic routing',
    'environmental manipulation',
    'interaction regulation',
    'functional object',
    'competitive interaction opportunity',
    'perception-action coupling',
    'perception–action coupling', // en-dash variant, as printed in the dictionary
    'representative information',
    'nonlinear pedagogy',
    'self-organization',
    'self-organisation',
    // §6 Cross-Library Translation — "Never display" entries
    'information design',
] as const

/**
 * Cross-library translation (§6) and engine-vocabulary translation (Coach Communication Standard
 * §5). Ordered: longer/more specific patterns first, because a later rule must not consume the
 * text a more specific earlier rule was meant to match.
 *
 * Each entry replaces an *internal* term with the coach-facing wording the dictionary names.
 * Where the dictionary offers several acceptable phrasings we take the "Preferred" one — Rule 5
 * allows natural variation, but varying wording per-render would break the idempotency invariant
 * that `compressActivityForCoach` depends on, so variation belongs upstream in generation, not
 * here.
 */
export const COACH_LANGUAGE_TRANSLATIONS: ReadonlyArray<readonly [RegExp, string]> = [
    // — Library names (§6). Never display the internal library; say what it does.
    [/\benvironmental manipulations?\b/gi, 'change to the setup'],
    [/\binteraction regulations?\b/gi, 'condition'],
    [/\binformation design\b/gi, 'what players need to notice'],

    // — Ontology terms (§9) that have a natural coach equivalent. Terms with no safe short
    //   equivalent are deliberately absent: they should never be generated in the first place,
    //   and findNeverDisplayViolations reports them rather than papering over them.
    [/\bfunctional object\b/gi, 'ball'],
    [/\bcompetitive interaction opportunit(?:y|ies)\b/gi, 'contest'],
    [/\brepresentative information\b/gi, 'game information'],

    // — Engine vocabulary (CCS §5). Pre-existing rules, retained verbatim: these were found by
    //   Christian in real output (Round 8D.3) and each one is evidence-backed.
    [/\bplayer structure logic:\s*/gi, ''],
    [/\bconnected advantage\b/gi, 'advantage'],
    [/\bdecision window\b/gi, 'window'],
    [/\bopportunity window\b/gi, 'window'],
    [/\bremains live\b/gi, 'stays live'],
    [/\bremain live\b/gi, 'stay live'],
    [/\bdisrupts structure\b/gi, 'disrupts the shape'],

    // — Engine framing found in the current deterministic templates. These read as system
    //   descriptions of the activity rather than as instructions to a coach.
    [/\bas a live game condition\b/gi, ''],
    [/\bthe listed constraints\b/gi, 'these conditions'],
    [/\blisted constraints\b/gi, 'these conditions'],
    [/\bdirectional target or progression\b/gi, 'attacking direction'],
]

/**
 * Dictionary §7 "Coach Prompt Vocabulary". Observation prompts should invite the coach to *look*,
 * not to *judge*. The Coach Communication Standard makes the same point from the other side: a
 * coaching priority should answer "what should I notice?".
 *
 * We rewrite the avoided opener to a preferred one rather than deleting the line, because the
 * content of the prompt is still useful — only its stance is wrong.
 *
 * The interrogative is CAPTURED AND RE-EMITTED rather than replaced by a fixed one. Dictionary
 * Rule 3 is that simpler language must never change the intended meaning, and "Assess how players
 * respond" and "Notice whether players respond" ask different questions — one is about manner, the
 * other about occurrence. A unit test pins this.
 */
export const PROMPT_OPENER_TRANSLATIONS: ReadonlyArray<readonly [RegExp, string]> = [
    [/^\s*evaluate\s+(whether|how|if|when|where)\b/i, 'Watch $1'],
    [/^\s*evaluate\b/i, 'Watch'],
    [/^\s*assess\s+(whether|how|if|when|where)\b/i, 'Notice $1'],
    [/^\s*assess\b/i, 'Notice'],
    // "Ensure …" and "Optimize …" take different preferred openers because of what follows them.
    // "Ensure" is followed by a CLAUSE ("ensure players keep the ball"), so it needs "Watch
    // whether" to stay grammatical — "Look for players keep the ball" is not English. "Optimize"
    // is followed by a NOUN PHRASE ("optimize the spacing"), which "Notice" takes cleanly.
    [/^\s*ensure\s+(?:that\s+)?/i, 'Watch whether '],
    [/^\s*optimi[sz]e\b/i, 'Notice'],
]

/** Preferred openers (§7) — exported so tests and future authoring can assert against one list. */
export const PREFERRED_PROMPT_OPENERS: readonly string[] = [
    'Watch',
    'Notice',
    'Look for',
    'See whether',
    'Pay attention to',
] as const

const DECISION_VERBS = '(?:decide|decides|deciding|choose|chooses|choosing|select|selects|selecting)'
const DECISION_STUTTER = new RegExp(`\\b(${DECISION_VERBS})\\s+to\\s+(${DECISION_VERBS})\\b`, 'gi')

/**
 * Decision-verb stutter collapse (Round 9). Upstream rewrites ("players must decide" → "players
 * decide") composed with AI phrasing ("must decide to choose…") produce "players decide to
 * decide". A CATEGORY rule — any chained pair of decision verbs collapses to the second, more
 * specific verb — not a phrase-by-phrase list.
 */
export function collapseDecisionStutter(value: string): string {
    return value.replace(DECISION_STUTTER, (_m, _a: string, b: string) => b)
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Whole-word matchers for the never-display list, built once. Hyphenated entries are matched with
 * explicit boundaries because `\b` behaves awkwardly around hyphens and en-dashes.
 */
const NEVER_DISPLAY_MATCHERS: ReadonlyArray<readonly [string, RegExp]> = NEVER_DISPLAY_TERMS.map(
    (term) => [term, new RegExp(`(?<![\\w-])${escapeRegExp(term)}(?![\\w-])`, 'i')] as const
)

/**
 * Which never-display terms appear in `text`? Returns the matched terms (lowercase, deduped).
 *
 * Mirrors `findPrescriptivePhraseViolations` in validate-activity-structure.ts on purpose — same
 * shape, same call style, so the two guardrails read alike at their call sites.
 */
export function findNeverDisplayViolations(text: string): string[] {
    const value = String(text ?? '')
    if (!value) return []
    const found = new Set<string>()
    for (const [term, matcher] of NEVER_DISPLAY_MATCHERS) {
        if (matcher.test(value)) found.add(term)
    }
    return [...found]
}

/**
 * Apply the coach-language contract to one string.
 *
 * Order matters: library/ontology translation runs before prompt-opener rewriting (an opener rule
 * anchors to the start of the line, and a §6 substitution can change what sits at the start), and
 * stutter collapse runs last so it also catches stutters introduced by a substitution.
 */
export function translateCoachLanguage(value: string): string {
    let out = String(value ?? '')
    for (const [re, rep] of COACH_LANGUAGE_TRANSLATIONS) out = out.replace(re, rep)
    for (const [re, rep] of PROMPT_OPENER_TRANSLATIONS) out = out.replace(re, rep)
    out = collapseDecisionStutter(out)
    return (
        out
            // Substitutions that delete a clause can leave doubled spaces, orphaned punctuation,
            // or a lowercase sentence start where the removed words used to be.
            .replace(/\s{2,}/g, ' ')
            .replace(/\s+([.,;])/g, '$1')
            .replace(/([.,;])\1+/g, '$1')
            .trim()
    )
}
