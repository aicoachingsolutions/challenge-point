# Phase A evidence packet

24 September 2026. The cases his repair ruling reserved for individual review. **Nothing here is
repaired, inferred or typed by me.** Each is presented as evidence.

Eight cases as he asked, plus **a ninth that only became visible once the NO_ROW restatement was
applied** — it had been hidden behind an earlier refusal in the same contract.

---

## Part 1 — five structural items with no row

*"Do not assume those five share one solution."* They do not. Reading them together, they fall into
three different situations, marked below.

### 1. `restated:GF2 :: GF2-01`

| | |
|---|---|
| **Authored wording** | *"a single rectangular playing area"* |
| **Source** | *"Rectangular field with a directional target line or zone at one end"* — `soccer-module.rc1-v3.json` GF2.setup_guidance |
| **Requirement** | `EQUALS`, `REQUIRED`, `REQUIRED_RANGE`, scope `WHOLE_GAME`, basis `AUTHORED` |
| **Checkability** | `STRUCTURAL`, structural clause *"whole item"* |
| **Intended structural claim** | the playing area is one rectangle, and there is exactly one of them |
| **Current status** | `row: "NONE"` — refuses its contract |
| **Why no row holds it** | the contract's own note: *"No row holds area shape or the number of areas: the register models the area as E2 length × E3 width, so one rectangle holds by construction but can be neither stated nor checked."* |

**Situation: possibly derivable from existing represented structure.** The register models the area as a
length and a width, which *is* a single rectangle — so the claim may already be true by construction and
need no row at all. The open question is whether a claim that holds by construction should be
representable as a claim.

### 2. `restated:GF2 :: GF2-02`

| | |
|---|---|
| **Authored wording** | *"one area both teams occupy at once, with no partition or separating boundary that removes direct contest for the ball"* |
| **Source** | *"Participants share an adaptive opportunity space."* — `game-archetype-workbook.rc1.1.json` GAK-0106 |
| **Requirement** | `EXISTS`, `REQUIRED`, `N/A`, scope `WHOLE_GAME`, basis `AUTHORED` |
| **Checkability** | `PARTLY_STRUCTURAL`, structural clause *"no layout element partitions the two teams into separate spaces. Not holdable: no row or selector expresses a team-keyed partition"* |
| **Intended structural claim** | no layout element partitions the two teams into separate spaces |
| **Current status** | `row: "NONE"` — refuses its contract |
| **Why no row holds it** | regions exist (`S2`) but no row or selector expresses a **team-keyed** partition |

**Situation: a candidate genuine representation gap.** The structural clause is precise and checkable in
principle; what is missing is the ability to say a region belongs to, or separates, a team.

### 3. `restated:GF2 :: GF2-15`

| | |
|---|---|
| **Authored wording** | *"a team that is passive, scripted or unable to change the other team's progression"* |
| **Source** | Assumption (original #1) from GAK-0109 — a violation to exclude |
| **Requirement** | `NOT_EXISTS`, `EXCLUSION`, `N/A`, scope `PER_TEAM`, basis **`ASSUMED`** |
| **Checkability** | `PARTLY_STRUCTURAL`, structural clause *"no rule removes a team's ability to contest the ball. Not holdable: no row for rules restricting play actions"* |
| **Intended structural claim** | no rule removes a team's ability to contest the ball |
| **Current status** | `row: "NONE"` — refuses its contract |
| **Why no row holds it** | no row holds rules restricting play actions. The contract adds: *"P1 selects only by team, so NOT_EXISTS there would forbid teams; not forced onto it"* |

**Situation: possibly incorrectly typed.** Its basis is `ASSUMED`, so under §3 it bounds and never
entails — it could never have supported a value regardless of its row. Rev 4 §6 already named this item
as *"mixing structure and play"*. This one may be a typing question before it is a representation one.

### 4. `restated:GF2 :: GF2-22`

| | |
|---|---|
| **Authored wording** | *"a rule removing legal passing options (banned receivers, forced pass order, prohibited backward or square passes); incentives to progress remain allowed"* |
| **Source** | *"Encourage progression without restricting passing options"* — GF2.representative_requirements |
| **Requirement** | `NOT_EXISTS`, `EXCLUSION`, `N/A`, scope `WHOLE_GAME`, basis `AUTHORED` |
| **Checkability** | `STRUCTURAL`, structural clause *"whole item"* |
| **Intended structural claim** | no rule removes legal passing options |
| **Current status** | `row: "NONE"` — refuses its contract |
| **Why no row holds it** | *"No row holds rules restricting play actions (V4 'eligibility' attaches only to the primary event), so the exclusion can be neither violated nor checked on the structure."* The contract also flags that `EXCLUSION` strictness for what is a design note was the original's judgement |

**Situation: the same representation gap as GF2-15** — rules restricting play actions — reached from a
different direction, and with a second question attached about whether a design note should carry
`EXCLUSION` strictness at all.

### 5. `restated:NEUTRAL-PLAYER-CONDITION :: NEUTRAL-05.a`

| | |
|---|---|
| **Authored wording** | *"active outfield participant for the whole activity: not rotated in and out, not a waiting or observing role"* |
| **Source** | *"creating a permanent numerical advantage for whichever side has the ball"* (setup_guidance); *"a live numerical overload"* (description) |
| **Requirement** | `EQUALS`, `REQUIRED`, `REQUIRED_RANGE`, scope `WHOLE_GAME`, basis `AUTHORED` |
| **Checkability** | `STRUCTURAL`, structural clause *"whole item, structural in kind, but no row holds it"* |
| **Intended structural claim** | a neutral's participation status is continuous, not rotating or observing |
| **Current status** | `row: "NONE"` — refuses its contract |
| **Why no row holds it** | *"No register row holds a neutral's participation status (knowledge-core EM-0007 Participant State owns it)."* |

**Situation: owned by another layer.** The knowledge core already has a Participant State concept; the
Game Representation does not. This is a boundary question between two layers rather than a missing row.

---

## Part 2 — three value modifiers with no operation

*"If the source does not establish an operation, say so."* **For two of the three it does not. For the
third the source language does arguably name one**, and they should not be answered together.

### 6 and 7. `restated:WIDE-ZONE-ADVANTAGE :: WIDEZONE-13.a` and `13.b`

Both restate the **same** source sentence, and both are `V9` magnitudes on selector
`condition.type=region`, `SUPPORTING`, `TYPICAL_EXAMPLE` (therefore inert), basis `AUTHORED`.

| | |
|---|---|
| **Source** | `soccer-module.rc1-v3.json#tl-v0-constraint-wide-zone-advantage` setup_guidance: *"earn an advantage (bonus point, free restart, or scoring multiplier)"* |
| **Referent / condition** | `WIDEZONE-11.a` on `V8b`: *"both wide channels of this contract, each a referent"* |
| **`13.a` magnitude** | *"a multiplier on the primary event value (size not authored)"* |
| **`13.b` magnitude** | *"added point(s) on the primary event (number not authored)"* |
| **Operation in the source** | **none.** The source offers **three alternatives** — a bonus point, a free restart, or a multiplier — and states none of them as the operation |

**The contract already says so itself.** Its `V9` declarations read: *"13.a, 13.b (inert examples)"*,
*"notAuthored #2: no multiplier size or bonus points; realization parameters null"*, and on `V10`:
*"Combination with an overlapping modifier never addressed."*

So the two items are not two modifiers — they are **one source sentence read two ways**, because the
source lists options and the restatement kept both. No operation is recoverable, and no `V9a` item
exists anywhere in the contract.

### 8. `blind:GF4 :: I14`

| | |
|---|---|
| **Source** | *"double points for quick goal"* — `game_forms[GF4].example_incentive_patterns` |
| **Referent / condition** | `I15` on `V8b`: *"{regain, shot}, in the order regain then shot"* — open text, establishing no structural identity (SD-63) |
| **Magnitude** | *"x2 (double points)"* |
| **Operation in the source** | **arguably yes.** *"Double"* is operation-bearing language: it names a multiplication, and the restated magnitude already encodes it as `x2` |

**This one differs from the other two and I do not want it answered by the same ruling.** The source does
contain operation language. Against that: the item is `TYPICAL_EXAMPLE` and therefore inert for
derivation, its condition referent is open text, and its contract records the two patterns as
alternatives that the grammar cannot express (C7). So the operation may be *recoverable* here, while
still not being *authoritative*.

---

## Part 3 — the ninth case, exposed by the restatement

### 9. `blind:PASS-COMBINATION-GATE` — 64 declarations whose scope is an em dash

This was invisible until now: the contract's first refusal was one of the six row items, and the loader
stops at the first defect. With those restated to `NO_ROW`, this surfaced.

| | |
|---|---|
| **What** | 64 of the contract's 81 declarations carry `scope: "—"` |
| **Which** | **every one** of its 64 `NON_CLAIMED` declarations. Its 12 `CLAIMED` and 5 `NOT_AUTHORED` declarations carry real scopes (`WHOLE_GAME`, `PER_TEAM`) |
| **Example** | `{ row: "E1", declaration: "NON_CLAIMED", selector: "*", scope: "—", note: "player_count_min/max are null. The gate does not depend on numbers." }` |
| **Current status** | refuses the contract: *"declaration scope is not registered"* |

**Why this is not mine to fix.** Two readings are both plausible and they differ:

1. the em dash means *"not applicable — nothing is claimed, so no scope applies"*, and the registered
   spelling of not-applicable is JSON `null`; or
2. the contract simply omitted the scope, and it should read `WHOLE_GAME` as its six peers do.

**Every other contract in the corpus gives its `NON_CLAIMED` declarations a real scope.** That makes
`PASS-COMBINATION-GATE` the outlier, which is evidence for reading 2 — but it is evidence, not a
decision, and the two readings put different data into the engine. The encoding repair has already done
its part: the em dash is now a real em dash rather than a corrupted one. What remains is a restatement.

---

## Where Phase A stands

Against his boundary — *"a contract either loads from mechanically/restatement-corrected authored
knowledge, or has a specific unresolved semantic/knowledge issue that deliberately prevents it"*:

| Contract | State |
|---|---|
| `restated:RPC-001` | **loads**, no defect |
| `restated:A01-02` | **loads**, no defect |
| `restated:VARIABLE-TARGET-CONDITION` | **loads**, no defect |
| `restated:GF2` | refuses — cases 1–4 |
| `restated:NEUTRAL-PLAYER-CONDITION` | refuses — case 5 |
| `restated:WIDE-ZONE-ADVANTAGE` | refuses — cases 6–7 |
| `blind:GF4` | refuses — case 8 |
| `blind:PASS-COMBINATION-GATE` | refuses — case 9 |

Every refusal is a specific, named, semantic issue. **No contract now refuses for a mechanical reason.**
