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
`fixtures/zone-diagram.json` (the Z review, round 1, 25 October 2026) holds the zone version's coach diagram exactly as
the built-bundle regression snapshot `Z-fix1.json` serves it (key `review/A01/goalkeeper-1/objects-none`, path
`body.diagram`; its SHA-256 in `provenance`): a penalty area marked at each end, each lying on an active target zone in
both blocks, for `FieldDiagram`'s render order, legend swatch and team-words placement. The other three fixtures were
checked unchanged in that snapshot, so their provenance (`Z-impl.json`) stands.
The A01 FA response supplies the activity, diagram and session values; the A01 refusal supplies
the goal question; the other two responses supply review options and session equipment choices.
Activity sentences and choice labels are never invented in the tests.

`fixtures/pathway-notice.json` (the live-app status notice, 25 October 2026; his reply filed 26 October 2026, item 9(a))
feeds `pathway-notice.test.tsx`. Its `checkedResult` (the live checked activity) and `registry` (the planning
conversation's registry) are unchanged bodies from the built-bundle regression snapshot `fix1.json` (review round 1), which is
byte-identical to `Z-verify1.json` (SHA-256 in `provenance`). The generated choice (`legacyResult`) and the saved
activities (`legacySaved`, `earlierSaved`, `reviewSaved` and `completedSaved` (the same generated activity at the Review and
Completed statuses), `checkedSaved`, `sessionList`) cannot come from that snapshot, whose stubbed
model answers empty so every generation there is refused: they are unchanged bodies from a TEST-ONLY probe of the REAL
router on the same built bundle whose stubbed model answers a polish for three activities. The words that polish
supplies (title, setup, objective, coaching focus, how to play) are marked TEST-ONLY; every other field, the notice
included, is the server's own. The checked build is stored once (`checkedResult.checkedActivity`); each other copy was
verified deep-equal to it before it was removed, and the test puts it back. The notice's words are never written in the
test: every assertion reads them from the body the server sent.

Tests and fixtures live outside `src/` and `public/`. The production tsconfig includes only `src/`,
and Vite's production entry does not import tests. `tsconfig.test.json` provides type-aware lint
coverage and can be checked with `npx tsc --project tsconfig.test.json --noEmit` independently.

One `it.fails` records an existing accessibility bug: NumberField's sibling label is not
associated with its input. The precision tests still run normally; no production fix is part
of this task. When that bug is fixed, remove `fails` so the accessibility assertion runs normally.
