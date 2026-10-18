# Continuous integration

GitHub Actions runs on every pull request and on pushes to `main` and
`claude/serene-dewdney-c78e18`. A newer run on the same branch or pull request
cancels the one still running.

The back-end job installs locked dependencies, type-checks, runs the unit suite,
builds the deployable bundle, creates a router regression snapshot, and uploads
that snapshot as an artifact. No key or secret is set: the unit suite and the
snapshot need none. The snapshot gives its stubbed model client its own placeholder
key and refuses any outbound connection.

The front-end job installs locked dependencies and runs its production build.
`npm run lint` is not in CI yet. It fails before linting anything: `front/.eslintrc.js`
extends the root `.eslintrc.js`, which names `@typescript-eslint/parser`, and that
parser cannot be resolved from the repository root, where nothing is installed.

Read a failure from the first failing step: a type-check failure names the source
location, a unit failure names its test file, and the snapshot artifact preserves
the full coach-facing regression evidence. A red check means do not merge.
