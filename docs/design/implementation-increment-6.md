# Implementation increment 6 — the modifier-overlap rulings (SD-57 to SD-61)

23 September 2026. **Activity generation remains frozen. No corpus repair has been begun.**

`back/src/system/derivation/{gates,diagnostic}.ts` — **106 tests across the increments**, and the whole
project suite passes. Spec revision 13.

He answers the three questions he asked for directly; this document is the working detail behind them.

---

## 1. Contradictions and new stops

**No contradiction.** The rulings were consistent with the built behaviour in every case, and where they
changed it they made the gate more conservative rather than less.

**One new implementation stop, and it is a record-keeping question rather than a semantic one.**

SD-58 settles the **verdict** for a relationship that cannot be established — `NOT EVALUABLE`, naming the
dependency — and the clause reports exactly that. What it does not settle is the **record**. §3.2 raises
a `GAP` failure at stages 2, 5, 6 and 7; stage 10 is not among them. And the line in question is
typically *derived* — it holds a value, just an open-text one — so no earlier stage raised a gap for it
either. Nothing in `failures` marks the case.

The engine does not mint a stage-10 `GAP` record, because extending §3.2's list is a change to the record
model rather than an implementation detail. The clause blocks either way, so this cannot produce a pass —
it can only leave a thinner audit trail. It is recorded as a stop, and it fires **only** where the case
actually arises: the corpus exercises none, so the corpus run still reports zero stops.

**One decision taken that he should see.** SD-57 is stated for *event* referents. I applied the identity
rule to **region** referents too, because the code had been comparing raw referent values as strings, and
that is precisely "promoting exact open-text equality into canonical identity" — the thing SD-57 forbids —
applied to a row whose values are structural references under SD-32 anyway. It can only withhold a pass,
never grant one. Two existing tests had to be rewritten because their fixtures used `'R-1'` as a
referent, which was never a realistic value.

## 2. Engine and test status

| | |
|---|---|
| Stages built | 0 load · 1 normalise · 2 index · 3 scope · 4 reach · 5 derive · 6 classify · 8 forward · 10 gates · 11 emit |
| Deliberately not built | 7 relationships · 9 candidate checking — not reopened for coverage |
| Tests | **106** across five increment suites |
| Full project suite | passes, exit 0 |
| SD-48 stops on the corpus | **0** |

## 3. What the rulings changed

**SD-57 — identity.** A referent resolves only through a registered structural reference. The engine
reads a reference three ways: it names a class the game holds (identity established, comparison
decidable); it has the form of a class id but names none (a violation the engine *can* establish, so it
fails); or it is open text (no identity, nothing compared).

**SD-58 — an unestablishable relationship is a gap.** `GA-REFERENCE-INTEGRITY` previously **failed** on
any derived reference that did not name a held element, including open text. That was reporting a
violation the engine had no authority to establish. It now blocks and names the line. No collision is
raised anywhere, and gap-before-collision is untouched.

**SD-59 — no alternatives mechanism.** No code. The limitation is recorded as task-register **C7**, with
his wording, and the two GF4 examples are not reinterpreted as one modifier, two coexisting modifiers, or
two the engine must choose between.

**SD-60 — object conditions.** A separate clause, refusing with `CHECK_NOT_EXECUTABLE` when such a
modifier occurs, with the refusal naming the affected lines only. No semantics are specified.

**SD-61 — status.** `GA-MODIFIER-OVERLAP` is now three atomic clauses (region, event, object) per SD-53,
and F2 is no longer described as blocking. The task register and the design package both carried the
"two corpus items" claim; both now record that it was wrong twice — four items, all `event`, and none
reachable.

## 4. The corpus diagnostic

`npm run corpus:diagnostic` renders the emitted result. **It adds no semantics**: it computes nothing,
judges nothing and checks nothing. Every figure is read back out of the `DerivationResult` the engine
already produced, so if a number there is wrong, the engine is wrong — there is nowhere else for it to
come from.

The headline it makes unavoidable, which is the point of SD-54:

| | |
|---|---|
| Clauses **evaluated against real instances** | **2** |
| Clauses passing with **no applicable instances** | **24** |
| Clauses failed | 2 |
| Clauses not evaluable / blocked | 6 |
| Clauses outside the representation | 4 |

Gate A fails. One contract is admitted and seven are refused whole at load — five for the mojibake glyph,
two for `row: "NONE"`. Fifteen lines: six derived (four from the session, two from standing decisions),
nine failed. No collisions.

`GA-MODIFIER-OVERLAP` now passes vacuously on all three clauses, because the corpus instantiates no value
modifier at all — which is exactly his finding that the evidence is real but unreachable.
