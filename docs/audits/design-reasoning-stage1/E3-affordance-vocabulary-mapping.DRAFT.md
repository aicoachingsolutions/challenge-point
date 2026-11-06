# E3: the Soccer Module's affordance labels and the four CAR representations (DRAFT, for Christian's review)

**Standing: DRAFT, ours. Nothing here is implemented, and no engine file reads this document.** It answers Christian's reply of 3 November 2026, item 3: *"Before implementing the mapping, please provide a compact table showing: Existing Soccer Module label. Proposed canonical CAR relationship. Reason for the relationship. Source and approval status. Any ambiguity or unsupported mapping."* and *"Where a sport-specific label cannot be defensibly mapped, mark it unresolved rather than forcing a relationship."*

**The governing layer.** The four CAR representations stay canonical, as Christian asked (*"the four CAR representations should remain the governing conceptual layer"*). Their definitions, as the CAR Matrix RC1.2 metadata writes them (`back/src/system/knowledge-core/atm-workbook.rc1.2.json`, Version Metadata notes):

| Code | Representation | Christian's definition |
| --- | --- | --- |
| FOI | Functional Object Interaction | "Can meaningful interaction with the task object be established?" |
| OP | Open Pathway | "Is a functional route available for performer or object interaction?" |
| SA | Support Availability | "Is coordinated interaction with another performer available?" |
| CIO | Competitive Interaction Opportunity | "Is an opportunity available for direct or indirect adaptive competitor influence that can alter, constrain, contest, or disrupt developing interaction?" |

## What we found first

Most of the module's labels are not affordances: they are the names of canonical Game Problems. `create_space` is GP-001 Create Space, `exploit_space` is GP-002 Exploit Space, and so on. A Game Problem already relates to all four CAR representations through its own Matrix row. Mapping such a label to one representation would collapse that row into a single requirement. So the table proposes three kinds of relationship, never a new canonical affordance:

- **NAMES A GAME PROBLEM.** The label is a Game Problem's name. It reaches the CAR through that Game Problem's row, and in the module it would become a Game Problem reference rather than an affordance id.
- **SPECIALIZES.** The label describes a sport-specific form of one CAR representation.
- **UNRESOLVED.** No defensible relationship. A candidate may be named, but nothing is mapped.

**Where the labels live.**
- **The eleven snake_case labels.** These are in `primary_affordance_ids` (11 Game Forms) and `primary_target_affordance_ids` (23 realizations) of `back/src/system/sport-module/soccer-module.rc1-v3.json`. Every `secondary_…` affordance cell is empty.
- **The ten lenses.** These are the live route's `affordancesUsed`. They declare no Game Problem and no affordance id.
- **Undefined codes.** `typical_affordances` holds codes A1–A10, which the repository defines nowhere.
- **The in-code registry.** `back/src/system/affordances.ts` keeps six more titles.

**Standing of all of them.** All the module's labels came from the legacy extraction (`TEST_LIBRARY_V0`, provenance "Extracted from TEST_LIBRARY_V0_ARCHETYPES via extract-soccer-game-forms.ts"), in a module whose metadata reads `module_status: DRAFT`. None of them is approved by Christian.

## The table

| Soccer Module label (used on) | Proposed CAR relationship | Reason | Source and approval status | Ambiguity or unsupported mapping |
| --- | --- | --- | --- | --- |
| `create_space` (GF1, GF2, GF3, GF5, GF9, GF10; 2 realizations); lens *Space Creation Opportunity* | **NAMES A GAME PROBLEM:** GP-001 Create Space, so its row: FOI S, OP E, SA S, CIO E | The label is the Game Problem's canonical name. | GP-001: Game Problem Library RC1, Canonical. CAR row: Approved. Label: legacy, module DRAFT. | E1: in Christian's words, Create and Exploit Space *"should not have a permanent hierarchical relationship"*. Keeping the label as a Game Problem reference keeps them separate. Mapping it to OP alone would hide that FOI is Supportive here. |
| `exploit_space` (GF1, GF3, GF4, GF5, GF8, GF9; 4 realizations); lens *Space Exploitation Opportunity* | **NAMES A GAME PROBLEM:** GP-002 Exploit Space (FOI E, OP E, SA S, CIO E) | The label is the Game Problem's canonical name. | As above. | As above: under E1, the FOI distinction from GP-001 is the one that matters. |
| `maintain_possession` (GF2, GF3); lens *Possession Stability Opportunity* | **NAMES A GAME PROBLEM:** GP-015 Maintain Possession (all four E) | The label is the Game Problem's canonical name. | GP-015's CAR row: "Approved; SA flagged for field validation". | The lens says "Possession **Stability**", which is nearer TA02's stabilization episode (E2) than plain retention. Which of the two the lens means is Christian's to say. |
| `regain_possession` (GF4, GF8; 3 realizations); lens *Regain Opportunity* | **NAMES A GAME PROBLEM:** GP-016 Regain Possession | The label is the Game Problem's canonical name. | As above. | None. |
| `protect_space` (GF11; 2 realizations); lens *Space Protection Opportunity* | **NAMES A GAME PROBLEM:** GP-012 Protect Space | The label is the Game Problem's canonical name. | As above. | Two realizations that carry it, *Central Density Condition* and *Small Area Condition*, also appear in attacking games. There they shape the attackers' problem, not the defenders'. |
| `recover_shape` (GF11; 1 realization); lens *Recovery Opportunity* | **UNRESOLVED.** Candidate: GP-004 Recover Position | "Shape" and "position" are different words for possibly the same operation. Only the engine's PROVISIONAL keyword map relates them (`I_defensive_recover → GP-004`). | No approved row relates the label to GP-004. | Whether recovering **shape** (a team's organization) is GP-004 (an individual's position) or another problem. |
| `delay_or_deny` (GF11; 1 realization); lens *Delay or Deny Opportunity* | **UNRESOLVED.** Candidate: GP-013 Deny Space, for "deny" only | "Deny" matches GP-013's operation. "Delay" is not a canonical operation, and only the keyword map relates it (`I_defensive_delay → GP-013`). | No approved row. TD02 "Delay the Attack" translates to GP-013, but that is a goal translation, not a label mapping. | Delaying may not be denying space. The label joins two intentions. |
| `break_lines` (GF2, GF6, GF7; 4 realizations); lens *Line-Breaking Opportunity* | **SPECIALIZES OP** (proposed) | Breaking a line is a route through or between defensive lines, so it is a sport-specific form of "a functional route … for performer or object interaction". | OUR READING. No approved row. The keyword map relates the signal group to GP-002 (PROVISIONAL). | Alternatively it names an outcome of GP-002 or GP-003 Improve Position. Also, OP is Essential for every attacking Game Problem, so this mapping alone would distinguish nothing. |
| `finish` (GF1, GF6, GF7, GF9); lens *Finishing Opportunity* | **UNRESOLVED.** Candidates: GP-006 Establish Functional Object Control, or SPECIALIZES FOI | The keyword map relates finishing to GP-006 (PROVISIONAL). FOI concerns "the task object", which the DRAFT join rules read as the ball, never the goal. | No approved row. | A shot is interaction between the ball and an objective. Which representation, if any, owns the relation to the objective is not stated anywhere we hold. |
| `attack_quickly` (GF4, GF8; 2 realizations); lens *Transition Attack Opportunity* | **UNRESOLVED.** It names a coaching intention, not an affordance | It is the name of Learning Goal TA01 "Attack Quickly", which translates to GP-002 in the Session Planning Model. | The Session Planning Model owns coaching intentions; Christian's Governance Standard keeps them out of the sport layer. | Mapping it would let a goal's wording into the affordance layer, which is what E1 and Stage 1 avoid. |
| `perception` (4 realizations: *Variable Target*, *Multi-Goal Read*, *Blind-Side Entry*, *Disguised Restart*) | **UNRESOLVED.** Not a CAR relationship | None of the four representations is perceptual. Information belongs to the Information Expression library, and the EM schema defers *"Information Structure"* (DEF-0001, "Do not implement."). | No approved row. | These four realizations may belong to Information Expression rather than to any affordance. That is a decision of library ownership, not of mapping. |
| `A1`–`A10` (`typical_affordances` on all 11 Game Forms) | **UNRESOLVED.** Undefined | No file in the repository defines the codes. | Legacy `TEST_LIBRARY_V0`. | We recommend retiring them unless their definitions are found. |
| The in-code registry's six titles (`affordances.ts`): *Progress Through Lines*, *Create and Exploit Space*, *Finish Under Pressure*, *Attack the Transition*, *Secure and Escape Pressure*, *Protect the Critical Space* | **UNRESOLVED.** Each is a composite coaching theme | Each spans Game Problems. For example, "Create and Exploit Space" joins GP-001 and GP-002, which E1 asks us to keep distinct. | Engine-owned, not Christian's. | We recommend that these never be used as affordances. |
| `affordance_tag_group` values *Attacking*, *Defensive*, *Both* | Not a candidate | These are phase groupings, not affordances. | Legacy. | None. |

## What we are asking Christian

1. **The first five rows.** Should a label that is a Game Problem's name become a Game Problem reference in the module (`…game_problem_ids`), with its affordance cell emptied, instead of being mapped to a CAR representation?
2. **`break_lines`.** Is it a specialization of Open Pathway, or an outcome of GP-002 or GP-003?
3. **`recover_shape`, `delay_or_deny`, `finish`.** Does any approved relationship exist that we have not found?
4. **`perception`.** Should the four perception realizations move to Information Expression, or stay unmapped?

Until Christian answers, Stage 1 uses none of these labels. Game Form compatibility reads only the forms' declared Game Problem ids and the context's relationships. It is Step 3 (configuration) that would need this mapping.
