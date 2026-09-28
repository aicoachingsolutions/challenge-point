# Phase B, cluster 3 — the eight reference defects

> **RULED AND CORRECTED, 26 September (SD-87). CLOSED.**
>
> He authored the trigger as *"the state in which the ball leaves play over the defending team's goal
> line, having last been touched by an attacking player, without a goal being scored"*, and it maps
> through the existing structure with **no schema change**:
>
> | Authored component | Structural expression |
> |---|---|
> | the ball leaves play over a goal line | `trigger = OUT_END_LINE` |
> | …the **defending team's** goal line | `qualifier.endLine = DEFENDING_TEAM` |
> | last touched by an **attacking** player | `qualifier.lastTouch = ATTACKING_TEAM` |
> | **without a goal being scored** | carried by `OUT_END_LINE` being a distinct member of the closed trigger list from `SCORE`, on a row *"keyed by trigger"* — one per transition, so mutually exclusive |
>
> **His specific warning is met.** It is not reduced to `OUT_END_LINE` alone: `qualifier.lastTouch` is
> what separates a goal kick from a corner, which shares the trigger *and* the end line. A test asserts
> a corner does not reach the element and a goal kick does.
>
> | Closure condition | Result |
> |---|---|
> | the eight reference defects clear | **8 → 0**, the whole population |
> | no new general mechanism | none — one contract, one selector key |
> | no representation dependency | none — no row, attribute or register change |
>
> **A compounding effect worth recording.** Three of the eight are `T1` existence items, and identical
> selectors on a non-singleton row would have formed three transitions where there is one goal kick.
> They did not: two of the three are `ENGINE_ONLY`, and **cluster 2's establishment boundary already
> stops them**. One element formed, which is correct. A correction from two clusters ago silently
> prevented a fault this one would otherwise have introduced.
>
> **The failure count went UP, and that is the right direction.** Lines 144 → 153, gaps 90 → 93. A real
> transition now exists and its fields are enumerated. After the 47-line drop that was *not* progress,
> this 3-line rise is *not* regression — the same accounting in the other direction.
>
> **What surfaced, and it is cluster 4.** `GA-TRANSITION-COHERENCE` now fails: the goal-kick transition
> exists as `STOP_RESUME`, and a `STOP_RESUME` requires a taker and a region. Both are authored —
> `A01-02-11.a` and `A01-02-07.a` — but carry **off-list designations**, each marked `[L2]` by the
> restater exactly as `[L1]` marked this cluster. *"The team defending the end where the goal kick is
> placed"* and *"a player of the team in this element's T2"* are not registered team designations.
>
> That is the next bounded knowledge gap in the same contract, not a new mechanism.

26 September 2026. Analysis only; nothing corrected.

**All eight are one cause, and it is the first cluster that is not a general mechanism.** Two clusters of
general derivation rules, and then this: a single knowledge gap in a single contract.

---

## 1. What the engine is reporting

`GA-REFERENCE-INTEGRITY` fails its first clause — *"no reference defect implicates a reference of this
game"* — on **8 reference defects**. They are the oldest unexplained finding in the project: present in
the very first corpus run, and the only thing that has survived every correction since.

## 2. Which authoritative contributions produced it

All eight are in one contract, `restated:A01-02` — *From Goal Kicks*, whose only authored text is its
name and the Definition *"Restart from goal kicks."*

Every one carries the same defect: the selector `restart=GOAL_KICK`, on the transitions area.

| Item | Row | Selector |
|---|---|---|
| `A01-02-01.a` | `T1` | `restart=GOAL_KICK [not a registered T1 selector attribute; ledger L1]` |
| `A01-02-02.a` | `T1` | `restart=GOAL_KICK [L1]` |
| `A01-02-03.a` | `T1` | `restart=GOAL_KICK & trigger ∈ {SCORE, OUT_END_LINE, …} [restart: L1]` |
| `A01-02-04.a` · `04.b` · `05.a` · `07.a` · `11.a` | `T6` `T5` `T2` `T4` `T3` | `restart=GOAL_KICK [L1]` |

`T1` registers six selector attributes — `trigger`, `trigger.region`, `trigger.window`,
`qualifier.lastTouch`, `qualifier.endLine`, `qualifier.region`. There is no `restart`.

**The restater knew.** Every selector carries its own `[L1]` ledger marker, and the first item's fit-note
states the problem exactly:

> *"T1 selects only by trigger and qualifiers. The goal kick has to be picked out by its procedure
> because its trigger is not authored."*

## 3. What kind of cause this is

**Missing knowledge**, with a representation limitation that only binds because of it. The two are
separable, and separating them is the whole finding.

The source authors a **restart procedure** — a goal kick — and **no trigger**. The representation keys
transitions by trigger. So the contract had nothing to select by, and invented an attribute to do it.

That the trigger is genuinely absent is stated by the contract itself, twice more:

- `A01-02-02.a`: *"some trigger keys the goal-kick element; which one is not authored"*
- `A01-02-03.a` enumerates six candidate triggers rather than naming one — a restater unable to choose.

So this is **not** a representation gap to be closed by adding a `restart` selector attribute. The
representation can key a transition perfectly well; this contract has no key to give it.

**What the representation genuinely cannot do** — select a transition by its restart procedure — would
only matter if a contract authored a procedure *and* a trigger and needed to distinguish two transitions
sharing that trigger. No corpus contract does. Adding the capability now would be representation change
driven by a knowledge gap, which is the inversion this phase exists to avoid.

## 4. The smallest upstream correction

**Author the goal kick's trigger**, in the knowledge, and the eight selectors become
`trigger=<that trigger>`.

**I have not guessed which.** A goal kick follows the ball leaving over an end line, so `OUT_END_LINE` is
the obvious candidate — and "obvious" is exactly the reasoning this project refuses. The contract's own
restater had the same candidate available and declined to pick it, listing six instead. That is evidence
the choice is not as safe as it looks, and it is knowledge authoring either way.

It is worth noting what is **not** needed: no new row, no new selector attribute, no register change,
and no change to any of the eight items beyond the key they select on.

## 5. What else the same correction resolves

| | |
|---|---|
| Reference defects | **8 → 0**, the entire population |
| `GA-REFERENCE-INTEGRITY` | its failing clause; the check then rests only on its second clause |
| `A01-02`'s transition items | nine items that currently establish nothing and reach nothing become able to do both — the contract presently contributes no transition at all |
| `T5` `STATIONARY_BALL`, `T6` `STOP_RESUME`, `T2`, `T3`, `T4` | each authored, each currently unreachable because the element they describe cannot be picked out |

The whole contract is about one restart, and one unauthored fact is why none of it lands.

## 6. What must explicitly remain unresolved

**Which trigger.** Not guessable from the source, and the restater's own six-way enumeration is the
evidence that it should not be guessed.

**Whether a transition should ever be selectable by its restart procedure.** A real question, but not
one this corpus can answer, and not one to settle while the knowledge gap is the actual cause.

**`T5`'s vocabulary is too coarse to identify a goal kick** — `STATIONARY_BALL`, `SERVED`, `IN_HAND`. A
goal kick is a stationary ball, and so is a free kick, a corner and a kick-off. So even the procedure the
source *does* author cannot distinguish this restart from three others. Recorded, not pursued: it becomes
a live question only if he rules that procedures should be selectable.

---

## Reach of the correction (SD-81)

**Local to that knowledge**, and this is the notable part.

Clusters 1 and 2 were general derivation rules that reached across areas and contracts. This one touches
one contract, one missing fact, and no mechanism at all. It resolves eight failures and nothing else.

Three clusters in, the pattern so far: **the general mechanisms came first and took the large
populations with them; what is left behind is beginning to look like ordinary knowledge work.** On the
SD-82 criterion that is still internal diagnosis — an absent trigger is something the contracts and the
engine establish between them, not something a coach would tell us.
