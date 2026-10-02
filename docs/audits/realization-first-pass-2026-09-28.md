# Realization, first pass — what the layer does, what it found, and what is returned for ruling

28 September 2026. Branch work against the stage-B conformance corpus and the five bounded-pilot
goals. Coach-facing generation remains frozen; everything below is internal realization against
resolved-game outputs, which is what was authorized.

---

## 1. The layer

`back/src/system/realization/realize.ts`. Resolved game → concrete game + realization record.
No coach language, no variation, no activity slots.

It may do exactly three things:

1. **choose** a value for a line the resolved game lists as `open`, inside the bounds carried with
   it, recording the choice and the authority behind it;
2. **instantiate** a member satisfying an `existential` claim (SD-97), recording that it did;
3. **refuse**, naming every reason rather than the first.

It may not fill a `notEstablished` line, choose outside bounds, add structure, alter a derived
value, or proceed when `mayRealize` is false.

The acceptance conditions are the three that were set, and they read the **finished game** rather
than trusting the writer above them — so a gap filled by any route, including a future bug, is
caught:

| condition | what it checks |
|---|---|
| nothing closed without authority | no line the knowledge left unestablished carries a value |
| nothing derived is lost | every derived value survives unchanged |
| nothing is invented | every concrete value traces to a derived value, a recorded choice, or a recorded instantiation |

**The third is the one worth having.** It is the only one that fails silently: a game with a gap
quietly filled looks better than one without.

22 tests. 216 in the suite, green, `tsc` clean. `npm run realize` attempts one and prints the
outcome; it supplies no choices of its own, because a runner inventing a choice to make its output
look finished is the exact failure the layer exists to prevent.

### One decision inside it worth stating

A **qualitative bound** cannot be checked. SD-15 forbids inventing a number for *"a long kick"*, so
there is nothing to compare a value against. The layer neither rejects the value nor pretends to
have verified it: the choice is recorded with `boundCheck: UNVERIFIABLE_QUALITATIVE_BOUND` and the
record lists which choices are unverified.

---

## 2. No resolved game is currently eligible

Every one of the five bounded-pilot goals fails Gate A, and so does the corpus. So does **every
single contract on its own, and every pair of contracts** — the search was exhaustive over both.

The blocking check is uniformly `GA-NO-FAILED-LINE`. The smallest failure count from any single
contract is 5 (`NEUTRAL-PLAYER-CONDITION`); the smallest game form is 8 (`GF2`).

The 57 unestablished lines on the corpus, by verdict:

| | |
|---|---|
| `NOT_AUTHORED` | **54** |
| `UNRESOLVED` (internal) | **3** |

And by what the knowledge actually declared on the row:

| | |
|---|---|
| a `NOT_AUTHORED` declaration reaches the row — an object says it needs this and cannot author it | **43** |
| an `EXCLUDED` declaration reaches it | 8 |
| only `NON_CLAIMED` reaches it — an object looked and does not constrain the row | 4 |
| no declaration reaches the row at all | 2 |

So the distance to a first realizable game is **authoring**, not engine work. Even if a declared
exclusion and a declared non-claim were both ruled not to be failures, 45 lines would remain.

---

## 3. Two losses the realization layer found in the resolved game

Both were invisible until something consumed the object.

### 3.1 Elements with nothing derived were dropped from the game entirely

Element entries were only ever created while placing a **derived** value. An element whose every
line was open or failed therefore appeared in `open` and `notEstablished` and **nowhere in `game`**.

On the corpus that dropped two elements the knowledge individuates: an object (`GF4:I02`, whose
`kind` is an open choice between `goal` and `target`), and **the region the Variable Target
condition establishes** (`VARTARGET-05.a`). The game did not say "nothing about this region is
established"; it said there was no such region.

Fixed: elements are seeded from every enumerated line. Two counts — `elements` and
`elementsWithNothingEstablished` — make a future drop visible rather than silent.

### 3.2 Three reason codes cannot express five declarations

`AM-23` gives three reason codes. The declaration vocabulary has five. In `reasonFor`:

- `NON_CLAIMED` has no case and falls through to `coverage`;
- `EXCLUDED` is tested *after* `UNDECLARED`, so a silence outranks an explicit exclusion.

Result: **11 of 57** unestablished lines report `coverage` — *"nobody looked"* — when an object did
look and declared either that it does not constrain the row or that it excludes it.

**Neither the codes nor the precedence has been changed.** Both are semantic and neither is mine to
rule on. What is fixed is the loss: the declarations reaching a row now travel with the line
(`NotEstablished.declared`), so a reason code can never again be the only surviving account of what
the knowledge said.

---

## 4. Contract coverage, recalculated with the Practice Situation bridge in place

`npm run corpus:coverage`. A Practice Situation is now a selected knowledge object, so it needs a
contract like any other.

**Bounded attacking family** (A01, A04, A05, TA01, TA02) — 14 distinct objects, 4 contracted:

| | |
|---|---|
| ignoring the coach's situation choice | **5** to author |
| with every situation a coach may actually pick | **10** to author |

The five additional objects are exactly the uncontracted Practice Situations: `A01-01`, `A01-03`,
`A01-04`, `TA01-01`, `TA02-01`. The other five are constraints.

Worth noting: **A04 and A05 offer no Practice Situations at all**, so for those two goals the coach
makes no situation choice and the bridge costs nothing.

**All guided goals** (9 with situations) — 41 distinct objects, 6 contracted, **35 to author**, of
which 19 are Practice Situations.

---

## 5. Returned for ruling — not resolved by interpretation

### 5.1 Variable Target: `FIRST_FORWARD_PASS`

The `trigger` vocabulary (v1, draft) has eight members: `START`, `SCORE`, `OUT_END_LINE`,
`OUT_TOUCHLINE`, `POSSESSION_CHANGE`, `REGION_ENTRY`, `TIME_EXPIRY`, `STANDING`.

**Minimal proposal:** one member, `FIRST_FORWARD_PASS`, vocabulary v1 → v2. Nothing else changes.

**Intended boundary, stated so it cannot quietly widen:**

- it is an **event in play**, like `POSSESSION_CHANGE` — not a restart like `START`;
- *forward* is relative to the passing team's attacking direction, which the representation now
  establishes (SD-95; `GA-DIRECTION` passes on the corpus and on all five pilot goals). Where
  direction is `FREE`, the trigger is **not evaluable** and its line should be CONDITIONAL, not
  failed;
- *first* is per episode, using the episode boundary transitions already carry (`startsEpisode`);
- it says nothing about pass success, receiver, distance or intent, and must not be read as doing so.

**What it does not fix:** it is one of three unregistered members on `VARTARGET-05.b`. `COACH_CUE`
is held, as instructed. The third is below.

### 5.2 Variable Target: the compound member, and why a qualifier slot alone will not fix it

The member is `REGION_ENTRY {attacking half} + first receiver`. It states a trigger, a region
qualifier, **and a second qualifier the representation cannot carry.**

The instruction was not to create a compound trigger to hide the missing qualifier capability. The
same instruction, applied one level further, is why I am not proposing the obvious refinement on its
own. There are two tiers here and only the first is small:

**(a) Structural — small and mechanical.** Information-rule triggers have no qualifier rows.
Transitions already do (`T1a` lastTouch, `T1b` endLine, `T1c` region). The refinement is to give the
information-rule trigger the same qualifier shape the transition trigger already has. The register
today permits exactly one qualifier per trigger, described in prose
(`triggerQualifiers: { REGION_ENTRY: "a region reference (T1c)", TIME_EXPIRY: "a time-window reference" }`).

**(b) Semantic — not small, and (a) does not touch it.** *"First receiver"* names a **performer
role**, and the representation has no performer-role vocabulary. `P4` is explicitly free
(*"roles, rotation and substitution entirely free"*). Even with (a) in place, this member still
could not be represented.

**So my recommendation is to implement neither yet.** Adding a qualifier slot would look like
progress while leaving the member exactly as unrepresentable as it is now — which is the same
concealment the compound trigger would have performed, one layer down. The ruling needed is whether
a performer-role vocabulary is in scope at all; if it is not, this member should be withdrawn from
`VARTARGET-05.b` rather than carried as a permitted alternative nothing can realize.

### 5.3 Variable Target, third edge: a class that can hold nothing

`VARTARGET-08.a` individuates an element class on row `J11a`
(`objectiveSets[].assignmentRule[on]`) and produces **zero lines**, because `J11a` has no FIELD row
of its own: its only child, `J11b` (`.yields`), records `ownerRow: J5`.

So the assignment rule exists as a class and can carry no value. Whether `J11b` should be owned by
`J11a` rather than `J5` is a register question I have not answered. Recorded, not acted on.

### 5.4 The neutrals count carries two bounds and neither can be checked

`performers.neutrals.count` (`P5`, `valueType: integer`) is open, and both bounds on it are typed
`QUALITATIVE`:

- `">= 1 (no authored maximum)"`
- `"1-2 (one or two)"`

Both state numbers. Because they are typed qualitative, SD-15 applies and the realization layer
records any chosen value as unverified rather than checking it against a range it can plainly read.
Whether these should be `COUNT` bounds — and, if so, whether their intersection (1–2) is the
operative one — is a ruling, not a parse.

### 5.5 A data inconsistency, minor but load-bearing later

Three transitions carry `startsEpisode: "true"` (string) and one carries `startsEpisode: true`
(boolean). Harmless now; not harmless once anything branches on it.

---

## 6. Affordance lenses

Recommendation: **keep them outside the Game Representation.** They carry no structural claim — the
fields are about perception (`contextualAudit: "Avoid forcing forward passes or direction of play"`;
`description` is about what the player perceives). Contracting them would have the deterministic
representation manufacturing an affordance, which is the thing to avoid.

Measured reach, so the recommendation is not just a preference:

- lens weights are `lensArchetypeAffordanceMatch: 8`, `lensPhaseGameTemplateAnchor: 2`,
  `constraintTargetMatchesSelectedLens: 10`;
- zeroing all three: **the game form never changes (0 of 13)**; constraints change in **7 of 13**;
- **19 of 39 selected lenses are realized by no selected constraint.** Only TD01 and TD02 are fully
  realized; A03 and A06 have none.

The invariant worth adopting instead of a contract: **a selected lens must be realized by at least
one selected constraint, or it is not selected.** It currently fails on 19 of 39, which is the
honest measure of how far the lens layer is from meaning anything causally.

---

## 7. What is next, in order

1. The 43 lines that objects declare they need and cannot author — authoring work.
2. A ruling on 5.1–5.4.
3. The reason-code and precedence question in §3.2.
4. Wide Zone `S6` collisions remain on the task register, not pursued.
