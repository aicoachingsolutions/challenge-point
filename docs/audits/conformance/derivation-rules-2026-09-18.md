# Derivation rules — how support is derived, for the conformance check

18 September 2026. For restaters and derivers only; blind contract drafters do not receive this file.
Read with `grammar-sheet-2026-09-18.md` and `register-2026-09-18.json`.

These rules restate revision 4 of the specification (§3, §6 and §8), plus the reading rules the stage A
review found necessary for two readers to reach the same verdicts. Every rule that goes beyond the
specification's text is a numbered run convention (RC). Each one is reported to Christian with whether
it changed a verdict.

## 1. The unit of judgement (RC-15)

One line per (element, row) in the restated game:
- a COLLECTION row gives one **existence** line per element;
- a set- or list-valued row gives one line per member (S4 functions, J7 members, J10 triggers, V5 and
  V8b referents);
- J11a gives one line per assignment key.

A property the game needs but does not state is also listed, with its verdict (normally
`NOT_AUTHORED`). Forward results — a REQUIRED item unmet, an EXCLUSION violated, a bound breached — go
in a separate per-item list (§7), never in a property's verdict.

## 2. Verdicts

Every line gets exactly one verdict. **Take the first one that applies, in this order** (RC-17):

| Verdict | When |
|---|---|
| `UNRESOLVED` | two support-capable, in-scope items collide on the line and no deciding rule settles it (§6) |
| `FREE(b)` | the line is "long kick" or "controlled on arrival" (SD-15) |
| `RESOLVED:ENTAILED` | an ENTAILS source supports it (§3) |
| `NOT_AUTHORED(reason)` | required but unauthored; reason codes below |
| `FREE(a)` | the authored source leaves the quantity to the coach, and the game states the range itself (RC-34) |
| `RESOLVED:NARROWED_CHOICE` | a legitimate free choice (§4) |
| `INVENTED` | present in the game with no valid support. A Gate B reverse outcome, not a status |

**Reason codes for `NOT_AUTHORED`:**

| Code | Meaning |
|---|---|
| `DECLARED_GAP` | the object declares it not authored |
| `START_PROCEDURE` | RC-9 |
| `POST_SCORE` | SD-R3 |
| `OUT_OF_PLAY_SOURCE_MISSING` | PSD-03 |
| `COVERAGE` | a contract never declared the row |
| `ALTERNATIVES` | RC-29 |
| `OUTSIDE_BOUNDARY` | RC-32 |
| `ENGINE_ONLY` | the only evidence is engine wording |
| `ASSUMED_ONLY` | the only evidence is an assumption |

**Existence and value are judged separately.** A field of an element whose existence is neither
`ENTAILED` nor `NARROWED_CHOICE` may still be `ENTAILED` or `NOT_AUTHORED`, but never
`NARROWED_CHOICE` or `FREE` (SD-16).

## 3. Support (specification §3, with RC-1 to RC-4, RC-16 and RC-28 to RC-31)

**Matching (RC-1):**
- An item reaches a line when its row equals the line's row and the element satisfies its selector.
- Selectors are tested on the restated game's **stated** attributes, whatever those attributes' own
  verdicts are.
- A FIELD item whose selector matches no element is met, with nothing to check. If it is REQUIRED, it is
  reported as `UNMET` in the forward list.

**Comparison and relation:**

| Requirement | Passes when | Relation |
|---|---|---|
| `EQUALS` | equal | ENTAILS |
| `EXISTS` | present | ENTAILS (on a FIELD row, only that the field is present, never its value) |
| `RANGE`, `COUNT` | inside, at the item's scope | NARROWS |
| `POSITIONED` | the interval satisfies it, using the register's relative terms (RC-21) | NARROWS |
| `ORIENTED` | the orientation satisfies it | NARROWS (RC-3) |
| `NOT_EXISTS` | absent | EXCLUDES: never supports (RC-3) |

**Which items can support (RC-28, RC-30, RC-31):**

| Item | Treatment |
|---|---|
| `EXCLUSION` strictness | never supports, whatever its kind; checked only as an exclusion |
| `REQUIRED` or `SUPPORTING` strictness | supports alike; strictness matters only in the forward list |
| `TYPICAL_EXAMPLE` | inert: no support, no bound, no collision |
| `PREFERRED_DEFAULT` | supports when the game uses its value. When the game departs from it, it is `ADAPTED` under SD-08 (not a collision), and the line needs other support |
| `ASSUMED` | a bound only. Its value passes as `NARROWED_CHOICE` on a fillable row whose element's existence is entailed; otherwise `INVENTED`, or `NOT_AUTHORED(ASSUMED_ONLY)` where a declaration reaches it |
| `ENGINE_ONLY` and `OUTSIDE_BOUNDARY` | inert: no support, bound, block or collision. A `PARTLY_STRUCTURAL` item acts only through its written structural clause |
| `OWNER_RULING` (RC-4) | entails only what a ruling states as a requirement. KR-02 and KR-03 fix a `PRIMARY_SCORING` objective for the build-out team and its build-out-episode scope. KR-01 fixes a scope only: it never entails a value or an element |

**Existence (RC-2):**
- Only support-capable, non-`ASSUMED` items on the element's **own** COLLECTION row entail that
  element's existence.
- A `COUNT`/`RANGE` entails its **minimum**. Elements above the minimum and inside the maximum are a
  count fill (§4), allowed only on a fillable row.

**Attributes carried by existence (RC-16):** an item that entails an element also entails each
attribute its selector fixes with `=` or `∋`. An attribute given with `∈` is only narrowed.

**Citable standing decisions (RC-36):** only as typed in the register's `citableStandingDecisions`. An
SD's condition is met only by a value whose own verdict is `ENTAILED` or `NARROWED_CHOICE` (RC-24).
The session supports E1–E4 only.

**Reachable triggers (RC-19):**
- The T1 elements for START, POSSESSION_CHANGE, OUT_TOUCHLINE and OUT_END_LINE exist by construction.
  SCORE exists if V0 does. REGION_ENTRY, TIME_EXPIRY and STANDING exist only where authored.
- Their fields still need support.
- Where RC-9, SD-R3 or PSD-03 applies, an unsupported field (T2–T6) is `NOT_AUTHORED` with that reason,
  never `INVENTED`.

**Continuing play (RC-20):** when `playState` is `CONTINUE`, T2–T5 are `N/A`, and no lines are listed
for them.

## 4. Free choice (SD-16, P-4 as mapped in the register, RC-8, RC-18, RC-25, RC-29)

A value is `NARROWED_CHOICE` only when all of the following hold:
1. the row has a `fillable` entry, and the value is of the kind the entry names;
2. the element's existence is `ENTAILED` or `NARROWED_CHOICE`;
3. the value is inside every in-scope NARROWS bound;
4. every contract whose declarations reach the element there declares `NON_CLAIMED`, or holds only
   NARROWS items the value meets.

A `NOT_AUTHORED` or `UNDECLARED` declaration that reaches the element **bars** free choice. The verdict
is then `NOT_AUTHORED` (`DECLARED_GAP` or `COVERAGE`), unless another item entails the value.

**Sets of alternatives (RC-29):**
- A value set of two or more members NARROWS and never ENTAILS.
- On a fillable row, the chosen member is `NARROWED_CHOICE`.
- On a non-fillable row, the verdict is `NOT_AUTHORED(ALTERNATIVES)`, unless a deciding rule or another
  ENTAILS item fixes it.
- An authored order is recorded but not applied: specification §5.8 leaves open how it binds.

**J9 `initialState` is not fillable** for this run (RC-25).

## 5. Scope (RC-23, RC-26)

**Which elements fall in each scope:**

| Scope | Elements in it |
|---|---|
| `PER_OBJECTIVE_SET` | an element is in a set's unit if an objective in J7 references it through J2 |
| `PER_TEAM` | follows the J3, P1 or T2 designation |
| `OWN_INVOLVEMENT` | elements the same contract entails |
| `WHOLE_GAME` | everything |

"In scope" means the selector is satisfied and the element lies in the unit. `COUNT`/`RANGE` on O1 adds
up O3 over the matching elements.

**Scope spreads a bound across units; it does not create them (RC-26, proposal P-11 applied).** A
`PER_X` item entails elements only in units whose own existence is entailed.

## 6. Collisions (SD-02, RC-27)

- **When two items collide.** Two in-scope, support-capable items collide when no single value
  satisfies both. Overlapping bounds are intersected and do not collide.
- **What can decide a collision.** Only these: the relationship rules the contracts list, RR-01, SD-06,
  SD-07 and SD-08. Otherwise the line is `UNRESOLVED`.
- **P-9's run reading (RC-24).** SD-11 and SD-20 yield by their own wording. SD-12, SD-13 or SD-14,
  against a differing support-capable selection item, gives `UNRESOLVED`.

## 7. Per-item forward results (Gate B forward; RC-35)

Every contract item gets one:

| Result | Meaning |
|---|---|
| `SATISFIED` | the game meets it |
| `VIOLATED` | the game breaks it (for an `EXCLUSION`, the forbidden value is present) |
| `UNMET` | a REQUIRED item matching no element |
| `ADAPTED` | a PREFERRED_DEFAULT the game departs from (SD-08) |
| `NOT_CHECKABLE` | `OUTSIDE_BOUNDARY` |
| `CLAUSE_CHECKED` | `PARTLY_STRUCTURAL`; give the clause's result |
| `INERT` | `ENGINE_ONLY`, or `TYPICAL_EXAMPLE` |

## 8. Decisions in force

**General:**
- **SD-06.** Exactly one primary scoring event. A value change only where explicitly authored.
- **SD-10.** "An objective is not removed merely because it is not the primary scoring object when its
  presence remains functionally necessary to the representative game structure." It is not a
  universal requirement to retain every possible objective.
- **SD-11.** The longer dimension is the axis, absent authored or session information to the contrary.
- **SD-13.** Only at a kickoff or stationary-ball START does a player of the starting team step to the
  ball.
- **SD-14.** START, SCORE and POSSESSION_CHANGE each begin a new attacking episode. SD-14 "does not mean
  that every RPC requirement reinitializes whenever a new episode begins".
- **SD-15.** "Long kick" and "controlled on arrival" are FREE qualitative coach judgements. No other
  term is.
- **SD-20.** Turnovers play on: "YES as ordinary/default soccer state unless selected knowledge
  explicitly creates a stoppage/reset consequence."
- **SD-R2.** Which team starts "can remain a permitted free choice unless selected knowledge requires
  otherwise". There is no default start location.
- **SD-R3.** "A valid post-score procedure is necessary", with no universal realization.
- **PSD-03.** The out-of-play restart is ordinary soccer behaviour in substance. Where no selected
  object authors it, its source is visibly missing.
- **SD-21.** Wording held in code is never a source until authored.

**Knowledge rulings (restaters and derivers only):**
- **KR-01.** Variable Target's authored 2–3 range applies per objective set: "a reciprocal game can
  legitimately instantiate 2–3 candidates for each team's objective set."
- **KR-02.** "Do not treat 'the scoring objective is active from the moment that team's attack begins'
  as authored RPC-001 knowledge." RPC-001 requires the representative build-out situation to exist
  from the beginning of the attacking episode, and the scoring objective to function within that
  episode. Christian does not see authored evidence that the identity of a valid scoring target must be
  fixed or knowable at the first instant.
- **KR-03.** "RPC-001's build-out requirement applies to the build-out episode, not automatically to
  every attacking episode in the activity … Returning to a goalkeeper build-out requires an authored
  transition/reset rule; it should not be inferred simply from RPC-001 being selected."

## 9. All run conventions

| Id | Convention |
|---|---|
| RC-1 | Path match: rows equal and the element satisfies the selector (refines §3's "fieldPath equals") |
| RC-2 | Existence entailed only by support-capable, non-`ASSUMED` items on the element's own COLLECTION row; `COUNT`/`RANGE` entails its minimum |
| RC-3 | `ORIENTED` NARROWS; `NOT_EXISTS` EXCLUDES |
| RC-4 | `OWNER_RULING` entails only what the ruling states (P-6 pending) |
| RC-5 | V6 `conditions[].value` is a row, implied by §3 |
| RC-6 | `valueStatus` `N/A` for items with no value |
| RC-7 | Per-row coverage; `CLAIMED` and `NOT_AUTHORED` may coexist |
| RC-8 | The register's `fillable` entries are exhaustive (P-4 applied as mapped) |
| RC-9 | P-2 applied: an unauthored START procedure or post-score restart is `NOT_AUTHORED` |
| RC-10 | Where authored knowledge lives |
| RC-11 | Selector syntax and operators |
| RC-12 | `ENGINE_ONLY` basis |
| RC-13 | Declarations may carry a selector and scope |
| RC-14 | `LOCAL` / `STRUCTURAL` test |
| RC-15 | The unit of judgement |
| RC-16 | Existence carries the attributes a selector fixes with `=` or `∋` |
| RC-17 | One verdict per line; precedence; existence and value judged separately |
| RC-18 | Free-choice permission; `NOT_AUTHORED`/`UNDECLARED` bars it |
| RC-19 | Reachable triggers exist by construction |
| RC-20 | `CONTINUE` makes T2–T5 `N/A` |
| RC-21 | Relative-term tests |
| RC-22 | Canonical team designations |
| RC-23 | Scope membership; `PER_SIDE` not used |
| RC-24 | SD conditions need `ENTAILED`/`NARROWED_CHOICE` values; P-9 run reading |
| RC-25 | J9 not fillable |
| RC-26 | P-11 applied: scope does not create units |
| RC-27 | Collision definition; only listed rules decide |
| RC-28 | Value status and strictness handling |
| RC-29 | Sets of alternatives NARROW; order not applied |
| RC-30 | `ASSUMED` items are bounds only |
| RC-31 | `ENGINE_ONLY` and `OUTSIDE_BOUNDARY` items are inert; `PARTLY_STRUCTURAL` acts through its clause |
| RC-32 | P-5 run label: `NOT_AUTHORED(OUTSIDE_BOUNDARY)` |
| RC-33 | P-10 applied: an off-list authored value is derived as if listed, plus a VOCABULARY entry |
| RC-34 | `FREE(a)` versus `NARROWED_CHOICE`; `FREE(b)` only for the SD-15 terms; any other V6 term is `ENTAILED` if matched verbatim, and a number attached without an authored bound is `INVENTED` |
| RC-35 | Per-item forward results |
| RC-36 | Citable standing decisions only as typed in the register |
