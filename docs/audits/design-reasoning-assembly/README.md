# Design reasoning: the bounded A05 activity-assembly experiment

**Standing.** Review evidence only. Offline. Not served to coaches, not an authorization, not approved wording, not a selection input.

- **What it is.** Christian authorized "a bounded, offline, review-only activity-assembly experiment for A05 Progress the Attack" in his second reply of 5 November 2026 (received 5 November 2026; filed in the sources repository as `sources/2026-11-05-assembly-authorization/originals/christian-reply-to-dimensions-review.txt`). This folder records what was built, what it shows and how it was checked.
- **The honest answer, in one paragraph.** The existing architecture COMPUTED, from knowledge, the Game Problems and context (Step 1), the compatible Game Forms (Step 2), the scoring event's membership in the routed context, and the structural conditions of each compatible form; 8 of the 53 recorded values are read from knowledge cells or computed by code. There is NO configuration step in the architecture (Steps 3-5 are held), so the configuration is a labelled decision record we ENTERED: 16 values evidenced in his words, 19 illustrative, 7 our inference, 3 unresolved. The coach text is a DRAFT template fill keyed to configuration paths, not the production renderer and not approved wording. His six classes over the 53 values: class 1, 0; class 2, 14; class 3, 10; class 4, 0; class 5, 19; class 6, 10. Part 1 of the report is titled "the activity as assembled", never "as generated".
- **What it changes.** New files in `back/src/system/design-reasoning/`; the stated edits to five existing files in that folder; one entry in `back/scripts/unit-tests.json`; one `npm` script in `back/package.json`; this folder. Nothing on the live route or A01's checked pathway imports the folder. The bundle and the behaviour snapshot are byte-identical to main (see Regression).
- **What it does not do.** No knowledge file, workbook, sport-module file, contract, approved wording, authorization record, realization-choices index, planning model, or Stage 1/2 rulings file is edited. No configuration step, no production relevance join, no live routing change, no width change, no new element-to-affordance relationship.
- **Quotation marks.** Double: his words or approved knowledge, verbatim. Single: ours.

**To run.** From `back/`: `npm run design:assembly` writes `evidence/assembly-report.txt` and `evidence/assembly-results.json`; `npm run design:assembly -- --out <dir>` writes elsewhere. The tests are `src/system/design-reasoning/assembly.unit.ts` (25 test functions, items (a)-(y) of the design), in `npm test`.

## Evidence files

| File | What it is | sha-256 |
| --- | --- | --- |
| `evidence/assembly-report.txt` (1069 lines) | The report: the front (the honest answer with counts, blocking decisions split three ways, non-blocking calls), Part 0 (reconciliation with the 5 November assessment, and reuse), Part 1 (the activity as assembled, review copy with class markers, the learning-design block, the generated rationale), Part 2 (decision trace: his rulings, every value, derived values, computed conclusions, status of this example, requirement account, Laws account, contract items), Part 3 (Game Form alternatives and suitability), Part 4 (three scenarios), Part 5 (checks), Part 6 (his section 8 reconciliations and the architectural dependencies), Part 7 (what we recorded; what a second goal needs). | `31ac65afe3c74b85434f7db0388524a9458cd3ed4f3652fc3e05d5d3798033fc` |
| `evidence/assembly-results.json` (8334 lines) | Every value with what decided it, the computed traces, the coach activity, the account, the suitability and scenario results. | `134bb3dfd8c074c351692fa4545737be2380c347773790f1beb7cc6b4ab5e2cd` |

The runner was run twice (once into this folder, once into a scratch folder): both files byte-identical. No time stamp is written.

## What was built (new files)

| File | Lines | What it does |
| --- | --- | --- |
| `assembly-experiment.review.json` | 1727 | The labelled decision record (OURS). 48 rulings of his, each filed once with his words verbatim, a repository-independent file reference and the US Eastern received date; the nine required parts (his l.95-103 wording); 53 values, one standing each, with `decidedBy` (value evidence quoted), `consulted`, `statusSetBy`, how the value reached the activity; 11 Laws entries; 34 GF2 contract items; 12 requirement-account lines; 6 suitability entries; 3 scenarios; section 8 reconciliations; 10 open decisions; 7 architectural dependencies; what a second goal needs. |
| `assembly-wording.draft.json` | 69 | DRAFT coach wording (OURS, NEWLY PROPOSED, RC3 6.1), keyed by path at the Game Form level: 39 templates in exactly the RC3 sections (Overview 4.1-4.5; Details Setup, Rules, Scoring, Win Condition, Role Exchange, Restarts and Ball Out, Adjustments) plus a What to Watch block (RC3 2.1 coaching observations). Coach terms per RC3 7.4. |
| `assembly.ts` | 862 | Stage file: hand-written validator; his six classes (`sixClassOf`, a total record over the standings plus his provisional flag, in his order); `assembleActivity` (fail closed: Step 1 RESOLVED; illustrative form among the compatible ones; Game Problem ids equal his words' ids; scoring event among the routed context's ACTIVE events); `composeCoachActivity` (pure; throws on unknown placeholders or paths, `expresses` mismatch, whenValue mismatch); the learning-design block; the requirement account join. |
| `assembly-review.ts` | 449 | Stage file, split from `assembly.ts` for readability only: the one-call pipeline, the suitability review (structural conditions for every compatible form, alike), the scenario review, and the report. |
| `assembly-display.ts` | 69 | Presentation only: reads the allowlisted display cells (coach definition, goal name, Game Problem name, Game Form name, scoring-event description, property text) after the decisions. Imported only by the runner and the unit test. |
| `run-assembly-experiment.ts` | 36 | The runner. |
| `assembly.unit.ts` | 637 | Items (a)-(y) of the design, with bite tests. |

## Edits to existing files, and why

| File | Edit | Why |
| --- | --- | --- |
| `knowledge.ts` (+37 -2) | `export const STANDINGS = [...] as const`, `Standing` derived from it, `ILLUSTRATIVE` and `UNRESOLVED` appended at the end; `isStanding`; readers `contextIdentityRules` and `contextValidationRules` (ids, role or domain, stage, status; never text); optional `received`, `file`, `provisional` on `Ruling`; `validation_rules` on the context type; `SOURCE` gains the two new data files. | Design section 2. A standing read from a data file is checked against the list at run time (L2-03, L3-05). The readers serve the requirement account and suitability rows; a unit test pins their agreement with `rpcLibrary`. |
| `trace.ts` (+34 -4) | `STANDING_ORDER` keeps its order with the two new standings after `TEST INPUT`; `STANDING_RANK` is a `Record<Standing, number>` built from it, with a compile-time check that every standing is ranked; `standingRank` throws on a value outside the type; `weakestStanding` ranks every item (so a lone typo throws, never ranks); `conclusionGroup` throws on ILLUSTRATIVE or UNRESOLVED and reaches its last group only by a positive match on RULING or APPROVED, else throws. `CONCLUSION_GROUPS`, `CONCLUSION_GROUP_NOTES`, `EstablishedBy` unchanged. | Design section 2; L1-01, L2-01, L2-02, L3-03, L3-15, L4-03. His six classes live in `assembly.ts`, not here. `weakestStanding` validating every item goes slightly beyond the design's list; Stage 2 output is unchanged (proved below). |
| `structural.ts` (+27 -8) | Optional `standing?` and `assembled?: true` on `StructuralActivity`; when present, the team-size item carries that standing and the "no activity is assembled" / "Step 3 is held" wording is replaced by assembled wording; a new status value `NOT_EVALUABLE_FROM_THE_ASSEMBLED_CONFIGURATION` used only when assembled; `activity` returned exactly as received. | Design section 2; L2-10, L3-17, L4-12. Stage 2 never passes the fields, so its output is unchanged. |
| `design-reasoning.unit.ts` (+15 -1) | Test amendments, see below. | |
| `stage2.unit.ts` (+2 -1) | Test amendment, see below. | |
| `back/scripts/unit-tests.json` (+1 entry) | `./src/system/design-reasoning/assembly.unit.ts`. | So the new test runs in `npm test` (L2-04). |
| `back/package.json` (+1 script) | `design:assembly`. | The runner (L2-04). Not a dependency change, so the bundle's `external` list is unchanged. |

## Amendments to existing tests, and why

1. `design-reasoning.unit.ts`, `testTheStageReachesNoKeywordParserOrTokenScorer`: the exact closure list gains `assembly-display.ts`, `assembly-review.ts` and `assembly.ts`. They import only files already in the closure and their own two JSON files; the closure still reaches no loader beyond `session-planning-model.ts` and `design-knowledge-sources.ts`.
2. `design-reasoning.unit.ts`, `testTheStageReadsNoNarrativeColumn`: `assembly-display.ts` is excluded from the narrative-column ban, and three new assertions pin it instead: it reads exactly the allowlisted narrative columns (`Coach Definition`, `Learning Goal`, `Name`, `game_form_name`, `property_text`); only `run-*.ts` files and `.unit.ts` files import it; nothing outside the folder names it. The ban's intent (no decision reads narrative text) is kept: the display texts reach the assembly as an argument after Steps 1 and 2.
3. `stage2.unit.ts`, `testConclusionGroupsKeepStandingsApart`: the banned-standings list was exhaustive (every standing but APPROVED and RULING), so it gains `ILLUSTRATIVE` and `UNRESOLVED`. A tightening.

No other existing test was changed. Every other static scan (no goal or knowledge id in stage files or runners, comments included; no `toLowerCase`, `RegExp(` or `includes(text`; no `classifications`; the sport-coupling ratchet; the `'Learning Goal'` literal in every runner; no live import) holds for the new files unamended; `assembly.unit.ts` adds its own scan for the experiment's own ids and paths.

## Corrections to the design (the source or the code won)

1. **Restart after a point.** The design's table gives "kickoff by the team that conceded" as "Laws (LAW-8) by default: RULING 23 Oct". His 23 October words do not state who restarts after a point, and the kickoff after a score is his provisional option (first reply of 5 November: "Please retain the ordinary kickoff as an acceptable provisional option for the current prototype"). Split into `restart.afterPoint.method` (his provisional ruling, class 3) and `restart.afterPoint.who` (OURS: our reading that the Laws' conceding-team kick-off applies to a point, class 6).
2. **Kick-off details.** "Ordinary kickoff (Laws kick-off unchanged, 9.15 m included: OUR reading)" carried two standings; split into `start.method` (his provisional ruling, class 3) and `start.kickoffDetails` (OURS, class 6), atomic as section 4 requires.
3. **Offside wording.** Two replies hold his offside decision with different words: received 28 October, "Offside: No offside for this initial small-sided realization, explicitly communicated."; received 29 October, "Offside: None for this initial small-sided realization, explicitly communicated." Both are filed verbatim; both decide the value.
4. **Opposition wording.** Received 28 October: "Opposition: Reciprocal, meaningful objectives with continuous live opposition."; received 29 October: "Opposition: Reciprocal objectives, meaningful defensive pressure, and continuous play through turnovers." The 29 October words decide `opposition.reciprocal`; the 28 October words decide `scoring.mirrored` (OURS).
5. **The 13 September reference.** That reply's recorded first sentence ("Thanks.") is shared with another reply received the same day, so the file reference quotes its first two sentences.
6. **Display allowlist.** Design 2.2 lists four display texts; the Game Problem `Name` and Game Form `game_form_name` columns are added so the coach-readable block can name what the code computed without showing ids.
7. **Game Problems and Game Form.** Shown in a learning-design block generated from the assembly beside the RC3 activity (paths listed in `designBlockPaths`), not in wording templates, so the wording file stays at the Game Form level with no goal-specific literal (L4-15). Test (a) counts the block.
8. **Laws.** The Sport Profile lists 10 laws (one entry each); the ball over an end line with no goal is an 11th, situational entry (`lawId` null, ADAPTATION OWED with the ILLUSTRATIVE value).
9. **Area per outfield player** (100 and 75 square metres) is computed in code and printed in Part 2 with the Decision 4 labels, not in the coach text (RC3 2.3: it does not help the coach run the activity).
10. **Role Exchange.** The illustrative configuration has blocks, so the RC3 Role Exchange section is present ("Nothing changes between blocks").
11. **Validator rules.** "Declared status stronger than the weakest decisive item" is compared by standing (his provisional flag only weakens the printed class); added: a declared APPROVED, RULING or CANDIDATE status needs a decisive item of that standing (L3-01's bite: a CANDIDATE value decided only by a status-setting ruling throws).
12. **File split.** `assembly.ts` would have passed 1300 lines, so `assembly-review.ts` was split off (design section 6 allows it); the closure list therefore gains three files.
13. **Mutation outcomes.** The mutation loop shows 8 values reach the text when changed and 45 refuse (whenValue mismatch, a value read by code given a typed value, an UNRESOLVED value given one, or the 13 September text no longer equal to his words).

## Checks and regression (run from `back/`, on this tree)

- `npx tsc --noEmit -p tsconfig.json`: exit 0.
- Unit files run one by one: `assembly.unit.ts` passed ("mutation loop over 53 values: 8 reached the text, 45 refused"); `design-reasoning.unit.ts` passed; `stage2.unit.ts` passed; `sport-coupling/sport-coupling.unit.ts` passed (occurrences 35, baseline 35: no new sport word in any non-test file).
- `npm test`: `FILES 151  FAILED 0`.
- **Stage 2 unchanged.** After the edits to `knowledge.ts`, `trace.ts` and `structural.ts`, the Stage 2 runner wrote to a scratch folder: `stage2-report.txt` and `stage2-results.json` byte-identical to the committed evidence. `assembly.unit.ts` test (w) repeats this inside `npm test` (results in process, the report through the runner into a temporary folder).
- **Behaviour snapshot.** `origin/main` = f534a62 (checked). `npm run snapshot -- --out <scratch>` then `npm run snapshot:diff` against the f534a62 baseline: `KEYS 391  CHANGED 0  LEAVES 0  ONLY-BEFORE 0  ONLY-AFTER 0`; both files sha-256 `a8420db066c34341366254b9e8063aa9c66688fd777a350ce9aa1d0a2c4da246`.
- **Bundle.** In-memory esbuild bundle of `src/index.ts` (build.js's options) on this tree and on the f534a62 archive: both `6bd210238f7d620c9b968f17edac63cd4984b472320aadf58731e8b4b0a0deed`, 3,228,588 bytes, 192 inputs, 0 inputs under `design-reasoning`.
- **Path-scoped diff** from 38c61e2, excluding the folder and this evidence folder: only `back/package.json` and `back/scripts/unit-tests.json`.
- **Quotes.** Every ruling's words, scope words, decisive value evidence, scenario sentence and quoted template was checked character for character against the cited reply (48 rulings, 203 strings, 0 failures; received dates equal to each reply's US Eastern date). Then every quoted string of his from the two data files was dumped (152 distinct quotes, each with its received date) and run through the external quote checker (`check-quotes.js --no-ban`): 153 quotes and 2 terms, 155 PASS, 0 NEAR, 0 WARN, 0 FAIL; 152 of 152 citations name the right received date.
- No GitHub check runs on a review-branch push (the workflow runs on pull requests and on pushes to main and one other branch); nothing deploys. Green rests on the local type check and `npm test`. Whether a draft PR may be opened only to run the checks is Joe's call.

Passing these engineering tests is not evidence of representative learning effectiveness.
