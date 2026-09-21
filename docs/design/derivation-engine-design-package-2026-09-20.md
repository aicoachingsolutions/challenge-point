# The derivation engine — design package, revision 2

**21 September 2026. Design only. Implementation stays frozen until Christian confirms this package.**
Generation remains frozen. No code exists.

Revision 2 incorporates his rulings of 21 September: SD-39 (the authority for OPEN), SD-40 (two modes;
the candidate game is evidence, never authority), SD-41 (comparatives presently unexercised) and SD-42
(what a restricted computation may do). He asked for the package to be finished with those decisions in
it, and to surface only three things. **They are in §11**, and the short answer is: two contradictions
his rulings introduced, both resolved here; one decision genuinely his before implementation; and no
point left where an implementer must invent semantics, because every remaining gap is a refusal.

This supersedes the direction document (`derivation-engine-design-2026-09-20.md`) where they differ.

---

## 1. Inputs and outputs

### 1.1 The call

```
derive(input: DerivationInput) -> DerivationResult
```

A pure function. No I/O, no clock, no randomness, no ambient state.

### 1.2 `DerivationInput`

| Field | Meaning |
|---|---|
| `selection` | the selected knowledge objects: `{ objectId, knowledgeVersion }[]` |
| `contracts` | one `LoadedContract` per selected object, loaded whole |
| `envelope` | the session's players, area dimensions and duration — the `SESSION` source |
| `register` | the register as versioned data: rows, `ownerRow`, `fillable`, `applicability`, `vocabularies` with versions, `selectorSyntax`, `relativeTerms`, `teamDesignations`, `comparison`, `decidingRules`, `citableStandingDecisions` |
| `derivationRules` | `{ version, adoptedLabels[] }` — which still-proposed labels are ruled (§3.4) |
| `candidate` | **optional.** A `CandidateGame`. Its presence selects checking mode (§1.5) |

### 1.3 `DerivationResult`

```
DerivationResult {
  versions   : Versions
  resolution : ResolutionEntry[]
  audit      : Audit
  gates      : { gateA, gateBForward, gateBReverse : GateReport }
  candidate  : CandidateCheck[] | null     // checking mode only
  failures   : FailureRecord[]
  refusals   : RefusalRecord[]
  run        : RunReport
}
```

**A result is always returned.** A failure to stamp versions returns a stamped-halt result (§3.5), never
an absence.

**`resolution` never depends on `candidate`.** It is computed first, from authoritative knowledge only,
and is byte-identical in both modes for the same authoritative input. `candidate` is a separate array
that reads the resolution and writes nothing back to it. That is SD-40's order made structural:
*derive from authoritative knowledge → optionally check a candidate game.* (Invariant D10, §9.)

### 1.4 `ResolutionEntry`

| Field | Present | Meaning |
|---|---|---|
| `lineId` | always | `<elementId or 'game'>::<row>[::<member>]`. One id; there is no separate `propertyId` |
| `elementId` | always | `null` for the 13 game-level rows with no `ownerRow` |
| `row` / `member` | always / when set-valued | the register row; the member key for a per-member line |
| `state` | always | `derived` · `open` · `failed` |
| `verdict` | always | `RESOLVED:ENTAILED`, `FREE(a)`, `FREE(b)`, `NOT_AUTHORED`, `UNRESOLVED`, `INVENTED`, or `OPEN`. **`RESOLVED:NARROWED_CHOICE` is not a resolution verdict** — under SD-40 it is the outcome of a candidate check (§1.5) |
| `reason` | iff `NOT_AUTHORED` | AM-23's codes in his order, with *declared gap* and *coverage* defined in derivation spec §2 |
| `value` | iff `derived` | typed by the row's registered value type |
| `bounds` | iff `open` | the supported bounds of variation. `null` is legitimate for a qualitative bound (SD-15) |
| `permittedBy` | iff `open` | the authority permitting openness — §4.2 |
| `constraints` | iff `open` | every applicable in-scope constraint with its source |
| `openKind` | iff `open` | `PERMITTED_CHOICE` · `BOUNDED_QUANTITY` · `COACH_JUDGEMENT` |
| `resolvedBy` | iff `derived` | `ENTAILMENT` · `STANDING_DECISION` · `SESSION`. **No `REALIZATION`**: a derived value is never a choice |
| `support` | always (`[]` unless derived) | what **validly supports** the value — knowledge entailment only |
| `lineOutcome` | when it applies | `VALID_ABSENCE` (checking mode only) |
| `failureIds` / `refusalIds` | when any | the records explaining it |

### 1.5 Two modes (SD-40)

| | **Derivation mode** (no candidate) | **Checking mode** (candidate supplied) |
|---|---|---|
| Derivation | from authoritative knowledge | **identical** — the same derivation, byte for byte |
| Emits | `derived` / `open` / `failed` | the same, **plus** a `CandidateCheck` per candidate assertion |
| Forward and gate evaluation | the applicable forward results; Gate A; Gate B forward | the same, plus the checks against the candidate |
| Gate B reverse | **not applicable** — no candidate asserts anything, so there is nothing to trace back | the real reverse trace |
| `INVENTED` | **not applicable** | detected: a candidate asserts structure no source supports |
| `VALID_ABSENCE` | not decidable | decidable |

**The boundary, in his words:** *"The candidate game is evidence to be checked, never authority used to
complete derivation."* A candidate value **cannot** turn `open` into `derived`, cure a `GAP`, supply
missing support, satisfy an otherwise unsupported dependency, or resolve an authoritative collision or
relationship conflict. Each of those five is a test (§9, D10).

```
CandidateCheck { lineId, asserted: Value | ABSENT, outcome, provenance, failureIds[] }
```

| `outcome` | When |
|---|---|
| `MATCHES_DERIVED` | the line is `derived` and the candidate states the same value |
| `CONTRADICTS_DERIVED` | the line is `derived` and the candidate states something else |
| `WITHIN_BOUNDS` | the line is `open` and the candidate's value lies inside the authorized bounds — **this is what `RESOLVED:NARROWED_CHOICE` now names**. Provenance: `DOWNSTREAM_CHOICE` |
| `OUTSIDE_BOUNDS` | the line is `open` and the value lies outside them |
| `ON_FAILED_LINE` | the line is `failed`; the candidate's value is recorded and **changes nothing** |
| `INVENTED` | the candidate asserts a line the derivation did not enumerate, or structure no source supports |
| `ABSENT` | the candidate states nothing for a line that requires a value — `VALID_ABSENCE` where §8 permits it |

`provenance` is `KNOWLEDGE` for `MATCHES_DERIVED`, and `DOWNSTREAM_CHOICE` for `WITHIN_BOUNDS` — the
`REALIZATION` source kind, retained as provenance and never as support. That keeps the four source kinds
of the representation unchanged while honouring SD-40.

### 1.6 `Versions`

```
Versions { register, vocabularies: {<list>: version}, derivation, engine,
           contracts: [{id, version}], objects: [{id, version}] }
```

Compared verbatim, never parsed. A stored result is valid only for the versions it names; when any
changes, it is stale by construction and is re-derived rather than reused (SD-30).

### 1.7 What is never an output

No re-selection, no weakened requirement, no decision about how many activities to return, no contract
repaired — Wide Zone's scope included — no coach-facing text, no render-fidelity verdict, and no recovery
policy. **No record carries a suggestion, recommendation, repair or retry field.** *Derivation
diagnoses; it does not design* (SD-37).

---

## 2. The twelve-stage pipeline

**Five invariants across all twelve.** No stage halts on a finding. Single pass, with exactly three
declared bounded iterations. Three-valued logic — true, false or undetermined, and undetermined is never
rounded to false. Every collection sorted by the canonical key before iteration. No stage after 6 writes
a value onto a line.

### 2.1 The three restricted computations (SD-42)

**His constraint:** *"A restricted computation may establish prerequisites for full derivation, but may
not create additional authority or broaden the set of potentially entailed elements."*

| # | Circularity | Restricted computation | Why it cannot broaden or authorize |
|---|---|---|---|
| 1 | Own involvement is *the elements entailed by the contract's other-scoped items* (AM-13), but entailment is stage 5 and scope is stage 3 | derive over that contract's **other-scoped items only**, fix the own-involvement set, then derive fully | it runs a strict subset of the contract's items, so it can reach no element the full derivation could not |
| 2 | `T2`–`T5` apply only when `T6` is `STOP_RESUME`, and `V14b`/`V14c` only on a given `V13` effect, but those governing values are derived at stage 5 | enumerate the conditional lines as `PENDING`, re-check at stage 6 | it can only **withdraw** a line, never add one |
| 3 | A standing decision fires only on a line already entailed or legitimately chosen, but decisions supply values before verdicts exist | a monotone closure over the citable decisions | it applies only authority that is already citable, and only adds support that the decision already carries |

**Divergence is a defect, not a choice.** Each computation is checked against the full derivation. Where
they disagree on a line, **neither result is adopted**: the line is `failed`, naming a
`PASS_DIVERGENCE` refusal; `run.divergent` is set; the run continues so the report survives. In his
words: *"Divergence is a defect/refusal, not an invitation to choose one pass."* The residual
standing-decision risk is not pursued further unless a concrete case demonstrates it, as he directed.

### 2.2 The stages

| # | Stage | Does | Refuses |
|---|---|---|---|
| 0 | **Load** | Validates the register's meta-schema; indexes rows, `ownerRow`, `rowOrdinal`, `fillable`, `applicability`, `vocabularies`, `selectorSyntax`; validates each contract against the register **as data** | An unknown row, requirement kind, operator, scope, basis, declaration kind, derived-operand rule or vocabulary value; a missing basis quote; a comparative with exclusion strictness; a magnitude with no declared operation. **Whole contract; the run continues** |
| 1 | **Normalise** | Resolves every structural reference — selectors *and* values — through registered identity (SD-32), attribute names taken whole including dots; records each selector's denotation | Anything that will not resolve: a `REFERENCE_DEFECT` with the text verbatim. No meaning-matching, no inferred element, no AM-17 rewrite |
| 2 | **Index** | One line per (element, row), per member for set-valued rows, and only where the row applies; conditional lines enumerated `PENDING` | Omitting a line because no value is stated; a line for a `VIEW` row |
| 3 | **Scope** | Fixes each contract's application set, including `BUILD_OUT_EPISODE` (SD-36); own involvement by restricted computation 1; declarations held beside items (SD-31) | An own-involvement item reaching what it itself entails |
| 4 | **Reach** | Row equality plus selector satisfaction, against the owning collection's attributes for a field row | — |
| 5 | **Derive** | Entailment, bounds, cardinality by necessity, standing decisions by restricted computation 3, openness under SD-39 | Openness on a row with no structurally defined choice space; a count fill with no authored maximum |
| 6 | **Classify** | One verdict per line; resolves `PENDING` applicability; **gap before collision** (SD-28) | — |
| 7 | **Relationships** | Comparatives over their operands, never onto a line (SD-26) | A multi-element operand (unconditionally — no aggregate function is named); a range or open operand; two modifiers with no authored order; a modifier with no declared operation |
| 8 | **Forward** | Per item: satisfied, violated, unmet, adapted, inert, not checkable, not evaluable, `NOT_REALIZED`, `PENDING_CHOICE` | A failed supporting cardinality check: `UNLABELLED` with `LABEL_NOT_RULED` (§3.4) |
| 9 | **Candidate** | **Checking mode only.** Reads the finished resolution and emits a `CandidateCheck` per assertion; the reverse trace and `INVENTED` detection live here | Writing anything back to `resolution` — enforced, not advised |
| 10 | **Gates** | Gate A and Gate B, each where independently evaluable (§7) | A check it cannot evaluate: `NOT_EVALUABLE`, naming its subjects |
| 11 | **Emit** | Sorts canonically, stamps every version | An `open` entry carrying a value; an unstamped result |

---

## 3. Typed failure records

### 3.1 Two arrays

`failures[]` hold findings about **the knowledge or the data**, closed by authoring. `refusals[]` hold
findings about **the rule set** — "the specification names no rule here, so the engine declined" —
closed by a ruling. That is why `LOAD_REFUSAL` is a failure: a contract that fails validation is a
defect in the data.

```
FailureRecord { failureId, kind, stage, locus: { lineId?, itemRef?, contractId? },
                implicated: { contractIds[], objectIds[] }, clause, offendingInput?, detailRef?, detail? }
RefusalRecord { refusalId, kind, cause, stage, clause, openQuestion: { clause, quote } | null,
                affects: { lineIds[], itemRefs[], contractIds[] }, failureRef? }
```

**Ids are content-derived** — `<kind>#<locusKey>#<ordinal>` — so an unrelated record never renumbers the
rest and an SD-30 comparison between two runs stays meaningful. Refusals are deduplicated by
`(kind, cause)` and name everything they affected. A refusal fails a line only where it made that line
uncomputable.

### 3.2 The six kinds

| Kind | Raised | Carries |
|---|---|---|
| `LOAD_REFUSAL` | stage 0 | contract, offending field and value, the rule violated |
| `REFERENCE_DEFECT` | stage 1 | contract, item, `where: selector \| value`, **the text verbatim**, why it would not resolve |
| `GAP` | stages 2, 5, 7 — one gap, one id | line, what is unauthored or not computable, the dependency that failed |
| `INVENTED` | stage 9, **checking mode only** | the candidate assertion, and why no source supports it |
| `COLLISION` | stage 6 | line, the items, what each demanded, `decidedBy` (null when nothing decided) |
| `RELATIONSHIP_CONFLICT` | stage 7 | the comparatives, operands as resolved, why nothing satisfies both, the authoring objects |

`TENSION` is **not** a failure: an assumed item sitting oddly against authored knowledge (SD-27). No gate
reads it, enforced by the gate input not containing it.

### 3.3 Refusal kinds — a closed list

`NO_AGGREGATE_FUNCTION`, `NO_MODIFIER_ORDER_RULE`, `MODIFIER_OPERATION_MISSING`, `OPERAND_NOT_SCALAR`,
`NOT_FILLABLE`, `UNBOUNDED_COUNT_FILL`, `LABEL_NOT_RULED`, `PASS_DIVERGENCE`, `CHECK_NOT_EXECUTABLE`,
`SELECTION_CONTRACT_MISMATCH`, `INPUT_DEFECT`, `CONSERVATION_VIOLATION`. Adding one is a design change.

### 3.4 Labels

`NOT_REALIZED` and `VALID_ABSENCE` are ruled (20 September). The one adjacent case his ruling does not
reach — a **supporting existence item whose cardinality check fails** — takes `UNLABELLED` with a single
`LABEL_NOT_RULED` refusal naming every affected item. The engine does not stretch a ruled label to cover
an unruled case.

### 3.5 When stamping fails

Two halt conditions, both "the engine cannot name what it is talking about": the register fails its
meta-schema, or the `Versions` block cannot be built. Stages 1–11 are skipped and a stamped-halt result is
returned — never nothing.

---

## 4. `derived` / `open` / `failed`

### 4.1 The three states

- **`derived`** — entailed by contracts, the session or a citable standing decision, carrying support.
- **`open`** — a degree of freedom SD-39 authorizes: bounds, authority, constraints, **no value**. No code
  path moves a line from open to derived, in either mode.
- **`failed`** — no value, naming its records.

### 4.2 The authority for OPEN (SD-39)

*"OPEN is an explicitly authorized degree of freedom within an already-supported property, not a synonym
for unknown."* So `open` requires, in order: the property's existence is supported; its choice space is
supported — a `fillable` entry, which under SD-39 is register data describing the space, or an authored
range; selected knowledge neither determines nor further constrains the value; and no standing rule
determines it. Fail any one and the line is not open — it is a gap.

| `openKind` | Filled by | `permittedBy` | Bounds |
|---|---|---|---|
| `PERMITTED_CHOICE` | downstream governed choice (SD-35) | **SD-39**, plus the row's `fillable` entry | intersection of applicable constraints |
| `BOUNDED_QUANTITY` | downstream choice, or rendered as a range | **SD-39**, plus the authoring item's range (`FREE(a)`) | numeric, from authored bounds |
| `COACH_JUDGEMENT` | the coach, at delivery | **SD-15** | `null` — no number is invented |

`T2` (starting team) and `J3` (end assignment) cite SD-39 where their properties and choice spaces are
independently supported — the rejected SD-R2 and the unruled P-4 are no longer authorities anywhere.

---

## 5. Support and declarations

**Support is knowledge entailment, derived never asserted**: a contract item that entails or narrows, a
citable standing decision, or the session. `ASSUMED` bounds but never entails; engine wording supports
nothing. **A candidate value is never support** (SD-40). `sources` (everything addressing a row) lives in
the audit; `support` (what validly supports the value) lives on the resolution entry — one home each.

| Declaration | Count in corpus | What it does |
|---|---|---|
| `NON_CLAIMED` | 502 | says nothing, constrains nothing; permits openness, supports nothing |
| `CLAIMED` | 129 | items address the row |
| `UNDECLARED` | 122 | never examined; bars openness (AM-04); reason code *coverage* |
| `NOT_AUTHORED` | 85 | needed and unauthored; reason code *declared gap* |
| `EXCLUDED` | 22 | an exclusion item forbids something |

**A declaration survives an empty scope** (SD-31): *"authored intention that could not reach an element ≠
structure nobody authorized."*

---

## 6. Relationship evaluation

A comparison **takes no line** (SD-26); it is evaluated over its operands. Operands are a represented
property, or a derived quantity whose inputs are supported (SD-23); `effectiveValue` is the one derived
rule. Effective value is **not computable** when an operation or magnitude is unauthored, or when two
modifiers apply without an authored order — the operations do not commute.

Outcomes, in order: an operand that will not resolve → unmet (required) or not evaluable (supporting),
the dependency a `GAP`; two authoritative, well-formed, evaluable comparatives nothing satisfies →
`RELATIONSHIP_CONFLICT`; an assumed comparative → `TENSION`, diagnostic only.

**Presently unexercised (SD-41).** Zero `COMPARES` items exist across the 221-item corpus. The capability
and its tests are kept; nothing is expanded or optimized until a real authored requirement provides
evidence for it.

---

## 7. Gate A and Gate B

### 7.1 Verdicts

```
GateReport { verdict: PASS | FAIL | NOT_EVALUABLE,
             checks: [{ checkId, verdict: PASS|FAIL|NOT_CHECKABLE|NOT_EVALUABLE,
                        subjects, why, pendingOn, blockedBy }] }
```

**FAIL** if any check failed; otherwise **PASS** if every check is `PASS` or `NOT_CHECKABLE`; otherwise
**NOT_EVALUABLE**. Rendering requires `PASS`. Both gates run where independently evaluable. The gate input
excludes tensions.

**An open line poses a satisfiability question.** A check depending on an open line asks whether *any*
permitted value passes it: SAT passes with `pendingOn` naming the open lines; UNSAT fails, because no
permitted choice can rescue it. Any other reading makes SD-35 vacuous.

### 7.2 Gate A — the check catalogue

Each assertion is the specification's; the decomposition into checks is mine.

| Check | Asserts | Executable |
|---|---|---|
| `GA-ROSTER-SUM` | outfield plus goalkeepers plus neutrals equals the session's players | yes |
| `GA-ENVELOPE-FIT` | every region and object lies inside the area, non-empty | yes |
| `GA-LAYOUT-FEASIBLE` | the joint geometric constraints over open lines are satisfiable | yes — linear feasibility over exact rationals |
| `GA-REGION-FUNCTION` | every instantiated region serves at least one supported function | yes |
| `GA-REFERENCE-INTEGRITY` | every reference names an element the game holds, and no reference defect implicates it | yes |
| `GA-TRIGGER-UNIQUE` | no two transitions share a trigger key; no transition line collides | yes |
| `GA-TRANSITION-COHERENCE` | `CONTINUE` means no placement; `STOP_RESUME` means taker and region present | yes |
| `GA-INFORMATION` | information rules name existing subjects and registered triggers | yes |
| `GA-TIME-WINDOWS` | window fields in their vocabularies; duration inside the session | yes |
| `GA-NO-FAILED-LINE` | no resolution line is `failed` | yes |
| `GA-EFFECT-TYPED` | every consequence is typed and its referent resolves uniquely … *"in every state its trigger can fire from"* | **partial** |
| `GA-ONE-PRIMARY-EVENT` | exactly one primary event, whose reference resolves … *"whenever it can fire"* | **partial** |
| `GA-DIRECTION` | each team has an objective, at opposite ends … *"stable, perceivable"* | **partial** |
| `GA-OBJECTIVE-SETS` | assignment triggers map to rules … *"while the set is in scope"* | **partial** |
| `GA-MODIFIER-OVERLAP` | modifiers that can hold at once are exclusive or covered by a rule | **partial** — no test for `object` or `event` conditions |
| `GA-RESIDUAL-SPACE` | residual space is not instantiated | **none** |

**The six partial or unexecutable checks are §11's one remaining decision.** Four of them quantify over
states of play — "in every state its trigger can fire from", "whenever it can fire", "stable,
perceivable", "while the set is in scope" — and the representation deliberately holds no state of play.
The structural part of each is executable; the play-state clause is not, and cannot be without adding
what he has kept out. `GA-MODIFIER-OVERLAP` has no test for two of its three condition types, and two
corpus items use them. `GA-RESIDUAL-SPACE` has no executable form at all.

### 7.3 Gate B

**Forward:** every support-capable item's requirement is met, reported per item with the §7 results; the
denominator counts every item of every loaded contract, and none is dropped. **Reverse:** checking mode
only — every candidate assertion traced to a support-capable source, or it is `INVENTED`. Neither
re-derives; both read stages 5–9.

---

## 8. Determinism and versions

**Reporting order and semantic order are kept apart, and the engine never substitutes one for the
other.** Reporting order — how records are sorted and iterated — is fixed here, totally and
mechanically: lines by `(rowOrdinal, elementId, member)`, then item id, then contract id; records by
subject, then kind rank. Semantic order — an order that changes the answer — comes only from authored
knowledge or a ruling, and where it is missing the engine **refuses**. A canonical sort used to break a
semantic tie would be exactly the hidden selection policy SD-35 forbids, arrived at by accident; AM-05
rules out "the first matching element" for the same reason.

- Two runs on the same input are byte-identical; a shuffled input produces identical output.
- One deliberate exception: the member order inside an authored value set is data (AM-11), emitted as
  authored and excluded from the shuffle guarantee.
- **Exact rationals** throughout — no floating point, and no division that would lose exactness. *(This
  corrects revision 1, which chose decimals with division refused; that could not support the
  satisfiability check in §7.1, which is linear feasibility.)*
- Ids structural and content-derived, never positional.
- Every version stamped; an unstamped result is refused, because under SD-30 it asserts nothing.

---

## 9. The refusal-centred test plan

Nothing needs the model, the API or a generated activity.

| Layer | Asserts |
|---|---|
| **1. Refusal coverage** *(primary)* | one test per refusal in §2.2 and §3.3: the engine refuses, names the case, and continues |
| **2. Invariants** | **D1** conservation — every line once, in resolution or withdrawn. **D2** determinism, with the shuffle. **D3** no `open` entry carries a value. **D4** bounds recomputable from constraints. **D5** gap outranks collision. **D6** no gate reads a tension. **D7** fully stamped. **D8** no advice field anywhere. **D9** in derivation mode every `derived` line has non-empty knowledge support — the engine checking itself, not Gate B reverse. **D10 the candidate is evidence**: `resolution` is byte-identical with and without a candidate, and five dedicated tests assert a candidate value cannot turn open into derived, cure a gap, supply support, satisfy an unsupported dependency, or resolve a collision or conflict |
| **3. Ruling conformance** | one test per standing decision bearing on derivation, including the three that overturned rules of mine, so a drift back toward them fails loudly |
| **4. Golden regression** | the eight contracts and the slice game — **regression fixtures, not validation** (SD-30) |
| **5. Pre-registration** | expected outcome written and committed before any new run |

---

## 10. The design choices that are mine

| # | Choice | Chosen | Rejected |
|---|---|---|---|
| 1 | Gate verdict | three-valued; `NOT_EVALUABLE` distinct from `FAIL` | collapsing to `FAIL` |
| 2 | Open line in Gate A | satisfiability, with `pendingOn` | treating open as unevaluable — makes SD-35 vacuous |
| 3 | Record ids | content-derived | emission order |
| 4 | Reporting order | `(rowOrdinal, elementId, member)` | lexicographic on the id |
| 5 | Numbers | exact rationals | decimals with division refused — revision 1's choice, now corrected |
| 6 | Candidate results | a separate `CandidateCheck` array | recording them on the resolution — would let a candidate appear to resolve a line |
| 7 | `PENDING_CHOICE` | a distinct forward result | reusing "not evaluable" |
| 8 | Load granularity | whole contract | per record |
| 9 | Divergent lines | `failed`, naming the refusal | keeping either pass's verdict — SD-42 forbids it |

---

## 11. What he asked to have surfaced

### 11.1 Contradictions introduced by these rulings — two, both resolved here

**1. SD-40 contradicted revision 1's checking mode.** Revision 1 let a candidate's value make a line
`derived` with `resolvedBy: REALIZATION`, with `bounds` carried on that derived entry and a `REALIZATION`
entry in its support. That is precisely "turn OPEN into DERIVED" and "supply missing support". **Resolved:**
checking mode now writes nothing to the resolution; candidate results are a separate `CandidateCheck`
array; `REALIZATION` survives only as the provenance of a within-bounds choice, never as support — so the
representation's four source kinds are unchanged.

**2. SD-40 moves the `RESOLVED:NARROWED_CHOICE` verdict.** Derivation spec §2 listed it as a line verdict
for a legitimate stated choice. Under SD-40 a stated value resolves nothing, and in derivation mode no
value is stated at all. **Resolved:** the verdict keeps its meaning and becomes the candidate-check
outcome `WITHIN_BOUNDS`; an open line's resolution verdict is `OPEN`. Recorded in derivation spec §5.

Neither required a choice of his: both follow directly from SD-40's own words. Two further inconsistencies
were mine rather than his rulings', and are fixed: revision 1's numeric choice could not support its own
satisfiability check (§8), and derivation spec §7 still described `NOT_REALIZED` and `VALID_ABSENCE` as
proposals a month after he approved them.

### 11.2 Decisions that must be made before implementation — one

**The six Gate A checks in §7.2 that cannot be fully executed.** Four quantify over states of play the
representation deliberately does not hold; one lacks a test for two of its condition types; one has no
executable form. The engine can run each check's structural part. The question is what the rest means:

- **(a) Recommended:** the unexecutable clause is `NOT_CHECKABLE`, reported, and does **not** block Gate A.
  This is the boundary he already drew for requirements outside the representation, applied to the
  gate's own wording. Gate A then certifies *"this game can be coherently laid out and played as
  specified"* for everything the representation can express, and says plainly which clauses it could
  not examine.
- **(b)** the clause is `NOT_EVALUABLE` and blocks Gate A. No game carrying those features could pass.
- **(c)** the specification's wording for those invariants is narrowed to their structural part.

`GA-RESIDUAL-SPACE` needs a definition of residual space or removal, under any option.

### 11.3 Points where an implementer would otherwise invent semantics — none

Every remaining gap in the rules is now a **named refusal** with a closed kind (§3.3), not a place an
implementer must decide: the unnamed aggregate function, modifier order, a failed supporting cardinality
check's label, an unexecutable gate clause pending 11.2, and divergence between passes. **Once 11.2 is
settled, I see no point in this package where implementation would require inventing semantics.**

---

## 12. What this package does not do

It does not define the downstream choice process or the recovery policy — both deferred by his explicit
instruction. It proposes no grammar extension for the six unrepresentable cases (SD-38). It does not
reinterpret the four nonconforming `BUILD_OUT_EPISODE` uses or derive replacements from the retired
sentence (SD-36). It repairs no contract. **It implements nothing until he confirms it.**
