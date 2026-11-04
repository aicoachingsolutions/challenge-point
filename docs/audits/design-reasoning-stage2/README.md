# Design-reasoning Stage 2: the bounded demonstration

**Standing.** Review evidence only. It is not served to coaches. It is not an authorization.

- **What it is.** Christian authorized "a bounded, review-only demonstration using the D1, D3, D5 and D6 directions" in his reply to the Stage 2 decision package, received 4 November 2026. This folder records what was built and what it shows.
- **What it changes.** Files in `back/src/system/design-reasoning/`, its tests, the test registry, one `npm` script, and this folder. Nothing else. Nothing on the live route or A01's checked pathway imports the stage. The regression snapshot is byte-identical (see the section A01 and the live route).
- **What it does not do.** No activity assembly, no general configuration stage, no validation (Steps 3 to 5 stay held). No production relevance join. No live routing change. No knowledge file, workbook or sport-module file is changed.
- **Quotation marks.** Double: his words or approved knowledge, verbatim. Single: ours, including the stage's own output labels.

**To run.** From `back/`:

- `npm run design:stage2` writes `evidence/stage2-report.txt` and `evidence/stage2-results.json`. `npm run design:stage2 -- --out <dir> A05` writes elsewhere, for named goals.
- The tests are `src/system/design-reasoning/stage2.unit.ts` (new) and `src/system/design-reasoning/design-reasoning.unit.ts` (Stage 1's, amended). Both are in `npm test`.

**Evidence files.**

- `evidence/stage2-report.txt`: the report, for a reader. Part A is A05. Part B is every goal. Part C groups every conclusion. Part D lists the conditions-of-use entries. Part E lists the framework rules that ran.
- `evidence/stage2-results.json`: every result, with every citation and influence trace.
- Two runs give byte-identical files (sha-256 `99460e5e…` and `023c38ab…`).

## What was built

| Piece | File | What it does |
| --- | --- | --- |
| His rulings, as data | `stage2-rulings.json` | D1 to D6 and the authorization paragraph, his words verbatim. Also the structures they govern: the composite-profile wording, the Game Form gate, the integrity classification, the open decision for TA02. |
| Conditions of use | `conditions-of-use.stage2.json` | Ten entries in the structure he approved under D5: W-P, W-L1, W-H1, W-H2, W-L2, N-P, N-L1, N-H1, C-BASE, PGPL-CREATE-SPACE-BOUNDARY. Each source keeps its own standing. Review-only: not the sport module's fields. |
| Test fixture | `width-scenarios.test-fixture.json` | Six width scenarios for A05. Every value is a TEST INPUT. The two deciding circumstances are TEST ASSUMPTIONS. |
| D1 | `resolve.ts` | Each Game Problem's CAR row with role and provenance; the union view; the primary-led effective profile; one finding per requirement the secondary rates more strongly. |
| Step 1 fix | `resolve.ts` | Status `RESOLVED_NOT_RELATED_TO_CONTEXT` where the routed context has no row for the primary Game Problem. |
| D3 | `forms.ts` | Our three orderings and the dominance rule are removed; `selection-basis.json` is deleted (git keeps it). The gate stays. Outcomes: SELECTED, COMPATIBLE_ALTERNATIVES, NO_GOVERNED_RELATIONSHIP_ESTABLISHED. |
| D6 | `structural.ts` | Structural preconditions (test-only), the continuous-play baseline, and the archetype's integrity conditions, classified by his D6. No pass-or-fail verdict. |
| D5 | `width-comparison.ts` | The paired, test-only comparison of W-H1 and W-H2. |
| Influence trace | `trace.ts` | Every decision carries `influencedBy`, `consulted` and `citedOnly`, each item with its standing. Every conclusion carries `establishedBy`. |
| One process | `stage2.ts` | Steps 1 and 2 for every goal; the structural conditions and the width comparison for the goal the fixture names. No goal id in the code. |
| Runner | `run-stage2-demo.ts` | Writes the two evidence files. It is the only Stage 2 file that reads display text, after the results are computed. |

Stage 1's `stage1-rulings.json` is kept. Its E1 and E2 open decisions are marked superseded by D1 and D2. RUL-E1-A05 records that D1 retains the A05 designation. Stage 1's runner prints the new shapes. Stage 1's evidence files are unchanged.

## A05 Progress the Attack

Full output: `evidence/stage2-report.txt`, Part A.

### 1. Game Problems and context

- GP-001 Create Space is primary and GP-002 Exploit Space is secondary, by his scoped ruling RUL-E1-A05, retained by his D1.
- Context RPC-003, by the routing row; library row RPC-REL-062.
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
- The effective profile is scoped to the isolated review pathway. It is not a canonical amendment. The CAR Matrix is unchanged.
- The trace cites the Composite Game Problem Runtime Specification RC1 v1.0, sections 5 and 7, with its own status (Implementation Specification), as 'cited only'.
- REQ-E1-CONTEXT-SENSITIVE-RESOLUTION stays recorded, not implemented.

### 3. Game Forms (D3)

- GF2, GF3 and GF7 are COMPATIBLE_ALTERNATIVES. Preference: INSUFFICIENT_EVIDENCE.
- Each form's context strength and declarations are shown, labelled 'compatibility information, not a preference'. Nothing orders them. They are listed in id order.
- GF2 and GF3 are PRIMARY in RPC-003 and declare GP-001 as primary. GF7 is SECONDARY in RPC-003 and declares GP-001 and GP-002 as primary.
- The archetype relationship (GA-001 relates GP-001 CONSTITUTIVE, GAK-0001) is labelled 'non-contradiction (compatibility) only; not support for the Game Form'.
- What could distinguish them, K1 to K5, is listed. All five are absent. K1 (a PREFERRED row) is checked on every run; K2 to K5 are recorded absent.
- His sentence on a conditional preference is carried with the result.

### 4. Structural conditions (D6; continuous play under D5)

The same for GF2, GF3 and GF7 (all GA-001), with the configured activity 6 v 6 (TEST INPUT):

- 'the ball is the task object' (FOI) and 'an opposing team is a competitor' (CIO): PRESENT. Evidence status INFERRED. Test-only. Labelled 'structural precondition present; not evidence of ecological relevance; does not distinguish Create Space from Exploit Space'.
- Continuous play (C-BASE): HOLDS_BY_DESIGN. No authorized departure is recorded. It is a baseline representative condition, not an Interaction Regulation.
- Integrity conditions, read from the archetype workbook (GAK-0103 to GAK-0110):

| Condition | His D6 class | Result before activity assembly |
| --- | --- | --- |
| 01, 02, 04 | required condition | not evaluable before activity assembly |
| 03 | required condition | structural signal present: opposition present by design; expression emergent |
| 05 | required condition | structural signal present: the continuous-play baseline; expression emergent |
| 06, 08 | breach description | a risk, not evaluable |
| 07 | breach description | a risk, not indicated by the design (an opposing team with players is present) |

No pass-or-fail integrity verdict is printed. The report quotes the Canonical Reference: integrity is "a continuum describing ecological fidelity rather than a pass-or-fail judgement".

### 5. The paired width comparison (D5)

Configured area 40 x 30 m. Width runs across the direction of play. All values are test inputs.

| Scenario | Inputs | W-H1 | W-H2 | Outcome | Proposal |
| --- | --- | --- | --- | --- | --- |
| S1 | available 40 x 40; 6 v 6; defenders can still organize = true; usable space exists = false | conditions met | not met | PRIMARY_INVITATION_CONDITIONS_MET | offered, test-only: widen from 30 m to 40 m, length unchanged |
| S2 | as S1, but defenders = false; usable space = true | not met | conditions met | SECONDARY_EXPLOITATION_CONDITIONS_MET | not offered for the primary; width kept |
| S3 | both NOT_SUPPLIED | insufficient | insufficient | INSUFFICIENT_EVIDENCE | none; width kept |
| S4 | both true | insufficient | insufficient | INSUFFICIENT_EVIDENCE | none; width kept |
| S5 | S1's assumptions; available 40 x 30 | conditions met | not met | NO_ROOM_WITHIN_AVAILABLE_SPACE | none; width kept |
| S6 | S1's assumptions; 7 v 5 | insufficient | insufficient | INSUFFICIENT_EVIDENCE | none; width kept |

- **S1.** The proposal's basis: 'the coach's available width is the only bound supplied; no knowledge sets the size of a widening'. It is labelled test-only and not eligible for production. Structural facts: 1200 m2 (100 m2 per player) before, 1600 m2 (133.3 m2 per player) after. Each fact is labelled as having no approved threshold. Four representative risks are reported, each as a risk, never a verdict: W-L2; RPC-PROP-042, "Possession circulates without improving attacking conditions."; and integrity conditions 06 and 07.
- **S2.** The result says widening might make exploitation (GP-002) the more immediate problem. That is a way the widening could undermine the primary learning intention. The primary stays GP-001. The long-term requirement and the boundary sentence are 'cited only'.
- **S3.** It names both missing circumstances. Each could come from 'coach observation or future feedback; never geometry or player numbers'.
- **S4.** Both true matches neither hypothesis's conditions. Neither decides.
- **S5.** W-H1's conditions are met, but no widening fits the coach's available space.
- **S6.** W-H1's assumption (b), numbers roughly balanced, is not evaluable with 7 v 5: 'roughly balanced' has no approved threshold, and N-H1 is deferred. N-L1 reports the unequal numbers as uncertainty.
- W-H1 and W-H2 are always reported together. W-H1's assumptions (c) and (d) are shown as unverified background assumptions.

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
| D01 | RESOLVED (GP-012; RPC-008) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | renamed |
| D02 | RESOLVED (GP-016; RPC-007) | SELECTED GF4 | wording only |
| D03 | RESOLVED (GP-016; RPC-008) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | renamed |
| TA01 | RESOLVED (GP-002; RPC-006) | SELECTED GF4 | wording only |
| TA02 | RESOLVED (GP-015; RPC-003) | SELECTED GF2 | carries OPEN-D2-POSSESSION-STABILIZATION instead of the superseded E2 question |
| TD01 | RESOLVED_NOT_RELATED_TO_CONTEXT (GP-004; RPC-007) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | Step 1 fix |
| TD02 | RESOLVED_NOT_RELATED_TO_CONTEXT (GP-013; RPC-007) | NO_GOVERNED_RELATIONSHIP_ESTABLISHED | Step 1 fix |

Every exclusion reads 'no governed relationship established; not evidence that the Game Form is ecologically unsuitable'. The missing defending-goal relationships stay a knowledge-population finding.

## What is established, what is only shown under test-only hypotheses, and what is insufficient

Each conclusion carries `establishedBy`. Part C of the report lists every conclusion in its group.

- **Established through approved knowledge** (APPROVED KNOWLEDGE, RULING, or a logical inference that reads no test input):
  - each goal's Game Problems, context and status;
  - each CAR row and union view;
  - each primary-led effective profile (by his D1);
  - each Game Form outcome (by his D3; the form declarations it reads are CANDIDATE);
  - for A05, the continuous-play baseline and integrity condition 05's structural signal.
- **Demonstrated only under test-only hypotheses** (they rest on a test input or a test assumption):
  - the two structural preconditions;
  - integrity conditions 03 and 07's signals;
  - S1 and S2's outcomes and proposals;
  - S5's outcome;
  - the structural checks in each scenario, except S6's N-L1 uncertainty report.
- **Insufficient evidence:**
  - A05's FOI finding;
  - A05's and A01's Game Form preference;
  - integrity conditions 01, 02, 04, 06 and 08 before activity assembly;
  - S3, S4 and S6, including S6's N-L1 report that unequal numbers cannot be evaluated;
  - A04 and A06 (unresolved);
  - every goal with no governed Game Form relationship.

## Conditions-of-use entries (D5)

All ten are in `conditions-of-use.stage2.json`. Every entry records field evidence 'none'. None is an empirically validated effect.

| Entry | Evidence class | Kind | Permitted engine use |
| --- | --- | --- | --- |
| W-P | ESTABLISHED PRINCIPLE | accepted conceptual or structural principle | structural check and uncertainty reporting |
| W-L1 | LOGICAL INFERENCE | accepted conceptual or structural principle | structural check and uncertainty reporting |
| W-H1 | CAUSAL HYPOTHESIS | hypothesis | test-only comparison |
| W-H2 | CAUSAL HYPOTHESIS | hypothesis | test-only comparison |
| W-L2 | LOGICAL INFERENCE | accepted conceptual or structural principle | structural check and uncertainty reporting |
| N-P | ESTABLISHED PRINCIPLE | accepted conceptual or structural principle | structural check and uncertainty reporting |
| N-L1 | LOGICAL INFERENCE | accepted conceptual or structural principle | structural check and uncertainty reporting |
| N-H1 | CAUSAL HYPOTHESIS | hypothesis | deferred |
| C-BASE | LOGICAL INFERENCE | accepted conceptual or structural principle | structural check and uncertainty reporting |
| PGPL-CREATE-SPACE-BOUNDARY | REFERENCE KNOWLEDGE | accepted conceptual or structural principle | trace citation only |

- 'Accepted' here means used as a design premise in this demonstration. His approval of the structure is not an approval of any entry's text; each entry says so.
- The boundary sentence never appears among what decided anything. A test checks this under every combination of the deciding circumstances.
- **Quote check.** Every quote in `stage2-rulings.json` and `conditions-of-use.stage2.json` was dumped and run through the quote checker (`check-quotes.js --no-ban`): 124 quote strings (including `stage1-rulings.json`), 124 PASS, 0 FAIL. None was dropped.

## Framework rules that ran (D6)

Only non-causal framework rules that neither exclude a design nor claim that an element serves an affordance:

- R0.1: the rationale is recorded at decision time.
- R2.1a: no relevance through words.
- R2.5: primary and secondary are each judged with their role.
- R3.2: a condition that cannot be evaluated gives insufficient evidence.
- R4.4: tradeoffs are reported, never weighted.
- Compatibility is never presented as relevance.

The Game Form gate is not one of them. It is Stage 1's gate, now supported by his D3. Every other draft rule waits for the rule-level source and status check he asked for, drafted separately.

## Acceptance checks

| What he asked the demonstration to establish | Result | Where |
| --- | --- | --- |
| Preserve A05's primary and secondary requirements without concealing their differences | Pass. Both rows, the union view with sources, the primary-led profile, one FOI finding. Lowering GP-002's FOI in a test copy removes the finding. For every ordered pair of CAR rows, the effective profile is the primary's row. | `testA05CompositeProfile`, `testNoPromotionForAnyPair`, `testLoweringTheSecondarysFoiRemovesTheFinding` |
| Identify GF2, GF3 and GF7 as compatible alternatives without manufacturing a preference | Pass, for A05 and A01. Changing GF7's context strength, or every form row's strength, in a test copy changes no form decision. | `testA05AndA01AreCompatibleAlternatives`, `testNoContextStrengthMovesAnyFormDecision` |
| Evaluate structural conditions and relevant representative risks | Pass, within D6: preconditions test-only; integrity conditions classified, no verdict; risks reported as risks. A team with no players makes W-L2 and N-L1 decide. | `testStructuralConditionsOfTheA05Forms`, `testATeamWithNoPlayers` |
| Compare W-H1 and W-H2 under explicitly contrasting hypothetical conditions | Pass. Six scenarios. Both hypotheses always reported. Flipping one test assumption moves only that scenario's result. | `testEachWidthScenario`, `testBothHypothesesAreAlwaysReportedTogether`, `testFlippingOneAssumptionMovesExactlyTheWidthOutcome` |
| Identify which knowledge or assumptions support each conclusion | Pass. Every decision carries its influence trace; every conclusion its `establishedBy`. | `stage2-results.json` |
| Report insufficient evidence whenever those conditions cannot be justified | Pass. With a deciding circumstance not supplied, 336 combinations of area, available space and team sizes all give insufficient evidence. No proposal exceeds the available space. | `testNotSuppliedGivesInsufficientEvidenceForEveryGeometry`, `testNeverProposesBeyondTheAvailableSpace` |

Also tested: nothing is labelled empirically established or eligible for production; two runs are byte-identical and reversing every list changes nothing; rewriting every name, note and statement changes nothing; no goal, Game Problem, context, Game Form, archetype, row, ruling or entry id appears in the stage's code; nothing outside the folder imports it; each quote that names a repository row matches that row.

## A01 and the live route

No production file is changed. The changes are confined to `back/src/system/design-reasoning/`, its two tests, the test registry, the `design:stage2` script in `back/package.json`, and this folder.

**The regression snapshot is unchanged.** `npm run snapshot` covers every live-route and review case.

- The baseline was taken on `main` (`f534a62`) before any change. The new snapshot was taken with every Stage 2 change in place.
- Both files have sha-256 `a8420db066c34341366254b9e8063aa9c66688fd777a350ce9aa1d0a2c4da246`.
- `npm run snapshot:diff` reports `KEYS 391  CHANGED 0  LEAVES 0  ONLY-BEFORE 0  ONLY-AFTER 0`.
- Recorded in `evidence/regression-snapshot-comparison.txt`.

**Tests.** The full suite, `npm test`, passed: `FILES 150  FAILED 0`. That includes `design-reasoning.unit.ts` (amended) and `stage2.unit.ts` (new).

A01's checked pathway does not read this stage. Its Game Form, GF2, comes from his authorization record, which the stage neither reads nor changes. The stage now lists GF2, GF3 and GF7 as A01's compatible alternatives; that is review evidence only.

## What remains held

- Steps 3 to 5: activity assembly, a general configuration stage, validation.
- Production relevance joins, and any element-to-affordance join.
- Any live routing change, including TA02's. The Possession Stabilization context stays out of the engine.
- N-H1 as a causal hypothesis.
- A canonical width row, or any production configuration change.
- Every E7 rule except the six above.
- Coach-facing use. AI-written activities stay internal and are not evidence of the learning-design capability.

## Knowledge decisions needed before the full Stage 2 configuration work

Each is his to decide. None is proposed as an answer here.

1. **The Composite specification's governing language.** He is reconciling the complete original. A decision, and any approved reconciliation relationship, would unblock a canonical effective-profile rule beyond the review pathway, and outcomes other than insufficient evidence for findings like A05's FOI.
2. **How the two deciding circumstances can be known.** Today nothing establishes whether usable space already exists, or whether defenders can still organize, shift and contest. An observation category or a future-feedback field would unblock W-H1 and W-H2 outside test assumptions, and the context-sensitive resolution requirement.
3. **A home for a width configuration.** He authorized no canonical width row. One would be needed before any widening reaches production.
4. **Bounds, or none.** Whether he wants to author what 'roughly balanced' or 'extreme geometry' means, or leave them unquantified. This decides whether W-L2, N-L1 and W-H1's assumption (b) can ever decide beyond the structurally certain case.
5. **N-H1.** Whether to evaluate it after reviewing the width comparison.
6. **The rule-level source and status check** for the remaining E7 rules. It would unblock rules that exclude a design or claim that an element serves an affordance.
7. **Release of Step 3.** Only an assembled activity can express integrity conditions 01, 02 and 04, or show breaches 06 and 08.
8. **The entries' content.** His approval of W-P, W-L1, W-L2, N-P, N-L1 and C-BASE as written, beyond this demonstration.
9. **Knowledge that could distinguish GF2, GF3 and GF7** (K1 to K5). Optional. Any preference would be conditional and justified by the learning problem.
10. **The defending-goal relationships.** They would give D01, D03, TD01 and TD02 a governed Game Form relationship, and TD01 and TD02 a context row for their Game Problem.
11. **D2.** The complete P2 example he asked for comes first; then the context's identity, transitions and scoring; then TA02.

## Differences from the build spec

Where we went beyond, or read, the build spec. His words govern; none of these changes his knowledge.

1. **D2 is recorded too.** The spec listed D1 and D3 to D6 for `stage2-rulings.json`. We also recorded D2, and an open decision for TA02 (OPEN-D2-POSSESSION-STABILIZATION), because marking Stage 1's E2 question superseded would otherwise leave TA02 carrying no open decision. The proposed context stays out of the engine.
2. **The authorization paragraph is recorded** as AUTH-4NOV, with his permission to cite the boundary sentence.
3. **RUL-E1-A05 gains a `continuedBy` field** quoting D1's sentence on A05, beside the supersession markers.
4. **A PREFERRED row is reported inside COMPATIBLE_ALTERNATIVES**, as `preference.status` UNCONDITIONAL_GOVERNED_PREFERENCE. That keeps the spec's three outcomes. No PREFERRED row exists.
5. **Step 2 outcomes carry `establishedBy` RULING**, not APPROVED KNOWLEDGE. His D3 governs the gate and the compatibility-only reading, and the form declarations it reads are CANDIDATE.
6. **The player-range check reports NOT_CHECKED, not PASS, where a range is declared** (a correction in the decision package). No form declares a range, so no output changes.
7. **The stage reads no statement text.** The degenerate solution (RPC-PROP-042) and the two breach descriptions are read by id, context, category, role and status. Their text is held as a verbatim quote in the conditions-of-use data, and a test requires it to equal the knowledge row. Only the runner prints statements, for the reader.
8. **Structural conditions run only for the goal the fixture names** (A05), because the preconditions need team sizes, a test input.
9. **N-L1 runs as a structural check in each width scenario.** It decides only where a team has no players, and otherwise reports unequal numbers as uncertainty. This is not N-H1, which is evaluated nowhere.
10. **S4 marks both hypotheses INSUFFICIENT_EVIDENCE**, though each one's own conditions are plainly not met, because the pair decides neither.
11. **W-H2's assumption (a)** is shown as covered by its deciding circumstance (the defence may be organized and still unable to cover the width).
12. **The composite specification's section 7 is cited** with section 5, both as 'cited only'.
13. **The static id test is wider**: it also bans row ids (RPC-PROP, GAK, OIC) and every id held in the stage's own data files from the code. Three comments were reworded to keep his quoted ids out of the code.
