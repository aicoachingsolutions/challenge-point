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

## Explicitly NOT doing before the pilot

- Adding the four missing mechanism types.
- Building an incentive → Environmental Manipulation trigger.
- Freezing a mechanism taxonomy or writing a standard.

Christian, 2026-08-23: *"I don't want to freeze that into a new standard yet… we've been strongest
when implementation and real coaching evidence refine the architecture rather than the other way
around."*
