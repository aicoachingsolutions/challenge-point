# What Selection Must Make True — draft shape for the Selection → Realization Contract

Draft for Christian's vertical slice. First version 14 September 2026; revised 15 September with his
decisions on the six open questions. Implementation stays frozen. This is not an implementation
design, and it adds no library or canonical concept.

> "Once Challenge Point selects something, what must become true in the game because it was
> selected?" — Christian, 14 Sep

**Governing principle (Christian, 15 Sep):** *Selection ≠ Realization, and Realization ≠ Mention.* A
requirement is satisfied only when its intended functional effect exists in the player–environment
interaction.

**Authoring question:** if this knowledge object is selected, what must be observable in the game for
us to truthfully say it was realized? That is kept separate from prescribing the activity's solution.

---

## Decisions of 15 September

| # | Question | Decision |
|---|---|---|
| 1 | Direction | **Invariant:** each team has a stable, perceivable direction of progression and at least one functional directional objective. In the normal opposed invasion realization, each team attacks one direction and defends the opposite. Both teams attacking one target can still be a valid *authored realization*, but it does not define Directional Possession. GF2's current wording ("Teams attack in the same direction") is to be corrected, not bound. |
| 2 | Consequences and scoring | **One primary scoring event.** A consequence normally changes the game state: possession, restart/state, temporary numerical advantage, access/eligibility, spatial advantage, target availability, continuation. **One exception:** where explicitly authored, a consequence may change the *value* of the primary scoring event without creating a competing definition of success. "Cross the line = point" plus, separately, "complete five passes = point" violates the principle. |
| 3 | Collisions | **No universal precedence hierarchy.** Reconcile only where an authored ownership or relationship rule explicitly permits it. Otherwise fail loudly and return to selection. RPC scoring ownership is an established rule: the Context decides which physically available event reinforces its Primary Scoring Identity. |
| 4 | Typical values | Three value statuses: **REQUIRED RANGE** (outside it is invalid), **PREFERRED/DEFAULT** (use when feasible, adapt to context), **TYPICAL/EXAMPLE** (informative only). A value becomes a validity boundary only when canonical knowledge defines it as one. |
| 5 | Regions | No new Environmental Manipulation knowledge object, and no ontology change. A channel, corridor, zone or half is a spatial region within the realized playing area. **Knowledge** requires or organizes the region and states its functional relationship; **realization** instantiates the actual region. The resolved game needs a generic way to represent a region, so geometry and relationships can be reconciled and validated. |
| 6 | EM family IDs | Neither version is bound until the artifacts are reconciled. The expectation is that the canonical Environmental Manipulation RC1 library owns family IDs and names. The conflicting rows went to Christian. |

## The short answer to the runtime question

**What could the runtime realistically consume before the model call?** Today it consumes one
structured object per activity: the primary scoring directive. That directive holds:
- an event from a controlled vocabulary;
- the object scored on;
- the qualifying condition;
- the coach's rule;
- what Setup must mark;
- the evidence that Setup marked it.

The only other structured inputs are the session's player count and field size. Everything else
crosses as text. The one structured object is also the one layer the audit found reliably
functional. So the contract extends a mechanism that already works: typed statements resolved before
any language exists, and checked afterwards against those same statements.

**How to author:** in football terms, row by row, in the shape below. Use existing controlled
vocabularies where they exist, and mark gaps where they don't. Don't fit the rows to today's runtime:
it has no representation of the physical game.

## What already exists

### The obligations, as prose never sent

| Selected item | Authored setup guidance | What it implies, graded by decision 4 |
|---|---|---|
| Neutral Player Condition | "Designate one or two neutral players… Neutrals always play with the team in possession… Adjust team numbers accordingly (e.g., for 15 players: 6v6 + 3 neutrals, or 7v7 + 1 neutral)" | At least one neutral (REQUIRED); 1–2 as a PREFERRED/DEFAULT, since the authored example itself uses 3; neutrals join the team in possession; totals reconcile |
| Pass Combination Gate | "a minimum of 4-6 connected passes in their half (adjust by age/ability)… Pass count resets when possession is lost or the ball leaves play" | A pass condition on the primary event (REQUIRED); 4–6 PREFERRED/DEFAULT; reset triggers |
| Wide Zone Advantage | "Mark wide channels along both touchlines (~6-10m wide depending on field size)… earn an advantage (bonus point, free restart, or scoring multiplier)" | Wide regions on both touchlines (REQUIRED); 6–10 m TYPICAL; an advantage. A separate *bonus point* conflicts with decision 2 |
| Variable Target Condition | "Mark 2-3 possible targets/gates (e.g. …)… revealed only after play crosses a trigger line, or switches on a coach cue… All targets stay physically available" | At least two targets (REQUIRED); 2–3 PREFERRED/DEFAULT; activation changes on a trigger; all remain present |
| Goalkeeper Included Condition | "Goalkeepers in their normal goal positions at each end… Use full-size or scaled goals" | A goalkeeper and a goal at each end (REQUIRED) |
| Turnover Reward | none authored | A real gap |
| GF2 Directional Possession | "a directional target line or zone at one end… Teams attack in the same direction" | **Not bound:** to be corrected (decision 1) |
| GF3 Positional Play | "Field divided into a positional grid (typical: 3 horizontal zones x 3 vertical channels = 9 cells)" | A positional grid exists (REQUIRED); 3 × 3 TYPICAL |
| GF7 Channel Games | "Field divided lengthwise into 3 or 5 channels" | Lengthwise channels exist (REQUIRED); "3 or 5" is stated flatly, so its value status needs confirming |

### The vocabulary, as typed canon never consumed

| Source | What it already types | Runtime use today |
|---|---|---|
| Environmental Manipulation Schema v2.0 | 11 knowledge objects, 24 dimensions and 64 parameters (detail below) | version string only |
| Information Expression RC1.1 | 26 dimensions, 139 allowed values, 26 integrity conditions, 6 presets (e.g. `LATE_REVEAL`, `VARIABLE_TARGET_MEANING`) | shadow reference |
| Game Archetype Workbook RC1.1 | 48 organizational integrity conditions; five Interaction Regulation families (Eligibility/Access, Timing/Sequence, Outcome/Scoring, Participation/Role, Restart/State) | loader integrity check |
| RPC Library RC1 | Begin and end conditions, representative information, degenerate solutions, primary scoring conditions; REQUIRED / SUPPORTING_IDENTITY / EXCLUSION identity rules; validation rules with evidence and stage | routing, form gating, scoring |
| Soccer Module Game Forms | Typed columns for directionality, opposition, restart and role structure, player minimum and maximum, information expression; mostly empty | scoring structure only |
| Scoring events + primary scoring directive | Event, object, condition, what Setup must mark, evidence | consumed end to end |

The Environmental Manipulation Schema's 64 parameters cover:
- **Area:** length, width, shape.
- **Position:** position relative to the area, a boundary, a performer, an objective or an object;
  distance or proportional location; initial, restart or conditional-reset timing.
- **Orientation:** facing reference, including playing direction.
- **Participants:** count and state.
- **Objectives:** count and active/inactive state.

## The shape

### Part 1 — the requirement row

Source → scope → what must be true → strictness → value status → value authority → collision → validation.

| Field | What it holds | Values |
|---|---|---|
| `source` | The selected item that creates the requirement | library and ID: `tl-v0-constraint-neutral-player-condition`, `A01-02`, `RPC-001`, `GF2`, `IE-C006` |
| `scope` | The part of the game it constrains | a game-specification section (Part 2) plus the entity, e.g. participants · neutral |
| `requirement` | The kind of statement | EXISTS · COUNT · RANGE · EQUALS · POSITIONED · ORIENTED · CHANGES_ON · NOT_EXISTS · NOT_DOMINANT |
| `value` | What must be true | a controlled value from existing vocabularies, or a number or range with its unit |
| `strictness` | How binding the requirement is | REQUIRED · SUPPORTING · EXCLUSION (the RPC identity roles, reused) |
| `value_status` | How binding the value is | REQUIRED_RANGE (outside it is invalid) · PREFERRED_DEFAULT (use when feasible, adapt) · TYPICAL_EXAMPLE (informative only) |
| `value_authority` | Who fixes a value within its status | KNOWLEDGE · COACH · SESSION (field, players) |
| `collision` | What happens when it contradicts another requirement | RECONCILE via a named, authored ownership or relationship rule; otherwise FAIL and return to selection. No general precedence. |
| `validation` | How we know it was realized | the intended functional effect, checked on the game specification; then, secondarily, that coach text states each REQUIRED element |
| `needs_vocabulary` | Free text where no controlled value exists | flags a gap; never guessed |

### Part 2 — the game specification the rows are about

| Section | Holds | Existing vocabulary |
|---|---|---|
| Area | length, width, shape, from the session | EM-0001; session field |
| Regions | channels, corridors, zones, halves, grid cells, each instantiated with orientation, extent, position and the functional relationship it serves | Knowledge requires the region; the resolved game represents it generically (decision 5). EM ontology unchanged |
| Participants | teams, outfield counts, goalkeepers, neutrals, target players; who each plays for | EM-0006, EM-0007; Participation/Role |
| Objectives | goals, lines, target zones, gates, target players: count, position, owner, state, and role (**PRIMARY SCORING** or **REPRESENTATIVE**) | EM-0003, EM-0009, EM-0010; scoring event vocabulary |
| Direction | each team's direction of progression and its directional objective(s) | EM facing reference (playing direction); Soccer Module directionality |
| Start and restart | initial state; restart after a score, out of play, a turnover | EM timing; RPC begin conditions; Restart/State |
| Interaction | eligibility and access, timing and sequence (pass counts, windows), how opposition starts | Eligibility/Access, Timing/Sequence; RPC exclusion rules |
| Scoring | the one primary event, its object and qualifying condition; any authored value modifier | primary scoring directive (exists) |
| Consequences | trigger, state change (possession, restart/state, temporary numerical advantage, access, spatial advantage, target availability, continuation), beneficiary | Outcome/Scoring, Restart/State |
| Information | what is available, revealed or distributed, and what changes it | IE dimensions and presets; EM objective state |

### Invariants, checked whatever was selected

- **Scoring:** exactly one primary scoring event. A consequence changes state, or, only where
  explicitly authored, the value of that event. It never adds a second definition of success.
- **Direction:** each team has a stable, perceivable direction of progression and at least one
  functional directional objective.
- **Representative objectives stay present** even when nothing scores on them.
- **Participants reconcile to the session's player count,** including goalkeepers, neutrals and
  overloads.
- **Geometry:** every region fits the area, with no overlap unless authored.
- **References:** every referenced region, objective and participant exists.
- **Integrity conditions:** the Game Archetype and Information Expression integrity conditions hold.

**Check the specification, not the text.** "Realization ≠ Mention": finding the word "neutral" in the
Setup proves nothing. That is the keyword validation the audit showed cannot tell a working game from
a broken one.

## Worked against the audit's hostile cases

Columns: scope · requirement · value · strictness · value status · authority.

**Neutral Player Condition** (Environmental Manipulation, foundation). *Resolves: no neutral in 6 of
6; "10 players in a 6v6 format".*

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| participants · neutral | COUNT | ≥ 1 | REQUIRED | REQUIRED_RANGE | KNOWLEDGE |
| participants · neutral | COUNT | 1–2 (the authored example uses 3) | SUPPORTING | PREFERRED_DEFAULT | COACH |
| participants · neutral | EQUALS (plays for) | team in possession | REQUIRED | — | KNOWLEDGE |
| invariant · players | EQUALS | outfield + goalkeepers + neutrals = session players | REQUIRED | — | SESSION |

**From Goal Kicks** (Practice Situation A01-02). *Resolves: 0 of 3 goal-kick restarts; goals removed.*
Collision: the Game Form restarts "from the team that didn't touch it last". No authored rule yet says
a Practice Situation owns the start state, so by decision 3 that is a FAIL until one exists.

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| objectives · goal | EXISTS | at the building team's defending end; role REPRESENTATIVE | REQUIRED | — | KNOWLEDGE |
| participants · goalkeeper | EXISTS | for the building team | REQUIRED | — | KNOWLEDGE |
| start | EQUALS | goal kick from that goal | REQUIRED | — | KNOWLEDGE |
| restart · out over own end line | EQUALS | goal kick | SUPPORTING | — | KNOWLEDGE |

**Wide Zone Advantage** (Environmental Manipulation, shaping). *Resolves: advantage removed; central
weighting kept.*

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| regions · wide channel | EXISTS | along both touchlines | REQUIRED | — | KNOWLEDGE |
| regions · wide channel · width | RANGE | ~6–10 m, depending on field size | SUPPORTING | TYPICAL_EXAMPLE | SESSION |
| consequences · action in or through a wide channel | EXISTS | a state change (e.g. free restart, possession or spatial advantage) or an authored multiplier on the primary event; *not* a separate bonus point | REQUIRED | — | *needs authoring* |
| scoring · value modifier | NOT_EXISTS | a modifier valuing central actions above wide ones | EXCLUSION | — | FAIL on collision |

**Pass Combination Gate** (Interaction Regulation). This is access/eligibility on the primary event,
not a second way to score. *Resolves: no passing requirement in 41 of 42.*

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| scoring · qualifying condition | EXISTS | a connected-pass count must be completed before the primary event counts | REQUIRED | — | KNOWLEDGE |
| scoring · qualifying condition | RANGE | 4–6 passes in own half, adjusted by age and ability | SUPPORTING | PREFERRED_DEFAULT | COACH |
| interaction · pass count | CHANGES_ON | resets when possession is lost or the ball leaves play | REQUIRED | — | KNOWLEDGE |

**Variable Target Condition** (Environmental Manipulation, information). *Resolves: no target varies.*

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| objectives · target | COUNT | ≥ 2, all physically present | REQUIRED | REQUIRED_RANGE | KNOWLEDGE |
| objectives · target | COUNT | 2–3 | SUPPORTING | PREFERRED_DEFAULT | COACH |
| objectives · target state | CHANGES_ON | live target revealed after a trigger (trigger line, coach cue, or an authored bank entry) | REQUIRED | — | COACH |
| information | EQUALS | IE-C006 `VARIABLE_TARGET_MEANING` | REQUIRED | — | KNOWLEDGE |

**Goalkeeper Included Condition** (Environmental Manipulation, foundation). *Resolves: 0 of 60 contain
a goal while 57 start attacks from a goalkeeper.*

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| participants · goalkeeper | COUNT | 1 per team | REQUIRED | — | KNOWLEDGE |
| objectives · goal | EXISTS | one per end; REPRESENTATIVE unless it is the primary scoring object | REQUIRED | — | KNOWLEDGE |

**RPC-001 Goalkeeper Build-Out.** *Resolves: a scoring object placed relative to moving players (59 of
60).*

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| start | EQUALS | goalkeeper possession or a controlled defensive restart (authored begin condition) | REQUIRED | — | KNOWLEDGE |
| objectives · primary scoring line or zone | POSITIONED | a fixed place in the area, not "beyond the first defenders" | REQUIRED | *needs a value and its status* | KNOWLEDGE |
| interaction · opposition | NOT_DOMINANT | coordinated high press (becomes RPC-002) | EXCLUSION | — | KNOWLEDGE |

**Through Wide Areas** (Practice Situation A01-04). *Resolves: a game scored only through the centre.*

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| regions · wide | EXISTS | wide regions that progression can use | REQUIRED | — | KNOWLEDGE |
| scoring | NOT_EXISTS | a condition under which only central progression scores | EXCLUSION | — | FAIL on collision |

**Turnover Reward** (Interaction Regulation, consequence). No realization is authored.

| Scope | Requirement | Value | Strictness | Value status | Authority |
|---|---|---|---|---|---|
| consequences · forced turnover | EXISTS | a state change (possession, restart, temporary advantage…) or an authored value modifier; how a "forced" turnover is judged | REQUIRED | — | *needs vocabulary* |

**The three Game Forms:**
- **GF2 Directional Possession:** direction as the invariant above. The authored "same direction"
  wording is not bound.
- **GF3 Positional Play:** a positional grid EXISTS (REQUIRED); 3 × 3 is TYPICAL_EXAMPLE.
- **GF7 Channel Games:** lengthwise channels EXIST (REQUIRED); the value status of "3 or 5" needs
  confirming.

## Collisions the audit found, under decision 3

| Collision | Authored rule permitting reconciliation? | Outcome |
|---|---|---|
| RPC scoring event against Game Form scoring objects | Yes: the Context chooses among physically available events (RC1.1) | reconcile |
| Consequence rewards against one primary scoring event | Settled by decision 2 | a consequence changes state or an authored value; a separate point is invalid |
| Removing unscored objects against representative objectives | Settled: objectives carry a role | a REPRESENTATIVE objective is never removed |
| Slot value weighting (central over wide) against Wide Zone Advantage or Through Wide Areas | None | FAIL, return to selection |
| Even teams against neutrals or overloads within the session count | None yet | FAIL |
| Game Form restart against Practice Situation start (From Goal Kicks) | None yet | FAIL unless an ownership rule is authored |
| Game Form layout against the session field (54 m of channels on 30 m) | Geometry invariant | FAIL |

## Knowledge corrections recorded, not made

Frozen until implementation resumes:
- **GF2's setup guidance** says "Teams attack in the same direction…", and the system-written Teams
  line says "Two teams compete in the same direction…". Both are to be corrected to the direction
  invariant.
- **Neutral Player's guidance contradicts itself:** "one or two neutral players" against the example
  "6v6 + 3 neutrals".
- **Wide Zone Advantage's guidance offers a "bonus point"**, which decision 2 rules out as a second way
  to score.
- **Nothing checks family IDs across artifacts.** The Game Archetype loader validates Environmental
  Manipulation family rows by count only, not by ID against the EM Schema. That is how the family
  mismatch went unnoticed.

## What this is not

- **Not an implementation design.** It says nothing about how the runtime would resolve or hold the
  specification. Implementation stays frozen.
- **Not a new library or canonical concept.** Rows reference existing IDs. The only new thing is the
  row itself, which is the contract.
- **Not a fix list.** The audit's failures remain hostile tests for whatever contract results.
