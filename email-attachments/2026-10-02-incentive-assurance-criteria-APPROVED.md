# Ecological / Incentive Assurance Criteria

**Status: APPROVED for use in authoring decisions — Christian, 2 October 2026.** Nothing in the engine reads
this document; it governs how we decide, and a decision made under it is recorded in the authored item's own
`fitNote` / `basisEvidence`.

---

## What this is

Six questions an authoring decision must answer before a new incentive meaning is written into canonical
knowledge. Christian's reason for wanting them, in his words:

> *"I mean establishing the criteria we will use when making authoring decisions like this one, so machine
> convenience doesn't inadvertently determine ecological design."*

The risk is specific and we have just walked into it. The Wide Zone trigger has three candidate readings —
ball, player, touch — and they differ sharply in how easy they are to evaluate deterministically. Left to
the engine, the easiest reading wins, and the easiest reading is not obviously the best football. These
criteria exist so that the ecological question is asked **first** and the machine question second.

## What this is not

- **Not the Change Assurance System.** No tooling, no automation, no gate. This is a checklist for a
  conversation.
- **Not a new representational area.** It governs how we *decide*, not what the representation holds.
- **Not a scoring rubric.** Nothing is summed and nothing passes on points. Each question is answered in
  prose, and a failure on one is not traded against a pass on another.
- **Not mine to approve.** I drafted it; the criteria are Christian's call, and so is every decision made
  under them.

## Where the criteria come from

They formalise what the project already holds, rather than importing anything new.

- **The incentive invariant**, from `CONSTRAINT_INCENTIVE_FRAMEWORK.md`: *"Incentives raise the value,
  attention, and visibility of an opportunity. They must not script the behavior."* And its restatement:
  *"an incentive makes a solution worth considering; it never makes it the only solution."*
- **"Invite, not force"** — the test every library row's `contextualAudit` already asserts.
- **GF11's finding** — compactness *emergent*, not prescribed.
- **Christian's scoring-ownership rule** — reward the one consequence that shapes behaviour, and let
  everything else emerge.
- **The five influence dimensions** the framework maps mechanisms onto: exploration, exploitation,
  attention, risk, tactical priorities.

What is new is only that these are now asked **as questions, at authoring time, of a specific decision**.
Today the guardrail lives as prose on library rows and as wording checks in the communication layer — it
stops us *phrasing* an incentive as an instruction, and says nothing about whether the incentive's meaning
is ecologically sound. That is the gap.

---

## The six criteria

Each gives the question, what a pass and a failure look like, what evidence answers it, and **who** can
answer it. That last column matters: some of these are machine-checkable, some are coaching judgement, and
some are Christian's alone. Recording which is which is half the value.

### 1 · Objective

> **Can two competent observers, watching the same passage of play, agree whether the condition was
> satisfied — without inferring intent?**

- **Passes** when satisfaction turns on observable facts: where the ball was, where a player was, whether a
  touch occurred and where.
- **Fails** when it turns on intent, quality, or a judgement that two coaches would reasonably split on
  ("a deliberate switch", "a good pass", "committed pressure").
- **Evidence:** write the condition as a sentence a coach would use, then ask what a disagreement about it
  would be about. If the disagreement is about what happened, it passes. If it is about what someone
  *meant*, it fails.
- **Who answers:** partly checkable (SD-15 already forbids inventing a number for a qualitative term), but
  the judgement about intent is a coaching one.

**Why it is first:** this is the criterion machine convenience pushes hardest on, in both directions. An
unobservable condition cannot be evaluated — but neither should we pick the most trivially observable
reading *because* it is observable. Objectivity is a floor, not a tiebreaker.

### 2 · Legible

> **Can the players perceive the cue the incentive attaches to, and know what is being rewarded, while
> playing?**

- **Passes** when the rewarded opportunity is visible in the environment — a marked region, a countable
  state, a reachable target — and a player can tell in the moment that it is available.
- **Fails** when the reward is real but imperceptible: a condition only an observer with a clipboard could
  track, or one whose satisfaction a player learns about afterwards.
- **Evidence:** the library already records `visibilityEffect`, and a marked region with an established
  function is the clearest case. If the only way to explain the condition to players is a rule recital
  rather than a pointed finger, that is a warning.
- **Who answers:** coaching judgement, informed by whether the game establishes a perceptible feature.

**Note on our own vocabulary:** `perceptual-reference` is exactly this criterion expressed as a region
function. A channel established as a perceptual reference is a legibility claim already in the knowledge.

### 3 · Opposition-robust

> **Can the opposition contest it — and does the incentive survive their doing so?**

- **Passes** when the opponent has a real counter, and exercising that counter makes the game better rather
  than breaking the activity. A contested bonus is a genuine problem for both sides.
- **Fails** in two distinct ways, and both matter:
  - **uncontestable** — the reward can be taken with no opposition involvement at all, so it stops being a
    performance problem (the sharpest version: a condition that can be satisfied once and left satisfied);
  - **trivially deniable** — the opponent can switch it off so cheaply that the incentive never operates,
    which wastes the design.
- **Evidence:** describe the opponent's best response. If their best response is "ignore it" or "stand
  there", the criterion fails.
- **Who answers:** coaching judgement. The framework already notes we cannot yet *represent* a two-sided
  incentive contest (`DISCOVERY_INCENTIVE.md`), so this is asked of the design and not of the engine.

### 4 · Affordance-preserving

> **Does the incentive keep the problem a problem — several ways to succeed — or does it collapse into one
> prescribed action?**

- **Passes** when the rewarded affordance can be realised several ways, and when *not* using it remains a
  viable choice.
- **Fails** when the reward makes one action the only sensible one, or when it is so cheap and permanent
  that the choice disappears in the other direction.
- **Evidence:** the invariant verbatim — *"an incentive makes a solution worth considering; it never makes
  it the only solution"* — plus the row's own `contextualAudit`. For Wide Zone that audit is **"Zones
  optional"**, and the contract independently authors **"Entering must not be compulsory"**. So for this
  object the criterion is not taste: it is authored knowledge, and a reading that makes channel use
  effectively mandatory contradicts the contract.
- **Who answers:** largely checkable *against the authored audit*, which is a real strength here.

### 5 · Proportionate

> **Does the magnitude match the difficulty, and does it leave the base event meaningful?**

- **Passes** when the reward is worth pursuing without dominating: the ordinary route to scoring remains a
  live option, and the bonus route costs something.
- **Fails** when a cheap condition carries a large multiplier (the bonus becomes the default and the base
  event becomes pointless), or when a demanding condition carries a trivial one (nobody changes anything).
- **Evidence:** state the base value, the modified value, and the cost of satisfying the condition. Then ask
  what fraction of scores would carry the bonus if players simply played well. "Nearly all" and "almost
  none" are both failures.
- **Who answers:** coaching judgement, and the one most improved by pilot evidence rather than argument.

### 6 · Learning-Relevant

> **Does the incentive increase the value, attention, or visibility of an opportunity meaningfully related
> to the intended learning problem?**

Added on Christian's ruling of 2 October, because the other five answer whether an incentive works
ecologically and operationally and none of them asks whether the opportunity being made more valuable is
the one the session is for.

- **Passes** when it biases exploration toward opportunities relevant to the learning problem **while
  leaving the learner's solution open**.
- **Fails** when the incentive may well affect play or scoring but rewards something **incidental** to the
  intended learning.
- **Evidence:** the Learning Goal, the affordance lens, and the constraint's own `targetAffordancePrimary`,
  read together. Trace the chain: what does the foundation constraint make scarce, where does that move the
  opportunity, and is the rewarded thing on that path?
- **Who answers:** coaching judgement, against the selected Learning Goal. Not checkable, because relevance
  is a claim about meaning rather than structure.

**It is deliberately not phrased as requiring a target behaviour.** His words: *"The Learning Goal
establishes the problem/opportunity landscape we are trying to support; it does not specify the player's
solution."* So this criterion asks whether the reward points at the right **landscape**, never whether it
produces a particular action — which would be the invariant violated under a different name.

---

## When a failure is a veto, and when it is evidence

His ruling of 2 October: not every failure is an automatic veto, and not every failure is an equivalent
finding either. A failure is recorded as one of two kinds.

**CONTRADICTION — the candidate is unavailable.** The failure conflicts with canonical authored knowledge or
with a governing invariant. There is nothing to weigh: the reading cannot be authored as it stands.

**CONCERN — a recorded finding.** The criterion exposes an ecological or coaching weakness, a contextual
problem, or an unresolved trade-off that does not itself contradict authoritative knowledge. It is evidence
to weigh, and weighing it is the owner's.

**Criterion 4 is not a veto because it is criterion 4.** His words: *"It is a veto when the failure
establishes contradiction with the governing incentive invariant or other authoritative knowledge."* So the
test is the nature of the conflict, not which question raised it — and the same criterion can produce a
contradiction in one candidate and a concern in another.

The Wide Zone candidates show both. The **player** reading conflicts with the row's own audit *"Zones
optional"* and with the contract's *"Entering must not be compulsory"*, so its failure is a CONTRADICTION
and the reading is unavailable. The **ball** reading's proportionality result is a real weakness in this
geometry and contradicts nothing authored, so it is a CONCERN — evidence against it, not a bar.

---

## Where the answers live

**Approved: the authored item's own `fitNote` / `basisEvidence`.** His reason: *"I want a later reader to
encounter the authored meaning and the evidence for authoring it together."* A separately referenced ruling
artifact may come later if these records grow unwieldy; there is no reason to create one now.

---

## How to use it

1. State the candidate meanings explicitly, as alternatives. If there is only one, say why.
2. Answer all five questions for each candidate, in prose, in the ruling record.
3. Where a candidate fails, say which criterion and why — a failure is a finding, not a veto to be argued
   around.
4. Where the criteria do not separate the candidates, say so, and the decision is made on other grounds and
   recorded as such.
5. The answers go in the restatement's `fitNote` or `basisEvidence`, beside the authored value, so a later
   reader sees the reasoning and not just the result.

**It applies to:** authoring a new incentive meaning, changing a magnitude or operation, and adding a
trigger or condition semantics. **It does not apply to** typing an already-authored value, correcting a
projection, or any engine change that alters no meaning.

---

## Candidate comparison — ball, player or touch

The three readings of the qualifying interaction, compared. **Written before criterion 6 existed**, so the
tables below answer five questions rather than six; the comparison is kept as it stood because its result is
what produced the ruling, and the player reading's CONTRADICTIONS do not depend on the missing criterion.
The approved six are applied to the chosen formulation in the section after this one.

**What is authored.** The source sentence is *"Actions starting in or moving through the wide channel earn
an advantage (bonus point, free restart, or scoring multiplier)"*. The advantage is now ruled: a value
modifier, MULTIPLY, magnitude 2, on the existing primary scoring event. The library classifies the
mechanism as `positional_or_scoring_advantage` — *hybrid: opens an opportunity and rewards using it* — with
`targetAffordancePrimary: exploit_space` and `visibilityEffect: increase`. The contract records that it does
**not** establish *"what counts as 'moving through' (ball, player, touch)"*.

**Candidate A — the BALL enters or crosses the channel.**

| | |
|---|---|
| Objective | **Strong.** Ball position is observable and two observers would agree. |
| Legible | **Strong.** Players can see the ball in the marked strip. |
| Opposition-robust | **Pass, with a CONCERN.** The channel can be defended, though a ball may also arrive there by deflection or clearance, which no one contested. |
| Affordance-preserving | **Pass, with a CONCERN.** Many ways to put the ball there, so no single action is prescribed. But it rewards accidental entry, which weakens the link to *using* the width rather than merely reaching it. |
| Proportionate | **CONCERN, and the figure is checkable.** On A04's realized geometry each channel is 7.5 m of a 30 m width — `[0, 7.5]` and `[22.5, 30]` — so the two together are **50% of the pitch width**, or 40% at the preferred 6 m. A great deal of ordinary play crosses them. ×2 on a condition most attacks satisfy incidentally makes the bonus the default and the base value close to decorative. |

**Candidate B — a PLAYER is in, or enters, the channel.**

| | |
|---|---|
| Objective | **Pass**, but underdetermined: any player, an attacker, the ball carrier? Each is observable; the knowledge picks none. |
| Legible | **CONCERN.** Visible, but what is rewarded is occupancy rather than an action, which is harder to coach to. |
| Opposition-robust | **CONTRADICTION.** A team can station one player in each channel for the whole activity. The condition is then permanently satisfied and the opponent has no counter that matters. |
| Affordance-preserving | **CONTRADICTION.** Once permanently satisfied the condition stops being a choice, which is the collapse the invariant forbids — and it contradicts the authored audit **"Zones optional"** and the authored **"Entering must not be compulsory"**, because channel occupancy becomes simply correct. |
| Proportionate | **CONCERN**, and moot given the contradictions above: a free, permanent ×2. |

**Candidate C — a TOUCH: the ball is played or controlled by a player within the channel.**

| | |
|---|---|
| Objective | **Pass, with a CONCERN.** A touch and its location are observable, though it is a finer call than ball position alone — two observers could split on a touch right on the line. |
| Legible | **Strong.** "You used the wide channel" is the coaching cue, and it matches `exploit_space` directly. |
| Opposition-robust | **Strong.** Preventing a controlled touch in the channel is a real defensive task, and doing it well is a genuine counter rather than switching the incentive off. |
| Affordance-preserving | **Strong.** It rewards using the width without specifying how — receive, carry, combine, cross — so several solutions remain and declining remains viable. |
| Proportionate | **Plausible.** The most demanding of the three, so ×2 is better matched; it cannot be taken by loitering or by a deflection. |

**What the criteria produce.** They separate the candidates clearly. B fails three criteria, and two of those
failures are **CONTRADICTIONS** — against *authored* knowledge rather than taste, namely "Zones optional" and
"Entering must not be compulsory" — so B is **unavailable** rather than merely unattractive. A passes the floor and is weak on
proportionality for a reason that is quantitative and checkable: the two channels are 50% of A04's width at
the realized extent, so a condition on mere ball presence is satisfied incidentally. C is the strongest on the three criteria that
carry the ecological intent, and its weakness is the one the engine cares about most — a touch is a finer
observation than a position.

**Which is exactly the tension Christian named.** The reading that is easiest to evaluate deterministically
(A, and B more so) is not the one the ecological criteria favour. If we had chosen for machine convenience
we would have chosen A.

**What the criteria do NOT settle, and what is still his:**

1. **Whose touch.** Any player, the scoring team, or the team in possession at the time. The criteria do not
   choose; opposition-robustness mildly favours restricting it to the attacking team, since otherwise a
   defensive clearance from the channel could arm the opponent's bonus.
2. **"Starting in" versus "moving through".** The source authors **two** modes and ruling on a subject does
   not resolve the mode. They are different conditions: an origin and a traversal.
3. **The episode scope**, already returned separately: "within the same attacking episode" has no
   representable home, and defining a general attacking-episode scope needs possession attribution that is
   not established.
4. **Whether ×2 is right** once the condition is settled. Proportionality can only be properly answered
   against a chosen condition, and best against pilot evidence.

---

## First canonical application — the Wide Zone qualifying interaction

**The formulation evaluated, in Christian's words:** *"a controlled attacking-team touch within the wide
channel"*, with two stated intentions — attacking-team rather than any player, because *"a defender's
clearance from the channel should not satisfy the attack's qualifying condition"*; and no requirement of
movement into or through the channel, because *"a player who has already found width and receives or
controls the ball there is legitimately exploiting that space. Requiring traversal risks prescribing a
particular movement solution."*

**The selection this is being authored into.** Learning Goal **Beat Defenders 1v1**; game form GF2;
foundation constraint **Central Density Condition** (*"increase defensive pressure in central areas"*,
`protect_space`, audit *"Do not restrict movement"*); shaping constraint **Wide Zone Advantage**
(`exploit_space`, audit *"Zones optional"*); affordance lens **Line-Breaking Opportunity** (*"options that
penetrate defensive lines"*).

### 1 · Objective — **Pass, with one CONCERN that needs a word settled**

A touch and its location are observable, and restricting it to one team is observable. The load-bearing word
is **"controlled"**, and it can be read two ways:

- **"retained possession"** — observable, and two coaches would agree. Passes.
- **"deliberate"** — an intent judgement, which this criterion excludes by construction.

**CONCERN:** the formulation does not yet say which. SD-15 is adjacent and instructive — no number may be
invented for a qualitative term — and the same discipline applies here: "controlled" needs a decidable test,
not a number. I would ask for the first reading, and I have not assumed it.

### 2 · Legible — **Pass**

"Use the wide channel" is the coaching cue, the channel is marked, and the game establishes it as a
`perceptual-reference`, which is this criterion expressed as a region function. A controlled touch is also
legible to the player taking it, which a purely positional condition is not.

### 3 · Opposition-robust — **Pass, and the attacking-team restriction strengthens it**

Preventing a controlled touch in the channel is a real defensive task, and under central density contesting
the channel pulls the defence out of the middle — which is the intended ecological effect rather than a
weakness. His restriction improves the criterion directly: without it a defensive clearance from the channel
would arm the attack's bonus, which is a reward with no opposition involvement at all.

### 4 · Affordance-preserving — **Pass, and the no-traversal decision is what secures it**

Declining to require movement into or through the channel is precisely what keeps several solutions open: a
player may already be wide, may move there, may receive, carry, combine or cross. Nothing prescribes a
movement, so the invariant holds and *"Zones optional"* is respected — not using the channel remains viable.

**One residual, about the authored source rather than the criterion.** The source authors two modes:
*"actions **starting in or moving through**"*. His formulation satisfies the first. Declining to **require**
traversal is not the same as deciding whether a traversal with no controlled touch — a ball played through
the channel — **also** qualifies. If it does not, part of the authored source goes unexpressed. That is a
decision rather than a defect, and it is open.

### 5 · Proportionate — **Deferred on his instruction, and the ground has moved**

Not evaluated, as directed: *"magnitude as still open; proportionality should be evaluated against the actual
condition rather than inherited from the example."* Worth recording what changes, so the later evaluation
starts from the right place: the BALL candidate's CONCERN was that the two channels are 50% of A04's realized
width, so mere ball presence is satisfied incidentally. A **controlled touch by the attacking team** is a
deliberate act, not an incidental one, so that specific objection largely dissolves and ×2 is materially more
defensible than it was against ball-presence. It is not thereby established.

### 6 · Learning-Relevant — **Pass, with a CONCERN worth his attention**

The chain holds, and it is the reason this constraint is the *shaping* one in this selection: central density
makes the centre scarce, which moves the penetration opportunity wide; the channel makes that opportunity
legible and valuable; a defender must come out to it, and that is where a 1v1 becomes available. So the
reward points at the landscape the Learning Goal is about, and the solution is left entirely open — which is
the pass condition as he worded it.

**CONCERN.** The Learning Goal is *Beat Defenders 1v1* and the lens is *line-breaking*, but the condition as
formulated is satisfied by **controlling the ball in the space** — not by engaging a defender, and not by
penetrating. A team could circulate into the channel and back out, never attempt the 1v1, and still take ×2.
So the incentive rewards **finding** the space rather than **using it against someone**.

I do not think this is a contradiction. The invariant forbids scripting the solution, so an incentive that
*required* a 1v1 engagement would be the more dangerous design, and `exploit_space` is this constraint's
authored target rather than "beat a defender". But it is a real gap between what is rewarded and what the
session is for, and it bears directly on magnitude — an argument for a multiplier that biases attention
rather than one large enough to pay for circulation.

### The one structural finding — and it touches the issue he asked to keep separate

**"Attacking-team" cannot be evaluated without something the representation does not establish.** To know a
touch was the attacking team's, the game must establish either:

- **which team is attacking at the moment of the touch** — live possession attribution, which I could not
  find established; or
- **that the touch belongs to the team that subsequently scored** — determinate at scoring time without
  possession attribution, but it needs a window tying the touch to the score, which is the **episode scope**.

So the two are not independent. His instruction was to keep the episode-scope issue separate and not invent
an attacking-episode representation to support this incentive — and the attacking-team qualifier makes that
scope **load-bearing for this condition** rather than merely desirable. I am reporting it rather than working
around it, and I have invented neither mechanism.

This does not make his direction wrong. The restriction is well-reasoned and the criteria support it: a
defensive clearance should not arm the attack's bonus. It means the condition cannot be fully authored until
one of those two is settled, and that the separation he intended may not be available.

### Status of this application

Evaluated, not authored. Nothing has been written into canonical knowledge. Outstanding for him, in the order
they block:

1. **"Controlled"** — retained possession, or deliberate. The second fails criterion 1.
2. **How "attacking team" is established** — live possession attribution, or episode-tied to the scorer.
   Either way, the dependency above.
3. **Whether a traversal with no controlled touch also qualifies** — the authored source's second mode.
4. **Magnitude**, after 1–3, as he directed.

---

## One thing these criteria would already have caught

`CONSTRAINT_INCENTIVE_FRAMEWORK.md` carries an open question from Round 7.4 that has been waiting for a
home:

> *does giving the attacker's window an explicit incentive (`Transition Bonus`) improve representativeness,
> or does it over-script the race and violate the guardrail above?*

That is criterion 4 asked of a different decision, and the framework already says it *"should be resolved
as part of the incentive framework, not as a one-off"*. If these criteria are adopted, that question has a
procedure rather than a note.

---

## Status

**Approved for use, 2 October 2026.** Christian's three rulings on the draft are incorporated:

1. **A sixth criterion, Learning-Relevant**, added above in his wording, with the pass condition he
   specified — biases exploration toward relevant opportunities while leaving the learner's solution open —
   and deliberately not phrased as requiring a target behaviour.
2. **CONTRADICTION versus CONCERN**, so a failure is weighed by the nature of the conflict rather than by
   which criterion raised it. Criterion 4 is not a veto for being criterion 4.
3. **The reasoning lives in the authored item's `fitNote` / `basisEvidence`**, so a later reader meets the
   meaning and its evidence together. A separate ruling artifact only if these records become unwieldy.

The question I raised about a missing criterion is answered by (1). Nothing else is outstanding on the
criteria themselves; what is outstanding is the Wide Zone condition, listed in the application above.
