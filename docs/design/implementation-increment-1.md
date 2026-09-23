# Implementation increment 1 — load, normalise, index

22 September 2026. **Activity generation remains frozen.** This is the first code written under his
authorization of 22 September, against package revision 5.

**Scope, as he sequenced it:** stages 0 (load), 1 (normalise) and 2 (index), with the refusal-coverage
tests. Nothing beyond stage 2 is implemented. `back/src/system/derivation/`, five files, with the tests
in the project's suite (`npm test`).

---

## The evidence he asked for

| # | Requirement | Evidence |
|---|---|---|
| 1 | Approved semantics implemented | 22 tests pass. Element **classes** per SD-47, never individuals and never merged; structurally reachable triggers per SD-44; the register read as data, including `ownerRow`, `applicability`, `selectorSyntax` and the versioned vocabularies |
| 2 | Expected refusals refuse | 9 refusal tests: unknown row; the placeholder glyph; a comparative written as an exclusion; a magnitude with no declared operation (SD-30); an unregistered selector attribute (a reference defect, text carried verbatim); a selected object with no admitted contract; and both halts. A load refusal is **per contract** and the run continues |
| 3 | Canonical ordering and determinism | Two runs are byte-identical; a run with contracts and selection **shuffled** produces identical output; lines are ordered by register row ordinal, not by insertion |
| 4 | No `OPEN` value silently chosen | Stages 0–2 derive no values at all, and a test asserts no line carries one. Nothing in these stages can fill a choice |
| 5 | No unsupported identity created | One existence item makes exactly one class; two items with identical selectors make **two** classes, never one; an `IN` selector keeps its whole set and chooses no member; a class carries cardinality, never a list of individuals |
| 6 | No failed or gapped input repaired | A refused contract contributes nothing — not partially loaded; a conditional row is `CONDITIONAL` naming its governing line, never silently withdrawn or marked unauthored |
| 7 | Version and provenance survive | Every result carries the register, vocabulary, derivation-rules, engine, contract and object versions; an unstampable run **halts** rather than emitting an unstamped result (SD-30); each class names the contract item it came from |

## What the engine does on the real corpus

Run over the eight stage-B contracts and the register:

| | |
|---|---|
| Contracts admitted | **1** |
| Contracts refused | **7** |
| Reference defects | **8** |
| Halted | no — the run completes and reports |

**Every refusal traces to a defect already on the task register**, and two counts match it exactly:
the 8 reference defects are the 8 `restart` items of B5, and the load refusals are B2's mojibake and
B4's row-less items. The engine reproduced those counts without being told them, which is the first
independent confirmation of the register's numbers by something other than a reader.

**This is the honest state of the artefacts, not a failure of the engine.** Fail-closed loading is what
he asked for, and the corpus carries known defects that have not been repaired — per his instruction,
they are not repaired to make tests pass.

## One stop-and-report, per SD-48

> "If a stage reaches semantics not explicitly established by the specification, stop that path and
> report it. Do not complete the behavior from developer judgment."

**Set-valued rows.** The package says stage 2 enumerates *one line per member* for a set-valued row —
but the member set is not known until values are derived at stage 5. Increment 1 therefore enumerates
the row **once, with no member**, records a stop, and does not expand it. The expansion point needs
stating in the package: either stage 2 enumerates a single line and stage 5 expands it, or enumeration
moves after derivation. **Not decided here.** A test asserts the stop is recorded rather than the
behaviour guessed.

## One register correction the work exposed

The `vocabularies` block contained `triggerRows` — a list of *which rows use the trigger vocabulary*,
not a list of values — and it carried no version. The engine halted at H2, correctly: a result that
cannot be fully stamped asserts nothing. It is versioned now, and the rule stands unchanged: **every
array in the vocabulary block carries its own version.**

## Files

| File | Contents |
|---|---|
| `types.ts` | the package's records and closed lists; nothing invented |
| `register.ts` | register meta-schema (halt H1), indexing, and the version block (halt H2) |
| `selector.ts` | the selector language: attribute names whole including dots, attributes resolved through `ownerRow` |
| `load.ts` | stage 0, per-contract admission |
| `engine.ts` | stages 0–2 and the result |
| `derivation.unit.ts` | 22 tests, in `npm test` |

## What increment 2 would cover

Stages 3–5: scope (including the restricted pass for own involvement and its divergence check), reach,
and derive — the first stage that produces values, and so the first where `FREE(choice)` and the
open/derived boundary become testable.
