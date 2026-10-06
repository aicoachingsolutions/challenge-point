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
`build-activity-mechanics`, `completion.service.generateAssemblyPolishPrompt` plus a short payload;
`generateAssemblyPrompt` has had no caller since 7 May, see the 14 Sep audit) → validation →
`compress-activity-output.compressActivitiesForCoach` (coach-facing post-process; this is the prod
coach-output path — `map-activity-to-coach-view.ts` is NOT used in prod, only a test script).
**Key architectural belief:** Game Problems organize; archetypes are structural templates; constraints +
incentives are the PRIMARY shapers of the affordance landscape (not archetypes).

## PATH TO PILOT CHECKLIST RC4 — worked through 2026-09-08

Christian sent a seven-document pilot package and asked for the remaining checklist items, then the
pilot release. **Sections 1–4 are now implemented; the release decision is Joe's and Christian's.**

Everything below was found by **generating activities and reading them**, not by reading code. Each
item names the sentence a coach was actually shown, and each is pinned by a test using that sentence.
`back/src/scripts/run-coach-view-audit.ts` is the tool — it audits the **route layer** (map to legacy
→ `compressActivitiesForCoach`), because that is the only shape a coach ever sees, and it takes
`SLOT_INDEX` / `FIELD_LENGTH` / `FIELD_WIDTH`.

### §2 Communication — `coach-communication-standard.ts` (new)
Enforces Christian's CCS RC2 as a **grammar pass**, separate from `translateCoachLanguage`, which is a
vocabulary dictionary. Wired into `compress-activity-output.ts` AFTER translation. Unit tests use his
Appendix B examples verbatim. Going green proved nothing — real generation still shipped:
- `howToPlay` never went through the standard → "Teams aim to exploit the central corridor".
- Clause removal truncated authored text → "…blind side counts more, so." Repair is now per sentence.
- Orphaned determiners → "…possession change; the the." and "the free the ball carrier adapts timing".
- **Design rationale** reaching coach fields verbatim — one Constraint section was 70 words of it.
- Objective sections **emptied** by the strict pass. `applyStandardToRequiredSection` now falls back to
  unwrapping for the five sections in Christian's table; sections outside it stay strict.
- `scaffolding` is **deliberately exempt** — coachingFocus is the one section allowed to describe
  perception. Do not "fix" it.

### §1 Session Planning
- **Surface Type removed.** Its only consumers were an unlabelled `"330x160 grass"` string and
  `selectAffordances`, which has no callers.
- **Metric-first dimensions — and a real defect underneath.** The form asked for **feet**, defaulting
  to a full pitch (330×160); generation consumed the same numbers as the playing area with no unit.
  At that default, **two of three activities gave the coach no dimensions at all** and the third
  invented "a 40x30 yard area". Stating the unit in the prompt did not hold either. Fixed the way
  `player-format.ts` was: `playing-area.ts` corrects it deterministically after generation. Zones keep
  their own size but gain the same units.
- **One learning intention.** Multiple goals were `join(' ')`-ed into a blend representing neither, and
  an activity generated from a blend cannot be attributed to a learning goal afterwards. Detection is
  conservative — bare "and" and commas are NOT separators. The **guided path is exempt** (it picks one
  goal from the registry; its composed string is one intention in three sentences).
- Planning redundancy review: the guided flow (goal / situation / stage / team) is already clean.
  Guided and free-text are mutually exclusive, so Duration is not asked twice.

### §3 Scoring
The structure was already right — one primary condition plus this slot's variation. But every
scoring-placement modifier was written around **"regains"**, so when the primary rewarded something
else the coach got two reward systems in one paragraph ("Earn a point for … break a defensive line.
The field is treated as three value zones: regains in the central zone count higher…"). Measured in
**two of three slots**. The six lines now say "points earned"; guarded by a test that fails on all
three original phrasings.

### §4 Feedback infrastructure
- **"Activity selected" and "Session completion" were not collected at all.** Selected carries the
  **slot**, which is the only observable for the pilot's variety question.
- Two new post-practice questions (`PracticeReportPrompt`, `POST /practice-report`): *"Did you modify
  the activity?"* and *"Did your players discover an unexpected way to succeed?"*
- **`coach-event-wiring.unit.ts`** pins the three-way contract: declared / fired / counted. Any two
  without the third looks healthy and reports zero — which is how `activities_viewed` sat at zero.

### Christian decided all three on 2026-09-10 — implemented the same day
He also gave the test that now governs every coach-facing sentence: *"If a coach wouldn't naturally
say it before starting an activity, the activity probably shouldn't say it either. The engine should
perform the educational reasoning."*

1. **Six sections: Objective, Setup, Rules, Scoring, Win Condition, Equipment.** Constraint and
   Coaching Focus are off every coach screen (still *produced* — the validator requires both; see
   below). How to Play folds into Rules. Teams + group size sit behind "More detail".
   `front/src/components/ActivitySections.tsx` is the one definition every surface uses.
   **Correction owed to him:** my section inventory called the Teams section "Extensions", because
   the data field is `extensions[0]`. It holds the TEAM STRUCTURE, not progressions — there are no
   progression-style extensions anywhere. He decided "optional" on the basis of that label.
2. **"Was it immediately clear how teams score?"** Answer label "Needed to reread". Answers are
   tagged `successClarityQuestion: 'how_teams_score'`; only tagged answers are tallied.
3. **Objective = "what are we working on today?"** Root cause was a prompt line telling the model the
   objective "should describe the decision problem players read". Replaced with his three examples +
   his test, plus a deterministic fallback chain (generated → coach's learning goal → game-form
   objective). Measured: 27/27 generated, 0 fallbacks, 0 assembly retries.

**WHERE THIS LIVES, AND WHY — read before touching it.** Pipeline order is **map → validate →
compress**. The validator builds its opposition/consequence/decision narratives FROM `winCondition`,
`constraint`, `intent` and `coachingFocus`, and requires `scaffolding`, `extensions`,
`equipmentNeeded` to exist. So every change is in `compress-activity-output.ts` (via
`coach-facing-sections.ts`), AFTER validation. Do NOT "clean up" those fields upstream — that is how
the 2026-08-16 outage happened.

**Also found by reading output, fixed:** Setup stating its own scoring method (three answers to "how
do teams score?" in one activity); Win Condition never saying when play ends (`duration` now set);
Equipment one hedged line on every activity (now read off Setup); model paraphrases of what the sport
guarantees leading Rules; and five squad-count gaps in `player-format.ts` (noun "neutrals", uncounted
neutral sentences, "has an extra player", "teams of 6" without "players", "6v6, with the team of 7").

### 2026-09-11 — his design rule, and rules in coach voice

**THE RULE HE WANTS KEPT BEYOND THIS RELEASE:** *every section answers one question, and only one.*
Objective = what are we working on today · Setup = how do I organize it · Rules = what do players
have to do · Scoring = how do teams score · Win Condition = when does it end and who wins ·
Equipment = what do I need. *"Whenever a section begins answering another section's question,
confusion seems to follow."*

- **Rules are TRANSLATED, not rewritten** — `coach-rule-voice.ts`, 18 templates (10 exchange rules,
  6 rule-placement modifiers, 2 affordance lines). **Do not "simplify" the engine sentences.**
  `hasExplicitTwoSidedExchangeRule` / `rulesPreserveInteractionExchange` check the exchange rule
  against the constraint package, and the validator needs it verbatim in `rules[0]`. Translation runs
  in compress, after validation. Coverage is pinned: a test walks `EXCHANGE_RULE_BY_ARCHETYPE` and
  every rule-placement modifier and fails on any that lacks a translation.
- **Teams removed entirely** (not optional): Setup already answers its question. The whole "More
  detail" expansion went with it. `extensions` is still produced — the validator requires it.
- **Live screen has no observation panel** for the pilot: *"empty reserved space"* doesn't communicate
  confidence. It returns when the observation layer does something.

### 2026-09-12 — Scoring translated; communication work is COMPLETE

Scoring got the same treatment (15 more templates). `coach-rule-voice.ts` → **`coach-voice.ts`**,
covering both sections. **Trap for the next person:** by the time scoring reaches this pass,
`toCoachScoringVoice` (coach-section-ownership) has already rewritten "Score awarded for…" to "Earn a
point for…" — so match fragments must start AFTER the verb phrase. Anchoring on the engine's opening
silently matched nothing, and only reading generated output caught it.

### THE NEXT PHASE IS HIS: representative IDENTITY, then DIVERSITY

His new validation questions, which should replace "is this a good activity?":
1. *"If the title and Learning Goal were removed, could an experienced coach correctly identify the
   intended coaching problem from the activity itself?"*
2. *"Would a coach genuinely view these as three different representative ways of coaching today's
   problem?"*

**Evidence gathered 09-12 — `run-archetype-distribution.ts`** (26 real coaching intentions through
selection; deterministic, no AI, runs in seconds):

| | |
|---|---|
| Reached | Directional Possession 27% · Channel 27% · Transition 15% · Finishing 12% · Pressing 8% · Positional 8% · End Zone 4% |
| **Never reached** | **Overload · Target · Constraint-Driven Free Play · Recover & Reorganize** (4 of 11) |

This **partly contradicts** his impression: the spread is wider than "overwhelmingly directional with
end zones", and **Finishing Games IS selected** for explicit finishing intentions — generating one
produces goalkeepers and goals.

**THE IDENTITY DEFECT, IN ONE LINE.** That finishing activity's Scoring reads *"Earn a point for
attacking the open space before the defence recovers."* The scoring condition is picked by the
AFFORDANCE FAMILY (`affordanceFamilyHints` in build-activity-skeleton.ts), not by the coaching
problem or the game form — so a finishing game rewards space exploitation. This is also checklist
RC4 §3's third bullet ("scoring reinforces the learning goal"), which I earlier reported as done on
the strength of the first two bullets. **Not fixed: what an activity rewards is a representative-design
decision, and `incentive_patterns` is his to author.**

### 2026-09-12 — Christian's Representative Activity Family Reasoning Architecture (RC1)

His proposal (`Downloads/…Activity Family Reasoning Architecture (RC1).docx`): a new reasoning
dimension, **parallel to the Affordance Target Profile**, that owns an activity's *organizational
identity* — starting conditions, player/directional/transition organization, interaction landscape,
and **the primary success and scoring condition**. Affordances keep "what should players perceive";
Families take "what success fundamentally represents". Families have Realizations (his example:
Goalkeeper Build-Out realized as full goals / end zones / central overload / multiple targets /
staggered pressing). He asked whether it is the right architectural explanation — **answered, not
implemented.** Evidence gathered, all re-runnable:

| Claim in his doc | What the code/data says |
|---|---|
| "commits a single highest-ranked family" | True. `TestLibrarySelectionResult` holds ONE archetype; diagnostics: *1 structure across 3 activities*. The 3-slot variation is what his doc calls **parameter** diversity (multipliers, timing windows, footprint). |
| "engine already computes multiple candidate designs" | True. `run-structure-diagnostics.ts`: **74%** of planning cases have a viable alternative game form within 2 points; 19% exact ties. |
| affordances own "one responsibility too many" | True. Primary scoring comes from `affordanceFamilyHints`. Finishing Games' authored incentive pattern: *"bonus for achieving target outcome linked to affordance"*. |
| identity needs another layer | **Strongest support.** None of the 17 Game Problems is about converting a chance — they're sport-universal by design. Finishing vocabulary routes to GP-006 *Establish Functional Object Control*; Finishing Games links GP-005 + GP-002. Identity cannot live in the GP layer without breaking its universality → it belongs in the **sport layer**. |
| "an extension, not a redesign" | Supported. `game_forms` already has `scoring_structure_type`, `restart_structure_type`, `opposition_structure`, `compatible_realization_group_ids` — **empty on all 11 rows, read by nothing**. Filled: `directionality_type`, `interaction_structure`, `role_structure`, `primary_game_problem_ids`. |

**Why his experience differs from the free-text distribution:** through the GUIDED planning path
Directional Possession is **45%** (free text: 27%). "Play Out from the Back / Through Wide Area":
Directional 8, Positional 7, End Zone 4, Channel 4 — decided by one point.

**Two decisions raised with him:**
1. **Family vs game form.** His realizations (end zones, overload, targets, pressing) ARE today's game
   forms, so a Family sits ABOVE game forms in practice — sharpen "does not replace Game Archetype
   Reasoning". Recommended: Family as its own sport-module object, realized through compatible game
   forms. **Naming collision:** the workbook `realizations` sheet (23 rows) is actually constraints/EMs
   ("Progression Bonus", `INTERACTION_REGULATION`, no game-form or GP links) — rename one before
   authoring begins.
2. **ATP sequencing.** The ATP is still SHADOW (`generateSelection.ts:902`, "no selection influence").
   "Parallel to the ATP" in practice means adding Families to the live candidate evaluation while the
   ATP stays shadow. Recommended: Families go first.

**Proposed integration:** Family as a scored dimension in `generateSelection`'s existing joint
evaluation; return top candidates from DISTINCT families within a viability margin instead of one
winner; Family supplies the primary success/scoring condition, affordance + slot incentive modulate
how it is achieved. **Guard: identity before diversity** — when one family clearly wins (26% of
cases), three realizations of it beat three families where two are weak. Families and their success
conditions are HIS to author; the object, loader and selector dimension are ours.

### 2026-09-12 — Representative Performance Context Library RC1: INGESTED, not wired

Christian named the layer **Representative Performance Contexts (RPCs)** and delivered the package:
Library (narrative, 8 contexts), Workbook Standard (implementation contract), Workbook (canonical).
**His decisions:** RPCs sit ABOVE Representative Game Forms (game forms become realizations); **no
renaming for pilot** despite the `realizations` sheet collision; RPCs enter selection BEFORE the ATP.
Workbook schema is FROZEN.

The 8 contexts: Goalkeeper Build-Out, High Press Escape, Attack Development, Chance Creation,
Finishing, Counterattack, Counter-Press, Attack Prevention.

**Where it lives:**
- `back/data/sport-modules/soccer/rpc-workbook.rc1.xlsx` — his audited original is commit `3c053a6`;
  the next commit applies mechanical staging resolution (round-trip verified cell-identical elsewhere).
  **Superseded by `rpc-workbook.rc1.1.xlsm` on 2026-09-13 — see the RC1.1 section below.**
- `resolve-rpc-staging.py` → `rpc-staging-resolution.json`; `project-rpc-workbook.py` →
  `src/system/sport-module/rpc-library.rc1.json` (never hand-edit).
- `src/system/sport-module/rpc-library.ts` — loader + `validateRpcLibraryIntegrity` (fail-loudly gate,
  10 mutation tests prove it fails). Declared in SPORT_LAYER_FILES: it is sport-specific by design.
- `src/scripts/run-rpc-coverage.ts` — what context-gated selection would reach. Run it first.

**Resolution was EXACT ONLY** (his Standard: Principle 6 Fail Loudly; the Library: "omit rather than
invent"). 55 of 133 resolved: Game Problems 27/33, Game Forms 22/30, Learning Goals 6/27, Affordances
0/43. **Staging is not "just unresolved references" — most name objects that don't exist:**
- **"Full Goal"** — PRIMARY game form for 5 contexts; no such game form.
- Game Problems **Create Numerical Advantage, Delay Progression, Recover Organization** — not among the 17.
- 21 learning-goal candidates are coach phrasings, not the 11 guided goals.
- **No canonical affordance-target library** exists at "shooting lane" granularity.

**Consequences (from run-rpc-coverage.ts):** 5 of 11 guided goals reach NO context (A04, D03, TA02,
TD01, TD02); **Attack Development and Finishing are reachable from no guided goal**; 6 of 11 game
forms fit NO context (End Zone, Overload, Target, Pressing & Regain, Constraint-Driven Free Play,
Recover & Reorganize); **Directional Possession is compatible with 7 of 8 contexts**, so gating alone
will not reduce its dominance.

**Also blocking selector integration:** the workbook holds scoring IDENTITY ("scoring should reward
successful attacking establishment rather than possession alone"), not scoring CONDITIONS a coach can
read. Turning identity into a concrete condition per game form is authoring. And `generateSelection`
receives only goal TEXT — `planning.learningGoalId` never reaches it; plumb that first.

**NEXT (after his answers):** plumb learningGoalId → RPC dimension in candidate evaluation → strongest
viable contexts, identity before diversity → context supplies primary scoring. Expect the behaviour
gate to change deliberately; record it as gate v3 with before/after.

**Behaviour gate re-verified 2026-09-10: `70 68 98 119 94 99 86`.** Sport-coupling ratchet 35.
42 unit suites.

### 2026-09-13 — RC1.1: routing closed, Session Planning combined, scoring question answered

Christian resolved audit Action Items 1–3 and sent three canonical files (RPC Library RC1.1 docx, RPC
Workbook RC1.1 `.xlsm`, Session Planning Model RC1.1). **His decisions:**
- **Game forms:** Full Goal removed; exactly the eight mappings verified on 09-13; "Finishing Games".
  "One Primary Game Form per RPC is sufficient."
- **Game Problems:** ontology NOT expanded. The three non-canonical GPs are removed, not remapped.
  RPC-007 Regain Possession PRIMARY / Protect Space SECONDARY; RPC-008 the reverse.
- **Learning goals:** two NEW canonical guided goals, **A05 Progress the Attack → RPC-003** and
  **A06 Finish Attacks → RPC-005**. The full 13-goal routing is stated twice: a new SPM sheet
  "RPC Routing", and LEARNING_GOAL staging rows in the RPC workbook. Coach phrasings stay in the
  Library narrative; normalising Learning Goal ownership is explicitly deferred beyond RC1.1.
- **Scoring (Action Item 4):** no canonical change. He asked US whether assembly already exposes a
  discrete primary observable scoring event (answered below).

**Where it lives:**
- `rpc-workbook.rc1.1.xlsm`, received verbatim in commit `33b21a7`, resolved in place next commit;
  replaces `rpc-workbook.rc1.xlsx`. No VBA project in it. The resolver saves with `keep_vba` so the
  package stays macro-enabled. Two new narrative sheets, "RC1.1 Resolutions" and "RC1.1 Audit", are
  not projected.
- **Exact resolution: 62 of 105.** Game Problems 27/27, Game Forms 22/22, Learning Goals 13/13,
  Affordances 0/43; 70 Relationships. Runtime stays PROPOSED on the affordances alone.
- **The resolver now APPENDS to authored notes.** RC1.1 staging notes carry his "Canonical SPM ID: A01";
  the RC1 resolver overwrote the notes column. A test checks each stated id equals the resolved one.
- **The gate cross-checks routing both ways:** SPM RPC Routing ↔ ACTIVE LEARNING_GOAL relationships.
  The route is stated in two places, so disagreement is a defined failure.
- Loader exposes `libraryVersion` (RC1.1), distinct from the frozen `schemaVersion` (RC1).

**THE SESSION PLANNING FILE WAS BUILT FROM THE ORIGINAL RC1, NOT FROM CYCLE 8.** It had 19 entry
phrases where the canonical had 69 before RC1.1. The nine approved Engine Translation mappings read
TBD, and so did the intentional EMPTY gaps A01/A04.
`back/data/session-planning/apply-rc1.1-package.py` takes the received file as base and restores
Cycle 8 content. It stops on any conflict (none found) and reads Cycle 8 from git ref `33b21a7`.
Report: `rc1.1-package-application.json`; received original:
`back/data/session-planning/received/`. **Asked Christian to adopt the combined workbook as
canonical.** Result: 13 goals, 76 phrases, 13 translation rows (9 mapped, A01/A04 null, A05/A06 TBD),
13 routes.

**Two traps caught before commit, both reading the diff:**
1. openpyxl `ws.cell(row, col, value=None)` IGNORES None, so an "empty" decision silently kept the TBD
   placeholder. Assign `.value` instead.
2. The first version read "Cycle 8" from the canonical file it overwrites. After one faulty run, the
   rerun read the fault back as Cycle 8 and faithfully restored it. Sources must never be the
   script's own output.

A test now pins A01/A04 = null vs A05/A06 = 'TBD'.

**Coverage (`run-rpc-coverage.ts`):** all 13 goals reach exactly the context SPM names; every context
is reachable. Game forms fitting no context are unchanged (End Zone, Overload, Target, Pressing &
Regain, Constraint-Driven Free Play, Recover & Reorganize).

**Coach-visible:**
- A05/A06 appear in the guided goal list, which is API-driven, and `goal-support` measures both
  as supported.
- Typing "finish", "score" or "goal" now clarifies between A03 and A06.
- "shoot", "shot" and "convert chance" still go straight to A03, because Cycle 8 routed them there
  before A06 existed. Asked him.

**Action Item 4 answer: no discrete event exists.**
- `activity.scoring` is free text.
- The primary is picked AFTER generation by word ranking (`selectPrimarySuccessCondition`).
- The physical event is only implied by `buildScoringLines`' one template sentence per game form,
  several of them conceptual ("positional advantage", "transition space", "genuine scoring chance").

Recommended a `primary_scoring_event`:
- decided after realization but BEFORE text generation, from a controlled vocabulary (his six:
  goal / target player / line / target zone / gate / regain-under-condition);
- the game form supplies the available events and the context picks the valid one;
- Transition Games is why the game form alone cannot decide: Counterattack scores the attack,
  Counter-Press the disruption.

Knowledge needed: valid primary events per context (8 rows). Offered to draft them.

**Open with Christian:**
1. Adopt the combined SPM.
2. Move Cycle 8 finishing phrases to A06?
3. Mark the 43 affordance staging rows DEFERRED so the library can go ACTIVE ("PROPOSED = not active in
   runtime").
4. The scoring event design.

`learningGoalId` plumbing into selection does not depend on any of these.

**Behaviour gate unchanged `70 68 98 119 94 99 86`. 44 suites. Ratchet 35.**

### 2026-09-13 (later) — his RC1.1 decisions applied; primary scoring event draft

**Decisions, all applied in commit `1248f02`:**
- **He adopted the combined SPM** as canonical RC1.1. `apply-rc1.1-package.py` and the received file are
  retired (they remain in git history).
- **Entry Language rule, creation vs conversion:**
  - language about CREATING an opportunity → A03 Create Scoring Chances;
  - language about EXECUTING or CONVERTING one that exists → A06 Finish Attacks.
  - shoot, shot, shooting and convert chance moved to A06; get a shot stays A03; finish, score and goal
    keep disambiguating.
  - **Apply this rule to future Entry Language questions.** Script: `apply-rc1.1-decisions.py`.
- **RPC Routing column renamed "Routed RPC ID".** It names the context a goal routes to, not the
  relationship's strength.
- **43 Affordance Targets DEFERRED**, with his reason: "I do not want canonical IDs inferred simply to
  get the RPC Library into runtime."
  - The resolver skips DEFERRED/REJECTED rows, and the gate rejects a deferral without a note.
  - Script: `apply-rpc-rc1.1-decisions.py`.
- **Stale "Implementation Staging OLD" row removed** from the RC1.1 Audit sheet; no archive restored.
- **ACTIVE:** nothing is NEEDS_CANONICAL_ID any more, but runtime_status stays PROPOSED. He ties ACTIVE
  to approving the Context → primary scoring event rows, and a test fails when it flips.

**Primary scoring event, the agreed architecture (his words, 13 Sep):** Realized Game Form →
physically available scoring events → RPC / Primary Scoring Identity → selected primary scoring
event → activity generation → coach-facing How to Score.
- The event is decided after the realization is selected and BEFORE text generation, then given to
  the generator.
- Starting vocabulary: goal, target player, line crossed, target zone entered, gate, regain under a
  stated condition.

**Draft for his review:** `back/data/sport-modules/soccer/primary-scoring-events.rc1.1-PROPOSED.xlsx`,
written by `write-proposed-scoring-events.py`. Sheets: Event Vocabulary, Game Form Evidence, the eight
Context rows, 22 Context × Game Form pairs, Generated Evidence. The script fails if its pairs drift
from the workbook's compatible game forms.

**Evidence that settles WHY:** nine real activities generated on 13 Sep across Directional
Possession, Transition, Channel, Finishing and Positional Play.
- Seven setups marked a scoring object (end zones, goals with goalkeepers, halves). **None of the seven
  scored it.**
- Both finishing games had goals and goalkeepers, yet awarded "attacking the open space".
- Both counter-attack games awarded "winning the ball back", the counter-press side of the exchange.
- Scoring follows the affordance lens, not the organization.

**What drafting surfaced for him:**
1. **A stated condition is needed on most events, not only on regain.** Counterattack scores a goal
   inside a window; Build-Out counts from a goalkeeper start; High Press Escape requires keeping the
   ball after crossing. So the condition is an attribute any event can carry.
2. **Proposed SE-07 "Held":** the opponent kept from crossing a line or entering a zone for a stated
   time. Counter-Press ("rather than regain alone") and Attack Prevention need it. The Delay Reward
   realization and Recover & Reorganize Games already author it.
3. **Chance Creation:** zone entry is the closest proxy among the agreed events. Is "shot on target"
   better?
4. **Build-Out, High Press Escape and Attack Development share the same events.** Their difference is
   the condition, which matches the identity rules.
5. **Channel Games authors no scoring object** (channels are lanes), so 4 pairs need an end object.
   Finishing through Positional Play needs goals added. 16 of 22 pairs resolve outright; 1 needs a
   realization choice.
6. **Placement fits the frozen schema.**
   - Game form → the existing `scoring_structure_type` column, which is empty and read by nothing.
   - Context → Relationships (`related_library` SCORING_EVENT), with the condition as a Property.
   - Neither column is controlled vocabulary.

**Defect found while generating:** "Create better support angles under pressure." (Positional Play)
fails assembly 3 of 3 times with "Activity 2 missing skeleton mechanic: Opponent consequence emphasis…".
A coach typing it gets an error. Spun off as a separate task; **Codex fixed it in `a2ea0c1`.** The
fallback opponent-consequence sentence now carries its own signal words. Audited: 3/3 reruns assemble,
the behaviour gate is unchanged, and the learning-goal plumbing (`adc892e`) passed a bite proof.

### 2026-09-13 (evening) — Primary scoring events: approved, built, made ready, ACTIVE

**Christian's approval (13 Sep):**
- An event is scored with a qualifying condition, and any event can carry one.
- Seven events: goal, target player, line crossed, target zone entered, gate, regain, and **denial**
  (not "Held").
- No shot on target for Chance Creation.
- Counter-Press uses the existing 5-second window. Attack Prevention has no fixed window.
- Close the Channel gap and the Positional Play → Finishing gap rather than removing relationships.
- The vocabulary is "used with GA-001", with no ownership claim.
- "Validation should fail rather than infer."
- ACTIVE comes "once those changes are reflected and the validation passes".

**Codex started it in the STALE MAIN CHECKOUT** (`C:\challenge-point`, 61 behind origin/main).
- Its uncommitted files were left there untouched, then cleared on 14 Sep with Joe's OK: `back/src/system/primary-scoring/`,
  `back/data/primary-scoring/`, `.tmp-primary-scoring/`, edits to 7 files, and
  `back/_rc11-regression.*`.
- Not ported, and why:
  - a standalone JSON marked ACTIVE that duplicates the contexts;
  - setup checks that substring-match "area" and "goal";
  - regex parsing of condition prose;
  - sport-coupling pushed to 38.
- Rebuilt in the worktree in `e954541`. The main checkout was cleared on 14 Sep with Joe's OK.

**Where it lives:**
- **RPC workbook** (`apply-rpc-scoring-events.py`):
  - Controlled Vocabulary `scoring_event`: 7 events.
  - Relationships SCORING_EVENT: 24, where id order = his approved order.
  - Properties PRIMARY_SCORING_CONDITION: 8.
  - The gate requires at least one event and exactly one condition per context.
- **Soccer module** (`apply-game-form-scoring-structure.py`): `scoring_structure_type` lists the
  objects the authored setup marks, "none" for GF5/GF7/GF10. Regain and denial are derived, not listed.
- **`sport-module/primary-scoring.ts`:**
  - valid events ∩ available events, rotating per slot;
  - REALIZATION_COVERAGE: Channel attacking object for RPC-001..004 × GF7, Channel protected zone for
    RPC-008 × GF7, Positional Play finishing goal for RPC-005 × GF3;
  - COACH_RULES: coach wording, setup requirement and evidence for each context × event × object;
  - throws `PrimaryScoringResolutionError` rather than inferring.
- **`sport-module/context-selection.ts`:** gates a guided goal's candidate game forms to its routed
  context's declared forms, through the existing hint. `test-library/` is untouched.
- **Pipeline:**
  - skeleton setupFrame and prompt block;
  - `validate-activity-skeleton` requires the object in setup, as a whole word using the rule's own noun;
  - `buildScoringLines` puts the rule second, because the first line is validator-coupled;
  - `systemTrace.primaryScoring` records it;
  - compression pins it as primary, the slot modifier may follow, and other rewards are relocated.
- **Route:** applies only to guided goals AND only when `rpcLibrary.runtimeStatus === 'ACTIVE'`.
  Runtime is now **ACTIVE** (see "Made ready, then ACTIVE" below).

**Measurement** (`run-primary-scoring-coverage.ts`, deterministic):
- all 22 context × game form pairs resolve;
- ungated live selector: 9 of 13 guided goals land on a declared form, and A03 cannot resolve because
  it lands on Finishing Games;
- gated: 13 of 13 resolve.

**Real generation** (`PLANNING_GOAL_IDS=… SLOT_INDEX=all run-coach-view-audit.ts`, 13 goals × 3 slots):
- 13 of 13 assembled; all 39 activities score on their resolved event; 0 wording violations.
- Counterattack scores goals or the end line within the countdown, Counter-Press scores regain or
  denial, and Finishing scores goals.

**Retries, diagnosed and fixed.** The first run had 12 of 13 assemblies retry, and Play Out from the
Back failed outright on a rerun. Every first-attempt failure was the setup check: the model omitted or
renamed the object ("end zones" where scoring said "finishing zone").
- Fix, deterministic before generative: `withScoringObjectInSetup` (validate-activity-skeleton.ts),
  called in the completion.service merge, appends the setup requirement when the model's setup does
  not mark the object.
- The prompt now gives the sentence to copy word for word.
- Final run, 13 goals × 3 slots: **0 of 13 failed; 2 of 13 retried**, both on the pre-existing
  "Interception Reward" consequence requirement, unrelated to scoring. All 39 activities score on
  their resolved event, with 0 wording violations.

**Made ready, then ACTIVE (13 Sep, late).** Christian's question for every activity is "was it
immediately clear how teams score?". Everything below was found by reading real generated activities
slot by slot. Five further runs of 13 goals × 3 slots; each showed something the previous audit could
not.

- **One way to score in what a coach reads** (`activity/scoring-object-consistency.ts`, called in
  compression only when an activity carries a resolved event):
  - Setup, Rules and Objective lose any scoring object nothing scores on ("Teams attack the end
    zones" in a line game). Only the clause or noun phrase is cut, so area and team format survive.
  - Restart references are rewritten: "from the defensive end", "after a score".
  - Lines awarding their own points go: "Goals from overloads earn 2 points", "Weighted scoring…",
    "wide channels that provide scoring bonuses", "…to score".
  - "No zones" beside a marked zone goes.
  - The slot's "A regain only counts…" leaves games that score no regain.
  - Four real runs (156 activities) are fixtures in `scoring-object-consistency.unit.ts`.
- **Setup carries what Scoring needs, sentence by sentence** (`withScoringObjectInSetup`):
  - The object check ignores words used in passing. All three Finishing setups had passed on "Restart
    with a goal kick" and marked no goal.
  - A sentence naming no object (the Counterattack countdown, the Counter-Press count) must appear as
    written. The model had skipped "pick a countdown" while Scoring said "before the countdown ends".
- **Every Scoring leads with "Earn a point".** The build-out start, press start and count follow.
- **Setup wording:**
  - Counter-Press regain marks an escape line.
  - Attack Prevention reads "Mark a protected zone at each end".
  - Finishing is "Put a goal at each end." Goalkeepers stay in the rule.
- **Rules addressed to the coach** ("Encourage…", "Ensure…", "Monitor…", "Reward…") leave Rules
  (`coach-section-ownership.ts`).
- **Route:** a guided goal that routes to a context is no longer refused as a known gap, so guided Play
  Out from the Back and Beat Defenders 1v1 generate. The same words typed as free text still get the
  known-gap answer.
- **No guided goal depends on the model's wording for its constraint requirements.**
  - The failure: Win the Ball Back and Defend 1v1 retried in every run on Interception Reward, and Win
    the Ball Back failed outright once.
  - Measured without the model: system-written text met 111 of 117 selected-constraint requirements.
    All six misses were Interception Reward, whose intent is "Win the ball back" while the requirement
    also names "Reward defensive interceptions".
  - Fix: the constraint line (not coach-facing since 10 Sep) now follows a terse intent with its
    description. That gives 117 of 117, and `guided-goal-constraint-coverage.unit.ts` holds it for
    every guided goal.
- **RC1.1 ACTIVE:** `apply-rpc-rc1.1-active.py`, then `project-rpc-workbook.py`. That changed 9 cells:
  Metadata plus 8 Registry rows. `rpc-library.unit.ts` asserts ACTIVE.

- **What cutting used to leave behind** (found in the last two runs):
  - A sentence that cannot be cut clean of an unscored object, and is the only place the area is
    stated, keeps just its format ("Play in a 40 x 30 m (44 x 33 yd) area.").
  - A cut no longer strands a participle ("Two teams of 6 players each, defending.") or keeps a list
    count ("three zones: a central zone.").

**Final real run** (13 goals × 3 slots, RC1.1 ACTIVE, all fixes in), read slot by slot:
- 39 of 39 activities; 0 retries, 0 failures; 0 wording violations. It is the first run of the day
  with no retry.
- Every Scoring leads with its "Earn a point" rule.
- Every Setup marks the object it scores on and no other.
- Goal games list goals in Equipment.
- The countdown and count are defined wherever Scoring uses them.

**Still open (not blocking):**
- Model phrasing outside scoring that the cleaning leaves alone: "Play 7v5 creating a 7v6 overload"
  (player-format reconciliation), "divided into a central zone", "Play with 6v6".
- Directional Possession Games wins 6 of 13 gated guided goals, so diversity across goals is unchanged.
- ~~Codex's uncommitted primary-scoring attempt in the stale main checkout.~~ Cleared 14 Sep with Joe's
  OK: 7 tracked edits restored, and its untracked files removed. A patch and archive were kept in that
  session's scratchpad.
  - `.tmp-primary-scoring/node_modules` was an NTFS junction into Codex's runtime cache. It was
    unlinked first, and the cache was left intact.
  - Main still holds two July Codex worktrees (`codex-phase1-baseline`, `codex-phase1-worktree`).
    Their commits are on main; only test output and a lockfile change are uncommitted. They were not
    removed.
- Two Finishing rules can restate each other ("Defenders contest every finishing attempt…").

**Lessons:**
- Setup evidence must name PHYSICAL objects using the rule's own noun. "Zone" matched "end zones"
  while scoring said "finishing zone".
- A word can be present and mark nothing ("goal kick", "after a goal"). Check how it is used.
- Timing lives in the deterministic rule, never in setup evidence. A countdown check failed TA01 twice.
- If only the model's wording can meet a requirement, it will sometimes fail. Measure what
  system-written text alone satisfies.
- Read every slot after every fix. Audits only find what they already know to look for.
- Generate sequentially. Parallel runs hit OpenAI's 30k tokens-per-minute limit and hid half the goals.
- The harness must survive one failed assembly.

Behaviour gate `70 68 98 119 94 99 86`; 47 suites; ratchet 35.

### 2026-09-13 (night) — The live route never saw the scoring event; fixed

**Found while checking the push against Christian's approval email, item by item.** The output
validator rebuilds each activity from an allowlist, and its `systemTrace` kept seven fields, without
`primaryScoring` or `planning`. The route compresses the VALIDATED activities. So in the live app:
- compression never pinned the resolved scoring rule and fell back to ranking scoring sentences;
- Setup, Rules and the Objective were never kept to the scored object, and the regain condition stayed
  in games that score no regain;
- the Objective could not fall back to the coach's goal, and saved activities carried no planning
  trace (IC-003 Invariant 5).

What did reach the route: gating, resolution, the 400 refusal, the deterministic Scoring text and the
setup repair (both written before validation).

**Why six real runs missed it:** `run-coach-view-audit.ts` compressed the mapper's output directly and
skipped the validator. It is the same fork-of-production trap as 2026-08-16.

**Fix:**
- `planningTrace` and `primaryScoringTrace` (`map-structured-activity-to-legacy.ts`) build both fields;
  the mapper and the validator call the same functions.
- The harness now runs map → validate → compress, as the route does.
- `assembly-output-contract.unit.ts` `testSystemTraceSurvivesValidation`. Bite-proved: with the two
  validator lines removed it fails "activity 1 lost its scoring event".

**Also closed from the approval email:**
- Metadata row `scoring_event_vocabulary_scope` = "Used with GA-001 Invasion; no broader ownership
  claim" (`apply-rpc-scoring-vocabulary-scope.py`, idempotent). `rpc-library.unit.ts` asserts it.
- `systemTrace.primaryScoring.qualifyingCondition` records the context's authored condition on every
  activity. It is not sent to the model, because the scoring rule already states it.
- Still true: free-text goals rank scoring sentences, because no context is inferred from typed words.
- Needs Christian's sign-off: the Counterattack coach wording asks for a 6–10 second countdown, borrowed
  from Recover & Reorganize.

**Real run through the route's path** (map → validate → compress, 13 goals × 3 slots), read slot by
slot: 39 of 39 activities; 0 retries, 0 failures; 0 wording violations; the audit finds no unscored
object, second way to score, missing countdown or missing goal.

Behaviour gate `70 68 98 119 94 99 86`; 47 suites; ratchet 35.

---

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

### 2026-08-17 → 08-26 — THE COACH-COMMUNICATION ARC (pilot HELD, then audited)

**Christian HELD the pilot on 17 Aug** — approved 13 Aug, then paused before inviting the ten
coaches: *"I can't have pilot coaches evaluate representative learning if they're still spending
cognitive effort figuring out what the activity actually is."* Pilot has NOT launched. He ran ~20
coaching intentions / ~60 activities and delivered a **Pilot Readiness Audit (RC1)** on 26 Aug
(original in `~/Downloads/`, extracted text in the session scratchpad).

**Audit verdict:** translation 🟢, representative design 🟢 (no prescriptive drift found), activity
variety 🟢, activity communication 🟢, **planning UX 🟠**, **incentives/scoring 🟠 — the largest
remaining coach-facing issue.** His framing throughout: this is product refinement, not architecture.

**What shipped in response, newest first:**

| commit | what |
|---|---|
| `e5510aa` | Scoring keeps ONE primary success condition + at most one secondary |
| `9f03f2f` | `activities_viewed` fired — it was declared and never called |
| `efc58b8` | Planning flow consolidated; Skill Level + Emphasis removed; 5 steps → 4 |
| `9615783` | `incentive_patterns` wired end-to-end before it is authored |
| `1700d19` | Scoring written in the coach's voice |
| `db6b21e` | The five authored incentive mechanisms actually expressed |
| `ba7db07` | "How to Play" section; Setup must answer five things in one read |
| `bb8dfbb` | Each coach-facing section given a single owner |
| `4fd4fb2` | Playing format made to fit the squad the coach entered |

**THE SCORING OWNERSHIP RULE (his, 26 Aug) — the governing principle now:**
> One primary success condition. Optional secondary consequence only when it genuinely strengthens
> the representative problem. Everything else should emerge from the game rather than be explicitly
> rewarded.

Implemented in `coach-section-ownership.ts`: the only permitted secondary is **this slot's own value
modifier** (the one incentive that differs between the three activities; everything else is shared,
so promoting it adds a competing criterion without adding a distinction). Primary selection prefers
**objective** conditions and penalises judgement words — "create space", "gain advantage", "a genuine
chance" are coaching observations, not criteria two coaches would score identically. Displaced
rewards move to Coaching Focus **re-voiced as observations**; the cap widened 3 → 5 to hold them.
Measured: 4–5 competing rewards → 1–2 sentences.

**THE EMPHASIS FINDING — read this before comparing old and new output.** `SessionForm` set
`defaultValues={{ sessionEmphasis: 'Applying Solutions Under Pressure' }}` — the deliberately NARROW
profile that exists to produce near-identical activities. The engine's default for an UNSET emphasis
is the differentiated profile, so **every session created through that form was opted into narrow
variation without any coach choosing it**, and the differentiated default set weeks earlier never
applied to a single real session. The control is now gone, so new sessions get differentiation.
**Sessions created before `efc58b8` still carry 'Applying' and will keep producing narrow variation.**

**Also removed: Game Skill Level.** Nothing read it — the only consumer was `select-affordance.ts`,
which nothing imports.

**EVIDENCE LAYER, as it now stands** (all in `GET /api/app/debug-usage`):
* automatic — goal text, resolution status, signal groups, learning goal / practice situation /
  learning stage / duration, **rejected goals verbatim** (the vocabulary-gap dataset), planning
  started, planning abandoned + step, activities viewed, activity edits by field + structural flag,
  coach-language leaks.
* asked at REVIEW — "Would you run this activity as written?" (Yes / With changes / No), then
  Christian's own wording **"Was it immediately clear how players succeed in this activity?"**
  (Yes / Had to reread / No), plus two optional text boxes.
* asked AFTER USE — thumb, the nine-code observation vocabulary, comment.
* asked LAST — "Would you use Challenge Point for your next practice?"

Linkage is by `activityId`; every activity carries its own provenance on `systemTrace.planning`.

**STILL OPEN, and Christian's to author, not ours:**
1. `incentive_patterns` — empty on all 23 realization rows. Wired now, so any row he fills changes
   output immediately with no release. Derived phrasing is the fallback.
2. **No switch-play Learning Goal.** His free text routes correctly to Channel Games; the guided list
   has 11 goals and none covers switching play / far side / changing the point of attack. His audit
   lists ~10 such gaps. Two existing goals (*Play Out from the Back*, *Beat Defenders 1v1*) still
   cannot generate, so adding an unbuildable goal would be worse than the gap.
3. Planning wording — Practice Situations sometimes restate the selected Learning Goal.

**Do NOT** add incentive mechanism types, an incentive → Environmental Manipulation trigger, or a
taxonomy standard: Christian froze that scope for a post-pilot *Representative Incentive
Architecture*. Observations go in `docs/DISCOVERY_INCENTIVE.md`.

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
contained literal BACKSPACE bytes (0x08) where `\b` belongs — written through a Python heredoc that
interpreted the escape. It matched nothing for a week, so every mechanic routed to Rules and Scoring
kept only the hardcoded per-archetype template. That ONE fault produced two complaints Christian
raised a week apart (scoring statements inside Rules; every Scoring section collapsing to "A point or
live advantage counts"). A sweep found two more in `compress-activity-output.ts` and **eight in its
unit test, inside NEGATED assertions — four tests that could never fail.** All repaired;
`isScoringMechanic` now asserts at load time that it still matches plain scoring language.

**NEVER write a regex through a Python heredoc.** Use the Edit tool, or a raw string, and verify with
a byte scan afterwards (`b'\b' in open(f,'rb').read()`). This bug has now been introduced three
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

### 2026-09-14 — What the selected Game Form contributes (Christian's question), measured

**His question (14 Sep).** He generated Play Out from the Back and got End Zone, Wide Channel and Timed
Possession Games, all scoring beyond the first defenders. He asked what the selected Game Form
contributes to each realization, and whether "Setup marks the scoring object, and only that object"
also removes representative objectives such as goals. He asked to see this before any knowledge
changes, and to hold the Counterattack 6–10 second window until then.

**How it was measured:**
- A deterministic trace of Play Out from the Back through each RPC-001 form: GF2 (selected), GF3 and
  GF7 (forced).
- Real generation through all three, the way the live app runs: Against High Pressure, Building
  Understanding, Applying emphasis. Raw model text was read before and after compression.

**Findings:**
- **One Game Form per generation.** The three activities are three slots of Directional Possession
  Games (gated candidates GF2, GF3, GF7; GF2 wins). "End Zone", "Wide Channel" and "Timed" are titles
  the model writes from the per-slot variation directives.
- **What the form feeds the engine:**
  - its scoring objects (`scoring_structure_type`), which set the line/zone rotation;
  - three `setup_guidance` lines;
  - 14 mechanics lines the validator checks as text;
  - an exchange rule (GF2 has none in `EXCHANGE_RULE_BY_ARCHETYPE`, so it gets the default);
  - the player format, only when the form's name contains "overload".
- **What reaches the coach:**
  - GF2: nothing distinctive. Raw setups drew "two end zones" from its "target line or zone"
    guidance, and cleanup removed them. Rules showed only the default exchange rule.
  - GF3: two positional rules survive, plus a central zone with wide channels. The 3×3 grid never
    appears.
  - GF7: three lengthwise channels and a channel exchange rule. Nothing ties the channels to what
    players read or to how they score.
- **Constraints are identical across all three forms:** Central Density Condition, Wide Zone
  Advantage and Progression Bonus. The wide channels in his activity come from Wide Zone Advantage.
- **Slots differ only by** the emphasis directive, one modifier and the event rotation.
- **Goals:** no RPC-001 form marks a goal. The SCORING OBJECT directive and
  `scoring-object-consistency.ts` remove goals nothing scores on, so the goalkeeper only starts
  attacks. His point stands: the rule removes representative objectives, not only competing scoring
  objects.

**Defect found: every live session runs the narrow Applying profile.**
- The session schema's default of 'applying' (since 20 May) fills new sessions and also hydrates
  stored sessions missing the field. Checked on the real model: omitted → applying; stored without
  the field → applying.
- The engine's 14 Aug switch to Discovering for an unset emphasis, and the form's 29 Aug removal of
  the control, never reached the app.
- The generation harness sets no emphasis, so every harness run used Discovering.
- Not changed yet: it would alter what Christian is evaluating, so it needs Joe's decision.

No knowledge or code changed. Counterattack window held at Christian's request.

### 2026-09-14 — Session emphasis fixed: an unchosen emphasis now runs the differentiated profile

**Decision.** Christian's 14 Aug decision stands. A session nobody chose an emphasis for runs the
differentiated Discovering profile, and an explicit choice is honoured. The defect was in the
implementation: three places answered "which emphasis?", and the schema's answer won.

**Changes:**
- `resolveSessionEmphasis` (`emphasis-variation-profile.ts`) is the only resolver. The profile, slot
  directives, slot modifiers and assembly prompt all use it.
- The prompt's session block moved into `sessionEmphasisPromptBlock`. In `completion.service.ts` it had
  its own 'applying' fallback and told the model "Coach selected emphasis"; it now says "Session
  emphasis".
- The Session schema has no default for `sessionEmphasis`.
- The harness builds its session through the real Session model. `SESSION_EMPHASIS` sets an explicit
  choice.
- `session-emphasis.unit.ts` follows the real model (new and hydrated) through the resolver to the
  profile, directives, modifiers and prompt. Bite-proved: restoring the schema default fails it.
- `scripts/unset-defaulted-session-emphasis.ts` is a dry run by default. `--apply` unsets 'applying' on
  sessions created on or after 2026-08-29, when the form stopped offering a choice. Earlier sessions
  are left alone, and `--since` overrides the cutoff. **Not run: it needs the production database.**
- Stale comments corrected in the schema, skeleton, profile, slot-variation test, SessionPage and
  SessionForm.

**Verified:**
- Back-end and front-end tsc pass; 48 suites; ratchet 35; gate `70 68 98 119 94 99 86`.
- Real Play Out from the Back through the model-built session gave three distinct activities, where the
  Applying run gave three near-copies:
  - Central Corridor (spatial, with zone values);
  - Live Transition (a transition rule);
  - Numerical Overload (overload values).
- Slot 3's setup named "the team with the overload" without stating the numbers. That is a model
  omission, not caused by the fix.

**Still to do:** once this reaches the app, run the cleanup script against production (dry run first).
Until then, existing sessions keep 'applying'; new sessions are correct.

### 2026-09-14 — Baseline corrected for the causal expression audit; implementation frozen

**Christian (14 Sep)** asked for a system-wide causal expression audit, measuring what each selection
changes in the game players experience. He allowed exactly one correction first: the coach's
selected Learning Stage and variant must actually reach generation. After that, implementation is
frozen for the duration of the audit.

**Correction:**
1. **Emphasis:** already fixed (the entry above).
2. **Learning Stage never reached the model.**
   - Found by capturing the live prompt, not by reading the code.
   - The IC-001 directive (9 Aug) was built into the skeleton bundle and rendered by
     `formatActivitySkeletonForPrompt`. That formatter's only caller, `generateAssemblyPrompt`, has not
     been called since 7 May, when the live path moved to `generateAssemblyPolishPrompt` plus payload.
   - Fix: the directive is now added to the live polish prompt.
   - `live-assembly-prompt.unit.ts` runs the real `assembleActivities` with the OpenAI call
     intercepted. Bite-proved: removing the block fails it.
   - The telemetry flag `learningStageInfluencesGeneration` is now truthful, and the comments are
     corrected.

**Verified:** 49 suites; ratchet 35; gate `70 68 98 119 94 99 86`. Captured prompts show the stage
directive changing per stage and absent without one.

**FROZEN, deliberately left as found:** the same dead formatter still holds, unsent:
- the Practice Situation directive;
- representative stakes;
- the information-expression directive;
- the setup brief (Game Form and constraint setup guidance, field, format);
- the SCORING OBJECT instruction.
These are audit evidence and must not be fixed before the audit reports.

### 2026-09-14 — Causal expression audit delivered; freeze still in force

**Report:** `docs/audits/causal-expression-2026-09-14.md`. The 60 real activities it rests on are
kept verbatim in `docs/audits/causal-expression-2026-09-14-evidence.md`.

**Answer:** Challenge Point assembles individually valid pieces that coexist, not a coherent
representative game. Only two selections reliably change the game players experience:
- the scoring event and its condition;
- the session emphasis's slot template.

**Diagnosis:**
- Primary: selected knowledge not realized, and assembly not reconciling.
- Enabling: validation checks ingredients.
- Underlying: two writers. The model writes the physical game from a thin payload; the system writes
  rules and scoring and never sees the physical game.

**Method:**
- One corrected baseline: A01, Against High Pressure, Building Understanding, emphasis unset.
- 20 one-change conditions, each captured before the model call, then generated for real.
- A validation probe: the real output with only the model's text broken, merge emulated, every route
  validator run.
- The instrumentation stayed in the session scratchpad, outside the product code.

**Findings to carry forward:**
- **What the model receives:** the Game Form name, a truncated hint, four rule summaries, two
  constraint titles, two decision cues, and the emphasis and stage blocks.
- **What it never receives:**
  - the goal;
  - the situation;
  - the field or player count;
  - the scoring event;
  - the consequence constraint;
  - the stakes.
- **Where the layout comes from:** the prompt's generic example ("Two 20-yard end zones at either
  end of a…").
- **Across 20 runs:**
  - activity 1 is a zone-weighted line game in 19;
  - activity 2 is a target-zone transition game in 19;
  - activity 3 is 7v5 in 14.
  Situation, stage, constraints, challenge and note do not move this.
- **Selected but not realized:**
  - Pass Combination Gate: no passing requirement in 41 of 42 activities.
  - Neutral Player: 0 of 6 activities show a neutral.
  - Consequence rewards: shown in Scoring in 0 of 57.
- **Goals and goalkeepers:** 0 of 60 activities contain a goal, while 57 start attacks from a
  goalkeeper and 31 never place one.
- **Validation:** five deliberately broken games passed every validator: impossible geometry, an
  unopposed drill, goals only, three identical activities, corner kicks.
- **Corrections to my 14 Sep trace:**
  - Game Form setup guidance is not sent.
  - The end zones come from the generic prompt example.
  - The Practice Situation acts only through its name, as parser text.

**Freeze:** still in force. Nothing identified here is to be fixed until Christian or Joe lifts it.

### 2026-09-14 — Christian's reply: a Selection → Realization Contract; freeze continues

**Christian agreed with the audit's central conclusion** and asked to keep implementation frozen.
- **Don't patch the individual failures.** They become hostile tests for whatever contract results.
- **The Counterattack timing question stays parked.**
- **His framing:**
  - The knowledge architecture makes more decisions than the activity expresses.
  - What is missing is a deterministic contract for what each selection must make true in the game.
  - Selection → obligation → realization → validation against the obligation.
  - He deliberately named no new architectural layer.
- **His plan:** author realization requirements for a small sample: one RPC, contrasting Practice
  Situations, the three compatible Game Forms, a hostile set of constraints, one consequence, one
  Information Expression example, and representative versus scoring objectives.
- **His question:** what minimum structure could the runtime consume before the model call, or should
  he specify independently?

**Sent:** `docs/design/selection-realization-contract-draft-shape.md`, also published as a page.
- **Runtime today:** it consumes exactly one structured object per activity, the primary scoring
  directive. That directive is the only layer the audit found functional.
- **Recommendation:** author in football terms, row by row, in a small obligation shape: source,
  subject, requirement, value, strength, owner, precedence, evidence, needs-vocabulary. The rows are
  about a resolved game specification. Author against existing vocabularies, not against today's
  runtime.
- **Key finding:** both halves already exist separately.
  - *Obligations as prose:* setup guidance with parameters, never sent. For example, Neutral Player
    "one or two neutral players… always play with the team in possession", and Pass Combination Gate
    "4-6 connected passes".
  - *Vocabulary as typed canon, unconsumed:*
    - EM Schema v2.0 (64 typed parameters);
    - Information Expression RC1.1 (26 dimensions, 139 values, 6 presets);
    - Game Archetype integrity conditions and Interaction Regulation families;
    - RPC begin/end conditions, identity rules and validation rules;
    - the Soccer Module's empty opposition, restart and player-count columns.
- **Worked rows** for Neutral Player, From Goal Kicks, Wide Zone Advantage, Pass Combination Gate,
  Variable Target, Goalkeeper Included, RPC-001, Through Wide Areas and Turnover Reward (no realization
  authored), plus GF2, GF3 and GF7.
- **Six questions for him:**
  1. GF2 direction: its authored guidance says "teams attack in the same direction".
  2. Whether consequences may award points.
  3. The precedence order, or FAIL by default.
  4. Whether "typical" values are REQUIRED.
  5. Whether EM v2.0 has a knowledge object for a sub-area (it appears not to).
  6. Mismatched EM family IDs between the Game Archetype Workbook and the EM Schema.

**Audit corrected:** its "missing knowledge" row said Neutral Player and Pass Combination Gate gave no
count or pass number. That described the system's line, not the authored guidance.

**Next:** wait for his answers and sample. When the sample arrives, check each row against the
existing audit runs. No new implementation.

### 2026-09-15 — Christian's decisions on the six questions; he is authoring the vertical slice

**The shape stands:** source → scope → what must be true → strictness → value authority → collision
behavior → validation. He called primary scoring evidence that this extends a working mechanism.

**His principle:** Selection ≠ Realization, and Realization ≠ Mention. A requirement is satisfied only
when its functional effect exists in the player–environment interaction.

**Decisions:**
1. **Direction invariant:** each team has a stable, perceivable direction of progression and at least
   one functional directional objective; normally each attacks one way and defends the other. GF2's
   "Teams attack in the same direction" is to be corrected, not bound. Same-target play may be an
   authored realization only.
2. **One primary scoring event.** Consequences change state: possession, restart/state, temporary
   numerical advantage, access/eligibility, spatial advantage, target availability, continuation.
   - Exception: an explicitly authored change to the primary event's value.
   - A second independent point, such as "five passes = point", is invalid.
3. **No universal precedence.** Reconcile only through an authored ownership or relationship rule
   (e.g. RPC scoring ownership); otherwise fail loudly and return to selection.
4. **Three value statuses:** REQUIRED RANGE, PREFERRED/DEFAULT, TYPICAL/EXAMPLE. Guidance values are
   never hard rules unless canonical knowledge makes them boundaries.
5. **Regions:** no new EM knowledge object and no ontology change. Knowledge requires or organizes a
   region; realization instantiates it; the resolved game needs a generic region representation.
6. **EM family IDs:** bind neither until reconciled. He expects the canonical EM RC1 library to own
   them, and asked for the conflicting rows.

**Done:**
- `docs/design/selection-realization-contract-draft-shape.md` revised with these decisions, and the page
  republished. Field names follow his chain; `value_status` and fail-to-selection collisions added;
  the worked rows re-graded.
- `docs/design/em-family-id-conflict.md` sent for question 6:
  - **EM Schema v2.0** (Family Registry rows 5–10): EMF-01 to 06, with 05 Environmental Objects and
    06 Playing Surface. Dated 12 Jul; it supersedes an "Implementation Workbook Package 1.1".
  - **Game Archetype Workbook RC1.1** (Knowledge rows 152–187, GAK-0151–0186): EMF-001 to 006, with
    005 Transition Triggers and 006 Environmental Elements.
  - **Provenance:** all 36 archetype rows cite "Environmental Manipulation Library RC1 + Game Archetype
    Canonical Reference v1.0".
  - **Nothing checks family IDs across the two:** the archetype loader counts rows only.
  - **Missing sources:** neither the EM Library RC1 document nor the superseded package is in the repo.

**Knowledge corrections recorded, NOT made (frozen):**
- GF2's direction wording and the system Teams line "Two teams compete in the same direction";
- Neutral Player's "one or two" against its own "6v6 + 3 neutrals" example;
- Wide Zone Advantage's "bonus point".

**He is authoring the vertical slice** over the audit's hostile cases: RPC-001, Against High Pressure,
From Goal Kicks, Through Wide Areas, GF2, GF3, GF7, Neutral Player, Pass Combination Gate, Wide Zone
Advantage, Variable Target, Goalkeeper Included, Turnover Reward. It covers representative versus
primary scoring objectives and reconciliation of counts, geometry, direction, objectives,
states/restarts, constraints, information and consequences. Implementation stays frozen until it
arrives.

### 2026-09-15 — Christian's shared-game hypothesis; runtime read delivered

**He paused the realization ledger** and asked whether the audit points at something simpler: that the
gap is not a contract per knowledge object but the absence of an authoritative representation of the
game that currently exists. He asked for an architectural read, explicitly including an attempt to
break the idea. Nothing to implement.

**Read:** `docs/design/shared-game-representation-runtime-read.md`, also published as a page.

**The decisive evidence:** `mapStructuredActivityToLegacy` already resolves two facts and then defends
them inside the model's prose —
`reconcilePlayerFormat(setup, session.playerCount, archetype.name)` and
`reconcilePlayingArea(setup, parseSessionArea(...))`. 477 lines across `player-format.ts` and
`playing-area.ts`, and the resolved values are never stored. `player-format.ts` states the thesis
itself: the format "is derivable — there was never anything to negotiate".

**Answers, in short:**
1. **Fits.** Three writers share strings, not state: system mechanics, the model, and post-hoc repair.
   The area is fixed while the regions inside it are deliberately left alone, which is exactly how 54 m
   of channels survive on 30 m.
2. **Primitives nearly sufficient,** with four corrections: the session envelope is missing; a general
   Relationships primitive will absorb everything and must be a closed typed set; State should split
   into element state and transitions; Objectives and Direction are derivable but earn explicit fields.
   Emergent qualities (pressure, uncertainty, opportunity) are not representable, and cross-activity
   variation has no home.
3. **Knowledge mostly expresses as contributions.** What doesn't: affordance lenses (opportunities, not
   properties), Learning Stage (a policy over parameters), session emphasis (cross-activity).
4. **Outside:** coach language, rationale, provenance, selection scores, stage and emphasis language.
   Attribution per element stays attached, so a failure can name what to reconsider.
5. **Scoring generalizes in shape but not in method:** its authored sentence per context × event cannot
   scale; rendering must compose from structure.
6. **Removes a class of work** — roughly 1,900–2,500 lines of text repair and lexical validation — and
   adds a reconciler, a renderer and the authoring conversion. Simplification only if the
   representation refuses to model play. Strongest counter-argument: today's model-written Setup is the
   only source of concrete layout, since layout knowledge is authored as prose that is never sent.
7. **Minimum:** 8 tables, ~35 fields, 8 invariants, mapped to the audit's counts.

**Proposed next step, no implementation:** replay the 60 captured activities against the eight
invariants as a paper exercise. False alarms on runnable activities would mean the representation is
already too strict.

**Still preserved as unresolved:** Game Form restart × From Goal Kicks; central weighting × Wide Zone
Advantage; Turnover Reward's missing consequence; EM family-ID provenance; Counterattack timing; and
the three wording issues.

### 2026-09-16 — Replay of the 60 activities against the eight invariants

**Report:** `docs/audits/minimum-representation-replay-2026-09-16.md`, also published as a page. A paper
exercise over the captured audit evidence: no implementation change, nothing regenerated.

**Result:** the eight invariants reject all 60. **Three** activities genuinely cannot be laid out, all
the same failure — 18 m channels across a 30 m width (baseline s1, ls-reinforcing s1,
em-shaping-wide-zone s1). The other 57 a competent coach runs without noticing.

**The eight AREAS held; the eight CHECKS did not.** None of the 39 missed defects needed a category
outside the eight tables. What was missing were checks, mostly across two tables.

**False alarms, 128 of 288 adjudicated findings.** Three invariants fire on one fact: a single unowned
scoring object marked "beyond the first defenders" (59 of 60) trips `objective-object-team-role`,
`primary-object-fixed` and `team-direction` at once.
- `objective-object-team-role`'s role leg is wrong on the text: all 60 scoring sections begin "Earn a
  point when…", so only team ownership is unstated.
- `regions-fit-area` fired 5 times in 60, every time on an activity that volunteered numbers: it
  rewards vagueness and punishes specificity.
- Four of the eight were applied oppositely on identical text by careful readers (`primary-object-fixed`
  overturned 15/15 by one challenger, upheld 15/15 by another). Each invariant needs a decision
  procedure, not just a name.

**False negatives, 39.** Objects and Transitions have no invariant at all. Verified instances: 19 of 60
score by a "deep" tier no setup defines; 3 restart with a goal kick in games with no goals; 3 carry a
value condition that can never be true; 2 state no start of play; several pair two rules with one
trigger and incompatible effects.

**Shortlist (checks, not a ninth table):** `referenced-region-exists`, `transitions-complete`,
`value-condition-evaluable`; then `regions-well-formed`, `no-contradictory-rules`,
`objects-instantiated`, `start-state-valid`, `trigger-decidable`, `consequence-changes-something`,
`region-bound-counts`, `rule-scope-stated`, `performer-fully-specified`, `score-resets-play`.

**The structural conclusion:** one invariant set was doing two jobs. Seven ask "can it be laid out and
played" (3 of 60 fail); `selected-contribution-present` asks "did the selection reach the field" (57 of
60 fail). Two gates, different consequences.

**Method:** a 9-agent workflow — four replay agents over 15 activities each, an adversarial challenger
per batch instructed to defend the coach rather than the invariant, one synthesis. Every load-bearing
count was then re-verified directly against the captured activities, which corrected three agent claims
(balls ARE listed in Equipment in all 60; "Teams start with the ball" is idiomatic; one "no start of
play" case in fact states a restart but no initial start).

### 2026-09-16 — Christian's decisions on the replay; Gate A procedure derivation requested

**Agreed:**
- **Gate A, Structural Coherence:** can this game be laid out and played? Its only claim is "This game
  can be coherently laid out and played as specified."
- **Gate B, Realization Fidelity:** did the selected knowledge reach the field? Kept separate; the
  evidence there is already strong (57 of 60).
- The eight-area shape survived its first hostile test; the initial checks failed.
- **An invariant name is not a gate.** If careful readers reach opposite verdicts on identical text, it
  is a principle. Each Gate A invariant needs a deterministic decision procedure.
- **A possible third question** — does a coherent, realized game preserve the representative learning
  problem — is explicitly NOT to be folded into Gate A.

**Requested (paper only, no implementation, no regeneration):**
1. From the 39 false negatives and the overturned findings, derive the **smallest non-overlapping set**
   of structural decision procedures that:
   - catches meaningful defects;
   - admits unambiguous coach shorthand;
   - never has several checks report one underlying defect;
   - does not reward vague language over precise language;
   - stays inside the eight areas.
   Let the evidence decide; don't treat the three shortlisted checks as required. A check needing
   subjective football judgment is flagged, not forced into Gate A.
2. Replay the same 60 with that set, reporting: true defects caught, false alarms, defects missed,
   duplicate findings, and cases still needing subjective interpretation.

Everything else remains frozen.

### 2026-09-17 — Gate A procedures derived; second replay done

**Report:** `docs/audits/gate-a-second-replay-2026-09-17.md`, also published as a page. The derived
specification and ledgers are in `docs/audits/gate-a/`. Paper only.

**Derivation:**
- **How it ran:** a workflow with three independent derivations (defect-first, noise-first,
  representation-first), then a judge. Defect-first failed on the 64k output limit, so two were merged.
- **What came out:** two procedures —
  - **GA-LAYOUT** — space declarations and roster resolve to exactly one arrangement inside 40 × 30 m /
    12 players (`L-UNPARSEABLE`, `L-INFEASIBLE`, `L-ROSTER`);
  - **GA-PLAY** — every structural rule has existing referents, a typed effect and no incompatible rival
    on one trigger (`P-REFERENT`, `P-EFFECT`, `P-CONFLICT`).
- **Verdict rule:** fail only when, after closed shorthand readings and defaults, a field has zero or
  conflicting values. The only search allowed is over unstated quantities, never over word readings.
  This fixes the vagueness asymmetry.
- **Excluded:** 20 candidates (4 subjective, 2 Gate B, 7 not structural, 7 merged).

**Replay design:** two blind readers per half of the 60, with agreement computed in code; an independent
defect hunter per half with no checklist; a scorer.

**Results (identical for both readers):**
- 34 of 35 true defects caught; 5 false alarms; 1 miss; 1 duplicate.
- 13 distinct subjective issues (24 instances). No ninth area needed.
- GA-LAYOUT: 8 caught, 0 errors. GA-PLAY: 26 caught, 5 false alarms, 1 miss.

**Determinism:** 60/60 verdicts, 60/60 fact codes, 59/60 exact keys (a label). **Caveat:** reader B
raised 12 indeterminates that reader A resolved silently the same way. They trace to a spec
self-contradiction: X1 lists "Use" as both a layout verb and a tactical verb. Every remaining error is
shared by both readers, so it is spec policy or spec flaws, not reader noise.

**Contested rulings:**
- "deep" tier: structural, low severity, 19 rows — the most consequential call and one sentence, flagged
  as Christian's.
- "extra numbers" in even games: subjective, out of Gate A (4 rows).
- The 30-second shot clock and "goal kick" with no goals: shorthand.
- Truncated "Create a central overload by having one team.": structural, missed by both readers (verb-first
  routing), caught by the hunter.

**Origin of the 35 true defects:**
- **23 are system-written template sentences in `coach-voice.ts`:** line 209 "then deep" (19), line 73
  "opposite channel" (3), line 112 "decides it" (1).
- 10 are model-written; 2 are model text against a system rule.
- These 23 are the representation argument in miniature: prose value tiers and effects with nothing to
  bind to.

**Spec flaws found, not applied:**
1. Fix the "Use" contradiction.
2. Merge advantage-attached place names into the advantage group.
3. Garbled setup declarations should fail `L-UNPARSEABLE`, not route to tactical.
4. Move "extra numbers" out of Gate A and admit the shot clock.

With these the corpus would score 35/35 — meaningless in-sample.

**Overfitting:** the spec was derived from the same 60 and has closed lexicons. There are only ~9 distinct
defect types, and it fails closed on new wording. The real test is a held-out set read against a ledger
written in advance, which needs new generation (frozen, Christian's call).

### 2026-09-17 — RPC-001 vertical slice: six selections into one resolved game

**Report:** `docs/audits/rpc001-slice-2026-09-17.md`, also published as a page. Paper only.
**Christian's decisions recorded first:** `docs/audits/gate-a/corrections-accepted-2026-09-17.md` — "deep"
is STRUCTURAL (low severity); the four procedural corrections accepted but NOT applied; the 60 are NOT
replayed again; generation stays frozen.

**The test:** six objects (RPC-001, From Goal Kicks, GF2, Neutral Player, Wide Zone Advantage, Variable
Target) each derived contributions in isolation, forbidden from mentioning the others. Two reconcilers
merged them independently from opposite directions. Then Gate A (two blind readers) and Gate B (one
checker) ran separately, with an adversarial pass.

**Answer: five of six coexist with no bespoke awareness. The sixth fails on one field.**

**Reconciliation converged** on the same game from both directions: 2 goalkeepers + 4v4 + 2 neutrals
(forced once Neutral Player's "one or two" picks 2), `target_zone_entered`, one candidate set per team at
opposite ends, turnovers stop play, only the wide-zone multiplier survives, three restart rules that turn
out to be orthogonal.

**Gate A:** it lays out (width 6+18+6=30, length 20+20=40, 12 players, all cross-references resolve) and
**cannot be played**: nothing determines which candidate zone is live, so the only scoring event has no
object.

**Gate B:** 0 of 89 dropped; 71 operable; 10 present-but-dead; 8 unresolved. The 8 are one failure.
Variable Target is the selection that did not arrive (6 of 15). Seven of the ten dead items are gaps the
contributing object declares itself.

**Bespoke awareness:** fired irreducibly once (RPC-001 × Variable Target, both writing
`objectives[].state`); once half-representationally; once against a standing decision (the 2-3 target
range against reciprocal direction); one near-miss survived only because Wide Zone authored three
alternatives.

**What makes independent authoring work:** an object's own declaration of what it does NOT claim.
Coexistence held wherever objects declared silence, and failed where two claimed the same field.

**Seven representation gaps, all inside the eight areas:** Transitions needs internal fields;
`objectives[].state` is one field doing five jobs; Rules of value has no information type; value modifiers
have no magnitude field; target zones never appear in Space; Performers has no start-placement slot;
provenance cannot express the kind of a source.

**Errors found, including mine:** my canonical (symmetric) choice breached Variable Target's authored 2-3
range — the variant respected it; the resolved game contains an invented consequence (entering an inactive
zone is out of play) citing six contributions, none of which authorizes it, creating play-stopping regions
inside a channel declared never entry-prohibited, missed by both Gate A readers; one reader used a fact
code the procedures do not offer; Gate B's arithmetic slipped 17/18; and a challenger claim was wrong
because I failed to pass it the four accepted corrections.

### 2026-09-17 — Game Representation Specification drafted, audited, revised

**Christian** closed architectural discovery provisionally and asked for the minimum Game
Representation Specification:
- keep the eight areas, refining fields where the slice showed the shape insufficient;
- for every field, give why it exists, what owns its value, and what can be validated;
- separate provenance from support;
- put non-claims in the contribution contract if that is where they belong;
- do NOT resolve C1 — decompose objective state first.

He asked to preserve two principles:
- **Non-claim:** knowledge states what it requires, excludes, constrains, and does NOT claim.
- **Support:** provenance is insufficient unless the cited contribution actually supports the property.

**Revision 1 was drafted, then audited by four independent agents** (evidence, boundary/contract, replay,
minimality). They converged on blocking problems:
- support was presence-only and written by the reconciler, so it would NOT have caught the invented
  inactive-zone rule;
- non-claims counted as support, so silence could license invented rules;
- "no invented property" sat in Gate A instead of Gate B;
- a universal Gate A rule partly resolved C1;
- SET_POLICY and DEFAULT_RULE owned values with no contract;
- the contract had no ownership scope;
- about ten citations were wrong, including a quotation attributed to the causal audit that exists in no
  evidence file — a P2 violation in the spec itself.

**Revision 2:** `docs/design/game-representation-spec-2026-09-17.md`. Revision 1 is kept as
`...-v1-audited-2026-09-17.md`.
- **Support is derived:** field-path match plus a closed comparison. An ASSUMED item can narrow but never
  entail. Properties are atomic, and sources are computed from the contract.
- **Existence rule:** SESSION, SELECTION or STANDING_DECISION must entail a property's existence;
  REALIZATION only fills unstated quantities and never creates rules.
- **Gate B checks both directions:** survival forward, invention in reverse.
- **Contract:** scope, basis, checkability, mandatory non-claim coverage, relationship rules.
- **One home per fact.**
- **Transitions:** coherence rules and one closed trigger vocabulary.
- **Value modifiers:** an overlap rule, which is what catches "deep".
- **Render fidelity** makes P5 checkable.
- **The hostile-case table shows four cases revision 1 let through** that revision 2 catches: ps-central
  s1, "deep", "opposite channel", and the invented rule. It also catches the four-zone breach.
- **C1 made precise:** RPC-001-11's timing clause ("active from the moment that team's attack begins")
  cites RPC-STMT-004, which contains no timing. The slice treated it as authored; the spec treats it as
  ASSUMED pending Christian. IE-C006 also composes no reveal timing.

**Citation check of revision 2** (a 4-agent workflow, 101 claims) found two wrong and nineteen imprecise;
all were corrected before publishing.
- **Wrong:** "the one functional layer" (carried over from revision 1; [CA] says scoring is one of two
  functional selections, alongside the emphasis slot template).
- **Wrong:** IE-C006 composes D006, D008 and D011 only; D007 and D013 are the spec's own addition.
- **Other corrections:** replay ids live in the ledgers, not the report; P5 is ruled only for value
  tiers; GF2-10 and GF2-15 are PARTLY_STRUCTURAL; WIDEZONE-13 is unordered; and WIDEZONE-14 cannot
  justify removing the modifier beneficiary.

**Page:** The Smallest Authoritative Game — https://claude.ai/artifact/7Nu6gdRSrDRsfxLv7mMr67 (private
until Joe shares it). The email to Christian was delivered as a file.

### 2026-09-18 — Christian's decisions incorporated (revision 3); next-step recommendation

**Christian accepted the boundary** and moved from discovery to specification decisions:
- **C1 withdrawn as a demonstrated collision (KR-02).** RPC-001 timing is not authored. RPC-001 needs
  the build-out situation from the episode start and the objective functioning within the episode.
  Variable Target's questions stay open on its own evidence.
- **Defaults, given ids:**
  - SD-11: the longer dimension is the axis.
  - SD-12: halves and thirds are derived views.
  - SD-13: a starting player steps to the ball only at a stationary-ball start.
  - SD-14: START, SCORE and POSSESSION_CHANGE begin an episode.
  - SD-R1 (rejected): a time window starts on possession won.
- **SD-15:** "long kick" and "controlled on arrival" are FREE judgements.
- **KR-01:** Variable Target's 2–3 applies per objective set.
- **SD-16:** the free-choice boundary.
- **SD-17:** emphasis and templates stay outside the game.
- **SD-18:** closed vocabularies approved, contents not frozen.
- **SD-19:** reveal timing and information holder as fields.
- **SD-05:** P5 applies beyond value tiers.
- **He asked for** the smallest next step toward implementation design, and which open items block it.

**Revision 3:** `docs/design/game-representation-spec-2026-09-18.md` (revision 2 marked superseded).
- **§2** is a standing-decision register: SD-01 to SD-19, SD-R1, KR-01, KR-02 and RR-01. Only the
  field-supplying ids are citable, and SD-10 is not citable until he confirms it.
- **§10** holds our own readings as proposals awaiting his ruling:
  - PSD-01 to PSD-04: the four start and restart defaults from Gate A X6, never his;
  - P-1 to P-11, among them the start method field, unauthored restarts, RPC-001-11's split, the
    free-choice list, engine wording never being a source, when defaults yield, and a second Variable
    Target set.
- **Workflow A** (9 agents): two fidelity audits, citation checks, two coverage measurements, three
  next-step proposers and a judge. Both fidelity audits found my first draft of revision 3 had
  stretched his decisions: SD-13 as "every START needs a method", SD-19 applied to every information
  rule, FREE redefined, and restart-default removal presented as his.
- **Workflow B** (3 agents), a final check, found three more readings (now P-9 to P-11). It also found
  my engine-wording count too low: 10 items, 6 REQUIRED, not 6. My filter missed the `COACH_RULES`
  citations.

**Measured findings (load-bearing counts re-checked by hand):**
- **Starts and restarts:** all 11 Game Forms leave a start or restart unauthored.
  `restart_structure_type` is empty in all 11. Nothing authors a touchline restart's method or who
  restarts after a score. The model invents them because the prompt (completion.service.ts) demands
  them.
- **Engine wording in the slice:** 10 slice items rest only on engine wording, prompts or tests, 6 of
  them REQUIRED:
  - RPC-001-04 and -09, "beyond the first defenders", from `COACH_RULES`;
  - RPC-001-06 and -16, `BUILD_OUT_START`;
  - A01-02-02 and -03.

  The slice's turnover-stops-play rule loses its support. C4 reopens.
- **The contract grammar is untested:** 0 of 113 slice items carry a registered field path;
  `CHANGES_ON` (8) and `NOT_DOMINANT` (4) are missing from the comparison table; 57 items have no value
  status.
- **Contract load:** about 69 objects can bring structure into a session (63 guided); 6 have contracts;
  roughly 1,100 items remain.
- **The runtime seam** sits between app.routes.ts:913 and :964. Coach text is written before any game
  exists, at primary-scoring resolution.

**Recommendation:** `docs/design/next-step-recommendation-2026-09-18.md`.
- **The step:** a paper contract-shape conformance check, in three parts:
  - a register of every atomic field path;
  - the six slice contracts restated on it, with support worked out by hand;
  - two blind contracts, Pass Combination Gate and GF4 Transition.

  It produces a SCHEMA / VOCABULARY / KNOWLEDGE ledger and a test for "schema stable".
- **Blockers:**
  - only the untested grammar blocks design;
  - five things block build: restarts, engine wording, contracts, vocabulary review, and variation;
  - the authoring gaps block only the games that select their object.

**Pages** (private until Joe shares them):
- Before the Data Model — https://claude.ai/artifact/46iX2D64re9HDz2ymucMwp
- The Smallest Authoritative Game, updated to revision 3 at the same link.

The email to Christian was delivered as a file. Freeze unchanged. Not run: the conformance check itself,
which awaits Christian's approval.

### 2026-09-18/19 — Christian's second decisions; the conformance check run

**His decisions (revision 4 of the spec):**
- SD-10 confirmed, in his wording.
- **SD-20:** turnovers play on unless selected knowledge authors a stoppage.
- **SD-R2, SD-R3:** the coin-toss start and the conceding-team restart are rejected.
- **PSD-03:** accepted in substance, with the source visibly missing.
- **SD-21:** engine wording is never a source until authored.
- **KR-03:** RPC-001's build-out applies to the build-out episode only.
- He approved the conformance check, with Pass Combination Gate and GF4 as the blind objects.
  Amendments that change a verdict go back to him before incorporation.

**The check** — protocol and stability test committed before any result; all in
`docs/audits/conformance/`:

| Stage | What | Outcome |
|---|---|---|
| A | Register review | 16 must-fix ambiguities became RC-11 to RC-36 |
| B | Restatement | 6 contracts restated; the game restated (210 lines); 2 blind contracts |
| C | Script | Blind contracts 81/81 rows declared |
| D | Two independent derivers | 208/210 same verdict; kappa 0.983 |
| E | Verification and judgement | 9 schema verifiers: 22 real gaps, all LOCAL. Interpretation clusters: 19 residual gaps. Independent trace: all 10 disagreements traced, 3 of them reader errors. A critic; a judge |

**Verdict:** STABLE WITH LOCAL AMENDMENTS. The data model can be designed now. The derivation engine
waits for his rulings on AM-01 to AM-15, the verdict-changing amendments.
- **Two rulings would reverse it:** requiring RPC-001 to supply its own carrier (a structural guard),
  or counting derivation reading rules as structural.
- **Collisions were never exercised.** Suggested next: a small paper test on central weighting × Wide
  Zone.
- **Engine sentences relied on:** six — RPC-001's four "beyond the first defenders" setups, its scoring
  rule (the only source of "long kick"), and `BUILD_OUT_START`.

**Report:** `docs/audits/conformance-check-2026-09-19.md`.
**Page:** Does the Grammar Hold? — https://claude.ai/artifact/7GQ1R3ozFbTMpBb35Yd93e

**My errors:**
- My trace claimed no reader errors; the independent tracer found three.
- Splitting derivation by area caused a shared mistake (L67/L72).
- Coverage was counted per row, not per element.
- Nothing was re-derived after the restatement errors were found.

**Also:** a permission allowlist was added to `.claude/settings.json` (worktree and main; not
committed).

### 2026-09-19 — Christian's rulings; the fifteen amendment rules; data-model design begun

**His rulings, recorded in revision 5 of the spec:**
- **KR-04:** RPC-001 does not own or instantiate the carrier of its scoring event. It narrows the
  acceptable event identity; the game must independently contain a supported compatible carrier; where
  none exists, reconciliation fails back to selection. No conditional contract structure. This closes
  AM-25.
- **SD-22:** a new derivation reading rule is not by itself structural. Structural-semantic means
  changing the grammar, statuses, source kinds, areas, relationship model or the meaning of support;
  operational means making an already-defined relationship deterministic. This replaces the protocol's
  test condition (amended, with a note that the verdict did not depend on it).

**He accepted the primary result:** the data-model shape is stable enough to design; the derivation
engine is not. He also accepted that the unexercised collision is a derivation test, not a reason to
reopen the data model.

**He asked for the actual rules** for AM-01 to AM-15, in the form: id / ambiguity / proposed rule /
example whose verdict changes / classification. Delivered as an email and as
`docs/design/amendments-am01-am15-2026-09-19.md`. Thirteen are plainly operational; AM-03 sits closest
to the line; AM-04 is structural only in its strictest option (c); AM-05 is operational either way.
Every example is a real slice-game line with the verdicts the derivers produced.

**Held at his instruction:** the collision test waits for his AM rulings. All six code sentences stay
unratified, and "beyond the first defenders" is not promoted into RPC-001 knowledge.

**Begun:** `docs/design/data-model-design-2026-09-19.md`, part 1 — the artefacts, the register as
versioned schema, the shapes, storage and loading (fail closed, no allowlist projection), and the seam.
Everything derivation-dependent is marked and deferred.

### 2026-09-20 — His fifteen rulings; the delta; the collision test

**He ruled on all fifteen:** twelve as proposed; AM-04 resolves to (b), undeclared, because silence
cannot license a free choice; AM-05 becomes **cardinality without identity** (no ordering, no
all-elements entitlement); AM-06 is corrected so an absent supporting or preferred value is never
"satisfied". Recorded in `docs/design/derivation-spec-2026-09-20.md`.

**Applying them moves 34 of 210 slice lines.** Three interactions:
- **AM-13 needs AM-17.** All of Wide Zone's region items are own-involvement scoped, and no item of its
  at another scope entails a region, so AM-13 empties that scope: ten lines fall, nine items go unmet.
  AM-17's lateral-position selector attribute is the fix, which makes a "local" amendment
  verdict-relevant. His call.
- **AM-05 overrides the AM-01 example I gave him:** the item matches two objectives against a minimum
  of one, so it entails neither. The forward result still changes.
- **AM-05 works as intended:** the four target zones' existence moves from entailed to unauthored.

**Three labels flagged, none invented quietly:** cardinality is only ever an item result, never a
property; `NOT_REALIZED` for a supporting item whose value is absent; `VALID_ABSENCE` for a
closed-world absence.

**The collision test answers NO** (`docs/audits/collision-test-2026-09-20.md`):
- As authored, nothing collides because no contract mentions central value at all; it lives only in
  engine code.
- Written as if authored, the objects still never share a line: under AM-11 an item marked "each" binds
  the member it names. The disagreement lands as two unrelated forward "unmet" entries.
- **The failure mode is silent acceptance:** name the corridor an additional referent and every line
  reads entailed while Wide Zone's point is dead.
- **The contradiction is comparative** and no requirement kind is.
- **Gate A's overlap rule cannot fire** as the register stands, which corrects revision 5's claim that
  it catches the "deep" tier. Render fidelity does.
- **The collision path has never fired:** 0 unresolved across 420 line judgements; 2 relationship rules
  across 8 contracts, neither on a value row.
- **A fourth hiding mechanism:** unplaced. WIDEZONE-09 never became an item, yet the game's corridor
  lines cite it as provenance.

**He answered that on 20 Sep: YES.** His rulings, all incorporated:
- **AM-16 extended** as the minimum generalized comparison mechanism — value(A)>value(B),
  count(A)=count(B), width(A)>width(B). **Never translated into mutual exclusions**; a comparative is a
  relationship, not a prohibition. Preserve the distinction between changing the relative value or
  availability of possibilities in the environment and prescribing the learner's solution.
- **The comparison boundary stays inside represented game properties** — never pressure, opportunity,
  affordance availability, difficulty or uncertainty. His test: "whether the comparison is between
  properties the resolved game actually contains and can evaluate."
- **AM-17 adopted**, with AM-13 preserved: selection does not entail existence.
- **Cardinality: no schema change yet.** `not realized` approved. `valid absence` approved as a **line
  outcome, not a Game status** — the four Game statuses stay as they are.
- Retain: "Reconciliation can only expose conflicts that have first been expressed in the grammar."

**The narrow rerun** (`docs/audits/collision-rerun-2026-09-20.md`), verified by a re-derive / attack /
judge check rather than asserted:
- **The gain:** the comparative is expressible for the first time, both sides surface, Gate B forward
  does not pass, and the silent-acceptance configuration now reports both claims violated. AM-17 created
  nothing and AM-13 held.
- **As run it reached PARTLY:** the two claims landed as two unrelated forward failures, because nothing
  said which line a comparison reaches. Four rules were missing from my spec, not from his decisions.
- **On the amended text it does reach UNRESOLVED** at the wide modifier's magnitude line, under either
  reading of that magnitude.
- **Still not established:** neither item is real knowledge (Wide Zone's contract stops at item 17, and
  the other side is invented); **no row holds a region's value, so his own `value(A) > value(B)` example
  is unwritable in the form he adopted**; nothing he ruled says a not-evaluable comparative still bounds
  its line; the magnitude's kind is unfixed, so the conflict is detectable but not recordable.
- **Six residuals sent**, in load-bearing order: operand form; effective value and the magnitude's kind;
  whether an ASSUMED item can collide with an authored one; which line a comparison reaches; **whether
  my amendments are operational under SD-22 or structural** (they touch the relationship model and the
  meaning of support, both named in SD-22's own list); and two the case exposed — whether a collision
  should outrank an unauthored gap, and whether anything screens a comparative for whether its knowledge
  is real, since one fabricated comparative can currently unresolve any modified property.
- **Correction sent:** revision 5's claim that AM-17 rescues L21/L27 was wrong; four of five lateral
  values had no interval test. Written now, not re-derived.

**20 Sep, second — he closed the collision exercise, and three of his rulings overturn rules of mine.**
Registered as SD-23 to SD-29 and KR-05 (spec revision 6, `docs/design/derivation-spec-2026-09-20.md`):
- **SD-23, operands:** a represented game property, **or a deterministically derived quantity whose
  inputs are supported represented game properties**. No region-value row. A derived quantity may
  compute relationships among represented environmental properties, never learner or ecological states.
- **SD-24, effective value:** "primary-event base value after application of all applicable resolved
  value modifiers for the referent." A modifier **must declare its operation** (new field `V9a`);
  multiplier versus increment is never inferred. Unauthored operation or magnitude → **not computable**.
- **SD-25:** one point per qualifying primary scoring event unless authoritatively modified. This is
  what makes V2 supported, and so what makes any effective value computable at all.
- **SD-26, where a comparison lands — replaces my reaches-line rule:** it takes **no property line**. A
  relationship assertion evaluated over its operands, outside the eight areas. Unresolvable operands →
  unmet or not evaluable by requirement status. Two authoritative, well-formed, evaluable comparatives
  that nothing satisfies → **unresolved relationship conflict**. **No ninth area.**
- **SD-27:** an assumed item **cannot** create an authoritative collision — diagnostic "possible
  tension" only. This closes the fabricated-comparative problem.
- **SD-28:** **gap before collision.** An unauthored or incomputable dependency is a gap first.
- **SD-29, the classification he asked to be recorded precisely:** a **bounded structural-semantic
  extension to the contribution/derivation grammar**, not an operational reading rule; **the Game
  Representation data shape remains stable**. Record the distinction, do not weaken the data-model
  stability finding.
- **The worked case now resolves as a GAP, not a collision** — the right answer, and the opposite of
  what my rules gave.

**22 Sep — design phase CLOSED; derivation-engine IMPLEMENTATION AUTHORIZED.** The final independent
check (his four questions) returned **all four clean, no genuine blocker**, at commit `123f29b`. Under his
22 Sep ruling, implementation is authorized. **Activity generation remains frozen.** Implementation has
**not started** — it begins when Joe says go.
- **The spec to implement:** `docs/design/derivation-engine-design-package-2026-09-20.md`, revision 5.
- **Rulings since 20 Sep** (spec revision 10): SD-39 (OPEN authority), SD-40 (candidate = evidence),
  SD-41 (comparatives unexercised), SD-42 (restricted computations), SD-43 (Gate A certifies only
  structurally decidable claims; `NOT_CHECKABLE_OUTSIDE_REPRESENTATION` non-blocking, represented-but-
  undefined blocks), SD-44 (structurally reachable).
- **Open with him:** residual space — sent the exact wording and the finding that it fuses an
  anti-invention rule with Wide Zone's single-contract aggregate; define or remove is his. And whether
  `NOT_REALIZED` covers a failed supporting cardinality check.
- **Proposed first slice:** stages 0–2 (load, normalise, index) with the refusal-coverage tests.
- **The rev-4 email was never sent**; its content was carried into the 22 Sep response
  (`docs/design/email-carry-forward-rev4.md`).
- **How the checking worked:** Codex ran read-only briefs; every finding was audited against the files.
  Three sweeps plus the final check; each found less than the last.

**20 Sep — derivation-engine DESIGN is authorized** (SD-30..SD-34, SD-10a; spec revision 7). **Design
may begin; implementation stays frozen until he reviews the proposed design.** Proposal:
`docs/design/derivation-engine-design-2026-09-20.md` — a pure function over loaded data, report-only
(SD-33), with three property states (derived / open-with-bounds / failed), twelve stages each naming
what it refuses, six typed failure kinds plus a diagnostic tension no gate reads, and versions in the
output because SD-30 means a result is valid only for the versions it names.
- **Open for him:** who fills a permitted free choice (proposed: the engine reports it open, a separate
  realization step fills it), and whether `BUILD_OUT_EPISODE` becomes a sixth scope.
- **The register was not executable.** Thirteen closed vocabularies and every conditional applicability
  rule (T2–T5 "N/A when CONTINUE"; V14b ACCESS, V14c COUNT_CHANGE) lived only inside `valueType` prose.
  Now `vocabularies` and `applicability` blocks — **form changed, membership untouched**. Left as it
  was, applicability alone would have made Gate A unpassable for every turnover transition, which under
  SD-20 is the common case.
- **A sixth scope is in use and unregistered:** `BUILD_OUT_EPISODE` on 6 items; 64 more carry an em-dash
  placeholder where a scope belongs (a contract defect, not a vocabulary question).
- **The one circularity, found by attacking my own design:** own-involvement scope is defined by what
  other-scoped items entail, and entailment comes later. Broken with a restricted one-iteration pass;
  the engine compares both passes and reports divergence rather than preferring one.
- **Cannot be represented** (§9): conditional requirements, either/or between whole layouts,
  permissions conditioned on another object, example-only existence, aggregates across elements, and
  comparative cardinality. Three share one shape — knowledge that says *when* a requirement is live.

**The engine-design question is answered** (`docs/design/engine-design-readiness-2026-09-20.md`):
**no true blocker**, on one condition — the engine is specified to **refuse rather than guess**. Eight
refusals belong in its spec, chiefly: effective value with two applicable modifiers and no authored
combination rule is **not computable** (the operations do not commute, so a fold order would be an
invented answer that reads as supported). Three scoped items are his, one sentence each: whether
own-involvement **declarations** empty with their items (31 items, 29 declarations across the eight
contracts; it flips Wide Zone's channels between INVENTED and a declared gap); whether AM-12 extends to
an element reference held in an item's **value** (today a prose reference misses silently); and the
failure path, which does not block if the engine is **report-only**.
- **All three were ruled the same day** — SD-31 (declarations survive; an empty scope empties the
  item's application set, not the declaration), SD-32 (every structural reference normalises, not just
  selectors) and SD-33 (report-only). The three questions above are the record of what was asked, not
  of anything still open.
- **His second comparison example cannot be written:** `count(A) = count(B)` needs cardinality to be a
  property, and he ruled no schema change yet. No change proposed on a hypothetical.
- **SD-10 could never fire as I typed it** — an EXISTS item whose value was the prose phrase
  "functionally necessary". Retyped as what his ruling is, a prohibition on removal; the machine test
  for necessity is flagged as his.
- **AM-17 rederived** (two independent derivations agree, all eight lines): the lateral tests are
  complete and correct, **no verdict moves**, and the register was never the obstacle — **no contract
  carries a lateral selector at all**. AM-17 is usable and unused; the remedy is re-authoring the
  contract, not derivation. My earlier claim was wrong twice over and the correction is in the record.
- **`V9a` costs a line per modifier**, unauthored in the slice game — so "not computable" now has a line
  the audit can point at. Games resolved before 20 Sep are short that line and need re-deriving.

**The six code sentences are classified** (`docs/design/code-sentences-classification-2026-09-20.md`),
awaiting his individual rulings: retire 1–4 (the "beyond the first defenders" setups — KR-04 already
says RPC-001 does not instantiate its carrier, and RPC-PROP-132 authors the scoring condition); retire
5a and 5c (5c is authored as "long clearance", while SD-15 names "long kick" — flagged); **5b needs a
standing decision** (one point per qualifying event — no workbook authors any base value); retire 6
("each attack" contradicts KR-03, and "in your own half" is an unauthored placement claim). Three
authoring gaps are named, not filled.

**Live behaviour worth checking when the freeze lifts:** the slot modifier carrying central weighting is
attached to slot 1 of every Discovering Solutions session regardless of the selected constraint, so a
coach running Wide Zone Advantage is told to go wide and paid to go central.

**22 Sep — IMPLEMENTATION STARTED (increments 1–3).** Code: `back/src/system/derivation/`; 55 tests in
`npm test`; full project suite passes. Reports: `docs/design/implementation-increment-{1,2,3}.md`.
- **Stages built:** 0 load · 1 normalise · 2 index · 3 scope · 4 reach · 5 derive · 6 classify · 8 forward.
- **Not built, deliberately:** stage 7 (zero `COMPARES` items in the corpus; SD-41 forbids expanding it
  without authored evidence) and stage 9 (no `CandidateGame` input exists — the stage-B game is a
  hand-derivation worksheet with prose attributes and positional ids).
- **Two defects the real corpus found that unit tests did not:** openness produced by absence, against
  SD-39; and `COUNT`/`RANGE` read as existence on a field row.
- **Three SD-48 stops** recorded and reported: reach against a class, a choice space bounded by authored
  values with nothing authored, and set-valued member expansion.
- **Corpus today:** 1 contract admitted / 7 refused; 15 lines → 2 resolved, 13 gaps, 0 collisions;
  forward 7 unmet / 6 inert / 2 satisfied. Every refusal traces to a task-register defect.
  *(Corrected by increment 4 — see below. The real figures are 6 resolved / 9 gaps.)*

**22 Sep — INCREMENT 4: STAGE 10, THE GATES.** 33 further tests, **88 across the four increments**; full
project suite passes. Report: `docs/design/implementation-increment-4.md`. Code adds
`{gates,rational,corpus}.ts`.
- **Gate A:** fifteen checks, the §7.2 catalogue exactly — ten fully structural, four split under SD-43,
  `GA-MODIFIER-OVERLAP` refusing with `CHECK_NOT_EXECUTABLE` for object/event (F2, still open).
  `GA-RESIDUAL-SPACE` is absent and a test keeps it absent (SD-45). Gate B reverse is `NOT_APPLICABLE`.
- **The gate rule that matters:** a clause whose subject line is a **gap** blocks and names the line; it
  never reports that the game failed. SD-28 carried into the gate. A test asserts **no check ever returns
  `PASS` while naming a line it was blocked on**, across fixtures and the real corpus.
- **Three defects found, all mine:**
  1. **the session's four envelope values were being dropped** — §1.2 makes the envelope the `SESSION`
     source and §1.4 makes `SESSION` a way a line is *derived*, but stage 5 consulted it only to decide
     openness. `E1`–`E4` were `NOT_AUTHORED` in every run. **This is why the increment 3 corpus figures
     were wrong.**
  2. a line resolved by a **standing decision carried no value** (SD-25 states `V2 = 1`; the record held
     nothing), though §1.4 requires a value wherever a line is derived;
  3. a **qualitative range became a `COUNT` bound with null endpoints** — constraining nothing while
     looking numeric, which `GA-LAYOUT-FEASIBLE` would have ignored while certifying feasibility.
- **Also fixed:** the `GAP` failure record §3.2 raises at stage 6, which increment 3 omitted entirely.
- **Four clause texts asserted more than their code checked** — the fused-claim defect he found in
  `GA-RESIDUAL-SPACE`, recurring in `GA-DIRECTION`, `GA-ONE-PRIMARY-EVENT`, `GA-TRIGGER-UNIQUE` and
  `GA-EFFECT-TYPED`. Each split; each part executed.
- **One reading surfaced to him:** §7 does not say what a clause does when the line it needs is a gap.
  The engine reads it as `NOT_EVALUABLE` per §8's rule for a gapped dependency. Both readings block, so
  it cannot manufacture a `PASS` — recorded as a stop, not buried.
- **Corpus, stages 0–10:** 1 admitted / 7 refused; 15 lines → **6 resolved, 9 gaps**, 0 collisions;
  failures 7 `LOAD_REFUSAL` + 8 `REFERENCE_DEFECT` + 9 `GAP`. **Gate A: FAIL** (9 pass, 4 not evaluable,
  2 fail). Seven of the nine passes are *emptiness, not verification* — nothing of that kind is
  instantiated, because seven of eight contracts were refused at load.
- **The corpus is now a committed input** (`corpus.ts`) and its figures are asserted in tests, so numbers
  quoted in any report are reproducible from the repository.
- **Next:** stage 11 (emit) — assemble and stamp the full `DerivationResult`. That is the last stage.

**23 Sep — INCREMENT 5: HIS RULINGS (SD-49..SD-56) AND STAGE 11.** Pipeline complete. 103 tests across
five increments; suite green. Report: `docs/design/implementation-increment-5.md`. Spec now **revision 12**.
- **Every SD-48 stop is closed; a run reports zero stops.** SD-49 reach against a class (three-valued —
  `reaches()` already matched it exactly, so no change); SD-50 unsupported choice space is a **GAP**;
  SD-51 member lines only from authoritatively resolved membership; SD-52 confirmed the gap-blocks
  reading.
- **SD-53 applied generally**, not as four exceptions: every executable gate clause is atomic, guarded by
  a test that no clause text fuses claims. `GA-REGION-FUNCTION`, `GA-EFFECT-TYPED`, `GA-TIME-WINDOWS`,
  `GA-OBJECTIVE-SETS` decomposed.
- **SD-54 — and it paid for itself immediately.** Of 24 passing clauses on the corpus, **2 evaluated
  anything and 22 are vacuous**. Never report an aggregate pass count without this split.
- **Fourth defect, found by §8 itself:** `run.inputDigest` was taken over the input as given, so shuffling
  item order changed the emitted result. Now taken over a canonical form — contracts/items/selection and
  object keys ordered, **array values left as authored** (AM-11). Found only because the stage 11 test
  compared the *whole* record, not the parts expected to vary.
- **Stage 11 enforces rather than assumes:** an unstamped result is emitted as a stamped halt (SD-30);
  every §1.4 field appears only where its condition licenses it, asserted both directions over the corpus.
- **Corpus, complete pipeline:** 15 entries (6 derived — 4 SESSION, 2 STANDING_DECISION — 9 failed);
  audit 15/15, 0 collisions, 8 reference defects, 0 tensions; **Gate A FAIL**; Gate B forward PASS,
  reverse NOT_APPLICABLE; **0 stops**.
- **Open with Christian:** `GA-MODIFIER-OVERLAP` semantics. Evidence delivered in
  `docs/design/modifier-overlap-evidence.md` — **four** items across two contracts, all `event`; **no
  corpus item uses `object` at all** (the package's "two items, object and event" was wrong on both
  halves). Neither case reaches the gate today: GF4 is refused whole over an unrelated `row: "NONE"`
  item, and A01-02's item is `ENGINE_ONLY` so it is inert.
- **Deferred with his confirmation:** stage 7 (no canonical comparative) and stage 9 (no legitimate
  candidate representation until the downstream governed-choice process exists).

**23 Sep — INCREMENT 6: SD-57..SD-61. MODIFIER OVERLAP IS NO LONGER A BLOCKER.** Spec **revision 13**;
106 tests; suite green. Report: `docs/design/implementation-increment-6.md`.
- **His verdict on the evidence:** it *"does not establish a current reachable modifier-overlap problem."*
  GF4 is refused whole at load over an unrelated `row: "NONE"` item; `A01-02-12.b` is `ENGINE_ONLY` and
  inert. The gate sees **zero** modifiers. F2 and the package entry both corrected — the "two corpus
  items" claim was wrong twice (four items, all `event`, none reachable).
- **SD-57 identity:** a referent resolves only through a registered structural reference. Open text
  establishes none, and is **not** compared as a token — that would promote open-text equality into
  identity. Applied to region referents too (flagged to him): the code had been comparing raw strings.
- **SD-58 — and it caught a real fault.** `GA-REFERENCE-INTEGRITY` was **failing** on any derived
  reference naming no held element, open text included: the engine asserting a violation it had no
  authority to establish. Now blocks and names the line. Gap-before-collision untouched.
- **SD-59** no alternatives mechanism → task register **C7**; **SD-60** no object-condition semantics
  → its own refusing clause; **C8** added (events have no first-class identity).
- **One new stop, record-keeping not semantics:** §3.2 raises `GAP` at stages 2/5/6/7 only, and the line
  in an unestablishable-relationship case is usually *derived*, so nothing in `failures` marks it. Did
  **not** extend §3.2 unilaterally. Blocks either way, so it cannot cause a wrong pass. Fires only where
  the case arises — corpus reports zero stops.
- **`npm run corpus:diagnostic`** renders the emitted result and **adds no semantics** — if a figure is
  wrong, the engine is wrong. Headline: **2 clauses evaluated against real instances, 24 vacuous.**
- **Not done, on his instruction:** stages 7/9 not reopened for coverage; **no corpus repair begun**;
  generation still frozen.

**24 Sep — SD-62..SD-66, AND CORPUS REPAIR PHASE A.** Spec **revision 14**; 113 tests; suite green.
Ledger: `docs/design/corpus-repair-ledger.md`.
- **SD-62** a blocked gate clause carries its own structured record (clause · dependency · reason) and is
  **not** a derivation GAP. *"Both prevent an unearned PASS, but they describe different failures of
  knowledge."* Built in `result()` so no blocked clause escapes without one, and a block can never name
  nothing — if a check can't point to a line it names what it examined.
- **SD-63 generalized the identity rule — and it found five more of the same bug.** Information subjects,
  consequence referents, objective-set members, objective references, primary-event referents were all
  still inferring identity from matching text and **failing** when it didn't match. All now withhold.
- **SD-66 phase A — encoding repair only.** Corpus was UTF-8 read as CP1252. Repair is the **exact
  inverse** (char → CP1252 byte → decode UTF-8), no character special-cased, non-round-tripping strings
  left untouched. Original artefact **not modified**; applied on load, counted, reported every run.
  **339 strings, 680 chars recovered.**
- **Effect: contracts admitted 1 → 3, lines 15 → 95, derived 6 → 15, outcome kinds 3 → 5.** RPC-001 and
  VARIABLE-TARGET-CONDITION now load clean.
- **Stopped at his line.** 28 remaining load defects, none mine: **25 restatement** (row names no register
  row — and they split **20 outside-boundary vs 5 structural-in-kind**, which is the real question) and
  **3 new authoring** (V9 magnitude with no V9a operation, SD-30).
- **Phase A exposed two genuine gate failures, recorded not repaired:** three primary events where SD-06
  requires one; an information rule naming an unregistered trigger. 77 failed lines (52 coverage, 23
  declared gap) = the shape of phase B. **Do not optimize toward green.**
- **Also fixed:** SD-51 member lines were `RESOLVED` while carrying no value — caught by the §1.4
  invariant added in increment 5.
- **Next:** await his ruling on the 25 + 3. Phases B/C/D not started.

**24 Sep — PHASE A COMPLETE (NO_ROW applied; 9-case evidence packet sent).** Register **version 3**;
119 tests; suite green. Packet: `docs/design/phase-a-evidence-packet.md`.
- **`NO_ROW` is a contract-level sentinel, NOT a row** — creates no property, line, class or element.
  **The guard is the point:** the three conditions are enforced in `load.ts` (not trusted), a sentinel
  colliding with a row id halts the register (H1), and three tests hold it. The 20 items are named one by
  one in `corpus-restatement.ts` *and* re-checked against the conditions before applying — **20 applied,
  0 withheld**. The 5 structural items are deliberately absent, guarded by a test.
- **Phase A meets his boundary: no contract refuses for a mechanical reason.** 3 load clean
  (RPC-001, A01-02, VARIABLE-TARGET-CONDITION); 5 refuse for a specific named semantic issue.
- **A 9th case surfaced that he didn't ask for:** `PASS-COMBINATION-GATE` has **64 declarations with an
  em-dash `scope`**, every one a `NON_CLAIMED`. Hidden until now because the loader stops at the first
  defect and its six row items came first. Two readings differ (`null` vs `WHOLE_GAME` as its 6 peers
  use) — left alone.
- **The 5 structural cases split three ways, and the packet says so:** GF2-01 may be derivable by
  construction; GF2-02 + GF2-22 are the same representation gap from two directions; GF2-15 is `ASSUMED`
  so it could never entail regardless of row (likely mistyped); NEUTRAL-05.a belongs to knowledge-core
  Participant State — a layer boundary.
- **The 3 modifiers split too:** WIDEZONE-13.a/b are **one source sentence read twice** (source offers
  three alternatives, states no operation — the contract's own declaration says so). **GF4 I14 is
  different: "double points" IS operation-bearing language.** Reported separately, not flattened.
- **Diagnostic now reports repair provenance**, counting encoding and restatement separately.
- **Untouched:** 77 failed lines, 3 primary events, unregistered trigger, 17 gate blocks. **Phase B not
  begun** and must not begin until these nine are ruled or retained as justified refusals.

**24 Sep — SD-67..SD-74: THE PHASE A LOAD BOUNDARY IS REACHED.** Spec **revision 15**, register
**version 4**; 123 tests; suite green. **All 8 contracts load; 0 refusals** (was 1/7 two days ago).
- **Two bounded refinements, eight areas unchanged:** `R1`–`R4` **Action Restriction** in the Rules area
  (receiver eligibility · action order · direction class; authored legal eligibility only), and
  `P11`–`P13` **Performer Participation State** *bound* to knowledge-core EM-0007/EMD-0014/EMP-0040/42 via
  `register.boundVocabularies` — referenced, not re-authored.
- **`BY_CONSTRUCTION` (SD-67) executes its invariant at load, never trusts it.** Absent, unregistered,
  untestable or false → refused. Four tests. *"By construction" is otherwise the shape of an excuse.*
- **BOTH REFINEMENTS EXPOSE A DEPENDENCY — the answer he asked for:**
  1. Action Restriction holds a restriction, but GF2-22 asserts **none exists**, and `NOT_EXISTS` on a
     COLLECTION has no existence treatment in stage 8 (`isExistence` covers EXISTS/COUNT/RANGE only) → it
     reads `UNMET`. 2 structural NOT_EXISTS items corpus-wide; both hit it.
  2. Participation State holds the value, but NEUTRAL-05.a states a state with **nothing asserting the
     participation entry exists**. P8/S2/J1 all carry existence items; this contract predates the row.
     Authoring it is new knowledge. **Neither repaired.**
- **Flagged to him:** Action Restriction sits in area §5.8, titled *"Rules of value"* — it is the first
  rule there that is not about value. Placed as directed; title left alone; naming is his call.
- **SD-49 reclassified:** an indeterminate reach is no longer a `stopped` entry — the semantics are
  established, so following them is not stopping. Count stays in `run.counts.undeterminedReaches`.
- **Bug my own invariant caught** once transitions reached the corpus: `GA-TRANSITION-COHERENCE` passed
  while naming blocked lines. An unauthored placement *confirms* "a CONTINUE transition carries no
  placement". Added `Probe.peek` for that one case only.
- **Corpus now:** 194 lines · 33 derived (27 entailment, 4 session, 2 SD) · 137 failed · 12 open · 220
  item outcomes. **First collision ever:** `game::V1`, three contracts disagree on the primary event kind.
  Gate A FAIL — **4 clauses evaluated vs 4 vacuous** (was 2 vs 24).
- **Untouched, on his order:** 5 primary events, unregistered trigger, 137 failed lines, 20 gate blocks.
  **Phase B awaits his word on the two exposed dependencies.**

**24 Sep — SD-75..SD-77: PHASE A CLOSED. PHASE B CLUSTER 1 ANALYSED.** Spec **revision 16**; 126 tests;
suite green. All four of his closure conditions hold.
- **SD-75 negative existence**, general for collections. Tested against **all nine** corpus cases: the
  **7 outside-the-representation ones all stayed outside** (the treatment sits after the boundary guard;
  a test asserts the count of 7 rather than trusting order). GF2-22 → `SATISFIED`, NEUTRAL-17.a →
  `NOT_EVALUABLE`.
- **SD-76 traced, and the answer was yes.** `NEUTRAL-01.a` (P5 count `>= 1`, REQUIRED/AUTHORED/STRUCTURAL,
  *"One or more neutral players join…"*) entails the group **independently** of the participation
  property, so it is restated as `NEUTRAL-01.b` on P11 — traced to `NEUTRAL-01`, **not** to NEUTRAL-05,
  with a test on that provenance. A property never establishes its own element.
- **SD-77** §5.8 renamed **Interaction Rules**. Descriptive only. No ninth area.
- **The sport-coupling ratchet caught a real thing**: my evidence string named a soccer module file in
  *engine* source. Provenance now carried by reference; ratchet back to baseline 35.
- **Corpus at the closed boundary:** 8 admitted / 0 refused · 196 lines · 34 derived · 137 failed ·
  221 item outcomes. Gate A FAIL, **4 clauses evaluated vs 4 vacuous**.

**PHASE B CLUSTER 1 — `docs/design/phase-b-cluster-1-primary-event.md`. THE COLLISION IS NOT A
DISAGREEMENT.**
- Three contributions (GF4 `I01`, GF2 `GF2-19`, RPC-001 `RPC-001-08.a`), all REQUIRED/AUTHORED/
  REQUIRED_RANGE/WHOLE_GAME. **None states a value** — each states a permitted *set*. The three
  intersect to exactly **`{line_crossed}`**. Independent objects **converging**, not conflicting.
- **Cause: derivation semantics.** `entails()` reads `EQUALS` as fixing a value and ignores
  `valueStatus: REQUIRED_RANGE`. **Spec §5.8 already says the right thing** ("SELECTION narrows to a
  valid set … the kind is FREE under SD-39 and is chosen downstream") — unimplemented.
- **The worse, quiet half:** where *one* set-valued item reaches a line, it is reported
  `RESOLVED:ENTAILED` **holding the set as its value**. Two lines do this today (`GF2-03.a::S3` holds
  the literal `"{zone, line} — set of alternatives, unordered"`). A wrong answer labelled right.
- **Correction (NOT applied):** REQUIRED_RANGE set narrows; narrowings intersect; singleton → resolved,
  many → `FREE(choice)`, empty → genuine collision. Resolves the only collision, both silent lines, and
  part of 2 gate checks. **Knowledge-side prerequisite is his**: the set values are prose-wrapped and
  SD-32 forbids reading meaning out of text — 5 items would need restating.
- **Must stay unresolved:** the approved order (RC-29 keeps but does not apply it — *the singleton here
  is luck, not resolution*); the prose sets; and whether narrowings from different objects may be
  intersected at all (a composition rule, his to confirm).
- **Implication for the rest:** the corpus's only collision was an artefact. Some of the 137 failed lines
  will be the same defect relabelled — which is why counting failed lines points the wrong way.

**24 Sep — SD-78..SD-82: CLUSTER 1 CORRECTED.** Spec **revision 17**; 133 tests; suite green.
- **SD-78 composition by intersection.** Independently authored `REQUIRED_RANGE` narrowings on one
  property are intersected — the engine determines what they *jointly permit* and chooses nothing.
  1 member → `RESOLVED` with **all** contributors as support; >1 → `FREE(choice)`; 0 → genuine
  `UNRESOLVED`. **Authored order may not narrow a multi-member intersection (RC-29 stays unresolved).**
- **`game::V1` → `RESOLVED:ENTAILED` = `line_crossed`, support 3. Corpus collisions 1 → 0.**
- **Both silent set-as-value lines corrected** → `FREE(choice)`. `RPC-001-18.a::V5` now agrees with its
  own contract fit-note ("Which placement applies is undecided") — the engine had been contradicting the
  contract, and the contract was right.
- **SD-80 regression, wider than asked:** besides the specific one-contribution case, a **corpus-wide
  invariant that no derived line may hold an array as its value**. Also asserted: a `REQUIRED_RANGE`
  carrying a *scalar* still fixes what it states (trigger is the set, not the status).
- **The failed-line count did not move: 137 → 137.** Cleanest illustration of SD-81 — a wrong value
  fixed, a false conflict removed, two silent errors made honest, and the headline number unchanged.
- **Sport-coupling ratchet caught me again, and was right again.** An authored member reads *"the
  goalkeeper's START/restart placement"* and SD-79 forbids paraphrase. The real fault: **corpus data in
  engine source.** Restatements now live at `docs/audits/conformance/stage-b/corpus-restatements.json`;
  only mechanism + conditions stay in code. Better provenance — the ledger is now a reviewable diff.
- **SD-81 reach classification (required of every cluster from now on):** cluster 1 is **a general
  derivation/composition rule** — one correction touched 5 items, 3 rows, 3 contracts, no football
  knowledge.
- **SD-82 pilot boundary** is a *criterion*, not a date (~5–6 weeks of season left, explicitly not a
  deadline): keep diagnosing internally while failures are what engine/contracts/controlled tests can
  establish; pilot when unresolved questions need observation of real coach–learner–environment
  interaction. Cluster 1 is evidence we are still firmly on the internal side — no coach could have
  found it.
- **V0 untouched.** Five primary events, Gate A still FAIL on the same six checks. **Cluster 2 = the
  primary-event existence/cardinality problem.**

**25 Sep — THE `game::V1` DISCREPANCY, TRACED AND RECONCILED.** 135 tests; suite green; stops back to 0.
- **He caught an inconsistency between two things I sent him** — the cluster report said `game::V1` =
  `line_crossed`, the diagnostic said "RESOLVED but carries no value". He was right to hold cluster 2.
- **The value was never lost.** It reached final assembly correctly throughout. **The gate's own
  valueless invariant was wrong** — the check whose entire job is catching that fault had the fault.
- **Root cause: four sites each had their own copy of "how a derived line gets its value"** (the verdict,
  emitted value, emitted support, and the invariant). SD-78 added a route; three were updated, the
  invariant was not.
- **Fix: `resolvedValue()` in `derive.ts` is now the single answer**, called by all four. Nothing left
  to keep in step. *Patching the fourth copy would have left three more chances to repeat it.*
- **Tests, two:** (1) `game::V1` carries `line_crossed` **through final assembly**, with the resolution,
  audit and gate views all agreeing; (2) **the general cross-check** — no line may be derived-with-a-value
  in one view and valueless in another, asserted corpus-wide. That is the one that would have caught it.
- **Diagnostic now prints `DERIVED VALUES`** (line · route · value · support count). Counts alone let two
  views drift without either looking wrong. `game::V1` now reads `ENTAILMENT  line_crossed / supported by
  3 contributions` **in the diagnostic itself**, so it agrees visibly, not by absence of complaint.
- **Reach (SD-81):** general, but about **engine internal consistency**, not knowledge — one fact, one
  place that computes it. Changes no count; makes two reports agree. Counted as part of cluster 1.
- **Cluster 1 CLOSED** (he confirmed 25 Sep). Next: cluster 2.

**25 Sep — PHASE B CLUSTER 2 ANALYSED (nothing corrected; awaits his ruling).**
`docs/design/phase-b-cluster-2-primary-event-existence.md`.
- **The five primary events are not five events.** Two are **exclusions forbidding a second primary
  event** (`VARTARGET-12.a`, `WIDEZONE-16.b`) — and **both report `SATISFIED`, because they formed a
  class.** The engine discharged "there must not be more than one" *by instantiating one*, then failed
  the game for having too many. A third (`RPC-001-08.b`) is an `ASSUMED` restatement of SD-06 and says so
  in its own evidence. **Only two are genuine authored existence assertions** (`PCG-01`, `VARTARGET-11.a`).
- **Cause: `formClasses()` never calls the support rules.** §3 (EXCLUSION never supports · ASSUMED a
  bound only · ENGINE_ONLY and OUTSIDE_BOUNDARY inert) and SD-47 ("**authoritative** selectors") are
  already enforced by `isSupportCapable()`/`entails()` wherever a *value* is derived. `formClasses` forms
  a class from any COLLECTION row with an existence-shaped requirement, whatever its strictness or basis.
  **Same shape as the `game::V1` follow-up: one rule, written down, applied inconsistently.**
- **Not about the primary event. 19 of 53 element classes (36%) were manufactured from contributions
  that cannot support anything**, accounting for **47 of the 137 failed lines**.
  | from | classes | failed lines |
  |---|---|---|
  | `ASSUMED` | 9 | 21 |
  | `EXCLUSION` | 5 | 17 |
  | `ENGINE_ONLY` | 3 | 4 |
  | `OUTSIDE_BOUNDARY` | 2 | 5 |
- **Correction splits:** (a) EXCLUSION/ENGINE_ONLY/OUTSIDE_BOUNDARY are unambiguous and already enforced
  a few lines away — 10 classes, 26 lines; (b) **`ASSUMED` needs his ruling** — whether an assumption may
  establish *existence* (as distinct from entailing a value) is stated nowhere — 9 classes, 21 lines.
- **The 47 lines are NOT progress.** They are fields of elements never established. Flagged hard per
  SD-81: a 34% drop in the failure count would badly misrepresent it.
- **Residual, his:** after both corrections **two** legitimate authored assertions remain on `V0`, the
  only row whose `valueType` fixes its own cardinality ("exactly one element (SD-06)"). SD-47 forbids the
  engine merging them or deciding whether SD-06 is violated or merely restated twice. Same territory as
  SD-67 (by construction). Also open: an EXCLUSION existence item probably belongs in SD-75's negative-
  existence path, not the existence path.
- **Reach (SD-81): a general derivation rule** — which contributions may *establish* anything at all
  (cluster 1 was how they *compose*). 7 rows, 5 contracts, 6 areas, no football knowledge.

**25 Sep — SD-83..SD-85: CLUSTER 2 CORRECTED.** Spec **revision 18**; 144 tests; suite green. All eight
closure conditions hold.
- **SD-83 establishment boundary**, one shared definition (`establishesExistence` in `derive.ts`): only
  support-capable *authoritative* contributions establish an element. **Classes 53 → 33**; nothing
  anywhere is now established by an EXCLUSION/ASSUMED/ENGINE_ONLY/OUTSIDE_BOUNDARY item, asserted
  corpus-wide.
- **SD-84 singleton identity**, read from the invariant **as data** — a citable decision stating
  `COUNT = 1` on a COLLECTION row (`register.singletonRows`), **never** from the row's prose.
  `c:singleton:V0`, `supportedBy` = PCG-01 + VARTARGET-11.a, `singletonBy` = SD-06.
  **A test asserts it is NOT a relaxation of SD-47** — identical selectors on a *non*-singleton row still
  form two classes.
- **SD-85** exclusions route through SD-75's negative-existence path; no new mechanism.
- **Failed lines 137 → 90. None of it is progress** — those 47 were fields of elements never established.
  Recorded that way in the cluster report, the commit and the email.
- **Gate A by cause, not counts.** `GA-ONE-PRIMARY-EVENT` first clause **PASSES (1 primary event)**;
  `GA-DIRECTION` stopped failing **because the teams causing the failure were themselves illegitimate**;
  `GA-EFFECT-TYPED` passes because its only consequence had been created by an exclusion forbidding one.
  **Vacuous passes 4 → 10 — the gate reads better partly because there is less to check** (not evidence,
  SD-54).
- **DEPENDENCY EXPOSED, STOPPED AT (his instruction):** both exclusions report `NOT_EVALUABLE` — their
  forbidden cardinality is prose (*"more than 1 (…)"*, *"2 or more (forbidden)"*). Reading a bound out of
  that is interpreting text (SD-32); it is **the same restatement question as the five prose sets
  (SD-79)** and is his. Both are almost certainly satisfied — which is exactly the reasoning we refuse.
- **Reach (SD-81): a general derivation rule.** Two clusters, both general mechanisms; between them a
  false conflict, two silent wrong values, 19 phantom elements and 47 unreal failures — **no knowledge
  repair at all**.
- **Next: cluster 3**, unless the exclusion bounds reorder it.

**26 Sep — SD-86 CLOSES CLUSTER 2; CLUSTER 3 ANALYSED.** Spec **revision 19**; 147 tests; suite green.
- **SD-86 bounded restatement of the two exclusion bounds.** Both now `SATISFIED` against their **own**
  authored bound. **The relation is carried across as written, not converted:** `"more than 1"` → `> 1`
  (not `>= 2`); `"2 or more"` → `>= 2` (not `> 1`). Same set for an integer count, but rewriting the
  author's comparison is not typing it. Prose `value` left in place as the source.
- **Three guards:** a bound is never read out of prose; **a bound is never borrowed from the schema
  invariant** (an exclusion on the singleton row with no authored bound stays `NOT_EVALUABLE` rather than
  taking SD-06's) — that was his explicit prohibition and is now tested.
- **Classified by cause:** the *only* change is two item outcomes `NOT_EVALUABLE` → `SATISFIED`.
  Structure untouched — 33 classes, 144 lines, 90 gaps, same 4 failing checks, 0 stops.

**CLUSTER 3 — `docs/design/phase-b-cluster-3-goal-kick-selection.md` (analysed, nothing corrected).**
- **All 8 reference defects — the oldest unexplained finding in the project — are ONE cause in ONE
  contract.** Every selector in `restated:A01-02` is `restart=GOAL_KICK`; `T1` has no `restart`
  attribute (it keys on `trigger` + qualifiers).
- **The restater knew:** every selector carries an `[L1]` marker, and the fit-note says it outright —
  *"T1 selects only by trigger and qualifiers. The goal kick has to be picked out by its procedure
  because its trigger is not authored."*
- **Cause: missing knowledge, not a representation gap.** The source authors a restart *procedure* and
  **no trigger**; the representation keys transitions by trigger. Authoring the trigger turns all eight
  selectors into ordinary ones — **no new row, attribute or register change**.
- **Did not guess the trigger.** `OUT_END_LINE` is the obvious candidate; the restater had the same
  candidate and declined, enumerating six. "Obvious" is the reasoning we refuse.
- **Resolves:** 8 → 0 reference defects, the `GA-REFERENCE-INTEGRITY` clause, and 9 authored `A01-02`
  transition items that currently establish and reach nothing.
- **Also recorded, not pursued:** `T5.method` (`STATIONARY_BALL`/`SERVED`/`IN_HAND`) is too coarse to
  distinguish a goal kick from a free kick, corner or kick-off.
- **Reach (SD-81): LOCAL to that knowledge — the first cluster that is not a general mechanism.**
  Clusters 1–2 were general rules taking the large populations; what remains is beginning to look like
  ordinary knowledge work. Still clearly internal on the SD-82 criterion.

**26 Sep — SD-87: CLUSTER 3 CLOSED.** Spec **revision 20**; 149 tests; suite green.
- **He authored the trigger**: *"the ball leaves play over the defending team's goal line, having last
  been touched by an attacking player, without a goal being scored."* Maps through the **existing**
  structure, **no schema change**: `trigger=OUT_END_LINE` · `qualifier.endLine=DEFENDING_TEAM` ·
  `qualifier.lastTouch=ATTACKING_TEAM`.
- *"Without a goal being scored"* is carried by `OUT_END_LINE` ≠ `SCORE` in a closed list on a row keyed
  by one trigger — **flagged explicitly** as the one component with no qualifier of its own.
- **Not reduced to `OUT_END_LINE` alone** (his warning): a corner shares trigger *and* end line, so
  `qualifier.lastTouch` is the discriminator. **A test asserts a corner does not reach the element.**
- **Closure: 8 → 0 reference defects, no new mechanism, no representation dependency.** Only the
  selector key changed on each item.
- **A CORRECTION FROM TWO CLUSTERS AGO PAID FOR ITSELF.** Three of the eight are `T1` existence items
  with now-identical selectors — on a non-singleton row that would have formed **three** transitions
  where there is one goal kick, reintroducing exactly the cluster-2 fault. It didn't: two are
  `ENGINE_ONLY` and the SD-83 establishment boundary refuses them. First time the general rules have
  protected each other.
- **Failures went UP, 90 → 93, and that is correct.** A real transition now exists and its fields are
  enumerated. Same accounting as the 47-line drop, in the other direction.
- **CLUSTER 4 identified, not started:** `GA-TRANSITION-COHERENCE` fails — the goal kick is
  `STOP_RESUME`, needing a taker and region; both authored but with **off-list team designations**
  (`A01-02-11.a`, `A01-02-07.a`), each marked `[L2]` by the restater exactly as `[L1]` marked cluster 3.
  **The ledger is pointing at the next gap.** Bounded knowledge work, same contract.
- **Reach pattern now:** 2 general mechanisms, then 2 local knowledge gaps. Still internal on SD-82 —
  no coach could tell us a designation is unregistered — but the character of the work has changed.

**26 Sep — PHASE B CLUSTER 4 ANALYSED** (`docs/design/phase-b-cluster-4-restart-team-identity.md`).
Nothing corrected; two rulings needed.
- **A GENERAL MECHANISM SITS UPSTREAM OF HIS FIVE QUESTIONS.** `T2`/`T3`/`T4`/`T5` are **conditional**
  rows (apply only when the same element's `T6` = `STOP_RESUME`). All four corpus transitions now have
  `T6` derived as `STOP_RESUME` — and **all 16 conditional lines in the corpus have a resolved governing
  line and NOT ONE has been evaluated.**
- **The cause is a comment I wrote in increment 3 that has lapsed:** *"increment 3 derives no transition
  values, so the governing value is not available to compare."* True then; transition values are derived
  now. So asking why `T2` doesn't resolve is asking about a line never judged. **Not changed — removing
  that SD-48 stop is his.**
- **The five answers:** (1) the source authors **nothing** — its only text is the name + *"Restart from
  goal kicks."*; all three items are `ASSUMED`, evidence *"Laws meaning (assumption 1)"*, one calling its
  own reading *an inference*. (2) `DEFENDING_TEAM` and `NOT_LAST_TOUCH` now fit — **cluster 3 removed the
  blocker the restater named**: *"with the trigger unauthored, T2 cannot be written as LAST_TOUCH or
  NOT_LAST_TOUCH."* (3) the **phrases** restate; the **claims** don't — restating never changes `basis`,
  and an assumption bounds without entailing. **What's missing is authoritative knowledge, not
  vocabulary.** (4) `T3`/`T4` are derivative — both say *"the team in this element's T2"*; `T2` is the
  only root and is `ASSUMED`. (5) **L2 is one fact, three faces; L3 is genuinely separate** (T4 takes a
  region reference and *"own end"* is not one — `SV1` gives halves/thirds, not ends).
- **The narrow ruling needed:** does the goal kick's team **follow from the trigger he already authored**,
  or is *"awarded to the defending team"* a separate fact? Either way no designation is added and no
  identity inferred. Can't choose — one reading treats his trigger as carrying the award, the other not.
- **Reach, not to be conflated:** conditional-line evaluation = **general**; the goal kick's team =
  **local**.
- **PILOT BOUNDARY — first thing leaning the other way.** L3 (placing a restart by an *end* vs a *half*)
  is a question about what a coach actually does setting up a goal kick; watching one would answer it
  faster than reasoning about the register. One item, so not moving on it — but **flagged early rather
  than discovered late**, as he asked.

**27 Sep — SD-88 + SD-89: CLUSTER 4 REDERIVED** (`docs/design/phase-b-cluster-4-rederived.md`). Spec
**revision 21**; 154 tests; suite green; `npx tsc --noEmit` clean.
- **SD-88 removes the increment-3 stop.** A conditional line whose governing property is
  authoritatively resolved now has its condition evaluated: true keeps the line **and the verdict its
  own contributions earn**, false **WITHDRAWS** it (never `NOT_AUTHORED`). Conditional 16 → **0**;
  withdrawn 0 → **12** (T2–T5 on the three CONTINUE transitions). `classify.ts` `resolveConditional`.
- **The read/supply distinction is in the code, not just the comment.** A governing line that is FREE,
  failed, or **derived-but-valueless** is not evaluated; the valueless case pushes an SD-48 stop.
  `classifyLines` now takes the `stopped` channel.
- **Four regression tests, none of them on a transition** — three on consequences (`V11`/`V13`/`V14a-c`)
  and one on a Space row given a **synthetic** applicability entry, plus an assertion that
  `classify.ts` names no register row at all. **All four bite-proved.**
- **`GA-TRANSITION-COHERENCE` stopped failing, and that is the same lapse from the other side:** it had
  been reporting a *violation* on lines never judged. Judged, they are gaps, and a gap blocks a clause
  rather than failing it. Also fixed: **one `blockedAny` flag served two clauses**, so a blocked resume
  clause made the CONTINUE clause report not-evaluable after it had passed on 3 real instances.
- **THE REAL FINDING — THE CORPUS'S FIRST GENUINE COLLISION.** SD-89 authored `T2 = DEFENDING_TEAM`.
  It collides with **`restated:GF2::GF2-16.a`** (`NOT_LAST_TOUCH`, AUTHORED, from GF2 setup guidance
  *"ball out of play restarts from the team that didn't touch it last"*), whose selector is
  `trigger ∈ {OUT_END_LINE, OUT_TOUCHLINE}`. **Cluster 3's trigger is what routed GF2 onto this
  element.** Before SD-89, `T2` RESOLVED to `NOT_LAST_TOUCH`; now it is `UNRESOLVED`.
- **Why it will not reconcile:** RC-22 — *"two designations are equal only if they map to one entry"*;
  SD-02 — no universal precedence hierarchy; stage 7 deferred. Both denote the same team *here*, since
  the trigger makes last touch `ATTACKING_TEAM`. Agreement in fact, difference in expression.
- **§3 already half-answers it and the engine never implemented it:** *"Adaptation is not support …
  the displacement is recorded as an `ADAPTED` disposition on that contribution in Gate B, citing
  SD-08."* `ADAPTED` is in the closed vocabulary and **has never been produced** — no corpus case had
  displaced a default before. NOT implemented: what "displaced" means is unestablished, and reading
  SD-08 as precedence is what SD-02 forbids. **Stopped and reported, per his standing instruction.**
- **Three routes out, deliberately not chosen: A** implement `ADAPTED` (**general**); **B** author an
  equality between the two designations (**area-reusable**, needs stage 7); **C** withdraw the
  ownership fact since GF2 already answers `T2` (**local**). C is live — before SD-89 the line resolved.
- **`T3`/`T4` NOT restated**: his permission was conditional on `T2` being established, and it is not.
  **L3 untouched and open** — no `end` region added, no half substituted; the rederivation revealed no
  existing authoritative answer for it.
- **A SECOND LAPSED STOP OF THE SAME SHAPE, reported not fixed.** `derive.ts` `applies()` refuses any
  citable standing decision whose condition reads another line's derived value, because *"increment 2
  derives no transition values"*. Only SD-13 has one, its firing condition is stated exactly in the
  register, and the corpus holds **no START element** — so nothing changes either way today. A calm
  one to rule on. It is a standing decision's condition, not a line's applicability, so SD-88 does not
  reach it.
- **Figures:** lines 153; enumerated/conditional/withdrawn 141/0/12; derived 34; **failed 93 → 97**;
  open 10; **collisions 0 → 1**; reference defects 0. The rise is the accounting, as in cluster 3.
- **A SILENT-OVERWRITE TRAP CAUGHT AND GUARDED.** `corpus-restatement.ts` keyed **one ruling per item**
  in a `Map`, so SD-89's entry for `A01-02-05.a` would have silently replaced SD-87's selector. Now
  multiple rulings per item apply in order, each counted, with a test asserting both survive.
- **HIS QUESTION ABOUT THE REMAINING POPULATION, answered with a census not an impression.** Of 97
  failed lines: **declared gap 64 · coverage 31 · unresolved 1 · excluded 1** — **95 of 97 are missing
  authored knowledge, not mechanism.** And **20 of them are one question twenty times over**: `S5`
  `S6` `O4` `O5`, *where a region or object sits along/across the axis* — the same question as L3.
  `T1a`/`T1b`/`T1c` add 12 (three transitions carry no qualifiers).
- **PILOT BOUNDARY:** not recommending it opens. Recording that the door is further open than last
  week, and that the placement rows give it a **named, countable region — twenty lines** — rather than
  a single item. Caveat stated plainly: two of the last four clusters looked local and turned out
  general, and this round found two lapsed stops and an unimplemented disposition.

**27 Sep (second) — SD-90 + SD-91; THE POPULATION CLASSIFIED**
(`docs/design/phase-b-population-classification.md`). Spec **revision 22**; 164 tests; suite green.
- **SD-90 implements `ADAPTED`**, which §3 specified from the start and no run had ever produced. A
  `PREFERRED_DEFAULT` displaced by an applicable `REQUIRED_RANGE` contribution leaves `entailing`,
  takes no part in collision resolution, keeps provenance in `audit.dispositions`, and **supplies no
  support**. `T2` → `DEFENDING_TEAM`; `GF2-16.a` → `ADAPTED`; **collisions 1 → 0**; derived 34 → 35;
  failed 97 → **96**.
- **His two bullets kept distinct:** a default whose value **differs** is `ADAPTED`; one that
  **matches** adapted to nothing and stays `SATISFIED`. Both leave `entailing`, so neither is a second
  support. Three `T6` lines drop from 2 contributions to 1.
- **"Required" read as `valueStatus: REQUIRED_RANGE`** (the axis SD-08 governs). Real choice — the
  corpus has 2 `PREFERRED_DEFAULT`/`REQUIRED` and 9 `REQUIRED_RANGE`/`SUPPORTING` items — but both
  readings coincide today. A test pins it.
- **No equivalence claimed** between `DEFENDING_TEAM` and `NOT_LAST_TOUCH`, per his instruction.
  Corpus-wide test: no displaced contribution appears in any line's support.
- **DISPLACEMENT BROKE `reach`, caught by reading output not by a test.** Removing the default from
  `entailing` removed it from the forward stage's reach computation, so `GF2-17` — satisfied, adapted
  to nothing — reported *"its realization conditions are not satisfied"*. A displaced contribution
  still reached the line. Same family as [[silent-loss-of-authored-knowledge]].
- **SD-91** evaluates a citable standing decision's authored condition when the governing property is
  resolved; separate mechanism from SD-88. Tested on a synthetic decision over Space rows, including a
  *derived-but-valueless* governing line. **Corpus unchanged**, as he expected.
- **THE 96 REMAINING LINES, IN HIS FOUR CATEGORIES:** internal deterministic **53** ·
  knowledge-authoring **20** · realization-sensitive **23** · outside boundary **0** (structural: the
  boundary is enforced at item level — 34 `NOT_CHECKABLE` items produce no lines at all).
- **TWO MECHANISMS ACCOUNT FOR 28 OF THE 53:**
  1. **Wide Zone Advantage's own-involvement set is EMPTY (12 lines).** Own involvement = classes the
     contract formed *from items in the OTHER scopes*. All its channel classes come from
     `OWN_INVOLVEMENT` items, so the set is empty and all 11 of its own-involvement items reach
     nothing — **including `WIDEZONE-02.a`, the existence item that forms the channels.**
     *An `OWN_INVOLVEMENT` existence item cannot seed the involvement its own contract is scoped to.*
     Variable Target escapes only because its object-existence items are `WHOLE_GAME`.
  2. **A selector-fixed attribute does not reach its own line (16 lines).** `c:blind:GF4:I03` is
     formed by `noun=half` and its `S3` line is unauthored. The contracts say so repeatedly —
     *"fixed only through the S2 selector (RC-16)"*. General derivation-composition question.
- **THE CORRECTION I OWED HIM ON THE 20 PLACEMENT LINES: half are not realization questions.** 10
  realization-sensitive, **10 blocked internally** (Wide Zone's 6 + the 4 ball-position lines, which
  A01-02 says moved to `T4`). Last week's "20 lean outward" was wrong by half.
- **The one Gate A failure that genuinely blocks a coherent game: THREE transitions claim
  `POSSESSION_CHANGE`** (`GF4:I06`, `GF2-07.a`, `NEUTRAL-12.a`). Three contracts each authored the
  turnover; SD-47 forms one class per existence item. **Same shape as SD-84 one level along** — `T1`
  is keyed by trigger, so the trigger key is the identity. Not acted on; extending SD-84 to a keyed
  collection is his.
- **Also reported, not corrected:** the register spells the qualifier rows `qualifiers.lastTouch` in
  `path` and `qualifier.lastTouch` in `selectorAttributes`.
- **PILOT BOUNDARY, revised DOWN from last week and stated as such.** 55% of the remainder is internal
  deterministic. Reason last week read differently: *a "declared gap" reason code says some object
  could not author the row — it says nothing about whether another object authored it and failed to
  reach.* Wide Zone's 12 are declared gaps with the knowledge in the same contract. **Recommendation:
  the next cluster should be one of the two mechanisms, not a knowledge cluster.**

**27 Sep (third) — THREE MECHANISMS ANALYSED, NOTHING IMPLEMENTED**
(`docs/design/phase-b-three-mechanisms.md`). No code changes; suite unchanged at 164.
- **HIS INSTRUCTION: analyse, don't implement where more than one valid reading remains.** All three
  have two or more, so all three come back for ruling. Nothing merged, nothing authored, no
  enforcement added, no register change.
- **CLUSTER 5 — own involvement. THE RULE ALREADY EXISTS AND WIDE ZONE BREAKS IT.** AM-13, adopted
  19 Sep: *"An item that entails a collection element may not use own-involvement; it uses a selector
  attribute at whole-game scope instead (AM-17)."* Three Wide Zone items do exactly that. The
  20 Sep derivation note already concluded *"the remedy is authoring — restating the contract — not
  derivation"*, and SD-31 ruled the declaration survives the empty scope. **What was never ruled is
  that the engine should let the violation through silently** — class formation uses the item, scope
  resolution excludes it, no report.
  - Reach: **5 violating items in 2 contracts**. Variable Target violates it too (`VARTARGET-08.a/.b`
    on `J11a`) but is **symptomless** — it has 8 other-scoped existence items, and no own-involvement
    item targets a `J11a` field row. *A silent class of authoring defect, not a one-off.*
  - **R1** enforce AM-13 + restate Wide Zone's 3 scopes (authoring, his). **R2** drop AM-13's
    prohibition — **its stated reason is a fossil of the pre-class model**: the circularity was about
    stage-5 entailment, and SD-47 made elements classes fixed at stage 2, so seeding from all own
    classes is now a subset selection, not circular. Both resolve the same 12 lines.
- **CLUSTER 6 — RC-16, AND THE CORPUS AND ENGINE WERE BUILT TO DIFFERENT RULES.** His question has an
  exact answer: **RC-16**, a *run convention*, never ratified — *"an item that entails an element also
  entails each attribute its selector fixes with `=` or `∋`. An attribute given with `∈` is only
  narrowed."* The derivation-rules doc says plainly that every RC *"goes beyond the specification's
  text"*. **Six of eight contracts cite RC-16 and omitted items on those rows because of it.** The
  engine never adopted it. That is why the lines read as coverage gaps.
  - Reach: **19 FIELD rows are selector attributes** (every area but Envelope and Direction); 24
    instances today. Applying RC-16 literally: **19 failed lines resolve**, 0 agree, **3 collide**,
    **1 closes an SD-39 freedom** (`RPC-001-11.a::J3`), 1 narrows only (`∈`).
  - **The three collisions are the same thing written twice** — selector `"connected-pass count"` vs
    item `"current connected-pass count of ATTACKING_TEAM"`. Same shape as DEFENDING_TEAM /
    NOT_LAST_TOUCH. **S2 (ratify subordinately — the selector supplies a value only where no item
    entails) avoids all three**, and has a precedent: `applies()` already requires
    `entailing.length === 0` for standing decisions.
- **CLUSTER 7 — THE SD-84 ANALOGY FAILS, ON SD-84'S OWN TERMS.** (a) SD-84 requires *cardinality
  exactly one*; `T1` has no bound. (b) SD-84 says identity follows from the schema invariant *"rather
  than from interpretation of selectors"* — the trigger key IS a selector attribute. (c) SD-84 reads
  singletons *as data*, **"never from the row's prose"** — `T1`'s key is prose only.
  - **The three turnover classes are indistinguishable in every derived property** (T6 CONTINUE and
    T7 true, both from the same items; T2–T5 withdrawn). Merging would create no collision.
  - **The prior question is whether the gate is asking the right thing.** Gate A's spec says *"one
    value per atomic transition property per trigger"* — satisfied. The implemented clause asserts one
    **element** per key. SD-47 says derivation holds classes, not individuals, and a candidate *"may
    satisfy every supported class whose selectors it matches"*.
  - **T1** fix the gate clause (no lines change). **T2** rule that a canonical key establishes
    identity — a NEW decision; **must be scoped to declared keys**, because six class groups share
    identical selectors and only one is on a keyed row, and an "identical selectors" rule would merge
    13 classes against SD-47. Needs `keyedBy` **as data** to meet SD-84's own standard. Removes 18
    lines (6 failed).
- **Union if all three resolve maximally: failed 96 → 63.** Recommended order: **6, then 5, then 7** —
  6 is largest and until it is settled we cannot tell which "coverage" gaps are real.
- **Warned him the reclassification will move a lot**: 19 of the lines cluster 6 resolves were
  classified yesterday as knowledge-authoring or realization-sensitive (e.g. RPC-001's four condition
  types). They are not missing knowledge; they are written in a selector.

**27 Sep (fourth) — SD-92/93/94 IMPLEMENTED; POPULATION RECLASSIFIED FROM SCRATCH**
(`docs/design/phase-b-reclassification.md`). Spec revision 23; **173 tests**; suite green; tsc clean.
- **SD-92** ratifies RC-16 **subordinately**: an establishing selector supplies the field only where
  no support-capable item entails it. `=` fixes · `∋` establishes **membership without defining the
  set** (new `establishedMembers` on the derived line) · `∈` narrows (SD-78). New support relation
  **`CARRIES`**. **Subordination held — the 3 predicted collisions did not happen.**
- **The register now carries `selectorAttribute` on all 19 affected FIELD rows** — the correspondence
  is data, not path-tail matching, which also reconciles `qualifiers.lastTouch` vs
  `qualifier.lastTouch` without touching either spelling.
- **SD-93** amends AM-13: own involvement = the classes the object established, **including from its
  own-involvement existence items**. `fixOwnInvolvement` now only *selects* from stage-2 classes,
  which is the structural form of "may never establish authority". Plus a **named diagnostic**
  channel (`PartialResult.diagnostics` → emitted, rendered): `OWN_INVOLVEMENT_UNPOPULATED`.
- **SD-94** replaces the trigger clause with *"classes applying to one trigger must be mutually
  compatible"*. Partitioned-by-qualifier pairs are not compared (AM-15); one side derived + the other
  failed **blocks** rather than fails (SD-28). Nothing merged, no `keyedBy`.
- **Corpus: derived 35→51, failed 96→80, Gate A failures 3→2** (only GA-INFORMATION and
  GA-NO-FAILED-LINE). **3 collisions appeared**, all Wide Zone `S6`: `WIDEZONE-04.a`
  *"touchline-adjacent"* vs `WIDEZONE-05.a` *"touchline-adjacent (outer edge on a touchline)"* —
  **one authored sentence restated twice**, invisible until its items could reach. Not repaired.
- **RECLASSIFIED: internal 32 · knowledge 25 · realization 23 · outside 0.**
  - **REALIZATION-SENSITIVE HELD AT EXACTLY 23, and the 10 placement lines are the same 10.** Two
    mechanisms cleared, 16 lines gone, 5 re-sorted, and the coach-informed set did not move. First
    evidence it is **stable under mechanism corrections** rather than an artefact of them.
  - 3 lines moved internal → knowledge: Wide Zone's `S5` axis extent is `ASSUMED`, which only became
    visible once SD-93 let it arrive.
- **Two general mechanisms remain, both sharper than before:**
  1. **A set-/list-valued row cannot resolve from membership** (9 lines: `S4` ×6, `J7`, `J11b`,
     `J12`). Knowledge states members one at a time; several items only assert the field is present
     (`EXISTS` on a `FIELD`). **How does a set become complete?**
  2. **Transition qualifiers the trigger makes inapplicable** (10 lines). SD-88's mechanism one step
     along — conditional on the **element's own trigger** rather than another line — and SD-92 just
     made selector values readable. The `applicability` block exists; these rows are not in it.
- **PILOT BOUNDARY against his new formulation — 2 of his 5 prerequisites settled.** Identity
  settled (SD-84/SD-94/SD-47, no line waits on it); reach mostly settled. **Direction is the sharpest
  open one**: `GA-DIRECTION` is blocked on `RPC-001-11.a::J2`, and SD-07 is an invariant. Objective
  structure open (11 lines). **Direction → objective reference → objective role are one cluster, not
  three.** Recommended next: the objective area, because the set-completion question sits inside it.
- **TEST FIXTURES: many moved from `S3` to `S5`.** `S3` is a selector attribute, so under SD-92 it
  resolves from the class selector; any fixture asserting "nothing entails this line" must use a row
  no selector carries. Same for the SD-91 fixture (now governs on `S6`) and the SD-88 consequence
  fixture (now selected on `trigger`, not `effect`).

**27 Sep (fifth) — OBJECTIVE/DIRECTION CLUSTER: ANALYSED, DOES NOT CLOSE**
(`docs/design/phase-b-objective-direction-closure.md`). No code changes; suite unchanged at 173.
- **He reframed the pass**: not the next failure cluster but a **pilot-boundary closure pass**, with
  four buckets (general mechanism / knowledge required for coherence / knowledge non-blocking /
  realization-sensitive) and "stop and return anything needing a new semantic ruling".
- **THE CLUSTER DOES NOT CLOSE. Three rulings and one authored fact are needed.**
- **F1 — A TEAM CANNOT CARRY A DESIGNATION.** `P1.selectorAttributes = ["team"]` and **no FIELD row
  corresponds**, so a designation is expressible only as a class selector, never authored. Both team
  classes have **empty selectors**. `GA-DIRECTION` reads `designationOf` off the selector because
  there is nowhere else. *May not be a defect* — RC-22 says a designation is evaluated at the trigger
  or episode, so a team plausibly should not carry one statically. **D1** add a designation field ·
  **D2** ask what derivation can establish (the SD-94 pattern) — recommended · **D3** direction moves
  to the realization layer.
- **F2 — `J3` IS UNAUTHORED ON 4 OF 5 OBJECTIVES.** The corpus has **one** `J3` item: `GF2-12.a`
  *"EACH_TEAM: one shared target attacked by both teams"*, ASSUMED/PREFERRED_DEFAULT → bounds, never
  entails (SD-83). **D2 does not rescue direction** — a designation-only check still needs to know
  which designation attacks which objective. **Bucket 2, load-bearing, held not authored.**
- **F3 — the primary objective's reference is authored AS PROSE.** `GF2-08.b` = *"the target feature:
  the objective-area region of GF2-03.a (line or zone)"*. `c:restated:GF2:GF2-03.a` **is a held
  class**; SD-63 withholds because it is open text, blocking GA-DIRECTION clause 2. Same shape as
  SD-79's bounded restatement. Reach: reusable — 6 references establish no structural identity.
- **F4 — THREE OBJECTIVE CLASSES HAVE EMPTY SELECTORS** (`GF2-09.a`, `RPC-001-14.a`,
  `VARTARGET-06.b`). **9 of the 80 failed lines are fields of objectives nobody described.** Mirror
  of SD-94: there identity-neutrality was harmless, here it *multiplies the line population*.
  **Does an undescribed existence assertion owe field values?** Returned, not acted on — resolving it
  would remove 9 lines with nothing authored, which is exactly why not to.
- **F5 — SET COMPLETION, TRACED. ONE READING SURVIVES.** RC-15 (per member) · SD-51 (resolve the set
  first) · SD-78/79/80 (a set is an authored array) · SD-92 (`∋` does not define the set) · AM-04
  (silence licenses nothing). **A set-valued row resolves only from an authored array.** Both
  closed-world readings die on AM-04 *and* on the corpus — `S4` carries two `UNDECLARED` declarations
  (*"Functions not examined as a field"*), so completeness would be read out of an admission that
  nobody looked. **Answered, not returned.**
  - **BUT completeness is needed less often than the count suggests.** `GA-REGION-FUNCTION` asks
    "serves at least one function" and "every function is registered" — **both satisfiable from
    `establishedMembers`**, which SD-92 now records for three regions. The check reads only the line
    and blocks. *A consequence of SD-92 nothing has implemented; the only item here needing no
    ruling.* Not done, because it belongs to the returned cluster.
- **F6 — FIVE ITEMS USE `EXISTS` ON A `FIELD` ROW** (`J6`,`J7`,`J10`,`J11b`,`J12`). A field exists by
  schema, so they assert nothing. **What does `EXISTS` mean on a FIELD row?** General grammar
  question. The knowledge underneath is bucket 3 — Variable Target's set is optional machinery.
- **PILOT-READINESS ACCOUNTING (his six questions):**
  - *Deterministic generation:* nothing in engine behaviour prevents it; the engine **is not wired to
    the generation pipeline at all**, which is unscoped work and not a knowledge question.
  - *Structural coherence:* **one thing — direction.** GA-NO-FAILED-LINE is a count; GA-INFORMATION
    is bucket 3.
  - *Representative validity:* **unmeasured by design** — he kept it out of Gate A on 16 Sep. Not
    blocked by a defect; the pilot is the instrument.
  - *Safely open:* the 23, presumed legitimate-open.
  - *Non-blocking gaps:* ~14.
  - *Would another cluster teach us what coaches cannot?* **This one would, and it is the last of
    which that is clearly true.** Three of its findings are representation semantics no coach could
    answer. After it: one football fact, ~14 non-blocking gaps, 23 realization choices.
- **The Wide Zone `S6` collisions DO NOT BLOCK** — they are on a channel's across-axis position,
  which is one of the 23, and no Gate A clause depends on them. Left untouched as instructed.

**27 Sep (sixth) — SD-95..SD-100 IMPLEMENTED; CLOSURE RUN** (`docs/design/phase-b-closure-result.md`).
Spec revision 24; **179 tests**; suite green; tsc clean.
- **Lines 153→125, failed 80→57, open 10→5. Gate A failing: `GA-INFORMATION` + `GA-NO-FAILED-LINE`.**
- **SD-95** GA-DIRECTION asks what the objective structure establishes (a shared `EACH_TEAM` target,
  or two objectives on distinct designations at opposite ends). **No team class is consulted** — a
  test asserts the check reads no team property. A FREE `J3` makes it *pending*, not failed (SD-39).
- **SD-96 — THE CASE IS RETURNED.** GF2 does **not** establish which team attacks its target. Its own
  evidence says *"the original records this as unreconciled with 'building from their own end'"*, and
  the fit-note says `J3` carries NOT_AUTHORED for the shared-or-per-team question. **One line needs
  it: `GF2-08.a::J3`.** Probed: authored as the designation `EACH_TEAM`, **GA-DIRECTION PASSES.**
- **SD-97** empty-selector existence = existential coverage; **28 lines removed** (3 objectives,
  2 teams, 2 object classes, 1 objective set). Classes kept (cardinality is real); no field lines.
  `classesOn` now returns individuated classes only; `allClassesOn` kept for cardinality.
- **SD-98** typed `structuralRef` on a value; `identityOf`/`referentClass` resolve it. Applied to
  `GF2-08.b`. References resolved 0→2; GA-REGION-FUNCTION blocked 6→2.
- **SD-99** GA-REGION-FUNCTION reads `establishedMembers`. **SD-100** `EXISTS` on a FIELD is INERT.
- **NEW LOAD-BEARING DEPENDENCY EXPOSED (general):** *an item may entail a value that contradicts the
  defining selector of the class it reaches, and nothing notices.* Reach is decided on selectors,
  never on values; SD-92 makes an item beat a selector. **Does not occur today; occurs the moment
  `J3` is authored the obvious way** — `GF2-12.a` (selector `role=PRIMARY_SCORING`) would replace
  `BUILD_OUT_TEAM` with `EACH_TEAM` on RPC-001's objective. Verified by probe. Three treatments
  offered, none chosen.
- **CORRECTION OWED AND MADE: the 23 became 14.** SD-97 removed 9 — they were fields of objects
  nobody individuated. *"Stable under mechanism corrections" held for corrections that changed
  **reach**; SD-97 changed **enumeration**, which is what the set was counted from.* The questions
  did not vanish; they moved into the realization layer, and **the engine no longer names them** — a
  visibility loss that lands on the generation-connection work.
- **BUCKETS: mechanism 21 · knowledge-for-coherence 17 · non-blocking 6 · realization 14.**
- **PILOT BOUNDARY: not yet, by one item.** Deterministic yes; realization open yes; coherence no, on
  two checks; direction no, by one line that **passes when authored**. The two remaining blockers are
  a football question (`J3`) and a vocabulary question (Variable Target's unregistered information
  trigger). **Neither is a mechanism.**
- **GENERATION-CONNECTION SCOPE (conditional, in the doc):** five pieces — (1) a resolved-game
  output; (2) **a realization layer, which does not exist at all**; (3) **contracts for ~69 objects
  where 8 exist — the largest item, and authoring not engineering**; (4) selection→derivation
  mapping; (5) generated-activity conformance. **Blocker for starting conformance now: a live goal
  reaches objects with no contract.** Piece (1) could start in parallel and would test whether the
  eight-area representation carries what a generator needs — a question no part of Phase B has asked.
- **TEST NOTE:** fixtures asserting "nothing entails this line" must use a row no selector carries
  (`S5`/`S6`), and fixtures needing field lines must give the establishing item a **selector** —
  under SD-97 an empty selector enumerates none.

**28 Sep — THE RESOLVED-GAME OUTPUT** (`back/src/system/derivation/resolved-game.ts`,
`run-resolved-game.ts`, `resolved-game.unit.ts`). **190 tests**; suite green; tsc clean.
Joe directed it: piece (1) of the generation-connection scope.
- **It computes NOTHING**, like `diagnostic.ts`. A test asserts one entry per derived line, with the
  value and support **carried, not recomputed**. *"A renderer that adds semantics is a second engine
  that will eventually disagree with the first"* — which is how `game::V1` was reported two ways.
- **Assembles by the register's own paths**, so nothing is hardcoded per area: `space.regions[].noun`
  → `space.regions[<elementId>].noun`. Dotted leaves nest (`position.along` → `position: {along}`).
- **Four lists a realization layer needs, and the last three are the point:**
  - `game` — derived values only, nested.
  - `open` (5) — SD-39 freedoms with authority and bounds. **Never filled here.**
  - `existential` (8) — **SD-97 assertions, which appear in NO line.** This is the visibility loss I
    flagged after SD-97, recovered: a realized game must satisfy them and nothing can say which
    element does. Read from `classes`, the only place they survive.
  - `notEstablished` (57) — **absence is never a decision.** Withdrawn lines are in neither list:
    not applicable is not a gap.
- `coherence` carries Gate A **verbatim**; `mayRealize = gateA === 'PASS'` is a restatement of Gate
  A's own claim (*"this game can be coherently laid out and played as specified"*), not a new
  judgement.
- **A LATENT SD-84/SD-97 INTERACTION FOUND AND FIXED.** The V0 primary-event singleton has an empty
  selector, so SD-97's rule classed it as "exists, not individuated" — **false**: SD-84 says identity
  there *"follows from the authoritative schema invariant itself"*. Singletons are now excluded from
  the SD-97 skip in `enumerateLines`, from `classesOn`, and from `existential`. No corpus line moved
  (V0's fields are game-level rows), but it would have bitten the first singleton with owned fields.
- **Run it:** `npm run corpus:game` (rendered) or `-- --json`.
- **What it already shows about the eight-area question:** the game reads as a game — envelope,
  regions, performers, value, transitions — and the two things a generator would most need are the
  two that are not there: **direction** (a view, and unestablished) and **who attacks what**. That is
  the same load-bearing gap, seen from the consumer's side rather than the gate's.

**28 Sep — SD-101 + SD-102; DIRECTION PASSES; CONTRACT COVERAGE MEASURED**
(`docs/design/phase-b-boundary-passed.md`). Spec revision 25; **194 tests**; suite green.
- **SD-101** a defining selector is **constitutive**: a contribution reaching the class may not entail
  a contradictory value for that field. Class-defining value stands · contribution **preserved**, not
  resolved against · **reach untouched for every other row**. Narrow exception to SD-92.
  `derive.ts applyConstitutiveSelector`; `DerivedLine.contradicted`; diagnostic
  `CONSTITUTIVE_SELECTOR_CONTRADICTED`; forward → UNMET/NOT_REALIZED with the reason.
- **SD-102** the canonical decision (`GF2-12.c`, `OWNER_RULING`, `EACH_TEAM`) added via the
  restatements `added` list. **`GF2-12.a` untouched** — still ASSUMED, evidence still saying the
  original was *"unreconciled"*. Ambiguity and decision are two records.
- **They meet on `RPC-001-11.a::J3` exactly as predicted**: `BUILD_OUT_TEAM` holds, `EACH_TEAM` is
  preserved, the contradiction is named, and `GF2-12.c` still settles GF2's own objective. Tested.
- **SD-101 fires 3× on the corpus**; two are one value written twice by the restater. One loses
  detail (`current connected-pass count of ATTACKING_TEAM` → `connected-pass count`). Reported.
- **`GA-DIRECTION` PASSES.** Derived 52, failed 57, open 4. Gate A fails on `GA-INFORMATION` +
  `GA-NO-FAILED-LINE` only. **No new load-bearing dependency.**
- **VARIABLE TARGET TRIGGER — returned, nothing added.** The failure is **not an unregistered
  trigger**: `VARTARGET-05.b` carries an alternatives set **as prose**, read whole as one name. Of
  its five members, three are `REGION_ENTRY` (registered); two are off-list: **`COACH_CUE`** and
  **`FIRST_FORWARD_PASS`**. Source: *"revealed only after play crosses a trigger line, or switches on
  a coach cue during play"* + RB-01/02/04. No registered trigger expresses a player action or an
  external signal. **Recommended first move: restate 05.b into an array under SD-79** — that narrows
  the question to two, and `COACH_CUE` may belong outside the boundary (VARTARGET-15.a requires the
  trigger be *"detectable by players and causally connected"*; 14.a already marks EXTERNAL_SIGNAL
  off-list).
- **THE 69-CONTRACT FIGURE WAS WRONG.** The 13 guided goals reach **21 objects**, 5 already
  contracted. **16 additional contracts cover all 13 goals.** 69 is the library, not the pathway.
  - **5 contracts → 5 goals** (A01, A04, A05, TA01, TA02), all on **GF2, already contracted**:
    central density · turnover reward · switch-of-play bonus · progression bonus · interception
    reward. **The bounded pilot is attacking-only** — every D/TD goal is excluded.
  - Tiers: 3→2 · 4→4 · **5→5** · 8→7 · 10→9 · 11→10 · 14→12 · 16→13.
  - **Contracts can be produced incrementally**; nothing in the engine depends on which exist.
  - **The real risk is the opposite of the one asked about**: the 8 contracts were restated
    *together*, non-claims written against each other. A live selection picks objects never restated
    as a set — expect **more** unauthored lines on a real run, not fewer. Run one before promising a
    date.
  - **UNMEASURED:** the guided flow also selects a **practice situation**; `A01-02` is the only one
    contracted, and I could not establish which situations a guided goal reaches. **Five is a floor.**

**28 Sep (second) — FIRST REAL SELECTION ACROSS THE BOUNDARY**
(`docs/design/bounded-pilot-first-selection.md`). 194 tests green. `npm run bounded:selection -- A05`.
- **All five proposed pilot goals produce a shaped resolved game, and `GA-DIRECTION` PASSES on every
  one.** Gate A fails only on `GA-NO-FAILED-LINE`; every other non-pass is NOT_EVALUABLE. **No check
  reports any of them incoherent.**
- **VARTARGET-05.b restated under SD-79** (5 members as an array, `offListMembers` preserving the
  dagger, `asAuthored` beside it). **It made GA-INFORMATION stop failing — the wrong outcome.**
  Restating turned one derived string into a permitted set and the check read only derived values, so
  the three unregistered members went invisible. **Corrected the check, not the corpus:** a rule names
  a registered trigger when *every* trigger it could name is registered (`registeredTrigger` reads
  `REGION_ENTRY {arg}` as the register's own notation and nothing further).
  - **Result: 3 of 5 were never the problem.** Remaining: `COACH_CUE` (vocabulary, with the
    detectability argument against it), `FIRST_FORWARD_PASS` (genuine vocabulary need), and
    **`REGION_ENTRY {attacking half} + first receiver` — NOT a vocabulary question**: an information
    trigger has no qualifier row, while transitions do. Three separate rulings returned.
  - **GA-INFORMATION cannot pass regardless** — its subject clause is blocked on open-text subjects
    naming quantities/states, which SD-98 does not reach.
- **PRACTICE SITUATIONS: `TestLibrarySelectionInput` HAS NO PRACTICE SITUATION FIELD.** It enters only
  at assembly, as a prompt directive. **So none reaches derivation.** Measured the cost by hand:
  adding `A01-02` to A01's selection takes lines 49→62, derived 19→25, adds the **objects** area and
  **the goal-kick transition** with `STOP_RESUME` / `awardedTo DEFENDING_TEAM` / its qualifiers.
  **"Play Out from the Back — From Goal Kicks" currently derives a game with no goal kick in it.**
  **RETURNED as load-bearing.**
- **Second returned problem:** selection commits to 8 objects for A05 — 1 game form, 4 constraints and
  **3 affordance lenses**. Lenses have ids, are scored, shape what is rewarded, and are contracted by
  nothing, so **3/8 of what selection commits to is invisible to derivation.**
- **PS MAP:** A01 4 situations (A01-02 contracted) · A05 0 · A04 0 · TA01 1 · TA02 1. **A01 cannot be
  constrained to goal kicks without narrowing the goal** — its four situations are four football
  problems.
- **TRUE MINIMUM:** 5 contracts if practice situations stay out of derivation · **10** if they enter
  and A01 stays honest · 6 if they enter and A01 leaves. **Five was a floor; which replaces it is his
  ruling.**
- **CORPUS NOT LOCKED** — stopped per his instruction, because the PS question changes what the corpus
  is.
- **Realization design brief written** (§5): it may do exactly three things — choose an `open` value
  within bounds, instantiate an `existential` claim, or refuse. Five prohibitions, each with its rule.
  **The first test to build is "nothing closed without authority"**, because that is the one that
  fails silently.
- **New:** `run-bounded-selection.ts` (`npm run bounded:selection -- <goalId>`) — the minimal
  selection→derivation bridge. It hands the engine contracts for exactly the selected objects and
  reports the rest as missing; it substitutes nothing.

## 28 September — the realization layer exists, and it found two losses

- **`back/src/system/realization/realize.ts`** — resolved game → concrete game + realization record.
  Three permitted acts (choose an `open` value in bounds · instantiate an `existential` claim ·
  refuse), six refusals, three acceptance checks that read the **finished game** rather than trust
  the writer. `npm run realize`. 22 tests; **216 in the suite, green, tsc clean.**
- **No resolved game is eligible.** Exhaustive: every single contract and every pair fails
  `GA-NO-FAILED-LINE`. Corpus 57 unestablished = **54 NOT_AUTHORED / 3 internal**; by declaration,
  **43 sit on a row an object says it needs and cannot author.** The distance to a first realizable
  game is authoring, not engine.
- **Loss 1 (fixed):** elements were only created while placing a *derived* value, so an element whose
  every line was open or failed appeared in `open`/`notEstablished` and **nowhere in `game`** —
  dropping `GF4:I02` and **the Variable Target's own region**. Now seeded from every enumerated line;
  `counts.elements` and `counts.elementsWithNothingEstablished` make a recurrence visible.
- **Loss 2 (exposed, not reinterpreted):** AM-23 has three reason codes, the vocabulary has five.
  `NON_CLAIMED` falls through to `coverage`; `EXCLUDED` loses to `UNDECLARED`. **11 of 57** lines
  report "nobody looked" when an object looked. Codes and precedence unchanged — both are his — but
  `NotEstablished.declared` now carries the reaching declarations so the code is not the only record.
- **Contract recalculation confirmed independently** (`npm run corpus:coverage`): bounded family
  **5 without the situation choice, 10 with it**, and the extra five are exactly the uncontracted
  Practice Situations (A01-01, A01-03, A01-04, TA01-01, TA02-01). A04/A05 offer none. All guided
  goals: 41 objects, 6 contracted, 35 to author.
- **Returned for ruling** (`docs/audits/realization-first-pass-2026-09-28.md`): `FIRST_FORWARD_PASS`
  as one vocabulary member with a stated boundary · the compound member, where **a qualifier slot
  alone will not fix it** because *"first receiver"* names a performer role with no vocabulary ·
  `VARTARGET-08.a` individuates a class on `J11a` that can hold nothing (its only field `J11b` is
  owned by `J5`) · `performers.neutrals.count` carries two bounds that both state numbers and are
  both typed `QUALITATIVE`, so neither can be checked.
- **Affordance lenses:** keep outside the Game Representation. Zeroing all three lens weights never
  changes the game form (0/13) and changes constraints in 7/13; **19 of 39 selected lenses are
  realized by no selected constraint.** Proposed invariant rather than a contract.
- **Generation remains frozen.**

## 29 September — the 40 collapse to five patterns

- **It is 40, not 43.** The earlier count bucketed by row and swept the three internal failures into
  the knowledge pile. Corrected to Christian.
- **The "three internal defects" are not defects.** All three are one pair of Wide Zone items —
  `"touchline-adjacent"` vs `"touchline-adjacent (outer edge on a touchline)"` — colliding by string
  inequality on three channel elements. SD-02 is working correctly; SD-15 forbids the prose
  interpretation that would reconcile them. The fix is a restatement edit, and it is his.
- **Pattern 1 (9 lines):** T1a/T1b/T1c demanded of POSSESSION_CHANGE transitions. **T2–T5 are
  WITHDRAWN on exactly those elements** — the applicability mechanism already exists and works;
  these rows are not covered by it. One missing rule, not nine gaps.
- **Pattern 2 (13 lines):** S5/S6/O4/O5 placement, on rows the register itself marks **`fillable`**.
  No object authors metric positions and every one says so. `GA-LAYOUT-FEASIBLE` is already
  NOT_EVALUABLE. One rule: is a fillable row with no authored bound a freedom or a gap?
- **Genuinely unauthored: 12** (9 Information Expression dimensions naming unreconciled IE sources;
  3 restart-procedure lines on the goal kick) plus the neutral-scoring question behind `V5`, which
  **cannot be recorded even if answered** — `V5` cannot reference a performer group.
- **Lens re-test against his broader test: 33 realized / 0 unrealized / 6 undetermined.** My earlier
  19-of-39 was constraint-only and overstated it 3×. **17 are realized only by the game form.** The
  6 undetermined are vocabulary drift (`fast_attack` vs `attack_quickly`) — deliberately NOT called
  unrealized, because that is a semantic claim. **5 of 9 affordances cannot be named by one of the
  two libraries**, so the invariant needs one closed vocabulary first.
- **`FIRST_FORWARD_PASS` registered** (trigger v1 → v2) with its boundary in the register.
  Unregistered triggers **3 → 2**; a test asserts exactly two remain.
- **Neutral count: do NOT intersect to [1,2].** `>= 1` is REQUIRED with explicitly no maximum;
  `1-2` is SUPPORTING/PREFERRED_DEFAULT. Intersecting turns a preference into a hard ceiling —
  the sessionEmphasis failure shape. SD-90 already expresses the real relationship.
- **`VARTARGET-08.a`:** `J11b` is the only FIELD row in the register that owns its *grandparent*
  (`J5`) rather than its immediate collection (`J11a`). Trace returned; no recommendation made.
- New tools: `npm run corpus:unestablished`, `npm run lens:trace`. Suite green, tsc clean.
- **Five Practice Situation contracts NOT started** — Patterns 1 and 2 are both about applicability
  and typing, so authoring now would inherit both open questions.
- **Generation remains frozen. No status or gate semantics changed.**

## 29 September (later) — two rulings applied, Pattern 2 returned

- **Pattern 1 IMPLEMENTED.** Applicability grammar gains `selectorAttribute` beside `row`: a trigger
  is fixed at stage 2, so the line is **withdrawn at enumeration** rather than left CONDITIONAL on a
  governing line that can never move. Safeguard: where the selector does not fix the attribute the
  condition is UNDECIDABLE and the line is **kept** — the rule can only remove a line it can
  positively show does not belong.
  - **The second half mattered:** withdrawing was not enough. The lines still carried a
    `NOT_AUTHORED` verdict and still emitted GAP records, so they were reported inapplicable *and*
    counted as missing knowledge. `classify` now skips WITHDRAWN lines entirely. **Caught because two
    views disagreed** — notEstablished fell 57→48 while `verdict:NOT_AUTHORED` stayed at 54.
  - Sweep result: one other combination, **T1c on the OUT_END_LINE goal kick**, left failing on
    purpose. T1c's rule was written *wider* than necessary so it could not make a line vanish.
- **Wide Zone CORRECTED** in the restatement (ruling C29a), not the engine. 04.a and 05.a share one
  `basisEvidence` and 04.a's fitNote already said "(same as 05.a)". Parenthetical is now a `gloss`.
  **Collisions 3 → 0, and the three channel placements now derive** (51 → 54 resolved).
- **Corpus: unestablished 57 → 45, derived 51 → 54, collisions 3 → 0.** Gate A still FAIL on
  GA-INFORMATION + GA-NO-FAILED-LINE. **GA-NO-FAILED-LINE untouched.**
- **Pattern 2 TESTED, NOT IMPLEMENTED** (`npm run corpus:placement`). Not all 13 survive:
  - `space.regions[GF2-03.a].position.across` is **referenced by two objectives** — choosing it
    decides what the teams score at. Returned.
  - 3 object lines carry a **joint** constraint across candidates ("each candidate's position differs
    from every other"), flattened onto individual lines. A per-line authority cannot honour it.
  - **The mechanism already exists** — rows are `fillable`, `mayBeOpen` would free them. Two of his
    own rules block it: **SD-50** (choice space says "inside authored bounds", none authored) and
    **AM-04** (one `UNDECLARED` on the row bars openness for every element — Variable Target on
    S5/S6, A01-02 on O4/O5). One object's silence overrides another's authored bound. Returned.
- **The 12 genuine gaps are 3 knowledge decisions:** how the pass count is revealed (5 lines, one
  information rule); which IE composition governs the variable target (4 lines, IE-C006/IE-D006
  unreconciled); the goal-kick restart procedure (3 lines) — whose "from where" is a placement
  problem that lands back in Pattern 2.
- **Affordance vocabulary: there are FOUR, not three** — the game form library also has A1–A10 in
  `typical_affordances`. 12 semantic terms, only 4 shared by all three. Four decisions returned:
  `fast_attack`↔`attack_quickly`, `regain`↔`regain_possession`, the A-codes, and **a flaw I owned**:
  my trace keyed on lens `category`, and both Space Creation and Space Exploitation carry
  "Create Space", so some of the 33 "realized" may have matched on the wrong key.
- **Neutral scoring:** recorded as a representational limitation; not load-bearing today.
- **Generation remains frozen.**

## 29 September (final) — all thirteen rulings applied; the search can stop

- **Corpus: unestablished 57 → 36, open 5 → 14, derived 51 → 54, collisions 3 → 0.** 220 tests green.
- **Pattern 2 in.** Envelope bound marked as DATA (`outerBound: SESSION_ENVELOPE` on S5/S6/O4/O5).
  AM-04 narrowed: silence supplies no authority but no longer negates authority supplied elsewhere.
  **Exactly the nine** placement-only lines opened; the other four kept out **by rule** — a
  referenced element is excluded, and a `relational` contribution bars per-line openness.
- **`VARTARGET-03.a` marked relational** (C29b) rather than flattened. `DISTINCT_ON` returned as the
  smallest proposal; `relationshipRules` is precedence-only and `COMPARES` takes two fixed operands,
  so neither can express pairwise distinctness over a non-individuated set.
- **PILOT BOUNDARY RERUN — A01 + A01-02, 20 blockers: 9 `declared gap` = EXACTLY the three knowledge
  decisions; 4 `excluded`; 7 `not constrained`.** Nothing else is hiding. The six-way codes made
  this visible in one run — before them all 11 read as "coverage".
- **Vocabulary trap:** `archetypes.ts` / `affordanceLenses.ts` are PROJECTIONS of
  `soccer-module.rc1-v3.json`. Renaming only the projections passed my eye and failed the module
  round-trip test. Fixing the source moved the figures again (34/5 → **33/6/0**) because selection
  is affordance-weighted. **Yesterday's 33-of-39 counted 6 UNDETERMINED — a different statement.**
- **Realization fault found by ruling 12:** it enforced *every* count bound, which would have
  intersected "floor 1, no max" with "preferred 1–2" into a ceiling of 2 — the conversion he forbade,
  by another route. Preferred bounds are now offered, never enforced.
- **Six tests changed**, four because they used `S5` as "a line nothing authored" and it is now an
  envelope-bounded freedom. Each moved to a row that is still a gap; the AM-04 test asserts **both**
  halves of the narrowed rule.
- **PROCESS:** `npm test | tail` reports **tail's** exit code. Only `npm test > file 2>&1; echo $?`
  is trustworthy. It read green twice while the suite was red.
- Returned, not acted on: `T1c` on `OUT_END_LINE` (evidence now points at inapplicable, but
  narrowing it would make a failing line vanish by my own hand); A1–A10, which are **undefined
  anywhere in the repo**.
- **Generation remains frozen. GA-NO-FAILED-LINE untouched.**

## 30 September — every pilot goal passes the failed-line gate; one sequencing question remains

- **Corpus: NOT_AUTHORED 54 → 26, open 5 → 18, derived 51 → 59, collisions 0. 225 tests green.**
- **`GA-NO-FAILED-LINE` PASSES on A01, A04, A05, TA01, TA02.** A01 + A01-02 is down to **T3/T4/T5**,
  the goal-kick values Christian is authoring.
- **THE REMAINING BLOCKER IS NOT A KNOWLEDGE GAP.** Gate A returns `NOT_EVALUABLE`, and all four
  unevaluable checks need values **realization** supplies: `GA-ENVELOPE-FIT`, `GA-LAYOUT-FEASIBLE`,
  `GA-ONE-PRIMARY-EVENT` (positioned referents) want concrete geometry; `GA-ROSTER-SUM` wants
  instantiated teams. Gate A asks layout questions of a game with no layout, and its verdict gates
  the step that would give it one. **Proposed (NOT implemented): split Gate A into knowledge-time and
  concrete-game-time checks.** That changes what `mayRealize` means, so it is his.
- **Ruling 6 implemented.** Requiredness read from what an object *declared* about the row, never from
  absence of a value. Same distinction applied inside `Probe.cell` — several checks were
  `NOT_EVALUABLE` because they were blocked on established absences; `GA-REGION-FUNCTION` and
  `GA-ROSTER-SUM`(region part) clear. His neutral-player test is in as a test, including the half
  that matters: none of P5/P6a/P6b/P7 is `open`, so realization can never invent a neutral.
- **`DISTINCT_ON` adopted.** A relational contribution bounds nothing and no longer bars openness;
  each placement is chosen against its own bound and the **set** is checked after. Three tests,
  including his: both candidates at (10,15), every individual bound satisfied, realization refused.
- **Target region = legitimate bounded realization.** The objectives reference it by **typed**
  structural reference, which resolves by identity — geometry cannot change what they point at. The
  reference guard was firing on typed refs, i.e. backwards; narrowed to position-resolved references,
  of which this corpus has none.
- **GRADUAL/REVERSIBLE was not a representation issue.** They are one value each on two dimensions
  (D008 progression, D011 state dependency), and putting the reset on D008 as `REVERSIBLE` would
  **violate D008's own integrity condition** ("refine rather than arbitrarily overturn").
- **Returned:** `V17` has no vocabulary member for "a completed pass", so PCG-12's assumed `STANDING`
  is now contradicted with nothing to replace it — two options given, neither taken, not blocking.
  Variable Target needs **four** dimensions (V18/V19/V20/V22); **V21 was already authored** by
  `VARTARGET-13.d`, not by IE-C006. Goal-kick minimum choices for who/where/how, with no scaled goal
  area invented.
- **Generation remains frozen.**

## 30 September (later) — Gate A split, and the real blocker is representation

- **Split done.** `gateA.knowledgeVerdict` gates realization; `gateA.verdict` covers all clauses and is
  **never PASS while anything is owed**. New clause verdict `DEFERRED_TO_REALIZATION` carries an
  `owes`; `resolved.coherence.deferred` carries the list. A test asserts no deferred clause reads as a
  pass at either level.
- **CORRECTION — the split does NOT unblock a game.** I first deferred four clauses, A04 went eligible,
  and the acceptance test passed. Two of the four do not survive: **`GA-ENVELOPE-FIT`,
  `GA-LAYOUT-FEASIBLE` and the primary-event position clause cannot compare placements because the
  corpus authors them as PROSE** ("touchline-adjacent", "the full axis extent, end line to end line").
  A realized value drawn from such a bound is the same prose. Deferring them promised a later check
  that **cannot run** — the suppression failure from the other side. Reverted to `NOT_EVALUABLE`.
- **Only 2 clauses are genuinely realization-settled:** the primary-event kind (chosen from the
  narrowed set) and `GA-ROSTER-SUM` (terms don't exist until teams are instantiated).
- **A04 is NOT eligible**, and a test says so by name so it cannot drift into looking like progress.
  A second test is an explicit **DRY RUN** that steps over the gate to answer a different question —
  the pathway does produce a faithful concrete game from real knowledge, all three conditions holding.
- **Three defects the real run found that fixtures never would:** `nothingInvented` descended INTO
  derived values (the three fields of a typed structural ref each reported as an invention);
  instantiated members landed at the literal key `"objectives[]"` **beside** the derived `objectives`
  — two collections where the game has one; and **a claim's cardinality was unchecked** — "two teams
  exist" was satisfied by one.
- **THE REAL BLOCKER: geometry is authored qualitatively and every spatial check wants it numerically.**
  Not knowledge, not sequencing. Two options returned, neither chosen: author metric bounds (which he
  has repeatedly declined to invent), or represent qualitative placement as a **typed relation to a
  boundary** so the checks reason over relations rather than metres. The second looks smaller and more
  faithful to how the knowledge is written.
- 228 tests, suite green. **Generation remains frozen.**

## 30 September (final) — first game through; acceptance PASSED, post-realization Gate A NOT passed

- **`npm run first:game`** prints the whole trace: selection → resolved game → realization request →
  decisions → concrete game → post-realization Gate A. Captured at
  `docs/audits/first-game-trace-2026-09-30.md`.
- **Three states kept apart** (his ruling 2): `preRealization` = `PRE_REALIZATION_SATISFIED` (never
  `PASS`), `realizationAuthorized` (all three of his conditions, checked), `postRealizationRequired`.
  **A04 authorized; A05 not**, and it names the unsatisfied invariant. Both are tests.
- **`runPostRealizationGates` re-runs the SAME fifteen functions** over a context with realization
  decisions folded in. No second implementation — the `game::V1` two-ways history is why.
- **RESULT: acceptance PASSED (nothing lost / invented / closed without authority); post-realization
  Gate A NOT PASSED; render-eligible NO.**
- **Three blockers, and the third is structural:**
  1. `GA-LAYOUT-FEASIBLE` **passes vacuously** — its clause is phrased over *open* lines and
     realization closes them, so it examines nothing. Labelled `PASS_VACUOUS` per SD-54. Needs
     rephrasing to "the chosen placements are jointly satisfiable".
  2. `GA-ENVELOPE-FIT` **still not evaluable** — geometry is prose, so the chosen value is the same
     phrase. Labelled `STILL_NOT_EVALUABLE` at the final stage; there is no further stage to defer to.
  3. **AN INSTANTIATED MEMBER ARRIVES WITH NO PROPERTIES.** `GA-ROSTER-SUM` cannot run with both teams
     instantiated, because SD-97 enumerates no lines for a non-individuated class — so no
     `outfieldCount` line exists and realization **was never asked** for team sizes. Existential
     realization supplies members with no mechanism to supply their properties.
- **ITEM 6 REVERSED: the goal-kick values are ALREADY AUTHORED.** `A01-02-04.b` T5 = `STATIONARY_BALL`
  (his value exactly), `A01-02-07.a` T4 = `own end (of the team in this element's T2)`, `A01-02-11.a`
  T3 = *"any role, **not necessarily a goalkeeper**"* — which **contradicts his direction**. All three
  are **`basis = ASSUMED`**, and by §3 an assumed item bounds but never entails: that is why they read
  as unauthored gaps. I added two items on his direction and **removed them** — one duplicated, one
  would have overwritten a source that disagrees with him.
- **Goalkeeper evidence confirmed:** `RPC-001` is the only object claiming `P3`, and the goal-kick game
  does not select it.
- **V17 vs V18 returned:** V17 names the event *instance*, V18 its *type*. They overlap only where the
  event has no represented identity — the Pass Combination case. Proposed (not implemented) that V17 be
  legitimately absent there.
- **Item 8 breakdown deliberately NOT sent** — the roster-properties ruling materially changes list (1).
- 229 tests, suite green. **Generation remains frozen.**

## 30 September (rerun) — four blockers collapse to two unauthored facts

- **236 tests green.** `realization acceptance PASSED · post-realization Gate A NOT PASSED ·
  render-eligible NO`. Trace: `docs/audits/first-game-trace-2026-09-30b.md`.
- **Existential satisfaction (his ruling 2) DOES change A04.** `GF2-09.a` was already satisfied by the
  established `GF2-08.a`, so the instantiation was adding a second objective carrying nothing. A claim
  now reports `satisfiedBy` / `shortfall`; realization refuses to instantiate for a satisfied claim and
  only the shortfall is owed. **Generalizes because SD-97 makes an existential claim exactly one with no
  individuating selector — satisfaction is membership, not resemblance.**
- **Property schema on instantiation (ruling 1):** an instantiated member gets a line for every FIELD row
  its collection owns — a *location*, never a value. `GA-ROSTER-SUM` moved from *"no line exists"* to
  *"4 subject lines failed"*: **unaskable → unanswered.** Applied to every existentially instantiated
  class, not as a roster exception.
- **Realized geometry (ruling 3):** register block `spatialRelations`, as data. **interval** where the
  phrase states both ends (`"end line to end line"` → `[0,40]`); **anchor** where it states one
  coordinate and no extent (`"touchline-adjacent"` — Wide Zone says *"no scaling rule for width"*), and
  the extent stays unresolved with no number invented. The phrase stays the value; metres sit beside it
  as `realizedGeometry`. The gate substitutes **full intervals only, never anchors**.
- **`GA-LAYOUT-FEASIBLE` rewritten — the vacuous pass is gone.** It ranged over *open* lines, so
  realization emptied its own subject. Now ranges over every geometric extent, open or realized, and
  correctly reports the anchor it cannot compare. Clause wording changed with it.
- **THE REMAINING BLOCKERS ARE TWO AUTHORED FACTS, not four architecture problems:**
  1. **extent** — channel width and target depth. 4 of 8 placements are anchors, so no spatial check
     can close.
  2. **per-team outfield count** — nothing authors one; `GF2-14.b`'s "equal outfield counts" is
     `ASSUMED`, so it bounds without entailing.
- **Three-part report sent.** List (1) is those two facts; list (2) ~12 items (10 contracts, goal-kick
  unit, 4 VT dimensions, V17, A05's two pre-realization blockers); list (3) the long tail. **The
  architecture questions are off all three lists.**
- **Not done:** the `COMPLETED_PASS` overlap test (ruling 5) — flagged to him rather than rushed.
- **Generation remains frozen.**

## 30 September (spatial + roster) — the width was authored all along, as a PREFERENCE

- **236 tests green.** A04 still `NOT PASSED`; both remaining items are single owner decisions.
- **`WIDEZONE-06` authors the channel width** — `row S6, RANGE, AUTHORED, "across-interval width about
  6-10 m"`. It was never missing, only **untyped**, so the parser made it QUALITATIVE. Typed on the
  SD-86 precedent (C30b).
- **BUT it is `SUPPORTING` / `PREFERRED_DEFAULT`** — its own fitNote says *"PREFERRED_DEFAULT carries
  the adaptation"*. **So the width is a PREFERENCE and the required extent is genuinely unauthored.**
  I had already built the anchor+extent composition, which for a preferred bound **would have turned a
  preference into a requirement** — the conversion he forbade on the neutral count, from the other
  side, and A04 would have passed on something nobody required. Now only a **REQUIRED** extent
  composes. **Check `valueStatus` before trusting a bound.**
- **The owner decision:** promote 6–10 m to required (concrete, doesn't scale), or author a proportion
  of the across dimension (the scaling he asked for; the source gestures at it and never states it).
  The mechanism instantiates either without change. Target depth doesn't arise — `line` has no depth.
- **THIRD SILENT LOSS.** `bounds` was emitted **only on open lines**, and Wide Zone authors the width on
  the *same row* as `"touchline-adjacent"` — so a derived position dropped its authored extent
  entirely. Now emitted as **`extentBounds`**, separate name, so the "bounds only on open lines"
  invariant survives. **All three instances were found by something downstream trying to USE the value,
  never by a test.**
- **ROSTER — nothing to build.** The representation carries all three distinctions: `E1` total,
  **`P4 roles[]`** (*"named roles; the list is open for this run"* — sport-neutral) for specialized
  availability, **`P11/P12` participation state** (EM-0007: ACTIVE/INACTIVE/WAITING/RESTING/OBSERVING)
  for involvement. `P3 goalkeeper` already exists as the soccer-named convenience. **What's missing is a
  SESSION input** — the envelope states `players: 12` and nothing about role composition. "Equal
  outfield counts" NOT promoted. `GF2`'s `P3 NON_CLAIMED` means *imposes no requirement*, not *there
  are none*, so it stays unresolved rather than defaulting to 0.
- **Still outstanding: the `COMPLETED_PASS` overlap check.** Flagged a third time rather than rushed.
- **Generation remains frozen.**

## 1 October — the S5 reconciliation: two decisions were really four

- **236 tests green. A04 NOT rerun for closure** — two of three reconciliations produce owner decisions.
- **THE TRACE WAS NOT STALE; I UNDER-REPORTED.** "Target depth doesn't arise because realization chose
  `line`" conflated *no depth decision needed* with *the geometry resolves*. It does not:
  1. **"A line has no depth" is represented nowhere.** `GF2-03.a::S5` is an anchor and nothing lets the
     engine conclude a region whose noun is `line` has zero extent along. `GA-LAYOUT-FEASIBLE` is right
     to refuse it.
  2. **`line` IS NOT A REGISTERED S3 NOUN** — `S3.noun` is `[band, channel, corridor, zone, half,
     third]`. The choice came from `GF2-03.b`'s narrowing `[zone, line]`, which offers a member the
     row's closed list lacks; SD-18 says a draft list is still closed. **And realization checks a
     choice against the PERMITTED SET and never against the row vocabulary** — so the concrete game
     holds an unregistered value and nothing objected. A real hole in the acceptance discipline.
- **`relativeTerms` (RC-21) ALREADY EXISTS** in the register, defining these relationships as
  predicates — *"attacking end (of team T)": "touches the end line T attacks"*, `"touchline-adjacent"`,
  `"central"`, `"lengthwise"`. **My `spatialRelations` block is a parallel representation of it**, keyed
  on whole phrases instead of canonical term names — the V17/V18 mistake, which I made. Flagged, not
  yet folded (working code on the eve of a closure attempt).
- **No proportional rule exists.** Closest is **`SV1 space.fractions`** — halves and thirds *along* the
  axis, per team. Proportional, wrong axis, nothing about width.
- **Roster: he was right about OBSERVING.** `P11` is *"the realized participation state of a performer
  GROUP"*, so it exists only for a group **in the game**. An available-but-not-established role is
  simply **not instantiated** — no `P4` member, no `P11` entry. OBSERVING is for a group that IS here
  and isn't playing. Three levels: session availability (**`Envelope.roles` added**) → instantiation
  (`P4`/`P3`) → participation (`P11`/`P12`). No Team Profile concept exists anywhere yet.
- **The sport-coupling ratchet failed my first draft** of that field's comment for naming the sport and
  the role in engine code. Correctly.
- **FOUR decisions now, not two:** channel across-extent proportion · session role availability for
  this game · whether a realized `line` entails zero extent along · whether `line` may be a permitted
  S3 value at all.
- `COMPLETED_PASS` still outstanding, still not blocking. **Generation remains frozen.**

## 1 October (corrections) — A04 down to two owner values, no new dependency

- **246 tests green.** `acceptance PASSED · post-realization Gate A NOT PASSED · render-eligible NO`.
  Trace: `docs/audits/first-game-trace-2026-10-01.md`. **First round with no new load-bearing
  dependency.**
- **Register guard (his item 1):** a realization choice must satisfy the authored permitted set **AND**
  the row's canonical vocabulary. The refusal names both sides — the disagreement is the knowledge
  defect, not the choice. General, with regression.
- **`line` registered** in `S3.noun` (v2) as an owner-authorized extension. Semantics are **general and
  name no axis**: a new `nounSemantics` block gives each noun an `extentDimensions` count, and a
  one-dimensional noun has extent on exactly one axis — whichever carries it is the **length**, so the
  other is **zero**. Orientation is read off the geometry. **Tested in both orientations** so
  "line = end line" cannot be encoded by accident. This closed `GF2-03.a`'s geometry.
- **RC-21 fold (items 2b, 5): `spatialRelations` is GONE.** Each term checked for a home first — three
  had one (`touchline-adjacent`, `attacking end`, `own end`); **one genuinely did not**
  (`full extent (of an axis)` — the block had no spanning predicate), so it was added to the canonical
  block rather than the others being forced across, and flagged as needing owner confirmation. A
  `phraseIndex` maps phrases → terms so the vocabulary is not keyed on prose. **His lesson is a test:**
  the parallel block cannot return and every indexed phrase must resolve to a defined term.
- **RETURNED — channel width: TWO fractions, not three.** `"bounded minority (of an axis)"` with
  `from`/`to` as fractions of the named axis. The collective claim **follows** from the per-channel max
  plus the authored channel count (`WIDEZONE-03` = 2). **Caveat flagged:** that derivation holds only
  while the count is bounded.
- **RETURNED — A04 roster: one session statement + one promotion.** `envelope.roles = {goalkeeper: 0}`
  (explicit zero; absent means NOT STATED) **plus** promoting `GF2-14.b` "equal outfield counts" from
  `ASSUMED` to authored. Alternative offered (session statement of the split) with a preference stated.
- `COMPLETED_PASS` still outstanding, still non-blocking. **Generation remains frozen.**

## 1 October — **A04 CLOSES. The deterministic Game Representation → Realization boundary is closed.**

```
realization acceptance   PASSED
post-realization Gate A  PASSED
render-eligible          YES
```
246 tests green, tsc clean. Trace: `docs/audits/first-game-closure-2026-10-01.md`.
**All five owed invariants PASS** — `GA-ENVELOPE-FIT` (both clauses), `GA-LAYOUT-FEASIBLE`,
`GA-ONE-PRIMARY-EVENT`, `GA-ROSTER-SUM`.

**The concrete game:** target line at the end line it touches — along `[40,40]`, across `[0,30]`;
three touchline channels along `[0,40]`, across `[0,7.5]`; `line_crossed` worth 1; two teams;
one objective both teams attack. (An earlier draft of this line said "two teams of six". **The game
does not contain that** — see the rendering section below. The six was derived inside the gate and
never written back, and writing it here as if the game held it is exactly the slip the rendering
test caught.)

- **Width authored as the canonical RELATION**, not a number: `WIDEZONE-06.b`'s value is
  `"bounded minority (of an axis)"` and the fractions (0.15–0.25) live once in RC-21. 0.25 of 30 m is
  7.5 m here; the same knowledge gives 10 m on a 40 m width untouched.
- **A FAULT CAUGHT — third instance of the same shape.** The channel carries both the required
  proportion and the 6–10 m preference, and `extentOf` was taking **whichever bound came first** — the
  preference. A preference was deciding the geometry. Now the requirement composes and the preference is
  **intersected into** it (4.5–7.5 ∩ 6–10 = 6–7.5 m). **Any time a requirement and a preference sit on
  one line, check which one the code actually reads.**
- **Degenerate extent is legitimate for a one-dimensional noun.** Both emptiness tests read
  `nounSemantics`, which names no axis; a line is degenerate only where its OTHER axis carries real
  extent, so a region with no extent anywhere still fails.
- **Roster derived, not chosen:** 12 session performers, 0 specialized-role from stated `roles`, 0
  neutrals (none instantiated), 2 teams, equality from the promoted `GF2-14.b` → 6 each. Refuses on
  anything missing; derives nothing from a division that is not whole. **Equality is read from an
  AUTHORED item, so a game form stating asymmetry never reaches that path** — not an engine rule.
- **The sport ratchet failed 3× and was right each time**, including on a doc comment and on
  `roles.goalkeeper` in engine code. Fixed by a `specializedRole` flag on the register row, so the engine
  reads the role name from the register and knows none itself.
- **NOT claimed:** one internally *rendered* activity. The width proportion and roster equality are now
  authored knowledge, not architecture — change either and the game changes. A04 is one game; **A05 is
  still unauthorized** on two pre-realization invariants it does not share.
- `COMPLETED_PASS` remains the separate non-blocking investigation. **Generation remains frozen.**

---

## 2026-10-01 — Controlled rendering of the frozen A04 game (`npm run render:a04`)

**Fidelity PASSES all five of his questions.** 15 coach-facing instructions, 5 observations returned
as evidence. 246 tests green, exit code verified directly (not through a pipe).

Reads `docs/audits/a04-concrete-game-fixture.json` **and nothing else** — no selection, derivation or
realization — because he asked to isolate the rendering boundary, *"not test the entire chain again at
once."* The fixture is frozen closure output.

**Wording is generated FROM status, not chosen and then checked.** `DERIVED`/`INSTANTIATED` get the
imperative; `REALIZATION_CHOICE` gets *"For this activity, …"*; `PREFERENCE` gets *"if it suits your
group"*. **A preference has no route to imperative wording because that wording is unreachable from
`PREFERENCE`.** Every instruction carries its source property paths; citing nothing is a defect.

### THE LOAD-BEARING FINDING — a render-eligible game that a coach cannot pick sides from
`outfieldCount` **is nowhere in the concrete game.** `deriveRosterFromSession` worked out 6 a side from
the session total plus authored equality, `GA-ROSTER-SUM` passed on it — and the value lived only in
the **post-realization gate's evaluation context**. It was never written back. So the artifact marked
render-eligible lacks a number a coach needs.

**NOT repaired.** 12 ÷ 2 in the renderer is a one-liner and is precisely the forbidden invention: the
game does not establish the number, so rendering producing it would assert a quantity on its own
authority. It is also realization work, outside what he unfroze.

**The shape to remember: a gate derived a value in order to check itself, passed, and the value did not
persist.** Same family as every earlier silent loss — established at one stage, absent from the next —
in a place we had not looked. `render-eligible` is therefore a *weaker* claim than *renderable into
something a coach can run*; the closure stands, its terms were narrower than they sounded. **Ask of any
gate that derives a value: does the artifact keep it?**

### Three genuine rendering defects, fixed
- `envelope.players = 12` established and never reached the coach — a real loss.
- `objectives[].role = PRIMARY_SCORING` uncited by the scoring sentence it justifies.
- **The renderer labelled envelope facts `SESSION` while the fixture records them `DERIVED`.** The
  provenance trace is the deliverable, so status is now read from the fixture, never assumed.

### Two over-strict checks, narrowed
- A cited collection's **cardinality** supports `"2 teams"`. Counting the members of a cited collection
  is the **only** arithmetic rendering may do — kept that narrow so the roster gap could not be smuggled.
- Properties governing **event accounting** rather than play (`startsEpisode`, `space.axis`) are
  reported as NOTEs **naming the reason**, never silently filtered. Both are with him for ruling.

### The negative tests are the point
A fidelity checker that only ever passes is not evidence. An invented number, an **undeclared** one
(fails even when the game contains it), a dropped property, a softened requirement, a hardened
preference and a choice stated as necessity are each proved to be caught. **Writing them found a real
hole:** the region check accepted *any* instruction citing a region, so a preference about a channel's
width counted as an instruction to mark it. A marking instruction must carry the region's `noun`.

**Sport ratchet fired a 4th time** on `football` in the new module — correct again. Term removed rather
than declaring the file sport-specific, since rendering sits above the sport layer.

### Four things the GAME produces that a coach would question (evidence, not repaired)
1. **Three channels all anchored at `across = 0`** — the same touchline, from three separate Wide Zone
   contributions. A coach following the output marks one strip three times. Three regions or one
   described three times is a **knowledge** question.
2. **Zero-depth scoring line sitting exactly on the end line.** What the knowledge entails for a `line`,
   and markable — but a coach may expect a scoring zone with depth.
3. **Both teams score at the same line** (`EACH_TEAM`). Canonical and deliberate; unusual enough that a
   coach sets up two targets out of habit unless told plainly.
4. **No region carries a stated function** (4 `functions` rows EXCLUDED). Nothing says what the channels
   are FOR. Faithful, and the first thing a coach would ask.

### With him for ruling
Roster write-back and at which stage · the two deliberate non-carriages · three channels or one ·
whether a region needs a stated function before a coach is told to mark it.

Scope held: one game, one rendering. **No** activity-set logic, variation, slots, or broader generation.
`COMPLETED_PASS` still the separate non-blocking investigation.

---

## 2026-10-01 (later) — The roster defect FIXED, and the class guarded

`npm run first:game` now writes **`performers.teams[0..1].outfieldCount = 6`** into the concrete game, and
rendering tells a coach **"2 teams of 6"**. Q5 is clean: a coach can lay out and play A04 from the output
alone. Acceptance PASSED · post-realization Gate A PASSED · render-eligible YES · fidelity PASSED.
246 cases plus `post-realization.unit.ts` and `rendering.unit.ts` green, exit code verified. tsc clean.

### The fix is a named stage, not a patch
**`entailOverConcreteGame(ctx, realized)`** (post-realization-gate.ts) runs **between realization and the
acceptance conditions** — so the game the conditions read is the finished one. It writes back every member
property this stage resolves and records each under `record.entailed` with the line that entails it.

**It is deliberately NOT roster-specific**: it asks the general question *"which member-property lines did
this stage resolve that the member does not carry?"* — and the generic pass immediately also carried
**`goalkeeper: 0`**, equally stranded, which nobody had noticed. **The defect was wider than the one
property that exposed it.** Any future property derived once its subject exists rides the same route.

### `entailmentsPersist` — the guard for the whole class
Any value this stage derives must be readable from the game at the member's own address. A failure goes
into `outstanding`, so it **blocks render-eligibility** rather than merely reporting — the alternative is
exactly what A04 did. **The rule to carry: a value a check derives in order to pass must end up in the
artifact. A check's working is not the artifact's content.**

### Tightening `nothingInvented` was NOT optional
It returned early for **any** value inside an instantiated member (`if (insideInstantiation) return`), so
anything written into a member afterwards **escaped the invention check entirely** — the exact blind spot
this fix would have landed in. A member's value is now accounted only if the member genuinely carries the
leaf **or** a recorded entailment names it. Hence the entailed values are **not** written into the recorded
member: the check would then be confirming our own write instead of an entailment. `memberIndex` was added
because both teams share one `satisfies`, so a path cannot tell them apart.

### The tests are destructive on purpose
A guard that verifies a write made two lines earlier in the same process is exactly the kind that may be
unable to fail. Each is proved by breaking what it guards:
- strip `outfieldCount` → **not render-eligible**, and `GA-ROSTER-SUM` **still PASSES** — both facts visible
  at once, which is the honest picture of what the original defect was;
- contradict it (5 vs 6) → caught, naming what the game holds;
- smuggle `maxTouches` into a member → reported as an invention;
- a structured member field is **one** value, not three inventions (the old false-positive shape);
- **13 players across 2 teams entails NOTHING** — no rounding to 6.5, and the game is then correctly not
  render-eligible.

### A separate latent trap, found by writing those tests
**`derivationInputFor` returned the module-level `CORPUS_ENVELOPE` itself.** One run setting `players = 13`
silently changed **every later run in the process** — the failure presented as a bug in the code under
test. A session envelope is session input; two runs do not share one. Fixed at the source, with a test
asserting isolation. **Watch for any factory returning a module constant by reference.**

### The fixture is generated, not transcribed
**`npm run freeze:a04`** runs the real chain and refuses to write a run that is not render-eligible. The
first fixture was hand-copied from printed output — which keeps testing the old game while claiming to be
the current one, the same shape as the harness that reproduced a pipeline *approximately*.

Four coaching observations stand unchanged and remain with him: three channels on one touchline, the
zero-depth line, both teams at one line, no region carrying a function.

### What auditing the fix found — six more defects in the path it depends on
All fixed, each with a test that fails without it. **Three bear directly on his rulings.**
1. **`/equal/i` MATCHED ITS OWN NEGATION.** An AUTHORED P2 item valued *"unequal between the teams, e.g. 4
   and 6 (4v6)"* satisfied the test licensing **equal** division — the exact thing he ruled must not become
   an engine assumption. `\bequal` requires the boundary "unequal" lacks.
2. **An EXAMPLE licensed a universal rule.** That item is `TYPICAL_EXAMPLE`; only `REQUIRED_RANGE` licenses
   the division now (what GF2-14.b was promoted to be). **`valueStatus` is part of what an item SAYS** —
   fourth time this shape has bitten.
3. **`neutrals` was structurally ALWAYS 0.** It counted classes with row `P5`, but P5 is a FIELD and
   `realized:` classes exist only for COLLECTION rows — the filter **could never match**. Right for A04 by
   accident; a game with neutrals would have had them ignored. Now reads the P5 line per his 29-Sept
   distinction: resolved value used · established absence contributes nothing · required-but-unestablished
   **refuses**. **Ask of any filter: can it match anything at all?**
4. **Member addressing used `split('.').pop()`.** Canonical is the whole remainder after `[]`. **20 of 61
   member rows are nested, and two pairs COLLIDE** (`transitions[].qualifiers.region` /
   `.placement.region` → both `region`). A04's rows are flat so A04 could never catch it — **the test ranges
   over the register, not the fixture**, and asserts the broken rule demonstrably collides.
5. **Fabricated provenance** — contract `session` and item `session::P2` do not exist, and `support[1]` was
   dead so every line cited the player count, including the goalkeeper lines.
6. **The invention check licensed a leaf NAME, not a value** — `outfieldCount: 99` beside an entailment of 6
   reported nothing. It also failed to advance the leaf across an array index (a team can own `roles[]`).

### A DESIGN REVERSAL WORTH REMEMBERING: repairing a defect can make its guard vacuous
Making `runPostRealizationGates` run the entailment pass stopped a caller forgetting it — **and destroyed
the guard**, because the pass repaired the absence the guard exists to detect. **Refuse, don't repair.** A
skipped stage fails loudly; `run-realization.ts` (which DID skip it, printing a different game from
identical inputs) now calls it explicitly.

### THE SAME SHAPE, FOUND A SECOND TIME — and it CORRECTS what I told Christian
**`GA-REGION-FUNCTION` passes both clauses on `DerivedLine.establishedMembers`** — written at
`derive.ts:310`, read ONLY by `gates.ts:772`, in **no projection**. Live: the target region is established
as `"objective-area"` and a channel as `"perceptual-reference"`; the check reports **4 evaluated
instances**; the artifact carries **ZERO** functions (all four rows `notEstablished`, `reason=excluded`).
**I had reported "nothing says what the channels are FOR" to him as an AUTHORING GAP. It is substantially
our defect.** → **Before calling something a gap in his knowledge, check whether the knowledge establishes
it and a projection drops it.** NOT fixed: each row arrives declared `["CLAIMED","EXCLUDED","NON_CLAIMED"]`
at once and the engine collapses it to `excluded`. Which wins is his ruling.

### `GA-ROSTER-SUM` DOES NOT PIN THE ROSTER
Forced per-team 4, 5, 6 and **7** — **PASS every time**, reason *"the roster sums to the session count"*; at
7 it sums to 14 against 12 players. An ABSENT term sets the upper bound `null`, so any low-enough sum
passes. **Do not call a check validated until you have forced a wrong value through it.** Left alone: a
frozen Gate A check, corpus-wide effect, and "absent" vs "unbounded" are two readings of one ruling.

### Latent trap found while writing the tests
**`derivationInputFor` returned the module-level `CORPUS_ENVELOPE` BY REFERENCE** — one run varying
`players` changed every later run in the process, and the symptom looked like a bug in the code under test.
Fixed with an isolation test. **Watch any factory that returns a module constant.**

### With him, not started
Region functions · the manufactured `goalkeeper: 0` (engine-built from register rows, contradicting
*"a session fact for this run, not a default assumption"*) · `GA-ROSTER-SUM` · whether he wants the wider
sweep inventory (a dead placement guard, a standing decision applying outside its selector, preference
bounds enforced as requirements on most paths, 860 authored justifications dropped — **only the two above
are verified by me**). Freeze stands.

---

## 2026-10-01 (his five rulings) — Q5 FAILS, and that is the CORRECT result

    validated concrete game  ->  complete runnable representation  ->  faithful rendering
            YES                            NO                                 YES

Q2/Q3/Q4 **PASS**, Q5 **FAILS** with three violations. **The rendering is faithful to a game that is
insufficient, and the two are now separable** — which is what the controlled test existed to establish.
246 cases green, tsc clean, closure still render-eligible.

### 1 · Roster write-back — at the ASSEMBLY boundary (`assemble-concrete-game.ts`)
`completeConcreteGame()` runs between realization and anything that reads the game. Two consequences, both
intended and both his point:
- **the gate is read-only again** (it had become a writer against its own documented contract);
- **the invariant reads the PERSISTED GAME.** `concreteContext` takes member properties out of
  `realized.game`, not the record. **Strip the roster → `GA-ROSTER-SUM` = NOT_EVALUABLE where it used to
  report PASS** on a figure only it could see. **The defect class is removed, not guarded.**

### 2 · His metadata rule, encoded as TWO conditions
*"exclusively computational/accounting metadata AND all of its operational consequences are already
faithfully represented."* The second clause is **checked**: each exclusion names the paths carrying its
consequences and the checker verifies an instruction cites them. Remove the "play continues" instruction
and `startsEpisode` may no longer be excluded. Every exclusion is printed with reason + discharge — no
silent filtering.

### 3 · The three channels — AUTHORABLE AND NOT AUTHORED
Co-referential (identical derived positions; the authored count is **2**; an authored item says
"**both** wide channels"). **The contract's own ledger already asked for the fix:** *"touchline-adjacent
does not name which touchline and S2 has no side attribute, so 'one on each lateral side' is unheld…
Needs a side selector attribute or per-touchline relative terms."* **The register NOW HAS it** — S2's
`lateral` attribute with `wide-left`/`wide-right` (AM-17) — and **AM-12 forbids derivation applying it
unasked.** So: restatement (his), nothing invented. **Avoid an engine merge** — a test asserts *"classes
are never merged, even where their selectors coincide (SD-47)"*.
→ **Before concluding the knowledge cannot express something, check the register AND check whether the
contract already recorded the request.**

Engine defects found alongside (do not block): `cardinalityOf` cannot tell an exact COUNT from a lower
bound for a **string** value, so authored "2" → "at least 2"; and that cardinality is **dead data** —
a COLLECTION row gets no line and a selectored class forms no existential claim, so nothing reads it.
Also: the engine **refuses** to read a prose count on the EXCLUSION side citing SD-32, while **guessing**
on the establishing side.

### 4 · Operational participation — A04 FAILS, correctly
Implemented as a Q5 requirement; deliberately does **not** read `functions` (his explicit steer). The
scoring line participates via the objective's reference; **the three channels participate in nothing.**

His question answered — **BOTH**:
- **Failing to survive:** the Wide Zone's trigger, referents and four information rules **reach no line
  at all** — absent from the game, from `open` AND from `notEstablished`. A collection-owned field line
  requires an element class on the owning COLLECTION row; no support-capable existence item is authored
  there, and the information-rule item is `ASSUMED` → barred by §3/SD-83. The contract records the hole:
  *"no item, since V7 cannot select this object's modifier."* **Verified by injection: lines 39→56,
  unestablished 8→17, `knowledgeVerdict` PASS→FAIL on the unauthored magnitude. A04's pass is partly
  bought by the claims vanishing.** Third instance of the shape.
- **Genuinely lacking:** even fixed, it could not be ESTABLISHED. *"no default among three"* for what the
  advantage IS; *"no multiplier size or bonus points"* for its size. **The channel has an authored TRIGGER
  and NO authored EFFECT.**

### 5 · Zero-depth line and same-line scoring — unchanged, still reported as observations

### Two decisions with him
Restate the Wide Zone S2 contributions with `lateral: wide-left` / `wide-right` · decide what the channel
advantage actually does. Rendering scope frozen; generation not broadened.

### Method note worth keeping
An agent reported an injection result I could not reproduce at first — my attempt used a `*` selector and
hit the SD-97 path, so nothing changed. Redone with the selectors the declarations actually name, it
reproduced exactly. **I would have reported a false negative had I stopped at my own first run.**

---

## 2026-10-02 — Both cardinality defects fixed. **A04 IS NOW REFUSED, and that is correct.**

247 cases green, tsc clean. Rendering pathway still runs; Q5 still fails on participation.

### A04 was never legitimately realizing
The Wide Zone authors **exactly two** channels; the run establishes **three**. The authored count was dead
data, so nothing objected. Realization now refuses, naming the item and both numbers. **Not relaxed** —
the refusal has its own test in `realize.unit.ts`.

Everything downstream stays testable through ONE named override, **`withAuthoredRegionCountSetAside`**
(resolved-game.ts) — **in callers only, never in the engine**. Deleting it when the restatement lands will
not compile until every call site is revisited. That is deliberate.

### 1 · An exact COUNT is exact — one reader, not two
`cardinalityOf` had its own copy of the count parse, written earlier and never brought forward: the
bare-digit match was **unanchored** and it never consulted `item.requirement`, so authored `COUNT "2"` and
prose `"2 or more"` parsed alike. Now both use **`countBounds`** (derive.ts). **Exactly 5 corpus items
change**, all authored `COUNT "2"` → exactly 2 (teams included). **Nothing loses a cardinality it had** —
measured before changing anything.

**The asymmetry dissolves with it.** The exclusion side refuses a prose count citing SD-32 (*guessing
"would decide the item's meaning"*) while the establishing side guessed. The single reader's bare-digit
match is **anchored at both ends**, so both sides read a number that IS the value and both refuse a number
embedded in prose. Pinned from both directions in `cardinality.unit.ts`.

### 2 · The count constrains — it was dead data
Consumed only via `existential`, and a **selectored class never becomes an existential claim** (SD-97), so
a COLLECTION row gets no line, the class forms no claim, and the number was read by nothing.
`resolved.collectionCardinality` now reports every authored cardinality beside what was established, and
realization **refuses** a population exceeding an authored maximum. Scoped to **individuated** classes, so
it fills exactly the gap and does not double-count `existential`.

**A correction to my own first version:** it counted EVERY region, so the Wide Zone's "exactly two" was
violated by GF2's target line — a region it says nothing about. The authoring note guards against exactly
that (*"counted over this contract's own channels so another object's channel cannot break it"*). **The
population is the one the item's own `scope` names.** I would have shipped a bound meaning the wrong thing.

### 3 · The restatement is AUTHORIZED, drafted, and blocked on two things (both with him)
- **The third S2 item.** `WIDEZONE-08.d` (`noun=channel & functions ∋ perceptual-reference`, COUNT 2,
  SUPPORTING) — its own note says *"COUNT 2 (from WIDEZONE-03) so both channels carry the member"*, so it
  is **not a third channel** but a statement about the two. As an existence assertion on S2 it mints a
  third region, and merging is ruled out. Three readings listed for him; **AM-13 does not settle it** (it
  is "selection does not entail existence").
- **A lateral selector would VANISH.** An element's selector **never reaches the resolved game** — a region
  arrives with `elementId`, `noun`, `position` only. `lateral: wide-left` would parse, attach to the class
  and be dropped before realization; both channels would still anchor to the same touchline. **Fourth
  instance of the shape.** `spatial.ts` already grows an interval inward from a non-zero anchor, so the
  missing piece is carrying the selector through + reading AM-17's authored interval test.

### 4 · Wide Zone effect — HELD, nothing authored
Datum passed to him: the only authored/required/support-capable items in the cluster are a **trigger**
(region entry) and its **referents** (both channels) — nothing about what follows. So the mechanism is
genuinely open, and his direction (modify the existing primary event, not a second scoring event) matches
what the contract already excludes (a second primary event; channel as objective reference; channel as
ACCESS region).

---

## 2026-10-02 (rulings a + b) — TWO channels, ONE PER TOUCHLINE. A04 realizes. Q5 fails on the effect alone.

His predicted result, reached exactly:
`exactly two channels → one per touchline → A04 realization proceeds → Q5 still fails because the channels
have an authored trigger but no authored effect`

Channels at across **[0, 7.5]** and **[22.5, 30]** on a 30 m width, each citing **AM-17** in its own `why`.
**Q2/Q3/Q4 PASS · Q5 2 violations** (both the effect gap). 247 cases green, tsc clean.

### (a) `WIDEZONE-08.d`: S2 → S4, ruled option (i)
On S2 an existence requirement **mints an element**; on S4 a **member is asserted** of whichever regions the
selector reaches. Its own note always said so: *"COUNT 2 (from WIDEZONE-03) so both channels carry the
member"* — the 2 referenced the established population. Form is `EQUALS`, matching the corpus's only other
S4 item, and `EQUALS` is outside `EXISTENCE_REQUIREMENTS` so it cannot mint an element by either route.
**His distinction to preserve: a statement that a property applies to N existing members does not thereby
assert the existence of N additional members.**

**SIDE EFFECT WORTH HAVING: the region-function defect of 1 October is CLOSED by this restatement.**
`perceptual-reference` now reaches the artifact on both channels; 3 of the 4 unauthored `functions` rows are
gone and **nothing was authored to close them**. The member was always authored — it was being asserted of a
third region instead of the two that exist.

### (b) Selector preservation — GENERAL, not a lateral transport path
**Every element now carries its own authored selector verbatim.** An element used to arrive with its id and
whatever was derived, so the attributes saying WHICH element this is were parsed onto the class and dropped.
`spatial.ts` reads `lateral` from that selector and takes the far edge for `wide-right`, from **AM-17's own
registered interval test**. **Consumed only from an authored selector — a count of two channels does not
make one of them wide-right.**

### Three things the restatement surfaced — all fixed, two of them defects in the CHECKS
- **A FALSE LOSS.** `nothingLost` compared a set-valued field's member against the array holding it, so
  `perceptual-reference` arriving correctly as `["perceptual-reference"]` was reported lost. **A false loss
  is as damaging as a missed one — it teaches you to disbelieve the check.**
- **An unreadable path.** The per-member entry is at `functions[member]` — a **subscript**, not a dotted
  path — so splitting on `.` resolved nothing.
- **A GUARD I NEARLY BLINDED.** Adding `selector` to every element made every element look established,
  defeating `elementsWithNothingEstablished` — **the guard for the exact class of defect the selector was
  added to fix.** Caught by an existing test. Identity (`elementId`, `selector`) is now excluded from it.
  → **When you add a field to every element, check what counts elements by their emptiness.**

### The temporary override is gone, as designed
`withAuthoredRegionCountSetAside` set the authored count aside **in callers only** while the ruling was
pending, arranged so deleting it would not compile until every call site was revisited. The restatement
landed → deleted, all three revisited. **The over-population refusal stays under test synthetically — a
capability should outlive the defect that motivated it.**

### Corpus figures moved, with the reason recorded at each assertion
lines **125 → 121** (one element class's four field lines) · entailed **59 → 61** · NOT_AUTHORED **26 → 23**
· open **18 → 17** · restatements **30 → 33** (ruling **C33**).

### Rendering
Says *"along one touchline"* / *"along the opposite touchline"* — **never left/right**, which the authored
axis edges do not establish. Carries the established function near-literally; the system-term→coach-language
mapping is flagged as a vocabulary question, not guessed.

### ONLY ONE THING REMAINS
**The Wide Zone effect** — held on his instruction, nothing authored. Datum passed to him: the only
authored/required/support-capable items in the cluster are a **trigger** and its **referents**, and the
contract already excludes a second primary event, the channel as objective reference, and the channel as
ACCESS region — so *modify the existing primary event* is the one candidate the knowledge has not closed off.

---

## 2026-10-02 (C34) — Modifier AUTHORED. Chain does NOT pass: the blocker is REPRESENTATIONAL.

247 cases green, tsc clean. **Not the closure** — a new load-bearing dependency appeared, and it is not a
knowledge gap.

### The trigger check he asked for — ANSWERED: the knowledge does not establish what enters
The contract says it itself: *"no rule for what counts as 'moving through' (ball, player, touch). The last
is play-level, outside the boundary."* And **`REGION_ENTRY` has NO `triggerSemantics` entry** —
`FIRST_FORWARD_PASS` is the only trigger that does (his 29 Sept ruling). The source sentence is wider than
entry: *"Actions **starting in or moving through** the wide channel earn an advantage (bonus point, free
restart, or scoring multiplier)"* — **two qualifying modes, neither resolved.** His MULTIPLY ×2 picks the
third of those three advantages, which is the part the sentence does settle. **Nothing inferred.**

**Second unhoused thing:** *"within the same attacking episode"*. A value modifier carries
`condition.type`/`condition.referents`/`magnitude`/`operation`/`combination` — **no episode scope.** The
canonical mechanism exists (`startsEpisode`, used by `FIRST_FORWARD_PASS`'s semantics) but nothing ties a
modifier to an episode. No field invented.

### Authored (ruling C34)
V7 existence (`condition.type=region`) · V9 magnitude **2** · V9a **MULTIPLY** — both from registered closed
lists; SD-30 says a magnitude without an operation is incomplete, so the pair is authored together. **Base
value untouched**, so a line crossing not satisfying the condition is still worth 1. **First time V7 has
ever carried an item**, so the object's claims about the advantage now reach lines instead of vanishing —
the 1 October finding, closed.

### WHY IT STILL CANNOT BE EVALUATED — and this is the finding
`GA-MODIFIER-OVERLAP` is **NOT_EVALUABLE**, so realization is not authorized. The referents are the prose
*"both wide channels of this contract, each a referent"*, and **SD-58 forbids comparing open text as
identity**. Typing them is the canonical remedy (SD-98 precedent, same operation as C29c/C30b) and **it has
no working form:**
- **one item, array of two typed refs** → the array is read as a **permitted SET**, so the line becomes
  *choose one of the two channels* — inverting the authored "both";
- **two items, one referent each** → they **COLLIDE** (SD-02).

V8b's registered valueType says *"references to regions, objects or events; **one property per referent**"*
and **neither route implements that**. Both attempts REVERTED — the collision was mine, not the knowledge's.
→ **His C33 restatement is what made the reference well-defined** (before it, "both wide channels" answered
to three classes). **The knowledge is now precise and the representation cannot carry it.**

### Closure condition
`resolved game YES → authorized realization NO → … ` — stops at step two.
**`derivationInputWithoutWideZoneModifier`** (run-bounded-selection.ts) drops the modifier from **a caller's
own copy of the input, never from the corpus**, keeping acceptance / post-realization / rendering under
test. The blocker has its own test asserting `NOT_EVALUABLE` and naming the check. **Deleting the function
will not compile until every call site is revisited.** Modifier-free the pathway is unchanged: acceptance
PASSED · Gate A PASSED · render-eligible · Q2/Q3/Q4 pass · Q5 fails on the two channels.

### With him — two ways forward, both his
(a) make **a condition on two referents** representable — smallest version: make V8b's *one property per
referent* **accumulate** the way `functions` already does; or (b) rule that the condition names **one**
referent, which changes what he authored. Not guessed between.

### Corpus figures (reasons recorded at each assertion)
lines **121 → 126** (V7's five owned rows enumerate) · entailed **61 → 65** · NOT_AUTHORED **23 → 24** (V10
combination, *"never addressed"* per the contract) · added items **9 → 12**.

The three check defects are preserved as regression cases at his request.

---

## 2026-10-02 (C35) — A04 runs the WHOLE chain. Q5 fails on ONE thing: the held trigger decision.

    resolved game YES → authorized YES → acceptance PASSED → runnable YES → post-realization PASSED
    → rendering Q2 PASS · Q3 PASS · Q4 PASS · Q5 ONE violation

Collisions 0. 247 cases green, tsc clean. Coach-facing: *"When the channel condition is met, that same score
is worth 2 instead of 1"* · *"The condition is about the two channels you marked — it applies to either of
them"* (his semantics, stated to a coach).

### `multiplicity: "SET"` — the narrowest general form of ruling (a)
**Types what five rows' valueType prose ALREADY states** — *"one property per referent/member/trigger"* —
so two support-capable items on such a row are two **MEMBERS** and accumulate instead of colliding (SD-02).
Rows: **S4, J7, J10, V5, V8b**. **J11b deliberately excluded** (*"member, or procedure over members"* does
not state the field holds a set; reading it as one would be interpretation).
**No new concept:** `establishedMembers` already meant "this item puts this member here" and the `CONTAINS`
selector path always used it — this makes it reachable from items too.

### Three further defects, all GENERAL, all from typed references reaching code that had never seen one
- **`GA-MODIFIER-OVERLAP` keyed referents by `String(referent)`** = `"[object Object]"` for EVERY typed
  structural reference, so all typed referents collapsed to one key and any two read as the same region.
  **And claimants were a list, so one modifier naming two referents overlapped ITSELF.** Keyed by resolved
  class; claimants are a set.
- **Member identity was `String(member)`** — a typed ref became the literal `"[object Object]"` as a line id
  and was then placed into the concrete game as if it were the member. Identity is the item it names.
- **A set held each member twice** once the field line carried the set and member lines appended again.

### SD-80 SCOPED, and strengthened — flagged to him because I touched an invariant
It guards a **NARROWING** becoming a value (*"a wrong answer wearing the label of a right one"*). A
register-declared set-valued row is different: **membership, not alternatives.** The test now asserts BOTH
halves — no line holds a set unless the register declares that row set-valued, AND no narrowing ever becomes
a value — stronger than the blanket form it replaced. **Weakening an invariant to let your own change
through is the move that must never pass unnoticed: say so explicitly.**

### What Q5 still fails on — HIS HELD DECISION, not a new problem
*"a coach is told that meeting the region condition changes the score, and nothing in the game establishes
what MEETS it."* The **fourth** failure mode in his original question — **operationally obscured** — and the
only one that passes every other test: nothing lost, nothing invented, channels participate, and a coach
still cannot award the bonus. Rendering declines to pick ball/player/touch to look runnable.

### EPISODE SCOPE — STOPPED and returned, per his own condition
**The mechanism exists:** `scope` is a contract-item enum (`WHOLE_GAME, PER_TEAM, PER_OBJECTIVE_SET,
OWN_INVOLVEMENT, BUILD_OUT_EPISODE`) and **he added the episode value himself under SD-36**, recorded as *"a
vocabulary addition making an already-authored distinction executable, not a new Game Representation area."*
So the smallest extension is a precedented enum addition — **no new field, not Wide-Zone-specific.**
**But defining a general "current attacking episode" needs POSSESSION ATTRIBUTION** (which team is attacking
in an episode) and I cannot find that established. And the register records that **4 of the 6 existing
`BUILD_OUT_EPISODE` uses do NOT conform** (keyed on the triggers that END an episode), so a general
definition bears on those too. **A question about the episode model, not an extension of it.**
The modifier carries `scope: WHOLE_GAME`, which is **wrong and left visibly wrong** rather than quietly
made to look right.

### Next
His ruling on the trigger semantics, preceded by the ecological/incentive **criteria** he wants formalized
first (objective · legible · opposition-robust · affordance-preserving · proportionate). Offered as a short
document stating them as questions an authoring decision must answer, with ball/player/touch worked as the
first example — **for him to approve**. Asked whether he would rather shape them himself first.

### 2026-10-02 — Ecological/incentive assurance criteria DRAFTED (`docs/INCENTIVE_ASSURANCE_CRITERIA.md`)
**Draft for his approval; nothing in the engine reads it.** Five questions an authoring decision must answer
before a new incentive meaning enters canonical knowledge — **objective · legible · opposition-robust ·
affordance-preserving · proportionate** — each with the question, pass/fail shape, the evidence that answers
it, and **WHO** can answer it (machine / coaching judgement / owner). *Recording which is which is about half
the value.*

**Grounded, not invented:** the incentive invariant (*"incentives raise the value, attention and visibility
of an opportunity — they must not script the behavior"*), *"invite, not force"*, GF11's compactness-emergent
finding, the scoring-ownership rule, the five influence dimensions. **The gap it fills:** the guardrail today
lives as library-row prose and as WORDING checks in `incentive-expression.ts` — those stop us *phrasing* an
incentive as an instruction and say nothing about whether its meaning is sound.

**The worked example (ball / player / touch) is what earns it, and no decision was made:**
- **PLAYER fails three criteria, two against AUTHORED knowledge** — park a player in each channel and the
  condition is permanently satisfied, contradicting the row's own audit **"Zones optional"** and the
  contract's **"Entering must not be compulsory"**. Unavailable, not merely unattractive.
- **BALL is weak on proportionality, checkably**: the two channels are **50% of A04's realized width** (7.5 m
  each on 30 m), so mere ball presence is satisfied incidentally and ×2 makes the base value decorative.
- **TOUCH is strongest on the ecological criteria and weakest on the one the engine cares about.**
→ **His worry confirmed: the easiest reading to evaluate deterministically is not the one the criteria
favour.** Optimising for convenience would have chosen ball.

**Criterion 4 already has a waiting case:** the Round 7.4 question on whether an explicit attacker-side
`Transition Bonus` over-scripts the race, which the framework itself says should not be settled as a one-off.

**Returned to him:** are these the five (a **learning-goal** criterion may be missing — none asks whether the
reward points at what the session is for) · is a failure a veto or a finding · where the answers are recorded
(`fitNote`/`basisEvidence` beside the authored value, or a separate ruling record).

### 2026-10-02 — Criteria APPROVED (six), and applied to the Wide Zone condition
`docs/INCENTIVE_ASSURANCE_CRITERIA.md` is **approved for use** (Christian, 2 Oct). His three rulings in:
- **6 · Learning-Relevant** added in his wording — *"does the incentive increase the value, attention, or
  visibility of an opportunity meaningfully related to the intended learning problem?"* Pass = biases
  exploration toward relevant opportunities **while leaving the learner's solution open**. **Deliberately not
  phrased as requiring a target behaviour** — *"the Learning Goal establishes the problem/opportunity
  landscape; it does not specify the player's solution."* A criterion demanding an action would be the
  invariant violated under another name.
- **CONTRADICTION vs CONCERN.** Contradiction = conflicts with canonical authored knowledge or a governing
  invariant → **unavailable**. Concern = a recorded finding to weigh. **Criterion 4 is NOT a veto for being
  criterion 4** — the test is the nature of the conflict. (Player reading = CONTRADICTION against *"Zones
  optional"* + *"Entering must not be compulsory"*; ball reading's proportionality = CONCERN.)
- **Answers live in the authored item's `fitNote` / `basisEvidence`.**

**FIRST CANONICAL APPLICATION — *"a controlled attacking-team touch within the wide channel"* PASSES ALL SIX.**
Evaluated against the real selection, which mattered: **Beat Defenders 1v1** · Central Density Condition as
foundation (`protect_space`) · Wide Zone as **shaping** (`exploit_space`) · lens **Line-Breaking Opportunity**.
Two of his intentions actively improve the result — no-traversal secures affordance-preserving, and
attacking-team secures opposition-robust (a defensive clearance would otherwise arm the attack's bonus).

**Two findings:**
1. **Learning-Relevant passes WITH A CONCERN.** The chain holds (central density → opportunity moves wide →
   channel makes it legible → defender comes out → 1v1 available), but the condition is satisfied by
   **controlling the ball in the space**, not by engaging a defender. A team could circulate in and out, never
   attempt the 1v1, and bank the bonus. **Not** a contradiction — requiring the 1v1 would be the more
   dangerous design and `exploit_space` is the authored target — but it is the gap between what is rewarded
   and what the session is for, and it bears on magnitude.
2. **STRUCTURAL: "attacking team" needs what the representation lacks.** Either **live possession
   attribution** (not established) or **a window tying the touch to the scorer** — which is the **episode
   scope** he asked to keep separate. **The two are not independent**: his qualifier makes that scope
   load-bearing for this condition. Neither mechanism invented; reported.

**Returned:** is *"controlled"* retained-possession (observable, passes) or deliberate (intent — criterion 1
excludes it)? · how *"attacking team"* is established · whether a traversal with **no** controlled touch also
qualifies (the source authors *"starting in OR moving through"*; his formulation reaches only the first) ·
then **magnitude**, after those. **Nothing authored into canonical knowledge.** A04 and generation frozen.

### 2026-10-02 — POSSESSION ATTRIBUTION IS ALREADY REQUIRED BY AUTHORED KNOWLEDGE
His bounded representation check, answered: **YES, decisively, in a CONTRACTED object independent of Wide Zone.**
**Wide Zone did not create the requirement — it exposed that a relationship the corpus already depends on has no
representation.** All verified against the authored text directly.

**The decisive case — Neutral Player Condition** (contracted). It authors `P6b = ATTACKING_TEAM`, and the
restatement's own fitNote defines the token: *"ATTACKING_TEAM ('in possession for the episode') is re-evaluated
each episode; START and POSSESSION_CHANGE begin one (SD-14), so it holds 'currently in possession'."* A second
item: *"All neutrals become teammates of the team now in possession."* `P6a = STANDING`: *"a standing affiliation
to ATTACKING_TEAM changes at every POSSESSION_CHANGE."*
→ **What makes it decisive rather than arguable: the same object FORBIDS the static reading.** P6b excludes
`DEFENDING_TEAM` (*"forbids the team out of possession"*) and excludes `TEAM_<id>` (*"No neutral is fixed to one
team"*). **We are not inferring that a fixed designation is inadequate; the knowledge prohibits it.**

**The concept is GENERAL:** seven rows carry "team designation" as their valueType — **P6b, P9, J3, T1a, T1b, T2,
V14a** — and **T2's own valueType says "team designation EVALUATED AT THE TRIGGER"**. `POSSESSION_CHANGE` is in
the trigger vocabulary, so *detecting* it needs attribution before anything is awarded. **One general
relationship, seven rows leaning on it, defined in exactly one place: a fitNote.**

### A DEFECT FOUND IN A04'S OWN ARTIFACT while checking
`performers.teams[].designation = ATTACKING_TEAM / DEFENDING_TEAM` in the concrete game, and:
- **there is NO register row for `designation`** (only P2 `outfieldCount` and P3 `goalkeeper` are owned by P1);
- **no authority** — it came from the choices file with the reasons *"First of the two"* / *"second of the two"*;
- **it sits against GF2's own `J3 = EACH_TEAM: one shared target attacked by both`** — if both teams attack the
  same target, statically labelling one "defending" is not a description of this game.

**It survived because an instantiated member's own fields are blanket-authorised by the existential claim** — the
one permission left in place when `nothingInvented` was tightened, and exactly where this got through. **So the
only thing in A04 resembling possession attribution is an unregistered, authority-free static label.**

### The structural point worth keeping
**SD-14 already ties episodes to possession** (*"START and POSSESSION_CHANGE begin an episode"*) and
`ATTACKING_TEAM` is already *"in possession for the episode"*. So his two options — live possession attribution
vs scorer-linked episode scope — **are not alternatives but two views of one missing relationship**, and the
knowledge already states the link. Nothing designed, neither mechanism implemented.

### Also settled (his rulings), recorded in the assurance document
- **"Controlled" = a touch after which the touching player's team retains possession** — observable, no intent.
- **Traversal neither required NOR sufficient.** The source's second mode deliberately not adopted, *"on evidence
  the source itself did not resolve"* — **the first time the criteria ruled AGAINST authored source material**.
- **Wording correction applied**: Proportionate said *"a deliberate act"*, contradicting Objective where
  deliberate is excluded; now *"a more discriminating condition than mere ball presence"*.

### Returned to him
Treat it as one general relationship or two mechanisms · what to do about A04's unregistered `designation` (in
the frozen fixture, untouched) · whether `nothingInvented` should stop blanket-authorising a member's own fields
(wide blast radius, so not proposed unilaterally). **Magnitude still open. A04 and generation frozen.**

---

## 2026-10-03 — Possession relationship proposed; designations removed; member authorization narrowed
248 cases green, tsc clean. A04: acceptance PASSED · Gate A PASSED · render-eligible · Q2/Q3/Q4 pass · Q5 one
violation (the held trigger decision). **Proposal in `docs/POSSESSION_RELATIONSHIP_PROPOSAL.md`.**

### The answer: the corpus establishes the STRUCTURE; nothing HOLDS it
**Established, cited:** initial value is a realization freedom (**SD-R2**, "which team starts can remain a
permitted free choice") · it changes at the registered `POSSESSION_CHANGE` trigger · **SD-14: "START, SCORE and
POSSESSION_CHANGE each begin a new attacking episode"** (THREE events) · a change continues play by default
(**SD-20**) · `ATTACKING_TEAM` denotes its current value and a fixed-team reading is **prohibited** (Neutral
Player Condition) · a designation may be "evaluated at the trigger" (T2).

**NOT established: any field.** `objects[]` = kind/count/position — **no owner**. `performers.teams[]` =
outfieldCount/goalkeeper/roles. `participation[].state` = ACTIVE/INACTIVE/WAITING/RESTING/OBSERVING. **So the
representation can say possession CHANGED and cannot say who HAS it.**

### The strongest evidence for his exact phrase "existing SELECTED knowledge"
**GF2 — selected by A04 — authors two `awardedTo` prohibitions:** `GF2-07.b` *"LOST_BALL (forbidden: a rule
returning a won ball to the team that lost it)"* and `GF2-16.a` *"NOT_LAST_TOUCH"*. Neither is evaluable without
knowing who lost or last touched the ball. **Independent of Wide Zone.**
Qualified honestly: those lines are **N/A in A04** (its transition is CONTINUE, RC-20), and the **Neutral Player
Condition is contracted but NOT currently selected** by any of A01–A10. One settles *"already authored"*, the
other settles *"existing selected knowledge"*.

### His concept warning — A04 already PROVES it, rather than leaving it open
GF2 authors `J3 = EACH_TEAM: one shared target attacked by both`, so in A04: **objective association** =
neither/both · **scoring eligibility** = both continuously · **possession** = one at a time, the only
discriminator. **The identity is already false here** — which is the cleanest reason the unsupported
`designation` had to go. His single-goal check-out diagnostic **survives the proposal**, because the proposal is
silent on scoring eligibility. No machinery added for it.

### Rulings 2 and 3 — evidence BEFORE repair, as instructed
- **Removing `designation`: NO consequence.** Acceptance/Gate A/render-eligible/rendering all unchanged. One
  test failed and it was mine asserting the removed property existed. **Nothing depended on it — the evidence
  that it was never doing representational work.** Members are now empty, which is the honest state.
- **Narrowing the member authorization: production blast radius ZERO.** Three test assertions failed, **all three
  his second category** (downstream assumptions on the blanket permission), none missing knowledge. One said
  outright *"the instantiated member is authorized by the claim and recorded, so it is not an invention"* — the
  reasoning that let `designation` through. All inverted to assert the new principle.
- **One real defect in the check, fixed** (not a knowledge gap): member accounting matched the **exact leaf
  only**, so a structured ENTAILED value split into one false invention per field — *the same mistake that
  function's own comment records making once before*. Fixed by mirroring its own short-circuit.

### EXPOSED, independent of Wide Zone — the finding worth his attention
**`ATTACKING_TEAM` is UNDEFINED immediately after a score.** SD-14 says a SCORE begins a new attacking episode;
**SD-R3** leaves the post-score procedure with *"no universal realization"*; so post-score possession is
unauthored. Live consequence: **neutral affiliation is `ATTACKING_TEAM` re-decided at every episode boundary, and
a score is one** — so for any game selecting that condition, affiliation after a score is undetermined.
Also: the neutral condition's fitNote cites SD-14 but **omits SCORE** from its three events — narrower than the
decision it cites.

### With him
Is one relation the right size · rule or record the post-score gap · where the relation lives (the ball is the
intuitive home and has **no owner field**; a game-level relation needs no new collection — **not chosen, it is a
representational decision the corpus does not settle**). Magnitude still held. A04 and generation frozen.
*(The wider mechanism-family sweep was stopped when the previous session ended; not relaunched — the evidence
above is all primary-source and verified directly.)*

### 2026-10-03 — POSSESSION RELATION (PS1) IMPLEMENTED. A04 unchanged; one gap exposed.
248 cases green, tsc clean. A04: acceptance PASSED · Gate A PASSED · render-eligible · Q2/Q3/Q4 pass · Q5 one
violation (the held trigger decision). Tests: `back/src/system/derivation/possession.unit.ts`.

### What went in
**One game-level row, `possession.team` (PS1)** — **game level, NOT an owner field on the ball**, per his ruling.
Its choice space is registered as `fillable: "one of the teams the game establishes"`, and **that was enough**:
`mayBeOpen` already reads a row's `fillable` as its structurally defined choice space under SD-39, so **no new
mechanism was needed**. The row records his exclusions verbatim (no scoring eligibility · no objective
association · no invented gain/loss mechanism · no universal post-score procedure · no static ATTACKING/DEFENDING
labels) and the boundary ruling.
→ **Confirmation worth keeping: SD-14's own registered note already says *"Defines boundaries only"***, so his
ruling that an episode boundary does not itself establish possession is consistent with SD-14's self-description.

### His five questions
1. **Possession established without invention? YES** — and the honest form is that on A04 it is **UNESTABLISHED,
   reason "no coverage"**. Nothing addresses possession → SD-39's existence condition unmet → a gap, not a guess.
   **A test proves the relation is LIVE** (add an item addressing the row and it resolves) so "unestablished" is
   not mistaken for "inert".
2. **`ATTACKING_TEAM` resolves against the relation**, and is unresolved where the relation is.
3. **Consumers newly evaluable: NONE, anywhere.** GF2's two `awardedTo` prohibitions are N/A in A04 (CONTINUE);
   no goal in A01–A10 selects the neutral condition. Said plainly rather than implying more.
4. **Post-score:** the distinction is now **machine-visible** — post-score possession is representable as
   unestablished instead of silently assumed.
5. **Wide Zone: two of three halves now expressible.** "retains possession" (POSSESSION_CHANGE is the only thing
   that changes the relation) and "attacking-team" (the designation has a referent). **"a touch" is NOT** — there
   is **no touch event in the trigger vocabulary at all**; `LAST_TOUCH` exists only as a team designation. That is
   exactly the trigger-semantics decision he is holding.

### Done beyond the fitNote, and flagged to him
**The register's own `teamDesignations` glossed `ATTACKING_TEAM` as "in possession for the episode"** — the same
conflation he identified in the Neutral Player Condition's note. **The defect was in the register too.** Corrected
both to resolve against PS1; offered to revert the register half. The neutral fitNote is **revised on his reading
rather than patched**: affiliation follows the possession relation, not the episode counter, and is **UNRESOLVED**
where possession is unestablished — no fallback to a previous holder, no inferred team.
→ The designation vocabulary already held `WON_BALL (team that won possession at the trigger)`, `LOST_BALL`,
`LAST_TOUCH`. **The corpus named the states of this relation before anything could hold one** — the clearest
evidence it was a missing relation rather than a new concept.

### THE GAP EXPOSED — reported, not repaired
**The established teams have NO IDENTITY.** Before realization they do not exist (existential shortfall 2,
`performers.teams` absent from the resolved game); after realization both are
`{satisfies, outfieldCount: 6, goalkeeper: 0}` and **indistinguishable** but for collection position, which is an
engine artifact. **So possession cannot be ASSIGNED even where established — there is nothing to assign it to.**
`teamDesignations` contemplates `TEAM_<id> (a named team)` and no contracted item authors a name.

→ **The framing that matters: this is a direct consequence of removing the designations, and it clarifies what
they were doing — standing in for team IDENTITY as well as for possession, with authority for neither.** Removing
them was right; it made the identity question visible where it had been hidden.
→ Also: **the possession choice cannot be a pre-realization freedom at all**, because its choice space is empty
until realization instantiates the teams — the same shape as the roster, which became a post-realization
entailment.

Corpus: lines 126 → 127, NOT_AUTHORED 24 → 25, both PS1. Designation removal and the narrowed member
authorization both stand. Magnitude still held. **A04 and generation frozen.**

---

## 3 October — the bounded instantiated-element identity check (EVIDENCE ONLY, nothing implemented)

He held the team-identity proposal for one bounded check: **is this a team-specific gap or a general
instantiated-element reference question?** Six questions + blast radius. Full evidence in
`docs/INSTANTIATED_ELEMENT_IDENTITY.md`. **No code changed — two new docs only.**

**Answer: general, and teams are the only collection that currently exercises it.**

### The mechanism already exists and is already meaning-free
`elementId` — the class id `c:<contract>:<item>`, minted from the authoring item, addressed as
`container[elementId].leaf`. Reached as a typed structural reference (SD-98), already graded
HELD/DANGLING/OPEN_TEXT. It is exactly what his principle describes. **It cannot mint more than one handle per
authoring item, because the handle IS the item** — and one existential claim of cardinality 2 is one authoring act.

> **The general statement: all three identity mechanisms (class id, typed reference, authored selector) identify
> an element by WHAT AUTHORED IT. None can identify an element that nothing individuates.**

Teams are the only case because teams are the only collection whose members come from a claim with cardinality
above 1 rather than authored one item at a time. Verified across A01–A06: the only claim with a shortfall anywhere
is `performers.teams[]`. **The two wide channels are the near-miss** — they look like the case and are not: each
has its own item, hence its own id, plus a distinguishing authored selector. The corpus has never had to refer to
one of N indiscernible instances.

**Structural bound: no register row anywhere names an id/name/label/key/identity leaf.** `performers.teams[]` has
exactly four rows (collection, outfieldCount, goalkeeper, roles[]). Identity lives entirely outside the register.
`designation` appears **zero** times in it — no row, so no line and no verdict. That is the anatomy of the defect.

### THE CORRECTION I OWED HIM — GF2's P2 does NOT require identity
I went in believing it did and said so in the possession note. **It is symmetric** ("equal to the other team's
outfieldCount") — a set-level comparison expresses it exactly, and `deriveRoster` already does it. So **the one
selected consumer was already served without identity, which is why nothing had been blocked.**

**The requirement splits — this is the useful finding:**
- **symmetric** per-team claims → `scope: PER_TEAM` plus a set-level comparison. **No identity.**
- **asymmetric** per-team claims, and possession assignment → **identity required.**

`scope: PER_TEAM` gives universal quantification but **not co-reference or complement**. "Each team" needs no
identity; "the other team" does. Three authors reached for a complement/asymmetry and **all three were recorded
SCHEMA LOCAL** — the restatements have been reporting this gap without naming it.

What genuinely requires it: **GF4's P2 "unequal between the teams, e.g. 4 and 6 (4v6)"** (PER_TEAM, AUTHORED, but
TYPICAL_EXAMPLE, and GF4 is contracted-not-selected — `deriveRoster` refuses on it, so a GF4 game gets no roster
rather than a wrong one); the Neutral Player Condition's `P2(T) > P2(other team) − P5`; and possession assignment,
which is the **third** consumer chronologically, not the first.

### The criterion for identity vs property (Q4) — one testable question
> **Can swapping it between two members make the representation false?**
> Yes → a **value**: needs a row, basis, status, support. (`designation` had none.)
> No → an **address**: needs only to be unique among siblings and stable.

A handle must be unique, stable, **opaque** (equality and complement only — no ordering, arithmetic, string
matching, or recovering the instantiation order), **unauthored** (no row/line/verdict/status; no item targets it)
and **unrendered**. A name, colour or attacking/defending designation each fail the swap test, so each is a value.

### Stage (Q5) — TESTED, not assumed: instantiation, inside realization
Cannot be earlier (pre-realization the teams are absent, shortfall 2 — nothing to carry a handle). Not needed
earlier (**no line referring to an individual team is enumerated pre-realization**; member lines come from
`establishedMembers`, and A04's only two are an "objective-area" string and a typed ref to a channel — no P2 line
is enumerated in A01–A06). **Refinement worth the test: instantiation NOT final assembly** — `nothingInvented`
already addresses members individually during realization via `key(path, i)`, so minting at assembly would leave
the index operative for all of realization and the two notions would coexist.

### Falsification case (Q6) — permutation invariance
(a) handles h1 and h2 distinct, each resolving to one member, with `complement(h1)=h2` single-valued. (b) exchange
the handles and every artifact is identical modulo renaming — and the **rendered coach text identical LITERALLY**,
since no handle may reach a coach.
> **A04 fails (a) outright and passes (b) VACUOUSLY** — the two members are identical objects, so exchanging them
> is the identity operation. **That is why no check caught this: the game is perfectly symmetric, and the index is
> harmless precisely because nothing yet distinguishes the members.** The first asymmetric per-team value breaks it.
> The test must be run with a distinguishing value forced in or it proves nothing (cf. GA-ROSTER-SUM passing for
> 4, 5, 6 AND 7).

### BLAST RADIUS (reported, not repaired)
**Wrong-answer class:**
1. **A01/A02/A05 carry TWO claims on `performers.teams[]`** and nothing can see they co-refer. A01: PCG-08
   (shortfall 1, no max) plus GF2-14.a (shortfall 2, max 2). **Ran the authorization: 2 teams refused either
   attribution; 3 teams draw NO team-related objection.** The per-claim max counts only that claim's own
   instantiations, and the collection cardinality check runs *before* instantiation. Same error class as the three
   Wide Zone channels; latent only because A01's Gate A is NOT_EVALUABLE.
2. **Per-team values addressed by index** at assembly. Safe **only because** `deriveRoster` refuses unless equality
   is authored — it writes a per-index number only where the index cannot matter. **An equality guard, not an
   identity guard: the safety is incidental.**

**Check-degradation class:**
3. **`DISTINCT_ON` NEVER EXECUTES AT ALL** — worse than the identity degradation, and independent of it. The one
   authored condition (`VARTARGET-03.a`) sits on row **O4**, so `condition.path` is taken as the FIELD path
   `objects[].position.along`; `realize.ts:408` filters on
   `parts.container.startsWith(condition.path.replace(/\[\]$/, ''))` and **`/\[\]$/` strips only a TRAILING
   `[]`**, while `parts.container` is just `objects`. Nothing matches, `tuples` stays empty, the check passes
   having compared nothing. **The corpus's only joint condition is dead for everyone.** The identity degradation
   (two members of one claim share a path segment, so the second overwrites the first in `tuples`) sits behind it.
4. **`memberKey` dedupe drops a twin** — `String(member)` for non-typed members, first wins. Same assumption a
   layer down.
5. **`realize.ts:738` `elementId ?? satisfies` reports a colliding path.** Accounting underneath uses
   `key(path, i)`, so **no value is mis-attributed** — cosmetic, but it names one path for two members in a failure.
6. **Three unrelated spellings of member identity** (`contractId::itemId`, `key(path,i)`, `realized:<classId>:<i>`).

**CORRECTION — member order is NOT deterministic, and I measured the wrong thing first.** My first pass checked the
order of `resolved.existential` (derived, and sorted at `engine.ts:197/330` and `resolved-game.ts:446`) and reported
"member order is stable". For **instantiated members**: `grep` for a sort over `instantiations` across `src/`
returns **nothing**; `realize.ts:452` assigns `memberIndex` from `list.length`, i.e. the caller's array order; for
A04 the only thing fixing that order is the array order in `a04-realization-choices.json`, whose two entries are
byte-identical; and `record.fromDigest` is `resolved.provenance.inputDigest` (`realize.ts:551`), the **resolved
game's** digest, so it does not cover realization's own order-dependent decisions. **Two members of one claim have
no content-derived ordering key at all** — the index is not merely meaningless, it is not even anchored.
→ **Lesson: when checking determinism, check the artifact you actually care about.** Derived-element order is
guaranteed; instantiated-member order is guaranteed by nothing, and the two live in the same object.

### THE RULING ASKED FOR
Two of his rulings meet at the discriminator: *position is an implementation artifact, not authored football
meaning*, and *identity may be required without carrying domain meaning*. **Compatible only if MINTING is separated
from INTERPRETING.** So: is an ordinal permissible as an **input** to minting an opaque handle, with opacity and the
permutation test as guards? Or must the derivation contain no ordinal — in which case **identity cannot be
established from the corpus at all** (the alternatives are an authored distinguishing property, which does not
exist and which he forbade inventing, or an opaque counter, which is an ordinal wearing a hat), **the two teams are
genuinely indiscernible, and GF4's asymmetry and possession assignment are blocked on an AUTHORING decision rather
than an engine extension.** Both coherent; the second is more conservative and may be right. Not chosen.

Touch trigger and magnitude untouched — neither reading affects either. A04 and generation frozen.

### Second pass — what the first pass of the identity check MISSED or got wrong

Three parallel traces plus my own verification. **I caught two agent overstatements; both are recorded below as
what the evidence actually supports.** Everything here was re-verified against source by running it.

#### THE MECHANISM WE ALREADY HAVE AND HAVE NEVER USED — `COMPARES`
**`COMPARES` is a registered requirement kind**, added by **AM-16 on 2026-09-20** with a full form
(`{left, operator, right}`, operators `= != < <= > >=`) and operand forms under SD-23 (a represented game property
`{row, selector}`, or a deterministically derived quantity over SUPPORTED properties). The register versions it:
`"contractEnums.requirement": "2 (2026-09-20, COMPARES added by AM-16)"`. **ZERO corpus items use it.**
→ **The four P2 fitNotes saying "No requirement kind compares two elements … (SCHEMA LOCAL)" are STALE** — true
when written, and AM-16 added exactly that kind. Four items are declared blocked on a limitation that is gone.
→ His rule *"a new mechanism must not be introduced where an existing canonical mechanism already owns the same
semantic concept"* points at COMPARES before anything new.
→ **It localizes what identity is FOR**: a symmetric comparison needs two operands ranging over the pair; an
**asymmetric** one needs a selector that picks out ONE team — and a selector picking one of two indiscernible
members is precisely the missing handle. It would also replace `deriveRoster`'s `/\bequal/i` prose sniff, which is
how the "unequal between the teams" near-miss arose.
→ **So the answer is not "mint a handle" alone: the comparison kind exists, is unused, and is what a handle is for.**

#### Q3's REAL authority is his own ruling, not an item
**C31b (1 October) promoted GF2-14.b from ASSUMED to OWNER_RULING** so the roster could derive, with the caution:
> *"Please preserve the ability for other selected authoritative knowledge to establish numerical asymmetry where
> the learning problem requires it. Equal team numbers should not become an engine-level universal assumption."*
and its fitNote: a game form authoring asymmetry **displaces** GF2-14.b through SD-90, so equality is knowledge
about THIS game form and never a universal. **A displacing game form must say which team gets which number.**
→ **Asymmetry is a DIRECTED capability, not a hypothetical** — that is stronger evidence than any corpus item.
→ **Strict answer to Q3: among knowledge that actually ENTAILS anything today, possession assignment is the ONLY
consumer.** GF4's "unequal … e.g. 4 and 6" is TYPICAL_EXAMPLE (bounds, never entails) and GF4 is
contracted-not-selected; the Variable Target asymmetry rests on an ASSUMED item while its row is NOT_AUTHORED.
**So identity is a PREREQUISITE, not an unmet existing requirement** — weaker than my first pass claimed, and right.
→ Two latent shapes to watch: **PCG's SV1 is registered as a view KEYED BY TEAM** ("halves and thirds along the
axis, per team (own/attacking)") — possession can pick the key but cannot supply the mapping, because per-team
halves must stay stable while possession alternates; and the Variable Target asymmetry. Both blocked on authority.
→ `TEAM_<id>` is used 3×; **no authoritative item REQUIRES a named team.** The clearest use is an AUTHORED
**exclusion** (no neutral fixed to a named team), which needs the form to be EXPRESSIBLE so the prohibition is not
vacuous — a far weaker demand, and exactly the vocabulary-vs-item asymmetry he suspected.

#### THE WORST FINDING — `chosenMemberLeaves` is wrong in BOTH directions (realize.ts:691–704)
```
const index = realized.record.instantiations.findIndex(
    i => collectionPath(i.path) === collection && String(i.classId) === String(parts.elementId))
...
chosenMemberLeaves.get(k)!.add(parts.leaf)
```
`findIndex` returns the **FIRST** instantiation with a matching classId — and two members of one claim share it, so
a choice about **either** member always resolves to member[0]. And it stores only the leaf **NAME**, not the value.
→ member[0]'s leaf is marked licensed so **any** value there passes unchallenged; member[1]'s **correct** value is
reported as an invention. **Wrong in both directions at once.**
→ **The adjacent map was EXPLICITLY hardened against exactly this** (`realize.ts:671–677`: *"Name-only accounting
was a hole: a member carrying outfieldCount: 99 beside an entailment recording outfieldCount reported nothing"*).
`entailedValues` got value-based accounting; `chosenMemberLeaves` never did. **The correct shape is ten lines above
it.** Latent — no choice in A04's file has a path into a member.
→ **This is a hole in the check everything else is trusted against, and it is the THIRD appearance of this shape.**

#### GA-ROSTER-SUM cannot see asymmetry — but something else catches it (agent overstated)
Forced **0 v 12** into A04's realized game and reran the gate. `GA-ROSTER-SUM` **PASSES** ("the roster sums to the
session count") — correctly in its own terms, 0+12=12. **It cannot see that the equality which LICENSED the
division was violated.** An agent reported `post.validated: true`; **that is wrong.** Render-eligibility comes back
**NO**, caught by `entailmentsLanded`: *"performers.teams[0].outfieldCount was entailed as 6 but the concrete game
holds 0"*. **No wrong game reaches a coach.**
→ Two lessons: the invariant is weaker than it looks, and **the check that caught it is the VALUE-based one** — the
same shape `chosenMemberLeaves` is missing. The fix shape is already demonstrated in the codebase.

#### The three-team case is LATENT, not live (agent overstated)
An agent reported it renders "3 teams of 4" to a coach. **Verified: A01, A02 and A05 all have `mayRealize: false`
(Gate A NOT_EVALUABLE), and with that gate synthetically lifted the realization is STILL refused — for five
UNRELATED reasons (open lines not chosen).** So it cannot reach a coach today. **What IS true and verified: the
cardinality guard raises zero team-related objections to three teams**, and `collectionCardinality` is **empty for
`performers.teams[]` corpus-wide** (it is restricted to individuated classes), so it cannot cover either.
→ **Report the guard's silence, not a coach-facing wrong answer.** Distinguish "the guard is silent" from "the
output is wrong" — a harness bypass proves the former, never the latter.

#### Smaller, verified
- **`fillableFrom` is DEAD DATA — on the PS1 row I added.** No engine code reads `fillableFrom` anywhere. The prose
  `fillable` string IS read (so the choice space is registered as I said), but the structural pointer to
  `performers.teams[]` is inert. Correcting my own last note.
- **`objectiveSets[]` is a SECOND existential claim** (`VARTARGET-06.a` on row J5). So "teams are the only
  collection with instantiated members" is true of **selected** knowledge, not the corpus. Harder case: J7
  (`objectiveSets[].members`) is a list of references pointing OUT of an instantiated member.
- `engine.ts:298` **skips field-line enumeration entirely for an existential class** (SD-97) — which is the
  mechanism behind "no P2 line is enumerated anywhere".

#### Third blocker, found last and it changes the ruling's shape
**`P1` declares `selectorAttributes: ["team"]`, and NEITHER `P2` NOR `P3` declares a `selectorAttribute`.** So
`team` is wholly unbacked by any FIELD row, and the SD-92 `CARRIES` relation that turns a selector term into a
property value requires one (`derive.ts:343`: `if (!row || !row.selectorAttribute) continue`).
→ **The authored-selector route — the very mechanism that tells the two wide channels apart — is STRUCTURALLY
UNAVAILABLE for a team**, independently of the instantiation problem.
→ **Consequence for the ruling: the conservative reading ("no ordinal, so author a distinguishing property
instead") is an authoring decision PLUS a register addition, not an authoring decision alone.** Check that the
escape hatch you offer an owner is actually open before offering it.

---

## 3 October — identity AUTHORIZED and implemented, plus the four integrity repairs and COMPARES

He ruled on all six points of the bounded identity check. **288 cases green, tsc clean. A04 unchanged:
authorized, acceptance passed, render-eligible, single fidelity violation still the held trigger decision.**

### The handle
`memberHandle(classId, ordinal) => `${classId}#${ordinal}``, minted at instantiation, carried in the
**existing** field — a member's `elementId`. So `container[handle].leaf` addresses a member exactly as it
already addressed a derived element; no second mechanism. The entailment address is now a real element path
rather than a display string (an index was never resolvable). `satisfies` is unchanged — which claim authorized
a member is a different question from which member it is.

**Readable, not hashed.** He asked not to introduce a content-derived distinction without a technical reason,
and there is none. Trade-off owned in the email: the ordinal is textually present, so opacity is enforced by
test rather than by construction.

### Four guards that exist because tracing found attack paths I would not have predicted
1. **The handle MUST be a string** — `quantitiesInGame` walks the game and treats every finite number as a
   supported quantity. A numeric handle 777 made an instruction claiming 777 pass. **A numeric identity field
   silently defeats the invention check for that number.**
2. **It must be ADDITIVE** — re-minting *derived* element ids produced **17 fidelity violations** as the
   status↔game provenance join collapsed.
3. **The discriminator must be UNCONDITIONAL**, even for a claim owing one member — a bare claim id would make
   a member findable by the derived-record element lookups, so a member's leaf could stand in for a derived
   element's in the acceptance checks: **a false PASS, not a failure.**
4. **It must stay OUT of class-id space** — `identityOf` grades a string HELD if it equals a class id, so a
   handle used verbatim as one would let an authored string target a handle. Keeping the `realized:` prefix
   preserves the guard; a handle string grades DANGLING instead, which is correct.
Plus: **no source may sort by, parse, or recover the ordinal from a handle** — checked across every file.

### The falsification case, built so it cannot pass vacuously
Part 1 permutes the two indiscernible teams and **ASSERTS THE VACUITY** rather than reporting a pass. Part 2
forces asymmetric per-member values (4 vs 8), exchanges handles and values together, and checks every value
follows its handle, every verdict is identical, and **the coach text is LITERALLY identical.**

### The four repairs
- **Invention check (worst one): repaired.** `findIndex` on classId returned the first member of the claim, and
  the map stored the leaf NAME. Now matched on the handle, value held. **Both halves asserted separately** — a
  test on the symmetric case cannot see either.
- **And the fix would have been UNREACHABLE:** choices were applied BEFORE members were instantiated, so a
  choice naming a member was refused as naming a missing element before any accounting saw it. Reordered.
- **Joint condition: repaired, and it was worse than reported.** Path now the owning collection (via
  `index.ownerRow`, register-validated to be a COLLECTION). **Fixing the path alone would have traded a dead
  check for an OVER-REACHING one**, so `scope` and `basis` are now carried: scope PER_OBJECTIVE_SET cannot be
  partitioned here → NOT EVALUABLE; basis ASSUMED → may report, never refuse (SD-27). A condition not
  evaluated now SAYS SO on the record. **Three reasons it constrains nothing, only one an engine defect** —
  the other two are knowledge facts, reported not repaired. Its set is never instantiated and no object carries
  an authored bound on either row it names.
- **Collection/cardinality: repaired.** Owed = **max** of the claims' shortfalls, not the sum; every claim's
  max binds the whole population. **The half I had missed: the CORRECT population of two was REFUSED** whichever
  claim its members were attributed to. Decides no co-reference question.
- **Index addressing: replaced** everywhere individual reference is required; index survives as positional
  provenance only.

### CORRECTION: five goals, not three — and 13 goals, not six
There are **13 learning goals** (A01 D01 TA01 TD01 A02 D02 TA02 TD02 A03 D03 A04 A05 A06). The two-claim shape
is in **A01, TA01, A02, TA02, A05**. My earlier report said three because I enumerated A01–A06 and assumed that
was the set. **Never infer the goal list from a naming pattern — ask the planning model.**

### COMPARES activated — and `stillOpen` CORRECTED MY OWN CONCLUSION
`comparison.ts` implements the register's 13-key block verbatim: form, 6 operators, SD-23 operand forms,
SD-26 (**takes NO LINE**, NARROWS, **never entails a value**), evaluability (**never quietly true**), SD-27
(assumed may report, never fail authoritatively). Evaluated at post-realization — earliest stage a per-member
operand has a subject — and reported as its own kind, not a gate clause.
- **Prose matching GONE.** GF2-14.b carries a typed comparison; the roster reads the declared relationship.
  Removes the class, not the symptom. Roster still 6 and 6.
- **`comparison.stillOpen` refuses a comparison ranging over several matched elements** ("an engine refuses
  such a comparison rather than choosing one"). Both operands of the equality name P2, owned by the teams
  collection, so each matches BOTH members → **DECLARED and REFUSED.**
- **This CORRECTS what I told him**: I said symmetric per-team claims need no identity because a set-level
  comparison expresses them. **The canonical mechanism REFUSES the set-level form.** So the mechanism he told
  me to use REQUIRES the identity he authorized — the two rulings fit tighter than I saw.
- **Four stale fitNotes corrected** (GF2-14.b, NEUTRAL-08.a/09.a/10.a), each citing AM-16 and naming the real
  residual blocker. **Nothing promoted** — NEUTRAL-09.a stays ASSUMED/PREFERRED_DEFAULT. A companion test
  asserts genuine missing-ROW limitations were NOT swept up.
- **Still not done:** the equality obligation itself. 0v12 is refused, but by `entailmentsLanded` ("entailed as
  6 but the game holds 0"), not by the equality. Closing `stillOpen` is his decision.

### Three knowledge decisions returned, none patched
1. **PCG-08's "at least 2 teams" sits in PROSE**, so the count reader refuses it and the claim reads as "at
   least 1, no max". SD-86 is the mechanism. **It is the PREMISE of the cardinality repair** — authorize typing?
2. **`(min ?? 1)` substitutes a minimum of 1 for an UNREADABLE cardinality** rather than recording it as
   unreadable. Left exactly as it was; changing it changes what every unreadable claim means.
3. The joint condition's three reasons (assumed basis, unpartitionable scope, uninstantiated set).
Plus mine to own: **`fillableFrom` on the PS1 row I added is read by NO engine code** — the prose choice space
is read, the structural pointer was inert.

### Reproducibility question he asked me to answer
**No technical reason to introduce a content-derived distinction.** The ordinal is reproducible from the
realization input (member order is the input's array order, which is input bytes). **What IS insufficient is
the AUDIT trail:** the record stamps itself with the RESOLVED game's input digest, so it does not cover
realization's own order-dependent decisions — two different realizations of one resolved game carry the same
stamp. Fix is to extend the digest, which is separate and smaller than distinguishing members. Not done:
outside today's authorization.

---

## 4 October — his four bounded corrections DONE, and the touch-ownership check REPORTED (not implemented)

**297 cases green, tsc clean. A04 unchanged.** Identity investigation closed by his ruling.

### The four corrections
1. **PCG-08 typed (C37)** — authored *"at least 2 teams"* → `typedBound {min: 2, max: null}` under SD-86. **It
   mattered beyond the item:** PCG-08 shares `performers.teams[]` with GF2-14.a, and while the 2 was unreadable
   the joint population depended on which claim the parser could read. Both now contribute 2.
2. **The `(min ?? 1)` substitution REMOVED — fail rather than infer.** Blast radius traced FIRST, as he
   required: **one claim corpus-wide (`restated:RPC-001:RPC-001-14.a`, `objectives[]`, authored `">=1"`),
   selected by NO goal, no goal's authorization changes, A04 untouched.** (Verified independently and by a
   trace that also ran all 13 goals × 24 practice situations = 33 runs: nullMin 0 in every one.)
   - **The distinction that makes it safe:** a null min is NOT by itself unreadable. A class forms only for
     EXISTS | COUNT | RANGE; EXISTS gets `{min:1}` outright; so `min===null && max!==null` is an authored
     **ceiling with no floor** — a complete claim that must keep working. Only `min===null && max===null` is a
     count requirement that stated nothing readable. **Both directions tested** — failing on the wrong one
     would be a new defect.
   - **Used `UNBOUNDED_COUNT_FILL`** — already in the CLOSED refusal list (types.ts, package §3.3, "Adding one
     is a design change") and **never once raised**. No kind added. **Look for a reserved-but-unemitted
     mechanism before inventing one.**
   - **Three reporter scripts each independently re-derived "at least one"** from a null cardinality — a display
     layer reproducing an inference the engine refused. Fixed, with a test that stops any of them saying it again.
   - **GAP REPORTED NOT REPAIRED:** RPC-001-14.a's `">=1"` is the same unreadable-number shape as PCG-08 and
     NEUTRAL-01.a. Left untyped — he asked for gaps, not a cleanup exercise.
   - Latent, noted: the `typedBound` branch runs BEFORE the EXISTS short-circuit, so an EXISTS item carrying
     `typedBound:{max:N}` would get min null. And a future RANGE item with a QUALITATIVE value on a collection
     row would be misclassified "unreadable count" when the author made no count claim.
3. **Audit stamp now covers the realization input** — `realizationDigest` + `auditDigest`. **Order hashed as
   SUPPLIED, not canonicalised**, because instantiation order fixes which handle each member gets; sorting
   would have reintroduced the collision being closed. Test reverses the input and asserts the resolved digest
   holds while the audit stamp moves.
4. **Joint distinctness left unresolved; handle left as implemented; `stillOpen` NOT closed** — all per his ruling.

### THE TOUCH OWNERSHIP CHECK — reported, nothing implemented (it needs a new concept)

**(a) No row anywhere represents an OCCURRENCE of a player contacting the ball.** Seven mechanisms own
different adjacent facts: GP-006/GP-007 owns the *semantic concept* but in the knowledge core as a PROBLEM
CLASS; PS1 owns the resulting STATE and **forbids** a gain/loss mechanism (so possession cannot supply the
touch — the dependency runs the wrong way); `primaryEvent.kind` owns the CONSEQUENCE with an RPC vocabulary
whose definitions ARE player-ball acts but whose token is opaque; `qualifiers.lastTouch` owns TEAM ATTRIBUTION
at an out-of-play trigger; restart actor+method own the one represented performer-on-ball act, only at a
stoppage; `rules.actionRestrictions[]` owns an authored ACTION's legal eligibility (closed kinds
`receiver_eligibility, action_order, direction_class` — pass-centric) but only as the subject of a legality
rule; and `primaryEvent.conditions[]` already admits a condition typed **`control`**.

> **DECISIVE STRUCTURAL FACT: there is NO individual performer in the representation at all.** Every performers
> row is a collection, count, role list, placement group or participation state. There is no player to be the
> subject of a touch.

**(b) No trigger owns it.** `triggerSemantics` has **exactly ONE entry** (FIRST_FORWARD_PASS), and it **defines
the two ADVERBS and leaves the VERB undefined** — it never says what a pass is. Two flags: it ends *"bounded
addition only, no qualifier capability is implied"*, so a trigger token does NOT bring qualifiers
(`triggerQualifiers` covers 2 of 9); and **nothing implements the NOT_EVALUABLE/CONDITIONAL rule its own gloss
states** — `triggerSemantics` is read at only two sites, both in fidelity.ts, neither a per-trigger lookup, so
FIRST_FORWARD_PASS is admitted by LIST MEMBERSHIP ALONE. Flagged, not touched. Only POSSESSION_CHANGE and
FIRST_FORWARD_PASS presuppose a contact and neither is defined; the four crossing triggers presuppose ball
MOTION, not contact.

**(c) `LAST_TOUCH` is evidence, not ownership.** Gloss is four words. For it to denote, three things must
already be true: contacts occur; they are team-attributable; they are time-ordered ("last" is a maximum over an
order). **So the representation already ASSUMES a team-attributed, temporally ordered contact history** — the
same shape as the possession relation. It cannot name a player (codomain is a team, and no player exists), a
when, or a where. **And it is unexercised: the last-touch row carries ZERO items against TWENTY declarations of
absence.** The one authored touch-derived value (GF2's "didn't touch it last") is SUPPORTING/PREFERRED_DEFAULT
so it bounds and never entails, and **no goal instantiates an out-of-play transition at all**, so it reaches no
consumer. **A01-02: EIGHT of fifteen items are scoped by a last-touch attribution in their SELECTOR, each
carrying HIS OWN 26 Sept definition naming "an attacking player" — and the same object declares that qualifier
NOT_AUTHORED.** It selects elements by a property no contract establishes.

**(d) The smallest representation is SMALLER than a touch event, and most slots already exist.**
- "retains possession" → needs NOTHING new (POSSESSION_CHANGE is the only mutator).
- "the touching player's team" → needs NO PLAYER. The condition's content only ever uses the TEAM, so a
  team-attributed contact suffices. **Careful: this is the mirror image of the P2 mistake — the wording reaches
  for an individual and the claim does not need one.** (His goal-kick wording DOES name a player, so other
  knowledge may want more.)
- "a touch within the channel" → **`valueModifiers[].condition.type` is a closed list reading `region, object,
  event` — it ALREADY admits an event-typed condition**, and `condition.referents` already reads *"references
  to regions, objects or events"*. And a **transition is already the in-play event occurrence**, carrying a
  team-designation qualifier AND a region qualifier AND a play state AND an episode boundary.
- **So what is genuinely missing is narrow: a trigger token for a contact + a `triggerSemantics` entry + a
  `triggerQualifiers` entry** (the last explicitly required by the FIRST_FORWARD_PASS precedent).
- **TWO BLOCKERS THAT ARE HIS:** (i) the spec states *"Each condition refers to existing regions, objects or
  placements, and is attached to the primary event. **No condition refers to a player's position during
  play.**"* Whether a TEAM-attributed contact located in a region falls inside that commitment is a reading of
  his own boundary. (ii) `condition.type` admits `event` and `referents` admits event references, but **there
  is NO event element to reference** — no events collection exists; the only event-shaped things are
  `transitions[]` and `value.primaryEvent`. Either a transition is the referent (overloading a concept about
  play stopping/continuing/possession changing) or something new holds it. More than one valid reading → brought
  to him.

**(e) Independently required, and the strongest case is HIS OWN ruling.** On 29 Sept he ruled the Pass
Combination Gate's reveal trigger: *"revealed immediately following each qualifying pass"* → `PCG-14.a`, basis
**OWNER_RULING**, REQUIRED, REQUIRED_RANGE, value `TEAMMATE_ACTION` — and the gap it replaced recorded the
choice as *"a completed pass (TEAMMATE_ACTION) or the coach's call (EXTERNAL_SIGNAL)"*. **He chose the pass.**
The rest of PCG authors a pass count, a reset and a chain and hands the touch-dependent half to play in its own
words (*"Whether the passes were made is play"*, *"No field holds reset triggers or the counting team"*); in a
derived game the whole mechanism is two blocks of free text plus an information rule **whose trigger comes back
failed**.
**COUNTER-PRECEDENT, weighed explicitly:** twice a pass-adjacent authored need was met with a BOUNDED, NON-EVENT
addition — FIRST_FORWARD_PASS as a fenced trigger token, and the reveal trigger as a CLASSIFICATION of an act
rather than the act. Both times the smallest sufficient thing was not an event. That is the best argument the
answer here is also smaller than it looks, and the reason nothing was implemented.
Everything else fails the strict test (GF2's default bounds; GF4's ordering SUPPORTING with order and shot not
held; RPC-001's "controlled on arrival" spec-declared FREE; the neutral items outside the boundary).

---

## 4 October (later) — RPC-001 typed, and MY CARRIER CANDIDATE WAS FALSIFIED

**297 green, A04 unchanged. No existential claim in the corpus has an unreadable cardinality any more.**

### Item 6 done (C38)
RPC-001-14.a's authored `">=1"` typed under SD-86 — the one claim the 10-03 removal of the minimum-of-one
substitution exposed. Regression test moved to assert the end state (none unreadable) and **keeps its teeth by
stripping the typed field back off** to prove the prose really is unreadable without it.

### THE CANDIDATE I WOULD HAVE PROPOSED BROKE — four reasons, three of which I had WRONG
I proposed putting the qualifying interaction on the value-modifier condition (interaction-kind vocabulary named
through `condition.type = event`, team + region as qualifiers).
1. **`condition.type` is the modifier's IDENTITY, not a retypeable field.** On A04 no item authors it; `region`
   is DERIVED from the class's defining selector, and **SD-101 makes that selector CONSTITUTIVE of class
   identity** — an item entailing a different value is reported as a contradicted constitutive selector, never
   resolved against. Retyping contradicts the modifier rather than reconfiguring it.
2. **It is single-valued.** Exactly five rows carry SET multiplicity and the register's note says *"no row gains
   it whose valueType did not already say so"* — so it cannot carry a kind AND a region. The referent SET *can*
   hold mixed members (forced through; reference integrity passed) but a kind token there establishes no
   identity, and **SD-57 forbids promoting open text into event identity**.
3. **`event` is NOT unused, and it is empty FOR A REASON.** GF4 carries four event-typed modifier items and
   A01-02 authors one; on the two goals selecting GF4, modifier-overlap is ALREADY NOT_EVALUABLE and Gate A
   ALREADY FAILS. **The slot is empty of entailments because it is REFUSED, not because it is free.**
4. **Forcing it DESTROYS A04** — measured: modifier-overlap PASS → NOT_EVALUABLE, Gate A → NOT_EVALUABLE,
   `realizationAuthorized` **true → false**. A partial retype is worse: it leaves his MULTIPLY ×2 reported as a
   *declared gap* with two TYPICAL_EXAMPLE items standing in for his own entailment (the §3 trap).
+ **A silent loss the repair would have INTRODUCED:** modifier-overlap routes entirely on `condition.type`, so
  retyping takes its region clause from "2 region referents compared" to "0 compared" **and still reports PASS.**
+ Also: **no team row exists anywhere under `value.valueModifiers`** (the six rows are V7, V8a, V8b, V9, V9a,
  V10), and a designation is evaluated *"at the trigger or episode it is attached to"* — a modifier condition is
  neither.

### WHAT THE FALSIFICATION SETTLED — register data, not argument
**`vocabularies.triggerRows` = ["T1", "V12", "V17", "V24"].** The trigger vocabulary is consumed by transitions,
consequences' trigger, information rules' trigger and time windows' startsOn. **THREE OF FOUR ARE NOT
TRANSITIONS.** So registering a contact as a trigger does NOT give it play state, episode behaviour or award
possibilities — those live on the transition's OTHER rows. **His item-2 concern is already solved by the
architecture.**

### IT ALSO CORRECTED HIS OWN REQUIREMENT (6)
**The recency in `LAST_TOUCH` is carried by the SLOT, not the designation.** `applicability.T1a.text` = *"whose
touch last played the ball before it left the field"* — the ROW means "last"; the designation only answers WHICH
TEAM. So filling that slot with `LAST_TOUCH` is a **TAUTOLOGY**, and filling it with `ATTACKING_TEAM` is
informative, which is what the corpus actually does. **The temporal burden exists whatever designation fills the
slot and does not arise from the designation** — so his requirement (6) asked the carrier to defend the wrong
thing.
What LAST_TOUCH actually needs: a **game-level, team-valued LATEST-VALUE relation** (most recent registered
contact), with an initial state, a named change event and an explicit unresolved rule — **the possession
relation's exact shape**. My candidate supplied nothing of the kind.

### THE FIVE CONSUMERS
- **Wide Zone** — BREAKS. Of four parts, the LOCATION is *already* carried (two typed channel referents under
  AM-17) and is the part a retype would DESTROY; contact, team attribution and retention are not carried at all.
- **LAST_TOUCH** — BREAKS; needs the latest-value relation.
- **A01/A02 goal kick** — SURVIVES_WITH_GAP, and **his containment is CONFIRMED**: the team reading suffices and
  the player reading is *inexpressible* in the register. And the requirement is thin — of the eight items scoped
  by a last-touch attribution **only TWO entail**; the other six bound or are inert.
- **Pass Combination Gate** — the STRONGEST independent requirement, and it is HIS OWN ruling.
  `TEAMMATE_ACTION` needs **nothing** from the carrier (a closed IE-layer classification, complete in itself;
  V18 resolves and reaches the game; GA-INFORMATION's trigger clause reads V17, not V18). **BUT the same 29 Sept
  ruling was applied to the five IE dimensions and NOT to V17**, the information rule's own structural trigger —
  which comes back **failed / NOT_AUTHORED / "not constrained"**. The only item that could resolve it is ASSUMED
  + PREFERRED_DEFAULT so it bounds and never entails, and **its own basisEvidence names the gap the ruling walked
  into**: *"Counting out loud could instead be read as a reveal on each completed pass, which is not a listed
  trigger."* He chose that reading; the trigger it needs is not in the vocabulary.
- **FIRST_FORWARD_PASS** — SURVIVES_WITH_GAP; stays undefined either way, because "forward" needs a per-contact
  direction, which is trajectory and forbidden. The TEAM's attacking direction is established; the contact's is not.

### WHERE THE EVIDENCE POINTS (reported as NOT yet falsified)
(1) the interaction kind is a member of the existing **trigger** vocabulary — because V17 is what actually needs
filling and a trigger demonstrably drags no transition semantics; (2) a **game-level latest-contact relation** of
PS1's shape for team attribution; (3) **region attribution through the existing per-trigger qualifier
mechanism**, precedent being the region reference already declared for REGION_ENTRY, authorized by his in-play
location ruling.
**Two things not yet known and worth falsifying first:** how a qualifier attaches to a trigger carried by
something OTHER than a transition (every existing qualifier row hangs off T1), and whether team attribution needs
a team projected OUT as a value rather than used as a filter (T2 `awardedTo` and V14a do; a condition does not).

### ITEM 5 — bounded repair, and I had UNDERSTATED what already exists
The structural half of trigger semantics IS consulted and IS governed by his own ruling:
`applicability.generalRule` (29 Sept) — *"a transition qualifier applies only where the transition trigger
semantics make that qualifier structurally applicable… Expressed as an applicability rule over the trigger"* —
and `governingLineRule` already specifies that a dependent line whose governing line is FREE(choice) is
**CONDITIONAL**, takes no value and is **not failed**, which is exactly what the FIRST_FORWARD_PASS gloss
promises. **`CONDITIONAL` is already a registered LineState** the classifier implements (classify.ts:105, :251).
Missing: the dependency is in PROSE, and the admitting check (`registeredTrigger`, gates.ts:1017-1021) tests
LIST MEMBERSHIP ONLY. **Proposed:** one machine-readable field on the semantics entry naming the row its
evaluability depends on + one consultation at the admitting check; line status needs nothing new.
**The limit, stated so he can judge:** `applicability` tests a governing line's VALUE MEMBERSHIP against a closed
list, and this dependency is about whether a line is ESTABLISHED AT ALL — and DV1's value is "per team {attacks,
defends}", not a list to enumerate. Hence one field rather than reusing that form.
Also: the single site that reads the semantics block only tests that it is NON-EMPTY (true merely because one
entry exists) — not a per-trigger lookup either.

### Harness note
My falsification workflow's judge step received the literal string `[object]` — I passed an array to `agent()`
without `.join('\n')`. **It correctly refused to invent a subject and grade its own invention**, citing this
project's own two prior instances of that failure. Consolidation was done by hand instead. **Join your prompt
arrays.**

---

## 4 October (late) — trigger-semantics correction IMPLEMENTED, and the THREE-PART SHAPE FALSIFIED

**303 cases green, tsc clean, A04 unchanged.**

### Item 5 implemented at his exact scope
`vocabularies.triggerSemantics.FIRST_FORWARD_PASS` became an object: the authored prose preserved verbatim as
`note`, plus `evaluabilityDependsOn: "DV1"` (the row holding attacking direction) and a `typedOn` provenance
field. **Indexed exactly as `nounSemantics` already is** (register.ts) rather than by a second mechanism —
`index.vocabularies` only stores ARRAYS, which is why the object block needed the nounSemantics precedent.
`gaInformation` now consults it per trigger via `triggerDependency()`, which keys on the BARE name so a
parameterised `NAME {arg}` reads the same entry. An unestablished dependency calls `probe.unestablished()`, the
existing idiom, so the clause blocks.
- **Verified observable:** `game::DV1` now appears in GA-INFORMATION's `blockedBy`, which it could not before.
  DV1 is a VIEW row that enumerates NO line, so the dependency is genuinely unestablished.
- **The trigger clause still reports FAIL on the corpus, and that is CORRECT** — two triggers there (COACH_CUE
  and a compound) are genuinely absent from the vocabulary, and `badTriggers.length ? fail : blocked ?
  notEvaluable : pass` means an ESTABLISHED violation outranks an unevaluable one. The sibling SUBJECT clause
  shows blocked→NOT_EVALUABLE works on this very check. **My first test asserted the wrong thing; the code was
  right.**
- Eight of nine triggers declare no dependency and are asserted unaffected (not a general redesign).
- Also corrected, as permitted and no further: `fidelity.ts` read the semantics block and tested
  `Object.keys(...).length > 0` — true merely because one entry exists, so it NAMED a consultation it never
  made. A per-trigger lookup is undefined there (a modifier condition names no trigger), so the conjunct is
  removed and the comment says so. **Changes no verdict.**

### THE THREE-PART SHAPE DID NOT SURVIVE AS A PACKAGE
**Q3 qualifiers — SETTLED IN HIS FAVOUR, and bigger than expected: qualifier semantics are TRIGGER-owned, and
qualification outside transitions ALREADY EXISTS IN RUNNING CODE.**
- `T1.selectorAttributes` = `[trigger, trigger.region, trigger.window, qualifier.lastTouch, qualifier.endLine,
  qualifier.region]` — **the register itself separates `trigger.*` from `qualifier.*`.** T1's valueType: "keyed
  by trigger (… `REGION_ENTRY {region}` …) **plus qualifiers**" — braces are TRIGGER.
- `triggerQualifiers` is keyed by TRIGGER and one of its two entries (TIME_EXPIRY) names **no row at all** —
  fatal to a transitions-scoped reading.
- He wrote *"no qualifier capability is implied"* **ON A TRIGGER**, which only makes sense if qualifier
  capability is a property triggers can have.
- **DECISIVE, in code: `engine.ts:237` builds `ctx.triggers` game-wide as `REGION_ENTRY{<S2 classId>}` FROM THE
  REGIONS, and its only consumer is a CONSEQUENCE (`gates.ts:1267`).** Measured end to end: a region-qualified
  consequence trigger reaches a RESOLVED:ENTAILED line and GA-EFFECT-TYPED passes.
- **So the carrier is the PARAMETERISED TRIGGER VALUE `NAME {argument}` — no new field anywhere**, and adding a
  referent field to V11/V15 would be a second mechanism for a concept the trigger notation owns (ownership rule).
- Caveat: **`triggerQualifiers` is read by NO engine code** — a prose gloss. Nothing is being generalized because
  nothing consumed it. And `applicability.generalRule` IS transitions-local (restrictive reading) — it governs
  when a transition's own qualifier rows enumerate, and is not where ownership lives.

**Q1 trigger kinds — BREAKS the three-candidate premise. Minimum is ONE token on ONE row.**
- **A generic contact is NOT supported; Wide Zone does not require it.** Its ONLY authored trigger-row item is
  `WIDEZONE-11.b` @ V12 = `REGION_ENTRY {a wide channel of this contract}`, AUTHORED/REQUIRED_RANGE — and its
  fitNote says *"For the free-restart alternative… **Reads UNMET if a modifier is chosen**."* **A modifier WAS
  chosen 2 Oct**, so Wide Zone's only authored trigger is on the branch not taken. The advantage lives on V7,
  whose whole subtree has **no trigger row**.
- **ZERO items in the eight contracts name a touch or contact as an EVENT.** Verified: six items' values mention
  touch/contact and every one is *touchline* adjacency or "touches one end line" — spatial, not interactional.
- The ruled condition is **not authored at all**: `INCENTIVE_ASSURANCE_CRITERIA.md:424` — *"Evaluated, not
  authored. Nothing has been written into canonical knowledge."*
- **THE GRAIN IS WRONG:** the settled condition (`:393`) is *"a touch within the channel **after which** the
  touching player's team retains possession"*. Retention is the absence of a possession change ACROSS AN
  INTERVAL — a two-event relation. **His own containment forbids a contact implying possession/possession change
  and forbids an event history.** So a contact token cannot carry it even in principle. Measured: adding CONTACT
  to the vocabulary changed NOTHING on A04.
- **`FIRST_FORWARD_PASS` is NOT a specialization of completed-pass** — its semantics say it implies *nothing*
  about pass success, so the vocabulary is **not a hierarchy**; they are independent kinds.
- **What IS supported: a COMPLETED PASS on V17** — the failed line his own 29 Sept ruling left behind. One
  vocabulary member + one semantics entry + one authored item.

**Q2 latest-contact — BREAKS, and the minimum is ZERO.**
- **The asked-for break: one relation cannot serve three.** The out-of-play qualifier wants the last contact
  BEFORE the ball left; Wide Zone wants the team performing the qualifying action AT the occurrence; PCG wants
  the last COMPLETED PASS. **Three different qualification predicates over contacts, not three readings of one
  state. A relation whose update rule varies by reader is a QUERY OVER A HISTORY — the event-history system he
  forbade.** One update rule answers at most one and answers the others wrongly without saying so.
- **Minimum is ZERO**: nothing authored entails any member of the LAST_TOUCH family (the qualifier row has zero
  items against twenty declarations of absence), and the one slot the corpus uses is structurally closed because
  the recency lives in the SLOT.

**Q4 team attribution — his preference HOLDS, plus a wording correction he needs.**
- Team belongs in a separately-held relation, not on the trigger. And **my floated simplification was
  FALSIFIED**: establishing PS1 on A04 in memory changed NOTHING about the Wide Zone modifier — the modifier has
  no slot possession could reach, so there is no coupling to simplify.
- **HIS RESTATEMENT CHANGED THE CONDITION'S MEANING.** He wrote *"attributable to the team in possession"*; the
  settled form (:393) is *"the touching player's team"*. "Attributable" appears NOWHERE in corpus or docs. In the
  settled form the team comes FROM THE CONTACT and possession is only interrogated afterwards; his restatement
  reverses the dependency and is the easier condition. Flagged, acted on neither.
- The remaining gap is not where the team lives — **nothing records that the qualifying occurrence happened**, so
  "a consumer may then relate the two" is the step Wide Zone cannot take either way.

### RECOMMENDATION RETURNED
Implement **only** the completed-pass trigger + semantics entry (independently required by his own ruling), and
return Wide Zone's qualifying condition to him as an **AUTHORING** decision — nothing in canonical knowledge asks
for a contact, and the condition as settled needs a two-event relation his containment rules out.

### ADDENDUM, same day — a LIVE DEFECT the last trace leg found: a standing decision's SELECTOR is never read

`applies()` (derive.ts:881-897) decides whether a citable standing decision reaches a line by matching the
**row only**: it reads `entry.item.row`, splits it, checks `rows.includes(line.row)`, then guards on
`record.session`, `record.entailing.length` and an optional `entry.condition`. **It never reads
`entry.item.selector`.**

Three citable standing decisions register a selector, and all three are ignored:
- `SD-13` row T3 selector `trigger=START`
- `SD-14` row T7 selector `trigger ∈ {START, SCORE, POSSESSION_CHANGE}`
- `SD-20` row T6 selector `trigger=POSSESSION_CHANGE`

**Measured across all 13 goals x every practice situation: SD-13 and SD-20 never apply** (an authored item
pre-empts them and the entailment guard holds). **SD-14 applies exactly three times:**
| line | its trigger | verdict |
|---|---|---|
| `GF2-07.a::T7` | POSSESSION_CHANGE | correct |
| `GF4 I06::T7` | POSSESSION_CHANGE | correct |
| `A01-02-01.a::T7` | **OUT_END_LINE** | **WRONG — one live wrong value** |

So the goal-kick transition in A01/A01-02 carries `startsEpisode = true` sourced from SD-14, which names only
START, SCORE and POSSESSION_CHANGE. **The claim is NOT that a goal kick does not begin an episode** — it is that
the representation has no authority for it: SD-14 is the only source, its selector excludes this trigger, and its
own note says *"Defines boundaries only; entails no T1 element."* **A value with no source is the defect whether
or not it happens to be right.**

**Why it matters beyond the one line:** this is the route by which a new trigger token would acquire semantics it
was never given. Measured — an authored transition on a contact trigger would receive `playState=CONTINUE` from
SD-20 and `startsEpisode=true` from SD-14, which are **two of the implications his containment list explicitly
forbids**, arriving silently with a standing decision's name on them. **So his containment is currently
unenforceable for any trigger carried by a transition, today rather than after a change.**

**Reported, not repaired** (returned as a newly exposed gap per his established pattern). The correction looks
small — read the selector where the row is read and decline to apply on a mismatch, using the existing
machine-readable selector grammar rather than a new mechanism. **The decision that is his: the line then becomes
a GAP rather than a different value**, so A01-02's goal kick would hold an unestablished `startsEpisode` instead
of an unsourced `true` — the honest state, but a verdict change in a real goal.

---

## 4 October (close) — COMPLETED_PASS registered, bounded. Qualifying-interaction investigation CLOSED by him.

**312 cases green, EXIT CODE 0 (verified properly, not via `| tail`). A04 authorized, acceptance passed,
render-eligible, coach still reads "12 players in total · 2 teams of 6".**

He accepted every falsification finding and did NOT force the three-part proposal forward. He also accepted my
wording correction and is **reconsidering the Wide Zone qualifying condition himself**, against the Incentive
Assurance criteria, with the added constraint that it be deterministically representable without event history.
**Magnitude held; Wide Zone is now an AUTHORING question with him.**

### What was added — the representational half only
- `COMPLETED_PASS` added to `vocabularies.trigger`; **version bumped to 3** (so a stored result can be known stale).
- `vocabularies.triggerSemantics.COMPLETED_PASS`: **completion is constitutive and is the whole of it** — a pass
  that connects, reaching a player of the passing team. What "qualifying" means is NOT my reading: it is fixed by
  `PCG-05`'s *"counts ATTACKING_TEAM's connected passes"*.
- Denies by name every implication he excluded (region, direction, receiver identity, distance, intent,
  possession, possession change, scoring eligibility, transition, episode boundary); carries the *"no qualifier
  capability is implied"* fence; and records that the representation **names a kind of occurrence and does not
  record occurrences** — not an event history by construction rather than by promise.
- **NOT ordered against FIRST_FORWARD_PASS in either direction, and that is a FACT not a policy:** its own entry
  says it *"implies NOTHING about pass success"*, so an intercepted forward pass is a FIRST_FORWARD_PASS and is
  not a COMPLETED_PASS; a completed square pass is the reverse. The vocabulary is not a hierarchy.
- **No `evaluabilityDependsOn`** — completion is measured against nothing the game holds, so this morning's
  integrity correction imposes nothing on it. Exactly one trigger still declares a dependency.

### Containment — measured, and it is what the tests mainly assert
**Registering the member changed NO verdict anywhere.** Failed-line counts and Gate A verdicts are now **pinned
for all thirteen goals** (A01 8/NOT_EVALUABLE … A04 7/DEFERRED_TO_REALIZATION … TD02 11/FAIL …) so a later change
cannot move them unnoticed. A04 untouched.
**THE FORCED NEGATIVE:** authored the token onto V17 and ran twice — with the vocabulary member the item is
ADMITTED; with the member removed the same item FAILS GA-INFORMATION as an unregistered trigger. So the addition
is exactly and only what such an item needs.

### THE DIRECT CONSEQUENCE RETURNED TO HIM
**V17 is still `NOT_AUTHORED` / "not constrained" in all five goals that select PCG.** The member alone closes
nothing. **I did NOT author the item**, because he wrote *"only the … trigger and its semantics entry"* and an
item on PCG is an **authoring** act on that contract — the same line he drew on Wide Zone. Told him exactly what
it would take (one V17 item, OWNER_RULING, REQUIRED, REQUIRED_RANGE, his 29 Sept words as evidence) and that the
measurement says it closes that line and adds none (8 → 7 failed on A05, no other gate verdict moves); the
competing PCG-12 is ASSUMED/PREFERRED_DEFAULT so it bounds and would not contest it.

### Limit recorded, not repaired
**The token is not structurally reachable** — `constructTriggers` builds the reachable set from a hardcoded
function that never reads `vocabularies.trigger` (A05's set is OUT_END_LINE, OUT_TOUCHLINE, 3× REGION_ENTRY{…},
SCORE, STANDING, START). **GA-EFFECT-TYPED enforces reachability on V12; GA-INFORMATION does NOT on V17**, so an
item authoring the token would be admitted on registration alone and never asked whether the occurrence can
arise. **Pre-existing** — FIRST_FORWARD_PASS has never been reachable either — so a property of the architecture,
not something this introduced. Pinned by a test so it stays visible. Touching it would be the broader trigger
work he has held.

### Still open and still the only thing I would call trust-critical
**The standing-decision selector defect** from the afternoon addendum: `applies()` matches by row only, so SD-14
reaches `A01-02-01.a::T7` (trigger OUT_END_LINE) and SD-20 would supply a play state to any transition. It does
NOT touch COMPLETED_PASS, which no item authors onto a transition — but it is the route by which any
transition-carried trigger silently acquires a play state and an episode boundary.

---

## 4 October (final) — CONTROLLED WIDE ACCESS falsified. Breaks on HIS OWN 2 Oct ruling + spec §7.

Nothing implemented for it (his guardrail). A04 unchanged, 312 green.

### THE PART THAT PASSES — tell him plainly
**His logical form is sound and genuinely different from the touch condition.** "Team T has functional control of
the ball within Region R" is a conjunction of three predicates over **ONE INSTANT**. Tested each of his four:
needs **no** prior touch, **no** completed pass, **no** possession before/after, **no** event history. **The
containment objection that killed the touch condition DOES NOT APPLY.** He removed the two-moment relation and
the removal worked.

### BREAK 1 — his own 2 October ruling, which this wording undoes
`INCENTIVE_ASSURANCE_CRITERIA.md:389-396` records BOTH halves, verbatim:
> *"Controlled" means retained possession, observably. Not deliberate intent. His condition, exactly: A touch
> within the channel after which the touching player's team retains possession.* And: *"I would prefer the
> canonical representation to carry that observable relationship **rather than rely on the qualitative word
> controlled**."*
**Controlled Wide Access relies on exactly that word**, and asks it to be how-agnostic AND after-agnostic — the
opposite of the observable relationship he settled (constitutively a how-claim + an after-claim). **Not a state
restatement of the settled condition; a DIFFERENT concept, and the one he declined.**

### BREAK 2 — spec §7 "Deliberately not held" refuses BOTH relata by name
`game-representation-spec-2026-09-18.md:759-764`, verbatim:
> *"The state of a game in progress: which target is live now, **who has the ball now**."*
> *"The coach's in-play judgement of a `FREE` condition (SD-15)."*
**His candidate asks for precisely those two, conjoined.** §1: *"It describes the rules that govern state, never
the state itself."* MEASURED on the frozen render-eligible A04 game: **no `possession` key at all**, **no
`objects` collection at all — there is no ball in the render-eligible game**, and the teams carry no identity
(his own 2 Oct designation removal). Two of three relata absent BY DESIGN.

### BREAK 3 — GP-006 cannot own a state indifferent to what follows
Canonical definition: *"Create a functional performer–task object relationship that **enables meaningful
subsequent action**."* **Forward-looking by construction**, and a *performer*–object relation (player
representation excluded). GP-005 Gain Access: *"…performer, object, target, pathway, or environmental feature"* —
**a region is not in that list**; reading a channel in as an environmental feature is composing on English
compatibility. Both live at the STRATEGIC layer: `gp-library.rc1.json` carries **no definitions at all** (only
Type/ID/Name/Relationship Domain/Operation/Status); definitions live in the ATM workbook (Stage 3, selection-side).
**Functional Object Control and Access are SEPARATE canonical relationship domains, and possession is separate
again** — so his composition genuinely IS a composition of two concepts, as he suspected.

### THE OWNERSHIP ANSWER, and the one that will interest him most
`target_zone_entered`, RPC library `controlled_vocabulary`, `vocabulary: scoring_event`:
> *"A player dribbles into a marked zone, or receives and controls the ball inside it."*
**That is Controlled Wide Access almost verbatim** — means unrestricted, a region, control — approved by him
13 Sept as one of four valid primary scoring events, and its activity text even excludes traversal (*"a long kick
into the target zone does not count"*), matching his 2 Oct ruling. **BUT it owns the meaning as a SCORING EVENT at
the sport-module layer.** A04's primary event is `line_crossed` and the spec says a modifier *"changes only the
primary event's value, never adds a second way to score."* **So the thing that owns his meaning owns it in the one
role Wide Zone's modifier may not take.**

### HIS OWN CONTRACT FORBIDS THE WORD IN THE NAME
Three of four routes by which an element could co-hold a team AND a region are closed by Wide Zone's own AUTHORED
exclusions: `WIDEZONE-08.a` S4 — **"access (forbidden as a member of functions)"**; `08.b` V14b — wide channel a
forbidden region referent; `08.c` V5 — wide channel a forbidden referent. The candidate is named Controlled Wide
**Access**. **The composition is not merely unauthorized, it is authored against.**

### THE SMALLEST CARRIER, with independent motivation and an honest limit
**One FIELD row: a criterion on the modifier condition.** The primary-event condition has THREE parts (type /
referents / criterion holding "a threshold, a count, or a qualitative term"); the modifier condition has only TWO
(V8a type / V8b referents). **No row holds what counts as MEETING a modifier's condition** — a structural
asymmetry inside one area, with its precedent one area over.
**MEASURED CONTRADICTION that motivates it independently of Wide Zone:** fidelity Q5 reports a violation unless
`modifier.condition.satisfiedBy` is present. That field has **no register row**, is set by **no item**, and its
name is already used twice (the BY_CONSTRUCTION schema-invariant pointer; the existential claim's established
list). **I wrote it in: Q5 CLEARS and `nothingInvented` REJECTS it** as tracing to nothing derived, chosen or
entailed. **A04 today passes acceptance and fails Q5, and the only fix for Q5 breaks acceptance — there is no
state in which both pass.**
**Limit:** the carrier would let the criterion be STATED, not EVALUATED — a qualitative control criterion stays an
in-play judgement, which §7 deliberately does not hold.

### What I put to him
**Should the Wide Zone advantage be a way of SCORING, or a multiplier on a different score?** As a scoring event
the meaning is owned, defined, approved and already excludes traversal. As a modifier condition it needs a state
the spec deliberately does not hold. Structural question, not representational.

### CORRECTION, same day — I OVERSTATED what `target_zone_entered` owns, and had to write to him again

The last leg of the check landed after the email went. It is right and I was wrong on the part I had called the
most interesting, and the part my closing question rested on.

**Four overstatements, all refuted by text I had already quoted or should have checked:**
1. **"means unrestricted" — FALSE. It ENUMERATES TWO MEANS.** *"A player **dribbles into** a marked zone, **or
   receives and controls** the ball inside it."* So it **privileges a dribble and a reception — two items on his
   own non-claims list** — and excludes cases his meaning admits (a loose ball won inside the zone, a deflection,
   the ball already being there).
2. **"owns control" — FALSE. "controls" is only in the SECOND DISJUNCT.** "Dribbles into a marked zone" carries no
   control requirement, so the event does not uniformly require control — the one term his meaning is built on.
3. **The corpus had ALREADY GRADED the ceiling.** `RPC-001-08.c` (J2, EXISTS, AUTHORED) cites this exact
   vocabulary family as its basisEvidence and its fitNote caps it: **"Only 'a reference is present' can be
   held."** Not control, not means, not a team.
4. **I CITED GENERATED COACH TEXT AS EVIDENCE.** My "its activity text even excludes traversal — 'a long kick into
   the target zone does not count'" came from generated activity prose. `RPC-001-10.b`'s fitNote closes that route
   pre-emptively: **"The COACH_RULES wording 'controls it' is engine-only and is not relied on."** **Generation is
   not a source — a discipline already in memory, violated anyway.**

**So `target_zone_entered` is ADJACENT PRECEDENT, not ownership — the clearest trap in the set, because its
English reads like his sentence while its semantics do something else.** Its subject is a PLAYER; "a marked zone"
is physical marking not a represented region; and the representation consumes it only as V1 primaryEvent.kind.

**Consequence: my closing question was MIS-POSED.** I asked whether the advantage should be a way of scoring or a
multiplier, presenting the scoring-event route as "owned, defined, approved". **It is not owned**, and choosing it
would adopt a definition privileging two means from his forbidden list.
**The finding underneath HARDENS: there is no owner anywhere for a means-unrestricted, how-agnostic control
state** — not at the strategic layer (GP-006 forward-looking), not in the Game Representation (§7 refuses both
relata), not in the sport module (two enumerated means, conditional control).

Everything else in the falsification stands and was re-checked: the logical form passes; the three breaks; Wide
Zone's authored exclusions; the Q5/nothingInvented contradiction; the criterion-field carrier and its limit; A04.

**Process lesson, twice in one day: do not send a report while a background trace is still running.** The
afternoon addendum had the same cause.

---

## 4 October (close of day) — selector repair + PCG trigger item authored. 321 green, EXIT 0.

### The trust-critical repair (he classified it so)
`applies()` matched a standing decision to a line by **ROW ONLY** and never read `entry.item.selector`. Now it
reads it, via the **canonical matcher the applicability rule already uses** — `selectorApplies` **MOVED from
engine.ts to selector.ts** (where selector semantics belong) rather than duplicated, because this codebase has
already paid for two count readers that disagreed. engine.ts and derive.ts both already imported selector.ts, so
no cycle.
- **The one judgement inside the repair, made visible: UNDECIDABLE DECLINES.** Where the element's selector does
  not fix the attribute, the decision does not apply. **The applicability rule makes the OPPOSITE choice on the
  same question and both are right** — an applicability rule may only ever REMOVE a line it can positively
  disqualify (so undecidable keeps it), whereas a standing decision SUPPLIES a value, and supplying one through
  an unreadable narrowing is inferring the narrowing away. Documented on `selectorApplies` for both callers.
- **Measured: exactly ONE application removed** across 13 goals × every practice situation. `GF2-07.a::T7` and
  `GF4 I06::T7` (both POSSESSION_CHANGE) still apply; `A01-02-01.a::T7` (OUT_END_LINE) removed. That line is now
  `failed / NOT_AUTHORED` — the verdict change I flagged when reporting the defect. **A04 untouched.**

### His falsification, implemented BOTH directions
- Corpus case (goal kick): episode boundary absent, and **no standing decision recorded against the line**, so
  nothing downstream can read it as a source.
- **Synthetic case for both properties**, because the corpus goal kick has an AUTHORED play state and cannot test
  that half alone: a transition on OUT_TOUCHLINE gets **no episode boundary and no SD on either line**, while the
  play state that IS present comes from the authored `GF2-16.b`. **So the test asserts PROVENANCE, not absence** —
  the repair removes SD propagation and leaves authored knowledge alone. (My first version asserted absence and
  failed; the expectation was wrong, not the code.)
- Control: the same transition on POSSESSION_CHANGE still receives BOTH. Not a blanket refusal.

### AN EXISTING TEST WAS PASSING FOR THE WRONG REASON — clearest evidence the defect was load-bearing
`derivation-stage10.unit.ts` SD-94 "fail when the same trigger is required to be two different things": its
expected FAIL rested on **SD-20 supplying CONTINUE to a START transition** — a trigger SD-20 does not name. With
the repair the value vanished and the check could no longer see a conflict. **Fixture corrected so the conflict is
AUTHORED ON BOTH SIDES** (each class gets a distinguishing qualifier and its own T6 item); the invariant is still
tested and no longer depends on the defect. What it used to rest on is recorded in the file.

### The authored PCG item (C39)
`PCG-14.f`, row V17, `COMPLETED_PASS`, basis OWNER_RULING, REQUIRED, REQUIRED_RANGE, 29 Sept ruling as evidence,
added via the restatements `added` array after PCG-14.a. **Resolves in all five goals that select PCG**, closing
one failed line each (A01 8→7, TA01/A02/TA02 7→6, A05 8→7). A04 unchanged at 7.
- **Displaces nothing**: PCG-12 is ASSUMED/PREFERRED_DEFAULT so it bounds and never entails, and its own evidence
  already conceded *"a reveal on each completed pass, which is not a listed trigger"*. Left exactly as it stands.
- **"Qualifying" is not my reading** — fixed by PCG-05's *"counts ATTACKING_TEAM's connected passes"*, so the
  trigger is a pass that CONNECTS and nothing further.
- **THE SEQUENCE IS PINNED: the vocabulary member closed NOTHING; the line closed only on the authoring act.** A
  vocabulary member makes a value SAYABLE, it does not say it. The member's inertness is now proved by REMOVING it
  rather than by a current-state baseline — better evidence, and it survived the baselines moving.
- Reachability limit recorded on the item and pinned by a test, not repaired, per his instruction.

### Two self-inflicted stumbles worth remembering
1. **The sport-coupling ratchet caught my own doc comment** — I wrote "in football" in the sport-NEUTRAL
   derivation layer, taking occurrences 35→36. Reworded (not ratchet-raised, not SPORT_LAYER_FILES'd). **The
   derivation layer is sport-neutral including in its prose.**
2. **A `python - <<EOF` heredoc hung on stdin** (python is absent here) and had to be killed. Use the Edit tool.

Corpus after both: 131 lines, 17 open, 39 restated, 14 added, none named-but-missing.

---

## 4 October — Successful Region Access: ownership falsification. READ-ONLY round, nothing implemented.

He revised the meaning to *"value access to a represented region when the attacking possession survives the
access"*, **withdrew the single-instant requirement** ("that was allowing representational simplicity to alter
the football meaning"), added the guardrail **"no temporal relationship without canonical authority"**, and
asked for nine return items with "Do not implement or add a carrier."

### THE HEADLINE IS A FOOTBALL DECISION, NOT A REPRESENTATIONAL ONE
**The rewording silently reverses his own 2 October traversal ruling.** A ball crossing the channel and
collected by a teammate beyond it now satisfies the meaning (access occurred, possession survived) and was
excluded on 2 October (nothing touched it inside). Reported as the first item, before any ownership analysis,
because everything else is downstream of it.

### Verdict: survives as football, breaks on representation — and best-founded candidate so far
**The good part is real.** His authored source sentence is *"**Actions** starting in or moving through the wide
channel earn an advantage"* — subject is "Actions", so none of his five means needs any broadening. And
`REGION_ENTRY` is genuinely means-neutral, **verified not assumed**: no `triggerSemantics` entry at all,
constructed purely from region classes, both parsers of its parameterised form discard the argument.

### What is owned, what is not
- **Owned outright**: the region; the value effect; a region-parameterised occurrence kind as a constructed value.
- **`REGION_ENTRY` is ADJACENT PRECEDENT, not ownership** — `WIDEZONE-11.b` already records it holds *"moves
  through"* only, so of his five means a **recovery of a ball already inside** is uncovered. An authored item had
  already graded the token against a proper subset. (An agent line claimed outright ownership; wrong.)
- **The team conjunct is VACUOUS, not merely unowned.** `ATTACKING_TEAM` is glossed as *"the team the possession
  relation currently holds"*, so "while the attacking team possesses" is true at EVERY access by construction.
  And the value modifier has no team field — the beneficiary field was deliberately removed.
- **Non-occurrence is owned by nothing and cannot be.** Selector operators are `[=, IN, CONTAINS, AND, *]` — no
  negation — and `NOT_EXISTS`/`EXCLUSION` range over what the game CONTAINS, never over what HAPPENS. Probed
  three ways on the live game.

### THE SUCCESS HALF IS BLOCKED THREE WAYS AND THE FIRST IS HIS OWN AUTHORING
1. **`GF4 I07`** (T1c, AUTHORED, EXCLUSION): *"any region qualifier (forbidden: the transition moment is not tied
   to a region)"*. So "took over **through that access**" cannot be a region-qualified possession change. **No
   resolution-timing decision clears this** — it is authored against.
2. **`T2 awardedTo`** applies only when play STOPS; every authored possession change CONTINUEs. "The defending
   team takes over" has no field.
3. `POSSESSION_CHANGE` is **not structurally reachable in any of the 13 goals.**

### THE ELEGANT CANDIDATE IS CIRCULAR — and an agent missed it
"Access and attack in the same episode" looked free (the boundary would be the possession change itself, which
he said not to invent). **It is circular: the end of the episode IS that possession change**, so the predicate is
vacuously true of every access and his case B gets the bonus. The score-anchored variant fails differently —
**PS1's own note says SCORE begins an episode under SD-14**, so access-then-goal falls outside "the same
episode" and scoring would VOID the bonus. Only repair is "a required subsequent action" = one of his non-claims.

### Inherently temporal: YES, and the single-instant reading is VACUOUS not merely wrong
Possession moves only at a possession change, so at the instant the ball crosses, possession is still the
attacker's in **both** his cases. They are indistinguishable at a single instant. His own wording carried the
temporality throughout ("survives the access", "through that attempted access", 2 Oct's "after which") — the
revision removed player grain, control judgement and remain-in-region, **not** the time relation.
**Canonical authority for A temporal relation exists** (the 29 Sept pass-reveal ruling: point-succession of one
reveal on one named trigger). **For THIS relation it exists nowhere.**

### Smallest gap — better located than the field he declined
**A modifier condition can NAME an occurrence but cannot RELATE two.** V8b's valueType is already *"references to
regions, objects **or events**"* and `V8a.conditionType` already contains `event`, so the slot exists. `GF4 I15`
authors an event-typed condition with *"{regain, shot}, in the order regain then shot"* — but it is
SUPPORTING/TYPICAL_EXAMPLE and **its own structuralClause says "The order ... is not held."** Precedent for
naming, explicitly not for relating. Then second: nothing can say two occurrences share an episode (episode is a
boolean on a transition; SD-14 *"defines boundaries only; entails no T1 element"*).

### Exclusions: NO conflict, and an agent got this wrong too
`WIDEZONE-08.a` forbids `access` as a region **FUNCTION** — its own fitNote: *"Restricted, exclusive or
entry-prohibited zone"*. That is access **control**, the opposite concept. Evidence: *"Channels are reference
markers — players can choose to use them or not."* The other two forbid the channel as a referent on the
consequence row and the primary-event condition row; the advantage lives on the value modifier, where his 2
October ruling put it. **The meaning belongs where it already is; what is missing is a ROW, not a permission.**

### Still open / carried
- **The fidelity-vs-invention contradiction is unchanged and I proposed repairing the CHECK, not adding the
  field** — the finding is true (a coach cannot tell what satisfies the condition); only its sole clearing
  condition is unauthorable. Needs no authoring decision from him. Held pending his answer.
- **NEW DEFECT, probed not reasoned** (`back/_probe_reach.ts`, deleted after use): A04's game has **exactly one
  transition** and it is keyed on `POSSESSION_CHANGE`, which is **NOT in its reachable set** — because
  `constructTriggers` pushes it only when `O1` ball classes exist and **A04 has `O1` classes: 0** (the
  already-known "there is no ball in the render-eligible game"). Measured: reachable =
  `[OUT_END_LINE, OUT_TOUCHLINE, REGION_ENTRY{GF2-03.a}, REGION_ENTRY{WIDEZONE-02.a}, REGION_ENTRY{WIDEZONE-03},
  SCORE, STANDING, START]`; `gateA = DEFERRED_TO_REALIZATION`, `failingChecks: none`, `mayRealize: true`; and
  post-realization Gate A passes (10-01). **So the only transition in the authorized game cannot fire.**
  The reachable set has **exactly two readers** and they do OPPOSITE things with it: `gates.ts:1276` raises
  `trigger X is not structurally reachable` for a **consequence**; `gates.ts:1550` `continue`s to EXCUSE an
  objective-set persistence demand (SD-44: "A trigger the game cannot reach places no demand on the
  assignment"). **A transition's own trigger is read by neither.** Reported, not repaired.

### THE PATTERN IS NOW FIVE
`fillableFrom`, `triggerQualifiers`, `condition.satisfiedBy`, the standing-decision selectors (repaired this
morning), `BUILD_OUT_EPISODE` scope — all in the register or grammar, **none read by any code**. Four items carry
the episode scope and `scope` has behaviour for exactly one value, which is not that one. **"It already exists in
the grammar" is weak evidence of ownership in this codebase.**

### Method note
Ran as a workflow, then re-verified every load-bearing claim against the corpus myself. **Three agent
conclusions changed under checking** (REGION_ENTRY ownership, the same-episode reading, the 08.a "conflict").
Consistent with the standing rule: never take agent findings at face value.

---

## 5 October — fidelity/invention repair IMPLEMENTED; A04 reachability INVESTIGATED, nothing implemented. 321 green, EXIT 0.

He settled the football decisions (traversal-with-retention now QUALIFIES — he deliberately reversed 2 Oct;
"starting in" may qualify; REGION_ENTRY stays adjacent precedent; possession-survival accepted as inherently
temporal), **parked the representation expansion** (no event-referent identity, no same-episode relation, no
`criterion` field, no carrier), and directed two bounded jobs.

### JOB 1 — the fidelity/invention contradiction: REPAIRED
`fidelity.ts` raised a Q5 VIOLATION unless `modifier.condition.satisfiedBy` was defined. **Verified the premise
rather than trusting the earlier summary: NO register row is named `satisfiedBy`** (enumerated all 90), and the
value-modifier rows are exactly V7/V8a/V8b/V9/V9a/V10 — type, referents, magnitude, operation, combination, **no
criterion**. So the only state clearing fidelity was one `nothingInvented` must reject.
- **The fix is a severity + basis change, not new machinery.** The finding is kept, unconditional, as a **NOTE**
  on the SAME ground the missing `outfieldCount` is already a NOTE in that function: *the rendering is faithful*
  — it refuses to choose ball/player/touch — and the gap is in the GAME. `passed` is a claim about the
  RENDERING. The note now states that it cannot be closed by authoring.
- **His "confirm afterward" is MEASURED**: nothingInvented / nothingLost / nothingClosedWithoutAuthority all
  clean AND `fidelity.passed === true` on the same A04 state. Injecting `condition.satisfiedBy` changes **no Q5
  finding and not the verdict** — pinned by a test, so reintroducing the dependency FAILS rather than passing.
- **Consequence reported to him: fidelity flips FAILED -> PASSED for A04.** Q5 can still fail (the
  unmarked-region path), so the check is not now incapable of failing.
- **A STALE ASSERTION MESSAGE found en route:** `assert.equal(report.passed, false, 'a game whose features do
  nothing is not a runnable activity')` — the features DO something now (all three channels participate), so that
  assertion had been passing for a reason that stopped being true. Same class as the four stale fitNotes.

### JOB 2 — A04 transition reachability: INVESTIGATED, NOT REPAIRED, deliberately
**THE ROOT IS A STALE RUN CONVENTION, not a missing check.** `RC-19` ("The T1 elements for START,
POSSESSION_CHANGE, OUT_TOUCHLINE and OUT_END_LINE exist by construction") is dated **18 September** and the
conformance doc defines an RC as *"a rule that goes beyond the specification's text"* — **ours, not his**. His
**SD-44 ruling of 22 September** superseded it with the opposite content (*"the resolved structural prerequisites
necessary for that trigger to occur"*). **Nothing updated RC-19**, and register row T1 **and `GF2-07.a`'s
structuralClause** both still cite it: *"a T1 element with trigger POSSESSION_CHANGE exists (by construction,
RC-19)"*. **That is why nobody authored the ball AND nobody wrote the check.**
- RC-19 vs the SD-44 operationalisation **conflicts on four triggers**: POSSESSION_CHANGE, OUT_END_LINE,
  OUT_TOUCHLINE (RC-19 unconditional, package conditional) and STANDING (RC-19 conditional, package
  unconditional). `RC-19` appears in **NO source file**.
- Honest qualification: the ball precondition is **OUR** operationalisation in the design package ("and a ball
  object"), not his words. PS1's registered valueType supports it — *"the team that currently possesses the ball"*.

**Q1 ownership — NO, positively rather than by silence.** A04 contracts only GF2 + Wide Zone. GF2's only object
items (GF2-06.a/.b) are **basis ASSUMED** (bounds only — `derive.ts`: *"§3: a bound only; SD-83: never
establishes an element"*) and describe **a line/zone target, not a ball**. Wide Zone has **zero** object items.
Both **positively declare O1 NON_CLAIMED** ("number of balls unauthored" / "objects free"). **No restatement or
ruling adds one** (41 restatements touch no O row; the 14 added items land on none). RPC-001 and A01-02 DO entail
a ball ("none (at least one ball)", AUTHORED/REQUIRED) — **A04 selects neither**.
- **NOT a defect, by design:** no `objects[].owner` row — PS1 is the authorized home, *"not a field on the ball"*.
  I nearly reported this as a loss; it is consistent with the register.

**Q1b NOT a projection loss — the first time the answer is "nowhere".** MEASURED by flipping GF2-06.a/.b
ASSUMED->AUTHORED in memory: an O1 class forms, an `objects` key appears, the object reaches the concrete game
intact. **And fixing the basis alone would NOT help** — only also widening its kind to `ball` made
POSSESSION_CHANGE reachable. **Two things missing, not one.**

**Q2 failure path.** **The register declares NO ROW for a transition's trigger** — it is a selectorAttribute of
the T1 COLLECTION. `resolved-game.ts`: *"`selector` is identity, not a derived value ... the acceptance
conditions treat it the same way."* So: no line, no verdict, absent from derived AND notEstablished; the three
acceptance conditions can't see it (two are line-keyed, the third skips `selector` by name); the two
reachable-set readers are scoped to consequences and objective-set persistence. **And `GA-TRIGGER-UNIQUE`
returns TWO PASSES when `transitions.length < 2`, with `triggerOf` defined AFTER the early return** — A04 has
one transition, so the only code that reads a transition's trigger never runs. `constructTriggers` and
`enumerateLines` are called on **consecutive lines** and never compared.

**Q4 FALSIFICATION — IT REFUTED MY OWN MEASUREMENT.** My first sweep concluded **no control case existed**
anywhere. **WRONG, and an adversarial verifier caught it: I measured every goal with `selectFor(goal, null)` —
no practice situation — then stated a universal.** Corrected matrix over **33 goal x situation cases**: 18 carry
an unreachable-trigger transition, **1 CONTROL — `A01 + A01-02` ("From Goal Kicks"), where A01-02-08.a's
authored ball enters, POSSESSION_CHANGE becomes REACHABLE and BOTH transitions are legitimate**, 14 have no
transition. **A04 offers no practice situations at all.**
- So the repair IS validatable — but it fails 18/33 including A04, **costing A04 its render-eligibility**, a
  status change to a frozen artifact. **And the direction is not mine: if RC-19 stands, the correct repair is the
  OPPOSITE** (make POSSESSION_CHANGE unconditional). Mutually exclusive; his knowledge decision. **So: nothing
  implemented, both repairs specified and ready.**

**Q5 blast radius (no situation):** 8 of 13 goals carry the defect — A01, TA01, A02, TA02, TD02, D03, A04, A05 —
from **two** game forms (`GF2-07.a` x6, `c:blind:GF4:I06` x2), so a one-row repair leaves the other standing. No
gate names the trigger in any of them. **Adding or removing the object changes NO gate verdict in any state
measured, including the reachable one** — the enforcement gap, measured.

### Governance note recorded, not repaired
Registration is evidence a concept is **sayable**, not that its semantics are **implemented or enforced**.
Ownership checks now separate semantic registration from runtime consumption. **RC-19 makes SIX — and the first
where the unconsumed thing is an INVARIANT rather than a field.** No work opened on the five as a group.

### CORRECTIONS sent an hour after the 5 Oct report — and the cause was sending with a leg outstanding
**I sent while one verification leg was still running. I flagged it, which is not the same as waiting, and that
leg produced two of these three.** The rule is the simpler one: don't send until it finishes.

1. **WITHDREW the GA-TRIGGER-UNIQUE early-return bullet as a CAUSE.** Both facts are true (it returns early at
   `transitions.length < 2`; `triggerOf` is defined after it) but the implication is false and dangerous: it reads
   as "remove the guard and the check works." **`triggerOf`'s value is used at `gates.ts:885` ONLY to compare one
   T1 class's trigger to ANOTHER'S, and `gaTriggerUnique` never reads `ctx.triggers` at all** (verified by awk over
   861-935). With two transitions the guard would not fire, the code would run, and reachability would STILL not be
   tested. **The structural cause stands: no FIELD row for `transitions[].trigger`.**
2. **CORRECTED "the object carries into the concrete game".** I had only measured to the RESOLVED game. Measured
   through realization: basis->AUTHORED => **REFUSED**, *"is open and was not chosen: a concrete game leaves no
   freedom unclosed"* — **two new FREE choices open (`::O2` kind, `::O5` position.across); with the selector fixed
   to `kind = ball` ONE still opens (`::O5`)**. The refusal is CORRECT, not a loss, so the conclusion (authoring
   gap, not projection loss) is unchanged and better supported. **And it quantifies his "do not simply add a ball":
   authoring one opens a realization choice the frozen choice set does not answer.**
3. **NEW BOUNDED DEFECT, reported not repaired.** `GA-TRIGGER-UNIQUE`'s first clause's unit is **PAIRS** — the
   normal path correctly reports `comparedPairs` — but **the early-return path reports `transitions.length`**. With
   exactly one transition that is 1, and `pass()` maps `instances > 0` to basis `EVALUATED`, so **the clause
   declares `EVALUATED, instances: 1` having compared NOTHING.** Correct by accident at 0 transitions; **wrong at
   exactly 1 — i.e. in all eight affected goals.** And the gate report's `clausesVacuous` tally
   (`gates.ts:1799`) exists to count exactly this — **reporting the wrong unit is what keeps the clause out of
   it.** One-argument fix; the precedent is fifteen lines below. Left for him: it changes gate evidence for eight
   goals on a frozen surface.

**Agent scorecard, final: 28 agents, 19 load-bearing claims verified adversarially, 8 REFUTED — and one refutation
was of MY OWN measurement (the "no control case" universal).** The verification stage paid for itself twice.

---

## 5 October (later) — his three rulings: RC-19 corrected + reachability ENFORCED, evidence defect repaired, placement question answered

### 1 · RC-19 / SD-44 — authority corrected AND enforcement added (both authorized)
He ruled: **SD-44 supersedes RC-19 wherever they conflict**; a trigger is reachable only when the resolved game
contains the structural prerequisites; **possession is a relationship involving the ball**, so POSSESSION_CHANGE
is not reachable without one. Not to be scoped to GF2-07.a or A04.
- **`derivation-rules-2026-09-18.md`**: RC-19 rewritten — records that it was wrong and cited as authority for
  four months, quotes SD-44 as governing, carries the per-trigger prerequisite table with his ball ruling, and
  names `GA-TRIGGER-REACHABLE` as the enforcement.
- **`register-2026-09-18.json` row T1**: the valueType's stale "Reachable triggers exist by construction (RC-19)"
  replaced. Safe: `valueType` is read by exactly one regex (`engine.ts:455`, `/one property per (member|referent|
  trigger)/i`) which T1 does not match.
- **`GF2-07.a` NOT touched.** Its structuralClause still discharges onto RC-19, which no longer supports it —
  that is *why* A04 fails, and he wants the failure visible. Editing it would be an authoring act.
- **NEW CHECK `GA-TRIGGER-REACHABLE`** (Gate A is now **16** checks; the inventory test updated 15→16).
  **Why its own check and not a clause:** `failingChecks` is a list of checkIds, so only a named check makes the
  failure legible — folded into GA-TRANSITION-COHERENCE it would never name the trigger.
  **It reads no cell** — a transition's trigger has no FIELD row, so it reads the class's own selector. It is the
  only Gate A check that does, and that is why nothing caught this.
- **Measured:** A04 FAIL (gateA FAIL, mayRealize NO, **GA-TRIGGER-REACHABLE its ONLY failing check**); A01-no-
  situation, A05 FAIL on GF2; **D03, TD02 FAIL on GF4's `c:blind:GF4:I06`** (so it is general across game forms);
  **control A01+A01-02 PASS with 2 instances** and still fails only GA-NO-FAILED-LINE as before; D01 passes
  vacuously. **A04 is no longer render-eligible; the frozen fixture is untouched as an artifact.**
- **Divergence RECORDED not repaired** (written into RC-19's text so it cannot be rediscovered): the engine's
  team-side test wants **>= 1** P1 class where the prerequisite says *opposing* teams. No corpus case turns on it.

### 2 · GA-TRIGGER-UNIQUE evidence defect — repaired (authorized)
The early return is **deleted**: with <2 transitions the pair loops do not run, `comparedPairs` stays 0, and the
compatibility clause reports `PASS / NO_APPLICABLE_INSTANCES / 0` where it read `EVALUATED / 1`. Now counted in
`clausesVacuous`.
- **It was ALSO hiding a real failure:** `collided` is per transition LINE, not per pair, so it is well defined
  for one transition — and the early return PASSed it **without computing it**. Latent (no corpus case has an
  UNRESOLVED transition line); a regression case forces one and it now FAILS.
- **His correction preserved in code AND test:** on an unreachable-trigger fixture GA-TRIGGER-UNIQUE PASSES while
  GA-TRIGGER-REACHABLE FAILS, and GA-TRIGGER-UNIQUE's output must never mention reachability.
- New file `back/src/system/derivation/trigger-reachability.unit.ts`, **13 cases**, registered in package.json.
- **My own fixture was wrong first and the test caught it:** P1's only selector attribute is `team`, not
  `designation`. A selector naming an unregistered attribute **forms no class and raises nothing** — silent.

### 3 · Object existence vs fixed placement — ANSWER: (b) AN INVARIANT WRONGLY PREVENTS IT
Investigated only; nothing altered, no position authored.
- **CORRECTED by a verifier, and the corrected version is stronger.** I first called this "already authored".
  It is not: `UNDECLARED` means **nobody looked** (`resolved-game.ts:59-62`), and the vocabulary has a separate
  code for deliberate non-constraint — `NON_CLAIMED` — which the SAME two rows use for other object kinds. So
  `A01-02` row O4/O5 `UNDECLARED` on `kind=ball`, note *"The ball's layout position was never examined. Its
  position at the restart moved to T4 (07.a)"*, is an ACKNOWLEDGED GAP with a pointer at
  `transitions[].placement.region`, not an authored claim that placement does not apply.
- **And that makes it worse: AM-04 is exactly this case.** `derive.ts:521` — his ruling, *"Unexamined silence
  cannot license a free choice. An `UNDECLARED` declaration reaching the row bars openness."* **It does not bar
  it here, because `outerBound` satisfies the very authority test AM-04's veto consults.** His rule is right,
  implemented, and these two rows are routed past it.
- **Two rules override it:** (1) enumeration creates both position lines for every individuated object because
  the register's `applicability` block has **no O-row entry**; (2) `derive.ts:588-590` —
  `authorityReaches = record.bounding.length > 0 || index.outerBound.has(row)` — so a row's own
  `outerBound: SESSION_ENVELOPE` **defeats the silence veto**. Then `realize.ts:407-409` refuses any unclosed
  open choice with **no exemptions of any kind**.
- **THE DECISIVE CONTRAST IS ONE KEY WIDE:** only S5, S6, O4, O5 carry `outerBound`. **O3 (count) carries none**,
  so under *identical* silence the same ball's count lands `NOT_AUTHORED` (honest gap) while its position is
  forced into a choice.
- **The compelled choice is not even checked:** bounds `[]`, permitted `null` -> `checkBound` returns
  `UNBOUNDED`. It compels an uncheckable invention rather than protecting a constraint.
- **COUNTERFACTUAL PROVEN, register data only, NO code change:** adding `applicability.O4/.O5` conditioned on
  `selectorAttribute: kind` (the shape T1a already uses in production) makes a ball's position lines
  **WITHDRAWN**, removes them from `resolved.open`, leaves them **out of `notEstablished` too**, keeps the ball
  fully present as `{kind:"ball"}`, and **the position refusals disappear**. `RC-20` appears in **no source
  file** — the block is generic data.
- **HAZARD reported before he authorizes:** where `kind` is NOT fixed by the selector the line goes
  **CONDITIONAL**, and a conditional line appears in **none** of the three lists — it would vanish silently. Two
  corpus objects use an open selector.

### 4 · Governance point recorded — and there is nowhere to file it yet
"Presence in the grammar/register establishes that a concept is expressible; it does not establish that its
semantics are consumed or enforced at runtime." **There is no Change Assurance artifact**:
`INCENTIVE_ASSURANCE_CRITERIA.md` states it is "not the Change Assurance System — no tooling, no automation, no
gate", so filing it there would bury it. Standing item here instead. **RC-19 makes six, and is the first where
the unconsumed thing is an INVARIANT rather than a field.**

### Two more corrections from the verification stage, caught BEFORE sending this time
- **"Individuation FORCES O4/O5 open" is false, and my own earlier probe already showed it.** When GF2-06.a/.b
  is flipped to AUTHORED, the resulting O1 class's **O4 comes back `RESOLVED:ENTAILED`** from GF2-06.b
  (*"attacking end, as GF2-04..."*) and only `::O2` and `::O5` refuse. I had that refusal list in hand and
  missed its significance. **So the invariant is NOT blanket: where a position is authored the line is DERIVED,
  never a choice. It bites precisely on an object whose location nobody authored because it is state-dependent
  — a ball.** The invariant singles out the dynamic case.
- **"RC-20 is not special-cased anywhere" was a vacuous grep.** The string appears in no source file, but
  `gaTransitionCoherence` (`gates.ts:1045-1084`) hardcodes T6/T3/T4/T5 with the literals CONTINUE and
  STOP_RESUME without reading `applicability`. **What IS generic is the LINE-STATE machinery** (`engine.ts:276-287`,
  `classify.ts:253` — both name no row id), which is the half the counterfactual exercised. Practical
  consequence for him: an entry on O4/O5 would withdraw the lines correctly, and **no gate would then assert
  anything about object placement** — right outcome, but a decision rather than a surprise.
- **Also fixed a test that failed for the RIGHT reason:** `unreadable-cardinality.unit.ts` asserted
  `realizationAuthorized === true` for A04 as its proxy for "the cardinality work is bounded". A04 now fails
  GA-TRIGGER-REACHABLE by design. Rewritten to keep its real subject (readable counts, numeric shortfalls) and
  to assert `failingChecks === ['GA-TRIGGER-REACHABLE']` — **stronger than the old blanket assertion**, because a
  future cardinality regression would grow that list and still be caught. `resolvedFor` now also returns
  `result` (additive) so a test can say WHICH check withholds authorization.

**Verification scorecard for this round: 18 agents, 15 load-bearing claims checked adversarially, 5 REFUTED —
and I waited for all of them before sending.** The two prior rounds each cost a correction email for not waiting.

### A SECOND knock-on test, and the reason the first run hid it
`completed-pass.unit.ts` pins `{failed, gateA}` for all 13 goals. **Six Gate A verdicts legitimately moved**
(A01, TA01, A02, TA02, A05 from NOT_EVALUABLE; **A04 from DEFERRED_TO_REALIZATION**); TD02/D03 were already FAIL
and gained a second failing check. **NOT ONE `failed` LINE COUNT MOVED** — the new check adds a failed *clause*,
never a failed *line*, which is the containment fact worth having.
- Baselines updated **with both reasons recorded in the comment**, and the test **strengthened**: it now also
  pins `GA-TRIGGER-REACHABLE`'s own verdict per goal, so a future change that fails these goals for a different
  reason cannot hide behind a verdict that already reads FAIL.
- **WHY THE FIRST RUN DID NOT SHOW IT: `npm test` chains with `&&`, so it HALTS at the first failing file.**
  The cardinality failure stopped the run before completed-pass, and before every realization and rendering file.
  **A green-after-one-fix assumption is unsafe here — re-run the whole suite after each fix, and expect serial
  discoveries.**
- Pre-checked the files that had not yet run rather than waiting for a third round: `realize()` **does not
  consult `realizationAuthorized`** (grep: zero hits), so the A04 realization tests still execute. **That is also
  a limit worth knowing — A04's Gate A failure is reported and the pipeline script honours it, but realization
  is not barred from running if called directly.** Reported to him; pre-existing, not changed.
- Also confirmed the corpus-level Gate A test is unaffected: the conformance corpus includes A01-02's AUTHORED
  ball, so POSSESSION_CHANGE is reachable there and its failing-check list stays `['GA-INFORMATION',
  'GA-NO-FAILED-LINE']`.

### THE BIG CONSEQUENCE: enforcing reachability leaves ZERO authorized goals, and the two rulings are COUPLED
**Measured: 0 of 13 goals realization-authorized, with and without a practice situation.** A04 was the only one.
`preRealization` is now FAIL for A01/TA01/A02/TA02/TD02/D03/A04/A05 and NOT_EVALUABLE for the five with no
transition. A01+A01-02 still fails on GA-NO-FAILED-LINE + 3 unresolved T3/T4/T5 lines.
- **`realize()` ENFORCES it — I had this wrong for an hour.** I grepped `realizationAuthorized` in realize.ts,
  got zero hits, and nearly told him realization was unguarded. **The guard is `realize.ts:367`
  `if (!resolved.coherence.mayRealize)`** — a different field name. **Same token-search failure a verifier had
  caught me on earlier the same day.** Caught only because a test failed.
- **BLAST RADIUS ON TESTS: identity 15 of 16 lose their subject; post-realization THROWS AT MODULE LOAD** (its
  checks are bare top-level blocks, not registered tests, so `chain()` throwing kills the file);
  realize.unit.ts's acceptance test cannot run. collection-population and rendering unaffected (the latter reads
  the frozen fixture).
- **THE COUPLING, and it is the finding worth keeping: restoring those tests needs a ball, and a ball today
  FORCES an invented layout position** — the very value his placement question asks about and told me not to
  author. **So Job 1's consequence is blocked on Job 2's ruling.** His placement ruling unblocks it directly.
- **DID NOT CHOOSE FOR HIM.** Added a `Suspended` sentinel (identity) and a whole-file suspension guard
  (post-realization, since bare blocks give no per-check hook), plus a `suspended()` reporter in realize.unit.ts.
  **Bodies retained, nothing deleted, nothing rewritten around the gap, no ball or position invented anywhere.**
  Every run prints the suspension with the blocking decision named. Suite green with suspensions visible.

---

## 5 October (later still) — his DYNAMIC-OBJECT ruling, sequenced. Hazard closed, applicability applied, opposing teams aligned.

**HIS SEMANTIC RULING, recorded verbatim because everything below implements it:**
> *A dynamic game object may exist without a fixed layout position when its location is state-dependent. A fixed
> layout position is required only when authoritative knowledge establishes one as part of the game setup.
> Placement associated with a restart or transition belongs to the existing transition-placement mechanism rather
> than the object's static layout position.* For soccer, the ball is the immediate case.

**Timing constraint now in force: ~3 weeks of soccer season, go/no-go wanted within 7 days, target is a
Christian-only BOUNDED live pilot, not library coverage. Prioritize systemic pilot blockers over cleanup.**

### 1 · THE CONDITIONAL-VISIBILITY HAZARD — closed first, as he sequenced it
**And the register had ALREADY PROMISED this would not happen.** `applicability.selectorGrammar`: *"Where the
selector does not fix the attribute the condition is UNDECIDABLE and the line is KEPT, so an applicability rule
can never hide a real gap."* The line WAS kept — and `resolved-game.ts` then dropped every CONDITIONAL entry from
all three lists. **Seventh registered-but-unenforced construct, and the first where the register itself stated the
guarantee.**
- **I had to correct my own earlier report:** post-classification there are **ZERO** surviving CONDITIONAL lines
  in the corpus or any goal. Every stage-2 CONDITIONAL resolves to ENUMERATED or WITHDRAWN. The 22 silent lines
  are all WITHDRAWN, which is legitimate. So the hazard was **latent**, not live — I had implied otherwise.
- **But it fires on the very change he authorized.** `selectorApplies` returns `null` when a selector STRADDLES
  the applicability list ("identity does not decide it"). GF4's `I02` is `kind ∈ {goal, target}`; against a list
  naming `goal` and not `target` it straddles → CONDITIONAL → silent. Measured: silent lines 22 → 28.
- **Fix: `resolved-game.ts` reports CONDITIONAL into `notEstablished`** with reason *"applicability unresolved"*,
  distinguishing it from WITHDRAWN (condition FALSE, nothing owed, stays silent). **That closes the closure half
  for free**, because `nothingClosedWithoutAuthority` ranges over `notEstablished` — so a concrete game that
  fills a conditional line is now refused.
- **Tested against a FORCED straddle, not the corpus**, because the corpus produces none. A fix whose only
  evidence is "nothing changed" is not evidence.

### 2 · THE APPLICABILITY ENTRY — applied, and his counterfactual verified
`applicability.O4` and `.O5`, keyed on `selectorAttribute: kind`, `in: [goal, line, gate, zone, target]` — the
static kinds. **A ball is absent, so its position rows are WITHDRAWN.**
- **MEASURED, exactly his three conditions.** A01 + From Goal Kicks: ball present in `game.objects` as
  `{kind:"ball"}` with **no position key**; O4/O5 **WITHDRAWN**; **open freedoms on objects: `[]`**;
  POSSESSION_CHANGE reachable. Corpus: both balls withdrawn, **GF4's static target KEEPS its position and stays
  an open choice** (the rule is about state-dependence, not about objects). **A04 untouched** — no ball, no
  object, no position lines. **Zero CONDITIONAL survivors** (including `target` in the list avoids the straddle).
- **Two unregistered kind values are in live corpus selectors: `zone` (GF2-06.a/.b) and `target` (I02).** O2's
  draft list is `ball, goal, line, gate`. Both are in the entry because the corpus uses them. Reported.
- **The `in` form is positive-only, so static kinds must be enumerated** and a new kind would straddle. That is
  no longer silent — it is reported by (1) — but it is a maintenance edge, recorded in the entry's own text.

### 3 · OPPOSING TEAMS — aligned
`constructTriggers` required `teamClasses.length >= 1`. **Counting CLASSES is the wrong test, and it is the old
defect's shape in miniature:** A04 has **ONE** P1 class establishing `min 2, max 2`; A01+A01-02 has **TWO**
classes claiming the same two teams. Now reads the established **cardinality**:
`classes.some(c => c.row === 'P1' && (c.cardinality?.min ?? 0) >= 2)`.
- **NOT implemented, recorded in the code and in RC-19:** the design package also names *"distinct team
  designations"* and *"opposed objectives"*. Neither is reachable at stage 2 — the team classes fix no
  designation (empty selectors), and opposition is established by the objective structure under SD-95 ("a shared
  target establishes the opposing relationship, and no team is consulted"), which `constructTriggers` cannot see.
  Two teams is strictly stronger than one and weaker than the full prerequisite.
- Forced both directions in a test: one team + ball → not reachable; two teams + ball → reachable.

New test file `back/src/system/derivation/dynamic-object-placement.unit.ts`, **11 cases**, registered.

### 4 · BALL OWNERSHIP — answer: NO LEGITIMATE OWNER. Returned as the gap, as he asked.
- **DECISIVE EVIDENCE is the spec's own Owner column.** `game-representation-spec-2026-09-18.md:585` (§5.4
  Objects): Owner = *"SELECTION; REALIZATION for position within bounds"*. **No sport/module/game-level owner
  appears in §5's ownership column.** And the spec CAN express co-ownership when it means to — §5.3:572 gives
  `teams[]` *"SELECTION, reconciled against SESSION"*. For Objects it does not.
- **HIS OWN ADJACENT RULING ENDORSES THE CURRENT FAILURE. KR-04** (spec:406): *"RPC-001 does not own or
  instantiate the physical carrier of its scoring event ... The resolved game must independently contain a
  supported compatible carrier ... If selection produces an RPC-compatible scoring event for which no supported
  physical carrier exists, **reconciliation fails/returns to selection**. RPC-001 does not manufacture the carrier
  conditionally."* That is this case one carrier over, and it points at SELECTION, not a new layer.
- **For EXISTENCE there is exactly one channel: a contract item.** `formClasses` iterates contract items and gates
  solely on `establishesExistence`; SD-83 names the boundary. **So a citable standing decision CANNOT establish a
  ball** — it supplies values to elements something else created. The session carries only E1-E4.
- **Why A04 specifically has none:** it routes to RPC-004 Chance Creation, **RPC-004 has NO contract in the
  corpus**, and GF2 + Wide Zone both declare O1 NON_CLAIMED.
- **FEASIBILITY PROVEN (probe, deleted, nothing authored):** a 9th knowledge object with ONE item
  (`O1, kind=ball, EXISTS, AUTHORED, REQUIRED`) → POSSESSION_CHANGE reachable, ball present with NO position,
  **zero open freedoms on objects**, Gate A DEFERRED_TO_REALIZATION/mayRealize, realization PROCEEDED,
  acceptance **0/0/0**. **The go/no-go path is one authoring decision.**
- **Operational trap:** a contract in `contracts` but absent from `selection` still forms its elements and lines;
  it loses its entry in `versions.objects`, the staleness stamp. **Put it in BOTH lists.**
- **CORRECTED my own draft:** I had written "the sport module has no import path into the derivation layer at
  all". **False** — `run-bounded-selection.ts` sits in that directory and imports the library the sport module
  docks into. What IS true (verified by module-graph walk, not by name search): the derivation and realization
  CORES are decoupled, and nothing the sport module knows becomes AUTHORITATIVE SUPPORT. It reaches selection,
  not establishment.

### TWO MORE FINDINGS, both reported not repaired
1. **AN AUTHORED ITEM ON A WITHDRAWN LINE IS SILENTLY DISCARDED — general and PRE-EXISTING.** Measured: the same
   item resolves `RESOLVED:ENTAILED` on a non-withdrawn row and resolves to NOTHING on a withdrawn one. True of
   T1a (an applicability entry predating me) exactly as of O4/O5. **Caution: `forward` was empty in BOTH the test
   and the CONTROL, so its emptiness proves nothing about reporting — I nearly read that absence as proof.** No
   corpus knowledge authors a ball position, so nothing is lost today. **This is the half of his ruling the
   applicability mechanism cannot express:** "a position IS required where knowledge establishes one" needs a
   DEFEASIBLE withdrawal, and `applicability` is selector-based and absolute. His decision.
   - Consequence handled honestly: `derivation-stage10`'s §1.9 dynamic-location test moved from `kind=ball` to
     `kind=gate`. **Verified the invariant still fires there** (refusal RAISED for gate, none for ball). A
     dynamic location on a STATIC object's layout row is the genuinely pathological case anyway.
2. **THE SPORT-COUPLING GUARD HAS A HOLE EXACTLY WHERE THE REAL COUPLING IS.** `SPORT_TERMS` lists soccer,
   football, goalkeeper, dribble, throw-in, corner kick, penalty kick, free kick, final third, midfielder … and
   **NOT `ball`**. The single sport literal in the sport-neutral derivation layer is `'ball'` at `engine.ts:252`.
   The ratchet caught my doc-comment "in football" last week, so it works for the terms it knows.
3. **§5.4's Claim column now partly superseded by his ruling:** *"Every object referenced by a rule, transition or
   objective exists **and is positioned** inside `area`"*. A dynamic object exists and is NOT positioned. Flagged
   to him while cheap — this is the RC-19 pattern starting over.

**Verification scorecard: 18 agents, 15 load-bearing claims checked, 12 REFUTED** — almost all overstatements of
mechanism whose conclusions survived, and one caught a real error in my draft (the import-path claim above).

### THE POLARITY FLAW IN MY OWN ENTRY — caught by an existing test, and the fix is a grammar addition
**My first entry used a POSITIVE list (`in: [goal, line, gate, zone, target]`) and it was WRONG.**
`derivation-stage10`'s GA-DIRECTION fixture uses kinds `goalA`/`goalB` — unenumerated — so `selectorApplies`
returned FALSE and **their authored layout positions were WITHDRAWN**, making the direction clause NOT_EVALUABLE.
Measured directly: `kind=goalA` O4 → WITHDRAWN with a positive list.
- **The structural reason: a positive list cannot obey this mechanism's OWN rule.** `selector.ts:109` and
  `derive.ts:902` both state it — an applicability condition *"may only ever remove a line it can positively
  disqualify"*, so an undecided condition keeps the line and a rule can never hide a gap. That holds for a CLOSED
  attribute (trigger). **`kind` is OPEN-ENDED** — `zone` and `target` are already in live selectors and absent
  from O2's draft list — so a positive list makes **static the exception and dynamic the default**, the reverse of
  his ruling.
- **FIX: added `notIn` as an alternative to `in`** on the applicability condition (`register.ts` type + validation:
  mutually exclusive with `in`, selectorAttribute-only; `engine.ts` negates while **preserving `null`** so an
  undecided condition stays undecided). Entry is now `notIn: ["ball"]`.
- **VERIFIED after: `goalA` ENUMERATED, `gate` ENUMERATED, `ball` WITHDRAWN.** Corpus: GF4's target keeps its
  positions, both balls withdrawn, **0 CONDITIONAL survivors**. A01+A01-02: no open freedoms on objects.
  **Sport-ball path: POSSESSION_CHANGE reachable, no open freedoms, realization PROCEEDED, acceptance 0/0/0.**
- **This IS a concept addition to the grammar, which he praised the route for avoiding.** Reported prominently and
  offered for reversal. It is one key, data not code, and it makes the mechanism obey its own rule.
- Side effect: with `notIn: ["ball"]` the GF4 straddle no longer occurs, so the CONDITIONAL hazard is **latent
  again**. The visibility fix stays — he required it, and its test FORCES a straddle rather than observing the
  corpus, so it is not vacuous.
- `dynamic-object-placement.unit.ts` now **13 cases**, including the polarity test and the `notIn` validation.

### FIFTH knock-on — and the best one: the opposing-teams alignment broke MY OWN earlier test
`trigger-reachability.unit.ts`'s `TEAM_AND_BALL` fixture asserted that "a team and a ball" makes POSSESSION_CHANGE
reachable, and its team item was a bare `EXISTS` — **establishing ONE team**. That satisfied the old
`teamClasses.length >= 1` test and correctly stopped satisfying the prerequisite once it was aligned with
*opposing* teams. **The fixture was understated; the alignment was right.** Fixed to `COUNT 2`, renamed to say
OPPOSING teams so the test states the ruling rather than a weaker version, and both corrections this fixture has
earned by failing are now recorded in it (the earlier one being an unregistered selector attribute that formed no
class silently).

### FINAL STATE OF THIS ROUND — suite GREEN end to end
**REAL_EXIT=0, 333 passing, 0 failures, 19 suspensions, last file (`rendering.unit.ts`) ran.**
`trigger-reachability: 13` · `dynamic-object-placement: 13` · sixteen Gate A checks present.
**Five knock-on failures across this round, EVERY ONE a test correctly detecting a real consequence** — and two
of them found genuine defects in my own work (the positive-list polarity, and this understated fixture). None was
a stale test. Each is updated with its reason in the file, and two assertions are now strictly stronger than what
they replaced.

---

## 6 October — THE SPORT-ENVIRONMENT BOUNDARY AUDIT. Investigation only; nothing implemented.

He HELD the sport-level ball authoring and asked a question one level up: what is the intended relationship
between the inherent performance environment of soccer and the resolved Game Representation? Seven questions, nine
return items, explicit "do not fix / do not amend / do not create a layer".

### THE SPEC STATES ITS OWN BOUNDARY — at §1, in the words he remembered
`game-representation-spec-2026-09-18.md:228` under the heading **"The boundary"**:
> *"The representation holds **what a coach lays out and what the rules key on**. It holds nothing about: player
> movement, tactics, or positions during play; pressure, opportunity, affordance, uncertainty or
> representativeness; **the state of a game in progress**. **It describes the rules that govern state, never the
> state itself.**"*
And §7 "Deliberately not held" names our case: *"The state of a game in progress: which target is live now,
**who has the ball now**."*

### SO "DYNAMICALLY STATEFUL" IS THE WRONG JUSTIFICATION — his hypothesis needed correcting, not confirming
Arguing for the ball because *its state changes* argues from the EXCLUDED side of the boundary. **The distinction
the architecture actually holds is `initial value + the rule that governs it`, and PS1 is the precedent — his
own, 2 October:** *"WHAT IT IS: a team-valued current state. Its **INITIAL** value is a governed realization
choice ... POSSESSION_CHANGE changes that state."* That is §1 applied exactly. Read that way **his
`notIn:["ball"]` ruling IS the boundary, not an exception to it** — the ball is present because rules key on it,
its position is absent because position during play is state. §1.9's refusal of a dynamic location is the same
principle a third time.

### THE ENVIRONMENT OWNER EXISTED, IT WAS RC-19, AND MY OWN SD-44 ENFORCEMENT REMOVED IT
**Five contracts explicitly decline to author trigger existence, citing RC-19 by name:** GF2 (*"Existence of other
transitions never examined (START, SCORE and out-of-play exist by construction, RC-19)"*), GF4 (*"Out-of-play
elements exist by construction"*), RPC-001 (*"No item is on the trigger collection"*), PCG (*"Reset triggers exist
by construction"*), Neutral (*"Exists by construction"*). **And NO corpus item authors an out-of-play trigger's
existence** — the 8 items mentioning OUT_END_LINE/OUT_TOUCHLINE are all about FIELDS of such a transition, three
of them ENGINE_ONLY.
**So RC-19 was the de facto owner of constitutive sport semantics for triggers** — a run convention of ours, not
his ruling. SD-44 superseded it. For out-of-play the prerequisite is a bounded area and the SESSION supplies it;
for POSSESSION_CHANGE the prerequisite is an OBJECT and nothing but selection can supply one. **The ball failure
is the first visible casualty of removing the environment mechanism without replacing it.**

### §6 / SD-17 IS THE PRECEDENT FOR WHAT TO DO INSTEAD — and the asymmetry is DELIBERATE
`spec:740`, §6 "The contribution contract — outside the representation": *"every structural property that a
session emphasis or slot template requires: it enters as a **SELECTION item under its own contract (SD-17), with
no separate route into the game or its language**."* Same shape as ours, already ruled for an analogous source.
**So the absence of a channel by which the sport can push a fact into a game is the design, not a gap.**

### THE CORPUS ALREADY DRAWS HIS BOUNDARY — every T1 existence claim is on POSSESSION_CHANGE
`GF2-07.a`, `NEUTRAL-12.a`, GF4's `I06` (+ `A01-02-01.a` on a `restart=GOAL_KICK` selector the ledger flags as
unregistered). **Nothing authors START, SCORE or out-of-play.** The activities establish the transition their
rules key on and leave the environmental ones to the sport. **So the slippery slope does not follow, and the test
is already in use: "do the rules key on it?"**

### SECOND-ORDER FINDING: THE POSSESSION RELATION IS ESTABLISHED NOWHERE
**PS1 is `NOT_AUTHORED` / "no coverage" in A04, in the A01+A01-02 control that HAS a ball and a reachable trigger,
and in the full corpus. NO contract declares or claims PS1 at all.** Its `fillableFrom: performers.teams[]` is one
of the registered-but-unconsumed constructs. **So a ball restores the trigger's reachability but leaves the
relation that trigger governs unestablished — and nothing blocks on it**, which is why the probe realized with
acceptance 0/0/0. **"A04 is realizable" and "possession is coherently represented" are different states.**

### A04 CLASSIFICATION (his five options)
**Failure to propagate an inherent sport invariant**, caused by **an overly narrow support model** — both, in that
order. NOT missing canonical knowledge (five contracts' own notes show the corpus deliberately not authoring facts
of that kind). NOT an incorrect reachability prerequisite (a possession change genuinely presupposes a ball; and
the PS1 alternative does not rescue the check, because PS1 is unestablished everywhere too).

### THREE CORRECTIONS the verification stage forced, two of them to my own draft
1. **I called §1's "what a coach lays out and what the rules key on" the specification's authoritative boundary.
   IT IS OUR PROSE.** It appears once, with **no [C..] evidence key, no SD id, no attribution**. His recorded
   statement is a different sentence at `spec:185-187`, explicitly *"The boundary, in Christian's words (18
   September)"*: *"the authoritative game contains supported resolved facts in the eight areas; Gate A and both
   directions of Gate B pass before rendering; and coach language can describe that game but cannot create
   additional structure."* That is **support and closure — it says nothing about the sport or about scope.**
   **So the boundary everyone has been citing is unratified, and this is the SECOND instance in one audit of our
   own prose being treated as his authority. RC-19 was the first.**
2. **AN INTENDED OWNER IS NAMED IN AUTHORED KNOWLEDGE AND WAS NEVER BUILT.**
   `game-archetype-workbook.rc1.1.json:32` — `"Sport_Profile_Rule": "Detailed sport-specific logic is excluded and
   must inherit through separate Sport Profile resources."` **That phrase occurs in exactly ONE file in the repo.**
   Not absent-and-unnamed but **named-and-unbuilt**, a different situation and his to rule on.
   - **And the same workbook authors the other half:** GF2-07.a's basisEvidence is GA-001
     *"Shared, adaptive, generally simultaneous access with reciprocal influence."* **One artefact authors the
     interaction structure and disclaims the sport-specific carrier. The ball is precisely the half it hands off.**
3. **PSD-03: HE ALREADY ASKED THIS AND DEFERRED IT.** `spec:391-400`, his words: *"I don't think its proper owner
   is a Game Form or a founder-created Game Representation default. Treat the missing source as visible for now
   rather than solving its ontology during this check"*, *"Game Forms shouldn't have to duplicate ordinary
   soccer-state behavior simply to produce a playable game"*, *"Please don't turn that observation into a new
   library or architectural layer during this step."* §11 still lists it open. **His present instinct is the same
   instinct.** The marker `OUT_OF_PLAY_SOURCE_MISSING` exists in the conformance artefacts and in **zero source
   files** — the 8th registered-and-unconsumed construct.

### A CLASSIFICATION I TESTED AND REJECTED rather than adopting
A verifier proposed "a lost structural presupposition in a restatement": GF2-07.a's fitNote says it re-expressed
`CHANGES_ON objects[].owner` *"without loss"*, so the object looked like it went out with the row. **Checked GF2's
ORIGINAL source in the soccer module workbook: ZERO GF2-related objects mention a ball.** Nothing was lost — the
ball was never in GF2's knowledge. **The note is accurate.** Sharper accusations still have to be true.
**Final classification stands: PSD-03's deferred ownership question becoming load-bearing for the first time,
because SD-44 turned a tolerated silence into an unmet prerequisite.**

**Audit scorecard: 30 agents, 25 load-bearing claims checked, 24 REFUTED.** Highest rate yet — mostly agents
over-reading design prose as governing rule, which is the same error I made. The stage earned its cost twice.

---

## 6 October (later) — his 4-item order: ruling recorded, carrier sweep, §5.4 amended, PS1 traced

### 0 · I MIS-STATED SD-44 IN WRITING, and his suspicion was right
My RC-19 rewrite of 5 October put the possession-change prerequisite as *"opposing teams and a ball object"*.
**SD-44's own row (`spec:336`, evidence key [C22]) says: *"turnover when opposing teams and the relevant possession
relationship exist"*.* The RELATIONSHIP is the prerequisite; the ball is a prerequisite OF the relationship. His
5 Oct wording agrees — *"the prerequisites for that relationship"*. **Chain: trigger -> relationship -> ball. I
collapsed it to trigger -> ball.** Consequence: the engine checks the deepest term and never checks the named one.

### 1 · THE BOUNDARY RULING RECORDED
Spec §1 now carries it as his, attributed and dated, replacing the unattributed prose — with a note that it had
been cited as the boundary for weeks unratified. The `applicability.O4/O5` text restated to cite this formulation
instead of the withdrawn "dynamic object" language.

### 2 · BOUNDED CARRIER SWEEP — 33 goal x situation cases. The ball is the ONLY required sport-level carrier.
    ALREADY SUPPLIED: START/STANDING (by construction) · OUT_END_LINE/OUT_TOUCHLINE (SESSION envelope, 19 cases)
                      REGION_ENTRY (SELECTION, 16) · POSSESSION_CHANGE satisfied in 1 case (the authored ball)
    NEEDS A CARRIER:  POSSESSION_CHANGE — 18 cases
    NOT CONSTRUCTIBLE AT ALL (held): COMPLETED_PASS — 15 cases
SCORE, TIME_EXPIRY, FIRST_FORWARD_PASS are keyed on by **nothing** in the operative form.
- **THE SCANNER SCARE THAT WAS A FINDING: the loader REWRITES selectors.** A01-02's authored
  `restart=GOAL_KICK & trigger ∈ {SCORE, OUT_END_LINE, …}` loads as the concrete
  `trigger=OUT_END_LINE AND qualifier.endLine=DEFENDING_TEAM AND qualifier.lastTouch=ATTACKING_TEAM`, carrying
  `goalKickTriggerSource`: *"Christian, 2026-09-26: the goal kick is 'the state in which the ball leaves play over
  the defending team's goal line, having last been touched by an attacking player, without a goal being scored'."*
  **A constitutive soccer fact supplied as an OWNER RULING to make an activity's rule expressible — the same move
  now under discussion, already made once.** And `BASES` includes `OWNER_RULING`, which `establishesExistence`
  admits, so an owner ruling CAN establish an element **provided it arrives as an item on a contract** (17 uses).

### 3 · §5.4 — NOT load-bearing (MEASURED), amended with the dependencies recorded
With the ball position withdrawn vs the entry stripped in memory, **GA-ENVELOPE-FIT, GA-LAYOUT-FEASIBLE and
GA-ONE-PRIMARY-EVENT return IDENTICAL verdicts** on the corpus and on A01+A01-02. Only GA-NO-FAILED-LINE's
denominator moves, 58 -> 60. Adopted his wording, third conjunct preserved, **no exception for any kind**.
- **BUT TWO GATES DO REQUIRE A POSITION, and that is now in the amended cell:**
  - `GA-ONE-PRIMARY-EVENT` position clause: `unpositioned.length ? fail(POSITION, …)` — **FAILS** on an
    unpositioned referent. Would bite if a ball were ever a primary-event referent.
  - `GA-DIRECTION` needs a DERIVED along-interval to decide an object's end. **Known first-hand: my positive-list
    polarity bug withdrew `goalA`'s position and GA-DIRECTION went NOT_EVALUABLE.** That is how it was caught.
  - `GA-ENVELOPE-FIT` treats an unreadable placement as a reason to DEFER, so it will respond to a withdrawn
    position once this corpus stops authoring placements as prose. **Masked, not absent.**
- **DEFECT found in passing, reported not repaired:** GA-ONE-PRIMARY-EVENT tests a referent's identity one way
  (accepting a typed structural reference) and resolves it another (by class id, which a typed reference is not).
  **A typed reference passes identity then fails to resolve.** Same shape as the filter that could never match.

### 4 · PS1 TRACE — and a ball alone is NOT sufficient
- **Intended as the HOLDER of a relation the corpus already named.** `possessionNote`: *"the corpus named the
  states of this relation before anything could hold one. PS1 is what holds it."* The proposal:
  *"There is no field, on any row, for which team has the ball."*
- **Nothing was in a position to establish it.** PS1 was added 3 October, AFTER all eight contracts were restated
  against a register without that row. 860 declaration reaches over 81 distinct rows, **zero on PS1**; zero items.
  Reason "no coverage" = the engine's term for *nobody looked*. The adding commit recorded the cost:
  *"NOT_AUTHORED 24 -> 25, both PS1."*
- **AND IT IS NOT SPECIAL TO PS1 — this is the bigger finding.** All eight contracts declare one identical FROZEN
  roster of **81 rows**; the register now carries **90**. **So some rows structurally cannot be covered.** PS1 is
  one of them, not a one-off.
- **Does POSSESSION_CHANGE require it? YES, by SD-44's own text** (see item 0).
- **Why the ball and not the relation?** `constructTriggers` keys on opposing teams + a ball-kinded object and
  **never reads PS1**. So a game can hold the carrier, reach the trigger, realize cleanly, and still not hold the
  relation the trigger exists to change — which is exactly what A01+A01-02 does.
- **MEASURED why PS1 is not even OPEN:** it fails the game-level existence gate in `derive.ts` — a game-level row
  is openable only if the session sources it or something has *addressed* it; PS1 is neither. **So the obstacle is
  unaddressed EXISTENCE, not a missing choice space.** Threshold worth knowing: **a single BOUNDS-ONLY
  contribution would make the line OPEN** (SD-R2's "which team starts can remain a permitted free choice" becomes
  expressible); an AUTHORED+REQUIRED one would resolve it.
- **PROVENANCE DEFECT: PS1's note cites SD-R2, a RETIRED non-authority** (explicitly "not citable"). The
  structurally identical row T2 was corrected away from that exact citation and carries `fillableAuthority: SD-39`.
  **PS1 carries no authority field at all.** No code reads it; same stale citation, newer row.
- **RECOMMENDATION, not implemented:** a second named clause on `GA-TRIGGER-REACHABLE` — where a transition is
  keyed POSSESSION_CHANGE, the possession relation must be RESOLVED or OPEN. Not in `constructTriggers` (the
  trigger set is built before anything resolves). **Not made because it fails a currently-green check and would
  mean a ball alone no longer makes A04 realizable** — right if SD-44 means what it says, and his call.

**Verification: 14 agents, 12 load-bearing claims checked, 9 REFUTED.** Including one that corrected my own
"nothing could have established PS1" into the sharper frozen-roster finding.

---

## 6 OCTOBER (later) — HIS FOUR AUTHORIZATIONS CARRIED OUT, AND A04 IS REALIZABLE AGAIN

His order, in his words: correct the implementation to reflect the chain `trigger -> relationship -> ball`;
authorize a bounds-only possession contribution leaving the initial holder a governed choice; authorize the
minimal Soccer Sport Profile; and classify the nine post-freeze register rows by pilot impact. Done in the
sequence Joe approved: Sport Profile + PS1 first, then the reachability clause, then the audit, then the 19.

### 1 · THE SPORT PROFILE — a new knowledge SOURCE, no new mechanism
`docs/audits/conformance/stage-b/sport-profile-soccer.json`. Two items only:
- `SPORT-SOCCER-01` — row `O1`, selector `kind=ball`, `EXISTS`, `REQUIRED`, basis **OWNER_RULING**. Establishes
  the element because `establishesExistence` admits OWNER_RULING, not because the file is special.
- `SPORT-SOCCER-02` — row `PS1`, `RANGE`, qualitative value, `REQUIRED_RANGE`, basis **OWNER_RULING**.
  **Bounds-only BY CONSTRUCTION:** `RANGE` is outside `entails()`'s set `{EQUALS, POSITIONED, ORIENTED}`, and the
  value is a term rather than an array so `narrowsToSet()` declines it. It can only land in `bounding`.
  `EXISTS` was unusable — SD-100 makes it inert on a FIELD row.

**Loaded separately from `contracts.json`, and the reason is structural.** That file holds the eight restated
objects a goal SELECTS from, each frozen against the 81-row roster of its restatement. A Sport Profile is
selected by nobody, so `loadSportProfile()` is its own loader and `derivationInputFor` appends it
unconditionally — **into both `contracts` and `selection`**, because a contract absent from `selection` still
forms its elements but loses its entry in `versions.objects`, the staleness stamp.

**The engine names no sport.** The first version wrote `stage-b/sport-profile-soccer.json` into `corpus.ts` and
**the sport-coupling ratchet caught it on the first run** (`soccer` x2 in corpus.ts, x1 in gates.ts; baseline 35
across 23 rows). Rewritten to discover the profile by pattern, so the sport's identity lives in the artefact.
Absence and plurality both THROW rather than resolve quietly — an empty directory must not hand back an empty
list and let the ball disappear.

### 2 · THE SECOND CLAUSE ON `GA-TRIGGER-REACHABLE` — and the chain proved from BOTH ends
`gates.ts` `gaTriggerReachable` now emits two clauses on every path (`RELATION_CLAUSE` hoisted beside `CLAUSE`
so the early return reports both). Where a transition is keyed `POSSESSION_CHANGE`, `game::PS1` must be
established or legitimately open.

**Both controls fail, each on its own clause** (`sport-profile.unit.ts`, 9 cases):
- ball kept, `SPORT-SOCCER-02` stripped -> clause 1 **PASS**, clause 2 **FAIL**, Gate A FAIL. *His sentence
  satisfied: the ball alone no longer makes a possession change reachable.*
- relation kept, `SPORT-SOCCER-01` stripped -> clause 1 **FAIL** (`POSSESSION_CHANGE` is never constructed),
  clause 2 **PASS**. **Neither test alone is SD-44; together they are the chain.**

**A defect of my own in that clause, found by the audit and fixed:** it read `ctx.classified` directly and
probed only on failure, so a PASSING report named no subject and there was no way to tell the clause had run.
The Probe's own contract says every line a check consults is recorded as a subject. Now read through
`probe.cell`, with `DERIVED` or `OPEN` as the two admitted states. Pinned by a test.

### 3 · THE CLAUSE'S FIRST REAL SUBJECT IS THE CORPUS ITSELF
Full stage-B corpus: **three** transitions keyed on a possession change, `game::PS1` `NOT_AUTHORED`/`no coverage`,
and A01-02 and RPC-001 both establish a ball so clause 1 passes with four instances. **The corpus has been
declaring turnovers with nothing holding the relation a turnover changes.** Baseline in
`derivation-stage10.unit.ts` moved from `[GA-INFORMATION, GA-NO-FAILED-LINE]` to include
`GA-TRIGGER-REACHABLE`, with the reason recorded beside it.

**And `GA-NO-FAILED-LINE` would never have caught it.** Measured four ways: PS1 unestablished AND unclaimed ->
reason `no coverage` -> counted under `unspoken` -> **PASS**; PS1 unestablished but CLAIMED -> reason
`claimed but unresolved` -> **FAIL**. A row no contract claims is invisible to the failed-line check. That is
why the obligation had to be a reachability clause and not a tightening of that check.

### 4 · PS1's STALE SD-R2 PROVENANCE — CORRECTED
`fillableAuthority` added to PS1, mirroring T2's existing correction: **SD-39**, with the note that SD-39's own
qualification is met independently because the Sport Profile supports the property and its choice space. The
parenthetical citing SD-R2 — a REJECTED default — is gone from the note; its substance survives, as his own
spec text already says: *"a rejected default cannot be cited as one."*

### 5 · THE NINE POST-FREEZE ROWS — PS1 is the only one that can fail a gate, and V9a is a second blocker
12 agents, 10 load-bearing claims verified, 4 of 10 refuted on the first pass.
- **pilot-load-bearing: PS1 only.** The only one of the nine any Gate A clause reads. A game-level FIELD row
  gets its line unconditionally, so no missing class can make it inert.
- **currently exercised but nonblocking: V9a.** One line, `RESOLVED:ENTAILED` = `MULTIPLY`, support
  WIDEZONE-18.c. Reaches the coach as *"worth 2 instead of 1"*.
- **not exercised by the bounded pilot: P11, P12, P13, R1, R2, R3, R4** (seven). Zero classes, zero lines, named
  by no check. R1 is an AUTHORED **EXCLUSION** from A04's own game form (GF2-22, `NOT_EXISTS`), which is why
  R2/R3/R4 get no line at all — an established absence, not an unexamined row.
- **THE SECOND BLOCKER, verified first-hand in `load.ts:163-178`:** `checkModifierOperations` refuses the
  **WHOLE contract** where a `V9` magnitude has no selector-matched `V9a` item (SD-30). A refusal of
  `restated:WIDE-ZONE-ADVANTAGE` would strip A04's shaping constraint *before any gate ran*. As authored the
  pair exists, so it does not fire. **So "PS1 is the only row capable of blocking" is true only if blocking
  means failing a Gate A clause.**
- **COMPLETED_PASS: pilot impact NIL, not repaired.** A04 carries zero lines on V15/V16/V17, so GA-INFORMATION
  returns a vacuous PASS (both clauses `NO_APPLICABLE_INSTANCES`). The gap is deferred for **15 of 33**
  goal-by-situation cases and passes silently in every one. Proved by isolation that establishing PS1 changes
  nothing about it: PS1 established, PS1 dropped, ball dropped — unreachable in all three.

### 6 · THE 19 SUSPENDED CHECKS — RESTORED, and one dangling reference found doing it
- `identity.unit.ts`: **16 passed** (the 15 `chain()`-based checks had been suspended; the conditional
  suspension lifted itself once `mayRealize` came back true). The `Suspended` sentinel is now unreachable.
- `post-realization.unit.ts`: whole-file guard lifts; **ok**.
- `realize.unit.ts`: **39 passed**. The acceptance test is a real test again and asserts
  `realizationAuthorized === true` first — through the gate, not around it. The `suspended()` reporter is
  REMOVED rather than left as scaffolding.
- Two tests that had been rewritten to assert A04's failure are restated on live measurement: A04 is
  `PRE_REALIZATION_SATISFIED`, D03 is `FAIL`, D01 is `NOT_EVALUABLE` — three distinct states, each with a live
  example for the first time. A05 is waiting on GA-INFORMATION and GA-REFERENCE-INTEGRITY again, as it was
  before 5 October.

**MY OWN DEFECT, found by reading the realized record rather than the test result.** The PS1 realization choice
was recorded as `...GF2-14.a#0`; `memberHandle` mints ordinals from **1**. So the one realized game on the pilot
path carried a reference to a team **that does not exist**. Three things had to line up for it to pass: the bound
is qualitative so `boundCheck` is `UNVERIFIABLE_QUALITATIVE_BOUND` and nothing compared the value to anything;
**no consumer reads `possession.team`**, so nothing downstream tripped over it; and the acceptance account
reported nothing lost and nothing invented, because a dangling reference is neither. A test for each of those
three would still have passed.
- Choice corrected to `#1`.
- `realize()` now REFUSES a chosen value of the form `<classId>#<digits>` for a class this realization
  instantiated where that exact handle was not minted. Narrow on purpose: prose containing a hash is untouched,
  and a reference to an established element is untouched. **An unverifiable bound means the TERM cannot be
  checked; it does not mean any string will do.**

### 7 · WHERE A04 STANDS, MEASURED
`gateA DEFERRED_TO_REALIZATION`, `mayRealize true`, `realizationAuthorized true`, `notAuthorizedBecause []`.
PS1 `FREE(a)`, `permittedBy.authority SD-39`. Ball `{kind:"ball"}` with **no position** — the key set is exactly
`elementId, kind, selector`. Realization PROCEEDED; acceptance **0/0/0**; post-realization Gate A **PASS**;
`unverified: ["game::PS1"]`.

**A04 is the ONLY authorized goal of 13.** Two (D03, TD02) reach a verdict and FAIL; ten reach no verdict, in two groups
of five: GA-INFORMATION + GA-REFERENCE-INTEGRITY unevaluable (A01, TA01, A02, TA02, A05), and
GA-DIRECTION + GA-ONE-PRIMARY-EVENT + GA-ROSTER-SUM unevaluable (D01, TD01, D02, A03, A06).
**NOT for want of a restated contract, which was my first answer and is wrong** — A04 has only 2 of its
5 selected objects contracted and is authorized anyway. **The pilot path is one goal wide**, and
`realize.unit.ts` now asserts that rather than leaving it in a report.

### 8 · REPORTED, NOT REPAIRED
- **PS1's realized value reaches no coach-facing output.** `render:a04` contains `possession.team` zero times,
  and fidelity PASSES without listing it among the deliberately-unexpressed. Flagged because it is the exact
  shape of this project's recurring silent-loss failure; whether a game-level realized value should be expressed
  is his.
- GA-ONE-PRIMARY-EVENT's typed-reference defect (identity accepts, resolution rejects) — not pilot-load-bearing.
- Wide Zone trigger semantics and magnitude: **HELD**. Successful Region Access: **PARKED**. Generation: **FROZEN**.

### 9 · THE RENDERING FIXTURE IS STALE — MEASURED, DELIBERATELY NOT REFRESHED
`npm run render:a04` reads `docs/audits/a04-concrete-game-fixture.json`, a FROZEN concrete game, on his
instruction to isolate the communication boundary. Today's run still prints **fidelity PASSED** — about a
game that no longer exists. Old digest `a9d16e5c`, live digest `12dbd433`; the frozen `game.objects` is
**`[]`** and `status.choices` has five entries, not six.

**Measured what a refresh produces, without writing the file.** The chain still closes — acceptance 0/0/0,
post-realization gate validated — and `checkFidelity` raises **exactly two Q3 violations, both new**:
- `objects[c:sport-profile:soccer:SPORT-SOCCER-01].kind is established by the game and no instruction carries it`
- `possession.team is established by the game and no instruction carries it`

**The two things the Sport Profile establishes are the two things a coach is never told.** Not a derivation
failure and not a fidelity failure — fidelity is the check that caught it. `loadBearingPaths` walks
`status.derived` + `status.choices` and excludes only `.startsEpisode` and `space.axis`, so PS1 and the ball
land in `coachFacing` and nothing cites them.

**NOT REFRESHED, on purpose.** Refreshing turns the suite red at `rendering.unit.ts:41` (`Q2/Q3/Q4` must
raise no violation), and the only way to make it green again is either to author coach-facing text for the
ball and the holder, or to add them to `NO_COACH_FACING_EXPRESSION` as deliberate non-expressions. **Both
are authoring decisions that are his.** Changing the test to expect two violations would bake "the coach is
not told there is a ball" into the suite as the expected state.

**AND NOTHING WOULD HAVE TOLD US.** No assertion compares the frozen fixture's `provenance.inputDigest` to a
live run — the harness-verifies-a-fork shape again. A guard belongs there; it is not added because it fails
immediately and would force the refresh decision rather than present it.

### 10 · A COUNT-ONLY BASELINE NEARLY REPORTED PERFECT CONTAINMENT OVER A SWAP
`completed-pass.unit.ts` pins, per goal, the number of failed resolution lines. After the Sport Profile
**all thirteen counts are byte-identical** to the 5 October baseline. The membership is not:

    gone : game::PS1
    new  : c:sport-profile:soccer:SPORT-SOCCER-01::O3

in **every** goal. PS1 left because it is now bounded; the ball's COUNT arrived because the profile
deliberately leaves it unconstrained and declares O3 NON_CLAIMED, so it reports as a declared
non-requirement. The exchange is legitimate; a baseline that cannot see it is not. The test now asserts
both lines **by name** in every goal, in addition to the count.

**The generalisation:** a conserved total is not evidence of a conserved set. Where a baseline counts,
also name the one thing that must leave and the one thing that must arrive.

### 11 · A CONSEQUENCE NOT ANTICIPATED: the carrier no longer depends on the coach's planning choice
Until 6 October the ONLY thing supplying a ball to a real game was `A01-02-08.a`, authored inside ONE
practice situation (A01 + From Goal Kicks). So `A01 + A01-02` reached POSSESSION_CHANGE and `A01` alone
did not — whether a game's turnover was possible depended on which situation a coach had picked. With the
Sport Profile both forms pass. The situation's authored ball is still admitted and is now **redundant for
reachability**, which is the right relationship between a sport fact and a practice situation.
`trigger-reachability.unit.ts` asserts both forms, replacing the test that pinned the asymmetry.
