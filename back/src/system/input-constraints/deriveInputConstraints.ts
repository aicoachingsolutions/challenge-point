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

/** Group E — Regain / pressing */
function matchesFinishing(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bshots?\b|\bshooting\b|\bshoot\b/.test(t)) return true
    if (/\bfinish(?:ing)?\b|\bscore\b|\bscoring\b/.test(t)) return true
    if (/\bgoals?\b|\bgoal scoring\b/.test(t)) return true
    if (/\bchances?\b|\bchance creation\b/.test(t)) return true
    if (/\bfinal third\b|\battacking third\b/.test(t)) return true
    if (/\bcreate better shots?\b|\bcreating better shots?\b|\bcreate shots?\b/.test(t)) return true
    return false
}

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

function matchesSoccerRelatedDefault(text: string): boolean {
    const t = text.toLowerCase()
    return /\bsoccer\b|\bfootball\b|\bplayers?\b|\bteams?\b|\bball\b|\battack(?:ing)?\b|\bdefen[cs]e\b|\bmidfield\b/.test(
        t
    )
}

/**
 * Group F — Finishing / scoring chance / shooting.
 * Previously absent: inputs explicitly about finishing (shot, scoring chance, penalty box, near
 * opponent goal) didn't trigger any group, OR triggered Group A (touch/receiving) which
 * pickPossessionLikeArchetypes-only — excluding Finishing Games from the candidate pool entirely.
 * Result: finishing-focused inputs defaulted to End Zone or Directional Possession because the
 * right archetype was filtered out before scoring.
 */
function matchesFinishing(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bshots?\b|\bshoot\b|\bshooting\b/.test(t)) return true
    if (/\bfinish\b|\bfinishing\b/.test(t)) return true
    if (/\bscoring\s+chance(?:s)?\b|\bscore\s+a?\s*chance(?:s)?\b/.test(t)) return true
    if (/\bpenalty\s+box\b|\bin\s+the\s+box\b|\baround\s+the\s+(?:opponent'?s?\s+)?(?:penalty\s+)?box\b/.test(t)) return true
    if (/\bnear\s+(?:the\s+)?(?:opponent'?s?\s+)?goal\b|\bin\s+front\s+of\s+(?:the\s+)?goal\b/.test(t)) return true
    if (/\bconvert\b.*\bchance(?:s)?\b/.test(t)) return true
    if (/\bget\s+(?:off\s+)?a\s+(?:good\s+)?shot\b/.test(t)) return true
    return false
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

    const pickFinishingArchetypes = () => {
        for (const title of ['Target Games', 'Channel Games']) {
            const id = resolveArchetypeTitle(title, matchedSignals)
            if (id) archetypeIds.push(id)
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
        pickArchetypes(['End Zone Games', 'Directional Possession Games', 'Target Games', 'Channel Games'])
    }

    if (matchesFinishing(text)) {
        matchedSignals.push('signalGroup:G_finishing_chance_creation')
        pickLenses([
            'Finishing Opportunity',
            'Line-Breaking Opportunity',
            'Space Creation Opportunity',
            'Space Exploitation Opportunity',
        ])
        pickConstraints([
            'Final Third Value',
            'Progression Bonus',
            'Wide Zone Advantage',
            'Central Density Condition',
        ])
        pickFinishingArchetypes()
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

    if (matchesFinishing(text)) {
        matchedSignals.push('signalGroup:F_finishing')
        pickLenses([
            'Finishing Opportunity',
            'Space Creation Opportunity',
            'Space Exploitation Opportunity',
            'Line-Breaking Opportunity',
        ])
        pickConstraints([
            'Goalkeeper Included Condition',
            'Final Third Value',
            'Progression Bonus',
            'Central Density Condition',
            'Wide Zone Advantage',
            'Small Area Condition',
        ])
        // Finishing-specific archetypes: Finishing Games is the primary fit, with End Zone and
        // Target as adjacent forms when the input emphasizes target areas or final-third entry.
        pickArchetypes(['Finishing Games', 'End Zone Games', 'Target Games'])
    }

    return {
        candidateArchetypeIds: dedupe(archetypeIds),
        candidateAffordanceLensIds: dedupe(lensIds),
        candidateConstraintIds: dedupe(constraintIds),
        matchedSignals: dedupeSignals(matchedSignals),
    }
}
