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

/** Group C — Spacing / support angles */
function matchesSpacingSupport(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bspacing\b/.test(t)) return true
    if (/\bsupport angles\b/.test(t)) return true
    if (/\bpassing lanes\b/.test(t)) return true
    if (/\bshape\b/.test(t)) return true
    if (/\bwidth\b|\bdepth\b/.test(t)) return true
    if (/\bsupport\b|\bangles\b/.test(t)) return true
    if (/\bspace\b/.test(t)) return true
    return false
}

/** Group D — Breaking lines / attacking forward */
function matchesBreakLines(text: string): boolean {
    const t = text.toLowerCase()
    if (t.includes('break lines')) return true
    if (t.includes('line breaking')) return true
    if (/\bsplit\b/.test(t)) return true
    if (/\bpenetrate\b/.test(t)) return true
    if (t.includes('play forward')) return true
    if (t.includes('attack space')) return true
    return false
}

/** Group E — Regain / pressing */
function matchesRegainPressing(text: string): boolean {
    const t = text.toLowerCase()
    if (/\bregain\b/.test(t)) return true
    if (t.includes('win the ball')) return true
    if (t.includes('winning the ball')) return true
    if (/\bcounterpress\b/.test(t)) return true
    if (/\bturnover\b/.test(t)) return true
    if (/\bpressing\b|\bpress\b/.test(t)) return true
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
        pickArchetypes(['Possession Games', 'Overload Games', 'End Zone Games'])
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
        pickArchetypes(['Possession Games', 'Pressing & Regain Games', 'Overload Games'])
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
        pickArchetypes(['End Zone Games', 'Overload Games', 'Possession Games'])
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
            'Interception Reward',
            'Turnover Reward',
            'Transition Trigger',
            'Wide Zone Advantage',
        ])
        pickArchetypes(['End Zone Games', 'Overload Games', 'Pressing & Regain Games'])
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
        pickArchetypes(['Pressing & Regain Games', 'Transition Games', 'Possession Games'])
    }

    return {
        candidateArchetypeIds: dedupe(archetypeIds),
        candidateAffordanceLensIds: dedupe(lensIds),
        candidateConstraintIds: dedupe(constraintIds),
        matchedSignals: dedupeSignals(matchedSignals),
    }
}
