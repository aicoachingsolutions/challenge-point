# Ecological / Incentive Assurance Criteria

**Status: DRAFT for Christian's approval. Not yet in force.** Nothing in the engine reads this document.

---

## What this is

Five questions an authoring decision must answer before a new incentive meaning is written into canonical
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

## The five criteria

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

## Worked example — the Wide Zone qualifying interaction

This is the decision in front of us, run through the criteria. **I am not making it.** The purpose is to
show what the criteria produce and to give Christian the evaluation he asked for before ruling.

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
| Opposition-robust | **Adequate.** The channel can be defended, though a ball may also arrive there by deflection or clearance, which no one contested. |
| Affordance-preserving | **Adequate.** Many ways to put the ball there, so no single action is prescribed. But it rewards accidental entry, which weakens the link to *using* the width rather than merely reaching it. |
| Proportionate | **Weak, and the figure is checkable.** On A04's realized geometry each channel is 7.5 m of a 30 m width — `[0, 7.5]` and `[22.5, 30]` — so the two together are **50% of the pitch width**, or 40% at the preferred 6 m. A great deal of ordinary play crosses them. ×2 on a condition most attacks satisfy incidentally makes the bonus the default and the base value close to decorative. |

**Candidate B — a PLAYER is in, or enters, the channel.**

| | |
|---|---|
| Objective | **Adequate**, but underdetermined: any player, an attacker, the ball carrier? Each is observable; the knowledge picks none. |
| Legible | **Moderate.** Visible, but what is rewarded is occupancy rather than an action, which is harder to coach to. |
| Opposition-robust | **Fails — uncontestable.** A team can station one player in each channel for the whole activity. The condition is then permanently satisfied and the opponent has no counter that matters. |
| Affordance-preserving | **Fails.** Once permanently satisfied the condition stops being a choice, which is the collapse the invariant forbids — and it contradicts the authored audit **"Zones optional"** and the authored **"Entering must not be compulsory"**, because channel occupancy becomes simply correct. |
| Proportionate | **Fails.** A free, permanent ×2. |

**Candidate C — a TOUCH: the ball is played or controlled by a player within the channel.**

| | |
|---|---|
| Objective | **Adequate.** A touch and its location are observable, though it is a finer call than ball position alone — two observers could split on a touch right on the line. |
| Legible | **Strong.** "You used the wide channel" is the coaching cue, and it matches `exploit_space` directly. |
| Opposition-robust | **Strong.** Preventing a controlled touch in the channel is a real defensive task, and doing it well is a genuine counter rather than switching the incentive off. |
| Affordance-preserving | **Strong.** It rewards using the width without specifying how — receive, carry, combine, cross — so several solutions remain and declining remains viable. |
| Proportionate | **Plausible.** The most demanding of the three, so ×2 is better matched; it cannot be taken by loitering or by a deflection. |

**What the criteria produce.** They separate the candidates clearly. B fails three criteria, and two of
those failures are against *authored* knowledge rather than taste — "Zones optional" and "Entering must not
be compulsory" — so B looks unavailable rather than merely unattractive. A passes the floor and is weak on
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

## One thing these criteria would already have caught

`CONSTRAINT_INCENTIVE_FRAMEWORK.md` carries an open question from Round 7.4 that has been waiting for a
home:

> *does giving the attacker's window an explicit incentive (`Transition Bonus`) improve representativeness,
> or does it over-script the race and violate the guardrail above?*

That is criterion 4 asked of a different decision, and the framework already says it *"should be resolved
as part of the incentive framework, not as a one-off"*. If these criteria are adopted, that question has a
procedure rather than a note.

---

## Status and what I would ask

Draft, for Christian's approval, and deliberately short. Three things I would want his view on before it is
in force:

1. **Are these the five?** They are his names, read against the existing framework. If one is missing —
   something about the *learning goal* the incentive serves, which none of the five asks — it should be
   added before use rather than after.
2. **Is a failure a veto?** I have written them as findings, not vetoes, because B's failures look
   decisive while A's look like a trade-off. If a failure on criterion 4 is meant to be absolute, since it
   is the invariant, that should be stated.
3. **Where do the answers live?** I have suggested the restatement's own `fitNote`/`basisEvidence`, which
   keeps the reasoning beside the authored value. If they belong in a separate ruling record instead, that
   changes what I write next.
