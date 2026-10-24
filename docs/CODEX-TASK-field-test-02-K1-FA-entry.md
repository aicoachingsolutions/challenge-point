# Codex task 02 — K1: the FA 5v5 knowledge entry, and suitability that reads the goal type

**Read `docs/CODEX-TASK-field-test-00-RULES.md` first.** The governing design is section 4.1 row K1 and sections 1.1–1.7 of
`codex-input/design-field-test-2026-10-27.md`. Baseline snapshot: `codex-output/snap-01.json`.

## The verified source (already checked by Claude; do not re-derive)

- **Document:** "The Mini-Soccer and Youth Futsal Handbook" (England Football / The FA), version updated August 2026
  (2026/2027 season), Mini-Soccer Law 1, 5v5.
- **URL:** https://cdn.englandfootball.com/-/media/EnglandFootball/Files/play-and-participate/youth-football/Mini-Soccer-Handbook-2026-27.pdf
- **Goal:** 12 ft x 6 ft. The document gives feet only. Record it as widthM 3.6576 and heightM 1.8288 (1 ft = 0.3048 m, exact).
- **Penalty area:** 15 m wide x 9 m deep, centred on the goal.
- **Penalty mark:** 6 m. Record it as the document gives it, but it is **not marked and not used** (his 27 October item 3).
- **Caveat for the note:** the 9 m depth may be a misprint. The 2025 edition gave 9 yd (8.2296 m); The FA's 2012 metric guide
  gave 8 m. We use 9 m as printed.
- Record **only** the 5v5 entry. Do not mix it with the 7v7 format or the older editions. GA-BOUND-REGION refuses two entries that
  match one width and type.

## Build

1. **The pairing entry.** Add it to the soccer Sport Profile's `boundRegions.pairings`, next to the existing `IFAB-LAW-1` entry,
   in the IFAB entry's shape. The design's section 1.6 gives it field by field: id `FA-MINI-SOCCER-5V5-2026`, object
   `{kind goal, type 'scaled', widthM 3.6576, heightM 1.8288}`, region `{penalty-area, widthM 15, depthM 9}`, markM 6, and the
   note. Use only fields the existing `BoundRegionPairing` type and its loader accept. If 1.6 names a field the type lacks, leave
   it out and report it. Its authority words are his 27 October item 1 sentences, copy-pasted:
   - "Please verify the applicable FA specification and keep the goal, penalty area, and penalty spot dimensions from the same
     authorized source rather than combining unrelated formats."
   - "Let's treat the proposed configuration as an initial field-test candidate rather than assuming it is optimal."
2. **The pairing rule's reason.** Restate `BOUND-REGION-GOAL.because` (grep for it) from "our reading" to his item 1b words:
   "a goal's penalty-area geometry should ordinarily come from the same authorized format. Any exception should be explicit and
   supported by the intended learning design."
3. **Suitability reads attributes.** `ObjectSuitability` gains `attributes` (for example `{ type: ['scaled'] }`).
   - In `corpus.ts`, `suitabilityRefusals` checks each attribute name and value against the register's
     `sessionResources.attributes`. An unlisted name or value is a validation refusal.
   - In `assemble-concrete-game.ts`, `objectAvailabilityRefusal` reads the stated attribute value **before** the width:
     - a stated value that is off the list gives `OBJECT_NOT_SUITABLE` (decided);
     - an unstated value, with the width matching, means the coach is asked through the existing ATTRIBUTE question.
   - Stage I's open issue: extend `choicesSuitedTo` the same way, so the choice list's naming filter also reads attributes.
4. **A01-R2's suitability.** Set A01-R2's `objectSuitability` to `{kind goal, attributes {type ['scaled']}, widthM min = max
   = 3.6576}`. Cite his item 1 words (above) and his 27 October item 6 words: "A mini-goal is not automatically equivalent to an
   appropriate goalkeeper-defended goal." Add a data test pinning A01-R2's suitability equal to the FA entry's object, so the two
   can never drift apart.
5. **The mark** is recorded but never drawn, placed or mentioned in coach text. Add a test for this.

## Prove (tests on the built bundle where they touch serving)

- A session with one FA goal (type scaled, 3.6576 m): A01-R2 passes suitability. A01-R2 is still not served until K3; it still
  has its gaps.
- A full-size goal, a mini-goal at any width (including 3.6576 m), or another width (including 3.66 m) each give
  `OBJECT_NOT_SUITABLE`. A01 falls back to the zone version (A01-R1), and the reason appears in the closed panel.
- 3.6576 m with the type not stated: the coach is asked the type.
- **Mutation:** drop `attributes` from A01-R2's suitability. A 3.6576 m mini-goal must then be refused by GA-BOUND-REGION as
  `BOUND_REGION_NOT_AUTHORIZED`, which shows why the attributes are needed. Revert the mutation.
- The production choice list now includes the FA goal, labelled "12 ft x 6 ft (3.6576 m x 1.8288 m)".

## Expected snapshot delta

- `session/object-choices` gains the FA choice.
- No A01 key changes, because A01-R2 is still gapped.
- Report any other key that moves.

Save the snapshot as `codex-output/snap-02.json`.
