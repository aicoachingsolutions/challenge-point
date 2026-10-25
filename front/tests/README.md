# Frontend regression tests

Run `npm test` from `front/`; the Checks workflow's front job runs it too. Vitest uses the production
Vite aliases and React plugin with jsdom. The tests exercise real components and form/API
serialization. Only authentication and the fetch boundary are replaced; no server or credentials are
needed. `api()` turns a failed request into an ordinary error, so the fetch double records any URL it
does not serve and fails that test in `afterEach`.

`fixtures/a01.json` contains four unchanged response bodies copied from the built-bundle
`codex-output/snap-06.json`. Its `provenance` records the snapshot SHA-256 and exact response keys.
Re-copied 25 October 2026 (P1) from the built-bundle regression snapshot `P1-impl.json` (the same four
keys, the bodies unchanged; its SHA-256 in `provenance`), so the activity is the one served since his
reply filed 28 October 2026: the equipment sentence, no exchange sentence in the diagram.
Re-copied 25 October 2026 (P2) from the built-bundle regression snapshot `P2-impl.json` (the same four keys, the
bodies unchanged; its SHA-256 in `provenance`): the goal version's adjustment now says how near the building team's end
line the marked line may go (his reply filed 28 October 2026, item 2). `fixtures/fa-pairing.json` (P2) holds the FA
pairing exactly as the administrator's review evidence carries it in that snapshot (key and path in its `provenance`),
with its provisional depth (his reply filed 28 October 2026, item 8), for the review page's `ProvisionalFigures`.
Re-copied 25 October 2026 (Z) from the built-bundle regression snapshot `Z-impl.json` (the same four keys and the same
pairing path, bodies unchanged; its SHA-256 in `provenance`): the goal version's activity is said as before, only an
authored gap note gaining a dated line. `fixtures/bound-regions.json` (Z) holds the administrator's bound-region accounts
of both versions exactly as that snapshot's review evidence carries them (keys and path in its `provenance`): the zone
version's penalty area bound to the end of the team holding the goalkeeper row (his reply filed 28 October 2026, item 7),
the goal version's bound to its goal, for the review page's `BoundRegionEvidence`.
The A01 FA response supplies the activity, diagram and session values; the A01 refusal supplies
the goal question; the other two responses supply review options and session equipment choices.
Activity sentences and choice labels are never invented in the tests.

Tests and fixtures live outside `src/` and `public/`. The production tsconfig includes only `src/`,
and Vite's production entry does not import tests. `tsconfig.test.json` provides type-aware lint
coverage and can be checked with `npx tsc --project tsconfig.test.json --noEmit` independently.

One `it.fails` records an existing accessibility bug: NumberField's sibling label is not
associated with its input. The precision tests still run normally; no production fix is part
of this task. When that bug is fixed, remove `fails` so the accessibility assertion runs normally.
