# Frontend regression tests

Run `npm test` from `front/`; the Checks workflow's front job runs it too. Vitest uses the production
Vite aliases and React plugin with jsdom. The tests exercise real components and form/API
serialization. Only authentication and the fetch boundary are replaced; no server or credentials are
needed. `api()` turns a failed request into an ordinary error, so the fetch double records any URL it
does not serve and fails that test in `afterEach`.

`fixtures/a01.json` contains four unchanged response bodies copied from the built-bundle
`codex-output/snap-06.json`. Its `provenance` records the snapshot SHA-256 and exact response keys.
The A01 FA response supplies the activity, diagram and session values; the A01 refusal supplies
the goal question; the other two responses supply review options and session equipment choices.
Activity sentences and choice labels are never invented in the tests.

Tests and fixtures live outside `src/` and `public/`. The production tsconfig includes only `src/`,
and Vite's production entry does not import tests. `tsconfig.test.json` provides type-aware lint
coverage and can be checked with `npx tsc --project tsconfig.test.json --noEmit` independently.

One `it.fails` records an existing accessibility bug: NumberField's sibling label is not
associated with its input. The precision tests still run normally; no production fix is part
of this task. When that bug is fixed, remove `fails` so the accessibility assertion runs normally.
