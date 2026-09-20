# Collision rerun — the comparative case, under AM-16 and AM-17

20 September 2026. Paper only; generation and implementation stay frozen. Christian's instruction was
narrow and is the whole scope of this document:

> "Once AM-16 and AM-17 are incorporated, please rerun only this collision case far enough to establish
> that a genuine contradictory comparative relationship becomes visible and reaches the existing
> unresolved/fail path. We don't need another broad replay."

Nothing else was replayed. The first test's finding — that the contradiction was *inexpressible*, so
reconciliation had nothing to expose — is what AM-16 was adopted to fix. This rerun asks only whether
it is now expressible, visible, and routed somewhere that stops a game.

Method: the comparative claims were written under the amended rules, one agent derived the outcome, one
reviewed it adversarially, and a judge decided between them, with every line traced to the register and
the slice game. Evidence: `docs/audits/conformance/stage-f/collision-rerun.json`.

---

## 1. The case

| | Item | Strictness | Basis |
|---|---|---|---|
| Wide Zone Advantage | `WIDEZONE-18` — effectiveValue(regions[lateral=wide]) **>** effectiveValue(regions[lateral=central]) | SUPPORTING | **ASSUMED** |
| Central weighting (hypothetical) | `CW-H-10` — effectiveValue(regions[lateral=central]) **>** effectiveValue(regions[lateral=wide]) | REQUIRED | AUTHORED **(hypothetical)** |

Both are written as relationships, not exclusions, as he directed. Both operands are properties the
game holds. `CW-H-10` remains invented for this test only, from "Scoring in the central corridor is
worth double" — it is not knowledge, must not be cited or promoted, and its real-world twin
(`slot-mechanics-variations.ts`, `coach-voice.ts`) stays inert under SD-21.

**`WIDEZONE-18` is ASSUMED, not authored.** Wide Zone's knowledge says actions through the wide channel
"earn an advantage" and that wide areas "should become more available and more valuable". Neither names
a comparand, and *central* appears nowhere in it. The comparative is my reading of what the object
means, not its words. That matters below.

## 2. What AM-16 bought — the gain is real

**The claim is now expressible and both items surface.** Before AM-16 the requirement kinds were closed
and none was comparative, so Wide Zone's central point simply had no form. It is now written, checked,
and reported.

**Gate B forward does not pass.** `CW-H-10` is REQUIRED and is not satisfied by a property with derived
support; `WIDEZONE-18` is a bound not shown to hold at its scope. Two clauses, two failures. Neither is
quietly satisfied — §4.4 forbids that explicitly.

**The silent-acceptance failure is closed.** This was the first test's most serious finding: name the
central corridor an *additional* referent of the wide modifier and every line read entailed while Wide
Zone's whole point was dead and nothing said so. Under the effective-value reading, that configuration
now gives eff(central) = eff(wide), and both claims demand a strict inequality between equal
quantities — so **both are violated and reported**. The all-green outcome is gone.

**The boundary held.** Both operands reduce to rows the game holds: the primary event's base value
(L161) and the wide modifier's magnitude (L187). No pressure, opportunity, availability, difficulty or
uncertainty appears anywhere in either item.

**AM-17 created nothing, and AM-13 held.** Every region a lateral selector reaches already exists. The
central corridor's existence line stays INVENTED even though the right operand selects it — selection
did not manufacture a wide region, which is exactly what he asked to preserve.

## 3. What it did not do, as run

**The rerun's verdict was PARTLY.** The two comparatives became visible, but as **two unrelated forward
failures in two separate contract entries** — the pair was never named as opposed, and the line never
went UNRESOLVED. The reason was a hole in my own rules, not in his:

- **No rule said which line a `COMPARES` reaches.** §1 gives one line per (element, row). No row holds a
  relationship, and neither §4.2 nor §4.4 mapped a comparison onto a line. So §6, where collisions are
  decided, never ran on the pair at all.
- **"Support-capable" was undefined for bound-only items**, so even on one line it was doubtful whether
  an ASSUMED comparative could collide with anything.
- **"Not evaluable" had no row in §7's table** — visible, but with no gate treatment, so it could be
  reported and still not block.

The crux itself is a single quantity. The wide modifier's magnitude, L187, is `UNSTATED (a multiplier;
size unstated)`. `WIDEZONE-18` reduces to *magnitude > 1* and `CW-H-10` to *magnitude < 1*, on that one
line. The contradiction is genuine and single-line; the machinery just had no way to bring the two
items to it.

## 4. What I changed, and what that is worth

I wrote four rules into the derivation spec and three corrections into the register after the rerun.
**Every one of them is mine, not his, and they are operational under SD-22** — flagged here rather than
folded in silently:

| Fix | Where |
|---|---|
| A `COMPARES` reaches a line: where the comparison reduces to a bound on one property the game holds, that property's line; otherwise its left operand's line; otherwise no line, reported not evaluable | derivation spec §4.4 |
| "Support-capable" for collisions defined as an item that entails or bounds the value, **including an assumed item and a comparative**; inert items never collide | §6 |
| "Not evaluable" given a row in the forward-result table | §7 |
| A `COMPARES` is never written with exclusion strictness — the register and §4.2 had allowed it, contradicting both his instruction and my own grammar sheet | §4.2, register |
| Interval tests written for wide-left, wide-right, wide, central and full-width — four of the five had none, and the one that existed over-matched | register |
| The orientation terms renamed **lengthwise** / **crosswise**, because AM-22's "lateral" (which way an element runs) collided by name with AM-17's lateral position | register |

**A correction to revision 5 of the specification.** I wrote there that AM-17 rescues the two wide
channel existence lines, L21 and L27. It did not. A lateral selector normalised to nothing, because the
values had no interval tests, so those lines stayed INVENTED. With the tests now written the rescue is
**computable in principle and has not been re-derived** — I am not claiming it works, and §10 now says
so.

## 5. Residuals for his ruling

1. **Which line a `COMPARES` reaches.** This is the one thing that stood between the pair and the
   unresolved path. My rule is above; it needs his yes or no, because it decides when two knowledge
   objects are treated as opposed rather than as two separate defects.
2. **The effective-value reading.** "The effective value of a region is the primary event's base value,
   as changed by the magnitude of every value modifier whose referents include that region." Without it
   his own `value(A) > value(B)` example cannot be written at all, because no row holds a region's
   value. Ratify or reject.
3. **Is an ASSUMED item support-capable for collisions?** Wide Zone's comparative is assumed, not
   authored. If assumed items cannot collide, this particular contradiction cannot reach the unresolved
   path no matter what else is fixed — and the wider question is whether an object's evident meaning may
   contradict another object's authored words.
4. **The lateral interval tests and the AM-22 rename** — both written, both mine, both reversible.

**One thing this test cannot settle.** L161, the primary event's base value, carries the entire central
side of both comparisons — a region no modifier names takes the base value. Its only evidence is
RPC-001-20, engine wording, which SD-21 makes inert. The comparison therefore runs against a number the
game states but nothing supports. That is the same gap as sentence 5b in the six-sentence
classification, and it is his to close.

## 6. What remains true from the first test

Unchanged and worth keeping, in his words: **reconciliation can only expose conflicts that have first
been expressed in the grammar.** AM-16 expressed one that was previously inexpressible. It did not, on
its own, make the grammar catch it — that took rules about where a comparison lands, which is a
different kind of question and is his to rule on.
