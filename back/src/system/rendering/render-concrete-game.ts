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
import { nonClaimState } from '../derivation/classify'
import { effectiveValue } from '../derivation/rational'
import { NO_FURTHER_VALUE } from '../derivation/types'
import { CONDITION_ROW, conditionScopeNotEvaluable } from '../derivation/resolved-game'
import { approvedWording, ApprovedWording, WordingMatch } from './approved-wording'
import { exclusionFor } from './coach-facing-exclusions'

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

/**
 * **The section saying how the roles pass between the teams** — 15 October 2026 (stage K3), for his D2: *"Please make that
 * distinction explicit in the coach-facing instructions."* Present only for a game played in role blocks. The section
 * name is a DRAFT for his review.
 */
export const ROLE_EXCHANGE = 'Role exchange'

/**
 * The one member of the register's exchange vocabulary (`B3.exchange`, version 10): the coach calls the next block. Named
 * here because the sentence below is its wording; any other member would have no sentence and stay uncarried, which the
 * fidelity check refuses.
 */
export const COACH_CALLS = 'COACH_CALLS'

/** One number a sentence says, and the concrete-game path whose number it is. */
export interface Binding {
    quantity: number
    path: string
    /**
     * `REQUIRED_LIMIT` where the sentence says the number as a LIMIT of the property (*"between 4.5 m and 7.5 m
     * wide"*, *"Keep at least 1 neutral player"*), not as the value it has. Added in the review of stage S-C2
     * (14 October 2026), a tightening: a binding that did not say which it was let a part state a required limit
     * as the value — *"with 1 neutral player"* passed Q2 where the game holds 2 and 1 is only the floor, because a
     * required limit was admitted for any binding. Absent, the number is the property's value.
     */
    as?: 'REQUIRED_LIMIT'
}

/**
 * **One property-bearing span of a sentence** — stage S-C2, 14 October 2026. His §7: *"feel free to propose
 * consolidated, more natural language rather than preserving unnecessary sentence-by-sentence technical
 * structure."* A consolidated sentence says several properties of several statuses at once, so it is built from
 * parts, each with its own status, its own citations, and — for every number it says, in the order it says them —
 * the path that number is of. The fidelity check holds each part to its own status and each number to its own path.
 */
export interface InstructionPart {
    /** This span's words, punctuation included: the instruction's text is its parts' texts joined. */
    text: string
    status: SourceStatus
    from: string[]
    quantities: number[]
    bindings: Binding[]
}

export interface Instruction {
    /** Which part of the activity this belongs to. Organisation only; carries no authority. */
    section: 'Set up' | 'Players' | 'How it works' | 'How to score' | 'What to watch' | typeof ROLE_EXCHANGE | typeof ADJUSTING
    /**
     * In an activity composed from two role blocks (stage K3), the block a sentence belongs to where it differs between
     * them; absent where the sentence holds in both. Organisation only; carries no authority.
     */
    block?: string
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
    /**
     * The spans the sentence is made of (stage S-C2). Every instruction this renderer issues carries them — one
     * part for a plain sentence, several for a consolidated one — and its text, citations, numbers and status are
     * theirs (`combinedStatus`). Optional only for instructions built by hand, which are checked whole, as before.
     */
    parts?: InstructionPart[]
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
 * that cannot be read as a rule. `PREFERENCE` carries its hedge in its own template ("… works well"; until stage S-C2,
 * 14 October 2026, ", if it suits your group" was appended here), and the check refuses one without. There is no path by which a preference or a recommendation reaches imperative wording.
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
            // Stage S-C2, 14 October 2026: ", if it suits your group" is no longer appended. Every preference template
            // carries its own hedge ("works well"), and the check still refuses a preference that carries none (Q4).
            return core
    }
}

/**
 * **The status of a sentence built from parts** — stage S-C2. A part a coach decides makes the sentence a choice;
 * otherwise a part the activity only starts at makes it a starting statement (it is never presented as more fixed
 * than its weakest firm part); otherwise the strongest of the parts. A preference or a recommendation is never
 * combined with anything else — the renderer does not, and the check refuses it (Q4).
 */
export function combinedStatus(statuses: SourceStatus[]): SourceStatus {
    if (statuses.includes('COACH_CHOICE')) return 'COACH_CHOICE'
    if (statuses.includes('STARTING')) return 'STARTING'
    return strongest(statuses, 'DERIVED')
}

/** A part, worded by its status, with its numbers read off its bindings. */
const part = (status: SourceStatus, text: string, from: string[], bindings: Binding[] = []): InstructionPart => ({
    text,
    status,
    from: [...new Set(from)],
    quantities: bindings.map(b => b.quantity),
    bindings,
})

/** One instruction made of these parts: its text, citations, numbers and status are theirs. */
const joined = (section: Instruction['section'], parts: InstructionPart[]): Instruction => ({
    section,
    text: parts.map(p => p.text).join(''),
    status: combinedStatus(parts.map(p => p.status)),
    from: [...new Set(parts.flatMap(p => p.from))],
    quantities: parts.flatMap(p => p.quantities),
    parts,
})

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
    /**
     * Whatever else the requirement's sentence states, when it is also (say) the marking sentence — with the path
     * of each number it says before the limits (stage S-C2: every number is bound to its property).
     */
    requiredAlso?: { from: string[]; bindings: Binding[] }
    /** Whatever else the starting value's sentence states — the total it is a part of, say — bound the same way. */
    startingAlso?: { from: string[]; bindings: Binding[] }
    /**
     * What else the preference's sentence names. Added in the review of S-C1 (14 October 2026): once the
     * preference moved to "Adjusting the activity" it no longer sat beside the sentence that said what it was
     * about, so it must name that itself, and cite what it names.
     */
    preferredAlso?: { from: string[] }
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

/** A plain sentence: one part, worded by its status, every number bound to its path. */
const instruction = (section: Instruction['section'], status: SourceStatus, core: string, from: string[], bindings: Binding[]): Instruction =>
    joined(section, [part(status, phrase(status, core), from, bindings)])

/** Each number bound to the one path it is of. */
const boundTo = (path: string, quantities: number[]): Binding[] => quantities.map(quantity => ({ quantity, path }))
/** Each number bound to the path it is a required LIMIT of — said as a limit, never as the value (review of S-C2). */
const limitsOf = (path: string, quantities: number[]): Binding[] => quantities.map(quantity => ({ quantity, path, as: 'REQUIRED_LIMIT' as const }))

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
            ? instruction(
                  words.sections?.required ?? section,
                  words.requiredStatus ?? 'DERIVED',
                  words.required!(limits.text, line.required!),
                  [...(words.requiredAlso?.from ?? []), line.path],
                  [...(words.requiredAlso?.bindings ?? []), ...limitsOf(line.path, limits.quantities)],
              )
            : null,
        preferred: around
            ? instruction(words.sections?.preferred ?? section, 'PREFERENCE', words.preferred!(around.text, line.preferred!), [line.path, ...(words.preferredAlso?.from ?? [])], boundTo(line.path, around.quantities))
            : null,
        starting:
            stated(line.starting) && words.starting
                ? instruction(section, 'STARTING', words.starting(words.number(line.starting), line.starting), [line.path, ...(words.startingAlso?.from ?? [])], [
                      { quantity: line.starting, path: line.path },
                      ...(words.startingAlso?.bindings ?? []),
                  ])
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
 * A possession-relative team designation, as a coach would say it.
 *
 * Only the two designations the possession relation alone decides are worded. Every other designation
 * (the team that scored, the team that touched last, a named team) needs a fact this sentence does not
 * have, so a value outside this table is withheld and reported, never paraphrased.
 *
 * **Said in his words since stage S-C2 (14 October 2026)**: *"The neutrals support whichever team has possession
 * and switch immediately when possession changes."* It named the possessed object before (*"whichever team has the
 * ball"*), read from `objects[].kind`; "possession" is the relation the designation is decided by
 * (`possession.team`, the sentence's precondition), so no object noun is needed and none is said.
 */
const SIDE_BY_POSSESSION: Record<string, string> = {
    ATTACKING_TEAM: 'whichever team has possession',
    DEFENDING_TEAM: 'whichever team does not have possession',
}

/**
 * A participation state, as a coach would say it of a group already named. `plural` is whether the group is more
 * than one.
 *
 * One wording, for the one state a game in the corpus establishes. The state is a member of a closed
 * vocabulary, and the gloss names only what that vocabulary rules out by the state being this one. A state
 * with no wording here is withheld and reported, so it cannot be served half-said. Consolidated in stage S-C2
 * (DRAFT): *"take a full part in play"* for *"are active in the game"*.
 */
const PARTICIPATION_STATE: Record<string, (plural: boolean) => string> = {
    ACTIVE: plural => `take${plural ? '' : 's'} a full part in play — not waiting, resting or watching`,
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
            // Stage K7 (B2): a condition's scope, which a whole-game condition does not carry (resolved-game.ts), so nothing moves for
            // one. A scoped condition is said only by an entry covering this row with its exact scope (below).
            { field: 'scope', row: CONDITION_ROW },
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
const CRITERION_WORDING: Record<string, (object: string, where: string) => string> = {
    // Consolidated in stage S-C2 (14 October 2026, DRAFT): one clause of the modifier's sentence, where it was
    // "It is met when the attacking team touches the ball inside one of them and still has the ball after that touch".
    'a controlled attacking-team touch within a referent wide channel, where controlled means a touch after which the touching player’s team retains possession': (object, where) =>
        `once the attacking team has touched the ${object} inside ${where} and kept it after that touch`,
}
export const ENDS_ON_WORDING: Record<string, () => string> = {
    // Was "Once met it stays live while that team keeps the ball, and a change of possession ends it" (DRAFT, S-C2).
    // It names no object now, so it no longer needs one to be said.
    POSSESSION_CHANGE: () => 'lasts until possession changes',
}

/**
 * **Restarts, worded for EXACT values only — DRAFT, 15 October 2026 (stage K7), NOT approved wording.** His decisions of 17
 * October (D1, D5, M3, M4) and 18 October (item 2) gave the first activity starts, restarts after a score, a coach-judged end of
 * an episode and ordinary restarts when the ball goes out; the game holds each as a transition element (T1-T7), and until this
 * stage none had a sentence, so the activity was refused for every one of them as uncarried. Each map below is keyed to the
 * register vocabulary value it translates (trigger, T5 method, T2 designation); any other value has no sentence and stays
 * uncarried, which fidelity refuses — never paraphrased. Objects are named from `objects[].kind` (SD-103), roles and teams from
 * the game's data, so no noun of a sport is written here.
 *
 *   - the trigger phrases say when a restart happens. The coach-judged conclusion is said in his D5 terms: *"An episode concludes
 *     when either team scores or when the coach judges that the meaningful attacking opportunity has ended. The coach may make that
 *     judgment at a stoppage or during play."*;
 *   - the method phrases say how: `FROM_THE_FEET` with the register's gloss of it (ours, labelled so there) that the ball need not be
 *     still — his D5, *"a stationary-ball restart should not be universally required"*; `IN_HAND`, the restart taken with the
 *     object in the hands;
 *   - the designation phrases say who restarts where the game names a team by the last touch (the register's gloss of LAST_TOUCH;
 *     NOT_LAST_TOUCH has none, and is read as the team that did not touch it last, as the register records).
 */
const TRIGGER_PHRASE: Record<string, string> = {
    START: 'at the start',
    SCORE: 'after either team scores',
    COACH_JUDGED_EPISODE_CONCLUSION: 'whenever you decide that an attack has run its course (at a stoppage or while play is on)',
}
const METHOD_PHRASE: Record<string, (object: string) => string> = {
    FROM_THE_FEET: object => `from the feet, with the ${object} still or moving`,
    IN_HAND: object => `with the ${object} in hand`,
}
const LAST_TOUCH_PHRASE: Record<string, (object: string) => string> = {
    LAST_TOUCH: object => `the team that touched the ${object} last`,
    NOT_LAST_TOUCH: object => `the team that did not touch the ${object} last`,
}
/** Where the object leaves play, by trigger: the end line is told apart by its qualifier (T1b), read below. */
const OUT_OF_PLAY_TRIGGERS = ['OUT_TOUCHLINE', 'OUT_END_LINE']
/** The one authored taker that is not a role: a player of the team the restart is awarded to (A01-R1's T3 for ordinary restarts). */
const PLAYER_OF_AWARDEE = "a player of the team in this element's T2"
/** The scoring event that is ENTRY into a target region, worded for that value only (its other kinds keep the line wording). */
const ZONE_ENTRY_EVENT = 'target_zone_entered'
/** The relative position RC-21 names (register `relativeTerms`, version 13), read where a start placement is stated by it. */
const BEYOND = 'beyond X (for team T)'
/** The end a target touches, as RC-21 names it: the end its attacking team attacks, which is the other team's end (C42). */
const ATTACKING_END = 'attacking end (of team T)'

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
            /**
             * **A condition authored for less than every score is not said as if it governed every score** — 15
             * October 2026. Saying it in a sentence that does not carry its scope would state a wider rule than the one
             * authored (SD-36; his 16 October 9.3, "Build-out condition applies only to build-out episodes: Approved.").
             *
             * **Since stage K7 (15 October 2026, design step B2) it can be said, by an approved sentence that carries the scope,
             * and only so.** His 14 October item 3: *"Enable accurate coach-facing communication of scoring conditions and
             * information rules, using approved language."* Until then no entry could ever apply to such a condition (the scope
             * was no field an entry could cover, and the condition was skipped before any entry was tried), so the activity
             * would stay refused after he approved its sentence. Now an entry applies to a scoped condition only where one of its
             * covers is the scope row, holding EXACTLY that scope (`equals`); every other entry is passed over for it, and with
             * none, every field it holds — the scope among them — is withheld exactly as before, which refuses the activity at
             * communication. A whole-game condition carries no scope field, so nothing about it moves.
             */
            const scoped = !!conditionScopeNotEvaluable(element)
            const said = new Set<string>()
            for (const entry of wording) {
                if (scoped && !entry.covers.some(cover => cover.row === CONDITION_ROW && 'equals' in cover.match && JSON.stringify(cover.match.equals) === JSON.stringify(element?.scope))) continue
                const covered = entry.covers.map(cover => ({ cover, field: held.find(f => f.row === cover.row) }))
                if (covered.some(({ cover, field }) => !field || !coverHolds(game, cover.match, fieldOf(element, field.field)))) continue
                const slots = Object.entries(entry.slots ?? {}).map(([name, slot]) => ({ name, field: slot.field, value: fieldOf(element, slot.field) }))
                if (slots.some(slot => typeof slot.value !== 'number' && typeof slot.value !== 'string')) continue
                const text = slots.reduce((sentence, slot) => sentence.split(`{${slot.name}}`).join(String(slot.value)), entry.sentence)
                // Each numeric slot is bound to the field it was filled from, in the order the sentence says them.
                const numeric = slots
                    .filter(slot => typeof slot.value === 'number')
                    .map(slot => ({ slot, at: entry.sentence.indexOf(`{${slot.name}}`) }))
                    .sort((a, b) => a.at - b.at)
                    .map(({ slot }) => ({ quantity: slot.value as number, path: pathOf(slot.field) }))
                push(instruction(entry.section, 'DERIVED', text, [...covered.map(({ field }) => pathOf(field!.field)), ...slots.map(slot => pathOf(slot.field))], numeric))
                for (const { field } of covered) said.add(field!.field)
            }
            for (const field of held) if (!said.has(field.field)) withheld.push({ path: pathOf(field.field), row: field.row, reason: 'AWAITING_APPROVED_WORDING' })
        }
    }
}

/**
 * **The positions a game writes for a role holder** — stage K7, 15 October 2026: every region whose along position is written for a
 * block-scoped role holder (`roleNouns.holders`), by its value (a distance from that team's end), by its realized relation ("beyond X
 * (for team T)") or by a bound on it. These are the markings that are set out again when the roles exchange (his D2: *"role-specific
 * objectives and target configurations change when the teams exchange roles"*): the exchange sentence cites them, and fidelity Q6
 * (role-blocks.ts) requires a sentence that does. Empty for every game with no role holder.
 */
export function roleKeyedPositions(fixture: any): string[] {
    const holders = new Set(Object.keys(fixture?.roleNouns?.holders ?? {}))
    if (!holders.size) return []
    return ((fixture?.game?.space?.regions ?? []) as any[])
        .map(region => ({ region, path: `space.regions[${region?.elementId}].position.along` }))
        .filter(({ region, path }) => {
            const value = region?.position?.along
            const relation = (fixture.status?.geometry ?? []).find((g: any) => g.path === path)?.geometry?.relation
            const bounds = (fixture.status?.bounds ?? []).filter((entry: any) => entry.path === path).flatMap((entry: any) => entry.bounds ?? [])
            return (value && typeof value === 'object' && holders.has(String(value.forTeam))) || holders.has(String(relation?.forTeam)) || bounds.some((bound: any) => holders.has(String(bound?.forTeam)))
        })
        .map(({ path }) => path)
}

/**
 * **The sentences approved wording says for this game, and nothing else** — stage K7, 15 October 2026. The independent checks read
 * them (fidelity.ts): a sentence citing a scoped condition is admitted only where it IS one of these (and these say a scoped
 * condition only from an entry covering its exact scope, above), and the obligation lexicon passes over a sentence he approved. The
 * same function the renderer says them with, so the two cannot drift; nothing is withheld or pushed anywhere else.
 */
export function approvedSentences(game: any, wording: ApprovedWording[] = approvedWording()): Instruction[] {
    const said: Instruction[] = []
    sayInApprovedWords(game, wording, instruction => said.push(instruction), [])
    return said
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

    /** A plain sentence, one part, each number it says bound to the path it is of (stage S-C2). */
    const say = (section: Instruction['section'], status: SourceStatus, core: string, from: string[], bindings: Binding[] = []) =>
        instructions.push(instruction(section, status, core, from, bindings))

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

    /**
     * **A team named by the role it holds in this block — stage K7, 15 October 2026 (DRAFT nouns).** His D7, reply filed 17 October
     * 2026: *"Please use the assigned team roles rather than referring generically to "the defending team," since possession and
     * defensive responsibilities change during play."* A value the game writes for a role holder (`ROLE_HOLDER_BUILDING`) or for the
     * end-assigned team holding a role in this block (`TEAM_AT_AXIS_START`, through the block's own binding) is said by that role's
     * DRAFT noun, read from the fixture (`roleNouns.nouns`, `roleNouns.holders`, `record.roleBlock`). Any other designation has no
     * noun here, so a sentence needing one is not said.
     */
    const roleNounOf: Record<string, string> = fixture.roleNouns?.nouns ?? {}
    const roleOfHolderName: Record<string, string> = fixture.roleNouns?.holders ?? {}
    const holdersInBlock: Record<string, string> = fixture.record?.roleBlock?.holders ?? {}
    const roleOfDesignation = (designation: unknown): string | null => {
        const name = String(designation)
        const role = roleOfHolderName[name] ?? Object.entries(holdersInBlock).find(([, team]) => team === name)?.[0]
        return role && roleNounOf[role] ? role : null
    }
    const teamNoun = (designation: unknown): string | null => {
        const role = roleOfDesignation(designation)
        return role ? roleNounOf[role] : null
    }
    /** The noun of the one other role in the block, where there is exactly one. */
    const otherTeamNoun = (designation: unknown): string | null => {
        const role = roleOfDesignation(designation)
        const others = Object.keys(holdersInBlock).filter(other => other !== role && roleNounOf[other])
        return role && others.length === 1 ? roleNounOf[others[0]] : null
    }
    const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`
    const listed = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? '')
    const areaLength = Number(game.envelope?.area?.length_m)
    const areaWidth = Number(game.envelope?.area?.width_m)

    /**
     * **A line marked across the area at a distance from the end line a team defends — stage K7 (DRAFT).** His reply filed 18 October
     * 2026, item 3: *"Pressure reference: 20 m from the building team's end line."* The game holds it as a line (S2) positioned by
     * RC-21's "own end (of team T)" with an offset in metres (S5 version 2), realized inside the area. It was said as a line "on the end
     * line itself" (the only line this renderer knew), which put it 20 m from where the game holds it. Said only where the game holds
     * exactly that — the offset one number, the team one with a noun, the line inside the area and touchline to touchline — and the
     * coach is told the distance and the team, both cited. The line has no noun of its own beyond "line", so later sentences call it
     * "the marked line": the only line a coach marks in such a game besides the area's own edges.
     */
    const fromTeamEnd = (region: any): { team: string; offset: number } | null => {
        if (region?.noun !== 'line') return null
        const along = region?.position?.along
        const offset = along && typeof along === 'object' ? along.offsetM : null
        if (!offset || !stated(offset.from) || offset.from !== offset.to || !teamNoun(along.forTeam)) return null
        const at = geometryFor(region.elementId, 'along')?.geometry?.interval
        const across = geometryFor(region.elementId, 'across')?.geometry?.interval
        if (!at || at.from !== at.to || !(at.from > 0 && at.from < areaLength) || !across || across.from !== 0 || across.to !== areaWidth) return null
        return { team: teamNoun(along.forTeam)!, offset: offset.from }
    }
    const markedLines = new Set<string>((game.space?.regions ?? []).filter((region: any) => fromTeamEnd(region)).map((region: any) => String(region.elementId)))

    // ── Set up ──────────────────────────────────────────────────────────────────────────────────
    const area = game.envelope?.area
    if (area) {
        say(
            'Set up',
            recorded('envelope.area.length_m', 'SESSION'),
            `Mark out an area ${metres(area.length_m)} long by ${metres(area.width_m)} wide`,
            ['envelope.area.length_m', 'envelope.area.width_m'],
            [
                { quantity: area.length_m, path: 'envelope.area.length_m' },
                { quantity: area.width_m, path: 'envelope.area.width_m' },
            ],
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
        // A line marked at a distance from an end is not at an end (stage K7).
        .filter((r: any) => !markedLines.has(String(r.elementId)))
        .map(r => geometryFor(r.elementId, 'along')?.geometry.interval)
        .filter(i => i && i.from === i.to)
        .map(i => i!.from as number)
    const endsDiffer = new Set(degenerateAlong).size > 1
    const farEnd = endsDiffer ? Math.max(...degenerateAlong) : null

    /** A line's length is its non-degenerate axis; its position is the degenerate one. */
    const lineGeometry = (region: any) => {
        const along = geometryFor(region.elementId, 'along')
        const across = geometryFor(region.elementId, 'across')
        const lengthAxis = along?.geometry.interval && along.geometry.interval.from !== along.geometry.interval.to ? along : across
        const atAxis = lengthAxis === along ? across : along
        const length = lengthAxis?.geometry.interval
        return { lengthAxis, atAxis, length: (length?.to ?? 0) - (length?.from ?? 0), at: atAxis?.geometry.interval }
    }
    const regions: any[] = game.space?.regions ?? []

    /**
     * **Both end lines in one sentence — stage S-C2, 14 October 2026 (DRAFT).** His §7 asked for *"a clear starting
     * setup"* without *"unnecessary sentence-by-sentence technical structure"*; the two marking sentences read the
     * same twice but for "one end" and "the other end". Merged only where the game holds exactly that: two lines,
     * each with no depth, at opposite ends, of one length, of one status. Each line's noun and position stay cited, so
     * each is still marked (Q5); the objective that references a line is cited where the sentence calls the lines the
     * scoring lines, and that clause is said only where every line is so referenced. The zero depth is said by
     * "end lines" (they ARE the end lines) and still observed. The length is not said: it is the width of the area,
     * stated in the sentence before.
     */
    const lines = regions.filter(r => r.noun === 'line' && !markedLines.has(String(r.elementId)))
    const referencedBy = (region: any) =>
        (game.objectives ?? []).find((o: any) => {
            const ref = o?.reference?.structuralRef
            return ref && `c:${ref.contractId}:${ref.itemId}` === String(region.elementId)
        })

    /**
     * **A team's target zone, said by the role that attacks it and where it lies — stage K7, 15 October 2026 (DRAFT).** His reply filed
     * 18 October 2026, item 3: *"Building team's progression target: begins at the pressure reference."* / *"Pressing team's post-regain
     * target area: 5 m deep at the building team's end."* The game holds two objective regions, each the target of the team holding a
     * role in the block (objectives, C42), touching the end of the other team (RC-21 "attacking end (of team T)"), across the whole
     * width, and either a required depth or a beginning at the marked line ("beyond X (for team T)", realized from the line to the end).
     * Until this stage they were said as strips "along the touchline … up to 30 m wide", the channel sentence, which is not where the
     * game puts them. Said only where the game holds all of that and the roles have nouns; anything else falls back to what was said.
     * "Target" is the objective that references the region (cited); the noun is the region's own.
     */
    const targetZone = (region: any): { text: string; from: string[]; bindings: Binding[] } | null => {
        if (typeof region?.noun !== 'string' || region.noun === 'line') return null
        const objective = referencedBy(region)
        const attacker = objective ? teamNoun(objective.team) : null
        const defender = objective ? otherTeamNoun(objective.team) : null
        const along = geometryFor(region.elementId, 'along')
        const across = geometryFor(region.elementId, 'across')
        const span = along?.geometry?.interval
        const wide = across?.geometry?.interval
        if (!objective || !attacker || !defender || !span || !wide || wide.from !== 0 || wide.to !== areaWidth || along.geometry.term !== ATTACKING_END) return null
        if (!(span.from === 0 || span.to === areaLength)) return null
        const from = [`space.regions[${region.elementId}].noun`, along.path, across.path, `objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`]
        const depth = along.geometry.extentBound?.requiredWithin
        if (depth && stated(depth.min) && depth.min === depth.max && span.to - span.from === depth.min) {
            return { text: `Mark the ${attacker}'s target ${region.noun} at the ${defender}'s end, ${metres(depth.min)} deep, across the full width`, from, bindings: [{ quantity: depth.min, path: along.path }] }
        }
        const of = along.geometry.relation?.of
        const referent = of ? `c:${of.contractId}:${of.itemId}` : null
        if (referent && markedLines.has(referent) && along.geometry.relation.term === BEYOND) {
            return { text: `Mark the ${attacker}'s target ${region.noun} from the marked line to the ${defender}'s end line, across the full width`, from: [...from, `space.regions[${referent}].noun`], bindings: [] }
        }
        return null
    }
    const mergeLines =
        lines.length === 2 &&
        endsDiffer &&
        lines.every(r => {
            const { at } = lineGeometry(r)
            return at && at.from === at.to
        }) &&
        new Set(lines.map(r => lineGeometry(r).length)).size === 1 &&
        new Set(lines.map(r => statusOf.get(`space.regions[${r.elementId}].noun`) ?? 'DERIVED')).size === 1

    /**
     * **Which touchline, where the game says which.** The authored `lateral` selector reaches the artifact and the
     * geometry places two channels on opposite sides (0–7.5 m and 22.5–30 m on a 30 m width). Rendering both as
     * "along the touchline" dropped that and a coach would mark one strip twice.
     *
     * It says "one" and "the opposite" rather than left and right: the authored values name the 0 and far edges of
     * an axis, which is an axis convention and not a coach's left. The pairing is established; which one a coach
     * starts from is not, so it is not stated.
     */
    const lateralOf = (r: any) => (r.selector ?? []).find((t: any) => t.attribute === 'lateral')?.value
    const sides = regions.map(lateralOf).filter(Boolean)
    const paired = sides.length === 2 && new Set(sides).size === 2
    /** Everything one non-line region's sentences need, read once so a merge can compare two of them. */
    const channelPlan = (region: any) => {
        const along = geometryFor(region.elementId, 'along')
        const across = geometryFor(region.elementId, 'across')
        const width = across?.geometry.interval
        const len = along?.geometry.interval
        const lateral = lateralOf(region)
        const nounPath = `space.regions[${region.elementId}].noun`
        const selector = paired && lateral ? [`space.regions[${region.elementId}].selector`] : []
        const functions: string[] = Array.isArray(region.functions) ? region.functions : []
        const unfit = across?.geometry?.extentBound?.preferenceWithin
        return {
            where: !paired || !lateral ? 'along the touchline' : lateral === sides[0] ? 'along one touchline' : 'along the opposite touchline',
            length: (len?.to ?? 0) - (len?.from ?? 0),
            widest: (width?.to ?? 0) - (width?.from ?? 0),
            range: extentRange(across),
            across: String(across?.path ?? ''),
            markingFrom: [nounPath, along?.path, across?.path, ...selector].filter(Boolean) as string[],
            preferredFrom: [nounPath, ...selector],
            status: statusOf.get(nounPath) ?? 'DERIVED',
            // A member the shared table excludes (his 14 October ruling) is not said; any other member is.
            saidFunctions: functions.filter(member => !exclusionFor(`space.regions[${region.elementId}].functions[${member}]`, fixture)),
            unfit: unfit && unfit.compatible === false ? unfit : null,
        }
    }
    const channels2 = regions.filter(r => r.noun !== 'line' && !targetZone(r))
    const mergeChannels = (() => {
        if (channels2.length !== 2 || !paired || !channels2.every(lateralOf) || new Set(channels2.map(r => r.noun)).size !== 1) return false
        const [a, b] = channels2.map(channelPlan)
        if (!a.range?.required || !b.range?.required || a.saidFunctions.length || b.saidFunctions.length || !a.across || !b.across) return false
        const shape = (p: typeof a) => JSON.stringify([p.range!.required, p.range!.preferred, p.length, p.status, !!p.unfit])
        return shape(a) === shape(b)
    })()

    for (const region of regions) {
        const noun = region.noun
        const along = geometryFor(region.elementId, 'along')
        const across = geometryFor(region.elementId, 'across')
        const nounPath = `space.regions[${region.elementId}].noun`
        const status = statusOf.get(nounPath) ?? 'DERIVED'

        // Stage K7 (DRAFT): a line marked at a distance from a team's end, and a team's target zone (above).
        const positioned = fromTeamEnd(region)
        if (positioned) {
            say('Set up', status, `Mark a ${noun} across the area, ${metres(positioned.offset)} from the ${positioned.team}'s end line`, [nounPath, along?.path, across?.path].filter(Boolean) as string[], along?.path ? [{ quantity: positioned.offset, path: along.path }] : [])
            continue
        }
        const zone = targetZone(region)
        if (zone) {
            say('Set up', status, zone.text, zone.from, zone.bindings)
            continue
        }

        if (noun === 'line') {
            const { lengthAxis, atAxis, length, at } = lineGeometry(region)
            if (mergeLines && region === lines[0]) {
                const objectives = lines.map(referencedBy)
                const scoring = objectives.every(Boolean)
                say(
                    'Set up',
                    status,
                    scoring ? 'Mark both end lines: they are the scoring lines' : 'Mark both end lines',
                    [
                        ...lines.flatMap(r => {
                            const g = lineGeometry(r)
                            return [`space.regions[${r.elementId}].noun`, g.lengthAxis?.path, g.atAxis?.path].filter(Boolean) as string[]
                        }),
                        ...(scoring ? objectives.map((o: any) => `objectives[${o.elementId}].reference`) : []),
                    ],
                )
            } else if (!mergeLines) {
                say(
                    'Set up',
                    status,
                    endsDiffer && at && at.from === at.to
                        ? `Mark a line across ${at.from === farEnd ? 'the other end' : 'one end'} of the area, ${metres(length)} long, on the end line itself`
                        : `Mark a line across one end of the area, ${metres(length)} long, on the end line itself`,
                    [nounPath, lengthAxis?.path, atAxis?.path].filter(Boolean) as string[],
                    lengthAxis?.path ? [{ quantity: length, path: lengthAxis.path }] : [],
                )
            }
            if (at && at.from === at.to) {
                // Stated rather than smoothed over: the game puts the line ON the end line, with no depth.
                observations.push(
                    `The scoring line has zero depth and sits exactly on the end line (${atAxis?.path} = ${at.from}). That is what the ` +
                        `knowledge entails for a line, and it is physically markable — but a coach may expect a scoring zone with some ` +
                        `depth, and the game does not give one.`,
                )
            }
        } else {
            const plan = channelPlan(region)
            // The second of a merged pair was said with the first.
            if (mergeChannels && region === channels2[1]) continue
            const { where, length, widest, range, markingFrom, preferredFrom } = plan
            const marking = (limits: string) => `Mark a ${noun} ${where}, ${metres(length)} long and ${limits} wide`
            const lengthBinding: Binding[] = along?.path ? [{ quantity: length, path: along.path }] : []

            if (mergeChannels) {
                /**
                 * **Both channels in one sentence — stage S-C2, 14 October 2026 (DRAFT).** Merged only where the game
                 * holds two of one noun on opposite sides, each with the same length, the same required width and the
                 * same preference, of one status: then "along each touchline" says exactly what the two sentences
                 * said. Every channel's noun, positions and side stay cited, so each is still marked (Q5) and each
                 * line's required limits are said by a sentence citing it (Q3). Each number is bound to the first
                 * channel's path; the second's holds the same number, which is what made the merge true.
                 */
                const [first, second] = channels2.map(channelPlan)
                const limits = limitsPhrase(first.range!.required!, metres)!
                say('Set up', status, `Mark a ${noun} along each touchline, ${metres(length)} long and ${limits.text} wide`, [...first.markingFrom, ...second.markingFrom], [
                    ...lengthBinding,
                    ...limitsOf(first.across, limits.quantities),
                ])
                const around = first.range!.preferred ? aroundPhrase(first.range!.preferred, metres) : null
                if (around) {
                    instructions.push(
                        instruction(ADJUSTING, 'PREFERENCE', `${around.text} wide works well for each ${noun}`, [first.across, second.across, ...first.preferredFrom, ...second.preferredFrom], boundTo(first.across, around.quantities)),
                    )
                }
                if (first.unfit) observations.push(`The authored preferred width of each ${noun} is not offered to the coach: ${String(first.unfit.note ?? 'it does not fit the requirement on this area')}.`)
                continue
            }

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
            const ranged = range
                ? sayRange('Set up', range, {
                      number: metres,
                      required: marking,
                      requiredStatus: status,
                      requiredAlso: { from: markingFrom, bindings: lengthBinding },
                      // Said in the adjusting part, away from the marking sentence, so it names which strip it is
                      // about (review of S-C1, 14 October 2026): two identical "Around 6 m to 7.5 m wide works well"
                      // lines there named nothing. The noun and the side are the marking sentence's own, cited.
                      preferred: around => `${around} wide works well for the ${noun} ${where}`,
                      preferredAlso: { from: preferredFrom },
                      sections: { preferred: ADJUSTING },
                  })
                : null
            /**
             * **A preference that does not fit is left out, and that is recorded** — the review of S-C1. His §7:
             * *"Where the preferred range doesn't fit, explain the limitation or use an authorized alternative.
             * Don't silently imply that the original preference remains applicable."* No approved wording explains
             * it to a coach yet, so it is not said; realization recorded why (`preferenceWithin.note`), and until
             * this review that reason reached only the fidelity report, which no page shows. It is observed here.
             */
            if (plan.unfit) {
                observations.push(`The authored preferred width of the ${noun} ${where} is not offered to the coach: ${String(plan.unfit.note ?? 'it does not fit the requirement on this area')}.`)
            }
            if (ranged?.required) instructions.push(ranged.required)
            else say('Set up', status, marking(`up to ${metres(widest)}`), markingFrom, [...lengthBinding, ...(across?.path ? [{ quantity: widest, path: across.path }] : [])])

            /**
             * **An established function is established knowledge, so it is carried — unless it is a term a coach has
             * nothing to do with.** His ruling is that a function string is not what makes a region operationally
             * realized, and that is a separate question from whether it may be dropped: the game establishes it.
             *
             * **`perceptual-reference` is no longer said — Christian, 14 October 2026:** *"please remove internal
             * engine terminology such as 'perceptual reference' from coach-facing instructions unless it conveys an
             * actual action the coach needs to take."* It told a coach *"It helps if this channel is established as a
             * perceptual reference"* — engine words with no act in them. The shared table
             * (`coach-facing-exclusions.ts`) excludes it, and the fidelity check verifies its consequence — the
             * channel is marked — reached the coach, and reports the exclusion with his words. Any other member is
             * still said, close to the term, never interpreted into a coaching purpose.
             */
            for (const member of plan.saidFunctions) {
                say(
                    'Set up',
                    statusAt([`space.regions[${region.elementId}].functions[${member}]`, `space.regions[${region.elementId}].functions`], 'DERIVED'),
                    `This ${noun} is established as a ${String(member).split('-').join(' ')}`,
                    [`space.regions[${region.elementId}].functions`, `space.regions[${region.elementId}].functions[${member}]`],
                )
            }
            if (ranged?.preferred) instructions.push(ranged.preferred)
        }
    }

    // ── Players ─────────────────────────────────────────────────────────────────────────────────
    const teams: any[] = game.performers?.teams ?? []
    const players = game.envelope?.players
    const sizes = [...new Set(teams.map((t: any) => t.outfieldCount).filter((n: any) => Number.isFinite(n)))]
    const size = sizes.length === 1 ? Number(sizes[0]) : null

    /**
     * **Teams told apart by the role each holds in this block — DRAFT, 15 October 2026 (stage K4).** For his starting
     * configurations of 17 October 2026 (D6, unequal counts by role) and his D7: *"Please use the assigned team roles rather
     * than referring generically to "the defending team,""*. Where the teams hold different counts, nothing told them apart before, so the counts were
     * withheld. In a game derived for a role block the record says which end-assigned team holds each role
     * (`record.roleBlock`) and which team holds each end (`record.designationBindings`), and the role's DRAFT noun crossed
     * with the game (`roleNouns`): so each team is named by its role, and its counts are said as its own. Read only from the
     * fixture; a team no role names leaves the old withholding in place.
     */
    const block: { holders?: Record<string, string> } | undefined = fixture.record?.roleBlock
    const teamNouns: Record<string, string> = fixture.roleNouns?.nouns ?? {}
    const bound: { designation: string; handle: string }[] = fixture.record?.designationBindings ?? []
    const roleOfTeam = (team: any): string | null => {
        for (const [role, holder] of Object.entries(block?.holders ?? {})) {
            if (bound.some(binding => binding.designation === holder && binding.handle === team?.elementId)) return role
        }
        return null
    }
    const roleOrder = Object.keys(block?.holders ?? {})
    const namedByRole = teams.length > 0 && teams.every(team => !!roleOfTeam(team) && !!teamNouns[roleOfTeam(team)!]) && new Set(teams.map(roleOfTeam)).size === teams.length
    const specializedHeld = Object.keys(fixture.envelope?.roles ?? {})
    const countsDiffer = size === null || specializedHeld.some(role => new Set(teams.map((t: any) => t[role])).size > 1)
    const byRole = namedByRole && countsDiffer && teams.every((t: any) => Number.isInteger(t.outfieldCount) && specializedHeld.every(role => Number.isInteger(t[role])))

    /**
     * **NEUTRAL PLAYERS, AND A GROUP'S PARTICIPATION STATE — added 13 October 2026, consolidated 14 October.**
     *
     * Christian, 13 October: *"For the proposed neutral-player condition, my preference is that the neutral supports
     * whichever team currently has possession and changes allegiance immediately when possession changes. That should
     * be explicit in the activity rather than left ambiguous."* And 14 October, §7: *"The current neutral-player
     * demonstration is understandable but contains more explanation than a coach needs during setup … something like
     * this would be more useful: 'Divide 12 players into two teams of five, with two neutral players. The neutrals
     * support whichever team has possession and switch immediately when possession changes.'"*
     *
     * So the four Players sentences of the roster (the total, the teams, the role statement and the neutral count
     * with its overload clause) are ONE sentence, built from parts that keep each property's status and each number's
     * property (stage S-C2): the session total, the instantiated teams, the count the activity starts at, the role
     * statement. The overload clause (*"so the team with the ball has 2 more players than the team without it"*) is
     * gone, as he asked: what it cited is cited by the sentences that remain. Digits, not words: the fidelity check
     * reads both since stage S-C2, and the renderer writes what it checks most plainly.
     *
     * Each property is still said from the value that holds it, and cited:
     *
     *   - **how many** — `neutrals.count`, a part of the roster sentence; where realization closed it inside an
     *     authored range, its required limit and its preference are said in "Adjusting the activity";
     *   - **who they play with** — `affiliation.joins`, `affiliation.on` and `affiliation.takesEffect`, in his words;
     *   - **how they are told apart** — `distinguishable`, the authored means inserted verbatim;
     *   - **their participation state** — `participation[].state`, said as the second sentence of the allegiance.
     *
     * A value with no faithful wording — a designation the possession relation does not decide, a trigger other than
     * a standing one, a state outside the table — is withheld and reported, never paraphrased. The fidelity check
     * then finds the property uncarried and the activity is refused, which is right.
     */
    const neutrals = game.performers?.neutrals
    const hasNeutrals = !!neutrals && typeof neutrals === 'object'
    const count = neutrals?.count
    const one = count === 1
    const theNeutrals = one ? 'the neutral player' : 'the neutrals'
    const TheNeutrals = `T${theNeutrals.slice(1)}`
    const countPath = 'performers.neutrals.count'
    const joinsPath = 'performers.neutrals.affiliation.joins'
    const onPath = 'performers.neutrals.affiliation.on'
    const takesEffectPath = 'performers.neutrals.affiliation.takesEffect'
    const meansPath = 'performers.neutrals.distinguishable'
    const relationEstablished = game.possession?.team !== undefined
    const neutralNoun = (n: number | null) => (n === 1 ? 'neutral player' : 'neutral players')

    // The session total and the teams. Said as "Divide N players into K teams of S" (his wording) where there are teams.
    const roster: InstructionPart[] = []
    if (Number.isFinite(players)) {
        roster.push(part(recorded('envelope.players', 'SESSION'), teams.length ? `Divide ${players} players` : `${players} players in total`, ['envelope.players'], [{ quantity: players, path: 'envelope.players' }]))
    }
    if (teams.length && byRole) {
        /**
         * **Each team's counts, by the role it holds** (stage K4, DRAFT): "Divide 12 players into 2 teams: the building team has
         * 6 outfield players and 1 <role>; the pressing team has 5 outfield players". Each count is cited by its PROPERTY
         * path (never a member's handle, `identity.unit.ts`) and bound to it, so fidelity checks the number against what the
         * teams hold; a specialized role is said only for a team that involves it, by the role's own name.
         */
        roster.push(part('INSTANTIATED', roster.length ? ` into ${teams.length} teams` : `${teams.length} teams`, ['performers.teams'], [{ quantity: teams.length, path: 'performers.teams' }]))
        const ordered = [...teams].sort((a, b) => roleOrder.indexOf(roleOfTeam(a)!) - roleOrder.indexOf(roleOfTeam(b)!))
        ordered.forEach((team, i) => {
            const outfield = Number(team.outfieldCount)
            roster.push(
                part('DERIVED', `${i === 0 ? ': ' : '; '}the ${teamNouns[roleOfTeam(team)!]} has ${outfield} outfield player${outfield === 1 ? '' : 's'}`, ['performers.teams[].outfieldCount'], [
                    { quantity: outfield, path: 'performers.teams[].outfieldCount' },
                ]),
            )
            for (const role of specializedHeld) {
                const held = Number(team[role])
                if (held > 0) roster.push(part('DERIVED', ` and ${held} ${role}${held === 1 ? '' : 's'}`, [`performers.teams[].${role}`], [{ quantity: held, path: `performers.teams[].${role}` }]))
            }
        })
    } else if (teams.length) {
        /**
         * **A per-team property is cited by its PROPERTY path, never by a member's address.** The size is entailed
         * onto each team at that member's own address, which carries its handle, and a handle is identity, not a
         * property: `identity.unit.ts` pins that none may reach coach-facing output, citations included. So the part
         * that speaks for every team cites the register's own path for the property, with the member left open —
         * which is also exactly what it claims, since it is only said where every team holds the same number.
         */
        const said = size === null ? `${teams.length} teams` : `${teams.length} teams of ${size}`
        roster.push(
            part('INSTANTIATED', roster.length ? ` into ${said}` : said, size === null ? ['performers.teams'] : ['performers.teams', 'performers.teams[].outfieldCount'], [
                { quantity: teams.length, path: 'performers.teams' },
                ...(size === null ? [] : [{ quantity: size, path: 'performers.teams[].outfieldCount' }]),
            ]),
        )
    }

    /**
     * **Availability is not involvement, and a coach is told which one they are looking at.** His rule of 30
     * September: *"Stating availability is not stating involvement: a role available in the session is instantiated
     * into a particular game only where the selected knowledge establishes it."* The role's part is chosen from what
     * each TEAM holds, which assembly writes from the game:
     *
     *   - the game involves none and the session has none — the session's own statement (", with no …s");
     *   - the game involves none and the session has some — said as a fact about THIS activity, so a coach who
     *     brought them knows they play out with everyone else;
     *   - the game involves some — how many each team has (", plus 1 … each").
     *
     * The role's NAME is data: it is the key the session stated and the leaf the register gave the row. Where teams
     * hold different counts nothing tells them apart, so it is withheld and reported.
     */
    const rolesEach: InstructionPart[] = []
    const rolesNone: { role: string; from: string[] }[] = []
    const rolesUnused: InstructionPart[] = []
    if (teams.length) {
        for (const [role, available] of Object.entries(fixture.envelope?.roles ?? {}).map(([r, c]) => [r, Number(c)] as const)) {
            const held = teams.map((t: any) => t[role])
            const carried = held.every((n: unknown) => Number.isInteger(n) && Number(n) >= 0)
            const property = `performers.teams[].${role}`
            if (!carried) {
                // The game gives the teams no count for this role, so only the session's statement can be said.
                if (available === 0) rolesNone.push({ role, from: ['envelope.roles'] })
                else {
                    observations.push(
                        `The session has ${available} ${role}${available === 1 ? '' : 's'} available and the game gives no team a count for that ` +
                            `role, so the activity cannot say whether they are used. Nothing is said rather than assumed.`,
                    )
                }
                continue
            }
            if (new Set(held).size !== 1 && !byRole) {
                observations.push(
                    `The teams hold different ${role} counts (${held.join(' and ')}), and nothing in the game tells the teams apart, so the ` +
                        `activity cannot say which team has which. Withheld rather than averaged.`,
                )
                continue
            }
            if (byRole) {
                /**
                 * **A specialized performer available and not used is said to play outfield — DRAFT, stage K4.** His D6 asks
                 * that none be given an inactive role solely to keep the teams symmetric (quoted in the authorization record's
                 * allocation principle). The roster counts a performer available and not involved among the outfield players;
                 * where some of the role ARE involved, the rest are "the other" ones. The rotation into the active role he
                 * permits (D6) is not said: nothing in the game carries it yet.
                 */
                const used = held.reduce((sum: number, n: unknown) => sum + Number(n), 0)
                const spare = available - used
                if (spare > 0) rolesUnused.push(part('DERIVED', used > 0 ? `; the other ${role}${spare === 1 ? ' plays as an outfield player' : 's play as outfield players'}` : `; ${role}s play as outfield players in this activity`, ['envelope.roles', property]))
                else if (used === 0 && available === 0) rolesNone.push({ role, from: ['envelope.roles', property] })
                continue
            }
            const involved = Number(held[0])
            if (involved === 0 && available === 0) rolesNone.push({ role, from: ['envelope.roles', property] })
            else if (involved === 0) rolesUnused.push(part('DERIVED', `; ${role}s play as outfield players in this activity`, [property]))
            else rolesEach.push(part('DERIVED', `, plus ${involved} ${role}${involved === 1 ? '' : 's'} each`, [property], [{ quantity: involved, path: property }]))
        }
    }

    // The neutral count: a part of the roster sentence, its range in the adjusting part.
    let neutralPart: InstructionPart | null = null
    const neutralAdjusting: Instruction[] = []
    if (hasNeutrals) {
        if (stated(count) && Number.isFinite(players)) {
            neutralPart = part(recorded(countPath, 'DERIVED'), `, with ${count} ${neutralNoun(count)}`, [countPath], [{ quantity: count, path: countPath }])
            const range = countRange(fixture, countPath)
            if (range?.required) {
                // Where the count is only where this activity STARTS, its required limit is what a coach may adjust
                // within, so it is said in the adjusting part; a count the game fixes keeps its limit in Players.
                const limits = limitsPhrase(range.required, n => String(n))!
                const bound = stated(range.required.max) ? range.required.max : range.required.min
                neutralAdjusting.push(instruction(stated(range.starting) ? ADJUSTING : 'Players', 'DERIVED', `Keep ${limits.text} ${neutralNoun(bound)}`, [countPath], limitsOf(countPath, limits.quantities)))
            }

            /**
             * **The preferred count is offered within what this session can field** — stage S-C2, 14 October 2026.
             * Christian, §6: *"Where a preferred count cannot be fielded with the available players, communicate the
             * valid option rather than presenting an impossible alternative."* Until the review of S-C1 the authored
             * range was offered whole (*"Around 1 to 2 neutral players works well"* at 12 players, where 1 leaves no
             * equal teams); that review stopped offering it; this offers what the session CAN field of it — the roster
             * rule's own record (`within.configurations.offered`: the authorized counts inside the preferred range),
             * read here and never recomputed — and says that it is for a group this size. At 12 players that is 2, at
             * 13 it is 1. Counts outside the preferred range are never offered as suitable (§6: *"Counts outside that
             * range should not automatically be treated as suitable merely because the arithmetic works"*).
             */
            const choice = (fixture.status.choices ?? []).find((c: any) => c.path === countPath)
            const configurations: any = choice?.within?.configurations
            const preferredCounts: number[] = []
            if (range?.preferred && stated(range.preferred.min) && stated(range.preferred.max)) {
                for (let n = range.preferred.min; n <= range.preferred.max; n++) preferredCounts.push(n)
            }
            const recordOffered: unknown = configurations?.offered
            const fieldable = Array.isArray(recordOffered) ? preferredCounts.filter(n => recordOffered.includes(n)) : preferredCounts
            const unfielded = preferredCounts.filter(n => !fieldable.includes(n))
            const unbroken = fieldable.length > 0 && fieldable[fieldable.length - 1] - fieldable[0] === fieldable.length - 1
            if (range?.preferred && preferredCounts.length && !unfielded.length) {
                const around = aroundPhrase(range.preferred, n => String(n))!
                neutralAdjusting.push(instruction(ADJUSTING, 'PREFERENCE', `${around.text} ${neutralNoun(range.preferred.max)} work${range.preferred.max === 1 ? 's' : ''} well`, [countPath], boundTo(countPath, around.quantities)))
            } else if (unfielded.length && unbroken) {
                const [low, high] = [fieldable[0], fieldable[fieldable.length - 1]]
                neutralAdjusting.push(
                    low === high
                        ? instruction(ADJUSTING, 'PREFERENCE', `${low} ${neutralNoun(low)} work${low === 1 ? 's' : ''} well for a group this size`, [countPath], [{ quantity: low, path: countPath }])
                        : instruction(ADJUSTING, 'PREFERENCE', `${low} to ${high} neutral players work well for a group this size`, [countPath], boundTo(countPath, [low, high])),
                )
            }
            if (unfielded.length && range?.preferred) {
                const authorized: number[] = Array.isArray(configurations?.authorized) ? configurations.authorized : []
                observations.push(
                    `The preferred number of neutral players (${range.preferred.min} to ${range.preferred.max}) is ` +
                        (unbroken ? `offered only as ${fieldable.join(' to ')}` : 'not offered to the coach') +
                        `. With ${players} players, ${unfielded.join(' and ')} ${unfielded.length === 1 ? 'does' : 'do'} not leave whole equal teams; ` +
                        `of the counts the knowledge authorizes, this session's roster fields ${authorized.join(', ') || 'none at all'}, and the ` +
                        `preferred range offers ${fieldable.join(', ') || 'none of them'} as a normal starting configuration (ecological ` +
                        `appropriateness: ${String(configurations?.ecological ?? 'NOT_ASSESSED')}). The activity starts at ${count}; counts outside ` +
                        `the preferred range are not offered as suitable merely because the arithmetic works.`,
                )
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
    }

    // One roster sentence: "Divide 12 players into 2 teams of 5, with 2 neutral players and no goalkeepers".
    const rosterParts = [...roster, ...rolesEach, ...(neutralPart ? [neutralPart] : [])]
    rolesNone.forEach(({ role, from }, i) => rosterParts.push(part('SESSION', `${neutralPart || i > 0 ? ' and' : ', with'} no ${role}s`, from)))
    rosterParts.push(...rolesUnused)
    if (rosterParts.length) instructions.push(joined('Players', rosterParts))
    for (const adjusting of neutralAdjusting.filter(i => i.section === 'Players')) instructions.push(adjusting)

    /**
     * **Who the neutrals play with, in his words, and their participation as the second sentence.** "Switch
     * immediately" is said ONLY where the game holds it: register row P6c (`affiliation.takesEffect`) holds the
     * timing and C43 fills it with IMMEDIATE (his 14 October ruling). The fidelity check cannot see a word, so the
     * guarantee is here: the adverb is emitted for IMMEDIATE and for nothing else. With no timing in the game the
     * sentence says they change sides and the observation stands; a timing with no wording is said without the adverb
     * and withheld, which refuses the activity.
     */
    const allegiance: InstructionPart[] = []
    if (hasNeutrals) {
        const joins = neutrals.affiliation?.joins
        const on = neutrals.affiliation?.on
        const takesEffect = neutrals.affiliation?.takesEffect
        const side = typeof joins === 'string' ? SIDE_BY_POSSESSION[joins] : undefined
        const s = one ? 's' : ''
        if (joins !== undefined || on !== undefined) {
            if (side && relationEstablished && on === 'STANDING' && takesEffect === 'IMMEDIATE') {
                allegiance.push(part(recorded(joinsPath, 'DERIVED'), `${TheNeutrals} support${s} ${side} and switch${one ? 'es' : ''} immediately when possession changes`, [joinsPath, onPath, takesEffectPath]))
            } else if (side && relationEstablished && on === 'STANDING') {
                allegiance.push(part(recorded(joinsPath, 'DERIVED'), `${TheNeutrals} support${s} ${side} and change${s} sides when possession changes`, [joinsPath, onPath]))
                if (takesEffect !== undefined) withheld.push({ path: takesEffectPath, row: 'P6c', reason: 'AWAITING_APPROVED_WORDING' })
                else {
                    observations.push(
                        `The neutral players' side is held as a standing rule (\`${onPath}\` = STANDING) that follows the team in possession, so the ` +
                            `activity says they support that team and change sides WHEN possession changes. It does not say the change is ` +
                            `IMMEDIATE, because this game holds no timing for it (\`${takesEffectPath}\` is absent). Rendering will not add the word ` +
                            `on its own authority.`,
                    )
                }
            } else {
                const missing = !relationEstablished
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
    }

    const separately: Instruction[] = []
    for (const group of game.performers?.participation ?? []) {
        const base = `performers.participation[${group.elementId}]`
        if (group.state !== undefined) {
            const named = (group.selector ?? []).find((term: any) => term?.attribute === 'group' && term?.op === '=')?.value
            // The one group this renderer can name: the register's own neutrals, by either spelling the corpus uses.
            const neutral = hasNeutrals && ['neutral', 'neutrals'].includes(String(named).toLowerCase())
            const wording = typeof group.state === 'string' ? PARTICIPATION_STATE[group.state] : undefined
            if (neutral && wording) {
                const from = [`${base}.state`, `${base}.selector`]
                // The second sentence of the allegiance where there is one ("They take a full part in play …").
                if (allegiance.length === 1) allegiance.push(part(recorded(`${base}.state`, 'DERIVED'), `. They ${wording(true)}`, from))
                else separately.push(instruction('Players', recorded(`${base}.state`, 'DERIVED'), `${TheNeutrals} ${wording(!one)}`, from, []))
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
    if (allegiance.length) instructions.push(joined('Players', allegiance))
    instructions.push(...separately)

    if (hasNeutrals) {
        const means = neutrals.distinguishable
        if (typeof means === 'string' && means.trim()) {
            const apart = teams.length === 2 ? ' from both teams' : teams.length ? ' from the teams' : ''
            /**
             * **The means is a recommendation where the knowledge makes it one — 14 October 2026.** Christian:
             * *"Contrasting bibs should be treated as a practical recommendation for distinguishing neutrals, not a
             * universal requirement, provided the players can readily identify their roles."* Recorded as C47 (the
             * authored means SUPPORTING; already a preferred default, so its strength is DEFAULT and its sentence
             * STARTING), and offered as an example rather than the rule. A means the knowledge requires keeps the old
             * wording. That the neutrals are told apart at all (NEUTRAL-06.a, P7 EXISTS) is inert under his SD-100
             * (*"do not reinterpret EXISTS as meaning … that a value is required"*), so no sentence states it as a
             * requirement of the game: the sentence says where the activity starts, and it starts with them told apart.
             */
            const status = recorded(meansPath, 'DERIVED')
            say(
                'Players',
                status,
                status === 'DERIVED' ? `Make ${theNeutrals} easy to tell apart${apart} — ${means}` : `Make ${theNeutrals} easy to tell apart${apart} — for example, ${means}`,
                [meansPath, ...(teams.length ? ['performers.teams'] : [])],
            )
        } else if (means !== undefined) {
            observations.push(
                `How the neutral players are told apart is established as ${JSON.stringify(means)}, which is not wording a coach can be given, ` +
                    `so the activity says nothing about it rather than paraphrase it.`,
            )
        }
    }
    for (const adjusting of neutralAdjusting.filter(i => i.section === ADJUSTING)) instructions.push(adjusting)

    // Where each team's size was said by its role (stage K4), the teams do have sizes: this observation is not about them.
    if (teams.length && size === null && !byRole) {
        // NOT repaired. The renderer could divide 12 by 2 and write "two teams of six" — and that is exactly the
        // forbidden move. The post-realization gate derived the size into its own evaluation context and the value
        // never reached the game, so a renderer that recomputed it would be inventing a number on its own authority.
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

    // ── How it works ────────────────────────────────────────────────────────────────────────────
    if (game.envelope?.duration_min) {
        say('How it works', recorded('envelope.duration_min', 'SESSION'), `Play for ${game.envelope.duration_min} minutes`, ['envelope.duration_min'], [
            { quantity: game.envelope.duration_min, path: 'envelope.duration_min' },
        ])
    }

    /**
     * **WHO STARTS WITH THE BALL — his ruling of 7 October.** *"Once an established rule reads possession, the
     * initial holder becomes activity-design information under SD-104. Therefore the rendered activity must faithfully
     * communicate which team starts in possession."* "Which team" is not expressible — the holder is a member handle,
     * which `identity.unit.ts` keeps out of coach-facing output, and the two teams carry no distinguishing property —
     * so the faithful rendering puts the choice to the coach, citing `possession.team` and `performers.teams`.
     *
     * **Consolidated and moved to "How it works" in stage S-C2 (14 October 2026, DRAFT):** *"Pick which team starts
     * with the ball and tell both teams before you start"*. It was *"One team starts with the ball — the game does not
     * fix which, so pick one …"* in Players. It names the object from `objects[].kind`, cited (SD-103); it wrote the
     * word "ball" uncited until this stage. With no object it says "starts in possession".
     */
    const holder = game.possession?.team
    if (holder && teams.length) {
        const held = teams.some((t: any) => String(t.elementId) === String(holder))
        if (held) {
            say(
                'How it works',
                statusAt(['possession.team'], 'COACH_CHOICE'),
                carrier ? `Pick which team starts with the ${carrier.kind} and tell both teams before you start` : 'Pick which team starts in possession and tell both teams before you start',
                ['possession.team', 'performers.teams', ...(carrier ? [`objects[${carrier.elementId}].kind`] : [])],
            )
            /**
             * **The reason this matters is read from the game, not asserted.** The clause names whatever actually
             * reads the relationship, and says plainly when nothing does.
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
        } else if (teamNoun(holder)) {
            /**
             * **The team holding a role starts with the object — stage K7, 15 October 2026 (DRAFT).** In a game played in role blocks the
             * initial holder is entailed from the start's awardee (PS1 `entailedBy`, register version 12): his D5, *"The designated
             * building team restarts."* It names a role holder, not a member, so it can be said by the role's noun, and it is.
             */
            say(
                'How it works',
                recorded('possession.team', 'DERIVED'),
                carrier ? `The ${teamNoun(holder)} starts with the ${carrier.kind}` : `The ${teamNoun(holder)} starts in possession`,
                ['possession.team', ...(carrier ? [`objects[${carrier.elementId}].kind`] : [])],
            )
        } else {
            observations.push(
                `\`possession.team\` names ${String(holder)}, which is not one of the game's own teams, so the activity says nothing ` +
                    `about who starts with the ball rather than naming something a coach cannot find.`,
            )
        }
    }

    /**
     * **A possession-change sentence requires a possession-change transition AND the relation it changes.** His
     * ruling of 7 October: *"A rendered possession-change instruction may appear only when the represented transition
     * is actually keyed on `POSSESSION_CHANGE` and the required possession relationship is established."* The
     * relation's establishment is a PRECONDITION, not a source of the content, so `possession.team` is not cited.
     *
     * **It is said ONCE, however many transitions assert it — 13 October.** The neutral condition asserts a
     * possession-change transition beside the game form's own; the qualifying transitions are gathered and one
     * sentence cites every one of them, which keeps each one's play state carried and each one's episode boundary
     * discharged. A general collapse of identical sentences would be wrong — it is made here and nowhere else.
     *
     * **Consolidated in stage S-C2 (14 October 2026, DRAFT).** *"Play continues when possession changes — there is no
     * stoppage"* (STARTING: GF2-17 authors CONTINUE as a preferred default) and *"When possession changes the teams
     * swap roles, not ends: whoever wins the ball attacks the same line they were already attacking"* (DERIVED, from
     * the objectives' fixed teams) are one sentence of two parts, each keeping its status. The second named "the
     * ball" uncited; it says "possession" now, the relation it is about.
     */
    const continuingOnPossessionChange: any[] = []
    for (const transition of game.transitions ?? []) {
        if (transition.playState !== 'CONTINUE') continue
        const keyedOnPossessionChange = (transition.selector ?? []).some(
            (term: any) => term?.attribute === 'trigger' && term?.op === '=' && term?.value === 'POSSESSION_CHANGE',
        )
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

    const objectives: any[] = game.objectives ?? []
    const objective = objectives[0]
    const shared = objective?.team === 'EACH_TEAM'
    const directional = !!objective && !shared && objectives.length > 1
    /**
     * **The targets' noun, where the objectives reference regions of one noun other than a line — stage K7 (DRAFT).** The sentences
     * below said "line" for every target, which was true of every game until the first activity's targets became zones (his 18
     * October item 3). The noun is read from the referenced regions and cited; where it is a line, or the targets differ, every
     * sentence is exactly what it was.
     */
    const targetRegions = objectives.map(o => regions.find(r => referencedBy(r) === o)).filter(Boolean)
    const targetNoun: string | null =
        targetRegions.length === objectives.length && targetRegions.length > 1 && new Set(targetRegions.map((r: any) => r.noun)).size === 1 && typeof targetRegions[0].noun === 'string' && targetRegions[0].noun !== 'line'
            ? String(targetRegions[0].noun)
            : null
    const targetNounPaths = targetNoun ? targetRegions.map((r: any) => `space.regions[${r.elementId}].noun`) : []
    // That the team winning possession keeps attacking the same line: the objectives' teams are fixed designations.
    const sameLine = (lead: string) =>
        part(statusAt([`objectives[${objectives[0].elementId}].team`], 'DERIVED'), `${lead}the team that wins possession attacks the same ${targetNoun ?? 'line'} it was already attacking`, [
            `objectives[${objectives[0].elementId}].team`,
            'transitions',
            ...targetNounPaths,
        ])
    if (continuingOnPossessionChange.length) {
        instructions.push(
            joined('How it works', [
                part(
                    statusAt(continuingOnPossessionChange.map(transition => `transitions[${transition.elementId}].playState`), 'DERIVED'),
                    'When possession changes, play carries on with no stoppage',
                    continuingOnPossessionChange.flatMap(transition => [`transitions[${transition.elementId}].playState`, `transitions[${transition.elementId}].selector`]),
                ),
                ...(directional && game.value?.primaryEvent ? [sameLine(', and ')] : []),
            ]),
        )
    }

    // ── Restarts, and where the teams start (stage K7, 15 October 2026, all DRAFT) ──────────────────
    /**
     * **Each transition that stops and restarts play, said from the values it holds.** His reply filed 17 October 2026, D1: *"When
     * the building team achieves controlled progression into its designated target, the successful build-out counts and the episode
     * concludes. The activity then restarts to create another opportunity to solve the build-out problem."* D5: *"The designated
     * building team restarts."* / *"The coach chooses an appropriate restart location consistent with the intended build-out
     * situation."* / *"The initial demonstration may use [specialized-role] distribution from the feet."* And his 18 October item 2:
     * *"Touchline: conventional [hand restart] where the ball crossed the line, taken by the team that did not touch it last."* /
     * *"End line: coach-selected restart method, using the approved M3 capability."* (Two of his terms are bracketed: the coupling
     * ratchet keeps a sport's nouns out of this layer, as the header says of the sport itself.)
     *
     * Transitions that restart play the same way — the same awardee, taker, method and location — are said in one sentence naming
     * each trigger; the others one by one. Every part cites the fields it says (trigger, qualifiers, awardee, taker, method,
     * location, play state), and a field the maps above have no words for leaves its transition unsaid, so fidelity refuses the
     * activity rather than this renderer paraphrasing it. A location or method the coach decides (`COACH_DECIDES`) is put to the
     * coach as a choice, with the bound its realization choice records in words.
     *
     * Since 18 October 2026 (post-K wording, DRAFT) the recorded words are the bound ALONE, and an empty record means nothing bounds
     * the decision beyond the coach's own judgement: the stand-ins had restated that the choice was the coach's ("You choose where
     * each of these restarts is taken: a location the coach chooses, ...") and, for an end-line restart, said engine provenance to
     * the coach in brackets ("you choose where (a location the coach selects for the restart, using the approved M3 capability)").
     * A bounded choice is said with its bound; an unbounded one as the bare choice ("restarts play where and how you choose").
     */
    const transitionsHeld: any[] = game.transitions ?? []
    const objectNoun = carrier ? String(carrier.kind) : null
    const objectPath = carrier ? [`objects[${carrier.elementId}].kind`] : []
    const triggerOf = (transition: any): string | null => {
        const term = (transition?.selector ?? []).find((t: any) => t?.attribute === 'trigger' && t?.op === '=')
        return term ? String(term.value) : null
    }
    const pathAt = (transition: any, field: string) => `transitions[${transition.elementId}].${field}`
    const coachDecides = (value: unknown): string | null => (value && typeof value === 'object' && typeof (value as any).coachDecides === 'string' ? (value as any).coachDecides : null)
    /** Who takes a restart: a specialized role of the team it is awarded to, or a player of that team — or nothing sayable. */
    const takerOf = (transition: any): string | null => {
        const actor = transition?.placement?.actor
        const awardee = teamNoun(transition?.awardedTo) ? `the ${teamNoun(transition.awardedTo)}` : objectNoun && LAST_TOUCH_PHRASE[transition?.awardedTo] ? LAST_TOUCH_PHRASE[transition.awardedTo](objectNoun) : null
        if (!awardee || typeof actor !== 'string') return null
        if (Object.keys(fixture.envelope?.roles ?? {}).includes(actor)) return `${awardee}'s ${actor}`
        if (actor === PLAYER_OF_AWARDEE) return `a player of ${awardee}`
        return null
    }
    /** The status of a part resting on these paths, read as a sentence's status is (`combinedStatus`): never firmer than its weakest firm part. */
    const partStatus = (paths: string[]): SourceStatus => combinedStatus(paths.map(p => statusOf.get(p) ?? 'DERIVED'))
    const restarting = transitionsHeld.filter(transition => transition?.playState === 'STOP_RESUME')

    // The restarts awarded to a team holding a role, keyed on triggers the maps word: said together where they restart alike.
    const roleRestarts = restarting.filter(t => teamNoun(t.awardedTo) && TRIGGER_PHRASE[triggerOf(t) ?? ''] && METHOD_PHRASE[t?.placement?.method] && takerOf(t) && coachDecides(t?.placement?.region) !== null && objectNoun)
    const restartGroups = new Map<string, any[]>()
    for (const transition of roleRestarts) {
        const key = JSON.stringify([transition.awardedTo, transition.placement.actor, transition.placement.method, transition.placement.region])
        restartGroups.set(key, [...(restartGroups.get(key) ?? []), transition])
    }
    const saidRestarts: any[][] = []
    for (const group of restartGroups.values()) {
        const [first] = group
        const firm = group.flatMap(t => [pathAt(t, 'awardedTo'), pathAt(t, 'placement.actor'), pathAt(t, 'placement.method'), pathAt(t, 'playState')])
        instructions.push(
            joined('How it works', [
                part(partStatus(firm), `${capital(takerOf(first)!)} restarts play ${METHOD_PHRASE[first.placement.method](objectNoun!)}`, [...firm, ...objectPath]),
                part(partStatus([]), `: ${listed(group.map(t => TRIGGER_PHRASE[triggerOf(t)!]))}`, group.map(t => pathAt(t, 'selector'))),
            ]),
        )
        const locations = group.map(t => pathAt(t, 'placement.region'))
        const bound = coachDecides(first.placement.region)
        say('How it works', partStatus(locations), `You choose where ${group.length > 1 ? 'each of these restarts is' : 'it is'} taken${bound ? `, ${bound}` : ''}`, locations)
        saidRestarts.push(group)
    }

    /**
     * **Where each team starts, and that it is free to move once play restarts** — his D4: *"That relationship should be re-established
     * at the beginning of each new build-out episode."*; his reply filed 18 October 2026, item 3: *"Starting placement: building-team
     * outfield players begin short of the pressure/progression line."* and *"The building team's initial positioning requirement should
     * not prevent players from advancing into useful positions as play develops."* A placement the game holds as RC-21's "beyond X (for
     * team T)" of the marked line, with T the other team, is the team's own side of the line; with T the team itself, past it. Timed
     * CONDITIONAL_RESET (P10a, EM-0002 EMP-0013), it is re-established at exactly the transitions that begin the episode it names — the
     * ones whose taker meets an arm of that episode's typed begin condition (C58), which GA-EPISODE-REACHABLE checked on this concrete
     * game; said with the restart sentence above only where those transitions are exactly one group said there ("Before each of these
     * restarts"). The begin condition itself is withheld until approved wording, so it is read here and not cited. Nothing holds a
     * player in a region during play (no access rule, no consequence), which is what "free to move" says, citing the timing.
     */
    const placementsHeld: any[] = game.performers?.startPlacement ?? []
    const beginsEpisode = (episode: unknown): string[] => {
        const arms = (game.value?.primaryEvent?.conditions ?? [])
            .map((condition: any) => condition?.referents)
            .filter((referent: any) => referent && referent.beginsEpisodeOf === episode && Array.isArray(referent.arms))
            .flatMap((referent: any) => referent.arms.map((arm: any) => arm?.takenBy).filter((taker: unknown) => typeof taker === 'string'))
        return transitionsHeld
            .filter(t => t?.playState === 'STOP_RESUME' && String(t?.startsEpisode) === 'true' && arms.includes(t?.placement?.actor))
            .map(t => String(t.elementId))
            .sort()
    }
    const sideOf = (placement: any): 'own side' | 'past' | null => {
        const region = placement?.region
        const ref = region?.of?.structuralRef
        if (!region || region.term !== BEYOND || !ref || !markedLines.has(`c:${ref.contractId}:${ref.itemId}`) || !teamNoun(placement.group) || !teamNoun(region.forTeam)) return null
        if (roleOfDesignation(region.forTeam) === roleOfDesignation(placement.group)) return 'past'
        return otherTeamNoun(placement.group) === teamNoun(region.forTeam) ? 'own side' : null
    }
    const sayablePlacements = placementsHeld.filter(p => sideOf(p) && p.timing === 'CONDITIONAL_RESET')
    const resetAt = sayablePlacements.length ? beginsEpisode(sayablePlacements[0].resetsAt) : []
    const resetGroup = saidRestarts.find(group => JSON.stringify(group.map(t => String(t.elementId)).sort()) === JSON.stringify(resetAt))
    if (sayablePlacements.length && resetGroup && sayablePlacements.every(p => p.resetsAt === sayablePlacements[0].resetsAt)) {
        const lineRef = sayablePlacements[0].region.of.structuralRef
        const placementPaths = sayablePlacements.flatMap(p => ['group', 'region', 'timing', 'resetsAt'].map(field => `performers.startPlacement[${p.elementId}].${field}`))
        const own = sayablePlacements.filter(p => sideOf(p) === 'own side').map(p => `the ${teamNoun(p.group)}`)
        const past = sayablePlacements.filter(p => sideOf(p) === 'past').map(p => `the ${teamNoun(p.group)}`)
        const clauses = [
            ...(own.length ? [`${listed(own)} ${own.length > 1 ? 'each set up on their own side' : 'sets up on its own side'} of the marked line`] : []),
            ...(past.length ? [`${listed(past)} ${past.length > 1 ? 'set up past' : 'sets up past'} the marked line`] : []),
        ]
        say(
            'How it works',
            statusAt(placementPaths, 'DERIVED'),
            `Before each of these restarts, ${clauses.join(', and ')}; once play restarts, every player is free to move anywhere`,
            [...placementPaths, `space.regions[c:${lineRef.contractId}:${lineRef.itemId}].noun`, ...resetGroup.map(t => pathAt(t, 'selector'))],
        )
    }

    // Ordinary restarts when the object goes out of play, one sentence per trigger where its transitions restart alike.
    const outGroups = new Map<string, any[]>()
    for (const transition of restarting.filter(t => OUT_OF_PLAY_TRIGGERS.includes(triggerOf(t) ?? '') && takerOf(t) && objectNoun)) {
        const key = JSON.stringify([triggerOf(transition), transition.qualifiers?.endLine ?? null, transition.awardedTo, transition.placement?.actor, transition.placement?.method, transition.placement?.region])
        outGroups.set(key, [...(outGroups.get(key) ?? []), transition])
    }
    for (const group of outGroups.values()) {
        const [first] = group
        const endLine = first.qualifiers?.endLine
        const where = triggerOf(first) === 'OUT_TOUCHLINE' ? 'a touchline' : endLine === 'EACH_TEAM' ? 'either end line' : teamNoun(endLine) ? `the ${teamNoun(endLine)}'s end line` : null
        const region = first.placement?.region
        const method = first.placement?.method
        const dynamic = region && typeof region === 'object' && typeof region.dynamic === 'string' ? String(region.dynamic) : null
        const fixedMethod = typeof method === 'string' && METHOD_PHRASE[method] ? METHOD_PHRASE[method](objectNoun!) : null
        const choiceOfPlace = coachDecides(region)
        const choiceOfMethod = coachDecides(method)
        if (!where || (!dynamic && choiceOfPlace === null) || (!fixedMethod && choiceOfMethod === null)) continue
        const qualifiers = group.flatMap(t => Object.keys(t.qualifiers ?? {}).map(field => pathAt(t, `qualifiers.${field}`)))
        const firm = group.flatMap(t => [pathAt(t, 'awardedTo'), pathAt(t, 'placement.actor'), pathAt(t, 'playState'), ...(dynamic ? [pathAt(t, 'placement.region')] : []), ...(fixedMethod ? [pathAt(t, 'placement.method')] : [])])
        const chosen = group.flatMap(t => [...(choiceOfPlace !== null ? [pathAt(t, 'placement.region')] : []), ...(choiceOfMethod !== null ? [pathAt(t, 'placement.method')] : [])])
        // A bounded choice keeps its bound beside it; where neither choice is bounded and nothing fixed is said after "restarts
        // play", the choice closes the clause ("restarts play where and how you choose"), 18 October 2026 (DRAFT).
        const choices = [
            ...(choiceOfPlace !== null ? [choiceOfPlace ? `where (${choiceOfPlace})` : 'where'] : []),
            ...(choiceOfMethod !== null ? [choiceOfMethod ? `how (${choiceOfMethod})` : 'how'] : []),
        ]
        const bare = !choiceOfPlace && !choiceOfMethod && !dynamic && !fixedMethod
        instructions.push(
            joined('How it works', [
                part(partStatus(qualifiers), `If the ${objectNoun} goes out over ${where}`, [...group.map(t => pathAt(t, 'selector')), ...qualifiers, ...objectPath]),
                part(partStatus(firm), `, ${takerOf(first)} restarts play${dynamic ? ` ${dynamic}` : ''}${fixedMethod ? `, ${fixedMethod}` : ''}`, firm),
                ...(choices.length ? [part(partStatus(chosen), bare ? ` ${listed(choices)} you choose` : `; you choose ${listed(choices)}`, chosen)] : []),
            ]),
        )
    }

    // ── How to score ────────────────────────────────────────────────────────────────────────────
    const primary = game.value?.primaryEvent
    if (primary) {
        const kindPath = 'value.primaryEvent.kind'
        /**
         * **The thing that crosses the line is named only when the game establishes one, and the noun comes from the
         * game.** His ruling of 7 October: *"A rendered scoring instruction may mention the ball only when the
         * represented game establishes the ball and the instruction's provenance legitimately supports that
         * reference."* The noun is read from `objects[].kind` and that path is CITED; `objectives[].role =
         * PRIMARY_SCORING` is what makes this the way to score at all, so it is cited here too.
         */
        /**
         * **Entry into a target zone, said for that event and for zones only — stage K7, 15 October 2026 (DRAFT).** The sentence
         * below says "across the line" for every event, which is the line-crossing event's wording; the first activity scores by
         * entering a zone (its realization choice, game::V1), whose meaning the choice quotes from his D3: *"Success occurs through
         * controlled entry, whether by carrying the ball or passing to a teammate who receives under control."* So for that event,
         * with zone targets and an object, the sentence says entry under control, carried or received, citing the event, its
         * value, the object and each target's noun. Every other game reads exactly as before.
         */
        if (primary.kind === ZONE_ENTRY_EVENT && carrier && objectives.length > 1 && targetNoun) {
            say(
                'How to score',
                statusOf.get(kindPath) ?? 'DERIVED',
                `A team scores ${primary.value} point by getting the ${carrier.kind} under control into the ${targetNoun} it is attacking: running it in, or passing to a teammate who receives it under control inside`,
                [kindPath, 'value.primaryEvent.value', `objects[${carrier.elementId}].kind`, ...targetNounPaths, ...(objective ? [`objectives[${objective.elementId}].role`] : [])],
                [{ quantity: primary.value, path: 'value.primaryEvent.value' }],
            )
        } else say(
            'How to score',
            statusOf.get(kindPath) ?? 'DERIVED',
            // "the marked line" is only unambiguous while there is one; with a target per team the objective each team
            // attacks is named relationally.
            carrier
                ? objectives.length > 1
                    ? `A team scores ${primary.value} point by getting the ${carrier.kind} across the line it is attacking`
                    : `A team scores ${primary.value} point by getting the ${carrier.kind} across the marked line`
                : objectives.length > 1
                  ? `A team scores ${primary.value} point when the line it is attacking is crossed`
                  : `A team scores ${primary.value} point when the marked line is crossed`,
            [kindPath, 'value.primaryEvent.value', ...(carrier ? [`objects[${carrier.elementId}].kind`] : []), ...(objective ? [`objectives[${objective.elementId}].role`] : [])],
            [{ quantity: primary.value, path: 'value.primaryEvent.value' }],
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
         * **The opposing arrangement, said relationally.** Two objectives each name the team that attacks them, and
         * those names are designations, not anything a coach could point at. What is entailed is that each team
         * attacks one target and defends the other, and that the coach assigns the ends. Every objective is cited.
         * Consolidated in stage S-C2 (DRAFT): *"Each team defends one line and attacks the other. Decide which team
         * starts at which end; the ends stay the same for the whole game"*.
         */
        if (directional) {
            const provenance = objectives.flatMap(o => [`objectives[${o.elementId}].team`, `objectives[${o.elementId}].reference`, `objectives[${o.elementId}].role`])
            // Stage K7 (DRAFT): where the targets are regions of another noun, each is the target at the other team's end (RC-21
            // "attacking end (of team T)", C42), said with that noun and citing it; "defends one line" stays for line targets.
            if (targetNoun) {
                say('How to score', statusAt(provenance, 'DERIVED'), `Each team attacks the ${targetNoun} at the other team's end. Decide which team starts at which end; the ends stay the same for the whole game`, [...provenance, ...targetNounPaths])
            } else say('How to score', statusAt(provenance, 'DERIVED'), `Each team defends one line and attacks the other. Decide which team starts at which end; the ends stay the same for the whole game`, provenance)
            // Said with the possession-change sentence where there is one; on its own otherwise.
            if (!continuingOnPossessionChange.length) instructions.push(joined('How to score', [sameLine('When possession changes, ')]))
        } else if (objective) {
            say(
                'How to score',
                statusAt([`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`], 'DERIVED'),
                shared ? `Both teams attack the same line — the one you marked at the end of the area` : `Each team attacks its own line`,
                [`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`],
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

        /**
         * **One sentence for the whole modifier — stage S-C2, 14 October 2026 (DRAFT).** It was four: the effect, the
         * referents, what meets the condition, and when it ends (*"When the channel condition is met, that same score
         * is worth 2 instead of 1" / "The condition is about the two channels you marked — it applies to either of
         * them" / "It is met when …" / "Once met it stays live …"*). His §7 asked for less explanation than that. Now
         * one instruction of up to three parts, each built from the same fields and gated exactly as before:
         *
         *   - the effect (operation, magnitude, base), said only where the referents name one noun — an effect said
         *     without its condition would read as unconditional;
         *   - the condition: where it is met, by the referents' noun, and what meets it, in the criterion's
         *     exact-value wording (the object named from `objects[].kind`, cited). Without criterion wording, the
         *     condition is said by its referents alone and the criterion is withheld; without a noun, nothing of the
         *     condition can be said and every field of it is withheld;
         *   - when it ends, in the termination's exact-value wording.
         *
         * The criterion is a qualitative term, so its clause is a translation, which he authorized when he settled it
         * (*"Coach-facing language may eventually translate it naturally"*): a touch, inside a referent region, by the
         * attacking team, after which that team still has possession — nothing the term does not carry.
         */
        const criterion = modifier.condition?.value
        const objectCited = carrier ? [`objects[${carrier.elementId}].kind`] : []
        const referentPaths = [`${base}.condition.type`, `${base}.condition.referents`, ...referents.map(r => `${base}.condition.referents[${r.structuralRef?.contractId}::${r.structuralRef?.itemId}`.concat(']'))]
        const parts: InstructionPart[] = []
        if (noun && effective !== null) {
            parts.push(
                part(statusAt([`${base}.operation`, `${base}.magnitude`], 'DERIVED'), `A score is worth ${effective} instead of ${primary.value}`, [`${base}.operation`, `${base}.magnitude`, 'value.primaryEvent.value'], [
                    { quantity: effective, path: `${base}.operation` },
                    { quantity: primary.value, path: 'value.primaryEvent.value' },
                ]),
            )
        } else {
            withhold('operation', 'V9a')
            withhold('magnitude', 'V9')
        }
        if (noun) {
            const where = regionsNamed.length === 2 ? `either ${noun}` : `the ${noun}`
            const worded = criterion && carrier && typeof criterion === 'string' ? CRITERION_WORDING[criterion] : undefined
            if (worded) {
                const clause = worded(carrier.kind, where)
                parts.push(
                    part(statusAt([...referentPaths, `${base}.condition.value`], 'DERIVED'), parts.length ? ` ${clause}` : `The ${noun} condition is met ${clause}`, [...referentPaths, `${base}.condition.value`, ...objectCited]),
                )
            } else {
                if (criterion) withhold('condition.value', 'V8c')
                parts.push(
                    part(statusAt(referentPaths, 'DERIVED'), parts.length ? ` when the ${noun} condition is met, which applies to ${where} you marked` : `The ${noun} condition applies to ${where} you marked`, referentPaths),
                )
            }
        } else {
            withhold('condition.type', 'V8a')
            withhold('condition.referents', 'V8b')
            // Where the condition is met cannot be said without a noun for it, so neither can what meets it.
            if (criterion) withhold('condition.value', 'V8c')
        }
        if (modifier.endsOn) {
            const worded = typeof modifier.endsOn === 'string' ? ENDS_ON_WORDING[modifier.endsOn] : undefined
            // A termination with no wording for its exact value is withheld, never paraphrased; and with nothing of the
            // modifier said it has nothing to end, so it is withheld too.
            if (worded && parts.length) parts.push(part(statusAt([`${base}.endsOn`], 'DERIVED'), `. ${parts[0].text.startsWith('A score') ? 'The bonus' : 'It'} ${worded()}`, [`${base}.endsOn`]))
            else withhold('endsOn', 'V8d')
        }
        if (parts.length) instructions.push(joined('How to score', parts))

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

    // ── Role exchange ───────────────────────────────────────────────────────────────────────────
    /**
     * **The roles, and that the ends do not change with them — DRAFT, 15 October 2026 (stage K3).** Christian, reply filed
     * 17 October 2026, D2: *"Team ends can remain fixed, while role-specific objectives and target configurations change
     * when the teams exchange roles. Please make that distinction explicit in the coach-facing instructions."* And M1:
     * *"The coach controls the exchange. No new block-duration system is needed."*
     *
     * Said only for a game that holds roles, and only what the game holds: which roles there are (each role element's
     * own value, cited), that every role passes by the coach's call with no block length (each element's exchange,
     * cited), and that each team keeps its end while the roles exchange (each objective's team and reference, cited: the
     * end a team keeps is the one opposite the target its objective references, C42). Nothing here says a target changes
     * with a role: no target configuration is keyed to a role in any game yet, and a sentence may say only what the game
     * establishes. **Nor does it say a target stays the same** (K3 review, 15 October 2026): an earlier draft said each
     * team keeps "the target it attacks, for the whole activity", which is the opposite of the half of the distinction he
     * asked to be made explicit — *"role-specific objectives and target configurations change when the teams exchange
     * roles"* (D2) and *"Allow target configurations to reflect each team's role during the block"* (M1). The region a
     * team attacks is fixed (C42); its configuration is not, so the sentence speaks of ends only. The nouns are the register's DRAFT
     * coach nouns, carried in the fixture; a value the register gives no noun for is not said (and is then uncarried, so
     * the fidelity check refuses the activity rather than this renderer naming a role itself). Every sentence is a DRAFT.
     */
    const roleElements: any[] = Array.isArray(game.activityRoles) ? game.activityRoles : []
    const objectivesHeld: any[] = Array.isArray(game.objectives) ? game.objectives : []
    const roleNouns: Record<string, string> = fixture.roleNouns?.nouns ?? {}
    const roleOf = (element: any) => (typeof element?.activityRole === 'string' ? String(element.activityRole) : null)
    if (roleElements.length && roleElements.every(element => roleOf(element) && roleNouns[roleOf(element)!]) && roleElements.length === 2) {
        const rolePaths = roleElements.map(element => `activityRoles[${element.elementId}].activityRole`)
        const [first, second] = roleElements.map(element => roleNouns[roleOf(element)!])
        say(ROLE_EXCHANGE, statusAt(rolePaths, 'DERIVED'), `Play in blocks: in each block one team is the ${first} and the other is the ${second}`, rolePaths)
        const exchanges = roleElements.map(element => element.exchange)
        if (exchanges.every(exchange => exchange === COACH_CALLS) && objectivesHeld.length) {
            const exchangePaths = roleElements.map(element => `activityRoles[${element.elementId}].exchange`)
            const endPaths = objectivesHeld.flatMap((o: any) => [`objectives[${o.elementId}].team`, `objectives[${o.elementId}].reference`])
            /**
             * **And what changes with the roles: the markings set out for them — stage K7, 15 October 2026 (DRAFT).** His D2: *"Team ends
             * can remain fixed, while role-specific objectives and target configurations change when the teams exchange roles. Please
             * make that distinction explicit in the coach-facing instructions."* Since stage K6 the game holds positions written for a
             * role holder (the marked line measured from the building team's end; each target's extent bounded or begun for the role
             * attacking it), so the half K3 could not say is now held: those positions are set out again for the new roles. Read as
             * every region whose along position is written for a role holder — by its value, its realized relation, or a bound on it —
             * and cited, so the same sentence (same citations) holds in both blocks; fidelity Q6 requires it wherever such a position
             * exists. Where none exists the sentence is exactly what it was.
             */
            const keyedPaths = roleKeyedPositions(fixture)
            const roleKeyed = regions.filter((region: any) => keyedPaths.includes(`space.regions[${region.elementId}].position.along`))
            const keyedTargets = roleKeyed.filter((region: any) => targetRegions.includes(region)).length
            const named = [
                ...(roleKeyed.some((region: any) => markedLines.has(String(region.elementId))) ? ['the marked line'] : []),
                ...(targetNoun && keyedTargets === 2 ? [`both target ${targetNoun}s`] : targetNoun && keyedTargets === 1 ? [`the target ${targetNoun}`] : []),
            ]
            const markings = !keyedPaths.length ? '' : named.length ? `, and ${named.join(' and ')} ${named.length > 1 || keyedTargets === 2 ? 'are' : 'is'} set out again for the new roles` : ', and the markings that go with them are set out again for the new roles'
            say(
                ROLE_EXCHANGE,
                statusAt([...exchangePaths, ...endPaths], 'DERIVED'),
                `Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends${markings}; there is no set block length`,
                [...exchangePaths, ...endPaths, ...keyedPaths, ...(keyedPaths.length ? targetNounPaths : [])],
            )
        }

        /**
         * **Who changes team at the exchange — said only where a reassignment is recorded; DRAFT, 15 October 2026 (stage K4).**
         * His answer to RD-1, reply filed 18 October 2026 (the first realization's reassignment, quoted on its items), and his
         * *"role exchange and participant reassignment should remain separate capabilities."* So the exchange sentence above
         * moves nobody, and this one says,
         * from each reassignment element the game holds, how many of which performers go to the team that becomes the holder
         * of which role — every count bound to its element, every element's three fields cited. Nouns: the register's DRAFT
         * outfield noun and a specialized role's own name, crossed with the game (`reassignmentNouns`). An element with no
         * noun is not said, and is then uncarried, so fidelity refuses rather than this renderer naming a performer itself.
         */
        const reassignments: any[] = Array.isArray(game.reassignments) ? game.reassignments : []
        const performerNouns: Record<string, { singular: string; plural: string }> = fixture.reassignmentNouns?.nouns ?? {}
        for (const role of roleElements.map(roleOf)) {
            // A count is said only where the game holds it as a number, so fidelity can hold the sentence to it.
            const moving = reassignments.filter(element => element?.toRole === role && performerNouns[element?.performerRow] && Number.isInteger(element?.count))
            if (!moving.length || !roleNouns[role!]) continue
            const counted = moving.map(element => ({ element, count: Number(element.count) }))
            const said = counted.map(({ element, count }) => `${count} ${count === 1 ? performerNouns[element.performerRow].singular : performerNouns[element.performerRow].plural}`)
            const total = counted.reduce((sum, entry) => sum + entry.count, 0)
            const paths = moving.flatMap(element => [`reassignments[${element.elementId}].toRole`, `reassignments[${element.elementId}].performerRow`, `reassignments[${element.elementId}].count`])
            say(
                ROLE_EXCHANGE,
                statusAt(paths, 'DERIVED'),
                `When you call the next block, ${said.length > 1 ? `${said.slice(0, -1).join(', ')} and ${said[said.length - 1]}` : said[0]} ${total === 1 ? 'moves' : 'move'} to the team that becomes the ${roleNouns[role!]}`,
                paths,
                counted.map(({ element, count }) => ({ quantity: count, path: `reassignments[${element.elementId}].count` })),
            )
        }
    }

    /**
     * **The adjustments he authorized, in his words, in "Adjusting the activity" only — DRAFT, 15 October 2026 (stage K4).**
     * His reply filed 17 October 2026, D6: *"The coach should also be able to change the numerical relationship when the
     * activity warrants it."* *"For now, I am asking that these remain possible, authorized adjustments—not that we implement
     * a live challenge-regulation system."* *"Neither adjustment should be automatically mapped to Comfortable, Stretch, or
     * Demanding."* Each is put to the coach as a choice in his own sentence, with the first sentence of his consequence, where he
     * gave one, in his words after it (it keeps his own hedges, "can" and "may"). One sentence, a coach's choice: an ADVISORY
     * sentence would be reworded as a recommendation of the knowledge, which this is not. Read from the authorization record
     * that crossed with the game (`adjustments`); nothing here names a role, a count or a challenge level.
     */
    for (const adjustment of (fixture.adjustments?.entries ?? []) as { id: string; words: string; consequence: string | null; coachWords?: string }[]) {
        if (typeof adjustment?.words !== 'string' || !adjustment.words.trim()) continue
        /**
         * Our DRAFT coach wording where the record gives one (stage K7, 15 October 2026): his words then stay the authority, cited
         * beside it, and are not put to the coach as an action they are not ("The pressure reference should be adjustable in either
         * direction."). Without it, his own sentence is the action, as before.
         */
        const coachWords = typeof adjustment.coachWords === 'string' && adjustment.coachWords.trim() ? adjustment.coachWords.trim() : null
        const own = (coachWords ?? adjustment.words.trim()).replace(/\.$/, '')
        const consequence = typeof adjustment.consequence === 'string' ? adjustment.consequence.trim().split('. ')[0].replace(/\.$/, '') : ''
        say(
            ADJUSTING,
            'COACH_CHOICE',
            `You may choose to ${own.charAt(0).toLowerCase()}${own.slice(1)}${consequence ? `: ${consequence.charAt(0).toLowerCase()}${consequence.slice(1)}` : ''}`,
            [`adjustments[${adjustment.id}].words`, ...(coachWords ? [`adjustments[${adjustment.id}].coachWords`] : []), ...(consequence ? [`adjustments[${adjustment.id}].consequence`] : [])],
        )
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

    /**
     * **Fields the knowledge says need nothing more — a technical observation, never coach text** (15 October 2026,
     * stage K1). His 17 October M6 keeps "No further value is required" apart from "explicitly unrestricted" and from
     * "missing"; the fixture now carries which one each unestablished entry is, and this is the account that reads it,
     * so the state is shown to whoever reviews the game rather than only carried. A coach is told nothing: a field
     * that needs no further value is not something a coach would say before starting. DRAFT wording.
     */
    const noFurtherValue = (fixture.status.notEstablished ?? []).filter((n: any) => nonClaimState(n.reason, n.governedBy) === NO_FURTHER_VALUE)
    if (noFurtherValue.length) {
        observations.push(
            `${noFurtherValue.length} field(s) need no further value, by an explicit statement of the knowledge that establishes them ` +
                `(${noFurtherValue.map((n: any) => n.path).join('; ')}). Nothing is missing there, and the coach is told nothing about them.`,
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
    /**
     * **Alternatives realization did not take are reported, not offered** — stage S-C2, 14 October 2026. A line
     * closed by choosing among authored alternatives (a line rather than a zone; scoring by crossing rather than by
     * entering) starts where it starts, and no approved wording describes the others — they would need facts the
     * game does not hold, such as a zone's depth. So nothing is offered to the coach, and the technical account
     * names what was not taken. One observation per distinct choice.
     */
    const alternatives = new Map<string, string[]>()
    for (const choice of fixture.status.choices ?? []) {
        const permitted = choice?.within?.permitted
        if (choice?.closure !== 'CHOSEN_AMONG_ALTERNATIVES' || !Array.isArray(permitted)) continue
        const key = `${JSON.stringify(choice.value)} among ${JSON.stringify(permitted)}`
        alternatives.set(key, [...(alternatives.get(key) ?? []), String(choice.path)])
    }
    for (const [key, paths] of alternatives) {
        const choice = (fixture.status.choices ?? []).find((c: any) => c.path === paths[0])
        const untaken = (choice.within.permitted as unknown[]).filter(v => JSON.stringify(v) !== JSON.stringify(choice.value))
        observations.push(
            `Realization chose ${key} for ${paths.join(', ')}. The alternative${untaken.length === 1 ? '' : 's'} not taken ` +
                `(${untaken.map(v => JSON.stringify(v)).join(', ')}) ${untaken.length === 1 ? 'is' : 'are'} not offered to the coach: no approved ` +
                `wording describes ${untaken.length === 1 ? 'it' : 'them'}, and saying ${untaken.length === 1 ? 'it' : 'them'} would need facts the game does not hold.`,
        )
    }

    const tiered = instructions.map(i => ({ ...i, tier: (i.section === ADJUSTING ? 'adjust' : 'setup') as 'setup' | 'adjust' }))
    return { instructions: [...tiered.filter(i => i.tier === 'setup'), ...tiered.filter(i => i.tier === 'adjust')], coachingObservations: observations, withheld }
}
