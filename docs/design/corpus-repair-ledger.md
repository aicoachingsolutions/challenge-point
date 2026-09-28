# Corpus repair ledger

24 September 2026. His repair order is upstream-to-downstream: **A** load refusals, then **B** derivation
gaps, then **C** gate blocks, then **D** genuine gate failures. *"Do not repair downstream symptoms while
an upstream refusal prevents the relevant knowledge from reaching them."*

Every repair is classified by his three kinds. **Only the first may proceed without him.**

| Kind | May proceed | Status |
|---|---|---|
| 1. Encoding/data repair restoring already-authored knowledge | yes, where meaning is unambiguous | **done — phase A** |
| 2. Restatement making existing authored meaning machine-expressible | **no — needs a ruling** | 25 items, below |
| 3. Genuinely new knowledge authoring | **no — needs a ruling** | 3 items, below |

**The original artefact `stage-b/contracts.json` is not modified.** The repair is applied on load, is
counted, and is reported in every diagnostic run, so a result always states how much of what it read was
repaired and of which kind.

---

## Phase A, done — one repair, of kind 1

**Defect.** The stage-B corpus was written as UTF-8 and read back as CP1252, so every non-ASCII character
became a run of two or three Latin-1 characters. Six distinct sequences occur: the em dash (144), the
section sign (18), and single occurrences of ≠, ≥, ∈ and →.

**Repair.** The exact inverse of the corruption, in `corpus-repair.ts`: each character is mapped back to
the CP1252 byte it was decoded from and the resulting bytes are decoded as UTF-8. **No character is
special-cased.** A string that does not round-trip cleanly is left untouched, so anything that is not
this specific defect passes through unchanged — a legitimate `café`, a real em dash, plain ASCII.

**Why this is kind 1 and not kind 2.** Nothing is interpreted. The authored text is recovered exactly,
byte for byte, and the operation is reversible. No field changes meaning, no field changes type, and no
judgement is made about what any recovered character signifies.

**Applied.** 339 strings, 680 characters recovered.

**Effect.** Contracts admitted **1 → 3**; lines **15 → 95**; item outcomes exercised **3 → 5** kinds.

| | Before | After |
|---|---|---|
| Contracts admitted / refused | 1 / 7 | **3 / 5** |
| Lines | 15 | **95** |
| Derived | 6 | **15** (9 entailment, 4 session, 2 standing decision) |
| Failed | 9 | **77** |
| Open | 0 | **3** |

Two contracts — `RPC-001` and `VARIABLE-TARGET-CONDITION` — now load with no defect at all.

---

## Phase A, second repair — of kind 2, restatement, ruled 24 September

**Ruling.** He added a contract-level sentinel to the register (version **3**):

> `NO_ROW` — this contribution intentionally makes no claim on a Game Representation property.

It is **not** a new Game Representation row: it creates no property, line, class or element. It is valid
only where the contribution is explicitly classified outside the representation, carries no structural
requirement, and already takes the established outside-representation treatment. And it *"must never be
usable to suppress, bypass or reclassify a structural claim merely because no suitable row exists."*

**Applied.** 20 items restated from `NONE` or an em dash to `NO_ROW`; **0 withheld**.

**How, and why that way.** The twenty are named one by one in `corpus-restatement.ts`, so the change is
auditable rather than inferred by a rule that might drift — *and* every one is re-checked against the
three conditions before it is applied. An item on the list that fails a condition is **not** restated and
is reported. The loader enforces the same conditions independently, so an item cannot reach the engine
through the sentinel while carrying a structural claim. Three tests hold that guard.

The five structural-in-kind items are deliberately **absent** from the list, and a test asserts they stay
absent.

---

## What remains at phase A, and why it is not mine to fix

Five contracts still refuse. The loader stops at the first bad item, so the figures below are the
**complete** set of load-blocking defects, not first failures: 28 across the five.

> **Superseded below for 20 of the 25 items** — they were restated to `NO_ROW` on 24 September. The five
> structural-in-kind items, and everything in "kind 3", remain open. See
> `phase-a-evidence-packet.md` for the full evidence on each.

### Kind 2 — restatement (25 items, 20 now applied)

An item whose `row` names no register row. Two spellings of the same situation, neither registered:
`"NONE"` (19 items) and an em dash (6 items, in `PASS-COMBINATION-GATE`, whose own fit-note says *"the
row and requirement are placeholders"*).

| Contract | Items | Rows |
|---|---|---|
| `restated:GF2` | 8 | `NONE` |
| `blind:GF4` | 7 | `NONE` |
| `blind:PASS-COMBINATION-GATE` | 6 | `—` |
| `restated:NEUTRAL-PLAYER-CONDITION` | 4 | `NONE` |

**They split cleanly, and the split is what matters:**

- **20 are `OUTSIDE_BOUNDARY` with `structuralClause: "none"`.** These are contributions the contract
  deliberately recorded as outside the representation. The engine already has a treatment for such items
  — `NOT_CHECKABLE_OUTSIDE_REPRESENTATION`, counted and never dropped — and they fail only because `row`
  must name a register row. What is missing is a **registered spelling for "no row holds this"**.
- **5 are `STRUCTURAL` or `PARTLY_STRUCTURAL`.** These say the contribution *is* structural but no
  register row holds it — for example *"no register row holds a neutral's participation status"*. Forcing
  these onto a row would be authoring knowledge, not restating it.

This is restatement either way, so it waits.

### Kind 3 — new knowledge authoring (3 items)

A value-modifier magnitude with no authored operation, which SD-30 makes incomplete: *"effective value
is not computable."*

| Contract | Items | Selector |
|---|---|---|
| `restated:WIDE-ZONE-ADVANTAGE` | `WIDEZONE-13.a`, `WIDEZONE-13.b` | `condition.type=region` |
| `blind:GF4` | `I14` | `condition.type=event` |

Authoring the operation is new knowledge. It waits.

---

## What phase A exposed downstream — recorded, not repaired

Bringing real knowledge into the engine made the gate see things it could not see before. **None of this
is touched**: it is phase B and beyond, and his order is upstream first.

- **`GA-ONE-PRIMARY-EVENT` now fails**: three primary events where SD-06 requires exactly one.
- **`GA-INFORMATION` now fails**: one information rule names an unregistered trigger.
- 77 failed lines, 52 by coverage and 23 a declared gap — the shape of phase B.
- 17 blocked gate clauses, each with a structured block record (SD-62) naming its dependency.

*Do not optimize toward making the diagnostic green.* These are recorded so the machine result keeps
representing the canonical knowledge accurately, including its legitimate gaps and refusals.
