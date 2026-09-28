# Phase B — the objective/direction cluster, as a pilot-boundary closure pass

27 September 2026. Analysis. **Nothing implemented, nothing authored, nothing merged.**

The cluster does **not** close. Three findings need a semantic ruling and one needs authored
knowledge, and until those land the direction invariant cannot be established. What follows is each
finding in your four buckets, the set-completion trace you asked for, and the pilot-readiness
accounting.

---

## Finding 1 — a team cannot carry a designation, and direction depends on it

**Bucket 1. Needs a ruling.**

`P1` (`performers.teams[]`) registers one selector attribute, `team`, and **no field row corresponds
to it.** A team's designation is therefore expressible only as a selector on a class — it can never
be authored as a property of a team. `GA-DIRECTION` reads it from exactly there, because there is
nowhere else to read it from:

```
const designationOf = (cls) => cls.constraints.terms.find(t => t.attribute === 'team')
```

Both team classes in the corpus — `PCG-08` and `GF2-14.a` — carry **empty selectors**. Two contracts
assert that teams exist; neither says which team is which. So the clause *"each team has an objective
it attacks"* is not evaluable, and it cannot become evaluable through authoring, because there is no
row to author onto.

**This is not obviously a defect.** RC-22 says a designation *"is evaluated at the trigger or episode
it is attached to"* — designations are relational and episodic, so a team element plausibly should
**not** carry one as a static property. If that is right, the clause is asking derivation for
something the representation deliberately does not hold, which is the shape SD-94 just corrected for
transitions.

**Three readings, and I am not choosing between them:**

| | What it says | Reach |
|---|---|---|
| **D1** | Add a designation field under `P1`, so a contract can author *"this team is the build-out team"* | **General** — a representation addition, small but real, and the first since SD-72's two |
| **D2** | The clause asks what derivation cannot establish. Ask instead what it can: **do the objectives, by designation, give both sides something to attack, and do those objectives lie at opposite ends?** No pairing of a designation to a concrete team class | **General** — the SD-94 pattern applied to direction; changes the gate, adds no representation |
| **D3** | Direction is not establishable in derivation mode and belongs to the realization layer, where a concrete game names its teams | **General**, and it would move SD-07 out of Gate A |

**D2 is the one I would put first**, because it is the same reasoning you applied to the turnovers a
few hours ago and because it needs nothing new. But note what it does **not** fix: see Finding 2.

---

## Finding 2 — which team attacks each objective is unauthored

**Bucket 2 — knowledge genuinely missing, and required for structural coherence.**

`J3` (`objectives[].team`, *"the team that attacks it"*) across the five objective classes:

| Objective | `J3` |
|---|---|
| `RPC-001-11.a` | **`BUILD_OUT_TEAM`** — carried by its own selector under SD-92 |
| `GF2-08.a` | `FREE(a)` |
| `GF2-09.a` · `RPC-001-14.a` · `VARTARGET-06.b` | `FREE(choice)` |

**The corpus contains exactly one item on `J3`**: `GF2-12.a`, *"EACH_TEAM: one shared target attacked
by both teams"* — `ASSUMED`, `PREFERRED_DEFAULT`. Under SD-83 an assumption establishes nothing, so
it bounds and never entails.

So direction is blocked twice over: once by Finding 1, and once by knowledge. **D2 does not rescue
it** — a designation-only check still needs to know which designation attacks which objective, and
four of five objectives do not say.

This is the single clearest knowledge gap in the corpus that is **load-bearing for structural
coherence**, because SD-07 is an invariant rather than a preference. It is one sentence per game
form: which team attacks which objective, or that both attack a shared one. GF2 nearly says it
already — the assumption is the reading, not the authoring.

**Held, not authored**, under your instruction on knowledge repairs.

---

## Finding 3 — the primary objective's reference is authored, and written as prose

**Bucket 1 or 2 depending on your view. Needs a ruling.**

`GA-DIRECTION`'s second clause is blocked on one line: `RPC-001-11.a::J2`. That line **is** resolved —
`GF2-08.b` entails it — and its value is:

> *"the target feature: the objective-area region of GF2-03.a (line or zone)"*

SD-63 withholds: open-text equality establishes no structural identity, so no end can be read and the
clause blocks. Correct behaviour.

**But the reference is not vague — it names a held element.** `c:restated:GF2:GF2-03.a` is an
objective-area region class in the run. The knowledge identifies its referent precisely and writes it
as a sentence rather than as a registered reference.

That is the same shape as SD-79, where authored alternatives were prose and you authorised a bounded
restatement into machine-readable sets. The parallel is close enough to name and not close enough for
me to act on: **may an authored reference that names a held class in prose be restated as a structural
reference to that class?** It would have the same guard SD-79 had — the restatement may not choose a
referent, only type one the source already names.

Reach: **reusable within a representation area** — objective references today; the same question
arises wherever SD-63 withholds on text that names something held. Six references currently establish
no structural identity.

---

## Finding 4 — three objective classes that nobody described

**Bucket 1. Needs a ruling, and it is the mirror of SD-94.**

`GF2-09.a`, `RPC-001-14.a` and `VARTARGET-06.b` are objective classes whose selectors are **empty**.
Three contracts each assert *"an objective exists"* without saying anything about it. Under SD-47
that is three classes, and each gets a reference, a team and a role line:

**Nine of the eighty failed lines are fields of objectives nobody described.**

This is the turnover case again with a different consequence. There, three identical classes were
harmless and only the gate misread them, and you ruled that derivation should not manufacture
identity to tidy the representation. Here, identity-neutrality **multiplies the line population**:
one concrete objective could satisfy all three descriptions, and the engine is asking each of them
separately for a reference, a team and a role that nobody owes.

> **Does an undescribed existence assertion owe field values?** Or is a class with an empty selector a
> claim that *some* objective exists — satisfied by any objective the game already holds — rather than
> a distinct objective whose properties are then unauthored?

I can see the case for either, and the second would remove nine failed lines without anything being
authored, which is precisely the reason to be careful about it. **Not acted on.**

Reach: **general**. Five classes in the corpus carry empty selectors — three objectives and two
teams — and the two team classes are Finding 1.

---

## Finding 5 — set-valued completion, traced

**You asked for the trace rather than a choice. Here is what the authority actually supports.**

| Source | What it establishes |
|---|---|
| **RC-15** (run convention) | *"a set- or list-valued row gives one line per member"* — the restaters judged **members**, not the set |
| **SD-51** (ruled) | *"Materialize member lines only from an authoritative resolved member set. OPEN, failed or gapped membership does not authorize creation of member identities."* The set must resolve **first** |
| **SD-79 / SD-78 / SD-80** (ruled) | A set is carried as a **machine-readable array** on a `REQUIRED_RANGE` item, composed by intersection; and a set is never the value of a single-valued property |
| **SD-92** (ruled today) | `∋` *"establishes membership … it does not by itself define the complete set"* |
| **AM-04** (ruled) | *"Unexamined silence cannot license a free choice."* |

**One reading survives, and it is narrow: a set-valued row resolves when an item states the set, as
an array.** That mechanism exists and the corpus uses it — SD-79 restated four items into exactly
this form. Accumulated memberships do not resolve a set, by your ruling this morning.

**The two closed-world readings die on the evidence, not on taste.** "Whatever was stated is the whole
set" and "whatever was stated is the whole set provided every contract declared the row" both make
silence mean completeness, which AM-04 refuses; and on `S4` specifically, two contracts declare the
row `UNDECLARED` — *"Functions not examined as a field"* — so the second reading would be reading
completeness out of an admission that nobody looked.

So: **where a complete set is needed, it must be authored.** That is a conclusion, not an alternative,
and I would only reopen it if you want the closed-world reading ruled in against AM-04.

### But completeness is needed less often than the failed count suggests

`GA-REGION-FUNCTION` asks two things: *"every instantiated region serves at least one function"* and
*"every function a region serves is a registered member"*. **Both are satisfiable from established
membership.** Three regions now carry one — `perceptual-reference`, `objective-area`, `trigger` — and
each came from a selector the register validated, so it is a registered member by construction.

The check does not see them. It reads the `S4` line, finds it unauthored, and blocks. **That is a
consequence of SD-92 that nothing has implemented yet, not a new semantic choice** — you ruled that
`∋` establishes membership, and a clause that asks about membership should read what is established.

I have not implemented it, because it sits inside a cluster you asked me to return rather than
resolve. It is the smallest item here and the only one of the five that needs no ruling.

**Where completeness genuinely is load-bearing:** `J7` (an objective set's members), because
`GA-OBJECTIVE-SETS` compares the live cardinality against the member count and checks the initial
member is one of them. That is Finding 6.

---

## Finding 6 — the objective set rests on assertions that assert nothing

**Bucket 1 for the grammar question; bucket 3 for the knowledge.**

Variable Target's objective set has six unresolved fields, and the items addressing them are:

| Row | Item | |
|---|---|---|
| `J6` scope | `VARTARGET-06.d` `EQUALS` **ASSUMED**; `09.a` `EXISTS` ASSUMED | |
| `J7` members | `VARTARGET-06.e` **`EXISTS` AUTHORED** — *"members lists the candidate objectives"* | names no member |
| `J8` cardinality | `GF2-09.b` `RANGE` min 1 AUTHORED; `07.a` `EQUALS` 1 **ASSUMED** | bounded, not fixed |
| `J10` persistence | `09.b` `EXISTS` ASSUMED | |
| `J11b` yields | `RPC-001-11.b` `EXISTS` OWNER_RULING | |
| `J12` revelation | `VARTARGET-13.c` **`EXISTS` AUTHORED** | |

**Five items use `EXISTS` on a `FIELD` row.** A field exists on its element by schema, so those items
assert nothing the register does not already say — they were the restater's way of recording *"this
field is in play"*. `EXISTS` is an existence requirement and existence belongs to collections; the
engine uses it for class formation and it does nothing here.

> **What does `EXISTS` mean on a `FIELD` row?** Either it is inert and should be recorded as such, or
> it means something the grammar has never stated.

Reach: **general** — the grammar, not this contract. Five items today.

The knowledge underneath is **bucket 3**: whose set it is, how many members are live, what re-runs the
assignment. Variable Target is one optional condition; a game can be laid out and played without its
machinery resolving. It is not load-bearing for coherence.

---

## The four buckets, for this cluster

| | | Lines |
|---|---|---|
| **1 · General mechanism, settle before generation** | team designation (F1) · undescribed classes (F4) · `EXISTS` on a field (F6) · the gate reading established members (F5) | 9 + the mechanisms |
| **2 · Knowledge missing, required for coherence** | **`J3` — which team attacks which objective** (F2) · the objective reference as a structural reference (F3) | 4 + 1 |
| **3 · Knowledge unresolved, coherence unaffected** | the objective set's scope, cardinality, persistence, yield, revelation (F6) · the information-rule dimensions · the modifier's magnitude and operation · GA-INFORMATION's unregistered trigger | ~14 |
| **4 · Realization-sensitive, downstream** | the 23, unchanged, and now presumed legitimate-open | 23 |

---

## Pilot-readiness accounting

### What still prevents deterministic activity generation

**Nothing in the engine's behaviour.** It is deterministic and byte-identical under shuffled input,
every stage is stamped, and a run always returns a result. What it cannot yet do is hand a
*complete* game to a generator, and the reason is not the eighty lines — it is the four load-bearing
items below.

The honest qualifier: the derivation engine does not feed the generation pipeline today. Connecting
them is work nobody has scoped, and it is not a knowledge question.

### What still prevents structural coherence

Two Gate A checks fail and one that matters cannot run.

- **`GA-DIRECTION` is not evaluable**, and SD-07 makes direction an invariant. Blocked by Findings 1,
  2 and 3. **This is the load-bearing path.**
- `GA-NO-FAILED-LINE` fails on the eighty, most of which are not load-bearing.
- `GA-INFORMATION` fails on one unregistered trigger — bucket 3.

**So: one thing prevents structural coherence, and it is direction.** Everything else that fails is
either a consequence of counting failed lines or non-blocking.

### What still prevents representative validity

**We have no measure of it, and that is the finding.** No Gate A check asks it; Gate B reverse is not
applicable in derivation mode; you kept the third question — whether a coherent realized game
preserves the representative problem — deliberately out of Gate A on 16 September.

The nearest structural proxies are in place: one primary scoring event, resolved; a value model; and
direction, which is exactly what is blocked. **Representative validity is not blocked by a defect —
it is unmeasured by design, and the pilot is the instrument.**

### What can safely remain open for realization

**The 23**, now treated as presumed legitimate-open under your instruction. They did not move through
two mechanism corrections and a rebuild. Nothing in this pass touched them or found one that blocks
coherence.

### What remaining knowledge gaps are non-blocking for pilot

Roughly fourteen: the objective set's own structure, the information-rule dimensions, the modifier's
magnitude and operation, and the unregistered information trigger. A game lays out and plays without
any of them. They are real gaps and they are not on the path.

### Would another internal cluster teach us something coaches cannot?

**This one would — and I think it is the last one of which that is clearly true.**

It would, because three of its four findings are semantic questions about the representation that no
coach could answer: whether a team element carries a designation, whether an undescribed existence
assertion owes field values, what `EXISTS` means on a field. Those are ours and they are load-bearing
for direction.

After it, the pattern changes. What remains is one authored football fact (`J3`), about fourteen
non-blocking knowledge gaps, and twenty-three realization choices. **None of that is a mechanism
question, and the realization set has now survived two corrections unchanged.**

So my answer to the question you have been asking for two weeks: **one more cluster — this one,
completed — and then the next thing we learn should come from a coach.** Not because the internal
work runs out, but because what is left of it stops being load-bearing.

---

## What I did not do

- No ruling taken by interpretation. Findings 1, 3, 4 and 6 are returned.
- No knowledge authored, including `J3`, which is the one gap on the load-bearing path.
- The gate change in Finding 5 is identified and not made, because it belongs to this cluster.
- The three Wide Zone `S6` collisions are untouched. **This pass establishes that they do not block
  coherent realization**: they are on a channel's across-axis position, which is one of the twenty-
  three, and no Gate A clause depends on them.
- Set completion is answered rather than returned, because only one reading survived the trace.

Activity generation remains frozen.
