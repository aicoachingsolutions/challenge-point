# Constraint & Incentive Architecture Review

**Framework — Current Working Version** · 2026-06-17

> Per the [Architecture Roadmap](ARCHITECTURE_ROADMAP.md), the deliverable here is a **framework**
> that clarifies how constraints and incentives shape the affordance landscape — **not** an expansion
> of the libraries. It organizes the *existing* 19-constraint inventory (Test Library V0) onto the
> shaping dimensions and gives design guidance. No new constraints are proposed.

Grounding: every constraint row already carries the metadata this framework rests on —
`constraintRole`, `primaryConstraintType`, `visibilityEffect`, `targetAffordancePrimary`,
`includesIncentiveLayer`, and `incentiveMechanism` (see `back/src/system/test-library/constraints.ts`).
Incentives are **not** a separate library: they are the constraints whose `includesIncentiveLayer` is
`true` (13 of 19). The framework below is read directly off those fields.

---

## The inventory, by role

The engine already groups constraints into three roles (`constraintRole`, mapped in selection as
foundation / shaping / consequence) and enforces a **role-mix rule**: every activity needs ≥1
foundation and ≥1 shaping constraint; consequence is optional. That rule is the spine of this
framework — each role owns a different shaping dimension.

| Role (`constraintRole`) | Count | Constraints | Owns |
|---|---|---|---|
| **Foundation** (`structure`) | 6 | Central Density Condition, Zone Structure Condition, Neutral Player Condition, Goalkeeper Included Condition, Small Area Condition, Transition Trigger | **Challenge** + the base Opportunity/Information landscape |
| **Shaping** (`hybrid`) | 4 | Wide Zone Advantage, Counter-Press Window, Pass Combination Gate, Support Lane Requirement | **Opportunity availability** + **Information** (sharpen a specific affordance; usually carry a light incentive) |
| **Consequence** (`consequence`) | 9 | Progression Bonus, Wide Utilization Bonus, Switch of Play Bonus, Interception Reward, Turnover Reward, Delay Reward, Final Third Value, Transition Bonus, Recovery Window | **Decision priorities** (value) |

---

# Part 1 — Constraint Framework

The roadmap poses four questions. Each maps to a field already in the data.

### Which constraints alter **challenge**?
The **foundation** constraints — they set the space / time / numbers / pressure baseline, i.e. the
Environmental Fit dimensions:

| Environmental Fit dimension | Expressed by |
|---|---|
| Space | Small Area Condition, Zone Structure Condition |
| Time | Small Area Condition (less time on the ball), Transition Trigger (no stoppage) |
| Pressure | Central Density Condition, Small Area Condition |
| Numerical Conditions | Neutral Player Condition (overload) |
| Information | (see below — visibility) |
| Transition Volatility | Transition Trigger, Counter-Press Window |

Challenge is therefore **structural**: it is set by *which foundation constraint(s) and at what scale*,
not by instructions. Calibration (U16 / Stretch / etc.) acts on these.

### Which constraints alter **information**?
The `visibilityEffect` field encodes this directly:

- **`indirect_increase`** — structural reference points that make the *picture* readable (zone
  boundaries, central density, neutral overload, compactness): Central Density, Zone Structure,
  Neutral Player, Small Area. They don't spotlight one action; they make pressure and space legible.
- **`increase`** — raise the salience of a *specific* opportunity: Goalkeeper Included, and every
  incentive-bearing constraint (the reward is itself an attention cue).
- **`neutral`** — connects phases without adding a cue: Transition Trigger.

So "information" = the perceptual landscape: zones, lanes, overloads, GK position, and the
visibility lift each incentive adds to its target cue.

### Which constraints alter **opportunity availability**?
The `targetAffordancePrimary` field names the affordance each constraint makes more reachable, and
the foundation/shaping constraints open or close the space those affordances live in:

- Open/create opportunity: Neutral Player (overload), Wide Zone Advantage (wide), Support Lane
  Requirement (penetration lane), Zone Structure (progression routes), Goalkeeper Included (space
  behind the line).
- Compress opportunity: Small Area, Central Density (denies central space → indirectly opens wide).

### Which constraints alter **decision priorities**?
The **incentive layer** — constraints with `includesIncentiveLayer: true`. By changing the *value* of
options they shift what players weigh. This is the bridge to Part 2.

**Framework takeaway:** role predicts dimension. Foundation → challenge + base opportunity/information;
shaping → sharpen a specific opportunity + its information; consequence → tilt decision priorities.
The selection engine's role-mix rule ("always a foundation + a shaping, consequence optional") is
exactly: *always set the challenge and opportunity baseline; only then optionally tilt value.* The
framework validates that rule rather than changing it.

---

# Part 2 — Incentive Framework

Incentives = the 13 constraints with `includesIncentiveLayer: true`. The `incentiveMechanism` field
gives five mechanism types; each influences play differently.

| `incentiveMechanism` | Constraints | Primary influence |
|---|---|---|
| `scoring_bonus` (on an under-used action) | Switch of Play Bonus, Wide Utilization Bonus, Progression Bonus, Pass Combination Gate, Support Lane Requirement | **Exploration** — drives players to discover/try the rewarded option; **attention** to that cue |
| `value_multiplier` (on a target area) | Final Third Value | **Exploitation** — cash in where value already concentrates |
| `defensive_reward` | Interception Reward, Turnover Reward, Delay Reward | **Tactical priority** shift toward defending actions (regain / delay) + attention to defensive cues |
| `time_window_reward` | Transition Bonus, Recovery Window, Counter-Press Window | **Risk / tempo** — commit-fast-vs-secure tension; shapes urgency and risk appetite |
| `positional_or_scoring_advantage` | Wide Zone Advantage | Hybrid — **opens** an opportunity *and* rewards using it (availability + value) |

Mapping to the roadmap's five influence dimensions:

- **Exploration** ← `scoring_bonus` on options players otherwise neglect (switch, width, combinations).
- **Exploitation** ← `value_multiplier` / final-third value on areas that already matter.
- **Attention** ← every incentive's `visibilityEffect: increase`: the reward *is* an attention magnet for its `targetAffordancePrimary`.
- **Risk** ← `time_window_reward` and contested windows (Counter-Press Window explicitly: escape = bonus, fail = opponent advantage → a real gamble).
- **Tactical priorities** ← `targetAffordancePrimary`: the incentive elevates that affordance in the team's priority order (defensive_reward → defend first; progression bonus → penetrate first).

### The ecological guardrail (the invariant)
Incentives raise the **value, attention, and visibility** of an opportunity. They must **not script the
behavior**. Every row's `contextualAudit` enforces "invite, not force," and the anti-scripting
validators back it. This is the same principle as Christian's GF11 finding — *compactness emergent,
not prescribed*: an incentive makes a solution worth considering; it never makes it the only solution.

---

## Open input — GF11 attacking-exploitation visibility

Logged from Round 7.4 activity-generation testing (Christian): in the Recover & Reorganize
environment, the **attacking** race to exploit the disorder "feels more implied than explicit." The
recovery window is present structurally (Transition Trigger + temporary defensive disadvantage), and
the defensive-side value is explicit (`Recovery Window` rewards the defense reorganizing), but the
attacker's incentive to punish *before* shape returns is carried only by the structure.

**Framework slot:** `time_window_reward` / **Risk**. Crucially, the candidate incentive **already
exists** — `Transition Bonus` is an attacker-side `time_window_reward` (`targetAffordancePrimary:
attack_quickly`) that rewards quick attacking inside a window. So this is a **routing** question (add
`Transition Bonus` to GF11's recover constraint pool, currently `Recovery Window / Zone Structure /
Transition Trigger / Central Density`), not a library expansion — consistent with this framework's
"organize what exists" stance.

**Open question for this review (decision deferred — do NOT patch GF11 in isolation):** does giving the
attacker's window an *explicit* incentive (`Transition Bonus`) improve representativeness, or does it
over-script the race and violate the guardrail above? Note the current pool deliberately leans
defensive (`Recovery Window` rewards the defense); adding an attacker-side reward also rebalances which
side the consequence layer favors. This is the first concrete test case for the Risk / time-window
category and should be resolved as part of the incentive framework, not as a one-off.

---

## How to use this framework (design guidance)

1. **Start with challenge** — pick the foundation constraint(s) that set the right space/time/numbers
   for the goal and calibration (the role-mix rule already requires a foundation).
2. **Shape the opportunity + information** — add a shaping constraint that makes the target affordance
   reachable and legible.
3. **Tilt decision priorities only if needed** — add a consequence/incentive to raise the *value* of
   the target affordance; choose the mechanism by the influence you want (explore vs. exploit vs. risk
   vs. defensive priority).
4. **Hold the guardrail** — the incentive must keep the problem a problem (multiple solutions), never
   collapse it into one prescribed action.

This is a framework for reasoning about the existing inventory; expansion should be driven only by
gaps this lens reveals (e.g. the attacker-side time-window incentive above), not by adding rows for
their own sake.
