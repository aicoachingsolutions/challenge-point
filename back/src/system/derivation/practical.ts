/**
 * **The practical number a configuration is established at — one pure rule, shared.** Added 14 October 2026.
 *
 * Christian that day (§7): *"Where a preferred range barely fits, provide a practical starting recommendation
 * rather than an awkwardly narrow numerical range"* and *"Where practical rounding is appropriate, apply it when
 * the configuration is established so the actual game and its instructions remain consistent."*
 *
 * Measured before this: a channel on a 25 m width was realized 6.25 m wide and offered *"Around 6 m to 6.25 m
 * wide"* — a quarter-metre range nobody can mark. Rounding in the renderer would make the text disagree with the
 * game, so the rule is applied where the number is ESTABLISHED (realization composes the extent and writes the
 * requirement beside it), and the fidelity check applies the same rule to the authored bounds independently:
 * each reads the rule, none reads another's output.
 *
 * **The grain is data** (`docs/audits/practical-rounding.json`): 0.5 m below 10 m, 1 m from 10 m, whole counts
 * and minutes. It is a PROPOSAL awaiting his confirmation (OD4), applied because his §7 asked for rounding at
 * establishment. **Rounding is inward**: a minimum rounds up and a maximum down, so a practical range always lies
 * inside the exact one and a rounded value can never break a requirement. Where a range holds no value on the
 * grain at all, `practical` returns null and the caller keeps the exact numbers (a requirement) or offers nothing
 * (a preference) — it never rounds outward to make something fit.
 *
 * Exact arithmetic throughout (`rational.ts`): 6.25 / 0.5 is 12.5 and its floor is 12, never a float's guess.
 * Sport-neutral: it knows metres, counts and minutes, and no game.
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from './knowledge-root'
import { rational, toRational } from './rational'

export type PracticalKind = 'EXTENT_METRES' | 'COUNT' | 'MINUTES'

export interface PracticalLimits {
    min: number | null
    max: number | null
}

export interface PracticalRule {
    extentMetres: ({ below: number; step: number } | { from: number; step: number })[]
    count: { step: number }
    minutes: { step: number }
}

export const PRACTICAL_ROUNDING_FILE = path.join(AUDITS_DIR, 'practical-rounding.json')
export const PRACTICAL_ROUNDING: PracticalRule = JSON.parse(fs.readFileSync(PRACTICAL_ROUNDING_FILE, 'utf8').replace(/^﻿/, ''))

/** The grain a value of this kind is set to. For a length the grain depends on the length itself. */
export function grainFor(kind: PracticalKind, value: number, rule: PracticalRule = PRACTICAL_ROUNDING): number {
    if (kind === 'COUNT') return rule.count.step
    if (kind === 'MINUTES') return rule.minutes.step
    for (const band of rule.extentMetres) {
        if ('below' in band && value < band.below) return band.step
        if ('from' in band && value >= band.from) return band.step
    }
    throw new Error(`no grain in ${PRACTICAL_ROUNDING_FILE} covers a length of ${value} m`)
}

/** `value` moved onto its grain, up or down, exactly. A value with no exact decimal spelling is returned unchanged. */
function onGrain(value: number, step: number, direction: 'up' | 'down'): number {
    const v = toRational(value)
    const s = toRational(step)
    if (!v || !s || s.n <= 0n) return value
    // k = v / s, as an exact fraction; floor or ceiling it, then k × s.
    const num = v.n * s.d
    const den = v.d * s.n
    let k = num / den
    if (direction === 'down' && num % den !== 0n && num < 0n) k -= 1n
    if (direction === 'up' && num % den !== 0n && num > 0n) k += 1n
    const result = rational(k * s.n, s.d)
    return Number(result.n) / Number(result.d)
}

/**
 * A range brought INWARD onto the practical grain: the minimum up, the maximum down. Null where nothing on the
 * grain lies inside it — the caller then keeps the exact range or offers nothing, and never rounds outward.
 * An end nobody authored stays null.
 */
export function practical(limits: PracticalLimits, kind: PracticalKind, rule: PracticalRule = PRACTICAL_ROUNDING): PracticalLimits | null {
    const stated = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
    const min = stated(limits.min) ? onGrain(limits.min, grainFor(kind, limits.min, rule), 'up') : null
    const max = stated(limits.max) ? onGrain(limits.max, grainFor(kind, limits.max, rule), 'down') : null
    if (min !== null && max !== null && min > max) return null
    return { min, max }
}

/** A required range on the grain where it can be; the exact range where it cannot. Never wider than the exact one. */
export function practicalRequirement(limits: PracticalLimits, kind: PracticalKind, rule: PracticalRule = PRACTICAL_ROUNDING): PracticalLimits {
    return practical(limits, kind, rule) ?? { min: limits.min, max: limits.max }
}
