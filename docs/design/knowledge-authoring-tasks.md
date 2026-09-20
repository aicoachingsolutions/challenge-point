# Knowledge and representation task register

Opened 20 September 2026. **This is the collection point** for knowledge defects, gaps and
representational limits that derivation work exposes. Christian's instruction on 20 September:

> "This should now be the collection point for known knowledge defects/gaps exposed by derivation work
> rather than solving them opportunistically."

And the standing constraint on every row:

> "Do not repair these simply to make tests green." · "Do not fill them from legacy code."

**None of these blocks derivation-engine design.** Each blocks a specific game from resolving, or a
specific sentence from being written. Nothing here is fixed by the engine: an engine that filled one of
these gaps would be authoring, which is the boundary SD-37 draws — *derivation diagnoses; it does not
design*.

---

## A. Authoring gaps — knowledge that must be written

| # | What is missing | Where it bites | Opened |
|---|---|---|---|
| A1 | **Where a carrier sits relative to the progression line.** RPC-001 does not own or instantiate its scoring carrier (KR-04), and the four retired setup sentences were doing that job on its behalf. Nothing now authors the placement | Any RPC-001 activity: the carrier's position has no supported value | KR-05, 20 Sep |
| A2 | **Where a build-out restart is taken from.** RPC-PROP-001 authors the begin condition and says nothing about placement. The retired sentence said "in your own half", which no workbook authors | Any build-out episode | KR-05, 20 Sep |
| A3 | **Wide Zone Advantage's contract needs restating** to use a lateral selector at whole-game scope. Every region item is at own-involvement scope, which AM-13 empties, and no item anywhere uses the lateral selector AM-17 provides. His ruling: "Do not repair Wide Zone through derivation" | Wide Zone's wide channels resolve as a declared gap (SD-31), so the game does not resolve | 20 Sep, **no action now** |
| A4 | **No value modifier anywhere declares an operation.** SD-30 makes a magnitude without an operation *incomplete*, so every modifier in the corpus is incomplete until its knowledge is amended | Every effective-value comparison; every activity carrying a scoring multiplier | SD-30, 20 Sep |
| A5 | **Eleven Game Forms leave a start or restart unauthored.** Measured 18 September; the model invents them today | Every activity using those forms | 18 Sep |

## B. Contract defects — restatement work, not new knowledge

| # | What is wrong | Evidence | Opened |
|---|---|---|---|
| B1 | **Four of the six `BUILD_OUT_EPISODE` uses do not conform to its approved definition.** `RPC-001-16.a` (T4), `16.b` (T3), `16.c` (T6) and the T4 declaration are keyed on the triggers that *end* an episode and begin the next, so they claim the extension to subsequent attacking episodes SD-36 excludes. All three are also `ENGINE_ONLY` on the sentence retired by KR-05 item 6, and `16.c` contradicts SD-20 | Checked at his instruction, 20 Sep. `RPC-001-11.b` and its declaration conform | 20 Sep |
| B2 | **The contract file is mojibake, in 144 places.** I called this "an em-dash placeholder"; it is not. The three characters `U+00E2 U+20AC U+201D` are a UTF-8 em dash decoded as cp1252 and re-encoded, and the file contains **zero** real em dashes. It sits in `declarations[].scope` 64 times, `structuralClause` 35, `row` 6, `fitNote` 2, and elsewhere. An engine cannot read it as "absent" — it reads a value that is not a row id, not a scope and not a clause. **The fix is in the artefact**, and the engine must accept exactly one spelling of "not applicable": JSON `null` | Verified by byte inspection, 20 Sep | 20 Sep |
| B4 | **19 items carry `row: "NONE"`.** Fourteen are `OUTSIDE_BOUNDARY` and legitimate; **five are `STRUCTURAL` or `PARTLY_STRUCTURAL`** and so are genuine defects — a structural claim with no row to land on | Stage-B contracts, 221 items | 20 Sep |
| B5 | **Eight items select on `restart`, which is not a registered selector attribute** of T1–T6. All are From Goal Kicks, and its own ledger already flags them | Stage-B contracts | 20 Sep |
| B6 | **No contract in the corpus contains a single `COMPARES` item.** The comparative machinery — AM-16, SD-23 to SD-28, effective value, relationship conflicts — has never been exercised against authored contract data, only against items written for the collision tests | Stage-B contracts, 221 items | 20 Sep |
| B3 | **`WIDEZONE-09` never became an item at all.** Its "not dominant" requirement had no closed kind, yet the game's corridor lines cite it as provenance | Collision test, 20 Sep | 20 Sep |

## C. Representational limits — recorded individually, and deliberately not solved

His instruction (SD-38): no grammar extension yet; **record each one separately**; and specifically
*"do not yet collapse the three conditional-looking cases into one mechanism. They may have different
eventual ownership."* Each row therefore carries its own candidate owner, in his words.

| # | What cannot be said | The concrete case | Candidate owner |
|---|---|---|---|
| C1 | **A requirement conditioned on another property's value** | RPC-001's scoring carrier depends on which scoring event was chosen — a line, a zone, gates or a target player. Items 05, 08 and 11.b are all conditional, and no item can guard on another row's value or span rows | *"may require conditional applicability based on a resolved game property"* — inside the representation |
| C2 | **A permission conditioned on another object** | GF4: a constraint "can be introduced … when the goal is defending under overload" — a condition on the *session goal*, not the game | *"may instead belong upstream in selection/applicability"* |
| C3 | **An either/or between two whole layouts** | GF4: "two-goal or two-target field" means two of *one* kind; the set selector also admits one of each, and there is no alternative-of-items mechanism | *"may be an alternative-realization issue"* |
| C4 | **An existence a source gives only as an example** | GF4 I16/I17. RC-6 forces `N/A` on existence items, so `TYPICAL_EXAMPLE` cannot attach; only `SUPPORTING` softens it, and it says something different | Waits for authored knowledge that justifies the change |
| C5 | **An aggregate across elements** | Wide Zone's "not dominant": the two channels' combined widths against the envelope width. No requirement kind aggregates, and no aggregate function is named for comparisons — one hole seen from two sides | Waits, as above |
| C6 | **A comparison of two counts** | `count(A) = count(B)` — cardinality is not a property (SD-34, deliberate) | Returns only with a concrete authored case that needs it |

**Why C1, C2 and C3 are three rows and not one.** They look alike in the grammar, and I had grouped
them. He ruled against that, and the reason holds: if their homes are the representation, selection and
realization respectively, then one conditional mechanism would have been the wrong answer three times.
The distinction is preserved until real cases decide it.

## E. For Christian — surfaced by the design work, needing a ruling

| # | What | Why it needs him |
|---|---|---|
| E1 | **The whole free-choice mechanism rests on an unruled proposal.** A free choice is possible only on a row with a `fillable` entry, "proposal P-4, applied for this run" — P-4 has never been ruled | **SD-35 made this load-bearing.** Every `OPEN` property must now carry the authority permitting the choice. Today two of the twelve fillable rows name an authority that cannot be cited: `T2` names **SD-R2, a rejected default**, and `J3` names **P-4 itself** |
| E2 | **Does the engine take a game as input?** The approved direction lists none, but `INVENTED`, the reverse trace and derivation spec §4.6/§4.7 are all written about *a value the game states*, and have no subject without one | Proposed: two modes — DERIVE (no game; the engine states nothing so it can invent nothing) and CHECK (a candidate supplied, the full §4.6 order available). This changes a design he has approved, so it is his |

**On E1's substance:** his SD-R2 wording — *"which team starts can remain a permitted free choice unless
selected knowledge requires otherwise"* — is exactly the permission needed. The defect is the citation
form, not the decision: a rejected default is not a citable source, so it cannot be named as an
authority. The same shape as SD-10's mistyping. **I have flagged it rather than inventing an id.**

## D. Register hygiene — done, recorded so it is not redone

| # | What it was | What was done |
|---|---|---|
| D1 | Thirteen closed vocabularies existed only inside `valueType` prose, so nothing could check a value against data | Extracted verbatim into a `vocabularies` block. **Form changed, membership untouched** (SD-18 intact) |
| D2 | Conditional applicability was prose too (T2–T5 "N/A when CONTINUE"; V14b ACCESS, V14c COUNT_CHANGE). Left alone it gives every turnover transition four permanently unclosable lines | Extracted into an `applicability` block, adding no new rule. Whether applicability belongs there or needs its own mechanism is open |
| D3 | SD-10's register entry was typed as an item whose value was a prose phrase, so it could never fire | Retyped as the prohibition his ruling is, with his own necessity test (SD-10a) |
| D4 | `central` was defined twice, and the lateral values left set-membership, endpoint closure and exhaustiveness unsaid | One canonical definition; the rest stated |
| D5 | The `vocabularies` block added on 20 September **carried no versions**, though the data model requires each list versioned separately so SD-18's review can replace contents without touching code. Without them a stored result cannot be known stale when a list changes | Every list versioned. Caught by the design review, hours after I added the block |
| D6 | **No row recorded which collection owns it.** A selector on a field row selects the element of its *owning collection*, so its attributes come from there — and the two readings of that differ by **55 items across the corpus**: one refuses 63, the other 8. Two implementers would have diverged on the first file they touched | `ownerRow` added to all 54 field and view rows that have one; the 13 game-level rows carry none |
