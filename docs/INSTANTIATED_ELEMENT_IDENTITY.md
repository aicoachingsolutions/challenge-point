# Instantiated-element identity — the bounded check

**Status: evidence for Christian. Nothing implemented.** Requested 3 October, before any team-identity
mechanism is proposed, to establish whether this is a team-specific gap or a general instantiated-element
reference question.

The principle under test:

> *An instantiated element may require stable referential identity without that identity carrying domain
> meaning.*

---

## The answer in one line

**It is a general question, teams are the only collection that currently exercises it, and the comparison
mechanism it would serve already exists and is unused.**

`elementId` — the class id — is the canonical handle and already carries no domain meaning. It cannot mint
more than one handle per authoring item, because the handle *is* the item, and one existential claim of
cardinality 2 is one authoring act. And `COMPARES`, the requirement kind that would consume a team handle,
was added by AM-16 on 20 September and **no corpus item uses it**.

Two corrections I owe, both below: **GF2-14.b does not require identity** (it is symmetric), and **member
order is not deterministic** in the way I claimed in my last note.

---

## 1 · What identity and reference mechanisms already exist

**(a) `elementId` — the canonical handle.** The class id `c:<contractId>:<itemId>`, minted from the item that
authored the element, addressed as `container[elementId].leaf` (`splitElementPath`, `realize.ts:153`).
Verified on A04 — every derived element carries one, and the two teams carry none:

| element | `elementId` |
|---|---|
| `space.regions[0]` | `c:restated:GF2:GF2-03.a` |
| `space.regions[1]` | `c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-02.a` |
| `space.regions[2]` | `c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-03` |
| `objectives[0]` | `c:restated:GF2:GF2-08.a` |
| `transitions[0]` | `c:restated:GF2:GF2-07.a` |
| `value.valueModifiers[0]` | `c:restated:WIDE-ZONE-ADVANTAGE:WIDEZONE-18.a` |
| `performers.teams[0]`, `[1]` | **none** — `{satisfies, outfieldCount: 6, goalkeeper: 0}` |

**(b) The typed structural reference (SD-98)** — `{structuralRef: {contractId, itemId}, asAuthored}`, the
canonical *referring expression*, graded `HELD` / `DANGLING` / `OPEN_TEXT` by `identityOf`
(`gates.ts:299–343`). Live on A04: V8b's established member is a typed reference to `WIDEZONE-02.a`. It
resolves **to a class**, so it inherits (a)'s limit exactly — a typed reference to `GF2-14.a` would resolve
`HELD` and point at both teams at once.

**(c) The authored selector.** `{attribute: 'lateral', op: '=', value: 'wide-left'}` versus `'wide-right'` is
what tells A04's two wide channels apart, and what `collectionCardinality` uses for subsumption. It
distinguishes members by an authored distinguishing *property*.

**(d) `scope: PER_TEAM` — universal quantification without naming.** Used by GF2's DV1 and J1, RPC-001's DV1
and J1, and the Neutral Player Condition's P2. **Its limit is the whole question: it gives quantification,
not co-reference.** "Each team" needs no identity; "the other team" does.

**(e) `satisfies` — not identity.** An instantiated member carries the *claim's* class id, shared by every
member of that claim. `realize.ts:69` already says so: *"Two members of the same class carry the same
`satisfies`, so a path cannot tell them apart."*

**(f) The index — the only thing that discriminates today.** `memberIndex`, `key(path, i)` inside
`nothingInvented`, `realized:${classId}:${i}` in the post-realization gate, and
`assembly:performers.teams[${memberIndex}]::${rowId}` at assembly.

**And two structural bounds.** First: no register row anywhere names an `.id`, `.name`, `.label`, `.key`,
`.ref` or `.identity` leaf — checked across every path. `performers.teams[]` has exactly four rows: the
collection, `outfieldCount`, `goalkeeper`, `roles[]`. **The register gives a team no identifying property at
all**, so authored knowledge has nowhere to put one. Identity lives outside the register, as engine-minted
provenance.

Second, and it closes off mechanism (c) for teams specifically: **`P1` declares
`selectorAttributes: ["team"]`, and neither `P2` nor `P3` declares a `selectorAttribute`.** The `team`
attribute is wholly unbacked by any FIELD row, and the SD-92 `CARRIES` relation that turns a selector term
into a property value requires one (`derive.ts:343`, `if (!row || !row.selectorAttribute) continue`). So **the
authored-selector route — the very thing that distinguishes the two wide channels — is structurally
unavailable for a team**, independently of the instantiation problem. That matters for the ruling in §9:
authoring a distinguishing team property would itself need a register row, so it is not purely an authoring
decision.

---

## 2 · Is any of them general enough for teams?

**Yes in kind, no in cardinality.** `elementId`, reached as a typed structural reference, is canonical,
general, and already carries no domain meaning — it is provenance, not football, and nothing renders it or
orders by it. It is exactly the mechanism his principle describes.

> The three identity mechanisms — the class id, the typed reference that resolves to it, and the authored
> selector — **all identify an element by what authored it.** None can identify an element that nothing
> individuates.

**So this is not a team-specific gap.** It is general, and teams are the only collection that currently
exercises it, because teams are the only collection whose members are created by an existential claim with
cardinality > 1 rather than authored one item at a time. Verified across A01–A06 (A07–A10 do not exist): the
only claim with a shortfall in any selected goal is `performers.teams[]`. A04's `objectives[]` claim has
shortfall 0, satisfied by GF2-08.a.

**One qualification.** Corpus-wide there is a second existential claim — `VARTARGET-06.a` on row J5, whose
register path is `objectiveSets[]`. It never reaches a run because the Variable Target Condition is in no
goal's selection. So "teams only" is true of *selected* knowledge, not of the corpus. That case would be
strictly harder: `objectiveSets[].members` (J7) is a list of references *out of* an instantiated member.

**The regions are the near-miss worth naming.** Two wide channels, structurally similar, independently
referable — and **not** two members of one claim. Each has its own item, hence its own `elementId`, plus a
distinguishing authored selector. **The corpus has never yet had to refer to one of n indiscernible
instances.** Teams are the first case.

---

## 3 · Does existing knowledge require team identity independently of possession?

### The correction I owe

My last note implied GF2's P2 was the strongest case. **It is not, and this is the item:**

> `GF2-14.b` — row P2, *"equal to the other team's outfieldCount; no absolute number"*, EQUALS, WHOLE_GAME,
> REQUIRED_RANGE. Promoted from ASSUMED to **OWNER_RULING** by ruling **C31b** on 1 October.
> fitNote: *"No requirement kind compares two elements; the value is a reference to another element's field,
> which EQUALS cannot test (SCHEMA LOCAL)."*

The phrasing reaches for "the other team", but **the claim is symmetric** — it asserts the two counts are
equal, which is decidable over an unordered pair. `deriveRoster` already satisfies it without ever resolving
"the other team": it detects the word `equal` and divides the outfield pool over `teams.length`.

So the requirement splits, and the split is the useful finding:

- **symmetric** per-team claims — `scope` plus a set-level comparison. **No identity.**
- **asymmetric** per-team claims, and possession assignment — **identity required.**

### What does require it — and the authority is his own ruling

**C31b's caution is the strongest evidence in the corpus**, stronger than any item:

> *"Please preserve the ability for other selected authoritative knowledge to establish numerical asymmetry
> where the learning problem requires it. Equal team numbers should not become an engine-level universal
> assumption."*

And the fitNote on that same ruling says how: *"a game form that authors asymmetry displaces it through the
ordinary displacement mechanism (SD-90), so equality is knowledge about THIS game form and never a
universal."*

**A displacing game form must say which team gets which number.** So asymmetry is not hypothetical — it is a
capability he has already directed be preserved, and it cannot be expressed without identity.

**GF4 is exactly such a game form.** Its P2 reads *"unequal between the teams, e.g. 4 and 6 (4v6)"*,
PER_TEAM, basis AUTHORED. Two honest qualifications: the status is `TYPICAL_EXAMPLE`, so by §3 it bounds and
never entails, and the numbers are an example rather than a bound; and GF4 is contracted but **not selected**
by any of A01–A06. `deriveRoster` refuses on it (its guard requires `REQUIRED_RANGE`), so a GF4 game today
gets no roster rather than a wrong one.

**Two further latent shapes**, neither currently entailing:
- **The Pass Combination Gate.** `SV1` is registered as *"halves and thirds along the axis, per team
  (own/attacking)"* — a view **keyed by team** — and PCG-06 composes a possession designation with it. Possession
  picks the key; it cannot supply the mapping, because the per-team halves must stay stable while possession
  alternates. PCG is a blind contract, its own fitNote records L4, and no engine code reads SV1.
- **The Variable Target Condition** — the corpus's only authored asymmetry (one team owns a candidate set). It
  rests on `VARTARGET-06.d` (J6 = *"one team (the TEAM_<id> whose candidate set it is)"*), which is ASSUMED
  while J6 is simultaneously NOT_AUTHORED. The asymmetry is stated and never entailed.

**Strict answer:** among knowledge that actually *entails* anything today, **possession assignment is the only
consumer.** But asymmetry is a directed capability (C31b), and the two latent shapes are blocked on authority
rather than on mechanism. So identity is a prerequisite rather than an unmet existing requirement — which is a
weaker claim than I made last time, and the right one.

### `TEAM_<id>` — the vocabulary is weaker evidence than an item
The form is used three times. `NEUTRAL-04.b` is AUTHORED but an **exclusion** (no neutral may be fixed to a
named team) — it needs the form to be *expressible* so the prohibition is not vacuous, which is far weaker
than any team having identity. `VARTARGET-06.d` is ASSUMED. The third is a NON_CLAIMED declaration selector.
**No authoritative item requires a named team.**

---

## 4 · The canonical mechanism that already owns this concept — and is unused

**`COMPARES` is a registered requirement kind.** From the register's `comparison` block:

> *"AM-16 as extended by Christian on 20 September and closed by his rulings the same day [C20b]. Requirement
> kind COMPARES."*
> form: `{ left: <operand>, operator, right: <operand> }`, operator in `{ =, !=, <, <=, >, >= }`
> operands (SD-23): *"either (a) a represented game property: `{ row, selector }`; or (b) a deterministically
> derived quantity whose inputs are SUPPORTED represented game properties"*
> versions: *"contractEnums.requirement: 2 (2026-09-20, COMPARES added by AM-16)"*

**Zero of the corpus items use it.** So:

1. **The four P2 fitNotes saying *"no requirement kind compares two elements"* are stale.** They were true
   when written; AM-16 added exactly that kind on 20 September. Four items carry a SCHEMA LOCAL note for a
   limitation that no longer exists.
2. His own rule — *"a new representational mechanism must not be introduced where an existing canonical
   mechanism already owns the same semantic concept"* — points at `COMPARES` before anything new.
3. **It localizes precisely what identity is for.** A symmetric comparison needs two operands with selectors
   that range over the pair. An **asymmetric** one needs a selector that picks out *one* team — and a selector
   that picks one of two indiscernible members is exactly the missing handle.
4. And it would replace a prose sniff: `deriveRoster` currently reads equality by testing `/\bequal/i` against
   the item's text, which is how the near-miss on *"unequal between the teams"* arose.

So the shape of the answer is not "mint a handle" on its own. It is: **the comparison kind already exists, is
unused, and is what a team handle would be for.**

---

## 5 · The minimum distinction between referential identity and an authored property

One criterion, and it is testable:

> **Can swapping it between two members make the representation false?**

- **If yes, it is a value** — a claim that can be true or false, needing a row, a basis, a status and support.
  `designation` was this: it appears **zero times** in the register, so there was no row to hold it and no line
  to carry a verdict.
- **If no, it is an address** — it makes no claim and cannot be wrong. It needs only to be unique among its
  siblings and stable.

Requirements on a handle: **unique** among its collection; **stable** across stages and runs; **opaque**
(equality and complement the only operations — no ordering, arithmetic, string matching, or recovering the
instantiation order); **unauthored** (no row, line, verdict or status; no item may target it); **unrendered**.

A name, a colour and an attacking/defending designation each fail the swap test. Each is a value needing
support that does not exist.

---

## 6 · At what stage identity can legitimately be established — tested

He suspected realization or final assembly. **Tested in both directions: instantiation, inside realization.**

**Could it be earlier?** No. Pre-realization `performers.teams` is absent from the resolved game and the
claim's shortfall is 2 — nothing exists to carry a handle.

**Is it needed earlier?** No. No line referring to an individual team is enumerated before realization. Member
lines are materialised from `establishedMembers`, and A04's only two are S4's `"objective-area"` and V8b's
typed reference to `WIDEZONE-02.a` — neither a team. Verified: **no P2 line is enumerated in any of A01–A06**,
and `engine.ts:298` skips field-line enumeration for an existential class outright (SD-97).

So by his own principle — *evaluate at the earliest stage at which all the information exists* — identity can
be established at instantiation, and that is also the earliest it could be.

**One refinement, which is why this was worth testing: instantiation, not final assembly** — even though
assembly writes the first per-team value. `nothingInvented` already addresses members individually *during*
realization via `key(path, i)`. Mint at assembly and the index stays the operative identity for the whole of
realization, so two notions coexist. Mint at instantiation and consume at assembly, and there is one.

---

## 7 · The falsification case

Two structurally identical teams. **A04 is already exactly this** — both members
`{satisfies, outfieldCount: 6, goalkeeper: 0}`.

**(a) Referability.** Handles `h1 ≠ h2`, each resolving to exactly one member, and for each `h` the complement
resolving to the other member and nothing else — `complement(h1) = h2`, `complement(h2) = h1`, both
single-valued. That is the whole of what an asymmetric per-team claim needs.

**(b) Permutation invariance.** Build the game twice with the handles exchanged. Modulo renaming, every
artifact identical: resolved game, realization record, post-realization verdicts, fidelity verdicts. The
**rendered coach text identical literally**, since no handle may reach a coach.

Reading a failure: **(a)** fails → not identity. **(b)** fails modulo renaming → the handle carries meaning.
**(b)** fails literally in the render → the handle leaked to a coach.

**What it says about today: A04 fails (a) outright and passes (b) vacuously** — the two members are identical
objects, so exchanging them is the identity operation. There is nothing to permute. **That is why no check has
caught this: the game is perfectly symmetric, and the index is harmless precisely because nothing yet
distinguishes the members.** The first asymmetric per-team value breaks it.

So the test must be run with a distinguishing value forced in, or it proves nothing. Same discipline as
GA-ROSTER-SUM, which passed for 4, 5, 6 *and* 7 per team until a wrong value was forced through it.

---

## 8 · Blast radius — where the same problem is hidden elsewhere

Reported, not repaired. Ranked, and each one verified by running it.

### A · Defects in the checks themselves

**A1 · `chosenMemberLeaves` is wrong in both directions. The most serious finding here, and it is in the
invention check.** `realize.ts:691–704`:

```
const index = realized.record.instantiations.findIndex(
    i => collectionPath(i.path) === collection && String(i.classId) === String(parts.elementId),
)
...
chosenMemberLeaves.get(k)!.add(parts.leaf)
```

`findIndex` returns the **first** instantiation whose classId matches — and two members of one claim share a
classId, so a choice about either member always resolves to member[0]. And the map stores only the leaf
**name**, not the value. So member[0]'s leaf is marked licensed and *any* value there passes unchallenged,
while member[1]'s correct value is reported as an invention.

**The adjacent map was explicitly hardened against exactly this** (`realize.ts:671–677`): *"Name-only
accounting was a hole: a member carrying `outfieldCount: 99` beside an entailment recording `outfieldCount`
reported nothing, because the set said only that some value at that leaf was licensed."* `entailedValues` got
value-based accounting; `chosenMemberLeaves` never did. **Latent** — no choice in A04's file has a path into a
member — and the correct shape is demonstrated ten lines above it.

**A2 · `DISTINCT_ON` never executes at all.** Worse than the identity degradation I expected. The one authored
condition is `VARTARGET-03.a`, on row **O4**, whose register path is `objects[].position.along`. In
`resolved-game.ts` the condition's `path` is set from that row, so `condition.path =
"objects[].position.along"`. Then `realize.ts:408` filters with
`parts.container.startsWith(condition.path.replace(/\[\]$/, ''))` — and `/\[\]$/` strips only a **trailing**
`[]`, so nothing is stripped, while `parts.container` for a real entry is `objects`. `"objects"` does not start
with `"objects[].position.along"`, so every entry is skipped, `tuples` stays empty, and the pairwise check
passes having compared nothing. **The corpus's only joint condition is dead for everyone**, independently of
identity. The identity degradation (two members of one claim sharing a path segment, so the second overwrites
the first in `tuples`) sits behind it.

**A3 · `GA-ROSTER-SUM` cannot see asymmetry.** Forced 0 v 12 into A04's realized game: the check **PASSES**
(*"the roster sums to the session count"*) because it is a sum check and 0 + 12 = 12. It cannot see that the
equality which *licensed* the division has been violated.

**But the game is still refused**, and it is worth saying which check saved it: `entailmentsLanded` reports
*"performers.teams[0].outfieldCount was entailed as 6 but the concrete game holds 0"*, and render-eligibility
comes back **NO**. So no wrong game reaches a coach. Two things follow: the invariant is weaker than it looks,
and **the check that caught it is the value-based one** — the same shape A1 is missing.

### B · Can produce a wrong element count

**B1 · Two existential claims on one collection. A01, A02 and A05.**

```
c:blind:PASS-COMBINATION-GATE:PCG-08   shortfall 1   max null
c:restated:GF2:GF2-14.a                shortfall 2   max 2
```

Run against the authorization:

| instantiated | result |
|---|---|
| 2 teams, both on GF2-14.a | refused — *"PCG-08 … is asserted to exist and nothing was instantiated to satisfy it"* |
| 2 teams, one per claim | refused — *"GF2-14.a … still owes 2 member(s), and 1 was instantiated"* |
| **3 teams** | **no team or cardinality objection at all** |

The per-claim maximum counts only that claim's own instantiations, and the collection-level cardinality check
runs *before* instantiation, so nothing sees the third team. `collectionCardinality` cannot cover for it
either: it is restricted to individuated classes and is **empty for `performers.teams[]` corpus-wide**.

**How latent:** A01, A02 and A05 all have `mayRealize: false` (Gate A `NOT_EVALUABLE`), and with that gate
lifted the realization is still refused for five **unrelated** reasons — open lines not chosen. So this cannot
reach a coach today. But the guard that should stop it is silent, and the only things in the way are
unrelated. Same error class as the three Wide Zone channels — *"multiple source rows do not by themselves
entail multiple physical elements"* — and the reason the engine cannot apply that ruling here is the missing
identity: **nothing can say that PCG-08's team and GF2-14.a's teams are the same teams.**

### C · The index, and a correction

**C1 · Per-team values are addressed by index.** `assembly:performers.teams[${memberIndex}]::P2`,
`path: performers.teams[${memberIndex}].${leaf}`, `memberInGame` reading `(bucket)[memberIndex]`, and
`entailmentsLanded` comparing by the same index. Safe today **only because** `deriveRoster` returns unless
equality is authored — so a per-index number is written only where the index cannot matter. **That guard is an
equality requirement, not an identity requirement: the safety is incidental.**

**C2 · Correction: member order is NOT deterministic in the way I claimed.** In my last note I said member
order is stable across runs. **I measured the wrong thing** — what I checked was the order of
`resolved.existential`, which is derived and sorted. For *instantiated members*:

- `grep` for a sort over `instantiations` across `src/` returns **nothing**;
- `realize.ts:452` assigns `memberIndex` from `list.length`, i.e. in the caller's array order;
- for A04 the only thing fixing that order is the array order inside `a04-realization-choices.json`, whose two
  entries are byte-identical;
- and `record.fromDigest` is `resolved.provenance.inputDigest` (`realize.ts:551`) — the *resolved game's*
  digest, so it does not cover realization's own order-dependent decisions.

So two members of one claim have **no content-derived ordering key at all.** This strengthens the finding
rather than weakening it: the index is not merely meaningless, it is not even anchored.

**C3 · `fillableFrom` is dead data — on the row I added.** PS1 carries
`fillableFrom: "performers.teams[]"`, the pointer that would tie the possession choice space to the teams
collection. **No engine code reads `fillableFrom` anywhere.** The prose `fillable` string *is* read, so the
choice space is registered as I said; the structural pointer is inert. Correcting my own last note.

**C4 · Three unrelated spellings of member identity** — `memberKey` as `contractId::itemId` (`engine.ts:97`),
`key(path, i)` in realize, and `realized:${classId}:${i}` in the gate. None general. The signature of a
concept that exists and is unowned. `memberKey` also drops a twin: `String(member)` for anything untyped, so
two identical members both key to `"[object Object]"` and the first wins.

---

## 9 · What the evidence says the smallest addition is — and the one ruling it needs

The handle mechanism exists (`elementId`); the comparison kind that would consume it exists (`COMPARES`) and
is unused. What is missing is a **mint for an element that no item individuates** — derived from the claim
that authorized the member, plus a discriminator.

**The discriminator is his, because two of his rulings meet there:**

> *"'First' and 'second' are implementation artifacts, not authored football meaning."*
> *"An instantiated element may require stable referential identity without that identity carrying domain
> meaning."*

These are compatible only if **minting** is separated from **interpreting**: an ordinal may be an *input* to
minting an opaque handle, provided nothing afterwards can read it, order by it, or recover it — which is what
§5's opacity requirement and §7's permutation test exist to enforce. Note §8's C2 sharpens this: there is no
stable ordinal to mint from today, so this reading requires giving the instantiation order a content-derived
anchor as well.

So the question:

1. **Is an ordinal permissible as an input to minting an opaque handle**, with opacity and the permutation
   test as the guards? Then the addition is small, general and testable, and it uses the canonical mechanism
   rather than creating a team concept.
2. **Or must the derivation contain no ordinal at all?** Then identity cannot be established from the corpus:
   the remaining sources are an authored distinguishing property or an opaque counter, which is an ordinal
   wearing a hat. On that reading **the two teams are genuinely indiscernible and the representation is right
   to refuse to tell them apart** — and asymmetry and possession assignment are blocked on an **authoring**
   decision (what, if anything, distinguishes the two teams).
   **One thing to weigh before choosing it:** that authoring route is not currently open either. Per §1, the
   `team` selector attribute is backed by no FIELD row, so a distinguishing team property would need a register
   row before any item could target it. So reading (2) is an authoring decision **plus** a register addition,
   not an authoring decision alone.

Both coherent. (2) is more conservative and may be right; it would make this an authoring question. Given
C31b's caution that asymmetry must remain establishable, a ruling either way also decides whether a displacing
game form can actually express what it displaces.

Nothing implemented. The touch-trigger decision and the magnitude are untouched, and neither reading affects
either.
