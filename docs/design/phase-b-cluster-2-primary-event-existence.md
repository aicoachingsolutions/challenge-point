# Phase B, cluster 2 — five primary events where one is required

> **RULED AND CORRECTED, 25 September (SD-83 to SD-85).** His closure conditions, each checked:
>
> | Condition | Result |
> |---|---|
> | the `V0` singleton supported by both legitimate contributions | `c:singleton:V0`, `supportedBy` = `PCG-01` + `VARTARGET-11.a`, `singletonBy` = SD-06 |
> | the two exclusions evaluated against it, not creating elements | both route through SD-75; neither establishes anything |
> | no `ASSUMED`/`EXCLUSION`/`ENGINE_ONLY`/`OUTSIDE_BOUNDARY` establishing an element anywhere | **none**, asserted corpus-wide |
> | the 19 manufactured classes removed | classes **53 → 33** (19 removed, and the two legitimate `V0` merged into one singleton) |
> | the 47-line reduction classified | failed lines **137 → 90**. **Diagnostic correction, not knowledge improvement** — see below |
> | Gate A change reported by cause | below, by cause |
> | regression coverage | the general rule and the singleton exception, including that SD-84 is *not* a relaxation of SD-47 |
> | reach under SD-81 | **a general derivation rule** |
>
> **Gate A, by cause.** Failing checks 6 → 4.
>
> | Check | Change | Cause |
> |---|---|---|
> | `GA-ONE-PRIMARY-EVENT` | `FAIL` → `NOT_EVALUABLE`; **its first clause now PASSES — "1 primary event"** | the four illegitimate `V0` classes are gone and the two legitimate ones are one singleton. It remains not-evaluable only because a *separate* clause — whether the event's referents have a space position — is still blocked |
> | `GA-DIRECTION` | `FAIL` → `NOT_EVALUABLE` | **the teams that made it fail were themselves illegitimate**, formed from an assumption and an out-of-boundary note. Two legitimate teams remain and their objective links are not derived, so it blocks rather than failing |
> | `GA-EFFECT-TYPED` | `NOT_EVALUABLE` → `PASS (vacuous)` | the only "consequence" in the corpus was created by an exclusion forbidding one |
> | Clause evidence | evaluated 4 → 5, **vacuous 4 → 10**, failed 6 → 4, not evaluable 20 → 15 | **the gate looks better partly because there is less to check.** Ten clauses now pass with no applicable instance, because the structure they ranged over was manufactured. Under SD-54 that is not evidence |
>
> **One dependency exposed, and stopped at rather than resolved.** Both exclusions now report
> `NOT_EVALUABLE`: their forbidden cardinality is stated in prose — *"more than 1 (a second, independent
> way to score…)"* and *"2 or more (forbidden)"*. Reading a bound out of that is interpreting the text,
> which SD-32 forbids and which SD-79 required his authorization for in the equivalent case. **This is
> the same restatement question as the five prose-wrapped sets, and it is his.**

25 September 2026. Analysis only; nothing corrected. Structured by the Phase B method, with the SD-81
reach classification at the end.

**The five primary events are not five assertions that a primary event exists.** Two of them are
contributions *forbidding* a second primary event — and the engine satisfied them by creating one.

---

## 1. What the engine is reporting

`GA-ONE-PRIMARY-EVENT` fails its first clause: *"exactly one primary event, of a registered kind"*,
reporting **5 primary events**. Five element classes exist on `V0`, a row the register declares as
`"exactly one element (SD-06)"`.

## 2. Which authoritative contributions produced it

| Class from | Requirement | Strictness | Basis | What it actually says |
|---|---|---|---|---|
| `PASS-COMBINATION-GATE :: PCG-01` | `EXISTS` | `REQUIRED` | `AUTHORED` | a primary event exists |
| `VARIABLE-TARGET-CONDITION :: VARTARGET-11.a` | `EXISTS` | `REQUIRED` | `AUTHORED` | one primary event, its reference derived from the objective set |
| `RPC-001 :: RPC-001-08.b` | `COUNT` = 1 | `REQUIRED` | **`ASSUMED`** | its own evidence: *"'Exactly one' comes from SD-06 … RPC-001 authors a valid set, not a count"* |
| `VARIABLE-TARGET-CONDITION :: VARTARGET-12.a` | `COUNT` | **`EXCLUSION`** | `AUTHORED` | *"more than 1 (a second, independent way to score …)"* — **forbidden** |
| `WIDE-ZONE-ADVANTAGE :: WIDEZONE-16.b` | `COUNT` | **`EXCLUSION`** | **`ASSUMED`** | *"2 or more (forbidden)"*; its evidence: *"the rule itself is SD-06"* |

**Only two are assertions that a primary event exists.** One is an assumed restatement of SD-06. Two are
exclusions of a second event.

**And both exclusions report `SATISFIED`.** They report satisfied *because they formed a class* — so the
engine discharged "there must not be more than one primary event" by instantiating a primary event, and
then failed the game for having too many. Two of the five events that break the gate are the two
contributions that exist to prevent exactly that.

## 3. What kind of cause this is

**Derivation semantics** — and specifically an internal inconsistency, not a new question.

§3 is explicit about what may support:

> `EXCLUSION` — *"never supports; checked only as an exclusion"*
> `ASSUMED` — *"a bound only; never entails"*
> `ENGINE_ONLY`, `OUTSIDE_BOUNDARY` — *"inert (SD-21)"*

And SD-47: *"Existence requirements establish supported classes defined by **authoritative** selectors."*

The engine already encodes these rules — `isSupportCapable()` and `entails()` apply them everywhere a
*value* is derived. **`formClasses()` does not call them.** It forms a class from any item whose row is a
`COLLECTION` and whose requirement is `EXISTS`, `COUNT` or `RANGE`, whatever its strictness or basis.

So this is the same shape as the `game::V1` follow-up: one rule, written down, applied in some places and
not others.

**It is not confined to `V0`.** Corpus-wide, of 53 element classes:

| Formed from | Classes | Lines | Failed lines |
|---|---|---|---|
| entitled contributions | 34 | 133 | 90 |
| **`ASSUMED`** — a bound only, never entails | **9** | 25 | **21** |
| **`EXCLUSION`** — never supports | **5** | 17 | **17** |
| **`ENGINE_ONLY`** — supports nothing (SD-21) | **3** | 4 | **4** |
| **`OUTSIDE_BOUNDARY`** — inert | **2** | 6 | **5** |

**19 of 53 element classes — 36% — were manufactured from contributions that cannot support anything**,
and they account for **47 of the 137 failed lines**.

## 4. The smallest upstream correction

**`formClasses()` applies the same support rules the rest of the engine applies.** No new rule, no new
representation, no knowledge change. It splits cleanly in two, and only the second needs a ruling.

**(a) Unambiguous — the engine already has these rules and does not call them.** `EXCLUSION`,
`ENGINE_ONLY` and `OUTSIDE_BOUNDARY` items form no element class. Each is stated in §3 or SD-21 in terms
that leave no room, and each is already enforced by `isSupportCapable()` a few lines away.
**10 classes, 26 failed lines.**

**(b) Needs a ruling — `ASSUMED`.** §3 says an assumed item is *"a bound only; never entails"*, and SD-47
requires an *authoritative* selector. Whether an assumption may establish the **existence** of an element
— as distinct from entailing its value — is not stated anywhere I can find. The corpus leans one way:
`RPC-001-01.a`'s own fit-note says *"The number 2 is not verbatim, so it is kept as an assumed bound"*,
and it currently instantiates two teams. **9 classes, 21 failed lines.** I have not decided it.

## 5. What else the same correction resolves

| | |
|---|---|
| Primary events | 5 → **3** with (a); → **2** with (a) and (b) |
| `VARTARGET-12.a`, `WIDEZONE-16.b` | stop reporting `SATISFIED` for having created what they forbid |
| `RPC-001-23` (an exclusion on `V15`) | the same, on information rules |
| Failed lines | 26 with (a); 47 with (a) and (b) |
| `GA-ONE-PRIMARY-EVENT` | its first clause stops counting exclusions as events |

**Those failed lines are not defects being fixed.** They are fields of elements that were never
established — lines describing the properties of things that do not exist. They were never real failures,
and removing them is a correction to the report, not progress against the knowledge. On SD-81's terms the
count will move by 47 and **none of it should be read as the knowledge improving**.

## 6. What must explicitly remain unresolved

**Two legitimate assertions still stand on a singleton row.** After both corrections, `PCG-01` and
`VARTARGET-11.a` remain — two independently authored, `REQUIRED`, `AUTHORED` assertions that a primary
event exists, on a row the register declares holds *exactly one element*.

Are those two assertions about the same event, or two events? **SD-47 forbids the engine deciding**:
*"Derivation does not manufacture individual identity or equivalence between classes."* So the engine
cannot merge them, and cannot tell whether SD-06 is violated or merely restated twice.

This is the same territory as SD-67: a schema that entails something about cardinality. `V0` is the only
row in the register whose `valueType` fixes its own cardinality. Whether such a **singleton row** should
form one class that several contributions support, rather than one class per contribution, is the
residual question — and it is his.

**How an exclusion existence item should be evaluated at all.** §3 says *"checked only as an exclusion"*,
and SD-75 has since given negative existence a treatment. An `EXCLUSION` with `COUNT` "more than one
forbidden" is a negative existence claim, and probably belongs in SD-75's path rather than the existence
path. Not assumed here.

---

## Reach of the correction (SD-81)

**A general derivation rule**, and of the same family as cluster 1's follow-up rather than its main
finding: one rule, written down, applied inconsistently.

It is not local to the primary event, and not confined to one representation area — it governs which
contributions may establish structure **anywhere**, and it touches seven rows across five contracts in
six areas. The primary-event count is a symptom of it, not the thing itself.

That makes two clusters running, and in both the large failure population is collapsing under general
mechanisms rather than knowledge repair. Cluster 1 corrected how contributions **compose**; cluster 2 is
about which contributions may **establish** anything at all.
