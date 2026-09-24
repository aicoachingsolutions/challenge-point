/**
 * Corpus repair — **encoding only** (his ruling of 24 September, repair phase A).
 *
 * He distinguishes three kinds of corpus repair, and only the first may proceed without him:
 *
 *   1. encoding/data repair that restores already-authored knowledge  ← this module, and only this;
 *   2. restatement that makes existing authored meaning machine-expressible;
 *   3. genuinely new knowledge authoring.
 *
 * The stage-B corpus was written as UTF-8 and read back as CP1252, so every non-ASCII character became
 * a run of two or three Latin-1 characters. That is a pure byte-level accident with no semantic content:
 * the authored text is recoverable exactly, by inverting the misreading.
 *
 * **This module makes no character-by-character decisions.** It does not know or care that one sequence
 * happens to be an em dash and another a section sign. It maps each character back to the CP1252 byte it
 * was decoded from, then decodes those bytes as UTF-8 — the exact inverse of the corruption. A string
 * that does not round-trip cleanly is **left untouched**, so anything that is not this specific defect
 * passes through unchanged.
 *
 * The original artefact `stage-b/contracts.json` is never modified. The repair is applied when the
 * corpus is loaded, is counted, and is reported in the diagnostic, so every run states how much of what
 * it read was repaired and of which kind.
 */

/** The CP1252 characters for bytes 0x80–0x9F, which differ from Latin-1. Index 0 is byte 0x80. */
const CP1252_HIGH = [
    0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f,
    0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
]

const BYTE_FOR_CODEPOINT = new Map<number, number>()
for (let byte = 0; byte < 0x100; byte++) {
    const codePoint = byte >= 0x80 && byte <= 0x9f ? CP1252_HIGH[byte - 0x80] : byte
    if (!BYTE_FOR_CODEPOINT.has(codePoint)) BYTE_FOR_CODEPOINT.set(codePoint, byte)
}

/**
 * Invert one CP1252 misreading. Returns the repaired text, or null where the string is not this defect —
 * a character that was never a CP1252 byte, or bytes that are not valid UTF-8.
 */
export function repairEncoding(text: string): string | null {
    const bytes: number[] = []
    for (const character of text) {
        const codePoint = character.codePointAt(0) as number
        const byte = BYTE_FOR_CODEPOINT.get(codePoint)
        if (byte === undefined) return null // not a CP1252 character: this is not the defect
        bytes.push(byte)
    }

    const decoded = Buffer.from(bytes).toString('utf8')
    if (decoded.includes('�')) return null // the bytes were not UTF-8 after all
    return decoded === text ? null : decoded
}

export interface RepairTally {
    /** Strings rewritten. */
    strings: number
    /** Characters removed by recombining multi-character runs into the single character authored. */
    charactersRecovered: number
}

/**
 * Walk a loaded corpus and repair every string in place on a **copy**. Structure, key order and every
 * value that is not this defect are preserved exactly.
 */
export function repairCorpusEncoding<T>(value: T, tally: RepairTally): T {
    if (typeof value === 'string') {
        const repaired = repairEncoding(value)
        if (repaired === null) return value
        tally.strings++
        tally.charactersRecovered += value.length - repaired.length
        return repaired as unknown as T
    }
    if (Array.isArray(value)) return value.map(entry => repairCorpusEncoding(entry, tally)) as unknown as T
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {}
        for (const [key, entry] of Object.entries(value as Record<string, unknown>)) out[key] = repairCorpusEncoding(entry, tally)
        return out as unknown as T
    }
    return value
}
