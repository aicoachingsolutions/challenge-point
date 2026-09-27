# Phase B — three mechanisms, analysed for ruling

27 September 2026. **Analysis only. Nothing implemented, nothing merged, nothing authored.**

Each of the three has at least two readings that the existing specification and standing decisions
admit, so none is implemented. What follows is, for each: the mechanism, the authority that already
exists, the reach, and the alternatives with what each would cost.

Two of the three turn out to have an existing authority that says something definite — and in both
cases the engine and the corpus were built to **different** rules.

---

# Cluster 5 — own involvement, and why Wide Zone's knowledge cannot reach its own channels

## The mechanism

Own involvement is computed as **the element classes this contract formed from items in its *other*
scopes**. Wide Zone Advantage forms three region classes, all from `OWN_INVOLVEMENT` existence items,
so they are excluded from the set they define; the set is empty; and all eleven of its
own-involvement items reach nothing — including the three that form the classes.

## The authority already exists, and it forbids what Wide Zone does

AM-13, which you adopted on 19 September, states the rule and the reason:

> **Ambiguity observed.** *"The elements the same contract entails" is circular for an item that is
> itself what entails the element.*
>
> **Proposed rule.** *Own-involvement covers the elements entailed by the contract's other-scoped
> items, fixed before any own-involvement item is applied.* **An item that entails a collection
> element may not use own-involvement; it uses a selector attribute at whole-game scope instead
> (AM-17).**

So the engine is behaving exactly as ruled, and **Wide Zone's contract violates the rule.** Three of
its items — `WIDEZONE-02.a`, `WIDEZONE-03`, `WIDEZONE-08.d` — are existence requirements on a
collection at own-involvement scope, which AM-13's second sentence forbids.

This was also seen at the time. The 20 September derivation note records it:

> *"Every one of Wide Zone Advantage's region items is scoped to its own involvement, and no item of
> its at another scope entails a region. Under AM-13 that scope is empty… **So AM-17 is usable and
> unused, and the remedy is authoring — restating the contract — not derivation.**"*

And SD-31 ruled what should happen meanwhile: the declaration survives the empty scope, so the result
reports an authored gap rather than inventing structure.

**What has not been ruled is that the engine should let the violation through silently.** Nothing
checks AM-13. The contract loads, class formation uses the item (class formation does not consult
scope), scope resolution excludes it, and the two stages disagree about the same item with no report.
That silence is why twelve lines have been reading as missing knowledge for a week.

## Reach

| | |
|---|---|
| Contracts using `OWN_INVOLVEMENT` | 2 of 8 — Wide Zone Advantage (11 items), Variable Target (20) |
| **AM-13 violations** | **5 items in 2 contracts** |
| — Wide Zone | `WIDEZONE-02.a`, `WIDEZONE-03`, `WIDEZONE-08.d` on `S2` |
| — Variable Target | `VARTARGET-08.a`, `VARTARGET-08.b` on `J11a` |
| Symptomatic today | **Wide Zone only.** Variable Target has eight other-scoped existence items, so its set is non-empty; its `J11a` class is excluded from it, but no own-involvement item targets a `J11a` field row, so nothing shows |
| Lines currently affected | **12** — `S3`, `S4`, `S5`, `S6` on Wide Zone's three channel classes |
| Overlap with cluster 6 | **4 of the 12** (`S3` ×3, `S4` ×1) would also resolve under cluster 6, so the two must not be counted separately |

Variable Target matters here: it shows the violation is a **class of authoring defect**, not a
one-off, and that it can sit silent until a field item happens to target the affected row.

## The alternatives

**R1 — AM-13 stands; enforce it and restate Wide Zone.**
The engine gains a load-time check: an existence requirement on a `COLLECTION` row may not be scoped
`OWN_INVOLVEMENT`. Wide Zone's three items are restated to `WHOLE_GAME` with their existing
`noun=channel` selector, which is what AM-17 makes available.
*Consistent with:* AM-13 as written, AM-12 (derivation never supplies a scope by interpretation),
SD-31.
*Cost:* the restatement is authoring and is yours. Variable Target's two items need the same
treatment or an explicit exemption.
*Resolves:* 12 lines.

**R2 — AM-13's prohibition is a fossil of the pre-class model; drop it.**
This is the reading I think you should weigh most carefully, because AM-13's stated *reason* no longer
holds. The circularity it names — *"circular for an item that is itself what entails the element"* —
was real when own involvement depended on stage-5 **entailment**. **SD-47 changed that.** Elements are
now classes formed at stage 2 from authoritative selectors, before scope is resolved at stage 3. Under
the class model, seeding own involvement from *all* of a contract's own classes is a subset selection
over data that already exists — not a circular definition. The implementation note in the design
package says as much about a different consequence of SD-47: *"own involvement is now a subset
selection stage 2 already has, so the divergence check cannot fail for it."*
*Consistent with:* SD-47, SD-42 (a restricted computation may not create authority — this creates
none, it selects over classes already established by authoritative existence items).
*In tension with:* AM-13's explicit second sentence, which would need amending.
*Cost:* no restatement; the engine resolves it. But it changes what "own involvement" means for every
contract, present and future.
*Resolves:* the same 12 lines.

**R3 — Refuse the contract at load.** Recorded and not recommended: SD-31 already ruled that an empty
own-involvement scope preserves the declaration and reports the authored gap, which implies reporting
rather than refusal.

**Independent of the choice: the silence should end.** Under either R1 or R2 an existence item at
own-involvement scope is a defect, and an empty own-involvement set with own-involvement items waiting
on it is worth a named record rather than twelve unexplained gaps. I have not implemented that either,
because what it should be called and whether it blocks are both your calls.

---

# Cluster 6 — a selector that establishes an element, and the attribute it fixes

## Your question has a precise answer, and it is uncomfortable

> *"When the selector that establishes an element necessarily fixes an attribute, under what existing
> authority, if any, can that value establish the corresponding field line?"*

**Under RC-16 — a run convention, never ratified.** Its text, from the conformance run's derivation
rules:

> **Attributes carried by existence (RC-16):** an item that entails an element **also entails each
> attribute its selector fixes with `=` or `∋`**. An attribute given with `∈` is only narrowed.

That is your question answered exactly, including the operator distinction. And the same document is
explicit about what an RC is:

> *"Every rule that goes beyond the specification's text is a numbered run convention (RC)."*

So RC-16 goes beyond the specification by its own declaration, it was never carried into the standing
register, and the engine — built to the specification and the SD register — does not implement it.

**The restaters did.** Six of the eight contracts cite RC-16 in their `conventionsUsed`, and they
omitted items on exactly these rows because of it:

- RPC-001: *"11.a, 08.c: the selector fixes role and team; V3 selectors fix type"*
- A01-02: *"O1[kind=ball] carries its kind; no O2 item"*
- GF2: *"J4 role and S4 function fixed through J1 and S2 selectors."*

> **The corpus and the engine were built to two different rule sets on this point.** The contracts are
> not silent on these rows by oversight; they are silent on purpose, on a rule the engine never
> adopted. That is why the lines read as coverage gaps.

## Reach

Nineteen `FIELD` rows are also a selector attribute of their owning collection — `S3` `S4` `P9` `O2`
`J3` `J4` `J6` `T1a` `T1b` `T1c` `V4` `V8a` `V8b` `V12` `V13` `V16` `V24` `R2` `R3`. That is every
area except Envelope and Direction, so the mechanism is not specific to the rows we noticed.

Twenty-four instances exist in today's corpus. Applying RC-16 exactly as written:

| | | |
|---|---|---|
| **Resolves a currently failed line** | **19** | 15 by `=`, 4 by `∋` |
| Agrees with an item already entailing | 0 | no free confirmations |
| **Collides with an item already entailing** | **3** | below |
| **Closes an authorized freedom** | **1** | `RPC-001-11.a::J3` is `FREE(a)`; the selector fixes `team = BUILD_OUT_TEAM` |
| Narrows only (`∈`) | 1 | `I02::O2 ∈ {goal, target}` — SD-78's composition, not a fixed value |

The nineteen span four condition types on RPC-001, three object kinds, two objective roles, two
transition qualifiers on the goal kick, four region functions, four region nouns and one modifier
condition type. **Four of the nineteen are Wide Zone's and overlap cluster 5.**

### The three collisions, which are the finding inside the finding

| Line | Selector fixes | An item entails |
|---|---|---|
| `PCG-02::V4` | `"connected-pass-combination"` | `"connected-pass-combination (authored term; not in draft list; nearest draft member: eligibility)"` |
| `PCG-10::V16` | `"connected-pass count"` | `"current connected-pass count of ATTACKING_TEAM"` |
| `VARTARGET-13.a::V16` | `"live member of this object's candidate set"` | `"which member of this object's candidate set is live"` |

None of the three is a disagreement. Each is **the same thing written twice**, once in a selector and
once in an item, and under SD-63 open-text equality establishes no identity, so the engine cannot see
that they agree. Ratifying RC-16 literally turns three resolved lines into three collisions. It is the
same shape as last week's `DEFENDING_TEAM` / `NOT_LAST_TOUCH`: agreement in fact, difference in
spelling.

## The alternatives

**S1 — Ratify RC-16 as a derivation rule, literally.**
*Resolves:* 19 lines. *Costs:* 3 new collisions; 1 authorized freedom closed.

**S2 — Ratify RC-16 subordinately**: the establishing selector supplies the attribute's value **only
where no item entails that line**.
*Precedent:* this is exactly how a citable standing decision already applies — `applies()` requires
`record.entailing.length === 0`. It is not a precedence rule between contributions (SD-02), because
the two never both apply.
*Resolves:* the same 19 lines. *Costs:* none of the three collisions; the `J3` freedom still closes,
because `FREE` is not entailment. Whether closing it is right is a separate question — if the element
*is* the build-out team's objective, its team is not free, and the freedom was an artefact.

**S3 — Retire RC-16; require an explicit item on each row.**
*Consistent with:* §3, under which only items support a value, and AM-12.
*Cost:* restating around 19 items across six contracts, which is authoring and is yours. It also means
accepting that six contracts were restated against a rule we then declined.

**S4 — Ratify for `=` only, and treat `∋` separately.** `∋` asserts *membership* of a set-valued row
(`S4` is *"set from closed list"*), which is a lower bound on the set rather than the set's value.
RC-16 groups them; §1.9's value model may not. This is a sub-question inside S1/S2, affecting 4 of
the 19.

**What is not available.** The engine cannot decide this by interpretation. RC-16 is either a
derivation rule or it is not, and the corpus was written as though it is.

---

# Cluster 7 — three transitions on one trigger key

## The analogy to SD-84, tested

You asked me to test it rather than extend it. **It fails, on SD-84's own terms**, in three places:

| SD-84 says | The turnover case |
|---|---|
| *"Where the authoritative schema defines a collection as **cardinality exactly one**"* | `T1` has no cardinality bound at all |
| *"identity … follows from the authoritative schema invariant itself **rather than from interpretation of selectors**"* | the trigger key **is** a selector attribute; merging by it is merging by selector |
| singletons are read *"as data — a citable standing decision stating `COUNT = 1`"*, **"never from the row's prose"** | `T1`'s key exists only in the row's prose: *"keyed by trigger … plus qualifiers"* |

So SD-84 does not extend to this case as written. If a canonical key is to establish identity, that is
a **new decision**, not an application of the old one.

## What the corpus actually shows

Three element classes share `trigger = POSSESSION_CHANGE`: `blind:GF4::I06`, `restated:GF2::GF2-07.a`
and `restated:NEUTRAL-PLAYER-CONDITION::NEUTRAL-12.a`. All three are `EXISTS`, `REQUIRED`, `AUTHORED`
— three knowledge objects each authoring what happens at a turnover.

**They are indistinguishable in every derived property.** `T6` is `CONTINUE` on all three, entailed by
the same item; `T7` is `true` on all three, entailed by the same item; `T2`–`T5` are withdrawn on all
three, because `CONTINUE` makes them inapplicable. There is no field on which they differ and none on
which merging them would create a collision.

`GA-TRIGGER-UNIQUE` has two clauses. *"No transition collides"* **passes**. *"No two transitions share
a trigger key"* **fails**, and it is the only Gate A clause that fails on the transitions.

## The prior question: is the gate asking the right thing?

Gate A's specification says it certifies *"one value per atomic transition property per trigger, with
the coherence rules"*. That is satisfied — all three agree on every property. The implemented clause
asserts something stronger: one **element** per trigger key.

And SD-47 already says derivation does not hold elements:

> *"Existence requirements establish supported classes defined by authoritative selectors. Derivation
> does not manufacture individual identity or equivalence between classes."* In checking mode a
> candidate's concrete element *"may satisfy every supported class whose selectors it matches, and
> that does not imply that derivation independently instantiated or paired an individual with it."*

Read that way, three classes with the same selector are three *descriptions* that one concrete
turnover transition satisfies. Nothing is incoherent, and the gate is asking an identity question
derivation deliberately declines to answer.

## The alternatives

**T1 — The gate is wrong; no identity ruling, no merge.**
`GA-TRIGGER-UNIQUE`'s first clause is replaced by the question it can legitimately ask: do classes
sharing a trigger key require **incompatible values**? That is clause two, which passes.
*Consistent with:* SD-47, SD-40, the Gate A specification text.
*Reach:* one gate clause. **No lines change.** Gate A's failing checks go from three to two.
*Cost:* the game description still carries three turnover classes; a downstream realization layer must
understand that they describe one transition. Nothing in the representation says so.

**T2 — A canonical key establishes identity; the three classes support one element.**
A new decision extending SD-84's *reasoning* — schema-derived identity — from cardinality-one
collections to keyed collections.
*Reach:* exactly two rows declare a key, `T1` and `J11a`, and `J11a` has one class today. So the
mechanism merges **3 classes into 1** and touches nothing else.
*It must be scoped to declared keys.* Six groups of classes in the corpus share identical selectors —
two team classes, two ball objects, three objectives, two open object classes, two channels — and only
one group is on a keyed row. An "identical selectors ⇒ same element" rule would merge thirteen classes
and is exactly what SD-47 forbids.
*Cost:* to satisfy SD-84's own standard the key must be recorded **as data**, not read from
`valueType` prose — a register change adding a `keyedBy` field to `T1` and `J11a`.
*Effect if adopted:* removes 18 lines (6 failed, 8 withdrawn, 4 derived). Lines 153 → 135, failed
96 → 90.

**T3 — Both.** They are not exclusive: the gate clause can be corrected whether or not identity is
ruled. If T2 is adopted the clause becomes unreachable rather than wrong.

**Nothing merged.** The three transitions are untouched, as you instructed.

---

# Reach together, and the order I would take them

| | Lines it would resolve | Overlap |
|---|---|---|
| Cluster 5 (own involvement) | 12 | 4 shared with cluster 6 |
| Cluster 6 (RC-16) | 19 | 4 shared with cluster 5 |
| Cluster 7 (identity) | 18 removed, of which 6 failed | none |

**Union, if all three resolved the way that resolves most: 96 → 63 failed lines**, and 27 of the 33 are
internal deterministic work with no football in them.

I would take **cluster 6 first**. It is the largest, it spans six of the eight contracts and six of
the eight areas, and until it is settled we cannot tell which of the remaining "coverage" gaps are
real — the same problem Wide Zone caused at smaller scale. Cluster 5 second, because four of its lines
resolve with cluster 6 and the remainder is then a clean authoring question. Cluster 7 last, because it
changes no knowledge either way.

**A caution about the reclassification you asked for afterwards.** Cluster 6 alone would move
nineteen lines out of the failed population, and most of them are lines I classified yesterday as
knowledge-authoring or realization-sensitive — for instance the four condition types on RPC-001, which
I put under knowledge-authoring. They are not missing knowledge; they are written in a selector. I
would expect the reclassification to move a further block the same way, which is why doing it from
scratch rather than adjusting today's assignments is the right instruction.

---

# What I did not do

- No merge of the three turnover transitions.
- No change to own-involvement scope resolution, and no enforcement check added.
- No implementation of RC-16, in any of its four forms.
- No authoring: Wide Zone's scopes, GF4's *"one goal or target at each end"*, and every other
  apparent knowledge repair are untouched and held, as instructed.
- No register change: `keyedBy` is described as what T2 would need, not added.

One incidental correction is still outstanding and unmade: the register spells the transition
qualifier rows `qualifiers.lastTouch` in `path` and `qualifier.lastTouch` in `selectorAttributes`.
Any implementation of cluster 6 has to reconcile that, and it is a typo rather than a decision.

Activity generation remains frozen.
