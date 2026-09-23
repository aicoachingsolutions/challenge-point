# Game Representation Specification — minimum draft

Draft, 17 September 2026. Paper only: no implementation, no generation. It specifies; it does not build.

**The question it answers:** what is the smallest authoritative description Challenge Point needs of a
game before it can safely generate coach-facing language?

**The answer, in one line:** a resolved game in eight areas, in which every property is either resolved
or free within stated bounds, every property is **supported** by a source that actually entails or
permits it, nothing that play depends on is unresolved, and Gate A and Gate B both pass. Only then may
language be rendered from it.

Evidence is cited as: **[CA]** causal expression audit (`docs/audits/causal-expression-2026-09-14.md`),
**[R1]** first replay (`docs/audits/minimum-representation-replay-2026-09-16.md`), **[R2]** second replay
(`docs/audits/gate-a-second-replay-2026-09-17.md`), **[VS]** RPC-001 vertical slice
(`docs/audits/rpc001-slice-2026-09-17.md`).

---

## 1. Governing rules

**The boundary.** The representation holds what a coach lays out and what the rules key on. It holds
no player movement, no tactics, no pressure scalar, no opportunity, affordance, uncertainty or
representativeness. It describes the rules that govern state, never the state of a game in progress.

**Principles** (Christian's, preserved):
- **P1 — Non-claim.** Independent knowledge should explicitly define what it requires, excludes or
  constrains, and what it does not claim, so reconciliation does not depend on hidden precedence. [VS]
- **P2 — Support.** Provenance is insufficient unless the cited contribution actually supports the
  resolved property. A property with six citations but no supporting source is still invented. [VS]
- **P3 — Realization ≠ Mention.** A property is realized only when its functional effect exists in the
  representation, not when a word for it appears in text. [CA, R1]
- **P4 — Fail rather than infer.** Reconcile only through an authored ownership or relationship rule.
  Otherwise the property is UNRESOLVED and the game is not rendered. [VS]
- **P5 — Prose cannot create structure.** Language may name a structurally defined region or state
  (for example "deep"), but may not create an otherwise undefined value tier, object or rule. [R2 ruling]

**Standing decisions it enforces:** one primary scoring event; the direction invariant; three value
statuses (REQUIRED_RANGE, PREFERRED_DEFAULT, TYPICAL_EXAMPLE); regions required by knowledge and
instantiated by realization; representative objectives retained even when nothing scores on them.

## 2. The property record

Every value in every area is carried in the same record. This is where provenance and support live.

| Part | Holds | Why it exists | Validatable claim |
|---|---|---|---|
| `value` | The resolved value, a bounded range, or empty | — | — |
| `status` | `RESOLVED` · `FREE` (a realization choice inside stated bounds) · `UNRESOLVED` (carries a collision id) | [VS] C1 had to be carried as prose "ASSIGNMENT FUNCTION UNRESOLVED"; [VS] "magnitude unresolved" sat inside a string where no check could see it | No property that play depends on is `UNRESOLVED` |
| `sources[]` | Everything that contributed: `{id, kind}` | [VS] provenance mixed contribution ids, standing decisions, adaptation tokens and absence markers in one flat array | Every contributor is attributable, and its kind is known |
| `support[]` | The subset of sources that **actually authorize** the value: `{sourceId, relation, citation}` | [VS] "entering an inactive zone is out of play" cited six contributions, none of which authorized it (P2) | **Every property has at least one support entry.** Sources without support = **invented**, and the game fails |

**Source kinds** (closed): `SESSION` (the coach's session input) · `SELECTION` (a contribution from a
selected knowledge object) · `STANDING_DECISION` · `DEFAULT_RULE` (a closed shorthand default) ·
`SET_POLICY` (session emphasis or learning stage, acting across the three activities) · `REALIZATION`
(a free choice).

**Support relations** (closed):
- `ENTAILS` — the source states this value.
- `NARROWS` — the source bounds a range; the value lies inside it.
- `PERMITS` — the source explicitly does not claim this field (P1), leaving it free.
- `AUTHORIZES_ADAPTATION` — a standing decision authorizes adapting a PREFERRED_DEFAULT (for example
  GF2's "same direction" adapted under the direction invariant [VS]).

A `REALIZATION` value is legitimate only when every selection touching that field has either `PERMITS`
or a `NARROWS` bound the value satisfies. [VS] The four-zone layout breached Variable Target's authored
2–3 range, and would have failed here.

## 3. The eight areas

Each field lists: **why it exists** (the observed failure that requires it), **owner** (what supplies
its value), and **claim** (what Challenge Point can then validate). Every field uses the property record.

### 3.1 Envelope

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| `players` | [CA] "10 players in a 6v6 format"; [CA] the player-format module repairs squad arithmetic inside prose, 286 lines | SESSION | Performers sum to it |
| `area {length_m, width_m}` | [CA] 54 m of channels on a 30 m field; area restated by pattern-matching after the model wrote it | SESSION | Every region fits inside it |
| `duration_min` | [CA] the Win Condition could not say when play ends until duration was carried | SESSION | Every time window lies inside it |

### 3.2 Space

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| `axis` — which dimension is the direction of progression | [CA] "beyond the first defenders" undecidable in 59 of 60; [VS] RPC-001 requires "a longitudinal axis… so that 'beyond' is decidable" | SELECTION (Game Form directionality, RPC) or DEFAULT_RULE (the longer dimension) | Every "beyond / ahead / own end" reference resolves |
| `regions[] {id, kind, orientation, extent_m, position, marked}` | [CA, R1] regions named but absent: 19 of 60 score a "deep" tier no setup defines; restarts "from the defensive third" on a field cut lengthwise; [R1] extents only checked when stated, so vague text passed and precise text failed | SELECTION requires the region and its function; REALIZATION instantiates extent within the knowledge's value status | Regions in one orientation group fit the dimension they span, whether their extents are stated or free |
| `regions[].function` — `objective-area` · `value-condition` · `eligibility` · `start-placement` · `perceptual-reference` | [CA] "corridor and channels are decoration — no density rule, no wide advantage"; [VS] GF3's grid is "a visual scaffold" that restricts nothing and must still be representable | SELECTION | Every region is used by something, or is explicitly perceptual only |
| Target zones as regions | [VS] target zones existed only as objects, so their 12 × 3 m extent was never laid out and became a free choice with structural consequences | SELECTION (the scoring event requires the zone), REALIZATION (extent) | A scoring area has an extent that fits, and its overlap with other regions is visible |
| Derived fractions (own half, thirds) | [R2] coaches use "own half" and "defensive third" without marking them; admitted shorthand | DEFAULT_RULE (derived from `axis` + `area`) | Implicit halves and thirds exist without being declared, and never on the wrong axis |

### 3.3 Performers

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| `teams[] {id, outfieldCount, goalkeeper}` | [CA] 31 of 60 start attacks from a goalkeeper never placed; [R1] "6v6 with goalkeepers" read two ways | SELECTION (Game Form role structure, RPC goalkeeper requirement), reconciled against SESSION | Team totals plus neutrals equal `players`; every referenced performer exists |
| `neutrals {count, affiliation, distinguishable}` | [CA] Neutral Player selected, 0 of 6 activities contain a neutral; [VS] affiliation is state-dependent ("the team currently in possession") | SELECTION | A neutral exists when selected; its affiliation rule names a determinable condition |
| `servers[]` — non-playing actors who put the ball in play | [R1] six activities start "with a pass from the coach", which fit no performer field | DEFAULT_RULE or SELECTION | The start actor exists and consumes no player slot |
| `startPlacement[] {group, region, at: START · EVERY_RESTART}` | [VS] RPC-001's first-defender line had to be smuggled in as a pseudo-performer; [R1] a start nobody could execute — both teams in outer zones, "play begins with a pass from the central zone" | SELECTION (RPC begin condition), DEFAULT_RULE | Whoever starts play is placed where play starts; every placement region exists |

### 3.4 Objects

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| `objects[] {id, kind, count, owner, placement}` — kinds: ball, goal, line, gate, target player | [CA] 0 of 60 contain a goal while goalkeepers remain; [CA] "restart with a goal kick" in 3 games with no goals; [R1] the ball appears only under Equipment | SELECTION (RPC setup requirement, Goalkeeper Included's "goals at each end"), REALIZATION (placement within bounds) | Every object a rule, transition or objective refers to exists |

Scoring references **with extent** (target zones) are Space regions; references **without extent**
(line, gate, target player, goal) are Objects. This removes the ambiguity [VS] found.

### 3.5 Objectives

The slice's central discovery: one `state` field was carrying five things. They are separated here.

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| `objectives[] {id, reference, team, role}` — role `PRIMARY_SCORING` or `REPRESENTATIVE` | [CA] goals removed because nothing scored on them, 0 of 60; [R2] a scored object with no owning team fired three checks at once | SELECTION, STANDING_DECISION (representative retention) | Every objective has a reference, a team and a role; representative objectives are never removed |
| `objectiveSets[] {id, team, members[], liveCardinality}` — **scope** | [VS] Variable Target needs "exactly one of this team's candidates live"; a set is the unit that rule applies to | SELECTION | Each set's members exist and belong to one team |
| `objectiveSets[].initialState` — **value at the start of each episode** | [VS] C1: RPC-001 requires the objective "active from the moment the attack begins" | SELECTION, or UNRESOLVED | Every episode start has a defined live member, or the game is not rendered |
| `objectiveSets[].persistence` — how long an assignment holds | [VS] Variable Target's only reset rule sat inside a typical example | SELECTION | Persistence is stated relative to named transitions |
| `objectiveSets[].assignmentRule` — what determines the live member | [VS] the resolved game carried "ASSIGNMENT FUNCTION UNRESOLVED" with nothing a check could see | SELECTION, or UNRESOLVED | The rule is total: it yields a member in every reachable state |
| `objectiveSets[].knowability` — who can know the live member, and when (Information Expression dimensions) | [VS] Variable Target forbids the live target being "determinable before its trigger fires" | SELECTION | Knowability is stated against named triggers, not as prose |

**What this decomposition does to C1.** The collision becomes precise instead of prose. RPC-001 writes
`initialState` (defined at every episode start). Variable Target writes `knowability` (not before its
trigger). The fields are distinct, so the question becomes answerable: is there an `assignmentRule`
that is total at every episode start *and* not knowable before a trigger? [VS]'s adversarial pass argued
there may be one, so the conflict may be partly an artefact of the old field. **Whether one exists, and
who owns it, is left open, as instructed.** The specification only makes the question askable.

### 3.6 Direction

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| per team `{attacks, defends}` — objective or set ids | [CA] 57 of 60 never say which way each team attacks; [VS] GF2's authored "teams attack in the same direction" | STANDING_DECISION (the direction invariant), SELECTION (Game Form), REALIZATION (which team takes which end) | Every team has a stable direction and at least one functional directional objective; opposite senses on `axis` unless an authored realization says otherwise |

### 3.7 Transitions

Three restart rules looked like rivals in [VS] because one slot held one value. They are properties of
a transition, not competing values of it.

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| `transitions[] {trigger, qualifiers}` — trigger kinds: START, SCORE, OUT_END_LINE, OUT_TOUCHLINE, TURNOVER, TIME_EXPIRY | [CA] 2 of 60 state no start of play; [R1] Transitions had no check at all | SELECTION, DEFAULT_RULE | START exists; each trigger's qualifiers (last touch, which end) are stated or defaulted |
| `.awardedTo` | [VS] GF2 authors the beneficiary ("the team that didn't touch it last") | SELECTION, DEFAULT_RULE | Exactly one value per trigger |
| `.placement {actor, region}` | [VS] RPC-001 authors where ("from your goalkeeper or a restart in your own half"); [CA] From Goal Kicks never realized, 0 of 3 | SELECTION | Exactly one value per trigger; actor and region exist |
| `.playState` — `STOP_RESUME` or `CONTINUE` | [R2] ps-central s1 and s2: a restart from a place against "play does not stop" on the same trigger | SELECTION, DEFAULT_RULE | Exactly one value per trigger — this is where true transition conflicts are caught |
| `.reestablishes` — what the restart restores (for example the begin condition) | [VS] RPC-001: "every restart re-establishes the begin condition" | SELECTION | A named condition exists |
| `episodeStart` — derived: which transitions begin a new attack | [VS] C1 depends on "the moment the attack begins", which nothing defined | Derived from `playState` and `reestablishes` | Objective-set initial state is checked at exactly these points |

### 3.8 Rules of value

| Field | Why it exists | Owner | Claim |
|---|---|---|---|
| `primaryEvent {kind, reference, conditions[]}` — kinds from the controlled scoring-event vocabulary | [CA] the one functional layer in the audit; [R1] object placed "beyond the first defenders" in 59 of 60 | SELECTION (the RPC chooses among physically available events) | Exactly one primary event; its reference exists at a fixed place |
| `primaryEvent.conditions[]` — typed: `origin`, `control`, `eligibility` (e.g. passes before scoring), `exclusion` (e.g. long kick) | [CA] Pass Combination Gate realized in 1 of 42; [VS] "controlled on arrival" and "long kick" have no threshold (C3) | SELECTION | Each condition refers to existing entities; a missing threshold is visible, not silent |
| `valueModifiers[] {condition, referents, magnitude, beneficiary}` | [R2] 19 "deep" tiers with no region; [R2] "extra numbers" in even games; [VS] a multiplier with no magnitude (C2) | SELECTION, SET_POLICY (emphasis slot modifiers wrote the "deep" line) | Referents exist; the condition can be both true and false on this layout; **magnitude is present**; no modifier is a second way to score |
| `consequences[] {trigger, effect, beneficiary, duration}` — effects (closed): POSSESSION_CHANGE, RESTART, ACCESS, COUNT_CHANGE, SPATIAL_ADVANTAGE, TARGET_AVAILABILITY, CONTINUATION, VALUE_CHANGE (only where authored) | [CA] consequence rewards reached Scoring in 0 of 57; [R2] "the other team gets the opposite channel" and "the next action decides it" untyped | SELECTION | Every effect is typed and changes something; beneficiary exists |
| `informationRules[] {subject, trigger, audience, dimensions}` — dimensions from Information Expression RC1.1 | [VS] the effect lexicon had no information type, so an information rule could not be typed at all; [CA] Variable Target realized in 0 of 3 | SELECTION | The subject exists; the trigger kind lies inside the authored range; the rule changes a referenced property |
| `timeWindows[] {startsOn, duration, expiryEffect}` | [R2] a 30-second window with no start or expiry (admitted as shot-clock shorthand); Counterattack countdown parked | SELECTION, SESSION (a coach choice inside an authored range) | Start trigger and expiry effect are typed |
| `exclusions[]` — structural only | [VS] RPC-001 and GF2 authored exclusions; "no second scoring route" and "no region entry-prohibited" are checkable | SELECTION | Each structural exclusion holds on the resolved game |

## 4. The contribution contract — kept outside the representation

Non-claims belong **here, not in the game.** The representation holds resolved properties; the
contract holds what each selected knowledge object says about them before reconciliation.

| Part | Holds | Why it exists |
|---|---|---|
| `requirements[]` | area, field, requirement kind, value, strictness, value status | [VS] 89 contributions, all traceable |
| `exclusions[]` | what must not exist | [VS] 21 exclusions |
| **`nonClaims[]`** | fields the object deliberately leaves free (P1) | [VS] every successful composition — the player partition, the three-rule restart, the goalkeeper question, the event kind — ran on an object declaring what it did not claim |
| `notAuthored[]` | what the object needs but its knowledge does not supply | [VS] seven of ten "dead" contributions were gaps the objects declared themselves |
| `fallbacks[]` | alternatives an object accepts if its first form cannot be realized | [VS] Wide Zone survived only because it happened to author three alternatives |

The game touches non-claims in exactly one place: a `PERMITS` support relation cites them. That keeps the
representation a description of the game, and keeps ownership reasoning in the contract.

**Kept out of both, deliberately:** exclusions about emergent qualities, such as RPC-001's "coordinated
high pressure must not dominate". They cannot be checked structurally, and pressure is outside the
boundary. They stay in knowledge, for a later question.

## 5. What the representation deliberately does not hold

- Player movement, tactics, positions during play.
- Pressure, opportunity, affordance, uncertainty, representativeness.
- The state of a game in progress: which target is live *now*. Only the rules that determine it.
- Coach language, rationale, design intent, selection scores.
- How the three activities differ. That is `SET_POLICY` acting above the single game.

## 6. What it lets Challenge Point validate

| Gate | Claim | Checked on |
|---|---|---|
| **A — Structural coherence** | "This game can be coherently laid out and played as specified" | Regions fit; performers sum; every reference resolves; one value per transition property per trigger; every effect typed; one primary event at a located reference; every objective set has a total assignment at every episode start; windows have start and expiry; **no invented property** |
| **B — Realization fidelity** | "Every required contribution from the selected knowledge survived" | Every REQUIRED contribution maps to at least one property it `ENTAILS` or `NARROWS`; every exclusion holds; every `REALIZATION` value respects all non-claims and bounds |
| Not validatable here | Representativeness, whether affordances emerge, pressure | Deliberately outside |

**The rendering precondition:** language may be generated only from a representation in which Gate A and
Gate B pass and no property that play depends on is `UNRESOLVED`. The renderer may name what exists and
may not create what does not (P5).

## 7. Open, deliberately

- **C1**, RPC-001 × Variable Target: now askable as a question about `initialState`, `assignmentRule` and
  `knowability`. Not resolved; ownership of the relationship rule undecided.
- **C2**, the wide-zone multiplier magnitude: the field now exists and is empty.
- **C3**, RPC-001's "controlled on arrival" and "long kick" thresholds: typed conditions with no authored
  value.
- **Closed vocabularies** (region kinds, object kinds, trigger kinds, effect kinds) are drafted from the
  evidence and will need Christian's review.
- Carried from earlier: Game Form restart × From Goal Kicks; central weighting × Wide Zone Advantage;
  Turnover Reward's missing consequence; family-ID provenance; Counterattack timing; the three wording
  issues.
