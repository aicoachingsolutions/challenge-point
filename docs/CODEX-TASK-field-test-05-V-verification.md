# Codex task 05 — V: verification matrix, simplicity pins, observation-sheet draft

**Read `docs/CODEX-TASK-field-test-00-RULES.md` first.** The governing design is sections 4.2, 4.3 and 4.4 of
`codex-input/design-field-test-2026-10-27.md`. Baseline snapshot: `codex-output/snap-04.json`.

This task mostly runs checks and writes a report. Commit only if a check finds a real code defect and you fix it.

## Known before you start (from Claude's reviews of K1–K3): report these, do not change them

- **Where things are.** K2 and K3 were built by Claude, not by Codex tasks 03/04: commits `f70e637`, `3efbe72` and `339078a`.
  The goal version is **served** for the FA goal. The snapshot keys for it are named
  `.../objects-pairing:FA-MINI-SOCCER-5V5-2026`. Save and situation cases also exist.
- **Design 4.1 I(d) is not built.** A session with no goalkeeper and a goal that is unstated, or stated without its type, is
  **asked** for its goal or type before being refused for the missing goalkeeper. The 4.2 table says "refused". Record it as a
  known deviation; fixing it needs a design decision.
- **Pin 4.3 "Organize" is not met.** The coach sheet never names the goal's size or the equipment (one 12 x 6 ft goal, cones,
  three bib colours).
- **Pin "no fact said twice" is in question.** "own side of the marked line" appears in the restart set-up sentence and the
  restart-location sentence.

Neither failing pin can be fixed mechanically: both need new or changed coach words, which are Christian's to review. Report
them and **do not add a failing test**.

## 1. The verification matrix (design 4.2)

- **Setup:** BUILT bundle, 40 x 30 m.
- **Run every case through both routes**, the review route and the live route. They must agree. For served cases, check both
  blocks.
- **Cases:** goals stated as each of the following, crossed with goalkeepers 0, 1 and 2:
  - not stated;
  - none;
  - one FA 5v5 goal (the list choice: scaled, 3.6576 m);
  - 3.6576 m, type not stated;
  - 3.6576 m as a mini-goal;
  - a full-size goal;
  - another width, including 3.66 m.
- **Plus:**
  - 11 players / 1 goalkeeper;
  - one area other than 40 x 30.
- **Expected results:** the table in 4.2.
- **Run every mutation in 4.2's list**, each reverted afterwards, and check that each fails the way the table says.
- **Write the results** as a table to `C:/Users/Administrator/Downloads/codex-output/V-matrix.md`: the case, the expected result,
  each route's actual result, and PASS or FAIL.
- **Write the harness as a script** in `codex-output/` (not in `back/src`), so Claude can re-run it.

## 2. Coach simplicity pins (design 4.3)

Check each pin against the served goal version and the served zone version:

- **Sentence count:** the goal version's Details sentence count is no higher than the zone version's. Report both counts.
- **Non-redundancy:** no fact is said twice. The design names one known risk: "own side of the marked line" appears in both the
  placement sentence and the restart sentence.
- **Units:** every number is in metres, and the goal is also given in feet where the coach chooses it.
- **Length:** the overview fits one read.

If a pin fails, add a test that pins it and report it. Fix it only if the fix is mechanical and changes no approved wording.

## 3. Field-test observation sheet: DRAFT for Claude to check

Write `C:/Users/Administrator/Downloads/codex-output/Field-test observation sheet.txt`:

- **Audience:** Christian, a coach educator.
- **Language:** plain. No internal ids (no A01, R2, GA-, KPS, register, realization), no file names, no code words.
- **Purpose:** a sheet to use while watching the goal version played. Each point is a short question to watch for, with room for
  notes.
- **Content:** the points in design 4.4, which come from his 26 October item 13 and his 27 October items 1, 2 and 8. Read those
  items in the reply files and keep his meaning; do not add learning-design opinions of your own.

Do not sign it and do not address it as an email; Claude writes the email.

## Report back with

- the matrix summary (how many cases, any FAIL);
- the pin results;
- the path of the observation sheet;
- any code defect you found, and whether you fixed it.
