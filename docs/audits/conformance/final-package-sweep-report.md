# Final package sweep — 21 September rulings

**Audited checkout:** `C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18`  
**Branch:** `claude/serene-dewdney-c78e18`  
**Commit:** `edc4b37e47254c43bba6d9e69aeaf67b4e75cba7`

## Verdict and totals

The package's claim — *two contradictions resolved, one decision remaining, no invention points* — is **not sustained**. The two revision-1 contradictions are described as resolved in the package, but six current contradiction groups remain elsewhere in the live specification/register; the claimed single implementation decision is internally preselected in one section; and six places still require an implementer to choose semantics or have the engine refuse.

| Family | Result |
|---|---:|
| S — current ruling contradictions | 6 groups (12 live source lines) |
| P — package internal defects | 3 |
| C — derivation-spec/decision rules with no implementation home | 3 |
| I — invention points | 6 |
| Explicit historical hits retained as records, not defects | 15 reviewed hit groups |

I treated a statement as **historical** only where it says it is superseded, a proposal, a past revision, or corrected. A dated filename alone was not enough. An **invention point** is the task's test: two careful implementers can choose different semantics from valid inputs, and no named refusal directs the engine to stop.

## Method

I read the 21 September rulings in `game-representation-spec-2026-09-18.md` §2, the complete derivation package, the complete derivation specification, the grammar sheet, and the register. I then searched every `docs/design/*.md`, the grammar sheet, and the register for the seven S families; read the affected context to distinguish live rules from records; and read the pipeline and gate algorithms rather than relying on keywords.

`final-package-sweep.js` is a Node-only, read-only evidence sweep. It strips a UTF-8 BOM before every JSON parse, parses the register and the Stage-B contract corpus, checks the package's stage/failure/refusal claims, and prints the review anchors used below. Its corpus count is **8 contracts, 221 items, 0 `COMPARES`**; SD-41 is therefore factually correct.

## S — stale statements against SD-39 to SD-42

### Current defects

| Id | File and line | Text | Conflict |
|---|---|---|---|
| S1 | `docs/design/game-representation-spec-2026-09-18.md:303` | “What a free choice may fill is **proposal P-4**, not yet ruled.” | SD-39 supersedes P-4 as the authority. This is a live rule in §3, not a revision note. |
| S1 | `docs/design/game-representation-spec-2026-09-18.md:318` | “Silence licenses a choice.” | SD-39 says silence creates no structure and OPEN needs a supported property and choice space. |
| S1 | `docs/design/game-representation-spec-2026-09-18.md:472` | “Which team starts … (SD-R2).” | SD-R2 is rejected and is replaced by SD-39 as the authority. |
| S1 | `docs/design/game-representation-spec-2026-09-18.md:502` | “REALIZATION chooses … (proposal P-4).” | It presents P-4 as the current authority for choosing the primary event. |
| S1 | `docs/design/game-representation-spec-2026-09-18.md:604` and `:618` | “SD-R2 (who starts is a free choice)” / “P-4 … free choice may fill.” | The active proposal register leaves both obsolete authorities live without the SD-39 correction. |
| S1 | `docs/design/derivation-spec-2026-09-20.md:501` | “which team starts is a free choice (SD-R2)” | The live transitions rule still uses the rejected default as its authority. |
| S2 | `docs/audits/conformance/register-2026-09-18.json:205` | SD-13 applies when T5 has verdict “ENTAILED or `NARROWED_CHOICE`”. | `NARROWED_CHOICE` is now a candidate-check outcome. This condition can let a candidate T5 value activate SD-13's derived T3 actor: precisely an otherwise unsupported dependency supplied by the candidate, prohibited by SD-40. |
| S2 | `docs/design/game-representation-spec-2026-09-18.md:249,255,316-327` | `support[]` is a valid-source list; `RESOLVED` may be fixed by a free choice; `REALIZATION` is a source kind. | In the current representation text, REALIZATION can still authorize a resolved property. SD-40 permits it only as candidate provenance, never support or derivation authority. |
| S3 | `docs/design/derivation-spec-2026-09-20.md:38` | “`RESOLVED:NARROWED_CHOICE` | a legitimate free choice.” | It remains in the resolution-verdict table, despite §5:318 correctly moving it to a candidate check. |
| S6 | `docs/design/game-representation-spec-2026-09-18.md:574,578` | “Gate B … reverse” applies to every game; rendering requires “both directions of Gate B.” | SD-40 makes reverse tracing and `INVENTED` checking-mode only. The live validation table does not qualify it by mode. |
| S7 | `docs/design/derivation-spec-2026-09-20.md:564` | “The `NOT_REALIZED` item-result label (§7), which is still a proposal.” | The same file says it was approved at :461; package §3.4 says both labels are ruled. |

The package's statement at `derivation-engine-design-package-2026-09-20.md:424` that this stale label wording was fixed is consequently false in this checkout.

### Historical or conforming hits reviewed

These are not defects because their own wording makes the status clear.

| Family | File and line | Classification and reason |
|---|---|---|
| S1 | `register-2026-09-18.json:19,54,71` | Historical correction: each says P-4/SD-R2 is superseded/replaced by SD-39. |
| S1 | `derivation-spec-2026-09-20.md:304` | Conforming: it explicitly says SD-39 supersedes P-4. |
| S1 | `derivation-engine-design-package-2026-09-20.md:257` | Conforming: it says P-4 and SD-R2 are no longer authorities. |
| S1 | `knowledge-authoring-tasks.md:65,68` | Historical record, explicitly headed “RESOLVED 21 Sep” and “record of what was found.” |
| S1 | `game-representation-spec-2026-09-18.md:3-4,194,205,693,711` | Revision/rejected-default history or the current SD-39 correction; none authorizes the obsolete rule. |
| S2/S3 | `derivation-engine-design-package-2026-09-20.md:69,76,93,105,112,205,265,411-418` | Conforming current rule or explicitly “revision 1” historical account. |
| S3 | `amendments-am01-am15-2026-09-19.md:1-16,213` | Historical proposal: the header says “Nothing here is adopted.” |
| S4 | `derivation-engine-design-2026-09-20.md:104-116` and package `:152-155,402` | Conforming: divergence is reported/refused, never selected. The former direction is explicitly superseded at `derivation-engine-design-2026-09-20.md:329`. |
| S5 | `derivation-engine-design-package-2026-09-20.md:292`, `knowledge-authoring-tasks.md:38`, register `:125` | Conforming: zero corpus items, unexercised capability, and named aggregate refusal. No document claims canonical authored exercise. |
| S6 | `derivation-engine-design-2026-09-20.md:93` | Historical only: the document is expressly superseded at :329; the package corrects its unconditional reverse stage. |
| S7 | `derivation-spec-2026-09-20.md:457,461,471` and package `:78,90,109,170,220` | Conforming: approved labels, with only the separate supporting-cardinality case refused as `LABEL_NOT_RULED`. |

## P — package internal consistency

### P1 — output and pipeline records are not all defined

| File and line | Text | Defect |
|---|---|---|
| `docs/design/derivation-engine-design-package-2026-09-20.md:45` | `audit : Audit` and `run : RunReport` | Neither record is defined in §1 or §3. A test cannot know its fields, sorting, or which failures it carries. |
| `:45,302-304` | `gateA … : GateReport`; its shape appears only in §7 | P1 requires a §1/§3 definition. More importantly, this leaves the output contract incomplete where callers need it. |
| `:154` | ``run.divergent`` is set | `RunReport` is undefined, so this field has no representation. |
| `:164,383` | conditional lines are `PENDING`; D1 says lines can be “withdrawn” | Neither is a declared line state, record, or output collection. |
| `:170,400` | `PENDING_CHOICE` is a distinct forward result | There is no `ForwardResult`/item-result record or closed outcome vocabulary defining it. |

### P2–P4 — mechanically consistent

The closed refusal list has all 12 named refusal kinds used by the package; the §3.2 table contains exactly the six listed failure kinds; and every cited pipeline stage is in the 0–11 table. These are passes, not evidence that the unnamed records above are implementable.

### P5 — invariants not testable from defined package data

| Invariant | Why it cannot be written against the defined contract |
|---|---|
| D1 | “withdrawn” is neither an output collection nor a typed line state. An omitted line is indistinguishable from an intentionally withdrawn one. |
| D4 | `constraints` has no record shape and §1.4 only says values are typed by a register prose type. There is no defined intersection/recomputation operation for all bound kinds. |
| D6 | `TENSION` has no record shape and the asserted “gate input” is not a defined input. The output cannot prove a gate did not read it. |
| D8 | `Audit` and `RunReport` are open types, so “no advice field anywhere” cannot be exhaustively tested. |
| D10 | `CandidateGame` is not defined. A byte-identical test can be named, but no legal candidate shape is specified to construct the five cases. |

### P6 — the remaining Gate A decision is already preselected

`derivation-engine-design-package-2026-09-20.md:307` makes a gate `PASS` when every check is `PASS` or `NOT_CHECKABLE`. But `:427-441` says the treatment of six unexecutable clauses is the one owner decision still needed, offering non-blocking `NOT_CHECKABLE`, blocking `NOT_EVALUABLE`, or wording removal. The earlier rule silently chooses option (a), while §11 says that choice is unmade. An implementer can reasonably either follow §7.1 or wait for the owner; this is both an internal conflict and an invention point unless the decision is made.

## C — coverage of the derivation specification and standing decisions

### C1 — derivation-spec map

| Derivation specification section | Package home |
|---|---|
| §1 Unit of judgement | §1.4 `ResolutionEntry`; §2.2 Stage 2 |
| §2 Verdicts | §4 states; §2.2 Stage 6; §1.5 candidate outcomes |
| §3 What can support | §5 Support and declarations |
| §4 / §4.1 Matching | §5; Stages 1 and 4 |
| §4.2 Comparison and relation | Stages 4–6; register input at §1.2 |
| §4.3 Cardinality and identity | Stage 5; Stage 8 forward results |
| §4.4 Comparative claims | §6; Stage 7 |
| §4.5 Selecting an existing element | Stages 1, 4 and 5; §12 no repair |
| §4.6 Unsupported stated value | §4 states; Stages 5–6; typed failure record §3 |
| §4.7 Game omission | §1.5 candidate `ABSENT`; Stage 8 — partial only, because its forward-result record is undefined (P1) |
| §4.8 Standing decisions | §2.1 computation 3; Stage 5 |
| §5 Free choice | §4.2; §1.5; Stage 5 |
| §6 Scope and collisions / §6.1 relationship conflict | Stage 3; Stage 6; §6; §3.2 |
| §7 Forward results | Stage 8; §3.4 — partial only, because `PENDING_CHOICE` has no result definition |
| §8 Closed-world absence | §1.4 `lineOutcome` and §1.5 cite it, but no stage implements the test “no support-capable item entails an element at that scope.” **No home.** |
| §9 Transitions | Stages 2–5 and Gate A transition checks — except the rule that reachable triggers/elements “exist by construction” has no construction algorithm. **No home for that rule.** |
| §10 Known interactions | Stages 1, 3, 5 and §12 retain the no-repair boundaries |
| §11 Open matters | §3.3 refusals, §11.2 decision, and §12; its `NOT_REALIZED` proposal statement is contradicted by S7 |

### C2 — standing decisions and knowledge rulings

The package has a general home — Stage 5 consumes the register's citable standing decisions, Stage 6 applies collision rules, and Stage 0 validates the register as data — so the following decisions are covered through that data-driven route: **SD-01–09 (except the restriction below), SD-11–21, SD-23–28, SD-30–32, SD-34–42, and KR-01–05**. Their more specific homes are respectively Gate B/support (§§1.4,5,7), scope (Stage 3), relationship evaluation (§6/Stage 7), versions (§8), report-only outputs (§1.7), and the SD-39–42 sections already named in the table above. SD-22 and SD-29 govern design classification rather than a runtime derivation step.

One decision that does bear on derivation lacks an operational home:

| Decision | Missing home |
|---|---|
| SD-10 and SD-10a | The register makes this a **restriction**, not a citable item: do not remove a representative objective when it is structurally necessary. The package neither indexes restrictions nor gives a Stage 5/6/Gate A test for the SD-10a necessity definition. Generic standing-decision closure cannot apply an `item: null` restriction. |

SD-13 is nominally in Stage 5's citable-decision path, but its register condition is the S2 defect above; it is not a sound implementation home until `NARROWED_CHOICE` is replaced by an authoritative derivation-state condition.

## I — invention points

### I1/I2 — closed fields and value representations

| Point | File and line | Two defensible readings / missing decision |
|---|---|---|
| Element inventory and identity | Package `:59-64,164-168`; derivation spec `:134-142` | Stage 2 must create one line per `(element,row)` before Stage 5 derives element existence, but derivation-mode input contains no candidate game and gives no identity/allocation rule. One implementer can mint elements from existence items; another can require a pre-existing universe and report no lines. Neither is directed to refuse. |
| Result and candidate shapes | Package `:39-47,95,170` | `Audit`, `RunReport`, `CandidateGame`, the forward-result record, and `PENDING_CHOICE` are unnamed/open shapes. Implementers must choose fields and the mapping from candidate structure to line assertions. No refusal covers valid input using these undefined types. |
| Value comparison representation | Package `:70,314,337`; register `:30-31,63,71,84,90,184-204` | “typed by the row's registered value type” delegates to prose. The contract does not define a common interval encoding/normal form, mixed absolute-relative comparison, contextual team-designation evaluation, or the tagged representation of trigger qualifiers and “procedure over members.” Two engines can validly compare different values differently; no refusal applies to a well-formed value. |

### I3 — unresolved markers without an operational refusal

| File and line | Text | Finding |
|---|---|---|
| `docs/design/derivation-spec-2026-09-20.md:42-49` | “same working convention rather than a stated rule … *(Convention, not his ruling. Flagged.)*” | The declared-gap/coverage split produces different `NOT_AUTHORED(reason)` results, but is not adopted by a ruling or made a named refusal. The package imports it at `:70`. Either adopt the convention or refuse this classification. |
| `docs/audits/conformance/register-2026-09-18.json:182` | Whether applicability belongs in the register “is for Christian.” | The current prose conditions are usable, but the package relies on them as executable meta-schema without defining their data grammar. A reader must decide whether prose is accepted, parsed, or rejected. |

### I4 — algorithm steps admitting different results

| Step | File and line | Two careful readings |
|---|---|---|
| Stage 2 / Stage 5 inventory | Package `:164,167`; derivation spec `:134-142` | Allocate identities necessary for a COUNT minimum, or derive only over elements supplied from elsewhere. This is the element-inventory point above. |
| Conditional applicability | Package `:149-151,164,168`; register `:160-167` | If the governing T6/V13 line is `open` or `failed`, withdraw the dependent line because its condition is not true, or retain/fail it because applicability is undecidable. `PENDING` only says “re-check”; it provides neither outcome nor refusal. |
| Stage 7 modifiers | Package `:169,285-289,335`; register `:90` | A present “authored combination rule” could define ordered composition, a replacement, or a separate effective value. The package refuses *no* order/rule, but never defines how a rule that exists is represented or applied. |
| Stage 8 forward results | Package `:170,400`; derivation spec `:430-473` | An open supporting item can be `PENDING_CHOICE`, `NOT_REALIZED`, or merely not evaluable. `PENDING_CHOICE` has no meaning/record, so the result is invented rather than refused. |
| Stage 9 candidate checking | Package `:95-110` | It says both “a check per candidate assertion” and `ABSENT` for a line with no assertion. One engine checks only asserted lines; another enumerates resolution lines to manufacture absence checks. `CandidateGame` has no shape and no refusal resolves the contradiction. |
| Stage 10 Gate A | Package `:302-313,329-344,427-441` | §7.1 makes `NOT_CHECKABLE` non-blocking; §11 offers it, blocking `NOT_EVALUABLE`, or a wording change. This is the stated remaining decision, but its already-chosen alternate treatment makes implementation non-deterministic. |

The named refusals correctly cover unnamed aggregate functions, missing modifier order, a failed supporting-cardinality label, and pass divergence. They do **not** cover the six points above. Therefore “no invention points” is false, and the remaining implementation decisions are not limited to the six Gate A clauses.

## Working-tree check

Before this audit, the target worktree already reported unrelated untracked `.claude/` and `back/_*.txt` paths. They were not touched. The only files created for this audit are:

- `docs/audits/conformance/final-package-sweep.js`
- `docs/audits/conformance/final-package-sweep-report.md`
