# Codex task 01 — Check stage I (goal question) before building on it

**Read `docs/CODEX-TASK-field-test-00-RULES.md` first.** This is a review task: fix only real defects.

## Context

Commit `f1628a2` built design stage I (section 4.1, row I): the goal question offers choices generated from data, and the live page
renders the build's question. Its report is `codex-input/stage-I-report.txt`. Its independent review never ran, so this task is
that review.

## Check

1. **Re-run the gate.** `npm test` must report FAILED 0. Take a snapshot and diff it against `codex-input/snap-I.json`; it must
   be identical.
2. **The choices come from data.** `back/src/.../session-object-choices.ts` (grep for it) must contain no goal id, size, kind or
   noun. The labels come from `docs/audits/draft-coach-wording.json` (`objectChoices`), and the objects come from the Sport
   Profile's `boundRegions.pairings`.
3. **Exact values.** A choice stores the entry's `widthM` and `type` exactly; nothing rounds 3.6576. Check the front form too:
   `front/src/.../SessionForm.tsx`, where the design notes a 0.1 step at about line 264. Choosing from the list must not pass
   through that step.
4. **A rounded width falls back.** A goal stated at 3.66 m is "another goal". It is refused as not suitable, and the reason
   names the authorized goal. Prove this with a TEST-ONLY FA entry, the way stage I's tests do.
5. **No goal is ever inferred from goalkeepers** (his 26 October item 11). Grep the new code paths.
6. **The live page asks and accepts the answer.** This is stage I's open issue: it was checked only by reading the source,
   never in a running browser. Start the back and front locally (`back`: `npm run dev`; `front`: `npm run dev`). Open a session
   with 12 players and 1 goalkeeper on 40 x 30 m that states no goals, and request A01 (Goalkeeper Build-Out / Play Out from the
   Back). The page must show the goal question with its choices; answering must save to the session and rebuild. If the local
   back needs credentials or a database you do not have, say so and skip this step. Never enter real credentials.
7. **Stage I's deviations** (listed in its report). For each one, say whether you agree it is sound. Pay most attention to
   "heightM is not stored" and "the ATTRIBUTE question offers only choices stating the attribute".

## Output

- If everything is sound, make no commit and report PASS.
- If there is a real defect: fix it, re-run the gate, commit as `I-fix (...)`, and report what was wrong.
- Save the snapshot as `codex-output/snap-01.json`. Task 02 diffs against it.
