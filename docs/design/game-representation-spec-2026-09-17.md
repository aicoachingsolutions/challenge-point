# Game Representation Specification — minimum draft, revised after adversarial audit

17 September 2026. Paper only: no implementation, no generation. Revision 2. Revision 1 was audited
by four independent auditors (evidence, boundary and contract, replay, minimality), and every blocking
finding is addressed here; §8 lists what changed and why. Revision 1 is kept, unedited, as
`game-representation-spec-v1-audited-2026-09-17.md`.

**The question:** what is the smallest authoritative description Challenge Point needs of a game before
it can safely generate coach-facing language?

**The answer:** a game in eight areas, in which:
- every property's **existence** is entailed by the session, a selected knowledge object, or a standing
  decision;
- every property's **value** is supported by a contract item that can be checked mechanically;
- nothing is `UNRESOLVED` or `NOT_AUTHORED`.

Gate A (structural coherence) and Gate B (realization fidelity, in both directions) must pass. Language
may then be rendered from the game's values, and only from them.

**Evidence keys:**
- **[CA]** causal expression audit;
- **[R1]** first replay;
- **[R2]** second replay;
- **[LG]** R2 ledgers (`docs/audits/gate-a/ledgers-2026-09-17.json`);
- **[AC]** Christian's accepted rulings (`docs/audits/gate-a/corrections-accepted-2026-09-17.md`);
- **[VS]** RPC-001 vertical slice, with contribution ids from
  `docs/audits/rpc001-slice/contributions-2026-09-17.json`;
- **[RT]** runtime read (`docs/design/shared-game-representation-runtime-read.md`).

Every citation below was checked against those files by independent readers. That check of this
revision found errors of its own, corrected here from the quoted evidence (§8).

---

## 1. Governing rules

**The boundary.** The representation holds what a coach lays out and what the rules key on. It holds
nothing about:
- player movement, tactics, or positions during play;
- pressure, opportunity, affordance, uncertainty or representativeness;
- the state of a game in progress.

It describes the rules that govern state, never the state itself.

**Principles:**
- **P1 — Non-claim** (Christian). Independent knowledge defines what it requires, excludes or
  constrains, and what it does not claim, so reconciliation does not depend on hidden precedence.
- **P2 — Support** (Christian). Provenance is insufficient unless the cited contribution actually
  supports the resolved property. A property with six citations but no supporting source is still
  invented.
- **P3 — Realization ≠ Mention.** A property is realized when its functional effect exists in the
  representation, not when a word for it appears in text. [CA]: "A change counts only if it changes
  the game."
- **P4 — Fail rather than infer.** Reconcile only through an authored relationship rule; otherwise the
  property is `UNRESOLVED`. [VS]
- **P5 — Prose cannot create structure.** Language may name a structurally defined region or state
  ("deep"), never create one. [AC] rules this for value tiers: prose "should not be allowed to create an
  otherwise undefined value tier". **Extending it to regions and states is this specification's own
  step, for Christian to confirm.**

**Standing decisions enforced:**
- one primary scoring event;
- the direction invariant;
- three value statuses;
- regions required by knowledge and instantiated by realization;
- representative objectives retained.

## 2. Every property: the game part and the audit part

A property has two parts. The **renderer reads only the game part.**

| Part | Holds | Why it exists |
|---|---|---|
| **Game:** `value` | The resolved value or range | — |
| **Game:** `status` | `RESOLVED` · `FREE` (left to the coach inside stated bounds, rendered as a range) · `NOT_AUTHORED` (an authoring gap; points to the contract's `notAuthored` item) · `UNRESOLVED` (a collision needing a relationship rule and an owner) | [VS] C1 and C2 lived as prose inside strings; [R2] "long kick" is a threshold coaches judge, which can neither block rendering nor be invented |
| **Audit:** `sources[]` | Every contract item addressing this property's field path. **Computed from the contract, never written by the reconciler** | [VS] provenance mixed contribution ids, standing decisions, adaptations and absence markers in one flat array |
| **Audit:** `support[]` | The sources that validly support the value. **Derived, never authored** (below) | [VS] the invented rule cited seven contributions; one (VARTARGET-12) supports "carries no value", none supports "out of play" |

**Rendering is blocked by any `UNRESOLVED` or `NOT_AUTHORED` property, without exception.** No judgement
of "what play depends on" is needed; [VS] showed that judgement splitting a single reader.

**Properties are atomic.** Support is recorded per atomic property, never per compound slot. The
invented clause in [VS] hid inside a transition slot whose other parts were genuinely supported.

### How support is derived, so it cannot be asserted

A support entry is valid only when **both** hold:
1. the cited contract item's `fieldPath` equals the property's path;
2. the property's value satisfies the item under a **closed comparison**:

| Requirement | Satisfied when |
|---|---|
| `EQUALS` | the value is equal |
| `RANGE`, `COUNT` | the value is inside |
| `EXISTS` | the value is present |
| `NOT_EXISTS` | the value is absent |
| `POSITIONED`, `ORIENTED` | the position interval satisfies it |

The relation follows from the requirement kind:
- **ENTAILS** — `EQUALS`, `EXISTS`;
- **NARROWS** — `RANGE`, `COUNT`, `POSITIONED`.

An item whose `basis` is `ASSUMED` (§4) can NARROW but **never ENTAIL**.

### The existence rule

A property may exist only if its existence is **entailed** by `SESSION`, `SELECTION` or
`STANDING_DECISION`. `REALIZATION` may choose only the *value* of a property whose existence is already
entailed, and only among unstated quantities:
- metres;
- a position inside a named region;
- a count inside an authored range;
- which team takes which end;
- which team starts.

This list is the search the Gate A procedures admit when checking that *some* layout exists
(`docs/audits/gate-a/procedures-2026-09-17.json`, `verdictSemantics`). Here it is repurposed as the
only choices realization may make — a repurposing for Christian to confirm.

**`REALIZATION` never creates a trigger, qualifier, consequence, modifier, information rule, region or
object.**

### Non-claims are not support

A non-claim is a **permission check**. A `REALIZATION` value on a path is admissible only if every
in-scope contract item on that path is either a non-claim or a NARROWS bound the value satisfies.
Silence licenses a choice; it never licenses a new rule.

### Source kinds (closed)

| Kind | Meaning |
|---|---|
| `SESSION` | The coach's session input: players, area, duration |
| `SELECTION` | A selected knowledge object's contribution |
| `STANDING_DECISION` | Christian's decisions, **including every default**. Each default is listed by id and applies only when no `SESSION` or `SELECTION` item writes the field |
| `REALIZATION` | A free choice under the existence rule |

**Adaptation is not support.** When a PREFERRED_DEFAULT contribution is displaced — GF2's "same
direction", GF2's continuous play [VS] — the displacement is recorded as an `ADAPTED` disposition on
that contribution in Gate B, citing the value-status decision. It is not recorded on the property.

## 3. The eight areas

For each field: **why** it exists (the observed failure that requires it), **owner** (what supplies
its value), and **claim** (what can be validated). Fields marked *view* are computed from other fields
and never stored.

### 3.1 Envelope

| Field | Why | Owner | Claim |
|---|---|---|---|
| `players` | [CA] "10 players in a 6v6 format"; [VS] the forced partition came from NEUTRAL-10, GF2-14 and RPC-001-02 writing against the same total | SESSION | Teams plus neutrals equal it |
| `area {length_m, width_m}` | [CA] 54 m of channels on a 30 m field; [RT] the area was restated by pattern-matching after the model wrote it | SESSION | Every region and scoring reference fits inside it |
| `duration_min` | Weakly evidenced. Held fixed in every run; A01-02-03 requires the goal-kick restart to recur "within the period"; it bounds time windows | SESSION | Every time window lies inside it |

### 3.2 Space

| Field | Why | Owner | Claim |
|---|---|---|---|
| `axis` | [VS] RPC-001-07: "a longitudinal axis… so that 'beyond' the pressure/progression line is decidable"; [VS] Wide Zone Advantage needs touchlines "so that 'wide' is a defined lateral position" | SELECTION, else STANDING_DECISION default (the longer dimension) | Every relational reference (beyond, ahead, own end, wide) compares intervals along or across `axis` |
| `regions[] {id, noun, functions, position}` | [R2], [LG] D09–D27: 19 activities name a "deep" value tier that no region defines, upheld as structural [AC]; [R1] extents were checked only when stated, so vague text passed and precise text failed; [VS] target zones existed only as objects, so their extent was never laid out | SELECTION requires the region and its functions; REALIZATION instantiates its position within the value status | Every region referenced anywhere exists; regions in one orientation group fit the dimension they span, whether extents are stated or free |
| `regions[].position {along, across}` — intervals on and across `axis` | [VS] "beyond the first defenders" could be decided mechanically only as a comparison of intervals | REALIZATION within bounds | Relational positions are interval comparisons, never judgement |
| `regions[].functions` — a set of: `objective-area`, `value-condition`, `access`, `start-placement`, `trigger`, `perceptual-reference` | [VS] VARTARGET-05 requires a trigger region where the reveal trigger is spatial; WIDEZONE-08 an optional reference channel; GF2's authored own-half start; GF3's authored guidance, "the grid is a visual scaffold" (Soccer Module GF3 setup guidance) | SELECTION | Every instantiated region serves at least one supported function. Residual space is not instantiated: WIDEZONE-09 is checked by comparing channel extents with `area` |
| `regions[].noun` — a closed coach-visible noun (band, channel, corridor, zone, half, third) | P5: the renderer may name only what exists, so what exists must carry its name | SELECTION | The renderer names regions only by these nouns |
| Implicit halves and thirds — *view* | [LG] MP-IMPLICIT-FRACTIONS: coaches use "own half" and "defensive third" unmarked | STANDING_DECISION default, computed from `axis` and `area` | Implicit fractions exist without declaration, and only along `axis` |

### 3.3 Performers

| Field | Why | Owner | Claim |
|---|---|---|---|
| `teams[] {id, outfieldCount, goalkeeper, roles[]}` — roles include target player | [CA] "10 players in a 6v6 format"; [VS] forced partition; [VS] RPC-001-05 places the target player in Performers, so as an object it would escape the player count | SELECTION, reconciled against SESSION | Teams plus neutrals equal `players`; every referenced performer or role exists |
| `neutrals {count, affiliation, distinguishable}` | [CA] Neutral Player selected, 0 of 6 activities contain a neutral; NEUTRAL-14 affiliation on possession change; NEUTRAL-06 "contrasting bibs" | SELECTION | A neutral exists when required; affiliation is a rule keyed on a closed trigger (`POSSESSION_CHANGE`), not a state |
| `startPlacement[] {group, region}` — at START only; `group` names a role (starting team, defending team) | [VS] RPC-001-04's placement had to be smuggled in as a pseudo-performer | SELECTION; STANDING_DECISION default ([LG] MP-KICKOFF: a player of the starting team steps to the ball) | Every placement's region exists. A formation authored without a region ("the first defenders" as a shape) is `NOT_AUTHORED`, never inferred |

Removed: `servers[]`. A coach who serves is the actor `COACH` in `transitions[].placement` and consumes no
player slot ([LG] MP-COACH-SERVER).

### 3.4 Objects

| Field | Why | Owner | Claim |
|---|---|---|---|
| `objects[] {id, kind, count, position}` — kinds: ball, goal, line, gate | [CA] 0 of 60 activities contain a goal while goalkeepers remain; [VS] RPC-001-08 requires exactly one scoring reference; RPC-001-10 a contested ball; VARTARGET-02 requires inactive candidates to stay present | SELECTION; REALIZATION for position within bounds | Every object referenced by a rule, transition or objective exists and is positioned inside `area`; every scoring reference (zone, line, gate) has a Space position and extent that fit |

Removed: `objects[].owner`. For scoring references it duplicated `objectives[].team`; for the ball it was
the state of a game in progress.

### 3.5 Objectives

The slice's central discovery was that one `state` field carried five things. They are separated, and
each fact has one home.

| Field | Why | Owner | Claim |
|---|---|---|---|
| `objectives[] {id, reference, team, role}` — `team` is **the team that attacks it**; role `PRIMARY_SCORING` or `REPRESENTATIVE` | [CA] 0 of 60 contain a goal; [VS] RPC-001-11 "for the team building out"; VARTARGET-06 set membership | SELECTION; STANDING_DECISION (representative retention) | Every objective has a reference, an attacking team and a role; representative objectives are never removed |
| `objectiveSets[] {id, scope, members[], liveCardinality}` — `scope` is one team or both (EM-0010's Scope parameter, EMP-0059, allows either) | [VS] Variable Target's candidate set | SELECTION | Members exist and fall within the stated scope |
| `.initialState` — **at START only** | [VS] RPC-001-11; EM-0010's example EMX-0017, "Only the left objective begins active." | SELECTION, STANDING_DECISION, or `UNRESOLVED` | Stated, or `UNRESOLVED` with a collision id |
| `.persistence` — which transitions, if any, re-run the assignment | [VS] VARTARGET-20 authors a possession-scoped reset only as TYPICAL_EXAMPLE ("The first receiver in the attacking half sets which goal is live for that possession"). The slice contract for Variable Target declares a general reset at restarts not authored | SELECTION, or `NOT_AUTHORED` | Stated relative to named triggers |
| `.assignmentRule` — a finite map `{on: trigger or START, yields: member or procedure over members}` | [VS] "ASSIGNMENT FUNCTION UNRESOLVED" sat in prose where no check could see it | SELECTION, STANDING_DECISION, or `UNRESOLVED` | Every trigger that can fire while the set is in scope maps to a member. Deterministic, no model of play |
| `.revelation` — a reference to one `informationRules` entry | [VS] VARTARGET-13 to 16 had two homes in revision 1 | SELECTION | Refers to an existing information rule |

**C1, made precise and left open.** Under which `persistence`, and which revelation timing, is there an
`assignmentRule` that yields exactly one live member at START and is not determinable before its
trigger fires? What is now visible (none of it resolved here):
- **VARTARGET-16's half is authored.** "so the route cannot be pre-planned".
- **Revelation timing is not authored.** Variable Target's information composition, IE-C006, composes
  trigger type, reveal progression and state dependency, but no reveal timing. The slice contract
  declares that gap.
- **RPC-001-11's timing clause lacks support from its own cited evidence.** RPC-001-11 reads
  "active from the moment that team's attack begins", citing RPC-STMT-004 as its authored evidence;
  RPC-STMT-004 contains no timing. The slice treated the clause as authored and REQUIRED. This
  specification finds it unsupported by its citation, so under the basis rule it is ASSUMED — it can
  NARROW but not ENTAIL — until Christian confirms it. This is this specification's finding, not the
  slice's.
- **The only authored opponent-action mapping keys on defender positioning** ("when the defense shifts
  to cover one gate, the other becomes the live one"). That is outside the boundary, so it is
  `UNRESOLVED`, never inferred.
- **Variable Target also authors other triggers:**
  - the first forward pass;
  - the ball entering the final third;
  - the first receiver in the attacking half;
  - a trigger line or a coach's cue.

  None of them maps the trigger to a specific member.

The [VS] report argued part of C1 is the old field's shape. The alternative reconciler treated the
conflict as content, not field shape, and named the same fix: a total assignment rule. Both readings
stand.

EM-0010 (Objective State) is consistent with the decomposition but narrower than it. Its one dimension,
Activation State, has three parameters:
- State Value (EMP-0058) — the current state, which the boundary excludes;
- Scope (EMP-0059);
- Persistence (EMP-0060) — a temporary/persistent label.

It authors no assignment, trigger or revelation. **The owner of the relationship rule is open.**

### 3.6 Direction — *view*

| Field | Why | Owner | Claim |
|---|---|---|---|
| per team `{attacks, defends}` — computed from `objectives[].team` and positions on `axis` | [CA] 57 of 60 never say which way each team attacks; [VS] GF2's authored "Teams attack in the same direction" | STANDING_DECISION (the invariant); SELECTION; REALIZATION (which team takes which end) | Every team has a stable direction and at least one functional directional objective, in opposite senses on `axis` unless a SELECTION exception exists that no STANDING_DECISION forbids |

Not stored: storing it would create a second place that can disagree with `objectives`.

### 3.7 Transitions

Revision 1's orthogonal split was right, but on its own it let ps-central s1 through. Coherence rules are
added.

| Field | Why | Owner | Claim |
|---|---|---|---|
| `transitions[] {trigger, qualifiers}` — qualifiers from a closed list: last touch, which end line, region | [R1] Transitions had no check at all; [VS] the out-of-play slot split by end line versus touchline and by last touch | SELECTION; STANDING_DECISION defaults | Qualifiers are typed; each is atomic with its own support |
| `.awardedTo` | [VS] GF2-16 "restarts with the team that did not touch it last" | SELECTION; STANDING_DECISION defaults | One value per trigger |
| `.placement {actor, region}` — actor: a team role, goalkeeper, or `COACH` | [VS] RPC-001-16; [CA] From Goal Kicks realized 0 of 3 | SELECTION | Required when `STOP_RESUME`, absent when `CONTINUE`; actor and region exist |
| `.playState` — `STOP_RESUME` or `CONTINUE` | [R2], [LG] D36–D37: ps-central s1 and s2 restart from a place on the same trigger on which play continues ("Play does not stop"; "play carries on from wherever everyone is") | SELECTION; STANDING_DECISION defaults | **Coherence:** a non-empty `.placement` requires `STOP_RESUME`, and `CONTINUE` requires `.placement` empty. Consequences that restart, continue or change possession on a transition trigger are folded into that trigger before comparing |
| `.startsEpisode` — an authored flag | [VS] C1 depends on "the moment the attack begins"; RPC-001-17 authors loss of possession as an episode end; VARTARGET-20 scopes by possession | SELECTION; STANDING_DECISION default (START, SCORE and POSSESSION_CHANGE start an episode) | Stated per trigger; never derived |

**One closed trigger vocabulary for every field that has a trigger:**
- `START`
- `SCORE`
- `OUT_END_LINE`
- `OUT_TOUCHLINE`
- `POSSESSION_CHANGE`
- `REGION_ENTRY {region}`
- `TIME_EXPIRY {window}`
- `STANDING`, for openly known information

A trigger keyed on player positioning cannot be represented, and is `UNRESOLVED`.

Removed: `.reestablishes`. It named a knowledge-level concept with no field behind it; what a restart
restores is already `.awardedTo`, `.placement` and the objective set's `.persistence`.

### 3.8 Rules of value

| Field | Why | Owner | Claim |
|---|---|---|---|
| `primaryEvent {kind, value, conditions[]}` — its reference is derived from `PRIMARY_SCORING` objectives and sets | [CA]: the scoring event and its condition were one of two selections that reliably changed what players experience. RPC-001-20's "One point per qualifying event" had no typed field; the slice placed it as an ad hoc "point value" entry | SELECTION narrows (the intersection of event sets, since RPC-001 authors the valid set, not the choice); REALIZATION chooses inside it | Exactly one primary event; base `value` present and numeric; every member of its reference has a Space position |
| `.conditions[]` — typed: `origin`, `control`, `eligibility`, `progression`, `exclusion` | [CA] 41 of 42 Pass Combination Gate activities contain no passing requirement; [VS] RPC-001-18's "progressing beyond the initial pressure or progression line"; RPC-001-19 long kick | SELECTION | Each condition refers to existing regions, objects or placements. **No condition refers to a player's position during play.** Thresholds coaches judge ("long", "controlled") are `FREE` |
| `valueModifiers[] {condition, magnitude, combination}` — condition typed over regions, objects and events only | [R2], [LG] D09–D27, 19 "deep" tiers, structural per [AC]; [VS] C2, a multiplier with no magnitude | SELECTION only | Referents exist; **magnitude present**, else `NOT_AUTHORED`; any two modifiers whose conditions can hold at once are mutually exclusive on the layout or covered by an authored combination rule; a modifier changes only the primary event's value, never adds a second way to score |
| `consequences[] {trigger, effect, referents}` — effects: `ACCESS {team, region}`, `COUNT_CHANGE {team, delta}` | [CA] consequence rewards reached Scoring in 0 of 57; [R2], [LG] D33–D35 "the other team gets the opposite channel", D39 "the next action decides it" | SELECTION | Every effect is typed and writes a field; every referent resolves uniquely in every state its trigger can fire from |
| `informationRules[] {subject, trigger, dimensions}` — dimensions limited to five from Information Expression. IE-C006 composes three for Variable Target: D006 trigger type, D008 reveal progression, D011 state dependency. Two more are this specification's addition: D007 reveal timing (C1 turns on it) and D013 access holder (WIDEZONE-17's information is standing and open) | [VS] the effect vocabulary had no information type; [CA] Variable Target Condition was INERT: "No target varies"; WIDEZONE-17 is standing, openly known information | SELECTION | The subject exists; the trigger kind lies in the authored range; a `STANDING` rule changes nothing and is exempt from "changes a property" |
| `timeWindows[] {startsOn, duration, expiryEffect}` | [CA] the Applying emphasis added "score within a 30-second window"; [AC] #4 admits it as shot-clock shorthand | SELECTION; STANDING_DECISION default (starts when possession is won); `duration` may be `FREE` inside an authored range | Start trigger and expiry effect typed; inside `duration_min` |

**Where Christian's list of consequence effects lives now.** Each effect has exactly one home:

| Effect | Home |
|---|---|
| Possession | `.awardedTo` |
| Restart or state | `.playState` and `.placement` |
| Continuation | `CONTINUE` |
| Temporary numerical advantage | `COUNT_CHANGE`, or neutral affiliation |
| Access or eligibility | `ACCESS` |
| Spatial advantage | `ACCESS` with a named region |
| Target availability | `assignmentRule` |
| Value | `valueModifiers`, where authored |

`SPATIAL_ADVANTAGE` as a free-standing label is removed: it would have typed "the opposite channel".

Removed from the representation:
- `exclusions[]`, which live in the contract and are checked by Gate B;
- `consequences[].duration`;
- `valueModifiers[].beneficiary`. A modifier changes the value of the primary event, which is credited
  to the team that achieves it, so a separate beneficiary could only disagree. WIDEZONE-14's
  beneficiary, "the team performing the qualifying action" (which its author marks as inferred),
  applies to consequences, where `ACCESS` and `COUNT_CHANGE` carry the team.

**Not representable, and deliberately so:** a condition keyed on local player numbers ("where you have
the extra numbers"), per [AC] #4.

## 4. The contribution contract — outside the representation

The representation holds resolved properties. The contract holds what each selected knowledge object
says before reconciliation. **Non-claims and ownership scope live here.**

| Part | Holds | Why |
|---|---|---|
| `items[] {id, fieldPath, requirement, value, strictness, valueStatus}` | Requirements and exclusions in one list: an exclusion is an item with strictness `EXCLUSION`. A value may be a **set of alternatives, ordered only where the source orders them** | [VS] 68 REQUIRED, 24 SUPPORTING and 21 EXCLUSION items (113). RPC-001-08's "in the approved order" is ordered. WIDEZONE-13's three rewards are unordered alternatives with no authored default |
| `items[].scope` — `WHOLE_GAME`, `PER_TEAM`, `PER_OBJECTIVE_SET`, `PER_SIDE`, `OWN_INVOLVEMENT` | Christian asked for ownership scope. [VS] Wide Zone's multiplier coexisted with VARTARGET-18 and NEUTRAL-15 only because each was object-scoped; GF2-09 survived only when read per side; the four-zone breach turned on whether VARTARGET-01's range is per layout or per set |
| `items[].basis` — `AUTHORED` with the verbatim evidence, or `ASSUMED` with the assumption stated | [VS] RPC-001-08's "exactly one" came from a standing decision; VARTARGET-07's "exactly one active" is a derivation; RPC-001-11's timing clause likewise. An assumed item can narrow but never entail |
| `items[].checkability` — `STRUCTURAL`, `PARTLY_STRUCTURAL` or `OUTSIDE_BOUNDARY` | RPC-001-21 (pressure not dominant), RPC-001-22 (at least two routes) and VARTARGET-15 cannot be checked on a structure that excludes play. GF2-10, GF2-15, WIDEZONE-09 and NEUTRAL-16 mix a structural clause with a clause about play. The classification is this specification's; the [VS] slice did not make it. Without the marker, Gate B fails every RPC-001 game or drops those items silently |
| `nonClaims[] {fieldPath, scope}` — **mandatory coverage**: every field path is claimed, excluded, non-claimed or not authored | P1. [VS] every successful composition — the player partition, the three-rule restart, the goalkeeper question, the incentive exclusions, the choice of scoring event — ran on an object declaring what it did not claim. Unexamined silence is a contract defect, reported before reconciliation, not a permission |
| `notAuthored[] {fieldPath, missing}` | [VS] seven of the ten dead contributions were gaps the objects declared themselves |
| `relationshipRules[] {id, owner, decides}` — authored rules that decide between items on one path | P4. [VS] reconciliations relied on RPC scoring ownership and the value-status decision. A property written by more than one source must cite one, or be `UNRESOLVED` |

**Where the contract touches the game:** exactly twice.
- Support is derived by matching items to properties.
- Non-claims act as a permission check on `REALIZATION` values.

Neither puts knowledge prose into the game.

## 5. Deliberately not held

- Player movement, tactics, positions during play; triggers keyed on player positioning.
- Pressure, opportunity, affordance, uncertainty, representativeness; local-numbers conditions.
- The state of a game in progress: which target is live now, who has the ball now.
- Coach language, rationale, design intent, selection scores.
- **How the three activities differ.** Session emphasis and slot templates are out of scope here. If they
  write values into a game, they must do so as selected knowledge through the same contract ([R2]: 23
  of 35 true defects came from three template sentences in `coach-voice.ts`). Their cross-activity role
  is open for Christian.
- **Learning Stage.** [CA] rated it TEXT-ONLY: "No systematic difference across the three stages". One
  run added a pass-count condition, which is within noise.

## 6. What it lets Challenge Point validate

| Check | Claim | Checked on |
|---|---|---|
| **Gate A — structural coherence** | This game can be coherently laid out and played as specified | Regions and scoring references fit; performers sum; every reference resolves; one value per atomic transition property per trigger, with the coherence rules; every effect typed and every referent unique; one primary event whose reference resolves whenever it can fire; overlapping value modifiers exclusive or combined by an authored rule; no `UNRESOLVED` or `NOT_AUTHORED` property |
| **Gate B — realization fidelity, forward** | Every required contribution survived | Every `REQUIRED`, `STRUCTURAL` item is satisfied by a property with derived support; every `EXCLUSION` holds; every NARROWS bound holds at its scope, including layout-level counts |
| **Gate B — realization fidelity, reverse** | Nothing was invented | Every property in the game has derived support. **Otherwise: INVENTED** |
| **Gate B — reporting** | Nothing is silently lost | `OUTSIDE_BOUNDARY` items are reported as not structurally checkable, counted, and never dropped from the denominator. A `PARTLY_STRUCTURAL` item's structural clause is checked and the rest is reported. Adaptations are recorded as dispositions |
| **Render fidelity, after rendering** | The text says only what exists (P5) | Every count, region, object, trigger and value tier named in the rendered text maps to a property. [R2]: 23 of 35 true defects were written by the renderer's own templates |

**The rendering precondition:** Gate A and Gate B pass, and no property is `UNRESOLVED` or
`NOT_AUTHORED`.

## 7. The hostile cases, against revision 1 and this revision

| Case | Revision 1 | This revision |
|---|---|---|
| baseline s1: 18 m channels on 30 m | caught | caught, Gate A (regions fit) |
| ps-central s1: restart from a place against "play does not stop" | **let through**: the split put them in different fields | caught, Gate A (transition coherence) |
| "…then wide, then deep", 19 activities | **let through**: derived thirds supplied a referent | caught, Gate A (a deep score is also middle or wide: overlapping modifiers with no combination rule) |
| gf-channel s1: "the other team gets the opposite channel" | **let through**: typed as spatial advantage | caught, Gate A (`ACCESS` needs a uniquely resolving region; "opposite" of central has none) |
| em-foundation-neutral s1: "10 players in a 6v6 format" | unrepresentable, uncaught | caught by render fidelity; the missing neutral by Gate B |
| ps-goal-kicks s2: a start from the central zone | would have become a false alarm against [LG] MP-KICKOFF | passes Gate A (the MP-KICKOFF default); From Goal Kicks unrealized is caught by Gate B |
| [VS] invented "inactive zone is out of play" | **let through**: presence-only support, and a non-claim could license it | caught, Gate B reverse: `REALIZATION` cannot create a trigger, and no item addresses the path |
| [VS] four target zones against VARTARGET-01's 2–3 | **let through**: no property held the count | caught, Gate B: the layout-level count breaks a NARROWS bound at `WHOLE_GAME` scope |
| C1 | partly resolved by a universal Gate A rule | askable, and not resolved (§3.5) |

## 8. What changed from the audited revision

| Change | Raised by |
|---|---|
| Support derived by field-path and closed-comparison matching; sources computed from the contract; properties atomic | all four |
| Non-claims demoted from support to a permission check; the existence rule; `REALIZATION` can never create rules | boundary, replay, minimality |
| "No invented property" moved from Gate A to Gate B, which now checks both directions | boundary, minimality |
| C1: `initialState` at START only; a live member at every episode start moved out of Gate A; `persistence` and revelation made separate; RPC-001-11's timing exposed as assumed | replay, minimality, boundary, evidence |
| `SET_POLICY` removed; `DEFAULT_RULE` folded into standing decisions with a precedence rule | boundary, minimality, replay |
| Contract gains `scope`, `basis`, `checkability`, mandatory non-claim coverage, relationship rules; `fallbacks` and `exclusions` merged into `items` | evidence, boundary, minimality |
| Information Expression dimensions limited to five | boundary, minimality |
| One home per fact: `knowability` becomes a reference to an information rule; five consequence effects moved to their home fields; Direction a view; `exclusions`, `servers`, `episodeStart`, `reestablishes`, `objects[].owner`, `beneficiary` and `duration` removed | minimality, evidence |
| Transition coherence rules; one closed trigger vocabulary; `startsEpisode` authored | replay, minimality |
| Value-modifier overlap rule; base event value; `progression` condition; `NOT_AUTHORED` and `FREE` statuses | replay, minimality, boundary |
| Render fidelity added as the check that makes P5 enforceable | replay |
| About ten citations corrected. Revision 1 attributed a quotation to [CA] that appears in no evidence file, and a GF3 quotation to [VS] — the same failure P2 forbids, in the specification itself | evidence |
| **A second independent check, of this revision's own citations** (101 claims across four readers), found two wrong and nineteen imprecise. All are corrected above. The two wrong: "the one functional layer", carried over from revision 1, which [CA] never says; and IE-C006, which composes three information dimensions, not five. Among the imprecise: ids cited to the replay report that appear only in its ledgers, and RPC-001-11's timing presented as the slice's finding when it is this specification's. Also imprecise: GF2-10 and GF2-15 classified as outside the boundary when they are partly structural, WIDEZONE-13 called ordered, and WIDEZONE-14 used to justify a removal it cannot support | citation check |

## 9. Open, deliberately

- **C1**, RPC-001 × Variable Target: askable; RPC-001-11's timing needs Christian's confirmation; the
  relationship rule and its owner are open.
- **C2**, the wide-zone multiplier magnitude: `NOT_AUTHORED`, blocks rendering.
- **C3**, "controlled on arrival" and "long kick": `FREE`, as coach judgement, pending Christian's
  confirmation of that status.
- **C4**, possession determination for neutral affiliation: holds only while turnovers stop play.
- **VARTARGET-01's scope**, per layout or per objective set: decides whether four zones breach it.
- **Closed vocabularies** (region nouns and functions, object kinds, triggers, condition types, effects)
  are drafted from the evidence and need Christian's review.
- **Session emphasis and slot templates** as selected knowledge with contracts; their cross-activity role.
- **Carried from earlier:** Game Form restart × From Goal Kicks; central weighting × Wide Zone
  Advantage; Turnover Reward's missing consequence; family-ID provenance; Counterattack timing; the
  three wording issues.
