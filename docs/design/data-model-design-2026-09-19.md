# Data-model implementation design — part 1, what is separable

19 September 2026. Paper only: no implementation, no generation. Christian cleared this to begin on 19
September, "if that work is separable from the unresolved derivation semantics".

**What this covers:** the shapes that hold a game, a contract and the audit trail, how they are stored
and loaded, and where they sit in the generation path.

**What it does not cover, deliberately:** how support is derived, the gates' algorithms, and the
renderer. Those wait for the rulings on AM-01 to AM-15. Every place a derivation decision would
otherwise leak into a shape is marked **[waits]**.

**The test it must meet:** the conformance check established that the register holds eight contracts
without a new area, status, source kind or relation. This design must not quietly add one.

## 1. The three artefacts

| Artefact | What it is | Who writes it |
|---|---|---|
| **Contract** | What one selected knowledge object requires, excludes, constrains and does not claim | Authored per knowledge object, ratified by Christian |
| **Game** | The resolved facts in the eight areas: elements and their property values | Produced per activity, at the seam in §5 |
| **Audit** | For each property: its sources, its support, its status | Produced with the game; read by the gates and kept with the activity |

The game holds only values. The audit holds only provenance. Nothing in the game needs the audit to be
rendered, and nothing in the audit is coach-facing.

## 2. The register as schema

The register (`docs/audits/conformance/register-2026-09-18.json`) is the schema, not a document about
it. It is versioned data, loaded at start-up, and it defines:
- the **rows**: 81 today, each with an id, a path, a kind (collection, field, view), a value type and,
  for collections, its selector attributes;
- which rows a free choice may fill;
- the closed vocabularies, each versioned separately so SD-18's review can replace contents without
  touching code;
- the citable standing decisions, as typed items;
- the relative terms and team designations.

**Two things follow for the code.** Row ids are the only keys anything uses — contracts, properties,
gates and reports all key on them. And no row, vocabulary value or standing decision is written in
source: they are data, so authoring changes do not need a deploy.

**[waits]** The register's `fillable` marks and the typed standing decisions are inputs to derivation.
The shapes are fixed; their use is not.

## 3. Shapes

### 3.1 A game

```
Game {
  activityId, registerVersion, vocabularyVersions
  elements: [ { elementId, row, attributes: { <selectorAttribute>: value } } ]
  properties: [ { propertyId, elementId | null, row, value } ]
}
```

- One property per (element, row), and one per member for set- and list-valued rows, as the unit of
  judgement in the check.
- A view row (direction, implicit fractions) is computed on read and never stored. The computation is
  pure and lives with the register version.
- A property with no element, such as the envelope's, carries `elementId: null`.

### 3.2 A contract

```
Contract {
  contractId, objectId, objectKind, knowledgeVersion, registerVersion
  items: [ { itemId, row, selector, requirement, value, strictness, valueStatus,
             scope, basis, basisEvidence, checkability, structuralClause } ]
  declarations: [ { row, selector?, scope?, declaration, note } ]
  relationshipRules: [ { ruleId, owner, decides, outcome, evidence } ]
  notAuthored: [ { row, selector?, missing } ]
}
```

- `basis` is one of authored, assumed, owner ruling or engine-only. **An engine-only item is stored,
  never silently dropped** — it is a ratification candidate, and it supports nothing (SD-21).
- `basisEvidence` holds the verbatim quote and its source id. A contract item without evidence is a
  load error, not a warning.
- Declarations carry an optional selector and scope, as the check required.

### 3.3 The audit record

```
Audit {
  properties: [ { propertyId, status, reason?, sources: [ref], support: [ref],
                  collision?: [ref], derivationVersion } ]
  items: [ { contractId, itemId, result, note? } ]
  dispositions: [ { contractId, itemId, disposition, citing } ]
}
```

- `status` is one of the four: resolved, free, not authored, unresolved. Resolved carries how it was
  reached, and free carries which kind. These are labels on the four statuses, not new statuses.
- `sources` and `support` are computed, never written by whatever resolves the game.
- `derivationVersion` stamps which rule set produced the record, so a stored activity can be re-audited
  when the rules change.

**[waits]** The values `status`, `reason` and `result` may take are fixed. Which one a given property
gets is derivation, and waits for AM-01 to AM-15.

## 4. Storage and loading

**Where contracts live** is Christian's to decide. The design constrains it only as follows, and any of
the candidates (a workbook sheet, the RPC library's own rows, or a separate layer keyed by object id)
satisfies these:

| Requirement | Why |
|---|---|
| Keyed by knowledge object id, never by EM family id | Decision 6 of 15 September binds neither family id set |
| Versioned with the knowledge it describes | A contract is only true of one version of its object |
| Loaded whole, with no allowlist projection | The project's costliest recurring failure is an allowlist quietly dropping authored fields. The Soccer Module's parameter columns are empty today and the adapter maps none of them, so anything authored there would vanish |
| **Fail closed** | An unknown row id, an unknown requirement kind, a missing basis quote, or a field the loader does not recognise is a load error that refuses the contract. Never a default, never a skip |
| Contract coverage checked at load | Every register row declared. A row left undeclared is reported against the contract, not against the game |

The loader emits one report per load: contracts loaded, rows covered, engine-only items, and every
refusal with its reason.

## 5. Where it sits in the generation path

Measured in the recommendation, and unchanged by the check:

1. Selection runs as today.
2. The scoring-event choice is separated from its coach wording. The choice is structure; the wording
   moves to rendering.
3. **The game is resolved here**, between selection and the constraint package.
4. The gates run on the resolved game.
5. Rendering happens only if the gates pass, and draws only on the game.

Two consequences the design must carry:
- **Nothing before step 3 may write coach-facing text.** Today the first coach sentence is written at
  scoring resolution, before any game exists.
- **Nothing after step 3 may add or remove structure.** The steps that currently do — the merge, the
  legacy mapper's player-format and area rewrites, the unscored-object removal, and the must-keep
  modifier lines — each need a disposition: retire, or keep as wording that cannot touch structure.

**[waits]** The gates' algorithms and the failure path (refuse, return fewer activities, or re-select)
follow the rulings. The seam does not.

## 6. What this design refuses to decide

- How support is derived, and what each property's status is (AM-01 to AM-15).
- Whether an element no declaration reaches is silence or a coverage gap (AM-04): the shapes allow
  both, and the loader reports it either way.
- Which elements a minimum count entails (AM-05).
- The closed vocabularies' contents (SD-18): they are versioned data for exactly this reason.
- Whether the six sentences in code become knowledge, standing decisions or are retired. Until then
  they load as engine-only and support nothing.

## 7. Next parts

- **Part 2, after the rulings:** the derivation engine — support, statuses, the gates, and the failure
  path.
- **Part 3:** rendering under render fidelity, and the disposition of every step that writes structure
  today.
- **Before part 2:** the collision test on central weighting against Wide Zone Advantage, which the
  slice never exercised, using the rules he adopts.
