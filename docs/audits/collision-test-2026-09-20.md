# Collision test — central weighting against Wide Zone Advantage

20 September 2026. Paper only; generation and implementation stay frozen. Christian directed this test
with a narrow purpose: **"to determine whether the existing contract/reconciliation semantics correctly
expose and handle a genuine collision — not to solve that knowledge collision or reopen the Game
Representation."** It uses the rules he adopted on 19 and 20 September
(`docs/design/derivation-spec-2026-09-20.md`).

Method: one agent prepared the contracts, one derived the outcome, one challenged it adversarially, and
a fourth decided between them. Everything is in
`docs/audits/conformance/stage-f/adopted-rules-delta-and-collision.json`.

## The answer: no

**As authored today, nothing collides — and not because the game is coherent.**
- No item in any of the eight contracts mentions central value at all. The weighting lives only in
  engine code: a slot modifier and its coach sentence, "Points are worth most through the middle, then
  wide, then deep."
- Under SD-21 that wording is inert, but inertness is not what prevents the collision. There is no
  central value line for anything to collide on.
- The central corridor does exist in the slice game. It carries no value, and its lines are unsupported
  today.

**With a central weighting written as if authored, still no collision.** A hypothetical contract was
drafted purely to exercise the machinery, marked so it cannot be mistaken for knowledge. Even then the
two objects never meet:
- A modifier's referents are one line per member. Under AM-11, as Christian adopted it, an item marked
  "each" binds the member it names. Wide Zone's item binds the two channels; the central item binds the
  corridor. They never share a line, so there is nothing to decide.
- The disagreement lands instead in the forward list as two unrelated "unmet" entries — two rows among
  hundreds, with nothing saying the two knowledge objects are opposed.

**The failure mode is silent acceptance, not a false conflict.** Name the corridor an *additional*
referent rather than the sole one and every line reads entailed: the wide channels are supported, the
corridor is supported, and the magnitude takes the only support-capable value. Wide Zone Advantage's
whole point — that wide is worth more than central — is gone, and nothing reports it.

## Why

**The contradiction is comparative, and nothing in the grammar is.** The requirement kinds are closed
and all absolute, per element: equals, range, count, exists, not-exists, positioned, oriented. "Wide is
worth more than central" compares two modifiers. It has no row and no requirement kind — while
`coach-voice.ts` ships that exact comparison to coaches.

**Gate A's overlap rule cannot fire here, and a claim in the specification is wrong because of it.** The
rule needs two modifier elements whose conditions can hold at once. A modifier's only selector attribute
is its condition type, so two contracts' region modifiers collapse into one element and there is nothing
to compare. Revision 5's hostile-case table claims that this rule is what catches "…then wide, then
deep". This was its first test, and it does not. **That claim is corrected.**

**The collision path has never fired at all.** Across 420 line judgements by two derivers there is not
one unresolved verdict, and one collision field, resolved by intersecting bounds. Of eight contracts,
two hold a relationship rule, and neither is on a value row. So for value rows, SD-02's "unless an
authored rule decides it" branch is unreachable: no collision has been produced, and none could be
decided.

## What the test does show works

- **A genuine single-valued collision would surface.** On the modifier's magnitude — one value, two
  support-capable items fixing different numbers — the rules give unresolved, exactly as designed. It
  did not fire only because Wide Zone's three reward options are typical examples, which are inert.
- **The distinction between inert and support-capable held** throughout, and engine wording never
  silently became support.

## Four ways a conflict can hide, found by the test

| Mechanism | Example here |
|---|---|
| Inert | Central weighting is engine wording (SD-21) |
| Assumed | An assumed item bounds but never entails |
| Outside the boundary | A cap on defenders inside the central zone is play |
| **Unplaced** | WIDEZONE-09, the one Wide Zone item about central space, never became an item at all: its "not dominant" requirement had no closed kind. Meanwhile the game's corridor lines cite it as provenance |

The fourth was not on anyone's list before this test.

## Two things I got wrong, corrected

- **My derivation specification had two competent readings** of how an item's value set maps onto member
  lines. Section 1 gives one line per member; section 4.1 matched per element only, and nothing joined
  them. The rule is now written out (§4.1), following AM-11.
- **The specification's claim** that Gate A's overlap rule catches the "deep" tier is unsupported, as
  above.

## The one thing that is Christian's

**May a contract author a comparative value claim?** "Wide is worth more than central" is the knowledge
at stake, and the grammar cannot hold it.

- **If yes:** it needs a row and a requirement kind, and I design it. AM-16, the requirement kind that
  compares one element with another, is the natural home, extended from counts and widths to values.
- **If no:** then mutual exclusion is a contract-authoring duty — Wide Zone would carry an exclusion
  forbidding a competing central value — and I write that into the grammar sheet so contracts are
  authored that way. Wide Zone's own ledger records that it considered an exclusion proxy and declined
  it, though "central" is a registered term and the exclusion was writable.

Everything else above is mine to fix.

## Side notes worth keeping

- The phrase "of this contract", used in four Wide Zone items to scope their referents, is in no
  register list. Both sides of the prepared collision rested on it.
- The slot modifier that carries central weighting is attached to slot 1 of every "Discovering
  Solutions" session regardless of which constraint was selected. A coach running Wide Zone Advantage
  today can be told to go wide and paid to go central, in the same activity.
