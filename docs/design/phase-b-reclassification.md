# Phase B — the population, reclassified from scratch

27 September 2026. SD-92, SD-93 and SD-94 applied; the corpus rerun; the classification built again
from the run rather than adjusted from the last one.

---

## 1. What the three rulings did

| | before | after |
|---|---|---|
| derived | 35 | **51** |
| failed | 96 | **80** |
| open | 10 | 10 |
| withdrawn | 12 | 12 |
| collisions | 0 | **3** |
| Gate A checks failing | 3 | **2** |

**SD-92** resolved sixteen lines: four condition types on RPC-001, two object kinds, two objective
roles, the goal kick's two trigger qualifiers, four region nouns, one objective team and one modifier
condition type. `∋` behaved as ruled — it records a member and resolves nothing, so the four region
function lines are unchanged but now carry what is known about them. `∈` narrowed GF4's object kind
to `{goal, target}`, which is `FREE(choice)`: a permitted choice, not a gap.

Subordination held: **no line where an item entails the field took a selector value**, so the three
collisions I predicted did not happen. The `J3` freedom closed exactly as you said it would.

**SD-93** made Wide Zone Advantage's eleven contributions reach its own channels for the first time.
The named diagnostic is implemented and emitted; the corpus now raises none, because both contracts
that use the scope are populated.

**SD-94** took `GA-TRIGGER-UNIQUE` off the failing list. The three turnover classes are compatible on
every property, which is what the clause now asks. Nothing was merged.

### The three collisions, and why they are worth more than they look

All three are Wide Zone's, all on `S6`, all between **`WIDEZONE-04.a`** (*"touchline-adjacent"*) and
**`WIDEZONE-05.a`** (*"touchline-adjacent (outer edge on a touchline)"*).

That is one authored sentence restated as two items in two spellings. It is not a knowledge conflict
and it is not new — it has been sitting in the contract since the restatement, invisible because
neither item could reach anything. **The first thing letting knowledge through did was show us
something about how the knowledge was written down.** Recorded, not repaired, as instructed.

---

## 2. The 80 remaining lines

| | | |
|---|---|---|
| **1 · Internal deterministic** | **32** | 40% |
| **2 · Knowledge-authoring** | **25** | 31% |
| **3 · Realization-sensitive** | **23** | 29% |
| **4 · Outside the boundary** | **0** | the boundary is enforced at item level: 34 items are outside it and produce no line |

### Category 1 — internal deterministic (32)

| Cause | Lines | Reach |
|---|---|---|
| **A set- or list-valued row cannot resolve from membership** | 9 | **general** |
| **Transition qualifiers the trigger makes inapplicable** | 10 | **general** |
| Per-element count against collection cardinality (`O3`) | 5 | reusable within Objects |
| A mobile object's layout position (`O4`/`O5`, the two balls) | 4 | reusable |
| Wide Zone's one sentence restated twice (`S6` ×3) | 3 | knowledge-specific — a restatement, not a mechanism |
| Modifier combination (`V10`) | 1 | the specification gap SD-59/60 already recorded |

**The two general ones are the next clusters, and both are now sharper than before.**

*Set- and list-valued rows.* `S4` holds a region's functions as *"set from closed list"*; `J7` holds
an objective set's members; `J11b` and `J12` hold a rule's yield and revelation. Knowledge states
membership one member at a time — SD-92's `∋` operator now records exactly that — and several items
assert only that the field is *present* (`EXISTS` on a `FIELD` row, value `N/A`). Neither produces a
**complete** set, and the line needs one. Three of the six `S4` lines now carry an established member
and still read as unauthored, which is honest but leaves the question open:

> **How does a set-valued field become complete?** Is a stated membership the whole set unless
> something else is stated, or must completeness be authored?

*Transition qualifiers.* Ten of the thirty-two are `T1a`/`T1b`/`T1c` on transitions whose trigger has
no such qualifier — a turnover has no end line and no last touch. This is SD-88's mechanism one step
along: there a line was conditional on **another line's value**, here it is conditional on **the
element's own trigger**, which SD-92 has just made readable. The register has an `applicability`
block already; these rows are not in it.

### Category 2 — knowledge-authoring (25)

| | Lines |
|---|---|
| Wide Zone's channels along the axis — authored, but `ASSUMED` (`S5`) | 3 |
| Objective role, and the reference blocked behind it (`J4`, `J2`) | 6 |
| Information rule trigger, state dependency, access holder (`V17`, `V21`, `V22`) | 4 |
| Objective-set scope, live cardinality, persistence (`J6`, `J8`, `J10`) | 3 |
| Primary-event condition referents and parameter (`V5`, `V6`) | 3 |
| Modifier magnitude, operation, referents (`V9`, `V9a`, `V8b`) | 3 |
| The goal kick's taker and method (`T3`, `T5`) | 2 |
| The trigger region's noun (`S3`) | 1 |

**Three of these moved here from category 1, and that is the point of doing it again.** Wide Zone's
axis extent read as a mechanism problem last time because nothing could reach it. Now that its items
arrive, they turn out to be `ASSUMED` — *"the full axis extent, end line to end line"* on an
assumption — so the gap is real and it is knowledge.

### Category 3 — realization-sensitive (23)

| | Lines |
|---|---|
| Region and object placement | **10** |
| Information reveal: trigger type, timing, progression (`V18`–`V20`) | 6 |
| The candidate targets' physical kind (`O2`) | 2 |
| Goalkeepers (`P3`) | 2 |
| The neutral group's participation persistence (`P13`) | 1 |
| Which candidate starts live (`J9`) | 1 |
| The restart region — L3 (`T4`) | 1 |

---

## 3. What moved, and what did not

| | before | after |
|---|---|---|
| Internal deterministic | 53 | **32** |
| Knowledge-authoring | 20 | **25** |
| Realization-sensitive | **23** | **23** |

**The realization-sensitive count is identical, and the membership is nearly identical.** That is the
most useful number in this document. Two mechanisms were cleared, sixteen lines left the population
and five more re-sorted, and the set of questions that need a coach did not move.

The placement lines tell the same story from the other side. Twenty of them, as before:

| | last classification | now |
|---|---|---|
| realization-sensitive | 10 | **10** |
| internal deterministic | 10 | 7 |
| knowledge-authoring | 0 | 3 |

**The ten realization-sensitive placement lines are the same ten.** Wide Zone's six moved out of the
blocked column and split three internal, three knowledge; the four ball-position lines stayed
internal. Nothing crossed into or out of category 3.

I would not have predicted that. It is the first evidence that the realization-sensitive set is
**stable under mechanism corrections** rather than an artefact of them, and it is exactly the
property that would make it safe to leave open.

---

## 4. Reach of each correction (SD-81)

| | Reach |
|---|---|
| **SD-92**, selector-carried attributes | **General.** Nineteen rows across six of the eight areas; sixteen lines today, and it applies to every element any contract establishes by selector |
| **SD-93**, own involvement | **General.** It changes what the scope means for every knowledge object; two contracts use it today |
| The `selectorAttribute` register field | **General, and form only** — the correspondence becomes data, so nothing recovers it by matching path text. Membership unchanged |
| **SD-94**, the Gate A clause | **Reusable within gate reporting** — one clause, no lines |
| The named diagnostic | **General** — any scope that has contributions and nothing to populate it |
| Wide Zone's three collisions | **Knowledge-specific** — one contract's restatement, not a mechanism |

---

## 5. The pilot boundary, against your formulation

> *"Can the engine deterministically produce a structurally coherent and representative activity while
> deliberately leaving legitimate realization-sensitive choices open for the realization layer and
> coach?"*

Not yet, and the five things you named as prerequisites now separate cleanly.

| Your prerequisite | State |
|---|---|
| **Identity** | **Settled.** SD-84 covers the singleton case, SD-94 declined to introduce a canonical-key identity, and SD-47 stands. No line waits on it |
| **Reach** | **Mostly settled.** SD-92 and SD-93 cleared the two known failures. What remains is indirect: `J2` cannot determine its reach while `J4` is unauthored, and three `S5`/`S6` lines the same way behind `S4` |
| **Direction** | **Open, and it is the sharpest one.** `GA-DIRECTION` is still not evaluable. It improved — one team designation now has an objective, carried by a selector — and it is blocked on `RPC-001-11.a::J2`. SD-07 is an invariant, so a game that cannot establish direction is not structurally coherent |
| **Objective structure** | **Open.** Eleven lines: role, reference, and the objective set's scope, members, cardinality, persistence, yield and revelation. Mixed category 1 and 2 |
| **Representativeness** | Not separately measurable yet. It rests on the four above |

**So the honest answer to your question is: two of the five are settled, and the other three are the
same twenty-odd lines seen from three directions.** Direction is blocked on an objective reference;
the objective reference is blocked on an objective role; the objective set's structure is the same
area again. They are one cluster, not three.

**What I would do next, if you agree:** the objective area — roles, references and sets — because
direction depends on it and because it is where category 1 and category 2 are most tangled. The
set-valued completion question sits inside it (`J7`, `J11b`, `J12`), so the general mechanism and the
knowledge gap would be separated in the same pass rather than in two.

**And the thing I would not do:** touch the twenty-three. They did not move when two mechanisms were
cleared, which is the strongest argument yet that they are what they look like.

Activity generation remains frozen.
