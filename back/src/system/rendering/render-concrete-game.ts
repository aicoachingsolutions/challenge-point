/**
 * Rendering one validated concrete game into a coach-usable activity — faithfully.
 *
 * The question this exists to answer is his, and it is narrower than "can we write an activity":
 *
 *   > *Can Challenge Point transform this already-validated concrete game into a coach-usable activity
 *   > without losing, inventing, contradicting, or operationally obscuring anything established in the
 *   > concrete game?*
 *
 * So **the concrete game is authoritative for what physically exists and how the game works.** Rendering
 * may translate it into natural language and organise it for a coach; it may not silently complete,
 * improve, reinterpret or redesign it. That asymmetry is the whole design:
 *
 *   - every instruction carries the **property paths** that produced it, so nothing can appear without a
 *     source;
 *   - every instruction carries the **status** of its source — derived knowledge, a realization choice, a
 *     preference, an instantiated member — and its wording is generated **from** that status rather than
 *     chosen and checked afterwards. A preference cannot be worded as a requirement because the
 *     requirement wording is not available to it;
 *   - nothing is numbered, named or quantified except from a value in the game.
 *
 * **And where the game produces something a coach would question, that is reported, not repaired.** His
 * instruction: *"If the concrete game itself produces something undesirable from a coaching or [sport]
 * perspective, please return that as evidence rather than repairing it in prose. At this stage, fidelity
 * is more important than making the activity look better."* A renderer that tidied the game would hide
 * the one thing this pass is for. (The sport he named is bracketed out only because this module sits above
 * the sport layer and the coupling ratchet correctly refuses to let a sport be named here.)
 *
 * **SD-103, ruled 7 October, is the governing rule for everything below — and it was ruled because this
 * file broke it twice.**
 *
 *   > *Coach-facing language must be entailed by the resolved game and the rules it communicates. A
 *   > renderer may compress or combine supported facts, but it may not introduce an unsupported game fact
 *   > merely because that fact is obvious in the sport.*
 *
 * The two breaches were measured, not suspected. The scoring instruction hardcoded the English word for
 * whatever crosses the line and cited the scoring event for it, so it told coaches about a ball for weeks
 * while the representation established none. The possession-change instruction was gated on a transition's
 * play state alone, so it fired for ANY transition that continued play and asserted that possession was
 * what changed — it survived changing the trigger, and it survived deleting the possession relation from
 * the game outright. Neither was caught, because the fidelity check validates numbers appearing in prose
 * and never nouns: **an invented NOUN passes unchecked.** Both are repaired in place below, each by reading
 * its noun or its precondition from the game and citing it.
 *
 * The standing rule that follows from that: **if a sentence here names something in the game, the name
 * comes from the game and the path is cited.** "Obvious in the sport" is not a source.
 */
import { effectiveValue } from '../derivation/rational'
import { approvedWording, ApprovedWording, WordingMatch } from './approved-wording'

/**
 * Where a rendered instruction's authority comes from, and what wording that permits.
 *
 * **Three statuses replaced one on 14 October 2026** (Step 4, component 2, rendered). Christian that day:
 * *"Preserve whether each condition is required, preferred, advisory, or left to the coach, all the way through
 * rendering and validation."* And: *"A default should not automatically become a requirement simply because it
 * is the only authored value … Once a default is selected for a particular activity, the coach should receive a
 * clear description of the starting configuration, without implying that it cannot be adjusted."* Until then a
 * derived value was DERIVED whatever bound it — so the possession game's authored preferred default, that play
 * continues at a turnover, was stated as a rule of the game — and every realization choice was one status,
 * `REALIZATION_CHOICE`, said with *"For this activity, …"*, which he asked us to stop repeating. Now the status
 * is read from what the fixture carries: a derived value's `strength`, a choice's `closure`.
 */
export type SourceStatus =
    /** Derived from selected knowledge and REQUIRED by it — a requirement of the game. Imperative wording. */
    | 'DERIVED'
    /**
     * Where THIS activity starts: a value realization closed inside authored bounds, or a derived value every
     * supporting item authors as a preferred default. Said plainly, as a fact about the activity; never with a
     * word of necessity, so it is never presented as something that cannot be adjusted.
     */
    | 'STARTING'
    /**
     * Supported only by knowledge the rule could stand without (strength `ADVISORY`: strictness SUPPORTING with a
     * required or N/A value status). A recommendation: hedged, never imperative. **The mapping awaits his ruling
     * (OD2)**; it is rendered so he can see every sentence it affects.
     */
    | 'ADVISORY'
    /** Left to the coach (`closure: COACH_DECIDES`). Put to the coach as a choice; never as a necessity. */
    | 'COACH_CHOICE'
    /** Authored as preferred guidance. Hedged wording only; never imperative. */
    | 'PREFERENCE'
    /** A member realization instantiated to satisfy an existential claim. */
    | 'INSTANTIATED'
    /** Session context the coach supplied. */
    | 'SESSION'

/**
 * **The part of an activity a coach reads after the starting setup** — 14 October 2026, his §7: *"My preference
 * is that the main activity present a clear starting setup and playing instructions. Alternative ranges,
 * adjustments, and supporting explanations can be presented separately when useful."* Ranges a coach may move
 * within, preferences, and the limits of a value the activity only starts at go here. The section name is a
 * DRAFT for his review.
 */
export const ADJUSTING = 'Adjusting the activity'

export interface Instruction {
    /** Which part of the activity this belongs to. Organisation only; carries no authority. */
    section: 'Set up' | 'Players' | 'How it works' | 'How to score' | 'What to watch' | typeof ADJUSTING
    text: string
    status: SourceStatus
    /** Concrete-game property paths that produced it. Empty is a defect, not a style choice. */
    from: string[]
    /** Any number appearing in `text`, so a checker can verify each one came from the game. */
    quantities: number[]
    /**
     * `setup` for the starting setup and playing instructions; `adjust` for what a coach may change from there.
     * Always the section's own reading (`adjust` exactly where the section is "Adjusting the activity"), set in
     * one place as the renderer returns, so the two cannot disagree. Optional only for instructions built by hand.
     */
    tier?: 'setup' | 'adjust'
}

export interface RenderedActivity {
    instructions: Instruction[]
    /** Observations about the game a coach would question. Reported, never acted on. */
    coachingObservations: string[]
    /**
     * **What the game establishes and this renderer may not yet say** — added 14 October 2026 (Step 4,
     * component 3). A primary-event condition, an information rule, or a part of a value modifier that no
     * approved sentence covers is listed here rather than paraphrased, and an activity with anything here is
     * refused at communication. Christian that day: *"Enable accurate coach-facing communication of scoring
     * conditions and information rules, using approved language."*
     */
    withheld: WithheldField[]
}

/** One field held back from a coach until there is approved wording for it. */
export interface WithheldField {
    /** The concrete-game path of the field. */
    path: string
    /** The register row it sits on. */
    row: string
    reason: 'AWAITING_APPROVED_WORDING'
}

type Fixture = any

/**
 * **A length is printed as the number the game holds — never rounded for display.** Corrected 13 October.
 *
 * This rounded to one decimal place. On a 25 m width a channel's required maximum is 0.25 × 25 = 6.25 m,
 * the game holds 6.25, and the activity said *"6.3 m"* — a number that is nowhere in the game, which the
 * fidelity check correctly refused, so the mechanism demonstration was served at 40 × 30 and refused at
 * 30 × 25 and 20 × 15 for nothing but its own rounding. A rounded number is a number on the renderer's
 * authority. Realization multiplies fractions exactly (`scaleExactly`), so what it holds is already the
 * decimal a coach should read.
 */
const metres = (n: number): string => `${n} m`

/**
 * Wording is a function of status, so a status cannot be misrepresented by phrasing.
 *
 * `DERIVED` and `INSTANTIATED` get the imperative, because the game requires them. `STARTING` and
 * `COACH_CHOICE` are said plainly — 14 October 2026, they replace `REALIZATION_CHOICE` and its *"For this
 * activity, …"*, which he asked us to stop repeating (*"I would also avoid repeatedly beginning sentences with
 * 'For this activity'"*); what keeps them from reading as requirements is that no word of necessity is
 * available to them, which the fidelity check enforces (Q4). `ADVISORY` gets "It helps if …", a recommendation
 * that cannot be read as a rule. `PREFERENCE` gets "if it suits your group", which cannot be read as a
 * requirement. There is no path by which a preference or a recommendation reaches imperative wording.
 */
function phrase(status: SourceStatus, core: string): string {
    switch (status) {
        case 'DERIVED':
        case 'INSTANTIATED':
        case 'SESSION':
        case 'STARTING':
        case 'COACH_CHOICE':
            return core
        case 'ADVISORY':
            return `It helps if ${core.charAt(0).toLowerCase()}${core.slice(1)}`
        case 'PREFERENCE':
            return `${core}, if it suits your group`
    }
}

/** The status a derived value's carried strength gives its sentence. A value carrying none reads as before: required. */
const STATUS_OF_STRENGTH: Record<string, SourceStatus> = { REQUIRED: 'DERIVED', DEFAULT: 'STARTING', ADVISORY: 'ADVISORY' }

/**
 * Of several statuses one sentence rests on, the strongest — the rule the strength itself follows (a stronger
 * requirement wins). A sentence that cites a required value and a default states a requirement.
 */
const STRENGTH_ORDER: SourceStatus[] = ['DERIVED', 'INSTANTIATED', 'SESSION', 'STARTING', 'COACH_CHOICE', 'ADVISORY', 'PREFERENCE']
const strongest = (statuses: SourceStatus[], fallback: SourceStatus): SourceStatus =>
    statuses.length ? statuses.reduce((a, b) => (STRENGTH_ORDER.indexOf(a) <= STRENGTH_ORDER.indexOf(b) ? a : b)) : fallback

// ── One way of saying a range ───────────────────────────────────────────────────────────────────

/** The two ends of a range. A null end is an end nobody authored. */
export interface Limits {
    min: number | null
    max: number | null
}

/**
 * A line of the game that carries an authored range, as a coach would be told it.
 *
 * Christian, 13 October 2026: *"I agree with preserving authored ranges, selected starting values,
 * alternatives, and the reasons for those selections throughout realization and communication … The initial
 * activity should establish a purposeful starting environment, not prescribe an ideal configuration for the
 * entire session."* And, on what may not be softened: *"If a condition materially affects the activity, it
 * must be represented and communicated accurately."*
 *
 * The three parts are three different things and are never merged: what is REQUIRED, what is PREFERRED
 * inside it, and where THIS activity starts. All three are in the unit the coach is given — metres for an
 * extent, a bare number for a count — and each is a number the game holds: nothing here is worked out.
 */
export interface BoundedLine {
    /** The concrete-game path the range is about. Every sentence about it cites this. */
    path: string
    required: Limits | null
    /** The preferred range as it may be OFFERED: already expressed inside the requirement. */
    preferred: Limits | null
    /** The value realization closed the line to, where it closed it inside a range. */
    starting: number | null
}

/** How a range is put into words for one kind of line. Each template is given the phrase and the numbers behind it. */
export interface RangeWords {
    /** One number as it is said: `4.5 m` for a length, `2` for a count. */
    number: (n: number) => string
    /** The requirement, around its limits — `between 4.5 m and 7.5 m`, `at least 1`, `up to 6`. */
    required?: (limits: string, range: Limits) => string
    /** The preference, around its range — `Around 6 m to 7.5 m`. The hedge is added by its status, not here. */
    preferred?: (range: string, limits: Limits) => string
    /** Where this activity starts, said as a STARTING fact. */
    starting?: (value: string, n: number) => string
    /**
     * Where each part is said, where it is not the section the range was asked for: the preference and the
     * limits of a value the activity only starts at belong with what a coach may adjust (14 October 2026).
     */
    sections?: { required?: Instruction['section']; preferred?: Instruction['section'] }
    /** The status of the sentence that carries the requirement, where it is not simply derived. */
    requiredStatus?: SourceStatus
    /** Whatever else the requirement's sentence states, when it is also (say) the marking sentence. */
    requiredAlso?: { from: string[]; quantities: number[] }
    /** Whatever else the starting value's sentence states — the total it is a part of, say. */
    startingAlso?: { from: string[]; quantities: number[] }
}

export interface RangeSentences {
    required: Instruction | null
    preferred: Instruction | null
    starting: Instruction | null
}

const stated = (n: number | null): n is number => typeof n === 'number' && Number.isFinite(n)

/** `between A and B`, `at least A`, `up to B` — or the one value, where the two ends meet. BOTH ends, where both are authored. */
function limitsPhrase(limits: Limits, number: (n: number) => string): { text: string; quantities: number[] } | null {
    const { min, max } = limits
    if (stated(min) && stated(max)) return min === max ? { text: number(min), quantities: [min] } : { text: `between ${number(min)} and ${number(max)}`, quantities: [min, max] }
    if (stated(min)) return { text: `at least ${number(min)}`, quantities: [min] }
    if (stated(max)) return { text: `up to ${number(max)}`, quantities: [max] }
    return null
}

/** `Around A to B` — the only shape a preferred range is offered in, so it can never borrow a requirement's words. */
function aroundPhrase(limits: Limits, number: (n: number) => string): { text: string; quantities: number[] } | null {
    const { min, max } = limits
    if (stated(min) && stated(max)) return min === max ? { text: `Around ${number(min)}`, quantities: [min] } : { text: `Around ${number(min)} to ${number(max)}`, quantities: [min, max] }
    if (stated(min)) return { text: `Around ${number(min)} or more`, quantities: [min] }
    if (stated(max)) return { text: `Up to around ${number(max)}`, quantities: [max] }
    return null
}

const instruction = (section: Instruction['section'], status: SourceStatus, core: string, from: string[], quantities: number[]): Instruction => ({
    section,
    text: phrase(status, core),
    status,
    from,
    quantities,
})

/**
 * **The one way a range reaches a coach** — for a region's width today, and for any count or threshold that
 * comes to carry one.
 *
 * It generalises a block that existed for a single case: a channel's preferred width was offered as
 * *"Around A to B wide works well"*, and nothing else that carried a range could say so. Three sentences at
 * most, and the status of each is fixed by which part of the range it states — so the wording cannot blur
 * them:
 *
 *   - the REQUIRED limits, as a requirement, stating BOTH ends where both are authored. The channel sentence
 *     used to say *"up to 7.5 m wide"* and never the minimum his ruling of 1 October sets beside it;
 *   - the PREFERRED range, as a preference, hedged by its status;
 *   - the STARTING value, as a fact about this activity.
 *
 * It returns the sentences rather than issuing them, because where they sit among a section's other
 * sentences is the caller's to decide — the requirement is often the marking sentence itself. A part with
 * no wording supplied is not said, and a part the line does not carry is not there to say.
 */
export function sayRange(section: Instruction['section'], line: BoundedLine, words: RangeWords): RangeSentences {
    const limits = line.required && words.required ? limitsPhrase(line.required, words.number) : null
    const around = line.preferred && words.preferred ? aroundPhrase(line.preferred, words.number) : null
    return {
        required: limits
            ? instruction(words.sections?.required ?? section, words.requiredStatus ?? 'DERIVED', words.required!(limits.text, line.required!), [...(words.requiredAlso?.from ?? []), line.path].filter((p, i, all) => all.indexOf(p) === i), [
                  ...(words.requiredAlso?.quantities ?? []),
                  ...limits.quantities,
              ])
            : null,
        preferred: around ? instruction(words.sections?.preferred ?? section, 'PREFERENCE', words.preferred!(around.text, line.preferred!), [line.path], around.quantities) : null,
        starting:
            stated(line.starting) && words.starting
                ? instruction(
                      section,
                      'STARTING',
                      words.starting(words.number(line.starting), line.starting),
                      [line.path, ...(words.startingAlso?.from ?? [])].filter((p, i, all) => all.indexOf(p) === i),
                      [line.starting, ...(words.startingAlso?.quantities ?? [])],
                  )
                : null,
    }
}

/**
 * The range a COUNT line carries, read from the authored bounds that crossed the boundary with it: the
 * bounds a choice was made `within`, and the bounds that sit beside a derived value (`status.bounds`).
 *
 * A count is in its own units, so nothing is scaled and nothing is worked out: every number here is one an
 * authored bound states. Where several bounds state the same end, the binding one is taken — the greatest
 * minimum, the least maximum — and the preference is offered only as far as it lies inside the requirement,
 * his rule of 1 October that it *"must never override or widen the requirement"*. A bound that is a fraction
 * of an axis is an extent and is not read here; an exclusion's bound says what a line may not be and is no
 * part of any range.
 */
function countRange(fixture: Fixture, path: string): BoundedLine | null {
    const choice = (fixture.status.choices ?? []).find((c: any) => c.path === path)
    const beside = (fixture.status.bounds ?? []).filter((entry: any) => entry.path === path).flatMap((entry: any) => entry.bounds ?? [])
    const counts = [...(choice?.within?.bounds ?? []), ...beside].filter((b: any) => b && b.kind === 'COUNT' && !b.forbidden && !b.fractionOfAxis)
    const binding = (bounds: any[]): Limits | null => {
        const mins = bounds.map(b => b.min).filter(stated)
        const maxes = bounds.map(b => b.max).filter(stated)
        return mins.length || maxes.length ? { min: mins.length ? Math.max(...mins) : null, max: maxes.length ? Math.min(...maxes) : null } : null
    }
    const required = binding(counts.filter((b: any) => !b.preferred))
    const preference = binding(counts.filter((b: any) => b.preferred))
    const offered = preference ? binding([...(required ? [required] : []), preference]) : null
    const preferred = offered && !(stated(offered.min) && stated(offered.max) && offered.min > offered.max) ? offered : null
    const starting = choice && choice.closure === 'STARTING_VALUE_IN_RANGE' && stated(choice.value) ? choice.value : null
    return required || preferred || starting !== null ? { path, required, preferred, starting } : null
}

/**
 * A possession-relative team designation, as a coach would say it — given the noun of what is possessed.
 *
 * Only the two designations the possession relation alone decides are worded. Every other designation
 * (the team that scored, the team that touched last, a named team) needs a fact this sentence does not
 * have, so a value outside this table is withheld and reported, never paraphrased.
 */
const SIDE_BY_POSSESSION: Record<string, (carrier: string) => string> = {
    ATTACKING_TEAM: carrier => `whichever team has the ${carrier}`,
    DEFENDING_TEAM: carrier => `whichever team does not have the ${carrier}`,
}

/**
 * A participation state, as a coach would say it of a group. `plural` is whether the group is more than one.
 *
 * One wording, for the one state a game in the corpus establishes. The state is a member of a closed
 * vocabulary, and the gloss names only what that vocabulary rules out by the state being this one. A state
 * with no wording here is withheld and reported, so it cannot be served half-said.
 */
const PARTICIPATION_STATE: Record<string, (plural: boolean) => string> = {
    ACTIVE: plural => `${plural ? 'are' : 'is'} active in the game — not waiting, resting or watching`,
}

/**
 * The range a realized extent carries, read from what realization recorded beside the interval: the
 * requirement in metres on this envelope (`requiredWithin`) and the preference expressed inside it
 * (`preferenceWithin`). A preference realization found incompatible with the requirement is not offered —
 * his rule of 1 October: it *"must never override or widen the requirement"*.
 *
 * A fixture frozen before 13 October holds no `requiredWithin`, so it yields no requirement here and its
 * sentence falls back to the widest permitted extent, as it always read. Nothing is computed to fill it in.
 */
function extentRange(entry: any): BoundedLine | null {
    const bound = entry?.geometry?.extentBound
    if (!entry?.path || !bound) return null
    const within = bound.preferred ? null : bound.requiredWithin
    const required: Limits | null = within && (stated(within.min) || stated(within.max)) ? { min: stated(within.min) ? within.min : null, max: stated(within.max) ? within.max : null } : null
    const preference = bound.preferenceWithin
    const preferred: Limits | null = preference && preference.compatible !== false && stated(preference.min) ? { min: preference.min, max: stated(preference.max) ? preference.max : null } : null
    return required || preferred ? { path: entry.path, required, preferred, starting: null } : null
}

/**
 * **The fields only approved wording may say**, by register row (V4-V6 for a primary-event condition, V16-V22
 * for an information rule). Paths and rows are the register's; nothing here names a sport.
 */
const WORDED_ONLY: { base: string; elements: (game: any) => unknown; fields: { field: string; row: string }[] }[] = [
    {
        base: 'value.primaryEvent.conditions',
        elements: game => game.value?.primaryEvent?.conditions,
        fields: [
            { field: 'type', row: 'V4' },
            { field: 'referents', row: 'V5' },
            { field: 'value', row: 'V6' },
        ],
    },
    {
        base: 'value.informationRules',
        elements: game => game.value?.informationRules,
        fields: [
            { field: 'subject', row: 'V16' },
            { field: 'trigger', row: 'V17' },
            { field: 'dimensions.D006_triggerType', row: 'V18' },
            { field: 'dimensions.D007_revealTiming', row: 'V19' },
            { field: 'dimensions.D008_revealProgression', row: 'V20' },
            { field: 'dimensions.D011_stateDependency', row: 'V21' },
            { field: 'dimensions.D013_accessHolder', row: 'V22' },
        ],
    },
]

/**
 * **The modifier's criterion and termination, worded for EXACT values only — NOT approved wording.** These are
 * the two sentences the Wide Zone demonstration has been served with since 7 October, kept keyed to the one
 * value each translates until Christian approves them (they are submitted with the wording batch, OD5). Once
 * approved they move to `approved-coach-wording.json` (rows V8c, V8d) and this map is deleted. Any other value
 * is withheld. The object's noun is passed in from `objects[].kind`, so no noun is written here.
 */
const CRITERION_WORDING: Record<string, (object: string) => string> = {
    'a controlled attacking-team touch within a referent wide channel, where controlled means a touch after which the touching player’s team retains possession': object =>
        `It is met when the attacking team touches the ${object} inside one of them and still has the ${object} after that touch`,
}
const ENDS_ON_WORDING: Record<string, (object: string) => string> = {
    POSSESSION_CHANGE: object => `Once met it stays live while that team keeps the ${object}, and a change of possession ends it`,
}

const fieldOf = (element: any, field: string): unknown => field.split('.').reduce<any>((node, key) => (node == null ? undefined : node[key]), element)
const present = (value: unknown): boolean => value !== undefined && value !== null

/**
 * Does an approved cover hold on this value? `equals` is the exact value, compared whole. `refersToOwnCondition`
 * holds where the value is a typed reference to a primary-event condition this same game holds — his answer of
 * 14 October that counting information *"refers to that gate's own condition"*, made checkable.
 */
function coverHolds(game: any, match: WordingMatch, value: unknown): boolean {
    if ('equals' in match) return JSON.stringify(match.equals) === JSON.stringify(value)
    const ref = (value as any)?.structuralRef
    if (!ref || typeof ref.contractId !== 'string' || typeof ref.itemId !== 'string') return false
    const conditions: any[] = Array.isArray(game.value?.primaryEvent?.conditions) ? game.value.primaryEvent.conditions : []
    return conditions.some(condition => String(condition?.elementId) === `c:${ref.contractId}:${ref.itemId}`)
}

/**
 * Say every condition and information rule the game holds in APPROVED words only; withhold every field no
 * approved sentence covers. An entry applies to an element when each of its covers names a field the element
 * holds and holds on that field's value; its slots are filled only from fields of the same element, each cited.
 * A slot whose value is not a plain number or string cannot be said faithfully, so that entry does not apply.
 */
function sayInApprovedWords(game: any, wording: ApprovedWording[], push: (instruction: Instruction) => void, withheld: WithheldField[]): void {
    for (const { base, elements, fields } of WORDED_ONLY) {
        for (const element of Array.isArray(elements(game)) ? (elements(game) as any[]) : []) {
            const pathOf = (field: string) => `${base}[${element?.elementId}].${field}`
            const held = fields.filter(f => present(fieldOf(element, f.field)))
            const said = new Set<string>()
            for (const entry of wording) {
                const covered = entry.covers.map(cover => ({ cover, field: held.find(f => f.row === cover.row) }))
                if (covered.some(({ cover, field }) => !field || !coverHolds(game, cover.match, fieldOf(element, field.field)))) continue
                const slots = Object.entries(entry.slots ?? {}).map(([name, slot]) => ({ name, field: slot.field, value: fieldOf(element, slot.field) }))
                if (slots.some(slot => typeof slot.value !== 'number' && typeof slot.value !== 'string')) continue
                const text = slots.reduce((sentence, slot) => sentence.split(`{${slot.name}}`).join(String(slot.value)), entry.sentence)
                push({
                    section: entry.section,
                    text,
                    status: 'DERIVED',
                    from: [...new Set([...covered.map(({ field }) => pathOf(field!.field)), ...slots.map(slot => pathOf(slot.field))])],
                    quantities: slots.filter(slot => typeof slot.value === 'number').map(slot => slot.value as number),
                })
                for (const { field } of covered) said.add(field!.field)
            }
            for (const field of held) if (!said.has(field.field)) withheld.push({ path: pathOf(field.field), row: field.row, reason: 'AWAITING_APPROVED_WORDING' })
        }
    }
}

export function renderConcreteGame(fixture: Fixture, wording: ApprovedWording[] = approvedWording()): RenderedActivity {
    const instructions: Instruction[] = []
    const observations: string[] = []
    const withheld: WithheldField[] = []
    const game = fixture.game
    /**
     * **Each property's status, read from what crossed the boundary with it** — 14 October 2026. A derived value
     * carries its `strength` (REQUIRED, DEFAULT or ADVISORY, computed once from its supporting items in
     * `derivation/strength.ts`); a choice carries its `closure`. Every derived path read DERIVED and every choice
     * REALIZATION_CHOICE before this, so a preferred default was stated as a rule of the game.
     *
     *   - a choice left to the coach (`COACH_DECIDES`) is a COACH_CHOICE;
     *   - every other choice is where this activity STARTS — a starting value inside a range, an alternative
     *     realization took (a line rather than a zone), or the only value an authored bound admits;
     *   - a derived value is DERIVED, STARTING or ADVISORY by its strength. One carrying no strength (a fixture
     *     frozen before it was carried) reads DERIVED, exactly as it always did: nothing is softened on a guess.
     */
    const statusOf = new Map<string, SourceStatus>()
    for (const d of fixture.status.derived) statusOf.set(d.path, STATUS_OF_STRENGTH[String(d.strength)] ?? 'DERIVED')
    for (const c of fixture.status.choices) statusOf.set(c.path, c.closure === 'COACH_DECIDES' ? 'COACH_CHOICE' : 'STARTING')
    /** The status of a sentence resting on these paths: the strongest any of them carries. */
    const statusAt = (paths: string[], fallback: SourceStatus): SourceStatus => strongest(paths.map(p => statusOf.get(p)).filter((s): s is SourceStatus => !!s), fallback)

    const say = (section: Instruction['section'], status: SourceStatus, core: string, from: string[], quantities: number[] = []) =>
        instructions.push({ section, text: phrase(status, core), status, from, quantities })

    /**
     * The status of a property is whatever the fixture records, never what the renderer assumes. Envelope
     * facts in particular arrive from the session but are recorded as DERIVED once folded into the game,
     * and labelling them SESSION would misstate the provenance trace even though both phrase identically.
     */
    const recorded = (path: string, fallback: SourceStatus): SourceStatus => statusOf.get(path) ?? fallback

    const geometryFor = (elementId: string, axis: 'along' | 'across') =>
        fixture.status.geometry.find((g: any) => g.path.includes(`[${elementId}]`) && g.path.endsWith(`.${axis}`))

    /**
     * The object the game establishes, read once for every sentence that names it. Its `kind` is the only
     * source of the noun (SD-103, below at the scoring instruction, where the rule was first applied), and a
     * sentence that uses it cites `objects[…].kind`.
     */
    const carrier = (game.objects ?? []).find((object: any) => typeof object?.kind === 'string')

    // ── Set up ──────────────────────────────────────────────────────────────────────────────────
    const area = game.envelope?.area
    if (area) {
        say(
            'Set up',
            recorded('envelope.area.length_m', 'SESSION'),
            `Mark out an area ${metres(area.length_m)} long by ${metres(area.width_m)} wide`,
            ['envelope.area.length_m', 'envelope.area.width_m'],
            [area.length_m, area.width_m],
        )
    }

    /**
     * **Two targets at opposite ends have to be told apart, and only by where the game puts them.**
     * Rendered alike, the two marking instructions read as the same sentence twice and a coach marks
     * one line. The distinction is read from the realized along position: the lower is one end, the
     * higher the other. No orientation is invented — not left or right, not north or south, nothing
     * the game does not hold — because the only fact available is that they are at opposite ends.
     */
    const degenerateAlong = (game.space?.regions ?? [])
        .map(r => geometryFor(r.elementId, 'along')?.geometry.interval)
        .filter(i => i && i.from === i.to)
        .map(i => i!.from as number)
    const endsDiffer = new Set(degenerateAlong).size > 1
    const farEnd = endsDiffer ? Math.max(...degenerateAlong) : null

    for (const region of game.space?.regions ?? []) {
        const noun = region.noun
        const along = geometryFor(region.elementId, 'along')
        const across = geometryFor(region.elementId, 'across')
        const nounPath = `space.regions[${region.elementId}].noun`
        const status = statusOf.get(nounPath) ?? 'DERIVED'

        if (noun === 'line') {
            // A line's length is its non-degenerate axis; its position is the degenerate one.
            const lengthAxis = along?.geometry.interval && along.geometry.interval.from !== along.geometry.interval.to ? along : across
            const atAxis = lengthAxis === along ? across : along
            const length = lengthAxis?.geometry.interval
            const at = atAxis?.geometry.interval
            say(
                'Set up',
                status,
                endsDiffer && at && at.from === at.to
                    ? `Mark a line across ${at.from === farEnd ? 'the other end' : 'one end'} of the area, ${metres((length?.to ?? 0) - (length?.from ?? 0))} long, on the end line itself`
                    : `Mark a line across one end of the area, ${metres((length?.to ?? 0) - (length?.from ?? 0))} long, on the end line itself`,
                [nounPath, lengthAxis?.path, atAxis?.path].filter(Boolean) as string[],
                [(length?.to ?? 0) - (length?.from ?? 0)],
            )
            if (at && at.from === at.to) {
                // Stated rather than smoothed over: the game puts the line ON the end line, with no depth.
                observations.push(
                    `The scoring line has zero depth and sits exactly on the end line (${atAxis?.path} = ${at.from}). That is what the ` +
                        `knowledge entails for a line, and it is physically markable — but a coach may expect a scoring zone with some ` +
                        `depth, and the game does not give one.`,
                )
            }
        } else {
            const width = across?.geometry.interval
            const len = along?.geometry.interval

            /**
             * **Which touchline, where the game says which.** The authored `lateral` selector now reaches
             * the artifact and the geometry places the two channels on opposite sides (0–7.5 m and
             * 22.5–30 m on a 30 m width). Rendering both as "along the touchline" dropped that and a coach
             * would mark one strip twice.
             *
             * It says "one" and "the opposite" rather than left and right: the authored values name the 0
             * and far edges of an axis, which is an axis convention and not a coach's left. The pairing is
             * established; which one a coach starts from is not, so it is not stated.
             */
            const lateral = (region.selector ?? []).find((t: any) => t.attribute === 'lateral')?.value
            const sides = (game.space?.regions ?? [])
                .map((r: any) => (r.selector ?? []).find((t: any) => t.attribute === 'lateral')?.value)
                .filter(Boolean)
            const paired = sides.length === 2 && new Set(sides).size === 2
            const where = !paired || !lateral ? 'along the touchline' : lateral === sides[0] ? 'along one touchline' : 'along the opposite touchline'

            /**
             * **The marking sentence states the width the knowledge REQUIRES — both ends of it.** It said
             * *"up to 7.5 m wide"*, which is the widest permitted extent and half of what is authored: his
             * ruling of 1 October gives a channel *"a minimum of 0.15 and a maximum of 0.25 of the available
             * across dimension"*, so on a 30 m width it is between 4.5 m and 7.5 m, and a coach who marked a
             * 2 m strip was inside what the activity told them. The range comes through `sayRange`, the one
             * way a range is said, and the preference is offered after it as before.
             *
             * Where the game holds no requirement in metres — a fixture frozen before realization recorded
             * one — the sentence reads as it did, from the interval, and nothing is computed to fill it in.
             */
            const length = (len?.to ?? 0) - (len?.from ?? 0)
            const widest = (width?.to ?? 0) - (width?.from ?? 0)
            const marking = (limits: string) => `Mark a ${noun} ${where}, ${metres(length)} long and ${limits} wide`
            const markingFrom = [nounPath, along?.path, across?.path, ...(paired && lateral ? [`space.regions[${region.elementId}].selector`] : [])].filter(Boolean) as string[]
            const range = extentRange(across)
            const ranged = range
                ? sayRange('Set up', range, {
                      number: metres,
                      required: marking,
                      requiredStatus: status,
                      requiredAlso: { from: markingFrom, quantities: [length] },
                      preferred: around => `${around} wide works well`,
                      sections: { preferred: ADJUSTING },
                  })
                : null
            if (ranged?.required) instructions.push(ranged.required)
            else say('Set up', status, marking(`up to ${metres(widest)}`), markingFrom, [length, widest])

            /**
             * **An established function is established knowledge, so it is carried.** His ruling is that a
             * function string is not what makes a region operationally realized — and that is a separate
             * question from whether it may be dropped. It may not: the game establishes it.
             *
             * Rendered close to the term rather than interpreted into a coaching purpose. Turning
             * `perceptual-reference` into advice about what players should look at would be inventing a
             * purpose the knowledge does not state. The system-term-to-coach-language mapping is a
             * vocabulary question and is reported rather than guessed.
             */
            const functions: string[] = Array.isArray((region as any).functions) ? (region as any).functions : []
            for (const member of functions) {
                // Its status is its strength: an established function supported only by an item the rule could
                // stand without is ADVISORY (14 October 2026; the mapping awaits his OD2 ruling).
                say(
                    'Set up',
                    statusAt([`space.regions[${region.elementId}].functions[${member}]`, `space.regions[${region.elementId}].functions`], 'DERIVED'),
                    `This ${noun} is established as a ${String(member).replace(/-/g, ' ')}`,
                    [`space.regions[${region.elementId}].functions`, `space.regions[${region.elementId}].functions[${member}]`],
                    [],
                )
            }
            if (ranged?.preferred) instructions.push(ranged.preferred)
        }
    }

    // ── Players ─────────────────────────────────────────────────────────────────────────────────
    if (Number.isFinite(game.envelope?.players)) {
        say('Players', recorded('envelope.players', 'SESSION'), `${game.envelope.players} players in total`, ['envelope.players'], [game.envelope.players])
    }
    const teams = game.performers?.teams ?? []

    /**
     * **NEUTRAL PLAYERS, AND A GROUP'S PARTICIPATION STATE — added 13 October 2026.**
     *
     * Christian, 13 October: *"Please proceed with the neutral-player participation functionality, including
     * roster arithmetic and coach-facing communication. For the proposed neutral-player condition, my
     * preference is that the neutral supports whichever team currently has possession and changes
     * allegiance immediately when possession changes. That should be explicit in the activity rather than
     * left ambiguous."*
     *
     * Before this the word did not occur in this file. Measured on the possession game with a neutral
     * condition, once the roster could be derived for it: twelve players were set out as two teams of five
     * with no word of the other two, and five established properties reached no instruction, so the
     * activity was — correctly — refused. Each sentence below is generated from the property that holds its
     * content, and cites it:
     *
     *   - **how many** — `neutrals.count`. Where realization closed the count inside an authored range it is
     *     where this activity STARTS, said as a fact about this activity; the REQUIRED limit and the
     *     PREFERRED range are said beside it through `sayRange`, each in the only wording its status has.
     *     The consequence for the numbers on each side is added only where the game holds what makes it
     *     true: two teams alike in every count they carry, and neutrals who join the team in possession;
     *   - **who they play with** — `affiliation.joins` and `affiliation.on`, with the noun of what is
     *     possessed read from `objects[].kind`. A standing affiliation to the team in possession is said as
     *     *always*, which is the authored word, and the change of sides it entails is said outright rather
     *     than left to be worked out;
     *   - **how they are told apart** — `distinguishable`, the authored means inserted verbatim;
     *   - **their participation state** — `participation[].state`, which belongs to any performer group and
     *     is worded here for the one group this renderer can name.
     *
     * **That the change of sides is immediate — withheld on 13 October, said since 14 October 2026.** His ruling
     * said it was; the game could not hold it: the row that would (`affiliation.on`) holds one trigger and already
     * holds the authored `STANDING`, and the contract's own ledger records *"whether re-affiliation on a turnover
     * is instantaneous or takes effect at a restart"* as not authored. Under SD-103 a sentence here is entailed by
     * the game or it is not said, so the word waited. On 14 October he asked for *"the explicit property
     * governing when a neutral player changes allegiance"*: register row P6c (`affiliation.takesEffect`) holds it
     * and C43 fills it with IMMEDIATE, so the sentence says *"switch immediately"*, cited to that property — and
     * only where the game holds that value (see the allegiance sentence below).
     *
     * A value with no faithful wording — a designation the possession relation does not decide, a trigger
     * other than a standing one, a state outside the table — is withheld and reported, never paraphrased.
     * The fidelity check then finds the property uncarried and the activity is refused, which is right.
     */
    const sayNeutralPlayers = (teamSize: number | null) => {
        const neutrals = game.performers?.neutrals
        const count = neutrals?.count
        const one = count === 1
        const who = one ? 'the neutral player' : 'the neutral players'
        const Who = `T${who.slice(1)}`

        if (neutrals && typeof neutrals === 'object') {
            const countPath = 'performers.neutrals.count'
            const joinsPath = 'performers.neutrals.affiliation.joins'
            const onPath = 'performers.neutrals.affiliation.on'
            const meansPath = 'performers.neutrals.distinguishable'
            const players = game.envelope?.players
            const joins = neutrals.affiliation?.joins
            const on = neutrals.affiliation?.on
            const relationEstablished = game.possession?.team !== undefined
            const side = carrier && typeof joins === 'string' ? SIDE_BY_POSSESSION[joins]?.(carrier.kind) : undefined

            if (stated(count) && Number.isFinite(players)) {
                // The two sides differ by exactly the neutrals only where the teams are alike in every count
                // they carry — size and each role alike — and the neutrals join the team in possession.
                const alike = new Set(teams.map((t: any) => JSON.stringify(Object.entries(t).filter(([, v]) => typeof v === 'number').sort()))).size === 1
                const overload = joins === 'ATTACKING_TEAM' && !!carrier && relationEstablished && teams.length === 2 && teamSize !== null && alike
                const core = (value: string, n: number) =>
                    `${value} of the ${players} players ${n === 1 ? 'is a neutral player' : 'are neutral players'}` +
                    (overload ? `, so the team with the ${carrier.kind} has ${value} more player${n === 1 ? '' : 's'} than the team without it` : '')
                /**
                 * The overload clause cites the teams (it rests on their being alike) and NOT each team's size,
                 * which it does not state. Corrected in the review of 13 October: citing the size made this
                 * sentence carry it, so with *"2 teams of 5"* deleted the neutral game still passed — a coach
                 * not told how many play on each side — where the bare game is refused for the same loss.
                 * A citation is a claim to have said the thing; this sentence says the difference, not the size.
                 */
                const also = {
                    from: ['envelope.players', ...(overload ? [joinsPath, 'performers.teams', `objects[${carrier.elementId}].kind`] : [])],
                    quantities: [players],
                }
                const noun = (limits: Limits) => ((stated(limits.max) ? limits.max : limits.min) === 1 ? 'neutral player' : 'neutral players')
                const range = countRange(fixture, countPath)
                const ranged = range
                    ? sayRange('Players', range, {
                          number: n => String(n),
                          required: (limits, bound) => `The game needs ${limits} ${noun(bound)}`,
                          preferred: (around, bound) => `${around} ${noun(bound)} works well`,
                          starting: core,
                          startingAlso: also,
                          // Where the count is only where this activity STARTS, its required limit is what a coach
                          // may adjust within, so it is said with the preference in the adjusting part; the
                          // starting count stays in the setup. A count the game fixes keeps its limit beside it.
                          sections: stated(range.starting) ? { required: ADJUSTING, preferred: ADJUSTING } : { preferred: ADJUSTING },
                      })
                    : null
                if (ranged?.starting) instructions.push(ranged.starting)
                else say('Players', recorded(countPath, 'DERIVED'), core(String(count), count), [countPath, ...also.from], [count, ...also.quantities])
                if (ranged?.required) instructions.push(ranged.required)
                if (ranged?.preferred) instructions.push(ranged.preferred)

                /**
                 * The preferred range is offered as authored. Which of its members this session can field is
                 * a separate fact, kept with the choice (`within.configurations`, 14 October: the roster
                 * arithmetic, what the knowledge authorizes of it, and what the preferred range offers), and
                 * where they differ a coach would want to know — so it is reported here and the sentence is left
                 * alone. Offering only the fieldable part is the consolidated language's change, not this one.
                 */
                const configurations: any = (fixture.status.choices ?? []).find((c: any) => c.path === countPath)?.within?.configurations
                const authorized: unknown = configurations?.authorized
                if (Array.isArray(authorized) && range?.preferred && stated(range.preferred.min) && stated(range.preferred.max)) {
                    const preferredCounts: number[] = []
                    for (let n = range.preferred.min; n <= range.preferred.max; n++) preferredCounts.push(n)
                    const unfielded = preferredCounts.filter(n => !authorized.includes(n))
                    if (unfielded.length) {
                        const offered: number[] = Array.isArray(configurations.offered) ? configurations.offered : []
                        observations.push(
                            `The preferred number of neutral players is offered as authored (${range.preferred.min} to ${range.preferred.max}). With ` +
                                `${players} players, ${unfielded.join(' and ')} ${unfielded.length === 1 ? 'does' : 'do'} not leave whole equal teams; ` +
                                `of the counts the knowledge authorizes, this session's roster fields ${authorized.join(', ') || 'none at all'}, and ` +
                                `the preferred range offers ${offered.join(', ') || 'none of them'} as a normal starting configuration (ecological ` +
                                `appropriateness: ${String(configurations.ecological ?? 'NOT_ASSESSED')}). A coach who takes another count will have ` +
                                `unequal teams or a player over, and the activity does not say so.`,
                        )
                    }
                }
            } else {
                observations.push(
                    count === undefined
                        ? `The game establishes neutral players and no count for them (\`${countPath}\` is absent), so a coach cannot be told how ` +
                              `many to pick. Nothing is said rather than assumed.`
                        : `The game holds ${JSON.stringify(count)} for \`${countPath}\` among ${JSON.stringify(players)} players, which is not a ` +
                              `number of people rendering can state, so the activity does not say how many neutral players there are.`,
                )
            }

            if (joins !== undefined || on !== undefined) {
                /**
                 * **"Switch immediately" — said ONLY where the game holds it.** 14 October 2026: the knowledge now
                 * has somewhere to hold the timing (register row P6c, `affiliation.takesEffect`), and his ruling of
                 * that day is in it (C43, IMMEDIATE). So the word the paragraph above withheld is said, cited to the
                 * property that holds it. The fidelity check cannot see a word, so the guarantee is here: the
                 * adverb is emitted for the value IMMEDIATE and for nothing else. With no timing in the game the
                 * old sentence and its observation stand; a timing this renderer has no wording for is said
                 * without it and withheld, which refuses the activity.
                 */
                const takesEffect = neutrals.affiliation?.takesEffect
                const takesEffectPath = 'performers.neutrals.affiliation.takesEffect'
                if (side && relationEstablished && on === 'STANDING' && takesEffect === 'IMMEDIATE') {
                    say(
                        'Players',
                        recorded(joinsPath, 'DERIVED'),
                        `${Who} always play${one ? 's' : ''} with ${side} and switch${one ? 'es' : ''} immediately when possession changes`,
                        [joinsPath, onPath, takesEffectPath, `objects[${carrier.elementId}].kind`],
                        [],
                    )
                } else if (side && relationEstablished && on === 'STANDING') {
                    say(
                        'Players',
                        recorded(joinsPath, 'DERIVED'),
                        `${Who} always play${one ? 's' : ''} with ${side}, and change${one ? 's' : ''} sides when possession changes`,
                        [joinsPath, onPath, `objects[${carrier.elementId}].kind`],
                        [],
                    )
                    if (takesEffect !== undefined) withheld.push({ path: takesEffectPath, row: 'P6c', reason: 'AWAITING_APPROVED_WORDING' })
                    else {
                        observations.push(
                            `The neutral players' side is held as a standing rule (\`${onPath}\` = STANDING) that follows the team in possession, so the ` +
                                `activity says they ALWAYS play with that team and change sides WHEN possession changes. It does not say the change is ` +
                                `IMMEDIATE, because this game holds no timing for it (\`${takesEffectPath}\` is absent). Rendering will not add the word ` +
                                `on its own authority.`,
                        )
                    }
                } else {
                    const missing = !carrier
                        ? 'the game establishes no object to name as what is possessed'
                        : !relationEstablished
                          ? 'the game establishes no possession relationship (`possession.team` is absent) for the designation to resolve against'
                          : !side
                            ? `rendering has no coach-facing wording for the team designation ${JSON.stringify(joins)}`
                            : `rendering has no coach-facing wording for an affiliation decided on ${JSON.stringify(on)}`
                    observations.push(
                        `The side the neutral players take is established as joins = ${JSON.stringify(joins)}, on = ${JSON.stringify(on)}, and ${missing}. ` +
                            `The activity says nothing about who they play with rather than paraphrase it.`,
                    )
                }
            }

            const means = neutrals.distinguishable
            if (typeof means === 'string' && means.trim()) {
                const apart = teams.length === 2 ? ' from both teams' : teams.length ? ' from the teams' : ''
                /**
                 * **The means is a recommendation where the knowledge makes it one — 14 October 2026.** Christian:
                 * *"Contrasting bibs should be treated as a practical recommendation for distinguishing neutrals, not
                 * a universal requirement, provided the players can readily identify their roles."* Recorded as C47
                 * (the authored means SUPPORTING; it was already a preferred default, so its strength is DEFAULT and
                 * its sentence STARTING). That the neutrals are told apart is required (NEUTRAL-06.a); HOW is where
                 * the activity starts, so the authored means is offered as an example rather than as the rule. A
                 * means the knowledge requires keeps the old wording.
                 */
                const status = recorded(meansPath, 'DERIVED')
                say(
                    'Players',
                    status,
                    status === 'DERIVED' ? `Make ${who} easy to tell apart${apart} — ${means}` : `Make ${who} easy to tell apart${apart} — for example, ${means}`,
                    [meansPath, ...(teams.length ? ['performers.teams'] : [])],
                    [],
                )
            } else if (means !== undefined) {
                observations.push(
                    `How the neutral players are told apart is established as ${JSON.stringify(means)}, which is not wording a coach can be given, ` +
                        `so the activity says nothing about it rather than paraphrase it.`,
                )
            }
        }

        for (const group of game.performers?.participation ?? []) {
            const base = `performers.participation[${group.elementId}]`
            if (group.state !== undefined) {
                const named = (group.selector ?? []).find((term: any) => term?.attribute === 'group' && term?.op === '=')?.value
                // The one group this renderer can name: the register's own neutrals, by either spelling the corpus uses.
                const neutral = !!neutrals && ['neutral', 'neutrals'].includes(String(named).toLowerCase())
                const wording = typeof group.state === 'string' ? PARTICIPATION_STATE[group.state] : undefined
                if (neutral && wording) {
                    say('Players', recorded(`${base}.state`, 'DERIVED'), `${Who} ${wording(!one)}`, [`${base}.state`, `${base}.selector`], [])
                } else {
                    observations.push(
                        `${base}.state is established as ${JSON.stringify(group.state)} for the group ${JSON.stringify(named)}, and rendering has no ` +
                            `coach-facing wording for ${neutral ? 'that state' : 'that group'}, so the activity says nothing about it rather than paraphrase it.`,
                    )
                }
            }
            if ((fixture.status.notEstablished ?? []).some((n: any) => n.path === `${base}.persistence`)) {
                observations.push(
                    `Nothing establishes whether that group keeps its participation state for the whole activity or only for a period ` +
                        `(\`${base}.persistence\` is not authored), so the activity does not say whether the same players stay in it throughout.`,
                )
            }
        }
    }

    if (!teams.length) sayNeutralPlayers(null)
    if (teams.length) {
        const sizes = [...new Set(teams.map((t: any) => t.outfieldCount).filter((n: any) => Number.isFinite(n)))]
        const size = sizes.length === 1 ? Number(sizes[0]) : null
        /**
         * **A per-team property is cited by its PROPERTY path, never by a member's address.** The size is
         * entailed onto each team at that member's own address, which carries its handle, and a handle is
         * identity, not a property: `identity.unit.ts` pins that none may reach coach-facing output, citations
         * included. So a sentence that speaks for every team cites the register's own path for the
         * property, with the member left open — which is also exactly what it claims, since it is only
         * said where every team holds the same number.
         *
         * The citation is what lets the fidelity check see the size was carried. Until 13 October it was
         * cited by nothing, so the check could not tell a stated team size from a dropped one.
         */
        say(
            'Players',
            'INSTANTIATED',
            size === null
                ? `${teams.length} teams`
                : `${teams.length} teams of ${size}`,
            size === null ? ['performers.teams'] : ['performers.teams', 'performers.teams[].outfieldCount'],
            size === null ? [teams.length] : [teams.length, size],
        )

        /**
         * **Availability is not involvement, and a coach is told which one they are looking at.** His rule
         * of 30 September: *"Stating availability is not stating involvement: a role available in the
         * session is instantiated into a particular game only where the selected knowledge establishes it."*
         *
         * This used to speak only when the session stated zero. So with one such performer available per
         * team the roster took them off each side, the activity read "2 teams of 5" from twelve players,
         * and nothing said where the other two had gone — eleven instructions, no violation. Now the
         * sentence is chosen from what each TEAM holds, which assembly writes from the game:
         *
         *   - the game involves none and the session has none — the session's own statement, as before;
         *   - the game involves none and the session has some — said as a fact about THIS activity, so a
         *     coach who brought them knows they play out with everyone else rather than wondering;
         *   - the game involves some — how many each team has.
         *
         * The role's NAME is data: it is the key the session stated and the leaf the register gave the
         * row. Nothing here knows what any role is, which is also why the plural is formed and not written.
         *
         * Where teams hold different counts there is no sentence that says so without telling them apart,
         * and nothing tells them apart — so it is withheld and reported, like every other fact the game
         * holds and the renderer has no faithful wording for.
         */
        const roles = fixture.envelope?.roles ?? {}
        for (const [role, count] of Object.entries(roles)) {
            const available = Number(count)
            const held = teams.map((t: any) => t[role])
            const carried = held.every((n: unknown) => Number.isInteger(n) && Number(n) >= 0)
            const property = `performers.teams[].${role}`
            if (!carried) {
                // The game gives the teams no count for this role, so only the session's statement can be said.
                if (available === 0) say('Players', 'SESSION', `No ${role}s — everyone is an outfield player`, ['envelope.roles'], [])
                else {
                    observations.push(
                        `The session has ${available} ${role}${available === 1 ? '' : 's'} available and the game gives no team a count for that ` +
                            `role, so the activity cannot say whether they are used. Nothing is said rather than assumed.`,
                    )
                }
                continue
            }
            if (new Set(held).size !== 1) {
                observations.push(
                    `The teams hold different ${role} counts (${held.join(' and ')}), and nothing in the game tells the teams apart, so the ` +
                        `activity cannot say which team has which. Withheld rather than averaged.`,
                )
                continue
            }
            const involved = Number(held[0])
            if (involved === 0 && available === 0) {
                say('Players', 'SESSION', `No ${role}s — everyone is an outfield player`, ['envelope.roles', property], [])
            } else if (involved === 0) {
                say('Players', 'DERIVED', `This activity does not use ${role}s — everyone plays as an outfield player`, [property], [])
            } else {
                say('Players', 'DERIVED', `Each team also has ${involved} ${role}${involved === 1 ? '' : 's'}`, [property], [involved])
            }
        }

        // After the teams and their roles, so the numbers a coach reads add up in the order they are read.
        sayNeutralPlayers(size)

        /**
         * **WHO STARTS WITH THE BALL — his ruling of 7 October, and the awkward truth it exposes.**
         *
         *   > *Once an established rule reads possession, the initial holder becomes activity-design
         *   > information under SD-104. Therefore the rendered activity must faithfully communicate which team
         *   > starts in possession.*
         *
         * The value is established and a coach genuinely needs it: the Wide Zone condition now reads
         * possession, so who starts decides whose touch can qualify in the first phase of play.
         *
         * **But "which team" is not expressible, and saying so IS the faithful rendering.** The holder is a
         * member handle, and `identity.unit.ts` pins that no handle may reach coach-facing output — deliberately,
         * because a handle is identity and not a property. More to the point, the two teams carry no
         * distinguishing property at all: they are identical but for that handle, which is why swapping the
         * holder leaves the whole game unchanged. So there is no fact of the form "the BLUE team starts" for
         * rendering to lose; there is only "one of the two does, and the game does not say which".
         *
         * That is what this says, and it cites both halves: `possession.team` for the relationship being
         * established and filled, `performers.teams` for there being two indiscernible teams to choose between.
         * A coach can act on it — they assign the ball before kick-off — and nothing is invented. The
         * observation below records what the activity therefore cannot tell them.
         */
        const holder = game.possession?.team
        if (holder) {
            const held = teams.some((t: any) => String(t.elementId) === String(holder))
            if (held) {
                // Left to the coach (COACH_DECIDES), so a COACH_CHOICE: the sentence puts the choice to them.
                say(
                    'Players',
                    statusAt(['possession.team'], 'COACH_CHOICE'),
                    `One team starts with the ball — the game does not fix which, so pick one and tell both teams before you start`,
                    ['possession.team', 'performers.teams'],
                    [],
                )
                /**
                 * **The reason this matters is read from the game, not asserted.** It used to say the
                 * wide-channel condition reads possession, so who starts decided whose touch could
                 * qualify first. That was true while a value modifier conditioned on the channels and
                 * is false now that nothing does — so the clause names whatever actually reads the
                 * relationship, and says plainly when nothing does.
                 */
                const readers: string[] = []
                if ((game.transitions ?? []).some((t: any) => (t.selector ?? []).some((s: any) => String(s.value) === 'POSSESSION_CHANGE')))
                    readers.push('a transition is keyed on a change of possession, so it decides which team is attacking in the first episode of play')
                if ((game.value?.valueModifiers ?? []).some((m: any) => m.endsOn === 'POSSESSION_CHANGE' || /possession/i.test(String(m.condition?.value ?? ''))))
                    readers.push('a value modifier reads possession, so who starts decides whose action can qualify first')
                if (typeof game.performers?.neutrals?.affiliation?.joins === 'string' && SIDE_BY_POSSESSION[game.performers.neutrals.affiliation.joins])
                    readers.push('the neutral players take a side by who has possession, so who starts decides which team they play with first')
                observations.push(
                    `The game DOES establish an initial holder of possession, and the activity cannot tell a coach which team it is. ` +
                        `The two teams are indiscernible — identical but for an internal handle that must not reach coach-facing text — so ` +
                        `the holder identifies a member without describing one. ` +
                        (readers.length
                            ? `It matters because ${readers.join('; and ')}. `
                            : `Nothing in this game reads the relationship, so it is an initial state a coach may settle however they like. `) +
                        `It is a knowledge gap and not a rendering one: nothing authors anything that tells the two teams apart.`,
                )
            } else {
                observations.push(
                    `\`possession.team\` names ${String(holder)}, which is not one of the game's own teams, so the activity says nothing ` +
                        `about who starts with the ball rather than naming something a coach cannot find.`,
                )
            }
        }
        if (size === null) {
            // NOT repaired. The renderer could divide 12 by 2 and write "two teams of six" — and that is
            // exactly the forbidden move. The post-realization gate did derive 6-a-side legitimately, from
            // the session total plus authored equality, but it derived it into its own evaluation context
            // and the value never reached the game. So the game does not establish it, and a renderer that
            // recomputed it would be inventing a number on its own authority.
            observations.push(
                `The game establishes ${game.envelope?.players} players and ${teams.length} teams but gives neither team a size: ` +
                    `\`performers.teams[]\` members carry only \`designation\`. A coach cannot split the group from this. The team size ` +
                    `IS derivable — the post-realization gate derived ${game.envelope.players / teams.length} per side from the session total ` +
                    `(${game.envelope.players} ÷ ${teams.length}) plus authored equality, and passed its roster check on it — but it derived it into the gate's evaluation context, ` +
                    `not into the concrete game, so the value does not survive into the artifact being rendered. Rendering will not ` +
                    `recompute it: that would be a number on the renderer's own authority. This is the one finding that I think bears on ` +
                    `the closure itself rather than on the rendering.`,
            )
        }
    }

    // ── How it works ────────────────────────────────────────────────────────────────────────────
    if (game.envelope?.duration_min) {
        say('How it works', recorded('envelope.duration_min', 'SESSION'), `Play for ${game.envelope.duration_min} minutes`, ['envelope.duration_min'], [game.envelope.duration_min])
    }
    /**
     * **A possession-change sentence requires a possession-change transition AND the relation it changes.**
     * His ruling of 7 October, the second of two narrow repairs:
     *
     *   > *A rendered possession-change instruction may appear only when the represented transition is
     *   > actually keyed on `POSSESSION_CHANGE` and the required possession relationship is established.*
     *
     * This read `playState === 'CONTINUE'` and nothing else. So the sentence fired for ANY transition that
     * continues play, on any trigger whatever, and asserted to a coach that it was possession that changed.
     * Measured before the repair: it survived changing the trigger to something unrelated, and it survived
     * deleting the possession relation from the game outright. The word "possession" occurs in this file only
     * inside that string, so there was nothing else to notice.
     *
     * **`possession.team` is deliberately NOT cited.** The relation's establishment is a PRECONDITION for
     * emitting the sentence, not a source of its content: what the sentence says — a possession change does
     * not stop play — comes entirely from the trigger and the play state. Citing the holder would make the
     * fidelity check read it as carried to the coach when no coach reads it anywhere, which is exactly the
     * unverifiable citation his item-1 findings warn about. Under his item-2 ruling the holder needs no
     * coach-facing expression, and the honest way to say so is to leave it uncited and let it be reported.
     *
     * **It is said ONCE, however many transitions assert it — 13 October.** The sentence was issued per
     * transition, and a second contract may assert the same transition beside the game form's own: the
     * neutral condition does, because the side its players take depends on it. Measured: the activity then
     * read the same sentence twice, and nothing caught it — the fidelity check has no test for repeated
     * text. So the qualifying transitions are gathered and one sentence cites every one of them, which
     * keeps each transition's play state carried and each one's episode boundary discharged. The merge is
     * made HERE and nowhere else: a general collapse of identical sentences would be wrong, because two
     * regions legitimately produce the same sentence each — the two channels' function sentences are
     * word-for-word alike and are two facts.
     */
    const continuingOnPossessionChange: any[] = []
    for (const transition of game.transitions ?? []) {
        if (transition.playState !== 'CONTINUE') continue
        const keyedOnPossessionChange = (transition.selector ?? []).some(
            (term: any) => term?.attribute === 'trigger' && term?.op === '=' && term?.value === 'POSSESSION_CHANGE',
        )
        const relationEstablished = (game as any).possession?.team !== undefined
        if (keyedOnPossessionChange && relationEstablished) {
            continuingOnPossessionChange.push(transition)
            continue
        }
        // Reported, not repaired — his standing instruction for anything the game itself makes unsayable.
        observations.push(
            keyedOnPossessionChange
                ? `${transition.elementId} is keyed on a possession change and continues play, but the game establishes no possession ` +
                  `relationship (\`possession.team\` is absent). A coach cannot be told that a possession change does not stop play ` +
                  `when nothing in the game holds the relation that would change. The sentence is withheld rather than asserted.`
                : `${transition.elementId} continues play rather than stopping it, and its trigger is not a possession change. ` +
                  `Rendering has no coach-facing wording for that trigger, so it says nothing rather than reusing the ` +
                  `possession-change sentence, which is what it used to do for any CONTINUE transition.`,
        )
    }
    if (continuingOnPossessionChange.length) {
        // Its status is the play state's strength. GF2-17 authors CONTINUE once, as a preferred default the rule
        // could stand without, so this is where the activity STARTS — no longer stated as a rule (14 October 2026).
        say(
            'How it works',
            statusAt(continuingOnPossessionChange.map(transition => `transitions[${transition.elementId}].playState`), 'DERIVED'),
            `Play continues when possession changes — there is no stoppage`,
            continuingOnPossessionChange.flatMap(transition => [`transitions[${transition.elementId}].playState`, `transitions[${transition.elementId}].selector`]),
            [],
        )
    }

    // ── How to score ────────────────────────────────────────────────────────────────────────────
    const primary = game.value?.primaryEvent
    if (primary) {
        const kindPath = 'value.primaryEvent.kind'
        const objective = (game.objectives ?? [])[0]
        const shared = objective?.team === 'EACH_TEAM'
        // `objectives[].role = PRIMARY_SCORING` is what makes this the way to score at all, so it is cited
        // here rather than being given a sentence of its own that would only restate it.
        const objectiveRole = (game.objectives ?? [])[0]
        /**
         * **The thing that crosses the line is named only when the game establishes one, and the noun comes
         * from the game.** His ruling of 7 October, the first of two narrow repairs:
         *
         *   > *A rendered scoring instruction may mention the ball only when the represented game establishes
         *   > the ball and the instruction's provenance legitimately supports that reference.*
         *
         * And the governing principle he set above it: *"Coach-facing language must be entailed by the resolved
         * game and the rules it communicates. A renderer may compress or combine supported facts, but it may not
         * introduce an unsupported game fact merely because that fact is obvious in the sport."*
         *
         * This sentence used to hardcode the English word, cited to the scoring event, the point value and the
         * objective's role — none of which is an object. It therefore told coaches about a ball for weeks while
         * the representation established none, and nothing caught it: the fidelity check validates numbers in
         * prose and never nouns, so an invented NOUN passes unchecked.
         *
         * Two things make the repair rather than a patch. The noun is read from `objects[].kind` instead of
         * written here, so the renderer states no sport vocabulary of its own; and that path is CITED, so the
         * reference has provenance rather than being true by coincidence. Where no object is established the
         * carrier is not named at all and the gap is reported — the same treatment the unsettled
         * channel-condition trigger already gets below.
         */
        say(
            'How to score',
            statusOf.get(kindPath) ?? 'DERIVED',
            // **"the marked line" is only unambiguous while there is one.** With a target per team the
            // game holds two, and a coach reading "the marked line" cannot tell which counts. The
            // objective each team attacks is established, so the instruction names it relationally.
            carrier
                ? (game.objectives ?? []).length > 1
                  ? `A team scores ${primary.value} point by getting the ${carrier.kind} across the line it is attacking`
                  : `A team scores ${primary.value} point by getting the ${carrier.kind} across the marked line`
                : (game.objectives ?? []).length > 1
                  ? `A team scores ${primary.value} point when the line it is attacking is crossed`
                  : `A team scores ${primary.value} point when the marked line is crossed`,
            [
                kindPath,
                'value.primaryEvent.value',
                ...(carrier ? [`objects[${carrier.elementId}].kind`] : []),
                ...(objectiveRole ? [`objectives[${objectiveRole.elementId}].role`] : []),
            ],
            [primary.value],
        )
        if (!carrier) {
            observations.push(
                `The scoring event is established and what crosses the line is not: the game holds no object, so the ` +
                    `instruction says the line is crossed without saying by what. A coach can run that only by deciding ` +
                    `for themselves whether a player, a pass or a carried object counts, which is a rule of the game and ` +
                    `not theirs to set. Withheld rather than filled in.`,
            )
        }
        /**
         * **The opposing arrangement, said relationally.** Two objectives each name the team that attacks
         * them, and those names are designations the game holds — not anything a coach could point at. So
         * the instruction cannot say "the blue team attacks the north line"; what it can say, and what is
         * entailed, is that each team attacks the far target and defends the near one, and that the coach
         * assigns the ends. That is the same shape already used for who starts with the ball, and for the
         * same reason: the fact is established, the identity is not.
         *
         * Every objective is cited, not just the first. Citing one left the second objective's team,
         * reference and role established and carried by no instruction, which the fidelity check reported
         * as three losses — correctly.
         */
        const objectives: any[] = game.objectives ?? []
        if (objective && !shared && objectives.length > 1) {
            const provenance = objectives.flatMap(o => [
                `objectives[${o.elementId}].team`,
                `objectives[${o.elementId}].reference`,
                `objectives[${o.elementId}].role`,
            ])
            say(
                'How to score',
                statusAt(provenance, 'DERIVED'),
                `Each team attacks one line and defends the other — so decide which team starts at which end, tell them, and keep it that way for the whole game`,
                provenance,
                [],
            )
            say(
                'How to score',
                statusAt([`objectives[${objectives[0].elementId}].team`], 'DERIVED'),
                `When possession changes the teams swap roles, not ends: whoever wins the ball attacks the same line they were already attacking`,
                [`objectives[${objectives[0].elementId}].team`, 'transitions'],
                [],
            )
        } else if (objective) {
            say(
                'How to score',
                statusAt([`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`], 'DERIVED'),
                shared
                    ? `Both teams attack the same line — the one you marked at the end of the area`
                    : `Each team attacks its own line`,
                [`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`],
                [],
            )
            if (shared) {
                observations.push(
                    `Both teams score at the SAME line (objectives[${objective.elementId}].team = EACH_TEAM). That is the canonical ` +
                        `shared-objective decision, and it is deliberate — but it is an unusual arrangement for an invasion game, and a coach will need it said ` +
                        `plainly or they will set up two targets out of habit.`,
                )
            }
        }
    }

    /**
     * **The primary event's conditions, and the information rules, in approved words or not at all** —
     * 14 October 2026, Step 4 component 3. This renderer had no branch for either, so a game holding them lost
     * them silently and the fidelity check could only report the loss. Now each field is said in a sentence he
     * approved (`approved-coach-wording.json`) or listed in `withheld`, which refuses the activity. The table
     * is empty today, so every such field is withheld.
     */
    sayInApprovedWords(game, wording, said => instructions.push(said), withheld)

    /**
     * **The value modifier, carried without inventing what satisfies it.**
     *
     * The game establishes the whole effect — a region condition over two named channels, operation MULTIPLY,
     * magnitude 2 — so a coach is told the scoring consequence exactly. What it does NOT establish is what
     * counts as a qualifying interaction with a channel: `REGION_ENTRY` has no registered semantics, and the
     * authoring note records the gap in its own words ("no rule for what counts as 'moving through' (ball,
     * player, touch)"). That is the owner decision being held, so the rendering states the effect and says
     * plainly that the trigger is not settled, rather than choosing ball, player or touch for him.
     */
    /**
     * **Made generic on 14 October 2026** (Step 4, component 3), keeping every sentence the Wide Zone
     * demonstration was served with. The branch had been shaped to that one modifier: its noun fell back to the
     * word "region" where the referents named none, only MULTIPLY was worded, ONE fixed criterion sentence was
     * said for any criterion at all, and "the ball" was written into two sentences with no object cited. Now:
     *
     *   - the noun is read from the referent regions, and only where they all resolve and share one; otherwise
     *     the sentences that need it are withheld, never filled with a generic word;
     *   - the effective value comes from `effectiveValue` (SD-30: MULTIPLY, ADD, REPLACE); an operation it does
     *     not support is withheld;
     *   - the criterion and the termination are worded only for the EXACT values the maps below translate, and
     *     the object is named from `objects[].kind`, cited (SD-103). Any other value is withheld.
     *
     * Withheld fields refuse the activity at communication (`build-activity`). The two map sentences are the
     * ones the demonstration has always said; they stay here, keyed to their exact values, until he approves
     * them — and only then move to the approved table. They are NOT approved wording.
     */
    for (const modifier of game.value?.valueModifiers ?? []) {
        const base = `value.valueModifiers[${modifier.elementId}]`
        const referents = (modifier.condition?.referents ?? []) as { structuralRef?: { contractId: string; itemId: string } }[]
        const regionsNamed = referents.map(r => (game.space?.regions ?? []).find((s: any) => String(s.elementId) === `c:${r.structuralRef?.contractId}:${r.structuralRef?.itemId}`))
        const nouns = [...new Set(regionsNamed.map(region => region?.noun))]
        const noun: string | null = referents.length && nouns.length === 1 && typeof nouns[0] === 'string' && nouns[0] ? nouns[0] : null
        const primary = game.value?.primaryEvent
        const effective = effectiveValue(modifier.operation, primary?.value, modifier.magnitude)
        const withhold = (field: string, row: string) => withheld.push({ path: `${base}.${field}`, row, reason: 'AWAITING_APPROVED_WORDING' })

        if (noun && effective !== null) {
            say(
                'How to score',
                statusAt([`${base}.operation`, `${base}.magnitude`], 'DERIVED'),
                `When the ${noun} condition is met, that same score is worth ${effective} instead of ${primary.value}`,
                [`${base}.operation`, `${base}.magnitude`, 'value.primaryEvent.value'],
                [effective, primary.value],
            )
        } else {
            withhold('operation', 'V9a')
            withhold('magnitude', 'V9')
        }
        if (noun) {
            say(
                'How to score',
                statusAt([`${base}.condition.type`, `${base}.condition.referents`], 'DERIVED'),
                `The condition is about the ${regionsNamed.length === 2 ? `two ${noun}s` : noun} you marked — it applies to either of them`,
                [`${base}.condition.type`, `${base}.condition.referents`, ...referents.map(r => `${base}.condition.referents[${r.structuralRef?.contractId}::${r.structuralRef?.itemId}`.concat(']'))],
                [],
            )
        } else {
            withhold('condition.type', 'V8a')
            withhold('condition.referents', 'V8b')
        }

        /**
         * **WHAT MEETS THE CONDITION, and WHEN IT ENDS — the two halves authored on 7 October.**
         *
         * The criterion is a qualitative term, so this is a translation of it and not a restatement of the
         * engine's own words. He authorized exactly that when he settled it: *"I would prefer the canonical
         * representation to carry that observable relationship rather than rely on the qualitative word
         * controlled. Coach-facing language may eventually translate it naturally."* The translation introduces
         * no fact the term does not carry — a touch, inside a referent region, by the attacking team, after
         * which that team still has the ball — and `condition.value` is cited, so SD-103 is satisfied by
         * provenance rather than by assertion.
         *
         * Both sentences are gated on the fields being present. Where a modifier carries no criterion the
         * observation below reports that gap exactly as it did before, which is the state every modifier
         * authored before today is still in.
         */
        const criterion = modifier.condition?.value
        const objectCited = carrier ? [`objects[${carrier.elementId}].kind`] : []
        if (criterion) {
            const worded = carrier && typeof criterion === 'string' ? CRITERION_WORDING[criterion] : undefined
            if (worded) say('How to score', statusAt([`${base}.condition.value`], 'DERIVED'), worded(carrier.kind), [`${base}.condition.value`, ...objectCited], [])
            else withhold('condition.value', 'V8c')
        }
        if (modifier.endsOn) {
            const worded = carrier && typeof modifier.endsOn === 'string' ? ENDS_ON_WORDING[modifier.endsOn] : undefined
            // A termination with no wording for its exact value is withheld, never paraphrased. (It was an
            // observation until 14 October, so an activity could be served saying nothing about when its
            // modification ends; a rule of the game left unsaid is a loss, and now it refuses.)
            if (worded) say('How to score', statusAt([`${base}.endsOn`], 'DERIVED'), worded(carrier.kind), [`${base}.endsOn`, ...objectCited], [])
            else withhold('endsOn', 'V8d')
        }

        if (!criterion) {
            observations.push(
                `The game establishes WHAT the wide channels do — a line crossing is worth ${effective ?? 'more'} ` +
                    `instead of ${primary?.value} when the condition is met — but NOT what counts as meeting it. The authored source is "actions starting in or ` +
                    `moving through the wide channel", \`REGION_ENTRY\` carries no registered semantics, and the authoring note states the gap itself: ` +
                    `"no rule for what counts as 'moving through' (ball, player, touch)". So a coach is told the consequence and cannot be told the ` +
                    `trigger. Nothing is chosen here on the engine's behalf.`,
            )
        }
        if (criterion && !modifier.endsOn) {
            observations.push(
                `${modifier.elementId} states what satisfies its condition and nothing about when the modification ends, so on the ` +
                    `representation it does not persist beyond the event it is evaluated at. That is the row's stated reading of an absent ` +
                    `termination and not an oversight — but if the intent was a persisting advantage, the termination is what is missing.`,
            )
        }
    }

    // ── Observations about the game, not fixes to it ─────────────────────────────────────────────
    const channels = (game.space?.regions ?? []).filter((r: any) => r.noun === 'channel')
    if (channels.length > 2) {
        const anchors = channels.map((c: any) => geometryFor(c.elementId, 'across')?.geometry.anchor)
        observations.push(
            `The game contains ${channels.length} channels, and every one is anchored at across = ${anchors[0]} — the SAME touchline ` +
                `(${channels.map((c: any) => c.elementId).join(', ')}). A pitch has two touchlines, so a coach following this literally ` +
                `would mark one strip ${channels.length} times. The channels come from three separate Wide Zone contributions; whether they ` +
                `describe three regions or one region three times is a knowledge question, not a rendering one.`,
        )
    }

    const excludedFunctions = (fixture.status.notEstablished ?? []).filter((n: any) => n.path.endsWith('.functions'))
    if (excludedFunctions.length) {
        /**
         * **Which kind of absence this is, read from the row rather than asserted.**
         *
         * This used to say the exclusion is AUTHORED and name the Wide Zone item as the thing that
         * forbids `access`. That was true of a game containing Wide Zone. It fired on the presence of
         * an excluded `functions` row alone, without checking either that the object was present or
         * that the row's own reason was an exclusion — so in a game with no Wide Zone, where the row is
         * simply unconstrained, it attributed the gap to an object that is not there.
         *
         * A declaration of `NON_CLAIMED` is nothing having spoken; an excluded row is something having
         * spoken against it. They are different findings and a reader acts on them differently, so the
         * row's declaration decides which one is reported.
         */
        const authored = excludedFunctions.filter((n: any) => !(n.declared ?? []).includes('NON_CLAIMED'))
        const unconstrained = excludedFunctions.filter((n: any) => (n.declared ?? []).includes('NON_CLAIMED'))
        if (authored.length) {
            observations.push(
                `${authored.length} \`functions\` row(s) are EXCLUDED by an authored item rather than merely missing ` +
                    `(${authored.map((n: any) => `${n.path} — ${n.reason}`).join('; ')}). So a coach being told nothing about what those ` +
                    `regions are "for" is not by itself the defect; what matters is whether the game establishes what CHANGES when players ` +
                    `interact with them, which the operational-participation check reports separately.`,
            )
        }
        if (unconstrained.length) {
            observations.push(
                `${unconstrained.length} \`functions\` row(s) are simply NOT CONSTRAINED — nothing authored says what those regions are ` +
                    `"for" and nothing forbids saying it either (${unconstrained.map((n: any) => n.path).join('; ')}). That is an absence of ` +
                    `knowledge rather than an authored exclusion, and it does not stop a region participating: this game's target region ` +
                    `participates because the objective references it, not because it carries a function string.`,
            )
        }
    }

    /**
     * The tier is the section's own reading, set here and nowhere else; and what a coach may adjust is read after
     * the starting setup, so it is moved to the end with its order kept. Organisation only — no instruction is
     * added, dropped or reworded by this.
     */
    const tiered = instructions.map(i => ({ ...i, tier: (i.section === ADJUSTING ? 'adjust' : 'setup') as 'setup' | 'adjust' }))
    return { instructions: [...tiered.filter(i => i.tier === 'setup'), ...tiered.filter(i => i.tier === 'adjust')], coachingObservations: observations, withheld }
}
