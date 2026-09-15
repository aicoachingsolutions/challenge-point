# What Reaches the Pitch — causal expression audit, 14 September 2026

The audit question: for every selection made between the coach's planning input and the final
activity, **what does it change in the game players experience?** A change counts only if it
changes the game. Metadata, prompt text, explanation, candidate choice and internal rationale do not
count.

Implementation was frozen throughout. The one allowed correction came first: the coach's Learning
Stage and session emphasis now reach generation. Every comparison below runs against that corrected
baseline. The 60 activities are kept verbatim in
[`causal-expression-2026-09-14-evidence.md`](causal-expression-2026-09-14-evidence.md).

---

## The answer

**Challenge Point currently assembles individually valid pieces that coexist in the same activity.
It does not yet assemble a coherent representative game from its selected knowledge.**

Two selections reliably change what players experience:
- the **scoring event and its condition** (RPC × Game Form × slot);
- the **session emphasis's slot template**.

Most other selected knowledge does one of three things:
- never reaches the model, which is the only party that writes the physical game;
- reaches it as a title;
- is removed after it.

Where an activity is coherent, that comes mostly from two sources: the slot template and the
model's generic picture of a possession game. The selected Practice Situation, Game Form,
constraints and incentives contribute little of it.

## Diagnosis

It is a combination, and not an even one.

| | Option | Finding |
|---|---|---|
| Primary | **2. Selected knowledge not realized** | Most selected knowledge never reaches the writer of the physical game, or reaches it as a title. Five directives built from it are never sent. |
| Primary | **4. Activity Assembly not reconciling** | The model invents the layout. The system restates area and player count and appends the scoring sentence. Nothing makes the pieces fit. |
| Enabling | **5. Validation checking ingredients** | All five deliberately broken games passed every validator. |
| Underlying | **3. Poor integration** | Two writers work apart. The model writes the physical game with the least access to what was selected. The system writes rules and scoring with no view of the physical game. |
| Secondary | **1. Missing knowledge** | Not the binding limit: most existing knowledge goes unused. The lines the system writes for constraints state rationale, not what to lay out. The authored setup guidance behind them does carry the parameters, but it sits in the setup brief, which is never sent: Neutral Player Condition gives one or two neutrals who always join the team in possession, with team numbers adjusted; Pass Combination Gate gives a minimum of 4–6 connected passes, reset when possession is lost. Turnover Reward has no setup guidance at all, which is a real gap. *Corrected after the first reading: this row originally said the knowledge gave no count or pass number, which described the system's line rather than the authored guidance.* |

## Recurring failure patterns

**Built, tested, never sent.** Five directives are built from selected knowledge and unit-tested,
but live on a prompt builder the live path stopped calling in May:
- Practice Situation;
- representative stakes;
- information expression;
- the setup brief (Game Form and constraint setup guidance, field, format);
- the scoring-object instruction.

The Learning Stage was a sixth until today's correction. The tests passed because they tested the
builder, not the prompt.

**The physical game is written by the party that sees the least.**
- **Model writes:** Setup, title and objective.
- **Model receives:** the Game Form name, a hint truncated to 180 characters, four rule summaries,
  two constraint titles, two decision cues, and the emphasis and stage blocks.
- **Model never receives:**
  - the learning goal;
  - the Practice Situation;
  - the field size or player count;
  - the scoring event;
  - the consequence constraint;
  - the stakes.

So it lays out a generic possession game. The live prompt's only layout example is "Two 20-yard end
zones at either end of a…".

**Selection acts on names, not meanings.** The Practice Situation and the coach's note enter as words
in one goal string. The parser reads those words and changes which lenses and constraints are chosen.
What the situation or note means never reaches the game. From Goal Kicks, Through Central Areas and no
situation select the identical package.

**Conflicts are resolved by deletion.** When pieces disagree, later stages delete rather than
reconcile:
- incentives and consequence rewards leave Scoring for a section coaches can't see;
- goals and end zones leave Setup because nothing scores on them;
- area and player count are overwritten without rescaling the zones inside them.

**Slot templates set the shape.** Across all 20 runs:
- activity 1 is a line game with zone weighting in 19;
- activity 2 is a target-zone game with a live-transition rule in 19;
- activity 3 is 7v5 in 14.

Changing the Practice Situation, Learning Stage, constraints, challenge or coach's note does not move
that shape. Only the session emphasis and the scoring allocation do.

**Validation measures vocabulary.**
- The checks look for decision, consequence, lens and constraint words across a text the system
  mostly writes itself.
- They check that Setup names the scoring object. The system appends that sentence itself before
  the check runs.
- Narrative validation of output is switched off.
- Retries teach the model words. The Neutral Player run was sent back for not saying "disorganize
  defensive shape", never for having no neutral player.

**Rationale is kept where coaches can't see it.** Constraint, Coaching Focus and Teams are stored but
not shown. They hold two things: the system's account of what each constraint does, and the rewards
removed from Scoring.

## Evidence ledger

Counted across the 60 real activities, then checked by reading.

| Count | What it shows |
|---|---|
| **41 / 42** | activities with Pass Combination Gate selected contain no passing requirement. The one that did came from First Time Exploring, which asks for "one clear demand at a time". |
| **6 / 6** | activities with Neutral Player Condition selected contain no neutral player. The only neutrals appeared in the coach's-note run, where Neutral Player was not selected. |
| **0 / 57** | activities with a consequence constraint show its reward in Scoring. |
| **0 / 60** | activities contain a goal. 57 tell teams to start each attack from the goalkeeper, and 31 never place a goalkeeper in Setup. |
| **0 / 3** | From Goal Kicks activities restart from a goal kick. |
| **57 / 60** | activities never say which way each team attacks. 59 place the scoring line or zone "beyond the first defenders" or "behind the pressing players", which moves as those players move. |
| **5 / 5** | deliberately broken games passed every validator and reached the coach view. |

## What actually runs

The real sequence differs from the planning sequence in the brief, as follows.

1. **Coach's plan:**
   - guided Learning Goal, Practice Situation, optional note and Learning Stage;
   - session emphasis (unset runs Discovering Solutions);
   - challenge level (default medium).
2. **Goal string.** The front end joins goal name, situation name and note into one sentence.
3. **Parser** (`deriveInputConstraints`) reads that sentence for signal words and proposes Game Forms,
   lenses and constraints.
4. **RPC routing.** The goal's RPC narrows the Game Forms (RPC-001: GF2, GF3, GF7).
5. **Selection** (`generateSelection`) picks one Game Form, lenses and constraints. It records the
   affordance target profile in shadow only.
6. **Primary scoring.** RPC × Game Form × slot gives each activity its scoring event, condition and
   setup sentence.
7. **Constraint package.** One foundation, one shaping, and one consequence (kept only if it scores
   above 12), plus guardrails: cue, decision problem, exchange, opponent consequence.
8. **Skeleton and mechanics (system).**
   - Writes rules, scoring, constraint lines, teams, and slot modifiers from the emphasis.
   - Also builds the stage, situation, stakes and information directives.
9. **Model call (model).** One prompt plus a short payload. The model writes title, Setup, objective,
   how-to-play and coaching focus. Of the directives, only stage and emphasis reach it.
10. **Merge (system).** Keeps the system's rules and scoring and appends the scoring-object sentence
    to the model's Setup.
11. **Validation (system).**
    - Structure keywords.
    - Skeleton keyword overlap and scoring-object presence, with one retry.
    - Generated-activity fields and IDs.
12. **Coach communication (system).**
    - Keeps one way to score.
    - Removes objects nothing scores on.
    - Moves rewards to Coaching Focus.
    - Caps rules and translates into coach voice.
    - Restates area and player count to the session's.
13. **What a coach reads:** Objective, Setup, Rules, Scoring, Win Condition, Equipment.

## Audit table

Status definitions:

| Status | Meaning |
|---|---|
| FUNCTIONAL | changes what players experience, as intended |
| PARTIAL | some of the intended change reaches players |
| TEXT-ONLY | reaches a prompt or coach text, but changes nothing players do |
| INERT | changes nothing players experience; may change selection or metadata |
| OVERWRITTEN | realized at some stage, then replaced or removed |
| CONFLICTING | reaches players in a form that contradicts another piece |
| UNVALIDATED | nothing checks whether it works |

| Selected knowledge | Intended function | Actual runtime consumer | Realized player-level effect | Status |
|---|---|---|---|---|
| Learning Goal | What is being learned | RPC routing by goal id; its name is parser text and the objective fallback | Decides the RPC, so the scoring events. Its name becomes the Objective when the model's objective is removed (5 of 60). | FUNCTIONAL |
| Practice Situation | The competitive moment: start, opposition, information | Parser reads its name. Its definition directive is built, never sent. | Changes which constraints are chosen. No situation's defining feature appears. | INERT |
| Coach's note | The coach's own problem | Parser reads its words | Package changed. Nothing addresses the moment after winning the ball. | INERT |
| RPC identity (question, purpose, success identity) | What the game represents | None | None | INERT |
| RPC routing | Which contexts and Game Forms are valid | `gateCandidateGameFormsToContext` | Narrows the forms. With the form fixed, RPC-001 and RPC-002 select identically. | FUNCTIONAL |
| Scoring event and condition | What counts as success | System scoring rule, setup sentence, coach-view pin | Reassigning events changes each activity's object. RPC-002 adds "keeps the ball with the next pass" and pressing from every attack's start. | FUNCTIONAL |
| Scoring-object placement | Where success happens | Setup sentence ("beyond the first defenders") | Placed relative to moving players in 59 of 60, with no direction for each team in 57 | PARTIAL |
| Game Problem / affordance lenses | Which opportunities the game offers | Selection; system reward lines; payload hint; skeleton keywords | Reward lines removed from Scoring. Enforced as words: a retry added "disrupt the defensive shape". | TEXT-ONLY |
| Affordance target profile | Target opportunity profile | Shadow trace only | None (by design) | INERT |
| Game Form | Organizes the representative interaction | Candidate pool; system rule lines; name and hint in payload; scoring pairing. Setup guidance never sent. | GF7 put channels in all three setups and a gate in activity 3. GF3 changed rule wording only. The slot shapes did not move. | PARTIAL |
| Goalkeeper Included Condition (foundation) | A live goalkeeper and real target | Title in payload; hidden constraint line | Goalkeepers appear whether or not it is selected, through the build-out start. 31 of 60 start from a goalkeeper never placed. No goal to defend. | CONFLICTING |
| Neutral Player Condition (foundation) | Numerical advantage from a neutral | Title in payload; hidden constraint line | No neutral in 6 of 6 | INERT |
| Pass Combination Gate (shaping) | Progress through combinations | Title in payload; hidden constraint line | No passing requirement in 41 of 42 | INERT |
| Wide Zone Advantage (shaping) | Advantage in wide areas | System reward line in Scoring | Line removed; activity 1's central-highest weighting kept | OVERWRITTEN |
| Variable Target Condition (information) | Which target is live varies | Title in payload | No target varies | INERT |
| Consequence constraints (Turnover Reward, Progression Bonus, Wide Utilization Bonus) | A consequence for actions | System bonus lines; never in payload | Removed from Scoring and moved to hidden Coaching Focus (0 of 57). A second selected consequence is dropped by the package. | OVERWRITTEN |
| Interaction exchange (guardrail) | The live exchange on a turnover | First system rule | Every activity: "Force it or lose it and the other team attacks straight away. Play does not stop." Identical in all 60. | FUNCTIONAL |
| Visible cue and decision problem (guardrails) | What players read and decide | Decision cues and Coaching Focus, both hidden | None visible | TEXT-ONLY |
| Session emphasis | How the three activities differ | Slot modifiers written by the system; prompt bandwidth | The strongest structural driver. Applying converged the setups, removed weighting, and added a 30-second window. | FUNCTIONAL |
| Learning Stage | How the realization is pitched | Stage block in the prompt (since today's correction) | No systematic difference across the three stages | TEXT-ONLY |
| Challenge level | A representative stakes element | Stakes directive built, never sent. High builds none; medium builds Defender Tagging. | None | INERT |
| Information expression directive | How information is presented | Built on the unused prompt path | None | INERT |
| Activity Assembly | One coherent game | Model Setup; system merge; area and count restated afterwards | 54 m of channels on a 30 m field. "10 players in a 6v6 format". Weighting "where you have the extra numbers" in even games (3). | CONFLICTING |
| Representative objects (goals, end zones) | Real targets | Coach communication removes objects nothing scores on | 0 of 60 contain a goal while goalkeepers stay. A title still reads "…with End Zones". | OVERWRITTEN |
| Representative Validation | Confirms the game works | Keyword and presence checks; narrative validation off | 5 of 5 broken games pass | UNVALIDATED |
| Coach Communication | One clear game | Six sections shown; Constraint, Coaching Focus and Teams hidden | Objective falls back to the goal name in 5 of 60. The object cleaner can damage text: "a small no line". | PARTIAL |

## Controlled comparisons

One change per run against the baseline:
- **Goal and situation:** Play Out from the Back, Against High Pressure.
- **Plan settings:** Building Understanding; emphasis unset; medium challenge.
- **Session:** 12 players, 40 × 30 m.

Each run was first captured before the model call, then generated for real through validation and
coach communication.

| Condition | Selection changed | What the model saw change | Player-level change | Status |
|---|---|---|---|---|
| Baseline, second run | — | nothing | Activity 3 went 6v6 → 7v5; zone layouts and titles changed. This is the noise floor. | — |
| From Goal Kicks | Central Density, Wide Zone Advantage, Progression Bonus | two constraint titles | No goal-kick restart. Starts from "the team in possession", "the central zone", "the team with the numerical advantage". | INERT |
| Through Central Areas | identical to From Goal Kicks and to no situation | identical to no situation | Not distinguishable from no situation; the central corridor appears without it | INERT |
| Through Wide Areas | Central Density, Support Lane Requirement, Wide Utilization Bonus | two constraint titles | Activity 1: "scoring only counts when possession is maintained through the central corridor". Wide bonus removed. | CONFLICTING |
| No Practice Situation | reference | — | the same three slot shapes | — |
| First Time Exploring | none | stage block only | No simpler game. Activity 3 added "complete three passes before scoring". | TEXT-ONLY |
| Reinforcing & Refining | none | stage block only | No added variability, uncertainty or adaptive opponents | TEXT-ONLY |
| No Learning Stage | none | no stage block | the same three slot shapes | — |
| Game Form GF3 Positional Play | foundation became Neutral Player | Game Form name, hint, rule summaries | Rules reworded ("Teams hold their spatial relationships…"). No neutral, no positional structure. Shapes unchanged. | TEXT-ONLY |
| Game Form GF7 Channel Games | Game Form only | Game Form name, hint, rule summaries | Channels in all three setups; activity 3 scores through a gate; "the other team gets the opposite channel" | FUNCTIONAL |
| Applying Solutions Under Pressure | slot modifiers | emphasis block, slot emphasis | Setups converge; zone weighting removed; activity 3 adds a 30-second window | FUNCTIONAL |
| Neutral Player (foundation) | package | one constraint title | No neutral anywhere; "10 players in a 6v6 format"; one retry for missing words | INERT |
| Wide Zone Advantage (shaping) | package | one constraint title | Wide channels in activity 1 (also seen without it); advantage removed; central weighting kept | OVERWRITTEN |
| Progression Bonus (consequence) | package | nothing | Bonus written by the system, removed before the coach | OVERWRITTEN |
| Variable Target Condition (information) | package | one constraint title | No target varies; "Switch play between channels" | INERT |
| Scoring events reassigned | scoring per slot | nothing | Objects follow the reassignment; activity 3 lost its player format | FUNCTIONAL |
| RPC-002 on GF2 | none | nothing | Score only if your team keeps the ball with the next pass; the other team presses from every attack's start; line "behind the pressing players" | FUNCTIONAL |
| Challenge high | stakes element removed | nothing either way | none | INERT |
| Note: "We panic after winning possession." | Central Density; no consequence kept | one constraint title | Nothing about the moment after a regain; two neutrals appeared, unselected | INERT |

## Practice Situation: selected knowledge without causal realization

Each situation was tested against what it could change in the game. Its authored definitions are one
line: "Opponents aggressively press.", "Restart from goal kicks.", "Build centrally.", "Build wide."

| Property | Changed by the situation? |
|---|---|
| Environment (layout) | No. Channels and corridors appear with and without a situation. |
| Opposition | No. Against High Pressure adds no pressing behaviour beyond the rule every activity carries. |
| Starting state | No. From Goal Kicks never starts from a goal kick. |
| Information | No. |
| Affordances | Selection only. Lenses change and reach the model as a truncated hint. |
| Constraints | Selection only. The package changes, but those constraints are themselves inert or removed. |
| Consequences | Selection only. The consequence constraint changes, then is removed before the coach. |

**Flag: selected knowledge without causal realization.** The Practice Situation acts only through its
name as parser text. Through Wide Areas produced a game scored only through the centre.

## Representative objectives and the primary scoring object

**Yes, assembly removes "not scored on" information.** The model wrote this for baseline activity 3:

> Play 8v8 with goalkeepers on a 70x50 yard field. Set up a 10-yard scoring zone in front of each
> goal… score by maintaining possession in the scoring zone.

The coach reads:

> Play 6v6 with goalkeepers on a 40 x 30 m (44 x 33 yd) field. Teams start in their defensive third.
> Mark a line across the pitch beyond the first defenders.

The goals went because the activity scores on a line. The goalkeepers stayed, because the cleaner
treats a goalkeeper as not a goal. Across all 60 activities no goal remains, while 57 start attacks
from a goalkeeper. No runtime step reads what the RPC says the game represents. So nothing tells the
cleaner that the goal is what makes a line-scored build-out game representative.

## Validation: presence, not integration

**Can current validation detect the difference? No.**

The probe:
- starts from the real baseline output;
- breaks only the text the model writes;
- appends the scoring-object sentence exactly as the merge does;
- runs every validator the route runs, in the route's order.

| Broken game | Structure | Skeleton | Generated activity | Coach communication | Coach reads (activity 1) |
|---|---|---|---|---|---|
| Control, unchanged | pass | pass | pass | pass | the real activity |
| 54 m of channels across a 30 m field | pass | pass | pass | pass | "Across the 30 m width, mark two 18 m wide channels and an 18 m central corridor." |
| An unopposed passing drill | pass | pass | pass | pass | "…pass the ball back and forth. There are no defenders… Teams play 6v6." |
| Goals only, no line | pass | pass | pass | pass | "Play 6v6 on a 40 x 30 m (44 x 33 yd) field with a small no line." |
| All three activities identical | pass | pass | pass | pass | activity 1, three times |
| Defending corner kicks | pass | pass | pass | pass | "Attackers take corner kicks from the right… Objective: Defend corner kicks." |

Why nothing fails:
- The keyword checks run over a bundle the system mostly writes itself.
- The scoring-object check is met by the system's own appended sentence.
- Narrative validation of output is switched off.
- No check relates Setup to Rules and Scoring: geometry, player numbers, direction, objects, the
  moment of the game.

The one retry seen in 20 runs was the Neutral Player run. It was sent back for missing the words
"Disorganize defensive shape", not for the missing neutral.

## Handoff audit

| Category | Instances |
|---|---|
| Consumed as intended | RPC → Game Form candidates; RPC × Game Form × slot → scoring event, condition, setup sentence; session emphasis → slot modifiers; interaction exchange → the live-turnover rule |
| Ignored (no runtime consumer) | RPC identity statements; affordance target profile (shadow); a second selected consequence (Wide Utilization Bonus in the baseline; the package keeps one per role) |
| Built, never sent | Practice Situation directive; stakes; information expression; setup brief (Game Form and constraint guidance, field, format); scoring-object instruction |
| Overwritten | The model's area and player count; Wide Zone Advantage by activity 1's central weighting; the objective by the goal name (5 of 60) |
| Prose only | Constraint lines (hidden); visible cue and decision problem (hidden); the Learning Stage block; Game Form rule lines such as "Teams hold their spatial relationships…" |
| Duplicated | The build-out start in both Setup and Scoring; "Play does not stop" followed by "No reset, no stoppage" |
| Contradicted | A goalkeeper start with no goalkeeper (31 of 60); 54 m of channels on 30 m; "10 players in a 6v6 format"; extra-numbers weighting in even games (3); Through Wide Areas scored centrally; a first-time stage given an extra passing demand |
| Stripped | Goals and end zones (0 of 60 goals); lens and consequence rewards (0 of 57); the consequence title never enters the payload |
| Made irrelevant by assembly or scoring | Lens reward lines such as "Score awarded for plays that visibly create or open space…" |
| Not physical | A line "beyond the first defenders" / "behind the pressing players" (59 of 60); "where you have the extra numbers" |
| Validated for presence only | Lens and constraint vocabulary; decision words; the scoring object named in Setup |

## Corrections to my earlier trace

Three things I said in my 14 September trace were wrong. The captured prompt shows:
- **Game Form setup guidance.** I said it is sent into generation. It isn't. It sits in a prompt
  builder the live path stopped calling in May.
- **The end zones.** I attributed them to the Game Form's guidance. They come from the example in the
  live prompt's general Setup instruction: "Two 20-yard end zones at either end of a…".
- **The Practice Situation.** I said it frames the activity. It frames nothing the model sees. Its
  name changes which constraints are selected, and its definition never leaves the system.

Christian's three titles for Play Out from the Back were End Zone, Wide Channel and Timed Possession.
They match the Applying slot template, which every session was receiving before the correction. The
Applying run here produced "Directional Possession with End Zones", "Compressed Channel Possession
Game" and "Timed Possession Challenge".

## Method and limits

- **Scope:** one corrected baseline, 20 conditions, one change each. The exact prompt was captured
  for each, then the run was generated for real through validation and coach communication. All 60
  activities were read.
- **Replication:**
  - Only one goal was tested, with one run per condition.
  - The baseline was run twice to show model noise.
  - A single run cannot separate a weak effect from noise. The statuses therefore rest on two
    things: what reached players in these runs, and whether the runtime path can carry the selection
    at all. That second test is decisive where a selection never reaches the model.
- **Counts:** pattern-matched across the 60 activities, then checked by reading.
- **Freeze held:** nothing in the product changed during the audit. Instrumentation stayed outside
  the product code.
- **Earlier evidence:**
  - Directional Possession Games is selected for 6 of 13 guided goals.
  - Forcing GF3 or GF7 here left the slot shapes unchanged.
