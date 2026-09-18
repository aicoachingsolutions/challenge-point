# Contract grammar sheet — for writing and reading contribution contracts

18 September 2026. This sheet is self-contained. It states the rules a contribution contract follows
under revision 4 of the Game Representation Specification. It deliberately contains no worked examples
from any existing contract, so that a contract can be drafted from it without seeing how others were
drafted. The register of field paths is `register-2026-09-18.json` in this folder.

## 1. What a contract is

A contribution contract says what one selected knowledge object requires, excludes and constrains in a
game, and what it does not claim. It contains **items**, **non-claim declarations** covering every
register row, and **not-authored declarations**. It holds no coach language and no play-level
description.

**The boundary.** A contract may only say things about what a coach lays out and what the rules key on.
Player movement, tactics, positions during play, pressure, opportunity, affordance, uncertainty,
representativeness and the state of a game in progress are outside it. A requirement about those is
recorded with checkability `OUTSIDE_BOUNDARY`, not forced onto a row.

## 2. Paths

A path names one register row, plus a **selector** when the row sits in a collection.

- **Syntax:** `<row path>[<selector>]`, for example `space.regions[noun=channel].position.across`, or
  `transitions[trigger=OUT_TOUCHLINE].awardedTo`.
- **A selector is a predicate** over the element's own attributes, restricted to the row's
  `selectorAttributes` in the register. Predicates may use `=`, `∈ {…}` (set membership), `∋` (for set
  valued attributes such as `functions`), `&` (and), and `*` (any element).
- **An item on a selector applies to every element that satisfies it.** An item using
  `trigger ∈ {OUT_TOUCHLINE, OUT_END_LINE}` applies to both transitions.
- **Element existence.** An item with requirement `EXISTS`, `COUNT` or `RANGE` on a COLLECTION row says
  that elements satisfying its selector exist, or how many. `NOT_EXISTS` on a COLLECTION row forbids
  them.
- **Relative values are allowed** where the register says so (for example a position "beyond" another
  element, or a team designation such as "the team that did not touch it last"). Name the element or
  designation referred to.

## 3. Item fields

| Field | Values |
|---|---|
| `id` | the contract's own id for the item |
| `row` | a register row id (E1 … V26, SV1, DV1) |
| `selector` | a predicate, or `*` |
| `requirement` | closed: `EQUALS`, `RANGE`, `COUNT`, `EXISTS`, `NOT_EXISTS`, `POSITIONED`, `ORIENTED` |
| `value` | the required value, bound or set; a set of alternatives is marked *ordered* only if the source orders it |
| `strictness` | `REQUIRED`, `SUPPORTING`, `EXCLUSION` |
| `valueStatus` | `REQUIRED_RANGE` (outside is invalid), `PREFERRED_DEFAULT` (use when feasible, adapt to context), `TYPICAL_EXAMPLE` (informative only), or `N/A` when the item carries no value (RC-6) |
| `scope` | `WHOLE_GAME`, `PER_TEAM`, `PER_OBJECTIVE_SET`, `PER_SIDE`, `OWN_INVOLVEMENT` |
| `basis` | `AUTHORED` (quote the knowledge text verbatim and give its source id), `ASSUMED` (state the assumption), or `OWNER_RULING` (cite the ruling id; RC-4) |
| `checkability` | `STRUCTURAL`, `PARTLY_STRUCTURAL` (say which clause is structural), `OUTSIDE_BOUNDARY` |

**Engine wording is never a basis (SD-21).** Code, prompts, tests, templates and coach-rule sentences
do not count as authored knowledge merely because they exist. If the only evidence for an item is such
wording, record the item with `basis: ENGINE_ONLY`. It is a candidate for ratification, and it can
support nothing.

**An `ASSUMED` item can narrow but never entail** (§5).

## 4. Declarations covering the register

For **every** register row, the contract gives at least one declaration:

| Declaration | Meaning |
|---|---|
| `CLAIMED` | one or more items address this row |
| `EXCLUDED` | an `EXCLUSION` item forbids something on this row |
| `NON_CLAIMED` | the object says nothing about this row and does not constrain it |
| `NOT_AUTHORED` | the object needs this row filled but its knowledge does not author the value; say what is missing |

A row may carry `CLAIMED` and `NOT_AUTHORED` together when it is partly authored (RC-7). Silence is not
a declaration: an unexamined row is a contract defect.

## 5. How support is derived

A game property is a value on a row, for one element. A contract item **supports** it only when:
1. the item's row equals the property's row, and the element satisfies the item's selector (RC-1);
2. the value passes the comparison:

| Requirement | Passes when | Relation |
|---|---|---|
| `EQUALS` | the value is equal | ENTAILS |
| `EXISTS` | the element or value is present | ENTAILS |
| `RANGE`, `COUNT` | the value is inside, at the item's scope | NARROWS |
| `POSITIONED` | the position interval satisfies it | NARROWS |
| `ORIENTED` | the orientation satisfies it | NARROWS (RC-3) |
| `NOT_EXISTS` | the value or element is absent | EXCLUDES: never support; checked as an exclusion (RC-3) |

- **`ASSUMED` items only NARROW.** `ENGINE_ONLY` items do nothing.
- **Existence.** A property may exist only if an item that ENTAILS, a citable standing decision, or the
  session entails its existence. For elements this means an `EXISTS`/`COUNT`/`RANGE` item whose
  selector the element satisfies (RC-2).
- **Free choice (SD-16).** A value may be chosen freely only for an element whose existence is already
  entailed, only on rows marked `fillable` in the register (P-4, RC-8), only inside every in-scope
  NARROWS bound, and only where every other in-scope item is a non-claim. A free choice never creates a
  region, object, trigger, consequence, modifier, information rule or other structural property.
- **Citable standing decisions** are listed in the register (`citableStandingDecisions`).

**Per-property verdicts:**

| Verdict | Meaning |
|---|---|
| `ENTAILED` | supported by an ENTAILS item, a citable standing decision or the session |
| `NARROWED_CHOICE` | a legitimate free choice inside NARROWS bounds |
| `FREE` | left to the coach: a quantity inside authored bounds, or "long kick" / "controlled on arrival" (SD-15) |
| `NOT_AUTHORED` | required but unauthored. Mark *source missing: ordinary sport-state knowledge* for an out-of-play restart (PSD-03) |
| `UNRESOLVED` | two items collide on the row with no authored relationship rule |
| `INVENTED` | present in the game with no valid support |

## 6. Decisions in force that bear on derivation

- **SD-20:** on `POSSESSION_CHANGE`, play continues and the team that won the ball plays on, unless
  selected knowledge explicitly creates a stoppage or reset.
- **SD-R2:** which team starts is a free choice unless selected knowledge requires otherwise. There is
  no default start location.
- **SD-R3:** a valid post-score procedure is necessary; there is no universal default for it.
- **PSD-03:** an out-of-play restart that no selected object authors is `NOT_AUTHORED`, source missing.
- **SD-13:** only at a kickoff or stationary-ball START, a player of the starting team steps to the
  ball.
- **SD-14:** START, SCORE and POSSESSION_CHANGE begin an attacking episode. This defines boundaries
  only; it does not reinitialize other requirements.
- **SD-15:** "long kick" and "controlled on arrival" are FREE. No other term is.
- **SD-10:** an objective is not removed merely because it is not the primary scoring object, when its
  presence remains functionally necessary to the representative game structure.
- **KR-01:** Variable Target's 2–3 range applies per objective set.
- **KR-02, KR-03:** RPC-001's scoring objective functions within the build-out episode. Returning to a
  goalkeeper build-out after a turnover needs an authored reset rule.
- **SD-06:** exactly one primary scoring event. A value change only where explicitly authored.

## 7. When something will not fit

**Do not repair the grammar.** Record the item as best you can, and add a ledger entry with one class:

| Class | Use when | Examples of what it means |
|---|---|---|
| `SCHEMA` | there is no row, field, requirement kind, selector attribute, relation or declaration that can hold it | a kind of rule the representation has no place for |
| `VOCABULARY` | the row exists, but a draft closed list lacks the value | a region noun, object kind or trigger not on the draft list |
| `KNOWLEDGE` | the grammar can hold it, but the knowledge does not author it, is ambiguous, or rests only on engine wording | a missing magnitude, an unauthored restart |

For `SCHEMA` entries, also say whether it looks `LOCAL` or `STRUCTURAL`:
- **`LOCAL`:** absorbable as a new row inside an existing area, a new field on an existing collection, a
  new selector attribute, or a new requirement kind with a stated relation. It leaves how support,
  statuses, non-claims and the gates work unchanged.
- **`STRUCTURAL`:** it would change how support is derived, the set of statuses, the non-claim
  mechanism, the source kinds, or would need a ninth area.

## 8. Run conventions

Revision 4 leaves these points implicit. They are fixed here so that two readers apply the same rules,
and each is reported for Christian's ratification together with whether it changed any verdict.

| Id | Convention |
|---|---|
| RC-1 | A path matches when rows are equal and the element satisfies the selector. This refines §3's "fieldPath equals the property's path" |
| RC-2 | Element existence is entailed by an `EXISTS`, `COUNT` or `RANGE` item whose selector the element satisfies |
| RC-3 | `ORIENTED` NARROWS; `NOT_EXISTS` EXCLUDES and never supports |
| RC-4 | `OWNER_RULING` (KR-01 to KR-03) may entail, pending proposal P-6 |
| RC-5 | `conditions[].value` (V6) is a row, implied by §3's statuses though not named in §5.8 |
| RC-6 | `valueStatus` is `N/A` for items that carry no value |
| RC-7 | Coverage is per register row; `CLAIMED` and `NOT_AUTHORED` may coexist on a row |
| RC-8 | The fillable rows are proposal P-4's list, used as it stands |
| RC-9 | Proposal P-2 is applied: an unauthored START procedure or post-score restart is `NOT_AUTHORED` |
