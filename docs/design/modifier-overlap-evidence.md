# `GA-MODIFIER-OVERLAP` — the real corpus evidence

23 September 2026. Prepared for his ruling on the minimum general semantics for overlap between value
modifiers whose condition type is `object` or `event`. **Nothing here is a proposal to implement**; the
engine refuses these cases today and continues to.

---

## 1. First, a correction to the count

The design package says *"Two corpus items use these types"*. That is wrong on both halves.

| | Package said | Actually |
|---|---|---|
| Items | two | **four** |
| Condition types in use | `object` and `event` | **`event` only — no corpus item anywhere carries `condition.type=object`** |
| Contracts | not stated | **two**: From Goal Kicks (A01-02), and GF4 Transition Games |

So the case to rule on is the **event** case. The `object` case has no authored evidence at all, and by
the same standard applied to comparatives (SD-41) it should not be specified from invented examples.

## 2. The four items, verbatim

### From Goal Kicks (A01-02) — `A01-02-12.b`

```json
{
  "id": "A01-02-12.b",
  "origId": "A01-02-12",
  "row": "V8b",
  "selector": "condition.type=event",
  "requirement": "EQUALS",
  "value": "forbidden member: the goal-kick restart (taken or conceded) as a modifier referent",
  "strictness": "EXCLUSION",
  "valueStatus": "REQUIRED_RANGE",
  "scope": "WHOLE_GAME",
  "basis": "ENGINE_ONLY",
  "basisEvidence": "Same unit-test messages: primary-scoring.unit.ts:195 and scoring-object-consistency.unit.ts:289.",
  "checkability": "STRUCTURAL",
  "structuralClause": "N/A",
  "fitNote": "'No value tier' means no modifier conditioned on the goal kick. V7 cannot select by referent, so this is held on V8b. Naming the goal kick as a referent also needs L1. SD-06 would already require any such modifier to be authored."
}
```

### GF4 Transition Games — `I17`, `I14`, `I15`

```json
{
  "id": "I17",
  "origId": "GF4.example_incentive_patterns",
  "row": "V7",
  "selector": "condition.type=event",
  "requirement": "EXISTS",
  "value": "N/A",
  "strictness": "SUPPORTING",
  "valueStatus": "N/A",
  "scope": "WHOLE_GAME",
  "basis": "AUTHORED",
  "basisEvidence": "\"double points for quick goal || reward regain leading to shot\" (game_forms[GF4].example_incentive_patterns)",
  "checkability": "STRUCTURAL",
  "structuralClause": "whole item",
  "fitNote": "The two patterns are alternatives separated by '||', and both are examples only (L17)."
}
```

```json
{
  "id": "I14",
  "origId": "GF4.example_incentive_patterns[1]",
  "row": "V9",
  "selector": "condition.type=event",
  "requirement": "EQUALS",
  "value": "x2 (double points)",
  "strictness": "SUPPORTING",
  "valueStatus": "TYPICAL_EXAMPLE",
  "scope": "WHOLE_GAME",
  "basis": "AUTHORED",
  "basisEvidence": "\"double points for quick goal\" (game_forms[GF4].example_incentive_patterns)",
  "checkability": "STRUCTURAL",
  "structuralClause": "whole item",
  "fitNote": "The selector also catches the regain-to-shot modifier (I15, L05). 'quick' is held in I16 (L16)."
}
```

```json
{
  "id": "I15",
  "origId": "GF4.example_incentive_patterns[2]",
  "row": "V8b",
  "selector": "condition.type=event",
  "requirement": "EQUALS",
  "value": "{regain, shot}, in the order regain then shot",
  "strictness": "SUPPORTING",
  "valueStatus": "TYPICAL_EXAMPLE",
  "scope": "WHOLE_GAME",
  "basis": "AUTHORED",
  "basisEvidence": "\"reward regain leading to shot\" (game_forms[GF4].example_incentive_patterns)",
  "checkability": "PARTLY_STRUCTURAL",
  "structuralClause": "The referent set is structural. The order ('leading to') and 'shot' are not held (L14, L15). The magnitude of 'reward' is not authored.",
  "fitNote": "Same selector collision as I14 (L05)."
}
```

## 3. Source and contract context

**From Goal Kicks (A01-02)** — *"Practice Situation A01-02 (parent A01), session-planning-model.rc1.json
practice_situations. Its only authored text is the name and the Definition 'Restart from goal kicks.'"*

Its declarations on the modifier rows are what make `A01-02-12.b` unusual: the contract declares
`V7` **NON_CLAIMED** — *"value modifiers: none contributed, none forbidden"* — while `V8b` carries an
**EXCLUDED** declaration on `condition.type=event` for this very item. The contract's own note records
the contradiction: *"This contradicts 12's value-tier exclusion, which is held on V8b (L13)."*

The item's basis is `ENGINE_ONLY`: its evidence is two unit-test messages, not authored knowledge. Under
SD-21 it therefore supports nothing.

**GF4 Transition Games** — *"soccer-module.rc1-v3.json game_forms[game_form_id=GF4]."* Its `V7`
declaration is **CLAIMED** on `condition.type=event`, noted *"I17, examples only."* Both magnitude and
referent items are `TYPICAL_EXAMPLE`, which §3 makes inert: *"no support, bound or collision."*

## 4. The represented modifier and condition

The register gives `V7` (a value modifier) exactly two selector attributes: `condition.type` and
`condition.referents`. `V8a` holds the condition type, from the closed list `region · object · event`.
`V8b` holds the referents: *"references to regions, objects or events; one property per referent."*

For the **region** case the engine can decide overlap, and does: a region referent normalises to an
element class under SD-32, so two modifiers overlap exactly when their referent sets intersect by
element identity. That clause executes today.

For the **event** case there is no such footing, and this is the crux:

> **The representation holds no elements for events.** No register row instantiates an event as an
> element with an identity. `regain`, `shot`, `quick goal` and `the goal-kick restart` are open text in a
> value, not references that normalise to anything.

## 5. Exactly what the engine cannot decide

Four distinct decisions, in increasing order of how much they would have to be invented:

1. **Whether two event referents are the same event.** `{regain, shot}` against *"the goal-kick restart
   (taken or conceded)"* — these are prose tokens. SD-32 forbids synonym or meaning matching, so the
   engine has only exact token equality, and these tokens are not written to be compared.

2. **Whether one event condition subsumes another.** *"quick goal"* and *"regain leading to shot"* may
   describe the same scoring moment or disjoint ones. Nothing represented decides it.

3. **Whether an exclusion in one object contradicts a modifier in another.** A01-02 forbids the
   goal-kick restart as a referent; GF4 asserts an event-conditioned modifier. Whether those collide is
   the overlap question, and it reduces to (1).

4. **Whether GF4 holds one modifier or two.** This is the sharpest one, and it is not about events at
   all. GF4's two patterns are authored as **alternatives** — *"double points for quick goal || reward
   regain leading to shot"* — and both `I14` and `I15` carry the **same selector**, `condition.type=event`.
   The contract's own fit-notes record it twice: *"The selector also catches the regain-to-shot modifier"*
   and *"Same selector collision as I14."*

   The representation has no way to say that two modifiers are alternatives rather than coexisting. So
   before overlap can be asked, the engine would have to decide whether this is one modifier with two
   referent sets, two modifiers that overlap completely, or two alternatives of which at most one is
   ever realized. **Nothing represented distinguishes them**, and an overlap rule that assumed any one of
   the three would be manufacturing the answer.

## 6. Neither case reaches the gate today

Worth stating plainly, because it bounds how much the corpus can settle:

- **GF4 is refused whole at load** — not for anything above, but because an unrelated item, `OB1`, uses
  `row: "NONE"` (*"Exploit moments after turnover"*). `NONE` is not a register row id. So none of `I14`,
  `I15` or `I17` reaches any stage.
- **A01-02 is the one admitted contract**, but `A01-02-12.b` is `ENGINE_ONLY`, so it is inert under SD-21
  and forms no modifier.

The gate therefore sees **zero** value modifiers in the corpus today and reports `PASS — no applicable
instances`. The evidence above is real authored knowledge, but it is not yet reachable evidence.

## 7. What a ruling would need to settle

Stated as questions, not proposals:

1. Does an event condition compare by **exact canonical token equality only**, with everything else
   undetermined — or must events be represented as elements before any modifier may condition on them?
2. If undetermined, is an undecidable overlap a **refusal** (as now) or a **gap**?
3. What, if anything, represents **alternatives** among modifiers? Without it, question 4 above has no
   answer for any condition type, including `region`.
4. Should the `object` case be specified at all, given no corpus item exercises it?

The affected cases continue to refuse until this is settled, and nothing else is blocked by it.
