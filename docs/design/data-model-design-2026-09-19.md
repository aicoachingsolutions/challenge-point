# Data-model implementation design — part 1, what is separable

19 September 2026; **revision 2, 20 September**, after his rulings on AM-01 to AM-15, the comparative
claim, and the collision rerun. Paper only: no implementation, no generation. Christian cleared this to
begin on 19 September, "if that work is separable from the unresolved derivation semantics".

**What changed in revision 2.** The shapes gained what his rulings settled and the rerun exercised: a
comparative item, a collision record, a line outcome distinct from a property status, and the item
results he approved. The `[waits]` marks shrank — AM-01 to AM-15 are ruled — and the ones that remain
now name the six residuals from the rerun rather than the fifteen amendments. **No new area, status,
source kind or relation** has been added; `valid absence` is a line outcome and the four Game statuses
are untouched, as he directed.

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

**A comparative item** (`requirement: COMPARES`, AM-16 as he extended it) carries a second operand:

```
  comparison: { operator, right: <operand> }         // operator in = ≠ < ≤ > ≥
```

- **`strictness` may not be `EXCLUSION`.** A comparative is a relationship, not a prohibition — his
  instruction, enforced at load rather than left to a checker.
- **[waits] what an operand may be.** Two shapes are possible and the choice is his (residual 1 of the
  rerun): `{ row, selector }`, which is AM-16 as adopted but cannot express `value(A) > value(B)`
  because no row holds a region's value; or `{ derived: <named rule>, args }`, which can, at the cost of
  admitting derived quantities into the grammar. The storage shape is the same either way — one tagged
  union — so this waits without blocking anything else.
- A comparative's `basis` is load-bearing in a way other items' is not: it decides whether one object's
  reading of its own meaning can contradict another object's words. Where the comparand is not in the
  object's text, the item is `ASSUMED` and says so.

### 3.3 The audit record

```
Audit {
  properties: [ { propertyId, status, reason?, lineOutcome?, sources: [ref], support: [ref],
                  collision?: collisionId, derivationVersion } ]
  items: [ { contractId, itemId, result, note? } ]
  collisions: [ { collisionId, propertyId, items: [ref], bounds: [text],
                  decidedBy: ruleId | null, why } ]
  dispositions: [ { contractId, itemId, disposition, citing } ]
}
```

- `status` is one of the four: resolved, free, not authored, unresolved. Resolved carries how it was
  reached, and free carries which kind. These are labels on the four statuses, not new statuses.
- **`lineOutcome` is separate from `status`**, because he approved `valid absence` as a line outcome and
  kept the four Game statuses unchanged. One field cannot carry both without becoming a fifth status.
- **`result`** is the forward list's item result: satisfied, violated, unmet, adapted, inert, not
  checkable, **not evaluable**, and — if he takes it — `not realized`. He approved the first of the two
  proposed labels and the second waits.
- **`collisions` is new in revision 2.** The rerun's finding was that two contradictory items were
  reported as two unrelated failures with nothing saying they were opposed. A collision is therefore a
  record in its own right, not a flag on a property: it names the items, what each demanded, and why
  nothing decided it. `decidedBy` is null when nothing did, which is the case SD-02 sends to unresolved.
  Without this record, the audit can show a game stopped without showing which two objects stopped it.
- `sources` and `support` are computed, never written by whatever resolves the game.
- `derivationVersion` stamps which rule set produced the record, so a stored activity can be re-audited
  when the rules change.

**[waits]** The values these fields may take are fixed. Which one a given property gets is derivation.
AM-01 to AM-15 are now ruled, so what remains open is narrower: the six residuals from the collision
rerun, chiefly what may be an operand and whether an assumed item can collide with an authored one.

## 4. Storage and loading

**Where contracts live** is Christian's to decide. The design constrains it only as follows, and any of
the candidates (a workbook sheet, the RPC library's own rows, or a separate layer keyed by object id)
satisfies these:

| Requirement | Why |
|---|---|
| Keyed by knowledge object id, never by EM family id | Decision 6 of 15 September binds neither family id set |
| Versioned with the knowledge it describes | A contract is only true of one version of its object |
| Loaded whole, with no allowlist projection | The project's costliest recurring failure is an allowlist quietly dropping authored fields. The Soccer Module's parameter columns are empty today and the adapter maps none of them, so anything authored there would vanish |
| **Fail closed** | An unknown row id, an unknown requirement kind, a missing basis quote, or a field the loader does not recognise is a load error that refuses the contract. Never a default, never a skip. Extended in revision 2: an unknown comparison operator, an operand shape the register does not permit, and a comparative written with exclusion strictness are all load errors |
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

Revision 2 narrows this list: AM-01 to AM-15 are ruled, so how support is derived is settled in the
derivation specification and no longer sits here. What the shapes still refuse to settle:

- **What may be an operand of a comparison** (§3.2). The storage shape is a tagged union either way.
- **Whether an assumed item can collide with an authored one.** The collision record holds both cases;
  which one produces a collision is derivation, and his.
- **Whether a collision outranks an unauthored gap on the same line.** The shapes keep them separable —
  `status` and `collisions` are different fields — precisely so that ordering is a derivation decision
  and not a storage one.
- **Cardinality as a first-class property.** He ruled no schema change yet, so there is no cardinality
  line, and a count remains an item result. If that changes it is a new row kind, not a new area.
- The closed vocabularies' contents (SD-18): they are versioned data for exactly this reason.
- Whether the six sentences in code become knowledge, standing decisions or are retired — now
  classified and with him (`docs/design/code-sentences-classification-2026-09-20.md`). Until he rules,
  they load as engine-only and support nothing.

## 7. Next parts

- **Part 2, after the six residuals:** the derivation engine — support, statuses, the gates, and the
  failure path. He said the collision question is sufficiently exercised for this design to begin once
  the rerun worked; it partly did, and the residuals are what part 2 would otherwise have to guess.
- **Part 3:** rendering under render fidelity, and the disposition of every step that writes structure
  today.
- **Done, before part 2:** the collision test (19–20 September) and the narrow rerun under AM-16 and
  AM-17 (`docs/audits/collision-test-2026-09-20.md`, `docs/audits/collision-rerun-2026-09-20.md`).

**What part 1 can still advance on its own, without any of the six:** the loader's report format, the
migration story when a register version changes under stored activities, and the disposition list in §5
— the steps that write structure after the seam today. None of those depends on how support is derived.
