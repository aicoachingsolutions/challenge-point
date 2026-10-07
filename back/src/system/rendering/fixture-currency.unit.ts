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
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildGoldenCase, goldenCaseDigest, GoldenCaseUnavailable, OUT as FIXTURE } from './freeze-a04-fixture'

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
