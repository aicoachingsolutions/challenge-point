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
| 2026-09-29 14:58 -0400 | `0a3170ea93b9e4fda05070e1d1f6480c745a2ad2` | "Apply the thirteen rulings: envelope bound, AM-04, vocabulary, reason codes". GF4 and GF8 `primary_affordance_ids` changed from "exploit_space; fast_attack; regain" to "exploit_space; attack_quickly; regain_possession" in the module JSON and in `archetypes.ts`. |

**A difference between the copies (measured for this record).** The 29 September change was made in the module JSON
and `archetypes.ts` only. The module workbook (Game Forms I6 and I10) and the CSV still hold
"exploit_space; fast_attack; regain" for GF4 and GF8. This record reports the difference and does not resolve it.

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
