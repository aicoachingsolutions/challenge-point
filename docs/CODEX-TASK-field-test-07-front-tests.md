# Codex task 07 — A front-end test runner, and the first tests

**Read `docs/CODEX-TASK-field-test-00-RULES.md` first** for where to work and the commit style. Do this after task 06. It is
independent of tasks 01–05; do it after task 05 if you are running everything in one worktree.

## Why

The front has **no tests**. The coach view is checked only by screenshots:

- the activity block (`front/src/app/CheckedActivityBlock.tsx`);
- the field diagram (`front/src/app/FieldDiagram.tsx`);
- the session form (`SessionForm.tsx`);
- the goal question stage I added.

A small automated suite would catch regressions without screenshots.

## Do

1. **Add Vitest, React Testing Library and jsdom** as devDependencies in `front/`. Match the existing Vite 4 and React 18
   versions; pick versions compatible with them. Add `"test": "vitest run"` to `front/package.json`.
2. **Keep test files out of the production build** (check the `tsconfig` `include` and the Vite build) and out of nothing else
   that ships.
3. **Write the first tests.** They render components with fixture data **copied from a real snapshot**: take the props from the
   A01 entries in `codex-input/snap-I.json` (or the newest `codex-output/snap-*.json`). Never hand-invent activity text; the
   fixture must be what the back actually serves.
   - **FieldDiagram:** draws the area, the halfway line and the target zone in green. The team colours are the same in block 1
     and block 2, while the roles swap. No element is labelled with internal ids.
   - **CheckedActivityBlock:** shows the Coach Overview first and Coach Details collapsed. Every sentence in the fixture's
     overview appears on screen. No string from a closed or internal panel leaks into the overview.
   - **The goal question:** renders one option per choice in the fixture (the labels come from the data). Choosing the
     authorized goal submits its exact `widthM` (3.6576 in a FA fixture, or the IFAB 7.32), not a rounded value.
   - **SessionForm:** the numeric width input does not truncate 3.6576 when the value comes from a choice.
4. **If a test exposes a real bug, do not fix it in this task.** Mark it `it.fails` (or `it.skip`) with a comment naming the bug,
   and report it.

## Lint: what "passes" means here

Task 06 made lint run (`front/.eslintrc.js` is now self-contained). Lint then exposed an existing backlog of 901 problems
across `front/src`, which is deferred as a separate clean-up. So `npm run lint` will still exit 1. For this task:

- the files you **add or change** must have no lint errors: run `npx eslint <your files>`;
- the total count must not go up. Compare `npx eslint . --ext ts,tsx` before and after your change, and report both counts.

Do not fix or suppress the existing backlog.

## Verify

```bash
cd front
npm test
npx eslint <the files you added or changed>
npx tsc --noEmit
npm run build
```

All must pass, and the backlog total must not go up (see "Lint: what passes means here"). Commit as `Front tests: ...`.

## Report back with

- the packages and versions added;
- the tests (count and names);
- any bug found.
