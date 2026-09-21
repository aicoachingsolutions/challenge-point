# CODEX-TASK — verify every factual claim in the design package

**Type:** read-only verification. **You change no knowledge, no contracts, no evidence, no register.**
**Deliverable:** one report file plus the script that produced it.

---

## 0. Which checkout — read this first

Work **only** in:

```
C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18
```

That is a git worktree on branch `claude/serene-dewdney-c78e18`. **Do not touch `C:\challenge-point`
itself** — it is a stale main checkout at an older commit, and work done there is lost. Confirm before
you start:

```bash
git -C "C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18" rev-parse --abbrev-ref HEAD
# must print: claude/serene-dewdney-c78e18
```

State in your report which path you actually read from.

## 1. Why this exists

A design package is going to the project owner for review. It asserts about twenty counts and facts
about the artefacts. Several were produced by parallel drafting agents **that disagreed with each
other** — the same fact was reported as 107, 152 and 144 in three places, and another as 3 and 13. Every
number in the package must be recomputed from the artefacts before it is sent.

**Your job is to recompute, not to trust the package and not to fix anything.**

## 2. Constraints

1. **Read-only.** Create only your script and your report. Edit nothing else — not the register, not the
   contracts, not the design documents. Implementation and generation are frozen by the project owner.
2. **If a claim is wrong, report it.** Do not correct the document.
3. **If a claim is ambiguous** — you cannot tell what would count as confirming it — say so explicitly
   rather than choosing the reading that makes it true.
4. **No network. No new dependencies.** Node is available; the artefacts are JSON.
5. **Every JSON file may carry a UTF-8 BOM.** Strip it before parsing:
   `JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''))`.
6. **Do not write a regex through a Python heredoc.** Use Node, with the pattern in a `.js` file.

## 3. The artefacts

| Path (relative to the worktree) | What it is |
|---|---|
| `docs/audits/conformance/register-2026-09-18.json` | the schema as data — rows, vocabularies, applicability, citable standing decisions |
| `docs/audits/conformance/stage-b/contracts.json` | the eight contribution contracts |
| `docs/audits/conformance/stage-b/game.json` | the resolved slice game (a hand-derivation worksheet) |
| `docs/design/derivation-engine-design-package-2026-09-20.md` | the package whose claims you are checking |
| `docs/design/knowledge-authoring-tasks.md` | the task register, which repeats several of the same counts |

## 4. The claims to verify

For each: recompute from the artefacts, report **CONFIRMED**, **WRONG (actual: X)**, or
**UNVERIFIABLE (why)**. Quote where in the package the claim appears.

### Register

| # | Claim |
|---|---|
| R1 | The register holds **82 rows** |
| R2 | Exactly **12 rows carry a `fillable` entry**, and they are `S2 S5 S6 P2 P5 O1 O3 O4 O5 J3 T2 V1` |
| R3 | **54 field/view rows carry `ownerRow`**, and **13 game-level rows carry none**: `E1 E2 E3 E4 S1 SV1 P5 P6a P6b P7 DV1 V1 V2` |
| R4 | Every `ownerRow` value is the id of a row whose `kind` is `COLLECTION`, and that collection's `path` is a proper prefix of the field row's `path`. **Report any row where it is not** |
| R5 | There are **10 citable standing decisions**: `SD-06 SD-07 SD-09 SD-10 SD-11 SD-12 SD-13 SD-14 SD-20 SD-25` |
| R6 | Exactly **2 rows are `VIEW`** (`SV1`, `DV1`); **15 are `COLLECTION`**; **65 are `FIELD`** |
| R7 | Every closed list named in a row's `valueType` prose has a corresponding entry in the `vocabularies` block. **Report any list in prose with no data entry** — this is the defect the block was added to close, so a survivor matters |
| R8 | Every entry in `vocabularies` (other than `note`, `draft`, `versions` and the three prose notes) has a version in `vocabularies.versions` |
| R9 | `contractEnums.scope` contains exactly `WHOLE_GAME PER_TEAM PER_OBJECTIVE_SET OWN_INVOLVEMENT BUILD_OUT_EPISODE` |
| R10 | The register parses as valid JSON |

### Contracts

| # | Claim |
|---|---|
| C1 | **8 contracts, 221 items, 860 declarations** |
| C2 | Declarations by kind: **`NON_CLAIMED` 502, `CLAIMED` 129, `UNDECLARED` 122, `NOT_AUTHORED` 85, `EXCLUDED` 22** (summing to 860) |
| C3 | **0 items** have `requirement: "COMPARES"` |
| C4 | **3 items** are on row `V9`; **0 items** are on row `V9a` |
| C5 | **19 items** have `row` equal to `"NONE"` or null, and **5 of those** are `STRUCTURAL` or `PARTLY_STRUCTURAL` in `checkability`. List those five by id |
| C6 | **8 items** use `restart` in a selector, all in the From Goal Kicks contract |
| C7 | **6 items or declarations** carry `scope: "BUILD_OUT_EPISODE"`. List them by id or row |
| C8 | **31 items and 29 declarations** carry `scope: "OWN_INVOLVEMENT"`; of the declarations, **7 are `NOT_AUTHORED` and 1 is `UNDECLARED`**, on rows `S2 S6 J6 J10 V18 V19 V22` |
| C9 | The three-character sequence `U+00E2 U+20AC U+201D` (mojibake) appears **144 times**, and the file contains **0** real em dashes (`U+2014`). Also report the per-field breakdown: how many occurrences are in `declarations[].scope`, in `structuralClause`, in `row`, and in `fitNote` |
| C10 | **0 items** have an empty or missing `basisEvidence` |
| C11 | Every item's `scope` is one of the five in `contractEnums.scope`, **except** the mojibake placeholder. Report the count of items whose scope is the placeholder |

### Cross-artefact

| # | Claim |
|---|---|
| X1 | Every `row` value used by any contract item is either a register row id, `"NONE"`, null, or the placeholder. **List any other value** |
| X2 | Every selector attribute used on a **field row** item exists in the `selectorAttributes` of that row's `ownerRow` collection. Report how many items would fail this check, and how many would fail if the check ran against the *field row's own* `selectorAttributes` instead. **The package claims these two numbers are 8 and 63** |
| X3 | `game.json` line ids are positional (`L1`…`L210`) rather than structural. Confirm the count of lines and the id form |

## 5. What to produce

1. **`docs/audits/conformance/package-fact-check.js`** — one Node script, no dependencies, that
   recomputes every claim above and prints a table.
2. **`docs/audits/conformance/package-fact-check-report.md`** — the report: one row per claim with
   CONFIRMED / WRONG (actual) / UNVERIFIABLE, the number you computed, and for any WRONG result the
   exact place in the package that must change.

At the top of the report state: the checkout path you used, the git commit you checked at
(`git rev-parse HEAD`), and the total of CONFIRMED / WRONG / UNVERIFIABLE.

## 6. What good looks like

- Every number recomputed from the file, never copied from the package.
- Where a claim needs a judgement call (what counts as "uses `restart` in a selector"), the report says
  which rule you applied.
- A wrong claim is stated plainly with the actual value. **Finding errors is the point of the task** —
  a report of all-confirmed that missed one is worse than a report that finds three.
- No file outside the two you create is modified. `git status` at the end shows only those two.

## 7. Do not

- Do not fix the package, the register or the contracts.
- Do not "clean up" the mojibake. It is evidence of a defect that is being reported to the owner.
- Do not add the missing items to any register, or repair a contract to make a check pass.
- Do not implement any part of the derivation engine. This is a fact check over static files.
