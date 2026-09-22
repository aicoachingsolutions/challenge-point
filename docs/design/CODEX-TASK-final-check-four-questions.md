# CODEX-TASK — the final independent check: four questions only

**Type:** read-only. **You change nothing.** **Deliverable:** one script and one report.

## 0. Which checkout

Only `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18`, branch `claude/serene-dewdney-c78e18`
— not `C:\challenge-point`, which is stale. Put the branch name and `git rev-parse HEAD` in the report.

## 1. What this is, and what it is not

The project owner authorized derivation-engine implementation **once this check returns clean**, unless
it finds a genuine blocker. His instruction:

> "This is not another architecture/conformance exercise and should not expand scope. … If all four
> return clean, report that result and the exact residual known specification/knowledge gaps. Do not
> continue adversarial iteration looking for hypothetical extensions."

So: answer his four questions against the package **as it stands**. Do not propose new features, new
grammar, or improvements. Do not re-open anything he has ruled on.

## 2. What to read

- `docs/design/derivation-engine-design-package-2026-09-20.md` — **revision 5**, the package under test
- `docs/design/game-representation-spec-2026-09-18.md` — revision 10; §2 holds every ruling, SD-01 to
  SD-44 and KR-01 to KR-05
- `docs/design/derivation-spec-2026-09-20.md` — the derivation rules
- `docs/audits/conformance/register-2026-09-18.json` — the schema as data
- `docs/audits/conformance/grammar-sheet-2026-09-18.md`
- `docs/design/knowledge-authoring-tasks.md` — the task register of **known, recorded** gaps

## 3. The four questions — his words

1. **Does any live text contradict SD-39 onward or another current ruling?**
2. **Does any record, type or rule used by the engine remain undefined?**
3. **Could two conforming implementers make different semantic choices from the specification?**
4. **Does any code path require an inference for which no authority exists?**

## 4. How to judge — read this before answering

- **A documented refusal is not a finding under questions 3 or 4.** Where the package directs the engine
  to refuse — a named refusal kind in §3.3, a `NOT_EVALUABLE` specification gap under SD-43, a
  `NOT_CHECKABLE_OUTSIDE_REPRESENTATION` clause — the engine is not inferring and two implementers do not
  diverge. That is the design working as ruled.
- **A known, recorded gap is not a new finding.** The residual gaps listed in package §11.2 and in the
  task register are known. Report them in the residual list; do not count them as failures of the four
  questions — unless the package handles one inconsistently or not at all, which *is* a finding.
- **Historical text is not a contradiction** when it is marked as superseded, a past revision, a proposal
  or corrected.
- **A finding must be genuine**: a specific line where the specification, read exactly, permits two
  different behaviours with no refusal between them — or names a record or rule it never defines — or
  contradicts a current ruling. Hypothetical future cases, missing features and stylistic preferences are
  not findings.
- **Classify each finding** as a **genuine blocker** (implementation cannot proceed correctly without it
  being resolved) or **minor** (a correctable wording or consistency defect that does not change engine
  behaviour).

## 5. Constraints

Read-only; create only your two files. Strip the BOM before parsing JSON. Node only, no network, no new
dependencies. No regex through a Python heredoc.

## 6. What to produce

1. `docs/audits/conformance/final-check-four-questions.js`
2. `docs/audits/conformance/final-check-four-questions-report.md`, containing:
   - branch, commit, and the files read;
   - for **each of the four questions**: **CLEAN** or **NOT CLEAN**, and every finding with file, line,
     text, and whether it is a genuine blocker or minor;
   - **a one-line overall verdict**: *all four clean* / *not clean, no genuine blocker* / *genuine
     blocker found*;
   - **the exact residual known specification and knowledge gaps**, taken from package §11.2 and the task
     register, as the owner asked.

`git status` at the end must show only your two new files.

## 7. Do not

Edit anything. Expand scope. Suggest designs. Normalise the contracts file's mojibake. Implement any part
of the engine.
