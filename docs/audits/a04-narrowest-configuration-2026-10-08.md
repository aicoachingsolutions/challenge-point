# The narrowest authorized A04 configuration — investigation, 2026-10-08

Investigation only. Nothing was implemented, no knowledge was authored, generation stayed frozen, and
the other twelve Learning Goals were measured but not touched.

## 1 · Can A04 be legitimately realized without the Wide Zone modifier?

**Yes, and nothing had to be removed to make it pass — it already passes.**

Measured two configurations through the same pipeline (`runDerivation` → `assembleResolvedGame` →
`realize` → `runPostRealizationGates` → `renderConcreteGame` → `checkFidelity`):

| | A · as selected | B · narrowest (no Wide Zone) |
|---|---|---|
| lines | 51 | **32** |
| derived / open / existential / notEstablished / elements | 29 / 6 / 2 / 7 / 7 | 13 / 4 / 2 / 6 / 4 |
| Gate A | DEFERRED_TO_REALIZATION | **DEFERRED_TO_REALIZATION** |
| knowledge verdict | PASS | **PASS** |
| realization authorized | true | **true** (`notAuthorizedBecause: []`) |
| acceptance (closed-without-authority / lost / invented) | 0 / 0 / 0 | **0 / 0 / 0** |
| post-realization gates | validated | **validated** |
| regions | line, channel, channel | **line** |
| `value` | primaryEvent + valueModifiers | **primaryEvent only** |
| coach instructions | 19 | **10** |
| fidelity VIOLATIONS | 0 | **0** |

Configuration B's whole `value` is `{primaryEvent: {value: 1, kind: line_crossed}}`. `valueModifiers`,
`consequences` and `timeWindows` are all `null`. One transition: POSSESSION_CHANGE / CONTINUE /
startsEpisode.

The coach view it produces, in full — ten instructions, every one citing a property:

> **Set up** · Mark out an area 40 m long by 30 m wide · For this activity, mark a line across one end
> of the area, 30 m long, on the end line itself
>
> **Players** · 12 players in total · 2 teams of 6 · No goalkeepers — everyone is an outfield player ·
> For this activity, one team starts with the ball — the game does not fix which, so pick one and tell
> both teams before you start
>
> **How it works** · Play for 20 minutes · Play continues when possession changes — there is no stoppage
>
> **How to score** · For this activity, a team scores 1 point by getting the ball across the marked
> line · Both teams attack the same line — the one you marked at the end of the area

**Removing Wide Zone dissolves both of the 7 October question-3 blockers at once:** no channels, so no
channel-contains-the-scoring-line geometry; no persisting modifier, so nothing for the post-score gap
to decide.

**One precision.** Configuration B is structurally *supported* but not currently *reachable*.
`derivationInputFor` takes the selection as given (`wanted = new Set(selection.selected...)`) and
nothing permits dropping a committed object; B was reached by filtering the selection in a probe.
Reaching it for real means changing what A04 selects — see §4.

**Initial possession survives the removal.** GF2's own POSSESSION_CHANGE transition reads the
relationship, so SD-104's test ("an established rule reads it") is met independently of the modifier.
B's coach view still communicates it.

## 2 · Central Density Condition — actual necessity

**(a) Required or optional? Neither is declared. No requiredness field exists.**
Central Density is an *Environmental Manipulation* (`environmental-manipulations.ts`), not a Constraint
(`constraints.ts`) — two separate pools. Its authored `constraintRole` is `"structure"`; Wide Zone's is
`"hybrid"`. Nothing on either object, and nothing on A04's goal row, declares a contribution required.

**The label "foundation constraint" is positional, not authored.** `run-bounded-selection.ts:87-89`:

```ts
const buckets = ['foundation constraint', 'shaping constraint', 'consequence constraint']
;(result.constraints ?? []).forEach((c: any, i: number) => add(c?.id, buckets[i] ?? 'constraint'))
```

The role is `buckets[i]` — assigned by list index. Nothing reads `constraintRole`. So the word that
made Central Density look foundational to A04 is an artifact of its position in the returned list.

**(b) Does the existing game form create sufficient opposition and spatial relationships?**
For opposition, yes: B establishes two teams of six (even numbers), a shared objective, and a
possession-change transition. What GF2 does not create is *central congestion* — which is the only
thing Central Density was for.

**(c) Does its absence undermine the Learning Goal, or merely remove one manipulation?**
In the narrow configuration, **neither.** Its authored purpose is `notes: "Encourages wide play
indirectly"`, `visibilityEffect: "indirect_increase"`, `logicUsageNote: "...indirectly invite width"`.
Its only function in A04's package was to make the Wide Zone incentive worth collecting. Remove Wide
Zone and its absence costs nothing. **The two are a pair, and the pair goes together.**

**(d) If essential, the smallest legitimate correction — not available through existing contracts.**
Its authored setup is a standing per-region occupancy cap on one team: *"Restrict defenders allowed
inside the central zone (typical cap: 2-3 defenders)."* No register row expresses that.

- `V11` consequences carry `V14b referents.region` typed *(ACCESS)* and `V14c referents.delta` typed
  *(COUNT_CHANGE)*. The combination needed is region **and** count, and `gates.ts:1409-1411` enforces
  the split: `const referentRow = effect === 'ACCESS' ? 'V14b' : 'V14c'`. A COUNT_CHANGE's region
  referent is never read — authoring it would be a silent loss.
- `R1-R4 rules.actionRestrictions[]` have **no region referent at all**, and `R2 kind` is
  `{receiver_eligibility, action_order, direction_class}` — nothing spatial.
- `P11-P13 participation` is sourced from knowledge-core EM-0007 *Participant State*, which "owns the
  current participation status of performers" — status, not spatial restriction.

So realizing Central Density as authored would need a **new register row**. The necessity disappears
once Wide Zone goes, so the evidence does not demonstrate the new mechanism is needed.

**(e) Its authored text is internally inconsistent — an owner question.** `description: "Increase
defensive pressure in central areas"` against `setupGuidance: "Restrict defenders allowed inside the
central zone (typical cap: 2-3 defenders)"` and `contextualAudit: "Do not restrict movement"`. A cap on
defenders inside the zone *reduces* central density. Two readings are available (a ceiling, or a
dedicated central pair) and they have opposite effects on the affordance landscape. Not resolvable from
the authored text.

## 3 · Post-score behaviour — the smallest legitimate resolution

No contracted object holds a SCORE transition class; SD-R3 deliberately left the post-score procedure
to realization and none was authored. The owner decision that remains is what happens after a score.

**In the narrow configuration it stops being a blocker.** Measured on B: `valueModifiers: null`,
`consequences: null`, `timeWindows: null`, one transition (POSSESSION_CHANGE). **Nothing in B reads a
post-score state**, so the gap has nothing to decide, and fidelity passes with zero violations without
it. It becomes an ordinary coaching choice rather than an integrity question. No restart default was
introduced.

## 4 · Alignment with A04's ACTUAL Learning Goal — the headline

A04 is `Learning Goal: "Beat Defenders 1v1"`, `Coach Definition: "Eliminate individual defenders."`,
`Choose This When...: "Players avoid taking defenders on."`

**A04 is the only one of the thirteen Learning Goals whose selection does not resolve.**

```
A04  Beat Defenders 1v1    FALLBACK   signalGroup:Z_soccer_general
```

...against MATCHED for all twelve others. The system's own words:

> `"status": "fallback"`, `"reason": "No specific signal group matched; committed the general soccer
> default package (Z_soccer_general). Coach intent was not specifically resolved — treat as reduced
> confidence."`

So A04's entire package — GF2, Central Density, Wide Zone, progression-bonus, turnover-reward and all
three lenses — **is the generic soccer default**, not knowledge selected for beating defenders 1v1.

Everything measured is consistent with that:

- **GF2** = "Directional Possession Games", objective *"Maintain possession with forward intent"*,
  `phase_of_play: "Build-up"`, primaryAffordances `[maintain_possession, create_space, break_lines]`.
- **The three lenses** are Line-Breaking (Break Lines), Space Creation (Create Space) and Possession
  Stability (Maintain Possession). Every one anchors to `build_up`. None concerns an individual duel;
  no `coachVocabulary` entry across all three names taking a defender on.
- **Central Density** = `category: "Protect Space"`; **Wide Zone** = `category: "Exploit Space"`.

**The library has no knowledge for the attacking individual duel at all.** None of the 11 game forms,
none of the 10 affordance lens categories (Break Lines, Exploit Space, Create Space, Maintain
Possession, Attack Quickly, Finish, Delay or Deny, Regain Possession, Protect Space, Recover Shape) and
none of the 11 signal groups addresses beating a defender. D03 "Defend 1v1" *does* resolve — but on
`signalGroup:I_defensive_protect`, i.e. because it is defensive, not because the library understands
1v1. The only "1v1" string in the test library is in `normalizeCoachingInput.ts:102`, where it is
listed as a *residual skill-ish token*.

**And the selected knowledge actively preserves the behaviour the coach chose A04 to change.** GF2's
`representative_design_notes`: *"Encourage progression without restricting passing options."* Possession
Stability's `contextualAudit`: *"Avoid pass limits or restrictive rules."* Line-Breaking's: *"Avoid
forcing forward passes or direction of play."* A coach picks A04 because players avoid taking defenders
on, and gets a game whose knowledge is explicitly committed to keeping the passing option open.

The turnover/space problem the discussion drifted toward has a home in the library: **GF4 "Transition
Games — Exploit moments after turnover"**, which is contracted (`blind:GF4`). A04 is not that goal.

## 5 · New finding: the fallback flag is printed on every run and carried by nothing

`generateSelection` produces `resolution.status` with the reduced-confidence reason above.
`BoundedSelection` (`run-bounded-selection.ts:36-47`) has **no `resolution` field**, so the flag is
dropped at the `selectFor` boundary. `Z_soccer_general` appears nowhere in `derivation/`,
`realization/` or `rendering/`. Nothing downstream — the resolved game, the realization record, the
fidelity report, the coach view — can know A04's package was a default.

Same failure class as the recurring one: a projection dropping an authored field, invisible because no
consumer reads it. This time the dropped field is the confidence of the entire selection.

**And it was never actually invisible.** `generateSelection.ts:822` logs it on every single run:

```
[selection-search] lensCandidates=3 possibilities=12 elapsedMs=141 bestScore=75 resolution=fallback
```

It prints during the test suite and during every probe. It is carried in no structure, so nothing can
act on it and no report records it — but it has been on screen the whole time, and the probes written
during the Wide Zone work filtered `selection-search` out of their own output to reduce noise. The
finding was available at any point and was removed from view by the person looking.

## 6 · Minor defect found while measuring

`render-concrete-game.ts:555-566` attributes any excluded `.functions` row to *"the Wide Zone item
names `access` as a forbidden member"* without checking that Wide Zone is present or that the row's
reason is an exclusion. In configuration B the row's own reason is `"not constrained"` /
`declared: ["NON_CLAIMED"]` — a gap — and there is no Wide Zone object at all, and the observation
still asserted the authored exclusion. The live A04 claim is accurate, so this is not urgent; the fix
is one condition. Reported, not repaired.

## 7 · Pilot readiness in the three categories

1. **Structural integrity** — configuration B **passes**: authorized, coherent, validated, faithfully
   communicated. Gate A knowledge verdict PASS, acceptance 0/0/0, post-realization gates validated,
   ten instructions, zero fidelity violations on every question.
2. **Learning design** — **fails for A04, in both configurations**, and not for a reason either can
   fix: no authorized knowledge targets A04's problem, and the knowledge that was selected preserves
   the behaviour the goal exists to change. This is an authoring decision.
3. **Pilot observation** — effectiveness and engagement, legitimately for the field.

## 8 · Answer to the question as asked

The narrowest authorized A04 configuration **is already supported**, needs no implementation and no new
architectural mechanism, and carries **no structural integrity blocker**. It is not currently reachable
without changing what A04 selects.

What stands between it and field use as *A04* is not integrity but identity: the environment the system
constructs is a directional build-up possession game, and the environment it claims to construct is one
for beating defenders 1v1. Against the standard — *"we do need confidence that the environment being
tested is actually the one the system claims to have constructed"* — that is the blocker, and it is an
authoring gap rather than an engine defect.
