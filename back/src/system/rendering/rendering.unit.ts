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

// ── The real rendering passes all five questions ─────────────────────────────────────────────────
const rendered = renderConcreteGame(fixture)
const report = checkFidelity(fixture, rendered)
assert.equal(report.passed, true, `the frozen A04 rendering must be faithful; got ${JSON.stringify(report.findings.filter(f => f.severity === 'VIOLATION'))}`)
assert.ok(rendered.instructions.length > 0, 'a passing report over zero instructions would be vacuous')
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
    const uncited: Instruction = { ...cardinality, from: ['envelope.players'], text: '2 groups' }
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
{
    const withoutChannels = rendered.instructions.filter(i => !i.text.includes('channel'))
    const r = checkFidelity(fixture, wrap(withoutChannels))
    assert.ok(violations(r, 5).length >= 3, 'each unmarked region must be reported')
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
assert.ok(rendered.coachingObservations.length >= 4, 'the A04 game produces several things a coach would question')
for (const observation of rendered.coachingObservations) {
    assert.ok(!rendered.instructions.some(i => i.text === observation), 'an observation must not be issued as an instruction')
}

console.log('rendering.unit.ts — ok')
