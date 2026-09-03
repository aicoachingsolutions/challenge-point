# Discovery Register — Representative Incentive

**Status: OPEN, collecting. Not a standard, not a decision.**

Christian's instruction (2026-08-23): capture these as discovery notes, let Pilot RC1 show how coaches
respond, and write a *Representative Incentive Architecture* immediately after the pilot while the
evidence is fresh. Nothing here is to be implemented as architecture before then. The point of this
file is that the observations survive the pilot instead of being reconstructed from memory afterwards
— which is the same failure mode as the telemetry gap, one level up.

---

## The question that started it

> Should an incentive be able to change the environment, or should incentives **trigger**
> Environmental Manipulations while Environmental Manipulation continues to own the actual change?

**Christian's current instinct: the latter**, not frozen.

> "Earning an additional attacker feels like the incentive triggering an Environmental Manipulation
> rather than Incentive itself owning player availability. Likewise, unlocking a new target, moving a
> scoring zone, or removing a restriction all feel like changes to the environment that are earned
> through an incentive rather than incentives themselves."

**Implementation note, for whoever writes the architecture.** If that boundary holds, an incentive is a
*trigger + reference*, not a change: it names a condition and points at an Environmental Manipulation
to apply. That composes with what already exists — the EM library is canonical and versioned, and RV
already emits protected invariants and revalidation triggers, so an incentive that fires an EM is a
revalidation event rather than a special case. It also keeps Incentive out of the business of knowing
what an attacker *is*, which is what makes the layer sport-neutral.

The alternative — Incentive owning environmental change — would duplicate EM inside Incentive, and the
first thing to break would be sport-neutrality.

---

## What the coach's six examples actually are

Christian's list, sorted by whether the runtime can express it today.

| Example | Reads as | Authored today? |
|---|---|---|
| switching play earns **bonus points** | value of an outcome | ✅ `scoring_bonus` |
| switching play creates a **limited-time scoring opportunity** | value of an outcome, time-bounded | ✅ `time_window_reward` |
| (weighted zones, multipliers) | value of an outcome | ✅ `value_multiplier` |
| defending actions score | value of an outcome | ✅ `defensive_reward` |
| switching play earns a **positional advantage** | value of an outcome | ✅ `positional_or_scoring_advantage` |
| switching play earns an **additional attacker** | change to the environment | ❌ none |
| switching play **unlocks a new scoring option** | change to the environment | ❌ none |
| switching play **changes the field or target** | change to the environment | ❌ none |
| switching play **removes a restriction** | change to the environment | ❌ none |

**The line falls exactly where Christian's instinct put it.** Everything currently authored values an
outcome; everything missing changes the environment. That is evidence for the boundary, not proof —
but it is the first thing the post-pilot document should look at.

---

## State of the knowledge (2026-08-23)

- **Five mechanisms authored** on the realizations sheet: `scoring_bonus` ×6, `defensive_reward` ×3,
  `time_window_reward` ×3, `value_multiplier` ×1, `positional_or_scoring_advantage` ×1, `none` ×9.
- **All five now reach the coach.** Until 2026-08-22 none of them did: the projection into runtime
  dropped `incentiveMechanism` entirely, and only `scoring_bonus` had an expression branch, which
  emitted a placeholder naming no condition. Guarded now by `projection-integrity.unit.ts`.
- **`incentive_patterns` is empty on all 23 rows.** Phrasing is currently DERIVED from each
  constraint's `description`. `expressIncentive` already prefers authored patterns when present, so
  populating that column is a pure improvement with no code change. The adapter needs one line to map
  it when it is populated — noted in `systemAssemblyInputFromSelection.ts`.

---

## Open observations to test against pilot evidence

1. **Within one planning selection, all three activities share the same constraints**, so they share
   the same incentive mechanisms and differ only in the weighting around them. Whether coaches
   experience that as "three versions of one game" is a question only coaches can answer — and it is
   the same question as the long-standing realization-diversity item, arriving from a new direction.
2. **Does an incentive mechanism change what a coach observes?** The claim behind the whole layer is
   that a time-window reward produces a different session from a bonus. If coaches do not report
   different player behaviour, the mechanism taxonomy is presentational rather than representative.
3. **Do coaches read the incentive as a rule or as a value?** The current wording appends the
   mechanism after the authored condition. If coaches read it as one more rule to enforce, the
   framing is wrong even where the mechanism is right.
4. **Does `none` (9 of 23) read as an absence?** Those constraints produce no incentive line at all.
   Deliberate — a placeholder is what we just removed — but worth checking that the resulting activity
   does not feel like it is missing a section.

---

---

## 2026-08-31 — RVD-06 observed in the field, by the person who specified it

Christian ran a generated activity with his own team. It was representative and understandable, and
his players immediately found the cheapest way to succeed: **launch the ball into the attacking zone
and run onto it.** Requiring the ball to enter on the ground removed the long balls and produced a
second degenerate solution — attackers stationed high, "cherry picking". What finally produced the
intended problem was making the halfway line act as an **offside line**: supporting angles appeared,
players stayed connected, possession recycled, organised attacks emerged.

He coached none of those behaviours. He removed the unintended affordance and the intended problem
surfaced on its own.

**This is RVD-06 from his own Representative Validation spec** — *"what is the easiest way to win
without engaging the intended problem?"* — encountered live rather than reasoned about. Two things
worth recording while it is fresh:

1. **It is the first concrete entry for the Degenerate Solution Pattern Catalogue** that RVD-06 calls
   for. The pattern has a recognisable shape: *bypass the intended problem by playing over it*, and
   its counter is a **positional constraint** (an offside line) rather than a technical prohibition
   (must be on the ground). The technical prohibition failed and produced a second degenerate
   solution; the positional constraint worked. That ordering is the transferable lesson, not the
   offside line itself.

2. **THE PRODUCT ASSUMPTION IT EXPOSES, which is the bigger finding.** The activity assumed a coach
   who could recognise an unintended affordance and adjust the environment while preserving
   representativeness. Christian has that skill. His own framing: we cannot assume the average high
   school or youth coach does. So a generated activity is currently a *starting environment* that
   presumes expert in-session adaptation — and the pilot cohort will contain coaches on both sides of
   that line.

**Why this matters for reading pilot evidence, not for building now:** a coach reporting "it didn't
work" may have met a degenerate solution and lacked the adjustment, which looks identical in the data
to a poorly generated activity. Worth asking about directly before concluding the engine failed. The
nine-code observation vocabulary already has "activity becoming predictable", which is the closest
existing signal.

Explicitly NOT building a degenerate-solution detector before the pilot. Christian: *"I don't think
this is something we solve before the pilot."*

## Explicitly NOT doing before the pilot

- Adding the four missing mechanism types.
- Building an incentive → Environmental Manipulation trigger.
- Freezing a mechanism taxonomy or writing a standard.

Christian, 2026-08-23: *"I don't want to freeze that into a new standard yet… we've been strongest
when implementation and real coaching evidence refine the architecture rather than the other way
around."*
