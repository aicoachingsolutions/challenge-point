/**
 * The possession relation (PS1), and the distinction Christian drew on 2 October.
 *
 * The relation exists because a corpus check established that dynamic possession attribution is independently
 * required — GF2 authors `awardedTo` prohibitions phrased as *"the team that lost it"* and *"NOT_LAST_TOUCH"*,
 * and the Neutral Player Condition defines `ATTACKING_TEAM` as the team currently in possession while forbidding
 * a fixed-team reading. Nothing held it.
 *
 * The ruling this file pins:
 *
 *   > *An episode boundary does not by itself establish or change possession. Possession changes only when an
 *   > authoritative event or realization establishes its new value.*
 *
 * So `ATTACKING_TEAM` resolves **against the relation**, and is never recalculated merely because a boundary
 * occurred. Where the relation is unestablished — including after a score, until the selected post-score
 * realization establishes it — anything requiring the designation stays unresolved rather than inferring a team.
 */
import assert from 'node:assert/strict'

import { corpusInput, loadCorpusContracts } from './corpus'
import { runDerivation, runStages0to10 } from './engine'
import { indexRegister } from './register'
import { assembleResolvedGame } from './resolved-game'
import { derivationInputFor, selectFor } from './run-bounded-selection'

const register = derivationInputFor(selectFor('A04', null)).register as any
const index = indexRegister(register)

// ── The relation is registered, at GAME level, and carries its own choice space ───────────────────
{
    const ps1 = index.rows.get('PS1')
    assert.ok(ps1, 'PS1 must be a registered row')
    assert.equal(ps1!.path, 'possession.team')
    assert.equal(ps1!.kind, 'FIELD')
    assert.equal((ps1 as any).ownerRow, undefined, 'game level: it belongs to no collection')
    assert.equal(index.fillable.get('PS1'), 'one of the teams the game establishes', 'its choice space is registered')

    // Not a field on the ball — his ruling. The object rows stay as they were.
    const objectRows = [...index.rows.values()].filter((r: any) => String(r.path).startsWith('objects['))
    assert.ok(objectRows.length > 0)
    assert.ok(
        !objectRows.some((r: any) => /owner|possess/i.test(String(r.path))),
        'no owner field was added to the ball; possession is game-state relational meaning',
    )
}

// ── What the relation is NOT: the exclusions are recorded on the row itself ───────────────────────
{
    const note = String((index.rows.get('PS1') as any).note)
    for (const excluded of ['scoring eligibility', 'objective association', 'post-score', 'ATTACKING/DEFENDING labels']) {
        assert.ok(note.includes(excluded), `the row must record that ${excluded} is excluded from this relation`)
    }
    assert.ok(note.includes('EPISODE BOUNDARY DOES NOT BY ITSELF ESTABLISH OR CHANGE POSSESSION'), note.slice(0, 200))
}

// ── `ATTACKING_TEAM` resolves against the relation, not against an episode ────────────────────────
{
    const designations = (register.teamDesignations?.list ?? []) as string[]
    const attacking = designations.find(d => d.startsWith('ATTACKING_TEAM'))
    assert.ok(attacking, 'ATTACKING_TEAM must still be in the canonical designation list')
    assert.match(attacking!, /possession relation PS1/, `the gloss must resolve against the relation; got "${attacking}"`)
    assert.ok(
        !/in possession for the episode/.test(attacking!),
        'the per-episode gloss carried the conflation his ruling separates',
    )
    // The designations that are possession-relative are unchanged — they named the states of this relation
    // before anything could hold one, which is why the relation was the missing piece rather than new.
    for (const expected of ['WON_BALL', 'LOST_BALL', 'LAST_TOUCH', 'NOT_LAST_TOUCH']) {
        assert.ok(designations.some(d => d.startsWith(expected)), `${expected} must remain in the list`)
    }
}

// ── On A04 the relation is UNESTABLISHED, honestly, and nothing is invented ────────────────────────
//
// SD-39's existence condition: a game-level line's existence must be supported by something that addresses it.
// Nothing in A04's selected knowledge addresses possession, so the line is a gap with reason "no coverage" —
// the representation declining to invent a holder. This is the result, not a defect.
{
    const input = derivationInputFor(selectFor('A04', null))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const resolved: any = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)

    const line = result.resolution.find((e: any) => String(e.row) === 'PS1')
    assert.ok(line, 'the line is enumerated')
    assert.equal(line.verdict, 'NOT_AUTHORED')
    assert.equal(line.reason, 'no coverage', 'nobody addressed it — not a declared gap, and not a freedom')
    assert.equal(line.value, undefined, 'and above all: no holder is invented')

    assert.equal(resolved.open.filter((o: any) => /PS1/.test(o.lineId)).length, 0, 'unsupported existence is not a freedom (SD-39)')
    assert.equal(resolved.notEstablished.filter((n: any) => /PS1/.test(n.lineId)).length, 1, 'it is reported as unestablished')
}

// ── It is LIVE: once selected knowledge addresses it, the line resolves ──────────────────────────
// Proof that the relation is wired rather than inert, and that its being unestablished on A04 is a fact about
// A04's knowledge rather than about the representation.
{
    const input = derivationInputFor(selectFor('A04', null))
    const gf2: any = input.contracts.find((c: any) => /GF2/.test(String(c.contractId)))
    const model = (gf2.items as any[]).find(i => i.checkability && i.basis === 'AUTHORED')
    gf2.items.push({
        ...model,
        itemId: 'TEST-PS1',
        origId: 'TEST',
        row: 'PS1',
        selector: '*',
        requirement: 'RANGE',
        value: ['one of the teams the game establishes'],
        strictness: 'REQUIRED',
        valueStatus: 'REQUIRED_RANGE',
        scope: 'WHOLE_GAME',
        basis: 'AUTHORED',
        checkability: 'STRUCTURAL',
        structuralClause: 'whole item',
    })
    const result: any = runDerivation(input)
    const line = result.resolution.find((e: any) => String(e.row) === 'PS1')
    assert.notEqual(line.verdict, 'NOT_AUTHORED', 'knowledge addressing the row must reach it')
    assert.equal(line.state, 'derived', `got ${line.state}/${line.verdict}`)
}

// ── THE GAP THIS EXPOSED: the established teams have no identity to refer to ──────────────────────
//
// Reported rather than repaired, on his instruction. The choice space is "one of the teams the game establishes",
// and two things are true at once: at resolved-game time the teams do not exist yet (realization instantiates
// them), and once they do they are indistinguishable from each other. So possession cannot be ASSIGNED even
// where it is established, because nothing in the corpus authors team identity. `teamDesignations` contemplates
// `TEAM_<id> (a named team)` and nothing authors a name.
{
    const input = derivationInputFor(selectFor('A04', null))
    const result: any = runDerivation(input)
    const staged: any = runStages0to10(input)
    const resolved: any = assembleResolvedGame(result, staged.classes, indexRegister(input.register), input.contracts)

    // Before realization: the teams are owed, not present.
    const claim = resolved.existential.find((e: any) => /teams/.test(e.path))
    assert.ok(claim, 'the teams are an existential claim')
    assert.equal(claim.shortfall, 2, 'both are owed, so the choice space is empty before realization')
    assert.equal((resolved.game as any).performers?.teams, undefined, 'no team exists in the resolved game to choose between')

    // The designation vocabulary contemplates a named team; nothing authors one.
    const designations = (register.teamDesignations?.list ?? []) as string[]
    assert.ok(designations.some(d => d.startsWith('TEAM_<id>')), 'the vocabulary contemplates a named team')
    const authorsAName = (loadCorpusContracts() as any[]).some(c =>
        (c.items ?? []).some((i: any) => /TEAM_[A-Za-z0-9]/.test(String(i.value ?? ''))),
    )
    assert.equal(authorsAName, false, 'and no contracted item authors one — which is the gap, reported not repaired')
}

// ── Corpus-wide: exactly one possession line, and it is not silently satisfied anywhere ───────────
{
    const r: any = runStages0to10(corpusInput())
    const ps1 = [...r.classified.values()].filter((c: any) => /PS1/.test(c.lineId))
    assert.equal(ps1.length, 1, 'one game-level line, no per-element duplication')
    assert.equal(ps1[0].verdict, 'NOT_AUTHORED')
    assert.equal(ps1[0].reason, 'no coverage', 'no contract addresses possession anywhere in the corpus yet')
}

console.log('possession.unit.ts — ok')
