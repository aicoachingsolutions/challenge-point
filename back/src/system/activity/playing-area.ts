/**
 * The playing area is OURS to state, not the model's — and it is stated metric first.
 *
 * SAME LESSON AS player-format.ts, ARRIVED AT THE SAME WAY. The session form collected dimensions in
 * feet and defaulted to a full pitch (330 x 160); the setup frame passed them on as a bare
 * "330x160 grass" with no unit. Generated at that default, two of three activities came back with no
 * field dimensions at all, and the third invented "a 40x30 yard area" — a number appearing nowhere
 * in the input. A coach was told either nothing about how big to make the area, or something made
 * up, and the pilot's own success criteria include setting the activity up confidently.
 *
 * Labelling the unit in the prompt fixed neither. Told the area was "40 x 30 m (44 x 33 yd)", the
 * model still wrote "a 40x30 yard area" in one activity, dropped the unit entirely in another, and
 * omitted the dimensions altogether in a third. That is the same wall player-format.ts hit across
 * four prompt revisions, and the conclusion is the same: the coach's space is a fact, the conversion
 * is arithmetic, and there was never anything here to negotiate. So the model writes the prose and
 * this module corrects the numbers afterwards.
 *
 * METRIC FIRST is Christian's pilot requirement — roughly half of pilot coaches think in metres, and
 * the product should speak international coaching language by default. The yard equivalent follows
 * in brackets rather than being dropped, because the other half do not.
 *
 * Pure and unit-tested; no AI is needed to know whether it works.
 */

/**
 * A stated area: two numbers joined by x / × / "by", optionally carrying a unit.
 *
 * Deliberately requires the PAIR. A single measurement — "two 20-yard end zones", "a 10-yard
 * corridor" — describes a zone inside the area, not the area itself, and resizing those would
 * destroy the internal structure of the activity while claiming to fix its dimensions.
 */
const AREA_PATTERN = /\b(\d+)\s*(?:x|×|by)\s*(\d+)\s*(?:-\s*)?(?:yards?|yds?|metres?|meters?|m)?\b/i

/**
 * Every measurement in the text, rewritten in ONE left-to-right pass.
 *
 * A SINGLE PASS IS THE POINT. The area label this inserts ends in "33 yd", which is itself a yard
 * measurement, so a separate zone pass would convert the conversion. `String.replace` never rescans
 * what a replacer returns, so consuming each position exactly once removes that problem instead of
 * guarding against it. An earlier attempt masked the label with a sentinel string; the sentinel was
 * worse than the bug it fixed.
 *
 * THE PATTERN ALSO HAS TO RECOGNISE ITS OWN OUTPUT. Text already reading "40 x 30 m (44 x 33 yd)"
 * contains two area-shaped pairs. Matching only the first left the second behind and produced
 * "40 x 30 m (44 x 33 yd) (44 x 33 yd)" — the pass corrupting text that was already correct. So the
 * converted forms are matched first, as whole tokens, which makes the rewrite idempotent.
 *
 * Order is load-bearing throughout: converted forms before plain ones, and areas before zones so
 * that "40x30 yard" reads as an area rather than as the zone "30 yard".
 */
const CONVERTED_AREA = String.raw`(\d+)\s*x\s*(\d+)\s*m\s*\(\s*\d+\s*x\s*\d+\s*yd\s*\)`
const CONVERTED_ZONE = String.raw`(\d+)\s*m\s*\(\s*(\d+)\s*yd\s*\)`
/**
 * The unit is optional, but the SPACE BEFORE IT IS NOT SEPARATE FROM IT.
 *
 * Written as `\s*(?:unit)?`, the whitespace is consumed even when no unit follows, so "a 40x30 area"
 * matched "40x30 " with the trailing space and a coach was shown "…(44 x 33 yd)area". Keeping the
 * space inside the optional group means it is only eaten when there is a unit to eat it with.
 */
const PLAIN_AREA = String.raw`\b(\d+)\s*(?:x|×|by)\s*(\d+)(?:\s*-?\s*(?:yards?|yds?|metres?|meters?|m)\b)?`
const PLAIN_ZONE = String.raw`\b(\d+)\s*-?\s*(?:yards?|yds?)\b`

const MEASUREMENT_PATTERN = new RegExp(
    [CONVERTED_AREA, CONVERTED_ZONE, PLAIN_AREA, PLAIN_ZONE].join('|'),
    'gi'
)

/** 1 m = 1.09361 yd. Rounded to whole units: coaches pace areas out, they do not measure them. */
function toYards(metres: number): number {
    return Math.round(metres * 1.09361)
}

/** 1 yd = 0.9144 m. */
function yardsToMetres(yards: number): number {
    return Math.round(yards * 0.9144)
}

export interface PlayingArea {
    lengthMetres: number
    widthMetres: number
    /** Coach-facing rendering, metric first: "40 x 30 m (44 x 33 yd)". */
    label: string
}

export function describeArea(lengthMetres: number, widthMetres: number): PlayingArea {
    return {
        lengthMetres,
        widthMetres,
        label: `${lengthMetres} x ${widthMetres} m (${toYards(lengthMetres)} x ${toYards(widthMetres)} yd)`,
    }
}

/** The session's dimensions as numbers, or null when the coach did not give usable ones. */
export function parseSessionArea(length?: string, width?: string): PlayingArea | null {
    const n = (value?: string): number | null => {
        const parsed = Number(value)
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }

    const l = n(length)
    const w = n(width)
    return l === null || w === null ? null : describeArea(l, w)
}

/**
 * Replace the first stated area with the coach's, and put every yard measurement into metric-first
 * units alongside it.
 *
 * Only the FIRST area pair is treated as the playing area. Later pairs are zones the model described
 * inside it, and resizing those would be a claim about the activity's structure that this module has
 * no basis to make — so they keep their own dimensions and only gain their units.
 */
function rewriteMeasurements(text: string, area: PlayingArea): string {
    let areaDone = false

    return text.replace(
        MEASUREMENT_PATTERN,
        (
            match: string,
            convertedAreaLength?: string,
            _convertedAreaWidth?: string,
            _convertedZoneMetres?: string,
            _convertedZoneYards?: string,
            plainAreaLength?: string,
            _plainAreaWidth?: string,
            plainZoneYards?: string
        ) => {
            // An area already in metric-first form. Re-emitting the label keeps the pass idempotent
            // and still corrects it if the coach's space has since changed.
            if (convertedAreaLength !== undefined) {
                if (areaDone) return match
                areaDone = true
                return area.label
            }

            // A zone already in metric-first form keeps its own size and its own units.
            if (_convertedZoneMetres !== undefined) return match

            if (plainAreaLength !== undefined) {
                if (areaDone) return match
                areaDone = true
                return area.label
            }

            const yards = Number(plainZoneYards)
            if (!Number.isFinite(yards) || yards <= 0) return match
            return `${yardsToMetres(yards)} m (${yards} yd)`
        }
    )
}

export interface ReconcileAreaResult {
    text: string
    /** True when the setup stated an area that was not the coach's. Recorded as evidence either way. */
    corrected: boolean
    /** True when no area was stated at all and one had to be supplied. */
    supplied: boolean
}

/**
 * Rewrite the stated playing area so it matches the space the coach actually has, metric first.
 *
 * Every route ends with a concrete area in the text, because "no dimensions" is the failure this
 * exists to prevent: stated-and-wrong is corrected, absent is supplied, stated-and-right is left
 * exactly as written apart from its units.
 */
export function reconcilePlayingArea(text: string, area: PlayingArea | null): ReconcileAreaResult {
    if (!text || !area) return { text, corrected: false, supplied: false }

    const match = AREA_PATTERN.exec(text)
    if (!match) {
        return {
            text: rewriteMeasurements(`${text.replace(/\s+$/, '')} Play in a ${area.label} area.`, area),
            corrected: false,
            supplied: true,
        }
    }

    // Already correct AND already metric-first: the "m" is the tell. Without that check, "40x30
    // yard" would count as correct for a 40 x 30 m area and keep the wrong unit.
    const alreadyRight =
        Number(match[1]) === area.lengthMetres &&
        Number(match[2]) === area.widthMetres &&
        new RegExp(`${area.lengthMetres}\\s*x\\s*${area.widthMetres}\\s*m\\b`, 'i').test(text)

    return {
        text: rewriteMeasurements(text, area),
        corrected: !alreadyRight,
        supplied: false,
    }
}
