# Instantiated-element identity — the bounded check

**Status: evidence for Christian. Nothing implemented.** Requested 3 October, before any team-identity
mechanism is proposed, to establish whether this is a team-specific gap or a general instantiated-element
reference question.

The principle under test:

> *An instantiated element may require stable referential identity without that identity carrying domain
> meaning.*

---

## The answer in one line

**It is a general question, and teams are the only collection that currently exercises it.** The
representation has a canonical, general identity mechanism that already carries no domain meaning —
`elementId`, the class id. It cannot mint more than one handle per authoring item, because the handle *is*
the item. One existential claim of cardinality 2 is one authoring act, so two teams arrive with one name.

And one correction to the hypothesis I went in with, below in §3: **GF2's P2 is not the case that requires
identity.** It is symmetric, and symmetric per-team claims need no identity at all.

---

## 1 · What identity and reference mechanisms already exist

Six things in the representation refer to an element. Three are identity, one is quantification, two are
neither.

**(a) `elementId` — the canonical handle.** The class id `c:<contractId>:<itemId>`, minted from the item
that authored the element, and addressed as `container[elementId].leaf` (`splitElementPath`,
`realize.ts:153`). Verified on A04 — every derived element carries one:

| element | `elementId` |
|---|---|
| `space.regions[0]` | `c:restated:GF2:GF2-03.a` |
| `space.regions[1]` | `c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a` |
| `space.regions[2]` | `c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03` |
| `objectives[0]` | `c:restated:GF2:GF2-08.a` |
| `transitions[0]` | `c:restated:GF2:GF2-07.a` |
| `value.valueModifiers[0]` | `c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-18.a` |

**(b) The typed structural reference (SD-98)** — `{structuralRef: {contractId, itemId}, asAuthored}`, the
canonical *referring expression*. `referentClass` resolves it to a class and `identityOf` grades it
`HELD` / `DANGLING` / `OPEN_TEXT` (`gates.ts:299–343`). Live on A04: V8b's established member is a typed
reference to `WIDEZONE-02.a`. It resolves **to a class**, so it inherits (a)'s limit exactly.

**(c) The authored selector.** `{attribute: 'lateral', op: '=', value: 'wide-left'}` versus `'wide-right'` is
what tells A04's two wide channels apart, and what `collectionCardinality` uses for subsumption. It
distinguishes members by an authored distinguishing *property*.

**(d) `scope: PER_TEAM` — universal quantification without naming.** Used by GF2's DV1 and J1, RPC-001's DV1
and J1, and the Neutral Player Condition's P2. This is the existing mechanism for saying something about
every team, and it needs no identity. Its limit is the whole of §3: **it gives quantification, not
co-reference or complement.** "each team" needs no identity; "the other team" does.

**(e) `satisfies` — not identity.** An instantiated member carries the *claim's* class id, which every member
of that claim shares. `realize.ts:69` already records this: *"Two members of the same class carry the same
`satisfies`, so a path cannot tell them apart."*

**(f) The index — the only thing that actually discriminates today.** `memberIndex` on the realization
record, `key(path, i)` inside `nothingInvented`, `realized:${classId}:${i}` in the post-realization gate, and
`assembly:performers.teams[${memberIndex}]::${rowId}` at final assembly. Internal, undeclared, and not
derivable from anything the game holds.

**And a structural fact that bounds all of this.** No register row anywhere names an `.id`, `.name`,
`.label`, `.key`, `.ref` or `.identity` leaf — checked across every path in the register. `performers.teams[]`
has exactly four rows: the collection, `outfieldCount`, `goalkeeper`, `roles[]`. So the register gives a team
no identifying property at all, and authored knowledge has nowhere to put one. Identity lives entirely
outside the register, as engine-minted provenance.

---

## 2 · Is any of them general enough to use for teams?

**Yes in kind, no in cardinality.** `elementId`, reached as a typed structural reference, is canonical,
general, and already carries no domain meaning — it is provenance, not football, and nothing renders it or
orders by it. It is exactly the mechanism his principle describes, and it would apply to teams with no new
semantics.

What it cannot do:

> The three identity mechanisms — the class id, the typed reference that resolves to it, and the authored
> selector — **all identify an element by what authored it.** None can identify an element that nothing
> individuates.

An instantiated member has no authoring item of its own. It exists because a claim said *n of these exist*.
One claim is one authoring act, so it can mint one handle for n members.

**So this is not a team-specific gap.** It is general, and teams are the only collection that currently
exercises it — because teams are the only collection whose members are created by an existential claim with
cardinality > 1 rather than authored one item at a time. Verified across A01–A06: the only claim with a
shortfall anywhere is `performers.teams[]`. A04's `objectives[]` claim has shortfall 0 (satisfied by
GF2-08.a), and the regions, transition and value modifier are all authored elements with their own ids.

**The regions are the near-miss worth naming.** Two wide channels, structurally similar, independently
referable — and they are *not* two members of one claim. Each has its own item, hence its own `elementId`,
plus a distinguishing authored selector. So the corpus has never yet had to refer to **one of n
indiscernible instances.** Teams are the first case.

---

## 3 · Does existing knowledge require team identity independently of possession?

**Yes — but by fewer consumers than I expected, and not the one I went in believing.**

### The correction

My hypothesis was that GF2's P2 required it. It does not:

> `GF2 / P2` — *"equal to the other team's outfieldCount; no absolute number"*, EQUALS, WHOLE_GAME,
> REQUIRED_RANGE.
> fitNote: *"No requirement kind compares two elements; the value is a reference to another element's field,
> which EQUALS cannot test (SCHEMA LOCAL)."*

The phrasing reaches for "the other team", but the **claim is symmetric** — it asserts the two counts are
equal. A set-level comparison ("all members of this collection agree on P2") expresses it exactly, with no
identity. And the engine already does this: `deriveRoster` reads the authored equality and divides the
session total. **The one selected consumer is already served without identity, which is why nothing has been
blocked until now.** The same applies to GF2's J1 (*"min 1 per team"*) and to every `PER_TEAM` claim that
says the same thing of each team.

So the requirement splits, and the split is the useful finding:

- **symmetric per-team claims** — expressible with `scope` plus a set-level comparison. **No identity.**
- **asymmetric per-team claims, and possession assignment** — require identity.

### What genuinely requires it

**(i) GF4 authors an asymmetry.**

> `GF4 Transition Games / P2` — *"unequal between the teams, e.g. 4 and 6 (4v6)"*, EQUALS, PER_TEAM,
> TYPICAL_EXAMPLE, basis AUTHORED.

A static structural asymmetry with nothing to do with possession. "4 and 6" cannot be stated at all unless
the representation can say which team has 4. Two honest qualifications: the status is `TYPICAL_EXAMPLE`, so
the *numbers* are an example rather than a bound — but the **asymmetry itself is the authored claim**, and it
is a relation between two individuals either way. And GF4 is contracted but **not selected** by any of
A01–A06 (verified). Note also that `deriveRoster` refuses on it, because its guard requires
`valueStatus === 'REQUIRED_RANGE'` — so a GF4 game today gets no roster rather than a wrong one.

**(ii) The Neutral Player Condition quantifies with a complement.**

> `P2` — *"for each team T: P2(T) > P2(other team) − P5"*, RANGE, PER_TEAM.
> fitNote: *"the bound is read from other elements and rows, which no requirement kind holds (SCHEMA LOCAL)."*

A bound variable and its complement, explicitly. Asymmetric: it permits unequal teams. Contracted, not
selected.

**(iii) Possession assignment** — the live consumer, and chronologically the third rather than the first.

### The pattern underneath

Three different authors reached for "the other team" / an asymmetry, and **all three were recorded SCHEMA
LOCAL** — the restatements have been reporting this gap for some time without naming it. `scope` gave them
universal quantification; none of them could get co-reference.

---

## 4 · The minimum distinction between referential identity and an authored property

A single criterion, and it is testable:

> **Can swapping it between two members make the representation false?**

- **If yes, it is a value** — a claim about the game that can be true or false. It needs a row to live on, a
  basis, a status, and support. `designation: ATTACKING_TEAM` was this and had none of them: `designation`
  appears **zero times** in the register, so there was no row to hold it and no line to carry a verdict.
- **If no, it is an address** — it makes no claim and cannot be wrong. It needs only to be unique among its
  siblings and stable. `elementId` is this.

So the minimum requirements on a referential handle:

1. **unique** among the members of its collection;
2. **stable** across stages, and across two runs of one input;
3. **opaque** — equality and complement are the only permitted operations; no ordering, no arithmetic, no
   matching against an authored string, no recovering the order of instantiation;
4. **unauthored** — no register row, no line, no verdict, no `valueStatus`, no fillable choice space, and no
   contract item may target it;
5. **unrendered** — absent from every coach-facing surface.

A name, a colour, and an attacking/defending designation each fail (1) on the criterion above: swap them and
the representation says something different. Each is therefore a value needing authored support that does not
exist.

---

## 5 · At what stage identity can legitimately be established — tested

He suspected realization or final assembly. **Tested in both directions, and it is instantiation, inside
realization.**

**Could it be earlier?** No. Pre-realization `performers.teams` is absent from the resolved game and the
claim's shortfall is 2 — there is nothing to carry a handle.

**Is it needed earlier?** No. No line referring to an individual team is enumerated before realization.
Member lines are materialised from `establishedMembers`, and A04's only established members are S4's
`"objective-area"` and V8b's typed reference to `WIDEZONE-02.a` — neither is a team. Verified: **no P2 line is
enumerated in any of A01–A06.**

So by his own principle — *evaluate at the earliest stage at which all the information required exists* —
identity can be established at instantiation, and that is also the earliest it could be.

**One refinement, which is why this was worth testing rather than assuming: instantiation, not final
assembly** — even though final assembly is where the first per-team value is written. `nothingInvented`
already has to address members individually *during* realization and uses `key(path, i)` to do it. If the
handle were minted at assembly, the index would remain the operative identity for the whole of realization
and the two notions would coexist. Minting at instantiation and consuming at assembly leaves one notion.

---

## 6 · The falsification case

A game with two structurally identical teams. **A04 is already exactly this** — both members are
`{satisfies, outfieldCount: 6, goalkeeper: 0}`.

**(a) Referability.** There exist handles `h1 ≠ h2`; each resolves to exactly one member; and for each
`h`, "the other team" resolves to the other member and to nothing else — `complement(h1) = h2`,
`complement(h2) = h1`, both single-valued. That is the whole of what an asymmetric per-team claim needs.

**(b) Permutation invariance.** Build the game twice with the handles exchanged between the two members.
Modulo renaming the handles, every artifact must be identical: resolved game, realization record,
post-realization verdicts, fidelity verdicts. The **rendered coach text must be identical literally**, not
modulo renaming, because no handle may reach a coach.

How to read a failure:

- **(a) fails** → the mechanism is not identity.
- **(b) fails modulo renaming** → something depends on which handle a member holds; the handle carries
  meaning.
- **(b) fails literally in the render** → the handle leaked to a coach.

**What the case says about today's state: A04 fails (a) outright and passes (b) vacuously.** It passes (b)
because the two members are identical objects, so exchanging them is the identity operation — there is
nothing to permute. That is why no existing check has caught this: **the game is currently perfectly
symmetric, and the index is harmless precisely because nothing yet distinguishes the members.** The first
asymmetric per-team value breaks the symmetry.

So the case must be run with a distinguishing value forced in — the unequal counts GF4 authors are the
natural one — or it passes without proving anything. Same discipline as GA-ROSTER-SUM, which passed for 4, 5,
6 *and* 7 per team until a wrong value was forced through it.

---

## 7 · Blast radius — where the same problem is hidden elsewhere

Reported, not repaired. Ranked by whether it can produce a wrong answer.

### Can produce a wrong answer

**1 · Two existential claims on one collection → duplicate physical members. A01, A02 and A05.**

A01 carries **two** claims on `performers.teams[]`:

```
c:blind:PASS-COMBINATION-GATE:PCG-08   shortfall 1   max null
c:restated:GF2:GF2-14.a                shortfall 2   max 2
```

Run against the authorization check:

| instantiated | result |
|---|---|
| 2 teams, both on GF2-14.a | refused — *"PCG-08: performers.teams[] is asserted to exist and nothing was instantiated to satisfy it"* |
| 2 teams, one per claim | refused — *"GF2-14.a: performers.teams[] still owes 2 member(s), and 1 was instantiated"* |
| **3 teams** | **no team-related objection at all** |

The per-claim maximum counts only that claim's own instantiations, and the collection-level cardinality check
runs *before* instantiation, so nothing sees the third team. This is the same error class as the three Wide
Zone channels he ruled on — *"multiple source rows do not by themselves entail multiple physical elements"* —
and the reason the engine cannot apply that ruling here is exactly the missing identity: **nothing can say
that PCG-08's team and GF2-14.a's teams are the same teams.** Latent only in that A01's Gate A is
`NOT_EVALUABLE`, so it is not realized today.

**2 · Per-team values addressed by index.**

`assemble-concrete-game.ts` writes `assembly:performers.teams[${memberIndex}]::P2` and
`path: performers.teams[${memberIndex}].${leaf}`; `memberInGame` reads `(bucket)[memberIndex]`. Safe today
**only because** `deriveRoster` returns unless equality is authored (`basis !== 'ASSUMED'`,
`valueStatus === 'REQUIRED_RANGE'`, `/\bequal/i`). So it writes a per-index number only in the case where the
index cannot matter. **That guard is an equality requirement, not an identity requirement — the safety is
incidental.** GF4 authors unequal teams; the moment a selected game form carries an asymmetric per-team
value, the number attaches to a position that carries no identity.

### Degrades a check rather than the game

**3 · `DISTINCT_ON` degenerates silently.** `realize.ts:396–430` keys its tuples by
`splitElementPath(entry.path).elementId`. For two instantiated members of one claim that segment is the same
`satisfies` for both, so the second **overwrites** the first in the `tuples` map, `byElement` ends with one
entry for two members, and the pairwise-distinctness check passes having compared nothing. The one authored
`DISTINCT_ON` (`VARTARGET-03.a`, rows O4/O5) applies to three separately-authored object classes with real
ids, so this is latent. It is the sharpest evidence that identity is general: **DISTINCT_ON exists to prove
two members are in different places, and it is disabled for exactly the population that has no identity.**

**4 · The derivation-layer dedupe drops a twin.** `memberKey` (`engine.ts:97`) returns `String(member)` for
anything that is not a typed reference, so two structurally identical members both key to `"[object Object]"`
and `if (!identified.has(key))` keeps the first and silently drops the second. Latent for teams, since teams
are not established members — but it is the same assumption (structural equality implies identity) one layer
down.

**5 · `realize.ts:738` reports a colliding path.** `elementId ?? satisfies` gives two members of one claim
the same path segment. The walk's actual accounting uses `key(path, i)`, so **no value is mis-attributed**;
what collides is the path printed in a problem message. Cosmetic — but it would name one path for two
members to whoever reads a failure.

**6 · Three unrelated spellings of member identity.** `memberKey` is `contractId::itemId`; `key(path, i)` is
positional; the post-realization gate mints `realized:${classId}:${i}`. None is general. That is the
signature of a concept that exists and is unowned.

### On determinism

Member order **is** stable across two runs of one input (verified on A01, A04, A05). Worth stating plainly,
because "the index is fine, it's deterministic" is the wrong consolation: the problem is not that the index
changes, it is that **nothing the game holds explains it.**

---

## 8 · What the evidence says the smallest addition is — and the one ruling it needs

The mechanism exists. What is missing is a **mint for an element that no item individuates**. The smallest
general addition is to make the existing handle total: extend `elementId` to instantiated members, derived
from the claim that authorized them plus a discriminator.

**The discriminator is a semantic choice with more than one valid reading, so it is his.** Two of his rulings
meet here:

> *"'First' and 'second' are implementation artifacts, not authored football meaning."*
> *"An instantiated element may require stable referential identity without that identity carrying domain
> meaning."*

These are compatible only if **minting** is separated from **interpreting**: an ordinal may be an *input* to
minting an opaque handle, provided nothing afterwards can read it, order by it, or recover it — which is
exactly what §4's criterion (3) and §6's permutation test enforce.

So the question:

1. **Is an ordinal permissible as an input to minting an opaque handle**, given criterion (3) and the
   permutation test as the guards? If yes, the addition is small, general, and testable, and it uses the
   canonical mechanism rather than creating a team concept.
2. **Or must the handle's derivation contain no ordinal at all?** Then the evidence says identity cannot be
   established from the corpus: the remaining sources are an authored distinguishing property (none exists,
   and inventing one is what was forbidden) or an opaque counter, which is an ordinal wearing a hat. On that
   reading **the two teams are genuinely indiscernible and the representation is right to refuse to tell them
   apart** — and GF4's asymmetry and possession assignment are blocked on an authoring decision (what, if
   anything, distinguishes the two teams), not on an engine extension.

Both are coherent. (2) is the more conservative and may be the right answer; it would make this an authoring
question rather than a representational one.

Nothing implemented. The touch-trigger decision and the magnitude are untouched, and neither is affected by
either reading.
