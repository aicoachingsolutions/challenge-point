# Step 0: what the checked engine composes for TA02 Secure Possession when Attack Development is engine-readable

**TEST-ONLY MEASUREMENT. Nothing here is approved knowledge, his ruling, or a proposal of a value.** No engine change was made. No repository file was read for writing or changed: the worktree `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18` is clean at `f5d6d24` after every run (`git status --short` empty).

This measures his 29 October item 1 ("Please draft the necessary engine-readable knowledge from our existing libraries for my review ... Where general engine limitations prevent composition, identify and address those limitations.", `scratchpad\christian-2026-10-29.txt:18-19`) before any engine work is designed.

## Paths and labels

- `B/` means `back/src/system/` in the worktree.
- `D\` means `design\` in our working folder outside the repository (its scripts and raw outputs are not copied here).

**Scripts** (in `D\scripts\`), each run with `npx ts-node --files -P tsconfig.json -r tsconfig-paths/register <script>` from `back\`:
- `step0-probe.ts` writes `D\step0-raw.json` and `D\step0-log.txt`.
- `step0-probe2.ts` writes `D\step0-raw2.json` and `D\step0-log2.txt`.
- `step0-ablate.ts` writes `D\step0-ablate.txt`.

**Labels used throughout:**
- **MEASURED**: a probe output at the run id given.
- **VERIFIED**: read in code or data at the line cited.
- **INFERRED**: our reasoning, not measured.

---

## 0. Bottom line

1. **With Attack Development made readable, the engine composes TA02 through every structural check. It stops only for want of his approved wording.** MEASURED (a2, d1, e2, g1)
   - The setup is: GF2 + the draft RPC-003 contract + the Sport Profile, with no realization record, under a TEST-ONLY TA02 record. Proposed rulings PR-1, PR-2 and PR-4 are applied TEST-ONLY, and the origin condition is withheld.
   - Results: Gate A `DEFERRED_TO_REALIZATION` (16/22 PASS, 0 FAIL, 0 NOT_EVALUABLE); realization authorized; acceptance empty; post-realization gates validated; context scoring guard findings `[]`.
   - It is then refused at `communication`: "Part of this activity is still waiting for approved coach wording, so it is not being shown."
   - What is withheld: the 6 V4/V5/V6 fields of the progression and control conditions.
2. **The draft as drafted is refused at Gate A.** MEASURED (a0, a1)
   - As drafted: the origin's empty value line (`RPC-003-10.a::V6`).
   - With PR-1 to PR-4 and the origin kept: NOT_EVALUABLE, because the origin's referent "the attack's starting condition" is open text.
   - The origin cannot be carried until his D1 answer.
3. **Drop PROP-134's conditions and TA02 is served as plain GF2, word for word, with every check passing.** MEASURED (b1, d2, e3, g2, f3b)
   - The guard passes vacuously (`constituted: []`).
   - The purpose line reads "Stabilize possession after regaining it.", but nothing in the game creates "after regaining".
   - This is the silent-loss and rule-27 trap. It is a control, never a candidate.
4. **Only 8 of the 23 draft items in play change anything in the composed game.** MEASURED (ablation, §4)
   - **RPC-003-08 (T2 START) is inert**: no composition holds a START element. It is the same pattern as GF2-16.a/b.
   - The other 14 change nothing: they are exclusions, SUPPORTING items, or REQUIRED items that restate what GF2 or the Sport Profile already establish.
5. **New interaction between the two drafts (K1 × K4).** MEASURED (f1-f4, f3b, f4b)
   - Under RPC-003, every GF2 out-of-play element from the K4 draft fails Gate A on its T7 line (`GF2-16.c::T7`). The K1 draft makes `startsEpisode` live (RPC-003-09.a) but declares T7 for POSSESSION_CHANGE only.
   - A TEST-ONLY NON_CLAIMED T7 declaration for the other triggers clears it: the throw-in sentence is served (f3b), and with the conditions in place the run stops again only at wording (f4b).
6. **Engine limitations confirmed on real compositions** (not hand-edited fixtures): MEASURED
   - Realized full-width end zones are **served with false Set up text**: "Mark a zone along the touchline, 6 m long and up to 30 m wide". Fidelity is 0 (e3). This answers §7 Q4.
   - The two-to-four rule refuses {WZA} alone and {NPC} alone (c1, d3).
   - An authorized constraint with no contract (Central Density) is committed as the "foundation" and contributes nothing (g2).
   - No default-laws account exists for any composition. Hypothetically LAW-8 and LAW-11 would be owed (§7 Q1).
   - WZA's held ×2 magnitude is served as is (d2, g2).
7. **The goalkeeper count and the review flag change nothing but one sentence.** MEASURED
   - With 1 goalkeeper, every outcome, stage, summary and reason is identical to 0 goalkeepers. The only change is the Players sentence: "...; goalkeepers play as outfield players in this activity".
   - The coach build and the administrator review build (`review.includeDrafts`) gave identical outcome, reasons and text in all 34 case runs.

---

## 1. Method, and a correction re-measured

**X0 (MEASURED).** Step 0 as SYNTHESIS §3 wrote it: `alter` pushes the draft and `alterSelection` moves RPC-003 into `contracted`.
- Result: refused at `knowledge`, with "the Representative Performance Context RPC-003 has no contribution contract, so its approved primary scoring event and qualifying condition cannot govern the game". `account.context.inThisActivity: false`.
- Cause (VERIFIED): `build()` re-runs `contractCoverage` straight after the alteration (`B/rendering/build-activity.ts:1234-1238`, `Object.assign(goalSelection, contractCoverage(goalSelection.selected))`). The context check reads `selection.contracted` (`:1323-1327`).
- This confirms the correction in `D\drafts\rpc-003-contract-notes.md` §5.4.

**How every case below was reached (VERIFIED in the scripts):**
- `corpus.loadCorpusContracts` is patched **in memory** to return the corpus plus the draft contract, shaped as the loader shapes an entry (`B/derivation/corpus.ts:85-111`).
- Selection's `contractCoverage` and `derivationInputFor` (`B/derivation/run-bounded-selection.ts:296-335`) both read it, so RPC-003 is in `contracted` and in derivation.
- The TEST-ONLY TA02 record is: `{contextId RPC-003, gameProblemId GP-015, by "TEST-ONLY", ruling ["TEST-ONLY probe record ... NOT his ruling"], authorizedConstraints per case, excluded [], manipulations []}`. It is handed to `buildActivityUnderAuthorizationRecords` (`build-activity.ts:1091`), which holds it to the loader's validator (`B/sport-module/guided-selection.ts:224`).
- The K4 GF2 items go onto a COPY of GF2 through `alter`.
- PR-4 and the zone choices go through `alterSupplied`, on the realizer's copy (`build-activity.ts:2209-2214`).

**Production state, for reference (MEASURED):**
- **P0**: TA02 as a coach builds it today is refused at `knowledge` with the same context sentence. Its account lists the four vocabulary candidates (Central Density, WZA, Turnover Reward, Switch of Play Bonus), because there is no record.
- **P1**: TA02 with the TEST-ONLY record and no draft is refused the same way.

**Base session:** 12 players, 40 × 30 m, 20 min. Each case ran with 0 and with 1 goalkeeper. The request carries no challenge-level field (`ActivitySession` is players, lengthM, widthM, durationMin, roles, objects: `B/rendering/session-envelope.ts:39-52`), so "challenge medium" could not be set and nothing in the checked chain reads one.

**Contract variants (all TEST-ONLY copies of `D\drafts\rpc-003-contract.DRAFT.json`):**
- **AS_DRAFTED**: 25 items.
- **PR1234_ORIGIN_KEPT**: PR-1 (11.b typed referent), PR-2 (12.c typed referent) and PR-3 (origin V6 NON_CLAIMED NO_FURTHER_VALUE); PR-4 is applied through `alterSupplied`.
- **U2**: PR-1 and PR-2, with the origin items 10.a and 10.b removed; PR-4 through `alterSupplied`.
- **NOCOND (CONTROL)**: the 8 PROP-134 condition items (10.a/b, 11.a/b/c, 12.a/b/c) removed.

---

## 2. Results matrix (MEASURED; `D\step0-raw.json`, `D\step0-raw2.json`)

The "gk0 / gk1" column gives the input digest (`fixture.provenance.inputDigest`, or the Gate A rerun's) for 0 and 1 goalkeepers. "Guard" is the context scoring guard re-run over the realized game (`B/rendering/context-scoring-guard.ts:201`).

| Run | Record `authorizedConstraints` | K1 variant | Other | Outcome @ stage | Cause | Gate A (pre-realization) | Guard | Diagram | gk0 / gk1 |
|---|---|---|---|---|---|---|---|---|---|
| a0 | [] | AS_DRAFTED | - | refused @ structure | GA-NO-FAILED-LINE: `RPC-003-10.a::V6` | FAIL (14/22 PASS; NO-FAILED-LINE FAIL; ONE-PRIMARY-EVENT and REFERENCE-INTEGRITY NOT_EVALUABLE) | not reached | - | 4f0ed7d2 / 32c5aedf |
| a1 | [] | PR1234_ORIGIN_KEPT | PR-4 | refused @ structure | NOT_EVALUABLE: GA-ONE-PRIMARY-EVENT, GA-REFERENCE-INTEGRITY | NOT_EVALUABLE (15/22) | not reached | - | a63f07fd / e8d8a5d8 |
| **a2** | [] | U2 | PR-4 | **refused @ communication** | 6 fields awaiting approved wording, plus 6 × fidelity Q3 | DEFERRED_TO_REALIZATION (16/22, 0 FAIL) | **pass**: constituted progression and control, findings [] | not computed (refused) | 00fd0e02 / 2af417cf |
| **b1** | [] | NOCOND (CONTROL) | PR-4 | **served**, 8 instructions | - | DEFERRED (16/22) | **vacuous**: constituted [] | drawn | b5ca1ab7 / 65de3a0a |
| b2 | [] | NOCOND (CONTROL) | no PR-4 | refused @ communication | fidelity Q3: `objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind` (a second ball class) | DEFERRED (16/22) | vacuous | - | b5ca1ab7 / 65de3a0a |
| c1 | [WZA] | U2 | PR-4 | refused @ selection | NO_COMPATIBLE_COMBINATION; unfilled roles: foundation, consequence | not reached | - | - | - |
| c2 | [WZA] | NOCOND | PR-4 | refused @ selection | as c1 | - | - | - | - |
| **d1** | [WZA, NPC] | U2 | PR-4 | **refused @ communication** | as a2 | DEFERRED (15/22; PARTICIPANTS-PRESENT also deferred) | pass | - | e2eb6e17 / 25ce5ef0 |
| d2 | [WZA, NPC] | NOCOND (CONTROL) | PR-4 | served, 15 instructions | - | DEFERRED (15/22) | vacuous | **withheld** (rule D0: WZA channel extent is a range) | a250ff18 / 11e1ef1f |
| d3 | [NPC] | U2 | PR-4 | refused @ selection | NO_COMPATIBLE_COMBINATION; unfilled roles: shaping, consequence | - | - | - | - |
| g1 | [Central Density, WZA] | U2 | PR-4 | refused @ communication | as a2. **Central Density committed as the "foundation constraint" with no contract**: `selectedWithoutContract` | (not re-run) | pass | - | gk1 identical outcome |
| g2 | [Central Density, WZA] | NOCOND (CONTROL) | PR-4 | served, 11 instructions | - | - | vacuous | not served (INFERRED: D0, same WZA channels as d2) | - |
| e1 | [] | U2 | PR-4 + zones, no depth | refused @ validation | post-realization STILL_NOT_EVALUABLE (GA-DIRECTION, GA-ENVELOPE-FIT); GA-LAYOUT-FEASIBLE NOT_EVALUABLE on `GF2-03.e::S5` | DEFERRED (16/22) | not reached | - | 00fd0e02 (= a2) / 2af417cf |
| **e2** | [] | U2 | PR-4 + zones, TEST-ONLY 6 m depth | **refused @ communication** | as a2 | DEFERRED (16/22) | pass (kind `target_zone_entered`) | - | 3286fd57 / c918c72a |
| e3 | [] | NOCOND (CONTROL) | PR-4 + zones, 6 m | served, 9 instructions, **false Set up text** | - | DEFERRED | vacuous | drawn (TARGET_ZONE) | 9e5266ea / 39b6b817 |
| f1 | [] | NOCOND | PR-4 + K4 `added[]` (16.c, 16.d) | refused @ structure | GA-NO-FAILED-LINE: `16.c::T3`, `16.d::T3`, `16.c::T7`, `16.d::T7` | FAIL (13/22; TRANSITION-COHERENCE and PARTICIPANTS-PRESENT NOT_EVALUABLE) | - | - | 32056077 / 7c100eca |
| f2 | [] | NOCOND | PR-4 + K4 16.c-16.g | refused @ structure | GA-NO-FAILED-LINE (`16.c::T7`, `16.d::T7`) and GA-TRANSITION-COHERENCE FAIL | FAIL (13/22) | - | - | 14e79067 / 0b060f7a |
| f3 | [] | NOCOND | PR-4 + K4 touchline (16.c, e, f, g) | refused @ structure | GA-NO-FAILED-LINE: `16.c::T7` | FAIL (14/22) | - | - | 53d030c8 / 2512166d |
| f4 | [] | U2 | PR-4 + K4 touchline | refused @ structure | as f3 | FAIL (14/22) | - | - | 904b9191 / 98f886fc |
| f3b | [] | NOCOND + TEST-ONLY T7 decl. | PR-4 + K4 touchline | served, 9 instructions (adds the throw-in sentence) | - | - | vacuous | drawn | - |
| f4b | [] | U2 + TEST-ONLY T7 decl. | PR-4 + K4 touchline | refused @ communication | as a2 | - | pass | - | - |
| f3c | (no goal: `buildActivityFromKnowledge(['GF2'])`) | none | K4 touchline as drafted | served, 9 instructions | - | - | n/a | drawn | - |
| f3d | (no goal) | none | K4 `added[]` only | refused @ structure | GA-NO-FAILED-LINE: `16.c::T3`, `16.d::T3` | - | n/a | - | - |

**Realization, for every case that reached communication or was served** (VERIFIED by code path): realization authorized, acceptance (`nothingClosedWithoutAuthority`, `nothingLost`, `nothingInvented`) empty, and post-realization gates validated. Any entry in these lists is pushed into `invalid` and refused at `validation` before communication (`build-activity.ts:2270-2272, 2284-2310, 2393`). Served cases print it directly: `integrity` = `{"gateA":"DEFERRED_TO_REALIZATION","realizationAuthorized":true,"acceptance":{...all []},"postRealizationValidated":true,"fidelityViolations":0}`.

**Default-laws account: absent in every case** (MEASURED: `fixture.defaultLaws` is null and no `defaultLaws` key exists in any served fixture). VERIFIED cause:
- `lawAccountOf` returns null unless the realization being tried declares `defaultLawsCheck` (`build-activity.ts:1563-1565`).
- The fixture's account needs the same (`:2420-2437`).
- A composition has no realization.
- So no "normal rules apply" sentence is given and no departure check is made.

**Fidelity Q1-Q6 (MEASURED, re-run with `checkFidelity` over each fixture).** Q1 (instruction to properties), Q2 (nothing unsupported), Q4 (no status changed by wording) and Q6 (role-block composition; not applicable without role blocks, `B/rendering/role-blocks.ts:815`) gave **no findings in any case**.
- **Q3 (nothing lost):**
  - a2, d1, e2, g1, f4b: VIOLATION ×6, one per withheld condition field.
  - b2: VIOLATION on the ball class.
  - Every case: NOTEs for `startsEpisode` and `space.axis`, "deliberately given no coach-facing expression".
- **Q5 (a coach could lay it out and play it):** NOTEs only. **Q5 did not catch e3's false zone placement.**

**Overview** (VERIFIED): it is composed only for a served activity (`build-activity.ts:1831-1834`; the refusal path returns at `:1820`). So none exists for communication refusals.

---

## 3. Case by case, with the coach-facing text

Status tags are the renderer's: `(DERIVED)`, `(STARTING)`, `(COACH_CHOICE)`, `(PREFERENCE)`. For refusals at communication, the text is the admin-only review draft (`activity.draft`, `B/rendering/review-draft.ts:77`). It is **never served**. Every sentence in it is DRAFT unless marked APPROVED.

### (a) `authorizedConstraints: []` with the draft contract

**a0, as drafted** (gk0 and gk1 identical). Refused @ structure.
- Summary: "The game this goal selects is not yet described completely enough to be set up."
- Reasons: "Gate A is FAIL"; "a pre-realization Gate A invariant fails: GA-NO-FAILED-LINE"; "1 unresolved property is neither an authorized choice nor an authorized claim: c:restated:RPC-003:RPC-003-10.a::V6".
- `account.context.inThisActivity: true`.
- Withheld or diagram: none (stopped before assembly).

**a1, PR-1 to PR-4 with the origin kept.** Refused @ structure.
- Summary: "This goal selects a rule whose description is still incomplete, so the activity cannot be checked yet."
- Reasons: "Gate A is NOT_EVALUABLE"; "a pre-realization Gate A invariant cannot be evaluated, so it is not satisfied: GA-ONE-PRIMARY-EVENT, GA-REFERENCE-INTEGRITY".
- INFERRED cause: the origin referent 10.b stays open text ("the attack's starting condition"). PR-1 and PR-2 type only the progression and control referents.

**a2, PR-1, PR-2 and PR-4, origin withheld.** Refused @ communication.
- Summary: "Part of this activity is still waiting for approved coach wording, so it is not being shown."
- Reasons: "awaiting approved wording" for `value.primaryEvent.conditions[c:restated:RPC-003:RPC-003-11.a].type (V4)`, `.referents (V5)` and `.value (V6)`, and the same three for `RPC-003-12.a`. Each is followed by a fidelity Q3 line: "... is established by the game and no instruction carries it".
- The realized primary event:

  `{"value":1,"conditions":[{"elementId":"c:restated:RPC-003:RPC-003-11.a","type":"progression","referents":{"objectiveReferenceOf":"SCORING_TEAM","role":"PRIMARY_SCORING",...},"value":"more advanced"},{"elementId":"c:restated:RPC-003:RPC-003-12.a","type":"control","referents":{...},"value":"while maintaining attacking possession"}],"kind":"line_crossed"}`

- Guard: constituted `[progression (RPC-003-11.a), control (RPC-003-12.a)]`, findings `[]`.
- **Gate A: GA-EPISODE-REACHABLE PASS.** A WHOLE_GAME condition needs no episode.
- Admin draft (DRAFT_NOT_SERVED). Every sentence below is DRAFT:
  - [Set up] (DERIVED) Mark out an area 40 m long by 30 m wide
  - [Set up] (STARTING) Mark both end lines: they are the scoring lines
  - [Players] (DERIVED) Divide 12 players into 2 teams of 6, with no goalkeepers (gk1: "Divide 12 players into 2 teams of 6; goalkeepers play as outfield players in this activity")
  - [How it works] (COACH_CHOICE) Pick which team starts with the ball and tell both teams before you start
  - [How it works] (STARTING) When possession changes, play carries on without a stoppage, and each team keeps attacking the same line
  - [How to score] (STARTING) A team scores 1 point by getting the ball across the line it is attacking
  - [How to score] (DERIVED) Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game
  - [When it ends] (DERIVED) Play for 20 minutes
- Withheld (6, all `AWAITING_APPROVED_WORDING`): `RPC-003-11.a` type/referents/value (V4/V5/V6) and `RPC-003-12.a` type/referents/value. This is the WORDED_ONLY table in `B/rendering/render-concrete-game.ts:550-575`, where an approved entry is required. The approved table holds only A01-W1..W3.
- Diagram and overview: not computed (refused).

### (b) `[]`, draft WITHOUT the 8 PROP-134 condition items (CONTROL, not a proposal)

**b1, with PR-4.** Served, 8 instructions, fidelity 0, `nothingLost: []`. The text is identical, word for word, to plain GF2 (`understand\probe-demos.txt`, "plain GF2"):
- [Set up] (DERIVED) Mark out an area 40 m long by 30 m wide
- [Set up] (STARTING) Mark both end lines: they are the scoring lines
- [Players] (DERIVED) Divide 12 players into 2 teams of 6, with no goalkeepers (gk1: "...; goalkeepers play as outfield players in this activity")
- [How it works] (COACH_CHOICE) Pick which team starts with the ball and tell both teams before you start
- [How it works] (STARTING) When possession changes, play carries on without a stoppage, and each team keeps attacking the same line
- [How to score] (STARTING) A team scores 1 point by getting the ball across the line it is attacking
- [How to score] (DERIVED) Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game
- [When it ends] (DERIVED) Play for 20 minutes

Overview, served: `{"purpose":"Stabilize possession after regaining it.","game":"2 teams of 6: each team attacks the line at the other team's end.","parameters":"40 x 30 m, 12 players, 20 minutes","scoring":{"groups":[{"label":"Each team","lines":[{"text":"A team scores 1 point by getting the ball across the line it is attacking."}]}]}}`

Diagram, served (DRAWN):
- Legend: "target line". Description: "Each team attacks the line at the other team's end."
- Admin notes: the ball is not drawn; no starting area is authorized for either team.

**What the condition changes (a2 compared with b1):** a2 adds two condition elements to `value.primaryEvent` and six withheld fields. That is the whole difference. Remove them and the activity is served under "Attack Development" with nothing of PROP-134, while every check passes. The guard is vacuous: it confirms only the conditions the contract constitutes (`context-scoring-guard.ts:189-195`).

**b2, without PR-4.** Refused @ communication.
- Summary: "Part of this activity cannot be explained to a coach yet, so it is not being shown."
- Reason: "fidelity Q3: objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind is established by the game and no instruction carries it".
- Cause: two ball classes, the draft's 04.a and the Sport Profile's. PR-4 is needed or the draft must not author its own ball.

### (c) `[WZA]` alone

c1 and c2 are refused @ selection.
- Summary: "This goal's designated constraints cannot yet be combined into a game, so no activity can be built for it."
- Reason: "selection: TA02: a knowledge gap (NO_COMPATIBLE_COMBINATION) - the goal's designated knowledge cannot be combined into a selection on GF2; unfilled roles: foundation, consequence; held by ruling: none. Nothing was drawn from outside the goal's candidates."

This is the two-to-four rule (E3 in SYNTHESIS).

### (d) `[WZA, NPC]` (NPC = `tl-v0-constraint-neutral-player-condition`, contracted, role `structure`)

**Selection (MEASURED, d1/d2):** NPC is committed as the "foundation constraint" and WZA as the "shaping constraint". `unfilledRoles: ["consequence"]`, `gap: null`.

**d1 (conditions present).** Refused @ communication with the same 6 withheld fields as a2. Guard passes. The admin draft (DRAFT, never served):
- [Set up] Mark out an area 40 m long by 30 m wide
- [Set up] Mark both end lines: they are the scoring lines
- [Set up] (DERIVED) Mark a channel along each touchline, 40 m long and between 4.5 m and 7.5 m wide
- [Players] (STARTING) Divide 12 players into 2 teams of 5, with 2 neutral players and no goalkeepers (gk1: "...with 2 neutral players; goalkeepers play as outfield players in this activity")
- [Players] (DERIVED) The neutrals support whichever team has possession and switch immediately when possession changes. They take a full part in play — not waiting, resting or watching
- [Players] (STARTING) Make the neutrals easy to tell apart from both teams — for example, contrasting bibs
- [How it works] Pick which team starts with the ball and tell both teams before you start
- [How it works] When possession changes, play carries on without a stoppage, and each team keeps attacking the same line
- [How to score] A team scores 1 point by getting the ball across the line it is attacking
- [How to score] Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game
- [How to score] (DERIVED) A score is worth 2 instead of 1 once the attacking team has touched the ball inside either channel and kept it after that touch. The bonus lasts until possession changes
- [When it ends] Play for 20 minutes
- [Adjusting the activity] (PREFERENCE) Around 6 m to 7.5 m wide works well for each channel
- [Adjusting the activity] (DERIVED) Keep at least 1 neutral player
- [Adjusting the activity] (PREFERENCE) 2 neutral players work well for a group this size

**d2 (CONTROL).** Served with the same 15 sentences, fidelity 0.
- Overview served: `{"purpose":"Stabilize possession after regaining it.","game":"2 teams of 5, with 2 neutral players who support whichever team has possession: each team attacks the line at the other team's end.","parameters":"40 x 30 m, 12 players, 20 minutes","scoring":{"groups":[{"label":"Each team","lines":["A team scores 1 point by getting the ball across the line it is attacking.","A score is worth 2 instead of 1 once the attacking team has touched the ball inside either channel and kept it after that touch. The bonus lasts until possession changes."]}]}}`
- Diagram **withheld**: rule D0, "c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a: Set up states its extent as limits the coach chooses within, so drawing it at one size would state a size the activity does not fix" (and the same for WIDEZONE-03).

**WZA's magnitude is served as ×2.** His criteria hold it: "Do not inherit x2 merely because it is currently present." (`docs/INCENTIVE_ASSURANCE_CRITERIA.md:491-492`). Any authorization of WZA for TA02 would carry ×2 until he decides the magnitude (D4).

**d3, `[NPC]` alone.** Refused @ selection: NO_COMPATIBLE_COMBINATION, "unfilled roles: shaping, consequence".

### (g) `[Central Density, WZA]` (SYNTHESIS step 0 listed this set; `D\step0-log2.txt`)

**Selection:** Central Density (`tl-v0-constraint-central-density-condition`, no contract) is committed as the "foundation constraint" and WZA as "shaping".
- `contracted: [GF2, WZA, RPC-003]`, `missing: [Central Density]`, `account.selectedWithoutContract: ["tl-v0-constraint-central-density-condition"]` (`build-activity.ts:629`).
- **g1** (conditions present): refused @ communication, as a2.
- **g2** (CONTROL): **served**, 11 instructions, fidelity 0. They are the 8 GF2 sentences plus the WZA channel, bonus and width sentences.
- **Central Density contributes nothing to the game or to the text. It also satisfies the "foundation" slot that lets WZA pass the two-to-four rule.**
- This confirms E2's silent drop by measurement: a coach would read nothing of it, and only the technical account lists it.

### (e) Line or zone, through `alterSupplied` (realizer copy; TEST-ONLY 6 m depths using the pattern of `B/realization/target-extents.unit.ts:51-81`)

**e1 (zones, no depth).** Refused @ validation.
- Summary: "The game built for this activity did not pass its own checks, so it is not being shown."
- Reasons include: "GA-LAYOUT-FEASIBLE — 'every geometric extent, open or realized, admits a joint assignment inside the area': NOT_EVALUABLE (a realized placement on c:restated:GF2:GF2-03.e::S5 is not an interval this check can compare)".
- This matches `target-extents.unit.ts:121-133`. GF2 authors no zone depth, so where the advanced area lies is D5.

**e2 (zones, 6 m, conditions present).** Refused @ communication, as a2.
- The realized event kind is `target_zone_entered`, which is in RPC-003's approved events. The guard passes.
- Regions: `GF2-03.e` zone along 0-6, across 0-30; `GF2-03.f` zone along 34-40, across 0-30.
- Admin draft:
  - [Set up] Mark out an area 40 m long by 30 m wide
  - [Set up] (STARTING) **Mark a zone along the touchline, 6 m long and up to 30 m wide** (said twice)
  - [Players] Divide 12 players into 2 teams of 6, with no goalkeepers
  - [How it works] Pick which team starts with the ball ...
  - [How it works] (STARTING, **APPROVED**) When possession changes, play carries on without a stoppage, and each team keeps attacking the same target
  - [How to score] (STARTING) A team scores 1 point by getting the ball under control into its target zone: running it in, or passing to a teammate who receives it under control inside
  - [How to score] (DERIVED) Each team attacks the zone at the other team's end. Decide which team starts at which end; the ends stay the same for the whole game
  - [When it ends] Play for 20 minutes

**e3 (CONTROL).** **Served with the same text, fidelity 0.**
- Overview: "2 teams of 6: each team attacks the zone at the other team's end."
- Diagram DRAWN: legend "target zone"; "Each team attacks the target zone at the other team's end."
- The Set up sentence contradicts both the realized geometry and the diagram.

### (f) The draft GF2 restart restatement (K4) pushed through `alter`

**f1** (`added[]` only, 16.c and 16.d). Refused @ structure. Unresolved: `GF2-16.c::T3`, `GF2-16.d::T3`, `GF2-16.c::T7`, `GF2-16.d::T7`.

**f2** (16.c-16.g). Refused @ structure. GA-NO-FAILED-LINE (`16.c::T7`, `16.d::T7`) and GA-TRANSITION-COHERENCE FAIL. The end-line T4 and T5 lines are open; the K4 notes §4 give the options for them.

**f3 and f4** (touchline only). Refused @ structure. "1 unresolved property ...: c:restated:GF2:GF2-16.c::T7".

**f3c, the same items with no context** (`buildActivityFromKnowledge(['GF2'])`). Served, adding "[Restarts and ball out] (STARTING) If the ball goes out over a touchline, a player of the team that did not touch the ball last restarts play with a throw-in where the ball went out". So the T7 failure comes from the RPC-003 draft, not from K4.

**f3b and f4b (diagnostic)** add one TEST-ONLY K1 declaration: `T7 [trigger ∈ {SCORE, OUT_END_LINE, OUT_TOUCHLINE}] NON_CLAIMED`.
- f3b is served with the throw-in sentence.
- f4b reaches communication (wording only), with the throw-in sentence in the draft.
- INFERRED mechanism: RPC-003-09.a (`T7 [POSSESSION_CHANGE] = true`) makes `startsEpisode` a line every transition element must resolve. The draft declares T7 only for POSSESSION_CHANGE (`D\drafts\rpc-003-contract.DRAFT.json`, declarations), and GF2 declares T7 UNDECLARED: "Episode boundaries were never examined by the original contract."
- **Declaring NON_CLAIMED is a reading, not a fix to apply.** Whether a restart begins a new attack is part of "the attack's starting condition" (D1).

---

## 4. What each draft K1 item does in the composed TA02 game (MEASURED, `D\step0-ablate.txt`)

**Base:** a2 (23 items). Each item was removed from a copy and the build re-run. Compared: outcome, realized game, Gate A verdicts, text, and withheld fields.

| Effect of removing it | Items |
|---|---|
| **Changes the game or outcome** (8) | 04.a (the ball: PR-4's identification then cannot stand, refused @ realization); 09.a (game changes in `transitions`: `startsEpisode`); 11.a and 12.a (the condition elements go; 3 withheld each); 11.b, 11.c, 12.b, 12.c (refused @ structure, GA-NO-FAILED-LINE on the orphaned V5/V6 line) |
| **No change at all** (15) | 01.a P1 COUNT 2; 01.b live opposition; 02 S1 axis; 03.a V1 event list; 03.b V0 COUNT 1; 04.b ball contested; 05 V1 EXCLUSION possession alone; 06 DV1 orientation; 07 J1 ≥1 per team (SUPPORTING); **08 T2 [trigger=START] EXISTS**; 09.b T6 [POSSESSION_CHANGE] EXISTS; 13 DV1 ≥2 routes (SUPPORTING); 14.a and 14.b boundary EXCLUSIONs; 15 V15 information EXCLUSION |

How to read the "no change" row (INFERRED unless marked):
- The exclusions and SUPPORTING items are expected to change nothing in a game that does not violate them. Whether the "outside" exclusions (14.a/b, 15) are evaluated at all was not measured.
- 01.a, 01.b, 02, 03.a, 03.b, 04.b, 06 and 09.b restate what GF2 or the Sport Profile already establish. They are redundant here, not lost.
- **08 is inert** (MEASURED): the realized `transitions` list holds only `GF2-07.a` (and `NEUTRAL-12.a` with NPC). No contribution establishes a START transition. So RPC-003-08, which carries RPC-ID-011 "Organized attacking possession is already established." and RPC-PROP-034, addresses no element. This is the K1 analogue of finding 6a (GF2-16.a/b; MEASURED again here: neither is named anywhere in any composed fixture).

---

## 5. SYNTHESIS §7 open questions 1-4

**Q1: Laws owed.** MEASURED in every composition reached (a2, b1, d1, d2, e2, e3; gk0 and gk1 identical). This is `blockLawAccountOf` called directly over the realized game, which the build itself never calls without a realization.
- **ADAPTATION_OWED:**
  - LAW-8 (kick-off: "the centre mark a kick-off is taken from: no register row holds it");
  - LAW-11 (offside: "no register row holds the halfway line of Law 1").
- **APPLIES:** LAW-8-DB, LAW-13, LAW-15.
- **NOT_APPLICABLE:**
  - LAW-14, LAW-16 and LAW-17 at both end lines ("the game holds no object of the kind goal").
  - LAW-12-GK and LAW-4-GK. Even with 1 goalkeeper in the session they are not applicable, because the goalkeeper plays outfield.
- INFERRED: under an ENFORCE account (E4), every composed TA02 game would be refused at validation naming LAW-8 and LAW-11 (`build-activity.ts:1580-1586`). Under REPORT it would be served, and the owed laws would show to the administrator only.
- The end-line blind spot (no law covers "ball over an end line with no goal") is confirmed.

**Q2: Does a WHOLE_GAME PROP-134 condition pass Gate A, realization and the guard?** Yes, MEASURED (a2, d1, e2, g1), with the two referents typed (PR-1, PR-2) and the origin withheld:
- Gate A DEFERRED_TO_REALIZATION with 0 FAIL and 0 NOT_EVALUABLE; GA-EPISODE-REACHABLE PASS;
- realization authorized;
- post-realization validated;
- guard findings `[]` for both the line and the zone event kind.

What stops each version:
- With open-text referents (a1): NOT_EVALUABLE.
- With the origin as drafted (a0): FAIL.
- The only remaining stop is communication: the six WORDED_ONLY fields.

**Q3: Do GF2 out-of-play elements need T3/T4/T5 authored?** Yes for T3, MEASURED:
- f1 and f3d: an out-of-play element without T3 fails GA-NO-FAILED-LINE.
- f2: with T3 but the end-line T4 and T5 open, it fails GA-TRANSITION-COHERENCE.
- Touchline with T3 and Law-15 values: served without context (f3c).
- **New under RPC-003: T7 also has to be resolved on every out-of-play element** (f3 and f4 against f3b and f4b).
- Not measured here: the end line with RANGE-in-words plus coach-decides closures. The K4 draft carries no items for that option (K4 notes §4, option a, measured there as E3 on plain GF2).

**Q4: Do realized zone targets reach the "along the touchline" branch?** **Yes**, MEASURED (e2 draft; e3 served).
- What is realized: full-width zones across 0-30 m at 0-6 m and 34-40 m along.
- What is said: "Mark a zone along the touchline, 6 m long and up to 30 m wide" (twice).
- It is served with fidelity 0 and Q5 NOTEs only. The overview and diagram both say "at the other team's end", so the coach would get three accounts that disagree.
- VERIFIED cause: `targetZone` returns null when the objective's team has no role noun (`render-concrete-game.ts:1746-1754`), and the region falls to `channels2` (`:1816`), whose `where` is `'along the touchline'` (`:1803`).
- The repository already records this as "Reported, not fixed" (`target-extents.unit.ts:20-24`), and as unreachable in production only because GF2's realizer file closes both targets as lines.

---

## 6. Digest and provenance (MEASURED)

**The draft is in the provenance stamp under the corpus label.** With the loader patch, the draft contract enters the stamp: Gate A rerun `versions.objects` = `[{"id":"GF2","version":"stage-b"},{"id":"RPC-003","version":"stage-b"},{"id":"sport-profile:soccer","version":"stage-b"}]`. This differs from the `alter` route, which SYNTHESIS §3 cautions leaves it out.
- The draft is stamped `stage-b`, exactly like approved corpus contracts.
- Nothing in the digest or the stamp tells a draft-built game from an approved one. This bears on SYNTHESIS §7 Q10 and E1.

**Fixture provenance** for every assembled game: `engineVersion "0.1.0-increment-1"`, `registerVersion` 25, `derivationRulesVersion "rev-5"`. `inputDigests` on served activities: `[{"blockId":"ONE_GAME","inputDigest":<as table>}]`.

**Realizer changes do not move the input digest.** The digest is `digest(canonicalInput(input))` over the derivation input (`B/derivation/engine.ts:404`). Measured pairs:
- b1 and b2, with and without PR-4: both `b5ca1ab7`.
- a2 and e1, line and zones: both `00fd0e02`.

So a stored digest cannot detect a change in realization choices. INFERRED: that matters for `checkedSave` (`B/rendering/live-activity.ts:444-473`) only if realizer files vary.

**The session changes the digest; the goalkeeper count changes nothing else.** It moves the digest (for example a2 `00fd0e02` with gk0 against `2af417cf` with gk1), because the envelope is part of the derivation input.

**Selection provenance**, for every case past selection:
- `selected`: `game form:GF2`, three lenses ("affordance lens (not contracted knowledge)": possession-stability, line-breaking, space-creation), `representative performance context:RPC-003`, plus any authorized constraint.
- `constraintSource`: `{"source":"AUTHORIZATION_RECORD","constraintAuthority":"AUTHORIZATION_RECORD","constraintPrinciple":{"ruledOn":"2026-10-15","by":"Christian","principle":"A library constraint is not mandatory unless its inclusion is justified by the approved knowledge and intended learning environment."},"lensAuthority":"ENGINE_LENS", ...}`.

**INFERRED, about the live route:** a record with `constraintAuthority: AUTHORIZATION_RECORD` would flip TA02's live route to the checked chain (`live-activity.ts:55-57`). That is why the record here exists only in this process.

---

## 7. What this tells the design (brief; the decisions remain his)

**Engine work the measurement confirms (general; no goal named):**
- **E1:** a draft store, plus a draft label in the provenance stamp (§6).
- **E2:** an authorized constraint with no contract must be a named gap, not a silent "foundation" (g2).
- **E3:** the two-to-four rule for record-backed sets (c1, d3). D10 is needed first.
- **E4:** the default-laws account for compositions (§5 Q1).
- **E5:** zone and interior Set up sentences, and a fidelity Q5 clause tying placement words to geometry (e3, served false).

**Draft defects found (for the K1 and K4 drafters, not engine work):**
1. RPC-003-08 is inert in any composition (§4).
2. The K1 T7 declarations cover POSSESSION_CHANGE only, which breaks every K4 out-of-play element (f3 against f3b). The repair is tied to D1.
3. K4 `added[]` alone refuses every GF2 game on T3, as its notes say (f1, f3d).

**Decisions the runs sharpen (his):**
- **D1 (the origin):** blocks a0 and a1.
- **The wording:** six WORDED_ONLY fields for the progression and control conditions (a2). This is the last gate.
- **PR-1, PR-2 and PR-4:** each is required to reach a2.
- **D5:** line or zone, and zone depth (e1). An interior area needs E5 first.
- **D4:** which constraints, and the WZA magnitude (d2 serves ×2).
- **K4-D1 to D5:** restarts and laws.

**Representativeness (INFERRED; rule 27):** even a2, once worded, is a symmetric GF2 game. Nothing in it creates "after regaining it". It shows the structural composition works. It is not yet the learning-design example he asked for (D1-D3).
