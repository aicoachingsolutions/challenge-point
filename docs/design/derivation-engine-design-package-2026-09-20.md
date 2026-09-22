# The derivation engine — design package, revision 4

> **Revision 4 (22 September)** closes what a second independent sweep of revision 3 found: two
> consistency defects and five invention points, all confirmed against the files. The largest change is
> §2.3 — element **classes** replace merged handles, because the merge rule in revision 3 was itself a
> guess. Revision 3's account of how it came about follows unchanged.

**21 September 2026. Design only. Implementation stays frozen until Christian confirms this package.**
Generation remains frozen. No code exists.

Revision 3 incorporates his rulings of 21 September — SD-39 (the authority for OPEN), SD-40 (two
modes; the candidate game is evidence, never authority), SD-41 (comparatives presently unexercised),
SD-42 (what a restricted computation may do) — and answers the three things he asked to have surfaced,
in §11.

**On how revision 3 came about.** Revision 2 claimed no point remained where an implementer would have
to invent semantics. Before sending it, I had that claim tested by an independent read-only sweep. **It
was false.** The sweep found stale statements contradicting the new rulings in the live specifications,
three records the package used but never defined, three rules with no implementation home, and six
places two careful implementers would have diverged. Every finding was checked against the files, and
all are fixed here. §11 gives the account.

This supersedes the direction document where they differ.

---

## 1. Inputs, outputs and records

### 1.1 The call

```
derive(input: DerivationInput) -> DerivationResult
```

A pure function. No I/O, no clock, no randomness, no ambient state.

### 1.2 `DerivationInput`

| Field | Meaning |
|---|---|
| `selection` | `{ objectId, knowledgeVersion }[]` |
| `contracts` | one `LoadedContract` per selected object, loaded whole |
| `envelope` | `{ players, lengthM, widthM, durationMin }` — the `SESSION` source |
| `register` | versioned data: rows with `ownerRow`, `fillable`, structured `applicability`, versioned `vocabularies`, `selectorSyntax`, `relativeTerms`, `teamDesignations`, `comparison`, `decidingRules`, `citableStandingDecisions` |
| `derivationRules` | `{ version, adoptedLabels[] }` |
| `candidate` | **optional** `CandidateGame` (§1.8). Its presence selects checking mode |

### 1.3 `DerivationResult`

```
DerivationResult {
  versions   : Versions
  resolution : ResolutionEntry[]
  audit      : Audit
  gates      : { gateA, gateBForward, gateBReverse : GateReport }
  candidate  : CandidateCheck[] | null
  failures   : FailureRecord[]
  refusals   : RefusalRecord[]
  run        : RunReport
}
```

A result is always returned; a failure to stamp returns a stamped-halt result (§3.5). **`resolution`
never depends on `candidate`**: it is byte-identical in both modes for the same authoritative input
(invariant D10).

### 1.4 `ResolutionEntry`

| Field | Present | Meaning |
|---|---|---|
| `lineId` | always | `<elementId or 'game'>::<row>[::<member>]` |
| `elementId` | always | an element class id (§2.3), or `null` for the 13 game-level rows |
| `row` / `member` | always / set-valued rows | |
| `lineState` | always | `ENUMERATED` · `WITHDRAWN` · `CONDITIONAL` (§2.1). Only `ENUMERATED` lines carry a `state` |
| `state` | iff `ENUMERATED` | `derived` · `open` · `failed` |
| `verdict` | iff `ENUMERATED` | `RESOLVED:ENTAILED`, `FREE(a)`, `FREE(b)`, `FREE(choice)`, `NOT_AUTHORED`, `UNRESOLVED`, `INVENTED` |
| `reason` | iff `NOT_AUTHORED` | AM-23's codes in his order |
| `value` | iff `derived` | a `Value` (§1.9) |
| `bounds` / `permittedBy` / `constraints` / `openKind` | iff `open` | §1.8, §4 |
| `resolvedBy` | iff `derived` | `ENTAILMENT` · `STANDING_DECISION` · `SESSION` |
| `support` | always | `SupportRef[]` — knowledge entailment only; `[]` unless derived |
| `conditionalOn` | iff `CONDITIONAL` | the governing line |
| `failureIds` / `refusalIds` | when any | |

**States map onto the four Game statuses, which stay unchanged.** `derived` is `RESOLVED`. `open` is
`FREE` — `FREE(a)` a bounded quantity, `FREE(b)` a coach judgement, `FREE(choice)` a degree of freedom
SD-39 authorizes. `failed` is `NOT_AUTHORED` or `UNRESOLVED`, or an invented line in checking mode.

### 1.5 Two modes (SD-40)

| | **Derivation mode** | **Checking mode** |
|---|---|---|
| Derivation | from authoritative knowledge | **identical**, byte for byte — the candidate contributes nothing to it |
| Element inventory | one class per existence item (§2.3) | **the same classes**. The candidate's elements are assigned to them at stage 9, never used to derive |
| Gate B reverse, `INVENTED`, `VALID_ABSENCE` | **not applicable** | applicable, at stage 9 |
| Adds | — | one `CandidateCheck` per enumerated line, and one per unmatched candidate assertion |

*"The candidate game is evidence to be checked, never authority used to complete derivation."* A
candidate value cannot turn `open` into `derived`, cure a `GAP`, supply support, satisfy an unsupported
dependency, or resolve a collision or relationship conflict — five tests in §9.

### 1.6 `Versions`

```
Versions { register, vocabularies: {<list>: version}, derivation, engine,
           contracts: [{id, version}], objects: [{id, version}] }
```

Compared verbatim. A stored result is valid only for the versions it names (SD-30).

### 1.7 What is never an output

No re-selection, no weakened requirement, no decision about how many activities to return, no repaired
contract, no coach-facing text, no render-fidelity verdict, no recovery policy, and **no field carrying a
suggestion, recommendation, repair or retry** — *derivation diagnoses; it does not design* (SD-37).

### 1.8 The records

Every record the package names is defined here; a record not listed does not exist.

```
Audit            { properties: AuditProperty[], items: AuditItem[], collisions: Collision[],
                   relationshipConflicts: RelationshipConflict[], tensions: Tension[],
                   referenceDefects: ReferenceDefect[], dispositions: Disposition[] }
AuditProperty    { lineId, sources: SourceRef[], lineState, collisionId | null }
AuditItem        { contractId, itemId, result: ForwardResult, reach: lineId[],
                   cardinality: { matched, min, max } | null }
Collision        { collisionId, lineId, items: ItemRef[], demanded: Bounds[], decidedBy: ruleId | null }
RelationshipConflict { conflictId, items: ItemRef[], operands: Value[], why, objects: objectId[] }
Tension          { tensionId, items: ItemRef[], why }                    // diagnostic; no gate reads it
ReferenceDefect  { contractId, itemId, where: 'SELECTOR' | 'VALUE', text, why }
Disposition      { contractId, itemId, disposition, clause }
RunReport        { mode: 'DERIVATION' | 'CHECKING', halted: boolean, divergent: boolean,
                   inputDigest, counts: { lines, withdrawn, conditional, derived, open, failed,
                                          failures, refusals } }
SourceRef        { kind: 'CONTRACT_ITEM' | 'STANDING_DECISION' | 'SESSION' | 'DECLARATION', ref }
SupportRef       { kind: 'CONTRACT_ITEM', contractId, itemId, relation: 'ENTAILS' | 'NARROWS' }
                 | { kind: 'STANDING_DECISION', id } | { kind: 'SESSION', row }
Constraint       { source: SourceRef, bound: Bounds }
Bounds           { kind: 'COUNT' | 'INTERVAL' | 'SET' | 'QUALITATIVE', min?, max?, members?, term? }
PermittedBy      { authority: 'SD-39' | 'SD-15', choiceSpace: { row, fillableText } | { itemRef } }
CandidateGame    { elements: [{ elementId, row, attributes: {<attr>: Value} }],
                   properties: [{ elementId | null, row, member | null, value: Value }] }
                 // elementIds are the candidate's own; attribute keys must be the row's registered
                 // selectorAttributes (via ownerRow), or the element is an INPUT_DEFECT
CandidateCheck   { lineId | null, candidateElementId | null, asserted: Value | 'ABSENT',
                   outcome, provenance, failureIds[] }
GateReport       { verdict: PASS | FAIL | NOT_EVALUABLE | NOT_APPLICABLE,
                   checks: [{ checkId, verdict: PASS | FAIL | NOT_CHECKABLE | NOT_EVALUABLE,
                              subjects, why, pendingOn: lineId[], blockedBy: lineId[] }] }
                 // NOT_APPLICABLE is a whole-gate verdict only: gateBReverse in derivation mode
```

**`ForwardResult` — closed, first that applies:** `NOT_CHECKABLE` (outside the boundary) · `INERT`
(typical example or engine-only) · `SATISFIED` · `VIOLATED` · `PENDING_CHOICE` (derivation mode: the
item's only unmet dependency is a `FREE(choice)` line) · `UNMET` (required, absent) · `ADAPTED`
(preferred default displaced) · `NOT_REALIZED` (checking mode: a supporting item whose value the candidate
leaves absent) · `NOT_EVALUABLE` (a supporting comparative whose operand does not resolve) ·
`UNLABELLED` (a supporting existence item whose cardinality check fails — §3.4).

**`CandidateCheck.outcome` — closed:** `MATCHES_DERIVED`, `CONTRADICTS_DERIVED`, `WITHIN_BOUNDS` (what
`RESOLVED:NARROWED_CHOICE` now names), `OUTSIDE_BOUNDS`, `ON_FAILED_LINE` (recorded, changes nothing),
`INVENTED`, `ABSENT`, `VALID_ABSENCE`. Provenance is `KNOWLEDGE` for a match and `DOWNSTREAM_CHOICE` —
the `REALIZATION` source kind — for a within-bounds value; never support.

### 1.9 The value model

| Value | Representation | Comparison |
|---|---|---|
| Count, integer | exact integer | numeric |
| Metres | exact rational | numeric |
| Interval | `{ axis: 'along' \| 'across', lo, hi }`, closed, exact rationals | containment and overlap; `touches` means sharing an endpoint |
| Relative position | `{ term, referent }` from `relativeTerms` | converted to an interval **only once the referent resolves**; until then the comparison is *undetermined* and the engine refuses rather than guesses |
| Enumerated | a member of the row's `vocabularies` list | equality on the canonical member |
| Set | a set of enumerated members | set equality, membership, containment |
| Team designation | a canonical entry of `teamDesignations` | equality on the entry, evaluated at the trigger or episode it is attached to (AM-01) |
| Reference | a registered element id | equality after normalisation (SD-32) |
| Trigger | `{ trigger, qualifiers: {<name>: Value} }` | equality on the tagged record |
| Qualitative term | the canonical authored term (`long clearance`, `controlled on arrival`, `beyond`) | equality on the canonical term only. Two different terms do not intersect; a `QUALITATIVE` bound meeting a different term is `VALUE_NOT_COMPARABLE` |
| Dynamic location | a tagged token, e.g. `{ dynamic: 'BALL_EXIT_POINT' }` for "where the ball went out" | equality on the token. Its position is a fact of play, outside the representation, so **any geometric use of it is `VALUE_NOT_COMPARABLE`** |
| Open-vocabulary token | exact text, for a list the register leaves open (role names) | exact equality after trimming. No synonym, case-folding or meaning match (SD-32) |
| Procedure | "a procedure over members" (J11b) | **no executable form; refused as `RULE_NOT_EXECUTABLE`**. No corpus item authors one today |

**A value outside this table, or an operation this table does not define, is refused** —
`VALUE_NOT_COMPARABLE` — whether it arises in derivation, in a gate, or in checking a candidate.

---

## 2. The pipeline

**Five invariants.** No stage halts on a finding. Single pass, with three declared bounded computations.
Three-valued logic, with *undetermined* never rounded to false. Every collection sorted before
iteration. No stage after 6 writes a value onto a line.

### 2.1 The three restricted computations (SD-42)

*"A restricted computation may establish prerequisites for full derivation, but may not create
additional authority or broaden the set of potentially entailed elements."*

| # | Circularity | Restricted computation | Why it cannot broaden or authorize |
|---|---|---|---|
| 1 | Own involvement is what the contract's other-scoped items entail (AM-13), but entailment is stage 5 and scope stage 3 | derive over the other-scoped items only, fix the set, then derive fully | a strict subset of the contract's items can reach nothing the full set cannot |
| 2 | Conditional rows (`T2`–`T5`, `V14a`–`V14c`) apply only on a governing value derived later | enumerate them conditionally; resolve at stage 6 by the governing-line rule below | it only withdraws or conditions a line, never adds one |
| 3 | A standing decision fires only on a line already entailed, but decisions supply values before verdicts exist | a monotone closure over citable decisions | it applies only already-citable authority, and only adds support that authority carries |

**The governing-line rule**, now in the register's `applicability` as data: if the governing line is
**derived**, the condition is evaluated — true keeps the dependent line, false makes it `WITHDRAWN` (not
applicable, never `NOT_AUTHORED`). If it is **`FREE(choice)`**, the dependent line is `CONDITIONAL` on that
choice: it takes no value and is not open in its own right, and a gate check over it asks satisfiability
across the governing choice. If it is **failed**, the dependent line is failed as a `GAP` whose dependency
is the governing line — never withdrawn, because an unresolvable condition is not a false one.

**Divergence is a defect.** Where a restricted computation and the full derivation disagree on a line,
**neither result is adopted**: the line fails, naming a `PASS_DIVERGENCE` refusal, and `run.divergent` is
set. *"Divergence is a defect/refusal, not an invitation to choose one pass."* The residual
standing-decision risk is not pursued unless a concrete case shows it.

### 2.2 The stages

| # | Stage | Does | Refuses |
|---|---|---|---|
| 0 | **Load** | Register meta-schema; index rows, `ownerRow`, `rowOrdinal`, `fillable`, `applicability`, versioned `vocabularies`, `selectorSyntax`; validate each contract as data | Unknown row, kind, operator, scope, basis, declaration or vocabulary value; missing basis quote; comparative with exclusion strictness; magnitude with no operation. **Whole contract; the run continues** |
| 1 | **Normalise** | Every structural reference, in selectors and values, through registered identity (SD-32); attribute names taken whole | Unresolvable reference → `REFERENCE_DEFECT`, text verbatim. No meaning-matching, no inferred element, no AM-17 rewrite |
| 2 | **Index** | Form element classes (§2.3); construct trigger elements where §2.4 permits; one line per (class, row), per member for set-valued rows; conditional lines per §2.1 | A line for a `VIEW` row; omitting a line because nothing states a value |
| 3 | **Scope** | Application sets, including `BUILD_OUT_EPISODE` (SD-36); own involvement by computation 1; declarations beside items (SD-31) | An own-involvement item reaching what it entails itself |
| 4 | **Reach** | Row equality and selector satisfaction, against the owning collection's attributes for a field row | — |
| 5 | **Derive** | Entailment, bounds, cardinality by necessity, standing decisions by computation 3, openness under SD-39 | Openness without a supported choice space; a count fill with no authored maximum |
| 6 | **Classify** | One verdict per line; resolve conditional lines; gap before collision (SD-28) | — |
| 7 | **Relationships** | Comparatives over operands (SD-26) | A multi-element operand; a range or open operand; two modifiers with no authored order; a modifier with no operation; **an authored combination rule (`V10`), which has no executable form** — zero exist in the corpus |
| 8 | **Forward** | One `ForwardResult` per admitted item (§1.8) | A failed supporting cardinality check → `UNLABELLED` |
| 9 | **Candidate** | **Checking mode only** — §2.5 | Writing anything to `resolution` |
| 10 | **Gates** | §7 | An unexecutable check → `NOT_EVALUABLE` |
| 11 | **Emit** | Canonical order; stamp every version | An `open` entry with a value; an unstamped result |

### 2.3 Element classes

The derivation has no game to read elements from. It does not invent individual elements either. **Each
existence item** (an `EXISTS`, `COUNT` or `RANGE` on a collection row, at its scope) **defines one element
class**: *the elements satisfying this item's selector*, with the item's minimum and maximum as the
class's cardinality. The class id is `c:<contractId>:<itemId>`.

- **A class carries its selector as a constraint, not as chosen values.** `=` fixes a single value; `IN`
  constrains the attribute to a set; `CONTAINS` requires a member. **No concrete member is ever chosen for
  an `IN` attribute.** A field line on such a class is decided by AM-11: a set of alternatives on a
  non-fillable row is `NOT_AUTHORED`, reason *alternatives*; on a fillable row it is `FREE(choice)` within
  the set.
- **Classes are never merged.** Revision 3 merged handles when one "satisfied" another item's selector.
  With an `IN` selector that cannot be decided without choosing a member, so the merge was itself a guess.
  Two classes may well describe overlapping elements in a real game; the derivation does not say whether
  they do, because nothing authorizes that claim. AM-05: *"a count entails how many, never which."*
- **Lines are per (class, row).** A derived fact about a class is a statement about **every** element
  satisfying its selector — which is exactly what the grammar says an item on a field row means.
- **Cardinality is a property of the class**, checked as a count; it never becomes a list of individuals.
  Surplus above a minimum exists only as a free choice within an authored maximum.
- The same classes are used in both modes.

### 2.4 Reachable triggers (AM-15)

AM-15 says reachable triggers and the elements partitioning them by qualifier *exist by construction*;
the qualifier values still need support. It does not say what "reachable" means, and without a definition
no trigger element can be built. **Until he rules, the engine refuses rather than implementing a
definition of its own:** a trigger element exists only where an item entails it, and one
`REACHABILITY_NOT_RULED` refusal names every trigger construction withheld. Transitions that depend on
it fail as gaps, visibly. **My proposed definition, for his confirmation (§11.2):** a trigger is
reachable when its structural prerequisite is derived.

| Trigger | Reachable when |
|---|---|
| `START` | always — every game begins |
| `SCORE` | a primary event is derived (SD-06 entails exactly one) |
| `OUT_END_LINE`, `OUT_TOUCHLINE` | the envelope area is derived — a bounded rectangle has both |
| `POSSESSION_CHANGE` | two opposing teams are derived |
| `REGION_ENTRY {r}` | region `r` is derived |
| `TIME_EXPIRY {w}` | time window `w` is derived |
| `STANDING` | always — it names a standing condition, not an event |

### 2.5 Stage 9, checking mode

1. **Assign candidate elements to classes by satisfaction.** A candidate element belongs to every class
   whose selector it satisfies — candidate attributes are concrete, so satisfaction is decidable. An
   element may belong to several classes; no element is paired with any single engine element, because
   none exists to pair with.
2. **Check each class's cardinality** against the count of candidate elements assigned to it.
3. **Iterate the resolution, then each assigned element.** For every class line, and every candidate
   element in that class, emit one `CandidateCheck` carrying both `lineId` and `candidateElementId`:
   `MATCHES_DERIVED` or `CONTRADICTS_DERIVED` on a derived line; `WITHIN_BOUNDS` or `OUTSIDE_BOUNDS` on an
   open line; `ON_FAILED_LINE` on a failed one; `ABSENT` where that element states nothing for a line that
   requires a value. Game-level lines are checked once, with `candidateElementId` null.
4. **Then the remainder.** Every candidate element in no class, and every candidate property on a row no
   class line covers, is `INVENTED` — this is the Gate B reverse trace.
5. **Closed-world absence (derivation spec §8).** An `ABSENT` becomes `VALID_ABSENCE` when no
   support-capable item entails an element on that row at that scope; otherwise it is recorded against
   each item that does.

---

## 3. Typed failure records

### 3.1 Two arrays

`failures[]` are findings about the knowledge or the data, closed by authoring. `refusals[]` are findings
about the rule set — "the specification names no rule here" — closed by a ruling.

```
FailureRecord { failureId, kind, stage, locus: { lineId?, itemRef?, contractId? },
                implicated: { contractIds[], objectIds[] }, clause, offendingInput?, detailRef? }
RefusalRecord { refusalId, kind, cause, stage, clause, openQuestion: { clause, quote } | null,
                affects: { lineIds[], itemRefs[], contractIds[] }, failureRef? }
```

Ids are content-derived — `<kind>#<locusKey>#<ordinal>` — so an unrelated record never renumbers the
rest. Refusals are deduplicated by `(kind, cause)`. A refusal fails a line only where it made the line
uncomputable.

### 3.2 The six failure kinds

| Kind | Raised | Carries |
|---|---|---|
| `LOAD_REFUSAL` | 0 | contract, offending field and value, rule violated |
| `REFERENCE_DEFECT` | 1 | contract, item, `where`, the text verbatim, why |
| `GAP` | 2, 5, 6, 7 — one gap, one id | line, what is unauthored or not computable, the failed dependency |
| `INVENTED` | 9, checking mode only | the candidate assertion, why nothing supports it |
| `COLLISION` | 6 | line, items, what each demanded, `decidedBy` |
| `RELATIONSHIP_CONFLICT` | 7 | the comparatives, operands, why nothing satisfies both, the authoring objects |

`TENSION` is not a failure (SD-27).

### 3.3 Refusal kinds — closed

`NO_AGGREGATE_FUNCTION`, `NO_MODIFIER_ORDER_RULE`, `MODIFIER_OPERATION_MISSING`, `RULE_NOT_EXECUTABLE`
(an authored modifier combination rule or a procedure value), `OPERAND_NOT_SCALAR`,
`VALUE_NOT_COMPARABLE`, `NOT_FILLABLE`, `UNBOUNDED_COUNT_FILL`, `LABEL_NOT_RULED`,
`REACHABILITY_NOT_RULED`, `PASS_DIVERGENCE`, `CHECK_NOT_EXECUTABLE`, `SELECTION_CONTRACT_MISMATCH`,
`INPUT_DEFECT`, `CONSERVATION_VIOLATION`. Adding one is a design change.

### 3.4 Labels

`NOT_REALIZED` and `VALID_ABSENCE` are ruled (20 September). A supporting existence item whose
cardinality check fails is outside what he approved `NOT_REALIZED` for, so it is `UNLABELLED` with one
`LABEL_NOT_RULED` refusal naming every such item.

### 3.5 Halts

Two only: the register fails its meta-schema, or `Versions` cannot be built. A stamped-halt result is
returned — never nothing.

---

## 4. `derived` / `open` / `failed`

- **`derived`** — entailed by contracts, the session or a citable standing decision, with support.
- **`open`** — a degree of freedom: bounds, authority, constraints, **no value**, in either mode.
- **`failed`** — no value, naming its records.

**Authority for `open` (SD-39).** *"OPEN is an explicitly authorized degree of freedom within an
already-supported property, not a synonym for unknown."* A line is open only if, in order: its existence
is supported; its choice space is supported — a `fillable` entry, now register data describing the space,
or an authored range; selected knowledge neither determines nor further constrains it; no standing rule
determines it. Fail any and it is a gap.

| `openKind` | Verdict | `permittedBy.authority` | Bounds |
|---|---|---|---|
| `PERMITTED_CHOICE` | `FREE(choice)` | SD-39, with the row's `fillable` text | intersection of the constraints' bounds |
| `BOUNDED_QUANTITY` | `FREE(a)` | SD-39, with the authoring item's range | the authored interval |
| `COACH_JUDGEMENT` | `FREE(b)` | SD-15 | `QUALITATIVE`, with the authored words; no number |

`T2` and `J3` cite SD-39 where their properties and choice spaces are independently supported. P-4 and
SD-R2 are no longer authorities anywhere.

---

## 5. Support, declarations and SD-10

**Support is knowledge entailment**: an item that entails or narrows, a citable standing decision, or the
session. `ASSUMED` bounds but never entails; engine wording supports nothing; **a candidate value is
never support**.

| Declaration | In corpus | Effect |
|---|---|---|
| `NON_CLAIMED` | 502 | constrains nothing; permits openness; supports nothing |
| `CLAIMED` | 129 | items address the row |
| `UNDECLARED` | 122 | never examined; bars openness (AM-04); reason code *coverage* |
| `NOT_AUTHORED` | 85 | needed and unauthored; reason code *declared gap* |
| `EXCLUDED` | 22 | an exclusion item forbids something |

A declaration survives an empty scope (SD-31).

**SD-10 and SD-10a.** SD-10 prohibits removing a structurally necessary objective. **The engine never
removes anything**, so in derivation mode it is honoured by construction. It bites in checking mode, when
a candidate omits an objective the derivation derives: SD-10a's test is executed as — *the objective is
structurally necessary if a required item entails it, or if its absence makes `GA-ONE-PRIMARY-EVENT`,
`GA-DIRECTION`, `GA-TRANSITION-COHERENCE` or `GA-OBJECTIVE-SETS` fail*. Those four checks are exactly
"primary event, direction, transition, or representative configuration" in his wording. A necessary
objective the candidate omits is `ABSENT` against it and fails Gate B forward; a mere reference from
supporting knowledge is not sufficient, as he ruled.

---

## 6. Relationship evaluation

A comparison takes no line (SD-26); it is evaluated over its operands — a represented property, or a
derived quantity with supported inputs (SD-23). Effective value is not computable when an operation or
magnitude is unauthored, or when two modifiers apply without an authored order.

An unresolvable operand → unmet (required) or not evaluable (supporting), the dependency a `GAP`. Two
authoritative, well-formed, evaluable comparatives nothing satisfies → `RELATIONSHIP_CONFLICT`. An
assumed comparative → `TENSION`.

**Presently unexercised (SD-41):** zero `COMPARES` items across the 221-item corpus. Kept, tested, and
not expanded until a real authored requirement provides evidence.

---

## 7. Gate A and Gate B

### 7.1 Verdicts

`GateReport` is defined in §1.8. The gate input is `resolution` plus the audit **without tensions** —
SD-27 made unrepresentable. In derivation mode `gateBReverse.verdict` is `NOT_APPLICABLE`, never a
`PASS` it has not earned.

**FAIL** if any check failed; otherwise **PASS** if every check is `PASS` or `NOT_CHECKABLE`; otherwise
**NOT_EVALUABLE**. Rendering requires `PASS`, and renders a realized game checked in checking mode —
never a derivation-mode result, whose free properties have no value yet.

**`NOT_CHECKABLE` is used only where he has already ruled something outside the representation.** An
unexecutable clause of a Gate A check is **not** `NOT_CHECKABLE` today: it is `NOT_EVALUABLE`, which
blocks, until he rules on §11.2. *(Revision 2 silently treated those clauses as `NOT_CHECKABLE` while
asking him to decide — the sweep caught it.)*

A check depending on an open or conditional line asks **satisfiability**: SAT passes with `pendingOn`;
UNSAT fails.

### 7.2 Gate A — the checks

| Check | Asserts | Executable |
|---|---|---|
| `GA-ROSTER-SUM` | outfield + goalkeepers + neutrals = the session's players | yes |
| `GA-ENVELOPE-FIT` | every region and object inside the area, non-empty | yes |
| `GA-LAYOUT-FEASIBLE` | the geometric constraints over open lines are jointly satisfiable | yes — linear feasibility over exact rationals |
| `GA-REGION-FUNCTION` | every instantiated region serves a supported function | yes |
| `GA-REFERENCE-INTEGRITY` | every reference names a held element; no reference defect implicates it | yes |
| `GA-TRIGGER-UNIQUE` | no two transitions share a trigger key; none collides | yes |
| `GA-TRANSITION-COHERENCE` | `CONTINUE` ⇒ no placement; `STOP_RESUME` ⇒ taker and region | yes |
| `GA-INFORMATION` | information rules name held subjects and registered triggers | yes |
| `GA-TIME-WINDOWS` | window fields in vocabulary; duration inside the session | yes |
| `GA-NO-FAILED-LINE` | no enumerated line is `failed` | yes |
| `GA-EFFECT-TYPED` | consequences typed, referents unique … *"in every state its trigger can fire from"* | **partial** |
| `GA-ONE-PRIMARY-EVENT` | one primary event, reference resolving … *"whenever it can fire"* | **partial** |
| `GA-DIRECTION` | opposed objectives per team … *"stable, perceivable"* | **partial** |
| `GA-OBJECTIVE-SETS` | assignment triggers map to rules … *"while the set is in scope"* | **partial** |
| `GA-MODIFIER-OVERLAP` | concurrent modifiers exclusive or covered by a rule | **partial** — no test for `object` or `event` conditions |
| `GA-RESIDUAL-SPACE` | residual space not instantiated | **none** |

### 7.3 Gate B

**Forward:** every admitted item's `ForwardResult`, with every item of every loaded contract counted and
none dropped. **Reverse:** checking mode only, stage 9's remainder step. Neither re-derives.

---

## 8. Determinism and versions

**Reporting order and semantic order are kept apart.** Reporting order is fixed and total: lines by
`(rowOrdinal, elementId, member)`, then item, then contract; records by subject, then kind rank.
**Semantic order comes only from authored knowledge or a ruling; where it is missing the engine
refuses.** A canonical sort used to break a semantic tie would be the hidden selection policy SD-35
forbids — AM-05 rules out "the first matching element" for the same reason. Classes (§2.3) are named by
their item, so no ordering is involved in deciding which exist.

Byte-identical output on repeat and under shuffled input, except the authored member order inside a value
set (AM-11), which is emitted as authored. Exact rationals throughout. Ids content-derived. Every version
stamped; an unstamped result is refused.

---

## 9. The refusal-centred test plan

| Layer | Asserts |
|---|---|
| **1. Refusal coverage** *(primary)* | one test per refusal in §2.2 and §3.3 |
| **2. Invariants** | **D1** conservation: every enumerated line appears once, with a `lineState`. **D2** determinism, including shuffle. **D3** no `open` entry has a value. **D4** for `COUNT`, `INTERVAL` and `SET` bounds, `bounds` equals the intersection of `constraints[].bound`; for `QUALITATIVE`, every constraint carries the same canonical term, or the line carries a `VALUE_NOT_COMPARABLE` refusal. **D5** no collision or conflict on a line with a gap. **D6** `GateInput` contains no `Tension`, and gate output is identical whatever tensions exist. **D7** fully stamped. **D8** no field outside §1.8's records, and none named for advice. **D9** in derivation mode every `derived` line has knowledge support. **D10** `resolution` is byte-identical with and without a `CandidateGame`, plus five tests: a candidate value cannot make a line derived, cure a gap, supply support, satisfy an unsupported dependency, or resolve a collision or conflict |
| **3. Ruling conformance** | one test per standing decision bearing on derivation, including the three that overturned rules of mine |
| **4. Golden regression** | the eight contracts and the slice game — **fixtures, not validation** (SD-30) |
| **5. Pre-registration** | expected outcome committed before any new run |

---

## 10. The design choices that are mine

| # | Choice | Chosen | Rejected |
|---|---|---|---|
| 1 | Gate verdict | three-valued | collapsing `NOT_EVALUABLE` into `FAIL` |
| 2 | Open line in a gate check | satisfiability | treating it as unevaluable — makes SD-35 vacuous |
| 3 | Record ids | content-derived | emission order |
| 4 | Numbers | exact rationals | decimals — could not support §7.2's feasibility check |
| 5 | Candidate results | a separate array | on the resolution — would let a candidate appear to resolve a line |
| 6 | Elements in derivation | one **class** per existence item, never merged | minting individual handles and merging them — the merge had to guess whenever a selector used `IN`; reading elements from the candidate — makes the candidate an authority |
| 7 | Candidate matching | each candidate element belongs to every class whose selector it satisfies | a pairing of candidate elements to engine elements — asserts an identity nothing authorizes |
| 8 | Governing line open or failed | conditional, or a gap | withdrawing — treats an unresolvable condition as false |
| 9 | Reason codes | *declared gap* where a `NOT_AUTHORED` declaration reaches; *coverage* where only `UNDECLARED` does | leaving them undefined — the convention every derivation has used |
| 10 | Divergent lines | failed, neither pass adopted | keeping either pass — SD-42 forbids it |

---

## 11. What he asked to have surfaced

### 11.1 Contradictions introduced by these rulings

**Two in the package, both resolved.** Revision 1's checking mode let a candidate make a line `derived`
via `REALIZATION`, contradicting SD-40; checking mode now writes nothing to the resolution. And
`RESOLVED:NARROWED_CHOICE` could no longer be a line verdict; its name moves to the candidate-check
outcome, and the line verdict becomes `FREE(choice)` — which also keeps the four Game statuses
unchanged, since revision 2 had briefly introduced an `OPEN` verdict outside them.

**Six more in the live specifications, found by the sweep and all fixed:** P-4 and SD-R2 still named as
authorities in the representation spec's body and the derivation spec's transitions rule; the line
*"silence licenses a choice"*, the direct opposite of SD-39; `RESOLVED` still reachable by a free choice;
Gate B reverse described as applying to every game; and `NOT_REALIZED` still called a proposal.

**One that mattered more than the rest:** SD-13's register condition fired on a start method with verdict
`NARROWED_CHOICE`. Under SD-40 that is a candidate outcome, so **a candidate game could have switched a
standing decision on** — exactly the unsupported dependency he forbade. It now fires only on a derived
value.

### 11.2 Decisions that must be made before implementation — two

**1. The six Gate A checks that cannot be fully executed** (§7.2). Four quantify over states of play the
representation deliberately does not hold; one lacks a test for two condition types; one has no
executable form. Until he rules, those clauses are `NOT_EVALUABLE` and block — the engine refuses rather
than guesses. The options:
- **(a) Recommended:** the unexecutable clause becomes `NOT_CHECKABLE`, reported, non-blocking — the
  boundary he already drew for requirements outside the representation, applied to the gate's own
  wording;
- **(b)** it stays `NOT_EVALUABLE` and blocks — no game carrying those features can pass;
- **(c)** the specification's wording is narrowed to the structural part.

`GA-RESIDUAL-SPACE` needs a definition of residual space, or removal, under any option.

**2. What "reachable" means in AM-15.** His adopted rule says reachable triggers exist by construction,
but nothing defines reachable. §2.4 proposes one: **a trigger is reachable when its structural
prerequisite is derived**. It is mine and needs his yes or his correction. **Until he rules, the engine
refuses** (`REACHABILITY_NOT_RULED`): a trigger element exists only where an item entails it, and the
transitions that depend on reachability fail as visible gaps. Both decisions therefore have a
refusing default — neither can be implemented around by guessing.

### 11.3 Points where an implementer would otherwise invent semantics

**None, provided 11.2 is settled — and this claim has now been tested twice.**

- **First sweep, of revision 2:** found six invention points, plus stale contradictions in the live
  specifications and records the package used without defining. All fixed in revision 3.
- **Second sweep, of revision 3:** zero contradictions with the new rulings and zero rules without an
  implementation home — but two consistency defects and five invention points remained. All confirmed
  against the files, all fixed here:
  - **Element identity** — revision 3 merged element handles across items, which had to guess whenever a
    selector used `IN`. Replaced by one class per existence item, never merged (§2.3).
  - **Matching a candidate** — candidate elements are assigned to every class whose selector they
    satisfy, with no pairing of individuals (§2.5).
  - **Value forms the register permits but the value model did not cover** — qualitative terms, "where
    the ball went out", open role names, and procedures (§1.9; procedures are refused, and none exists in
    the corpus).
  - **Gate B reverse in derivation mode** had no representable verdict — now `NOT_APPLICABLE` (§1.8).
  - **Qualitative bounds** had no intersection rule — now equality on the canonical term, or a refusal.
  - **Reachability** had no refusing default — now it does (above).

The second sweep also said the package claimed one decision rather than two; that compared against an
out-of-date brief, and revision 3 already said two. Revision 4 has not been swept a third time.

---

## 12. What this package does not do

It does not define the downstream choice process or the recovery policy. It proposes no grammar extension
for the six unrepresentable cases (SD-38). It does not reinterpret the four nonconforming
`BUILD_OUT_EPISODE` uses (SD-36). It repairs no contract. **It implements nothing until he confirms it.**
