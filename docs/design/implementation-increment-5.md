# Implementation increment 5 — his rulings, and stage 11 (emit)

23 September 2026. **Activity generation remains frozen.** The pipeline is complete: load through gates,
assembled and stamped.

`back/src/system/derivation/emit.ts`, with 13 further tests and changes across five existing modules —
**103 across the five increments**, and the whole project suite passes.

Spec revision 12 records his rulings as **SD-49 to SD-56**.

---

## Every stop is now closed

The engine was carrying three SD-48 stops and one surfaced reading. All four are ruled, and the run now
reports **zero stops**.

| Was stopped on | Ruling | Now |
|---|---|---|
| Reach against a class — the rule is written for an element, and SD-47 made elements classes | **SD-49** | Three-valued, as built: entailed reaches, contradicted does not, indeterminate derives nothing and is recorded |
| A choice space the register bounds by authored values, with nothing authored | **SD-50** | A **GAP**, not a refusal and not OPEN. *"Silence supplies neither"* |
| Set-valued rows — where member expansion belongs | **SD-51** | Membership resolves first; member lines materialize **only** from an authoritatively resolved member set |
| A gate clause whose subject line is a gap (my reading, surfaced) | **SD-52** | Confirmed: `NOT EVALUABLE / BLOCKED`, naming the dependency |

`reaches()` already matched SD-49 exactly, so that ruling required no change — which is the outcome I
wanted from surfacing it rather than deciding it.

## SD-51, and what it prevents

The previous behaviour enumerated a set-valued row once with `member: null` and left expansion
unaddressed. Under SD-51 the membership line is enumerated and **nothing else** until membership is
authoritatively resolved.

Three tests hold it:

- gapped membership → the membership line stands alone, **zero** member lines;
- membership resolved to `{access, trigger}` → exactly two member lines, each derived, inheriting the
  membership line's support and creating no new authority;
- membership resolved to prose — *"whatever the coach decides on the day"* → **zero** member lines, and
  the case is counted rather than passed over. SD-32 forbids reading meaning out of text, so the engine
  does not invent members from a sentence.

## SD-53 and SD-54, applied generally

His instruction was to treat the four fused clauses as an instance of a rule, not as exceptions. Every
executable clause is now atomic, and a test asserts it: **no executable clause text contains a `;`**.

Decomposed this increment, beyond the four already reported:

| Check | Was | Now |
|---|---|---|
| `GA-REGION-FUNCTION` | one clause | serves a function · the function is registered |
| `GA-EFFECT-TYPED` | one structural clause | effect is registered · referent resolves uniquely · trigger is structurally reachable |
| `GA-TIME-WINDOWS` | fields · duration | starts on a registered trigger · expiry effect registered · duration inside the session |
| `GA-OBJECTIVE-SETS` | one clause carrying four claims | members resolve · minimum within the member count · named member is a member · reachable persistence trigger maps to an assignment |

Every passing clause now carries `basis` — `EVALUATED` or `NO_APPLICABLE_INSTANCES` — and the count of
instances it ranged over. The gate report carries the split as `evidence`, so a summary cannot flatten
it.

**This immediately paid for itself.** On the corpus, of 24 passing clauses:

| | |
|---|---|
| Clauses **evaluated** against real instances | **2** |
| Clauses passing with **no applicable instances** | **22** |
| Clauses failed | 2 |
| Clauses not evaluable | 6 |
| Clauses outside the representation | 4 |

An aggregate "24 clauses passed" would have been true and almost entirely misleading. Two clauses
actually examined something.

## A fourth defect, found by his own determinism requirement

§8: *"Byte-identical output on repeat **and under shuffled input**."* The emitted result includes
`run.inputDigest`, and the digest was taken over the input as given — so shuffling the item order
changed it. Everything else was identical; the digest alone moved.

It is now taken over a canonical form: contracts, their items and the selection ordered by id, object
keys ordered. **Array values are left exactly as authored**, because AM-11 keeps the member order inside
a value set as the author wrote it, and sorting values would both violate that and make two genuinely
different inputs hash alike.

Found only because the stage 11 test compared the *whole* emitted record rather than the parts I
expected to vary.

## Stage 11 — emit

The assembly derives nothing. It enforces two things rather than assuming them.

**SD-30, the stamp.** *"An unstamped result asserts nothing."* A result that cannot be stamped is not
emitted as a result at all: it returns a stamped halt carrying the refusal that caused it and an empty
resolution. Tested by stripping the register version.

**§1.4, field presence.** Each field appears *iff* its condition holds — `state` only on an `ENUMERATED`
line, `value` and `resolvedBy` only where `derived`, `bounds` and `permittedBy` only where `open`,
`reason` only on `NOT_AUTHORED`, `conditionalOn` only where `CONDITIONAL`, `support` empty unless
derived. Asserted in both directions across the whole corpus resolution: a derived line **must** carry a
value, a route and its support; a non-derived line must carry none of them.

Also asserted: every failed line names the failure record that failed it; `tensions` is empty (SD-27);
and `candidate` is `null` rather than an empty check list standing in for a check that did not run.

## The corpus, complete pipeline

| | |
|---|---|
| Resolution entries | 15 — 6 `derived`, 9 `failed` |
| Resolved by | 4 `SESSION`, 2 `STANDING_DECISION` |
| Audit | 15 properties, 15 items, 0 collisions, 8 reference defects, 0 tensions |
| Failures | 7 `LOAD_REFUSAL`, 8 `REFERENCE_DEFECT`, 9 `GAP` |
| **Gate A** | **FAIL** — 2 clauses evaluated, 22 vacuous, 2 failed, 6 not evaluable, 4 outside the representation |
| Gate B forward / reverse | `PASS` / `NOT_APPLICABLE` |
| **Stops** | **0** |

## What remains deferred, with his confirmation

| Stage | State |
|---|---|
| 7 relationships | *"Do not build comparative relationship execution solely against invented cases when no canonical comparative exists."* |
| 9 candidate checking | *"Do not fabricate a candidate-game input merely to exercise checking mode."* Gate B reverse stays `NOT_APPLICABLE` |
| `GA-MODIFIER-OVERLAP` | Evidence gathered — see `modifier-overlap-evidence.md`. Affected cases continue to refuse |
