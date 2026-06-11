import { TEST_LIBRARY_V0_ARCHETYPES } from '../test-library/archetypes'
import { TEST_LIBRARY_V0_AFFORDANCE_LENSES } from '../test-library/affordanceLenses'
import { TEST_LIBRARY_V0_CONSTRAINTS } from '../test-library/constraints'

export interface InputConstraintHints {
    candidateArchetypeIds: string[]
    candidateAffordanceLensIds: string[]
    candidateConstraintIds: string[]
    matchedSignals: string[]
}

function normalizeTitle(title: string): string {
    return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildTitleMaps() {
    const archetypesByTitle = new Map<string, string>()
    for (const a of TEST_LIBRARY_V0_ARCHETYPES) {
        archetypesByTitle.set(normalizeTitle(a.game_form_name), a.game_form_id)
    }

    const lensesByTitle = new Map<string, string>()
    for (const l of TEST_LIBRARY_V0_AFFORDANCE_LENSES) {
        lensesByTitle.set(normalizeTitle(l.title), l.id)
    }

    const constraintsByTitle = new Map<string, string>()
    for (const c of TEST_LIBRARY_V0_CONSTRAINTS) {
        constraintsByTitle.set(normalizeTitle(c.title), c.id)
    }

    return { archetypesByTitle, lensesByTitle, constraintsByTitle }
}

const TITLE_MAPS = buildTitleMaps()

function resolveArchetypeTitle(canonicalTitle: string, matchedSignals: string[]): string | null {
    const id = TITLE_MAPS.archetypesByTitle.get(normalizeTitle(canonicalTitle))
    if (id) return id
    matchedSignals.push(`unresolvedArchetypeTitle:${canonicalTitle}`)
    return null
}

function resolveLensTitle(canonicalTitle: string, matchedSignals: string[]): string | null {
    const id = TITLE_MAPS.lensesByTitle.get(normalizeTitle(canonicalTitle))
    if (id) return id
    matchedSignals.push(`unresolvedLensTitle:${canonicalTitle}`)
    return null
}

function resolveConstraintTitle(canonicalTitle: string, matchedSignals: string[]): string | null {
    const id = TITLE_MAPS.constraintsByTitle.get(normalizeTitle(canonicalTitle))
    if (id) return id
    matchedSignals.push(`unresolvedConstraintTitle:${canonicalTitle}`)
    return null
}

function dedupe(ids: string[]): string[] {
    return [...new Set(ids)]
}

function dedupeSignals(signals: string[]): string[] {
    return [...new Set(signals)]
}

/** Group A — Touch / receiving / first touch */
function matchesTouchReceiving(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bfirst touches?\b/.test(t)) return true
    if (/\breceiving\b|\breceive\b/.test(t)) return true
    if (/\bsettle\b/.test(t)) return true
    if (/\bcontrol\b/.test(t)) return true
    if (/\btouches\b|\btouch\b/.test(t)) return true
    return false
}

/** Group B — Pressure */
function matchesPressure(text: string): boolean {
    const t = text.toLowerCase()
    if (t.includes('under pressure')) return true
    if (t.includes('defender closing')) return true
    if (t.includes('tight space')) return true
    if (/\bpressed\b/.test(t)) return true
    if (/\bpressure\b/.test(t)) return true
    return false
}

function matchesPossession(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bpasses?\b|\bpassing\b/.test(t)) return true
    if (/\bkeep the ball\b|\bkeeping the ball\b/.test(t)) return true
    if (/\bpossess(?:ion)?\b|\bretain\b|\bretention\b/.test(t)) return true
    if (/\bcirculate\b|\bcombine\b|\bcombination\b/.test(t)) return true
    return false
}

/** Group C — Spacing / support angles */
function matchesSpacingSupport(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bspacing\b/.test(t)) return true
    if (/\bsupport angles\b/.test(t)) return true
    if (/\bpassing lanes\b/.test(t)) return true
    if (/\bshape\b/.test(t)) return true
    if (/\bwidth\b|\bdepth\b/.test(t)) return true
    if (/\bwide\b|\bflank\b|\bchannel\b/.test(t)) return true
    if (/\bgaps?\b|\bpockets?\b/.test(t)) return true
    if (/\bsupport\b|\bangles\b/.test(t)) return true
    if (/\bspace\b/.test(t)) return true
    return false
}

/** Group D — Breaking lines / attacking forward */
function matchesBreakLines(text: string): boolean {
    const t = text.toLowerCase()
    if (t.includes('break lines')) return true
    if (t.includes('break defensive lines')) return true
    if (t.includes('line breaking')) return true
    if (t.includes('defensive lines')) return true
    if (t.includes('split defense')) return true
    if (t.includes('through ball')) return true
    if (/\bsplit\b/.test(t)) return true
    if (/\bpenetrate\b/.test(t)) return true
    if (/\bprogress\b|\bprogression\b|\badvance\b/.test(t)) return true
    if (t.includes('play forward')) return true
    if (t.includes('attack space')) return true
    return false
}

/**
 * Group F — Finishing / scoring chance / shooting.
 * Previously absent: finishing-flavored inputs (shot, scoring chance, penalty box, near opponent
 * goal) didn't trigger any group, OR triggered Group A (touch/receiving) which restricted the
 * archetype pool to possession-like archetypes only — excluding Finishing Games entirely. The
 * matcher catches both broad finishing vocabulary (shot/finish/score/chance/final third) and
 * specific finishing-context phrases (penalty box / around the box / near the goal / get off a shot).
 */
function matchesFinishing(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bshots?\b|\bshooting\b|\bshoot\b/.test(t)) return true
    if (/\bfinish(?:ing)?\b|\bscore\b|\bscoring\b/.test(t)) return true
    if (/\bgoals?\b|\bgoal scoring\b/.test(t)) return true
    if (/\bchances?\b|\bchance creation\b/.test(t)) return true
    if (/\bfinal third\b|\battacking third\b/.test(t)) return true
    if (/\bcreate better shots?\b|\bcreating better shots?\b|\bcreate shots?\b/.test(t)) return true
    if (/\bpenalty\s+box\b|\bin\s+the\s+box\b|\baround\s+the\s+(?:opponent'?s?\s+)?(?:penalty\s+)?box\b/.test(t)) return true
    if (/\bnear\s+(?:the\s+)?(?:opponent'?s?\s+)?goal\b|\bin\s+front\s+of\s+(?:the\s+)?goal\b/.test(t)) return true
    if (/\bconvert\b.*\bchance(?:s)?\b/.test(t)) return true
    if (/\bget\s+(?:off\s+)?a\s+(?:good\s+)?shot\b/.test(t)) return true
    return false
}

/** Group E — Regain / pressing */
function matchesRegainPressing(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bregain\b/.test(t)) return true
    if (/\bdefend\b|\bdefending\b/.test(t)) return true
    if (/\bdefensive\b/.test(t) && !/\bdefensive lines?\b/.test(t)) return true
    if (t.includes('win the ball')) return true
    if (t.includes('winning the ball')) return true
    if (t.includes('win it back')) return true
    if (/\bcounterpress\b/.test(t)) return true
    if (/\bturnover\b/.test(t)) return true
    if (/\bpressing\b|\bpress\b/.test(t)) return true
    return false
}

/** Group G — Overload / numerical advantage. Core attacking concept that previously matched
 * nothing (the word "overload" had no matcher despite Overload Games existing as an archetype). */
function matchesOverload(text: string): boolean {
    const t = text.toLowerCase()
    if (/\boverloads?\b/.test(t)) return true
    if (/\bnumerical\b|\bnumbers?\s+up\b/.test(t)) return true
    if (/\bextra\s+(?:man|player|attacker)\b/.test(t)) return true
    if (/\bman\s+(?:up|advantage)\b|\bup\s+a\s+(?:man|player)\b/.test(t)) return true
    if (/\b\d+\s*v\s*\d+\b/.test(t)) return true
    if (/\b\d+\s*(?:v|vs|versus)\s*\d+\b/.test(t)) return true
    return false
}

/** Group H — Transition / counter-attack. Previously the word "transition" matched nothing
 * despite Transition Games existing as an archetype. */
function matchesTransition(text: string): boolean {
    const t = text.toLowerCase()
    if (/\btransition(?:s|ing)?\b/.test(t)) return true
    if (/\bcounter[-\s]?attack(?:s|ing)?\b/.test(t)) return true
    if (/\bquick\s+break\b|\bfast\s+break\b/.test(t)) return true
    if (/\bbreak(?:ing)?\b.*\b(?:on|off|from)\b.*\b(?:turnover|regain|win)\b/.test(t)) return true
    return false
}

/**
 * Group I — Defensive / preventive intent (polarity-aware). WORKSTREAM 1.
 *
 * Defensive goals were being silently reinterpreted as attacking because defensive verbs
 * (protect, prevent, deny, delay, contain, screen, shield, recover shape, compact) matched
 * NOTHING, so the parser only read the attacking-flavored object nouns ("space", "goal",
 * "central", "counterattack") and fired attacking lenses. This detector catches defensive
 * INTENT so the caller can route to the defensive affordance lenses (Space Protection,
 * Recovery, Delay or Deny, Regain) that already exist in the library but were never reached.
 *
 * It deliberately does NOT fire on attacking goals: it keys on defensive verbs/phrases, not
 * on nouns that also appear in attacking goals.
 */
function matchesDefensive(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bprotect(?:ing|s)?\b/.test(t)) return true
    if (/\bprevent(?:ing|s)?\b/.test(t)) return true
    if (/\bdeny(?:ing)?\b|\bdenies\b/.test(t)) return true
    if (/\bdelay(?:ing|s)?\b/.test(t)) return true
    if (/\bcontain(?:ing|s)?\b/.test(t)) return true
    if (/\bscreen(?:ing|s)?\b|\bshield(?:ing|s)?\b/.test(t)) return true
    if (/\bcompact(?:ness)?\b/.test(t)) return true
    if (/\blow block\b|\bdeep block\b|\bdefensive block\b/.test(t)) return true
    if (/\bdefensive\s+(?:shape|organi[sz]ation|compactness|line|structure|block)\b/.test(t)) return true
    if (/\brecover(?:ing)?\s+(?:defensive\s+)?(?:shape|organi[sz]ation|compactness|position)\b/.test(t)) return true
    if (/\bdefend(?:ing)?\s+(?:deep|the\s+box|central|space|the\s+goal|narrow|compact)\b/.test(t)) return true
    if (/\bslow(?:ing)?\s+(?:down\s+)?(?:the\s+)?(?:attack|progression|opponent|build)/.test(t)) return true
    if (/\bstop(?:ping)?\b.*\b(?:attack|progression|opponent|counter|chance|shot|cross)/.test(t)) return true
    if (/\bblock(?:ing)?\s+(?:passing\s+)?(?:lanes?|the\s+pass|forward|central|progression)/.test(t)) return true
    if (/\bcut(?:ting)?\s+(?:off|out)\b/.test(t)) return true
    if (/\bforce\s+(?:play\s+)?(?:wide|backward|back|sideways)/.test(t)) return true
    // "keeping attackers away from central areas", "keep the ball out of the box" — defensive
    // exclusion phrasing that previously slipped through and produced attacking finishing.
    if (/\bkeep(?:ing)?\b[^.]*\b(?:out|away)\b/.test(t)) return true
    if (/\baway from\b[^.]*\b(?:central|centre|center|goal|box|danger)/.test(t)) return true
    return false
}

/**
 * Defensive sub-problem. Christian's Round-1 follow-up: after polarity was fixed, distinct
 * defensive problems (protect / recover shape / delay / press) were all collapsing into
 * pressing-regain because WS1 routed every defensive goal through one shared pool led by
 * Pressing & Regain. This sub-classifier routes each defensive intent to its own lead lens +
 * lead archetype so the WS2 order-based tie-break surfaces the SPECIFIC defensive problem.
 *
 * Honest ceiling: the archetype library has no dedicated defensive game forms — all 10 are
 * attacking forms. Positional Play (structure) is the least-bad home for protect/compact/
 * recover-shape; Transition for defensive-transition (delay the counter); Pressing & Regain
 * for active ball-winning. This sub-routing maximizes specificity within that ceiling.
 */
type DefensiveSubtype = 'press' | 'recover' | 'delay' | 'protect'
function defensiveSubtype(text: string): DefensiveSubtype {
    const t = text.toLowerCase()
    // Active ball-winning — explicit press / regain / win-back.
    if (/\bpress(?:ing|es)?\b|\bwin (?:the |it )?ball\b|\bwin it back\b|\bregain\b|\bcounter[-\s]?press\b/.test(t))
        return 'press'
    // Reorganizing the block after being opened up.
    if (
        /\brecover(?:ing)?\s+(?:defensive\s+)?(?:shape|organi[sz]ation|position)\b|\breorgani[sz]e\b|\bget(?:ting)?\s+back\s+(?:into\s+)?shape\b|\bafter being stretched\b/.test(
            t
        )
    )
        return 'recover'
    // Slowing / containing / denying progression — including preventing the counter.
    if (
        /\bdelay(?:ing|s)?\b|\bcontain(?:ing|s)?\b|\bslow(?:ing)?\b|\bforce\s+(?:play\s+)?(?:wide|back|sideways)\b|\b(?:prevent|stop|deny)(?:ing)?\b[^.]*\b(?:counter|progression|forward|through)/.test(
            t
        )
    )
        return 'delay'
    // Default: protecting space / compactness / shape maintenance.
    return 'protect'
}

/** Broad soccer-vocabulary test used for the general fallback below. Includes core attacking
 * vocabulary (attack, advantage, offense, overload, transition, numerical, counter) so natural
 * coaching language that doesn't hit a specific group still maps to a sensible default rather
 * than getting hard-rejected with "No supported soccer training signals". */
function matchesSoccerRelatedDefault(text: string): boolean {
    const t = text.toLowerCase()
    return /\bsoccer\b|\bfootball\b|\bplayers?\b|\bteams?\b|\bball\b|\battack(?:ing|ers?)?\b|\bdefen[cs]e\b|\bdefend(?:ing|ers?)?\b|\bmidfield\b|\boffen[cs]e\b|\badvantage\b|\boverloads?\b|\btransition(?:s|ing)?\b|\bnumerical\b|\bcounter\b|\bforward\b|\bscore\b|\bgoal\b|\bbuild[-\s]?up\b|\bplay(?:ing)?\s+out\b|\b(?:out|up)\s+of\s+the\s+back\b|\bfrom\s+the\s+back\b/.test(
        t
    )
}

/**
 * Rule-based (keyword/signal) hints only. No AI, no scoring, no final selection.
 * Titles are resolved against Test Library V0; missing titles are skipped and noted in `matchedSignals`.
 */
export function deriveInputConstraints(input: string): InputConstraintHints {
    const text = input.trim()
    const matchedSignals: string[] = []

    if (!text) {
        return {
            candidateArchetypeIds: [],
            candidateAffordanceLensIds: [],
            candidateConstraintIds: [],
            matchedSignals: [],
        }
    }

    const archetypeIds: string[] = []
    const lensIds: string[] = []
    const constraintIds: string[] = []

    const pickArchetypes = (titles: string[]) => {
        for (const title of titles) {
            const id = resolveArchetypeTitle(title, matchedSignals)
            if (id) archetypeIds.push(id)
        }
    }
    const pickLenses = (titles: string[]) => {
        for (const title of titles) {
            const id = resolveLensTitle(title, matchedSignals)
            if (id) lensIds.push(id)
        }
    }
    const pickConstraints = (titles: string[]) => {
        for (const title of titles) {
            const id = resolveConstraintTitle(title, matchedSignals)
            if (id) constraintIds.push(id)
        }
    }

    /**
     * "Possession Games" is not a V0 title; map the concept to possession-like game forms that exist in the library.
     */
    const pickPossessionLikeArchetypes = () => {
        for (const title of ['Directional Possession Games', 'Overload Games', 'End Zone Games']) {
            const id = resolveArchetypeTitle(title, matchedSignals)
            if (id) archetypeIds.push(id)
        }
    }

    // WORKSTREAM 1 — Defensive resolution / polarity. Checked FIRST and EXCLUSIVE: when the goal
    // carries defensive intent, route to the defensive affordance lenses and defensive archetypes,
    // then return immediately so the attacking-noun groups below (finishing, break-lines, spacing,
    // transition-attack, overload) cannot flip the polarity. The defensive lenses (Space Protection,
    // Recovery, Delay or Deny, Regain) drive a defensive OBJECTIVE regardless of which archetype is
    // chosen — confirmed by the one defensive goal that resolved correctly pre-fix
    // ("recovering defensive organization when outnumbered"), which produced recovery-shape /
    // slow-progression / deny-forward-options language via exactly these lenses.
    if (matchesDefensive(text)) {
        // Sub-classify so distinct defensive problems route to distinct lead lens + lead archetype
        // (the WS2 order-based tie-break then surfaces the specific one) instead of all collapsing
        // into pressing/regain. Each branch lists its SPECIFIC lens + archetype first; the other
        // defensive lenses remain available as secondary candidates.
        const sub = defensiveSubtype(text)
        matchedSignals.push(`signalGroup:I_defensive_${sub}`)
        if (sub === 'press') {
            pickLenses([
                'Regain Opportunity',
                'Delay or Deny Opportunity',
                'Recovery Opportunity',
                'Space Protection Opportunity',
            ])
            pickConstraints(['Interception Reward', 'Counter-Press Window', 'Turnover Reward', 'Recovery Window'])
            pickArchetypes(['Pressing & Regain Games', 'Transition Games', 'Positional Play Games'])
        } else if (sub === 'recover') {
            pickLenses([
                'Recovery Opportunity',
                'Space Protection Opportunity',
                'Delay or Deny Opportunity',
                'Regain Opportunity',
            ])
            pickConstraints(['Recovery Window', 'Zone Structure Condition', 'Transition Trigger', 'Central Density Condition'])
            // Recover SHAPE = reorganize the block (structure), not win the ball. Pressing & Regain is
            // EXCLUDED here — its win-the-ball vocabulary otherwise out-scores Positional Play and
            // pulls recover-shape back into ball-winning (Christian's exact complaint).
            pickArchetypes(['Positional Play Games', 'Transition Games'])
        } else if (sub === 'delay') {
            pickLenses([
                'Delay or Deny Opportunity',
                'Space Protection Opportunity',
                'Recovery Opportunity',
                'Regain Opportunity',
            ])
            pickConstraints(['Delay Reward', 'Recovery Window', 'Zone Structure Condition', 'Central Density Condition'])
            // Delay / contain / prevent-the-counter = defensive transition (slow + deny), not ball-
            // winning — lead Transition, exclude Pressing & Regain.
            pickArchetypes(['Transition Games', 'Positional Play Games'])
        } else {
            // protect / compact / shape maintenance — lead Space Protection + Positional Play.
            pickLenses([
                'Space Protection Opportunity',
                'Delay or Deny Opportunity',
                'Recovery Opportunity',
                'Regain Opportunity',
            ])
            pickConstraints(['Zone Structure Condition', 'Central Density Condition', 'Small Area Condition', 'Delay Reward'])
            // Protect space / compactness = defensive structure — lead Positional Play, exclude
            // Pressing & Regain so it stays a space-protection problem, not a ball-winning one.
            pickArchetypes(['Positional Play Games', 'Transition Games'])
        }

        return {
            candidateArchetypeIds: dedupe(archetypeIds),
            candidateAffordanceLensIds: dedupe(lensIds),
            candidateConstraintIds: dedupe(constraintIds),
            matchedSignals: dedupeSignals(matchedSignals),
        }
    }

    if (matchesTouchReceiving(text)) {
        matchedSignals.push('signalGroup:A_touch_receiving')
        pickLenses([
            'Possession Stability Opportunity',
            'Space Creation Opportunity',
            'Support Opportunity',
            'Support Angles',
            'Pressure Escape Opportunity',
        ])
        pickConstraints(['Pressure Condition', 'Central Density Condition', 'Wide Zone Advantage', 'Turnover Reward'])
        pickPossessionLikeArchetypes()
    }

    if (matchesPressure(text)) {
        matchedSignals.push('signalGroup:B_pressure')
        pickLenses([
            'Possession Stability Opportunity',
            'Regain Opportunity',
            'Space Creation Opportunity',
            'Support Angle Opportunity',
        ])
        pickConstraints([
            'Pressure Condition',
            'Turnover Reward',
            'Interception Reward',
            'Central Density Condition',
        ])
        // Pressure alone is not regain/pressing intent — do not suggest Pressing & Regain here (GF8 comes only from explicit regain/press signals).
        pickPossessionLikeArchetypes()
    }

    if (matchesPossession(text)) {
        matchedSignals.push('signalGroup:F_possession_passing')
        pickLenses([
            'Possession Stability Opportunity',
            'Space Creation Opportunity',
            'Space Exploitation Opportunity',
            'Line-Breaking Opportunity',
        ])
        pickConstraints([
            'Central Density Condition',
            'Wide Zone Advantage',
            'Switch of Play Bonus',
            'Turnover Reward',
        ])
        pickPossessionLikeArchetypes()
    }

    if (matchesSpacingSupport(text)) {
        matchedSignals.push('signalGroup:C_spacing_support')
        pickLenses([
            'Space Creation Opportunity',
            'Space Exploitation Opportunity',
            'Possession Stability Opportunity',
            'Line-Breaking Opportunity',
        ])
        pickConstraints([
            'Wide Zone Advantage',
            'Central Density Condition',
            'Switch of Play Bonus',
            'Wide Utilization Bonus',
        ])
        // WS2: spacing/width/support goals are the natural home of Channel Games (defined wide /
        // half-space channels) and Positional Play (structure, support, spacing). Lead with those
        // specific forms so width/support goals stop collapsing into the generic possession default;
        // keep possession-like forms as secondary candidates.
        pickArchetypes(['Channel Games', 'Positional Play Games', 'Directional Possession Games'])
        pickPossessionLikeArchetypes()
    }

    if (matchesBreakLines(text)) {
        matchedSignals.push('signalGroup:D_break_lines')
        pickLenses([
            'Line-Breaking Opportunity',
            'Space Exploitation Opportunity',
            'Transition Attack Opportunity',
            'Finishing Opportunity',
        ])
        pickConstraints([
            'Progression Bonus',
            'Switch of Play Bonus',
            'Wide Zone Advantage',
            'Central Density Condition',
        ])
        // WS2: lead with the line-breaking-specific forms (penetration through/between lines)
        // rather than End Zone, which previously won the tie-break and absorbed break-lines goals.
        pickArchetypes(['Directional Possession Games', 'Channel Games', 'Target Games', 'End Zone Games'])
    }

    if (matchesFinishing(text)) {
        matchedSignals.push('signalGroup:F_finishing')
        pickLenses([
            'Finishing Opportunity',
            'Line-Breaking Opportunity',
            'Space Creation Opportunity',
            'Space Exploitation Opportunity',
        ])
        pickConstraints([
            'Goalkeeper Included Condition',
            'Final Third Value',
            'Progression Bonus',
            'Wide Zone Advantage',
            'Central Density Condition',
            'Small Area Condition',
        ])
        // Finishing Games is the primary fit. End Zone Games (target-zone entry), Target Games
        // (target-player connect), and Channel Games (wide-area access to box) are adjacent
        // forms the engine can choose between based on which scores highest under the
        // vocabulary bridge.
        pickArchetypes(['Finishing Games', 'End Zone Games', 'Target Games', 'Channel Games'])
    }

    if (matchesRegainPressing(text)) {
        matchedSignals.push('signalGroup:E_regain_pressing')
        pickLenses([
            'Regain Opportunity',
            'Transition Attack Opportunity',
            'Delay or Deny Opportunity',
            'Possession Stability Opportunity',
        ])
        pickConstraints(['Interception Reward', 'Turnover Reward', 'Transition Trigger', 'Delay Reward'])
        pickArchetypes(['Pressing & Regain Games', 'Transition Games'])
        pickPossessionLikeArchetypes()
    }

    if (matchesOverload(text)) {
        matchedSignals.push('signalGroup:G_overload')
        pickLenses([
            'Space Exploitation Opportunity',
            'Space Creation Opportunity',
            'Line-Breaking Opportunity',
            'Possession Stability Opportunity',
        ])
        pickConstraints(['Central Density Condition', 'Wide Zone Advantage', 'Progression Bonus', 'Switch of Play Bonus'])
        pickArchetypes(['Overload Games', 'Directional Possession Games', 'Positional Play Games'])
    }

    if (matchesTransition(text)) {
        matchedSignals.push('signalGroup:H_transition')
        pickLenses([
            'Transition Attack Opportunity',
            'Space Exploitation Opportunity',
            'Regain Opportunity',
            'Line-Breaking Opportunity',
        ])
        pickConstraints(['Transition Trigger', 'Transition Bonus', 'Turnover Reward', 'Progression Bonus'])
        pickArchetypes(['Transition Games', 'Pressing & Regain Games', 'Overload Games'])
    }

    // General soccer fallback: if no specific group matched any archetype but the text is clearly
    // soccer/attacking vocabulary, map to a sensible general possession-attacking package so natural
    // coaching language is not hard-rejected with "No supported soccer training signals". This widens
    // field-test coverage; genuinely off-topic input (no soccer vocabulary) still falls through to the
    // empty result and is rejected upstream.
    if (archetypeIds.length === 0 && matchesSoccerRelatedDefault(text)) {
        matchedSignals.push('signalGroup:Z_soccer_general')
        pickLenses([
            'Possession Stability Opportunity',
            'Space Creation Opportunity',
            'Space Exploitation Opportunity',
            'Line-Breaking Opportunity',
        ])
        pickConstraints(['Central Density Condition', 'Wide Zone Advantage', 'Progression Bonus', 'Turnover Reward'])
        pickPossessionLikeArchetypes()
    }

    return {
        candidateArchetypeIds: dedupe(archetypeIds),
        candidateAffordanceLensIds: dedupe(lensIds),
        candidateConstraintIds: dedupe(constraintIds),
        matchedSignals: dedupeSignals(matchedSignals),
    }
}
