# The derivation engine — design package for review

20 September 2026. **Design only. Implementation stays frozen until Christian reviews this package.**
Generation remains frozen. No code exists.

This is the package he asked for, covering the ten things he named. It supersedes the direction
document (`derivation-engine-design-2026-09-20.md`) where the two differ.

**Two things need his ruling before implementation** — §11. Everything else here is either his ruling
applied, or a design choice marked as mine in §10.

**On method, because it bears on how to read this.** The detail was drafted four ways in parallel and
then reconciled. That produced twenty-five places where two drafts specified the same record or rule
differently — ids, sort orders, the gate verdict, what `open` means. **Each is decided once here.**
Where a decision was not forced by one of his rulings, it is in §10 with the alternative. Where the
drafts disagreed about a fact in the artefacts, I counted it myself and the count is in the text.

---

## 1. Inputs and outputs

### 1.1 The call

```
derive(input: DerivationInput) -> DerivationResult
```

A pure function. No I/O, no clock, no randomness, no ambient state. Everything it reads is in `input`;
everything it concludes is in the result.

### 1.2 `DerivationInput`

| Field | Meaning |
|---|---|
| `selection` | the selected knowledge objects: `{ objectId, knowledgeVersion }[]` |
| `contracts` | one `LoadedContract` per selected object, loaded whole (§1.7) |
| `envelope` | the session's players, area dimensions, duration — the `SESSION` source |
| `register` | the register as versioned data: rows, `ownerRow`, `fillable`, `applicability`, `vocabularies`, `relativeTerms`, `teamDesignations`, `comparison`, `decidingRules`, `citableStandingDecisions` |
| `derivationRules` | `{ version, adoptedLabels[] }` — which of the still-proposed labels are ruled (§3.6) |
| `candidate` | **optional.** A `CandidateGame` to check. Its presence selects CHECK mode (§1.5) |

### 1.3 `DerivationResult`

```
DerivationResult {
  versions   : Versions
  resolution : ResolutionEntry[]
  audit      : Audit
  gates      : { gateA, gateBForward, gateBReverse : GateReport }
  failures   : FailureRecord[]
  refusals   : RefusalRecord[]
  run        : RunReport
}
```

**A result is always returned.** There is no input for which the engine returns nothing: a failure to
stamp versions returns a stamped-halt result (§3.7), not an absence.

### 1.4 `ResolutionEntry`

One per enumerated line that survives to emission.

| Field | Present | Meaning |
|---|---|---|
| `lineId` | always | `<elementId or the literal 'game'>::<row>[::<member>]`. **One id, not two** — `propertyId` is not a separate field |
| `elementId` | always | `null` for a game-level row (E1–E4, S1, SV1, P5, P6a, P6b, P7, DV1, V1, V2 — the 13 rows with no `ownerRow`) |
| `row` / `member` | always / when set-valued | the register row; the member key for a per-member line |
| `state` | always | `derived` · `open` · `failed` |
| `verdict` | always | the derivation spec §2 verdict: `RESOLVED:ENTAILED`, `RESOLVED:NARROWED_CHOICE`, `FREE(a)`, `FREE(b)`, `NOT_AUTHORED`, `UNRESOLVED`, `INVENTED`. `state` is a three-way collapse of these seven; **his rulings are written in the seven**, so both are carried |
| `reason` | iff `NOT_AUTHORED` | AM-23's codes in his order |
| `value` | iff `derived` | typed by the row's registered value type |
| `bounds` | iff `open`, and on `derived` when `resolvedBy = REALIZATION` | the legitimate bounds of variation (SD-35). **`null` is legitimate for a qualitative bound** — SD-15 forbids inventing a number where none is authored |
| `permittedBy` | iff `open` | the authority permitting the choice (SD-35) — see §11 E1 |
| `constraints` | iff `open` | every applicable in-scope constraint with its source (SD-35) |
| `openKind` | iff `open` | `PERMITTED_CHOICE` · `BOUNDED_QUANTITY` · `COACH_JUDGEMENT` |
| `resolvedBy` | iff `derived` | `ENTAILMENT` · `STANDING_DECISION` · `SESSION` · `REALIZATION` (the last only in CHECK mode) |
| `support` | always (`[]` when failed) | what **validly supports** the value — derived, never authored |
| `lineOutcome` | when it applies | `VALID_ABSENCE` or null. **On the resolution entry**, because a gate check reads it here |
| `failureIds` / `refusalIds` | when any | the records explaining a failure or an uncomputability |

### 1.5 Two modes

The approved direction listed no game as an input. But `INVENTED` is a failure kind, stage 9 traces
resolved properties back to their support, and derivation spec §4.6 and §4.7 are written about *a value
the game states*. **Those clauses have no subject unless a game can be an input.** Rather than drop
them, the game is optional:

| | **DERIVE** (`candidate` absent) | **CHECK** (`candidate` supplied) |
|---|---|---|
| Elements | provisional handles from existence items | the candidate's elements |
| `INVENTED` | **unreachable** — the engine states nothing, so it can invent nothing. Surplus is reported unsupported, with no `INVENTED` record | reachable, in §4.6's order |
| `resolvedBy: REALIZATION` | never | where a stated value is a legitimate choice |
| `VALID_ABSENCE` | not decidable — absence is not yet a fact | decidable (§8) |
| Gate B reverse | a **self-check**: a finding is an engine defect, not a knowledge defect | the real reverse check |
| When | between selection and the downstream choice process | after that process, and whenever a stored activity is re-derived under SD-30 |

The mode is inferred from the input, recorded in `run.mode`, and is not a caller-settable flag — a
caller cannot ask for check semantics without supplying something to check. **This changes a design he
approved, so it is §11 E2.**

### 1.6 `Versions`

```
Versions { register, vocabularies: {<list>: version}, derivation, engine,
           contracts: [{id, version}], objects: [{id, version}] }
```

Compared verbatim, never parsed. A stored result is valid **only** for the versions it names; when any
changes, the result is stale by construction and the engine re-derives rather than reusing it. That is
SD-30 made structural: *"No historical activity should be treated as retrospectively validated under
this newer specification merely because it passed an earlier audit."*

### 1.7 What is never an output

No re-selection, no weakened requirement, no decision about how many activities to return, no contract
repaired (including Wide Zone's scope), no coach-facing text, no render-fidelity verdict, and no
recovery policy of any kind. **No record carries a suggestion, recommendation, repair or retry field**
— SD-37: *derivation diagnoses; it does not design.* The absence is a test obligation (§9, D8), not a
matter of discipline.

---

## 2. The twelve-stage pipeline

**Five invariants hold across all twelve.**

1. **No stage halts on a finding.** Stages 1–11 always run unless stage 0 halts (§3.7).
2. **Single pass, with exactly three declared bounded iterations** — and no fixed-point search anywhere
   else. The three are in §2.1.
3. **Three-valued logic throughout.** Every predicate returns true, false or **undetermined**, and
   undetermined is never rounded to false. This is what "refuse rather than guess" looks like in code.
4. **Every collection is sorted by the canonical key before it is iterated**, not after. Determinism is
   structural, not a property of the emit stage.
5. **No stage after 6 writes a value onto a line.** Stages 7–11 read the resolution and write records.

### 2.1 The three circularities, and how each is broken

The approved direction found one. Working the stages out in detail exposed two more of the same shape.
All three are broken the same way — a restricted computation that cannot consult its own output,
followed by a check that the restriction changed nothing.

| # | The circularity | Broken by |
|---|---|---|
| 1 | Own involvement is *the elements entailed by the contract's other-scoped items* (AM-13), but entailment is stage 5 and scope is stage 3 | the **restricted pass**: derive over that contract's other-scoped items only, fix the set, then derive fully against a set that cannot grow |
| 2 | `T2`–`T5` apply only when `T6` is `STOP_RESUME`, and `V14b`/`V14c` only on a given `V13` effect — but those governing values are derived at stage 5 while lines are enumerated at stage 2 | **provisional enumeration** with `applicability: PENDING`, re-checked at stage 6; a line whose condition resolves false is `WITHDRAWN`, never `NOT_AUTHORED` |
| 3 | A standing decision fires only on a line already entailed or legitimately chosen (§4.8), but verdicts are stage 6 while standing decisions supply values at stage 5 | a **monotone closure**: a decision may only add support, never retract it, so the closure terminates and its order cannot matter |

Each carries a **divergence check**: the restricted result and the full result must agree on every line
the restricted pass judged. A disagreement sets `run.divergent`, raises a `PASS_DIVERGENCE` refusal, and
**does not abort** — aborting would destroy the report SD-33 exists to produce.

### 2.2 The stages

| # | Stage | Does | Refuses |
|---|---|---|---|
| 0 | **Load** | Validates the register against its own meta-schema; indexes rows, `ownerRow`, `rowOrdinal`, the 12 `fillable` entries, `applicability`, `vocabularies`; validates each contract against the register **as data** | An unknown row id, requirement kind, operator, scope, basis, declaration kind, derived-operand rule or vocabulary value; a missing basis quote; a comparative with exclusion strictness; a magnitude with no declared operation (SD-30). **Whole contract, and the run continues with the rest** |
| 1 | **Normalise** | Resolves **every structural reference** — in selectors *and* in item values — through registered identity, and records each selector's denotation before any derivation (SD-32) | Anything that will not resolve: a `REFERENCE_DEFECT` carrying the unresolvable text verbatim. **Nothing is matched by meaning; no intended element is inferred.** It also refuses to rewrite an authored selector or scope to exploit AM-17 |
| 2 | **Index** | Enumerates lines: one per (element, row), one per member for set-valued rows, **and only where the row applies** (`applicability`). A condition that cannot yet be evaluated enumerates as `PENDING` | Omitting a line because the game states no value — silence is judged, not skipped. Creating a line for a `VIEW` row |
| 3 | **Scope** | Fixes each contract's **application set** per scope, including `BUILD_OUT_EPISODE` (SD-36). Own involvement via the restricted pass. **Declarations are held beside the items, not inside them** (SD-31) | Iterating: the own-involvement set is fixed once and no ordering of contracts can change it. An own-involvement item reaching what it itself entails |
| 4 | **Reach** | Matches items to lines: row equality plus selector satisfaction, against the **owning collection's** attributes for a field row (`ownerRow`) | — |
| 5 | **Derive** | Per line: entailment, bounds, cardinality by necessity (§4.3), standing decisions (monotone closure), permitted free choice (§5) | A free choice on a row with no `fillable` entry, or a count fill with no authored maximum |
| 6 | **Classify** | One verdict per line, first that applies (§2); re-checks `PENDING` applicability; **gap before collision** (SD-28) | — |
| 7 | **Relationships** | Evaluates comparatives **over their operands**, never onto a line (SD-26) | A multi-element operand (no aggregate function is named — **unconditionally**, not only when values differ); an operand that is a range or an unfilled choice; effective value with two applicable modifiers and no authored order; a modifier with no declared operation |
| 8 | **Forward** | Per item: satisfied, violated, unmet, adapted, inert, not checkable, not evaluable, **`PENDING_CHOICE`** for an item blocked only by an `open` line | — |
| 9 | **Reverse** | Gate B reverse: every resolved property traced to a support-capable source | A `REALIZATION` support on a collection's existence line — SD-16: a free choice may not create structure |
| 10 | **Gates** | Gate A and Gate B forward and reverse. Both run where independently evaluable (SD-37) | A check it cannot evaluate: `NOT_EVALUABLE`, naming the subjects, never inferring |
| 11 | **Emit** | Assembles, sorts canonically, stamps every version | Emitting an `open` entry that carries a value; emitting an unstamped result |

---

## 3. Typed failure records

### 3.1 Two arrays, divided on what they are about

| | `failures[]` | `refusals[]` |
|---|---|---|
| A finding about | the knowledge or the data | **the rule set** |
| Says | "this contract, item or line is defective or unauthored" | "the specification names no rule here, so the engine declined to proceed" |
| Closed by | authoring or restating knowledge | a ruling, or a register change |

That division is why `LOAD_REFUSAL` sits under failures despite its name: a contract that fails
validation is a defect in the data, not a hole in the rules.

### 3.2 The common header

```
FailureRecord { failureId, kind, stage, locus: { lineId? , itemRef?, contractId? },
                implicated: { contractIds[], objectIds[] },
                clause: SpecClause, offendingInput?: string,
                detailRef?  // the audit body
                detail?     // inline, LOAD_REFUSAL only
              }
RefusalRecord { refusalId, kind, cause, stage, clause,
                openQuestion: { clause, quote } | null,
                affects: { lineIds[], itemRefs[], contractIds[] },
                failureRef? }
```

**Ids are content-derived**: `<kind>#<locusKey>#<ordinal>`, never assigned by emission order. An
unrelated record appearing must not renumber every other record, or an SD-30 comparison between two
runs becomes meaningless.

**Refusals are deduplicated by `(kind, cause)`** and name every line they affected, so the *size* of an
unruled question is visible rather than one refusal per line burying it.

**Does a refusal fail its lines?** Only where it made a line uncomputable — then each affected line is
`failed` with a `GAP`. A refusal about an item result (a label not yet ruled) leaves the line alone.

### 3.3 The six kinds

| Kind | Raised | Carries |
|---|---|---|
| `LOAD_REFUSAL` | stage 0 | the contract, the offending field and value, the register rule it violates |
| `REFERENCE_DEFECT` | stage 1 | the contract, the item or declaration, `where: selector \| value`, **the text verbatim**, why it would not resolve |
| `GAP` | stages 2, 5, 7 | the line, what is unauthored or not computable, and the dependency that failed. **One gap, one id, counted once**, with the header's `stage` naming where it was first unresolvable |
| `INVENTED` | stages 6, 9 — **CHECK mode only** | the line, the stated value, and which branch of §4.6 applies |
| `COLLISION` | stage 6 | the line, the colliding items, what each demanded, `decidedBy` (null when nothing did) |
| `RELATIONSHIP_CONFLICT` | stage 7 | the comparatives, their operands as resolved, why no assignment satisfies both, the objects that authored them |

And one that is **not** a failure: `TENSION` — an assumed item sitting oddly against authored knowledge
(SD-27). **No gate reads it**, enforced by the gate input (§7.1) not containing it.

---

## 4. `derived` / `open` / `failed`

- **`derived`** — a value the contracts, the session or a citable standing decision **entail**, carrying
  its support. The engine reached it; it did not choose it.
- **`open`** — a variation the rules **permit**. It carries bounds, the permitting authority and the
  applicable constraints, and **no value**. *No code path moves a line from `open` to `derived`*: stage
  11 refuses to emit an `open` entry carrying a value. SD-35 enforced structurally.
- **`failed`** — no value, naming its failure records.

**Which rows can be open:** the twelve `fillable` rows, plus the rows that carry `FREE(a)` (a quantity
inside authored bounds) and `FREE(b)` (SD-15's two qualitative terms). A line on any other row is never
`open`; the engine refuses instead.

**The three `openKind`s exist because three different parties fill them**, and a caller that cannot
tell them apart will send a coach's judgement to a selection process:

| `openKind` | Filled by | Bounds |
|---|---|---|
| `PERMITTED_CHOICE` | the downstream choice process (SD-35) | the intersection of the applicable constraints |
| `BOUNDED_QUANTITY` | the same, or rendered as a range | numeric, from authored bounds |
| `COACH_JUDGEMENT` | the coach, at delivery (SD-15) | **`null`** — no number is invented where none is authored |

---

## 5. Support and declarations

**Support is derived, never asserted**: a field-path match plus a closed comparison, recorded as
`SupportRef` — a contract item (with `ENTAILS` or `NARROWS`), a citable standing decision, the session,
or a realization. `ASSUMED` bounds but never entails. Engine wording supports nothing (SD-21).

**`sources` and `support` are different facts with one home each.** Everything addressing a row is
`sources`, in the audit; what validly supports the value is `support`, on the resolution entry. Storing
either twice is how two copies drift apart.

**Declarations** — the five kinds, counted in the corpus (860 across eight contracts):

| Kind | Count | What it does |
|---|---|---|
| `NON_CLAIMED` | 502 | the object says nothing and does not constrain; permits a free choice, supports nothing |
| `CLAIMED` | 129 | items address this row |
| `UNDECLARED` | 122 | never examined — a gap in the contract, reported against it, and the `coverage` reason code |
| `NOT_AUTHORED` | 85 | needed and unauthored — the `declared gap` reason code |
| `EXCLUDED` | 22 | an exclusion item forbids something here |

**A declaration survives an empty scope** (SD-31). The application set empties; the declaration stands
and still reaches failure classification. *"Authored intention that could not reach an element ≠
structure nobody authorized."*

---

## 6. Relationship evaluation

A comparison **takes no line** (SD-26). It is evaluated over its operands and held in the contribution
record, outside the eight areas.

**Operands** (SD-23): a represented property `{row, selector}`, or a deterministically derived quantity
`{derived: <registered rule>, args}` whose **inputs are supported**. `effectiveValue` is the only
registered rule today.

**Effective value** (SD-24): the primary event's base value after every applicable resolved modifier for
the referent. **Not computable** when an operation or magnitude is unauthored, or when two modifiers
apply and no authored rule fixes their order — the operations do not commute, so a fold order would be
an invented answer wearing the clothes of a derived one.

**Outcomes, in order:**

1. An operand that will not resolve or compute → the comparison is **unmet** (required) or **not
   evaluable** (supporting), by its requirement status, and the underlying dependency is a **`GAP`**.
2. Two **authoritative, well-formed, evaluable** comparatives that no assignment satisfies →
   `RELATIONSHIP_CONFLICT`.
3. An **assumed** comparative against authored knowledge → `TENSION`, diagnostic only, which can never
   drive a verdict (SD-27).

**Counted:** the corpus contains **zero** `COMPARES` items across 221. Every rule in this section has
been exercised only against items written for the collision tests.

---

## 7. Gate A and Gate B

### 7.1 Verdicts

```
GateReport { verdict: PASS | FAIL | NOT_EVALUABLE,
             checks: [{ checkId, verdict: PASS|FAIL|NOT_CHECKABLE|NOT_EVALUABLE,
                        subjects, why, pendingOn, blockedBy }] }
```

**FAIL** if any check failed. Otherwise **PASS** if every check is `PASS` or `NOT_CHECKABLE`.
Otherwise **NOT_EVALUABLE**. Rendering requires `PASS`, so `NOT_EVALUABLE` never passes as success.

**Both gates run where they are independently evaluable** (SD-37). A gate is not skipped because the
other failed: the caller needs the whole picture, and deciding what to do with it is the caller's job.

**The gate input excludes tensions** — SD-27 made unrepresentable rather than merely forbidden.

### 7.2 An `open` line does not block a gate

A Gate A check that depends on an `open` line asks a **satisfiability** question, not a selection
question: *is there any permitted value under which this check passes?*

- **SAT** → the check passes, and `pendingOn` names the open lines it depends on.
- **UNSAT** → the check fails: no permitted choice can rescue it, which is a real structural defect.

Any other reading makes SD-35 vacuous — every game with a single open line would fail Gate A, and a
design that never emits a passable game has not separated derivation from choice at all.

---

## 8. Determinism and versions

**Two runs on the same input are byte-identical**, and a run with every input collection shuffled
produces identical output. Both are test obligations, not intentions.

- **Canonical order**: lines by `(rowOrdinal, elementId, member)` — `rowOrdinal` from the register, so
  ordering is data-driven; then `itemId`, then `contractId`. Records sort by subject, then kind rank.
  **One sort key, stated once.**
- **One exception, deliberate**: the member order *inside an authored value set* is data, because AM-11
  makes an ordered set meaningful. It is emitted as authored and excluded from the shuffle guarantee.
- **Exact decimals; division is refused** rather than approximated.
- **Ids are structural, never positional.** Positional ids would attach to different lines under a
  shuffle and fail the determinism test for a reason that is not a real difference.
- **Versions are part of the answer.** Every list, rule set, contract and object version is stamped
  (§1.6), and an unstamped result is refused rather than emitted, because under SD-30 it asserts nothing.

---

## 9. The refusal-centred test plan

Nothing here needs the model, the API or a generated activity. The engine is a pure function over data.

| Layer | What it asserts |
|---|---|
| **1. Refusal coverage** *(primary)* | One test per refusal in §2.2 and §3.3: the engine refuses, names the case, and continues. **The refusals are the design**, so this is the suite that matters most |
| **2. Invariants** | D1 conservation — every enumerated line appears exactly once, in `resolution` or as `WITHDRAWN`. D2 determinism, including the shuffle. D3 no hidden choice — no `open` entry carries a value. D4 bounds recomputable from constraints. D5 gap outranks collision. D6 no gate reads a tension. D7 fully stamped. **D8 no advice** — no record carries a suggestion, recommendation, repair or retry field |
| **3. Ruling conformance** | One test per standing decision bearing on derivation — **including the three of his that overturned rules of mine**, so a drift back toward my earlier reaches-line, assumed-collision or precedence rules fails loudly |
| **4. Golden regression** | The eight contracts and the slice game, with expected per-line verdicts. **These are regression fixtures, not validation**: under SD-30 an earlier audit certifies nothing |
| **5. Pre-registration** | For anything new, write the expected outcome, commit it, then run. This has already caught one real problem and costs nothing |

---

## 10. The design choices that are mine

Each is a decision his rulings do not settle. None is presented as a consequence of them.

| # | Choice | Chosen | Alternative rejected |
|---|---|---|---|
| 1 | Gate verdict logic | Three-valued; `NOT_EVALUABLE` is distinct from `FAIL` | Collapsing it to `FAIL` — loses the difference between "this game is broken" and "I could not tell" |
| 2 | An `open` line and Gate A | Satisfiability: SAT passes with `pendingOn` | Treating open as unevaluable — would make SD-35 vacuous |
| 3 | Record ids | Content-derived | Emission order — one insertion renumbers everything and breaks cross-run comparison |
| 4 | Canonical order | `(rowOrdinal, elementId, member)` | Lexicographic on the id — scatters the envelope and reads badly |
| 5 | Numbers | Exact decimals; division refused | Rationals — more general, but nothing authored needs them |
| 6 | Divergence | Reportable refusal; the run continues | Aborting — destroys the report |
| 7 | `PENDING_CHOICE` | A distinct forward result for an item blocked only by an open line | Reusing "not evaluable" — hides the difference between waiting and broken |
| 8 | Failure granularity at load | Whole contract | Per record — leaves a half-loaded contract whose coverage means nothing |
| 9 | `bounds: null` for a coach judgement | Legitimate | Forcing bounds — would invent a number SD-15 forbids |
| 10 | Derive-mode surplus | Reported unsupported, **no `INVENTED` record** | Raising `INVENTED` — the engine states nothing in derive mode, so it can invent nothing |

---

## 11. What needs his ruling

**E1 — the authority behind a permitted free choice.** SD-35 requires every `open` property to carry
the authority permitting the choice. Checking what those authorities actually are: the whole free-choice
mechanism rests on **P-4, a proposal never ruled on** ("applied for this run"), and two of the twelve
fillable rows name an authority that cannot be cited — **`T2` names SD-R2, a *rejected* default**, and
`J3` names P-4 itself. The substance is his: the SD-R2 rejection says *"which team starts can remain a
permitted free choice unless selected knowledge requires otherwise"*, which is exactly the permission
needed. **The defect is the citation form, not the decision** — the same shape as SD-10's mistyping.
Flagged rather than fixed, because inventing a citable id is his call.

**E2 — does the engine take a game as an input?** The direction he approved lists none, but `INVENTED`,
the reverse trace and derivation spec §4.6–§4.7 all presuppose a stated game. §1.5 proposes two modes
rather than dropping those clauses. This modifies a design he has approved, so it should be a ruling
rather than an assumption.

---

## 12. What this package does not do

It does not define the downstream choice process, and it does not design the recovery policy — both
deferred by his explicit instruction. It proposes no grammar extension for the six unrepresentable
cases, which stay recorded individually in the task register (SD-38). It repairs no contract. And it
implements nothing: **implementation stays frozen until he reviews this.**
