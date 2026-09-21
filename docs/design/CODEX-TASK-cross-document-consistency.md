# CODEX-TASK — cross-document consistency and reference audit

**Type:** read-only audit. **You change nothing.** **Deliverable:** one script and one report.

---

## 0. Which checkout — read this first

Work **only** in:

```
C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18
```

Branch `claude/serene-dewdney-c78e18`. **Do not touch `C:\challenge-point`** — it is a stale checkout at
an older commit. Confirm and state in your report:

```bash
git -C "C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18" rev-parse --abbrev-ref HEAD
git -C "C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18" rev-parse HEAD
```

## 1. Why this exists

Six documents and one register were edited heavily in a single day, incorporating about a dozen owner
rulings. A design package built from them goes to the project owner for review. **A dangling reference
or two documents stating different values for the same fact would be found by him, in a package whose
whole claim is that it is precise.**

One such defect has already been found and fixed: a row naming a *"controlled vocabulary"* was missed by
an extraction that filtered on the phrase *"closed list"*. **Your most valuable check is the
generalisation of that one** — see §3, V-checks.

## 2. Constraints

1. **Read-only.** Create only your two files. Edit nothing else. Implementation and generation are
   frozen by the owner.
2. **Report, never repair.** If a reference dangles, say so; do not add the missing definition.
3. **Strip the BOM** before parsing JSON: `JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''))`.
4. **Node only. No network, no new dependencies.**
5. **Do not write a regex through a Python heredoc.** Put patterns in a `.js` file.
6. Where a check needs a judgement call, **state the rule you applied** in the report.

## 3. The checks

### Reference checks (R)

| # | Check |
|---|---|
| R1 | Every `SD-nn` cited in any document under `docs/` resolves to a definition in the standing-decision register — §2 of `docs/design/game-representation-spec-2026-09-18.md`. **List every cited id with no definition**, and every defined id never cited |
| R2 | The same for `KR-nn`, and for `SD-R1`/`SD-R2`/`SD-R3` (rejected defaults — note these are **not** citable as authorities) |
| R3 | Every `AM-nn` cited resolves to a definition in `docs/design/amendments-am01-am15-2026-09-19.md` or `docs/design/derivation-spec-2026-09-20.md`. Report AM numbers cited above the highest defined |
| R4 | Every `RC-nn` cited resolves to a definition somewhere under `docs/`. Report any that does not |
| R5 | Every file path mentioned in a `docs/design/*.md` or `docs/audits/*.md` file exists. Report broken paths |
| R6 | Every section reference of the form `§n` or `§n.n` into the **derivation spec** points at a section that exists in `docs/design/derivation-spec-2026-09-20.md` |

### Register-internal checks (G)

| # | Check |
|---|---|
| G1 | Every `ownerRow` value is a row id that exists and whose `kind` is `COLLECTION` |
| G2 | Every `applicability` key is a row id that exists |
| G3 | Every id in `decidingRules` is either `RR-01` or an id in `citableStandingDecisions` |
| G4 | Every key in `vocabularies.versions` corresponds to a list in `vocabularies`, and every list has a version |
| G5 | Every row whose `fillable` is present is a `FIELD` or `COLLECTION` row, never a `VIEW` |
| G6 | The register parses, and no row id is duplicated |

### Vocabulary-coverage checks (V) — the important ones

| # | Check |
|---|---|
| V1 | For **every** row, decide whether its `valueType` implies an enumerated set of permitted values — **by meaning, not by matching one phrase.** Phrases seen so far include "closed list", "controlled vocabulary", "one of", "set from", and a bare comma-separated list of uppercase tokens. For each such row, report whether `vocabularies` has a corresponding entry. **List every row that implies an enumeration and has no data entry** |
| V2 | For every `vocabularies` list, check its members appear in the row's `valueType` prose, and report any member present in one and absent from the other — a list that has silently drifted from its prose is worse than one that is missing |
| V3 | Report any row whose `valueType` names a vocabulary held in another system (for example "the RPC library's controlled vocabulary") where the register cannot know the membership. These are a different problem from a missing extraction and must not be conflated |

### Agreement checks (A)

| # | Check |
|---|---|
| A1 | Find every numeric claim about the artefacts stated in more than one document — counts of rows, items, declarations, contracts, fillable rows, citable decisions, mojibake occurrences, scope uses. **Report any fact given two different values in two places.** The documents to compare are all of `docs/design/*.md`, `docs/audits/*.md` and the register |
| A2 | Report any place where a document states a rule the derivation spec contradicts — in particular about: where a comparison lands; whether an assumed item can cause a collision; whether a declaration survives an empty scope; whether the engine chooses a free value. These four were reversed by owner rulings during the day, so a stale statement is likely |

## 4. What to produce

1. `docs/audits/conformance/cross-document-check.js`
2. `docs/audits/conformance/cross-document-check-report.md` — one section per check family, each finding
   with the file, the line, the text, and what it conflicts with. Head the report with the checkout path,
   the commit, and totals.

## 5. What good looks like

- **V1 is the check that matters most.** Do not implement it as a list of phrases to grep. Look at every
  row's `valueType` and judge whether it constrains the value to a fixed set. Report your rule.
- A finding is precise: file, line, the two conflicting texts.
- **Finding real problems is the point.** An empty report is a plausible outcome only if you have
  genuinely applied V1 by meaning; if you applied it by phrase matching, say so, because then an empty
  report means nothing.
- `git status` at the end shows only your two new files.

## 6. Do not

- Do not add a missing vocabulary, definition or cross-reference.
- Do not normalise the mojibake in the contracts file — it is evidence being reported to the owner.
- Do not edit any design document, the register, or any contract.
- Do not implement any part of the derivation engine.
