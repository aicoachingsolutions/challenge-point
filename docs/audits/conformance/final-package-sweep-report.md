# Final package sweep - 21 September rulings (rerun)

**Audited checkout:** C:/challenge-point/.claude/worktrees/serene-dewdney-c78e18
**Branch:** claude/serene-dewdney-c78e18
**Commit:** 0675ee467660cda6c0e9ea3d725cae44998455dd

## Verdict and totals

The earlier claim - *two contradictions resolved, one decision remaining, no invention points* - is **not sustained** on revision 3. The two package contradictions are resolved, and the seven stale-ruling searches found no current contradiction. But section 11.2 now names **two** owner decisions, not one, and five invention-point groups remain.

| Family | Result |
|---|---:|
| S - current ruling contradictions | 0 |
| P - package internal defects | 2 |
| C - uncovered derivation rules/decisions | 0 |
| I - invention-point groups | 5 |
| Decisions still needed before implementation | 2 |

An invention point is counted where valid input leaves two careful implementers with different semantics and the package does not direct a named refusal. I treated text as historical only when it explicitly says superseded, corrected, proposed, revised, or is in a document explicitly superseded by a later revision.

## Method

I read revision 3 of the package, the complete derivation specification, the 21 September ruling rows SD-39 to SD-42, the grammar sheet, and the register. I ran final-package-sweep.js with Node only. The script removes a UTF-8 BOM before JSON parsing, checks package stages/failures/refusals, scans the required source set, and parses the corpus.

Mechanical result: 12 stages (0 through 11); no out-of-table stage citations; no refusal outside the closed list; no unexpected failure kind; 8 contracts, 221 items, and 0 COMPARES items; 82 register rows and 21 vocabulary versions.

## S - stale statements against SD-39 to SD-42

There are **no current S defects**. The following are the relevant hits reviewed; the quoted current text either states the new rule or explicitly records the old rule as superseded.

| Check | File, line, text | Classification |
|---|---|---|
| S1 | game-representation-spec-2026-09-18.md:303, "The authority for a free choice is SD-39"; :321, "Silence licenses nothing"; :478, SD-39 is the authority rather than SD-R2; :627, P-4 is "Superseded 21 September" | Current and conforming. Register entries :19, :54 and :71 likewise call P-4/SD-R2 replaced or superseded. |
| S2 | derivation-engine-design-package-2026-09-20.md:94-95, "candidate value cannot turn open into derived ... supply support"; :149-152 keeps REALIZATION as provenance, never support. register-2026-09-18.json:207 requires SD-13's T5 condition to be derived. | Current and conforming to SD-40. |
| S3 | derivation-spec-2026-09-20.md:38 and :318 say RESOLVED:NARROWED_CHOICE is a candidate-check outcome; package :149-151 defines WITHIN_BOUNDS for it. | Current and conforming. |
| S4 | package :196-198 says neither restricted nor full result is adopted on divergence and records PASS_DIVERGENCE. | Current and conforming to SD-42. |
| S5 | package :375 says 0 COMPARES items across 221 and calls the capability presently unexercised. game-representation-spec-2026-09-18.md:196 says the same. | Current and conforming to SD-41. |
| S6 | game-representation-spec-2026-09-18.md:581 limits Gate B reverse and INVENTED to checking mode. The contrary 2026-09-17 draft at :353 is historical: its header :3 says it is superseded by revision 3. | No current defect. |
| S7 | derivation-spec-2026-09-20.md:457 and :461 call VALID_ABSENCE and NOT_REALIZED approved; package :304 says both are ruled. | Current and conforming. |

Other textual candidates found by the script are the audit brief itself, the explicit revision-history account in package section 11.1, or documents headed as superseded/proposed. None is a live authority.

## P - package internal consistency

### P1 - public gate output is not in the declared record catalogue

| File, line, text | Conflict |
|---|---|
| derivation-engine-design-package-2026-09-20.md:50, "gates : { gateA, gateBForward, gateBReverse : GateReport }"; :114, "Every record the package names is defined here; a record not listed does not exist"; :385 defines GateReport only in section 7 | GateReport is named in the public result but omitted from section 1.8, contrary to section 1.8's closed-record statement and P1's requirement that records used after section 1 be defined in section 1 or 3. |

This also produces a modal output gap: package :90 says gateBReverse is not applicable in derivation mode, while :50 requires it to be a GateReport and :385 permits only PASS, FAIL, or NOT_EVALUABLE. No representation is supplied for not applicable.

### P2-P4 - pass

The closed refusal list contains every used refusal kind, including RULE_NOT_EXECUTABLE and VALUE_NOT_COMPARABLE. The six failure kinds are the only failure kinds used, and every cited stage exists in the 0-11 stage table.

### P5 - one invariant cannot be tested from defined semantics

| Invariant | File and line | Why it is not testable as written |
|---|---|---|
| D4 | package :135 defines Bounds as COUNT, INTERVAL, SET, or QUALITATIVE; :331 permits qualitative bounds as authored words; :451 requires the intersection of constraints[].bound | The package defines no intersection or containment operation for QUALITATIVE text. Two test implementations can respectively require identical text, retain both texts, or declare the pair non-intersectable. No refusal requires one result. |

D1-D3 and D5-D10 name defined data or records sufficiently to write a test, although D8 will immediately expose the P1 GateReport omission.

### P6 - pass

The ten choices in section 10 are consistent with the rest of revision 3. In particular, section 7 now consistently makes unexecutable Gate A clauses NOT_EVALUABLE and blocking pending the owner decision; it no longer silently preselects NOT_CHECKABLE.

## C - coverage

### C1 - derivation specification map

Every numbered derivation-spec section has a package home: sections 1-2 at package 1.4, 2.2 stage 2, stage 6 and section 4; sections 3-4.3 at stages 1, 4 and 5 plus sections 1.9 and 5; section 4.4 at section 6/stage 7; sections 4.5-4.8 at stages 1-6; section 5 at section 4; section 6 and 6.1 at stage 3, stage 6 and section 6; section 7 at stage 8 and 1.8; section 8 at stage 9.4; section 9 at stage 2.4; sections 10-11 at sections 3, 9 and 12.

The prior no-home findings are now covered: closed-world absence is package :258-260, reachable-trigger construction is :230-244, and SD-10/SD-10a is :345-352.

### C2 - standing decisions and knowledge rulings

No derivation-bearing SD/KR rule lacks a home. SD-01 to SD-09 and SD-11 to SD-42 flow through stage 0's validated register plus stages 3-8; SD-10/10a is explicitly implemented at package :345-352; SD-39 to SD-42 additionally have the dedicated rules at :83-95, :178-198, :375 and :317-334. KR-01 to KR-05 are honoured through the same register/contract route, with the build-out rule at stage 3 and the retired knowledge boundary at sections 5 and 12.

The AM-15 definition is a coverage home at section 2.4, but remains an owner decision listed below; a home is not the same as a settled rule.

## I - invention points

### I1 - Gate B reverse has no derivation-mode output

| File, line, text | Two defensible readings |
|---|---|
| package :50 declares every gate result GateReport; :90 says Gate B reverse is not applicable in derivation mode; :385 gives GateReport only PASS, FAIL, NOT_EVALUABLE | Emit null/omit the field; emit NOT_EVALUABLE; or add a forbidden NOT_APPLICABLE value. The package directs no named refusal. |

### I1/I4 - candidate properties cannot be associated with anonymous handles

| File, line, text | Two defensible readings |
|---|---|
| package :137-139 gives CandidateGame.properties an elementId; :223-225 says derived handles are anonymous; :252-255 says candidate elements match handles by cardinality, not identity, and no bijection is formed | Require candidate properties to use engine handle IDs, or invent a matching/bijection (or a multiset rule) to attach them to resolution lines. These produce different CandidateCheck results; no refusal selects one. The open attributes map at :137 also does not state which attribute keys are legal. |

### I2 - valid register value forms have no Value representation

| File, line, text | Missing semantics |
|---|---|
| register-2026-09-18.json:63, J11b is "member, or procedure over members"; package 1.9 has no procedure representation or equality/evaluator | An implementation must choose a procedure language, opaque token, or an ordering/selection behavior. RULE_NOT_EXECUTABLE is only assigned to V10 modifier-combination rules, not J11b. |
| register :73 permits T4 to be a region reference or "where the ball went out"; :84 permits V6 qualitative terms; :37 leaves role names open | Package 1.9 represents only registered element references and enumerated members. It supplies no tagged dynamic-location, qualitative-value, or open-role representation/comparison. VALUE_NOT_COMPARABLE applies only to comparisons, not normal derivation or candidate checking. |

### I4 - handle minting does not say how IN-selector attributes exist

| File, line, text | Two defensible readings |
|---|---|
| register :13 allows IN membership selectors and the grammar sheet section 2 says an element lacking an attribute does not satisfy its selector. Package :221-225 says a minted handle carries only attributes fixed by = or CONTAINS, then shares handles when selectors are satisfied. | Represent an unresolved membership constraint on the anonymous handle, or choose a concrete member so it can satisfy and merge. The choice changes which handles exist and which item minima they satisfy. No record representation or refusal decides it. |

### I3 - AM-15 reachability is still neither ruled nor refused

| File, line, text | Finding |
|---|---|
| package :230-244 calls "reachable when its structural prerequisite is derived" a proposed definition needing confirmation; :495-509 lists it as owner decision 2 | The package has surfaced the issue, but does not turn the unconfirmed rule into a named refusal. Until confirmed, stage 2 must either implement the proposal or choose another meaning of reachable. Under this audit's definition it remains an invention point as well as a pre-implementation decision. |

## Decisions still needed before implementation

1. package :497-505 - decide the treatment of six partially or wholly unexecutable Gate A checks. The current blocking NOT_EVALUABLE path prevents guessing.
2. package :507-509 - confirm or replace the AM-15 reachability definition. Unlike the Gate A case, it has no named refusal while unconfirmed.

## Working-tree check

The target worktree already contained unrelated untracked .claude/ and back/_*.txt paths. They were not touched. Scoped status for this rerun contains only the two audit deliverables:

- docs/audits/conformance/final-package-sweep.js
- docs/audits/conformance/final-package-sweep-report.md
