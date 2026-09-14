/**
 * ONE WAY TO SCORE IN WHAT A COACH READS.
 *
 * Christian's review question for every activity is "Was it immediately clear how teams score?".
 * With the primary scoring event resolved before generation (RC1.1), Scoring states exactly one event.
 * But real output on 13 Sep (39 activities across the 13 guided goals) kept the game form's default
 * objects everywhere else:
 *   * Setup: "Teams attack the end zones" beside a Scoring rule about a line; "two 18 m end zones"
 *     and then "Put a goal at each end"; "a field with no fixed zones" and then "Mark a protected zone";
 *   * Rules: "Choose to attack the opponent's end zone" in a game scored on regains, "Points are
 *     weighted based on successful overload use", and the slot's "A regain only counts if…" in games
 *     that never score a regain;
 *   * Objective: "…to reach the end zone" in a game scored on a target zone.
 * Telling the model its object was the only one did not hold it. So, as with player format and
 * playing area, the coach-facing text is made consistent deterministically.
 *
 * WHERE IT RUNS: compression, AFTER output validation, and only for an activity that carries a
 * resolved scoring event. The engine's validated text is never touched, and free-text goals are
 * unaffected.
 *
 * WHAT IS REMOVED: only language naming a scoring object the activity does NOT score on, or a second
 * way to earn points.
 *   * A sentence whose subject attacks, defends, reaches or scores on the object ("Teams attack the end
 *     zones"): it describes an objective the game does not have.
 *   * Otherwise just the clause carrying it ("…with a central corridor and two end zones"), so that
 *     the area, layout and team format in the same sentence survive.
 *   * A sentence that cannot be cut cleanly is dropped, unless it carries the area or team format.
 * Restart language is rewritten rather than removed: "restart from the defensive end zone" means the
 * team's own end, and "after a goal" means after a score.
 *
 * The caller re-adds the scoring object's own sentence if cleaning removed it, so Setup never loses
 * the one object that matters.
 *
 * The object nouns below are presentation vocabulary, like the phrase lists in
 * coach-section-ownership.ts, and belong in the sport module's presentation section once it has one.
 */

export interface ScoredObject {
    /** The event the activity scores on: a value of the controlled scoring-event vocabulary. */
    eventKey: string
    /** Whole-word names of what it scores on: the resolved event's setup evidence, flattened. */
    names: readonly string[]
}

const END_ZONE = /\bend\s+zones?\b/i
const GOAL = /\bgoals?\b(?!\s+kicks?)/i

/** Every noun that names a scoring object. Which of them are unscored depends on the activity. */
const OBJECT_NOUNS: readonly RegExp[] = [
    END_ZONE,
    /\btarget\s+zones?\b/i,
    /\bscoring\s+zones?\b/i,
    /\bfinishing\s+zones?\b/i,
    /\battacking\s+zones?\b/i,
    /\bprotected\s+zones?\b/i,
    /\bend\s+lines?\b/i,
    /\btarget\s+lines?\b/i,
    /\bescape\s+lines?\b/i,
    /\battacking\s+lines?\b/i,
    /\bprotected\s+lines?\b/i,
    /\btarget\s+players?\b/i,
    /\bgates?\b/i,
    GOAL,
]

/** A sentence stating an objective: its subject attacks, defends, reaches or scores on something. */
const OBJECTIVE_SENTENCE =
    /^\s*(?:the\s+|each\s+|both\s+|two\s+|all\s+)?(?:teams?|players|attackers|defenders|attacking\s+team|defending\s+team|overloaded\s+team)\b[^.!?]*?\b(?:attack|attacks|attacking|defend|defends|defending|score|scores|scoring|reach|reaches|reaching|aim|aims|progress|progresses|move|moves|enter|enters)\b/i

/** An objective pointing back at objects a previous sentence named: "Teams attack and defend these zones." */
const REFERS_BACK_TO_OBJECTS = /\b(?:these|those)\s+(?:zones?|areas?|lines?|goals?|targets?)\b/i

/** The team format and the playing area. A sentence carrying either is cut rather than dropped. */
const PLAYER_FORMAT = /\b\d+\s*v\s*\d+\b|\bteams?\s+of\s+\d+\b|\b\d+\s+players\b/i
const PLAYING_AREA = /\b\d+\s*x\s*\d+\s*(?:m|yd)\b/i
const CARRIES_FORMAT = new RegExp(`${PLAYER_FORMAT.source}|${PLAYING_AREA.source}`, 'i')

const AREA_WITH_UNITS = /\b\d+\s*x\s*\d+\s*(?:m|yd)\b(?:\s*\(\d+\s*x\s*\d+\s*(?:m|yd)\))?/i
const VERSUS_FORMAT = /\b\d+\s*v\s*\d+\b/i
const TEAMS_OF = /\bteams?\s+of\s+\d+\b/i
const PLAYER_COUNT = /\b\d+\s+players\b/i

/**
 * The team format and area a sentence states, as a sentence of their own. For a sentence that cannot
 * be cut clean of an unscored object and is the only place its format is stated. Real output: "Teams
 * attack end zones located at each end of a 40 x 30 m (44 x 33 yd) field." in a game scored on a
 * protected zone becomes "Play in a 40 x 30 m (44 x 33 yd) area."
 */
function formatOnlySentence(sentence: string): string {
    const area = AREA_WITH_UNITS.exec(sentence)?.[0]
    const versus = VERSUS_FORMAT.exec(sentence)?.[0]
    const teams = TEAMS_OF.exec(sentence)?.[0]
    const count = PLAYER_COUNT.exec(sentence)?.[0]
    const who = versus ? `Play ${versus}` : teams ? `Play with ${teams}` : count ? `Play with ${count}` : area ? 'Play' : ''
    if (!who) return ''
    return `${who}${area ? ` in a ${area} area` : ''}.`
}

/** "…with no fixed zones", beside a Setup that then marks the zone the game scores on. */
const NO_ZONES = /\s+with\s+no\s+(?:additional\s+|fixed\s+|specific\s+|extra\s+|other\s+|marked\s+)?zones\b/gi
/** The same said on its own: "No zones; play is continuous with live transitions." */
const NO_ZONES_LEADING = /(^|[.!?]\s+)(?:there\s+are\s+)?no\s+(?:additional\s+|fixed\s+|specific\s+|extra\s+|other\s+|marked\s+)?zones\s*[;,.]\s*/gi

/**
 * Points a line awards in its own terms: "Goals from overloads earn 2 points.", "a 2-point scoring
 * system", "Weighted scoring based on successful use of overload", "wide channels that provide scoring
 * bonuses".
 */
const AWARDS_ITS_OWN_POINTS =
    /\b(?:\d+|one|two|three|double|triple|bonus|extra)[-\s]+points?\b|\bscoring\s+system\b|\bweighted\s+scor(?:e|es|ing)\b|\bbonus(?:es)?\b/i

/** The slot variation defining when a regain counts. It means nothing in a game that never scores one. */
const REGAIN_COUNTS = /^\s*a\s+regain\s+(?:only\s+)?(?:completes|counts)\b/i

/** A Rules line stating a way to earn points. Scoring owns that answer, and it already states one. */
const STATES_A_WAY_TO_SCORE =
    /\b(?:points?|scores?|scoring)\s+(?:is|are)\s+(?:weighted|awarded|earned|doubled)\b|\b(?:bonus|extra|double)\s+points?\b|\b(?:earn|earns|win|wins)\s+(?:a\s+)?points?\b|\b(?:is|are)\s+rewarded\b|\b(?:is|are)\s+worth\s+(?:more|double|extra|a\s+point)\b/i

/**
 * A Setup sentence stating a way to score. Real output, 13 Sep: "Progress the ball through the central
 * corridor to score." beside a Scoring rule about a finishing zone; "Numerical overloads and weighted
 * scoring are in effect."; "Two score in small goals at each end." Scoring owns that answer, and the
 * caller re-adds the object's own sentence if this removed the only one marking it.
 */
const SETUP_STATES_A_WAY_TO_SCORE = /\bto\s+score\b|\bscores?\s+(?:by|in|into|on|through)\b|\bweighted\s+scoring\b|\bbonus\s+points?\b/i

/** An intention naming where to score: "Create numerical overloads to score in the central zone." */
const SCORES_SOMEWHERE = /\bscor(?:e|es|ing)\s+(?:in|into|inside|through|within)\b/i

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function namesTheScoredObject(sentence: string, scored: ScoredObject): boolean {
    return scored.names.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(sentence))
}

function unscoredNouns(scored: ScoredObject): RegExp[] {
    return OBJECT_NOUNS.filter((noun) => !scored.names.some((name) => noun.test(name)))
}

function firstMatch(text: string, nouns: readonly RegExp[]): { index: number; end: number } | null {
    let best: { index: number; end: number } | null = null
    for (const noun of nouns) {
        const match = noun.exec(text)
        if (match && (best === null || match.index < best.index)) {
            best = { index: match.index, end: match.index + match[0].length }
        }
    }
    return best
}

function sentencesOf(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
}

function finishSentence(sentence: string): string {
    const trimmed = sentence
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.!?])/g, '$1')
        .replace(/,\s*([.!?])/g, '$1')
        .trim()
        .replace(/[,;:]\s*$/, '')
    if (!trimmed) return ''
    const capitalised = trimmed[0]!.toUpperCase() + trimmed.slice(1)
    return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`
}

/**
 * Restart references keep their meaning without naming an object the game does not have. Only the
 * noun-phrase forms are rewritten ("the defensive end zone"), never a verb phrase ("each attacking and
 * defending end zones"), which would read "each attacking and defending end".
 */
function rewriteReferences(text: string, nouns: readonly RegExp[]): string {
    let next = text
    if (nouns.includes(END_ZONE)) {
        next = next.replace(/\b(the|their|your|its)\s+(own|defensive|defending)\s+end\s+zones?\b/gi, '$1 $2 end')
        next = next.replace(/\b(team's|teams')\s+end\s+zones?\b/gi, '$1 end')
        next = next.replace(/\bfrom\s+(?:the|their|your)\s+end\s+zones?\b/gi, 'from their own end')
    }
    if (nouns.includes(GOAL)) {
        next = next.replace(/\b(after)\s+(a|each|every)\s+goal\b/gi, (_m, after: string, det: string) => `${after} ${det} score`)
        next = next.replace(/\b(a)\s+goal\s+is\s+scored\b/gi, (_m, a: string) => `${a} point is scored`)
    }
    return next
}

/**
 * Cut the clause carrying the object: from the last clause boundary before it (", ", " and ",
 * " with ", " plus ") to the next boundary after it. Refuses, returning null, when there is no
 * boundary to cut at or when the cut would take the area or team format with it.
 */
function cutClause(sentence: string, match: { index: number; end: number }): string | null {
    let start = -1
    for (const boundary of sentence.slice(0, match.index).matchAll(/,\s|\s(?:and|with|plus)\s/gi)) start = boundary.index ?? start
    if (start < 0) return null

    const after = /,\s|\s(?:and|with)\s|[.!?]\s*$/i.exec(sentence.slice(match.end))
    const end = after ? match.end + after.index : sentence.length
    const removed = sentence.slice(start, end)
    if (CARRIES_FORMAT.test(removed)) return null

    let rest = sentence.slice(end)
    // "…field with two end zones and a central zone." -> "…field with a central zone."
    if (/^\s+with\s/i.test(removed) && /^\s+and\s/i.test(rest)) rest = rest.replace(/^\s+and\s/i, ' with ')
    // "…two teams, each defending and attacking end zones." cuts at the inner "and", stranding
    // ", each defending" (or, in real output, "Two teams of 6 players each, defending."), which said
    // nothing without its object.
    return `${sentence.slice(0, start)}${rest}`.replace(/,\s+(?:(?:each|both|one|all)\s+[a-z]+|[a-z]+ing)\s*([.!?]?)\s*$/i, '$1')
}

/** Words that belong to the object's own noun phrase before the noun: "two 18 m (20 yd) end zones". */
const NOUN_PHRASE_LEAD = /(?:\b(?:a|an|the|two|one|both|four|\d+)\s+)?(?:\d+\s*(?:m|yd)\s+(?:\(\d+\s*(?:m|yd)\)\s+)?(?:deep\s+|wide\s+|long\s+)?)?$/i
/** ...and after it: "end zones at either end". */
const NOUN_PHRASE_TAIL = /^(?:\s+(?:at|on)\s+(?:each|either|both|opposite)\s+ends?)?/i

/**
 * Cut only the object's own noun phrase, repairing the connector around it. Tried BEFORE a clause cut,
 * because the clause can hold the area too. Real output, 13 Sep: "Play 6v6 with two 18 m (20 yd) end
 * zones at either end of a 40 x 30 m (44 x 33 yd) area." has no clause boundary a cut could stop at
 * before the area, so the whole sentence, end zones included, was kept to protect the area. Returns
 * null when there is no connector it knows how to repair.
 */
function cutNounPhrase(sentence: string, match: { index: number; end: number }): string | null {
    const lead = NOUN_PHRASE_LEAD.exec(sentence.slice(0, match.index))
    const tail = NOUN_PHRASE_TAIL.exec(sentence.slice(match.end))
    const before = sentence.slice(0, match.index - (lead?.[0].length ?? 0))
    const after = sentence.slice(match.end + (tail?.[0].length ?? 0))

    // "…with two end zones at either end of a 40 x 30 m area." -> "…in a 40 x 30 m area."
    if (/\swith\s+$/i.test(before) && /^\s+of\s+/i.test(after)) return `${before.replace(/\s+with\s+$/i, ' in ')}${after.replace(/^\s+of\s+/i, '')}`
    // "…with two end zones in a 40 x 30 m area." -> "…in a 40 x 30 m area."
    if (/\swith\s+$/i.test(before) && /^\s+(?:in|inside|on)\s+/i.test(after)) return `${before.replace(/\s+with\s+$/i, '')}${after}`
    // "…grid with central and end zones." shares one head noun, so cutting "and end zones" would leave
    // "…grid with central." (real output). The modifier keeps the noun: "…grid with a central zone."
    const sharedHead = /\b(central|wide|middle|side|outer|inner)\s+and\s+$/i.exec(before)
    if (sharedHead) {
        const head = (sentence.slice(match.index, match.end).split(/\s+/).pop() ?? '').replace(/s$/i, '')
        const prefix = before.slice(0, sharedHead.index)
        const article = /\b(?:with|has|have|includes?|into)\s+$/i.test(prefix) ? 'a ' : ''
        return `${prefix}${article}${sharedHead[1]} ${head}${after}`
    }
    // "…a central corridor and two end zones." -> "…a central corridor."
    if (/\s(?:and|plus)\s+$/i.test(before)) return `${before.replace(/\s+(?:and|plus)\s+$/i, '')}${after}`
    // "…with two end zones and a central zone." -> "…with a central zone."
    if (/^\s+and\s+/i.test(after)) return `${before}${after.replace(/^\s+and\s+/i, '')}`
    return null
}

/** Whether text names a scoring object this activity does not score on. */
export function namesUnscoredObject(text: string, scored: ScoredObject): boolean {
    const nouns = unscoredNouns(scored)
    return firstMatch(rewriteReferences(text, nouns), nouns) !== null
}

/**
 * Prose (Setup, Objective) without the scoring objects this activity does not score on.
 *
 * mode "cut" keeps what a sentence says about the area, layout and teams. Mode "drop" removes the
 * whole sentence, for the Objective, where a cut intention reads worse than falling back to the
 * coach's own goal.
 */
export function withoutUnscoredObjects(text: string, scored: ScoredObject, mode: 'cut' | 'drop' = 'cut'): string {
    if (!text.trim()) return text
    const nouns = unscoredNouns(scored)
    const scoresOnAZone = scored.names.some((name) => /\bzones?\b/i.test(name))
    const source = mode === 'cut' && scoresOnAZone ? text.replace(NO_ZONES, '').replace(NO_ZONES_LEADING, '$1') : text
    const sentences = sentencesOf(source).map((raw) => rewriteReferences(raw, nouns))

    // FORMAT PROTECTS A SENTENCE ONLY WHEN NOTHING ELSE CARRIES IT. Real output: "The team with 7 players
    // defends a goal at one end, while the team with 6 defends the opposite goal." followed "Play 6v6 in
    // a 40 x 30 m area" in a game scored on a protected zone, and was kept because "7 players" read as
    // format. A sentence is protected for a kind of format (team or area) no untouched sentence states.
    const untouched = sentences.filter(
        (s) => firstMatch(s, nouns) === null && !SETUP_STATES_A_WAY_TO_SCORE.test(s) && !AWARDS_ITS_OWN_POINTS.test(s)
    )
    const onlyPlaceFormatIs = (sentence: string) =>
        [PLAYER_FORMAT, PLAYING_AREA].some((kind) => kind.test(sentence) && !untouched.some((other) => other !== sentence && kind.test(other)))

    const kept: string[] = []
    // A sentence of fewer words than this, once cut, said nothing without what was cut. Real output:
    // "Restart." was left of a restart into an end zone. "Play 6v6." is kept by its format.
    const MIN_WORDS_AFTER_CUT = 3
    for (let sentence of sentences) {
        if (mode === 'drop') {
            if (firstMatch(sentence, nouns) !== null) continue
            if (SCORES_SOMEWHERE.test(sentence) && !namesTheScoredObject(sentence, scored)) continue
            if (AWARDS_ITS_OWN_POINTS.test(sentence)) continue
            kept.push(finishSentence(sentence))
            continue
        }

        if (sentence.split(/\s+/).length < 2 && !onlyPlaceFormatIs(sentence)) continue
        if ((SETUP_STATES_A_WAY_TO_SCORE.test(sentence) || AWARDS_ITS_OWN_POINTS.test(sentence)) && !onlyPlaceFormatIs(sentence)) continue
        if (OBJECTIVE_SENTENCE.test(sentence) && REFERS_BACK_TO_OBJECTS.test(sentence) && !onlyPlaceFormatIs(sentence)) continue
        let match = firstMatch(sentence, nouns)
        if (!match) {
            kept.push(finishSentence(sentence))
            continue
        }
        if (OBJECTIVE_SENTENCE.test(sentence) && !onlyPlaceFormatIs(sentence)) continue

        let wasCut = false
        for (let cuts = 0; match && cuts < 3; cuts++) {
            const cut = cutNounPhrase(sentence, match) ?? cutClause(sentence, match)
            if (cut === null) break
            sentence = cut
            wasCut = true
            match = firstMatch(sentence, nouns)
        }
        // A cut list keeps a count it no longer has: "…with three zones: a central zone and two end zones."
        // became "…with three zones: a central zone." in real output. The count goes with the items.
        if (wasCut) sentence = sentence.replace(/\b(?:two|three|four|five|\d+)\s+(?:zones?|areas?|channels?|sections?|parts?):\s+/i, '')
        if (match && !onlyPlaceFormatIs(sentence)) continue
        // Still naming an unscored object, and the only place its format is stated: keep the format,
        // not the sentence.
        if (match) {
            const formatOnly = formatOnlySentence(sentence)
            if (formatOnly) kept.push(formatOnly)
            continue
        }
        const finished = finishSentence(sentence)
        if (finished && (finished.split(/\s+/).length >= MIN_WORDS_AFTER_CUT || onlyPlaceFormatIs(finished))) kept.push(finished)
    }
    return kept.join(' ')
}

/**
 * Rules for the coach: a line naming an unscored object goes, a line stating a second way to score
 * goes, and restart references are rewritten. `mustKeep` protects the exchange rule and this slot's
 * variation, EXCEPT the variation defining when a regain counts, which is removed from any game that
 * does not score regains: there it answers a question the game never asks.
 */
export function rulesForScoredObject(rules: readonly string[], scored: ScoredObject, mustKeep: (line: string) => boolean): string[] {
    const nouns = unscoredNouns(scored)
    return rules.flatMap((line) => {
        if (scored.eventKey !== 'regain' && REGAIN_COUNTS.test(line)) return []
        if (mustKeep(line)) return [line]
        if (STATES_A_WAY_TO_SCORE.test(line) || AWARDS_ITS_OWN_POINTS.test(line)) return []
        const rewritten = rewriteReferences(line, nouns)
        return firstMatch(rewritten, nouns) ? [] : [rewritten]
    })
}
