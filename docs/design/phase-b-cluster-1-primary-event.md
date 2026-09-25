# Phase B, cluster 1 — the primary-event collision

24 September 2026. The first cluster, in the order he set: *"begin with the primary-event collision
because it is our first real evidence of independently authored knowledge reaching the same structural
property and disagreeing."*

**It is not a disagreement.** That is the finding.

Structured as he asked: what the engine reports, which contributions produced it, the cause, the smallest
upstream correction, what else that correction resolves, and what must remain unresolved.

---

## 1. What the engine is reporting

`game::V1` — the primary event kind — is `UNRESOLVED`, with one `COLLISION` record naming three
contracts: `blind:GF4`, `restated:GF2`, `restated:RPC-001`.

**And a second face of the same thing, which matters more.** Two further lines are reported
`RESOLVED:ENTAILED` while holding a *set* where a value belongs:

| Line | Reported | Value held |
|---|---|---|
| `c:restated:GF2:GF2-03.a::S3` | `RESOLVED:ENTAILED` | `"{zone, line} — set of alternatives, unordered"` |
| `c:restated:RPC-001:RPC-001-18.a::V5` | `RESOLVED:ENTAILED` | `"{the goalkeeper's START/restart placement, …}"` |

The collision is visible and stops the game. These two are **silent wrong answers**: a line claiming to
be derived while carrying a list of alternatives as if it were the value. Of the two faces, this is the
one I would fix first.

## 2. Which authoritative contributions produced it

All three V1 contributions are `EQUALS` · `REQUIRED` · `REQUIRED_RANGE` · `AUTHORED` · `WHOLE_GAME`.
None is assumed, engine-only, inert or outside the boundary. All three are fully authoritative.

| Contribution | Value | Source |
|---|---|---|
| `blind:GF4 :: I01` | `{goal, line_crossed}` (set of alternatives, unordered) | *"goal; line_crossed"* — GF4.scoring_structure_type |
| `restated:GF2 :: GF2-19` | `{line_crossed, target_zone_entered}` — set of alternatives, unordered | *"line_crossed; target_zone_entered"* — GF2.scoring_structure_type |
| `restated:RPC-001 :: RPC-001-08.a` | `{line_crossed, target_zone_entered, gate, target_player}`, ordered 1–4 | *"Valid primary scoring event 1 of 4, in the approved order."* (RPC-REL-071–074; provenance Christian, 2026-09-13) |

**Not one of them states a value.** Each states the *set of alternatives it permits*.

And they agree. The intersection of the three authored sets is:

```
{goal, line_crossed} ∩ {line_crossed, target_zone_entered} ∩ {line_crossed, target_zone_entered, gate, target_player}
  = { line_crossed }
```

**Exactly one member.** Three independently authored objects, each narrowing the same structural
property from a different direction, converging on a single value. That is the mechanism he wanted to
see, and it is the opposite of a conflict.

## 3. What kind of cause this is

**Specification / derivation semantics.** Not missing knowledge, not conflicting knowledge, not
incomplete contract realization, not a representation limitation.

The knowledge is complete, authoritative and mutually consistent. The engine reads a **narrowing** as a
**fixing**: `entails()` treats `requirement: EQUALS` as fixing the value and ignores `valueStatus:
REQUIRED_RANGE`, so three narrowings become three incompatible assertions, and one narrowing becomes a
resolved value that is really a list.

**The specification already says the right thing** — §5.8, on the primary event:

> *"SELECTION narrows to a valid set … under RR-01 the Context decides which physically available event
> applies; where that leaves a choice the kind is `FREE` under SD-39 and is chosen downstream."*

So this is not an open question. It is a rule the engine does not implement.

## 4. The smallest upstream correction

**In stage 5: a support-capable item whose `valueStatus` is `REQUIRED_RANGE` and whose value is a set of
alternatives *narrows* the line rather than entailing it.** Narrowings intersect. Then:

| Intersection | Line |
|---|---|
| exactly one member | `RESOLVED:ENTAILED`, value = that member, support = every contributing item |
| more than one member | `FREE(choice)` under SD-39 — the choice is real and is made downstream |
| empty | a genuine `UNRESOLVED` collision — the narrowings exclude each other |

This adds no representation, no vocabulary and no football knowledge. It completes an existing
distinction the value model and §5.8 already draw.

**It has a knowledge-side prerequisite, and that part is not mine.** These values are prose-wrapped sets:

```
"{goal, line_crossed} (set of alternatives, unordered)"
"{line_crossed, target_zone_entered} — set of alternatives, unordered"
```

A braced list inside a sentence. The engine's member-set reader deliberately refuses prose (SD-32 forbids
reading meaning out of text), so it would refuse all three. Making them machine-readable sets is a
**restatement** of five items, and restatement is his.

I have written neither half. This is the analysis, not the repair.

## 5. What else the same correction resolves

| | |
|---|---|
| `game::V1` | `UNRESOLVED` → `RESOLVED:ENTAILED` = `line_crossed`. **The corpus's only collision disappears** — because it was never a collision |
| `c:restated:GF2:GF2-03.a::S3` | stops holding a set as if it were a value |
| `c:restated:RPC-001:RPC-001-18.a::V5` | the same |
| `GA-ONE-PRIMARY-EVENT` | its **kind** clause stops being blocked by an unresolved V1 |
| `GA-REFERENCE-INTEGRITY` | `RPC-001-18.b`'s V5 referents stop presenting a prose set to the identity rule (SD-63) |

Five items, three rows, one collision, and part of two gate checks — from one semantic correction.

**What it does *not* resolve, and must not be conflated with it:** the five primary events. That is a
different mechanism — five contracts each authoring a `V0` *existence* item, so five element classes
form where SD-06 requires exactly one. Existence and kind are separate questions, and the `V1`
correction leaves the `V0` count exactly where it is. That is cluster 2.

## 6. What must explicitly remain unresolved

**The approved order.** `RPC-001-08.a` carries *"ordered 1–4"*, and RC-29 records that the authored
order is kept but **not applied**, so it does not choose among members. §5.8 says so directly: *"How the
approved order binds the choice is not settled here."*

Here the intersection happens to be a singleton, so the order never has to decide anything — the corpus
gets the right answer without answering the open question. **That is luck, not resolution**, and it would
be a mistake to read this cluster as evidence that ordering is settled. The moment two objects intersect
to two or more members, the line is `FREE(choice)` and the order question is live again.

**The prose-wrapped set values**, until he rules on the restatement above.

**Whether narrowings from different objects may be intersected at all.** I am treating three independent
`REQUIRED_RANGE` narrowings as jointly constraining one line. That follows from each being `REQUIRED` and
in scope `WHOLE_GAME`, and it is what makes the corpus converge — but it is a composition rule, and I
would rather he confirmed it than have it arrive by implementation.

---

## Why this cluster was worth starting with

He asked to understand the mechanism before the larger population. The mechanism is this:

**Independently authored knowledge reaching one structural property does not, in this corpus, disagree.
It converges — and the engine's inability to represent convergence made it look like conflict.**

One collision, and it was an artefact. Before Phase B expands to the 137 failed lines, that is worth
knowing: some part of that population will be the same defect wearing a different label, and counting
failed lines would have made this look like progress in the wrong direction.
