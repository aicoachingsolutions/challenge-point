# Classifying the unestablished lines — evidence before the ruling

29 September 2026. Stage-B conformance corpus. Nothing was authored, no status changed, no gate
semantics touched. Generation remains frozen.

Reproduce: `npm run corpus:unestablished` · `npm run lens:trace` · `npm run corpus:coverage`

---

## 0. A correction to the number

**It is 40, not 43.**

My earlier figure counted lines whose *row* carried a `NOT_AUTHORED` declaration, which swept in the
three internal failures as well. They are separate, and §6 shows they are not implementation defects
either. The knowledge set to classify is 40.

| | |
|---|---|
| unestablished lines on the corpus | 57 |
| an object declares it needs the row and cannot author it | **40** |
| explicitly excluded | 8 |
| only non-claimed — an object looked and does not constrain the row | 4 |
| no declaration reaches the row at all | 2 |
| internal (`UNRESOLVED`) | 3 |

---

## 1. The answer to the question you actually asked

**The 40 collapse into five patterns, and two of them — 22 lines, 55% — are not missing knowledge.**

| # | pattern | lines | what it is |
|---|---|---:|---|
| 1 | transition qualifiers demanded of a transition whose trigger has none | **9** | an applicability rule that already exists for neighbouring rows and does not cover these |
| 2 | placement on rows the register already marks `fillable` | **13** | a realization freedom, typed as a failure |
| 3 | Information Expression dimensions | **9** | genuine unauthored knowledge |
| 4 | restart procedure for the one stop-resume transition | **3** | genuine unauthored knowledge |
| 5 | remainder — six singletons | **6** | mixed; see §5 |

19 distinct register rows carry the 40 lines, and 36 distinct "cannot author" statements sit behind
them — but the statements repeat structurally, which is what patterns 1 and 2 capture.

---

## 2. Pattern 1 — nine lines ask a turnover whose end line the ball crossed (9 lines)

The corpus has four transition elements:

| element | trigger |
|---|---|
| `GF4:I06` | `POSSESSION_CHANGE` |
| `GF2:GF2-07.a` | `POSSESSION_CHANGE` |
| `NEUTRAL-12.a` | `POSSESSION_CHANGE` |
| `A01-02-01.a` | `OUT_END_LINE`, with both qualifiers authored in its own selector |

Every line trace for the three `POSSESSION_CHANGE` transitions is identical:

```
   T1a  ENUMERATED   failed     NOT_AUTHORED    declared gap     qualifiers.lastTouch
   T1b  ENUMERATED   failed     NOT_AUTHORED    declared gap     qualifiers.endLine
   T1c  ENUMERATED   failed     NOT_AUTHORED    declared gap     qualifiers.region
   T2   WITHDRAWN                                                awardedTo
   T3   WITHDRAWN                                                placement.actor
   T4   WITHDRAWN                                                placement.region
   T5   WITHDRAWN                                                placement.method
   T6   ENUMERATED   derived    RESOLVED:ENTAILED                playState = CONTINUE
```

**T2–T5 withdraw correctly on exactly these elements.** The mechanism that recognises an inapplicable
transition property already exists and already works — a `CONTINUE` transition has no restart, so who
restarts and from where are withdrawn, not failed. `T1a`/`T1b`/`T1c` are not covered by it, so a
turnover is asked whose last touch put the ball out, whose end line it crossed, and in which region —
none of which a turnover has.

The knowledge objects say precisely this, in their own words:

> `blind:GF4` — *"No last-touch qualifier is authored."*
> `restated:A01-02` — *"every other out-of-play case is free"*
> `restated:WIDE-ZONE-ADVANTAGE` — *"start and restarts after score, out of play and turnover free"*
> `blind:PASS-COMBINATION-GATE` — *"No transition is authored."*

And the only `NOT_AUTHORED` declaration reaching these rows is `A01-02`'s, which is about **its own
goal kick** — *"The goal-kick trigger's last-touch qualifier … is not authored"* — a transition
`A01-02` in fact resolved. The declaration reaches by **row**, so a gap declared about one element is
charged to every element on that row.

**This is one unresolved rule — which qualifier rows apply to which trigger — not nine knowledge
gaps.** The register already expresses the same idea in prose for the neighbouring rows (`T3`/`T4`/`T5`
carry *"N/A when CONTINUE"* in their `valueType`). Nothing equivalent exists for `T1a`/`T1b`/`T1c`.

Your category: **(f) should arguably not block realization at all.**

---

## 3. Pattern 2 — thirteen lines on rows the register already calls fillable (13 lines)

`S5`, `S6`, `O4`, `O5` — `position.along` and `position.across` for regions and objects.

All four carry a `fillable` entry in the register:

| row | fillable |
|---|---|
| `S5` `space.regions[].position.along` | *"metres and position inside authored bounds"* |
| `S6` `space.regions[].position.across` | *"metres and position inside authored bounds"* |
| `O4` `objects[].position.along` | *"inside authored bounds"* |
| `O5` `objects[].position.across` | *"inside authored bounds"* |

They fail because no object authored a **bound**, and SD-39 makes openness a freedom *within an
already-supported property*. The register agrees: *"a fillable entry states the space; it does not by
itself authorize a choice, and silence never creates one."* So the current behaviour is defensible.

The difficulty is that **no knowledge object authors metric positions, and each says so explicitly**:

> `blind:GF4` — *"Direction needs one goal/target at each end, but the knowledge does not author positions (L08)."*
> `restated:VARIABLE-TARGET-CONDITION` — *"minimum perceivable separation between candidates; no distance, proportion or width rule."*
> `restated:WIDE-ZONE-ADVANTAGE` — *"no scaling rule for width; 'depending on field size' gives no function."*
> `restated:GF2` — *"extent of the target (depth of a zone)."*

Meanwhile `GA-LAYOUT-FEASIBLE` is `NOT_EVALUABLE` — *"a geometric bound is not a constraint this check
can read"* — so layout is already a separate, unbuilt concern.

If these must be authored, every object has to gain a metric vocabulary it currently disclaims. If
they are realization freedoms, they should not block Gate A.

**The unresolved rule: does a `fillable` row with no authored bound constitute an authorized freedom,
or missing knowledge?** One rule, 13 lines.

Your categories: **(d) a legitimate realization freedom currently typed incorrectly**, or **(f)**.

---

## 4. Patterns 3 and 4 — the genuine gaps (12 lines)

**Pattern 3 — Information Expression dimensions, 9 lines.** `V18`–`V22` across two objects. These
name specific unreconciled sources rather than general absence:

> `VARIABLE-TARGET-CONDITION` — *"whether EXTERNAL_SIGNAL (coach cue) is admissible; setup guidance and IE-C006/IE-D006 unreconciled."*
> `VARIABLE-TARGET-CONDITION` — *"reveal timing; IE-C006 composes no REVEAL_TIMING (SD-19)."*
> `PASS-COMBINATION-GATE` — *"The trigger type for revealing the count is unauthored: a completed pass (TEAMMATE_ACTION) or the coach's call (EXTERNAL_SIGNAL)."*
> `PASS-COMBINATION-GATE` — *"Reveal timing is unauthored."* · *"Reveal progression is unauthored."* · *"State dependency is unauthored."*

Your category: **(a) a value the object itself should author** — and for the two Variable Target ones,
arguably **(e) genuinely unknown**, since they turn on an unreconciled IE source rather than an
oversight.

**Pattern 4 — the restart procedure, 3 lines.** `T3`/`T4`/`T5` on `A01-02-01.a`, the one `STOP_RESUME`
transition. Required for play and unauthored:

> `restated:RPC-001` — *"notAuthored 5: who restarts."* · *"from where inside the own half."* · *"the restart procedure itself."*
> `restated:A01-02` — *"The exact spot: no goal-area equivalent is authored, and no rule for scaling one to a 40 x 30 m area."*
> `blind:GF4` — *"'chain into immediate live play' hints at one but does not choose (L19)."*

Your category: **(a)** for the actor and method. The *place* is arguably **(d)** — it is a position,
and shares Pattern 2's problem.

---

## 5. Pattern 5 — the six singletons, each a different thing

| line | what the knowledge says | category |
|---|---|---|
| `T1c` on `A01-02-01.a` | *"A region qualifier is not named"* — but `endLine` already says whose line | (f), or Pattern 1 |
| `V5` ×2 | *"whether a neutral may score. **V5 cannot reference a performer group.**"* | **(c) a relationship/composition dependency** — a representation limit, not a gap |
| `V6` | *"no operational test for 'controlled on arrival' (**FREE(b) under SD-15**)"* | **(d)** — the object itself types it as a freedom |
| `V9` | *"no multiplier size or bonus points; **realization parameters null**"* | **(d)** — named as a realization parameter |
| `S3` | *"which of line_crossed or target_zone_entered … **GF2 states no preference**"* | **(d)** — the same row is `FREE(choice)` elsewhere in this run |

Note that four of these six are typed by the authoring object itself as realization-side, one names
`SD-15` explicitly, and one names a representation limit. **Only `V5`'s underlying question — may a
neutral score — is a knowledge question**, and it cannot be recorded because `V5` cannot reference a
performer group.

---

## 6. The three internal failures are one authored issue, not three defects

You asked for these to be corrected separately as implementation defects. They are not implementation
defects, and I should not have called them internal.

All three are the same pair of items from `restated:WIDE-ZONE-ADVANTAGE`, colliding on three different
channel elements:

| item | value | requirement | status | strictness |
|---|---|---|---|---|
| `WIDEZONE-04.a` | `"touchline-adjacent"` | `POSITIONED` | `REQUIRED_RANGE` | `REQUIRED` |
| `WIDEZONE-05.a` | `"touchline-adjacent (outer edge on a touchline)"` | `POSITIONED` | `REQUIRED_RANGE` | `REQUIRED` |

Same selector (`noun=channel`), same row (`S6`), both required. They collide by **string inequality**.
The second is plainly a *refinement* of the first, not a contradiction — but the engine cannot know
that without interpreting prose, which SD-15 forbids. SD-02 is behaving exactly as written.

So this is one restatement issue: the same placement stated twice, once with a parenthetical gloss, as
two `REQUIRED` items rather than one. The correction belongs in the restatement. **And note it sits on
`S6` — a Pattern 2 row.** Placement is the single most troubled area in the corpus: 13 lines
unauthored on fillable rows, plus the one place an object did try to author placement and contradicted
itself.

---

## 7. Reason codes — a proposed treatment that changes no blocking behaviour

`AM-23` has three codes; the declaration vocabulary has five. In `reasonFor`, `NON_CLAIMED` has no
case and falls to `coverage`, and `EXCLUDED` is tested *after* `UNDECLARED`, so a silence outranks an
explicit exclusion. **11 of 57 lines report "nobody looked" when an object did look.**

Proposed mapping — one code per declaration, and a precedence in which a statement always outranks a
silence:

| precedence | declaration reaching the row | proposed code | meaning |
|---:|---|---|---|
| 1 | `NOT_AUTHORED` | `declared gap` | an object needs this and cannot author it |
| 2 | `EXCLUDED` | `excluded` | an object states this must not be established |
| 3 | `NON_CLAIMED` | `not constrained` | an object looked and imposes no requirement |
| 4 | `CLAIMED` only, line still failed | `claimed but unresolved` | something claims the row and no value survived |
| 5 | `UNDECLARED` | `coverage` | an object looked and said nothing |
| 6 | nothing reaches the row | `no coverage` | nobody looked |

Rationale for the order: `NOT_AUTHORED` stays first because a stated need is the strongest claim on
the row. `EXCLUDED` rises above `UNDECLARED` so that an explicit exclusion is never reported as
though nobody considered the property. `NON_CLAIMED` gets its own code so a non-claim is never
represented as missing authorship by that object. `coverage` narrows to what it actually means, and a
row nothing reaches is distinguished from a row an object declined to speak on.

**This changes no verdict and no blocking behaviour** — every line that fails today still fails, with
the same `NOT_AUTHORED` verdict. Only the reported reason changes. Whether `not constrained` or
`excluded` should stop blocking realization is the separate decision you reserved.

Pending that ruling, `NotEstablished.declared` already carries the full reaching set, so nothing is
lost in the meantime.

---

## 8. Affordance lenses, re-run against your broader test

Your refinement changes the answer substantially, and my earlier figure overstated the problem.

| | narrow test (constraints only) | **your broader test** |
|---|---:|---:|
| causally realized by selected structural knowledge | 20 of 39 | **33 of 39** |
| selected but causally unrealized | 19 of 39 | **0** |
| cannot currently be determined | — | **6** |

**17 lens selections are realized only by the game form** — invisible to the constraint-only test.
You were right not to assume only constraints can realize a lens.

The link is exact, not interpreted: all three libraries already write the same snake_case affordance
key, so a lens's `category` normalises to what a constraint writes in `targetAffordancePrimary` and a
game form writes in `primaryAffordances`.

**The six undetermined cases are all the same defect — the vocabularies have drifted.** A game form
holds `fast_attack` and `regain`; lenses produce `attack_quickly` and `regain_possession`. Reporting
those as unrealized would assert that `fast_attack` is not `attack_quickly`, which is a semantic
claim this measurement is not entitled to make in either direction.

Coverage of the linking vocabulary itself, which is the real selection-integrity finding:

| affordance a lens asks for | any constraint can name it | any game form can name it |
|---|---|---|
| `attack_quickly` | yes | **no** |
| `finish` | **no** | yes |
| `maintain_possession` | **no** | yes |
| `protect_space` | **no** | yes |
| `regain_possession` | yes | **no** |
| `break_lines`, `create_space`, `delay_or_deny`, `recover_shape` | yes | yes |

Five of nine affordances cannot be named by one of the two libraries. An affordance no object can
name is one no selection could ever realize — so the invariant, as written, would fail for reasons
that have nothing to do with selection quality.

**Recommendation:** adopt the invariant, but reconcile the three vocabularies to one closed list
first. Otherwise it measures vocabulary drift rather than causal integrity.

**Practice Situations cannot participate at all**: the record carries `ID`, `Parent ID`,
`Display Order`, `Practice Situation` and a prose `Definition` — no affordance or design-intent field
in which a causal contribution could be recorded.

---

## 9. Variable Target

**`FIRST_FORWARD_PASS` — done.** Added to the trigger vocabulary (v1 → v2) with the accepted boundary
recorded beside it in the register. Regression evidence: unregistered triggers **3 → 2**, and a test
asserts exactly two remain, so neither held member can be quietly admitted later.

**`REGION_ENTRY {attacking half} + first receiver` — recorded as presently unrepresentable.** It
stays in the permitted set as evidence. No compound trigger, no performer-role vocabulary.

**`VARTARGET-08.a` — the ownership trace only, as asked.**

| row | kind | `ownerRow` | `selectorAttributes` | path |
|---|---|---|---|---|
| `J1` | COLLECTION | — | `role`, `team` | `objectives[]` |
| `J2`, `J3`, `J4` | FIELD | **`J1`** | — | `objectives[].…` |
| `J5` | COLLECTION | — | `scope` | `objectiveSets[]` |
| `J6`–`J10`, `J12` | FIELD | **`J5`** | — | `objectiveSets[].…` |
| `J11a` | COLLECTION | — | `on` | `objectiveSets[].assignmentRule[on]` |
| `J11b` | FIELD | **`J5`** | — | `objectiveSets[].assignmentRule[on].yields` |

Every other FIELD owns its immediate collection. `J11b` is the only one that points past its
immediate collection to the grandparent. `J11a`/`J11b` are also the only rows in the register with a
`[selector]` segment mid-path, so this is a one-off shape.

Two observed consequences, stated without a recommendation:

1. a class individuated on `J11a` produces **zero lines**, because no FIELD row resolves to it —
   which is why `VARTARGET-08.a` exists as an element and can carry no value;
2. under the register's own `ownerRowNote`, a selector on `J11b` is validated against `J5`'s
   `selectorAttributes` (`scope`) rather than `J11a`'s (`on`) — so an item writing a `yields` keyed
   by trigger would have its selector refused as unnormalisable under SD-32.

`J11a`/`J11b` entered in `3fecfbf`, *"Apply stage A's reading rules before restating any contract"*.

**Neutral count — provenance, and the answer is no.** Both bounds come from the same object, from two
items with **different statuses**:

| item | value | requirement | valueStatus | strictness |
|---|---|---|---|---|
| `NEUTRAL-01.a` | `">= 1 (no authored maximum)"` | `RANGE` | **`REQUIRED_RANGE`** | **`REQUIRED`** |
| `NEUTRAL-02.a` | `"1-2 (one or two)"` | `RANGE` | **`PREFERRED_DEFAULT`** | **`SUPPORTING`** |

Both already carry `requirement: RANGE`, so the requirement kind is quantitative; only the value
*string* defeated parsing and forced the qualitative typing.

So treating them as count bounds is faithful. **Intersecting them to `[1,2]` is not** — it would
convert a preferred default into a required maximum, when the required item says explicitly that
there is *no authored maximum*. The faithful restatement is a required floor of 1 with no ceiling,
plus a preferred default of 1–2. SD-90's displacement machinery already expresses exactly that
relationship, so no new mechanism is needed.

Not converted, per your instruction.

**`COACH_CUE`** remains held. The open-text information-subject issue remains recorded and off the
critical path.

---

## 10. What this means for the question underneath

> *What is the minimum authoritative knowledge a resolved game actually needs before realization can
> faithfully make it concrete?*

On this corpus, on the evidence above: **12 lines of genuinely unauthored knowledge** (Patterns 3 and
4), plus whichever of the six singletons you rule are knowledge rather than realization — realistically
one, the neutral-scoring question behind `V5`.

The other 22 turn on two rules about what a game needs to know, neither of which is about soccer:

1. which qualifier rows apply to which trigger;
2. whether a `fillable` row with no authored bound is an authorized freedom or missing knowledge.

**Nothing has been authored and no status has been changed.** Wide Zone is visible here only because
its collision sits on a Pattern 2 row; it remains parked.
