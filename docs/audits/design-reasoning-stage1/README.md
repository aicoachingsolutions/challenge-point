# Design-reasoning Stage 1: knowledge-grounded resolution and relational Game Form selection

**Standing.** This is review evidence, for Christian's review. It is not served to coaches and does not authorize anything.

- **What it is.** Christian authorized Steps 1 and 2 and the fixed-response test in Christian's reply to the development proposal, received 3 November 2026. This folder records what was built and what it shows.
- **What it changes.** The stage lives in `back/src/system/design-reasoning/` and is reached only from its own tests and the offline runner. Nothing on the live route or A01's checked pathway imports it, and a static test pins that. The regression snapshot of every live-route and review case is unchanged; see "A01 and the live route" below.
- **What is held.** Steps 3 to 5 are held pending Christian's review. The documents Christian asked for are beside this README, as DRAFTs:
  - `E3-affordance-vocabulary-mapping.DRAFT.md`
  - `E4-conditions-of-use-sample.DRAFT.md`
  - `E7-relevance-rules.DRAFT.md`

**To run.** From `back/`:

- `npm run design:stage1`, or `npm run design:stage1 -- A05 TA02`, prints the demonstration.
- `-- --json <file>` also writes every result with its citations.
- The tests are `src/system/design-reasoning/design-reasoning.unit.ts` and `src/system/activity/fixed-response-pathway.unit.ts`, both registered in `npm test`.

## What was built

| Piece | File | What it does |
| --- | --- | --- |
| Knowledge, as one value | `knowledge.ts` | Gathers the committed workbooks into one value, so a test can change a copy. Readers take ids, relationship rows, ratings and statuses only. A test requires them to agree with the existing loaders. |
| Christian's rulings, as data | `stage1-rulings.json` | E1's scoped translation for A05, the recorded requirement for context-sensitive resolution, and two open decisions: the merge rule (E1) and TA02's context fit (E2). All carry Christian's words verbatim. |
| Our orderings, as data | `selection-basis.json` | The orderings and the one dominance rule Step 2 uses, each with its basis. They are OURS, for Christian's review. |
| Step 1 | `resolve.ts` | Game Problems from the approved Engine Translation, or Christian's scoped ruling where the row is unpopulated (never overriding a populated row). Then the routed context, checked against the context library's own row. Then the Affordance Requirement Profile: each Game Problem's CAR row with its role, the merge by the CAR metadata's `merge_precedence`, the profile under "primary wins" beside it, and every divergence. |
| Step 2 | `forms.ts` | Candidates are the context's ACTIVE GAME_FORM rows. A gate applies: archetype, form status, archetype-to-Game Problem relationship, and whether the form declares the primary Game Problem. Then Pareto dominance over the context row's type and strength and the form's declared relationship to each resolved Game Problem. More than one undominated form gives INSUFFICIENT_EVIDENCE, with the missing basis. |
| One process | `stage1.ts` | The same two calls for every goal. No goal id appears in the code. |
| Runner | `run-stage1-demo.ts` | Prints the results. It is the only file that reads a goal's display name, and only after the decisions are made. |
| Sport-layer source | `../sport-module/design-knowledge-sources.ts` | Hands the sport module's workbook to the sport-neutral stage. Declared in the sport-coupling guard's sport-layer list. |

## The demonstration: A05 and TA02

Full output is in `evidence/stage1-report.txt`; every citation is in `evidence/stage1-results.json`.

### A05 Progress the Attack

1. **Game Problem and context.**
   - Game Problems: GP-001 Create Space (primary) and GP-002 Exploit Space (secondary), by Christian's scoped ruling RUL-E1-A05. Its scope is STAGE1_DEVELOPMENT_DEMONSTRATION, qualified "specifically in the context of progressing against organized opposition".
   - Why a ruling: the Engine Translation row for A05 still reads TBD.
   - Context: RPC-003 Attack Development, by the routing row, which matches library row RPC-REL-062 (COMPATIBLE PRIMARY).
   - Both Game Problems are PRIMARY in RPC-003 (RPC-REL-023 and RPC-REL-024).
   - The Game Problem library relates them: `GP-001 same_domain GP-002`.
2. **Affordance requirements.**
   - GP-001's CAR row: FOI S, OP E, SA S, CIO E.
   - GP-002's CAR row: FOI E, OP E, SA S, CIO E.
   - Merged by `merge_precedence E>S>NR`: FOI E, OP E, SA S, CIO E, which is identical to GP-002 alone.
   - Under "primary wins": FOI S.
   - The divergence is on **FOI only**. It is reported, together with the open merge-rule question and Christian's requirement REQ-E1-CONTEXT-SENSITIVE-RESOLUTION (recorded, not implemented).
3. **Compatible Game Forms.** RPC-003 relates three forms, and all three pass the gate:
   - GF2 (RPC-REL-028, PRIMARY), which declares GP-001 as primary;
   - GF3 (RPC-REL-027, PRIMARY), which declares GP-001 as primary;
   - GF7 (RPC-REL-029, SECONDARY), which declares both GP-001 and GP-002 as primary.
4. **The unresolved tie: INSUFFICIENT_EVIDENCE between GF2, GF3 and GF7.**
   - GF2 and GF3 are related identically on every dimension.
   - GF7 is weaker on context strength but is the only form that declares the secondary Game Problem.
   - No approved knowledge says which of those relationships should weigh more.

### TA02 Secure Possession

1. **Game Problem and context.**
   - Game Problem: GP-015 Maintain Possession, by the approved Engine Translation.
   - Context: RPC-003, by the routing row, which matches library row RPC-REL-068. That row is **SECONDARY**, and so is GP-015's own row in RPC-003 (RPC-REL-026).
   - Open decision **OPEN-E2-CONTEXT-FIT** is carried with Christian's words. The goal is not routed to RPC-006.
2. **Affordance requirements.** All four are Essential, with SA "flagged for field validation". There is no secondary, so nothing is merged.
3. **Compatible Game Forms.** **GF2 is SELECTED**, the only form of RPC-003 that declares GP-015. GF3 and GF7 are excluded, each with its declaration quoted. The archetype workbook relates GA-001 to GP-015 only as COMPATIBLE ("weakly diagnostic or usually subordinate").
4. **Unresolved.** No tie. The context decision (E2) is open, and a ruling could change the context, and with it the forms.

### 5. Wording does not change the decisions

All 13 goals produce byte-identical results when, in a test copy, the following is rewritten:
- every goal's name, definition, "choose this when…" text, entry phrase and Practice Situation name;
- every relationship note, statement, identity statement, Game Form narrative field, Game Problem name and CAR row name.

The results are also unchanged when A05's and TA02's wordings are swapped (`testEveryDecisionIsIdenticalWhenTheWordingIsRewritten`, `testSwappingTwoGoalsWordingChangesNothing`). We checked that this test can fail. A deliberately planted name read, disguised from the static scan, was caught by the wording test alone. A static test also holds every narrative column name out of the stage's code.

## A goal not used in development, and every goal

**The held-out goal: D02 Win the Ball Back.** It is a defending goal, with another Game Problem and another context. It resolves to GP-016 in RPC-007 and selects **GF4** (RPC-REL-051, PRIMARY; GF4 declares GP-016 as primary).

**Every goal, through the same function** (`testEveryGoalGetsAnAnswerThatNamesItsBasisOrWhatIsMissing`). We saw these goals' data while scoping the stage, but the code was written against A05 and TA02 only and was not changed for any other goal.

| Goal | Step 1 | Step 2 | Why |
| --- | --- | --- | --- |
| A01 | RESOLVED (GP-005, RPC-001) | INSUFFICIENT_EVIDENCE: GF2, GF3 | Both are PRIMARY in RPC-001 and declare GP-005 as secondary. GF7 is dominated on context strength. A01's checked pathway uses GF2 by Christian's authorization record, which this stage does not read or change. |
| A02 | RESOLVED (GP-015, RPC-002) | SELECTED GF2 | The only form declaring GP-015. |
| A03 | RESOLVED (GP-006, RPC-004) | NO_COMPATIBLE_FORM | No Game Form declares GP-006. |
| A04 | UNRESOLVED | not evaluated | Engine Translation unpopulated (intentional runtime gap). |
| A05 | RESOLVED (ruling) | INSUFFICIENT_EVIDENCE: GF2, GF3, GF7 | See above. |
| A06 | UNRESOLVED | not evaluated | Engine Translation TBD. |
| D01 | RESOLVED (GP-012, RPC-008) | NO_COMPATIBLE_FORM | RPC-008's forms (GF2, GF3, GF7) do not declare GP-012. |
| D02 | RESOLVED (GP-016, RPC-007) | SELECTED GF4 | Held-out goal. |
| D03 | RESOLVED (GP-016, RPC-008) | NO_COMPATIBLE_FORM | RPC-008's forms do not declare GP-016. |
| TA01 | RESOLVED (GP-002, RPC-006) | SELECTED GF4 | GF2 does not declare GP-002. |
| TA02 | RESOLVED (GP-015, RPC-003) | SELECTED GF2 | See above. |
| TD01 | RESOLVED (GP-004, RPC-007) | NO_COMPATIBLE_FORM | RPC-007 has no row for GP-004, and its forms do not declare it. |
| TD02 | RESOLVED (GP-013, RPC-007) | NO_COMPATIBLE_FORM | RPC-007 has no row for GP-013, and its forms do not declare it. |

**What the defending results show.** The knowledge, not the stage, is what is missing.
- Six of the eleven Game Forms (GF1, GF5, GF6, GF8, GF10, GF11) are related to no context.
- That includes the only forms that declare the defending Game Problems: GF8 (GP-016, GP-017; GP-013) and GF11 (GP-004, GP-012; GP-011).
- So the context library and the Game Form declarations do not meet for four defending goals.

## The proposal's acceptance checks, as far as Steps 1 and 2 reach

| # | Check | Result |
| --- | --- | --- |
| 1 | Approved knowledge and appropriate contexts | Pass. Each resolution cites the translation row or Christian's ruling, the routing row and the library's row. No keyword inference is used. |
| 2 | Relationships, not word matching | Pass. (a) The import closure holds no parser, token scorer or keyword map, and no narrative column is read. (b) The wording rewrites change nothing. |
| 3 | Explained by the knowledge that governed it | Pass for Steps 1 and 2. Every decision carries the rows it read. Steps 3 to 5 are held. |
| 4 | Context changes reconsider the design | Not yet testable. Stage 1 receives no coaching context; the conditions of use (E4) come first. |
| 5 | Representative information, opposition, multiple solutions | Held (Step 5). |
| 6 | One process, no goal-specific code | Pass. No goal, Game Problem, context or Game Form id appears in the stage's code, comments included. Every goal goes through one function. |
| 7 | Insufficient evidence acknowledged | Pass (A05, A01). |
| 8 | Knowledge actually governs | Pass. One CAR rating, one context strength, one form declaration and one ruling were each changed in a test copy, and exactly the dependent decisions moved. A PREFERRED relationship row is honoured as a governed preference. |
| 9 | A01 untouched | Pass. The regression snapshot of every live-route and review case is unchanged: 391 keys, 0 changed leaves. |
| 10 | Determinism | Pass. Two separate runs are byte-identical (`stage1-results.json`, sha-256 470e8f6c…), and reversing every list in the knowledge changes nothing. |

Note of 6 November 2026 (wording only). Every gendered pronoun in this README, the three DRAFT documents and the committed Stage 1 evidence was replaced by 'Christian' or 'Christian's' (whole words, outside every quotation; proved substitution-only line by line; no quotation of Christian's words holds one). Nothing else in the evidence changed, and Stage 1 is not re-run: `stage1-results.json` is now sha-256 e11ceecd… (before the substitutions 470e8f6c…, as above) and `stage1-report.txt` is 836223ac….

## The fixed-response test of the AI-written pathway

`back/src/system/activity/fixed-response-pathway.unit.ts` runs the real router offline with the regression snapshot's stand-ins. Every outbound connection is refused. The generation client answers with a fixed, schema-valid answer, stored in `back/src/system/activity/fixtures/fixed-polish-response.json`. **No model produced it, and no model was called.** The session is 12 players, 40 x 30 m, 20 minutes and the FA 5v5 goal. Measured results are in `evidence/fixed-response-results.json`.

**What a coach is served.**
- **It passes on the first call** for both goals, with no retry. Each served activity carries the DRAFT "Not checked" notice.
- **The server owns** teams, rules, scoring, win condition and constraints, whatever the model writes. Scoring is RPC-003's event for **both** goals.
- **The model owns** the title.
- **The model's setup is served with the server's sentences appended**: "Teams play 6v6." and "Play in a 40 x 30 m (44 x 33 yd) area.", plus the scoring zone. The server also removes words from the model's text: "Each team attacks the end the coach points to." is served as "… the coach points." and "with a gate on each side" as "on each side."
- **The model's how-to-play lines are served first under Rules**, and How to Play is empty (`mergeHowToPlayIntoRules`).
- **Two of three objectives are replaced** by the goal's name ("Progress the Attack.", "Secure possession."). Where the model's objective names an object nothing scores on, the server sets it aside.
- **The duration (20 minutes) appears nowhere** in what the coach is served.

**When the model contradicts the session** (8 players, 20 x 15 m, 10 minutes):
- the area is corrected to the session's;
- the player count and the duration are **served as the model wrote them**, beside the server's own "Teams play 6v6."

**A05 and TA02 compared.** Their served activities differ only in the third library constraint and in the objective that fell back to the goal's name. Both get GF2, the same rules and the same scoring.

## A01 and the live route

No production file is changed. The changes are:
- new files under `back/src/system/design-reasoning/`;
- one new sport-layer file;
- two new unit tests and a fixture;
- the test registry, one `npm` script, and the sport-coupling guard's list of sport-layer files.

**The regression snapshot is unchanged.** `npm run snapshot` covers every live-route and review case. It was taken on `main` (`f534a62`) before any change, and again with every Stage 1 change in place.

- `npm run snapshot:diff` reports `KEYS 391  CHANGED 0  LEAVES 0  ONLY-BEFORE 0  ONLY-AFTER 0`.
- The two files are byte-identical (sha-256 `a8420db0…`; `evidence/regression-snapshot-comparison.txt`).
- The full suite, `npm test`, passed: 148 files, 0 failed, plus the fixed-response test run on its own after it was registered.

## What we need from Christian

1. **E1 merge rule.** Which rule governs the merged profile when the primary and secondary diverge: strongest necessity (the CAR metadata) or "primary wins" (the documentation)?
2. **E2 context decision.** Option (a), a new canonical context, or option (b), transition episodes.
3. **E6 basis for A05.** Is there approved knowledge that should separate GF2 from GF3, or weigh a context's relationship strength against a form's secondary Game Problem? Otherwise A05 stays at insufficient evidence, which Christian has said is acceptable.
4. **Defending goals.** Should GF8 and GF11 (and the other four unrelated forms) be related to contexts, or should RPC-007 and RPC-008 gain rows to the Game Problems their routed goals translate to?
5. **The orderings and the dominance rule** in `selection-basis.json`.
6. **E3, E4, E7.** The questions at the end of each document.
