/**
 * Team designations resolved once (AM-01) — stage K2, 15 October 2026, his M2 in the reply filed 17 October: *"Team-specific
 * facts: Approved. Please implement the previously adopted September 20 designation rule, rather than introducing a narrower
 * workaround solely for this activity."*
 *
 * What is pinned here:
 *   1. the register types every designation, from closed lists, and says which resolutions are our interpretation;
 *   2. the one resolver's answers — value equality (RC-22), the possession relation, which instantiated team a selector
 *      reaches for a standing property, and why it does not;
 *   3. every consumer asks it (no designation name or gloss test written in a consumer);
 *   4. the binding of a setup assignment to a team travels from the realization input to the fixture unchanged (key
 *      identity), is checked by realization, and steers a roster fact to exactly the bound team (a TEST-ONLY item on a copy);
 *   5. nothing on today's corpus moves except the recorded binding (measured over 25 compositions and 33 served fixtures
 *      when this landed; the served activities themselves are byte-identical).
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/derivation/designation-reach.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildActivityFromKnowledge, buildActivityWithFixture } from '../rendering/build-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { AUDITS_DIR } from './knowledge-root'
import { loadRegister } from './corpus'
import { designationEntry, designationKey, followsPossessionRelation, isAllTeams, isRegisteredDesignation, listedEntry, memberDesignations, sameDesignation, whyNotReached } from './designation'
import { reaches } from './reach'
import { designationName, HaltError, indexRegister } from './register'
import { ElementClass } from './types'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}

console.log('team designations resolved once (AM-01, his M2)')

const register = loadRegister()
const index = indexRegister(register)
const TEAMS = 'c:restated:GF2:GF2-14.a'
const START = 'TEAM_AT_AXIS_START'
const END = 'TEAM_AT_AXIS_END'
const bindings = [
    { designation: START, handle: `${TEAMS}#1`, because: 'TEST-ONLY' },
    { designation: END, handle: `${TEAMS}#2`, because: 'TEST-ONLY' },
]
const roleRow = register.rows.find((row: any) => row.specializedRole)
const role = String(roleRow.path).split('.').pop() as string
const sessionWith = (players: number, keepers: number) => ({
    players,
    lengthM: 40,
    widthM: 30,
    durationMin: 20,
    roles: { ...Object.fromEntries(specializedRoleNames().map(name => [name, 0])), [role]: keepers },
})

test('the register types EVERY designation from closed lists, and marks as OUR_INTERPRETATION each one with no gloss', () => {
    const block = register.teamDesignations
    const names = block.list.map((entry: string) => designationName(entry))
    assert.deepEqual(Object.keys(block.resolutions).sort(), [...names].sort(), 'one resolution per entry, none for an entry the list does not hold')
    assert.deepEqual(block.resolutionKinds, ['SETUP_ASSIGNMENT', 'TRANSITION_AWARD', 'POSSESSION_RELATION', 'OUTCOME_AT_TRIGGER', 'ALL', 'NAMED', 'BLOCK_ROLE'])
    assert.deepEqual(block.resolutionScopes, ['ACTIVITY', 'EPISODE', 'DYNAMIC', 'TRIGGER', 'BLOCK'])
    assert.deepEqual(block.standingScopes, ['ACTIVITY', 'BLOCK'], 'a standing property never reaches through an episode, dynamic or trigger designation')
    for (const entry of block.list as string[]) {
        const name = designationName(entry)
        const glossed = entry.trim() !== name
        // The verifier's correction (g-part-06): a resolution can be "copied from the gloss" only where there is one.
        //
        // **15 October 2026 (stage K3): one glossed entry is OUR_INTERPRETATION, and why.** ROLE_HOLDER_<role> (his M1)
        // carries a gloss that is OURS — it says so in its own text — so its resolution restates no gloss of his and may
        // not claim GLOSS. The direction that guards against a false claim of his authority is unchanged for every entry:
        // GLOSS only where there is a gloss. The other direction now excepts exactly the entries whose gloss names itself
        // as our extension.
        const oursByItsOwnWords = glossed && entry.includes('OUR extension of AM-01')
        if (block.resolutions[name].basis === 'GLOSS') assert.ok(glossed, `${name}: GLOSS only where the entry carries a gloss`)
        assert.equal(block.resolutions[name].basis, glossed && !oursByItsOwnWords ? 'GLOSS' : 'OUR_INTERPRETATION', `${name}: GLOSS exactly where the entry carries a gloss of his`)
    }
    // His M1 scope was registered at version 9 and used by no entry. Since version 10 (15 October 2026, stage K3) exactly
    // one entry uses it — ROLE_HOLDER_<role>, block-scoped, our extension of AM-01 — pinned in role-blocks.unit.ts.
    assert.deepEqual(Object.entries(block.resolutions).filter(([, r]: [string, any]) => r.kind === 'BLOCK_ROLE').map(([name]) => name), ['ROLE_HOLDER_<role>'])
    assert.ok(String(register.version).includes('Supersedes version 9, which adds a typed resolution to every team designation'), 'version 9 kept in the history (now version 10)')
    assert.match(String(block.resolutionNote), /OUR extension of AM-01/)
})

test('the index refuses a register whose designations are not all typed, or typed outside the closed lists (halt H1)', () => {
    const damaged = (mutate: (r: any) => void): string => {
        const copy = JSON.parse(JSON.stringify(register))
        mutate(copy)
        try {
            indexRegister(copy)
            return 'admitted'
        } catch (error) {
            assert.ok(error instanceof HaltError && error.halt === 'H1', String(error))
            return error.message
        }
    }
    assert.match(damaged(r => delete r.teamDesignations.resolutions.EACH_TEAM), /EACH_TEAM has no typed resolution/)
    assert.match(damaged(r => (r.teamDesignations.resolutions.EACH_TEAM.kind = 'SOMETIMES')), /outside the closed lists/)
    assert.match(damaged(r => (r.teamDesignations.resolutions.TEAM_NOBODY = { kind: 'ALL', scope: 'ACTIVITY', at: null, basis: 'GLOSS', from: 'x' })), /the designation list does not hold/)
    assert.match(damaged(r => (r.teamDesignations.resolutions.EACH_TEAM.basis = 'HIS')), /names no basis/)
    assert.match(damaged(r => r.teamDesignations.designationAttributes.push({ row: 'P1', attribute: 'colour' })), /not a selector attribute of P1/)
})

test('in a value, designations compare as canonical entries (RC-22): a glossed spelling and "(= ENTRY)" count as the entry; named teams by name', () => {
    assert.equal(designationEntry(index, START), START)
    assert.equal(designationEntry(index, `${START} (the team assigned at setup)`), START)
    assert.equal(designationEntry(index, 'a shared target (= EACH_TEAM)'), 'EACH_TEAM')
    assert.equal(designationEntry(index, 'TEAM_RED'), 'TEAM_<id>')
    // Not designations: a neutral group, prose, a number. They key as themselves, so a grouping by key is the old grouping.
    for (const value of ['NEUTRALS', 'neutral', 'EACH_TEAM: one shared target attacked by both teams', 3]) assert.equal(designationEntry(index, value), null, String(value))
    assert.equal(designationKey(index, 'NEUTRALS'), 'NEUTRALS')
    assert.equal(sameDesignation(index, START, `${START} (gloss)`), true)
    assert.equal(sameDesignation(index, 'TEAM_RED', 'TEAM_BLUE'), false, 'two named teams map to one entry and are not equal')
    assert.equal(sameDesignation(index, START, END), false)
    assert.equal(sameDesignation(index, START, 'NEUTRALS'), null, 'no answer where one value is no designation')
    assert.ok(isAllTeams(index, 'EACH_TEAM') && !isAllTeams(index, START))
    assert.ok(isRegisteredDesignation(index, 'SCORING_TEAM') && !isRegisteredDesignation(index, 'NEUTRALS'))
    // K2 review, 15 October 2026: MAPPING to an entry (comparison) is not BEING one (registration). The list entry a value
    // is, by its name or its whole text; a named team, another gloss and "(= ENTRY)" prose are not entries.
    const whole = (register.teamDesignations.list as string[]).find(entry => designationName(entry) === 'ATTACKING_TEAM')!
    assert.deepEqual([listedEntry(index, 'ATTACKING_TEAM'), listedEntry(index, whole)], ['ATTACKING_TEAM', 'ATTACKING_TEAM'])
    for (const value of ['TEAM_RED', `${START} (another gloss)`, 'the holders (= ATTACKING_TEAM)', 'NEUTRALS', 3]) assert.equal(listedEntry(index, value), null, String(value))
    assert.equal(followsPossessionRelation(index, 'the holders (= ATTACKING_TEAM)'), false, 'prose pointing at the entry follows nothing')
})

test('the possession relation is read from the gloss alone: our interpretation of an unglossed entry decides nothing in a gate', () => {
    assert.equal(followsPossessionRelation(index, 'ATTACKING_TEAM'), true, 'the gloss and his ruling of 2 October')
    assert.equal(followsPossessionRelation(index, 'DEFENDING_TEAM'), false, 'typed POSSESSION_RELATION by us, with no gloss: the answer GA-AFFILIATION always gave')
    assert.equal(followsPossessionRelation(index, START), false)
})

test('for a STANDING property a member meets the setup assignment bound to it and EACH_TEAM; a changing team is never reached, and says why', () => {
    const one = memberDesignations(index, 'P1', `${TEAMS}#1`, bindings)
    const two = memberDesignations(index, 'P1', `${TEAMS}#2`, bindings)
    assert.deepEqual(one.attributes, ['team'])
    assert.deepEqual([one.met.sort(), one.notMet], [['EACH_TEAM', START].sort(), [END]])
    assert.deepEqual([two.met.sort(), two.notMet], [['EACH_TEAM', END].sort(), [START]])
    const why = (d: string) => one.undetermined.find(entry => entry.designation === d)?.why ?? ''
    assert.match(why('ATTACKING_TEAM'), /dynamic-scoped/)
    assert.match(why('BUILD_OUT_TEAM'), /episode-scoped/)
    assert.match(why('SCORING_TEAM'), /trigger-scoped/)
    assert.match(why('STARTING_TEAM'), /START transition's award/)
    assert.match(why('TEAM_<id>'), /names a particular team/)
    // Without a recorded binding the setup assignment is undetermined: exactly the state before the resolver existed.
    const unbound = memberDesignations(index, 'P1', `${TEAMS}#1`, [])
    assert.ok(!unbound.met.includes(START) && !unbound.notMet.includes(START))
    assert.match(whyNotReached(unbound, [START]) ?? '', /realization has not recorded/)
})

test('reach.ts reads the resolver: TRUE for the bound team, FALSE for the other, UNDETERMINED for a changing team; a derived class is unchanged', () => {
    const member = (handle: string, withDesignations = true): ElementClass => ({
        classId: `realized:${handle}`,
        row: 'P1',
        fromItem: { contractId: 'restated:GF2', itemId: 'GF2-14.a' },
        supportedBy: [],
        constraints: { any: false, terms: [] },
        cardinality: { min: null, max: null },
        ...(withDesignations ? { designations: memberDesignations(index, 'P1', handle, bindings) } : {}),
    })
    const term = (value: string) => ({ any: false, terms: [{ attribute: 'team', op: '=' as const, value }] })
    assert.equal(reaches(term(START), member(`${TEAMS}#1`)), 'TRUE')
    assert.equal(reaches(term(START), member(`${TEAMS}#2`)), 'FALSE')
    assert.equal(reaches(term('EACH_TEAM'), member(`${TEAMS}#2`)), 'TRUE')
    assert.equal(reaches(term('ATTACKING_TEAM'), member(`${TEAMS}#1`)), 'UNDETERMINED')
    assert.equal(reaches(term('BUILD_OUT_TEAM'), member(`${TEAMS}#1`)), 'UNDETERMINED')
    assert.equal(reaches({ any: false, terms: [{ attribute: 'team', op: 'IN', values: [START, END] }] }, member(`${TEAMS}#2`)), 'TRUE')
    assert.equal(reaches(term(START), member(`${TEAMS}#1`, false)), 'UNDETERMINED', 'a class carrying no designations reads as it always did')
})

test('every consumer asks the resolver: no designation name, gloss substring or prefix test is written in one', () => {
    const source = (file: string) => fs.readFileSync(path.join(__dirname, file), 'utf8')
    const gates = source('gates.ts')
    assert.ok(!gates.includes("'EACH_TEAM'"), 'GA-DIRECTION reads the shared target as the resolution kind ALL')
    assert.ok(!gates.includes("includes('PS1')"), 'GA-AFFILIATION reads the possession relation from the resolver')
    assert.ok(!gates.includes('d.startsWith(`${designated} `)'), 'GA-REFERENCE-INTEGRITY asks the resolver whether a designation is registered')
    for (const [file, name] of [
        ['gates.ts', 'designationKey'],
        ['gates.ts', 'followsPossessionRelation'],
        // Re-pointed 15 October 2026 (K2 review): registration in the gates is asked by the list's own spelling, so a value
        // that only maps to an entry (a named team, "(= ENTRY)" prose) is not read as registered there.
        ['gates.ts', 'isListedDesignation'],
        ['../realization/post-realization-gate.ts', 'memberDesignations'],
        ['../realization/assemble-concrete-game.ts', 'memberDesignations'],
        ['../realization/realize.ts', 'resolutionOf'],
        // Stage K3, 15 October 2026 (his M1): the region attribute targetOf and the role blocks ask it too.
        ['target-of.ts', 'targetDesignations'],
        ['role-blocks.ts', 'designationKey'],
    ]) {
        assert.ok(source(file).includes(name), `${file} uses ${name}`)
    }
    assert.ok(source('reach.ts').includes('designations.met'), 'reach reads the member designations, and decides nothing itself')
    // No designation name is written in the resolver either: they are register data.
    const resolver = source('designation.ts')
    for (const entry of register.teamDesignations.list as string[]) assert.ok(!resolver.includes(`'${designationName(entry)}'`), `designation.ts names ${designationName(entry)}`)
})

test('key identity: the possession game form\'s binding reaches the realization record and the fixture unchanged, and no activity text', () => {
    const file = JSON.parse(fs.readFileSync(path.join(AUDITS_DIR, 'a04-realization-choices.json'), 'utf8'))
    assert.deepEqual(file.designationBindings.map((b: any) => [b.designation, b.handle]), [[START, `${TEAMS}#1`], [END, `${TEAMS}#2`]])
    for (const demonstrationId of ['scoring-modifier', 'neutral-players']) {
        const { activity, fixture } = buildActivityWithFixture({ kind: 'mechanism-demonstration', demonstrationId, session: sessionWith(12, 0) } as any)
        assert.equal(activity.outcome, 'served', demonstrationId)
        assert.deepEqual((fixture as any).record.designationBindings, file.designationBindings, `${demonstrationId}: whole, every key`)
        // Beside the game, never in it: no team carries a designation, and no coach sentence names a handle.
        for (const team of (fixture as any).game.performers.teams) assert.ok(!JSON.stringify(team).includes(START) && !JSON.stringify(team).includes(END), 'no team carries a designation')
        assert.ok(!JSON.stringify((activity as any).rendered).includes('#1'))
    }
})

test('realization checks each binding: a member of this game, a setup assignment, the ends held by different teams, both or neither', () => {
    const refusedWith = (mutate: (list: any[]) => any[]): string[] => {
        const built: any = buildActivityFromKnowledge(['GF2'], sessionWith(12, 0) as any, { alterSupplied: s => (s.designationBindings = mutate(s.designationBindings)) })
        assert.equal(built.activity.outcome, 'refused')
        assert.equal(built.activity.stage, 'realization')
        return built.activity.reasons
    }
    assert.ok(refusedWith(list => list.map(b => (b.designation === START ? { ...b, handle: `${TEAMS}#9` } : b))).some(r => r.includes(`${TEAMS}#9, which is not a member`)))
    assert.ok(refusedWith(list => list.map(b => ({ ...b, handle: `${TEAMS}#1` }))).some(r => r.includes('is bound to two setup assignments')))
    assert.ok(refusedWith(list => list.filter(b => b.designation === START)).some(r => r.includes('half a symmetric choice')))
    assert.ok(refusedWith(list => [...list, { designation: 'ATTACKING_TEAM', handle: `${TEAMS}#1`, because: 'TEST-ONLY' }]).some(r => r.includes('names no registered setup assignment')))
    assert.ok(refusedWith(list => list.map(b => ({ ...b, because: '' }))).some(r => r.includes('gives no reason')))
    // And none supplied is no binding recorded — the state every game was in before.
    const none: any = buildActivityFromKnowledge(['GF2'], sessionWith(12, 0) as any, { alterSupplied: s => (s.designationBindings = []) })
    assert.equal(none.activity.outcome, 'served')
    assert.equal(none.fixture.record.designationBindings, undefined)
})

test('the roster asks the resolver (TEST-ONLY item on a copy): a fact for one end\'s team reaches exactly the team bound to that end', () => {
    const withItem = (selector: string, players: number, keepers: number, swap = false): any =>
        buildActivityFromKnowledge(['GF2', 'tl-v0-constraint-wide-zone-advantage'], sessionWith(players, keepers) as any, {
            alter: contracts => {
                const form: any = contracts.find(c => c.contractId === 'restated:GF2')
                form.items.push({ itemId: 'TEST-ONLY-P3', origId: 'TEST-ONLY-P3', row: roleRow.id, selector, requirement: 'EQUALS', value: '1', strictness: 'REQUIRED', valueStatus: 'REQUIRED_RANGE', scope: 'PER_TEAM', basis: 'AUTHORED', basisEvidence: 'TEST-ONLY', checkability: 'STRUCTURAL', structuralClause: 'whole item' })
            },
            alterSupplied: swap ? s => (s.designationBindings = s.designationBindings.map(b => ({ ...b, handle: b.handle.endsWith('#1') ? `${TEAMS}#2` : `${TEAMS}#1` }))) : undefined,
        })
    const counts = (built: any) => built.fixture.game.performers.teams.map((t: any) => [t.elementId, t.outfieldCount, t[role]])
    // 13 players, one available: the team at the axis-start end has it, the other has none (the game form's non-claim).
    // Refused at communication only because no wording yet says unequal per-team counts (stage K4's renderer).
    const bound = withItem(`team=${START}`, 13, 1)
    assert.deepEqual(counts(bound), [[`${TEAMS}#1`, 6, 1], [`${TEAMS}#2`, 6, 0]])
    assert.equal(bound.activity.stage, 'communication')
    assert.deepEqual(counts(withItem(`team=${START}`, 13, 1, true)), [[`${TEAMS}#1`, 6, 0], [`${TEAMS}#2`, 6, 1]], 'the binding, not an ordinal, decides')
    // Both ends named: every team reached, so the same count for each, and the activity is served.
    const both = withItem(`team IN {${START}, ${END}}`, 12, 2)
    assert.equal(both.activity.outcome, 'served')
    assert.deepEqual(counts(both), [[`${TEAMS}#1`, 5, 1], [`${TEAMS}#2`, 5, 1]])
    // A changing team never yields a standing count: refused as before, now naming the scope.
    for (const [designation, scope] of [['BUILD_OUT_TEAM', 'episode-scoped'], ['ATTACKING_TEAM', 'dynamic-scoped']]) {
        const built = withItem(`team=${designation}`, 12, 2)
        assert.ok(built.activity.reasons.some((r: string) => r.includes('INVOLVEMENT_NOT_SETTLED') && r.includes(scope)), `${designation}: ${JSON.stringify(built.activity.reasons)}`)
    }
})

console.log(`designation-reach.unit.ts — ${passed} passed`)
