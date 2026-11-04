# Design-reasoning Stage 2: the bounded demonstration

**Standing.** Review evidence only. It is not served to coaches. It is not an authorization.

- **What it is.** Christian authorized "a bounded, review-only demonstration using the D1, D3, D5 and D6 directions" in his reply to the Stage 2 decision package, received 4 November 2026. This folder records what was built and what it shows, for his review.
- **What it changes.** Files in `back/src/system/design-reasoning/`, its tests, the test registry, one `npm` script, and this folder. Nothing else. Nothing on the live route or A01's checked pathway imports the stage. The regression snapshot is byte-identical (see the section A01 and the live route).
- **What it does not do.** No activity assembly, no general configuration stage, no validation (Steps 3 to 5 stay held). No production relevance join. No live routing change. No knowledge file, workbook or sport-module file is changed.
- **Quotation marks.** Double: his words or approved knowledge, verbatim. Single: ours, including the stage's own output labels.

**To run.** From `back/`:

- `npm run design:stage2` writes `evidence/stage2-report.txt` and `evidence/stage2-results.json`. `npm run design:stage2 -- --out <dir> A05` writes elsewhere, for named goals.
- The tests are `src/system/design-reasoning/stage2.unit.ts` (30 tests) and `src/system/design-reasoning/design-reasoning.unit.ts` (Stage 1's, amended). Both are in `npm test`.

**Evidence files.**

- `evidence/stage2-report.txt`: the report, for a reader. Part A is A05. Part B is every goal. Part C groups every conclusion by how it is established. Part D lists the conditions-of-use entries. Part E lists the framework principles the stage was built to respect.
- `evidence/stage2-results.json`: every result, with every citation and influence trace.
- Two runs give byte-identical files (sha-256 `37c9c5a6…` and `c0805585…`).

## What was built

| Piece | File | What it does |
| --- | --- | --- |
| His rulings, as data | `stage2-rulings.json` | D1 to D6 and the authorization paragraph, his words verbatim. A ruling's scope is recorded as his only where his words state one, quoted beside it; elsewhere it is empty. Also the structures they govern: the composite-profile wording, the Game Form gate, the integrity classification, the open decision for TA02. |
| Conditions of use | `conditions-of-use.stage2.json` | Ten entries in the structure he approved under D5: W-P, W-L1, W-H1, W-H2, W-L2, N-P, N-L1, N-H1, C-BASE, PGPL-CREATE-SPACE-BOUNDARY. Each source keeps its own standing. Review-only: not the sport module's fields. |
| Test fixture | `width-scenarios.test-fixture.json` | Six width scenarios for A05. Every value is a TEST INPUT. The two deciding circumstances are TEST ASSUMPTIONS, and each states the area it describes. |
| D1 | `resolve.ts` | Each Game Problem's CAR row with role and provenance; the union view; the primary-led effective profile; one finding per requirement the secondary rates more strongly. |
| Step 1 fix | `resolve.ts` | Status `RESOLVED_NOT_RELATED_TO_CONTEXT` where the routed context has no row for the primary Game Problem. |
| D3 | `forms.ts` | Our three orderings and the dominance rule are removed; `selection-basis.json` is deleted (git keeps it). The gate stays. Outcomes: SELECTED, COMPATIBLE_ALTERNATIVES, NO_GOVERNED_RELATIONSHIP_ESTABLISHED. |
| D6 | `structural.ts` | Structural preconditions (test-only), the continuous-play baseline default, and the archetype's integrity conditions, classified by his D6. No pass-or-fail verdict. |
| D5 | `width-comparison.ts` | The paired, test-only comparison of W-H1 and W-H2. |
| Influence trace | `trace.ts` | Every decision carries `influencedBy`, `consulted` and `citedOnly`, each item with its standing. Every conclusion carries `establishedBy`, and the report groups it by the weakest standing among what decided it. |
| One process | `stage2.ts` | Steps 1 and 2 for every goal; the structural conditions and the width comparison for the goal the fixture names. No goal id in the code. |
| Runner | `run-stage2-demo.ts` | Writes the two evidence files. It is the only Stage 2 file that reads knowledge display text, after the results are computed. |

Stage 1's `stage1-rulings.json` is kept. Its E1 and E2 open decisions are marked superseded by D1 and D2. RUL-E1-A05 records that D1 retains the A05 designation. Stage 1's runner prints the new shapes. Stage 1's evidence files are unchanged.

## A05 Progress the Attack

Full output: `evidence/stage2-report.txt`, Part A.

### 1. Game Problems and context

- GP-001 Create Space is primary and GP-002 Exploit Space is secondary, by his scoped ruling RUL-E1-A05, retained by his D1. Each CAR row's provenance says the role was set by RUL-E1-A05 and D1-4NOV, and that A05's unpopulated Engine Translation row permitted it.
- The unpopulated row is among what decided A05's Game Problems: populated, it would block the ruling. A test populates it and A05 becomes UNRESOLVED.
- Context RPC-003, by the routing row, the context registry, the library's runtime status and the library row RPC-REL-062.
- Both Game Problems are PRIMARY in RPC-003 (RPC-REL-023, RPC-REL-024). Status: RESOLVED.

### 2. The composite profile (D1)

| | FOI | OP | SA | CIO |
| --- | --- | --- | --- | --- |
| GP-001, PRIMARY (CAR row GP-001) | S | E | S | E |
| GP-002, SECONDARY (CAR row GP-002) | E | E | S | E |
| Union view (`merge_precedence` E>S>NR) | E (GP-002) | E (both) | S (both) | E (both) |
| Effective profile, primary-led | S | E | S | E |

- The union view is labelled as such. It is never the effective profile.
- One finding: FOI. The secondary rates it E, the primary S. Outcome INSUFFICIENT_EVIDENCE: 'no approved relationship establishes how to reconcile the difference'. It is an unresolved secondary consideration. It is not promoted.
- The four outcomes we proposed are typed. Only INSUFFICIENT_EVIDENCE can occur: the knowledge holds no reconciliation relationship. If one were ever added to the data, the stage stops with an error rather than guess.
- The effective profile is scoped to the isolated review pathway, by his words. It is not a canonical amendment. The CAR Matrix is unchanged.
- The trace cites the Composite Game Problem Runtime Specification RC1 v1.0 as 'cited only', with its own status (Implementation Specification): section 5, section 7 in full, and section 9 (Priority Resolution) in full. It decides nothing.
- The document is the one that came with his reply. It matches the 149 lines we had rebuilt and adds the 14 we lacked. He said he "will check whether it is complete", so the stage does not call it complete.
- Two possible tensions with D1's reading are noted for his reconciliation, not resolved:
  - Section 7 makes the merged profile the primary input to downstream ecological reasoning. D1 keeps the strongest-necessity merge as a union view only.
  - Section 9 speaks of reducing the secondary's influence where recommendations compete. D1 keeps a stronger secondary rating as a finding at insufficient evidence.
- REQ-E1-CONTEXT-SENSITIVE-RESOLUTION stays recorded, not implemented.

### 3. Game Forms (D3)

- GF2, GF3 and GF7 are COMPATIBLE_ALTERNATIVES. Preference: INSUFFICIENT_EVIDENCE.
- Each form's context strength and declarations are shown, labelled 'compatibility information, not a preference'. Nothing orders them. They are listed in id order.
- GF2 and GF3 are PRIMARY in RPC-003 and declare GP-001 as primary. GF7 is SECONDARY in RPC-003 and declares GP-001 and GP-002 as primary.
- The form declarations are the sport module's, whose status is DRAFT (CANDIDATE). The outcome is his D3 reading over them: compatibility, not demonstrated suitability.
- The trace records every gate input among what decided the outcome: the context's form rows and its archetype row (RPC-REL-003); the archetype workbook's row for GP-001 (GAK-0001, CONSTITUTIVE); the form declarations; and what set the primary in Step 1. Each archetype row is labelled 'gate input: non-contradiction (compatibility) only; not support for the Game Form'. A test makes GAK-0001 CONTRADICTORY, or RPC-REL-003 inactive, and the outcome moves.
- Context strengths are consulted, never decisive. Each trace item is listed once.
- What could distinguish the forms, K1 to K5, is listed. All five are absent. K1 (a PREFERRED row) is checked on every run; K2 to K5 are recorded absent.
- His sentence on a conditional preference is carried with the result.

### 4. Structural conditions (D6; continuous play under D5)

The same for GF2, GF3 and GF7 (all GA-001), with the configured activity 6 v 6 (TEST INPUT):

- 'the ball is the task object' (FOI) and 'an opposing team is a competitor' (CIO): PRESENT. Evidence status INFERRED. Test-only. Labelled 'structural precondition present; not evidence of ecological relevance; does not distinguish Create Space from Exploit Space'.
- Continuous play (C-BASE): 'APPLIES_AS_BASELINE_DEFAULT'. No knowledge file the stage reads can record a departure, and no activity is assembled. So it is reported as a default, not as a condition evaluated and found to hold. It is a baseline representative condition, not an Interaction Regulation.
- Integrity conditions, read from the archetype workbook (GAK-0103 to GAK-0110). Each condition's class is his D6. The structural signals are our mapping (INFERRED), not his.

| Condition | His D6 class | Signal (ours, INFERRED) | Result before activity assembly |
| --- | --- | --- | --- |
| 01, 02, 04 | required condition | none | not evaluable before activity assembly |
| 03 | required condition | opposition present | signal present: an opposing team with players; expression emergent |
| 05 | required condition | continuous-play baseline | signal present: the baseline default applies; expression emergent; the link to condition 05 is ours |
| 06, 08 | breach description | none | a risk, not evaluable |
| 07 | breach description | opposition present | a risk, not evaluable: an opposing team with players is present, but that does not show the opposition can change progression |

- Every status that rests on a signal carries evidence status INFERRED. Its trace names the mapping with standing OURS.
- A breach is reported as indicated by the design only where it is structurally certain: an opposing team with no players.
- No pass-or-fail integrity verdict is printed. The report quotes the Canonical Reference: integrity is "a continuum describing ecological fidelity rather than a pass-or-fail judgement".
- **Wording confirmation.** He agreed to the classification "subject to confirming the original wording". We did that check, against workbook rows GAK-0103 to GAK-0110 (all role CONDITION) and the Game Archetype Canonical Reference v1.1. The check is ours, for him to confirm; the report says so.

### 5. The paired width comparison (D5)

Configured area 40 x 30 m. Width runs across the direction of play. All values are test inputs. Each deciding circumstance states the area it describes: the area at the coach's available width (the proposed widened area), when attacks begin. Nothing is assumed about the configured area.

| Scenario | Inputs | W-H1 | W-H2 | Outcome (rule) | Proposal |
| --- | --- | --- | --- | --- | --- |
| S1 | available 40 x 40; 6 v 6; defenders can still organize = true; usable space exists = false | conditions met | not met | PRIMARY_INVITATION_CONDITIONS_MET | offered, test-only: widen from 30 m to 40 m, length unchanged |
| S2 | as S1, but defenders = false; usable space = true | not met | conditions met | SECONDARY_EXPLOITATION_CONDITIONS_MET | not offered for the primary; width kept |
| S3 | both NOT_SUPPLIED | insufficient | insufficient | INSUFFICIENT_EVIDENCE (circumstances not supplied) | none; width kept |
| S4 | both true | not met | not met | INSUFFICIENT_EVIDENCE (neither decides) | none; width kept |
| S5 | S1's assumptions; available 40 x 30 | conditions met | not met | NO_ROOM_WITHIN_AVAILABLE_SPACE | none; width kept |
| S6 | S1's assumptions; 7 v 5 | insufficient | insufficient | INSUFFICIENT_EVIDENCE (structural assumption not evaluable) | none; width kept |

- **One meaning per circumstance.** Each hypothesis states its two deciding circumstances once, as the circumstances themselves (for example W-H1(i), 'Defenders can still organize, shift and contest the added width.'). 'The defence is functionally organized, in his sense' is a separate background assumption of both hypotheses (W-H1(a), W-H2(a)), unverified.
- **S1.** The proposal's basis: 'the coach's available width is the only bound supplied; no knowledge sets the size of a widening'. It is labelled test-only and not eligible for production. The proposal names W-H1's unverified background assumptions (a), (c) and (d), and says W-H2's conditions are not met. Structural facts: 1200 m2 (100 m2 per player) before, 1600 m2 (133.3 m2 per player) after, each labelled as having no approved threshold. Four representative risks are reported, each as a risk, never a verdict: W-L2; RPC-PROP-042, "Possession circulates without improving attacking conditions."; and integrity conditions 06 and 07.
- **S2.** The result says widening might make exploitation (GP-002) the more immediate problem. That is a way the widening could undermine the primary learning intention. The primary stays GP-001.
  - The source of the not-offered consequence is named among what decided it: W-H2's intended influence (ours), in the test-only comparison D5 authorized. It is an outcome of that comparison, not an exclusion rule.
  - W-L1 is consulted, not decisive. The boundary sentence is 'cited only', beside his permission to cite it (AUTH-4NOV). So is the long-term requirement.
  - Because the circumstances describe the widened area, the result also says that keeping the configured width is not shown to pose the primary problem either.
  - A reported tension, not acted on. Under S2's assumption that defenders can no longer organize, shift and contest the added width, the situation may fall outside the qualifier of the ruling that set the primary: "specifically in the context of progressing against organized opposition". The ruling is consulted, not decisive.
- **S3.** It names both missing circumstances. Each could come from 'coach observation or future feedback; never geometry or player numbers'.
- **S4.** Both true meets neither hypothesis's conditions. Each hypothesis is reported as 'CONDITIONS_NOT_MET'; the pair decides neither. The remark that an organized defence may concede width deliberately is added only where both circumstances are true.
- **S5.** W-H1's conditions are met, but no widening fits the coach's available space. The configured width, which lies within the limits, is kept.
- **S6.** W-H1's assumption (b), numbers roughly balanced, is not evaluable with 7 v 5: 'roughly balanced' has no approved threshold, and N-H1 is deferred. N-L1 reports the unequal numbers as uncertainty.
- **Outside the fixture**, each pinned by a test:
  - A configured area that already exceeds the available space gets its own outcome, 'CONFIGURED_AREA_EXCEEDS_AVAILABLE_SPACE'. There is no proposal, and the configured area is not endorsed or called kept.
  - Non-positive dimensions give 'INVALID_TEST_INPUT'.
  - W-H1's assumption (b) takes two equal team sizes, each a positive whole number. So 0 v 0, a negative count, a fractional count or three teams all give insufficient evidence, each named for what it is. A team with no players is named as such.
- **W-L2 and N-L1 decide nothing.** Where a team has no players, they report structural certainty (CIO cannot be met). They exclude nothing, because his D6 holds any rule that could exclude a design until the rule-level source and status check. A test removes both checks from the data and no outcome moves. The W-L2 check reads team sizes only, not the area.
- Every result names the rule that gave its outcome. W-H1 and W-H2 are always reported together.

## Every goal through Steps 1 and 2

Full output: `evidence/stage2-report.txt`, Part B. The code was not changed for any goal.

| Goal | Step 1 | Step 2 | Change from Stage 1 |
| --- | --- | --- | --- |
| A01 | RESOLVED (GP-005; RPC-001) | COMPATIBLE_ALTERNATIVES: GF2, GF3, GF7 | was GF2, GF3; GF7 is no longer set aside on context strength (D3) |
| A02 | RESOLVED (GP-015; RPC-002) | SELECTED GF2 | wording only |
| A03 | RESOLVED (GP-006; RPC-004) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | renamed from NO_COMPATIBLE_FORM |
| A04 | UNRESOLVED (translation unpopulated) | NOT_EVALUATED | none |
| A05 | RESOLVED (GP-001, GP-002 by ruling; RPC-003) | COMPATIBLE_ALTERNATIVES: GF2, GF3, GF7 | same three forms; no ordering |
| A06 | UNRESOLVED (translation unpopulated) | NOT_EVALUATED | none |
| D01 | RESOLVED (GP-012; RPC-008) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | renamed; carries the knowledge-population finding |
| D02 | RESOLVED (GP-016; RPC-007) | SELECTED GF4 | wording only |
| D03 | RESOLVED (GP-016; RPC-008) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | renamed; carries the knowledge-population finding |
| TA01 | RESOLVED (GP-002; RPC-006) | SELECTED GF4 | wording only |
| TA02 | RESOLVED (GP-015; RPC-003) | SELECTED GF2 | carries OPEN-D2-POSSESSION-STABILIZATION instead of the superseded E2 question |
| TD01 | RESOLVED_NOT_RELATED_TO_CONTEXT (GP-004; RPC-007) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | Step 1 fix; carries the knowledge-population finding |
| TD02 | RESOLVED_NOT_RELATED_TO_CONTEXT (GP-013; RPC-007) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | Step 1 fix; carries the knowledge-population finding |

- Every exclusion reads 'no governed relationship established; not evidence that the Game Form is ecologically unsuitable'.
- D01, D03, TD01 and TD02 carry his sentence: "The missing defending-goal relationships can remain a separate knowledge-population finding." Which goals it covers is our reading, and the result says so. A03 is not a defending goal and does not carry it.

## What approved knowledge establishes, and what rests on something weaker

His authorization: "Please distinguish what the engine can establish through approved knowledge from what it can demonstrate only through test-only hypotheses."

Each conclusion carries `establishedBy`. The report groups it by that and by the weakest standing among what decided it (APPROVED, then RULING, CANDIDATE, OURS, test input). Part C lists every conclusion in its group, with its weakest decisive source. A test pins the separation: no conclusion resting on a ruling, candidate data, an entry of ours or a test input is grouped as approved knowledge, and no unresolved status is grouped as established.

1. **Established through approved knowledge.** Established by approved knowledge, and every row that decided it is APPROVED.
   - For every goal with an approved Engine Translation (A01, A02, A03, D01, D02, D03, TA01, TA02, TD01, TD02): its Game Problems, its status, and its union view.
   - TD01 and TD02's status is 'RESOLVED_NOT_RELATED_TO_CONTEXT'.
   - Every goal's context, including A04, A05 and A06.
2. **Established by his rulings.** Decided by a ruling of his, with approved knowledge.
   - A05's Game Problems and status (RUL-E1-A05, continued by D1).
   - A05's union view: which rows are merged rests on his ruling.
   - Every goal's primary-led effective profile (D1, for the isolated review pathway only, not a canonical amendment).
3. **Rests on candidate data.** Every SELECTED and COMPATIBLE_ALTERNATIVES outcome (A01, A02, A05, D02, TA01, TA02). These are his D3 reading over the sport module's CANDIDATE Game Form declarations (module DRAFT).
4. **Rests on our inference, no test input.** For A05's three forms: the continuous-play baseline default, and integrity condition 05's structural signal. Both rest on C-BASE and our signal mapping.
5. **Structural findings on test inputs.** Not hypotheses, and not evidence of relevance:
   - the two structural preconditions;
   - integrity condition 03's signal;
   - the W-L2 and N-L1 checks in each scenario, except S6's N-L1 uncertainty report;
   - S5's no-room proposal.
6. **Demonstrated only under test-only hypotheses.** S1's outcome and proposal; S2's outcome and proposal; S5's outcome.
7. **Insufficient evidence.**
   - A05's FOI finding.
   - A05's and A01's Game Form preference.
   - Integrity conditions 01, 02, 04, 06, 07 and 08 before activity assembly.
   - S3, S4 and S6, including S6's N-L1 report.
   - A04's and A06's Game Problems, status and Step 2.
   - Every goal with no governed Game Form relationship (A03, D01, D03, TD01, TD02).

## Conditions-of-use entries (D5)

All ten are in `conditions-of-use.stage2.json`. Every entry records field evidence 'none'. None is an empirically validated effect.

| Entry | Evidence class | Kind | Permitted engine use |
| --- | --- | --- | --- |
| W-P | ESTABLISHED PRINCIPLE | conceptual or structural principle (proposed; pending his acceptance) | structural check and uncertainty reporting |
| W-L1 | LOGICAL INFERENCE | conceptual or structural principle (proposed; pending his acceptance) | structural check and uncertainty reporting |
| W-H1 | CAUSAL HYPOTHESIS | hypothesis | test-only comparison |
| W-H2 | CAUSAL HYPOTHESIS | hypothesis | test-only comparison |
| W-L2 | LOGICAL INFERENCE | conceptual or structural principle (proposed; pending his acceptance) | structural check and uncertainty reporting |
| N-P | ESTABLISHED PRINCIPLE | conceptual or structural principle (proposed; pending his acceptance) | structural check and uncertainty reporting |
| N-L1 | LOGICAL INFERENCE | conceptual or structural principle (proposed; pending his acceptance) | structural check and uncertainty reporting |
| N-H1 | CAUSAL HYPOTHESIS | hypothesis | deferred |
| C-BASE | LOGICAL INFERENCE | conceptual or structural principle (proposed; pending his acceptance) | structural check and uncertainty reporting |
| PGPL-CREATE-SPACE-BOUNDARY | REFERENCE KNOWLEDGE | reference knowledge, cited only (not a premise) | trace citation only |

- **No entry is labelled accepted.** He approved the entry structure, not any entry's text. Each principle is 'proposed; pending his acceptance' until he accepts it.
- **The boundary sentence is no premise.** It never appears among what decided anything. A test checks this under every combination of the deciding circumstances.
- **His examples are PROVISIONAL.** His width examples of 3 November and 31 October are filed with standing PROVISIONAL (his words, an illustrative example), not RULING. His D5 sentences stay RULING.
- **Provenance at the point of use.** Wherever an entry appears in a trace, the item lists the standings of its sources (for W-P: APPROVED, CANDIDATE, REFERENCE ONLY, RULING).
- **W-L1** is the version he was shown, with its second clause hedged as his words were: 'If useful space already exists when attacks begin, Create Space is not the problem posed; exploiting it may be the immediate problem.' The earlier draft's added prohibition is withdrawn. It could exclude a design, so it waits for the rule-level source and status check.
- **C-BASE**'s link to integrity condition 05 is marked as ours: his D5 supports continuous play as a baseline but does not link it to condition 05.
- **Quote check.** Every quote string was dumped and run through the quote checker (`check-quotes.js --no-ban`). That covers `stage2-rulings.json`, `conditions-of-use.stage2.json`, `stage1-rulings.json` and the quotes held in `stage2-results.json`. Result: 141 quote strings in the three data files, 141 PASS, 0 FAIL; the results file's 21 quote strings, 21 PASS. The report's 80 quoted spans and this file's quoted spans also pass. None was dropped.

## Framework principles the stage was built to respect (D6)

He approved the non-causal framework principles for further testing. No code evaluates them as rules. Each is pinned by a test, or marked not exercised:

| Principle | Pinned by |
| --- | --- |
| R0.1: the rationale is recorded at decision time | `testInfluenceTraceNamesWhatDecides`, `testConclusionGroupsKeepStandingsApart` |
| R2.1a: no relevance through words | `testWordingRewriteChangesNothing`, Stage 1's `testTheStageReadsNoNarrativeColumn` |
| R2.5: primary and secondary are each judged with their role | `testA05CompositeProfile`, `testNoPromotionForAnyPair` |
| R3.2: a condition that cannot be evaluated gives insufficient evidence, never holds | `testNotSuppliedGivesInsufficientEvidenceForEveryGeometry`, `testATeamWithNoPlayers`, `testStructuralConditionsOfTheA05Forms` |
| R4.4: tradeoffs are reported, never weighted | not exercised: the stage produces no tradeoffs, because Steps 3 to 5 are held |
| Compatibility is never presented as relevance | `testA05AndA01AreCompatibleAlternatives`, `testExclusionWording`, `testConclusionGroupsKeepStandingsApart` |

A test checks that every named test exists. The Game Form gate is not one of these principles: it is Stage 1's gate, now supported by his D3. Every other draft rule waits for the rule-level source and status check he asked for, drafted separately.

## Acceptance checks

Shown for his review; he will judge the results himself.

| What he asked the demonstration to establish | What it shows (for his review) | Where |
| --- | --- | --- |
| Preserve A05's primary and secondary requirements without concealing their differences | Both rows with role and provenance, the union view with sources, the primary-led profile, one FOI finding. Lowering GP-002's FOI in a test copy removes the finding. For every ordered pair of CAR rows, the effective profile is the primary's row. | `testA05CompositeProfile`, `testNoPromotionForAnyPair`, `testLoweringTheSecondarysFoiRemovesTheFinding` |
| Identify GF2, GF3 and GF7 as compatible alternatives without manufacturing a preference | Shown for A05 and A01. Changing GF7's context strength, or every form row's strength, in a test copy changes no form decision. | `testA05AndA01AreCompatibleAlternatives`, `testNoContextStrengthMovesAnyFormDecision` |
| Evaluate structural conditions and relevant representative risks | Within D6: preconditions test-only; integrity conditions classified, signals marked as ours, no verdict; risks reported as risks. Where a team has no players, W-L2 and N-L1 report structural certainty (CIO cannot be met) and decide nothing. | `testStructuralConditionsOfTheA05Forms`, `testATeamWithNoPlayers` |
| Compare W-H1 and W-H2 under explicitly contrasting hypothetical conditions | Six scenarios. Both hypotheses always reported. Each circumstance states the area it describes. Flipping one test assumption moves only that scenario's result. | `testEachWidthScenario`, `testBothHypothesesAreAlwaysReportedTogether`, `testFlippingOneAssumptionMovesExactlyTheWidthOutcome` |
| Identify which knowledge or assumptions support each conclusion | Every decision carries its influence trace; every conclusion its `establishedBy` and group. A test changes each gate input of Steps 1 and 2 named below, and each test input and test assumption of every width scenario. A change moves the decision exactly when the item is listed as deciding it. | `testInfluenceTraceNamesWhatDecides`, `testConclusionGroupsKeepStandingsApart`, `stage2-results.json` |
| Report insufficient evidence whenever those conditions cannot be justified | Shown. With a deciding circumstance not supplied: 112 combinations of area, available space and team sizes, each under 3 patterns of missing circumstances (336 cases), all give insufficient evidence. No proposal exceeds the available space, and an area beyond it is never kept. | `testNotSuppliedGivesInsufficientEvidenceForEveryGeometry`, `testNeverProposesBeyondTheAvailableSpace`, `testInvalidTestInputs` |

The gate inputs the trace test changes: the archetype workbook's row for the primary Game Problem; the context's archetype row; A05's unpopulated Engine Translation row.

Also tested:

- Nothing is labelled empirically established or eligible for production.
- Two runs are byte-identical, and reversing every list changes nothing.
- Rewriting the knowledge rows' names, notes and statements changes nothing: no decision reads text. The stage copies our own entry statements into its results for the reader.
- No goal, Game Problem, context, Game Form, archetype, row, ruling or entry id appears in the stage's code.
- Nothing outside the folder imports the stage.
- Each quote that names a repository row matches that row.
- No entry is labelled accepted; a ruling's scope is his only where his words state it.

## A01 and the live route

No production file is changed. The changes are confined to `back/src/system/design-reasoning/`, its two tests, the test registry, the `design:stage2` script in `back/package.json`, and this folder.

**The regression snapshot is unchanged.** `npm run snapshot` covers every live-route and review case.

- The baseline was taken on `main` (`f534a62`) before any change. A second snapshot was taken during the review corrections (14:41), before their last edits (14:47-14:48). So the snapshot was re-taken on the clean, committed tree at `0cfb34c` (15:34).
- All three have sha-256 `a8420db066c34341366254b9e8063aa9c66688fd777a350ce9aa1d0a2c4da246`.
- `npm run snapshot:diff` reports `KEYS 391  CHANGED 0  LEAVES 0  ONLY-BEFORE 0  ONLY-AFTER 0`.
- Recorded in `evidence/regression-snapshot-comparison.txt`.

**Tests.** The full suite, `npm test`, passed with every change in place, including the review corrections: `FILES 150  FAILED 0`. That includes `design-reasoning.unit.ts` (amended) and `stage2.unit.ts` (30 tests).

A01's checked pathway does not read this stage. Its Game Form, GF2, comes from his authorization record, which the stage neither reads nor changes. The stage now lists GF2, GF3 and GF7 as A01's compatible alternatives; that is review evidence only.

## What remains held

- Steps 3 to 5: activity assembly, a general configuration stage, validation.
- Production relevance joins, and any element-to-affordance join.
- Any live routing change, including TA02's. The Possession Stabilization context stays out of the engine.
- N-H1 as a causal hypothesis.
- A canonical width row, or any production configuration change.
- Every E7 rule except the principles above, and every rule that could exclude a design (W-L1's withdrawn prohibition, W-L2 and N-L1 as exclusions).
- Coach-facing use. AI-written activities stay internal and are not evidence of the learning-design capability.

## What is needed before the full Stage 2 configuration work

### His decisions

Each is his to decide. None is proposed as an answer here.

1. **The Composite specification's governing language.** He is checking whether the document is complete and reconciling the original; sections 7 and 9 are noted above as possible tensions with D1's reading. A decision, and any approved reconciliation relationship, would unblock two things: a canonical effective-profile rule beyond the review pathway, and outcomes other than insufficient evidence for findings like A05's FOI.
2. **How the two deciding circumstances could be known.** Today nothing establishes whether usable space already exists, or whether defenders can still organize, shift and contest. An observation category, or a future-feedback field, would let the comparison use observed circumstances rather than test assumptions. It would also serve the context-sensitive resolution requirement. Using W-H1 and W-H2 beyond the test-only comparison would still need his approval of the hypotheses and of their deciding conditions (ours), and field evidence. He asked: "Please do not represent either hypothesis as empirically established or eligible for production selection."
3. **What decides S4 and the both-false case.** No approved relationship decides between the hypotheses when both circumstances are true, or both false; the pair decides neither. Whether such knowledge is wanted is his call.
4. **A home for a width configuration.** He authorized no canonical width row. One would be needed before any widening reaches production.
5. **Bounds, or none.** Whether to author what 'roughly balanced' means, or what extreme geometry is. The EM guidance (EM schema, CANDIDATE) says: "Extreme geometry may remove important representative affordances." This decides whether W-L2, N-L1 and W-H1's assumption (b) could ever do more than report structural certainty or uncertainty.
6. **N-H1.** Whether to evaluate it after reviewing the width comparison.
7. **The entries' content.** His acceptance of W-P, W-L1, W-L2, N-P, N-L1 and C-BASE as written, beyond this demonstration. Each is labelled 'proposed; pending his acceptance' until then.
8. **Our readings he has not ruled on.** Each is marked as ours in the data:
   - the integrity-condition wording check (his classification was "subject to confirming the original wording");
   - the structural-signal mapping for conditions 03, 05 and 07;
   - C-BASE's link to condition 05;
   - the not-offered consequence in S2 (W-H2's intended influence);
   - which goals carry the defending-goal finding.
9. **The Game Form declarations.** Every SELECTED and excluded Step 2 outcome rests on the sport module's declarations, which are CANDIDATE (module DRAFT, approved_by TBD). Approving them would let Step 2 outcomes rest on approved knowledge. (K2, whether the declaration columns carry emphasis, is a separate question.)
10. **Knowledge that could distinguish GF2, GF3 and GF7** (K1 to K5). Optional. Any preference would be conditional and justified by the learning problem.
11. **The defending-goal relationships.** They would give D01, D03, TD01 and TD02 a governed Game Form relationship, and TD01 and TD02 a context row for their Game Problem.
12. **A03.** No form RPC-004 relates declares GP-006, so A03 has no governed Game Form relationship. A declaration or relationship would unblock A03's Step 2.
13. **A04 and A06.** Their Engine Translation rows are unpopulated. A04's is marked an intentional runtime gap; A06's reads 'TBD'. A translation would unblock their Steps 1 and 2.
14. **A05's Engine Translation.** It reads 'TBD'. A05 resolves only through RUL-E1-A05 (scope STAGE1_DEVELOPMENT_DEMONSTRATION), continued by D1 for this demonstration. A translation, or a ruling for the full Stage 2 work, would carry A05 beyond the demonstration.
15. **A home for the structural preconditions.** D6 allows them only "in the isolated tests", and they have no Sport Profile entry. A home would let them run beyond the isolated tests.
16. **D2.** After the P2 example (below): the context's identity, transitions and scoring; then TA02.

### Authorizations

- **Release of Step 3.** Only an assembled activity can express integrity conditions 01, 02 and 04, or show breaches 06, 07 and 08.

### Our deliverables, for his review

- **The rule-level source and status check** for the remaining E7 rules: "Please provide a rule-level source and status check before enabling the remaining rules". After his review, it could unblock rules that exclude a design or claim that an element serves an affordance (including W-L1's withdrawn prohibition, and W-L2 and N-L1 as anything more than reports).
- **The complete P2 example**: "Before approving P2, please provide one complete, coach-readable example".

## Differences from the build spec

Where we went beyond, or read, the build spec. His words govern; none of these changes his knowledge.

1. **D2 is recorded too.** The spec listed D1 and D3 to D6 for `stage2-rulings.json`. We also recorded D2, and an open decision for TA02 (OPEN-D2-POSSESSION-STABILIZATION), because marking Stage 1's E2 question superseded would otherwise leave TA02 carrying no open decision. The proposed context stays out of the engine.
2. **The authorization paragraph is recorded** as AUTH-4NOV, with his permission to cite the boundary sentence. It is cited beside the boundary sentence in S2's trace.
3. **RUL-E1-A05 gains a `continuedBy` field** quoting D1's sentence on A05, beside the supersession markers.
4. **A PREFERRED row is reported inside COMPATIBLE_ALTERNATIVES**, as `preference.status` UNCONDITIONAL_GOVERNED_PREFERENCE. That keeps the spec's three outcomes. No PREFERRED row exists.
5. **Step 2 outcomes carry `establishedBy` RULING**, not APPROVED KNOWLEDGE. His D3 governs the gate and the compatibility-only reading. The form declarations it reads are CANDIDATE, so the report groups these outcomes as resting on candidate data.
6. **The player-range check reports NOT_CHECKED, not PASS, where a range is declared** (a correction in the decision package). No form declares a range, so no output changes.
7. **No decision reads statement text.** The degenerate solution (RPC-PROP-042) and the two breach descriptions are read by id, context, category, role and status. Their text is held as a verbatim quote in the conditions-of-use data, and a test requires it to equal the knowledge row. Only the runner prints knowledge statements, for the reader.
8. **Structural conditions run only for the goal the fixture names** (A05), because the preconditions need team sizes, a test input.
9. **N-L1 runs as a structural check in each width scenario.** Where a team has no players it reports structural certainty and decides nothing; otherwise it reports unequal numbers as uncertainty. This is not N-H1, which is evaluated nowhere. The spec said W-L2 'decides only where structurally certain'. We follow his D6 instead, which holds any rule that could exclude a design, so W-L2 and N-L1 decide nothing here.
10. **S4: each hypothesis is 'CONDITIONS_NOT_MET', and the pair's outcome is INSUFFICIENT_EVIDENCE.** The spec wrote insufficient evidence for both. Each hypothesis's conditions are supplied and plainly not met, so reporting them as not met follows R3.2; the pair still decides neither. A spec difference, raised with Joe.
11. **The deciding circumstances are stated once each**, as themselves (W-H1(i), (ii); W-H2(i), (ii)). 'The defence is functionally organized' is a background assumption, (a), of both hypotheses, as in our earlier entry drafts. The first version had folded (a) into a circumstance with two meanings.
12. **The composite specification's sections 7 and 9 are cited in full** with section 5, all as 'cited only', with possible tensions noted for his reconciliation.
13. **The static id test is wider**: it also bans row ids (RPC-PROP, GAK, OIC) and every id held in the stage's own data files from the code. Three comments were reworded to keep his quoted ids out of the code.
14. **Continuous play is reported as 'APPLIES_AS_BASELINE_DEFAULT'**, not 'holds by design' as the spec put it. No knowledge file can record a departure and no activity is assembled, and R3.2 says a condition that cannot be evaluated never holds.
15. **Integrity condition 07, with an opposing team present, is 'RISK_NOT_EVALUABLE'**, not 'not indicated'. Present players do not show that the opposition can change progression. The structural signals are marked as our mapping, not his classification.
16. **A configured area beyond the available space has its own outcome**, and invalid dimensions give 'INVALID_TEST_INPUT'. The spec's outcomes did not cover these cases.
17. **The report groups conclusions seven ways, not three.** It keeps his rulings, candidate data, our inferences and structural findings on test inputs apart from approved knowledge and from test-only hypotheses. Step 1's status is reported apart from its context, so an unresolved status is never grouped as established.
