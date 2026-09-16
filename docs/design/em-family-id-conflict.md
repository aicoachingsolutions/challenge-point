# Environmental Manipulation family IDs — the conflicting rows

For Christian's reconciliation, 15 September 2026. Neither version is bound until he reconciles them
against the canonical source. Nothing here changes either artifact.

---

## Artifact A — Environmental Manipulation Knowledge Schema v2.0 (RC1 Candidate)

- **File:** `back/data/knowledge-core/Environmental_Manipulation_Knowledge_Schema_v2.0_RC1_Candidate.xlsx`
- **Where:** sheet *Family Registry*, rows 5–10.
- **Version Metadata:**
  - Schema_Version `2.0-RC1-Candidate`;
  - Generated_Date `2026-07-12`;
  - Canonicality "Canonical implementation representation";
  - Library_Status "Six-family RC1 architecture stable; population continuing";
  - **Supersedes** `Environmental_Manipulation_Implementation_Workbook_Package_1.1_RC1_Candidate.xlsx`.

| Row | Family_ID | Family_Name | Ownership_Definition | Status | Knowledge Objects assigned |
|---|---|---|---|---|---|
| 5 | EMF-01 | Playing Area Geometry | Owns the physical extent and geometric characteristics of the playing environment. | RC1 Stable | EM-0001 |
| 6 | EMF-02 | Spatial Organization | Owns the spatial pose of performers, objectives, and environmental objects. | RC1 Stable | EM-0002, EM-0003, EM-0004 |
| 7 | EMF-03 | Performer Availability | Owns participant composition and current participation state. | RC1 Stable | EM-0006, EM-0007 |
| 8 | EMF-04 | Objective Structure | Owns objective composition and current functional state. | RC1 Stable | EM-0009, EM-0010 |
| 9 | EMF-05 | Environmental Objects | Owns physical entities intentionally introduced into the performance environment. | RC1 Stable | EM-0008, EM-0011 |
| 10 | EMF-06 | Playing Surface | Owns the physical interaction characteristics of the supporting surface. | RC1 Stable | EM-0005 |

## Artifact B — Game Archetype Workbook RC1.1

- **File:** `back/data/knowledge-core/Game_Archetype_Workbook_RC1.1.xlsx`
- **Where:** sheet *Knowledge*, rows 152–187 (Record_ID GAK-0151 to GAK-0186).
  - Knowledge_Type `EM_FAMILY_RELATIONSHIP`;
  - Target_Domain "Environmental Manipulation Family";
  - one row per archetype per family (6 × 6).
- **Metadata:**
  - Workbook_Version `1.0-RC1.1`;
  - Release_Date `2026-07-21`;
  - Canonical_Source_Status "Canonical machine representation for the Game Archetype Library RC1.1";
  - Expected_EM_Family_Relationship_Rows `36`.
- **Provenance:** every one of the 36 rows gives "Environmental Manipulation Library RC1 + Game
  Archetype Canonical Reference v1.0", Version `1.0`.

| Target_ID | Target_Name | GA-001 | GA-002 | GA-003 | GA-004 | GA-005 | GA-006 |
|---|---|---|---|---|---|---|---|
| EMF-001 | Playing Area Geometry | r152 GAK-0151 | r158 GAK-0157 | r164 GAK-0163 | r170 GAK-0169 | r176 GAK-0175 | r182 GAK-0181 |
| EMF-002 | Spatial Organization | r153 GAK-0152 | r159 GAK-0158 | r165 GAK-0164 | r171 GAK-0170 | r177 GAK-0176 | r183 GAK-0182 |
| EMF-003 | Performer Availability | r154 GAK-0153 | r160 GAK-0159 | r166 GAK-0165 | r172 GAK-0171 | r178 GAK-0177 | r184 GAK-0183 |
| EMF-004 | Objective Structure | r155 GAK-0154 | r161 GAK-0160 | r167 GAK-0166 | r173 GAK-0172 | r179 GAK-0178 | r185 GAK-0184 |
| EMF-005 | Transition Triggers | r156 GAK-0155 | r162 GAK-0161 | r168 GAK-0167 | r174 GAK-0173 | r180 GAK-0179 | r186 GAK-0185 |
| EMF-006 | Environmental Elements | r157 GAK-0156 | r163 GAK-0162 | r169 GAK-0168 | r175 GAK-0174 | r181 GAK-0180 | r187 GAK-0186 |

Most statements take the standard form "*<family>* can be used broadly within *<archetype>* when the
Constitutive Configuration remains active." These rows do not:

| Record | Archetype | Family | Statement form |
|---|---|---|---|
| GAK-0156 | GA-001 Invasion | EMF-006 Environmental Elements | can be used, but its expression must preserve adaptive opposition… |
| GAK-0159 | GA-002 Net/Wall | EMF-003 Performer Availability | can be used, but its expression must preserve adaptive opposition… |
| GAK-0161 | GA-002 Net/Wall | EMF-005 Transition Triggers | can be used, but its expression must preserve adaptive opposition… |
| GAK-0172 | GA-004 Pursuit–Evasion | EMF-004 Objective Structure | can be used, but its expression must preserve adaptive opposition… |
| GAK-0177 | GA-005 State Construction | EMF-003 Performer Availability | can be used, but its expression must preserve adaptive opposition… |
| GAK-0179 | GA-005 State Construction | EMF-005 Transition Triggers | materially influences the identity boundary; changes require explicit Organizational… |
| GAK-0184 | GA-006 Retention | EMF-004 Objective Structure | materially influences the identity boundary; changes require explicit Organizational… |
| GAK-0186 | GA-006 Retention | EMF-006 Environmental Elements | can be used, but its expression must preserve adaptive opposition… |

Statements are shortened here. The full text is in the Knowledge_Statement column.

## Side by side

| Position | Schema v2.0 (A) | Archetype Workbook RC1.1 (B) | Differs in |
|---|---|---|---|
| 1 | EMF-01 Playing Area Geometry | EMF-001 Playing Area Geometry | ID format |
| 2 | EMF-02 Spatial Organization | EMF-002 Spatial Organization | ID format |
| 3 | EMF-03 Performer Availability | EMF-003 Performer Availability | ID format |
| 4 | EMF-04 Objective Structure | EMF-004 Objective Structure | ID format |
| 5 | EMF-05 Environmental Objects | EMF-005 Transition Triggers | ID format and name |
| 6 | EMF-06 Playing Surface | EMF-006 Environmental Elements | ID format and name |

Artifact A has no family named Transition Triggers or Environmental Elements. Artifact B has no family
named Environmental Objects or Playing Surface.

## Where each version is used in the product

- **Artifact A.**
  - Projected to `back/src/system/knowledge-core/em-schema.v2.0-rc1.json`.
  - Loaded by `em-canonical.ts`, which checks knowledge object → family *within the Schema only*.
  - `knowledge-objects.ts` lists the family names from this version.
  - Runtime use: its version string only.
- **Artifact B.**
  - Projected to `back/src/system/knowledge-core/game-archetype-workbook.rc1.1.json`.
  - Loaded by `game-archetype-library.ts`, which checks the *count* of family relationship rows (36)
    but not their IDs. The workbook's own referential-integrity rules cover archetypes and game
    problems only.
  - Runtime use: an integrity check.
- **Nothing compares the two,** which is how the mismatch went unnoticed.
- **Missing source documents:** neither the "Environmental Manipulation Library RC1" cited in B's
  provenance, nor the Implementation Workbook Package 1.1 that A supersedes, is in the repository or
  among the files received so far.

## What reconciliation needs

1. The canonical owner of family IDs and names. The expectation is the Environmental Manipulation RC1
   library.
2. Whether Transition Triggers and Environmental Elements are families in that library, and what that
   means for Environmental Objects and Playing Surface.
3. Then which artifact changes. Until then, no realization requirement binds a family ID from either.
