# Phase B, cluster 4 — rederived under SD-88 and SD-89

27 September 2026. Both rulings applied; the rederived state below is read from the emitted result.

**The headline is not the conditional mechanism, which went in cleanly. It is what the rederivation
found underneath it: the goal kick's team was already answered, by a different contract, in a
different designation — and authoring your fact beside it produced the corpus's first genuine
collision.**

---

## 1. SD-88 — the conditional mechanism

Applied as ruled: where a conditional line's governing property is authoritatively resolved, the
applicability condition is evaluated. True keeps the line and the verdict its own contributions earn;
false **withdraws** it as not applicable, never `NOT_AUTHORED`.

The distinction you drew is held in the code, not only in the comment: **the evaluator reads a
governing value and never supplies one.** A governing line that is FREE, failed, or derived-but-
valueless is not evaluated, and the valueless case is reported as a stop rather than absorbed.

| | before | after |
|---|---|---|
| conditional lines | 16 | **0** |
| withdrawn (not applicable) | 0 | **12** |
| enumerated (judged) | 137 | **141** |

The twelve withdrawn lines are `T2`–`T5` on the three `CONTINUE` transitions — GF4, GF2 and Neutral
Player. A continuing transition has no restart to award, take or place, so those lines are not gaps
anybody owes; they simply do not apply. The four judged lines are the goal kick's.

### Regression coverage, and its subject

Four tests, one per demonstration you asked for. **None of them uses a transition.** Three run on
consequences (`V11`/`V13`/`V14a-c`, the Interaction Rules area) and one on a Space row given an
applicability entry the canonical register does not carry — because a mechanism demonstrated only
where it was noticed is not a mechanism.

| Demonstration | How it is shown |
|---|---|
| a resolved governing value causes evaluation | `V13 = ACCESS` resolves; `V14a`/`V14b` become judged, `V14c` (COUNT_CHANGE only) is withdrawn |
| an unresolved governing value does not | with `V13` unauthored the dependents are gaps and **none is withdrawn** — "unknown" is never read as "false"; with `V13` FREE the dependent stays conditional |
| evaluation cannot supply the governing value | a governing line derived by a route carrying no value leaves the condition unevaluated and records the stop; classification writes nothing back into the derived records; an applicable line nothing authored is `NOT_AUTHORED` |
| the mechanism is general | a Space row made conditional on another Space row behaves identically, and `classify.ts` is asserted to name no register row at all |

All four bite: each fails when the mechanism it covers is disabled.

### One consequence worth naming

`GA-TRANSITION-COHERENCE` stopped failing. That is not an improvement — it is the same lapse seen from
the other side. The clause *"a STOP_RESUME transition carries a taker and a region"* had been reporting
a **violation** on lines the engine had never judged. Judged, those lines are knowledge gaps, and a gap
blocks a clause rather than failing it (SD-28, SD-62). The clause is now `NOT_EVALUABLE`, blocked on the
two gap lines, which is what was true all along.

A second, smaller thing was corrected while it was visible: the check carried **one** blocked flag for
**two** clauses, so a blocked resume clause made the CONTINUE clause report `not evaluable` although it
had been examined against three real instances and found no violation. Bookkeeping, not semantics; the
categories SD-65 preserves are now per clause.

---

## 2. SD-89 — restart ownership, and what it met

Authored as you wrote it, kept separate from the trigger, and mapped to the already-registered
designation `DEFENDING_TEAM`. Nothing was added to the vocabulary.

**`T2` did not resolve. It collided.**

| Contribution | Value | Basis | Source |
|---|---|---|---|
| `restated:A01-02::A01-02-05.a` | `DEFENDING_TEAM` | AUTHORED | your ruling of 27 September |
| `restated:GF2::GF2-16.a` | `NOT_LAST_TOUCH` | AUTHORED | *"Restart conditions: ball out of play restarts from the team that didn't touch it last."* — soccer-module GF2 setup guidance |

GF2's item selects `trigger ∈ {OUT_END_LINE, OUT_TOUCHLINE}`. **Your cluster 3 trigger is what brought
it onto this element** — before the goal kick had a trigger, GF2's restart rule could not reach it. So
the same ruling that cleared eight reference defects also routed a second authored contract onto this
line, and nothing looked until SD-88 made the line judgeable.

### Why the engine will not reconcile them

On this element the two designations **denote the same team**: the trigger records last touch as
`ATTACKING_TEAM`, so "not last touch" is the defending team. They agree in fact and differ in
expression. Three things stop the engine acting on that:

- **RC-22**, in the register itself: *"Two designations are equal only if they map to one entry."*
  `DEFENDING_TEAM` and `NOT_LAST_TOUCH` are two entries of the canonical list.
- **SD-02**: *"No universal precedence hierarchy. Reconcile only where an authored ownership or
  relationship rule permits it; otherwise fail loudly."* One contribution is `REQUIRED_RANGE`, the other
  `PREFERRED_DEFAULT`, and no rule says the first outranks the second.
- **Stage 7**, relationships, is deliberately unbuilt (SD-64).

So the line is `UNRESOLVED`, both contributors preserved, no value emitted. Nothing downstream can read
either designation as the answer.

### The route the specification already half-describes

§3 carries a sentence that bears directly on this and has never been implemented:

> **Adaptation is not support.** When a PREFERRED_DEFAULT contribution is displaced … the displacement
> is recorded as an `ADAPTED` disposition on that contribution in Gate B, citing SD-08. It is not
> recorded on the property.

`ADAPTED` is in the closed forward-result vocabulary. **The engine has never produced one**, because no
corpus case had ever displaced a default until now. Read that way, GF2's default is displaced by your
required fact, `T2` resolves to `DEFENDING_TEAM`, and GF2-16.a is reported as adapted rather than as a
colliding contributor.

**I have not implemented it.** What counts as "displaced" is not established — displaced by any
differing entailment, or only by a `REQUIRED_RANGE` one? — and reading SD-08 as a precedence rule is
exactly what SD-02 forbids me to decide. Your instruction stands: if applying a ruling exposes another
semantic dependency, stop there.

### The ruling required, and it is one of three

> **Is a `PREFERRED_DEFAULT` contribution displaced by a `REQUIRED_RANGE` contribution on the same
> line — recorded as `ADAPTED` on the contribution, with the property taking the required value — or is
> this a genuine collision needing an authored relationship rule?**

Three ways out, with different reach. I am not choosing between them.

| | What it does | Reach (SD-81) |
|---|---|---|
| **A. Implement `ADAPTED`** | completes a disposition §3 already specifies; `T2` = `DEFENDING_TEAM` | **general** — every PREFERRED_DEFAULT in the corpus, and every future one |
| **B. An authored equality between the two designations on this element** | says what is true: given the trigger's qualifiers, `NOT_LAST_TOUCH` is `DEFENDING_TEAM` here | **area-reusable** — team designations, and it needs the relationship layer (stage 7) |
| **C. Withdraw the ownership fact** | GF2 already answers `T2` authoritatively, in a designation the trigger makes correct | **local** — this one fact |

Option C is worth stating plainly because it may be the one you want: **before SD-89, `T2` resolved.**
GF2 answered it. Your fact is not wrong and not redundant in meaning — it is the Laws' rule rather than
one game form's convention, and it should survive if GF2 is ever replaced — but on today's corpus it
adds a second way of saying something already said.

---

## 3. What was deliberately not done

**`T3` and `T4` were not restated.** Your permission was conditional — *"If that establishes `T2`
through the existing representation, allow `T3` and the team component of `T4` to derive from `T2`"* —
and `T2` is not established. Both items are untouched, still `ASSUMED`, still referring to *"the team in
this element's T2"*. When `T2` settles, they follow without further authoring.

**L3 is untouched and open.** No `end` region was added, no half substituted, nothing in the
representation altered to make `own end` fit. The rederivation revealed no existing authoritative
answer for it.

**A second lapsed stop of the same shape, reported not fixed.** `derive.ts` refuses to evaluate any
citable standing decision carrying a condition on another line's derived value, for the reason
*"increment 2 derives no transition values"* — the same sentence, in a different place. The only such
decision is SD-13, whose condition the register states exactly (*"SD-13 fires only when T5 for the START
element is DERIVED as STATIONARY_BALL"*), and the corpus holds no START element, so **nothing in today's
run changes either way.** That makes it a calm one to rule on rather than an urgent one. It is a
standing decision's condition, not a line's applicability — a different register construct — so SD-88
does not reach it.

---

## 4. The rederived state

| | before this round | after |
|---|---|---|
| lines | 153 | 153 |
| enumerated · conditional · withdrawn | 137 · 16 · 0 | 141 · 0 · 12 |
| derived | 34 | 34 |
| failed | 93 | **97** |
| open | 10 | 10 |
| collisions | 0 | **1** |
| reference defects | 0 | 0 |

**The count rose by four and that is the accounting, not a regression.** Sixteen lines were judged for
the first time: twelve turned out not to apply, and four are the goal kick's, of which three were always
unauthored and one is now the collision. As with cluster 3's rise from ninety to ninety-three, the number
moved because the picture became more accurate.

Gate A still fails, on `GA-INFORMATION`, `GA-NO-FAILED-LINE` and `GA-TRIGGER-UNIQUE`.

---

## 5. Reach of the corrections (SD-81)

| Correction | Reach |
|---|---|
| Conditional applicability evaluation (SD-88) | **A general derivation-composition rule.** It reads the register's applicability block and names no row; 16 lines today, every conditional row in the register in principle |
| Per-clause gate blocking | **Reusable within gate reporting** — one flag per clause, not per check |
| Restart ownership (SD-89) | **Local to that knowledge** — one fact, one contract |
| The collision it exposed | **Not yet classified, because the ruling decides it**: option A is general, option B is area-reusable, option C is local |

---

## 6. Pilot boundary (SD-82) — and your question about the remaining population

You asked whether the remainder keeps exposing general deterministic defects or increasingly consists of
bounded knowledge and realization questions. Here is the census rather than an impression.

**97 failed lines, by why they failed:**

| | |
|---|---|
| declared gap — an object said it needs this and cannot author it | **64** |
| coverage — nobody examined the row | **31** |
| unresolved — two authoritative contributions disagree | **1** |
| excluded | 1 |

**95 of 97 are missing authored knowledge, not mechanism.** That is the strongest signal yet in the
direction you anticipated.

**By what the missing knowledge is about:**

| Rows | Lines | What the question actually is |
|---|---|---|
| `S5` `S6` `O4` `O5` | **20** | *where a region or object sits* — an interval along or across the axis |
| `S3` `S4` | 11 | what a region is called, and what it is for |
| `O2` `O3` | 10 | what objects exist, and how many |
| `T1a` `T1b` `T1c` | 12 | a transition's qualifiers: whose end line, whose last touch, which region |
| `J2` `J4` | 8 | what an objective refers to, and whether it is the primary scoring one |

**The twenty placement lines are the same question as L3, twenty times over.** Whether a restart is
placed by reference to an end or a half, where the channel sits across the axis, how far along the
axis the target zone begins — these are not questions our register can settle by further reasoning.
They are realization decisions, and watching a coach set up and run the thing would inform them faster
than we can argue about them.

**My reading, stated as a judgement rather than a measurement.** The mechanism work is not finished —
this round found two lapsed stops of the same shape and an unimplemented disposition, and two of the
last four clusters began looking local and turned out general. But the *shape* of the remainder has
changed. The next cluster, if it is drawn from the placement rows, would be the first where I expect
internal diagnosis to teach us less than observation would.

I am not recommending the pilot opens. I am recording that the door you asked me to watch is further
open than it was last week, and that the population now has a named, countable region of it —
twenty lines — rather than a single item.
