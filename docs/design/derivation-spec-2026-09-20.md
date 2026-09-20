# Derivation specification — version 1, with Christian's adopted rulings

20 September 2026. Paper only: no implementation, no generation. This is the derivation half of the
Game Representation Specification: how support is derived from contracts, what verdict each property
gets, and what each contract item is reported as.

It supersedes the run conventions used during the conformance check
(`docs/audits/conformance/derivation-rules-2026-09-18.md`), which were provisional. Where Christian
ruled on 19 and 20 September, his ruling is the rule, quoted.

**Two things are flagged for him** rather than decided here:
- **AM-05's cardinality flag** (§4.3). His rule needs something the grammar does not hold today.
- **One item-result label** (§7). Neither "adapted" nor "inert" fits one case his AM-06 ruling creates.

**Not in scope:** the engine that applies these rules. He directed that the collision test runs first.

## 1. The unit of judgement

One line per (element, row), and one per member for set- and list-valued rows. An assignment rule gives
one line per key. A property the game needs but leaves unstated is listed with its verdict. Forward
results — a required item unmet, an exclusion breached, a bound breached — are a separate list (§7),
never a property's verdict.

**Views get no line at all** (AM-07, adopted): the direction view and the implicit halves and thirds are
computed, and items on them are checked in the forward direction only.

## 2. Verdicts

Every line gets exactly one verdict. Take the first that applies:

| Verdict | When |
|---|---|
| `UNRESOLVED` | two support-capable, in-scope items collide on the line and no authored rule decides it (§6) |
| `FREE(b)` | "long kick" or "controlled on arrival" (SD-15), and no other term |
| `RESOLVED:ENTAILED` | an entailing source supports it (§4) |
| `NOT_AUTHORED(reason)` | required but unauthored; reason codes below |
| `FREE(a)` | the authored source leaves the quantity to the coach and the game states the range |
| `RESOLVED:NARROWED_CHOICE` | a legitimate free choice (§5) |
| `INVENTED` | stated with no valid support (§4.4) |

**Reason codes, in this order** (AM-23): start procedure, post-score, out-of-play source missing; then
alternatives, outside boundary, engine-only, assumed-only, each only where such an item bears on the
value; then declared gap; then coverage.

Existence and value are judged separately. A field of an element whose existence is neither entailed
nor a legitimate choice may still be entailed or not authored, but never a choice or free.

## 3. What can support

| Item | Treatment |
|---|---|
| `EXCLUSION` strictness | never supports; checked only as an exclusion |
| `REQUIRED`, `SUPPORTING` | support alike; strictness matters in the forward list |
| `TYPICAL_EXAMPLE` | inert: no support, bound or collision |
| `PREFERRED_DEFAULT` | supports its value where the game uses it; where the game departs, it is adapted (SD-08), and the line needs other support |
| `ASSUMED` | a bound only; never entails |
| `ENGINE_ONLY`, `OUTSIDE_BOUNDARY` | inert (SD-21). A partly structural item acts only through its written structural clause |
| `OWNER_RULING` | entails only what the ruling states as a requirement |

**Engine wording is never a source** until Christian authors it (SD-21). The six sentences the
conformance check relied on stay unratified, and "beyond the first defenders" is not promoted into
RPC-001 knowledge.

## 4. Support

### 4.1 Matching

An item reaches a line when its row equals the line's row and the element satisfies its selector.

**Selectors are normalised first (AM-12, adopted).** "Selectors must be normalized into the registered
predicate language before derivation. Unregistered prose selectors match nothing and are reported as
restatement defects. No semantic interpretation during derivation." The elements each selector denotes
are recorded before derivation begins.

**Which line an item reaches on a set-valued row.** §1 gives one line per member, and matching above is
written per element. Nothing said how an item's value set maps onto member lines; the collision test
found two competent readings of that silence. The rule, following AM-11: a value set the source marks
"each" binds the member it names, so such an item reaches the line of that member and no other. An
unmarked set is alternatives and reaches every member line as a bound. An item that names a member the
game does not hold is reported unmet against that member (§7), never as a collision on another member's
line.

**Team designations (AM-01, adopted).** "Use the game's transitions/episode context to resolve
contextual team designations. An episode-scoped designation remains episode-scoped." In a selector, a
designation is met by each team the game's stated transitions make it at some trigger; the build-out
team is the team awarded the start placement (KR-03). In a value, designations compare as canonical
entries, and a game value written "(= entry)" counts as that entry.

### 4.2 Comparison and relation

| Requirement | Passes when | Relation |
|---|---|---|
| `EQUALS` | equal | entails |
| `EXISTS` | present — on a field row, only that the field is present | entails, subject to §4.3 |
| `RANGE`, `COUNT` | inside, at the item's scope | narrows cardinality only (§4.3) |
| `POSITIONED` | the interval satisfies it, by the register's relative terms | narrows |
| `ORIENTED` | the orientation satisfies it | narrows |
| `NOT_EXISTS` | absent | excludes: never supports |

An item that entails an element also entails each attribute its selector fixes with `=` or `∋`; an
attribute given with `∈` is only narrowed.

### 4.3 Cardinality and identity (AM-05, as ruled)

Christian: **"A minimum count entails cardinality, not identity."** "Minimum = 1 cannot entail the first
matching element, but it also cannot entail every matching element merely because two exist. The game
must satisfy the cardinality constraint; the identities of the elements satisfying it must receive
support independently or be selected through an already-authorized free choice." No ordering, and no
all-elements entitlement.

**The rule:**
1. **Cardinality is checked forward, never as a line.** For each existence-type item (`EXISTS`, `COUNT`,
   `RANGE`) the number of elements matching its selector, at its scope, is compared with its bound. The
   result is the item's forward result (§7).
2. **An element's existence is entailed only where it is necessary to the cardinality.** When the number
   of matching elements does not exceed the item's minimum, every matching element is necessary, and
   each is entailed by that item. When more elements match than the minimum, no individual element is
   entailed by it: each needs its own support — an item whose selector reaches that element and no
   other matching element of the surplus — or an authorised free choice under §5, within the bound.
3. **Surplus with neither** is unsupported: `INVENTED`, or `NOT_AUTHORED` where a declaration reaches it
   (§4.4).

This is neither of the readings he rejected. It introduces no ordering, and it does not turn a minimum
into an entitlement for every matching element.

**FLAGGED, as he asked.** The grammar can hold his rule, but only because cardinality is checked as an
item result rather than as a property. There is no row, and no line, that holds "this collection
contains N elements matching P". Two consequences:
- A game cannot state a cardinality as a fact, so a cardinality cannot itself be supported, adapted or
  reported as invented. It is only ever an item's pass or fail.
- The audit therefore shows which elements are unsupported, but never "the count itself is unsupported".

If he wants cardinality to be a first-class property, that is a schema change — a cardinality line per
(collection, selector) — and it needs his ruling before anyone builds it. I am not making it.

### 4.4 A stated value with no support (AM-03, adopted)

In order:
1. **Invented** if an entailing source fixes a different, incompatible value.
2. Otherwise **not authored** if a not-authored or undeclared declaration reaches that element, or an
   assumed item fixes the value under such a declaration.
3. Otherwise **invented**.

Engine-only evidence names a reason code, never the verdict. Christian: "I view this as failure
classification after support derivation, not a change to what support means."

### 4.5 A value the game leaves unstated (AM-08, adopted)

"The support result records the entailed value; separately report that the provisional game omitted
it." The line is entailed; the omission is a forward note.

### 4.6 Standing decisions

Only the citable ids in the register, as typed there. A standing decision's condition is met only by a
value whose own verdict is entailed or a legitimate choice. A default yields only to an item that
constrains the value (AM-09, adopted): "Only items that constrain the value compete with a standing
default or free choice. Existence alone doesn't."

## 5. Free choice

A value is a legitimate choice only when all hold:
1. the row is fillable, and the value is of the kind the register's entry names;
2. the element's existence is entailed or is itself a legitimate choice;
3. the value is inside every in-scope bound;
4. no declaration reaching the element bars it.

**Positions (AM-10, adopted).** "A position may be freely filled within all applicable bounds, authored
or assumed, because its existence is already entailed. Keep the authored-range requirement for freely
chosen counts."

**Undeclared elements bar a choice (AM-04, ruled (b)).** Christian: "Unexamined silence cannot license
a free choice. If no selector-scoped declaration reaches an element, treat that element as undeclared:
it bars free choice, and an unsupported stated value is not authored." He rejected silence-as-permission
"contrary to the non-claim rule", and rejected full element coverage because "it would make contract
authoring dependent on every eventual game instance".

**Alternatives (AM-11, adopted).** "Explicit each means one requirement per member. Otherwise a set
represents alternatives. A game using/restating multiple alternatives has not thereby selected one." On
a fillable row a chosen member is a legitimate choice; on a non-fillable row the line is not authored,
reason alternatives. An authored order is recorded, not applied.

## 6. Scope and collisions

| Scope | Elements in it |
|---|---|
| Per objective set | the set's member objectives and every element they reference (AM-02, adopted) |
| Per team | by the team designation, resolved as in §4.1 |
| Own involvement | the elements entailed by the contract's other-scoped items, fixed before any own-involvement item applies; an item may not use it to reach what it entails itself (AM-13, adopted) |
| Whole game | everything |

Scope spreads a bound across units; it does not create them.

**A collision** is two in-scope, support-capable items on one line that no single value satisfies.
Overlapping bounds intersect and do not collide. Only an authored relationship rule, or SD-06, SD-07 or
SD-08, decides one; otherwise the line is unresolved (SD-02). A displaced preferred default is adapted,
not a collision.

## 7. Forward results (AM-06, as revised)

Christian: a required item with an absent value is unmet; an exclusion whose prohibited value is absent
is satisfied. But **"a supporting/preferred item whose value is absent should not be called 'satisfied
vacuously.' Nothing was realized."** He asked for the result that denotes a permissible preference that
did not survive, "rather than satisfied", to keep Realization ≠ Mention in both directions.

| Case | Result |
|---|---|
| Stated value meets the item | satisfied |
| Stated value breaks the item | violated |
| Required item, value absent or no matching element | unmet |
| Exclusion, prohibited value absent | satisfied |
| Preferred default, value absent or displaced | **adapted** |
| Typical example, or engine-only | **inert** |
| Outside the boundary | not checkable |
| Partly structural | clause checked, with the clause's result |
| Assumed item | checked as a bound |
| Existence-type item | its cardinality check (§4.3) |

**FLAGGED (third).** An absence that §8 records as valid has no verdict in §2's table. Both derivers hit
it and forced a verdict. I propose recording it as `VALID_ABSENCE`, which is a line outcome, not a
support record, and not one of the four statuses.

**FLAGGED (second).** One case has no fitting label: a **supporting** item, not a preferred default and not a
typical example, whose value the game leaves absent. It is not satisfied (nothing was realised), not
adapted (nothing displaced it), and not inert (it is real authored knowledge). I propose a result
`NOT_REALIZED` for it, used only here. That is an addition to the item-result vocabulary in the audit
record, not a new property status and not a change to support. If he prefers "adapted" stretched to
cover it, say so and I will use that instead.

## 8. Closed-world absence (AM-07, as qualified)

Views get no line. For an empty collection or a stated absence, Christian qualified: **"use closed-world
semantics: absence is valid where the schema establishes that no supported contribution entails an
element there. Don't manufacture positive support for absence merely from silence."**

So an absence is recorded as **valid** when no support-capable item entails an element on that row at
that scope, and as **unmet** against each item that does. It is never entailed by silence, and an
absence is never a positive support record.

## 9. Transitions

- **Reachable triggers exist by construction,** and so does every element partitioning a reachable
  trigger by qualifier values (AM-15, adopted). The qualifier values themselves still need support.
- **Continuing play keys on the game's stated play state** (AM-14, adopted). Christian: "If that state
  is itself unsupported or contradicted, Gate B should expose that independently rather than making the
  downstream structure disappear from evaluation." So the restart fields are still judged, and the
  unsupported play state is reported in its own right.
- Where no selected object authors a start or restart: turnovers play on (SD-20); which team starts is
  a free choice (SD-R2); a post-score procedure is necessary but has no universal default (SD-R3); an
  out-of-play restart is not authored, its source visibly missing (PSD-03).

## 10. Known interactions, found by applying these rules

Applying the adopted rules to the slice moved 34 of 210 lines. Three interactions matter more than the
count.

- **AM-13 needs AM-17.** Every one of Wide Zone Advantage's region items is scoped to its own
  involvement, and no item of its at another scope entails a region. Under AM-13 that scope is empty, so
  the contract can no longer reach its own wide channels: ten lines fall to invented or unauthored, and
  nine of its items go unmet. The fix is AM-17's selector attribute (a region's lateral position, with
  touchline identity), which lets those items work at whole-game scope. **AM-13 should not be adopted
  without AM-17.** Christian kept AM-17 as a local amendment; this makes it verdict-relevant, so it is
  his call whether to adopt it now.
- **AM-05 overrides AM-01's worked example.** I told him AM-01 would make the attacking team of Team A's
  north zone entailed. Under his AM-05 ruling it does not: the selector now matches two objectives
  against a minimum of one, so the item entails neither. AM-01 still changes that item's forward result
  from unmet to satisfied. The example I gave was right about the matching and wrong about the verdict.
- **AM-05 bites hardest on objectives.** Four primary scoring objectives match a minimum of one, so none
  is individually entailed; the four target zones' existence moves from entailed to unauthored. This is
  his rule working as intended: the game must satisfy the cardinality, and identity needs its own
  support.

## 11. What is not decided here

- The engine that applies these rules (after the collision test, by his direction).
- Whether cardinality becomes a first-class property (§4.3).
- The one item-result label (§7).
- The closed vocabularies' contents (SD-18).
- The six sentences held in code, to be classified individually after the collision test.
- AM-16 to AM-24 and AM-26 remain local operational amendments "unless one proves to require a
  structural-semantic change during design".
