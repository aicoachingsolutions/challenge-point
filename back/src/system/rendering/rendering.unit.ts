/**
 * The rendering boundary, tested on the frozen A04 fixture — and tested for whether it can FAIL.
 *
 * A fidelity checker that only ever passes is not evidence, so most of this file is negative: it feeds the
 * checker an invented number, a lost property, a softened requirement and a hardened preference, and
 * asserts that each one is caught. That is the SD-54 lesson applied to the renderer — a vacuous pass is
 * not a pass.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { checkFidelity } from './fidelity'
import { Instruction, RenderedActivity, renderConcreteGame } from './render-concrete-game'

const FIXTURE = path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json')
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))

const violations = (r: ReturnType<typeof checkFidelity>, q: number) => r.findings.filter(f => f.question === q && f.severity === 'VIOLATION')
const wrap = (instructions: Instruction[]): RenderedActivity => ({ instructions, coachingObservations: [] })

// ── The fixture is the one the closure run produced ──────────────────────────────────────────────
assert.equal(fixture.closure.renderEligible, true, 'the fixture must be the render-eligible closure output')
assert.equal(fixture.game.envelope.players, 12)

// ── The rendering is faithful; the GAME is still not coachable ───────────────────────────────────
//
// Q2, Q3 and Q4 pass — nothing is invented, nothing load-bearing is lost, no status is changed by wording.
// **Q5 reports, and no longer grades.** Two things moved under this comment and both are recorded here
// because each was once asserted as the reason the report failed:
//
//  1. The operational-participation requirement of 1 October is SATISFIED now — all three channels
//     participate, because the value modifier conditions on two of them and the objective references the
//     third. The participation violations are gone, and an assertion below pins that they stay gone.
//  2. What remained was the unestablished criterion, and on his ruling of 5 October that is a NOTE rather
//     than a VIOLATION: the rendering is faithful — it refuses to choose ball, player or touch — and the
//     gap is in the GAME. `passed` is a claim about the RENDERING, never a claim that the game is coachable.
const rendered = renderConcreteGame(fixture)
const report = checkFidelity(fixture, rendered)
const violationsOn = (q: number) => report.findings.filter(f => f.question === q && f.severity === 'VIOLATION')
/**
 * **Q3 IS BACK TO ZERO, and the exemption is gone because the fact now reaches the coach.**
 *
 * From 7 October this assertion was pinned to exactly one permitted violation — `possession.team` established
 * and carried by no instruction — because SD-104 exempted the initial holder while nothing read it. His later
 * ruling the same day closed that:
 *
 *   > *I accept the consequence you identified. Once an established rule reads possession, the initial holder
 *   > becomes activity-design information under SD-104. Therefore the rendered activity must faithfully
 *   > communicate which team starts in possession. Q3 should no longer exempt its omission once the modifier
 *   > depends on that relationship.*
 *
 * The Wide Zone modifier now terminates on a possession change (`V8d`), so a rule does read it. The activity
 * states that one team starts with the ball and cites `possession.team`, so there is no omission left to
 * exempt — **the violation cleared by the fact being communicated, not by the assertion being relaxed.** Which
 * team it is remains uncommunicable, because the two teams carry no distinguishing property; that is reported
 * as an observation and is a knowledge gap, not a lost value.
 */
for (const q of [2, 3, 4] as const) {
    assert.deepEqual(violationsOn(q), [], `Q${q} must pass: ${JSON.stringify(violationsOn(q))}`)
}
/**
 * **The unestablished criterion is reported and no longer graded, and the finding survives in full.**
 *
 * A coach is told the consequence — a line crossing is worth 2 instead of 1 when the condition is met — and
 * cannot be told what MEETS it. That is the fourth failure mode in his original question, operationally
 * obscured, and the one that passes every other test. It is kept, as a NOTE.
 */
const notesOn = (q: number) => report.findings.filter(f => f.question === q && f.severity === 'NOTE')
assert.deepEqual(violationsOn(5), [], `Q5 must raise no VIOLATION; got ${JSON.stringify(violationsOn(5))}`)

/**
 * **The criterion and participation findings moved to a named specimen, because A04 stopped exhibiting
 * them on 8 October.**
 *
 * Both are facts about a game carrying a VALUE MODIFIER: the criterion note says a coach is told the
 * consequence and cannot be told what meets it, and the participation assertion pins that the
 * violations stayed gone once the modifier conditioned on the channels. A04 no longer has a modifier
 * — the attacking-duel signal group resolves it specifically and it selects no Wide Zone at all — so
 * run against the live fixture these assertions measure nothing and the first of them failed.
 *
 * The specimen is the retired 7 October fixture, kept as historical evidence. It is the game that
 * exhibits the condition, and using it here is not presenting it as a legitimate A04 selection: it is
 * named as a rendering specimen for a capability the current game has no instance of. Deleting these
 * assertions instead would have dropped the coverage quietly, which is the failure this project keeps
 * paying for.
 */
const SPECIMEN = path.resolve(__dirname, '../../../../docs/audits/historical/a04-concrete-game-fixture-2026-10-07-wide-zone-package.json')
const specimen = JSON.parse(fs.readFileSync(SPECIMEN, 'utf8'))
const specimenRendered = renderConcreteGame(specimen)
const specimenReport = checkFidelity(specimen, specimenRendered)
const specimenOn = (q: number, severity: 'VIOLATION' | 'NOTE') =>
    specimenReport.findings.filter(f => f.question === q && f.severity === severity)

const criterion = specimenOn(5, 'NOTE').filter(f => /nothing in the game establishes what MEETS it/.test(f.what))
assert.equal(criterion.length, 1, 'the criterion finding must still be reported, exactly once')
assert.match(criterion[0].what, /complete and unusable/)
assert.match(criterion[0].what, /cannot be closed by authoring/, 'the note must say why there is no clearing condition')
assert.ok(
    !specimenOn(5, 'VIOLATION').some(f => /not functionally realized/.test(f.what)) &&
        !specimenOn(5, 'NOTE').some(f => /not functionally realized/.test(f.what)),
    'the participation violations must stay gone now that the modifier conditions on the channels',
)
// And the current game has no modifier at all, which is why the findings above have no instance in it.
assert.deepEqual(
    notesOn(5).filter(f => /nothing in the game establishes what MEETS it/.test(f.what)),
    [],
    'the live A04 game carries no value modifier, so it raises no criterion note',
)
/**
 * **`report.passed` is TRUE again**, which it has not been since the Sport Profile gave A04 a ball and a
 * possession relationship that nothing yet expressed. Both halves of the two-part assertion that stood here
 * for a day have collapsed back into the original one-liner, exactly as its own exit condition said they
 * would — and by the route it named: the holder is expressed.
 *
 * It remains a claim about the RENDERING and never a claim that the game is coachable. The four observations
 * are what the game still cannot tell a coach.
 */
assert.equal(report.passed, true, 'the RENDERING is faithful — this is not a claim that the game is coachable')
assert.deepEqual(
    report.findings.filter(f => f.severity === 'VIOLATION'),
    [],
    'and nothing is excepted to get there',
)

/**
 * **The two authored halves reach the coach, each citing the row that carries it.** Pinned by provenance
 * rather than by wording, so rephrasing the sentences is free and dropping either citation is not.
 */
{
    // The criterion and the termination are modifier facts, so they are pinned on the specimen for
    // the same reason as the findings above: the live A04 game has no value modifier to carry them.
    const citedOnSpecimen = (suffix: string) => specimenRendered.instructions.filter((i: any) => i.from.some((p: string) => p.endsWith(suffix)))
    const criterionCited = citedOnSpecimen('.condition.value')
    assert.equal(criterionCited.length, 1, 'the criterion that satisfies the condition reaches exactly one instruction')
    assert.match(criterionCited[0].text, /touches the ball inside one of them/, 'and it says what the touch is')
    const ends = citedOnSpecimen('.endsOn')
    assert.equal(ends.length, 1, 'the termination reaches exactly one instruction')
    assert.match(ends[0].text, /change of possession ends it/, 'and it says what ends it')

    // Who starts with the ball is not a modifier fact — the game form's own possession-change
    // transition reads the relationship — so it stays pinned on the live game, where it matters.
    const starts = rendered.instructions.filter(i => i.from.includes('possession.team'))
    assert.equal(starts.length, 1, 'who starts with the ball reaches exactly one instruction')
    assert.ok(
        !rendered.instructions.some(i => /#\d/.test(i.text)),
        'and no member handle reaches coach-facing text while doing it',
    )
}

/**
 * **THE CONTRADICTION HE ASKED ME TO CONFIRM IS GONE, and this is the test that keeps it gone.**
 *
 * The old check raised its VIOLATION unless `modifier.condition.satisfiedBy` was defined. That field has no
 * register row — V7, V8a, V8b, V9, V9a and V10 are the value-modifier rows and none carries a criterion — so
 * the only state that satisfied the fidelity check was one the invention check must reject. No legitimate
 * representation satisfied both.
 *
 * The property that fixes it is INDEPENDENCE: injecting the unauthorable field must change the report by
 * nothing at all. If someone reintroduces the dependency, this fails rather than passing quietly.
 */
const withPhantomField = JSON.parse(JSON.stringify(fixture))
for (const m of withPhantomField.game.value?.valueModifiers ?? []) {
    if (m.condition) m.condition.satisfiedBy = 'ANY_VALUE_AT_ALL'
}
const phantomReport = checkFidelity(withPhantomField, renderConcreteGame(withPhantomField))
assert.deepEqual(
    phantomReport.findings.filter(f => f.question === 5),
    report.findings.filter(f => f.question === 5),
    'authoring `condition.satisfiedBy` must change nothing — the check must not read a field with no register row',
)
assert.equal(phantomReport.passed, report.passed, 'and it must not change the verdict either')
assert.ok(rendered.instructions.length > 0, 'a report over zero instructions would be vacuous')
assert.ok(
    rendered.instructions.every(i => i.from.length > 0),
    'every instruction must cite at least one concrete-game property',
)

// Q1 is a deliverable, not a side effect: every instruction appears in the provenance trace.
assert.equal(report.provenance.length, rendered.instructions.length)

// ── Q2 FAILS on an invented number ───────────────────────────────────────────────────────────────
{
    const invented: Instruction = { section: 'Set up', text: 'Place 4 cones in each corner', status: 'DERIVED', from: ['envelope.players'], quantities: [4] }
    const r = checkFidelity(fixture, wrap([...rendered.instructions, invented]))
    assert.equal(violations(r, 2).length, 1, 'an invented quantity must be caught')
    assert.match(violations(r, 2)[0].what, /appears nowhere in the concrete game/)
}

// ── Q2 FAILS on an undeclared number, even a true one ────────────────────────────────────────────
// 20 IS in the game, but an instruction that does not declare its own quantities bypasses the check,
// so smuggling one into the prose must fail on that ground alone.
{
    const smuggled: Instruction = { section: 'How it works', text: 'Play for 20 minutes', status: 'DERIVED', from: ['envelope.duration_min'], quantities: [] }
    const r = checkFidelity(fixture, wrap([...rendered.instructions, smuggled]))
    assert.equal(violations(r, 2).length, 1, 'an undeclared number must be caught even when the game contains it')
    assert.match(violations(r, 2)[0].what, /without declaring it/)
}

// ── Q2 permits a cited collection's cardinality, and nothing else ────────────────────────────────
{
    const cardinality: Instruction = { section: 'Players', text: '2 teams', status: 'INSTANTIATED', from: ['performers.teams'], quantities: [2] }
    assert.equal(violations(checkFidelity(fixture, wrap([cardinality])), 2).length, 0, 'counting a cited collection is supported')
    // A number that is NOT a value in the game and NOT the size of the cited collection. (2 can no longer
    // serve: it is the modifier's authored magnitude, so it is legitimately in the game.)
    const uncited: Instruction = { ...cardinality, from: ['envelope.players'], text: '7 groups', quantities: [7] }
    assert.equal(violations(checkFidelity(fixture, wrap([uncited])), 2).length, 1, 'a count must cite the collection it counts')
}

// ── Q3 FAILS when a load-bearing property is dropped ─────────────────────────────────────────────
{
    const withoutScoring = rendered.instructions.filter(i => i.section !== 'How to score')
    const r = checkFidelity(fixture, wrap(withoutScoring))
    assert.ok(violations(r, 3).length >= 1, 'dropping the scoring instructions must be reported as a loss')
    assert.ok(
        violations(r, 3).some(f => f.what.includes('value.primaryEvent.kind')),
        'the lost property must be named',
    )
}

// ── Q3 reports a deliberately uncarried property as a NOTE, naming the reason ────────────────────
{
    const notes = report.findings.filter(f => f.question === 3 && f.severity === 'NOTE')
    assert.ok(notes.some(n => n.what.includes('startsEpisode')), 'an uncarried engine-internal property must still be reported')
    assert.ok(notes.every(n => n.what.includes('—')), 'each exclusion must state its reason')
}

// ── Q4 FAILS when wording changes a status, in both directions ────────────────────────────────────
{
    const softened: Instruction = { section: 'Set up', text: 'Mark out an area 40 m long, if you can', status: 'DERIVED', from: ['envelope.area.length_m'], quantities: [40] }
    assert.equal(violations(checkFidelity(fixture, wrap([softened])), 4).length, 1, 'a hedged requirement must be caught')

    const hardened: Instruction = { section: 'Set up', text: 'Channels must be exactly 6 m wide', status: 'PREFERENCE', from: ['envelope.area.width_m'], quantities: [6] }
    const r = checkFidelity(fixture, wrap([hardened]))
    assert.ok(violations(r, 4).some(f => f.what.includes('compulsory')), 'a preference worded as compulsory must be caught')

    const asNecessary: Instruction = { section: 'How to score', text: 'The rules require crossing the line', status: 'REALIZATION_CHOICE', from: ['value.primaryEvent.kind'], quantities: [] }
    assert.equal(violations(checkFidelity(fixture, wrap([asNecessary])), 4).length, 1, 'a choice presented as a necessity must be caught')
}

// ── Wording is generated from status, so a preference has no route to the imperative ──────────────
for (const instruction of rendered.instructions.filter(i => i.status === 'PREFERENCE')) {
    assert.match(instruction.text, /if it suits your group/, 'every preference carries its hedge')
    assert.doesNotMatch(instruction.text, /\bmust\b|\balways\b|\bexactly\b/i)
}
for (const instruction of rendered.instructions.filter(i => i.status === 'REALIZATION_CHOICE')) {
    assert.match(instruction.text, /^For this activity, /, 'a realization choice states itself as a fact about this activity')
}

// ── Q5 FAILS when a region has no marking instruction ────────────────────────────────────────────
//
// **Both arities, because the live game only has one region now.** The multi-region case used to run
// on A04 by stripping its two channel instructions; A04 holds a single region since 8 October, so
// stripping channels there removes nothing and the assertion measured zero. The specimen keeps the
// "each region is reported separately" claim, and the live game keeps the claim that a single
// unmarked region is reported too — which is the case a one-region game can actually exhibit.
{
    const withoutChannels = specimenRendered.instructions.filter((i: any) => !i.text.includes('channel'))
    const r = checkFidelity(specimen, wrap(withoutChannels))
    assert.ok(violations(r, 5).length >= 2, 'each unmarked region must be reported')
}
{
    const withoutTheLine = rendered.instructions.filter(i => !/mark a line across one end/.test(i.text))
    assert.equal(withoutTheLine.length, rendered.instructions.length - 1, 'the live game has exactly one region instruction to remove')
    const r = checkFidelity(fixture, wrap(withoutTheLine))
    assert.ok(violations(r, 5).length >= 1, 'a single unmarked region must be reported too')
}

// ── The team size reaches the coach, BECAUSE the game now establishes it ──────────────────────────
//
// This block previously asserted the opposite — that 6 must appear nowhere — because the game did not
// carry a team size and a renderer producing one would have been inventing it. The fix is upstream: the
// roster is now entailed into the concrete game, so rendering carries it like any other property. The
// assertion that matters has not changed, only what satisfies it: **the number in the text must come
// from the game.**
{
    const teams = fixture.game.performers.teams
    assert.ok(teams.length > 0, 'the fixture must contain teams')
    for (const team of teams) {
        assert.equal(typeof team.outfieldCount, 'number', 'every team must carry its size in the game')
    }
    const players = rendered.instructions.filter(i => i.section === 'Players')
    assert.ok(
        players.some(i => /\b2 teams of 6\b/.test(i.text)),
        `a coach must be told the team size; got ${JSON.stringify(players.map(i => i.text))}`,
    )
    assert.equal(report.findings.filter(f => f.question === 5 && f.what.includes('outfieldCount')).length, 0, 'the Q5 gap is closed')
    assert.ok(
        !rendered.coachingObservations.some(o => o.includes('neither team a size')),
        'the roster observation must not fire once the game carries the size',
    )
    // And it is the GAME's number, not arithmetic the renderer did: strip the game of team sizes and the
    // rendering must fall back to the count alone rather than recomputing 12 / 2.
    const stripped = JSON.parse(JSON.stringify(fixture))
    stripped.game.performers.teams.forEach((t: any) => delete t.outfieldCount)
    const withoutSizes = renderConcreteGame(stripped)
    assert.ok(
        withoutSizes.instructions.some(i => i.section === 'Players' && /^2 teams$/.test(i.text)),
        'with no size in the game the rendering must state the count only',
    )
    for (const instruction of withoutSizes.instructions) {
        assert.doesNotMatch(instruction.text, /\bteams? of 6\b|\b6-a-side\b/, 'rendering must never derive the team size itself')
    }
    assert.ok(
        withoutSizes.coachingObservations.some(o => o.includes('neither team a size')),
        'and it must report the gap rather than closing it',
    )
}

// ── Observations are evidence, never instructions ────────────────────────────────────────────────
// The coincident-channel observation is GONE: the restatement put one channel on each touchline, so the
// thing a coach would have questioned no longer exists in the game. The remaining three stand.
assert.ok(
    !rendered.coachingObservations.some(o => /same touchline|one strip/i.test(o)),
    'the coincident-channel observation must not fire once the channels are on opposite sides',
)
assert.ok(rendered.coachingObservations.length >= 3, 'the A04 game still produces several things a coach would question')
for (const observation of rendered.coachingObservations) {
    assert.ok(!rendered.instructions.some(i => i.text === observation), 'an observation must not be issued as an instruction')
}

// ── Operational participation: the scoring line DOES participate, so the check is not blanket-failing ──
{
    /**
     * **Read off the objectives rather than from a hardcoded region id.** This named `GF2-03.a`, the
     * single shared target, which was retired on 9 October when the directional arrangement replaced
     * it. The claim was never about that element though — it is that a target participates because an
     * objective REFERENCES it, not because it carries a function string. So it now asks the game which
     * regions its objectives point at, and makes the claim of each, which is both truer to the point
     * and indifferent to how many targets there are.
     */
    const targets = (fixture.game.objectives ?? [])
        .map((o: any) => o.reference?.structuralRef?.itemId)
        .filter(Boolean)
        .map((itemId: string) => fixture.game.space.regions.find((r: any) => String(r.elementId).includes(itemId)))
    assert.ok(targets.length > 0, 'the game must hold at least one objective with a target')
    assert.ok(
        targets.every(Boolean),
        `every objective's referenced target must exist as a region; got ${JSON.stringify(fixture.game.space.regions.map((r: any) => r.elementId))}`,
    )
    const notes = report.findings.filter(f => f.question === 5 && f.severity === 'NOTE')
    for (const target of targets) {
        assert.ok(
            notes.some(n => n.what.includes(target.elementId) && n.what.includes('participates operationally')),
            `${target.elementId} participates via its objective and must be reported as doing so; got ${JSON.stringify(notes)}`,
        )
        // It participates because the OBJECTIVE references it — not because it carries a function string.
        // His ruling is explicit that a prose description is not what is required.
        assert.equal(
            fixture.status.notEstablished.filter((n: any) => n.path.includes(target.elementId) && n.path.endsWith('.functions')).length,
            1,
            `${target.elementId}: its own functions row is unestablished, which must not prevent it participating`,
        )
    }

    // TEETH: remove the objective's reference and the target stops participating.
    //
    // **Counted against the game's own regions rather than against a literal.** This asserted 3 while
    // A04 held a target line and two Wide Zone channels. A04 holds one region since 8 October, so the
    // literal was really the region count wearing a number — and the claim it is making is "EVERY
    // region, including the target, is unrealized", which is what the comparison now says.
    const stripped = JSON.parse(JSON.stringify(fixture))
    stripped.game.objectives.forEach((o: any) => delete o.reference)
    stripped.game.value.valueModifiers = []
    const after = checkFidelity(stripped, renderConcreteGame(stripped))
    assert.equal(
        after.findings.filter(f => f.question === 5 && f.severity === 'VIOLATION').length,
        stripped.game.space.regions.length,
        'with nothing referencing them, every region including the target is unrealized',
    )
    assert.ok(stripped.game.space.regions.length >= 1, 'and there is at least one region for that to be a claim about')
}

// ── An exclusion must discharge its operational consequences, or it is not permitted ──────────────
//
// The second half of his metadata rule is the half that does the work: claiming a property is accounting
// metadata is cheap, proving its consequences reached the coach is not. Remove the instruction that carries
// `startsEpisode`'s one consequence and the exclusion must stop being honoured.
{
    const withoutContinuity = wrap(rendered.instructions.filter(i => !i.text.includes('Play continues')))
    const after = checkFidelity(fixture, withoutContinuity)
    const q3 = after.findings.filter(f => f.question === 3 && f.severity === 'VIOLATION')
    assert.ok(
        q3.some(f => f.what.includes('startsEpisode') && f.what.includes('reached no instruction')),
        `an undischarged exclusion must be a violation; got ${JSON.stringify(q3)}`,
    )
    // And with the instruction present it is a NOTE naming what discharges it — auditable, not silent.
    const note = report.findings.find(f => f.question === 3 && f.what.includes('startsEpisode'))
    assert.equal(note?.severity, 'NOTE')
    assert.match(note!.what, /Its operational consequence\(s\) are carried by .*playState/)
}

// ── The two channels are on OPPOSITE touchlines, and the rendering says so ────────────────────────
//
// The authored `lateral` selector now reaches the artifact and the geometry places them at opposite edges.
// Rendering both as "along the touchline" dropped that, and a coach would mark one strip twice.
// Pinned on the specimen: channels are Wide Zone regions, and the live A04 game holds none.
{
    const channels = specimen.game.space.regions.filter((r: any) => r.noun === 'channel')
    assert.equal(channels.length, 2, 'the restatement establishes exactly two channels')
    const sides = channels.map((r: any) => (r.selector ?? []).find((t: any) => t.attribute === 'lateral')?.value)
    assert.deepEqual([...sides].sort(), ['wide-left', 'wide-right'], 'each carries its authored side')

    // Opposite edges of the 30 m across axis, from AM-17's registered test rather than from any ordering.
    const across = channels.map((r: any) => r.realizedGeometry?.position?.across?.interval)
    assert.ok(across.every(Boolean), 'both have realized across geometry')
    const lows = across.map((i: any) => i.from).sort((a: number, b: number) => a - b)
    assert.equal(lows[0], 0, 'one touches the 0 touchline')
    assert.ok(lows[1] > 0, `the other does NOT — got ${JSON.stringify(across)}`)
    assert.equal(Math.max(...across.map((i: any) => i.to)), 30, 'and reaches the far touchline')

    const setup = specimenRendered.instructions.filter((i: any) => i.section === 'Set up').map((i: any) => i.text)
    assert.ok(setup.some((t: string) => /along one touchline/.test(t)), JSON.stringify(setup))
    assert.ok(setup.some((t: string) => /along the opposite touchline/.test(t)), JSON.stringify(setup))
    // Not left/right: the authored values name axis edges, not a coach's orientation.
    assert.ok(!setup.some((t: string) => /(left|right)/i.test(t)), 'the rendering must not invent an orientation')
}

// ── An established function is carried, not dropped (specimen: the channels carry it) ─────────────
// It is not what makes a region operationally realized — that is a separate question — but the game
// establishes it, so it may not disappear.
{
    const withFunctions = specimen.game.space.regions.filter((r: any) => Array.isArray(r.functions) && r.functions.length)
    assert.equal(withFunctions.length, 2, 'both channels carry the established member')
    assert.ok(
        specimenRendered.instructions.some((i: any) => /perceptual reference/.test(i.text)),
        'and the rendering carries it',
    )
}

console.log('rendering.unit.ts — ok')
