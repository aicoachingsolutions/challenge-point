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

**And one honest limit on the whole exercise.** Neither item is real. `CW-H-10` is openly hypothetical,
and `WIDEZONE-18` is ASSUMED — Wide Zone's knowledge never says "more than central" in its own words.
So what has been demonstrated is that the *machinery* can carry a contradiction to a decision point,
not that two pieces of authored knowledge contradict each other. That distinction is why residual 3
below is the one that decides whether this class of conflict is ever catchable.

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

### What the fixes actually deliver — checked, not asserted

I did not take my own word for it. The crux was re-derived under the amended text by one agent, attacked
by a second, and decided by a third. **Verdict: partly.**

**On the current text the machinery does reach the unresolved path.** Both comparatives reduce to one
bound each on L187; the bounds are disjoint; §6 makes a comparative and an assumed item support-capable;
both are whole-game; no relationship rule, SD-06, SD-07 or SD-08 reaches a magnitude. So the line is
unresolved under SD-02, with both items also reported not evaluable in the forward list. The lateral
normalisation was re-derived too and now computes: channel-north is wide-left, channel-south wide-right,
the central corridor central, and the three full-width regions are excluded — the over-match is closed.
The contradiction also survives either reading of the magnitude, multiplier or increment.

**What is not established, and I would rather say it than let it pass.**
- **"Genuine" is his word, and it is not met.** `WIDEZONE-18` appears in no contract — Wide Zone's run
  to -17 and stop — and `CW-H-10` is openly fabricated. The pair is one assumption against one
  invention. The machinery can carry a contradiction; two pieces of real knowledge have not been shown
  to contradict each other.
- **The operand form is not licensed** (residual 1 below). If he rules the adopted form only, both items
  become unwritable and the case collapses.
- **Nothing in his rulings says a not-evaluable comparative remains a live bound on its line.** That step
  is my reading, now written down as mine. It alone moves L187 between unresolved and an honest gap.
- **The bound is not computable**, only its disjointness: V9's kind is unfixed, so an engine could report
  the conflict without recording either bound.

**Six defects the check found in the amended text**, five now fixed or flagged in place: "one property
the game holds" was undefined (now: the game has a line for it); §7's rows had no order, so a required
comparative with an absent operand was claimed by two rows (now ordered); §6 and §8 apply different
tests to the same line (flagged, not patched — I have not chosen which gives way); the aggregate form
names no aggregate function (flagged open); and the grammar sheet, which is what a contract writer
actually works from, said nothing about a comparative reaching a line or colliding there — so a writer
could not see that adding one can stop a game. That paragraph is now in it.

**A correction to revision 5 of the specification.** I wrote there that AM-17 rescues the two wide
channel existence lines, L21 and L27. It did not. A lateral selector normalised to nothing, because the
values had no interval tests, so those lines stayed INVENTED. With the tests now written the rescue is
**computable in principle and has not been re-derived** — I am not claiming it works, and §10 now says
so.

## 5. Residuals for his ruling

1. **What may be an operand.** AM-16 as adopted makes each operand a register row plus a selector, and
   **no row holds a region's value** — so his own first example, `value(A) > value(B)`, cannot be
   written in the form he adopted. Either a derived operand is legitimate, or a region's value becomes a
   row. Nothing in this case is well-formed until he answers, which makes this the most load-bearing of
   the six.
2. **The effective-value reading, and the magnitude's kind.** "The effective value of a region is the
   primary event's base value, as changed by the magnitude of every value modifier whose referents
   include that region." Every step here rests on it. And V9 is not fixed as a multiplier or an
   increment, so an engine can establish that two bounds conflict without being able to record either.
3. **Is an ASSUMED item support-capable for collisions?** Wide Zone's comparative is assumed, not
   authored. If assumed items cannot collide, this contradiction cannot reach the unresolved path no
   matter what else is fixed — and the wider question is whether an object's evident meaning may
   contradict another object's authored words.
4. **Which line a `COMPARES` reaches, and whether one that is not evaluable forward still bounds its
   line.** Both rules are mine. The second moves L187 between "two objects disagree" and "nobody
   authored this".
5. **Operational under SD-22, or structural?** SD-22 makes a change structural when it touches "the
   contract grammar, declaration statuses, source kinds, the eight areas, the relationship model, or the
   meaning of support". Mapping a relationship onto a line touches the relationship model; defining
   support-capable touches the meaning of support; a derived operand touches the grammar. I have written
   all three as operational. If he reads any as structural, the conformance check's verdict weakens on
   that point — and I would rather he decided that than have me grade my own work.
6. **Two things the case exposed that nobody has ruled on.**
   - **Does a collision outrank an unauthored gap on the same line?** §2 takes the first verdict that
     applies, so L187 reads "two objects disagree" when the honest state is that nobody authored the
     magnitude — on a line whose element's existence is itself unauthored.
   - **Does anything screen a comparative for whether its knowledge is real?** One invented sentence
     carrying basis AUTHORED was enough to drive a line unresolved, and §6's deciding set cannot unpick
     it. As the rules stand, any modified property can be made unresolved by one fabricated comparative.

Minor and mine: the lateral interval tests and the AM-22 rename, both written and both reversible.

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
