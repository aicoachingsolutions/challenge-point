# The first real selection across the deterministic boundary

28 September 2026. 194 tests, suite green. `npm run bounded:selection -- A05`.

**All five proposed pilot goals produce a structurally shaped resolved game, and `GA-DIRECTION` passes
on every one.** The run exposed two representation problems, both in the bridge between selection and
derivation rather than in the engine, and I am returning them rather than deciding them. **Do not lock
the bounded corpus until the first is settled**, because it changes what the corpus is.

---

## 1. The Variable Target trigger — restated, and the failure came back sharper

`VARTARGET-05.b` is restated under SD-79 as a machine-readable set of its five authored alternatives.
The dagger the restater used to mark off-list members is preserved as data (`offListMembers`), the
authored sentence stays beside it, and nothing is added or dropped.

### It made the gate stop failing, which was the wrong outcome

`GA-INFORMATION` went from **FAIL** to **NOT_EVALUABLE — "0 unregistered trigger(s)"**.

Restating the value turned one derived string into a permitted set, and the check reads only a derived
value. The three unregistered members were still there; the gate had stopped looking at them.

That is exactly what you told me not to let happen, so I corrected the check rather than the corpus:
**a rule names a registered trigger when every trigger it could name is registered.** Reading the
permitted set is reading what the run established — the same move SD-99 authorised — not new
semantics.

### What remains genuinely unresolved: three members, and only two are vocabulary

| Member | |
|---|---|
| `REGION_ENTRY {trigger region}` | **registered** |
| `REGION_ENTRY {final third}` | **registered** |
| `COACH_CUE` | unregistered — **a vocabulary question, with an argument against it** |
| `FIRST_FORWARD_PASS` | unregistered — **a genuine vocabulary need** |
| `REGION_ENTRY {attacking half} + first receiver` | unregistered — **not a vocabulary question at all** |

The restatement did the work you hoped it would: **three of five were never the problem.** `REGION_ENTRY`
with an argument in braces is the register's own notation, so reading past the argument is reading the
register. The check does that and nothing more.

**The third case is a representation defect, not a missing trigger.** `REGION_ENTRY` is registered; what
is missing is a way to *qualify* an information trigger. Transitions have `qualifier.lastTouch`,
`qualifier.endLine`, `qualifier.region`; an information rule's trigger has no qualifier row at all. So
"a region entry, by the first receiver" cannot be said — and adding a trigger named after it would be
putting a qualifier in the trigger vocabulary to avoid admitting the row is missing.

**`COACH_CUE` still has the argument against it that I flagged**, and it is stronger now that it stands
alone: `VARTARGET-15.a` requires the trigger to be *"detectable by players and causally connected"*,
and `VARTARGET-14.a` already marks `EXTERNAL_SIGNAL` off-list on the information dimension. A coach cue
may belong outside the boundary.

**Nothing added.** Returned as three separate rulings, not one.

**And `GA-INFORMATION` cannot pass on the corpus even if all three were settled** — its *first* clause
is blocked on three information subjects that are open text (`connected-pass count`, `which member of
this object's candidate set is live`). Those name quantities and states, not held elements, so SD-98's
typed reference does not reach them. That is a separate representation question and I am not opening it.

---

## 2. Practice situations — the coverage uncertainty, resolved, and it is worse than a floor

### The map

| Goal | Practice situations offered |
|---|---|
| **A01** Play Out from the Back | **4** — Against High Pressure · **From Goal Kicks (contracted)** · Through Central Areas · Through Wide Areas |
| **A05** Progress the Attack | **none** |
| **A04** Beat Defenders 1v1 | **none** |
| **TA01** Attack Quickly | **1** — Immediately After Winning Possession |
| **TA02** Secure Possession | **1** — Under Immediate Pressure |

### Which additional objects they select or alter: **none, and that is the finding**

`TestLibrarySelectionInput` has four fields — learning goals, learning-goal id, sport, session
description. **There is no practice situation in it.** The situation enters at *assembly*, as a prompt
directive, and is recorded on the activity's trace. It selects nothing and alters no selection.

**So a practice situation currently reaches derivation not at all.** I measured what that costs, by
adding `A01-02` to A01's selection by hand:

| A01 | lines | derived | areas present | transitions |
|---|---|---|---|---|
| as the pathway selects | 49 | 19 | envelope · space · value · objectives · transitions | one `CONTINUE` |
| with *From Goal Kicks* | **62** | **25** | + **objects** | **the goal kick**: `STOP_RESUME`, `awardedTo DEFENDING_TEAM`, its trigger qualifiers |

> **"Play Out from the Back — From Goal Kicks" currently derives a game with no goal kick in it.**

A practice situation is canonical knowledge carrying real structure — a transition, a restart team, an
Objects area — and the pathway passes it as a sentence to a prompt. **This is the first of the two
problems I am returning.**

### Can a practice situation be constrained without changing the goal's meaning?

| | |
|---|---|
| **A05, A04** | Nothing to constrain — no situation exists. No meaning is at risk |
| **TA01, TA02** | One situation each, so there is no choice to constrain. Contracting it is not a constraint, it is the goal |
| **A01** | **No.** Its four situations are four different football problems. Restricting a coach who chose *Play Out from the Back* to goal kicks alone would hand them a narrower goal than the model defines, and they would have no way to see that it had happened |

### The true minimum contract set

| | Contracts | Goals |
|---|---|---|
| **If practice situations stay out of derivation** | **5** — the constraints only | 5 |
| **If they enter derivation, A01 included honestly** | **10** — 5 constraints + `TA01-01` + `TA02-01` + A01's three uncontracted situations | 5 |
| **If they enter derivation and A01 leaves the pilot** | **6** — 4 constraints + `TA01-01` + `TA02-01` | 4 |

**Five was a floor, and which number replaces it is your ruling, not a measurement.** The middle row is
the honest one if the derived game is supposed to mean what the coach chose.

---

## 3. The first real bounded selection

`Session Planning goal → knowledge selection → derivation → gates → resolved game`, over whichever
selected objects have contracts, reporting the rest as missing rather than substituting anything.

| Goal | contracted / selected | lines | derived | open | unestablished | collisions | **`GA-DIRECTION`** |
|---|---|---|---|---|---|---|---|
| A05 | 3 / 5 | 49 | 19 | 6 | 20 | 3 | **PASS** |
| A01 | 3 / 5 | 49 | 19 | 6 | 20 | 3 | **PASS** |
| A04 | 2 / 5 | 39 | 15 | 6 | 14 | 3 | **PASS** |
| TA01 | 2 / 5 | 37 | 16 | 3 | 14 | 0 | **PASS** |
| TA02 | 2 / 5 | 37 | 16 | 3 | 14 | 0 | **PASS** |

**Gate A fails on `GA-NO-FAILED-LINE` and nothing else.** Every other non-passing check is
`NOT_EVALUABLE` — blocked, never violated. **No check reports the game as incoherent.**

And the object reads as a game. A05's:

- an envelope, and an axis;
- three channels and a target region at the attacking end;
- a primary event worth 1, conditioned on a connected-pass combination in the attacking team's own
  half, with the count's reset triggers;
- an information rule about the pass count;
- an objective referencing the target region **as a typed structural reference**, attacked by
  `EACH_TEAM`, role `PRIMARY_SCORING`;
- a transition that continues play and starts an episode.

Five lines are open, and they are the right five: the target's noun and its extent across the axis, and
where the three channels sit along it. **Placement, left to realization.**

### Classified, as you asked

| | |
|---|---|
| **Load-bearing mechanism / representation** | **(a)** the practice situation never reaches derivation (§2) · **(b)** affordance lenses are selected and contracted by nothing (below) |
| **Missing contract knowledge** | central density · progression bonus · turnover reward · switch-of-play bonus · interception reward. **Recorded as the bounded corpus, not reopened as architecture** |
| **Realization-layer responsibility** | the open placement lines, on every goal |
| **Legitimate authorized freedom** | the same five, and the target's noun where GF2 authored *zone or line* |

**(b), the second returned problem.** Selection commits to eight objects for A05: one game form, four
constraints and **three affordance lenses**. The lenses have ids, are chosen by scoring, and shape
what the activity rewards — and they are not knowledge with contracts, so they contribute nothing to
the derived game. Either a lens is knowledge that should say what it makes true, or it is a reasoning
dimension outside the representation. **I have not decided which**; the run simply shows that three
eighths of what selection commits to is invisible to derivation.

**The three collisions** on A05, A01 and A04 are Wide Zone's one sentence restated twice, carried into
a real game for the first time. Still on a channel's across-axis position, still not load-bearing —
but they now appear in a game a coach would be given, which is a different standing from sitting in a
conformance corpus.

---

## 4. The bounded corpus is **not** locked

Per your instruction: this exposed two representation problems, so I stopped rather than proceeding to
lock it. The practice-situation question in particular changes what the corpus *is* — five contracts or
ten — and locking a set that may be missing every practice situation would be locking the wrong thing.

Everything else is ready to lock the moment that is settled.

---

## 5. Realization layer — the design brief

The resolved-game output is the input boundary and the target is narrow: **can a structurally valid
resolved game become one concrete, playable game without losing support, inventing structure, or
closing a freedom the system has no authority to close?**

### What it receives

Four lists, and the last three matter more than the first: `game` (what the knowledge fixed), `open`
(what it may choose, with authority and bounds), `existential` (what must exist without being
described), `notEstablished` (what nobody said).

### What it may do — exactly three things

1. **Choose a value for a line in `open`**, inside the bounds carried with it, recording the choice and
   its authority. Nothing else may be chosen.
2. **Instantiate a member satisfying an `existential` claim**, recording that it did so. *"At least one
   team exists"* becomes a team; the claim is satisfied, not described retroactively.
3. **Refuse**, naming what it could not do.

### What it may not do — and each has a rule behind it

| | |
|---|---|
| Fill anything in `notEstablished` | that converts missing knowledge into a choice, which is the governing rule |
| Choose outside the bounds on an open line | the bounds are authored; exceeding them is inventing knowledge |
| Add an element, region, objective or transition the game does not hold | SD-47 and SD-83: derivation establishes structure; realization does not |
| Treat a `CARRIES` or `ADAPTED` value as adjustable | those are derived values with support, whatever their route |
| Proceed where `coherence.mayRealize` is false | Gate A's claim is the precondition |

### The first test, which is not an activity

Take one resolved game with `mayRealize` true, close its open lines and satisfy its existential
claims, and emit a concrete game plus a realization record. Then check three things mechanically:

- **nothing lost** — every derived value survives unchanged into the concrete game;
- **nothing invented** — every concrete value traces to a derived value, a recorded choice within
  bounds, or a recorded instantiation;
- **nothing closed without authority** — no line in `notEstablished` has a value in the concrete game.

**That third check is the one worth building first**, because it is the one that fails silently. A
realization layer that quietly fills a gap produces a game that looks better and means less, which is
the failure this whole phase has been built to prevent.

No coach language, no activity variation, no slot diversity. One game, faithfully.

---

## 6. What I did not do

- Added no trigger vocabulary. Three rulings returned separately.
- Did not lock the bounded corpus.
- Did not author any contract.
- Did not decide the practice-situation or affordance-lens questions.
- Did not investigate the attack/defence perspective hypothesis, and saw nothing in these runs that
  bears on it — five attacking goals produced five games of the same shape, which is neither evidence
  for it nor against it.

Coach-facing generation remains frozen.
