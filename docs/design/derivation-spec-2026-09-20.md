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
| `INVENTED` | stated with no valid support (§4.6) |

**Reason codes, in this order** (AM-23): start procedure, post-score, out-of-play source missing; then
alternatives, outside boundary, engine-only, assumed-only, each only where such an item bears on the
value; then declared gap; then coverage.

**The last two need definitions the order does not supply**, and every derivation so far has used the
same working convention rather than a stated rule: **declared gap** where a `NOT_AUTHORED` declaration
reaches the element — an object said it needs this and cannot author it; **coverage** where only an
`UNDECLARED` row reaches it — nobody looked. The distinction matters because one is knowledge missing
and the other is a contract that never examined the row. *(Convention, not his ruling. Flagged.)*

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

**Open: nothing normalises a reference held in an item's *value*.** AM-12 governs selectors, and the
team-designation sentence above is the only rule for the value side. But items also carry values that
*refer* to elements — "both wide channels of this contract", a region reference on a start placement, a
referent list on a value modifier. Matching those is verbatim (§4.2), so a paraphrase misses and a
prose reference matches nothing, silently. This was the weakest joint in the rederivation, and it is a
genuine hole rather than a flagged preference: either the value side gets AM-12's treatment — normalise
to registered element ids, and an unnormalisable reference is a restatement defect, reported — or
contract authors must write element ids in values, which the grammar sheet does not currently say.
**I recommend the first**, and have not applied it.

### 4.2 Comparison and relation

| Requirement | Passes when | Relation |
|---|---|---|
| `EQUALS` | equal | entails |
| `EXISTS` | present — on a field row, only that the field is present | entails, subject to §4.3 |
| `RANGE`, `COUNT` | inside, at the item's scope | narrows cardinality only (§4.3) |
| `POSITIONED` | the interval satisfies it, by the register's relative terms | narrows |
| `ORIENTED` | the orientation satisfies it | narrows |
| `NOT_EXISTS` | absent | excludes: never supports |
| `COMPARES` | the comparison holds between its two operands | **takes no line** (SD-26): evaluated over its operands, never a bound on a property. **Never an exclusion:** a comparative is a relationship, not a prohibition [C20] |

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
   (§4.6).

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

### 4.4 Comparative claims (AM-16 as extended, adopted 20 September)

Christian: **"A contract may author a comparative claim between represented game properties."** The
examples he gave: value(A) > value(B), count(A) = count(B), width(A) > width(B).

**All of his 20 September rulings are incorporated below.** Where an earlier draft of this section held
a rule of mine, his ruling replaces it and the replacement is marked.

**Form.** A `COMPARES` item names a left operand, an operator from `=`, `≠`, `<`, `≤`, `>`, `≥`, and a
right operand.

**What may be an operand (SD-23, his ruling).** Either:
- **a represented game property** — a register row plus a selector; or
- **a deterministically derived quantity whose inputs are supported represented game properties.**

Two limits come with it, in his words:
- **"Do not add region value as a stored Game Representation row merely to support this case."** The
  derived quantity is computed for the comparison; it is not stored, and it is not a ninth thing the
  game holds.
- **"A derived quantity may compute relationships among represented environmental properties. It may
  not derive learner/ecological states such as pressure, opportunity, affordance availability,
  difficulty or uncertainty."**

**Its inputs must be supported, not merely stated.** A derived quantity computed from a property the
game states but nothing supports is not computable. This is what his word *supported* does, and it
bites: before he adopted SD-25, the primary event's base value rested only on engine wording, so no
region's effective value could be computed at all.

**Aggregates.** A comparison may range over selector-matched elements, but **no aggregate function is
named** (each, some, the sum, the greatest). Where a selector matches several elements whose values
differ, the rules do not say what the operand is. Still open; it did not bite in the worked case only
because both matching regions carry the same modifier.

**Relation.** It narrows. **It never entails a value, and it never entails existence.** A comparison
constrains a relationship between properties that other items or the session must establish. It is
**never written with exclusion strictness**: a comparative is a relationship, not a prohibition.

**Where a comparison lands (SD-26, his ruling — this replaces my rule).** I had a comparison reduce to a
bound and reach one operand's property line. He ruled against that:

> "Do not force a comparative relationship onto one operand's ordinary property line. The comparison is
> a relationship assertion evaluated over its operands. It may remain outside the eight stored Game
> Representation areas as part of contribution/reconciliation evaluation."

So:
1. A comparison is **evaluated over its operands**, in the contribution and reconciliation record. It
   is not a line, it does not take a property's verdict, and it changes no line's status.
2. **If its operands cannot be resolved or computed, the comparison is not evaluable or unmet,
   according to its requirement status** — required items unmet, supporting items not evaluable.
3. **If two authoritative, well-formed comparative requirements are mutually incompatible, report an
   unresolved relationship conflict** (§6.1). That is a report of its own kind, not a line status.
4. **No ninth Game Representation area is authorized**, and none is added.

*Why this is better than my rule: a relationship is not a property, and forcing it onto a property's
line made an unauthored magnitude read as "two objects disagree" when nobody had authored it at all.
His §6 ordering — gap before collision — falls out of this naturally.*

**The boundary.** Both operands must be properties the resolved game contains and can evaluate.
Christian: not "inferred player states or ecological outcomes such as pressure, opportunity, affordance
availability, difficulty, uncertainty". The test he gave: **"whether the comparison is between
properties the resolved game actually contains and can evaluate."** An item comparing anything else is
recorded outside the boundary, not forced onto a row.

**Evaluability.** A comparison is evaluable only when both operands resolve — to a value the game holds
and supports, or to a derived quantity whose inputs the game holds and supports. Otherwise it is
reported unmet or not evaluable by its requirement status, per his ruling above. It is never quietly
satisfied.

**Effective value (SD-24, his provisional definition).** In his words:

> "primary-event base value after application of all applicable resolved value modifiers for the
> referent."

With the two conditions he attached:
- **"A value modifier must explicitly declare its operation/type. Do not infer multiplier versus
  increment."** The register gains one field for this (`V9a`, the modifier's operation), and `V9`
  remains its magnitude. This is the only addition his rulings make to the representation, and it is a
  new field on an existing collection — LOCAL by the grammar sheet's own test.
- **"If an operation or magnitude required for the derivation is unauthored, effective value is not
  computable."**

**What that does to the worked case.** The wide modifier's magnitude is unstated and its operation was
never declared, so effective value is **not computable** on either side; the comparison is not
evaluable; and under §6 the line is a **gap**, not a collision. His rulings resolve the rerun's crux in
the opposite direction from my rule, and they are right: nobody authored that magnitude.

**A consequence of adding `V9a` that has to be carried through.** §1 requires that a property the game
needs but leaves unstated is listed with its verdict. So **every value modifier now gains a `V9a`
line**, and in the slice game that line is `NOT_AUTHORED` — no object declares an operation anywhere.
Without it, "effective value is not computable" would be true for a reason the audit records nowhere.
Games resolved before 20 September are short one line per modifier, and their audits do not mean what
they say until they are re-derived against the current register.

**A comparative is not an exclusion.** Christian: "I do not want Wide Zone's comparative meaning
translated into mutual exclusions. 'Wide has greater task value than central' is a relationship, not
equivalent to 'central value is forbidden.'" A contract states the relationship; the reconciler does not
convert it into a prohibition, and a checker does not read it as one.

**The principle behind the boundary**, in his words: preserve the distinction between *changing the
relative value or availability of possibilities in the environment* and *prescribing the learner's
solution*. "The representation may deterministically specify the former; it should not infer or encode
the latter."

### 4.5 Selecting an existing element (AM-17, adopted)

A region's **lateral position** is a registered selector attribute, so a contract can select regions
from whole-game scope instead of relying on its own involvement. A value modifier's **referents** are
likewise selectable, so one contract's region modifier can be addressed apart from another's.

**Selection does not entail existence** (AM-13 preserved). Christian: "AM-17 may identify an
already-supported region; it must not create a wide region merely because a contract selects for one."
So a lateral selector identifies; existence still comes only from an existence-type item on the
collection row, judged by §4.3's necessity rule.

**His governing principle, restated 20 September:** *"selection may identify supported existing
structure; it does not entail that structure's existence."* The word **supported** is doing work: a
selector reaches an element the game holds, and whether that element is itself supported is a separate
question with its own verdict. Selecting an unsupported element neither supports it nor is barred by
its being unsupported — the selector simply inherits the weakness, and any derived quantity computed
from it is **not computable** under SD-23.

### 4.6 A stated value with no support (AM-03, adopted)

In order:
1. **Invented** if an entailing source fixes a different, incompatible value.
2. Otherwise **not authored** if a not-authored or undeclared declaration reaches that element, or an
   assumed item fixes the value under such a declaration.
3. Otherwise **invented**.

Engine-only evidence names a reason code, never the verdict. Christian: "I view this as failure
classification after support derivation, not a change to what support means."

### 4.7 A value the game leaves unstated (AM-08, adopted)

"The support result records the entailed value; separately report that the provisional game omitted
it." The line is entailed; the omission is a forward note.

### 4.8 Standing decisions

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

**Open, and it changes verdicts: are own-involvement *declarations* emptied with the items?** AM-13's
restriction is written about items; the scope is defined as a set of elements. Across the eight
contracts, 31 items and **29 declarations** sit at own-involvement scope. Where the scope resolves
empty, the items plainly reach nothing — but if the declarations go with them, a line the object
explicitly declared `NOT_AUTHORED` falls through to **invented** instead of a gap. That is what
happened to Wide Zone's two channel lines.

Two readings, and it is his call:
- **(a) Declarations share the scope.** Consistent, and the current reading. Wide Zone's channels read
  invented.
- **(b) A declaration survives its items.** A declaration is a statement about the contract's own
  knowledge — "I need channels and cannot author them" — not a claim about elements, so an empty scope
  does not falsify it. The lines then read as a declared gap.

**I recommend (b)**, for the reason his SD-28 gives in the neighbouring case: reporting "someone
invented this" when the object actually said "I cannot author this" inverts a gap into a fault. I have
not applied it; the derivations above use (a).
| Whole game | everything |

Scope spreads a bound across units; it does not create them.

**Support-capable**, for collisions, means an item that constrains the value: one that entails it or
bounds it, including an assumed item. Inert items never collide — engine-only, outside the boundary,
and typical examples. Comparatives are no longer in this list: under SD-26 they are evaluated over their
operands and never take a line.

**A collision** is two in-scope, support-capable items on one line that no single value satisfies.
Overlapping bounds intersect and do not collide. Only an authored relationship rule, or SD-06, SD-07 or
SD-08, decides one; otherwise the line is unresolved (SD-02). A displaced preferred default is adapted,
not a collision.

**Gap before collision (SD-28, his ruling).** In his words, a collision "requires well-formed,
support-capable authoritative claims with sufficiently resolved operands/properties". Therefore:

| What is true of the line | What is reported |
|---|---|
| A dependency it needs is unauthored or not computable | **a gap** — and only a gap |
| Contradictory authoritative claims, both evaluable | **an unresolved collision** |

An unauthored or incomputable dependency is a gap **first**, and nothing downstream converts it into a
disagreement. This replaces the precedence problem I flagged after the rerun: `UNRESOLVED` no longer
outranks a gap, because on an unresolved dependency there is nothing to collide.

**An assumed item cannot manufacture a collision (SD-27, his ruling).** In his words:

> "An assumed item may not create an authoritative collision with authored knowledge. If Wide Zone does
> not actually author `wide > central`, we do not promote that interpretation merely because it appears
> consistent with the object's prose meaning. Assumed-vs-authored may be reported diagnostically as a
> possible tension, but it cannot drive UNRESOLVED. If comparative value is truly part of Wide Zone's
> intended canonical meaning, we can author that explicitly later."

So an assumed item still bounds, still reports, and still appears in the audit — as a **possible
tension**, a diagnostic record that no gate reads. Two assumed items, or an assumed against an authored
one, never produce an unresolved verdict.

**This closes the fabricated-comparative problem**, as he intended. A comparative that is invented or
assumed cannot drive any line unresolved, so no single fabricated sentence can stop a game.

### 6.1 Unresolved relationship conflict

A report of its own kind, created by SD-26. It holds: the two comparative requirements, their operands
as resolved, why no single assignment satisfies both, and the objects that authored them.

It is raised **only** when every one of these holds:
1. both requirements are **authoritative** — authored or owner-ruled, never assumed, never engine-only;
2. both are **well-formed** under SD-23's operand rule;
3. both are **evaluable** — every operand, or every input to a derived operand, resolves and is
   supported;
4. no single assignment of the operands satisfies both.

Fail any of 1 to 3 and it is not a conflict: it is a gap, a diagnostic tension, or an unmet item,
whichever applies. **It is not a line status, it is not one of the four Game statuses, and it adds no
area.** The game's eight areas hold what they held before.

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
| Comparative, **required**, whose operands do not resolve or compute | **unmet** (SD-26) |
| Comparative, **supporting**, whose operands do not resolve or compute | **not evaluable** (SD-26) — never quietly satisfied |

**Which of the last two applies is decided by requirement status**, in his words: "If its operands
cannot be resolved/computed, the comparison is not evaluable/unmet according to its requirement
status." That replaces the ordering rule I had written after the rerun, which made *not evaluable* win
outright. His version keeps a required claim's failure visible as a failure.

**FLAGGED (third).** An absence that §8 records as valid has no verdict in §2's table. Both derivers hit
it and forced a verdict. I propose recording it as `VALID_ABSENCE`, which is a line outcome, not a
support record, and not one of the four statuses.

**FLAGGED (second).** One case has no fitting label: a **supporting** item, not a preferred default and not a
typical example, whose value the game leaves absent. It is not satisfied (nothing was realised), not
adapted (nothing displaced it), and not inert (it is real authored knowledge). I propose a result
`NOT_REALIZED` for it, used only here. That is an addition to the item-result vocabulary in the audit
record, not a new property status and not a change to support. If he prefers "adapted" stretched to
cover it, say so and I will use that instead.

**A third instance of the same hole, found in the AM-17 rederivation.** A **supporting existence** item
whose cardinality check fails — Wide Zone's `COUNT 2` on channels, met by zero elements — has no row
here either. It is not required, so not *unmet*; not a preferred default, so not *adapted*; not a
typical example, so not *inert*. The existence row names the check and §4.3 points back here. If he
takes `NOT_REALIZED`, it must cover a failed cardinality check as well as an absent value.

## 8. Closed-world absence (AM-07, as qualified)

Views get no line. For an empty collection or a stated absence, Christian qualified: **"use closed-world
semantics: absence is valid where the schema establishes that no supported contribution entails an
element there. Don't manufacture positive support for absence merely from silence."**

So an absence is recorded as **valid** when no support-capable item entails an element on that row at
that scope, and as **unmet** against each item that does. It is never entailed by silence, and an
absence is never a positive support record.

**The mismatch I flagged here is closed by his rulings**, not by ordering. §6 made an item
support-capable when it *entails or bounds*, while this section keys a valid absence on **entailment
alone** — so an absent value that two contradictory comparatives bounded read as a *valid* absence on
this section's own words. Under SD-26 a comparative never takes a line at all, so it cannot bound an
absence, and under SD-28 an unauthored dependency is a gap before anything else. The two tests no
longer meet on one line. Nothing about entailment here changes.

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
  nine of its items go unmet. Christian adopted AM-17 on 20 September.

  **Re-derived 20 September, on his instruction, and the claim was wrong twice over.** I first said
  AM-17 rescues those lines. After the rerun I said the rescue failed because the lateral values had no
  interval tests, and was "computable in principle" once they were written. Two independent derivations
  of the eight affected lines now agree: **the tests are complete and correct, and no verdict moves.**
  The register was never the obstacle.

  **Why the rescue does not happen.** Not one item in any of the eight contracts carries a lateral
  selector — the word appears only in fit notes — and every one of Wide Zone's region items is at
  own-involvement scope. §4.5 says a contract **can** select regions from whole-game scope; that is a
  capability offered to a contract author. Derivation never rewrites an authored selector or scope on an
  author's behalf, and AM-12 forbids supplying one by interpretation. **So AM-17 is usable and unused,
  and the remedy is authoring — restating the contract — not derivation.**

  **What the completed tests did fix:** all five values now have tests; the over-match is cured, so the
  full-width regions (the area and both halves) are no longer matched as wide or central; and the
  orientation terms are renamed lengthwise and crosswise so they no longer collide with the lateral
  attribute.
- **AM-05 overrides AM-01's worked example.** I told him AM-01 would make the attacking team of Team A's
  north zone entailed. Under his AM-05 ruling it does not: the selector now matches two objectives
  against a minimum of one, so the item entails neither. AM-01 still changes that item's forward result
  from unmet to satisfied. The example I gave was right about the matching and wrong about the verdict.
- **AM-05 bites hardest on objectives.** Four primary scoring objectives match a minimum of one, so none
  is individually entailed; the four target zones' existence moves from entailed to unauthored. This is
  his rule working as intended: the game must satisfy the cardinality, and identity needs its own
  support.

## 11. What is not decided here

**Closed by his rulings of 20 September**, and recorded here so nobody reopens them: what may be an
operand (SD-23); effective value and the modifier's declared operation (SD-24); the base value of a
qualifying primary scoring event (SD-25); where a comparison lands (SD-26); whether an assumed item can
collide (SD-27 — it cannot); gap before collision (SD-28); and the classification of the whole
extension (SD-29). The six sentences are ruled (KR-05). The §6/§8 mismatch and the fabricated-comparative
problem both fall away under SD-26 to SD-28.

**Still open, and none of it blocks the engine's design:**
- Whether cardinality becomes a first-class property (§4.3). He ruled no schema change yet.
- The `NOT_REALIZED` item-result label (§7), which is still a proposal.
- The closed vocabularies' contents (SD-18).
- **No aggregate function is named** for a comparison that ranges over several matched elements (§4.4).
  This is the one genuine hole left in the comparative grammar. It does not bite in anything derived so
  far, and an engine can refuse an aggregate comparison until he names the function — but an engine
  cannot invent one.
- AM-18 to AM-24 and AM-26 remain local operational amendments "unless one proves to require a
  structural-semantic change during design". AM-16 and AM-17 no longer sit here: SD-29 classifies them.
