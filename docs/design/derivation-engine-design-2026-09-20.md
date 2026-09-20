# The derivation engine — proposed design

20 September 2026. **Design only. Implementation stays frozen until Christian reviews this.** No code
exists, nothing is built, and generation remains frozen.

He authorized this with one condition, which is the spine of the whole design:

> "no true blocker remains before derivation-engine implementation design, provided the engine is
> specified to **refuse rather than guess**."

And one shape, SD-33:

> "Keep the derivation/reconciliation engine **report-only**. Its responsibility is to return: resolved
> results where possible; Gate A / Gate B results; structured failures/gaps/conflicts;
> audit/provenance/support information. It does not re-select knowledge, weaken requirements, decide to
> generate fewer activities, or otherwise repair selection."

**How to read this.** Where a design decision follows from one of his rulings, it cites the id. Where it
is mine, it says **my choice** and gives the alternative I rejected. §8 lists every one of those in a
single table, so he can rule on them without reading the rest.

---

## 1. What the engine is

**A pure function over loaded data.** Its inputs are the selected contracts, the session envelope, the
register and vocabularies as versioned data, and the standing decisions. Its output is one record: a
resolution, an audit, gate results and a failure list. It has no side effects, no I/O of its own, no
clock and no randomness.

**It resolves what the knowledge entails, and reports everything else.** "Resolved results where
possible" is the first thing SD-33 asks for, so the engine is not merely a checker — it derives the
values contracts entail, with their support. What it does not do is fill the gaps between them.

**It is not the resolver of the whole game, and not the renderer.** Three things sit around it in the
generation path (data-model design §5): selection before, realization beside, rendering after. The
engine's boundary with realization is the one real design question, and it is §8's first row.

**One property of the whole design worth stating up front:** every place the rules stop, the engine
emits a record and continues. It never halts on the first failure, because the caller needs the whole
picture to act — and under SD-33 acting is the caller's job, not the engine's.

## 2. The input and output contract

**In:**

| Input | Notes |
|---|---|
| `selection` | the selected knowledge objects, by id and version |
| `contracts` | one per selected object, loaded whole and fail-closed (data-model §4) |
| `envelope` | the session's players, area, duration — the SESSION source kind |
| `register` + `vocabularies` | versioned data, not code |
| `standingDecisions` | the citable ids, typed, from the register |

**Out — one `DerivationResult`:**

```
DerivationResult {
  versions: { register, vocabularies, derivation, contracts: [{id, version}] }
  resolution: [ { propertyId, elementId | null, row, state, value?, bounds?, support: [ref] } ]
  audit:      { properties, items, collisions, relationshipConflicts, tensions,
                referenceDefects, dispositions }
  gates:      { gateA: {...}, gateBForward: {...}, gateBReverse: {...} }
  failures:   [ <typed failure records, §4> ]
  refusals:   [ <typed refusal records, §4> ]
}
```

**`state` is one of three**, and this is the heart of the output:
- `derived` — a value the contracts entail, carrying its support;
- `open` — a free choice the rules permit, carrying its **bounds** and the rule that permits it, **not a
  value**;
- `failed` — no value, carrying the failure record that says why.

A caller can therefore always answer three questions without parsing prose: what is settled, what is
still to be chosen and within what limits, and what is broken and how.

## 3. The stages

Each stage names what it refuses. A refusal is never a default and never a best guess.

| # | Stage | What it does | What it refuses |
|---|---|---|---|
| 0 | **Load** | Reads contracts, register, vocabularies, envelope. No allowlist projection; every field kept. Checks every enumerated value against the register's `vocabularies` block **as data** | An unknown row id, requirement kind, operator, scope, basis, declaration, derived-operand rule or vocabulary value; a missing basis quote; a comparative written as an exclusion; a magnitude with no declared operation (SD-30). **That contract is rejected whole and the run continues with the rest** — a refusal is per contract, never a halt, or one mistyped value would annihilate the report |
| 1 | **Normalise** | Resolves every structural reference — in selectors **and in item values** — through registered identity (SD-32). Records what each selector denotes, before any derivation | Anything that will not resolve: reported as a **reference defect** against the contract that wrote it. Never matched by meaning, never inferred |
| 2 | **Index** | Builds the line inventory: one line per (element, row), one per member for set-valued rows, **and only where the row applies to that element** (the register's new `applicability` block). Views are computed on read, never stored | A row whose applicability condition cannot be evaluated: the line is enumerated and reported, rather than assumed inapplicable |
| 3 | **Scope** | Fixes each contract's **application set** per scope. Own involvement is fixed in **one restricted pass** (below) before any own-involvement item applies (AM-13). **Declarations are held beside the items, not inside them** (SD-31) | An own-involvement item that would reach what it itself entails |
| 4 | **Reach** | Matches items to lines: row equality plus selector satisfaction | — |
| 5 | **Derive** | Per line: entailment, bounds, cardinality by necessity (§4.3), standing decisions (§4.8), permitted free choice (§5) | A free choice on a row with no `fillable` entry, or a count fill with no authored maximum: **refused**, surplus reported unsupported |
| 6 | **Classify** | One verdict per line, first that applies (§2), with its reason code. Gap before collision (SD-28) | — |
| 7 | **Relationships** | Evaluates comparatives **over their operands** (SD-26) — never onto a line. Raises a relationship conflict only where both are authoritative, well-formed and evaluable; an assumed one raises a **tension** instead (SD-27) | A comparison whose selector matches several elements (no aggregate function is named); one whose operand is a range or an unfilled choice; effective value where two modifiers apply and no authored rule fixes the order — **not computable**, so a gap under SD-28 |
| 8 | **Forward** | Per item: satisfied, violated, unmet, adapted, inert, not checkable, not evaluable (§7) | — |
| 9 | **Reverse** | Gate B reverse: every resolved property traced back to a support-capable source; anything else is invented | — |
| 10 | **Gates** | Gate A structural coherence; Gate B forward and reverse. **Both always run**, even when one has already failed | A Gate A check it cannot evaluate: fails and names the pair, rather than inferring |
| 11 | **Emit** | Assembles the result, stamped with every version | — |

### 3.1 The one circularity in the pipeline, and how it is broken

AM-13 defines own involvement as **the elements entailed by the contract's other-scoped items** — but
entailment is derived at stage 5, after scope at stage 3. Read naively the pipeline needs its own
output. An adversarial review of this design found it, and it matters because it is the computation
that decides the Wide Zone outcome he ruled on in SD-31.

**The break is a restricted pass, defined precisely so it cannot become a fixed-point search:**
1. Run stages 4 and 5 over **only that contract's items at other scopes** — whole game, per team, per
   objective set. These cannot depend on own involvement, so the pass terminates in one iteration.
2. **Fix** the own-involvement element set from what that pass entails.
3. Run the full derivation. Own-involvement items now apply against a set that cannot grow.

**Two properties this must have, and they are test obligations:** the restricted pass and the full pass
must agree on every line the restricted pass judged, and no ordering of contracts may change the fixed
set. **The residual risk, stated rather than hidden:** a standing decision fires only on a line already
entailed or legitimately chosen (§4.8), so a decision that would fire in the full pass might not fire in
the restricted one. I believe this cannot change an own-involvement set, because standing decisions
supply values rather than element existence — but "I believe" is not a proof, so the engine **compares
the two passes and reports a divergence as a defect** rather than silently preferring one.

**Render fidelity (SD-05 / P5) is deliberately outside this engine.** It compares coach text against a
resolved game, so it belongs after rendering. Putting it here would require the engine to know about
text, which is the coupling this architecture exists to break.

## 4. The refusal and failure model

**A refusal is a first-class output, not an error.** The engine distinguishes six kinds, each with its
own record and its own shape, so the caller never has to read prose to tell them apart:

| Kind | Means | Raised by |
|---|---|---|
| `LOAD_REFUSAL` | A contract is not admissible and was not loaded | Stage 0 |
| `REFERENCE_DEFECT` | A structural reference would not resolve (SD-32) | Stage 1 |
| `GAP` | A dependency is unauthored or not computable. **Always reported before any conflict** (SD-28) | Stages 5, 7 |
| `INVENTED` | A property is stated with no valid support | Stages 6, 9 |
| `COLLISION` | Two support-capable, in-scope, authoritative items on one line that no value satisfies, with nothing authored to decide (SD-02) | Stage 6 |
| `RELATIONSHIP_CONFLICT` | Two authoritative, well-formed, evaluable comparatives that nothing satisfies (SD-26) | Stage 7 |

And one that is explicitly **not** a failure:

| `TENSION` | An assumed item sits oddly against authored knowledge. **Diagnostic only; no gate reads it, and it can never drive a verdict** (SD-27) |

**The ordering discipline**, which is his and is the one thing most easily lost in implementation: a
missing or incomputable dependency is a `GAP` **first**. Nothing downstream may convert it into a
disagreement. An engine that reported "two objects disagree" about a value nobody authored would be
stating something false about the knowledge, which is exactly the inversion SD-28 rules out.

**Every failure record carries:** what failed, which line or item, which contracts and objects are
implicated, the clause that produced the verdict, and — where relevant — the specific input that could
not be resolved. It never carries a suggested fix, because suggesting is repairing.

## 5. Determinism and versioning

**What makes two runs identical.** The engine is a pure function; it has no clock, no randomness, and
no dependence on the order data arrives. Every collection it iterates is sorted by a canonical key
(line id, then item id, then contract id) before use, and the output's record order is that same
canonical order. Two runs on the same inputs produce byte-identical output, and a shuffled input order
produces identical output too — both are test obligations (§6), not hopes.

**Versions are part of the answer, not metadata.** Every result names the register version, each
vocabulary's version, the derivation-rules version, and each contract's and knowledge object's version.

**And the rule that reaches backwards** (SD-30):

> "No historical activity should be treated as retrospectively validated under this newer specification
> merely because it passed an earlier audit."

So a stored result is valid **only** for the versions it names. When any of them changes, previously
stored results are stale by construction and must be re-derived before they mean anything. The engine
enforces this by refusing to compare or reuse a result whose versions differ from the current ones —
it re-derives instead. **This is why versions are in the output rather than a log.**

## 6. How it is tested, with generation frozen

Nothing here needs the model, the API or a generated activity. The engine is a pure function over data,
so all of it is testable on paper artefacts.

1. **Refusal coverage.** One test per refusal in §3 and §4, each asserting the engine refuses, names the
   case, and continues. This is the primary suite, because the refusals are the design.
2. **Determinism.** Same input twice → byte-identical output. Shuffled input order → identical output.
3. **Golden regression cases.** The eight contracts and the slice game, with expected per-line verdicts.
   **These are regression fixtures, not validation** — under SD-30 an earlier audit certifies nothing, so
   a golden case records what the current rules say, not that an activity is sound.
4. **Ruling conformance.** One test per standing decision that bears on derivation, asserting the
   behaviour his wording requires — including the three that were mine and he overturned, so a
   regression toward my earlier rules fails loudly.
5. **Pre-registration for anything new.** Write the expected outcome, commit it, then run. This caught a
   real problem once already and costs nothing.

## 7. What the engine does not do

In his words (SD-33), it "does not re-select knowledge, weaken requirements, decide to generate fewer
activities, or otherwise repair selection". Concretely, it never:

- retries selection, or asks for different knowledge;
- relaxes a requirement, downgrades a REQUIRED item, or ignores an exclusion to make a game resolve;
- drops a failing activity, or decides how many activities to return;
- fills a gap from engine wording, legacy code or a coach-rule sentence (SD-21);
- repairs a contract — including restating Wide Zone's scope to use AM-17, which he ruled explicitly:
  "Do not repair Wide Zone through derivation";
- writes or inspects coach-facing text;
- **designs or implements any recovery policy.** He was explicit: *"Do not design that recovery policy
  now."* Recovery belongs to the caller, and if re-selection is ever permitted it must be bounded and
  must preserve the planning and learning invariants. Nothing in this design anticipates it, and the
  output contract deliberately gives a caller what it needs without suggesting what to do.

## 8. The design choices that are mine

Every one of these is a decision his rulings do not settle. None is presented as a consequence of them.

**All six were ruled on 20 September, and all six approved.** Choice 1 is now SD-35 and the others
SD-37; the table stands as the record of what was proposed and why.

| # | Choice | What I propose | The alternative I rejected, and why |
|---|---|---|---|
| 1 | **Who fills a permitted free choice** — **APPROVED, SD-35** | The engine emits it as `open` with its bounds and the permitting rule; **a separate realization step fills it** | The engine could fill it deterministically. I rejected that because choosing a value is the act that creates what a coach sees, and a policy for choosing is the kind of thing that should be authored or ruled, not invented inside a derivation engine. **His ruling states the boundary more generally than my proposal did:** *"Derivation determines what must be true, what may vary, and the legitimate bounds of variation. A downstream explicitly governed choice process determines which permitted value becomes true in the particular game."* An `open` property therefore carries bounds, the permitting authority **and any applicable constraints**, and no value; the downstream process is explicitly not designed yet, and the engine gets no hidden selection policy |
| 2 | **Emit a partial resolution when lines fail** | Yes — everything that resolved, plus the failures | Emitting nothing on failure. Rejected: the caller cannot report usefully on an empty result, and SD-33 asks for "resolved results where possible" |
| 3 | **Both gates always run** | Yes, even when one has already failed | Short-circuiting. Rejected: it hides half the picture, and the caller decides what to do with the whole of it |
| 4 | **Canonical ordering** | Sort by line id, then item id, then contract id, everywhere | Insertion order. Rejected: it makes determinism accidental rather than structural |
| 5 | **Render fidelity is outside the engine** | It runs after rendering, against the resolved game | Inside. Rejected: it would couple the engine to text |
| 6 | **A failure record never suggests a fix** | Report only what is true | Including a suggested repair. Rejected: suggesting is a short step from repairing, which SD-33 forbids |

## 9. What genuinely cannot be represented under these rulings

Not inconveniences, and not things the engine refuses — a refusal is a working outcome. These are
things real authored knowledge needs to say and the grammar cannot hold. The first four come from the
conformance check's own ledger, which classed **5 entries structural and 66 local** across eight
contracts.

| # | What cannot be said | The concrete case | Why | Needed |
|---|---|---|---|---|
| 1 | **A requirement conditioned on another property's value** | RPC-001's scoring carrier depends on which scoring event was chosen: a line, a zone, gates or a target player. Its items 05, 08 and 11.b are all conditional | No item can guard on another row's value or span rows. Holding it needs support conditioned on another line — and he closed AM-25 deliberately, ruling that no conditional contract structure is added (KR-04) | **Today.** It is why the carrier gap in the authoring register cannot simply be authored as an item |
| 2 | **An either/or between two whole layouts** | GF4: "two-goal or two-target field" means two of *one* kind | The set selector also admits one goal plus one target. There is no alternative-of-items mechanism | Today, for GF4 |
| 3 | **A permission conditioned on another object** | GF4: a constraint "can be introduced … when the goal is defending under overload" — a condition on the *session goal*, not the game | There is no condition field, and relationship rules only decide collisions | Today, for GF4 |
| 4 | **An existence the source gives only as an example** | GF4 I16/I17 | RC-6 forces `N/A` on existence items, so `TYPICAL_EXAMPLE` cannot attach; only `SUPPORTING` softens it, which says something different | Today, for GF4 |
| 5 | **An aggregate across elements** | Wide Zone's "not dominant": the two channels' combined widths must stay under the envelope width | No requirement kind aggregates, and no aggregate function is named for comparisons either. This is the same hole seen from two sides | Today — it is why WIDEZONE-09 never became an item at all |
| 6 | **A comparison of two counts** | `count(A) = count(B)` | Cardinality is not a property (SD-34, deliberate) | Not today. His ruling: bring it back with a concrete authored case |

**I had grouped three of these as one problem — "knowledge that says *when* a requirement is live" —
and he corrected that.** His instruction: *"do not yet collapse the three conditional-looking cases into
one mechanism. They may have different eventual ownership."* He is right, and the grouping was a
premature synthesis of the kind that looks like insight and forecloses options. They look alike in the
grammar and may belong in three different places:

| Case | Where it may actually belong, in his words |
|---|---|
| RPC-001's carrier (1) | *"may require conditional applicability based on a resolved game property"* — inside the representation |
| GF4's "when the goal is defending under overload" (3) | *"may instead belong upstream in selection/applicability"* — before a contract exists at all |
| GF4's two-goal or two-target layout (2) | *"may be an alternative-realization issue"* — downstream, where a permitted choice is made |

If those are the right homes, one conditional mechanism would have been the wrong answer three times
over. **The distinctions are preserved until real cases say otherwise** (SD-38), and each is recorded
separately in the knowledge-authoring task register.

The same restraint applies to the other two: example-status existence and aggregate comparison wait for
authored knowledge that needs them strongly enough to justify a grammar change. **It is not the engine's
place to work around any of them** — an engine that inferred a condition would be authoring.

---

## 10. Three things in the data that block implementation, not design

The adversarial review of this design found these, and each was verified directly against the
artefacts. None changes the design; each has to be true of the data before an engine built to this
design can run at all.

**1. The closed vocabularies were not data.** Thirteen closed lists existed only inside the register's
`valueType` prose — "closed list (draft): ACCESS, COUNT_CHANGE" and so on — so the load-time check in
stage 0 had nothing to check against, and would have had to parse prose, which SD-32 rules out in
spirit. **Fixed:** the register now carries a `vocabularies` block holding every list verbatim, plus
the contract enumerations. The prose is unchanged and still the human reading. This changes their
**form**, not their membership, so SD-18's "contents not frozen" is untouched.

**2. Conditional applicability was also prose, and it would have made Gate A unpassable.** Rows T2 to
T5 read "N/A when CONTINUE"; V14b applies only to an ACCESS consequence, V14c only to COUNT_CHANGE.
Enumerating a line regardless would give **every** turnover transition four permanently unclosable
`NOT_AUTHORED` lines — and under his SD-20 turnovers continue play, so that is the common case, not an
edge. **Fixed the same way:** an `applicability` block, read from the register's own prose, adding no
new rule. Whether applicability belongs in the register like this or needs its own mechanism is his.

**3. The contract corpus uses a scope the register did not hold — now approved, and four of its six
uses do not conform.** He approved `BUILD_OUT_EPISODE` as the sixth scope (SD-36), defined narrowly:
*"applies to the attacking episode whose beginning satisfies the resolved RPC-001 build-out begin
condition. It does not automatically extend to subsequent attacking episodes."* He asked for every
current use to be checked against that definition, and for a mismatch to be reported rather than the
definition broadened. Checked:

| Use | Verdict |
|---|---|
| `RPC-001-11.b` on J11b, and its J11b declaration | **Conform.** The item is about the build-out episode and cites KR-02 and KR-03 as an owner ruling |
| `RPC-001-16.a` (T4), `16.b` (T3), `16.c` (T6), and the T4 declaration | **Do not conform** |

**Why the four fail, and it is the same reason three times.** All three items are keyed on
`trigger ∈ {SCORE, OUT_END_LINE, OUT_TOUCHLINE, POSSESSION_CHANGE}` — the triggers that *end* an
episode and begin the next one. Scoping them to the build-out episode claims precisely the extension to
subsequent attacking episodes his definition excludes. Two further facts point the same way: all three
carry basis `ENGINE_ONLY` on the sentence retired under KR-05 item 6, so they support nothing under
SD-21; and `16.c` requires `STOP_RESUME` on a turnover, which SD-20 has already unsupported. The
contract's own fit note says as much: "KR-03 leaves the every-restart reading unsupported."

So the mismatch is not a surprise about the scope — it is the same legacy the turnover ruling and the
retired sentence already exposed, showing up once more. **Recorded as a contract-authoring task, not
repaired here.**

Separately, **64 items and declarations carry an em-dash placeholder where a scope belongs**, which is a
contract-authoring defect from the restatement exercise rather than a vocabulary question.

**What these three have in common** is worth more than the fixes: each is a place where the register
reads correctly to a person and cannot be executed by a machine. That gap is exactly what building the
engine converts from a latent problem into a visible one, and it is a good argument for the design
review he has asked for happening against data an engine could actually consume.

## What he ruled — the direction is approved, and this document is superseded in one respect

He approved the direction on 20 September: the pure-function boundary, the typed refusal model,
gap-before-collision, canonical determinism, version-bound results and the refusal-centered test
strategy. The restricted-pass solution to the own-involvement circularity is approved **provisionally**,
with the divergence check and refusal behaviour kept, and with an instruction not to chase the residual
standing-decision risk *"unless a concrete case demonstrates it"*.

| What he ruled | Where it now lives |
|---|---|
| Free choice: the engine does not choose | **SD-35**, and §8 choice 1 |
| `BUILD_OUT_EPISODE` as the sixth scope, defined narrowly; every use checked | **SD-36**, and §10.3 — two of six conform, four do not |
| The five smaller choices, all approved. *"Derivation diagnoses. It does not design."* | **SD-37** |
| The six unrepresentable cases: recorded individually, not solved, and the three conditional-looking ones **not collapsed** | **SD-38**, and §9 |

**Superseded:** this document proposed the direction. The implementation-ready package that follows it
(`derivation-engine-design-package-2026-09-20.md`) carries the detail he asked to inspect, across his
ten points. Where the two differ, the package is later and wins.

**And one note on method.** This design was drafted, then attacked by an independent review whose job
was to find where it guesses. It found the scope circularity in §3.1 and all three data problems in
§10; every one was verified against the artefacts before being written up here. Two of its findings I
rejected on checking — it read a figure from the 19 September check as current, which SD-30 forbids,
and it treated a refusal as a representational limit.

Nothing is implemented. Generation remains frozen.
