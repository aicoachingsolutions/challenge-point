# Implementation increment 3 — classify, forward results

22 September 2026. **Activity generation remains frozen.** Stages 6 and 8 on top of increments 1 and 2,
against package revision 5. The first verdicts.

`back/src/system/derivation/{classify,forward}.ts`, with 17 further tests — **55 across the three
increments**, and the whole project suite passes.

**Stage 7 (relationships) is deliberately not built.** The corpus contains **zero** comparative items
(SD-41), so it would be written against constructed cases only. He ruled the capability is kept and not
expanded until a real authored requirement provides evidence; building it now would be expanding it.

---

## The evidence

| # | Requirement | Evidence |
|---|---|---|
| 1 | Approved semantics implemented | One verdict per line, first that applies; the closed verdict and forward-result vocabularies are asserted, so no result outside them can ever be emitted |
| 2 | Expected refusals refuse | Carried; a collision now also produces a **failure record in its own right**, naming both items, so an audit cannot show a game stopped without showing what stopped it |
| 3 | Canonical ordering and determinism | Shuffled input produces identical verdicts and identical forward results |
| 4 | No `OPEN` value silently chosen | An open line takes a `FREE` verdict and still carries no value; an item reaching it is `PENDING_CHOICE` — waiting on the downstream choice process, not broken |
| 5 | No unsupported identity created | Carried from increment 2 |
| 6 | **No failed or gapped input repaired** | **`gap before collision` (SD-28) is a test**: two items that disagree on a line nothing authored produce `NOT_AUTHORED`, and **no collision record exists**. Only items that actually support a value can collide |
| 7 | Versions and provenance survive | Carried; every collision names the contracts implicated |

## The rule that matters most, made testable

SD-28, in his words: *"unauthored/incomputable dependency → gap first; contradictory authoritative
evaluable claims → unresolved collision."*

Two tests hold it in place from both sides:
- two **engine-only** items that disagree on a row → the line is `NOT_AUTHORED`, no collision is raised;
- two **authored** items that disagree → `UNRESOLVED`, with a collision record naming both.

An engine that reported the first as a disagreement would be saying something false about the
knowledge — that two objects contradict each other where in fact nobody authored anything.

## Two defects the work found, both mine

**1. A count on a field row was read as an existence claim.** The forward stage treated `COUNT` and
`RANGE` as existence requirements wherever they appeared. Existence is a claim on a **collection** row;
the same requirement kinds on a field row — a team's outfield count, a position interval — are ordinary
value requirements. Found because an item on a legitimately open line came back `UNMET` instead of
`PENDING_CHOICE`. Fixed by making the test row-kind aware.

**2. A conditional line whose governing value is derived is still not resolvable here** — reported, not
guessed. The register's governing-line rule says a derived governing value should be *evaluated*, but
increment 3 derives no transition values, so there is nothing to compare against. The line stays
conditional and the case is recorded rather than assumed true or false.

## The corpus, stages 0–8

| | |
|---|---|
| Contracts admitted / refused | 1 / 7 |
| Lines | 15 |
| `NOT_AUTHORED` | 13 |
| `RESOLVED:ENTAILED` | 2 |
| Collisions | **0** |
| Forward: `UNMET` / `INERT` / `SATISFIED` | 7 / 6 / 2 |

Two lines resolve; thirteen are gaps; nothing collides. **Six items are inert** — engine wording that
supports nothing under SD-21, which is the corpus telling the truth about itself rather than the engine
being lenient.

## What remains

| Stage | State |
|---|---|
| 7 relationships | not built, deliberately — no authored case exists (SD-41) |
| 9 candidate checking | needs a `CandidateGame`; the stage-B game is a hand-derivation worksheet, not an input |
| 10 gates | Gate A's ten fully structural checks are implementable now; the four split checks need SD-43's clause-level reporting; two are blocking specification gaps (F1 closed by SD-45, F2 open) |
| 11 emit | assembling and stamping the full `DerivationResult` |
