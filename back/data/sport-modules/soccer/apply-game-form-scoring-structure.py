"""
Record which observable scoring events each Representative Game Form physically provides.

Christian, 2026-09-13, approved the chain: realized Game Form -> physically available scoring
events -> RPC / Primary Scoring Identity -> selected primary scoring event. The first link is the
Game Form's, so it is written into the Sport Module's existing `scoring_structure_type` column,
which was present on all 11 Game Forms, empty, and read by nothing. No schema change.

WHAT GOES IN THE COLUMN: only objects the game form's AUTHORED setup guidance marks out, as ordered
`scoring_event` values from the RPC workbook's controlled vocabulary, joined by "; ". "none" means
the setup authors no scoring object. That is a decision, distinct from not having looked.

WHAT DOES NOT: regain and denial. Every game form is a live two-team contest, so a change of
possession always exists, and denial is defined over a progression object. The resolver derives both,
rather than asserting them per row.

Evidence for each value, from the authored setup guidance (see the review draft
primary-scoring-events.rc1.1-PROPOSED.xlsx, sheet "Game Form Evidence"):
  GF1  End Zone             "target zones at both ends"                   -> zone, line
  GF2  Directional Poss.    "a directional target line or zone at one end" -> line, zone
  GF3  Positional Play      "a positional grid (3 zones x 3 channels)"     -> zone, line
  GF4  Transition           "two-goal ... field with a midline marker"     -> goal, line
  GF5  Overload             "mark the contest area"                        -> none
  GF6  Target               "target player(s) at one or both ends"         -> target player
  GF7  Channel              "3 or 5 lengthwise channels" (lanes, not ends) -> none
  GF8  Pressing & Regain    "a marked midline"                             -> line
  GF9  Finishing            "goals at both ends, goalkeepers active"       -> goal
  GF10 Constraint-Driven    "open field"                                   -> none
  GF11 Recover & Reorganize "real goal or target; recovery line; space"    -> goal, target player, line, zone

Channel Games and Finishing through Positional Play are the two gaps Christian asked to be CLOSED
rather than worked around. They are closed by explicit realization coverage in the resolver
(system/sport-module/primary-scoring.ts), not by claiming here that the game form already provides
an object it does not.

Idempotent. Run from the repo root, then project:
    python back/data/sport-modules/soccer/apply-game-form-scoring-structure.py
    python back/data/sport-modules/soccer/project-workbook.py
"""

import pathlib
import sys

import openpyxl

sys.stdout.reconfigure(encoding="utf-8")

HERE = pathlib.Path(__file__).parent
WORKBOOK = HERE / "soccer-module.rc1-v3.xlsx"
SHEET = "Game Forms"
COLUMN = "scoring_structure_type"

STRUCTURE = {
    "GF1": "target_zone_entered; line_crossed",
    "GF2": "line_crossed; target_zone_entered",
    "GF3": "target_zone_entered; line_crossed",
    "GF4": "goal; line_crossed",
    "GF5": "none",
    "GF6": "target_player",
    "GF7": "none",
    "GF8": "line_crossed",
    "GF9": "goal",
    "GF10": "none",
    "GF11": "goal; target_player; line_crossed; target_zone_entered",
}


def fail(message):
    raise SystemExit(f"STOPPED — {message}")


def main():
    wb = openpyxl.load_workbook(WORKBOOK)
    meta = wb["Metadata"]
    header_row = None
    for r in range(1, meta.max_row + 1):
        if meta.cell(row=r, column=1).value == "game_forms_header_row":
            header_row = int(meta.cell(row=r, column=2).value)
    if header_row is None:
        fail("Metadata has no game_forms_header_row.")

    ws = wb[SHEET]
    headers = [c.value for c in ws[header_row]]
    if COLUMN not in headers or "game_form_id" not in headers:
        fail(f"'{SHEET}' header row {header_row} lacks '{COLUMN}' or 'game_form_id'.")
    col = headers.index(COLUMN) + 1
    id_col = headers.index("game_form_id") + 1

    seen, written, already = set(), 0, 0
    for r in range(header_row + 1, ws.max_row + 1):
        game_form_id = ws.cell(row=r, column=id_col).value
        if game_form_id is None:
            continue
        if game_form_id not in STRUCTURE:
            fail(f"{game_form_id} has no decided scoring structure.")
        seen.add(game_form_id)
        cell = ws.cell(row=r, column=col)
        current = cell.value
        if current == STRUCTURE[game_form_id]:
            already += 1
            continue
        if current not in (None, ""):
            fail(f"{game_form_id} already has scoring_structure_type '{current}', not '{STRUCTURE[game_form_id]}'.")
        cell.value = STRUCTURE[game_form_id]
        written += 1
    missing = set(STRUCTURE) - seen
    if missing:
        fail(f"game forms not found in the sheet: {sorted(missing)}")

    wb.save(WORKBOOK)
    print(f"scoring_structure_type written for {written} game forms; already set for {already}.")


if __name__ == "__main__":
    main()
