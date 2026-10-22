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
import { combinedStatus, Instruction, RenderedActivity, renderConcreteGame, sayRange } from './render-concrete-game'

const FIXTURE = path.resolve(__dirname, '../../../../docs/audits/a04-concrete-game-fixture.json')
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))

const violations = (r: ReturnType<typeof checkFidelity>, q: number) => r.findings.filter(f => f.question === q && f.severity === 'VIOLATION')
/** Every question-3 finding, VIOLATION or NOTE — for the losses his §7 made reportable rather than refusing. */
const report3 = (r: ReturnType<typeof checkFidelity>) => r.findings.filter(f => f.question === 3)
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
    // Re-pointed 14 October 2026 (stage S-C2, his §7 "consolidated, more natural language"): the four modifier
    // sentences are one, built from parts; each half is still its own part, citing its own row.
    const criterionCited = citedOnSpecimen('.condition.value')
    assert.equal(criterionCited.length, 1, 'the criterion that satisfies the condition reaches exactly one instruction')
    assert.match(criterionCited[0].text, /touched the ball inside either channel and kept it after that touch/, 'and it says what the touch is')
    const ends = citedOnSpecimen('.endsOn')
    assert.equal(ends.length, 1, 'the termination reaches exactly one instruction')
    assert.match(ends[0].text, /lasts until possession changes/, 'and it says what ends it')
    for (const suffix of ['.condition.value', '.endsOn']) {
        assert.equal(criterionCited[0].parts!.filter(p => p.from.some(f => f.endsWith(suffix))).length, 1, `${suffix} is carried by exactly one part of it`)
    }

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

/**
 * **Every sentence is made of parts, and the parts ARE the sentence — stage S-C2, 14 October 2026.** A consolidated
 * sentence is checked part by part (each part's status, each number's binding), so the renderer gives every
 * instruction its parts, and the check refuses an instruction whose parts and whole disagree (Q1) and then checks
 * it whole, so a disagreement can never make anything pass.
 */
{
    for (const i of rendered.instructions) {
        assert.ok(i.parts && i.parts.length > 0, `parts: ${i.text}`)
        assert.equal(i.parts!.map(p => p.text).join(''), i.text)
        for (const p of i.parts!) assert.deepEqual(p.quantities, p.bindings.map(b => b.quantity), `${p.text}: every number is bound`)
    }
    const [first] = rendered.instructions
    const disagreeing = checkFidelity(fixture, wrap([{ ...first, text: `${first.text}, roughly` }, ...rendered.instructions.slice(1)]))
    assert.ok(violations(disagreeing, 1).some(f => f.what.includes('its text is not its parts joined')))
    assert.ok(violations(disagreeing, 4).some(f => f.what.includes('worded as optional')), 'and the sentence is still checked whole: the hedge it gained is refused')
    const restatused = checkFidelity(fixture, wrap([{ ...first, status: 'PREFERENCE' }, ...rendered.instructions.slice(1)]))
    assert.ok(violations(restatused, 1).some(f => f.what.includes('its status is not the one its parts give it')))
}

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

    // Re-pointed 14 October 2026: where an activity starts is a STARTING sentence now (REALIZATION_CHOICE, with its
    // "For this activity" prefix, is gone on his §7). The rule it was held to is the same.
    const asNecessary: Instruction = { section: 'How to score', text: 'The rules require crossing the line', status: 'STARTING', from: ['value.primaryEvent.kind'], quantities: [] }
    assert.equal(violations(checkFidelity(fixture, wrap([asNecessary])), 4).length, 1, 'a starting value presented as a necessity must be caught')

    /**
     * **The two other statuses of 14 October 2026, each with teeth.** His §3: *"Preserve whether each condition is
     * required, preferred, advisory, or left to the coach, all the way through rendering and validation."*
     */
    const coachMust: Instruction = { section: 'Players', text: 'One team must start with the ball — pick one', status: 'COACH_CHOICE', from: ['possession.team', 'performers.teams'], quantities: [] }
    assert.ok(violations(checkFidelity(fixture, wrap([coachMust])), 4).some(f => f.what.includes("coach's choice is worded as though the knowledge demanded it")), 'a choice left to the coach may not be a necessity')
    const coachTold: Instruction = { section: 'Players', text: 'One team starts with the ball', status: 'COACH_CHOICE', from: ['possession.team', 'performers.teams'], quantities: [] }
    assert.ok(violations(checkFidelity(fixture, wrap([coachTold])), 4).some(f => f.what.includes('not put to the coach as a choice')), 'a value left to the coach must be put to them as a choice')
    const advisoryRule: Instruction = { section: 'Set up', text: 'This channel is a perceptual reference', status: 'ADVISORY', from: ['envelope.area.width_m'], quantities: [] }
    assert.ok(violations(checkFidelity(fixture, wrap([advisoryRule])), 4).some(f => f.what.includes('ADVISORY recommendation carries no hedge')), 'a recommendation must be hedged')
    const advisoryMust: Instruction = { section: 'Set up', text: 'It helps if this channel must always be marked', status: 'ADVISORY', from: ['envelope.area.width_m'], quantities: [] }
    assert.ok(violations(checkFidelity(fixture, wrap([advisoryMust])), 4).some(f => f.what.includes('ADVISORY recommendation is worded as compulsory')), 'and never imperative')
    // "It helps" is a hedge for every firm sentence too: a requirement worded as a recommendation is caught.
    const requirementAdvised: Instruction = { section: 'Set up', text: 'It helps if the area is 40 m long', status: 'DERIVED', from: ['envelope.area.length_m'], quantities: [40] }
    assert.equal(violations(checkFidelity(fixture, wrap([requirementAdvised])), 4).length, 1)

    /**
     * **A starting value is stated, not hedged — added in the review of S-C1, 14 October 2026.** The possession
     * game's "play continues" (GF2-17, a preferred default) was DERIVED until that day, and DERIVED refused a hedge;
     * re-statused STARTING it lost that rule, so this passed. What this activity starts at is exactly what the game
     * holds; that it can be adjusted belongs in "Adjusting the activity", not in a blurred value.
     */
    const startingHedged: Instruction = { section: 'How it works', text: 'Play may continue when possession changes — there is no stoppage', status: 'STARTING', from: ['transitions'], quantities: [] }
    assert.ok(violations(checkFidelity(fixture, wrap([startingHedged])), 4).some(f => f.what.includes('starting value is worded as optional or approximate')), 'a starting value may not be hedged')

    /**
     * **"work well" is a hedge too — stage S-C2, 14 October 2026, a TIGHTENING.** HEDGES knew "works well" and not
     * "work well", so "Contrasting bibs work well for this" read as unhedged: refused as a preference, passed as a
     * requirement. Now both spellings hedge: refused as a requirement, accepted as a preference.
     */
    const plural = (status: 'DERIVED' | 'PREFERENCE'): Instruction => ({ section: 'Players', text: 'Contrasting bibs work well for this', status, from: ['envelope.players'], quantities: [] })
    assert.ok(violations(checkFidelity(fixture, wrap([plural('DERIVED')])), 4).some(f => f.what.includes('worded as optional')), '"work well" softens a requirement')
    assert.deepEqual(violations(checkFidelity(fixture, wrap([plural('PREFERENCE')])), 4), [], 'and hedges a preference')
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
        /**
         * **One sentence for both channels — re-pointed 14 October 2026 (stage S-C2, his §7: "feel free to propose
         * consolidated, more natural language").** The two marking sentences differed only by "one touchline" / "the
         * opposite touchline"; where the two channels are alike in every number and status they are said once,
         * "along each touchline", citing both. Each number is BOUND to the property it states (the length to the
         * first channel's along position, the limits to its across position), which the check verifies.
         */
        const marking = said.instructions.filter(isMarking)
        assert.deepEqual(
            marking.map(i => [i.text, i.status, i.quantities, i.parts!.flatMap(p => p.bindings.map(b => b.path.split('.').pop()))]),
            [['Mark a channel along each touchline, 40 m long and between 4.5 m and 7.5 m wide', 'DERIVED', [40, 4.5, 7.5], ['along', 'across', 'across']]],
            'the requirement is stated with BOTH its ends, as a requirement',
        )
        const acrossPaths = game.status.bounds.filter((b: any) => String(b.path).endsWith('.position.across')).map((b: any) => b.path)
        assert.equal(acrossPaths.length, 2)
        for (const across of acrossPaths) assert.ok(marking[0].from.includes(across), `both channels are cited: ${across}`)
        // The preference stands in "Adjusting the activity" (review of S-C1) and names what it is about — each channel —
        // citing both; ", if it suits your group" is gone (stage S-C2): the template carries its own hedge.
        assert.deepEqual(said.instructions.filter(isPreference).map(i => [i.text, i.section]), [['Around 6 m to 7.5 m wide works well for each channel', 'Adjusting the activity']])
        assert.ok(said.instructions.filter(isPreference)[0].from.every(path => marking[0].from.includes(path)), 'the preference names only what the marking sentence names')
        assert.deepEqual(all(checkFidelity(game, said)), [], 'the accurate range must pass')
    }

    // 1 — A WRONG PREFERRED RANGE, made of numbers the game really does hold elsewhere.
    {
        const r = checkFidelity(game, reworded(isPreference, i => ({ ...i, text: 'Around 12 m to 20 m wide works well, if it suits your group', quantities: [12, 20] })))
        // One preference sentence since stage S-C2 (both channels in one), so each wrong number is refused once: 4 became 2.
        assert.equal(violations(r, 2).filter(f => /offers (12|20) as a preference/.test(f.what)).length, 2, `each wrong number: ${JSON.stringify(violations(r, 2))}`)
        assert.match(violations(r, 2)[0].what, /the preferred range of what it cites is 6 to 7\.5/, 'and the finding says what the range is')
        // Moved 14 October 2026 with case 3 below: that the real one is offered by nobody is now a NOTE; the wrong
        // one is still refused, twice per sentence, at Q2.
        assert.equal(report3(r).filter(f => f.severity === 'NOTE' && /authored preferred range .* no instruction offers it/.test(f.what)).length, 2, 'and the real one is now offered by nobody')
    }

    // 2 — A WRONG REQUIRED LIMIT: the width of the area, said as the width of the channel.
    {
        const r = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: i.text.replace('between 4.5 m and 7.5 m wide', 'up to 30 m wide'), quantities: [40, 30] })))
        // One marking sentence for both channels since stage S-C2: refused once (was once per channel); both channels' limits still owed.
        assert.equal(violations(r, 2).filter(f => /states 30, which is neither a value the game holds at a property it cites nor a required limit/.test(f.what)).length, 1, JSON.stringify(violations(r, 2)))
        assert.equal(violations(r, 3).filter(f => /required (minimum of 4\.5|maximum of 7\.5)/.test(f.what)).length, 4, 'and neither real limit is stated, for either channel')
    }

    /**
     * 3 — THE PREFERENCE LEFT OUT. **Two VIOLATIONs became two NOTEs on 14 October 2026, with the same words — his
     * ruling, not a convenience.** Christian, §7: *"Preferred ranges should be available as guidance, but their
     * omission shouldn't automatically invalidate an otherwise valid activity unless the information is
     * essential."* The channel's preference is not essential: the marking sentence states the required width,
     * so a coach has guidance without it. The omission is still REPORTED, every time; it no longer refuses.
     */
    {
        const r = checkFidelity(game, wrap(said.instructions.filter(i => !isPreference(i))))
        assert.deepEqual(violations(r, 3), [], 'not essential, so not a refusal')
        const lost = report3(r).filter(f => f.severity === 'NOTE' && /preferred range/.test(f.what))
        assert.equal(lost.length, 2, `one for each channel: ${JSON.stringify(lost)}`)
        for (const finding of lost) assert.match(finding.what, /carries an authored preferred range that may be offered here \(6 to 7\.5\), and no instruction offers it/)
        assert.deepEqual(violations(r, 2), [], 'nothing said is wrong; something is missing')
    }

    /**
     * 3b — AN ESSENTIAL PREFERENCE LEFT OUT is still refused. Essential (the recommended definition, awaiting his
     * confirmation): the preference is the only authored guidance for a value the game leaves to the coach — no
     * required limit, no starting value, no number held at its path. Constructed: the channel's width with its
     * requirement and its interval taken away, so the preference is all a coach would have.
     */
    {
        const bare = JSON.parse(JSON.stringify(game))
        for (const entry of bare.status.bounds) if (String(entry.path).endsWith('.position.across')) entry.bounds = entry.bounds.filter((b: any) => b.preferred || b.forbidden)
        for (const g of bare.status.geometry) if (String(g.path).endsWith('.position.across') && g.geometry?.extentBound) delete g.geometry.interval
        const r = checkFidelity(bare, wrap(said.instructions.filter(i => !isPreference(i))))
        const essential = violations(r, 3).filter(f => /only authored guidance for a value the game leaves to the coach, so it is essential/.test(f.what))
        assert.equal(essential.length, 2, `the sole guidance, omitted, still refuses: ${JSON.stringify(violations(r, 3))}`)
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
        assert.equal(violations(r, 2).filter(f => /states 6, which is neither/.test(f.what)).length, 1, 'a preferred limit may not be said as a required one (one marking sentence since stage S-C2)')
        assert.equal(violations(r, 3).filter(f => /required minimum of 4\.5/.test(f.what)).length, 2)
    }

    // A preference that states only part of its range has not offered the range — reported, and since 14 October
    // 2026 (his §7, as case 3 above) as a NOTE: the channel's preference is not essential.
    {
        const r = checkFidelity(game, reworded(isPreference, i => ({ ...i, text: 'Around 6 m wide works well, if it suits your group', quantities: [6] })))
        assert.equal(report3(r).filter(f => f.severity === 'NOTE' && /no instruction offers it/.test(f.what)).length, 2)
        assert.deepEqual(violations(r, 2), [], '6 is its own preferred minimum: nothing said is wrong')
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
        assert.equal(violations(uncited, 2).filter(f => /states 4\.5, which appears nowhere in the concrete game/.test(f.what)).length, 1, `one marking sentence since stage S-C2: ${JSON.stringify(violations(uncited, 2))}`)
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
        assert.equal(violations(invented, 2).filter(f => /states (5|8), which is neither a value the game holds at a property it cites nor a required limit/.test(f.what)).length, 2, 'each wrong number, once: one marking sentence since stage S-C2')
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
     * **THE KNOWN LIMIT IS RETIRED — stage S-C2, 14 October 2026.** Pinned on 13 October: the range check held a
     * sentence to the SET of numbers its cited lines carry and did not know which number played which part, so the
     * channel's length and width exchanged (*"7.5 m long and between 4.5 m and 40 m wide"*) passed with 0. The pin
     * said: if this ever fails because the check has learned to tell the parts apart, delete it gladly. It has:
     * every number a part says is BOUND to the path it states, in the order it is said, and the check holds it there.
     * Consolidation needed this before it was safe — one roster sentence cites a total, the teams and a count, and
     * without bindings any two of them could trade places unseen.
     *
     * Two ways to exchange them, both refused: rewording the sentence under unchanged parts (the parts are no longer
     * the sentence: Q1), and rewording the PART itself, bindings and all, as a renderer that got it wrong would
     * (the length is not the across position's number: Q2).
     */
    {
        const exchangedText = (text: string) => text.replace('40 m long and between 4.5 m and 7.5 m wide', '7.5 m long and between 4.5 m and 40 m wide')
        const underOldParts = checkFidelity(game, reworded(isMarking, i => ({ ...i, text: exchangedText(i.text), quantities: [7.5, 4.5, 40] })))
        assert.ok(underOldParts.findings.some(f => f.question === 1 && f.severity === 'VIOLATION' && f.what.includes('its text is not its parts joined')), JSON.stringify(all(underOldParts)))
        const inThePart = checkFidelity(
            game,
            reworded(isMarking, i => {
                const [p] = i.parts!
                const bindings = [
                    { quantity: 7.5, path: p.bindings[0].path },
                    { quantity: 4.5, path: p.bindings[1].path },
                    { quantity: 40, path: p.bindings[2].path },
                ]
                const swapped = { ...p, text: exchangedText(p.text), quantities: [7.5, 4.5, 40], bindings }
                return { ...i, text: swapped.text, quantities: swapped.quantities, parts: [swapped] }
            }),
        )
        assert.deepEqual(violations(inThePart, 1), [], 'the part is the sentence')
        const unbound = violations(inThePart, 2).filter(f => / binds (7\.5|40) to /.test(f.what))
        assert.equal(unbound.length, 2, `the length and the maximum, each bound to a property that does not hold it: ${JSON.stringify(violations(inThePart, 2))}`)
        // And the same numbers in the same places but bound out of order are refused too: the order is part of the binding.
        const outOfOrder = checkFidelity(game, reworded(isMarking, i => ({ ...i, parts: [{ ...i.parts![0], bindings: [...i.parts![0].bindings].reverse() }] })))
        assert.ok(violations(outOfOrder, 2).some(f => f.what.includes('where its bindings give [7.5,4.5,40], in that order')), JSON.stringify(all(outOfOrder)))
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
        // As the renderer says them (review of S-C1, 14 October 2026): the limits of a count the activity only starts
        // at are what a coach adjusts within, so they stand in "Adjusting the activity", which names the count there.
        sections: { required: 'Adjusting the activity', preferred: 'Adjusting the activity' },
    })
    assert.deepEqual(
        [sentences.starting, sentences.required, sentences.preferred].map(i => [i!.text, i!.status, i!.from, i!.quantities]),
        [
            // STARTING, with no prefix, since 14 October 2026 (his §7: "avoid repeatedly beginning sentences with 'For this activity'").
            ['2 neutral players', 'STARTING', [path_], [2]],
            ['Use at least 1 neutral player', 'DERIVED', [path_], [1]],
            // No ", if it suits your group" since stage S-C2 (14 October 2026): the template carries its hedge.
            ['Around 1 to 2 neutral players works well', 'PREFERENCE', [path_], [1, 2]],
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
    // Since 14 October 2026 (his §7, "unless the information is essential") the preference left out is REPORTED as a
    // NOTE: the line has a required floor and a starting value, so it is not a coach's only guidance. The floor left
    // out is still refused.
    // And since the review of S-C1 (14 October 2026) a second loss is named: with nothing in "Adjusting the activity"
    // the count reads as fixed (Q4).
    const alone = about(withRange(sentences.starting))
    assert.deepEqual(alone.map(f => f.question), [3, 4], JSON.stringify(alone))
    assert.ok(alone.some(f => /required minimum of 1/.test(f.what)))
    assert.ok(withRange(sentences.starting).findings.some(f => f.severity === 'NOTE' && /preferred range that may be offered here \(1 to 2\), and no instruction offers it$/.test(f.what)))

    // The range without the value: a coach is told what is allowed and not what this activity uses.
    assert.ok(about(withRange(sentences.required, sentences.preferred)).some(f => /starts at 2 in this activity, inside an authored range, and no instruction that cites it states that value/.test(f.what)))

    // A wrong preferred range for a count is caught exactly as a wrong width is.
    const wrong = about(withRange(sentences.starting, sentences.required, { ...sentences.preferred!, text: 'Around 5 to 12 neutral players works well, if it suits your group', quantities: [5, 12] }))
    assert.ok(wrong.some(f => f.question === 2 && /offers 5 as a preference/.test(f.what)), JSON.stringify(wrong))

    // And the helper says only what the line carries: no preference, no preference sentence; one end, one end.
    const floorOnly = sayRange('Players', { path: path_, required: { min: 1, max: null }, preferred: null, starting: null }, { number: String, required: l => `Use ${l}`, preferred: a => `${a} works well`, starting: v => v })
    assert.deepEqual([floorOnly.required?.text, floorOnly.preferred, floorOnly.starting], ['Use at least 1', null, null])
    const both = sayRange('Set up', { path: 'x', required: { min: 4, max: 6 }, preferred: { min: 5, max: 5 }, starting: null }, { number: n => `${n} m`, required: l => `Make it ${l} wide`, preferred: a => `${a} wide works well` })
    assert.deepEqual([both.required?.text, both.preferred?.text], ['Make it between 4 m and 6 m wide', 'Around 5 m wide works well'])
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
// Re-pointed 14 October 2026 (stage S-C2): the hedge is the template's own ("works well"), not an appended ", if it
// suits your group". Read over every activity a coach can be served with a preference in it, not over A04, which has none.
const servedPreferences = ['scoring-modifier', 'neutral-players'].flatMap(
    demonstrationId =>
        (buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId, session: { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: { ...fixture.envelope.roles } } }).activity as any).rendered.instructions as Instruction[],
)
assert.equal(servedPreferences.filter(i => i.status === 'PREFERENCE').length, 2, 'one preference in each demonstration, so this reads something')
for (const instruction of [...rendered.instructions, ...servedPreferences].filter(i => i.status === 'PREFERENCE')) {
    assert.match(instruction.text, /\bworks? well\b/, 'every preference carries its hedge')
    assert.doesNotMatch(instruction.text, /\bmust\b|\balways\b|\bexactly\b/i)
}
/**
 * Re-pointed 14 October 2026. This pinned that every choice began *"For this activity, "*; he asked us to stop:
 * *"I would also avoid repeatedly beginning sentences with 'For this activity.'"* What keeps a starting value or a
 * coach's choice from reading as a requirement is now that no word of necessity is available to it (Q4), and a
 * coach's choice must be put to them as one.
 */
for (const instruction of rendered.instructions) assert.doesNotMatch(instruction.text, /^For this activity/, 'no sentence begins "For this activity"')
for (const instruction of rendered.instructions.filter(i => i.status === 'STARTING' || i.status === 'COACH_CHOICE')) {
    assert.doesNotMatch(instruction.text, /\bmust\b|\balways\b|\bnecessarily\b|\bthe rules require\b/i, `where the activity starts is not a necessity: "${instruction.text}"`)
}
for (const instruction of rendered.instructions.filter(i => i.status === 'COACH_CHOICE')) assert.match(instruction.text, /\b(pick|choose|decide)\b/i)
assert.deepEqual(
    rendered.instructions.filter(i => i.status !== 'DERIVED' && i.status !== 'SESSION' && i.status !== 'INSTANTIATED').map(i => [i.status, i.text]),
    /**
     * Re-pointed 14 October 2026 (stage S-C2, his §7 consolidated language, DRAFTS): the two end lines are one
     * sentence; who starts with the ball is put to the coach as "Pick which team …" and moved to "How it works"; the
     * preferred default (GF2-17) is the STARTING part of a sentence whose other part — the same line kept after a
     * turnover — is DERIVED. The statuses are the same five things; the sentences are fewer.
     */
    [
        ['STARTING', 'Mark both end lines: they are the scoring lines'],
        ['COACH_CHOICE', 'Pick which team starts with the ball and tell both teams before you start'],
        // Re-pointed 17 October 2026 (stage M4): his approved possession sentence (reply filed 19 October 2026, item 4), read from
        // approved-coach-wording.json; with this game's line targets it is a generalization of his words ("line"), DRAFT. Was:
        // "When possession changes, play carries on with no stoppage, and the team that wins possession attacks the same line it
        // was already attacking". Same statuses, same parts.
        ['STARTING', 'When possession changes, play carries on without a stoppage, and each team keeps attacking the same line'],
        ['STARTING', 'A team scores 1 point by getting the ball across the line it is attacking'],
    ],
    'the Golden Case: what realization chose, what is left to the coach, and the one preferred default (GF2-17) — each in its own status',
)
assert.deepEqual(
    rendered.instructions.find(i => i.text.startsWith('When possession changes'))!.parts!.map(p => p.status),
    ['STARTING', 'DERIVED'],
    'the preferred default is a starting part, and the line kept after a turnover a derived one — each its own status in one sentence',
)
assert.ok(rendered.instructions.every(i => i.tier === (i.section === 'Adjusting the activity' ? 'adjust' : 'setup')), 'the tier is the section\'s own reading')

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
    // Re-pointed 14 October 2026 (stage S-C2): the two end lines are marked by ONE sentence, which cites each line's
    // noun. Remove it and each line is reported unmarked on its own — the merge never lets one line's marking
    // stand for the other's.
    const withoutTheLines = rendered.instructions.filter(i => !/^mark both end lines/i.test(i.text))
    assert.equal(withoutTheLines.length, rendered.instructions.length - 1, 'the live game has exactly one marking instruction to remove')
    const r = checkFidelity(fixture, wrap(withoutTheLines))
    assert.equal(violations(r, 5).filter(f => /has no marking instruction/.test(f.what)).length, fixture.game.space.regions.length, 'each unmarked region is reported')
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
    // Re-pointed 14 October 2026 (stage S-C2): the teams are a part of the roster sentence ("Divide 12 players into 2
    // teams …"), so the part that says them is what must state the count only.
    assert.ok(
        withoutSizes.instructions.some(i => i.section === 'Players' && (i.parts ?? []).some(p => p.text === ' into 2 teams')),
        `with no size in the game the rendering must state the count only: ${JSON.stringify(withoutSizes.instructions.map(i => i.text))}`,
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

    /**
     * Re-pointed 14 October 2026 (stage S-C2, his §7 consolidated language): the role statement is a PART of the
     * roster sentence ("Divide 12 players into 2 teams of 6, with no …s") rather than a sentence of its own, so each
     * case below reads the part that cites the role's property, with its own status. The three involvement cases are
     * kept, in shorter words (DRAFTS).
     */
    const rolePart = (activity: RenderedActivity) => players(activity).flatMap(i => (i.parts ?? []).filter(p => p.from.includes(property)))
    /** The roster sentence rebuilt without one of its parts — as a renderer that dropped it would say it. */
    const dropPart = (activity: RenderedActivity, which: (p: NonNullable<Instruction['parts']>[number]) => boolean): RenderedActivity =>
        wrap(
            activity.instructions.map(i => {
                if (!(i.parts ?? []).some(which)) return i
                const parts = i.parts!.filter(p => !which(p))
                return { ...i, parts, text: parts.map(p => p.text).join(''), from: [...new Set(parts.flatMap(p => p.from))], quantities: parts.flatMap(p => p.quantities), status: combinedStatus(parts.map(p => p.status)) }
            }),
        )

    // None available, none involved: the session's own statement, now CITING the property.
    {
        assert.deepEqual(rolePart(rendered).map(p => [p.text, p.status]), [[`, with no ${role}s`, 'SESSION']])
        assert.ok(players(rendered).some(i => i.from.includes('performers.teams[].outfieldCount')), 'and the team size cites the property it states')
    }

    // Some available, none involved: said as a fact about this activity, and nobody goes missing.
    {
        const game = variant(2, [0, 0])
        const out = renderConcreteGame(game)
        assert.ok(players(out).some(i => i.text.startsWith('Divide 12 players into 2 teams of 6')), 'everyone is still in a team')
        assert.deepEqual(rolePart(out).map(p => [p.text, p.status]), [[`; ${role}s play as outfield players in this activity`, 'DERIVED']])
        assert.deepEqual(checkFidelity(game, out).findings.filter(f => f.severity === 'VIOLATION'), [])
    }

    // Involved: each team's count is stated, with the number declared and BOUND so question 2 checks it against the game.
    {
        const game = variant(2, [1, 1])
        const out = renderConcreteGame(game)
        assert.ok(players(out).some(i => i.text === `Divide 12 players into 2 teams of 5, plus 1 ${role} each`), JSON.stringify(players(out).map(i => i.text)))
        assert.deepEqual(rolePart(out).map(p => [p.text, p.status, p.quantities, p.bindings]), [[`, plus 1 ${role} each`, 'DERIVED', [1], [{ quantity: 1, path: property }]]])
        assert.deepEqual(checkFidelity(game, out).findings.filter(f => f.severity === 'VIOLATION'), [])

        // TEETH — the defect itself. Say the teams and drop the role, as the renderer used to, and it is a loss.
        const silent = dropPart(out, p => p.from.includes(property))
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
    // Re-pointed 14 October 2026 (stage S-C2): the play-state sentence is the first part of "When possession changes,
    // play carries on with no stoppage, and …"; the whole sentence is taken away. Re-pointed 17 October 2026 (stage M4): his approved
    // words, "… play carries on without a stoppage …" (reply filed 19 October 2026, item 4); the same sentence is taken away.
    const withoutContinuity = wrap(rendered.instructions.filter(i => !i.text.includes('play carries on without a stoppage')))
    assert.equal(withoutContinuity.instructions.length, rendered.instructions.length - 1, 'exactly the one sentence is taken away')
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
    const TAKES = 'performers.neutrals.affiliation.takesEffect'
    const [participation] = game.game.performers.participation
    const STATE = `performers.participation[${participation.elementId}].state`
    const [carrier] = game.game.objects
    const KIND = `objects[${carrier.elementId}].kind`

    /**
     * WHAT A COACH READS, with the status of each sentence and part and the properties behind it.
     *
     * **Consolidated 14 October 2026 (stage S-C2), on his §7 and his own example:** *"Divide 12 players into two
     * teams of five, with two neutral players. The neutrals support whichever team has possession and switch
     * immediately when possession changes."* Seven Players sentences became three (DRAFTS for his CCS review):
     *   - the total, the teams, the role statement and the neutral count are ONE sentence of four parts, each keeping
     *     its status — the count STARTING (where this activity starts), the teams INSTANTIATED — and each number bound
     *     to its property. The overload clause ("so the team with the ball has 2 more players …") is gone, as he asked;
     *   - the allegiance in his words, and the participation as its second sentence;
     *   - who starts with the ball moved to "How it works" ("Pick which team starts with the ball …");
     *   - the means of telling them apart stays an example (C47), STARTING.
     * Digits, not words: the check reads both since this stage.
     */
    const ROLE_ = Object.keys(roles)[0]
    assert.deepEqual(
        inPlayers(said).map(i => [i.text, i.status, (i.parts ?? []).map(p => [p.text, p.status, p.bindings.map(b => [b.quantity, b.path])])]),
        [
            [
                `Divide 12 players into 2 teams of 5, with 2 neutral players and no ${ROLE_}s`,
                'STARTING',
                [
                    ['Divide 12 players', 'DERIVED', [[12, 'envelope.players']]],
                    [' into 2 teams of 5', 'INSTANTIATED', [[2, 'performers.teams'], [5, 'performers.teams[].outfieldCount']]],
                    [', with 2 neutral players', 'STARTING', [[2, COUNT]]],
                    [` and no ${ROLE_}s`, 'SESSION', []],
                ],
            ],
            [
                'The neutrals support whichever team has possession and switch immediately when possession changes. They take a full part in play — not waiting, resting or watching',
                'DERIVED',
                [
                    ['The neutrals support whichever team has possession and switch immediately when possession changes', 'DERIVED', []],
                    ['. They take a full part in play — not waiting, resting or watching', 'DERIVED', []],
                ],
            ],
            ['Make the neutrals easy to tell apart from both teams — for example, contrasting bibs', 'STARTING', [['Make the neutrals easy to tell apart from both teams — for example, contrasting bibs', 'STARTING', []]]],
        ],
        'the Players section, sentence by sentence and part by part',
    )
    assert.deepEqual(
        inPlayers(said)[1].parts!.map(p => p.from),
        [[JOINS, ON, TAKES], [STATE, `performers.participation[${participation.elementId}].selector`]],
        'his "has possession" names no object, so none is cited; the relation it is said by is its precondition',
    )
    /**
     * **The preferred count is offered within what this session can field — stage S-C2, 14 October 2026.** His §6:
     * *"communicate the valid option rather than presenting an impossible alternative."* The review of S-C1 stopped
     * offering "Around 1 to 2" at 12 players (1 leaves no equal teams); this offers what the roster rule's record says
     * the session can field of it (`configurations.offered`: 2), and says it is for a group this size. The floor is
     * said plainly ("Keep at least 1 neutral player"). Instruction count 17 → 12.
     */
    assert.deepEqual(
        said.instructions.filter(i => i.section === 'Adjusting the activity').map(i => [i.text, i.status, i.from, i.quantities, i.tier]),
        [
            ['Keep at least 1 neutral player', 'DERIVED', [COUNT], [1], 'adjust'],
            ['2 neutral players work well for a group this size', 'PREFERENCE', [COUNT], [2], 'adjust'],
        ],
        'what a coach may adjust, after the starting setup',
    )
    assert.ok(!said.instructions.some(i => i.status === 'PREFERENCE' && /\b1\b/.test(i.text)), 'the impossible alternative is not presented')
    assert.deepEqual(all(checkFidelity(game, said)), [], 'and it is faithful')
    // The count is where the activity STARTS: the game holds it as a choice closed by rule inside a range. Its
    // configurations (14 October 2026) keep structural, authorized and offered apart; rule 2's count is the one offered.
    const recorded = game.status.choices.find((c: any) => c.path === COUNT)
    assert.deepEqual(
        [recorded.value, recorded.closure, recorded.defaultedBy, recorded.within.configurations],
        [2, 'STARTING_VALUE_IN_RANGE', 'ONLY_PREFERRED_COUNT_THE_ROSTER_ADMITS', { structural: [0, 2, 4, 6, 8, 10], authorized: [2, 4, 6, 8, 10], offered: [2], offeredBasis: 'PREFERRED_RANGE_FOR_NORMAL_STARTING_CONFIGURATIONS', ecological: 'NOT_ASSESSED' }],
    )
    assert.deepEqual([recorded.value], recorded.within.configurations.offered, 'justified-default rule 2 closes exactly the one count offered')
    // No member handle reaches a sentence or a citation.
    for (const i of said.instructions) assert.ok(!i.text.includes('#') && !i.from.some(p => p.includes('#')), `${i.text} / ${JSON.stringify(i.from)}`)

    // With one neutral every sentence about them agrees in number.
    const thirteen = built(13)
    assert.deepEqual(all(checkFidelity(thirteen.game, thirteen.said)), [])
    assert.deepEqual(inPlayers(thirteen.said).map(i => i.text), [
        `Divide 13 players into 2 teams of 6, with 1 neutral player and no ${ROLE_}s`,
        'The neutral player supports whichever team has possession and switches immediately when possession changes. They take a full part in play — not waiting, resting or watching',
        'Make the neutral player easy to tell apart from both teams — for example, contrasting bibs',
    ])
    // With 13, 2 is the count that cannot be fielded, so 1 is the preference offered (stage S-C2).
    assert.deepEqual(thirteen.said.instructions.filter(i => i.tier === 'adjust').map(i => i.text), ['Keep at least 1 neutral player', '1 neutral player works well for a group this size'])
    assert.equal(thirteen.game.status.choices.find((c: any) => c.path === COUNT).within.configurations.offered.join(), '1')

    /**
     * **WHAT IS REPORTED RATHER THAN SAID.** Things a coach would ask that the activity cannot answer from the
     * game, each reported as an observation and none of them worded into an instruction:
     *
     *   - **MOVED 14 October 2026, as this pin said it would**: the change of sides is IMMEDIATE in the game now
     *     (register row P6c; C43, his words), so the activity says it — once, citing the property — and the
     *     observation that it could not is gone. Without the item the old sentence and observation come back
     *     (`affiliation-timing.unit.ts`);
     *   - the preferred range (1 to 2) is offered only as 2 — re-pointed in stage S-C2 (14 October 2026): with twelve
     *     players 1 does not leave equal teams, so what the session can field of it is offered and the rest is
     *     reported, read from the configurations, which also say ecological appropriateness is not assessed;
     *   - nothing establishes whether the same players stay neutral throughout.
     */
    assert.deepEqual(said.instructions.filter(i => /immediate/i.test(i.text)).map(i => i.from.includes(TAKES)), [true], 'said once, and cited to the timing the game holds')
    assert.ok(!said.coachingObservations.some(o => o.includes('It does not say the change is')), 'and nothing reports it as unsaid')
    assert.ok(said.coachingObservations.some(o => o.includes('neutral players (1 to 2) is offered only as 2') && o.includes('With 12 players, 1 does not leave whole equal teams') && o.includes('roster fields 2, 4, 6, 8, 10') && o.includes('offers 2 as a normal starting configuration') && o.includes('NOT_ASSESSED')))
    assert.ok(said.coachingObservations.some(o => o.includes('.persistence` is not authored')))
    assert.ok(said.coachingObservations.some(o => o.includes('the neutral players take a side by who has possession')), 'who starts with the ball matters to this game, and the reason is read from it')

    // ── Each part taken away is a loss the check names ───────────────────────────────────────────
    // Since stage S-C2 a sentence is made of parts, so what is taken away is a PART: the sentence is rebuilt from the
    // rest, consistently, as a renderer that dropped it would say it (and a sentence left with no part is dropped).
    type Part = NonNullable<Instruction['parts']>[number]
    const rebuild = (i: Instruction, parts: Part[]): Instruction => ({ ...i, parts, text: parts.map(p => p.text).join(''), from: [...new Set(parts.flatMap(p => p.from))], quantities: parts.flatMap(p => p.quantities), status: combinedStatus(parts.map(p => p.status)) })
    const dropParts = (which: (p: Part) => boolean, source: RenderedActivity = said) =>
        wrap(source.instructions.flatMap(i => (!(i.parts ?? []).some(which) ? [i] : i.parts!.filter(p => !which(p)).length ? [rebuild(i, i.parts!.filter(p => !which(p)))] : [])))
    const rewordPart = (which: (p: Part) => boolean, change: (p: Part) => Part) => wrap(said.instructions.map(i => ((i.parts ?? []).some(which) ? rebuild(i, i.parts!.map(p => (which(p) ? change(p) : p))) : i)))
    const lost = (which: (p: Part) => boolean) => violations(checkFidelity(game, dropParts(which)), 3).map(f => f.what)
    assert.deepEqual(
        [...lost(p => p.from.includes(ON))].sort(),
        // Since 14 October 2026 it also carries the timing (P6c), which nothing else says; and since stage S-C2 who
        // they play with too — the overload clause that also cited it is gone.
        [`${ON} is established by the game and no instruction carries it`, `${JOINS} is established by the game and no instruction carries it`, `${TAKES} is established by the game and no instruction carries it`].sort(),
        'the allegiance part is the only one that carries who they play with, the standing rule and when it takes effect',
    )
    assert.ok(lost(p => p.from.includes(JOINS)).includes(`${JOINS} is established by the game and no instruction carries it`), 'with every part that cites it gone, who they play with is lost')
    assert.deepEqual(lost(p => p.from.includes(MEANS)), [`${MEANS} is established by the game and no instruction carries it`])
    assert.deepEqual(lost(p => p.from.includes(STATE)), [`${STATE} is established by the game and no instruction carries it`])
    assert.ok(lost(p => p.text.startsWith('Keep at least')).some(what => what.includes(COUNT) && what.includes('required minimum of 1')), 'the floor of the count is part of what is authored')
    /**
     * What is offerable of the preferred range is REPORTED, as a NOTE that says why — re-pointed in stage S-C2
     * (14 October 2026). In the review of S-C1 the range was not offerable at 12 players at all; now the part the
     * session can field (2) is, and the NOTE names the count that cannot be fielded. A renderer that offered the
     * whole authored range is still REFUSED, number by number.
     */
    assert.ok(
        checkFidelity(game, said).findings.some(f => f.severity === 'NOTE' && f.what.includes(COUNT) && f.what.includes('preferred range (1 to 2) that this session can field only as 2 to 2 (1 leaves no valid configuration')),
        'and so is the preferred range, with why',
    )
    assert.ok(!lost(p => p.status === 'PREFERENCE').some(what => what.includes('preferred range')), 'left out, the offerable preference is the §7 NOTE, not a refusal')
    {
        const impossible: Instruction = { section: 'Adjusting the activity', text: 'Around 1 to 2 neutral players works well', status: 'PREFERENCE', from: [COUNT], quantities: [1, 2] }
        for (const [g, s, unfieldable, offerable] of [[game, said, 1, '2 to 2'], [thirteen.game, thirteen.said, 2, '1 to 1']] as [any, RenderedActivity, number, string][]) {
            const r = checkFidelity(g, wrap([...s.instructions, impossible]))
            assert.ok(
                violations(r, 2).some(f => f.what.includes(`offers ${unfieldable} as a preference, and the preferred range of what it cites is ${offerable}`)),
                JSON.stringify(violations(r, 2)),
            )
        }
        // A session that CAN field the whole range is untouched: the configurations are the roster rule's record,
        // and with every preferred count authorized the range is offered and checked exactly as before.
        const fieldable = JSON.parse(JSON.stringify(game))
        fieldable.status.choices.find((c: any) => c.path === COUNT).within.configurations.authorized = [1, 2, 4, 6, 8, 10]
        const offeredWhole = checkFidelity(fieldable, wrap([...said.instructions, impossible]))
        assert.deepEqual(violations(offeredWhole, 2), [], 'every count fieldable: the authored range may be offered')
        assert.ok(checkFidelity(fieldable, said).findings.some(f => f.severity === 'NOTE' && f.what.includes('may be offered here (1 to 2), and no instruction offers it')), 'and leaving it out is the §7 NOTE')
    }
    assert.ok(lost(p => p.status === 'STARTING' && p.from.includes(COUNT)).some(what => what.includes('starts at 2 in this activity')), 'and so is where this activity starts')
    /**
     * **A count the activity only starts at is named where a coach adjusts — added in the review of S-C1,
     * 14 October 2026.** The "For this activity" prefix that marked a starting value is gone, and a coach reads
     * text, not statuses (his §3: *"without implying that it cannot be adjusted"*). The floor said in "Adjusting the
     * activity" is what names the count there; moved back into the setup, the count reads as fixed and is refused.
     */
    {
        const fixed = checkFidelity(game, wrap(said.instructions.map(i => (i.section === 'Adjusting the activity' ? { ...i, section: 'Players' as const, tier: 'setup' as const } : i))))
        assert.ok(violations(fixed, 4).some(f => f.what === `${COUNT} is only where this activity starts, and nothing in "Adjusting the activity" names it, so it reads as fixed`), JSON.stringify(violations(fixed, 4)))
        assert.deepEqual(violations(checkFidelity(game, said), 4), [], 'as rendered, it is named there')
    }
    /**
     * **CLOSED in the B3 review, 13 October — it was pinned here as a KNOWN LIMIT.** With ONE neutral the
     * starting value and the required minimum are the same number, and the two sentences carried each other.
     * Each is held to the statement of its own status: the starting value to a STARTING part, and a limit equal
     * to it to a firm statement that is not the choice's. Per part since stage S-C2.
     */
    const thirteenLost = (which: (p: Part) => boolean) => violations(checkFidelity(thirteen.game, dropParts(which, thirteen.said)), 3).map(f => f.what)
    assert.deepEqual(thirteenLost(p => p.text.startsWith('Keep at least')), [`${COUNT} has a required minimum of 1 (required: at least 1), and no instruction that cites it states that minimum`])
    // Moved 21 October 2026 (stage 2B): with the roster's starting part gone, the count is cited only by its floor in "Adjusting the
    // activity", so the first-read test (fidelity Q3, sections.ts firstReadUncarried) also finds it carried only where a coach adjusts.
    assert.deepEqual(thirteenLost(p => p.status === 'STARTING' && p.from.includes(COUNT)), [
        `${COUNT} starts at 1 in this activity, inside an authored range, and no instruction that cites it states that value as the choice it is`,
        `${COUNT} is needed to understand and begin the activity, and only a section consulted when needed carries it`,
    ])

    /**
     * **The team size is carried by the part that states it — added in the B3 review, 13 October, per part since
     * stage S-C2.** Take away the teams part of the roster sentence and the size is lost, in the neutral game as in
     * the bare game: nothing else cites it.
     */
    const squads: [any, RenderedActivity, number][] = [[game, said, 5], [thirteen.game, thirteen.said, 6]]
    for (const [g, s, size] of squads) {
        assert.ok(s.instructions.some(i => (i.parts ?? []).some(p => p.text === ` into 2 teams of ${size}`)))
        const teamless = violations(checkFidelity(g, dropParts(p => p.text === ` into 2 teams of ${size}`, s)), 3).map(f => f.what)
        assert.ok(teamless.includes('performers.teams[].outfieldCount is established by the game and no instruction carries it'), JSON.stringify(teamless))
    }

    // ── Each number altered is refused ────────────────────────────────────────────────────────────
    {
        // The starting count said as 3, part and binding together, as a renderer that got it wrong would say it.
        const three = checkFidelity(game, rewordPart(p => p.status === 'STARTING' && p.from.includes(COUNT), p => ({ ...p, text: ', with 3 neutral players', quantities: [3], bindings: [{ quantity: 3, path: COUNT }] })))
        assert.ok(violations(three, 2).some(f => /states 3, which is neither a value the game holds at a property it cites nor a required limit of one/.test(f.what)), JSON.stringify(violations(three, 2)))
        assert.ok(violations(three, 2).some(f => f.what.includes(`binds 3 to ${COUNT}, and that is not a number of that property`)), 'and the binding is refused')
        // A wrong preferred range added beside the rendering is refused, number by number.
        const wrongRange: Instruction = { section: 'Adjusting the activity', text: 'Around 2 to 4 neutral players works well', status: 'PREFERENCE', from: [COUNT], quantities: [2, 4] }
        const wide = checkFidelity(game, wrap([...said.instructions, wrongRange]))
        assert.ok(violations(wide, 2).some(f => /offers 4 as a preference, and the preferred range of what it cites is 2 to 2/.test(f.what)), JSON.stringify(violations(wide, 2)))
        // CLOSED in the B3 review, 13 October — pinned here as a KNOWN LIMIT: 2 is the value the line holds, so a
        // preferred maximum worded as a requirement passed. 2 is where this activity STARTS, and only a starting
        // statement may say it unless it is also a required limit — by the range check and by the binding.
        const firm = checkFidelity(game, rewordPart(p => p.text.startsWith('Keep at least'), p => ({ ...p, text: 'Keep between 1 and 2 neutral players', quantities: [1, 2], bindings: [{ quantity: 1, path: COUNT }, { quantity: 2, path: COUNT }] })))
        assert.ok(
            violations(firm, 2).some(f => f.what.startsWith('"Keep between 1 and 2 neutral players" states 2, which is neither a value the game holds at a property it cites nor a required limit of one')),
            JSON.stringify(all(firm)),
        )
        assert.ok(violations(firm, 2).some(f => f.what.includes(`binds 2 to ${COUNT}, and that is not a number of that property as a DERIVED statement may say it`)))
        const hedged = checkFidelity(game, reworded(i => i.from.includes(ON), i => ({ ...i, text: `Ideally, ${i.text.charAt(0).toLowerCase()}${i.text.slice(1)}` })))
        assert.ok(violations(hedged, 4).some(f => f.what.includes('worded as optional')), 'who the neutral players play with is a requirement of the game, not a suggestion')
        // The same hedge put into the allegiance PART itself, consistently, is refused per part.
        const hedgedPart = checkFidelity(game, rewordPart(p => p.from.includes(ON), p => ({ ...p, text: `Ideally, ${p.text.charAt(0).toLowerCase()}${p.text.slice(1)}` })))
        assert.ok(violations(hedgedPart, 4).some(f => f.what.includes('worded as optional')) && !violations(hedgedPart, 1).length, JSON.stringify(all(hedgedPart)))

        /**
         * **A required limit said as the value is refused by its binding** — review of stage S-C2, 14 October 2026, a
         * TIGHTENING. The binding admitted a required limit for ANY number, so the starting count reworded to the
         * floor — *"with 1 neutral player"*, where the game holds 2 and 1 is only the least it may hold — passed Q2,
         * and was caught only because nothing else said the starting value (Q3). For a count the game FIXED, nothing
         * would have caught it. Now a binding says whether its number is a value or a limit, and each is checked as
         * what it says it is.
         */
        const floorAsValue = checkFidelity(game, rewordPart(p => p.status === 'STARTING' && p.from.includes(COUNT), p => ({ ...p, text: ', with 1 neutral player', quantities: [1], bindings: [{ quantity: 1, path: COUNT }] })))
        assert.ok(violations(floorAsValue, 2).some(f => f.what.includes(`binds 1 to ${COUNT}, and that is not a number of that property as a STARTING statement may say it`)), JSON.stringify(all(floorAsValue)))
        // The same number bound as the limit it is, in the sentence that says it as one, passes — the served text.
        const keep = said.instructions.find(i => i.text === 'Keep at least 1 neutral player')!
        assert.deepEqual(keep.parts![0].bindings, [{ quantity: 1, path: COUNT, as: 'REQUIRED_LIMIT' }], 'the floor is bound as a limit')
        // And a number marked as a limit that is not one is refused: 2 is where the count starts, not a limit of it.
        const falseLimit = checkFidelity(game, rewordPart(p => p.text === 'Keep at least 1 neutral player', p => ({ ...p, text: 'Keep at least 2 neutral players', quantities: [2], bindings: [{ quantity: 2, path: COUNT, as: 'REQUIRED_LIMIT' }] })))
        assert.ok(violations(falseLimit, 2).some(f => f.what.includes(`binds 2 to ${COUNT}, and that is not a number of that property`)), JSON.stringify(all(falseLimit)))
        // A part that arrives with no bindings list binds nothing, so the numbers it says are refused (it fell back to
        // the set-of-numbers check, which a swap passes: 2 and 5 are both numbers the roster holds).
        const unbound = checkFidelity(game, rewordPart(p => p.status === 'INSTANTIATED' && p.from.includes('performers.teams'), p => ({ ...p, text: ' into 5 teams of 2', quantities: [5, 2], bindings: undefined as any })))
        assert.ok(violations(unbound, 2).some(f => f.what.includes('says [5,2] where its bindings give []')), JSON.stringify(all(unbound)))
    }

    /**
     * ── NUMBER WORDS AND MIXED STATUSES — stage S-C2, 14 October 2026, each a TIGHTENING ──────────────
     *
     * His own example wording wrote its numbers as words (*"two teams of five"*). The check read digits only, so a
     * number word reached a coach unchecked. And a consolidated sentence must never carry a preference's hedge across
     * a firm statement. The swap test is the binding's reason to exist: the right numbers in the wrong places.
     */
    {
        const roster = said.instructions.find(i => i.text.startsWith('Divide'))!
        const asWords = checkFidelity(game, wrap([...said.instructions, { section: 'Players', text: 'Make two lines of cones', status: 'DERIVED', from: ['envelope.players'], quantities: [] } as Instruction]))
        assert.ok(violations(asWords, 2).some(f => f.what.includes('contains the number 2 without declaring it')), 'a number word is read as a number')
        assert.ok(!violations(checkFidelity(game, said), 2).length, '"one team" and the like are not counted (the known limit: "one" is a determiner)')
        // The swap: "Divide 12 players into 2 teams of 2, with 5 neutral players" — the same four numbers, two traded.
        const swapped = checkFidelity(
            game,
            wrap(
                said.instructions.map(i =>
                    i !== roster
                        ? i
                        : rebuild(
                              i,
                              i.parts!.map(p =>
                                  p.text === ' into 2 teams of 5'
                                      ? { ...p, text: ' into 2 teams of 2', quantities: [2, 2], bindings: [{ quantity: 2, path: 'performers.teams' }, { quantity: 2, path: 'performers.teams[].outfieldCount' }] }
                                      : p.from.includes(COUNT)
                                        ? { ...p, text: ', with 5 neutral players', quantities: [5], bindings: [{ quantity: 5, path: COUNT }] }
                                        : p,
                              ),
                          ),
                ),
            ),
        )
        const refused = violations(swapped, 2).map(f => f.what)
        assert.ok(refused.some(w => w.includes('binds 2 to performers.teams[].outfieldCount')) && refused.some(w => w.includes(`binds 5 to ${COUNT}`)), JSON.stringify(refused))
        // A preference part inside a firm sentence is refused, whatever its words.
        const mixed = checkFidelity(game, wrap(said.instructions.map(i => (i !== roster ? i : rebuild(i, [...i.parts!, { text: ', which works well', status: 'PREFERENCE', from: [COUNT], quantities: [], bindings: [] }])))))
        assert.ok(violations(mixed, 4).some(f => f.what.includes('puts a PREFERENCE part in one sentence with parts of another status')), JSON.stringify(violations(mixed, 4)))
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
        // Re-pointed 14 October 2026 (stage S-C2): the play-state sentence is the first PART of "When possession changes,
        // play carries on with no stoppage, and …"; it is that part that is said once and cites every transition. Re-pointed 17
        // October 2026 (stage M4) to his approved words (reply filed 19 October 2026, item 4), the template's first part.
        const PLAY_ON = 'When possession changes, play carries on without a stoppage'
        const continuity = said.instructions.filter(i => i.text.startsWith(PLAY_ON))
        assert.equal(continuity.length, 1, 'said once, however many transitions assert it')
        const elements = game.game.transitions.map((t: any) => t.elementId)
        assert.equal(elements.length, 2)
        assert.deepEqual(continuity[0].parts![0].from, elements.flatMap((id: string) => [`transitions[${id}].playState`, `transitions[${id}].selector`]), 'and it cites every one of them')

        const notes = checkFidelity(game, said).findings.filter(f => f.severity === 'NOTE' && f.what.includes('.startsEpisode'))
        assert.equal(notes.length, 2)
        for (const id of elements) {
            assert.ok(notes.some(n => n.what.startsWith(`transitions[${id}].startsEpisode`) && n.what.includes(`carried by transitions[${id}].playState`)), `${id}: discharged by its OWN play state`)
        }

        const [first, second] = elements
        const onlyFirst = checkFidelity(game, rewordPart(p => p.text === PLAY_ON, p => ({ ...p, from: [`transitions[${first}].playState`, `transitions[${first}].selector`] })))
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
    // Re-pointed 14 October 2026 (stage S-C2): the allegiance is said in his words ("support whichever team has
    // possession and switch immediately …"), and the count is a part of the roster sentence.
    const ALLEGIANCE = 'The neutrals support whichever team has possession and switch immediately when possession changes'
    const ROSTER = `Divide 12 players into 2 teams of 5, with 2 neutral players and no ${Object.keys(roles)[0]}s`
    const sayAllegiance = (texts: string[]) => texts.some(t => t.includes('support whichever') || t.includes('change sides') || t.includes('switch'))
    {
        // A designation the possession relation does not decide: nothing here knows who "won the ball".
        const won = altered(copy => (copy.game.performers.neutrals.affiliation.joins = 'WON_BALL'))
        assert.ok(!sayAllegiance(won.texts), 'no sentence about who they play with')
        assert.ok(won.texts.includes(ROSTER), 'and the count is still said')
        assert.ok(won.texts.includes('The neutrals take a full part in play — not waiting, resting or watching'), 'and the participation stands as its own sentence')
        assert.ok(won.rendered.coachingObservations.some(o => o.includes('no coach-facing wording for the team designation "WON_BALL"') && o.includes('rather than paraphrase it')))
        // The timing (P6c, since 14 October 2026) is lost with the sentence that would have carried it.
        assert.deepEqual([...won.q3].sort(), [`${JOINS} is established by the game and no instruction carries it`, `${ON} is established by the game and no instruction carries it`, `${TAKES} is established by the game and no instruction carries it`].sort())

        // An affiliation decided on an event rather than standing: no wording, so none is offered.
        const event = altered(copy => (copy.game.performers.neutrals.affiliation.on = 'SCORE'))
        assert.ok(!sayAllegiance(event.texts))
        assert.ok(event.rendered.coachingObservations.some(o => o.includes('no coach-facing wording for an affiliation decided on "SCORE"')))
        assert.ok(event.q3.includes(`${ON} is established by the game and no instruction carries it`))

        // No possession relationship for the designation to resolve against.
        const unheld = altered(copy => delete copy.game.possession)
        assert.ok(!sayAllegiance(unheld.texts) && unheld.texts.includes(ROSTER))
        assert.ok(unheld.rendered.coachingObservations.some(o => o.includes('establishes no possession relationship')))

        /**
         * Nothing established to name as what is possessed. Re-pointed 14 October 2026 (stage S-C2): the allegiance
         * is said in his words — "whichever team has possession" — and names no object, so an object is no longer
         * its precondition (the possession relation is). It is still said, and still names no ball.
         */
        const objectless = altered(copy => (copy.game.objects = []))
        assert.ok(objectless.texts.some(t => t.startsWith(ALLEGIANCE)) && objectless.texts.includes(ROSTER))
        assert.ok(!objectless.texts.some(t => /\bball\b/.test(t) && t.includes('neutral')), 'and no neutral sentence names one')

        // The other possession-relative side has its wording.
        const defending = altered(copy => (copy.game.performers.neutrals.affiliation.joins = 'DEFENDING_TEAM'))
        assert.ok(defending.texts.some(t => t.startsWith('The neutrals support whichever team does not have possession and switch immediately when possession changes')))
        assert.ok(defending.texts.includes(ROSTER))
        assert.deepEqual(defending.every, [])

        // Teams that are not alike: no size is said for them, and the neutrals are still said.
        const uneven = altered(copy => (copy.game.performers.teams[0].outfieldCount = 4))
        assert.ok(uneven.texts.some(t => t.startsWith('Divide 12 players into 2 teams, with 2 neutral players')) && uneven.texts.some(t => t.startsWith(ALLEGIANCE)), JSON.stringify(uneven.texts))

        // A participation state outside the table, and a group this renderer cannot name.
        const waiting = altered(copy => (copy.game.performers.participation[0].state = 'WAITING'))
        assert.ok(!waiting.texts.some(t => /waiting/i.test(t) && !t.includes('not waiting')), 'no sentence is improvised for it')
        assert.ok(waiting.texts.includes(ALLEGIANCE), 'and the allegiance stands alone')
        assert.ok(waiting.rendered.coachingObservations.some(o => o.includes('"WAITING"') && o.includes('no coach-facing wording for that state')))
        assert.deepEqual(waiting.q3, [`${STATE} is established by the game and no instruction carries it`])
        const bench = altered(copy => (copy.game.performers.participation[0].selector[0].value = 'bench'))
        assert.ok(!bench.texts.some(t => t.includes('full part in play')))
        assert.ok(bench.rendered.coachingObservations.some(o => o.includes('"bench"') && o.includes('no coach-facing wording for that group')))

        // The authored means is inserted verbatim, whatever it is — as an example while its value is a preferred
        // default (C47, 14 October 2026), and as the rule where the knowledge requires it.
        const means = altered(copy => (copy.game.performers.neutrals.distinguishable = 'a third bib colour'))
        assert.ok(means.texts.includes('Make the neutrals easy to tell apart from both teams — for example, a third bib colour'))
        assert.deepEqual(means.every, [])
        const requiredMeans = altered(copy => (copy.status.derived.find((d: any) => d.path === MEANS).strength = 'REQUIRED'))
        assert.ok(requiredMeans.texts.includes('Make the neutrals easy to tell apart from both teams — contrasting bibs'))

        // A timing this renderer has no wording for is said WITHOUT the adverb and withheld, which refuses the
        // activity; "immediately" is never said for anything but IMMEDIATE (14 October 2026).
        const held = altered(copy => (copy.game.performers.neutrals.affiliation.takesEffect = 'AT_NEXT_RESTART'))
        assert.ok(!held.texts.some(t => /immediately/.test(t)) && held.texts.some(t => t.startsWith('The neutrals support whichever team has possession and change sides when possession changes')))
        assert.deepEqual(held.rendered.withheld, [{ path: TAKES, row: 'P6c', reason: 'AWAITING_APPROVED_WORDING' }])

        // A count nobody established: how many is not said, and is not guessed.
        const uncounted = altered(copy => delete copy.game.performers.neutrals.count)
        assert.ok(!uncounted.texts.some(t => /neutral players? and/.test(t) || t.includes('with 2 neutral')))
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
/**
 * **RE-POINTED 14 October 2026 (stage S-C2): "perceptual reference" is no longer said, and the exclusion has teeth.**
 * Christian that day: *"please remove internal engine terminology such as 'perceptual reference' from coach-facing
 * instructions unless it conveys an actual action the coach needs to take."* The member stays in the GAME; the shared
 * table (`coach-facing-exclusions.ts`) excludes it on the ground NO_COACH_ACTION, and the check requires its one
 * consequence — the channel is marked — to be cited, and reports the exclusion with his words. Before this the
 * specimen rendered *"It helps if this channel is established as a perceptual reference"* twice.
 */
{
    const withFunctions = specimen.game.space.regions.filter((r: any) => Array.isArray(r.functions) && r.functions.length)
    assert.equal(withFunctions.length, 2, 'both channels still carry the established member in the game')
    assert.ok(!specimenRendered.instructions.some((i: any) => /perceptual reference/i.test(i.text)), 'and the rendering does not say it')
    const notes = specimenReport.findings.filter(f => f.severity === 'NOTE' && f.what.includes('.functions[perceptual-reference] is established and deliberately given no coach-facing expression'))
    assert.equal(notes.length, 2, `one per channel: ${JSON.stringify(notes)}`)
    for (const note of notes) {
        assert.ok(note.what.includes('Ground: NO_COACH_ACTION') && note.what.includes('Christian, 2026-10-14') && note.what.includes('perceptual reference'), note.what)
        assert.match(note.what, /Its operational consequence\(s\) are carried by space\.regions\[[^\]]+\]\.noun/, 'discharged by the marking sentence, which cites the noun')
    }
    // TEETH — take away a channel's marking sentence and the exclusion is not honoured (Q3), besides the region going
    // unmarked (Q5): engine terminology may be left unsaid only while the act it implies reaches the coach.
    const [channel] = withFunctions
    const unmarked = wrap(specimenRendered.instructions.filter(i => !i.from.includes(`space.regions[${channel.elementId}].noun`)))
    const r = checkFidelity(specimen, unmarked)
    assert.ok(violations(r, 3).some(f => f.what.startsWith(`space.regions[${channel.elementId}].functions[perceptual-reference] was excluded as conveying no action a coach needs to take`)), JSON.stringify(violations(r, 3)))
    assert.ok(violations(r, 5).some(f => f.what.includes(`region ${channel.elementId} exists in the game and has no marking instruction`)))
    /**
     * Review of stage S-C2 (14 October 2026): take away ONLY the marking sentence. The channel's preference in
     * "Adjusting the activity" also cites its noun, so a check that asked merely whether the noun was cited honoured
     * the exclusion with nothing marked. The act the function implies is the marking, so only a marking instruction
     * (as Q5 reads one) discharges it.
     */
    const preferenceKept = wrap(specimenRendered.instructions.filter(i => !(i.section === 'Set up' && i.from.includes(`space.regions[${channel.elementId}].noun`))))
    assert.ok(preferenceKept.instructions.some(i => i.status === 'PREFERENCE' && i.from.includes(`space.regions[${channel.elementId}].noun`)), 'the preference that names the channel is still there')
    assert.ok(
        violations(checkFidelity(specimen, preferenceKept), 3).some(f => f.what.startsWith(`space.regions[${channel.elementId}].functions[perceptual-reference] was excluded as conveying no action a coach needs to take`)),
        JSON.stringify(violations(checkFidelity(specimen, preferenceKept), 3)),
    )
    // A region whose function list holds another member keeps the list coach-facing, and that member is still said:
    // excluding one engine term never silences another fact.
    const mixed = JSON.parse(JSON.stringify(specimen))
    mixed.game.space.regions.find((r: any) => r.elementId === channel.elementId).functions = ['perceptual-reference', 'objective-area']
    const mixedRendered = renderConcreteGame(mixed)
    assert.ok(mixedRendered.instructions.some(i => i.text === 'This channel is established as a objective area'), JSON.stringify(mixedRendered.instructions.map(i => i.text)))
    assert.ok(!mixedRendered.instructions.some(i => /perceptual reference/i.test(i.text)))
    assert.ok(!checkFidelity(mixed, mixedRendered).findings.some(f => f.what.startsWith(`space.regions[${channel.elementId}].functions is established and deliberately given no coach-facing expression`)), 'the list itself is not excluded')
}

/**
 * ── THE VALUE-MODIFIER BRANCH IS GENERIC — over altered copies of the specimen (14 October 2026) ──
 *
 * Step 4, component 3, which he approved that day: *"Enable accurate coach-facing communication of scoring
 * conditions and information rules, using approved language."* The branch was shaped to the one Wide Zone
 * modifier: the noun fell back to the word "region", only MULTIPLY was worded, one fixed criterion sentence was
 * said for ANY criterion, and "the ball" was written in with no object cited. Each case below is a copy of the
 * specimen with one field changed. What the specimen itself says is unchanged (pinned above and by the
 * scoring-modifier demonstration in `activity-review.unit.ts`, 0 violations; 22 instructions until stage S-C2 consolidated them to 11).
 */
{
    const altered = (change: (modifier: any, game: any) => void) => {
        const copy = JSON.parse(JSON.stringify(specimen))
        change(copy.game.value.valueModifiers[0], copy.game)
        const out = renderConcreteGame(copy)
        return { copy, out, report: checkFidelity(copy, out) }
    }
    const base = `value.valueModifiers[${specimen.game.value.valueModifiers[0].elementId}]`
    /**
     * Re-pointed 14 October 2026 (stage S-C2): the modifier's four sentences are one, of up to three parts — the effect
     * ("A score is worth 3 instead of 1"), the condition and what meets it, and when it ends. Each case reads the part it
     * is about; each withheld field is still withheld, and two more are where the sentence can no longer be built
     * around them (named below).
     */
    const effectPart = (out: RenderedActivity) => out.instructions.flatMap(i => (i.parts ?? []).filter(p => /score is worth/.test(p.text)))
    const worth = (out: RenderedActivity) => out.instructions.filter(i => /score is worth/.test(i.text))

    // The specimen: nothing withheld, and the criterion now cites the object it names.
    assert.deepEqual(specimenRendered.withheld, [])
    const carrierPath = `objects[${specimen.game.objects[0].elementId}].kind`
    const criterionPart = specimenRendered.instructions.flatMap(i => i.parts ?? []).find(p => p.from.includes(`${base}.condition.value`))!
    assert.ok(criterionPart.from.includes(carrierPath), `the object the criterion names is cited (SD-103) — ${JSON.stringify(criterionPart.from)}`)
    // The termination names no object since stage S-C2 ("The bonus lasts until possession changes"), so cites none.
    const endsPart = specimenRendered.instructions.flatMap(i => i.parts ?? []).find(p => p.from.includes(`${base}.endsOn`))!
    assert.deepEqual([endsPart.text, endsPart.from], ['. The bonus lasts until possession changes', [`${base}.endsOn`]])

    // ADD and REPLACE are worded by SD-30's own arithmetic, and the check admits the number for that reason — bound to the operation.
    for (const [operation, magnitude, expected] of [['ADD', 2, 3], ['REPLACE', 5, 5], ['MULTIPLY', 3, 3]] as const) {
        const { out, report: checked } = altered(modifier => Object.assign(modifier, { operation, magnitude }))
        assert.deepEqual(effectPart(out).map(p => [p.text, p.quantities, p.bindings.map(b => b.path)]), [[`A score is worth ${expected} instead of 1`, [expected, 1], [`${base}.operation`, 'value.primaryEvent.value']]], operation)
        // The retired specimen carries two violations of its own (a channel minimum it predates); the altered
        // copy has exactly those and nothing more — in particular no Q2, so the effective value is admitted.
        assert.deepEqual(checked.findings.filter(f => f.severity === 'VIOLATION'), specimenReport.findings.filter(f => f.severity === 'VIOLATION'), `${operation}: nothing invented`)
        assert.deepEqual(out.withheld, [])
    }
    // ...and ONLY where the statement cites the operation, the magnitude and the base: drop one citation and the 3
    // under ADD 2 is a number the game holds nowhere.
    {
        const { copy, out } = altered(modifier => Object.assign(modifier, { operation: 'ADD', magnitude: 2 }))
        const said = worth(out)[0]
        said.from = said.from.filter(p => !p.endsWith('.operation'))
        const unjustified = checkFidelity(copy, out).findings.filter(f => f.question === 2 && f.severity === 'VIOLATION')
        assert.ok(unjustified.some(f => f.what.includes('3')), JSON.stringify(unjustified))
        // And the same citation dropped from the PART, consistently: the binding to the operation is refused.
        const fresh = altered(modifier => Object.assign(modifier, { operation: 'ADD', magnitude: 2 }))
        const instruction = worth(fresh.out)[0]
        instruction.parts![0].from = instruction.parts![0].from.filter(p => !p.endsWith('.operation'))
        instruction.from = [...new Set(instruction.parts!.flatMap(p => p.from))]
        const unbound = checkFidelity(fresh.copy, fresh.out).findings.filter(f => f.question === 2 && f.severity === 'VIOLATION')
        assert.ok(unbound.some(f => f.what.includes(`binds 3 to ${base}.operation, which it does not cite`)), JSON.stringify(unbound))
    }

    // An operation SD-30 does not support is withheld — never worded as a multiplication. The condition is then said
    // on its own ("The channel condition is met once …"), and what ends it as "It lasts until …".
    {
        const { out } = altered(modifier => Object.assign(modifier, { operation: 'POWER' }))
        assert.deepEqual(worth(out), [])
        assert.deepEqual(out.withheld.map(w => [w.path, w.row]), [[`${base}.operation`, 'V9a'], [`${base}.magnitude`, 'V9']])
        assert.ok(out.instructions.some(i => i.text.startsWith('The channel condition is met once the attacking team') && i.text.endsWith('. It lasts until possession changes')), JSON.stringify(out.instructions.map(i => i.text)))
    }
    // A criterion the code map does not hold EXACTLY is withheld; the fixed clause is not said for it.
    {
        const { out } = altered(modifier => (modifier.condition.value = 'a criterion nobody has worded'))
        assert.ok(!out.instructions.some(i => /touched the ball inside/.test(i.text)))
        assert.ok(out.instructions.some(i => i.text.startsWith('A score is worth 2 instead of 1 when the channel condition is met, which applies to either channel you marked')))
        assert.deepEqual(out.withheld.map(w => [w.path, w.row]), [[`${base}.condition.value`, 'V8c']])
    }
    // A termination with no wording is withheld (it was only an observation until 14 October).
    {
        const { out } = altered(modifier => (modifier.endsOn = 'OUT_END_LINE'))
        assert.ok(!out.instructions.some(i => /lasts until/.test(i.text)))
        assert.deepEqual(out.withheld.map(w => [w.path, w.row]), [[`${base}.endsOn`, 'V8d']])
    }
    // Without an object, the clause that names one is withheld rather than naming one the game does not hold. (The
    // termination named one too until stage S-C2 and was withheld with it; it names none now, so it is said.)
    {
        const { out } = altered((_, game) => (game.objects = []))
        assert.deepEqual(out.withheld.map(w => w.row), ['V8c'])
    }
    // A referent that names no region is withheld — never called a "region". Since stage S-C2 the criterion and the
    // termination go with it: where the condition is met cannot be said without a noun, and with nothing of the
    // modifier said there is nothing for a termination to end.
    {
        const { out } = altered(modifier => (modifier.condition.referents = [{ structuralRef: { contractId: 'restated:WIDE-ZONE-ADVANTAGE', itemId: 'NO-SUCH-REGION' } }]))
        assert.ok(!out.instructions.some(i => /\bregion\b/.test(i.text)), JSON.stringify(out.instructions.map(i => i.text)))
        assert.deepEqual(out.withheld.map(w => w.row), ['V9a', 'V9', 'V8a', 'V8b', 'V8c', 'V8d'])
    }
    // Two referents of different kinds share no noun, so neither is said as the other.
    {
        const { out } = altered((modifier, game) => {
            const line = game.space.regions.find((r: any) => r.noun === 'line')
            const [contractId, itemId] = [line.elementId.split(':').slice(1, -1).join(':'), line.elementId.split(':').pop()]
            modifier.condition.referents = [modifier.condition.referents[0], { structuralRef: { contractId, itemId } }]
        })
        assert.deepEqual(out.withheld.map(w => w.row), ['V9a', 'V9', 'V8a', 'V8b', 'V8c', 'V8d'])
    }
}

// ── His M6 state reaches the account, never the coach (stage K1, 15 October 2026) ─────────────────────────────
//
// His 17 October M6: "No further value is required" must not collapse into a non-claim that merely does not
// constrain. The fixture carries each unestablished entry's deciding declarations WHOLE (rendering-fixture.ts), and
// the renderer reads the state from them: a technical observation names the fields that need no further value, and
// no instruction mentions them. On a COPY of the frozen fixture, with one entry restated TEST-ONLY.
{
    // Key identity: every unestablished entry of the frozen fixture carries the declarations that decided it.
    for (const entry of fixture.status.notEstablished) assert.ok(Array.isArray(entry.governedBy), `${entry.lineId} carries governedBy`)
    assert.ok(!rendered.coachingObservations.some(o => o.includes('need no further value')), 'the Golden Case has no such field')

    const copy = JSON.parse(JSON.stringify(fixture))
    const entry = copy.status.notEstablished.find((n: any) => n.reason === 'not constrained')
    entry.governedBy = [{ contractId: 'TEST-ONLY', declaration: 'NON_CLAIMED', selector: '*', qualifier: 'NO_FURTHER_VALUE' }]
    const out = renderConcreteGame(copy)
    const said = out.coachingObservations.filter(o => o.includes('need no further value'))
    assert.deepEqual(said, [
        `1 field(s) need no further value, by an explicit statement of the knowledge that establishes them (${entry.path}). Nothing is missing there, and the coach is told nothing about them.`,
    ])
    assert.deepEqual(out.instructions.map(i => i.text), rendered.instructions.map(i => i.text), 'no coach-facing sentence moves')
    // A legacy non-claim beside it is not that state, and is not reported as it.
    entry.governedBy.push({ contractId: 'TEST-ONLY-2', declaration: 'NON_CLAIMED', selector: '*' })
    assert.ok(!renderConcreteGame(copy).coachingObservations.some(o => o.includes('need no further value')))
}

console.log('rendering.unit.ts — ok')
