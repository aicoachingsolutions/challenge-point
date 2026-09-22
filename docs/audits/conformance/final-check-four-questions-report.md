# Final independent check - four questions

## Checkout and source set

- Checkout: `C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18`
- Branch: `claude/serene-dewdney-c78e18`
- Commit: `0b72b17495e516e376fe09d6a4c46e9fc43f6cea`
- Checker: `docs/audits/conformance/final-check-four-questions.js`

Files read:

- `docs/design/derivation-engine-design-package-2026-09-20.md` (revision 5)
- `docs/design/game-representation-spec-2026-09-18.md` (revision 10)
- `docs/design/derivation-spec-2026-09-20.md`
- `docs/audits/conformance/register-2026-09-18.json`
- `docs/audits/conformance/grammar-sheet-2026-09-18.md`
- `docs/design/knowledge-authoring-tasks.md`

The checker used Node only and removed a UTF-8 BOM before parsing the register JSON. It writes only to stdout.

## 1. Does any live text contradict SD-39 onward or another current ruling?

**NOT CLEAN.**

| Finding | File, line, and text | Classification |
|---|---|---|
| The package says every residual gap is also on the task register, but two are absent | `docs/design/derivation-engine-design-package-2026-09-20.md:618` - `Residual known gaps - the exact list (each also on the task register):` | minor |

The task register has no row for `No authored order for combining two modifiers on one referent` or `A failed supporting cardinality check has no ruled label`. This is a live documentation-consistency defect in the package's residual-gap claim. It does not alter engine behaviour.

The current ruling rows SD-39 through SD-44 occur once each in the representation specification at lines 201-206. The package, derivation specification, and register consistently retire P-4 and SD-R2 as authorities; preserve SD-40's evidence-only candidate mode; prescribe `PASS_DIVERGENCE` for SD-42; and carry SD-43 and SD-44 into Gate A and reachability.
## 2. Does any record, type or rule used by the engine remain undefined?

**NOT CLEAN.** The declared public record catalogue and register data blocks parse and are internally present (82 unique register rows and no invalid `ownerRow`), but these named engine types are not defined in any required source.

| Finding | File, line, and text | Classification |
|---|---|---|
| `LoadedContract` is named but never defined | `docs/design/derivation-engine-design-package-2026-09-20.md:50` - `| contracts | one LoadedContract per selected object, loaded whole |` | genuine blocker |
| `ItemRef` is named but never defined | `docs/design/derivation-engine-design-package-2026-09-20.md:136` - `Collision { collisionId, lineId, items: ItemRef[], demanded: Bounds[], decidedBy: ruleId | null }`; `:137` - `RelationshipConflict { conflictId, items: ItemRef[], operands: Value[], why, objects: objectId[] }`; `:138` - `Tension { tensionId, items: ItemRef[], why }` | genuine blocker |
| `GateInput` is named but has no record declaration | `docs/design/derivation-engine-design-package-2026-09-20.md:537` - `D6 GateInput contains no Tension, and gate output is identical whatever tensions exist.` | minor |

`LoadedContract` has no declared input record shape or declared relationship to the contract grammar. `ItemRef` has no declared contents even though three public audit records require it. Either omission permits incompatible public input/audit representations, so each is a genuine blocker. The package describes the gate input in prose as resolution plus audit without tensions, so the undeclared `GateInput` name does not change gate behaviour.

## 3. Could two conforming implementers make different semantic choices from the specification?

**CLEAN.** No finding.

The package fixes the formerly divergent semantics: classes retain `IN` constraints without choosing a member or merging (lines 251-267); a candidate belongs to every satisfying class and is never paired to a derived individual (lines 310-327); qualitative, dynamic-location, open-token, and procedure values have stated operations or a named refusal (lines 181-198); Gate B reverse has `NOT_APPLICABLE` in derivation mode (lines 156-164 and 451-455); and SD-44 specifies structural reachability and its accessibility withdrawals (lines 270-306).

## 4. Does any code path require an inference for which no authority exists?

**CLEAN.** No finding.

The package routes uncomputable or unsupported paths to named refusals, including `NO_AGGREGATE_FUNCTION`, `NO_MODIFIER_ORDER_RULE`, `MODIFIER_OPERATION_MISSING`, `RULE_NOT_EXECUTABLE`, `VALUE_NOT_COMPARABLE`, `LABEL_NOT_RULED`, `CHECK_NOT_EXECUTABLE`, `INPUT_DEFECT`, and `PASS_DIVERGENCE` (lines 360-369). The two represented-but-undefined Gate A checks remain blocking specification gaps rather than inferred behaviour (lines 498-510); the task register records the same F1 and F2 gaps.

## Overall verdict

**genuine blocker found**

## Exact residual known specification and knowledge gaps

The following is the package's Section 11.2 residual list, with its task-register identifiers where the register names the same recorded gap. These are known gaps, not additional failures of questions 1, 3, or 4.

| Residual known gap | Kind | Effect today | Task-register record |
|---|---|---|---|
| `GA-RESIDUAL-SPACE` has no machine-testable definition | specification | blocks Gate A for every game | F1 |
| `GA-MODIFIER-OVERLAP` has no test for `object` and `event` conditions | specification | blocks Gate A where those types occur - two corpus items | F2 |
| No aggregate function for a comparison over several matched elements | specification | comparison refused; none in the corpus | C5 |
| No authored order for combining two modifiers on one referent | specification | effective value not computable; none in the corpus | no task-register row |
| A failed supporting cardinality check has no ruled label | specification | `UNLABELLED`, one refusal naming every case | no task-register row |
| No value modifier in the corpus declares an operation (3 magnitudes, 0 operations) | knowledge | no effective value is computable | A4 |
| Carrier placement relative to the progression line (A1); build-out restart placement (A2) | knowledge | those properties fail as gaps | A1, A2 |
| Eleven Game Forms leave a start or restart unauthored (A5) | knowledge | those transitions fail as gaps | A5 |
| Wide Zone's contract restatement (A3); the four nonconforming `BUILD_OUT_EPISODE` uses (B1) | knowledge | Wide Zone's channels resolve as a declared gap; the four items support nothing | A3, B1 |
| The contract file's mojibake (B2), 19 row-less items of which 5 structural (B4), 8 items selecting on an unregistered attribute (B5) | data | those contracts or items are refused at load | B2, B4, B5 |
| The six representational limits (C1-C6) | grammar, deliberately unsolved | recorded individually; no extension until a real case needs one | C1-C6 |

