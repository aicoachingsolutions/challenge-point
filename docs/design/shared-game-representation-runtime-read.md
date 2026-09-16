# The game before the words — a runtime read on the shared game representation

For Christian, 15 September 2026. Implementation stays frozen. This is an analysis, not a design, and
it deliberately tries to break the hypothesis as well as support it.

The hypothesis under test: the central gap is not a realization contract per knowledge object, but the
absence of an authoritative representation of the game that currently exists.

---

## The short answer

**It fits, and a fragment of it already exists — implemented as text surgery.**

After the model returns, `mapStructuredActivityToLegacy` does this to the Setup prose:

```
reconcilePlayerFormat(setup, session.playerCount, archetype.name)
reconcilePlayingArea(setup, parseSessionArea(session.fieldLength, session.fieldWidth))
```

The system computes the format the game should use from the squad and the game form's overload intent,
parses the total the model claimed out of the sentence, rewrites the numbers, then does the same for
the area, converting to metric-first. Two modules, 477 lines, defending two numbers inside someone
else's paragraph. The resolved values are never stored: they are injected into prose and discarded.

`player-format.ts` says why it exists, after four failed prompt revisions:

> "Squad size is a fact and the overload requirement is a property of the selected game form, so the
> format is derivable — there was never anything to negotiate."

That is the hypothesis, arrived at from the opposite direction. The representation is the place those
derived facts would live instead of being written into, and then rescued from, a paragraph.

## 1. Does it fit what the runtime is doing?

Yes. Three parties write an activity today, and they share strings rather than state.

| Writer | Produces | Sees |
|---|---|---|
| System mechanics (`build-activity-mechanics`) | rules, scoring, constraint lines, teams, slot modifiers | the selection and package, as text templates |
| The model | title, Setup, objective, how-to-play, coaching focus | a payload of names, a truncated hint, four rule summaries, two constraint titles, two decision cues |
| Post-hoc repair (mapper, compression) | corrected numbers, removed objects, pinned scoring | the finished prose, plus a few structured facts |

The first two never meet. The third arrives after the fact with a regex. Every audit failure is a
disagreement between writers one and two that writer three cannot see:
- it fixes the **area** but deliberately leaves the **regions inside it** alone, because
  `playing-area.ts` will not resize single measurements: "resizing those would destroy the internal
  structure of the activity while claiming to fix its dimensions". That is precisely how 54 m of
  channels survive on a 30 m field;
- it fixes the **format** but knows nothing of the **neutral** a constraint required, so Neutral Player
  never appears while "10 players in a 6v6 format" does;
- it has no notion of **objects**, so a goalkeeper survives with no goal.

So the separation is real, it is already being patched at exactly the seam where the representation
would sit, and the patching is bounded by having no structure to reason over.

## 2. Is the primitive set sufficient?

Tested against the player-level properties coded across the 60 captured activities, the ten primitives
cover everything the audit found:

| Property observed | Primitive |
|---|---|
| Area, zones, channels, corridors, grids | Space |
| Team format, goalkeepers, neutrals, overloads | Performers |
| Ball, goals, gates, target players, cones | Objects |
| What each team attacks and defends | Objectives, Direction |
| Start, restarts, turnover continuation | State |
| Who may enter, pass counts before scoring | Relationships, Time |
| Scoring event, qualifying condition, weighting | Objectives, Consequences/Value |
| Which target is live, late reveal | Information, State |
| Windows and counts | Time |

**Four honest corrections.**

1. **The session envelope is missing.** Twelve players, 40 × 30 m, twenty minutes. It is not knowledge
   and not a game element: it is the boundary condition every element reconciles against, and it comes
   from the coach rather than from a library. The audit's two worst arithmetic failures are envelope
   violations, and today the envelope is applied by the two regex modules above. It needs a named place.
2. **Relationships will absorb everything.** As a general primitive it becomes an unschema'd graph, and
   validation goes back to inference. It only works as a small closed set of typed relations —
   ownership (attacks, defends, keeps out of), containment, eligibility, valuation, perception.
3. **State is two things.** Per-element state (an objective active or inactive) belongs on the element.
   Transitions (start, restart, turnover) are their own short list. Keeping them together is what lets
   "restart from a goal kick" exist as language with nothing behind it.
4. **Objectives and Direction are derivable, and should stay explicit anyway.** An objective is an
   object plus a role relation; a direction is the relation of a team to its objective. Both are
   reducible in principle. But the audit's most damaging loss was role information (goals removed
   because nothing scored on them, 0 of 60) and its most frequent absence was direction (57 of 60), so
   both earn explicit, required fields. Define an objective *as* object + role so it cannot drift into
   a parallel object system.

**What cannot be represented, and must not be.** Pressure, uncertainty, opportunity and
representativeness itself are emergent. "Against High Pressure" can only be expressed as conditions
that make pressure likely — opponent numbers, starting distance, restart position, recovery
eligibility — never as a property "pressure = high". This bounds what validation can ever assert, and
it is the difference between a representation and a prescription.

**One thing the list has no place for:** the three activities are a *set*. Session emphasis defines how
they must differ, and the audit showed the slot template is the strongest driver of what players
experience. Bandwidth is a property of a set of games, not of one game. Either a separate object owns
the set, or it stays outside as policy.

## 3. Can the audited knowledge express itself as contributions?

Mostly yes, using what is already authored.

| Knowledge | Contributes to |
|---|---|
| **RPC-001 Goalkeeper Build-Out** | State.start ("goalkeeper controls possession or play restarts from a controlled defensive restart"); Information (its four authored representative-information items); Objectives + Consequences (the primary scoring condition); a limit on opposition configuration (its exclusion rule, which becomes RPC-002); and value rules that make degenerate solutions not pay — already visible as "A long kick that lands past the line does not count" |
| **Against High Pressure** | Performers (opponent numbers), State.start, Space (compression), Information — as conditions only |
| **From Goal Kicks** | Objects (a goal), Performers (a goalkeeper), State.start and restart, Direction |
| **Through Central / Wide Areas** | Space regions, plus a value relation on those regions |
| **GF2 Directional Possession** | Objectives, Direction, interaction relations; its guidance also sets Space (40–60 × 25–40 m) and a restart rule, neither of which is sent today |
| **GF3 Positional Play** | Space (a grid) and a *perceptual* relation: "the grid is a visual scaffold", restricting nothing. A good test — the representation must be able to hold a region that constrains nothing, or GF3 becomes prescriptive |
| **GF7 Channel Games** | Space (3 or 5 lengthwise channels), Objectives (its realization coverage marks an end object), perception-only relations |
| **Neutral Player** | Performers and a team relation; forces the envelope arithmetic |
| **Goalkeeper Included** | Performers, Objects (goals at each end), a relation making the goalkeeper live in all phases |
| **Pass Combination Gate** | Time/Sequence (a count), eligibility of the scoring event, State (the count resets on a turnover) |
| **Wide Zone Advantage** | Space region plus a value relation |
| **Variable Target** | Objectives (at least two), their availability State, and an Information trigger that changes it |
| **Turnover Reward** | Consequences — but nothing is authored, so the slot stays empty and fails loudly instead of producing a sentence |

**What does not fit, which is the useful part.**
- **Affordance lenses.** Possession Stability, Space Creation and Regain are intended opportunities, not
  properties. They cannot be asserted structurally. Their current expression — "Score awarded for plays
  that visibly create or open space" — is exactly the category error a representation would expose: an
  opportunity converted into a scoring clause. At most they imply preconditions.
- **Learning Stage.** A policy over parameter choice (space, numbers, information, time), not an
  element. It can only act as directed modifications, and its success is not structurally checkable.
- **Session emphasis.** Cross-activity, as above.
- **Challenge level.** Adds an element such as a tagging condition — representable, but today it builds
  nothing at "high".

## 4. What stays outside the representation?

| Outside: knowledge *about* the game | Inside: the game itself |
|---|---|
| Coach communication, voice and vocabulary | The qualifying condition a point counts under |
| Design intent, rationale, contraindications | An object's role: scored or representative |
| Provenance, versions, canonical status | The functional relationship a region serves |
| Selection scores, candidate pools, signal matches | Counts, extents, positions, triggers |
| The RPC's representative question and purpose | Its begin condition, as a start state |
| Learning-stage and emphasis language | The parameter values that stage language argued for |
| Telemetry | — |

**Attached, but not content:** per-element attribution — which selection contributed this element.
Without it, "fail loudly and return to selection" cannot say what to reconsider. It belongs on the
element as metadata, not as part of the game.

## 5. Could the scoring mechanism be the model rather than a special case?

Structurally yes: decide the fact before language, write the coach's sentence from the fact, validate
the fact afterwards. That is exactly what primary scoring does, and it is the one layer the audit found
reliably functional.

Three things make it work, and only two of them generalize:
1. **A controlled vocabulary** of seven events. Generalizes.
2. **An authored coach sentence per context × event.** Does *not* generalize: you cannot author a
   sentence for every (area × regions × counts × roles) combination. Rendering has to compose from the
   structure, which is new work.
3. **A physical prerequisite that can be checked** (`setupEvidence`). Generalizes, and improves: the
   check stops being lexical ("does Setup contain the word") and becomes structural.

The hidden difficulty: scoring resolves *one* object with no dependencies. Regions depend on the area,
formats depend on constraints and the archetype, restarts depend on objects. Reconciliation is
therefore composition with contradiction detection, not a lookup table. That is where a design would go
wrong first.

## 6. Does it remove complexity, or move it?

**What could genuinely go.** Line counts as scale, not as a promise:

| Today | Lines | Why it exists | Under a representation |
|---|---|---|---|
| `player-format.ts` | 286 | repairs squad arithmetic inside prose | rendering |
| `playing-area.ts` | 191 | repairs dimensions and units inside prose | rendering |
| `scoring-object-consistency.ts` | 346 | removes objects nothing scores on | unnecessary: objects carry roles |
| `validate-activity-skeleton.ts` | 244 | keyword overlap against required mechanics | structural assertions |
| `validate-activity-structure.ts` | 196 | keyword presence for opposition, decision, consequence | structural assertions |
| parts of `compress-activity-output.ts` | 674 total | dedupe, caps, one-way-to-score filtering, relocation | much of it exists because three writers overlap |
| the retry loop in `completion.service.ts` | — | asks the model to say missing words | gone |

Roughly 1,900–2,500 lines are text repair or lexical validation that a resolved game makes
unnecessary or converts into simple checks.

**What it adds.**
- **A reconciler.** New, and the main risk. It must compose contributions and detect contradictions.
  Decision 3 (fail rather than invent a winner) keeps it much cheaper than a solver.
- **A renderer.** The model stops inventing the physical game and writes from facts. The coach-voice
  work (roughly 1,270 lines across language, voice, standard and section ownership) stays, but its
  input becomes stable.
- **Authoring conversion.** Every knowledge object's prose guidance becomes typed contributions. This
  is the ledger that was paused, and it does not shrink. It is the single largest cost.
- **New failure modes.** Over-specification is the serious one: a fully specified environment can
  prescribe the solution. Also representation drift against knowledge, and migration of existing slots.

**What merely moves.** The three-activity variation problem; the emergent qualities, which stay
unvalidatable; and prose quality, which becomes a rendering problem instead of an instruction-following
problem.

**The verdict, stated as a bet.** It removes a *class* of work — defending facts inside someone else's
sentences — and concentrates the remainder in one place. That is a real simplification **only if** the
representation stays at "what a coach lays out and what the rules key on" and refuses to model play. If
it grows toward a world model, it adds complexity on both sides and the audit's failures come back as
reconciliation failures instead of prose failures.

**The strongest argument against the hypothesis** is not technical. It is that today's model-written
Setup is the only reason activities have any concrete layout at all, because the knowledge base authors
layout only as prose guidance that is never sent. Building the representation means the layout must
come from authored defaults per Game Form plus the session envelope plus coach choice. If that
authoring stalls, the result is worse than today: a system that can prove a game is coherent but cannot
produce one.

## 7. The smallest representation that would have prevented the audit failures

Eight tables, about 35 fields, and eight invariants. Explicitly excluded: player positions, movement,
tactics, sequencing of play, any simulation.

| # | Table | Fields |
|---|---|---|
| 1 | Envelope | players, area length and width, duration |
| 2 | Space | area; regions [id, kind, orientation, extent, position] |
| 3 | Performers | teams [id, outfield count, goalkeeper]; neutrals [count, plays for]; target players |
| 4 | Objects | [id, kind, owner, position reference] |
| 5 | Objectives | [object id, team, role: scored or representative, state: active or inactive] |
| 6 | Direction | per team: the objective attacked and the one defended |
| 7 | Transitions | start; restart after score, out of play, turnover |
| 8 | Rules of value | primary event [object, condition]; value modifiers; consequences [trigger, effect, beneficiary]; information [trigger, what changes]; time windows |

**The invariants, against what they would have caught:**

| Invariant | Audit failure it catches |
|---|---|
| Regions fit the area | 54 m of channels on a 30 m field |
| Performers sum to the envelope | "10 players in a 6v6 format"; "14 players in a 7v5 format" |
| Every referenced performer exists | 31 of 60 starting from a goalkeeper never placed |
| Every objective has an object, a team and a role | 0 of 60 containing a goal while goalkeepers remain |
| Every team has a direction and a directional objective | 57 of 60 |
| The primary event's object exists at a fixed position | 59 of 60 placed "beyond the first defenders" |
| Every selected contribution appears somewhere | Neutral Player 0 of 6; Pass Combination Gate 1 of 42; Variable Target 0 of 3 |
| Every consequence has a typed effect | consequence rewards 0 of 57 |

The test I would hold it to: *can this game be laid out and played as written?* Nothing beyond that.

## What I would do next, without implementing anything

Replay the 60 captured activities against those eight invariants, as a paper exercise over the existing
audit output. It needs no runtime change and no new generation, and it answers the question this whole
read is circling: would the minimum representation actually have caught the failures, and does it flag
anything that is in fact fine? If it produces false alarms on activities a coach would happily run, the
representation is already too strict.

## Preserved as unresolved, per your instruction

- Game Form restart × From Goal Kicks;
- central value weighting × Wide Zone Advantage;
- Turnover Reward's missing authored consequence;
- Environmental Manipulation family-ID provenance;
- Counterattack timing;
- the three wording issues: Neutral Player's "one or two" against its own three-neutral example, Wide
  Zone Advantage's bonus point, and Directional Possession's same-direction wording.
