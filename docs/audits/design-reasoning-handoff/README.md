# Design reasoning: the isolated reusable configuration handoff

**Standing.** Review evidence only. TEST-ONLY. Isolated: nothing a coach or an administrator can reach runs it. Not deployed. Not merged: the branch `claude/reusable-config-handoff` has no pull request, and the standing auto-merge practice does not apply to it. Not an authorization, not approved wording, not a selection input. Christian authorized it in Christian's first reply of 7 November 2026 (received 7 November 2026; filed in the sources repository as `sources/2026-11-07-handoff-authorization/originals/christian-reply-to-reusable-configuration-proposal.txt`): "This authorization is for an isolated development pathway only." and "You may reuse and extend existing code where necessary, provided the new behavior remains unavailable to live coaches and does not change the existing application or A01's checked behavior."

**Quotation marks.** Double: Christian's words, verbatim. Single: ours (labels, record text, values, code).

## What the handoff is

The review pathway's Steps 1 and 2 (the resolved context and Game Problems; the Game Form result) handed to the checked configuration and rendering chain (`buildActivityUnderAuthorizationRecords`, the TEST-ONLY entry), case by case, with no separately hand-authored activity record. In Christian's four verbs:

- **Receive** a case: the Learning Goal; Step 1 and Step 2, run by the handoff, never copied from data; the case's inputs (session, Christian's words and how each enters the chain, illustrative values and TEST-ONLY treatments, each labelled).
- **Determine** the form: Step 2's SELECTED form, or, where Step 2 leaves compatible alternatives, only a form the inputs name with a stated basis (an illustrative choice a filed ruling permits, or our logical inference), checked among the compatible forms; the others retained with no preference; with no named form the run stops ('alternatives retained; no basis to select'). The chain's own keyword-scorer pick is recorded as not used.
- **Produce**: a TEST-ONLY in-memory record and realization from the case's rulings, the DRAFT store where the context has no contract, choices for open lines, labelled stand-in items, decision 1's review-only wording; the chain builds; the handoff reads back the lines, the sentences with their from-paths, the laws and requirement accounts, the diagram model and any refusal.
- **Preserve**: every line graded by its determining premises (our grading map, in Christian's six classes), every sentence by the lines its from-paths join; decision kinds A, B and C per line (OURS, for Christian's review); refusals, gaps, alternatives, illustrative values and TEST-ONLY treatments listed apart; on every configuration: 'Productive, recurring opportunities to meet the intended Game Problem: not established (no approved relationship ties a Game Problem to any line)'.

A manipulation is applied only on an authorized relationship (in a test only, on a labelled TEST-ONLY stand-in, class 4 'TEST ASSUMPTION', never knowledge); otherwise it is reported as 'no authorized relationship' and the configuration is unchanged. A value proposed for a line is applied only as an ILLUSTRATIVE supplied choice, never over a line a ruling of Christian's closes (it is then reported as contrary to that ruling). A Game Problem put into the TEST-ONLY record in a test is reported as a mismatch with Step 1, never switched.

This is reusable assembly, not knowledge-authorized selection. Christian's words: "At present, the resolved A05 Game Problems do not determine the activity's environmental configuration through approved Create Space relationships." The evidence keeps that gap visible on every configuration and in Test B2, which swaps the Game Problem and shows the configuration unchanged.

## Files

| File | What it is |
| --- | --- |
| `back/src/system/design-reasoning/handoff.ts` (stage file, 1521 lines) | The mechanism: input types and the hand validator; the injected chain interface (no import of the chain); Receive, Determine, Produce, Preserve; the grading map; decision kinds; the refusal reading (what each refusal rests on); `compareResults` (what changed between a case and a variant). Names no goal, knowledge or data id and no sport word. |
| `back/src/system/design-reasoning/handoff-report.ts` (stage file, 309 lines) | The plain-text report: the frame, the Tests section, the refusals section, Christian's words cited, every case. |
| `back/src/system/design-reasoning/handoff-inputs.review.json` (data, 1524 lines) | The cases' inputs: 28 entries of Christian's words (verbatim, file, received date, provisional flag, scope), 7 cases (A05-0, A05-1, A05-2, A01, GF2-ZONES, GF2-LINES, TA01), the grading tables. Not an activity record: no value for a feature that knowledge, the session or the coach settles, and no sentence. |
| `back/src/system/design-reasoning/handoff.unit.ts` (1353 lines, registered) | Wires the real chain into the mechanism; runs the cases and the 36 listed tests (F, A, B, C, R, P, E); writes or compares the evidence. |
| `back/src/system/rendering/review-structure-wording.ts` and `.unit.ts` | Decision 1: the TEST-ONLY review-only wording for reciprocal end zones, injected through one TEST-ONLY option of `build-activity.ts` (S2). |
| `back/src/system/derivation/gf4-example-incentives.unit.ts` and `docs/audits/conformance/stage-b/corpus-restatements.json` | Decision 2: GF4's example incentives restated TYPICAL_EXAMPLE and their example-only claims NON_CLAIMED, in the restatement file only (S1). |
| `evidence/handoff-report.txt` | The report (2381 lines). |
| `evidence/handoff-results.json` | Every case's full result, every test's record, every comparison and every refusal's reading (15405 lines). |
| `evidence/regression-record.json` | PLACEHOLDER: 'NOT YET RECORDED for this build'. The lead runs the regression on the committed tree and records it in the commit on top, with no code or data change. |

The report holds, in order: what this is; Christian's six classes; the grading map (OURS); the decision-kind rule and the examination of the existing structures (OURS); the input counts; **TESTS** (each test with what it shows, what was measured, and three standings kept apart: implemented, passing engineering test, ecological suitability not established); **REFUSALS AND WHAT THEY REST ON** (Christian's second reply of 7 November, section 2: each refusal in the evidence, the items it cites, their basis, a verdict RESTATEMENT-ONLY, MIXED or NOT KNOWLEDGE, and whether it obstructs the configuration pathway; OURS; it changes no check: "No changes to validation behavior are authorized by this email."); Christian's words cited; then every case (inputs, Step 1, Step 2, form decision, manipulations and proposed values, the chain, configuration lines, coach text, diagram, laws account, requirement account, refusal and what it rests on, gaps, illustrative values, TEST-ONLY treatments, not carried, and the opportunities line).

No server-side SVG exists for the checked coach diagram (it is drawn in the browser), so the evidence carries the diagram model (area, counts, legend, zones, verdict, findings) and no picture.

## How to run and regenerate

From `back/`:

- The tests and the evidence check: `node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/handoff.unit.ts` (also in `npm test`). It fails if the committed evidence differs from what it generates.
- Regenerate the evidence: the same command with the environment variable `UPDATE_HANDOFF_EVIDENCE=1` (PowerShell: `$env:UPDATE_HANDOFF_EVIDENCE='1'` first; Git Bash: prefix the command). The evidence is generated twice inside the test and must be identical; no time stamp is written.
- No runner exists: the draft store cannot be loaded by a runner, so the unit test is the only place the mechanism meets the chain.

## The A05 inputs against the hand-authored record

- The handoff's A05 cases (A05-0, A05-1, A05-2) hold 26 of Christian's rulings (13 entering the chain, 13 report only), 6 illustrative values, 6 TEST-ONLY treatments, 3 supplied choices and 2 stand-in items, and no sentence.
- The hand-authored A05 review record of the assembly experiment held 57 activity values and 47 coach-text templates (its sentences and notes), every one entered by hand.
- 8 of the record's values are routine choices by our reading (kind C: the end-line restart's location and receiving distance, the duration split into blocks, block minutes and breaks, bibs, markers, spare balls); the handoff holds no value for them and leaves them to the coach.
- The handoff's coach text is the checked renderer's, plus decision 1's generic review-only zone sentence.

## Known limitations

- **A05 itself does not generate.** A05-0 (the knowledge as it stands) is refused at structure on the drafted origin and control lines; A05-1 (the provisional state reading as a TEST-ONLY treatment) at structure on the drafted control line alone (its V5 referent item does not exist). Both refusals are RESTATEMENT-ONLY: they rest only on our DRAFT contract items. A05-2, the only A05 run that reaches text, is CONDITIONAL on the 13 September verification and is never A05's result.
- **No Game Problem determines any line** (Christian's section 12 gap). Test B2 swaps the record's Game Problem to Gain Access, a candidate, and the configuration is identical.
- **The coach-served end-line restart does not compose from Christian's words** (Test R1, A05-1 and A05-2): the restart's episode line is neither chosen nor claimed, and no ruling says whether the restart begins an episode. With a diagnostic TEST ASSUMPTION for it, the build stops at communication: the checked renderer names no coach as taker and has no served-ball phrase. No engine feature and no DRAFT restart sentence were built; the restart is described in the report only.
- **A record cannot authorize one manipulation alone** (Test B1c): selection refuses (no compatible combination). An applied manipulation is therefore placed in the selection explicitly, as the form is, and the record's authorized set is left as ruled. With the Wide Zone Advantage placed, the text is served and the checked coach diagram is withheld (its rule D0: a channel width the coach chooses within a range is not drawn at one size). The variable target condition does not compose with GF2 here (refused at structure on our restated items).
- **The starting condition read as the state of the attack has no structural carrier**; it is carried only as the labelled withholding of the origin items.
- **The kick-off's centre mark has no register row**: the law's adaptation is owed and reported under the TEST-ONLY realization's REPORT check, held by the test to our DRAFT classification.
- **The illustrative zone depth** enters as two stand-in items, which the chain treats as authored; the ILLUSTRATIVE label is the handoff's, printed on every sentence citing the zones' depth.
- **GF4 still does not generate** (Test C2): after decision 2 it stops at structure on its trigger reachability alone (its teams are an assumption of our restatement). The four GF4 goals stop earlier, at knowledge (their contexts have no contract; Test C3, and D02 in C4); our 6 November proposal said 'at the structural check'.
- **The structural cases run through a vehicle** (the TA02 DRAFT record with its context removed, and a TEST-ONLY classification with the law of offside procedural), because the TEST-ONLY entry takes only a Learning Goal request.
- **The refusal reading** names, for each cited line, the item that establishes its element; the item whose bound a check applied may be another, which it does not name.
- Some A01 from-paths (layout marks and zones) join no line and are printed as such; the purpose's approval evidence is data checked only against the planning row's 'Active' cell.
- The evidence is compared byte for byte with LF line ends; a checkout that rewrote it with CRLF would fail the comparison.
- Decision 2's change is in a file `build.js` copies into `dist/knowledge`, and decision 1's hook is in the bundle: the live bundle is not byte-identical to main, and isolation rests on the branch staying unmerged and undeployed. The behaviour snapshot against main (391 entries) is the behavioural proof.

## Erratum

The 6 November review record's note on GF2-14.a ('AUTHORED from the sport module') is wrong; contracts.json cites the Game Archetype Workbook GAK-0103; the record is kept as delivered on 6 November.
