# Codex — field-test build: rules for every task (read first)

These rules apply to tasks 01–07 (`docs/CODEX-TASK-field-test-0N-*.md`). Each run does **one task**.

## Unattended mode

The runner script (`codex-input/run-all-codex-tasks.ps1`) runs the tasks one after another while nobody is at the machine.

- **Never wait for a human.** Nobody will answer a question; decide within these rules, or end the task as BLOCKED.
- **End every run with two files:**
  - `C:/Users/Administrator/Downloads/codex-output/report-NN.md`: the full report (see "Report back with" below).
  - `C:/Users/Administrator/Downloads/codex-output/status-NN.txt`, whose **first line is exactly one word**:
    - `DONE`: the task is complete, the gate is green, and it is committed (or task 01 / 05 found nothing to fix).
    - `BLOCKED`: Christian's words do not cover something, or the design is contradicted by the code in a way you cannot
      settle within these rules. Nothing half-done is committed.
    - `FAILED`: you could not make the gate green.

  On the following lines, give the reason in one or two sentences.
- **Skipping a step is not BLOCKED.** If a step cannot run in this environment (for example, a browser or a database is not
  available), skip it, say so in the report, and carry on.
- **If BLOCKED or FAILED, commit nothing.** Leave your changes uncommitted; the runner saves them to a side branch.
- **Long commands** (`npm test`, `npm run snapshot`, `npm run build`): redirect their output to a log file in `codex-output/`. If
  a command times out in your shell tool, re-run it in the background and poll its log until it finishes. Never report a gate
  result you did not see finish.
- **Stop every server or background process you started** before you end the run.
- **Never run `git checkout`, `git switch`, `git reset --hard`, `git clean` or `git rebase`.** The runner manages branches.

## Where to work

- **Worktree:** `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`, on branch `claude/serene-dewdney-c78e18`.
  Before you start, run `git -C <worktree> branch --show-current` and check it prints that branch.
- **Never read or write `C:\challenge-point` itself.** That is a stale `main` checkout. Only the worktree path above is correct.
- **Inputs** (read-only, outside git): `C:\Users\Administrator\Downloads\codex-input\`
  - `design-field-test-2026-10-27.md` — the governing design. Section 1 is the FA specification (1.6 is the entry as data).
    Section 4.1 lists the stages, 4.2 the verification matrix, 4.3 the simplicity pins, 4.4 the observation sheet. Some paths in
    it point to a scratch folder you do not have; ignore those.
  - `christian-2026-10-26.txt`, `christian-2026-10-27.txt` — Christian's replies, verbatim. Item numbers in the tasks refer to these.
  - `snap-I.json` — the snapshot after stage I. This is the baseline for the first snapshot diff.
  - `stage-I-report.txt` — what stage I built, its deviations and its open issues.
- **Your own output** (snapshots, logs, scratch scripts): `C:\Users\Administrator\Downloads\codex-output\`. Never put probes or
  scratch files in `back/src` or `front/src`.
- **Re-running a harness** (added after the task 05 review): a harness that writes its results next to itself, or runs
  `build.js` (which empties `back/dist`), overwrites evidence when it is re-run in place. Copy it into a new folder (for example
  `codex-output/rerun-NN/`) and run the copy there. Never overwrite an earlier task's evidence files.

## Hard rules

1. **Knowledge belongs to Christian.** Change a knowledge record (register, Sport Profile, realization records, wording data)
   only where his words authorize it. Quote him **verbatim**: copy-paste from the reply file, never retype. Cite as
   `his reply filed 27 October 2026, item N` (or 26 October). Then byte-check every quote against the reply file with a script.
   If his words do not cover something, **stop and report it**. Do not invent a value.
2. **No activity-specific engine code.** No goal ids, activity ids, kinds, roles or sport nouns in `back/src` engine code; they
   belong in data. The no-exception and sport-coupling ratchets in `npm test` enforce this. Never raise a ratchet baseline.
3. **Never loosen validation silently.** If a check refuses something, fix the data or report it; never weaken the check. List
   every validation change in your report.
4. **New coach-facing words are DRAFT** and live in `docs/audits/draft-coach-wording.json`, never in code. Never mark anything
   approved.
5. **A new register row needs a `versions` entry**, in the style of the existing ones
   (`docs/audits/conformance/register-2026-09-18.json`).
6. **Every new field must be read by something.** A projection is only proved when a consumer reads it, so add a test that reads
   it through the real path.
7. **Test on the BUILT bundle, not just ts-node.**
8. **Shell:** no python. Never use bare `git stash` / `git stash pop`. Do not push, merge or open PRs; Claude does that after
   auditing.
9. **Commit when the gate is green.** Use one commit per task, in the style of `git log --oneline -8`: the stage letter first, then
   the design sections and his words. End the message with a blank line and
   `Co-Authored-By: Codex <noreply@openai.com>`.

## The gate (every task that changes code or data)

Run these from `back/`:

```bash
npm test
npm run snapshot -- --out C:/Users/Administrator/Downloads/codex-output/snap-<task>.json
npm run snapshot:diff -- <previous snapshot> C:/Users/Administrator/Downloads/codex-output/snap-<task>.json
```

- **`npm test`** must report `FAILED 0`. If a test fails because of an intended change, re-point it, and give the reason in a
  comment and in your report. Never delete an assertion to make a test pass.
- **The snapshot diff** may change only what the task says changes. Every other key stays byte-identical: demonstrations, every
  non-A01 goal, and the zone version (A01-R1), unless the task says otherwise.
- **Live equals review:** each `live/<goal>/...` key for A01 must agree with its review-route twin.

If anything in `front/` changed, run this from `front/`:

```bash
npx tsc --noEmit
npm run build
```

## Report back with (written to `codex-output/report-NN.md`)

- the commit hash(es);
- the `npm test` summary line;
- the snapshot diff summary (keys compared and changed, and what changed);
- every deviation from the design, with the reason;
- every validation change;
- open issues;
- every quote of Christian's that you used, each with its item number.
