# Codex task 03 — K2: the goal version's penalty-area items

**Read `docs/CODEX-TASK-field-test-00-RULES.md` first.** The governing design is section 4.1 row K2 of
`codex-input/design-field-test-2026-10-27.md`. Baseline snapshot: `codex-output/snap-02.json`.

## Context

A01-R2 is the goal version of A01. It is `basedOn` A01-R1, the zone version, and its ends are EXCHANGED between blocks. Its goal
item is `A01-R2-O1-1`. Its placement item `A01-R2-O4-1` puts the goal at "own end (of team T)" for `ROLE_HOLDER_BUILDING`. Stage
L (commit `5974029`) already taught the renderer to set out a bound region and draw it. This task adds the region's items to
A01-R2's record.

## Build

Add the items for one zone region bound to the goal, in the same style as A01-R2's existing items (find them in its realization
record; grep `A01-R2-O1-1`):

| Item | Value |
|---|---|
| S2 | `'zone'` |
| S4 | includes `penalty-area` |
| S5 | `'own end (of team T)'`, forTeam `ROLE_HOLDER_BUILDING`, offsetM `{0, 9}`. This is the same designation as `A01-R2-O4-1`, so the box stays with the goal under the end exchange. |
| S6 | `'central'`, REQUIRED, 15 |
| S7 | ofObject `{A01-R2-O1-1, pairing FA-MINI-SOCCER-5V5-2026}` |

- **No penalty spot and no goal area.**
- Each item cites his words, copy-pasted:
  - 27 October item 1 (same authorized source);
  - item 1b (the penalty-area geometry comes from the same authorized format);
  - item 3, for leaving the spot out.
- Use the citation style of the existing A01-R2 items.

## Prove

These are TEST-ONLY builds with the real FA entry, on 40 x 30 m:

- The box is placed **0–9 m along** from the goal's end line and **7.5–22.5 m across**: 15 m wide, centred.
- It is at the goal end in **both blocks**. Under EXCHANGED the teams swap ends, but the goal and the box stay put.
- GA-BOUND-REGION passes.
- **Mutations** (revert each):
  - move the box off-centre;
  - give it a width other than 15;
  - give it a depth other than 9.

  Each must be refused at validation.
- Nothing else in A01-R2 changes, and A01-R1 is untouched.

## Expected snapshot delta

None in served keys: A01-R2 is still gapped until K3. Report anything that moves.

Save the snapshot as `codex-output/snap-03.json`.
