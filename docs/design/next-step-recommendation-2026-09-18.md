# The smallest next step toward implementation design — recommendation

18 September 2026. Paper only; implementation and generation stay frozen. Christian asked:

> "your recommendation for the smallest next step required to move from the paper specification toward
> implementation design, including whether any remaining open item actually blocks that move versus
> being safely deferred as a knowledge-authoring gap."

It rests on:
- revision 3 of the specification (`game-representation-spec-2026-09-18.md`);
- three independent proposals, each from a different starting point (the runtime, the knowledge, the
  risk to the schema);
- a judge who chose between them;
- two measurements of today's knowledge and runtime (§4).

The measurements' load-bearing counts were re-checked by hand.

## 1. The recommendation

**A contract-shape conformance check, on paper.** Before anyone designs a data model, loader or
reconciler, prove that revision 3's contract and support grammar can hold the evidence it was built from
and two objects it has never seen.

**Why this, and why first:**
- Implementation design would build directly on two mechanisms: §3's derivation of support (an exact
  field-path match plus a closed comparison) and §6's mandatory non-claim coverage. Neither has ever
  been run.
- The slice file shows they cannot run as written. **None of its 113 items carries a registered field
  path.** Their "field" entries are free text: a minority already read as revision 3 paths, most mix a
  path with prose or use names revision 3 dropped.
- **Twelve use comparison kinds revision 3 does not have:** `CHANGES_ON` (8) and `NOT_DOMINANT` (4).
  `ORIENTED` and `NOT_EXISTS` are given no support relation.
- **57 carry no value status** ("not-a-value").

A data model designed on a grammar that cannot yet hold its own evidence would be redesigned later, and
so would every contract authored against it.

**It is also what Christian's vocabulary review waits for.** He asked that the vocabularies be reviewed
"once the schema is stable". This step is what establishes that the schema is stable, and it ends with
a stated test for it.

**The deliverable** is one paper audit in three parts:
1. **A register of atomic field paths.** Every atomic field path in revision 3, numbered. These are the
   keys that support and non-claim coverage match on, and nothing lists them today.
2. **The slice restated.** The six slice contracts (113 items, 109 non-claims, 49 declared gaps)
   restated on those paths, each item with scope, basis, checkability and a value status. Support is
   worked out by hand for every property of the slice's resolved game, and every verdict that differs
   from the slice's Gate B is explained.
3. **Two blind contracts,** for objects the slice never used, drafted by someone who has not read the
   specification's worked examples:
   - **Pass Combination Gate:** a pass count that resets, with a coach-adjustable "4–6". It was selected
     in 42 captured activities.
   - **GF4 Transition:** play continues on a turnover. It was reached by 8 of 33 guided inputs in a
     read-only replay of the deterministic selection chain made for this recommendation. That figure is
     not recorded in the repository and was not re-checked by hand; routing allows at most 10.

It ends with a ledger classing every item the schema cannot hold:

| Class | Meaning | What happens |
|---|---|---|
| SCHEMA | No home or shape for it | Amend the specification; Christian rules |
| VOCABULARY | A draft closed list lacks the value | Logged for the SD-18 review, not added |
| KNOWLEDGE | Not authored | Left as `NOT_AUTHORED` |

It also produces a short list of questions for Christian, holding only those whose answer changes a
verdict.

**Done when:**
- every item and non-claim sits on a listed path with a comparison kind, or is logged with its class;
- every property of the slice game has worked-out support, or a status with its reason;
- both blind contracts pass a mechanical coverage check;
- every SCHEMA failure has a proposed amendment;
- Christian has ruled on the amendments and stated the test for "schema stable".

**Who:**
- **Joe** decides whether to run it. The restatement is mechanical and suits a Codex brief, with Claude
  auditing. The blind contracts need a drafter new to the specification.
- **Christian** confirms the two blind objects before work starts, then rules on the results.
- **Accepting the audit does not lift the freeze.**

**Explicitly not included:**
- the runtime seam map;
- types, loader, reconciler or renderer design;
- contracts for the other objects;
- where contracts live or how they are ratified;
- vocabulary additions;
- values for Variable Target, the Wide Zone multiplier, Turnover Reward or the Counterattack window;
- generation, gate runs, or knowledge or code edits;
- the three-activity variation policy.

## 2. What blocks, and what can safely be deferred

| Open item | Class | Why |
|---|---|---|
| **Revision 3's contract and support grammar is untested:** no field-path register; 12 slice items use comparison kinds it lacks | **Blocks design** | The data model, loader and reconciler would all be built on it. The recommended step resolves it |
| **Specification proposals P-1 to P-11** (revision 3 §10): start method, unauthored starts and restarts, RPC-001-11's split, the free-choice list, status for knowledge outside the boundary, owner rulings as a basis, which ids are citable, engine wording as a source, when defaults yield, draft vocabularies, a second Variable Target set | **Needs a ruling before design, asked through the step** | Each changes what the data model encodes. The step marks which ones change a verdict and asks only those |
| **Starts and restarts:** all 11 Game Forms leave one unauthored (§4) | **Blocks build, not design** | The schema can hold either answer: a standing decision (PSD-01 to PSD-04) or Game Form authoring. But a build today would render almost nothing |
| **Engine wording standing in for knowledge:** `BUILD_OUT_START`, the exchange rules, `COACH_RULES`, `COUNTDOWN_SETUP`, the slot modifiers | **Blocks build, not design** | Revision 3 proposes that engine wording is never a source (P-8), pending Christian. The design can be drawn either way, because the source kinds already name where authored knowledge comes from. Before build, each code-held rule is either authored as knowledge or retired |
| **Contracts for the remaining objects:** about 69 can put structure into a session; 6 have contracts | **Blocks build, not design** | Design needs only the six as its worked example. Authoring the rest before the schema is stable risks rewriting them |
| **Closed-vocabulary contents** | **Blocks build, not design** | Design needs only that each list is closed, versioned data. Shipping unreviewed drafts would misfile legitimate knowledge |
| **Emphasis and slot templates' role in variation** | **Blocks build, not design** | SD-17 fixes the route. But the causal audit found the slot template one of only two selections that reliably changed play, and once the model can no longer invent layout the three activities may converge |
| Variable Target's questions | Deferrable: authoring gap | Every property has a field with a visible status; only Variable Target games are blocked |
| C2, the Wide Zone multiplier magnitude | Deferrable: authoring gap | The field exists and is required; only games carrying the multiplier are blocked |
| Turnover Reward's missing consequence | Deferrable: authoring gap | `consequences[]` has typed effects; only games selecting it are blocked |
| Counterattack's time window | Deferrable: authoring gap | Its start is engine wording (SD-R1, P-8). Its 6–10 s is GF11's authored example, which the engine applies to Counterattack. Only Counterattack games are blocked, and the question is parked at Christian's request |
| Game Form restart × From Goal Kicks | Deferrable: authoring gap | In atomic terms the slice found the rules orthogonal; any real clash is `UNRESOLVED` under SD-02 until a relationship rule is authored |
| Central weighting × Wide Zone Advantage | Deferrable: authoring gap | The weighting is engine text, not knowledge; under SD-17 it enters only by contract, and the overlap rule then decides it |
| C4, neutral affiliation, reopened | Deferrable; tested by the step | Its premise (turnovers stop play) rested on engine wording. GF4 in the step tests whether `POSSESSION_CHANGE` is structural when play continues |
| KR-02 with SD-14 under RPC-001 | Deferrable; a question for Christian (P-3) | Under today's routing RPC-001 never meets GF4 or GF8; the question is which episodes RPC-001's build-out requirement covers |
| EM family-ID provenance | Deferrable | Contracts key on object ids; decision 6 binds neither id set |
| The three wording issues | Deferrable | Existing decisions already neutralize all three; none produces a blocking status |
| SD-10's source | Deferrable | A one-line confirmation; only one retention check depends on it |
| The four accepted Gate A corrections | Deferrable | They correct procedures that read text. They matter only if reused for render fidelity, and then before any held-out run |
| The held-out Gate A corpus | Deferrable | Needs generation, which is frozen. It becomes calibration for render fidelity, before render fidelity is allowed to block |
| Where contracts live, and who ratifies them | Deferrable into design | Implementation design answers it. Whatever the answer, the loader must fail closed (§4) |

**Net:**
- **One thing blocks design outright:** the untested grammar, which the recommended step exists to
  remove.
- **The rulings that must precede design:** only those proposals whose answer changes a verdict. The
  step identifies them and asks only those.
- **Five things block building.**
- **None of the knowledge-authoring gaps blocks design or the build of the mechanism.** Each blocks
  only the games that select its object.

This classification is itself a proposal for Christian, not a settled status.

## 3. Alternatives considered

| Alternative | Why not first |
|---|---|
| **A runtime seam map**: stage map, target pipeline, a disposition for every code-held writer of structure, and a slice trace | The seam is already located (below). Most of the map is implementation design itself, and its disposition table needs Christian's ruling on engine wording. Drawn now, it would rest on the untested grammar. It is the right first chapter of implementation design once the schema is stable, and the risk-first proposer argued it could run alongside |
| **A contract authoring protocol**: field-path register, admissible sources, the six contracts rewritten, a coverage plan for ~69 objects, and storage and ratification questions | It bundles five deliverables. Its core (the register and the six restatements) is grafted in. Ranking 69 objects before the schema is stable invites rewriting contracts later |
| **A full schema probe**: five blind objects, a held-back sixth, and an amend-and-rerun loop | Its core is adopted, cut to two blind objects that test what the slice never did. The rerun loop is a second step, not the smallest one |
| **Correct revision 3 and send it back without a test** | Done, but it is a precondition, not a move toward design. The grammar would stay unexercised |
| **Run the held-out corpus, or start authoring contracts** | The first needs generation, which is frozen, and tests text procedures the design replaces. The second risks rewriting ~1,100 items |

## 4. What was measured

**Starts and restarts** (re-checked by hand):
- `restart_structure_type` is empty for all 11 Game Forms in the Soccer Module.
- No Game Form authors a start method (kickoff, serve, goalkeeper in hand).
- Four give only where play starts, or the starting state: GF2 (building from its own end), GF8, GF9
  and GF11.
- None distinguishes touchline from end-line restarts. GF2 names only who restarts ("ball out of play
  restarts from the team that didn't touch it last"); GF4 says only that the ball going out stops play.
- None authors who restarts after a score (GF6 at most by reading).
- Two author turnovers: GF4 ("no stoppage on turnover unless ball is out of play") and GF8.
- Elsewhere in knowledge:
  - RPC-001, From Goal Kicks and Disguised Restart can fill a START.
  - Transition Trigger, the RPC-006 and RPC-007 behaviour adjustments ("Preserve immediate live
    transition rather than resetting play") and Counter-Press Window's expiry clause speak to turnovers.
  - **Nothing authors how a touchline restart is taken, or who restarts after a score.**
- Today these gaps are filled by the model, because the generation prompt demands "how play begins, and
  how it restarts after a score or a ball out of play". Engine exchange rules also keep play live on
  turnovers for every archetype, most with the literal "no reset".

**Engine wording cited as knowledge** (re-checked by hand, after the final check caught my undercount):
- Ten of the slice's 113 items rest only on sentences held in code, prompts or unit tests. Six of them
  are REQUIRED.
- **The six REQUIRED:**
  - RPC-001-04 and RPC-001-09, which place the scoring line, zone or gates "beyond the first defenders"
    (`COACH_RULES`);
  - RPC-001-06 and RPC-001-16 (`BUILD_OUT_START`, "Start each attack from your goalkeeper or a
    restart in your own half.");
  - A01-02-02;
  - A01-02-03.
- **The other four:** RPC-001-05, RPC-001-20, A01-02-06 and A01-02-12.
- The slice's rule that turnovers stop play cited RPC-001-16 and the authored RPC-001-17. But
  RPC-001-17 requires only that losing the ball ends the episode, so the stoppage itself rests on engine
  wording.
- Whether `COACH_RULES` counts as authored is exactly P-8. primary-scoring.ts is ambiguous: it treats
  coach wording as the one exception to "nothing below is authored football knowledge", yet lists
  `COACH_RULES` under "why none of it is knowledge".
- Either way, the slice treated these sentences as knowledge without asking. That is a support-principle
  failure in the slice itself, and nobody caught it at the time, including me.

**Contract load** (medium confidence):
- Five knowledge layers can put structure into one activity: 11 Game Forms, 23 realizations, 8
  contexts, 20 Practice Situations, and 7 reachable slot modifiers. That is about 69 objects, 63 on the
  guided path.
- A guided activity carries up to 9 structure-bearing objects. This is derived from the selection and
  package shape, and was typically 7–8 in the read-only replay.
- Six have contracts. At the slice's rate, the rest imply roughly 1,070–1,180 more items. The slice
  sample was deliberately hostile, so the estimate is rough.
- No contract-shaped structure exists anywhere in the knowledge. The nearest shapes are the RPC
  library's identity rules (REQUIRED, SUPPORTING_IDENTITY, EXCLUSION) and the Game Archetype library's
  domain-keyed CONSTITUTIVE and CONTRADICTORY rows. They are prose, or unconsumed by the runtime.
- The Soccer Module has parameter, range and restart columns that are empty in every row. **The
  adapter's allowlist maps none of them, so anything authored there today would be dropped silently.**
  Any contract loader must fail closed.

**Where the game would sit in the runtime.**
- Coach-facing text is first written at primary-scoring resolution, before any game exists.
- So the resolved game would be built and gated after selection and the scoring-event choice, before
  the constraint package (between app.routes.ts:913 and :964).
- The scoring sentence lookup would move to rendering.
- The steps after the model that add or remove structure would stop doing so.
- One current step already conflicts with SD-17: compression keeps slot-modifier lines as must-keep
  text.

## 5. Risks

- **Zero renderable games.** Until starts and restarts are authored or given standing decisions, a
  correct build renders nothing. This is the runtime read's strongest argument against the approach —
  "a system that can prove a game is coherent but cannot produce one" — and it should be decided now,
  not discovered at build time.
- **Drift back in-sample.** Christian fixes the two blind objects before work starts, and someone new to
  the specification drafts them.
- **Two blind objects are thin.** A "stable" verdict on eight objects is provisional, and the exit test
  should say so.
- **Amendment creep.** Patching the schema after each finding refits it to the sample. VOCABULARY misses
  are logged, not added.
- **The slice game will change.** With engine wording excluded, the turnover rule loses its support and
  C4 reopens. These are findings, to be reported as findings.
- **Authoring volume** (~1,100 items) and **silent loss** at load are build risks; the design must plan
  for both.
