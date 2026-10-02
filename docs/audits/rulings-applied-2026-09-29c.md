# The thirteen rulings — what was implemented, and the traces returned

29 September 2026. Stage-B conformance corpus. Coach-facing generation remains frozen.

Reproduce: `npm run corpus:game` · `npm run corpus:unestablished` · `npm run corpus:placement` ·
`npm run lens:trace` · `npm run realize`

| | start of day | now |
|---|---:|---:|
| unestablished lines | 57 | **36** |
| derived | 51 | **54** |
| open for realization | 5 | **14** |
| collisions | 3 | **0** |

Gate A still fails on `GA-INFORMATION` and `GA-NO-FAILED-LINE`. Neither has been relaxed.

---

## 1–4. Pattern 2 implemented, and exactly the nine

**Session envelope (ruling 2).** Marked in the register as data — `outerBound: SESSION_ENVELOPE` on
`S5`, `S6`, `O4`, `O5` — so the engine stays sport-neutral and no row id is hardcoded in it. For
those rows the envelope satisfies SD-50's requirement for a supported choice space.

**AM-04 (ruling 3), narrowed.** It had been a per-row veto: one `UNDECLARED` declaration barred
openness for every element on the row. On the corpus that was a *single* object each time — Variable
Target on `S5`/`S6`, A01-02 on `O4`/`O5` — blocking all thirteen placement lines. Now silence bars
openness only where no authority reaches the property at all. `NOT_AUTHORED` and `EXCLUDED` keep
their own semantics; only bare silence is narrowed.

**Two guards keep the other four out, by rule rather than by name:**

- an element another authored contribution *references* is excluded, because choosing its placement
  would settle whatever points at it (ruling 6);
- a contribution marked `relational` bars per-line openness on the lines it reaches, because a joint
  constraint is not a per-line bound (ruling 5).

**Result: exactly the nine placement-only lines became open.** None of the other four.

| now open | row |
|---|---|
| `objects[GF4:I02].position.across` | O5 |
| `space.regions[GF4:I03].position.across` | S6 |
| `objects[A01-02-08.a].position.across` | O5 |
| `objects[RPC-001-10.a].position.across` | O5 |
| `space.regions[VARTARGET-05.a].position.along` | S5 |
| `space.regions[VARTARGET-05.a].position.across` | S6 |
| `space.regions[WIDEZONE-02.a / -03 / -08.d].position.along` ×3 | S5 |

---

## 5. The relational case — the existing mechanism cannot express it

**Checked first, as instructed.** Two candidates:

- **`relationshipRules`** (on contracts, e.g. `RR-GF4-01`) is a **precedence** mechanism: *"decides X
  against Y, outcome Z"*. It resolves which contribution wins. It cannot state that a set's members
  must differ from one another.
- **`COMPARES` (AM-16)** is closer — it takes no line, and lives in the contribution and
  reconciliation record, which is the right shape. But its form is `{left, operator, right}` over two
  operands. Pairwise distinctness across a set whose members are **not individuated** cannot be
  written as a fixed pair of operands, and enumerating the pairs would require naming candidates
  nothing individuates.

So neither expresses it, and the eight-area representation does not need to change.

**Smallest proposal.** One assertion, on the collection row, in the same place a comparison lives:

> **`DISTINCT_ON`** — over a named set, the members must differ pairwise on a stated list of field
> rows. It takes **no line**; it is held in the contribution and reconciliation record; it entails
> nothing and bounds no individual line. Realization reads it as a **joint validity condition** over
> the placements it chooses.

For the corpus case that is one assertion: *candidates of this objective set must differ pairwise on
`O4` and `O5`.* No metric, no separation distance, no relational geometry — only enough for
realization to know that independently valid placements can be jointly invalid.

Pending that, `VARTARGET-03.a` is marked `relational` (ruling C29b): it bounds nothing, and it bars
per-line placement freedom on the three object lines it reaches. Value, source and provenance are
unchanged. **The flattening is undone without asserting a replacement.**

---

## 6. The target region — trace, and the smallest unresolved decision

What selected knowledge establishes:

| | |
|---|---|
| **the region** `GF2-03.a` | `S5 position.along` **derived**: *"attacking end (of the team J3 names for the objective referencing it; EACH_TEAM if shared): touches an end line, not the interior"* |
| | `S3 noun` **open**, a choice between `zone` and `line` |
| | `S4 functions` fails with reason **`excluded`** — the objective-area function is fixed through GF2-03's own selector (RC-16), not by an item on S4 |
| | `S6 position.across` fails, **bounded** by GF2-05.b: *"extends across the axis: the target lies across the direction of progression"* |
| **the objectives** | `GF2-08.a` — reference → `GF2-03.a` (typed structural ref), team `EACH_TEAM`, role `PRIMARY_SCORING` |
| | `RPC-001-11.a` — reference → the same region, team `BUILD_OUT_TEAM`, role `PRIMARY_SCORING` |
| **the relationship** | fully established: the region **is** the objective referent, for both objectives |
| **direction** | established through `J3` — `EACH_TEAM` and `BUILD_OUT_TEAM` |

So the relationship is not in doubt and the along-position is derived. **What is unresolved is not
where the region is. It is how far it extends.** GF2 says so itself: *"length of a target line;
whether a line or zone spans the full width"* and *"extent of the target feature (depth of a zone)"*.

**The smallest unresolved structural decision: does the target span the full width, or part of it?**
It is structural rather than geometric because it changes what scoring requires. It is also partly
downstream of the still-open `S3` choice — a *line* has no depth, a *zone* does.

Genuinely geometric, once the extent is settled: nothing, for a full-width target; for a partial one,
where within the width it sits.

---

## 7. Pass Combination Gate — one sentence of source, one question

Everything rests on one line of setup guidance:

> *"Coach tracks the count visibly (count out loud or use a counter)."*

| his question | what the source supports |
|---|---|
| what information the players need | **authored** — `PCG-11`: the current connected-pass count of `ATTACKING_TEAM` |
| continuously available, or revealed by an event | **this is the whole question.** `PCG-12` assumed `STANDING` and flagged it: *"Counting out loud could instead be read as a reveal on each completed pass, which is not a listed trigger"* |
| who has access | `PCG-13` assumed `ALL` and flagged it: *"The knowledge names no holder"* |
| does an existing mechanism express it | **yes — no new mechanism is needed** |

Every value the object needs already exists in the library: `IE-D006 TRIGGER_TYPE` offers
`TEAMMATE_ACTION` and `EXTERNAL_SIGNAL`; `IE-D007 REVEAL_TIMING` offers `IMMEDIATE_AFTER_TRIGGER` and
`INTERMITTENT`; `IE-D008 REVEAL_PROGRESSION` offers `GRADUAL` and `REVERSIBLE`; `IE-D011` and
`IE-D013` likewise.

**So the five lines are one authoring question:** *is the count a standing display, or an
event-driven reveal?* Answer it and D006, D007, D008 and D011 all follow; only the access holder
needs a second, smaller answer.

**One representational snag to note.** The declared reason for D008 is *"the count rises gradually,
then resets"* — which is `GRADUAL` **and** `REVERSIBLE`, two values on a single-valued field.

---

## 8. IE-C006 and IE-D006 side by side

They are not alternatives. They are different kinds of thing, which is exactly why the object cannot
choose between them.

| | **IE-C006** | **IE-D006** |
|---|---|---|
| record type | `NONCANONICAL_PRESET` | `DIMENSION_DEFINITION` |
| status | **NONCANONICAL_PRESET** | `RC1_CANDIDATE` |
| predicate | `COMPOSES_DIMENSIONS` | `DIMENSION_OF_DOMAIN` → `IED-002` |
| what it is | a bundle, `VARIABLE_TARGET_MEANING` | one field, `TRIGGER_TYPE` |
| content | *"Revelation state dependency: objective dependent; trigger: state transition or opponent action; reveal progression: immediate or staged."* | 7 allowed values: `ENVIRONMENTAL_EVENT`, `OPPONENT_ACTION`, `TEAMMATE_ACTION`, `OBJECT_EVENT`, `STATE_TRANSITION`, `CONSEQUENCE`, `EXTERNAL_SIGNAL` |
| integrity condition | none | *"The trigger must be detectable and causally connected to the revealed information; external signals require additional scrutiny."* |

**Why the Variable Target object cannot choose.** IE-C006 composes **three** of the five dimensions
the object needs, and two of those three as **alternatives rather than values**:

- `D011` state dependency → `OBJECTIVE_DEPENDENT` — a value;
- `D006` trigger → *"state transition **or** opponent action"* — not a value;
- `D008` progression → *"immediate **or** staged"* — not a value;
- `D007` reveal timing → **absent**, which is precisely what the restatement recorded;
- `D013` access holder → **absent**.

So adopting IE-C006 resolves one field, narrows two, and leaves two untouched — while being
non-canonical. The underlying decision is therefore **not** "C006 or D006", it is:

> Is `IE-C006` promoted to canonical — and if so, does it state *values* for every revelation
> dimension the representation requires — or is a Variable Target object required to state each
> `IE-D0xx` dimension individually?

---

## 9. The goal-kick restart, as one knowledge unit

**Already established** on `A01-02-01.a`:

| | |
|---|---|
| trigger | `OUT_END_LINE` |
| `T1a` last touch | `ATTACKING_TEAM` |
| `T1b` end line | `DEFENDING_TEAM` |
| `T2` awarded to | `DEFENDING_TEAM` |
| `T6` play state | `STOP_RESUME` |
| `T7` starts episode | `true` |

**Genuinely unauthored** — the unit:

| row | question | what the knowledge says |
|---|---|---|
| `T3` | who takes it | RPC-001: *"who restarts"*; GF4: *"The restart actor is not authored (L12)"* |
| `T4` | where | RPC-001: *"from where inside the own half"*; A01-02: *"no goal-area equivalent is authored, and no rule for scaling one to a 40 x 30 m area"* |
| `T5` | how | RPC-001: *"the restart procedure itself"*; GF4: *"'chain into immediate live play' hints at one but does not choose (L19)"* |
| `T1c` | which qualifiers apply to `OUT_END_LINE` | carried forward here, per ruling 1 |

**On `T1c`, the evidence now points one way, and I have not acted on it.** `T4`'s own valueType is
*"region reference, or 'where the ball went out'"*. For `OUT_TOUCHLINE` the restart place **is** where
the ball crossed, so a region qualifier does work. For `OUT_END_LINE` the restart place does not
depend on where it crossed — `T1b` already names whose line, and `T4` names the restart place
independently. That suggests `T1c` does not apply to `OUT_END_LINE`.

The rule was deliberately written wider than that, and it stays wider until you rule, because
narrowing it would make a failing line disappear by my own hand.

**No scaled goal area has been inferred**, and no legacy convention assumed.

---

## 10. Affordance vocabulary

**(a), (b), (c) applied.** `fast_attack` → `attack_quickly`; `regain` → `regain_possession`; the
Space Exploitation lens's category corrected from `"Create Space"` to `"Exploit Space"` so it maps to
`exploit_space`. Space Creation was not touched.

**The causal measurement rerun. Yesterday's 33-of-39 figure is superseded and must not be used** —
it counted 33 realized with 6 *undetermined*, which is a different statement from the one below.

| | |
|---:|---|
| **33** | causally realized by selected structural knowledge |
| **6** | selected but causally unrealized |
| **0** | cannot currently be determined |

19 of the 33 are realized **only** by the game form. The undetermined bucket is empty because the
drift that caused it is gone.

**A correction to my own first pass.** I initially renamed only `archetypes.ts` and
`affordanceLenses.ts`, which are *projections* of `soccer-module.rc1-v3.json`. The module round-trip
test failed and was right to: the source still said `fast_attack`, `regain` and `"Create Space"`.
Renaming in the source moved the figures again — from 34/5/0 to 33/6/0 — because selection is
affordance-weighted, so correcting the vocabulary changed which constraints score highest. **The
figures below are the ones taken after source and projection agree.**

**The six genuinely unrealized are all defensive or defensive-transition goals**, and the cause is
library coverage rather than selection quality:

| goal | lens | wants | why nothing realizes it |
|---|---|---|---|
| D01 | Space Protection | `protect_space` | **no constraint in the library can name it** |
| D01 | Delay or Deny | `delay_or_deny` | a constraint can name it; neither selected one does |
| TD02 | Recovery | `recover_shape` | a constraint can name it; neither selected one does |
| TD02 | Delay or Deny | `delay_or_deny` | as D01 |
| D03 | Delay or Deny | `delay_or_deny` | as D01 |
| D03 | Space Protection | `protect_space` | as D01 |

**(d) A1–A10 — I cannot answer whether they map losslessly, because they are not defined anywhere.**
They appear in `archetypes.csv` as `A1|A2|A6` and in the soccer module as `"A1; A2; A6"`, and there
is no legend in the repository — not in the test library, the soccer module, the ATM workbook or the
knowledge core. The ATM workbook uses a different scheme entirely (`FOI`, `OP`, `SA`, `CIO` against
`GP-001..GP-017`).

So the definitions have to come from the source workbook or from you. **Nothing has been mapped and
the field has not been retired.**

---

## 11–12. Reason codes and the neutral count

**Six-way codes adopted exactly as proposed**, diagnostic only — no verdict and no blocking behaviour
changed. Current corpus distribution:

| count | code |
|---:|---|
| 22 | `declared gap` |
| 8 | `excluded` — **7 of these previously reported as `coverage`** |
| 4 | `not constrained` — all previously `coverage` |
| 2 | `no coverage` |

**Neutral count typed faithfully.** On the SD-86 precedent the number was *moved* out of the prose
rather than inferred: `NEUTRAL-01.a` → floor 1, **no maximum**, REQUIRED; `NEUTRAL-02.a` → 1–2,
kept `SUPPORTING` / `PREFERRED_DEFAULT`. The authored strings are unchanged and carried beside the
typed form.

**One consequence I had to fix in the realization layer.** It enforced *every* count bound, which
would have intersected these two and turned the preferred default into a hard ceiling — the exact
conversion you forbade. Preferred bounds are now carried and offered but never enforced. A test pins
it: a neutral count of 4 is accepted (above the preference, inside the requirement) while 0 is
refused.

---

## 13. Pilot boundary

Run separately once the suite settles; the corpus figures above are the current state. Gate A remains
blocked by `GA-NO-FAILED-LINE` over the remaining 36, and by `GA-INFORMATION` over the two held
trigger members.

---

## 13. The pilot boundary, rerun — and the search can stop

**The nearest bounded-pilot resolved game is A01 + A01-02** (*Play Out from the Back → From Goal
Kicks*), 4 contracts:

| | |
|---|---:|
| lines | 62 |
| derived | 28 |
| open for realization | 7 |
| not established | 20 |
| existential | 3 |
| **collisions** | **0** |

Gate A fails on `GA-NO-FAILED-LINE` only; every other check is `PASS` or `NOT_EVALUABLE`.

**Every one of the 20 blockers, classified by underlying decision rather than failed line.** The
six-way reason codes make the split visible immediately:

| lines | reason code | underlying decision |
|---:|---|---|
| 4 | `declared gap` | **how the connected-pass count is revealed** — one authoring question (§7) |
| 4 | `declared gap` | **the goal-kick restart unit** — who, where, how, plus the `T1c` question (§9) |
| 1 | `declared gap` | **the target's extent** — does it span the full width (§6) |
| 4 | **`excluded`** | region `functions` (`S4`) — the objective-area function is fixed through the selector, RC-16, and an item on `S4` is explicitly excluded |
| 7 | **`not constrained`** | `V17`, `V22`, `O3`, `P5`, `P6a`, `P6b`, `P7` — an object looked and declared it imposes no requirement |

**So the answer to your closing question is yes.** The nine `declared gap` lines are *exactly* the
three coherent knowledge decisions already identified — nothing else is hiding in this game. The
other eleven are lines where the knowledge explicitly said it excludes the property or imposes no
requirement on it, which is the separate ruling you reserved.

**There is nothing left to find by searching.** Three knowledge decisions, one ruling on what
`excluded` and `not constrained` mean for realization, and the small relational-placement question
in §5.

Note that four of the seven `not constrained` lines are the neutral rows (`P5`, `P6a`, `P6b`, `P7`)
in a game that selects no neutral-player knowledge at all — GF2 declares *"performers outside the two
teams are neither authored nor forbidden"*. A game with no neutrals is not an incomplete game.
