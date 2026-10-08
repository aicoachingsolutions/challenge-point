# Selection integrity, the A04 knowledge gap, and the two pilot routes — investigation, 2026-10-08

Investigation only, per the 8 October order. Nothing implemented. Generation frozen. Wide Zone
incentive, Central Density representation, post-score procedure and general COMPLETED_PASS work all
left on hold. No new libraries.

Every number below is a measurement I ran against the live code, not an inference.

---

## 1 · Selection integrity — the smallest existing boundary

**The answer is `selectFor` (`back/src/system/derivation/run-bounded-selection.ts`), and it is the only
candidate.** Not the smallest of several — the only one.

### Why nothing downstream can enforce the invariant

The invariant is that *an activity must not be presented as satisfying a specific Learning Goal when
the system has only committed a general fallback package.* Enforcing that requires knowing two things
at once: **which Learning Goal**, and **how well it resolved**. Measured, those two facts coexist in
exactly one place.

`DerivationInput` carries no goal identity at all. Its keys are:

```
selection, contracts, envelope, register, derivationRules
```

and its selection entries are knowledge-object ids, not goals: `{"objectId":"GF2","knowledgeVersion":"stage-b"}`.

`resolved.provenance` likewise carries none:

```json
{"inputDigest":"8edaee39","engineVersion":"0.1.0-increment-1","registerVersion":"5, adds V8c …","derivationRulesVersion":"rev-5"}
```

I checked every field of the derivation input for the literal string `A04`. It appears only inside
prose notes on contract items and register rows — documentation text, never a goal field.

So **the goal identity stops at `selectFor`.** Derivation, the resolved game, realization, rendering
and fidelity all operate on knowledge objects and have no idea which Learning Goal asked for them. No
downstream gate can refuse "this is not really A04" because nothing downstream knows the game was ever
about A04. Giving a downstream boundary that knowledge means adding a field — a new mechanism, which
the order rules out.

### Why not `derivationInputFor`

`derivationInputFor` does receive the `BoundedSelection`, so the goal identity is still in scope there.
But `BoundedSelection` has no `resolution` field (that is the dropped-flag finding from 7 October), so
refusing there requires adding one. `selectFor` is the only place where **both** facts are already in
hand, because `selectFor` is what calls `generateSelection` and receives the `resolution` object.

### What the change would be

`selectFor` already throws twice, for exactly this class of invalidity — a broken relationship between
a goal and its selection:

```ts
if (!match) throw new Error(`${situationId} is not a practice situation of ${goalId}: …`)   // line 71
if (!goal)  throw new Error(`no such learning goal: ${goalId}`)                              // line 77
```

The invariant is a third throw in the same function, in the same style. No new type, no new field, no
new vocabulary, no change to any downstream signature, and no confidence mechanism.

**It should refuse both non-matched statuses.** `computeResolution` returns `matched | fallback |
unresolved`. `fallback` says *"Coach intent was not specifically resolved — treat as reduced
confidence."* `unresolved` is worse: *"The Design Commitment is not traceable to resolved coach
intent."* The invariant is `status !== 'matched'`.

### The cost, stated plainly

A04 is the only one of the thirteen goals that falls back, so this refuses exactly one goal and leaves
twelve untouched. But A04 is the Golden Case, so the refusal invalidates the vertical slice and
everything built on it. That is the trade the order already anticipates — *"rejecting an unsupported
goal is preferable to producing a plausible but misidentified activity"* — but it should be made with
the blast radius visible, which is why it is counted in §4.

**One judgement I would flag rather than decide.** A throw is a crash, not a refusal a tool can
present. The minimal change matches the existing precedent, which is a throw. If the pilot needs to
*say* "this goal is not supported yet" rather than fail, that is a typed refusal — a slightly larger
change, and a deliberate one. The minimal answer is the throw; the better product answer may be the
refusal.

---

## 2 · The A04 knowledge gap

### First, a correction to my own framing

My 7 October report said A04's selected knowledge "actively preserves the behaviour the coach chose A04
to change", citing *"avoid pass limits or restrictive rules"*, *"avoid forcing forward passes"* and
*"encourage progression without restricting passing options"*.

That was over-stated and the correction in the order is right. Those lines are representative-design
guardrails, and they are **necessary** for A04 rather than contrary to it: if the pass is removed, the
duel stops being a choice and becomes a compulsion, which is not the learning intention. The accurate
claim is narrower: **nothing in A04's package makes the duel visible or valuable.** The absence is the
defect, not the preserved pass.

### The structural reference for routing

Every signal group in `deriveInputConstraints.ts` has one shape:

```ts
if (matchesX(text)) {
    matchedSignals.push('signalGroup:NAME')
    pickLenses([...])
    pickConstraints([...])
    pick<Family>Archetypes()
}
```

Ten groups exist in that form. A04 needs an eleventh. **Measured cost: one predicate plus one block,
in the same style as ten precedents — no new mechanism.**

There is already precedent for "beat X" being read as *attacking* intent. `matchesDefensive` opens with
an **ATTACKING-AGAINST-A-DEFENCE OVERRIDE** that fires false for
`beat|break down|play through|unlock|penetrate … compact|low block|organised|deep defence`. A04's text
falls through it only because `defenders` is not in that noun list, and it then fails every defensive
test (`protect|prevent|deny|delay|contain|screen|shield|compact`) and every attacking group, landing on
`Z_soccer_general`. Two consequences worth stating: A04 is **correctly** not routed defensively, and a
new attacking-1v1 group would not be pre-empted by the exclusive defensive branch.

### What that addition costs, broken down

| Component | Cost | Why |
|---|---|---|
| Signal group + matcher | ~15 lines, existing shape | ten precedents |
| Affordance lenses | **zero** | lenses are "not contracted knowledge" and are excluded from derivation; picking existing ones costs no contract |
| Game form | **zero** | GF2 is already contracted and already what A04 lands on |
| Constraints / EMs | **the only real cost** | see below |

Best existing lens fit is **Line-Breaking Opportunity**, whose `coachVocabulary` already contains
`"dribble through"`, `"dribble past line"` and `"split defenders"` — the closest thing in the library to
beating a defender — with **Space Exploitation Opportunity** second.

### Whether existing contracted knowledge can serve A04

Measured, by assembling packages from contracted objects only and running them through derivation and
Gate A (all with the Sport Profile):

| Package | Gate A | authorized | derived |
|---|---|---|---|
| GF2 only (the narrow A04) | DEFERRED_TO_REALIZATION | **true** | 13 |
| **GF2 + Neutral Player Condition** | **DEFERRED_TO_REALIZATION** | **true** | **19** |
| GF2 + Variable Target Condition | FAIL | false | 15 |
| GF2 + Variable Target + Neutral Player | FAIL | false | 21 |
| GF2 + Wide Zone (A04 today) | DEFERRED_TO_REALIZATION | true | 29 |
| GF4 + Neutral Player | FAIL | false | 18 |

- **Neutral Player Condition is contracted, selected by no Learning Goal today, and works with GF2
  immediately** — 24 authored items, richer than the narrow game, fewer unestablished rows (3 vs 6).
- **Variable Target Condition fails**: 4 unestablished lines (`VARTARGET-05.a::S3`,
  `VARTARGET-13.a::V18/V19/V22`) and 2 unregistered information triggers.
- GF4 fails on `I17::V9` — a modifier magnitude — which is adjacent to held work.

**But Neutral Player is the wrong content for A04, and I will not recommend it on structural grounds
alone.** Its opportunity is *using a numerical overload*: *"One or more neutral players join the team in
possession creating a live numerical overload."* An overload makes the free pass more attractive, which
is the opposite of inviting a duel. Its category is Exploit Space and its target affordance is
`exploit_space`.

What it *is* worth, and it is worth a lot, is as the **authoring template**. Neutral Player already has
the order's own distinction built into its items:

- `contextualAudit`: *"Neutral player creates structural overload — not a coaching script. Players
  choose when and how to use the numerical advantage."*
- `NEUTRAL-16.a` EXCLUSION: *"neutral involvement required for the primary event to count"*
- `NEUTRAL-16.b` EXCLUSION: *"neutral involvement as the only or dominant route to the primary event"*
- `NEUTRAL-15.a` EXCLUSION on V8b: *"neutral involvement … as a modifier's condition"* — it may not even
  be rewarded.

That is exactly "a meaningful, discoverable opportunity, not a compulsory action", expressed as authored
exclusions. **Any attacking-1v1 object should be built in that shape.**

### The smallest legitimate knowledge addition

**Contract Small Area Condition.** It already exists in the environmental-manipulation library, so this
is restating an existing object, not inventing a mechanism or adding a library.

Why it is the smallest:

- `includesIncentiveLayer: false`, `incentiveMechanism: "none"` — no value modifier, so **no magnitude,
  no criterion, no persistence, no geometry.** It cannot re-open anything on hold.
- Its mechanism is the envelope rows `E2`/`E3`, and **GF2 already carries exactly this kind of item**:
  `GF2-24.a E2 AUTHORED SUPPORTING "40-60 m"` and `GF2-24.b E3 AUTHORED SUPPORTING "25-40 m"`. The item
  pattern is already exercised, so the contract is a handful of items on rows that already carry them.
- Its own audit note is the right standard: *"Space reduction is structural — it creates representative
  pressure through environment, not scripted actions."* In tight space the duel becomes a **recurring
  situation**; the response stays the player's choice; the pass stays fully available.

**Honest limitation.** `E1`–`E4` are `sourceKinds: ["SESSION"]` — the envelope is session input. At the
current 40 × 30 the Small Area bound is already satisfied, so adding it changes nothing observable. The
real lever is the session envelope.

Measured, the narrow A04 game runs clean at duel-dense envelopes with no knowledge change at all:

| Envelope | Gate A | acceptance | post | instructions | fidelity violations |
|---|---|---|---|---|---|
| 40 × 30, 12 players | DEFERRED_TO_REALIZATION | 0/0/0 | true | 10 | **0** |
| 30 × 25, 12 players | DEFERRED_TO_REALIZATION | 0/0/0 | true | 10 | **0** |
| **30 × 25, 8 players (4v4)** | DEFERRED_TO_REALIZATION | 0/0/0 | true | 10 | **0** |

and it re-renders correctly: *"Mark out an area 30 m long by 25 m wide"*, *"mark a line across one end
of the area, 25 m long"*, *"2 teams of 4"*.

So a duel-dense A04 is **reachable today** by a session envelope choice. The knowledge addition's job is
to bound and justify that choice, not to enable it.

### New integrity finding: the envelope can sit outside the authored range silently

30 m is **outside GF2's authored 40–60 m length bound**, and nothing objected — Gate A deferred,
acceptance was clean, fidelity reported zero violations, and no coaching observation mentioned it.
`GF2-24.a` is `SUPPORTING`, and a grep of `gates.ts` and `fidelity.ts` for `SUPPORTING` returns no hits:
**no gate or fidelity check compares the session envelope against a game form's authored bound.** If a
small-area A04 is to be run, the system currently neither enforces nor warns.

---

## 3 · Route B — is another vertical slice materially shorter?

**No. A04 is the only one of the thirteen goals that is realization-authorized today.**

Measured, every goal through selection, derivation and Gate A:

| Goal | Game form | Contracted | Gate A | Blocker |
|---|---|---|---|---|
| **A04** Beat Defenders 1v1 | GF2 ✓ | 2/5 | **DEFERRED_TO_REALIZATION** | *(none — authorized)* |
| A01 Play Out from the Back | GF2 ✓ | 3/5 | NOT_EVALUABLE | GA-INFORMATION, GA-REFERENCE-INTEGRITY |
| A05 Progress the Attack | GF2 ✓ | 3/5 | NOT_EVALUABLE | same |
| A02 Play Through Pressure | GF2 ✓ | 2/5 | NOT_EVALUABLE | same |
| TA01 Attack Quickly | GF2 ✓ | 2/5 | NOT_EVALUABLE | same |
| TA02 Secure Possession | GF2 ✓ | 2/5 | NOT_EVALUABLE | same |
| A01 + *From Goal Kicks* | GF2 ✓ | 4/6 | **FAIL** | GA-NO-FAILED-LINE: `A01-02-01.a::T3/T4/T5` |
| D03 Defend 1v1 | GF4 ✓ | 1/5 | FAIL | GA-NO-FAILED-LINE, GA-TRIGGER-REACHABLE; `GF4 I17::V9` |
| TD02 Delay the Attack | GF4 ✓ | 1/5 | FAIL | same |
| A03, A06 | GF9 ✗ | 1/5 | — | no contracted game form |
| D02 | GF8 ✗ | 1/5 | — | no contracted game form |
| D01, TD01 | GF3 / GF11 ✗ | 0/5 | — | nothing contracted at all |

### What blocks the nearest candidates, exactly

A01, A02, A05, TA01 and TA02 are **not broken** — they are unevaluable, with zero defects:

- `GA-INFORMATION` — *"0 unheld subject(s); 0 unregistered trigger(s)"* → NOT_EVALUABLE
- `GA-REFERENCE-INTEGRITY` — *"0 reference defect(s); 1 reference(s) resolved; 0 named no held element;
  **2 established no structural identity**"* → NOT_EVALUABLE

The two are prose where the register expects a structural reference, both in `blind:PASS-COMBINATION-GATE`:

| Line | Row | Value | Strictness |
|---|---|---|---|
| `PCG-02::V5` | `value.primaryEvent.conditions[].referents` | `"own half of ATTACKING_TEAM (per-team half from SV1)"` | REQUIRED |
| `PCG-10::V16` | `value.informationRules[].subject` | `"connected-pass count"` | SUPPORTING |

Both derive; neither is open. `gates.ts:799-841` resolves each referent through `identityOf`, and a
prose string is neither HELD nor DANGLING, so it takes the SD-57/SD-58 path — `openText++` and
`probe.unestablished(line)` — which blocks the gate's own probe. The gate is doing the right thing;
the restatement is the defect.

Two further details:

- `PCG-10::V16` also carries **1 contradiction**: `PCG-11` says `"current connected-pass count of
  ATTACKING_TEAM"` against `PCG-10`'s `"connected-pass count"`.
- `PCG-10::V17` derives to `COMPLETED_PASS` by **OWNER_RULING, REQUIRED**. So route B via these goals
  does touch the COMPLETED_PASS object, even though `GA-TRIGGER-REACHABLE` itself passes for them.

**Is the repair small?** Split:

- `PCG-02::V5` — plausibly yes. V5 admits *"references to regions, objects or placements"*, `SV1
  space.fractions` already defines per-team halves (sourced from SD-12), and PCG already carries an SV1
  item. It needs the per-team half to exist as a held region and be referenced structurally.
- `PCG-10::V16` — **an owner question, not obviously small.** V16's registered valueType is *"reference
  to what the information is about"*, which does not say "a held element". A connected-pass count is not
  an element and arguably should not have to be one. But `GA-REFERENCE-INTEGRITY` lists V16 among its
  reference rows and requires HELD identity. Either the restatement must name an element, or the gate
  over-requires relative to the register. That is a decision about what an information subject *is*.

### Verdict on route B

Every alternative candidate is further from a runnable activity than A04 is. The nearest ones are
blocked by a restatement defect in a *different* contracted object, whose second half is an open
architecture question, and whose trigger is governed by an owner ruling naming COMPLETED_PASS — which is
on hold. The one contracted Practice Situation (*From Goal Kicks*, `restated:A01-02`, parent A01) makes
its goal **fail** rather than pass, on three placement properties.

**Route B is longer, and it is longer in a way that touches more held work than route A does.**

---

## 4 · The two routes side by side

### Route A — complete A04

| | |
|---|---|
| **Exists** | The game is authorized and renders clean today, with and without Wide Zone, at 40 × 30 and at 30 × 25 / 4v4: Gate A deferring, acceptance 0/0/0, post-realization gates validating, 10 instructions, **zero fidelity violations**. GF2 is contracted. Lenses need no contracts. A duel-dense envelope already works. |
| **Missing authored knowledge** | One environmental manipulation contract — **Small Area Condition**, restated from the existing library object, no incentive layer, items on `E2`/`E3` in the pattern GF2 already uses. |
| **Implementation** | (a) the selection-integrity refusal at `selectFor` — one throw; (b) an attacking-1v1 signal group — one predicate plus one block, the shape of ten precedents, landing on GF2. |
| **Genuine integrity blockers** | None structural. Two things to decide: the Golden Case is invalidated by the refusal in (a) (§1), and no gate compares the session envelope against a game form's authored bound (§2). |

### Route B — another already-matched goal

| | |
|---|---|
| **Exists** | Matched selections for twelve goals; GF2 and GF4 contracted; A01 and A05 reach 3/5 contracted. |
| **Missing authored knowledge** | Repair of two prose references in `blind:PASS-COMBINATION-GATE`, plus resolution of the V16-subject question; for A01's Practice Situation, three placement properties; for GF4 goals, a modifier magnitude. |
| **Implementation** | None identified beyond the authoring above — the engine is not the obstacle. |
| **Genuine integrity blockers** | No candidate is realization-authorized. The nearest are unevaluable, not failing, so nothing is *wrong* — but nothing can be realized either. The repair path runs through an owner ruling naming COMPLETED_PASS, which is on hold. |

### Recommendation

**Route A, and most of it is already done.** The activity exists, it is authorized, it renders
faithfully, and it is duel-dense at a smaller envelope today. What is missing is not a game — it is
(1) A04 resolving specifically instead of by fallback, and (2) one contracted object that justifies the
small area without re-opening anything on hold.

The decision that gates it is §1's: enforcing selection integrity invalidates the Golden Case. That
seems to me the right price, because the Golden Case's value was always that it was honest, and a
vertical slice resting on an unresolved selection is not.
