# Challenge Point — Developer Architecture Roadmap

**Current Working Version** · last updated 2026-06-17

> This is **not** a product roadmap. It is an architectural reference describing how the
> system is currently understood to function and where development effort is likely to
> provide the highest value. Structure is evidence-driven and revisable.

It summarizes the current architectural understanding following:

- Learning Goal Coverage Testing
- Resolution Testing
- Defensive Testing
- Environmental Fit Testing
- Regression Spot Checks
- Positional Context Testing
- Game Problem Boundary Testing
- Selection Debug Investigation

---

## Current Working Architecture

```
Learning Goal
  ↓
Game Problem Resolution
  ↓
Affordance Priorities
  ↓
Archetype Selection          (Structural Environment)
  ↓
Constraint Selection         (Environmental Shaping)
  ↓
Incentive Selection          (Value Shaping)
  ↓
Activity Assembly
  ↓
Representative Design Validation
```

---

## Layer Definitions

### Learning Goal
Coach-facing input. Examples: *Create Space*, *Recover Organization*, *Regain Possession*, *Protect Space*.

### Game Problem
A recurring interaction challenge. Current provisional set:

- Create Space
- Protect Space
- Recover Organization
- Regain Possession
- Delay Progression
- Create Numerical Advantage
- Transition Attack
- Create Chances
- Prevent Counterattacks

Current evidence supports maintaining a **dedicated Game Problem layer**.

### Affordances
Action opportunities that may emerge while solving a Game Problem. Examples: Space Creation Opportunity, Space Exploitation Opportunity, Line-Breaking Opportunity, Recovery Opportunity, Delay Opportunity, Regain Opportunity.

> Affordances are **not** Game Problems. They are opportunities that emerge **within** Game Problems.

### Archetypes
Structural environmental templates. Examples: Positional Play Games, Channel Games, Transition Games, **Recover & Reorganize** (now built).

Purpose: provide structural possibility spaces.

> **Important:** current evidence suggests archetypes do **not** primarily determine affordance
> landscapes. They provide the environmental structure within which constraints and incentives operate.

### Constraints
Environmental shaping mechanisms. Current Environmental Fit dimensions:

- Space
- Time
- Pressure
- Information
- Numerical Conditions
- Transition Volatility

Purpose: influence environmental relationships and affordance availability.

### Incentives
Value-shaping mechanisms. Examples: transition rewards, regain rewards, recovery rewards, wide-utilization bonuses, switch bonuses.

Purpose: influence attention, decision priorities, and tactical value relationships.

---

## Current Architectural Assumption

Recent testing suggests:

- **Game Problems** identify recurring interaction challenges.
- **Archetypes** provide structural environments.
- **Constraints** shape environmental relationships.
- **Incentives** shape value relationships.

**The interaction of archetypes, constraints, and incentives creates the affordance landscape
experienced by players.** This represents a refinement of earlier thinking that may have
overemphasized archetypes as the primary source of affordance emergence.

---

## Game Problem Findings

### Create Space vs. Exploit Space
- **Evidence:** same routing, same archetypes, nearly identical affordance rankings and constraint packages.
- **Decision:** do **not** promote Exploit Space to its own Game Problem.
- **Interpretation:** *Create Space* = Game Problem; *Space Creation* and *Space Exploitation* = affordance lenses. No immediate development work required.

### Protect Space vs. Recover Organization
- **Evidence:** distinct routing, distinct affordance priorities, distinct environmental demands.
- **Decision:** maintain as **separate** Game Problems.

### Recover Organization
- **Evidence:** resolution largely correct, affordances largely correct, environmental expression incomplete.
- **Interpretation:** a **coverage** problem, not primarily a routing problem.

---

## Immediate Development Priorities

> Status note (2026-06-17): all three items below have shipped to the `serene-dewdney` preview.
> See [Implementation Status](#implementation-status).

### Recover Language Coverage
Expand routing robustness for: *recover defensive shape*, *restore compactness*, *reorganize after losing shape*, and similar recovery-oriented phrasing. **Goal:** prevent unintended attacking resolution.

### Protect Space Cleanup
Remove residual Recovery-lens activation when not supported by selection logic. **Goal:** reduce validation noise.

### Recover & Reorganize Archetype
**Justification:** Recover Organization requires structural conditions not consistently available within current archetype coverage. **Proposed characteristics:**

- Defensive team begins from disrupted organization
- A temporary attacking advantage exists
- A recovery window exists
- The attack attempts exploitation before recovery
- The defense attempts restoration of *functional* organization

> The archetype should create the **structural conditions**. Constraints and incentives should
> continue to shape much of the resulting affordance landscape. The defensive objective is
> "restore **functional** defensive organization," with compactness as one **emergent** solution,
> not the prescribed target.

---

## Next Architectural Review

> **Status (2026-06-17):** a first framework for both reviews below is drafted in
> [CONSTRAINT_INCENTIVE_FRAMEWORK.md](CONSTRAINT_INCENTIVE_FRAMEWORK.md) — it organizes the existing
> 19-constraint inventory onto the shaping dimensions (no expansion) and logs the GF11
> attacking-exploitation-visibility item as the first test case. Round 8C then identified
> **Information** as the weakest expression dimension; see
> [INFORMATION_EXPRESSION_REVIEW.md](INFORMATION_EXPRESSION_REVIEW.md), which scopes the gap and
> proposes targeted information mechanisms (sign-off gated). The emerging priority for the next phase
> is **expression-mechanism depth over Game-Problem breadth** (Information → incentive/value
> structures → transition environments).

### Constraint Architecture Review
**Purpose:** clarify the role of constraints in shaping affordance landscapes. **Questions:** which constraints alter challenge? information? opportunity availability? decision priorities? **Deliverable:** a constraint *framework* — not necessarily constraint expansion.

### Incentive Architecture Review
**Purpose:** clarify how incentives influence exploration, exploitation, attention, risk, and tactical priorities. **Deliverable:** an incentive *framework* — not necessarily incentive expansion.

---

## Game Problem Library V1

Proceed with a **provisional** Game Problem Library. Do not wait for ontology certainty; do not treat as finalized. Structure should remain evidence-driven and revisable.

---

## Mid-Term Development

- Challenge Point Calibration Framework
- Observation Layer Architecture
- Reflection Layer Architecture
- Representative Design Review
- Coach Communication Standard — the coach-facing output layer (translation of engine conclusions into
  practical coaching language); design spec in [COACH_COMMUNICATION_STANDARD.md](COACH_COMMUNICATION_STANDARD.md),
  adopted gradually as Activity Assembly is refined.

## Long-Term Development

- Coach usability refinement
- Field testing
- Library expansion driven by observed gaps
- Future cross-sport exploration if warranted

---

## Current Strategic Assumption

The strongest evidence currently supports:

- **Game Problems** as the organizing layer of the system.
- **Archetypes** as structural environmental templates.
- **Constraints and incentives** as the primary shapers of affordance landscapes within those environments.

Future development should prioritize improving **environmental expression** and **coach usability**
rather than pursuing ontology completeness before field testing.

---

## Implementation Status

Reflecting work on the `claude/serene-dewdney-c78e18` line as of 2026-06-17:

| Item | Status | Reference |
|---|---|---|
| Exploit Space stays an affordance lens (no new Game Problem) | Decision — no build | — |
| Protect Space cleanup (drop residual Recovery-lens activation) | **Shipped** | commit `63e658f` |
| Recover language coverage (recover/reorganize/after-losing-shape) | **Shipped** | commit `63e658f` |
| Recover & Reorganize archetype (GF11) + recover routing | **Shipped** | commit `5f272b9` |
| Selection Debug candidate rankings ("why it won") | **Shipped** | commit `cc43b6b` |

Open follow-up: the test-library CSV→TS generator is lossy (drops `coachVocabulary`/`setupGuidance`); `archetypes.ts` is maintained by hand and the generator must not be naively re-run until fixed.
