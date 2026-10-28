# Progress the Attack (A05) composition test: the attempt on the existing architecture, for Christian's review

## 0. In short (OUR READING on the measurements in section 3; rewritten 28 October 2026 after verification)

- **What composes.** The engine serves a complete, checked activity for Progress the Attack only when six of his pending decisions are filled in for testing (TEST-ONLY stand-ins; a seventh only for the Coach Overview). What it serves is the plain possession game (Directional Possession, GF2) with Attack Development's scoring clause added as two DRAFT conditions. No engine code was added. It passes every check the engine implements (MEASURED, R2-ALL). His context validation protocol, RPC-VAL-011..015, is never evaluated, because no engine code reads it (VERIFIED, section 4).
- **It is not demonstrably Progress the Attack** (OUR READING on MEASURED facts). It is the plain game plus two DRAFT conditions and one sentence (R7(1)). Removing the conditions changes nothing the engine notices (R6). The stand-ins depart from REQUIRED rows of his workbook, RPC-ID-011 and RPC-ID-013 (section 4).
- **What remains: his decisions, plus one substantial reusable engine capability that is needed in every case.** His workbook already says when the attack begins: "Organized attacking possession is established." (RPC-PROP-034, `LIB:1751`). The engine can apply a scoring condition only across the whole game (VERIFIED, `resolved-game.ts:289`), so a score also counts straight after a turnover, which is Counterattack's moment. Recognizing when an attack begins is the general phase mechanism (E8) his reply asked us to identify (30 October, line 19). Secure Possession needs the same capability.
- **Against Secure Possession.** Progress the Attack is better placed in the knowledge (VERIFIED). It is not easier to build (OUR READING): the moment organized attacking possession is established is Secure Possession's success and Progress the Attack's start. As his last paragraph asks, we report this before beginning E8.
- **His two-goal objective.** Play Out from the Back reaches a complete activity through realization choices he approved item by item. No goal yet reaches one through composition alone, so a composed Progress the Attack would be the first (section 8).
- **His decisions:** D1 (Game Problem), D2 (when an attack begins) and D3 (what counts as a score) now; D4, D5, D6 and D10 later (section 7).

## Corrections of 28 October 2026

Four adversarial verifications re-ran every measurement, and all of them reproduce. They showed these statements of the folder as first committed to be inaccurate. Each is corrected where it stood (marked **Corrected**), and the record's `corrections` list carries the record's share.

1. "two approved conditions": two DRAFT conditions with TEST-ONLY referents (sections 0, 3).
2. "every check passes": every check the engine implements; RPC-VAL-011..015 are never evaluated (sections 0, 3, 4).
3. GP and WORDING load-bearing, labelled MEASURED in `evidence/`: measured only by the verification, whose outputs are now `evidence/v1-*.out.txt` (section 3).
4. R7(2), "only the title and the purpose line differ": the diagram title and provisional state differ too, and the identity holds by construction (sections 4, 8).
5. R3 used as relevance evidence: it cannot discriminate; now engineering evidence only (section 4).
6. His 30 October line 23 used as evidence for A05: line 24 makes it specific to Secure Possession; removed, and line 20 made secondary (sections 4, 7).
7. Criterion 1, affordances "none is selected" and "Game Form: met by authored knowledge"; criterion 2, the consequence counted as met (section 4).
8. The reasons the folder alone is refused (section 1).
9. R6, "Reachable only by a TEST-ONLY alteration": true only for removing all of the conditions (section 3).
10. G3 "Suppressed today only for a bounded role"; G4 as a separate limitation (withdrawn); G5 sized "small (data)" as a fix to our draft (section 5).
11. E8 conditional: it is needed in every case (sections 0, 5, 8; record).
12. The identity test called Library-only: it is also his workbook's RPC-VAL-011 (section 6).
13. D2 asked as a choice of scope, and D7, D8, D9 and the D1 secondaries put to him: settled or ours (section 7; record).
14. What is missing called "mostly his decisions" and one piece of knowledge, "not engine capability": his decisions plus E8 (sections 0, 8).
15. The record's provenance note, "one note re-pointed": three notes differ, entries 3, 6 and 7 (record).

Also: "No better placed in the engine" relabelled OUR READING (section 8). Added: D10, V-RPC, J-COND, STORE, the robustness runs and the point about one reusable process (sections 0, 8).

---

**Standing: DRAFT. Stored in the repository as documents only, at `docs/audits/drafts/a05-composition/`. Nothing here is approved.** The engine loads none of it, except through the TEST-ONLY draft store (`../../../../back/src/system/derivation/draft-store.ts`). No production module imports that store, and only unit tests and our probes call it. Nothing the engine loads was changed to write this folder, and no engine code was changed. Every quotation of his workbook, his Library or his replies is verbatim and cited. Everything else is our reading and is labelled so. A05's Game Problem is **not** assigned anywhere here: candidates and evidence only.

His reply filed 31 October 2026 moves the composition test to Progress the Attack and asks: *"Can Challenge Point construct a complete, representative Progress the Attack activity using reusable, authorized knowledge, without requiring a fully authored activity-specific version?"* (line 19). He adds *"The resulting activity should genuinely invite opportunities to improve attacking conditions while maintaining possession—not simply reproduce a generic possession game under a different name."* (line 20) and *"If Progress the Attack proves no more suitable than Secure Possession, please report that before beginning another substantial implementation effort."* (line 46). This folder is that report's evidence base.

**Paths.** Paths are relative to this folder. Repository files appear as `../../../../<path>`, read at `d119235`. `LIB` = `../../../../back/src/system/sport-module/rpc-library.rc1.json`, cited by the line where each row starts. `SPM` = `../../../../back/src/system/session-planning/session-planning-model.rc1.json`. His replies are cited by date and line of their verbatim texts, held outside the repository. "Library line N" = line N of our text extraction of his RC1.1 Library, held outside the repository as in `../ta02-composition/README.md`. Probe scripts are outside the repository: the attempt's in our working folder `.../scratchpad/cd/a05/attempt/`, the verification's in `.../scratchpad/cd/a05/verify/V1/`. Their outputs are copied into `evidence/`.

**Labels.** **VERIFIED** (read at the cited file:line), **MEASURED** (probe output in `evidence/`), **INFERRED**, **OUR READING** (ours, not his). **TEST-ONLY** marks a stand-in for a decision of his that he has not made. It exists only in probe memory or a temporary copy and is never written into a draft.

## 1. What is in this folder

| File | What it is |
|---|---|
| `README.md` | This report. |
| `a05-authorization.DRAFT.json` | An A05 authorization record in the production shape (`learning-goal-authorizations.ts`, `LearningGoalAuthorization`), modelled on `../ta02-composition/ta02-authorization.DRAFT.json`. It holds `authorizedConstraints: []` with our drafted finding, the Pass Combination Gate hold, `manipulations: []`, seven existing-knowledge entries, the open gaps (decisions D1-D6 and D10; capabilities E8, V-RPC, G3, J-COND, STORE, G1, G5, G6, E3, E5, E6 and E11), and its own dated `corrections`. **`ruledOn`, `by` and `ruling` are empty, and `gameProblemId` is empty on purpose** (A05's translation is "TBD", `SPM:665-668`), so the record gate refuses it as drafted (R1a). It names no realization, provisional choice, adjustment or review request (the store refuses all of them, `draft-store.ts:109,457`). It is an evaluation, not an authored activity. |
| `evidence/` | The attempt's probe outputs R0-R7 (section 3). Also the verification's outputs, prefixed `v1-` (E1-E6, re-run on the committed attempt), and `u2-probe-gp.out.txt` (selection under each Game Problem candidate). Each file is under 200 KB. |

**Not here, on purpose: a copy of the Attack Development draft.** The attempt reuses `../ta02-composition/rpc-003-contract.DRAFT.json` byte for byte (section 2). The draft store reads one folder (`draft-store.ts:276-277`), so each probe builds a TEST-ONLY temporary folder holding that file beside the A05 record. `loadDraftStore` of this folder alone is refused for the empty Game Problem only. With a filled TEST-ONLY id it loads, and the build is then refused at knowledge, because RPC-003 has no contract outside the draft (MEASURED, `evidence/v1-e1-edges.out.txt`, E3 and E3b). That is expected, and no test loads this folder.

## 2. What was reused, and how the Attack Development draft reads for A05

**Reused unchanged** (VERIFIED by the probes, which copy the file and pass it to the store):
- the RPC-003 Attack Development draft (23 active items and 101 declarations, with item 04.a withdrawn under his 30 October item 6);
- our DRAFT laws classification (`../laws-materiality.DRAFT.json`);
- our DRAFT join rules (`../relevance-join-rules.DRAFT.json`).

Production knowledge reused: GF2's restated contract, the Sport Profile (the shared ball and the default laws), GF2's realization choices, the planning model's routing row (A05 to RPC-003, `SPM:727-731`) and the context workbook.

**Does A05 need the context draft changed?** Not for the engine (MEASURED). R1b and R2 meet the same refusals, on the same item lines, as the TA02 tests pin in `../../../../back/src/system/rendering/draft-composition.unit.ts:100-153`. The draft names no goal in any item value or declaration (MEASURED, `evidence/k1-goal-mentions.out.txt`: 0 of 23 values, 0 of 101 declarations). Its notes do mention TA02: two fitNotes name it, and eleven item fitNotes and five declaration notes cite the TA02 drafts' decision numbers (README Q1-Q2, the K1 draft's D1-D5). The engine reads none of those notes. So the context draft is reusable as a context draft should be, which is itself a positive finding. Five of its items are ASSUMED rather than authored: 01.a, 03.b, 06, 08 and 09.b (VERIFIED in the draft). The served state rests on them (section 3).

**What reads differently for A05 (OUR READING):**
- RPC-003-08's fitNote reports a TENSION between Secure Possession's moment and RPC-ID-011 ("Organized attacking possession is already established.", `LIB:2787`). The tension does not arise for A05. His own distinction places Progress the Attack *"once organized possession has been established."* (30 October, line 14), and A05's Choose This When reads "Team keeps possession but struggles to advance or create better attacking positions." (`SPM:132`).
- RPC-003-10.a's fitNote (the WHOLE_GAME scope) says the faithful scope "is an Attack Development episode that begins once organized possession is established" and that WHOLE_GAME "over-applies the condition to post-regain play". That holds for A05 exactly as for TA02. For A05 the scope itself is not an open question: his workbook holds it (RPC-PROP-034, RPC-ID-011). What is open is how the start is recognized (D2) and the engine capability to apply a condition from that start (E8).
- RPC-003-14.a's note on "any incentive he authorizes for TA02" applies equally to A05. No incentive is authorized for it (section 4, criterion 3).
- The questions the notes cite (TA02 README Q1, Q2 and Q3; decisions D1-D5 of the K1 draft) are re-asked here in A05's terms as D2, D3, D4 and D10. The draft's proposed rulings are still worded for Secure Possession.
- Our laws classification is worded for Secure Possession ("his decision 2", "his decision 4"), but its rule is general: LAW-11 is MATERIAL "wherever the success condition rewards reaching an area or a line" (`../laws-materiality.DRAFT.json`, LAW-11). RPC-PROP-134 does reward that, so the rule holds for A05 too (MEASURED, R4a).

**What A05 adds of its own:** only the record (section 1). No game structure is authored for A05.

## 3. What the engine does, run by run (MEASURED; `evidence/`)

Every run used the same session: 12 players, 40 x 30 m, 20 minutes, no specialized roles (as `draft-composition.unit.ts:52-53`). The stand-ins are all TEST-ONLY. They were applied to the derivation input's copy exactly as `draft-composition.unit.ts:59-90` applies them:
- **GP**: the record's `gameProblemId` set to a placeholder that names no Game Problem.
- **PR-1**: the progression referent typed as the target the scoring team attacks.
- **PR-2**: a control referent, the same target.
- **ORIGIN**: the starting condition (RPC-003-10.a/b) withheld, so every possession counts.
- **LAW-11**: offside classified PROCEDURAL.
- **WORDING**: one sentence covering the six condition fields, injected in memory into the approved-wording table.
- **READING**: a PROPOSED reading of that sentence, injected in memory.

The two files touched by WORDING and READING were not edited.

| Run | Set-up | Outcome (stage) | Evidence |
|---|---|---|---|
| R0 | Production (review build and coach build) | refused at **knowledge**: "the Representative Performance Context RPC-003 has no contribution contract, so its approved primary scoring event and qualifying condition cannot govern the game". Selected first: GF2 + Central Density, Wide Zone Advantage, Progression Bonus and Turnover Reward (vocabulary pool; three uncontracted). Game Problem UNRESOLVED, inferred from wording as GP-015; provisional | `r0-r1.out.txt` |
| R1a | The drafts as drafted, no stand-in | **the store refuses before any stage**: "a05-authorization.DRAFT.json: the record gate refuses it as a draft: A05: the record names no context or Game Problem". It refuses the same way with every other stand-in applied | `r0-r1.out.txt`, `v1-e1-edges.out.txt` (E2) |
| R1b | The context draft alone (the A05 record left out; an omission, not a stand-in) | passes session, selection and knowledge; refused at **structure**: "2 unresolved properties are neither an authorized choice nor an authorized claim: c:restated:RPC-003:RPC-003-12.a::V5, c:restated:RPC-003:RPC-003-10.a::V6". Constraints from the vocabulary pool | `r0-r1.out.txt` |
| R2 one at a time | GP alone; GP+PR-1; GP+PR-2; GP+ORIGIN; GP+LAW-11; GP+WORDING; GP+WORDING+READING | each refused at **structure**. GP+PR-2 leaves only 10.a::V6; GP+ORIGIN leaves only 12.a::V5; the others leave both lines | `r2-a.out.txt`, `r2-b.out.txt`, `r2-c.out.txt` |
| R2 ladder | GP+PR-1+PR-2 / +ORIGIN (our laws) / +LAW-11 / +WORDING | structure (10.a::V6) / **validation**: LAW-11 MATERIAL, LAW-8 reported / **communication**, with WORDING and READING both absent: exactly six fields "awaiting approved wording", plus fidelity Q3 on the same six / **served**, with the Coach Overview withheld (Q7 7.5: no recorded reading says the sentence states the two conditions) | `r2-a.out.txt`, `r2-b.out.txt` |
| R2-ALL | all seven | **served**. Every check the engine implements passes (below); his RPC-VAL rows are not evaluated | `r2-c.out.txt`, `r2-all.activity.json` |
| R2 leave-one-out | all but one | minus PR-1: structure, Gate A NOT_EVALUABLE (GA-ONE-PRIMARY-EVENT, GA-REFERENCE-INTEGRITY); minus PR-2: structure (12.a::V5); minus ORIGIN: structure (10.a::V6); minus LAW-11: validation (LAW-11). Measured by the verification: minus GP, the store refuses; minus WORDING with READING kept, refused at communication, and the reading is UNUSABLE | `r2-c.out.txt`; `v1-e1-edges.out.txt` (E2), `v1-e2-reading-only.out.txt` |
| R2-NO-RECORD | all stand-ins but no A05 record (so no GP placeholder) | **served, with Wide Zone Advantage** from the vocabulary pool (x2 once the attacking team has touched the ball in a channel and kept it). The three uncontracted pool constraints are only listed (`selectedWithoutContract`) and do not reach the game. Not authorized in his sense, and the magnitude is held ("Do not inherit x2 merely because it is currently present.", `../../../INCENTIVE_ASSURANCE_CRITERIA.md:491-492`) | `r2-c.out.txt` |
| R3 | relevance trace of the R2-ALL game, per candidate Game Problem (TEST-ONLY argument) | engineering evidence only (section 4, criterion 5) | `r3.out.txt`, `r3.summary.json` |
| R4 | the Laws check: ours / none / TEST-ONLY | ours: refused (LAW-11 MATERIAL, LAW-8 reported). None (production): refused, with LAW-8 and LAW-11 both MATERIAL "(fail safe)". TEST-ONLY: served, both reported. LAW-8-DB, LAW-13 and LAW-15 apply. LAW-14, 16 and 17 are NOT_APPLICABLE: "the game holds no object of the kind goal" (for 16 and 17, a known blind spot of our encoding, G5) | `r4-r6.out.txt` |
| R5 | constraints | section 4, criterion 3 | `r4-r6.out.txt` |
| R6 | CONTROL: Attack Development's conditions removed | **served**. The only difference from R2-ALL is the one TEST-ONLY sentence. Nothing refuses, and `account.context.inThisActivity` is still true (it reads whether the context is contracted, `build-activity.ts:597`). The relevance trace names nothing missing; its gaps only shrink, because the conditions it could not relate are gone. **Corrected:** the store refuses a drafted context only when no item constituting a condition cites its PRIMARY_SCORING_CONDITION row (`draft-store.ts:431-442`). Removing all of the conditions therefore needs a TEST-ONLY alteration. But removing only the control items (12.*) or only the progression items (11.*) loads, and the build then stops only for wording (STORE, section 5) | `r4-r6.out.txt`, `v1-e1-edges.out.txt` (E4) |
| R7 | the generic-game test | section 4, criterion 2 | `r7.out.txt` |
| V1-E1 | R2-ALL with the record's `gameProblemId` set to "GP-002", "GP-001", "x" and "   z" | each served, identical to the placeholder build in game, Details, overview, diagram, relevance and provisional state. The account's Game Problem stays UNRESOLVED, so the field is read only by the record gate | `v1-e1-edges.out.txt` |
| V1-E5 | R2-ALL at other sessions | 10 players at 50 x 35 m: served. 16 players at 60 x 40 m: served. 11 players: refused at roster ("does not split into 2 whole equal teams"), although the stage is reported as "session". Not run: goalkeepers, or goals available | `v1-e1-edges.out.txt` |
| U2 | selection with each candidate as an approved Game Problem (TEST-ONLY) | GP-003 and GP-014 throw NO_LENS_CANDIDATES at selection; GP-009 was not run (INFERRED to throw the same) | `u2-probe-gp.out.txt` |

**R2-ALL, the served activity** (MEASURED, `evidence/r2-c.out.txt`; every word is DRAFT except his purpose line and the TEST-ONLY sentence):
- **Banner state:** `account.provisional` true, "no Game Problem is approved for this Learning Goal, so selection followed its wording - which is not an authoritative substitute for an approved mapping (ruling of 14 October)".
- **Coach Overview** (served):
  - purpose: "Improve attacking conditions while maintaining purposeful possession." (APPROVED, `SPM:131`);
  - game: "2 teams of 6: each team attacks the line at the other team's end.";
  - parameters: "40 x 30 m, 12 players, 20 minutes";
  - scoring, Each team: the TEST-ONLY sentence, **then "A team scores 1 point by getting the ball across the line it is attacking."** (placed as a QUALIFICATION, DRAFT).
- **Coach Details** (9 sentences):
  - Set up: "Mark out an area 40 m long by 30 m wide"; "Mark both end lines: they are the scoring lines".
  - Players: "Divide 12 players into 2 teams of 6, with no goalkeepers".
  - How it works: "Pick which team starts with the ball and tell both teams before you start"; "When possession changes, play carries on without a stoppage, and each team keeps attacking the same line".
  - How to score: "A team scores 1 point by getting the ball across the line it is attacking"; "Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game"; the TEST-ONLY sentence.
  - When it ends: "Play for 20 minutes".
  - **Not said: any restart after a score, any restart at an end line, or any equipment.**
- **Diagram** (DRAWN): 40 x 30 m with dimension labels, two "target line" targets at 0 and 40 m, and one arrow per team. Not drawn: the ball (it has no position) and starting areas (none authorized).
- **The score's conditions (corrected):** two DRAFT conditions, not APPROVED (`r2-c.out.txt:58`): RPC-003-11.a (progression) and RPC-003-12.a (control), each with a TEST-ONLY referent. They restate two of the three clauses of his approved RPC-PROP-134, "Purposeful advancement from the attack's starting condition rather than possession alone: reaching a more advanced representative area while maintaining attacking possession." (`LIB:2651`). The clause "from the attack's starting condition" is removed by the ORIGIN stand-in.
- **Checks the engine implements, all passed:**
  - Gate A DEFERRED_TO_REALIZATION;
  - realization authorized;
  - acceptance: nothing closed without authority, nothing lost, nothing invented;
  - post-realization validated;
  - fidelity violations: 0;
  - the context scoring guard passes (a served build passed every validation check, `build-activity.ts:2662`);
  - one ball, the playing environment's (`c:sport-profile:soccer:SPORT-SOCCER-01`, the only object in the realized game);
  - the Laws check reports LAW-8 and LAW-11 under the TEST-ONLY classification;
  - overview check PASS, with two NOTE findings (the essentials table is partly approved; the sentence is said under a PROPOSED reading);
  - diagram DRAWN, no findings;
  - draft account: every element resting on the RPC-003 draft grades DRAFT, none APPROVED;
  - the relevance trace opens with "no Game Problem: the build resolved none and none was given".
- **Not checked:** his context validation protocol for Attack Development, RPC-VAL-011..015 (`LIB:3351-3405`). The engine's only reader of those rows, `rpcLibrary.validationRules` (`rpc-library.ts:438`), has no caller (VERIFIED).

**What the served state also rests on** (none of these is counted among the stand-ins; VERIFIED unless marked):
- our DRAFT classification of LAW-8 as PROCEDURAL (with no classification, LAW-8 is MATERIAL and refuses, R4);
- our encoding of LAW-16/17 as NOT_APPLICABLE without a goal (the effect of correcting it was not measured);
- the unapproved RPC-003 draft, including its five ASSUMED items (section 2);
- the TEST-ONLY draft store, which no route reads. No production, built-bundle or live-route run exists;
- the overview essentials table, in which 14 rules are PROPOSED, including SCORING_EVENT, PROGRESSION_CONDITION and CONTROL_CONDITION (`r2-c.out.txt`).

Only one configuration was run in R0-R7. V1-E5 adds three. The probe scripts are scratch-only, and no unit test pins A05.

## 4. Against his five demonstrations (OUR READING on MEASURED facts)

1. **Game Problem, affordances, Game Form.**
   - **Game Problem: not met**, by design: it is his decision (D1). Candidates and the evidence for each are in our U2 investigation (outside the repository). None is assigned.
   - **Affordances (corrected): his canonical affordances are not selected.** They follow the Game Problem. On every build in this attempt the engine does pick three lenses of its own: Possession Stability, Line-Breaking and Space Creation (`lensAuthority` "ENGINE_LENS", `evidence/r2-c.out.txt`; `guided-selection.ts:171-173`). These are the engine's reasoning dimension, not his knowledge (VERIFIED).
   - **Game Form (corrected): chosen by availability; that GF2 is appropriate was not shown.** RPC-003 lists GF3 and GF2 PRIMARY and GF7 SECONDARY (RPC-REL-027..029, `LIB:704,715,726`). His Library lists Positional Play first (Library line 664). Only GF2 has a contract, so only GF2 can be selected (R0, R2). Grid and channel structures exist only in GF3 and GF7 (our U1 investigation, outside the repository).
2. **Objectives, opposition, scoring, consequences.**
   - Objectives: each team attacks the far end line, fixed at setup. This comes from GF2's restated contract.
   - Scoring: "line_crossed" is an approved Attack Development event, "Valid primary scoring event 2 of 4, in the approved order." (RPC-REL-080). "target_zone_entered" is "Valid primary scoring event 1 of 4, in the approved order." (RPC-REL-079, `LIB:1276`). Choosing a line over a zone is a realizer input, not knowledge (`a04-realization-choices.json`).
   - Opposition: mirrored, because RPC-003-06 assumes it (ASSUMED; D4). No Attack Development row authorizes a defending event.
   - **Consequence (corrected): not met by the context.** Play continuing on a turnover is GF2's generic consequence. The context's own consequence is N/A on ASSUMED item 09.b, and its only END_CONDITION is "Possession is lost." (RPC-PROP-037). RPC-VAL-014, which asks that "consequence" remain intact, is not evaluated. The account's `unfilledRoles: consequence` is a constraint-role gap (`selection-metadata.ts:20`), not a missing game consequence.
   - **These are the plain possession game's elements** (R7(1)). Against the plain GF2 demonstration:
     - `objectives`, `objects`, `performers`, `space`, `possession` and `envelope` are identical;
     - `value.primaryEvent.conditions` is present only in A05 (the two DRAFT conditions, with TEST-ONLY referents);
     - `transitions[0].startsEpisode` is the string "true" against GF2's boolean true. Readers compare it as a string (`gates.ts:1329`, `render-concrete-game.ts:973`, `game-reading.ts:157`), so it has no effect;
     - beyond the game: one Details sentence, the overview's purpose and scoring lines, the title, the diagram title and the provisional state.
   - **Against Secure Possession composed under the same stand-ins (R7(2), corrected):** the game and the Coach Details are identical. The title, the purpose line, the diagram title and the provisional state differ. This holds by construction. Both use the same context and empty constraint sets, and the record's `gameProblemId` is read only by the gate (V1-E1). The governing Game Problem comes from the planning model's translation (`guided-selection.ts:125-129`). So R7(2) shows that the engine cannot tell apart two goals that share a context. It is not evidence about A05's relevance.
3. **Constraints or incentives where the knowledge supports them.** None is supported, and none was added (R2-ALL: `constraints []`, source AUTHORIZATION_RECORD, with his principle quoted in the account). The pool offered to A05 comes from the parser's signal groups F_possession_passing and D_break_lines (`v1-e4-pool-origin.out.txt`): Central Density Condition, Wide Zone Advantage, Switch of Play Bonus, Turnover Reward, Pass Combination Gate (held) and Progression Bonus (R5a). No RPC-003 row, Game Problem candidate or canonical affordance relates to any of them (our U4 investigation; the record's finding). The empty set follows his principle: *"A library constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment."* (16 October, line 13).
   - Engine facts (R5b; TEST-ONLY sets that measure the engine only): `[]` commits GF2 alone. `[Wide Zone Advantage]` alone throws NO_COMPATIBLE_COMBINATION ("unfilled roles: foundation, consequence"). With Neutral Player Condition or Central Density, it selects.
   - Sequencing (R5c): if he approves a Game Problem while A05 has no record, the pool is re-keyed to the engine's coverage row. For GP-002 that is nine constraints, including Interception Reward and Transition Trigger. The record should therefore land with his Game Problem ruling.
4. **Structural validation and coach-facing instructions (corrected).** Every check the engine implements passes, under the stand-ins. His validation protocol is never evaluated: RPC-VAL-011 (identity), 012 (scoring), 013 (boundary), 014 (representativeness) and 015 (diversity), `LIB:3351-3405` (section 3). The text has general defects:
   - G3: the unconditioned scoring sentence stands beside the conditioned one, now in the overview too;
   - silence on restarts, which the Laws check already owes under LAW-8 (section 5);
   - G6: no equipment.
5. **A traceable explanation of relevance.** As built, the trace grades nothing. Its only gap is "no Game Problem" (R2-ALL). Grades exist only with a TEST-ONLY candidate under our DRAFT join rules (R3). **R3 cannot discriminate (corrected), so it is engineering evidence only:**
   - our DRAFT join table has no rule for scoring conditions;
   - the INFERRED grades for FOI and CIO come only from the ball and the two teams being present;
   - Open Pathway is capped at UNVERIFIED;
   - Play Out from the Back gets the identical best-grade profile (`relevance-trace.unit.ts:194` against `:446`; the unit run passes);
   - it was traced on the game built from the goal's wording, not on each candidate's own game. GP-003 and GP-014 throw NO_LENS_CANDIDATES at selection (U2 row, section 3).

The per-candidate grades are in `evidence/r3.summary.json` (MEASURED). Under every candidate, composed and plain games get the same best grades, and the composed game has more gaps (9-11 against 1-2). The extra gaps are eight elements: the six fields of the two conditions, the event kind the context narrows and the episode flag it sets on the turnover. Each is "a shaping element that no join rule relates to any affordance of the profile"; for GP-003, GP-014 and GP-009 there is also "the context RPC-003 has no ACTIVE relationship row". Open Pathway is reached only by J-OP-TARGET on GF2's targets, a reading of play whose ceiling is UNVERIFIED. No authored row relates any element to an affordance today (`../../../../back/src/system/rendering/relevance-trace.ts:19`). Attack Development's own targets are deferred (RPC-MAP-103..107, `LIB:4612-4660`: "canonical Affordance Target ids are not to be inferred to reach runtime", `LIB:4621`).

**The relevance verdict rests on R7(1), R6 and these rows of his workbook** (rows VERIFIED; the judgement is OUR READING, made by hand):
- RPC-ID-011, REQUIRED: "Organized attacking possession is already established." (`LIB:2787`). Also RPC-PROP-034 and RPC-PROP-035, both CORE BEGIN_CONDITION (`LIB:1751`, `1760`), and Library lines 570 and 580. The ORIGIN stand-in departs from all of them.
- RPC-ID-013, REQUIRED: "Possession alone is insufficient as success." (`LIB:2803`).
- RPC-ID-012, REQUIRED: "The representative purpose is to improve attacking conditions." (`LIB:2795`).
- RPC-PROP-042, DEGENERATE_SOLUTION: "Possession circulates without improving attacking conditions." (`LIB:1823`).
- RPC-VAL-011, IDENTITY: "Remove title, objective, and Learning Goal; the activity must remain recognizable as the selected RPC." (`LIB:3351`; also Library line 715). With the labels removed, the game cannot be told apart from GF2 plus one sentence, or from the TA02 build.
- RPC-VAL-013, BOUNDARY: "Generated structure must not satisfy an Exclusion identity rule more strongly than the selected RPC." (`LIB:3373`), against the Library's exclusion "exploiting transition (Counterattack)." (Library line 712). Whole-game scope rewards play straight after a turnover.
- RPC-ID-014: not checked.

His 30 October line 20 is secondary support: *"I do not approve option (a), which would treat every possession as equivalent and produce a generic possession game."* It was written for Secure Possession, so that its reasoning carries over is OUR READING. His line 5 also applies (INFERRED): *"I particularly appreciate that you did not treat the ordinary possession game as a successful Secure Possession activity simply because it passed some structural checks."*

## 5. Reusable improvements (general engine work; none is A05-specific; sizes are ours)

| Id | Gap (MEASURED or VERIFIED) | Improvement | Size (ours) | Needs him first? |
|---|---|---|---|---|
| E8 | Only the WHOLE_GAME scope is evaluable (`resolved-game.ts:289`). The one episode kind, BUILD_OUT_EPISODE, is a code list (`gates.ts:1295`). Its beginnings must be restarts (`gates.ts:1314-1328`), and the team it bounds must hold a role (`gates.ts:1519`) | Episode kinds held as data, so a scoring condition can apply from an attack's starting condition. Play Out from the Back's kind is re-expressed as the first kind, with identical behaviour | large: 1-2 weeks in full. Our earlier phase investigation put the engine part at 300-500 lines, about two to three focused sessions, before tests | **Needed in every case** (corrected: the scope is held knowledge). D2 says how the start is recognized |
| V-RPC | RPC-VAL rows are never read (`rpc-library.ts:438`, no caller) | Report each context's RPC-VAL rows on every build as review evidence, marked not checked and needing coach judgement, evaluating only what is structurally decidable | 1-2 days | no |
| G3 | The unconditioned scoring sentence is said beside the conditioned one, in Details and the overview, and the overview check passes it (R2-ALL). **Corrected:** it is suppressed today only in games with roles, where credit is bounded or a role scores by its own event (`render-concrete-game.ts:3493-3532`) | No unconditioned team-neutral scoring sentence where the conditions are said in approved words; the value line is kept | 1-2 days | no |
| J-COND | Our DRAFT join table has no rule for scoring conditions (R3) | Join rules for scoring conditions, as our DRAFT reading, graded under his three distinctions (30 October, lines 62-64) | 2-3 days, then his review | his review of the rules |
| STORE | The store guard refuses a drafted context only when no item cites its PRIMARY_SCORING_CONDITION row (`draft-store.ts:431-442`). A draft without its control items (12.*) or without its progression items (11.*) loads (V1-E4) | A tightening: a drafted context must constitute every condition its own declarations name | small | no |
| G1 | The record gate checks `gameProblemId` only for non-emptiness (`learning-goal-authorizations.ts:573`), and nothing else reads it (V1-E1) | A tightening only: the id must be a register Game Problem id equal to the planning model's translation. **Corrected:** the "unresolved marker" in the committed version would have been a loosening, and is dropped | under a day | no |
| G5 | LAW-16 and LAW-17 read NOT_APPLICABLE without a goal (R4) | Correct their applicability. **Corrected:** this is not the "small (data)" fix to our draft it was sized as. The encoding is in the Sport Profile (`../../conformance/stage-b/sport-profile-soccer.json`), production knowledge under his 6 October 2026 authority that the engine loads | small, plus review and the zero-change snapshot check | no (his Laws 16-17 are unchanged; only our encoding) |
| G6 | No equipment sentence exists for a game without a distinguished performer (R2-ALL: none said; U5) | An equipment shape for role-less games | small | wording approval |
| E6 | The restart after a score is unsaid. GF2 declares "notAuthored: restart after a score." (`../../conformance/stage-b/contracts.json:4380`) | Restart phrases as data, after our restart proposal is approved | medium | our proposal first (section 7, D5) |
| E5/E11 | No role-less set-up sentence exists for an end zone or an interior area, and the diagram withholds an interior target (U5: measured there, and inferred) | End-zone and interior-area sentences, and a context steering the line-or-zone choice | medium (3-5 days) | only if D3 chooses a zone or an interior area |
| GF3/GF7 | Only GF2 has a contract (section 4, criterion 1) | Restate GF3's or GF7's contract | medium to large per form (INFERRED) | only if D1 or D3 points there |
| E3 | The two-to-four role mix binds a record's non-empty set (R5b) | Commit a record's authorized set of any size | small to medium | only if a single constraint is ever authorized |

**Withdrawn or moved (corrected):**
- G2 (a shared context-draft folder) is TEST-ONLY tooling, not an engine improvement.
- G4 (restart silence as a separate limitation) is withdrawn. The Laws check already owes LAW-8, "the kick-off at the start and after a score" (`../../conformance/stage-b/sport-profile-soccer.json`, LAW-8). The restart itself is ours to propose (D5), then E6.

**The smallest useful slice of E8 (OUR PROPOSAL; D2(a)).** An attack begins at a coach's restart that recreates organized possession and ends when possession is lost. Scoring is confined to that attack, for the team given the restart. This generalizes the restart-begun episode Play Out from the Back already uses, so the restart-only beginning test stays as it is. Checked against the code lines above and our earlier phase investigation (INFERRED), it still needs:
1. episode kinds as data, read in place of the code list;
2. a credit bound that needs no role block. This game has none, and today the bound requires a role holder (`gates.ts:1519`);
3. following the team whose attack it is back to the restart that began it. Today an episode designation is not followed (`designation.ts:194-200`);
4. a check of the readers that match a restart's taker (for example `render-concrete-game.ts:972-973`) against a coach's restart;
5. every sentence about the phase said only in approved words.

The safeguard is that Play Out from the Back's snapshot must show zero changed leaves.

Consequence (OUR READING): after a turnover, the team that won the ball cannot score until the next coach's restart. That keeps Counterattack's moment out, and what follows a turnover becomes his decision (D4). Rough size (ours): about a week.

Recognizing a start in live play (D2(b)) can follow later. It is the larger part, and it is shared with Secure Possession. Our phase investigation reads the same beginning as the phase that Attack Quickly, Win the Ball Back, Recover Organization and Delay the Attack turn on.

None of these improvements makes the activity representative by itself.

## 6. Blockers, each in exactly one class

**MISSING KNOWLEDGE**
- **MK2 (genuine).** No documented relationship links Attack Development, any candidate Game Problem or A05 to any library constraint or incentive. It is reported as a knowledge gap under his 14 October instruction: *"If no appropriate shaping constraint is available, please report that as a knowledge gap."* (line 8). It does not block, and the empty set stands (criterion 3).
- **No observable definition of improved attacking conditions, or of organized attacking possession being established.** The intent is authored: RPC-STMT-014 asks for "measurable improvement in attacking conditions rather than possession alone." (`LIB:200`); see also RPC-ID-012 and RPC-ID-013 and RPC-PROP-042 (section 4). The observable form is ours to propose and his to approve (D2, D3).
- **No defending objective for Attack Development.** This matters only if D4 goes asymmetric.
- **No consequence of a change of possession specific to the context**, beyond the attack's end, "Possession is lost." (RPC-PROP-037; 09.b ASSUMED N/A).
- **Reclassified (corrected):**
  - The committed MK1 splits into D3 (where the area is), our proposals (its observable form) and reconciliation (the Library-only "progression zones;", Library line 674, and "target positioning;", Library line 676).
  - The identity test is **not** Library-only. It is in his workbook as RPC-VAL-011 (`LIB:3351`), and also in the Library: "If the title were removed, an experienced football coach should immediately recognize an activity centered on progressively improving attacking conditions rather than merely maintaining possession." (Library line 715).
  - The committed MK3 is now J-COND (engine work, section 5) plus the standing deferral of Attack Development's affordance targets.

**DECISIONS NEEDING HIS APPROVAL** (section 7): D1, D2 and D3 now; D4, D5, D6 and D10 later.

**GENERAL ENGINE LIMITATIONS** (section 5):
- E8 in every case;
- V-RPC, G3, J-COND, STORE, G1, G5 and G6, which are small;
- E5/E11, E6, GF3/GF7 and E3 only if his decisions call for them.

**OURS TO PROPOSE** (neither his decision nor engine work):
- the observable signs (D2, D3);
- the restart arrangement, with our LAW-8 classification (D5);
- the manipulations reconciliation (the withdrawn D9).

## 7. The decisions, in coach language

**Needed now.**
- **D1. Which Game Problem is Progress the Attack's?** It goes through the Game Problem Library, as his reply asks: *"that should be addressed through our existing Game Problem Library rather than assigned merely to satisfy the engine."* (31 October, line 17). Attack Development lists Create Space and Exploit Space as PRIMARY, and Gain Access and Maintain Possession as SECONDARY (`LIB:660-702`). Nothing ranks them, and a composite is possible (14 October, line 40). The evidence splits (OUR READING, U2):
  - **His Play Out from the Back method points to Exploit Space.** That method is the context and its approved scoring condition: *"I approve Gain Access as the primary Game Problem for Play Out from the Back, based on the approved Goalkeeper Build-Out context and its scoring condition."* (15 October, line 8). GF2 does not map Exploit Space, which leaves a relevance gap (R3).
  - **His game-form mapping points to Create Space**, which GF2 maps.
  - **Gain Access** is a context SECONDARY and is Play Out from the Back's own.
  - **Maintain Possession** is documented against as primary (RPC-ID-013), and it is Secure Possession's.
  - GP-003, GP-014 and GP-009 are not on Attack Development's list. GP-003 and GP-014 refuse at selection (U2 row, section 3).

  The decision lands in the planning model's translation (`SPM:665-668`), and the record must land with it (R5c). Our recommendation is procedural only. **Not asked (corrected):** whether secondaries stay deferred. He already ruled: *"Let's retain our existing decision to defer secondary Game Problems."* (15 October, line 9).
- **D2. When does an attack begin, and how is it recognized? (restated, corrected)** The scope is not asked. It is held knowledge: RPC-PROP-034 and RPC-ID-011 (section 4), Library lines 570 and 580, and his 30 October line 14, *"Progress the Attack: Improving attacking conditions once organized possession has been established."* What is open:
  - **(a) at a coach's restart that recreates organized possession.** This is the smaller engine step, generalizing Play Out from the Back's restart-begun episode (section 5).
  - **(b) recognized in live play.** This is larger, and shared with Secure Possession.

  Also open: whether we may build the general capability, E8. For (b), an observable sign that organized attacking possession is established is ours to propose and his to approve. Under his option (d) the same sign marks Secure Possession's success. Our lean: (a) first, (b) later. WHOLE_GAME appears here only as labelled engineering evidence.
- **D3. What counts as a score?** "a more advanced representative area" while "maintaining attacking possession" (RPC-PROP-134). We owe him one or two observable options first, putting the outcome before the mechanism as he asked for Secure Possession (30 October, lines 34-35). That this method applies here is OUR READING. He then chooses against his proviso: *"provided they are evaluated against the intended progression outcome and not merely whichever target the current engine can represent."* (16 October, line 111). Options, with the engine cost of each (ours):
  - (a) controlled arrival in an end zone of a stated depth, using his approved event "target_zone_entered" (RPC-REL-079). Needs E5/E11, 3-5 days. On a depth, his 15 October line 28 asks us to identify the decision rather than hard-code one.
  - (b) crossing the far end line under control. The engine represents this today (PR-1, PR-2), so it costs nothing. It is not recommended merely because it composes. For Play Out from the Back he noted *"I agree that an end-line target creates a problem if receiving beyond the line takes players outside the playing area."* (15 October, line 17); that this applies here is OUR READING.
  - (c) an area short of the end, from the Library-only "progression zones;" or "target positioning;". This needs reconciliation first.

  Whether "maintaining" is judged at the target (PR-2) or held from the attack's start needs E8. **Corrected:** his 30 October line 23 is no longer cited here. Line 24 makes it specific to Secure Possession.

**Later.**
- **D4. Opposition, and what follows a turnover.** Confirm the mirrored opposition (RPC-003-06 is ASSUMED from GA-001's "Reciprocal progression toward meaningful external objectives."), since no Attack Development row authorizes a defending event. Symmetric continuous games stay legitimate (16 October, line 22). His 30 October principle, written for Secure Possession, asks us not to assume the answer: *"If asymmetric scoring is justified, identify the appropriate authorized scoring relationship rather than assuming both teams must pursue identical objectives."* (line 43).
- **D5. Offside only (corrected).** Our DRAFT classification holds offside MATERIAL here, so it refuses the build until he rules (R4a). We recommend no offside for the initial evaluation, consistent with Play Out from the Back: *"Yes, no offside applies to either version for the initial evaluation."* (28 October, line 50). Restarts are not asked. They are ours to propose once D3 is settled: *"Please propose the simplest representative restart arrangement once the learning context and scoring outcome are established."* (30 October, line 49). We propose them together with our LAW-8 classification.
- **D6. Wording, after D3.** He needs to approve one sentence for Attack Development's two conditions (six fields) and confirm the reading the overview needs. Approved wording is matched to the game's exact values, so it can only follow D3. We recommend showing neither RPC-STMT-015 (`LIB:208`) nor the RC1.1 Library sentence (Library line 720), with his Coach Definition as the purpose line. Then his request in 30 October line 80 needs no ruling.
- **D10. Approving the Attack Development draft (added).** This is needed to promote the draft out of the TEST-ONLY store. His word is needed on PR-1 and PR-2 (D3), PR-3 (D2), PR-5 (D4) and the ASSUMED items 01.a, 03.b, 08 and 09.b. The draft's proposed rulings are still worded for Secure Possession and must be re-asked.

**Withdrawn from his list (corrected):**
- **D7 (Wide Zone Advantage).** Already decided. His rulings of 14 October (line 8), 15 October (line 61, on width) and 16 October (line 13) leave it unauthorized, with the magnitude held (`../../../INCENTIVE_ASSURANCE_CRITERIA.md:491-492`). The gap is reported as MK2.
- **D8 (the relevance vocabulary).** Already decided: *"I would not automatically activate the deferred Attack Development affordance targets."* (30 October, line 59). The chosen Game Problem's matrix row follows once D1 is decided; that this follows from his line 58 is OUR READING.
- **D9 (the Library's manipulations).** This is ours, under his 30 October item 7 (lines 76-79) and the Play Out from the Back precedent. We propose RPC-003~EM-0001 and EM-0006 through RPC-PROP-047, "Manipulate field dimensions or numerical relationships." (`LIB:1868`), and LP-4/LP-5 toward EM-0003. He confirms.

## 8. Is Progress the Attack more suitable than Secure Possession? (OUR READING)

**Better placed in the knowledge** (VERIFIED):
- A05 is RPC-003's PRIMARY goal (RPC-REL-062, `LIB:1089`); Secure Possession is SECONDARY (RPC-REL-068, `LIB:1155`).
- Its moment is Attack Development's own: 30 October, line 14, and RPC-PROP-034, "Organized attacking possession is established." (`LIB:1751`).
- The conflict that moved Secure Possession out of the context does not arise.
- The context draft composes for it unchanged and goal-neutral, with no ninth context. Its notes still ask TA02's questions.

**With identical stand-ins, the engine builds an identical game** (MEASURED, R7(2)). This holds by construction, so it shows that the engine cannot tell apart goals that share a context. **Corrected:** the committed "No better placed in the engine", labelled MEASURED, is OUR READING.

**On the path to a representative activity, the cost is comparable, not lower** (OUR READING and INFERRED):
- Both goals need E8 and the organized-possession sign.
- Secure Possession also needs a context or transitional relationship, and counter-press reciprocity.
- A05 also needs D1 and a representation of the advanced area.

**Not yet representative** (MEASURED and OUR READING). What composes is the possession game with a clause on its score that nothing in the game makes observable (R7(1), R6). It is reached through a stand-in that departs from REQUIRED rows of his workbook (RPC-ID-011, RPC-ID-013; section 4). That fails his test: *"not simply reproduce a generic possession game under a different name."* (31 October, line 20).

**Not yet one reusable process for both goals** (VERIFIED facts; OUR READING of their import). His objective: *"Our immediate objective is to demonstrate two distinct Learning Goals producing complete, checked activities through the same reusable generation process."* (31 October, line 47).
- Play Out from the Back is the one production record (`../../../../back/src/system/test-library/library/learning-goal-authorizations.json:126`, ruled 15 October 2026). It is completed by provisional realization choices he approved item by item (`../../conformance/stage-b/provisional-realizations.json`).
- A05 is TEST-ONLY draft composition.
- No goal yet reaches a complete activity through composition alone. A composed A05 would be the first.

**So, as his last paragraph asks, we report before implementing.** What remains is his decisions plus one substantial reusable engine capability, E8, needed in every case and shared with Secure Possession. **Corrected:** the committed reading, that what is missing is "mostly his decisions" and one piece of knowledge, "not engine capability", is withdrawn.

Our suggested order:
1. D1, D2 and D3 from him.
2. The E8 slice he agrees under D2.
3. The small reusable items (V-RPC, G3, STORE, G1, J-COND).
4. E5/E11 only if D3 chooses a zone or an interior area.
