# CODEX-TASK — final sweep of the design package against the 21 September rulings

**Type:** read-only audit. **You change nothing.** **Deliverable:** one script and one report.

## 0. Which checkout

Work **only** in `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`, branch
`claude/serene-dewdney-c78e18`. **Not** `C:\challenge-point`, which is stale. Put the output of these in
your report:

```bash
git -C "C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18" rev-parse --abbrev-ref HEAD
git -C "C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18" rev-parse HEAD
```

## 1. Why

The project owner ruled on 21 September (SD-39 to SD-42) and asked for the design package finished
with those rulings, surfacing only: contradictions the rulings introduced; decisions still needed
before implementation; and points where an implementer would have to invent semantics. The package
claims two contradictions (both resolved), one remaining decision, and **no** invention points. **Your
job is to test that claim.** A clean report is only meaningful if you genuinely looked; say what you
checked and how.

## 2. The rulings, in brief

Read them in full in §2 of `docs/design/game-representation-spec-2026-09-18.md` (rows SD-39 to SD-42).
In short:
- **SD-39** — OPEN is an authorized degree of freedom within an already-supported property. It
  supersedes **P-4** and replaces **SD-R2** as the authority. Silence creates no structure.
- **SD-40** — two modes. The candidate game is **evidence, never authority**. A candidate value cannot
  turn OPEN into DERIVED, cure a GAP, supply missing support, satisfy an unsupported dependency, or
  resolve a collision or relationship conflict.
- **SD-41** — comparatives are presently unexercised: zero `COMPARES` items in the corpus.
- **SD-42** — a restricted computation may not create authority or broaden the set of entailed
  elements; divergence is a defect, never a choice of one pass.

## 3. Constraints

Read-only; create only your two files. Report, never repair. Strip the BOM before parsing JSON. Node
only, no network, no new dependencies. **No regex through a Python heredoc.** State the rule you
applied wherever a check needs judgement.

## 4. The checks

### S — stale statements that contradict the new rulings

Search `docs/design/*.md`, `docs/audits/conformance/grammar-sheet-2026-09-18.md` and the register. For
each hit report file, line, text, and whether it is **current** (a live contradiction) or **historical**
(a record of what was once proposed, clearly marked as such). Only current hits are defects.

| # | Look for |
|---|---|
| S1 | P-4 or SD-R2 presented as a **current** authority for a free choice |
| S2 | Any text that lets a candidate value make a line `derived`, supply support, carry `resolvedBy: REALIZATION`, or appear in a `support` list |
| S3 | `RESOLVED:NARROWED_CHOICE` described as a **resolution** verdict rather than a candidate-check outcome |
| S4 | A divergence between restricted and full computation resolved by keeping either result |
| S5 | Comparative or aggregate machinery described as exercised, validated or proven against authored knowledge |
| S6 | Gate B reverse or `INVENTED` described as applying in derivation mode |
| S7 | `NOT_REALIZED` or `VALID_ABSENCE` still described as unapproved proposals |

### P — package internal consistency

In `docs/design/derivation-engine-design-package-2026-09-20.md`:

| # | Check |
|---|---|
| P1 | Every record or field named in §2–§11 is defined in §1 or §3. List any used but never defined |
| P2 | Every refusal kind used anywhere in the package is in §3.3's closed list. List any outside it |
| P3 | Every failure kind used is one of the six in §3.2 |
| P4 | Every stage number cited exists in §2.2's twelve |
| P5 | Each invariant D1–D10 in §9 names something the package defines, so a test could be written against it. List any that cannot be tested from what the package defines |
| P6 | Every design choice in §10 is consistent with the rest of the package. List any §10 says one thing about and another section says another |

### C — coverage of the derivation specification

| # | Check |
|---|---|
| C1 | For each numbered section and subsection of `docs/design/derivation-spec-2026-09-20.md`, name the package stage or section that implements it. **List any rule of the derivation spec with no home in the package** |
| C2 | For each standing decision SD-01 to SD-42 and KR-01 to KR-05 that bears on derivation, name where the package honours it. List any that bears on derivation and has no home |

### I — invention points

The central test. An **invention point** is a place where an implementer, following the package and the
specifications exactly, would still have to decide something the documents do not decide, and where the
package does **not** direct the engine to refuse.

| # | Check |
|---|---|
| I1 | Every enumerated field in the package: is its membership closed and stated? |
| I2 | Every value type: is its representation defined (for example, how an interval, a relative position or a team designation is compared)? |
| I3 | Every place the package or derivation spec says "convention", "my reading", "flagged", "open question", "not named", "unruled", "TBD" or equivalent: is each one either decided, or directed to a named refusal? **List any that is neither** |
| I4 | Every algorithm step in §2.2 and §7: could two careful implementers produce different results from it? Name the step and the two readings |

## 5. What to produce

1. `docs/audits/conformance/final-package-sweep.js`
2. `docs/audits/conformance/final-package-sweep-report.md` — one section per family, each finding with
   file, line, text and what it conflicts with. Head it with the path, the commit and the totals, and a
   one-line verdict on the package's claim: *two contradictions resolved, one decision remaining, no
   invention points.*

## 6. What good looks like

- Current contradictions separated from historical records. A document that says "revision 1 did X;
  corrected" is not a contradiction.
- **I is the family that matters.** Do not settle for keyword search; read the algorithm steps.
- Findings precise enough to act on without re-reading your reasoning.
- `git status` at the end shows only your two new files.

## 7. Do not

Edit any document, the register or any contract. Normalise the mojibake in the contracts file. Implement
any part of the engine.
