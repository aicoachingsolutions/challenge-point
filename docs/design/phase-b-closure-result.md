# Phase B — the closure run, and the pilot-boundary result

27 September 2026. SD-95 to SD-100 implemented; corpus rerun from scratch. 179 tests, suite green.

**The boundary does not pass, and it misses by one authored designation — which is the case your own
ruling told me to return rather than infer.** Everything else in the load-bearing path is closed.

---

## 1. What the six rulings did

| | before | after |
|---|---|---|
| lines | 153 | **125** |
| derived | 51 | 51 |
| failed | 80 | **57** |
| open | 10 | **5** |
| Gate A checks failing | 2 | **2** — `GA-INFORMATION`, `GA-NO-FAILED-LINE` |
| **`GA-DIRECTION`** | not evaluable, blocked | **not evaluable, *pending* on one line** |

**SD-97 removed twenty-eight lines.** Three objectives, two teams, two object classes and one
objective set are established by assertions with no selector; each was being asked separately for
fields nobody owed.

**SD-98 resolved two references** that had established no structural identity. `GA-REFERENCE-INTEGRITY`
went from nought resolved to two, and `GA-REGION-FUNCTION`'s blocked set from six lines to two.

**SD-99** did what you said it would: the region-function clauses now read established membership, and
the set-valued field stays unauthored. Membership did not close the set anywhere.

**SD-100** made five contributions inert and took them off the lines they were bounding.

**SD-95** rewrote the direction clause to ask what the objective structure establishes. No team class
is consulted, and nothing is paired. A test asserts the check reads no team property at all.

---

## 2. The case I am returning — ruling 2

> *"If any individual game form does not actually establish the relationship from its source, return
> that case rather than infer it."*

**GF2 does not establish it, and its own restatement says so.** The evidence on `GF2-12.a` reads:

> *Assumption: "toward the target" at "one end" (singular) means one objective for both teams; **the
> original records this as unreconciled with "building from their own end"**.*

and its fit-note adds: *"J3 also carries NOT_AUTHORED for the shared-or-per-team question."*

The source sentence is *"Teams attack in the same direction, building from their own end toward the
target."* One target at one end, or one per team, are both readings of it, and the restater recorded
the conflict rather than resolving it. **Returned.**

There is nothing else to author. `RPC-001-11.a` carries `BUILD_OUT_TEAM` from its own selector under
SD-92, and the other three objectives stopped owing a team under SD-97. **One line in the corpus needs
this relationship: `GF2-08.a::J3`.**

### What happens when it is settled

I probed it rather than guessing. With `GF2-12.a` authored as the designation `EACH_TEAM`:

> **`GA-DIRECTION` PASSES** — all three structural clauses, with the fourth outside the boundary as
> always. Gate A's failing checks stay at `GA-INFORMATION` and `GA-NO-FAILED-LINE`.

So direction is exactly one authored designation from established, and that designation is a football
question about a source sentence that contradicts itself: **does a Directional Possession game have
one target both teams attack, or one each?**

It is worth saying that this is the shape the boundary always predicted it would take. The last thing
standing between us and structural coherence is not a mechanism. It is a question about how the game
is actually set up.

### One thing to know before authoring it

The obvious authoring has a side effect, and I would rather you saw it first.

`GF2-12.a`'s selector is `role=PRIMARY_SCORING`, which reaches **both** primary objectives — including
`RPC-001-11.a`, whose own selector defines it as *the build-out team's* objective. Under SD-92 an item
beats a selector, so authoring GF2's rule at that breadth **replaces `BUILD_OUT_TEAM` with
`EACH_TEAM` on RPC-001's objective**, and nothing objects.

I verified it: authoring it as prose produced exactly that, and the direction clause then reported one
designation instead of two. Authoring it as the bare designation happens to pass anyway, because a
shared target satisfies the clause on its own — but the override is still happening underneath.

**That is the new mechanism dependency this pass exposed** (§4).

---

## 3. The population, in your four buckets

Fifty-seven failed lines and five open ones.

| | Lines | |
|---|---|---|
| **1 · General mechanism, before generation** | **21** | transition qualifiers the trigger makes inapplicable (10) · per-element count against cardinality (3) · the two balls' layout position (4) · Wide Zone's one sentence restated twice (3) · modifier combination (1) |
| **2 · Knowledge required for coherence** | **17** | **`GF2-08.a::J3`**, the returned case · the unregistered information trigger, which is the one substantive Gate A failure · Wide Zone's axis extent, assumed (3) · the goal kick's taker and method (2) · condition referents and parameter (3) · modifier magnitude, operation, referents (3) · the trigger region's noun (1) · information state dependency and access holder (3) |
| **3 · Knowledge unresolved, coherence unaffected** | **6** | region functions (`S4`). **No clause requires the complete set any more** — SD-99 settled it, and what is known is read |
| **4 · Realization-sensitive, downstream** | **14** | see below |

### The 23 became 14, and I have to correct something I said

Nine of the twenty-three left the line population under SD-97, because they were fields of objects
nobody individuated: the candidate targets' kind and positions, the two teams' goalkeepers, and which
candidate starts live.

**I told you on the last pass that the set was stable under mechanism corrections. This correction
moved nine of them, so that claim needs qualifying.** What held before was stability under
corrections that changed *reach*; SD-97 changed *enumeration*, and enumeration is what the set was
counted from.

The questions themselves did not disappear — a coach still chooses whether the targets are cones or
mini-goals. They moved out of the engine's line population and into the realization layer, which is
where you have been saying they belong. But the engine no longer names them, and that is a real loss
of visibility that matters for §6.

**The fourteen that remain**: the target's and the halves' across-axis extent and the trigger region's
position (4) · GF4's two goal or target positions (2) · the information reveal trigger type, timing
and progression (6) · the neutral group's participation persistence (1) · the restart region, L3 (1).

---

## 4. Did implementing these expose a new load-bearing dependency?

**Yes, one.**

> **An item may entail a value that contradicts the defining selector of the class it reaches, and
> nothing notices.**

A class's selector is what individuates it — `RPC-001-11.a` *is* "the PRIMARY_SCORING objective of the
build-out team". Reach is decided by comparing an item's selector against the class, never its value.
So an item whose selector reaches the class may then entail a value that contradicts the class's own
definition, and under SD-92 the item wins because an item always beats a selector.

The result is a class whose identity says one thing and whose line says another.

**It does not occur in today's corpus** — the three selector-versus-item differences SD-92 found are
spellings of the same value, not contradictions — **and it occurs the moment `J3` is authored the
obvious way.** That is why I am reporting it attached to the authoring rather than as a separate
cluster.

Reach: **general.** It applies to every selector attribute on every collection — nineteen rows.

The plausible treatments, not chosen: refuse the reach (a selector that contradicts the class does not
apply to it); record it as a collision between the class's definition and the item; or rule that a
defining selector is constitutive and an item cannot override it, which would be a bounded exception
to SD-92's subordination. All three are yours.

**No other dependency appeared.** The set-completion question is closed by SD-99 as far as any clause
is concerned, and nothing else moved.

---

## 5. Pilot-boundary result

> *"Can the engine now deterministically establish a structurally coherent activity, including
> direction, while leaving the presumed legitimate realization-sensitive choices open?"*

**Not yet, and by one item.**

| | |
|---|---|
| **Deterministically** | **Yes.** Byte-identical under shuffled input, every stage stamped, a result always returned |
| **Structurally coherent** | **No, and narrowly.** Gate A fails on two checks: `GA-NO-FAILED-LINE`, which is a count, and `GA-INFORMATION`, on one unregistered information trigger |
| **Including direction** | **No, and by one line.** `GA-DIRECTION` is pending on `GF2-08.a::J3` and **passes the moment it is authored** |
| **Leaving realization open** | **Yes.** Fourteen lines are left open and nothing blocks on them, including the Wide Zone collisions, which sit on a channel's across-axis position |

**Two things stand between here and the criterion**: the returned `J3` case, which is a football
question you own; and Variable Target's unregistered information trigger, which is a vocabulary
question. Neither is a mechanism.

**On the Wide Zone collisions:** the rerun confirms they are not load-bearing. No clause depends on
them; they are on one of the fourteen. Left recorded and untouched.

---

## 6. Connecting derivation to generation — the scope, conditional

You asked for this if the boundary passes. It does not, by one authored fact, so take this as the
scope for when it does.

**The gap is not a wire. It is that the two halves speak different languages about different things.**

| | Derivation | Generation |
|---|---|---|
| Input | eight hand-restated contracts | a coach's typed or guided goal |
| Knowledge | the eight-area register | the test library, RPC library, soccer module |
| Output | 125 resolution lines with verdicts | an activity a coach reads |

### Five pieces of work, in dependency order

1. **A resolved-game output.** The engine emits lines, not a game. Something must assemble derived
   lines into the object a generator can consume — areas, elements, values — and refuse where the
   game is not coherent. Small, and entirely ours.
2. **A realization layer.** Fourteen lines are deliberately open and **SD-97 stopped the engine naming
   nine more**. Generation cannot proceed until something decides them, records what it decided, and
   marks it as a realization choice rather than knowledge. This is the piece that does not exist at
   all, and §3's visibility loss lands here.
3. **Contracts for the rest of the library.** Eight knowledge objects have contracts; roughly
   sixty-nine need them. **This is the largest single item and it is authoring, not engineering.**
   Until it is done the engine can only derive games from the eight.
4. **Selection to derivation.** `generateSelection` picks archetypes, lenses and constraints; the
   engine takes a selection of contracted objects. Mapping one to the other is straightforward once
   (3) exists and impossible before it.
5. **Generated-activity conformance.** Derive a game, realize it, generate from it, and check the
   activity against the derived game rather than against prose.

### Prerequisites that would prevent starting conformance testing now

- **Contracts for the objects a real selection reaches.** A live goal reaches objects with no
  contract, so there is nothing to derive from. This is the blocker.
- **The realization layer**, because a game with fourteen open lines cannot be generated from.
- **Generation is frozen**, which is yours to lift.

**What could start immediately, if you want it in parallel:** (1), the resolved-game output, because
it depends only on the engine and would make the realization layer's input concrete. It is also the
smallest way to find out whether the eight-area representation actually carries what a generator
needs — which is a question none of Phase B has tested.

---

## 7. What I did not do

- Did not author `J3`. Returned, as ruled.
- Did not act on the selector-contradiction finding.
- Did not implement the transition-qualifier applicability mechanism (10 lines) — not ruled.
- Did not touch the fourteen, the Wide Zone collisions, or the non-blocking gaps.
- Did not begin another Phase B cluster.

Activity generation remains frozen.
