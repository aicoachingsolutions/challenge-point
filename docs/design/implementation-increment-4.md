# Implementation increment 4 — stage 10, the gates

22 September 2026. **Activity generation remains frozen.** Stage 10 on top of increments 1–3, against
package revision 5. The first certification.

`back/src/system/derivation/{gates,rational,corpus}.ts`, with 33 further tests — **88 across the four
increments** — and the whole project suite passes.

**Stage 9 (candidate checking) is still not built**: it needs a `CandidateGame` input and none exists.
Gate B reverse is stage 9's remainder step, so it is `NOT_APPLICABLE` in derivation mode — never a
`PASS` it has not earned.

---

## The evidence

| # | Requirement | Evidence |
|---|---|---|
| 1 | Approved semantics implemented | Fifteen checks, the catalogue of §7.2 exactly: ten fully structural, four split under SD-43, one specification gap. `GA-RESIDUAL-SPACE` is absent and a test asserts it stays absent (SD-45) |
| 2 | Expected refusals refuse | `CHECK_NOT_EXECUTABLE` for the modifier-overlap gap, naming only the affected cases; `VALUE_NOT_COMPARABLE` for a dynamic location used geometrically, a relative position whose referent has not resolved, and a bound that is not a linear constraint |
| 3 | Canonical ordering and determinism | Shuffled input produces a byte-identical gate report |
| 4 | No `OPEN` value silently chosen | A check over an open line asks satisfiability and records `pendingOn`; no gate writes a value |
| 5 | No unsupported identity created | A referent names a class; a class whose cardinality admits more than one element does **not** resolve uniquely, and the check says so rather than assuming one |
| 6 | **No failed or gapped input repaired** | **A gapped subject blocks the check; it never fails the game.** Two tests hold it: an unauthored roster gives `NOT_EVALUABLE` naming the line, and a roster that genuinely disagrees gives `FAIL` with nothing blocked |
| 7 | Versions and provenance survive | Carried; every refusal names the lines it affects and carries its open question |

## The rule that matters most, made testable

SD-28's discipline carried into the gate. An engine that reported *"the roster does not add up"* where
nobody authored a roster would be saying something false about the knowledge — the same error as
reporting a collision on an unauthored line.

Two tests hold it from both sides, and a third guards the whole catalogue:

- an unauthored roster → `NOT_EVALUABLE`, with `game::P5` named in `blockedBy`;
- a roster of 4 + 1 + 0 against a session of 99 → `FAIL`, with `blockedBy` empty;
- **no check anywhere returns `PASS` while naming a line it was blocked on**, asserted across both the
  fixtures and the real corpus.

`GA-NO-FAILED-LINE` is the check that owns incompleteness, so the others do not have to invent a verdict
for it. §1.4: *"`failed` is `NOT_AUTHORED` or `UNRESOLVED`."*

## Four clauses that asserted more than the code checked

Found by reading each check's clause text back against its own implementation, which is the audit the
canonical wording invites. This is the defect he identified in `GA-RESIDUAL-SPACE` — *"two claims fused,
and neither belongs here"* — recurring in four more places. A single clause covering several claims
makes a `PASS` assert things nothing examined.

| Check | Claimed | Actually checked | Now |
|---|---|---|---|
| `GA-DIRECTION` | each team attacks an objective; the two objectives lie at opposite ends; nothing changes direction | a broken form of the first only | three clauses, each executed. Ends are compared as exact rationals against the axis; "nothing changes direction" is checked against the effect vocabulary, so adding a direction-changing effect would make it start failing |
| `GA-ONE-PRIMARY-EVENT` | exactly one event; base value numeric; every reference member has a space position | kind and base value only | four clauses. Existence rests on SD-06 where no `V0` item is authored; referent positions are resolved through the element classes |
| `GA-TRIGGER-UNIQUE` | no shared trigger key; **none collides** | key uniqueness only | both clauses; a transition line stage 6 left `UNRESOLVED` now fails the second |
| `GA-EFFECT-TYPED` | the referent "resolves to exactly one element" | that it named a held element | class cardinality is examined: a class admitting more than one element does not resolve uniquely |

## Three defects the work found, all mine

**1. The session's four values were being dropped.** §1.2 calls the envelope "the `SESSION` source" and
§1.4 lists `SESSION` as one of the three routes by which a line is `derived`. Stage 5 consulted the
envelope only to decide whether a line could be *open*, and never took a value from it, so `E1`–`E4` —
players, length, width, duration — came back `NOT_AUTHORED` in every run. This is the project's costliest
recurring failure in a new place: a supplied value silently dropped. **The corpus figures in increment 3
were wrong because of it**, and the corrected counts are below.

A session row with no established envelope field is not guessed: the engine stops and reports it, so a
new `SESSION` row cannot be quietly ignored the way these four were.

**2. A line resolved by a standing decision carried no value.** Stage 5 recorded *which* decisions
applied and not what they supply, so `game::V2` was `RESOLVED` while holding nothing — and §1.4 requires
a value wherever a line is derived. It surfaced as `GA-ONE-PRIMARY-EVENT` failing with *"the base value
is not an exact number"*, which was true of the record and false about the knowledge: SD-25 states 1.
Values are now carried verbatim from the register, and a run-level invariant reports any line that is
`RESOLVED` while holding nothing.

SD-11 states its value as a description — *"the longer envelope dimension"* — rather than a literal. It
is **not** evaluated: nothing establishes how such a description becomes a value, so it is carried as
authored and a consumer needing a number refuses it.

**3. A qualitative range became a numeric bound with nothing in it.** `RANGE`/`COUNT` values were read
for a number wherever one appeared; *"beyond the first defenders"* has none, so it became a `COUNT` bound
with null endpoints — a bound that constrains nothing while still looking numeric. `GA-LAYOUT-FEASIBLE`
would then have certified a layout as feasible while silently ignoring that constraint. §1.9 has a
`QUALITATIVE` kind for exactly this, and SD-15 forbids inventing the number. Found by the test written to
prove the check refuses what it cannot read.

## What the gates do not decide

`GA-MODIFIER-OVERLAP` for `object` and `event` conditions has no authored test. The `region` case
executes; the other two refuse with `CHECK_NOT_EXECUTABLE`, naming only the lines affected and carrying
the open question back. A game using no such modifier is unaffected, and a test asserts that too. **Its
semantics are not invented here** (F2, open).

## One reading §7 does not state

§7.1 gives the verdict rule for a clause outside the representation, and for one with no executable
definition. It does not say what a clause does when the line it needs is a **gap**.

The engine reads it as `NOT_EVALUABLE` with the lines named in `blockedBy`, following §8's rule for the
same situation one stage earlier: *"An unresolvable operand → unmet (required) or not evaluable
(supporting), the dependency a `GAP`."* A `CHECK_NOT_EXECUTABLE` refusal distinguishes the specification
gap from the knowledge gap, which is what the optional `refusalId` on a clause is for.

**Both readings block**, so the choice cannot manufacture a `PASS` — only withhold one. It is recorded as
a stop and carried to him rather than buried.

## The corpus, stages 0–10

The eight restated contracts, run end to end. These figures are asserted in the tests, so they are
reproducible from the repository rather than from a script.

| | |
|---|---|
| Contracts admitted / refused | 1 / 7 |
| Lines | 15 |
| `RESOLVED:ENTAILED` | **6** — *was 2 before the session defect was fixed* |
| `NOT_AUTHORED` | **9** — *was 13* |
| Collisions | 0 |
| Failure records | 7 `LOAD_REFUSAL`, 8 `REFERENCE_DEFECT`, 9 `GAP` |
| **Gate A** | **FAIL** |
| Checks | 9 `PASS`, 4 `NOT_EVALUABLE`, 2 `FAIL` |
| Clauses | 29: 17 `PASS`, 6 `NOT_EVALUABLE`, 4 `NOT_CHECKABLE_OUTSIDE_REPRESENTATION`, 2 `FAIL` |
| `notEstablished` | 4 — one per split check |

The two failures are `GA-NO-FAILED-LINE` (nine unauthored lines) and `GA-REFERENCE-INTEGRITY` (the eight
items selecting on an unregistered attribute). Both are the corpus telling the truth about itself.

**The nine passes are worth reading carefully.** Seven of them pass because the thing they check is not
instantiated at all — no transition, no region, no consequence, no information rule, no objective set, no
time window, no open geometric line. Each says so in its `why`. That is honest — "no two transitions
share a trigger key" is true of a game with no transitions — but it is emptiness, not verification, and
it is that way because seven of eight contracts were refused at load.

## The GAP record increment 3 omitted

§3.2 raises a `GAP` at stages 2, 5, 6 and 7. Increment 3 raised none, so a run could report nine
unauthored lines with **no failure record at all** — and `GA-NO-FAILED-LINE`, which asks exactly that
question, would have certified the corpus vacuously. One gap, one id, one per `NOT_AUTHORED` line, and a
test asserts the two lists are identical.

## What remains

| Stage | State |
|---|---|
| 7 relationships | not built, deliberately — no authored case exists (SD-41) |
| 9 candidate checking | needs a `CandidateGame`; the stage-B game is a hand-derivation worksheet, not an input |
| 11 emit | assembling and stamping the full `DerivationResult` — the last stage |
