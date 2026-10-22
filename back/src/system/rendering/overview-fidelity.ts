/**
 * **The Coach Overview's agreement check (Q7), and serving the overview** — stage 3D, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 2: *"Please ensure that the completeness check verifies that all necessary information remains
 * accessible and that abbreviated statements do not misrepresent the full rules."* Item 4: *"Shortening must not introduce new meanings,
 * omit a condition that changes the essential understanding, or silently turn a qualified rule into an unrestricted one."* Item 6: *"the
 * overview should not reproduce every qualification, exception, and restart condition. Those belong in Coach Details, with any essential
 * qualification included in the overview when omitting it would materially misrepresent the game."* Item 1: *"Both levels must derive
 * from the same authorized activity representation, with no contradictions or invented instructions."*
 *
 * The overview (`coach-overview.ts`) is composed per game the activity was built from (each role block, or the one game). Q7 holds it to
 * that game's own Details render, block by block, and never takes the composer's word for what a sentence states: it reads every sentence
 * itself. Fidelity Q1-Q6 on Details are untouched; Q7 applies only to the overview. On any VIOLATION the OVERVIEW is withheld and the
 * activity is served exactly as without it, the findings going to the administrator's evidence; nothing here refuses an activity.
 *
 *   - **Q7.0 completeness** (an addition to design D3's list, withholding only): every part his item 1 lists is there for every block — a
 *     learning purpose for a Learning Goal (none for a mechanism demonstration, which claims no goal), the game sentence, the parameters,
 *     and a group for every team; no gap; the essentials table usable.
 *   - **Q7.1 citations**: every path an overview sentence cites is cited by a Details sentence of that block; the purpose is the Learning
 *     Goal's Coach Definition byte for byte, cited to it and to nothing else. Since stage 3E (the 3D review's should-fix 1), in each role
 *     clause of the game sentence the objective and the target region it cites are that clause's team's (`roleClauses`): a swapped pair is
 *     refused.
 *   - **Q7.2 numbers**: every number said is bound, in the order said, and every binding is a binding a Details sentence of that block makes
 *     (same path, same number); every derived term is declared, holds by its rule (`DERIVED_TERM_RULES`), and binds its values as Details do.
 *     Since stage 3E (should-fix 4), a scoring sentence that is a Details sentence said whole binds exactly that sentence's own bindings,
 *     and a cut exactly those of the parts it keeps whole.
 *   - **Q7.3 statuses**: APPROVED is his approved wording said whole with exactly its citations in that block's Details; DERIVED_FROM_APPROVED
 *     is an extract generated for that block that passes `extractUnusableBecause` again here (against the game and the recorded reading),
 *     whose source entry Details say whole, citing exactly what the extract cites; a DRAFT sentence names no approved source; the game and
 *     parameters are DRAFT. Since stage 3E the recorded reading is the PROPOSED record (`approved-wording-readings.ts`) unless a test hands
 *     another, and a sentence names a reading (its administrator's label) exactly where it is an extract kept by one, that extract's.
 *   - **Q7.4 per team group** (his "silently"): what each sentence states is read here — a Details sentence said whole states what it
 *     cites; a verified extract states the covers its recorded reading keeps; a DRAFT cut of a DRAFT Details sentence states only what the
 *     parts it keeps WHOLE cite; anything else states nothing (a rewording's meaning cannot be checked). Every CONSTITUTIVE and ESSENTIAL
 *     field the essentials table requires of the group (`scoringRequirementsOf`, the reading the composer is given too) is stated by one of
 *     its sentences, a pointer never excusing it; every DETAIL is stated or pointed to by a "full rule" pointer that resolves to a Details
 *     sentence of that block citing it; every pointer resolves, in that block and to exactly one served Details sentence, by section and text.
 *   - **Q7.5 ways to score**: every team has its group, none withheld; every way to score a group speaks of is shown by a stated CONSTITUTIVE
 *     field under it (the table's way-level rule).
 *   - **Q7.6 counts**: the game sentence says each team's counts exactly as the Players sentence's builder does (`teamCountPhrases`), under the
 *     role holding them, and binds no other count.
 *   - **Q7.7 wording**: the obligation and ordering lexicons and the specialized-role rule of fidelity Q4, held to every sentence that is not
 *     his words (his approved wording said whole passed them in Details; a verified extract is his words verbatim, held to the role rule only);
 *     the Coach Communication Standard's checker is a NOTE. The extract's exemption from the general lexicons is a disclosed departure from
 *     design D3 (which held them to every non-approved sentence), acknowledged in stage 3E's validation changes; since 3E an extract is
 *     served in production (his first sentence of the building rule, the leading clause of the regain sentence), and neither holds a word of
 *     the lexicons.
 *   - **Q7.8 blocks**: the overview says the same words in every block (no sentence is told apart by block), or it is withheld.
 *
 * **Stage 3F, 22 October 2026: completeness by meaning, and the opposing objectives first.** His reply filed 23 October 2026, item 4: *"An
 * abbreviation should be accepted only when the overview as a whole preserves the material meaning of the full rule, including relevant
 * initial conditions, scoring eligibility, and exceptions. [...] The system should evaluate the meaning of the complete overview rather than
 * simply confirm that related words or conditions appear somewhere."* Item 6: *"a concise explanation that communicates the opposing
 * objectives immediately, without requiring the coach to read several procedural statements first."* So, in addition:
 *
 *   - **Q7.4 by meaning**: his approved wording said whole states only what its recorded reading of all its sentences gives it
 *     (`derived-wording.ts` `wholeReadingsFor`, re-read here from the game and the reading), nothing without one, never every field it
 *     cites; it names that reading's record exactly (Q7.3). A verified extract states what its reading keeps and a DRAFT sentence what the
 *     words of the parts it keeps whole cite, as before. Per team, the group as a whole must state every CONSTITUTIVE and ESSENTIAL field
 *     (its ways to score, the initial condition, the scoring eligibility, ...) and every exception that is material: a DETAIL whose rule
 *     follows from conditions (`followsFrom`) is excused by a pointer only where the group states every field those rules class under the
 *     same way to score. His example is pinned: his first building sentence with his eligibility sentence, and no statement of the
 *     build-out origin, is refused.
 *   - **Q7.4 roles** (the 3E review's should-fix 2): no sentence of a team's group states a field another role owns
 *     (`ScoringRequirements.owners`).
 *   - **Q7.5 lead**: each group opens with exactly one line (`place: 'LEAD'`) stating a field of the team's first way to score; every other
 *     sentence is a qualification. A lead of more than one sentence is a NOTE. (Until polish pass P1 the coach was served every team's
 *     lead before any qualification; since P1, each team's group with its lead first.)
 *   - **Evidence**: for each team, each material element of its full rule (the fields one rule classes on one element), the sentence(s)
 *     stating it, the pointer where it is left to Coach Details, each sentence citing it whose words are not read as stating it (with the
 *     reading's reason), and why it is or is not material (`MeaningElement`, in `read` and the administrator's evidence).
 *
 * **Polish pass P1, 22 October 2026: each team's group, under its own heading.** The 3F and Stage 4 reviews: with every team's line first, a
 * qualification was read away from its team ("The progression must begin...", "that zone"), and a qualification naming no team would have
 * read as the other team's. The coach is now served one group per team (`OverviewGroup`), in the game sentence's team order, under its
 * DRAFT heading (`teamHeadingOf`): that team's line first, then its own qualifications in served order; a pointer that is one team's stays
 * with that team, and one every team's group has is shown once after the groups. So, in addition:
 *
 *   - **Q7.4 membership**: every sentence of a team's group states a field that team's group must account for (and, as before, none another
 *     role owns): a sentence stating nothing of its team is not shown under it.
 *   - **Q7.5 served groups**: the group's noun is the one the game reads for that role; the game sentence names the teams in the groups'
 *     order; and what the coach is served (`coachOverviewOf`, read back here) holds each line under its own team's heading, in its group's
 *     order, with its own pointer; each team's pointers under it; and a pointer after the groups only where every team's group has it.
 *
 * Word counts and reading seconds are measured for the administrator as EVIDENCE and never read by the check (his acceptance criteria: *"The
 * reading and explanation times are usability targets, not hard validation gates."*). The coach is served the overview's words and its
 * "full rule" pointers only; statuses, sources, citations and bindings stay in the administrator's draft and evidence.
 *
 * Everything is read from the draft, the games, their Details and the essentials table; no goal, entry, value or sport term is written here.
 */
import { findCommunicationStandardViolations } from '../activity/coach-communication-standard'
import { sessionPlanningModel } from '../session-planning/session-planning-model'
import { ApprovedWording, approvedWording, canonicalJson } from './approved-wording'
import { coverReadingOf, ReadingsAccount, ReadingsLoad, recordedReading } from './approved-wording-readings'
import {
    bindingsOfInstruction,
    CoachOverviewDraft,
    coachOverviewDraftOf,
    DERIVED_TERM_RULES,
    DetailsPointer,
    DetailsSentence,
    draftShorteningsOf,
    elementPathOf,
    EssentialsLoad,
    essentialsTable,
    failedOverviewDraft,
    followsFromOf,
    FULL_RULE_LABEL,
    OverviewClass,
    OverviewSentence,
    PURPOSE_SOURCE,
    ScoringGroup,
    ScoringRequirement,
    ScoringRequirements,
    scoringRequirementsOf,
    ScoringSentence,
    teamHeadingOf,
    withFullStop,
    wordsIn,
} from './coach-overview'
import {
    CoverReading,
    DerivedExtract,
    extractUnusableBecause,
    ReadingRecord,
    sentencesOf,
    wholeReadingOfSentence,
    wholeReadingsFor,
    WithheldExtract,
    WordingSource,
    WordingStatus,
} from './derived-wording'
import { namesRole, numbersIn, OBLIGATION_ALLOWLIST, OBLIGATIONS, ROLE_ORDERING, stringsAt } from './fidelity'
import { Binding, gameReadingOf, Instruction, teamCountPhrases } from './render-concrete-game'

/** Which Q7 question a finding answers (7.0 is this stage's completeness addition). */
export type OverviewQuestion = '7.0' | '7.1' | '7.2' | '7.3' | '7.4' | '7.5' | '7.6' | '7.7' | '7.8'

/** One thing the agreement check found: a VIOLATION withholds the overview (never the activity); a NOTE is for the administrator. */
export interface OverviewFinding {
    question: OverviewQuestion
    severity: 'VIOLATION' | 'NOTE'
    blockId: string | null
    what: string
}

/** How Q7 itself read one scoring sentence: what its words are (a Details sentence whole, a verified extract, a cut) and what they state. */
export interface SentenceReading {
    text: string
    form: 'WHOLE' | 'EXTRACT' | 'SHORTENING' | 'UNVERIFIED'
    states: string[]
}

/**
 * **One material element of a team's full rule, and which overview sentence states it** — stage 3F, 22 October 2026 (his reply filed 23
 * October 2026, item 4: *"the overview as a whole preserves the material meaning of the full rule, including relevant initial conditions,
 * scoring eligibility, and exceptions"*). The fields one rule of the PROPOSED table classes on one element of the game (a condition, a
 * role's credit bound, a transition): whether the overview must state it (`material`) and why; the sentences of the group whose words
 * state its fields (indexes in the group); whether every field is stated; the Details sentence a pointer leads to where it is left to
 * Coach Details; and each sentence that cites a field of it whose words are not read as stating it, with the reading's reason.
 */
export interface MeaningElement {
    rule: string
    class: OverviewClass
    material: boolean
    element: string
    way: string | null
    fields: string[]
    statedBy: number[]
    complete: boolean
    pointer: { section: string; text: string } | null
    notStatedBy: { sentence: number; why: string }[]
    because: string
}

/** The agreement check's verdict, findings, and how it read each block's scoring sentences (since stage 3F, with each team's elements). */
export interface OverviewCheck {
    verdict: 'PASS' | 'FAIL'
    findings: OverviewFinding[]
    read: { blockId: string; groups: { group: string; sentences: SentenceReading[]; elements: MeaningElement[] }[] }[]
}

/** Word count and reading seconds — EVIDENCE for the administrator, never a gate. */
export interface OverviewReading {
    words: number
    byPart: { purpose: number; game: number; parameters: number; scoring: number }
    /** At 250 and 200 words a minute (a reading speed, not his benchmark), rounded to the second. */
    secondsAt250Wpm: number
    secondsAt200Wpm: number
    /** The served Coach Details' words, beside it. */
    detailsWords: number
    basis: string
}

/** A "full rule" pointer as the coach receives it: its label and the Details sentence it leads to, by section and words. */
export interface OverviewPointer {
    label: string
    section: string
    text: string
}

/** One line of how the teams score, as the coach receives it: its words and the "full rule" pointer it carries (stage 3F). */
export interface OverviewLine {
    text: string
    fullRule: OverviewPointer | null
}

/**
 * **How one team scores, as the coach receives it** (polish pass P1): the heading it is shown under (DRAFT words, `teamHeadingOf`), its
 * lines (the line saying how the team scores first, then the team's own qualifications, in served order), and the "full rule" pointers of
 * that team no line carries.
 */
export interface OverviewGroup {
    label: string
    lines: OverviewLine[]
    fullRules: OverviewPointer[]
}

/** **The Coach Overview a coach is served**: words and pointers only. Present only where Q7 found no violation in any block. */
export interface CoachOverview {
    purpose: string | null
    game: string
    parameters: string
    /**
     * How each team scores. Since polish pass P1 (22 October 2026): one group per team (`groups`), in the game sentence's team order (one
     * group, "Each team", where the game has no roles), each the team's line first and then its own qualifications; then the pointers every
     * team's group has, once (`fullRules`). The game sentence already says the opposing objectives first (his reply filed 23 October 2026,
     * item 6). Was (stages 3F-5B): every team's line, then all qualifications, then the pointers (`leads`, `qualifications`, `fullRules`);
     * before that (3D-3E), one group of sentences per team.
     */
    scoring: { groups: OverviewGroup[]; fullRules: OverviewPointer[] }
}

/** The overview as presented, with each sentence's status and source, for an administrator (the page's tags; never a coach's). */
export interface PresentedOverview {
    purpose: { text: string; wording: 'APPROVED'; source: WordingSource } | null
    game: { text: string; wording: 'DRAFT' }
    parameters: { text: string; wording: 'DRAFT' }
    scoring: {
        group: string
        noun: string | null
        /** Polish pass P1: the heading the group is shown under (`teamHeadingOf`), DRAFT words. */
        label: string
        labelStatus: 'DRAFT'
        /**
         * `reading` (stage 3E): for an extract kept by a recorded reading (since stage 3F also his wording said whole read by one), that
         * record and its label ("reading PROPOSED, awaiting confirmation"). `place` (stage 3F): the team's lead line, or a qualification.
         */
        sentences: {
            text: string
            wording: WordingStatus
            source: WordingSource | null
            fullRule: (OverviewPointer & { labelStatus: 'DRAFT' }) | null
            reading: ReadingRecord | null
            place: 'LEAD' | 'QUALIFICATION'
        }[]
        fullRules: (OverviewPointer & { labelStatus: 'DRAFT' })[]
    }[]
}

/**
 * The admin evidence of the overview (`review-evidence.ts` carries it where the goal's record asks for evidence). Stage 3E (the 3D review's
 * should-fix): aligned with the administrator's draft — the table with its source and label status, the PROPOSED readings record, each
 * "full rule" pointer with its label and label status (a sentence's, and the group's own in `fullRules`), each extract's reading label.
 */
export interface OverviewEvidence {
    served: boolean
    verdict: 'PASS' | 'FAIL' | 'NOT_CHECKED'
    findings: OverviewFinding[]
    /** Stage 3F (the 3E review's bookkeeping item): with the draft table's `why` (why it cannot be used, or null). */
    table: { source: string; status: string; label: string | null; labelStatus: 'DRAFT'; why: string | null }
    readings: ReadingsAccount
    sentences: {
        part: 'purpose' | 'game' | 'parameters' | 'scoring'
        group: string | null
        text: string
        wording: WordingStatus
        source: WordingSource | null
        fullRule: (OverviewPointer & { labelStatus: 'DRAFT' }) | null
        reading: ReadingRecord | null
        /** Stage 3F: for a scoring sentence, the team's lead line or a qualification; null for the purpose, game and parameters. */
        place: 'LEAD' | 'QUALIFICATION' | null
    }[]
    fullRules: (OverviewPointer & { labelStatus: 'DRAFT'; group: string })[]
    reading: OverviewReading | null
    /**
     * Stage 3F: for each team, each material element of its full rule and the overview sentence(s) stating it, as the agreement check read
     * the first block (every block says the same words, Q7.8): the sentences by their words; for an element left to Coach Details, the
     * Details sentence its pointer leads to; and each sentence that cites it without stating it, with the reading's reason.
     */
    meaning: {
        group: string
        noun: string | null
        elements: (Omit<MeaningElement, 'statedBy' | 'notStatedBy'> & { statedBy: string[]; notStatedBy: { text: string; why: string }[] })[]
    }[]
}

/** What the agreement check reads: the draft, each game with its own Details render, the served Details, and the knowledge it was composed with. */
export interface OverviewCheckInput {
    goalId: string | null
    draft: CoachOverviewDraft
    blocks: { blockId: string; fixture: any; rendered: Instruction[] }[]
    /** The Details a coach is served (for role blocks, the one composed activity): where a pointer must lead. */
    served: Instruction[]
    essentials?: EssentialsLoad
    wording?: ApprovedWording[]
    /** The recorded reading of what a part of his wording states (since stage 3E the PROPOSED record, `recordedReading`, by default). */
    reading?: CoverReading
    /** The planning model's Learning Goal row reader (a test may hand another). */
    lookup?: (id: string) => Record<string, unknown> | undefined
}

const sameSet = (a: string[], b: string[]): boolean => new Set(a).size === new Set(b).size && a.every(path => b.includes(path))
const bindingKey = (binding: Binding): string => canonicalJson([binding.path, binding.quantity, binding.as ?? null])
const sameName = (a: string, b: string) => a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).join(' ') === b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).join(' ')
const quoted = (text: string) => `"${text}"`

/** A statement of a sentence for the wording lexicons: its words and what they cite (a part, as fidelity Q4 holds parts). */
interface Statement {
    text: string
    from: string[]
}

/** How Q7 reads one scoring sentence, with the parts its wording rules apply to and whether its words are his. */
interface Read extends SentenceReading {
    statements: Statement[]
    /** `APPROVED_WHOLE`: his approved wording said whole, verified; `EXTRACT`: a verified extract of it; `DRAFT`: everything else. */
    words: 'APPROVED_WHOLE' | 'EXTRACT' | 'DRAFT'
    /** Stage 3F: the fields his wording said whole cites and its recorded reading says it does not state, with the reading's reason. */
    omissions: { path: string | null; why: string }[]
}

/** The member id a path names in a collection (`objectives[ID].team` gives ID), or null where the path is not in that collection. */
const memberIdOf = (path: string, collection: string): string | null => {
    const head = `${collection}[`
    if (!path.startsWith(head)) return null
    const end = path.indexOf('].', head.length)
    return end < 0 ? null : path.slice(head.length, end)
}

/**
 * **Q7.1 for the game sentence's role clauses** — stage 3E, 22 October 2026 (the 3D review's should-fix 1: the two target clauses swapped,
 * each keeping its own citations, passed Q7 and contradicted Details). A role clause begins at a part whose words begin with a role's noun
 * ("the {noun}", after any joining "; ", ": " or ", "), read from the words and never from the composer's structure, and runs to the next;
 * parts before the first (the teams counted together) belong to none. Each role of the block opens exactly one clause. In each clause: it
 * cites an objective; every objective it cites is held by the clause's role (its team designates that role in this block); every region it
 * cites that an objective references (a target) is that role's objective's; and the region its own objective references is cited. A game
 * without role nouns has no role clause.
 *
 * Polish pass P1: returns the roles in the order the clauses name them (the game sentence's team order, which the coach's groups follow).
 */
function roleClauses(sentence: OverviewSentence, fixture: any, refuse: (what: string) => void): string[] {
    const game = fixture?.game ?? {}
    const reading = gameReadingOf(fixture)
    const roles = Object.keys(reading.holdersInBlock)
        .filter(role => reading.roleNounOf[role])
        .sort((a, b) => reading.roleNounOf[b].length - reading.roleNounOf[a].length)
    if (!roles.length) return []
    const opener = (text: string): string | null => {
        let at = 0
        while (at < text.length && ';:, '.includes(text[at])) at++
        const words = text.slice(at).toLowerCase()
        return roles.find(role => words.startsWith(`the ${reading.roleNounOf[role].toLowerCase()}`)) ?? null
    }
    const clauses: { role: string; from: string[] }[] = []
    for (const part of sentence.parts) {
        const role = opener(part.text)
        if (role) clauses.push({ role, from: [...part.from] })
        else if (clauses.length) clauses[clauses.length - 1].from.push(...part.from)
    }
    // Each role of the block opens exactly one clause, so no role's target goes unread.
    for (const role of roles) {
        const opened = clauses.filter(clause => clause.role === role).length
        if (opened !== 1) refuse(`the game sentence opens ${opened} clauses with the ${reading.roleNounOf[role]}, where each role of this block opens exactly one`)
    }
    const objectives: any[] = Array.isArray(game.objectives) ? game.objectives : []
    const regions: any[] = Array.isArray(game.space?.regions) ? game.space.regions : []
    for (const clause of clauses) {
        const noun = reading.roleNounOf[clause.role]
        const what = `the game sentence's clause for the ${noun}`
        const cited = [...new Set(clause.from.map(path => memberIdOf(path, 'objectives')).filter((id): id is string => id !== null))]
        if (!cited.length) refuse(`${what} cites no objective, so whose target it names cannot be read`)
        const own: any[] = []
        for (const id of cited) {
            const objective = objectives.find(entry => String(entry?.elementId) === id)
            const holder = objective ? reading.roleOfDesignation(objective.team) : null
            if (holder !== clause.role) refuse(`${what} cites objective ${id}, which ${holder ? `the ${reading.roleNounOf[holder]} attacks` : 'no role of this block attacks'}, not the ${noun}`)
            else own.push(objective)
        }
        const citedRegions = new Set(clause.from.map(path => memberIdOf(path, 'space.regions')).filter((id): id is string => id !== null))
        for (const region of regions.filter(entry => citedRegions.has(String(entry?.elementId)))) {
            const target = reading.referencedBy(region)
            const holder = target ? reading.roleOfDesignation(target.team) : null
            if (target && holder !== clause.role) refuse(`${what} cites the region ${region.elementId}, the target ${holder ? `the ${reading.roleNounOf[holder]} attacks` : 'of no role of this block'}, not the ${noun}'s`)
        }
        for (const objective of own) {
            const target = regions.find(region => reading.referencedBy(region) === objective)
            if (target && !citedRegions.has(String(target.elementId))) refuse(`${what} does not cite the region ${target.elementId} its objective ${objective.elementId} references: the target it names cannot be read as the ${noun}'s`)
        }
    }
    return clauses.map(clause => clause.role)
}

/** A pointer's words (label, section, text), or null: how two pointers are told the same. */
const pointerWordsOf = (pointer: { label: string; section: string; text: string } | null | undefined) => (pointer ? [pointer.label, pointer.section, pointer.text] : null)
const samePointer = (a: { section: string; text: string }, b: { section: string; text: string }) => a.section === b.section && a.text === b.text

/**
 * **Q7.5, what the coach is served** — polish pass P1, 22 October 2026. The served scoring (`coachOverviewOf`, read back) against the
 * first block's checked groups (every block says the same words, Q7.8) and that block's own reading of the teams (`spec`, and the order its
 * game sentence names them in, `order`): one group per team, in that order; each under its own heading (`teamHeadingOf` of the noun the
 * game reads for the role); each group's lines exactly its own sentences, in order, each with its own pointer; each pointer under a group
 * that group's, every one of a group's pointers shown (under it, or after the groups); and a pointer after the groups only where every
 * team's group has it.
 */
export function servedGroupsHold(served: CoachOverview, groups: ScoringGroup[], spec: ScoringRequirements, order: string[], refuse: (what: string) => void): void {
    const ids = spec.groups
    const nounOf = (id: string) => spec.nouns[id] ?? 'every team'
    if (order.length && canonicalJson(order) !== canonicalJson(ids)) refuse(`the game sentence names the teams in the order ${JSON.stringify(order.map(nounOf))}, and their groups are in the order ${JSON.stringify(ids.map(nounOf))}`)
    const shown = served.scoring?.groups ?? []
    if (shown.length !== ids.length) refuse(`${shown.length} groups are shown and this block has ${ids.length} teams`)
    ids.forEach((id, i) => {
        const view = shown[i]
        const group = groups.find(entry => entry.group === id)
        if (!view || !group) return
        const noun = nounOf(id)
        const heading = teamHeadingOf(spec.nouns[id] ?? null)
        if (view.label !== heading) refuse(`the ${noun}'s group is shown under ${quoted(view.label)}, where its heading is ${quoted(heading)}`)
        if (canonicalJson(view.lines.map(line => line.text)) !== canonicalJson(group.sentences.map(sentence => sentence.text))) {
            refuse(`the lines shown under ${quoted(view.label)} are not the ${noun}'s group, sentence for sentence and in order: ${JSON.stringify(view.lines.map(line => line.text))}`)
        }
        view.lines.forEach((line, n) => {
            const own = group.sentences[n]?.fullRule ?? null
            if (canonicalJson(pointerWordsOf(line.fullRule)) !== canonicalJson(pointerWordsOf(own))) refuse(`the line ${quoted(line.text)} under ${quoted(view.label)} carries a pointer that is not its own sentence's`)
        })
        for (const pointer of view.fullRules) if (!group.fullRules.some(own => samePointer(own, pointer) && own.label === pointer.label)) refuse(`a pointer to ${quoted(pointer.text)} is shown under ${quoted(view.label)}, and it is not the ${noun}'s`)
        for (const own of group.fullRules) {
            const carried = view.fullRules.some(pointer => samePointer(own, pointer)) || view.lines.some(line => line.fullRule && samePointer(own, line.fullRule)) || (served.scoring?.fullRules ?? []).some(pointer => samePointer(own, pointer))
            if (!carried) refuse(`the ${noun}'s pointer to ${quoted(own.text)} is not shown`)
        }
    })
    for (const pointer of served.scoring?.fullRules ?? []) {
        if (!groups.every(group => group.fullRules.some(own => samePointer(own, pointer) && own.label === pointer.label))) refuse(`a pointer to ${quoted(pointer.text)} is shown after the groups, as every team's, and not every team's group has it`)
    }
}

/**
 * **The agreement check, Q7** (module comment): every block of the draft against that block's game and Details render, the served Details
 * and the essentials table. Never throws on a malformed draft: what cannot be read is a finding.
 */
export function checkOverview(input: OverviewCheckInput): OverviewCheck {
    const findings: OverviewFinding[] = []
    const violation = (question: OverviewQuestion, blockId: string | null, what: string) => findings.push({ question, severity: 'VIOLATION', blockId, what })
    const note = (question: OverviewQuestion, blockId: string | null, what: string) => findings.push({ question, severity: 'NOTE', blockId, what })
    const { draft, goalId } = input
    const wording = input.wording ?? approvedWording()
    const load = input.essentials ?? essentialsTable()
    const recorded = input.reading ?? recordedReading()
    const lookup = input.lookup ?? sessionPlanningModel.learningGoal
    const read: OverviewCheck['read'] = []
    /** Polish pass P1: the first block's reading of its teams, the game sentence's team order and its groups, for what the coach is served. */
    let firstBlock: { spec: ScoringRequirements; order: string[]; groups: ScoringGroup[] } | null = null

    // ── Q7.0 completeness, and the purpose (Q7.1 / Q7.3) ──
    if (!input.blocks.length) violation('7.0', null, 'the activity holds no game to read an overview from')
    const ids = input.blocks.map(block => block.blockId)
    const sameBlocks = (listed: { blockId: string }[]) => canonicalJson(listed.map(entry => entry.blockId)) === canonicalJson(ids)
    if (!sameBlocks(draft.blocks) || !sameBlocks(draft.scoring.blocks) || !sameBlocks(draft.extracts)) violation('7.0', null, `the overview was not read from the games this activity was built from, block by block (${ids.join(', ')})`)
    for (const gap of draft.gaps) if (gap.part !== 'purpose') violation('7.0', gap.blockId ?? null, `the overview has a gap (${gap.part}): ${gap.what}`)
    if (!load.table) violation('7.0', null, `the essentials table cannot be used: ${load.why}`)
    else if (load.table.status === 'PROPOSED') note('7.0', null, 'the overview is built on the PROPOSED essentials table, which he has not approved')
    if (goalId === null) {
        if (draft.purpose !== null) violation('7.1', null, 'a mechanism demonstration claims no Learning Goal, and the overview gives it a learning purpose')
    } else if (!draft.purpose) {
        violation('7.0', null, `the overview of Learning Goal ${goalId} states no learning purpose${draft.gaps.some(gap => gap.part === 'purpose') ? `: ${draft.gaps.find(gap => gap.part === 'purpose')!.what}` : ''}`)
    } else {
        const definition = lookup(goalId)?.[PURPOSE_SOURCE.column]
        if (typeof definition !== 'string' || draft.purpose.text !== definition) violation('7.1', null, `the learning purpose ${quoted(draft.purpose.text)} is not the Learning Goal's "${PURPOSE_SOURCE.column}", byte for byte`)
        const source = { kind: 'KNOWLEDGE', ...PURPOSE_SOURCE, id: goalId }
        if (canonicalJson(draft.purpose.source) !== canonicalJson(source)) violation('7.1', null, `the learning purpose cites ${JSON.stringify(draft.purpose.source)}; only the Learning Goal's "${PURPOSE_SOURCE.column}" is a recorded source of one`)
        if (draft.purpose.wording !== 'APPROVED') violation('7.3', null, 'the learning purpose is his authored knowledge, verbatim, and is not marked APPROVED')
    }

    for (const block of input.blocks) {
        const { blockId, fixture, rendered } = block
        const game = fixture?.game ?? {}
        const own = draft.blocks.find(entry => entry.blockId === blockId)
        const groups = draft.scoring.blocks.find(entry => entry.blockId === blockId)?.groups ?? []
        const extracts: DerivedExtract[] = draft.extracts.find(entry => entry.blockId === blockId)?.extracts ?? []
        const cited = new Set(rendered.flatMap(instruction => instruction.from))
        const bound = new Set(rendered.flatMap(instruction => (instruction.parts ?? []).flatMap(p => p.bindings ?? [])).map(bindingKey))
        const roleNames = Object.keys(fixture?.envelope?.roles ?? {})

        /** Q7.1: each path cited by a Details sentence of this block. */
        const citations = (what: string, from: string[]) => {
            if (!from.length) violation('7.1', blockId, `${what} cites nothing`)
            for (const path of from) if (!cited.has(path)) violation('7.1', blockId, `${what} cites ${path}, which no Details sentence of this block cites`)
        }
        /** Q7.2: every number said is bound in the order said, and every binding is one a Details sentence of this block makes. */
        const numbers = (what: string, text: string, bindings: Binding[]) => {
            const said = numbersIn(text)
            const bindingQuantities = bindings.map(binding => binding.quantity)
            if (canonicalJson(said) !== canonicalJson(bindingQuantities)) violation('7.2', blockId, `${what} says ${JSON.stringify(said)} where its bindings give ${JSON.stringify(bindingQuantities)}, in that order`)
            for (const binding of bindings) if (!bound.has(bindingKey(binding))) violation('7.2', blockId, `${what} binds ${binding.quantity} to ${binding.path}, and no Details sentence of this block binds that number there`)
        }
        /** Q7.7: the obligation lexicon on each statement that is not his words (a pinned template restating its own value excepted). */
        const lexicon = (what: string, text: string, statements: Statement[], words: Read['words'], from: string[]) => {
            if (words === 'DRAFT') {
                for (const statement of statements) {
                    if (!OBLIGATIONS.some(word => word.test(statement.text))) continue
                    if (OBLIGATION_ALLOWLIST.some(template => template.holds(statement, fixture))) continue
                    violation('7.7', blockId, `${what} states a player obligation or an order of actions in words that are not his: ${quoted(statement.text)}`)
                }
                for (const hit of findCommunicationStandardViolations(text)) note('7.7', blockId, `${what} uses wording the Coach Communication Standard lists to avoid: ${quoted(hit)}`)
            }
            if (words === 'APPROVED_WHOLE') return
            // The specialized-role rule: a sentence naming a role with a word of obligation or order passes only as his words restating a
            // value of a field it cites.
            const role = roleNames.filter(name => namesRole(text, name)).find(name => !(words === 'EXTRACT' && from.some(path => stringsAt(game, path).some(value => sameName(value, name)))))
            if (role && [...OBLIGATIONS, ...ROLE_ORDERING].some(word => word.test(text))) violation('7.7', blockId, `${what} names the ${role} with a word of obligation or order`)
        }
        /** Q7.2: every derived term said is declared, holds by its rule, and binds its values as Details do; none is declared unsaid. */
        const derivedTerms = (what: string, sentence: OverviewSentence) => {
            const lower = ` ${sentence.text.toLowerCase().split(/[^a-z0-9]+/).join(' ')} `
            for (const term of Object.keys(DERIVED_TERM_RULES)) {
                const declared = sentence.derivedTerms.filter(entry => entry.term === term)
                if (lower.includes(` ${term} `) && !declared.length) violation('7.2', blockId, `${what} says "${term}" and declares no derived term for it`)
            }
            for (const term of sentence.derivedTerms) {
                const rule = DERIVED_TERM_RULES[term.term]
                if (!rule) {
                    violation('7.2', blockId, `${what} declares the derived term "${term.term}", which no rule says`)
                    continue
                }
                if (!lower.includes(` ${term.term} `)) violation('7.2', blockId, `${what} declares the derived term "${term.term}" and does not say it`)
                if (!rule.holds(term.values)) violation('7.2', blockId, `${what} says "${term.term}" and its values ${JSON.stringify(term.values)} do not hold its rule (${rule.rule})`)
                for (const value of term.values) {
                    if (!bound.has(bindingKey(value))) violation('7.2', blockId, `${what} says "${term.term}" from ${value.quantity} at ${value.path}, and no Details sentence of this block binds that number there`)
                    if (!sentence.from.includes(value.path)) violation('7.2', blockId, `${what} says "${term.term}" from ${value.path}, which it does not cite`)
                }
            }
        }

        // ── The game sentence and the parameters ──
        for (const [slot, sentence] of [
            ['game', own?.game ?? null],
            ['parameters', own?.parameters ?? null],
        ] as const) {
            if (!sentence) {
                violation('7.0', blockId, `the overview has no ${slot} sentence for this block`)
                continue
            }
            const what = `the ${slot} sentence ${quoted(sentence.text)}`
            if (sentence.wording !== 'DRAFT') violation('7.3', blockId, `${what} is composed here and is not marked DRAFT`)
            if (sentence.parts.map(p => p.text).join('') !== sentence.text) violation('7.1', blockId, `${what} is not the words of its parts`)
            if (!sameSet(sentence.from, sentence.parts.flatMap(p => p.from))) violation('7.1', blockId, `${what} cites other paths than its parts`)
            citations(what, sentence.from)
            numbers(what, sentence.text, sentence.parts.flatMap(p => p.bindings))
            derivedTerms(what, sentence)
            lexicon(what, sentence.text, sentence.parts, 'DRAFT', sentence.from)
        }

        // ── Q7.6: the counts, exactly as the Players sentence's builder says them, under the role holding them ──
        if (own?.game) {
            const sentence = own.game
            const counts = teamCountPhrases(fixture)
            const expected: Binding[] = [...(!counts.byRole && counts.teamsCount ? counts.teamsCount.bindings : []), ...counts.teams.flatMap(team => team.segments.flatMap(segment => segment.bindings)), ...(counts.neutrals?.bindings ?? [])]
            const said = sentence.parts.flatMap(p => p.bindings).filter(binding => binding.path.startsWith('performers.'))
            const sorted = (list: Binding[]) => list.map(bindingKey).sort()
            if (canonicalJson(sorted(said)) !== canonicalJson(sorted(expected))) violation('7.6', blockId, `the game sentence counts ${JSON.stringify(said.map(b => [b.path, b.quantity]))} where the Players sentence's builder counts ${JSON.stringify(expected.map(b => [b.path, b.quantity]))}`)
            if (counts.byRole) {
                for (const team of counts.teams) {
                    const phrase = team.segments.map((segment, j) => `${j === 0 ? '' : segment.joiner}${segment.text}`).join('')
                    if (!sentence.text.includes(`${team.noun} (${phrase})`)) violation('7.6', blockId, `the game sentence does not say the ${team.noun}'s counts as the Players sentence does: "${team.noun} (${phrase})"`)
                }
            } else if (counts.teamsCount && !sentence.text.includes(counts.teamsCount.text)) {
                violation('7.6', blockId, `the game sentence does not say the teams as the Players sentence does: "${counts.teamsCount.text}"`)
            }
            if (counts.neutrals && !sentence.text.includes(counts.neutrals.text)) violation('7.6', blockId, `the game sentence does not say the neutral players as the Players sentence does: "${counts.neutrals.text}"`)
        }

        // ── Q7.1 (stage 3E, the 3D review's should-fix): in each role clause, the objective and the target region it cites are its team's ──
        const order = own?.game ? roleClauses(own.game, fixture, (what: string) => violation('7.1', blockId, what)) : []

        // ── How each team scores (Q7.1-Q7.5, Q7.7), read here, sentence by sentence ──
        const spec: ScoringRequirements | null = load.table ? scoringRequirementsOf(fixture, rendered, load.table, wording) : null
        const blockRead: OverviewCheck['read'][number] = { blockId, groups: [] }
        read.push(blockRead)
        if (!spec) continue
        if (block === input.blocks[0]) firstBlock = { spec, order, groups }
        const details = spec.details
        const detailsAt = (ref: { blockIndex: number; section: string; text: string } | undefined): DetailsSentence | null => {
            if (!ref) return null
            const exact = details[ref.blockIndex]
            if (exact && exact.instruction.section === ref.section && exact.instruction.text === ref.text) return exact
            return details.find(entry => entry.instruction.section === ref.section && entry.instruction.text === ref.text) ?? null
        }
        /** Stage 3F: what each approved entry said for this block states, said whole, read here by the recorded reading (never the draft's copy). */
        const wholes = wholeReadingsFor(game, { wording, reading: recorded })
        /** What a scoring sentence's words are and state, read here (module comment, Q7.4), with the status findings (Q7.3). */
        const readSentence = (sentence: ScoringSentence, what: string): Read => {
            const unverified = (statements: Statement[]): Read => ({ text: sentence.text, form: 'UNVERIFIED', states: [], statements, words: 'DRAFT', omissions: [] })
            const referenced = detailsAt(sentence.details)
            // Stage 3E: only his wording read by a recorded reading names one (its label for an administrator): an extract kept by one, and
            // since stage 3F his wording said whole (checked in its branch below); a DRAFT sentence names none.
            if (sentence.wording === 'DRAFT' && (sentence.reading ?? null) !== null) violation('7.3', blockId, `${what} names a reading of his wording (${JSON.stringify(sentence.reading)}), and only his wording read by a recorded reading has one`)
            /** Q7.2 (stage 3E, the 3D review's should-fix 4): a Details sentence said whole binds exactly what that sentence binds, in order. */
            const sameBindings = (instruction: Instruction, kind: string) => {
                const own = bindingsOfInstruction(instruction)
                if (canonicalJson(sentence.bindings) !== canonicalJson(own)) violation('7.2', blockId, `${what} is ${kind} and binds ${JSON.stringify(sentence.bindings)}, where that Details sentence binds ${JSON.stringify(own)}`)
            }
            if (sentence.wording === 'APPROVED') {
                const whole = [referenced, ...details].find(
                    entry => !!entry && entry.wording === 'APPROVED' && canonicalJson(entry.source) === canonicalJson(sentence.source) && withFullStop(entry.instruction.text) === sentence.text && sameSet(sentence.from, entry.instruction.from),
                )
                if (!whole) {
                    violation('7.3', blockId, `${what} is marked APPROVED and is not his approved wording said whole, with exactly its citations, in this block's Details`)
                    return unverified([{ text: sentence.text, from: sentence.from }])
                }
                sameBindings(whole.instruction, 'his approved wording said whole')
                // Stage 3F (his reply filed 23 October 2026, item 4): his wording said whole states only what its recorded reading gives it,
                // never every field it cites; with no reading it states nothing. It names that reading's record, exactly.
                const read = wholeReadingOfSentence(wholes, whole.instruction, whole.source)
                const recordedWhole = read !== null && read.reading === 'RECORDED'
                const expected = recordedWhole ? read!.readingRecord : null
                if (canonicalJson(sentence.reading ?? null) !== canonicalJson(expected)) violation('7.3', blockId, `${what} names the reading ${JSON.stringify(sentence.reading ?? null)}, and his wording said whole is read by ${JSON.stringify(expected)}`)
                if (!recordedWhole) note('7.4', blockId, `${what} is his wording said whole, and no reading of what it states is recorded, so it is read as stating nothing`)
                return {
                    text: sentence.text,
                    form: 'WHOLE',
                    states: recordedWhole ? [...read!.states] : [],
                    statements: whole.instruction.parts ?? [],
                    words: 'APPROVED_WHOLE',
                    omissions: (read?.doesNotState ?? []).map(left => ({ path: left.path, why: left.why })),
                }
            }
            if (sentence.wording === 'DERIVED_FROM_APPROVED') {
                const extract = extracts.find(entry => entry.id === sentence.extractId)
                const problems: string[] = []
                if (!extract) problems.push(`it names no extract generated for this block (${JSON.stringify(sentence.extractId)})`)
                else {
                    const why = extractUnusableBecause(extract, { wording, game, reading: recorded })
                    if (why) problems.push(`its extract ${extract.id} is not usable: ${why}`)
                    if (extract.text !== sentence.text) problems.push(`its words are not its extract's (${quoted(extract.text)})`)
                    if (sentence.source?.kind !== 'APPROVED_ENTRY' || sentence.source.id !== extract.source.id) problems.push(`its source ${JSON.stringify(sentence.source)} is not its extract's entry ${extract.source.id}`)
                    if (!details.some(entry => entry.wording === 'APPROVED' && entry.source?.kind === 'APPROVED_ENTRY' && entry.source.id === extract.source.id)) problems.push(`its source entry ${extract.source.id} is not said whole in this block's Details`)
                    if (!sameSet(sentence.from, extract.from)) problems.push(`it cites ${JSON.stringify(sentence.from)}, and its extract cites ${JSON.stringify(extract.from)}`)
                    // Stage 3E: the reading it names (its administrator's label) is its extract's, which the check above held to the reading itself.
                    if (canonicalJson(sentence.reading ?? null) !== canonicalJson(extract.readingRecord ?? null)) problems.push(`it names the reading ${JSON.stringify(sentence.reading ?? null)}, and its extract is kept by ${JSON.stringify(extract.readingRecord ?? null)}`)
                }
                if (problems.length || !extract) {
                    violation('7.3', blockId, `${what} is marked DERIVED_FROM_APPROVED and ${problems.join('; ')}`)
                    return unverified([{ text: sentence.text, from: sentence.from }])
                }
                return { text: sentence.text, form: 'EXTRACT', states: extract.keeps.map(ref => ref.path).filter((path): path is string => !!path), statements: [{ text: sentence.text, from: sentence.from }], words: 'EXTRACT', omissions: [] }
            }
            if (sentence.wording !== 'DRAFT') {
                violation('7.3', blockId, `${what} carries the status ${JSON.stringify(sentence.wording)}, which is none of the three`)
                return unverified([{ text: sentence.text, from: sentence.from }])
            }
            if (sentence.source !== null) violation('7.3', blockId, `${what} is marked DRAFT and names an approved source ${JSON.stringify(sentence.source)}`)
            // A Details sentence said whole: his wording marked DRAFT is a wrong status; a DRAFT one states what it cites.
            const whole = [referenced, ...details].find(entry => !!entry && withFullStop(entry.instruction.text) === sentence.text)
            if (whole) {
                if (whole.wording === 'APPROVED') violation('7.3', blockId, `${what} is his approved wording and is marked DRAFT`)
                if (!sameSet(sentence.from, whole.instruction.from)) violation('7.1', blockId, `${what} is a Details sentence said whole and cites other paths than it does`)
                sameBindings(whole.instruction, 'a Details sentence said whole')
                // His wording marked DRAFT (refused above) states nothing: its meaning is its reading's, never its citations' (stage 3F).
                return { text: sentence.text, form: 'WHOLE', states: whole.wording === 'APPROVED' ? [] : [...whole.instruction.from], statements: whole.instruction.parts ?? [{ text: whole.instruction.text, from: whole.instruction.from }], words: 'DRAFT', omissions: [] }
            }
            // A cut of a DRAFT Details sentence: it states only what the parts it keeps whole cite (the cut itself is the composer's rule).
            for (const entry of [referenced, ...details]) {
                if (!entry || entry.wording !== 'DRAFT') continue
                const cut = draftShorteningsOf(entry.instruction).find(candidate => candidate.text === sentence.text)
                if (!cut) continue
                const parts = entry.instruction.parts ?? []
                const kept: Statement[] = []
                const keptBindings: Binding[] = []
                let at = 0
                for (const p of parts) {
                    const end = at + p.text.length
                    if (end <= cut.end) {
                        kept.push({ text: p.text, from: p.from })
                        keptBindings.push(...(p.bindings ?? []))
                    } else if (at < cut.end) kept.push({ text: entry.instruction.text.slice(at, cut.end), from: [] })
                    at = end
                }
                const states = [...new Set(kept.flatMap(statement => statement.from))]
                if (!sameSet(sentence.from, states)) violation('7.1', blockId, `${what} is a cut of a Details sentence and cites ${JSON.stringify(sentence.from)}, where the parts it keeps whole cite ${JSON.stringify(states)}`)
                // Stage 3E (with the whole-sentence rule above): a cut binds exactly what the parts it keeps whole bind, in order.
                if (canonicalJson(sentence.bindings) !== canonicalJson(keptBindings)) violation('7.2', blockId, `${what} is a cut of a Details sentence and binds ${JSON.stringify(sentence.bindings)}, where the parts it keeps whole bind ${JSON.stringify(keptBindings)}`)
                return { text: sentence.text, form: 'SHORTENING', states, statements: kept, words: 'DRAFT', omissions: [] }
            }
            note('7.4', blockId, `${what} is neither a Details sentence of this block nor a cut of one: what its words state cannot be checked, so it is read as stating nothing`)
            return unverified([{ text: sentence.text, from: sentence.from }])
        }
        /** A pointer resolved in this block's render and in the served Details, or why not. */
        const resolve = (pointer: DetailsPointer, what: string): DetailsSentence | null => {
            if (pointer.label !== FULL_RULE_LABEL) violation('7.4', blockId, `${what} is labelled ${JSON.stringify(pointer.label)}, not "${FULL_RULE_LABEL}"`)
            const target = detailsAt(pointer)
            if (!target) {
                violation('7.4', blockId, `${what} leads to ${quoted(pointer.text)} (${pointer.section}), which no Details sentence of this block says`)
                return null
            }
            const servedHere = input.served.filter(instruction => instruction.section === pointer.section && instruction.text === pointer.text)
            if (servedHere.length !== 1) violation('7.4', blockId, `${what} leads to ${quoted(pointer.text)} (${pointer.section}), which the served Details say ${servedHere.length} times, not once`)
            if (!pointer.paths.length) violation('7.4', blockId, `${what} says nothing it points for`)
            for (const path of pointer.paths) if (!target.instruction.from.includes(path)) violation('7.4', blockId, `${what} points for ${path}, which ${quoted(pointer.text)} does not cite`)
            return target
        }

        const expectedGroups = spec.groups
        if (canonicalJson(groups.map(group => group.group)) !== canonicalJson(expectedGroups)) violation('7.5', blockId, `the overview's scoring groups are ${JSON.stringify(groups.map(group => group.group))}, and the teams of this block are ${JSON.stringify(expectedGroups)}`)
        for (const id of expectedGroups) {
            const group = groups.find(entry => entry.group === id)
            const noun = spec.nouns[id] ?? 'every team'
            if (!group) {
                violation('7.5', blockId, `how the ${noun} scores is not in the overview`)
                continue
            }
            if (group.withheld) {
                violation('7.5', blockId, `how the ${noun} scores is withheld: ${group.why.join('; ')}`)
                continue
            }
            for (const problem of spec.problems[id] ?? []) violation('7.4', blockId, `the ${noun}'s group: ${problem}`)
            if (!group.sentences.length) violation('7.5', blockId, `the ${noun}'s group says nothing`)
            // Polish pass P1: the group's heading is composed from its noun, so the noun is the one the game reads for the role.
            if ((group.noun ?? null) !== (spec.nouns[id] ?? null)) violation('7.5', blockId, `the ${noun}'s group is named ${JSON.stringify(group.noun ?? null)}, and the game reads the role's noun as ${JSON.stringify(spec.nouns[id] ?? null)}`)
            const reads = group.sentences.map((sentence, n) => {
                const what = `the ${noun}'s sentence ${n + 1} ${quoted(sentence.text)}`
                const reading = readSentence(sentence, what)
                citations(what, sentence.from)
                numbers(what, sentence.text, sentence.bindings)
                lexicon(what, sentence.text, reading.statements, reading.words, sentence.from)
                return reading
            })
            const stated = new Set(reads.flatMap(reading => reading.states))
            const pointers = [...group.sentences.flatMap(sentence => (sentence.fullRule ? [sentence.fullRule] : [])), ...group.fullRules]
            const resolved = pointers.map((pointer, n) => resolve(pointer, `the ${noun}'s "${FULL_RULE_LABEL}" pointer ${n + 1}`)).filter((entry): entry is DetailsSentence => entry !== null)
            const requirements = spec.requirements[id] ?? []
            /** Stage 3F: the conditions an exception follows from that this group does not state (none, or null where it follows from none). */
            const ungoverned = (requirement: ScoringRequirement): string[] | null => {
                const governing = followsFromOf(requirement, requirements, load.table!)
                return governing === null ? null : governing.filter(entry => !entry.fields.length || entry.fields.some(field => !stated.has(field.path))).map(entry => entry.rule)
            }
            for (const requirement of requirements) {
                if (stated.has(requirement.path)) continue
                if (requirement.class !== 'DETAIL') {
                    violation('7.4', blockId, `${requirement.path} (${requirement.class}, rule ${requirement.rule}) is stated by no sentence of the ${noun}'s group: a pointer never excuses it`)
                    continue
                }
                // Stage 3F (his reply filed 23 October 2026, item 4): an exception is left to Coach Details only where the group states the
                // condition it follows from; otherwise it is material, and a pointer does not excuse it.
                const unstated = ungoverned(requirement)
                if (unstated && unstated.length) violation('7.4', blockId, `${requirement.path} (DETAIL, rule ${requirement.rule}) is material in the ${noun}'s group: it follows from ${unstated.join(' and ')}, which the group does not state, so a pointer does not excuse it`)
                else if (!resolved.some(target => target.instruction.from.includes(requirement.path))) violation('7.4', blockId, `${requirement.path} (DETAIL, rule ${requirement.rule}) is left out of the ${noun}'s group with no "${FULL_RULE_LABEL}" pointer to a Details sentence citing it`)
            }
            // ── Stage 3F (the 3E review's should-fix 2): a team's group states only how that team scores, never a field another role owns ──
            reads.forEach((reading, n) => {
                for (const path of reading.states) {
                    const own = spec.owners[path] ?? []
                    if (own.length && !own.includes(id)) violation('7.4', blockId, `the ${noun}'s sentence ${n + 1} ${quoted(group.sentences[n].text)} states ${path}, which is how the ${own.map(role => spec.nouns[role] ?? role).join(' and ')} scores: a team's group says only how that team scores`)
                }
                // Polish pass P1 (the 3F and Stage 4 reviews): the coach reads each sentence under its team's heading, so it states something
                // that team's group must account for; a sentence stating nothing of its team does not belong under it.
                if (!reading.states.some(path => requirements.some(requirement => requirement.path === path))) {
                    violation('7.4', blockId, `the ${noun}'s sentence ${n + 1} ${quoted(group.sentences[n].text)} states nothing the ${noun}'s group must account for, so it is not shown under that team`)
                }
            })
            // ── Stage 3F (his item 6): the group opens with exactly one line saying how the team scores (its first way to score); the rest qualify it ──
            const firstWay = requirements.find(requirement => requirement.class === 'CONSTITUTIVE')?.way ?? null
            group.sentences.forEach((sentence, n) => {
                if (sentence.place !== 'LEAD' && sentence.place !== 'QUALIFICATION') violation('7.5', blockId, `the ${noun}'s sentence ${n + 1} is placed ${JSON.stringify(sentence.place)}, neither the line saying how the team scores nor a qualification`)
            })
            const leads = group.sentences.flatMap((sentence, n) => (sentence.place === 'LEAD' ? [n] : []))
            if (leads.length !== 1 || leads[0] !== 0) violation('7.5', blockId, `the ${noun}'s group opens with ${leads.length === 1 ? 'a qualification' : `${leads.length} lines saying how it scores`}, where exactly one line, first, says how the team scores`)
            else if (reads.length) {
                const shows = reads[0].states.some(path => requirements.some(requirement => requirement.path === path && requirement.class === 'CONSTITUTIVE' && requirement.way === firstWay))
                if (!shows) violation('7.5', blockId, `the ${noun}'s first line ${quoted(group.sentences[0].text)} states no field of the team's first way to score, so it does not say how the team scores`)
                const count = sentencesOf(group.sentences[0].text).length
                if (count !== 1) note('7.5', blockId, `the ${noun}'s first line is ${count} sentences, where one would say how the team scores at once`)
            }
            // ── Stage 3F: each material element of the team's full rule, and the sentence(s) stating it (the administrator's evidence) ──
            const elements: MeaningElement[] = []
            const byElement = new Map<string, ScoringRequirement[]>()
            for (const requirement of requirements) {
                const key = canonicalJson([requirement.rule, elementPathOf(requirement.path)])
                byElement.set(key, [...(byElement.get(key) ?? []), requirement])
            }
            for (const fields of byElement.values()) {
                const first = fields[0]
                const unstated = ungoverned(first)
                const material = first.class !== 'DETAIL' || (unstated !== null && unstated.length > 0)
                const complete = fields.every(field => stated.has(field.path))
                const statedBy = reads.flatMap((reading, n) => (fields.some(field => reading.states.includes(field.path)) ? [n] : []))
                const target = complete ? null : (resolved.find(entry => fields.filter(field => !stated.has(field.path)).every(field => entry.instruction.from.includes(field.path))) ?? null)
                const notStatedBy = group.sentences.flatMap((sentence, n) => {
                    const cited = fields.filter(field => sentence.from.includes(field.path) && !reads[n].states.includes(field.path))
                    if (!cited.length) return []
                    const omission = reads[n].omissions.find(left => cited.some(field => field.path === left.path))
                    return [{ sentence: n, why: omission?.why ?? 'its words are not read as stating it' }]
                })
                const governing = followsFromOf(first, requirements, load.table!)
                const because =
                    first.class === 'CONSTITUTIVE'
                        ? 'a way the team scores, or part of one: the overview states it'
                        : first.class === 'ESSENTIAL'
                          ? 'a qualification the PROPOSED table holds material: the overview states it, and a pointer never excuses it'
                          : material
                            ? `an exception the PROPOSED table leaves to Coach Details only where the overview states the condition it follows from (${unstated!.join(' and ')}); this group does not, so it is material`
                            : governing
                              ? `an exception that follows from ${governing.map(entry => entry.rule).join(' and ')}, which this group states: left to Coach Details behind a "${FULL_RULE_LABEL}" pointer`
                              : `left to Coach Details behind a "${FULL_RULE_LABEL}" pointer (PROPOSED table)`
                elements.push({
                    rule: first.rule,
                    class: first.class,
                    material,
                    element: elementPathOf(first.path),
                    way: first.way,
                    fields: fields.map(field => field.path),
                    statedBy,
                    complete,
                    pointer: target ? { section: target.instruction.section, text: target.instruction.text } : null,
                    notStatedBy,
                    because,
                })
            }
            blockRead.groups.push({ group: id, sentences: reads.map(({ text, form, states }) => ({ text, form, states })), elements })
            // ── Q7.5: every way to score the group speaks of, shown by a stated CONSTITUTIVE field under it ──
            for (const way of [...new Set(requirements.map(requirement => requirement.way).filter((entry): entry is string => !!entry))]) {
                const under = requirements.filter(requirement => requirement.way === way && requirement.class === 'CONSTITUTIVE')
                if (!under.length) violation('7.5', blockId, `the way to score ${way} has no field the essentials table classes CONSTITUTIVE, so the ${noun}'s group cannot be shown to say it`)
                else if (!under.some(requirement => stated.has(requirement.path))) violation('7.5', blockId, `the way to score ${way} is said by no sentence of the ${noun}'s group`)
            }
        }
        for (const group of groups) if (!expectedGroups.includes(group.group)) violation('7.5', blockId, `the overview speaks of a group ${JSON.stringify(group.group)} this block does not have`)
    }

    // Stage 3E: an overview saying an extract kept by the PROPOSED readings record is labelled so for an administrator, as the table is.
    const labelled = draft.scoring.blocks.flatMap(block => block.groups.flatMap(group => group.sentences.filter(sentence => sentence.reading?.status === 'PROPOSED')))
    if (labelled.length) note('7.3', null, `the overview says ${[...new Set(labelled.map(sentence => quoted(sentence.text)))].join(' and ')} by a PROPOSED reading of his wording (${labelled[0].reading!.source}), awaiting his confirmation`)

    // ── Q7.8: the same words in every block (nothing is told apart by block) ──
    const pointerWords = (pointer: DetailsPointer | null) => (pointer ? [pointer.label, pointer.section, pointer.text] : null)
    const wordsOf = (blockId: string) => {
        const own = draft.blocks.find(entry => entry.blockId === blockId)
        const groups = draft.scoring.blocks.find(entry => entry.blockId === blockId)?.groups ?? []
        return canonicalJson({
            game: own?.game?.text ?? null,
            parameters: own?.parameters?.text ?? null,
            scoring: groups.map(group => [group.group, group.noun ?? null, group.withheld, group.sentences.map(sentence => [sentence.text, sentence.wording, sentence.source, pointerWords(sentence.fullRule), sentence.place ?? null]), group.fullRules.map(pointerWords)]),
        })
    }
    const differing = ids.filter(id => wordsOf(id) !== wordsOf(ids[0]))
    if (differing.length) violation('7.8', null, `the overview says other words in block ${differing.join(', ')} than in block ${ids[0]}, and no sentence is told apart by block, so it is withheld rather than shown for one block`)

    // ── Q7.5 (polish pass P1): what the coach is served holds each sentence under its own team, in the game sentence's team order ──
    const presented = presentedOf(draft)
    if (presented && firstBlock) {
        const first = firstBlock
        servedGroupsHold(coachOverviewOf(presented), first.groups, first.spec, first.order, (what: string) => violation('7.5', null, what))
    }

    return { verdict: findings.some(finding => finding.severity === 'VIOLATION') ? 'FAIL' : 'PASS', findings, read }
}

/** The overview as presented, from the first block (every block agreeing, Q7.8), with statuses; null where a part it needs is missing. */
export function presentedOf(draft: CoachOverviewDraft): PresentedOverview | null {
    const first = draft.blocks[0]
    const scoring = draft.scoring.blocks.find(entry => entry.blockId === first?.blockId)
    if (!first?.game || !first.parameters || !scoring || !scoring.groups.length || scoring.groups.some(group => group.withheld || !group.sentences.length)) return null
    const pointerOf = (pointer: DetailsPointer) => ({ label: pointer.label, labelStatus: pointer.labelStatus, section: pointer.section, text: pointer.text })
    return {
        purpose: draft.purpose ? { text: draft.purpose.text, wording: 'APPROVED', source: { ...draft.purpose.source } } : null,
        game: { text: first.game.text, wording: 'DRAFT' },
        parameters: { text: first.parameters.text, wording: 'DRAFT' },
        scoring: scoring.groups.map(group => ({
            group: group.group,
            noun: group.noun,
            label: teamHeadingOf(group.noun),
            labelStatus: 'DRAFT' as const,
            sentences: group.sentences.map(sentence => ({
                text: sentence.text,
                wording: sentence.wording,
                source: sentence.source ? { ...sentence.source } : null,
                fullRule: sentence.fullRule ? pointerOf(sentence.fullRule) : null,
                reading: sentence.reading ? { ...sentence.reading } : null,
                place: sentence.place,
            })),
            fullRules: group.fullRules.map(pointerOf),
        })),
    }
}

/**
 * **What the coach is served**: the presented overview's words and pointers, nothing else (no status, source, citation or binding). Since
 * polish pass P1: one group per team, in the presented order (the game sentence's team order, Q7.5), under its heading; its sentences in
 * order (its line saying how the team scores first, Q7.5, then its own qualifications); the pointers of that team no line of it carries,
 * each once; and, after the groups, each pointer every team's group has (where there is more than one team), once. Was (stage 3F): every
 * team's lead line, then all qualifications, then each pointer no line carries.
 */
export function coachOverviewOf(presented: PresentedOverview): CoachOverview {
    const pointerOf = (pointer: OverviewPointer): OverviewPointer => ({ label: pointer.label, section: pointer.section, text: pointer.text })
    const lineOf = (sentence: PresentedOverview['scoring'][number]['sentences'][number]): OverviewLine => ({ text: sentence.text, fullRule: sentence.fullRule ? pointerOf(sentence.fullRule) : null })
    const teams = presented.scoring
    const everyTeams = (pointer: OverviewPointer) => teams.length > 1 && teams.every(group => group.fullRules.some(own => samePointer(own, pointer) && own.label === pointer.label))
    const shared: OverviewPointer[] = []
    for (const pointer of teams.flatMap(group => group.fullRules)) if (everyTeams(pointer) && !shared.some(held => samePointer(held, pointer))) shared.push(pointerOf(pointer))
    const groups: OverviewGroup[] = teams.map(group => {
        const lines = group.sentences.map(lineOf)
        const fullRules: OverviewPointer[] = []
        for (const pointer of group.fullRules) {
            if (shared.some(held => samePointer(held, pointer)) || lines.some(line => line.fullRule && samePointer(line.fullRule, pointer)) || fullRules.some(held => samePointer(held, pointer))) continue
            fullRules.push(pointerOf(pointer))
        }
        return { label: group.label, lines, fullRules }
    })
    return {
        purpose: presented.purpose?.text ?? null,
        game: presented.game.text,
        parameters: presented.parameters.text,
        scoring: { groups, fullRules: shared },
    }
}

/** Reading speeds the evidence is given at (words a minute): a range for an adult reading, not his benchmark. */
const READING_WPM = { fast: 250, slow: 200 } as const

/** **Word count and reading seconds of what the overview says**, beside the served Details' words — EVIDENCE, never a gate. */
export function readingOf(presented: PresentedOverview, details: Instruction[]): OverviewReading {
    const byPart = {
        purpose: presented.purpose ? wordsIn(presented.purpose.text) : 0,
        game: wordsIn(presented.game.text),
        parameters: wordsIn(presented.parameters.text),
        scoring: presented.scoring.reduce((sum, group) => sum + group.sentences.reduce((n, sentence) => n + wordsIn(sentence.text), 0), 0),
    }
    const words = byPart.purpose + byPart.game + byPart.parameters + byPart.scoring
    return {
        words,
        byPart,
        secondsAt250Wpm: Math.round((words / READING_WPM.fast) * 60),
        secondsAt200Wpm: Math.round((words / READING_WPM.slow) * 60),
        detailsWords: details.reduce((sum, instruction) => sum + wordsIn(instruction.text), 0),
        basis: 'Evidence only: the words the overview says (section labels, team headings and pointers not counted) and the seconds they take at two reading speeds. His comprehension benchmark is a usability target, never a gate (reply filed 22 October 2026, item 6 and acceptance criteria); nothing reads this to serve or withhold the overview.',
    }
}

/**
 * The overview's admin evidence, from the draft as checked (`review-evidence.ts` carries it). Stage 3E: each pointer as the draft carries
 * it (label, label status, section, words), the group's own pointers, the table's source and label status, the readings record, and each
 * extract's reading label — the same as `overviewDraft.presented` and `overviewDraft.scoring`, never a narrower copy.
 */
export function overviewEvidenceOf(draft: CoachOverviewDraft): OverviewEvidence {
    const presented = draft.presented
    const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
    const sentences: OverviewEvidence['sentences'] = presented
        ? [
              ...(presented.purpose ? [{ part: 'purpose' as const, group: null, text: presented.purpose.text, wording: presented.purpose.wording, source: copy(presented.purpose.source), fullRule: null, reading: null, place: null }] : []),
              { part: 'game' as const, group: null, text: presented.game.text, wording: presented.game.wording, source: null, fullRule: null, reading: null, place: null },
              { part: 'parameters' as const, group: null, text: presented.parameters.text, wording: presented.parameters.wording, source: null, fullRule: null, reading: null, place: null },
              ...presented.scoring.flatMap(group =>
                  group.sentences.map(sentence => ({
                      part: 'scoring' as const,
                      group: group.group,
                      text: sentence.text,
                      wording: sentence.wording,
                      source: sentence.source ? copy(sentence.source) : null,
                      fullRule: sentence.fullRule ? copy(sentence.fullRule) : null,
                      reading: sentence.reading ? copy(sentence.reading) : null,
                      place: sentence.place,
                  })),
              ),
          ]
        : []
    const table = draft.scoring.table
    // Stage 3F: each team's material elements as the check read the first block, its sentences by their words.
    const firstRead = draft.check?.read[0]
    const firstGroups = draft.scoring.blocks.find(block => block.blockId === firstRead?.blockId)?.groups ?? []
    const meaning: OverviewEvidence['meaning'] = (firstRead?.groups ?? []).map(read => {
        const composed = firstGroups.find(group => group.group === read.group)
        const textOf = (n: number) => composed?.sentences[n]?.text ?? read.sentences[n]?.text ?? ''
        return {
            group: read.group,
            noun: composed?.noun ?? null,
            elements: read.elements.map(element => ({
                ...copy(element),
                statedBy: element.statedBy.map(textOf),
                notStatedBy: element.notStatedBy.map(entry => ({ text: textOf(entry.sentence), why: entry.why })),
            })),
        }
    })
    return {
        served: draft.served,
        verdict: draft.check ? draft.check.verdict : 'NOT_CHECKED',
        findings: draft.check ? draft.check.findings.map(finding => ({ ...finding })) : [],
        table: { source: table.source, status: table.status, label: table.label, labelStatus: table.labelStatus, why: table.why },
        readings: copy(draft.scoring.readings),
        sentences,
        fullRules: presented ? presented.scoring.flatMap(group => group.fullRules.map(pointer => ({ group: group.group, ...copy(pointer) }))) : [],
        reading: draft.reading ? copy(draft.reading) : null,
        meaning,
    }
}

/** What serving the overview gives the build: the coach's overview (or null, withheld), the administrator's draft, and its evidence. */
export interface OverviewOutcome {
    overview: CoachOverview | null
    draft: CoachOverviewDraft
    evidence: OverviewEvidence
}

/**
 * **Compose the overview from the games as built, check it (Q7), and serve it only where it agrees with Details** — stage 3D. The draft is
 * composed per game (`coachOverviewDraftOf`), checked block by block against each game's own render and the served Details, and the coach's
 * overview is the first block's words and pointers where Q7 found no violation and every part is present. Whatever fails — composing,
 * checking, a violation — withholds the overview only: the draft says why, for an administrator, and the activity is untouched.
 * `options` hand a test another table, approved wording, reading, extract generator or Learning Goal row reader.
 */
export function overviewForServing(input: {
    goalId: string | null
    games: { blockId: string; fixture: any; rendered: { instructions: Instruction[] } }[]
    served: Instruction[]
    options?: {
        essentials?: EssentialsLoad
        wording?: ApprovedWording[]
        reading?: CoverReading
        /** Stage 3F (the 3E review's bookkeeping item): a record of readings, read as the reading where no reading is handed in. */
        readings?: ReadingsLoad
        extractsOf?: (game: any) => { extracts: DerivedExtract[]; withheld: WithheldExtract[] }
        lookup?: (id: string) => Record<string, unknown> | undefined
    }
}): OverviewOutcome {
    const options = input.options ?? {}
    const wording = options.wording ?? approvedWording()
    // Stage 3E: the PROPOSED record of what parts of his wording state, for the extracts and the check alike (a test may hand another).
    // Stage 3F: the same reading reads his wording said whole, and the draft's account describes it (`readings`, or the reading's record).
    const reading = options.reading ?? (options.readings ? coverReadingOf(options.readings, wording) : recordedReading())
    const message = (error: unknown) => (error instanceof Error ? error.message : String(error))
    let draft: CoachOverviewDraft
    try {
        draft = coachOverviewDraftOf(input.goalId, input.games, options.extractsOf, { essentials: options.essentials, wording, reading: options.reading, readings: options.readings })
    } catch (error) {
        draft = failedOverviewDraft(message(error))
    }
    let check: OverviewCheck
    try {
        check = checkOverview({
            goalId: input.goalId,
            draft,
            blocks: input.games.map(game => ({ blockId: game.blockId, fixture: game.fixture, rendered: game.rendered.instructions })),
            served: input.served,
            essentials: options.essentials,
            wording,
            reading,
            lookup: options.lookup,
        })
    } catch (error) {
        check = { verdict: 'FAIL', findings: [{ question: '7.0', severity: 'VIOLATION', blockId: null, what: `the agreement check could not be run: ${message(error)}` }], read: [] }
    }
    const presented = presentedOf(draft)
    const served = check.verdict === 'PASS' && presented !== null
    const checked: CoachOverviewDraft = { ...draft, served, check, reading: presented ? readingOf(presented, input.served) : null, presented }
    return { overview: served ? coachOverviewOf(presented!) : null, draft: checked, evidence: overviewEvidenceOf(checked) }
}
