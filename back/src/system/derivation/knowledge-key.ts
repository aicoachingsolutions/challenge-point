/**
 * **Which knowledge object an id names** — the one spelling rule, in a module that imports nothing.
 *
 * Library ids and contract ids spell the same object differently (`tl-v0-constraint-pass-combination-gate`,
 * `blind:PASS-COMBINATION-GATE`); neither is rewritten. Exported 13 October from `run-bounded-selection` as
 * `knowledgeKey`, because a second thing had to ask "which knowledge object is this?". Moved here on 14 October
 * 2026 because a third thing must ask it and could not import it there: selection (`generateSelection`)
 * applies his hold on the Pass Combination Gate, and the S-B review found it matched the hold as TEXT while the
 * builder's guard matched by this key — the builder had already been shown passing an aliased spelling once.
 * Importing `run-bounded-selection` from the test library would close an import cycle, so the rule lives where
 * both can reach it, and `run-bounded-selection` re-exports it unchanged.
 */
export const knowledgeKey = (id: string): string =>
    String(id)
        .replace(/^(restated|blind):/, '')
        .replace(/^tl-v0-constraint-/, '')
        .toUpperCase()
