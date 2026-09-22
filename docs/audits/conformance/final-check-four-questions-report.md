# Final independent check - four questions

## Checkout and source set

- Checkout: `C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18`
- Branch: `claude/serene-dewdney-c78e18`
- Commit: `123f29b845c3ae749ef773ff6e95cde41fe3c08d`
- Checker: `docs/audits/conformance/final-check-four-questions.js`

Files read:

- `docs/design/derivation-engine-design-package-2026-09-20.md` (revision 5)
- `docs/design/game-representation-spec-2026-09-18.md` (revision 10)
- `docs/design/derivation-spec-2026-09-20.md`
- `docs/audits/conformance/register-2026-09-18.json`
- `docs/audits/conformance/grammar-sheet-2026-09-18.md`
- `docs/design/knowledge-authoring-tasks.md`

The checker used Node only, removed a UTF-8 BOM before parsing the register JSON, and writes only to stdout.

## 1. Does any live text contradict SD-39 onward or another current ruling?

**CLEAN.** No finding.

The current ruling rows SD-39 through SD-44 occur once each in the representation specification. P-4 and SD-R2 are retired as authorities; SD-40 preserves the candidate as evidence only; SD-42 prescribes `PASS_DIVERGENCE`; and SD-43 and SD-44 are carried into Gate A and reachability. The task register now includes F3 and F4, so every residual gap the package says is listed there has a corresponding task-register record.

## 2. Does any record, type or rule used by the engine remain undefined?

**CLEAN.** No finding.

The public input, reference, and gate-input records are now declared in package Section 1.8: `LoadedContract` at line 133, `ItemRef` at line 150, and `GateInput` at line 155. The remaining public records are declared in the same catalogue. The register parses after BOM removal with 82 unique rows, all required indexed data blocks, and no invalid `ownerRow` values.

## 3. Could two conforming implementers make different semantic choices from the specification?

**CLEAN.** No finding.

The package retains explicit semantics for unmerged element classes, candidate-to-class satisfaction, the four formerly uncovered value forms, derivation-mode `NOT_APPLICABLE`, qualitative bounds, and structurally reachable triggers. Named refusal paths remain determinate rather than choices for an implementer.

## 4. Does any code path require an inference for which no authority exists?

**CLEAN.** No finding.

Unsupported or uncomputable paths use named refusals. The two Gate A specification gaps remain blocking `CHECK_NOT_EXECUTABLE` outcomes; the other known gaps are recorded and refused where reached, not inferred.

## Overall verdict

**all four clean**

## Exact residual known specification and knowledge gaps

The following is the package's Section 11.2 residual list, with the corresponding task-register row.

| Residual known gap | Kind | Effect today | Task-register record |
|---|---|---|---|
| `GA-RESIDUAL-SPACE` has no machine-testable definition | specification | blocks Gate A for every game | F1 |
| `GA-MODIFIER-OVERLAP` has no test for `object` and `event` conditions | specification | blocks Gate A where those types occur - two corpus items | F2 |
| No aggregate function for a comparison over several matched elements | specification | comparison refused; none in the corpus | C5 |
| No authored order for combining two modifiers on one referent | specification | effective value not computable; none in the corpus | F3 |
| A failed supporting cardinality check has no ruled label | specification | `UNLABELLED`, one refusal naming every case | F4 |
| No value modifier in the corpus declares an operation (3 magnitudes, 0 operations) | knowledge | no effective value is computable | A4 |
| Carrier placement relative to the progression line (A1); build-out restart placement (A2) | knowledge | those properties fail as gaps | A1, A2 |
| Eleven Game Forms leave a start or restart unauthored (A5) | knowledge | those transitions fail as gaps | A5 |
| Wide Zone's contract restatement (A3); the four nonconforming `BUILD_OUT_EPISODE` uses (B1) | knowledge | Wide Zone's channels resolve as a declared gap; the four items support nothing | A3, B1 |
| The contract file's mojibake (B2), 19 row-less items of which 5 structural (B4), 8 items selecting on an unregistered attribute (B5) | data | those contracts or items are refused at load | B2, B4, B5 |
| The six representational limits (C1-C6) | grammar, deliberately unsolved | recorded individually; no extension until a real case needs one | C1-C6 |