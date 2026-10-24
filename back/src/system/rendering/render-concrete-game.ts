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
import { bindingOf } from '../derivation/bound-regions'
import { nonClaimState } from '../derivation/classify'
import { loadRegister } from '../derivation/corpus'
import { participantOf, sameParticipant } from '../derivation/participants'
import { indexRegister, RegisterIndex } from '../derivation/register'
import { effectiveValue } from '../derivation/rational'
import { NO_FURTHER_VALUE } from '../derivation/types'
import { CONDITION_ROW, conditionScopeNotEvaluable } from '../derivation/resolved-game'
import { ApprovedTemplateSentence, approvedTemplateSentences, approvedWording, ApprovedWording, canonicalJson, fillTemplate, POSSESSION_CONTINUES, WordingMatch } from './approved-wording'
import { exclusionFor } from './coach-facing-exclusions'
import { facingWording, fillSlots, objectKindWording, scoresAtAnObject, scoringAtObjectWording } from './draft-coach-wording'
import { eventKindOf, genericOf } from './game-reading'
import { MARK_UNION_ONCE, MarkingChange, PhysicalLayout, Remarking, somethingMoves } from './physical-layout'
import { ADJUSTING, assignSection, inSectionOrder, PLAY_STATE_UNREADABLE, RESTARTS, ROLE_EXCHANGE, Section, SectionFacts, TransitionReading, When } from './sections'

// The two section names every importer has read from here since stages S-C1 and K3; since stage 2A they are named, with the rest
// of the sections, in `sections.ts`, the one place a section is decided.
export { ADJUSTING, ROLE_EXCHANGE }

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
 * The one member of the register's exchange vocabulary (`B3.exchange`, version 10): the coach calls the next block. Named
 * here because the sentence below is its wording; any other member would have no sentence and stay uncarried, which the
 * fidelity check refuses.
 */
export const COACH_CALLS = 'COACH_CALLS'

/**
 * **The exchange's words that nothing is re-marked, and the qualification a moved mark owes them** — stage 2D's DRAFT wording, kept in
 * one place by hardening H2 (21 October 2026, the 2D review's should-fix 2): the renderer says them (the Role exchange sentence where the
 * markings are set out once) and fidelity Q5-L reads them (a Role exchange sentence saying `NOTHING_RE_MARKED` where an authorized
 * adjustment moves a mark set out once must say one of `MOVED_MARK_QUALIFICATIONS` straight after it). Never typed a second time.
 * `the` where the one mark moved is the marked line, `a` where more than one line, or a line not called that, is moved.
 */
export const NOTHING_RE_MARKED = 'nothing is re-marked'
export const MOVED_MARK_QUALIFICATIONS = { the: ' unless you have moved the marked line', a: ' unless you have moved a marked line' } as const
/**
 * **The exchange's words for what the coach moves, where the markings are presented block by block** — stage 2G, 21 October 2026, DRAFT
 * wording, for his reply filed 23 October 2026, item 2: *"If markings change location between blocks, the instructions should identify
 * what needs to be adjusted."* The renderer says it once, before the first marking that moves; fidelity Q5-L reads it. Never typed a
 * second time.
 */
export const MOVE_MARKINGS = 'you move '

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
    /**
     * Which part of the activity this belongs to. Organisation only; carries no authority. Since stage 2A (21 October 2026) it is
     * ASSIGNED as the renderer returns, by `sections.ts` from the rows the sentence cites; what a producer writes here is a proposal
     * the assignment replaces (`producersProposals` shows them, for the tests).
     */
    section: Section
    /**
     * When the coach needs it (stage 2A): to understand and begin, to administer, or to adjust. The section's own reading
     * (`WHEN_OF_SECTION`), set with it. Optional only for instructions built by hand.
     */
    when?: When
    /**
     * In an activity composed from two role blocks (stage K3), the block a sentence belongs to where it differs between
     * them; absent where the sentence holds in both. Organisation only; carries no authority.
     */
    block?: string
    /**
     * **A sentence the role blocks say alike by role, said once** (stage 2C, 21 October 2026). His reply filed 22 October 2026, item 8,
     * asks to correct "section assignment, repetition, and information classification in the checked pathway". In an activity composed
     * from role blocks, a sentence whose words, section and status are the same in every block, and whose citations are each other's
     * under the role pairing (`role-blocks.ts` `counterpartMap`: each role's objective and target region in one block, the same role's in
     * the other), is said once with no `block`. Its `from` is block 1's citations exactly; each other block's own citations are kept
     * here, never pooled into `from`. Fidelity Q6 accepts an entry only where its block's own render says the sentence with exactly
     * these citations and the pairing maps block 1's onto them. Absent on every other sentence. Organisation only; carries no authority.
     */
    counterparts?: { blockId: string; from: string[] }[]
    text: string
    status: SourceStatus
    /** Concrete-game property paths that produced it. Empty is a defect, not a style choice. */
    from: string[]
    /** Any number appearing in `text`, so a checker can verify each one came from the game. */
    quantities: number[]
    /**
     * `setup` for the starting setup and playing instructions; `adjust` for what a coach may change from there.
     * Always the section's own reading (`adjust` exactly where the section is "Adjusting the activity"), set in
     * one place as the renderer returns, so the two cannot disagree. Since stage 2A it is derived from `when`
     * (`adjust` exactly where `when` is ADJUST). Optional only for instructions built by hand.
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
export const strongest = (statuses: SourceStatus[], fallback: SourceStatus): SourceStatus =>
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
export const SIDE_BY_POSSESSION: Record<string, string> = {
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
 * **The credit bound that bounds nothing** (row B8: the register's `contractEnums.scope` member for the whole game) — stage M1, named
 * once in stage M3 so the withheld-field table, the How to score split and fidelity Q2 read one value.
 */
export const UNBOUNDED_CREDIT = 'WHOLE_GAME'

/**
 * **The fields only approved wording may say**, by register row (V4-V6 for a primary-event condition, V16-V22
 * for an information rule). Paths and rows are the register's; nothing here names a sport.
 */
const WORDED_ONLY: { base: string; elements: (game: any) => unknown; fields: { field: string; row: string; unlessEquals?: unknown }[] }[] = [
    {
        /**
         * **A role's scoring credit confined to an episode** (row B8, register version 14) — stage M1, 17 October 2026. Christian,
         * reply filed 19 October 2026, item 1: *"Please ensure the underlying scoring eligibility reflects this distinction, rather
         * than relying solely on the coach-facing wording."*; his 14 October item 3: *"Enable accurate coach-facing communication of
         * scoring conditions and information rules, using approved language."* A bound on when a team may score is a scoring
         * condition, so it is said only by an approved entry covering it with its exact value, and withheld otherwise. A value equal
         * to `unlessEquals` (the whole game) bounds nothing and states no condition, so it is not withheld here; it is carried, or
         * reported uncarried, like any other field.
         */
        base: 'activityRoles',
        elements: game => game.activityRoles,
        fields: [{ field: 'creditedWithin', row: 'B8', unlessEquals: UNBOUNDED_CREDIT }],
    },
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
        /**
         * **An occurrence that also counts as the primary event** (rows V27-V31, register version 14) — stage M2, 17 October 2026.
         * Christian, reply filed 19 October 2026, item 2: *"For the previously flagged corner case, I favor allowing a controlled
         * regain inside that area to count as a score, provided the pressing team genuinely establishes possession."* It is a further
         * way to score, so under his 14 October item 3 (*"Enable accurate coach-facing communication of scoring conditions and
         * information rules, using approved language."*) every field is said only by an approved entry covering it with its exact
         * value, and withheld otherwise: the activity is refused at communication naming these fields until he approves a sentence.
         * His ruling prose is a decision, not approved coach wording, and no draft template says it.
         */
        base: 'value.primaryEvent.alsoCounts',
        elements: game => game.value?.primaryEvent?.alsoCounts,
        fields: [
            { field: 'team', row: 'V28' },
            { field: 'trigger', row: 'V29' },
            { field: 'control', row: 'V30' },
            { field: 'exclusion', row: 'V31' },
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

/**
 * **A phrase and the bracketed aside it closes on, as two clauses** — stage 3E, 22 October 2026 (fix (a) of the 3C review, the
 * coordinator's choice): a sentence's parts are split at its clauses, so each citation sits on the words that state it and a cut that
 * keeps a part keeps exactly what that part's words say. Where a phrase ends on one bracketed aside (" (...)"), the aside is a clause of
 * its own: `[the words it qualifies, the aside]`; otherwise `[the phrase, null]`. Read by clause structure, never by which words they are,
 * and as the overview's cuts read an aside (`coach-overview.ts` draftShorteningsOf, ASIDE).
 */
export function asideOf(phrase: string): [string, string | null] {
    const open = phrase.lastIndexOf(' (')
    return open > 0 && phrase.endsWith(')') && phrase.indexOf(')', open) === phrase.length - 1 ? [phrase.slice(0, open), phrase.slice(open)] : [phrase, null]
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
/**
 * **Who a taker is, read through the register** (`participants.ts`, register version 15) — 22 October 2026, his reply filed 25 October
 * 2026, item 6: *"This safeguard should not depend on particular wording"*. The one authored taker that is not a role was recognised
 * here by a literal copy of its wording, and a begin condition's taker by raw text; both are now the register's participant forms and
 * specialized roles, the reading GA-PARTICIPANTS-PRESENT and the begin condition's match in `gates.ts` make, so the renderer and the
 * gates cannot disagree about who a value names. Read once: the register is versioned data.
 */
let participantRegister: RegisterIndex | null = null
const participants = (): RegisterIndex => {
    if (!participantRegister) participantRegister = indexRegister(loadRegister())
    return participantRegister
}
/** The end-exchange capability (register version 18, row B10; stage D, 23 October 2026), read through the same register, once. */
const endAssignmentSpec = () => participants().endAssignment
/** The scoring event that is ENTRY into a target region, worded for that value only (its other kinds keep the line wording). */
const ZONE_ENTRY_EVENT = 'target_zone_entered'

/**
 * **Which of the two existing scoring wordings says how a team scores by a kind, or none** — stage A, 22 October 2026 (register version
 * 16). Until this every kind but the zone entry was said with the line wording ("across the line it is attacking"), so a game scored by a
 * goal or a gate would have been told it scores across a line. Now: the zone entry keeps its wording (and, where its conditions do not
 * hold, the line wording it had); a kind the register's target-type map says scores at a line (`roleScoring.targetTypes`, OUR
 * INTERPRETATION) has the line wording; ANY OTHER KIND HAS NONE — its way to score is withheld (AWAITING_APPROVED_WORDING) and fidelity
 * refuses a sentence that says it (Q2). New wording for a kind comes from data, never from a branch beside ZONE_ENTRY_EVENT (the design's
 * no-exception ratchet). A register without the map (before version 16) reads as before: the line wording for every other kind.
 *
 * **Stage G, 23 October 2026: a kind scored at an object, worded from data** (`AT_OBJECT`). Christian, reply filed 26 October 2026, item 1:
 * *"The opposing team may have a different primary scoring event where authorized by the selected context."* A kind the register's
 * target-type map does not score at a line, for which the DRAFT wording data (`docs/audits/draft-coach-wording.json`, read by
 * `draft-coach-wording.ts`) writes how a team scores at an object, has that wording; it is said only for a team whose objective references an
 * object of the kind the entry names (`howOf`, below), and withheld otherwise. Every kind with neither wording is withheld exactly as before.
 */
export function scoringWordingOf(kind: unknown, index: RegisterIndex = participants()): 'ZONE_ENTRY' | 'LINE_CROSSING' | 'AT_OBJECT' | null {
    if (kind === ZONE_ENTRY_EVENT) return 'ZONE_ENTRY'
    if (!index.roleScoring) return 'LINE_CROSSING'
    if ((index.roleScoring.targetTypes.get(String(kind)) ?? []).some(target => target.type === 'line')) return 'LINE_CROSSING'
    return scoresAtAnObject(kind) ? 'AT_OBJECT' : null
}

/** The register row a game path is of (its path with member ids taken out), as a withheld field names it (stage A). */
const rowOfKindPath = (path: string, index: RegisterIndex = participants()): string => [...index.rows.values()].find(row => genericOf(String(row.path)) === genericOf(path))?.id ?? 'not a register row'
/** The relative position RC-21 names (register `relativeTerms`, version 13), read where a start placement is stated by it. */
export const BEYOND = 'beyond X (for team T)'
/** The end a target touches, as RC-21 names it: the end its attacking team attacks, which is the other team's end (C42). */
export const ATTACKING_END = 'attacking end (of team T)'
/**
 * **Where an object set out once stands, as RC-21 names it** — Stage G, 23 October 2026, for the Set up sentence placing an object (his reply
 * filed 26 October 2026, item 5, placing the object "centered on the building team's end line, facing into the playing area, with its
 * structure outside the playing area"). `OWN_END`: the end line a team defends, with an offset in metres (here none); `CENTRAL`: centred on
 * the across axis (register version 17, machine-readable). Read only where the game holds exactly that, and cited.
 */
export const OWN_END = 'own end (of team T)'
export const CENTRAL = 'central'
/**
 * **The word for whatever each team attacks, where the targets are of different kinds — DRAFT, Stage G, 23 October 2026.** A region of one
 * noun keeps that noun ("the same zone", "the target zone of its new role"); where one team attacks a region and the other an object (his
 * reply filed 26 October 2026, item 2: *"two corresponding targets, not three"*), no one noun names both, so the sentences that name every
 * team's target say "target", citing what each objective references, and never call either a line.
 */
const GENERIC_TARGET = 'target'

const fieldOf = (element: any, field: string): unknown => field.split('.').reduce<any>((node, key) => (node == null ? undefined : node[key]), element)
const present = (value: unknown): boolean => value !== undefined && value !== null

/**
 * Does an approved cover hold on this value? `equals` is the exact value, compared whole. `refersToOwnCondition`
 * holds where the value is a typed reference to a primary-event condition this same game holds — his answer of
 * 14 October that counting information *"refers to that gate's own condition"*, made checkable.
 */
function coverHolds(game: any, match: WordingMatch, value: unknown): boolean {
    // Stage M3: compared as canonical JSON (keys sorted), so an approved value spelled with its keys in another order still equals it.
    if ('equals' in match) return canonicalJson(match.equals) === canonicalJson(value)
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
/** The fields of one element only approved words may say, as it holds them (a value equal to `unlessEquals` states no condition). */
const heldWordedFields = (fields: (typeof WORDED_ONLY)[number]['fields'], element: any) =>
    fields.filter(f => present(fieldOf(element, f.field)) && !('unlessEquals' in f && canonicalJson(fieldOf(element, f.field)) === canonicalJson(f.unlessEquals)))

/**
 * **One approved sentence for several elements, said once** — stage M3, 17 October 2026 (design step L8). Christian, reply filed 19
 * October 2026, item 1: *"Approved with revised wording"* — one sentence for the build-out scoring rule, which the game holds as a
 * role's credit bound and four conditions on the primary event. An entry whose covers each name their element (`ElementLocator`)
 * applies only where:
 *
 *   - each locator picks out EXACTLY ONE element of its collection (none or two or more: the entry does not apply — never a guess at
 *     which element he meant);
 *   - every cover holds on its element, on a field the element holds (the canonical comparison of `coverHolds`);
 *   - every located condition authored for less than every score is covered with its exact scope (the K7 rule above, held per
 *     element: a scoped condition is never said by a sentence that does not carry its scope).
 *
 * Then ONE instruction is said, citing every covered field in cover order, and those fields are said. Nothing else moves: an
 * entry whose covers name no element is matched element by element exactly as before.
 */
function locatedSentence(game: any, entry: ApprovedWording): { paths: string[] } | null {
    const groups = new Map<string, { locator: NonNullable<ApprovedWording['covers'][number]['element']>; covers: ApprovedWording['covers'] }>()
    for (const cover of entry.covers) {
        if (!cover.element) return null
        const key = canonicalJson([cover.element.base, cover.element.field, cover.element.equals])
        if (!groups.has(key)) groups.set(key, { locator: cover.element, covers: [] })
        groups.get(key)!.covers.push(cover)
    }
    const pathByCover = new Map<ApprovedWording['covers'][number], string>()
    for (const { locator, covers } of groups.values()) {
        const spec = WORDED_ONLY.find(s => s.base === locator.base)
        if (!spec) return null
        const members = Array.isArray(spec.elements(game)) ? (spec.elements(game) as any[]) : []
        const picked = members.filter(member => canonicalJson(fieldOf(member, locator.field)) === canonicalJson(locator.equals))
        if (picked.length !== 1) return null
        const [element] = picked
        const held = heldWordedFields(spec.fields, element)
        if (conditionScopeNotEvaluable(element) && !covers.some(cover => cover.row === CONDITION_ROW && 'equals' in cover.match && canonicalJson(cover.match.equals) === canonicalJson(element?.scope))) return null
        for (const cover of covers) {
            const field = held.find(f => f.row === cover.row)
            if (!field || !coverHolds(game, cover.match, fieldOf(element, field.field))) return null
            pathByCover.set(cover, `${spec.base}[${element?.elementId}].${field.field}`)
        }
    }
    return { paths: entry.covers.map(cover => pathByCover.get(cover)!) }
}

/**
 * **An approved entry's own `section`, as its sentence's proposal** — stage 2A, 21 October 2026. The field stays validated by the loader
 * (`approved-wording.ts`, unchanged) and documents where he saw the sentence; placement is assigned from what the sentence cites, like
 * every other sentence's, and a test requires the assignment to equal each production entry's `section`. The loader admits one name
 * no activity section has ("What to watch"); it is carried here only as a proposal the assignment replaces, so it is typed as one.
 */
const proposedBy = (entry: ApprovedWording): Section => entry.section as Section

function sayInApprovedWords(game: any, wording: ApprovedWording[], push: (instruction: Instruction) => void, withheld: WithheldField[]): void {
    /** Every field an approved sentence says, by its full path (stage M3: a located entry says fields of several elements at once). */
    const saidPaths = new Set<string>()
    for (const entry of wording) {
        if (!entry.covers.length || !entry.covers.every(cover => cover.element)) continue
        const located = locatedSentence(game, entry)
        if (!located) continue
        push(instruction(proposedBy(entry), 'DERIVED', entry.sentence, located.paths, []))
        for (const path of located.paths) saidPaths.add(path)
    }
    for (const { base, elements, fields } of WORDED_ONLY) {
        for (const element of Array.isArray(elements(game)) ? (elements(game) as any[]) : []) {
            const pathOf = (field: string) => `${base}[${element?.elementId}].${field}`
            // A value equal to the field's `unlessEquals` (stage M1: a credit bound of the whole game) states no condition, so no entry is owed for it.
            const held = heldWordedFields(fields, element)
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
            for (const entry of wording) {
                // Stage M3: an entry whose covers name their elements was said (or not) once, above; it is never matched element by element.
                if (entry.covers.some(cover => cover.element)) continue
                if (scoped && !entry.covers.some(cover => cover.row === CONDITION_ROW && 'equals' in cover.match && canonicalJson(cover.match.equals) === canonicalJson(element?.scope))) continue
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
                push(instruction(proposedBy(entry), 'DERIVED', text, [...covered.map(({ field }) => pathOf(field!.field)), ...slots.map(slot => pathOf(slot.field))], numeric))
                for (const { field } of covered) saidPaths.add(pathOf(field!.field))
            }
            for (const field of held) if (!saidPaths.has(pathOf(field.field))) withheld.push({ path: pathOf(field.field), row: field.row, reason: 'AWAITING_APPROVED_WORDING' })
        }
    }
}

/**
 * **The positions a game writes for a role holder** — stage K7, 15 October 2026: every region whose along position is written for a
 * block-scoped role holder (`roleNouns.holders`), by its value (a distance from that team's end), by its realized relation ("beyond X
 * (for team T)") or by a bound on it. These are what changes with the roles (his D2: *"role-specific objectives and target configurations
 * change when the teams exchange roles"*): block by block they are set out again for the new roles; with every block's markings set out
 * once (stage 2D, `physical-layout.ts`), they are which marked zone each team now attacks. Either way the exchange sentence cites them,
 * and fidelity Q6 (role-blocks.ts) requires a sentence that does. Empty for every game with no role holder.
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
/**
 * **The row of every field only approved words may say, as this game holds it — said or withheld** — stage M5, 18 October 2026. The
 * review evidence knew the row of such a field only from the withheld list (a condition's scope, row V3, has no path the register
 * spells), so the moment his first approved sentence (reply filed 19 October 2026, item 1) said the four build-out scopes, they lost
 * their row: his item 4 dropped them from its elements and the provenance named no row (MEASURED in the M5 snapshot diff). The rows
 * are the table's above, read from the game; nothing is said or withheld here.
 */
export function wordedFieldRows(game: any): { path: string; row: string }[] {
    return WORDED_ONLY.flatMap(({ base, elements, fields }) =>
        (Array.isArray(elements(game)) ? (elements(game) as any[]) : []).flatMap(element => heldWordedFields(fields, element).map(field => ({ path: `${base}[${element?.elementId}].${field.field}`, row: field.row }))),
    )
}

/**
 * **Where a role's credit is bounded, How to score reads role by role** — the review of stage M5, 18 October 2026. Organisation only:
 * no sentence is added, removed, reworded or re-cited, and nothing is said or withheld here. Measured in M5: the approved sentences
 * were pushed after every sentence the renderer says itself, so A01 read "Pressing team: Score ...", "Each score is worth 1 point",
 * "Each team attacks ...", and only then the building team's sentence (his reply filed 19 October 2026, item 1) - not the order the
 * design's coach text and our email of 19 October 2026 showed him ("For context, How to score would then read:" the building team's
 * sentence, the non-restoration sentence, the pressing team's sentence, its regain sentence, "Each score is worth 1 point"). With the
 * regain sentence put to him ("... winning the ball inside that zone ...") said straight after the building team's line, its "that
 * zone" would point at the wrong team's target.
 *
 * So, only in a game where some role element's credit is bounded (row B8 not the whole game; every other game is untouched), the How to
 * score sentences said so far are re-ordered in place, stably: first, role by role in the game's own role order, every sentence citing
 * that role's credit bound (its own DRAFT sentence where the bound is the whole game; his approved words where it is not); then every
 * other sentence said in approved words for How to score; then the rest, in the order the renderer said them. Read from citations and
 * the game's role elements only; no role, goal or sport term.
 *
 * Since stage 2A (21 October 2026) it runs after every sentence has been placed (`placeInstructions`), over the sentences ASSIGNED to
 * How to score, so the role order is read on the section the coach sees and never on a producer's proposal.
 */
function scoringInRoleOrder(instructions: Instruction[], game: any, approved: Set<Instruction>): void {
    const roleElements: any[] = Array.isArray(game?.activityRoles) ? game.activityRoles : []
    if (!roleElements.some(element => present(element?.creditedWithin) && canonicalJson(element.creditedWithin) !== canonicalJson(UNBOUNDED_CREDIT))) return
    const slots = instructions.map((instruction, at) => ({ instruction, at })).filter(({ instruction }) => instruction.section === 'How to score')
    const rank = (instruction: Instruction): number => {
        const role = roleElements.findIndex(element => instruction.from.includes(`activityRoles[${element?.elementId}].creditedWithin`))
        return role >= 0 ? role : approved.has(instruction) ? roleElements.length : roleElements.length + 1
    }
    const ordered = slots.map(({ instruction }, said) => ({ instruction, said, rank: rank(instruction) })).sort((a, b) => a.rank - b.rank || a.said - b.said)
    slots.forEach(({ at }, n) => (instructions[at] = ordered[n].instruction))
}

/**
 * The sentences approved wording says for this game, each with exactly what it cites (read by text and citations; their `section` is
 * the entry's own proposal, never placed here, since placement needs the fixture).
 */
export function approvedSentences(game: any, wording: ApprovedWording[] = approvedWording()): Instruction[] {
    const said: Instruction[] = []
    sayInApprovedWords(game, wording, instruction => said.push(instruction), [])
    return said
}

/** The takers that meet an arm of an episode's typed begin condition (C58), read from the primary event's conditions. */
const beginArmTakers = (game: any, episode: unknown): string[] =>
    (game?.value?.primaryEvent?.conditions ?? [])
        .map((condition: any) => condition?.referents)
        .filter((referent: any) => referent && referent.beginsEpisodeOf === episode && Array.isArray(referent.arms))
        .flatMap((referent: any) => referent.arms.map((arm: any) => arm?.takenBy).filter((taker: unknown) => typeof taker === 'string'))

/** The transitions that stop and restart play, begin an episode, and are taken by one of these takers (the same participant, read as `gates.ts` reads it). */
const episodeStarters = (transitions: any[], takers: string[]): any[] =>
    transitions.filter(t => t?.playState === 'STOP_RESUME' && String(t?.startsEpisode) === 'true' && takers.some(taker => sameParticipant(participants(), taker, t?.placement?.actor)))

/**
 * **The transitions that begin the episode a bounded role's credit is confined to, each with that role element** — stage 3C, 21 October
 * 2026, for the Coach Overview's composer (`coach-overview.ts`), which classes such a transition's when and who by the PROPOSED essentials
 * table. Read exactly as placement and the start-placement sentence read them (`beginArmTakers`, `episodeStarters`), for every role
 * element whose credit (row B8) is any bound but the whole game; a transition beginning the episode of more than one role element lists
 * each. Reading only; nothing is said here.
 */
export function boundedEpisodeStartersOf(game: any): Map<string, string[]> {
    const transitions: any[] = Array.isArray(game?.transitions) ? game.transitions : []
    const roleElements: any[] = Array.isArray(game?.activityRoles) ? game.activityRoles : []
    const starters = new Map<string, string[]>()
    for (const element of roleElements) {
        const episode = element?.creditedWithin
        if (!present(episode) || canonicalJson(episode) === canonicalJson(UNBOUNDED_CREDIT)) continue
        for (const transition of episodeStarters(transitions, beginArmTakers(game, episode))) {
            const id = String(transition.elementId)
            starters.set(id, [...new Set([...(starters.get(id) ?? []), String(element?.elementId)])])
        }
    }
    return starters
}

/** A transition's trigger, where its selector fixes one. */
const triggerOfTransition = (transition: any): string | null => {
    const term = (transition?.selector ?? []).find((t: any) => t?.attribute === 'trigger' && t?.op === '=')
    return term ? String(term.value) : null
}

/**
 * **What placement reads beside the rows, for one game** — stage 2A, 21 October 2026 (`sections.ts` `SectionFacts`). His reply filed 22
 * October 2026, item 2: *"For example, the basic [specialized-role] restart condition is essential because it determines when the
 * building team can score again. The complete procedural details of every restart should remain accessible but do not all need to appear
 * in the overview."* (his role noun bracketed, as the coupling ratchet keeps a sport's nouns out of this layer; nothing here reads it).
 * So a transition that stops and restarts play is told apart by what it holds:
 *
 *   - it OPENS play, or the episode a role's credit is confined to, where its trigger is START, or where it begins an episode and its
 *     taker meets an arm of the typed begin condition of an episode some role element's credit is confined to (row B8, any bound but
 *     the whole game) — read exactly as the start-placement sentence's `beginsEpisode` reads it;
 *   - any other stop-and-restart is a RESTART (the ball going out, in every game today);
 *   - a transition whose play state is CONTINUE does not stop play, and is part of how play runs;
 *   - a transition whose play state is missing or neither value (row T6) cannot be read, and a sentence citing it is refused (the review
 *     of stage 2A: it was read as part of how play runs, so silence placed a sentence).
 *
 * And the lines realization closed to a starting value inside a range, whose required limits are what a coach adjusts within (the
 * neutral count's floor, said in Adjusting the activity since the review of S-C1).
 */
export function sectionFactsOf(fixture: Fixture): SectionFacts {
    const game = fixture?.game ?? {}
    const transitions: any[] = Array.isArray(game.transitions) ? game.transitions : []
    const roleElements: any[] = Array.isArray(game.activityRoles) ? game.activityRoles : []
    const bounded = roleElements.map(element => element?.creditedWithin).filter(scope => present(scope) && canonicalJson(scope) !== canonicalJson(UNBOUNDED_CREDIT))
    const opening = new Set<string>([
        ...transitions.filter(t => t?.playState === 'STOP_RESUME' && triggerOfTransition(t) === 'START').map(t => String(t.elementId)),
        ...bounded.flatMap(episode => episodeStarters(transitions, beginArmTakers(game, episode)).map(t => String(t.elementId))),
    ])
    // Row T6 holds STOP_RESUME or CONTINUE; any other value, or none, is read as nothing (a citation of it is refused in `sections.ts`).
    const readingOf = (t: any): TransitionReading =>
        t?.playState === 'CONTINUE' ? 'IN_PLAY' : t?.playState !== 'STOP_RESUME' ? PLAY_STATE_UNREADABLE : opening.has(String(t?.elementId)) ? 'EPISODE_OPENER' : 'RESTART'
    const kinds = new Map<string, TransitionReading>(transitions.map(t => [String(t?.elementId), readingOf(t)] as const))
    const startingLines = new Set<string>(
        ((fixture?.status?.choices ?? []) as any[]).filter(choice => choice?.closure === 'STARTING_VALUE_IN_RANGE' && stated(choice?.value) && typeof choice?.path === 'string').map(choice => String(choice.path)),
    )
    return { transitionKind: id => kinds.get(id) ?? null, startingLines }
}

/**
 * **Every sentence placed, in reading order** — stage 2A, 21 October 2026. Each sentence is assigned its section and `when` from what it
 * cites (`assignSection`), its `tier` is derived from `when`, How to score is read role by role where a role's credit is bounded
 * (`scoringInRoleOrder`, over the sentences assigned there), and the sentences are put in section order, keeping the order they were
 * said in within each section. Organisation only: no sentence is added, dropped, reworded or re-cited.
 */
function placeInstructions(produced: Instruction[], fixture: Fixture, approved: Set<Instruction>): Instruction[] {
    const facts = sectionFactsOf(fixture)
    const placed: Instruction[] = produced.map(instruction => {
        const { section, when } = assignSection(instruction, facts)
        return { ...instruction, section, when, tier: when === 'ADJUST' ? 'adjust' : 'setup' }
    })
    scoringInRoleOrder(placed, fixture.game, new Set(placed.filter((_, n) => approved.has(produced[n]))))
    return inSectionOrder(placed)
}

export function renderConcreteGame(fixture: Fixture, wording: ApprovedWording[] = approvedWording(), templates: ApprovedTemplateSentence[] = approvedTemplateSentences()): RenderedActivity {
    const produced = produceRendering(fixture, wording, templates)
    return { instructions: placeInstructions(produced.instructions, fixture, produced.approved), coachingObservations: produced.observations, withheld: produced.withheld }
}

/**
 * **The sentences as their producers proposed them, before placement** — stage 2A, for the section tests only: each `section` is the
 * producer's literal (or an approved entry's own), in the order the producers said them. The served rendering is `renderConcreteGame`.
 */
export function producersProposals(fixture: Fixture, wording: ApprovedWording[] = approvedWording(), templates: ApprovedTemplateSentence[] = approvedTemplateSentences()): Instruction[] {
    return produceRendering(fixture, wording, templates).instructions
}

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
 *
 * Exported in stage 3A (21 October 2026) so the Coach Overview (`coach-overview.ts`) reads each property's status exactly as the
 * Details sentences do; moved out of `produceRendering` unchanged.
 */
export function statusesOf(fixture: Fixture): Map<string, SourceStatus> {
    const statusOf = new Map<string, SourceStatus>()
    for (const d of fixture.status.derived) statusOf.set(d.path, STATUS_OF_STRENGTH[String(d.strength)] ?? 'DERIVED')
    for (const c of fixture.status.choices) statusOf.set(c.path, c.closure === 'COACH_DECIDES' ? 'COACH_CHOICE' : 'STARTING')
    return statusOf
}

/**
 * **How one game is read for the sentences that name a team, a target or the marked line** — exported in stage 3A, 21 October 2026,
 * moved out of `produceRendering` unchanged, so the Coach Overview (`coach-overview.ts`) names each team, target and marked line by
 * exactly the reading the Details sentences use and never by a second copy of it (his reply filed 22 October 2026, item 1: *"Both
 * levels must derive from the same authorized activity representation, with no contradictions or invented instructions."*).
 */
export function gameReadingOf(fixture: Fixture) {
    const game = fixture.game
    const geometryFor = (elementId: string, axis: 'along' | 'across') =>
        fixture.status.geometry.find((g: any) => g.path.includes(`[${elementId}]`) && g.path.endsWith(`.${axis}`))

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
    const referencedBy = (region: any) =>
        (game.objectives ?? []).find((o: any) => {
            const ref = o?.reference?.structuralRef
            return ref && `c:${ref.contractId}:${ref.itemId}` === String(region.elementId)
        })
    return { geometryFor, roleNounOf, holdersInBlock, roleOfDesignation, teamNoun, otherTeamNoun, areaLength, areaWidth, fromTeamEnd, markedLines, referencedBy }
}

/** One count a team holds, as the Players sentence says it ("6 outfield players", "1 <role>", "6 other players"). */
export interface CountSegment {
    /** What joins it to the segment before it in the team's phrase: nothing for the first, else ", " or " and ". */
    joiner: '' | ', ' | ' and '
    text: string
    status: SourceStatus
    /** The PROPERTY paths it is of (never a member's handle, `identity.unit.ts`). */
    from: string[]
    /** Its one number, bound to the property path, exactly as the Players sentence binds it. */
    bindings: Binding[]
}

/** One team's counts, said by the role it holds in this block. */
export interface TeamCountPhrase {
    /** Which team: its position in `performers.teams` (the team is never named by its handle). */
    team: number
    /** The role the team holds in this block, and that role's DRAFT noun. */
    role: string
    noun: string
    /** "6 outfield players" + " and 1 <role>"; "1 <role>" + " and 6 other players"; "5 other players". */
    segments: CountSegment[]
}

/**
 * **The teams' counts, by team** — the Players sentence's own builder, exported in stage 3A (21 October 2026). The BUILD PLAN's
 * reconciliation: *"one shared team-indexed count builder serves the Players sentence, the overview and the diagram"* (the D4 verifier
 * showed the roster sentence's parts are split by quantity, not by team, so nothing may read the counts back out of the sentence).
 * Moved out of `produceRendering` with every rule unchanged (K4, M4, S-C2, below), so the Players sentence is byte-identical:
 *
 *   - `BY_ROLE`: each team said by the role it holds in this block, its own counts ("the building team has 6 outfield players and
 *     1 <role>; the pressing team has 5 outfield players");
 *   - `BY_ROLE_COUNTED`: the same where the session has more of a specialized role than the teams involve, everyone else counted as
 *     "other players" ("1 <role> and 6 other players"; "5 other players");
 *   - `EQUAL`: no team told apart, the teams said together ("2 teams of 6", or "2 teams" where they hold no one size);
 *   - `NONE`: the game has no teams.
 *
 * `teams` holds one entry per team, in the block's role order, in the two by-role modes, and is empty otherwise. `neutrals` is the
 * neutral count the roster says ("2 neutral players"), where the game states one.
 */
export interface TeamCountPhrases {
    mode: 'BY_ROLE' | 'BY_ROLE_COUNTED' | 'EQUAL' | 'NONE'
    /** "2 teams" in the by-role modes; "2 teams of 6" or "2 teams" where EQUAL; null with no teams. */
    teamsCount: { text: string; status: SourceStatus; from: string[]; bindings: Binding[] } | null
    teams: TeamCountPhrase[]
    /** The one size every team holds, or null. */
    size: number | null
    /** Whether the teams are told apart by the roles they hold (both by-role modes). */
    byRole: boolean
    /** The specialized roles the session has more of than the teams involve (`BY_ROLE_COUNTED`). */
    countedOnly: { role: string; available: number }[]
    neutrals: { count: number; text: string; status: SourceStatus; from: string[]; bindings: Binding[] } | null
}

export function teamCountPhrases(fixture: Fixture): TeamCountPhrases {
    const game = fixture.game
    const statusOf = statusesOf(fixture)
    const teams: any[] = game.performers?.teams ?? []
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
     * **More of a specialized role than the teams involve: counted, never given an outfield role — stage M4, 17 October 2026 (design
     * step L11, DRAFT).** His reply filed 19 October 2026, item 5: *"The second-[specialized role] case and optional rotation can remain
     * visible as limitations for now. I don't want to prescribe an outfield role for a [specialized role] universally."* (his role noun
     * bracketed, as the coupling ratchet keeps a sport's nouns out of this layer). In a game played by role, where the teams involve
     * some of a role and the session has more, the roster says what each team holds, counting everyone else as "other players"
     * ("Divide 12 players into 2 teams: the building team has 1 <role> and 6 other players; the pressing team has 5 other players").
     * Was (stage K4, DRAFT): "...; the other <role> plays as an outfield player". The design put the session's count in the sentence
     * too ("12 players, 2 of them <role>s"); measured, fidelity refuses that number, which the game does not hold, so it is not said. The counting rule beneath is unchanged (assemble-concrete-game.ts rosterFor counts a performer available and
     * not involved in the outfield places, his 30 September "availability is not involvement"); which team that player joins, and
     * whether the role rotates, are not carried, and the review page shows them as a limitation. The universal sentence for a game
     * that involves none of the role is not this branch and is unchanged.
     */
    const countedOnly: { role: string; available: number }[] = []
    if (teams.length && byRole) {
        for (const [role, available] of Object.entries(fixture.envelope?.roles ?? {}).map(([r, c]) => [r, Number(c)] as const)) {
            const held = teams.map((t: any) => t[role])
            if (!held.every((n: unknown) => Number.isInteger(n) && Number(n) >= 0)) continue
            const used = held.reduce((sum: number, n: unknown) => sum + Number(n), 0)
            if (used > 0 && available > used) countedOnly.push({ role, available })
        }
    }

    const segment = (joiner: CountSegment['joiner'], text: string, from: string[], bindings: Binding[]): CountSegment => ({ joiner, text, status: 'DERIVED', from: [...new Set(from)], bindings })
    // Each team in the block's role order, keeping its position in `performers.teams`.
    const inRoleOrder = teams.map((team, index) => ({ team, index })).sort((a, b) => roleOrder.indexOf(roleOfTeam(a.team)!) - roleOrder.indexOf(roleOfTeam(b.team)!))
    const phrases: TeamCountPhrase[] = []
    let mode: TeamCountPhrases['mode'] = 'NONE'
    let teamsCount: TeamCountPhrases['teamsCount'] = null
    if (teams.length && byRole && countedOnly.length) {
        // The session's count of the role is not said: the game holds only each team's (measured 17 October 2026, stage M4 - a
        // binding of the session's 2 to `envelope.roles` is refused by fidelity Q2, the game holding no such number). "Other
        // players" counts everyone else, the unused performers of the role among them, and names no part they play.
        mode = 'BY_ROLE_COUNTED'
        teamsCount = { text: `${teams.length} teams`, status: 'INSTANTIATED', from: ['performers.teams'], bindings: [{ quantity: teams.length, path: 'performers.teams' }] }
        for (const { team, index } of inRoleOrder) {
            const outfield = Number(team.outfieldCount)
            const roles = specializedHeld.filter(role => Number(team[role]) > 0)
            const segments: CountSegment[] = roles.map((role, j) => {
                const held = Number(team[role])
                return segment(j === 0 ? '' : ', ', `${held} ${role}${held === 1 ? '' : 's'}`, ['envelope.roles', `performers.teams[].${role}`], [{ quantity: held, path: `performers.teams[].${role}` }])
            })
            segments.push(segment(roles.length ? ' and ' : '', `${outfield} other player${outfield === 1 ? '' : 's'}`, ['performers.teams[].outfieldCount'], [{ quantity: outfield, path: 'performers.teams[].outfieldCount' }]))
            phrases.push({ team: index, role: roleOfTeam(team)!, noun: teamNouns[roleOfTeam(team)!], segments })
        }
    } else if (teams.length && byRole) {
        /**
         * **Each team's counts, by the role it holds** (stage K4, DRAFT): "Divide 12 players into 2 teams: the building team has
         * 6 outfield players and 1 <role>; the pressing team has 5 outfield players". Each count is cited by its PROPERTY
         * path (never a member's handle, `identity.unit.ts`) and bound to it, so fidelity checks the number against what the
         * teams hold; a specialized role is said only for a team that involves it, by the role's own name.
         */
        mode = 'BY_ROLE'
        teamsCount = { text: `${teams.length} teams`, status: 'INSTANTIATED', from: ['performers.teams'], bindings: [{ quantity: teams.length, path: 'performers.teams' }] }
        for (const { team, index } of inRoleOrder) {
            const outfield = Number(team.outfieldCount)
            const segments: CountSegment[] = [segment('', `${outfield} outfield player${outfield === 1 ? '' : 's'}`, ['performers.teams[].outfieldCount'], [{ quantity: outfield, path: 'performers.teams[].outfieldCount' }])]
            for (const role of specializedHeld) {
                const held = Number(team[role])
                if (held > 0) segments.push(segment(' and ', `${held} ${role}${held === 1 ? '' : 's'}`, [`performers.teams[].${role}`], [{ quantity: held, path: `performers.teams[].${role}` }]))
            }
            phrases.push({ team: index, role: roleOfTeam(team)!, noun: teamNouns[roleOfTeam(team)!], segments })
        }
    } else if (teams.length) {
        /**
         * **A per-team property is cited by its PROPERTY path, never by a member's address.** The size is entailed
         * onto each team at that member's own address, which carries its handle, and a handle is identity, not a
         * property: `identity.unit.ts` pins that none may reach coach-facing output, citations included. So the part
         * that speaks for every team cites the register's own path for the property, with the member left open —
         * which is also exactly what it claims, since it is only said where every team holds the same number.
         */
        mode = 'EQUAL'
        teamsCount = {
            text: size === null ? `${teams.length} teams` : `${teams.length} teams of ${size}`,
            status: 'INSTANTIATED',
            from: size === null ? ['performers.teams'] : ['performers.teams', 'performers.teams[].outfieldCount'],
            bindings: [{ quantity: teams.length, path: 'performers.teams' }, ...(size === null ? [] : [{ quantity: size, path: 'performers.teams[].outfieldCount' }])],
        }
    }

    // The neutral count, as the roster says it, where the game states one (the roster's own condition; its observations stay there).
    const neutralsHeld = game.performers?.neutrals
    const count = neutralsHeld && typeof neutralsHeld === 'object' ? neutralsHeld.count : undefined
    const countPath = 'performers.neutrals.count'
    const neutrals = stated(count)
        ? { count, text: `${count} ${count === 1 ? 'neutral player' : 'neutral players'}`, status: statusOf.get(countPath) ?? ('DERIVED' as SourceStatus), from: [countPath], bindings: [{ quantity: count, path: countPath }] }
        : null
    return { mode, teamsCount, teams: phrases, size, byRole, countedOnly, neutrals }
}

function produceRendering(fixture: Fixture, wording: ApprovedWording[], templates: ApprovedTemplateSentence[]): { instructions: Instruction[]; observations: string[]; withheld: WithheldField[]; approved: Set<Instruction> } {
    const instructions: Instruction[] = []
    const observations: string[] = []
    const withheld: WithheldField[] = []
    const game = fixture.game
    // Each property's status (`statusesOf`, above; moved out unchanged in stage 3A).
    const statusOf = statusesOf(fixture)
    /** The status of a sentence resting on these paths: the strongest any of them carries. */
    const statusAt = (paths: string[], fallback: SourceStatus): SourceStatus => strongest(paths.map(p => statusOf.get(p)).filter((s): s is SourceStatus => !!s), fallback)
    /**
     * **The game's end assignment** — stage D, 23 October 2026 (register version 18, row B10, the endAssignment block; his reply filed 25
     * October 2026, item 5). Read from the game at the register's path, never a value written here: `endsChange` where the teams change ends
     * at the coach-called block, so no sentence says the ends stay the same; `assignmentPaths` cites the value wherever the game states one
     * (either value), so it is carried. A game that states none (every game before stage D) is said exactly as before.
     */
    const endSpec = endAssignmentSpec()
    const endValue = endSpec ? fieldOf(game, endSpec.path) : undefined
    const endsChange = !!endSpec && endValue === endSpec.exchanged
    const assignmentPaths = endSpec && endValue !== undefined && endValue !== null ? [endSpec.path] : []

    /** A plain sentence, one part, each number it says bound to the path it is of (stage S-C2). */
    const say = (section: Instruction['section'], status: SourceStatus, core: string, from: string[], bindings: Binding[] = []) =>
        instructions.push(instruction(section, status, core, from, bindings))

    /**
     * The status of a property is whatever the fixture records, never what the renderer assumes. Envelope
     * facts in particular arrive from the session but are recorded as DERIVED once folded into the game,
     * and labelling them SESSION would misstate the provenance trace even though both phrase identically.
     */
    const recorded = (path: string, fallback: SourceStatus): SourceStatus => statusOf.get(path) ?? fallback

    /**
     * The object the game establishes, read once for every sentence that names it. Its `kind` is the only
     * source of the noun (SD-103, below at the scoring instruction, where the rule was first applied), and a
     * sentence that uses it cites `objects[…].kind`.
     *
     * **The played object is the object no objective references** — the integration review fix, 23 October 2026 (the design's Stage G
     * carrier fix, taken early because it now produced false sentences). Since stage B an objective may reference an object (register J2,
     * "object or region reference"; his reply filed 25 October 2026, item 3), and the first object with a kind was then the target: on the
     * TEST-ONLY goal version the draft said the building team "starts with the goal" and that the goal goes out over a touchline. A target
     * is not what the teams play with, so an object some objective references is never the carrier. In a game whose objectives reference
     * regions only (every served game) the carrier is exactly what it was.
     */
    const referencedObject = (object: any) =>
        (game.objectives ?? []).some((o: any) => {
            const ref = o?.reference?.structuralRef
            return !!ref && `c:${ref.contractId}:${ref.itemId}` === String(object?.elementId)
        })
    const carrier = (game.objects ?? []).find((object: any) => typeof object?.kind === 'string' && !referencedObject(object))
    /**
     * **The object an objective scores at, where it references one** — Stage G, 23 October 2026 (register J2, "object or region reference";
     * his reply filed 25 October 2026, item 3, a physical object as an authorized alternative target). Read by the sentences that say a team's
     * target or how it scores at it; null where the objective references a region, or nothing the game holds.
     */
    const objectsHeld: any[] = Array.isArray(game.objects) ? game.objects : []
    const objectById = (id: unknown) => objectsHeld.find((object: any) => String(object?.elementId) === String(id)) ?? null
    const objectTargetOf = (objective: any) => {
        const ref = objective?.reference?.structuralRef
        return ref ? objectById(`c:${ref.contractId}:${ref.itemId}`) : null
    }
    /** Where the register says an object's geometry, facing and defending team sit (Stage G), so no leaf is written here. */
    const objectSpec = participants().objectGeometry
    const defendedByRow = participants().roleScoring?.defendedByRow ?? null
    const defendedByLeaf = defendedByRow ? String(participants().rows.get(defendedByRow)?.path ?? '').split('[].').pop() || null : null

    /**
     * Each team named by the role it holds in this block (stage K7, DRAFT nouns), the marked line (stage K7), and the objective that
     * references a region: read by `gameReadingOf` (above), moved out of here unchanged in stage 3A so the Coach Overview reads them alike.
     */
    const { geometryFor, roleNounOf, holdersInBlock, roleOfDesignation, teamNoun, otherTeamNoun, areaLength, areaWidth, fromTeamEnd, markedLines, referencedBy } = gameReadingOf(fixture)
    const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`
    const listed = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? '')
    /**
     * **Every block's markings set out once, where they occupy the same places — stage 2D, 21 October 2026 (DRAFT wording).** His reply
     * filed 22 October 2026, item 7: *"For this particular 40 × 30 m configuration, we can also simplify setup by marking the halfway line
     * and both 5 m end zones at the beginning. Role exchanges should not require unnecessary physical re-marking."* and *"The knowledge can
     * continue to represent the distinct targets and relationships for each block, even where the physical markings remain unchanged."*
     * Since stage 2G a general presentation rule, his reply filed 23 October 2026, item 2: *"Please authorize marking once whenever the
     * system can establish that the physical markings occupy the same locations across all blocks."* The layout is read from the fixture
     * (`physical-layout.ts` computes it from both blocks' realized geometry and attaches it wherever the markings coincide; no record is
     * read); without one, every sentence below is what it was, except the exchange sentence where the fixture carries what moves at the
     * exchange (`remarking`, below).
     */
    const layout: PhysicalLayout | null = fixture.layout?.policy === MARK_UNION_ONCE ? (fixture.layout as PhysicalLayout) : null
    /** Stage 2G: what moves at the exchange, where the markings are presented block by block (never beside a layout). */
    const remarking: Remarking | null = !layout && Array.isArray(fixture.remarking?.changes) ? (fixture.remarking as Remarking) : null

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
    /**
     * **A region bound to an object is said by no sentence yet** (H3, 23 October 2026; register version 21, row S7). Its words are Stage G's
     * (the d26 design's N6, DRAFT, after his approval), so it is not handed to the sentences below: read as an ordinary region it would be
     * told as a strip "along the touchline", which it is not. Unsaid, fidelity names it (Q5: a region with no marking instruction; Q3: its
     * lines carried by nothing), so a game holding one is refused at communication, honestly, until its words exist. No production game
     * holds one.
     */
    const regions: any[] = (game.space?.regions ?? []).filter((region: any) => !bindingOf(region, participants()))

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
    // The objective that references a region: `referencedBy`, read by `gameReadingOf` (stage 3A, moved out unchanged).
    const lines = regions.filter(r => r.noun === 'line' && !markedLines.has(String(r.elementId)))

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
        /**
         * Stage 2D (DRAFT): a line held at one place in every block, set out once. "Halfway" is read from the values, never written as a
         * fact: said only where the layout holds the line at a mark twice whose position is the area's length, and the offset from the
         * team's end is that position, so it is the distance from each end line; the sentence cites the offset and the length both.
         */
        const once = positioned && layout ? layout.marks.find(mark => mark.line === String(region.elementId)) : undefined
        if (positioned && once && along?.path && once.at * 2 === areaLength && positioned.offset === once.at) {
            say('Set up', status, `Mark a ${noun} across the area at halfway, ${metres(positioned.offset)} from each end line`, [nounPath, along.path, across?.path, 'envelope.area.length_m', `layout.marks[${once.elementId}].at`].filter(Boolean) as string[], [
                { quantity: positioned.offset, path: along.path },
            ])
            continue
        }
        /**
         * Stage C, 23 October 2026 (the words are the line's own sentence below, unchanged): a line the layout holds at one place in every
         * block because it is measured from the same end line in every block (`physical-layout.ts`), wherever it is. Said only where its
         * offset is its distance from the end line its realization is measured from in this block, and it cites the mark it is, so the
         * layout's mark is told (Q5-L). Until this stage such a line could not be set out once at all (T34).
         */
        const anchor = along?.geometry?.anchor
        if (positioned && once && along?.path && typeof anchor === 'number' && Math.abs(once.at - anchor) === positioned.offset) {
            say('Set up', status, `Mark a ${noun} across the area, ${metres(positioned.offset)} from the ${positioned.team}'s end line`, [nounPath, along.path, across?.path, `layout.marks[${once.elementId}].at`].filter(Boolean) as string[], [
                { quantity: positioned.offset, path: along.path },
            ])
            continue
        }
        if (positioned) {
            say('Set up', status, `Mark a ${noun} across the area, ${metres(positioned.offset)} from the ${positioned.team}'s end line`, [nounPath, along?.path, across?.path].filter(Boolean) as string[], along?.path ? [{ quantity: positioned.offset, path: along.path }] : [])
            continue
        }
        const zone = targetZone(region)
        if (zone) {
            // Stage 2D: with the markings set out once, each role's target is said after them, below.
            if (!layout) say('Set up', status, zone.text, zone.from, zone.bindings)
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

    /**
     * **The end zones set out once, and each role's target said by role — stage 2D, 21 October 2026 (DRAFT wording).** His item 7 above,
     * and the BUILD PLAN: "Set up says the union once, and two mirrored target sentences state each role's target, each citing its
     * region's noun, position and the 5 m extent". Said only with a layout:
     *
     *   - the zones at the two ends, one depth, in one sentence ("Mark a {d} m end {noun} across the full width at each end"), citing the
     *     noun of every region a zone is in some block, each zone's depth (the number is bound to the first, as the merged channel sentence
     *     binds its own) and each zone's inner mark. The noun is the regions' own, so no noun is written here;
     *   - then each target, in the block's role order, by the role that attacks it: "The {attacker}'s target {noun} is the {d} m end {noun}
     *     at the {defender}'s end" where its region IS an end zone and its depth is required, or "... is everything beyond the marked line,
     *     up to the {defender}'s end line[, including the end {noun} there]" where it begins at the marked line (the clause only where a
     *     zone lies inside it at that end). Each cites its region's noun and positions, its objective's team, reference and role, and the
     *     zone it names. The two blocks say these in the same words, each citing its own role's target, so the composition says each once
     *     (stage 2C, with the layout's mirror, `role-blocks.ts` `counterpartMap`).
     *
     * A target the layout leaves nothing to say for is not said, so fidelity refuses the activity (Q5) rather than this renderer marking it
     * block by block in a layout that sets the markings out once.
     */
    if (layout) {
        const regionById = (id: string) => regions.find((r: any) => String(r.elementId) === id)
        const nounOfZone = (zone: PhysicalLayout['zones'][number]): string | null => {
            const nouns = [...new Set(zone.sources.map(source => regionById(source.regionId)?.noun))]
            return nouns.length === 1 && typeof nouns[0] === 'string' ? nouns[0] : null
        }
        const [near, far] = layout.zones
        if (layout.zones.length === 2 && near.depthM === far.depthM && nounOfZone(near) && nounOfZone(near) === nounOfZone(far)) {
            const nounPaths = [...new Set(layout.zones.flatMap(zone => zone.sources.map(source => source.regionId)))].filter(id => regionById(id)).map(id => `space.regions[${id}].noun`)
            say(
                'Set up',
                statusAt(nounPaths, 'DERIVED'),
                `Mark a ${metres(near.depthM)} end ${nounOfZone(near)} across the full width at each end`,
                [...nounPaths, ...layout.zones.map(zone => `layout.zones[${zone.elementId}].depthM`), ...layout.zones.map(zone => `layout.marks[${zone.inner}].at`)],
                [{ quantity: near.depthM, path: `layout.zones[${near.elementId}].depthM` }],
            )
        }
        /**
         * **An object set out once, placed in one sentence — Stage G, 23 October 2026 (DRAFT wording).** Christian, reply filed 26 October
         * 2026, item 5: *"[The object] should be centered on the building team's end line, facing into the playing area, with its structure
         * outside the playing area."* and *"It remains physically stationary when the teams exchange ends."*; item 6: *"Record that the
         * physical [object] is defended by the team with the active [specialized performer] during that block"* (his nouns bracketed: the
         * coupling ratchet keeps a sport's nouns out of this layer). The layout holds the object at one place in every block
         * (`layout.objects`, `physical-layout.ts`), so it is placed once, from the layout: "Place a {kind} centred on the {team}'s end line{,
         * the words for its facing}{, where its structure stands}{; the team with the active {performer} defends it}". Said only where the game holds
         * exactly that: on the end line the holder of a role defends (RC-21 "own end (of team T)" for a role holder, no offset, realized at one
         * point on an end line, so the words are the same in every block), centred across the area (RC-21 "central", realized), facing a way the words above translate, and defended by a
         * specialized performer row the register names. Each part cites what it says: the kind and the layout entry; the along and across
         * positions; the facing; the along position and the kind for where its structure stands (the DRAFT wording data's words for the kind,
         * said only for an object with no depth inside the area); the defending row. No size is said: the width is the session's own goal's.
         * An object with anything else is not placed here, so fidelity Q5-L and Q3 refuse the activity rather than this renderer guessing.
         *
         * **The Stage G review fix, 23 October 2026.** The words for a facing come from the DRAFT wording data (`facingWording`, keyed by the
         * register's O6.facing vocabulary), as the words for where the structure stands do; a facing with no entry has no words, so the object
         * is not placed. The defending clause says "the team with the active {performer}", his own words in item 6 (*"the team with the
         * active [specialized performer] during that block"*): with two such performers in the roster, the second plays as one of the other
         * players, and "the team with the {performer}" read as either team.
         */
        for (const entry of layout.objects ?? []) {
            const object = objectById(entry.objectId)
            if (!object || typeof object.kind !== 'string' || !objectSpec) continue
            const base = `objects[${object.elementId}]`
            const [kindAt, alongAt, acrossAt, facingAt] = [`${base}.${objectSpec.kindLeaf}`, `${base}.${objectSpec.alongLeaf}`, `${base}.${objectSpec.acrossLeaf}`, `${base}.${objectSpec.facingLeaf}`]
            const alongValue: any = fieldOf(object, objectSpec.alongLeaf)
            const acrossValue: any = fieldOf(object, objectSpec.acrossLeaf)
            const offset = alongValue && typeof alongValue === 'object' ? alongValue.offsetM : null
            // The team is named by the role whose holder the position is written for (`roleNouns.holders`), so the words are the same in every
            // block wherever the layout holds the object at one place; an end-assigned team (whose role changes between blocks) gives none here.
            const holderRole = alongValue && typeof alongValue === 'object' ? (fixture.roleNouns?.holders ?? {})[String(alongValue.forTeam)] : undefined
            const team = typeof holderRole === 'string' ? roleNounOf[holderRole] ?? null : null
            const at = geometryFor(object.elementId, 'along')?.geometry?.interval
            const across = geometryFor(object.elementId, 'across')?.geometry?.interval
            const onEndLine = alongValue?.term === OWN_END && offset && offset.from === 0 && offset.to === 0 && !!team && !!at && at.from === at.to && (at.from === 0 || at.from === areaLength)
            if (!onEndLine || acrossValue?.term !== CENTRAL || !across) continue
            const facing = fieldOf(object, objectSpec.facingLeaf)
            const facingWords = facing === undefined ? null : facingWording(facing)?.words ?? null
            if (facing !== undefined && !facingWords) continue
            const defendedBy = defendedByLeaf ? object[defendedByLeaf] : undefined
            const defender = defendedBy === undefined ? null : participants().specializedRoleRows.get(String(defendedBy)) ?? null
            if (defendedBy !== undefined && !defender) continue
            const defendedAt = `${base}.${defendedByLeaf}`
            const standing = objectKindWording(object.kind)
            instructions.push(
                joined('Set up', [
                    part(statusAt([kindAt], 'DERIVED'), `Place a ${object.kind}`, [kindAt, `layout.objects[${entry.elementId}]`]),
                    part(statusAt([alongAt, acrossAt], 'DERIVED'), ` centred on the ${team}'s end line`, [acrossAt, alongAt]),
                    ...(facingWords ? [part(statusAt([facingAt], 'DERIVED'), `, ${facingWords}`, [facingAt])] : []),
                    ...(standing ? [part(statusAt([alongAt, kindAt], 'DERIVED'), standing.standsOutsideArea, [alongAt, kindAt])] : []),
                    ...(defender ? [part(statusAt([defendedAt], 'DERIVED'), `; the team with the active ${defender} defends it`, [defendedAt])] : []),
                ]),
            )
        }
        const layoutTarget = (region: any): { text: string; from: string[]; bindings: Binding[] } | null => {
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
            const from = [`space.regions[${region.elementId}].noun`, along.path, across.path, `objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`, `objectives[${objective.elementId}].role`]
            const exact = layout.zones.find(zone => zone.from === span.from && zone.to === span.to)
            const depth = along.geometry.extentBound?.requiredWithin
            if (exact && depth && stated(depth.min) && depth.min === depth.max && span.to - span.from === depth.min && nounOfZone(exact)) {
                return { text: `The ${attacker}'s target ${region.noun} is the ${metres(depth.min)} end ${nounOfZone(exact)} at the ${defender}'s end`, from: [...from, `layout.zones[${exact.elementId}]`], bindings: [{ quantity: depth.min, path: along.path }] }
            }
            const of = along.geometry.relation?.of
            const referent = of ? `c:${of.contractId}:${of.itemId}` : null
            if (referent && markedLines.has(referent) && along.geometry.relation.term === BEYOND) {
                const end = span.to === areaLength ? areaLength : 0
                const inside = layout.zones.filter(zone => zone.from >= span.from && zone.to <= span.to && (zone.from === end || zone.to === end) && nounOfZone(zone))
                const including = inside.length === 1 ? `, including the end ${nounOfZone(inside[0])} there` : ''
                return {
                    text: `The ${attacker}'s target ${region.noun} is everything beyond the marked line, up to the ${defender}'s end line${including}`,
                    from: [...from, `space.regions[${referent}].noun`, ...(including ? [`layout.zones[${inside[0].elementId}]`] : [])],
                    bindings: [],
                }
            }
            return null
        }
        const roleRank = (region: any): number => {
            const objective = referencedBy(region)
            const role = objective ? roleOfDesignation(objective.team) : null
            const rank = role ? Object.keys(holdersInBlock).indexOf(role) : -1
            return rank < 0 ? Number.MAX_SAFE_INTEGER : rank
        }
        /**
         * **A role's target that is an object set out once — Stage G, 23 October 2026 (DRAFT wording).** His reply filed 26 October 2026, item
         * 2: *"two corresponding targets, not three"*. Where a role's objective references an object the layout sets out once, its target
         * sentence names the object by its kind, in the block's role order with the region targets: "The {attacker}'s target is the {kind}",
         * citing the objective's team, reference and role, the object's kind and its layout entry. Where the object stands is the placing
         * sentence's alone (fidelity Q5-L: one Set up sentence denotes an object's position), so it is not said or cited here.
         */
        const objectTarget = (objective: any): { text: string; from: string[] } | null => {
            const object = objectTargetOf(objective)
            const attacker = teamNoun(objective?.team)
            const entry = object ? (layout.objects ?? []).find(placed => placed.objectId === String(object.elementId)) : undefined
            if (!object || !entry || !attacker || typeof object.kind !== 'string' || !objectSpec) return null
            const from = [`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`, `objectives[${objective.elementId}].role`, `objects[${object.elementId}].${objectSpec.kindLeaf}`, `layout.objects[${entry.elementId}]`]
            return { text: `The ${attacker}'s target is the ${object.kind}`, from }
        }
        const rankOfObjective = (objective: any): number => {
            const role = roleOfDesignation(objective?.team)
            const rank = role ? Object.keys(holdersInBlock).indexOf(role) : -1
            return rank < 0 ? Number.MAX_SAFE_INTEGER : rank
        }
        // The region targets in the order they always were, and any object target among them by its role's rank (a stable sort: every game
        // with no object target says exactly what it did).
        const targetsInRoleOrder = [
            ...regions.filter(r => targetZone(r)).map(region => ({ rank: roleRank(region), region, objective: null as any })),
            ...((game.objectives ?? []) as any[]).filter(objective => objectTargetOf(objective)).map(objective => ({ rank: rankOfObjective(objective), region: null as any, objective })),
        ].sort((a, b) => a.rank - b.rank)
        for (const { region, objective } of targetsInRoleOrder) {
            if (region) {
                const said = layoutTarget(region)
                if (said) say('Set up', statusOf.get(`space.regions[${region.elementId}].noun`) ?? 'DERIVED', said.text, said.from, said.bindings)
                continue
            }
            const said = objectTarget(objective)
            if (said) say('Set up', statusAt(said.from, 'DERIVED'), said.text, said.from)
        }
    }

    // ── Players ─────────────────────────────────────────────────────────────────────────────────
    const teams: any[] = game.performers?.teams ?? []
    const players = game.envelope?.players
    /**
     * Each team's counts, by team (stage 3A): `teamCountPhrases`, above, the one builder the Players sentence, the Coach Overview and the
     * diagram share. Teams told apart by the role each holds in this block (stage K4), everyone else counted as "other players" where the
     * session has more of a specialized role than the teams involve (stage M4), or the teams said together: every rule there, unchanged.
     */
    const counts = teamCountPhrases(fixture)
    const { size, byRole, countedOnly } = counts

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
    /**
     * The teams, then each team's own counts by the role it holds where the teams are told apart by role ("into 2 teams: the building
     * team has 6 outfield players and 1 <role>; the pressing team has 5 outfield players"; "...: the building team has 1 <role> and 6
     * other players; ..."), else the teams said together ("into 2 teams of 6"). Every word, part, status, citation and binding is the
     * shared builder's (`teamCountPhrases`, stage 3A); only the joining words of this sentence are said here.
     */
    if (counts.teamsCount) {
        const { text, status, from, bindings } = counts.teamsCount
        roster.push(part(status, roster.length ? ` into ${text}` : text, from, bindings))
        counts.teams.forEach((team, i) => {
            const lead = `${i === 0 ? ': ' : '; '}the ${team.noun} has `
            team.segments.forEach((segment, j) => roster.push(part(segment.status, `${j === 0 ? lead : segment.joiner}${segment.text}`, segment.from, segment.bindings)))
        })
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
                // Stage M4: said by count in the roster sentence above, never as an outfield role (his reply filed 19 October 2026, item 5).
                if (countedOnly.some(entry => entry.role === role)) continue
                // Reached only where the teams involve none of the role (some involved and more available is said by count above).
                if (spare > 0) rolesUnused.push(part('DERIVED', `; ${role}s play as outfield players in this activity`, ['envelope.roles', property]))
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
            // The count as the shared builder says it (`teamCountPhrases`, stage 3A): its words, status, citation and binding.
            const said = counts.neutrals!
            neutralPart = part(said.status, `, with ${said.text}`, said.from, said.bindings)
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
    /**
     * **"Line" only for line targets — the integration review fix, 23 October 2026 (a TIGHTENING).** Where the targets' noun is not read
     * (above), the sentences below fell back to "line" for every target. That was true of every game until a target could be an object
     * (stage B; his reply filed 25 October 2026, item 3, a physical goal as an authorized alternative target): on the TEST-ONLY goal version
     * they said "each team keeps attacking the same line", "Each team defends one line and attacks the other" and "each team now attacks
     * the target line of its new role", each false for the team attacking the object (the third for both teams). The design's Stage A rule:
     * a target with no wording "is never given the line wording". So "line" is said only where every objective references a region whose
     * noun is a line (every line-target game, exactly as before). Anywhere else none of these sentences is said with "line", and each
     * objective whose target cannot take it has its reference withheld (AWAITING_APPROVED_WORDING), so the activity is refused at
     * communication, naming why, until wording for such a target comes from data (Stage G): an object target where one is referenced,
     * otherwise every target that is not a line. Fidelity Q2's clause on a target called a line is the independent check.
     */
    const targetOfObjective = (o: any) => regions.find((r: any) => referencedBy(r) === o)
    const lineTargets = objectives.length > 0 && objectives.every(o => targetOfObjective(o)?.noun === 'line')
    const sayableNoun: string | null = targetNoun ?? (lineTargets ? 'line' : null)
    /**
     * **Targets of different kinds, each one the game holds — Stage G, 23 October 2026 (DRAFT wording).** Where one team attacks a region and
     * another an object (his reply filed 26 October 2026, item 2: *"two corresponding targets, not three"*; item 1: one primary scoring event per
     * role), no one noun names every target, so the sentences that name every team's target say `GENERIC_TARGET` ("each team keeps attacking
     * the same target", "each team now attacks the target of its new role"), citing what each objective references; never "line". Only where
     * the targets are not all of one noun and every objective references a region or an object the game holds: every game whose targets share
     * a noun, or are all lines, says exactly what it did, and one whose objective references nothing the game holds is withheld as before.
     */
    const differentTargets = !sayableNoun && objectives.length > 1 && objectives.every(o => !!targetOfObjective(o) || !!objectTargetOf(o)) && objectives.some(o => !!objectTargetOf(o))
    const targetWord: string | null = sayableNoun ?? (differentTargets ? GENERIC_TARGET : null)
    const targetWordPaths: string[] = sayableNoun ? targetNounPaths : differentTargets ? objectives.map(o => `objectives[${o.elementId}].reference`) : []
    const withholdTargetNouns = (sentence: string) => {
        const notLines = objectives.filter(o => targetOfObjective(o)?.noun !== 'line')
        const objectTargets = notLines.filter(o => !targetOfObjective(o))
        const withholding = objectTargets.length ? objectTargets : notLines
        for (const o of withholding) {
            const at = `objectives[${o.elementId}].reference`
            if (!withheld.some(field => field.path === at)) withheld.push({ path: at, row: rowOfKindPath(at), reason: 'AWAITING_APPROVED_WORDING' })
        }
        observations.push(
            `${sentence} is not said: it names every target with one noun, and ${withholding.map(o => `objectives[${o.elementId}]`).join(', ')} ` +
                `${withholding.length === 1 ? 'references a target' : 'reference targets'} that ${objectTargets.length ? (withholding.length === 1 ? 'is no region' : 'are no regions') : 'no one noun names'}, so the line wording ` +
                `cannot stand for ${withholding.length === 1 ? 'it' : 'them'}. Withheld until wording for such a target comes from data.`,
        )
    }
    // That the team winning possession keeps attacking the same line: the objectives' teams are fixed designations.
    const sameLine = (lead: string, noun: string) =>
        part(statusAt([`objectives[${objectives[0].elementId}].team`], 'DERIVED'), `${lead}the team that wins possession attacks the same ${noun} it was already attacking`, [
            `objectives[${objectives[0].elementId}].team`,
            'transitions',
            ...targetWordPaths,
        ])
    /**
     * **His possession sentence, read from the record — stage M4, 17 October 2026 (design step L10).** His reply filed 19 October 2026,
     * item 4: *"I approve both of your proposed revisions:"* … *"Use: "When possession changes, play carries on without a stoppage, and
     * each team keeps attacking the same zone.""* The words are the approved template sentence's parts (`approved-coach-wording.json`,
     * read by `approved-wording.ts`, which refuses a template whose parts do not reproduce his sentence), never written here: the first
     * part cites each continuing transition's play state and selector, as the DRAFT it replaces did; the second, said where the
     * objectives name different teams, cites the objectives' team and the targets' noun, filled from the game (`zone` reproduces his
     * sentence; `line`, in the demonstrations, is a generalization of his words, DRAFT). Without the template the sentence is not said,
     * so fidelity finds the play state uncarried and refuses, rather than this renderer saying it in words nobody approved. Was
     * (DRAFT): "When possession changes, play carries on with no stoppage, and the team that wins possession attacks the same {noun} it
     * was already attacking". A game with no continuing transition reads exactly as before (the How to score sentence below).
     */
    const possessionTemplate = templates.find(template => template.id === POSSESSION_CONTINUES && template.parts.length === 2)
    if (continuingOnPossessionChange.length && possessionTemplate) {
        const [playsOn, keepsAttacking] = possessionTemplate.parts
        // The integration review fix (above): the second part only with a noun every target takes; otherwise withheld, never "line". Stage G:
        // where the targets are of different kinds, each one the game holds, "target" (a generalization of his words, DRAFT, as "line" is).
        const keeps = targetWord ? fillTemplate([keepsAttacking], { targetNoun: targetWord }) : null
        if (!targetWord && directional && game.value?.primaryEvent) withholdTargetNouns(`The second part of the possession sentence ("${keepsAttacking}")`)
        instructions.push(
            joined('How it works', [
                part(
                    statusAt(continuingOnPossessionChange.map(transition => `transitions[${transition.elementId}].playState`), 'DERIVED'),
                    playsOn,
                    continuingOnPossessionChange.flatMap(transition => [`transitions[${transition.elementId}].playState`, `transitions[${transition.elementId}].selector`]),
                ),
                ...(directional && game.value?.primaryEvent && keeps
                    ? [part(statusAt([`objectives[${objectives[0].elementId}].team`], 'DERIVED'), keeps, [`objectives[${objectives[0].elementId}].team`, 'transitions', ...targetWordPaths])]
                    : []),
            ]),
        )
    } else if (continuingOnPossessionChange.length) {
        observations.push(
            `The game continues play on a change of possession (${continuingOnPossessionChange.map(t => t.elementId).join(', ')}), and the approved ` +
                `sentence for it (${POSSESSION_CONTINUES}) is not in the approved wording, so it is not said rather than said in unapproved words.`,
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
        const participant = participantOf(participants(), actor)
        if (participant?.kind === 'SPECIALIZED_ROLE') return `${awardee}'s ${participant.name}`
        // A player of the team the restart is awarded to (A01-R1's T3 for ordinary restarts), by the form's DRAFT coach noun.
        if (participant?.kind === 'PERFORMER_OF_AWARDED_TEAM' && participant.name) return `a ${participant.name} of ${awardee}`
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
    /**
     * **Where each team starts, and that it is free to move once play restarts** — his D4: *"That relationship should be re-established
     * at the beginning of each new build-out episode."*; his reply filed 18 October 2026, item 3: *"Starting placement: building-team
     * outfield players begin short of the pressure/progression line."* and *"The building team's initial positioning requirement should
     * not prevent players from advancing into useful positions as play develops."* A placement the game holds as RC-21's "beyond X (for
     * team T)" of the marked line, with T the other team, is the team's own side of the line; with T the team itself, past it. Timed
     * CONDITIONAL_RESET (P10a, EM-0002 EMP-0013), it is re-established at exactly the transitions that begin the episode it names — the
     * ones whose taker meets an arm of that episode's typed begin condition (C58), which GA-EPISODE-REACHABLE checked on this concrete
     * game; said with the restart sentence below only where those transitions are exactly one group said there ("Before each of these
     * restarts"), and since stage 2B directly after that group's WHEN sentence (his D4 keeps it with the restart moments). The begin
     * condition itself is withheld until approved wording, so it is read here and not cited. Nothing holds a player in a region during
     * play (no access rule, no consequence), which is what "free to move" says, citing the timing.
     */
    const placementsHeld: any[] = game.performers?.startPlacement ?? []
    // Read by the module's two helpers since stage 2A, which placement (`sectionFactsOf`) reads the same way.
    const beginsEpisode = (episode: unknown): string[] =>
        episodeStarters(transitionsHeld, beginArmTakers(game, episode))
            .map(t => String(t.elementId))
            .sort()
    const sideOf = (placement: any): 'own side' | 'past' | null => {
        const region = placement?.region
        const ref = region?.of?.structuralRef
        if (!region || region.term !== BEYOND || !ref || !markedLines.has(`c:${ref.contractId}:${ref.itemId}`) || !teamNoun(placement.group) || !teamNoun(region.forTeam)) return null
        if (roleOfDesignation(region.forTeam) === roleOfDesignation(placement.group)) return 'past'
        return otherTeamNoun(placement.group) === teamNoun(region.forTeam) ? 'own side' : null
    }
    const sayablePlacements = placementsHeld.filter(p => sideOf(p) && p.timing === 'CONDITIONAL_RESET')
    const resetAt = sayablePlacements.length ? beginsEpisode(sayablePlacements[0].resetsAt) : []
    /** Whether the start placement is said with this group: its transitions are exactly the ones the placements are re-established at. */
    const placementResetsAt = (group: any[]): boolean =>
        sayablePlacements.length > 0 &&
        sayablePlacements.every(p => p.resetsAt === sayablePlacements[0].resetsAt) &&
        JSON.stringify(group.map(t => String(t.elementId)).sort()) === JSON.stringify(resetAt)
    const sayPlacement = (resetGroup: any[]) => {
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

    /**
     * **When a role's restart happens, said apart from how it is taken — stage 2B, 21 October 2026 (DRAFT wording).** His reply filed 22
     * October 2026, item 2: *"For example, the basic [specialized-role] restart condition is essential because it determines when the
     * building team can score again. The complete procedural details of every restart should remain accessible but do not all need to
     * appear in the overview."* (his role noun bracketed, as the header says of the sport). Until this stage one sentence said both
     * ("{taker} restarts play {method}: {triggers}"), so either the procedure sat in the first read or the restart moments left it.
     * Now each group says, in its own words and with its own citations:
     *
     *   - WHEN: "{Taker} restarts play: {triggers}", citing the awardee and taker, the play state and each trigger's selector. Placed by
     *     what it cites (`sections.ts`): with a transition that opens play or a bounded episode, in How it works, and the start
     *     placement follows it directly (his D4); with any other, in Restarts and ball out;
     *   - HOW: "{Taker} restarts play {method}", citing the awardee and taker, the method and the object;
     *   - WHERE: "You choose where {taker} restarts play{, bound}", citing the awardee and taker and each location. It names its own
     *     restart: it said "each of these restarts", whose antecedent was the sentence now split (the D2 verification's finding).
     *
     * The taker is cited wherever it is named (SD-103, above), and so is said by all three; placement reads an opener's taker below its
     * procedure (`OPENER_TAKER`), so HOW and WHERE go to Restarts and ball out. Every other path the one sentence cited is cited by
     * exactly one of WHEN and HOW. The words are the one sentence's, cut at the colon, with the taker said again at the start of HOW;
     * WHERE's "{taker} restarts play" replaces "each of these restarts is taken" (DRAFT).
     *
     * **Stage 3E, 22 October 2026: each restart moment its own part** (the words unchanged). Until 3E the moments were one part citing every
     * trigger's selector, so no cut could keep some of its words and know what they still say. Now each trigger's phrase, with the joiner
     * the list gives it (": ", ", ", " and "), is a part citing that trigger's selector, and a phrase's closing bracketed aside (`asideOf`)
     * is a part of its own citing the same selector: it says more of the same trigger (when the coach may judge it), so the words it
     * qualifies still say that trigger without it. The sentence's text, status and citations are exactly as before.
     */
    for (const group of restartGroups.values()) {
        const [first] = group
        const taker = takerOf(first)!
        const who = group.flatMap(t => [pathAt(t, 'awardedTo'), pathAt(t, 'placement.actor')])
        const stops = group.map(t => pathAt(t, 'playState'))
        const methods = group.map(t => pathAt(t, 'placement.method'))
        const locations = group.map(t => pathAt(t, 'placement.region'))
        const moments = group.flatMap((t, k) => {
            const [words, aside] = asideOf(TRIGGER_PHRASE[triggerOf(t)!])
            const selector = [pathAt(t, 'selector')]
            const joiner = k === 0 ? ': ' : k === group.length - 1 ? ' and ' : ', '
            return [part(partStatus([]), `${joiner}${words}`, selector), ...(aside === null ? [] : [part(partStatus([]), aside, selector)])]
        })
        instructions.push(joined('How it works', [part(partStatus([...who, ...stops]), `${capital(taker)} restarts play`, [...who, ...stops]), ...moments]))
        if (placementResetsAt(group)) sayPlacement(group)
        instructions.push(joined(RESTARTS, [part(partStatus([...who, ...methods]), `${capital(taker)} restarts play ${METHOD_PHRASE[first.placement.method](objectNoun!)}`, [...who, ...methods, ...objectPath])]))
        const bound = coachDecides(first.placement.region)
        say(RESTARTS, partStatus([...locations, ...who]), `You choose where ${taker} restarts play${bound ? `, ${bound}` : ''}`, [...locations, ...who])
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
        /**
         * **The sport's approved noun for the method, where it has one — stage M4, 17 October 2026 (design step L10).** His reply filed
         * 19 October 2026, item 4, approving our proposed revision of the touchline restart: the noun his 18 October item 2 named
         * replaces the method's sport-neutral phrase. Read from the fixture (`methodNouns`, the sport's coach vocabulary, carried only
         * for a trigger and method the game holds), so no sport word is written here; the method's path is cited as before. DRAFT
         * sentence around his approved word. Every method without a noun is said exactly as before.
         */
        const methodNoun = ((fixture as any).methodNouns?.entries ?? []).find((entry: any) => entry?.trigger === triggerOf(first) && entry?.method === method && typeof entry?.noun === 'string' && typeof entry?.article === 'string')
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
        /**
         * **One bound for both choices is said once — stage M4, 17 October 2026 (design step L11, DRAFT).** His reply filed 19 October
         * 2026, item 3 A: *"Yes. The coach determines both, with the understanding that ordinary restarts should preserve meaningful
         * game relationships rather than create an automatic scoring shortcut."* Where the place and the method are both the coach's
         * and their recorded bound is the same words, the sentence closes on the bare choice and then the bound, once ("restarts play
         * where and how you choose, {bound}"), rather than repeating it in brackets after each. The bound's words are the realization
         * choice's (our gerund form of his, DRAFT, labelled there). Every other combination is said exactly as before.
         */
        const oneBound = !dynamic && !fixedMethod && !!choiceOfPlace && choiceOfPlace === choiceOfMethod
        const restarts = methodNoun && fixedMethod ? `, ${takerOf(first)} restarts play with ${methodNoun.article} ${methodNoun.noun}${dynamic ? ` ${dynamic}` : ''}` : `, ${takerOf(first)} restarts play${dynamic ? ` ${dynamic}` : ''}${fixedMethod ? `, ${fixedMethod}` : ''}`
        instructions.push(
            joined('How it works', [
                part(partStatus(qualifiers), `If the ${objectNoun} goes out over ${where}`, [...group.map(t => pathAt(t, 'selector')), ...qualifiers, ...objectPath]),
                part(partStatus(firm), restarts, firm),
                ...(oneBound
                    ? [part(partStatus(chosen), ` where and how you choose, ${choiceOfPlace}`, chosen)]
                    : choices.length
                      ? [part(partStatus(chosen), bare ? ` ${listed(choices)} you choose` : `; you choose ${listed(choices)}`, chosen)]
                      : []),
            ]),
        )
    }

    // ── How to score ────────────────────────────────────────────────────────────────────────────
    const primary = game.value?.primaryEvent
    if (primary) {
        // Stage A (22 October 2026): the game's primary event read through the one kind reader (game-reading.ts `eventKindOf`).
        const gameEvent = eventKindOf(game, null, participants())
        const kindPath = gameEvent.path
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
        /**
         * **How a score is made, for one team's scoring event — stage A, 22 October 2026 (register version 16).** Until this one `how` was
         * built from the game's primary event and said for every role. Christian, reply filed 25 October 2026, item 2: *"I approve extending
         * the September 15 decision to support one primary scoring event per role in an asymmetric activity"*. So `how` is made per event,
         * read through `eventKindOf`, with the two existing wordings only (`scoringWordingOf`): a kind with neither is withheld, never said
         * with another kind's words. Where every target shares one noun the zone entry cites each target's noun exactly as before; where the
         * targets differ (a role's own event), it names and cites the role's OWN target's noun. Null where the kind has no wording.
         */
        const howOf = (
            kind: unknown,
            kindAt: string,
            ownTarget: any | null,
            ownObjective: any | null = null,
            aloneByOwnEvent = false,
        ): { lead: string; elaboration: string | null; more?: { text: string; from: string[] }[]; paths: string[]; kindAt: string } | null => {
            const wording = scoringWordingOf(kind, participants())
            if (!wording) return null
            /**
             * **Scoring at an object, worded from data — Stage G, 23 October 2026 (DRAFT).** Christian, reply filed 26 October 2026, item 1:
             * *"Pressing team: Scoring in the [specialized-performer]-protected physical [object]."* (his nouns bracketed for the coupling
             * ratchet). Said only for a team whose own objective references an object the game holds, of the kind the DRAFT wording data
             * names for this event (`draft-coach-wording.ts`), and only with an object to play with: the lead fills the entry's slots with the
             * carrier's kind and the target's kind ("by getting the {carrier} into the {target}"), citing both kinds and the objective's role
             * and reference. Then the entry's clauses, each a part citing the event it qualifies: a MEANING clause wherever the lead is said
             * (what the event itself counts, his items 10 and 11 for the normal rule), a NO_OTHER_SCORE clause only where the team scores by
             * an event of its own and nothing also counts for it (`aloneByOwnEvent`: register row B9, whose own gloss says such a role "holds
             * no occurrence that also counts"). Anything else is null: withheld, never said with another kind's words.
             */
            if (wording === 'AT_OBJECT') {
                const target = ownObjective ? objectTargetOf(ownObjective) : null
                const entry = target && carrier && typeof target.kind === 'string' ? scoringAtObjectWording(kind, target.kind) : null
                const lead = entry ? fillSlots(entry.lead, { carrier: String(carrier.kind), target: String(target.kind) }) : null
                if (!entry || !lead || !objectSpec) return null
                const more = entry.clauses
                    .filter(clause => clause.states === 'MEANING' || aloneByOwnEvent)
                    .map(clause => ({ text: fillSlots(clause.text, { carrier: String(carrier.kind) }), from: [kindAt] }))
                if (more.some(clause => clause.text === null)) return null
                return {
                    lead,
                    elaboration: null,
                    more: more as { text: string; from: string[] }[],
                    paths: [`objects[${carrier.elementId}].kind`, `objects[${target.elementId}].${objectSpec.kindLeaf}`, `objectives[${ownObjective.elementId}].role`, `objectives[${ownObjective.elementId}].reference`],
                    kindAt,
                }
            }
            const ownNoun = ownTarget && typeof ownTarget.noun === 'string' && ownTarget.noun !== 'line' ? String(ownTarget.noun) : null
            const noun = targetNoun ?? ownNoun
            const nounPaths = targetNoun ? targetNounPaths : ownNoun ? [`space.regions[${ownTarget.elementId}].noun`] : []
            const zoneEntry = wording === 'ZONE_ENTRY' && carrier && objectives.length > 1 && noun
            /**
             * Hardening H5, 21 October 2026 (DRAFT): the zone a team enters to score is its objective's region, its target, so it is named as
             * "its target {noun}" — his term "target zone" (reply filed 22 October 2026, item 7, as the build plan's expected Details 14 records
             * it), as the Set up sentences name each role's target — not "the {noun} it is attacking". Only the zone-entry wording changes, and
             * only for zone targets: a game that scores across a line keeps "across the line it is attacking". The citations are unchanged
             * (each target's noun).
             */
            // A region noun that already says "target" is not prefixed again ("its target target zone").
            const targetPhrase = noun && noun.toLowerCase().startsWith('target') ? noun : `target ${noun}`
            /**
             * **Stage 3E, 22 October 2026: the zone-entry wording is two clauses, each its own part** (the words unchanged). How a team scores
             * ("by getting the {object} under control into its target {noun}") and, after its colon, the two ways that entry is made (": running
             * it in, or passing to a teammate who receives it under control inside"): the elaboration of the same event, in his D3's terms quoted
             * above. The first part cites everything the sentence cited (the event, its bound or value, the object, each target's noun, the
             * objective); the elaboration cites the event it elaborates. So a cut before the elaboration keeps exactly what the words it keeps
             * say, and the sentence's text, status and citations are as before. Every other wording is one clause, said as before.
             */
            const how: { lead: string; elaboration: string | null } = zoneEntry
                ? { lead: `by getting the ${carrier.kind} under control into its ${targetPhrase}`, elaboration: ': running it in, or passing to a teammate who receives it under control inside' }
                : {
                      // "the marked line" is only unambiguous while there is one; with a target per team the objective each team
                      // attacks is named relationally.
                      lead: carrier
                          ? objectives.length > 1
                              ? `by getting the ${carrier.kind} across the line it is attacking`
                              : `by getting the ${carrier.kind} across the marked line`
                          : objectives.length > 1
                            ? 'when the line it is attacking is crossed'
                            : 'when the marked line is crossed',
                      elaboration: null,
                  }
            const paths = [...(carrier ? [`objects[${carrier.elementId}].kind`] : []), ...(zoneEntry ? nounPaths : []), ...(objective ? [`objectives[${objective.elementId}].role`] : [])]
            return { ...how, paths, kindAt }
        }
        /** The game's own `how` (the event every role without one of its own scores by), as before. */
        const how = howOf(gameEvent.kind, kindPath, null)
        const howPaths = how?.paths ?? []
        /** A role's own target region in this block: the region the objective attacked by the team holding it references (stage A). */
        const ownTargetOf = (role: string): any | null => {
            const own = objectives.find(o => roleOfDesignation(o?.team) === role)
            return own ? regions.find((r: any) => referencedBy(r) === own) ?? null : null
        }
        /** A kind with no wording: its path is withheld (stage A), so the activity is refused at communication rather than said wrongly. */
        const withholdKind = (at: string) => {
            if (!withheld.some(field => field.path === at)) withheld.push({ path: at, row: rowOfKindPath(at), reason: 'AWAITING_APPROVED_WORDING' })
        }
        /** A role's own objective in this block: the one attacked by the team holding it (Stage G, for a target that is an object). */
        const ownObjectiveOf = (role: string): any | null => objectives.find(o => roleOfDesignation(o?.team) === role) ?? null
        /**
         * Whether an occurrence that also counts as the primary event names this role's team (row V27's team, V28), read from the game: where
         * none does, a team scoring by an event of its own scores by nothing else (Stage G, the NO_OTHER_SCORE clause).
         */
        const alsoCountsFor = (role: string): boolean => ((game.value?.primaryEvent?.alsoCounts ?? []) as any[]).some(element => roleOfDesignation(element?.team) === role)
        /**
         * A scoring sentence: one part, or (stage 3E) its lead and the elaboration of the event, each a part, at the sentence's status; and
         * (Stage G) the clauses the DRAFT wording data writes after a lead for scoring at an object, each a part citing the event.
         */
        const sayScoring = (said: NonNullable<ReturnType<typeof howOf>>, status: SourceStatus, core: string, from: string[], bindings: Binding[] = []) => {
            const after = [...(said.elaboration === null ? [] : [part(status, said.elaboration, [said.kindAt])]), ...(said.more ?? []).map(clause => part(status, clause.text, clause.from))]
            instructions.push(after.length ? joined('How to score', [part(status, phrase(status, core), from, bindings), ...after]) : instruction('How to score', status, core, from, bindings))
        }
        /**
         * **Where a role's scoring credit is confined to an episode, no sentence speaks for every team** — stage M3, 17 October 2026
         * (design step L9). Christian, reply filed 19 October 2026, item 1: *"The important distinction is that the building team's
         * scoring opportunity applies only during an active build-out episode."* and *"Please ensure the underlying scoring eligibility
         * reflects this distinction, rather than relying solely on the coach-facing wording."*; item 4: *"please ensure the surrounding
         * scoring instructions make clear that continuing to attack does not automatically restore the building team's eligibility to
         * score."* The team-neutral "A team scores …" says that every team scores the same way at any time, which is false for a role
         * whose credit is bounded (row B8 not the whole game). So, where any role element carries such a bound:
         *
         *   - "A team scores …" is not said;
         *   - "Each score is worth N point" is said, citing the value only (it says how much, never how or when);
         *   - each role whose bound is the whole game (stated, never assumed from silence) is told how it scores in a sentence of its
         *     own, "{Role noun}: Score {how}", citing the event, its own bound and what `how` cites (DRAFT);
         *   - a bounded role is told only in his approved words (its bound is said only by an approved entry: WORDED_ONLY above), and
         *     fidelity Q2 refuses any other scoring sentence that speaks for it.
         *
         * Role nouns and the element's role are data; every game whose roles carry no bound reads exactly as before.
         */
        const roleElements: any[] = Array.isArray(game.activityRoles) ? game.activityRoles : []
        const boundedCredit = roleElements.some(element => present(element?.creditedWithin) && canonicalJson(element.creditedWithin) !== canonicalJson(UNBOUNDED_CREDIT))
        /** Each role's event (its own, or the game's) and how it is said; null `said` where the kind has no wording (stage A). */
        const roleScoringOf = (element: any) => {
            const role = typeof element?.activityRole === 'string' ? element.activityRole : null
            const event = role ? eventKindOf(game, role, participants()) : gameEvent
            return { event, said: howOf(event.kind, event.path, role ? ownTargetOf(role) : null, role ? ownObjectiveOf(role) : null, !!role && event.byRole && !alsoCountsFor(role)) }
        }
        /**
         * Stage A (22 October 2026): whether some role scores by an event of its own (row B9). Where none does, and no credit is bounded,
         * the one team-neutral sentence is said exactly as before; where one does, no sentence may speak for every team, so each role is
         * told how it scores in a sentence of its own ("{Role noun}: Score {how}", DRAFT, the bounded branch's form) and then the value.
         */
        const ownEvents = roleElements.some(element => roleScoringOf(element).event.byRole)
        if (boundedCredit) {
            for (const element of roleElements) {
                if (canonicalJson(element?.creditedWithin) !== canonicalJson(UNBOUNDED_CREDIT)) continue
                const noun = typeof element?.activityRole === 'string' ? roleNounOf[element.activityRole] : undefined
                if (!noun) continue
                const creditPath = `activityRoles[${element.elementId}].creditedWithin`
                const { event, said } = roleScoringOf(element)
                if (!said) {
                    withholdKind(event.path)
                    continue
                }
                sayScoring(said, statusAt([event.path, creditPath], 'DERIVED'), `${capital(noun)}: Score ${said.lead}`, [event.path, creditPath, ...said.paths])
            }
            say('How to score', statusOf.get('value.primaryEvent.value') ?? statusOf.get(kindPath) ?? 'DERIVED', `Each score is worth ${primary.value} point`, ['value.primaryEvent.value'], [{ quantity: primary.value, path: 'value.primaryEvent.value' }])
        } else if (ownEvents) {
            for (const element of roleElements) {
                const noun = typeof element?.activityRole === 'string' ? roleNounOf[element.activityRole] : undefined
                if (!noun) continue
                const { event, said } = roleScoringOf(element)
                if (!said) {
                    withholdKind(event.path)
                    continue
                }
                sayScoring(said, statusAt([event.path], 'DERIVED'), `${capital(noun)}: Score ${said.lead}`, [event.path, ...said.paths])
            }
            say('How to score', statusOf.get('value.primaryEvent.value') ?? statusOf.get(kindPath) ?? 'DERIVED', `Each score is worth ${primary.value} point`, ['value.primaryEvent.value'], [{ quantity: primary.value, path: 'value.primaryEvent.value' }])
        } else if (!how) withholdKind(kindPath)
        else sayScoring(how, statusOf.get(kindPath) ?? 'DERIVED', `A team scores ${primary.value} point ${how.lead}`, [kindPath, 'value.primaryEvent.value', ...howPaths], [{ quantity: primary.value, path: 'value.primaryEvent.value' }])
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
            /**
             * Stage 2D (DRAFT): with the markings set out once, "Each team attacks the {noun} at the other team's end" would be ambiguous
             * (the far end zone also touches the other team's end), so it is not said: each target sentence above says which marked zone
             * each role attacks, citing its objective's team, reference and role. "The ends stay the same" is the exchange sentence's. What
             * is left is the coach's setup: which team takes which end of the area, citing each objective's team (the end it is bound to)
             * and the length whose ends they are, so it is read in Set up.
             */
            // Stage G (23 October 2026): also where the targets are of different kinds, each one the game holds (`differentTargets`): the
            // sentence names no target, and each role's target sentence above says what it attacks.
            if (layout && (targetNoun || differentTargets)) {
                const teamPaths = objectives.map(o => `objectives[${o.elementId}].team`)
                say('Set up', statusAt(teamPaths, 'DERIVED'), 'Decide which team starts at which end', [...teamPaths, 'envelope.area.length_m'])
            } else {
                /**
                 * Stage D, 23 October 2026 (DRAFT): where the teams change ends at the coach-called block (row B10), "the ends stay the same for
                 * the whole game" is false, so it is not said; the exchange sentence says the teams change ends. Every other game says exactly
                 * what it did.
                 */
                const stay = endsChange ? '' : '; the ends stay the same for the whole game'
                if (targetNoun) say('How to score', statusAt(provenance, 'DERIVED'), `Each team attacks the ${targetNoun} at the other team's end. Decide which team starts at which end${stay}`, [...provenance, ...targetNounPaths])
                // The integration review fix (above): "defends one line" only where every target is a line.
                else if (lineTargets) say('How to score', statusAt(provenance, 'DERIVED'), `Each team defends one line and attacks the other. Decide which team starts at which end${stay}`, provenance)
                else withholdTargetNouns('"Each team defends one line and attacks the other. Decide which team starts at which end"')
            }
            // Said with the possession-change sentence where there is one; on its own otherwise.
            if (!continuingOnPossessionChange.length) {
                if (targetWord) instructions.push(joined('How to score', [sameLine('When possession changes, ', targetWord)]))
                else withholdTargetNouns('"When possession changes, the team that wins possession attacks the same line it was already attacking"')
            }
        } else if (objective) {
            // The integration review fix (above): a single objective's target is called a line only where it is one.
            if (lineTargets) {
                say(
                    'How to score',
                    statusAt([`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`], 'DERIVED'),
                    shared ? `Both teams attack the same line — the one you marked at the end of the area` : `Each team attacks its own line`,
                    [`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`],
                )
            } else withholdTargetNouns(shared ? '"Both teams attack the same line — the one you marked at the end of the area"' : '"Each team attacks its own line"')
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
    const saidInApprovedWords = new Set<Instruction>()
    sayInApprovedWords(game, wording, said => (instructions.push(said), saidInApprovedWords.add(said)), withheld)
    // How to score is put in role order after placement (stage 2A, `placeInstructions`), over the sentences assigned there.

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
            /**
             * **With the markings set out once, the exchange states what changes, not re-marking — stage 2D, 21 October 2026 (DRAFT).** His
             * reply filed 22 October 2026, item 7: *"Role exchanges should not require unnecessary physical re-marking."* The same citations
             * (so fidelity Q6 reads the same half of his D2 distinction: what changes with the roles), with the layout's policy, and the words
             * say that each team now attacks the target of its new role and that nothing is re-marked. Where an authorized adjustment moves a
             * mark set out once (`layout.movedBy`), that is not true once the coach has used it, so the sentence says so where it is made
             * (`MOVED_MARK_QUALIFICATIONS`, read by fidelity Q5-L too), citing it: his item 6 asks that no shortened statement silently turn a
             * qualified rule into an unrestricted one. Without a layout the sentence is exactly what it was.
             */
            const movedLines = new Set((layout?.movedBy ?? []).map(move => move.line))
            const unless = !layout?.movedBy.length ? '' : movedLines.size === 1 && markedLines.has([...movedLines][0]) ? MOVED_MARK_QUALIFICATIONS.the : MOVED_MARK_QUALIFICATIONS.a
            /**
             * **Where the markings move at the exchange, the exchange says what the coach moves and where it goes — stage 2G, 21 October 2026
             * (DRAFT wording).** His reply filed 23 October 2026, item 2: *"If markings change location between blocks, the instructions should
             * identify what needs to be adjusted."* Read from what moves (`remarking`, computed in `physical-layout.ts` from every block's
             * realized edges and attached to every block): for each marking whose position differs between the blocks, this block's own
             * reading of what it is, said by role so both blocks say it in the same words (the composition then says it once, each block
             * citing its own region, stage 2C):
             *
             *   - a line measured from a team's end (`fromTeamEnd`): "the marked line to the same distance from the new {team}'s end line";
             *   - otherwise the inner edge of a team's target zone at an end (as `targetZone` reads it): "the {attacker}'s target {noun} to the
             *     new {defender}'s end".
             *
             * Each is a part of its own, citing the move (`remarking.changes[...]`) and every region edge that is it in this block, of the
             * status its Set up sentence has. A marking with no such reading (no line from a team's end and no target zone, a mark one block
             * does not have, or a mark that must stay because a marking that does not move shares its place) is not said, so fidelity Q5-L
             * refuses the activity rather than this renderer leaving the coach to work out what moves. No number is said: the distance is
             * the Set up sentence's, and "the same distance" stays true where the coach has moved the line (Adjusting the activity).
             *
             * **Stage C, 23 October 2026: only what actually moves.** The account of what moves is now carried wherever the blocks were read
             * and the markings are not set out once, EMPTY where nothing moves; then this sentence names nothing moved and says nothing is
             * set out again (until this stage the block-by-block sentence below said the markings written for the roles "are set out again"
             * wherever no account was carried, whether or not anything moved). An object that moves (`remarking.objects`) has no words here
             * yet (Stage G), so it is not said and fidelity Q5-L refuses the activity rather than leave the coach to find it moved.
             */
            const blockId = String(fixture.record?.roleBlock?.blockId ?? '')
            const movedMarking = (change: MarkingChange): { text: string; status: SourceStatus; from: string[] } | null => {
                const place = change.places.find(entry => entry.blockId === blockId)
                if (!place || place.at === null || place.shared || !place.features.length) return null
                const cited = [`remarking.changes[${change.elementId}]`, ...place.features.map(feature => feature.path)]
                const regionOf = (id: string) => regions.find((region: any) => String(region.elementId) === id)
                const lineFeature = place.features.find(feature => feature.edge === 'at' && markedLines.has(feature.regionId))
                if (lineFeature) {
                    const line = regionOf(lineFeature.regionId)
                    const positioned = line ? fromTeamEnd(line) : null
                    if (!positioned) return null
                    const nounPath = `space.regions[${lineFeature.regionId}].noun`
                    return { text: `the marked ${line.noun} to the same distance from the new ${positioned.team}'s end line`, status: statusOf.get(nounPath) ?? 'DERIVED', from: [...cited, nounPath] }
                }
                if (place.features.some(feature => feature.edge === 'at')) return null
                for (const feature of place.features.filter(entry => entry.inner)) {
                    const zone = regionOf(feature.regionId)
                    const objective = zone ? referencedBy(zone) : null
                    const attacker = objective ? teamNoun(objective.team) : null
                    const defender = objective ? otherTeamNoun(objective.team) : null
                    const along = zone ? geometryFor(zone.elementId, 'along') : null
                    const wide = zone ? geometryFor(zone.elementId, 'across')?.geometry?.interval : null
                    if (!zone || typeof zone.noun !== 'string' || zone.noun === 'line' || !objective || !attacker || !defender || along?.geometry?.term !== ATTACKING_END || !wide || wide.from !== 0 || wide.to !== areaWidth) continue
                    const nounPath = `space.regions[${feature.regionId}].noun`
                    return {
                        text: `the ${attacker}'s target ${zone.noun} to the new ${defender}'s end`,
                        status: statusOf.get(nounPath) ?? 'DERIVED',
                        from: [...cited, nounPath, `objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`],
                    }
                }
                return null
            }
            /**
             * **Where the teams change ends with the roles, the exchange says so — stage D, 23 October 2026 (DRAFT wording).** His reply filed
             * 25 October 2026, item 5: *"The outfield groups exchange ends and building/pressing responsibilities when the coach calls for the
             * next block."* and *"The coach should not have to move the goal or reconstruct the playing area to exchange roles."* Read from the
             * game's own end assignment (register row B10, the endAssignment block; never a value written here): where it is the exchange, the
             * sentence opens by saying the teams change ends and exchange roles and that each role is played from the same end in every block
             * (the role-to-end holders are the same in both blocks, RB-2), and never that a team keeps its end (fidelity Q6 refuses that there).
             * Its continuations say the same things the kept-ends sentence says, joined with "so" (the positions written for a role are at the
             * same place in both blocks, RB-8). Wherever the game states its end assignment, either value, the sentence cites it, so it is
             * carried; a game that states none (every game before stage D) says and cites exactly what it did.
             */
            const lead = endsChange
                ? 'When you call the next block the teams change ends and exchange roles: each role is played from the same end in every block'
                : 'Each team keeps its end for the whole activity. When you call the next block the teams exchange roles, not ends'
            const joinMeaning = endsChange ? ', so ' : ': '
            if (remarking) {
                const exchangeStatus = statusAt([...exchangePaths, ...endPaths, ...assignmentPaths], 'DERIVED')
                const moved = remarking.changes.map(movedMarking).filter((said): said is NonNullable<typeof said> => !!said)
                /**
                 * Stage C review fix, 23 October 2026 (DRAFT, the layout sentence's own words): where nothing moves and positions are written
                 * for a role, the sentence still says what those markings mean, the half of his D2 the citations alone carried: each team now
                 * attacks the target of its new role. Only where the targets' noun is read (a line target's sentence is unchanged), and
                 * without "nothing is re-marked": no layout records what an authorized adjustment would move here (`layout.movedBy`), so that
                 * claim could not carry the qualification hardening H2 requires.
                 */
                const meaning = !somethingMoves(remarking) && keyedPaths.length && targetNoun ? `${joinMeaning}each team now attacks the target ${targetNoun} of its new role` : ''
                instructions.push(
                    joined(ROLE_EXCHANGE, [
                        part(exchangeStatus, `${lead}${meaning}`, [
                            ...exchangePaths,
                            ...endPaths,
                            ...assignmentPaths,
                            ...keyedPaths,
                            ...(keyedPaths.length ? targetNounPaths : []),
                        ]),
                        ...moved.map((said, i) => part(said.status, `${i === 0 ? `, and ${MOVE_MARKINGS}` : i === moved.length - 1 ? ' and ' : ', '}${said.text}`, said.from)),
                        part(exchangeStatus, '; there is no set block length', exchangePaths),
                    ]),
                )
            }
            // Without a layout or an account of what moves (stage C: what moves could not be read from the blocks), the markings written for
            // the roles are said to be set out again for the new roles, as since stage K7.
            // Stage D (DRAFT): where the teams change ends, the positions written for a role stay where they are (RB-8 holds them to the same
            // place in both blocks), so the block-by-block words say that, never "set out again".
            const verb = named.length > 1 || keyedTargets === 2 ? 'are' : 'is'
            /**
             * The integration review fix, 23 October 2026 (above): with the markings set out once, the meaning is said only with a noun every
             * target takes ("line" only where every target is a line). Where none does, the lead is said alone with its own citations (it is
             * the sentence a game without role-keyed positions says), the markings' meaning and "nothing is re-marked" are not said, and the
             * targets are withheld, so fidelity (Q6 and Q5-L, which read the positions written for a role and the layout from what this
             * sentence would cite) and the withheld field refuse the activity rather than it telling either team it attacks a target line.
             */
            /**
             * **Stage G, 23 October 2026 (DRAFT): targets of different kinds, and an object set out once, at the exchange.** Christian, reply filed
             * 26 October 2026, item 5: *"It remains physically stationary when the teams exchange ends."*; his reply filed 25 October 2026, item 5:
             * *"The coach should not have to move the [object] or reconstruct the playing area to exchange roles."* (his noun bracketed for the
             * coupling ratchet). Where the targets are of different kinds, each one the game holds (`differentTargets`), the meaning is said with
             * "target" and no noun ("each team now attacks the target of its new role"), citing what each objective references; and each object
             * the layout sets out once is said to stay where it is ("the {kind} stays where it is"), citing its layout entry and its kind, before
             * "nothing is re-marked". An object the layout holds that cannot be named leaves the meaning unsaid, as a target no noun names does.
             * Every game with no object set out once and targets of one noun says exactly what it did.
             */
            const staying = (layout?.objects ?? []).map(entry => {
                const object = objectById(entry.objectId)
                return object && typeof object.kind === 'string' && objectSpec ? { text: `, the ${object.kind} stays where it is`, from: [`layout.objects[${entry.elementId}]`, `objects[${object.elementId}].${objectSpec.kindLeaf}`] } : null
            })
            const layoutUnsaid = !!layout && (!targetWord || staying.some(entry => entry === null))
            if (layoutUnsaid) withholdTargetNouns(`The exchange's "each team now attacks the target line of its new role, and ${NOTHING_RE_MARKED}"`)
            const stays = staying.filter((entry): entry is { text: string; from: string[] } => entry !== null)
            const markings = layout
                ? layoutUnsaid
                    ? ''
                    : `${joinMeaning}each team now attacks the target${sayableNoun ? ` ${sayableNoun}` : ''} of its new role${stays.map(entry => entry.text).join('')}, and ${NOTHING_RE_MARKED}${unless}`
                : !keyedPaths.length
                  ? ''
                  : endsChange
                    ? `, so ${named.length ? `${named.join(' and ')} ${verb}` : 'the markings that go with them are'} at the same place in every block`
                    : named.length
                      ? `, and ${named.join(' and ')} ${verb} set out again for the new roles`
                      : ', and the markings that go with them are set out again for the new roles'
            if (!remarking) say(
                ROLE_EXCHANGE,
                statusAt([...exchangePaths, ...endPaths, ...assignmentPaths], 'DERIVED'),
                `${lead}${markings}; there is no set block length`,
                layoutUnsaid
                    ? [...exchangePaths, ...endPaths, ...assignmentPaths]
                    : [
                          ...exchangePaths,
                          ...endPaths,
                          ...assignmentPaths,
                          ...keyedPaths,
                          ...(keyedPaths.length || layout ? targetWordPaths : []),
                          ...(layout ? ['layout.policy', ...layout.movedBy.map(move => `layout.movedBy[${move.elementId}]`)] : []),
                          ...stays.flatMap(entry => entry.from),
                      ],
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
            const text = `When you call the next block, ${said.length > 1 ? `${said.slice(0, -1).join(', ')} and ${said[said.length - 1]}` : said[0]} ${total === 1 ? 'moves' : 'move'} to the team that becomes the ${roleNouns[role!]}`
            const bindings = counted.map(({ element, count }) => ({ quantity: count, path: `reassignments[${element.elementId}].count` }))
            /**
             * **A performer who changes team without moving — Stage G, 23 October 2026 (DRAFT wording).** Christian, reply filed 25 October 2026,
             * item 5: *"The [specialized performer] remains at the [object], supporting the team currently building out and defending the
             * [object] when possession is lost."*; his reply filed 26 October 2026, item 6: *"'[Specialized performer] remains at the [object]'
             * should mean remaining associated with that end and [object], not being confined to a particular position."* (his nouns bracketed
             * for the coupling ratchet). Where the teams change ends at the exchange (row B10), the role this reassignment joins is played from
             * the same end in every block, so a performer of the row an object set out once is defended by (row O7), standing on that role's
             * own end line, joins the team that comes to that end without going anywhere: the sentence says so, as a part of its own after the
             * counts ("{performer} staying with the {kind}"), citing the reassignment's fields, the object's defending row, its kind, its layout
             * entry and the end assignment. Nothing confines the performer to a place: "staying with" is his "remaining associated with". The
             * counts and their words are untouched (the field diagram reads them), and every other reassignment is said exactly as before.
             */
            const stayers = endsChange && layout && defendedByLeaf && objectSpec
                ? counted.flatMap(({ element, count }) => {
                      const entry = (layout.objects ?? []).find(placed => {
                          const object = objectById(placed.objectId)
                          const along: any = object ? fieldOf(object, objectSpec.alongLeaf) : undefined
                          return !!object && String(object[defendedByLeaf]) === String(element.performerRow) && along?.term === OWN_END && roleOfDesignation(along?.forTeam) === role
                      })
                      const object = entry ? objectById(entry.objectId) : null
                      return entry && object && typeof object.kind === 'string' ? [{ element, count, entry, object }] : []
                  })
                : []
            if (!stayers.length) {
                say(ROLE_EXCHANGE, statusAt(paths, 'DERIVED'), text, paths, bindings)
                continue
            }
            const stayPaths = stayers.flatMap(({ element, entry, object }) => [
                `reassignments[${element.elementId}].performerRow`,
                `objects[${object.elementId}].${defendedByLeaf}`,
                `objects[${object.elementId}].${objectSpec!.kindLeaf}`,
                `layout.objects[${entry.elementId}]`,
            ])
            const who = stayers.map(({ element, count, object }) => `${counted.length > 1 ? `the ${count === 1 ? performerNouns[element.performerRow].singular : performerNouns[element.performerRow].plural} ` : ''}staying with the ${object.kind}`)
            instructions.push(
                joined(ROLE_EXCHANGE, [
                    part(statusAt(paths, 'DERIVED'), phrase(statusAt(paths, 'DERIVED'), text), paths, bindings),
                    part(statusAt([...stayPaths, ...assignmentPaths], 'DERIVED'), `, ${who.join(' and ')}`, [...stayPaths, ...assignmentPaths]),
                ]),
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
        const choiceText = `You may choose to ${own.charAt(0).toLowerCase()}${own.slice(1)}${consequence ? `: ${consequence.charAt(0).toLowerCase()}${consequence.slice(1)}` : ''}`
        const choicePaths = [`adjustments[${adjustment.id}].words`, ...(coachWords ? [`adjustments[${adjustment.id}].coachWords`] : []), ...(consequence ? [`adjustments[${adjustment.id}].consequence`] : [])]
        /**
         * **An adjustment that moves a mark set out once says what that means at the exchange — stage 2D, the general consequence rule
         * (DRAFT wording).** A line placed at a distance from the end a role's team defends, moved by an adjustment of that role's position
         * (`layout.movedBy`, read in `physical-layout.ts` from the adjustment's parameter and role), no longer sits at the same place in both
         * blocks: so its sentence adds, from the line's own position (its team, read from the game and cited), that it is measured from that
         * team's end line and is set out again for the new team holding the role. A part of its own, of the line's status; the choice stays
         * the coach's. Every other adjustment, and every adjustment without a layout, is said exactly as before.
         */
        const move = layout?.movedBy.find(entry => entry.elementId === adjustment.id)
        const movedLine = move ? regions.find((region: any) => String(region.elementId) === move.line) : null
        const measured = movedLine ? fromTeamEnd(movedLine) : null
        const movedAlong = movedLine ? geometryFor(movedLine.elementId, 'along')?.path : null
        if (move && measured && movedAlong) {
            instructions.push(
                joined(ADJUSTING, [
                    part('COACH_CHOICE', phrase('COACH_CHOICE', choiceText), choicePaths),
                    part(
                        statusAt([movedAlong], 'DERIVED'),
                        `; it is measured from the ${measured.team}'s end line, so when the roles exchange, set it out again at the same distance from the new ${measured.team}'s end line`,
                        [movedAlong, `layout.movedBy[${move.elementId}]`],
                    ),
                ]),
            )
            continue
        }
        say(ADJUSTING, 'COACH_CHOICE', choiceText, choicePaths)
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
     * The tier is the section's own reading, and what a coach may adjust is read after the starting setup. Since
     * stage 2A both are set by `placeInstructions`, with the section itself, as the renderer returns. Organisation
     * only — no instruction is added, dropped or reworded by this.
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

    // Placed, tiered and ordered by `placeInstructions` (stage 2A): the section, `when` and `tier` are set there and nowhere else.
    return { instructions, observations, withheld, approved: saidInApprovedWords }
}
