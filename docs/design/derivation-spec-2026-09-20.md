# Derivation specification — version 1, with Christian's adopted rulings

20 September 2026. Paper only: no implementation, no generation. This is the derivation half of the
Game Representation Specification: how support is derived from contracts, what verdict each property
gets, and what each contract item is reported as.

It supersedes the run conventions used during the conformance check
(`docs/audits/conformance/derivation-rules-2026-09-18.md`), which were provisional. Where Christian
ruled on 19 and 20 September, his ruling is the rule, quoted.

**Two things are flagged for him** rather than decided here:
- **AM-05's cardinality flag** (§4.3). His rule needs something the grammar does not hold today.
- **One item-result label** (§7). Neither "adapted" nor "inert" fits one case his AM-06 ruling creates.

**Not in scope:** the engine that applies these rules. He directed that the collision test runs first.

## 1. The unit of judgement

One line per (element, row), and one per member for set- and list-valued rows. An assignment rule gives
one line per key. A property the game needs but leaves unstated is listed with its verdict. Forward
results — a required item unmet, an exclusion breached, a bound breached — are a separate list (§7),
never a property's verdict.

**Views get no line at all** (AM-07, adopted): the direction view and the implicit halves and thirds are
computed, and items on them are checked in the forward direction only.

## 2. Verdicts

Every line gets exactly one verdict. Take the first that applies:

| Verdict | When |
|---|---|
| `UNRESOLVED` | two support-capable, in-scope items collide on the line and no authored rule decides it (§6) |
| `FREE(b)` | "long kick" or "controlled on arrival" (SD-15), and no other term |
| `RESOLVED:ENTAILED` | an entailing source supports it (§4) |
| `NOT_AUTHORED(reason)` | required but unauthored; reason codes below |
| `FREE(a)` | the authored source leaves the quantity to the coach and the game states the range |
| `FREE(choice)` | a degree of freedom SD-39 authorizes, within supported bounds, with the value chosen downstream (§5). *Replaces `RESOLVED:NARROWED_CHOICE` as a line verdict (21 September): under SD-40 a stated value resolves nothing, so that name now belongs to the candidate-check outcome. `FREE(choice)` keeps the four Game statuses unchanged — it is a kind of `FREE`, as `FREE(a)` and `FREE(b)` are* |
| `INVENTED` | stated with no valid support (§4.6) |

**Reason codes, in this order** (AM-23): start procedure, post-score, out-of-play source missing; then
alternatives, outside boundary, engine-only, assumed-only, each only where such an item bears on the
value; then declared gap; then coverage.

**The last two need definitions the order does not supply**, and every derivation so far has used the
same working convention rather than a stated rule: **declared gap** where a `NOT_AUTHORED` declaration
reaches the element — an object said it needs this and cannot author it; **coverage** where only an
`UNDECLARED` row reaches it — nobody looked. The distinction matters because one is knowledge missing
and the other is a contract that never examined the row. *(Convention, not his ruling. Flagged.)*

Existence and value are judged separately. A field of an element whose existence is neither entailed
nor a legitimate choice may still be entailed or not authored, but never a choice or free.

## 3. What can support

| Item | Treatment |
|---|---|
| `EXCLUSION` strictness | never supports; checked only as an exclusion |
| `REQUIRED`, `SUPPORTING` | support alike; strictness matters in the forward list |
| `TYPICAL_EXAMPLE` | inert: no support, bound or collision |
| `PREFERRED_DEFAULT` | supports its value where the game uses it; where the game departs, it is adapted (SD-08), and the line needs other support |
| `ASSUMED` | a bound only; never entails |
| `ENGINE_ONLY`, `OUTSIDE_BOUNDARY` | inert (SD-21). A partly structural item acts only through its written structural clause |
| `OWNER_RULING` | entails only what the ruling states as a requirement |

**Engine wording is never a source** until Christian authors it (SD-21). The six sentences the
conformance check relied on stay unratified, and "beyond the first defenders" is not promoted into
RPC-001 knowledge.

## 4. Support

### 4.1 Matching

An item reaches a line when its row equals the line's row and the element satisfies its selector.

**Selectors are normalised first (AM-12, adopted).** "Selectors must be normalized into the registered
predicate language before derivation. Unregistered prose selectors match nothing and are reported as
restatement defects. No semantic interpretation during derivation." The elements each selector denotes
are recorded before derivation begins.

**Which line an item reaches on a set-valued row.** §1 gives one line per member, and matching above is
written per element. Nothing said how an item's value set maps onto member lines; the collision test
found two competent readings of that silence. The rule, following AM-11: a value set the source marks
"each" binds the member it names, so such an item reaches the line of that member and no other. An
unmarked set is alternatives and reaches every member line as a bound. An item that names a member the
game does not hold is reported unmet against that member (§7), never as a collision on another member's
line.

**Team designations (AM-01, adopted).** "Use the game's transitions/episode context to resolve
contextual team designations. An episode-scoped designation remains episode-scoped." In a selector, a
designation is met by each team the game's stated transitions make it at some trigger; the build-out
team is the team awarded the start placement (KR-03). In a value, designations compare as canonical
entries, and a game value written "(= entry)" counts as that entry.

> **Engineering line, 15 October 2026 (stage K2) — ours, outside his adopted text.** Implemented for his M2 of
> 17 October ("Please implement the previously adopted September 20 designation rule, rather than introducing a
> narrower workaround solely for this activity."). Each register designation now carries a typed resolution
> (register version 9, `teamDesignations.resolutions`: a kind and a scope; `GLOSS` where it restates the entry's gloss,
> `OUR_INTERPRETATION` where the entry has none) and one resolver, `back/src/system/derivation/designation.ts`, answers
> for every consumer: value comparison (GA-DIRECTION's RC-22 equality), the possession-relation test (GA-AFFILIATION),
> registration (GA-REFERENCE-INTEGRITY's relational referent), and which instantiated team a team-naming selector
> reaches (the member classes of `post-realization-gate.ts`, read by `reach.ts`, and the roster). A standing team
> property is reached only through an ACTIVITY- or BLOCK-scoped designation; an EPISODE, DYNAMIC or TRIGGER designation
> never yields one, which keeps "an episode-scoped designation remains episode-scoped" for performer counts. Which
> instantiated team holds a setup assignment (TEAM_AT_AXIS_*) is a governed symmetric choice recorded by realization
> (SD-39), never read from an ordinal. Derivation classes fix no designation (SD-95), so stage 4 is unchanged and
> class-to-class comparison stays the spelled-value comparison it was. The BLOCK scope (a role held for a coach-called
> block, his M1) is our extension of AM-01, registered and not yet used.

> **Engineering line, 15 October 2026 (stage K3) — ours, outside his adopted text.** Implemented for his M1 of 17 October
> ("M1 — Role exchange by block: Approved. Keep role assignments separate from fixed ends. Allow target configurations to
> reflect each team's role during the block. The coach controls the exchange. No new block-duration system is needed.").
> A block-scoped designation is met by the team the role block the game is derived for binds to it: `ROLE_HOLDER_<role>`
> (register version 10, kind BLOCK_ROLE, scope BLOCK) resolves to the setup assignment (TEAM_AT_AXIS_*) the block binds the
> role to, and from there to the team realization recorded for that setup assignment; without a block it is undetermined,
> never guessed. A game whose contributions establish the register's roles (`roleBlocks`) is derived once per block — the
> two bijections of two roles onto two ends are entailed, not chosen — with the block as input (in the input digest, the
> gate context and the realization record, never in the game), and the blocks are then checked against each other
> (RB-1..RB-8). One exception to "derivation classes fix no designation": an objective region carries the derived
> attribute `targetOf` (the team whose primary scoring objective references it), set before reach from the objectives'
> selectors and the reference items that entail them, and only where a selector asks for it.

> **Engineering line, 15 October 2026 (stage K4) — ours, outside his adopted text.** Implemented for his D6 of 17 October
> and his answers of 18 October (RD-1, item 5, item 7). (1) An item carrying `defersTo: AUTHORIZED_REALIZATION` (ruling C56,
> GF2-14.b only) is moved aside before anything reads the composition — kept on its contract as `deferredItems`, listed as
> the alternative — wherever another selected contribution authors the same row per team (a selector naming particular
> teams through a designation-valued attribute) and cites, in `authorizedBy`, a CONFIRMED context-manipulation relationship
> for the context it realizes that authorizes the row (`realization-deferral.ts`). (2) The roster reads an outfield count
> authored per team as a set of counts and closes it from the session total: exactly one allocation must fit
> (CONFIGURATION_DOES_NOT_FIT where none does, with the player counts that would, asked of the rule; ALLOCATION_NOT_SETTLED
> where more than one does; NO_AUTHORIZED_ASYMMETRY where only an unequal one fits and an equality is still in force).
> (3) Participant reassignment is its own capability (register version 11, rows B4-B7): a reassignment element says how
> many performers of the kind a row counts move, at each exchange of roles, to the team newly holding a role; the
> cross-block check RB-M admits a change of a team's counts exactly where one states it, and none where none is recorded —
> the exchange of roles moves nobody.

> **Engineering line, 15 October 2026 (stage K5) — ours, outside his adopted text.** Implemented for his M3, M4 and D5 of 17
> October and his answers of 18 October (items 2 and 4). (1) Stage 2 reads each trigger-semantics entry's
> `structuralPrerequisite` generically (a collection row, its selector attribute, a value): the trigger is reachable where a
> class on that row is fixed to that value. The one entry carrying one is COACH_JUDGED_EPISODE_CONCLUSION, reachable where a
> start element exists. (2) A row's `fillableWhen` restricts its choice space to the elements whose selector fixes an
> attribute to a listed value (T2: START only, the restriction its fillable text always stated); a row's `fillableRequires`
> opens it only where every bounding item has a listed requirement and basis and gives a bound of the listed kind (T4 and
> T5: OWNER_RULING or AUTHORED ranges in words), closed COACH_DECIDES. (3) A game-level row's `entailedBy` takes the entailed
> value and support of a named line on the one element a rule names (PS1 from START's T2, where it is entailed and applies).
> (4) GA-TRANSITION-COHERENCE defers its resume clause where a taker or region is an open choice. (5) Where an episode-scoped
> condition holds a begin-condition referent for that condition's own episode (ruling C58; a referent naming another
> episode types nothing, K5 review), GA-EPISODE-REACHABLE decides which transitions meet it (stop and
> restart, begin an episode, taken by an arm's taker; an arm naming a restart kind is met by none) and passes only where one
> does and every one that does has one awardee. (6) A record-named provisional realization may withdraw another file's
> realization choice by declaration (`withdraws`), recorded and carried into the fixture. AM-15's by-construction transitions
> remain unimplemented for every other game.

> **Engineering line, 15 October 2026 (stage K6) — ours, outside his adopted text.** Implemented for his M7, M5, D3 and D4 of
> 17 October and his starting values of 18 October (item 3). (1) RC-21's canonical "beyond X (for team T)" is machine-readable
> (register version 13, kind `relative`): a value `{term, of, forTeam}` names X by a typed reference and T by a designation that
> holds an end (a setup assignment by its own spelling, or a role holder answering through the role block). On an extent row it
> is a RELATIVE bound beside the element's anchor; as a start placement's region (P10 version 2) it is the part of the area beyond
> X in T's direction. (2) An interval in metres may state its origin as the end line a team defends (S5 version 2). (3) Which end
> a team attacks is read from the game's own objectives: the end its primary objective's target touches (its `longitudinal`
> selector), for the block (`realization/team-ends.ts`); realization places an element relative to another after it, composes
> the widest extent "at or past" admits where no metric extent is required, and leaves unplaced (never defaulted) an element
> whose referent or team end is not established. (4) GA-RELATIVE-PLACEMENT, the nineteenth check: every relative position names a
> held element and a team that holds an end (FAIL otherwise), and holds of the realized geometry (DEFERRED before realization,
> owed, then checked by RC-21's own test). (5) GA-DIRECTION's separation clause: the opposed objectives' targets do not overlap
> along the axis (a shared boundary is an overlap), deferred where the opposite-ends clause is and read from the same intervals.
> The register's "does not contain the midpoint" (S2.longitudinalValues) is narrowed in the same version. (6) Start placements
> carry a timing (P10a: INITIAL or CONDITIONAL_RESET, bound to EM-0002 EMP-0013) and, re-established, the episode at whose every
> beginning they are (P10b): GA-EPISODE-REACHABLE's third clause requires a transition the typed begin condition picks out, so an
> ordinary restart or a change of possession never re-establishes one. (7) The post-realization context substitutes realized
> metres only on position rows. (8) A record-named realization listing the areas its metric values were given for
> (`testingBoundaries.areas`) is built only for those areas; any other area is refused at `session` (DRAFT sentence).
> (9) Added in the K6 review, 16 October 2026: GA-RELATIVE-PLACEMENT's third clause - no start placement's region shares a
> stretch of the axis with the target its own group's team attacks (touching at one boundary is not sharing; deferred until both
> are realized). The design asked for it and K6 had not built it: a pressing start around its own target, or a building start
> inside its own target, passed every gate (measured on TEST-ONLY copies at 723eee2).

> **Engineering line, 17 October 2026 (stage M1) — ours, outside his adopted text.** Implemented for his reply filed 19 October
> 2026, item 1 ("Please ensure the underlying scoring eligibility reflects this distinction, rather than relying solely on the
> coach-facing wording.") and item 3 C. (1) Register version 14, row B8 (`activityRoles[].creditedWithin`): the scope within which a
> role's holder earns the primary event's credit, WHOLE_GAME or an episode scope. (2) `designation.ts` `awardeeRelation` says whether
> a transition is awarded to a role's holder (HOLDER), away from it (OTHER) or cannot be said (UNDETERMINED), reading only register
> data: RC-22's comparison, the bijective role holders and setup assignments, and a resolution's `relativeTo` relation to a qualifier,
> which must quote him (NOT_LAST_TOUCH: his 18 October item 2, "taken by the team that did not touch it last"); OTHER through a
> qualifier only in a game holding exactly two teams, counted once per establishing item. AM-01 is the adopted rule this answers
> under. (3) GA-EPISODE-REACHABLE's fourth clause: every transition the typed begin condition picks out for a bounded role's episode
> is awarded to its holder; its fifth: every transition able to take possession from the holder begins an episode (a change of
> possession T7 true, NOT_EVALUABLE where the game holds none; a stop-and-restart beginning none must be awarded to the holder).
> Both appended after the existing three clauses, vacuous where no role is bounded, so the context-scoring guard still reads the
> reach clause first. (4) A bound other than WHOLE_GAME is said to the coach only in approved words (`WORDED_ONLY`, `unlessEquals`).

> **Engineering line, 17 October 2026 (stage M2) — ours, outside his adopted text.** Implemented for his reply filed 19 October
> 2026, item 2 ("For the previously flagged corner case, I favor allowing a controlled regain inside that area to count as a score,
> provided the pressing team genuinely establishes possession." "A contested touch, deflection, or loose ball should not qualify.")
> and his 17 October D3 ("Please verify that the two targets can coexist without overlapping or contradictory scoring conditions.").
> (1) GA-ONE-PRIMARY-EVENT gains eight clauses (seven at M2, the eighth added in its review), appended and only where the game holds an element of row V27
> (`value.primaryEvent.alsoCounts[]`), so every other game reads exactly as before: the element is for exactly one team for the
> block (a setup assignment or a role holder; a role holder read with no block is owed); its trigger is a member of V29's closed
> list, keyed by a transition in which play continues, and the game holds the SCORE transition; it lies inside the one positioned
> target its own team attacks (the register's targetOf); its control is stated; at most one element per team; its trigger's
> transition begins an episode and none an episode-scoped condition of the primary event is authored for; and no condition of the
> primary event is authored for every score beside it; and (stage M2 review) its team holds no role whose scoring credit is confined to an episode (row B8) its trigger does not begin, so the building role's credit can never be restored by this element. (2) RB-1 compares V27's elements across the blocks. (3) The context-scoring
> guard requires every item that establishes or fills such an element to be an OWNER_RULING item, since the context's own scoring
> events need not approve the further way to score (`alsoCountsFindings`). (4) Its four fields are said to the coach only in
> approved words (`WORDED_ONLY`), so A01 is refused at communication naming them until he approves a sentence.

> **Engineering line, 17 October 2026 (stage M3) — ours, outside his adopted text; rendering and review, no derivation change.**
> For his reply filed 19 October 2026, item 1 ("Approved with revised wording"; "Please ensure the underlying scoring eligibility
> reflects this distinction, rather than relying solely on the coach-facing wording."), item 4 and item 6. (1) An approved entry
> may name the element each cover holds on (`ElementLocator` {base, field, equals}); each locator must pick out exactly one
> element, a located scoped condition needs its exact V3 cover, and the sentence is said ONCE citing every covered field; covers
> compare as canonical JSON. (2) Fidelity's role rule passes over an approved sentence only where the role it names is a string
> value of a field it cites (a RELAXATION quoting item 1). (3) Where a role element's B8 is not the whole game, the renderer says
> no team-neutral "A team scores ...": a whole-game role gets its own DRAFT sentence citing its bound, the value is said alone, and
> the bounded role only in approved words; fidelity Q2 refuses any unapproved sentence citing the event's kind and no role, and
> any unapproved sentence speaking for a bounded role. (4) The review evidence shows each role's credit, what begins, ends and
> keeps it (`awardeeRelation`) beside GA-EPISODE-REACHABLE's own verdict on its two credit clauses, the V27 element per block,
> transition columns beginsCredit/endsCredit, flag status SETTLED_BY_RULING only where his recorded ruling (`settledBy`) and the
> element in every block meet, and the limitations of his item 5 (`reviewRequest.limitations`). (5) Added in the M3 review: Q2
> reads what a sentence says as well as what it cites. A sentence citing the event's kind, or its value with anything else, is a
> scoring sentence; it is team-neutral where it cites no role or its text names no role's noun (the nouns are fixture data); and
> it speaks for a bounded role its text names. Measured: the old "A team scores ..." citing the whole-game role's bound, and
> "Building team: Score ..." citing that bound, had both passed as drafts.

> **Engineering line, 15 October 2026 (stage K7) — ours, outside his adopted text.** Communication of the first complete activity.
> (1) The context-scoring guard confirms a context condition authored for an episode (SD-36; his 16 October 9.3, ruling C52) where it
> reached the realized game with its authored scope AND the Gate A check deciding that episode (GA-EPISODE-REACHABLE, rerun on the
> concrete game) passes as a whole and non-vacuously; any weaker verdict, another scope, or no check confirms nothing, and no reader
> that applies a condition to every score is changed. The K6 review named this as what moved A01's validation stop, with no decision
> of his behind it; K7 built it because its communication could not otherwise be measured on production. (2) A scoped condition may be
> said only by an approved coach sentence covering its exact scope (design step B2): the renderer passes over every other entry for
> it, and fidelity admits a sentence citing it only where that sentence IS approved wording for the game and cites the scope — a
> citation alone never satisfies it. (3) Fidelity Q4 holds an obligation/ordering lexicon to every non-approved sentence part, with a
> pinned allowlist of templates whose word restates the cited element's own value (one: a value modifier's termination); and,
> regardless of approval, refuses a sentence naming a specialized role (read from the session's data) with such a word. (4) An episode
> boundary on a transition that restarts play is discharged only by a sentence citing its play state and its awardee. (5) Where a
> game holds positions written for a role holder, fidelity Q6 requires a role-exchange sentence citing them (his D2, "target
> configurations change"). (6) A refusal at communication carries, for the checked review's administrator only, the rendering made
> before the refusal, the withheld fields and the fidelity verdict (`rendering/review-draft.ts`); the coach's review answer, the pilot
> and the live route never carry it. The cross-block checks of a game in role blocks run before a refusal at communication, since
> they are validation.

**Every structural reference normalises, not only selectors (SD-32, ruled).** In his words:

> "Any structural reference participating in derivation must resolve through the registered
> identity/reference system before derivation. If it cannot normalize, report the reference/restatement
> defect. Do not silently use prose matching and do not infer the intended element."

This reaches the references items carry in their **values** — "both wide channels of this contract", a
region on a start placement, a modifier's referent list — which AM-12 did not cover, so a prose
reference used to miss verbatim and silently. Now:
1. Every structural reference, in a selector or a value, resolves to registered element identity before
   derivation begins.
2. One that will not resolve is a **reference defect**, reported against the contract that wrote it.
3. **Nothing is matched by meaning**, and no intended element is inferred. A defect is the outcome, not
   a best guess.

### 4.2 Comparison and relation

| Requirement | Passes when | Relation |
|---|---|---|
| `EQUALS` | equal | entails |
| `EXISTS` | present — on a field row, only that the field is present | entails, subject to §4.3 |
| `RANGE`, `COUNT` | inside, at the item's scope | narrows cardinality only (§4.3) |
| `POSITIONED` | the interval satisfies it, by the register's relative terms | narrows |
| `ORIENTED` | the orientation satisfies it | narrows |
| `NOT_EXISTS` | absent | excludes: never supports |
| `COMPARES` | the comparison holds between its two operands | **takes no line** (SD-26): evaluated over its operands, never a bound on a property. **Never an exclusion:** a comparative is a relationship, not a prohibition [C20] |

An item that entails an element also entails each attribute its selector fixes with `=` or `∋`; an
attribute given with `∈` is only narrowed.

### 4.3 Cardinality and identity (AM-05, as ruled)

Christian: **"A minimum count entails cardinality, not identity."** "Minimum = 1 cannot entail the first
matching element, but it also cannot entail every matching element merely because two exist. The game
must satisfy the cardinality constraint; the identities of the elements satisfying it must receive
support independently or be selected through an already-authorized free choice." No ordering, and no
all-elements entitlement.

**The rule:**
1. **Cardinality is checked forward, never as a line.** For each existence-type item (`EXISTS`, `COUNT`,
   `RANGE`) the number of elements matching its selector, at its scope, is compared with its bound. The
   result is the item's forward result (§7).
2. **An element's existence is entailed only where it is necessary to the cardinality.** When the number
   of matching elements does not exceed the item's minimum, every matching element is necessary, and
   each is entailed by that item. When more elements match than the minimum, no individual element is
   entailed by it: each needs its own support — an item whose selector reaches that element and no
   other matching element of the surplus — or an authorised free choice under §5, within the bound.
3. **Surplus with neither** is unsupported: `INVENTED`, or `NOT_AUTHORED` where a declaration reaches it
   (§4.6).

This is neither of the readings he rejected. It introduces no ordering, and it does not turn a minimum
into an entitlement for every matching element.

**FLAGGED, as he asked.** The grammar can hold his rule, but only because cardinality is checked as an
item result rather than as a property. There is no row, and no line, that holds "this collection
contains N elements matching P". Two consequences:
- A game cannot state a cardinality as a fact, so a cardinality cannot itself be supported, adapted or
  reported as invented. It is only ever an item's pass or fail.
- The audit therefore shows which elements are unsupported, but never "the count itself is unsupported".

If he wants cardinality to be a first-class property, that is a schema change — a cardinality line per
(collection, selector) — and it needs his ruling before anyone builds it. I am not making it.

### 4.4 Comparative claims (AM-16 as extended, adopted 20 September)

Christian: **"A contract may author a comparative claim between represented game properties."** The
examples he gave: value(A) > value(B), count(A) = count(B), width(A) > width(B).

**All of his 20 September rulings are incorporated below.** Where an earlier draft of this section held
a rule of mine, his ruling replaces it and the replacement is marked.

**Form.** A `COMPARES` item names a left operand, an operator from `=`, `≠`, `<`, `≤`, `>`, `≥`, and a
right operand.

**What may be an operand (SD-23, his ruling).** Either:
- **a represented game property** — a register row plus a selector; or
- **a deterministically derived quantity whose inputs are supported represented game properties.**

Two limits come with it, in his words:
- **"Do not add region value as a stored Game Representation row merely to support this case."** The
  derived quantity is computed for the comparison; it is not stored, and it is not a ninth thing the
  game holds.
- **"A derived quantity may compute relationships among represented environmental properties. It may
  not derive learner/ecological states such as pressure, opportunity, affordance availability,
  difficulty or uncertainty."**

**Its inputs must be supported, not merely stated.** A derived quantity computed from a property the
game states but nothing supports is not computable. This is what his word *supported* does, and it
bites: before he adopted SD-25, the primary event's base value rested only on engine wording, so no
region's effective value could be computed at all.

**Aggregates.** A comparison may range over selector-matched elements, but **no aggregate function is
named** (each, some, the sum, the greatest). Where a selector matches several elements whose values
differ, the rules do not say what the operand is. Still open; it did not bite in the worked case only
because both matching regions carry the same modifier.

**Relation.** It narrows. **It never entails a value, and it never entails existence.** A comparison
constrains a relationship between properties that other items or the session must establish. It is
**never written with exclusion strictness**: a comparative is a relationship, not a prohibition.

**Where a comparison lands (SD-26, his ruling — this replaces my rule).** I had a comparison reduce to a
bound and reach one operand's property line. He ruled against that:

> "Do not force a comparative relationship onto one operand's ordinary property line. The comparison is
> a relationship assertion evaluated over its operands. It may remain outside the eight stored Game
> Representation areas as part of contribution/reconciliation evaluation."

So:
1. A comparison is **evaluated over its operands**, in the contribution and reconciliation record. It
   is not a line, it does not take a property's verdict, and it changes no line's status.
2. **If its operands cannot be resolved or computed, the comparison is not evaluable or unmet,
   according to its requirement status** — required items unmet, supporting items not evaluable.
3. **If two authoritative, well-formed comparative requirements are mutually incompatible, report an
   unresolved relationship conflict** (§6.1). That is a report of its own kind, not a line status.
4. **No ninth Game Representation area is authorized**, and none is added.

*Why this is better than my rule: a relationship is not a property, and forcing it onto a property's
line made an unauthored magnitude read as "two objects disagree" when nobody had authored it at all.
His §6 ordering — gap before collision — falls out of this naturally.*

**The boundary.** Both operands must be properties the resolved game contains and can evaluate.
Christian: not "inferred player states or ecological outcomes such as pressure, opportunity, affordance
availability, difficulty, uncertainty". The test he gave: **"whether the comparison is between
properties the resolved game actually contains and can evaluate."** An item comparing anything else is
recorded outside the boundary, not forced onto a row.

**Evaluability.** A comparison is evaluable only when both operands resolve — to a value the game holds
and supports, or to a derived quantity whose inputs the game holds and supports. Otherwise it is
reported unmet or not evaluable by its requirement status, per his ruling above. It is never quietly
satisfied.

**Effective value (SD-24, his provisional definition).** In his words:

> "primary-event base value after application of all applicable resolved value modifiers for the
> referent."

With the two conditions he attached:
- **"A value modifier must explicitly declare its operation/type. Do not infer multiplier versus
  increment."** The register gains one field for this (`V9a`, the modifier's operation), and `V9`
  remains its magnitude. This is the only addition his rulings make to the representation, and it is a
  new field on an existing collection — LOCAL by the grammar sheet's own test.
- **"If an operation or magnitude required for the derivation is unauthored, effective value is not
  computable."**

**What that does to the worked case.** The wide modifier's magnitude is unstated and its operation was
never declared, so effective value is **not computable** on either side; the comparison is not
evaluable; and under §6 the line is a **gap**, not a collision. His rulings resolve the rerun's crux in
the opposite direction from my rule, and they are right: nobody authored that magnitude.

**A consequence of adding `V9a` that has to be carried through.** §1 requires that a property the game
needs but leaves unstated is listed with its verdict. So **every value modifier now gains a `V9a`
line**, and in the slice game that line is `NOT_AUTHORED` — no object declares an operation anywhere.
Without it, "effective value is not computable" would be true for a reason the audit records nowhere.
Games resolved before 20 September are short one line per modifier, and their audits do not mean what
they say until they are re-derived against the current register.

**A comparative is not an exclusion.** Christian: "I do not want Wide Zone's comparative meaning
translated into mutual exclusions. 'Wide has greater task value than central' is a relationship, not
equivalent to 'central value is forbidden.'" A contract states the relationship; the reconciler does not
convert it into a prohibition, and a checker does not read it as one.

**The principle behind the boundary**, in his words: preserve the distinction between *changing the
relative value or availability of possibilities in the environment* and *prescribing the learner's
solution*. "The representation may deterministically specify the former; it should not infer or encode
the latter."

### 4.5 Selecting an existing element (AM-17, adopted)

A region's **lateral position** is a registered selector attribute, so a contract can select regions
from whole-game scope instead of relying on its own involvement. A value modifier's **referents** are
likewise selectable, so one contract's region modifier can be addressed apart from another's.

**Selection does not entail existence** (AM-13 preserved). Christian: "AM-17 may identify an
already-supported region; it must not create a wide region merely because a contract selects for one."
So a lateral selector identifies; existence still comes only from an existence-type item on the
collection row, judged by §4.3's necessity rule.

**His governing principle, restated 20 September:** *"selection may identify supported existing
structure; it does not entail that structure's existence."* The word **supported** is doing work: a
selector reaches an element the game holds, and whether that element is itself supported is a separate
question with its own verdict. Selecting an unsupported element neither supports it nor is barred by
its being unsupported — the selector simply inherits the weakness, and any derived quantity computed
from it is **not computable** under SD-23.

### 4.6 A stated value with no support (AM-03, adopted)

In order:
1. **Invented** if an entailing source fixes a different, incompatible value.
2. Otherwise **not authored** if a not-authored or undeclared declaration reaches that element, or an
   assumed item fixes the value under such a declaration.
3. Otherwise **invented**.

Engine-only evidence names a reason code, never the verdict. Christian: "I view this as failure
classification after support derivation, not a change to what support means."

### 4.7 A value the game leaves unstated (AM-08, adopted)

"The support result records the entailed value; separately report that the provisional game omitted
it." The line is entailed; the omission is a forward note.

### 4.8 Standing decisions

Only the citable ids in the register, as typed there. A standing decision's condition is met only by a
value whose own verdict is entailed or a legitimate choice. A default yields only to an item that
constrains the value (AM-09, adopted): "Only items that constrain the value compete with a standing
default or free choice. Existence alone doesn't."

## 5. Free choice

**The authority is SD-39** (21 September), which supersedes P-4. In his words: *"Where the
representation requires a value in order to produce a playable game, selected authoritative knowledge
neither determines nor further constrains that value, and no standing rule determines it, the value may
remain OPEN for downstream governed choice within its supported bounds."* And the qualification that
governs everything below: **"OPEN is an explicitly authorized degree of freedom within an
already-supported property, not a synonym for unknown."** Silence creates no property, relationship,
trigger, qualifier, consequence, modifier, information rule, region, object or other structure.

**What the engine does with a choice, in each mode (SD-40).**
- **Derivation mode** — the property is `OPEN`, with its bounds, its authority and its constraints, and
  **no value**. The conditions below decide whether it may be open at all.
- **Checking mode** — a candidate's value for an open property is checked against those bounds. **It
  does not make the property derived, and it supplies no support**: its provenance stays downstream
  governed choice (the `REALIZATION` source kind), never knowledge entailment. The verdict
  `RESOLVED:NARROWED_CHOICE` therefore names **the outcome of that check** — a candidate value inside
  the authorized bounds — and not a resolution of the line. *(Reconciliation of the §2 verdict with
  SD-40, 21 September. The verdict's meaning is unchanged; where it is recorded moves, because SD-40
  forbids a candidate value from resolving anything.)*

A property may be open, and a candidate value within it is a legitimate choice, only when all hold:
1. the row has a structurally defined choice space — a `fillable` entry, now register data under SD-39
   rather than authority — and the value is of the kind that entry names;
2. the element's existence is entailed or is itself a legitimate choice;
3. the value is inside every in-scope bound;
4. no declaration reaching the element bars it.

**Positions (AM-10, adopted).** "A position may be freely filled within all applicable bounds, authored
or assumed, because its existence is already entailed. Keep the authored-range requirement for freely
chosen counts."

**Undeclared elements bar a choice (AM-04, ruled (b)).** Christian: "Unexamined silence cannot license
a free choice. If no selector-scoped declaration reaches an element, treat that element as undeclared:
it bars free choice, and an unsupported stated value is not authored." He rejected silence-as-permission
"contrary to the non-claim rule", and rejected full element coverage because "it would make contract
authoring dependent on every eventual game instance".

**Alternatives (AM-11, adopted).** "Explicit each means one requirement per member. Otherwise a set
represents alternatives. A game using/restating multiple alternatives has not thereby selected one." On
a fillable row a chosen member is a legitimate choice; on a non-fillable row the line is not authored,
reason alternatives. An authored order is recorded, not applied.

## 6. Scope and collisions

| Scope | Elements in it |
|---|---|
| Per objective set | the set's member objectives and every element they reference (AM-02, adopted) |
| Per team | by the team designation, resolved as in §4.1 |
| Own involvement | the elements entailed by the contract's other-scoped items, fixed before any own-involvement item applies; an item may not use it to reach what it entails itself (AM-13, adopted) |

**Declarations survive an empty own-involvement scope (SD-31, ruled).** In his words:

> "Declarations do not disappear when own-involvement resolves empty. An empty resolved scope empties
> the item's application set, not the contract's declaration. Preserve the declaration so the result
> reports the authored gap rather than converting it into `invented`."

And his reason, which generalises: **"authored intention that could not reach an element ≠ structure
nobody authorized."**

So the scope is two things, not one: it fixes the **application set** of the contract's items, and it
does not limit what the contract has **said about its own knowledge**.

**How much this moves, counted rather than replayed.** Across the eight contracts, 31 items and 29
declarations sit at own-involvement scope. Of those declarations, **seven are `NOT_AUTHORED` and one is
`UNDECLARED`** — the eight that can reach §4.6(2) and change a failure class — on rows S2, S6, J6, J10,
V18, V19 and V22. The other 21 are `CLAIMED`, `EXCLUDED` or `NON_CLAIMED` and change no verdict. Only
where a contract's own-involvement scope resolves empty does any of this bite; Wide Zone's S2
declaration is the case the rederivation demonstrated, and its two channel lines move from `INVENTED`
to a declared gap, which is what its contract actually says. **No broader replay was run**, per his
instruction, and under SD-30 no earlier result is validated by these rules anyway.
| Whole game | everything |

Scope spreads a bound across units; it does not create them.

**Support-capable**, for collisions, means an item that constrains the value: one that entails it or
bounds it, including an assumed item. Inert items never collide — engine-only, outside the boundary,
and typical examples. Comparatives are no longer in this list: under SD-26 they are evaluated over their
operands and never take a line.

**A collision** is two in-scope, support-capable items on one line that no single value satisfies.
Overlapping bounds intersect and do not collide. Only an authored relationship rule, or SD-06, SD-07 or
SD-08, decides one; otherwise the line is unresolved (SD-02). A displaced preferred default is adapted,
not a collision.

**Gap before collision (SD-28, his ruling).** In his words, a collision "requires well-formed,
support-capable authoritative claims with sufficiently resolved operands/properties". Therefore:

| What is true of the line | What is reported |
|---|---|
| A dependency it needs is unauthored or not computable | **a gap** — and only a gap |
| Contradictory authoritative claims, both evaluable | **an unresolved collision** |

An unauthored or incomputable dependency is a gap **first**, and nothing downstream converts it into a
disagreement. This replaces the precedence problem I flagged after the rerun: `UNRESOLVED` no longer
outranks a gap, because on an unresolved dependency there is nothing to collide.

**An assumed item cannot manufacture a collision (SD-27, his ruling).** In his words:

> "An assumed item may not create an authoritative collision with authored knowledge. If Wide Zone does
> not actually author `wide > central`, we do not promote that interpretation merely because it appears
> consistent with the object's prose meaning. Assumed-vs-authored may be reported diagnostically as a
> possible tension, but it cannot drive UNRESOLVED. If comparative value is truly part of Wide Zone's
> intended canonical meaning, we can author that explicitly later."

So an assumed item still bounds, still reports, and still appears in the audit — as a **possible
tension**, a diagnostic record that no gate reads. Two assumed items, or an assumed against an authored
one, never produce an unresolved verdict.

**This closes the fabricated-comparative problem**, as he intended. A comparative that is invented or
assumed cannot drive any line unresolved, so no single fabricated sentence can stop a game.

### 6.1 Unresolved relationship conflict

A report of its own kind, created by SD-26. It holds: the two comparative requirements, their operands
as resolved, why no single assignment satisfies both, and the objects that authored them.

It is raised **only** when every one of these holds:
1. both requirements are **authoritative** — authored or owner-ruled, never assumed, never engine-only;
2. both are **well-formed** under SD-23's operand rule;
3. both are **evaluable** — every operand, or every input to a derived operand, resolves and is
   supported;
4. no single assignment of the operands satisfies both.

Fail any of 1 to 3 and it is not a conflict: it is a gap, a diagnostic tension, or an unmet item,
whichever applies. **It is not a line status, it is not one of the four Game statuses, and it adds no
area.** The game's eight areas hold what they held before.

## 7. Forward results (AM-06, as revised)

Christian: a required item with an absent value is unmet; an exclusion whose prohibited value is absent
is satisfied. But **"a supporting/preferred item whose value is absent should not be called 'satisfied
vacuously.' Nothing was realized."** He asked for the result that denotes a permissible preference that
did not survive, "rather than satisfied", to keep Realization ≠ Mention in both directions.

| Case | Result |
|---|---|
| Stated value meets the item | satisfied |
| Stated value breaks the item | violated |
| Required item, value absent or no matching element | unmet |
| Exclusion, prohibited value absent | satisfied |
| Preferred default, value absent or displaced | **adapted** |
| Typical example, or engine-only | **inert** |
| Outside the boundary | not checkable |
| Partly structural | clause checked, with the clause's result |
| Assumed item | checked as a bound |
| Existence-type item | its cardinality check (§4.3) |
| Comparative, **required**, whose operands do not resolve or compute | **unmet** (SD-26) |
| Comparative, **supporting**, whose operands do not resolve or compute | **not evaluable** (SD-26) — never quietly satisfied |

**Which of the last two applies is decided by requirement status**, in his words: "If its operands
cannot be resolved/computed, the comparison is not evaluable/unmet according to its requirement
status." That replaces the ordering rule I had written after the rerun, which made *not evaluable* win
outright. His version keeps a required claim's failure visible as a failure.

**`VALID_ABSENCE` — approved 20 September**, *"as a line outcome, not a Game status. Keep the four
Game statuses unchanged."* An absence §8 records as valid takes it, recorded on the line and never as a
support record. It is decidable only in checking mode, where absence is a fact about a candidate.

**`NOT_REALIZED` — approved 20 September** for its proposed case: *"Supporting item + absent value —
`not realized`: APPROVE."* A **supporting** item — not a preferred default, not a typical example —
whose value the game leaves absent takes `NOT_REALIZED`: not satisfied (nothing was realised), not
adapted (nothing displaced it), not inert (it is real authored knowledge). An item result, not a
property status, and no change to support.

**One adjacent case his approval does not reach, and the engine refuses rather than stretching it.** A
**supporting existence** item whose cardinality check fails — Wide Zone's `COUNT 2` on channels, met by
zero elements. It is not required, so not *unmet*; not a preferred default, so not *adapted*; not a
typical example, so not *inert*; and it is not "an absent value", which is what he approved
`NOT_REALIZED` for. **Until he says `NOT_REALIZED` covers it**, the item result is `UNLABELLED` and one
`LABEL_NOT_RULED` refusal names every item in that position. This does not block design: the engine
refuses instead of guessing, and the refusal makes the size of the unruled case visible.

## 8. Closed-world absence (AM-07, as qualified)

Views get no line. For an empty collection or a stated absence, Christian qualified: **"use closed-world
semantics: absence is valid where the schema establishes that no supported contribution entails an
element there. Don't manufacture positive support for absence merely from silence."**

So an absence is recorded as **valid** when no support-capable item entails an element on that row at
that scope, and as **unmet** against each item that does. It is never entailed by silence, and an
absence is never a positive support record.

**The mismatch I flagged here is closed by his rulings**, not by ordering. §6 made an item
support-capable when it *entails or bounds*, while this section keys a valid absence on **entailment
alone** — so an absent value that two contradictory comparatives bounded read as a *valid* absence on
this section's own words. Under SD-26 a comparative never takes a line at all, so it cannot bound an
absence, and under SD-28 an unauthored dependency is a gap before anything else. The two tests no
longer meet on one line. Nothing about entailment here changes.

## 9. Transitions

- **Reachable triggers exist by construction,** and so does every element partitioning a reachable
  trigger by qualifier values (AM-15, adopted). The qualifier values themselves still need support.
  **"Reachable" means structurally reachable (SD-44, 22 September):** the representation contains the
  resolved structural prerequisites for the trigger to occur — asserting nothing about whether it will
  occur, and never depending on simulation, pressure, skill, likelihood or intention. It is derived,
  never stored. The prerequisites per trigger are in the engine package §2.4.
- **Continuing play keys on the game's stated play state** (AM-14, adopted). Christian: "If that state
  is itself unsupported or contradicted, Gate B should expose that independently rather than making the
  downstream structure disappear from evaluation." So the restart fields are still judged, and the
  unsupported play state is reported in its own right.
- Where no selected object authors a start or restart: turnovers play on (SD-20); which team starts is
  a free choice (the substance of the SD-R2 rejection; authority SD-39); a post-score procedure is necessary but has no universal default (SD-R3); an
  out-of-play restart is not authored, its source visibly missing (PSD-03).

## 10. Known interactions, found by applying these rules

Applying the adopted rules to the slice moved 34 of 210 lines. Three interactions matter more than the
count.

- **AM-13 needs AM-17.** Every one of Wide Zone Advantage's region items is scoped to its own
  involvement, and no item of its at another scope entails a region. Under AM-13 that scope is empty, so
  the contract can no longer reach its own wide channels: ten lines fall to invented or unauthored, and
  nine of its items go unmet. Christian adopted AM-17 on 20 September.

  **Re-derived 20 September, on his instruction, and the claim was wrong twice over.** I first said
  AM-17 rescues those lines. After the rerun I said the rescue failed because the lateral values had no
  interval tests, and was "computable in principle" once they were written. Two independent derivations
  of the eight affected lines now agree: **the tests are complete and correct, and no verdict moves.**
  The register was never the obstacle.

  **Why the rescue does not happen.** Not one item in any of the eight contracts carries a lateral
  selector — the word appears only in fit notes — and every one of Wide Zone's region items is at
  own-involvement scope. §4.5 says a contract **can** select regions from whole-game scope; that is a
  capability offered to a contract author. Derivation never rewrites an authored selector or scope on an
  author's behalf, and AM-12 forbids supplying one by interpretation. **So AM-17 is usable and unused,
  and the remedy is authoring — restating the contract — not derivation.**

  **What the completed tests did fix:** all five values now have tests; the over-match is cured, so the
  full-width regions (the area and both halves) are no longer matched as wide or central; and the
  orientation terms are renamed lengthwise and crosswise so they no longer collide with the lateral
  attribute.
- **AM-05 overrides AM-01's worked example.** I told him AM-01 would make the attacking team of Team A's
  north zone entailed. Under his AM-05 ruling it does not: the selector now matches two objectives
  against a minimum of one, so the item entails neither. AM-01 still changes that item's forward result
  from unmet to satisfied. The example I gave was right about the matching and wrong about the verdict.
- **AM-05 bites hardest on objectives.** Four primary scoring objectives match a minimum of one, so none
  is individually entailed; the four target zones' existence moves from entailed to unauthored. This is
  his rule working as intended: the game must satisfy the cardinality, and identity needs its own
  support.

## 11. What is not decided here

**Closed by his rulings of 20 September**, and recorded here so nobody reopens them: what may be an
operand (SD-23); effective value and the modifier's declared operation (SD-24); the base value of a
qualifying primary scoring event (SD-25); where a comparison lands (SD-26); whether an assumed item can
collide (SD-27 — it cannot); gap before collision (SD-28); and the classification of the whole
extension (SD-29). The six sentences are ruled (KR-05). The §6/§8 mismatch and the fabricated-comparative
problem both fall away under SD-26 to SD-28.

**Closed by his rulings authorizing design** (20 September, [C20c]): the value modifier's operation
approved as a local addition with `multiply / add / replace` as the vocabulary *currently* supported
(SD-30); declarations survive an empty own-involvement scope (SD-31); every structural reference
normalises, not only selectors (SD-32); the engine is report-only and the recovery policy is explicitly
**not** to be designed now (SD-33); comparative cardinality stays unsupported until a real case needs it
(SD-34); and SD-10 gains a machine test (SD-10a). AM-17's disposition: derivation does not repair Wide
Zone; restating its contract is a future **knowledge-authoring** task.

**One standing consequence of SD-30 that outlives this document:** *"No historical activity should be
treated as retrospectively validated under this newer specification merely because it passed an earlier
audit."* Every result produced before 20 September — the slice, the replays, the conformance check —
describes what an older rule set said. None of it certifies an activity under these rules.

**Still open, and none of it blocks the engine's design:**
- Whether cardinality becomes a first-class property (§4.3). He ruled no schema change yet.
- Whether `NOT_REALIZED` — approved 20 September for a supporting item with an absent value — also
  covers a supporting existence item whose cardinality check fails. Until he says so, that case is
  `UNLABELLED` with a `LABEL_NOT_RULED` refusal (§7).
- The closed vocabularies' contents (SD-18).
- **No aggregate function is named** for a comparison that ranges over several matched elements (§4.4).
  This is the one genuine hole left in the comparative grammar. It does not bite in anything derived so
  far, and an engine can refuse an aggregate comparison until he names the function — but an engine
  cannot invent one.
- AM-18 to AM-24 and AM-26 remain local operational amendments "unless one proves to require a
  structural-semantic change during design". AM-16 and AM-17 no longer sit here: SD-29 classifies them.
