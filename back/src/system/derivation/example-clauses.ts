/**
 * **For tests only.** Where a text gives an example: one reading, shared by the checks that hold an example to an example.
 *
 * Added 11 November 2026. On 13 September our transcription of the Attack Development scoring row put a colon where Christian
 * wrote "—for example,", and the example became a definition. Christian's reply received 11 November 2026, item 4: "A
 * restatement should not acquire stronger authority or impose stricter requirements than its governing source supports."
 * "Please incorporate a focused regression check where practical." (received 11 November 2026). Three tests read examples
 * through this one module, so they cannot drift apart: rpc-library.unit.ts (each example of the 13 September email survives in
 * its row), requirement-bindings.unit.ts (no REQUIRED restatement rests only on words its row gives as an example) and
 * primary-scoring.unit.ts (no coach rule's possession or control clause is grounded on such words).
 *
 * THE READING. A marker opens an example clause: 'for example', 'for instance', 'e.g.' or 'such as', in any letter case. The
 * clause runs from the end of the marker to the end of its sentence: the first '.' followed by a space or the end of the text,
 * or ';' or ')'. Whitespace is normalised first. The colon is never a marker: the same 13 September email uses one to introduce
 * required conditions, so punctuation is not read as meaning. It sees markers, not intent: an example given without a marker,
 * or a marker used loosely, needs a reader.
 *
 * Pure, sport-neutral, and imported by tests only; no engine module reads it.
 */

export const EXAMPLE_MARKERS = ['for example', 'for instance', 'e.g.', 'such as'] as const

export interface ExampleClause {
    marker: string
    /** Where the clause starts (just after its marker) and ends, in the whitespace-normalised text. */
    start: number
    end: number
    clause: string
}

/** A text with every run of whitespace made one space and its ends trimmed, as every position here counts it. */
export const normaliseWhitespace = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** Each example clause of a text, marker by marker. */
export function exampleClauses(text: string): ExampleClause[] {
    const t = normaliseWhitespace(text)
    const lower = t.toLowerCase()
    const out: ExampleClause[] = []
    for (const marker of EXAMPLE_MARKERS) {
        for (let at = lower.indexOf(marker); at >= 0; at = lower.indexOf(marker, at + marker.length)) {
            const start = at + marker.length
            let end = t.length
            for (let i = start; i < t.length; i++) {
                if (t[i] === ';' || t[i] === ')' || (t[i] === '.' && (i + 1 === t.length || t[i + 1] === ' '))) {
                    end = i
                    break
                }
            }
            out.push({ marker, start, end, clause: t.slice(start, end) })
        }
    }
    return out
}

/**
 * Whether a text gives a span only as an example: null where the text does not hold the span (whitespace normalised); true
 * where every occurrence of it starts inside an example clause; false where any occurrence starts outside one.
 */
export function spanIsExample(text: string, span: string): boolean | null {
    const t = normaliseWhitespace(text)
    const s = normaliseWhitespace(span)
    if (!s) return null
    const starts: number[] = []
    for (let at = t.indexOf(s); at >= 0; at = t.indexOf(s, at + 1)) starts.push(at)
    if (!starts.length) return null
    const clauses = exampleClauses(t)
    return starts.every((at) => clauses.some((clause) => at >= clause.start && at < clause.end))
}
