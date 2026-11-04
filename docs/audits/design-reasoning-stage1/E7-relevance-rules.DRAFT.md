# E7: proposed relevance rules (DRAFT, for Christian's review)

**Standing: DRAFT, ours. Not implemented. The relevance-validation stage (Step 5) is held pending his review.** This answers his reply of 3 November 2026, item 7:

- *"I don't want to approve the existing DRAFT rules without reviewing them. Please provide the proposed rules before implementing the relevance-validation stage."*
- *"They should distinguish: Structural compatibility. Relevance to the intended Game Problem and affordance requirements. Conditions under which the selected environmental elements are likely to be useful. Conflicts, tradeoffs and possible unrepresentative solutions. Evidence strength and unresolved uncertainty."*
- *"Most importantly, the rationale must describe knowledge that actually influenced the selection—not an ecological explanation generated after the choice was made."*

**What already exists.** These rules build on what is already in the repository and do not replace it.

- **The DRAFT join rules** (`docs/audits/drafts/relevance-join-rules.DRAFT.json`) join a realized game's structure to an affordance's definition:
  - J-OBJ: object level;
  - J-FOI-OBJECT, J-CIO-TEAMS and the others: structure level;
  - Support Availability takes no rule (`inference: NONE`).
- **The review-only relevance trace** that reads them, which grades AUTHORIZED, INFERRED, UNVERIFIED and GAP.

Below, each existing join rule is placed in one of his five families. Nothing in them is approved, and none of them influences any selection today.

## R0. The rule that governs the others: a rationale is a record of the decision, not a description of it

| Rule | Statement | How it is checked |
| --- | --- | --- |
| **R0.1 Written at decision time** | The stage records each rationale entry at the moment a decision reads the row: a candidate admitted or excluded, a dimension compared, a tie reported. It is never written afterwards from the finished design. | Stage 1 already works this way. Every cite in `stage1.ts` output is the row the decision function read (the `cites` arrays). Nothing composes an explanation after selection. |
| **R0.2 Decision-bearing or labelled** | Every cited row is either decision-bearing, meaning that changing it in a test copy changes that decision, or is labelled `context only`. | This is the knowledge-mutation test (acceptance check 8). In Stage 1, `design-reasoning.unit.ts` changes a CAR rating, a context strength, a form declaration and a ruling, and requires exactly the dependent decisions to move. |
| **R0.3 No unsourced sentence** | No sentence of justification appears without a row behind it. A link the knowledge cannot make is reported as missing, never filled with a plausible reason. | Acceptance check 3. In Stage 1 every `missingBasis` and `missing` entry names the rows it rests on, or says that none exists. |
| **R0.4 Post-hoc material is separate** | Anything explanatory that did not influence a decision is kept apart, under a heading that says so, and never inside the rationale. An example is the current relevance trace's measured facts for SA. | Static: the rationale record has no free-text field. Only rows, rules and grades. |

## R1. Structural compatibility: can this element exist in this context at all?

These are gates, not preferences. They are answered yes, no, or *not declared*; they are never scored.

| Rule | Statement | Source | Today |
| --- | --- | --- | --- |
| R1.1 | The element belongs to an archetype the context relates to (REQUIRED or COMPATIBLE). | RPC GAME_ARCHETYPE rows, such as RPC-REL-003 (RPC-003 → GA-001 REQUIRED). | Implemented in Stage 1 (check ARCHETYPE). |
| R1.2 | The archetype does not mark the primary Game Problem CONTRADICTORY ("Dominance indicates likely organizational drift."). | Archetype workbook GAME_PROBLEM_RELATIONSHIP rows (GAK-0001..0017 for GA-001). | Implemented (check ARCHETYPE_GAME_PROBLEM). |
| R1.3 | The archetype's organizational integrity conditions hold: two opposed teams, reciprocal objectives. | Archetype workbook ORGANIZATIONAL_INTEGRITY_CONDITION rows (48 rows; 8 for GA-001). | Step 5. |
| R1.4 | Declared player and area ranges contain the session's. A range that is not declared is reported *not declared*, never assumed to fit. | Form `minimum_players`/`maximum_players` and realization `player_count_*` and `area_*` (all empty today). | Reported only (check PLAYER_RANGE). |
| R1.5 | The element is not held by his ruling. | `learning-design-holds.json` (the Pass Combination Gate hold). | Step 3. |

## R2. Relevance to the intended Game Problem and its affordance requirements

These are preferences, but only along approved relationships, compared without weights (E6).

| Rule | Statement | Source | Today |
| --- | --- | --- | --- |
| R2.1 | A form or element is relevant to a Game Problem only through an authored row relating them: the form's declared Game Problem ids, the context's GAME_PROBLEM and GAME_FORM rows. Never through shared words. | Stage 1 `selection-basis.json`. | Implemented (Step 2). |
| R2.2 | Relevance to an affordance requirement runs through the Game Problem's CAR row and, once E3 is ruled, the element's mapped representation. An Essential requirement no element reaches is a GAP. | CAR Matrix; E3. This is the existing join rule J-OBJ, which is object level and says nothing of what an element does. | Profile implemented (Step 1). The element side waits on E3. |
| R2.3 | A structural join (an element is an instance of the words of a CAR definition) is INFERRED only if every premise is approved. Otherwise it is UNVERIFIED. | Existing DRAFT rules J-FOI-OBJECT ("the task object"), J-CIO-TEAMS ("competitor") and the others, with their ceilings. | Review trace only (TEST-ONLY). |
| R2.4 | Support Availability is never inferred from the presence of teammates, equal numbers or team size. | His reply filed 30 October 2026, item 5. DRAFT rules: SA `inference: NONE`. | Kept as is. |
| R2.5 | Where the primary and secondary Game Problems diverge on a requirement (E1), relevance is judged against each one's row with its role, never against the merged profile alone. | E1; Stage 1 `divergent`. | Implemented as reporting. |

## R3. Conditions of usefulness: when is the element likely to help?

| Rule | Statement | Source | Today |
| --- | --- | --- | --- |
| R3.1 | An element counts as useful for a Game Problem only where an approved condition of use (E4) is evaluated as holding in the stated coaching context. | Realization `suitability_conditions` (E4). | Waits on E4. |
| R3.2 | A condition the stated context cannot evaluate (for example, whether defenders can still organize) gives *insufficient evidence*, never *holds*. | E6 applied to conditions. | Waits on E4. |
| R3.3 | Each condition carries its class (established principle, inference, hypothesis, field-supported). A design that rests on a hypothesis says so. | His E4 classes. | Waits on E4. |

## R4. Conflicts, tradeoffs and possible unrepresentative solutions

| Rule | Statement | Source | Today |
| --- | --- | --- | --- |
| R4.1 | A contraindication evaluated as holding excludes the element for that Game Problem, and says which row did it. | Realization `contraindications` (E4). | Waits on E4. |
| R4.2 | Every degenerate solution of the context (RPC DEGENERATE_SOLUTION rows; four for RPC-003, PROP-042 to PROP-045) is checked against the package. An element that invites one is flagged, never silently kept. | RPC properties. | Step 4. |
| R4.3 | Every context identity rule of role EXCLUSION ("Must not dominate without context transition.") is checked. An element making the excluded situation dominant is a conflict. | RPC identity rules, such as RPC-ID-015. | Step 4. |
| R4.4 | A tradeoff between approved relationships is reported as a tradeoff, naming both sides. It is never resolved by weighting. | Stage 1 comparisons (`TRADEOFF`). | Implemented for Game Forms. |
| R4.5 | An element that prescribes a sequence or single solution conflicts with the context's representative purpose. | His E2 ("no artificial clearing actions or forced sequences"); EM guidance risks (EMG-0004, EMG-0006). | Step 4. |

## R5. Evidence strength and unresolved uncertainty

| Rule | Statement | Source | Today |
| --- | --- | --- | --- |
| R5.1 | Every link carries its grade: AUTHORIZED (one authored row), INFERRED (approved premises plus a named rule), UNVERIFIED (any unapproved premise), or GAP (missing). | His reply filed 30 October 2026, item 5; the existing trace's grades. | Review trace only. |
| R5.2 | Every row cited carries the standing of its source as written: Approved, Candidate, DRAFT, PROVISIONAL, field validation flags (for example GP-015's "SA flagged for field validation"). | Stage 1 output carries `rowStatus`, `validationStatus`, `confidence` and module standing. | Implemented (Step 1). |
| R5.3 | An open decision of his is carried on every result it affects until he rules (today OPEN-E1-MERGE-RULE and OPEN-E2-CONTEXT-FIT). | `stage1-rulings.json`. | Implemented. |
| R5.4 | Passing these rules is engineering evidence only. It never shows that the design is representative in the field. | His reply, item 10: *"Please also preserve the distinction between passing these engineering tests and demonstrating representative learning quality in the field."* | Stated on every result (`STAGE1_STANDING`). |

## What we are asking him

1. **The five families.** Are they the distinctions he meant, and is anything misplaced? For example, is R1.2 (archetype CONTRADICTORY) structural, or relevance?
2. **R0.2.** Is "decision-bearing or labelled context only", checked by mutation, an acceptable test of *"knowledge that actually influenced the selection"*?
3. **The existing DRAFT join rules.** Which of them may move from the TEST-ONLY trace into this stage once approved, and which should be withdrawn?
