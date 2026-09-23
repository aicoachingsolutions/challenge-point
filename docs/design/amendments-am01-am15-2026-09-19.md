# AM-01 to AM-15 — the actual proposed rules, for Christian's ruling

19 September 2026. Paper only. Each row: the ambiguity observed in the conformance check, the proposed
deterministic rule, a concrete example whose verdict changes, and my classification under Christian's
19 September distinction:

- **Structural-semantic:** changes the contract grammar, declaration statuses, source kinds, the eight
  areas, the relationship model, or the meaning of support.
- **Operational:** makes an already-defined relationship deterministic, without changing what can be
  represented or what support means.

Line ids (L5, L79, …) are lines of the restated RPC-001 slice game, in
`docs/audits/conformance/stage-b/game.json`; the two derivers' verdicts are in
`stage-d/derivations.json`.

**Nothing here is adopted.** Where I recommend one option among several, I say so.

---

## AM-01 — A team designation on a row with no trigger

**Ambiguity observed.** A selector such as `[team=BUILD_OUT_TEAM]` sits on rows that are not keyed by a
trigger (a team's goalkeeper, an objective's attacking team), while the game states `TEAM_A` and
`TEAM_B`. The derivers read this three ways, and each switched between areas: match both teams, match
none, match the starting team only.

**Proposed rule.**
- In a selector, a context designation is met by each team that the game's own stated transitions make
  that designation at some trigger. `BUILD_OUT_TEAM` is the team awarded the START placement (KR-03
  scopes RPC-001 to the build-out episode).
- In a value, designations compare as canonical entries: two are equal only if they are the same entry.
  A game value written as "the team defending that end (= NOT_LAST_TOUCH)" counts as that entry.
- An item that must bind one episode carries an episode scope rather than relying on the designation.

**Example whose verdict changes.** L79, the attacking team of Team A's northern target zone. Deriver A
gave NOT_AUTHORED, deriver B gave RESOLVED:ENTAILED through RPC-001-11.a. Under the rule it is
ENTAILED. Forward results RPC-001-08.c and RPC-001-11.a move from UNMET to SATISFIED. Two lines the
derivers already agreed on, L40 and L43 (each team's goalkeeper), also rest on this reading.

**Classification.** Operational. It fixes how an existing selector value matches; it adds no field and
changes no status.

---

## AM-02 — What falls inside a per-objective-set scope

**Ambiguity observed.** The scope rule defines a set's unit by what its objectives reference. It does
not say whether the set's own member objectives are themselves in the unit. Read strictly, Variable
Target's per-set item reaches no objective at all.

**Proposed rule.** A per-objective-set unit contains the set's member objectives and every element they
reference.

**Example whose verdict changes.** L81, the existence of Team A's southern target zone as an objective.
Both derivers read the unit this way without a rule and gave RESOLVED:ENTAILED. Read strictly, the item
reaches nothing and L81 becomes INVENTED.

**Classification.** Operational. Scope membership, no new field.

---

## AM-03 — When an unsupported stated value is invented rather than unauthored

**Ambiguity observed.** The rules say which applies for a free choice and for assumed items, and are
silent elsewhere: for non-fillable rows, for an element that no declaration reaches, and for a value
contradicted by an entailing source whose only evidence is engine wording.

**Proposed rule,** in order:
1. INVENTED if an entailing source (an item or a citable standing decision) fixes a different value.
2. Otherwise NOT_AUTHORED if a NOT_AUTHORED or UNDECLARED declaration reaches that element, or an
   assumed item fixes the value under a reaching declaration.
3. Otherwise INVENTED.

Engine-only evidence names a reason code; it never decides the verdict.

**Example whose verdict changes.** L157, the turnover's play state, which the game states as "play
stops". Deriver A gave INVENTED, deriver B NOT_AUTHORED(ENGINE_ONLY). Under the rule it is INVENTED,
because SD-20 entails CONTINUE.

**Classification.** Operational, and the closest of the fifteen to the line. It decides which failure a
property is reported as; it does not change what counts as support. If you read "which failure" as part
of the meaning of support, call it structural-semantic and I will treat it that way.

---

## AM-04 — An element that no declaration reaches

**Ambiguity observed.** Declarations may carry selectors. Coverage is counted per row, so an element
that no selector-scoped declaration on a declared row reaches is unruled. Both derivers treated it as
silence: neither a bar on a free choice nor a coverage gap.

**Proposed rule — three options:**
- **(a) Silence.** It neither bars a free choice nor counts as a coverage gap. This is what both
  derivers did. A contract check reports it as a drafting warning.
- **(b) Undeclared.** It bars a free choice, and an unsupported value there is NOT_AUTHORED(COVERAGE).
- **(c) Full element coverage.** A contract must declare every element of every row.

I recommend (a), with the warning, because (c) makes contract authoring depend on the game.

**Example whose verdict changes.** L190 to L192, the neutral-affiliation consequence's trigger, effect
and referents. INVENTED under (a), NOT_AUTHORED(COVERAGE) under (b).

**Classification.** (a) and (b) operational. **(c) is structural-semantic:** it changes the declaration
mechanism.

---

## AM-05 — Which elements a minimum count entails

**Ambiguity observed.** A count or range entails its minimum, but not which elements when more match
the selector than the minimum. Both derivers privately chose "the first listed in the game", which
splits otherwise identical lines.

**Proposed rule — two options:**
- **(a) Symmetric.** Every element matching the selector is entailed up to the item's maximum. Beyond
  the maximum, the surplus is excess: a count fill where the row is fillable, otherwise unsupported.
- **(b) Ordered.** The first N in the game's order are entailed, the rest are excess. This is what both
  derivers did.

I recommend (a): it treats symmetric elements alike and needs no ordering convention.

**Example whose verdict changes.** L85 and L89, the existence of each team's primary scoring objective.
Under (b) one is ENTAILED and its twin is not. Under (a) both are judged alike.

**Classification.** Both options operational. A third reading, where an element's existence support
depends on other elements' verdicts, would be structural-semantic; I am not proposing it.

---

## AM-06 — Forward results when the value is absent

**Ambiguity observed.** The forward result list does not say what an item gets when its selector
matches an element that leaves the value unstated, nor how a supporting item fails.

**Proposed rule.**
- A matched element with an absent value: UNMET for a REQUIRED item, SATISFIED (vacuously) for a
  SUPPORTING or EXCLUSION item.
- VIOLATED only where a stated value breaks the item.
- Labels in order: INERT (engine-only or typical-example), NOT_CHECKABLE (outside the boundary),
  CLAUSE_CHECKED (partly structural).
- With no matching element: REQUIRED gives UNMET, a preferred default gives ADAPTED, others SATISFIED.
- Assumed items are checked as bounds.

**Example whose verdict changes.** Forward results VARTARGET-05.b (A: VIOLATED, B: SATISFIED → the rule
gives SATISFIED) and VARTARGET-13.d (A: VIOLATED, B: UNMET → the rule gives UNMET). No line verdict
changes.

**Classification.** Operational. Reporting labels only.

---

## AM-07 — Lines that need no support

**Ambiguity observed.** There is no verdict for a view row, an empty collection, or a stated absence.
Both derivers forced one and said so.

**Proposed rule.** A view row gets no support line at all; items on it are checked in the forward
direction only. A stated absence or an empty collection is RESOLVED:ENTAILED, unless an item requires an
element there (reported UNMET) or a NOT_AUTHORED or UNDECLARED declaration reaches the row.

**Example whose verdict changes.** L111 and L112, the direction view, currently NOT_AUTHORED, become no
line. L44, "no target-player roles", becomes ENTAILED. L210, "no time windows", becomes ENTAILED by
rule rather than as a placeholder.

**Classification.** Operational.

---

## AM-08 — A value the game leaves unstated that a source entails

**Ambiguity observed.** Where the game states nothing but a source fixes the value, it is unsaid
whether the line records the support or the game's omission.

**Proposed rule.** A line's verdict records the support for the property. An unstated value that an
entailing source fixes is RESOLVED:ENTAILED. The omission is reported in the forward list, or as a gate
note where a standing decision supplies it.

**Example whose verdict changes.** L119, whether the start begins an episode: unstated by the game,
entailed by SD-14. Both derivers gave ENTAILED without a rule. L204 is the same case for a Variable
Target information dimension.

**Classification.** Operational.

---

## AM-09 — Which items count against a default or a free choice

**Ambiguity observed.** It is unsaid whether a value-neutral holding — an EXISTS item on a field row, or
an exclusion the game does not breach — counts as "a selection item differing from a standing decision",
or blocks a free choice.

**Proposed rule.** Only an item that constrains the value counts. A field-row EXISTS, or an unbreached
exclusion, neither makes a standing decision yield nor blocks a free choice. A free choice is blocked
only by a NOT_AUTHORED or UNDECLARED declaration reaching the element, or by a bound the value breaks.

**Example whose verdict changes.** L5, the longitudinal axis. It is ENTAILED by SD-11 only because
RPC-001's EXISTS item does not count as differing; on the other reading SD-11 yields and the line loses
its support. The same reading decides L114 (which team starts) and L160 (the scoring event).

**Classification.** Operational.

---

## AM-10 — A position chosen inside assumed bounds

**Ambiguity observed.** A position fill is allowed "inside authored bounds". Where the only bounds are
assumed, it is unsaid whether the fill holds, as it is for counts, which need an authored range.

**Proposed rule.** A position fill holds when every in-scope bound is met, whether authored or assumed.
A count fill still needs an authored count or range.

**Example whose verdict changes.** L25 and L31, the two wide channels' lengths. Both derivers gave
RESOLVED:NARROWED_CHOICE on assumed bounds alone. On the other reading the row is not fillable and both
lines fail.

**Classification.** Operational.

---

## AM-11 — A set value on a row that holds one property per member

**Ambiguity observed.** A set may mean "all of these" or "one of these", and the game may use several
members at once or restate the whole set. The alternatives rule covers only a single chosen member.

**Proposed rule.** On rows holding one property per member, a set the source marks "each" is one EQUALS
per member. An unmarked set is alternatives. A game value that restates the whole set, or uses several
alternatives at once, chooses none of them.

**Example whose verdict changes.** L185 and L186, the wide-zone modifier's two channel referents:
ENTAILED as a conjunctive set, NOT_AUTHORED(ALTERNATIVES) as alternatives. L164 and L165 are the same
case for a scoring condition that names two referents.

**Classification.** Operational. It reads an existing field; it adds none.

---

## AM-12 — Selectors written outside the predicate language

**Ambiguity observed.** Some restated selectors were written in words, or on attributes the register
does not have. Readers then matched them by meaning or not at all, inconsistently.

**Proposed rule.** Before derivation, every selector is rewritten over registered attributes and
operators, and the element ids it denotes are recorded. Closed-list values match exactly. A selector
still written in words, or on an unregistered attribute, matches no element and is reported as a
restatement defect.

**Example whose verdict changes.** From Goal Kicks used `restart=GOAL_KICK`, which the register has no
attribute for. All six of its REQUIRED items are currently UNMET. Under the rule that stays true and is
reported as a defect to fix, rather than passing silently; the proper fix is the new selector attribute
in AM-17.

**Classification.** Operational. It is a procedure, not a change to the grammar.

---

## AM-13 — Own-involvement scope

**Ambiguity observed.** "The elements the same contract entails" is circular for an item that is itself
what entails the element.

**Proposed rule.** Own-involvement covers the elements entailed by the contract's other-scoped items,
fixed before any own-involvement item is applied. An item that entails a collection element may not use
own-involvement; it uses a selector attribute at whole-game scope instead (AM-17).

**Example whose verdict changes.** L21 and L27, the two wide channels' existence, and which items
support them. It also decides whether Variable Target's information exclusion reaches Wide Zone's
standing information rule at L208.

**Classification.** Operational.

---

## AM-14 — Which play state "continuing play" keys on

**Ambiguity observed.** When play continues, the restart fields are not applicable. It is unsaid whether
that keys on the play state the game states, or the one derived from the sources, when the two differ.

**Proposed rule.** It keys on the game's stated play state. Where that stated value is itself
unsupported, the restart fields are still judged.

**Example whose verdict changes.** L153 to L156, the turnover's awarded team and placement. The game
states "play stops", so they are judged, although SD-20 derives CONTINUE. On the other reading they
would not be judged at all.

**Classification.** Operational.

---

## AM-15 — A trigger split into several transitions by qualifier

**Ambiguity observed.** Reachable triggers exist by construction, but not when the game splits one
trigger into several elements by qualifier, such as the ball crossing an end line, split by who touched
it last.

**Proposed rule.** Existence by construction covers every element that partitions a reachable trigger by
qualifier values. The qualifier fields themselves still need support.

**Example whose verdict changes.** L127 and L136, two out-of-end-line transitions split by last touch.
Both derivers gave ENTAILED without a rule; strictly read, neither element exists by construction.

**Classification.** Operational.

---

## Summary

| Id | Classification |
|---|---|
| AM-01, AM-02, AM-06 to AM-15 | Operational |
| AM-03 | Operational; the closest to the line |
| AM-04 | Operational as (a) or (b); **structural-semantic as (c)** |
| AM-05 | Operational either way |

**AM-16 to AM-24 and AM-26** are the local amendments that change no verdict (a requirement kind
comparing elements, selector attributes, a performer action-rules row, optional trigger-keyed fields,
relative terms for orientation, a reason-code order, housekeeping). They are listed in
`docs/audits/conformance-check-2026-09-19.md` and do not need a ruling before the derivation engine is
designed.

**AM-25 is closed** by Christian's ruling of 19 September: RPC-001 does not own or instantiate the
carrier of its scoring event. No conditional contract structure will be added.
