/**
 * Derivation engine — exact rationals (package §1.9).
 *
 * "Metres | exact rational" and "Interval | closed, exact rationals", and `GA-LAYOUT-FEASIBLE` asks for
 * "linear feasibility over exact rationals". Floating point is not that: `0.1 + 0.2 > 0.3` is true in
 * IEEE-754, and a gate that certifies a layout must not turn on a representation artefact.
 *
 * Only what the gates need: construction from an exact decimal, comparison, addition and subtraction.
 * A value that is not exactly representable is rejected rather than rounded.
 */

function gcd(a: bigint, b: bigint): bigint {
    let x = a < 0n ? -a : a
    let y = b < 0n ? -b : b
    while (y) {
        const t = x % y
        x = y
        y = t
    }
    return x
}

export interface Rational {
    n: bigint
    d: bigint
}

export function rational(n: bigint, d: bigint): Rational {
    if (d === 0n) throw new Error('rational with zero denominator')
    const sign = d < 0n ? -1n : 1n
    const nn = n * sign
    const dd = d * sign
    const g = gcd(nn, dd) || 1n
    return { n: nn / g, d: dd / g }
}

/**
 * An exact decimal or integer only. `NaN`, an infinity, a float with no exact decimal spelling, or any
 * other text returns null, and the caller refuses rather than guessing a number.
 */
export function toRational(value: unknown): Rational | null {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null
        if (Number.isInteger(value)) return rational(BigInt(value), 1n)
        return toRational(String(value))
    }
    if (typeof value !== 'string') return null
    const text = value.trim()
    const match = text.match(/^([+-]?)(\d+)(?:\.(\d+))?$/)
    if (!match) return null
    const sign = match[1] === '-' ? -1n : 1n
    const whole = BigInt(match[2])
    const fraction = match[3] || ''
    const scale = 10n ** BigInt(fraction.length)
    const numerator = whole * scale + (fraction ? BigInt(fraction) : 0n)
    return rational(sign * numerator, scale)
}

/** −1, 0 or 1. */
export function compare(a: Rational, b: Rational): number {
    const left = a.n * b.d
    const right = b.n * a.d
    return left < right ? -1 : left > right ? 1 : 0
}

export const lte = (a: Rational, b: Rational) => compare(a, b) <= 0
export const lt = (a: Rational, b: Rational) => compare(a, b) < 0

export function add(a: Rational, b: Rational): Rational {
    return rational(a.n * b.d + b.n * a.d, a.d * b.d)
}

export const ZERO: Rational = { n: 0n, d: 1n }

export function toText(a: Rational): string {
    return a.d === 1n ? String(a.n) : `${a.n}/${a.d}`
}

/** A closed interval on one axis (§1.9). */
export interface Interval {
    axis: 'along' | 'across'
    lo: Rational
    hi: Rational
}

/**
 * §1.9's interval, and only that. A relative position (`{ term, referent }`) and a dynamic location
 * (`{ dynamic }`) are deliberately not converted here: the model says the first is undetermined until
 * its referent resolves and the second is outside the representation, so both are refused by the
 * caller as `VALUE_NOT_COMPARABLE` rather than turned into numbers.
 */
export function toInterval(value: unknown): Interval | null {
    if (!value || typeof value !== 'object') return null
    const raw: any = value
    if (raw.axis !== 'along' && raw.axis !== 'across') return null
    const lo = toRational(raw.lo)
    const hi = toRational(raw.hi)
    if (!lo || !hi) return null
    return { axis: raw.axis, lo, hi }
}
