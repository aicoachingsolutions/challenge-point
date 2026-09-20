# Contract grammar sheet — for writing contribution contracts

18 September 2026, version 2 (after the stage A review). This sheet is self-contained. It states the
rules a contribution contract follows under revision 4 of the Game Representation Specification. It
contains no worked examples from any existing contract or knowledge object, so a contract can be drafted
from it without seeing how others were drafted. The register of field paths is
`register-2026-09-18.json` in this folder. How support is derived from contracts is in a separate file,
`derivation-rules-2026-09-18.md`, which contract writers do not need.

## 1. What a contract is

A contribution contract says what one selected knowledge object requires, excludes and constrains in a
game, and what it does not claim. It contains:
- **items**;
- **declarations** covering every register row;
- **relationship rules** the object authors, if any.

It holds no coach language and no play-level description. A session emphasis or slot template that
needs structure contributes only through a contract of this same form (SD-17); nothing else enters a
game.

**The boundary.** A contract may say things only about what a coach lays out and what the rules key on.
The following are outside it:
- player movement, tactics and positions during play;
- pressure, opportunity, affordance, uncertainty and representativeness;
- the state of a game in progress.

A requirement about those is still recorded, with checkability `OUTSIDE_BOUNDARY`, and is not forced
onto a row it doesn't fit.

## 2. Paths

A path names one register row, plus a **selector** when the row sits in a collection.

- **Syntax** (RC-11): `<row path>[<selector>]`, for example `<collection>[<attribute>=<value>].<field>`.
- **A selector is a predicate** over the element's own attributes. It may use only the row's
  `selectorAttributes` in the register, with the operators:
  - `=`;
  - `∈ {…}` (set membership);
  - `∋` (contains, for set-valued attributes);
  - `&` (and);
  - `*` (any element).

  An element that lacks an attribute does not satisfy a selector on it.
- **An item on a FIELD row applies to every element that satisfies its selector.**
- **Element existence.** `EXISTS`, `COUNT` or `RANGE` on a COLLECTION row says that elements
  satisfying the selector exist, or how many. `NOT_EXISTS` there forbids them. On a FIELD row, `EXISTS`
  means only that the field is present, never what its value is.
- **Relative values** (a position relative to another element, or a team designation) use the
  register's `relativeTerms` and `teamDesignations`. Name the element referred to. If the referent is
  players or play rather than a game element, the item is `OUTSIDE_BOUNDARY`.

## 3. Item fields

| Field | Values |
|---|---|
| `id` | the contract's own id for the item |
| `row` | a register row id |
| `selector` | a predicate, or `*` |
| `requirement` | closed: `EQUALS`, `RANGE`, `COUNT`, `EXISTS`, `NOT_EXISTS`, `POSITIONED`, `ORIENTED`, `COMPARES` |
| `value` | the required value or bound. A **set of alternatives** is written as a set and marked *ordered* only if the source orders it |
| `strictness` | `REQUIRED`, `SUPPORTING`, `EXCLUSION`. An `EXCLUSION` item's value is the **forbidden** value, whatever its requirement kind |
| `valueStatus` | `REQUIRED_RANGE` (outside is invalid), `PREFERRED_DEFAULT` (use when feasible, adapt to context), `TYPICAL_EXAMPLE` (informative only), or `N/A` when the item carries no value (RC-6) |
| `scope` | `WHOLE_GAME`, `PER_TEAM`, `PER_OBJECTIVE_SET`, `OWN_INVOLVEMENT`. `PER_SIDE` is not used in this run (RC-23) |
| `basis` | `AUTHORED` (quote the knowledge verbatim and give its source id); `ASSUMED` (state the assumption); `OWNER_RULING` (cite the ruling id); or `ENGINE_ONLY` (RC-12) |
| `checkability` | `STRUCTURAL`, `PARTLY_STRUCTURAL` (write out which clause is structural), `OUTSIDE_BOUNDARY` |

**A comparative claim (`COMPARES`, adopted 20 September).** A contract may state a relationship between
two properties the game holds: value(A) greater than value(B), count(A) equal to count(B), width(A)
greater than width(B). Write it as `{ row, selector, operator, rightRow, rightSelector }`, with the
operator from `=`, `≠`, `<`, `≤`, `>`, `≥`.
- Both sides must be properties the resolved game contains and can evaluate. Never an inferred player
  state or ecological outcome: not pressure, opportunity, affordance availability, difficulty or
  uncertainty. A claim about those is recorded `OUTSIDE_BOUNDARY`.
- A comparative narrows; it never entails a value or an element's existence.
- **Do not write a comparative as an exclusion.** "Wide has greater task value than central" is a
  relationship, not "central value is forbidden".

**Selecting an existing element (AM-17).** A region's **lateral** position (wide-left, wide-right, wide,
central, full-width) and a value modifier's **referents** are registered selector attributes, so a
contract can address an existing element from whole-game scope. Selecting never creates: existence still
comes only from an existence item on the collection row.

**Where authored knowledge lives (RC-10):**
- **Authored:** the knowledge workbooks held as data — `sport-module/soccer-module.rc1-v3.json`,
  `sport-module/rpc-library.rc1.json`, `session-planning/session-planning-model.rc1.json`, and
  `knowledge-core/*.json`.
- **Mirrors:** `test-library/archetypes.ts`, `constraints.ts` and `environmental-manipulations.ts` mirror
  that knowledge. Cite the workbook where it carries the same text, and flag any text found only in a
  mirror.
- **Engine wording:** everything else — scoring, activity-building and coach-voice code, services,
  prompts, validators and unit tests. Code, prompts, tests, templates and coach-rule sentences do not
  count as authored knowledge merely because they exist (SD-21). An item whose only evidence is engine
  wording is recorded with `basis: ENGINE_ONLY`. It supports nothing; it is a candidate for
  ratification. Name the sentence and file, so it can be surfaced.

## 4. Declarations covering the register

For **every** register row, including VIEW rows, the contract gives at least one declaration.

| Declaration | Meaning |
|---|---|
| `CLAIMED` | one or more items address this row |
| `EXCLUDED` | an `EXCLUSION` item forbids something on this row |
| `NON_CLAIMED` | the object says nothing about this row and does not constrain it |
| `NOT_AUTHORED` | the object needs this row filled but its knowledge does not author the value. Say what is missing |

- A declaration may carry an optional **selector and scope**, like an item (RC-13). Without one it
  covers every element on the row.
- A row may carry `CLAIMED` and `NOT_AUTHORED` together when it is partly authored (RC-7). Say which
  elements are authored and which are not.
- **Silence is not a declaration.** When restating an older contract, a row it never examined is
  recorded as `UNDECLARED`. That is a gap in the older contract, not a permission.

## 5. Relationship rules

If the object's own knowledge authors a rule that decides between two requirements on one row (for
example, which of several alternatives applies when another object is present), record it as a
relationship rule:

```
{ id, owner, decides: <rows and selectors>, outcome }
```

Quote the knowledge as for an item. Nothing else decides a collision.

## 6. When something will not fit

**Do not repair the grammar.** Record the item as best you can, and add a ledger entry with one class:

| Class | Use when |
|---|---|
| `SCHEMA` | no row, field, requirement kind, selector attribute, relation or declaration can hold it |
| `VOCABULARY` | the row exists, but a draft closed list lacks the value. Still record the value as authored |
| `KNOWLEDGE` | the grammar can hold it, but the knowledge does not author it, is ambiguous, or rests only on engine wording |

For every `SCHEMA` entry, also say `LOCAL` or `STRUCTURAL` (RC-14).

**`LOCAL`** means one of:
- a new row inside an existing area;
- a new field on an existing collection;
- a new COLLECTION row whose existence works like the others;
- a new selector attribute;
- a new requirement kind whose relation is one that already exists (ENTAILS, NARROWS, EXCLUDES, or
  inert).

**`STRUCTURAL`** means one of:
- a new relation;
- a change to how support is derived;
- a new status;
- a new strictness, value-status or basis value;
- a change to the declaration mechanism or the source kinds;
- a ninth area.

A new scope value is `VOCABULARY`.

## 7. Run conventions stated in this sheet

Each of these conventions is reported to Christian for ratification, along with whether it changed any
verdict. The full list, including those about derivation, is in `derivation-rules-2026-09-18.md` §9.

| Id | Convention |
|---|---|
| RC-6 | `valueStatus` is `N/A` for items that carry no value |
| RC-7 | Coverage is per register row; `CLAIMED` and `NOT_AUTHORED` may coexist on a row |
| RC-10 | Where authored knowledge lives (§3) |
| RC-11 | The selector syntax and operators (§2) |
| RC-12 | `ENGINE_ONLY` as a recorded basis that supports nothing (SD-21 applied) |
| RC-13 | Declarations may carry a selector and scope (§4) |
| RC-14 | The `LOCAL` / `STRUCTURAL` test (§6) |
| RC-23 | `PER_SIDE` is not used in this run |
