# Phase B, cluster 4 — the goal kick's team, taker and region

26 September 2026. Analysis only; nothing corrected.

**Your five questions are answered below. But the honest headline is that they were premature, and not
because of anything in the knowledge: there is a general mechanism upstream of them.** The T2, T3 and T4
lines are not failing to resolve — they are never being classified at all.

---

## 0. The general mechanism, which comes first

The register makes T2, T3, T4 and T5 **conditional**: they apply only when the same element's `T6`
(`playState`) is `STOP_RESUME`.

| Row | Applicability |
|---|---|
| `T2` `T3` `T4` `T5` | `{ row: T6, sameElement: true, in: [STOP_RESUME] }` |
| `V14a` `V14b` `V14c` | `{ row: V13, sameElement: true, in: [ACCESS] / [COUNT_CHANGE] / both }` |

**Every one of the corpus's 16 conditional lines has a governing line that is `RESOLVED:ENTAILED`, and
not one of them has been evaluated.** All four transitions — in GF4, A01-02, GF2 and Neutral Player —
have `T6` derived as `STOP_RESUME`, which is exactly the value that makes the conditional rows apply.

The reason is a comment I wrote in increment 3, and it has lapsed:

> *"The engine does not evaluate the condition's value here: increment 3 derives no transition values, so
> the governing value is not available to compare."*

That was true then. **Transition values are derived now** — `T6` resolves on all four elements. The stated
ground for not evaluating no longer holds, and nothing has revisited it.

So before any knowledge question about T2 can be asked, 16 lines need to stop being `CONDITIONAL` and
become classified. Asking why T2 does not resolve is asking about a line the engine has not yet judged.

**This is a general derivation mechanism**, not local knowledge: it governs every conditional row in the
register, in two areas, across four contracts.

---

## Your five questions

### 1. What does the source independently author about the team, taker and restart region?

**Nothing.** The object's only authored text is its name and the Definition *"Restart from goal kicks."*

All three items carry `basis: ASSUMED`, and their own evidence says why:

| Item | Row | Evidence |
|---|---|---|
| `A01-02-05.a` | `T2` | *"Laws meaning (original assumption 1): the team defending that end takes it. The original's reading that 'from' places the restart with that team is **an inference** from 'Restart from goal kicks.'"* |
| `A01-02-11.a` | `T3` | *"Laws meaning (assumption 1)."* |
| `A01-02-07.a` | `T4` | *"Laws meaning (assumption 1)."* The cited EM ontology entries are *"authored in em-schema … but as **general ontology, not about A01-02**"* |

So the team, the taker and the placement all rest on the Laws of the Game, and on **one** assumption — not
on anything this object authors.

### 2. Which registered designations could express those relationships, and with what semantics?

| Designation | Gloss as registered |
|---|---|
| `DEFENDING_TEAM` | *(no gloss)* |
| `ATTACKING_TEAM` | in possession for the episode |
| `LAST_TOUCH` | team that touched the ball last |
| `NOT_LAST_TOUCH` | *(no gloss)* |
| `WON_BALL` / `LOST_BALL` | won / lost possession at the trigger |
| `STARTING_TEAM` · `SCORING_TEAM` · `CONCEDING_TEAM` · `EACH_TEAM` · `TEAM_<id>` · `BUILD_OUT_TEAM` | |

**Two candidates now exist that did not before cluster 3.** The authored trigger puts
`qualifier.endLine = DEFENDING_TEAM` and `qualifier.lastTouch = ATTACKING_TEAM` on this element, so:

- **`DEFENDING_TEAM`** — the team whose end line the trigger itself names;
- **`NOT_LAST_TOUCH`** — not the team that touched last, which the trigger says is the attacking team.

On this element both denote the same team. And the restater said plainly that the trigger was the
blocker: *"With the trigger unauthored, T2 cannot be written as `LAST_TOUCH` or `NOT_LAST_TOUCH`."*
**Cluster 3 removed that blocker.**

### 3. Can either phrase be faithfully restated through existing structure without adding knowledge?

**The phrases, yes. The claims, no — and that distinction is the whole answer.**

*"The team defending the end where the goal kick is placed"* reduces to `DEFENDING_TEAM`, given the
trigger already names that end. *"A player of the team in this element's T2"* is already SD-13's
registered form, *"a player of &lt;team&gt;"*, once the team is a designation.

But restating a phrase does not change an item's **basis**. All three remain `ASSUMED`, and under §3 an
assumption *"is a bound only; never entails"* — under SD-83 it establishes nothing. So the restatement
would make them machine-readable **without making them resolve**.

**What is missing is authoritative knowledge, not vocabulary.** No designation needs adding; no
vocabulary needs broadening.

### 4. Does T2 or another established relationship supply structural identity for the team?

T3 and T4 are **derivative of T2, not independent facts**. Both say *"the team in this element's T2"*, and
07.a's own fit-note is explicit: *"It is the same relation as 05.a, seen from the placement."*

So the chain is `T2 → T3, T4`, and T2 is its only root. T2 is currently `ASSUMED`, so the chain has no
authoritative root at all.

**Unless the trigger supplies it.** `qualifier.endLine = DEFENDING_TEAM` *is* authoritative — you authored
it last week — and it identifies a team on this element structurally. Whether that identification may
serve as T2's team is the precise question below.

### 5. One underlying missing fact, or separate gaps?

**One fact wearing three faces, plus one genuinely separate gap.**

**L2 is one fact.** All three items trace to "original assumption 1", and two of them define themselves by
reference to the third. Authoring the team once resolves all three.

**L3 is separate, and it is about the region rather than the team.** `A01-02-07.a` carries a second marker.
`T4` takes *"a region reference, or 'where the ball went out'"*, and *"own end"* is neither: `SV1` supplies
halves and thirds per team as a **view**, not ends, and no region for an end exists. So even with the team
settled, the placement has nothing to reference. The item's own fit-note says it: *"the object requires no
region (L3)."*

---

## The smallest upstream correction, and the ruling required

**First, and not a knowledge question:** settle whether a conditional line whose governing value is
derived should now be evaluated. Sixteen lines wait on it, and the T2 question cannot be asked until they
are judged. I have not changed it — the increment-3 reasoning was recorded as an SD-48 stop and removing
it is yours.

**Then, the knowledge ruling — and it is a single, narrow one:**

> Does the goal kick's team follow from the trigger you already authored — the team whose end line the
> ball left play over — or is *"the goal kick is awarded to the defending team"* a separate fact
> requiring its own authoring?

If it follows, `T2 = DEFENDING_TEAM` is a restatement and all three items resolve from work already done.
If it is separate, it is one sentence of football knowledge, authored as you authored the trigger, and it
resolves all three the same way.

**Either way, no designation is added, no vocabulary broadened, and no identity inferred.** What I cannot
do is choose between those two readings, because one treats your trigger as carrying the award and the
other does not.

**L3 stays open behind it**: whether a restart placement may reference an end at all, given the
representation holds halves and thirds but not ends.

---

## Reach (SD-81)

**Two corrections, two different reaches, and they must not be conflated.**

| | Reach |
|---|---|
| Conditional-line evaluation | **A general derivation rule** — every conditional row, two areas, four contracts, 16 lines |
| The goal kick's team | **Local to that knowledge** — one fact, one contract, three items |

## Pilot boundary (SD-82)

Still internal, but the case is thinner than last week and worth saying so.

The conditional-line mechanism is unambiguously ours: no coach could tell us that a rule about when a
field applies was never evaluated. The team question is also ours — it is about whether one of our own
authored facts entails another.

**But L3 is the first thing in this corpus that starts to lean the other way.** Whether a restart should
be placed by reference to an *end* rather than a half is a question about what a coach actually does when
setting up a goal kick, and it is the kind of thing watching one would answer faster than reasoning about
our register would. I would not move on it yet — it is one item — but it is the first crack of light
under that door, and I would rather flag it early than discover it late.
