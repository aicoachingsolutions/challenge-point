# Contract-shape conformance check — result

19 September 2026. Paper only; generation and implementation stay frozen. Christian approved the check
on 18 September, with its boundary:
- an atomic path register;
- the six slice contracts restated on it;
- support derived by hand across the slice game;
- two blind contracts, Pass Combination Gate and GF4 Transition.

He asked for the result to say, primarily, whether the contract grammar is stable enough to begin
implementation design, and secondarily which amendments or knowledge gaps prevent that conclusion.

The protocol and stability test were fixed and committed before any result existed
(`conformance/protocol-2026-09-18.md`). Every artefact is in `docs/audits/conformance/`.

## The answer

**Yes for the data model. Not yet for the derivation engine.**

- **The shape held.** Every item across eight contracts found a place:
  - a register row;
  - a VOCABULARY or KNOWLEDGE entry;
  - or a deliberate place outside the boundary.

  No gap needed a structural change: no new status, relation, source kind or area. Both blind contracts,
  drafted from the grammar alone, declared all 81 rows. The paths, the contract fields, the four
  statuses and the source kinds can be designed now.
- **How support is derived has not settled.** Revision 4 needed 26 reading rules before two readers
  could apply it the same way. The run surfaced about 20 more. Fifteen of those change a verdict on the
  slice, and by his own instruction they come to him before incorporation. Collisions never arose in
  the slice, so the rules for deciding them have no evidence either way. The engine that derives
  support should be designed after his rulings.

**The pre-registered verdict is STABLE WITH LOCAL AMENDMENTS.** All four tests pass (below). Two of his
rulings could reverse it:
1. **The RPC-001 carrier.** If RPC-001 must itself supply the object or zone that carries its chosen
   scoring event, a contract item would need a guard — "applies only when another property has this
   value". That is structural (AM-25).
2. **Derivation rules.** If he counts changes to derivation reading rules as "a change to how support
   is derived", which the grammar's own test files as structural, then the verdict becomes NOT STABLE.
   The same would then hold for the 26 rules added before the run.

Completeness of the knowledge base was not the criterion. No knowledge gap counts against the verdict.

**Both were ruled, and the verdict stands** (20 September).
1. KR-04 settled the carrier: RPC-001 does not own or instantiate it, and no conditional contract
   structure is added. AM-25 is closed.
2. SD-22 settled derivation rules in general, and **SD-29 settles this case in particular**. The
   comparative extension is *"a bounded structural-semantic extension to the contribution/derivation
   grammar, not merely an operational reading rule. The Game Representation data shape remains stable.
   What changed is the grammar's ability to express and evaluate relationships among represented
   properties."*

**That distinction is the point, and it is recorded rather than smoothed over.** Something
structural-semantic did happen — the grammar can now express a relationship between properties, which
it could not before. It happened **inside the contribution and derivation grammar**, and it left the
representation alone: the same eight areas, the same four statuses, the same source kinds, the same
declaration mechanism, and no ninth area. One field was added to an existing collection, a value
modifier's declared operation (SD-24), which is LOCAL by the grammar sheet's own test.

So the data-model stability finding is **not weakened**. It is stated more exactly: *the Game
Representation is stable; the contribution/derivation grammar took a bounded extension.*

## What was run

| Stage | What | Result |
|---|---|---|
| A | Register and grammar reviewed against revision 4 only, without looking at slice items | 16 must-fix ambiguities; they became run conventions RC-11 to RC-36 before any contract was touched |
| B | Six slice contracts restated; the slice game restated as it stands (41 elements, 210 lines); two blind contracts drafted | 178 restated items, 43 blind items, 71 SCHEMA ledger entries |
| C | Coverage and row matching computed by script | Blind contracts 81/81 rows declared. Restated contracts leave 8–16 rows undeclared each: the prose-era originals never examined them (a KNOWLEDGE gap) |
| D | Two independent derivers, each covering all three areas of the game | Same verdict on 208/210 lines (99.0%); same verdict and reason on 204/210; forward results 162/166; kappa 0.983 |
| E | Nine schema verifiers; interpretation clustering; independent disagreement trace; critic; judge | See below |

The blind drafters' transcripts were checked. Each read only the grammar sheet, the register and its
own object's knowledge files. The memory index, which every agent receives automatically, was in their
context. Its one line about this work contains no examples.

## The four tests

| Test | Result | Evidence |
|---|---|---|
| **S1 Holdability** | PASS | Of the 71 SCHEMA entries, adversarial verification found 22 real gaps, all LOCAL. The other 49 were already holdable (33), outside the representation by design (12), KNOWLEDGE (3), or a restatement error (1). All five entries the drafters labelled STRUCTURAL failed review |
| **S2 Mechanical support** | PASS | Two tracers each traced all 10 disagreements; none is left untraced. Seven trace to four gaps in the reading rules. Three are reader errors by one deriver: L94, L157 and VARTARGET-13.d |
| **S3 Coverage** | PASS | Every contract declares every row using the four types. Caveat: coverage is counted per row. An element that no selector-scoped declaration on a declared row reaches is unruled silence (AM-04) |
| **S4 Blind transfer** | PASS | Pass Combination Gate: 0 STRUCTURAL. GF4: the drafter's 4 STRUCTURAL labels all failed review. Its "two goals or two targets" is held by a count plus exclusions, as another contract already does |

## What qualifies the verdict

The critic's challenges, and what the judge made of them:

- **Agreement is real, but partly shared habit.** The worry that agreement was inflated by the many
  NOT_AUTHORED lines fails: on the 88 lines with any other verdict, the derivers agree on 86. But the
  derivers recorded 136 points where the rules did not settle a case. These cluster into 19 distinct
  gaps, and on 12 of them both derivers happened to choose the same way. Each deriver also switched
  readings between areas.
- **Both derivers made one identical mistake** (L67/L72). It came from the way I split the game into
  areas for them (below).
- **No collision arose.** SD-02, RC-27 and relationship rules therefore have no agreement evidence.
- **The blind sample is thin.** Together the two blind contracts claim or exclude 28 of the 81 rows,
  hold 19 support-capable items, and were never derived.
- **Some restatement errors decide lines,** and nothing was re-derived after they were found: the whole
  area restated as a region (#55), neutrals encoded as consequences (#61), and an invented transition
  folded in (#66).
- **The reading rules have not converged:** 26 before the run and about 20 found in it. That is the
  reason for "not yet for the derivation engine".

## Amendments

### Change a slice verdict, so they come to Christian before incorporation

| Id | What it settles |
|---|---|
| AM-01 | How a team designation such as "the build-out team" matches a named team on a row with no trigger. This caused 3 of the 10 disagreements |
| AM-02 | That an objective set's own member objectives fall in its per-set scope |
| AM-03 | When an unsupported stated value is INVENTED rather than NOT_AUTHORED |
| AM-04 | Whether an element no declaration reaches is silence, undeclared, or a drafting error |
| AM-05 | Which elements a minimum count entails when more match than the minimum. It splits otherwise symmetric Team A / Team B lines |
| AM-06 | Forward results when an element matches but its value is absent |
| AM-07 | Views, stated absences and empty collections need no support line |
| AM-08 | A value the game leaves unstated but a source entails is ENTAILED; the omission is reported forward |
| AM-09 | Only an item that constrains a value counts against a default or a free choice |
| AM-10 | A position choice inside assumed bounds is a legitimate choice |
| AM-11 | A set marked "each" is conjunctive; an unmarked set is alternatives |
| AM-12 | Selectors are rewritten over registered attributes before derivation; anything left in words matches nothing |
| AM-13 | Own-involvement scope, made non-circular |
| AM-14 | "Continuing play" keys on the stated value |
| AM-15 | Triggers split by qualifier exist by construction |

### LOCAL, and change no slice verdict

| Id | Amendment |
|---|---|
| AM-16 | A requirement kind comparing one element with another, such as equal team sizes, or combined channel widths within the area width |
| AM-17 | Selector attributes: a region's lateral position and touchline side; a modifier's referents |
| AM-18 | A scoring reference may be a performer role (target player) |
| AM-19 | A complement operator for selectors |
| AM-20 | A Performers row for rules on what players may do (touch limits, banned receivers) |
| AM-21 | Optional trigger-keyed fields: a condition's reset triggers; a window's end trigger; per-episode caps; a modifier's condition value; restrictions on others at a restart |
| AM-22 | "Longitudinal" and "lateral" as relative terms, for which way an element runs |
| AM-23 | A fixed order of NOT_AUTHORED reason codes |
| AM-24 | Housekeeping |
| AM-26 | Latent, adopted only when needed: area shape, and cross-row alternative groups |

### Christian's call, with no grammar change proposed

| Id | Question |
|---|---|
| AM-25 | Whether RPC-001 must supply its own scoring carrier. A verifier's proposed fix (supporting items on every possible carrier) is **not** adopted, because it would support carriers the game does not use. Today the carrier comes from other objects: RPC-001 narrows the event among those physically available (RR-01), and Gate A requires the chosen reference to resolve. Requiring RPC-001 to supply it would need a guard, which is structural |

## Run conventions

All 36 conventions were used. For 26 of them, the alternative reading would change at least one verdict.
Five would change none, and for five it is unclear. The full per-convention table is in
`conformance/stage-e/judgement.json`.

The ones that most shape the slice's verdicts are:
- **RC-8:** the list of what a free choice may fill is exhaustive.
- **RC-10 and SD-21:** where authored knowledge lives, and engine wording is never a source.
- **RC-9:** an unauthored start or post-score procedure is NOT_AUTHORED.
- **RC-13:** a declaration reaches by selector, not by its note.

## Coach-rule and engine sentences the check depended on

As Christian asked, only those the check actually relied on. For later classification as ratify,
standing decision or retire:

| Sentence | Where | Carries |
|---|---|---|
| "Mark a line across the pitch beyond the first defenders." | `COACH_RULES` RPC-001 line_crossed setup | RPC-001-04 (defensive start placement), RPC-001-09 |
| "Earn a point when a player dribbles over the line, or receives the ball past it and controls it." (the same rule also carries "A long kick that lands past the line does not count.") | `COACH_RULES` RPC-001 line_crossed rule | RPC-001-20; the only source of the term "long kick" (SD-15) |
| "Mark a target zone beyond the first defenders." | `COACH_RULES` target_zone_entered setup | RPC-001-09 |
| "Set out gates of two cones beyond the first defenders." | `COACH_RULES` gate setup | RPC-001-09 |
| "Place a target player beyond the first defenders." | `COACH_RULES` target_player setup | RPC-001-05 |
| "Start each attack from your goalkeeper or a restart in your own half." | `BUILD_OUT_START` | RPC-001-06, RPC-001-16 (the turnover stop) |

Also relied on, all non-knowledge engine wording:
- two lines of the practice-situation prompt;
- a code comment ("A GOAL KICK IS A RESTART, NOT A FINISHING PROBLEM.");
- two unit tests ("a goal kick is not a goal");
- one incentive template.

**"Beyond the first defenders" appears in no knowledge workbook.** It exists only in these coach-rule
sentences.

## What the slice game looks like under revision 4

These are findings about the game, not about the grammar. Of the 210 lines, both derivers agreed on 208:

| Verdict | Lines |
|---|---|
| ENTAILED | 58 |
| Legitimate free choice | 3 |
| FREE (b) — "long kick", "controlled on arrival" | 2 |
| NOT_AUTHORED | 122 |
| INVENTED | 23 |

About 69% of lines block, so the slice game could not be rendered.

**INVENTED:**
- the turnover stop (L157) — SD-20 says play on;
- a build-out reset after every restart — KR-03 says that needs an authored rule;
- own-half start regions — engine wording only;
- the corridor;
- nine artefacts of the game restatement.

**NOT_AUTHORED:**

| Reason | Lines |
|---|---|
| COVERAGE (rows the old contracts never examined) | 48 |
| DECLARED_GAP | 39 |
| Out-of-play restart source missing (PSD-03) | 9 |
| ASSUMED_ONLY | 7 |
| POST_SCORE | 5 |
| ALTERNATIVES | 5 |
| START_PROCEDURE | 4 |
| ENGINE_ONLY | 4 |

## My errors in this check

- **My own trace said none of the ten disagreements was a reader error.** The independent tracer showed
  three were — rules as written settle L94, L157 and VARTARGET-13.d. The judge sided with the tracer.
- **I split the game into three areas for the derivers.** That caused their one shared error: area 1
  assumed a set's existence that area 2 found unauthored, at L67/L72. It also hid the value-rule items
  that could have made SD-20 yield at L157. Derivation should not be split by area where rules cross
  areas.
- **My stage C script counts coverage per row, not per element** (AM-04).
- **I did not re-derive after the game-restatement errors were found** (#55, #61, #66).

## The next step I recommend

Christian rules on:
- AM-01 to AM-15;
- AM-25 (the carrier);
- whether derivation reading rules count as structural;
- the six sentences above, if he is ready.

**Then implementation design can begin with the data model**: the register as schema, contract storage
and loading (which must fail closed), statuses, and the seam in the generation path. The derivation
engine follows once the rulings are in. One targeted gap should be closed before the engine is built:
**no collision was ever exercised.** A small paper run on a pair known to collide — central weighting
against Wide Zone — would give the collision rules their first evidence.
