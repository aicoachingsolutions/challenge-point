# Continuous integration

GitHub Actions runs on every pull request and on pushes to `main` and
`claude/serene-dewdney-c78e18`. Superseded runs on the same branch are cancelled.

The back-end job installs locked dependencies, type-checks, runs the unit suite,
builds the deployable bundle, creates a router regression snapshot, and uploads
that snapshot as an artifact. Placeholder model keys are present only because the
snapshot constructs clients; its stubbed model client makes no network request.

The front-end job installs locked dependencies and runs its production build.
`npm run lint` is intentionally not yet in CI: on 19 October 2026 it fails before
linting because the shared ESLint configuration cannot resolve
`@typescript-eslint/parser`.

Read a failure from the first failing step: a type-check failure names the source
location, a unit failure names its test file, and the snapshot artifact preserves
the full coach-facing regression evidence. A red check means do not merge.
