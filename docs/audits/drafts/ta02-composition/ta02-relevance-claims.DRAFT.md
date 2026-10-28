# DRAFT: TA02 Secure Possession, element-to-affordance relevance claims (K6)

**Status: DRAFT, PROPOSED claims for Christian's review. None is approved, nothing in the repo was changed, and the engine loads none of it.** The machine-readable form is `ta02-relevance-claims.DRAFT.json`, in the same folder. Every claim there carries its knowledge rows with file:line and verbatim quotes.

**Corrected 27 October 2026** after an adversarial review (`design\review-drafts.md`, M7, K6 SHOULD-1..4 and section E). The JSON lists each correction in its `corrections` key. In short: RC-07 now quotes both fields of GAK-0015 and is graded as our join; the coverage no longer claims Support Availability is served; GF2's Game Problem mapping is credited to his authoring pass; the START element is listed as unclaimed and inert; K1 is drafted and cross-walked; RC-06 no longer narrows "while maintaining" to arrival; GF2's library sentences are labelled as not established as his.

**Corrected again the same day** after a verification pass: GAK-0015's Knowledge_Statement is presented as the workbook's gloss for the COMPATIBLE role (the same text in all 18 COMPATIBLE Game Problem rows), not a judgement specific to GP-015; RC-06's consequence is neutral between PR-2's readings; the reply received 15 October is cited as "his 16 October reply" with file:line; D8 no longer asks whether a consequence line may reach a coach, which his 24 October reply settles; and RC-10, EL-10 and EL-12 follow the corrected K4 (the out-of-play items apply his 26 October principle with the Laws).

**Library pass, 27 October 2026.** His RC1.1 Library's Attack Development section is held outside the repository ("Library line N" is a line of our text extraction of it). No claim or support level changes. Two statements do: RPC-003's affordance targets are five of the nine the Library lists (§1, and README Q6 option (b)); and RPC-ID-014 is not "the one authored row that names support": the Library names support more often, all of it Library-only, so Support Availability is still not shown (§3, G3). The JSON lists the change in its `corrections` key. Status line: nothing here is in the engine's knowledge; where this file is stored in the repository, it is a document only (`docs/audits/drafts/ta02-composition/`).

Worktree: a checkout of `f5d6d24`. Labels: **[V]** verified at the cited line; **[M]** measured; **[INF]** our inference or reading; **HIS WORDS** verbatim. Decision ids are the drafts' own; `README.md` in this folder merges them (Q1-Q8; Q9 is no longer asked) and gives the crosswalk.

---

## 1. What is being claimed, and about what

**The composition the claims describe** [INF, from SYNTHESIS §0.4]:
- GF2;
- the drafted Attack Development (RPC-003) contract, K1 (`rpc-003-contract.DRAFT.json`, corrected 27 October 2026);
- the Soccer Sport Profile;
- **no** TA02 realization record;
- **no** library constraint. K3 recommends `authorizedConstraints: []` pending his D4; the draft record is `ta02-authorization.DRAFT.json` (K2).

**The affordance vocabulary.** It is GP-015's approved profile in the Affordance Target Matrix [V `back/src/system/knowledge-core/atm-workbook.rc1.2.json:413-426`]:

| Affordance | Rating |
|---|---|
| FOI, Functional Object Interaction | E |
| OP, Open Pathway | E |
| SA, Support Availability | E, "flagged for field validation" |
| CIO, Competitive Interaction Opportunity | E, scope "Representative competitive opposition" (`:32`) |

Why this vocabulary [V]:
- It is approved, and it rates GP-015.
- RPC-003's own affordance targets (RPC-MAP-103..107) are DEFERRED by his 13 Sep ruling and may not be inferred to reach runtime (`rpc-library.rc1.json:4612-4660`). They are five of the nine his RC1.1 Library lists for Attack Development; the other four, all Common, were never staged: "positional rotation", "diagonal progression", "wide progression", "central progression" (Library lines 644-647; reconciliation LP-6).
- The soccer module's coarse ids have no authored mapping to the ATM (`docs/HANDOFF.md:7536-7540`; re-verified by grep).
- Choosing the vocabulary is his decision, **D8** (README Q6).

**Support levels**, from strongest to weakest:

| Level | Meaning |
|---|---|
| **AUTHORED_RELATIONSHIP** | An authored row itself relates the element's source to GP-015 |
| **AUTHORED_TEXT_CORRESPONDENCE** | His approved condition states what GP-015 commits to; the join is ours |
| **AUTHORED_PREMISES_OUR_JOIN** | Every premise is authored, but nothing authored joins them |
| **OUR_READING** | At least one premise is our reading of play |

---

## 2. The claims

Elements EL-01..EL-12 are listed with their origin items in the JSON `elements[]`, and cross-walked to every K1 item in `crosswalkToSiblingK1Draft`.

| Claim | Element (origin items) | Affordance | Relation | Plain consequence (ours) | Support level |
|---|---|---|---|---|---|
| RC-01 | Two teams in live opposition (GF2-14.a, GF2-13 ← GAK-0105, GF2-15 ← GAK-0109; RPC-VAL-014) | CIO | makes available | Keeping the ball is always contested | AUTHORED_PREMISES_OUR_JOIN (near-definitional: CIO *is* "representative competitive opposition") |
| RC-02 | One shared ball; possession is a rule-defined state that changes in play; a won ball stays won (SPORT-SOCCER-01/02 OWNER_RULING, GF2-07.a, GF2-07.b ASSUMED) | FOI | makes available | Preserving possession is a real problem | AUTHORED_PREMISES_OUR_JOIN (GP-015: "Preserve a rule-defined state of legal object possession…") |
| RC-03 | Play continues on a turnover (GF2-17 CONTINUE; its basis "Continuous directional circulation" is Test Library V0 text, not shown to be his) | CIO + TA02 reading | shapes | Every regain is followed at once by the other team trying to win it back. "After regaining it, under immediate pressure" recurs inside play | **OUR_READING**. The most TA02-specific claim, but **every GF2 game has it**, so A05 would carry it too (D12) |
| RC-04 | Per-team directional targets (GF2-03.e/f, 08.c–f, 09.a ← GAK-0103, 10 ← GAK-0104) | OP | makes available | Keeping the ball has somewhere to go | AUTHORED_PREMISES_OUR_JOIN |
| RC-05 | Targets fixed "regardless of possession changes" (his 9 Oct words), together with continuous play | CIO + TA02 reading | shapes | Losing a just-won ball lets the other team attack your end straight away: a game-integrated cost of losing it | AUTHORED_PREMISES_OUR_JOIN (his 25 Oct general principle, applied by us) |
| RC-06 | The scoring event (GF2-19 ∩ RPC-REL-079/080) and **condition RPC-PROP-134**: "…reaching a more advanced representative area while maintaining attacking possession." | FOI + OP | shapes | A score needs both: getting further forward while keeping possession. Securing it is a condition of success, never the success. (At the target or continuously is PR-2's question to him) | **AUTHORED_TEXT_CORRESPONDENCE**. The strongest GP-015 link. **Conditional on D1, D2, D5, PR-1 and PR-2**: no RPC-003 contract exists in the repository, the origin clause cannot be carried today, and the condition is WORDED_ONLY |
| RC-07 | Possession alone never scores (GF2-20 ← GAK-0108; GF2-21 ← GAK-0015; RPC-ID-013; PROP-042) | OP | protects | The game cannot collapse into keep-ball; possession stays a means | **AUTHORED_PREMISES_OUR_JOIN** (corrected from AUTHORED_RELATIONSHIP, M7). GAK-0015 relates GA-001 to GP-015 and names no affordance. GP-015's role in GA-001 is COMPATIBLE (the workbook's gloss for that role, the same in all 18 COMPATIBLE Game Problem rows: "This Game Problem can occur within the archetype but is weakly diagnostic or usually subordinate."), while GP-016 Regain Possession is CHARACTERISTIC (GAK-0016). The text specific to GP-015 is its Rationale: "Possession is compatible but remains instrumental to progression rather than terminal." Tying it to OP is our step |
| RC-08 | Representative information is not hidden (K1 V15 from RPC-PROP-038..041) | SA, OP, CIO | preserves information | Nothing hides teammates, space, overloads or the defence's shape | AUTHORED_PREMISES_OUR_JOIN (met vacuously if no information rule exists) |
| RC-09 | Equal numbers (GF2-14.b OWNER_RULING) | SA | shapes | No spare player is built in, so support after a regain must come from teammates moving | **OUR_READING**. SA is the weakest affordance, and the ATM flags it |
| RC-10 | Ball out of play goes to the team that did not touch it last (GF2-16.a/b; GF2's library sentence, written in engineering, commit `806f658`, not shown to be his) | FOI | shapes | Losing control costs the same as losing the ball | OUR_READING, and **INERT**: these items reach no element today (SYNTHESIS finding 6a; K4) |
| RC-C1 | *Conditional on D4a:* Wide Zone channels and modifier (WIDEZONE-18.d/e) | OP + FOI | shapes | A wide touch that is kept raises the score's value until possession changes | OUR_READING; standing concerns apply (K3 §3.2) |
| GF-01 | GF2 as a whole | GP-015 / `maintain_possession` | — | — | AUTHORED_RELATIONSHIP: GF2's `primary_game_problem_ids: "GP-015; GP-001"` (`soccer-module.rc1-v3.json:5348`) entered with his authoring pass (commit `1c71f9a`). Of RPC-003's permitted forms, GF3 maps to "GP-003; GP-001", GF2 to "GP-015; GP-001" and GF7 to "GP-001; GP-002": only GF2 maps to GP-015 [V]. RPC-REL-028 is the context gate's reason to admit GF2, not support for GF2 → GP-015 |

No claim is proposed for EL-11, the RPC-ID-015 boundary to RPC-004 (an identity boundary, not an opportunity), or for **EL-12, the start**: RPC-003-08 (T2 START, carrying RPC-ID-011 "Organized attacking possession is already established.") addresses no element in any composition [M, step0 ablation and the re-run], and it is in tension with TA02's "after regaining it" (D1). The served sentence "Pick which team starts with the ball and tell both teams before you start" is GF2's, said with or without 08 [M].

---

## 3. Coverage, and what it honestly shows

- **Not every GP-015 Essential affordance is shown to be served** [INF, JSON `coverage`]. FOI, OP and CIO are each served by a claim with authored premises. **SA is not shown**: only our reading (RC-09) and a vacuously met exclusion (RC-08) touch it.

  | Affordance | Claims | Note |
  |---|---|---|
  | FOI | RC-02, RC-06 | RC-10 inert; RC-06 conditional |
  | OP | RC-04, RC-06, RC-07, RC-08 | strongest now AUTHORED_PREMISES_OUR_JOIN (RC-04, RC-07) |
  | SA | RC-08, RC-09 | **not shown**: our reading and a vacuous exclusion only |
  | CIO | RC-01, RC-03, RC-05, RC-08 | |

  The scoring element carries RC-06, which is what RPC-VAL-012 is checked against [V `rpc-library.rc1.json:3362`].
- **The relevance comes from the game form and the context, not from any constraint.** The only documented relevance to GP-015 in TA02's selection belongs to GF2 (GF-01) [V].
  - This matches HIS WORDS in his 16 October reply: "The game form and its inherent conditions may already create the affordances needed for the Learning Goal." (`christian-2026-10-16.txt:10`; recorded at `back/src/system/test-library/library/learning-goal-authorizations.json:11`).
- **Authored versus ours:**
  - One claim rests on authored text corresponding to GP-015: RC-06, conditional.
  - Six rest on authored premises joined by us: RC-01, 02, 04, 05, 07, 08.
  - Three are our reading: RC-03, RC-09, and RC-10, which is inert.
- **Gaps** (JSON `gaps[]`):
  - **G1 (D12, D1/D2).** Only RC-03 touches "after regaining it", and it is generic to GF2. TA02 and A05 compose the same game.
  - **G2 (D11).** "Under Immediate Pressure" changes nothing.
  - **G3 (D7, D8).** SA is not shown. The one workbook identity row that names support options, RPC-ID-014 "Multiple progression and support options remain available." (`rpc-library.rc1.json:2811`), is carried by K1 item RPC-003-13 only as an inert outside-boundary item; RPC-PROP-039 "Teammate positioning and support." names support only as information (RC-08). His RC1.1 Library names support more often: "supporting movement;" (Common information, Library line 660), "coordinated support;" (identity, Library line 607), and the adjustments "improve supporting angles;" and "modify support positioning." (Library lines 698, 705). None is a workbook row, so none is an authored premise while the workbook is the executable authority (README Q8b); the gap stands (reconciliation LP-6, LP-7).
  - **G4 (D8).** He has chosen no vocabulary yet.
  - **G5 (D2).** The strongest link, RC-06, is not engine knowledge yet.
  - **G6 (D1, D12).** GAK-0015: within GA-001, the archetype of GF2 and of every RPC-003 form, GP-015's role is COMPATIBLE (the workbook's gloss for that role, the same in all 18 COMPATIBLE Game Problem rows: "can occur within the archetype but is weakly diagnostic or usually subordinate"), while GP-016 Regain Possession is CHARACTERISTIC (GAK-0016). It is a statement about GP-015's role, not a judgement written for GP-015.

---

## 4. How A01's `rationale` is shaped, and why composition needs a different shape

**Shape** [V]:
- Type: `back/src/system/test-library/learning-goal-authorizations.ts:355`: `rationale: { feature: string; words: CitedWords[]; statements: string[] }[]`.
- Validated at `:407-411`: "must name the feature and quote only his reasons, each cited".
- Data: `learning-goal-authorizations.json:1026-1155`, nine entries.
- Consumed only by the administrator's review evidence (`back/src/system/rendering/review-evidence.ts:1212-1223`, `featureBasis: 'OURS'` at `:359` and `:1217`). There `statements` are resolved against `rpcLibrary.properties(record.contextId)` only.

**Example entry** [V `:1027-1046`]:
- feature (OURS): "The building team has more players than the pressing team (the starting configuration)";
- words (HIS, 17 Oct D6): "In match play, teams building from the back commonly have more players available in their defensive third than the opposition initially commits to pressing." and two more;
- statements: `RPC-PROP-017`.

**Why it cannot serve composition** [INF from the code above]:
1. **It is authored per activity version.** The features are the realization's, and the reasons are his words about that version. A composed activity has no such words, and the validator refuses an entry without them.
2. **The feature is prose.** It joins to no element, contract item or `ElementProvenance`, so nothing can check that the feature is in the game.
3. **It names no affordance and no Game Problem dimension**, so it cannot show that GP-015's Essential affordances are served.
4. **Statements are limited to the context's own properties.** It cannot cite GF2 items, GAK rows, ATM rows or constraint records.
5. **It has no status and no authored-versus-ours grading** beyond one `featureBasis: 'OURS'`.

---

## 5. Proposed general shape (OURS, PROPOSED; vocabulary and gate-vs-evidence are his D8)

**Principle: a relevance claim attaches to reusable knowledge, not to an activity version.** A claim is
(knowledge item that establishes an element) × (affordance in a vocabulary he approves) × (relation).
- It is written once, and holds for every composition containing that item, for every Game Problem whose profile rates the affordance.
- A goal-specific reading (item × Learning Goal row, as in RC-03 and RC-05) is a separate, optional, flagged layer.
- The engine join (E7) is: `ElementProvenance` → origin item → claims on that item → affordance → Game Problem rating.

**Fields.** The full form is in JSON `proposedGeneralShape`:

| Field | Content |
|---|---|
| `claimId` | stable id |
| `status` | `PROPOSED / APPROVED / REJECTED / INERT` |
| `establishedBy` | `[{contractId, itemId}]` |
| `appliesWhen` | optional co-present items |
| `affordance` | `{vocabulary, id}` |
| `relation` | `MAKES_AVAILABLE / SHAPES / PROTECTS / PRESERVES_INFORMATION` |
| `consequence` | plain-language environmental consequence: OURS until he approves wording; if coach-facing, a concise Coach Details consequence explanation, which his 24 October reply permits when grounded in authorized knowledge (`christian-2026-10-24.txt:40`, `:50`) |
| `support` | `[{kind, ref, path, quote}]` |
| `supportLevel` | one of the four levels in §1 |
| `conditionalOn` | decision or draft-knowledge ids |
| `ruling` | his words when APPROVED; never filled by us |

**Checks** (reported as evidence, not a gate, unless he rules otherwise):
- every non-inherited element has a claim to an Essential affordance;
- every Essential affordance is served by a non-INERT claim;
- the scoring element is claimed, and RPC-VAL-012 is reported against it;
- a claim whose item reaches no element in the realized game is reported INERT. This is the silent-loss lesson: a projection is proved only by a consumer, as RC-10 and EL-12 show today.

**Relation to A01.** A01's `words` would become the `ruling` of approved claims. The two shapes can coexist, and A01's record need not change.

---

## 6. Decisions this draft needs (merged into README Q1, Q2 and Q6)

- **D8 (Q6).** The vocabulary for "why": the ATM four as drafted, or Attack Development's own targets, which would mean lifting the RPC-MAP-103..107 deferral and staging the Library's four never-staged targets (LP-6). Also: is the relevance check a gate or review evidence, and which claims count as grounded in authorized knowledge? Whether a consequence line may reach the coach is not asked: his 24 October reply already permits "concise explanations of potential environmental consequences ... when grounded in authorized knowledge", in Coach Details (`christian-2026-10-24.txt:40`, `:50`).
- **D2 (Q1, Q2).** Whether PROP-134's "while maintaining attacking possession" is carried as an engine condition, and how it is judged (PR-2). RC-06, the strongest claim, depends on it.
- **D12 (Q1).** Whether TA02 may compose the same game as A05. If not, a distinguishing element is needed, and none exists in the knowledge today.
- **Each claim (Q6)**, approve or reject, especially RC-03, RC-05, RC-07 and RC-09, whose joins or premises are ours.
