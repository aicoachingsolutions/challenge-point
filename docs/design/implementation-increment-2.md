# Implementation increment 2 — scope, reach, derive

22 September 2026. **Activity generation remains frozen.** Stages 3, 4 and 5 on top of increment 1,
against package revision 5. Still no verdicts: classification is stage 6.

`back/src/system/derivation/{scope,reach,derive}.ts`, with 16 further tests in `npm test` — 38 in total
across the two increments.

---

## The evidence

| # | Requirement | Evidence |
|---|---|---|
| 1 | Approved semantics implemented | An authored `EQUALS` entails; an **assumed** item bounds but never entails; engine wording supports nothing (SD-21); a typical example is inert. Own involvement is fixed by the restricted computation, from that contract's other-scoped items only (SD-42) |
| 2 | Expected refusals refuse | Carried from increment 1; stages 3–5 add no new refusal kind. The two places these stages could have guessed instead **stop and report** (below) |
| 3 | Canonical ordering and determinism | Shuffled contracts and selection produce identical classes, lines, application sets, declarations and derived records |
| 4 | **No `OPEN` value silently chosen** | No code path writes `value` onto an open line, and a test asserts it. More below — this is where the increment found a real defect of mine |
| 5 | No unsupported identity created | Reach is **three-valued**. Where a class's selector neither entails nor contradicts an item's, nothing is derived and the case is reported — the engine does not decide that some elements of a class satisfy it |
| 6 | No failed or gapped input repaired | A refused contract yields no application set; an empty own-involvement scope **keeps its declaration** (SD-31); a contradicted selector simply does not reach |
| 7 | Versions and provenance survive | Carried from increment 1; every derived record names the contract item it came from |

## The defect the corpus found — openness produced by absence

Running stages 0–5 over the real contracts, three lines came back **open**, and one was `game::P5` —
the neutral-player count — in a run where **no contract mentions neutrals at all**.

That is exactly what SD-39 forbids: *"OPEN is not produced by absence of knowledge. The property's
existence and legitimate choice space must already be supported."* My first implementation checked only
that the row had a `fillable` entry and that nothing determined it, which turns silence into a freedom.

**Fixed.** A line may now be open only when:
- its **existence** is supported — by the class that formed it, or, for a game-level row, by the session
  or by something that actually addresses it; and
- its **choice space** is supported. Several register entries bound a choice space *by authored values*
  ("a count inside an authored COUNT/RANGE"; "metres and position inside authored bounds"). With nothing
  authored, the space itself is unsupported, so the line is not open.

After the fix the same corpus run produces **no open lines at all**, which is the honest answer for a
corpus where one contract loads and nothing authors a bound.

## Two stops, under SD-48

**1. Stage 4 — undetermined reach.** The package's reach rule is written for an element: *"an item
reaches a line when its row equals the line's row and the element satisfies its selector."* Under SD-47
an element is a **class**. A class fixes only what its own selector fixes, so another item's selector may
be neither entailed nor contradicted by it — it would constrain *some* elements of the class and not
others. The engine records the case, derives nothing from it, and reports it. It does not decide whether
such an item reaches the class, splits it, or misses.

**2. Stage 5 — a choice space bounded by authored values, with nothing authored.** Not open, per the fix
above. Whether it should instead **refuse** — as an unbounded count fill already does — is not
established by the package. Reported, not chosen.

## What the class model did to the first circularity

Circularity 1 was: own involvement is *the elements entailed by the contract's other-scoped items*, but
entailment is stage 5 and scope is stage 3. Under SD-47 those elements are the **classes** formed from
that contract's other-scoped existence items — which stage 2 already has. The restricted computation is
therefore a subset selection over the contract's own items, and **cannot widen the set by construction**.

The divergence check is kept, because he required it kept. It is worth saying plainly that it can no
longer fail for this circularity: the risk it guarded against was dissolved by his own ruling on element
identity, not ignored.

## The corpus, stages 0–5

| | |
|---|---|
| Contracts admitted / refused | 1 / 7 |
| Lines enumerated | 15 |
| **Declarations preserved** | **107** — including those whose scope resolved empty (SD-31) |
| Lines with entailment | 0 |
| Lines open | 0 |
| Undetermined reaches | 0 |
| Divergences | 0 |

Nothing is derived because one contract loads and its items do not definitely reach the single class
formed. That is the state of the artefacts, not a failure of the stages: the corpus defects are on the
task register and are not repaired to make a run look better.

## What increment 3 would cover

Stage 6 (classify) and stage 8 (forward results) — the first verdicts, where gap-before-collision
(SD-28), the reason codes and `NOT_REALIZED` (SD-46) become testable. Stage 7 (relationships) has
nothing to exercise it in the corpus: **zero `COMPARES` items exist** (SD-41), so it would be built
against constructed cases only.
