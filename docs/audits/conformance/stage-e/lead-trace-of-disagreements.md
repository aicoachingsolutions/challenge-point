# Lead's trace of the ten deriver disagreements (for the judge; the independent tracer does not see this)

210 lines were judged by both derivers. They gave the same verdict on 208 (99.0%), and the same verdict
and reason code on 204 (97.1%). Forward results agree on 162 of 166 items. Every disagreement traces to
one of four named gaps in the reading rules.

| Disagreement | A | B | Cause |
|---|---|---|---|
| L79 (J3 = TEAM_A) | NOT_AUTHORED(DECLARED_GAP) | RESOLVED:ENTAILED via RPC-001-11.a, BUILD_OUT_TEAM read as Team A | **G1** — a team designation on a static row. A matched no element; B mapped BUILD_OUT_TEAM to Team A at START |
| Forward RPC-001-08.c | UNMET | SATISFIED | G1, same cause |
| Forward RPC-001-11.a | UNMET | SATISFIED | G1, same cause |
| L157 (turnover T6 = STOP_RESUME) | INVENTED | NOT_AUTHORED(ENGINE_ONLY) | **G2** — when a citable SD (SD-20 → CONTINUE) supplies a different value and the stated value rests only on engine wording, is the stated value INVENTED or NOT_AUTHORED(ENGINE_ONLY)? Both block rendering |
| L44 (P4 none) | NOT_AUTHORED(ENGINE_ONLY) | NOT_AUTHORED(COVERAGE) | **G3** — reason codes have no precedence |
| L94 (J6) | NOT_AUTHORED(ASSUMED_ONLY) | NOT_AUTHORED(DECLARED_GAP) | G3 |
| L100 (J11a unstated) | NOT_AUTHORED(COVERAGE) | NOT_AUTHORED(ALTERNATIVES) | G3 |
| L161 (V2 = 1) | NOT_AUTHORED(DECLARED_GAP) | NOT_AUTHORED(ENGINE_ONLY) | G3 |
| Forward VARTARGET-05.b | VIOLATED | SATISFIED | **G4** — RC-35 does not say what an item gets when its element matches but the value is absent, or how SUPPORTING items are reported |
| Forward VARTARGET-13.d | VIOLATED | UNMET | G4 |

**The four gaps:**
- **G1** is the same gap stage E1 found independently (entry #3). Its fix changes slice verdicts, so it
  goes to Christian first.
- **G2, G3 and G4** are LOCAL clarifications:
  - **G2:** a stated value contradicted by an entailing source is INVENTED. ENGINE_ONLY is a reason only
    where nothing else supplies the row.
  - **G3:** an order among the reason codes.
  - **G4:** a matched element with an absent value gives UNMET. A SUPPORTING item is never VIOLATED or
    UNMET for absence.

**No disagreement is a reader error** that the rules settle one way.
