/**
 * The five fidelity questions, checked against the rendered activity rather than asserted about it.
 *
 * His list, in his order:
 *
 *   1. which concrete-game properties produced each load-bearing coach-facing instruction;
 *   2. whether anything in the rendered activity lacks support from the concrete game;
 *   3. whether anything required by the concrete game disappeared in translation;
 *   4. whether wording changed the STATUS of anything — requirement → suggestion, preference →
 *      requirement, realization choice → derived knowledge;
 *   5. whether a coach could actually lay out and play the game from the rendered output alone.
 *
 * **(2) and (4) are the ones that matter most**, because they are the two that fail quietly. An invented
 * number reads as helpful detail, and a requirement softened to a suggestion reads as friendly coaching.
 * Both are checked structurally: every quantity in the text must appear in the game, and the modality of
 * every sentence must match the status of what produced it.
 */

import { Instruction, RenderedActivity, SourceStatus } from './render-concrete-game'

export interface FidelityFinding {
    question: 1 | 2 | 3 | 4 | 5
    severity: 'VIOLATION' | 'NOTE'
    what: string
}

export interface FidelityReport {
    /** Q1 — instruction to the properties behind it. */
    provenance: { text: string; status: SourceStatus; from: string[] }[]
    findings: FidelityFinding[]
    passed: boolean
}

/** Wording that would make a requirement optional. A requirement carrying any of these is downgraded. */
const HEDGES = [/\bif it suits\b/i, /\bif you (can|like|want|prefer)\b/i, /\btry to\b/i, /\bideally\b/i, /\baround\b/i, /\broughly\b/i, /\bor so\b/i, /\bmay\b/i, /\bcould\b/i, /\boptional\b/i, /\bworks well\b/i]
/** Wording that would make a preference compulsory. A preference carrying any of these is upgraded. */
const IMPERATIVES = [/\bmust\b/i, /\balways\b/i, /\bexactly\b/i, /\brequired\b/i, /\bhas to\b/i, /\bneeds to be\b/i]
/** Wording that would present a realization choice as something the knowledge demanded. */
const NECESSITY = [/\bmust\b/i, /\bthe rules require\b/i, /\bby definition\b/i, /\balways\b/i, /\bnecessarily\b/i]

/** Every number anywhere in the concrete game and its realization record, as a set of strings. */
function quantitiesInGame(fixture: any): Set<string> {
    const found = new Set<string>()
    const walk = (node: unknown) => {
        if (typeof node === 'number' && Number.isFinite(node)) {
            found.add(String(node))
            // A length is often rendered as the width of an interval, so interval arithmetic is honoured.
            return
        }
        if (Array.isArray(node)) return node.forEach(walk)
        if (node && typeof node === 'object') Object.values(node as Record<string, unknown>).forEach(walk)
    }
    walk(fixture.game)
    walk(fixture.envelope)
    walk(fixture.status.geometry)
    // Interval widths: a rendered "40 m long" comes from an interval [0,40], not from a literal 40.
    for (const g of fixture.status.geometry ?? []) {
        const interval = g.geometry?.interval
        if (interval) found.add(String(interval.to - interval.from))
        const preference = g.geometry?.extentBound?.preferenceWithin
        if (preference && typeof preference.min === 'number') {
            found.add(String(preference.min))
            found.add(String(preference.max))
        }
    }
    return found
}

/**
 * Properties established by the game that a coach does NOT act on, with the reason in each case.
 *
 * This list is the one place where I decide something established need not reach a coach, so it is
 * explicit, narrow and reported in the output rather than silently filtered. A path qualifies only if
 * it governs how the SYSTEM accounts for events, not how the game is laid out or played. Anything a
 * coach would have to do, say, mark, count or decide differently stays load-bearing.
 */
const NOT_COACH_FACING: { suffix: string; because: string }[] = [
    {
        suffix: '.startsEpisode',
        because:
            'an episode boundary is an event-accounting property: it tells the system when to start attributing ' +
            'events, and a coach does nothing differently because of it. The coach-facing half of the same ' +
            'transition — that play continues — IS carried.',
    },
    {
        suffix: 'space.axis',
        because: 'an internal orientation convention naming which envelope dimension is the axis; the rendered geometry is already in metres along and across.',
    },
]

/** Game properties a coach must be told about. Absence from the rendering is a loss. */
function loadBearingPaths(fixture: any): { coachFacing: string[]; excluded: { path: string; because: string }[] } {
    const coachFacing: string[] = []
    const excluded: { path: string; because: string }[] = []
    for (const entry of [...fixture.status.derived, ...fixture.status.choices]) {
        const rule = NOT_COACH_FACING.find(r => entry.path.endsWith(r.suffix) || entry.path === r.suffix)
        if (rule) excluded.push({ path: entry.path, because: rule.because })
        else coachFacing.push(entry.path)
    }
    return { coachFacing, excluded }
}

/**
 * A quantity is supported if the game contains it as a value, OR if it is the size of a collection the
 * instruction cites. "2 teams" is not an invention — the game contains two team members — but the 2 is a
 * cardinality rather than a stored value, so it needs its own narrow justification. Counting the members
 * of a cited collection is the only arithmetic permitted; nothing else may be computed into the prose.
 */
function supportedQuantity(fixture: any, instruction: Instruction, quantity: number, inGame: Set<string>): boolean {
    if (inGame.has(String(quantity))) return true
    for (const path of instruction.from) {
        const collection = path.split('.').reduce<any>((node, key) => (node == null ? node : node[key]), fixture.game)
        if (Array.isArray(collection) && collection.length === quantity) return true
    }
    return false
}

export function checkFidelity(fixture: any, rendered: RenderedActivity): FidelityReport {
    const findings: FidelityFinding[] = []
    const cited = new Set(rendered.instructions.flatMap(i => i.from))
    const inGame = quantitiesInGame(fixture)

    // ── Q2 — nothing unsupported ────────────────────────────────────────────────────────────────
    for (const instruction of rendered.instructions) {
        if (!instruction.from.length) {
            findings.push({ question: 2, severity: 'VIOLATION', what: `"${instruction.text}" cites no concrete-game property` })
        }
        for (const quantity of instruction.quantities) {
            if (!supportedQuantity(fixture, instruction, quantity, inGame)) {
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: `"${instruction.text}" states ${quantity}, which appears nowhere in the concrete game`,
                })
            }
        }
        // A number in the prose that the instruction did not declare is unchecked, which is as bad as
        // an invented one: it means a quantity reached a coach without passing this test.
        for (const match of instruction.text.matchAll(/\b(\d+(?:\.\d+)?)\b/g)) {
            if (!instruction.quantities.map(String).includes(match[1])) {
                findings.push({
                    question: 2,
                    severity: 'VIOLATION',
                    what: `"${instruction.text}" contains the number ${match[1]} without declaring it, so it was never checked against the game`,
                })
            }
        }
    }

    // ── Q3 — nothing lost ───────────────────────────────────────────────────────────────────────
    const { coachFacing, excluded } = loadBearingPaths(fixture)
    for (const path of coachFacing) {
        if (![...cited].some(c => c === path)) {
            findings.push({ question: 3, severity: 'VIOLATION', what: `${path} is established by the game and no instruction carries it` })
        }
    }
    // Reported, not hidden: every property I judged not to need carrying, and why.
    for (const entry of excluded) {
        if (cited.has(entry.path)) continue
        findings.push({
            question: 3,
            severity: 'NOTE',
            what: `${entry.path} is established and deliberately not carried to the coach — ${entry.because}`,
        })
    }
    // An instantiated member is load-bearing too: a coach cannot field a team the rendering omits.
    if (fixture.status.instantiations.length && !cited.has('performers.teams')) {
        findings.push({ question: 3, severity: 'VIOLATION', what: 'teams were instantiated and the rendering does not mention them' })
    }

    // ── Q4 — no status changed by wording ───────────────────────────────────────────────────────
    for (const instruction of rendered.instructions) {
        const hedged = HEDGES.some(r => r.test(instruction.text))
        if ((instruction.status === 'DERIVED' || instruction.status === 'INSTANTIATED') && hedged) {
            findings.push({
                question: 4,
                severity: 'VIOLATION',
                what: `a ${instruction.status} requirement is worded as optional: "${instruction.text}"`,
            })
        }
        if (instruction.status === 'PREFERENCE') {
            if (IMPERATIVES.some(r => r.test(instruction.text))) {
                findings.push({ question: 4, severity: 'VIOLATION', what: `a PREFERENCE is worded as compulsory: "${instruction.text}"` })
            }
            if (!hedged) {
                findings.push({ question: 4, severity: 'VIOLATION', what: `a PREFERENCE carries no hedge, so it reads as a requirement: "${instruction.text}"` })
            }
        }
        if (instruction.status === 'REALIZATION_CHOICE' && NECESSITY.some(r => r.test(instruction.text))) {
            findings.push({
                question: 4,
                severity: 'VIOLATION',
                what: `a realization CHOICE is worded as though the knowledge demanded it: "${instruction.text}"`,
            })
        }
    }

    // ── Q5 — a coach could lay it out and play it ───────────────────────────────────────────────
    const sections = new Set(rendered.instructions.map(i => i.section))
    for (const required of ['Set up', 'Players', 'How to score'] as const) {
        if (!sections.has(required)) {
            findings.push({ question: 5, severity: 'VIOLATION', what: `nothing tells the coach "${required}"` })
        }
    }
    // Every physical element the game contains must have a MARKING instruction — one that carries the
    // region's noun, which is what produces "mark a <noun>". Any-instruction-citing-the-region is too weak
    // a test: a preference about a channel's width cites the channel and marks nothing.
    for (const region of fixture.game.space?.regions ?? []) {
        const nounPath = `space.regions[${region.elementId}].noun`
        const marked = rendered.instructions.some(
            i => i.section === 'Set up' && i.status !== 'PREFERENCE' && i.from.includes(nounPath),
        )
        if (!marked) {
            findings.push({ question: 5, severity: 'VIOLATION', what: `region ${region.elementId} exists in the game and has no marking instruction` })
        }
    }
    // A coach needs team sizes to pick sides. This is a NOTE and not a VIOLATION because the rendering is
    // faithful — the number is absent from the GAME. Q5 is the question it fails, and it fails it honestly.
    const teams = fixture.game.performers?.teams ?? []
    if (teams.length && !teams.every((t: any) => Number.isFinite(t.outfieldCount))) {
        findings.push({
            question: 5,
            severity: 'NOTE',
            what:
                `no team carries \`outfieldCount\`, so the rendering can state the squad total and the number of teams but not ` +
                `how many play per side — a coach cannot pick sides from this output alone. The game, not the rendering, is missing it.`,
        })
    }

    return { provenance: rendered.instructions.map(i => ({ text: i.text, status: i.status, from: i.from })), findings, passed: !findings.some(f => f.severity === 'VIOLATION') }
}
