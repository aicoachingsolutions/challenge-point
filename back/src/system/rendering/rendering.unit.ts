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

import { buildActivityWithFixture } from './build-activity'
import { checkFidelity } from './fidelity'
import { Instruction, RenderedActivity, renderConcreteGame, sayRange } from './render-concrete-game'

const FIXTURE = path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json')
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))

const violations = (r: ReturnType<typeof checkFidelity>, q: number) => r.findings.filter(f => f.question === q && f.severity === 'VIOLATION')
const wrap = (instructions: Instruction[]): RenderedActivity => ({ instructions, coachingObservations: [], withheld: [] })

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

/**
 * ── RANGES: a flexible value is still told accurately — added 13 October 2026 ─────────────────────
 *
 * Christian: *"I agree with preserving authored ranges, selected starting values, alternatives, and the
 * reasons for those selections throughout realization and communication"*, and no wholesale relaxation with
 * it — *"If a condition materially affects the activity, it must be represented and communicated
 * accurately."*
 *
 * This check could not hold a range accurate in either direction, and each of the four cases below was
 * MEASURED against it before it was changed, on this same game — the possession game with a scoring
 * modifier, at 40 × 30, whose channels the knowledge holds between 4.5 m and 7.5 m wide and prefers at 6 m
 * to 7.5 m:
 *
 *   1. *"Around 12 m to 20 m wide works well"* — PASSED. 12 is the number of players and 20 the minutes.
 *   2. *"up to 30 m wide"* — PASSED. 30 is the width of the area.
 *   3. both preference sentences deleted — PASSED, with nothing reported.
 *   4. *"between 4.5 m and 7.5 m wide"*, which is exactly what is authored — REFUSED: 4.5 appeared nowhere.
 *
 * The first three are violations now and the fourth passes. The game is the one a coach is served, taken
 * from the builder rather than rebuilt here, with the fixture it was checked from.
 */
{
    const roles = { ...fixture.envelope.roles }
    const built = (lengthM: number, widthM: number) => {
        const out = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: 'scoring-modifier', session: { players: 12, lengthM, widthM, durationMin: 20, roles } })
        assert.equal(out.activity.outcome, 'served', `the demonstration must be served at ${lengthM} x ${widthM}: ${JSON.stringify((out.activity as any).reasons)}`)
        return { game: out.fixture as any, said: (out.activity as any).rendered as RenderedActivity }
    }
    const { game, said } = built(40, 30)
    const all = (r: ReturnType<typeof checkFidelity>) => r.findings.filter(f => f.severity === 'VIOLATION')
    const isMarking = (i: Instruction) => i.text.startsWith('Mark a channel')
    const isPreference = (i: Instruction) => i.status === 'PREFERENCE'
    const reworded = (which: (i: Instruction) => boolean, change: (i: Instruction) => Instruction) => wrap(said.instructions.map(i => (which(i) ? change(i) : i)))

    // 4 — THE ACCURATE STATEMENT PASSES. It is what the renderer now says, and nothing is excepted for it.
    {
        const marking = said.instructions.filter(isMarking)
        assert.deepEqual(
            marking.map(i => [i.text, i.status, i.quantities]),
            [
                ['Mark a channel along one touchline, 40 m long and between 4.5 m and 7.5 m wide', 'DERIVED', [40, 4.5, 7.5]],
                ['Mark a channel along the opposite touchline, 40 m long and between 4.5 m and 7.5 m wide', 'DERIVED', [40, 4.5, 7.5]],
            ],
            'the requirement is stated with BOTH its ends, as a requirement',
        )
        assert.deepEqual(said.instructions.filter(isPreference).map(i => i.text), Array(2).fill('Around 6 m to 7.5 m wide works well, if it suits your group'))
        assert.deepEqual(all(checkFidelity(game, said)), [], 'the accurate range must pass')
    }

    // 1 — A WRONG PREFERRED RANGE, made of numbers the game really does hold elsewhere.
    {
        const r = checkFidelity(game, reworded(isPreference, i => ({ ...i, text: 'Around 12 m to 20 m wide works well, if it suits your group', quantities: [12, 20] })))
        assert.equal(violations(r, 2).filter(f => /offers (12|20) as a preference/.test(f.what)).length, 4, `each wrong number, in each sentence: ${JSON.stringify(violations(r, 2))}`)
        assert.match(violations(r, 2)[0].what, /the preferred range of what it cites is 6 to 7\.5/, 'and the finding says what the range is')
        assert.equal(violations(r, 3).filter(f => /authored preferred range .* no instruction offers it/.test(f.what)).length, 2, 'and the real one is now offered by nobody')
    }

    // 2 — A WRONG REQUIRED LIMIT: the width of the area, said as the width of the channel.
    {
        const r = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace('between 4.5 m and 7.5 m wide', 'up to 30 m wide'), quantities: [40, 30] })))
        assert.equal(violations(r, 2).filter(f => /states 30, which is neither a value the game holds at a property it cites nor a required limit/.test(f.what)).length, 2, JSON.stringify(violations(r, 2)))
        assert.equal(violations(r, 3).filter(f => /required (minimum of 4\.5|maximum of 7\.5)/.test(f.what)).length, 4, 'and neither real limit is stated, for either channel')
    }

    // 3 — THE PREFERENCE LEFT OUT. Authored guidance dropped is authored knowledge lost.
    {
        const r = checkFidelity(game, wrap(said.instructions.filter(i => !isPreference(i))))
        const lost = violations(r, 3)
        assert.equal(lost.length, 2, `one for each channel: ${JSON.stringify(lost)}`)
        for (const finding of lost) assert.match(finding.what, /carries an authored preferred range that may be offered here \(6 to 7\.5\), and no instruction offers it/)
        assert.deepEqual(violations(r, 2), [], 'nothing said is wrong; something is missing')
    }

    // The requirement stated by half — the sentence exactly as it read until this change — is a loss too.
    // This is why the wording and the check had to land together.
    {
        const r = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace('between 4.5 m and 7.5 m wide', 'up to 7.5 m wide'), quantities: [40, 7.5] })))
        assert.deepEqual(violations(r, 2), [], '7.5 is the channel\'s own maximum, so nothing said is wrong')
        assert.equal(violations(r, 3).length, 2)
        for (const finding of violations(r, 3)) assert.match(finding.what, /has a required minimum of 4\.5 \(required: 4\.5 to 7\.5\), and no instruction that cites it states that minimum/)
    }

    // The width left out altogether, with the property still cited: a citation is not a statement.
    {
        const r = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace(' and between 4.5 m and 7.5 m wide', ''), quantities: [40] })))
        assert.equal(violations(r, 3).filter(f => /required (minimum|maximum)/.test(f.what)).length, 4, JSON.stringify(violations(r, 3)))
    }

    // A preference stated as the requirement: the preferred floor in the requirement's sentence.
    {
        const r = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace('between 4.5 m', 'between 6 m'), quantities: [40, 6, 7.5] })))
        assert.equal(violations(r, 2).filter(f => /states 6, which is neither/.test(f.what)).length, 2, 'a preferred limit may not be said as a required one')
        assert.equal(violations(r, 3).filter(f => /required minimum of 4\.5/.test(f.what)).length, 2)
    }

    // A preference that states only part of its range has not offered the range.
    {
        const r = checkFidelity(game, reworded(isPreference, i => ({ ...i, text: 'Around 6 m wide works well, if it suits your group', quantities: [6] })))
        assert.equal(violations(r, 3).filter(f => /no instruction offers it/.test(f.what)).length, 2)
    }

    // The range is the LINE's, worked out from what was authored and this session's width — not read back
    // from the metres the renderer printed. Change the session under the same rendering and it stops matching.
    {
        const narrower = JSON.parse(JSON.stringify(game))
        narrower.envelope.widthM = 20
        const r = checkFidelity(narrower, said)
        assert.ok(violations(r, 3).some(f => /required minimum of 3 \(required: 3 to 5\)/.test(f.what)), `0.15 and 0.25 of a 20 m width: ${JSON.stringify(violations(r, 3))}`)
    }

    // What crosses the boundary is what lets any of this be checked, and it is carried, not projected.
    {
        const across = game.status.bounds.filter((b: any) => String(b.path).endsWith('.position.across'))
        assert.equal(across.length, 2, 'each channel\'s width carries its bounds beside its derived position')
        for (const entry of across) {
            assert.deepEqual(
                entry.bounds.map((b: any) => [b.kind, b.min, b.max, b.preferred, !!b.fractionOfAxis]),
                [
                    ['COUNT', 6, 10, true, false],
                    ['COUNT', 0.15, 0.25, false, true],
                ],
            )
        }
        assert.ok(game.status.bounds.some((b: any) => b.bounds.some((bound: any) => bound.forbidden)), 'an exclusion crosses too, marked, and is no part of any range')
    }

    /**
     * **A required limit is a number of ITS LINE — supported for a sentence that cites the line, and for no
     * other.** Added in the review of 13 October 2026.
     *
     * The range work first made every limit a number of the whole game: the limits were added to the set
     * every sentence is tested against, and the metres realization writes beside the interval
     * (`requiredWithin`) sit in the geometry that set is gathered from. Measured: *"Play for 4.5 minutes"*
     * — 4.5 m being a channel's minimum width — was REFUSED before the range work and PASSED after it. That
     * is the old test's weakness, *"any number that appears somewhere in the game"*, given more numbers.
     */
    {
        const isDuration = (i: Instruction) => i.text.startsWith('Play for')
        const borrowed = checkFidelity(game, reworded(isDuration, i => ({ ...i, text: 'Play for 4.5 minutes', quantities: [4.5] })))
        assert.deepEqual(
            violations(borrowed, 2).map(f => f.what),
            ['"Play for 4.5 minutes" states 4.5, which appears nowhere in the concrete game'],
            'a channel\'s minimum width is not a number of the duration',
        )
        // The marking sentence saying the right limits while no longer citing the line they belong to: the
        // minimum is unsupported where it is said, and both ends are unsaid where they are owed.
        const uncited = checkFidelity(game, reworded(isMarking, i => ({ ...i, from: i.from.filter(p => !p.endsWith('.position.across')) })))
        assert.equal(violations(uncited, 2).filter(f => /states 4\.5, which appears nowhere in the concrete game/.test(f.what)).length, 2, JSON.stringify(violations(uncited, 2)))
        assert.equal(violations(uncited, 3).filter(f => /required (minimum of 4\.5|maximum of 7\.5)/.test(f.what)).length, 4)
        // The check does not read the metres back from what realization wrote for the renderer: take them
        // out of the fixture and the accurate rendering still passes, because the range is worked out here.
        const without = JSON.parse(JSON.stringify(game))
        for (const g of without.status.geometry) if (g.geometry?.extentBound) delete g.geometry.extentBound.requiredWithin
        assert.deepEqual(all(checkFidelity(without, said)), [], 'the authored bound and the session are enough')
    }

    // Wrong limits that are nobody's numbers at all, and a limit rounded for display: each is refused twice
    // over — the number is not the line's, and the limit it replaced is now unsaid.
    {
        const invented = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace('between 4.5 m and 7.5 m', 'between 5 m and 8 m'), quantities: [40, 5, 8] })))
        assert.equal(violations(invented, 2).filter(f => /states (5|8), which is neither a value the game holds at a property it cites nor a required limit/.test(f.what)).length, 4)
        assert.equal(violations(invented, 3).filter(f => /required (minimum of 4\.5|maximum of 7\.5)/.test(f.what)).length, 4)
        const rounded = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace('4.5 m', '5 m'), quantities: [40, 5, 7.5] })))
        assert.equal(violations(rounded, 3).filter(f => /required minimum of 4\.5/.test(f.what)).length, 2, '4.5 said as 5 is 4.5 not said')
        // The requirement said only under a preference's status is not said: a hedge does not carry a limit.
        const hedged = checkFidelity(game, reworded(isMarking, i => ({ ...i, status: 'PREFERENCE', text: `${i.text}, if it suits your group` })))
        assert.equal(violations(hedged, 3).filter(f => /required (minimum|maximum)/.test(f.what)).length, 4)
    }

    /**
     * **A bound that crosses the boundary with no path is reported, not skipped in silence.** A range the
     * check cannot attach to a line is a range it cannot hold a sentence to; saying nothing about it is how
     * an authored range goes missing with the check still green.
     */
    {
        const pathless = JSON.parse(JSON.stringify(game))
        const entry = pathless.status.bounds.find((b: any) => String(b.path).endsWith('.position.across'))
        const lineId = entry.lineId
        entry.path = null
        const notes = checkFidelity(pathless, said).findings.filter(f => f.severity === 'NOTE' && f.what.includes(`the bounds of ${lineId} crossed the rendering boundary with no path`))
        assert.equal(notes.length, 1)
    }

    /**
     * **KNOWN LIMIT, pinned so the next person is told rather than left to find it — review of 13 October.**
     * The range check holds a sentence to the SET of numbers its cited lines carry. It does not know which
     * number plays which part: the same three numbers with the channel's length and width exchanged pass,
     * because 40, 4.5 and 7.5 each belong to a property the sentence cites. The check reads numbers and
     * never the words around them (the renderer's noun repair of 7 October records the same limit). What
     * stops this sentence today is that `sayRange` is the only thing that words a range. If this assertion
     * ever fails because the check has learned to tell the parts apart, delete it gladly.
     */
    {
        const exchanged = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace('40 m long and between 4.5 m and 7.5 m wide', '7.5 m long and between 4.5 m and 40 m wide') })))
        assert.deepEqual(all(exchanged), [], 'not caught: the numbers are the cited lines\' own, in the wrong places')
    }

    // WHERE THE PREFERENCE CANNOT BE OFFERED it is not offered, and that is reported rather than silent.
    // On a 15 m width the requirement is 2.25 m to 3.75 m and the preferred 6 m to 10 m lies wholly outside.
    {
        const small = built(20, 15)
        assert.equal(small.said.instructions.filter(isPreference).length, 0, 'no preference is offered that the requirement excludes')
        const r = checkFidelity(small.game, small.said)
        assert.deepEqual(all(r), [])
        const notes = r.findings.filter(f => f.question === 3 && f.severity === 'NOTE' && /wholly outside what is required here \(2\.25 to 3\.75\)/.test(f.what))
        assert.equal(notes.length, 2, `one for each channel: ${JSON.stringify(r.findings.filter(f => f.question === 3))}`)
        // TEETH — offering it anyway is refused: it is not this line's preferred range, because it has none here.
        const offered: Instruction = { section: 'Set up', text: 'Around 6 m to 10 m wide works well, if it suits your group', status: 'PREFERENCE', from: [small.game.status.bounds.find((b: any) => String(b.path).endsWith('.position.across')).path], quantities: [6, 10] }
        assert.equal(violations(checkFidelity(small.game, wrap([...small.said.instructions, offered])), 2).filter(f => /nothing it cites carries a preferred range that may be offered/.test(f.what)).length, 2)
    }
}

/**
 * **A fixture frozen before 13 October is still checked for its range, not waved through.**
 *
 * The specimen holds the channel's bound as realization recorded it then — the fraction, and the preference
 * expressed inside it — and no requirement in metres, so the renderer has nothing to state the minimum from
 * and says what it always said. The check works the minimum out from the fraction and the area and reports
 * that the sentence does not state it. That is the honest reading of an old game by a stricter check: the
 * specimen is kept as evidence of the capabilities named above, not as a rendering that passes today.
 */
{
    const marking = specimenRendered.instructions.filter((i: any) => i.text.startsWith('Mark a channel')).map((i: any) => i.text)
    assert.deepEqual(marking, ['Mark a channel along one touchline, 40 m long and up to 7.5 m wide', 'Mark a channel along the opposite touchline, 40 m long and up to 7.5 m wide'])
    assert.deepEqual(
        specimenReport.findings.filter(f => f.severity === 'VIOLATION').map(f => [f.question, /required minimum of 4\.5 \(required: 4\.5 to 7\.5\)/.test(f.what)]),
        [
            [3, true],
            [3, true],
        ],
        'the only thing it is refused for is the minimum it cannot state',
    )
}

/**
 * ── ONE WAY OF SAYING A RANGE, on a line that is a COUNT ──────────────────────────────────────────
 *
 * The channel's width is the only range a served activity states today. The helper that states it is
 * general, and so is the check, and a general thing with one instance is not proved general — so both are
 * exercised here on the other shape there is: a whole-number count that realization closed to a STARTING
 * value inside an authored range, with a required floor and a preferred range beside it. The line is put
 * into a copy of the fixture by hand; nothing in the corpus that is served holds one yet.
 *
 * The three sentences are the three parts of the range and each has the status of its part. Their wording
 * here is a pattern for whoever words such a line for a coach, not coach text that anybody is served.
 *
 * **RE-POINTED 13 October 2026 (Stage B3).** The renderer now words this very line itself — the neutral
 * count, in the Players section — so rendering the altered fixture already says all three parts, and the
 * hand-built sentences below were being added to a rendering that had them. `base` is therefore the
 * rendering with the renderer's own sentences about this line taken out, which is what it was when this
 * block was written; every assertion after that is unchanged. The renderer's own sentences are pinned on a
 * real game further down, in the neutral-players block.
 */
{
    const path_ = 'performers.neutrals.count'
    const counted = JSON.parse(JSON.stringify(fixture))
    counted.game.performers.neutrals = { count: 2 }
    counted.status.choices.push({
        lineId: 'game::P5',
        path: path_,
        value: 2,
        because: 'a test',
        authority: 'SD-39',
        boundCheck: 'WITHIN_COUNT',
        within: {
            permitted: null,
            bounds: [
                { kind: 'COUNT', min: 1, max: null, term: '>= 1 (no authored maximum)', preferred: false },
                { kind: 'COUNT', min: 1, max: 2, term: '1-2 (one or two)', preferred: true },
            ],
        },
        closure: 'STARTING_VALUE_IN_RANGE',
    })
    const plural = (n: number | null) => (n === 1 ? '' : 's')
    const sentences = sayRange('Players', { path: path_, required: { min: 1, max: null }, preferred: { min: 1, max: 2 }, starting: 2 }, {
        number: n => String(n),
        starting: (value, n) => `${value} neutral player${plural(n)}`,
        required: (limits, range) => `Use ${limits} neutral player${plural(range.max ?? range.min)}`,
        preferred: (around, range) => `${around} neutral player${plural(range.max ?? range.min)} works well`,
    })
    assert.deepEqual(
        [sentences.starting, sentences.required, sentences.preferred].map(i => [i!.text, i!.status, i!.from, i!.quantities]),
        [
            ['For this activity, 2 neutral players', 'REALIZATION_CHOICE', [path_], [2]],
            ['Use at least 1 neutral player', 'DERIVED', [path_], [1]],
            ['Around 1 to 2 neutral players works well, if it suits your group', 'PREFERENCE', [path_], [1, 2]],
        ],
        'a starting value, a requirement and a preference — never one sentence doing the work of another',
    )
    const own = renderConcreteGame(counted).instructions.filter(i => i.from.includes(path_))
    assert.equal(own.length, 3, `the renderer says the three parts of this line itself now: ${JSON.stringify(own.map(i => i.text))}`)
    const base = renderConcreteGame(counted).instructions.filter(i => !i.from.includes(path_))
    const withRange = (...extra: (Instruction | null)[]) => checkFidelity(counted, wrap([...base, ...(extra.filter(Boolean) as Instruction[])]))
    const about = (r: ReturnType<typeof checkFidelity>) => r.findings.filter(f => f.severity === 'VIOLATION' && (f.what.includes(path_) || f.what.includes('neutral')))

    assert.deepEqual(about(withRange(sentences.starting, sentences.required, sentences.preferred)), [], 'all three said: nothing lost and nothing wrong')

    // The starting value alone: where the activity starts is said, and the range it starts inside is not.
    const alone = about(withRange(sentences.starting))
    assert.deepEqual(alone.map(f => f.question), [3, 3], JSON.stringify(alone))
    assert.ok(alone.some(f => /required minimum of 1/.test(f.what)) && alone.some(f => /preferred range that may be offered here \(1 to 2\)/.test(f.what)))

    // The range without the value: a coach is told what is allowed and not what this activity uses.
    assert.ok(about(withRange(sentences.required, sentences.preferred)).some(f => /starts at 2 in this activity, inside an authored range, and no instruction that cites it states that value/.test(f.what)))

    // A wrong preferred range for a count is caught exactly as a wrong width is.
    const wrong = about(withRange(sentences.starting, sentences.required, { ...sentences.preferred!, text: 'Around 5 to 12 neutral players works well, if it suits your group', quantities: [5, 12] }))
    assert.ok(wrong.some(f => f.question === 2 && /offers 5 as a preference/.test(f.what)), JSON.stringify(wrong))

    // And the helper says only what the line carries: no preference, no preference sentence; one end, one end.
    const floorOnly = sayRange('Players', { path: path_, required: { min: 1, max: null }, preferred: null, starting: null }, { number: String, required: l => `Use ${l}`, preferred: a => `${a} works well`, starting: v => v })
    assert.deepEqual([floorOnly.required?.text, floorOnly.preferred, floorOnly.starting], ['Use at least 1', null, null])
    const both = sayRange('Set up', { path: 'x', required: { min: 4, max: 6 }, preferred: { min: 5, max: 5 }, starting: null }, { number: n => `${n} m`, required: l => `Make it ${l} wide`, preferred: a => `${a} wide works well` })
    assert.deepEqual([both.required?.text, both.preferred?.text], ['Make it between 4 m and 6 m wide', 'Around 5 m wide works well, if it suits your group'])
    assert.equal(sayRange('Set up', { path: 'x', required: { min: null, max: 6 }, preferred: null, starting: null }, { number: n => `${n} m`, required: l => `Make it ${l} wide` }).required?.text, 'Make it up to 6 m wide')
}

/**
 * **What the frozen game carries across the boundary — the half of the range work A04 can show.** A04 holds
 * no numeric range, so its rendered text does not move; what moved is what the fixture keeps. Each choice
 * says what kind of closing it was and what it was chosen within, and each derived value says where it
 * comes from — which is what a later adjustment has to know before it may touch one.
 */
{
    const closures = Object.fromEntries(fixture.status.choices.map((c: any) => [c.lineId.split(':').pop(), c.closure]))
    assert.deepEqual(new Set(fixture.status.choices.map((c: any) => c.closure)), new Set(['CHOSEN_AMONG_ALTERNATIVES', 'ONLY_VALUE', 'COACH_DECIDES']), JSON.stringify(closures))
    for (const choice of fixture.status.choices) {
        assert.ok(choice.within && Array.isArray(choice.within.bounds), `${choice.lineId} must carry what it was chosen within`)
        assert.ok(typeof choice.because === 'string' && choice.because.length > 0, `${choice.lineId} must keep its reason`)
    }
    const noun = fixture.status.choices.find((c: any) => String(c.path).endsWith('.noun'))
    assert.deepEqual(noun.within.permitted, ['zone', 'line'], 'the alternative not taken is still there to be seen')
    assert.deepEqual(fixture.status.choices.filter((c: any) => c.defaultedBy).map((c: any) => c.closure), ['ONLY_VALUE', 'ONLY_VALUE'], 'what a rule closed is marked as closed by rule')
    for (const derived of fixture.status.derived) {
        assert.ok(Array.isArray(derived.support) && derived.support.length > 0, `${derived.lineId} must say what supports it`)
    }
    assert.ok(Array.isArray(fixture.status.bounds), 'and the bounds beside derived values are carried, even where this game has few')
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

/**
 * **Availability is not involvement, at the rendering boundary — added 13 October.**
 *
 * Two things were wrong together and each hid the other. The renderer spoke about a specialized role only
 * when the session stated zero, and fidelity question 3 built its list of what must be carried from
 * `status.derived` and `status.choices` and never from `status.entailed`, where the roster lives. So a game
 * whose teams each held one specialized performer rendered "2 teams of 5" from twelve players, said nothing
 * about the other two, and passed with 0 violations.
 *
 * The role's name is read from the fixture's own session statement, so nothing here names one.
 */
{
    const [role] = Object.keys(fixture.envelope.roles)
    assert.ok(role, 'the fixture must state availability for a specialized role, or this block tests nothing')
    const property = `performers.teams[].${role}`
    const players = (r: RenderedActivity) => r.instructions.filter(i => i.section === 'Players')
    const variant = (available: number, involved: number[]) => {
        const copy = JSON.parse(JSON.stringify(fixture))
        copy.envelope.roles[role] = available
        const outfield = (12 - involved.reduce((a, b) => a + b, 0)) / 2
        copy.game.performers.teams.forEach((team: any, i: number) => {
            team[role] = involved[i]
            team.outfieldCount = outfield
        })
        for (const entry of copy.status.entailed) {
            const at = copy.game.performers.teams.findIndex((team: any) => team.elementId === entry.handle)
            entry.value = entry.leaf === role ? involved[at] : outfield
        }
        return copy
    }

    // None available, none involved: the session's own statement, word for word as before, now CITING the property.
    {
        const said = players(rendered).filter(i => i.from.includes(property))
        assert.deepEqual(said.map(i => [i.text, i.status]), [[`No ${role}s — everyone is an outfield player`, 'SESSION']])
        assert.ok(players(rendered).some(i => i.from.includes('performers.teams[].outfieldCount')), 'and the team size cites the property it states')
    }

    // Some available, none involved: said as a fact about this activity, and nobody goes missing.
    {
        const game = variant(2, [0, 0])
        const out = renderConcreteGame(game)
        assert.ok(players(out).some(i => i.text === '2 teams of 6'), 'everyone is still in a team')
        assert.deepEqual(
            players(out).filter(i => i.from.includes(property)).map(i => [i.text, i.status]),
            [[`This activity does not use ${role}s — everyone plays as an outfield player`, 'DERIVED']],
        )
        assert.deepEqual(checkFidelity(game, out).findings.filter(f => f.severity === 'VIOLATION'), [])
    }

    // Involved: each team's count is stated, with the number declared so question 2 checks it against the game.
    {
        const game = variant(2, [1, 1])
        const out = renderConcreteGame(game)
        assert.ok(players(out).some(i => i.text === '2 teams of 5'))
        const said = players(out).filter(i => i.from.includes(property))
        assert.deepEqual(said.map(i => [i.text, i.status, i.quantities]), [[`Each team also has 1 ${role}`, 'DERIVED', [1]]])
        assert.deepEqual(checkFidelity(game, out).findings.filter(f => f.severity === 'VIOLATION'), [])

        // TEETH — the defect itself. Say the teams and drop the role, as the renderer used to, and it is a loss.
        const silent = wrap(out.instructions.filter(i => !i.from.includes(property)))
        const lost = violations(checkFidelity(game, silent), 3)
        assert.equal(lost.length, 1, `an unsaid specialized-role count must be a violation; got ${JSON.stringify(lost)}`)
        assert.ok(lost[0].what.includes(property), lost[0].what)
    }

    // TEETH — a team size that stops citing its property is a loss too, however right the sentence still reads.
    {
        const uncited = wrap(rendered.instructions.map(i => ({ ...i, from: i.from.filter(f => f !== 'performers.teams[].outfieldCount') })))
        const lost = violations(checkFidelity(fixture, uncited), 3)
        assert.ok(lost.some(v => v.what.includes('performers.teams[].outfieldCount')), JSON.stringify(lost))
    }

    // Teams that differ cannot be told apart, so nothing is said — and saying nothing about an entailed
    // count is reported by the check rather than waved through.
    {
        const game = variant(1, [1, 0])
        const out = renderConcreteGame(game)
        assert.equal(players(out).filter(i => i.from.includes(property)).length, 0, 'no sentence may average or pick a team')
        assert.ok(out.coachingObservations.some(o => o.includes('different') && o.includes(role)), 'the gap is reported')
        assert.ok(violations(checkFidelity(game, out), 3).some(v => v.what.includes(property)), 'and the activity is not passed')
    }

    // No handle travels with any of it: the citation is the property, with the member left open.
    for (const instruction of rendered.instructions) {
        for (const from of instruction.from) assert.ok(!from.includes('#'), `a citation must carry no member handle: ${from}`)
    }
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

/**
 * ── NEUTRAL PLAYERS: said from the game, and refused when altered — added 13 October 2026 ─────────
 *
 * Christian, 13 October: *"Please proceed with the neutral-player participation functionality, including
 * roster arithmetic and coach-facing communication. For the proposed neutral-player condition, my preference
 * is that the neutral supports whichever team currently has possession and changes allegiance immediately
 * when possession changes. That should be explicit in the activity rather than left ambiguous."*
 *
 * The game is the `neutral-players` mechanism demonstration as a coach is served it — the possession game
 * form with the neutral condition, from the builder, with the fixture it was checked from. It is a mechanism
 * demonstration and no Learning Goal's activity: he has not approved the condition for any goal.
 *
 * Most of this is negative, like the rest of the file. Each sentence is taken away or altered in turn and
 * the check must refuse the result; and each value the renderer has no faithful wording for must be WITHHELD
 * and reported, never paraphrased — after which the check finds the property uncarried and refuses that too.
 */
{
    const roles = { ...fixture.envelope.roles }
    const built = (players: number) => {
        const out = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId: 'neutral-players', session: { players, lengthM: 40, widthM: 30, durationMin: 20, roles } })
        assert.equal(out.activity.outcome, 'served', `the demonstration must be served with ${players} players: ${JSON.stringify((out.activity as any).reasons)}`)
        return { game: out.fixture as any, said: (out.activity as any).rendered as RenderedActivity }
    }
    const { game, said } = built(12)
    const all = (r: ReturnType<typeof checkFidelity>) => r.findings.filter(f => f.severity === 'VIOLATION')
    const inPlayers = (activity: RenderedActivity) => activity.instructions.filter(i => i.section === 'Players')
    const without = (which: (i: Instruction) => boolean) => wrap(said.instructions.filter(i => !which(i)))
    const reworded = (which: (i: Instruction) => boolean, change: (i: Instruction) => Instruction) => wrap(said.instructions.map(i => (which(i) ? change(i) : i)))
    const COUNT = 'performers.neutrals.count'
    const JOINS = 'performers.neutrals.affiliation.joins'
    const ON = 'performers.neutrals.affiliation.on'
    const MEANS = 'performers.neutrals.distinguishable'
    const [participation] = game.game.performers.participation
    const STATE = `performers.participation[${participation.elementId}].state`
    const [carrier] = game.game.objects
    const KIND = `objects[${carrier.elementId}].kind`

    // WHAT A COACH READS, with the status of each sentence and the properties behind it.
    assert.deepEqual(
        inPlayers(said).map(i => [i.text, i.status, i.from, i.quantities]),
        [
            ['12 players in total', 'DERIVED', ['envelope.players'], [12]],
            ['2 teams of 5', 'INSTANTIATED', ['performers.teams', 'performers.teams[].outfieldCount'], [2, 5]],
            [`No ${Object.keys(roles)[0]}s — everyone is an outfield player`, 'SESSION', ['envelope.roles', `performers.teams[].${Object.keys(roles)[0]}`], []],
            [
                'For this activity, 2 of the 12 players are neutral players, so the team with the ball has 2 more players than the team without it',
                'REALIZATION_CHOICE',
                // Re-pointed in the B3 review, 13 October: this cited `performers.teams[].outfieldCount` too, which
                // it does not state, and so carried the team size for "2 teams of 5" — see the block below.
                [COUNT, 'envelope.players', JOINS, 'performers.teams', KIND],
                [2, 12],
            ],
            ['The game needs at least 1 neutral player', 'DERIVED', [COUNT], [1]],
            ['Around 1 to 2 neutral players works well, if it suits your group', 'PREFERENCE', [COUNT], [1, 2]],
            ['The neutral players always play with whichever team has the ball, and change sides when possession changes', 'DERIVED', [JOINS, ON, KIND], []],
            ['Make the neutral players easy to tell apart from both teams — contrasting bibs', 'DERIVED', [MEANS, 'performers.teams'], []],
            ['The neutral players are active in the game — not waiting, resting or watching', 'DERIVED', [STATE, `performers.participation[${participation.elementId}].selector`], []],
            ['For this activity, one team starts with the ball — the game does not fix which, so pick one and tell both teams before you start', 'REALIZATION_CHOICE', ['possession.team', 'performers.teams'], []],
        ],
        'the Players section, sentence by sentence',
    )
    assert.deepEqual(all(checkFidelity(game, said)), [], 'and it is faithful')
    // The count is where the activity STARTS: the game holds it as a choice closed by rule inside a range.
    const recorded = game.status.choices.find((c: any) => c.path === COUNT)
    assert.deepEqual([recorded.value, recorded.closure, recorded.defaultedBy, recorded.within.rosterAdmits], [2, 'STARTING_VALUE_IN_RANGE', 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS', [2, 4, 6, 8, 10]])
    // No member handle reaches a sentence or a citation.
    for (const i of said.instructions) assert.ok(!i.text.includes('#') && !i.from.some(p => p.includes('#')), `${i.text} / ${JSON.stringify(i.from)}`)

    // With one neutral every sentence about them agrees in number.
    const thirteen = built(13)
    assert.deepEqual(all(checkFidelity(thirteen.game, thirteen.said)), [])
    assert.deepEqual(inPlayers(thirteen.said).slice(0, 2).map(i => i.text), ['13 players in total', '2 teams of 6'])
    assert.deepEqual(inPlayers(thirteen.said).slice(3, 9).map(i => i.text), [
        'For this activity, 1 of the 13 players is a neutral player, so the team with the ball has 1 more player than the team without it',
        'The game needs at least 1 neutral player',
        'Around 1 to 2 neutral players works well, if it suits your group',
        'The neutral player always plays with whichever team has the ball, and changes sides when possession changes',
        'Make the neutral player easy to tell apart from both teams — contrasting bibs',
        'The neutral player is active in the game — not waiting, resting or watching',
    ])

    /**
     * **WHAT IS REPORTED RATHER THAN SAID.** Three things a coach would ask that the activity cannot answer
     * from the game, each reported as an observation and none of them worded into an instruction:
     *
     *   - his ruling says the change of sides is IMMEDIATE; the game holds a standing affiliation and
     *     nothing about when a change takes effect, so the activity says *always* and *when possession
     *     changes* and does not say *immediately*. Pinned here so that the day the knowledge can hold it,
     *     this assertion is the one that has to move;
     *   - the preferred range is offered as authored (1 to 2), and with twelve players 1 does not leave
     *     equal teams;
     *   - nothing establishes whether the same players stay neutral throughout.
     */
    assert.ok(!said.instructions.some(i => /immediate|at once|straight away|the moment/i.test(i.text)), 'the activity does not say the change is immediate: the game does not hold it')
    assert.ok(said.coachingObservations.some(o => o.includes('It does not say the change is') && o.includes('IMMEDIATE') && o.includes(ON)), 'and says so, to whoever reads the observations')
    assert.ok(said.coachingObservations.some(o => o.includes('offered as authored (1 to 2)') && o.includes('With 12 players, 1 does not leave whole equal teams') && o.includes('admits 2, 4, 6, 8, 10')))
    assert.ok(said.coachingObservations.some(o => o.includes('.persistence` is not authored')))
    assert.ok(said.coachingObservations.some(o => o.includes('the neutral players take a side by who has possession')), 'who starts with the ball matters to this game, and the reason is read from it')

    // ── Each sentence taken away is a loss the check names ───────────────────────────────────────
    const lost = (which: (i: Instruction) => boolean) => violations(checkFidelity(game, without(which)), 3).map(f => f.what)
    assert.deepEqual(
        lost(i => i.from.includes(ON)),
        [`${ON} is established by the game and no instruction carries it`],
        'the allegiance sentence is the only one that carries the standing rule',
    )
    assert.ok(lost(i => i.from.includes(JOINS)).includes(`${JOINS} is established by the game and no instruction carries it`), 'with every sentence that cites it gone, who they play with is lost')
    assert.deepEqual(lost(i => i.from.includes(MEANS)), [`${MEANS} is established by the game and no instruction carries it`])
    assert.deepEqual(lost(i => i.from.includes(STATE)), [`${STATE} is established by the game and no instruction carries it`])
    assert.ok(lost(i => i.text.startsWith('The game needs')).some(what => what.includes(COUNT) && what.includes('required minimum of 1')), 'the floor of the count is part of what is authored')
    assert.ok(lost(i => i.status === 'PREFERENCE').some(what => what.includes(COUNT) && what.includes('preferred range that may be offered here (1 to 2)')), 'and so is the preferred range')
    assert.ok(lost(i => i.status === 'REALIZATION_CHOICE' && i.from.includes(COUNT)).some(what => what.includes('starts at 2 in this activity')), 'and so is where this activity starts')
    /**
     * **CLOSED in the B3 review, 13 October — it was pinned here as a KNOWN LIMIT.** With ONE neutral the
     * starting value and the required minimum are the same number, and the two sentences carried each other:
     * the requirement's sentence could be dropped (the starting sentence says "1") and so could the starting
     * sentence (the requirement's says "1"), each with 0 violations. Either way a coach lost something — that
     * fewer is not this game, or how many to pick. Each is now held to the sentence of its own status: the
     * starting value to a REALIZATION_CHOICE sentence, and a limit equal to it to a firm sentence that is not
     * the choice's.
     */
    const thirteenLost = (which: (i: Instruction) => boolean) => violations(checkFidelity(thirteen.game, wrap(thirteen.said.instructions.filter(i => !which(i)))), 3).map(f => f.what)
    assert.deepEqual(thirteenLost(i => i.text.startsWith('The game needs')), [`${COUNT} has a required minimum of 1 (required: at least 1), and no instruction that cites it states that minimum`])
    assert.deepEqual(thirteenLost(i => i.status === 'REALIZATION_CHOICE' && i.from.includes(COUNT)), [
        `${COUNT} starts at 1 in this activity, inside an authored range, and no instruction that cites it states that value as the choice it is`,
    ])

    /**
     * **The team size is carried by the sentence that states it — added in the B3 review, 13 October.**
     * The overload clause cited `performers.teams[].outfieldCount` without stating it, so deleting *"2 teams
     * of 5"* from the neutral game passed with 0 violations, where the bare game (A04) is refused for the same
     * loss. It cites the teams now, not their size.
     */
    const squads: [any, RenderedActivity, number][] = [[game, said, 5], [thirteen.game, thirteen.said, 6]]
    for (const [g, s, size] of squads) {
        assert.ok(s.instructions.some(i => i.text === `2 teams of ${size}`))
        const teamless = violations(checkFidelity(g, wrap(s.instructions.filter(i => i.text !== `2 teams of ${size}`))), 3).map(f => f.what)
        assert.ok(teamless.includes('performers.teams[].outfieldCount is established by the game and no instruction carries it'), JSON.stringify(teamless))
    }

    // ── Each number altered is refused ────────────────────────────────────────────────────────────
    {
        const starting = (i: Instruction) => i.status === 'REALIZATION_CHOICE' && i.from.includes(COUNT)
        const three = checkFidelity(game, reworded(starting, i => ({ ...i, text: i.text.replace('2 of the 12', '3 of the 12'), quantities: [3, 12, 2] })))
        assert.ok(violations(three, 2).some(f => /states 3, which is neither a value the game holds at a property it cites nor a required limit of one/.test(f.what)), JSON.stringify(violations(three, 2)))
        const wide = checkFidelity(game, reworded(i => i.status === 'PREFERENCE', i => ({ ...i, text: 'Around 2 to 4 neutral players works well, if it suits your group', quantities: [2, 4] })))
        assert.ok(violations(wide, 2).some(f => /offers 4 as a preference, and the preferred range of what it cites is 1 to 2/.test(f.what)), JSON.stringify(violations(wide, 2)))
        const firm = checkFidelity(game, reworded(i => i.text.startsWith('The game needs'), i => ({ ...i, text: 'The game needs between 1 and 2 neutral players', quantities: [1, 2] })))
        // CLOSED in the B3 review, 13 October — pinned here as a KNOWN LIMIT: 2 is the value the line holds,
        // so a preferred maximum worded as a requirement passed. 2 is where this activity STARTS, a choice,
        // and only the choice's sentence may state it unless it is also a required limit.
        assert.ok(
            violations(firm, 2).some(f => f.what.startsWith('"The game needs between 1 and 2 neutral players" states 2, which is neither a value the game holds at a property it cites nor a required limit of one')),
            JSON.stringify(all(firm)),
        )
        const hedged = checkFidelity(game, reworded(i => i.from.includes(ON), i => ({ ...i, text: `Ideally, ${i.text.charAt(0).toLowerCase()}${i.text.slice(1)}` })))
        assert.ok(violations(hedged, 4).some(f => f.what.includes('worded as optional')), 'who the neutral players play with is a requirement of the game, not a suggestion')
    }

    /**
     * ── THE POSSESSION-CHANGE SENTENCE IS SAID ONCE, AND EACH EPISODE BOUNDARY IS DISCHARGED BY ITS OWN
     *    TRANSITION ────────────────────────────────────────────────────────────────────────────────
     *
     * The neutral condition asserts a possession-change transition of its own beside the game form's, so
     * this game holds two. The sentence was issued once per transition, and the check has no test for
     * repeated text, so the activity read it twice. It is said once now and cites both.
     *
     * And the exemption that lets an episode boundary go unsaid named ONE path outright — the game form's
     * own transition's play state — so the second transition's boundary was excused by the first's
     * sentence. The TEETH below is the case that separates the two: a rendering that carries the play state
     * of the game form's transition ONLY. The other transition's boundary must not be excused by it.
     */
    {
        const continuity = said.instructions.filter(i => i.text === 'Play continues when possession changes — there is no stoppage')
        assert.equal(continuity.length, 1, 'said once, however many transitions assert it')
        const elements = game.game.transitions.map((t: any) => t.elementId)
        assert.equal(elements.length, 2)
        assert.deepEqual(continuity[0].from, elements.flatMap((id: string) => [`transitions[${id}].playState`, `transitions[${id}].selector`]), 'and it cites every one of them')

        const notes = checkFidelity(game, said).findings.filter(f => f.severity === 'NOTE' && f.what.includes('.startsEpisode'))
        assert.equal(notes.length, 2)
        for (const id of elements) {
            assert.ok(notes.some(n => n.what.startsWith(`transitions[${id}].startsEpisode`) && n.what.includes(`carried by transitions[${id}].playState`)), `${id}: discharged by its OWN play state`)
        }

        const [first, second] = elements
        const onlyFirst = checkFidelity(game, reworded(i => i === continuity[0], i => ({ ...i, from: [`transitions[${first}].playState`, `transitions[${first}].selector`] })))
        const q3 = violations(onlyFirst, 3).map(f => f.what)
        assert.ok(q3.includes(`transitions[${second}].playState is established by the game and no instruction carries it`), JSON.stringify(q3))
        assert.ok(
            q3.some(what => what.startsWith(`transitions[${second}].startsEpisode was excluded as accounting metadata`) && what.includes(`transitions[${second}].playState reached no instruction`)),
            `the second transition's boundary must not be excused by the first's sentence: ${JSON.stringify(q3)}`,
        )
        assert.ok(!q3.some(what => what.startsWith(`transitions[${first}].startsEpisode`)), 'and the first, whose play state IS carried, is still discharged')
    }

    // ── A value with no faithful wording is WITHHELD and reported, and the check then refuses ─────
    const altered = (change: (copy: any) => void) => {
        const copy = JSON.parse(JSON.stringify(game))
        change(copy)
        const rendered = renderConcreteGame(copy)
        return { rendered, texts: rendered.instructions.map(i => i.text), q3: violations(checkFidelity(copy, rendered), 3).map(f => f.what), every: all(checkFidelity(copy, rendered)) }
    }
    const ALLEGIANCE = 'The neutral players always play with whichever team has the ball, and change sides when possession changes'
    const BARE = 'For this activity, 2 of the 12 players are neutral players'
    {
        // A designation the possession relation does not decide: nothing here knows who "won the ball".
        const won = altered(copy => (copy.game.performers.neutrals.affiliation.joins = 'WON_BALL'))
        assert.ok(!won.texts.some(t => t.includes('play with')), 'no sentence about who they play with')
        assert.ok(won.texts.includes(BARE), 'and the consequence for the numbers on each side is not claimed either')
        assert.ok(won.rendered.coachingObservations.some(o => o.includes('no coach-facing wording for the team designation "WON_BALL"') && o.includes('rather than paraphrase it')))
        assert.deepEqual([...won.q3].sort(), [`${JOINS} is established by the game and no instruction carries it`, `${ON} is established by the game and no instruction carries it`].sort())

        // An affiliation decided on an event rather than standing: no wording, so none is offered.
        const event = altered(copy => (copy.game.performers.neutrals.affiliation.on = 'SCORE'))
        assert.ok(!event.texts.some(t => t.includes('play with')))
        assert.ok(event.rendered.coachingObservations.some(o => o.includes('no coach-facing wording for an affiliation decided on "SCORE"')))
        assert.ok(event.q3.includes(`${ON} is established by the game and no instruction carries it`))

        // No possession relationship for the designation to resolve against.
        const unheld = altered(copy => delete copy.game.possession)
        assert.ok(!unheld.texts.some(t => t.includes('play with')) && unheld.texts.includes(BARE))
        assert.ok(unheld.rendered.coachingObservations.some(o => o.includes('establishes no possession relationship')))

        // Nothing established to name as what is possessed: the noun is never supplied from here.
        const objectless = altered(copy => (copy.game.objects = []))
        assert.ok(!objectless.texts.some(t => t.includes('play with')) && objectless.texts.includes(BARE))
        assert.ok(objectless.rendered.coachingObservations.some(o => o.includes('establishes no object to name as what is possessed')))
        assert.ok(!objectless.texts.some(t => /\bball\b/.test(t) && t.includes('neutral')), 'and no neutral sentence names one')

        // The other possession-relative side has its wording, and no claim about who outnumbers whom.
        const defending = altered(copy => (copy.game.performers.neutrals.affiliation.joins = 'DEFENDING_TEAM'))
        assert.ok(defending.texts.includes('The neutral players always play with whichever team does not have the ball, and change sides when possession changes'))
        assert.ok(defending.texts.includes(BARE))
        assert.deepEqual(defending.every, [])

        // Teams that are not alike: the two sides do not differ by exactly the neutrals, so that is not said.
        const uneven = altered(copy => (copy.game.performers.teams[0].outfieldCount = 4))
        assert.ok(uneven.texts.includes(BARE) && uneven.texts.includes(ALLEGIANCE))

        // A participation state outside the table, and a group this renderer cannot name.
        const waiting = altered(copy => (copy.game.performers.participation[0].state = 'WAITING'))
        assert.ok(!waiting.texts.some(t => /waiting/i.test(t)), 'no sentence is improvised for it')
        assert.ok(waiting.rendered.coachingObservations.some(o => o.includes('"WAITING"') && o.includes('no coach-facing wording for that state')))
        assert.deepEqual(waiting.q3, [`${STATE} is established by the game and no instruction carries it`])
        const bench = altered(copy => (copy.game.performers.participation[0].selector[0].value = 'bench'))
        assert.ok(!bench.texts.some(t => t.includes('active in the game')))
        assert.ok(bench.rendered.coachingObservations.some(o => o.includes('"bench"') && o.includes('no coach-facing wording for that group')))

        // The authored means is inserted verbatim, whatever it is.
        const means = altered(copy => (copy.game.performers.neutrals.distinguishable = 'a third bib colour'))
        assert.ok(means.texts.includes('Make the neutral players easy to tell apart from both teams — a third bib colour'))
        assert.deepEqual(means.every, [])

        // A count nobody established: how many is not said, and is not guessed.
        const uncounted = altered(copy => delete copy.game.performers.neutrals.count)
        assert.ok(!uncounted.texts.some(t => t.includes('of the 12 players')))
        assert.ok(uncounted.rendered.coachingObservations.some(o => o.includes('no count for them')))
    }

    // A game with no neutral players says nothing about them — the frozen Golden Case, unchanged.
    assert.ok(!rendered.instructions.some(i => /neutral/i.test(i.text)) && !rendered.coachingObservations.some(o => /neutral/i.test(o)))
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

/**
 * ── THE VALUE-MODIFIER BRANCH IS GENERIC — over altered copies of the specimen (14 October 2026) ──
 *
 * Step 4, component 3, which he approved that day: *"Enable accurate coach-facing communication of scoring
 * conditions and information rules, using approved language."* The branch was shaped to the one Wide Zone
 * modifier: the noun fell back to the word "region", only MULTIPLY was worded, one fixed criterion sentence was
 * said for ANY criterion, and "the ball" was written in with no object cited. Each case below is a copy of the
 * specimen with one field changed. What the specimen itself says is unchanged (pinned above and by the
 * scoring-modifier demonstration in `activity-review.unit.ts`, still 22 instructions and 0 violations).
 */
{
    const altered = (change: (modifier: any, game: any) => void) => {
        const copy = JSON.parse(JSON.stringify(specimen))
        change(copy.game.value.valueModifiers[0], copy.game)
        const out = renderConcreteGame(copy)
        return { copy, out, report: checkFidelity(copy, out) }
    }
    const base = `value.valueModifiers[${specimen.game.value.valueModifiers[0].elementId}]`
    const worth = (out: RenderedActivity) => out.instructions.filter(i => /that same score is worth/.test(i.text))

    // The specimen: nothing withheld, and the criterion and the termination now cite the object they name.
    assert.deepEqual(specimenRendered.withheld, [])
    const carrierPath = `objects[${specimen.game.objects[0].elementId}].kind`
    for (const suffix of ['.condition.value', '.endsOn']) {
        const said = specimenRendered.instructions.find(i => i.from.includes(`${base}${suffix}`))!
        assert.ok(said.from.includes(carrierPath), `${suffix}: the object it names is cited (SD-103) — ${JSON.stringify(said.from)}`)
    }

    // ADD and REPLACE are worded by SD-30's own arithmetic, and the check admits the number for that reason.
    for (const [operation, magnitude, expected] of [['ADD', 2, 3], ['REPLACE', 5, 5], ['MULTIPLY', 3, 3]] as const) {
        const { out, report: checked } = altered(modifier => Object.assign(modifier, { operation, magnitude }))
        assert.deepEqual(worth(out).map(i => [i.text, i.quantities]), [[`When the channel condition is met, that same score is worth ${expected} instead of 1`, [expected, 1]]], operation)
        // The retired specimen carries two violations of its own (a channel minimum it predates); the altered
        // copy has exactly those and nothing more — in particular no Q2, so the effective value is admitted.
        assert.deepEqual(checked.findings.filter(f => f.severity === 'VIOLATION'), specimenReport.findings.filter(f => f.severity === 'VIOLATION'), `${operation}: nothing invented`)
        assert.deepEqual(out.withheld, [])
    }
    // ...and ONLY where the instruction cites the operation, the magnitude and the base: drop one citation and
    // the 3 under ADD 2 is a number the game holds nowhere.
    {
        const { copy, out } = altered(modifier => Object.assign(modifier, { operation: 'ADD', magnitude: 2 }))
        const said = worth(out)[0]
        said.from = said.from.filter(p => !p.endsWith('.operation'))
        const unjustified = checkFidelity(copy, out).findings.filter(f => f.question === 2 && f.severity === 'VIOLATION')
        assert.ok(unjustified.some(f => f.what.includes('3')), JSON.stringify(unjustified))
    }

    // An operation SD-30 does not support is withheld — never worded as a multiplication.
    {
        const { out } = altered(modifier => Object.assign(modifier, { operation: 'POWER' }))
        assert.deepEqual(worth(out), [])
        assert.deepEqual(out.withheld.map(w => [w.path, w.row]), [[`${base}.operation`, 'V9a'], [`${base}.magnitude`, 'V9']])
    }
    // A criterion the code map does not hold EXACTLY is withheld; the fixed sentence is not said for it.
    {
        const { out } = altered(modifier => (modifier.condition.value = 'a criterion nobody has worded'))
        assert.ok(!out.instructions.some(i => /It is met when/.test(i.text)))
        assert.deepEqual(out.withheld.map(w => [w.path, w.row]), [[`${base}.condition.value`, 'V8c']])
    }
    // A termination with no wording is withheld (it was only an observation until 14 October).
    {
        const { out } = altered(modifier => (modifier.endsOn = 'OUT_END_LINE'))
        assert.ok(!out.instructions.some(i => /stays live/.test(i.text)))
        assert.deepEqual(out.withheld.map(w => [w.path, w.row]), [[`${base}.endsOn`, 'V8d']])
    }
    // Without an object, the sentences that name one are withheld rather than naming one the game does not hold.
    {
        const { out } = altered((_, game) => (game.objects = []))
        assert.deepEqual(out.withheld.map(w => w.row), ['V8c', 'V8d'])
    }
    // A referent that names no region is withheld — never called a "region".
    {
        const { out } = altered(modifier => (modifier.condition.referents = [{ structuralRef: { contractId: 'restated:WIDE-ZONE-ADVANTAGE', itemId: 'NO-SUCH-REGION' } }]))
        assert.ok(!out.instructions.some(i => /\bregion\b/.test(i.text)), JSON.stringify(out.instructions.map(i => i.text)))
        assert.deepEqual(out.withheld.map(w => w.row), ['V9a', 'V9', 'V8a', 'V8b'])
    }
    // Two referents of different kinds share no noun, so neither is said as the other.
    {
        const { out } = altered((modifier, game) => {
            const line = game.space.regions.find((r: any) => r.noun === 'line')
            const [contractId, itemId] = [line.elementId.split(':').slice(1, -1).join(':'), line.elementId.split(':').pop()]
            modifier.condition.referents = [modifier.condition.referents[0], { structuralRef: { contractId, itemId } }]
        })
        assert.deepEqual(out.withheld.map(w => w.row), ['V9a', 'V9', 'V8a', 'V8b'])
    }
}

console.log('rendering.unit.ts — ok')
