/**
 * **A region bound to an object, and the authorized pairings its geometry comes from** — H3, 23 October 2026 (the d26 design's build step 3,
 * its N1 to N5, with the IFAB regulation entry only; register version 21).
 *
 * Christian, reply filed 26 October 2026, item 7: "Use an existing regulation penalty area when the activity dimensions and setup permit it."
 * "When a smaller field is necessary, use an explicitly defined and knowledge-authorized scaled penalty area." "I would not approve an
 * undefined area that the coach simply points out, nor a feet-only goalkeeper restriction as the default for this realization." "Please
 * investigate the smallest reusable method for representing an authorized penalty area, including its geometry and relationship to the goal
 * and playing space. Do not assume a scaled dimension without knowledge support." "This should be a general soccer environment capability
 * rather than a Goalkeeper Build-Out exception."
 *
 * What is pinned here (the design's step 3 tests, and the gate's):
 *   1. the register (version 21): the function member, row S7 and the boundRegions block, and its loader refusing every defect;
 *   2. the Sport Profile's boundRegions block: his item 7 words, one requirement (a defended goal holds one penalty-area zone), exactly ONE
 *      pairing (IFAB Law 1.6 with Law 1.10), no scaled entry, the profile's items unchanged; and its loader refusing every defect;
 *   3. the default-laws loader, tightened (the H2 review's should-fix 1, and the token step 3 was to check);
 *   4. TEST-ONLY, a 45 m long area with a 42 m end line and a full-size 7.32 m goal: the regulation area is placed 40.32 x 16.5 m, centred,
 *      0.84 m clear each side, at the goal in both blocks under the end exchange; LAW-12-GK applies and LAW-14 is owed at the goal end (since R1,
 *      24 October 2026: departed from there by A01-R1-RP1-1, its mark still read); since stage L (24 October 2026) the build is served, the
 *      area said by its own DRAFT Set up sentence (until then it stopped at communication, the area's words being Stage G's); the review
 *      evidence shows the pairing whole;
 *   5. TEST-ONLY, the same goal at 40 x 30 m: BOUND_REGION_DOES_NOT_FIT, the zone version served as production serves it, the reason on the
 *      review page; without the region items, refused (a broken alternative is never hidden behind the next one);
 *   6. TEST-ONLY refusals: a defended goal with no bound region; a region bound to a non-goal object, off-centre, not touching the goal's
 *      end line, too shallow, or citing another pairing; a scaled goal no entry pairs (a knowledge gap, never a fallback); two entries pairing
 *      one goal (not decided);
 *   7. TEST-ONLY, the goal version completed with a TEST-ONLY scaled pairing and its region: every check passes in both blocks, and since
 *      stage L it is served (until then it stopped at communication);
 *   8. the H2 review's should-fix 2, 3 and 5 in the account (an object's end read by its anchor, an unreadable collection UNKNOWN, the law's
 *      note carried); and production unchanged.
 *
 *   9. (H4, register version 22; the d26 design's build step 4) a pairing recording a type matches only a goal the session states of that
 *      type: unstated, the build asks through the question channel (review page and live route), never assuming Law 1.10's goal; another
 *      type is a knowledge gap; a width no pairing has is a gap without the type being read or asked; the review page's answer reaches the
 *      check through the review route; the loader and the build's TEST-ONLY option refuse a type off the register's list. Carried from the H3
 *      review: an object anchored off both end lines reads absent from each; the bindings step's noun and two-regions cases measured.
 *
 * Nothing here changes a production file. TEST-ONLY copies are labelled and held in memory; no scaled size is knowledge.
 *
 * Run: npx ts-node --files -r tsconfig-paths/register ./src/system/realization/bound-regions.unit.ts
 */
import assert from 'node:assert/strict'

import { loadProvisionalRealizations, loadRegister, loadSportBoundRegions, loadSportDefaultLaws, loadSportProfile, PROVISIONAL_REALIZATIONS_FILE, readJson } from '../derivation/corpus'
import { boundRegionsRefusals, SportBoundRegions } from '../derivation/bound-regions'
import { defaultLawsRefusals } from '../derivation/default-laws'
import { HaltError, indexRegister } from '../derivation/register'
import { buildActivityForReview, buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { reviewRequestOf } from '../rendering/activity-review'
import { liveRefusalBody } from '../rendering/live-activity'
import { specializedRoleNames } from '../rendering/session-envelope'
import { learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { BOUND_REGION_CHECK, boundRegionRefusalBefore } from './bound-region-check'
import { blockLawAccountOf } from './default-laws-check'

let passed = 0
function test(name: string, body: () => void): void {
    body()
    passed++
    console.log(`  ok  ${name}`)
}
console.log('a region bound to an object (H3)')

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const register = loadRegister()
const index = indexRegister(register)
const KEEPER = specializedRoleNames()[0]
const none = Object.fromEntries(specializedRoleNames().map(role => [role, 0]))
const R2 = 'A01-R2'
const REGULATION_AREA: [number, number] = [45, 42]
const PROTOTYPE_AREA: [number, number] = [40, 30]
const FULL_SIZE = 7.32
/**
 * H4 (register version 22): a session states its goals' type beside their count and width. Here a 7.32 m goal is stated 'full-size' (Law
 * 1.10's goal, as a coach with one would state it) unless a test says otherwise; `null` states none. A goal of any other width states none
 * unless asked: no pairing of its width reads a type, so none is asked for.
 */
const sessionOf = (players: number, keepers: number, area: [number, number], goalWidth?: number, goalType?: string | null) => {
    const type = goalType === undefined ? (goalWidth === FULL_SIZE ? 'full-size' : null) : goalType
    return {
        players,
        lengthM: area[0],
        widthM: area[1],
        durationMin: 20,
        roles: { ...none, [KEEPER]: keepers },
        ...(goalWidth === undefined ? {} : { objects: { goal: { count: 1, widthM: goalWidth, ...(type === null ? {} : { type }) } } }),
    }
}
const ITEM_7_PAIRING = 'Use an existing regulation penalty area when the activity dimensions and setup permit it.'
/** His reply filed 26 October 2026, item 7: the words BOUND-REGION-GOAL's basis cited before K1, and still cites. */
const ITEM_7_HANDLING = "The goalkeeper's handling permissions and restrictions should follow the normal Laws of the Game within that area unless an authorized activity rule explicitly changes them."
const ITEM_7_REFUSED = 'I would not approve an undefined area that the coach simply points out, nor a feet-only goalkeeper restriction as the default for this realization.'
/** His reply filed 27 October 2026, item 1: the 1b principle he approved, and the sentence approving the goal and area for this activity. */
const ITEM_1B = 'a goal’s penalty-area geometry should ordinarily come from the same authorized format. Any exception should be explicit and supported by the intended learning design.'
const ITEM_1_APPROVAL = 'I agree with using an established small-sided goal and its corresponding penalty area as the starting configuration for the 40 × 30 m activity.'
const ITEM_1_VERIFY = 'Please verify the applicable FA specification and keep the goal, penalty area, and penalty spot dimensions from the same authorized source rather than combining unrelated formats.'
const ITEM_1_CANDIDATE = 'Let’s treat the proposed configuration as an initial field-test candidate rather than assuming it is optimal.'
/** BOUND-REGION-GOAL's because before K1 restated it (git show 22da115), recorded verbatim in the block's note. */
const REPLACED_BECAUSE = "OUR READING of his item 7 with item 10 (ours). A goal a team's goalkeeper defends (register row O7) has its penalty area: the normal Laws key the goalkeeper's handling on it, he refuses an undefined area the coach points out and a feet-only default, and he asks for a defined, knowledge-authorized area. So such a goal holds exactly one zone of the function penalty-area bound to it (register row S7), whose geometry is the one authorized pairing for that goal; where no pairing is authorized the activity is refused as a knowledge gap, and where the paired area does not fit the session's area the realization does not apply to that session. A goal no goalkeeper defends needs none here (whenDefended)."
const blocks = loadSportBoundRegions()!
const profileFile = (): any => readJson(blocks.file)

/** TEST-ONLY: the record lists the goal version as one that can be tried (its three open decisions completed in memory, nothing else). */
const records = () => {
    const all = learningGoalAuthorizations()
    const record = all.find(r => r.learningGoalId === 'A01') as any
    record.realizations = record.realizations.map((entry: any) => (entry.realization === R2 ? { realization: entry.realization, words: entry.words, citedAs: entry.citedAs } : entry))
    return all
}

interface RegionOptions {
    area?: [number, number]
    region?: false
    along?: unknown
    across?: unknown
    extentM?: number
    ofObject?: { contractId: string; itemId: string }
    pairing?: string
}

/**
 * TEST-ONLY realizations file: A01-R2 with a suitability admitting goals 1-10 m wide and a REPORT default-laws check (both TEST-ONLY stand-ins
 * for his decisions), its testing area moved where asked (withdrawing and restating A01-R1's pressure-reference distance for it, as a variant
 * stating another area must: H1), and the regulation area's items (the region, its two positions, its required width and its binding),
 * each changed where asked.
 */
const fileWith = (options: RegionOptions = {}) => {
    const file = readJson(PROVISIONAL_REALIZATIONS_FILE)
    const variant = file.realizations.find((r: any) => r.id === R2)
    // Re-pointed 24 October 2026 (K2): A01-R2 now records its goal's penalty area (A01-R2-S2-1 to S7-1, the production FA 5v5 pairing,
    // pinned in goal-version-penalty-area.unit.ts). This copy sets out its own TEST-ONLY area items below (or none, region: false), each
    // changed where asked, and a defended goal holds exactly one penalty-area zone (BOUND-REGION-GOAL), so the production five are left out
    // of the copy, in memory; everything else is as before.
    // Re-pointed 25 October 2026 (P2): and the item bounding the marked line relative to the penalty area (A01-R2-S5-2, his reply filed 28 October 2026, item 2), which names it.
    variant.items = variant.items.filter((i: any) => i.selector !== 'noun=zone & functions ∋ penalty-area' && i.value?.of?.structuralRef?.itemId !== 'A01-R2-S2-1')
    variant.objectSuitability = [{ kind: 'goal', widthM: { min: 1, max: 10 }, ruledOn: 'TEST-ONLY', by: 'TEST-ONLY', citedAs: 'TEST-ONLY', words: ['TEST-ONLY'] }]
    variant.defaultLawsCheck = { mode: 'REPORT', because: 'TEST-ONLY: D-DEFAULT-LAWS completed in memory', basis: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' } }
    const template = variant.items.find((i: any) => i.id === `${R2}-O5-1`)
    const item = (suffix: string, row: string, requirement: string, value: unknown, extra: Record<string, unknown> = {}) => ({
        ...template,
        id: `${R2}-TEST-${suffix}`,
        row,
        selector: 'noun=zone & functions ∋ penalty-area',
        requirement,
        value,
        valueStatus: requirement === 'EXISTS' ? 'N/A' : 'REQUIRED_RANGE',
        choice: 'TEST-ONLY',
        words: 'TEST-ONLY',
        citedAs: 'TEST-ONLY',
        basisEvidence: 'TEST-ONLY',
        fitNote: 'TEST-ONLY',
        ...extra,
    })
    if (options.area) {
        variant.testingBoundaries = { ...variant.testingBoundaries, areas: [{ lengthM: options.area[0], widthM: options.area[1] }] }
        const line = file.realizations.find((r: any) => r.id === 'A01-R1').items.find((i: any) => i.id === 'A01-R1-S5-1')
        variant.withdraws.push({ item: line.id, because: 'TEST-ONLY' })
        variant.items.push({ ...line, id: `${R2}-TEST-S5-LINE`, value: { ...line.value, offsetM: { from: options.area[0] / 2, to: options.area[0] / 2 } } })
    }
    if (options.region !== false) {
        const width = options.extentM ?? 40.32
        variant.items.push(
            item('S2', 'S2', 'EXISTS', 'N/A'),
            item('S5', 'S5', 'POSITIONED', options.along ?? { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 16.5 }, asAuthored: 'TEST-ONLY' }),
            item('S6', 'S6', 'POSITIONED', options.across ?? { term: 'central', asAuthored: 'TEST-ONLY' }),
            item('S6-W', 'S6', 'RANGE', `${width} m wide (TEST-ONLY)`, { typedBound: { min: width, max: width } }),
            item('S7', 'S7', 'EQUALS', { structuralRef: options.ofObject ?? { contractId: `provisional:${R2}`, itemId: `${R2}-O1-1` }, pairing: options.pairing ?? 'IFAB-LAW-1', asAuthored: 'TEST-ONLY' }),
        )
    }
    return file
}
const build = (players: number, keepers: number, area: [number, number], goalWidth: number, file: any, extra: { boundRegions?: SportBoundRegions | null; includeDrafts?: boolean; goalType?: string | null } = {}) =>
    buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, area, goalWidth, extra.goalType) } as any, records(), {
        realizations: loadProvisionalRealizations(file),
        review: { includeDrafts: extra.includeDrafts !== false },
        ...(extra.boundRegions !== undefined ? { boundRegions: extra.boundRegions } : {}),
    })
const selectionOf = (activity: ServedActivity | RefusedActivity) => (activity.account.realizationSelection ?? []).map(entry => [entry.realization, entry.outcome, entry.cause, entry.stage])
const boundRegionsOf = (fixture: any) => (fixture.roleBlocks.blocks as any[]).map(block => (block.fixture.game.space.regions as any[]).filter(region => region.ofObject))
const goalOf = (block: any) => (block.fixture.game.objects as any[]).find(object => object.kind === 'goal')

// ── 1. The register ──────────────────────────────────────────────────────────────────────────────────────
test('register version 21: the function member, row S7 and the boundRegions block, with their versions entry quoting his item 7', () => {
    assert.ok(index.vocabularies.get('S4.functions')!.includes('penalty-area'))
    assert.match(index.vocabularyVersions['S4.functions'], /^2 \(2026-10-23, register version 21, draft\) - adds penalty-area for his reply filed 26 October 2026, item 7/)
    const row = index.rows.get('S7')!
    assert.deepEqual([row.path, row.ownerRow, row.kind, row.sourceKinds], ['space.regions[].ofObject', 'S2', 'FIELD', ['SELECTION']])
    assert.ok(String(row.valueType).includes('OUR ENGINEERING (DRAFT)'))
    const spec = index.boundRegions!
    assert.deepEqual(
        [spec.row, spec.nounRow, spec.functionRow, spec.alongRow, spec.acrossRow, spec.ofObjectRow, spec.objectRow],
        ['S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'O1'],
    )
    assert.deepEqual([spec.path, spec.objectPath, spec.nounLeaf, spec.functionLeaf, spec.alongLeaf, spec.acrossLeaf, spec.ofObjectLeaf, spec.functionAttribute], ['space.regions[]', 'objects[]', 'noun', 'functions', 'position.along', 'position.across', 'ofObject', 'functions'])
    // Re-pointed 23 October 2026 (H4): version 22 (the type a session states for its objects, his reply filed 26 October 2026, item 4) supersedes 21.
    // Re-pointed 24 October 2026 (R1): version 23 (one restart for every dead ball, his reply filed 27 October 2026, item 4) supersedes 22.
    assert.ok(String(register.version).includes('Supersedes version 23, which adds one restart for every dead ball, for his reply filed 27 October 2026, item 4'), 'version 23 is kept, beneath version 24 (P1, 25 October 2026)')
    assert.ok(String(register.version).includes('Supersedes version 22, which adds the type a session states for its objects of a kind, for his reply filed 26 October 2026, item 4'))
    assert.ok(String(register.version).includes('Supersedes version 21, which adds a region bound to an object, for his reply filed 26 October 2026, item 7'))
    for (const quote of [ITEM_7_PAIRING, 'This should be a general soccer environment capability rather than a Goalkeeper Build-Out exception.']) assert.ok(String(register.version).split('Supersedes version 20, ')[0].includes(`"${quote}"`), quote)
    const damaged = (alter: (r: any) => void, pattern: RegExp, what: string) => {
        const r = copy(register)
        alter(r)
        assert.throws(() => indexRegister(r), (error: unknown) => error instanceof HaltError && pattern.test(error.message), what)
    }
    damaged(r => (r.boundRegions.row = 'O1'), /boundRegions\.nounRow S3 is not a FIELD row owned by O1/, 'the objects collection as the regions row')
    damaged(r => (r.boundRegions.ofObjectRow = 'O7'), /boundRegions\.ofObjectRow O7 is not a FIELD row owned by S2/, 'a binding row of another collection')
    damaged(r => (r.boundRegions.alongRow = 'S6'), /does not sit at a leaf ending "\.along"/, 'the across row as the along row')
    damaged(r => (r.boundRegions.objectRow = 'P1'), /boundRegions\.objectRow P1 is not the objects collection the object-geometry block names \(O1\)/, 'another collection as the objects')
    damaged(r => (r.boundRegions.functionRow = 'S7'), /S7 carries no selector attribute with a vocabulary/, 'a function row with no vocabulary')
    damaged(r => delete r.boundRegions.note, /boundRegions must say what it is and why/, 'no note')
    const without = copy(register)
    delete without.boundRegions
    assert.equal(indexRegister(without).boundRegions, null)
})

// ── 2. The Sport Profile ─────────────────────────────────────────────────────────────────────────────────
test("the profile's boundRegions block: one requirement, his explicit same-format principle, and the IFAB and FA 5v5 pairings (K1)", () => {
    assert.deepEqual([blocks.authority.citedAs, blocks.authority.by, blocks.authority.ruledOn], ['his reply filed 26 October 2026, item 7', 'Christian', '2026-10-26'])
    for (const quote of [ITEM_7_PAIRING, 'When a smaller field is necessary, use an explicitly defined and knowledge-authorized scaled penalty area.', 'I would not approve an undefined area that the coach simply points out, nor a feet-only goalkeeper restriction as the default for this realization.']) {
        assert.ok(blocks.authority.words.includes(quote), quote)
    }
    assert.deepEqual(
        blocks.requirements.map(r => [r.id, r.object.kind, r.object.whenDefended, r.region.noun, r.region.function, r.basis.citedAs]),
        // K1 replaces our reading with his explicit same-format principle in the later reply's item 1 (1b); re-pointed 24 October 2026 (K1
        // review): the basis keeps the item 7 words it cited before, beside the 1b words, so both replies are cited.
        [['BOUND-REGION-GOAL', 'goal', true, 'zone', 'penalty-area', 'his reply filed 27 October 2026, item 1; his reply filed 26 October 2026, item 7']],
    )
    // K1 review: only 'because' is restated (the d27 design's 1.6); the basis is never replaced, and the reading it replaced is recorded.
    const [requirement] = blocks.requirements
    assert.equal(requirement.because, ITEM_1B)
    assert.deepEqual(requirement.basis.words, [ITEM_1B, ITEM_7_HANDLING, ITEM_7_REFUSED])
    const note = profileFile().boundRegions.note as string
    const amended = note.indexOf('AMENDED 24 October 2026 (K1, from its review)')
    assert.ok(amended > note.indexOf('AMENDED 24 October 2026 (K1, the d27 design sections 1.1-1.7)'), 'a dated AMENDED line after the K1 amendment')
    assert.ok(note.slice(amended).includes(`The because it replaces read, verbatim: "${REPLACED_BECAUSE}"`), 'the replaced OUR READING kept verbatim')
    assert.deepEqual(blocks.pairings.map(p => p.id), ['IFAB-LAW-1', 'FA-MINI-SOCCER-5V5-2026'], 'K1 records exactly the regulation and FA 5v5 entries')
    const [ifab] = blocks.pairings
    assert.deepEqual(
        [ifab.document, ifab.edition, ifab.citedAs, ifab.object, ifab.region, ifab.markM, ifab.borrows, ifab.authority],
        ['IFAB Laws of the Game', null, 'Law 1.6 (The Penalty Area) and Law 1.10 (Goals)', { kind: 'goal', type: 'full-size', widthM: 7.32, heightM: 2.44 }, { function: 'penalty-area', widthM: 40.32, depthM: 16.5 }, 11, ['object', 'region', 'mark'], { words: [ITEM_7_PAIRING], citedAs: 'his reply filed 26 October 2026, item 7' }],
    )
    // Law 1.6: 16.5 m from the inside of each post, either side of a 7.32 m goal.
    assert.equal(ifab.region.widthM, 16.5 + 7.32 + 16.5)
    assert.deepEqual([ifab.formatConditions.players, ifab.formatConditions.ageBand], [null, null])
    assert.ok(String(ifab.formatConditions.pitch).startsWith('Law 1.3'))
    const raw = profileFile()
    assert.ok(raw.boundRegions.note.includes('BUILT WITH THE REGULATION ENTRY ONLY') && raw.boundRegions.note.includes('decision 1b of the note sent to him'))
    // A declaration, never items: the profile's contribution is what it was.
    assert.deepEqual(loadSportProfile()[0].items.map(item => item.itemId), ['SPORT-SOCCER-01', 'SPORT-SOCCER-02'])
    // The default laws now read the member the register holds.
    assert.ok(loadSportDefaultLaws()!.laws.find(law => law.id === 'LAW-12-GK')!.note!.includes('register version 21'))
})

// K1 review (24 October 2026): the production FA 5v5 entry pinned whole, as the IFAB entry is above, so drift in it cannot go unnoticed.
test('the FA 5v5 entry (K1, the d27 design section 1.6), whole: one document, its goal, its area and its mark, his item 1 words', () => {
    const fa = blocks.pairings.find(p => p.id === 'FA-MINI-SOCCER-5V5-2026')!
    const raw = profileFile().boundRegions.pairings.find((p: any) => p.id === 'FA-MINI-SOCCER-5V5-2026')
    // Re-pointed 25 October 2026 (P2): the entry marks its depth PROVISIONAL (his reply filed 28 October 2026, item 8), a field the loader now
    // accepts and validates; the entry is pinned whole below without it, and the provisional figure whole in geometry-compatibility.unit.ts.
    assert.deepEqual(Object.keys(raw), ['id', 'document', 'edition', 'citedAs', 'formatConditions', 'object', 'region', 'markM', 'borrows', 'authority', 'provisional', 'note'], 'no field beyond the type the loader accepts')
    const { note, provisional, ...rest } = raw
    assert.deepEqual([provisional.map((entry: any) => [entry.leaf, entry.status, entry.value]), fa.provisional], [[['region.depthM', 'PROVISIONAL', 9]], provisional], 'the depth alone is provisional, and the loader carries it as recorded')
    assert.deepEqual(rest, {
        id: 'FA-MINI-SOCCER-5V5-2026',
        document: 'The Mini-Soccer and Youth Futsal Handbook (England Football / The FA)',
        edition: 'Version updated August 2026 (2026/2027 season)',
        citedAs: 'Mini-Soccer Law 1, Playing Area: goal size in the text; the 5v5 area and mark as labelled on the Law 1 diagram; https://cdn.englandfootball.com/-/media/EnglandFootball/Files/play-and-participate/youth-football/Mini-Soccer-Handbook-2026-27.pdf',
        formatConditions: {
            players: '5v5: the maximum number of players is 5, subject to the power-play rules (Law 3, U8s-U9s)',
            ageBand: 'U8/U9 (Law 1)',
            pitch: '37 m x 27 m (Law 1 diagram; a maximum, p.16)',
        },
        // 12 ft x 6 ft at exactly 0.3048 m per foot, never The FA's rounded 3.66 x 1.83 m.
        object: { kind: 'goal', type: 'scaled', widthM: 3.6576, heightM: 1.8288 },
        region: { function: 'penalty-area', widthM: 15, depthM: 9 },
        markM: 6,
        borrows: ['object', 'region', 'mark'],
        authority: { words: [ITEM_1_APPROVAL, ITEM_1_VERIFY, ITEM_1_CANDIDATE, ITEM_1B], citedAs: 'his reply filed 27 October 2026, item 1' },
    })
    assert.deepEqual([fa.object, fa.region, fa.markM], [rest.object, rest.region, rest.markM], 'the loader carries the entry as the file records it')
    // The note's key facts, self-contained: the feet, the conversion, the rounding not used, the printed depth and what the earlier documents
    // gave, the naming read, the type read, what does not come with it, where it is used, and his item 3 on the mark.
    for (const fact of [
        '(12ft x 6ft)',
        'exact conversion at 0.3048 m per foot',
        'rounds to 3.66 x 1.83 m, not used',
        'The depth is printed 9 m and may be a misprint: the 2025 edition gave 9 yd (= 8.2296 m) and The FA\'s 2012 metric guide 8 m; we use 9 m as printed.',
        "'penalty area' and 'mark' are our reading from Laws 8, 12 and 14 of the same handbook",
        "type 'scaled' is our reading of the Goalkeeper Included Condition's 'full-size or scaled goals'",
        'Its other provisions (retreat line, pass or dribble-in, distances, heading law) do not come with it.',
        'Used at 40 x 30 m, larger than its pitch, chosen by space per player.',
        'his reply filed 27 October 2026, item 3: "The penalty-area specification may include a penalty spot, but this activity does not need to mark or use it."',
    ]) assert.ok(note.includes(fact), fact)
    assert.ok(!note.includes('1.3 (a)') && !/\(\d\.\d/.test(note), 'no pointer to a design document outside the repository')
    // One entry for a 12 ft goal: the 7v7 entry of the same handbook (the same goal with a 16 x 9 m box) is not recorded.
    assert.equal(blocks.pairings.filter(p => p.object.kind === fa.object.kind && p.object.widthM === fa.object.widthM).length, 1)
})

test('the loader refuses the block whole on any defect', () => {
    const raw = profileFile()
    assert.deepEqual(boundRegionsRefusals(raw.boundRegions, index), [])
    const refused = (alter: (block: any) => void, pattern: RegExp, what: string) => {
        const damaged = copy(raw)
        alter(damaged.boundRegions)
        const errors = boundRegionsRefusals(damaged.boundRegions, index)
        assert.ok(errors.some(error => pattern.test(error)), `${what}: ${errors.join(' | ')}`)
        assert.throws(() => loadSportBoundRegions(() => damaged, index), /bound-region block is refused/, what)
    }
    refused(b => (b.appliesTo = 'TEST-ONLY'), /carries "appliesTo"/, 'an unknown key')
    refused(b => b.pairings.push(copy(b.pairings[0])), /pairing IFAB-LAW-1 is listed twice/, 'a pairing twice')
    refused(b => b.requirements.push({ ...copy(b.requirements[0]), id: 'TEST-ONLY' }), /binds the function penalty-area to the kind goal a second time/, 'a requirement twice')
    refused(b => (b.pairings[0].region.function = 'TEST-ONLY'), /no member of S4's vocabulary/, 'a function outside the vocabulary')
    refused(b => (b.requirements[0].region.noun = 'TEST-ONLY'), /no member of S3's vocabulary/, 'a noun outside the vocabulary')
    refused(b => (b.pairings[0].object.kind = 'TEST-ONLY'), /no member of the register's object-kind vocabulary/, 'an object kind outside the vocabulary')
    refused(b => (b.requirements[0].object.kind = 'gate'), /which no session states its availability of/, 'a kind no session states')
    refused(b => (b.requirements[0].object.whenDefended = false), /whenDefended true/, 'a requirement not keyed on defence')
    refused(b => (b.pairings[0].borrows = ['object', 'region']), /must borrow exactly its geometry \(object, region, mark\)/, 'the mark not borrowed')
    refused(b => b.pairings[0].borrows.push('rules'), /nothing else/, 'something beyond the geometry borrowed')
    refused(b => delete b.pairings[0].formatConditions.ageBand, /must state its format conditions/, 'a format condition missing')
    refused(b => (b.pairings[0].region.depthM = 0), /width and depth in metres/, 'no depth')
    refused(b => (b.pairings[0].authority.words = []), /quotes none of his words/, 'a pairing without his words')
    refused(b => (b.authority.citedAs = ''), /must quote his words and say where/, 'the block without where he said it')
    refused(b => (b.requirements[0].region.function = 'access'), /which no requirement binds, so nothing would read it/, 'a pairing no requirement reads')
    refused(b => (b.pairings = null), /lists its pairings as something other than a list/, 'no pairings list')
})

// ── 3. The default-laws loader, tightened ────────────────────────────────────────────────────────────────
test('the default-laws loader refuses what nothing represents as a condition of applying, and a function the register does not list', () => {
    const raw = readJson(loadSportDefaultLaws()!.file)
    assert.deepEqual(defaultLawsRefusals(raw.defaultLaws, index), [])
    const refusals = (alter: (laws: any[]) => void) => {
        const damaged = copy(raw.defaultLaws)
        alter(damaged.laws)
        return defaultLawsRefusals(damaged, index)
    }
    // Re-pointed 24 October 2026 (R1): the laws are found by id, since R1 listed LAW-8-DB, LAW-13 and LAW-15 among them (the positions moved).
    const law = (laws: any[], id: string) => laws.find(entry => entry.id === id)
    // The H2 review's should-fix 1: LAW-11's condition moved to applicableWhen would make it not applicable everywhere - a silent pass.
    const silent = refusals(laws => {
        law(laws, 'LAW-11').applicableWhen = law(laws, 'LAW-11').requires
        law(laws, 'LAW-11').requires = []
    })
    assert.ok(silent.some(error => error.includes('default law LAW-11: applicableWhen 1 rests on what the representation does not hold (UNREPRESENTED)')), silent.join(' | '))
    // Step 3 makes the bound-region predicates readable, so they may be a law's condition of applying.
    assert.deepEqual(refusals(laws => (law(laws, 'LAW-14').applicableWhen = [...law(laws, 'LAW-14').applicableWhen, law(laws, 'LAW-14').requires[0]])), [])
    // The function token is the register's: one outside its list is refused, as is any without the register's bound-region rows.
    assert.ok(refusals(laws => (law(laws, 'LAW-12-GK').requires[0].function = 'TEST-ONLY')).some(error => error.includes('names the region function "TEST-ONLY", which is no member of S4\'s vocabulary')))
    const withoutRows = copy(register)
    delete withoutRows.boundRegions
    assert.ok(defaultLawsRefusals(raw.defaultLaws, indexRegister(withoutRows)).some(error => error.includes('the register names no bound-region rows')))
})

// ── 4. The regulation area, TEST-ONLY ────────────────────────────────────────────────────────────────────
const regulation = new Map<string, { activity: ServedActivity; fixture: any }>()
const regulationBuild = (players: number, keepers: number) => {
    const key = `${players}/${keepers}`
    if (!regulation.has(key)) {
        const built = build(players, keepers, REGULATION_AREA, FULL_SIZE, fileWith({ area: REGULATION_AREA }))
        regulation.set(key, { activity: built.activity as ServedActivity, fixture: built.fixture })
    }
    return regulation.get(key)!
}

test('TEST-ONLY 45 x 42 m, a full-size 7.32 m goal: the regulation area is placed 40.32 x 16.5 m, centred, 0.84 m clear each side, at the goal in both blocks', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const { activity, fixture } = regulationBuild(players, keepers)
        // Every check before, at and after realization and across the blocks passed. Re-pointed 24 October 2026 (stage L, the d27 design's
        // stage L): the area has words now, so the activity is served (bound-region-communication.unit.ts pins what is said). Was: refused at
        // communication, its words being Stage G's.
        assert.equal(activity.outcome, 'served', `${label}: ${JSON.stringify((activity as unknown as RefusedActivity).reasons?.slice(0, 3) ?? null)}`)
        const regions = boundRegionsOf(fixture)
        assert.equal(regions.length, 2, label)
        for (const [at, [region]] of regions.entries()) {
            assert.equal(regions[at].length, 1, `${label}: one bound region in block ${at + 1}`)
            const along = region.realizedGeometry.position.along.interval
            const across = region.realizedGeometry.position.across.interval
            assert.deepEqual([along, across], [{ from: 0, to: 16.5 }, { from: 0.84, to: 41.16 }], `${label} block ${at + 1}`)
            assert.ok(Math.abs(across.from - (42 - across.to)) < 1e-9, 'the same clearance each side')
            // Bound to the goal, which stands on the building team's end line and is defended by the team holding the goalkeeper.
            const goal = goalOf(fixture.roleBlocks.blocks[at])
            assert.equal(region.ofObject.structuralRef.itemId, `${R2}-O1-1`)
            assert.equal(goal.elementId, `c:provisional:${R2}:${R2}-O1-1`)
            assert.deepEqual([goal.realizedGeometry.position.along.interval, goal.realizedGeometry.position.across.interval, goal.defendedBy], [{ from: 0, to: 0 }, { from: 17.34, to: 24.66 }, 'P3'])
            assert.deepEqual([region.noun, region.ofObject.pairing], ['zone', 'IFAB-LAW-1'])
        }
        // The area stays at the goal under the end exchange: the ends change, the area and the goal do not.
        const ends = (fixture.roleBlocks.blocks as any[]).map(block => block.fixture.record.roleBlock.ends ?? null)
        assert.deepEqual(ends[1], { TEAM_AT_AXIS_START: 'TEAM_AT_AXIS_END', TEAM_AT_AXIS_END: 'TEAM_AT_AXIS_START' }, label)
        assert.deepEqual(regions[0][0].realizedGeometry.position, regions[1][0].realizedGeometry.position, `${label}: one place in both blocks`)
    }
})

test('the regulation area is evaluated by the default laws: LAW-12-GK applies, LAW-14 is departed from at the goal end (its mark still read), not applicable at the other', () => {
    const { activity } = regulationBuild(12, 1)
    const account = activity.evidence!.defaultLaws!
    for (const block of account.blocks) {
        const at = (law: string, end: 0 | 1 | null) => block.laws.find(entry => entry.law === law && entry.end === end)!
        const handling = at('LAW-12-GK', null)
        assert.equal(handling.status, 'APPLIES')
        assert.deepEqual(handling.preconditions.map(p => [p.predicate.predicate, p.reading]), [['SPECIALIZED_PERFORMER_PRESENT', 'PRESENT'], ['REGION_BOUND_TO_OBJECT', 'PRESENT']])
        const penalty = at('LAW-14', 0)
        // Re-pointed 24 October 2026 (R1): was ADAPTATION_OWED. A01-R1-RP1-1 (inherited) departs from the whole of LAW-14 by his reply filed
        // 27 October 2026, item 4: "There should be no separate corners, goal kicks, throw-ins, free kicks, or penalty kicks for this
        // activity." Its preconditions are still read, the mark still ABSENT.
        assert.equal(penalty.status, 'DEPARTED')
        assert.deepEqual(penalty.departedBy.map(found => found.item), ['A01-R1-RP1-1'])
        assert.deepEqual(penalty.preconditions.map(p => [p.predicate.predicate, p.reading]), [['OBJECT_OF_KIND_AT_END', 'PRESENT'], ['REGION_BOUND_TO_OBJECT', 'PRESENT'], ['BOUND_REGION_MARK', 'ABSENT']])
        assert.ok(penalty.preconditions[2].why.includes('pairing IFAB-LAW-1 gives a mark at 11 m') && penalty.preconditions[2].why.includes('no row records the spot'), penalty.preconditions[2].why)
        assert.equal(at('LAW-14', 1).status, 'NOT_APPLICABLE')
        // The H2 review's should-fix 5: each entry carries the profile's note, so what settles an owed law is said beside it.
        // R1: the note is AMENDED (his item 3 answers it for the build-out activity), its first sentence kept.
        assert.ok(penalty.note.startsWith('Decision 3 of the note sent to him (penalty kicks) answers it at an end where a goal stands. AMENDED 24 October 2026 (R1)'), penalty.note)
    }
})

/**
 * Re-pointed 24 October 2026 (stage L, the d27 design's stage L(b)): the area is said by its own DRAFT Set up sentence now, with the regulation
 * pairing's figures, citing its binding; never as a strip along the touchline. Was: it stopped at communication with the area said by
 * nothing (its words were Stage G's), Q3 naming its binding and Q5 its missing marking instruction.
 */
test('the area is said once in Set up with the regulation figures (stage L), never told as a strip along the touchline', () => {
    const { activity } = regulationBuild(12, 1)
    const region = `c:provisional:${R2}:${R2}-TEST-S2`
    const texts = activity.rendered.instructions.map(instruction => instruction.text)
    const said = activity.rendered.instructions.filter(instruction => instruction.from.includes(`space.regions[${region}].noun`))
    assert.deepEqual(said.map(instruction => [instruction.section, instruction.text]), [['Set up', "Mark the goal's penalty area: 40.32 m wide, centred on the goal, and 16.5 m deep into the area; inside it the goalkeeper can handle the ball as in a normal game"]])
    assert.ok(said[0].from.includes(`space.regions[${region}].ofObject`), 'its binding is carried')
    assert.ok(!texts.some(text => /along the touchline/.test(text)), texts.join(' | '))
})

test("the review evidence shows each bound region with its pairing whole: document, citation, format conditions, the object's type and size, the mark", () => {
    const { activity } = regulationBuild(12, 1)
    const evidence = activity.evidence!.boundRegions!
    assert.deepEqual([evidence.status, evidence.check, evidence.source.file, evidence.requirements.map(r => r.id)], ['ACCOUNT_FOR_REVIEW', BOUND_REGION_CHECK, 'stage-b/sport-profile-soccer.json', ['BOUND-REGION-GOAL']])
    assert.equal(evidence.blocks.length, 2)
    for (const block of evidence.blocks) {
        assert.equal(block.bindings.length, 1)
        const [binding] = block.bindings
        assert.deepEqual([binding.noun, binding.functions, binding.kind, binding.defendedBy, binding.along, binding.across], ['zone', ['penalty-area'], 'goal', 'P3', { from: 0, to: 16.5 }, { from: 0.84, to: 41.16 }])
        assert.deepEqual(binding.pairing, blocks.pairings[0], 'the pairing as the profile holds it, whole')
    }
    // A coach's answer carries no evidence.
    const coach = build(12, 1, REGULATION_AREA, FULL_SIZE, fileWith({ area: REGULATION_AREA }), { includeDrafts: false }).activity as ServedActivity
    assert.equal(coach.evidence, undefined)
})

// ── 5. Does not fit: the next alternative ────────────────────────────────────────────────────────────────
test('TEST-ONLY 40 x 30 m with that goal admitted: BOUND_REGION_DOES_NOT_FIT, and the zone version is served exactly as production serves it', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const fallback = build(players, keepers, PROTOTYPE_AREA, FULL_SIZE, fileWith()).activity as ServedActivity
        assert.equal(fallback.outcome, 'served', label)
        assert.deepEqual(selectionOf(fallback), [[R2, 'NOT_APPLICABLE', 'BOUND_REGION_DOES_NOT_FIT', 'session'], ['A01-R1', 'SELECTED', null, null]], label)
        // The reason the review page shows beside the version not built: the entry's summary, DRAFT words from the profile's data and the session.
        const entry = fallback.account.realizationSelection!.find(e => e.realization === R2)!
        assert.equal(entry.summary, 'The penalty area that goes with a goal 7.32 m wide does not fit in a 40 x 30 m area.')
        const fact = fallback.evidence!.pathway.facts.find(f => f.what.includes('account.realizationSelection'))!
        assert.ok((fact.value as string[]).includes(`${R2}: NOT_APPLICABLE (BOUND_REGION_DOES_NOT_FIT) at session: ${entry.summary}; its place in the order: ${entry.citedAs}`), JSON.stringify(fact.value))
        assert.equal(fallback.evidence!.boundRegions, undefined, 'the zone version holds no bound region')
        // What a coach reads is the zone version production serves for the same session.
        const coach = build(players, keepers, PROTOTYPE_AREA, FULL_SIZE, fileWith(), { includeDrafts: false }).activity as ServedActivity
        const production = buildActivityForReview({ kind: 'learning-goal', goalId: 'A01', situationId: null, session: sessionOf(players, keepers, PROTOTYPE_AREA, FULL_SIZE) } as any, { includeDrafts: false }) as ServedActivity
        for (const key of ['rendered', 'overview', 'diagram', 'roleBlocks', 'integrity'] as const) assert.deepEqual(coach[key], production[key], `${label}: ${key}`)
    }
})

test('without its region items the same alternative is refused, never passed over: a broken alternative is not hidden behind the next one', () => {
    const refused = build(12, 1, PROTOTYPE_AREA, FULL_SIZE, fileWith({ region: false })).activity as RefusedActivity
    assert.deepEqual([refused.outcome, refused.stage, refused.summary], ['refused', 'structure', 'The game this goal selects is not yet described completely enough to be set up.'])
    assert.deepEqual(selectionOf(refused), [[R2, 'REFUSED', null, 'structure'], ['A01-R1', 'NOT_TRIED', null, null]])
})

// ── 6. Refusals ──────────────────────────────────────────────────────────────────────────────────────────
const refusedWith = (options: RegionOptions, goalWidth = FULL_SIZE, extra: { boundRegions?: SportBoundRegions | null } = {}) =>
    build(12, 1, options.area ?? REGULATION_AREA, goalWidth, fileWith({ area: REGULATION_AREA, ...options }), extra).activity as RefusedActivity

test('a defended goal with no bound region is refused at structure, in both blocks, with nothing behind it tried', () => {
    const refused = refusedWith({ region: false })
    assert.deepEqual([refused.outcome, refused.stage], ['refused', 'structure'])
    const said = refused.reasons.filter(reason => reason.includes(`${BOUND_REGION_CHECK}: c:provisional:${R2}:${R2}-O1-1 is a defended goal, which the Sport Profile (BOUND-REGION-GOAL) needs exactly one zone of the function penalty-area bound to, and the game binds 0`))
    assert.equal(said.length, 2, refused.reasons.join(' | '))
    assert.deepEqual(selectionOf(refused), [[R2, 'REFUSED', null, 'structure'], ['A01-R1', 'NOT_TRIED', null, null]])
})

test('a region bound to a non-goal object, off-centre, not touching the goal\'s end line, too shallow, or citing another pairing is refused, named', () => {
    // Bound to the ball: the goal then binds none, and the region binds an object of a kind the profile does not bind the function to.
    const ball = refusedWith({ ofObject: { contractId: 'sport-profile:soccer', itemId: 'SPORT-SOCCER-01' } })
    assert.deepEqual([ball.outcome, ball.stage], ['refused', 'structure'])
    assert.ok(ball.reasons.some(reason => reason.includes(`serves penalty-area and is bound to c:sport-profile:soccer:SPORT-SOCCER-01, an object of the kind ball; the Sport Profile binds penalty-area only to goal`)), ball.reasons.join(' | '))
    assert.ok(ball.reasons.some(reason => reason.includes('and the game binds 0')))
    // Not touching the end line the goal stands on (from 1 m): refused before realization.
    const off = refusedWith({ along: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 1, to: 17.5 }, asAuthored: 'TEST-ONLY' } })
    assert.deepEqual([off.outcome, off.stage], ['refused', 'structure'])
    assert.ok(off.reasons.some(reason => reason.includes(`is not set out from the end line c:provisional:${R2}:${R2}-O1-1 stands on`)), off.reasons.join(' | '))
    // At the other end line (the pressing team's own end): refused before realization likewise.
    const other = refusedWith({ along: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_PRESSING', offsetM: { from: 0, to: 16.5 }, asAuthored: 'TEST-ONLY' } })
    assert.deepEqual([other.outcome, other.stage], ['refused', 'structure'])
    // Too shallow for its pairing (16 m): realized, and refused after realization.
    const shallow = refusedWith({ along: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 16 }, asAuthored: 'TEST-ONLY' } })
    assert.deepEqual([shallow.outcome, shallow.stage], ['refused', 'validation'])
    assert.ok(shallow.reasons.some(reason => reason.includes('IFAB-LAW-1 sets it out from the end line') && reason.includes('16.5 m into the area (0-16.5 m)')), shallow.reasons.join(' | '))
    // Off-centre (along a touchline): realized, and refused after realization - not centred on the goal.
    const offCentre = refusedWith({ across: 'touchline-adjacent' })
    assert.deepEqual([offCentre.outcome, offCentre.stage], ['refused', 'validation'])
    assert.ok(offCentre.reasons.some(reason => reason.includes('the region is not centred on the object')), offCentre.reasons.join(' | '))
    // Citing a pairing the profile does not authorize for the goal as the session states it.
    const cited = refusedWith({ pairing: 'TEST-ONLY' })
    assert.deepEqual([cited.outcome, cited.stage], ['refused', 'structure'])
    assert.ok(cited.reasons.some(reason => reason.includes('cites the pairing "TEST-ONLY", and the one authorized pairing for')), cited.reasons.join(' | '))
    // None of these falls back to the zone version.
    for (const activity of [ball, off, other, shallow, offCentre, cited]) assert.deepEqual(selectionOf(activity)[1], ['A01-R1', 'NOT_TRIED', null, null])
})

test('a region bound to a goal no team defends is held to the same pairing: an area of a size nobody authorized is refused however it got there', () => {
    // TEST-ONLY: the defended-by item taken out, so the goal claims no defence and needs no region; the region it still holds is checked.
    const undefended = (goalWidth: number, area: [number, number]) => {
        const file = fileWith(area === REGULATION_AREA ? { area } : {})
        const variant = file.realizations.find((r: any) => r.id === R2)
        variant.items = variant.items.filter((i: any) => i.row !== 'O7')
        return build(12, 1, area, goalWidth, file).activity as RefusedActivity
    }
    const gap = undefended(5, PROTOTYPE_AREA)
    assert.deepEqual([gap.outcome, gap.stage], ['refused', 'knowledge'])
    assert.ok(gap.reasons.some(reason => reason.includes(`c:provisional:${R2}:${R2}-O1-1 is a goal no team defends, holding a penalty-area region, 5 m wide as the session states it, and no authorized pairing`)), gap.reasons.join(' | '))
    // Where its pairing is authorized it is held to it as a defended one is: at 45 x 42 m with a full-size goal it passes the check.
    const authorized = undefended(FULL_SIZE, REGULATION_AREA)
    // Re-pointed 24 October 2026 (stage L): it may now be served (the area has words), so a missing list of reasons is no reason against it.
    assert.ok(!(authorized.reasons ?? []).some(reason => reason.includes(BOUND_REGION_CHECK)), (authorized.reasons ?? []).slice(0, 3).join(' | '))
})

test('a scaled goal no authorized entry pairs is a knowledge gap: refused, never another entry\'s area, never a fallback; two entries pairing it are undecided', () => {
    // The goal version completed in memory with a 5 m goal at 40 x 30 m, as the Stage F/G completion was, with the profile's block in force.
    const gap = build(12, 1, PROTOTYPE_AREA, 5, fileWith({ region: false })).activity as RefusedActivity
    assert.deepEqual([gap.outcome, gap.stage, gap.summary], ['refused', 'knowledge', 'The penalty area that goes with a goal 5 m wide has not been decided yet.'])
    assert.ok(gap.reasons.some(reason => reason.includes('BOUND_REGION_NOT_AUTHORIZED') && reason.includes('no authorized pairing of the Sport Profile gives a penalty-area region for it (its pairings for the kind: IFAB-LAW-1 for a goal 7.32 m wide')), gap.reasons.join(' | '))
    assert.deepEqual(selectionOf(gap), [[R2, 'REFUSED', null, 'knowledge'], ['A01-R1', 'NOT_TRIED', null, null]])
    // On a field wide enough for the regulation area the same goal is still a gap: the regulation area is not borrowed (decision 1b is his).
    assert.equal((build(12, 1, REGULATION_AREA, 5, fileWith({ area: REGULATION_AREA })).activity as RefusedActivity).stage, 'knowledge')
    // TEST-ONLY: two entries pairing one goal - which applies is not decided, so refused as a gap too.
    const twice = copy(blocks)
    twice.pairings.push({ ...copy(twice.pairings[0]), id: 'TEST-ONLY-SECOND', document: 'TEST-ONLY' })
    const undecided = build(12, 1, REGULATION_AREA, FULL_SIZE, fileWith({ area: REGULATION_AREA }), { boundRegions: twice }).activity as RefusedActivity
    assert.deepEqual([undecided.outcome, undecided.stage], ['refused', 'knowledge'])
    assert.ok(undecided.reasons.some(reason => reason.includes('2 authorized pairings give a penalty-area region for it (IFAB-LAW-1, TEST-ONLY-SECOND); which applies is not decided')), undecided.reasons.join(' | '))
})

// ── 7. The goal version completed with a TEST-ONLY scaled pairing ─────────────────────────────────────────
/** TEST-ONLY: the profile's block with one TEST-ONLY pairing for a 5 m goal - a stand-in for decision 1, never knowledge. */
const withTestOnlyPairing = (): SportBoundRegions => {
    const block = copy(blocks)
    block.pairings.push({
        id: 'TEST-ONLY-SCALED',
        document: 'TEST-ONLY',
        edition: null,
        citedAs: 'TEST-ONLY',
        formatConditions: { players: null, ageBand: null, pitch: null },
        // H4: a type of the register's list (the validator holds a TEST-ONLY block to it now, as the profile's): 'scaled', stated by the session.
        object: { kind: 'goal', type: 'scaled', widthM: 5, heightM: null },
        region: { function: 'penalty-area', widthM: 14, depthM: 7 },
        markM: null,
        borrows: ['object', 'region'],
        authority: { words: ['TEST-ONLY'], citedAs: 'TEST-ONLY' },
        note: 'TEST-ONLY',
    })
    return block
}

// Re-pointed 24 October 2026 (stage L): served now, the area said from the TEST-ONLY pairing's figures. Was: it stopped at communication.
test('TEST-ONLY: the goal version completed with a scaled pairing and its region passes every check in both blocks and is served (stage L)', () => {
    const file = fileWith({ along: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 7 }, asAuthored: 'TEST-ONLY' }, extentM: 14, pairing: 'TEST-ONLY-SCALED' })
    // The TEST-ONLY pairing passes the same validator a real one would.
    const asFile = { ...profileFile(), boundRegions: (() => {
        const raw = profileFile().boundRegions
        raw.pairings.push(copy(withTestOnlyPairing().pairings.find(p => p.id === "TEST-ONLY-SCALED")!))
        return raw
    })() }
    assert.deepEqual(boundRegionsRefusals(asFile.boundRegions, index), [])
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const built = build(players, keepers, PROTOTYPE_AREA, 5, file, { boundRegions: withTestOnlyPairing(), goalType: 'scaled' })
        const activity = built.activity as ServedActivity
        assert.equal(activity.outcome, 'served', `${label}: ${JSON.stringify((activity as unknown as RefusedActivity).reasons?.slice(0, 3) ?? null)}`)
        assert.ok(activity.rendered.instructions.some(instruction => instruction.text.startsWith("Mark the goal's penalty area: 14 m wide, centred on the goal, and 7 m deep into the area")), label)
        for (const [region] of boundRegionsOf(built.fixture)) {
            assert.deepEqual([region.realizedGeometry.position.along.interval, region.realizedGeometry.position.across.interval], [{ from: 0, to: 7 }, { from: 8, to: 22 }], label)
        }
        const account = activity.evidence!.defaultLaws!
        assert.equal(account.blocks[0].laws.find(entry => entry.law === 'LAW-12-GK')!.status, 'APPLIES', label)
        const penalty = account.blocks[0].laws.find(entry => entry.law === 'LAW-14' && entry.end === 0)!
        // Re-pointed 24 October 2026 (R1): DEPARTED by A01-R1-RP1-1 (his reply filed 27 October 2026, item 4); the mark still read. Was: ADAPTATION_OWED.
        assert.ok(penalty.status === 'DEPARTED' && penalty.preconditions[2].why.includes('pairing TEST-ONLY-SCALED gives no mark'), penalty.preconditions[2].why)
    }
})

// ── 8. The account's readings, and production ────────────────────────────────────────────────────────────
test("the account reads an object's end by its anchor, and a collection it cannot read is UNKNOWN, never absent (the H2 review's should-fix 2 and 3)", () => {
    const { fixture } = regulationBuild(12, 1)
    const block = fixture.roleBlocks.blocks[0]
    const laws = loadSportDefaultLaws()!
    const lawsWith = (id: string) => ({ ...copy(laws), laws: [laws.laws.find(law => law.id === id)!] })
    const r2 = loadProvisionalRealizations().find(r => r.provisionalId === R2)!
    const accountWith = (game: unknown, id: string) => blockLawAccountOf({ blockId: block.blockId, game, roleBlock: block.fixture.record.roleBlock, index, session: sessionOf(12, 1, REGULATION_AREA), laws: lawsWith(id), items: r2.items, boundRegions: blocks })
    // TEST-ONLY: the goal moved 1.5 m into the area, its anchor still its end line: it still stands at that end (until H2's fix, NOT_APPLICABLE).
    const moved = copy(block.fixture.game)
    goalOf({ fixture: { game: moved } }).realizedGeometry.position.along.interval = { from: 1.5, to: 1.5 }
    // Re-pointed 24 October 2026 (R1): at the goal's end LAW-17 is now DEPARTED by A01-R1-RP1-1 (his reply filed 27 October 2026, item 4),
    // which still shows the goal read at that end and not at the other. Was: ADAPTATION_OWED there.
    assert.deepEqual(accountWith(moved, 'LAW-17').laws.map(entry => entry.status), ['DEPARTED', 'NOT_APPLICABLE'])
    // With no anchor either, off every end line: unknown, so owed - never not applicable.
    delete goalOf({ fixture: { game: moved } }).realizedGeometry.position.along.anchor
    const unread = accountWith(moved, 'LAW-17').laws
    assert.deepEqual(unread.map(entry => entry.status), ['ADAPTATION_OWED', 'ADAPTATION_OWED'])
    assert.ok(unread[0].why.includes('cannot be read') && unread[0].why.includes('insufficient evidence is never a pass'), unread[0].why)
    // No readable game at all: every per-end law is owed, saying why (until H2's fix, NOT_APPLICABLE at both ends).
    for (const id of ['LAW-14', 'LAW-16', 'LAW-17']) assert.deepEqual(accountWith(undefined, id).laws.map(entry => entry.status), ['ADAPTATION_OWED', 'ADAPTATION_OWED'], id)
    assert.equal(accountWith(undefined, 'LAW-12-GK').laws[0].status, 'ADAPTATION_OWED')
})

test("the account reads an object anchored off both end lines as absent from each, not unknown (the H3 review's should-fix 7, carried in H4)", () => {
    const { fixture } = regulationBuild(12, 1)
    const block = fixture.roleBlocks.blocks[0]
    const laws = loadSportDefaultLaws()!
    const r2 = loadProvisionalRealizations().find(r => r.provisionalId === R2)!
    const accountWith = (game: unknown) => blockLawAccountOf({ blockId: block.blockId, game, roleBlock: block.fixture.record.roleBlock, index, session: sessionOf(12, 1, REGULATION_AREA), laws: { ...copy(laws), laws: [laws.laws.find(law => law.id === 'LAW-17')!] }, items: r2.items, boundRegions: blocks })
    // TEST-ONLY: the goal anchored at halfway, its position there too - it stands at neither end, so the law applies at neither.
    const halfway = copy(block.fixture.game)
    const along = goalOf({ fixture: { game: halfway } }).realizedGeometry.position.along
    along.anchor = REGULATION_AREA[0] / 2
    along.interval = { from: REGULATION_AREA[0] / 2, to: REGULATION_AREA[0] / 2 }
    const read = accountWith(halfway).laws
    assert.deepEqual(read.map(entry => entry.status), ['NOT_APPLICABLE', 'NOT_APPLICABLE'], read.map(entry => entry.why).join(' | '))
})

// ── 9. The type a session states (H4, register version 22) ─────────────────────────────────────────────
test('H4: a pairing that records a type matches only a goal the session states of that type; unstated, the build ASKS, through the question channel', () => {
    for (const area of [REGULATION_AREA, PROTOTYPE_AREA]) {
        // Not stated: asked, never assumed to be Law 1.10's goal - at 45 x 42 m and at 40 x 30 m alike (the type decides a gap from a fallback).
        const asked = build(12, 1, area, FULL_SIZE, fileWith(area === REGULATION_AREA ? { area } : {}), { goalType: null }).activity as RefusedActivity
        assert.deepEqual([asked.outcome, asked.stage, asked.summary], ['refused', 'session', 'Say what type of goal this session has before building this activity.'], asked.reasons.join(' | '))
        // Re-pointed 24 October 2026 (stage I): the question carries the choices it is answered by - those stating a type (Law 1.10's goal,
        // the mini-goal), and none - each label DRAFT; another goal states no type, so it is not offered for this question.
        const { choices, ...rest } = asked.question!
        assert.deepEqual(rest, { kind: 'OBJECT_AVAILABILITY', objectKind: 'goal', asks: 'ATTRIBUTE', attribute: { name: 'type', values: ['full-size', 'scaled', 'mini-goal'] }, words: asked.summary, status: 'DRAFT' })
        assert.deepEqual(choices.map(choice => [choice.id, choice.label, choice.states]), [
            ['pairing:IFAB-LAW-1', 'the goal in IFAB Laws of the Game, 7.32 m x 2.44 m', { type: 'full-size', widthM: 7.32 }],
            // K1 ATTRIBUTE answers keep the already stated width, for every type. Re-pointed 24 October 2026 (K1 review): 'full-size' at
            // 7.32 m states exactly what the IFAB choice states, so it is not offered again (the suppression objectChoicesOf applies).
            ['attribute:type=scaled', 'scaled', { type: 'scaled', widthM: 7.32 }],
            ['attribute:type=mini-goal', 'a mini-goal or pop-up goal', { type: 'mini-goal', widthM: 7.32 }],
            ['none', 'none', { count: 0 }],
        ])
        assert.ok(asked.reasons.some(reason => reason.includes('BOUND_REGION_OBJECT_NOT_STATED') && reason.includes('IFAB-LAW-1: type full-size')), asked.reasons.join(' | '))
        assert.deepEqual(selectionOf(asked), [[R2, 'ASKED', 'OBJECT_AVAILABILITY_NOT_STATED', 'session'], ['A01-R1', 'NOT_TRIED', null, null]])
        // The live route passes the question on, whole.
        assert.deepEqual(liveRefusalBody(asked, null).question, asked.question)
    }
    // Stated as another type: no pairing matches, a knowledge gap (never the regulation area, never a fallback), saying the type read.
    for (const type of ['scaled', 'mini-goal']) {
        const gap = build(12, 1, REGULATION_AREA, FULL_SIZE, fileWith({ area: REGULATION_AREA }), { goalType: type }).activity as RefusedActivity
        assert.deepEqual([gap.outcome, gap.stage, gap.summary], ['refused', 'knowledge', `The penalty area that goes with a goal 7.32 m wide (type: ${type}) has not been decided yet.`], gap.reasons.join(' | '))
        assert.equal(gap.question, undefined)
        assert.ok(gap.reasons.some(reason => reason.includes(`7.32 m wide, of the type ${type} as the session states it, and no authorized pairing`)), gap.reasons.join(' | '))
        assert.deepEqual(selectionOf(gap)[1], ['A01-R1', 'NOT_TRIED', null, null])
    }
    // The review page's answer, as it sends it (the count and width already stated, with the type), read through the review route's own
    // request builder over a stored session that states no type: the build then holds, and stops where the regulation build stops.
    const storedSession = { playerCount: 12, fieldLength: String(REGULATION_AREA[0]), fieldWidth: String(REGULATION_AREA[1]), specializedRoles: { ...none, [KEEPER]: 1 }, objects: { goal: { count: 1, widthM: FULL_SIZE } } }
    const answered = reviewRequestOf(storedSession, { learningGoalId: 'A01', durationMin: 20, objects: { goal: { count: 1, widthM: FULL_SIZE, type: 'full-size' } } })
    assert.ok(!('refusal' in answered), JSON.stringify(answered))
    const afterAnswer = buildActivityUnderAuthorizationRecords(answered as any, records(), { realizations: loadProvisionalRealizations(fileWith({ area: REGULATION_AREA })), review: { includeDrafts: false } }).activity as RefusedActivity
    // Re-pointed 24 October 2026 (stage L): the regulation build is served now (its area has words), so the answer reaches a served activity.
    // Was: refused at communication.
    assert.deepEqual([afterAnswer.outcome, afterAnswer.stage, afterAnswer.question], ['served', undefined, undefined], (afterAnswer.reasons ?? []).slice(0, 3).join(' | '))
    // Stated full-size: exactly the regulation build above (it states it), and at 40 x 30 m the fallback of section 5.
    // A width no pairing has is a gap without the type being read, so it is never asked for (his item 9(b)).
    const fiveM = build(12, 1, PROTOTYPE_AREA, 5, fileWith({ region: false }), { goalType: null }).activity as RefusedActivity
    assert.deepEqual([fiveM.stage, fiveM.question], ['knowledge', undefined])
    // With a TEST-ONLY pairing of that width recording a type, the same goal is asked for its type, and a type it does not record is a gap.
    const scaledFile = fileWith({ along: { term: 'own end (of team T)', forTeam: 'ROLE_HOLDER_BUILDING', offsetM: { from: 0, to: 7 }, asAuthored: 'TEST-ONLY' }, extentM: 14, pairing: 'TEST-ONLY-SCALED' })
    const askedScaled = build(12, 1, PROTOTYPE_AREA, 5, scaledFile, { boundRegions: withTestOnlyPairing(), goalType: null }).activity as RefusedActivity
    assert.deepEqual([askedScaled.stage, askedScaled.question?.asks, askedScaled.question?.attribute?.name], ['session', 'ATTRIBUTE', 'type'])
    const otherType = build(12, 1, PROTOTYPE_AREA, 5, scaledFile, { boundRegions: withTestOnlyPairing(), goalType: 'full-size' }).activity as RefusedActivity
    assert.deepEqual([otherType.stage, otherType.summary], ['knowledge', 'The penalty area that goes with a goal 5 m wide (type: full-size) has not been decided yet.'])
})

test("H4: the loader refuses a pairing whose type is none a session may state, and a TEST-ONLY block handed to the build is held to the same validator", () => {
    const raw = profileFile()
    const damaged = copy(raw)
    damaged.boundRegions.pairings[0].object.type = 'TEST-ONLY'
    assert.ok(boundRegionsRefusals(damaged.boundRegions, index).some(error => error.includes('records the type "TEST-ONLY" for its object, which is none of the values a session may state (full-size, scaled, mini-goal)')))
    assert.throws(() => loadSportBoundRegions(() => damaged, index), /bound-region block is refused/)
    // The H3 review's should-fix 5: the build's TEST-ONLY option now runs the validator (until H4 its comment said so and it only copied).
    const bad = copy(blocks)
    bad.pairings[0].object.type = 'TEST-ONLY'
    assert.throws(() => build(12, 1, REGULATION_AREA, FULL_SIZE, fileWith({ area: REGULATION_AREA }), { boundRegions: bad }), /a TEST-ONLY bound-region block is refused by the validator/)
    // And the citation label is Law 1.3's own (the H3 review's should-fix 1).
    assert.ok(String(blocks.pairings[0].formatConditions.pitch).startsWith('Law 1.3 (Dimensions): '))
})

test("the bindings step, measured on the check itself (the H3 review's should-fix 3): a region of another noun, and an undefended object holding two", () => {
    const { fixture } = regulationBuild(12, 1)
    const game = fixture.roleBlocks.blocks[0].fixture.game
    const envelope = sessionOf(12, 1, REGULATION_AREA, FULL_SIZE)
    assert.equal(boundRegionRefusalBefore(index, game, envelope, blocks), null, 'the regulation game passes as built')
    // TEST-ONLY: its bound region told as a band - the profile binds a zone.
    const band = copy(game)
    const region = (band.space.regions as any[]).find(entry => entry.ofObject)
    region.noun = 'band'
    const noun = boundRegionRefusalBefore(index, band, envelope, blocks)
    assert.equal(noun?.cause, 'BOUND_REGION_INVALID')
    assert.ok(noun?.cause === 'BOUND_REGION_INVALID' && noun.problems.some(problem => problem === `${region.elementId} is a band, and the Sport Profile (BOUND-REGION-GOAL) binds a zone`), JSON.stringify(noun))
    // TEST-ONLY: the goal defended by no team, holding two regions bound to it.
    const two = copy(game)
    delete goalOf({ fixture: { game: two } }).defendedBy
    const original = (two.space.regions as any[]).find(entry => entry.ofObject)
    two.space.regions.push({ ...copy(original), elementId: `${original.elementId}-TEST-ONLY-SECOND` })
    const twice = boundRegionRefusalBefore(index, two, envelope, blocks)
    assert.ok(twice?.cause === 'BOUND_REGION_INVALID' && twice.problems.some(problem => problem === `c:provisional:${R2}:${R2}-O1-1 holds 2 regions of the function penalty-area bound to it, and the Sport Profile (BOUND-REGION-GOAL) binds one`), JSON.stringify(twice))
})

/**
 * Re-pointed 24 October 2026 (K3, the d27 design's stage K3): the session states that it has no goal. Since K3 A01's record tries the goal
 * version (A01-R2) first, and a session that has not said what goals it has is asked first (his reply filed 26 October 2026, item 11: "Do not
 * infer a goal from the presence of a goalkeeper or silently treat missing information as confirmation that no goal exists."). With no goal
 * the zone version is served, binding no region, exactly as before; with the FA 5v5 goal the goal version is served, its penalty area bound
 * (goal-version-switch.unit.ts, goal-version-penalty-area.unit.ts).
 */
test('production is unchanged: A01 at 12/1, 12/2 and 11/1 served as the zone version, no bound region, the same activity with or without the block', () => {
    for (const [players, keepers] of [[12, 1], [12, 2], [11, 1]]) {
        const label = `${players}/${keepers}`
        const request = { kind: 'learning-goal', goalId: 'A01', situationId: null, session: { ...sessionOf(players, keepers, PROTOTYPE_AREA), objects: { goal: { count: 0 } } } } as any
        const production = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { review: { includeDrafts: true } })
        const withoutBlock = buildActivityUnderAuthorizationRecords(request, learningGoalAuthorizations(), { review: { includeDrafts: true }, boundRegions: null })
        const served = production.activity as ServedActivity
        assert.equal(served.outcome, 'served', label)
        assert.equal(served.evidence!.boundRegions, undefined, label)
        assert.deepEqual(boundRegionsOf(production.fixture), [[], []], `${label}: the zone version binds no region`)
        assert.deepEqual(production.activity, withoutBlock.activity, `${label}: the check reads nothing in production`)
    }
})

console.log(`bound-regions.unit.ts — ${passed} passed`)
