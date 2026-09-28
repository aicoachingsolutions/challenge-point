# The pilot boundary — direction established, and what a bounded pilot would cost

28 September 2026. SD-101 and SD-102 implemented; corpus rerun. **194 tests, suite green.**

**`GA-DIRECTION` passes.** The load-bearing structural dependency is closed, no new one appeared, and
what remains between here and a generated activity is not a mechanism question.

---

## 1. The two rulings, and what they did together

**SD-101** makes a defining selector constitutive. The class-defining value stands, the contradicting
contribution is preserved rather than resolved against it, and its reach to the element is untouched
for every other row.

**SD-102** authors the canonical decision as owner-authored knowledge. `GF2-12.a` is not touched:
still `ASSUMED`, still carrying the evidence that the original *"records this as unreconciled with
'building from their own end'"*. The decision sits beside it as `GF2-12.c`, `OWNER_RULING`, citing
you rather than the source. **The ambiguity and the decision about it are two separate records.**

### They met on one line, exactly as predicted

The canonical rule selects on `role=PRIMARY_SCORING`, which also reaches RPC-001's build-out
objective — whose own selector defines it as the build-out team's. SD-101 caught it:

```
CONSTITUTIVE_SELECTOR_CONTRADICTED  c:restated:RPC-001:RPC-001-11.a::J3
  restated:GF2::GF2-12.c entails "EACH_TEAM" on a property the class's own
  selector fixes as "BUILD_OUT_TEAM". The class-defining value stands and the
  contribution is preserved, not resolved against it.
```

`BUILD_OUT_TEAM` holds, `EACH_TEAM` is preserved, the contradiction is named, and the same item still
reaches and settles GF2's own objective. A test pins all four.

**SD-101 fires three times on the corpus.** The other two are the same value written twice by the
restater — a selector reading `connected-pass count` against an item reading `current connected-pass
count of ATTACKING_TEAM`. One of those two is a small loss: the item's phrasing said *whose* count and
the selector's does not. Reported rather than worked around.

### The boundary

| | |
|---|---|
| **Deterministic** | **Yes** — byte-identical under shuffled input, every stage stamped |
| **Direction** | **PASSES.** Two designations attack an objective, one of them a shared target |
| **Structural coherence** | Gate A fails on two: `GA-NO-FAILED-LINE` (a count) and `GA-INFORMATION` (§2) |
| **Realization left open** | **Yes** — 4 open lines and 8 existential claims, none blocking |
| **New load-bearing dependency** | **None** |

Derived 52, failed 57, open 4.

---

## 2. The Variable Target information trigger — the four facts, no vocabulary added

**The offending value is not a trigger.** `GA-INFORMATION` reads the `V17` line's whole derived value
as a trigger name, and that value is a prose list of five alternatives:

> `unordered {REGION_ENTRY {trigger region}; COACH_CUE†; FIRST_FORWARD_PASS†; REGION_ENTRY {final third}; REGION_ENTRY {attacking half} + first receiver†}; † off-list`

So the immediate cause is that `VARTARGET-05.b` carries an alternatives **set written as prose**,
which is the form SD-79 exists to restate — four other items were restated into machine-readable
arrays and this one was not.

**1 · The offending trigger.** Strictly, the whole string, because it is read as one name. Underneath
it, **two** members are marked off-list by the restater: **`COACH_CUE`** and
**`FIRST_FORWARD_PASS`**. The other three are `REGION_ENTRY`, which is registered.

**2 · The authored source phrase.**

> *"revealed only after play crosses a trigger line, or switches on a coach cue during play"*
> — Variable Target Condition, `setup_guidance`

with three realization behaviours: `RB-01` (first penetrating/forward pass), `RB-02` (ball enters the
final third), `RB-04` (first receiver in the attacking half).

**3 · Does a registered trigger already express it?** The registered list is `START`, `SCORE`,
`OUT_END_LINE`, `OUT_TOUCHLINE`, `POSSESSION_CHANGE`, `REGION_ENTRY`, `TIME_EXPIRY`, `STANDING`.

| | |
|---|---|
| *play crosses a trigger line* · *ball enters the final third* · *first receiver in the attacking half* | **`REGION_ENTRY` already expresses all three.** They are region entries with different regions |
| *first penetrating/forward pass* | **No.** Every registered trigger is a state change of the ball or the clock; none is a player action |
| *coach cue* | **No.** Nothing registered is an external signal. The restater also recorded that this one **conflicts with `VARTARGET-14.a`**, which authors the information dimension as `{STATE_TRANSITION, OPPONENT_ACTION}` with `EXTERNAL_SIGNAL (coach cue)` itself off-list |

**4 · The minimal addition, if you want one.** Two members, and they are different kinds of thing:

- **`ACTION`** *(or `FORWARD_PASS`)* — a player action the game can detect. The narrower name is
  honest about what the corpus actually needs and adds no capability beyond it.
- **`EXTERNAL_SIGNAL`** — a signal from outside play. This one has an argument against it already in
  the corpus: `VARTARGET-15.a` requires the trigger to be *"detectable by players and causally
  connected"*, and the IE library says *"external signals require additional scrutiny"*. **A coach cue
  may belong outside the boundary rather than in the vocabulary.**

**And a third option that adds nothing.** Restate `VARTARGET-05.b` into a machine-readable array under
SD-79. Three members are then registered `REGION_ENTRY` alternatives, and the question narrows to the
two that are genuinely unregistered — which may be enough to clear `GA-INFORMATION` if the two are
ruled outside the boundary rather than added. **I would look at that first**, because it is a
restatement rather than a vocabulary change.

Nothing added. Returned as asked.

---

## 3. The resolved-game output — built

It was already in progress when your note arrived, and it is done: `resolved-game.ts`,
`run-resolved-game.ts`, eleven tests. `npm run corpus:game`.

**It computes nothing.** A test asserts every value and its support are carried from the emitted
result, not recomputed. It carries four things a realization layer needs:

| | |
|---|---|
| `game` | 52 derived values, nested by the register's own paths |
| `open` (4) | SD-39 freedoms with authority and bounds. **Never filled here** |
| `existential` (8) | **SD-97 assertions, which appear in no line at all** — the visibility SD-97 removed, recovered |
| `notEstablished` (57) | absence is never a decision. Withdrawn lines are in neither list |

It found one latent defect on the way: the primary-event singleton has an empty selector, so SD-97's
rule classed it as *asserted but not individuated* — which SD-84 explicitly contradicts. Fixed in all
three places the rule is applied. No corpus line moved; it would have bitten the first singleton with
owned fields.

---

## 4. Contract coverage — the sixty-nine figure was wrong

I measured what the live guided pathway actually reaches, rather than counting the library.

**Thirteen guided learning goals reach twenty-one distinct knowledge objects.** Five of those are
already contracted: `GF2`, `GF4`, Wide Zone Advantage, Pass Combination Gate, Neutral Player
Condition. Three more contracts exist but no guided goal's selection reaches them: `RPC-001`,
`A01-02`, Variable Target Condition.

> **Sixteen additional contracts cover every guided learning goal. Not sixty-nine.**

Sixty-nine is the library. The guided pathway is much narrower, because selection commits to one game
form and three constraints per goal.

### 4.1 · What a bounded pilot costs, tier by tier

| Contracts | Goals | What it adds |
|---|---|---|
| 3 | 2 | central density, turnover reward, switch-of-play bonus |
| 4 | 4 | + progression bonus |
| **5** | **5** | **+ interception reward** |
| 8 | 7 | + `GF3`, small area, counter-press window |
| 10 | 9 | + `GF9`, goalkeeper included |
| 11 | 10 | + wide utilization bonus |
| 14 | 12 | + `GF11`, delay reward, recovery window |
| 16 | 13 | + `GF8`, transition trigger |

**Five additional contracts give five learning goals**, and they are the cheapest five because they
all sit on **Directional Possession, which is already contracted** and is the most-exercised game
form in the corpus.

### 4.2 · Answering your six questions

**1 · Which objects must be contracted.** Five: *central density condition · turnover reward ·
switch-of-play bonus · progression bonus · interception reward.* All are constraints; no new game
form is needed, because `GF2` is contracted.

**2 · Which goals that supports.** Five, and they are a coherent family — the attacking
build-and-progress problem:

| | |
|---|---|
| **A01** | Play Out from the Back |
| **A05** | Progress the Attack |
| **A04** | Beat Defenders 1v1 |
| **TA01** | Attack Quickly |
| **TA02** | Secure Possession |

**3 · What would be excluded.** Eight goals: `A02` Play Through Pressure, `A03` Create Scoring
Chances, `A06` Finish Attacks, `D01` Stay Organized, `D02` Win the Ball Back, `D03` Defend 1v1,
`TD01` Recover Organization, `TD02` Delay the Attack. They need four further game forms — `GF3`,
`GF8`, `GF9`, `GF11` — and eleven more constraints.

**The bounded pilot is therefore attacking-only.** Every defensive and transition-defensive goal falls
outside it. That is a real limitation on what the pilot can tell us and it should be stated to the
coaches rather than hidden by the goal list.

**4 · The minimum number.** **Five.** Two would support one goal and three would support two; five is
where the marginal cost per goal is lowest and the family becomes coherent.

**5 · Can they be produced incrementally?** **Yes, and they are the only part of this that can be.**
Contracts are input data. Nothing in the engine depends on which contracts exist; the resolved-game
output already runs on any input and would run on a five-goal corpus tomorrow. The realization layer
depends on the *shape* of the resolved game, which is now fixed, not on how many contracts fill it.

**6 · Would a bounded corpus compromise the guarantees?** **Not the deterministic or representational
ones — and there is a different risk you should weigh.**

- Determinism, stamping, byte-identical output: **input-independent.** Unaffected.
- SD-47's identity neutrality, SD-92's subordination, SD-101, SD-97, SD-83: all rules about *how*
  knowledge is read. Unaffected.
- **The risk is the opposite of the one the question implies.** The eight contracts were restated
  *together*, for a conformance check, and their non-claims were written against each other. A live
  selection picks five objects that were never restated as a set. Expect **more** unauthored lines on
  a real selection than on the corpus, not fewer — and expect the first real run to find declarations
  that do not compose, which is the same thing the corpus found at every stage.

  That is not a reason to avoid a bounded pilot. It is a reason to run the first bounded derivation
  before promising a date.

**One thing I could not measure**, and it matters for the count: the guided flow selects a *practice
situation* as well as a goal. `A01-02` is the only practice-situation contract, and I could not
establish from the selection pathway which situations a guided goal reaches. **If practice situations
are contracted separately, five is a floor rather than a total.**

### 4.3 · The three-way distinction you asked for

| | |
|---|---|
| **Before any pilot activity can be generated** | The resolved-game output (**done**) · a **realization layer**, which does not exist · the selection-to-derivation mapping · at least one complete contracted selection. **Gate A must pass on a real game**, which needs §2 settled |
| **For a useful bounded pilot** | The five contracts above, and an explicit statement that the pilot covers attacking build-and-progress only |
| **For full current-library coverage** | Sixteen contracts for all thirteen guided goals — plus free-text goals, which reach archetypes the guided route never does and are a separate question |

---

## 5. What I did not do

- Added no vocabulary; the trigger question is returned with its four facts.
- Did not restate `VARTARGET-05.b`, though I think that is the first thing to try.
- Did not author any of the five contracts.
- Did not begin another Phase B cluster.
- Left the Wide Zone `S6` collisions recorded and untouched. They did not become load-bearing.

Activity generation remains frozen.
