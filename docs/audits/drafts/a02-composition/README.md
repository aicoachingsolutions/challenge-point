# a02-composition: the TEST-ONLY draft store folder for the isolated A02 foundational test

Stage 9, slice S2 (Christian's authorization: the reply about A02, pasted 10 November 2026). TEST-ONLY. NOT APPROVED. Nothing here is in the engine's knowledge:
only the TEST-ONLY draft store (`back/src/system/derivation/draft-store.ts`) reads this folder, in unit tests (`a02.unit.ts`); no route reads
it, and none of it is in `contracts.json`, `corpus-restatements.json` or `learning-goal-authorizations.json`.

| File | What it is |
|---|---|
| `rpc-002-contract.DRAFT.json` | A CANDIDATE restatement (ours, unreviewed) of the APPROVED rows of RPC-002 High Press Escape that state its four primary scoring events (RPC-REL-075..078, all four, in the approved order), its primary scoring condition (RPC-PROP-133, as conditions of type origin, progression and control) and two REQUIRED identity rows (RPC-ID-006, RPC-ID-008, recorded outside the boundary, establishing nothing). Every item quotes the approved row it restates verbatim, and the WHOLE_GAME scope is ours and over-applying; the count of primary events (V0, ASSUMED from SD-06) was dropped in review, since no measured run needs it. What the item grammar cannot express is declared, never typed by us: the origin value NOT_AUTHORED, the origin and progression referents as open text, the control referent UNDECLARED. |
| `a02-authorization.DRAFT.json` | A DRAFT authorization record for A02 that we drafted: no ruling field filled (ruledOn, by and ruling empty), the authorized set empty, and our finding: not an authorization of zero and not evidence that GF2 alone is sufficient. |
| `rpc-002-coach-rules.CANDIDATE.json` | Stage W3 of the A02 package (11 November 2026). CANDIDATE, TEST-ONLY, NOT APPROVED, NOT LIVE: our wording of High Press Escape's four coach rules with RPC-PROP-133's own 'through the next action' in place of 'with the next pass', every other word kept; the source-to-code check of the four rules, clause by clause, against RPC-PROP-133 and the other RPC-002 rows; and the questions the wording leaves open (Q-a to Q-d, Christian's). Not a draft store file (no '.DRAFT.' in its name), so the draft store does not read it; only the tests-only reader `back/src/system/sport-module/candidate-coach-rules.ts` reads it, in `primary-scoring.unit.ts`, which holds it to its gate and to the live rules. The live rules (`COACH_RULES`) are unchanged, held for the same release decision as the three approved Attack Development rules; the candidate never enters the approved coach wording. |

How to read the build's labels: every DRAFT, DRAFT_KNOWLEDGE and BUILT_FROM_DRAFT_KNOWLEDGE_NOT_APPROVED label the build writes for these
items means CANDIDATE restatement (ours, unreviewed) of an APPROVED row; none says the source row is a draft.

The two files were written by a scratch generator that reads every quoted text and line number from the workbook itself (the slice's notes
name it); the store's own gate checks every quotation, line and key again on every load and refuses the folder whole on any defect.
