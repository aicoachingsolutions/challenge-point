# The Possession Relationship — smallest corpus-supported representation

**Status: proposal for Christian. Nothing implemented.** Requested 2 October, after the corpus evidence
established that dynamic possession attribution is an independently required capability rather than something
introduced for Wide Zone Advantage.

---

## The answer in one line

The corpus already establishes **almost the whole structure** of the relation — that it has an initial value
which is a free choice, that it changes at a named event, that each change begins an attacking episode, and
what the designation `ATTACKING_TEAM` means. What it does not establish is **anything that holds it**. There
is no field, on any row, for which team has the ball.

So the new representation required is **one relation**, and the rest is already authored.

---

## 1 · What the corpus ESTABLISHES

Every item here is a standing decision or an authored contract item, cited.

**The relation has an initial value, and that value is a realization freedom.**
> **SD-R2** — *"Which team starts 'can remain a permitted free choice unless selected knowledge requires
> otherwise'. There is no default start location."*

So initial possession is explicitly a governed choice rather than a derived fact. The representation must be
able to *carry a choice* here, not compute one.

**It changes at a named event, and that event is already in the vocabulary.**
`POSSESSION_CHANGE` is a registered value of the `trigger` vocabulary, usable on the T1 transition row.
A transition carrying it is how the corpus says a possession change happened.

**Each change begins an attacking episode — and so do two other events.**
> **SD-14** — *"START, SCORE and POSSESSION_CHANGE each begin a new attacking episode. SD-14 'does not mean
> that every RPC requirement reinitializes whenever a new episode begins'."*

Note the **three** events. The episode relationship is therefore already authored, and already tied to
possession, which is why the possession question and the episode-scope question were never genuine
alternatives.

**A possession change continues play unless knowledge says otherwise.**
> **SD-20** — *"Turnovers play on: 'YES as ordinary/default soccer state unless selected knowledge explicitly
> creates a stoppage/reset consequence.'"*

Which is what A04's own transition carries: `playState: CONTINUE`.

**`ATTACKING_TEAM` denotes the current value of the relation.** From the Neutral Player Condition, a
contracted object:
> *"ATTACKING_TEAM ('in possession for the episode') is re-evaluated each episode; START and
> POSSESSION_CHANGE begin one (SD-14), so it holds 'currently in possession'."*

and
> *"All neutrals become teammates of the team now in possession."*

**A fixed-team reading is prohibited.** The same object authors P6b excluding `DEFENDING_TEAM` (*"forbids the
team out of possession"*) and excluding `TEAM_<id>` (*"No neutral is fixed to one team"*).

**And GF2 — the game form A04 itself selects — authors prohibitions phrased in possession terms.** Two items
on T2 (`transitions[].awardedTo`):

> `GF2-07.b` — *"LOST_BALL (forbidden: a rule returning a won ball to the team that lost it)"*
> `GF2-16.a` — *"NOT_LAST_TOUCH"*

**This is the strongest answer to the question as he worded it**, because GF2 is *selected* knowledge and has
nothing to do with Wide Zone. To evaluate "do not award the ball back to the team that lost it", the
representation must know which team lost it. To evaluate "not the team that last touched", it must know who
touched it. Neither is expressible without attribution.

Two honest qualifications. These particular lines are **not evaluated in A04**, because its transition
continues play and the register makes `awardedTo` N/A when `playState` is CONTINUE (RC-20) — the T1a/T1b/T2
lines carry no verdict in this run. And the Neutral Player Condition, which is the decisive case for the
*meaning* of `ATTACKING_TEAM`, is **contracted but not currently selected** by any of A01–A10. So:

- for *"already authored"*, the Neutral Player Condition is decisive and settles what the designation means;
- for *"existing selected knowledge"*, GF2's two `awardedTo` prohibitions are the instance, selected by A04,
  authored independently of Wide Zone, and evaluated in any game whose transition stops play.

Neither of those qualifications weakens the conclusion. They sharpen where the requirement already lives.

**A team designation may be evaluated at a moment.** The register states it of T2 outright:
> *T2 — "team designation **evaluated at the trigger**. N/A when playState is CONTINUE."*

---

## 2 · What the corpus does NOT establish

**Nothing holds the relation.** This is the whole gap. The rows that could have:

| | |
|---|---|
| `objects[]` | `kind`, `count`, `position.along`, `position.across`. **No owner.** The ball has a position and no holder. |
| `performers.teams[]` | `outfieldCount`, `goalkeeper`, `roles[]`. **No possession field.** |
| `performers.participation[]` | `state` (ACTIVE/INACTIVE/WAITING/RESTING/OBSERVING), `persistence`. None of those states is possession. |
| game level | nothing. |

So the representation can say that possession **changed** — a transition with that trigger — and cannot say
who **has** it. That asymmetry is the finding.

**What happens to the relation at SCORE is not established.** SD-14 says a score begins a new attacking
episode, but:
> **SD-R3** — *"'A valid post-score procedure is necessary', with no universal realization."*

So who is in possession at the start of a post-score episode is unauthored. See §6 — this has a consequence
beyond Wide Zone.

**Nothing links possession to scoring eligibility or to an objective.** No item, row or standing decision
states that the team in possession is the team eligible to score, or the team associated with a particular
physical objective. See §4, which is the part I was asked to be most careful about.

---

## 3 · The existing consumers

Seven register rows carry "team designation" as their value type. What each would need from the relation:

| Row | Path | What it needs |
|---|---|---|
| **P6b** | `performers.neutrals.affiliation.joins` | **The current value, continuously.** The authored value is `ATTACKING_TEAM` and affiliation is re-decided at every possession change. This is the decisive consumer. |
| **T2** | `transitions[].awardedTo` | **The value at the trigger.** The register says so in terms, and GF2 authors two prohibitions phrased as "the team that lost it" and "not last touch" — neither evaluable without attribution. |
| **T1a / T1b** | `transitions[].qualifiers.lastTouch` / `.endLine` | A designation qualifying a transition — evaluated at the transition, so at a moment. |
| **V14a** | `value.consequences[].referents.team` | A consequence's team referent. A04's authored value is *"ATTACKING_TEAM (the team performing the qualifying action)"* — a moment again. |
| **P9** | `performers.startPlacement[].group` | **Static is sufficient.** Start placement is at START, so one evaluation. |
| **J3** | `objectives[].team` | **Not possession.** See §4. |

Five of the seven want a value at a moment. One needs only the initial value. One is a different concept
entirely, and conflating it is the error to avoid.

---

## 4 · The three concepts, kept apart

Christian's instruction: *"don't assume that team in possession, team currently eligible to score, and team
associated with a particular physical objective are necessarily identical concepts unless existing knowledge
establishes that."*

**Existing knowledge does not establish it, and A04 demonstrates they separate.** GF2 authors:
> `J3 = EACH_TEAM: one shared target attacked by both`

So in the game we have been closing:
- **team associated with the objective** — neither, or both. One target, attacked by both teams. The
  objective associates with no single team, so this concept does not discriminate at all in A04.
- **team eligible to score** — both, continuously. Either team may score at that line at any time.
- **team in possession** — one at a time, and the only one of the three that discriminates.

So the identity he warned against is not merely unestablished; **in A04 it is already false.** Any
representation that collapsed them would have to call one of A04's two teams "the attacking team" — which is
exactly the unsupported `designation` we have just removed, and exactly why it had to go.

**His single-goal diagnostic survives the proposal.** The finishing game where the team winning possession
must check the ball out of the goal area before attacking the same goal separates possession from immediate
scoring eligibility in time. The proposal below says nothing about scoring eligibility, so it does not
foreclose that structure. No machinery is added for it, as instructed; it is used only as the test it was
offered as — and the proposal passes it because it is silent on the thing the example varies.

---

## 5 · The proposal

**One relation, at game level: which team currently holds the ball.**

What makes it the smallest corpus-supported form:

- **Its initial value is a governed realization choice**, not a derived fact — SD-R2 already says so, and the
  realization layer already carries governed choices with a supported choice space. The choice space is the
  established teams, which the game already holds.
- **Its change is bound to the already-registered `POSSESSION_CHANGE` trigger.** Nothing new is needed to say
  *that* a change happened; a transition already says it. What is new is only that the change has a subject.
- **`ATTACKING_TEAM` resolves against it.** The designation already means "currently in possession" by
  authored knowledge; today it resolves against nothing. This gives the existing token its referent rather
  than introducing a second way to say the same thing.
- **The episode relationship needs nothing new.** SD-14 already names the three events that begin an
  attacking episode, and `transitions[].startsEpisode` already marks them. An episode-scoped condition can
  then be expressed as "within the episode current at the time", using the boundary the transitions carry.

**What it must NOT include**, so the proposal stays the size the corpus supports:

- **no scoring eligibility.** Not linked by any authored item, and false of A04.
- **no objective association.** Same.
- **no account of how possession is gained or lost.** The corpus names the event, not the mechanism, and
  naming a mechanism would be inventing football.
- **no post-score rule.** SD-R3 leaves the post-score procedure to realization; this must not pre-empt it.
- **no attacking/defending labels on teams.** That is what we just removed.

**What genuinely new representation this amounts to:** one game-level relation with a team-valued current
state, a supported initial choice, and a binding to an existing trigger. One new thing, in a representation
that already has the vocabulary for its event, the standing decision for its initial value, and the
designation for its current value.

---

## 6 · What this check exposed, beyond the proposal

**An unresolved authoring decision in existing knowledge, independent of Wide Zone.** SD-14 says a **SCORE**
begins a new attacking episode. SD-R3 says the post-score procedure has no universal realization. So who is
in possession at the start of a post-score episode is unauthored — and because `ATTACKING_TEAM` means
"currently in possession", **`ATTACKING_TEAM` is undefined immediately after a score.**

That has a live consequence for the Neutral Player Condition: neutral affiliation is `ATTACKING_TEAM`,
re-decided at every episode boundary, and a score is an episode boundary. So in any game selecting that
condition, neutral affiliation after a score is undetermined by the knowledge. **This is not a Wide Zone
problem and not a consequence of anything proposed here.** It is a gap the check surfaced, and it is an
authoring decision.

**A small incompleteness in a fitNote.** The Neutral Player Condition's restatement says *"START and
POSSESSION_CHANGE begin one (SD-14)"*, omitting SCORE, which SD-14 names. The fitNote is narrower than the
standing decision it cites. Worth correcting on the record, and it is the same gap seen from the other side.

---

## 7 · Consequences of the two changes already made

**Removing A04's unsupported `designation` properties: no consequence at all.** Acceptance passed, Gate A
passed, render-eligible, and the rendering is unchanged — a coach still reads "12 players in total · 2 teams
of 6 · no goalkeepers". One test failed, and it was one of mine asserting the removed property existed.

**Nothing depended on it**, which is the evidence that it was never doing representational work. The
instantiated members are now empty, which is the honest state: the claim establishes that two teams exist and
nothing establishes anything else about them.

**Narrowing the instantiated-member authorization: production blast radius zero.** A04 passes all three
acceptance conditions under the narrowed rule.

**In tests, three assertions failed, and all three belong to his second category** — downstream assumptions
that depended on the blanket permission, not missing knowledge. One said outright *"the instantiated member is
authorized by the claim and recorded, so it is not an invention"*, which is the reasoning that let
`designation` through in the first place. All three are inverted to assert the new principle.

**One real defect in the check itself**, which I fixed because it is not a knowledge gap: member accounting
matched on the exact leaf only, so a structured *entailed* value was split into one false invention per field
— the same mistake this function's own comment records making once before. A false loss on a correct game is
as damaging as a missed one, because it teaches you to disbelieve the check.

248 cases green, tsc clean.

---

## 8 · What I would ask

1. **Is one relation the right size?** I have kept it to the carrier of a relation the corpus already
   describes. If you would rather it were narrower still — for instance only the initial value plus the
   episode boundary, with no continuous current state — that is a coherent smaller option, but five of the
   seven consumers want a value at a moment, so I do not think it would serve them.
2. **The post-score gap.** Whether to rule it now or record it, given it makes `ATTACKING_TEAM` undefined
   after a score for any game selecting the Neutral Player Condition.
3. **Where the relation lives.** The ball object is the intuitive home and has no owner field; a game-level
   relation needs no new collection. I have not chosen, because that is a representational decision and the
   corpus does not settle it.
