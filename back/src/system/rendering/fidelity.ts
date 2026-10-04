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
 * Properties established by the game that need no coach-facing expression.
 *
 * **His rule of 1 October, which this encodes rather than paraphrases:**
 *
 *   > *An established property does not require coach-facing expression when it is exclusively
 *   > computational/accounting metadata and all of its operational consequences are already faithfully
 *   > represented in coach-facing instructions.*
 *
 * It has two conditions, and the second is the one that does the work. Claiming a property is metadata is
 * cheap; proving that its operational consequences reached the coach is not. So each exclusion must name
 * the property paths that carry its consequences, and the checker **verifies that an instruction actually
 * cites each of them**. An exclusion whose consequences are not in the rendering is reported as a loss,
 * not honoured — which means this list cannot be used to quietly drop something load-bearing.
 *
 * `consequences: []` asserts there are none to represent, and is only defensible for a property that
 * changes nothing a coach does — an internal convention rather than a rule of the game.
 *
 * He also asked that exclusions stay explicit and auditable: *"I do not want silent filtering."* Every
 * entry is reported in the output with its reason and its discharge, whether or not it passes.
 */
const NO_COACH_FACING_EXPRESSION: { suffix: string; because: string; consequences: string[] }[] = [
    {
        suffix: '.startsEpisode',
        because:
            'an episode boundary is event-accounting metadata: it tells the system when to begin attributing ' +
            'events, and a coach does nothing differently because of it',
        // Its one operational consequence — that a turnover does not stop play — is carried by the
        // playState instruction, so the second condition of his rule is discharged by naming it.
        consequences: ['transitions[c:restated:GF2:GF2-07.a].playState'],
    },
    {
        suffix: 'space.axis',
        because:
            'an internal orientation convention naming which envelope dimension is the axis; it has no ' +
            'operational consequence of its own because the rendered geometry is already in metres along and across',
        consequences: [],
    },
]

/** Game properties a coach must be told about. Absence from the rendering is a loss. */
function loadBearingPaths(fixture: any): {
    coachFacing: string[]
    excluded: { path: string; because: string; consequences: string[] }[]
} {
    const coachFacing: string[] = []
    const excluded: { path: string; because: string; consequences: string[] }[] = []
    for (const entry of [...fixture.status.derived, ...fixture.status.choices]) {
        const rule = NO_COACH_FACING_EXPRESSION.find(r => entry.path.endsWith(r.suffix) || entry.path === r.suffix)
        if (rule) excluded.push({ path: entry.path, because: rule.because, consequences: rule.consequences })
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

/**
 * **Does this physical feature do anything in the game?** His ruling of 1 October, in his words:
 *
 *   > *Every physical game feature that a coach is instructed to create must participate in at least one
 *   > established operational relationship in the game. That could be scoring, eligibility/access, value
 *   > modification, transition behavior, information, or another represented game relationship. It does not
 *   > necessarily require a prose description saying what the region is "for."*
 *
 * So this deliberately does NOT look at the `functions` row. A region whose `functions` is excluded may
 * still be fully realized operationally — by being a scoring target, by modifying value, by triggering a
 * transition, by being the subject of an information rule. And a region carrying a decorative function
 * string would still not be realized if nothing in the game changes when players interact with it.
 *
 *   > *If the game establishes a channel geometrically but nothing establishes what changes when
 *   > players/ball interact with it, then the channel is structurally present but not functionally
 *   > realized. Rendering should not invent its purpose, and I don't think we should call the resulting
 *   > output a runnable coach activity.*
 *
 * Hence a VIOLATION rather than a note: the rendering is faithful, and the activity is not runnable.
 *
 * A reference may name the region by its element id or by the authored item id the element id ends with —
 * `objectives[].reference` carries `{structuralRef: {contractId, itemId}}`, and the itemId is the authored
 * `GF2-03.a` while the element is `c:restated:GF2:GF2-03.a`. Both forms count.
 */
function operationalRelationships(fixture: any, elementId: string): string[] {
    const itemId = String(elementId).split(':').pop() ?? elementId
    const found: string[] = []

    const walk = (node: unknown, path: string) => {
        // A region's own entry describes it; it cannot be the relationship that gives it a purpose.
        if (path.startsWith('space.regions')) return
        if (typeof node === 'string') {
            if (node === elementId || node === itemId) found.push(path)
            return
        }
        if (Array.isArray(node)) return node.forEach((entry, i) => walk(entry, `${path}[${i}]`))
        if (node && typeof node === 'object') {
            for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
                walk(value, path ? `${path}.${key}` : key)
            }
        }
    }
    walk(fixture.game, '')
    return found
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
    /**
     * Every exclusion is reported — he asked for no silent filtering — and **each one must discharge the
     * second half of his rule**: the operational consequences it names must actually be cited by some
     * instruction. An exclusion whose consequences did not reach the coach is a VIOLATION, because then the
     * property was not merely accounting metadata, and dropping it lost something a coach needed.
     */
    for (const entry of excluded) {
        if (cited.has(entry.path)) continue
        const undischarged = entry.consequences.filter(path => !cited.has(path))
        if (undischarged.length) {
            findings.push({
                question: 3,
                severity: 'VIOLATION',
                what:
                    `${entry.path} was excluded as accounting metadata, but its operational consequence(s) ` +
                    `${undischarged.join(', ')} reached no instruction — so the exclusion is not permitted`,
            })
            continue
        }
        findings.push({
            question: 3,
            severity: 'NOTE',
            what:
                `${entry.path} is established and deliberately given no coach-facing expression — ${entry.because}. ` +
                (entry.consequences.length
                    ? `Its operational consequence(s) are carried by ${entry.consequences.join(', ')}.`
                    : 'It has no operational consequence to carry.'),
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
            continue
        }
        // Marked, therefore a physical feature the coach is instructed to create — so it must do something.
        const relationships = operationalRelationships(fixture, region.elementId)
        if (!relationships.length) {
            findings.push({
                question: 5,
                severity: 'VIOLATION',
                what:
                    `a coach is instructed to mark ${region.elementId}, and nothing in the concrete game establishes what ` +
                    `changes when players or the ball interact with it — no scoring, access, value modification, transition ` +
                    `or information relationship references it. It is structurally present but not functionally realized, ` +
                    `so this output is not a runnable coach activity.`,
            })
        } else {
            findings.push({
                question: 5,
                severity: 'NOTE',
                what: `${region.elementId} participates operationally via ${relationships.join(', ')}`,
            })
        }
    }
    /**
     * **A scoring rule a coach cannot tell they have satisfied is operationally obscured.**
     *
     * His original question for this pass was whether the rendering loses, invents, contradicts **or
     * operationally obscures** anything established. This is the fourth of those, and it is the one that
     * passes every other test: the game establishes the whole consequence — a region condition over two named
     * channels, MULTIPLY, magnitude 2 — so nothing is lost and nothing invented, and the channels do
     * participate operationally, so the participation requirement is satisfied. And a coach still cannot
     * award the bonus, because nothing establishes what counts as a qualifying interaction with a channel.
     *
     * `REGION_ENTRY` carries no registered `triggerSemantics`, and the authoring note states the gap in its
     * own words: *"no rule for what counts as 'moving through' (ball, player, touch)"*. So the criterion is
     * an owner value, deliberately held, and rendering must not choose ball, player or touch to make the
     * output look runnable.
     */
    for (const modifier of fixture.game.value?.valueModifiers ?? []) {
        const carried = rendered.instructions.some(i => i.from.some(f => f.includes(String(modifier.elementId))))
        if (!carried) continue
        /**
         * **This no longer pretends to consult trigger semantics.** It used to read the semantics block and
         * test `Object.keys(...).length > 0`, which is true merely because one entry exists — so the block was
         * named but never consulted, and the check really only tested `satisfiedBy`. Corrected on his ruling of
         * 4 October, scoped exactly as he asked and no further.
         *
         * A per-trigger lookup is not available here and saying so is the honest state: a value modifier's
         * condition names no trigger at all — Wide Zone's is typed `region` — so there is no trigger whose
         * semantics could be looked up. What the condition lacks is a criterion for what MEETS it, which is the
         * held owner decision. This changes no verdict; it stops the check claiming a consultation it never made.
         */
        const satisfied = modifier.condition?.satisfiedBy !== undefined
        if (!satisfied) {
            findings.push({
                question: 5,
                severity: 'VIOLATION',
                what:
                    `a coach is told that meeting the ${modifier.condition?.type ?? 'region'} condition changes the score, and nothing in the ` +
                    `game establishes what MEETS it — no registered trigger semantics and no authored criterion. The scoring rule is ` +
                    `complete and unusable: the consequence is established, the qualifying interaction is not, so a coach cannot tell ` +
                    `when to award it. Rendering will not choose one.`,
            })
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
