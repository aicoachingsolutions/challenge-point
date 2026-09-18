# Game Representation Specification — revision 4, with Christian's ownership decisions

18 September 2026. Paper only: no implementation, no generation. Revision 3 incorporated Christian's
decisions on revision 2 ([C18]). Revision 4 adds his second set of decisions the same day ([C18b]):
- starts and restarts;
- engine wording (P-8);
- RPC-001's scope (P-3);
- SD-10's wording;
- approval of the conformance check.

Revision 4 is the fixed rule set the conformance check runs against. Revision 3 is in the history.
Revision 2, which he reviewed, is kept as `game-representation-spec-2026-09-17.md`; revision 1 as
`game-representation-spec-v1-audited-2026-09-17.md`.

**How to read this revision.** Where the text rests on one of Christian's decisions, it cites an id from
§2. Where it rests on this specification's own reading, it says so and points to a numbered proposal in
§10 awaiting his ruling. A first draft of this revision blurred the two, and two independent readers
caught it (§13).

**The question:** what is the smallest authoritative description Challenge Point needs of a game before
it can safely generate coach-facing language?

**The boundary, in Christian's words (18 September):** "the authoritative game contains supported
resolved facts in the eight areas; Gate A and both directions of Gate B pass before rendering; and
coach language can describe that game but cannot create additional structure."

**This specification's elaboration of it:**
- Every property's **existence** is entailed by the session, a selected knowledge object, or a citable
  standing decision (§2).
- Every property's **value** is supported by a contract item that can be checked mechanically.
- Nothing is `UNRESOLVED` or `NOT_AUTHORED`.

**Evidence keys:**
- **[CA]** causal expression audit;
- **[R1]** first replay;
- **[R2]** second replay;
- **[LG]** R2 ledgers (`docs/audits/gate-a/ledgers-2026-09-17.json`);
- **[GP]** Gate A procedures (`docs/audits/gate-a/procedures-2026-09-17.json`);
- **[AC]** Christian's accepted rulings (`docs/audits/gate-a/corrections-accepted-2026-09-17.md`);
- **[DS]** the contract draft shape, with Christian's decisions of 15 September
  (`docs/design/selection-realization-contract-draft-shape.md`);
- **[VS]** RPC-001 vertical slice, with contribution ids from
  `docs/audits/rpc001-slice/contributions-2026-09-17.json`;
- **[RT]** runtime read (`docs/design/shared-game-representation-runtime-read.md`);
- **[C18]** Christian's decisions of 18 September on revision 2, quoted where used;
- **[C18b]** Christian's second set of decisions of 18 September, on revision 3, quoted where used;
- **[CV]** coverage measurement of 18 September (`docs/design/next-step-recommendation-2026-09-18.md`
  §4).

---

## 1. Governing rules

**The boundary.** The representation holds what a coach lays out and what the rules key on. It holds
nothing about:
- player movement, tactics, or positions during play;
- pressure, opportunity, affordance, uncertainty or representativeness;
- the state of a game in progress.

It describes the rules that govern state, never the state itself.

**Principles** (Christian's; ids in §2):
- **P1 — Non-claim** (SD-03). Independent knowledge should explicitly define what it requires, excludes
  or constrains — and what it does not claim — so reconciliation does not depend on hidden precedence.
- **P2 — Support** (SD-04). Provenance is insufficient unless the cited contribution actually supports
  the resolved property. A property with six citations but no supporting source is still invented.
- **P3 — Selection ≠ Realization, and Realization ≠ Mention** (SD-01). As recorded in [DS]: a
  requirement is satisfied only when its intended functional effect exists in the player–environment
  interaction. The representation is where that effect must first exist.
- **P4 — Fail rather than infer** (SD-02). Reconcile only where an authored ownership or relationship
  rule permits it; otherwise fail loudly and return to selection. This specification records that
  failure as the status `UNRESOLVED`.
- **P5 — Prose cannot create structure** (SD-05). Coach-facing language may name or naturally describe
  resolved regions, objects, states, triggers, consequences and other structural properties, but it may
  not introduce one that does not exist in the authoritative game. [C18]: "That applies beyond value
  tiers."

## 2. Standing decisions, by id

Christian asked that defaults carry ids "rather than allowing them to remain implicit defaults" [C18].
This specification gives his earlier decisions ids too, so they can be referred to precisely.

**Only the ids marked *citable* can appear as a `STANDING_DECISION` source in a property's audit part.**
These are the decisions that supply or bound a value on a field (proposal P-7). The rest are principles,
rulings on process, rejected defaults, or knowledge rulings. They govern how the specification works,
but they are never a property's support.

**When a default yields.** SD-11 yields to authored or session information, in Christian's words.
Whether SD-12, SD-13 and SD-14, which he gave without that condition, also yield to a selection that
writes the field is proposal P-9.

### Principles and invariants

| Id | Decision | Governs | Citable | Source |
|---|---|---|---|---|
| SD-01 | Selection ≠ Realization, and Realization ≠ Mention | P3; Gate B | — | [DS], 15 Sep |
| SD-02 | No universal precedence hierarchy. Reconcile only where an authored ownership or relationship rule permits it; otherwise fail loudly and return to selection | P4; `UNRESOLVED` | — | [DS] decision 3, 15 Sep |
| SD-03 | Non-claim principle | P1; the contract's `nonClaims` | — | Christian, 17 Sep |
| SD-04 | Support principle | P2; derived support; Gate B reverse | — | Christian, 17 Sep |
| SD-05 | Prose cannot create structure — including, but not limited to, value tiers | P5; render fidelity | — | [AC] (value tiers, 17 Sep); [C18] (general) |
| SD-06 | One primary scoring event. A consequence normally changes the game state; only where explicitly authored may it change the value of that event | `primaryEvent`, `valueModifiers`, `consequences` | yes | [DS] decision 2, 15 Sep |
| SD-07 | Direction invariant: each team has a stable, perceivable direction of progression and at least one functional directional objective | Direction (view) | yes | [DS] decision 1, 15 Sep |
| SD-08 | Three value statuses: REQUIRED_RANGE, PREFERRED_DEFAULT, TYPICAL_EXAMPLE | the contract's `valueStatus` | — | [DS] decision 4, 15 Sep |
| SD-09 | Knowledge requires or organizes a region; realization instantiates it | `regions[]` | yes | [DS] decision 5, 15 Sep |
| SD-10 | "An objective is not removed merely because it is not the primary scoring object when its presence remains functionally necessary to the representative game structure." Not a universal requirement to retain every possible objective | `objectives[].role` | yes | Confirmed, with this wording, in [C18b] |

### Defaults

| Id | Default | Field | Citable | Source |
|---|---|---|---|---|
| SD-11 | The longer dimension is the longitudinal axis, absent authored or session information to the contrary | `space.axis` | yes | [C18] |
| SD-12 | Implicit halves and thirds lie along that axis, as derived views, not marked regions | halves and thirds (view) | yes | [C18] |
| SD-13 | A player of the starting team steps to the ball — only when the resolved START procedure is a kickoff or stationary-ball start. Not a universal activity-start default | the START transition's actor | yes | [C18] |
| SD-14 | START, SCORE and POSSESSION_CHANGE each begin a new attacking episode. SD-14 defines episode boundaries only; it "does not mean that every RPC requirement reinitializes whenever a new episode begins" | `transitions[].startsEpisode` | yes | [C18]; the limit from [C18b] |
| SD-20 | Turnovers play on: "YES as ordinary/default soccer state unless selected knowledge explicitly creates a stoppage/reset consequence" (formerly PSD-04) | `transitions[trigger=POSSESSION_CHANGE].playState` = `CONTINUE` | yes | [C18b] |

### Rulings on status, scope and process

| Id | Ruling | Governs | Source |
|---|---|---|---|
| SD-15 | "Long kick" and "controlled on arrival" are `FREE` qualitative coach judgements, not authoring gaps that block the game. No numerical range is invented unless bounds are actually authored. Challenge Point can structurally validate that the condition exists and is correctly attached to an event, but should not claim to validate the coach's in-play judgement | status `FREE` | [C18]. The ruling covers these two terms only; this specification applies it to no other |
| SD-16 | Free-choice boundary: "a free choice may fill the value of something whose existence is already entailed, within permitted bounds. It may not create a region, object, trigger, consequence, modifier, information rule, or other structural property." | `REALIZATION` | [C18] |
| SD-17 | Session emphasis and slot templates stay outside the individual game. A structural property they require enters through the same contribution contract as any other selected knowledge. There is no separate route into generated activity language. Their role in variation across the three-activity set is a later question | §6 | [C18] |
| SD-18 | Closed vocabularies are approved as an approach. Their contents are not frozen: once the schema is stable, they are reviewed independently against broader knowledge rather than optimized around this evidence set | every closed list (§4) | [C18] |
| SD-19 | Reveal timing (IE-D007) and information holder (IE-D013, canonically ACCESS_HOLDER) are fields the representation must be able to express. Their presence authorizes no value for Variable Target; where its knowledge does not author them, they stay visibly unresolved or not authored | `informationRules[].dimensions` | [C18] |
| SD-21 | Wording held in code (formerly P-8): "Code, prompts, tests, templates and coach-rule sentences do not count as authored knowledge merely because they exist. They may be evidence of previous design intent and candidates for ratification, but they cannot support a resolved property until deliberately authored into an appropriate knowledge source or standing decision." The coach-rule sentences are not audited wholesale; those a check depends on are surfaced, to be classed later as ratify, standing decision or retire | every contract item's `basis` | [C18b] |

### Rejected, recorded so it is not reintroduced

| Id | Rejected default | Instead | Source |
|---|---|---|---|
| SD-R1 | A time window begins when possession is won | Its starting trigger comes from the selected, authored time-window mechanism. A possession-win window can use `POSSESSION_CHANGE` | [C18] |
| SD-R2 | The coin-toss team starts from its own half (formerly PSD-01) | Which team starts "can remain a permitted free choice unless selected knowledge requires otherwise" | [C18b] |
| SD-R3 | The conceding team restarts from its own end or half (formerly PSD-02) | "A valid post-score procedure is necessary, but I don't want this particular realization made universal" | [C18b] |

**Recorded, not citable — PSD-03.** "Team that didn't put it out restarts where it went out: YES in
substance as ordinary soccer behavior, but I don't think its proper owner is a Game Form or a
founder-created Game Representation default. Treat the missing source as visible for now rather than
solving its ontology during this check" [C18b]. An out-of-play restart that no selected object authors
is therefore `NOT_AUTHORED`, marked *source missing: ordinary sport-state knowledge*. Christian also
said: "Game Forms shouldn't have to duplicate ordinary soccer-state behavior simply to produce a
playable game", and "Please don't turn that observation into a new library or architectural layer
during this step."

### Knowledge rulings — applied to the contracts in this specification; knowledge files unedited (frozen)

| Id | Ruling | Effect on the contract | Source |
|---|---|---|---|
| KR-01 | Variable Target's authored 2–3 range is per objective set, not per layout. "A reciprocal game can legitimately instantiate 2–3 candidates for each team's objective set, even when that produces more than three physical targets across the whole game." The slice proposed re-authoring the range per set; KR-01 reaches the same scope by interpreting the existing authoring, with no knowledge change | VARTARGET-01: `scope = PER_OBJECTIVE_SET` | [C18] |
| KR-02 | "Do not treat 'the scoring objective is active from the moment that team's attack begins' as authored RPC-001 knowledge." RPC-001 requires the representative build-out situation to exist from the beginning of the attacking episode, and the scoring objective to function within that episode. Christian does not currently see authored evidence that RPC-001 also requires the identity of a valid scoring target to be fixed or knowable at the first instant | RPC-001-11 restated (§5.5); the first clause bears on RPC-001-15 and RPC-001-16 (§11) | [C18] |
| KR-03 | "RPC-001's build-out requirement applies to the build-out episode, not automatically to every attacking episode in the activity … a turnover may begin a new attacking episode while play continues. Returning to a goalkeeper build-out requires an authored transition/reset rule; it should not be inferred simply from RPC-001 being selected." The former rule that every turnover stops play under RPC-001 is unsupported (formerly P-3's scope question) | RPC-001-11 and RPC-001-16 scoped to the build-out episode | [C18b] |

### Relationship rules in evidence

| Id | Rule | Source |
|---|---|---|
| RR-01 | RPC scoring ownership: the Context decides which physically available event reinforces its Primary Scoring Identity | [DS] decision 3 |

The slice's reconciliations also relied on other authored deciding rows, among others:
- RPC-REL-071 to RPC-REL-074 author the valid set of scoring events and their order.
- GAK-0103 (GA-001-OIC-01) decided the objective-liveness case (GF2-09 × VARTARGET-07).
- EM-0010's Scope parameter (EMP-0059) decided VARTARGET-01 against the direction invariant.

The direction case itself (GF2-12 × RPC-001-13) was decided by SD-08 with SD-07. Those rows stay
knowledge; they are not given SD ids.

## 3. Every property: the game part and the audit part

A property has two parts. The **renderer reads only the game part.**

| Part | Holds | Why it exists |
|---|---|---|
| **Game:** `value` | The resolved value, or the bounds of a `FREE` value | — |
| **Game:** `status` | One of the four below | [VS] C2 lived as prose inside a string; "long kick" is a threshold coaches judge, which can neither block rendering nor be invented |
| **Audit:** `sources[]` | Every contract item or citable standing decision addressing this property's field path. **Computed, never written by the reconciler** | [VS] provenance mixed contribution ids, standing decisions, adaptations and absence markers in one flat array |
| **Audit:** `support[]` | The sources that validly support the value. **Derived, never authored** (below) | [VS] the invented rule cited seven contributions; one (VARTARGET-12) supports "carries no value", none supports "out of play" |

**The four statuses:**

| Status | Meaning | Blocks rendering? |
|---|---|---|
| `RESOLVED` | The value is fixed, by an authored source, a citable standing decision, or a free choice under SD-16 | No |
| `FREE` | Left to the coach. Two cases. **(a)** A quantity inside authored bounds (for example a time window's duration, or a count "adjusted by age/ability"), rendered as its range; this is revision 2's meaning, unchanged. **(b)** "Long kick" and "controlled on arrival" (SD-15), rendered in the authored words, with bounds only where bounds are authored and never with invented numbers. Any other qualitative term is not `FREE` until Christian rules on it. In both cases validation claims only that the condition exists, is attached to its event, and, for (a), stays inside its bounds | No |
| `NOT_AUTHORED` | The selected knowledge does not author this value: an authoring gap, usually one the object declares itself | **Yes** |
| `UNRESOLVED` | Two or more contract items collide on the path with no authored relationship rule (SD-02) | **Yes** |

Where knowledge authors a value only in terms the boundary excludes (a trigger keyed on defenders'
positions), which status applies is proposal P-5. It blocks rendering under either status.

**Properties are atomic.** Support is recorded per atomic property, never per compound slot. The
invented clause in [VS] hid inside a transition slot whose other parts were genuinely supported.

### How support is derived, so it cannot be asserted

A support entry is valid only when **both** hold:
1. the cited item's `fieldPath` equals the property's path (for a citable standing decision, the field
   it governs in §2);
2. the property's value satisfies the item under a **closed comparison**:

| Requirement | Satisfied when |
|---|---|
| `EQUALS` | the value is equal |
| `RANGE`, `COUNT` | the value is inside, **at the item's scope** |
| `EXISTS` | the value is present |
| `NOT_EXISTS` | the value is absent |
| `POSITIONED`, `ORIENTED` | the position interval satisfies it |

The relation follows from the requirement kind:
- **ENTAILS** — `EQUALS`, `EXISTS`;
- **NARROWS** — `RANGE`, `COUNT`, `POSITIONED`.

An item whose `basis` is `ASSUMED` (§6) can NARROW but **never ENTAIL**.

**This grammar has never been exercised.** None of the slice's 113 items carries a registered field
path.
- **Free-text fields.** Their "field" entries are free text. A minority already read as revision 3
  paths; most mix a path with prose or use names revision 3 dropped.
- **Missing kinds.** Twelve use comparison kinds the table lacks: `CHANGES_ON` (8) and `NOT_DOMINANT`
  (4).
- **Missing relations.** `ORIENTED` and `NOT_EXISTS` are given no relation. Testing it is the recommended next step
(`docs/design/next-step-recommendation-2026-09-18.md`).

### The existence rule

A property may exist only if its existence is **entailed** by `SESSION`, `SELECTION` or a citable
`STANDING_DECISION`. SD-16, in Christian's words: a free choice "may fill the value of something whose
existence is already entailed, within permitted bounds. It may not create a region, object, trigger,
consequence, modifier, information rule, or other structural property."

What a free choice may fill is **proposal P-4**, not yet ruled. The draft list is drawn from the
unstated quantities the Gate A procedures search over [GP, `verdictSemantics`]:
- metres;
- a position inside a named region;
- a count inside an authored range, at that range's scope;
- which team takes which end;
- which team starts;
- the primary event's kind, inside the set a selection narrows (§5.8).

It is not claimed to be exhaustive.

### Non-claims are not support

A non-claim is a **permission check**. A `REALIZATION` value on a path is admissible only if every
in-scope contract item on that path is either a non-claim or a NARROWS bound the value satisfies.
Silence licenses a choice; it never licenses a new rule.

### Source kinds (closed)

| Kind | Meaning |
|---|---|
| `SESSION` | The coach's session input: players, area, duration. It carries no orientation today, so only `SELECTION` can override SD-11 |
| `SELECTION` | A contribution under a contract: a selected knowledge object's, or a session emphasis or slot template's (SD-17). Nothing else |
| `STANDING_DECISION` | A citable id in §2 |
| `REALIZATION` | A free choice under SD-16 |

**Engine wording is not a source kind (SD-21).** Code, prompts, tests, templates and coach-rule
sentences do not count as authored knowledge merely because they exist. They cannot support a resolved
property until deliberately authored into an appropriate knowledge source or standing decision. Ten
slice items rely only on such sentences (§11).

**Adaptation is not support.** When a PREFERRED_DEFAULT contribution is displaced — GF2's "same
direction", GF2's continuous play [VS] — the displacement is recorded as an `ADAPTED` disposition on
that contribution in Gate B, citing SD-08. It is not recorded on the property.

## 4. Closed vocabularies — approach approved, contents not frozen (SD-18)

Every closed list in §5 and §6 is **draft content** drawn from this evidence set:
- region nouns and functions;
- object kinds;
- triggers and qualifiers;
- start and restart methods (proposal P-1);
- condition types;
- effects;
- contract scopes.

Once the schema is stable, each list is reviewed independently against broader knowledge (SD-18). What
is fixed now is only that each list is closed: a value outside it is a defect, not a new entry.

Proposal P-10 adds that draft contents are never used to classify authored knowledge. Where authored
knowledge falls outside a draft list, it is logged for the review rather than given a status.

## 5. The eight areas

For each field: **why** it exists (the observed failure that requires it), **owner** (what supplies
its value), and **claim** (what can be validated). Fields marked *view* are computed from other fields
and never stored.

### 5.1 Envelope

| Field | Why | Owner | Claim |
|---|---|---|---|
| `players` | [CA] "10 players in a 6v6 format"; [VS] the forced partition came from NEUTRAL-10, GF2-14 and RPC-001-02 writing against the same total | SESSION | Teams plus neutrals equal it |
| `area {length_m, width_m}` | [CA] 54 m of channels on a 30 m field; [RT] the area was restated by pattern-matching after the model wrote it | SESSION | Every region and scoring reference fits inside it |
| `duration_min` | Weakly evidenced. Held fixed in every run; A01-02-03 requires the goal-kick restart to recur "within the period"; it bounds time windows | SESSION | Every time window lies inside it |

### 5.2 Space

| Field | Why | Owner | Claim |
|---|---|---|---|
| `axis` | [VS] RPC-001-07: "a longitudinal axis… so that 'beyond' the pressure/progression line is decidable"; [VS] Wide Zone Advantage needs touchlines "so that 'wide' is a defined lateral position" | SELECTION; else SD-11 (the longer dimension) | Every relational reference (beyond, ahead, own end, wide) compares intervals along or across `axis` |
| `regions[] {id, noun, functions, position}` | [R2], [LG] D09–D27: 19 activities name a "deep" value tier that no region defines, upheld as structural [AC]; [R1] extents were checked only when stated, so vague text passed and precise text failed; [VS] target zones existed only as objects, so their extent was never laid out | SELECTION requires the region and its functions (SD-09); REALIZATION instantiates its position within the value status | Every region referenced anywhere exists; regions in one orientation group fit the dimension they span, whether extents are stated or free |
| `regions[].position {along, across}` — intervals on and across `axis` | [VS] "beyond the first defenders" could be decided mechanically only as a comparison of intervals | REALIZATION within bounds | Relational positions are interval comparisons, never judgement |
| `regions[].functions` — a set of: `objective-area`, `value-condition`, `access`, `start-placement`, `trigger`, `perceptual-reference` (draft) | [VS] VARTARGET-05 requires a trigger region where the reveal trigger is spatial; WIDEZONE-08 an optional reference channel; GF2's authored own-half start; GF3's authored guidance, "the grid is a visual scaffold" (Soccer Module GF3 setup guidance) | SELECTION | Every instantiated region serves at least one supported function. Residual space is not instantiated: WIDEZONE-09 is checked by comparing channel extents with `area` |
| `regions[].noun` — a closed coach-visible noun: band, channel, corridor, zone, half, third (draft) | P5: the renderer may name only what exists, so what exists must carry its name | SELECTION | The renderer names regions only by these nouns |
| Implicit halves and thirds — *view* | [LG] MP-IMPLICIT-FRACTIONS: coaches use "own half" and "defensive third" unmarked | SD-12, computed from `axis` and `area` | Implicit fractions exist without declaration, only along `axis`, and are never instantiated as marked regions |

### 5.3 Performers

| Field | Why | Owner | Claim |
|---|---|---|---|
| `teams[] {id, outfieldCount, goalkeeper, roles[]}` — roles include target player | [CA] "10 players in a 6v6 format"; [VS] forced partition; [VS] RPC-001-05 places the target player in Performers, so as an object it would escape the player count | SELECTION, reconciled against SESSION | Teams plus neutrals equal `players`; every referenced performer or role exists |
| `neutrals {count, affiliation, distinguishable}` | [CA] Neutral Player selected, 0 of 6 activities contain a neutral; NEUTRAL-14 affiliation on possession change; NEUTRAL-06 "contrasting bibs" | SELECTION | A neutral exists when required; affiliation is a rule keyed on a closed trigger (`POSSESSION_CHANGE`), not a state |
| `startPlacement[] {group, region}` — at START only; `group` names a role (starting team, defending team) | [VS] RPC-001-04's placement had to be smuggled in as a pseudo-performer | SELECTION | Every placement's region exists. A formation authored without a region ("the first defenders" as a shape) is `NOT_AUTHORED`, never inferred |

A coach who serves is the actor `COACH` in a transition's placement and consumes no player slot ([LG]
MP-COACH-SERVER).

### 5.4 Objects

| Field | Why | Owner | Claim |
|---|---|---|---|
| `objects[] {id, kind, count, position}` — kinds: ball, goal, line, gate (draft) | [CA] 0 of 60 activities contain a goal while goalkeepers remain; [VS] RPC-001-08 requires exactly one scoring reference; RPC-001-10 a contested ball; VARTARGET-02 requires inactive candidates to stay present | SELECTION; REALIZATION for position within bounds | Every object referenced by a rule, transition or objective exists and is positioned inside `area`; every scoring reference (zone, line, gate) has a Space position and extent that fit |

### 5.5 Objectives

The slice's central discovery was that one `state` field carried five things. They stay separated,
and each fact has one home.

| Field | Why | Owner | Claim |
|---|---|---|---|
| `objectives[] {id, reference, team, role}` — `team` is **the team that attacks it**; role `PRIMARY_SCORING` or `REPRESENTATIVE` | [CA] 0 of 60 contain a goal; [VS] RPC-001-11 "for the team building out"; VARTARGET-06 set membership | SELECTION; SD-10 once confirmed (representative retention) | Every objective has a reference, an attacking team and a role; once SD-10 is confirmed, representative objectives are never removed |
| `objectiveSets[] {id, scope, members[], liveCardinality}` — `scope` is one team or both (EM-0010's Scope parameter, EMP-0059, allows either) | [VS] Variable Target's candidate set | SELECTION | Members exist and fall within the stated scope; a count range authored per set (KR-01) is checked per set |
| `.initialState` — **at START only** | EM-0010's example EMX-0017, "Only the left objective begins active." | SELECTION, or its status | Stated, or carries its status |
| `.persistence` — which transitions, if any, re-run the assignment | [VS] VARTARGET-20 authors a possession-scoped reset only as TYPICAL_EXAMPLE ("The first receiver in the attacking half sets which goal is live for that possession"). The slice contract for Variable Target declares a general reset at restarts not authored | SELECTION, or `NOT_AUTHORED` | Stated relative to named triggers |
| `.assignmentRule` — a finite map `{on: trigger or START, yields: member or procedure over members}` | [VS] "ASSIGNMENT FUNCTION UNRESOLVED" sat in prose where no check could see it | SELECTION, or its status | Every trigger that can fire while the set is in scope maps to a member. Deterministic, no model of play |
| `.revelation` — a reference to one `informationRules` entry | [VS] VARTARGET-13 to 16 had two homes in revision 1 | SELECTION | Refers to an existing information rule |

**C1 is withdrawn as a demonstrated collision (KR-02).** RPC-001-11 is restated as:
- **What it requires:** a `PRIMARY_SCORING` objective for the team building out, which functions within
  the build-out episode (KR-03). Not every attacking episode: SD-14 defines boundaries only.
- **Its basis:** Christian's rulings KR-02 and KR-03. RPC-STMT-004, the item's cited evidence, contains
  no episode clause. Whether an owner ruling is its own basis value is proposal P-6.
- **Its checkability:** PARTLY_STRUCTURAL (proposal P-3, now only about this split).
  - **Structural clause:** the objective set's assignment rule can yield a live member within the
    build-out episode, on START or on a trigger that does not itself end the episode.
  - **Outside the boundary:** whether that happens in a given passage of play.

One point is not decided here:
- **RPC-001 against Variable Target.** The restated structural clause is a residual constraint on
  Variable Target's assignment rule, and it has not been tested. RPC-001-15 and RPC-001-16 against
  Variable Target's triggers were never re-derived. The slice's eight unresolved items all rested on C1;
  they are **not** re-derived here, and reconciliation stays frozen.

**Variable Target's questions stay open, on its own evidence** [C18]:

| Property | What its own evidence says |
|---|---|
| `.initialState` | Variable Target makes no claim about "which candidate starts active at kick-off". Whether a free choice may pick it (a value, not structure, under SD-16) or VARTARGET-16's "so the route cannot be pre-planned" forbids a fixed, known start is open |
| `.assignmentRule` | Authored in the Soccer Module's realization bank entries RB-VARIABLE-TARGET-CONDITION-01 to 04, and in the realization's setup guidance: <br>• 01: the live target "switches the moment the attack completes its first penetrating/forward pass", which in a two-member set names the other member; <br>• 02: the live target is revealed only after the ball enters the final third (a reveal, not a switch); <br>• 03: "when the defense shifts to cover one gate, the other becomes the live one", keyed on defenders' positions and so outside the boundary (status: proposal P-5); <br>• 04: the first receiver in the attacking half sets which goal is live; <br>• the setup guidance also authors a trigger line or coach's cue. <br>No source fixes which member is live at each episode start |
| Coach's cue | The setup guidance allows a coach's cue. IE-C006 restricts the trigger to a state transition or opponent action, and IE-D006 flags external signals (`EXTERNAL_SIGNAL`) for additional scrutiny. The slice contract's not-authored list records the two sources as unreconciled; its item VARTARGET-14 takes IE-C006's side and excludes the cue |
| `.persistence` | Only a possession-scoped reset is authored, and only as TYPICAL_EXAMPLE; a general reset at restarts is declared not authored |
| Reveal timing (IE-D007) | IE-C006 composes trigger type, reveal progression and state dependency — no reveal timing. The slice contract declares the gap itself. Under SD-19 the field exists and stays visibly not authored |
| Information holder (IE-D013 ACCESS_HOLDER) | IE-C006 does not compose it. The slice contract itself declares "whether the live target is knowable to both teams or only to the attacking team" not authored. Under SD-19 the field exists and stays visibly not authored |
| Which teams have a set | Variable Target makes no claim about "whether the opposing team also has a varying candidate set", and declares "whether the constraint applies to one team's target set or to both teams symmetrically" not authored. KR-01 says a reciprocal game "can legitimately" hold 2–3 per team's set. Whether that permission also entails a second set is proposal P-11 |

While any of these is `NOT_AUTHORED` or `UNRESOLVED`, a game that selects Variable Target cannot render.
Which of them are safely deferrable authoring gaps is part of the recommendation Christian asked for,
not a settled classification.

EM-0010 (Objective State) is consistent with the decomposition but narrower than it. Its one dimension,
Activation State, has three parameters:
- State Value (EMP-0058) — the current state, which the boundary excludes;
- Scope (EMP-0059);
- Persistence (EMP-0060) — a temporary/persistent label.

It authors no assignment, trigger or revelation.

### 5.6 Direction — *view*

| Field | Why | Owner | Claim |
|---|---|---|---|
| per team `{attacks, defends}` — computed from `objectives[].team` and positions on `axis` | [CA] 57 of 60 never say which way each team attacks; [VS] GF2's authored "Teams attack in the same direction" | SD-07 (the invariant); SELECTION; REALIZATION (which team takes which end) | Every team has a stable direction and at least one functional directional objective, in opposite senses on `axis` unless a SELECTION exception exists that no standing decision forbids |

Not stored: storing it would create a second place that can disagree with `objectives`.

### 5.7 Transitions

| Field | Why | Owner | Claim |
|---|---|---|---|
| `transitions[] {trigger, qualifiers}` — qualifiers from a closed list: last touch, which end line, region (draft) | [R1] Transitions had no check at all; [VS] the out-of-play slot split by end line versus touchline and by last touch | SELECTION; else see below | Qualifiers are typed; each is atomic with its own support |
| `.awardedTo` | [VS] GF2-16 "restarts with the team that did not touch it last" | SELECTION; else see below | One value per trigger |
| `.placement {actor, region, method}` — actor: a team role, goalkeeper, or `COACH` | [VS] RPC-001-16; [CA] From Goal Kicks realized 0 of 3 | SELECTION; for the START actor only, SD-13 when the method is a kickoff or stationary ball | Required when `STOP_RESUME`, absent when `CONTINUE`; actor and region exist |
| `.placement.method` — draft: `STATIONARY_BALL` (kickoff, goal kick, free kick), `SERVED`, `IN_HAND` | SD-13 applies only "when the resolved START procedure is a kickoff/stationary-ball start", so that must be decidable | SELECTION | **This field and its values are this specification's addition (proposal P-1).** Without a method, SD-13 simply does not apply |
| `.playState` — `STOP_RESUME` or `CONTINUE` | [R2], [LG] D36–D37: ps-central s1 and s2 restart from a place on the same trigger on which play continues ("Play does not stop"; "play carries on from wherever everyone is") | SELECTION; else see below | **Coherence:** a non-empty `.placement` requires `STOP_RESUME`, and `CONTINUE` requires `.placement` empty. Consequences that restart, continue or change possession on a transition trigger are folded into that trigger before comparing |
| `.startsEpisode` | [VS] RPC-001-17 authors loss of possession as an episode end; VARTARGET-20 scopes by possession | SELECTION; else SD-14 (START, SCORE and POSSESSION_CHANGE begin an episode) | Stated per trigger, by an authored source or SD-14; never derived |

**Where no selected object authors a start or restart** — Christian's rulings [C18b]:
- **Turnover:** plays on (SD-20), unless selected knowledge explicitly creates a stoppage or reset.
- **Which team starts:** a permitted free choice unless selected knowledge requires otherwise (SD-R2).
  There is no default start location.
- **After a score:** a valid post-score procedure is necessary, but no universal realization is
  adopted (SD-R3). An unauthored post-score restart is `NOT_AUTHORED`.
- **Ball out of play:** "the team that didn't put it out restarts where it went out" is ordinary soccer
  behaviour in substance, but it has no proper source yet. An unauthored out-of-play restart is
  `NOT_AUTHORED`, marked *source missing: ordinary sport-state knowledge* (PSD-03, §2).
- **START procedure and method:** unauthored is `NOT_AUTHORED`. This is the specification's reading
  (proposal P-2), not SD-13. SD-13 only limits when its actor default applies.
- **Game Forms** are not asked to duplicate ordinary soccer-state behaviour [C18b].

Measured against today's knowledge [CV], all 11 Game Forms leave at least one start or restart
unauthored. After SD-20, turnovers are covered; starts, post-score and out-of-play restarts are not.

**One closed trigger vocabulary for every field that has a trigger (draft):**
- `START`
- `SCORE`
- `OUT_END_LINE`
- `OUT_TOUCHLINE`
- `POSSESSION_CHANGE`
- `REGION_ENTRY {region}`
- `TIME_EXPIRY {window}`
- `STANDING`, for openly known information

Whether `POSSESSION_CHANGE` is structural when play continues through a turnover is untested (C4).

### 5.8 Rules of value

| Field | Why | Owner | Claim |
|---|---|---|---|
| `primaryEvent {kind, value, conditions[]}` — its reference is derived from `PRIMARY_SCORING` objectives and sets | [CA]: the scoring event and its condition were one of two selections that reliably changed what players experience. RPC-001-20's "One point per qualifying event" had no typed field; the slice placed it as an ad hoc "point value" entry | SELECTION narrows to a valid set (for RPC-001, RPC-REL-071 to 074: the valid events "in the approved order"); under RR-01 the Context decides which physically available event applies; REALIZATION chooses only where that leaves a choice (proposal P-4). SD-06 fixes one | Exactly one primary event; base `value` present and numeric; every member of its reference has a Space position. How the approved order binds the choice is not settled here |
| `.conditions[]` — typed: `origin`, `control`, `eligibility`, `progression`, `exclusion` (draft) | [CA] 41 of 42 Pass Combination Gate activities contain no passing requirement; [VS] RPC-001-18's "progressing beyond the initial pressure or progression line"; RPC-001-19 long kick | SELECTION | Each condition refers to existing regions, objects or placements, and is attached to the primary event. **No condition refers to a player's position during play.** "Long kick" and "controlled on arrival" are `FREE` under SD-15: no invented number, and no claim about the in-play judgement |
| `valueModifiers[] {condition, magnitude, combination}` — condition typed over regions, objects and events only | [R2], [LG] D09–D27, 19 "deep" tiers, structural per [AC]; [VS] C2, a multiplier with no magnitude | SELECTION only (SD-06: a value change must be explicitly authored) | Referents exist; **magnitude present**, else `NOT_AUTHORED`; any two modifiers whose conditions can hold at once are mutually exclusive on the layout or covered by an authored combination rule; a modifier changes only the primary event's value, never adds a second way to score |
| `consequences[] {trigger, effect, referents}` — effects: `ACCESS {team, region}`, `COUNT_CHANGE {team, delta}` (draft) | [CA] consequence rewards reached Scoring in 0 of 57; [R2], [LG] D33–D35 "the other team gets the opposite channel", D39 "the next action decides it" | SELECTION | Every effect is typed and writes a field; every referent resolves uniquely in every state its trigger can fire from |
| `informationRules[] {subject, trigger, dimensions}` — the three dimensions IE-C006 composes (IE-D006 trigger type, IE-D008 reveal progression, IE-D011 state dependency), plus IE-D007 reveal timing and IE-D013 ACCESS_HOLDER, which the representation must be able to express (SD-19). The cap of five is this specification's own | [VS] the effect vocabulary had no information type; [CA] Variable Target Condition was INERT: "No target varies"; WIDEZONE-17 is standing, openly known information | SELECTION | The subject exists; the trigger kind lies in the authored range; a `STANDING` rule changes nothing and is exempt from "changes a property". A rule carries only the dimensions its own object's contract calls for. Variable Target's contract itself declares reveal timing and distribution not authored, so for it those stay visibly not authored (SD-19) |
| `timeWindows[] {startsOn, duration, expiryEffect}` | [CA] the Applying emphasis added "score within a 30-second window"; [AC] #4 admits it as shot-clock shorthand | SELECTION only; `startsOn` comes from the selected time-window mechanism, with no default (SD-R1); `duration` from its authored range, `FREE` (a) where the coach adjusts it | Start trigger and expiry effect typed; inside `duration_min` |

**Where Christian's list of consequence effects lives** ([DS] decision 2). Each effect has exactly one
home:

| Effect | Home |
|---|---|
| Possession | `.awardedTo` |
| Restart or state | `.playState` and `.placement` |
| Continuation | `CONTINUE` |
| Temporary numerical advantage | `COUNT_CHANGE`, or neutral affiliation |
| Access or eligibility | `ACCESS` |
| Spatial advantage | `ACCESS` with a named region |
| Target availability | `assignmentRule` |
| Value | `valueModifiers`, where explicitly authored (SD-06) |

**Removed from the representation:**
- `exclusions[]`, which live in the contract and are checked by Gate B;
- `consequences[].duration`;
- `valueModifiers[].beneficiary`. A modifier changes the value of the primary event, which is credited
  to the team that achieves it.

**Not representable, deliberately:** a condition keyed on local player numbers ("where you have the
extra numbers"), per [AC] #4.

## 6. The contribution contract — outside the representation

The representation holds resolved properties. The contract holds what each selected knowledge object
says before reconciliation. **Non-claims and ownership scope live here.** So does every structural
property that a session emphasis or slot template requires: it enters as a `SELECTION` item under its
own contract (SD-17), with no separate route into the game or its language.

| Part | Holds | Why |
|---|---|---|
| `items[] {id, fieldPath, requirement, value, strictness, valueStatus}` | Requirements and exclusions in one list: an exclusion is an item with strictness `EXCLUSION`. A value may be a **set of alternatives, ordered only where the source orders them**. `valueStatus` per SD-08 | [VS] 68 REQUIRED, 24 SUPPORTING and 21 EXCLUSION items (113). RPC-001-08's "in the approved order" is ordered. WIDEZONE-13's three rewards are unordered alternatives with no authored default |
| `items[].scope` — `WHOLE_GAME`, `PER_TEAM`, `PER_OBJECTIVE_SET`, `PER_SIDE`, `OWN_INVOLVEMENT` (draft) | Christian asked for ownership scope. [VS] Wide Zone's multiplier coexisted with VARTARGET-18 and NEUTRAL-15 only because each was object-scoped; GF2-09 survived only when read per side; KR-01 settles VARTARGET-01 as `PER_OBJECTIVE_SET` |
| `items[].basis` — `AUTHORED` with the verbatim evidence, or `ASSUMED` with the assumption stated; whether an owner ruling (KR-02) is a third value is proposal P-6 | [VS] RPC-001-08's "exactly one" came from a standing decision; VARTARGET-07's "exactly one active" is a derivation; RPC-001-11's former timing clause was a reading. An assumed item can narrow but never entail. Engine wording is never `AUTHORED` (SD-21) |
| `items[].checkability` — `STRUCTURAL`, `PARTLY_STRUCTURAL` or `OUTSIDE_BOUNDARY` | RPC-001-21 (pressure not dominant), RPC-001-22 (at least two routes) and VARTARGET-15 cannot be checked on a structure that excludes play. GF2-10, GF2-15, WIDEZONE-09, NEUTRAL-16 and the restated RPC-001-11 mix a structural clause with a clause about play. The classification is this specification's. SD-15 is the same boundary applied to two named thresholds |
| `nonClaims[] {fieldPath, scope}` — **mandatory coverage**: every field path is claimed, excluded, non-claimed or not authored | P1. [VS] every successful composition — the player partition, the three-rule restart, the goalkeeper question, the incentive exclusions, the choice of scoring event — ran on an object declaring what it did not claim. Unexamined silence is a contract defect, reported before reconciliation, not a permission |
| `notAuthored[] {fieldPath, missing}` | [VS] seven of the ten dead contributions were gaps the objects declared themselves. Two of them, "controlled on arrival" and "long kick", are now `FREE` under SD-15 |
| `relationshipRules[] {id, owner, decides}` — authored rules that decide between items on one path | P4. RR-01, RPC-REL-071 to 074 and GAK-0103 decided slice cases, alongside SD-06, SD-07 and SD-08. A property written by more than one source must cite one, or be `UNRESOLVED` |

**Where the contract touches the game:** exactly twice.
- Support is derived by matching items to properties.
- Non-claims act as a permission check on `REALIZATION` values.

Neither puts knowledge prose into the game.

## 7. Deliberately not held

- Player movement, tactics, positions during play; triggers keyed on player positioning.
- Pressure, opportunity, affordance, uncertainty, representativeness; local-numbers conditions.
- The state of a game in progress: which target is live now, who has the ball now.
- The coach's in-play judgement of a `FREE` condition (SD-15).
- Coach language, rationale, design intent, selection scores.
- **How the three activities differ** (SD-17). Session emphasis and slot templates stay outside the
  individual game ([R2]: 23 of 35 true defects came from three template sentences in `coach-voice.ts`).
  Their role in variation across the three-activity set is a separate question for later.
- **Learning Stage.** [CA] rated it TEXT-ONLY: "No systematic difference across the three stages". One
  run added a pass-count condition, which is within noise.

## 8. What it lets Challenge Point validate

| Check | Claim | Checked on |
|---|---|---|
| **Gate A — structural coherence** | This game can be coherently laid out and played as specified | Regions and scoring references fit; performers sum; every reference resolves; one value per atomic transition property per trigger, with the coherence rules; every effect typed and every referent unique; one primary event whose reference resolves whenever it can fire; overlapping value modifiers exclusive or combined by an authored rule; no `UNRESOLVED` or `NOT_AUTHORED` property |
| **Gate B — realization fidelity, forward** | Every required contribution survived | Every `REQUIRED` structural item or clause is satisfied by a property with derived support; every `EXCLUSION` holds; every NARROWS bound holds **at its scope** |
| **Gate B — realization fidelity, reverse** | Nothing was invented | Every property in the game has derived support from a contract item or a citable SD id. **Otherwise: INVENTED** |
| **Gate B — reporting** | Nothing is silently lost | `OUTSIDE_BOUNDARY` items are reported as not structurally checkable, counted, and never dropped from the denominator. A `PARTLY_STRUCTURAL` item's structural clause is checked and the rest is reported. `FREE` conditions are reported as existing and attached, not as judged. Adaptations are recorded as dispositions |
| **Render fidelity, after rendering** | The text describes the game and introduces nothing (SD-05) | **Every structural property the text names or describes maps to a property of the game** — regions, objects, states, triggers, consequences, counts, value tiers, conditions, roles and placements are examples, not a closed list. No number is attached to a `FREE` (b) condition unless bounds are authored. [R2]: 23 of 35 true defects were written by the renderer's own templates |

**The rendering precondition:** Gate A and both directions of Gate B pass, and no property is
`UNRESOLVED` or `NOT_AUTHORED`.

## 9. The hostile cases, across the three revisions

| Case | Revision 1 | Revision 2 | Revision 3 |
|---|---|---|---|
| baseline s1: 18 m channels on 30 m | caught | caught | caught, Gate A (regions fit) |
| ps-central s1: restart from a place against "play does not stop" | **let through** | caught | caught, Gate A (transition coherence) |
| "…then wide, then deep", 19 activities | **let through** | caught | caught, Gate A (overlapping modifiers with no combination rule) and render fidelity (SD-05) |
| gf-channel s1: "the other team gets the opposite channel" | **let through** | caught | caught, Gate A (`ACCESS` needs a uniquely resolving region) |
| em-foundation-neutral s1: "10 players in a 6v6 format" | uncaught | caught | caught by render fidelity; the missing neutral by Gate B |
| ps-goal-kicks s2: "Teams start in their defensive zone, with the ball in the central zone. Play begins with a pass from the central zone." | — | passed on an implicit kickoff default ([LG] MP-KICKOFF) | **pending.** The text authors no START method. Reading "the ball in the central zone" as a stationary-ball start is this specification's inference from generated prose. The verdict waits on how START is resolved (P-1, P-2). From Goal Kicks unrealized is caught by Gate B either way |
| [VS] invented "inactive zone is out of play" | **let through** | caught | caught, Gate B reverse: a free choice cannot create a trigger (SD-16) |
| [VS] four target zones, two per team, against VARTARGET-01's 2–3 | **let through** | caught, as a whole-layout breach | **passes the count** under KR-01: each team's set holds 2. Whether a second team's set is entailed at all is open (§5.5) |
| C1 | partly resolved by a universal rule | open | **withdrawn as a demonstrated collision** (KR-02); Variable Target's own questions stay open |

## 10. Proposals awaiting Christian's ruling

None of these is used as a decision anywhere above. Each is the specification's own reading, labelled
where it appears.

### Start and restart defaults — ruled [C18b]

| Id | Proposed default | Ruling |
|---|---|---|
| PSD-01 | START: coin-toss team, own half | **No** → SD-R2 (who starts is a free choice) |
| PSD-02 | After a score, the conceding team restarts from its own end or half | **No** → SD-R3 (a valid procedure is necessary; none made universal) |
| PSD-03 | After the ball goes out, the team that did not put it out restarts where it went out | **Yes in substance; owner unresolved.** Source visibly missing (§2) |
| PSD-04 | On a turnover, the team that won the ball plays on | **Yes** → SD-20 |

### Specification proposals

P-8 was approved as SD-21. P-3's scope question was ruled in KR-03; only the split remains.

| Id | Proposal | Why it is needed |
|---|---|---|
| P-1 | A `method` on placements (draft: `STATIONARY_BALL`, `SERVED`, `IN_HAND`) | SD-13 is conditional on the START method, which nothing else can express |
| P-2 | A START procedure or post-score restart that no source authors is `NOT_AUTHORED` | Follows from the existence rule and SD-02; consistent with SD-R3 and PSD-03's visible missing source |
| P-3 | RPC-001-11's PARTLY_STRUCTURAL split (its scope is ruled: KR-03) | KR-02 and KR-03 state what RPC-001 requires; how it is checked is the specification's reading |
| P-4 | The list of what a free choice may fill (§3), drawn from the Gate A search, including the event kind inside a narrowed set | SD-16 states the principle; the list is ours and not claimed to be exhaustive |
| P-5 | The status of knowledge authored only outside the boundary (Variable Target's defender-shift trigger): `UNRESOLVED` as revision 2 had it, `NOT_AUTHORED`, or a distinct label | It blocks rendering either way; only the label and the remedy differ |
| P-6 | Whether an owner ruling (KR-02) is a third `basis` value beside `AUTHORED` and `ASSUMED` | The restated RPC-001-11 rests on his ruling, not on the text it cites |
| P-7 | Only the ids marked *citable* in §2 can support a property | Principles, process rulings, rejected defaults and knowledge rulings should not entail existence |
| P-9 | SD-12, SD-13 and SD-14 yield to a selection that writes the field, as SD-11 does in his words | He attached that condition only to SD-11 |
| P-10 | Draft vocabulary contents are never used to classify authored knowledge; what falls outside a draft list is logged for the review | SD-18 defers the contents; it does not say how drafts treat knowledge meanwhile |
| P-11 | KR-01's "can legitimately instantiate" permits a set for each team but does not by itself entail one; a second set needs a selection that requires it | Variable Target declares one-team-or-both not authored, and SD-16 forbids a free choice creating objects |

## 11. Open, deliberately

**Blocking only the games that select the object** (whether each is a safely deferrable authoring gap is
classified in the recommendation, as a proposal):
- **Variable Target:** its questions in §5.5.
- **C2, Wide Zone Advantage:** the multiplier magnitude.
- **Turnover Reward:** the missing consequence.
- **Counterattack:** the time window, parked at Christian's request (14 Sep). Its start ("each time a
  team wins the ball") is engine wording (primary-scoring.ts, `COUNTDOWN_SETUP`). Its 6–10 s range is
  GF11 Recover & Reorganize's authored example ("e.g. 6-10 seconds"), which the engine applies to
  Counterattack.

**Found while incorporating the decisions:**
- **Starts and restarts [CV].** All 11 Game Forms leave at least one start or restart unauthored.
  `restart_structure_type` is empty in all 11. No knowledge authors how a touchline restart is taken
  or who restarts after a score. Today the generation prompt demands "how play begins, and how it
  restarts after a score or a ball out of play" (completion.service.ts), so the model invents them.
  Engine exchange rules keep play live on turnovers for every archetype (build-activity-mechanics.ts,
  `DEFAULT_EXCHANGE_RULE` and `EXCHANGE_RULE_BY_ARCHETYPE`), most of them with the literal words "no
  reset". One entry, Constraint-Driven Free Play, speaks of "restart advantage". Christian's rulings on
  PSD-01 to PSD-04 settle turnovers (SD-20). They leave starts, post-score restarts and out-of-play
  restarts visibly unauthored (§5.7).
- **Engine wording cited as knowledge in the slice.** Ten of the 113 slice items rest only on sentences
  held in code, prompts or unit tests. Six of them are REQUIRED:
  - RPC-001-04 and RPC-001-09, placing the scoring line, zone or gates "beyond the first defenders"
    (`COACH_RULES` setups, primary-scoring.ts);
  - RPC-001-06 and RPC-001-16 on `BUILD_OUT_START` ("Start each attack from your goalkeeper or a
    restart in your own half.", primary-scoring.ts);
  - A01-02-02 on deriveInputConstraints.ts;
  - A01-02-03 on practice-situation-realization.ts.

  The other four are:
  - RPC-001-05 and RPC-001-20 (SUPPORTING, `COACH_RULES`);
  - A01-02-06 (SUPPORTING);
  - A01-02-12 (EXCLUSION, unit tests).

  Under SD-21, none of them supports a property. The coach-rule sentences among them are surfaced by
  the conformance check for classification as ratify, standing decision or retire.
- **The turnover rule is unsupported** (confirmed by KR-03). The slice's rule that turnovers stop play
  cited RPC-001-16 and RPC-001-17. RPC-001-17 is authored ("Possession is lost.", RPC-PROP-005), but it
  requires only that losing the ball ends the episode, not that play stops. Under SD-20 turnovers play
  on unless selected knowledge authors a stoppage.
- **C4, reopened.** How possession is determined for neutral affiliation was closed in the slice by
  turnovers stopping play. With turnovers playing on (SD-20), C4 is open again. It is a question of
  what counts as `POSSESSION_CHANGE` while play continues.

**Still open from the slice and earlier:**
- Game Form restart × From Goal Kicks.
- Central weighting × Wide Zone Advantage.
- Family-ID provenance.
- The three wording issues.
- **Ordinary sport-state knowledge.** Where out-of-play restarts, and perhaps other ordinary soccer
  behaviour, should be authored. Christian: not in Game Forms, not as a founder-created default, and no
  new library or layer during the check [C18b].

**Deferred by Christian:**
- Vocabulary contents, for independent review once the schema is stable (SD-18).
- Session emphasis and slot templates' role in variation across the three-activity set (SD-17).

## 12. What changed

**Revision 4, from Christian's second decisions [C18b]:**

| Change | Basis |
|---|---|
| SD-10 confirmed in his wording (functional necessity, not universal retention) and made citable | [C18b] |
| Turnovers play on unless selected knowledge authors a stoppage | SD-20 (was PSD-04) |
| Coin-toss own-half start and conceding-team restart rejected | SD-R2, SD-R3 (were PSD-01, 02) |
| Out-of-play restart: substance accepted, source visibly missing | PSD-03, §2 |
| Wording held in code is never a source until authored | SD-21 (was P-8) |
| RPC-001's build-out requirement limited to the build-out episode; SD-14 only defines boundaries | KR-03 |
| The conformance check approved, with its boundary: amendments that change a verdict come back to him first | [C18b] |

**Revision 3, from revision 2:**

| Change | Basis |
|---|---|
| Ids for the five defaults, and for his earlier decisions; only field-supplying ids citable | [C18] 2; P-7 |
| C1 withdrawn as a demonstrated collision; RPC-001-11 restated; Variable Target open on its own evidence, stated more precisely (§5.5) | KR-02 |
| SD-11, SD-12 and SD-14 recorded; SD-13 limited to stationary-ball starts; the possession-won window default rejected | [C18] 2 |
| Revision 2's unnamed transition "standing defaults" withdrawn. The four Gate A reading defaults behind them are put to him as PSD-01 to PSD-04; they were never his | P-2; §10 |
| `FREE` extended to "long kick" and "controlled on arrival", keeping revision 2's meaning for authored ranges | SD-15 |
| VARTARGET-01 scoped per objective set; the four-zone case now passes the count | KR-01 |
| Emphasis and slot templates held outside; their structure enters as `SELECTION` under contract | SD-17 |
| Closed lists marked draft, contents not frozen; not classifying authored knowledge by draft lists is proposed | SD-18; P-10 |
| Free-choice boundary adopted in his words; the list of fillable quantities left as P-4 | SD-16; P-4 |
| Reveal timing and access holder adopted as fields; for Variable Target they stay visibly not authored | SD-19 |
| P5 made general; render fidelity checks every structural property the text names or describes | SD-05 |
| Engine wording proposed as never a source; the ten slice items that rely on it listed | P-8; §11 |
| Start and restart coverage measured: 11 of 11 Game Forms leave one unauthored | [CV] |

## 13. How this revision was checked

- **Checking against Christian's decisions.** Two independent readers each checked every decision
  against a first draft of this revision, one starting from his email and one from the text. Both found
  the same pattern: the draft stretched several decisions past what he said. For example:
  - it treated SD-13 as a rule that every START needs an authored method;
  - it applied SD-19 to every information rule;
  - it redefined `FREE` wholesale;
  - it presented the removal of revision 2's transition defaults as his decision.

  Each is now either limited to his words or labelled as a proposal in §10.
- **Citation check.** A separate citation check of the first draft tested 30 claims: 20 were confirmed
  and 10 were imprecise, and all are corrected above. Among them: the slice relied on more authored
  deciding rows than RR-01, and "information holder" is canonically IE-D013 ACCESS_HOLDER.
- **Coverage measurement.** Two measurements of today's knowledge and runtime supplied [CV]. Their
  load-bearing counts were re-checked by hand before being used here: `restart_structure_type` empty
  in all 11 Game Forms, and the slice's comparison kinds.
- **A final independent check** of this revision and the recommendation re-read both against the email
  and the repository. It found a few more places where the text went beyond his words, now labelled
  P-9 to P-11. It also caught that my own count of slice items resting on engine wording was too low:
  six, when the true figure is ten. My filter missed the `COACH_RULES` citations. It is corrected
  above, and it matters: two of the missed items place RPC-001's scoring reference "beyond the first
  defenders".
