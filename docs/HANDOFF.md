# Handoff — Challenge Point information-expression work

_Originally written 2026-06-17; **CURRENT DIRECTION section updated 2026-07-23** — read that section
first (it supersedes the historical sections below). Then the memory files (auto-loaded: `MEMORY.md` →
`knowledge-core-architecture.md` is the most current), then `docs/`._

---

## Who / how this works (collaboration model)

- **Christian** = soccer coaching domain expert + tester. He runs structured test rounds against a
  preview build and emails findings. He is NOT the operator of this chat.
- **Joe** (`jvachon-coder`, coach@aicoachingsolutions.net) = the operator/developer you talk to. He
  forwards Christian's emails and says when to act.
- **You** implement on the branch, then **draft replies to Christian that Joe sends — sign them "Joe"**
  (not Claude). Joe pastes Christian's messages in; you produce the work + the reply.
- Rhythm: Joe forwards a Christian finding → you investigate against current code → implement the clear
  next step → verify → commit/push → draft the Christian reply. Joe sometimes says "hold" (wait for
  Christian's next round) — then forwards the next finding to re-engage you.

## Critical operational facts (read before doing anything)

1. **All work is on branch `claude/serene-dewdney-c78e18`, in the worktree
   `C:\challenge-point\.claude\worktrees\serene-dewdney-c78e18` — NOT `main`.** `main` is behind; the
   debug tools and the entire Game-Problem/parser pipeline live only on this branch. Run git/npm/edits
   in the worktree path.
2. **Christian tests the Vercel Preview of this branch**, not main. Pushing the branch auto-deploys the
   preview. **Deploy lag is a recurring trap** — several of his findings turned out to be stale builds.
   You cannot see Vercel from here; verify by the deployment's source commit hash against the current
   branch tip — **`git log --oneline -1`**, not a hash written here, since any commit that updates this
   line immediately becomes the new tip. Note the API is a **separate Render deployment** (`challenge-point.onrender.com`,
   set via the front-end's `VITE_API_URL`) — routes are mounted at **`/api/app/...`**, so a bare
   `/api/debug-selection` 404s. Joe handles all merges/deploys; **never mention merges, PRs, or deploys
   in emails to Christian.**
3. **YOU CAN RUN AI GENERATION HERE. This entry used to say you couldn't, and that was false.**
   `back/.env` has held a working `OPENAI_API_KEY` since 2026-05-03. The confusion: `.env` lives in the
   MAIN repo (`C:\challenge-point\back\.env`) and the harness scripts load it with `dotenv/config`,
   which resolves from the **current working directory** — so running from the worktree found nothing
   and reported missing credentials. Copy `.env` into the worktree's `back/` (it is gitignored as of
   the fix below) and generation works.

   **The cost of believing otherwise was a total outage** (2026-08-16): every claim about generated
   output was reasoned from code instead of read from an activity, and a break that one real run would
   have exposed instantly reached Christian. **Generate first. Read the actual activity text. Then
   decide.** The one-shot recipe, which prints what a coach really reads (compression + translation
   applied — `run-local-create-activity-test.ts` does NOT apply them, so its output is NOT the coach
   surface): write a throwaway `src/scripts/_tmp-*.ts` that runs `deriveInputConstraints` →
   `generateSelection` → `systemAssemblyInputFromTestLibrarySelection` → `assembleActivities` →
   `validateGeneratedActivities` → **`compressActivitiesForCoach`**, print, then delete the script.

   Note `back/.env` was NOT gitignored (root `.gitignore` had `*.env.*`, which never matches a bare
   `.env`), so a live API key sat one `git add -A` from a public remote. Fixed; keep it that way.
4. **Verify changes with:** from `back/`: `npx tsc --noEmit -p tsconfig.json` and `npm test` (**32 unit
   suites** as of 2026-08-16; `deriveInputConstraints.unit.ts` is the main routing test — extend it when you
   change routing). Front-end changes: `npx tsc --noEmit` from `front/`. Behaviour-preservation gate for
   engine changes: the selection-pipeline `bestScore` sequence must stay **`70,68,98,119,94,99,86`**
   (**gate v2**, re-baselined 2026-08-05 when the Soccer Module became load-bearing — see MIGRATION
   PROVEN below. The older `68,64,94,115,91,…` sequence is the pre-module baseline and is NO LONGER
   the gate; do not restore it.)
   For behavior checks write a throwaway `src/scripts/_tmp-*.ts` run via
   `npx ts-node --files -r tsconfig-paths/register ./src/scripts/_tmp-x.ts` then delete it. The full
   `npm run test:selection-pipeline` needs `OPENAI_API_KEY=sk-dummy` and spews Mongo logging errors
   (no DB) — grep them out; selection-only rows still work.
5. **The CSV→TS generator (`back/src/system/test-library/generate-data-from-csv.mjs`) is LOSSY — DO NOT
   RUN IT.** It drops `coachVocabulary` / `setupGuidance` / `environmentalRealizations`, and
   `csv/constraints.csv` is already stale (12 of 19 rows). Edit the `.ts` files directly
   (`archetypes.ts`, `constraints.ts`). A cleanup task for this was spawned earlier.
6. **Commits:** end messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Pushing =
   outward-facing (deploys to Christian's env) — Joe has consistently wanted it, but it's reasonable to
   confirm before pushing.
7. **Ingesting a Christian workbook (the standard pattern, 6 done):** copy the `.xlsx` verbatim into
   `back/data/knowledge-core/`, generate a complete JSON projection into
   `back/src/system/knowledge-core/` with python+`openpyxl` (install if missing), write a typed loader
   whose **integrity gate validates against the workbook's own declared expected counts**, add a unit
   suite, wire it into `package.json`'s `test` chain. Gotchas: header row is usually row 0 but the ATM
   workbooks use title/blank/**header row 2**; the ATM Ratings Grid has **two side-by-side tables**
   sharing a `canonical_name` header (extract by column range). Newer workbooks declare `header_row` and
   `one_table_per_sheet` in metadata — trust those. `resolveJsonModule` is enabled in `tsconfig.json`.
8. **Reading Christian's `.docx`:** pandoc is NOT installed and Read can't open `.docx`. Extract via
   python `zipfile` → `word/document.xml` → regex `<w:t...>(.*?)</w:t>` joined per `</w:p>`, written
   **UTF-8 to the scratchpad** (console is cp1252 and dies on arrows/em-dashes), then Read those files.

## Architecture in one breath

Layered, mostly-deterministic pipeline (no AI until assembly):
`deriveInputConstraints` (keyword parser → signal-group candidate POOLS; groups A,B,C,D,E,F_finishing,
F_possession,G_overload,H_transition,I_defensive[protect/recover/delay/press],**K_information**,
Z_fallback) → `generateSelection` (token-overlap picks 1 archetype from the pool, then scores
lenses/constraints; bonuses: +10 target-matches-selected-lens, +6 archetype-affordance, +3
recommended-type, **+12 information-intent**) → assembly (`build-activity-skeleton`,
`build-activity-mechanics`, `completion.service.generateAssemblyPrompt`) → validation →
`compress-activity-output.compressActivitiesForCoach` (coach-facing post-process; this is the prod
coach-output path — `map-activity-to-coach-view.ts` is NOT used in prod, only a test script).
**Key architectural belief:** Game Problems organize; archetypes are structural templates; constraints +
incentives are the PRIMARY shapers of the affordance landscape (not archetypes).

## PILOT APPROVED — Christian green-lit the build (2026-08-13)

Christian is recruiting pilot coaches for the **fall soccer season** and has approved the current
build. The pilot validates generated activities, the planning experience, and one question above all:
**would a coach choose Challenge Point for their next practice?**

### The lesson of this cycle: generate, don't reason
Four "blocking priorities" were assessed by GENERATING REAL ACTIVITIES rather than reading code, and
that changed the priority order. Measured before → after:

| | before | after |
|---|---|---|
| internal library names in coach text | 18/18 | 0/9 |
| truncated `…` text | 18/18 | 0/9 |
| sentences repeated between Rules and Scoring | 5.3 per activity | 0.0 |
| generation failures (Play Through Pressure) | ~1 in 3 | 0 |
| setup similarity between the three activities | one clause apart | 21–28% |

**Two of those were OUR deterministic code, not the model.** Constraint titles were concatenated onto
the front of the field a coach reads first, and Rules/Scoring were each *required* to contain the same
mechanics — the model was correctly doing as told, twice.

**The generation failure was the validator marking its own homework.** Requirements shaped
`"Label (how to satisfy it): signals"` counted their INSTRUCTION words toward the keyword match, so an
activity satisfying the requirement in natural coaching language could fail while one echoing the
instruction's vocabulary passed. Whether a coach got an activity depended on whether the model wrote
the word "scoring".

### KNOWN WEAK, accepted for pilot 1
**Learning Stage does not visibly change activities.** Tested across 3 goals × 3 stages: activities
carry the language IC-001 asks for at their own stage in only **3 of 9** cases — "Building
Understanding" characteristics dominate whatever the coach picked. IC-001 Invariant 4 is not met in
practice. Christian accepted this for pilot 1 as evidence to collect rather than reason about.

The IC-001 tests assert the three DIRECTIVES differ, and they do. They cannot assert the ACTIVITIES
differ, which is what the invariant requires. **That gap is the whole argument for generating.**

### Also weak, recorded not tuned
`Play Through Pressure` differentiates less than other goals (78% setup similarity vs 21–28%). May be
that its constraint package admits fewer environmental shapes — knowledge, not code.

### 2026-08-16 — THE OUTAGE, AND WHAT REAL GENERATION FOUND

Christian reported that **nothing could generate at all**: `output-validation: Generated activity 1
does not include the selected foundation constraint in its constraint summary`. Fixed in `60b469c`;
the output defects that came after it in `0474359`.

**Cause: two of our own deterministic pieces disagreeing.** `aae0ef0` stopped the mapper prepending
the three constraint titles to the coach-facing `constraint` field; the validator still required
them there. Those checks were never semantic — `constraint` is assembled by OUR mapper, so the
validator was asserting a string our own code had just inserted. Trivially true while the mapper
inserted it, trivially false the moment it stopped. Removed rather than satisfied.

**Underneath it, the same leak we thought we'd fixed.** The validator re-added the titles anyway as
`Foundation: … | Shaping: … | Consequence: …`, rendered to coaches at `SessionPage.tsx:488`. Only
the outage kept it off a screen. **A leak fixed in one writer of a field is not fixed until every
writer of that field is checked.**

**Why nothing caught it — the part worth keeping:**
- `run-local-create-activity-test.ts` kept its **own copy of the mapper**, which still prepended the
  titles. Both paths ran the same validator, so the harness passed while production rejected
  everything: *verification was testing a fork of production that no longer existed.*
- The mapper **could not be unit-tested at all** — it lived in `completion.service.ts`, which builds
  an OpenAI client at module load, so importing it needed a key. Now
  `system/activity/map-structured-activity-to-legacy.ts`, pure and importable.
- `assembly-output-contract.unit.ts` now runs mapper + validator **together** on three real
  selections and asserts no internal name reaches the coach field. Confirmed by reintroducing the
  original check: it fails with Christian's exact message.

**Then the first real generation run found what only output can show** (6 activities, 2 goals):
setup repeated verbatim inside Constraint 6/6 → 0; meaningless cue boilerplate 6/6 → 0;
near-duplicate scoring sentences → 0; **activities with no way to score 2/6 → 0**.

That last one: `winCondition` interpolated scoring's first sentence, then compression deleted
scoring sentences duplicating winCondition — **we created the duplicate and deleted the original.**
Fixed at the source. Removing it then exposed that **no dedup pass ever compared a field against
itself** (`removeSelfRepeatingSentences` added). Also 22 archetype mechanic strings were design
specs printed as coach rules ("Numerical or positional overload must be built into the game
structure") — regrammared, keeping their nouns so skeleton validation still matches. Ratchet
lowered 36 → **35** by hand: dropping "Final third" genuinely removed a coupling.

**Still open, deliberately: 2 of 3 activities share identical rules.** Slots 1 and 3 place their
modifiers in scoring, slot 2 places one in rules, so only slot 2's rule list differs. Setup and
scoring do differ. This is Christian's known realization-diversity item; changing modifier placement
is a knowledge decision, not a bug fix. **Note the measurement trap:** a scratch script passing `[]`
for `perSlotModifierLines` (production passes real ones) makes all three look identical. Mirror
`app.routes.ts` exactly or the harness lies to you — the same error as the fork above.

**Review-moment prompts shipped** (`0474359`): *"Would you run this activity as written?"* —
Yes / With changes / No, plus optional "what would you change?" and "anything confusing, unclear, or
unrealistic?". Asked **at review, not after use**, because post-use feedback only reaches us from
coaches who ran the session; the coach who reads an activity, decides it is unusable and closes the
tab is otherwise invisible. Lands in `debug-usage` under `pilotEvidence.runAsWritten` with free text
verbatim. **There is no Session Reflection surface in the app** — Christian's second moment is
hosted on the activity page for now.

### 2026-08-22/23 — SILENT LOSS OF AUTHORED KNOWLEDGE is the lesson of this week

Four separate times, authored content reached the engine and was silently discarded, each time by a
projection that copies a NAMED LIST of fields and drops the rest: `setup` and `howToPlay` (output
validator's allowlist reconstruction), and `incentiveMechanism` / `visibilityEffect` /
`primaryConstraintType` / `targetAffordancePrimary` (`constraintToIConstraint`). None failed. The
value became `undefined`, a fallback covered for it, and the loss surfaced weeks later as a DESIGN
complaint rather than a bug. Christian's summary: the architecture was not the problem, the authored
knowledge was not reaching the runtime.

**Guarded now: `system/test-library/projection-integrity.unit.ts`.** It names the authored fields that
have live consumers and fails the build when one stops arriving, in the spirit of the sport-coupling
ratchet. **Add to that list whenever you write code that reads an authored field.** Verified by
re-introducing the real regression: it fails naming `incentiveMechanism` and where it is read.

**A second silent-failure class, same week: regexes that match NOTHING.** `isScoringMechanic`
contained literal BACKSPACE bytes (0x08) where `` belongs — written through a Python heredoc that
interpreted the escape. It matched nothing for a week, so every mechanic routed to Rules and Scoring
kept only the hardcoded per-archetype template. That ONE fault produced two complaints Christian
raised a week apart (scoring statements inside Rules; every Scoring section collapsing to "A point or
live advantage counts"). A sweep found two more in `compress-activity-output.ts` and **eight in its
unit test, inside NEGATED assertions — four tests that could never fail.** All repaired;
`isScoringMechanic` now asserts at load time that it still matches plain scoring language.

**NEVER write a regex through a Python heredoc.** Use the Edit tool, or a raw string, and verify with
a byte scan afterwards (`b'' in open(f,'rb').read()`). This bug has now been introduced three
times on this project.

### Incentive expression (2026-08-22, `db6b21e`)
Five mechanisms are authored in the sport module; the runtime saw none of them, and only
`scoring_bonus` had an expression branch emitting a placeholder that named no condition.
`system/activity/incentive-expression.ts` now gives each mechanism its own structure, filled with the
constraint's OWN authored words — it invents no coaching content, and `none` produces silence rather
than a placeholder. Measured on Christian's case: generic template 3/3 → **0/3**.

**Christian froze scope here.** No new mechanism types, no incentive → Environmental Manipulation
trigger, no taxonomy standard before the pilot. Observations go in `docs/DISCOVERY_INCENTIVE.md`; the
*Representative Incentive Architecture* gets written immediately AFTER Pilot RC1 while evidence is
fresh. His instinct on the boundary — incentives TRIGGER Environmental Manipulations, EM owns the
change — is recorded there, deliberately not implemented.

### Telemetry blind spot — FIXED (`0a0af04`)
Every usage event used to fire server-side, so it required a COMPLETED request: we recorded what
coaches DID and never where they stopped. A coach who opened planning and left at step two produced
nothing, indistinguishable from one who never opened the app.

Client-side events now capture only the silent things — anything that leaves a record can be
re-derived later, anything that produces silence cannot:

* `planning_started` — the denominator for every abandonment figure
* `planning_abandoned` — with the step reached
* `activities_viewed`
* `would_use_again` — yes / unsure / no

All surface in the existing usage summary as `pilotEvidence` (`GET /api/app/debug-usage`).

**The abandonment event uses REFS, not state.** The cleanup runs once on unmount and a closure over
state captures first-render values — that would report every coach as abandoning at step one, which
is worse than no data because it looks like a finding.

**"Would you use Challenge Point for your next practice?"** is asked after the coach has already
given a thumb, so it cannot deter the cheaper signal, and while they still remember the session.
Christian named it the most valuable thing the pilot could learn, and it is the one thing no
instrumentation can infer.

### Architectural decisions settled this cycle
* **Challenge is no longer a planning input.** It is an emergent property of the learner-environment
  interaction; the planning conversation is five steps. A documented `RUNTIME_CHALLENGE_DEFAULT`
  placeholder stands in until calibration exists.
* **Challenge had a THIRD, undesigned role** — it was concatenated into the selection matching corpus,
  where the literal token "low"/"high" changed which activity was selected. Removed. The behaviour gate
  could not have caught it: no gate input passes a Challenge value.
* **Default session emphasis flipped to differentiated.** The narrow "applying" profile deliberately
  produces near-identical activities; nothing asks the coach for emphasis, so everything defaulted to
  it. A coach who explicitly chooses that emphasis still gets narrow bandwidth.
* **Ownership must not drive intervention ranking** (Christian's correction). Decision 5 orders by
  affordance fit then authored registry position.

## CURRENT DIRECTION (updated 2026-07-23) — Knowledge Core ingestion + MVP gate

### Where the project is
The deterministic engine is **validated and stable**. Christian's testing rounds concluded: game-problem
routing, defensive boundaries, Recover & Reorganize, and representative design all need **no action**.
Remaining engine-side items are presentation (coach language, activity variation), not architecture.

Christian ships **canonical Knowledge Core packages**; we ingest them same-day. He has formalized a
platform-level **Knowledge Package Standard** (Manifest / Standard / Workbook / Canonical Reference /
Admission & Change Review / Discovery Register), partly from our loader feedback.

### MVP gate — Christian's decision (2026-07-23): NOT YET, but bounded
Joe proposed an MVP gate + freeze line (2026-07-17). Christian declined **with reasoning**: coach
feedback on an incomplete engine would report *missing architecture* rather than *coaching experience*.
**He named a finite remaining list**, then coaches:
1. ~~Information Expression Library~~ ✅ delivered + ingested (2026-07-23)
2. ~~Representative Validation Architecture~~ ✅ delivered (2026-07-25) — see below
3. ~~Experience Intelligence~~ — **architecture** delivered 2026-07-25 (see below); full package still
   pending. Christian's next work: **Representative Engine Integration** architecture, then the
   remaining Experience Intelligence package documents.

"Once those are in place… the first version of the complete representative reasoning engine," and then
the initial coach cohort evaluates it using the feedback loop we built. **Do not re-litigate this** —
it is his call and it is now bounded, not open-ended.

### Knowledge Core libraries INGESTED (all shadow/reference — no production coupling)
Workbooks committed verbatim under `back/data/knowledge-core/`; complete generated JSON projections
next to their loaders in `back/src/system/knowledge-core/` (**never hand-edit the JSON** — regenerate
from the workbook). Every loader has a **load-time integrity gate** validating against the workbook's
own declared metadata counts (defined failure, never silent).

| Library | Loader | Canonical content |
|---|---|---|
| Environmental Manipulation v2.0 RC1 | `em-canonical.ts` | 6 families / 11 KOs / 5 EVDs / 24 dimensions / 64 params |
| Game Problem Library RC1 | `gp-library.ts` | 6 Relationship Domains / **17 canonical Game Problems (GP-001..017)** |
| CAR (Affordance Target) Matrix RC1.2 | `affordance-target-matrix.ts` | 17 GPs × 4 CARs (FOI/OP/SA/CIO) = 68 cells |
| Game Archetype Library RC1.1 | `game-archetype-library.ts` | 6 ecological archetypes / 216 knowledge rows |
| Information Expression RC1.1 | `information-expression-library.ts` | 4 families / 4 domains / 26 dimensions / 139 values |

**Canonical vocabulary now in force:** Game Problems are `GP-###` (Domain × Operation), NOT the old
tactical names. Complex coach intents resolve via the **Composite Game Problem Runtime**: exactly one
**Primary** + **zero-or-one Secondary**, Primary wins conflicts, merged profile keeps provenance.
Coaching expressions ("Counterattack", "High Press", "Late Reveal") are **composites, never ontology
objects** — several libraries encode that as a hard invariant, pinned in tests.

### Shadow-mode ATP (RAS RC1 Stage 3) — built, not coupled
`resolveAffordanceTargetProfile()` resolves a **Resolved Affordance Target Profile** from the parser's
signal groups (provisional engine-owned `SIGNAL_GROUP_TO_GAME_PROBLEM` → GP-IDs → CAR rows, merged by
strongest necessity). It rides `selectionTrace.affordanceTargetProfile` with version stamps and is
visible in Selection Debug. **`mode: 'shadow'` — zero selection influence.** Christian's note: the CAR
Matrix is a *compatibility resource, not a selector*; semantic routing + GP identity + Composite Runtime
remain the drivers.

### Representative Validation RC1 (2026-07-25) — the first ENGINE package
5 docs in `~/Downloads/drive-download-20260725T014945Z-1-001/` (Manifest, Architecture, Domain Reference,
Runtime Validation & Correction Spec, Validation Record Spec). **There is nothing to ingest.** Unlike the
six knowledge libraries, this is an *engine package* by Christian's own decision — runtime reasoning, not
externally-maintained canonical knowledge — so it ships **no workbook, no canonical IDs, no loader**. The
deliverable is code.

- **Two subsystems:** *Validation Engine* (does it pass?) and *Diagnostic Engine* (why, who owns it, and
  what is the **lowest sufficient correction**?). Kept separate so judgment is never conflated with repair.
- **Six domains:** RVD-01 Ecological Organization Integrity · RVD-02 Learning Target Fidelity ·
  RVD-03 Interaction Integrity · RVD-04 Information–Action Integrity · RVD-05 Representative Exposure ·
  RVD-06 Degenerate Solution & Drift Detection (the adversarial one: *what is the easiest way to win
  without engaging the intended problem?*).
- **Five outcomes:** Pass / Pass with Warning / Revise / Reject / **Insufficient Evidence** (which must
  never be silently converted to Pass).
- **Five checkpoints:** 1 after Game Form selection · 2 after EM+IR+IE configuration · 3 after assembly
  (all six domains) · 4 after Experience Intelligence (always reruns RVD-06) · 5 after coach-language
  translation.
- **Explicit non-requirements:** no composite score (a high average must never conceal a hard-gate
  failure), no numeric thresholds, no prescribed classes or schema. Roll out shadow → warning →
  blocking (hard gates only) → corrective.

**What the engine actually validates today** (verified, don't trust older notes): the live path in
`back/src/services/completion.service.ts` runs exactly **three** validators —
`validateActivitiesAgainstSkeleton` (archetype mechanics expressed, plus decision and consequence
indicators), `validateActivityMechanics` (assembly fidelity to the spec), and
`validateActivityPolishPayload` (freezes `SYSTEM_OWNED_POLISH_FIELDS` so the LLM polish pass cannot touch
rules/scoring/constraints). **`evaluateActivityQuality` and `evaluateActivityDiversity` are dev-harness
only** (`scripts/run-activity-quality-tests.ts`) and never run in production. So we partially cover
Checkpoints 3 and 5; **Checkpoints 1, 2 and 4 do not exist.**

**Implementation notes worth keeping** (sent to Christian):
- Because our selector is a **deterministic bounded search**, Checkpoints 1–2 collapse into candidate
  *filtering* inside `enumerateDesignPossibilities` — no retry loop is needed upstream of
  `commitDesignChoice`. Correction/retry machinery is only needed downstream (assembly, polish).
- `validate-activity-polish.ts` field-freezing already enforces his Coach Communication Contract
  *structurally*, which is stronger than post-hoc Checkpoint-5 validation. Keep structural immutability
  for machine-owned fields; validate only the free-text fields where leakage can actually live.
- RVD-06 is not generally decidable. Implement it as a finite, growing **catalog of named degenerate
  patterns** as testable predicates, seeded from his own examples.
- Any correction loop must be a pure function of `(state, diagnostic)`, or it breaks DDL Repeatability —
  our variation seed is `previousActivities.length`.
- `SelectionResolution.unresolved` is already *Insufficient Evidence* at the selection layer.

### Experience Intelligence Architecture RC1.0 (2026-07-25) — architecture only
Single loose docx in `~/Downloads/` (`Challenge Point™ Experience Intelligence Architecture RC1.docx`).
Sent architecture-first, deliberately, so implementation can shape it before the full package solidifies.

**EI is now purely an *interpretation* subsystem.** After Christian's reduction passes it no longer owns
coach interaction, activity modification, recommendation presentation, or the coaching loop — those all
belong to **Coach Intelligence, which is planned and does not exist**. EI answers one question: *is
productive participation currently being unnecessarily constrained?* **"No intervention recommended" is
an expected, successful outcome** — the subsystem is deliberately conservative, because representative
learning needs time for players to self-organize.

Five outputs, and nothing else: Participation Assessment (healthy / may be constrained / likely
constrained) · **exactly one** Most Probable Experiential Friction · Confidence (Strong / Moderate / Weak /
Insufficient Evidence) · Preferred Intervention Intent (an implementation-neutral *class*, never a
coaching action) · Representative Risk (Low / Moderate / High). New cross-platform principle: **lowest
sufficient intervention**, mirroring RV's lowest sufficient correction.

**Implementation notes (sent to Christian):**
- **The input channel is the gap, and we already own most of it.** EI reasons from "structured coach
  observations" supplied by Coach Intelligence. §9 lists what is effectively a **closed vocabulary of
  eight observations** (challenge too low / too high, players waiting, activity becoming predictable,
  players finding varied solutions, one team dominating, players confused, participation declining).
  Our field-evidence collector already has the intake — `usage_events`, `recordUsageEvent`, `sessionId`,
  the `ActivityFeedback` widget, and an extensible `feature_used` event. Turning those eight into
  structured chips (instead of a freeform comment) starts the calibration dataset **before** the
  interpreter exists. **The observation vocabulary is the real MVP deliverable here, not the interpreter.**
- **The interpreter is a table, not code.** 8 observations → 7 frictions → 6 intents is a lookup plus a
  precedence rule. That raises a genuine question for Christian: is the friction catalogue and its
  ordering *coaching knowledge* (his, in a workbook) or *engine logic* (ours)? By his own three-layer
  model it reads as coaching knowledge — so unlike Representative Validation, EI may warrant a workbook.
- **"One primary interpretation" needs a stated precedence order**, or two faithful implementations of
  the architecture return different frictions for the same evidence. Same class of bug as the Round-7
  archetype tie-break, and the same principle: explicit resolution, no hidden preference.
- **Representative Risk should be a lookup, not a judgement.** RV's Output Contract to EI already emits
  protected invariants, prohibited modifications and a revalidation-trigger list (scoring, objectives,
  roles, state transitions, uncertainty, information, challenge, incentive structure, success conditions,
  pacing). Risk = does the intent touch a trigger? Deterministic, and it makes the two packages compose
  instead of duplicating reasoning.
- **The one real engineering assumption: SESSION STATE.** §9 wants elapsed activity time, duration, stage
  and previous adjustments. **We have none of it** — the app generates activities, it does not run
  sessions. "Preserve emergence" is inherently time-dependent, so EI's core conservatism cannot function
  without it. Live-session tracking is real product work; the cheap MVP path is to let the coach report
  stage as one of the structured observations ("just started / settled in / been a while").
- Minor: *Insufficient Evidence* is a **confidence level** in EI but a **halting outcome** in RV.
  Disambiguate before both subsystems write to Evidence Intelligence.

### Representative Engine Integration Spec RC1.0 (2026-07-25) — THE CAPSTONE / ARCHITECTURE FREEZE
Single loose docx in `~/Downloads/`. Christian ran a final freeze audit: this is "the governing runtime
specification for the MVP rather than another evolving design document." **Read this before planning any
runtime work** — it defines execution order, ownership, interface contracts and revalidation triggers.

**Coach Intelligence is the runtime orchestrator.** Representative Intelligence, Representative
Validation, Experience Intelligence and Evidence Intelligence are **passive reasoning services** that
never self-initiate. Three runtime phases:

| Phase | Flow | Our status |
|---|---|---|
| **Planning** | CI gathers context → RI generates → RV validates → CI presents | ✅ working end-to-end |
| **Live Coaching** | CI holds session state, captures + routes observations to EI or RV, translates intent → one recommendation, records the decision, resubmits structural changes to RV | ❌ does not exist |
| **Reflection** | CI reviews captured evidence, targeted (not fixed-survey) reflection, hands the session record to Evidence Intelligence | ❌ does not exist |

Governing principles worth knowing: **Quiet Assistance** ("invisible intelligence preferred over visible
complexity" — intervene only when it improves the coach's *next* decision), Lowest Sufficient Change,
Preserve Emergence, Coach Autonomy, Transparent Failure, Provenance Preservation. §22 splits pre-session
**Potential Experience Risks** (prediction, owned by CI) from EI's runtime *interpretation*. §37 adds
bounded recommendation termination — which answers the retry concern raised on Representative Validation.

**The strategic read (this is the important part):**
1. **Coach Intelligence is now load-bearing for everything and is the only subsystem with no architecture
   document.** It owns context gathering, orchestration, session state, observation capture and routing,
   intent→mechanism translation, presentation, decision recording, reflection, *and* coach-facing
   language. Every other subsystem has a governing doc. The architecture froze with its orchestrator
   unspecified.
2. **The architecture is complete; the build is not.** The remaining gap is one unnamed subsystem plus
   two entire runtime phases — new product surfaces, not integration work. **MVP scope is now the
   question that dominates the timeline:** engine-only (what we have + the coach-language pass), or all
   three phases?
3. **Constructive reframe: Coach Intelligence is largely the application layer we already built but never
   named.** Coach context = the request form + `normalizeCoachingInput`; orchestration =
   `completion.service.ts` / `app.routes.ts`; translation = `compressActivitiesForCoach` + polish;
   decision recording = `usage_events` + `ActivityFeedback`; provenance = `selectionTrace` + versions.
   What's genuinely missing is a **live-session runtime**.
4. **Session state — more precise than the note in the EI section above.** `back/src/models/session.model.ts`
   *does* define a session with `SessionStatus` (Draft / In Progress / Completed), used in `SessionLibrary`
   and `SessionPage`. But it is a **plan-authoring lifecycle, not a live runtime**: there is no `startedAt`
   and no elapsed-time tracking. So an entity exists to hang runtime state on — **the gap is timing, not
   identity.**
5. **Interface gap:** §30 routes the runtime observation *"intended problem not emerging"* to
   Representative Validation — but RV's own input contract accepts only canonical selections, activity
   config, invariants and context. **No observational input.** RV validates structure and already passed
   this activity; it cannot observe emergence.
6. **Ownership leak (same shape as the EI representative-risk finding):** §42 says "minor presentation
   changes do not require revalidation", which makes *Coach Intelligence* decide what counts as
   structural — a judgement §15 gives to RV. Unifying fix worth stating platform-wide: **the orchestrator
   should route on data the services emit, never on its own inference about their domains.** RV already
   emits "prohibited modifications" and "adjustable parameters"; it should ship the classification.
7. **We have Reject but no Revise.** A validator failure is terminal and the coach sees an error. That now
   has an architectural home as the Reject / Insufficient-Evidence path through CI, and merges with the
   existing open "graceful unsupported-goal UX" item below.
8. Evidence Intelligence also lacks a document but is **genuinely deferrable** (it needs accumulated
   evidence). Coach Intelligence is **not**.

### Coach Intelligence Architecture RC1 + revised Runtime Validation (2026-07-26)
Both loose docx in `~/Downloads/`; extracted to scratchpad `ci/`.

**Revised Runtime Validation & Correction Spec — all three of our recommendations adopted:**
pre-commitment validation may be realized as deterministic candidate filtering; Checkpoint 5 prefers
structural immutability for machine-owned fields and concentrates on free-text; corrections must be a
deterministic function of `(activity state, diagnostic)` with no dependence on retry counts, generation
history, or mutable randomness. Christian's next RV work is the **Degenerate Solution Pattern
Catalogue** (the RVD-06 approach we proposed).

**Coach Intelligence Architecture** was written to close the gap we flagged. Adopted directly:
§9 **Routing by Emitted Classification** (CI routes on classifications the *owning* subsystem emits,
never its own inference — "prevents the runtime orchestrator from quietly becoming a second validator");
§22 the bounded **8-observation vocabulary**; §23 **Session Stage** = Just Started / Settling In /
Established *instead of* elapsed-time tracking — which unblocks Experience Intelligence without building
a session runtime; §29 **Runtime Representative Reassessment**, closing the interface gap where an
observation was routed to a subsystem that accepts no observational input.

**THE STRATEGIC SHIFT — staged MVP (Part IV).** **Pilot 1 = planning engine only**, evaluated by real
coaches *before* the live runtime is designed. **Pilot 2 = the live "quiet assistant" runtime.** §14 notes
planning "is already substantially represented in the current implementation" — which it is.

**Pilot 1 gap list, verified against code:**
| §18 requirement | Status |
|---|---|
| Coach-context gathering | ✅ `ActivityGenerator` form + `normalizeCoachingInput` |
| Representative activity generation | ✅ |
| Coach-facing communication | ✅ coach-language layer (`707e84d`) |
| Structured post-use feedback | ✅ `ActivityFeedback` widget |
| ~~Approved observation vocabulary collected after use~~ | ✅ **DONE 2026-07-31** (`974a0a4`) — see below |
| ~~Activity editing~~ | ✅ **DONE 2026-07-26** (`bad7357`) — `ActivityContentEditor` + `activity-edit-evidence.ts`. Editing is **unrestricted** (§38 records, does not judge); every edit is diffed, classified presentation vs revalidation-trigger, recorded as `activity_edited`, aggregated by field in `debug-usage`. The field classification is **provisional** pending RV emitting it — same pattern as `SIGNAL_GROUP_TO_GAME_PROBLEM`, each mapping cites its source. |
| Representative Validation (6-domain RVD engine) | ⚠️ partial — we run 3 ad-hoc validators |

**Open findings sent to Christian:** (1) **intervention intent → concrete mechanism has no owner** — EI
emits an implementation-neutral intent, §34 has CI turn it into a practical adjustment, but §8 says CI
doesn't own EM/IR/IE knowledge; choosing "rotate roles" vs "shrink the area" *is* representative design
knowledge. Fix per his own §9: RV's published adjustable-parameter list should carry enough structure to
answer "which of these serves this intent". (2) **No threshold owner** for §33/§30 ("repeated
observations" — how many?); elegant fix is that EI already has *Insufficient Evidence* as a confidence
level, so CI forwards and stays silent when EI says so — no threshold in the orchestrator at all.
(3) "Deterministic orchestration" needs pinning as determinism over `(session state, emitted
classifications)` where session state includes **ordered** history. (4) The emitted-classification
enumerations, observation vocabulary, session-stage enum and five validation outcomes should live in a
**shared runtime interface spec** — they're defined by example inside CI's document but owned elsewhere,
so they will drift. (5) Enum inconsistency that will become a DB field: §7 lists five coach decisions,
§39 lists four (drops "replaced by a coach-selected action").

### Runtime Interface Specification RC1.1 (2026-07-30) — the executable contract
Christian built the shared runtime interface spec we recommended. **This is now the canonical source
for shared enumerations and exchanged-object shapes** — subsystem docs stay authoritative for
ownership and reasoning, but where they describe a shared enumeration *by example*, this governs.
Read it before implementing anything that crosses a subsystem boundary.

Everything we raised last round is resolved: observation codes now have **stable
`SCREAMING_SNAKE` IDs** with display labels explicitly allowed to change while stored values may not
(§12 + §50); §40 **Published Adjustment Option** turns intent→mechanism into a bounded lookup so the
orchestrator never does representative design; §38 states outright that Experience Intelligence
decides evidence sufficiency and **Coach Intelligence must not implement observation-count
thresholds**; §9 + §47 define determinism over *ordered* session state; the coach-decision enum now
carries all five values. §55 splits the **Pilot 1 vs Pilot 2 minimum object sets** — useful, because
Pilot 1 needs only Shared Envelope, Coach Context, Representative Activity, Validation Result,
Observation Event, Coach Decision, Session Record.

**RC1.2 (2026-07-31) closed all four gaps we raised — §56 confirmed.** Added **§19A Intervention
Intent** (8 values, explicitly required to be *the same vocabulary* on both sides of the
intent→mechanism lookup, which was the whole point), **§19B Experiential Friction** (8 values),
**§19C Reassessment Request Trigger** (5 values), and **`INTENDED_PROBLEM_NOT_EMERGING`** as an
observation code. Coach Intelligence §28 routes that last one **directly to Representative
Validation** — "because it reports a representative-expression concern rather than an experiential
friction" — reaching it through a Reassessment Request carrying a §19C trigger, so the old interface
gap stays closed. The 8 frictions map cleanly onto the 8 intents. §55's Pilot 1 object set is
unchanged.

**One residue we flagged, scoped to Pilot 1 and explicitly non-blocking:** four Pilot-1 *stored*
fields still have no canonical value set — `captureMethod`, `learningEmphasis`, `challengeLevel`,
`completionStatus`. **We already have local values for two of them** (`ChallengeLevels = low|medium|high`
in `activity.model.ts`; `SessionEmphasis = discovering|applying` in `session.model.ts`), so ours
become the de facto canon by default — the exact drift §50 exists to prevent, on the first flow we
build. Pilot-2-only inline enums (`presentationPriority`, `coachOptions`, `recommendedDisposition`,
`requestReason`, `applicationStatus`, `candidateDisposition`, `requiredAction`) are flagged for
"before Pilot 2", not now.

Two notes for whoever implements: `INTENDED_PROBLEM_NOT_EMERGING` is deliberately the same identifier
in **both** §12 and §19C — keep them as distinct namespaced types, never a shared `code` column. And
Experience Intelligence RC1.0 was not revised, so it still says confidence is "Strong / Moderate /
Weak" against §16's `HIGH / MODERATE / LOW`; §4 Authority & Precedence governs, so the Runtime
Interface values win — but don't build the enum from the EI document.

### Observation capture — the first Runtime Interface object in code (`974a0a4`)
`back/src/system/runtime-interface/observation-vocabulary.ts` implements RC1.2 §12/§13: nine
observation codes, three session stages. **It lives in its own module, NOT under `knowledge-core/`** —
that folder holds Christian's canonical *knowledge* workbooks; this is a platform *runtime contract*,
a different kind of thing. Expect the rest of the Runtime Interface objects to land beside it.

Three spec clauses drove the design, and each is worth preserving:
- **§50 Semantic Stability** — every entry is an immutable stored `code` plus a freely-rewordable
  coach-facing `label`. **The vocabulary is SERVED** (`GET /api/app/observation-vocabulary`) rather
  than duplicated in the client, so a reworded label ships without a client release and the client
  can never offer a code the server would reject. Do not copy the codes into the front end.
- **§52 Failure Behavior** — `parseObservationCode` / `parseSessionStage` return null and the route
  400s naming the field. Never coerce a near-miss; a silently-corrected observation corrupts the
  evidence.
- **§9 Ordered Session State** — observations are their own append-only `observation_events`
  collection with `sequenceNumber`, **not** `usage_events`. Telemetry is fire-and-forget and may drop
  writes; an Observation Event is an immutable historical fact the Session Record carries in order.

**Scope is Pilot 1 (§42) only:** no Experience Intelligence call, no recommendation, and
`INTENDED_PROBLEM_NOT_EMERGING` is *stored, not routed* — routing it to Representative Validation is
Pilot 2 (§28/§55). Aggregates land in `GET /api/app/debug-usage` under `observations`.

Two things deliberately left provisional: `captureMethod` only ever stores `POST_USE` (its canonical
set is one of the four Pilot 1 value gaps raised with Christian), and `sequenceNumber` is count-based,
which is fine for a single coach submitting one form but needs an atomic counter if live capture
arrives in Pilot 2.

### Knowledge Presentation Standard RC1.0 (2026-07-31) — governs coach-facing output
Short constitutional standard: the presentation-layer counterpart to the Runtime Interface Spec.
Prompted by Christian's own observation while generating test activities — *repetition across
sections, metadata appearing as coach instructions, multiple reasoning stages saying the same thing
differently.* §6 pipeline: **Knowledge → Reasoning → Communication Contributions → Composition →
Translation → Coach Presentation.**

**The finding that matters for our code: "Communication Contributions" does not exist in our
system, and its absence causes all three symptoms he reported.** Our pipeline is *subtractive* —
assembly writes prose, the LLM writes more prose, and `compressActivityForCoach` then tries to
*remove* redundancy using **token-Jaccard at `SEMANTIC_OVERLAP_THRESHOLD = 0.6`**. That can never
satisfy §7 Principle 2, because two sentences can express one idea with almost no shared tokens
("Score by reaching the far zone" / "A point is awarded for progressing past the line").

**The fix is structural, not a threshold tweak:** have each reasoning stage emit a *claim with an
identity* (which idea it expresses) instead of a sentence, so Composition deduplicates by identity —
exactly and deterministically — rather than guessing by word overlap. Corollary: with structured
contributions **the LLM becomes a translator rather than an author**, which is what the Integration
Spec's "Deterministic Before Generative" already asks for, and removes the redundancy class where
the LLM restates what the deterministic layer already said.

**Three smaller findings raised with Christian:**
1. **§9's quality checklist is half-implemented already** — "no architectural terminology" is
   `findNeverDisplayViolations` (running, recording leaks as evidence) and "no implementation
   language" is the translation table. The rest needs contribution structure to be checkable.
2. **§9 overlaps Representative Validation Checkpoint 5**, which already evaluates coach-facing
   language. Proposed split: **RV owns meaning-preservation, Presentation owns quality**, and a
   presentation failure is never a representative Reject. Needs his ruling.
3. **Two diverging never-display lists.** Presentation §7 P7 and Translation Dictionary §9 share
   only three terms. **Ours follows the Dictionary, so `game problem`, `representative validation`,
   `runtime assessment` and `published adjustment option` are NOT currently blocked** and could
   reach a coach. Needs one canonical list with one owner before we add them.

### Runtime Communication Contribution Spec RC1 (2026-08-01) — replaces our dedup approach
Christian built the contributions layer, and **§24 is a direct instruction to delete our
token-Jaccard dedup**: "Communication Resolution shall never determine semantic equivalence through
textual similarity, wording overlap, or generated language." Equivalence is decided **exclusively by
Semantic Key** (§18) — an identity carried on each claim. §26 **Complementary Contributions** is his
addition and it is what makes the model safe: contributions sharing a concept but carrying different
information are preserved rather than collapsed. §21 **Audience** fixes metadata-as-coach-instruction.
§28 precedence: Authoritative Ownership → Presentation Priority → Presentation Ordering.

**Two resolutions we were waiting on:**
- **§36 names the never-display owner: the Knowledge Presentation Standard.** Knowledge Expression
  must *reference* that list, not keep its own. So `coach-language.ts` should adopt the Presentation
  §7 P7 terms — **`game problem`, `representative validation`, `runtime assessment` and
  `published adjustment option` are still unblocked in our code.**
- **§45 settles the RV/Presentation overlap:** communication-quality failures require revision of
  communication and **shall not invalidate representative reasoning**.

**Open finding — the Semantic Key vocabulary is ungoverned.** §24 makes equivalence depend
*exclusively* on the Semantic Key and §42 validates "a defined Semantic Key", but nothing enumerates
the keys or names an owner. Two subsystems coining `SCORING_RULE` and `SCORING_CONDITION` for one
claim would never match, both would survive, and the coach reads the rule twice — the exact symptom
the document exists to remove. Same shape for `Target Section` ("Examples include") and
`Translation Key`. **This blocks the soccer layer too**, since the sport module will emit contributions.

**Pilot 1 value sets are defined (§19D–G) — and one collides with data we already store:**
| Field | Canonical | Ours today |
|---|---|---|
| Learning Emphasis | `DISCOVERING` / `APPLYING` | `discovering` / `applying` (case only) |
| Challenge Level | `COMFORTABLE` / `STRETCH` / `DEMANDING` | **`low` / `medium` / `high`** in `activity.model.ts` |

Semantic mapping is a clean 1:1 (`low`→COMFORTABLE, `medium`→STRETCH, `high`→DEMANDING), so this is a
rename plus a migration rather than a redesign — but there **is** stored data, and §51 covers object
versions, not migration of pre-contract records. Do not adopt the canonical values without a migration.

### Soccer/universal separability audit (2026-08-01)
Done for Christian's "can soccer actually dock?" question. Evidence, not opinion.

**The soccer layer today: 44 objects + a 691-line parser, and only one resource cites universal IDs.**

| Resource | Size | Canonical ID refs |
|---|---|---|
| `archetypes.ts` (game forms GF1–GF11) | 11 | **0** |
| `constraints.ts` | 12 | **0** |
| `environmental-manipulations.ts` | 11 | **0** |
| `affordanceLenses.ts` | 10 | **0** |
| `knowledge-core/em-selection-metadata.ts` | — | **12** ✅ |
| `deriveInputConstraints.ts` (vocabulary parser) | 691 lines | n/a — **vocabulary lives in code, not data** |

So four of five working libraries run a **complete parallel vocabulary** to the canonical libraries,
bridged only in shadow. `em-selection-metadata.ts` is the single resource built the right way.

**Soccer assumptions embedded in layers that should be universal:**
- `build-activity-skeleton.ts` — **hard-coded soccer prose** ("goalkeeper presence", "shoot, cut
  inside, or hold for a better angle", "Final third context"). Worst offender: universal-layer code
  emitting sport-specific coach-facing content.
- `normalizeCoachingInput.ts` — soccer rewrite templates.
- `generateSelection.ts` — `SOCCER_TOKEN_EQUIVALENCES` stemming table + `Z_soccer_general` fallback.
- `validate-generated-activity.ts` / `validate-activity-structure.ts` — soccer technical actions
  (`must dribble`, `must shoot`, `shot`, `pitch`).
- `coach-guidance.ts` — **"I read this as general soccer work" in coach-facing copy. Added by us on
  2026-07-31 without noticing.**

**Verified sport-neutral:** `coach-language.ts`, `observation-vocabulary.ts`,
`compress-activity-output.ts` (all "pass" hits are false positives), and the six canonical libraries.

**The finding that matters most:** we added sport coupling to a clean layer within a week, while
actively thinking about separability. **Separability cannot be maintained by discipline — it needs a
build guard.** Recommended sequence is therefore *guard first, extract second*: a test that fails when
sport vocabulary appears in a universal layer turns this from an audit snapshot into an invariant.
The docking socket already exists (`testLibraryRegistry` from Phases 1–2, with versioned registration
and schema/composition validation) — what's missing is that the plug isn't shaped right yet.

### Sport Module RC1 package (2026-08-02) — Stage 1 schema review, extraction NOT started
Five documents + a workbook template (`Challenge_Point_Soccer_Module_Workbook_RC1_Candidate.xlsx`).
Christian staged this: **Stage 1 = schema review, Stage 2 = extraction "assuming the schema looks
sound."** It does not yet, so Stage 2 is correctly on hold.

**What's right:** the five sheets are exactly as recommended (Vocabulary / Game Forms / Realizations /
Coverage / Metadata), and the **Metadata sheet is a proper loader contract** — per-sheet
`*_header_row`, `one_table_per_sheet=TRUE`, `*_expected_rows` for the integrity gate, and version
pins for every universal library. Zero bespoke parsing needed. `semantic_key_registry_version` is
present as TBD, so that finding landed too.

**BLOCKING FINDING — the Game Forms sheet drops the inputs to four scoring bonuses.** Our
`archetypes.ts` objects carry fields the selector reads that have no column:
| Our field | Drives | In schema? |
|---|---|---|
| `constraintFit_structural` / `_shaping` / `_consequence` | balance buckets (+6/+6/+4) | ❌ |
| `recommendedConstraintTypes` | recommended-type bonus (+3) | ❌ |
| `primaryAffordances` vs `secondaryAffordances` | archetype-affordance bonus (+6) | ⚠️ collapsed into one `affordance_ids` |
| `phase_of_play` | phase anchor (+2) | ❌ |
| `coachVocabulary`, `objective`, `exampleConstraintPatterns` | matching + assembly | ❌ |

Extracting as specified **cannot preserve current functionality** — the pipeline gate
`68,64,94,115,91,…` would move. That is Christian's own Stage 2 requirement, so it must be resolved first.

**Two more:**
- **Affordance lenses (10 objects, 16 fields each) have no sheet at all**, yet they are the primary
  goal-matching surface. Constraint/EM selection metadata (`constraintRole`,
  `targetAffordancePrimary`, `primaryConstraintType`, `designIntent`, `gameTemplateAnchor`,
  `environmentalRealizations`) likewise has no home. The schema is *inconsistent* here: `routing_weight`
  in Vocabulary **is** selection metadata and is inside the module, while everything equivalent is out.
  **Recommendation: put sport selection metadata IN the module** — it is sport knowledge, and a module
  that needs an engine-side companion file is not detachable, which defeats the stated purpose. The
  three-layer rule keeps selection intelligence out of the *Knowledge Core*; a Sport Module is not the
  Knowledge Core.
- **Signal groups → `target_concept_id` is a semantic re-key, not a rename.** Our 15 signal groups are
  not 1:1 with GP-IDs (`K_information` and `Z_soccer_general` are deliberately unmapped), so the
  Vocabulary sheet as specified cannot represent the parser's current routing.

### Sport Module workbook v2 (2026-08-02) — six sheets; second completeness audit
Revision addressed all three earlier findings: **Lenses** is now its own sheet; Vocabulary keeps the
**signal-group layer** (`signal_group_id`, `signal_group_role`, `modifier_target_signal_group_ids`,
`routing_polarity`, `fallback_priority`) so `K_information` and `Z_soccer_general` are representable;
Game Forms gained `primary/secondary_affordance_ids`, `recommended_constraint_types`,
`phase_of_play_ids` and `constraint_fit_1..3`; Realizations gained `constraint_role`,
`primary_constraint_type`, `design_intent`, `game_template_anchor`, `realization_bank_id`. The
standard now separates **selection logic (universal) from selection knowledge (Sport Module)** —
our recommendation, adopted.

**Answer to "does every runtime object have a home?" — not yet. ~14 fields with live consumers have
no column.** Verified by reading the actual matching corpora in `generateSelection.ts` (lens fields
~L307, constraint ~L352, archetype ~L732) and assembly usage.

**Tier 1 — breaks selection:**
| Field | Where read | Missing from |
|---|---|---|
| **`coachVocabulary`** | base-score corpus on **lens, constraint AND archetype** | all three sheets |
| **`category`** | base-score on lens + constraint; **also `categoryToSlug()` produces the lens slug that `targetAffordancePrimary` matches for the +10 bonus** | Lenses, Realizations |
| `constraintArchetype` | matched vs archetype `recommendedConstraintTypes` → **+3 bonus** | Realizations (Game Forms has the other half) |
| `designIntent` (lens) / `objective` (game form) / `description` (constraint) | base-score corpus | Lenses / Game Forms / Realizations |

**Tier 2 — breaks assembly:** `affordanceTagGroup` (7 uses), `suggestedConstraintPrompt` (6),
`setupGuidance` (3), `exampleConstraintPatterns` (3), `exampleIncentivePatterns` (3),
`visibilityTriggers`, `exampleConsequencePatterns`, `constraintSupport`. Several are structured
arrays, so `notes` is not a home for them.

**Tier 3 — semantic risk, not a missing column.** Several matcher inputs are **prose scored as text**
but modelled in the schema as **ID lists** (`phase_of_play` → `phase_of_play_ids`,
`typical_affordances` → `primary_affordance_ids`). Converting them is architecturally right but
**removes that text from the matching corpus and will move the behaviour gate**. Needs a deliberate
decision, not a mapping.

### Workbook Schema RC1 final (2026-08-02) — schema is extraction-ready
Third audit. **Every runtime-read field now has a home except one.** Verified against the actual
matching corpora in `generateSelection.ts`, not the type definitions.

Added since v2: `coach_vocabulary` on **all three** object sheets (the biggest gap),
`selection_category_key` on Lenses + Realizations — backed by a *Governed Selection Category
Registry*, which properly homes the key behind the +10 bonus — plus `constraint_archetype`,
`design_intent` (Lenses), `objective` (Game Forms), `description` (Realizations), and the whole
assembly set (`affordance_tag_group`, `suggested_constraint_prompt`, `setup_guidance`,
`constraint_support`, `visibility_triggers`, `example_patterns`, `incentive_patterns`,
`consequence_patterns`, `realization_bank_id`).

**The prose-vs-IDs question is solved well:** `*_matching_text` companion columns
(`primary_game_problem_matching_text`, `primary_affordance_matching_text`,
`phase_of_play_matching_text`, `recommended_constraint_matching_text`) carry the scored text
alongside the canonical IDs, explicitly labelled *transitional*. Christian's decision: **extraction
preserves the existing behaviour gate unless a Selection Behavior Revision says otherwise.**

**One remaining field:** `interaction_structure` (short prose — "Directional progression with scoring
zones") is in the archetype base-score corpus and has no dedicated column; `opposition_structure` is
its structured counterpart, not its text. Needs a prose column or a stated home in `notes`.

**✅ BLOCKER CLEARED (2026-08-02 22:24).** `..._Template_RC1_Candidate_v3.xlsx` +
`Workbook Schema RC1 (1).docx`. **Use v3 — v2 is stale and lacks the new columns.**
Independently verified three ways:
1. **Every runtime-read field is present** — checked against the real matching corpora, not the type
   defs. Lenses 32 cols, Game Forms 40, Realizations 63, Vocabulary 26; zero missing.
   `interaction_structure` is now included.
2. **Every workbook column is defined in the schema doc** — zero undefined headers.
3. **Loader contract complete for all six sheets** — `*_sheet_name`, `*_header_row=2`,
   `*_expected_rows` present for all; `one_table_per_sheet=TRUE`;
   `workbook_schema_version=RC1-CANDIDATE-V3`, `runtime_interface_version=RC1.2`.
   (`metadata_expected_rows` absent — harmless, it's a key/value sheet not a counted table.)

**Extraction slice order (corrected 2026-08-02 — Lenses was missing from the original plan):**
1. ✅ **Loader + integrity gate + Game Forms** (`63b7aad`, mine) — 11 rows.
2. ✅ **Realizations** (`c741808`, Codex + audit) — 23 rows (12 IR + 11 EM).
3. ⬜ **Lenses** — 10 affordance lenses, 16 fields each. **Was omitted from the first plan.** Matters
   because lenses are the primary goal-matching surface and `categoryToSlug(lens.category)` produces
   the key behind the +10 bonus.
4. ⬜ **Vocabulary parser** — 691 lines, largest and most routing-sensitive. **Gated on Christian's
   signal-group → GP-ID decision.**
5. ⬜ **Coverage** — largely derivable from 1–4.
6. ⬜ **Rewire selection to read the module**, then delete the in-code originals. **This is where the
   behaviour gate is actually at risk** and where the ratchet finally moves.

**Nothing has left the codebase yet.** The ratchet still reads **34 across 16 files**, unchanged since
before extraction — knowledge has been *copied* into the module while the originals still drive
selection. That number falling is the only real progress signal.

Behaviour gate `68,64,94,115,91,68,64,94,115,91,97,84` must hold throughout.

**Workbook status when sent to Christian (2026-08-02):** Game Forms 11, Realizations 23, and
**Vocabulary / Lenses / Coverage empty** — 34 of 44 objects, none of the routing. Say this explicitly
when sending, or empty sheets read as breakage rather than as work not yet done.

### Christian's workbook pass (2026-08-03) — NOT INGESTED, one blocking error
His revision is in `~/Downloads/soccer-module.rc1-v3.xlsx`. **Do not ingest it as-is.**

**Round-trip was clean** — the new metadata shape guard had nothing to report. Sheets, order,
headers, column counts and row counts all identical. Metadata, Vocabulary, Lenses and Coverage
untouched exactly as agreed. Vocabulary is correctly semicolon-delimited throughout.

**What he changed:** Game Forms — `canonical_game_archetype_id` ×11, `primary_game_problem_ids` ×11,
`secondary_game_problem_ids` ×10, `coach_vocabulary` ×1 (GF10). Realizations — `coach_vocabulary`
filled on 19 **and rewritten on the 4 that already had it** (he calls this calibration; it means the
four information mechanics' existing matching text changed, which is a behaviour change, not just
gap-filling).

**⛔ BLOCKING — all eleven game forms were mapped to `GA-002`, which is Net/Wall. Soccer is
`GA-001`, Invasion.** Verified against `game-archetype-workbook.rc1.1.json`:
- **GA-001 Invasion** — "Reciprocal progression toward meaningful external objectives"; "Shared,
  adaptive, generally simultaneous access with reciprocal influence."
- **GA-002 Net/Wall** — "Partitioned, mediated, reciprocal, and sequential influence through an
  exchanged object"; "Each return creates the next state until rally breakdown and reset."

Our game forms are directional, shared-space, simultaneous-contest structures (End Zone Games,
Directional Possession, Finishing Games). That is Invasion. Almost certainly an off-by-one on the
identifier. **This is the module's single link to the universal archetype library — ingesting it
wrong would assert that soccer is a net/wall sport at the exact point the docking model is meant to
be proven.** Flagged to Christian; awaiting confirmation rather than self-correcting, since the
mapping is his to own.

**Minor:** GF1's `primary_game_problem_ids` contains an embedded newline (`GP-001;\nGP-002`) where
every other row uses `; `. Survives a trim-based split but will trip a naive consumer.

**Test lifecycle change now due.** `testCoachVocabularyRoundTrips` asserts the workbook *equals*
`archetypes.ts` / `constraints.ts`. His additions and rewrites make that fail by design — the
workbook is now the authority, not a copy. Flip those assertions from "must equal source" to "must
contain source" when ingesting, so extraction loss is still caught without forbidding his additions.

### MIGRATION PROVEN (2026-08-05, `c05c223`) — all 12 decisions reproduce exactly
With the registry seeded from the Soccer Module and vocabulary held constant, the pipeline produces
**`68,64,94,115,91,68,64,94,115,91,97,84`** — byte-identical to the baseline, all twelve decisions,
no gaps. Steps 1–2 of Christian's agreed sequence are complete.

**Two root causes, both schema gaps rather than adapter logic:**
1. `build-constraint-package.ts:261-267` reads `incentiveMechanism` and `visibilityEffect`; neither
   had a column, so the package overlay lost those signals and the validator rejected every
   candidate for one input (`possibilities=0`). Added, with `includes_incentive_layer`,
   `logic_usage_note`, and four assembly fields on Game Forms.
2. **PROSE LISTS WERE BEING SHREDDED BY THE DELIMITER.** 8 of 11 game forms have an ordinary
   semicolon inside a setup-guidance sentence, so splitting on `;` turned one instruction into
   several. **Prose lists now use `" || "`; short-token lists (vocabulary, IDs) keep `"; "` because
   that is what Christian authors by hand.** This never moved a score, so no behaviour gate would
   have caught it — it would have surfaced as mangled setup text months later.

**How both were found:** a full-field diff of adapted objects against source, not the selected-field
equivalence test. That test passed throughout, because the broken fields were never on its list.
**Lesson worth keeping: selective comparison blesses whatever you didn't think to check.**

### ✅ THE MODULE IS LOAD-BEARING (2026-08-05) — sequence complete
Christian approved modelling the realization banks as a normalized resource rather than flattening
them (email, 5 Aug). Done, and **the registry is now seeded from the module**: soccer knowledge
reaches the selector through the workbook, not through the in-code arrays.

**Realization Banks — a sheet, not a column.** 13 entries across 4 banks, completing the
`realization_bank_id` FK the Realizations sheet *already declared* and had nothing to point at. Three
reasons it could not be a delimited cell, in order of how much damage the alternative does:
1. **Order is behaviour.** `build-activity-skeleton.ts` designates a spine with
   `bank[(variationIndex + i) % bank.length]` — position decides which realization a repeat design is
   built around. `bank_ordinal` makes that data; a delimited cell makes it an accident of typing.
2. **Every entry is prose**, several with the ordinary semicolons that shredded setup guidance once.
3. **The schema already said so** — see the FK above.

The loader gates what a flat column could not: ordinal contiguity (a gap silently shifts every later
entry into a different variation slot), duplicate ordinals, dangling entries, empty banks, blank
spines. All five have negative tests, because **none of them move a score** — same signature as the
delimiter incident.

**Behaviour gate v2 — `70,68,98,119,94,99,86`, recorded deliberately.** Ten of eleven decisions are
identical to the in-code baseline. **One intentional change:** for *"Players keep winning the ball but
turning away from field vision"*, **Turnover Reward** is now selected instead of **Interception
Reward**. Cause: Christian's authored coach vocabulary (15 terms per constraint, present in the
workbook and nowhere in the code) matches *"winning the ball"* more directly — `win it back`,
`win possession back`, `force a turnover`. The uniform score lift has the same cause. This is the
predicted vocabulary effect, not an adapter defect.

**The banks are behaviourally inert at selection time** — verified by isolation run (module with
banks and module without banks produce byte-identical decisions). They feed assembly, not scoring,
which is exactly why the equivalence test could not have caught a defect in them and why the loader
gates them structurally instead.

Recorded in the workbook's own Metadata (`selector_behavior_gate_id=SEL-GATE-2026-08-05`, version 2,
status `PASS_WITH_RECORDED_CHANGE`) with the reason in `change_summary`, so the re-baseline is
governed rather than living only in prose.

### ✅ ALL SIX SHEETS POPULATED (2026-08-08) — Vocabulary + Coverage
**Vocabulary — 175 rows, and this is the slice that changes how the project runs.** Coach vocabulary
lived in a 691-line regex parser, which is why every gap Christian has found needed a code change and
a deploy. It is now data he can edit.

Extraction is not a paraphrase: `fallback_priority` keeps evaluation order, `routing_polarity` keeps
the EXCLUDE overrides (*"break down a compact defence"* must NOT route defensive even though
"compact" does), and `legacy_pattern_reference` keeps the original regex. **166 literal phrases were
each probed against the live `deriveInputConstraints`, and a unit test re-proves all of them every
run** — so if someone edits the parser and a phrase stops routing where the sheet says, the build
fails naming the phrase. The 9 structural patterns are marked `ACTIVE_UNVERIFIED` rather than
asserted. Defensive subtype rows are probed with a carrier ("prevent"), because `defensiveSubtype`
only runs once defensive intent exists — probing them bare tests the wrong thing.

**Coverage — 17 rows, one per canonical Game Problem, DERIVED from the engine.** 10 SUPPORTED, 7
NOT_SUPPORTED, each with a named gap. Hand-written coverage claims rot; deriving means the sheet
cannot drift without the extraction changing. This is what lets an unsupported goal fail
*specifically* rather than generically — the coach currently gets the same message whether we will
never support their goal or simply haven't populated it yet.

Two findings fell out of deriving it rather than asserting it:
- **GP-012 Protect Space has no vocabulary of its own.** It is the DEFAULT bucket for defensive
  intent matching none of press/recover/delay — reachable, but a coach cannot ask for it by name.
- **7 canonical Game Problems are unreachable by any phrasing** (Improve Position, Recover Functional
  Object Control, Gain/Escape Performer Control, Regain/Deny Access, Control Space). That is the
  population backlog, now written down instead of implicit.

**Routing is NOT repointed** — the parser is still the runtime authority and the behaviour gate is
unchanged at `70,68,98,119,94,99,86`. Populating and flipping stay separate governed steps.

**Sport-coupling ratchet 34 → 36**, one declared entry: `registry.ts` names the soccer adapter at the
docking port. Added by hand, *not* by regenerating — regeneration would have blanket-accepted
anything else that drifted in. The registry is universal-platform code, so declaring the whole file
sport-layer would have been wrong; a counted entry keeps it from growing. **Retiring that entry needs
a module registry** so the platform mounts *a* module rather than naming this one.

### Field-evidence collector — BUILT and ready (`5a9e760`)
`usage_events` collection + fire-and-forget `recordUsageEvent` (never blocks/fails a request), hooked
into generation: `goal_submitted` (goal + resolution status + signal groups), **`goal_rejected` (verbatim
text = the vocabulary-gap dataset)**, `selection_resolved`, `generation_succeeded/failed` (stage+reason),
`coach_feedback`. Read it at **`GET /api/app/debug-usage?days=N`**. Front-end `ActivityFeedback` widget
(👍/👎 + comment) is on the activity page. This is the machine that turns the coach cohort into evidence.

### Debug views (how Christian inspects the engine, in-app)
- **Selection Debug** → `/debug` (page) / `GET /api/app/debug-selection?goal=…` — full deterministic
  pipeline incl. rankings + shadow ATP.
- **Knowledge Core** → `/debug-em` (page) / `GET /api/app/debug-em-reasoning?goal=…` — canonical EM
  reasoning: KOs reached, matched vocabulary, affordance affinities, dimensions + parameters, guidance.
- **Usage** → `GET /api/app/debug-usage?days=N`.

### What to work on next (our lane, unblocked by Christian's two pending packages)
1. **Coach-facing language pass** — his standing high-priority item. **STARTED 2026-07-25** (`707e84d`,
   `f1c9d1a`). Substrate: his **Coach Communication Standard** + **Coach Vocabulary & Translation
   Dictionary** (originals in `~/Downloads/drive-download-20260717T165427Z-1-001/`, extracted to the
   session scratchpad under `coach/`).

   **Done:** `back/src/system/activity/coach-language.ts` holds the dictionary as a data layer — the
   **Rule Realization** layer of the three-layer model, so vocabulary can be revised without touching
   selection and vice versa. It implements §9 Never Display (whole-word detection, mirroring
   `findPrescriptivePhraseViolations`), §6 cross-library translation, and §7 prompt vocabulary
   (judging openers → observation openers). `auditCoachLanguage` is pure and runs *after* translation,
   so anything it reports is a genuine dictionary gap; `app.routes.ts` records those as
   `coach_language_leak` usage events, ranked by frequency in `GET /api/app/debug-usage`. **It does not
   throw** — Representative Validation treats coach-language problems as correctable and puts
   output-language at the lowest correction layer, so a leak becomes evidence rather than a lost
   activity.

   **Careful:** `map-activity-to-coach-view.ts` is **test-harness only** (`run-local-create-activity-test`),
   NOT production. `_activity-coach-view.txt` is its output. It emits hardcoded constants — including a
   possession-flavoured "Main scoring rule" for *every* activity — so ten lines repeat verbatim across
   three activities there. Do not diagnose production boilerplate from that file. The real coach surface
   is the `IActivity` fields rendered by `front/src/app/ActivityPage.tsx`, all of which pass through
   `compressActivityForCoach` → the coach-language layer.

   **Remaining:** age-tier vocabulary (Youth / Secondary / Adult-Elite) and the §5 GP-keyed entries are
   **blocked on the same thing** — the dictionary's tier wording exists only *inside* the per-GP entries,
   so applying it requires knowing the Game Problem. `SIGNAL_GROUP_TO_GAME_PROBLEM` does resolve 13 of 15
   signal groups to GP-IDs, but it is explicitly **provisional and shadow-only**; driving coach vocabulary
   from it would put confident, age-tuned wording for the *wrong* problem in front of a coach whenever the
   mapping is off. That trades a generic phrase for a misleading one, which Dictionary Rule 3 forbids.
   **Needs Christian's call before wiring.** Also outstanding: verification against a fresh generation run
   (needs an API key — the samples on disk are from May).
2. ~~**Graceful unsupported-goal UX**~~ — ✅ **DONE 2026-07-25** (`07a1631`). `coach-guidance.ts` owns
   what a coach is told when the engine could not read their goal, or read it only broadly.
   Rejection → one message in one register plus concrete goals rendered as buttons that fill the
   goal field (`stage`/`details` are now debug-only; they used to be concatenated onto the friendly
   text). Broad read (`fallback`/`unresolved`) → one quiet notice; **a confident match says nothing**,
   per Quiet Assistance. `EXAMPLE_GOALS` is pinned by unit test to resolve *specifically* through
   `deriveInputConstraints` — a coach who follows our suggestion must never be rejected twice, so a
   vocabulary change breaks the build instead. Generation response is now
   `{ activities, resolutionStatus, notice? }`; the client still accepts the old bare array.
3. **Deferred / paused:** activity-variation richness (L2 slot-modifier bank — adds coaching content),
   ATP production coupling (awaits field evidence), semantic routing to canonical GP-IDs, mapping live
   info mechanics onto canonical Information Expression dimensions, bridging the engine's internal
   game-form archetypes (GF1..GF11) to the 6 canonical ecological Game Archetypes.

## HISTORICAL — what shipped in the information-expression arc (June 2026; newest first)

_Superseded by CURRENT DIRECTION above. Kept for provenance._

- `6cb92d3` "opportunity window"→"window" translation + captured the CCS five-question test, the
  "translation is a stopgap" principle, and the **Coach Communication Architecture** (deferred) in
  `docs/COACH_COMMUNICATION_STANDARD.md`.
- `af18b35` CCS §5 jargon translation in `compressActivityForCoach` (player structure logic→dropped,
  connected advantage→advantage, decision window→window, remain live→stay live, disrupts structure→
  disrupts the shape).
- `936c0ec` Captured Coach Communication Standard spec (`docs/COACH_COMMUNICATION_STANDARD.md`) + one CCS
  guardrail in the info-expression directive.
- `619cb84` `environmentalRealizations` on the 4 info constraints + directive presents them as "pick ONE,
  build around it" + strip-test.
- `4297144` `informationExpressionDirective` in `build-activity-skeleton.ts`, injected into the assembly
  prompt (elevates a selected info constraint to the core problem).
- `fbdc247` **Intent gating** (the lens-coupling fix): info constraints' `targetAffordancePrimary` →
  `"perception"`; parser Group K `matchesInformationIntent`; `INFORMATION_INTENT_BONUS=12` in selection.
- `6f21a1b` broadened info-intent "read" vocabulary (Bonus B).
- `cde6bf9` the 4 information constraints (Variable Target Condition, Multi-Goal Read, Blind-Side Entry,
  Disguised Restart); Pre-Scan rejected (Observation-layer, per Christian).
- `933da90` route "attack before they recover/exploit disorganization" → Transition (Group H).
- `3201d8f` Challenge Calibration (`challenge-calibration.ts`) — Comfortable/Stretch/Demanding per-
  dimension directives injected into the assembly prompt.
- `5f272b9` **GF11 "Recover & Reorganize"** archetype + recover routing.
- `63e658f` split Protect Space from Recover (drop Recovery tagalong) + recover-after-loss coverage.
- `1a8d29f` restore/re-establish → recover. `cc43b6b` Selection Debug candidate rankings.
- Design docs: `0954e18` ARCHITECTURE_ROADMAP, `17928be` CONSTRAINT_INCENTIVE_FRAMEWORK,
  `10d61d2` INFORMATION_EXPRESSION_REVIEW.

## HISTORICAL — state of play during the information-expression arc (June 2026)

_Superseded by CURRENT DIRECTION above._

- **Game Problem resolution / selection: solved & stable** across Christian's rounds (incl. challenge
  levels). Recover & Reorganize validated end-to-end (8D).
- **Information SELECTION: solved** (8D.2/8D.3) — info-intent goals select the info mechanisms; pure
  space/possession/defensive goals don't.
- **Information EXPRESSION: in progress.** 8D.3: the directive made the AI *talk* about reading but not
  *instantiate* it; fix = `environmentalRealizations` (619cb84). **Awaiting Christian's re-test (≈8D.4)**
  of whether activities now build the perceptual problem into the environment (e.g. late-changing
  target actually changes during play). This is the live frontier: **knowledge-library enrichment**
  (concrete environmental realizations per mechanism), not reasoning.
- **8D.3 RETEST (Christian's latest, 2026-06-17): reasoning engine confirmed stable** — routing, game-
  problem/affordance/archetype selection, and environmental realization all felt solid; Information
  tests routed cleanly through the info pathway (didn't collapse into the control). **The friction is now
  COMMUNICATION, not selection** — he named it the **Coach Communication Architecture** (see below).
- **Two emails to Christian (signed Joe) drafted but NOT confirmed sent**: (a) the `af18b35` jargon/deploy
  reply; (b) the reply agreeing to capture the CCS principle + defer the Communication Architecture pass.
  Check with Joe what's been sent.
- **Christian's deploy-check list** (phrases that must be GONE to confirm latest build): player structure
  logic, connected advantage, decision window, remain live, opportunity window / slot-mechanic phrasing.
  All now translated out (`af18b35` + `6cb92d3`). "Two-sided Contest" still appears — deliberately left
  for the architecture pass (not the deploy check), per Christian's "no growing substitution list."
- **NEXT round (2026-06-17): engine stable AGAIN; new finding = realization DIVERSITY.** 6 generations
  read as ~3 underlying positional ideas (central density / wide-zone / timed) with parameter+wording
  variation, not 6 distinct representative environments. Christian's hypothesis: Activity Assembly
  converges too fast on one familiar structure instead of exploring the richer routed-out candidate
  constraints the Selection Debug shows. → new workstream "Representative Realization Diversity".
  Residual jargon still leaks ("Player structure logic", "Two-sided contest", "the picture closes", "the
  window after a possession change" — last one is an artifact of my own `decision window→window` sub).
  ROOT CAUSE: `winCondition` is HARDCODED at `completion.service.ts:669` ("Teams compete live under
  two-sided opposition... the opponent inherits the connected advantage...") — jargon baked in at the
  SOURCE, so the output-stage substitution layer is the wrong place for it. Setups also still describe
  DESIGN INTENT not a concrete picture. All of this reinforces the deferred Communication Architecture
  pass + source-level cleanup; per Christian, do NOT keep growing output substitutions. No code changed
  this round (honoring "don't change anything yet during validation").

## ✅ DONE — Batch 2 review (the reasoning trilogy)  _(historical; completed 2026-07-06)_

Christian delivered Batch 2 (2026-06-30). Deliverable = **Joe's implementation-perspective review**
(same as the Batch 1 review), then a reply **signed "Joe."** Do it in THIS project (deep context), not cold.

- **Files** (loose in Downloads): `C:\Users\Administrator\Downloads\Reasoning Models.docx`,
  `Design Weighting Methodology.docx`, `Deterministic Design Logic.docx`.
- **How to read .docx** (pandoc is NOT installed; the Read tool can't open .docx): extract via python
  zip/XML — `python` → `zipfile.ZipFile(f).read("word/document.xml")`, regex out `<w:t ...>(.*?)</w:t>`
  joined per `</w:p>`, write UTF-8 to scratchpad `.txt` (console cp1252 chokes on unicode arrows — write
  files, don't print), then Read those. (Or use the docx skill's `extract-text` if available.)
- **Review lens** (Christian's five questions): responsibilities/boundaries clear? ambiguities that make
  implementation hard? does it over-constrain implementation? simplifications preserving responsibilities?
  places that make future expansion unnecessarily hard? Ground every point in how selection ACTUALLY
  behaves — that's the value.
- **Trilogy ↔ engine mapping** (the spine of the review):
  - **Reasoning Models** ≈ candidate generation → `deriveInputConstraints` (signal groups A–K produce
    candidate archetype/lens/constraint POOLS; "supported Design Possibilities" = the routed-out
    alternatives visible in Selection Debug).
  - **Design Weighting Methodology** ≈ the scoring/suitability layer → `generateSelection`: token-overlap
    + bonuses (`+10` targetMatchesSelectedLens, `+6` archetypeAffordance, `+3` recommendedConstraintType,
    `+12` INFORMATION_INTENT_BONUS), `BOUNDED_SEARCH_TOP_*` (top-2/3 per bucket), role-mix. **Watch here:**
    the representative-diversity ceiling and the lens-coupling limitation both live in this layer.
  - **Deterministic Design Logic** ≈ the single repeatable commitment → the bounded search choosing ONE
    package + deterministic tie-breaks (`orderRank` candidate order, then game_form_id). Determinism is
    already real in code — check the doc's commitment model matches what the engine guarantees.
  - (Coach Communication ≈ compress-activity-output / CCS — Batch 2 may reference it.)
- Batch 1 review + how Christian responded (froze Batch 1, resolved 2 findings) is in memory
  `knowledge-core-architecture.md` — mirror that review style. NO code changes (architecture docs).

## HISTORICAL — open/offered next steps as of early July 2026

_Superseded by 'What to work on next' in CURRENT DIRECTION above._

0. **Coach Communication Architecture — the named next MAJOR pass (DEFERRED until engine validation
   finishes).** Christian's 8D.3 conclusion: the engine is stable; the remaining friction is how output
   is organized for coaches (sections lack single responsibility; concepts repeat across Objective/
   Setup/Rules/Scoring/Win; internal language still surfaces; you must read the whole activity to picture
   the game). Fix = single-responsibility sections + a board/video-game information hierarchy (objective
   → accomplish → organization → rules → score → win). **Do NOT build during the current validation
   cycle** — Christian wants engine validation finished first so it isn't mixed with communication
   changes. Spec in `docs/COACH_COMMUNICATION_STANDARD.md`. **Principle to hold:** stop growing the
   one-off phrase-substitution list — solve it structurally.
1. **Source-level removal** of "connected advantage" / "decision window" so they're never *generated*
   (currently only translated at output). Touches `completion.service` winCondition, `build-constraint-
   package`, `slot-mechanics-variations`, `build-activity-mechanics` "Player structure logic:" label
   (careful: that label is parsed back in build-activity-mechanics — translate, don't blindly delete).
1b. **Representative Realization Diversity (Activity Assembly).** Christian: 6 generations collapse to ~3
   familiar positional structures with parameter/wording variation. Selection is deterministic (same goal
   → same package) and the 3 parallel slots vary along limited axes (see `emphasis-variation-profile.ts`
   + `slot-mechanics-variations.ts`); the richer routed-out candidate constraints (visible in Selection
   Debug ranking) aren't drawn on. Direction: have the parallel slots intentionally realize DIFFERENT
   representative constraints/structures (use the routed-out alternatives) rather than re-parameterizing
   one structure. Ties to the long-standing Output-Diversity ceiling. Likely a post-validation assembly
   pass (don't build mid-validation).
2. **Couple Demanding challenge level → info mechanisms** (needs constraint-pool injection from
   challengeLevel; `deriveInputConstraints` only sees goal text today).
3. **Title-gen validation edge case** Christian saw ("title contains session-role scaffolding"),
   self-resolved on regen — investigate if it recurs.
4. **Fallback if expression still falls short:** give information problems their own archetype(s) like
   GF11 (Christian's hypothesis — info mechanics aren't game forms). Try the realizations first.
5. **CCS** (`docs/COACH_COMMUNICATION_STANDARD.md`) is a STABLE future spec — adopt gradually whenever
   already refining Activity Assembly; NOT a milestone. Christian was explicit about not derailing.
6. **Knowledge Core code-alignment (FUTURE, not now).** Christian shipped the foundational architecture
   (the "Knowledge Core" — Batch 1 of 4 finalized 2026-06-29; see memory `knowledge-core-architecture.md`).
   It's implementation-agnostic by design (data structures/APIs are ours), so NO immediate code change.
   But it predicts a real seam: under its now-crisp boundary, our single `constraints.ts` is actually two
   libraries wearing one coat — **Environmental Manipulation Objects** (modify environmental *properties*:
   Small Area, Central Density, Zone Structure, Neutral Player, Wide Zone, Transition Trigger, AND the
   information mechanisms Variable Target / Multi-Goal Read / Disguised Restart / Blind-Side = information
   availability / starting positions / goal structure) vs **Constraint Objects** (regulate *interaction*:
   scoring, time, restart, consequence, participation — the Bonus/Reward/Window items). When we align
   code to the Knowledge Core, `constraints.ts` splits along that line. Also coming (Batch 2 "System
   Reasoning"): Reasoning Models → Design Weighting Methodology → Deterministic Design Logic — maps onto
   what we call selection (deriveInputConstraints + generateSelection). The architecture also now names a
   **Coach Communication Architecture** document, which is the formal home for the deferred comms pass (#0).

## Reference

- Debug tools (on this branch's preview, ungated): `/debug` Selection Debug page + generator "Show debug
  trace" toggle. No-AI selection harness: `back/src/scripts/run-selection-pipeline-tests.ts`.
- Email-attachment PDFs (current): `C:\challenge-point\email-attachments\`
  (Information_Expression_Review.pdf, Constraint_and_Incentive_Framework.pdf).
- Memory: `MEMORY.md` (index) → `architecture-roadmap.md` (most current, the full arc),
  `knowledge-core-architecture.md` (Christian's foundational architecture, Batch 1 + review),
  `round7-game-problem-findings.md`, `round2-closure-ontology.md`, `project_architecture.md`.
- Christian's Knowledge Core docs (Batch 1, finalized RC1) are in `~/Downloads/` (`.docx`); they define
  the stable architecture the software builds toward — NOT current coding tasks.
