# Information Expression Review

**Framework — Current Working Version** · 2026-06-17

> Round 8C found **Information** to be the weakest environmental dimension: the switch-play test
> resolved into spatial/overload problems rather than producing observable information-management
> demands, and Challenge Calibration's "reduced/late information" directive has nothing in the library
> to realize it. This review scopes that gap. It is the sibling of the
> [Constraint & Incentive Framework](CONSTRAINT_INCENTIVE_FRAMEWORK.md) and follows the same rule:
> ground in the existing inventory, name the gap, and propose **targeted** mechanisms the lens reveals
> — not rows for their own sake. Building the candidates is a separate, sign-off-gated step.

---

## What "Information" means as an environmental dimension

In an ecological frame, *Information* is the **perceptual demand** the environment places on players —
how much they must perceive, and how hard it is to perceive it, before and during action. It is not
the same as space. Its sub-levers:

- **Scanning demand** — how many sources (ball, opponents, teammates, space, score/time) a player must
  read before acting.
- **Disguise / deception** — how knowable intentions and starts are in advance.
- **Uncertainty / variability** — how much players can pre-plan vs. must read live.
- **Visual access** — whether the relevant cue is in view (blind-side runs, play from behind).
- **Time-to-perceive** — how much time the environment allows to gather information (the perceptual
  face of Time/Pressure).
- **Information delay** — when the cue becomes available (revealed late vs. known up front).

---

## Current coverage audit (grounded in Test Library V0)

The constraint rows carry a `visibilityEffect` field (`increase` / `indirect_increase` / `neutral`).
**Critical distinction:** that field encodes *cue salience* — how visible the **rewarded** action is —
not *perceptual demand* or *information availability*. They are different things.

What the library actually does today with information:

- **Passive / byproduct only.** Spatial structures create things to read: Zone Structure (zone
  occupation), Neutral Player (support angles), Small Area (pressure reads), Counter-Press Window
  (the pressure picture), Pass Combination Gate (when to commit), Support Lane Requirement (lane
  occupation). These generate reading *demand* — but **indirectly, as a side effect of spatial setup.**
- **No active information levers.** Nothing in the 19 constraints manipulates information *availability*
  or imposes an explicit *perceptual* demand. Of the six sub-levers above, the library meaningfully
  touches only the first (scanning, and only passively). Disguise, uncertainty, visual-access
  restriction, and information delay have **zero** dedicated mechanisms.

This is exactly why 8C sees Information as flat: the engine can make a switch-of-play *valuable*
(Switch of Play Bonus) and make space *legible* (zones), but it cannot make a player *perceive under
disguise, scan under uncertainty, or read a blind-side cue.* Information currently rides on space.

---

## The gap, by lever

| Information lever | Library coverage today | Status |
|---|---|---|
| Scanning demand | Indirect (zones, support angles invite reading) | **Partial / passive** |
| Disguise / deception | None | **Missing** |
| Uncertainty / variability | None (selection is deterministic; targets are fixed) | **Missing** |
| Visual access (blind-side) | None | **Missing** |
| Time-to-perceive | Indirect (Small Area, time windows compress it) | **Partial** |
| Information delay | None | **Missing** |

---

## Candidate mechanisms (targeted — for sign-off, not yet built)

Each is a constraint that *actively* shapes a missing lever, written to invite perception, never to
script behavior (the framework guardrail holds: it must keep the problem open and multi-solution).

1. **Pre-Scan Requirement** *(scanning demand)* — an action (e.g. a forward pass or a turn) only
   counts when preceded by a genuine scan / shoulder-check; rewards gathering information before acting.
2. **Variable / Late Target** *(uncertainty + information delay)* — which goal/target/zone is live is
   revealed *after* play starts or changes during play, so players must perceive the live picture
   rather than pre-plan a route.
3. **Disguised Restart** *(disguise)* — possession restarts from a variable or coach-cued location
   instead of a fixed one, removing the pre-set picture and forcing a fresh read each repetition.
4. **Blind-Side Entry** *(visual access)* — a run or pass from outside the receiver's field of view is
   rewarded; trains perception of cues that aren't directly in front of the player.
5. **Multi-Goal Read** *(scanning + uncertainty)* — multiple goals/targets are simultaneously live so
   the attack must perceive which is open rather than attack a single known target.

These map one-to-one onto the missing rows in the gap table. They are **candidates**: the next step is
your sign-off on which are genuinely representative (vs. drifting into contrived perception drills),
then we build the validated subset and you test it.

---

## Connection to Challenge Calibration

Challenge Calibration already *asks* for this — the Demanding profile says "reduced or late
information — disguised/varied starts and a faster-changing picture that demands scanning," and
Comfortable says "clearer, earlier cues." But the AI has no constraint mechanisms to realize those
directives, so it falls back on space and timing — which is precisely the flatness 8C observed. These
candidate mechanisms are what would let calibration actually move the Information dimension.

---

## Recommendation & next step

Round 8C's strategic read is correct: shift development from adding Game Problems to **deepening
expression mechanisms, starting with Information** (weakest, and the most central to ecological design).
Concretely:

1. Sign off which of the five candidate mechanisms are genuinely representative.
2. Build the validated subset as new constraints (the targeted expansion this review justifies).
3. Re-test against the 8C / switch-play cases to confirm Information now produces observable
   perceptual demands, not just spatial ones.

Then the same lens applies to the next two expression gaps in priority order: **incentive / value
structures** (the two-sided-contest problem from the GF11 finding) and **transition-specific
environments**.
