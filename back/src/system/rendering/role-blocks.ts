/**
 * **Two role blocks, checked against each other and composed into ONE activity** — added 15 October 2026 (stage K3) for his
 * M1, reply filed 17 October 2026:
 *
 *   > *"M1 — Role exchange by block: Approved. Keep role assignments separate from fixed ends. Allow target configurations
 *   > to reflect each team's role during the block. The coach controls the exchange. No new block-duration system is
 *   > needed."*
 *
 * and his request for the review: *"Please verify the configuration's structural consistency, including player totals,
 * spatial relationships, scoring conditions, and restarts."*
 *
 * Each block arrives here already built as its own complete game — derived, gated, realized, assembled, accepted, gated
 * again, scored against its context, rendered and fidelity-checked by the one chain every game runs (`build-activity.ts`).
 * So nothing here re-checks a game. What is checked is the RELATION between the two, which no single game can show:
 *
 *   - **RB-1** the same elements in both (regions, objectives, transitions, the primary event and its conditions, teams);
 *   - **RB-2** the ends do not move: every objective's team and reference, the direction view where the game holds one,
 *     and the binding of each end to a team, identical (ruling C42: *"distinct teams assigned to opposite ends at setup,
 *     with their assignments remaining fixed throughout the activity"*);
 *   - **RB-3** two objectives of the scoring role, two target regions, and no region a role-keyed selector created (C42:
 *     *"exactly two active objectives and two corresponding target regions, not three"*);
 *   - **RB-4** every property the two games hold the same, except where the knowledge that supports it is written for a
 *     role holder — a difference nothing role-keyed explains is a difference nobody authored;
 *   - **RB-5** each block binds every role to one end-assigned team, the second block is the exchange of the first, and
 *     each game records exactly the block it was derived for;
 *   - **RB-6** the same session and the same number of players in both;
 *   - **RB-7** no role-keyed fact introduces a time window, a time expiry or an objective set (his M1: *"No new
 *     block-duration system is needed"*; nothing switches an objective on and off by role);
 *   - **RB-8** a role-keyed position is the same by role and mirrored along the axis: what the building team's target is
 *     at one end it is, measured from the other end, in the other block. A role-keyed position that does not mirror is
 *     an absolute position written for a role, which cannot hold at both ends;
 *   - **RB-M** (stage K4, his RD-1 answer of 18 October 2026: *"role exchange and participant reassignment should remain
 *     separate capabilities"*) each team's counts change between the blocks exactly as a recorded reassignment states, and
 *     not at all where none is recorded — the exchange of roles moves nobody.
 *
 * Then the coach reads one activity: a sentence the two renders say alike is said once, a sentence they say alike by role
 * (stage 2C: the same words, each block citing its own role's target) is said once with each block's citations kept apart,
 * a sentence only one block says is said under that block, and fidelity Q6 checks that the composition lost nothing from
 * either render, invented nothing, keeps the ends-fixed and roles-exchange statements his D2 asks for, and never says the
 * ends change.
 *
 * Sport-neutral: rows, roles and nouns are register data; every check reads the games and the register.
 */
import { expectedChange, reassignmentsIn } from '../derivation/reassignment'
import { exchangeOf } from '../derivation/role-blocks'
import { roleHolderNames, roleOfHolder } from '../derivation/designation'
import { RegisterIndex } from '../derivation/register'
import { parseSelector } from '../derivation/selector'
import { splitPath } from '../derivation/resolved-game'
import { LoadedContract, RoleBlock } from '../derivation/types'
import { FidelityFinding } from './fidelity'
import { Instruction, RenderedActivity, ROLE_EXCHANGE, roleKeyedPositions } from './render-concrete-game'
import { inSectionOrder } from './sections'

/** One cross-block check, with what it found. */
export interface RoleBlockCheck {
    checkId: 'RB-1' | 'RB-2' | 'RB-3' | 'RB-4' | 'RB-5' | 'RB-6' | 'RB-7' | 'RB-8' | 'RB-M'
    what: string
    verdict: 'PASS' | 'FAIL'
    problems: string[]
}

/** One block as the checks receive it: its binding, the fixture it was rendered from, and the contracts it was derived from. */
export interface BuiltBlock {
    block: RoleBlock
    fixture: any
    contracts: LoadedContract[]
}

const read = (root: any, path: string): any => (path ? path.split('.').reduce((node, key) => (node == null ? node : node[key]), root) : root)
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/** The container a register row's elements sit in, in a game (`space.regions`), or the row's own path for a single element. */
function containerOf(index: RegisterIndex, rowId: string): string | null {
    const path = index.rows.get(rowId)?.path
    if (!path) return null
    return splitPath(String(path)).container ?? String(path)
}

/** The element ids a game holds under a container: every member's id, or the one element's. */
function idsAt(game: any, container: string): string[] {
    const node = read(game, container)
    if (Array.isArray(node)) return node.map(member => String(member?.elementId)).sort()
    return node && typeof node === 'object' && node.elementId ? [String(node.elementId)] : []
}

/** The designation-like tokens an item names in its selector or value (runs of capitals, digits and underscores). */
const tokensOf = (value: unknown): string[] => JSON.stringify(value ?? null).match(/[A-Z][A-Z0-9_]*/g) ?? []

/** Is this item written for a role holder? */
function roleKeyed(item: any, holders: string[]): boolean {
    return [...tokensOf(item?.selector), ...tokensOf(item?.value)].some(token => holders.includes(token))
}

/** The items of these contracts, by `contractId::itemId`. */
function itemsOf(contracts: LoadedContract[]): Map<string, any> {
    return new Map(contracts.flatMap(contract => (contract.items ?? []).map(item => [`${contract.contractId}::${item.itemId}`, item] as const)))
}

/** Every property a game holds, keyed by path: derived values, choices, entailments and realized geometry. */
function propertiesOf(fixture: any): Map<string, { value: unknown; support: any[]; kind: string }> {
    const found = new Map<string, { value: unknown; support: any[]; kind: string }>()
    for (const entry of fixture.status?.derived ?? []) found.set(entry.path, { value: entry.value, support: entry.support ?? [], kind: 'derived' })
    for (const choice of fixture.status?.choices ?? []) found.set(choice.path, { value: choice.value, support: [], kind: 'choice' })
    /**
     * An entailed value's support is the items that decided it for that member (`supportedBy`, stage K4). Until 15 October
     * 2026 (stage K4) this read `entailed.chain ?? entailed.basis`, fields an entailment never has (it carries `because`), so
     * no entailed difference could ever be explained: measured with that reading put back, A01-R1's counts by role on the
     * possession game refused at RB-4 on all four team counts, each supported by an item written for a role holder.
     */
    for (const entailed of fixture.status?.entailed ?? []) {
        const support = ((entailed.supportedBy ?? []) as { contractId: string; itemId: string }[]).map(ref => ({ kind: 'CONTRACT_ITEM', contractId: ref.contractId, itemId: ref.itemId }))
        found.set(`${entailed.collection}[${entailed.handle}].${entailed.leaf}`, { value: entailed.value, support, kind: 'entailed' })
    }
    for (const geometry of fixture.status?.geometry ?? []) found.set(`${geometry.path}#realized`, { value: geometry.geometry, support: [], kind: 'geometry' })
    return found
}

const check = (checkId: RoleBlockCheck['checkId'], what: string, problems: string[]): RoleBlockCheck => ({ checkId, what, verdict: problems.length ? 'FAIL' : 'PASS', problems })

/**
 * The cross-block checks, RB-1 to RB-8 and RB-M, over two blocks built as complete games. Every check runs and reports, so a refusal
 * names every disagreement at once.
 */
export function checkRoleBlocks(blocks: BuiltBlock[], index: RegisterIndex, roles: string[]): RoleBlockCheck[] {
    const holders = roleHolderNames(index)
    const games = blocks.map(entry => entry.fixture?.game ?? {})
    const pair = blocks.length === 2
    const results: RoleBlockCheck[] = []

    // RB-1 — the same elements.
    {
        const problems: string[] = []
        if (!pair) problems.push(`role blocks come in two; ${blocks.length} were built`)
        // V27 added 17 October 2026 (stage M2): an occurrence that also counts as the primary event, compared like every other element.
        for (const rowId of ['S2', 'J1', 'T1', 'V0', 'V3', 'V27', 'P1']) {
            const container = containerOf(index, rowId)
            if (!container || !pair) continue
            const [a, b] = games.map(game => idsAt(game, container))
            if (!same(a, b)) problems.push(`${container}: ${JSON.stringify(a)} in one block and ${JSON.stringify(b)} in the other`)
        }
        results.push(check('RB-1', 'the same regions, objectives, transitions, primary event, conditions and teams in both blocks', problems))
    }

    // RB-2 — the ends do not move.
    const spec = index.targetOf
    const objectivesAt = containerOf(index, spec?.objectivesRow ?? 'J1') ?? 'objectives'
    {
        const problems: string[] = []
        if (pair && spec) {
            const [first, second] = games.map(game => (read(game, objectivesAt) ?? []) as any[])
            for (const objective of first) {
                const other = second.find(o => o?.elementId === objective?.elementId)
                for (const leaf of [spec.teamLeaf, spec.referenceLeaf]) {
                    if (!other || !same(objective?.[leaf], other?.[leaf])) problems.push(`${objectivesAt}[${objective?.elementId}].${leaf} is ${JSON.stringify(objective?.[leaf])} in one block and ${JSON.stringify(other?.[leaf])} in the other`)
                }
            }
            const direction = index.rows.get('DV1')?.path
            if (direction && !same(read(games[0], String(direction)), read(games[1], String(direction)))) problems.push(`${direction} differs between the blocks`)
            const bindings = blocks.map(entry => entry.fixture?.record?.designationBindings ?? [])
            if (!same(bindings[0], bindings[1])) problems.push(`the end-to-team binding differs between the blocks: ${JSON.stringify(bindings[0])} and ${JSON.stringify(bindings[1])}`)
        }
        results.push(check('RB-2', 'each team keeps its end: objectives, references, direction and the end-to-team binding identical', problems))
    }

    // RB-3 — two objectives of the scoring role, two target regions, no third region.
    {
        const problems: string[] = []
        const regionsAt = containerOf(index, spec?.row ?? 'S2') ?? 'space.regions'
        blocks.forEach((entry, i) => {
            const game = games[i]
            const scoring = ((read(game, objectivesAt) ?? []) as any[]).filter(o => spec && o?.[spec.roleLeaf] === spec.role)
            const references = new Set(scoring.map(o => JSON.stringify(o?.[spec?.referenceLeaf ?? 'reference'])))
            if (scoring.length !== 2) problems.push(`block ${entry.block.blockId}: ${scoring.length} objectives of the role ${spec?.role}, not two`)
            if (references.size !== 2) problems.push(`block ${entry.block.blockId}: the scoring objectives reference ${references.size} target(s), not two`)
            for (const region of (read(game, regionsAt) ?? []) as any[]) {
                if ((region?.selector ?? []).some((term: any) => term?.attribute === spec?.attribute)) problems.push(`block ${entry.block.blockId}: ${regionsAt}[${region.elementId}] was created by a selector on ${spec?.attribute}, a third region`)
            }
        })
        results.push(check('RB-3', 'two objectives of the scoring role and two target regions in each block, and no region a role-keyed selector created', problems))
    }

    // RB-4 — every difference is supported by something written for a role holder.
    const differing: { path: string; kind: string }[] = []
    {
        const problems: string[] = []
        if (pair) {
            const items = blocks.map(entry => itemsOf(entry.contracts))
            const [a, b] = blocks.map(entry => propertiesOf(entry.fixture))
            const explained = (property: { support: any[]; kind: string } | undefined, i: number): boolean => {
                if (!property) return false
                return property.support.some((ref: any) => ref?.kind === 'CONTRACT_ITEM' && roleKeyed(items[i].get(`${ref.contractId}::${ref.itemId}`), holders))
            }
            /**
             * **A target's extent written for the role that attacks it** (15 October 2026, stage K6). A target's position is the
             * possession game's (its anchor at an end), and what makes it differ between the blocks is an item bounding its extent
             * written for a role holder by \`targetOf\` (his 18 October item 3: the post-regain area's depth, the progression target
             * beginning at the pressure reference) — an item that BOUNDS the line, so it is not among the line's entailing support.
             * It explains the difference only where, in that block, the region is the target of the team holding that role.
             */
            const rowOfPath = (line: string): string | null => {
                const open = line.indexOf('[')
                const close = line.indexOf(']', open)
                if (open < 0 || close < 0) return null
                const generic = `${line.slice(0, open)}[]${line.slice(close + 1)}`
                return [...index.rows.values()].find(row => String(row.path) === generic)?.id ?? null
            }
            const targetedFor = (line: string, i: number): boolean => {
                if (!spec) return false
                const open = line.indexOf('[')
                const close = line.indexOf(']', open)
                const regionId = open < 0 || close < 0 ? '' : line.slice(open + 1, close)
                const rowId = rowOfPath(line)
                const objective = ((read(games[i], objectivesAt) ?? []) as any[]).find(o => o?.[spec.roleLeaf] === spec.role && `c:${o?.[spec.referenceLeaf]?.structuralRef?.contractId}:${o?.[spec.referenceLeaf]?.structuralRef?.itemId}` === regionId)
                const role = objective ? roles.find(r => blocks[i].block.holders[r] === String(objective[spec.teamLeaf])) : undefined
                const holder = role ? holders.find(name => roleOfHolder(index, name) === role) : undefined
                if (!holder || !rowId) return false
                return [...items[i].values()].some(item => String(item?.row) === rowId && (parseSelector(item?.selector, rowId, index).predicate?.terms ?? []).some(term => term.attribute === spec.attribute && term.op === '=' && term.value === holder))
            }
            for (const path of [...new Set([...a.keys(), ...b.keys()])].sort()) {
                const [x, y] = [a.get(path), b.get(path)]
                if (x && y && same(x.value, y.value)) continue
                if (path.endsWith('#realized')) {
                    // A realized position differs only where the position it realizes is role-keyed; RB-8 then mirrors it.
                    const line = path.slice(0, -'#realized'.length)
                    if ((explained(a.get(line), 0) && explained(b.get(line), 1)) || (targetedFor(line, 0) && targetedFor(line, 1))) differing.push({ path: line, kind: 'geometry' })
                    else problems.push(`${line} is realized differently in the two blocks and nothing role-keyed supports it`)
                    continue
                }
                if (explained(x, 0) && explained(y, 1)) differing.push({ path, kind: x?.kind ?? y?.kind ?? 'derived' })
                else problems.push(`${path} is ${x ? JSON.stringify(x.value) : 'absent'} in one block and ${y ? JSON.stringify(y.value) : 'absent'} in the other, and nothing written for a role holder supports the difference`)
            }
        }
        results.push(check('RB-4', 'the blocks differ only where the supporting knowledge is written for a role holder', problems))
    }

    // RB-5 — bijections, the exchange of each other, each recorded.
    {
        const problems: string[] = []
        const ends = [...index.designations.resolutions.entries()].filter(([, r]) => r.kind === 'SETUP_ASSIGNMENT').map(([name]) => name)
        blocks.forEach(entry => {
            const held = roles.map(role => entry.block.holders[role])
            if (held.some(holder => !ends.includes(holder)) || new Set(held).size !== roles.length) problems.push(`block ${entry.block.blockId} does not bind each role to its own end-assigned team`)
            if (!same(entry.fixture?.record?.roleBlock, entry.block)) problems.push(`the game built for block ${entry.block.blockId} records ${JSON.stringify(entry.fixture?.record?.roleBlock ?? null)} as the block it was derived for`)
        })
        if (pair && !same(exchangeOf(blocks[0].block, roles), blocks[1].block)) problems.push(`block ${blocks[1].block.blockId} is not the exchange of block ${blocks[0].block.blockId}`)
        results.push(check('RB-5', 'each block binds every role to one end-assigned team, the second is the exchange of the first, and each game records its block', problems))
    }

    // RB-6 — the same session and the same number of players.
    {
        const problems: string[] = []
        if (pair) {
            if (!same(blocks[0].fixture?.envelope, blocks[1].fixture?.envelope)) problems.push('the two blocks were built for different sessions')
            const teamsAt = containerOf(index, 'P1') ?? 'performers.teams'
            // Each team's outfield count and its count for every specialized role, by the register's own leaves.
            const counted = [String(index.rows.get('P2')?.path ?? '').split('[].').pop() ?? '', ...index.specializedRoleRows.values()].filter(Boolean)
            const neutralsPath = index.rows.get('P5')?.path
            const total = (game: any) =>
                ((read(game, teamsAt) ?? []) as any[]).reduce((n, team) => n + counted.reduce((m, leaf) => m + (typeof team?.[leaf] === 'number' ? team[leaf] : 0), 0), 0) +
                (neutralsPath && typeof read(game, String(neutralsPath)) === 'number' ? read(game, String(neutralsPath)) : 0)
            const [x, y] = games.map(total)
            if (x !== y) problems.push(`${x} players take part in one block and ${y} in the other`)
        }
        results.push(check('RB-6', 'the same session and the same number of players in both blocks', problems))
    }

    // RB-7 — no role-keyed time window, expiry or objective set.
    {
        const problems: string[] = []
        const timed = new Set(['V23', 'J5'].filter(id => index.rows.has(id)))
        for (const entry of blocks.slice(0, 1)) {
            for (const contract of entry.contracts) {
                for (const item of contract.items ?? []) {
                    if (!roleKeyed(item, holders)) continue
                    const owner = index.ownerRow.get(String(item.row)) ?? String(item.row)
                    const expiry = tokensOf(item.selector).includes('TIME_EXPIRY') || tokensOf(item.value).includes('TIME_EXPIRY')
                    if (timed.has(owner) || expiry) problems.push(`${contract.contractId}::${item.itemId} is written for a role holder and introduces ${expiry ? 'a time expiry' : `an element of ${owner}`}`)
                }
            }
        }
        results.push(check('RB-7', 'no fact written for a role holder introduces a time window, a time expiry or an objective set', problems))
    }

    // RB-8 — a role-keyed position is the same by role and mirrored along the axis.
    {
        const problems: string[] = []
        if (pair && spec) {
            const length = Number(blocks[0].fixture?.envelope?.lengthM)
            const attackerOf = (game: any, regionId: string): string | null => {
                const objective = ((read(game, objectivesAt) ?? []) as any[]).find(o => o?.[spec.roleLeaf] === spec.role && `c:${o?.[spec.referenceLeaf]?.structuralRef?.contractId}:${o?.[spec.referenceLeaf]?.structuralRef?.itemId}` === regionId)
                return objective ? String(objective[spec.teamLeaf]) : null
            }
            const regionOf = (game: any, attacker: string): string | null => {
                const objective = ((read(game, objectivesAt) ?? []) as any[]).find(o => o?.[spec.roleLeaf] === spec.role && o?.[spec.teamLeaf] === attacker)
                const ref = objective?.[spec.referenceLeaf]?.structuralRef
                return ref ? `c:${ref.contractId}:${ref.itemId}` : null
            }
            const intervalAt = (fixture: any, regionId: string, axisLeaf: string) =>
                (fixture.status?.geometry ?? []).find((g: any) => g.path.includes(`[${regionId}]`) && g.path.endsWith(axisLeaf))?.geometry?.interval ?? null
            for (const { path, kind } of differing) {
                if (kind !== 'geometry' && kind !== 'derived') continue
                const open = path.indexOf('[')
                const close = path.indexOf(']', open)
                if (open < 0 || close < 0) continue
                const regionId = path.slice(open + 1, close)
                const axisLeaf = path.slice(close + 1)
                /**
                 * **An element placed relative to a role is its own counterpart** (15 October 2026, stage K6). The pressure reference
                 * ("20 m from the building team's end line") and the starting regions (short of / beyond it) are elements of the
                 * realization with one identity in both blocks, positioned for the team holding a role (RB-4 admitted the difference
                 * only on that support). Exchanging the roles with the ends fixed must mirror each along the axis, exactly as a
                 * role's target is mirrored onto its counterpart. A start placement's region (P10 version 2) is an along interval.
                 */
                const geometryAt = (fixture: any) => (fixture.status?.geometry ?? []).find((g: any) => g.path === path)?.geometry
                const own = attackerOf(games[0], regionId) === null && geometryAt(blocks[0].fixture)?.axis === 'along'
                if (own) {
                    const [here, there] = [geometryAt(blocks[0].fixture)?.interval, geometryAt(blocks[1].fixture)?.interval]
                    if (!here || !there || !Number.isFinite(length)) problems.push(`${path} differs between the blocks and one of them holds no interval for it`)
                    else if (here.from !== length - there.to || here.to !== length - there.from) {
                        problems.push(`${path} is [${here.from}, ${here.to}] in one block and [${there.from}, ${there.to}] in the other, which is not its mirror along a ${length} m axis`)
                    }
                    continue
                }
                if (!axisLeaf.endsWith('.along')) continue
                const attacker = attackerOf(games[0], regionId)
                const role = attacker ? roles.find(r => blocks[0].block.holders[r] === attacker) : undefined
                const counterpart = role ? regionOf(games[1], blocks[1].block.holders[role]) : null
                const here = intervalAt(blocks[0].fixture, regionId, axisLeaf)
                const there = counterpart ? intervalAt(blocks[1].fixture, counterpart, axisLeaf) : null
                if (!role || !counterpart || !here || !there || !Number.isFinite(length)) {
                    problems.push(`${path} differs between the blocks and is not the target of a role holder whose counterpart can be compared: a position written for a role must be relative to the team holding it`)
                    continue
                }
                if (here.from !== length - there.to || here.to !== length - there.from) {
                    problems.push(`${path} is [${here.from}, ${here.to}] for the ${role} role in one block, and its counterpart is [${there.from}, ${there.to}] in the other, which is not its mirror along a ${length} m axis`)
                }
            }
        }
        results.push(check('RB-8', 'a position written for a role is the same by role and mirrored along the axis', problems))
    }

    /**
     * RB-M — **membership changes between the blocks exactly as a recorded reassignment states, and never by the exchange
     * alone** (15 October 2026, stage K4). His answer to RD-1, reply filed 18 October 2026: *"role exchange and participant
     * reassignment should remain separate capabilities. Exchanging roles should not inherently require players to change
     * teams."* Each team (by its handle, bound to the same end in both blocks, RB-2) is counted in each block for every kind
     * of performer the register counts per team; the change from the first block to the second must be exactly what the
     * reassignments both blocks hold state (`derivation/reassignment.ts`). With none recorded, every count must be the same in
     * both blocks — his Option 1(c), membership kept, is that case.
     */
    {
        const problems: string[] = []
        if (pair) {
            const teamsAt = containerOf(index, 'P1') ?? 'performers.teams'
            const rows = index.reassignment?.performerRows ?? ['P2', ...index.specializedRoleRows.keys()]
            const leafOf = (rowId: string) => String(index.rows.get(rowId)?.path ?? '').split('[].').pop() ?? rowId
            const found = blocks.map(entry => reassignmentsIn(entry.fixture?.game ?? {}, index))
            for (const [i, entry] of found.entries()) for (const problem of entry.problems) problems.push(`block ${blocks[i].block.blockId}: ${problem}`)
            if (!same(found[0].found, found[1].found)) problems.push(`the two blocks hold different reassignments: ${JSON.stringify(found[0].found)} and ${JSON.stringify(found[1].found)}`)
            const bindings = (blocks[0].fixture?.record?.designationBindings ?? []) as { designation: string; handle: string }[]
            const expected = expectedChange(found[0].found, blocks[0].block, blocks[1].block, bindings, index)
            problems.push(...expected.problems)
            const teamsOf = (game: any) => new Map(((read(game, teamsAt) ?? []) as any[]).map(team => [String(team?.elementId), team]))
            const [first, second] = games.map(teamsOf)
            for (const [handle, team] of first) {
                const other = second.get(handle)
                if (!other) {
                    problems.push(`the team ${handle} is in one block only`)
                    continue
                }
                for (const rowId of rows) {
                    const leaf = leafOf(rowId)
                    const [a, b] = [team?.[leaf], other?.[leaf]]
                    if (!Number.isInteger(a) || !Number.isInteger(b)) {
                        problems.push(`the team ${handle} carries no whole ${leaf} count in ${Number.isInteger(a) ? 'the second' : 'the first'} block, so whether its membership changed cannot be told`)
                        continue
                    }
                    const stated = expected.change.get(handle)?.get(rowId) ?? 0
                    if (b - a === stated) continue
                    problems.push(
                        found[0].found.length
                            ? `the team ${handle} holds ${a} ${leaf} in the first block and ${b} in the second, a change of ${b - a} where the recorded reassignments state ${stated}`
                            : `the team ${handle} holds ${a} ${leaf} in the first block and ${b} in the second, and no reassignment is recorded: an exchange of roles moves no player by itself`,
                    )
                }
            }
        }
        results.push(check('RB-M', 'membership changes between the blocks exactly as a recorded reassignment states, and never by the exchange of roles alone', problems))
    }

    return results
}

/**
 * The two blocks as the composed fixture carries them (`build-activity.ts`): each block's own fixture WHOLE, with its
 * binding, beside the exchange, the roles with their DRAFT nouns, and the cross-block checks. Carried whole so a reader of
 * the composed fixture — the frozen-fixture guard, a later renderer — loses nothing either block held.
 */
export function roleBlockFixture(
    found: { roles: string[]; exchange: string },
    blocks: { block: RoleBlock; fixture: any }[],
    checks: RoleBlockCheck[],
    index: RegisterIndex,
): Record<string, unknown> {
    return {
        exchange: found.exchange,
        roles: [...found.roles],
        roleNouns: { status: 'DRAFT', nouns: { ...(index.roleBlocks?.coachNouns ?? {}) } },
        blocks: blocks.map(entry => ({ blockId: entry.block.blockId, holders: { ...entry.block.holders }, fixture: entry.fixture })),
        checks: checks.map(c => ({ ...c, problems: [...c.problems] })),
    }
}

/** One block's render as the composition reads it. */
export interface RenderedBlock {
    blockId: string
    rendered: RenderedActivity
    fixture: any
}

/** An instruction's identity for composition: its section, words, status and citations. */
const keyOf = (instruction: Instruction): string => JSON.stringify([instruction.section, instruction.text, instruction.status, [...instruction.from].sort()])

/**
 * **Each role's objective and target region in one block, paired with the same role's in another** — stage 2C, 21 October 2026. His
 * reply filed 22 October 2026, item 7: *"The knowledge can continue to represent the distinct targets and relationships for each block,
 * even where the physical markings remain unchanged."* So a sentence a block says of the building team's target cites that block's own
 * target region, and the other block's same sentence cites the other region. This is the pairing RB-4 and RB-8 already read
 * (`targetedFor`, `attackerOf`, `regionOf`): for every role, the objective of the register's scoring role (`targetOf.role`) whose team
 * is that role's holder in the first block maps to the one whose team is the same role's holder in the second, and the region each
 * references maps likewise. The map is keyed `container[elementId]` (`objectives[...]`, `space.regions[...]`, read from the register's
 * targetOf rows), so a cited path maps by its element and keeps its leaf; every element the map does not name is its own counterpart.
 *
 * It is a pairing and never a merge: every element it names is the counterpart of exactly one, and the elements it maps from are the
 * elements it maps to. Where that does not hold — a role with no objective, or more than one, in a block; a region two roles share —
 * the map is empty, so no sentence pairs and each block's sentences are said under their block, as before this stage.
 *
 * The axis mirror for physical marks the design names (D2: "layout.marks map by x -> L - x") has nothing to map here: no game holds
 * a layout mark yet (stage 2D adds them), and a role-relative element (the marked line, a start placement) is cited by the same path in
 * both blocks.
 */
export function counterpartMap(from: { fixture: any }, to: { fixture: any }, index: RegisterIndex): Map<string, string> {
    const none = new Map<string, string>()
    const spec = index.targetOf
    const objectivesAt = spec ? containerOf(index, spec.objectivesRow) : null
    const regionsAt = spec ? containerOf(index, spec.row) : null
    if (!spec || !objectivesAt || !regionsAt) return none
    const holders = [from, to].map(entry => (entry.fixture?.record?.roleBlock?.holders ?? {}) as Record<string, string>)
    const roles = Object.keys(holders[0]).sort()
    if (!roles.length || !same(roles, Object.keys(holders[1]).sort())) return none
    const attacking = (fixture: any, team: string) => ((read(fixture?.game ?? {}, objectivesAt) ?? []) as any[]).filter(o => o?.[spec.roleLeaf] === spec.role && String(o?.[spec.teamLeaf]) === team)
    const regionOf = (objective: any): string | null => {
        const ref = objective?.[spec.referenceLeaf]?.structuralRef
        return ref ? `c:${ref.contractId}:${ref.itemId}` : null
    }
    const map = new Map<string, string>()
    const pair = (a: string, b: string): boolean => {
        if (map.has(a) && map.get(a) !== b) return false
        map.set(a, b)
        return true
    }
    for (const role of roles) {
        const [here, there] = [attacking(from.fixture, holders[0][role]), attacking(to.fixture, holders[1][role])]
        if (here.length !== 1 || there.length !== 1) return none
        const [a, b] = [regionOf(here[0]), regionOf(there[0])]
        if (!a || !b) return none
        if (!pair(`${objectivesAt}[${here[0].elementId}]`, `${objectivesAt}[${there[0].elementId}]`) || !pair(`${regionsAt}[${a}]`, `${regionsAt}[${b}]`)) return none
    }
    const [keys, values] = [[...map.keys()].sort(), [...map.values()].sort()]
    if (!same(keys, values) || new Set(values).size !== values.length) return none
    return map
}

/** A cited path's counterpart under a pairing: its element's counterpart with the same leaf, or the path itself. */
export function counterpartPath(path: string, map: Map<string, string>): string {
    const close = path.indexOf(']')
    if (close < 0) return path
    const element = map.get(path.slice(0, close + 1))
    return element ? `${element}${path.slice(close + 1)}` : path
}

/** The identity block 1's sentence has in a block it is paired with: the same section, words and status, its citations' counterparts. */
const mirroredKeyOf = (instruction: Instruction, map: Map<string, string>): string => keyOf({ ...instruction, from: instruction.from.map(path => counterpartPath(path, map)) })

/**
 * **One activity from two renders.** A sentence both renders say alike — same section, words, status and citations — is
 * said once; a sentence only one render says is said under its block (`block`). Nothing is reworded, merged or added: every
 * composed sentence is a sentence one of the renders produced, and fidelity Q6 checks exactly that.
 *
 * **And a sentence they say alike by role is said once too** (stage 2C, 21 October 2026): block 1's sentence is paired with the other
 * block's sentence of the same section, words and status whose citations are its citations' counterparts (`counterpartMap`). Block 1's
 * instruction is kept exactly as rendered, with no `block`; the other block's citations are recorded beside it (`counterparts`) and
 * never added to its `from`. A sentence with no such partner is said under its block, as before.
 */
export function composeRoleBlockActivity(blocks: RenderedBlock[], index: RegisterIndex): RenderedActivity {
    const keys = blocks.map(entry => new Set(entry.rendered.instructions.map(keyOf)))
    const everywhere = (key: string) => keys.every(set => set.has(key))
    const maps = blocks.map((entry, i) => (i === 0 ? null : counterpartMap(blocks[0], entry, index)))
    // Stage 2C: block 1's sentences every other block says by role, each with its partners' citations; and, per block, what is said so.
    const counterpartsOf = new Map<Instruction, { blockId: string; from: string[] }[]>()
    const saidByPair = blocks.map(() => new Set<string>())
    for (const instruction of blocks.length > 1 ? blocks[0].rendered.instructions : []) {
        const key = keyOf(instruction)
        if (everywhere(key) || saidByPair[0].has(key)) continue
        const partners = blocks.slice(1).map((entry, n) => {
            const wanted = mirroredKeyOf(instruction, maps[n + 1]!)
            return wanted !== key && !everywhere(wanted) && !saidByPair[n + 1].has(wanted) ? entry.rendered.instructions.find(other => keyOf(other) === wanted) : undefined
        })
        if (partners.some(partner => !partner)) continue
        saidByPair[0].add(key)
        partners.forEach((partner, n) => saidByPair[n + 1].add(keyOf(partner!)))
        counterpartsOf.set(instruction, partners.map((partner, n) => ({ blockId: blocks[n + 1].blockId, from: [...partner!.from] })))
    }
    const composed: Instruction[] = []
    const seen = new Set<string>()
    blocks.forEach((entry, i) => {
        for (const instruction of entry.rendered.instructions) {
            const counterparts = counterpartsOf.get(instruction)
            if (counterparts) {
                composed.push({ ...instruction, counterparts })
                continue
            }
            const key = keyOf(instruction)
            // Said once already, by a pair (stage 2C).
            if (saidByPair[i].has(key)) continue
            const everywhereSaid = everywhere(key)
            const id = everywhereSaid ? key : `${entry.blockId}|${key}`
            if (seen.has(id)) continue
            seen.add(id)
            composed.push(everywhereSaid ? { ...instruction } : { ...instruction, block: blocks[i].blockId })
        }
    })
    // Stage 2A (21 October 2026): in reading order, by section, keeping the order said within each (block 1's sentences, then those
    // only block 2 says); what a coach may adjust stays last, as the tier ordering this replaces kept it.
    const ordered = inSectionOrder(composed)
    return {
        instructions: ordered,
        coachingObservations: [...new Set(blocks.flatMap(entry => entry.rendered.coachingObservations))],
        withheld: blocks.flatMap(entry => entry.rendered.withheld.map(field => ({ ...field }))),
    }
}

/** Wording that says the ends change — refused wherever it appears, because RB-2 proves they do not. */
const ENDS_CHANGE = [/\b(swap|swaps|switch|switches|change|changes|exchange|exchanges|trade|trades)\s+ends\b/i, /\bends\s+(change|swap|switch)\b/i, /\bchange\s+of\s+ends\b/i]

/**
 * **Fidelity Q6 — the composition lost nothing and invented nothing** (stage K3). A VIOLATION where:
 *
 *   - a sentence of either block's render is missing from the activity (or is said under the wrong block);
 *   - a composed sentence is not a sentence of a render, or is said for every block while one render does not say it;
 *   - the ends-fixed statement or the roles statement is missing — his D2: *"Team ends can remain fixed, while
 *     role-specific objectives and target configurations change when the teams exchange roles. Please make that distinction
 *     explicit in the coach-facing instructions."* Read from what each sentence CITES: the ends-fixed statement cites every
 *     role's exchange and every objective's team and reference; the roles statement cites every role;
 *   - any sentence says the ends change.
 *
 * **Stage 2C, 21 October 2026: a sentence said once for blocks that say it alike by role** (`counterparts`, his reply filed 22 October
 * 2026, item 8: *"Correct section assignment, repetition, and information classification in the checked pathway."*). An EXTENSION of
 * what Q6 accepts, backed by its own check: such a sentence says block 1's sentence (its own section, words, status and citations must
 * be in block 1's render) and, for every other block, exactly one counterpart, accepted only where that block's own render says the
 * same section, words and status with exactly the counterpart's citations AND those citations are block 1's under the role pairing
 * (`counterpartMap`). A counterpart that is not accepted says nothing, so that block's sentence is reported lost as well. A sentence
 * said for every block or under one block is checked as before. And a TIGHTENING: a block's sentence said more than once by the
 * activity (directly, under its block or as a counterpart) is a VIOLATION, so saying a sentence once cannot hide a repetition.
 */
export function checkRoleBlockComposition(blocks: RenderedBlock[], composed: RenderedActivity, index: RegisterIndex): FidelityFinding[] {
    const findings: FidelityFinding[] = []
    const keys = blocks.map(entry => new Set(entry.rendered.instructions.map(keyOf)))
    const maps = blocks.map((entry, i) => (i === 0 ? null : counterpartMap(blocks[0], entry, index)))
    // What the composed sentences claim is reported after what the blocks say and the activity does not, in the order Q6 always gave.
    const claimed: FidelityFinding[] = []
    const violation = (what: string) => claimed.push({ question: 6, severity: 'VIOLATION', what })
    // What the activity says for each block, by the block sentence's identity, and how many times.
    const saidFor = blocks.map(() => new Map<string, number>())
    const say = (i: number, key: string) => saidFor[i].set(key, (saidFor[i].get(key) ?? 0) + 1)

    for (const instruction of composed.instructions) {
        const key = keyOf(instruction)
        const counterparts = instruction.counterparts
        if (counterparts !== undefined) {
            if (instruction.block !== undefined) violation(`"${instruction.text}" is said once for every block and also under block ${instruction.block}`)
            if (!keys[0]?.has(key)) violation(`"${instruction.text}" is said as block ${blocks[0]?.blockId}'s sentence, and that block's game does not say it with these citations`)
            if (blocks.length) say(0, key)
            for (const counterpart of counterparts) {
                if (!blocks.slice(1).some(entry => entry.blockId === counterpart.blockId)) violation(`"${instruction.text}" carries a counterpart for block ${counterpart.blockId}, which is not another block of this activity`)
            }
            blocks.slice(1).forEach((entry, n) => {
                const i = n + 1
                const own = counterparts.filter(counterpart => counterpart.blockId === entry.blockId)
                if (own.length !== 1) return violation(`"${instruction.text}" is said once for every block and carries ${own.length} counterparts for block ${entry.blockId}, not one`)
                const counterpartKey = keyOf({ ...instruction, from: own[0].from })
                if (!keys[i].has(counterpartKey)) return violation(`"${instruction.text}" is said for block ${entry.blockId} with citations that block's game does not say it with`)
                if (counterpartKey !== mirroredKeyOf(instruction, maps[i]!)) return violation(`"${instruction.text}": its citations in block ${entry.blockId} are not block ${blocks[0].blockId}'s under the role pairing (each role's objective and target region), so the two are not the same sentence by role`)
                say(i, counterpartKey)
            })
            continue
        }
        if (instruction.block === undefined) {
            if (!keys.every(set => set.has(key))) violation(`"${instruction.text}" is said for every block, and not every block's game says it`)
            blocks.forEach((_, i) => say(i, key))
            continue
        }
        const owner = blocks.findIndex(entry => entry.blockId === instruction.block)
        if (owner < 0 || !keys[owner].has(key)) violation(`"${instruction.text}" is said for block ${instruction.block}, whose game does not say it`)
        if (owner >= 0) say(owner, key)
    }
    blocks.forEach((entry, i) => {
        const reported = new Set<string>()
        for (const instruction of entry.rendered.instructions) {
            const key = keyOf(instruction)
            const times = saidFor[i].get(key) ?? 0
            if (!times) findings.push({ question: 6, severity: 'VIOLATION', what: `block ${blocks[i].blockId} says "${instruction.text}" and the activity does not` })
            else if (times > 1 && !reported.has(key)) findings.push({ question: 6, severity: 'VIOLATION', what: `block ${blocks[i].blockId}'s sentence "${instruction.text}" is said ${times} times by the activity` })
            reported.add(key)
        }
    })
    findings.push(...claimed)

    const spec = index.roleBlocks
    const target = index.targetOf
    const rolesAt = spec ? containerOf(index, spec.rolesRow) : null
    const objectivesAt = target ? containerOf(index, target.objectivesRow) : null
    const exchangeLeaf = spec ? String(index.rows.get(spec.exchangeRow)?.path ?? '').split('[].').pop() : null
    // The role's own field carries the selector attribute that names it (SD-92), so the attribute is its leaf.
    const roleLeaf = spec?.roleAttribute ?? null
    for (const entry of blocks.slice(0, 1)) {
        const game = entry.fixture?.game ?? {}
        const roleElements = rolesAt ? ((read(game, rolesAt) ?? []) as any[]) : []
        const objectives = objectivesAt ? ((read(game, objectivesAt) ?? []) as any[]) : []
        const cites = (instruction: Instruction, paths: string[]) => paths.every(path => instruction.from.includes(path))
        const exchangeAndEnds = [
            ...roleElements.map(element => `${rolesAt}[${element.elementId}].${exchangeLeaf}`),
            ...objectives.flatMap(o => [`${objectivesAt}[${o.elementId}].${target!.teamLeaf}`, `${objectivesAt}[${o.elementId}].${target!.referenceLeaf}`]),
        ]
        const rolesStated = roleElements.map(element => `${rolesAt}[${element.elementId}].${roleLeaf}`)
        if (!composed.instructions.some(i => i.section === ROLE_EXCHANGE && cites(i, exchangeAndEnds))) {
            findings.push({ question: 6, severity: 'VIOLATION', what: 'no sentence says that each team keeps its end while the roles exchange (his D2: "Please make that distinction explicit in the coach-facing instructions.")' })
        }
        if (!composed.instructions.some(i => i.section === ROLE_EXCHANGE && cites(i, rolesStated))) {
            findings.push({ question: 6, severity: 'VIOLATION', what: 'no sentence says which roles the teams hold in a block' })
        }
        /**
         * **And the other half of his distinction: what changes with the roles** (stage K7, 15 October 2026). His D2: *"Team ends can
         * remain fixed, while role-specific objectives and target configurations change when the teams exchange roles."* Wherever the
         * blocks hold positions written for a role holder (`roleKeyedPositions`), a role-exchange sentence must cite every one of them
         * — the sentence that says they are set out again for the new roles. A game with no such position owes nothing here.
         */
        const keyed = roleKeyedPositions(entry.fixture)
        if (keyed.length && !composed.instructions.some(i => i.section === ROLE_EXCHANGE && cites(i, keyed))) {
            findings.push({ question: 6, severity: 'VIOLATION', what: `no sentence says that the markings written for the roles (${keyed.join(', ')}) change when the roles exchange (his D2: "role-specific objectives and target configurations change when the teams exchange roles")` })
        }
    }
    for (const instruction of composed.instructions) {
        if (ENDS_CHANGE.some(pattern => pattern.test(instruction.text))) findings.push({ question: 6, severity: 'VIOLATION', what: `"${instruction.text}" says the ends change; each team keeps its end in both blocks (RB-2)` })
    }
    /**
     * **No team named by who has the ball, in an activity played in role blocks** — K7 review, 15 October 2026, a TIGHTENING. His D7,
     * reply filed 17 October 2026: *"Please use the assigned team roles rather than referring generically to "the defending team," since
     * possession and defensive responsibilities change during play."* Until this only a render test kept such a noun out (the renderer
     * has no words for it), and a sentence naming "the defending team" passed every check (measured on the real A01 rendering). The
     * nouns are the register's own: each designation whose typed resolution follows the possession relation (POSSESSION_RELATION), its
     * name in words, so no team noun is written here.
     */
    const byPossession = [...index.designations.resolutions.entries()]
        .filter(([, resolution]) => resolution.kind === 'POSSESSION_RELATION')
        .map(([name]) => name.toLowerCase().split('_').filter(Boolean).join(' '))
    for (const instruction of composed.instructions) {
        const words = ` ${instruction.text.toLowerCase().split(/[^a-z0-9]+/).join(' ')} `
        const noun = byPossession.find(name => words.includes(` ${name} `) || words.includes(` ${name}s `))
        if (noun) findings.push({ question: 6, severity: 'VIOLATION', what: `"${instruction.text}" names a team as "the ${noun}", which changes with possession; in role blocks a team is named by the role it holds (his D7)` })
    }
    return findings
}
