# Goalkeeper Build-Out (RPC-001) — the RC1.1 context document against the workbook, 2026-10-16

A record, written on 15 October 2026 (stage H3) for his reply of that day (called his 16 October reply). Nothing in
the workbook, `rpc-library.rc1.json`, `contracts.json` or any candidate pool was changed to write it, and no item below
is made executable by it. It is the focused reconciliation he asked for, with the omission he asked to be logged.

What he asked:

- Item 1: *"Regarding the differences between the RC1.1 context document and the workbook, please continue using the
  workbook as the current executable authority. I'd appreciate a focused reconciliation of the missing items,
  identifying which are substantive knowledge omissions versus explanatory material that does not need to be
  executable."* — and *"We do not need a broad library revision before completing this activity."*
- Item 6: *"The third build-out origin described in RC1.1 can remain outside the first implementation, as you
  recommend, while its workbook omission is recorded for reconciliation."*

Labels: **MEASURED** — a script compared the files and a second, independent check reproduced it. **READ** — quoted
from a file. **INFERRED** — our reasoning, not his and not the knowledge's.

## 1 · Our projection of the workbook is faithful

**MEASURED.** Every RPC-001 row of `back/data/sport-modules/soccer/rpc-workbook.rc1.1.xlsm` (Registry, Statements,
Relationships, Properties, Identity Rules, Transitions, Validation, Staging) was compared cell by cell with
`back/src/system/sport-module/rpc-library.rc1.json`: **521 cells, 0 differences**. The comparison runs from the workbook
to the JSON; a separate pass found no RPC-001 row in the JSON that is missing from the workbook.

**The differences are between his document and his workbook, not in our ingestion (MEASURED).** The workbook he sent
(`Challenge_Point_RPC_Workbook_RC1.1_Final.xlsm`) has the same RPC-001 Properties, Statements, Identity Rules,
Transitions and Validation rows as the repository copy. The repository copy adds only what he approved afterwards
(RPC-PROP-132 and the relationships resolved on 13 September: RPC-REL-009..015, RPC-REL-058, RPC-REL-071..074) and
the ACTIVE statuses. Neither copy contains the third begin condition, the manipulation and regulation categories,
"avoiding goalkeeper involvement", "encourage progressive support", "goal kick" or "near its own goal". The RC1
library document already held those items, so the condensation dates from the RC1 workbook authoring (INFERRED from
the provenance columns; the RC1 workbook itself could not be read).

## 2 · How "substantive" and "explanatory" are told apart here

His Workbook Standard (RC1), which the workbook names as its governing standard, says narrative explanation is never
parsed by the runtime engine, and that manipulations and interaction regulations enter a workbook only as references
by canonical id (READ). The same Standard also lists begin conditions, end conditions, representative information,
degenerate solutions and behaviour adjustments as **property categories of the workbook** (READ, verifier
correction). So an omission in those categories is a property omission under his own standard, not narrative. Where
this record calls one "not blocking", the reason is what the engine reads (MEASURED: only the
PRIMARY_SCORING_CONDITION category is read by category, `rpc-library.ts`), never that it is explanatory.

**SUBSTANTIVE** below means: the item would change what the engine could build or check if it were in the workbook.
**EXPLANATORY** means: it is already carried by a workbook row, or it is material for review rather than a rule.

## 3 · The reconciliation

| # | Item in the document | Kind | Reasoning | Consequence for the first activity |
|---|---|---|---|---|
| 1 | **The third begin condition**: "the defending team establishes controlled possession in its defensive third following a stoppage or controlled regain" | SUBSTANTIVE | RPC-PROP-001 carries only the goalkeeper and controlled-restart arms, and so does the initiation clause of his approved scoring condition RPC-PROP-132 ("Initiated from the goalkeeper or a controlled defensive restart"). Adding the arm would change two rows and would change when a build-out episode starts: a deep regain would be scored under the build-out condition rather than played on (READ). Existing vocabulary could express it — SV1 thirds per team (SD-12), and a possession change already begins an episode (SD-14; RPC-001-17.a) — so only its build-out status and scoring are missing (READ, verifier correction). | **None: it stays out, as he decided (item 6).** A build-out episode begins only from the goalkeeper or a deliberately selected controlled defensive restart; a regain in the building team's own third begins no scored build-out episode, and play simply continues. **Logged here as he asked.** When it is scheduled, one question is his: does it enter RPC-PROP-001 only, or RPC-PROP-132's initiation clause as well? |
| 2 | **Typical Environmental Manipulations and Typical Interaction Regulations**, as a class (Core: build-out starting positions, field dimensions, progression zones; Common: defensive numbers, goalkeeper positioning, numerical overloads, support spacing; Core regulations: restart procedures, progression requirements; Common: defensive release timing, numerical conditions, directional constraints) | SUBSTANTIVE as a class of relationship | No workbook row, category or staging row holds them, in any of the eight contexts (MEASURED, parser counts, approximate: 57 manipulation names and 46 regulation names, 0 rows). Canonical manipulation entries DO exist — EM-0001 Playing Area Configuration, EM-0002 Performer Configuration, EM-0003 Objective Configuration, EM-0006 Participant Composition, and 23 Soccer Module realizations typed as manipulations or regulations — so linking the document's names to them is an existing-knowledge relationship for him to verify, not a new object (READ, verifier correction). His 15 October item 1 calls these "the context's existing manipulations" and "appropriate candidates for evaluation". | Every setup element of the first activity takes its authority from his rulings or from the possession game form; the lists are cited only as the CANDIDATE source, never as the authority. That is what the authorization record does (`learning-goal-authorizations.json`, each manipulation's `source`). No mapping to a canonical id is inferred into runtime. |
| 3 | **The restart location**: "play restarts from a goal kick or similar controlled restart" and "another controlled restart near its own goal", against the workbook's "a controlled defensive restart" | SUBSTANTIVE, minor | With the "own-half start area" wording retired (his 9.10; ruling C51), the document's wording is the only location anchor in the knowledge; the workbook's bound is the word "defensive" alone (READ). | It reaches the first activity whenever a restart is not from the goalkeeper: his 6.ii, "The coach can select an appropriate authorized restart location, consistent with the intended build-out situation." Not applied as a region. Where a build-out restarts is decision D5. |
| 4 | **Goalkeeper information tier**: the document's Common "goalkeeper positioning" against the workbook's CORE "Goalkeeper availability." (RPC-PROP-009) | Settled, not open | Our 15 October email, change 4, read "Goalkeeper availability" as applying where the activity includes a goalkeeper, not as a requirement on every team, and his 9.4 approved it: "Goalkeeper-or-controlled-restart alternative: Approved." (READ, verifier correction). Equating PROP-009 with the document's "goalkeeper positioning" is itself an inference; the document's Core "available support" is an equally possible source. | Implemented as ruling C53 (RPC-001-02 and -03 retired, originals kept). With two goalkeepers available the roster today gives each team six outfield players and no goalkeeper (decision D6; capabilities M2, M3). |
| 5 | **Affordance targets**: nine in the document; six staged (RPC-MAP-091..096), all DEFERRED by him on 13 September; three never staged (central progression, wide progression, numerical superiority) | SUBSTANTIVE in kind | MEASURED: 71 targets across the eight contexts, 43 staged, 28 never staged. | No runtime effect: every affordance target is deferred. Affordances can appear in a review only as quoted library text. |
| 6 | **The boundary** "exploiting transition (Counterattack)" | SUBSTANTIVE for provenance | RPC-001 has no exclusion rule or transition to RPC-006, and neither the document nor the workbook gives RPC-001 a success condition for the pressing team after a regain (READ). | The post-regain target is **his provisional choice** (item 5), recorded as such in the authorization record, and not RPC-001 knowledge. Counterattack's transition window is not imported (item 5). |
| 7 | **The two extra end conditions**: play progressing into Attack Development; play transitioning into Counter-Press | EXPLANATORY | Carried as RPC-TR-002 (TYPICAL) and RPC-TR-003 (CONDITIONAL); RPC-PROP-003, "Organized attack is established.", ends the context (READ). | They are consistent with an intermediate progression reference (INFERRED; the authority for the intermediate target is his item 4, not these rows). |
| 8 | **Representative success and failure** (four each) | EXPLANATORY | No workbook category in any context (about 33 and 32 items, 0 rows). Their content maps to executable rows: progressing beyond the initial build phase to RPC-STMT-004 and RPC-PROP-132; losing possession before the attack is established to RPC-PROP-005; forcing unrepresentative clearances to RPC-PROP-010 and PROP-132's long-clearance exclusion; preserving several attacking possibilities to RPC-ID-003 (contract item RPC-001-22). Coordinated support is play behaviour (RPC-PROP-006, RPC-PROP-011) (READ). | Review material for his test of the first activity. |
| 9 | **Identity characteristics** (five) | EXPLANATORY | Controlled defensive possession is RPC-ID-001 and establishing the attack is RPC-ID-002; live, adaptive opposition is carried structurally (GA-001 through RPC-001-01.b; RPC-VAL-004). Coordinated support around the ball and continuous adaptation to defensive behaviour have no identity rule (READ). | The two without a rule belong in review evidence (players meeting meaningful pressure with several functional solutions), not in executable rules. |
| 10 | **Degenerate solutions**: seven in the document, four in the workbook (RPC-PROP-010..013). Missing: avoiding goalkeeper involvement, excessive backwards circulation, abandoning width | Property-category omission; not blocking | The document calls them diagnostic signals rather than prescribed errors (READ). The engine does not read the category (MEASURED). | Starting from the goalkeeper's feet makes the first involvement structural; the review should watch whether builders bypass the goalkeeper afterwards, and must not read his item 4 "carrying the ball" as RPC-PROP-013's unnecessary dribbling. |
| 11 | **Behaviour adjustments**: seven in the document, four in the workbook (RPC-PROP-014..017). "encourage progressive support" and the Preferred/Additional ordering are lost; the workbook adds "without prescribing a single solution" (RPC-PROP-017) | Property-category omission; not blocking | In-session guidance (READ); the engine does not read the category (MEASURED). | None: in-session coach feedback is deferred. |
| 12 | **Representative information**: eight in the document, four CORE rows in the workbook (RPC-PROP-006..009). "numerical relationships" and "weak-side availability" absent; "developing pressure" merged into RPC-PROP-007 | Property-category omission; not blocking | The absent items are Common, "frequent but optional" (READ). | None for the first activity. |
| 13 | **Begin and end conditions condensed** in all eight contexts (about 25 document begin items against 14 rows; about 36 end items against 21; parser counts, approximate) | Flagged | Partly covered by transitions (READ). | Item 1 above is the one that matters for this activity. |
| 14 | **Learning Goal phrasings, Game Problems, game forms, statements, coach translation** | EXPLANATORY or equivalent | His RC1.1 Resolution 3: "Use exact SPM Learning Goal IDs; coach phrasings remain Entry Language." Game Problems (GP-001 and GP-005 primary; GP-015 and GP-002 secondary) and game forms (GF2 and GF3 primary; GF7 secondary) match exactly; the coach translation drops only "naturally" (MEASURED). | None. |

## 4 · What the workbook has that the document lacks — all executable

RPC-PROP-132 (his approved primary scoring condition, 13 September); RPC-REL-071..074 (the approved scoring events, in
order) with the scoring-event vocabulary; RPC-REL-001 (GA-001, REQUIRED); RPC-ID-004 ("Goalkeeper involvement is typical
but not independently defining"); RPC-ID-005 and RPC-ID-010; RPC-VAL-001..005 (the document carries only the identity
test); the transition types on RPC-TR-001..003; the CORE/COMMON tiers where they differ from the document; the
qualifiers in RPC-PROP-016 ("while preserving build-out identity") and RPC-PROP-017 ("without prescribing a single
solution"); the staging rows with his 13 September deferral (READ, MEASURED).

## 5 · Questions that stay his, none of them blocking the first activity

1. When the third begin condition is scheduled: RPC-PROP-001 only, or RPC-PROP-132's initiation clause as well?
2. The typical manipulation and regulation lists, for RPC-001 and for all eight contexts: library explanation cited
   as the candidate source (as now), or staged as DEFERRED relationship rows to the canonical entries that exist?
3. Once "own half" is retired, what bounds a coach-selected controlled defensive restart: the workbook's "defensive",
   or the document's "goal kick or similar" and "near its own goal"? (Part of decision D5.)
4. The three affordance targets never staged: stage them as DEFERRED beside the other six, or leave them?

## 6 · Corrections made by the independent check, kept visible

- The goalkeeper tier is not a question for him: 9.4 approved change 4. (The first analysis had asked it.)
- Canonical manipulation entries exist; linking to them is a relationship to verify, not a missing object.
- His 15 October item 1 treats the document's list as the candidate set; "never cite the lists" overstated the rule.
- His Workbook Standard lists degenerate solutions, behaviour adjustments and information as property categories;
  their omissions are non-blocking because of what the engine reads, not because they are narrative.
- "Not affected" for the restart location holds only while every restart is from the goalkeeper.

## 7 · One relationship resolved explicitly (added 15 October 2026, stage K4)

His reply filed 17 October 2026: "Where a specific missing relationship is necessary for Play Out from the Back, identify
and resolve that relationship explicitly." Row 2's class stays as it is; ONE of its names is now linked, because the first
activity needs it: the document's Common manipulations "defensive numbers; numerical overloads" to EM-0006 Participant
Composition (an RC1 Candidate), with the workbook's own RPC-PROP-017 ("Manipulate numerical relationships without
prescribing a single solution."). We identified it under his D6 instruction; he confirmed it in his reply filed 18 October
2026, item 5: "Goalkeeper Build-Out with Participant Composition." and "Both should be represented as knowledge-authorized
relationships rather than hardcoded behavior for this Learning Goal." It is recorded once, at context level, in
`learning-goal-authorizations.json` (`contextManipulationRelationships`, `RPC-001~EM-0006`), and it is what lets the
possession game's equal-numbers item defer to the first activity's counts by role (ruling C56). The Performer
Configuration relationship he confirmed in the same sentence is linked when the starting arrangement that needs it is
built. The other names of row 2 stay unlinked, as he asked.

Sources: his reply received 15 October 2026 (`christian-2026-10-16.txt`, verbatim); the reconciliation analysis and its
verification of 15 October 2026 (`f-part-00`, `f-part-07`); the workbook and its projection named above.
