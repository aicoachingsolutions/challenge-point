# Replay: 60 captured activities against the minimum representation

16 September 2026. No implementation changed, nothing was generated. The 60 activities are the ones
captured in the causal expression audit; the eight invariants are the ones proposed in the runtime
read.

**The acceptance question, kept narrow:** can this game be laid out and played as written?

---

## The result in one line

**The eight invariants reject all 60 activities. Three of the 60 genuinely cannot be laid out. The
other 57 a competent coach would run without noticing.**

That is not a verdict on the hypothesis. It is a verdict on this particular set of eight, and it
splits into three separate problems, each with a different fix.

| | Count | Meaning |
|---|---|---|
| Activities replayed | 60 | 20 runs × 3 |
| Rejected by at least one invariant | 60 | |
| Cannot be laid out or played as written | **3** | all three are the same geometry failure |
| Rejected but runnable (false alarms) | **57** | 128 of 288 adjudicated findings overturned |
| Structural defects that passed all eight | **39** | 33 need a property the eight do not contain |

## 1. Correct rejections

**Geometry, 3 of 60.** The only failures that stop a coach pacing out the field:

| Activity | Text | Why it cannot be laid out |
|---|---|---|
| baseline s1 | "three zones: two 18 m (20 yd) wide channels and a central 18 m (20 yd) corridor" | 54 m across a 30 m width |
| ls-reinforcing s1 | "two 18 m (20 yd) wide channels on each side" | 36 m read charitably, 72 m read literally; impossible either way |
| em-shaping-wide-zone s1 | "two 18 m (20 yd) wide channels on a 40 x 30 m field" | 36 m across a 30 m width |

Caught by `regions-fit-area`. One challenger disputed the middle case; the arithmetic does not survive
either reading, so it stands.

**Roster contradictions, 3 of 60.** Caught by `performers-sum`. These do not stop a session — a coach
plays the format and ignores the headcount — but they are self-contradicting text, not defaults a
coach supplies:
- "10 players in a 6v6 format";
- "14 players in a 7v5 format";
- "Teams of 7 with a goalkeeper create a 7v5 overload".

**Realization failures, 57 of 60.** Caught by `selected-contribution-present`, which fired 57 times and
blocked playability zero times. This is the audit's finding reproduced exactly: the game runs, and the
knowledge that was selected is not in it.

## 2. False alarms

128 of 288 adjudicated findings were overturned: things a competent coach runs without noticing.

| Invariant | Fired | Overturned | The problem with it as written |
|---|---|---|---|
| `objective-object-team-role` | 60 | 35 | Its role leg is simply wrong on the text. All 60 scoring sections begin "Earn a point when…", so the scored-on role is stated every time. Only team ownership is unstated, and with one line a coach assigns ends in a second |
| `primary-object-fixed` | 59 | 29 | Fires on "mark a line beyond the first defenders". That is a setup-time instruction whose output is cones that then stay put. Two coaches would place it differently — a determinacy problem, not a fixedness one |
| `team-direction` | 47 | 26 | 38 setups state starting halves or thirds, which gives direction of travel; what is missing is the assignment of an objective per team |
| `performers-sum` | 23 | 13 | Overturned on the additive reading of "6v6 with goalkeepers" (14 against a 12 envelope). A coach plays 5+GK v 5+GK. Only the three self-contradicting rosters are undisputed |
| `consequence-typed-effect` | 24 | 13 | The sentences it fires on do have trigger, effect and beneficiary. The real complaint — vacuity, and an unbounded "quickly" — is a property this invariant does not contain |
| `referenced-performer-exists` | 33 | 10 | Genuine where a restart depends on a goalkeeper the setup never places; a false alarm where the text supplies its own alternative ("or a restart in your own half") |
| `regions-fit-area` | 5 | 3 | See below: it only bites when the text volunteers numbers |
| `selected-contribution-present` | 57 | 1 | Low noise, and never blocks anything — it is measuring something else entirely |

**Three of these fire on one underlying fact.** A single unowned scoring object marked "beyond the
first defenders" appears in 59 of 60 activities and trips `objective-object-team-role`,
`primary-object-fixed` and `team-direction` at once. One fact, three rejections, no additional
information.

**`regions-fit-area` rewards vagueness.** It fired 5 times in 60, and every firing was on an activity
that volunteered dimensions. "A central corridor divides the field" passes because it never says how
wide. The invariant punishes the specific and passes the vague — the opposite of what it is for.

**The methodological finding.** Four of the eight were applied *oppositely on identical text* by
careful readers: `primary-object-fixed` was overturned 15 of 15 by one challenger and upheld 15 of 15
by another. An invariant whose verdict depends on who is holding it is not yet a gate. Each needs a
decision procedure, not a name.

## 3. False negatives

39 structural defects passed all eight checks. 33 need a property the eight do not contain. **Two of
the eight tables have no invariant at all.**

| Defect found | Instances verified | Which table | Caught by any of the eight? |
|---|---|---|---|
| A value modifier ranks a region the field does not have: "Points are worth most through the middle, then wide, then **deep**" | **19 of 60** name a deep tier; **0** define a deep region | Rules of value × Space | No |
| A value modifier whose condition can never be true: "worth more when you score them where you have the extra numbers", in an even-sided game | **3 of 60** | Rules of value | No |
| Restart with a goal kick in a game that has no goals | **3 of 60** (all of emphasis-applying) | Objects × Transitions | No |
| No start of play stated anywhere | **2 of 60** | Transitions | No |
| Two rules sharing one trigger with incompatible effects: "regain and reset through the goalkeeper" beside "no reset, no stoppage" | several | Rules of value | No — consequences are typed one at a time, never compared |
| A start no one can execute: both teams placed in outer zones, "play begins with a pass from the central zone" | ps-goal-kicks s2 | Transitions | No |
| A count bound to a region that cannot honour it: "7v5… one team has a numerical advantage in one half", with no half marked | several | Performers × Space | No — performers are counted globally |
| A rule demanding a player change teams mid-play: "7v5 with an extra attacker for the team in possession" | ls-reinforcing s3 | Performers × Transitions | No |
| Regions referenced by restarts that were never marked: "restart from the defensive third" on a field cut lengthwise | several | Space | No |

### The ninth-category shortlist

Thirteen properties were proposed. Three account for most of the misses:

1. **`referenced-region-exists`** — every region named by a setup, start, restart, rule or value
   modifier must be instantiated in Space. The single largest hole, raised by all four challengers.
2. **`transitions-complete`** — start and each restart trigger maps to exactly one procedure, naming who
   takes it and from where. Table 7 has no invariant today.
3. **`value-condition-evaluable`** — a value modifier's condition must name existing referents and be
   capable of being both true and false in the game as laid out.

The rest, worth keeping on the list: `regions-well-formed` (determinacy — the fix for both the
vagueness loophole and "beyond the first defenders"), `no-contradictory-rules`, `objects-instantiated`,
`start-state-valid`, `trigger-decidable`, `consequence-changes-something`, `region-bound-counts`,
`rule-scope-stated`, `performer-fully-specified`, `score-resets-play`.

**None of these needs a ninth table.** Every one of them is a constraint over the eight areas already
proposed, mostly *across* two of them. That is the encouraging part: the representation's shape held;
its checks were underspecified.

## What this says about the hypothesis

**The eight areas were sufficient to hold every defect.** Not one of the 39 misses required a category
outside envelope, space, performers, objects, objectives, direction, transitions and rules of value.
What was missing was checks, especially checks that cross two tables.

**But the invariant set was doing two jobs at once,** and that is what produced 60 of 60. Seven
invariants ask "can this be laid out and played"; `selected-contribution-present` asks "did the
selected knowledge reach the field". They should be two separate gates with different consequences. A
game that is coherent but unrealized is a different failure from a game that cannot be set up, and the
audit already proved the system produces plenty of the first.

**Recommended split:**
- **Gate A, structural.** Can it be laid out and played? Today: 3 of 60 fail, and the three
  highest-value missing checks would raise that substantially.
- **Gate B, realization.** Did each selection reach the field? Today: 57 of 60 fail.

## Method

- **Source:** the 60 activities as a coach reads them, from the committed audit evidence file. Nothing
  was regenerated.
- **Replay:** four agents, 15 activities each, building the eight tables from the text plus the session
  envelope (12 players, 40 × 30 m, 20 minutes), then checking each invariant and recording separately
  whether a failure blocks playability.
- **Challenge:** an adversarial pass per batch, instructed to defend the coach rather than the
  invariant — to overturn rejections a coach would run through, and to break activities that passed.
- **Synthesis:** one aggregation pass.
- **Verification:** every load-bearing count in this report was re-checked directly against the
  captured activities, independently of the agents.

**Three agent claims corrected by that verification:**
- "No activity instantiates a ball" — wrong. All 60 list balls under Equipment. The ball is absent from
  Setup and Rules, which is a rendering matter, not a missing object.
- "'Teams start with the ball' puts two balls in play" — an over-read of idiomatic phrasing.
- "gf-positional s2 states no start of play" — it states a restart but no initial start. Two activities
  state neither.

## Preserved as unresolved

Game Form restart × From Goal Kicks; central value weighting × Wide Zone Advantage; Turnover Reward's
missing authored consequence; Environmental Manipulation family-ID provenance; Counterattack timing;
and the three wording issues (Neutral Player's "one or two", Wide Zone Advantage's bonus point,
Directional Possession's same-direction wording).
