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

## Decision & implemented subset

Reviewed against the Information-vs-Observation distinction (below). Four mechanisms were approved and
**built** (commit `cde6bf9`); Pre-Scan Requirement was **rejected**. Each approved mechanism shapes what
is *perceivable* — scanning is expected to emerge as an adaptation, never rewarded directly.

1. **Variable / Late Target** *(uncertainty + information delay)* — which target/gate is live is revealed
   only after play crosses a trigger line, or changes on a cue, so teams read the live picture instead of
   pre-planning a route. *In an activity:* three gates across the far line; which one scores isn't known
   until the attack reaches the middle third.
2. **Multi-Goal Read** *(scanning + uncertainty)* — two or three goals live at once, defended
   differently; the attack perceives which is open now. *In an activity:* small goals spread across the
   end line, all live; defenders can't cover all, so the open one keeps moving.
3. **Blind-Side Entry** *(visual access)* — advantage created from outside a defender's view is worth
   more; rewards the *relationship*, not a set run. *In an activity:* a finish from a run that arrived
   behind the last line counts double.
4. **Disguised Restart** *(disguise)* — scoped narrowly to variable-entry pictures: the ball enters from
   one of several last-moment locations, so neither team can rehearse and both read live. *Not* a
   reaction-time or signal-guessing task. *In an activity:* each repetition is served from a different
   gate chosen at the last moment.

**Rejected — Pre-Scan Requirement.** Framed honestly ("a forward pass counts only after a shoulder-
check"), it rewards the scan itself — an observable *behavior*, not a change to the information
landscape. If the environment genuinely hides information, scanning should emerge as one adaptation; if
it doesn't, that is information for the coach, not something the activity should force.

### Information layer vs. Observation layer
- **Information layer** (this review): what is available, hidden, delayed, uncertain, or changing in the
  environment — shaped by design.
- **Observation layer**: what coaches notice performers *doing* while interacting with that information
  (scanning, anticipation, recognition) — observed, not forced.

The four approved mechanisms sit in the Information layer; Pre-Scan crossed into the Observation layer.

### Implementation note
Three of the four use `visibilityEffect: decrease` (which emits a "reduced information or delayed
visibility" guardrail) and `primaryConstraintType: information`. They are routed into the
spacing/possession/break-lines groups. One known limit: selection scoring is coupled to selected-lens
alignment, so these lean toward appearing for build-up/space goals broadly rather than precisely on
information intent — the same expression-layer limitation flagged in the Constraint & Incentive
framework, and the natural next architectural item.

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
Progress:

1. ~~Sign off which candidate mechanisms are genuinely representative.~~ **Done** — four approved, Pre-Scan rejected.
2. ~~Build the validated subset as new constraints.~~ **Done** (commit `cde6bf9`).
3. **Next — Christian:** re-test against the 8C / switch-play cases to confirm Information now produces
   observable perceptual demands, not just spatial ones.

Then the same lens applies to the next two expression gaps in priority order: **incentive / value
structures** (the two-sided-contest problem from the GF11 finding) and **transition-specific
environments**.
