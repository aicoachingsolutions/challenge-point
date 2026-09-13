"""
Representative Performance Context workbook — mechanical resolution of Implementation Staging.

Christian, 2026-09-12: the remaining staging entries are cross-library references to existing
canonical libraries, and he asked that they be resolved mechanically against the existing workbooks.

MECHANICAL MEANS EXACT. His own Workbook Standard, Principle 6 — Fail Loudly: "Missing identifiers,
ambiguous mappings, or unresolved relationships should halt implementation rather than being
silently inferred." And the Library, on a Game Problem it was unsure existed: "otherwise omit
rather than invent." So a candidate resolves only when it names exactly one canonical object under
a rule declared below. "Delay Progression" is not resolved to "Delay the Attack", however close;
closeness is a judgement, and judgements belong to the knowledge owner.

What resolving does, per his Standard:
  * the staging row's mapping_status becomes VERIFIED, with the resolution noted;
  * a Relationships row is appended carrying the canonical id, the intended type and strength, and
    provenance naming the exact source file. Runtime reads Relationships, never staging.
What NOT resolving does: nothing to the relationship data. The staging row keeps NEEDS_CANONICAL_ID
and gains a note saying precisely why — so the remaining list is a set of decisions, not a backlog.

Idempotent: re-running adds nothing twice. Writes the workbook in place (the audited original is in
git history) and a resolution report beside it.

Run from the repo root:
    python back/data/sport-modules/soccer/resolve-rpc-staging.py
"""

import json
import pathlib
import sys

import openpyxl

sys.stdout.reconfigure(encoding="utf-8")

HERE = pathlib.Path(__file__).parent
BACK = pathlib.Path(__file__).parents[3]
WORKBOOK = HERE / "rpc-workbook.rc1.xlsx"
REPORT = HERE / "rpc-staging-resolution.json"

GP_LIBRARY = BACK / "src/system/knowledge-core/gp-library.rc1.json"
SOCCER_MODULE = BACK / "src/system/sport-module/soccer-module.rc1-v3.json"
SESSION_PLANNING = BACK / "src/system/session-planning/session-planning-model.rc1.json"

HEADER_ROW = 1
STAGING_SHEET = "Implementation Staging"
RELATIONSHIPS_SHEET = "Relationships"


def norm(value):
    """Case- and whitespace-insensitive. Deliberately nothing more: no stemming, no synonyms."""
    return " ".join(str(value or "").lower().replace("‑", "-").split())


def build_indexes():
    """name -> [(canonical_id, canonical_name, source)] per target library, with the rule each uses."""
    gp = json.loads(GP_LIBRARY.read_text(encoding="utf-8"))
    sm = json.loads(SOCCER_MODULE.read_text(encoding="utf-8"))
    sp = json.loads(SESSION_PLANNING.read_text(encoding="utf-8"))

    game_problems = {}
    for row in gp["gameProblems"]:
        game_problems.setdefault(norm(row["Name"]), []).append((row["ID"], row["Name"]))

    # The live game forms are all named "<Form> Games"; the Library names them without the suffix.
    # Both spellings of the SAME name are accepted — that is the naming convention, not a synonym.
    game_forms = {}
    for row in sm["game_forms"]:
        name = row["game_form_name"]
        for spelling in {norm(name), norm(name[: -len(" Games")]) if name.endswith(" Games") else norm(name)}:
            game_forms.setdefault(spelling, []).append((row["game_form_id"], name))

    learning_goals = {}
    for row in sp["learning_goals"]:
        learning_goals.setdefault(norm(row["Learning Goal"]), []).append((row["ID"], row["Learning Goal"]))

    return {
        "GAME_PROBLEM": (game_problems, GP_LIBRARY.name, "exact canonical name", len(gp["gameProblems"])),
        "GAME_FORM": (game_forms, SOCCER_MODULE.name, "exact name, with or without the ' Games' suffix", len(sm["game_forms"])),
        "LEARNING_GOAL": (learning_goals, SESSION_PLANNING.name, "exact Learning Goal name", len(sp["learning_goals"])),
        # No canonical library defines affordance targets at this granularity. The Affordance Target
        # Matrix rates Game Problems on four abstract dimensions; the soccer module uses thirteen coarse
        # affordance ids. Neither holds "shooting lane" or "progression lane" as objects.
        "AFFORDANCE": ({}, None, "no canonical affordance-target library at this granularity", 0),
    }


def table(ws):
    headers = [c.value for c in ws[HEADER_ROW]]
    index = {str(h): i for i, h in enumerate(headers) if h}
    return headers, index


def main():
    indexes = build_indexes()
    wb = openpyxl.load_workbook(WORKBOOK)
    for required in (STAGING_SHEET, RELATIONSHIPS_SHEET):
        if required not in wb.sheetnames:
            raise SystemExit(f"Workbook is missing required sheet: {required}")

    staging = wb[STAGING_SHEET]
    relationships = wb[RELATIONSHIPS_SHEET]
    _, st = table(staging)
    rel_headers, rl = table(relationships)
    for col in ("mapping_id", "rpc_id", "target_library", "candidate_name", "intended_relationship_type",
                "intended_strength", "mapping_status", "notes"):
        if col not in st:
            raise SystemExit(f"Staging sheet has no '{col}' column; refusing to guess its position.")

    existing = set()
    max_rel = 0
    for row in relationships.iter_rows(min_row=HEADER_ROW + 1, values_only=True):
        if not row or row[rl["relationship_id"]] in (None, ""):
            continue
        existing.add((row[rl["rpc_id"]], row[rl["related_library"]], row[rl["related_id"]], row[rl["relationship_strength"]]))
        max_rel = max(max_rel, int(str(row[rl["relationship_id"]]).split("-")[-1]))

    report = []
    for r in range(HEADER_ROW + 1, staging.max_row + 1):
        cell = lambda col: staging.cell(row=r, column=st[col] + 1)
        mapping_id = cell("mapping_id").value
        if mapping_id in (None, ""):
            continue
        library = cell("target_library").value
        candidate = cell("candidate_name").value
        status = cell("mapping_status").value

        if status == "VERIFIED":
            report.append({"mapping_id": mapping_id, "outcome": "ALREADY_VERIFIED"})
            continue

        if library not in indexes:
            raise SystemExit(f"{mapping_id}: unknown target_library '{library}' — not guessing where it points.")

        index, source, rule, size = indexes[library]
        hits = index.get(norm(candidate), [])
        distinct = sorted(set(hits))

        if len(distinct) == 1:
            canonical_id, canonical_name = distinct[0]
            key = (cell("rpc_id").value, library, canonical_id, cell("intended_strength").value)
            if key not in existing:
                max_rel += 1
                rel_id = f"RPC-REL-{max_rel:03d}"
                values = {
                    "relationship_id": rel_id,
                    "rpc_id": cell("rpc_id").value,
                    "related_library": library,
                    "related_id": canonical_id,
                    "relationship_type": cell("intended_relationship_type").value,
                    "relationship_strength": cell("intended_strength").value,
                    "status": "ACTIVE",
                    "provenance": f"Mechanical resolution of {mapping_id} against {source}",
                    "notes": f"Resolved '{candidate}' to '{canonical_name}' by rule: {rule}.",
                }
                relationships.append([values.get(str(h), None) for h in rel_headers])
                existing.add(key)
            else:
                rel_id = "(existing relationship)"
            cell("mapping_status").value = "VERIFIED"
            cell("notes").value = f"Resolved to {canonical_id} ('{canonical_name}') as {rel_id}."
            report.append({"mapping_id": mapping_id, "rpc_id": cell("rpc_id").value, "library": library,
                           "candidate": candidate, "outcome": "VERIFIED", "canonical_id": canonical_id,
                           "canonical_name": canonical_name, "relationship_id": rel_id})
        else:
            if library == "AFFORDANCE":
                reason = ("No canonical affordance-target library exists at this granularity: the Affordance "
                          "Target Matrix rates Game Problems on four abstract dimensions, and the soccer module "
                          "uses thirteen coarse affordance ids.")
            elif len(distinct) > 1:
                reason = f"Ambiguous: '{candidate}' names {len(distinct)} canonical objects in {source}: {distinct}."
            else:
                reason = f"No object named '{candidate}' exists in {source} ({size} canonical objects; rule: {rule})."
            cell("notes").value = f"Mechanical resolution: {reason}"
            report.append({"mapping_id": mapping_id, "rpc_id": cell("rpc_id").value, "library": library,
                           "candidate": candidate, "outcome": "UNRESOLVED", "reason": reason})

    wb.save(WORKBOOK)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    summary = {}
    for item in report:
        lib = item.get("library", "(already verified)")
        summary.setdefault(lib, {"VERIFIED": 0, "UNRESOLVED": 0, "ALREADY_VERIFIED": 0})[item["outcome"]] += 1
    print("Resolution by target library:")
    for lib, counts in summary.items():
        print(f"  {lib:16} verified {counts['VERIFIED']:3}   unresolved {counts['UNRESOLVED']:3}   already {counts['ALREADY_VERIFIED']:3}")
    print(f"Relationships now: {len(existing)}. Wrote {WORKBOOK.name} and {REPORT.name}.")


if __name__ == "__main__":
    main()
