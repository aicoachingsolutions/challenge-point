# Codex task 06 — Make the front-end lint run

**Read `docs/CODEX-TASK-field-test-00-RULES.md` first** for where to work and the commit style. This task is independent of
tasks 01–05 and touches only `front/` config, plus lint fixes in `front/src`.

## The failure

`cd front && npm run lint` exits 255 before checking any file:

```
Error: Failed to load parser '@typescript-eslint/parser' declared in '.eslintrc.js » ../.eslintrc.js':
Cannot find module '@typescript-eslint/parser'
Require stack:
- C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18\.eslintrc.js
```

`front/.eslintrc.js` cascades into the repo-root `.eslintrc.js`, and that file resolves the parser from the repo root, which has
no `node_modules`. The front already has `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` ^6 in its
devDependencies, with eslint 8.

## Do

1. Make `front/.eslintrc.js` self-contained (`root: true`), keeping the rules it means to apply. **Do not edit or delete the
   repo-root `.eslintrc.js`.** The back may rely on it; check `back/` before assuming anything.
2. Run `npm run lint`. It uses `--max-warnings 0`. Fix what it reports in `front/src`, but **only mechanical fixes**: unused
   imports and variables, `const` for `let`, hook dependency arrays where the fix cannot change behaviour.
3. **Do not change behaviour.** If a rule would need a behavioural change (for example adding a dependency to a `useEffect`
   that would re-run it), add an `eslint-disable-next-line` with a one-line reason instead, and list each one in your report.
4. Turning rules off globally to make lint pass is loosening validation. Do not do it. If a rule is clearly wrong for this
   codebase, report it rather than disabling it.

## Verify

```bash
cd front
npm run lint
npx tsc --noEmit
npm run build
```

All three must pass. Commit as `Front lint runs: ...`.

## Report back with

- the config change;
- the number of fixes, by rule;
- every disable comment, with its reason.
