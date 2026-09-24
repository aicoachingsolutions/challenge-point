# Game Representation Specification — revision 14, with Christian's ownership decisions

> **Revision 14 (24 September)** adds SD-62 to SD-66 and closes the implementation phase. A blocked gate
> clause carries its own structured record and is **not** a derivation gap — the two describe different
> failures of knowledge. The structural-identity rule is generalized: open-text equality never
> establishes identity, and where identity cannot be established the verdict is withheld rather than
> inferred. The ten implemented stages are the current checkpoint. **Corpus repair begins, upstream to
> downstream**, with encoding repair permitted and restatement or new authoring returned for ruling.
> Activity generation remains frozen.
>
> **Revision 13 (23 September)** adds SD-57 to SD-61, ruling on the modifier-overlap evidence. No event
> identity system is created and open text never establishes identity; an undecidable relationship is a
> **gap, never a collision**; no alternatives mechanism is added; object-condition semantics are not
> specified without evidence. **Modifier overlap is no longer a current implementation blocker** — it is
> underspecified for future reachable authoritative cases, and nothing currently admitted requires it.
> The derivation-engine implementation increment is considered complete. Activity generation remains
> frozen, and corpus repair is not begun.
>
> **Revision 12 (23 September)** adds SD-49 to SD-56, ruling on what the implementation surfaced.
> Every SD-48 stop the engine was carrying is now settled: reach against a class is three-valued and the
> indeterminate case derives nothing; an unsupported choice space is a GAP; member lines are materialized
> only from authoritatively resolved membership. Gate reporting becomes atomic — one executable clause,
> one verdict — and a passing clause must state whether it evaluated any applicable instance.
> `GA-MODIFIER-OVERLAP` remains unruled, with the real corpus evidence now gathered for it.
> **Final assembly and stamping are authorized.** Activity generation remains frozen.
>
> **Revision 11 (22 September)** adds SD-45 to SD-48 and closes the design phase: residual space is
> removed as a Gate A requirement, a supporting contribution whose realization conditions fail is NOT
> REALIZED, existence requirements establish classes and never individual identity, and the
> implementation rule — stop and report rather than completing behaviour from developer judgment.
> **Derivation-engine implementation is authorized.** Activity generation remains frozen.
>
> **Revision 10 (22 September)** adds SD-43 (what Gate A may certify: structurally decidable claims
> only, with an explicit not-checkable result for information outside the representation and a
> blocking specification gap for information inside it but undefined) and SD-44 (structurally
> reachable, the operational definition of AM-15). Implementation is authorized once a final
> independent check returns clean on its four questions.
>
> **Revision 9 (21 September)** adds SD-39 to SD-42: the authority for OPEN (superseding P-4 and the
> rejected SD-R2), the two engine modes with the candidate game as evidence and never authority, the
> classification of comparatives as presently unexercised, and what a restricted computation may do.
> With these he sees *"no remaining architectural blocker to completing the implementation-ready
> derivation-engine specification."*
>
> **Revision 8 (20 September)** approves the engine-design direction and adds SD-35 to SD-38: the
> derivation boundary on variation, BUILD_OUT_EPISODE as the sixth scope, "derivation diagnoses; it
> does not design", and how the unrepresentable cases are held without being solved.
>
> **Revision 7 (20 September)** authorizes derivation-engine **design** and adds SD-30 to SD-34 and
> SD-10a. **Design may begin; implementation stays frozen until he reviews the proposed design.**
>
> **The architecture, in his words, and this is the form to use from here:** *"The eight-area Game
> Representation remains stable; one existing collection gained a required property necessary to make
> its authored meaning computable. The contribution/derivation grammar has also received the previously
> identified bounded structural-semantic extension."*
>
> He also ruled, and it governs every earlier result: **"No historical activity should be treated as
> retrospectively validated under this newer specification merely because it passed an earlier audit."**
>
> **Revision 6 (20 September)** closes the collision exercise. It adds SD-23 to SD-29 and KR-05: what
> may be an operand of a comparison, effective value and the modifier's declared operation, the base
> value of a scoring event, where a comparison lands, that an assumed item cannot create an
> authoritative collision, gap before collision, the classification of the whole extension, and his
> individual rulings on the six code sentences.
>
> **The classification matters and is his (SD-29).** This is *"a bounded structural-semantic extension
> to the contribution/derivation grammar, not merely an operational reading rule. The Game
> Representation data shape remains stable. What changed is the grammar's ability to express and
> evaluate relationships among represented properties."* The eight areas, the four statuses, the source
> kinds and the declaration mechanism are all unchanged, and **no ninth area is authorized**. The
> conformance check's data-model stability finding stands; what is extended is the grammar, not the
> representation.
>
> **Revision 5 (19 September)** adds his two rulings after the conformance check: KR-04 (RPC-001 does
> not own or instantiate its scoring carrier) and SD-22 (structural-semantic versus operational
> derivation rules). Everything else is revision 4, which the check ran against.

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
- **[C19]** Christian's rulings of 19 September, after the conformance check, quoted where used;
- **[C20]** Christian's rulings of 20 September on comparative claims, quoted where used;
- **[C23]** Christian's rulings of 22 September closing residual space, the unlabelled supporting case and element identity, and authorizing implementation — quoted where used;
- **[C22]** Christian's rulings of 22 September on Gate A decidability and structural reachability, quoted where used;
- **[C21]** Christian's rulings of 21 September settling the authority for OPEN, the optional candidate game, BUILD_OUT_EPISODE's nonconforming uses, restricted computations and comparatives — quoted where used;
- **[C20d]** Christian's rulings of 20 September approving the engine-design direction — the free-choice boundary, BUILD_OUT_EPISODE as the sixth scope, the five smaller choices, and how the unrepresentable cases are to be held — quoted where used;
- **[C20c]** Christian's rulings of 20 September authorizing derivation-engine **design** — the value
  modifier's operation, empty own-involvement scope, AM-12's extension, the report-only failure path,
  comparative cardinality, SD-10's necessity test and AM-17's disposition — quoted where used;
- **[C20b]** Christian's rulings of 20 September closing the collision exercise — operands, effective
  value, assumed items, where a comparison lands, classification, gap versus collision, and the six
  code sentences — quoted where used;
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
| SD-22 | A new derivation reading rule is not by itself a structural change. **Structural-semantic:** it changes the contract grammar, declaration statuses, source kinds, the eight areas, the relationship model, or the meaning of support. **Operational:** it makes an already-defined relationship deterministic without changing what can be represented or what support means. Only the first can reverse the structural-stability verdict. This replaces the earlier test condition, which counted any new support-reading rule as structural | the stability test; the LOCAL/STRUCTURAL test in the grammar sheet §6 | [C19] |
| SD-23 | **What may be an operand of a comparison.** Either a represented game property, or "a deterministically derived quantity whose inputs are supported represented game properties". Two limits, in his words: "Do not add region value as a stored Game Representation row merely to support this case", and "A derived quantity may compute relationships among represented environmental properties. It may not derive learner/ecological states such as pressure, opportunity, affordance availability, difficulty or uncertainty" | `COMPARES` items; derivation spec §4.4 | [C20b] |
| SD-24 | **Effective value, provisionally:** "primary-event base value after application of all applicable resolved value modifiers for the referent." With two conditions: "A value modifier must explicitly declare its operation/type. Do not infer multiplier versus increment", and "If an operation or magnitude required for the derivation is unauthored, effective value is not computable" | new field `V9a` (the modifier's operation); `V9` stays its magnitude | [C20b] |
| SD-25 | **Base value of a scoring event:** "A qualifying primary scoring event has a base value of one point unless an authoritative selected contribution explicitly modifies that value." His note: "This is a scoring convention, not football knowledge" | `value.primaryEvent.baseValue`; retires the code sentence in KR-05 §5b | [C20b] |
| SD-26 | **Where a comparison lands.** "Do not force a comparative relationship onto one operand's ordinary property line. The comparison is a relationship assertion evaluated over its operands. It may remain outside the eight stored Game Representation areas as part of contribution/reconciliation evaluation." If its operands cannot be resolved or computed, it is "not evaluable/unmet according to its requirement status". Two authoritative, well-formed, mutually incompatible comparative requirements produce an **unresolved relationship conflict**. "No ninth Game Representation area is authorized" | derivation spec §4.4, §6.1 | [C20b] |
| SD-27 | **An assumed item may not create an authoritative collision with authored knowledge.** "Assumed-vs-authored may be reported diagnostically as a possible tension, but it cannot drive UNRESOLVED." An interpretation consistent with an object's prose is not promoted to canonical meaning; if comparative value is truly part of an object's meaning, it is authored explicitly later | derivation spec §6 | [C20b] |
| SD-28 | **Gap before collision.** "A collision requires well-formed, support-capable authoritative claims with sufficiently resolved operands/properties." Therefore an unauthored or incomputable dependency is a **gap first**, and only contradictory authoritative evaluable claims give an unresolved collision. "An invented or assumed comparative cannot manufacture an authoritative collision" | derivation spec §6 | [C20b] |
| SD-29 | **Classification of the comparative extension:** "a bounded structural-semantic extension to the contribution/derivation grammar, not merely an operational reading rule. The Game Representation data shape remains stable. What changed is the grammar's ability to express and evaluate relationships among represented properties." Recorded as that distinction, and **not** as a weakening of the data-model stability finding | the stability test; qualifies SD-22 for this case | [C20b] |
| KR-05 | **The six sentences held in code, ruled individually.** 1–4 retire as legacy realization wording, and "beyond the first defenders" is not promoted. 5a retires; existing scoring-event knowledge owns it. 5b becomes SD-25. 5c: the code sentence retires, `long clearance` is the canonical internal term, SD-15's free qualitative judgement attaches to it, and "long kick" may remain coach-facing wording rather than a canonical matching term. 6 retires: RPC-001's build-out episode is not converted into every attacking episode, and own-half restart placement is not inferred. The resulting **carrier placement** and **build-out restart placement** questions "remain explicit knowledge gaps. Do not fill them from legacy code" | `COACH_RULES`; RPC-001's contract items | [C20b] |
| SD-30 | **The value modifier's `operation` is approved** as a local Game Representation addition. The architecture is recorded in his words: *"The eight-area Game Representation remains stable; one existing collection gained a required property necessary to make its authored meaning computable. The contribution/derivation grammar has also received the previously identified bounded structural-semantic extension."* The vocabulary is `multiply / add / replace` — *"the currently supported closed vocabulary, not an assertion that no future legitimate operation can exist"*. **"An authored modifier magnitude without an authored operation is incomplete and effective value is not computable."** And: *"No historical activity should be treated as retrospectively validated under this newer specification merely because it passed an earlier audit"* | row `V9a`; SD-24; every prior audit | [C20c] |
| SD-31 | **Declarations survive an empty own-involvement scope.** *"An empty resolved scope empties the item's application set, not the contract's declaration. Preserve the declaration so the result reports the authored gap rather than converting it into `invented`."* His reason: *"authored intention that could not reach an element ≠ structure nobody authorized"* | derivation spec §6 and §4.6; moves Wide Zone's channel lines from `INVENTED` to a declared gap | [C20c] |
| SD-32 | **AM-12 extends past selectors.** *"Any structural reference participating in derivation must resolve through the registered identity/reference system before derivation. If it cannot normalize, report the reference/restatement defect. Do not silently use prose matching and do not infer the intended element"* | derivation spec §4.1; element references held in an item's value | [C20c] |
| SD-33 | **The engine is report-only.** It returns resolved results where possible, Gate A and Gate B results, structured failures, gaps and conflicts, and the audit, provenance and support record. *"It does not re-select knowledge, weaken requirements, decide to generate fewer activities, or otherwise repair selection."* Recovery belongs to the caller. If re-selection is ever permitted *"it must be bounded and must preserve specified planning/learning invariants so repeated attempts cannot silently select away the coach's intention or session emphasis"*. **"Do not design that recovery policy now"** | the engine's output contract; the failure path | [C20c] |
| SD-34 | **Comparative cardinality stays unsupported.** `count(A) = count(B)` was *"illustrative, not authorization for a cardinality schema change"*. It returns only with a concrete authored case that requires it | AM-16's operand kinds; §4.3 | [C20c] |
| SD-10a | **The machine test for SD-10's structural necessity**, in his words: *"An objective is structurally necessary when removing it would make at least one authoritative required contribution unsatisfied or make the resolved game's required primary event, direction, transition, or representative configuration structurally incomplete. A mere reference from optional/supporting knowledge is not sufficient to establish necessity."* SD-10 is typed as a prohibition on removal, not a source of support | the register's SD-10 entry; J1 and J4 | [C20c] |
| SD-35 | **The derivation boundary on variation.** In his words: *"Derivation determines what must be true, what may vary, and the legitimate bounds of variation. A downstream explicitly governed choice process determines which permitted value becomes true in the particular game."* The engine emits a permitted free choice as `OPEN`, carrying its legitimate bounds, the authority or rule permitting it, and any applicable constraints — **and no selected value**. *"Do not define that downstream process yet, and do not give the derivation engine a hidden deterministic selection policy"* | the engine's output contract; SD-16 | [C20d] |
| SD-36 | **`BUILD_OUT_EPISODE` is approved as the sixth scope**, defined narrowly in his words: *"applies to the attacking episode whose beginning satisfies the resolved RPC-001 build-out begin condition. It does not automatically extend to subsequent attacking episodes."* *"This is a vocabulary addition making an already-authored distinction executable, not a new Game Representation area"*. **Confirmed 21 September** after all six uses were checked: two conform; `RPC-001-16.a`, `.b` and `.c` and the associated declaration do not, and are recorded as nonconforming contract-authoring tasks. *"Do not reinterpret them, broaden BUILD_OUT_EPISODE, or derive replacement requirements from the retired runtime sentence. The mismatch is evidence that the scope is doing its job"* | the scope vocabulary; KR-03 | [C20d], [C21] |
| SD-37 | **Derivation diagnoses; it does not design.** Failure records diagnose only — they never recommend or perform a repair. With it he approved: partial resolution preserved alongside failures; both gates run where they are independently evaluable; canonical ordering throughout; render-fidelity validation outside the engine and after rendering | the engine's failure records; §8 of the engine design | [C20d] |
| SD-38 | **The six unrepresentable cases are recorded, not solved.** No grammar extension yet, each recorded **individually**, and specifically: *"do not yet collapse the three conditional-looking cases into one mechanism. They may have different eventual ownership"* — RPC-001's carrier may need conditional applicability on a resolved game property; GF4's "when the goal is defending under overload" may belong upstream in selection; GF4's two-goal-or-two-target layout may be an alternative-realization issue. Example-status existence and aggregate comparison wait for authored knowledge that justifies the change | the knowledge-authoring task register | [C20d] |
| SD-39 | **The authority for OPEN**, superseding P-4 as proposal and runtime authority. In his words: *"Where the representation requires a value in order to produce a playable game, selected authoritative knowledge neither determines nor further constrains that value, and no standing rule determines it, the value may remain OPEN for downstream governed choice within its supported bounds."* **Qualification:** *"OPEN is not produced by absence of knowledge. The property's existence and legitimate choice space must already be supported. Silence does not authorize creation of a property, relationship, trigger, qualifier, consequence, modifier, information rule, region, object, or other structure."* In one line: *"OPEN is an explicitly authorized degree of freedom within an already-supported property, not a synonym for unknown."* The starting-team and end-assignment rows (`T2`, `J3`) may cite it where their properties and choice spaces are independently supported | every `open` property's `permittedBy`; replaces SD-R2 and P-4 as authorities | [C21] |
| SD-40 | **Two modes, and the candidate game is evidence, never authority.** Derivation mode: no candidate; derives supported properties; emits DERIVED / OPEN / FAILED; runs the applicable forward and gate evaluation; invented-property checking does not apply. Checking mode: the same derivation, then candidate assertions checked against it, enabling reverse trace and invented-property detection. *"The candidate game is evidence to be checked, never authority used to complete derivation."* A candidate value **cannot**: turn OPEN into DERIVED; cure a GAP; supply missing support; satisfy an otherwise unsupported dependency; resolve an authoritative collision or relationship conflict. For an OPEN property, checking mode may determine whether the candidate's value lies within the authorized bounds — *"Its provenance remains downstream governed choice, not knowledge entailment."* Order: derive from authoritative knowledge, then optionally check | the engine's two modes | [C21] |
| SD-41 | **Comparatives are presently unexercised.** Comparative support has **zero** canonical contract items across the 221-item corpus. The capability and its tests are kept, classified as *presently unexercised by canonical authored knowledge*. *"Do not expand or optimize comparative/aggregate machinery until a real authored requirement provides evidence for doing so"* | AM-16, SD-23–SD-28 | [C21] |
| SD-42 | **What a restricted computation may do.** *"A restricted computation may establish prerequisites for full derivation, but may not create additional authority or broaden the set of potentially entailed elements."* The divergence checks stay. *"Divergence is a defect/refusal, not an invitation to choose one pass"* | the three restricted computations; the divergence check | [C21] |
| SD-43 | **What Gate A may and may not certify.** *"Gate A evaluates only claims that are structurally decidable from the Game Representation."* Where a check combines a structurally executable requirement with a clause requiring information the representation deliberately does not hold, the structural requirement is executed and the remaining clause is reported as **`NOT CHECKABLE — OUTSIDE REPRESENTATION`**: *"That result does not itself fail Gate A, but it is not a PASS for that clause either."* **Not a general permission:** it applies *"only when the required information is intentionally excluded by the established Game Representation boundary. If a check concerns represented information but lacks an executable definition, that remains a specification gap/refusal until defined."* General rule: **outside the representation → explicitly not checkable and non-blocking; inside but undefined → specification gap, blocking.** *"Do not narrow the canonical Gate A wording merely to make the current engine pass it. Preserve the uncheckable remainder so we know exactly what the system has and has not established."* Applied: the four state-of-play clauses split into structural and outside-representation parts; the modifier-overlap condition types and residual space are specification gaps | Gate A; engine package §7 | [C22] |
| SD-44 | **Structurally reachable** — the operational definition of AM-15's term. *"A trigger is structurally reachable when the Game Representation contains the resolved structural prerequisites necessary for that trigger to occur. Structural reachability does not assert that the trigger will occur, is likely to occur, or is reachable through simulation of player behavior or game state."* Prerequisites: START by construction for a playable game; SCORE when a resolved primary scoring event exists; ball out when a bounded playing area exists; turnover when opposing teams and the relevant possession relationship exist; REGION_ENTRY when the region exists **and is structurally accessible under the represented layout and rules**; TIME_EXPIRY when the window exists. *"Region existence alone is not necessarily sufficient for REGION_ENTRY if represented structure makes entry impossible. Use structural accessibility where the representation can establish it; do not simulate movement or infer player behavior."* Never dependent on pressure, skill, likelihood, tactics, intention or other state outside the representation. **Not a new representation property**: *"Do not store `reachable` as game state if it can be derived from the represented prerequisites"* | AM-15; engine package §2.4 | [C22] |
| SD-45 | **Residual space is removed as a Gate A requirement**, and no machine-testable `residual space` concept is created. The legitimate invariant is already enforced: derivation cannot instantiate unsupported regions; every instantiated region requires supported function and authority; and in checking mode an unsupported candidate region is reported as invented. *"The space left between or outside supported functional regions is simply not represented as another region unless authoritative knowledge independently entails one. Absence does not need to become an object in order to remain absent."* The sentence's second half — comparing channel extents with the area — *"does not belong in Gate A"*: it is Wide Zone's own aggregate requirement, retained in the task register as an **explicit unsupported requirement**. No aggregate machinery is added now | removes the universal Gate A blocker; task register B3, F1 closed | [C23] |
| SD-46 | **A supporting contribution whose realization conditions are not satisfied is `NOT REALIZED`.** This covers the failed supporting cardinality check. It is an item or contribution outcome, **not a fifth Game Representation property status**. It creates **no GAP**, because the contribution is supporting rather than required, and **no invented-property verdict** merely because its realization conditions failed | derivation spec §7; package `ForwardResult`; closes F4 | [C23] |
| SD-47 | **Existence requirements establish supported classes defined by authoritative selectors.** *"Derivation does not manufacture individual identity or equivalence between classes."* In checking mode a candidate's concrete element may satisfy every supported class whose selectors it matches, and *"that does not imply that derivation independently instantiated or paired an individual with it."* The stricter revision is approved as better satisfying identity-neutrality than minting and merging | package §2.3, §2.5 | [C23] |
| SD-48 | **The implementation rule.** *"If a stage reaches semantics not explicitly established by the specification, stop that path and report it. Do not complete the behavior from developer judgment."* The task register stays authoritative for known gaps, and *"do not repair knowledge merely to make implementation tests pass."* Each increment must evidence: approved semantics implemented; expected refusals refuse; canonical ordering and determinism hold; no `OPEN` value silently chosen; no unsupported identity created; no failed or gapped input repaired; version and provenance information surviving as specified | every implementation increment | [C23] |
| SD-49 | **Reach against a class.** *"Do not manufacture individuals, split classes, or choose among partially overlapping selector values."* For a class defined by an authoritative selector, another selector is **entailed** by the class definition → reaches; **contradicted or disjoint** → does not reach; **partially overlapping or otherwise indeterminate** → applicability is unresolved and **nothing is derived from that application**. *"Record the indeterminate case rather than resolving it by interpretation."* Closes the increment 2 stop | package §2.2 stage 4; `reach.ts` | [C24] |
| SD-50 | **An unsupported choice space is a GAP.** *"If a required property must be resolved, its existence is supported, but the legitimate choice space/bounds required to make it OPEN are unsupported, report a GAP."* OPEN requires **both** supported existence **and** a supported legitimate choice space: *"Silence supplies neither."* Not a refusal. Closes the increment 2 stop | derivation spec §5; `derive.ts` | [C24] |
| SD-51 | **Set-valued rows.** *"Do not enumerate member lines before membership is authoritatively resolved. Resolve the set/collection membership first. Materialize member lines only from an authoritative resolved member set. OPEN, failed or gapped membership does not authorize creation of member identities."* Closes the increment 1 stop | package §2.2 stage 2; `engine.ts` | [C24] |
| SD-52 | **A gate clause on a gapped line.** `NOT EVALUABLE / BLOCKED`, naming the dependency. *"It does not FAIL the game condition, because the engine lacks enough authoritative information to establish that the condition is false."* The general distinction: **FAIL** = sufficient authoritative information establishes violation; **NOT EVALUABLE / BLOCKED** = authoritative information is insufficient to determine the clause. *"A blocked clause cannot contribute to a gate PASS."* Confirms the increment 4 reading | package §7.1 | [C24] |
| SD-53 | **Atomic gate reporting.** *"One executable gate clause → one independently reported verdict."* Canonical or human-readable wording may remain compound where useful, but *"the executable specification must decompose every independently testable claim. No PASS may imply a claim the engine did not evaluate."* This is general, not four exceptions: all remaining fused executable wording is decomposed | package §7.2 | [C24] |
| SD-54 | **Empty applicability.** A universally stated structural check with zero applicable instances *"may remain PASS, but its basis must be explicit"* — `PASS — no applicable instances` versus `PASS — evaluated applicable instances`. *"Do not present those as equivalent evidence in summary reporting"*, and avoid an aggregate *"N checks passed"* that obscures how many were vacuous because the relevant structure was absent | package §7.1; `GateReport.evidence` | [C24] |
| SD-55 | **Supplied values must survive.** The session-supplied and standing-decision corrections are accepted. The committed real-corpus input and its assertions are kept *"so session-supplied values cannot silently disappear again."* A standing decision that supplies a value *"must carry that value into the resolved record; its citation alone is not resolution."* And: *"Do not coerce qualitative/prose constraints into numeric bounds without authored endpoints"* | §1.4; `derive.ts`, `corpus.ts` | [C24] |
| SD-56 | **Modifier overlap — evidence threshold reached, semantics still unruled.** The remaining `object`/`event`-condition overlap semantics are **not** invented. Real corpus items now provide the evidence needed to examine the case, and the minimum general semantics will be ruled from them. *"Affected cases continue to refuse until the semantics are established"*, and this does not block final assembly | package §7.2; F2 | [C24] |
| SD-57 | **Event referent identity.** *"Do not create event elements or an event-identity system from this evidence."* No semantic or synonym matching — **and do not promote exact open-text equality into canonical event identity either**. General rule: *"An event referent establishes structural identity only when it resolves through an existing registered structural reference. Open-text event descriptions do not establish event identity."* First-class event identity, if ever needed, is evaluated from the actual blocked knowledge rather than introduced now | `gates.ts` `identityOf`; SD-32 | [C25] |
| SD-58 | **An undecidable relationship is a gap, never a collision.** For an otherwise valid authoritative contribution whose required event relationship cannot be established because the necessary event identity or reference is not represented: **GAP / NOT EVALUABLE**. *"Do not report a collision."* A malformed or unregistered structural reference may still be a reference defect at normalization; this ruling concerns a valid contribution whose required relationship lacks representable authoritative information. **Gap-before-collision (SD-28) remains intact** | package §7.1; stage 1 vs stage 10 | [C25] |
| SD-59 | **No alternatives mechanism.** GF4 genuinely authors *"double points for quick goal || reward regain leading to shot"* as alternatives, but the corresponding contributions are `TYPICAL_EXAMPLE` and therefore inert for derivation, so **no alternative-contribution mechanism is added**. The limitation is recorded on the task register: *"GF4 contains authored example alternatives that the current contribution grammar cannot preserve structurally."* Revisit only when authoritative knowledge actually requires mutually alternative contributions. The two examples are **not** reinterpreted as one modifier, two coexisting modifiers, or two modifiers the engine must choose between — *"none of those meanings is currently represented"* | task register C7 | [C25] |
| SD-60 | **No object-condition overlap semantics.** *"No canonical corpus item exercises `condition.type=object`, so there is no evidence basis for doing so."* The representational capability is preserved where present, but **no execution semantics are added from invented examples** | package §7.2 | [C25] |
| SD-61 | **Modifier-overlap status corrected.** It is no longer described as blocking two or four corpus cases. Current status: *"Modifier-overlap execution is underspecified for future reachable authoritative cases; no currently admitted authoritative corpus item requires it. Therefore it is not a current derivation-engine implementation blocker."* Closes F2 as a blocker; the underspecification stays on the register | task register F2 | [C25] |
| SD-62 | **A blocked gate clause carries its own record.** Gate A meeting a `NOT EVALUABLE` / `BLOCKED` clause **does not create a derivation `GAP`**. Every such clause carries a structured blocking record identifying *the clause, the unresolved dependency, and the reason evaluation could not be completed*, belonging to the gate result and audit trail. It does **not** change the underlying line from `DERIVED` to `FAILED`, create a derivation gap retrospectively, assert that the game condition failed, or extend the derivation failure taxonomy. *"GAP = authoritative information required during derivation is missing. GATE BLOCK = derivation completed as far as authorized, but the gate lacks sufficient structural authority to evaluate a particular clause. Both prevent an unearned PASS, but they describe different failures of knowledge"* | package §7.1; `GateReport.blocks` | [C26] |
| SD-63 | **Structural-reference identity, generalized.** Replacing the separate event and region rules: *"Open-text equality does not establish identity for a structural referent. Structural identity must be established through the registered reference/selector system. Where that identity cannot be established, withhold the verdict rather than infer identity from matching text."* Applied wherever a structural referent is read — objective references, information subjects, consequence referents, objective-set members, modifier referents. Generalizes SD-57 beyond event referents | `gates.ts` `identityOf` | [C26] |
| SD-64 | **The ten-stage checkpoint.** The implemented stages are the current derivation-engine checkpoint, and no further implementation pass precedes corpus work. Relationships are not reopened to manufacture comparative coverage where canonical knowledge holds no comparative items, and candidate checking is not built against an artificial candidate representation. *"Those capabilities remain specified/deferred until legitimate inputs exercise them"* | stages 7 and 9 | [C26] |
| SD-65 | **The corpus diagnostic is the baseline corpus-health artifact.** Its categories are preserved and **not collapsed into a generic pass/fail count**: clauses evaluated against real instances · passes with no applicable instances · failures · blocked · outside the representation | `diagnostic.ts` | [C26] |
| SD-66 | **Corpus repair runs upstream-to-downstream.** A load refusals → B derivation gaps → C gate blocks → D genuine gate failures. *"Do not repair downstream symptoms while an upstream refusal prevents the relevant knowledge from reaching them."* Each repair preserves provenance and is classified: **encoding/data repair** restoring already-authored knowledge may proceed where meaning is unambiguous; **restatement** and **genuinely new knowledge authoring** come back to him. *"Do not optimize toward making the diagnostic green. The objective is for the machine result to accurately represent the canonical knowledge, including legitimate gaps and refusals"* | `corpus-repair-ledger.md` | [C26] |
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
| KR-04 | RPC-001 does not own or instantiate the physical carrier of its scoring event. "Its responsibility is to constrain/narrow the acceptable scoring-event identity for the representative context." The resolved game must independently contain a supported compatible carrier — line, zone, gates, target player — and the gates must establish that the chosen event can operate through it. "If selection produces an RPC-compatible scoring event for which no supported physical carrier exists, reconciliation fails/returns to selection. RPC-001 does not manufacture the carrier conditionally." No conditional contract structure is added for this (closes AM-25) | RPC-001-08 and RPC-001-09; §5.8 | [C19] |
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
| `RESOLVED` | The value is fixed, by an authored source or a citable standing decision. *(Before 21 September a free choice under SD-16 could also resolve a property; under SD-39 and SD-40 a permitted choice is `FREE` — the value is chosen downstream — and a candidate's chosen value carries `REALIZATION` provenance, never support)* | No |
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

**The authority for a free choice is SD-39** (21 September), which superseded proposal P-4: *"OPEN is
an explicitly authorized degree of freedom within an already-supported property, not a synonym for
unknown."* The list below survives as the register's description of which **choice spaces** exist —
data, not authority. It was drawn from the unstated quantities the Gate A procedures search over
[GP, `verdictSemantics`]:
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
**Silence licenses nothing** (SD-39, 21 September): a non-claim permits a choice only inside a property
whose existence and choice space are already supported, and never creates a property, rule or
structure. *(Revision 8 and earlier read "silence licenses a choice"; that sentence is superseded.)*

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
- **Which team starts:** a permitted free choice unless selected knowledge requires otherwise — the
  substance of the SD-R2 rejection, with **SD-39** as the authority, since a rejected default cannot be
  cited as one.
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
| `primaryEvent {kind, value, conditions[]}` — its reference is derived from `PRIMARY_SCORING` objectives and sets | [CA]: the scoring event and its condition were one of two selections that reliably changed what players experience. RPC-001-20's "One point per qualifying event" had no typed field; the slice placed it as an ad hoc "point value" entry | SELECTION narrows to a valid set (for RPC-001, RPC-REL-071 to 074: the valid events "in the approved order"); under RR-01 the Context decides which physically available event applies; where that leaves a choice the kind is `FREE` under SD-39 and is chosen downstream. SD-06 fixes one | Exactly one primary event; base `value` present and numeric; every member of its reference has a Space position. How the approved order binds the choice is not settled here |
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
| **Gate B — realization fidelity, reverse** | Nothing was invented | **Checking mode only** (SD-40): every property a candidate game asserts has derived support from a contract item or a citable SD id. **Otherwise: INVENTED.** In derivation mode no candidate asserts anything, so reverse is not applicable |
| **Gate B — reporting** | Nothing is silently lost | `OUTSIDE_BOUNDARY` items are reported as not structurally checkable, counted, and never dropped from the denominator. A `PARTLY_STRUCTURAL` item's structural clause is checked and the rest is reported. `FREE` conditions are reported as existing and attached, not as judged. Adaptations are recorded as dispositions |
| **Render fidelity, after rendering** | The text describes the game and introduces nothing (SD-05) | **Every structural property the text names or describes maps to a property of the game** — regions, objects, states, triggers, consequences, counts, value tiers, conditions, roles and placements are examples, not a closed list. No number is attached to a `FREE` (b) condition unless bounds are authored. [R2]: 23 of 35 true defects were written by the renderer's own templates |

**The rendering precondition:** Gate A and both directions of Gate B pass, and no property is
`UNRESOLVED` or `NOT_AUTHORED`. Since reverse applies only in checking mode (SD-40), **what is rendered
is a realized game checked against the derivation** — never a derivation-mode result, whose `FREE`
properties have no value yet.

## 9. The hostile cases, across the three revisions

| Case | Revision 1 | Revision 2 | Revision 3 |
|---|---|---|---|
| baseline s1: 18 m channels on 30 m | caught | caught | caught, Gate A (regions fit) |
| ps-central s1: restart from a place against "play does not stop" | **let through** | caught | caught, Gate A (transition coherence) |
| "…then wide, then deep", 19 activities | **let through** | caught | **corrected 20 Sep:** caught by render fidelity (SD-05) only. The collision test showed Gate A's overlap rule cannot fire as the register stands: a modifier's only selector attribute is its condition type, so two objects' region modifiers collapse into one element and there is nothing to compare. The claim that the overlap rule catches this was untested until then |
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
| PSD-01 | START: coin-toss team, own half | **No** → SD-R2 (who starts is a free choice; authority now SD-39) |
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
| P-4 | The list of what a free choice may fill (§3), drawn from the Gate A search, including the event kind inside a narrowed set | **Superseded 21 September by SD-39** as authority. The list survives as register data describing choice spaces |
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
