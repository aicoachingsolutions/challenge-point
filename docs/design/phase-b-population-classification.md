# Phase B — the remaining population, classified

27 September 2026. Classification only; nothing repaired or authored from it.

SD-90 and SD-91 are applied first, because the first changes the population. The classification that
follows is of the **96 failed lines that remain after them**.

---

## Part 1 — SD-90, the ADAPTED disposition

Applied as ruled, and kept narrow. A `PREFERRED_DEFAULT` contribution is displaced when an applicable,
support-capable required contribution authoritatively resolves the same property; the required
contribution supplies the value, the default leaves collision resolution, it receives the disposition,
its source stays visible, and adaptation supplies no support.

**Which axis "required" names.** The displaced side is a *value status*, and SD-08 — the decision §3
cites — is the decision that names the three value statuses, so the displacing side is read as
`valueStatus: REQUIRED_RANGE`. This is a real choice: the corpus carries items where value status and
strictness disagree in **both** directions (two `PREFERRED_DEFAULT`/`REQUIRED`, nine
`REQUIRED_RANGE`/`SUPPORTING`). On today's corpus the two readings coincide exactly, so nothing rides
on it yet; a test pins the reading rather than leaving it to be rediscovered.

**The two cases you distinguished, kept distinct.** A default whose value *differs* has adapted and
takes `ADAPTED`. One that names the *same* value adapted to nothing — calling it adapted would be
false — so it stays `SATISFIED`. Both leave `entailing`, so **neither adds support**, which is the
part your second bullet asks for.

### What it did

| | |
|---|---|
| `T2` on the goal kick | `UNRESOLVED` → **`RESOLVED:ENTAILED` = `DEFENDING_TEAM`** |
| `GF2-16.a` | `NOT_REALIZED` → **`ADAPTED`**, preferring `NOT_LAST_TOUCH`, displaced by `A01-02-05.a` |
| `GF2-17` on three `T6` lines | stays `SATISFIED`; the three lines drop from two supports to one |
| collisions | 1 → **0** |
| derived · failed | 34 · 97 → **35 · 96** |

**No equivalence is claimed.** The engine does not conclude that `DEFENDING_TEAM` and `NOT_LAST_TOUCH`
name the same team. They do here, and RC-22 still says two designations are equal only if they map to
one entry. The default is displaced because the property was resolved without it. A test asserts the
line's support contains only the required contribution, and a corpus-wide test asserts **no displaced
contribution appears in any line's support anywhere**.

### One thing displacement broke, caught by reading the output

Removing the default from `entailing` also removed it from the forward stage's idea of which lines an
item *reached*, so `GF2-17` — which had adapted to nothing and was satisfied — came back as *"its
realization conditions are not satisfied"*. False, and it would have read as a regression in the
Neutral Player and GF2 contracts. A displaced contribution still reached the line; reaching it is why
it could be displaced. Fixed, and the reach is asserted in the test.

---

## Part 2 — SD-91, conditional standing decisions

Applied as ruled and as a separate mechanism. Where a citable standing decision carries an explicitly
authored condition on another property's value and that property is authoritatively resolved, the
condition is evaluated; where the governing value is unresolved, free, failed or valueless, nothing is
inferred.

Tested generally rather than against SD-13: every case uses a standing decision that does not exist in
the canonical register, on Space rows, with no transition involved. One case constructs a governing
line that is *derived but valueless* — resolved by a route that carries no value — and asserts the
condition is not evaluated.

**The corpus result is unchanged, as you expected.** SD-13 is the only conditional decision the
register carries and the corpus holds no `START` element; a test asserts it fires on no line.

---

## Part 3 — the remaining 96 lines, in your four categories

| | | |
|---|---|---|
| **1 · Internal deterministic** | **53** | derivation, representation or contract questions; no domain knowledge is missing |
| **2 · Knowledge-authoring** | **20** | authoritative football knowledge that is genuinely absent |
| **3 · Realization-sensitive** | **23** | structure established; the particular value may appropriately vary |
| **4 · Outside current boundary** | **0** | — see below |

**Category 4 is empty, and that is a structural fact rather than an omission.** The boundary is
enforced one level up: 34 items are `NOT_CHECKABLE_OUTSIDE_REPRESENTATION` and produce no line at all.
Nothing that is outside the boundary can appear in a line population, so the count is zero by
construction.

### Category 1 — internal deterministic (53)

| Cause | Lines | What it is |
|---|---|---|
| **Wide Zone's own-involvement set is empty** | 12 | below |
| **A selector-fixed attribute does not reach its own line** | 16 | below |
| Transition qualifiers that the trigger makes inapplicable | 10 | `T1a`/`T1b`/`T1c` on transitions whose trigger has no such qualifier. A `POSSESSION_CHANGE` transition has no end line; the register enumerates the line anyway |
| Per-element count against collection cardinality (`O3`) | 5 | GF4's own declaration states the relation the engine does not: *"The count is held on O1 (COUNT sums O3)"* |
| A mobile object's layout position (`O4`/`O5` on the two ball elements) | 4 | A01-02's declaration says it moved: *"The ball's layout position was never examined. Its position at the restart moved to T4"* |
| An objective's reference, blocked behind its role (`J2`) | 3 | `GF2-08.b` and `RPC-001-08.c` author the reference but their reach is undetermined because `role` is not fixed — a dependency on the row above |
| `EXISTS` on a `FIELD` row (`J7`, `J12`) | 2 | the contract asserts the field is present and supplies no value, so the line is unauthored although the contract claims it |
| Modifier combination (`V10`) | 1 | the specification gap SD-59/SD-60 already recorded |

**Wide Zone Advantage authors its channels completely, and not one property reaches them.** Eleven of
its twenty-five items are scoped `OWN_INVOLVEMENT`, and own involvement is computed as *the classes
this contract formed from items in the other scopes*. Every channel class it forms comes from an
`OWN_INVOLVEMENT` item, so the set is empty and all eleven reach nothing — including `WIDEZONE-02.a`,
the existence item that forms the channels in the first place.

> **An `OWN_INVOLVEMENT` existence item cannot seed the involvement its own contract is scoped to.**

Variable Target escapes this only because its two object-existence items happen to be `WHOLE_GAME`.
The knowledge that never arrives includes the noun (`channel`), the position across
(*"touchline-adjacent"*), the width (*"about 6–10 m"*), the axis extent (*"end line to end line"*) and
the functions — all `AUTHORED`, all unreachable. This is the single largest identified blocker in the
population and it is not a knowledge gap.

**Sixteen lines are on a row the element's own selector already fixes.** `c:blind:GF4:I03` is formed
by a selector reading `noun = half`, and its `S3` (noun) line is unauthored. The same for the goal
kick's two trigger qualifiers, four condition types on RPC-001, three object kinds, two objective
roles. The contracts wrote this down repeatedly — *"fixed only through the S2 selector (RC-16)"*,
*"Kinds are fixed only through O1 selectors"*, *"Types are fixed only through V3 selectors"*. The
question is general and it is a derivation-composition one:

> **When an element's selector fixes an attribute, does the corresponding field line derive from it?**

A small inconsistency found while measuring this, reported and not corrected: the register spells the
transition qualifier rows `transitions[].qualifiers.lastTouch` in `path` and `qualifier.lastTouch` in
`selectorAttributes` — singular against plural for the same field.

### Category 2 — knowledge-authoring (20)

Domain knowledge that is genuinely missing and can be supplied without watching anybody coach.

| | Lines | Example |
|---|---|---|
| Objective role and scope (`J4`, `J6`) | 4 | which objectives are `PRIMARY_SCORING`; whose candidate set it is — `06.d` is `ASSUMED` and the contract says so |
| The goal kick's taker and method (`T3`, `T5`) | 2 | both still `ASSUMED`; they follow once `T2`'s chain is settled |
| Primary-event condition referents and parameters (`V5`, `V6`) | 3 | *"no operational test for 'controlled on arrival'"*; no threshold for a long clearance |
| Information rule trigger, state dependency, access holder (`V17`, `V21`, `V22`) | 4 | *"whether the live target is knowable to both teams or only the attacker"* — a design commitment that changes the problem |
| Modifier magnitude and operation, referents (`V9`, `V9a`, `V8b`) | 3 | only `TYPICAL_EXAMPLE` contributions exist, and SD-73 kept them inert deliberately |
| Objective-set cardinality, persistence, yields (`J8`, `J10`, `J11b`) | 3 | `ASSUMED` values the contract itself flags |
| The trigger region's noun (`S3`) | 1 | *"'trigger line' is not a region noun"* |

### Category 3 — realization-sensitive (23)

Structure established; the value may appropriately vary with coach, players, space or session.

| | Lines | Why it varies |
|---|---|---|
| **Region and object placement** | **10** | see Part 4 |
| Information reveal: trigger type, timing, progression (`V18`, `V19`, `V20`) | 6 | *when* the pass count is announced, or how a target reveal is staged, is delivery a coach adapts. What is revealed, and to whom, is category 2 above |
| Goalkeepers (`P3`) | 2 | every contract but RPC-001 non-claims them: *"whether goalkeepers exist, how many, or which team has one"* |
| The candidate targets' physical kind (`O2`) | 2 | cones, mini-goals or mannequins; the contract explicitly does not constrain it |
| The restart region — L3 (`T4`) | 1 | held open on your instruction |
| The neutral group's participation persistence (`P13`) | 1 | whether a neutral joins permanently or rotates |
| Which candidate starts live (`J9`) | 1 | it must not be predictable (`VARTARGET-16.b` forbids a team determining it in advance), so it is a per-session choice by design |

---

## Part 4 — the twenty placement lines, and a correction

Last week I reported that twenty of the failures were one question twenty times over — where a region
or object sits along or across the axis — and that they leaned toward coach observation. **Half of
that is wrong, and it changes the reading.**

| | |
|---|---|
| Genuinely realization-sensitive | **10** |
| Blocked by an internal mechanism, nothing to do with realization | **10** |

The ten blocked ones are Wide Zone's six (its authored positions cannot reach its channels) and the
four ball-position lines (a mobile object's layout position, which A01-02 says moved to the restart
row). Neither is a question a coach could answer, because in both cases the answer is either already
written down or not owed.

**The ten that remain are realization-sensitive, and I have not tried to make them resolve.** They are
the target region's extent across the axis, the trigger region's position, the two halves' across-axis
extent, the goal or target positions in GF4, and the candidate targets' separation. The knowledge
says as much itself, in its own words:

- Wide Zone: *"no scaling rule for width; 'depending on field size' gives no function"*;
- GF2: *"notAuthored: length of a target line; whether a line or zone spans the full width"*;
- Variable Target: *"minimum perceivable separation between candidates; no distance, proportion…"*;
- GF4: *"Direction needs one goal/target at each end, but the knowledge does not author positions"*.

Three of those four state a *dependency on the actual space*, and the fourth states a structural
commitment (one at each end) without a position. **The pattern is that the structure is authored and
the interval is not, and the interval is what changes with the pitch you have.** I would not author
numbers for them. The GF4 line is the one exception worth naming: *"one at each end"* is a knowledge
commitment that would bound the placement without fixing it, and that is category 2 work sitting
underneath a category 3 question.

---

## Part 5 — dependencies between the categories

1. **The selector-attribute mechanism (1) gates objective references (1) and roles (2).** `J4` is
   sixteen-block on two elements and category 2 on three others; `J2`'s three lines are blocked
   because `GF2-08.b` and `RPC-001-08.c` cannot determine their reach while `role` is unfixed. Settle
   the mechanism and part of both moves.
2. **Wide Zone's scope block (1) hides everything else about its channels.** Until it clears, no
   statement about whether Wide Zone's knowledge is complete can be trusted — six of the ten blocked
   placement lines are its.
3. **The transition-qualifier block (1) shrinks if the trigger-key finding below is settled**, because
   three of the four transitions would become one.
4. **Realization-sensitive placement depends on knowledge-authoring underneath it.** A coach can
   choose where the target line sits; they cannot choose that there is one at each end. Category 3 is
   only safely open where category 2 has fixed the structure around it.

---

## Part 6 — what genuinely prevents a representative activity

Gate A fails on three checks. Two are consequences of the population; one is a structural failure in
its own right.

**Three separate transitions claim the same trigger key.** `blind:GF4:I06`, `restated:GF2:GF2-07.a`
and `restated:NEUTRAL-PLAYER-CONDITION:NEUTRAL-12.a` all key on `POSSESSION_CHANGE`. Three contracts
each authored what happens at a turnover, and SD-47 forms one class per existence item, so the game
has three turnover transitions where it can have one. `GA-TRIGGER-UNIQUE` fails on exactly this.

It is the same shape as SD-84, one level along: there, a collection the schema fixes at exactly one
takes several supporting contributions as supporting **one** element. Here the schema keys `T1` *by
trigger*, so the trigger key is the identity, and three contributions to one key plausibly support one
transition. I have not acted on it — extending SD-84's reasoning to a keyed collection is a general
derivation rule and it is yours.

**So, of the 96, what actually blocks a coherent representative activity:**

| | |
|---|---|
| The three turnover transitions | a real structural incoherence; Gate A names it |
| Wide Zone's twelve | the game cannot lay out channels whose properties never arrive |
| Direction | `GA-DIRECTION` is blocked because no team class carries a designation and no objective names the team attacking it — that is SD-07's invariant, unmet |
| The primary objective's reference (`J2`) | without it there is nothing to score on; blocked behind `J4` |

**What could appropriately stay open:** all 23 realization-sensitive lines, and the information-delivery
choices among them. An activity can be produced, laid out and played with those unfixed — a coach
fills them by setting the session up. They are what a pilot would inform; they are not what is
stopping us.

---

## Part 7 — the pilot boundary, restated on this evidence

Last week's reading was that the remainder had turned mostly into knowledge and realization work.
**The classification does not support that as strongly as the raw census did.**

| | |
|---|---|
| Internal deterministic | **53 of 96 — 55%** |
| Knowledge-authoring | 20 — 21% |
| Realization-sensitive | 23 — 24% |

The reason last week's figure read differently: a line whose reason code is *"declared gap"* looks
like missing knowledge, and 64 of them were. But a declared gap only records that some object said it
could not author the row — it says nothing about whether *another* object authored it and failed to
reach. Wide Zone's twelve are declared gaps with the knowledge sitting in the same contract.

**Two mechanisms account for 28 of the 53**, and both look like the general rules the earlier clusters
turned out to be. So the honest reading is: the deterministic work is not nearly finished, and the
next cluster should be one of those two rather than a knowledge cluster.

**The realization-sensitive 23 are real, and they are the pilot's material.** They are also stable —
nothing in them will be settled by more internal reasoning, and I am not going to try. But they are
24% rather than the larger share last week implied, and half the placement lines I pointed at turned
out to be blocked rather than open.

I would put the boundary at: **not yet, and for a more specific reason than before** — two general
mechanisms are still ahead of us, and one of them is currently hiding an entire contract's knowledge
from the engine. When those are settled, the remainder will be mostly categories 2 and 3, and that is
the point at which the question becomes worth asking again.
