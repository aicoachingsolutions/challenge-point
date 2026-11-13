# a02-hpe2-composition: the TEST-ONLY draft store folder for A02-HPE2 (package 5, 13 November 2026)

TEST-ONLY. NOT APPROVED. A copy of `a02-composition` (HPE-1's store, unchanged) for the revised activity A02-HPE2, on Christian's reply received
13 November 2026. Nothing here is in the engine's knowledge: only the TEST-ONLY draft store (`back/src/system/derivation/draft-store.ts`) reads
this folder, in unit tests (`a02-hpe2.unit.ts`); no route reads it, and none of it is in `contracts.json`, `corpus-restatements.json` or
`learning-goal-authorizations.json`.

| File | What it is |
|---|---|
| `rpc-002-contract.DRAFT.json` | `a02-composition`'s CANDIDATE restatement of RPC-002 (ours, unreviewed) with two values revised for HPE-2, every quotation, source and line unchanged: the origin condition's value (RPC-002-02.b) from 'established coordinated pressure' to 'established coordinated pressure, encountered and then escaped by this crossing', our CANDIDATE restatement of Christian's refinement received 13 November 2026, its closing words 'by this crossing' PROPOSED; and the progression condition's value (RPC-002-03.c) from 'beyond' to 'over', the crossing reading (PROPOSED, within missing relationship M2). Each item's fitNote says so. |
| `a02-authorization.DRAFT.json` | `a02-composition`'s DRAFT authorization record for A02, copied unchanged (no ruling field filled, the authorized set empty); set aside under the TEST-ONLY treatment TT-K2-RETAIN-FORM, as in HPE-1's runs. |
| `a02-hpe2-coach-wording.CANDIDATE.json` | Our CANDIDATE coach wording for A02-HPE2 (not a draft store file: the store reads only `.DRAFT.` files). One entry says the escaping team's scoring and its condition, matched to the revised exact values; the printed-only sentences give the coach text in Christian's four parts, each standing for the engine sentences it states. Read only by the tests-only reader `back/src/system/rendering/candidate-coach-wording.ts`, handed to a TEST-ONLY build beside the approved table and never in it. |

How to read the build's labels: every DRAFT, DRAFT_KNOWLEDGE and BUILT_FROM_DRAFT_KNOWLEDGE_NOT_APPROVED label the build writes for these items
means CANDIDATE restatement (ours, unreviewed) of an APPROVED row, the two revised values carrying PROPOSED words of ours as their fitNotes say.
