# Gate A: accepted rulings and corrections

Recorded 17 September 2026 on Christian's decision. **Nothing implemented.** The corrections are not
applied to the specification in `procedures-2026-09-17.json`, and the 60 activities are deliberately
**not** replayed against a corrected specification: another perfect in-sample score would tell us
nothing.

## What the second replay established

The result Christian is taking from it is architectural, not the score:
- the eight-area representation survived the hostile cases;
- no confirmed defect required a ninth area;
- thirteen candidate structural checks compressed into two general decision procedures.

## Ruling on the contested "deep" case

**STRUCTURAL, low severity.** Christian's reasoning, recorded verbatim in substance:

> If Challenge Point assigns value to a condition, the resolved game needs to contain something that
> determines when that condition is true. The coach-facing renderer may eventually describe a
> structurally defined region or state as "deep", but prose should not be allowed to create an
> otherwise undefined value tier.

This upholds the 19 rows carried by the system-written sentence "Points are worth most through the
middle, then wide, then deep" (`coach-voice.ts:209`).

## Four accepted procedural corrections

| # | Correction | What it fixes in the second replay |
|---|---|---|
| 1 | Distinguish a `Use` **declaration** from `Use` as **coaching language**: only "Use \| Set a \<band\>" with an indefinite article declares a region | The specification's self-contradiction; 12 indeterminates, and the ps-goal-kicks s3 verdict flip |
| 2 | Merge advantage-attached place references into the advantage group | The single duplicate finding (ps-none s3) |
| 3 | A malformed attempted setup declaration **fails** rather than escaping into tactical language | The single miss ("Create a central overload by having one team.") |
| 4 | Move local "extra numbers" out of Gate A as subjective; admit the shot-clock shorthand | 5 false alarms |

## Deliberately not done

- The corrections are **not** applied to the specification.
- The 60 are **not** replayed again: in-sample fit, and a 35/35 would be meaningless.
- Generation stays frozen, so the held-out Gate A corpus is **not** run yet. A more important
  architectural question comes first: the RPC-001 vertical slice through the shared representation.
