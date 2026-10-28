# GF2's library restart sentence: a draft restatement to make it act (K4). Notes

**DRAFT, NOT RULED, NOT APPROVED.** This was drafted for Christian's review. Nothing here is in the engine's knowledge: where this file is stored in the repository, it is a document only (`docs/audits/drafts/ta02-composition/`); the engine loads none of it, and no file the engine loads was changed to write it. (Library pass, 27 October 2026: this sentence only. His RC1.1 Library's Attack Development regulations "continuous play;" and "restart procedures." bear on restarts only through README Q8a; nothing below changes.) The draft is `final\drafts\gf2-restart-restatement.DRAFT.json`. Its generator is `final\scripts\gen-k4.js`, which reads every quote from a checkout of `f5d6d24` at run time. Both sit in our working folder outside the repository (the generator is not copied here; the draft is, as `gf2-restart-restatement.DRAFT.json`). **Corrected 27 October 2026** after an adversarial review (M5 and K4 SHOULD-1..4 of `design\review-drafts.md`); the draft lists each correction in its `corrections` key. Decision ids are this draft's own; `final\drafts\README.md` merges them (README Q5) and gives the crosswalk.

**Corrected again the same day** after a verification pass (N1, N4, N5 and the laws count). The earlier notes said that no law gives a restart at an end line with no goal. That was false. VERIFIED (IFAB Laws 16 and 17, read at theifab.com on 27 October 2026): whenever the whole ball passes over a goal line without a score, the restart goes to the team that did not touch the ball last, a goal kick or a corner kick, at either goal line; the award needs no goal, and only the goal kick's location (the goal area) has to be adapted. Our DRAFT Sport Profile marks LAW-16/17 NOT_APPLICABLE only because their applicableWhen (a goal at that end) was written for the build-out activities. So:
- 16.h and 16.i now rest on his 26 October principle with Laws 16 and 17, as 16.e rests on Law 15. 16.c and 16.d rest on Law 9.
- K4-1 is a confirmation only.
- K4-D3 leads with the adaptation his principle asks us to identify, and its taker / both-ends sub-question is gone.
- K4-D4 presents Law 8 adapted as the default.
- Every item carries `rulingStatus`. His offside sentence is quoted in full wherever it bears.

The draft lists each correction in its `corrections` key.

`B/` means `back/src/system/`.

Labels used below:
- **VERIFIED**: read at the cited place.
- **MEASURED**: probe output, saved beside its script.
- **INFERRED**: our reasoning.

**Probes behind the MEASURED claims** (in `design\scripts\`, run on TEST-ONLY items with the same rows, selectors and values as the draft items; every probe alters copies only):
- `probe-k4.ts` (output `probe-k4.txt`): plain GF2 in variants A–H, E2, E3, F2 and S.
- `probe-k4-a01.ts` (output `probe-k4-a01.txt`): A01 in both versions, plus the two served demonstrations.
- `probe-laws.ts` (output `probe-laws.txt`): the default-laws account.
- Re-run with the corrected draft items themselves: `final\scripts\probe-k1-final.ts` (output `final\scripts\probe-out\probe-k1-final.txt`), runs F3, F4 and F3c. Re-run again after the verification pass (items restructured, `rulingStatus` added, values unchanged): identical except for the timestamp.
- **Not measured:** the Laws-adapted end-line location and method (K4-D3) and the adapted kick-off (K4-D4). Neither is drafted as items.

---

## 1. The finding

**What GF2's library text says (VERIFIED).** The game form's setup guidance ends: "Restart conditions: ball out of play restarts from the team that didn't touch it last." (`B/sport-module/soccer-module.rc1-v3.json:5378`, `game_forms[GF2].setup_guidance`).

**Where that sentence comes from (VERIFIED; corrected per M5).** It was written on 14 May 2026 in commit `806f658` ("Populated setupGuidance for all 10 archetypes with typical physical setup", co-authored by Claude: `git show 806f658 -- back/src/system/test-library/archetypes.ts`). It reached the Soccer Module by extraction (GF2's provenance field: "Extracted from TEST_LIBRARY_V0_ARCHETYPES via extract-soccer-game-forms.ts") and was carried through his 4 August authoring pass of the Game Forms sheet (commit `1c71f9a`), which changed game archetype ids, Game Problem mappings and vocabulary. Nothing shows that he authored or reviewed `setup_guidance`. **Whether he adopted this sentence is not established.** The corpus cites it as AUTHORED by convention (GF2-16.a/b). The uncorrected notes called it "his text"; that was wrong, and the K3 evaluation already applied this standard to constraint setup text.

**How the contract restates it (VERIFIED).** Two items carry that text, both SUPPORTING / PREFERRED_DEFAULT / AUTHORED (by the convention above), with selector `trigger ∈ {OUT_END_LINE, OUT_TOUCHLINE}`:
- **GF2-16.a**: T2 = NOT_LAST_TOUCH (`docs/audits/conformance/stage-b/contracts.json:3516`).
- **GF2-16.b**: T6 = STOP_RESUME (`contracts.json:3532`).

**Why those items never act.** Field items like these act only on a transition element that something establishes. Nothing in a GF2 composition establishes an out-of-play transition (VERIFIED):
- GF2's only T1 item is GF2-07.a (POSSESSION_CHANGE).
- GF2's T1 declaration for every other trigger is UNDECLARED. Its note reads: "Existence of other transitions never examined (START, SCORE and out-of-play exist by construction, RC-19)". That convention was superseded by SD-44 (`B/derivation/gates.ts`, the GA-TRIGGER-REACHABLE comment).
- No ruling adds one. The `added[]` entries for GF2 in `corpus-restatements.json` are SD-102 and C42 only.
- The Sport Profile holds only SPORT-SOCCER-01 and SPORT-SOCCER-02.

**The consequence (MEASURED, probe A).** Plain GF2 is served with 8 instructions. None of them says what happens when the ball goes out, or after a score. Acceptance reports `nothingLost: []`.

## 2. The draft restatement

**Two existence items, applying his 26 October principle with Law 9.** Written as `added[]` entries ({contractId, after, ruling, item, why}), the shape `corpus-restatements.json` uses. Both rest on IFAB Law 9 (the ball is out of play once the whole ball has passed over a goal line or a touchline), inherited under his principle: basis OWNER_RULING, `rulingStatus` GIVEN (the principle is his; applying it to GF2 is ours). GF2's library text (SM:5378) says the same, so whether he adopts it is a confirmation only (K4-1). The first correction rested them on his adoption of that sentence (NOT GIVEN); the uncorrected draft used AUTHORED.

| Proposed id | Row [selector] | Requirement | Strictness / basis | Source |
|---|---|---|---|---|
| GF2-16.c | T1 [trigger=OUT_TOUCHLINE] | EXISTS | REQUIRED / OWNER_RULING (his 26 October principle, given) | Law 9; GF2's library text agrees |
| GF2-16.d | T1 [trigger=OUT_END_LINE] | EXISTS | REQUIRED / OWNER_RULING (his 26 October principle, given) | the same |

**Why these are not inventions.** Law 9 states that the ball can go out over either line, and Laws 15, 16 and 17 that play then restarts. Law 9 is not listed in our DRAFT Sport Profile, which lists only the laws that can fail to apply in a modified environment; every other law applies by default (`sport-profile-soccer.json:33`). Both triggers are reachable wherever the session states a length and a width (`B/derivation/engine.ts:243`). The items establish existence only.

**They must not be applied alone (MEASURED, probe B; step0 f1).** With only these two items, every GF2 game refuses at Gate A ("2 unresolved properties ... `::T3`"). Two further problems also follow:
- A STOP_RESUME transition needs a taker and a region (`B/derivation/gates.ts:1915`, GA-TRANSITION-COHERENCE; probes C and D).
- The two served demonstrations are GF2 games, so they would refuse too.

## 3. Lines that need values once the elements exist, and who supplies them

| Line | What GF2 says | What supplies it | Status |
|---|---|---|---|
| T1 (existence) | "ball out of play restarts" (library text) | **Law 9, under his 26 October principle** (16.c, 16.d); the library text agrees | **not a question** (K4-1 confirms only) |
| T2 (who restarts) | GF2-16.a NOT_LAST_TOUCH | the existing item (by the corpus convention); agrees with Law 15 at the touchline and Laws 16 and 17 at the end line | existing |
| T6 (play stops) | GF2-16.b STOP_RESUME | the existing item | existing |
| T3 (taker), touchline | UNDECLARED: "Who takes an out-of-play restart was never examined." | **Law 15, under his 26 October principle** (16.e) | **not a question** |
| T4 / T5 (where, how), touchline | NON_CLAIMED: "doesNotConstrain: restart location." / "...read as the method" | **Law 15, under his 26 October principle** (16.f, 16.g) | **not a question** |
| T3, end line | as above | **Laws 16 and 17, under his 26 October principle** (16.i): a player of the team awarded the restart | **not a question** |
| T4 / T5, end line | as above | Laws 16 and 17: a corner kick from the corner area or a goal kick from the goal area, the ball stationary. The goal area does not exist here, so the location is adapted (our proposal, §4) | **K4-D3** (confirm, or name a departure) |
| T1b (which end line) | UNDECLARED | **Laws 16 and 17**: the award is the same at either goal line (16.h, EACH_TEAM). The renderer needs it to say the end-line sentence at all (MEASURED, probe E2 versus E3) | **not a question** |
| T7 (new attack begins) | UNDECLARED | nothing | Not needed in plain GF2 (probes G and E3 are served without it). **Needed under the RPC-003 draft**: every out-of-play element fails Gate A on T7 there (MEASURED, step0 f3/f4; re-run F3/F4). Open, tied to D1 (README Q1) |
| START and SCORE transitions | T2–T6 for SCORE NOT_AUTHORED: "notAuthored: restart after a score." | Law 8: a kick-off, by the team that conceded after a score, from a centre mark this game lacks; adapted to the centre of the area (our identification, §4) | **K4-D4** (confirm, or name a departure) |

## 4. The normal Laws under his 26 October principle (item 10, VERIFIED in `sport-profile-soccer.json` `defaultLaws.authority`)

His words: "The normal Laws of the Game should apply by default wherever they are applicable, unless an activity introduces an explicit, knowledge-authorized modification." and "The governing principle is to inherit established sport rules and explicitly define only the necessary departures." Also: "Where a normal law cannot apply directly because of the modified field, scoring structure, or game format, the system should identify the relevant adaptation rather than silently assume conventional conditions exist."

| Law (profile id) | In a GF2 game (MEASURED by `blockLawAccountOf` over the realized plain GF2 game) | What it supplies |
|---|---|---|
| Law 15, throw-in (LAW-15; `requires []`, listedFor DEPARTURE, restart) | **APPLIES** | The **touchline** restart in full. Taker: a player opposing the last toucher, which agrees with GF2-16.a. Location: where the ball crossed the line. Method: a throw-in (T5 IN_HAND). The sport's approved noun already exists ("throw-in", his reply filed 19 October 2026, item 4, in `sport-coach-vocabulary-soccer.json`) |
| Law 16, goal kick; Law 17, corner (LAW-16/17; PER_END, applicableWhen OBJECT_OF_KIND_AT_END goal) | **NOT_APPLICABLE** at both end lines ("the game holds no object of the kind goal") | **The end-line award, in full except for one location.** That status comes from our DRAFT encoding, not the Laws. Laws 16 and 17 award the end-line restart to the team that did not touch the ball last, the same at either goal line; the award needs no goal (16.h, 16.i). Our DRAFT Sport Profile marks them NOT_APPLICABLE only because its applicableWhen (a goal at that end) was written for the build-out activities: "Only the laws that can fail to apply in a modified environment and matter for the two build-out realizations are listed" (`sport-profile-soccer.json:33`). That is our encoding's blind spot, not the Laws. Only the goal kick's location (the goal area) must be adapted (K4-D3) |
| Law 8, kick-off (LAW-8; requires the centre mark, UNREPRESENTED) | **ADAPTATION_OWED** | The start of play and the restart after a score (a kick-off by the team that conceded). Only the centre mark is missing: we identify the centre of the area (K4-D4) |
| Law 11, offside (LAW-11; requires a fixed halfway line, UNREPRESENTED) | **ADAPTATION_OWED** | His decision (K4-D5). He named offside himself as needing a ruling: "The offside question, for example, may need an explicit ruling for this small-sided environment, but we should not expand the current work into a comprehensive reconstruction of soccer's laws." His no-offside ruling was for A01 only |
| LAW-8-DB dropped ball, LAW-13 free kick | APPLIES | The coach's stoppages and fouls. GF2 has no such transitions, so nothing is needed for K4 |
| LAW-12-GK, LAW-14, LAW-4-GK | NOT_APPLICABLE (no goalkeeper, no goal) | Nothing |

**The touchline, applying his principle (corrected per K4 SHOULD-4).** The uncorrected draft asked him two questions here (K4-D1, K4-D2). His 26 October principle already answers them, so the draft now presents the values as applying it, for confirmation only if GF2 should depart from the Laws:
- GF2-16.e: T3 [OUT_TOUCHLINE] = "a player of the team in this element's T2";
- GF2-16.f: T4 [OUT_TOUCHLINE] = `{dynamic: "where the ball went out"}`;
- GF2-16.g: T5 [OUT_TOUCHLINE] = IN_HAND.

All three are SUPPORTING / PREFERRED_DEFAULT with basis OWNER_RULING, citing his 26 October words (given) and IFAB Law 15; `rulingStatus` GIVEN. The values are the law's, not ours. 16.e cannot be ASSUMED: an assumed value on T3, which is not a fillable row, is INVENTED (`docs/audits/conformance/derivation-rules-2026-09-18.md`, the ASSUMED row). The uncorrected 16.e covered both triggers; the end-line taker is now 16.i, from Laws 16 and 17 under the same principle.

**MEASURED, probe G, the TOUCH-SOFT runs, and the re-run F3c with the corrected items.** Plain GF2 with 16.c, 16.e, 16.f and 16.g is **served** at fidelity 0 with the sentence: "If the ball goes out over a touchline, a player of the team that did not touch the ball last restarts play with a throw-in where the ball went out". Both demonstrations are served with the same sentence added.

**The end line, applying his principle (corrected per N1).** Laws 16 and 17 award the end-line restart whenever the whole ball passes over a goal line without a score: a goal kick if a player of the attacking team touched it last, a corner kick if a player of the defending team did. Either way it goes to the team that did not touch the ball last, and it is the same at either goal line. In GF2 each team defends the end line behind its assigned end (GF2-08.c–f), so which kick applies is decidable. Two items now apply this (16.h REQUIRED, 16.i SUPPORTING / PREFERRED_DEFAULT, both as measured), basis OWNER_RULING, `rulingStatus` GIVEN:
- GF2-16.h: T1b [OUT_END_LINE] = EACH_TEAM (the same at either end line; value and strictness unchanged);
- GF2-16.i: T3 [OUT_END_LINE] = "a player of the team in this element's T2" (Law 16: the defending team; Law 17: the attacking team).

**Where and how the end-line restart is taken (K4-D3).** Here a law cannot apply directly: the goal area a goal kick is taken from does not exist. His words: "Where a normal law cannot apply directly because of the modified field, scoring structure, or game format, the system should identify the relevant adaptation rather than silently assume conventional conditions exist." (`christian-2026-10-26.txt:176`). The adaptation we identify (`rulingStatus` NOT_GIVEN, for his confirmation or a departure):
- **corner kick**: when the team defending that end line touched the ball last, to the other team, the ball stationary, from the corner of the playing area nearer to where the ball went out (the corner arc is not marked; the corner of the area is);
- **goal kick**: when the team attacking that end line touched the ball last, to the defending team, the ball stationary, from the middle of its own end line, where a goal and its goal area would stand. **The location is our proposal.**
- **Not proposed**: the opponents' distances (outside the penalty area at a goal kick; 9.15 m at a corner kick), which presuppose markings this game lacks. His limit: "The offside question, for example, may need an explicit ruling for this small-sided environment, but we should not expand the current work into a comprehensive reconstruction of soccer's laws." (`christian-2026-10-26.txt:178`).
- **NOT measured; not drafted as items.** INFERRED: T4 per end line and last toucher (row T1 has the selector attributes `qualifier.endLine` and `qualifier.lastTouch`, so a corner-kick and a goal-kick element per end line may be expressible; not examined), T5 STATIONARY_BALL. Probe F2 (T5 STATIONARY_BALL with T4 "where the ball went out") was refused at communication for want of a method phrase, so this needs at least E6, his approval of "corner kick" and "goal kick" as coach words (as he approved "throw-in"), and E-K4 for A01.

The departures he may name instead (each still uses 16.d, 16.h and 16.i):
- **(a) The coach chooses where and how**, bounded in his words. This is the M3 capability he approved for A01's end line on 18 October: "End line: coach-selected restart method, using the approved M3 capability." **That ruling was for A01 only and was superseded for A01 by his 27 October item 4 common restart; it is cited as wording and capability precedent, not as authority for GF2 (K4 SHOULD-3).** It needs:
  - T4 and T5 RANGE items in his words, REQUIRED, with an OWNER_RULING basis (register `fillableRequires`);
  - two COACH_DECIDES entries in the game form's realizer file (`docs/audits/a04-realization-choices.json`);
  - MEASURED, probe E3: **served**, with "If the ball goes out over either end line, a player of the team that did not touch the ball last restarts play; you choose where (...) and how (...)". Without T1b the sentence cannot be said (E2). Without the realizer entries, realization refuses ("is open and was not chosen", E).
- **(b) A fixed location and method he names.** MEASURED, probe F2: refused at communication. No sentence carries the end-line transition, because the renderer has method phrases only for FROM_THE_FEET and IN_HAND (`B/rendering/render-concrete-game.ts:669`, METHOD_PHRASE). This option needs E6.
- **(c) Another rule he names**, as his common restart did for A01.

**The start and the restart after a score (K4-D4).** Law 8 decides both: a kick-off to start play and, after a goal, a kick-off by the team that conceded, from the centre mark. Only the centre mark is missing. The adaptation we identify (`rulingStatus` NOT_GIVEN, for his confirmation or a departure): the kick-off is taken from the centre of the playing area; to start, the coach picks the team (Law 8 has a toss decide; today's sentence already has the coach pick). Not proposed: Law 8's own-half and 9.15 m requirements, which presuppose a halfway line and centre circle this game does not mark (his limit, above). NOT measured; not drafted as items: it needs a SCORE transition with T2–T6 authored (MEASURED, probe S: a SCORE transition alone fails Gate A on its T2–T6 lines, which is GF2's NOT_AUTHORED declarations working as intended), a T5 STATIONARY_BALL phrase (E6), and a SCORE phrase for a no-role game (E6, not measured). Today the composed game says "Pick which team starts with the ball and tell both teams before you start" and nothing after a score. The departures he may name instead: play continues; the conceding team restarts from its own end line; a coach restart.

## 5. The default-laws machinery, and whether it can supply this without a realization

**What it does (VERIFIED).** The profile names the laws in a declaration block, never as items (`B/derivation/corpus.ts`, `loadSportDefaultLaws`: "his item 10 excludes reconstructing the laws as representation"). `B/realization/default-laws-check.ts`, `blockLawAccountOf`, then classifies each law against a realized game.

**What it cannot do.** It cannot close T3, T4 or T5. The block holds no taker, location or method, and the account reads the game after derivation. Values must come from items. Their authority is his 26 October principle with the Laws: Law 15 at the touchline, Laws 16 and 17 at the end line. Where a law's location presupposes a marking this game lacks (the goal area, the centre mark), the adaptation is ours to identify and his to confirm (K4-D3, K4-D4).

**Without a realization there is no account at all (VERIFIED).** `defaultLawsAccountOf` contains `if (!realization?.defaultLawsCheck || !input.laws) return null` (`default-laws-check.ts:472`), and the build reads the check only from the realization it is trying. A composed GF2 game therefore gets no account, no departure check and no "normal rules apply" sentence.

**The general fix is E4 (SYNTHESIS §3).** Read the check from knowledge: a Sport Profile default mode, or a context-contract field. The strictness is his call (README Q5):
- Under **REPORT**, a composed GF2 game is served, and the administrator sees LAW-8 and LAW-11 owed.
- Under **ENFORCE**, it refuses until K4-D4 and K4-D5 are decided.

His limit bears on how far E4 goes: "The offside question, for example, may need an explicit ruling for this small-sided environment, but we should not expand the current work into a comprehensive reconstruction of soccer's laws." (`christian-2026-10-26.txt:178`).

**Our encoding's blind spot (VERIFIED; corrected per N1).** The uncorrected notes called this "a data gap for him to rule on" and said no law covers the ball over an end line where no goal stands. Laws 16 and 17 do. The account misses it only because our DRAFT entries for LAW-16 and LAW-17 apply only where a goal stands at that end (applicableWhen OBJECT_OF_KIND_AT_END goal), a predicate written for the build-out activities (`sport-profile-soccer.json:33`). Correcting the predicate, so the account reports the goal kick's location as owed an adaptation where no goal stands, is a correction to our DRAFT data, not a new law and not engine code. It should stay within his limit, quoted above.

## 6. A regression no draft can avoid alone: A01 (MEASURED, `probe-k4-a01.txt`)

A01's realization establishes its own out-of-play transitions (A01-R1-T1-8 and A01-R1-T1-9; his reply filed 27 October 2026, item 4). Game-form-level out-of-play items reach those elements by selector and change them:

| Variant (TEST-ONLY copies on GF2) | A01 goal version / zone version |
|---|---|
| All K4 lines REQUIRED | refused, structure: GA-NO-FAILED-LINE and GA-TRIGGER-UNIQUE, 6 collisions (T3 goalkeeper versus "a player…", T5 TAKER_CHOOSES versus IN_HAND) |
| Value lines SUPPORTING / PREFERRED_DEFAULT, end-line RANGE kept | refused, structure: both end-line elements' T4 unresolved (A01's own RANGE meets GF2's) |
| Touchline only, SUPPORTING / PREFERRED_DEFAULT | refused, **realization**: "c:provisional:A01-R1:A01-R1-T1-8::T4: the resolved game does not list this line as open". GF2's preferred location resolves the location A01 leaves to the coach |
| Unaltered | served (28 and 29 instructions) |

The two demonstrations are served in the all-REQUIRED variant and in the touchline-only variant. The scoring-modifier demonstration fails GA-TRANSITION-COHERENCE in the "end-line RANGE as PREFERRED_DEFAULT" variant, because a PREFERRED_DEFAULT RANGE does not open the line. The neutral-players demonstration was not run in that variant.

**What this means.** Even the touchline values, whose authority is already his principle, cannot be applied without one of the following:
- **E-K4 (general engine work, medium).** One of:
  - (i) one transition element per trigger and qualifier set across contributions, as the register keys transitions "by trigger ... plus qualifiers" (row T1), with each line reconciled by the existing rules;
  - (ii) a RANGE-in-words bound authored by a record-named provisional realization departs from another contribution's PREFERRED_DEFAULT value (SD-08) instead of being resolved by it.

  Option (i) touches the "no other pair of elements is ever merged" note in `realization-choices-rpc-001.json`, so that choice is partly his.
- **Or a change to A01's own knowledge.** That is his decision.

**INFERRED, not measured.** GF2-16.a/b probably already reach A01's out-of-play elements today and are ADAPTED by A01-R1-T2-1 (REQUIRED ROLE_HOLDER_BUILDING). They are inert only in games that establish no out-of-play transition.

## 7. Decisions only he can make (K4). README Q5 is the merged form

1. **K4-1, a confirmation only.** GF2's library restart sentence ("Restart conditions: ball out of play restarts from the team that didn't touch it last.") adds nothing the Laws do not: Law 9 already gives the existence items (16.c, 16.d) under his principle, and Laws 15-17 already give GF2-16.a/b's values. He may confirm it as GF2 knowledge, or we stop citing it. No item depends on the answer. The items are to be applied only together with the end-line items and after E-K4.
2. **The touchline and the end-line award: not asked.** Law 15 applies at the touchline (16.e-16.g) and Laws 16 and 17 at the end line (16.h, 16.i), under his 26 October principle. Tell us only if GF2 should depart from them. (This replaces K4-D1 and K4-D2, and the taker / both-ends sub-question of K4-D3.)
3. **K4-D3.** Where and how the end-line restart is taken, with no goal there: confirm the adaptation we identify (a corner kick from the nearer corner; a goal kick from the middle of the defending team's own end line, our proposal), or name a departure: (a) the coach chooses where and how, in his bounding words; (b) a fixed method he names, which needs E6; or (c) another rule.
4. **K4-D4.** How play starts, and what happens after a score: confirm Law 8 adapted (a kick-off from the centre of the area, by the team that conceded after a score; the coach picks the team to start), or name a departure.
5. **K4-D5.** Offside in a GF2 game. Law 11 is owed an adaptation, and his A01 ruling does not extend by itself.
6. **E4 strictness.** Should a composed game's default-laws account REPORT or ENFORCE? (Engine-scope choice, within his limit that the work not become "a comprehensive reconstruction of soccer's laws".)
7. **E-K4.** Approve the general engine change, (i) or (ii) in §6, or decide how A01's own restart knowledge should meet GF2's. (Engine-scope choice, with a knowledge facet.)

## 8. Plain English

- **What works.** GF2's out-of-play rule can be made to act from the normal Laws under his 26 October principle, with no activity record; its library sentence only agrees with them. MEASURED: the touchline throw-in is served correctly in the plain possession game and in both demonstrations.
- **What doesn't.**
  - At the end line the Laws already decide who restarts; only where the goal kick is taken needs adapting, because there is no goal area. We propose a place for him to confirm. Saying a corner kick or a goal kick also needs a small wording change (E6), and that is not measured.
  - Nothing yet says how play starts or what happens after a score. We propose Law 8's kick-off from the centre of the area, for him to confirm (not measured). Offside is undecided.
  - Game-form-level restart knowledge currently disturbs Play Out from the Back's own restarts. A general engine change, or his ruling, is needed before any of this can be switched on.
  - Under the draft Attack Development contract, every restart element is refused until he says whether a restart begins a new attack (README Q1).
- **Why it matters.** Today a composed game tells the coach nothing about balls going out or about scores, and every check still passes. That is incomplete coach instructions passing as complete (his capability 5).
- **Does it block a pilot?** It blocks a complete composed Secure Possession activity. It does not block the validated Play Out from the Back activity, as long as K4 is not applied before E-K4.
- **Decisions required.** K4-D3 and K4-D4 (each a confirmation or a departure), K4-D5, the E4 strictness, and E-K4 (README Q5); K4-1 is a confirmation only. The touchline and the end-line award need no decision.
