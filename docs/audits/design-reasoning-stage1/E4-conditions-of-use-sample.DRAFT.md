# E4: an initial conditions-of-use sample (DRAFT, for Christian's review)

**Standing: DRAFT, ours. Nothing here is populated in any workbook or read by the engine.** It answers his reply of 3 November 2026, item 4:

- *"I would like to begin with a small sample of environmental variables—perhaps width, numerical relationships and one relevant Interaction Regulation—before populating all seven manipulations and five regulations."*
- *"Please present those initial conditions for review before implementing the configuration stage."*
- *"Each populated relationship should retain its source, evidence status, assumptions, intended influence and known limitations."*

**Where they would go.** Each entry would go in the existing `suitability_conditions` and `contraindications` columns of the Soccer Module's realizations, as he approved. Those columns are empty today for all 23 realizations. The realizations named below are the existing library constraints that express each variable. No new library or layer is proposed.

**The four classes** are his, applied to each statement separately:

- **ESTABLISHED PRINCIPLE**: an established ecological principle;
- **INFERENCE**: a logical inference from approved knowledge;
- **HYPOTHESIS**: a conditional causal hypothesis;
- **FIELD-SUPPORTED**: a relationship supported by field evidence.

No statement below is FIELD-SUPPORTED: the repository holds no field evidence for any of them. He wrote that *"A relationship can be approved for controlled design experimentation without being represented as an empirically established effect."* Every HYPOTHESIS below is offered on that basis.

**What the engine would do with an entry.** At configuration (Step 3, not yet authorized), an entry would decide whether a manipulation is a candidate for a given Game Problem, under the coaching context the session states (players, area, and whether the opposition is organized). It would never predict what players will do. Where a condition cannot be evaluated from the stated context, the engine would report insufficient evidence rather than assume the condition holds.

**The general principle** every entry rests on, from his own documents:

- *"Challenge Point adopts the ecological view that affordances emerge through relationships between performers and their environments."* (Affordance Library Standard RC1, Ecological Foundation; status Active Development)
- *"Instead, the platform engineers environments intended to invite representative landscapes while acknowledging that the opportunities ultimately experienced remain performer-relative and emergent."* (the same document)

---

## 1. Width

**The variable.**
- EM schema EMD-0002 *Width*: "Manipulates the lateral extent of the playable area." It belongs to EM-0001 *Playing Area Configuration* and is RC1 Candidate.
- It is listed for Attack Development: "field dimensions;" (Core) and "player spacing;" (Core) among RC1.1 Library RPC-003's Typical Environmental Manipulations. Those lines are quoted in `docs/audits/drafts/ta02-composition/README.md:197`; the Library itself is held outside the repository.
- Attack Development's behaviour adjustment RPC-PROP-047 reads "Manipulate field dimensions or numerical relationships."

**The realizations that would carry it.**
- *Small Area Condition* (`tl-v0-constraint-small-area-condition`). Its contraindication reads "Space reduction is structural — it creates representative pressure through environment, not scripted actions."
- *Wide Utilization Bonus* (`tl-v0-constraint-wide-utilization-bonus`). Its contraindication reads "Avoid forcing wide play".

| # | Proposed condition of use | Class | Source | Assumptions | Intended influence | Known limitations |
| --- | --- | --- | --- | --- | --- | --- |
| W1 | Changing width alters spacing and the action spaces available to both teams. | ESTABLISHED PRINCIPLE, as his knowledge states it | EMG-0001, EM-0001 Potential Value: "Alters spacing, movement opportunities, and available action spaces." | None beyond the EM guidance. | Makes width a candidate manipulation wherever the profile has OP Essential. | It says nothing about direction: wider is not "more" of any affordance. |
| W2 | **Suitability.** Widening is likely to invite *Create Space* (GP-001) when the defending team can still organize, shift and contest the space the width adds. | HYPOTHESIS (his example) | His reply, item 4: *"increasing playing width might invite space creation if defenders can still organize, shift and contest the available space."* RPC-003 REPRESENTATIVE_INFORMATION RPC-PROP-038, CORE: "Defensive organization and defensive shifting." | That "can still organize and shift" can be judged from the stated context: defending numbers against width, and whether the opposition is organized. | For GP-001, width is a candidate only while the condition holds. | No approved threshold: neither space per defender nor any lateral distance a defending line can cover. The session form states numbers and area, not whether the opposition is organized. |
| W3 | **Contraindication.** Where width already exceeds what the defenders can contest, widening further mainly provides space that already exists. Then it invites *Exploit Space* (GP-002), not GP-001, and players should not be led to create space they already have. | HYPOTHESIS (his example) | His reply, item 4: *"Under different conditions, the same change may merely provide space that already exists."* His item 1: *"Players shouldn't be encouraged to create space unnecessarily."* | As W2. | For GP-001, width is set aside, and the trace says why. For GP-002, it remains a candidate. | The same threshold is missing. This is also where his E1 requirement (context-sensitive Create/Exploit resolution) and the configuration stage meet; see the demonstration report. |
| W4 | **Contraindication.** Width so great that opposition rarely contests the ball removes Competitive Interaction Opportunity, which is Essential for every Game Problem Stage 1 resolves. | INFERENCE | EMG-0002, EM-0001 Common Risk: "Extreme geometry may remove important representative affordances." CAR CIO definition. CIO is rated E on GP-001, GP-002 and GP-015. | That CIO can be judged from density (space per player) together with numbers. | Width is never increased past the point where the stated numbers can still contest. | "Rarely contests" is not quantified anywhere we hold. |
| W5 | **Contraindication.** Narrowing (Small Area Condition) raises pressure. For TA02 (GP-015, all four Essential) it may serve stabilization under pressure. For A05 it may remove the progression the context requires. | HYPOTHESIS | Small Area Condition's own contraindication, as quoted above. RPC-003 DEGENERATE_SOLUTION RPC-PROP-043: "Premature forcing removes future attacking possibilities." | As W2. | Narrowing is a candidate for GP-015 under pressure, and is flagged as a tradeoff for GP-001 and GP-002. | It depends on E2: TA02's context is undecided. |

## 2. Numerical relationships

**The variable.**
- EM schema EMD-0013 *Quantity*: "Manipulates the number of participating performers assigned to one or more groups." It belongs to EM-0006 *Participant Composition*.
- Also EMD-0014 *Participation State*, of EM-0007, which covers temporary numerical transitions.
- It is listed for Attack Development: "numerical balance;" (Common, Typical Environmental Manipulations) and "numerical conditions;" (Common, Typical Interaction Regulations), in the RC1.1 Library as quoted at `ta02-composition/README.md:197-198`.
- RPC-003 REPRESENTATIVE_INFORMATION RPC-PROP-041, CORE: "Numerical or positional advantages."

**The realization that would carry it.** *Neutral Player Condition* (`tl-v0-constraint-neutral-player-condition`). Its contraindication reads "Neutral player creates structural overload — not a coaching script. Players choose when and how to use the numerical advantage based on the live pressure picture."

| # | Proposed condition of use | Class | Source | Assumptions | Intended influence | Known limitations |
| --- | --- | --- | --- | --- | --- | --- |
| N1 | Changing numbers changes numerical interaction opportunities and local challenge. | ESTABLISHED PRINCIPLE, as his knowledge states it | EMG-0011, EM-0006 Potential Value: "Changes numerical interaction opportunities and local challenge." | None. | Makes numbers a candidate manipulation for every resolved Game Problem. | It gives no direction. |
| N2 | An attacking overload, such as a neutral, adds a performer with whom coordinated interaction may be available. It is a structural condition for Support Availability, not evidence that support occurs. | INFERENCE, structure only | CAR SA definition: "Is coordinated interaction with another performer available?" EMX-0011, the EM example "Change from 4v4 to 5v4 while preserving other design features." | None. | For a profile with SA Essential (GP-015, TA02), an overload is a candidate. | His caution of 30 October applies: *"rather than assuming they emerge simply because players have teammates."* So the DRAFT join rules allow no inference to SA, and the trace would report the number as a fact, never as support. |
| N3 | **Suitability.** An overload is likely to invite support under pressure, and the stabilization TA02 describes, while the defending numbers can still press the ball. | HYPOTHESIS | His reply, item 2 (E2): the episode *"concerns the opportunities available to stabilize possession under meaningful opposition pressure."* | That "can still press" can be judged from numbers and area. | An overload is suitable for GP-015 only with sufficient pressing numbers. | No approved ratio, and E2's context is undecided. |
| N4 | **Contraindication.** An overload large enough that pressure is no longer meaningful trivializes the task and removes CIO. | INFERENCE | EMG-0012, EM-0006 Common Risk: "Numerical changes can overwhelm or trivialize the task." CAR CIO definition. CIO is E on every Game Problem resolved in Stage 1. | As N3. | No overload beyond the point where the defenders can still contest. | It is not quantified. |
| N5 | **Contraindication.** For A05, an overload may let possession circulate without improving attacking conditions, which is RPC-003's degenerate solution. | HYPOTHESIS | RPC-003 DEGENERATE_SOLUTION RPC-PROP-042, COMMON: "Possession circulates without improving attacking conditions." Identity rule RPC-ID-013, REQUIRED: "Possession alone is insufficient as success." | That the scoring condition (RPC-PROP-134) is in force. | For GP-001 and GP-002 in RPC-003, an overload is flagged as a tradeoff, never as the reason the context's identity holds. | It interacts with the scoring condition, which is Step 5 validation. |

## 3. One Interaction Regulation: continuous play

**Why this one.** It is a Core regulation for Attack Development, "continuous play;" (Typical Interaction Regulations, Core, RC1.1 Library line 680, quoted at `ta02-composition/README.md:198`). It is also the regulation his E2 instruction depends on: *"the activity itself must preserve legitimate play after turnovers. We shouldn't require artificial clearing actions or forced sequences merely to establish the episode."*

**Its family.** The archetype workbook relates five regulation families to Invasion, all RELEVANT (GAK-0187 to GAK-0191). Continuous play most nearly belongs to *Restart / State* (IRF-005), but that is OUR READING: no row says so.

**The realization that would carry it.** No library constraint expresses continuous play as a regulation. Today it exists only as engine text.
- The rule-placement slot modifier at `back/src/system/activity/slot-mechanics-variations.ts:111` begins "On possession change, both teams stay live in the same space with no reset: …".
- The coach-voice table (`back/src/system/activity/coach-voice.ts:89-91`) serves that modifier as "When the ball changes hands, play carries on from wherever everyone is. Whoever lost it presses straight away." The fixed-response test measured it in the served activities.
- That text is engineering's, and is not shown to be his.

The closest library constraint is *Transition Trigger* (`tl-v0-constraint-transition-trigger`), whose contraindication reads "Maintain ecological validity".

| # | Proposed condition of use | Class | Source | Assumptions | Intended influence | Known limitations |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | Play continuing through a change of possession keeps the regain moment, and what follows it, in the game. Stopping play there removes it. | ESTABLISHED PRINCIPLE, as his knowledge states it | Affordance Library Constitution RC1 v2: "adaptive behavior emerges through continuous interaction between performers and their environments." RPC-003 END_CONDITION RPC-PROP-037: "Possession is lost." Transitions RPC-TR-017 and RPC-TR-019 (regain → RPC-006). | None. | Continuous play is the default for every context whose end conditions include possession lost. | It does not say what happens next. That is the context model's job (E2). |
| C2 | **Suitability.** For TA02, continuous play is required. The stabilization episode begins at a regain that the game itself produces, not at a coach's restart or an imposed clearance. | INFERENCE | His reply, item 2 (E2), as quoted above. | That E2's context decision keeps the episode inside play. | Continuous play is a required regulation for a stabilization episode. Any element that stops play at a turnover would be a conflict. | It depends on E2. |
| C3 | **Contraindication (tradeoff).** For A05, continuous play means a score can also follow a turnover, which is Counterattack's moment, not Attack Development's. The remedy is to scope the scoring condition to the episode (E8), not to stop play. | INFERENCE | Measured in `docs/audits/drafts/a05-composition/README.md` (section 0): the engine can apply the begin condition only across the whole game. RPC-ID-011, REQUIRED: "Organized attacking possession is already established." | None. | Reported as a known tradeoff. Never resolved by stopping play or forcing a sequence. | It needs the E8 engine work, which is not authorized. |
| C4 | **Contraindication.** A rule that forces a fixed action after a turnover, such as a clearance, a pass back or a set number of passes, is a forced sequence. | INFERENCE | His reply, item 2, as quoted above. *Switch of Play Bonus* contraindication: "Avoid sequence rules". *Pass Combination Gate* contraindication: "The combination is an ecological scoring gate — not a technique exercise." | None. | Any such element is flagged as a conflict at Step 4. | The *Pass Combination Gate* is already on hold (Pass Combination Gate Hold). This would be consistent with that. |

## What we are asking him

1. **The classes.** Are the classes right? In particular, may W1, N1 and C1 be classed as established principle on the strength of his own library guidance and documents, or should they be INFERENCE until a source outside Challenge Point is cited?
2. **The missing thresholds.** W2, W3, W4, N3 and N4 each need a condition the session can evaluate. Should Stage 2 report insufficient evidence until he supplies a threshold, or should the coaching context gain an input, such as "opposition organized: yes or no"?
3. **Continuous play.** Should it be authored as a library regulation of its own (with C1–C4 as its conditions), rather than left as engine text?
