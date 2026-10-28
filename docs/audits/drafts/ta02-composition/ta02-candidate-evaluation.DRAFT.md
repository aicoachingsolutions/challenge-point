# DRAFT: TA02 Secure Possession, evaluation of the candidate library constraints (K3)

**Status: DRAFT for Christian's review. Nothing here is approved, nothing in the repo was changed, and the engine loads none of it.** Every verdict below is our evaluation under his rules. Which constraints are justified is his decision (D4a, D4b; README Q4).

**Corrected 27 October 2026** after an adversarial review (`design\review-drafts.md`, M6 and K3 SHOULD-1..6):
- M6: the recommendation no longer leans on what composes today without engine work; it rests only on §2. The engine fact is kept as a separate note.
- SHOULD-1: the library-text thread (Test Library V0 text in a DRAFT module) is now recorded for every candidate alike, with what each verdict actually rests on.
- SHOULD-2: Wide Zone's recorded criteria 3 and 6 are marked as measured with Central Density present.
- SHOULD-3: "points for a regain" is a CONTRADICTION only in a symmetric, role-free GF2 game; with a counter-pressing role it is open.
- SHOULD-4: Neutral Player is NOT JUSTIFIED (it is not held).
- SHOULD-5: "rule 8" and "rule 10" are no longer in quotation marks as his words.
- SHOULD-6: his 27 October words about a physical goal are cited for GF2's integrated consequence, not for a reward; A05's commit already includes Turnover Reward.

**Corrected again the same day** after a verification pass:
- D4 is no longer asked (§5): his 16 October principle already makes the empty set the outcome where no constraint is justified.
- The reply received 15 October 2026 is cited by one label, "his 16 October reply", with `christian-2026-10-16.txt:line`; his first 15 October reply is `christian-2026-10-15.txt`.
- The Neutral Player lines quote his words from our record (`docs/HANDOFF.md:7994-7995`) and label "as a reusable mechanism" and the "not approved" clause as our record's summary, not his words.
- §3.3 adds the qualifier that follows his Engage with Purpose sentence (`ENGAGE_WITH_PURPOSE.md:61`).
- §6 no longer reports the U2 composition without saying how it was reached.

**Library pass, 27 October 2026.** His RC1.1 Library's Attack Development section, which §2 called "not in the repo", is held outside the repository (a copy of his docx and our text extraction; "Library line N" is a line of that extraction). It changes no verdict and no recommendation:
- Its seven typical environmental manipulations and five typical interaction regulations (Library lines 668-685) name no library constraint, so none of them is a documented relationship for a candidate. As for Goalkeeper Build-Out, they are candidates for his evaluation, and only his naming would make one apply (README Q8a).
- The only items naming incentives are the Common manipulation "directional incentives." (Library line 677) and the Common regulation "progression incentives;" (Library line 683). Width appears only as the Common affordance target "wide progression" (Library line 646) and the Occasional degenerate solution "abandoning width;" (Library line 694). Neither names Wide Zone Advantage, Turnover Reward or Secure Possession. Reading any of them as support for D4a or D4b would be our join (rule 8), so §3.2 and §3.3 stand.
- The Library names Secure Possession nowhere (VERIFIED, 0 occurrences).

Worktree: `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18` (HEAD `f5d6d24` = main when this was drafted; the branch has since moved to `d5c4b63`, so line numbers here are those of `f5d6d24`). Paths are relative to it.

**Labels**
- **[V]**: verified. I read it at the cited file:line or JSON path during this task.
- **[M]**: measured. I ran a read-only script; its output file is cited.
- **[INF]**: our inference or reading. Neither the knowledge nor Christian states it.
- **HIS WORDS**: quoted verbatim from his dated reply files, or from a record that quotes him.

Scripts and outputs are in `design\scripts\` in our working folder outside the repository (not copied here):
- `dump-realizations.out.txt`: soccer-module realization rows, GF2, CV-015 and lenses;
- `active-gf2-wza.out.txt`: active contract items after the ruled restatements, from `loadCorpusContracts`;
- `ta02-sel.rerun.txt`: TA02 guided selection;
- `rpc003-rels.js`: every RPC-library row that names RPC-003.

---

## 0. Verdicts

| Candidate | In TA02's pool? | Contracted? | Documented relationship to GP-015 / its affordances / Attack Development / TA02 | Library-text thread (Test Library V0 text in a DRAFT module; never a documented relationship) | Verdict, and what it rests on |
|---|---|---|---|---|---|
| Central Density Condition | yes | no | **none** | Its `constraintArchetype` "Spatial Condition" (`environmental-manipulations.ts:17`) matches GF2's recommended type "Defensive Reward; Spatial Condition" (`soccer-module.rc1-v3.json:5367`) | **NOT JUSTIFIED.** Rests on: a defending target (`protect_space`), its self-contradiction (8 Oct), inexpressibility on the register, and TA02's lens "Avoid pass limits or restrictive rules" (`soccer-module.rc1-v3.json:5054`) |
| Wide Zone Advantage | yes | yes (32 active items) | **none** to GP-015 or TA02. It shares a name with the context's own PRIMARY problem, Exploit Space | "Spatial Condition" (`environmental-manipulations.ts:44`) matches GF2's recommended type (`:5367`); GF2's example pattern "zones or channels" (`:5379`) | **DECISION NEEDED** (D4a). We recommend leaving it out of the first composition test. Rests on: no documented relationship (§2); its documented neighbour is Attack Development's primary problem; its magnitude evaluation is owed |
| Turnover Reward | yes | no | **none** at the GP level | TA02's top lens ("Use defensive rewards and pressure to invite stable possession decisions") and GF2's recommended type "Defensive Reward" (`:5367`) | **DECISION NEEDED** (D4b). We recommend not adding it until it is established that the game's existing consequences are not enough (the test in his 16 October reply, `christian-2026-10-16.txt:40`). Rests on: no documented relationship (§2); no authored meaning; that test |
| Switch of Play Bonus | yes | no | **none** | GF2's example incentive pattern "bonus for switching play then scoring" (`:5380`) | **NOT JUSTIFIED.** Rests on: it fails Objective as worded and rewards a prescribed action against his 13 Oct principle |
| Pass Combination Gate | listed, but **held** | yes (`blind:`) | none, and held by his ruling | none | **NOT AVAILABLE**: held from Learning Goal selection (his 14 Oct ruling) |
| Interception Reward | **no** (only in the CV-015 Coverage row, which does not govern TA02) | no | none | none | **NOT JUSTIFIED** (not a TA02 candidate; adding it would be a pool change, and pool changes are his) |
| Neutral Player Condition | **no** | yes | none | none | **NOT JUSTIFIED** (no documented relationship, §2); also not in TA02's pool. It is not held. Our record of his 13 Oct reply (`docs/HANDOFF.md:7993-7996`) says he approved the neutral rule as a reusable mechanism, quoting him: "the neutral supports whichever team currently has possession and changes allegiance immediately when possession changes. That should be explicit" (`:7994-7995`), and that he did not approve it as a canonical selection for Secure Possession. "As a reusable mechanism" and the "not approved" clause are our record's summary, not his quoted words |

The library-text threads are Test Library V0 text: `git log -S` traces "Defensive Reward; Spatial Condition" to commit `63b7aad` (2 August 2026, the Soccer Module extraction) and "bonus for switching play then scoring" to `3980188` (3 May 2026, the Test Library V0 selection engine) [V]. None of them names a Game Problem or an affordance, so none is a documented relationship, and no verdict above rests on one.

**Recommended finding for a draft TA02 record: `authorizedConstraints: []`.** The principle in his 16 October reply, HIS WORDS: "A library constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment." (`christian-2026-10-16.txt:13`), makes an empty set the outcome where no constraint is justified, so it is not a question for him (§5). The recommendation rests only on §2: no candidate has a documented relationship to GP-015, its affordances, Attack Development or TA02. The relevance of a TA02 composition then rests on GF2 and Attack Development elements (K6), not on any library constraint. This is the A01 precedent: an empty authorized set, evaluated, with the reasons recorded. The draft record is `ta02-authorization.DRAFT.json` (K2).

**Engine note, not a reason** [V, SYNTHESIS §0.1, `generateSelection.ts:827-831, 1010-1013`; MEASURED, step0 c1/d3]: any non-empty authorization smaller than a two-to-four set with a foundation constraint (for example `{WZA}` alone) is refused today by the two-to-four rule. Lifting that is general engine work (E3, with his D10 confirmation) that we would do if he authorizes such a set. It does not bear on which constraints are justified; his rule is that suitability is "determined by the intended learning problem and affordances, not by which constraints happen to be easiest to implement" (his 13 Oct words as our memory file `learning-design-development-standard.md` records them, rule 3; there is no repository copy).

---

## 1. Which candidates, and where they come from

- **TA02's candidate pool**, MEASURED [M `ta02-sel.rerun.txt`]:
  - The guided text is "Secure Possession. Stabilize possession after regaining it.".
  - It matches the signal `F_possession_passing`, which yields `central-density-condition, wide-zone-advantage, switch-of-play-bonus, turnover-reward, pass-combination-gate`.
  - The Game Problem is `{"status":"APPROVED","gameProblemId":"GP-015","inferredFromWording":"GP-015","governed":false}`. The context is RPC-003 and `authorization` is null.
  - The commit is GF2 with Central Density, Wide Zone Advantage, Turnover Reward and Switch of Play Bonus. This is the same commit pinned at `back/src/system/test-library/selection-pool.unit.ts:233` [V].
- **Where the pool comes from.** It is the parser's hard-coded group at `back/src/system/input-constraints/deriveInputConstraints.ts:618-635` [V]. The Pass Combination Gate was added there as a "Round-9 routing-coverage fix" (`:631-633`) [V].
  - So the pool is a wording-derived vocabulary list, not a documented relationship [INF, consistent with the A01 finding at `back/src/system/test-library/library/learning-goal-authorizations.json:153`: "the Coverage rows and the wording pools were both derived by the parser"].
  - Rule 3 (13 Oct) says the pool is preserved and is his to change; it is not edited here.
- **Interception Reward** arrives only through the `B_pressure` group (`deriveInputConstraints.ts:600-616`) [V] and the Coverage row CV-015 (`back/src/system/sport-module/soccer-module.rc1-v3.json:7860`, `supported_realization_group_ids`) [V].
  - CV-015 is consulted only when his approved Game Problem differs from the wording's. For TA02 they agree (`governed:false`) [M].
  - So Interception Reward is not a TA02 candidate.
- **Pass Combination Gate** is held. Hold record: `back/src/system/test-library/library/learning-design-holds.json`, ruledOn 2026-10-14. HIS WORDS: "Please keep the current Pass Combination Gate as a mechanism demonstration only. I do not want it reintroduced into learning-design examples until we've reviewed its ecological suitability." [V] It is pinned as held for TA02 at `selection-pool.unit.ts:125-136` [V].
- **Neutral Player Condition** is not in the pool. His 13 Oct reply is recorded at `docs/HANDOFF.md:7993-7996` [V]. HIS WORDS, as that record quotes them: "the neutral supports whichever team currently has possession and changes allegiance immediately when possession changes. That should be explicit" (`:7994-7995`). Our record's summary, not his quoted words: Step 3 approved **as a reusable mechanism** (`:7993-7994`), and "NOT approved as a canonical selection for Secure Possession" (`:7995-7996`).

---

## 2. What a "documented relationship" could rest on, and what exists (common to every candidate)

His standard. His first 15 October reply, HIS WORDS: "I would prefer that the activity's constraints be selected based on their documented relationship to the approved context, Game Problem, and target affordances." (`christian-2026-10-15.txt:12`) [V]. His 16 October reply, recorded at `learning-goal-authorizations.json:5-15`, HIS WORDS: "A library constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment." (`christian-2026-10-16.txt:13`) [V]

| Possible anchor | What the knowledge holds | Ties any candidate? |
|---|---|---|
| **GP-015 Maintain Possession** | Definition: "Preserve a rule-defined state of legal object possession while continuing meaningful task performance." (`back/src/system/knowledge-core/atm-workbook.rc1.2.json:187-195`) [V] | **No.** Every candidate's soccer-module row has `primary_game_problem_ids`, `secondary_game_problem_ids`, `game_form_ids` and `universal_concept_id` null [M `dump-realizations.out.txt`; rows at `soccer-module.rc1-v3.json:5937` (Switch), `6003` (Interception), `6069` (Turnover), `6465` (PCG), `6597` (CDC), `6663` (WZA)] |
| **GP-015's affordance profile** | FOI E, OP E, SA E, CIO E, "Approved; SA flagged for field validation" (`atm-workbook.rc1.2.json:413-426`) [V]. The dimensions are named only: "Functional Object Interaction", "Open Pathway", "Support Availability", "Competitive Interaction Opportunity", with CIO scoped to "Representative competitive opposition" (`:28-32`) [V] | **No.** No authored mapping exists from the constraints' `targetAffordancePrimary` vocabulary (`protect_space`, `exploit_space`, `regain_possession`, …) to the four canonical affordances. A grep finds the canonical names only in `affordance-target-matrix.ts`, its workbook, its unit test and `docs/HANDOFF.md` [V]. HANDOFF recorded the same on 10 Oct: "TWO AFFORDANCE VOCABULARIES WITH NO AUTHORED RELATION" (`docs/HANDOFF.md:7536-7540`) [V] |
| **Attack Development (RPC-003)** | 14 relationship rows, reaching only GA, GP, GF, LG and SCORING_EVENT. The five affordance targets RPC-MAP-103..107 are DEFERRED: "canonical Affordance Target ids are not to be inferred to reach runtime" (`rpc-library.rc1.json:4612-4660`) [V; M `rpc003-rels.js`] | **No.** The RPC library contains 0 occurrences of `tl-v0-constraint`, `EM-00`, `ENVIRONMENTAL_MANIPULATION` or `INTERACTION_REGULATION` [M]. The context's "Typical Environmental Manipulations / Interaction Regulations" list is not in the repo (SYNTHESIS §5, source material); it is in his RC1.1 Library, held outside the repository, and names no library constraint (Library lines 668-685; Library pass note above). Its behaviour adjustments are text that names no object: PROP-046 "Reshape attacking spacing.", PROP-047 "Manipulate field dimensions or numerical relationships.", PROP-048 "Encourage purposeful circulation through representative consequences.", PROP-049 "Alter progression incentives without prescribing a solution." (`:1859-1892`) [V] |
| **GF2** (soccer-module row, `soccer-module.rc1-v3.json:5343-5385`) | `primary_game_problem_ids: "GP-015; GP-001"` (`:5348`); `primary_affordance_ids: "maintain_possession; create_space; break_lines"` (`:5351`); `recommended_constraint_matching_text: "Defensive Reward; Spatial Condition"` (`:5367`); `example_constraint_patterns: "zones or channels || restart conditions || time pressure || support rules"` (`:5379`); `example_incentive_patterns: "reward line-breaking pass leading to shot \|\| bonus for switching play then scoring"` (`:5380`) [V] | **Type level only.** GF2 says which constraint *archetypes* suit it, not which constraint serves GP-015. **GF2 itself is documented for GP-015** (`:5348`) and for `maintain_possession` (`:5351`). That is the strongest documented relevance in the whole selection, and it belongs to the game form, not to any constraint [V; the reading is INF] |
| **TA02's lens** (Possession Stability Opportunity, the first lens committed [M]) | `selection_category_key: "Maintain Possession"`, `design_intent: "Retain possession under pressure"`, `known_limitations: "Avoid pass limits or restrictive rules"`, `consequence_patterns: "reward regain in target area or disruption leading to attack"`, `suggested_constraint_prompt: "Use defensive rewards and pressure to invite stable possession decisions"`, `primary_game_problem_ids: null` (`soccer-module.rc1-v3.json:5029-5062`; mirror at `back/src/system/test-library/affordanceLenses.ts:81-93`) [V] | **Weak thread, for defensive rewards only.** The lens ties to GP-015 only through its category label. Lenses are not contracted knowledge and are excluded from derivation (SYNTHESIS §2 C1, `run-bounded-selection.ts:88, 250-252`). Our record of his 13 Oct reply (memory `learning-design-development-standard.md`, rule 8, our paraphrase, not his verbatim words): a match inside the current vocabulary is not proof of an affordance-relevance relationship |

**Authority of the constraint rows themselves** [V]:
- The Soccer Module declares `"module_status": "DRAFT"`, `"approved_by": "TBD"` (`soccer-module.rc1-v3.json` `metadata`). Its realization rows are "Extracted from TEST_LIBRARY_V0_CONSTRAINTS and TEST_LIBRARY_V0_ENVIRONMENTAL_MANIPULATIONS".
- The `setupGuidance` text for Central Density, Wide Zone and the Pass Combination Gate entered in commit `806f658` (14 May 2026). Its message says "Populated setupGuidance for 10 constraints with concrete parameters", and it is co-authored by Claude [V `git show 806f658`].
- [INF] So none of the setup text can be shown to be his.
- The contract corpus nonetheless cites that text as AUTHORED source (for example WIDEZONE-01.a's basisEvidence) [V `active-gf2-wza.out.txt`], and his later rulings on Wide Zone items stand on their own.
- We do not reopen that convention here. We only say that no candidate's relevance to TA02 can lean on it.

**Bottom line of §2** [INF, from the [V] rows above]: no candidate has a documented relationship to GP-015, to its four affordances, to Attack Development or to TA02. The only documented relevance to GP-015 is GF2's own. An empty authorized set is therefore the honest default. The principle of his 16 October reply (`christian-2026-10-16.txt:13`) and A01's finding (`learning-goal-authorizations.json:153`) are the precedent.

---

## 3. Per candidate

### 3.1 Central Density Condition (`tl-v0-constraint-central-density-condition`)

- **Records** [V]:
  - `back/src/system/test-library/environmental-manipulations.ts:5-30`; `back/src/system/test-library/csv/constraints.csv:8`; `soccer-module.rc1-v3.json:6597` (`universal_concept_type: ENVIRONMENTAL_MANIPULATION`).
  - Not in `contracts.json`: there are eight contracts, listed in `active-gf2-wza.out.txt` line 1.
- **Stated targets** [V]:
  - description "Increase defensive pressure in central areas"; `targetAffordancePrimary: protect_space`; `category: "Protect Space"`; `constraintRole: structure`; `includesIncentiveLayer: false`;
  - notes "Encourages wide play indirectly"; contextualAudit "Do not restrict movement".
- **Setup guidance** [V `environmental-manipulations.ts:25-29`]:
  - "Mark a central zone (roughly the middle third lengthwise, half the field width) with cones or discs."
  - "Restrict defenders allowed inside the central zone (typical cap: 2-3 defenders)."
  - "Outside players can enter the central zone freely; the restriction shapes defensive density without removing free movement."
  - Engineering-populated (§2).
- **(a) Relationship.** None to GP-015, to the four affordances, to RPC-003 or to TA02 (§2) [V].
  - Its target `protect_space` is a *defending* affordance: the lens "Space Protection Opportunity", "Opportunity to maintain defensive shape and deny space" (`dump-realizations.out.txt`, lenses) [V].
  - In a symmetric GF2 game it would shape the team *without* the ball. It would bear on TA02's learners only indirectly, by "indirectly invite width" (logicUsageNote) [V text; INF reading].
  - Its known prior role: making Wide Zone worth collecting. The A04 audit found "Its only function in A04's package was to make the Wide Zone incentive worth collecting. Remove Wide Zone and its absence costs nothing. **The two are a pair, and the pair goes together.**" (`docs/audits/a04-narrowest-configuration-2026-10-08.md:81-84`) [V].
  - **Library-text thread** [V text]: its `constraintArchetype` "Spatial Condition" (`environmental-manipulations.ts:17`) matches GF2's recommended type "Defensive Reward; Spatial Condition" (`soccer-module.rc1-v3.json:5367`). This is Test Library V0 text in a DRAFT module (commit `63b7aad`); it names no Game Problem or affordance, so it is not a documented relationship. The verdict does not rest on it either way.
- **(b) Criteria.** It is not an incentive (`includesIncentiveLayer: false`), and the criteria apply to "authoring a new incentive meaning, changing a magnitude or operation, and adding a trigger or condition semantics" (`docs/INCENTIVE_ASSURANCE_CRITERIA.md:255-257`) [V]. So the seven criteria and Engage with Purpose (which concerns opposition *incentives*, `docs/ENGAGE_WITH_PURPOSE.md:30-34`) do not formally apply.
  - One finding still bears on it. Its own text is **internally inconsistent**, an owner question raised on 8 Oct and never answered [V `a04-narrowest-configuration-2026-10-08.md:102-107`]: "A cap on defenders inside the zone *reduces* central density. Two readings are available (a ceiling, or a dedicated central pair) and they have opposite effects on the affordance landscape."
- **(c) GF2 compatibility.**
  - GF2-22 forbids "a rule removing legal passing options (banned receivers, forced pass order, prohibited backward or square passes)" (`contracts.json:3628`) [V]. A defender cap removes no passing option, so there is **no conflict with GF2-22** [INF].
  - GF2-02, "participants share an adaptive opportunity space" (basis GAK-0106, GA-001-OIC-04), carries the fitNote "The no-partition clause is the original's reading" [V `active-gf2-wza.out.txt`]. A per-team occupancy cap partitions access for one team: a **CONCERN** against our own reading, not against authored text [INF].
  - **Inexpressible on the register as authored.** "No register row expresses that"; it would need "a **new register row**" (`a04-narrowest-configuration-2026-10-08.md:86-99`) [V].
- **Verdict: NOT JUSTIFIED.** It rests on:
  - no documented relationship to GP-015, Attack Development or TA02 (§2);
  - its target is a defending affordance (`protect_space`);
  - its text contradicts itself on the direction of its own effect (8 Oct, unanswered);
  - it cannot be realized without a new register row;
  - TA02's own lens: "Avoid pass limits or restrictive rules" (`soccer-module.rc1-v3.json:5054`) [V]. A defender cap is a restrictive rule [INF].
  - Its only coherent known role is as Wide Zone's pair. Including it would also go against rule 3 (our record of his 13 Oct reply): it would be selected because it heads the vocabulary list, not because of a documented relationship.

### 3.2 Wide Zone Advantage (`tl-v0-constraint-wide-zone-advantage`)

- **Records** [V]:
  - `environmental-manipulations.ts:32-57`; `constraints.csv:9`; `soccer-module.rc1-v3.json:6663`;
  - contract "Wide Zone Advantage" at `docs/audits/conformance/stage-b/contracts.json:6485`, 32 active items [M `active-gf2-wza.out.txt`];
  - ruled restatements in `docs/audits/conformance/stage-b/corpus-restatements.json`, for example WIDEZONE-06.b `:1040`, 18.b `:1082`, 18.d `:1172`, 18.e `:1192`;
  - its realization-choices file is empty by design (R2 §2.6).
- **Stated targets** [V]: `exploit_space`; `incentiveMechanism: positional_or_scoring_advantage`; `constraintRole: hybrid`; contextualAudit "Zones optional".
- **What the contract establishes** [V `active-gf2-wza.out.txt`]:
  - two touchline channels (WIDEZONE-02.a, -03), each a "bounded minority (of an axis)" (06.b, OWNER_RULING);
  - no access function, never compulsory (08.a–c), a perceptual reference (08.d);
  - a value modifier, ×2 MULTIPLY (18.b/18.c), on the condition "a controlled attacking-team touch within a referent wide channel, where controlled means a touch after which the touching player's team retains possession" (18.d, OWNER_RULING), lasting until `POSSESSION_CHANGE` (18.e, OWNER_RULING);
  - no channel as an objective, and no second event (16.a/b).
- **Composes with GF2 today** [V-run, `understand\probe-demos.txt` "scoring-modifier"]: served, 11 instructions, fidelity 0. The rendered rule is "A score is worth 2 instead of 1 once the attacking team has touched the ball inside either channel and kept it after that touch. The bonus lasts until possession changes". Channels are "between 4.5 m and 7.5 m wide" on a 30 m width.
- **(a) Relationship.** None to GP-015, its four affordances or TA02 (§2) [V].
  - The nearest documented neighbour is the **context's PRIMARY Game Problem GP-002 Exploit Space** (RPC-REL-024, `rpc-library.rc1.json`) [V]. The link to it is only a shared name with `exploit_space` (rule 8).
  - That is Attack Development's own problem and A05's (A05 routes PRIMARY to RPC-003, RPC-REL-062). It is not TA02's GP-015, which is SECONDARY there (RPC-REL-026, `:693`) [V].
  - [INF] Adding it would move TA02's game toward the Progress the Attack game. A05's commit already includes it (`selection-pool.unit.ts:228`) [V], which sharpens the distinctness problem (D12).
  - The one mechanical link to possession: its *qualifying condition* is itself a possession-retaining touch (18.d), and its value ends on a possession change (18.e) [V]. [INF] So the doubled score is lost if the ball is lost, which is a consequence for not securing the ball.
  - His words on width, for A01, `learning-goal-authorizations.json:377`, HIS WORDS: "Width may be a useful environmental manipulation, but its inclusion should be justified by the intended affordances and the activity's actual conditions, not merely by its presence in a candidate list." [V]
  - **Library-text thread** [V text]: its `constraintArchetype` "Spatial Condition" (`environmental-manipulations.ts:44`) matches GF2's recommended type (`soccer-module.rc1-v3.json:5367`), and GF2's example constraint patterns include "zones or channels" (`:5379`). Test Library V0 text in a DRAFT module (commit `63b7aad`); it names no Game Problem or affordance. It is recorded here as it is for Turnover Reward; it is not a documented relationship.
- **(b) The seven criteria.** The recorded results are for the settled condition [V `INCENTIVE_ASSURANCE_CRITERIA.md:332-503`]; the TA02-specific additions are ours [INF]. **The recorded results were measured with Central Density present** (K3 SHOULD-2): criterion 3's PASS reasons through it ("under central density contesting the channel pulls the defence out of the middle", `INCENTIVE_ASSURANCE_CRITERIA.md:366-368`) [V], and the A04 audit says "The two are a pair, and the pair goes together." (`docs/audits/a04-narrowest-configuration-2026-10-08.md:83-84`) [V]. Criteria 3 and 6 below are therefore recorded for the Central Density + Wide Zone pair, and would have to be re-evaluated for Wide Zone alone.

  | # | Criterion | Result |
  |---|---|---|
  | 1 | Objective | **PASS**. Settled 2 Oct: "A touch within the channel after which the touching player's team retains possession." (`:437-445`) |
  | 2 | Legible | **PASS**. A marked perceptual reference (`:359-363`) |
  | 3 | Opposition-robust | **PASS, recorded for the pair with Central Density** (`:365-370`, "Preventing a controlled touch in the channel is a real defensive task"). To be re-evaluated for Wide Zone alone |
  | 4 | Affordance-preserving | **PASS**. "Zones optional"; "Entering must not be compulsory" (`:372-376`) |
  | 5 | Proportionate | **HELD, and the evaluation is owed.** HIS WORDS: "Keep magnitude held until the condition and persistence semantics are executable. Then evaluate plausible magnitude options against all seven assurance criteria, with particular attention to Proportionate and Learning-Relevant. Do not inherit x2 merely because it is currently present." (`:489-494`). The document adds "The semantics are executable as of today, so the evaluation is owed." (`:492-493`). [INF] In the served GF2 geometry the two channels are 9-15 m of 30 m (30-50%), so many attacks would earn ×2 in ordinary play |
  | 6 | Learning-Relevant | **CONCERN for TA02** [INF]; the recorded result is for the pair with Central Density and would be re-evaluated for Wide Zone alone. The rewarded opportunity is wide space, i.e. Exploit Space, the context's primary problem. It is TA02-relevant only if securing a ball just won runs through width, and nothing authored says it does. The standing CONCERN, "rewards **finding** the space rather than **using it against someone**" (`:405-414`, written for Beat Defenders 1v1), cuts the other way for TA02: finding space may be exactly the TA02 solution. That is a coaching judgement, which the document reserves to him ("Who answers: coaching judgement", `:162-163`) |
  | 7 | Coupled | **PASS**. It ends on a possession change (`:203-208`) |

  - **Engage with Purpose** [INF; his two questions at `ENGAGE_WITH_PURPOSE.md:46-49`]. It is an attacking incentive, not an opposition incentive, but in a symmetric game each team holds it.
    - *Learning value*: it raises the value of controlled possession in wide areas and gives the defending team a reason to defend width. Its link to *stabilizing a just-regained ball* is not documented.
    - *Engagement value*: plausible (a visible bonus to chase). But it is an added reward rather than a game-integrated consequence. His words, 26 Oct, are the contrast: "meaningful, game-integrated incentives that can stimulate competitive intensity without relying on artificial rewards, punishments, or restrictive rules." (`ENGAGE_WITH_PURPOSE.md:28`)
- **(c) GF2 compatibility** [V-run + V]:
  - **Compatible**: served with GF2, with Gate A, post-realization gates and fidelity clean.
  - GF2-20: not affected. The event stays `line_crossed`, and WIDEZONE-16.b forbids a second event.
  - GF2-22: channels restrict no passing option (08.a–c).
  - GF2-21 ("a possession reward that outweighs or displaces the progression event", `contracts.json:3612`): the modifier scales the progression event and never replaces it. That is structurally fine. Proportionality is the residual CONCERN (row 5).
- **Verdict: DECISION NEEDED (D4a).** The exact question is in §5. Our recommendation: leave it out of the first composition test, for two reasons.
  1. It has no documented relationship to GP-015 or TA02 (§2); its documented neighbour is Attack Development's primary problem, not TA02's.
  2. Its magnitude evaluation is owed and unmade, and its recorded criteria 3 and 6 were measured with Central Density present.
- **Engine note, not a reason** [V SYNTHESIS §0.1; MEASURED step0 c1]: `{WZA}` alone is refused `NO_COMPATIBLE_COMBINATION` by the two-to-four rule. If he authorizes it alone, the general engine change E3 (with his D10 confirmation) is ours to make. The uncorrected draft gave this as a reason to leave it out; it is not one.

### 3.3 Turnover Reward (`tl-v0-constraint-turnover-reward`)

- **Records** [V]: `back/src/system/test-library/constraints.ts:115-135`; `constraints.csv:6`; `soccer-module.rc1-v3.json:6069` (`INTERACTION_REGULATION`). Not contracted.
- **Stated targets** [V]:
  - description "Reward forcing turnovers from opponents"; `targetAffordancePrimary: regain_possession`; `incentiveMechanism: defensive_reward`; `constraintArchetype: Defensive Reward`;
  - contextualAudit "Avoid over-restriction"; logicUsageNote "Use as an optional defensive consequence constraint that increases the value of pressure and regain moments."
- **Setup guidance: none.** No magnitude, condition, trigger, beneficiary or end.
  - HANDOFF recorded the class on 10 Oct: "nine are a title, a description and a note ("reward winning the ball back") with **no magnitude, condition or trigger**" (`docs/HANDOFF.md:7548-7550`) [V].
- **(a) Relationship** [V rows; INF chain]:
  - **None at the Game Problem level.**
  - Its target `regain_possession` shares a name with GP-016 Regain Possession, which is `paired_with` GP-015 (`back/src/system/knowledge-core/gp-library.rc1.json:227-232`) [V]. That is the opponent's problem in a possession contest, linked by name only (rule 8).
  - **The library-text thread** [V text]. TA02's first lens says "Use defensive rewards and pressure to invite stable possession decisions" and lists the consequence pattern "reward regain in target area or disruption leading to attack" (`soccer-module.rc1-v3.json:5056-5057`). GF2 recommends the type "Defensive Reward; Spatial Condition" (`:5367`). This is the same class of Test Library V0 text recorded for Central Density, Wide Zone and Switch of Play (§0); it names no Game Problem, and the verdict does not rest on it.
  - [INF] The chain reads: TA02 is "Immediately lose the ball after winning it." (`back/src/system/session-planning/session-planning-model.rc1.json:99`), and TA02-01 is "Keep possession under pressure." (`:274`). A reward for the opponent's regain raises pressure on the team that has just won the ball, so the opponent's best response creates TA02's problem.
  - **His own reasoning has this shape, for A01** (his 16 October reply, `christian-2026-10-16.txt:36-41`, about the pressing team in Play Out from the Back; cited as the shape of his test, not as a ruling for TA02), HIS WORDS: "There is also another mechanism worth considering: an incentive for the defending team to regain possession higher up the field. The intended effect would be to encourage meaningful pressing behavior, which in turn shapes the affordances available to the team building out." **And his limit**: "However, please do not automatically add a high-regain bonus. We should first establish whether the game's existing consequences provide sufficient incentive, and whether an additional reward would improve rather than distort defensive behavior." "The objective is not maximum pressing intensity. It is meaningful, adaptable defensive opposition." [V]
- **What the game's existing consequence already does** [V items; INF reading]:
  - In GF2 a regain is already consequential: play continues (GF2-17 T6 CONTINUE, `contracts.json:3548`), and the winner attacks its own target at once, because each team "attacks the target opposite its own assigned end, regardless of possession" (GF2-08.c–f, OWNER_RULING 9 Oct, `corpus-restatements.json:1255-1321`).
  - Served text: "When possession changes, play carries on without a stoppage, and each team keeps attacking the same line" (`understand\probe-demos.txt`, plain GF2) [V-run].
  - This is the kind of consequence he called the central principle on 25 Oct, HIS WORDS: "The central learning-design principle is that the opposition's objectives and scoring consequences should help create the affordances relevant to the selected Learning Goal." (`christian-2026-10-25.txt:218`) [V]
- **(b) The seven criteria** [INF, each for his weighing; no meaning is authored, so most answers depend on the reading chosen]:

  | # | Criterion | Result |
  |---|---|---|
  | 1 | Objective | **CONCERN.** "Forcing" a turnover is a causal or intent judgement. The criterion's own failure example is "committed pressure" (`INCENTIVE_ASSURANCE_CRITERIA.md:72-73`). An observable reading exists, "a possession change won by the team" (`POSSESSION_CHANGE` is a registered trigger), but it is a decision, not authored |
  | 2 | Legible | **Indeterminate.** A regain is perceptible, but what is rewarded, and how, is not authored |
  | 3 | Opposition-robust | **Plausible PASS.** The counter is to secure the ball, which is TA02's own problem. Its best response is therefore the learning intention |
  | 4 | Affordance-preserving | **CONCERN.** A large regain reward pushes toward maximum pressing ("The objective is not maximum pressing intensity."). It also raises the cost of losing the ball, which can make retention terminal: the GAK-0108 / GF2-21 risk "possession terminal rather than instrumental" |
  | 5 | Proportionate | **Not evaluable.** No magnitude |
  | 6 | Learning-Relevant | **Plausible**, through the lens thread above. This is his judgement |
  | 7 | Coupled | **Not evaluable.** A point awarded at the regain coincides with the interaction, so it would pass by construction. A modifier would need a termination |

  - **Engage with Purpose** [INF; it *is* an opposition incentive in TA02's frame]:
    - *Learning value*: it shapes the interaction that creates TA02's landscape, the immediate counter-pressure on a just-won ball.
    - *Engagement value*: plausible [INF]. Nothing he has said is about a regain reward. His 27 Oct words, "A physical goal and goalkeeper can make regains more exciting and defending possession more consequential." (`ENGAGE_WITH_PURPOSE.md:59`), are about a game-integrated objective; they are evidence for the kind of consequence GF2 already integrates (the winner attacks at once), not for an added reward. His next sentence qualifies them, and bears on whether a counter-pressing team needs an objective of its own (README Q3): "But the activity still needs to provide enough attainable opportunities for both teams to remain engaged." (`ENGAGE_WITH_PURPOSE.md:61`).
  - **Bearing on distinctness (D12)** [V]: Progress the Attack's (A05) committed selection already includes Turnover Reward (`back/src/system/test-library/selection-pool.unit.ts:228`), as it includes Wide Zone. Adding it to TA02 would move the two goals' games closer, not apart.
- **(c) GF2 compatibility** [V]:
  - **As "points for a regain": a CONTRADICTION only in a symmetric, role-free GF2 game** (corrected per K3 SHOULD-3). There, GF2-19 fixes V1 to `["line_crossed","target_zone_entered"]`, REQUIRED (`contracts.json:3580`), and SD-06 is "exactly one primary scoring event" (`docs/audits/conformance/register-2026-09-18.json:2268-2274`); under his 2 Oct ruling a conflict with authored knowledge is a CONTRADICTION (`INCENTIVE_ASSURANCE_CRITERIA.md:217-218`). **With a counter-pressing role (D3), it is open, not unavailable**: another role's own event is a B9 role event, never a second V1 element (the C60 reading, which K1's 03.b fitNote states), so GF2-19 and SD-06 are not contradicted. It would need PR-5 (the role-yield marker on RPC-003's event list) and E13: the register marks `regain` "NOT EVALUABLE wherever a team scores by it" (`register-2026-09-18.json:2025`), but that `targetTypes` note has basis OUR_INTERPRETATION, so it is an engine limitation, not authored knowledge.
  - **As a value modifier on the next score after a regain**: expressible as V7–V9, like Wide Zone. But it rewards scoring quickly after a regain, which is Attack Quickly, TA02's "Common Misclassification" (`session-planning-model.rc1.json:100`). It would pull the activity toward TA01 [INF].
  - **As a non-scoring consequence** (restart or possession bonus, V11–V14): not renderable today (SYNTHESIS E12).
  - GF2-21 and GF2-22: no conflict (a regain reward is neither a possession reward nor a passing restriction) [INF].
- **Verdict: DECISION NEEDED (D4b).** The exact question is in §5. Our recommendation: do not add it to the first composition test.
  - His own test comes first (his 16 October reply, `christian-2026-10-16.txt:40`: whether the existing consequences suffice, and whether an additional reward would improve rather than distort defensive behaviour): GF2's existing regain consequence already exists and is served.
  - Nothing authored says what a turnover reward *is*. In a symmetric game its only GF2-compatible meaning (a modifier on the next score) points at Attack Quickly rather than Secure Possession; as a counter-pressing role's own event it depends on D3, PR-5 and E13.

### 3.4 Switch of Play Bonus (`tl-v0-constraint-switch-of-play-bonus`)

- **Records** [V]: `constraints.ts:73-93`; `constraints.csv:4`; `soccer-module.rc1-v3.json:5937`. Not contracted. No setup guidance.
- **Stated targets** [V]: description "Reward switching play across the field"; `exploit_space`; `scoring_bonus`; contextualAudit "Avoid sequence rules"; logicUsageNote "…to increase the value of switching, not to require a sequence."
- **(a) Relationship.** None to GP-015, its affordances, Attack Development or TA02 (§2) [V].
  - **Library-text thread** [V text]: GF2's example pattern "bonus for switching play then scoring" (`soccer-module.rc1-v3.json:5380`) is a game-form-level example in a DRAFT module (Test Library V0 text, commit `3980188`), and names no Game Problem. Recorded as it is for the other candidates; not a documented relationship.
  - "Weak-side opportunity" (RPC-MAP-106) is DEFERRED and may not be inferred to reach runtime (`rpc-library.rc1.json:4648`) [V].
- **(b) Criteria** [INF]:

  | # | Criterion | Result |
  |---|---|---|
  | 1 | Objective | **FAILS as worded.** "a deliberate switch" is the criterion's own example of failure (`INCENTIVE_ASSURANCE_CRITERIA.md:72-73`). No observable definition is authored |
  | 2 | Legible | **CONCERN.** Nothing marks "across the field" |
  | 3 | Opposition-robust | **Plausible PASS.** The defence can shift |
  | 4 | Affordance-preserving | **CONCERN.** It rewards one named action. His 13 Oct principle, HIS WORDS: "Challenge Point should prioritize shaping the affordance landscape over rewarding or requiring prescribed behaviors, while retaining incentives and consequences when they preserve or strengthen representative game relationships." (`docs/HANDOFF.md:7997-8000`). GF2's example, "switching play then scoring", is a sequence, which its own audit forbids ("Avoid sequence rules") |
  | 5 | Proportionate | **Not evaluable** |
  | 6 | Learning-Relevant | **CONCERN.** `exploit_space`. A TA02 link exists only in our reading (moving the ball away from regain pressure) |
  | 7 | Coupled | **Not evaluable** |

  - Engage with Purpose: not an opposition incentive. Its learning value for TA02 is undocumented.
- **(c) GF2 compatibility** [INF]:
  - GF2-22 allows "incentives to progress", so no conflict.
  - As an added point for the attacking team it is a second scoring event of the same team (SD-06), a CONTRADICTION in any GF2 game. As a modifier it is expressible, but the condition is unauthored.
- **Verdict: NOT JUSTIFIED.** It has no documented relationship, fails Objective as worded, rewards a prescribed action against his 13 Oct principle, and has no meaning authored.

### 3.5 Pass Combination Gate (held)

- **Records** [V]:
  - `constraints.ts:246-271`;
  - contract `blind:PASS-COMBINATION-GATE` at `contracts.json:9762`, 23 active items, with his rulings PCG-04 (4–6 is a preferred range) and PCG-14.a–f (information) [M `active-gf2-wza.out.txt`];
  - the demonstration is refused at Gate A (`PCG-02::V5`) [V-run, `understand\probe-demos.txt`].
- **Relationship**: none to GP-015 (`create_space`) [V].
- **Two authored objections**:
  - TA02's own lens: "Avoid pass limits or restrictive rules" (`soccer-module.rc1-v3.json:5054`) [V];
  - GF2-20 forbids a "consecutive-pass count" as the scoring event (`contracts.json:3596`). The gate conditions the event rather than replacing it, so this is a CONCERN, not a CONTRADICTION [INF].
- **Verdict: NOT AVAILABLE.** It is held by his ruling (§1). Nothing here asks to lift the hold.

### 3.6 Interception Reward, and Neutral Player Condition (not TA02 candidates)

- **Interception Reward** (`constraints.ts:94-114`; `soccer-module.rc1-v3.json:6003`) [V]:
  - It is in CV-015 only, not in TA02's pool [M].
  - On the merits it raises the same representation question as Turnover Reward: points for a regain contradict GF2 only in a symmetric, role-free game, and as a counter-pressing role's own event it would need D3, PR-5 and E13. It has no setup guidance.
  - **NOT JUSTIFIED.** No documented relationship (§2). Bringing it in would also be a candidate-pool change, which is his decision on learning-design grounds (rule 3, our record of his 13 Oct reply).
- **Neutral Player Condition**:
  - Contracted. It composes with GF2 [V-run, "neutral-players" served, 12 instructions].
  - **NOT JUSTIFIED** (no documented relationship, §2); also not in TA02's pool. It is **not held**: the only hold is the Pass Combination Gate (`learning-design-holds.json`) [V]. Our record of his 13 Oct reply (`docs/HANDOFF.md:7993-7996`) [V] summarises that he approved the neutral rule as a reusable mechanism and did not approve it as a canonical selection for Secure Possession (our record's words, not his); HIS WORDS, as it quotes them: "the neutral supports whichever team currently has possession and changes allegiance immediately when possession changes. That should be explicit" (`:7994-7995`). Our record of the same reply (memory `learning-design-development-standard.md`, rule 10, our paraphrase): Secure Possession with a neutral player must be assessed against its actual affordance targets before being called a learning-design example.
  - Nothing in the knowledge supplies those targets (§2).

---

## 4. The draft finding for a TA02 authorization record (DRAFT, OUR WORDING, for his review)

Shaped on A01's `authorizedConstraintsFinding` (`learning-goal-authorizations.json:153`). It is not his ruling, and a record cannot carry it as his.

> `authorizedConstraints: []` (DRAFT). No library constraint has a documented relationship to Attack Development (RPC-003), Maintain Possession (GP-015) or this goal's affordances.
> - RPC-003's relationships in rpc-library.rc1.json reach only the game archetype, Game Problem, game form, Learning Goal and scoring event libraries, and it has no manipulation property naming an object.
> - Its affordance targets RPC-MAP-103..107 are DEFERRED by Christian on 13 September 2026 ("canonical Affordance Target ids are not to be inferred to reach runtime").
> - Every Soccer Module realization row has universal_concept_id and primary_game_problem_ids null.
> - No authored mapping joins the constraints' targetAffordancePrimary vocabulary to GP-015's four affordance requirements.
> - The wording pool was derived by the parser.
> - Only the game form, GF2, is documented for GP-015 (soccer-module GF2 primary_game_problem_ids "GP-015; GP-001").
>
> Central Density Condition and Switch of Play Bonus are not justified (section 3). Wide Zone Advantage and Turnover Reward each carry a plausible relevance that only his coaching judgement can establish (D4a, D4b). The Pass Combination Gate stays held. Finding of 27 October 2026, for his review: it names no constraint as authorized.

`excluded[]` (DRAFT) would cross-reference the Pass Combination Gate hold, as A01's does (`:381-385`). It would add **no** Wide Zone exclusion: that is his D4a.

---

## 5. Decisions needed (exact questions)

- **D4 (overall): not asked.** His principle, "A library constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment." (his 16 October reply, `christian-2026-10-16.txt:13`), already makes the evaluated-empty set the outcome when no constraint is justified. GF2's own conditions, together with Attack Development's scoring event and condition, then carry the relevance, and the activity shows why element by element (K6). Only D4a, D4b and D10 are asked (README Q4).
- **D4a, Wide Zone Advantage.** Is making controlled possession in the wide channels more valuable (a progression score worth more after a touch there that the team keeps, ending when possession changes) relevant to *stabilizing possession after regaining it*? Or does it mainly serve Attack Development's primary problem, Exploit Space, and so belong to Progress the Attack?
  - If relevant: what magnitude? The evaluation you asked for on 7 Oct is still owed, and ×2 is not to be inherited.
  - If relevant: its recorded criteria 3 (Opposition-robust) and 6 (Learning-Relevant) were measured with Central Density present; they would be re-evaluated for Wide Zone alone.
  - Engine note, not part of the question: a record-backed authorized set of size 1 is refused today; making it selectable is general engine work we would do (E3, with D10).
- **D4b, Turnover Reward.** Do GF2's existing consequences provide sufficient incentive for the immediate counter-pressure that creates the Secure Possession problem? Those consequences are: a regain gives the ball and an immediate attack on the winner's target, and losing it exposes your own end ("Immediately lose the ball after winning it").
  - If they do not, what should a turnover reward *be*? In a symmetric game it cannot be a point for a regain on GF2 (GF2-19, SD-06), and a bonus on the next score after a regain rewards Attack Quickly. With a counter-pressing team (D3), a regain could be that team's own scoring event (PR-5, E13). Any meaning must be authored and evaluated against all seven criteria and both Engage-with-Purpose values.
- **Not asked:** the Pass Combination Gate (held), Neutral Player (not justified, §2; not in the pool), Interception Reward (a pool change, not proposed), Central Density (its 8 Oct ceiling-or-pair question stays open but is moot for TA02).

---

## 6. Not verified here

- Since measured, outside this evaluation (`design\step0-results.md` a2/b1; re-run on the corrected K1 in `final\scripts\probe-out\probe-k1-final.txt`, U2/U3): under a TEST-ONLY TA02 record with `authorizedConstraints: []`, the composition as drafted is refused at structure (U1). It reaches the wording gate (refused at communication, awaiting his approved wording) only with proposed rulings PR-1, PR-2 and PR-4 supplied TEST-ONLY as stand-ins and one of the three clauses of his approved scoring condition removed (U2), which is not a near-success. Without the conditions it serves plain GF2 (U3, a control, never a candidate).
- Whether a value-modifier reading of Turnover Reward would pass GA-MODIFIER-OVERLAP on GF2. Not built; it is moot unless D4b says yes.
- The authorship of the Test Library V0 CSV (commit `3980188`, 3 May 2026, no message body). Whose knowledge its `targetAffordancePrimary` values are was not established.
