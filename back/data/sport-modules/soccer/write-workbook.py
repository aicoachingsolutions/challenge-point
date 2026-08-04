"""
Soccer Module workbook writer — one-time migration step.

Reads the JSON emitted by the TypeScript extractors and writes it into the governed workbook,
updating the Metadata expected-row counts so the loader's integrity gate has something to check.

Run from the repo root, after the TS extractor:
    python back/data/sport-modules/soccer/write-workbook.py

Deliberately conservative:
  * writes only sheets it has data for, so a partial extraction never blanks a populated sheet;
  * refuses to write a column the workbook does not declare, rather than silently adding one — an
    unrecognised column means the extractor and the schema have diverged, which is exactly the
    failure this whole exercise exists to prevent;
  * updates <sheet>_expected_rows so the loader can detect truncation later.
"""

import json
import pathlib
import sys

import openpyxl

HERE = pathlib.Path(__file__).parent
WORKBOOK = HERE / "soccer-module.rc1-v3.xlsx"
HEADER_ROW = 2  # declared by the workbook's own Metadata sheet

# sheet name -> extracted JSON file
# RETIRED SHEETS. Game Forms and Realizations are now AUTHORED IN THE WORKBOOK — Christian has
# populated coach vocabulary, canonical archetype identifiers and Game Problem mappings that exist
# nowhere in the code. Re-running their extractors would silently destroy that work, so they are
# deliberately not listed here. The extraction scripts remain as the audit trail for how the rows
# were first derived; they must not be used to rewrite these sheets again.
#
# Lenses is still generated, because Christian has not authored into it.
SOURCES = {
    "Lenses": HERE / "lenses.extracted.json",
}


def load_rows(path: pathlib.Path):
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_sheet(worksheet, rows):
    headers = [c.value for c in worksheet[HEADER_ROW]]
    index = {h: i for i, h in enumerate(headers) if h}

    unknown = sorted({k for row in rows for k in row} - set(index))
    if unknown:
        raise SystemExit(
            f"[{worksheet.title}] extractor produced columns the workbook does not declare: {unknown}\n"
            "The extractor and the schema have diverged — fix one of them rather than writing anyway."
        )

    for offset, row in enumerate(rows):
        target = HEADER_ROW + 1 + offset
        for key, value in row.items():
            worksheet.cell(row=target, column=index[key] + 1, value=value if value != "" else None)
    return len(rows)


def update_metadata(worksheet, counts):
    keys = {}
    for r in range(3, worksheet.max_row + 1):
        key = worksheet.cell(row=r, column=1).value
        if key:
            keys[str(key)] = r

    for sheet_name, count in counts.items():
        metadata_key = f"{sheet_name.lower().replace(' ', '_')}_expected_rows"
        if metadata_key in keys:
            worksheet.cell(row=keys[metadata_key], column=2, value=count)
        else:
            print(f"  ! no metadata key '{metadata_key}' to update", file=sys.stderr)


def main():
    workbook = openpyxl.load_workbook(WORKBOOK)
    counts = {}

    for sheet_name, source in SOURCES.items():
        rows = load_rows(source)
        if rows is None:
            print(f"  - {sheet_name}: no extract yet, leaving as-is")
            continue
        counts[sheet_name] = write_sheet(workbook[sheet_name], rows)
        print(f"  + {sheet_name}: wrote {counts[sheet_name]} rows")

    if counts:
        update_metadata(workbook["Metadata"], counts)
        workbook.save(WORKBOOK)
        print(f"Saved {WORKBOOK.name}")
    else:
        print("Nothing to write.")


if __name__ == "__main__":
    main()
