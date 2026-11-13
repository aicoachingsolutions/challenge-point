# Game Form Library: provenance

**Status: a factual record. It changes nothing the engine reads.** Written on receipt of Christian's reply filed
30 October 2026 (item 8), which asks that the current eleven-form library be retained with its provenance. No form is
added, removed or edited, and no knowledge file is touched: the Soccer Module's per-row `provenance` cells are left as
they are.

Everything in quotation marks under "His confirmation" is copied from his reply file. Everything else is ours: the
hashes, dates and contents were read from git for this record, at commit `50502a4`.

---

## His confirmation (his reply filed 30 October 2026, item 8)

> "Yes, the ten-form `game_form_library.csv` is the April Game Form Library I was referring to."
>
> "The subsequent Recover & Reorganize addition appears consistent with our later development."
>
> "Please retain the current eleven-form library and its provenance. I see no reason to expand the number of forms at this stage."

## Which file he means: OUR READING, for him to correct

No path named `game_form_library.csv` occurs in any of the repository's 865 commits, and we found no copy from April
in our files.
The ten-form CSV we do hold is `back/src/system/test-library/csv/archetypes.csv` as first committed on 3 May 2026.

**Our reading is that `archetypes.csv` is the file he calls `game_form_library.csv`.** We base it on two things only:
the 3 May file holds exactly ten forms (GF1 to GF10), and it is the earliest Game Form file in the repository,
committed fifteen days after the repository began (18 April 2026), which fits his April date. Nothing records a
renaming, and nothing tells us which of its 19 columns were in his April file. If this identification is wrong, he
should correct it and this record will be changed.

## The eleven forms

| ID | Name | Since |
|---|---|---|
| GF1 | End Zone Games | 3 May 2026 |
| GF2 | Directional Possession Games | 3 May 2026 |
| GF3 | Positional Play Games | 3 May 2026 |
| GF4 | Transition Games | 3 May 2026 |
| GF5 | Overload Games | 3 May 2026 |
| GF6 | Target Games | 3 May 2026 |
| GF7 | Channel Games | 3 May 2026 |
| GF8 | Pressing & Regain Games | 3 May 2026 |
| GF9 | Finishing Games | 3 May 2026 |
| GF10 | Constraint-Driven Free Play | 3 May 2026 |
| GF11 | Recover & Reorganize Games | 17 June 2026 |

## Where each copy lives

| Copy | Path | What it is today |
|---|---|---|
| The CSV | `back/src/system/test-library/csv/archetypes.csv` | The historical source record: GF1-GF10 since 3 May, GF11 added 17 June, unchanged since. Its generator (`generate-data-from-csv.mjs`) is unchanged since 3 May, and the GF11 commit records that it was not re-run. |
| The in-code library | `back/src/system/test-library/archetypes.ts` (`TEST_LIBRARY_V0_ARCHETYPES`) | Generated from the CSV on 3 May, then edited directly in commits of 14 May (twice), 17 June and 29 September; of those edits only GF11's row was also written into the CSV. Still read by `test-library/library/registry.ts` and `rendering/build-activity.ts`. |
| The Soccer Module workbook | `back/data/sport-modules/soccer/soccer-module.rc1-v3.xlsx`, sheet "Game Forms" | Treated as the authority for the Game Forms sheet since his authoring pass was ingested on 4 August (`1c71f9a`). The module declares `game_forms_expected_rows` 11. |
| The Soccer Module JSON | `back/src/system/sport-module/soccer-module.rc1-v3.json`, `game_forms` | What the module loader reads. Module metadata: `module_status` "DRAFT", `legacy_source_version` "TEST_LIBRARY_V0", `approved_by` "TBD". |
| The extraction record | `back/data/sport-modules/soccer/game-forms.extracted.json` | The one-time extraction of 2 August (eleven forms), unchanged since. |

Each of the eleven rows in the module carries the `provenance` cell "Extracted from TEST_LIBRARY_V0_ARCHETYPES via
extract-soccer-game-forms.ts". That cell is left unchanged by this record.

## History

Every commit that changed a form's content in any copy. For the module JSON this was measured by comparing its
`game_forms` section across every commit that touched the file; commits that touched the file but not `game_forms`
are left out. For `archetypes.ts` and the CSV, every commit that touched them is listed. The module workbook was
not compared commit by commit.

| Date (author time) | Commit | What changed |
|---|---|---|
| 2026-04-18 22:17 -0400 | `e60a740fe36dfeaa536f3ee6c3b6b3db9072d461` | "Initial clean repo setup". No Game Form file. |
| 2026-05-03 11:03 -0400 | `3980188a89f873fcc2db664c83a827082644a74a` | "Add Test Library V0 selection engine". `archetypes.csv` committed with GF1-GF10 and 19 columns; `archetypes.ts` generated from it by `generate-data-from-csv.mjs`. The CSV's header row first appears here. |
| 2026-05-14 06:12 -0400 | `37e76d601545d00345f50d1568e7f50ba913bab5` | "Vocabulary bridge (item D) + final scoring cleanup". `archetypes.ts` only: `coachVocabulary` added on nine forms (GF10 has none). |
| 2026-05-14 22:56 -0400 | `806f658a92dc1a287cf540e8d375fde0ca9429b8` | "Item G: surface setup parameters end-to-end (backend + library + frontend)". `archetypes.ts` only: `setupGuidance` added on all ten forms. |
| 2026-06-17 08:00 -0400 | `5f272b9ea4f87b50ade0f6ebe0e3207804c448b1` | "Add Recover & Reorganize archetype (GF11); route Recover Organization to it (C)". One line added to the CSV (GF11), and GF11 added to `archetypes.ts`. The generator was not re-run. |
| 2026-08-02 22:45 -0400 | `63b7aad27614bce4da43ee7e0c06e60d7594a185` | "Soccer Module extraction slice 1 — loader, integrity gate, Game Forms". The eleven forms extracted into the module workbook, the module JSON and `game-forms.extracted.json`. |
| 2026-08-04 06:09 -0400 | `1c71f9a38bb4ed093829879077ff756f013b4a7b` | "Ingest Christian's authoring pass — the workbook is now the authority". In `game_forms`: `canonical_game_archetype_id` and `primary_game_problem_ids` on all eleven, `secondary_game_problem_ids` on all but GF10, and GF10's `coach_vocabulary`. |
| 2026-08-05 18:29 -0400 | `c05c223dbb0fe88f1ef5857e08f207b14ba1eb21` | "Twelfth case FIXED — all 12 decisions reproduce the baseline exactly". Four assembly fields on all eleven: `typical_affordances`, `setup_guidance`, `example_constraint_patterns`, `example_incentive_patterns`. |
| 2026-09-13 19:55 -0400 | `e9545411ebbeedddcf21e1db2af99a2c572cec00` | "Resolve the primary scoring event before generation; guided goals select within their context". `scoring_structure_type` on all eleven. This is the last change to the module workbook. |
| 2026-09-29 14:58 -0400 | `0a3170ea93b9e4fda05070e1d1f6480c745a2ad2` | "Apply the thirteen rulings: envelope bound, AM-04, vocabulary, reason codes". For GF4 and GF8: in the module JSON, `primary_affordance_ids` changed from "exploit_space; fast_attack; regain" to "exploit_space; attack_quickly; regain_possession"; in `archetypes.ts`, `primaryAffordances` changed from `["exploit_space","fast_attack","regain"]` to `["exploit_space","attack_quickly","regain_possession"]`. |

**A difference between the copies (measured for this record).** The 29 September change was made in the module JSON
and `archetypes.ts` only. For GF4 and GF8 the other copies still hold the earlier ids, each in its own form: the
module workbook (Game Forms I6 and I10) "exploit_space; fast_attack; regain"; the CSV the quoted, comma-separated
field "exploit_space, fast_attack, regain"; the extraction record "exploit_space; fast_attack; regain" (it is
unchanged since 2 August, as above). This record reports the difference and does not resolve it. The workbook side of
it, with a third cell outside the Game Forms sheet, is set out under "The workbook and the module JSON" below.

## The workbook and the module JSON: three cells differ (added 31 October 2026)

Added after the record above, at commit `f534a62`; the workbook and JSON blobs are still the ones listed under
"Fingerprints" (`ffe1bec…` and `71b0421…`). Nothing in either file was changed to write it.

**Measured.** The workbook was unzipped and every cell of its six data sheets (Vocabulary, Lenses, Game Forms,
Realizations, Realization Banks, Coverage) and its Metadata sheet was compared with the module JSON, by the same rules
`project-workbook.py` uses (header row from Metadata, blank rows skipped): 7,365 data cells, with the same row counts on
every sheet. Exactly three cells differ:

| Sheet | Cell | Row | Column | Workbook | Module JSON |
|---|---|---|---|---|---|
| Lenses | E4 | `tl-v0-lens-space-exploitation-opportunity` (Space Exploitation Opportunity) | `selection_category_key` | "Create Space" | "Exploit Space" |
| Game Forms | I6 | GF4 (Transition Games) | `primary_affordance_ids` | "exploit_space; fast_attack; regain" | "exploit_space; attack_quickly; regain_possession" |
| Game Forms | I10 | GF8 (Pressing & Regain Games) | `primary_affordance_ids` | "exploit_space; fast_attack; regain" | "exploit_space; attack_quickly; regain_possession" |

Metadata `release_date` also compares unequal in form only: the workbook holds the date serial 46236, styled
`yyyy-mm-dd`, which is 2 August 2026, and the JSON holds the string "2026-08-02 00:00:00" that the projection writes for
it. The neighbouring cells J6 and J10 (`primary_affordance_matching_text`, "exploit space; fast attack; regain") are the
same in both copies; `0a3170e` did not change them.

**Why.** All three cells were changed in the module JSON alone, by `0a3170e` on 29 September 2026, applying his ruling
10 (affordance vocabulary). The decisions it settled are (a) to (c) of "FOUR DECISIONS I WILL NOT MAKE FOR YOU" in our
email of the same day (`email-attachments/christian-2026-09-29b-rulings-applied.txt`): (a) `fast_attack` against
`attack_quickly`, (b) `regain` against `regain_possession`, and (c) the Space Exploitation lens carrying the category
"Create Space", the same as the Space Creation lens. The applied result is recorded in
`docs/audits/rulings-applied-2026-09-29c.md`, section 10: "(a), (b), (c) applied", with the lens's category corrected
from `"Create Space"` to `"Exploit Space"` so that it maps to `exploit_space`, and Space Creation not touched. It was
reported to him in `email-attachments/christian-2026-09-29d-thirteen-rulings.txt`. His reply itself is not filed in
the repository.
The same commit made the same changes in the projections `affordanceLenses.ts` (`category`) and `archetypes.ts`
(`primaryAffordances`). The workbook was not updated: its last change is `e954541` (13 September).

**Which copy governs these three cells.** Until the workbook is updated, the module JSON is authoritative for Lenses E4
and Game Forms I6 and I10. The workbook remains the authority for every other cell, as before.

**What would undo the ruling.**

- Running `project-workbook.py` on the committed workbook rewrites the JSON with the three workbook values above.
- Running `write-workbook.py` writes the Lenses sheet from `lenses.extracted.json`, which is unchanged since `c05c223`
  (5 August) and still holds "Create Space" for this lens. The Game Forms sheet is retired from that writer, so it does
  not touch I6 or I10.

`back/src/system/sport-module/soccer-module-ruling-10.unit.ts`, part of `npm test`, fails if the module JSON, or either
projection, comes back without the three ruling-10 values. When the workbook is updated, the three cells and this
section should be revised together.

## Fingerprints of the CSV

Git stores the CSV with LF line endings. A Windows checkout with `core.autocrlf=true` writes CRLF, so the file on disk
there hashes differently; the git blob and the committed bytes are the stable references.

| Version | Git blob | SHA-1 of the committed bytes | Size | Lines |
|---|---|---|---|---|
| 3 May 2026 (`3980188`), ten forms | `3fbb0db1262ee5390ed32d080c8d4047bc77e6d6` | `f2f2f60744a4e31a09e4de8dbd540af438951d38` | 6589 bytes | 11 |
| 17 June 2026 (`5f272b9`), eleven forms; identical at the time of writing | `53883431440ff89f04ea8bcb86d006fa31e56475` | `8d41ca7db7b9e443d50e1e805971b6273200ac7c` | 7785 bytes | 12 |
| The same, as a Windows CRLF checkout writes it | | `ee8a8f96fb062949349cbcd226a60ceb3773d840` | 7797 bytes | 12 |

The other copies at the time of writing (git blobs): `archetypes.ts` `bfa0bf8e60c7dbd4bea2c89eb1fd4edd84cce208`;
module workbook `ffe1bec9610df97545d845358e79a320cc37308d`; module JSON `71b04211ab5663ac0bcdc0992e356ed32fd38cd4`;
`game-forms.extracted.json` `c95ff466899e830b55ac09d4e98c16af2ff57ce4`.

## Not established

- That `archetypes.csv` is his `game_form_library.csv` (our reading above).
- Which of the CSV's 19 columns were in his April file, and whether the file was renamed when it was committed.
- Who authored the fields other than those his 4 August authoring pass changed.

To check the fingerprints: `git rev-parse <commit>:back/src/system/test-library/csv/archetypes.csv` gives the blob,
and `git cat-file -p <blob> | sha1sum` the SHA-1 of the committed bytes.
