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
3. **You CANNOT run AI generation here (no `OPENAI_API_KEY`).** So: the deterministic layers
   (parser/selection/post-processing) ARE verifiable by you; anything about the *generated activity text*
   (does the AI express X?) needs **Christian's field validation** — be explicit about that boundary in
   replies.
4. **Verify changes with:** from `back/`: `npx tsc --noEmit -p tsconfig.json` and `npm test` (**20 unit
   suites** as of 2026-07-26; `deriveInputConstraints.unit.ts` is the main routing test — extend it when you
   change routing). Front-end changes: `npx tsc --noEmit` from `front/`. Behaviour-preservation gate for engine changes: the selection-pipeline `bestScore`
   sequence must stay **`68,64,94,115,91,68,64,94,115,91,97,84`**.
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
| **Approved observation vocabulary collected after use** | ❌ widget takes thumbs + *freeform* comment; replacing that with the 8 codes is the small, high-value next build |
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
