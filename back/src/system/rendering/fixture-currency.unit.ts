/**
 * **Is the frozen A04 rendering fixture the intentionally frozen representation of the CURRENT approved
 * Golden Case, or is it explicitly stale?** Christian's authorization of 7 October, in his words:
 *
 *   > *The current rendering suite passing against an obsolete concrete A04 is trust-critical. I still want
 *   > rendering tested against a frozen concrete game so communication can be isolated from derivation. But
 *   > "frozen" must not mean silently detached from the canonical game it represents.*
 *
 *   > *Recompute the canonical A04 game and compare its digest with the frozen fixture. Drift should fail
 *   > unless a separate acknowledgement records: the exact live digest; and why the existing frozen game
 *   > intentionally remains the rendering reference. No automatic fixture regeneration. The acknowledgement
 *   > must expire with the next different digest, and an acknowledgement that becomes obsolete must not
 *   > remain capable of excusing future drift.*
 *
 * **Why it compares the GAME and not the provenance stamp.** The fixture already carries four provenance
 * fields and not one of them is fit for this. The engine version is a string literal, edited once, when the
 * file was created; derivation and realization have been rewritten many times over since. The register
 * version is a hand-written sentence that did not move across three separate edits to the register in one
 * week. The derivation-rules version is the literal `rev-5`, written out in thirteen places. And the input
 * digest hashes the INPUT: with the engine made to return three fewer resolution lines — a materially
 * different game — the whole provenance block came back byte-identical. A guard on any of them would have
 * been a guard on nothing.
 *
 * **Why the acknowledgement is its own file.** The fixture's own header says it is never hand-edited, and the
 * freezer rewrites the whole file, so a field inside it would be destroyed on every refresh and would have to
 * be re-derived by the generator. A file whose entire purpose is to be hand-authored removes the
 * contradiction and leaves the fixture a pure generator output.
 *
 * **What makes this a guard rather than a mute button.** The acknowledgement must name the digest it is stale
 * AGAINST. It therefore expires by itself the moment anything moves again — "known stale, forever" is not
 * expressible. And when the fixture becomes current again, an overtaken acknowledgement must be deleted
 * rather than left lying around to excuse the next drift. Both directions are asserted below.
 *
 * It writes nothing. Refresh stays `npm run freeze:a04`, a deliberate act.
 *
 * **Re-frozen 13 October 2026: `cdcd8316` → `b5f7b816`, and what moved is four sentences of provenance.**
 * The roster rule was repaired to implement his rule of 30 September — *"Stating availability is not stating
 * involvement"* — so the count a team holds for a specialized role is now what the GAME involves, with the
 * session's availability only having to cover it. For the Golden Case both are zero, so the game itself did
 * not move: every value, every instruction and every digest input is as it was. But each of the two teams'
 * entailed specialized-role entries carried the reason *"the session states … = 0 for this run"*, and that is
 * no longer why the value is zero — the game involves none because nothing selected establishes the role.
 * The reason is recorded twice (`record.entailed` and `status.entailed`), hence four lines. Keeping the old
 * sentence to hold the digest still would have left the fixture asserting a derivation the engine no longer
 * performs, so the fixture was refreshed rather than acknowledged stale. The rendered text was diffed
 * before and after through `npm run pilot:a04` and is identical.
 *
 * **Re-frozen again 13 October 2026: `b5f7b816` → `30395c2a`. The GAME did not move; what the fixture KEEPS
 * about it did.** Christian that day: *"I agree with preserving authored ranges, selected starting values,
 * alternatives, and the reasons for those selections throughout realization and communication … We don't
 * need to build that feedback mechanism now, but we should preserve the information it will eventually
 * need."* Compared field by field before and after: `game`, `envelope`, `closure`, `provenance`, the
 * realized geometry, the instantiations and the entailed roster are byte-identical, and every choice holds
 * the value it held. Five things moved, each deliberately:
 *
 *   1. **every recorded choice carries what it was chosen `within` and what kind of `closure` it was** — for
 *      this game three design alternatives, two values that are the only one permitted, and one that is the
 *      coach's. The record used to keep the value and drop the bound it was checked against;
 *   2. **two of the six choices are now justified defaults.** The two targets' across-extent were never
 *      choices — each line's authored bound has one member — so they left `a04-realization-choices.json`
 *      and are closed by rule, recorded with `defaultedBy` and the rule's own reason. Same values;
 *   3. **the initial holder is checked against its declared domain.** The register's `fillableFrom` for the
 *      possession row had no reader; it is enforced now, so that choice is graded `WITHIN_DECLARED_DOMAIN`
 *      with the game's two teams recorded as what it was chosen among, and `record.unverified` is empty;
 *   4. **`status.derived` keeps each value's `support`, `status.choices` is the recorded choice whole, and
 *      `status.bounds` is new** — the bounds that sit beside a derived value. They were cut down to
 *      `{ path, lineId, value }` at this boundary, which is where ranges were being lost;
 *   5. the realization and audit digests moved with (2), as they must: defaults are realization input.
 *
 * The fixture is also assembled by the builder's own assembler now (`rendering-fixture.ts`) rather than by a
 * second copy of the shape in the freezer, so it cannot come to differ from what is served. The rendered
 * text was diffed before and after through `npm run pilot:a04` — against the previous commit run from a
 * clean export — and is identical: A04 holds no numeric range, so no sentence of it changed.
 *
 * **Re-frozen a third time 13 October 2026, in the review of that work: `30395c2a` → `2eab6bea`. Six
 * lines of the file moved: one sentence four times, and two digests.** The two justified defaults recorded their
 * reason as *"the authored bound on this line has exactly one member … so it is the only value the
 * knowledge permits here and any other would be refused"*. The bound on each target's across-extent comes
 * from a `PREFERRED_DEFAULT`, `SUPPORTING` item, and what the knowledge prefers is not all that it permits
 * — so the record was calling a preference a requirement, which is the status change the fidelity
 * questions exist to catch, made one layer below where they look. The reason now says the value is the
 * only one AUTHORED and that it is authored as a preferred default. It appears four times (each default,
 * in `record.choices` and in `status.choices`), and the realization and audit digests moved with it because
 * a default's reason is realization input. The game, every value, every bound, every closure and the
 * rendered text are byte-identical; `git diff` of the fixture shows nothing else.
 *
 * **Re-frozen 14 October 2026: `2eab6bea` → `504a4898`. The SHAPE gained two fields; no value moved.**
 * Christian that day, approving Step 4's second component: *"Preserve whether each condition is required,
 * preferred, advisory, or left to the coach, all the way through rendering and validation."* So:
 *
 *   1. every entry of `status.derived` carries its `strength` (17 entries: 16 `REQUIRED`, and what continues
 *      at a change of possession — GF2-17, authored once as a preferred default — `DEFAULT`). The boundary
 *      copies each entry whole now rather than field by field, which is how a new field was always dropped;
 *   2. every bound from an `ASSUMED` item carries `assumed: true` — seven places: the axis bound in
 *      `status.bounds`, and three bounds inside recorded choices' `within` (the scoring kind's forbidden set
 *      and the two targets' across-position), each recorded twice (`record.choices` and `status.choices`).
 *
 * `git diff` of the fixture shows those 17 + 7 additions and the commas beside them, nothing else: the game,
 * every value, every choice and every digest input other than these fields are byte-identical. The renderer
 * does not read either field yet, so the rendered text is unchanged (the rendering suite pins it).
 *
 * **Re-frozen 14 October 2026 (stage S-C1): `504a4898` → `1ad24bb8`. The GAME did not move; the register did.**
 * Register version 7 adds row P6c — when a neutral player's change of side takes effect — on his ruling that day:
 * *"Please add the explicit property governing when a neutral player changes allegiance, using immediate switching
 * upon possession change as the approved behavior for the current mechanism."* The register version is hashed into
 * the input, so `inputDigest` / `fromDigest` (235ee36e → 712ecc78), the audit digest and the `registerVersion`
 * sentence moved; and a game-level row is a line in every game, so `status.notEstablished` gained one entry —
 * `performers.neutrals.affiliation.takesEffect`, `no coverage`: the Golden Case has no neutrals and no contract it
 * selects speaks of the timing. `git diff` shows those ten lines and nothing else: `game`, every value, every
 * choice, the geometry and the roster are byte-identical. The rendered TEXT did move, but by the renderer, not by
 * this fixture: the statuses of the same day (no "For this activity,"; GF2-17's default said as where the activity
 * starts), pinned in `rendering.unit.ts`.
 *
 * **Re-frozen 14 October 2026 (C48): `1ad24bb8` → `a0d5e683`. The GAME did not move; one unestablished entry now
 * says what the knowledge said.** The entry added above read `no coverage` with `declared: []` — nobody looked —
 * although GF2, which the Golden Case selects, declares every other neutral property NON_CLAIMED ("performers
 * outside the two teams are neither authored nor forbidden"). It could not have declared P6c: the row did not exist
 * when it was written. Ruling C48 extends its P6a declaration to P6c by restatement (`declarationsAdded` in
 * `corpus-restatements.json`; contracts.json untouched), so the entry `performers.neutrals.affiliation.takesEffect`
 * now reads `not constrained`, `declared: ["NON_CLAIMED"]`, exactly as P5, P6a, P6b and P7 beside it. A declaration
 * is derivation input, so `inputDigest` / `fromDigest` (712ecc78 → ea6e8ee2) and the audit digest (735eadb4 →
 * 1d8df435) moved with it. `git diff` shows those four lines and that one entry and nothing else: `game`, every
 * value, every choice, the geometry, the roster and the realization digest are byte-identical. `npm run render:a04`
 * was diffed before and after: the rendered text is identical, only the two digests it prints moved.
 *
 * **Re-frozen 15 October 2026 (C49, C50): `a0d5e683` → `9ce40dc3`. The GAME did not move; four declarations the
 * Golden Case selects now carry a deferral.** His reply of that day (16 October, item 8): *"I approve your recommended
 * Option A for the four identified statements."* GF2's NOT_AUTHORED declarations on V3-V6 are restated with
 * `defersTo: ESTABLISHING_OBJECT` (C50, `corpus-restatements.json`; contracts.json untouched), and a declaration is
 * derivation input, so `inputDigest` / `fromDigest` (ea6e8ee2 → d2fbd15e) and the audit digest (1d8df435 → cbf5c31d)
 * moved with it. No line of the Golden Case changes reason — nothing it selects speaks explicitly about V3-V6 where
 * GF2's gap reaches (measured, and pinned corpus-wide in governing-declarations.unit.ts). `git diff` of the fixture
 * shows those three digests and nothing else: `game`, every value, every choice, the geometry, the roster and the
 * realization digest are byte-identical. `npm run render:a04` was diffed before and after: the rendered text is
 * identical, only the two digests it prints moved. C49 (the gate's place) does not reach A04, which has no gate.
 *
 * **Re-frozen 15 October 2026 (stage K1): `9ce40dc3` → `f3db590b`. The GAME did not move; the register did, and what
 * the fixture KEEPS about its unestablished entries did.** Two causes, each deliberate:
 *
 *   1. **Register version 8** — his M6 qualifier vocabulary (*"the machine-readable representation must preserve the
 *      distinction between: No further value is required. The value is explicitly unrestricted. A necessary value is
 *      missing."*) and his M8 relational referent form, both approved 17 October. The register version is hashed into
 *      the input, so `inputDigest` / `fromDigest` (d2fbd15e → f77ec627), the audit digest (cbf5c31d → 831ab337) and the
 *      `registerVersion` sentence moved. Nothing the Golden Case selects carries a qualifier or a relational referent:
 *      C55 and C57 are RPC-001's, which A04 does not select.
 *   2. **`status.notEstablished` carries each entry's `governedBy` whole.** The fixture boundary kept only the reason
 *      code and the row-wide kinds, so which of his three states a 'not constrained' entry is in was lost one step
 *      before the renderer (the silent-loss pattern; rendering-fixture.ts). Each of the eight entries gains the
 *      declarations that decided it — for the Golden Case every one is a legacy non-claim or nobody looking, so no
 *      entry reads as "no further value" and no observation is added.
 *
 * `git diff` of the fixture shows those three digests, the version sentence and the eight `governedBy` lists, nothing
 * else: `game`, every value, every choice, the geometry, the roster and the realization digest are byte-identical.
 * `npm run render:a04` was diffed before and after: the rendered text is identical, only the two digests it prints moved.
 *
 * **Re-frozen 15 October 2026 (stage K2): `f3db590b` → `6ff69f77`. The GAME did not move; the register did, and the
 * realization record now says which team holds which end.** Two causes, each deliberate:
 *
 *   1. **Register version 9** — the typed team designations for his M2 of 17 October (*"Please implement the previously
 *      adopted September 20 designation rule, rather than introducing a narrower workaround solely for this activity."*).
 *      The register version is hashed into the input, so `inputDigest` / `fromDigest` (f77ec627 → fe971f92) and the
 *      `registerVersion` sentence moved.
 *   2. **`record.designationBindings`** — the possession game form's realization input now names which instantiated team
 *      holds each end of ruling C42 (TEAM_AT_AXIS_START → #1, TEAM_AT_AXIS_END → #2), a governed symmetric choice (SD-39,
 *      as the initial possession holder is) recorded beside the game, never on a team. It is realization input, so the
 *      realization digest (e64500e4 → 269c9dad) and the audit digest (831ab337 → eaa0b3ee) moved with it. Nothing in the
 *      Golden Case reads it: no item it selects names a team on a performer row.
 *
 * `git diff` of the fixture shows those digests, the version sentence and the two bindings, nothing else: `game`, every
 * value, every choice, the geometry and the roster are byte-identical. `npm run render:a04` was diffed before and after:
 * the rendered text is identical, only the two digests it prints moved.
 *
 * **Re-frozen 15 October 2026 (stage K3): `6ff69f77` → `2f9cce9b`. The GAME did not move; only the register version did.**
 * Register version 10 adds role blocks for his M1 of 17 October (*"Keep role assignments separate from fixed ends. Allow
 * target configurations to reflect each team's role during the block. The coach controls the exchange. No new
 * block-duration system is needed."*): rows B1-B3, two vocabularies, the designation ROLE_HOLDER_<role> and the derived
 * region attribute targetOf. The register version is hashed into the input, so `inputDigest` / `fromDigest` (fe971f92 →
 * 197bf9e3), the audit digest (eaa0b3ee → 3b8e5a7b) and the `registerVersion` sentence moved. The Golden Case establishes
 * no role and asks for no targetOf, so it enumerates exactly its old lines (the role rows are owned by the role
 * collection), its classes carry nothing new, and `git diff` of the fixture shows those four lines and nothing else.
 * `npm run render:a04` was diffed before and after: identical apart from the two digests it prints.
 *
 * **Re-frozen 15 October 2026 (stage K4): `2f9cce9b` → `2cde97ca`. The GAME did not move; the register version did, and
 * one item the Golden Case selects now carries a ruled supersession.** Two causes, each deliberate:
 *
 *   1. **Register version 11** — participant reassignment at a role exchange, for his answer to RD-1 (reply filed 18
 *      October 2026: *"role exchange and participant reassignment should remain separate capabilities."*): rows B4-B7 and
 *      the reassignment block. The register version is hashed into the input.
 *   2. **GF2-14.b carries `defersTo: AUTHORIZED_REALIZATION`** (ruling C56, his D6 of 17 October: *"please document it as
 *      a knowledge-authorized realization, preserving equal numbers as an alternative."*). Contracts are hashed into the
 *      input whole. Nothing the Golden Case selects authors the outfield count per team or cites a relationship, so the
 *      item does NOT defer here: equality is in force exactly as before and the roster is 6 v 6 as before.
 *
 * So `inputDigest` / `fromDigest` (197bf9e3 → 064b13b7), the audit digest (3b8e5a7b → 8b4dd3a4) and the
 * `registerVersion` sentence moved, and `git diff` of the fixture shows those four lines and nothing else: `game`, every
 * value, every choice, the geometry, the roster and the realization digest are byte-identical. The rendered instructions
 * of the frozen fixture before and after were diffed (renderConcreteGame on each): identical.
 *
 * **Re-frozen 15 October 2026 (stage K5): `2cde97ca` → `4551a03d`. The GAME did not move; the register version did.**
 * Register version 12 — starts and restarts built from knowledge and the coach-judged episode conclusion, his M3 and M4 of 17
 * October (*"Support one explicit coach-judged event representing the conclusion of a meaningful episode."*): the trigger
 * COACH_JUDGED_EPISODE_CONCLUSION, the method FROM_THE_FEET, T4/T5 `fillableRequires`, T2 `fillableWhen`, PS1 `entailedBy`
 * and V5's begin-condition form (ruling C58). The register version is hashed into the input; the vocabulary versions
 * (trigger 4, T5.method 2) and the restated RPC-001-18.b do not reach the Golden Case, which selects no context and holds no
 * start element (so PS1 stays the governed choice, and its POSSESSION_CHANGE awardee line, already withdrawn, only loses
 * an open choice space no reader saw). So `inputDigest` / `fromDigest` (064b13b7 → e555acf8), the audit digest (8b4dd3a4 →
 * 8bbfc003) and the `registerVersion` sentence moved, and `git diff` of the fixture shows those four lines and nothing else.
 * The rendered instructions of the frozen fixture before and after were diffed (renderConcreteGame on each): identical.
 *
 * **Re-frozen 15 October 2026 (stage K6): `4551a03d` → `7d8b5ed7`. The GAME did not move; the register version did.**
 * Register version 13 — positions stated relative to another element or to a team (RC-21's "beyond X (for team T)" made
 * machine-readable, his M7: *"M7 — Target relative to pressure reference: Approved if required."*), the narrowed longitudinal
 * tests, and start placements re-established when an episode begins (rows P10a/P10b, his M5). The Golden Case holds no
 * relative position and no start placement, so GA-RELATIVE-PLACEMENT passes with no applicable instance and GA-DIRECTION's new
 * separation clause passes on its two lines at the two end lines; neither reaches the fixture. So `inputDigest` / `fromDigest`
 * (e555acf8 → d258a5a1), the audit digest (8bbfc003 → 2ecc9210) and the `registerVersion` sentence moved, and a key-by-key
 * diff of the fixture shows those four values and nothing else. The rendered instructions before and after (npm run
 * render:a04): identical apart from the two digests the run prints.
 *
 * **Re-frozen 17 October 2026 (stage M1): `7d8b5ed7` → `8d27c78a`. The GAME did not move; the register version did.** Register
 * version 14 — a role's scoring credit confined to an episode (row B8), occurrences that also count as the primary event (rows
 * V27-V31, the closed list V29.trigger), NOT_LAST_TOUCH's relation to the last-touch qualifier and B7's relative count, for his
 * reply filed 19 October 2026 (item 1: *"Please ensure the underlying scoring eligibility reflects this distinction, rather than
 * relying solely on the coach-facing wording."*). The Golden Case holds no role element, no alsoCounts element and no reassignment,
 * so GA-EPISODE-REACHABLE's two new clauses pass with no applicable instance and nothing reaches the fixture. So `inputDigest` /
 * `fromDigest` (d258a5a1 → 195bfd0c), the audit digest (2ecc9210 → 9c82f9e7) and the `registerVersion` sentence moved, and `git
 * diff` of the fixture shows those four values and nothing else. The rendered instructions before and after (npm run render:a04):
 * identical apart from the two digests the run prints.
 *
 * **Re-frozen 23 October 2026 (H3): `4a58a37d` → `5ff3dac6`. The GAME did not move; the register version did, and two lines nobody
 * speaks for were added.** Register version 21 (his reply filed 26 October 2026, item 7) adds row S7, the object a region is bound to,
 * owned by the regions row. The Golden Case binds no region, so each of its two target regions gains one line no contract speaks of
 * (`space.regions[c:restated:GF2:GF2-03.e].ofObject` and `...03.f`, 'no coverage'), listed with the game's other lines that establish
 * nothing. So `inputDigest` / `fromDigest` (ee3143c1 → 3e76f565), the audit digest (728450a4 → 5a397b4e), the `registerVersion`
 * sentence and those two entries moved, and `git diff` of the fixture shows nothing else; the rendering suite pins the A04 text, which
 * did not change.
 *
 * **Re-frozen 23 October 2026 (H4): `5ff3dac6` → `86d685ea`. The GAME did not move; only the register version did.** Register version 22
 * (his reply filed 26 October 2026, item 4) adds the type a session may state of its goals, in the sessionResources block, and no row:
 * the Golden Case's lines are what they were. So `inputDigest` / `fromDigest` (3e76f565 → f85ab1f4), the audit digest (5a397b4e →
 * e47757d8) and the `registerVersion` sentence moved, and `git diff` of the fixture shows those four values and nothing else.
 *
 * **Re-frozen 24 October 2026 (R1): `86d685ea` → `af033ad3`. The GAME did not move; the register version did, and one line nobody
 * speaks for was added.** Register version 23 (his reply filed 27 October 2026, item 4) adds row RP1, the game's dead-ball restart
 * policy, and two trigger members. The Golden Case states no policy, so it gains one line no contract speaks of (`restartPolicy.deadBall`,
 * `game::RP1`, 'no coverage'), listed with the game's other lines that establish nothing, and GA-DEAD-BALL-RESTART passes it vacuously.
 * So `inputDigest` / `fromDigest` (f85ab1f4 → 438b9935), the audit digest (e47757d8 → 6a7c644e), the `registerVersion` sentence and
 * that one entry moved, and `git diff` of the fixture shows nothing else; the rendering suite pins the A04 text, which did not change.
 *
 * **Re-frozen 24 October 2026 (R2): `af033ad3` → `62780cc4`. The GAME did not move; only the register version's sentence did.** Version
 * 23's sentence said that no note was altered, and one was (the participants block's PERFORMER_OF_AWARDED_TEAM provenance, R1); it now says
 * so (an AMENDED sentence, the R1 review's should-fix). So `inputDigest` / `fromDigest` (438b9935 → a6228f61), the audit digest (6a7c644e →
 * 930b70c9) and the `registerVersion` sentence moved, and `git diff` of the fixture shows those four values and nothing else. The Golden
 * Case keeps a restart per trigger, so the R2 restart words (draft-coach-wording.json) say nothing of it and its rendering is unchanged.
 *
 * **Re-frozen 25 October 2026 (P1): `62780cc4` → `2462861d`. The GAME did not move; only the register version did.** Register version
 * 24 adds TAKER_CHOOSES to the T5.method vocabulary (version 3) for his reply filed 28 October 2026, item 1 ("The goalkeeper should be
 * able to restart by passing, rolling, throwing, or dribbling the ball into play."), written by one knowledge item (A01-R1-T5-1). So
 * `inputDigest` / `fromDigest` (a6228f61 → 1c6d498d), the audit digest (930b70c9 → 42b2b98a) and the `registerVersion` sentence moved, and
 * `git diff` of the fixture shows those four values and nothing else. The Golden Case writes no restart method, so nothing of it is said
 * differently.
 *
 * **Since stage K3 a fixture may be COMPOSED from two role blocks** (`build-activity.ts`, `role-blocks.ts`): block one's
 * fixture with a `roleBlocks` block carrying each block's own fixture whole. The Golden Case is a single game and is
 * frozen as one; the composed shape is guarded below by key identity, so a future frozen two-block fixture cannot lose a
 * block's keys at that boundary.
 *
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivityFromKnowledge } from './build-activity'
import { buildGoldenCase, goldenCaseDigest, GoldenCaseUnavailable, OUT as FIXTURE } from './freeze-a04-fixture'
import { specializedRoleNames } from './session-envelope'

const MARKER = path.resolve(__dirname, '../../../../docs/audits/a04-fixture-currency.json')

/**
 * A chain that can no longer produce A04 fails as a NAMED finding rather than as an opaque throw. The
 * currency question is unanswerable in that state, and saying so is different from saying the fixture is
 * stale — one is a broken chain, the other a stale artifact, and they need different repairs.
 */
let live: Record<string, unknown>
try {
    live = buildGoldenCase()
} catch (error) {
    if (error instanceof GoldenCaseUnavailable) {
        console.log(`fixture-currency.unit.ts — FAIL: the canonical A04 Golden Case can no longer be produced, so the fixture's currency cannot be established`)
        console.log(`             ${error.message}`)
        process.exitCode = 1
        throw error
    }
    throw error
}

assert.ok(fs.existsSync(FIXTURE), `the frozen rendering fixture is missing: ${FIXTURE}`)
const frozen = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as Record<string, unknown>

const liveDigest = goldenCaseDigest(live)
const frozenDigest = goldenCaseDigest(frozen)

const marker = fs.existsSync(MARKER) ? (JSON.parse(fs.readFileSync(MARKER, 'utf8')) as any) : null

if (liveDigest !== frozenDigest) {
    assert.ok(
        marker && marker.knownStaleAgainst === liveDigest && typeof marker.because === 'string' && marker.because.trim().length > 0,
        [
            'THE FROZEN A04 RENDERING FIXTURE IS DETACHED FROM THE CANONICAL GAME.',
            `  frozen fixture    ${frozenDigest}   (input digest ${String((frozen as any).provenance?.inputDigest)})`,
            `  live Golden Case  ${liveDigest}   (input digest ${String((live as any).provenance?.inputDigest)})`,
            '',
            'Nothing here regenerates it. Exactly two deliberate acts clear this:',
            '  1. refresh it — npm run freeze:a04 — and then READ what the rendering suite now tests;',
            '  2. keep it, and SAY SO — write docs/audits/a04-fixture-currency.json as',
            `     { "knownStaleAgainst": "${liveDigest}", "because": "<why the older game is still the right thing to render against>" }`,
            '',
            'An acknowledgement names ONE digest and expires the next time anything moves.',
            'A fixture may be stale. It may not be silently stale.',
            marker ? `\nThe marker present names ${JSON.stringify(marker.knownStaleAgainst)}, which is not the live digest.` : '',
        ].join('\n'),
    )
    console.log(`fixture-currency.unit.ts — EXPLICITLY STALE against ${liveDigest}: ${marker.because}`)
} else {
    assert.ok(
        !marker || !marker.knownStaleAgainst,
        `the fixture is CURRENT (${liveDigest}) but docs/audits/a04-fixture-currency.json still declares it stale against ` +
            `${JSON.stringify(marker && marker.knownStaleAgainst)}. An overtaken acknowledgement must be DELETED, not left behind ` +
            `to excuse the next drift — which is exactly what it would do, since the next change would find a marker already in place.`,
    )
    console.log(`fixture-currency.unit.ts — CURRENT (${liveDigest})`)
}

/**
 * **Key identity of a COMPOSED fixture — stage K3, 15 October 2026 (his M1).** A game played in role blocks is served from
 * two complete games, and its fixture is block one's with a `roleBlocks` block holding each block's own fixture whole. That
 * boundary is new, so it is held the way this file holds the single fixture: every key a single game's fixture has reaches
 * each block, the composed fixture adds only the role nouns and the blocks, and the Golden Case digest — the one this file
 * compares — moves when anything inside either block moves (a block is part of what is frozen, not an attachment beside it).
 * TEST-ONLY roles on a copy of the possession game; never production data.
 */
{
    const session = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: Object.fromEntries(specializedRoleNames().map(name => [name, 0])) }
    const item = (itemId: string, row: string, selector: string, requirement: string, value: string) => ({ itemId, row, selector, requirement, value, valueStatus: 'N/A', strictness: 'REQUIRED', scope: 'WHOLE_GAME', basis: 'OWNER_RULING', checkability: 'STRUCTURAL', structuralClause: 'whole item', basisEvidence: 'TEST-ONLY' })
    const roles = { contractId: 'TEST-ONLY:roles', objectId: 'TEST-ONLY:roles', knowledgeVersion: 'stage-b', declarations: [], relationshipRules: [], items: [item('T-1', 'B1', 'activityRole=BUILDING', 'EXISTS', 'N/A'), item('T-2', 'B1', 'activityRole=PRESSING', 'EXISTS', 'N/A'), item('T-3', 'B3', '*', 'EQUALS', 'COACH_CALLS')] }
    const composed: any = buildActivityFromKnowledge(['GF2'], session, { alter: contracts => void contracts.push(JSON.parse(JSON.stringify(roles))) }).fixture
    const single: any = buildActivityFromKnowledge(['GF2'], session).fixture
    // Re-pointed 23 October 2026 (stage C, physical-layout.ts): each block also carries the account of what moves at the exchange, given
    // wherever the blocks were read and the markings are not set out once (here the only regions are the end lines, so it is empty), and
    // the composed fixture, block one's, carries it with it.
    assert.deepEqual(Object.keys(composed).sort(), [...Object.keys(single), 'remarking', 'roleBlocks', 'roleNouns'].sort(), 'the composed fixture adds the blocks, the role nouns and what moves, and drops nothing')
    for (const block of composed.roleBlocks.blocks) {
        assert.deepEqual(Object.keys(block.fixture).sort(), [...Object.keys(single), 'remarking', 'roleNouns'].sort(), `block ${block.blockId}: every key of a single fixture crosses`)
        assert.deepEqual(block.fixture.remarking, { lengthM: 40, changes: [] }, `block ${block.blockId}: nothing moves at the exchange`)
        assert.deepEqual(Object.keys(block.fixture.record).sort(), [...Object.keys(single.record), 'roleBlock'].sort(), `block ${block.blockId}: its record names the block it was derived for`)
    }
    const moved = JSON.parse(JSON.stringify(composed))
    moved.roleBlocks.blocks[1].fixture.game.envelope.area.length_m += 1
    assert.notEqual(goldenCaseDigest(moved), goldenCaseDigest(composed), 'a change inside the second block moves the digest')
    console.log('fixture-currency.unit.ts — composed (role-block) fixture keys carried')
}
