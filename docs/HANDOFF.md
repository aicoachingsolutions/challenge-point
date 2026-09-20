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

**To him:** may a contract author a comparative value claim? If yes it needs a row and a kind (AM-16
extended); if no, mutual exclusion becomes an authoring duty via exclusion items.

**Live behaviour worth checking when the freeze lifts:** the slot modifier carrying central weighting is
attached to slot 1 of every Discovering Solutions session regardless of the selected constraint, so a
coach running Wide Zone Advantage is told to go wide and paid to go central.
