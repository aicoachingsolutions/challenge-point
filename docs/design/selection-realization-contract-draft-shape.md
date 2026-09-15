# What Selection Must Make True — draft shape for the Selection → Realization Contract

Draft for Christian's sample, 14 September 2026. Implementation stays frozen. This is not an
implementation design, and it adds no library or canonical concept.

> "Once Challenge Point selects something, what must become true in the game because it was
> selected?" — Christian, 14 Sep

---

## The short answer to your two questions

**What could the runtime realistically consume before the model call?** Today it consumes one
structured object per activity: the primary scoring directive. That directive holds:
- an event from a controlled vocabulary;
- the object scored on;
- the qualifying condition;
- the coach's rule;
- what Setup must mark;
- the evidence that shows Setup marked it.

The only other structured inputs are the session's player count and field size. Everything else
crosses as text. The one structured object is also the one layer the audit found reliably functional.
So the smallest useful structure is the same kind of thing, extended to the rest of the game: typed
statements resolved before any language exists, and checked afterwards against those same statements.

**Specify independently, or against a structure?** Neither extreme.
- **Author in football terms, row by row, in the obligation shape below.** Use the controlled
  vocabularies the knowledge base already has, and free text only where none exists, marked as a gap.
- **Don't author against today's runtime.** It has no representation of the physical game, so
  fitting requirements to it would reproduce the problem.
- **The shape is runtime-neutral on purpose.** It is what any reconciler and any validator would
  need.

## What already exists

Both halves of the contract already exist, but separately.

### The obligations, as prose

Setup guidance is authored on Game Forms, constraints and Environmental Manipulations. It already
states much of what a selection must make true, often with parameters. It sits in the setup brief,
which the live model never receives.

| Selected item | Authored setup guidance | Obligation it already implies |
|---|---|---|
| Neutral Player Condition | "Designate one or two neutral players… Neutrals always play with the team in possession… Adjust team numbers accordingly" | 1–2 neutrals; they join the team in possession; totals reconcile |
| Pass Combination Gate | "a minimum of 4-6 connected passes in their half… Pass count resets when possession is lost or the ball leaves play" | a 4–6 pass qualifying condition; reset triggers |
| Wide Zone Advantage | "Mark wide channels along both touchlines (~6-10m wide)… earn an advantage (bonus point, free restart, or scoring multiplier)" | two wide regions of 6–10 m; an advantage exists |
| Variable Target Condition | "Mark 2-3 possible targets… revealed only after play crosses a trigger line, or switches on a coach cue… All targets stay physically available" | 2–3 objectives; activation changes on a trigger; all remain present |
| Goalkeeper Included Condition | "Goalkeepers in their normal goal positions at each end… Use full-size or scaled goals" | a goalkeeper and a goal at each end |
| Turnover Reward | none authored | nothing to realize: a real gap |
| GF2 Directional Possession | "a directional target line or zone at one end (typical: 40-60m long, 25-40m wide)… Teams attack in the same direction" | one target at one end, which needs confirming (question 1) |

### The vocabulary, as typed canon

None of this is bound to selectable items, and the runtime does not consume it.

| Source | What it already types | Runtime use today |
|---|---|---|
| Environmental Manipulation Schema v2.0 | 11 knowledge objects, 24 dimensions and 64 parameters (detail below) | version string only |
| Information Expression RC1.1 | 26 dimensions and 139 allowed values across availability, revelation, distribution and reliability; 26 integrity conditions; 6 presets, e.g. `LATE_REVEAL`, `CONDITIONAL_REVEAL`, `VARIABLE_TARGET_MEANING` | shadow reference |
| Game Archetype Workbook RC1.1 | 48 organizational integrity conditions, e.g. Invasion's "Opposition can deny, redirect, or reverse progression"; five Interaction Regulation families: Eligibility/Access, Timing/Sequence, Outcome/Scoring, Participation/Role, Restart/State | loader integrity check |
| RPC Library RC1 | begin conditions (14), end conditions (21), representative information (32), degenerate solutions (32), primary scoring conditions (8); identity rules as REQUIRED / SUPPORTING_IDENTITY / EXCLUSION; validation rules with expected evidence and a runtime stage | routing, form gating, scoring |
| Soccer Module Game Forms | typed columns for directionality, opposition structure, restart structure, role structure, minimum and maximum players, information expression. Only directionality, role and scoring structure are filled. | scoring structure only |
| Scoring event vocabulary + primary scoring directive | event, object, condition, what Setup must mark, evidence | consumed end to end |

The Environmental Manipulation Schema's 64 parameters cover:
- **Playing Area Configuration:** length, width, shape.
- **Performer, Objective and Environmental Object Configuration:**
  - position relative to the playing area, a boundary, a performer, an objective or an object;
  - direction (ahead, behind, wider…);
  - coordinate, distance or proportional location;
  - timing: initial, restart, conditional reset;
  - heading, and a facing reference that includes playing direction.
- **Participant Composition:** count, minimum and maximum.
- **Participant State:** active, inactive, waiting…
- **Objective Composition:** count.
- **Objective State:** active or inactive; temporary or persistent.

**The contract is the binding between those two halves, for each selected item, plus a rule for
when two obligations collide.** That binding is the only new structure proposed. It references
existing IDs rather than defining concepts.

## The shape

### Part 1 — the obligation row (what you would author)

| Field | What it holds | Values |
|---|---|---|
| `source` | The selected item that creates the obligation | library and ID: `tl-v0-constraint-neutral-player-condition`, `A01-02`, `RPC-001`, `GF2`, `IE-C006` |
| `subject` | The part of the game it constrains | a game-specification section below, plus the entity, e.g. participants · neutral |
| `requirement` | The kind of statement | EXISTS · COUNT · RANGE · EQUALS · POSITIONED · ORIENTED · CHANGES_ON · NOT_EXISTS · NOT_DOMINANT |
| `value` | What must be true | a controlled value from the vocabularies above, or a number or range with its unit |
| `strength` | How binding it is | REQUIRED · SUPPORTING · EXCLUSION, the RPC identity roles reused |
| `owner` | Who fixes a value inside a range | KNOWLEDGE (fixed) · COACH (chooses within range) · SESSION (derived from field and players) |
| `precedence` | What happens when it collides with another obligation | yields to, or overrides, a named source; or FAIL, never resolved silently |
| `evidence` | How satisfaction is checked | a check on the game specification (e.g. neutral count ≥ 1), and whether coach text must state it |
| `needs_vocabulary` | Free text where no controlled value exists | flags a gap; never guessed |

### Part 2 — the game specification the rows are about

This is the resolved game, before any language.

| Section | Holds | Existing vocabulary |
|---|---|---|
| Area | length, width, shape, from the session | EM-0001; session field |
| Regions | channels, corridors, zones, grid cells: orientation, extent, position | **none**: EM v2.0 has no knowledge object for a sub-area (question 5) |
| Participants | teams, outfield counts, goalkeepers, neutrals, target players; who each plays for | EM-0006, EM-0007; Participation/Role |
| Objectives | goals, lines, target zones, gates, target players: count, position, owner, state, and role (**SCORED** or **REPRESENTATIVE**) | EM-0003, EM-0009, EM-0010; scoring event vocabulary |
| Direction | which objective each team attacks and defends | EM facing reference (playing direction); Soccer Module directionality |
| Start and restart | initial state; restart after a score, out of play, a turnover | EM timing (initial / restart / conditional reset); RPC begin conditions; Restart/State; Soccer Module restart structure (empty) |
| Interaction | eligibility, timing and sequence (pass counts, windows), how opposition starts | Eligibility/Access, Timing/Sequence; RPC exclusion rules |
| Scoring | primary event, object, qualifying condition; value modifiers | primary scoring directive (exists) |
| Consequences | trigger, effect, beneficiary | Outcome/Scoring, Restart/State |
| Information | what is available, revealed or distributed, and what changes it | IE dimensions and presets; EM objective state |
| Invariants | checked whatever was selected | area fits; counts reconcile to the session; every referenced object exists; every team has a direction; Game Archetype and IE integrity conditions |

**Check the specification, not the text.** Obligations are checked on the specification. Searching
coach language for "neutral" is the keyword validation the audit showed cannot tell a working game
from a broken one. A second, lighter check confirms that the coach text states every REQUIRED
element.

## Worked against the audit's hostile cases

**Neutral Player Condition** (Environmental Manipulation, foundation). *Resolves: no neutral in 6 of
6; "10 players in a 6v6 format".*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| participants · neutral | RANGE | 1–2 | REQUIRED | COACH |
| participants · neutral | EQUALS (plays for) | team in possession | REQUIRED | KNOWLEDGE |
| invariant · players | EQUALS | outfield + goalkeepers + neutrals = session players; teams even | REQUIRED | SESSION |

**From Goal Kicks** (Practice Situation A01-02). Overrides the Game Form's "restarts from the team
that didn't touch it last". *Resolves: 0 of 3 goal-kick restarts; goals removed.*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| objectives · goal | EXISTS | at the building team's defending end; role REPRESENTATIVE | REQUIRED | KNOWLEDGE |
| participants · goalkeeper | EXISTS | for the building team | REQUIRED | KNOWLEDGE |
| start | EQUALS | goal kick from that goal | REQUIRED | KNOWLEDGE |
| restart · ball out over the building team's end line | EQUALS | goal kick | SUPPORTING | KNOWLEDGE |

**Wide Zone Advantage** (Environmental Manipulation, shaping). *Resolves: advantage removed; central
weighting kept.*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| regions · wide channel | POSITIONED | 2, along both touchlines, 6–10 m wide | REQUIRED | COACH |
| consequences · action in or through a wide channel | EXISTS | bonus point, free restart or scoring multiplier | REQUIRED | *needs your choice (question 2)* |
| scoring · value modifier | NOT_EXISTS | a modifier valuing central actions above wide ones | EXCLUSION → FAIL | — |
| invariant · geometry | EQUALS | both channels fit inside the field width and leave a central area | REQUIRED | SESSION |

**Pass Combination Gate** (Interaction Regulation). *Resolves: no passing requirement in 41 of 42.*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| scoring · qualifying condition | RANGE | 4–6 connected passes in own half before a score counts | REQUIRED | COACH |
| interaction · pass count | CHANGES_ON | resets when possession is lost or the ball leaves play | REQUIRED | KNOWLEDGE |

**Variable Target Condition** (Environmental Manipulation, information). *Resolves: no target
varies.*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| objectives · target | RANGE | 2–3, all physically present | REQUIRED | COACH |
| objectives · target state | CHANGES_ON | live target revealed after a trigger line is crossed, or on a coach cue (authored bank of four) | REQUIRED | COACH |
| information | EQUALS | IE-C006 `VARIABLE_TARGET_MEANING` | REQUIRED | KNOWLEDGE |

**Goalkeeper Included Condition** (Environmental Manipulation, foundation). *Resolves: 0 of 60 contain
a goal while 57 start attacks from a goalkeeper.*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| participants · goalkeeper | COUNT | 1 per team | REQUIRED | KNOWLEDGE |
| objectives · goal | EXISTS | one per end; REPRESENTATIVE unless scored | REQUIRED | KNOWLEDGE |

**RPC-001 Goalkeeper Build-Out.** *Resolves: a scoring object placed relative to moving players (59
of 60).*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| start | EQUALS | goalkeeper possession or a controlled defensive restart (authored begin condition) | REQUIRED | KNOWLEDGE |
| objectives · scored line or zone | POSITIONED | a fixed place, e.g. a proportional location from the defending end, not "beyond the first defenders" | REQUIRED | *needs your value* |
| interaction · opposition | NOT_DOMINANT | coordinated high press (exclusion; becomes RPC-002) | EXCLUSION | KNOWLEDGE |

**Through Wide Areas** (Practice Situation A01-04). *Resolves: a game scored only through the
centre.*

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| regions · wide | EXISTS | wide channels | REQUIRED | KNOWLEDGE |
| scoring | NOT_EXISTS | a condition under which only central progression scores | EXCLUSION → FAIL | — |

**Turnover Reward** (Interaction Regulation, consequence). No realization is authored. The shape
exposes the gap instead of hiding it.

| Subject | Requirement | Value | Strength | Owner |
|---|---|---|---|---|
| consequences · forced turnover | EXISTS | *effect and beneficiary needed; how a "forced" turnover is judged* | REQUIRED | *needs vocabulary* |

**The three Game Forms.** One row each for its defining structure, from its authored guidance:
- **GF2:** direction EQUALS "teams attack in the same direction… toward the target". Confirm this
  (question 1).
- **GF3:** regions COUNT a 3 × 3 grid. The guidance says "typical", so the strength is unsettled
  (question 4).
- **GF7:** regions COUNT 3 or 5 lengthwise channels. REQUIRED.

## Collisions the audit already found

Each needs a precedence rule. Without one, the default is FAIL. That matches your RC1.1 principle
that validation should fail rather than infer.
- Slot value weighting (central over wide) against Wide Zone Advantage and Through Wide Areas.
- One way to score against consequence rewards (Turnover Reward, Progression Bonus, a wide bonus
  point).
- Removing unscored objects against representative objectives (goals with goalkeepers).
- Even team numbers against neutrals and 7v5 overloads, within the session's player count.
- The Game Form restart against a Practice Situation start (From Goal Kicks).
- Game Form layout against the session field (54 m of channels on 30 m).

## Questions only you can answer before the sample

1. **Direction in GF2.** The authored guidance has one target at one end, with teams that "attack
   in the same direction". Is that intended for Directional Possession, or should each team attack
   its own end?
2. **Consequences and scoring.** Can a consequence award points alongside the primary scoring event?
   Or must it be expressed as possession, restart or advantage, so there is still one way to score?
3. **Precedence.** When obligations collide, is there an order among RPC, Practice Situation, Game
   Form, constraints and the emphasis's slot modifiers? Or is it FAIL by default?
4. **Typical values.** When setup guidance says "typical" or "e.g." (GF3's 3 × 3 grid, Wide Zone's
   6–10 m), are those REQUIRED ranges or SUPPORTING suggestions?
5. **Regions.** EM v2.0 has no knowledge object for a sub-area. Is a channel, corridor or zone an
   Environmental Object Configuration, part of Playing Area Geometry, or a gap?
6. **Family IDs.**
   - The Game Archetype Workbook lists Environmental Manipulation families EMF-001–006, with 5 and 6
     as Transition Triggers and Environmental Elements.
   - The EM Schema v2.0 lists EMF-01–06, with 5 and 6 as Environmental Objects and Playing Surface.
   Which is canonical for binding?

## What this is not

- **Not an implementation design.** It says nothing about how the runtime would resolve or hold the
  specification. Implementation stays frozen.
- **Not a new library or canonical concept.** Rows reference existing IDs. The only new thing is the
  row itself, which is the contract you named.
- **Not a fix list.** The audit's failures remain hostile tests for whatever contract results.
